/**
 * Shared SCREEN 5 presentation data helpers.
 *
 * Three backends consume `msx2presentation` assets and each one used to carry
 * its own private copy of these converters:
 *
 *   - msx2Screen5PresentationGenerator.ts  (strict-shape presentation backend)
 *   - msx2Screen5FlowGenerator.ts          (generic GameFlow node walker)
 *   - msx2Screen5BitmapRoomGenerator.ts    (bitmap-room intro, `*Intro*` names)
 *
 * The copies had already drifted (one clamped hex-derived palette levels, the
 * others did not; only the bitmap-room one accepted the nested `data.packed*`
 * shape emitted by the PNG import path), which is exactly how a wipe or palette
 * fix ends up applied to one backend and not the other two.
 *
 * These are pure byte converters: no ASM text, no runtime layout. Emitting the
 * ASM stays with each backend, because that is where the routes genuinely
 * differ.
 */
import { Msx2Screen5PresentationConfig, Screen5PaletteSlot } from '../../../../types';

/** SCREEN 5 is 256 pixels wide at 4bpp, so 128 bytes per scanline. */
export const SCREEN5_WIDTH = 256;
export const SCREEN5_ROW_BYTES = SCREEN5_WIDTH / 2;
/** Full visible height when the VDP is set to 212 lines. */
export const SCREEN5_VISIBLE_HEIGHT = 212;
export const SCREEN5_BITMAP_BYTE_COUNT = SCREEN5_VISIBLE_HEIGHT * SCREEN5_ROW_BYTES;
export const SCREEN5_DEFAULT_CHUNK_LINES = 32;

export const clampScreen5Byte = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(255, Math.trunc(numeric)));
};

/**
 * `#RRGGBB` -> V9938 RGB333 levels. Each channel is already reduced to 0..7 by
 * the rounding, so no extra clamp is needed on the result.
 */
export function parseScreen5HexColor(hex: unknown): [number, number, number] | null {
  if (typeof hex !== 'string') return null;
  const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [
    Math.round(((value >> 16) & 0xff) * 7 / 255),
    Math.round(((value >> 8) & 0xff) * 7 / 255),
    Math.round((value & 0xff) * 7 / 255),
  ];
}

/**
 * A palette slot is authored either as an index into the MSX2 512-colour master
 * palette or as a raw hex string (PNG import path). masterIndex wins.
 */
export function resolveScreen5PaletteSlot(slot: Screen5PaletteSlot | undefined): [number, number, number] {
  const masterIndex = Number(slot?.masterIndex);
  if (Number.isFinite(masterIndex) && masterIndex >= 0) {
    const index = Math.max(0, Math.min(511, Math.trunc(masterIndex)));
    return [(index >> 6) & 0x07, (index >> 3) & 0x07, index & 0x07];
  }
  const fromHex = parseScreen5HexColor((slot as any)?.hex);
  if (fromHex) return fromHex;
  return [0, 0, 0];
}

/** 16 slots x 2 bytes, in VDP palette register order: byte1=(R<<4)|B, byte2=G. */
export function buildScreen5PaletteBytes(palette: Screen5PaletteSlot[] | undefined): number[] {
  const source = Array.isArray(palette) ? palette : [];
  return Array.from({ length: 16 }, (_unused, slotIndex) => {
    const slot = source.find(item => item?.slotIndex === slotIndex) || source[slotIndex];
    const [r, g, b] = resolveScreen5PaletteSlot(slot);
    return [(r << 4) | b, g];
  }).flat();
}

/**
 * Brightest non-zero slot, used to pick a legible text colour over the image.
 * Slot 0 is skipped because it is the transparent/background entry.
 */
export function resolveScreen5BrightestPaletteIndex(palette: Screen5PaletteSlot[] | undefined): number {
  const source = Array.isArray(palette) ? palette : [];
  let bestSlot = 15;
  let bestBrightness = -1;
  for (let slotIndex = 1; slotIndex < 16; slotIndex++) {
    const slot = source.find(item => item?.slotIndex === slotIndex) || source[slotIndex];
    const [r, g, b] = resolveScreen5PaletteSlot(slot);
    const brightness = r + g + b;
    if (brightness > bestBrightness) {
      bestBrightness = brightness;
      bestSlot = slotIndex;
    }
  }
  return bestSlot;
}

