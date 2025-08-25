

import React, { useState, useRef } from 'react';
import { ProjectAsset, EditorType } from '../../types'; // Added EditorType
import { Panel } from '../common/Panel';
import { TilesetIcon, SpriteIcon, MapIcon, CodeIcon, SoundIcon, PlaceholderIcon, FolderOpenIcon, WorldMapIcon, CaretDownIcon, CaretRightIcon, MusicNoteIcon, ListBulletIcon, PencilIcon, TrashIcon, QuestionMarkCircleIcon, PuzzlePieceIcon, SparklesIcon, BugIcon, WorldViewIcon, GameFlowIcon, ExpandAllIcon, CollapseAllIcon } from '../icons/MsxIcons'; // Added SparklesIcon

interface FileExplorerPanelProps {
  assets: ProjectAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string | null, editorType?: EditorType) => void; // Modified to accept EditorType
  onRequestRename: (assetId: string, currentName: string, assetType: ProjectAsset['type']) => void;
  onRequestDelete: (assetId: string) => void; 
  showTileBanksEntry?: boolean;
  isTileBanksActive?: boolean;
  isFontEditorActive?: boolean; 
  isHelpDocsActive?: boolean; 
  isComponentDefEditorActive?: boolean; // Added for Component Def Editor
  isEntityTemplateEditorActive?: boolean; // Added for Entity Template Editor
  isWorldViewActive?: boolean;
  isGameFlowActive?: boolean;
  isMainMenuActive?: boolean; // Added for Main Menu Editor
  className?: string;
}

const AssetIcon: React.FC<{type: ProjectAsset['type'] | 'tilebanks' | 'fonteditor' | 'helpdocs' | 'componentdefinitioneditor' | 'entitytemplateeditor' | 'worldview' | 'gameflow' | 'mainmenu'}> = ({ type }) => {
  const iconClass = "w-4 h-4 mr-2";
  switch (type) {
    case 'tile': return <TilesetIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'sprite': return <SpriteIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'boss': return <BugIcon className={`${iconClass} text-msx-danger group-hover:text-msx-accent`} />;
    case 'screenmap': return <MapIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'worldmap': return <WorldMapIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'gameflow': return <GameFlowIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'code': return <CodeIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'sound': return <SoundIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'track': return <MusicNoteIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'behavior': return <PuzzlePieceIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'componentdefinition': return <PuzzlePieceIcon className={`${iconClass} text-purple-400 group-hover:text-msx-accent`} />; 
    case 'entitytemplate': return <SpriteIcon className={`${iconClass} text-teal-400 group-hover:text-msx-accent`} />; 
    case 'tilebanks': return <ListBulletIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'fonteditor': return <PencilIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'helpdocs': return <QuestionMarkCircleIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'componentdefinitioneditor': return <PuzzlePieceIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'entitytemplateeditor': return <SpriteIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'worldview': return <WorldViewIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />;
    case 'mainmenu': return <ListBulletIcon className={`${iconClass} text-msx-textsecondary group-hover:text-msx-accent`} />; // Added Main Menu icon
    default: return <PlaceholderIcon className={`${iconClass} text-msx-textsecondary`} />;
  }
};

const FOLDER_TYPE_ORDER: ProjectAsset['type'][] = ['tile', 'sprite', 'boss', 'screenmap', 'worldmap', 'gameflow', 'sound', 'track', 'behavior', 'componentdefinition', 'entitytemplate', 'code'];
const FOLDER_DISPLAY_NAMES: Record<ProjectAsset['type'], string> = {
  tile: "Tiles",
  sprite: "Sprites",
  boss: "Bosses",
  screenmap: "Screen Maps",
  worldmap: "World Maps",
  gameflow: "Game Flows",
  sound: "Sound FX",
  track: "Music Tracks",
  behavior: "Behavior Scripts",
  componentdefinition: "Component Definitions (Data)",
  entitytemplate: "Entity Templates (Data)",
  code: "Code Files",
};

