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
