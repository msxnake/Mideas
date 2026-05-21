import { Msx2Screen5TileScreen } from '../../../../types';

export const MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN = 12;
export const MSX2_ENEMY_MOVEMENT_PATROL = 0;
export const MSX2_ENEMY_MOVEMENT_GHOST_MAZE = 2;
export const MSX2_ENEMY_MOVEMENT_DIVE = 3;

export interface Msx2EnemyHazardRuntimeSlot {
  x: number;
  y: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  dx: number;
  dy: number;
  mode: number;
  speed: number;
  score: number;
}

const clampTileCoordinate = (value: unknown, max: number): number =>
  Math.max(0, Math.min(max, Number(value) || 0));

const clampHardwareSpriteY = (value: number): number =>
  Math.max(0, Math.min(191, value));

const clampHardwareSpriteX = (value: number): number =>
  Math.max(0, Math.min(255, value));

const getEntityParamNumber = (
  params: Record<string, any> | undefined,
  key: string,
  fallback: number
): number => {
  const value = Number(params?.[key]);
  return Number.isFinite(value) ? value : fallback;
};

const getComponentValue = (
  entity: any,
  componentId: string,
  key: string,
  fallback: unknown
): unknown => entity?.components?.[componentId]?.[key] ?? entity?.params?.[key] ?? fallback;

export function getMsx2EnemyHazardRuntimeSlots(
  screen: Msx2Screen5TileScreen | undefined
): Msx2EnemyHazardRuntimeSlot[] {
  return (screen?.layers?.entities || [])
    .filter(entity => (entity.kind === 'enemy' || entity.kind === 'hazard') && entity.position)
    .slice(0, MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN)
    .map(entity => {
      const xTile = clampTileCoordinate(entity.position?.x, 15);
      const yTile = clampTileCoordinate(entity.position?.y, 11);
      const movement = String(
        getComponentValue(entity, 'msx2_movement', 'mode', entity.params?.movement || entity.params?.motion || '')
      ).toLowerCase();
      const hasPatrolX = movement === 'patrolx' || movement === 'patrol-x' || movement === 'horizontal';
      const hasPatrolY = movement === 'patroly' || movement === 'patrol-y' || movement === 'vertical';
      const hasGhostMaze = movement === 'ghostmaze'
        || movement === 'ghost-maze'
        || movement === 'mazeghost'
        || movement === 'maze-ghost'
        || movement === 'ghost'
        || movement === 'pacman-ghost'
        || movement === 'puck-ghost'
        || movement === 'chase';
      const attackPattern = String(getComponentValue(entity, 'msx2_attack_pattern', 'pattern', entity.params?.attackPattern || '')).toLowerCase();
      const hasDiveAttack = attackPattern === 'dive'
        || attackPattern === 'diving'
        || attackPattern === 'galaxian-dive'
        || attackPattern === 'galaxiandive';
      const minXTile = hasPatrolX ? clampTileCoordinate(getComponentValue(entity, 'msx2_movement', 'minX', getEntityParamNumber(entity.params, 'minX', xTile)), 15) : xTile;
      const maxXTile = hasPatrolX ? clampTileCoordinate(getComponentValue(entity, 'msx2_movement', 'maxX', getEntityParamNumber(entity.params, 'maxX', xTile)), 15) : xTile;
      const minYTile = hasPatrolY ? clampTileCoordinate(getComponentValue(entity, 'msx2_movement', 'minY', getEntityParamNumber(entity.params, 'minY', yTile)), 11) : yTile;
      const maxYTile = hasPatrolY ? clampTileCoordinate(getComponentValue(entity, 'msx2_movement', 'maxY', getEntityParamNumber(entity.params, 'maxY', yTile)), 11) : yTile;
      const direction = Number(getComponentValue(entity, 'msx2_movement', 'direction', getEntityParamNumber(entity.params, 'direction', 1))) < 0 ? -1 : 1;
      const initialDirection = String(
        getComponentValue(entity, 'msx2_ai', 'initialDirection', entity.params?.initialDirection || entity.params?.startDirection || '')
      ).toLowerCase();
      const ghostDx = initialDirection === 'left' ? -1 : initialDirection === 'up' || initialDirection === 'down' ? 0 : direction;
      const ghostDy = initialDirection === 'up' ? -1 : initialDirection === 'down' ? 1 : 0;
      const triggerFrames = Math.floor(Number(
        getComponentValue(entity, 'msx2_attack_pattern', 'triggerFrames', entity.params?.triggerFrames ?? entity.params?.attackDelay ?? 96)
      ) || 96);
      const speed = hasDiveAttack
        ? Math.max(16, Math.min(240, triggerFrames))
        : Math.max(1, Math.min(15, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'speed', entity.params?.speed ?? entity.params?.frameStep ?? 2)
      ) || 2)));
      const score = Math.max(1, Math.min(255, Math.floor(Number(
        getComponentValue(entity, 'msx2_score', 'points', entity.params?.points ?? entity.params?.score ?? 1)
      ) || 1)));
      return {
        x: clampHardwareSpriteX(xTile * 16),
        y: clampHardwareSpriteY(yTile * 16),
        minX: clampHardwareSpriteX(Math.min(minXTile, maxXTile) * 16),
        maxX: clampHardwareSpriteX(Math.max(minXTile, maxXTile) * 16),
        minY: clampHardwareSpriteY(Math.min(minYTile, maxYTile) * 16),
        maxY: clampHardwareSpriteY(Math.max(minYTile, maxYTile) * 16),
        dx: hasGhostMaze ? ghostDx : hasPatrolX ? direction : 0,
        dy: hasGhostMaze ? ghostDy : hasPatrolY ? direction : 0,
        mode: hasDiveAttack ? MSX2_ENEMY_MOVEMENT_DIVE : hasGhostMaze ? MSX2_ENEMY_MOVEMENT_GHOST_MAZE : MSX2_ENEMY_MOVEMENT_PATROL,
        speed,
        score,
      };
    });
}
