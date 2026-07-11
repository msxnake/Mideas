/**
 * External PNG → MSX2 SCREEN4 tiles importer.
 *
 * Reuses the mature sprite import pipeline (`importExternalPngAsMsx2Sprite`):
 * background detection, crop-to-visible, downscale and k-means quantization to
 * a SCREEN5 palette. The only tile-specific work here is:
 *   1. forcing the target size to multiples of 16,
 *   2. converting the hex `PixelData` back to palette **slot indices** (tiles
 *      store slot indices, sprites store hex), and
 *   3. slicing the result into 16x16 cells, one `Msx2Screen4Tile` per cell.
 */

import { MSXColorValue, Msx2Screen4Tile, PixelData, Screen5PaletteSlot } from '../types';
import {
  importExternalPngAsMsx2Sprite,
  Msx2ExternalSpriteImportOptions,
} from './msx2ExternalSpriteImport';
import {
  fixInvalidTilePixels,
  inferLineAttributesFromPixels,
} from './msx2Screen4TileConstraints';

const TILE_CELL = 16;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

export interface Msx2ExternalTileImportOptions extends Msx2ExternalSpriteImportOptions {
  /** Base name used for the generated tiles (cells get an _r{row}_c{col} suffix). */
  baseName?: string;
  /** SCREEN 5 bitmap tiles keep all slot indices; SCREEN 4 tiles enforce color clash. */
  outputMode?: 'screen4' | 'screen5';
}

export interface Msx2ExternalTileImportResult {
  /** One tile per 16x16 cell, in row-major order. */
  tiles: Msx2Screen4Tile[];
  /** Palette produced by the quantization (slot indices in tiles map to this). */
  palette: Screen5PaletteSlot[];
  /** SCREEN 5 slot usage before applying the custom color limit, sorted by use. */
  colorUsage: Msx2TileImportColorUsage[];
  /** Number of non-background SCREEN 5 colors produced by the import before reduction. */
  sourceColorCount: number;
  /** Number of non-background SCREEN 5 colors kept after reduction. */
  activeColorCount: number;
  /** Grid dimensions of the sliced result. */
  columns: number;
  rows: number;
  warnings: string[];
}

