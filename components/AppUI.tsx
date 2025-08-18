import React, { useEffect } from 'react';
import { 
  EditorType, ProjectAsset, Tile, Sprite, ScreenMap, MSXColorValue, SpriteFrame, PixelData, 
  LineColorAttribute, MSX1ColorValue, WorldMapGraph, PSGSoundData, 
  TrackerSongData, HUDConfiguration, TileBank, MSXFont, 
  MSXFontColorAttributes, DataFormat,
  Snippet, EntityInstance, MockEntityType, HelpDocSection, BehaviorScript,
  CopiedScreenData, CopiedLayerData, EffectZone, ScreenEditorLayerName, 
  ComponentDefinition, EntityTemplate, ContextMenuItem,
  Boss, Point, HistoryState, WaypointPickerState, CopiedTileData, MainMenuConfig
} from '../types';
import { 
  MSX_SCREEN5_PALETTE, MSX1_PALETTE,
  DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR,
  DEFAULT_HELP_DOCS_DATA, HELP_DOCS_SYSTEM_ASSET_ID,
  Z80_BEHAVIOR_SNIPPETS, Z80_SNIPPETS as DEFAULT_Z80_SNIPPETS, EDITOR_BASE_TILE_DIM_S2
} from '../constants';
import { EDITABLE_CHAR_CODES_SUBSET } from './utils/msxFontRenderer';
import { TileEditor } from './editors/TileEditor';
import { SpriteEditor } from './editors/SpriteEditor';
import { ScreenEditor } from './editors/ScreenEditor';
import { CodeEditor } from './editors/CodeEditor';
import { WorldMapEditor } from './editors/WorldMapEditor';
import { WorldViewEditor } from './editors/WorldViewEditor';
import { SoundEditor } from './editors/SoundEditor'; 
import { TrackerComposer } from './editors/TrackerComposer';
import { TileBankEditor } from './editors/TileBankEditor';
import { FontEditor } from './editors/FontEditor';
import { HelpDocsViewer } from './editors/HelpDocsViewer';
import { BehaviorEditor } from './editors/BehaviorEditor';
import { BossEditor } from './editors/BossEditor';
import { SpriteSheetReorderModal } from './modals/SpriteSheetReorderModal';
import { SpriteFramesModal } from './modals/SpriteFramesModal';
import { ComponentDefinitionEditor } from './editors/ComponentDefinitionEditor';
import { EntityTemplateEditor } from './editors/EntityTemplateEditor';
import { MainMenuEditor } from './editors/MainMenuEditor';
import { FileExplorerPanel, TILE_BANKS_SYSTEM_ASSET_ID, FONT_EDITOR_SYSTEM_ASSET_ID, COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, WORLD_VIEW_SYSTEM_ASSET_ID, MAIN_MENU_SYSTEM_ASSET_ID } from './tools/FileExplorerPanel'; 
import { PropertiesPanel } from './tools/PropertiesPanel';
import { PalettePanel } from './tools/PalettePanel';
import { EntityTypeListPanel } from './tools/EntityTypeListPanel'; 
import { SnippetsPanel } from './common/SnippetsPanel';
import { SnippetEditorModal } from './modals/SnippetEditorModal'; 
import { StatusBar } from './layout/StatusBar';
import { Toolbar } from './layout/Toolbar';
import { RenameModal } from './modals/RenameModal';
import { SaveAsModal } from './modals/SaveAsModal';
import { NewProjectModal } from './modals/NewProjectModal';
import { AboutModal } from './modals/AboutModal'; 
import { ConfirmationModal } from './modals/ConfirmationModal';
import { CompressDataModal } from './modals/CompressDataModal';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ConfigTabModal } from './theme_config/ConfigTabModal';
import { Panel } from './common/Panel';
import { HUDEditorModal } from './editors/HUDEditorModal';
import { ContextMenu } from './common/ContextMenu';
import { useWindowManager } from '@/hooks/useWindowManager';
import { Window } from './WindowManager/Window';
import { WindowState } from './WindowManager/WindowManagerProvider';


