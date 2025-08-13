
import { MSXFont, MSXCharacterPattern, MSX1ColorValue, MSXFontColorAttributes, MSXFontRowColorAttributes } from '../../types';
import { MSX1_PALETTE, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR } from '../../constants'; // Added MSX1_PALETTE for defaults

// A very small sample MSX-like font.
// In a real scenario, this would be loaded from the user's JSON file.
// Character patterns are 8 bytes (8 rows of 8 pixels).
export const DEFAULT_MSX_FONT: MSXFont = {
  // ASCII Char Code: Pattern (Array of 8 bytes)
  32: [0, 0, 0, 0, 0, 0, 0, 0], // Space
  48: [0x3E, 0x7F, 0x73, 0x73, 0x73, 0x7F, 0x3E, 0x00], // 0
  49: [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00], // 1
  50: [0x3E, 0x7F, 0x03, 0x3E, 0x60, 0x7F, 0x3E, 0x00], // 2
  58: [0x00, 0x36, 0x36, 0x00, 0x36, 0x36, 0x00, 0x00], // : (simplified)
  65: [0x3E, 0x7F, 0x63, 0x7F, 0x7F, 0x63, 0x63, 0x00], // A
  66: [0x7E, 0x7F, 0x63, 0x7E, 0x63, 0x7F, 0x7E, 0x00], // B
  67: [0x3C, 0x7E, 0x60, 0x60, 0x60, 0x7E, 0x3C, 0x00], // C
  68: [0x7C, 0x7E, 0x66, 0x66, 0x66, 0x7E, 0x7C, 0x00], // D
  69: [0x7F, 0x7F, 0x60, 0x7C, 0x60, 0x7F, 0x7F, 0x00], // E
  76: [0x60, 0x60, 0x60, 0x60, 0x60, 0x7F, 0x7F, 0x00], // L
  82: [0x7E, 0x7F, 0x63, 0x7E, 0x7B, 0x6F, 0x63, 0x00], // R
  83: [0x3E, 0x7F, 0x60, 0x3E, 0x0F, 0x7F, 0x3E, 0x00], // S
  84: [0x7F, 0x7F, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00], // T
  // Add more characters as needed for a basic set
  // Question mark for unknown characters
  63: [0x3E, 0x7F, 0x63, 0x18, 0x18, 0x00, 0x18, 0x00], // ?
};

const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 8;

export const EDITABLE_CHAR_CODES_SUBSET: { code: number, display: string }[] = [
  { code: 32, display: 'Spc' },
  ...Array.from({ length: 10 }, (_, i) => ({ code: 48 + i, display: String(i) })), // 0-9
  ...Array.from({ length: 26 }, (_, i) => ({ code: 65 + i, display: String.fromCharCode(65 + i) })), // A-Z
];

export const ALL_CHAR_CODES_FOR_SELECTOR = Array.from({ length: 256 }, (_, i) => {
    const editableEntry = EDITABLE_CHAR_CODES_SUBSET.find(ec => ec.code === i);
    return {
        code: i,
        display: editableEntry ? editableEntry.display : `ASC ${i}`
    };
});


/**
 * Renders a text string using an MSX1-style font to a data URL.
 * Applies per-row colors if fontColorAttributes are provided.
 * @param text The string to render.
 * @param font The MSXFont data object.
 * @param fontColorAttributes Optional MSXFontColorAttributes for Screen 2 per-row coloring.
 * @param scale The scaling factor for the output image.
 * @param charSpacing Horizontal space (in 1x pixels) between characters.
 * @returns A data URL string representing the rendered text image.
 */
export function renderMSX1TextToDataURL(
  text: string,
  font: MSXFont = DEFAULT_MSX_FONT,
  fontColorAttributes: MSXFontColorAttributes | undefined,
  scale: number = 1,
  charSpacing: number = 0 // In 1x pixels
): string {
  if (!text) return "";

  const canvas = document.createElement('canvas');
  const totalCharWidth = CHAR_WIDTH + charSpacing;
  canvas.width = (text.length * totalCharWidth - (text.length > 0 ? charSpacing : 0)) * scale;
  canvas.height = CHAR_HEIGHT * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) return "";

  ctx.imageSmoothingEnabled = false; // Crucial for pixel art

  const defaultFgColor = MSX1_PALETTE[15].hex; // MSX White
  const defaultBgColor = 'transparent';

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const pattern = font[charCode] || font[63]; // Use '?' pattern if char not found
    const charSpecificRowColors = fontColorAttributes ? fontColorAttributes[charCode] : undefined;

    if (pattern) {
      for (let y = 0; y < CHAR_HEIGHT; y++) { // For each row of the character
        const rowByte = pattern[y];
        
        let fgForRow = defaultFgColor;
        let bgForRow = defaultBgColor;

        if (charSpecificRowColors && charSpecificRowColors[y]) {
          fgForRow = charSpecificRowColors[y].fg || defaultFgColor; // Guard against undefined
          bgForRow = charSpecificRowColors[y].bg || defaultBgColor; // Guard against undefined
        }
        
        for (let x = 0; x < CHAR_WIDTH; x++) { // For each pixel in the row
          const isPixelSet = (rowByte >> (7 - x)) & 1;
          ctx.fillStyle = isPixelSet ? fgForRow : bgForRow;
          
          // Optimization: only draw if pixel is set OR if background is not transparent.
          if (isPixelSet || (bgForRow !== 'transparent' && !(bgForRow.startsWith('rgba') && bgForRow.endsWith(',0)')))) {
            ctx.fillRect(
              (i * totalCharWidth + x) * scale,
              y * scale,
              scale,
              scale
            );
          }
        }
      }
    }
  }
  return canvas.toDataURL();
}

/**
 * Calculates the pixel dimensions of a text string if rendered with an MSX1 font.
 * @param text The string.
 * @param charSpacing Horizontal space between characters.
 * @returns Object with width and height in pixels (at 1x scale).
 */
export function getTextDimensionsMSX1(text: string, charSpacing: number = 0): { width: number; height: number } {
  if (!text) return { width: 0, height: 0 };
  const totalCharWidth = CHAR_WIDTH + charSpacing;
  return {
    width: text.length * totalCharWidth - (text.length > 0 ? charSpacing : 0), // Corrected spacing for last char
    height: CHAR_HEIGHT,
  };
}
