import { ScreenMap, Tile, TileBank, ScreenTile, SuperRLEExportData, ScreenLayerData, SpriteFrame } from '../../types';
import { EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE as CONST_EMPTY_CELL_CHAR_CODE, SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, MSX1_PALETTE, MSX_SCREEN5_PALETTE } from '../../constants'; 

const RLE_MARKER_PLETTER = 0xC9;


// Constants for SuperRLE
const RLE_CONTROL_MIN_COUNT = 3; 
const RLE_MAX_LEN_ENCODABLE = 128; // Max RLE run per single command (256 - N, where N_min = 128)

const LITERAL_MAX_COUNT = 126;
const LZ_CONTROL_BYTE = 127;
const LZ_MIN_MATCH_LENGTH = 3;
const LZ_MAX_MATCH_LENGTH = 255; // Max length encodable in one LZ command byte
const LZ_MAX_OFFSET = 255;       // Max offset encodable in one LZ command byte
const LZ_MAX_MATCH_LENGTH_CHECK_AHEAD = 258; // How far to look ahead in input for potential LZ matches


// Helper to find the best RLE match from the current index
const findBestRLEMatch = (
  data: number[],
  currentIndex: number,
  maxCount: number, // Max number of repetitions for one RLE command
  rleMarkerValue?: number // For Pletter, the RLE marker itself cannot be the value in an RLE sequence
): { count: number; value: number } => {
  if (currentIndex >= data.length) return { count: 0, value: 0 };
  const valueToRepeat = data[currentIndex];
  if (rleMarkerValue !== undefined && valueToRepeat === rleMarkerValue) {
    return { count: 0, value: valueToRepeat }; // Cannot RLE the marker itself for Pletter
  }
  let count = 0;
  for (let i = currentIndex; i < data.length && count < maxCount; i++) {
    if (data[i] === valueToRepeat) {
      count++;
    } else {
      break;
    }
  }
  return { count, value: valueToRepeat };
};


// Helper for the new overlapping LZ logic (SuperRLE)
const findBestOverlappingLZMatch = (
  uncompressedChunkToMatch: number[], 
  outputBufferHistory: ReadonlyArray<number>,    // Changed to ReadonlyArray
  minMatchLen: number,
  maxMatchLenAllowedByCmd: number, 
  maxOffsetAllowedByCmd: number   
): { length: number; offset: number } => {
  let bestMatch = { length: 0, offset: 0 };

  if (outputBufferHistory.length === 0 || uncompressedChunkToMatch.length < minMatchLen) {
    return bestMatch;
  }

  // Iterate all possible valid offsets
  for (let offset = 1; offset <= Math.min(maxOffsetAllowedByCmd, outputBufferHistory.length); offset++) {
    let currentMatchLength = 0;
    // Try to match uncompressedChunkToMatch against history + self-referential copy
    for (let k = 0; k < uncompressedChunkToMatch.length && k < maxMatchLenAllowedByCmd; k++) {
      // Source byte from history, handles overlap by wrapping around the 'offset' part of the history
      const sourceByte = outputBufferHistory[outputBufferHistory.length - offset + (k % offset)];
      
      if (uncompressedChunkToMatch[k] === sourceByte) {
        currentMatchLength++;
      } else {
        break;
      }
    }

    // If this match is better
    if (currentMatchLength >= minMatchLen && currentMatchLength > bestMatch.length) {
      bestMatch = { length: currentMatchLength, offset: offset };
    }
  }
  return bestMatch;
};


// Helper to calculate literal run length
const calculateLiteralRunLength = (
  data: number[], 
  currentIndex: number,
  maxLen: number, 
  currentVirtualOutput: ReadonlyArray<number>, 
  compressionType: 'pletter' | 'superRLE',
  lzFinder: (chunk: number[], history: ReadonlyArray<number>, minL: number, maxL: number, maxO: number) => {length:number, offset:number}
): number => {
  let len = 0;
  for (let i = 0; i < maxLen && currentIndex + i < data.length; i++) {
    if (i < maxLen -1) { 
        const nextByteIndex = currentIndex + i + 1;
        if (nextByteIndex < data.length) {
            const rleCheck = findBestRLEMatch(data, nextByteIndex, RLE_MAX_LEN_ENCODABLE, compressionType === 'pletter' ? RLE_MARKER_PLETTER : undefined);
            if (rleCheck.count >= RLE_CONTROL_MIN_COUNT) { 
                break;
            }
            if (compressionType === 'superRLE') {
                const tempOutputForLZCheck = currentVirtualOutput.concat(data.slice(currentIndex, currentIndex + i + 1));
                const lzCheck = lzFinder( 
                    data.slice(nextByteIndex, nextByteIndex + LZ_MAX_MATCH_LENGTH_CHECK_AHEAD),
                    tempOutputForLZCheck, 
                    LZ_MIN_MATCH_LENGTH,
                    LZ_MAX_MATCH_LENGTH,
                    LZ_MAX_OFFSET
                );
                if (lzCheck.length >= LZ_MIN_MATCH_LENGTH) { 
                    break;
                }
            }
        }
    }
    len++;
  }
  return len === 0 && currentIndex < data.length ? 1 : len; 
};

