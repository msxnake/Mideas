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
}

export interface Msx2ExternalTileImportResult {
  /** One tile per 16x16 cell, in row-major order. */
  tiles: Msx2Screen4Tile[];
  /** Palette produced by the quantization (slot indices in tiles map to this). */
  palette: Screen5PaletteSlot[];
  /** Grid dimensions of the sliced result. */
  columns: number;
  rows: number;
  warnings: string[];
}

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

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

  // Convert the full hex frame to a slot-index matrix once, then slice.
  const slotMatrix: number[][] = pixelData.map(row => row.map(hex => hexToSlot(String(hex || ''))));
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
      const lineAttributes = inferLineAttributesFromPixels(rawPixels);
      const pixels = fixInvalidTilePixels(rawPixels, lineAttributes);
      if (pixels.some((rowPixels, y) => rowPixels.some((slot, x) => slot !== rawPixels[y][x]))) {
        constrainedCells += 1;
      }
      const name = single ? baseName : `${baseName}_r${row}_c${col}`;
      tiles.push({
        id: `tile_import_${Date.now()}_${row}_${col}`,
        name,
        width: TILE_CELL,
        height: TILE_CELL,
        pixels,
        lineAttributes,
        behaviorKind: 'background',
      });
    }
  }

  if (constrainedCells > 0) {
    warnings.push(`${constrainedCells} celda(s) reducidas a 2 colores por segmento de 8 px (límite de tiles SCREEN 4).`);
  }

  return { tiles, palette, columns, rows, warnings };
}
