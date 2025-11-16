import {
  DEFAULT_SCREEN_HEIGHT_TILES,
  DEFAULT_SCREEN_WIDTH_TILES,
  EDITOR_BASE_TILE_DIM_S2,
  MSX1_PALETTE,
  MSX_SCREEN5_PALETTE,
} from '../constants';
import { MSXColor } from '../types';

/**
 * Describes the grid and pixel characteristics for an MSX screen mode.
 */
export interface ScreenModeMetrics {
  /** Total columns available to the editor. */
  widthTiles: number;
  /** Total rows available to the editor. */
  heightTiles: number;
  /** Base pixel dimension for a single tile/cell. */
  baseTileSize: number;
  /** Hardware pixel width. */
  pixelWidth: number;
  /** Hardware pixel height. */
  pixelHeight: number;
}

const DEFAULT_EDITOR_BASE_TILE_DIM_OTHER = 16;
const SCREEN_2_LABEL = 'SCREEN 2 (Graphics I)';
const SCREEN_5_LABEL = 'SCREEN 5 (Graphics III)';

const SCREEN_MODE_METRICS: Record<string, ScreenModeMetrics> = {
  [SCREEN_2_LABEL]: {
    widthTiles: DEFAULT_SCREEN_WIDTH_TILES,
    heightTiles: DEFAULT_SCREEN_HEIGHT_TILES,
    baseTileSize: EDITOR_BASE_TILE_DIM_S2,
    pixelWidth: DEFAULT_SCREEN_WIDTH_TILES * EDITOR_BASE_TILE_DIM_S2,
    pixelHeight: DEFAULT_SCREEN_HEIGHT_TILES * EDITOR_BASE_TILE_DIM_S2,
  },
  [SCREEN_5_LABEL]: {
    widthTiles: 32,
    heightTiles: 26,
    baseTileSize: EDITOR_BASE_TILE_DIM_S2,
    pixelWidth: 256,
    pixelHeight: 212,
  },
};

const DEFAULT_METRICS: ScreenModeMetrics = {
  widthTiles: DEFAULT_SCREEN_WIDTH_TILES,
  heightTiles: DEFAULT_SCREEN_HEIGHT_TILES,
  baseTileSize: DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
  pixelWidth: DEFAULT_SCREEN_WIDTH_TILES * DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
  pixelHeight: DEFAULT_SCREEN_HEIGHT_TILES * DEFAULT_EDITOR_BASE_TILE_DIM_OTHER,
};

/**
 * Returns the metrics for the requested screen mode. Falls back to defaults for unsupported modes.
 */
export const getScreenModeMetrics = (screenMode: string): ScreenModeMetrics =>
  SCREEN_MODE_METRICS[screenMode] ?? DEFAULT_METRICS;

export const isScreen2Mode = (screenMode: string): boolean => screenMode === SCREEN_2_LABEL;
export const isScreen5Mode = (screenMode: string): boolean => screenMode === SCREEN_5_LABEL;

const getPaletteForMode = (screenMode: string) =>
  isScreen2Mode(screenMode) ? MSX1_PALETTE : MSX_SCREEN5_PALETTE;

export const getBackgroundColorHex = (colorIndex: number | undefined, screenMode: string): string => {
  const palette = getPaletteForMode(screenMode);
  if (colorIndex === undefined || colorIndex < 0 || colorIndex >= palette.length) {
    return isScreen2Mode(screenMode) ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[4].hex;
  }
  const entry: { hex: string } | undefined = palette[colorIndex] as MSXColor | undefined;
  return entry?.hex ?? (isScreen2Mode(screenMode) ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[4].hex);
};
