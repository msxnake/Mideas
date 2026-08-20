import { BitmapTileScreen5, BitmapTileStampFrameVariantScreen5, BitmapTileStampScreen5, Msx2BitmapStampAsset, PaletteAsset, ProjectAsset, Screen5PaletteSlot } from '../types';
import { ensureScreen5PaletteSlots } from './msx2PaletteUtils';

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'bitmap_tile';

const cloneSlots = (slots: Screen5PaletteSlot[]): Screen5PaletteSlot[] =>
  ensureScreen5PaletteSlots(slots).slots.map(slot => ({ ...slot }));

export function areScreen5PalettesEquivalent(a: Screen5PaletteSlot[] | undefined, b: Screen5PaletteSlot[] | undefined): boolean {
  const left = ensureScreen5PaletteSlots(a).slots;
  const right = ensureScreen5PaletteSlots(b).slots;
  if (left.length !== right.length) return false;
  return left.every((slot, index) => {
    const other = right[index];
    return slot.slotIndex === other.slotIndex
      && slot.masterIndex === other.masterIndex
      && String(slot.hex).toUpperCase() === String(other.hex).toUpperCase();
  });
}

export function findMatchingScreen5PaletteAsset(
  slots: Screen5PaletteSlot[],
  assets: ProjectAsset[],
): ProjectAsset | null {
  return assets.find(asset => {
    if (asset.type !== 'palette') return false;
    const palette = asset.data as PaletteAsset | undefined;
    return palette?.mode === 'SCREEN5' && areScreen5PalettesEquivalent(palette.slots, slots);
  }) ?? null;
}

export function createScreen5PaletteAssetForTile(
  slots: Screen5PaletteSlot[],
  baseName: string,
  createdFromTileId: string,
  existingAssets: ProjectAsset[],
): ProjectAsset {
  const usedNames = new Set(existingAssets.map(asset => asset.name));
  const base = `${baseName || 'Bitmap Tile'} Palette`;
  let name = base;
  let suffix = 2;
  while (usedNames.has(name)) name = `${base} ${suffix++}`;
  const now = new Date().toISOString();
  const data: PaletteAsset = {
    mode: 'SCREEN5',
    slots: cloneSlots(slots),
    source: 'auto-generated-from-screen5-bitmap-tile',
    createdFromTileId,
    createdAt: now,
    updatedAt: now,
    notes: `Auto-generated from SCREEN 5 bitmap tile "${baseName}".`,
  };
  return {
    id: `palette_screen5_bitmap_${slugify(baseName)}_${Date.now()}`,
    name,
    type: 'palette',
    data,
  };
}

export function buildScreen5BitmapTileAsset(
  params: {
    name: string;
    width: number;
    height: number;
    pixels: number[][];
    paletteId: string;
    existingAssets: ProjectAsset[];
    sourceType?: BitmapTileScreen5['sourceType'];
  },
): ProjectAsset {
  const usedNames = new Set(params.existingAssets.map(asset => asset.name));
  const base = (params.name || 'Bitmap Tile').trim() || 'Bitmap Tile';
  let name = base;
  let suffix = 2;
  while (usedNames.has(name)) name = `${base} ${suffix++}`;
  const id = `bitmap_tile_screen5_${slugify(name)}_${Date.now()}`;
  const width = Math.max(1, Math.trunc(params.width));
  const height = Math.max(1, Math.trunc(params.height));
  const pixelData: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixelData.push(Math.max(0, Math.min(15, Math.trunc(Number(params.pixels[y]?.[x]) || 0))));
    }
  }
  const now = new Date().toISOString();
  const data: BitmapTileScreen5 = {
    id,
    name,
    mode: 'SCREEN5_BITMAP',
    width,
    height,
    sourceType: params.sourceType ?? 'atlas-export',
    paletteId: params.paletteId,
    pixelData,
    createdAt: now,
    updatedAt: now,
  };
  return { id, name, type: 'msx2bitmaptile', data };
}

export function bitmapTileScreen5ToAtlasTile(tile: BitmapTileScreen5): { id: string; name: string; width: number; height: number; pixels: number[][] } {
  const width = Math.max(1, Math.trunc(Number(tile.width) || 1));
  const height = Math.max(1, Math.trunc(Number(tile.height) || 1));
  const pixels = Array.from({ length: height }, (_row, y) =>
    Array.from({ length: width }, (_col, x) => Math.max(0, Math.min(15, Math.trunc(Number(tile.pixelData[y * width + x]) || 0))))
  );
  return { id: tile.id, name: tile.name, width, height, pixels };
}

/** Composite a SCREEN 5 bitmap stamp (columns x rows of 16x16 tiles) into one
 *  palette-slot pixel grid. Mirrors the HUD editor's local compositor so a stamp
 *  metatile can be poured straight into a dialogue portrait frame. */
/**
 * Resolve one authored frame without expanding the sparse variant data in the
 * project JSON. Frame 0 is the stamp's base grid; later frames apply only the
 * cell patches authored in `frameVariants`.
 */
