import { ScreenMap, Tile, TileBank, TileBankDefinition, ScreenTile, SuperRLEExportData, ScreenLayerData, SpriteFrame, ProjectAsset } from '../../types';
import { EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE as CONST_EMPTY_CELL_CHAR_CODE, SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, MSX1_PALETTE, MSX_SCREEN5_PALETTE } from '../../constants'; 
import { getBackgroundColorHex, isScreen2Mode } from '../../utils/screenModeConfig';

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


/**
 * Finds the best run-length encoding (RLE) match from the current index in the data.
 * @param data The input data array.
 * @param currentIndex The current index to start searching from.
 * @param maxCount The maximum number of repetitions for one RLE command.
 * @param rleMarkerValue Optional value that cannot be part of an RLE sequence (for Pletter).
 * @returns An object with the count of repetitions and the value that was repeated.
 */
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


/**
 * Finds the best Lempel-Ziv (LZ) match, allowing for overlapping copies.
 * This is a key part of the SuperRLE compression algorithm.
 * @param uncompressedChunkToMatch The chunk of data to find a match for.
 * @param outputBufferHistory The history of the output buffer to search within.
 * @param minMatchLen The minimum length of a valid match.
 * @param maxMatchLenAllowedByCmd The maximum length of a match allowed by the command format.
 * @param maxOffsetAllowedByCmd The maximum offset allowed by the command format.
 * @returns An object with the length and offset of the best match found.
 */
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


/**
 * Calculates the length of a literal run, stopping before a better compression opportunity (RLE or LZ).
 * @param data The input data array.
 * @param currentIndex The current index to start calculating from.
 * @param maxLen The maximum length of a literal run.
 * @param currentVirtualOutput The current state of the output buffer, for LZ lookbehind.
 * @param compressionType The type of compression being used ('pletter' or 'superRLE').
 * @param lzFinder A function to find the best LZ match.
 * @returns The calculated length of the literal run.
 */
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
 * @param screenMap The screen map object to generate the layout from.
 * @param tileset An array of all available tile assets.
 * @param tileBanks An optional array of tile banks, used for Screen 2 mode to map tiles to character codes.
 * @param currentScreenMode A string identifying the current MSX screen mode (e.g., "SCREEN 2 (Graphics I)").
 * @returns A Uint8Array containing the raw byte data for the screen map layout.
 */
