import { useCallback } from 'react';
import { ProjectAsset, EditorType, ScreenMap, TileBank, TileBankDefinition, ComponentDefinition, EntityTemplate, MainMenuConfig, Snippet, HelpDocSection, DataFormat, MSXFont, MSXFontColorAttributes, MSXColorValue, PresentationScreenConfig, PortraitAsset, DialogueAsset } from '../types';
import { DEFAULT_MAIN_MENU_CONFIG, DEFAULT_PRESENTATION_SCREEN_CONFIG, DEFAULT_SCREEN_MODE, MSX1_PALETTE, MSX_SCREEN5_PALETTE } from '../constants';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from '../data/defaults';
import { getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from '../utils/projectUtils';
import { cleanUnusedDefinitions } from '../utils/projectCleanup';
import { addRecentProject, getRecentProjectData, getRecentProjects } from '../utils/recentProjects';
import { buildGlobalVariableAsmName, buildGlobalVariableConstantPrefix, normalizeGlobalVariableName } from '../utils/globalVariablesUtils';
import { resolveBestPortraitTileBankAssetId } from '../utils/portraitPackageUtils';
import {
  filterComponentDefinitionsForProject,
  filterEntityTemplatesForProject,
  isAssetTypeEnabledForProject,
  isEntityTemplateEnabledForProject,
} from '../utils/projectTarget';

interface ProjectHandlersProps {
  assets: ProjectAsset[];
  setAssets: (assets: ProjectAsset[]) => void;
  setAssetsWithHistory: (updater: (prevAssets: ProjectAsset[]) => ProjectAsset[]) => void;
  currentProjectName: string | null;
  setCurrentProjectName: (name: string | null) => void;
  currentScreenMode: string;
  setCurrentScreenMode: (mode: string) => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  currentEditor: EditorType;
  setCurrentEditor: (editor: EditorType) => void;
  setStatusBarMessage: (message: string) => void;
  setSelectedColor: (color: MSXColorValue) => void;
  setConfirmModalProps: (props: any) => void;
  setIsConfirmModalOpen: (open: boolean) => void;
  setIsNewProjectModalOpen: (open: boolean) => void;
  setIsSaveAsModalOpen: (open: boolean) => void;
  tileBanks: TileBank[];
  setTileBanksState: (banks: TileBank[]) => void;
  componentDefinitions: ComponentDefinition[];
  setComponentDefinitionsState: (defs: ComponentDefinition[]) => void;
  entityTemplates: EntityTemplate[];
  setEntityTemplatesState: (templates: EntityTemplate[]) => void;
  mainMenuConfig: MainMenuConfig;
  setMainMenuConfigState: (config: MainMenuConfig) => void;
  presentationScreen: PresentationScreenConfig;
  setPresentationScreenState: (config: PresentationScreenConfig) => void;
  clearAllHistory: () => void;
  setCopiedScreenBuffer: (data: any) => void;
  setCopiedTileData: (data: any) => void;
  setCopiedLayerBuffer: (data: any) => void;
  setSelectedEffectZoneId: (id: string | null) => void;
  setSelectedEntityInstanceId: (id: string | null) => void;
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  dataOutputFormat: DataFormat;
  autosaveEnabled: boolean;
  snippetsEnabled: boolean;
  syntaxHighlightingEnabled: boolean;
  userSnippets: Snippet[];
  helpDocsData: HelpDocSection[];
}

function sanitizeProjectAssetsForTemplateChanges(
  sourceAssets: ProjectAsset[],
  templates: EntityTemplate[]
): ProjectAsset[] {
  const templateComponentIds = new Map<string, Set<string>>();
  templates.forEach(template => {
    templateComponentIds.set(
      template.id,
      new Set((template.components || []).map(comp => comp.definitionId))
    );
  });

  const validStateMachineIds = new Set(
    sourceAssets
      .filter(asset => asset.type === 'statemachine')
      .map(asset => asset.id)
  );

  return sourceAssets.map(asset => {
    if (asset.type !== 'screenmap' || !asset.data) return asset;

    const screenMap = asset.data as ScreenMap;
    const entities = screenMap.layers?.entities;
    if (!Array.isArray(entities)) return asset;

    let screenChanged = false;
    const sanitizedEntities = entities.map(entity => {
      const currentOverrides = entity.componentOverrides || {};
      const allowedComponentIds = templateComponentIds.get(entity.entityTemplateId);
      const nextOverrides: Record<string, any> = {};
      let entityChanged = false;

      if (!allowedComponentIds) {
        if (Object.keys(currentOverrides).length > 0) {
          entityChanged = true;
        }
      } else {
        Object.entries(currentOverrides).forEach(([componentId, overrideValue]) => {
          if (!allowedComponentIds.has(componentId)) {
            entityChanged = true;
            return;
          }

          if (componentId === 'comp_statemachine' && overrideValue && typeof overrideValue === 'object') {
            const smOverride = { ...(overrideValue as Record<string, any>) };
            const stateMachineAssetId = smOverride.stateMachineAssetId;

            if (stateMachineAssetId && !validStateMachineIds.has(String(stateMachineAssetId))) {
              delete smOverride.stateMachineAssetId;
              delete smOverride.currentStateId;
              entityChanged = true;
            }

            if (Object.keys(smOverride).length === 0) {
              entityChanged = true;
              return;
            }

            nextOverrides[componentId] = smOverride;
            return;
          }

          nextOverrides[componentId] = overrideValue;
        });
      }

      if (!entityChanged) {
        entityChanged = JSON.stringify(currentOverrides) !== JSON.stringify(nextOverrides);
      }

      if (!entityChanged) return entity;

      screenChanged = true;
      return { ...entity, componentOverrides: nextOverrides };
    });

    if (!screenChanged) return asset;

    return {
      ...asset,
      data: {
        ...screenMap,
        layers: {
          ...screenMap.layers,
          entities: sanitizedEntities
        }
      }
    };
  });
}

function migrateBuiltInComponentDefinition(component: ComponentDefinition): ComponentDefinition {
  const defaultComponent = DEFAULT_COMPONENT_DEFINITIONS.find(def => def.id === component.id);
  if (!defaultComponent) return component;

  const projectProperties = new Map(
    (component.properties || []).map(property => [property.name, property])
  );

  const mergedProperties = defaultComponent.properties.map(defaultProperty => {
    const existingProperty = projectProperties.get(defaultProperty.name);
    return existingProperty
      ? {
          ...existingProperty,
          ...defaultProperty,
          defaultValue: existingProperty.defaultValue ?? defaultProperty.defaultValue,
        }
      : { ...defaultProperty };
  });

  (component.properties || []).forEach(property => {
    if (!defaultComponent.properties.some(defaultProperty => defaultProperty.name === property.name)) {
      mergedProperties.push({ ...property });
    }
  });

  return {
    ...defaultComponent,
    ...component,
    properties: mergedProperties,
  };
}

function migrateProjectComponentDefinitions(projectComponents?: ComponentDefinition[]): ComponentDefinition[] {
  if (!Array.isArray(projectComponents) || projectComponents.length === 0) {
    return DEFAULT_COMPONENT_DEFINITIONS;
  }

  const projectComponentsMap = new Map(
    projectComponents.map(component => [component.id, migrateBuiltInComponentDefinition(component)])
  );

  const mergedComponents = DEFAULT_COMPONENT_DEFINITIONS.map(defaultComponent =>
    projectComponentsMap.get(defaultComponent.id) || defaultComponent
  );

  projectComponents.forEach(component => {
    if (!DEFAULT_COMPONENT_DEFINITIONS.find(defaultComponent => defaultComponent.id === component.id)) {
      mergedComponents.push(component);
    }
  });

  return mergedComponents;
}

function normalizeLoadedCustomGlobalVariables(customVariables: any[]): { variables: any[]; warnings: string[] } {
  if (!Array.isArray(customVariables)) {
    return { variables: [], warnings: [] };
  }

  const warnings: string[] = [];
  const variablesByName = new Map<string, any>();
  const asmNamesInUse = new Map<string, string>();

  customVariables.forEach(variable => {
    const originalName = typeof variable?.name === 'string' ? variable.name.trim() : '';
    const normalizedName = normalizeGlobalVariableName(originalName);
    if (!normalizedName) return;

    const normalizedAsmName = buildGlobalVariableAsmName(normalizedName);
    const normalizedConstantPrefix = variable?.constantPrefix || buildGlobalVariableConstantPrefix(normalizedName);

    if (originalName && originalName !== normalizedName) {
      warnings.push(`Se normalizo la variable "${originalName}" como "${normalizedName}".`);
    }

    if (variablesByName.has(normalizedName)) {
      warnings.push(`Variable duplicada ignorada al cargar: "${originalName || normalizedName}".`);
      return;
    }

    const existingAsmOwner = asmNamesInUse.get(normalizedAsmName.toLowerCase());
    if (existingAsmOwner) {
      warnings.push(`Variable ignorada por simbolo ASM duplicado: "${originalName || normalizedName}" usa ${normalizedAsmName}, ya reservado por "${existingAsmOwner}".`);
      return;
    }

    variablesByName.set(normalizedName, {
      ...variable,
      name: normalizedName,
      asmName: normalizedAsmName,
      constantPrefix: normalizedConstantPrefix,
    });
    asmNamesInUse.set(normalizedAsmName.toLowerCase(), normalizedName);
  });

  return {
    variables: Array.from(variablesByName.values()),
    warnings,
  };
}

function mergePresentationScreenConfig(rawConfig: any): PresentationScreenConfig {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_PRESENTATION_SCREEN_CONFIG));
  }

  return {
    ...DEFAULT_PRESENTATION_SCREEN_CONFIG,
    ...rawConfig,
    conversion: {
      ...DEFAULT_PRESENTATION_SCREEN_CONFIG.conversion,
      ...(rawConfig.conversion || {}),
    },
    preview: {
      ...DEFAULT_PRESENTATION_SCREEN_CONFIG.preview,
      ...(rawConfig.preview || {}),
    },
    data: {
      ...DEFAULT_PRESENTATION_SCREEN_CONFIG.data,
      ...(rawConfig.data || {}),
    },
    compression: {
      ...DEFAULT_PRESENTATION_SCREEN_CONFIG.compression,
      ...(rawConfig.compression || {}),
    },
    runtime: {
      ...DEFAULT_PRESENTATION_SCREEN_CONFIG.runtime,
      ...(rawConfig.runtime || {}),
    },
  };
}

