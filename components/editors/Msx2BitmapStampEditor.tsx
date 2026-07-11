import React, { useMemo, useRef, useState } from 'react';
import { BitmapTileScreen5, BitmapTileStampScreen5, EditorType, Msx2BitmapStampAsset, Msx2Screen5BitmapRoom, PaletteAsset, ProjectAsset, Screen5PaletteSlot, WorldMapGraph } from '../../types';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots, screen5SlotsToMsxColors } from '../../utils/msx2PaletteUtils';
import { bitmapStampToPixelGrid, bitmapTileScreen5ToAtlasTile } from '../../utils/msx2Screen5BitmapTileLibrary';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PencilIcon, TrashIcon } from '../icons/MsxIcons';

/**
 * Stamp assembler for SCREEN 5 bitmap metatiles (msx2bitmapstamp): a columns×rows
 * puzzle of 16x16 bitmap tiles (msx2bitmaptile assets). The individual tiles are
 * authored in the Bitmap Tile Editor; here you only place them into cells. Used to
 * build head metatiles that dialogue portraits import.
 */

const TILE = 16;
const MAX_DIM = 8;
const PREVIEW_ZOOM = 6;

interface Msx2BitmapStampEditorProps {
  stamp: Msx2BitmapStampAsset;
  onUpdate: (data: Partial<Msx2BitmapStampAsset>) => void;
  allAssets: ProjectAsset[];
  activeBitmapWorld?: WorldMapGraph;
  onSelectAsset?: (assetId: string, editorType?: EditorType) => void;
  setStatusBarMessage?: (message: string) => void;
}

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const makeBlankTile = (paletteId: string): BitmapTileScreen5 => {
  const now = new Date().toISOString();
  return {
    id: `stamp_blank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: 'Empty',
    mode: 'SCREEN5_BITMAP',
    width: TILE,
    height: TILE,
    sourceType: 'manual-edit',
    paletteId,
    pixelData: new Array(TILE * TILE).fill(0),
    createdAt: now,
    updatedAt: now,
  };
};

/** True when a stamp cell holds no assigned tile (all pixels are slot 0). */
const isBlankTile = (tile: BitmapTileScreen5 | undefined): boolean =>
  !tile || !Array.isArray(tile.pixelData) || tile.pixelData.every(value => (Number(value) || 0) === 0);

type StampSourceTile = BitmapTileScreen5 & {
  sourceAssetId?: string;
  sourceLabel?: string;
  sourcePalette?: Screen5PaletteSlot[];
};

export const Msx2BitmapStampEditor: React.FC<Msx2BitmapStampEditorProps> = ({ stamp, onUpdate, allAssets, activeBitmapWorld, onSelectAsset, setStatusBarMessage }) => {
  const stampData: BitmapTileStampScreen5 = stamp.stamp;
  const columns = clampInt(stampData.columns, 1, MAX_DIM, 2);
  const rows = clampInt(stampData.rows, 1, MAX_DIM, 2);

  const [selectedTileId, setSelectedTileId] = useState<string | undefined>(undefined);
  const paintingRef = useRef<{ active: boolean; erase: boolean }>({ active: false, erase: false });
  const paletteAssets = useMemo(
    () => allAssets
      .filter(asset => asset.type === 'palette')
      .map(asset => ({ id: asset.id, name: asset.name, data: asset.data as PaletteAsset | undefined }))
      .filter(asset => !asset.data?.mode || asset.data.mode === 'SCREEN5'),
    [allAssets],
  );

  // Source 16x16 bitmap tiles that can be placed into cells. Keep standalone
  // bitmap-tile assets, plus unique atlas entries from the first room of the
  // active SCREEN 5 world. Pulling every room makes the stamp brush noisy fast.
  const sourceTiles = useMemo<StampSourceTile[]>(() => {
    const seenPixelKeys = new Set<string>();
    const addUnique = (tiles: StampSourceTile[], tile: StampSourceTile) => {
      const key = tile.pixelData.join(',');
      if (seenPixelKeys.has(key)) return;
      seenPixelKeys.add(key);
      tiles.push(tile);
    };

    const assetTiles: StampSourceTile[] = [];
    allAssets
      .filter(asset => asset.type === 'msx2bitmaptile')
      .map(asset => ({ ...(asset.data as BitmapTileScreen5), sourceAssetId: asset.id, sourceLabel: 'Bitmap Tile asset' }))
      .filter(tile => tile?.mode === 'SCREEN5_BITMAP' && (Number(tile.width) || 16) === TILE && (Number(tile.height) || 16) === TILE)
      .forEach(tile => addUnique(assetTiles, tile));

    const atlasTiles: StampSourceTile[] = [];
    const worldStartNodeId = activeBitmapWorld?.startScreenNodeId || activeBitmapWorld?.nodes?.[0]?.id;
    const worldStartRoomId = activeBitmapWorld?.nodes?.find(node => node.id === worldStartNodeId)?.screenAssetId
      || activeBitmapWorld?.nodes?.[0]?.screenAssetId;
    const atlasRoomAsset = worldStartRoomId
      ? allAssets.find(asset => asset.id === worldStartRoomId && asset.type === 'msx2bitmaproom')
      : allAssets.find(asset => asset.type === 'msx2bitmaproom');
    const room = atlasRoomAsset?.data as Msx2Screen5BitmapRoom | undefined;
    const atlas = room?.atlas;
    if (room && atlas?.pixels && Array.isArray(atlas.entries)) {
      atlas.entries.forEach(entry => {
        const w = Math.max(1, Number(entry.w) || TILE);
        const h = Math.max(1, Number(entry.h) || TILE);
        if (w !== TILE || h !== TILE) return;
        const pixelData: number[] = [];
        for (let y = 0; y < TILE; y++) {
          for (let x = 0; x < TILE; x++) {
            pixelData.push(Math.max(0, Math.min(15, Number(atlas.pixels[entry.sy + y]?.[entry.sx + x]) || 0)));
          }
        }
        addUnique(atlasTiles, {
          id: `atlas_${atlasRoomAsset?.id || room.id}_${entry.id}`,
          name: `${room.name} / ${entry.name}`,
          mode: 'SCREEN5_BITMAP',
          width: TILE,
          height: TILE,
          sourceType: 'atlas-export',
          paletteId: `${atlasRoomAsset?.id || room.id}_palette`,
          pixelData,
          collisionFlags: entry.collisionFlags,
          behaviorCode: entry.behaviorCode,
          tags: ['atlas', room.name],
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
          sourceLabel: `Atlas inicial${activeBitmapWorld?.name ? `: ${activeBitmapWorld.name}` : ''}`,
          sourcePalette: room.palette,
        });
      });
    }

    return [...assetTiles, ...atlasTiles].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeBitmapWorld, allAssets]);
  const selectedTile = sourceTiles.find(tile => tile.id === selectedTileId);

  // Working palette: the stamp's own palette, else default. Slots are what matter
  // for the ROM/portrait, so rendering everything with one palette stays faithful.
  const workingSlots: Screen5PaletteSlot[] = useMemo(() => {
    if (stamp.palette && stamp.palette.length === 16) return ensureScreen5PaletteSlots(stamp.palette).slots;
    return createDefaultScreen5PaletteSlots();
  }, [stamp.palette]);
  const colors = useMemo(() => screen5SlotsToMsxColors(workingSlots).map(color => color.hex), [workingSlots]);
  const hasActiveProjectPalette = paletteAssets.some(asset => asset.id === stampData.paletteId);

  const resolveTileSlots = (tile: BitmapTileScreen5 & { sourcePalette?: Screen5PaletteSlot[] }): Screen5PaletteSlot[] => {
    if (tile.sourcePalette?.length) return ensureScreen5PaletteSlots(tile.sourcePalette).slots;
    const paletteAsset = tile.paletteId ? allAssets.find(asset => asset.id === tile.paletteId && asset.type === 'palette') : undefined;
    return ensureScreen5PaletteSlots((paletteAsset?.data as PaletteAsset | undefined)?.slots || workingSlots).slots;
  };
  const commitStamp = (patch: Partial<BitmapTileStampScreen5>) => {
    onUpdate({ stamp: { ...stampData, ...patch, updatedAt: new Date().toISOString() } });
  };

  const setGridSize = (nextCols: number, nextRows: number) => {
    const cols = clampInt(nextCols, 1, MAX_DIM, columns);
    const rws = clampInt(nextRows, 1, MAX_DIM, rows);
    const tiles: BitmapTileScreen5[] = [];
    for (let r = 0; r < rws; r++) {
      for (let c = 0; c < cols; c++) {
        const old = r < rows && c < columns ? stampData.tiles?.[r * columns + c] : undefined;
        tiles.push(old ? old : makeBlankTile(stampData.paletteId));
      }
    }
    commitStamp({ columns: cols, rows: rws, tiles });
  };

  const assignCell = (index: number, erase: boolean) => {
    const tiles = (stampData.tiles || []).slice();
    while (tiles.length < columns * rows) tiles.push(makeBlankTile(stampData.paletteId));
    if (erase) {
      tiles[index] = makeBlankTile(stampData.paletteId);
      commitStamp({ tiles });
      return;
    }
    if (!selectedTile) {
      setStatusBarMessage?.('Selecciona primero un tile 16×16 de la lista para colocarlo.');
      return;
    }
    // Store a copy (keeping the source tile's paletteId) so later edits to the
    // source tile do not silently mutate the stamp. The whole cell is REPLACED,
    // so transparent (slot 0) pixels of the new tile erase whatever was there.
    const { sourceAssetId: _sourceAssetId, sourceLabel: _sourceLabel, sourcePalette: _sourcePalette, ...tileToStore } = selectedTile;
    tiles[index] = {
      ...tileToStore,
      id: `${stampData.id}_cell_${index}_${Date.now()}`,
      paletteId: hasActiveProjectPalette ? stampData.paletteId : selectedTile.paletteId,
    };
    // Adopt the placed tile's palette as the metatile palette so the composite
    // preview / portrait export render the tile's true colours (a stamp is one
    // metatile with one palette; tiles of a coherent head share a palette).
    const adoptedSlots = hasActiveProjectPalette ? workingSlots : resolveTileSlots(selectedTile);
    onUpdate({
      stamp: {
        ...stampData,
        tiles,
        paletteId: hasActiveProjectPalette ? stampData.paletteId : (selectedTile.paletteId || stampData.paletteId),
        updatedAt: new Date().toISOString(),
      },
      palette: adoptedSlots.map(slot => ({ ...slot })),
    });
  };

  const compositePixels = useMemo(() => bitmapStampToPixelGrid({ ...stampData, columns, rows }), [stampData, columns, rows]);

  const renameStamp = (name: string) => onUpdate({ name, stamp: { ...stampData, name } });
  const activatePalette = (paletteId: string) => {
    const paletteAsset = paletteAssets.find(asset => asset.id === paletteId);
    if (!paletteAsset?.data?.slots?.length) return;
    const slots = ensureScreen5PaletteSlots(paletteAsset.data.slots).slots;
    onUpdate({
      stamp: { ...stampData, paletteId, updatedAt: new Date().toISOString() },
      palette: slots.map(slot => ({ ...slot })),
    });
    setStatusBarMessage?.(`Stamp: paleta "${paletteAsset.name}" activada.`);
  };

  return (
    <div className="flex h-full gap-2 p-2 overflow-auto text-msx-textprimary">
      {/* Left: source tiles */}
      <div className="flex flex-col gap-2 w-56 min-w-[200px]">
        <Panel title={`Tiles 16×16 (${sourceTiles.length})`} icon={<PencilIcon className="w-4 h-4" />}>
          <div className="flex flex-col gap-1 p-1 max-h-[70vh] overflow-y-auto">
            {sourceTiles.length === 0 && (
              <p className="text-[10px] text-msx-textsecondary">
                No hay tiles 16×16 en el proyecto. Crea uno con "New Bitmap Tile" y edítalo en el Bitmap Tile Editor.
              </p>
            )}
            <div className="grid grid-cols-3 gap-1">
              {sourceTiles.map(tile => (
                <button
                  key={tile.id}
                  title={`${tile.name}${tile.sourceLabel ? ` - ${tile.sourceLabel}` : ''}`}
                  onClick={() => setSelectedTileId(tile.id)}
                  onDoubleClick={() => { if (tile.sourceAssetId) onSelectAsset?.(tile.sourceAssetId, EditorType.Msx2BitmapTile); }}
                  className={`relative border ${selectedTileId === tile.id ? 'border-msx-accent ring-1 ring-msx-accent' : 'border-msx-border'} bg-msx-bgcolor p-0.5`}
                >
                  <TileThumb tile={tile} colors={colors} zoom={3} />
                  {tile.sourceLabel?.startsWith('Atlas') && (
                    <span className="absolute bottom-0 right-0 bg-msx-panelbg/90 px-0.5 text-[8px] text-msx-highlight">A</span>
                  )}
                </button>
              ))}
            </div>
            {selectedTile && (
              <p className="text-[10px] text-msx-textsecondary mt-1 truncate">
                Pincel: <span className="text-msx-highlight">{selectedTile.name}</span>
                {selectedTile.sourceLabel && <span> · {selectedTile.sourceLabel}</span>}
              </p>
            )}
            <p className="text-[9px] text-msx-textsecondary leading-tight mt-1">
              Clic = seleccionar pincel · doble clic = abrir tile en su editor. En la rejilla: clic coloca, clic derecho borra.
            </p>
          </div>
        </Panel>
      </div>

      {/* Center: grid assembler */}
      <div className="flex flex-col gap-2 flex-1 min-w-[360px]">
        <Panel title="Stamp (ensamblar tiles)">
          <div className="flex flex-col gap-2 p-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                Nombre
                <input
                  className="bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs text-msx-textprimary"
                  value={stamp.name}
                  onChange={event => renameStamp(event.target.value)}
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                Cols
                <input
                  type="number"
                  min={1}
                  max={MAX_DIM}
                  className="w-14 bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs"
                  value={columns}
                  onChange={event => setGridSize(clampInt(event.target.value, 1, MAX_DIM, columns), rows)}
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                Rows
                <input
                  type="number"
                  min={1}
                  max={MAX_DIM}
                  className="w-14 bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs"
                  value={rows}
                  onChange={event => setGridSize(columns, clampInt(event.target.value, 1, MAX_DIM, rows))}
                />
              </label>
              <span className="text-[10px] text-msx-textsecondary">= {columns * TILE}×{rows * TILE}px</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded border border-msx-border bg-msx-bgcolor/50 p-2">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 text-xs text-msx-textsecondary">
                Paleta
                <select
                  value={paletteAssets.some(asset => asset.id === stampData.paletteId) ? stampData.paletteId : ''}
                  onChange={event => activatePalette(event.target.value)}
                  className="min-w-0 flex-1 rounded border border-msx-border bg-msx-panelbg px-2 py-1 text-xs text-msx-textprimary"
                >
                  <option value="">Paleta del stamp</option>
                  {paletteAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-8 gap-1">
                {workingSlots.map(slot => (
                  <span
                    key={`stamp-palette-${slot.slotIndex}`}
                    className="h-4 w-5 rounded border border-msx-border"
                    style={{ backgroundColor: slot.hex }}
                    title={`S${slot.slotIndex} ${slot.hex}`}
                  />
                ))}
              </div>
            </div>

            <div
              className="inline-block border border-msx-border bg-msx-bgcolor select-none"
              style={{ width: columns * TILE * PREVIEW_ZOOM, maxWidth: '100%' }}
              onMouseLeave={() => { paintingRef.current.active = false; }}
              onContextMenu={event => event.preventDefault()}
            >
              <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, ${TILE * PREVIEW_ZOOM}px)` }}>
                {Array.from({ length: columns * rows }, (_unused, index) => {
                  const tile = stampData.tiles?.[index];
                  const blank = isBlankTile(tile);
                  return (
                    <div
                      key={index}
                      className={`relative ${blank ? 'bg-msx-panelbg/40' : ''}`}
                      style={{ width: TILE * PREVIEW_ZOOM, height: TILE * PREVIEW_ZOOM, outline: '1px solid rgba(255,255,255,0.10)' }}
                      onMouseDown={event => {
                        const erase = event.button === 2;
                        paintingRef.current = { active: true, erase };
                        assignCell(index, erase);
                      }}
                      onMouseEnter={() => { if (paintingRef.current.active) assignCell(index, paintingRef.current.erase); }}
                      onMouseUp={() => { paintingRef.current.active = false; }}
                    >
                      {tile && !blank && <TileThumb tile={tile} colors={colors} zoom={PREVIEW_ZOOM} />}
                      {blank && <span className="absolute inset-0 flex items-center justify-center text-[9px] text-msx-textsecondary">·</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                icon={<TrashIcon className="w-3 h-3" />}
                onClick={() => commitStamp({ tiles: Array.from({ length: columns * rows }, () => makeBlankTile(stampData.paletteId)) })}
              >
                Vaciar rejilla
              </Button>
            </div>

            <div className="border-t border-msx-border pt-2 mt-1">
              <span className="text-[10px] text-msx-highlight">Preview compositado (sin uniones)</span>
              <div className="mt-1">
                <StampPreview pixels={compositePixels} colors={colors} zoom={4} />
              </div>
              <p className="text-[10px] text-msx-textsecondary mt-1">
                {columns * TILE}×{rows * TILE}px · {columns}×{rows} tiles. Importable como cabeza en un MSX2 Dialogue.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

const TileThumb: React.FC<{ tile: BitmapTileScreen5; colors: string[]; zoom: number }> = ({ tile, colors, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixels = useMemo(() => bitmapTileScreen5ToAtlasTile(tile).pixels, [tile]);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Clear first: slot 0 (transparent) paints nothing, so without this an earlier
    // tile would bleed through the transparent pixels of a newly placed one.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < (pixels[0]?.length || 0); x++) {
        ctx.fillStyle = colors[Math.max(0, Math.min(15, pixels[y][x]))] || '#000000';
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
  }, [pixels, colors, zoom]);
  const w = (pixels[0]?.length || TILE) * zoom;
  const h = pixels.length * zoom;
  return <canvas ref={canvasRef} width={w} height={h} style={{ width: w, height: h, imageRendering: 'pixelated', display: 'block' }} />;
};

const StampPreview: React.FC<{ pixels: number[][]; colors: string[]; zoom: number }> = ({ pixels, colors, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = pixels[0]?.length || TILE;
  const height = pixels.length || TILE;
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = colors[Math.max(0, Math.min(15, pixels[y]?.[x] ?? 0))] || '#000000';
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
  }, [pixels, colors, zoom, width, height]);
  return <canvas ref={canvasRef} width={width * zoom} height={height * zoom} className="border border-msx-border" style={{ imageRendering: 'pixelated' }} />;
};