/**
 * Generates raw byte array for a screen map layout.
 * @param screenMap The screen map object.
 * @param tileset Array of all tile assets.
 * @param tileBanks Optional array of tile banks for Screen 2.
 * @param currentScreenMode The current MSX screen mode.
 * @returns A Uint8Array of map layout bytes.
 */
export const generateScreenMapLayoutBytes = (
  screenMap: ScreenMap,
  tileset: Tile[],
  tileBanks: TileBank[] | undefined,
  currentScreenMode: string
): Uint8Array => {
  const backgroundLayer = screenMap.layers.background;
  const activeX = screenMap.activeAreaX ?? 0;
  const activeY = screenMap.activeAreaY ?? 0;
  const activeW = screenMap.activeAreaWidth ?? screenMap.width;
  const activeH = screenMap.activeAreaHeight ?? screenMap.height;

  const mapIndices: number[] = [];
  let nextNonScreen2Index = 0;
  const nonScreen2TileToGlobalIndexMap = new Map<string, number>();

  for (let r = 0; r < activeH; r++) {
    const mapY = activeY + r;
    for (let c = 0; c < activeW; c++) {
      const mapX = activeX + c;
      if (mapY >= backgroundLayer.length || mapX >= backgroundLayer[mapY]?.length) {
        mapIndices.push(CONST_EMPTY_CELL_CHAR_CODE);
        continue;
      }

      const screenTile = backgroundLayer[mapY][mapX];
      if (!screenTile || !screenTile.tileId) {
        mapIndices.push(CONST_EMPTY_CELL_CHAR_CODE);
      } else {
        let actualCharCodeForCell = CONST_EMPTY_CELL_CHAR_CODE;
        const tileAsset = tileset.find(t => t.id === screenTile.tileId);

        if (currentScreenMode === "SCREEN 2 (Graphics I)" && tileBanks && tileAsset) {
          let foundInBank = false;
          for (const bank of tileBanks) {
            if ((bank.enabled ?? true) && bank.assignedTiles[screenTile.tileId]) {
              const baseCharCode = bank.assignedTiles[screenTile.tileId].charCode;
              const widthInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
              const subX = screenTile.subTileX || 0;
              const subY = screenTile.subTileY || 0;
              actualCharCodeForCell = baseCharCode + (subY * widthInChars) + subX;
              if (actualCharCodeForCell >= bank.charsetRangeStart && actualCharCodeForCell <= bank.charsetRangeEnd) {
                 foundInBank = true;
                 break;
              } else {
                actualCharCodeForCell = CONST_EMPTY_CELL_CHAR_CODE; // Code out of bank range, treat as unassigned
              }
            }
          }
          if (!foundInBank) {
            actualCharCodeForCell = CONST_EMPTY_CELL_CHAR_CODE;
          }
        } else if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
          const partKey = `${screenTile.tileId}_${screenTile.subTileX ?? 0}_${screenTile.subTileY ?? 0}`;
          if (!nonScreen2TileToGlobalIndexMap.has(partKey)) {
            if (nextNonScreen2Index > 255) { // Cap at 255 for byte-sized indices
              actualCharCodeForCell = CONST_EMPTY_CELL_CHAR_CODE; 
            } else {
              nonScreen2TileToGlobalIndexMap.set(partKey, nextNonScreen2Index);
              actualCharCodeForCell = nextNonScreen2Index++;
            }
          } else {
            actualCharCodeForCell = nonScreen2TileToGlobalIndexMap.get(partKey)!;
          }
        }
        mapIndices.push(actualCharCodeForCell);
      }
    }
  }
  return new Uint8Array(mapIndices);
};

