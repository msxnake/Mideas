import { useCallback } from 'react';
import { ProjectAsset, EditorType, ScreenMap, TileBank, ComponentDefinition, EntityTemplate, MainMenuConfig, Snippet, HelpDocSection, DataFormat, MSXFont, MSXFontColorAttributes } from '../types';
import { DEFAULT_TILE_BANK_DEFINITIONS, DEFAULT_MAIN_MENU_CONFIG } from '../constants';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from '../data/defaults';
import { getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from '../utils/projectUtils';
import { cleanUnusedDefinitions } from '../utils/projectCleanup';

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

  const handleOpenNewProjectModal = () => setIsNewProjectModalOpen(true);

  const handleConfirmNewProject = (projectNameFromModal: string) => {
    setConfirmModalProps({
      title: "Create New Project?",
      message: (
        <>
          <p>Are you sure you want to create a new project named "{projectNameFromModal}"?</p>
          <p className="text-msx-warning mt-2">This will clear all current unsaved assets and history.</p>
        </>
      ),
      onConfirm: () => {
        setAssets([]);
        setSelectedAssetId(null);
        setCurrentProjectName(projectNameFromModal);
        setCurrentEditor(EditorType.None);
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
          const assetId = `code_new_${projectNameFromModal.replace(/\s+/g, '_')}_${filename.replace('.asm', '').replace(/\//g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
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
          setStatusBarMessage(`Project "${projectNameFromModal}" created. main.asm opened.`);
        } else {
          setStatusBarMessage(`Project "${projectNameFromModal}" created.`);
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
        effectiveFilename = `${currentProjectName}.json`;
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

    const projectData = {
      assets,
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

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string);
          clearAllHistory();
          setCopiedScreenBuffer(null);
          setCopiedTileData(null);
          setCopiedLayerBuffer(null);

          if (projectData.assets) {
            const assetsWithEnsuredEffectZones = projectData.assets.map((asset: ProjectAsset) => {
              if (asset.type === 'screenmap' && asset.data && !(asset.data as ScreenMap).effectZones) {
                return { ...asset, data: { ...(asset.data as ScreenMap), effectZones: [] } };
              }
              return asset;
            });
            setAssetsWithHistory(() => assetsWithEnsuredEffectZones);
          }

          if (projectData.currentScreenMode) setCurrentScreenMode(projectData.currentScreenMode);
          if (projectData.selectedAssetId) setSelectedAssetId(projectData.selectedAssetId);
          if (projectData.currentEditor) setCurrentEditor(projectData.currentEditor);

          // Load TileBanks from project
          // The state expects TileBank[] (array of TileBank assets)
          // Each TileBank asset contains banks: TileBankDefinition[]
          if (projectData.assets) {
            const tileBankAssets = projectData.assets.filter((asset: ProjectAsset) => asset.type === 'tilebank');
            if (tileBankAssets.length > 0) {
              // Map TileBank assets to ensure proper structure
              const ensuredTileBanks = tileBankAssets.map(asset => {
                const tileBankData = asset.data as TileBank;
                return {
                  ...tileBankData,
                  banks: tileBankData.banks.map((bank: TileBankDefinition) => ({
                    ...bank,
                    logicalTilesEnabled: bank.logicalTilesEnabled ?? false,
                    logicalTileTypes: bank.logicalTileTypes ?? []
                  }))
                };
              });
              setTileBanksState(ensuredTileBanks);
              localStorage.setItem('tileBanksConfig', JSON.stringify(ensuredTileBanks));
            }
          } else if (projectData.tileBanks) {
            // Legacy format: tileBanks at root level
            setTileBanksState(projectData.tileBanks);
            localStorage.setItem('tileBanksConfig', JSON.stringify(projectData.tileBanks));
          }

          // Load other configurations
          if (projectData.componentDefinitions) setComponentDefinitionsState(projectData.componentDefinitions);

          // Load and clean entityTemplates (remove redundant defaultValues)
          if (projectData.entityTemplates) {
            const cleanedEntityTemplates = projectData.entityTemplates.map((template: EntityTemplate) => {
              const cleanedComponents = template.components.map(comp => {
                const componentDef = projectData.componentDefinitions?.find((cd: ComponentDefinition) => cd.id === comp.definitionId);
                if (!componentDef) return comp; // Si no hay definición, mantener como está

                // Crear nuevos defaultValues solo con valores diferentes del default
                const cleanedDefaultValues: Record<string, any> = {};
                Object.entries(comp.defaultValues || {}).forEach(([key, value]) => {
                  const propertyDef = componentDef.properties.find(p => p.name === key);
                  const definitionDefault = propertyDef?.defaultValue;

                  // Normalizar para comparación (manejar diferencias de tipo string/number/boolean)
                  const normalizedValue = String(value);
                  const normalizedDefault = String(definitionDefault);

                  // Solo mantener si es diferente del default de la definición
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

          // Set project name from file name
          const projectNameFromFile = file.name.replace('.json', '');
          setCurrentProjectName(projectNameFromFile);

          setStatusBarMessage(`Project "${projectNameFromFile}" loaded successfully.`);
        } catch (error) {
          console.error('Error loading project:', error);
          setStatusBarMessage('Error loading project file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return {
    handleOpenNewProjectModal,
    handleConfirmNewProject,
    handleOpenSaveAsModal,
    handleSaveProject,
    handleConfirmSaveAsProjectAs,
    handleLoadProject
  };
};