export const generateScreenMapLayoutBytes = (
  screenMap: ScreenMap,
  tileset: Tile[],
  tileBanks: TileBankDefinition[] | undefined,
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
          let debugInfo = { tileId: screenTile.tileId, position: { x: mapX, y: mapY }, attempts: [] as any[], banksReceived: tileBanks.length };

          // DEBUG: Log first tile to understand assignedTiles structure (only once per generation)
          if (typeof (globalThis as any).screenUtils_firstTileLogged === 'undefined') {
            console.log('🔍 First tile structure check:', {
              tileId: screenTile.tileId,
              position: { x: mapX, y: mapY },
              banksCount: tileBanks.length,
              banks: tileBanks.map(b => ({
                name: b.name,
                assignedTileIds: Object.keys(b.assignedTiles || {}),
                hasThisTile: !!(b.assignedTiles && b.assignedTiles[screenTile.tileId]),
                assignedTilesType: typeof b.assignedTiles,
                assignedTilesSample: b.assignedTiles ? Object.entries(b.assignedTiles).slice(0, 2) : []
              }))
            });
            (globalThis as any).screenUtils_firstTileLogged = true;
          }

          for (const bank of tileBanks) {
            // Only process if bank is enabled and tile is assigned
            if ((bank.enabled ?? true) && bank.assignedTiles[screenTile.tileId]) {
              const baseCharCode = bank.assignedTiles[screenTile.tileId].charCode;
              const widthInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
              const subX = screenTile.subTileX || 0;
              const subY = screenTile.subTileY || 0;
              actualCharCodeForCell = baseCharCode + (subY * widthInChars) + subX;

              const inRange = actualCharCodeForCell >= bank.charsetRangeStart && actualCharCodeForCell <= bank.charsetRangeEnd;
              debugInfo.attempts.push({
                bankName: bank.name,
                baseCharCode,
                calculated: actualCharCodeForCell,
                range: `${bank.charsetRangeStart}-${bank.charsetRangeEnd}`,
                inRange
              });

              if (inRange) {
                 foundInBank = true;
                 break;
              } else {
                actualCharCodeForCell = CONST_EMPTY_CELL_CHAR_CODE; // Code out of bank range, treat as unassigned
              }
            } else {
              // Tile is NOT assigned to this bank at all
              debugInfo.attempts.push({
                bankName: bank.name,
                reason: 'Tile not assigned to this bank'
              });
            }
          }
          if (!foundInBank) {
            console.warn('⚠️ Tile not found in valid range:', debugInfo);
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
 * Generates Z80 assembly code for a screen map layout - EXACT SAME FUNCTION AS ExportLayoutASMModal
 * @param mapName The name of the map.
 * @param mapWidth The width of the map in tiles.
 * @param mapHeight The height of the map in tiles.
 * @param mapIndices The map layout data, as an array of tile indices.
 * @param referenceComments Optional comments providing context for tile indices.
 * @param dataFormat The data format for exporting to ASM.
 * @returns A string containing the generated assembly code.
 */
export const generateScreenLayoutASMCode = (
  mapName: string,
  mapWidth: number,
  mapHeight: number,
  mapIndices: number[],
  referenceComments: string[],
  dataFormat: 'hex' | 'decimal' = 'hex'
): string => {
  const ASM_BYTES_PER_LINE = 16;
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; MAP: ${mapName} (${mapWidth}x${mapHeight} tiles)\n`;
  asmString += `;; Total size: ${mapIndices.length} bytes\n\n`;

  if (referenceComments.length > 0) {
    asmString += `;; --- TILE INDEX REFERENCES for ${safeMapName} ---\n`;
    asmString += referenceComments.join('\n') + '\n\n';
  }

  // Constants for MSX Main Generator
  asmString += `SCREEN_${safeMapName}_WIDTH     EQU ${mapWidth}\n`;
  asmString += `SCREEN_${safeMapName}_HEIGHT    EQU ${mapHeight}\n`;
  asmString += `SCREEN_${safeMapName}_SIZE      EQU ${mapIndices.length}\n\n`;

  asmString += `SCREEN_${safeMapName}_LAYOUT:\n`;

  for (let i = 0; i < mapIndices.length; i += ASM_BYTES_PER_LINE) {
    const chunk = mapIndices.slice(i, i + ASM_BYTES_PER_LINE);
    const formattedChunk = chunk.map(idx => {
        return dataFormat === 'hex' ? `#${idx.toString(16).padStart(2, '0').toUpperCase()}` : idx.toString();
    });
    asmString += `    DB ${formattedChunk.join(',')}\n`;
  }

  return asmString;
};

/**
 * Generates Z80 assembly code for a behavior map.
 * @param mapName The name of the map.
 * @param mapWidth The width of the map in tiles.
 * @param mapHeight The height of the map in tiles.
 * @param behaviorMapData The behavior map data, as an array of map IDs.
 * @param dataFormat The data format for exporting to ASM.
 * @returns A string containing the generated assembly code.
 */
export const generateBehaviorMapASMCode = (
  mapName: string,
  mapWidth: number,
  mapHeight: number,
  behaviorMapData: number[],
  dataFormat: 'hex' | 'decimal' = 'hex'
): string => {
  const ASM_BYTES_PER_LINE = 16;
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; BEHAVIOR MAP: ${mapName} (${mapWidth}x${mapHeight} tiles)\n`;
  asmString += `;; Total size: ${behaviorMapData.length} bytes (Map IDs 0-255)\n`;
  asmString += `;; Data format: ${dataFormat.toUpperCase()}\n\n`;

  // Constants for MSX Main Generator
  asmString += `BEHAVIOR_${safeMapName}_WIDTH     EQU ${mapWidth}\n`;
  asmString += `BEHAVIOR_${safeMapName}_HEIGHT    EQU ${mapHeight}\n`;
  asmString += `BEHAVIOR_${safeMapName}_SIZE      EQU ${behaviorMapData.length}\n\n`;

  asmString += `BEHAVIOR_${safeMapName}_DATA:\n`;

  const formatNumber = (value: number): string => {
    return dataFormat === 'hex' ? `#${value.toString(16).padStart(2, '0').toUpperCase()}` : value.toString(10);
  };

  for (let i = 0; i < behaviorMapData.length; i += ASM_BYTES_PER_LINE) {
    const chunk = behaviorMapData.slice(i, i + ASM_BYTES_PER_LINE);
    const formattedChunk = chunk.map(formatNumber);
    asmString += `    DB ${formattedChunk.join(',')}\n`;
  }
  asmString += `\n;; End of Behavior Map Data for ${mapName}\n`;
  return asmString;
};

/**
 * Generates behavior map data from collision layer.
 * This uses the same logic as the Screen Editor's "Download ASM" button.
 * @param screenMapData The screen map data containing collision layer.
 * @param tileset Array of available tiles.
 * @returns Array of behavior map IDs.
 */
