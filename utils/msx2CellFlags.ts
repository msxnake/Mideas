import { Msx2Screen4TileScreen } from '../types';
import { getMsx2TileBehaviorKind } from './msx2Screen4TileBehavior';

export const MSX2_CELL_SOLID = 0x01;
export const MSX2_CELL_EFFECT_MASK = 0x06;
export const MSX2_CELL_EFFECT_SHIFT = 1;
export const MSX2_CELL_BEHAVIOR_MASK = 0x38;
export const MSX2_CELL_BEHAVIOR_SHIFT = 3;
export const MSX2_CELL_ZONE_MASK = 0xc0;

export const MSX2_CELL_EFFECT_NONE = 0;
export const MSX2_CELL_EFFECT_HAZARD = 1;
export const MSX2_CELL_EFFECT_EXIT = 2;
export const MSX2_CELL_EFFECT_COLLECTIBLE = 3;

export const MSX2_CELL_BEHAVIOR_NONE = 0;
export const MSX2_CELL_BEHAVIOR_LADDER = 1;
export const MSX2_CELL_BEHAVIOR_CONVEYOR_RIGHT = 2;
export const MSX2_CELL_BEHAVIOR_CONVEYOR_LEFT = 3;
export const MSX2_CELL_BEHAVIOR_ROPE = 4;
export const MSX2_CELL_BEHAVIOR_BOX = 5;

export interface Msx2CellFlagInput {
  solid?: boolean;
  effect?: number;
  behavior?: number;
  zone?: number;
}

export const packMsx2CellFlags = ({
  solid = false,
  effect = 0,
  behavior = 0,
  zone = 0,
}: Msx2CellFlagInput): number => (
  (solid ? MSX2_CELL_SOLID : 0)
  | ((Math.max(0, Math.min(3, Math.floor(Number(effect) || 0))) << MSX2_CELL_EFFECT_SHIFT) & MSX2_CELL_EFFECT_MASK)
  | ((Math.max(0, Math.min(7, Math.floor(Number(behavior) || 0))) << MSX2_CELL_BEHAVIOR_SHIFT) & MSX2_CELL_BEHAVIOR_MASK)
  | (Math.max(0, Math.min(255, Math.floor(Number(zone) || 0))) & MSX2_CELL_ZONE_MASK)
) & 0xff;

export const getMsx2CellSolid = (cellFlags: number): boolean =>
  (cellFlags & MSX2_CELL_SOLID) !== 0;

export const getMsx2CellEffect = (cellFlags: number): number =>
  (cellFlags & MSX2_CELL_EFFECT_MASK) >> MSX2_CELL_EFFECT_SHIFT;

export const getMsx2CellBehavior = (cellFlags: number): number =>
  (cellFlags & MSX2_CELL_BEHAVIOR_MASK) >> MSX2_CELL_BEHAVIOR_SHIFT;

export const patchMsx2CellSolid = (cellFlags: number, solid: boolean): number =>
  solid ? ((cellFlags | MSX2_CELL_SOLID) & 0xff) : (cellFlags & ~MSX2_CELL_SOLID & 0xff);

export const clearMsx2CellEffect = (cellFlags: number): number =>
  cellFlags & ~MSX2_CELL_EFFECT_MASK & 0xff;

export const buildMsx2CellFlagBytes = (
  screen: Msx2Screen4TileScreen | undefined,
  layerBytes: {
    collision: number[];
    effects: number[];
    behavior: number[];
  }
): number[] => {
  const cellCount = Math.max(
    0,
    Math.floor(Number(screen?.widthTiles || 16) || 16) * Math.floor(Number(screen?.heightTiles || 12) || 12)
  );
  const fallbackCount = 16 * 12;
  const count = cellCount || fallbackCount;
  const width = Math.max(1, Math.floor(Number(screen?.widthTiles || 16) || 16));
  const tiles = screen?.tiles || [];
  const map = screen?.map || [];
  const maxTileIndex = Math.max(0, tiles.length - 1);
  return Array.from({ length: count }, (_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const tileIndex = Math.max(0, Math.min(maxTileIndex, Number(map[y]?.[x]) || 0));
    const tileBehavior = getMsx2TileBehaviorKind(tiles[tileIndex]);
    let solid = (Number(layerBytes.collision[index]) || 0) !== 0;
    let effect = Number(layerBytes.effects[index]) || 0;
    let behavior = Number(layerBytes.behavior[index]) || 0;

    if (tileBehavior === 'foreground') {
      solid = true;
    } else if (tileBehavior === 'dangerous') {
      effect = Math.max(effect, MSX2_CELL_EFFECT_HAZARD);
    } else if (tileBehavior === 'box') {
      solid = true;
      behavior = MSX2_CELL_BEHAVIOR_BOX;
    }

    return packMsx2CellFlags({ solid, effect, behavior });
  });
};
