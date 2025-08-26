import React from 'react';
import { Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';
import { Button } from '../common/Button';
import { EraserIcon } from '../icons/MsxIcons';

interface BossTilesetPanelProps {
  allTiles: Tile[];
  selectedTileId: string | null;
  onSelectTile: (id: string | null) => void;
  currentScreenMode: string;
}

export const BossTilesetPanel: React.FC<BossTilesetPanelProps> = ({
  allTiles,
  selectedTileId,
  onSelectTile,
  currentScreenMode,
}) => {

  const isEraserSelected = selectedTileId === null;

  return (
    <div className="w-48 p-2 border-l border-msx-border overflow-y-auto flex-shrink-0">
      <h4 className="text-sm pixel-font text-msx-highlight mb-2">All Tiles</h4>

      {allTiles.length === 0 ? (
        <p className="text-xs text-msx-textsecondary">No tiles available in the project.</p>
      ) : (
        <>
          <div className="space-y-1">
            {allTiles.map(tile => (
              <button
                key={tile.id}
                onClick={() => onSelectTile(tile.id)}
                className={`w-full text-left p-1 rounded flex items-center space-x-2 text-xs
                            ${selectedTileId === tile.id ? 'bg-msx-accent text-white' : 'hover:bg-msx-border'}`}
                title={`${tile.name} - Click to select`}
              >
                <img
                  src={createTileDataURL(tile, 0, 0, Math.min(16, tile.width), Math.min(16, tile.height), tile.width, currentScreenMode)}
                  alt={tile.name}
                  className="w-4 h-4 object-contain border border-msx-border flex-shrink-0"
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
