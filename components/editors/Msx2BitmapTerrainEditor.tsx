import React, { useEffect, useMemo, useRef } from 'react';
import { Msx2BitmapTerrainAsset, Msx2BitmapTerrainAssetTile, Screen5PaletteSlot } from '../../types';
import { autotileTemplateSpec, describeAutotileMask } from '../../utils/msx2Autotile';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots, screen5SlotsToMsxColors } from '../../utils/msx2PaletteUtils';
import { Panel } from '../common/Panel';
import { GridIcon, TilesetIcon } from '../icons/MsxIcons';

const TILE = 16;
const GRID_ZOOM = 4;
const DETAIL_ZOOM = 6;

interface Msx2BitmapTerrainEditorProps {
  terrainAsset: Msx2BitmapTerrainAsset;
}

const slotAt = (tile: Msx2BitmapTerrainAssetTile | undefined, x: number, y: number): number =>
  Math.max(0, Math.min(15, Number(tile?.pixels?.[y]?.[x]) || 0));

const collectUsedSlots = (tiles: Msx2BitmapTerrainAssetTile[]): Set<number> => {
  const used = new Set<number>();
  tiles.forEach(tile => {
    (tile.pixels || []).forEach(row => {
      (row || []).forEach(value => used.add(Math.max(0, Math.min(15, Number(value) || 0))));
    });
  });
  return used;
};

