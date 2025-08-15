import React from 'react';
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

// A massive props interface to pass everything down from the container App.tsx
interface AppUIProps {
  currentEditor: EditorType;
  assets: ProjectAsset[];
  selectedAssetId: string | null;
  currentProjectName: string | null;
  currentScreenMode: string;
  statusBarMessage: string;
  selectedColor: MSXColorValue;
  screenEditorSelectedTileId: string | null;
  currentScreenEditorActiveLayer: ScreenEditorLayerName;
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
  setCurrentEditor: React.Dispatch<React.SetStateAction<EditorType>>;
  setAssets: React.Dispatch<React.SetStateAction<ProjectAsset[]>>;
  setSelectedAssetId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentProjectName: React.Dispatch<React.SetStateAction<string | null>>;
  setStatusBarMessage: React.Dispatch<React.SetStateAction<string>>;
  setSelectedColor: React.Dispatch<React.SetStateAction<MSXColorValue>>;
  setScreenEditorSelectedTileId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentScreenEditorActiveLayer: React.Dispatch<React.SetStateAction<ScreenEditorLayerName>>;
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
  memoizedHandleSelectAsset: (assetId: string | null, editorTypeOverride?: EditorType) => void;
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
        currentEditor, assets, selectedAssetId, currentProjectName, currentScreenMode, statusBarMessage, selectedColor, screenEditorSelectedTileId, currentScreenEditorActiveLayer, componentDefinitions, entityTemplates, mainMenuConfig, currentEntityTypeToPlace, selectedEntityInstanceId, selectedEffectZoneId, isRenameModalOpen, assetToRenameInfo, isSaveAsModalOpen, isNewProjectModalOpen, isAboutModalOpen, isCompressDataModalOpen, isConfirmModalOpen, confirmModalProps, tileBanks, msxFont, msxFontColorAttributes, currentLoadedFontName, helpDocsData, dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled, isConfigModalOpen, isSpriteSheetModalOpen, isSpriteFramesModalOpen, spriteForFramesModal, snippetToInsert, userSnippets, isSnippetEditorModalOpen, editingSnippet, isAutosaving, history, copiedScreenBuffer, copiedTileData, copiedLayerBuffer, contextMenu, waypointPickerState,
        
