
import { MSXFont, MSXCharacterPattern, MSX1ColorValue, MSXFontColorAttributes, MSXFontRowColorAttributes, TileBank, ProjectAsset, Tile } from '../../types';
import { MSX1_PALETTE, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR } from '../../constants'; // Added MSX1_PALETTE for defaults
import { createTileDataURL } from './screenUtils';

/**
 * A default MSX-style font for rendering text.
 * This is a small sample and would typically be replaced by user-loaded font data.
 */
export const DEFAULT_MSX_FONT: MSXFont = {
  // ASCII Char Code: Pattern (Array of 8 bytes)
  32: [0, 0, 0, 0, 0, 0, 0, 0], // Space
  45: [0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00], // - (hyphen)
  48: [0x3E, 0x7F, 0x73, 0x73, 0x73, 0x7F, 0x3E, 0x00], // 0
  49: [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00], // 1
  50: [0x3E, 0x7F, 0x03, 0x3E, 0x60, 0x7F, 0x3E, 0x00], // 2
  51: [0x3E, 0x7F, 0x03, 0x3E, 0x03, 0x7F, 0x3E, 0x00], // 3
  52: [0x06, 0x0E, 0x1E, 0x36, 0x7F, 0x06, 0x06, 0x00], // 4
  53: [0x7F, 0x7F, 0x60, 0x7E, 0x03, 0x7F, 0x3E, 0x00], // 5
  54: [0x3E, 0x7F, 0x60, 0x7E, 0x63, 0x7F, 0x3E, 0x00], // 6
  55: [0x7F, 0x7F, 0x03, 0x06, 0x0C, 0x18, 0x18, 0x00], // 7
  56: [0x3E, 0x7F, 0x63, 0x3E, 0x63, 0x7F, 0x3E, 0x00], // 8
  57: [0x3E, 0x7F, 0x63, 0x3F, 0x03, 0x7F, 0x3E, 0x00], // 9
  58: [0x00, 0x36, 0x36, 0x00, 0x36, 0x36, 0x00, 0x00], // : (simplified)
  65: [0x3E, 0x7F, 0x63, 0x7F, 0x7F, 0x63, 0x63, 0x00], // A
  66: [0x7E, 0x7F, 0x63, 0x7E, 0x63, 0x7F, 0x7E, 0x00], // B
  67: [0x3C, 0x7E, 0x60, 0x60, 0x60, 0x7E, 0x3C, 0x00], // C
  68: [0x7C, 0x7E, 0x66, 0x66, 0x66, 0x7E, 0x7C, 0x00], // D
  69: [0x7F, 0x7F, 0x60, 0x7C, 0x60, 0x7F, 0x7F, 0x00], // E
  70: [0x7F, 0x7F, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x00], // F
  71: [0x3E, 0x7F, 0x63, 0x60, 0x67, 0x7F, 0x3E, 0x00], // G
  72: [0x63, 0x63, 0x63, 0x7F, 0x63, 0x63, 0x63, 0x00], // H
  73: [0x3E, 0x3E, 0x1C, 0x1C, 0x1C, 0x3E, 0x3E, 0x00], // I
  74: [0x1F, 0x1F, 0x06, 0x06, 0x66, 0x7E, 0x3C, 0x00], // J
  75: [0x63, 0x66, 0x6C, 0x78, 0x6C, 0x66, 0x63, 0x00], // K
  76: [0x60, 0x60, 0x60, 0x60, 0x60, 0x7F, 0x7F, 0x00], // L
  77: [0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x63, 0x00], // M
  78: [0x63, 0x73, 0x7B, 0x6F, 0x67, 0x63, 0x63, 0x00], // N
  79: [0x3E, 0x7F, 0x63, 0x63, 0x63, 0x7F, 0x3E, 0x00], // O
  80: [0x7E, 0x7F, 0x63, 0x7E, 0x60, 0x60, 0x60, 0x00], // P
  81: [0x3E, 0x7F, 0x63, 0x6B, 0x67, 0x7F, 0x3E, 0x00], // Q
  82: [0x7E, 0x7F, 0x63, 0x7E, 0x7B, 0x6F, 0x63, 0x00], // R
  83: [0x3E, 0x7F, 0x60, 0x3E, 0x0F, 0x7F, 0x3E, 0x00], // S
  84: [0x7F, 0x7F, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00], // T
  85: [0x63, 0x63, 0x63, 0x63, 0x63, 0x7F, 0x3E, 0x00], // U
  86: [0x63, 0x63, 0x63, 0x63, 0x36, 0x1C, 0x08, 0x00], // V
  87: [0x63, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x00], // W
  88: [0x63, 0x63, 0x36, 0x1C, 0x36, 0x63, 0x63, 0x00], // X
  89: [0x63, 0x63, 0x36, 0x1C, 0x18, 0x18, 0x18, 0x00], // Y
  90: [0x7F, 0x7F, 0x06, 0x0C, 0x30, 0x7F, 0x7F, 0x00], // Z
  // Add more characters as needed for a basic set
  // Question mark for unknown characters
  63: [0x3E, 0x7F, 0x63, 0x18, 0x18, 0x00, 0x18, 0x00], // ?
};

