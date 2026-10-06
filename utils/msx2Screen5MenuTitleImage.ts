/**
 * Bitmap title of a SCREEN 5 GameFlow SubMenu (generic walker backend).
 *
 * The title is an `msx2presentation` asset: a 256-wide 4 bpp picture whose
 * palette slot 0 is the background. Only the box that holds every other pixel is
 * exported, so a logo imported with "contain" costs ROM for the logo and not for
 * the empty margins around it.
 *
 * Shared by the generator (msx2Screen5FlowGenerator.ts) and the GameFlow editor,
 * so both agree on the size the title takes and on whether it fits above the
 * options.
 */
import type { Msx2Screen5PresentationConfig, Screen5PaletteSlot } from '../types';
import {
  SCREEN5_ROW_BYTES,
  SCREEN5_VISIBLE_HEIGHT,
  buildScreen5BitmapBytes,
  normalizeScreen5Presentation,
  resolveScreen5PaletteSlot,
} from './msxGenerator/generators/msx2/screen5PresentationData';

export interface Screen5MenuTitleImage {
  /** Width of the box in VRAM bytes (2 pixels each, so always whole byte pairs). */
  widthBytes: number;
  /** Height of the box in pixel rows. */
  height: number;
  /** `widthBytes * height` packed bytes, row after row, left pixel in the high nibble. */
  bytes: number[];
}

export interface Screen5MenuTitleImageResult {
  image?: Screen5MenuTitleImage;
  error?: string;
}

/** Crops the non-background pixels of a presentation into a rectangle ready to blit. */
export function extractScreen5MenuTitleImage(
  source: Msx2Screen5PresentationConfig | undefined
): Screen5MenuTitleImageResult {
  if (!source) return { error: 'the presentation asset does not exist.' };
  const bitmap = buildScreen5BitmapBytes(normalizeScreen5Presentation(source));

  let top = -1;
  let bottom = -1;
  let left = SCREEN5_ROW_BYTES;
  let right = -1;
  for (let y = 0; y < SCREEN5_VISIBLE_HEIGHT; y++) {
    for (let x = 0; x < SCREEN5_ROW_BYTES; x++) {
      if (bitmap[y * SCREEN5_ROW_BYTES + x] === 0) continue;
      if (top < 0) top = y;
      bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (top < 0) {
    return { error: 'the image is empty: every pixel uses palette slot 0, which is the background.' };
  }

  const widthBytes = right - left + 1;
  const height = bottom - top + 1;
  const bytes: number[] = [];
  for (let y = top; y <= bottom; y++) {
    const rowStart = y * SCREEN5_ROW_BYTES + left;
    bytes.push(...bitmap.slice(rowStart, rowStart + widthBytes));
  }
  return { image: { widthBytes, height, bytes } };
}

/** RGBA pixels (`widthBytes * 2` x `height`) of the title as the VDP shows it, for the editor preview. */
export function renderScreen5MenuTitleImageRgba(
  image: Screen5MenuTitleImage,
  palette: Screen5PaletteSlot[] | undefined
): Uint8ClampedArray {
  const slots = Array.isArray(palette) ? palette : [];
  const colours = Array.from({ length: 16 }, (_unused, index) =>
    resolveScreen5PaletteSlot(slots.find(slot => slot?.slotIndex === index) || slots[index]).map(level => Math.round((level * 255) / 7))
  );
  const width = image.widthBytes * 2;
  const rgba = new Uint8ClampedArray(width * image.height * 4);
  for (let y = 0; y < image.height; y++) {
    for (let byteIndex = 0; byteIndex < image.widthBytes; byteIndex++) {
      const value = image.bytes[y * image.widthBytes + byteIndex];
      [value >> 4, value & 0x0f].forEach((slot, half) => {
        const offset = (y * width + byteIndex * 2 + half) * 4;
        const [r, g, b] = colours[slot];
        rgba[offset] = r;
        rgba[offset + 1] = g;
        rgba[offset + 2] = b;
        rgba[offset + 3] = 255;
      });
    }
  }
  return rgba;
}

/**
 * Left VRAM byte of the title. Follows the text title: the column the layout
 * gives it when the menu is left aligned or placed with `menuX`, centred otherwise.
 */
export function resolveScreen5MenuTitleImageColumn(widthBytes: number, titleColumn: number | undefined): number {
  if (titleColumn !== undefined) return Math.max(0, Math.min(titleColumn, SCREEN5_ROW_BYTES - widthBytes));
  return Math.floor((SCREEN5_ROW_BYTES - widthBytes) / 2);
}
