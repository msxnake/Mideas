import React, { useState, useRef, useEffect } from 'react';
import { ProjectAsset, EditorType, ContextMenuItem, Msx2ProjectProfile, ScreenKind } from '../../types';
import { Panel } from '../common/Panel';
import { ContextMenu } from '../common/ContextMenu';
import { TilesetIcon, SpriteIcon, MapIcon, CodeIcon, SoundIcon, PlaceholderIcon, FolderOpenIcon, WorldMapIcon, CaretDownIcon, CaretRightIcon, MusicNoteIcon, ListBulletIcon, PencilIcon, TrashIcon, QuestionMarkCircleIcon, PuzzlePieceIcon, SparklesIcon, BugIcon, WorldViewIcon, GameFlowIcon, ExpandAllIcon, CollapseAllIcon, SaveIcon, LoadIcon, CheckCircleIcon, PlusCircleIcon, DocumentDuplicateIcon, HudIcon } from '../icons/MsxIcons';
import { getAssetTarget, getProjectTargetFromScreenMode, isAssetTypeEnabledForProject, isAssetTypeEnabledForMsx2Project } from '../../utils/projectTarget';

/**
 * Props for the {@link FileExplorerPanel} component.
 * @category Tools
 */
interface FileExplorerPanelProps {
  /** A list of all project assets. */
  assets: ProjectAsset[];
  /** The ID of the currently selected asset. */
  selectedAssetId: string | null;
  /** Callback function when an asset is selected. */
  onSelectAsset: (assetId: string | null, editorType?: EditorType) => void;
  /** Callback to create a new asset of the given type (reuses the real creation logic). */
  onNewAsset: (type: ProjectAsset['type'], options?: { select?: boolean; screenKind?: ScreenKind }) => void;
  /** Callback function to request renaming an asset. */
  onRequestRename: (assetId: string, currentName: string, assetType: ProjectAsset['type']) => void;
  /** Callback function to duplicate an asset. */
  onRequestDuplicate: (assetId: string) => void;
  /** Callback function to request deleting an asset. */
  onRequestDelete: (assetId: string) => void;
  /** Callback function to request saving a single tile asset. */
  onRequestSaveTile: (assetId: string) => void;
  /** Callback function to request saving a single track asset. */
  onRequestSaveTrack: (assetId: string) => void;
  onImportTrack: (trackData: any, fileName: string) => void;
  /** Callback function to request loading a single tile asset. */
  onRequestLoadTile: (assetId: string) => void;
  /** Callback function to request saving multiple selected tile assets. */
  onRequestSaveSelectedTiles: (assetIds: string[]) => void;
  /** Whether the Main Menu system editor is active. */
  isMainMenuActive?: boolean;
  /** Whether the Presentation Screen system editor is active. */
  isPresentationScreenActive?: boolean;
  /** Whether the MSX2 Enemy Library system editor is active. */
  isEnemyLibraryActive?: boolean;
  /** Current project screen mode used to disable incompatible asset families. */
  currentScreenMode: string;
  /** Active MSX2 game profile used to filter profile-specific asset families. */
  msx2ProjectProfile?: Msx2ProjectProfile | null;
  /** Whether a project is loaded or has been created. */
  hasActiveProject: boolean;
  /** Optional CSS class name for the panel. */
  className?: string;
  /** Optional callback to collapse the whole asset explorer column. */
  onRequestCollapse?: () => void;
}

/**
 * A component that displays an icon corresponding to a given asset type.
 * @internal
 */
