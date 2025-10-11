import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorType, ProjectAsset, ContextMenuItem } from './types';
import { AppUI } from './components/AppUI';
import { ThemeProvider } from './contexts/ThemeContext';

// Custom hooks for state management
import { useAppState } from './hooks/useAppState';

// Custom hooks for handlers
import { useAssetHandlers } from './handlers/useAssetHandlers';
import { useProjectHandlers } from './handlers/useProjectHandlers';
import { useImportExportHandlers } from './handlers/useImportExportHandlers';
import { useSnippetHandlers } from './handlers/useSnippetHandlers';
import { useHistoryHandlers } from './handlers/useHistoryHandlers';

/** The interval for autosaving the project, in milliseconds. @constant */
const AUTOSAVE_INTERVAL = 10 * 60 * 1000;

/**
 * The main root component of the application.
 * This component manages the entire application state, including assets, editor states,
 * project settings, and all business logic for creating, updating, loading, and saving data.
 * It passes down state and callbacks to the `AppUI` component for rendering.
 */
const App: React.FC = () => {
  // Use the custom hook for all app state
  const appState = useAppState();

  // Extract commonly used state
  const {
    currentEditor,
    setCurrentEditor,
    previousEditorContext,
    setPreviousEditorContext,
    prevValuesRef,
    assets,
    setAssets,
    selectedAssetId,
    setSelectedAssetId,
    currentProjectName,
    setCurrentProjectName,
    currentScreenMode,
    setCurrentScreenMode,
    statusBarMessage,
    setStatusBarMessage,
    selectedColor,
    setSelectedColor,
    tileBanks,
    setTileBanks,
    msxFont,
    msxFontColors,
    userSnippets,
    setUserSnippets,
    dataOutputFormat,
    setDataOutputFormat,
    autosaveEnabled,
    setAutosaveEnabled,
    snippetsEnabled,
    setSnippetsEnabled,
    syntaxHighlightingEnabled,
    setSyntaxHighlightingEnabled,
    componentDefinitions,
    setComponentDefinitionsState,
    entityTemplates,
    setEntityTemplatesState,
    mainMenuConfig,
    setMainMenuConfigState,
    // Modal states
    isRenameModalOpen,
    setIsRenameModalOpen,
    assetToRenameInfo,
    setAssetToRenameInfo,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    isSpriteImportModalOpen,
    setIsSpriteImportModalOpen,
    isSpriteFramesModalOpen,
    setIsSpriteFramesModalOpen,
    spriteFramesModalAsset,
    setSpriteFramesModalAsset,
    isTrackImportModalOpen,
    setIsTrackImportModalOpen,
    isSaveAsModalOpen,
    setIsSaveAsModalOpen,
    isSnippetEditorModalOpen,
    setIsSnippetEditorModalOpen,
    editingSnippet,
    setEditingSnippet,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmModalProps,
    setConfirmModalProps,
    isMapFileDisplayModalOpen,
    setIsMapFileDisplayModalOpen,
    isCodeExportModalOpen,
    setIsCodeExportModalOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isCompressDataModalOpen,
    setIsCompressDataModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
    isSpriteSheetModalOpen,
    setIsSpriteSheetModalOpen,
    // Other states
    screenEditorSelectedTileId,
    setScreenEditorSelectedTileId,
    currentScreenEditorActiveLayer,
    setCurrentScreenEditorActiveLayer,
    currentEntityTypeToPlace,
    setCurrentEntityTypeToPlace,
    selectedEntityInstanceId,
    setSelectedEntityInstanceId,
    selectedEffectZoneId,
    setSelectedEffectZoneId,
    selectedGameFlowNodeId,
    setSelectedGameFlowNodeId,
    waypointPickerState,
    setWaypointPickerState,
    // Copy/Paste states
    copiedScreenData,
    setCopiedScreenData,
    copiedLayerData,
    setCopiedLayerData,
    copiedTileData,
    setCopiedTileData,
    copiedBossPhaseData,
    setCopiedBossPhaseData,
    // HUD and Game Flow
    hudConfig,
    setHudConfig,
    gameFlowGraph,
    setGameFlowGraph,
    worldViewGridVisible,
    setWorldViewGridVisible
  } = appState;

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number }; items: ContextMenuItem[] } | null>(null);

  // Editor zoom states
  const [screenEditorZoom, setScreenEditorZoom] = useState(16);
  const [tileEditorZoom, setTileEditorZoom] = useState(20);
  const [bossEditorZoom, setBossEditorZoom] = useState(1);

  const showContextMenu = (position: { x: number; y: number }, items: ContextMenuItem[]) => {
    setContextMenu({ isOpen: true, position, items });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Initialize history handlers
  const historyHandlers = useHistoryHandlers({
    setAssets,
    setTileBanksState: setTileBanks,
    setMsxFontState: () => {}, // Will be implemented
    setMsxFontColorAttributesState: () => {}, // Will be implemented
    setComponentDefinitionsState,
    setEntityTemplatesState,
    setMainMenuConfigState,
    setStatusBarMessage
  });

  const {
    history,
    setHistory,
    clearAllHistory,
    setAssetsWithHistory,
    setTileBanks: setTileBanksWithHistory,
    setMsxFont: setMsxFontWithHistory,
    setMsxFontColorAttributes: setMsxFontColorAttributesWithHistory,
    setComponentDefinitions: setComponentDefinitionsWithHistory,
    setEntityTemplates: setEntityTemplatesWithHistory,
    setMainMenuConfig: setMainMenuConfigWithHistory,
    handleUndo,
    handleRedo
  } = historyHandlers;

  // Initialize asset handlers
  const assetHandlers = useAssetHandlers({
    assets,
    setAssetsWithHistory,
    setStatusBarMessage,
    selectedAssetId,
    setSelectedAssetId,
    setCurrentEditor,
    currentScreenMode,
    setConfirmModalProps,
    setIsConfirmModalOpen,
    setSelectedEffectZoneId,
    setSpriteForFramesModal: setSpriteFramesModalAsset,
    setIsSpriteFramesModalOpen,
    setIsSpriteSheetModalOpen: () => {}, // Will be implemented
    waypointPickerState,
    setWaypointPickerState
  });

  // Initialize project handlers
  const projectHandlers = useProjectHandlers({
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
    setTileBanksState: setTileBanks,
    componentDefinitions,
    setComponentDefinitionsState,
    entityTemplates,
    setEntityTemplatesState,
    mainMenuConfig,
    setMainMenuConfigState,
    clearAllHistory,
    setCopiedScreenBuffer: setCopiedScreenData,
    setCopiedTileData,
    setCopiedLayerBuffer: setCopiedLayerData,
    setSelectedEffectZoneId,
    setSelectedEntityInstanceId,
    msxFont,
    msxFontColorAttributes: msxFontColors,
    dataOutputFormat,
    autosaveEnabled,
    snippetsEnabled,
    syntaxHighlightingEnabled,
    userSnippets,
    helpDocsData: [] // Will be implemented
  });

  // Initialize import/export handlers
  const importExportHandlers = useImportExportHandlers({
    assets,
    setAssetsWithHistory,
    setSelectedAssetId,
    setCurrentEditor,
    setStatusBarMessage,
    currentProjectName,
    msxFont,
    tileBanks,
    componentDefinitions,
    entityTemplates,
    mainMenuConfig,
    setIsCodeExportModalOpen
  });

  // Initialize snippet handlers
  const snippetHandlers = useSnippetHandlers({
    userSnippets,
    setUserSnippets,
    setIsSnippetEditorModalOpen,
    setEditingSnippet,
    setStatusBarMessage,
    setConfirmModalProps,
    setIsConfirmModalOpen,
    setSnippetToInsert: () => {}, // Will be implemented
    assets,
    tileBanks
  });

  // Refs for autosave functionality
  const autosaveFunctionRef = useRef<(() => void) | null>(null);
  const fileLoadInputRef = useRef<HTMLInputElement>(null);

  // Track previous values for editor context
  useEffect(() => {
    if (prevValuesRef.current) {
      const { editor: prevEditor, assetId: prevAssetId } = prevValuesRef.current;

      if ((prevEditor !== currentEditor || prevAssetId !== selectedAssetId) &&
          prevEditor !== EditorType.None && prevAssetId) {
        setPreviousEditorContext({ editor: prevEditor, assetId: prevAssetId });
      }
    }

    prevValuesRef.current = { editor: currentEditor, assetId: selectedAssetId };
  }, [currentEditor, selectedAssetId, setPreviousEditorContext]);

  // Setup autosave functionality
  useEffect(() => {
    if (autosaveEnabled && assets.length > 0) {
      const autosaveFunction = () => {
        if (currentProjectName) {
          projectHandlers.handleSaveProject(`${currentProjectName}_autosave.json`, false);
        }
      };

      autosaveFunctionRef.current = autosaveFunction;

      const intervalId = setInterval(autosaveFunction, AUTOSAVE_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [autosaveEnabled, assets.length, currentProjectName, projectHandlers]);

  // Handle editor toggle
  const handleToggleEditor = useCallback(() => {
    if (previousEditorContext) {
      setSelectedAssetId(previousEditorContext.assetId);
      setCurrentEditor(previousEditorContext.editor);
      setPreviousEditorContext(null);
      setStatusBarMessage(`Switched back to ${EditorType[previousEditorContext.editor]} Editor.`);
    }
  }, [previousEditorContext, setSelectedAssetId, setCurrentEditor, setPreviousEditorContext, setStatusBarMessage]);

  // Handle asset selection - simplified version
  const handleSelectAsset = (assetId: string | null, editorTypeOverride?: EditorType) => {
    setSelectedAssetId(assetId);
    setSelectedEntityInstanceId(null);
    setSelectedEffectZoneId(null);

    if (editorTypeOverride) {
      setCurrentEditor(editorTypeOverride);
      if (assetId) setStatusBarMessage(`Opened ${EditorType[editorTypeOverride]} Editor.`);
      return;
    }

    if (assetId) {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        switch (asset.type) {
          case 'tile':
            setCurrentEditor(EditorType.Tile);
            break;
          case 'sprite':
            setCurrentEditor(EditorType.Sprite);
            break;
          case 'screenmap':
            setCurrentEditor(EditorType.Screen);
            break;
          case 'code':
          case 'behavior':
            setCurrentEditor(EditorType.Code);
            break;
          case 'track':
            setCurrentEditor(EditorType.Track);
            break;
          case 'boss':
            setCurrentEditor(EditorType.Boss);
            break;
          default:
            setCurrentEditor(EditorType.None);
        }
        setStatusBarMessage(`Selected ${asset.name}.`);
      }
    } else {
      setCurrentEditor(EditorType.None);
      setStatusBarMessage("No asset selected.");
    }
  };

  // Handle rename functionality
  const handleConfirmRename = useCallback((newName: string) => {
    if (assetToRenameInfo) {
      setAssetsWithHistory(prevAssets => prevAssets.map(a => {
        if (a.id === assetToRenameInfo.id) {
          const updatedAsset = { ...a, name: newName };
          if (updatedAsset.data && typeof updatedAsset.data === 'object') {
            (updatedAsset.data as any).name = newName;
          }
          return updatedAsset;
        }
        return a;
      }));
      setStatusBarMessage(`Asset renamed to ${newName}.`);
    }
    setIsRenameModalOpen(false);
    setAssetToRenameInfo(null);
  }, [assetToRenameInfo, setAssetsWithHistory, setStatusBarMessage, setIsRenameModalOpen, setAssetToRenameInfo]);

  const handleCancelRename = () => {
    setIsRenameModalOpen(false);
    setAssetToRenameInfo(null);
    setStatusBarMessage("Rename cancelled.");
  };

  // Handle rename request
  const memoizedOnRequestRename = useCallback((assetId: string, currentName: string, type: ProjectAsset['type']) => {
    setAssetToRenameInfo({ id: assetId, currentName, type });
    setIsRenameModalOpen(true);
  }, [setAssetToRenameInfo, setIsRenameModalOpen]);

  // Handle screen mode update
  const handleUpdateScreenMode = (mode: string) => {
    setCurrentScreenMode(mode);
    setStatusBarMessage(`Screen mode changed to ${mode}.`);
    if (mode === "SCREEN 2 (Graphics I)") {
      // Set appropriate color for Screen 2
      setSelectedColor('#FFFFFF');
    } else {
      // Set appropriate color for other modes
      setSelectedColor('#FF0000');
    }
  };

  // Handle entity instance deletion
  const handleDeleteEntityInstance = (entityIdToDelete: string) => {
    if (!selectedAssetId) return;

    setAssetsWithHistory(prevAssets => prevAssets.map(asset => {
      if (asset.id === selectedAssetId && asset.type === 'screenmap' && asset.data) {
        const screenMap = asset.data as ScreenMap;
        const updatedEntities = screenMap.layers.entities.filter(e => e.id !== entityIdToDelete);

        return {
          ...asset,
          data: {
            ...screenMap,
            layers: {
              ...screenMap.layers,
              entities: updatedEntities
            }
          }
        };
      }
      return asset;
    }));

    // Deselect the entity instance
    setSelectedEntityInstanceId(null);
    setStatusBarMessage('Entity instance deleted.');
  };

  // IDE Configuration handlers
  const saveIdeConfig = () => {
    const configToSave = { dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled, worldViewGridVisible };
    localStorage.setItem('ideConfig', JSON.stringify(configToSave));
    setStatusBarMessage("IDE configuration saved to browser.");
  };

  const resetIdeConfig = () => {
    // Reset to defaults - these would need to be implemented with proper setters
    setStatusBarMessage("IDE configuration reset to defaults.");
  };

  // Prepare all props for AppUI
  const allPassedProps = {
    // Core state
    currentEditor,
    setCurrentEditor,
    assets,
    selectedAssetId,
    currentProjectName,
    setCurrentProjectName,
    currentScreenMode,
    statusBarMessage,
    setStatusBarMessage,
    selectedColor,
    setSelectedColor,

    // Screen Editor state
    screenEditorSelectedTileId,
    setScreenEditorSelectedTileId,
    currentScreenEditorActiveLayer,
    setCurrentScreenEditorActiveLayer,

    // Entity & Component state
    componentDefinitions,
    setComponentDefinitions: setComponentDefinitionsWithHistory,
    entityTemplates,
    setEntityTemplates: setEntityTemplatesWithHistory,
    mainMenuConfig,
    onUpdateMainMenuConfig: setMainMenuConfigWithHistory,
    currentEntityTypeToPlace,
    setCurrentEntityTypeToPlace,
    selectedEntityInstanceId,
    setSelectedEntityInstanceId,
    selectedEffectZoneId,
    setSelectedEffectZoneId,
    selectedGameFlowNodeId,
    setSelectedGameFlowNodeId,

    // Modal states
    isRenameModalOpen,
    setIsRenameModalOpen,
    assetToRenameInfo,
    setAssetToRenameInfo,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    isSpriteImportModalOpen,
    setIsSpriteImportModalOpen,
    isSpriteFramesModalOpen,
    setIsSpriteFramesModalOpen,
    spriteForFramesModal: spriteFramesModalAsset,
    setSpriteForFramesModal: setSpriteFramesModalAsset,
    isTrackImportModalOpen,
    setIsTrackImportModalOpen,
    isSaveAsModalOpen,
    setIsSaveAsModalOpen,
    isSnippetEditorModalOpen,
    setIsSnippetEditorModalOpen,
    editingSnippet,
    setEditingSnippet,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmModalProps,
    setConfirmModalProps,
    isMapFileDisplayModalOpen,
    setIsMapFileDisplayModalOpen,
    isCodeExportModalOpen,
    setIsCodeExportModalOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isCompressDataModalOpen,
    setIsCompressDataModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,

    // Configuration states
    tileBanks,
    setTileBanks: setTileBanksWithHistory,
    msxFont,
    setMsxFont: setMsxFontWithHistory,
    msxFontColorAttributes: msxFontColors,
    setMsxFontColorAttributes: setMsxFontColorAttributesWithHistory,
    userSnippets,
    setUserSnippets,

    // IDE Configuration
    dataOutputFormat,
    setDataOutputFormat,
    autosaveEnabled,
    setAutosaveEnabled,
    snippetsEnabled,
    setSnippetsEnabled,
    syntaxHighlightingEnabled,
    setSyntaxHighlightingEnabled,
    worldViewGridVisible,
    setWorldViewGridVisible,

    // History
    history,
    setAssetsWithHistory,
    handleUndo,
    handleRedo,

    // Copy/Paste state
    copiedScreenBuffer: copiedScreenData,
    setCopiedScreenBuffer: setCopiedScreenData,
    copiedLayerBuffer: copiedLayerData,
    setCopiedLayerBuffer: setCopiedLayerData,
    copiedTileData,
    setCopiedTileData,
    copiedBossPhase: copiedBossPhaseData,
    setCopiedBossPhase: setCopiedBossPhaseData,

    // HUD Configuration
    hudConfig,
    setHudConfig,

    // Game Flow
    gameFlowGraph,
    setGameFlowGraph,

    // Waypoint Picker
    waypointPickerState,
    setWaypointPickerState,

    // Handlers from asset handlers
    ...assetHandlers,

    // Handlers from project handlers
    ...projectHandlers,
    onLoadProject: () => fileLoadInputRef.current?.click(),
    handleLoadProject: projectHandlers.handleLoadProject,
    fileLoadInputRef,

    // Handlers from import/export handlers
    ...importExportHandlers,

    // Handlers from snippet handlers
    ...snippetHandlers,

    // Critical handlers (defined after spreads to avoid conflicts)
    memoizedOnRequestRename,
    handleConfirmRename,
    handleCancelRename,
    handleUpdateScreenMode,

    // Toggle editor
    isToggleEditorDisabled: previousEditorContext === null,
    onToggleEditor: handleToggleEditor,

    // Configuration handlers
    saveIdeConfig,
    resetIdeConfig,

    // Context menu handlers
    showContextMenu,
    closeContextMenu,
    contextMenu,
    handleDeleteEntityInstance,
    handleRequestSaveTile: () => {},
    onRequestSaveTile: () => {},
    handleRequestLoadTile: () => {},
    onRequestLoadTile: () => {},
    handleRequestSaveSelectedTiles: () => {},
    onRequestSaveSelectedTiles: () => {},
    handleCopyTileData: () => {},
    setCurrentLoadedFontName: () => {},
    currentLoadedFontName: '',
    helpDocsData: [],
    setHelpDocsData: () => {},
    isSpriteSheetModalOpen,
    setIsSpriteSheetModalOpen,
    snippetToInsert: null,
    setSnippetToInsert: () => {},
    isAutosaving: false,
    setIsAutosaving: () => {},
    bossEditorZoom,
    setBossEditorZoom,
    tileEditorZoom,
    setTileEditorZoom,
    screenEditorZoom,
    setScreenEditorZoom,
    onRequestSaveTrack: () => {},
    onImportTrack: importExportHandlers.handleImportTrack
  };

  return (
    <ThemeProvider>
      <AppUI
        {...allPassedProps}
        onSelectAsset={handleSelectAsset}
      />
    </ThemeProvider>
  );
};

export default App;