/**
 * 4bpp packed pixels padded (or cropped) to the full 212 visible lines.
 *
 * The flat `packedBitmap` is authoritative. The nested `data.packedBitmap` /
 * `data.packedPixels` fallback exists because the PNG import path nests its
 * output; the editor writes both shapes, so in practice the flat field is
 * present and this fallback only rescues legacy/import-only assets that the
 * other two backends used to render as a black screen.
 */
export function buildScreen5BitmapBytes(presentation: Msx2Screen5PresentationConfig): number[] {
  const nested = (presentation as any)?.data as
    | { packedBitmap?: unknown; packedPixels?: unknown; height?: unknown }
    | undefined;
  const packed = (Array.isArray(presentation.packedBitmap) && presentation.packedBitmap.length
    ? presentation.packedBitmap
    : undefined)
    || (Array.isArray(nested?.packedBitmap) ? (nested!.packedBitmap as number[]) : undefined)
    || (Array.isArray(nested?.packedPixels) ? (nested!.packedPixels as number[]) : undefined)
    || [];
  const declaredHeight = presentation.height ?? (nested?.height as number | undefined);
  const imageHeight = declaredHeight === 212 ? 212 : 192;
  const imageBytes = Math.min(imageHeight * SCREEN5_ROW_BYTES, packed.length);
  const bytes = Array.from({ length: SCREEN5_BITMAP_BYTE_COUNT }, () => 0);
  for (let index = 0; index < imageBytes; index++) {
    bytes[index] = clampScreen5Byte(packed[index], 0);
  }
  return bytes;
}

/** Split the bitmap into per-upload chunks of at most SCREEN5_DEFAULT_CHUNK_LINES lines. */
export function chunkScreen5BitmapBytes(bytes: number[], chunkLines: number): number[][] {
  const normalizedChunkLines = Math.max(
    1,
    Math.min(SCREEN5_DEFAULT_CHUNK_LINES, Math.trunc(chunkLines) || SCREEN5_DEFAULT_CHUNK_LINES)
  );
  const chunkSize = normalizedChunkLines * SCREEN5_ROW_BYTES;
  const chunks: number[][] = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(bytes.slice(offset, offset + chunkSize));
  }
  return chunks;
}

/** Fills in every optional field so downstream emitters never branch on undefined. */
export function normalizeScreen5Presentation(
  presentation: Msx2Screen5PresentationConfig | undefined
): Msx2Screen5PresentationConfig {
  return {
    enabled: presentation?.enabled !== false,
    name: presentation?.name || 'MSX2 SCREEN 5 Presentation',
    target: 'MSX2',
    screenMode: 'SCREEN 5',
    sourceFileName: presentation?.sourceFileName || null,
    sourceImageWidth: Number(presentation?.sourceImageWidth) || 0,
    sourceImageHeight: Number(presentation?.sourceImageHeight) || 0,
    width: 256,
    height: presentation?.height === 212 ? 212 : 192,
    fitMode: presentation?.fitMode || 'cover',
    palette: Array.isArray(presentation?.palette) ? presentation!.palette : [],
    pixels: Array.isArray(presentation?.pixels) ? presentation!.pixels : [],
    packedBitmap: Array.isArray(presentation?.packedBitmap) ? presentation!.packedBitmap : [],
    compression: presentation?.compression || { codec: 'ZX0', enabled: false, chunkLines: 32 },
    runtime: {
      showAtBoot: presentation?.runtime?.showAtBoot !== false,
      clearSpritesBeforeShow: presentation?.runtime?.clearSpritesBeforeShow !== false,
      waitForKey: presentation?.runtime?.waitForKey !== false,
      waitForFrames: Number(presentation?.runtime?.waitForFrames) || 0,
      vramPage: presentation?.runtime?.vramPage === 1 ? 1 : 0,
      romDataGroup: presentation?.runtime?.romDataGroup || 'auto',
    },
  };
}
