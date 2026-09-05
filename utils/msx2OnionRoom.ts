import { MSX2_PATH_GRID_COLS, MSX2_PATH_GRID_ROWS } from './msx2PathFollow';

/**
 * What the Onion overlay needs from a room: where the walls are, and what the
 * room looks like.
 *
 * It lives outside the editor component because both answers are pure lookups
 * into asset data, and the bug that created this file was a lookup, not a
 * drawing: the overlay read `data.layers.collision` and nothing else. That is
 * the SCREEN 4 TILE SCREEN shape. A SCREEN 5 BITMAP ROOM keeps its grid at
 * `data.collision`, top level. Both types sit in the same picker, so against a
 * bitmap room the overlay drew no walls AND the "node buried in a wall" check
 * had nothing to test — it approved every node. A validator that always passes
 * is worse than no validator, and this feature has now met that failure twice
 * (see also the 0x10-vs-truthy collision test in the path editor).
 */

const CELLS = MSX2_PATH_GRID_COLS * MSX2_PATH_GRID_ROWS;

/**
 * The room's collision grid, flattened row-major so a grid index and a node's
 * cell byte are the same number.
 *
 * Returns undefined when the screen carries no grid at all, which the caller
 * must surface as "no data" rather than draw as an empty room.
 */
export function onionCollisionCells(data: unknown): number[] | undefined {
  const source = data as Record<string, any> | null | undefined;
  const grid =
    Array.isArray(source?.collision) ? source!.collision                  // SCREEN 5 bitmap room
    : Array.isArray(source?.layers?.collision) ? source!.layers.collision // SCREEN 4 tile screen
    : Array.isArray(source?.collisionMap) ? source!.collisionMap          // pre-layers projects
    : undefined;
  if (!grid) return undefined;
  const cells: number[] = [];
  for (let row = 0; row < MSX2_PATH_GRID_ROWS; row++) {
    for (let col = 0; col < MSX2_PATH_GRID_COLS; col++) {
      cells.push(Number(grid[row]?.[col]) || 0);
    }
  }
  return cells;
}

/**
 * The room's art, one image per cell, so the author judges a route against the
 * scenery instead of against a grid of empty boxes.
 *
 * Per CELL rather than one backdrop behind the whole grid: the grid has gaps
 * and padding, and a single image would need that geometry duplicated here and
 * would drift the moment a cell size changed. A cell painting its own tile
 * lines up by construction.
 *
 * Only SCREEN 5 bitmap rooms have an atlas. `tileGrid` holds "atlas entry index
 * + 1, 0 = empty" — the +1 is the part worth stating, because reading it as a
 * plain index silently shifts the whole room by one tile, which looks like bad
 * art rather than like a bug.
 *
 * `paint` is injected so this can be exercised without a browser; the editor
 * passes a canvas-backed one.
 */
export interface OnionTilePainter {
  /** Paints w*h palette-slot pixels and returns an image URL. Slot 0 is transparent. */
  (pixels: number[][], width: number, height: number, palette: string[]): string | undefined;
}

export function onionTileUrls(
  data: unknown,
  paint: OnionTilePainter,
  /**
   * The palette to draw with, when it is not the room's own copy.
   *
   * A room belongs to a world, and the world's shared `palette` asset is what
   * the GENERATOR bakes into the ROM, so it wins: rooms keep an older private
   * palette long after the world moved on. Drawing with `data.palette` shows
   * colours the game never displays — the exact bug that
   * utils/msx2WorldPalette.ts was written for, and that this preview walked
   * straight back into. The caller resolves it and passes the answer here.
   */
  paletteOverride?: { slotIndex: number; hex: string }[],
): (string | undefined)[] | undefined {
  const source = data as Record<string, any> | null | undefined;
  const grid = source?.tileGrid;
  const entries = source?.atlas?.entries;
  const sheet = source?.atlas?.pixels;
  if (!Array.isArray(grid) || !Array.isArray(entries) || !Array.isArray(sheet)) return undefined;

  const slots: any[] = (paletteOverride?.length ? paletteOverride : source?.palette) || [];
  const palette: string[] = Array.from({ length: 16 }, (_unused, slot) =>
    slots.find((entry: any) => entry?.slotIndex === slot)?.hex || '#000000');

  // One image per DISTINCT entry, not per cell: a room is 192 cells drawn from a
  // handful of tiles, and re-encoding the same image 192 times turns a preview
  // into a stutter.
  const cache = new Map<number, string | undefined>();
  const urlFor = (entryIndex: number): string | undefined => {
    if (cache.has(entryIndex)) return cache.get(entryIndex);
    const entry = entries[entryIndex];
    let url: string | undefined;
    if (entry) {
      const w = Math.max(1, Number(entry.w) || 16);
      const h = Math.max(1, Number(entry.h) || 16);
      const sx = Number(entry.sx) || 0;
      const sy = Number(entry.sy) || 0;
      const pixels = Array.from({ length: h }, (_unused, y) =>
        Array.from({ length: w }, (_unused2, x) => Number(sheet[sy + y]?.[sx + x]) || 0));
      url = paint(pixels, w, h, palette);
    }
    cache.set(entryIndex, url);
    return url;
  };

  const out: (string | undefined)[] = [];
  for (let row = 0; row < MSX2_PATH_GRID_ROWS; row++) {
    for (let col = 0; col < MSX2_PATH_GRID_COLS; col++) {
      const ref = Number(grid[row]?.[col]) || 0;
      out.push(ref > 0 ? urlFor(ref - 1) : undefined);
    }
  }
  return out.length === CELLS ? out : undefined;
}

/** The editor's painter: a canvas, left transparent wherever the slot is 0. */
export const canvasTilePainter: OnionTilePainter = (pixels, width, height, palette) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const slot = pixels[y]?.[x] || 0;
      // Slot 0 is transparent on SCREEN 5, and leaving it unpainted is what the
      // VDP does: the room's background shows through.
      if (!slot) continue;
      ctx.fillStyle = palette[slot & 0x0f];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas.toDataURL();
};
