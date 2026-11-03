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

/**
 * Tile-collision rule shared by the ROM generator (entitiesGenerator collidesWith init) and
 * Play mode. Decision (docs/project/PLAN_PARIDAD_PLAY_ROM.md, phase 4): an entity with the
 * Collision component collides with map tiles unless it has WallCollision with
 * stopOnCollision = false (multi-screen Patrol objects excepted). The ROM WallCollision filter tests COLLISION_LAYER_PLATFORM (#08)
 * in collidesWith, so the bit is added here. To revert to "collidesWith decides", return
 * `stopsOnTiles = false` for entities without WallCollision.
 */
export function romTileCollidesWith(collidesWith: number, hasWallCollision: boolean, wallStopOnCollision: boolean, isMultiScreenPatrol = false): number {
  // Multi-screen Patrol objects travel through the world layout and never use tile collision in
  // Play mode, so they do not get the automatic tile bit either.
  const stopsOnTiles = isMultiScreenPatrol ? false : hasWallCollision ? wallStopOnCollision : true;
  return stopsOnTiles ? (collidesWith | 0x08) & 0xff : collidesWith & 0xff;
}

// ---------------------------------------------------------------------------
// Mirror, WallJump and Dash (phase 4 port). Verified against the assembled Z80 routines in
// scripts/check_rom_movement_systems.ts.
// ---------------------------------------------------------------------------

const toByte = (v: number) => Math.trunc(v) & 0xff;
const toSigned = (b: number) => ((b & 0xff) >= 0x80 ? (b & 0xff) - 0x100 : b & 0xff);

/** ROM GTSTCK direction (0 none, 1 up, 2 up-right, 3 right ... 8 up-left) from pressed directions. */
export function romStickFromKeys(up: boolean, down: boolean, left: boolean, right: boolean): number {
  const dx = (right ? 1 : 0) - (left ? 1 : 0);
  const dy = (down ? 1 : 0) - (up ? 1 : 0);
  const table: Record<string, number> = { '0,-1': 1, '1,-1': 2, '1,0': 3, '1,1': 4, '0,1': 5, '-1,1': 6, '-1,0': 7, '-1,-1': 8 };
  return table[`${dx},${dy}`] ?? 0;
}

/** entitiesGenerator parseBool. */
export function romParseBool(v: unknown, d: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const n = v.trim().toLowerCase();
    if (n === 'true') return true;
    if (n === 'false') return false;
    const i = parseInt(n, 10);
    if (!Number.isNaN(i)) return i !== 0;
  }
  return d;
}

/** entity_mirror_flags from the Mirror component values (bit0 enabled, bit1 invert facing). */
export function romMirrorFlags(hasMirror: boolean, values: Record<string, unknown>): number {
  if (!hasMirror) return 0;
  return romParseBool(values.enabled, true) ? (1 | (romParseBool(values.invertFacing, true) ? 2 : 0)) : 0;
}

/** ROM update_mirror_component for one entity: negates X velocity, optionally flips facing. */
export function romMirrorStep(flags: number, velX: number, facing: number): { velX: number; facing: number } {
  const vx = toByte(velX);
  if (!(flags & 0x01) || vx === 0) return { velX: toSigned(vx), facing };
  const neg = (-vx) & 0xff;
  return { velX: toSigned(neg), facing: (flags & 0x02) ? ((neg & 0x80) ? 1 : 2) : facing };
}

export interface RomWallJumpConfig {
  enabled: boolean;
  horizontalPush: number;
  /** 8.8 word stored in entity_walljump_cfg_vertical_impulse (already negated = upwards). */
  verticalImpulseWord: number;
  slideFallSpeed: number;
  lockFrames: number;
  requireAway: boolean;
}

/** entitiesGenerator WallJump config resolution (same precedence and clamping as the ROM). */
export function romWallJumpConfig(
  definitionDefaults: Record<string, any>,
  templateDefaults: Record<string, any>,
  overrides: Record<string, any>,
): RomWallJumpConfig {
  const parseInt10 = (v: any) => (typeof v === 'number' ? v : parseInt(String(v ?? ''), 10));
  const byte = (v: any, d: number) => { const n = parseInt10(v); return Number.isNaN(n) ? d : Math.max(0, Math.min(255, n | 0)); };
  const word = (v: any, d: number) => { const n = parseInt10(v); return Number.isNaN(n) ? Math.max(0, Math.min(65535, d | 0)) : Math.max(0, Math.min(65535, n | 0)); };
  const bool = romParseBool;
  const values = { ...definitionDefaults, ...templateDefaults, ...overrides };
  if (!bool(values.isEnabled, true)) {
    return { enabled: false, horizontalPush: 0, verticalImpulseWord: 0, slideFallSpeed: 0, lockFrames: 0, requireAway: false };
  }
  const magnitude = Math.max(1, word(overrides.verticalImpulse ?? templateDefaults.verticalImpulse ?? 1280, 1280));
  return {
    enabled: true,
    horizontalPush: Math.max(1, byte(overrides.horizontalPush ?? templateDefaults.horizontalPush ?? 7, 7)),
    verticalImpulseWord: (0x10000 - magnitude) & 0xffff,
    slideFallSpeed: byte(values.slideFallSpeed, 2),
    lockFrames: byte(overrides.lockFrames ?? templateDefaults.lockFrames ?? 16, 16),
    requireAway: bool(values.requirePressAwayFromWall, false),
  };
}

export interface RomWallJumpState {
  x: number;
  velX: number;
  velY: number;
  /** 8.8 gravity velocity as unsigned 16-bit (entity_gravity_vel). */
  gravityVel: number;
  onGround: boolean;
  onLadder: boolean;
  /** Previous WallCollision pass flags (#02 down, #04 left, #08 right). */
  wallFlags: number;
  lock: number;
  lockedVx: number;
  facing: number;
}