function repairPortraitTileBankLinks(sourceAssets: ProjectAsset[]): ProjectAsset[] {
  const portraitTileBankById = new Map<string, string>();

  const assetsWithPortraits = sourceAssets.map(asset => {
    if (asset.type !== 'portrait' || !asset.data) return asset;

    const portrait = asset.data as PortraitAsset;
    const bestTileBankAssetId = resolveBestPortraitTileBankAssetId(portrait, sourceAssets);
    if (!bestTileBankAssetId || bestTileBankAssetId === portrait.tileBankAssetId) {
      if (portrait.tileBankAssetId) portraitTileBankById.set(asset.id, portrait.tileBankAssetId);
      return asset;
    }

    portraitTileBankById.set(asset.id, bestTileBankAssetId);
    return {
      ...asset,
      data: {
        ...portrait,
        tileBankAssetId: bestTileBankAssetId,
      },
    };
  });

  if (portraitTileBankById.size === 0) return assetsWithPortraits;

  const repairGraphic = (graphic: any) => {
    if (!graphic?.portraitAssetId) return graphic;
    const portraitTileBankAssetId = portraitTileBankById.get(graphic.portraitAssetId);
    if (!portraitTileBankAssetId || graphic.tileBankAssetId === portraitTileBankAssetId) return graphic;
    return { ...graphic, tileBankAssetId: portraitTileBankAssetId };
  };

  return assetsWithPortraits.map(asset => {
    if (asset.type !== 'dialogue' || !asset.data) return asset;
    const dialogue = asset.data as DialogueAsset;
    const repairedBoxGraphic = repairGraphic(dialogue.box?.graphic);
    const repairedLines = (dialogue.lines || []).map(line => {
      const repairedLineGraphic = repairGraphic(line.graphic);
      return repairedLineGraphic === line.graphic ? line : { ...line, graphic: repairedLineGraphic };
    });

    if (repairedBoxGraphic === dialogue.box?.graphic && repairedLines.every((line, index) => line === dialogue.lines[index])) {
      return asset;
    }

    return {
      ...asset,
      data: {
        ...dialogue,
        lines: repairedLines,
        box: {
          ...dialogue.box,
          graphic: repairedBoxGraphic,
        },
      },
    };
  });
}

function trySetLocalStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

export const useProjectHandlers = ({
  assets,
  setAssets,
  setAssetsWithHistory,
  currentProjectName,
  setCurrentProjectName,
  currentScreenMode,
  setCurrentScreenMode,
  selectedAssetId,
  setSelectedAssetId,
  currentEditor,
  setCurrentEditor,
  setStatusBarMessage,
  setSelectedColor,
  setConfirmModalProps,
  setIsConfirmModalOpen,
  setIsNewProjectModalOpen,
  setIsSaveAsModalOpen,
  tileBanks,
  setTileBanksState,
  componentDefinitions,
  setComponentDefinitionsState,
  entityTemplates,
  setEntityTemplatesState,
  mainMenuConfig,
  setMainMenuConfigState,
  presentationScreen,
  setPresentationScreenState,
  clearAllHistory,
  setCopiedScreenBuffer,
  setCopiedTileData,
  setCopiedLayerBuffer,
  setSelectedEffectZoneId,
  setSelectedEntityInstanceId,
  msxFont,
  msxFontColorAttributes,
  dataOutputFormat,
  autosaveEnabled,
  snippetsEnabled,
  syntaxHighlightingEnabled,
  userSnippets,
  helpDocsData
}: ProjectHandlersProps) => {

  const applyScreenModeDefaults = useCallback((mode: string) => {
    setCurrentScreenMode(mode);
    if (mode === 'SCREEN 2 (Graphics I)') {
      setSelectedColor(MSX1_PALETTE[15].hex);
    } else {
      setSelectedColor(MSX_SCREEN5_PALETTE[1].hex);
    }
  }, [setCurrentScreenMode, setSelectedColor]);

  const handleOpenNewProjectModal = () => setIsNewProjectModalOpen(true);

  const handleConfirmNewProject = (projectNameFromModal: string, selectedMode: string) => {
    setConfirmModalProps({
      title: "Create New Project?",
      message: (
        <>
          <p>Are you sure you want to create a new project named "{projectNameFromModal}"?</p>
          <p className="text-msx-textsecondary mt-2">
            Target screen mode: <strong>{selectedMode}</strong> (cannot be changed later).
          </p>
          <p className="text-msx-warning mt-2">This will clear all current unsaved assets and history.</p>
        </>
      ),
      onConfirm: () => {
        setAssets([]);
        setSelectedAssetId(null);
        setCurrentProjectName(projectNameFromModal);
        setCurrentEditor(EditorType.None);
        const newProjectScreenMode = selectedMode || DEFAULT_SCREEN_MODE;
        applyScreenModeDefaults(newProjectScreenMode);
        setTileBanksState([]);
        trySetLocalStorageItem('tileBanksConfig', JSON.stringify([]));
        setComponentDefinitionsState(filterComponentDefinitionsForProject(DEFAULT_COMPONENT_DEFINITIONS, newProjectScreenMode));
        setEntityTemplatesState(filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, newProjectScreenMode));
        setMainMenuConfigState(DEFAULT_MAIN_MENU_CONFIG);
        setPresentationScreenState(DEFAULT_PRESENTATION_SCREEN_CONFIG);
        clearAllHistory();
        setCopiedScreenBuffer(null);
        setCopiedTileData(null);
        setCopiedLayerBuffer(null);
        setSelectedEffectZoneId(null);

        const newProjectFiles = ["main.asm", "data/graphics.asm", "data/components.asm", "code/behaviors.asm"];
        const formattedDate = getFormattedDate();
        const createdAssets: ProjectAsset[] = [];

        newProjectFiles.forEach(filename => {
          const fileContent = filename === "main.asm"
            ? generateMainAsmContent(projectNameFromModal, formattedDate)
            : generateAsmFileHeader(projectNameFromModal, formattedDate, filename);
          const assetId = `code_new_${projectNameFromModal.replace(/\s+/g, '_')}_${filename.replace('.asm', '').replace(/\//g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const newAsset: ProjectAsset = {
            id: assetId,
            name: filename,
            type: 'code',
            data: fileContent
          };
          createdAssets.push(newAsset);
        });

        setAssets(createdAssets);
        setSelectedAssetId(null);
        setCurrentEditor(EditorType.None);
        setStatusBarMessage(`Project "${projectNameFromModal}" created in ${selectedMode}.`);
        setIsNewProjectModalOpen(false);
        setIsConfirmModalOpen(false);
      },
      confirmText: "Create New",
      confirmButtonVariant: 'danger'
    });
    setIsConfirmModalOpen(true);
  };

  const handleOpenSaveAsModal = () => {
    setIsSaveAsModalOpen(true);
  };

  const handleSaveProject = useCallback((filenameToSave?: string, isManualSaveOperation: boolean = true) => {
    let effectiveFilename = filenameToSave;
    if (!effectiveFilename) {
      if (currentProjectName) {
        // Auto-increment project name logic
        // Regex to find trailing numbers
        const match = currentProjectName.match(/^(.*?)(\d+)$/);
        let newProjectName = currentProjectName;

        if (match) {
          // If it has a number at the end, increment it
          const namePart = match[1];
          const numberPart = match[2];
          const nextNumber = parseInt(numberPart, 10) + 1;
          newProjectName = `${namePart}${nextNumber}`;
        } else {
          // If no number at the end, append "1"
          newProjectName = `${currentProjectName}1`;
        }

        // Update the project name state
        setCurrentProjectName(newProjectName);
        effectiveFilename = `${newProjectName}.json`;
      } else {
        handleOpenSaveAsModal();
        return;
      }
    }

    // Clean unused componentDefinitions and entityTemplates before saving
    const { componentDefinitions: cleanedComponents, entityTemplates: cleanedTemplates, stats } = cleanUnusedDefinitions({
      assets,
      componentDefinitions,
      entityTemplates,
      currentScreenMode,
    });

    // Log cleanup stats
    if (stats.componentsRemoved > 0 || stats.templatesRemoved > 0) {
      console.log(`🧹 Cleanup: Removed ${stats.componentsRemoved} unused components, ${stats.templatesRemoved} unused templates`);
    }

    // Normalize project data before saving (migrations)
    const normalizeCondition = (cond: any): any => {
      if (!cond) return cond;
      const copy: any = { ...cond };
      if (copy.params) {
        const p: any = { ...copy.params };
        // Remove deprecated filters
        if ('templateId' in p) delete p.templateId;
        if ('templateName' in p) delete p.templateName;
        copy.params = p;
      }
      if (Array.isArray(copy.conditions)) copy.conditions = copy.conditions.map(normalizeCondition);
      return copy;
    };

    const normalizeActions = (actions?: any[]) =>
      (actions || []).map(a => {
        const p: any = { ...(a?.params || {}) };
        // Unify variable key
        if (p.variable === undefined) {
          if (p.variableName !== undefined) p.variable = p.variableName;
          else if (p.name !== undefined) p.variable = p.name;
        }
        delete p.variableName;
        // Do not delete generic 'name' because some actions may use it for other purposes,
        // but for our known variable actions we will clean it when saving transitions below.
        const result = { ...a, params: p };
        return result;
      });

    const assetsNormalized = assets.map(asset => {
      if (asset.type === 'statemachine' && asset.data) {
        const sm: any = asset.data as any;
        const normalizedTransitions = (sm.transitions || []).map((t: any) => {
          const normActions = normalizeActions(t.actions).map((act: any) => {
            if (act && (act.type === 'SET_VARIABLE' || act.type === 'INCREMENT_VARIABLE' || act.type === 'DECREMENT_VARIABLE')) {
              const pp: any = { ...act.params };
              if (pp.variable === undefined) {
                if (pp.variableName !== undefined) pp.variable = pp.variableName;
                else if (pp.name !== undefined) pp.variable = pp.name;
              }
              delete pp.variableName;
              delete pp.name; // safe here for variable actions
              return { ...act, params: pp };
            }
            return act;
          });
          return {
            ...t,
            conditions: normalizeCondition(t.conditions),
            actions: normActions,
          };
        });
        return { ...asset, data: { ...sm, transitions: normalizedTransitions } };
      }
      return asset;
    });

    const sanitizedAssets = sanitizeProjectAssetsForTemplateChanges(assetsNormalized, cleanedTemplates);

    const projectData = {
      assets: sanitizedAssets,
      currentScreenMode,
      selectedAssetId,
      currentEditor,
      tileBanks,
      msxFont,
      msxFontColorAttributes,
      ideConfiguration: { dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled },
      userSnippets,
      helpDocsData,
      currentProjectName,
      componentDefinitions: cleanedComponents,
      entityTemplates: cleanedTemplates,
      mainMenuConfig,
      presentationScreen,
      selectedEntityInstanceId: null,
      selectedEffectZoneId: null,
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = effectiveFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const projectNameForRecent = projectData.currentProjectName || effectiveFilename.replace(/\.json$/i, '');
    addRecentProject(projectNameForRecent, effectiveFilename, dataStr);

    if (isManualSaveOperation && !effectiveFilename.includes('autosave')) {
      setStatusBarMessage(`Project saved as "${effectiveFilename}".`);
    }
  }, [
    assets, currentScreenMode, selectedAssetId, currentEditor, tileBanks,
    msxFont, msxFontColorAttributes, dataOutputFormat, autosaveEnabled,
    snippetsEnabled, syntaxHighlightingEnabled, userSnippets, helpDocsData,
    currentProjectName, componentDefinitions, entityTemplates, mainMenuConfig, presentationScreen,
    setStatusBarMessage
  ]);

  const handleConfirmSaveAsProjectAs = (filenameFromModal: string) => {
    const finalFilename = filenameFromModal.endsWith('.json') ? filenameFromModal : `${filenameFromModal}.json`;
    const projectNameWithoutExtension = finalFilename.replace('.json', '');
    setCurrentProjectName(projectNameWithoutExtension);
    handleSaveProject(finalFilename);
    setIsSaveAsModalOpen(false);
  };

  const loadProjectFromParsedData = useCallback((projectData: any, { projectName, sourcePath }: { projectName: string; sourcePath?: string; rawContent?: string; }) => {
    try {
      clearAllHistory();
      setCopiedScreenBuffer(null);
      setCopiedTileData(null);
      setCopiedLayerBuffer(null);
      setSelectedEffectZoneId(null);
      setSelectedEntityInstanceId(null);

      let loadedAssets: ProjectAsset[] = [];
      const loadWarnings: string[] = [];
      const migratedComponentDefinitions = migrateProjectComponentDefinitions(projectData.componentDefinitions);
      const migratedComponentMap = new Map(
        migratedComponentDefinitions.map(component => [component.id, component])
      );

      if (projectData.assets) {
        const normalizeCondition = (cond: any): any => {
          if (!cond) return cond;
          const copy: any = { ...cond };
          if (copy.params) {
            const p: any = { ...copy.params };
            if ('templateId' in p) delete p.templateId;
            if ('templateName' in p) delete p.templateName;
            copy.params = p;
          }
          if (Array.isArray(copy.conditions)) copy.conditions = copy.conditions.map(normalizeCondition);
          return copy;
        };

        const normalizeActions = (actions?: any[]) =>
          (actions || []).map(a => {
            const p: any = { ...(a?.params || {}) };
            if (p.variable === undefined) {
              if (p.variableName !== undefined) p.variable = p.variableName;
              else if (p.name !== undefined) p.variable = p.name;
            }
            delete p.variableName;
            return { ...a, params: p };
          });

        const normalizeMsx2Layer = (layer: number[][] | undefined, fallback?: number[][]): number[][] =>
          Array.from({ length: 12 }, (_, y) =>
            Array.from({ length: 16 }, (_, x) => Math.max(0, Math.min(255, Number(layer?.[y]?.[x] ?? fallback?.[y]?.[x] ?? 0) || 0)))
          );

        loadedAssets = projectData.assets.map((asset: ProjectAsset) => {
          if (asset.type === 'screenmap' && asset.data) {
            const screenMap = asset.data as ScreenMap;
            const screenKind = screenMap.screenKind ?? 'playable';
            const screenEngine = screenMap.screenEngine ?? (screenKind === 'playable' ? 'player' : 'fakePlayer');
            if (!screenMap.effectZones || !screenMap.screenKind || !screenMap.screenEngine) {
              return {
                ...asset,
                data: {
                  ...screenMap,
                  screenKind,
                  screenEngine,
                  effectZones: screenMap.effectZones || [],
                },
              };
            }
          }
          if (asset.type === 'msx2screen' && asset.data) {
            const screen = asset.data as any;
            const requiredCollectibles = Number(screen.runtime?.requiredCollectibles);
            const initialAir = Number(screen.runtime?.initialAir);
            const layers = {
              collision: normalizeMsx2Layer(screen.layers?.collision, screen.collisionMap),
              effects: normalizeMsx2Layer(screen.layers?.effects),
              behavior: normalizeMsx2Layer(screen.layers?.behavior),
              entities: Array.isArray(screen.layers?.entities) ? screen.layers.entities : [],
            };
            return {
              ...asset,
              data: {
                ...screen,
                layers,
                runtime: {
                  screenKind: screen.runtime?.screenKind || 'playable',
                  screenEngine: screen.runtime?.screenEngine || 'player',
                  ...(Number.isFinite(requiredCollectibles)
                    ? { requiredCollectibles: Math.max(0, Math.min(255, Math.floor(requiredCollectibles))) }
                    : {}),
                  ...(Number.isFinite(initialAir)
                    ? { initialAir: Math.max(1, Math.min(255, Math.floor(initialAir))) }
                    : {}),
                  activeAreaX: Number.isFinite(Number(screen.runtime?.activeAreaX)) ? Number(screen.runtime.activeAreaX) : 0,
                  activeAreaY: Number.isFinite(Number(screen.runtime?.activeAreaY)) ? Number(screen.runtime.activeAreaY) : 0,
                  activeAreaWidth: Number.isFinite(Number(screen.runtime?.activeAreaWidth)) ? Number(screen.runtime.activeAreaWidth) : 16,
                  activeAreaHeight: Number.isFinite(Number(screen.runtime?.activeAreaHeight)) ? Number(screen.runtime.activeAreaHeight) : 12,
                },
                collisionMap: layers.collision,
              },
            };
          }
          if (asset.type === 'globalvariables' && asset.data) {
            const data = asset.data as any;
            const normalization = normalizeLoadedCustomGlobalVariables(data.customVariables || []);
            if (normalization.warnings.length > 0) {
              loadWarnings.push(...normalization.warnings);
            }
            return {
              ...asset,
              data: {
                ...data,
                customVariables: normalization.variables,
              },
            };
          }
          if (asset.type === 'componentdefinition' && asset.data) {
            const component = asset.data as ComponentDefinition;
            return {
              ...asset,
              data: migratedComponentMap.get(component.id) || migrateBuiltInComponentDefinition(component),
            };
          }
          if (asset.type === 'statemachine' && asset.data) {
            const sm: any = asset.data as any;
            const normalizedTransitions = (sm.transitions || []).map((t: any) => ({
              ...t,
              conditions: normalizeCondition(t.conditions),
              actions: normalizeActions(t.actions).map((act: any) => {
                if (act && (act.type === 'SET_VARIABLE' || act.type === 'INCREMENT_VARIABLE' || act.type === 'DECREMENT_VARIABLE')) {
                  const pp: any = { ...act.params };
                  delete pp.name;
                  return { ...act, params: pp };
                }
                return act;
              })
            }));
            return { ...asset, data: { ...sm, transitions: normalizedTransitions } };
          }
          return asset;
        });
        loadedAssets = repairPortraitTileBankLinks(loadedAssets);
      }

      const loadedMode = projectData.currentScreenMode || DEFAULT_SCREEN_MODE;
      applyScreenModeDefaults(loadedMode);
      const selectedAsset = loadedAssets.find(asset => asset.id === projectData.selectedAssetId);
      if (selectedAsset && isAssetTypeEnabledForProject(selectedAsset.type, loadedMode)) {
        setSelectedAssetId(projectData.selectedAssetId);
        if (projectData.currentEditor) setCurrentEditor(projectData.currentEditor);
      } else {
        setSelectedAssetId(null);
        setCurrentEditor(EditorType.None);
      }

      if (projectData.assets) {
        const tileBankAssets = projectData.assets.filter((asset: ProjectAsset) => asset.type === 'tilebank');
        const ensuredTileBanks = tileBankAssets
          .map(asset => asset.data as TileBank)
          .filter(tileBankData => Array.isArray(tileBankData?.banks))
          .map(tileBankData => ({
            ...tileBankData,
            banks: tileBankData.banks.map((bank: TileBankDefinition) => ({
              ...bank,
              logicalTilesEnabled: (bank as any).logicalTilesEnabled ?? false,
              logicalTileTypes: (bank as any).logicalTileTypes ?? []
            }))
          }));
        setTileBanksState(ensuredTileBanks);
        if (!trySetLocalStorageItem('tileBanksConfig', JSON.stringify(ensuredTileBanks))) {
          loadWarnings.push('No se pudo actualizar la cache local de Tile Banks; el proyecto se cargo igualmente.');
        }
      } else if (projectData.tileBanks) {
        setTileBanksState(projectData.tileBanks);
        if (!trySetLocalStorageItem('tileBanksConfig', JSON.stringify(projectData.tileBanks))) {
          loadWarnings.push('No se pudo actualizar la cache local de Tile Banks; el proyecto se cargo igualmente.');
        }
      }

      setComponentDefinitionsState(filterComponentDefinitionsForProject(migratedComponentDefinitions, loadedMode));

      let templatesForSanitization: EntityTemplate[] = filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, loadedMode);
      if (projectData.entityTemplates) {
        const cleanedEntityTemplates = projectData.entityTemplates.map((template: EntityTemplate) => {
          const cleanedComponents = template.components.map(comp => {
            const componentDef = migratedComponentDefinitions.find((cd: ComponentDefinition) => cd.id === comp.definitionId);
            if (!componentDef) return comp;

            const cleanedDefaultValues: Record<string, any> = {};
            Object.entries(comp.defaultValues || {}).forEach(([key, value]) => {
              const propertyDef = componentDef.properties.find(p => p.name === key);
              const definitionDefault = propertyDef?.defaultValue;

              const normalizedValue = String(value);
              const normalizedDefault = String(definitionDefault);

              if (normalizedValue !== normalizedDefault) {
                cleanedDefaultValues[key] = value;
              }
            });

            return { ...comp, defaultValues: cleanedDefaultValues };
          });

          return { ...template, components: cleanedComponents };
        }).filter((template: EntityTemplate) => isEntityTemplateEnabledForProject(template, loadedMode));

        setEntityTemplatesState(cleanedEntityTemplates);
        templatesForSanitization = cleanedEntityTemplates;
      } else {
        setEntityTemplatesState(filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, loadedMode));
      }

      if (loadedAssets.length > 0) {
        const sanitizedLoadedAssets = sanitizeProjectAssetsForTemplateChanges(loadedAssets, templatesForSanitization);
        setAssetsWithHistory(() => sanitizedLoadedAssets);
      }

      if (projectData.mainMenuConfig) setMainMenuConfigState(projectData.mainMenuConfig);
      const mergedPS = mergePresentationScreenConfig(projectData.presentationScreen);
      setPresentationScreenState(mergedPS);

      // Migrate old top-level presentationScreen to an asset if it has data and no asset exists yet
      const hasLegacyPS = mergedPS.enabled || !!mergedPS.sourceFileName;
      const hasPSAsset = loadedAssets.some(a => a.type === 'presentationscreen');
      if (hasLegacyPS && !hasPSAsset) {
        const migratedAsset: ProjectAsset = {
          id: `presentationscreen_${Date.now()}`,
          name: mergedPS.name || 'Presentation Screen',
          type: 'presentationscreen',
          data: mergedPS,
        };
        loadedAssets = [...loadedAssets, migratedAsset];
        setAssetsWithHistory(() => loadedAssets);
        loadWarnings.push('Presentation Screen migrada al sistema de assets.');
      }

      const finalProjectName = projectName || projectData.currentProjectName || 'msx_ide_project';
      setCurrentProjectName(finalProjectName);

      const cachedProjectData = {
        ...projectData,
        currentProjectName: finalProjectName,
        assets: loadedAssets.length > 0 ? loadedAssets : projectData.assets,
        componentDefinitions: migratedComponentDefinitions,
        entityTemplates: templatesForSanitization,
      };
      const cachedData = JSON.stringify(cachedProjectData);
      addRecentProject(finalProjectName, sourcePath || finalProjectName, cachedData);

      setStatusBarMessage(`Project "${finalProjectName}" loaded successfully.`);
      if (loadWarnings.length > 0) {
        const summary = loadWarnings.length > 4
          ? `${loadWarnings.slice(0, 4).join(' ')} Se aplicaron ${loadWarnings.length} ajustes en total.`
          : loadWarnings.join(' ');

        setConfirmModalProps({
          title: 'Validacion de Variables Globales',
          message: summary,
          onConfirm: () => setIsConfirmModalOpen(false),
          onCancel: () => setIsConfirmModalOpen(false),
          confirmText: 'OK',
          cancelText: 'Cerrar',
          confirmButtonVariant: 'secondary'
        });
        setIsConfirmModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setStatusBarMessage('Error loading project file. Please check the file format.');
    }
  }, [
    applyScreenModeDefaults,
    clearAllHistory,
    setAssetsWithHistory,
    setComponentDefinitionsState,
    setCurrentEditor,
    setCurrentProjectName,
    setCopiedLayerBuffer,
    setCopiedScreenBuffer,
    setCopiedTileData,
    setEntityTemplatesState,
    setMainMenuConfigState,
    setPresentationScreenState,
    setSelectedAssetId,
    setSelectedEffectZoneId,
    setSelectedEntityInstanceId,
    setConfirmModalProps,
    setIsConfirmModalOpen,
    setStatusBarMessage,
    setTileBanksState
  ]);

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawContent = e.target?.result as string;
      try {
        const projectData = JSON.parse(rawContent);
        const sourcePath = (file as any).path || file.name || file.webkitRelativePath || 'project.json';
        const projectNameFromFile = file.name.replace(/\.json$/i, '');
        loadProjectFromParsedData(projectData, { projectName: projectNameFromFile, sourcePath, rawContent });
      } catch (error) {
        console.error('Error loading project:', error);
        setStatusBarMessage('Error loading project file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleLoadProjectFromRawContent = useCallback((rawContent: string, options?: { projectName?: string; sourcePath?: string }) => {
    try {
      const projectData = JSON.parse(rawContent);
      const sourcePath = options?.sourcePath || options?.projectName || 'project.json';
      const projectName = options?.projectName
        || sourcePath.split(/[\\/]/).pop()?.replace(/\.json$/i, '')
        || projectData.currentProjectName
        || 'msx_ide_project';

      loadProjectFromParsedData(projectData, { projectName, sourcePath, rawContent });
    } catch (error) {
      console.error('Error loading project:', error);
      setStatusBarMessage('Error loading project file. Please check the file format.');
    }
  }, [loadProjectFromParsedData, setStatusBarMessage]);

  const handleOpenRecentProject = (path: string) => {
    const cachedData = getRecentProjectData(path);
    if (!cachedData) {
      setStatusBarMessage('No cached data found for this recent entry. Please use Load Project instead.');
      alert('No cached data found for this recent entry. Please use Load Project instead.');
      return;
    }

    try {
      const projectData = JSON.parse(cachedData);
      const recentEntry = getRecentProjects().find(p => p.path === path);
      const projectName = recentEntry?.name || projectData.currentProjectName || path.replace(/\.json$/i, '');
      loadProjectFromParsedData(projectData, { projectName, sourcePath: path, rawContent: cachedData });
    } catch (error) {
      console.error('Error loading cached recent project:', error);
      setStatusBarMessage('Error loading cached recent project.');
    }
  };

  return {
    handleOpenNewProjectModal,
    handleConfirmNewProject,
    handleOpenSaveAsModal,
    handleSaveProject,
    handleConfirmSaveAsProjectAs,
    handleLoadProject,
    handleLoadProjectFromRawContent,
    handleOpenRecentProject
  };
};
