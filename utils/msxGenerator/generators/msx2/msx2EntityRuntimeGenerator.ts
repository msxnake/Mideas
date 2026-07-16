import { Msx2Screen4TileScreen } from '../../../../types';
import { isMsx2CarryableEntity } from './msx2CarryObjectGenerator';

export const MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN = 12;
export const MSX2_ENEMY_MOVEMENT_PATROL = 0;
export const MSX2_ENEMY_MOVEMENT_GHOST_MAZE = 2;
export const MSX2_ENEMY_MOVEMENT_DIVE = 3;
export const MSX2_ENEMY_MOVEMENT_BALL_BOUNCE = 4;
export const MSX2_ENEMY_MOVEMENT_FLYER_SINE = 5;
export const MSX2_ENEMY_MOVEMENT_JUMPER = 6;
export const MSX2_ENEMY_MOVEMENT_WALKER_EDGE = 7;
export const MSX2_ENEMY_MOVEMENT_CHASE_H = 8;
export const MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X = 9;
export const MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY = 10;
export const MSX2_ENEMY_MOVEMENT_SLIME_CEILING = 11;

/** Default horizontal distance (px) a slime crawls before hopping floor<->ceiling. */
export const MSX2_SLIME_CEILING_DEFAULT_TRAVEL_PX = 48;

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
  stateSwitch: boolean;
  stateNearMode: number;
  stateFarMode: number;
  stateRangeX: number;
  stateRangeY: number;
  dropBombOnPlayerX: boolean;
  /** SlimeCeiling: horizontal px crawled before hopping floor<->ceiling. */
  travelPx: number;
}

const clampTileCoordinate = (value: unknown, max: number): number =>
  Math.max(0, Math.min(max, Number(value) || 0));

const clampHardwareSpriteY = (value: number): number =>
  Math.max(0, Math.min(191, value));

const clampHardwareSpriteX = (value: number): number =>
  Math.max(0, Math.min(255, value));

const movementBoundsUsePixels = (entity: any): boolean =>
  String(entity?.components?.msx2_movement?.boundsUnit ?? entity?.params?.boundsUnit ?? '')
    .replace(/[\s_-]+/g, '')
    .toLowerCase() === 'px';

const getMovementBoundPixel = (
  entity: any,
  key: 'minX' | 'maxX' | 'minY' | 'maxY',
  tileFallback: number,
  tileMax: number,
  pixelClamp: (value: number) => number
): number => {
  const usesPixels = movementBoundsUsePixels(entity);
  // The fallback arguments are expressed in tile coordinates. When an entity
  // selects pixel bounds but omits min/max, convert the defaults as well;
  // otherwise maxX=15 tiles was accidentally exported as maxX=15 pixels.
  const unitFallback = usesPixels ? tileFallback * 16 : tileFallback;
  const rawValue = getComponentValue(entity, 'msx2_movement', key, getEntityParamNumber(entity.params, key, unitFallback));
  const numeric = Number(rawValue);
  if (usesPixels && Number.isFinite(numeric)) {
    return pixelClamp(Math.floor(numeric));
  }
  return pixelClamp(clampTileCoordinate(rawValue, tileMax) * 16);
};

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

const normalizeMovementMode = (value: unknown): string => String(value || '')
  .replace(/[\s_-]+/g, '')
  .toLowerCase();

const movementModeToRuntimeByte = (movement: string): number => {
  const normalized = normalizeMovementMode(movement);
  if (normalized === 'ballbounce' || normalized === 'ball' || normalized === 'pongball' || normalized === 'arkanoidball') return MSX2_ENEMY_MOVEMENT_BALL_BOUNCE;
  if (normalized === 'flyersine' || normalized === 'sineflyer' || normalized === 'sinewave' || normalized === 'sine' || normalized === 'flyer') return MSX2_ENEMY_MOVEMENT_FLYER_SINE;
  if (normalized === 'jumper' || normalized === 'jumping' || normalized === 'verticaljump') return MSX2_ENEMY_MOVEMENT_JUMPER;
  if (normalized === 'walkerturnonedge' || normalized === 'walker' || normalized === 'walkeredge' || normalized === 'turnonedge' || normalized === 'edgewalker') return MSX2_ENEMY_MOVEMENT_WALKER_EDGE;
  if (normalized === 'walkergravity' || normalized === 'gravitywalker' || normalized === 'platformwalker' || normalized === 'walkfall') return MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY;
  if (normalized === 'slimeceiling' || normalized === 'ceilingslime' || normalized === 'slime' || normalized === 'gravityflipslime') return MSX2_ENEMY_MOVEMENT_SLIME_CEILING;
  if (normalized === 'patrolchasex' || normalized === 'patrolchase' || normalized === 'chasepatrolx' || normalized === 'chasepatrol') return MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X;
  if (normalized === 'chaseh' || normalized === 'chasehorizontal' || normalized === 'chasex' || normalized === 'followx') return MSX2_ENEMY_MOVEMENT_CHASE_H;
  if (normalized === 'ghostmaze' || normalized === 'mazeghost' || normalized === 'ghost' || normalized === 'pacmanghost' || normalized === 'puckghost' || normalized === 'chase') return MSX2_ENEMY_MOVEMENT_GHOST_MAZE;
  return MSX2_ENEMY_MOVEMENT_PATROL;
};