/**
 * ROM walljump_process_entity_c (without the one-shot animation restore, handled by the caller).
 * `fireEdge` = button 1 pressed this frame and not the previous one; `stick` = GTSTCK direction.
 */
export function romWallJumpStep(
  cfg: RomWallJumpConfig,
  input: RomWallJumpState,
  fireEdge: boolean,
  stick: number,
): { state: RomWallJumpState; jumped: boolean } {
  const st: RomWallJumpState = { ...input, x: toByte(input.x), velX: toByte(input.velX), velY: toByte(input.velY), lockedVx: toByte(input.lockedVx), lock: input.lock & 0xff, gravityVel: input.gravityVel & 0xffff };
  const out = (jumped: boolean) => ({ state: { ...st, velX: toSigned(st.velX), velY: toSigned(st.velY), lockedVx: toSigned(st.lockedVx) }, jumped });
  if (!cfg.enabled) return out(false);
  const clear = () => { st.lock = 0; st.lockedVx = 0; };
  if (st.onGround || st.onLadder || (st.wallFlags & 0x02)) { clear(); return out(false); }
  if (st.lockedVx !== 0) {
    if (st.gravityVel & 0x8000) {
      st.velX = st.lockedVx;
      if (st.lock !== 0) st.lock = (st.lock - 1) & 0xff;
    } else {
      clear();
    }
  }
  const wall = st.wallFlags & 0x0c;
  if (!wall) return out(false);
  const slide = cfg.slideFallSpeed & 0xff;
  if (slide && !(st.velY & 0x80) && st.velY > slide) {
    st.velY = slide;
    st.gravityVel = (slide << 8) & 0xffff;
  }
  if (!fireEdge) return out(false);
  const isLeft = stick >= 6 && stick <= 8;
  const isRight = stick >= 2 && stick <= 4;
  let fromLeft: boolean;
  if (cfg.requireAway) {
    if ((wall & 0x04) && isRight) fromLeft = true;
    else if ((wall & 0x08) && isLeft) fromLeft = false;
    else return out(false);
  } else if (wall & 0x04) {
    fromLeft = !(wall & 0x08) ? true : isRight ? true : isLeft ? false : true;
  } else {
    fromLeft = false;
  }
  const push = cfg.horizontalPush & 0xff;
  const d = fromLeft ? push : (-push) & 0xff;
  st.velX = d;
  st.lockedVx = d;
  st.facing = (d & 0x80) ? 1 : 2;
  if (d !== 0) st.x = (d & 0x80) ? (st.x - 1) & 0xff : (st.x + 1) & 0xff;
  st.lock = cfg.lockFrames & 0xff;
  st.gravityVel = cfg.verticalImpulseWord & 0xffff;
  st.velY = (st.gravityVel >> 8) & 0xff;
  st.onGround = false;
  return out(true);
}

export interface RomDashState { timer: number; cooldown: number; dir: number }

/**
 * ROM player_fast_dash_process_c (player only). Note: the ROM uses fixed values (speed 8,
 * 8 frames, cooldown 18 that never blocks a new dash) and only reads Dash.isEnabled.
 * Returns the velocity override while the dash is active.
 */
export function romDashStep(
  input: RomDashState,
  enabled: boolean,
  inputDisabled: boolean,
  grabEdge: boolean,
  stick: number,
  facing: number,
): { state: RomDashState; active: boolean; vx: number; vy: number } {
  const st = { ...input };
  const idle = () => ({ state: st, active: false, vx: 0, vy: 0 });
  if (inputDisabled) { st.timer = 0; return idle(); }
  if (!enabled) { st.timer = 0; st.cooldown = 0; return idle(); }
  if (st.timer === 0) {
    if (st.cooldown !== 0) st.cooldown = (st.cooldown - 1) & 0xff;
    if (!grabEdge) return idle();
    st.dir = romDashDirection(stick, facing);
    st.timer = 8;
    st.cooldown = 18;
  }
  st.timer = (st.timer - 1) & 0xff;
  const [vx, vy] = st.dir === 1 ? [-8, 0] : st.dir === 3 ? [0, -8] : st.dir === 4 ? [0, 8] : [8, 0];
  return { state: st, active: true, vx, vy };
}

/** ROM player_fast_dash_resolve_dir_c: 1 left, 2 right, 3 up, 4 down. */
export function romDashDirection(stick: number, facing: number): number {
  if (stick === 2 || stick === 3 || stick === 4) return 2;
  if (stick === 6 || stick === 7 || stick === 8) return 1;
  if (stick === 1) return 3;
  if (stick === 5) return 4;
  if (facing === 1 || facing === 2 || facing === 3 || facing === 4) return facing;
  return 2;
}

/** ROM player_dash_break_front_tile_c probe: the cell [col, row] in front of the dash, or null. */
export function romDashFrontTile(x: number, y: number, dir: number): [number, number] | null {
  let bx = toByte(x);
  let cy = toByte(y);
  if (dir === 1) {
    if (bx === 0) return null;
    bx -= 1;
    if (cy >= 184) return null;
    cy += 8;
  } else if (dir === 3) {
    if (cy === 0) return null;
    cy -= 1;
    if (bx >= 248) return null;
    bx += 8;
  } else if (dir === 4) {
    if (cy >= 176) return null;
    cy += 16;
    if (bx >= 248) return null;
    bx += 8;
  } else {
    if (bx >= 240) return null;
    bx += 16;
    if (cy >= 184) return null;
    cy += 8;
  }
  const col = bx >> 3;
  const row = cy >> 3;
  if (col >= 32 || row >= 24) return null;
  return [col, row];
}
