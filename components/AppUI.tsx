import React, { useCallback, useState, useEffect } from 'react';
import { 
  EditorType, ProjectAsset, Tile, Sprite, ScreenMap, MSXColorValue, SpriteFrame, PixelData, 
  LineColorAttribute, MSX1ColorValue, WorldMapGraph, PSGSoundData, 
  TrackerSongData, HUDConfiguration, TileBank, MSXFont,
  MSXFontColorAttributes, MSXFontAsset, DataFormat,
  Snippet, EntityInstance, MockEntityType, HelpDocSection, BehaviorScript,
  CopiedScreenData, CopiedLayerData, EffectZone, ScreenEditorLayerName, 
  ComponentDefinition, EntityTemplate, ContextMenuItem,
  Boss, Point, HistoryState, WaypointPickerState, CopiedTileData, MainMenuConfig, GameFlowGraph, CopiedBossPhaseData
} from '../types';
import { 
  MSX_SCREEN5_PALETTE, MSX1_PALETTE,
  DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR,
  DEFAULT_HELP_DOCS_DATA, HELP_DOCS_SYSTEM_ASSET_ID,
  Z80_BEHAVIOR_SNIPPETS, Z80_SNIPPETS as DEFAULT_Z80_SNIPPETS, EDITOR_BASE_TILE_DIM_S2
} from '../constants';
import { ensureScreen5PaletteSlots, screen5SlotsToMsxColors } from '../utils/screen5PaletteUtils';
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
import { GlobalVariablesEditor } from './editors/GlobalVariablesEditor';
import { PaletteEditor } from './editors/PaletteEditor';
import { MainMenuEditor } from './editors/MainMenuEditor';
import { GameFlowEditor } from './editors/GameFlowEditor';
import { StateMachineEditor } from './editors/StateMachineEditor';
import { FileExplorerPanel, TILE_BANKS_SYSTEM_ASSET_ID, COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, WORLD_VIEW_SYSTEM_ASSET_ID, GAME_FLOW_SYSTEM_ASSET_ID } from './tools/FileExplorerPanel';
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
// OBSOLETO: import { CompressDataModal } from './modals/CompressDataModal';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ConfigTabModal } from './theme_config/ConfigTabModal';
import { Panel } from './common/Panel';
import { Button } from './common/Button';
import { HUDEditorModal } from './editors/HUDEditorModal';
import { ContextMenu } from './common/ContextMenu';
import { CodeExportModal } from './modals/CodeExportModal';

