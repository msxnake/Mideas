import { DEFAULT_SCREEN_HEIGHT_TILES, DEFAULT_SCREEN_WIDTH_TILES } from '../constants';

/**
 * Basic metrics that describe how a given MSX screen mode should be rendered inside editors/previews.
 */
export interface ScreenModeMetrics {
  /** Total pixel width of the drawable area. */
  widthPixels: number;
  /** Total pixel height of the drawable area. */
  heightPixels: number;
  /** Default tile width (in tiles) to use if a map does not provide dimensions. */
  widthTiles: number;
  /** Default tile height (in tiles) to use if a map does not provide dimensions. */
  heightTiles: number;
  /** Base tile size in pixels (assumed square for editor grids). */
  baseTileSize: number;
}

const BASE_TILE_SIZE = 8;

const DEFAULT_SCREEN_MODE_METRICS: ScreenModeMetrics = {
  widthPixels: DEFAULT_SCREEN_WIDTH_TILES * BASE_TILE_SIZE,
  heightPixels: DEFAULT_SCREEN_HEIGHT_TILES * BASE_TILE_SIZE,
  widthTiles: DEFAULT_SCREEN_WIDTH_TILES,
  heightTiles: DEFAULT_SCREEN_HEIGHT_TILES,
  baseTileSize: BASE_TILE_SIZE,
};

const SCREEN_MODE_CONFIG: Record<string, ScreenModeMetrics> = {
  'SCREEN 0 (Text 40)': {
    widthPixels: 240,
    heightPixels: 192,
    widthTiles: 40,
    heightTiles: 24,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 1 (Text 32)': {
    widthPixels: 256,
    heightPixels: 192,
    widthTiles: 32,
    heightTiles: 24,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 2 (Graphics I)': {
    widthPixels: 256,
    heightPixels: 192,
    widthTiles: 32,
    heightTiles: 24,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 3 (Multicolor)': {
    widthPixels: 256,
    heightPixels: 192,
    widthTiles: 32,
    heightTiles: 24,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 4 (Graphics II)': {
    widthPixels: 256,
    heightPixels: 192,
    widthTiles: 32,
    heightTiles: 24,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 5 (Graphics III)': {
    widthPixels: 256,
    heightPixels: 212,
    widthTiles: 32,
    heightTiles: 27,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 6 (Graphics IV)': {
    widthPixels: 512,
    heightPixels: 212,
    widthTiles: 64,
    heightTiles: 27,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 7 (Graphics V)': {
    widthPixels: 512,
    heightPixels: 212,
    widthTiles: 64,
    heightTiles: 27,
    baseTileSize: BASE_TILE_SIZE,
  },
  'SCREEN 8 (Graphics VI)': {
    widthPixels: 256,
    heightPixels: 212,
    widthTiles: 32,
    heightTiles: 27,
    baseTileSize: BASE_TILE_SIZE,
  },
};

/**
 * Returns screen metrics for the provided mode label. Falls back to default editor dimensions when unknown.
 */
export function getScreenModeMetrics(mode: string | null | undefined): ScreenModeMetrics {
  const normalizedMode = typeof mode === 'string' ? mode.trim() : '';
  if (normalizedMode && SCREEN_MODE_CONFIG[normalizedMode]) {
    return SCREEN_MODE_CONFIG[normalizedMode];
  }
  return DEFAULT_SCREEN_MODE_METRICS;
}