export function resolveBitmapStampFrameTiles(
  stamp: BitmapTileStampScreen5,
  frameIndex = 0,
): Array<BitmapTileScreen5 | null> {
  const columns = Math.max(1, Math.trunc(Number(stamp.columns) || 1));
  const rows = Math.max(1, Math.trunc(Number(stamp.rows) || 1));
  const cellCount = columns * rows;
  const tiles: Array<BitmapTileScreen5 | null> = Array.from({ length: cellCount }, (_unused, index) => stamp.tiles?.[index] || null);
  const variant = stamp.frameVariants?.[Math.max(0, Math.trunc(Number(frameIndex) || 0) - 1)] as BitmapTileStampFrameVariantScreen5 | undefined;
  if (!variant || !Array.isArray(variant.cells)) return tiles;
  for (const patch of variant.cells) {
    const index = Math.trunc(Number(patch?.index));
    if (!Number.isInteger(index) || index < 0 || index >= cellCount) continue;
    tiles[index] = patch.tile || null;
  }
  return tiles;
}

export function bitmapStampFrameCount(stamp: BitmapTileStampScreen5): number {
  return 1 + (Array.isArray(stamp.frameVariants) ? stamp.frameVariants.length : 0);
}

export function bitmapStampToPixelGrid(stamp: BitmapTileStampScreen5, frameIndex = 0): number[][] {
  const columns = Math.max(1, Math.trunc(Number(stamp.columns) || 1));
  const rows = Math.max(1, Math.trunc(Number(stamp.rows) || 1));
  const tileWidth = Math.max(1, Math.trunc(Number(stamp.tileWidth) || 16));
  const tileHeight = Math.max(1, Math.trunc(Number(stamp.tileHeight) || 16));
  const width = columns * tileWidth;
  const height = rows * tileHeight;
  const pixels = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  const frameTiles = resolveBitmapStampFrameTiles(stamp, frameIndex);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const tile = frameTiles[row * columns + col];
      if (!tile) continue;
      const tilePixels = bitmapTileScreen5ToAtlasTile(tile).pixels;
      for (let y = 0; y < tileHeight; y++) {
        for (let x = 0; x < tileWidth; x++) {
          pixels[row * tileHeight + y][col * tileWidth + x] = Math.max(0, Math.min(15, Math.trunc(Number(tilePixels[y]?.[x]) || 0)));
        }
      }
    }
  }
  return pixels;
}

/** Build a SCREEN 5 bitmap stamp asset (metatile) from a palette-slot pixel grid
 *  whose dimensions are multiples of 16. The grid is split into 16x16
 *  BitmapTileScreen5 sub-tiles (each editable as a bitmap tile), wrapped in the
 *  project `msx2bitmapstamp` asset shape used by the stamp library/HUD editor. */
export function buildScreen5BitmapStampAsset(
  params: {
    name: string;
    pixels: number[][];
    paletteId: string;
    palette: Screen5PaletteSlot[];
    existingAssets: ProjectAsset[];
    sourceType?: BitmapTileScreen5['sourceType'];
  },
): ProjectAsset {
  const usedNames = new Set(params.existingAssets.map(asset => asset.name));
  const base = (params.name || 'Head Metatile').trim() || 'Head Metatile';
  let name = base;
  let suffix = 2;
  while (usedNames.has(name)) name = `${base} ${suffix++}`;
  const height = params.pixels.length;
  const width = params.pixels[0]?.length || 0;
  const columns = Math.max(1, Math.round(width / 16));
  const rows = Math.max(1, Math.round(height / 16));
  const now = new Date().toISOString();
  const sourceType = params.sourceType ?? 'manual-edit';
  const slug = slugify(name);
  const stampId = `bitmap_stamp_screen5_${slug}_${Date.now()}`;
  const tiles: BitmapTileScreen5[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const pixelData: number[] = [];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          pixelData.push(Math.max(0, Math.min(15, Math.trunc(Number(params.pixels[row * 16 + y]?.[col * 16 + x]) || 0))));
        }
      }
      tiles.push({
        id: `${stampId}_tile_${row}_${col}`,
        name: `${name} ${row}_${col}`,
        mode: 'SCREEN5_BITMAP',
        width: 16,
        height: 16,
        sourceType,
        paletteId: params.paletteId,
        pixelData,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  const stamp: BitmapTileStampScreen5 = {
    id: stampId,
    name,
    mode: 'SCREEN5_BITMAP_STAMP',
    columns,
    rows,
    tileWidth: 16,
    tileHeight: 16,
    sourceType,
    paletteId: params.paletteId,
    tiles,
    createdAt: now,
    updatedAt: now,
  };
  const data: Msx2BitmapStampAsset = {
    id: stampId,
    name,
    savedAt: Date.now(),
    stamp,
    palette: cloneSlots(params.palette),
  };
  return { id: stampId, name, type: 'msx2bitmapstamp', data };
}