/**
 * Props for the main AppUI component.
 * This interface aggregates all the state and handlers from the main App container
 * and passes them down to the various UI components. It includes the current editor,
 * project assets, selected items, modal states, and all the callback functions
 * for handling user interactions.
 */
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
  selectedGameFlowNodeId: string | null;
  isRenameModalOpen: boolean;
  assetToRenameInfo: { id: string; currentName: string; type: ProjectAsset['type']; } | null;
  isSaveAsModalOpen: boolean;
  isNewProjectModalOpen: boolean;
  isAboutModalOpen: boolean;
  /** @deprecated OBSOLETO - eliminado junto con menú Run en v0.267 */
  isCompressDataModalOpen?: boolean;
  isCodeExportModalOpen: boolean;
  isConfirmModalOpen: boolean;
  confirmModalProps: { title: string; message: string | React.ReactNode; onConfirm: () => void; confirmText?: string; cancelText?: string; confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'; } | null;
  tileBanks: TileBank[];
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  currentLoadedFontName: string;
  helpDocsData: HelpDocSection[];
  dataOutputFormat: DataFormat;
  autosaveEnabled: boolean;
  saveBossZoom: boolean;
  saveSpriteZoom: boolean;
  saveTileZoom: boolean;
  saveScreenZoom: boolean;
  showSectorLines: boolean;
  saveSectorLines: boolean;
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
  copiedBossPhase: CopiedBossPhaseData | null;
  contextMenu: { isOpen: boolean; position: { x: number; y: number; }; items: ContextMenuItem[]; } | null;
  waypointPickerState: WaypointPickerState;

  onUpdateMainMenuConfig: (updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => void;
  onRequestSaveTile: (assetId: string) => void;
  onRequestSaveTrack: (assetId: string) => void;
  onImportTrack: (trackData: any, fileName: string) => void;
  onRequestLoadTile: (assetId: string) => void;
  onRequestSaveSelectedTiles: (assetIds: string[]) => void;
  onSelectAsset: (assetId: string | null, editorTypeOverride?: EditorType) => void;

  // Setters and handlers
  setCopiedBossPhase: React.Dispatch<React.SetStateAction<CopiedBossPhaseData | null>>;
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
  setSelectedGameFlowNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsRenameModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAssetToRenameInfo: React.Dispatch<React.SetStateAction<{ id: string; currentName: string; type: ProjectAsset['type']; } | null>>;
  setIsSaveAsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNewProjectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAboutModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** @deprecated OBSOLETO - eliminado junto con menú Run en v0.267 */
  setIsCompressDataModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCodeExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModalProps: React.Dispatch<React.SetStateAction<{ title: string; message: string | React.ReactNode; onConfirm: () => void; confirmText?: string; cancelText?: string; confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'; } | null>>;
  setTileBanks: (updater: TileBank[] | ((prev: TileBank[]) => TileBank[])) => void;
  setMsxFont: (updater: MSXFont | ((prev: MSXFont) => MSXFont)) => void;
  setMsxFontColorAttributes: (updater: MSXFontColorAttributes | ((prev: MSXFontColorAttributes) => MSXFontColorAttributes)) => void;
  setDataOutputFormat: React.Dispatch<React.SetStateAction<DataFormat>>;
  setAutosaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveBossZoom: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveSpriteZoom: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveTileZoom: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveScreenZoom: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSectorLines: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveSectorLines: React.Dispatch<React.SetStateAction<boolean>>;
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
  handleReorderSpriteFrames: (spriteAssetId: string, reorderedFrames: SpriteFrame[]) => void;
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
  handleConfirmNewProject: (projectNameFromModal: string, screenMode: string) => void;
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
  handleOpenRecentProject: (path: string) => void;
  fileLoadInputRef: React.RefObject<HTMLInputElement>;
  handleDeleteEntityInstance: (entityIdToDelete: string) => void;
  handleShowMapFile: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  /** @deprecated OBSOLETO - eliminado junto con menú Run en v0.267 */
  handleExportAllCodeFiles?: () => void;
  handleExportIntermediateGameJson: () => void;
  handleCopyTileData: (tileToCopy: Tile) => void;
  handleGenerateTemplatesAsm: () => void;
  isToggleEditorDisabled: boolean;
  onToggleEditor: () => void;
  bossEditorZoom: number;
  setBossEditorZoom: React.Dispatch<React.SetStateAction<number>>;
  tileEditorZoom: number;
  setTileEditorZoom: React.Dispatch<React.SetStateAction<number>>;
  screenEditorZoom: number;
  setScreenEditorZoom: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * The main UI component for the MSX Retro IDE.
 * This component is responsible for laying out the entire application interface,
 * including the toolbar, file explorer, main editor area, properties panel,
 * and all modals. It acts as a pure presentation component, receiving all
 * state and event handlers as props from a container component.
 */
export const AppUI: React.FC<AppUIProps> = (props) => {
    const {
        currentEditor, assets, selectedAssetId, currentProjectName, currentScreenMode, statusBarMessage, selectedColor, screenEditorSelectedTileId, currentScreenEditorActiveLayer, componentDefinitions, entityTemplates, mainMenuConfig, currentEntityTypeToPlace, selectedEntityInstanceId, selectedEffectZoneId, selectedGameFlowNodeId, isRenameModalOpen, assetToRenameInfo, isSaveAsModalOpen, isNewProjectModalOpen, isAboutModalOpen, isCompressDataModalOpen, isCodeExportModalOpen, isConfirmModalOpen, confirmModalProps, tileBanks, msxFont, msxFontColorAttributes, currentLoadedFontName, helpDocsData, dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled, isConfigModalOpen, isSpriteSheetModalOpen, isSpriteFramesModalOpen, spriteForFramesModal, snippetToInsert, userSnippets, isSnippetEditorModalOpen, editingSnippet, isAutosaving, history, copiedScreenBuffer, copiedTileData, copiedLayerBuffer, copiedBossPhase, contextMenu, waypointPickerState,
        
        setCopiedBossPhase, setCurrentEditor, setSelectedAssetId, setStatusBarMessage, setSelectedColor, setScreenEditorSelectedTileId, setCurrentScreenEditorActiveLayer, setCurrentEntityTypeToPlace, setSelectedEntityInstanceId, setSelectedEffectZoneId, setSelectedGameFlowNodeId, setIsRenameModalOpen, setAssetToRenameInfo, setIsSaveAsModalOpen, setIsNewProjectModalOpen, setIsAboutModalOpen, setIsCompressDataModalOpen, setIsCodeExportModalOpen, setIsConfirmModalOpen, setConfirmModalProps, setComponentDefinitions, setEntityTemplates, onUpdateMainMenuConfig, setTileBanks, setMsxFont, setMsxFontColorAttributes, setDataOutputFormat, setAutosaveEnabled, setIsConfigModalOpen, setIsSpriteSheetModalOpen, setIsSpriteFramesModalOpen, setSpriteForFramesModal, setUserSnippets, setIsSnippetEditorModalOpen, setEditingSnippet, setCopiedScreenBuffer, setCopiedLayerBuffer, setContextMenu, setWaypointPickerState, handleUpdateSpriteOrder, handleReorderSpriteFrames, handleOpenSpriteFramesModal, handleSplitFrames, handleCreateSpriteFromFrame, handleWaypointPicked, showContextMenu, closeContextMenu, setAssetsWithHistory, handleUpdateAsset, handleOpenSnippetEditor, handleSaveSnippet, handleDeleteSnippet, handleSnippetSelected, saveIdeConfig, resetIdeConfig, handleOpenNewProjectModal, handleConfirmNewProject, handleNewAsset, handleSpriteImported, onSelectAsset, memoizedOnRequestRename, handleConfirmRename, handleCancelRename, handleDeleteAsset, handleOpenSaveAsModal, handleSaveProject, handleConfirmSaveAsProjectAs, handleLoadProject, handleOpenRecentProject, fileLoadInputRef, handleDeleteEntityInstance, handleShowMapFile, handleUndo, handleRedo, handleExportAllCodeFiles, handleExportIntermediateGameJson, handleCopyTileData, handleGenerateTemplatesAsm,
        isToggleEditorDisabled, onToggleEditor, bossEditorZoom, setBossEditorZoom, tileEditorZoom, setTileEditorZoom, screenEditorZoom, setScreenEditorZoom, saveBossZoom, setSaveBossZoom, saveSpriteZoom, setSaveSpriteZoom, saveTileZoom, setSaveTileZoom, saveScreenZoom, setSaveScreenZoom, showSectorLines, setShowSectorLines, saveSectorLines, setSaveSectorLines,
        onRequestSaveTile, onRequestSaveTrack, onImportTrack, onRequestLoadTile, onRequestSaveSelectedTiles
    } = props;

  const activeAsset = assets.find(a => a.id === selectedAssetId);
  const activeScreenMapAsset = activeAsset?.type === 'screenmap' ? activeAsset.data as ScreenMap : undefined;
  const activeGameFlowAsset = activeAsset?.type === 'gameflow' ? activeAsset.data as GameFlowGraph : undefined;
  
  const selectedEntityInstance = activeScreenMapAsset?.layers.entities.find(e => e.id === selectedEntityInstanceId);
  const selectedEffectZone = activeScreenMapAsset?.effectZones?.find(ez => ez.id === selectedEffectZoneId); 
  const selectedGameFlowNode = activeGameFlowAsset?.nodes.find(n => n.id === selectedGameFlowNodeId);

  const getFontStats = () => { const defined = Object.keys(msxFont).length; const editableTotal = EDITABLE_CHAR_CODES_SUBSET.length; const editableDefined = EDITABLE_CHAR_CODES_SUBSET.filter(ec => msxFont[ec.code] !== undefined).length; return { defined, editableTotal, editableDefined };};
  const screenMapForHudModal = assets.find(a => a.id === selectedAssetId && a.type === 'screenmap')?.data as ScreenMap | undefined;

  const allTileAssetsData = assets.filter(a => a.type === 'tile').map(a => a.data as Tile);



  const isUndoDisabled = history.undoStack.length === 0 || [EditorType.HelpDocs, EditorType.WorldView].includes(currentEditor);
  const isRedoDisabled = history.redoStack.length === 0 || [EditorType.HelpDocs, EditorType.WorldView].includes(currentEditor);

  /* OBSOLETO: handleCompile - eliminado junto con menú Run en v0.267
  const handleCompile = async () => {
    if (currentEditor !== EditorType.Code || !activeAsset || typeof activeAsset.data !== 'string') {
      setStatusBarMessage("No code editor active or no code to compile.");
      return;
    }

    const code = activeAsset.data;

    try {
      setStatusBarMessage("Compiling...");
      const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusBarMessage(`Compilation successful! Output size: ${result.data.length / 2} bytes.`);
        console.log('Compiled HEX:', result.data);
        alert(`Compilation Successful:\n${result.message}`);
      } else {
        setStatusBarMessage(`Compilation failed: ${result.error}`);
        alert(`Compilation Error:\n${result.details}`);
      }
    } catch (error) {
      setStatusBarMessage("Failed to connect to the compiler backend.");
      alert("Could not connect to the compiler backend. Is it running?");
    }
  };
  */

  const allWorldMapGraphs = React.useMemo(() => assets
    .filter(a => a.type === 'worldmap' && a.data)
    .map(a => a.data as WorldMapGraph), [assets]);

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

  const [selectedPaletteAssetId, setSelectedPaletteAssetId] = useState<string>('');

  useEffect(() => {
    if (props.currentEditor !== EditorType.Tile) {
      setSelectedPaletteAssetId('');
    }
  }, [props.currentEditor, selectedAssetId]);

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
      const isScreen2Mode = currentScreenMode === "SCREEN 2 (Graphics I)";
      let paletteToUse = isScreen2Mode ? MSX1_PALETTE : MSX_SCREEN5_PALETTE;
      if (!isScreen2Mode && currentEditor === EditorType.Tile && activeAsset?.type === 'tile') {
        const { slots } = ensureScreen5PaletteSlots((activeAsset.data as Tile).screen5Palette);
        paletteToUse = screen5SlotsToMsxColors(slots);
      }
      const paletteAssets = assets.filter(a => a.type === 'palette');
      const shouldShowSavedPalettesPanel = !isScreen2Mode && currentEditor === EditorType.Tile && activeAsset?.type === 'tile';
      const applyPaletteFromAsset = () => {
        if (!shouldShowSavedPalettesPanel || !selectedPaletteAssetId) {
          setStatusBarMessage('Selecciona una paleta para cargar.');
          return;
        }
        const paletteAsset = paletteAssets.find(p => p.id === selectedPaletteAssetId);
        if (!paletteAsset || !paletteAsset.data) {
          setStatusBarMessage('No se pudo cargar la paleta seleccionada.');
          return;
        }
        const sanitized = ensureScreen5PaletteSlots((paletteAsset.data as any).slots || []).slots;
        handleUpdateAsset(activeAsset!.id, { screen5Palette: sanitized.map(slot => ({ ...slot })) });
        setStatusBarMessage(`Paleta "${paletteAsset.name}" aplicada al tile.`);
      };
      return (
        <>
          <PalettePanel
            palette={paletteToUse}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            isMsx1Palette={isScreen2Mode}
          />
          {shouldShowSavedPalettesPanel && (
            <Panel title="Paletas guardadas" className="mt-2">
              {paletteAssets.length > 0 ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block mb-1">Selecciona una paleta:</label>
                    <select
                      value={selectedPaletteAssetId}
                      onChange={e => setSelectedPaletteAssetId(e.target.value)}
                      className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded"
                    >
                      <option value="">-- Elegir --</option>
                      {paletteAssets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={applyPaletteFromAsset}
                    size="sm"
                    variant="secondary"
                    disabled={!selectedPaletteAssetId}
                  >
                    Cargar paleta seleccionada
                  </Button>
                </div>
              ) : (
                <p className="text-msx-textsecondary text-xs">No hay paletas guardadas. Crea una en Project Assets &gt; Palettes.</p>
              )}
            </Panel>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <ThemeProvider>
    <div className="flex flex-col h-screen bg-msx-bgcolor text-msx-textprimary font-sans" onContextMenu={(e) => e.preventDefault()}>
      <Toolbar
        onNewProject={handleOpenNewProjectModal} 
        onNewAsset={handleNewAsset}
        onSaveProject={() => handleSaveProject()} 
        onSaveProjectAs={handleOpenSaveAsModal} 
        onLoadProject={() => fileLoadInputRef.current?.click()}
        onOpenRecentProject={handleOpenRecentProject}
        onExportZ80Code={() => setIsCodeExportModalOpen(true)}
        onExportGameStructureJson={handleExportIntermediateGameJson}
        onDebug={() => setStatusBarMessage("Debug: Mock action. Implement debugger.")}
        onOpenHelpDocs={() => onSelectAsset(HELP_DOCS_SYSTEM_ASSET_ID, EditorType.HelpDocs)}
        onOpenThemeSettings={() => setIsConfigModalOpen(true)}
        dataOutputFormat={dataOutputFormat}
        setDataOutputFormat={setDataOutputFormat}
        autosaveEnabled={autosaveEnabled}
        setAutosaveEnabled={setAutosaveEnabled}
        saveBossZoom={saveBossZoom}
        setSaveBossZoom={setSaveBossZoom}
        saveSpriteZoom={saveSpriteZoom}
        setSaveSpriteZoom={setSaveSpriteZoom}
        saveTileZoom={saveTileZoom}
        setSaveTileZoom={setSaveTileZoom}
        saveScreenZoom={saveScreenZoom}
        setSaveScreenZoom={setSaveScreenZoom}
        saveSectorLines={saveSectorLines}
        setSaveSectorLines={setSaveSectorLines}
        onSaveConfig={saveIdeConfig} 
        onResetConfig={resetIdeConfig}
        isAutosaving={isAutosaving}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isUndoDisabled={isUndoDisabled}
        isRedoDisabled={isRedoDisabled}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenComponentDefEditor={() => onSelectAsset(COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, EditorType.ComponentDefinitionEditor)}
        onOpenEntityTemplateEditor={() => onSelectAsset(ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, EditorType.EntityTemplateEditor)}
        onOpenWorldView={() => onSelectAsset(WORLD_VIEW_SYSTEM_ASSET_ID, EditorType.WorldView)}
        onConfigureASM={() => alert("Configure ASM Compiler: Mock Action")}
        onConfigureEmulator={() => alert("Configure MSX Emulator: Mock Action")}
        onToggleEditor={onToggleEditor}
        isToggleEditorDisabled={isToggleEditorDisabled}
        currentScreenMode={currentScreenMode}
      />
      <input id="project-loader-input" type="file" accept=".json" ref={fileLoadInputRef} onChange={handleLoadProject} style={{ display: 'none' }} />

      <div className="flex-grow flex overflow-hidden">
        <FileExplorerPanel 
            className="w-60 flex-shrink-0"
            assets={assets} 
            selectedAssetId={selectedAssetId} 
            onSelectAsset={onSelectAsset} 
            onRequestRename={memoizedOnRequestRename} 
 
 
            isMainMenuActive={currentEditor === EditorType.MainMenu}
            onRequestDelete={handleDeleteAsset}
            onRequestSaveTile={onRequestSaveTile}
            onRequestSaveTrack={onRequestSaveTrack}
            onImportTrack={onImportTrack}
            onRequestLoadTile={onRequestLoadTile}
            onRequestSaveSelectedTiles={onRequestSaveSelectedTiles}
        />
        
        <div className="flex-grow flex flex-col" role="main">
          {currentEditor === EditorType.None && <Panel title="Welcome to MSX Retro IDE"><p className="p-4 text-center text-msx-textsecondary">Select an asset or create a new one to start editing.</p></Panel>}
          {currentEditor === EditorType.GameFlow && activeAsset?.type === 'gameflow' && (
            <GameFlowEditor
              gameFlowGraph={activeAsset.data}
              onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}
              allAssets={assets}
              selectedNodeId={selectedGameFlowNodeId}
              setSelectedNodeId={setSelectedGameFlowNodeId}
              onShowContextMenu={showContextMenu}
              msxFont={msxFont}
              msxFontColorAttributes={msxFontColorAttributes}
              entityTemplates={entityTemplates}
              currentScreenMode={currentScreenMode}
              componentDefinitions={componentDefinitions}
              gameFlowAssetName={activeAsset.name}
            />
          )}
          
          {currentEditor === EditorType.Tile && activeAsset?.type === 'tile' && ( <TileEditor currentTile={activeAsset.data as Tile} onUpdateCurrentTile={(data, newAssets) => handleUpdateAsset(activeAsset.id, data, newAssets)} allTileAssets={assets.filter(a => a.type === 'tile')} onUpdateAllTileAssets={(newTiles) => setAssetsWithHistory(prev => [...prev.filter(a => a.type !== 'tile'), ...newTiles])} selectedColor={selectedColor} currentScreenMode={currentScreenMode} dataOutputFormat={dataOutputFormat} copiedTileData={copiedTileData} onCopyTileData={handleCopyTileData} setStatusBarMessage={setStatusBarMessage} zoom={tileEditorZoom} setZoom={setTileEditorZoom} onSelectGlobalColor={setSelectedColor} />)}
          {currentEditor === EditorType.Sprite && activeAsset?.type === 'sprite' && ( <SpriteEditor sprite={activeAsset.data as Sprite} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)} onSpriteImported={handleSpriteImported} onCreateSpriteFromFrame={handleCreateSpriteFromFrame} globalSelectedColor={selectedColor} dataOutputFormat={dataOutputFormat} allAssets={assets} currentScreenMode={currentScreenMode} onOpenSpriteSheetModal={() => setIsSpriteSheetModalOpen(true)} saveSpriteZoom={saveSpriteZoom} />)}
          {currentEditor === EditorType.Boss && activeAsset?.type === 'boss' && ( <BossEditor boss={activeAsset.data as Boss} onUpdate={(data, newAssets) => handleUpdateAsset(activeAsset.id, data, newAssets)} allAssets={assets} tileBanks={tileBanks} onNavigateToAsset={onSelectAsset} onShowContextMenu={showContextMenu} currentScreenMode={currentScreenMode} zoom={bossEditorZoom} setZoom={setBossEditorZoom} copiedBossPhase={copiedBossPhase} setCopiedBossPhase={setCopiedBossPhase} /> )}
          {currentEditor === EditorType.Screen && activeAsset?.type === 'screenmap' && ( <ScreenEditor screenMap={activeAsset.data as ScreenMap} onUpdate={(data, newTilesToCreate) => { if (data.layers?.entities === undefined && (activeAsset.data as ScreenMap).layers.entities) { (data as Partial<ScreenMap>).layers = { ... (activeAsset.data as ScreenMap).layers, ...data.layers, entities: (activeAsset.data as ScreenMap).layers.entities };} if(data.effectZones === undefined && (activeAsset.data as ScreenMap).effectZones) { (data as Partial<ScreenMap>).effectZones = (activeAsset.data as ScreenMap).effectZones;} handleUpdateAsset(activeAsset.id, data, newTilesToCreate);}} tileset={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} sprites={assets.filter(a => a.type === 'sprite')} selectedTileId={screenEditorSelectedTileId} setSelectedTileId={setScreenEditorSelectedTileId} currentEntityTypeToPlace={currentEntityTypeToPlace} currentScreenMode={currentScreenMode} tileBanks={tileBanks} msx1FontData={msxFont} msxFontColorAttributes={msxFontColorAttributes} dataOutputFormat={dataOutputFormat} selectedEntityInstanceId={selectedEntityInstanceId} onSelectEntityInstance={setSelectedEntityInstanceId} selectedEffectZoneId={selectedEffectZoneId} onSelectEffectZone={setSelectedEffectZoneId} copiedScreenBuffer={copiedScreenBuffer} setCopiedScreenBuffer={setCopiedScreenBuffer} allProjectAssets={assets} copiedLayerBuffer={copiedLayerBuffer} setCopiedLayerBuffer={setCopiedLayerBuffer} setStatusBarMessage={setStatusBarMessage} onActiveLayerChange={setCurrentScreenEditorActiveLayer} componentDefinitions={componentDefinitions} entityTemplates={entityTemplates} onShowMapFile={handleShowMapFile} onNavigateToAsset={onSelectAsset} onShowContextMenu={showContextMenu} waypointPickerState={waypointPickerState} onWaypointPicked={handleWaypointPicked} zoom={screenEditorZoom} setZoom={setScreenEditorZoom} showSectorLines={showSectorLines} onToggleSectorLines={() => setShowSectorLines(v => !v)} />)}
          {currentEditor === EditorType.Code && activeAsset?.type === 'code' && ( <div className="flex flex-grow h-full overflow-hidden"> <div className="flex-grow h-full"> <CodeEditor code={activeAsset.data as string} onUpdate={(code) => handleUpdateAsset(activeAsset.id, code)} language="z80" assetName={activeAsset.name} snippetToInsert={snippetToInsert} /> </div> {snippetsEnabled && ( <SnippetsPanel snippets={userSnippets.filter(s => !Z80_BEHAVIOR_SNIPPETS.find(bs => bs.name === s.name))} onSnippetSelect={handleSnippetSelected} isEnabled={true} onAddSnippet={() => handleOpenSnippetEditor(null)} onEditSnippet={handleOpenSnippetEditor} onDeleteSnippet={handleDeleteSnippet}/>)}</div>)}
          {currentEditor === EditorType.BehaviorEditor && activeAsset?.type === 'behavior' && ( <BehaviorEditor behaviorScript={activeAsset.data as BehaviorScript} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)} userSnippets={userSnippets} onSnippetSelect={handleSnippetSelected} onAddSnippet={() => handleOpenSnippetEditor(null)} onEditSnippet={handleOpenSnippetEditor} onDeleteSnippet={handleDeleteSnippet} isSnippetsPanelEnabled={snippetsEnabled} /> )}
          {currentEditor === EditorType.WorldMap && activeAsset?.type === 'worldmap' && ( <WorldMapEditor worldMapGraph={activeAsset.data as WorldMapGraph} onUpdate={(data, newAssets) => handleUpdateAsset(activeAsset.id, data, newAssets)} availableScreenMaps={assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap)} tileset={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} currentScreenMode={currentScreenMode} dataOutputFormat={dataOutputFormat} onNavigateToAsset={onSelectAsset} onShowContextMenu={showContextMenu} setStatusBarMessage={setStatusBarMessage} />)}
          {currentEditor === EditorType.WorldView && ( <WorldViewEditor allWorldMapGraphs={allWorldMapGraphs} allScreenMaps={assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap)} allTiles={assets.filter(a => a.type === 'tile').map(a => a.data as Tile)} currentScreenMode={currentScreenMode} /> )}
          {currentEditor === EditorType.Sound && activeAsset?.type === 'sound' && ( <SoundEditor soundData={activeAsset.data as PSGSoundData} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}/>)}
          {currentEditor === EditorType.Track && activeAsset?.type === 'track' && ( <TrackerComposer songData={activeAsset.data as TrackerSongData} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}/>)}
          {currentEditor === EditorType.TileBanks && activeAsset?.type === 'tilebank' && ( <TileBankEditor tileBank={activeAsset.data as TileBank} onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)} allTiles={assets.filter(a => a.type === 'tile')} allFonts={assets.filter(a => a.type === 'font')} currentScreenMode={currentScreenMode}/>)}
          {currentEditor === EditorType.Font && activeAsset?.type === 'font' && activeAsset.data && (activeAsset.data as MSXFontAsset).fontData && (
            <FontEditor
              fontData={(activeAsset.data as MSXFontAsset).fontData}
              onUpdateFont={(fontData) => {
                const updatedAssetData: MSXFontAsset = {
                  ...activeAsset.data as MSXFontAsset,
                  fontData
                };
                handleUpdateAsset(activeAsset.id, updatedAssetData);
              }}
              fontColorAttributes={(activeAsset.data as MSXFontAsset).fontColorAttributes || {}}
              onUpdateFontColorAttributes={(fontColorAttributes) => {
                const updatedAssetData: MSXFontAsset = {
                  ...activeAsset.data as MSXFontAsset,
                  fontColorAttributes
                };
                handleUpdateAsset(activeAsset.id, updatedAssetData);
              }}
              currentScreenMode={currentScreenMode}
              selectedColor={selectedColor as MSX1ColorValue}
              dataOutputFormat={dataOutputFormat}
              fontAssetName={activeAsset.name}
            />
          )}
          {currentEditor === EditorType.Font && activeAsset?.type === 'font' && (!activeAsset.data || !(activeAsset.data as MSXFontAsset).fontData) && (
            <Panel title="Font Asset Repair">
              <div className="p-4">
                <p className="text-center text-msx-textsecondary mb-4">
                  Font asset data is corrupted or incomplete.<br/>
                  Asset ID: {activeAsset.id}<br/>
                  Has data: {activeAsset.data ? 'Yes' : 'No'}<br/>
                  Has fontData: {activeAsset.data && (activeAsset.data as MSXFontAsset).fontData ? 'Yes' : 'No'}
                </p>
                <div className="text-center">
                  <Button
                    onClick={() => {
                      const repairedAssetData: MSXFontAsset = {
                        fontData: JSON.parse(JSON.stringify(msxFont)),
                        fontColorAttributes: JSON.parse(JSON.stringify(msxFontColorAttributes))
                      };
                      handleUpdateAsset(activeAsset.id, repairedAssetData);
                    }}
                    variant="primary"
                  >
                    Repair Font Asset
                  </Button>
                </div>
              </div>
            </Panel>
          )}
          {currentEditor === EditorType.Font && !activeAsset && ( <FontEditor fontData={msxFont} onUpdateFont={setMsxFont} fontColorAttributes={msxFontColorAttributes} onUpdateFontColorAttributes={setMsxFontColorAttributes} currentScreenMode={currentScreenMode} selectedColor={selectedColor as MSX1ColorValue} dataOutputFormat={dataOutputFormat}/>)}
          {currentEditor === EditorType.HelpDocs && ( <HelpDocsViewer helpDocsData={helpDocsData} /> )}
           
           {currentEditor === EditorType.ComponentDefinitionEditor && <ComponentDefinitionEditor componentDefinitions={componentDefinitions} onUpdateComponentDefinitions={setComponentDefinitions} />}
           {currentEditor === EditorType.EntityTemplateEditor && <EntityTemplateEditor entityTemplates={entityTemplates} onUpdateEntityTemplates={setEntityTemplates} componentDefinitions={componentDefinitions} onGenerateAsm={handleGenerateTemplatesAsm} allAssets={assets} />}
           {currentEditor === EditorType.GlobalVariables && activeAsset && activeAsset.type === 'globalvariables' && (
           <GlobalVariablesEditor
              currentAsset={activeAsset as any}
              onUpdateAsset={(updatedData) => handleUpdateAsset(activeAsset.id, updatedData)}
            />
          )}
          {currentEditor === EditorType.Palette && activeAsset?.type === 'palette' && (
            <PaletteEditor
              paletteAsset={activeAsset}
              onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}
              setStatusBarMessage={setStatusBarMessage}
            />
          )}
          {currentEditor === EditorType.MainMenu && (
            <MainMenuEditor
                mainMenuConfig={mainMenuConfig}
                onUpdateMainMenuConfig={onUpdateMainMenuConfig}
                allAssets={assets}
                msxFont={msxFont}
                msxFontColorAttributes={msxFontColorAttributes}
                currentScreenMode={currentScreenMode}
                gameData={{ assets, tileBanks, componentDefinitions, entityTemplates, mainMenuConfig }}
                setScreenToEdit={(screen) => onSelectAsset(screen.id, EditorType.Screen)}
             />
           )}
          {currentEditor === EditorType.StateMachine && activeAsset?.type === 'statemachine' && (
            <StateMachineEditor
              currentAsset={activeAsset}
              onUpdateAsset={(data) => handleUpdateAsset(activeAsset.id, data)}
              allAssets={assets}
              entityTemplates={entityTemplates}
            />
          )}
        </div>

        <div className="w-64 flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
         {renderRightPanelContent()}
          <PropertiesPanel 
            asset={currentEditor === EditorType.Font || currentEditor === EditorType.HelpDocs || currentEditor === EditorType.BehaviorEditor || currentEditor === EditorType.ComponentDefinitionEditor || currentEditor === EditorType.EntityTemplateEditor ? undefined : activeAsset}
            entityInstance={selectedEntityInstance}
            effectZone={selectedEffectZone}
            gameFlowNode={selectedGameFlowNode}
            onUpdateGameFlowNode={(id, data) => {
              if (activeGameFlowAsset) {
                const updatedNodes = activeGameFlowAsset.nodes.map(n =>
                  n.id === id ? { ...n, ...data } : n
                );
                handleUpdateAsset(activeGameFlowAsset.id, { nodes: updatedNodes });
              }
            }}
            onUpdateEntityInstance={(id, data) => { 
                if (activeScreenMapAsset) { 
                  const updatedEntities = activeScreenMapAsset.layers.entities.map(e => 
                    e.id === id
                      ? {
                          ...e,
                          ...data,
                          ...(Object.prototype.hasOwnProperty.call(data, 'componentOverrides')
                            ? { componentOverrides: data.componentOverrides || {} }
                            : {}),
                        }
                      : e 
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
            onUpdateAsset={(assetId, data) => handleUpdateAsset(assetId, data)}
          />
        </div>
      </div>
      <StatusBar message={statusBarMessage} details={currentProjectName || activeAsset?.name} />
      {contextMenu && <ContextMenu {...contextMenu} onClose={closeContextMenu} />}
      {isAboutModalOpen && <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />}
      {isConfigModalOpen && <ConfigTabModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} />}
      {isRenameModalOpen && assetToRenameInfo && ( <RenameModal isOpen={isRenameModalOpen} assetId={assetToRenameInfo.id} currentName={assetToRenameInfo.currentName} assetType={assetToRenameInfo.type} onConfirm={handleConfirmRename} onClose={handleCancelRename}/>)}
      {isSaveAsModalOpen && ( <SaveAsModal isOpen={isSaveAsModalOpen} currentName={currentProjectName || "msx_ide_project"} onConfirm={handleConfirmSaveAsProjectAs} onClose={() => setIsSaveAsModalOpen(false)}/>)}
      {isNewProjectModalOpen && (
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onConfirm={handleConfirmNewProject}
          onClose={() => setIsNewProjectModalOpen(false)}
        />
      )}
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
            onReorderFrames={handleReorderSpriteFrames}
            spriteAsset={spriteForFramesModal}
        />
      )}
      {/* OBSOLETO: CompressDataModal - eliminado junto con menú Run en v0.267
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
      */}
      {isCodeExportModalOpen && (
        <CodeExportModal
          isOpen={isCodeExportModalOpen}
          onClose={() => setIsCodeExportModalOpen(false)}
          assets={assets}
          currentProjectName={currentProjectName}
          projectData={{
            tileBanks,
            msxFont,
            msxFontColorAttributes,
            componentDefinitions,
            entityTemplates,
            mainMenuConfig
          }}
        />
      )}
    </div>
    </ThemeProvider>
  );
};
