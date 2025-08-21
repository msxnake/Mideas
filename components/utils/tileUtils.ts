

import { Tile, MSX1ColorValue, LineColorAttribute, DataFormat, PixelData } from '../../types';
import { MSX1_PALETTE_MAP, DEFAULT_SCREEN2_FG_COLOR_INDEX, DEFAULT_SCREEN2_BG_COLOR_INDEX, SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX_SCREEN5_PALETTE } from '../../constants';

const EDITOR_BASE_TILE_DIM_S2 = 8;

// Helper function to ensure two-digit uppercase hex representation
const toHexByte = (num: number): string => {
  let hex = num.toString(16).toUpperCase();
  if (hex.length === 1) {
    hex = '0' + hex;
  }
  return hex;
};

/**
 * Generates ASM code for a single SCREEN 2 tile, including pattern and color attribute data.
 * Pattern data for all character blocks is output first, followed by color attribute data for all blocks.
 * @param tile The tile object.
 * @param tileName The name to use for labels in the ASM code.
 * @param dataFormat The format ('hex' or 'decimal') for numerical output.
 * @returns A string containing the ASM code.
 */
export const generateTileASMCode = (
  tile: Tile,
  tileName: string,
  dataFormat: DataFormat
): string => {
  if (!tile.lineAttributes) {
    return `;; ERROR: Tile ${tileName} is missing line attributes required for SCREEN 2 export.\n`;
  }

  const safeTileName = tileName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let output = `;; Tile: ${tileName} (${tile.width}x${tile.height})\n`;
  output += `;; Structure: ${tile.width / EDITOR_BASE_TILE_DIM_S2}x${tile.height / EDITOR_BASE_TILE_DIM_S2} character blocks (8x8 pixels each)\n`;
  output += `;; Data format: ${dataFormat.toUpperCase()}\n\n`;


  const numCharBlocksX = tile.width / EDITOR_BASE_TILE_DIM_S2;
  const numCharBlocksY = tile.height / EDITOR_BASE_TILE_DIM_S2;

  const formatNumber = (value: number): string => {
    return dataFormat === 'hex' ? `$${toHexByte(value)}` : value.toString(10);
  };

  const patternDataLines: { comment: string, dataString: string }[] = [];
  const colorDataLines: { comment: string, dataString: string }[] = [];

  for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
    for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
      const blockComment = `;; Character Block (${cbX}, ${cbY}) for ${safeTileName}`;

      // Generate Pattern Data for this block
      const blockPatternBytes: number[] = [];
      for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
        const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
        let patternByte = 0;
        if (tile.lineAttributes[currentTileRow] && tile.lineAttributes[currentTileRow][cbX]) {
          const fgColorForSegment = tile.lineAttributes[currentTileRow][cbX].fg;
          for (let pixelInBlock = 0; pixelInBlock < EDITOR_BASE_TILE_DIM_S2; pixelInBlock++) {
            const currentTileCol = cbX * EDITOR_BASE_TILE_DIM_S2 + pixelInBlock;
            if (tile.data[currentTileRow] && tile.data[currentTileRow][currentTileCol] !== undefined) {
              const pixelColor = tile.data[currentTileRow][currentTileCol];
              if (pixelColor === fgColorForSegment) {
                patternByte |= (1 << (7 - pixelInBlock));
              }
            }
          }
        }
        blockPatternBytes.push(patternByte);
      }
      const patternValuesString = blockPatternBytes.map(formatNumber).join(',');
      patternDataLines.push({
        comment: `${blockComment} - PATTERN Data (8 bytes):`,
        dataString: `DB ${patternValuesString}`
      });

      // Generate Color Attribute Data for this block
      const blockColorBytes: number[] = [];
      for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
        const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
        let colorByte = (DEFAULT_SCREEN2_FG_COLOR_INDEX << 4) | DEFAULT_SCREEN2_BG_COLOR_INDEX; 
        if (tile.lineAttributes[currentTileRow] && tile.lineAttributes[currentTileRow][cbX]) {
          const attrPair = tile.lineAttributes[currentTileRow][cbX];
          const fgIdx = MSX1_PALETTE_MAP.get(attrPair.fg)?.index ?? DEFAULT_SCREEN2_FG_COLOR_INDEX;
          const bgIdx = MSX1_PALETTE_MAP.get(attrPair.bg)?.index ?? DEFAULT_SCREEN2_BG_COLOR_INDEX;
          colorByte = (fgIdx << 4) | bgIdx;
        }
        blockColorBytes.push(colorByte);
      }
      const colorValuesString = blockColorBytes.map(formatNumber).join(',');
      colorDataLines.push({
        comment: `${blockComment} - COLOR Attribute Data (8 bytes - FG|BG):`,
        dataString: `DB ${colorValuesString}`
      });
    }
  }

  // Append Pattern Data
  output += `;; --- PATTERN DATA ---\n`;
  if (patternDataLines.length > 0) {
    output += `${safeTileName}_PATTERN_DATA:\n`;
    patternDataLines.forEach(line => {
      output += `${line.comment}\n`;
      output += `    ${line.dataString}\n`;
    });
  } else {
    output += `;; No pattern data generated.\n`;
  }
  output += `\n`;

  // Append Color Data
  output += `;; --- COLOR ATTRIBUTE DATA ---\n`;
  if (colorDataLines.length > 0) {
    output += `${safeTileName}_COLOR_DATA:\n`;
    colorDataLines.forEach(line => {
      output += `${line.comment}\n`;
      output += `    ${line.dataString}\n`;
    });
  } else {
    output += `;; No color attribute data generated.\n`;
  }
  output += `\n;; End of Tile Data for ${safeTileName}\n`;

  return output;
};