        setCurrentEditor, setSelectedAssetId, setStatusBarMessage, setSelectedColor, setScreenEditorSelectedTileId, setCurrentScreenEditorActiveLayer, setCurrentEntityTypeToPlace, setSelectedEntityInstanceId, setSelectedEffectZoneId, setIsRenameModalOpen, setAssetToRenameInfo, setIsSaveAsModalOpen, setIsNewProjectModalOpen, setIsAboutModalOpen, setIsCompressDataModalOpen, setIsConfirmModalOpen, setConfirmModalProps, setComponentDefinitions, setEntityTemplates, onUpdateMainMenuConfig, setTileBanks, setMsxFont, setMsxFontColorAttributes, setDataOutputFormat, setAutosaveEnabled, setIsConfigModalOpen, setIsSpriteSheetModalOpen, setIsSpriteFramesModalOpen, setSpriteForFramesModal, setUserSnippets, setIsSnippetEditorModalOpen, setEditingSnippet, setCopiedScreenBuffer, setCopiedLayerBuffer, setContextMenu, setWaypointPickerState, handleUpdateSpriteOrder, handleOpenSpriteFramesModal, handleSplitFrames, handleCreateSpriteFromFrame, handleWaypointPicked, showContextMenu, closeContextMenu, setAssetsWithHistory, handleUpdateAsset, handleOpenSnippetEditor, handleSaveSnippet, handleDeleteSnippet, handleSnippetSelected, saveIdeConfig, resetIdeConfig, handleOpenNewProjectModal, handleConfirmNewProject, handleNewAsset, handleSpriteImported, memoizedHandleSelectAsset, memoizedOnRequestRename, handleConfirmRename, handleCancelRename, handleDeleteAsset, handleOpenSaveAsModal, handleSaveProject, handleConfirmSaveAsProjectAs, handleLoadProject, fileLoadInputRef, handleDeleteEntityInstance, handleShowMapFile, handleUndo, handleRedo, handleExportAllCodeFiles, handleCopyTileData, handleGenerateTemplatesAsm
    } = props;

  const activeAsset = assets.find(a => a.id === selectedAssetId);
  const activeScreenMapAsset = activeAsset?.type === 'screenmap' ? activeAsset.data as ScreenMap : undefined;
  
  const selectedEntityInstance = activeScreenMapAsset?.layers.entities.find(e => e.id === selectedEntityInstanceId);
  const selectedEffectZone = activeScreenMapAsset?.effectZones?.find(ez => ez.id === selectedEffectZoneId); 

  const getFontStats = () => { const defined = Object.keys(msxFont).length; const editableTotal = EDITABLE_CHAR_CODES_SUBSET.length; const editableDefined = EDITABLE_CHAR_CODES_SUBSET.filter(ec => msxFont[ec.code] !== undefined).length; return { defined, editableTotal, editableDefined };};
  const screenMapForHudModal = assets.find(a => a.id === selectedAssetId && a.type === 'screenmap')?.data as ScreenMap | undefined;

  const allTileAssetsData = assets.filter(a => a.type === 'tile').map(a => a.data as Tile);
  
  const isUndoDisabled = history.undoStack.length === 0 || [EditorType.HelpDocs, EditorType.WorldView].includes(currentEditor);
  const isRedoDisabled = history.redoStack.length === 0 || [EditorType.HelpDocs, EditorType.WorldView].includes(currentEditor);

  const allWorldMapGraphs = React.useMemo(() => assets
    .filter(a => a.type === 'worldmap' && a.data)
    .map(a => a.data as WorldMapGraph), [assets]);

  const dataAssets = assets.filter(a =>
    ['tile', 'sprite', 'screenmap', 'sound', 'track'].includes(a.type)
  );

  const renderRightPanelContent = () => {
    if (currentEditor === EditorType.Screen && currentScreenEditorActiveLayer === 'entities') {
      return (
        <EntityTypeListPanel
          entityTypes={entityTemplates}
          selectedEntityTypeId={currentEntityTypeToPlace?.id || null}
          onSelectEntityType={(template) => setCurrentEntityTypeToPlace(template as EntityTemplate | null)}
        />
      );
    }
    const paletteEditors = [EditorType.Tile, EditorType.Sprite, EditorType.Screen, EditorType.Font, EditorType.Boss];
    if (paletteEditors.includes(currentEditor) || (currentEditor === EditorType.None && selectedAssetId === null) ) {
      if (currentEditor === EditorType.Screen && currentScreenEditorActiveLayer === 'entities') {
        return null;
      }
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
        onCompile={() => setStatusBarMessage("Compile: Mock action. Implement actual compilation.")}
        onDebug={() => setStatusBarMessage("Debug: Mock action. Implement debugger.")}
        onRun={() => setStatusBarMessage("Run: Mock action. Implement emulator integration.")}
        onOpenHelpDocs={() => memoizedHandleSelectAsset(HELP_DOCS_SYSTEM_ASSET_ID, EditorType.HelpDocs)}
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
        onOpenComponentDefEditor={() => memoizedHandleSelectAsset(COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, EditorType.ComponentDefinitionEditor)}
        onOpenEntityTemplateEditor={() => memoizedHandleSelectAsset(ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, EditorType.EntityTemplateEditor)}
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
            onSelectAsset={memoizedHandleSelectAsset} 
            onRequestRename={memoizedOnRequestRename} 
            showTileBanksEntry={currentScreenMode === "SCREEN 2 (Graphics I)"} 
            isTileBanksActive={currentEditor === EditorType.TileBanks} 
            isFontEditorActive={currentEditor === EditorType.Font} 
            isHelpDocsActive={currentEditor === EditorType.HelpDocs}
            isComponentDefEditorActive={currentEditor === EditorType.ComponentDefinitionEditor}
            isEntityTemplateEditorActive={currentEditor === EditorType.EntityTemplateEditor}
            isWorldViewActive={currentEditor === EditorType.WorldView}
            isMainMenuActive={currentEditor === EditorType.MainMenu}
            onRequestDelete={handleDeleteAsset} 
        />
        
        <div className="flex-grow flex flex-col" role="main">
          {currentEditor === EditorType.None && <Panel title="Welcome to MSX Retro IDE"><p className="p-4 text-center text-msx-textsecondary">Select an asset or create a new one to start editing.</p></Panel>}
          
          {currentEditor === EditorType.Tile && activeAsset?.type === 'tile' && ( <TileEditor currentTile={activeAsset.data as Tile} onUpdateCurrentTile={(data, newAssets) => handleUpdateAsset(activeAsset.id, data, newAssets)} allTileAssets={assets.filter(a => a.type === 'tile')} onUpdateAllTileAssets={(newTiles) => setAssetsWithHistory(prev => [...prev.filter(a => a.type !== 'tile'), ...newTiles])} selectedColor={selectedColor} currentScreenMode={currentScreenMode} dataOutputFormat={dataOutputFormat} copiedTileData={copiedTileData} onCopyTileData={handleCopyTileData} setStatusBarMessage={setStatusBarMessage} />)}
          {currentEditor === EditorType.Sprite && activeAsset?.type === 'sprite' && ( <SpriteEditor sprite={activeAsset.data as Sprite} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)} onSpriteImported={handleSpriteImported} onCreateSpriteFromFrame={handleCreateSpriteFromFrame} globalSelectedColor={selectedColor} dataOutputFormat={dataOutputFormat} allAssets={assets} currentScreenMode={currentScreenMode} onOpenSpriteSheetModal={() => setIsSpriteSheetModalOpen(true)} />)}
          {currentEditor === EditorType.Boss && activeAsset?.type === 'boss' && ( <BossEditor boss={activeAsset.data as Boss} onUpdate={(data, newAssets) => handleUpdateAsset(activeAsset.id, data, newAssets)} allAssets={assets} tileBanks={tileBanks} onNavigateToAsset={memoizedHandleSelectAsset} onShowContextMenu={showContextMenu} currentScreenMode={currentScreenMode} /> )}
          {currentEditor === EditorType.Screen && activeAsset?.type === 'screenmap' && ( <ScreenEditor screenMap={activeAsset.data as ScreenMap} onUpdate={(data, newTilesToCreate) => { if (data.layers?.entities === undefined && (activeAsset.data as ScreenMap).layers.entities) { (data as Partial<ScreenMap>).layers = { ... (activeAsset.data as ScreenMap).layers, ...data.layers, entities: (activeAsset.data as ScreenMap).layers.entities };} if(data.effectZones === undefined && (activeAsset.data as ScreenMap).effectZones) { (data as Partial<ScreenMap>).effectZones = (activeAsset.data as ScreenMap).effectZones;} handleUpdateAsset(activeAsset.id, data, newTilesToCreate);}} tileset={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} sprites={assets.filter(a => a.type === 'sprite')} selectedTileId={screenEditorSelectedTileId} setSelectedTileId={setScreenEditorSelectedTileId} currentEntityTypeToPlace={currentEntityTypeToPlace} currentScreenMode={currentScreenMode} tileBanks={tileBanks} msx1FontData={msxFont} msxFontColorAttributes={msxFontColorAttributes} dataOutputFormat={dataOutputFormat} selectedEntityInstanceId={selectedEntityInstanceId} onSelectEntityInstance={setSelectedEntityInstanceId} selectedEffectZoneId={selectedEffectZoneId} onSelectEffectZone={setSelectedEffectZoneId} copiedScreenBuffer={copiedScreenBuffer} setCopiedScreenBuffer={setCopiedScreenBuffer} allProjectAssets={assets} copiedLayerBuffer={copiedLayerBuffer} setCopiedLayerBuffer={setCopiedLayerBuffer} setStatusBarMessage={setStatusBarMessage} onActiveLayerChange={setCurrentScreenEditorActiveLayer} componentDefinitions={componentDefinitions} entityTemplates={entityTemplates} onShowMapFile={handleShowMapFile} onNavigateToAsset={memoizedHandleSelectAsset} onShowContextMenu={showContextMenu} waypointPickerState={waypointPickerState} onWaypointPicked={handleWaypointPicked} />)}
          {currentEditor === EditorType.Code && activeAsset?.type === 'code' && ( <div className="flex flex-grow h-full overflow-hidden"> <div className="flex-grow h-full"> <CodeEditor code={activeAsset.data as string} onUpdate={(code) => handleUpdateAsset(activeAsset.id, code)} language="z80" assetName={activeAsset.name} snippetToInsert={snippetToInsert} /> </div> {snippetsEnabled && ( <SnippetsPanel snippets={userSnippets.filter(s => !Z80_BEHAVIOR_SNIPPETS.find(bs => bs.name === s.name))} onSnippetSelect={handleSnippetSelected} isEnabled={true} onAddSnippet={() => handleOpenSnippetEditor(null)} onEditSnippet={handleOpenSnippetEditor} onDeleteSnippet={handleDeleteSnippet}/>)}</div>)}
          {currentEditor === EditorType.BehaviorEditor && activeAsset?.type === 'behavior' && ( <BehaviorEditor behaviorScript={activeAsset.data as BehaviorScript} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)} userSnippets={userSnippets} onSnippetSelect={handleSnippetSelected} onAddSnippet={() => handleOpenSnippetEditor(null)} onEditSnippet={handleOpenSnippetEditor} onDeleteSnippet={handleDeleteSnippet} isSnippetsPanelEnabled={snippetsEnabled} /> )}
          {currentEditor === EditorType.WorldMap && activeAsset?.type === 'worldmap' && ( <WorldMapEditor worldMapGraph={activeAsset.data as WorldMapGraph} onUpdate={(data, newAssets) => handleUpdateAsset(activeAsset.id, data, newAssets)} availableScreenMaps={assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap)} tileset={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} currentScreenMode={currentScreenMode} dataOutputFormat={dataOutputFormat} onNavigateToAsset={memoizedHandleSelectAsset} onShowContextMenu={showContextMenu} setStatusBarMessage={setStatusBarMessage} />)}
          {currentEditor === EditorType.WorldView && ( <WorldViewEditor allWorldMapGraphs={allWorldMapGraphs} allScreenMaps={assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap)} allTiles={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} currentScreenMode={currentScreenMode} /> )}
          {currentEditor === EditorType.Sound && activeAsset?.type === 'sound' && ( <SoundEditor soundData={activeAsset.data as PSGSoundData} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}/>)}
          {currentEditor === EditorType.Track && activeAsset?.type === 'track' && ( <TrackerComposer songData={activeAsset.data as TrackerSongData} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}/>)}
          {currentEditor === EditorType.TileBanks && ( <TileBankEditor tileBanks={tileBanks} onUpdateBanks={setTileBanks} allTiles={assets.filter(a => a.type === 'tile')} currentScreenMode={currentScreenMode}/>)}
          {currentEditor === EditorType.Font && ( <FontEditor fontData={msxFont} onUpdateFont={setMsxFont} fontColorAttributes={msxFontColorAttributes} onUpdateFontColorAttributes={setMsxFontColorAttributes} currentScreenMode={currentScreenMode} selectedColor={selectedColor as MSX1ColorValue} dataOutputFormat={dataOutputFormat}/>)}
          {currentEditor === EditorType.HelpDocs && ( <HelpDocsViewer helpDocsData={helpDocsData} /> )}
           
           {currentEditor === EditorType.ComponentDefinitionEditor && <ComponentDefinitionEditor componentDefinitions={componentDefinitions} onUpdateComponentDefinitions={setComponentDefinitions} />}
           {currentEditor === EditorType.EntityTemplateEditor && <EntityTemplateEditor entityTemplates={entityTemplates} onUpdateEntityTemplates={setEntityTemplates} componentDefinitions={componentDefinitions} onGenerateAsm={handleGenerateTemplatesAsm} allAssets={assets} />}
           {currentEditor === EditorType.MainMenu && (
             <MainMenuEditor
                mainMenuConfig={mainMenuConfig}
                onUpdateMainMenuConfig={onUpdateMainMenuConfig}
                allAssets={assets}
                msxFont={msxFont}
                msxFontColorAttributes={msxFontColorAttributes}
                currentScreenMode={currentScreenMode}
             />
           )}
        </div>

        <div className="w-64 flex-shrink-0 flex flex-col">
         {renderRightPanelContent()}
          <PropertiesPanel 
            asset={currentEditor === EditorType.Font || currentEditor === EditorType.HelpDocs || currentEditor === EditorType.BehaviorEditor || currentEditor === EditorType.ComponentDefinitionEditor || currentEditor === EditorType.EntityTemplateEditor ? undefined : activeAsset}
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
            spriteForPreview={activeAsset?.type === 'sprite' ? activeAsset.data as Sprite : undefined}
            allAssets={assets}
            componentDefinitions={componentDefinitions} 
            entityTemplates={entityTemplates}         
            currentScreenMode={currentScreenMode}
            activeEditorType={currentEditor}
            screenEditorActiveLayer={currentEditor === EditorType.Screen ? currentScreenEditorActiveLayer : undefined}
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
      <StatusBar message={statusBarMessage} details={currentProjectName || activeAsset?.name} />
      {contextMenu && <ContextMenu {...contextMenu} onClose={closeContextMenu} />}
      {isAboutModalOpen && <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />}
      {isConfigModalOpen && <ConfigTabModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} />}
      {isRenameModalOpen && assetToRenameInfo && ( <RenameModal isOpen={isRenameModalOpen} assetId={assetToRenameInfo.id} currentName={assetToRenameInfo.currentName} assetType={assetToRenameInfo.type} onConfirm={handleConfirmRename} onClose={handleCancelRename}/>)}
      {isSaveAsModalOpen && ( <SaveAsModal isOpen={isSaveAsModalOpen} currentName={currentProjectName || "msx_ide_project"} onConfirm={handleConfirmSaveAsProjectAs} onClose={() => setIsSaveAsModalOpen(false)}/>)}
      {isNewProjectModalOpen && ( <NewProjectModal isOpen={isNewProjectModalOpen} onConfirm={handleConfirmNewProject} onClose={() => setIsNewProjectModalOpen(false)}/>)}
      {isSnippetEditorModalOpen && ( <SnippetEditorModal isOpen={isSnippetEditorModalOpen} onClose={() => { setIsSnippetEditorModalOpen(false); setEditingSnippet(null); }} onSave={handleSaveSnippet} editingSnippet={editingSnippet} allAssets={assets} tileBanks={tileBanks} />)}
      {isConfirmModalOpen && confirmModalProps && ( <ConfirmationModal isOpen={isConfirmModalOpen} title={confirmModalProps.title} message={confirmModalProps.message} onConfirm={confirmModalProps.onConfirm} onCancel={() => { setIsConfirmModalOpen(false); setConfirmModalProps(null);}} confirmText={confirmModalProps.confirmText} cancelText={confirmModalProps.cancelText} confirmButtonVariant={confirmModalProps.confirmButtonVariant}/>)}
      {screenMapForHudModal && currentEditor === EditorType.Screen && 
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