const AssetIcon: React.FC<{type: ProjectAsset['type'] | 'tilebanks' | 'fonteditor' | 'helpdocs' | 'componentdefinitioneditor' | 'entitytemplateeditor' | 'enemylibrary' | 'worldview' | 'gameflow' | 'mainmenu' | 'presentationscreen'}> = ({ type }) => {
  const iconClass = "w-4 h-4 mr-2";
  switch (type) {
    case 'tile': return <TilesetIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'sprite': return <SpriteIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'msx2sprite': return <SpriteIcon className={`${iconClass} text-cyan-300 group-hover:text-msx-accent`} />;
    case 'msx2bitmap': return <MapIcon className={`${iconClass} text-sky-300 group-hover:text-msx-accent`} />;
    case 'msx2bitmaptile': return <TilesetIcon className={`${iconClass} text-sky-300 group-hover:text-msx-accent`} />;
    case 'msx2bitmapstamp': return <TilesetIcon className={`${iconClass} text-teal-300 group-hover:text-msx-accent`} />;
    case 'msx2bitmapterrain': return <TilesetIcon className={`${iconClass} text-emerald-300 group-hover:text-msx-accent`} />;
    case 'msx2screen': return <MapIcon className={`${iconClass} text-blue-300 group-hover:text-msx-accent`} />;
    case 'msx2bitmaproom': return <MapIcon className={`${iconClass} text-sky-200 group-hover:text-msx-accent`} />;
    case 'msx2player': return <SpriteIcon className={`${iconClass} text-yellow-300 group-hover:text-msx-accent`} />;
    case 'msx2enemy': return <BugIcon className={`${iconClass} text-red-300 group-hover:text-msx-accent`} />;
    case 'msx2hudfont': return <PencilIcon className={`${iconClass} text-emerald-300 group-hover:text-msx-accent`} />;
    case 'msx2hud': return <HudIcon className={`${iconClass} text-emerald-300 group-hover:text-msx-accent`} />;
    case 'msx2dialogue': return <ListBulletIcon className={`${iconClass} text-sky-300 group-hover:text-msx-accent`} />;
    case 'msx2presentation': return <MapIcon className={`${iconClass} text-teal-300 group-hover:text-msx-accent`} />;
    case 'msx2gameflow': return <GameFlowIcon className={`${iconClass} text-cyan-300 group-hover:text-msx-accent`} />;
    case 'font': return <PencilIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'boss': return <BugIcon className={`${iconClass} text-msx-danger group-hover:text-msx-accent`} />;
    case 'screenmap': return <MapIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'worldmap': return <WorldMapIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'gameflow': return <GameFlowIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'dialogue': return <ListBulletIcon className={`${iconClass} text-cyan-300 group-hover:text-msx-accent`} />;
    case 'portrait': return <TilesetIcon className={`${iconClass} text-pink-300 group-hover:text-msx-accent`} />;
    case 'statemachine': return <PuzzlePieceIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'tilebank': return <ListBulletIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'code': return <CodeIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'sound': return <SoundIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'track': return <MusicNoteIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'behavior': return <PuzzlePieceIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'componentdefinition': return <PuzzlePieceIcon className={`${iconClass} text-purple-400 group-hover:text-msx-accent`} />;
    case 'entitytemplate': return <SpriteIcon className={`${iconClass} text-teal-400 group-hover:text-msx-accent`} />;
    case 'globalvariables': return <SparklesIcon className={`${iconClass} text-yellow-400 group-hover:text-msx-accent`} />;
    case 'palette': return <SparklesIcon className={`${iconClass} text-fuchsia-300 group-hover:text-msx-accent`} />;
    case 'tilebanks': return <ListBulletIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'fonteditor': return <PencilIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'helpdocs': return <QuestionMarkCircleIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'componentdefinitioneditor': return <PuzzlePieceIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'entitytemplateeditor': return <SpriteIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'enemylibrary': return <BugIcon className={`${iconClass} text-red-300 group-hover:text-msx-accent`} />;
    case 'worldview': return <WorldViewIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'mainmenu': return <ListBulletIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'presentationscreen': return <MapIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    default: return <PlaceholderIcon className={`${iconClass} text-msx-textsecondary`} />;
  }
};