/**
 * Compresses screen data using an optimized RLE algorithm.
 * Packets are either literal (0-127 bytes) or repeat (2-127 repeats).
 * @param uncompressedBytes The raw byte array of the screen layout.
 * @returns A new array of bytes containing the compressed packets.
 */
export const generateOptimizedRLEData = (uncompressedBytes: number[]): number[] => {
    if (uncompressedBytes.length === 0) {
        return [];
    }

    const compressed: number[] = [];
    let i = 0;
    const maxPacketSize = 127;

    while (i < uncompressedBytes.length) {
        // Look for repetitions of at least 2
        let repeatCount = 1;
        const valueToRepeat = uncompressedBytes[i];
        for (let j = i + 1; j < uncompressedBytes.length && repeatCount < maxPacketSize; j++) {
            if (uncompressedBytes[j] === valueToRepeat) {
                repeatCount++;
            } else {
                break;
            }
        }

        if (repeatCount >= 2) {
            // Emit a repetition packet: 0x80 | count, value
            compressed.push(0x80 | repeatCount, valueToRepeat);
            i += repeatCount;
            continue;
        }

        // If no good repetition, find a literal run
        let literalRunEnd = i;
        while (literalRunEnd < uncompressedBytes.length && (literalRunEnd - i) < maxPacketSize) {
            // A literal run ends when the *next* byte starts a repetition of 2 or more
            if (literalRunEnd + 2 < uncompressedBytes.length &&
                uncompressedBytes[literalRunEnd + 1] === uncompressedBytes[literalRunEnd + 2]) {
                // A run of at least 2 starts after the current byte. Include the current byte in the literal run.
                literalRunEnd++;
                break;
            }
            literalRunEnd++;
        }
        
        const literalCount = literalRunEnd - i;
        if (literalCount > 0) {
            // Emit a literal packet: count, value1, value2, ...
            compressed.push(literalCount);
            compressed.push(...uncompressedBytes.slice(i, i + literalCount));
            i += literalCount;
        }
    }

    return compressed;
};


/**
 * Generates SuperRLE or Pletter compressed data for a screen map's background layer.
 * @param backgroundLayer The screen layer data to compress.
 * @param tileset Array of all tile assets in the project.
 * @param baseTileDim The base dimension of a tile cell (e.g., 8 for Screen 2).
 * @param tileBanks Optional array of tile bank configurations for Screen 2 mode.
 * @param compressionType 'pletter' or 'superRLE'
 * @returns SuperRLEExportData object or an error object.
 */
