import React, { useMemo, useState } from 'react';
import { Msx2Screen4Tile, Screen5PaletteSlot } from '../../types';
import {
  MSX2_TILE_BEHAVIOR_KINDS,
  MSX2_TILE_BEHAVIOR_LABELS,
  Msx2Screen4TileBehaviorFilter,
  countMsx2TilesByBehavior,
  filterMsx2TilesByBehavior,
  getMsx2TileBehaviorKind,
} from '../../utils/msx2Screen4TileBehavior';
import { Button } from '../common/Button';
import {
  Msx2Screen4TileEditorPanel,
  Msx2Screen4TileEditorPanelProps,
  TILE_SIZE,
  TRANSPARENT_HEX,
} from './Msx2Screen4EditorParts';

const getTilePixelWidth = (tile: Msx2Screen4Tile | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? TILE_SIZE) || TILE_SIZE));

const getTilePixelHeight = (tile: Msx2Screen4Tile | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? TILE_SIZE) || TILE_SIZE));

type Msx2Screen4TileStudioProps = Omit<Msx2Screen4TileEditorPanelProps, 'layout' | 'canvasZoom'> & {
  tiles: Msx2Screen4Tile[];
  onSelectTileIndex: (index: number) => void;
  onAddTile: () => void;
  onDuplicateTile: () => void;
  onClearTile: () => void;
  onClose: () => void;
};

const Msx2TileStudioPreview: React.FC<{ tile: Msx2Screen4Tile; slots: Screen5PaletteSlot[] }> = ({ tile, slots }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const width = getTilePixelWidth(tile);
    const height = getTilePixelHeight(tile);
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = tile.pixels?.[y]?.[x] ?? 0;
        const hex = slots[slot]?.hex || '#000000';
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [tile, slots]);

  return (
    <canvas
      ref={canvasRef}
      className="h-12 w-12 flex-none rounded border border-msx-border bg-black"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};

export const Msx2Screen4TileStudio: React.FC<Msx2Screen4TileStudioProps> = ({
  tiles,
  slots,
  selectedTileIndex,
  onSelectTileIndex,
  onAddTile,
  onDuplicateTile,
  onClearTile,
  onClose,
  ...editorProps
}) => {
  const [behaviorFilter, setBehaviorFilter] = useState<Msx2Screen4TileBehaviorFilter>('all');
  const filteredTiles = useMemo(
    () => filterMsx2TilesByBehavior(tiles, behaviorFilter),
    [tiles, behaviorFilter]
  );
  const behaviorCounts = useMemo(() => countMsx2TilesByBehavior(tiles), [tiles]);

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-msx-panelbg border border-msx-border rounded-md shadow-lg">
      <div className="flex items-center justify-between gap-2 p-2 border-b border-msx-border flex-shrink-0">
        <div>
          <h2 className="text-sm font-medium text-msx-textprimary">Estudio de tiles MSX2</h2>
          <p className="text-[0.65rem] text-msx-textsecondary">
            Edita forma, colores, comportamiento e hitbox de todos los tiles del proyecto.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={onClose} aria-label="Volver al mapa">
          Volver al mapa
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 gap-2 p-2">
        <aside className="w-[240px] flex-shrink-0 min-h-0 flex flex-col bg-msx-bgcolor/40 border border-msx-border rounded-md overflow-hidden">
          <div className="p-2 space-y-2 border-b border-msx-border flex-shrink-0">
            <label className="block space-y-1 text-xs">
              <span className="text-msx-textsecondary">Filtrar por comportamiento</span>
              <select
                value={behaviorFilter}
                onChange={event => setBehaviorFilter(event.target.value as Msx2Screen4TileBehaviorFilter)}
                className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
                aria-label="MSX2 tile behavior filter"
              >
                <option value="all">Todos ({tiles.length})</option>
                {MSX2_TILE_BEHAVIOR_KINDS.map(kind => (
                  <option key={kind} value={kind}>
                    {MSX2_TILE_BEHAVIOR_LABELS[kind]} ({behaviorCounts[kind]})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-1">
              <Button size="sm" variant="secondary" onClick={onAddTile}>Add</Button>
              <Button size="sm" variant="secondary" onClick={onDuplicateTile}>Dup</Button>
              <Button size="sm" variant="danger" onClick={onClearTile}>Clear</Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredTiles.length === 0 ? (
              <div className="text-xs text-msx-textsecondary">No hay tiles para este filtro.</div>
            ) : (
              filteredTiles.map(({ tile, index }) => {
                const kind = getMsx2TileBehaviorKind(tile);
                return (
                  <button
                    key={tile.id}
                    type="button"
                    className={`w-full text-left px-2 py-2 rounded border text-xs flex items-center gap-2 ${
                      index === selectedTileIndex
                        ? 'border-msx-highlight bg-msx-highlight/20'
                        : 'border-msx-border bg-msx-panelbg hover:border-msx-highlight/50'
                    }`}
                    onClick={() => onSelectTileIndex(index)}
                  >
                    <Msx2TileStudioPreview tile={tile} slots={slots} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{index}: {tile.name}</span>
                      <span className="block text-[10px] text-msx-textsecondary">
                        {getTilePixelWidth(tile)}x{getTilePixelHeight(tile)} — {MSX2_TILE_BEHAVIOR_LABELS[kind]}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 flex items-center justify-center overflow-auto rounded-md border border-msx-border bg-black/40 p-4">
          <Msx2Screen4TileEditorPanel
            {...editorProps}
            selectedTileIndex={selectedTileIndex}
            slots={slots}
            layout="canvas"
            canvasZoom={32}
          />
        </main>

        <aside className="w-[320px] flex-shrink-0 min-h-0 overflow-hidden">
          <Msx2Screen4TileEditorPanel
            {...editorProps}
            selectedTileIndex={selectedTileIndex}
            slots={slots}
            layout="controls"
          />
        </aside>
      </div>
    </div>
  );
};