/** The order in which asset type folders should be displayed. @constant */
const FOLDER_TYPE_ORDER: ProjectAsset['type'][] = ['statemachine', 'tile', 'portrait', 'sprite', 'msx2sprite', 'msx2bitmaptile', 'msx2bitmapstamp', 'msx2bitmapterrain', 'msx2player', 'msx2enemy', 'msx2screen', 'msx2bitmaproom', 'msx2dialogue', 'msx2hudfont', 'msx2hud', 'msx2presentation', 'msx2gameflow', 'msx2bitmap', 'font', 'boss', 'screenmap', 'worldmap', 'gameflow', 'dialogue', 'palette', 'tilebank', 'presentationscreen', 'sound', 'track', 'globalvariables', 'code'];
/** A mapping from asset type keys to their display names. @constant */
const FOLDER_DISPLAY_NAMES: Record<ProjectAsset['type'], string> = {
  statemachine: "State Machines",
  tile: "MSX1 Tiles",
  sprite: "MSX1 Sprites",
  msx2sprite: "MSX2 Sprites",
  msx2bitmaptile: "MSX2 Bitmap Tiles",
  msx2bitmapstamp: "MSX2 Bitmap Stamps",
  msx2bitmapterrain: "MSX2 Autotile Terrains",
  msx2bitmap: "Legacy MSX2 Bitmaps",
  msx2player: "MSX2 Players",
  msx2enemy: "MSX2 Enemies",
  msx2screen: "MSX2 SCREEN 4 Rooms",
  msx2bitmaproom: "MSX2 SCREEN 5 Bitmap Rooms",
  msx2dialogue: "MSX2 Dialogues",
  msx2hudfont: "MSX2 Fonts",
  msx2hud: "MSX2 HUDs",
  msx2presentation: "MSX2 SCREEN 5 Presentations",
  msx2gameflow: "MSX2 Game Flows",
  font: "MSX1 Fonts",
  boss: "MSX1 Bosses",
  screenmap: "MSX1 Screen Maps",
  worldmap: "World Maps",
  gameflow: "Game Flows",
  dialogue: "Dialogues",
  portrait: "MSX1 Portraits",
  tilebank: "MSX1 Banks",
  sound: "Sound FX",
  track: "Music Tracks",
  behavior: "Behavior Scripts",
  componentdefinition: "Component Definitions (Data)",
  entitytemplate: "Entity Templates (Data)",
  globalvariables: "Global Variables",
  palette: "MSX2 Palettes",
  presentationscreen: "MSX1 Presentation Screens",
  code: "Code Files",
};

/** Singular call-to-action labels for the per-folder "New" button. @constant */
const FOLDER_NEW_LABELS: Partial<Record<ProjectAsset['type'], string>> = {
  statemachine: "New State Machine",
  sprite: "New MSX1 Sprite",
  msx2sprite: "New Sprite",
  msx2player: "New Player",
  msx2enemy: "New Enemy",
  msx2screen: "New SCREEN 4 Room",
  msx2bitmaproom: "New Bitmap Room",
  msx2bitmapstamp: "New Stamp",
  msx2dialogue: "New MSX2 Dialogue",
  msx2hudfont: "New MSX2 Font",
  msx2hud: "New HUD",
  msx2presentation: "New SCREEN 5 Presentation",
  msx2gameflow: "New Game Flow",
  tile: "New Tile",
  font: "New Font",
  boss: "New Boss",
  screenmap: "New Screen",
  worldmap: "New World Map",
  gameflow: "New Game Flow",
  dialogue: "New Dialogue",
  portrait: "New Portrait",
  palette: "New Palette",
  tilebank: "New Tile Bank",
  sound: "New Sound FX",
  track: "New Track",
  globalvariables: "New Global Variables",
  code: "New Code File",
};

/** Maps asset types to their corresponding editor types. @constant */
const ASSET_TYPE_TO_EDITOR: Record<ProjectAsset['type'], EditorType> = {
  statemachine: EditorType.StateMachine,
  tile: EditorType.Tile,
  sprite: EditorType.Sprite,
  msx2sprite: EditorType.Msx2Sprite,
  msx2bitmap: EditorType.Msx2Bitmap,
  msx2bitmaptile: EditorType.Msx2BitmapTile,
  msx2bitmapstamp: EditorType.Msx2BitmapStamp,
  msx2bitmapterrain: EditorType.Msx2BitmapTerrain,
  msx2player: EditorType.Msx2Player,
  msx2enemy: EditorType.Msx2Enemy,
  msx2screen: EditorType.Msx2Screen,
  msx2bitmaproom: EditorType.Msx2BitmapRoom,
  msx2dialogue: EditorType.Msx2Dialogue,
  msx2hudfont: EditorType.Msx2HudFont,
  msx2hud: EditorType.Msx2HudEditor,
  msx2presentation: EditorType.Msx2Presentation,
  msx2gameflow: EditorType.Msx2GameFlow,
  font: EditorType.Font,
  boss: EditorType.Boss,
  screenmap: EditorType.Screen,
  worldmap: EditorType.WorldMap,
  gameflow: EditorType.GameFlow,
  dialogue: EditorType.Dialogue,
  portrait: EditorType.Portrait,
  tilebank: EditorType.TileBanks,
  sound: EditorType.Sound,
  track: EditorType.Track,
  behavior: EditorType.BehaviorEditor,
  componentdefinition: EditorType.ComponentDefinitionEditor,
  entitytemplate: EditorType.EntityTemplateEditor,
  globalvariables: EditorType.GlobalVariables,
  palette: EditorType.Palette,
  presentationscreen: EditorType.PresentationScreen,
  code: EditorType.Code,
};

