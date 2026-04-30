import React, { useMemo } from 'react';
import { ContextMenuItem, Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';
import { Button } from '../common/Button';
import { EraserIcon, PlusCircleIcon } from '../icons/MsxIcons';

/**
 * Props for the BossTilesetPanel component.
 */
interface BossTilesetPanelProps {
  /** A list of all available tile assets in the project. */
  allTiles: Tile[];
  /** Tile IDs already assigned to at least one tile bank. */
  assignedTileIds: Set<string>;
  /** The ID of the currently selected tile. */
  selectedTileId: string | null;
  /** Callback function to select a tile. */
  onSelectTile: (id: string | null) => void;
  /** Callback to display the shared application context menu. */
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
  /** Callback to create a mirrored copy of a tile. */
  onCreateMirroredTile: (tile: Tile, axis: 'horizontal' | 'vertical') => void;
  /** The current MSX screen mode. */
  currentScreenMode: string;
}

/**
 * A panel that displays a list of available 8x8 tiles for building a boss.
 * It allows the user to select a tile to place on the boss grid.
 */
export const BossTilesetPanel: React.FC<BossTilesetPanelProps> = ({
  allTiles,
  assignedTileIds,
  selectedTileId,
  onSelectTile,
  onShowContextMenu,
  onCreateMirroredTile,
  currentScreenMode,
}) => {

  const isEraserSelected = selectedTileId === null;
  const eightByEightTiles = useMemo(
    () => allTiles.filter(tile => tile.width === 8 && tile.height === 8),
    [allTiles]
  );
  const assignedTiles = useMemo(
    () => eightByEightTiles.filter(tile => assignedTileIds.has(tile.id)),
    [eightByEightTiles, assignedTileIds]
  );
  const unassignedTiles = useMemo(
    () => eightByEightTiles.filter(tile => !assignedTileIds.has(tile.id)),
    [eightByEightTiles, assignedTileIds]
  );

  const handleTileContextMenu = (event: React.MouseEvent, tile: Tile) => {
    event.preventDefault();
    onSelectTile(tile.id);

    const menuItems: ContextMenuItem[] = [
      {
        label: 'Create new tile (mirror horiz.)',
        icon: <PlusCircleIcon className="w-4 h-4" />,
        onClick: () => onCreateMirroredTile(tile, 'horizontal'),
      },
      {
        label: 'New tile (mirror vert)',
        icon: <PlusCircleIcon className="w-4 h-4" />,
        onClick: () => onCreateMirroredTile(tile, 'vertical'),
      },
    ];

    onShowContextMenu({ x: event.clientX, y: event.clientY }, menuItems);
  };

  const renderTileButton = (tile: Tile) => (
    <button
      key={tile.id}
      onClick={() => onSelectTile(tile.id)}
      onContextMenu={(event) => handleTileContextMenu(event, tile)}
      className={`w-full text-left p-1 rounded flex items-center space-x-2 text-xs
                  ${selectedTileId === tile.id ? 'bg-msx-accent text-white' : 'hover:bg-msx-border'}`}
      title={`${tile.name} - Click to select, right-click for mirror options`}
    >
      <img
        src={createTileDataURL(tile, 0, 0, Math.min(32, tile.width), Math.min(32, tile.height), tile.width, currentScreenMode)}
        alt={tile.name}
        className="w-8 h-8 object-contain border border-msx-border flex-shrink-0"
        style={{ imageRendering: 'pixelated' }}
      />
      <span className="truncate flex-grow">{tile.name}</span>
    </button>
  );

  return (
    <div className="w-52 2xl:w-64 min-h-0 p-2 border-l border-msx-border overflow-hidden flex-shrink-0 flex flex-col">
      <h4 className="text-sm pixel-font text-msx-highlight mb-2 flex-shrink-0">Assigned (8x8)</h4>

      {eightByEightTiles.length === 0 ? (
        <p className="text-xs text-msx-textsecondary">No tiles available in the project.</p>
      ) : (
        <div className="min-h-0 flex flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {assignedTiles.length > 0 ? (
              assignedTiles.map(renderTileButton)
            ) : (
              <p className="text-xs text-msx-textsecondary italic p-1">No assigned tiles.</p>
            )}
            {unassignedTiles.length > 0 && (
              <div className="pt-3">
                <h4 className="text-sm pixel-font text-msx-danger mb-2">Not Assigned</h4>
                <div className="space-y-1">
                  {unassignedTiles.map(renderTileButton)}
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={() => onSelectTile(null)}
            variant={isEraserSelected ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full mt-2 flex-shrink-0"
            icon={<EraserIcon className="w-3.5 h-3.5 mr-1" />}
          >
            Clear Tile
          </Button>
        </div>
      )}
    </div>
  );
};
