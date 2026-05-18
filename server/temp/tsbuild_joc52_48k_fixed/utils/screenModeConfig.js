"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackgroundColorHex = exports.isScreen5Mode = exports.isScreen2Mode = void 0;
exports.getScreenModeMetrics = getScreenModeMetrics;
const constants_1 = require("../constants");
const DEFAULT_EDITOR_BASE_TILE_DIM_OTHER = 16;
const SCREEN_2_LABEL = 'SCREEN 2 (Graphics I)';
const SCREEN_5_LABEL = 'SCREEN 5 (Graphics III)';
const BASE_TILE_SIZE = 8;
const DEFAULT_METRICS = {
    pixelWidth: constants_1.DEFAULT_SCREEN_WIDTH_TILES * DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
    pixelHeight: constants_1.DEFAULT_SCREEN_HEIGHT_TILES * DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
    widthTiles: constants_1.DEFAULT_SCREEN_WIDTH_TILES,
    heightTiles: constants_1.DEFAULT_SCREEN_HEIGHT_TILES,
    baseTileSize: DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
};
const SCREEN_MODE_CONFIG = {
    [SCREEN_2_LABEL]: {
        pixelWidth: constants_1.DEFAULT_SCREEN_WIDTH_TILES * constants_1.EDITOR_BASE_TILE_DIM_S2,
        pixelHeight: constants_1.DEFAULT_SCREEN_HEIGHT_TILES * constants_1.EDITOR_BASE_TILE_DIM_S2,
        widthTiles: constants_1.DEFAULT_SCREEN_WIDTH_TILES,
        heightTiles: constants_1.DEFAULT_SCREEN_HEIGHT_TILES,
        baseTileSize: constants_1.EDITOR_BASE_TILE_DIM_S2,
    },
    [SCREEN_5_LABEL]: {
        pixelWidth: 256,
        pixelHeight: 212,
        widthTiles: 32,
        heightTiles: 27,
        baseTileSize: constants_1.EDITOR_BASE_TILE_DIM_S2,
    },
    'SCREEN 0 (Text 40)': {
        pixelWidth: 240,
        pixelHeight: 192,
        widthTiles: 40,
        heightTiles: 24,
        baseTileSize: BASE_TILE_SIZE,
    },
    'SCREEN 1 (Text 32)': {
        pixelWidth: 256,
        pixelHeight: 192,
        widthTiles: 32,
        heightTiles: 24,
        baseTileSize: BASE_TILE_SIZE,
    },
    'SCREEN 3 (Multicolor)': {
        pixelWidth: 256,
        pixelHeight: 192,
        widthTiles: 32,
        heightTiles: 24,
        baseTileSize: BASE_TILE_SIZE,
    },
    'SCREEN 4 (Graphics II)': {
        pixelWidth: 256,
        pixelHeight: 192,
        widthTiles: 32,
        heightTiles: 24,
        baseTileSize: BASE_TILE_SIZE,
    },
    'SCREEN 6 (Graphics IV)': {
        pixelWidth: 512,
        pixelHeight: 212,
        widthTiles: 64,
        heightTiles: 27,
        baseTileSize: BASE_TILE_SIZE,
    },
    'SCREEN 7 (Graphics V)': {
        pixelWidth: 512,
        pixelHeight: 212,
        widthTiles: 64,
        heightTiles: 27,
        baseTileSize: BASE_TILE_SIZE,
    },
    'SCREEN 8 (Graphics VI)': {
        pixelWidth: 256,
        pixelHeight: 212,
        widthTiles: 32,
        heightTiles: 27,
        baseTileSize: BASE_TILE_SIZE,
    },
};
/**
 * Returns the metrics for the requested screen mode. Falls back to defaults for unsupported modes.
 */
function getScreenModeMetrics(mode) {
    const normalizedMode = typeof mode === 'string' ? mode.trim() : '';
    if (normalizedMode && SCREEN_MODE_CONFIG[normalizedMode]) {
        return SCREEN_MODE_CONFIG[normalizedMode];
    }
    return DEFAULT_METRICS;
}
const isScreen2Mode = (screenMode) => screenMode === SCREEN_2_LABEL;
exports.isScreen2Mode = isScreen2Mode;
const isScreen5Mode = (screenMode) => screenMode === SCREEN_5_LABEL;
exports.isScreen5Mode = isScreen5Mode;
const getPaletteForMode = (screenMode) => (0, exports.isScreen2Mode)(screenMode) ? constants_1.MSX1_PALETTE : constants_1.MSX_SCREEN5_PALETTE;
const getBackgroundColorHex = (colorIndex, screenMode) => {
    const palette = getPaletteForMode(screenMode);
    if (colorIndex === undefined || colorIndex < 0 || colorIndex >= palette.length) {
        return (0, exports.isScreen2Mode)(screenMode) ? constants_1.MSX1_PALETTE[1].hex : constants_1.MSX_SCREEN5_PALETTE[4].hex;
    }
    const entry = palette[colorIndex];
    return entry?.hex ?? ((0, exports.isScreen2Mode)(screenMode) ? constants_1.MSX1_PALETTE[1].hex : constants_1.MSX_SCREEN5_PALETTE[4].hex);
};
exports.getBackgroundColorHex = getBackgroundColorHex;