// Constants for special system asset IDs
/** System asset ID for the Tile Banks editor. @constant */
export const TILE_BANKS_SYSTEM_ASSET_ID = "TILE_BANKS_EDITOR";
/** System asset ID for the Font Assets manager. @constant */
/** System asset ID for the Help & Docs viewer. @constant */
export const HELP_DOCS_SYSTEM_ASSET_ID = "HELP_DOCS_SYSTEM_ASSET";
/** System asset ID for the Component Definition editor. @constant */
export const COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID = "COMPONENT_DEF_EDITOR_SYSTEM_ASSET";
/** System asset ID for the Entity Template editor. @constant */
export const ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID = "ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET";
/** System asset ID for the World View. @constant */
export const WORLD_VIEW_SYSTEM_ASSET_ID = "WORLD_VIEW_SYSTEM_ASSET";
/** System asset ID for the Game Flow editor. @constant */
export const GAME_FLOW_SYSTEM_ASSET_ID = "GAME_FLOW_SYSTEM_ASSET_ID";
/** System asset ID for the Global Variables editor. @constant */
export const GLOBAL_VARIABLES_SYSTEM_ASSET_ID = "GLOBAL_VARIABLES_SYSTEM_ASSET_ID";
/** System asset ID for the Presentation Screen editor. @constant */
export const PRESENTATION_SCREEN_SYSTEM_ASSET_ID = "PRESENTATION_SCREEN_SYSTEM_ASSET_ID";
/** System asset ID for the MSX2 Enemy Library. */
export const ENEMY_LIBRARY_SYSTEM_ASSET_ID = "ENEMY_LIBRARY_SYSTEM_ASSET_ID";


/**
 * A panel that displays a file explorer for all project assets, grouped by type.
 * It also provides access to system-level editors and tools.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tools
 */
