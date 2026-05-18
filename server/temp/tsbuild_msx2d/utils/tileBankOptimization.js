"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTileAssignmentLabel = exports.buildTileCharSignature = exports.getTileCharPatternColorBytes = exports.resolveTileAssignmentCharCode = exports.getTileAssignmentCharCodes = exports.getTileLocalCharIndex = exports.getTileCharDimensions = exports.isAssignableScreen2TileCharCode = exports.SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE = exports.SCREEN2_EMPTY_CELL_CHAR_CODE = void 0;
const tileUtils_1 = require("../components/utils/tileUtils");
const EDITOR_BASE_TILE_DIM_S2 = 8;
exports.SCREEN2_EMPTY_CELL_CHAR_CODE = 255;
exports.SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE = 254;
const isAssignableScreen2TileCharCode = (charCode) => (Number.isFinite(charCode)
    && charCode >= 0
    && charCode <= exports.SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE);
exports.isAssignableScreen2TileCharCode = isAssignableScreen2TileCharCode;
const getTileCharDimensions = (tile) => {
    const widthInChars = Math.max(1, Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2));
    const heightInChars = Math.max(1, Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2));
    return { widthInChars, heightInChars, totalChars: widthInChars * heightInChars };
};
exports.getTileCharDimensions = getTileCharDimensions;
const getTileLocalCharIndex = (tile, subTileX = 0, subTileY = 0) => {
    const { widthInChars, heightInChars } = (0, exports.getTileCharDimensions)(tile);
    const x = Math.max(0, Math.min(widthInChars - 1, Math.floor(subTileX)));
    const y = Math.max(0, Math.min(heightInChars - 1, Math.floor(subTileY)));
    return y * widthInChars + x;
};
exports.getTileLocalCharIndex = getTileLocalCharIndex;
const getTileAssignmentCharCodes = (assignment, tile) => {
    if (!assignment || !tile)
        return [];
    if (Array.isArray(assignment.charMap) && assignment.charMap.length > 0) {
        return Array.from(new Set(assignment.charMap
            .map(code => Number(code))
            .filter(exports.isAssignableScreen2TileCharCode)));
    }
    const baseCharCode = Number(assignment.charCode);
    if (!Number.isFinite(baseCharCode))
        return [];
    const { totalChars } = (0, exports.getTileCharDimensions)(tile);
    return Array.from({ length: totalChars }, (_unused, index) => baseCharCode + index)
        .filter(exports.isAssignableScreen2TileCharCode);
};
exports.getTileAssignmentCharCodes = getTileAssignmentCharCodes;
const resolveTileAssignmentCharCode = (assignment, tile, subTileX = 0, subTileY = 0) => {
    if (!assignment || !tile)
        return undefined;
    const localIndex = (0, exports.getTileLocalCharIndex)(tile, subTileX, subTileY);
    const optimizedCharCode = Array.isArray(assignment.charMap) ? Number(assignment.charMap[localIndex]) : NaN;
    if (Number.isFinite(optimizedCharCode)) {
        return optimizedCharCode & 0xff;
    }
    const baseCharCode = Number(assignment.charCode);
    if (!Number.isFinite(baseCharCode))
        return undefined;
    return (baseCharCode + localIndex) & 0xff;
};
exports.resolveTileAssignmentCharCode = resolveTileAssignmentCharCode;
const getTileCharPatternColorBytes = (tile, charIndex) => {
    const patternBytes = Array.from((0, tileUtils_1.generateTilePatternBytes)(tile, 'SCREEN 2 (Graphics I)'));
    const colorData = (0, tileUtils_1.generateTileColorBytes)(tile);
    const colorBytes = colorData ? Array.from(colorData) : new Array(patternBytes.length).fill(0xf0);
    const offset = Math.max(0, Math.floor(charIndex)) * EDITOR_BASE_TILE_DIM_S2;
    return {
        patternBytes: patternBytes.slice(offset, offset + EDITOR_BASE_TILE_DIM_S2),
        colorBytes: colorBytes.slice(offset, offset + EDITOR_BASE_TILE_DIM_S2),
    };
};
exports.getTileCharPatternColorBytes = getTileCharPatternColorBytes;
const buildTileCharSignature = (tile, charIndex) => {
    const { widthInChars } = (0, exports.getTileCharDimensions)(tile);
    const charX = charIndex % widthInChars;
    const charY = Math.floor(charIndex / widthInChars);
    const { patternBytes, colorBytes } = (0, exports.getTileCharPatternColorBytes)(tile, charIndex);
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
exports.buildTileCharSignature = buildTileCharSignature;
const resolveTileAssignmentLabel = (assignment, tile) => {
    const { widthInChars, heightInChars, totalChars } = (0, exports.getTileCharDimensions)(tile);
    const uniqueCodes = (0, exports.getTileAssignmentCharCodes)(assignment, tile);
    if (assignment.optimized && Array.isArray(assignment.charMap)) {
        return `${uniqueCodes.length}/${totalChars} chars opt (${widthInChars}x${heightInChars})`;
    }
    return totalChars > 1 ? `${totalChars} chars (${widthInChars}x${heightInChars})` : '1 char';
};
exports.resolveTileAssignmentLabel = resolveTileAssignmentLabel;
