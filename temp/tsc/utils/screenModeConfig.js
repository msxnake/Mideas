import { DEFAULT_SCREEN_HEIGHT_TILES, DEFAULT_SCREEN_WIDTH_TILES, EDITOR_BASE_TILE_DIM_S2, MSX1_PALETTE, MSX_SCREEN5_PALETTE, } from '../constants';
const DEFAULT_EDITOR_BASE_TILE_DIM_OTHER = 16;
const SCREEN_2_LABEL = 'SCREEN 2 (Graphics I)';
const SCREEN_5_LABEL = 'SCREEN 5 (Graphics III)';
const BASE_TILE_SIZE = 8;
const DEFAULT_METRICS = {
    pixelWidth: DEFAULT_SCREEN_WIDTH_TILES * DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
    pixelHeight: DEFAULT_SCREEN_HEIGHT_TILES * DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
    widthTiles: DEFAULT_SCREEN_WIDTH_TILES,
    heightTiles: DEFAULT_SCREEN_HEIGHT_TILES,
    baseTileSize: DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
};
const SCREEN_MODE_CONFIG = {
    [SCREEN_2_LABEL]: {
        pixelWidth: DEFAULT_SCREEN_WIDTH_TILES * EDITOR_BASE_TILE_DIM_S2,
        pixelHeight: DEFAULT_SCREEN_HEIGHT_TILES * EDITOR_BASE_TILE_DIM_S2,
        widthTiles: DEFAULT_SCREEN_WIDTH_TILES,
        heightTiles: DEFAULT_SCREEN_HEIGHT_TILES,
        baseTileSize: EDITOR_BASE_TILE_DIM_S2,
    },
    [SCREEN_5_LABEL]: {
        pixelWidth: 256,
        pixelHeight: 212,
        widthTiles: 32,
        heightTiles: 27,
        baseTileSize: EDITOR_BASE_TILE_DIM_S2,
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
export function getScreenModeMetrics(mode) {
    const normalizedMode = typeof mode === 'string' ? mode.trim() : '';
    if (normalizedMode && SCREEN_MODE_CONFIG[normalizedMode]) {
        return SCREEN_MODE_CONFIG[normalizedMode];
    }
    return DEFAULT_METRICS;
}
export const isScreen2Mode = (screenMode) => screenMode === SCREEN_2_LABEL;
export const isScreen5Mode = (screenMode) => screenMode === SCREEN_5_LABEL;
const getPaletteForMode = (screenMode) => isScreen2Mode(screenMode) ? MSX1_PALETTE : MSX_SCREEN5_PALETTE;
export const getBackgroundColorHex = (colorIndex, screenMode) => {
    const palette = getPaletteForMode(screenMode);
    if (colorIndex === undefined || colorIndex < 0 || colorIndex >= palette.length) {
        return isScreen2Mode(screenMode) ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[4].hex;
    }
    const entry = palette[colorIndex];
    return entry?.hex ?? (isScreen2Mode(screenMode) ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[4].hex);
};
