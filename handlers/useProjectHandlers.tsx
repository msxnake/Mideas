import { useCallback } from 'react';
import { ProjectAsset, EditorType, ScreenMap, TileBank, ComponentDefinition, EntityTemplate, MainMenuConfig, Snippet, HelpDocSection, DataFormat, MSXFont, MSXFontColorAttributes } from '../types';
import { DEFAULT_TILE_BANK_DEFINITIONS, DEFAULT_MAIN_MENU_CONFIG } from '../constants';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from '../data/defaults';
import { getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from '../utils/projectUtils';

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
      componentDefinitions,
      entityTemplates,
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
          let loadedBanks = null;
          if (projectData.tileBanks) {
            loadedBanks = projectData.tileBanks;
          } else if (projectData.assets) {
            // Check for TileBank assets in legacy format
            const tileBankAssets = projectData.assets.filter((asset: ProjectAsset) => asset.type === 'tileBanks');
            if (tileBankAssets.length > 0 && tileBankAssets[0].data) {
              loadedBanks = tileBankAssets[0].data;
            }
          }

          if (loadedBanks) {
            const ensuredBanks = loadedBanks.map((bank: TileBank) => ({
              ...bank,
              logicalTilesEnabled: bank.logicalTilesEnabled ?? false,
              logicalTileTypes: bank.logicalTileTypes ?? []
            }));
            setTileBanksState(ensuredBanks);
            localStorage.setItem('tileBanksConfig', JSON.stringify(ensuredBanks));
          }

          // Load other configurations
          if (projectData.componentDefinitions) setComponentDefinitionsState(projectData.componentDefinitions);
          if (projectData.entityTemplates) setEntityTemplatesState(projectData.entityTemplates);
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