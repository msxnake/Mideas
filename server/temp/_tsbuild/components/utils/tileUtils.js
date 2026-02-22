"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTileColorBytes = exports.mirrorTileDataVertical = exports.mirrorTileDataHorizontal = exports.shiftTileDataRight = exports.shiftTileDataLeft = exports.shiftTileDataDown = exports.shiftTileDataUp = exports.generateTilePatternBytes = exports.createDefaultLineAttributes = exports.generateTileASMCode = void 0;
const constants_1 = require("../../constants");
const EDITOR_BASE_TILE_DIM_S2 = 8;
// Helper function to ensure two-digit uppercase hex representation
const toHexByte = (num) => {
    let hex = num.toString(16).toUpperCase();
    if (hex.length === 1) {
        hex = '0' + hex;
    }
    return hex;
};
/**
 * Generates assembly code for a single SCREEN 2 tile.
 * The generated code includes pattern and color attribute data, formatted for use in an assembler.
 * @param tile The tile object to generate code for.
 * @param tileName The name to use for labels in the assembly code.
 * @param dataFormat The format for numerical output ('hex' or 'decimal').
 * @returns A string containing the generated assembly code.
 */
const generateTileASMCode = (tile, tileName, dataFormat) => {
    var _a, _b, _c, _d;
    if (!tile.lineAttributes) {
        return `;; ERROR: Tile ${tileName} is missing line attributes required for SCREEN 2 export.\n`;
    }
    const safeTileName = tileName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    let output = `;; Tile: ${tileName} (${tile.width}x${tile.height})\n`;
    output += `;; Structure: ${tile.width / EDITOR_BASE_TILE_DIM_S2}x${tile.height / EDITOR_BASE_TILE_DIM_S2} character blocks (8x8 pixels each)\n`;
    output += `;; Data format: ${dataFormat.toUpperCase()}\n\n`;
    const numCharBlocksX = tile.width / EDITOR_BASE_TILE_DIM_S2;
    const numCharBlocksY = tile.height / EDITOR_BASE_TILE_DIM_S2;
    const formatNumber = (value) => {
        return dataFormat === 'hex' ? `$${toHexByte(value)}` : value.toString(10);
    };
    const patternDataLines = [];
    const colorDataLines = [];
    for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
        for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
            const blockComment = `;; Character Block (${cbX}, ${cbY}) for ${safeTileName}`;
            // Generate Pattern Data for this block
            const blockPatternBytes = [];
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
            const blockColorBytes = [];
            for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
                const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
                let colorByte = (constants_1.DEFAULT_SCREEN2_FG_COLOR_INDEX << 4) | constants_1.DEFAULT_SCREEN2_BG_COLOR_INDEX;
                if (tile.lineAttributes[currentTileRow] && tile.lineAttributes[currentTileRow][cbX]) {
                    const attrPair = tile.lineAttributes[currentTileRow][cbX];
                    const fgIdx = (_b = (_a = constants_1.MSX1_PALETTE_MAP.get(attrPair.fg)) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : constants_1.DEFAULT_SCREEN2_FG_COLOR_INDEX;
                    const bgIdx = (_d = (_c = constants_1.MSX1_PALETTE_MAP.get(attrPair.bg)) === null || _c === void 0 ? void 0 : _c.index) !== null && _d !== void 0 ? _d : constants_1.DEFAULT_SCREEN2_BG_COLOR_INDEX;
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
    }
    else {
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
    }
    else {
        output += `;; No color attribute data generated.\n`;
    }
    output += `\n;; End of Tile Data for ${safeTileName}\n`;
    return output;
};
exports.generateTileASMCode = generateTileASMCode;
/**
 * Creates a default set of line color attributes for a tile in SCREEN 2 mode.
 * Each row is divided into segments, and each segment gets the specified default colors.
 * @param tileWidth The width of the tile in pixels.
 * @param tileHeight The height of the tile in pixels.
 * @param fgColor The default foreground color to apply.
 * @param bgColor The default background color to apply.
 * @returns A 2D array of LineColorAttribute objects representing the default color attributes.
 */
const createDefaultLineAttributes = (tileWidth, tileHeight, fgColor, bgColor) => {
    const numSegmentsPerRow = Math.max(1, tileWidth / constants_1.SCREEN2_PIXELS_PER_COLOR_SEGMENT);
    return Array(tileHeight).fill(null).map(() => Array(numSegmentsPerRow).fill(null).map(() => ({ fg: fgColor, bg: bgColor })));
};
exports.createDefaultLineAttributes = createDefaultLineAttributes;
/**
 * Generates a raw byte array for a tile's pattern data.
 * The method of determining "on" pixels depends on the screen mode.
 * In SCREEN 2, it's based on the foreground color of the line attribute.
 * In other modes, any non-transparent pixel is considered "on".
 * @param tile The tile to generate pattern data for.
 * @param currentScreenMode The current MSX screen mode.
 * @returns A Uint8Array containing the raw pattern data.
 */
const generateTilePatternBytes = (tile, currentScreenMode) => {
    var _a, _b, _c, _d;
    const bytes = [];
    const numCharBlocksX = tile.width / EDITOR_BASE_TILE_DIM_S2;
    const numCharBlocksY = tile.height / EDITOR_BASE_TILE_DIM_S2;
    const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
    for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
        for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
            for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
                const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
                let patternByte = 0;
                let fgColorForSegment;
                if (isScreen2 && tile.lineAttributes && tile.lineAttributes[currentTileRow] && tile.lineAttributes[currentTileRow][cbX]) {
                    fgColorForSegment = tile.lineAttributes[currentTileRow][cbX].fg;
                }
                for (let pixelInBlock = 0; pixelInBlock < EDITOR_BASE_TILE_DIM_S2; pixelInBlock++) {
                    const currentTileCol = cbX * EDITOR_BASE_TILE_DIM_S2 + pixelInBlock;
                    const pixelColor = (_a = tile.data[currentTileRow]) === null || _a === void 0 ? void 0 : _a[currentTileCol];
                    if (pixelColor !== undefined) {
                        let isPixelOn = false;
                        if (isScreen2 && fgColorForSegment) {
                            isPixelOn = (pixelColor === fgColorForSegment);
                        }
                        else if (!isScreen2) {
                            // For non-Screen 2, consider any non-transparent pixel as "on"
                            // This is a simplification; real non-Screen 2 modes have different color mechanisms.
                            // MSX_SCREEN5_PALETTE[0].hex is 'rgba(0,0,0,0)' (transparent)
                            isPixelOn = (pixelColor !== constants_1.MSX_SCREEN5_PALETTE[0].hex && pixelColor !== ((_d = (_c = (_b = tile.lineAttributes) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.bg)); // A very basic check
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
exports.generateTilePatternBytes = generateTilePatternBytes;
/**
 * Corrects any pixels in a data grid that are not valid for their segment in SCREEN 2 mode.
 * Invalid pixels are "snapped" to the foreground color of their segment.
 * This is an internal helper function.
 * @param pixelData The pixel data to correct.
 * @param lineAttributes The line color attributes to validate against.
 * @returns A new PixelData grid with corrected colors.
 */
const correctInvalidPixelsForScreen2 = (pixelData, lineAttributes) => {
    var _a, _b;
    const height = pixelData.length;
    if (height === 0)
        return [];
    const width = ((_a = pixelData[0]) === null || _a === void 0 ? void 0 : _a.length) || 0;
    if (width === 0)
        return [[]];
    const correctedData = pixelData.map(row => [...row]);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const segmentIndex = Math.floor(x / constants_1.SCREEN2_PIXELS_PER_COLOR_SEGMENT);
            const attributes = (_b = lineAttributes[y]) === null || _b === void 0 ? void 0 : _b[segmentIndex];
            const currentColor = correctedData[y][x];
            if (attributes && currentColor !== attributes.fg && currentColor !== attributes.bg) {
                // This pixel's color is invalid for its new segment.
                // Snap it to the foreground color of the new segment.
                correctedData[y][x] = attributes.fg;
            }
        }
    }
    return correctedData;
};
/**
 * Rolls the tile's pixel data up by one pixel.
 * The top row is moved to the bottom. For SCREEN 2, pixel colors are corrected if they become invalid in their new position.
 * @param tileData The pixel data to shift.
 * @param lineAttributes The line color attributes, used for SCREEN 2 color correction.
 * @param screenMode The current MSX screen mode.
 * @returns The shifted pixel data.
 */
const shiftTileDataUp = (tileData, lineAttributes, screenMode) => {
    const height = tileData.length;
    if (height < 2)
        return tileData;
    const rolledData = tileData.slice(1);
    rolledData.push([...tileData[0]]);
    if (screenMode === "SCREEN 2 (Graphics I)" && lineAttributes) {
        return correctInvalidPixelsForScreen2(rolledData, lineAttributes);
    }
    return rolledData;
};
exports.shiftTileDataUp = shiftTileDataUp;
/**
 * Rolls the tile's pixel data down by one pixel.
 * The bottom row is moved to the top. For SCREEN 2, pixel colors are corrected if they become invalid in their new position.
 * @param tileData The pixel data to shift.
 * @param lineAttributes The line color attributes, used for SCREEN 2 color correction.
 * @param screenMode The current MSX screen mode.
 * @returns The shifted pixel data.
 */
const shiftTileDataDown = (tileData, lineAttributes, screenMode) => {
    const height = tileData.length;
    if (height < 2)
        return tileData;
    const rolledData = tileData.slice(0, height - 1);
    rolledData.unshift([...tileData[height - 1]]);
    if (screenMode === "SCREEN 2 (Graphics I)" && lineAttributes) {
        return correctInvalidPixelsForScreen2(rolledData, lineAttributes);
    }
    return rolledData;
};
exports.shiftTileDataDown = shiftTileDataDown;
/**
 * Rolls the tile's pixel data left by one pixel.
 * The leftmost column is moved to the right. For SCREEN 2, pixel colors are corrected if they become invalid in their new position.
 * @param tileData The pixel data to shift.
 * @param lineAttributes The line color attributes, used for SCREEN 2 color correction.
 * @param screenMode The current MSX screen mode.
 * @returns The shifted pixel data.
 */
const shiftTileDataLeft = (tileData, lineAttributes, screenMode) => {
    if (tileData.length === 0)
        return [];
    const rolledData = tileData.map(row => {
        if (row.length < 2)
            return [...row];
        const newRow = row.slice(1);
        newRow.push(row[0]);
        return newRow;
    });
    if (screenMode === "SCREEN 2 (Graphics I)" && lineAttributes) {
        return correctInvalidPixelsForScreen2(rolledData, lineAttributes);
    }
    return rolledData;
};
exports.shiftTileDataLeft = shiftTileDataLeft;
/**
 * Rolls the tile's pixel data right by one pixel.
 * The rightmost column is moved to the left. For SCREEN 2, pixel colors are corrected if they become invalid in their new position.
 * @param tileData The pixel data to shift.
 * @param lineAttributes The line color attributes, used for SCREEN 2 color correction.
 * @param screenMode The current MSX screen mode.
 * @returns The shifted pixel data.
 */
const shiftTileDataRight = (tileData, lineAttributes, screenMode) => {
    if (tileData.length === 0)
        return [];
    const rolledData = tileData.map(row => {
        const width = row.length;
        if (width < 2)
            return [...row];
        const newRow = row.slice(0, width - 1);
        newRow.unshift(row[width - 1]);
        return newRow;
    });
    if (screenMode === "SCREEN 2 (Graphics I)" && lineAttributes) {
        return correctInvalidPixelsForScreen2(rolledData, lineAttributes);
    }
    return rolledData;
};
exports.shiftTileDataRight = shiftTileDataRight;
/**
 * Mirrors the tile's pixel data horizontally (left to right).
 * For SCREEN 2, pixel colors are corrected if they become invalid in their new position.
 * @param tileData The pixel data to mirror.
 * @param lineAttributes The line color attributes, used for SCREEN 2 color correction.
 * @param screenMode The current MSX screen mode.
 * @returns The mirrored pixel data.
 */
const mirrorTileDataHorizontal = (tileData, lineAttributes, screenMode) => {
    if (tileData.length === 0)
        return [];
    const mirroredData = tileData.map(row => [...row].reverse());
    if (screenMode === "SCREEN 2 (Graphics I)" && lineAttributes) {
        return correctInvalidPixelsForScreen2(mirroredData, lineAttributes);
    }
    return mirroredData;
};
exports.mirrorTileDataHorizontal = mirrorTileDataHorizontal;
/**
 * Mirrors the tile's pixel data vertically (top to bottom).
 * For SCREEN 2, pixel colors are corrected if they become invalid in their new position.
 * @param tileData The pixel data to mirror.
 * @param lineAttributes The line color attributes, used for SCREEN 2 color correction.
 * @param screenMode The current MSX screen mode.
 * @returns The mirrored pixel data.
 */
const mirrorTileDataVertical = (tileData, lineAttributes, screenMode) => {
    if (tileData.length === 0)
        return [];
    const mirroredData = [...tileData].reverse();
    if (screenMode === "SCREEN 2 (Graphics I)" && lineAttributes) {
        return correctInvalidPixelsForScreen2(mirroredData, lineAttributes);
    }
    return mirroredData;
};
exports.mirrorTileDataVertical = mirrorTileDataVertical;
/**
 * Generates a raw byte array for a tile's color attribute data (SCREEN 2 only).
 * Each byte represents the foreground and background color for an 8-pixel segment of a row.
 * @param tile The tile to generate color data for.
 * @returns A Uint8Array containing the raw color attribute data, or null if the tile has no line attributes.
 */
const generateTileColorBytes = (tile) => {
    var _a, _b, _c, _d, _e;
    if (!tile.lineAttributes)
        return null;
    const bytes = [];
    const numCharBlocksX = tile.width / EDITOR_BASE_TILE_DIM_S2;
    const numCharBlocksY = tile.height / EDITOR_BASE_TILE_DIM_S2;
    for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
        for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
            for (let r = 0; r < EDITOR_BASE_TILE_DIM_S2; r++) {
                const currentTileRow = cbY * EDITOR_BASE_TILE_DIM_S2 + r;
                let colorByte = (constants_1.DEFAULT_SCREEN2_FG_COLOR_INDEX << 4) | constants_1.DEFAULT_SCREEN2_BG_COLOR_INDEX;
                const attrPair = (_a = tile.lineAttributes[currentTileRow]) === null || _a === void 0 ? void 0 : _a[cbX];
                if (attrPair) {
                    const fgIdx = (_c = (_b = constants_1.MSX1_PALETTE_MAP.get(attrPair.fg)) === null || _b === void 0 ? void 0 : _b.index) !== null && _c !== void 0 ? _c : constants_1.DEFAULT_SCREEN2_FG_COLOR_INDEX;
                    const bgIdx = (_e = (_d = constants_1.MSX1_PALETTE_MAP.get(attrPair.bg)) === null || _d === void 0 ? void 0 : _d.index) !== null && _e !== void 0 ? _e : constants_1.DEFAULT_SCREEN2_BG_COLOR_INDEX;
                    colorByte = (fgIdx << 4) | bgIdx;
                }
                bytes.push(colorByte);
            }
        }
    }
    return new Uint8Array(bytes);
};
exports.generateTileColorBytes = generateTileColorBytes;
