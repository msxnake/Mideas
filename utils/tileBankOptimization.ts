import { Tile, TileBankDefinition, TileBankTileAssignment } from '../types';
import { generateTileColorBytes, generateTilePatternBytes } from '../components/utils/tileUtils';

const EDITOR_BASE_TILE_DIM_S2 = 8;
export const SCREEN2_EMPTY_CELL_CHAR_CODE = 255;
export const SCREEN2_TRANSITION_BOX_CHAR_CODE = 254;
export const SCREEN2_MIN_ASSIGNABLE_TILE_CHAR_CODE = 1;
export const SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE = 253;

export const isAssignableScreen2TileCharCode = (charCode: number): boolean => (
  Number.isFinite(charCode)
  && charCode >= SCREEN2_MIN_ASSIGNABLE_TILE_CHAR_CODE
  && charCode <= SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE
);

export interface Screen2CharRange {
  start: number;
  end: number;
}

export const getPreferredScreen2AssignableCharRanges = (
  charsetRangeStart: number,
  charsetRangeEnd: number
): Screen2CharRange[] => {
  const startValue = Number(charsetRangeStart);
  const endValue = Number(charsetRangeEnd);
  const requestedStart = Number.isFinite(startValue) ? Math.floor(startValue) : SCREEN2_MIN_ASSIGNABLE_TILE_CHAR_CODE;
  const requestedEnd = Number.isFinite(endValue) ? Math.floor(endValue) : SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE;
  const rangeStart = Math.max(SCREEN2_MIN_ASSIGNABLE_TILE_CHAR_CODE, requestedStart);
  const rangeEnd = Math.min(SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE, requestedEnd);
  const rangesToTry: Screen2CharRange[] = [];

  if (rangeStart > rangeEnd) return rangesToTry;

  const highStart = Math.max(rangeStart, 128);
  if (highStart <= rangeEnd) rangesToTry.push({ start: highStart, end: rangeEnd });

  if (rangeStart < 128) {
    const lowEnd = Math.min(rangeEnd, 127);
    if (rangeStart <= lowEnd) rangesToTry.push({ start: rangeStart, end: lowEnd });
  }

  return rangesToTry;
};

export const findAvailableScreen2CharBlock = (
  charsetRangeStart: number,
  charsetRangeEnd: number,
  usedCharCodes: Set<number>,
  blockSize: number
): number => {
  const size = Math.max(1, Math.floor(Number(blockSize) || 1));

  for (const range of getPreferredScreen2AssignableCharRanges(charsetRangeStart, charsetRangeEnd)) {
    const lastStart = range.end - size + 1;
    for (let start = range.start; start <= lastStart; start++) {
      let fits = true;
      for (let offset = 0; offset < size; offset++) {
        const charCode = start + offset;
        if (!isAssignableScreen2TileCharCode(charCode) || usedCharCodes.has(charCode)) {
          fits = false;
          break;
        }
      }
      if (fits) return start;
    }
  }

  return -1;
};

export const getTileCharDimensions = (tile: Tile): { widthInChars: number; heightInChars: number; totalChars: number } => {
  const widthInChars = Math.max(1, Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2));
  const heightInChars = Math.max(1, Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2));
  return { widthInChars, heightInChars, totalChars: widthInChars * heightInChars };
};

export const getTileLocalCharIndex = (tile: Tile, subTileX = 0, subTileY = 0): number => {
  const { widthInChars, heightInChars } = getTileCharDimensions(tile);
  const x = Math.max(0, Math.min(widthInChars - 1, Math.floor(subTileX)));
  const y = Math.max(0, Math.min(heightInChars - 1, Math.floor(subTileY)));
  return y * widthInChars + x;
};

export const getTileAssignmentCharCodes = (
  assignment: TileBankTileAssignment | undefined,
  tile: Tile | undefined
): number[] => {
  if (!assignment || !tile) return [];
  if (Array.isArray(assignment.charMap) && assignment.charMap.length > 0) {
    return Array.from(new Set(
      assignment.charMap
        .map(code => Number(code))
        .filter(isAssignableScreen2TileCharCode)
    ));
  }

  const baseCharCode = Number(assignment.charCode);
  if (!Number.isFinite(baseCharCode)) return [];

  const { totalChars } = getTileCharDimensions(tile);
  return Array.from({ length: totalChars }, (_unused, index) => baseCharCode + index)
    .filter(isAssignableScreen2TileCharCode);
};

export const resolveTileAssignmentCharCode = (
  assignment: TileBankTileAssignment | undefined,
  tile: Tile | undefined,
  subTileX = 0,
  subTileY = 0
): number | undefined => {
  if (!assignment || !tile) return undefined;
  const localIndex = getTileLocalCharIndex(tile, subTileX, subTileY);
  const optimizedCharCode = Array.isArray(assignment.charMap) ? Number(assignment.charMap[localIndex]) : NaN;
  if (isAssignableScreen2TileCharCode(optimizedCharCode)) {
    return optimizedCharCode;
  }

  const baseCharCode = Number(assignment.charCode);
  if (!Number.isFinite(baseCharCode)) return undefined;
  const resolvedCharCode = baseCharCode + localIndex;
  return isAssignableScreen2TileCharCode(resolvedCharCode) ? resolvedCharCode : undefined;
};

export const getTileCharPatternColorBytes = (
  tile: Tile,
  charIndex: number
): { patternBytes: number[]; colorBytes: number[] } => {
  const patternBytes = Array.from(generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)'));
  const colorData = generateTileColorBytes(tile);
  const colorBytes = colorData ? Array.from(colorData) : new Array(patternBytes.length).fill(0xf0);
  const offset = Math.max(0, Math.floor(charIndex)) * EDITOR_BASE_TILE_DIM_S2;
  return {
    patternBytes: patternBytes.slice(offset, offset + EDITOR_BASE_TILE_DIM_S2),
    colorBytes: colorBytes.slice(offset, offset + EDITOR_BASE_TILE_DIM_S2),
  };
};

export const buildTileCharSignature = (
  tile: Tile,
  charIndex: number
): { signature: string; isEmpty: boolean; patternBytes: number[]; colorBytes: number[] } => {
  const { widthInChars } = getTileCharDimensions(tile);
  const charX = charIndex % widthInChars;
  const charY = Math.floor(charIndex / widthInChars);
  const { patternBytes, colorBytes } = getTileCharPatternColorBytes(tile, charIndex);
  const logicalProperties = tile.charLogicalProperties?.[`${charX},${charY}`] || tile.logicalProperties;
  const isEmpty = patternBytes.length === EDITOR_BASE_TILE_DIM_S2 && patternBytes.every(byte => byte === 0);

  return {
    signature: JSON.stringify({
      pattern: patternBytes,
      color: colorBytes,
      logical: logicalProperties || null,
    }),
    isEmpty,
    patternBytes,
    colorBytes,
  };
};

export const resolveTileAssignmentLabel = (
  assignment: TileBankTileAssignment,
  tile: Tile
): string => {
  const { widthInChars, heightInChars, totalChars } = getTileCharDimensions(tile);
  const uniqueCodes = getTileAssignmentCharCodes(assignment, tile);
  if (assignment.optimized && Array.isArray(assignment.charMap)) {
    return `${uniqueCodes.length}/${totalChars} chars opt (${widthInChars}x${heightInChars})`;
  }
  return totalChars > 1 ? `${totalChars} chars (${widthInChars}x${heightInChars})` : '1 char';
};
