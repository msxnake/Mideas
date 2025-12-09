import { useCallback } from 'react';
import { ProjectAsset, EditorType, ScreenMap, TileBank, TileBankDefinition, ComponentDefinition, EntityTemplate, MainMenuConfig, Snippet, HelpDocSection, DataFormat, MSXFont, MSXFontColorAttributes, MSXColorValue } from '../types';
import { DEFAULT_TILE_BANK_DEFINITIONS, DEFAULT_MAIN_MENU_CONFIG, DEFAULT_SCREEN_MODE, MSX1_PALETTE, MSX_SCREEN5_PALETTE } from '../constants';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from '../data/defaults';
import { getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from '../utils/projectUtils';
import { cleanUnusedDefinitions } from '../utils/projectCleanup';
import { addRecentProject, getRecentProjectData, getRecentProjects } from '../utils/recentProjects';

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
        applyScreenModeDefaults(selectedMode || DEFAULT_SCREEN_MODE);
        setTileBanksState(DEFAULT_TILE_BANK_DEFINITIONS);
        setComponentDefinitionsState(DEFAULT_COMPONENT_DEFINITIONS);
        setEntityTemplatesState(DEFAULT_ENTITY_TEMPLATES);
        setMainMenuConfigState(DEFAULT_MAIN_MENU_CONFIG);
        clearAllHistory();
        setCopiedScreenBuffer(null);
        setCopiedTileData(null);
        setCopiedLayerBuffer(null);
        setSelectedEffectZoneId(null);

        const newProjectFiles = ["main.asm", "data/graphics.asm", "data/components.asm", "code/behaviors.asm"];
        const formattedDate = getFormattedDate();
        const createdAssets: ProjectAsset[] = [];
        let mainAsmAssetId: string | null = null;

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
          if (filename === "main.asm") {
            mainAsmAssetId = assetId;
          }
        });

        setAssets(createdAssets);
        if (mainAsmAssetId) {
          setSelectedAssetId(mainAsmAssetId);
          setCurrentEditor(EditorType.Code);
          setStatusBarMessage(`Project "${projectNameFromModal}" created in ${selectedMode}. main.asm opened.`);
        } else {
          setStatusBarMessage(`Project "${projectNameFromModal}" created in ${selectedMode}.`);
        }
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

    const projectData = {
      assets: assetsNormalized,
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
    currentProjectName, componentDefinitions, entityTemplates, mainMenuConfig,
    setStatusBarMessage
  ]);

  const handleConfirmSaveAsProjectAs = (filenameFromModal: string) => {
    const finalFilename = filenameFromModal.endsWith('.json') ? filenameFromModal : `${filenameFromModal}.json`;
    const projectNameWithoutExtension = finalFilename.replace('.json', '');
    setCurrentProjectName(projectNameWithoutExtension);
    handleSaveProject(finalFilename);
    setIsSaveAsModalOpen(false);
  };

  const loadProjectFromParsedData = useCallback((projectData: any, { projectName, sourcePath, rawContent }: { projectName: string; sourcePath?: string; rawContent?: string; }) => {
    try {
      clearAllHistory();
      setCopiedScreenBuffer(null);
      setCopiedTileData(null);
      setCopiedLayerBuffer(null);
      setSelectedEffectZoneId(null);
      setSelectedEntityInstanceId(null);

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

        const migratedAssets = projectData.assets.map((asset: ProjectAsset) => {
          if (asset.type === 'screenmap' && asset.data && !(asset.data as ScreenMap).effectZones) {
            return { ...asset, data: { ...(asset.data as ScreenMap), effectZones: [] } };
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

        setAssetsWithHistory(() => migratedAssets);
      }

      const loadedMode = projectData.currentScreenMode || DEFAULT_SCREEN_MODE;
      applyScreenModeDefaults(loadedMode);
      if (projectData.selectedAssetId) setSelectedAssetId(projectData.selectedAssetId);
      if (projectData.currentEditor) setCurrentEditor(projectData.currentEditor);

      if (projectData.assets) {
        const tileBankAssets = projectData.assets.filter((asset: ProjectAsset) => asset.type === 'tilebank');
        if (tileBankAssets.length > 0) {
          const ensuredTileBanks = tileBankAssets.map(asset => {
            const tileBankData = asset.data as TileBank;
            return {
              ...tileBankData,
              banks: tileBankData.banks.map((bank: TileBankDefinition) => ({
                ...bank,
                logicalTilesEnabled: (bank as any).logicalTilesEnabled ?? false,
                logicalTileTypes: (bank as any).logicalTileTypes ?? []
              }))
            };
          });
          setTileBanksState(ensuredTileBanks);
          localStorage.setItem('tileBanksConfig', JSON.stringify(ensuredTileBanks));
        }
      } else if (projectData.tileBanks) {
        setTileBanksState(projectData.tileBanks);
        localStorage.setItem('tileBanksConfig', JSON.stringify(projectData.tileBanks));
      }

      if (projectData.componentDefinitions) {
        const projectComponentsMap = new Map(
          projectData.componentDefinitions.map((comp: ComponentDefinition) => [comp.id, comp])
        );

        const mergedComponents = DEFAULT_COMPONENT_DEFINITIONS.map(defaultComp =>
          projectComponentsMap.get(defaultComp.id) || defaultComp
        );

        projectData.componentDefinitions.forEach((comp: ComponentDefinition) => {
          if (!DEFAULT_COMPONENT_DEFINITIONS.find(dc => dc.id === comp.id)) {
            mergedComponents.push(comp);
          }
        });

        setComponentDefinitionsState(mergedComponents);
      } else {
        setComponentDefinitionsState(DEFAULT_COMPONENT_DEFINITIONS);
      }

      if (projectData.entityTemplates) {
        const cleanedEntityTemplates = projectData.entityTemplates.map((template: EntityTemplate) => {
          const cleanedComponents = template.components.map(comp => {
            const allComponents = projectData.componentDefinitions
              ? [...projectData.componentDefinitions, ...DEFAULT_COMPONENT_DEFINITIONS.filter(dc =>
                !projectData.componentDefinitions.find((pc: ComponentDefinition) => pc.id === dc.id)
              )]
              : DEFAULT_COMPONENT_DEFINITIONS;

            const componentDef = allComponents.find((cd: ComponentDefinition) => cd.id === comp.definitionId);
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
        });

        setEntityTemplatesState(cleanedEntityTemplates);
      }

      if (projectData.mainMenuConfig) setMainMenuConfigState(projectData.mainMenuConfig);

      const finalProjectName = projectData.currentProjectName || projectName || 'msx_ide_project';
      setCurrentProjectName(finalProjectName);

      const cachedData = rawContent || JSON.stringify(projectData);
      addRecentProject(finalProjectName, sourcePath || finalProjectName, cachedData);

      setStatusBarMessage(`Project "${finalProjectName}" loaded successfully.`);
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
    setSelectedAssetId,
    setSelectedEffectZoneId,
    setSelectedEntityInstanceId,
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
    handleOpenRecentProject
  };
};