/**
 * Creates default line color attributes for a tile in SCREEN 2 mode.
 * @param tileWidth The width of the tile in pixels.
 * @param tileHeight The height of the tile in pixels.
 * @param fgColor The default foreground color hex value.
 * @param bgColor The default background color hex value.
 * @returns A 2D array of LineColorAttribute objects.
 */
export const createDefaultLineAttributes = (tileWidth: number, tileHeight: number, fgColor: MSX1ColorValue, bgColor: MSX1ColorValue): LineColorAttribute[][] => {
  const numSegmentsPerRow = Math.max(1, tileWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT); 
  return Array(tileHeight).fill(null).map(() => 
    Array(numSegmentsPerRow).fill(null).map(() => ({ fg: fgColor, bg: bgColor }))
  );
};


/**
 * Generates raw byte array for tile pattern data.
 * For SCREEN 2, uses lineAttributes to determine FG color for "on" pixels.
 * For other modes, treats any non-transparent color as "on".
 */
export const generateTilePatternBytes = (tile: Tile, currentScreenMode: string): Uint8Array => {
  const bytes: number[] = [];
  const numCharBlocksX = tile.width / EDITOR_BASE_TILE_DIM_S2;
  const numCharBlocksY = tile.height / EDITOR_BASE_TILE_DIM_S2;
  const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";

  for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
    for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
      for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
        const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
        let patternByte = 0;
        let fgColorForSegment: MSX1ColorValue | undefined;

        if (isScreen2 && tile.lineAttributes && tile.lineAttributes[currentTileRow] && tile.lineAttributes[currentTileRow][cbX]) {
          fgColorForSegment = tile.lineAttributes[currentTileRow][cbX].fg;
        }

        for (let pixelInBlock = 0; pixelInBlock < EDITOR_BASE_TILE_DIM_S2; pixelInBlock++) {
          const currentTileCol = cbX * EDITOR_BASE_TILE_DIM_S2 + pixelInBlock;
          const pixelColor = tile.data[currentTileRow]?.[currentTileCol];

          if (pixelColor !== undefined) {
            let isPixelOn = false;
            if (isScreen2 && fgColorForSegment) {
              isPixelOn = (pixelColor === fgColorForSegment);
            } else if (!isScreen2) {
              // For non-Screen 2, consider any non-transparent pixel as "on"
              // This is a simplification; real non-Screen 2 modes have different color mechanisms.
              // MSX_SCREEN5_PALETTE[0].hex is 'rgba(0,0,0,0)' (transparent)
              isPixelOn = (pixelColor !== MSX_SCREEN5_PALETTE[0].hex && pixelColor !== tile.lineAttributes?.[0]?.[0]?.bg); // A very basic check
            }
            if (isPixelOn) {
              patternByte |= (1 << (7 - pixelInBlock));
            }
          }
        }
        bytes.push(patternByte);
      }
    }
  }
  return new Uint8Array(bytes);
};