export const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  onNewAsset,
  onRequestRename,
  onRequestDuplicate,
  onRequestDelete,
  onRequestSaveTile,
  onRequestSaveTrack,
  onImportTrack,
  onRequestLoadTile,
  onRequestSaveSelectedTiles,
  isMainMenuActive = false,
  isPresentationScreenActive = false,
  isEnemyLibraryActive = false,
  currentScreenMode,
  msx2ProjectProfile = null,
  hasActiveProject,
  className = '',
  onRequestCollapse,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [tileSortOrder, setTileSortOrder] = useState<'default' | 'alpha'>('default');
  const [tileFilterChar, setTileFilterChar] = useState<string>('');
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [spriteSortOrder, setSpriteSortOrder] = useState<'default' | 'alpha'>('default');
  const [spriteFilterChar, setSpriteFilterChar] = useState<string>('');
  const [screenmapSortOrder, setScreenmapSortOrder] = useState<'default' | 'alpha'>('default');
  const [screenmapFilterChar, setScreenmapFilterChar] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    assetId: string | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, assetId: null });
  const trackFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTrackFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedJson = JSON.parse(text);
          onImportTrack(parsedJson, file.name);
        } catch (error) {
          console.error("Error loading JSON song file:", error);
          alert(`Failed to load JSON song: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          if (trackFileInputRef.current) trackFileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        alert("Error reading .json file.");
        if (trackFileInputRef.current) trackFileInputRef.current.value = "";
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    setExpandedFolders({});
    setSelectedTileIds([]);
  }, [assets]);

  useEffect(() => {
    if (selectedAssetId && assets.find(a => a.id === selectedAssetId)?.type === 'tile') {
      if (!selectedTileIds.includes(selectedAssetId)) {
        setSelectedTileIds([selectedAssetId]);
      }
    } else if (!selectedAssetId) {
      setSelectedTileIds([]);
    }
  }, [selectedAssetId, assets]);

  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const toggleFolder = (folderType: ProjectAsset['type']) => {
    setExpandedFolders(prev => ({ ...prev, [folderType]: !prev[folderType] }));
  };

  const handleExpandAll = () => {
    const allExpanded = FOLDER_TYPE_ORDER.reduce((acc, folderType) => {
      acc[folderType] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedFolders(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed = FOLDER_TYPE_ORDER.reduce((acc, folderType) => {
      acc[folderType] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedFolders(allCollapsed);
  };

  const handleTileContextMenu = (event: React.MouseEvent, assetId: string) => {
    event.preventDefault();
    handleCloseContextMenu();

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      assetId: assetId,
    });
  };

  const handleTrackContextMenu = (event: React.MouseEvent, assetId: string) => {
    event.preventDefault();
    handleCloseContextMenu();

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      assetId: assetId,
    });
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    (acc[asset.type] = acc[asset.type] || []).push(asset);
    return acc;
  }, {} as Record<ProjectAsset['type'], ProjectAsset[]>);

  const baseItemClass = "w-full text-left pl-1 pr-1 py-1.5 rounded flex items-center group";
  const activeItemClass = "bg-msx-accent text-white";
  const inactiveItemClass = "text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary";
  const disabledItemClass = "text-msx-textsecondary/25 opacity-35 grayscale cursor-not-allowed line-through decoration-red-500 decoration-2 decoration-solid";
  const selectedTileClass = "bg-msx-highlight text-white";
  const projectTarget = getProjectTargetFromScreenMode(currentScreenMode);

  // The MSX2 Enemy Library is reached from the toolbar ("Enemies" button),
  // not from the Project Assets sidebar, so no system tools are listed here.
  const systemTools: Array<{
    id: string;
    name: string;
    title: string;
    editorType: EditorType;
    iconType: 'mainmenu' | 'presentationscreen' | 'enemylibrary';
    isActive: boolean;
  }> = [];


  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu.assetId) return [];

    const asset = assets.find(a => a.id === contextMenu.assetId);
    if (!asset) return [];

    if (asset.type === 'tile') {
      return [
        {
          label: "MSX1 Load Tile",
          icon: <LoadIcon className="w-3.5 h-3.5" />,
          onClick: () => onRequestLoadTile(contextMenu.assetId as string),
        },
        {
          label: "MSX1 Save Tile",
          icon: <SaveIcon className="w-3.5 h-3.5" />,
          onClick: () => {
            if (selectedTileIds.length > 1) {
              onRequestSaveSelectedTiles(selectedTileIds);
            } else {
              onRequestSaveTile(contextMenu.assetId as string);
            }
          },
        },
      ];
    }

    if (asset.type === 'track') {
      return [
        {
          label: "Export",
          icon: <SaveIcon className="w-3.5 h-3.5" />,
          onClick: () => onRequestSaveTrack(contextMenu.assetId as string),
        },
      ];
    }

    return [];
  };

  const contextMenuItems = getContextMenuItems();
  const isAssetTypeVisible = (assetType: ProjectAsset['type']) =>
    isAssetTypeEnabledForMsx2Project(assetType, currentScreenMode, msx2ProjectProfile);
  const isFolderEnabled = (folderType: ProjectAsset['type']) => hasActiveProject && isAssetTypeVisible(folderType);
  const getDisabledTitle = (assetType: ProjectAsset['type']): string | undefined => {
    const assetTarget = getAssetTarget(assetType);
    if (!hasActiveProject) return 'Create or load a project first.';
    if (assetTarget !== 'COMMON' && assetTarget !== projectTarget) return `${FOLDER_DISPLAY_NAMES[assetType]} are disabled in ${projectTarget} projects.`;
    return undefined;
  };

  return (
    <Panel
      title="Project Assets"
      className={className}
      icon={<FolderOpenIcon className="w-4 h-4 text-msx-textsecondary" />}
      headerButtons={
        <>
          {onRequestCollapse && (
            <button
              onClick={onRequestCollapse}
              title="Hide Project Assets"
              aria-label="Hide Project Assets"
              className="px-1 py-0.5 text-xs leading-none text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"
            >
              {'<'}
            </button>
          )}
          {hasActiveProject && (
            <>
              <button onClick={handleExpandAll} title="Expand All" className="p-0.5 text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"><ExpandAllIcon className="w-3.5 h-3.5" /></button>
              <button onClick={handleCollapseAll} title="Collapse All" className="p-0.5 text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"><CollapseAllIcon className="w-3.5 h-3.5" /></button>
            </>
          )}
        </>
      }
    >
      {contextMenu.isOpen && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          items={contextMenuItems}
          onClose={handleCloseContextMenu}
        />
      )}

      {!hasActiveProject && <p className="text-xs text-msx-textsecondary p-2">Create or load a project to enable assets.</p>}
      {(hasActiveProject && assets.length === 0 && systemTools.every(tool => !tool.isActive)) && <p className="text-xs text-msx-textsecondary p-2">No assets in project. Click 'New Asset' in the toolbar to create one.</p>}

      {hasActiveProject && (
      <ul className="space-y-0.5 text-sm font-sans">
        {systemTools.map(tool => (
            <li key={tool.id}>
              <button
                onClick={() => onSelectAsset(tool.id, tool.editorType)}
                className={`${baseItemClass} ${tool.isActive ? activeItemClass : inactiveItemClass}`}
                title={tool.title}
                aria-current={tool.isActive ? "page" : undefined}
              >
                <AssetIcon type={tool.iconType} />
                <span className="font-medium truncate">{tool.name}</span>
              </button>
            </li>
        ))}

        {FOLDER_TYPE_ORDER.map(folderType => {
          const folderTarget = getAssetTarget(folderType);
          const assetsInFolder = groupedAssets[folderType] || [];
          if (folderType === 'msx2bitmap' && assetsInFolder.length === 0) {
            return null;
          }
          if (hasActiveProject && ((folderTarget !== 'COMMON' && folderTarget !== projectTarget) || (folderType === 'palette' && projectTarget !== 'MSX2'))) {
            return null;
          }
          if (hasActiveProject && !isAssetTypeVisible(folderType)) {
            return null;
          }

          // Code Files are created by the Export Z80 Code modal, then shown here
          // for inspection/editing like any other generated asset.
          const isExpanded = !!expandedFolders[folderType];
          const folderEnabled = isFolderEnabled(folderType);
          const disabledTitle = getDisabledTitle(folderType);

          let processedAssets = assetsInFolder;
          if (folderType === 'tile') {
            let tempAssets = [...assetsInFolder];
            if (tileSortOrder === 'alpha') {
              tempAssets.sort((a, b) => a.name.localeCompare(b.name));
            }
            if (tileFilterChar) {
              tempAssets = tempAssets.filter(asset =>
                asset.name.toLowerCase().startsWith(tileFilterChar.toLowerCase())
              );
            }
            processedAssets = tempAssets;
          }
          if (folderType === 'sprite') {
            let tempAssets = [...assetsInFolder];
            if (spriteSortOrder === 'alpha') {
              tempAssets.sort((a, b) => a.name.localeCompare(b.name));
            }
            if (spriteFilterChar) {
              tempAssets = tempAssets.filter(asset =>
                asset.name.toLowerCase().startsWith(spriteFilterChar.toLowerCase())
              );
            }
            processedAssets = tempAssets;
          }
          if (folderType === 'screenmap') {
            let tempAssets = [...assetsInFolder];
            if (screenmapSortOrder === 'alpha') {
              tempAssets.sort((a, b) => a.name.localeCompare(b.name));
            }
            if (screenmapFilterChar) {
              tempAssets = tempAssets.filter(asset =>
                asset.name.toLowerCase().startsWith(screenmapFilterChar.toLowerCase())
              );
            }
            processedAssets = tempAssets;
          }

          return (
            <li key={folderType}>
              <button
                onClick={() => { if (folderEnabled) toggleFolder(folderType); }}
                disabled={!folderEnabled}
                className={`${baseItemClass} ${folderEnabled ? inactiveItemClass : disabledItemClass} focus:outline-none`}
                aria-expanded={isExpanded}
                aria-controls={`folder-content-${folderType}`}
                title={disabledTitle}
              >
                {isExpanded ? <CaretDownIcon className="w-3 h-3 mr-1.5 flex-shrink-0" /> : <CaretRightIcon className="w-3 h-3 mr-1.5 flex-shrink-0" />}
                <AssetIcon type={folderType} />
                <span className="font-medium truncate">{FOLDER_DISPLAY_NAMES[folderType]}</span>
                <span className="ml-auto text-xs text-msx-textsecondary">({assetsInFolder.length})</span>
              </button>
              {isExpanded && folderType === 'tile' && (
                <div className="pl-4 pt-1 pb-2 flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setTileSortOrder(prev => prev === 'alpha' ? 'default' : 'alpha')}
                    className="px-2 py-1 rounded bg-msx-border hover:bg-msx-highlight text-msx-textprimary transition-colors"
                    title={tileSortOrder === 'alpha' ? "Restore default order" : "Sort alphabetically"}
                  >
                    Sort ({tileSortOrder === 'alpha' ? 'A-Z' : 'Default'})
                  </button>
                  <div className="flex items-center gap-1">
                    <label htmlFor="tile-filter" className="text-msx-textsecondary">Filter:</label>
                    <select
                      id="tile-filter"
                      value={tileFilterChar}
                      onChange={e => setTileFilterChar(e.target.value)}
                      className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-xs focus:ring-msx-accent focus:border-msx-accent"
                    >
                      <option value="">All</option>
                      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => <option key={char} value={char}>{char}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {isExpanded && folderType === 'sprite' && (
                <div className="pl-4 pt-1 pb-2 flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setSpriteSortOrder(prev => prev === 'alpha' ? 'default' : 'alpha')}
                    className="px-2 py-1 rounded bg-msx-border hover:bg-msx-highlight text-msx-textprimary transition-colors"
                    title={spriteSortOrder === 'alpha' ? "Restore default order" : "Sort alphabetically"}
                  >
                    Sort ({spriteSortOrder === 'alpha' ? 'A-Z' : 'Default'})
                  </button>
                  <div className="flex items-center gap-1">
                    <label htmlFor="sprite-filter" className="text-msx-textsecondary">Filter:</label>
                    <select
                      id="sprite-filter"
                      value={spriteFilterChar}
                      onChange={e => setSpriteFilterChar(e.target.value)}
                      className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-xs focus:ring-msx-accent focus:border-msx-accent"
                    >
                      <option value="">All</option>
                      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => <option key={char} value={char}>{char}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {isExpanded && folderType === 'screenmap' && (
                <div className="pl-4 pt-1 pb-2 flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setScreenmapSortOrder(prev => prev === 'alpha' ? 'default' : 'alpha')}
                    className="px-2 py-1 rounded bg-msx-border hover:bg-msx-highlight text-msx-textprimary transition-colors"
                    title={screenmapSortOrder === 'alpha' ? "Restore default order" : "Sort alphabetically"}
                  >
                    Sort ({screenmapSortOrder === 'alpha' ? 'A-Z' : 'Default'})
                  </button>
                  <div className="flex items-center gap-1">
                    <label htmlFor="screenmap-filter" className="text-msx-textsecondary">Filter:</label>
                    <select
                      id="screenmap-filter"
                      value={screenmapFilterChar}
                      onChange={e => setScreenmapFilterChar(e.target.value)}
                      className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-xs focus:ring-msx-accent focus:border-msx-accent"
                    >
                      <option value="">All</option>
                      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => <option key={char} value={char}>{char}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {isExpanded && (
                <ul id={`folder-content-${folderType}`} className="pl-4 mt-0.5 space-y-0.5">
                  {folderType !== 'code' && (
                    <li className="pt-1">
                      <button
                        onClick={() => {
                          if (!folderEnabled) return;
                          if (folderType === 'screenmap') {
                            onNewAsset('screenmap', { screenKind: 'playable' });
                          } else {
                            onNewAsset(folderType);
                          }
                        }}
                        disabled={!folderEnabled}
                        title={folderEnabled ? undefined : disabledTitle}
                        className="w-full text-xs px-2 py-1 rounded bg-msx-accent/80 hover:bg-msx-accent text-white font-medium transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <PlusCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{FOLDER_NEW_LABELS[folderType] || `New ${FOLDER_DISPLAY_NAMES[folderType]}`}</span>
                      </button>
                    </li>
                  )}
                  {folderType === 'track' && (
                    <li className="pt-1">
                      <input
                        type="file"
                        accept=".json"
                        ref={trackFileInputRef}
                        onChange={handleImportTrackFile}
                        className="hidden"
                      />
                      <button
                        onClick={() => trackFileInputRef.current?.click()}
                        className="w-full text-xs px-2 py-1 rounded bg-msx-border hover:bg-msx-highlight text-msx-textprimary transition-colors"
                      >
                        Import Track (.json)
                      </button>
                    </li>
                  )}
                  {assetsInFolder.length === 0 && <li className="px-2 py-1 text-xs text-msx-textsecondary italic">No {FOLDER_DISPLAY_NAMES[folderType].toLowerCase()} yet.</li>}
                  {assetsInFolder.length > 0 && processedAssets.length === 0 && folderType === 'tile' && <li className="px-2 py-1 text-xs text-msx-textsecondary italic">No tiles match filter.</li>}
                  {assetsInFolder.length > 0 && processedAssets.length === 0 && folderType === 'sprite' && <li className="px-2 py-1 text-xs text-msx-textsecondary italic">No sprites match filter.</li>}
                  {assetsInFolder.length > 0 && processedAssets.length === 0 && folderType === 'screenmap' && <li className="px-2 py-1 text-xs text-msx-textsecondary italic">No screen maps match filter.</li>}
                  {processedAssets.map(asset => {
                    const isSelected = selectedAssetId === asset.id;
                    const isTileSelected = folderType === 'tile' && selectedTileIds.includes(asset.id);
                    const assetEnabled = hasActiveProject && isAssetTypeVisible(asset.type);
                    const assetDisabledTitle = getDisabledTitle(asset.type);

                    return (
                      <li
                        key={asset.id}
                        onContextMenu={
                          folderType === 'tile' ? (e) => handleTileContextMenu(e, asset.id) :
                          folderType === 'track' ? (e) => handleTrackContextMenu(e, asset.id) :
                          undefined
                        }
                        className={`flex items-center justify-between group w-full rounded-sm
                                    ${isTileSelected && !isSelected ? 'hover:bg-msx-border/70' : ''}
                                    ${isSelected ? '' : 'hover:bg-msx-border/70'}`}
                      >
                        <button
                          onClick={(e) => {
                            if (!assetEnabled) return;
                            if (folderType === 'tile') {
                              if (e.ctrlKey) {
                                setSelectedTileIds(prev => 
                                  prev.includes(asset.id) 
                                    ? prev.filter(id => id !== asset.id)
                                    : [...prev, asset.id]
                                );
                              } else {
                                setSelectedTileIds([asset.id]);
                                onSelectAsset(asset.id, ASSET_TYPE_TO_EDITOR[asset.type]);
                              }
                            } else {
                              onSelectAsset(asset.id, ASSET_TYPE_TO_EDITOR[asset.type]);
                            }
                          }}
                          onDoubleClick={() => onRequestRename(asset.id, asset.name, asset.type)}
                          className={`text-left py-1 flex items-center flex-grow truncate rounded-l-sm
                                    ${!assetEnabled ? disabledItemClass : (isSelected ? activeItemClass : (isTileSelected ? selectedTileClass : inactiveItemClass))}
                                    pl-2`}
                          disabled={!assetEnabled}
                          title={assetDisabledTitle || `Select: ${asset.name}. Double-click to rename.`}
                          aria-current={isSelected ? "page" : undefined}
                        >
                          <AssetIcon type={asset.type} />
                          <span className="truncate text-xs">{asset.name}</span>
                          {asset.type === 'screenmap' && (
                            <span className="ml-1 px-1 py-0.5 rounded bg-msx-bgcolor-dark text-[0.6rem] uppercase text-msx-textsecondary border border-msx-border/50">
                              {String((asset.data as any)?.screenKind || 'playable')}
                            </span>
                          )}
                        </button>
                        <div className={`flex-shrink-0 flex items-center ${isTileSelected ? (isSelected ? activeItemClass : selectedTileClass) : ''}`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRequestRename(asset.id, asset.name, asset.type); }}
                            disabled={!assetEnabled}
                            className={`p-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-msx-accent
                                        ${isSelected || isTileSelected ? 'text-white hover:bg-msx-highlight/80' : 'text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-accent/30'}
                                        opacity-0 group-hover:opacity-100 focus-within:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed`}
                            aria-label={`Rename ${asset.name}`}
                            title={`Rename ${asset.name}`}
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRequestDuplicate(asset.id); }}
                            disabled={!assetEnabled}
                            className={`p-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-msx-accent
                                        ${isSelected || isTileSelected ? 'text-white hover:bg-msx-highlight/80' : 'text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-accent/30'}
                                        opacity-0 group-hover:opacity-100 focus-within:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed`}
                            aria-label={`Duplicate ${asset.name}`}
                            title={`Duplicate ${asset.name}`}
                          >
                            <DocumentDuplicateIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRequestDelete(asset.id); }}
                            disabled={!assetEnabled}
                            className={`p-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-msx-danger
                                        ${isSelected || isTileSelected ? 'text-white hover:bg-msx-danger/80' : 'text-msx-danger/70 hover:text-msx-danger hover:bg-msx-danger/30'}
                                        opacity-0 group-hover:opacity-100 focus-within:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed`}
                            aria-label={`Delete ${asset.name}`}
                            title={`Delete ${asset.name}`}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      )}
    </Panel>
  );
};
