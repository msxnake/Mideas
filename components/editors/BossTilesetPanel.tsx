import React from 'react';
import { Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';
import { Button } from '../common/Button';
import { EraserIcon } from '../icons/MsxIcons';

/**
 * Props for the BossTilesetPanel component.
 */
interface BossTilesetPanelProps {
  /** A list of all available tile assets in the project. */
  allTiles: Tile[];
  /** The ID of the currently selected tile. */
  selectedTileId: string | null;
  /** Callback function to select a tile. */
  onSelectTile: (id: string | null) => void;
  /** The current MSX screen mode. */
  currentScreenMode: string;
}

/**
 * A panel that displays a list of available 8x8 tiles for building a boss.
 * It allows the user to select a tile to place on the boss grid.
 */
export const BossTilesetPanel: React.FC<BossTilesetPanelProps> = ({
  allTiles,
  selectedTileId,
  onSelectTile,
  currentScreenMode,
}) => {

  const isEraserSelected = selectedTileId === null;

  return (
    <div className="w-64 p-2 border-l border-msx-border overflow-y-auto flex-shrink-0 h-[800px]">
      <h4 className="text-sm pixel-font text-msx-highlight mb-2">All Tiles (8x8)</h4>

      {allTiles.length === 0 ? (
        <p className="text-xs text-msx-textsecondary">No tiles available in the project.</p>
      ) : (
        <>
          <div className="space-y-1">
            {allTiles.filter(tile => tile.width === 8 && tile.height === 8).map(tile => (
              <button
                key={tile.id}
                onClick={() => onSelectTile(tile.id)}
                className={`w-full text-left p-1 rounded flex items-center space-x-2 text-xs
                            ${selectedTileId === tile.id ? 'bg-msx-accent text-white' : 'hover:bg-msx-border'}`}
                title={`${tile.name} - Click to select`}
              >
                <img
                  src={createTileDataURL(tile, 0, 0, Math.min(32, tile.width), Math.min(32, tile.height), tile.width, currentScreenMode)}
                  alt={tile.name}
                  className="w-8 h-8 object-contain border border-msx-border flex-shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="truncate flex-grow">{tile.name}</span>
              </button>
            ))}
          </div>
          <Button
            onClick={() => onSelectTile(null)}
            variant={isEraserSelected ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full mt-2"
            icon={<EraserIcon className="w-3.5 h-3.5 mr-1" />}
          >
            Clear Tile
          </Button>
        </>
      )}
    </div>
  );
};