export const generateBehaviorMapData = (
  screenMapData: ScreenMap,
  tileset: Tile[]
): number[] => {
  const behaviorMapData: number[] = [];
  const activeCollisionLayer = screenMapData.layers.collision;

  for (let r = 0; r < (screenMapData.activeAreaHeight ?? screenMapData.height); r++) {
    const mapY = (screenMapData.activeAreaY ?? 0) + r;
    for (let c = 0; c < (screenMapData.activeAreaWidth ?? screenMapData.width); c++) {
      const mapX = (screenMapData.activeAreaX ?? 0) + c;
      const screenTile = activeCollisionLayer[mapY]?.[mapX];
      if (screenTile?.tileId) {
        const tileAsset = tileset.find(t => t.id === screenTile.tileId);
        behaviorMapData.push(tileAsset?.logicalProperties?.mapId ?? 0);
      } else {
        behaviorMapData.push(0);
      }
    }
  }

  return behaviorMapData;
};

/**
 * Compresses data using an optimized RLE (Run-Length Encoding) algorithm.
 * The format consists of literal and repetition packets.
 * - Literal packet: [count], [byte1], [byte2], ... (count is 1-127)
 * - Repetition packet: [0x80 | count], [byte] (count is 2-127)
 * @param uncompressedBytes The raw byte array to compress.
 * @returns A new array of bytes containing the RLE-compressed data.
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
 * Compresses screen map data using either the Pletter or SuperRLE algorithm.
 * This function first converts the tile-based screen map into a byte stream
 * based on tile part references, then applies the chosen compression algorithm.
 * @param backgroundLayer The screen layer data (2D array of ScreenTile) to compress.
 * @param tileset An array of all available tile assets in the project.
 * @param baseTileDim The base dimension of a single tile cell (e.g., 8 for Screen 2).
 * @param tileBanks An optional array of tile bank configurations, primarily for Screen 2 mode.
 * @param compressionType The compression algorithm to use, either 'pletter' or 'superRLE'.
 * @returns A SuperRLEExportData object containing the compressed data and metadata, or an error object.
 */
export const generateSuperRLEData = (
  backgroundLayer: ScreenLayerData,
  tileset: Tile[],
  baseTileDim: number,
  tileBanks: TileBankDefinition[] | undefined,
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
 * Performs a deep comparison of two tile objects to check for equality.
 * It compares dimensions, pixel data, line attributes, and logical properties.
 * @param tile1 The first tile object to compare.
 * @param tile2 The second tile object to compare.
 * @returns `true` if the tiles are identical in content, `false` otherwise.
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


/**
 * Creates a data URL for a specific part of a tile asset.
 * This is used to render individual tile cells in the UI.
 * @param fullTileAsset The full tile asset to extract the part from.
 * @param subTileXCoord The x-coordinate of the sub-tile within the full asset.
 * @param subTileYCoord The y-coordinate of the sub-tile within the full asset.
 * @param outputCellPixelWidth The desired output width in pixels.
 * @param outputCellPixelHeight The desired output height in pixels.
 * @param baseSliceDim The base dimension of a slice (e.g., 8 for Screen 2).
 * @param currentScreenMode The current MSX screen mode.
 * @returns A data URL string representing the rendered tile part.
 */
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

/**
 * Creates a data URL for a sprite frame.
 * @param spriteFrameData The pixel data for the sprite frame.
 * @param spriteWidth The width of the sprite.
 * @param spriteHeight The height of the sprite.
 * @returns A data URL string representing the rendered sprite frame.
 */
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

/**
 * Renders a full screen map to a canvas element.
 * @param canvas The HTMLCanvasElement to render to.
 * @param screenMap The screen map to render.
 * @param tileset An array of all available tile assets.
 * @param currentScreenMode The current MSX screen mode.
 * @param baseSliceDim The base dimension of a tile slice.
 * @param tileBanks Optional array of tile banks for SCREEN 2 mode.
 * @param allAssets Optional array of all project assets (needed to resolve font assets).
 */
export const renderScreenToCanvas = (
  canvas: HTMLCanvasElement,
  screenMap: ScreenMap,
  tileset: Tile[],
  currentScreenMode: string,
  baseSliceDim: number,
  tileBanks?: TileBank[],
  allAssets?: ProjectAsset[]
) => {
  const isScreen2 = isScreen2Mode(currentScreenMode);

  canvas.width = screenMap.width * baseSliceDim;
  canvas.height = screenMap.height * baseSliceDim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Use backgroundColor from screenMap if available, otherwise use default
  const defaultBg = getBackgroundColorHex(screenMap.backgroundColor, currentScreenMode);
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
