import { BitmapTileScreen5, PaletteAsset, ProjectAsset, Screen5PaletteSlot } from '../types';
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