// Constants for special system asset IDs
export const TILE_BANKS_SYSTEM_ASSET_ID = "TILE_BANKS_EDITOR";
export const FONT_EDITOR_SYSTEM_ASSET_ID = "FONT_EDITOR";
export const HELP_DOCS_SYSTEM_ASSET_ID = "HELP_DOCS_SYSTEM_ASSET";
export const COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID = "COMPONENT_DEF_EDITOR_SYSTEM_ASSET";
export const ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID = "ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET";
export const WORLD_VIEW_SYSTEM_ASSET_ID = "WORLD_VIEW_SYSTEM_ASSET";
export const GAME_FLOW_SYSTEM_ASSET_ID = "GAME_FLOW_SYSTEM_ASSET_ID";
export const MAIN_MENU_SYSTEM_ASSET_ID = "MAIN_MENU_SYSTEM_ASSET"; // New system asset ID


export const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({ 
    assets, 
    selectedAssetId, 
    onSelectAsset, 
    onRequestRename,
    onRequestDelete,
    showTileBanksEntry = false,
    isTileBanksActive = false,
    isFontEditorActive = false,
    isHelpDocsActive = false,
    isComponentDefEditorActive = false,
    isEntityTemplateEditorActive = false,
    isWorldViewActive = false,
    isGameFlowActive = false,
    isMainMenuActive = false, // New prop
    className = '',
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'sound': true, 
    'track': true,
    'tile': true, 
    'sprite': true,
    'boss': true,
    'screenmap': true,
    'gameflow': true,
    'behavior': true, 
    'componentdefinition': true,
    'entitytemplate': true,
    'code': true,
  });

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

  const groupedAssets = assets.reduce((acc, asset) => {
    (acc[asset.type] = acc[asset.type] || []).push(asset);
    return acc;
  }, {} as Record<ProjectAsset['type'], ProjectAsset[]>);

  const baseItemClass = "w-full text-left pl-1 pr-1 py-1.5 rounded flex items-center group";
  const activeItemClass = "bg-msx-accent text-white"; 
  const inactiveItemClass = "text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary";

  const systemTools = [
    { id: WORLD_VIEW_SYSTEM_ASSET_ID, name: "World View", iconType: "worldview" as const, editorType: EditorType.WorldView, isActive: isWorldViewActive, title: "View Composite World Map" },
    { id: GAME_FLOW_SYSTEM_ASSET_ID, name: "Game Flow", iconType: "gameflow" as const, editorType: EditorType.GameFlow, isActive: isGameFlowActive, title: "Manage the game flow" },
    { id: MAIN_MENU_SYSTEM_ASSET_ID, name: "Main Menu", iconType: "mainmenu" as const, editorType: EditorType.MainMenu, isActive: isMainMenuActive, title: "Configure the game's main menu" },
    { id: COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, name: "Component Definitions", iconType: "componentdefinitioneditor" as const, editorType: EditorType.ComponentDefinitionEditor, isActive: isComponentDefEditorActive, title: "Manage Component Definitions" },
    { id: ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, name: "Entity Templates", iconType: "entitytemplateeditor" as const, editorType: EditorType.EntityTemplateEditor, isActive: isEntityTemplateEditorActive, title: "Manage Entity Templates" },
    ...(showTileBanksEntry ? [{ id: TILE_BANKS_SYSTEM_ASSET_ID, name: "Tile Banks", iconType: "tilebanks" as const, editorType: EditorType.TileBanks, isActive: isTileBanksActive, title: "Manage Tile Banks (Screen 2)" }] : []),
    { id: FONT_EDITOR_SYSTEM_ASSET_ID, name: "Font Editor", iconType: "fonteditor" as const, editorType: EditorType.Font, isActive: isFontEditorActive, title: "Edit MSX1 Font Characters" },
    { id: HELP_DOCS_SYSTEM_ASSET_ID, name: "Help & Tutorials", iconType: "helpdocs" as const, editorType: EditorType.HelpDocs, isActive: isHelpDocsActive, title: "View Help & Tutorials" },
  ];


  return (
    <Panel
      title="Project Assets"
      className={className}
      icon={<FolderOpenIcon className="w-4 h-4 text-msx-textsecondary"/>}
      headerButtons={
        <>
          <button onClick={handleExpandAll} title="Expand All" className="p-0.5 text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"><ExpandAllIcon className="w-3.5 h-3.5"/></button>
          <button onClick={handleCollapseAll} title="Collapse All" className="p-0.5 text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"><CollapseAllIcon className="w-3.5 h-3.5"/></button>
        </>
      }
    >
      {(assets.length === 0 && systemTools.every(tool => !tool.isActive)) && <p className="text-xs text-msx-textsecondary p-2">No assets in project. Click 'New Asset' in the toolbar to create one.</p>}
      <ul className="space-y-0.5 text-sm font-sans">
        {systemTools.map(tool => (
            tool.id === TILE_BANKS_SYSTEM_ASSET_ID && !showTileBanksEntry ? null : (
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
            )
        ))}

        {FOLDER_TYPE_ORDER.map(folderType => {
          const assetsInFolder = groupedAssets[folderType] || [];
          const isExpanded = !!expandedFolders[folderType];

          return (
            <li key={folderType}>
              <button
                onClick={() => toggleFolder(folderType)}
                className={`${baseItemClass} ${inactiveItemClass} focus:outline-none`}
                aria-expanded={isExpanded}
                aria-controls={`folder-content-${folderType}`}
              >
                {isExpanded ? <CaretDownIcon className="w-3 h-3 mr-1.5 flex-shrink-0" /> : <CaretRightIcon className="w-3 h-3 mr-1.5 flex-shrink-0" />}
                <AssetIcon type={folderType} /> 
                <span className="font-medium truncate">{FOLDER_DISPLAY_NAMES[folderType]}</span>
                <span className="ml-auto text-xs text-msx-textsecondary">({assetsInFolder.length})</span>
              </button>
              {isExpanded && (
                <ul id={`folder-content-${folderType}`} className="pl-4 mt-0.5 space-y-0.5">
                  {assetsInFolder.length === 0 && <li className="px-2 py-1 text-xs text-msx-textsecondary italic">No {FOLDER_DISPLAY_NAMES[folderType].toLowerCase()} yet.</li>}
                  {assetsInFolder.map(asset => (
                    <li key={asset.id} 
                        className={`flex items-center justify-between group w-full rounded-sm
                                    ${selectedAssetId === asset.id ? '' : 'hover:bg-msx-border/70'}`}
                    >
                      <button
                        onClick={() => onSelectAsset(asset.id)}
                        onDoubleClick={() => {
                            onRequestRename(asset.id, asset.name, asset.type);
                        }}
                        className={`text-left py-1 flex items-center flex-grow truncate rounded-l-sm
                                    ${selectedAssetId === asset.id ? activeItemClass : inactiveItemClass} 
                                    pl-2 
                                  `}
                        title={`Select: ${asset.name}. Double-click to rename.`}
                        aria-current={selectedAssetId === asset.id ? "page" : undefined}
                      >
                        <AssetIcon type={asset.type} />
                        <span className="truncate text-xs">{asset.name}</span>
                      </button>
                      <div className="flex-shrink-0 flex items-center">
                        <button
                            onClick={(e) => {
                            e.stopPropagation(); 
                            onRequestRename(asset.id, asset.name, asset.type);
                            }}
                            className={`p-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-msx-accent 
                                        ${selectedAssetId === asset.id 
                                            ? 'text-white hover:bg-msx-highlight/80' 
                                            : 'text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-accent/30'
                                        } opacity-0 group-hover:opacity-100 focus-within:opacity-100`}
                            aria-label={`Rename ${asset.name}`}
                            title={`Rename ${asset.name}`}
                        >
                            <PencilIcon className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(asset.id); 
                            }}
                            className={`p-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-msx-danger
                                        ${selectedAssetId === asset.id 
                                            ? 'text-white hover:bg-msx-danger/80' 
                                            : 'text-msx-danger/70 hover:text-msx-danger hover:bg-msx-danger/30'
                                        } opacity-0 group-hover:opacity-100 focus-within:opacity-100`}
                            aria-label={`Delete ${asset.name}`}
                            title={`Delete ${asset.name}`}
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};