export const generateSuperRLEData = (
  backgroundLayer: ScreenLayerData,
  tileset: Tile[],
  baseTileDim: number,
  tileBanks: TileBank[] | undefined,
  compressionType: 'pletter' | 'superRLE' = 'superRLE'
): Omit<SuperRLEExportData, 'mapName' | 'compressionMethodName'> | { error: string } => {
    
  const mapHeight = backgroundLayer.length;
  const mapWidth = backgroundLayer[0]?.length || 0;
  if (mapHeight === 0 || mapWidth === 0) return { error: "Map data is empty." };

  const uncompressedBytes: number[] = [];
  const tilePartReferencesList: NonNullable<SuperRLEExportData['tilePartReferences']> = [];
  const tilePartToByteMap = new Map<string, number>();
  let nextByteValueForRefs = 0;

  const getByteForTilePart = (tileId: string | null, subTileX?: number, subTileY?: number): number => {
    const emptyKey = "EMPTY_TILE_PART_PLACEHOLDER";

    if (!tileId) { 
        if (!tilePartToByteMap.has(emptyKey)) {
            let valueToAssign = nextByteValueForRefs;
            if (compressionType === 'pletter') {
                 while (valueToAssign === RLE_MARKER_PLETTER) valueToAssign++; 
            }
            if (valueToAssign > 255 && compressionType === 'pletter') {
              throw new Error("Pletter: Too many unique tile parts including empty (exceeded 255).");
            }
            
            const finalByteVal = valueToAssign % 256;
            tilePartToByteMap.set(emptyKey, finalByteVal);
            tilePartReferencesList.push({ byteValue: finalByteVal, tileId: null, name: "Empty" });
            nextByteValueForRefs = valueToAssign + 1;
        }
        return tilePartToByteMap.get(emptyKey)!;
    }
    
    const tileAsset = tileset.find(t => t.id === tileId);
    let charCodeForCell = CONST_EMPTY_CELL_CHAR_CODE; 

    if (tileBanks && tileAsset && baseTileDim === EDITOR_BASE_TILE_DIM_S2) { 
        let foundInBank = false;
        for (const bank of tileBanks) {
            const isBankEffectivelyEnabled = bank.enabled ?? true;
            if (isBankEffectivelyEnabled && bank.assignedTiles[tileId]) {
                const baseCharCode = bank.assignedTiles[tileId].charCode;
                const widthInChars = Math.ceil(tileAsset.width / baseTileDim);
                const sX = subTileX || 0;
                const sY = subTileY || 0;
                const calculatedCharCode = baseCharCode + (sY * widthInChars) + sX;
                 if (calculatedCharCode >= bank.charsetRangeStart && calculatedCharCode <= bank.charsetRangeEnd) {
                    charCodeForCell = calculatedCharCode;
                    foundInBank = true;
                    
                    if (!tilePartReferencesList.some(ref => ref.byteValue === charCodeForCell)) {
                        tilePartReferencesList.push({ byteValue: charCodeForCell, tileId, subTileX: sX, subTileY: sY, name: tileAsset?.name || 'Unknown Tile (S2)' });
                    }
                    break;
                }
            }
        }
        if (!foundInBank) charCodeForCell = getByteForTilePart(null); 
    } else if (tileAsset) { 
        const partKey = `${tileId}_${subTileX ?? 0}_${subTileY ?? 0}`;
        if (!tilePartToByteMap.has(partKey)) {
            let valueToAssign = nextByteValueForRefs;
             if (compressionType === 'pletter') {
                while (valueToAssign === RLE_MARKER_PLETTER) valueToAssign++;
            }
            if (valueToAssign > 255 && compressionType === 'pletter') {
               throw new Error("Pletter: Too many unique tile parts for non-S2 mapping (exceeded 255).");
            }
            charCodeForCell = valueToAssign % 256;
            tilePartToByteMap.set(partKey, charCodeForCell);
            tilePartReferencesList.push({ byteValue: charCodeForCell, tileId, subTileX, subTileY, name: tileAsset?.name || 'Unknown Tile' });
            nextByteValueForRefs = valueToAssign + 1;
        } else {
            charCodeForCell = tilePartToByteMap.get(partKey)!;
        }
    } else { 
      return getByteForTilePart(null);
    }
    return charCodeForCell;
  };

  try {
    for (let r = 0; r < mapHeight; r++) {
        for (let c = 0; c < mapWidth; c++) {
        const screenTile = backgroundLayer[r][c];
        uncompressedBytes.push(getByteForTilePart(screenTile.tileId, screenTile.subTileX, screenTile.subTileY));
        }
    }
  } catch (e: any) {
    return { error: e.message || "Error preparing uncompressed data for Pletter/SuperRLE." };
  }
  
  const originalSize = uncompressedBytes.length;
  if (originalSize === 0) return { originalSize: 0, compressedSize: 1, superRLEDataBytes: [0], mapWidth, mapHeight, tilePartReferences: [] };

  const compressedBytes: number[] = [];
  let currentIndex = 0;
  const virtualOutputBuffer: number[] = [];


  while (currentIndex < originalSize) {
    
    const rleMatch = findBestRLEMatch(
        uncompressedBytes, 
        currentIndex, 
        RLE_MAX_LEN_ENCODABLE,
        compressionType === 'pletter' ? RLE_MARKER_PLETTER : undefined
    );
    const rleSavings = (rleMatch.count >= RLE_CONTROL_MIN_COUNT) ? rleMatch.count - 2 : -1;

    
    let lzMatch = { length: 0, offset: 0 };
    let lzSavings = -1;
    if (compressionType === 'superRLE') {
        const lookaheadChunk = uncompressedBytes.slice(currentIndex, currentIndex + LZ_MAX_MATCH_LENGTH_CHECK_AHEAD);
        lzMatch = findBestOverlappingLZMatch(
            lookaheadChunk,
            virtualOutputBuffer, 
            LZ_MIN_MATCH_LENGTH,
            LZ_MAX_MATCH_LENGTH,
            LZ_MAX_OFFSET
        );
        if (lzMatch.length >= LZ_MIN_MATCH_LENGTH) {
            lzSavings = lzMatch.length - 3;
        }
    }

    if (rleSavings >= 0 && rleSavings >= lzSavings) {
        const countToEncode = rleMatch.count; 
        compressedBytes.push(256 - countToEncode, rleMatch.value);
        for (let k = 0; k < countToEncode; k++) virtualOutputBuffer.push(rleMatch.value);
        currentIndex += countToEncode;
    } else if (lzSavings >= 0 && compressionType === 'superRLE') {
        compressedBytes.push(LZ_CONTROL_BYTE, lzMatch.length, lzMatch.offset);
        
        for (let k = 0; k < lzMatch.length; k++) {
            virtualOutputBuffer.push(virtualOutputBuffer[virtualOutputBuffer.length - lzMatch.offset + (k % lzMatch.offset)]);
        }
        currentIndex += lzMatch.length;
    } else {
      
      const literalLength = calculateLiteralRunLength(
          uncompressedBytes, currentIndex, LITERAL_MAX_COUNT,
          virtualOutputBuffer, compressionType,
          (chunk, history, minL, maxL, maxO) => findBestOverlappingLZMatch(chunk, history, minL, maxL, maxO)
      );
      
      if (literalLength === 0 && currentIndex < originalSize) { 
          console.error("Literal length 0, forcing 1");
          compressedBytes.push(1, uncompressedBytes[currentIndex]);
          virtualOutputBuffer.push(uncompressedBytes[currentIndex]);
          currentIndex++;
          continue;
      }
      if (literalLength === 0 && currentIndex >= originalSize) break; 

      compressedBytes.push(literalLength);
      for (let i = 0; i < literalLength; i++) {
          const byteVal = uncompressedBytes[currentIndex + i];
          compressedBytes.push(byteVal);
          virtualOutputBuffer.push(byteVal);
      }
      currentIndex += literalLength;
    }
  }

  compressedBytes.push(0); 
  
  const uniqueRefs = new Map<number, NonNullable<SuperRLEExportData['tilePartReferences']>[0]>();
  tilePartReferencesList.forEach(ref => {
      if (!uniqueRefs.has(ref.byteValue)) {
          uniqueRefs.set(ref.byteValue, ref);
      }
  });
  const sortedUniqueTilePartReferences = Array.from(uniqueRefs.values()).sort((a,b) => a.byteValue - b.byteValue);


  return {
    mapWidth, mapHeight,
    originalSize,
    compressedSize: compressedBytes.length,
    superRLEDataBytes: compressedBytes,
    tilePartReferences: sortedUniqueTilePartReferences,
  };
};