/**
 * Rolls the tile data up by one pixel.
 * The top row is moved to the bottom.
 */
export const shiftTileDataUp = (tileData: PixelData): PixelData => {
  const height = tileData.length;
  if (height < 2) return tileData; // Nothing to roll

  const newData = tileData.slice(1); // All elements except the first
  newData.push([...tileData[0]]); // Add the first element to the end
  return newData;
};

/**
 * Rolls the tile data down by one pixel.
 * The bottom row is moved to the top.
 */
export const shiftTileDataDown = (tileData: PixelData): PixelData => {
  const height = tileData.length;
  if (height < 2) return tileData;

  const newData = tileData.slice(0, height - 1); // All elements except the last
  newData.unshift([...tileData[height - 1]]); // Add the last element to the beginning
  return newData;
};

/**
 * Rolls the tile data left by one pixel.
 * The leftmost column is moved to the right.
 */
export const shiftTileDataLeft = (tileData: PixelData): PixelData => {
  if (tileData.length === 0) return [];

  return tileData.map(row => {
    if (row.length < 2) return [...row];
    const newRow = row.slice(1);
    newRow.push(row[0]);
    return newRow;
  });
};

/**
 * Rolls the tile data right by one pixel.
 * The rightmost column is moved to the left.
 */
export const shiftTileDataRight = (tileData: PixelData): PixelData => {
  if (tileData.length === 0) return [];

  return tileData.map(row => {
    const width = row.length;
    if (width < 2) return [...row];
    const newRow = row.slice(0, width - 1);
    newRow.unshift(row[width - 1]);
    return newRow;
  });
};

/**
 * Mirrors the tile data horizontally (left to right).
 */
export const mirrorTileDataHorizontal = (tileData: PixelData): PixelData => {
  if (tileData.length === 0) return [];
  // For each row, create a new reversed array
  return tileData.map(row => [...row].reverse());
};

/**
 * Mirrors the tile data vertically (top to bottom).
 */
export const mirrorTileDataVertical = (tileData: PixelData): PixelData => {
  if (tileData.length === 0) return [];
  // Create a new reversed array of rows
  return [...tileData].reverse();
};

/**
 * Generates raw byte array for tile color attribute data (SCREEN 2 only).
 */
export const generateTileColorBytes = (tile: Tile): Uint8Array | null => {
  if (!tile.lineAttributes) return null;

  const bytes: number[] = [];
  const numCharBlocksX = tile.width / EDITOR_BASE_TILE_DIM_S2;
  const numCharBlocksY = tile.height / EDITOR_BASE_TILE_DIM_S2;

  for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
    for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
      for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
        const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
        let colorByte = (DEFAULT_SCREEN2_FG_COLOR_INDEX << 4) | DEFAULT_SCREEN2_BG_COLOR_INDEX;
        
        const attrPair = tile.lineAttributes[currentTileRow]?.[cbX];
        if (attrPair) {
          const fgIdx = MSX1_PALETTE_MAP.get(attrPair.fg)?.index ?? DEFAULT_SCREEN2_FG_COLOR_INDEX;
          const bgIdx = MSX1_PALETTE_MAP.get(attrPair.bg)?.index ?? DEFAULT_SCREEN2_BG_COLOR_INDEX;
          colorByte = (fgIdx << 4) | bgIdx;
        }
        bytes.push(colorByte);
      }
    }
  }
  return new Uint8Array(bytes);
};