

import { MSXFont, MSXCharacterPattern, MSXFontColorAttributes, MSXFontRowColorAttributes } from '../../types';
import { MSX1_PALETTE_MAP, DEFAULT_SCREEN2_FG_COLOR_INDEX, DEFAULT_SCREEN2_BG_COLOR_INDEX, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR } from '../../constants';
import { DEFAULT_MSX_FONT, EDITABLE_CHAR_CODES_SUBSET } from './msxFontRenderer'; // Corrected import paths

const CHAR_HEIGHT = 8;

/**
 * Generates raw byte array for font pattern data.
 * @param font The MSXFont data object.
 * @param exportAllChars If true, exports all 256 characters. Otherwise, uses EDITABLE_CHAR_CODES_SUBSET.
 * @returns A Uint8Array of pattern bytes.
 */
export const generateFontPatternBinaryData = (font: MSXFont, exportAllChars: boolean = true): Uint8Array => {
  const bytes: number[] = [];
  const defaultPattern = Array(CHAR_HEIGHT).fill(0x00);
  const charCodesToExport = exportAllChars 
    ? Array.from({ length: 256 }, (_, i) => i)
    : EDITABLE_CHAR_CODES_SUBSET.map(ec => ec.code);

  for (const charCode of charCodesToExport) {
    const pattern = font[charCode] || DEFAULT_MSX_FONT[charCode] || defaultPattern;
    bytes.push(...pattern);
  }
  return new Uint8Array(bytes);
};

/**
 * Generates raw byte array for font color attribute data (SCREEN 2 only).
 * @param fontColors The MSXFontColorAttributes data object.
 * @param exportAllChars If true, exports all 256 characters. Otherwise, uses EDITABLE_CHAR_CODES_SUBSET.
 * @returns A Uint8Array of color attribute bytes.
 */
export const generateFontColorBinaryData = (fontColors: MSXFontColorAttributes, exportAllChars: boolean = true): Uint8Array => {
  const bytes: number[] = [];
  const defaultRowColorsArray: MSXFontRowColorAttributes = Array(CHAR_HEIGHT).fill(null).map(() => ({ 
    fg: DEFAULT_SCREEN2_FG_COLOR, 
    bg: DEFAULT_SCREEN2_BG_COLOR 
  }));
  
  const charCodesToExport = exportAllChars 
    ? Array.from({ length: 256 }, (_, i) => i)
    : EDITABLE_CHAR_CODES_SUBSET.map(ec => ec.code);

  for (const charCode of charCodesToExport) {
    const charSpecificRowColors = fontColors[charCode] || defaultRowColorsArray;
    
    for (let y = 0; y < CHAR_HEIGHT; y++) {
      const attr = charSpecificRowColors[y] || defaultRowColorsArray[y];
      const fgIdx = MSX1_PALETTE_MAP.get(attr.fg)?.index ?? DEFAULT_SCREEN2_FG_COLOR_INDEX;
      const bgIdx = MSX1_PALETTE_MAP.get(attr.bg)?.index ?? DEFAULT_SCREEN2_BG_COLOR_INDEX;
      bytes.push((fgIdx << 4) | bgIdx);
    }
  }
  return new Uint8Array(bytes);
};
