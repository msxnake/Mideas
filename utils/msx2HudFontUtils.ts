import type { Msx2HudFontAsset } from '../types';

/**
 * Glyph advance (and HMMM blit width) of an MSX2 HUD font, in pixels.
 *
 * Half-width (4x8) fonts only exist for SCREEN 5: a bitmap page has no tile
 * grid, so two 4 px glyphs simply share the width of one 8 px cell. The
 * glyph data keeps the 8x8 shape; only the left `glyphWidth` columns are
 * drawn. Missing field = 8, so older projects export the same ROM.
 */
export const getMsx2HudFontGlyphWidth = (font: Pick<Msx2HudFontAsset, 'vdpMode' | 'glyphWidth'> | undefined | null): 4 | 8 =>
  font?.vdpMode === 'SCREEN5' && font.glyphWidth === 4 ? 4 : 8;

/** Extra characters the built-in 4x8 font adds so dialogues can use punctuation. */
export const MSX2_HUD_FONT_4X8_EXTRA_CHARS = ".,!?'";

// 3x5 glyphs (column 3 is the inter-letter gap), drawn from row 1. Row strings
// are the 3 visible columns; ',' uses a 6th row as its descender.
const GLYPHS_3X5: Record<string, string[]> = {
  ' ': [],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '011', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '110', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  ':': ['000', '010', '000', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '/': ['001', '001', '010', '100', '100'],
  '.': ['000', '000', '000', '000', '010'],
  ',': ['000', '000', '000', '000', '010', '100'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['111', '001', '010', '000', '010'],
  "'": ['010', '010', '000', '000', '000'],
};

/** Built-in 4x8 font as 1bpp rows (high nibble = the 4 visible columns). */
export const DEFAULT_HUD_FONT_4X8_PATTERNS: Record<string, number[]> = Object.fromEntries(
  Object.entries(GLYPHS_3X5).map(([char, rows]) => {
    const pattern = Array(8).fill(0);
    rows.forEach((bits, index) => {
      pattern[index + 1] = parseInt(bits, 2) << 5;
    });
    return [char, pattern];
  })
);
