/**
 * Import MSX2 SCREEN 4 tiles into a SCREEN 5 bitmap-room atlas.
 *
 * A bitmap-room atlas (`Msx2Screen5BitmapRoom.atlas`) and an MSX2 SCREEN 4 tile both store
 * slot-indexed pixels (palette indices 0-15), so reusing tile art is a pixel blit: each tile is
 * copied into a free 16x16 region of the atlas and registered as a `Msx2BitmapRoomAtlasEntry`,
 * ready to place with the room's Copy 16x16 command.
 *
 * Tiles MUST already be reconciled to the room/atlas palette (the tile library modal does this
 * via `msx2TilePaletteReconcile`), because the atlas pixels are interpreted against the room
 * palette, not the tile's authoring palette.
 *
 * Placement is append-only BELOW existing atlas content (collision-free) and grows the atlas
 * height when the new tiles do not fit. The atlas width and `offscreenBaseY` are preserved.
 */

import { Msx2BitmapRoomAtlasEntry, Msx2Screen4Tile } from '../types';

const CELL = 16;

const clampSlot = (value: number): number => Math.max(0, Math.min(15, Math.trunc(Number(value) || 0)));

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tile';

export interface BitmapAtlasData {
  width: number;
  height: number;
  offscreenBaseY: number;
  pixels: number[][];
  entries: Msx2BitmapRoomAtlasEntry[];
}

export interface ImportTilesResult {
  atlas: BitmapAtlasData;
  addedEntries: Msx2BitmapRoomAtlasEntry[];
}

/** Builds a rectangular height×width matrix of palette slots (0-15), zero-filled and clamped. */
const normalizePixels = (pixels: number[][] | undefined, width: number, height: number): number[][] => {
  const out: number[][] = [];
  for (let y = 0; y < height; y++) {
    const src = pixels?.[y];
    const row: number[] = [];
    for (let x = 0; x < width; x++) row.push(clampSlot(src?.[x] ?? 0));
    out.push(row);
  }
  return out;
};

/**
 * Appends `tiles` into `atlas` as new 16x16-grid entries and returns the updated atlas plus the
 * entries that were added (in import order). Pure: the input atlas is not mutated.
 */
export function importTilesIntoAtlas(
  atlas: Partial<BitmapAtlasData> | undefined,
  tiles: ReadonlyArray<Msx2Screen4Tile>,
): ImportTilesResult {
  const width = Math.max(CELL, Math.trunc(Number(atlas?.width) || 256));
  const baseHeight = Math.max(0, Math.trunc(Number(atlas?.height) || 0));
  const offscreenBaseY = Math.trunc(Number(atlas?.offscreenBaseY) || 320);
  const entries: Msx2BitmapRoomAtlasEntry[] = (atlas?.entries || []).map(entry => ({ ...entry }));

  const safeTiles = (tiles || []).filter(tile => Array.isArray(tile?.pixels));
  if (safeTiles.length === 0) {
    return {
      atlas: { width, height: baseHeight, offscreenBaseY, pixels: normalizePixels(atlas?.pixels, width, baseHeight), entries },
      addedEntries: [],
    };
  }

  const existingIds = new Set(entries.map(entry => entry.id));
  const cols = Math.max(1, Math.floor(width / CELL));
  // Start below existing content, snapped up to the 16px grid, so we never overlap an entry.
  const contentBottom = entries.reduce((max, entry) => Math.max(max, (entry.sy || 0) + (entry.h || 0)), 0);
  const startY = Math.ceil(contentBottom / CELL) * CELL;
  const rowsNeeded = Math.ceil(safeTiles.length / cols);
  const height = Math.max(baseHeight, startY + rowsNeeded * CELL);

  const pixels = normalizePixels(atlas?.pixels, width, height);
  const addedEntries: Msx2BitmapRoomAtlasEntry[] = [];

  safeTiles.forEach((tile, index) => {
    const tileWidth = Math.max(1, Math.min(CELL, Math.trunc(Number(tile.width) || tile.pixels?.[0]?.length || CELL)));
    const tileHeight = Math.max(1, Math.min(CELL, Math.trunc(Number(tile.height) || tile.pixels?.length || CELL)));
    const col = index % cols;
    const row = Math.floor(index / cols);
    const sx = col * CELL;
    const sy = startY + row * CELL;
    for (let ty = 0; ty < tileHeight; ty++) {
      for (let tx = 0; tx < tileWidth; tx++) {
        const py = sy + ty;
        const px = sx + tx;
        if (py >= pixels.length || px >= width) continue;
        pixels[py][px] = clampSlot(tile.pixels?.[ty]?.[tx] ?? 0);
      }
    }
    let id = `atlas_${slugify(tile.name)}_${Date.now()}_${index}`;
    while (existingIds.has(id)) id = `${id}_x`;
    existingIds.add(id);
    const entry: Msx2BitmapRoomAtlasEntry = { id, name: tile.name || `Tile ${index + 1}`, sx, sy, w: tileWidth, h: tileHeight };
    entries.push(entry);
    addedEntries.push(entry);
  });

  return { atlas: { width, height, offscreenBaseY, pixels, entries }, addedEntries };
}