const signedByte = (value: number): number => {
  const clamped = Math.max(-15, Math.min(15, Math.floor(value) || 0));
  return clamped < 0 ? 0x100 + clamped : clamped;
};

const truthyConfigValue = (value: unknown): boolean =>
  value === true || value === 1 || String(value).trim().toLowerCase() === 'true' || String(value).trim() === '1';

export function getMsx2EnemyHazardRuntimeSlots(
  screen: Msx2Screen4TileScreen | undefined
): Msx2EnemyHazardRuntimeSlot[] {
  return (screen?.layers?.entities || [])
    .filter(entity =>
      (entity.kind === 'enemy' || entity.kind === 'hazard')
      && entity.position
      // Push boxes are solid pushable props, not damaging enemies/hazards.
      && !entity.components?.msx2_push_box
      && !entity.components?.msx2_box2
      && entity.params?.engine !== 'pushBox'
      && entity.params?.engine !== 'box2'
      && entity.params?.pushBox !== true
      && entity.params?.box2 !== true
      // Carryable objects (carry_object skill) are harmless props with
      // their own dedicated sprite slots, never enemy/hazard bodies.
      && !isMsx2CarryableEntity(entity)
    )
    .slice(0, MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN)
    .map(entity => {
      const xTile = clampTileCoordinate(entity.position?.x, 15);
      const yTile = clampTileCoordinate(entity.position?.y, 11);
      const movement = normalizeMovementMode(
        getComponentValue(entity, 'msx2_movement', 'mode', entity.params?.movement || entity.params?.motion || '')
      );
      const stateNearMovement = normalizeMovementMode(
        getComponentValue(entity, 'msx2_ai', 'nearMode', entity.params?.enemyNearMode || entity.params?.nearMode || '')
      );
      const stateFarMovement = normalizeMovementMode(
        getComponentValue(entity, 'msx2_ai', 'farMode', entity.params?.enemyFarMode || entity.params?.farMode || movement)
      );
      const rawStateSwitch = getComponentValue(entity, 'msx2_ai', 'stateSwitchEnabled', entity.params?.enemyStateSwitch ?? entity.params?.stateSwitchEnabled ?? false);
      const dropBombOnPlayerX = truthyConfigValue(
        getComponentValue(entity, 'msx2_ai', 'dropBombOnPlayerX', entity.params?.enemyDropBombOnPlayerX ?? entity.params?.dropBombOnPlayerX ?? false)
      );
      const stateRangeX = Math.max(0, Math.min(255, Math.floor(Number(
        getComponentValue(entity, 'msx2_ai', 'rangeX', entity.params?.enemyStateRangeX ?? entity.params?.stateRangeX ?? 0)
      ) || 0)));
      const stateRangeY = Math.max(0, Math.min(191, Math.floor(Number(
        getComponentValue(entity, 'msx2_ai', 'rangeY', entity.params?.enemyStateRangeY ?? entity.params?.stateRangeY ?? 0)
      ) || 0)));
      const hasPatrolX = movement === 'patrolx' || movement === 'horizontal';
      const hasPatrolY = movement === 'patroly' || movement === 'vertical';
      const hasBallBounce = movement === 'ballbounce' || movement === 'ball' || movement === 'pongball' || movement === 'arkanoidball';
      const hasFlyerSine = movement === 'flyersine'
        || movement === 'sineflyer'
        || movement === 'sinewave'
        || movement === 'sine'
        || movement === 'flyer';
      const hasJumper = movement === 'jumper'
        || movement === 'jumping'
        || movement === 'verticaljump';
      const hasWalkerEdge = movement === 'walkerturnonedge'
        || movement === 'walker'
        || movement === 'walkeredge'
        || movement === 'turnonedge'
        || movement === 'edgewalker';
      const hasWalkerGravity = movement === 'walkergravity'
        || movement === 'gravitywalker'
        || movement === 'platformwalker'
        || movement === 'walkfall';
      const hasSlimeCeiling = movement === 'slimeceiling'
        || movement === 'ceilingslime'
        || movement === 'slime'
        || movement === 'gravityflipslime';
      // NOTE: 'chase' alone is already ghost-maze; ChaseHorizontal uses explicit names.
      const hasChaseH = movement === 'chaseh'
        || movement === 'chasehorizontal'
        || movement === 'chasex'
        || movement === 'followx';
      const hasPatrolChaseX = movement === 'patrolchasex'
        || movement === 'patrolchase'
        || movement === 'chasepatrolx'
        || movement === 'chasepatrol';
      const stateNearMode = movementModeToRuntimeByte(stateNearMovement);
      const stateFarMode = movementModeToRuntimeByte(stateFarMovement || movement);
      const stateSwitch = truthyConfigValue(rawStateSwitch)
        && stateRangeX > 0
        && stateRangeY > 0
        && stateNearMode !== stateFarMode;
      const hasGhostMaze = movement === 'ghostmaze'
        || movement === 'mazeghost'
        || movement === 'ghost'
        || movement === 'pacmanghost'
        || movement === 'puckghost'
        || movement === 'chase';
      const attackPattern = String(getComponentValue(entity, 'msx2_attack_pattern', 'pattern', entity.params?.attackPattern || '')).toLowerCase();
      const hasDiveAttack = attackPattern === 'dive'
        || attackPattern === 'diving'
        || attackPattern === 'galaxian-dive'
        || attackPattern === 'galaxiandive'
        || attackPattern === 'circle'
        || attackPattern === 'zigzag'
        || attackPattern === 'diagonal';
      const sineAmplitude = Math.max(1, Math.min(64, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'amplitude', entity.params?.amplitude ?? 8)
      ) || 8)));
      const sineBaseY = clampHardwareSpriteY(yTile * 16);
      const sineMinY = clampHardwareSpriteY(sineBaseY - sineAmplitude);
      const sineMaxY = clampHardwareSpriteY(sineBaseY + sineAmplitude);
      const jumperHeight = Math.max(1, Math.min(64, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'jumpHeight', entity.params?.jumpHeight ?? entity.params?.height ?? entity.params?.amplitude ?? 32)
      ) || 32)));
      const jumperBaseY = clampHardwareSpriteY(yTile * 16);
      const jumperMinY = clampHardwareSpriteY(jumperBaseY - jumperHeight);
      const jumperMaxY = jumperBaseY;
      const direction = Number(getComponentValue(entity, 'msx2_movement', 'direction', getEntityParamNumber(entity.params, 'direction', 1))) < 0 ? -1 : 1;
      const flyerSpeedX = Math.max(1, Math.min(4, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'speedX', entity.params?.speedX ?? entity.params?.speed ?? 1)
      ) || 1)));
      const flyerFrequency = Math.max(1, Math.min(8, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'frequency', entity.params?.frequency ?? entity.params?.speedY ?? 1)
      ) || 1)));
      const flyerPhase = Math.max(0, Math.min(31, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'phase', entity.params?.phase ?? 0)
      ) || 0)));
      const jumperSpeedY = Math.max(1, Math.min(8, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'jumpSpeed', entity.params?.jumpSpeed ?? entity.params?.speedY ?? entity.params?.verticalSpeed ?? 2)
      ) || 2)));
      const jumperPauseFrames = Math.max(0, Math.min(60, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'pauseFrames', entity.params?.pauseFrames ?? entity.params?.pauseOnGround ?? 0)
      ) || 0)));
      const slimeTravelPx = Math.max(4, Math.min(255, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'travelPx', entity.params?.travelPx ?? MSX2_SLIME_CEILING_DEFAULT_TRAVEL_PX)
      ) || MSX2_SLIME_CEILING_DEFAULT_TRAVEL_PX)));
      const usesHorizontalBounds = hasPatrolX || hasBallBounce || hasFlyerSine || hasWalkerEdge || hasWalkerGravity || hasSlimeCeiling || hasChaseH || hasPatrolChaseX || stateSwitch;
      const minX = usesHorizontalBounds ? getMovementBoundPixel(entity, 'minX', 0, 15, clampHardwareSpriteX) : clampHardwareSpriteX(xTile * 16);
      const maxX = usesHorizontalBounds ? getMovementBoundPixel(entity, 'maxX', 15, 15, clampHardwareSpriteX) : clampHardwareSpriteX(xTile * 16);
      const minY = hasFlyerSine ? sineMinY : hasJumper ? jumperMinY : hasPatrolY || hasBallBounce ? getMovementBoundPixel(entity, 'minY', 0, 11, clampHardwareSpriteY) : clampHardwareSpriteY(yTile * 16);
      const maxY = hasFlyerSine ? sineMaxY : hasJumper ? jumperMaxY : hasPatrolY || hasBallBounce ? getMovementBoundPixel(entity, 'maxY', 11, 11, clampHardwareSpriteY) : clampHardwareSpriteY(yTile * 16);
      const ballSpeed = Math.max(1, Math.min(6, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'speed', entity.params?.speed ?? 2)
      ) || 2)));
      const ballSpeedX = Math.max(-6, Math.min(6, Math.floor(Number(entity.params?.speedX ?? ballSpeed) || ballSpeed))) || ballSpeed;
      const ballSpeedY = Math.max(-6, Math.min(6, Math.floor(Number(entity.params?.speedY ?? -ballSpeed) || -ballSpeed))) || -ballSpeed;
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
        : hasFlyerSine
          ? flyerPhase
          : hasJumper
            ? jumperPauseFrames
        : Math.max(1, Math.min(15, Math.floor(Number(
        getComponentValue(entity, 'msx2_movement', 'speed', entity.params?.speed ?? entity.params?.frameStep ?? 2)
      ) || 2)));
      const score = Math.max(1, Math.min(255, Math.floor(Number(
        getComponentValue(entity, 'msx2_score', 'points', entity.params?.points ?? entity.params?.score ?? 1)
      ) || 1)));
      return {
        x: clampHardwareSpriteX(xTile * 16),
        y: clampHardwareSpriteY(yTile * 16),
        minX: Math.min(minX, maxX),
        maxX: Math.max(minX, maxX),
        minY: Math.min(minY, maxY),
        maxY: Math.max(minY, maxY),
        dx: hasBallBounce ? signedByte(ballSpeedX) : hasFlyerSine ? signedByte(direction * flyerSpeedX) : hasWalkerEdge || hasWalkerGravity || hasSlimeCeiling || hasChaseH || hasPatrolChaseX ? signedByte(direction) : hasGhostMaze ? ghostDx : hasPatrolX ? direction : 0,
        dy: hasBallBounce ? signedByte(ballSpeedY) : hasFlyerSine ? signedByte(flyerPhase >= 16 ? -flyerFrequency : flyerFrequency) : hasJumper ? signedByte(-jumperSpeedY) : hasGhostMaze ? ghostDy : hasPatrolY ? direction : 0,
        mode: hasBallBounce ? MSX2_ENEMY_MOVEMENT_BALL_BOUNCE : hasDiveAttack ? MSX2_ENEMY_MOVEMENT_DIVE : hasGhostMaze ? MSX2_ENEMY_MOVEMENT_GHOST_MAZE : hasFlyerSine ? MSX2_ENEMY_MOVEMENT_FLYER_SINE : hasJumper ? MSX2_ENEMY_MOVEMENT_JUMPER : hasWalkerEdge ? MSX2_ENEMY_MOVEMENT_WALKER_EDGE : hasWalkerGravity ? MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY : hasSlimeCeiling ? MSX2_ENEMY_MOVEMENT_SLIME_CEILING : hasPatrolChaseX ? MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X : hasChaseH ? MSX2_ENEMY_MOVEMENT_CHASE_H : MSX2_ENEMY_MOVEMENT_PATROL,
        speed,
        score,
        stateSwitch,
        stateNearMode,
        stateFarMode,
        stateRangeX,
        stateRangeY,
        dropBombOnPlayerX,
        travelPx: slimeTravelPx,
      };
    });
}
