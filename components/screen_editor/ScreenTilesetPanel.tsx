



import React from 'react';
import { Tile, ScreenEditorTool, EffectZone } from '../../types'; // Added EffectZone
import { createTileDataURL } from '../utils/screenUtils';
import { Button } from '../common/Button';
import { EraserIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link ScreenTilesetPanel} component.
 * @category ScreenEditor
 */
interface ScreenTilesetPanelProps {
  /** The currently active layer in the editor. */
  activeLayer: 'background' | 'collision' | 'effects' | 'entities';
  /** The tileset available for the screen. */
  tileset: Tile[];
  /** The ID of the currently selected tile. */
  selectedTileId: string | null;
  /** Callback function to set the selected tile ID. */
  setSelectedTileId: (id: string | null) => void;
  /** The current screen mode. */
  currentScreenMode: string;
  /** The base dimension of a tile in the editor. */
  editorBaseTileDim: number;
  /** The currently active screen editor tool. */
  currentScreenTool: ScreenEditorTool;
  /** Callback function to set the active screen editor tool. */
  onSetScreenTool: (tool: ScreenEditorTool) => void;
  /** An array of effect zones for the current screen. */
  effectZones: EffectZone[];
  /** The ID of the currently selected effect zone. */
  selectedEffectZoneId: string | null;
  /** Callback function to select an effect zone. */
  onSelectEffectZone: (id: string | null) => void;
}

/**
 * A panel that displays the tileset for the screen editor, allowing tile selection and tool activation.
 * It also displays a list of effect zones when the 'effects' layer is active.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const ScreenTilesetPanel: React.FC<ScreenTilesetPanelProps> = ({
  activeLayer,
  tileset,
  selectedTileId,
  setSelectedTileId,
  currentScreenMode,
  editorBaseTileDim,
  currentScreenTool,
  onSetScreenTool,
  effectZones, // New
  selectedEffectZoneId, // New
  onSelectEffectZone, // New
}) => {

  const eraserButtonClass = `w-full mt-1 p-1 text-xs rounded ${currentScreenTool === 'erase' ? 'bg-msx-highlight text-msx-bgcolor' : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight/70'}`;

  const renderTileBasedTools = () => (
    <>
      {tileset.length === 0 && <p className="text-xs text-msx-textsecondary">No tiles available. Create tiles first.</p>}
      <div className="grid grid-cols-3 gap-1">
        {tileset.map(tile => (
          <div
            key={tile.id}
            onClick={() => {
              setSelectedTileId(tile.id);
              if (currentScreenTool !== 'select') {
                onSetScreenTool('draw');
              }
            }}
            className={`p-0.5 border-2 rounded cursor-pointer 
                        ${selectedTileId === tile.id && (currentScreenTool === 'draw' || currentScreenTool === 'select') ? 'border-msx-accent bg-msx-accent/30' : 'border-transparent hover:border-msx-highlight'}`}
            title={`${tile.name} (${tile.width}x${tile.height}) - Click to select for drawing/filling.`}
          >
            <img
              src={createTileDataURL(tile, 0, 0, Math.min(40, tile.width), Math.min(40, tile.height), tile.width, currentScreenMode)}
              alt={tile.name}
              className="w-full h-auto object-contain"
              style={{ imageRendering: 'pixelated', maxWidth: '40px', maxHeight: '40px' }}
            />
          </div>
        ))}
      </div>
      <Button
        onClick={() => {
          setSelectedTileId(null);
          onSetScreenTool('erase');
        }}
        className={eraserButtonClass}
        icon={<EraserIcon className="w-3.5 h-3.5 mr-1" />}
      >
        Eraser / Clear Tile
      </Button>
    </>
  );

  const renderEffectZoneTools = () => (
    <div className="space-y-1">
      {effectZones.length === 0 && <p className="text-xs text-msx-textsecondary italic">No effect zones defined. Click "Add Effect Zone" in the toolbar.</p>}
      {effectZones.map(zone => (
        <Button
          key={zone.id}
          onClick={() => onSelectEffectZone(zone.id)}
          variant={selectedEffectZoneId === zone.id ? 'primary' : 'ghost'}
          size="sm"
          className="w-full justify-start truncate"
          title={`Select Effect Zone: ${zone.name}`}
        >
          {zone.name}
        </Button>
      ))}
    </div>
  );


  return (
    <div className="w-48 p-2 border-r border-msx-border overflow-y-auto flex-shrink-0">
      <h4 className="text-sm pixel-font text-msx-highlight mb-2">
        {activeLayer === 'entities' ? 'Entities' : 
         activeLayer === 'effects' ? 'Effect Zones' : 'Tileset & Tools'}
      </h4>
      {activeLayer === 'entities' && (
         <p className="text-xs text-msx-textsecondary">Select an Entity Template from the right panel to place instances.</p>
      )}
      {(activeLayer === 'background' || activeLayer === 'collision') && renderTileBasedTools()}
      {activeLayer === 'effects' && renderEffectZoneTools()}
    </div>
  );
};