// A massive props interface to pass everything down from the container App.tsx
interface AppUIProps {
  assets: ProjectAsset[];
  selectedAssetId: string | null;
  currentProjectName: string | null;
  currentScreenMode: string;
  statusBarMessage: string;
  selectedColor: MSXColorValue;
  screenEditorSelectedTileId: string | null;
  // currentScreenEditorActiveLayer is now per-window, so removed from props
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
  mainMenuConfig: MainMenuConfig;
  currentEntityTypeToPlace: EntityTemplate | null;
  selectedEntityInstanceId: string | null;
  selectedEffectZoneId: string | null;
  isRenameModalOpen: boolean;
  assetToRenameInfo: { id: string; currentName: string; type: ProjectAsset['type']; } | null;
  isSaveAsModalOpen: boolean;
  isNewProjectModalOpen: boolean;
  isAboutModalOpen: boolean;
  isCompressDataModalOpen: boolean;
  isConfirmModalOpen: boolean;
  confirmModalProps: { title: string; message: string | React.ReactNode; onConfirm: () => void; confirmText?: string; cancelText?: string; confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'; } | null;
  tileBanks: TileBank[];
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  currentLoadedFontName: string;
  helpDocsData: HelpDocSection[];
  dataOutputFormat: DataFormat;
  autosaveEnabled: boolean;
  snippetsEnabled: boolean;
  syntaxHighlightingEnabled: boolean;
  isConfigModalOpen: boolean;
  isSpriteSheetModalOpen: boolean;
  isSpriteFramesModalOpen: boolean;
  spriteForFramesModal: ProjectAsset | null;
  snippetToInsert: { code: string; timestamp: number; } | null;
  userSnippets: Snippet[];
  isSnippetEditorModalOpen: boolean;
  editingSnippet: Snippet | null;
  isAutosaving: boolean;
  history: HistoryState;
  copiedScreenBuffer: CopiedScreenData | null;
  copiedTileData: CopiedTileData | null;
  copiedLayerBuffer: CopiedLayerData | null;
  contextMenu: { isOpen: boolean; position: { x: number; y: number; }; items: ContextMenuItem[]; } | null;
  waypointPickerState: WaypointPickerState;

  onUpdateMainMenuConfig: (updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => void;

  // Setters and handlers
  setAssets: React.Dispatch<React.SetStateAction<ProjectAsset[]>>;
  setSelectedAssetId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentProjectName: React.Dispatch<React.SetStateAction<string | null>>;
  setStatusBarMessage: React.Dispatch<React.SetStateAction<string>>;
  setSelectedColor: React.Dispatch<React.SetStateAction<MSXColorValue>>;
  setScreenEditorSelectedTileId: React.Dispatch<React.SetStateAction<string | null>>;
  // setCurrentScreenEditorActiveLayer is now per-window, so removed from props
  setComponentDefinitions: (updater: ComponentDefinition[] | ((prev: ComponentDefinition[]) => ComponentDefinition[])) => void;
  setEntityTemplates: (updater: EntityTemplate[] | ((prev: EntityTemplate[]) => EntityTemplate[])) => void;
  setCurrentEntityTypeToPlace: React.Dispatch<React.SetStateAction<EntityTemplate | null>>;
  setSelectedEntityInstanceId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedEffectZoneId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsRenameModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAssetToRenameInfo: React.Dispatch<React.SetStateAction<{ id: string; currentName: string; type: ProjectAsset['type']; } | null>>;
  setIsSaveAsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNewProjectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAboutModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCompressDataModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModalProps: React.Dispatch<React.SetStateAction<{ title: string; message: string | React.ReactNode; onConfirm: () => void; confirmText?: string; cancelText?: string; confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'; } | null>>;
  setTileBanks: (updater: TileBank[] | ((prev: TileBank[]) => TileBank[])) => void;
  setMsxFont: (updater: MSXFont | ((prev: MSXFont) => MSXFont)) => void;
  setMsxFontColorAttributes: (updater: MSXFontColorAttributes | ((prev: MSXFontColorAttributes) => MSXFontColorAttributes)) => void;
  setDataOutputFormat: React.Dispatch<React.SetStateAction<DataFormat>>;
  setAutosaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfigModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSpriteSheetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSpriteFramesModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSpriteForFramesModal: React.Dispatch<React.SetStateAction<ProjectAsset | null>>;
  setUserSnippets: React.Dispatch<React.SetStateAction<Snippet[]>>;
  setIsSnippetEditorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingSnippet: React.Dispatch<React.SetStateAction<Snippet | null>>;
  setCopiedScreenBuffer: React.Dispatch<React.SetStateAction<CopiedScreenData | null>>;
  setCopiedLayerBuffer: React.Dispatch<React.SetStateAction<CopiedLayerData | null>>;
  setContextMenu: React.Dispatch<React.SetStateAction<{ isOpen: boolean; position: { x: number; y: number; }; items: ContextMenuItem[]; } | null>>;
  setWaypointPickerState: React.Dispatch<React.SetStateAction<WaypointPickerState>>;
  handleUpdateSpriteOrder: (reorderedSpriteAssets: ProjectAsset[]) => void;
  handleOpenSpriteFramesModal: (spriteAsset: ProjectAsset) => void;
  handleSplitFrames: (spriteAsset: ProjectAsset) => void;
  handleCreateSpriteFromFrame: (sourceSpriteId: string, sourceFrameIndex: number) => void;
  handleWaypointPicked: (point: Point) => void;
  showContextMenu: (position: { x: number; y: number; }, items: ContextMenuItem[]) => void;
  closeContextMenu: () => void;
  setAssetsWithHistory: (updater: (prev: ProjectAsset[]) => ProjectAsset[]) => void;
  handleUpdateAsset: (assetId: string, updatedData: any, newAssetsToCreate?: ProjectAsset[]) => void;
  handleOpenSnippetEditor: (snippet: Snippet | null) => void;
  handleSaveSnippet: (snippetToSave: Snippet) => void;
  handleDeleteSnippet: (snippetId: string) => void;
  handleSnippetSelected: (snippet: Snippet) => void;
  saveIdeConfig: () => void;
  resetIdeConfig: () => void;
  handleOpenNewProjectModal: () => void;
  handleConfirmNewProject: (projectNameFromModal: string) => void;
  handleNewAsset: (type: ProjectAsset['type']) => void;
  handleSpriteImported: (newSpriteData: Omit<Sprite, 'id' | 'name'>) => void;
  memoizedOnRequestRename: (assetId: string, currentName: string, assetType: ProjectAsset['type']) => void;
  handleConfirmRename: (newName: string) => void;
  handleCancelRename: () => void;
  handleDeleteAsset: (assetId: string) => void;
  handleOpenSaveAsModal: () => void;
  handleSaveProject: (filenameToSave?: string, isManualSaveOperation?: boolean) => void;
  handleConfirmSaveAsProjectAs: (filenameFromModal: string) => void;
  handleLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileLoadInputRef: React.RefObject<HTMLInputElement>;
  handleDeleteEntityInstance: (entityIdToDelete: string) => void;
  handleShowMapFile: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleExportAllCodeFiles: () => void;
  handleCopyTileData: (tileToCopy: Tile) => void;
  handleGenerateTemplatesAsm: () => void;
}


export const AppUI: React.FC<AppUIProps> = (props) => {
    const {
        assets, selectedAssetId, currentProjectName, currentScreenMode, statusBarMessage, selectedColor, screenEditorSelectedTileId, componentDefinitions, entityTemplates, mainMenuConfig, currentEntityTypeToPlace, selectedEntityInstanceId, selectedEffectZoneId, isRenameModalOpen, assetToRenameInfo, isSaveAsModalOpen, isNewProjectModalOpen, isAboutModalOpen, isCompressDataModalOpen, isConfirmModalOpen, confirmModalProps, tileBanks, msxFont, msxFontColorAttributes, currentLoadedFontName, helpDocsData, dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled, isConfigModalOpen, isSpriteSheetModalOpen, isSpriteFramesModalOpen, spriteForFramesModal, snippetToInsert, userSnippets, isSnippetEditorModalOpen, editingSnippet, isAutosaving, history, copiedScreenBuffer, copiedTileData, copiedLayerBuffer, contextMenu, waypointPickerState,
        
        setSelectedAssetId, setStatusBarMessage, setSelectedColor, setScreenEditorSelectedTileId, setCurrentEntityTypeToPlace, setSelectedEntityInstanceId, setSelectedEffectZoneId, setIsRenameModalOpen, setAssetToRenameInfo, setIsSaveAsModalOpen, setIsNewProjectModalOpen, setIsAboutModalOpen, setIsCompressDataModalOpen, setIsConfirmModalOpen, setConfirmModalProps, setComponentDefinitions, setEntityTemplates, onUpdateMainMenuConfig, setTileBanks, setMsxFont, setMsxFontColorAttributes, setDataOutputFormat, setAutosaveEnabled, setIsConfigModalOpen, setIsSpriteSheetModalOpen, setIsSpriteFramesModalOpen, setSpriteForFramesModal, setUserSnippets, setIsSnippetEditorModalOpen, setEditingSnippet, setCopiedScreenBuffer, setCopiedLayerBuffer, setContextMenu, setWaypointPickerState, handleUpdateSpriteOrder, handleOpenSpriteFramesModal, handleSplitFrames, handleCreateSpriteFromFrame, handleWaypointPicked, showContextMenu, closeContextMenu, setAssetsWithHistory, handleUpdateAsset, handleOpenSnippetEditor, handleSaveSnippet, handleDeleteSnippet, handleSnippetSelected, saveIdeConfig, resetIdeConfig, handleOpenNewProjectModal, handleConfirmNewProject, handleNewAsset, handleSpriteImported, memoizedOnRequestRename, handleConfirmRename, handleCancelRename, handleDeleteAsset, handleOpenSaveAsModal, handleSaveProject, handleConfirmSaveAsProjectAs, handleLoadProject, fileLoadInputRef, handleDeleteEntityInstance, handleShowMapFile, handleUndo, handleRedo, handleExportAllCodeFiles, handleCopyTileData, handleGenerateTemplatesAsm
    } = props;

  const { windows, openWindow, updateWindowState, focusWindow, closeWindow, interactionState } = useWindowManager();

  useEffect(() => {
    // This effect handles opening a window when a new asset is created,
    // which is signified by `selectedAssetId` changing.
    if (selectedAssetId) {
      const windowAlreadyOpen = windows.some(w => w.id === selectedAssetId);
      if (!windowAlreadyOpen) {
        const asset = assets.find(a => a.id === selectedAssetId);
        if (asset) {
          openWindow(asset.id, asset.type, asset.name);
        }
      } else {
        // If window is open but not focused, focus it.
        const targetWindow = windows.find(w => w.id === selectedAssetId);
        if (targetWindow && !targetWindow.isFocused) {
          focusWindow(targetWindow.id);
        }
      }
    }
  }, [selectedAssetId, assets, windows, openWindow, focusWindow]);

  const activeAsset = assets.find(a => a.id === selectedAssetId);
  const activeScreenMapAsset = activeAsset?.type === 'screenmap' ? activeAsset.data as ScreenMap : undefined;
  
  const selectedEntityInstance = activeScreenMapAsset?.layers.entities.find(e => e.id === selectedEntityInstanceId);
  const selectedEffectZone = activeScreenMapAsset?.effectZones?.find(ez => ez.id === selectedEffectZoneId); 

  const getFontStats = () => { const defined = Object.keys(msxFont).length; const editableTotal = EDITABLE_CHAR_CODES_SUBSET.length; const editableDefined = EDITABLE_CHAR_CODES_SUBSET.filter(ec => msxFont[ec.code] !== undefined).length; return { defined, editableTotal, editableDefined };};
  const screenMapForHudModal = assets.find(a => a.id === selectedAssetId && a.type === 'screenmap')?.data as ScreenMap | undefined;

  const allTileAssetsData = assets.filter(a => a.type === 'tile').map(a => a.data as Tile);

  const focusedWindow = windows.find(w => w.isFocused);
  const activeEditorType = focusedWindow ? focusedWindow.assetType : 'none';
  
  const isUndoDisabled = history.undoStack.length === 0;
  const isRedoDisabled = history.redoStack.length === 0;

  const handleCompile = async () => {
    const focused = windows.find(w => w.isFocused);
    if (!focused || (focused.assetType !== 'code' && focused.assetType !== 'behavior')) {
      setStatusBarMessage("No code editor window is focused.");
      return;
    }

    const assetToCompile = assets.find(a => a.id === focused.assetId);
    if (!assetToCompile || (typeof assetToCompile.data !== 'string' && typeof (assetToCompile.data as any).code !== 'string')) {
      setStatusBarMessage("Could not find code for the focused asset.");
      return;
    }

    const code = typeof assetToCompile.data === 'string' ? assetToCompile.data : (assetToCompile.data as any).code;

    try {
      setStatusBarMessage(`Compiling ${assetToCompile.name}...`);
      const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusBarMessage(`Compilation of ${assetToCompile.name} successful! Output size: ${result.data.length / 2} bytes.`);
        alert(`Compilation Successful:\n${result.message}`);
      } else {
        setStatusBarMessage(`Compilation of ${assetToCompile.name} failed: ${result.error}`);
        alert(`Compilation Error:\n${result.details}`);
      }
    } catch (error) {
      setStatusBarMessage("Failed to connect to the compiler backend.");
      alert("Could not connect to the compiler backend. Is it running?");
    }
  };

  const allWorldMapGraphs = React.useMemo(() => assets
    .filter(a => a.type === 'worldmap' && a.data)
    .map(a => a.data as WorldMapGraph), [assets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const focused = windows.find(w => w.isFocused);
        if (focused) {
          closeWindow(focused.id);
        }
      } else if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const visibleWindows = windows.filter(w => w.isVisible);
        if (visibleWindows.length < 2) return;

        const focusedIndex = visibleWindows.findIndex(w => w.isFocused);
        const nextIndex = (focusedIndex + 1) % visibleWindows.length;
        focusWindow(visibleWindows[nextIndex].id);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (interactionState.mode === 'idle' || !interactionState.targetId) return;

      const { targetId, mode, initialMouseX, initialMouseY, initialWindowX, initialWindowY, initialWindowWidth, initialWindowHeight } = interactionState;
      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      if (mode === 'dragging') {
        let newX = initialWindowX + deltaX;
        let newY = initialWindowY + deltaY;
        // Optional: Add boundary checks here if needed
        updateWindowState(targetId, { x: newX, y: newY });
      } else if (mode === 'resizing') {
        let newWidth = initialWindowWidth + deltaX;
        let newHeight = initialWindowHeight + deltaY;
        // Optional: Add boundary checks here if needed
        updateWindowState(targetId, { width: newWidth, height: newHeight });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [windows, focusWindow, closeWindow, interactionState, updateWindowState]);

  const dataAssets = assets.filter(a =>
    ['tile', 'sprite', 'screenmap', 'sound', 'track', 'worldmap'].includes(a.type)
  );

  if (Object.keys(msxFont).length > 0) {
    dataAssets.push({
      id: 'msx-font-data',
      name: 'MSX Font & Colors',
      type: 'code',
      data: 'Font data is handled separately'
    });
  }

  const renderRightPanelContent = () => {
    const focused = windows.find(w => w.isFocused);
    if (!focused) {
      // Default panel when no window is focused
      return <PalettePanel palette={currentScreenMode === "SCREEN 2 (Graphics I)" ? MSX1_PALETTE : MSX_SCREEN5_PALETTE} selectedColor={selectedColor} onColorSelect={setSelectedColor} isMsx1Palette={currentScreenMode === "SCREEN 2 (Graphics I)"} />;
    }

    if (focused.assetType === 'screenmap' && focused.activeLayer === 'entities') {
      return (
        <EntityTypeListPanel
          entityTypes={entityTemplates}
          selectedEntityTypeId={currentEntityTypeToPlace?.id || null}
          onSelectEntityType={(template) => setCurrentEntityTypeToPlace(template as EntityTemplate | null)}
        />
      );
    }

    const paletteEditors = ['tile', 'sprite', 'screenmap', 'fonteditor', 'boss'];
    if (paletteEditors.includes(focused.assetType)) {
      return (
        <PalettePanel
          palette={currentScreenMode === "SCREEN 2 (Graphics I)" ? MSX1_PALETTE : MSX_SCREEN5_PALETTE}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          isMsx1Palette={currentScreenMode === "SCREEN 2 (Graphics I)"}
        />
      );
    }

    return null;
  };

  const renderEditorForWindow = (win: WindowState) => {
    const asset = assets.find(a => a.id === win.assetId);
    switch (win.assetType) {
        case 'tile': return asset && <TileEditor currentTile={asset.data as Tile} onUpdateCurrentTile={(data, newAssets) => handleUpdateAsset(asset.id, data, newAssets)} allTileAssets={assets.filter(a => a.type === 'tile')} onUpdateAllTileAssets={(newTiles) => setAssetsWithHistory(prev => [...prev.filter(a => a.type !== 'tile'), ...newTiles])} selectedColor={selectedColor} currentScreenMode={currentScreenMode} dataOutputFormat={dataOutputFormat} copiedTileData={copiedTileData} onCopyTileData={handleCopyTileData} setStatusBarMessage={setStatusBarMessage} />;
        case 'sprite': return asset && <SpriteEditor sprite={asset.data as Sprite} onUpdate={(data) => handleUpdateAsset(asset.id, data)} onSpriteImported={handleSpriteImported} onCreateSpriteFromFrame={handleCreateSpriteFromFrame} globalSelectedColor={selectedColor} dataOutputFormat={dataOutputFormat} allAssets={assets} currentScreenMode={currentScreenMode} onOpenSpriteSheetModal={() => setIsSpriteSheetModalOpen(true)} />;
        case 'boss': return asset && <BossEditor boss={asset.data as Boss} onUpdate={(data, newAssets) => handleUpdateAsset(asset.id, data, newAssets)} allAssets={assets} tileBanks={tileBanks} onNavigateToAsset={(assetId, assetType) => openWindow(assetId, assetType || 'unknown', 'Navigate')} onShowContextMenu={showContextMenu} currentScreenMode={currentScreenMode} />;
        case 'screenmap': return asset && <ScreenEditor screenMap={asset.data as ScreenMap} onUpdate={(data, newTilesToCreate) => { handleUpdateAsset(asset.id, data, newTilesToCreate);}} tileset={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} sprites={assets.filter(a => a.type === 'sprite')} selectedTileId={screenEditorSelectedTileId} setSelectedTileId={setScreenEditorSelectedTileId} currentEntityTypeToPlace={currentEntityTypeToPlace} currentScreenMode={currentScreenMode} tileBanks={tileBanks} msx1FontData={msxFont} msxFontColorAttributes={msxFontColorAttributes} dataOutputFormat={dataOutputFormat} selectedEntityInstanceId={selectedEntityInstanceId} onSelectEntityInstance={setSelectedEntityInstanceId} selectedEffectZoneId={selectedEffectZoneId} onSelectEffectZone={setSelectedEffectZoneId} copiedScreenBuffer={copiedScreenBuffer} setCopiedScreenBuffer={setCopiedScreenBuffer} allProjectAssets={assets} copiedLayerBuffer={copiedLayerBuffer} setCopiedLayerBuffer={setCopiedLayerBuffer} setStatusBarMessage={setStatusBarMessage} activeLayer={win.activeLayer} onActiveLayerChange={(layer) => updateWindowState(win.id, { activeLayer: layer })} componentDefinitions={componentDefinitions} entityTemplates={entityTemplates} onShowMapFile={handleShowMapFile} onNavigateToAsset={(assetId, assetType) => openWindow(assetId, assetType || 'unknown', 'Navigate')} onShowContextMenu={showContextMenu} waypointPickerState={waypointPickerState} onWaypointPicked={handleWaypointPicked} />;
        case 'code': return asset && <CodeEditor code={asset.data as string} onUpdate={(code) => handleUpdateAsset(asset.id, code)} language="z80" assetName={asset.name} snippetToInsert={snippetToInsert} />;
        case 'behavior': return asset && <BehaviorEditor behaviorScript={asset.data as BehaviorScript} onUpdate={(data) => handleUpdateAsset(asset.id, data)} userSnippets={userSnippets} onSnippetSelect={handleSnippetSelected} onAddSnippet={() => handleOpenSnippetEditor(null)} onEditSnippet={handleOpenSnippetEditor} onDeleteSnippet={handleDeleteSnippet} isSnippetsPanelEnabled={snippetsEnabled} />;
        case 'worldmap': return asset && <WorldMapEditor worldMapGraph={asset.data as WorldMapGraph} onUpdate={(data, newAssets) => handleUpdateAsset(asset.id, data, newAssets)} availableScreenMaps={assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap)} tileset={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} currentScreenMode={currentScreenMode} dataOutputFormat={dataOutputFormat} onNavigateToAsset={(assetId, assetType) => openWindow(assetId, assetType || 'unknown', 'Navigate')} onShowContextMenu={showContextMenu} setStatusBarMessage={setStatusBarMessage} />;
        case 'sound': return asset && <SoundEditor soundData={asset.data as PSGSoundData} onUpdate={(data) => handleUpdateAsset(asset.id, data)}/>;
        case 'track': return asset && <TrackerComposer songData={asset.data as TrackerSongData} onUpdate={(data) => handleUpdateAsset(asset.id, data)}/>;

        // System Editors
        case 'tilebanks': return <TileBankEditor tileBanks={tileBanks} onUpdateBanks={setTileBanks} allTiles={assets.filter(a => a.type === 'tile')} currentScreenMode={currentScreenMode}/>;
        case 'fonteditor': return <FontEditor fontData={msxFont} onUpdateFont={setMsxFont} fontColorAttributes={msxFontColorAttributes} onUpdateFontColorAttributes={setMsxFontColorAttributes} currentScreenMode={currentScreenMode} selectedColor={selectedColor as MSX1ColorValue} dataOutputFormat={dataOutputFormat}/>;
        case 'helpdocs': return <HelpDocsViewer helpDocsData={helpDocsData} />;
        case 'worldview': return <WorldViewEditor allWorldMapGraphs={allWorldMapGraphs} allScreenMaps={assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap)} allTiles={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} currentScreenMode={currentScreenMode} />;
        case 'componentdefinitioneditor': return <ComponentDefinitionEditor componentDefinitions={componentDefinitions} onUpdateComponentDefinitions={setComponentDefinitions} />;
        case 'entitytemplateeditor': return <EntityTemplateEditor entityTemplates={entityTemplates} onUpdateEntityTemplates={setEntityTemplates} componentDefinitions={componentDefinitions} onGenerateAsm={handleGenerateTemplatesAsm} allAssets={assets} />;
        case 'mainmenu': return <MainMenuEditor mainMenuConfig={mainMenuConfig} onUpdateMainMenuConfig={onUpdateMainMenuConfig} allAssets={assets} msxFont={msxFont} msxFontColorAttributes={msxFontColorAttributes} currentScreenMode={currentScreenMode} />;

        default: return <div className="p-4">Unknown asset type: {win.assetType}</div>;
    }
  };

  return (
    <ThemeProvider>
    <div className="flex flex-col h-screen bg-msx-bgcolor text-msx-textprimary font-sans">
      <Toolbar
        onNewProject={handleOpenNewProjectModal} 
        onNewAsset={handleNewAsset}
        onSaveProject={() => handleSaveProject()} 
        onSaveProjectAs={handleOpenSaveAsModal} 
        onLoadProject={() => fileLoadInputRef.current?.click()}
        onExportAllCodeFiles={handleExportAllCodeFiles} 
        onCompile={handleCompile}
        onDebug={() => setStatusBarMessage("Debug: Mock action. Implement debugger.")}
        onRun={() => setStatusBarMessage("Run: Mock action. Implement emulator integration.")}
        onOpenHelpDocs={() => openWindow(HELP_DOCS_SYSTEM_ASSET_ID, 'helpdocs', 'Help & Tutorials')}
        onOpenThemeSettings={() => setIsConfigModalOpen(true)}
        dataOutputFormat={dataOutputFormat}
        setDataOutputFormat={setDataOutputFormat}
        autosaveEnabled={autosaveEnabled}
        setAutosaveEnabled={setAutosaveEnabled}
        onSaveConfig={saveIdeConfig} 
        onResetConfig={resetIdeConfig}
        isAutosaving={isAutosaving}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isUndoDisabled={isUndoDisabled}
        isRedoDisabled={isRedoDisabled}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenComponentDefEditor={() => openWindow(COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, 'componentdefinitioneditor', 'Component Definitions')}
        onOpenEntityTemplateEditor={() => openWindow(ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, 'entitytemplateeditor', 'Entity Templates')}
        onCompressAllDataFiles={() => setIsCompressDataModalOpen(true)}
        onCompileAndRun={() => setStatusBarMessage("Compile and Run: Mock Action")}
        onCompressExportCompileRun={() => setStatusBarMessage("Compress, Export, Compile, Run: Mock Action")}
        onConfigureASM={() => alert("Configure ASM Compiler: Mock Action")}
        onConfigureEmulator={() => alert("Configure MSX Emulator: Mock Action")}
      />
      <input type="file" accept=".json" ref={fileLoadInputRef} onChange={handleLoadProject} style={{ display: 'none' }} />

      <div className="flex-grow flex overflow-hidden">
        <FileExplorerPanel 
            className="w-60 flex-shrink-0"
            assets={assets} 
            selectedAssetId={selectedAssetId} 
            onRequestRename={memoizedOnRequestRename} 
            showTileBanksEntry={currentScreenMode === "SCREEN 2 (Graphics I)"} 
            isTileBanksActive={windows.some(w => w.isVisible && w.id === TILE_BANKS_SYSTEM_ASSET_ID)}
            isFontEditorActive={windows.some(w => w.isVisible && w.id === FONT_EDITOR_SYSTEM_ASSET_ID)}
            isHelpDocsActive={windows.some(w => w.isVisible && w.id === HELP_DOCS_SYSTEM_ASSET_ID)}
            isComponentDefEditorActive={windows.some(w => w.isVisible && w.id === COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID)}
            isEntityTemplateEditorActive={windows.some(w => w.isVisible && w.id === ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID)}
            isWorldViewActive={windows.some(w => w.isVisible && w.id === WORLD_VIEW_SYSTEM_ASSET_ID)}
            isMainMenuActive={windows.some(w => w.isVisible && w.id === MAIN_MENU_SYSTEM_ASSET_ID)}
            onRequestDelete={handleDeleteAsset} 
        />
        
        <div className="flex-grow flex flex-col relative" role="main">
          {windows.length === 0 && <Panel title="Welcome to MSX Retro IDE"><p className="p-4 text-center text-msx-textsecondary">Select an asset or create a new one to start editing.</p></Panel>}
          {windows.map(win => (
            <Window key={win.id} window={win}>
              {renderEditorForWindow(win)}
            </Window>
          ))}
        </div>

        <div className="w-64 flex-shrink-0 flex flex-col">
         {renderRightPanelContent()}
          <PropertiesPanel 
            asset={focusedWindow ? assets.find(a => a.id === focusedWindow.assetId) : undefined}
            entityInstance={selectedEntityInstance}
            effectZone={selectedEffectZone} 
            onUpdateEntityInstance={(id, data) => { 
                if (activeScreenMapAsset) { 
                  const updatedEntities = activeScreenMapAsset.layers.entities.map(e => 
                    e.id === id ? { ...e, ...data, componentOverrides: { ...e.componentOverrides, ...data.componentOverrides } } : e 
                  ); 
                  handleUpdateAsset(activeScreenMapAsset.id, { layers: { ...activeScreenMapAsset.layers, entities: updatedEntities }});
                }
            }}
            onUpdateEffectZone={(id, data) => { 
                if (activeScreenMapAsset) {
                    const updatedEffectZones = (activeScreenMapAsset.effectZones || []).map(ez => 
                        ez.id === id ? { ...ez, ...data } : ez
                    );
                    handleUpdateAsset(activeScreenMapAsset.id, { effectZones: updatedEffectZones });
                }
            }}
            onDeleteEntityInstance={handleDeleteEntityInstance}
            onDeleteEffectZone={(idToDelete) => { 
                if (activeScreenMapAsset) {
                    const updatedEffectZones = (activeScreenMapAsset.effectZones || []).filter(ez => ez.id !== idToDelete);
                    handleUpdateAsset(activeScreenMapAsset.id, { effectZones: updatedEffectZones });
                    setSelectedEffectZoneId(null);
                }
            }}
            spriteForPreview={focusedWindow?.assetType === 'sprite' ? assets.find(a => a.id === focusedWindow.assetId)?.data as Sprite : undefined}
            allAssets={assets}
            componentDefinitions={componentDefinitions} 
            entityTemplates={entityTemplates}         
            currentScreenMode={currentScreenMode}
            activeEditorType={activeEditorType as any}
            screenEditorActiveLayer={focusedWindow?.activeLayer}
            msxFontName={currentLoadedFontName}
            msxFontStats={getFontStats()}
            screenEditorSelectedTileId={screenEditorSelectedTileId}
            tilesetForScreenEditor={allTileAssetsData}
            tileBanksForScreenEditor={tileBanks}
            waypointPickerState={waypointPickerState}
            onSetWaypointPickerState={setWaypointPickerState}
          />
        </div>
      </div>
      <StatusBar message={statusBarMessage} details={currentProjectName || focusedWindow?.title} />
      {contextMenu && <ContextMenu {...contextMenu} onClose={closeContextMenu} />}
      {isAboutModalOpen && <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />}
      {isConfigModalOpen && <ConfigTabModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} />}
      {isRenameModalOpen && assetToRenameInfo && ( <RenameModal isOpen={isRenameModalOpen} assetId={assetToRenameInfo.id} currentName={assetToRenameInfo.currentName} assetType={assetToRenameInfo.type} onConfirm={handleConfirmRename} onClose={handleCancelRename}/>)}
      {isSaveAsModalOpen && ( <SaveAsModal isOpen={isSaveAsModalOpen} currentName={currentProjectName || "msx_ide_project"} onConfirm={handleConfirmSaveAsProjectAs} onClose={() => setIsSaveAsModalOpen(false)}/>)}
      {isNewProjectModalOpen && ( <NewProjectModal isOpen={isNewProjectModalOpen} onConfirm={handleConfirmNewProject} onClose={() => setIsNewProjectModalOpen(false)}/>)}
      {isSnippetEditorModalOpen && ( <SnippetEditorModal isOpen={isSnippetEditorModalOpen} onClose={() => { setIsSnippetEditorModalOpen(false); setEditingSnippet(null); }} onSave={handleSaveSnippet} editingSnippet={editingSnippet} allAssets={assets} tileBanks={tileBanks} />)}
      {isConfirmModalOpen && confirmModalProps && ( <ConfirmationModal isOpen={isConfirmModalOpen} title={confirmModalProps.title} message={confirmModalProps.message} onConfirm={confirmModalProps.onConfirm} onCancel={() => { setIsConfirmModalOpen(false); setConfirmModalProps(null);}} confirmText={confirmModalProps.confirmText} cancelText={confirmModalProps.cancelText} confirmButtonVariant={confirmModalProps.confirmButtonVariant}/>)}
      {screenMapForHudModal && focusedWindow?.assetType === 'screenmap' &&
         <HUDEditorModal 
            isOpen={false} 
            onClose={() => { }} 
            hudConfiguration={screenMapForHudModal.hudConfiguration || { elements: [] }} 
            onUpdateHUDConfiguration={(newConfig) => handleUpdateAsset(screenMapForHudModal.id, { hudConfiguration: newConfig })}
            currentScreenMode={currentScreenMode}
            screenMapWidth={screenMapForHudModal.width}
            screenMapHeight={screenMapForHudModal.height}
            screenMapActiveAreaX={screenMapForHudModal.activeAreaX ?? 0}
            screenMapActiveAreaY={screenMapForHudModal.activeAreaY ?? 0}
            screenMapActiveAreaWidth={screenMapForHudModal.activeAreaWidth ?? screenMapForHudModal.width}
            screenMapActiveAreaHeight={screenMapForHudModal.activeAreaHeight ?? screenMapForHudModal.height}
            baseCellDimension={EDITOR_BASE_TILE_DIM_S2}
            msxFont={msxFont}
            msxFontColorAttributes={msxFontColorAttributes}
         />
      }
       {isSpriteSheetModalOpen && (
        <SpriteSheetReorderModal
            isOpen={isSpriteSheetModalOpen}
            onClose={() => setIsSpriteSheetModalOpen(false)}
            sprites={assets.filter(a => a.type === 'sprite')}
            onUpdateOrder={handleUpdateSpriteOrder}
            allAssets={assets}
            currentScreenMode={currentScreenMode}
            onOpenFramesModal={handleOpenSpriteFramesModal}
        />
      )}
      {isSpriteFramesModalOpen && (
        <SpriteFramesModal
            isOpen={isSpriteFramesModalOpen}
            onClose={() => {
                setIsSpriteFramesModalOpen(false);
                setSpriteForFramesModal(null);
            }}
            onSplit={handleSplitFrames}
            spriteAsset={spriteForFramesModal}
        />
      )}
      {isCompressDataModalOpen && (
        <CompressDataModal
          isOpen={isCompressDataModalOpen}
          onClose={() => setIsCompressDataModalOpen(false)}
          assets={dataAssets}
          onCompress={(selectedAssetIds) => {
            console.log('Selected assets for compression:', selectedAssetIds);
            setStatusBarMessage(`Compression requested for ${selectedAssetIds.length} assets.`);
          }}
        />
      )}
    </div>
    </ThemeProvider>
  );
};