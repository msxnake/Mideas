/**
 * Pure mirrors of MSX1 ROM state-machine helpers: the move test (SM_TestMoveDirection +
 * check_collision_box in utils/msxGenerator/generators/), shared by Mideas Play
 * mode (GameFlowPreviewModal) so CAN_MOVE_DIRECTION / PATH_CLEAR /
 * KEY_AND_MOVEMENT behave the same in the browser and on the MSX.
 *
 * Verified against the assembled Z80 routines (scripts/check_rom_move_test.ts).
 */

/** ROM direction ids: 1 up, 3 right, 5 down, 7 left (0 = none). */
export const ROM_MOVE_DIRECTION_IDS: Readonly<Record<string, number>> = { up: 1, right: 3, down: 5, left: 7 };

export interface RomMoveHitbox {
  /** Collision hitbox width/height in px; 0 means 16 (entity without Collision). */
  width: number;
  height: number;
  /** Signed collision offsets (-128..127) from the sprite top-left. */
  offsetX: number;
  offsetY: number;
}

const clampByte = (v: number) => Math.max(0, Math.min(255, v));

/**
 * True when the entity at (x, y) can move one pixel in `directionId`.
 * `isBlockingCell(col, row)` must return true for full blockers only (solid tiles that are
 * not one-way platforms); cells outside 32x24 must be passable.
 */
export function romCanMoveDirection(
  x: number,
  y: number,
  directionId: number,
  hitbox: RomMoveHitbox,
  isBlockingCell: (col: number, row: number) => boolean,
): boolean {
  if (![1, 3, 5, 7].includes(directionId)) return true; // unknown/neutral direction: clear
  let px = Math.floor(x) & 0xff;
  let py = Math.floor(y) & 0xff;
  if (directionId === 1) py = (py - 1) & 0xff;
  else if (directionId === 5) py = (py + 1) & 0xff;
  else if (directionId === 7) px = (px - 1) & 0xff;
  else px = (px + 1) & 0xff;
  const w = (hitbox.width & 0xff) || 16;
  const h = (hitbox.height & 0xff) || 16;
  const left = clampByte(px + hitbox.offsetX);
  const top = clampByte(py + hitbox.offsetY);
  const right = clampByte(left + w - 1);
  const bottom = clampByte(top + h - 1);
  for (let row = top >> 3; row <= bottom >> 3; row++) {
    for (let col = left >> 3; col <= right >> 3; col++) {
      if (col < 32 && row < 24 && isBlockingCell(col, row)) return false;
    }
  }
  return true;
}

/** ROM SM_DeduceDirectionFromVelocity: horizontal first, then vertical, 0 when idle. */
export function romDirectionFromVelocity(vx: number, vy: number): number {
  if (Math.trunc(vx) !== 0) return vx < 0 ? 7 : 3;
  if (Math.trunc(vy) !== 0) return vy < 0 ? 1 : 5;
  return 0;
}

/** ROM collision event bits (constantsGenerator COLLISION_EVENT_*). */
export const ROM_COLLISION_EVENT_ENTITY = 0x01;
export const ROM_COLLISION_EVENT_ENEMY = 0x02;
export const ROM_COLLISION_EVENT_ITEM = 0x04;

/**
 * ROM coll_flags_from_layer (componentsGenerator): event flags an entity receives when it
 * overlaps another entity whose collision layer is `layer` (COLLISION_LAYER_ENEMY #02,
 * COLLISION_LAYER_ITEM #10). Used by HAS_COLLISION in Play and in the ROM.
 */
export function romCollisionFlagsFromLayer(layer: number): number {
  return ROM_COLLISION_EVENT_ENTITY
    | ((layer & 0x02) ? ROM_COLLISION_EVENT_ENEMY : 0)
    | ((layer & 0x10) ? ROM_COLLISION_EVENT_ITEM : 0);
}

/**
 * ROM wall_build_hitbox_cache adaptive probes: for a hitbox side starting at `start` with
 * `size` pixels (inclusive span size-1), returns the two probe coordinates
 * [start + inset, start + size - 1 - inset] with inset = min(2, floor((size - 1) / 2)).
 * WallCollision probes walls at these Y positions and floors/ceilings at these X positions.
 */
