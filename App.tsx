import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorType, ProjectAsset, ContextMenuItem, Tile, ScreenMap, ComponentDefinition, EntityTemplate } from './types';
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
import { getProjectTargetFromScreenMode, isAssetTypeEnabledForProject } from './utils/projectTarget';

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
    helpDocsData,
    setHelpDocsData,
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
    presentationScreen,
    setPresentationScreenState,
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
    setWorldViewGridVisible,
    saveBossZoom,
    setSaveBossZoom,
    saveSpriteZoom,
    setSaveSpriteZoom,
    saveTileZoom,
    setSaveTileZoom,
    saveScreenZoom,
    setSaveScreenZoom,
    saveSectorLines,
    setSaveSectorLines,
    defaultExportRomMode,
    setDefaultExportRomMode
  } = appState;

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number }; items: ContextMenuItem[] } | null>(null);

  // Editor zoom states
  const [screenEditorZoom, setScreenEditorZoom] = useState<number>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.saveScreenZoom && config.screenEditorZoom !== undefined) {
          return config.screenEditorZoom;
        }
      } catch (e) { /* ignore */ }
    }
    return 16;
  });
  const [tileEditorZoom, setTileEditorZoom] = useState<number>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.saveTileZoom && config.tileEditorZoom !== undefined) return config.tileEditorZoom;
      } catch (e) { /* ignore */ }
    }
    return 20;
  });
  const [bossEditorZoom, setBossEditorZoom] = useState<number>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.saveBossZoom && config.bossEditorZoom !== undefined) return config.bossEditorZoom;
      } catch (e) { /* ignore */ }
    }
    return 1;
  });

  const [showSectorLines, setShowSectorLines] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.saveSectorLines && config.showSectorLines !== undefined) return config.showSectorLines;
      } catch (e) { /* ignore */ }
    }
    return true;
  });

  useEffect(() => {
    if (saveSectorLines) {
      const savedConfig = localStorage.getItem('ideConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : {};
      config.showSectorLines = showSectorLines;
      localStorage.setItem('ideConfig', JSON.stringify(config));
    }
  }, [showSectorLines, saveSectorLines]);

  // Auto-save boss zoom when it changes (only if saveBossZoom is enabled)
  useEffect(() => {
    if (saveBossZoom) {
      const savedConfig = localStorage.getItem('ideConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : {};
      config.bossEditorZoom = bossEditorZoom;
      localStorage.setItem('ideConfig', JSON.stringify(config));
    }
  }, [bossEditorZoom, saveBossZoom]);

  // Auto-save tile zoom when it changes (only if saveTileZoom is enabled)
  useEffect(() => {
    if (saveTileZoom) {
      const savedConfig = localStorage.getItem('ideConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : {};
      config.tileEditorZoom = tileEditorZoom;
      localStorage.setItem('ideConfig', JSON.stringify(config));
    }
  }, [tileEditorZoom, saveTileZoom]);

  // Auto-save screen zoom when it changes (only if saveScreenZoom is enabled)
  useEffect(() => {
    if (saveScreenZoom) {
      const savedConfig = localStorage.getItem('ideConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : {};
      config.screenEditorZoom = screenEditorZoom;
      localStorage.setItem('ideConfig', JSON.stringify(config));
    }
  }, [screenEditorZoom, saveScreenZoom]);

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
    setPresentationScreenState,
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
    setPresentationScreen,
    handleUndo,
    handleRedo
  } = historyHandlers;

  const sanitizeAssetsByTemplates = useCallback((sourceAssets: ProjectAsset[], templatesToUse: EntityTemplate[]) => {
    const templateComponentIds = new Map<string, Set<string>>();
    templatesToUse.forEach(template => {
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
  }, []);

  const setEntityTemplatesWithCleanup = useCallback((
    updater: EntityTemplate[] | ((prev: EntityTemplate[]) => EntityTemplate[])
  ) => {
    const nextTemplates = typeof updater === 'function'
      ? (updater as (prev: EntityTemplate[]) => EntityTemplate[])(entityTemplates)
      : updater;

    setEntityTemplatesWithHistory(nextTemplates);
    setAssetsWithHistory(prevAssets => sanitizeAssetsByTemplates(prevAssets, nextTemplates));
  }, [entityTemplates, setEntityTemplatesWithHistory, setAssetsWithHistory, sanitizeAssetsByTemplates]);

  const setComponentDefinitionsWithCleanup = useCallback((
    updater: ComponentDefinition[] | ((prev: ComponentDefinition[]) => ComponentDefinition[])
  ) => {
    const nextDefinitions = typeof updater === 'function'
      ? (updater as (prev: ComponentDefinition[]) => ComponentDefinition[])(componentDefinitions)
      : updater;

    const validDefinitionIds = new Set(nextDefinitions.map(def => def.id));
    const nextTemplates = entityTemplates.map(template => ({
      ...template,
      components: (template.components || []).filter(component => validDefinitionIds.has(component.definitionId))
    }));

    setComponentDefinitionsWithHistory(nextDefinitions);
    setEntityTemplatesWithHistory(nextTemplates);
    setAssetsWithHistory(prevAssets => sanitizeAssetsByTemplates(prevAssets, nextTemplates));
  }, [
    componentDefinitions,
    entityTemplates,
    setComponentDefinitionsWithHistory,
    setEntityTemplatesWithHistory,
    setAssetsWithHistory,
    sanitizeAssetsByTemplates
  ]);

  // Initialize asset handlers
  const assetHandlers = useAssetHandlers({
    assets,
    setAssetsWithHistory,
    setTileBanksWithHistory,
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
    setSelectedColor,
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
    presentationScreen,
    setPresentationScreenState,
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
    helpDocsData
  });

  // Initialize import/export handlers
  const importExportHandlers = useImportExportHandlers({
    assets,
    setAssetsWithHistory,
    setSelectedAssetId,
    setCurrentEditor,
    setStatusBarMessage,
    currentProjectName,
    currentScreenMode,
    msxFont,
    msxFontColorAttributes: msxFontColors,
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
        if (!isAssetTypeEnabledForProject(asset.type, currentScreenMode)) {
          setSelectedAssetId(null);
          setCurrentEditor(EditorType.None);
          setStatusBarMessage(`${asset.name} is disabled in ${getProjectTargetFromScreenMode(currentScreenMode)} projects.`);
          return;
        }

        switch (asset.type) {
          case 'tile':
            setCurrentEditor(EditorType.Tile);
            break;
          case 'sprite':
            setCurrentEditor(EditorType.Sprite);
            break;
          case 'msx2sprite':
            setCurrentEditor(EditorType.Msx2Sprite);
            break;
          case 'msx2bitmap':
            setCurrentEditor(EditorType.Msx2Bitmap);
            break;
          case 'msx2screen':
            setCurrentEditor(EditorType.Msx2Screen);
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
          case 'dialogue':
            setCurrentEditor(EditorType.Dialogue);
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
      const assetToRename = assets.find(asset => asset.id === assetToRenameInfo.id);
      const tileBankDataId = assetToRename?.type === 'tilebank' ? (assetToRename.data as TileBank | undefined)?.id : undefined;

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

      if (assetToRenameInfo.type === 'tilebank') {
        setTileBanksWithHistory(prevBanks => prevBanks.map(tileBank => (
          tileBank.id === assetToRenameInfo.id || tileBank.id === tileBankDataId
            ? { ...tileBank, name: newName }
            : tileBank
        )));
      }

      setStatusBarMessage(`Asset renamed to ${newName}.`);
    }
    setIsRenameModalOpen(false);
    setAssetToRenameInfo(null);
  }, [assetToRenameInfo, assets, setAssetsWithHistory, setTileBanksWithHistory, setStatusBarMessage, setIsRenameModalOpen, setAssetToRenameInfo]);

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

  // Handle tile copy functionality
  const handleCopyTileData = (tileToCopy: Tile) => {
    setCopiedTileData({
      data: tileToCopy.data.map(row => [...row]),
      lineAttributes: tileToCopy.lineAttributes ? JSON.parse(JSON.stringify(tileToCopy.lineAttributes)) : undefined,
      width: tileToCopy.width,
      height: tileToCopy.height,
    });
    setStatusBarMessage(`Tile "${tileToCopy.name}" copied to buffer.`);
  };

  // IDE Configuration handlers
  const saveIdeConfig = () => {
    const configToSave = {
      dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled,
      worldViewGridVisible, saveBossZoom, saveSpriteZoom, saveTileZoom, saveScreenZoom, saveSectorLines,
      defaultExportRomMode,
      ...(saveBossZoom ? { bossEditorZoom } : {}),
      ...(saveTileZoom ? { tileEditorZoom } : {}),
      ...(saveScreenZoom ? { screenEditorZoom } : {}),
      ...(saveSectorLines ? { showSectorLines } : {})
    };
    localStorage.setItem('ideConfig', JSON.stringify(configToSave));
    setStatusBarMessage("IDE configuration saved to browser.");
  };

  const resetIdeConfig = () => {
    setDefaultExportRomMode('simple32k');
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
    setComponentDefinitions: setComponentDefinitionsWithCleanup,
    entityTemplates,
    setEntityTemplates: setEntityTemplatesWithCleanup,
    mainMenuConfig,
    onUpdateMainMenuConfig: setMainMenuConfigWithHistory,
    presentationScreen,
    onUpdatePresentationScreen: setPresentationScreen,
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
    saveScreenZoom,
    setSaveScreenZoom,
    saveBossZoom,
    setSaveBossZoom,
    saveSpriteZoom,
    setSaveSpriteZoom,
    saveTileZoom,
    setSaveTileZoom,
    showSectorLines,
    setShowSectorLines,
    saveSectorLines,
    setSaveSectorLines,
    defaultExportRomMode,
    setDefaultExportRomMode,

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
    handleCopyTileData,
    setCurrentLoadedFontName: () => {},
    currentLoadedFontName: '',
    helpDocsData,
    setHelpDocsData,
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
