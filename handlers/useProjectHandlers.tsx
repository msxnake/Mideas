import { useCallback } from 'react';
import { ProjectAsset, EditorType, ScreenMap, TileBank, TileBankDefinition, ComponentDefinition, EntityTemplate, MainMenuConfig, Snippet, HelpDocSection, DataFormat, MSXFont, MSXFontColorAttributes, MSXColorValue, PresentationScreenConfig, PortraitAsset, DialogueAsset, Msx2GameProfileId, Msx2ProjectProfile } from '../types';
import { DEFAULT_MAIN_MENU_CONFIG, DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG, DEFAULT_PRESENTATION_SCREEN_CONFIG, DEFAULT_SCREEN_MODE, MSX1_PALETTE, MSX_SCREEN5_PALETTE } from '../constants';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from '../data/defaults';
import { getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from '../utils/projectUtils';
import { cleanUnusedDefinitions } from '../utils/projectCleanup';
import { addRecentProject, getRecentProjectData, getRecentProjects } from '../utils/recentProjects';
import { buildGlobalVariableAsmName, buildGlobalVariableConstantPrefix, normalizeGlobalVariableName } from '../utils/globalVariablesUtils';
import { resolveBestPortraitTileBankAssetId } from '../utils/portraitPackageUtils';
import {
  packScreen5PresentationPixels,
  normalizeScreen5PresentationPixels,
  unpackScreen5PresentationPixels,
} from '../components/utils/msx2Screen5PresentationUtils';
import {
  filterComponentDefinitionsForProject,
  filterEntityTemplatesForProject,
  isAssetTypeEnabledForProject,
  isEntityTemplateEnabledForProject,
  isScreen4Project,
} from '../utils/projectTarget';
import {
  buildMsx2ProjectProfile,
  buildStarterMsx2BitmapRoomAsset,
  buildStarterMsx2GameFlowAsset,
  buildStarterMsx2ScreenAsset,
  normalizeMsx2ProjectProfile,
  usesMsx2BitmapRoomStarter,
} from '../utils/msx2ProjectProfiles';
import { createDefaultMsx2PlayerDefinition } from '../utils/msx2PlayerDefaults';
import { buildDetailedMsx2PlayerDocument } from '../utils/msx2PlayerDocument';

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
  pendingMsx2NewProject: { projectName: string; screenMode: string } | null;
  setPendingMsx2NewProject: (value: { projectName: string; screenMode: string } | null) => void;
  msx2ProjectProfile: Msx2ProjectProfile | null;
  setMsx2ProjectProfile: (profile: Msx2ProjectProfile | null) => void;
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
  pendingMsx2NewProject,
  setPendingMsx2NewProject,
  msx2ProjectProfile,
  setMsx2ProjectProfile,
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

  const finalizeNewProject = useCallback((
    projectNameFromModal: string,
    selectedMode: string,
    profile: Msx2ProjectProfile | null = null
  ) => {
    setAssets([]);
    setSelectedAssetId(null);
    setCurrentProjectName(projectNameFromModal);
    setCurrentEditor(EditorType.None);
    const newProjectScreenMode = selectedMode || DEFAULT_SCREEN_MODE;
    applyScreenModeDefaults(newProjectScreenMode);
    setMsx2ProjectProfile(isScreen4Project(newProjectScreenMode) ? profile : null);
    setTileBanksState([]);
    trySetLocalStorageItem('tileBanksConfig', JSON.stringify([]));
    setComponentDefinitionsState(filterComponentDefinitionsForProject(DEFAULT_COMPONENT_DEFINITIONS, newProjectScreenMode, profile));
    setEntityTemplatesState(filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, newProjectScreenMode, profile));
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

    if (profile) {
      const starterPlayer = buildDetailedMsx2PlayerDocument(createDefaultMsx2PlayerDefinition(`player_${profile.profileId}_${Date.now()}`, profile.profileId));
      createdAssets.push({
        id: starterPlayer.compact.id,
        name: starterPlayer.player.identity.name,
        type: 'msx2player',
        data: starterPlayer,
      });
      if (usesMsx2BitmapRoomStarter(profile)) {
        const starterRoom = buildStarterMsx2BitmapRoomAsset(profile, projectNameFromModal);
        createdAssets.push({
          id: starterRoom.id,
          name: starterRoom.name,
          type: 'msx2bitmaproom',
          data: starterRoom,
        });
        createdAssets.push({
          id: `asset_${profile.profileId}_gameflow_${Date.now()}`,
          name: 'Main MSX2',
          type: 'msx2gameflow',
          data: buildStarterMsx2GameFlowAsset(
            profile,
            starterRoom.id,
            projectNameFromModal,
            'screen4-bitmap-runtime'
          ),
        });
      } else {
        const starterScreen = buildStarterMsx2ScreenAsset(profile, projectNameFromModal);
        createdAssets.push({
          id: starterScreen.id,
          name: starterScreen.name,
          type: 'msx2screen',
          data: starterScreen,
        });
        createdAssets.push({
          id: `asset_${profile.profileId}_gameflow_${Date.now()}`,
          name: 'Main MSX2',
          type: 'msx2gameflow',
          data: buildStarterMsx2GameFlowAsset(profile, starterScreen.id, projectNameFromModal),
        });
      }
    }

    const starterAssetType = profile && usesMsx2BitmapRoomStarter(profile) ? 'msx2bitmaproom' : 'msx2screen';
    setAssets(createdAssets);
    setSelectedAssetId(profile ? createdAssets.find(asset => asset.type === starterAssetType)?.id || null : null);
    setCurrentEditor(profile
      ? (starterAssetType === 'msx2bitmaproom' ? EditorType.Msx2BitmapRoom : EditorType.Msx2Screen)
      : EditorType.None);
    const profileLabel = profile ? ` (${profile.label})` : '';
    setStatusBarMessage(`Project "${projectNameFromModal}" created in ${selectedMode}${profileLabel}.`);
    setIsNewProjectModalOpen(false);
    setPendingMsx2NewProject(null);
    setIsConfirmModalOpen(false);
  }, [
    applyScreenModeDefaults,
    clearAllHistory,
    setAssets,
    setComponentDefinitionsState,
    setCopiedLayerBuffer,
    setCopiedScreenBuffer,
    setCopiedTileData,
    setCurrentEditor,
    setCurrentProjectName,
    setEntityTemplatesState,
    setIsConfirmModalOpen,
    setIsNewProjectModalOpen,
    setMainMenuConfigState,
    setMsx2ProjectProfile,
    setPendingMsx2NewProject,
    setPresentationScreenState,
    setSelectedAssetId,
    setSelectedEffectZoneId,
    setStatusBarMessage,
    setTileBanksState,
  ]);

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
      onConfirm: () => finalizeNewProject(projectNameFromModal, selectedMode, null),
      confirmText: "Create New",
      confirmButtonVariant: 'danger'
    });
    setIsConfirmModalOpen(true);
  };

  const handleRequestMsx2GameProfile = (projectNameFromModal: string, selectedMode: string) => {
    setIsNewProjectModalOpen(false);
    setPendingMsx2NewProject({ projectName: projectNameFromModal, screenMode: selectedMode });
    setStatusBarMessage(`Choose an MSX2 game type for "${projectNameFromModal}".`);
  };

  const handleCancelMsx2NewProject = () => {
    setPendingMsx2NewProject(null);
    setIsNewProjectModalOpen(true);
    setStatusBarMessage('New MSX2 project setup cancelled.');
  };

  const handleConfirmMsx2GameProfile = (profileId: Msx2GameProfileId) => {
    if (!pendingMsx2NewProject) return;
    const profile = buildMsx2ProjectProfile(profileId);
    const { projectName, screenMode } = pendingMsx2NewProject;

    setConfirmModalProps({
      title: "Create New MSX2 Project?",
      message: (
        <>
          <p>Are you sure you want to create <strong>{projectName}</strong> as an MSX2 <strong>{profile.label}</strong> project?</p>
          <p className="text-msx-textsecondary mt-2">
            Target screen mode: <strong>{screenMode}</strong> (cannot be changed later).
          </p>
          <p className="text-msx-textsecondary mt-2">
            Asset filters and a starter {usesMsx2BitmapRoomStarter(profile) ? 'SCREEN 4 bitmap room' : 'SCREEN 4 room'} will be saved in the project JSON.
          </p>
          <p className="text-msx-warning mt-2">This will clear all current unsaved assets and history.</p>
        </>
      ),
      onConfirm: () => finalizeNewProject(projectName, screenMode, profile),
      confirmText: "Create MSX2 Project",
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
      msx2ProjectProfile: isScreen4Project(currentScreenMode) ? msx2ProjectProfile : null,
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
    msx2ProjectProfile,
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

        const normalizeMsx2Presentation = (asset: ProjectAsset): ProjectAsset => {
          const raw = (asset.data || {}) as any;
          const legacyData = raw.data && typeof raw.data === 'object' ? raw.data : {};
          const flat = { ...raw, ...legacyData };
          const height = flat.height === 212 ? 212 : 192;
          const sourcePacked = Array.isArray(flat.packedBitmap)
            ? flat.packedBitmap
            : Array.isArray(flat.packedPixels)
            ? flat.packedPixels
            : undefined;
          const pixels = sourcePacked
            ? unpackScreen5PresentationPixels(sourcePacked, height)
            : normalizeScreen5PresentationPixels(flat.pixels, height);
          const packedBitmap = sourcePacked
            ? sourcePacked.map((value: number) => Math.max(0, Math.min(255, Number(value) || 0)))
            : packScreen5PresentationPixels(pixels);

          return {
            ...asset,
            data: {
              ...DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG,
              ...flat,
              target: 'MSX2',
              screenMode: 'SCREEN 5',
              width: 256,
              height,
              displayHeight: flat.displayHeight === 212 ? 212 : height,
              palette: Array.isArray(flat.palette) && flat.palette.length === 16
                ? flat.palette
                : DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG.palette,
              pixels,
              packedBitmap,
              compression: {
                ...DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG.compression,
                ...(flat.compression || {}),
                codec: 'ZX0',
              },
              runtime: {
                ...DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG.runtime,
                ...(flat.runtime || {}),
              },
              data: {
                ...legacyData,
                pixels,
                packedBitmap,
                packedPixels: packedBitmap,
              },
            },
          };
        };

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
                  ...screen.runtime,
                  screenKind: screen.runtime?.screenKind || 'playable',
                  screenEngine: screen.runtime?.screenEngine || 'player',
                  movementMode: screen.runtime?.movementMode,
                  movementModel: screen.runtime?.movementModel,
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
          if (asset.type === 'msx2presentation' && asset.data) {
            return normalizeMsx2Presentation(asset);
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

      const loadedMode = projectData.currentScreenMode || projectData.screenMode || DEFAULT_SCREEN_MODE;
      const loadedMsx2Profile = isScreen4Project(loadedMode)
        ? normalizeMsx2ProjectProfile(projectData.msx2ProjectProfile)
        : null;
      applyScreenModeDefaults(loadedMode);
      setMsx2ProjectProfile(loadedMsx2Profile);
      setPendingMsx2NewProject(null);
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

      setComponentDefinitionsState(filterComponentDefinitionsForProject(migratedComponentDefinitions, loadedMode, loadedMsx2Profile));

      let templatesForSanitization: EntityTemplate[] = filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, loadedMode, loadedMsx2Profile);
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
        setEntityTemplatesState(filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, loadedMode, loadedMsx2Profile));
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
    setMsx2ProjectProfile,
    setPendingMsx2NewProject,
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
    handleRequestMsx2GameProfile,
    handleCancelMsx2NewProject,
    handleConfirmMsx2GameProfile,
    handleOpenSaveAsModal,
    handleSaveProject,
    handleConfirmSaveAsProjectAs,
    handleLoadProject,
    handleLoadProjectFromRawContent,
    handleOpenRecentProject
  };
};