/**
 * Deep compares two tile objects.
 * @param tile1 The first tile.
 * @param tile2 The second tile.
 * @returns True if tiles are identical in content, false otherwise.
 */
export const deepCompareTiles = (tile1: Tile, tile2: Tile): boolean => {
  if (tile1.width !== tile2.width || tile1.height !== tile2.height) {
    return false;
  }

  // Compare pixel data
  if (tile1.data.length !== tile2.data.length) return false;
  for (let y = 0; y < tile1.height; y++) {
    if (tile1.data[y].length !== tile2.data[y].length) return false;
    for (let x = 0; x < tile1.width; x++) {
      if (tile1.data[y][x] !== tile2.data[y][x]) {
        return false;
      }
    }
  }

  // Compare line attributes (for SCREEN 2)
  if (tile1.lineAttributes && tile2.lineAttributes) {
    if (tile1.lineAttributes.length !== tile2.lineAttributes.length) return false;
    for (let y = 0; y < tile1.lineAttributes.length; y++) {
      if (tile1.lineAttributes[y].length !== tile2.lineAttributes[y].length) return false;
      for (let s = 0; s < tile1.lineAttributes[y].length; s++) {
        if (
          tile1.lineAttributes[y][s].fg !== tile2.lineAttributes[y][s].fg ||
          tile1.lineAttributes[y][s].bg !== tile2.lineAttributes[y][s].bg
        ) {
          return false;
        }
      }
    }
  } else if (tile1.lineAttributes !== tile2.lineAttributes) { // One has it, the other doesn't
    return false;
  }

  // Compare logical properties
  if (JSON.stringify(tile1.logicalProperties) !== JSON.stringify(tile2.logicalProperties)) {
    return false;
  }

  return true;
};