const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 8;

/**
 * A subset of character codes that are easily editable in the UI.
 */
export const EDITABLE_CHAR_CODES_SUBSET: { code: number, display: string }[] = [
  { code: 32, display: 'Spc' },
  ...Array.from({ length: 10 }, (_, i) => ({ code: 48 + i, display: String(i) })), // 0-9
  ...Array.from({ length: 26 }, (_, i) => ({ code: 65 + i, display: String.fromCharCode(65 + i) })), // A-Z
];

/**
 * An array of all 256 character codes, suitable for use in a character selector UI.
 */
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
 * @param customTextColor Optional custom text color (overrides defaults).
 * @param customBackgroundColor Optional custom background color (overrides defaults).
 * @returns A data URL string representing the rendered text image.
 */
export function renderMSX1TextToDataURL(
  text: string,
  font: MSXFont = DEFAULT_MSX_FONT,
  fontColorAttributes: MSXFontColorAttributes | undefined,
  scale: number = 1,
  charSpacing: number = 0, // In 1x pixels
  customTextColor?: string,
  customBackgroundColor?: string
): string {
  if (!text) return "";

  const canvas = document.createElement('canvas');
  const totalCharWidth = CHAR_WIDTH + charSpacing;
  canvas.width = (text.length * totalCharWidth - (text.length > 0 ? charSpacing : 0)) * scale;
  canvas.height = CHAR_HEIGHT * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) return "";

  ctx.imageSmoothingEnabled = false; // Crucial for pixel art

  // Use custom colors if provided, otherwise use defaults
  const defaultFgColor = customTextColor || '#FF0000'; // Use custom or red default
  const defaultBgColor = customBackgroundColor || '#000000'; // Use custom or black default

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
          // Usar colores de la fila si están definidos, sino usar los defaults (que pueden ser custom)
          fgForRow = charSpecificRowColors[y].fg || defaultFgColor;
          bgForRow = charSpecificRowColors[y].bg || defaultBgColor;
        }
        
        for (let x = 0; x < CHAR_WIDTH; x++) { // For each pixel in the row
          const isPixelSet = (rowByte >> (7 - x)) & 1;
          ctx.fillStyle = isPixelSet ? fgForRow : bgForRow;
          
          // Always draw to ensure consistent rendering (either foreground or background)
          // Skip drawing background if it's transparent
          if (isPixelSet || (bgForRow !== 'transparent' && customBackgroundColor !== 'transparent')) {
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
 * Creates a tile-based font from Bank 0 tiles using the same logic as ScreenPlayModal.
 * This ensures consistent rendering between Screen Editor and Play Mode.
 * @param tileBanks Array of tile banks.
 * @param allAssets All project assets.
 * @param msxFont Fallback MSX font.
 * @param msxFontColorAttributes Fallback font color attributes.
 * @param customTextColor Optional custom text color (overrides defaults).
 * @param customBackgroundColor Optional custom background color (overrides defaults).
 * @returns Object mapping characters to HTMLImageElement or null if not available.
 */
export function createTileBasedFont(
  tileBanks?: TileBank[],
  allAssets?: ProjectAsset[],
  msxFont?: MSXFont,
  msxFontColorAttributes?: MSXFontColorAttributes,
  customTextColor?: string,
  customBackgroundColor?: string
): { [ascii: string]: HTMLImageElement } | null {
  console.log('🔍 createTileBasedFont called:', { tileBanks, allAssetsCount: allAssets?.length });

  if (!tileBanks || !allAssets) {
    console.log('❌ createTileBasedFont: Missing tileBanks or allAssets');
    return null;
  }

  console.log('🔍 Looking for bank_0 in tileBanks:', tileBanks.map(b => b.id));
  const bank0 = tileBanks.find(bank => bank.id === 'bank_0');
  if (!bank0) {
    console.log('❌ createTileBasedFont: bank_0 not found');
    return null;
  }

  console.log('🔍 bank_0 found:', { id: bank0.id, assignedTiles: bank0.assignedTiles });
  if (!bank0.assignedTiles || Object.keys(bank0.assignedTiles).length === 0) {
    console.log('❌ createTileBasedFont: bank_0 has no assigned tiles');
    return null;
  }

  const tileBasedFont: { [ascii: string]: HTMLImageElement } = {};
  const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);
  const fontAssets = allAssets.filter(a => a.type === 'font');

  console.log('🔍 Available assets:', {
    tileCount: tileset.length,
    fontCount: fontAssets.length,
    fontIds: fontAssets.map(f => f.id)
  });

  const bank0TileIds = Object.keys(bank0.assignedTiles);
  console.log('🔍 bank0TileIds:', bank0TileIds);

  let bank0Fonts = fontAssets.filter(font => bank0TileIds.includes(font.id));
  console.log('🔍 Exact match bank0Fonts:', bank0Fonts.map(f => f.id));

  // If no exact match, try partial matching for font IDs
  // Special logic for TileBank font assignments like "font_font_123_ABC_456"
  if (bank0Fonts.length === 0) {
    bank0Fonts = fontAssets.filter(font => {
      return bank0TileIds.some(bankId => {
        // Check if bankId contains the font ID (for composite font names)
        return bankId.includes(font.id) || font.id.includes(bankId);
      });
    });
    console.log('🔍 Partial match bank0Fonts:', bank0Fonts.map(f => f.id));
    console.log('🔍 Matching details:', bank0TileIds.map(bankId => ({
      bankId,
      matchedFonts: fontAssets.filter(font => bankId.includes(font.id)).map(f => f.id)
    })));
  }

  // If we have fonts assigned to Bank 0, use them for character mapping
  if (bank0Fonts.length > 0) {
    bank0Fonts.forEach(fontAsset => {
      const fontData = fontAsset.data;

      // For each character needed, create a direct mapping
      const charactersNeeded = 'SCORE:0123456789LIVES ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!?-()[]{}';
      charactersNeeded.split('').forEach(char => {
        const charCode = char.charCodeAt(0);

        // Create a canvas for this character using MSX font
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');

        // Try to get pattern from font data first, then fallback to msxFont prop
        let pattern = null;
        let fontColorAttrs = null;

        if (fontData && fontData.fontData && fontData.fontData[charCode]) {
          pattern = fontData.fontData[charCode];
          fontColorAttrs = fontData.fontColorAttributes;
        } else if (msxFont && msxFont[charCode]) {
          pattern = msxFont[charCode];
          fontColorAttrs = msxFontColorAttributes;
        }

        if (ctx && pattern) {
          ctx.imageSmoothingEnabled = false;

          // Get default colors
          const defaultFgColor = customTextColor || '#FF0000'; // Use custom or red default
          const defaultBgColor = customBackgroundColor || '#000000'; // Use custom or black default

          // Render the character pattern with per-row colors (MSX Screen 2 style)
          for (let y = 0; y < 8; y++) {
            const rowByte = pattern[y];

            // Get colors for this specific row
            let fgColor = defaultFgColor;
            let bgColor = defaultBgColor;

            if (fontColorAttrs && fontColorAttrs[charCode] && Array.isArray(fontColorAttrs[charCode])) {
              // MSX Screen 2 style: array of color objects, one per row
              const rowColorAttr = fontColorAttrs[charCode][y];
              if (rowColorAttr && rowColorAttr.fg && rowColorAttr.bg) {
                fgColor = rowColorAttr.fg;
                bgColor = rowColorAttr.bg;
              }
            }

            for (let x = 0; x < 8; x++) {
              const isPixelSet = (rowByte >> (7 - x)) & 1;
              ctx.fillStyle = isPixelSet ? fgColor : bgColor;
              // Skip drawing background if it's transparent
              if (isPixelSet || (bgColor !== 'transparent' && customBackgroundColor !== 'transparent')) {
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }

          // Create image from canvas
          const img = new Image();
          img.src = canvas.toDataURL();
          tileBasedFont[char] = img;
        }
      });
    });
  }

  return Object.keys(tileBasedFont).length > 0 ? tileBasedFont : null;
}

/**
 * Renders text using either tile-based font (like Play Mode) or MSX font fallback.
 * This ensures consistent rendering between Screen Editor and Play Mode.
 * @param text The string to render.
 * @param tileBanks Tile banks for tile-based font.
 * @param allAssets All project assets.
 * @param msxFont Fallback MSX font.
 * @param msxFontColorAttributes Fallback font color attributes.
 * @param scale The scaling factor for the output image.
 * @param charSpacing Horizontal space between characters.
 * @param customTextColor Optional custom text color (overrides defaults).
 * @param customBackgroundColor Optional custom background color (overrides defaults).
 * @returns A data URL string representing the rendered text image.
 */
export function renderUnifiedTextToDataURL(
  text: string,
  tileBanks?: TileBank[],
  allAssets?: ProjectAsset[],
  msxFont: MSXFont = DEFAULT_MSX_FONT,
  msxFontColorAttributes?: MSXFontColorAttributes,
  scale: number = 1,
  charSpacing: number = 0,
  customTextColor?: string,
  customBackgroundColor?: string
): string {
  if (!text) return "";

  // Try to use tile-based font first (same as Play Mode)
  const tileBasedFont = createTileBasedFont(tileBanks, allAssets, msxFont, msxFontColorAttributes, customTextColor, customBackgroundColor);

  if (tileBasedFont) {
    // Use tile-based rendering (same logic as ScreenPlayModal)
    const canvas = document.createElement('canvas');
    const totalCharWidth = CHAR_WIDTH + charSpacing;
    canvas.width = (text.length * totalCharWidth - (text.length > 0 ? charSpacing : 0)) * scale;
    canvas.height = CHAR_HEIGHT * scale;
    const ctx = canvas.getContext('2d');

    if (!ctx) return "";

    ctx.imageSmoothingEnabled = false;

    let xOffset = 0;
    for (const char of text) {
      const tileImg = tileBasedFont[char.toUpperCase()] || tileBasedFont[char];

      if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
        ctx.drawImage(tileImg, xOffset * scale, 0, 8 * scale, 8 * scale);
      } else {
        // Fallback with custom colors if provided
        const fallbackBgColor = customBackgroundColor && customBackgroundColor !== 'transparent' ? customBackgroundColor : '#FF0000';
        const fallbackTextColor = customTextColor || '#FFFFFF';

        if (customBackgroundColor !== 'transparent') {
          ctx.fillStyle = fallbackBgColor;
          ctx.fillRect(xOffset * scale, 0, 8 * scale, 8 * scale);
        }
        ctx.fillStyle = fallbackTextColor;
        ctx.font = `${6 * scale}px monospace`;
        ctx.fillText(char, (xOffset + 1) * scale, (6) * scale);
      }

      xOffset += 8 + charSpacing;
    }
    return canvas.toDataURL();
  }

  // Fallback to MSX font rendering with custom colors if provided
  return renderMSX1TextToDataURL(text, msxFont, msxFontColorAttributes, scale, charSpacing, customTextColor, customBackgroundColor);
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