const TerrainTileCanvas: React.FC<{
  tile?: Msx2BitmapTerrainAssetTile;
  colors: string[];
  zoom: number;
  showGrid?: boolean;
}> = ({ tile, colors, zoom, showGrid = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = Math.max(1, Number(tile?.width) || TILE);
  const height = Math.max(1, Number(tile?.height) || TILE);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width * zoom;
    canvas.height = height * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = colors[slotAt(tile, x, y)] || '#000000';
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom + 0.5, 0);
        ctx.lineTo(x * zoom + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(canvas.width, y * zoom + 0.5);
        ctx.stroke();
      }
    }
  }, [tile, colors, zoom, width, height, showGrid]);

  return (
    <canvas
      ref={canvasRef}
      width={width * zoom}
      height={height * zoom}
      className="block"
      style={{ width: width * zoom, height: height * zoom, imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};

export const Msx2BitmapTerrainEditor: React.FC<Msx2BitmapTerrainEditorProps> = ({ terrainAsset }) => {
  const terrain = terrainAsset.terrain;
  const spec = useMemo(() => autotileTemplateSpec(terrain.template), [terrain.template]);
  const paletteSlots: Screen5PaletteSlot[] = useMemo(
    () => ensureScreen5PaletteSlots(terrainAsset.palette?.length ? terrainAsset.palette : createDefaultScreen5PaletteSlots()).slots,
    [terrainAsset.palette],
  );
  const colors = useMemo(() => screen5SlotsToMsxColors(paletteSlots).map(color => color.hex), [paletteSlots]);
  const usedSlots = useMemo(() => collectUsedSlots(terrainAsset.tiles || []), [terrainAsset.tiles]);
  const tilesById = useMemo(() => {
    const map = new Map<string, Msx2BitmapTerrainAssetTile>();
    (terrainAsset.tiles || []).forEach(tile => map.set(tile.id, tile));
    return map;
  }, [terrainAsset.tiles]);

  const mappedTiles = spec.masks
    .filter((mask): mask is number => mask !== null)
    .map(mask => tilesById.get(terrain.mapping?.[mask] || ''))
    .filter(Boolean).length;
  const variantCount = Object.values(terrain.variants || {}).reduce((count, list) => count + (list?.length || 0), 0);
  const centreMask = terrain.template === 'wang47' ? 255 : 15;
  const centreTile = tilesById.get(terrain.mapping?.[centreMask] || '') || tilesById.get(terrain.mapping?.[15] || '');

  return (
    <div className="flex h-full gap-2 overflow-auto p-2 text-msx-textprimary">
      <div className="flex min-w-[360px] flex-1 flex-col gap-2">
        <Panel title="Terrain grid" icon={<GridIcon className="h-4 w-4" />}>
          <div className="flex flex-col gap-2 p-2">
            <div>
              <h3 className="truncate text-sm font-semibold text-msx-highlight" title={terrainAsset.name}>
                {terrainAsset.name}
              </h3>
              <p className="text-xs text-msx-textsecondary">
                {terrain.template} - {mappedTiles}/{spec.masks.filter(mask => mask !== null).length} celdas - {terrainAsset.tiles.length} tiles guardados
                {variantCount > 0 ? ` - ${variantCount} variantes` : ''}
              </p>
            </div>

            <div
              className="inline-grid w-fit overflow-hidden border border-msx-border bg-msx-bgcolor"
              style={{ gridTemplateColumns: `repeat(${spec.columns}, ${TILE * GRID_ZOOM}px)` }}
            >
              {spec.masks.map((mask, index) => {
                const tile = mask === null ? undefined : tilesById.get(terrain.mapping?.[mask] || '');
                return (
                  <div
                    key={`terrain-cell-${index}`}
                    className="relative"
                    style={{
                      width: TILE * GRID_ZOOM,
                      height: TILE * GRID_ZOOM,
                      outline: '1px solid rgba(255,255,255,0.10)',
                    }}
                    title={mask === null ? 'celda sin uso' : `${describeAutotileMask(mask, terrain.template)} - m${mask}${tile ? ` - ${tile.name}` : ' - sin tile'}`}
                  >
                    {tile ? (
                      <TerrainTileCanvas tile={tile} colors={colors} zoom={GRID_ZOOM} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-msx-panelbg/50 text-[10px] text-msx-textsecondary">
                        {mask === null ? '' : `m${mask}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] leading-tight text-msx-textsecondary">
              La rejilla usa el mismo orden que la plantilla de importacion: 4x4 para blob16 y 8x6 para wang47.
            </p>
          </div>
        </Panel>
      </div>

      <div className="flex w-72 min-w-[240px] flex-col gap-2">
        <Panel title="Paleta usada" icon={<TilesetIcon className="h-4 w-4" />}>
          <div className="flex flex-col gap-2 p-2">
            <div className="grid grid-cols-4 gap-1.5">
              {paletteSlots.map(slot => {
                const isUsed = usedSlots.has(slot.slotIndex);
                return (
                  <div
                    key={`terrain-palette-${slot.slotIndex}`}
                    className={`rounded border p-1 ${isUsed ? 'border-msx-highlight bg-msx-bgcolor' : 'border-msx-border bg-msx-panelbg/50 opacity-60'}`}
                    title={`Slot ${slot.slotIndex}: ${slot.hex}${isUsed ? ' usado' : ' no usado'}`}
                  >
                    <div className="h-6 rounded border border-black/40" style={{ backgroundColor: slot.hex }} />
                    <div className="mt-1 flex items-center justify-between gap-1 text-[9px]">
                      <span className="text-msx-textsecondary">S{slot.slotIndex}</span>
                      {isUsed && <span className="text-msx-highlight">used</span>}
                    </div>
                    <div className="truncate text-[8px] text-msx-textsecondary">{slot.hex}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-msx-textsecondary">
              {usedSlots.size} slots usados en los tiles de este terrain.
            </p>
          </div>
        </Panel>

        <Panel title="Tile central">
          <div className="p-2">
            {centreTile ? (
              <div className="flex flex-col gap-2">
                <div className="w-fit border border-msx-border bg-msx-bgcolor">
                  <TerrainTileCanvas tile={centreTile} colors={colors} zoom={DETAIL_ZOOM} showGrid />
                </div>
                <div className="text-xs text-msx-textsecondary">
                  <p className="truncate text-msx-textprimary" title={centreTile.name}>{centreTile.name}</p>
                  <p>{centreTile.width}x{centreTile.height}px - centro m{centreMask}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-msx-textsecondary">Este terrain no tiene tile central m{centreMask}.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default Msx2BitmapTerrainEditor;