export interface Msx2TileImportColorUsage {
  slotIndex: number;
  hex: string;
  count: number;
  percent: number;
  kept: boolean;
  mappedToSlot?: number;
}

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const hexToRgb = (hex: string | undefined): { r: number; g: number; b: number } | null => {
  const normalized = normalizeHex(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const colorDistance = (
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number => {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return (dr * dr * 0.30) + (dg * dg * 0.59) + (db * db * 0.11);
};

/**
 * A tile is "empty" when every pixel resolves to slot 0 (background/transparent).
 * Used to skip fully-background cells when adding sliced sheets to the library.
 */
export function isMsx2TileEmpty(tile: Msx2Screen4Tile): boolean {
  const pixels = tile.pixels ?? [];
  return pixels.every(row => row.every(slot => (slot ?? 0) === 0));
}

/** Rounds up to the nearest multiple of 16, clamped to a sane tile-sheet range. */
const snapToCell = (value: number): number => {
  const rounded = Math.round(Number(value) || TILE_CELL);
  const snapped = Math.max(TILE_CELL, Math.ceil(rounded / TILE_CELL) * TILE_CELL);
  return Math.min(snapped, 128);
};

/**
 * Builds a hex → slot index map from the palette. Background and transparent
 * colors resolve to slot 0.
 */
function buildHexToSlot(
  palette: Screen5PaletteSlot[],
  backgroundColor: MSXColorValue,
): (hex: string) => number {
  const map = new Map<string, number>();
  palette.forEach(slot => {
    const key = normalizeHex(slot.hex);
    if (!map.has(key)) map.set(key, slot.slotIndex);
  });
  const bg = normalizeHex(backgroundColor);
  const transparent = normalizeHex(TRANSPARENT_HEX);
  return (hex: string): number => {
    const key = normalizeHex(hex);
    if (!key || key === bg || key === transparent) return 0;
    return map.get(key) ?? 0;
  };
}

function reduceScreen5SlotMatrixByUsage(
  slotMatrix: number[][],
  palette: Screen5PaletteSlot[],
  requestedColorCount: number,
): {
  slotMatrix: number[][];
  colorUsage: Msx2TileImportColorUsage[];
  sourceColorCount: number;
  activeColorCount: number;
} {
  const counts = new Map<number, number>();
  slotMatrix.forEach(row => row.forEach(slot => {
    if (slot > 0) counts.set(slot, (counts.get(slot) ?? 0) + 1);
  }));
  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
  const sorted = Array.from(counts.entries())
    .map(([slotIndex, count]) => ({ slotIndex, count }))
    .sort((a, b) => b.count - a.count || a.slotIndex - b.slotIndex);
  const sourceColorCount = sorted.length;
  if (sourceColorCount === 0) {
    return { slotMatrix, colorUsage: [], sourceColorCount: 0, activeColorCount: 0 };
  }

  const limit = clamp(Math.floor(requestedColorCount) || sourceColorCount, 1, Math.min(15, sourceColorCount));
  const protectedSlots = sorted
    .filter(entry => normalizeHex(palette[entry.slotIndex]?.hex) === '#FFFFFF')
    .map(entry => entry.slotIndex);
  const keptSlots = new Set<number>();
  protectedSlots.slice(0, limit).forEach(slot => keptSlots.add(slot));
  sorted.forEach(entry => {
    if (keptSlots.size >= limit) return;
    keptSlots.add(entry.slotIndex);
  });
  const keptSlotEntries = sorted
    .filter(entry => keptSlots.has(entry.slotIndex))
    .map(entry => ({
      slotIndex: entry.slotIndex,
      rgb: hexToRgb(palette[entry.slotIndex]?.hex),
    }))
    .filter((entry): entry is { slotIndex: number; rgb: { r: number; g: number; b: number } } => Boolean(entry.rgb));

  const remap = new Map<number, number>();
  sorted.forEach(entry => {
    if (keptSlots.has(entry.slotIndex)) return;
    const rgb = hexToRgb(palette[entry.slotIndex]?.hex);
    if (!rgb || keptSlotEntries.length === 0) {
      remap.set(entry.slotIndex, 0);
      return;
    }
    let best = keptSlotEntries[0];
    let bestDistance = colorDistance(rgb, best.rgb);
    keptSlotEntries.slice(1).forEach(candidate => {
      const distance = colorDistance(rgb, candidate.rgb);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    });
    remap.set(entry.slotIndex, best.slotIndex);
  });

  const colorUsage = sorted.map(entry => ({
    slotIndex: entry.slotIndex,
    hex: palette[entry.slotIndex]?.hex || '#000000',
    count: entry.count,
    percent: total > 0 ? (entry.count / total) * 100 : 0,
    kept: keptSlots.has(entry.slotIndex),
    mappedToSlot: keptSlots.has(entry.slotIndex) ? undefined : remap.get(entry.slotIndex),
  }));

  return {
    slotMatrix: slotMatrix.map(row => row.map(slot => {
      if (slot <= 0 || keptSlots.has(slot)) return slot;
      return remap.get(slot) ?? 0;
    })),
    colorUsage,
    sourceColorCount,
    activeColorCount: keptSlots.size,
  };
}

export function importExternalPngAsMsx2Tiles(
  imageData: ImageData,
  currentPalette: Screen5PaletteSlot[],
  currentBackgroundColor: MSXColorValue,
  options: Msx2ExternalTileImportOptions,
): Msx2ExternalTileImportResult {
  const warnings: string[] = [];
  const targetWidth = snapToCell(options.targetWidth);
  const targetHeight = snapToCell(options.targetHeight);
  if (targetWidth !== Math.round(options.targetWidth) || targetHeight !== Math.round(options.targetHeight)) {
    warnings.push(`Tamaño ajustado a múltiplos de 16: ${targetWidth}x${targetHeight}.`);
  }

  const spriteResult = importExternalPngAsMsx2Sprite(
    imageData,
    currentPalette,
    currentBackgroundColor,
    { ...options, targetWidth, targetHeight },
  );
  // The quantizer is shared with the sprite importer, so drop its sprite-only
  // warnings (hardware scanline limit, partial 16x16 hardware cells). They make
  // no sense for tiles, which use the pattern/color table, not sprite planes.
  warnings.push(...spriteResult.warnings.filter(warning =>
    !/sprite/i.test(warning) && !/celdas hardware 16x16/i.test(warning)
  ));

  const palette = spriteResult.palette;
  const pixelData: PixelData = spriteResult.pixelData;
  const hexToSlot = buildHexToSlot(palette, spriteResult.backgroundColor);

  // Convert the full hex frame to a slot-index matrix once, reduce SCREEN 5
  // colors by slot usage if requested, then slice.
  const rawSlotMatrix: number[][] = pixelData.map(row => row.map(hex => hexToSlot(String(hex || ''))));
  const bitmapMode = options.outputMode === 'screen5';
  const colorReduction = bitmapMode
    ? reduceScreen5SlotMatrixByUsage(rawSlotMatrix, palette, options.finalColorCount)
    : { slotMatrix: rawSlotMatrix, colorUsage: [], sourceColorCount: 0, activeColorCount: 0 };
  const slotMatrix = colorReduction.slotMatrix;
  const sheetHeight = slotMatrix.length;
  const sheetWidth = slotMatrix[0]?.length ?? 0;
  const columns = Math.max(1, Math.floor(sheetWidth / TILE_CELL));
  const rows = Math.max(1, Math.floor(sheetHeight / TILE_CELL));
  const baseName = (options.baseName || 'tile').trim() || 'tile';
  const single = columns === 1 && rows === 1;

  const tiles: Msx2Screen4Tile[] = [];
  let constrainedCells = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const rawPixels: number[][] = Array.from({ length: TILE_CELL }, (_, y) =>
        Array.from({ length: TILE_CELL }, (_, x) => slotMatrix[row * TILE_CELL + y]?.[col * TILE_CELL + x] ?? 0)
      );
      // SCREEN 4 tiles use the pattern/color table (like SCREEN 2): each 8px
      // segment of each row can hold only 2 colors (fg/bg). Unlike sprites
      // (1 color per line + OR-color), tiles need per-segment lineAttributes.
      // Derive the dominant fg/bg pair per segment and snap every pixel to it,
      // matching exactly how the tile editor validates/repairs pixels.
      const lineAttributes = bitmapMode ? undefined : inferLineAttributesFromPixels(rawPixels);
      const pixels = bitmapMode || !lineAttributes ? rawPixels : fixInvalidTilePixels(rawPixels, lineAttributes);
      if (!bitmapMode && pixels.some((rowPixels, y) => rowPixels.some((slot, x) => slot !== rawPixels[y][x]))) {
        constrainedCells += 1;
      }
      const name = single ? baseName : `${baseName}_r${row}_c${col}`;
      tiles.push({
        id: `tile_import_${Date.now()}_${row}_${col}`,
        name,
        width: TILE_CELL,
        height: TILE_CELL,
        pixels,
        ...(lineAttributes ? { lineAttributes } : {}),
        behaviorKind: 'background',
      });
    }
  }

  if (options.outputMode === 'screen5') {
    warnings.push('Salida SCREEN 5 bitmap: se conservan los colores por pixel; no se aplica color clash SCREEN 4.');
    if (colorReduction.sourceColorCount > colorReduction.activeColorCount) {
      warnings.push(`Colores SCREEN 5 reducidos de ${colorReduction.sourceColorCount} a ${colorReduction.activeColorCount}; se descartan primero los menos usados.`);
    }
  } else if (constrainedCells > 0) {
    warnings.push(`${constrainedCells} celda(s) reducidas a 2 colores por segmento de 8 px (límite de tiles SCREEN 4).`);
  }

  return {
    tiles,
    palette,
    colorUsage: colorReduction.colorUsage,
    sourceColorCount: colorReduction.sourceColorCount,
    activeColorCount: colorReduction.activeColorCount,
    columns,
    rows,
    warnings,
  };
}