export function romAdaptiveProbes(start: number, size: number): [number, number] {
  const span = Math.max(0, Math.floor(size) - 1);
  const inset = Math.min(2, span >> 1);
  return [start + inset, start + span - inset];
}

/** ROM Behavior types (entity_behavior_cfg_type). */
export const ROM_BEHAVIOR = { NONE: 0, FOLLOW_PLAYER_X: 1, FLEE_PLAYER_X: 2, FACE_PLAYER_X: 3, WALK_X_WALL_TURN: 4 } as const;

/** entitiesGenerator resolveBehaviorType: behaviorType / aiState names -> ROM type id. */
export function romResolveBehaviorType(value: unknown): number {
  const n = String(value ?? 'none').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['follow_player_x', 'followx', 'follow_x', 'chase', 'chase_x', 'chase_player_x', 'move_to_player_x'].includes(n)) return 1;
  if (['flee_player_x', 'fleex', 'flee_x', 'avoid_player_x', 'run_from_player_x'].includes(n)) return 2;
  if (['face_player_x', 'facex', 'face_x', 'look_at_player_x', 'look_player_x'].includes(n)) return 3;
  if (['walk_x_wall_turn', 'walk_wall_turn_x', 'walk_x', 'walker_x', 'wall_bounce_x', 'wall_turn_x', 'turn_on_wall_x'].includes(n)) return 4;
  return 0;
}

export interface RomBehaviorConfig {
  type: number;
  /** 1..16, 0 treated as 1. */
  speed: number;
  /** Stop when |dx| <= stopDistance. */
  stopDistance: number;
  /** 0 = unlimited; otherwise only act when |dx| <= range. */
  range: number;
  /** Initial walking direction for WALK_X_WALL_TURN: 1 left, 2 right. */
  direction: number;
}

export interface RomBehaviorState {
  /** Entity X (byte). */
  x: number;
  /** Player X (byte) or null when there is no player / this entity is the player. */
  heroX: number | null;
  /** entity_facing_dir: 0 unknown, 1 left, 2 right. */
  facing: number;
  /** Previous frame wall flags (bit2 = LEFT, bit3 = RIGHT). */
  wallFlags: number;
}

/**
 * One frame of ROM update_behavior_component for one entity. Returns the new X velocity
 * (undefined = untouched) and facing (unchanged when the ROM does not write it).
 */
export function romBehaviorStep(cfg: RomBehaviorConfig, st: RomBehaviorState): { vx: number | undefined; facing: number } {
  const speed = (cfg.speed & 0xff) || 1;
  let facing = st.facing;
  // behavior_load_target_delta_x: D = direction to player (0 none, 1 left, 2 right), A = |dx|
  const delta = (): [number, number] => {
    if (st.heroX === null) return [0, 0];
    const self = st.x & 0xff;
    const hero = st.heroX & 0xff;
    if (hero === self) return [0, 0];
    return hero > self ? [2, hero - self] : [1, self - hero];
  };
  // behavior_distance_allows: blocked when dist <= stop, or range != 0 and range < dist
  const allows = (dist: number) => !(dist <= (cfg.stopDistance & 0xff)) && !((cfg.range & 0xff) !== 0 && (cfg.range & 0xff) < dist);
  switch (cfg.type) {
    case 1:
    case 2: {
      const [dir, dist] = delta();
      if (dir === 0 || !allows(dist)) return { vx: 0, facing };
      const goRight = cfg.type === 1 ? dir === 2 : dir === 1;
      return { vx: goRight ? speed : -speed, facing: goRight ? 2 : 1 };
    }
    case 3: {
      const [dir] = delta();
      return { vx: undefined, facing: dir === 0 ? facing : dir };
    }
    case 4: {
      // behavior_get_facing_or_default_d + behavior_turn_on_wall_d
      let d = facing === 1 ? 1 : facing === 2 ? 2 : ((cfg.direction & 0xff) === 1 ? 1 : 2);
      if (st.wallFlags & 0x04) { if (d === 1) d = 2; }
      else if (st.wallFlags & 0x08) { if (d === 2) d = 1; }
      return { vx: d === 1 ? -speed : speed, facing: d };
    }
    default:
      return { vx: undefined, facing };
  }
}
