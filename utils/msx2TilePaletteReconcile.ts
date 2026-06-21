/**
 * Reconciles an imported tile's palette with the destination screen palette.
 *
 * A library tile stores `pixels` as slot indices into the palette it was
 * authored against. When imported into a screen that already has its own
 * 16-slot palette, those indices point at the wrong colors. Two strategies:
 *
 *  - 'adapt'   : keep the screen palette untouched and remap each tile color to
 *                the nearest existing screen slot (auto, by RGB distance).
 *  - 'replace' : overwrite chosen screen slots with the tile's colors and remap
 *                the tile pixels to those slots (user picks which slots).
 *
 * In both cases the tile's `pixels` and `lineAttributes` are remapped through a
 * source-slot → destination-slot map. The remap is a 1:1 substitution, so the
 * SCREEN 4 "2 colors per 8px segment" invariant is preserved.
 */

import { Msx2Screen4Tile, Screen5PaletteSlot } from '../types';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

export type Msx2TilePaletteReconcileMode = 'adapt' | 'replace';

export interface TileColorUsage {
  /** Slot index used inside the tile (referring to the source palette). */
  slot: number;
  /** Source color hex for that slot. */
  hex: string;
  /** Number of pixels using this slot. */
  count: number;
}

interface Rgb { r: number; g: number; b: number; }

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const isTransparent = (hex: string | undefined): boolean =>
  normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX);

