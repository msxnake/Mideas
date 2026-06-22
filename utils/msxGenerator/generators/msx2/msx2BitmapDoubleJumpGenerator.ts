/**
 * SCREEN 5 bitmap-room DOUBLE JUMP skill.
 *
 * Unlike the dash (a self-contained appended routine), double jump EXTENDS the
 * existing jump, which lives inline in update_player_movement. So this module
 * owns the whole jump block (.check_jump .. .jump_released):
 *   - When the skill is OFF it emits the original single-jump block (same
 *     instructions -> bit-identical ROM for existing projects).
 *   - When ON it tracks player_jumps_used (#C00D): a ground jump uses the
 *     primary impulse and sets the counter to 1; an air jump (while the counter
 *     is below maxJumps) uses the mid-air impulse and increments it. The counter
 *     resets to 0 whenever the player is grounded (player_flags bit 0).
 *
 * player_jump_lock (requireKeyRelease) is set on every jump and cleared on
 * release, so each jump needs a fresh press (holding space never auto-repeats).
 *
 * RAM: 1 byte at #C00D (the free player gap #C00D..#C00F; #C00C is the OR colour
 * gate). Direction/impulse come from the Player Config via resolveBitmapPlayerPhysics.
 */

export interface BitmapJumpPhysics {
  /** Primary (ground) jump velocity as a signed byte, e.g. -5 -> #FB. */
  jumpImpulseByte: number;
  jumpPx: number;
  /** True when the double_jump skill is active for the linked player. */
  doubleJumpEnabled: boolean;
  /** Total jumps allowed (1 = no double jump; 2 = one extra; clamped 1..4). */
  maxJumps: number;
  /** Mid-air jump velocity as a signed byte (scaled impulse). */
  airJumpImpulseByte: number;
  airJumpPx: number;
}

export const MSX2_BITMAP_JUMPS_USED_RAM = 0xC00D;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapDoubleJumpEnabled(physics: BitmapJumpPhysics | undefined): boolean {
  return Boolean(physics?.doubleJumpEnabled) && Number(physics?.maxJumps) > 1;
}

/** RAM EQU for the jump counter (only when the skill is active). */
export function buildBitmapDoubleJumpEquates(physics: BitmapJumpPhysics | undefined): string {
  if (!bitmapDoubleJumpEnabled(physics)) return '';
  return `; --- DOUBLE JUMP skill: jumps taken since leaving the ground ---
player_jumps_used EQU ${asmWord(MSX2_BITMAP_JUMPS_USED_RAM)}
`;
}

/** Zeroes the jump counter at init (only when the skill is active). */
export function buildBitmapDoubleJumpInitClearAsm(physics: BitmapJumpPhysics | undefined): string {
  if (!bitmapDoubleJumpEnabled(physics)) return '';
  return `    xor a
    ld (player_jumps_used), a
`;
}

/**
 * The jump dispatch block (.check_jump .. .jump_released), inserted inline in
 * update_player_movement. INPUT: C = pressed key mask for keyboard row 8
 * (bit 0 = SPACE, bit 5 = UP). Falls through to .apply_gravity.
 *
 * The OFF variant is the original single-jump block (bit-identical instructions).
 */
export function buildBitmapJumpBlockAsm(physics: BitmapJumpPhysics): string {
  const jumpByte = asmByte(physics.jumpImpulseByte);
  const jumpPx = Math.max(1, Math.floor(physics.jumpPx) || 5);

  if (!bitmapDoubleJumpEnabled(physics)) {
    // Original single-jump logic. Comments do not affect the compiled bytes.
    return `.check_jump:
    bit 0, c
    jp nz, .jump_pressed
    bit 5, c
    jp z, .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .apply_gravity
    ld a, ${jumpByte}              ; -${jumpPx} px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a`;
  }

  const maxJumps = asmByte(Math.max(1, Math.min(4, Math.floor(physics.maxJumps) || 2)));
  const airByte = asmByte(physics.airJumpImpulseByte);
  const airPx = Math.max(1, Math.floor(physics.airJumpPx) || jumpPx);

  return `.check_jump:
    ; DOUBLE JUMP: reset the jump counter whenever the player is grounded.
    ld a, (player_flags)
    and #01
    jp z, .cj_airborne
    xor a
    ld (player_jumps_used), a
.cj_airborne:
    bit 0, c
    jp nz, .jump_pressed
    bit 5, c
    jp z, .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity        ; key held -> no repeat
    ld a, (player_flags)
    and #01
    jp nz, .jump_from_ground
    ; Airborne: spend one extra jump if any remain (counter < maxJumps).
    ld a, (player_jumps_used)
    cp ${maxJumps}
    jp nc, .apply_gravity
    ld a, ${airByte}              ; -${airPx} px/frame mid-air jump velocity
    ld (player_vy), a
    ld a, (player_jumps_used)
    inc a
    ld (player_jumps_used), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_from_ground:
    ld a, ${jumpByte}              ; -${jumpPx} px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jumps_used), a     ; ground jump counts as the first jump
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a`;
}
