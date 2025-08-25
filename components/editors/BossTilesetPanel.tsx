import React from 'react';
import { Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';
import { Button } from '../common/Button';
import { EraserIcon } from '../icons/MsxIcons';

interface BossTilesetPanelProps {
  tileset: Tile[];
  selectedTileId: string | null;
  onSelectTile: (id: string | null) => void;
  currentScreenMode: string;
}

export const BossTilesetPanel: React.FC<BossTilesetPanelProps> = ({
  tileset,
  selectedTileId,
  onSelectTile,
  currentScreenMode,
}) => {

  const isEraserSelected = selectedTileId === null;

  return (
    <div className="w-48 p-2 border-l border-msx-border overflow-y-auto flex-shrink-0">
      <h4 className="text-sm pixel-font text-msx-highlight mb-2">Tileset</h4>

      {tileset.length === 0 ? (
        <p className="text-xs text-msx-textsecondary">No tiles available in the selected bank. Assign tiles in the Tile Bank Editor.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1">
            {tileset.map(tile => (
              <div
                key={tile.id}
                onClick={() => onSelectTile(tile.id)}
                className={`p-0.5 border-2 rounded cursor-pointer
                            ${selectedTileId === tile.id ? 'border-msx-accent bg-msx-accent/30' : 'border-transparent hover:border-msx-highlight'}`}
                title={`${tile.name} - Click to select`}
              >
                <img
                  src={createTileDataURL(tile, 0, 0, Math.min(32, tile.width), Math.min(32, tile.height), tile.width, currentScreenMode)}
                  alt={tile.name}
                  className="w-full h-auto object-contain"
                  style={{ imageRendering: 'pixelated', maxWidth: '32px', maxHeight: '32px' }}
                />
              </div>
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