export function createTileDataURL(
  fullTileAsset: Tile,
  subTileXCoord: number | undefined,
  subTileYCoord: number | undefined,
  outputCellPixelWidth: number, 
  outputCellPixelHeight: number, 
  baseSliceDim: number, 
  currentScreenMode: string
): string {
  const { data: fullPixelData, width: fullAssetWidth, height: fullAssetHeight, lineAttributes } = fullTileAsset;
  if (!fullPixelData || fullAssetHeight === 0 || fullAssetWidth === 0) return "";

  const canvas = document.createElement('canvas');
  canvas.width = baseSliceDim;
  canvas.height = baseSliceDim; // Assuming square base slices for tiles
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = false;

  const sX = (subTileXCoord ?? 0) * baseSliceDim;
  const sY = (subTileYCoord ?? 0) * baseSliceDim;

  for (let y = 0; y < baseSliceDim; y++) {
    for (let x = 0; x < baseSliceDim; x++) {
      const fullDataX = sX + x;
      const fullDataY = sY + y;

      if (fullDataY >= 0 && fullDataY < fullAssetHeight && fullDataX >= 0 && fullDataX < fullAssetWidth) {
        let color = fullPixelData[fullDataY][fullDataX];
        if (currentScreenMode === "SCREEN 2 (Graphics I)" && lineAttributes && lineAttributes[fullDataY]) {
          const segmentIndex = Math.floor(fullDataX / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
          const attr = lineAttributes[fullDataY][segmentIndex];
          if (attr && color !== attr.fg && color !== attr.bg) {
            color = attr.fg; 
          }
        }
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1); 
      }
    }
  }
  
  if (canvas.width === outputCellPixelWidth && canvas.height === outputCellPixelHeight) {
    return canvas.toDataURL();
  }
  
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = outputCellPixelWidth;
  scaledCanvas.height = outputCellPixelHeight;
  const scaledCtx = scaledCanvas.getContext('2d');
  if (!scaledCtx) return canvas.toDataURL(); 

  scaledCtx.imageSmoothingEnabled = false;
  scaledCtx.drawImage(canvas, 0, 0, outputCellPixelWidth, outputCellPixelHeight);
  return scaledCanvas.toDataURL();
}

export function createSpriteDataURL(
  spriteFrameData: SpriteFrame['data'],
  spriteWidth: number,
  spriteHeight: number
): string {
  if (!spriteFrameData || spriteHeight === 0 || spriteWidth === 0) return "";

  const canvas = document.createElement('canvas');
  canvas.width = spriteWidth;
  canvas.height = spriteHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < spriteHeight; y++) {
    for (let x = 0; x < spriteWidth; x++) {
      const color = spriteFrameData[y]?.[x];
      if (color && color !== 'rgba(0,0,0,0)') { 
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas.toDataURL();
}

export const renderScreenToCanvas = (
  canvas: HTMLCanvasElement,
  screenMap: ScreenMap,
  tileset: Tile[],
  currentScreenMode: string,
  baseSliceDim: number
) => {
  const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";

  canvas.width = screenMap.width * baseSliceDim;
  canvas.height = screenMap.height * baseSliceDim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const defaultBg = isScreen2 ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[4].hex;
  ctx.fillStyle = defaultBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const layer = screenMap.layers.background;

  for (let y = 0; y < screenMap.height; y++) {
      for (let x = 0; x < screenMap.width; x++) {
          const screenTile = layer[y]?.[x];
          if (!screenTile?.tileId) continue;

          const tileAsset = tileset.find(t => t.id === screenTile.tileId);
          if (!tileAsset) continue;
          
          const { data: fullPixelData, width: fullAssetWidth, height: fullAssetHeight, lineAttributes } = tileAsset;
          if (!fullPixelData) continue;

          const subTileXCoord = screenTile.subTileX ?? 0;
          const subTileYCoord = screenTile.subTileY ?? 0;
          
          const sX = subTileXCoord * baseSliceDim;
          const sY = subTileYCoord * baseSliceDim;
          
          for (let py = 0; py < baseSliceDim; py++) {
              for (let px = 0; px < baseSliceDim; px++) {
                  const fullDataX = sX + px;
                  const fullDataY = sY + py;

                  if (fullDataY < fullAssetHeight && fullDataX < fullAssetWidth) {
                      let color = fullPixelData[fullDataY]?.[fullDataX];
                      if(color === undefined) continue;

                      if (isScreen2 && lineAttributes && lineAttributes[fullDataY]) {
                          const segmentIndex = Math.floor(fullDataX / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
                          const attr = lineAttributes[fullDataY][segmentIndex];
                          if (attr && color !== attr.fg && color !== attr.bg) {
                              color = attr.fg;
                          }
                      }
                      
                      ctx.fillStyle = color;
                      ctx.fillRect(x * baseSliceDim + px, y * baseSliceDim + py, 1, 1);
                  }
              }
          }
      }
  }
};