const hexToRgb = (hex: string | undefined): Rgb | null => {
  const normalized = normalizeHex(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const colorDistance = (a: Rgb, b: Rgb): number => {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return (dr * dr * 0.30) + (dg * dg * 0.59) + (db * db * 0.11);
};

/** Distinct non-background (slot > 0) colors used by the tile, by frequency. */
export function getTileUsedColors(tile: Msx2Screen4Tile, sourcePalette: Screen5PaletteSlot[]): TileColorUsage[] {
  const counts = new Map<number, number>();
  (tile.pixels || []).forEach(row => (row || []).forEach(slot => {
    const value = Number(slot) || 0;
    if (value > 0) counts.set(value, (counts.get(value) || 0) + 1);
  }));
  return Array.from(counts.entries())
    .map(([slot, count]) => ({ slot, count, hex: sourcePalette[slot]?.hex || '#000000' }))
    .sort((a, b) => b.count - a.count || a.slot - b.slot);
}

/** Nearest destination slot (1..15, skips transparent/slot 0) for a hex color. */
export function nearestDestSlot(hex: string, destPalette: Screen5PaletteSlot[]): number {
  const target = hexToRgb(hex);
  let best = 1;
  let bestDistance = Infinity;
  destPalette.forEach(slot => {
    if (slot.slotIndex === 0 || isTransparent(slot.hex)) return;
    const rgb = hexToRgb(slot.hex);
    if (!rgb || !target) return;
    const distance = colorDistance(target, rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = slot.slotIndex;
    }
  });
  return best;
}

/** Auto map (adapt mode): each used tile color → nearest screen slot. */
export function buildAdaptMap(usedColors: TileColorUsage[], destPalette: Screen5PaletteSlot[]): Map<number, number> {
  const map = new Map<number, number>([[0, 0]]);
  usedColors.forEach(usage => map.set(usage.slot, nearestDestSlot(usage.hex, destPalette)));
  return map;
}

/**
 * Default replace assignment: each used tile color keeps its own slot index
 * when that screen slot is writable (1..15), so the tile's structure is
 * preserved and its colors are injected at the same positions.
 */
export function buildDefaultReplaceAssignment(usedColors: TileColorUsage[]): Map<number, number> {
  const map = new Map<number, number>([[0, 0]]);
  usedColors.forEach(usage => map.set(usage.slot, usage.slot >= 1 && usage.slot <= 15 ? usage.slot : 1));
  return map;
}

/**
 * Replace assignment that avoids slots reserved by sprites/player. In SCREEN 4
 * tiles and sprites share the same 16-color palette, so overwriting a slot a
 * sprite uses would recolor that sprite. Keeps the tile's original slot when it
 * is free, otherwise drains the lowest free (non-protected, non-transparent)
 * slots; falls back to the original index only when no free slot remains.
 */
export function buildReplaceAssignmentAvoiding(
  usedColors: TileColorUsage[],
  destPalette: Screen5PaletteSlot[],
  protectedSlots: Set<number>,
): Map<number, number> {
  const map = new Map<number, number>([[0, 0]]);
  const taken = new Set<number>();
  const isFree = (slot: number): boolean =>
    slot >= 1 && slot <= 15 && !protectedSlots.has(slot) && !isTransparent(destPalette[slot]?.hex);

  usedColors.forEach(usage => {
    if (isFree(usage.slot) && !taken.has(usage.slot)) {
      map.set(usage.slot, usage.slot);
      taken.add(usage.slot);
    }
  });

  const freePool: number[] = [];
  for (let slot = 1; slot <= 15; slot++) {
    if (isFree(slot) && !taken.has(slot)) freePool.push(slot);
  }
  let poolIndex = 0;
  usedColors.forEach(usage => {
    if (map.has(usage.slot)) return;
    if (poolIndex < freePool.length) {
      const slot = freePool[poolIndex++];
      map.set(usage.slot, slot);
      taken.add(slot);
    } else {
      map.set(usage.slot, usage.slot >= 1 && usage.slot <= 15 ? usage.slot : 1);
    }
  });
  return map;
}

/**
 * Perceptual difference between two hex colors as a percentage (0 = identical,
 * 100 = black↔white). Weights match the importer (sRGB luma weighting).
 */
export function colorPercentDiff(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 100;
  // colorDistance is a weighted squared distance whose max is 255^2, so the
  // normalized linear distance is sqrt(dist)/255.
  return (Math.sqrt(colorDistance(ra, rb)) / 255) * 100;
}

export type Msx2TileColorStatus = 'exact' | 'near' | 'new';

export interface Msx2TileColorMatch extends TileColorUsage {
  /** exact = same color already in palette; near = within marginPct; new = unique. */
  status: Msx2TileColorStatus;
  /** Existing palette slot for exact/near (null for new). */
  matchSlot: number | null;
  /** % difference to matchSlot (0 for exact, 100 for new). */
  percentDiff: number;
  /** Hex of the matched existing slot, when any. */
  matchHex: string | null;
}

/**
 * Classifies each used tile color against the destination palette so the UI can
 * reuse existing colors instead of saturating the palette with near-duplicates:
 *  - 'exact': identical color already present → reuse that slot, never write.
 *  - 'near' : within `marginPct` of an existing color → ask the user (adapt/new).
 *  - 'new'  : genuinely new color → allocate a slot to enrich the palette.
 */
export function classifyTileColors(
  used: TileColorUsage[],
  destPalette: Screen5PaletteSlot[],
  marginPct = 5,
): Msx2TileColorMatch[] {
  return used.map(usage => {
    let bestSlot = -1;
    let bestDiff = Infinity;
    destPalette.forEach(slot => {
      if (slot.slotIndex === 0 || isTransparent(slot.hex)) return;
      const diff = colorPercentDiff(usage.hex, slot.hex);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSlot = slot.slotIndex;
      }
    });
    const status: Msx2TileColorStatus = bestSlot < 0
      ? 'new'
      : bestDiff <= 0.01 ? 'exact'
      : bestDiff <= marginPct ? 'near'
      : 'new';
    return {
      ...usage,
      status,
      matchSlot: status === 'new' ? null : bestSlot,
      percentDiff: bestSlot < 0 ? 100 : bestDiff,
      matchHex: status === 'new' || bestSlot < 0 ? null : destPalette[bestSlot]?.hex ?? null,
    };
  });
}

/**
 * Picks up to `needed` writable slots to host genuinely new colors, preferring
 * slots whose color is a duplicate of another slot (redundant → safe to reuse)
 * before consuming unique slots. Skips reserved (e.g. sprite/reused) and
 * transparent slots. This keeps the palette as rich as possible.
 */
export function pickFreeSlots(
  needed: number,
  destPalette: Screen5PaletteSlot[],
  reserved: Set<number>,
): number[] {
  const seenHex = new Set<string>();
  const duplicateSlots: number[] = [];
  const uniqueSlots: number[] = [];
  for (let slot = 1; slot <= 15; slot++) {
    const hex = String(destPalette[slot]?.hex || '').trim().toUpperCase();
    // Never allocate onto reserved, transparent, or the immutable black/white
    // slots (those are off-limits per the palette zoning).
    if (reserved.has(slot) || isTransparent(destPalette[slot]?.hex) || hex === '#000000' || hex === '#FFFFFF') continue;
    if (seenHex.has(hex)) duplicateSlots.push(slot);
    else { seenHex.add(hex); uniqueSlots.push(slot); }
  }
  return [...duplicateSlots, ...uniqueSlots].slice(0, needed);
}

export interface Msx2SmartReconcileResult {
  tile: Msx2Screen4Tile;
  palette: Screen5PaletteSlot[];
  /** source slot → { dest slot, reuse existing color or write a new one }. */
  allocation: Map<number, { dest: number; mode: 'reuse' | 'new' }>;
}

/**
 * Smart reconciliation that maximizes palette richness without duplicates:
 * exact/near(adapt) colors reuse the existing slot, while 'new' colors (and
 * near colors the user forced to "new") are written into free slots.
 *
 * @param forceNew Source slots whose 'near' match the user chose to add anyway.
 */
export function buildSmartReconcile(
  tile: Msx2Screen4Tile,
  sourcePalette: Screen5PaletteSlot[],
  destPalette: Screen5PaletteSlot[],
  matches: Msx2TileColorMatch[],
  forceNew: Set<number>,
  protectedSlots: Set<number>,
): Msx2SmartReconcileResult {
  const reserved = new Set<number>(protectedSlots);
  const reuse: Array<{ src: number; dest: number }> = [];
  const toAllocate: Array<{ src: number }> = [];
  matches.forEach(match => {
    const wantNew = match.status === 'new' || (match.status === 'near' && forceNew.has(match.slot));
    if (!wantNew && match.matchSlot != null) {
      reuse.push({ src: match.slot, dest: match.matchSlot });
      reserved.add(match.matchSlot);
    } else {
      toAllocate.push({ src: match.slot });
    }
  });

  const freeSlots = pickFreeSlots(toAllocate.length, destPalette, reserved);
  const allocation = new Map<number, { dest: number; mode: 'reuse' | 'new' }>();
  reuse.forEach(({ src, dest }) => allocation.set(src, { dest, mode: 'reuse' }));
  toAllocate.forEach(({ src }, index) => {
    const dest = freeSlots[index] ?? (src >= 1 && src <= 15 ? src : 1);
    allocation.set(src, { dest, mode: 'new' });
  });

  const palette = destPalette.map(slot => ({ ...slot }));
  const assignment = new Map<number, number>([[0, 0]]);
  allocation.forEach((info, src) => {
    assignment.set(src, info.dest);
    if (info.mode === 'new') {
      const source = sourcePalette[src];
      if (source && info.dest >= 1 && info.dest <= 15) {
        palette[info.dest] = { slotIndex: info.dest, masterIndex: source.masterIndex, hex: source.hex };
      }
    }
  });

  return { tile: remapTileSlots(tile, assignment), palette, allocation };
}

/** Remaps a tile's pixels and lineAttributes through a source→dest slot map. */
export function remapTileSlots(tile: Msx2Screen4Tile, map: Map<number, number>): Msx2Screen4Tile {
  const remap = (slot: number): number => map.get(Number(slot) || 0) ?? (Number(slot) || 0);
  return {
    ...tile,
    pixels: (tile.pixels || []).map(row => (row || []).map(remap)),
    lineAttributes: tile.lineAttributes?.map(row => row.map(segment => ({
      fg: remap(segment.fg),
      bg: remap(segment.bg),
    }))),
  };
}

/**
 * Replace mode: write the tile's source colors into the chosen destination
 * slots, returning the updated screen palette. `assignment` maps source slot →
 * destination slot to overwrite.
 */
export function applyReplaceToDestPalette(
  destPalette: Screen5PaletteSlot[],
  sourcePalette: Screen5PaletteSlot[],
  assignment: Map<number, number>,
): Screen5PaletteSlot[] {
  const next = destPalette.map(slot => ({ ...slot }));
  assignment.forEach((destSlot, srcSlot) => {
    if (srcSlot === 0 || destSlot <= 0 || destSlot > 15) return;
    const source = sourcePalette[srcSlot];
    if (!source) return;
    next[destSlot] = { slotIndex: destSlot, masterIndex: source.masterIndex, hex: source.hex };
  });
  return next;
}

export interface Msx2TileReconcileResult {
  /** Remapped tile, valid against `palette`. */
  tile: Msx2Screen4Tile;
  /** Final screen palette ('adapt' returns it unchanged, 'replace' updated). */
  palette: Screen5PaletteSlot[];
  /** Whether the screen palette was modified (replace mode). */
  paletteChanged: boolean;
}

/** Full reconciliation for one tile, given a chosen mode + slot assignment. */
export function reconcileTile(
  tile: Msx2Screen4Tile,
  sourcePalette: Screen5PaletteSlot[],
  destPalette: Screen5PaletteSlot[],
  mode: Msx2TilePaletteReconcileMode,
  assignment: Map<number, number>,
): Msx2TileReconcileResult {
  const remappedTile = remapTileSlots(tile, assignment);
  if (mode === 'adapt') {
    return { tile: remappedTile, palette: destPalette.map(slot => ({ ...slot })), paletteChanged: false };
  }
  const palette = applyReplaceToDestPalette(destPalette, sourcePalette, assignment);
  return { tile: remappedTile, palette, paletteChanged: true };
}
