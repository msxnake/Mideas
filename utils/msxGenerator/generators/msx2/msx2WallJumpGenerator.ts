/**
 * MSX2 wall_jump skill generator (Z80 ASM).
 *
 * Implements two sub-behaviours that share 4 bytes of RAM:
 *  - `wall_slide`: detected via touching-wall probe (left/right); caps
 *    `gravityVel` to `wallSlideSpeed` while the player holds the direction
 *    key into the wall. Reset on landing.
 *  - `wall_jump_kick`: triggered from `wall_slide` when jump key fires;
 *    applies `wallJumpPower88` (8.8, sign-extended negative) and locks vx
 *    to `±wallJumpHorizontal` for `lockFrames` frames.
 *
 * The runtime follows the same conventions as `msx2DashGenerator.ts`:
 *  - All `msx2_collision_at_pixel` calls are wrapped in `push de / ... / pop de`
 *    (that routine clobbers AF/DE/HL — see LESSONS_LEARNED 2026-06-10 fix B).
 *  - No `buildMsx2Box2PlayerHookAsm` is used: box2 cells stay solid through
 *    the `msx2_collision_at_pixel` runtime override (LESSONS_LEARNED
 *    2026-06-10 fix C, also documented in `msx2Screen4Generator.ts:3725`).
 *  - No `or a` between SUB and `jp c/nc` (LESSONS_LEARNED 2026-06-10 fix D:
 *    the carry flag is part of the caller's contract).
 *  - The wall_slide cap polarity is verified against LESSONS_LEARNED
 *    2026-06-10 fix F: `cp b; jp c, .cap_store` means "if current > cap,
 *    apply cap" — that is a CAP, not an ASSIGN. (Wall_slide=0 = cling =
 *    cap to 0.)
 *  - Layout addresses come from `resolveMsx2SkillExtensionRamBase` via the
 *    `msx2SkillRamLayout` module. Hardcoding EQUs is forbidden
 *    (LESSONS_LEARNED 2026-06-08 + 2026-06-10).
 *
 * Smoke test status: PENDING end-to-end OpenMSX. Structural test lives in
 * `scripts/check_skill_params_contract.cjs` (added in Fase 6).
 */

import { Msx2WallJumpConfig } from '../../../msx2PlatformPhysics';
import { Msx2SkillRamOptions, resolveMsx2SkillExtensionRamBase } from './msx2SkillRamLayout';
import { buildMsx2SkillPressedRoutine } from './msx2SkillControlsGenerator';

/** Total bytes of RAM used by the wall_jump skill (slide_side + lock_timer + lock_vx + key_lock). */
export const MSX2_WALL_JUMP_RAM_BYTES = 4;

/** Sentinel value for "no wall in contact" (must fit in 1 unsigned byte). */
const MSX2_WALL_SLIDE_NONE = 0xff;

function formatAsmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function formatAsmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Computes the lock duration (in frames) for the wall_jump kick.
 *
 * Rule: lock = max(4, horizontal * 2), capped at 16. This guarantees the
 * player crosses at least 8 px away from the wall before regaining control
 * (4 px/frame * 2 frames = 8 px at minimum), and never more than 32 px.
 */
function computeWallJumpLockFrames(horizontalPx: number): number {
  return Math.max(4, Math.min(16, Math.floor(horizontalPx * 2) || 8));
}

/**
 * Resolves the base address of the wall_jump RAM block (4 bytes) given the
 * current skill chain. Always passes `dashEnabled = true` and
 * `teleportEnabled = true` because glide (the previous link) is enabled iff
 * glide config says so, and the wall_jump block always comes after glide.
 *
 * NOTE: glideEnabled is implicit in the caller via `options.glideEnabled`-
 * like wiring; if a project has glide but not wall_jump, the wall_jump
 * block simply is not allocated.
 */
export function resolveMsx2WallJumpRamBase(options: Msx2SkillRamOptions): number {
  return resolveMsx2SkillExtensionRamBase(options);
}

function buildWallJumpPressedRoutine(config: Msx2WallJumpConfig): string {
  // wall_jump shares the jump key with the core jump action. We wrap the
  // existing msx2_control_jump_pressed via buildMsx2SkillPressedRoutine so
  // the binding (override or default 'jump') is honoured consistently with
  // dash and teleport.
  return buildMsx2SkillPressedRoutine(
    'msx2_control_wall_jump_pressed',
    'wall jump skill',
    config.primaryControl,
    'none',
  );
}

/** EQUs for the 4 wall_jump RAM variables, anchored at `ramBase`. */
export function buildMsx2WallJumpEquates(ramBase: number): string {
  return `msx2_wall_slide_side EQU ${formatAsmWord(ramBase)}
msx2_wall_jump_lock_timer EQU ${formatAsmWord(ramBase + 1)}
msx2_wall_jump_lock_vx EQU ${formatAsmWord(ramBase + 2)}
msx2_wall_jump_key_lock EQU ${formatAsmWord(ramBase + 3)}
`;
}

/** Reset all 4 wall_jump RAM bytes to 0 (called from init clears). */
export function buildMsx2WallJumpInitClearAsm(): string {
  return `    ld a, ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld (msx2_wall_jump_key_lock), a
`;
}

/** Clear wall_slide_side + lock state (called from screen transition reset). */
export function buildMsx2WallJumpResetAsm(): string {
  return `    ld a, ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld (msx2_wall_jump_key_lock), a
`;
}

/**
 * Clears wall_slide_side and lock state on landing. Different from a full
 * reset because the key_lock may legitimately be 0 already; we still write
 * 0 to it for determinism.
 */
export function buildMsx2WallJumpLandClearAsm(config: Msx2WallJumpConfig): string {
  if (!config.enabled) return '';
  return `    ld a, ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
`;
}

/**
 * Detects which side (if any) the player is touching at the current
 * sprite position. Returns A = 0 (left wall), 1 (right wall), or
 * MSX2_WALL_SLIDE_NONE (no contact).
 *
 * Probes use the sprite's own edge pixels (X for left, X+15 for right) at
 * mid-height (Y+8). This is safe because the horizontal movement
 * guarantees the sprite never sits inside a solid cell; the only time the
 * edge pixel is solid is when the sprite is exactly touching a wall.
 *
 * INPUT: msx2_player_sprite_x (byte), msx2_player_sprite_y (byte).
 * OUTPUT: A in {0, 1, 0xFF}.
 * DESTROYS: AF, B, C, DE, HL (clobbers via msx2_collision_at_pixel).
 * PRESERVES: IX, IY.
 */
function buildWallJumpDetectContactAsm(platformMoveSpeed: number): string {
  const speedByte = formatAsmByte(platformMoveSpeed);
  return `msx2_wall_jump_detect_contact:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_wall_jump_detect_contact
    ; PURPOSE: Probes left and right for solid wall contact using the
    ;   same probe offsets as move_hardware_sprite_left/right. This
    ;   ensures detection fires when the player is blocked by a wall
    ;   (the movement code stops the player platformMoveSpeed pixels
    ;   short, so the exact sprite edge is never inside a solid cell).
    ;   Returns A=0 if left wall, A=1 if right wall, A=0xFF if none.
    ; NOTES: msx2_collision_at_pixel clobbers AF/DE/HL. BC inputs survive.
    ; ------------------------------------------------------------
    push de
    ; Left probe: same X as move_hardware_sprite_left (X - speed)
    ld a, (msx2_player_sprite_x)
    sub ${speedByte}
    jp c, .left_probe_skip
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    or a
    jr nz, .wall_contact_left
.left_probe_skip:
    ; Right probe: same X as move_hardware_sprite_right (X + speed + 15)
    ld a, (msx2_player_sprite_x)
    add a, ${speedByte}
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    or a
    jr nz, .wall_contact_right
    pop de
    ld a, ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ret
.wall_contact_left:
    pop de
    xor a
    ret
.wall_contact_right:
    pop de
    ld a, 1
    ret
`;
}

/**
 * Clamps the player's gravityVel high byte to `wallSlideSpeed` while
 * wall_slide is active and the player is in the air.
 *
 * Polarity: `gravityVel` grows in the positive direction (down). When
 * `wallSlideSpeed` is 0, the cap sets the high byte to 0 (total cling).
 * When `wallSlideSpeed` is non-zero, the cap applies only if the current
 * fall speed EXCEEDS the cap (this avoids re-accelerating slow falls).
 *
 * INPUT: msx2_wall_slide_side in {0, 1} (0xFF = inactive, skipped).
 * OUTPUT: msx2_player_gravity_vel may be clamped, msx2_wall_jump_lock_vx
 *   is not touched.
 * DESTROYS: AF, B, HL.
 * PRESERVES: C, D, E, IX, IY.
 */
function buildWallJumpSlideClampAsm(config: Msx2WallJumpConfig): string {
  const slideSpeed = formatAsmByte(config.wallSlideSpeed);
  return `msx2_wall_jump_slide_clamp:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_wall_jump_slide_clamp
    ; PURPOSE: Caps gravityVel high byte to wallSlideSpeed when
    ;   wall_slide is active and the player is falling. Skips when
    ;   wall_slide is inactive (msx2_wall_slide_side == 0xFF).
    ; NOTES: Polarities:
    ;   - Skip if slide side == 0xFF (cp #FF; ret z)
    ;   - Skip if grounded (player_flags bit 0)
    ;   - Skip if not falling (gravityVel high bit 7 = negative = rising)
    ;   - Cap if current fall speed > slideSpeed (cp b; jp c, .cap_store)
    ;   The cp/jp c is a CAP, not an ASSIGN — the cap only fires when the
    ;   current fall speed exceeds the cap. See LESSONS_LEARNED 2026-06-10
    ;   fix F for the glide precedent.
    ; ------------------------------------------------------------
    ld a, (msx2_wall_slide_side)
    cp ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ret z
    ld a, (msx2_player_flags)
    bit 0, a
    ret nz
    ld hl, msx2_player_gravity_vel
    inc hl
    ld a, (hl)
    bit 7, a
    ret nz
    ld b, a
    ld a, ${slideSpeed}
    cp b
    jp c, .wall_slide_cap_store
    ; Current fall <= cap, nothing to do. Restore A and return.
    ret
.wall_slide_cap_store:
    ld (hl), a
    dec hl
    xor a
    ld (hl), a
    ret
`;
}

/**
 * Main runtime: detects contact, runs wall_slide clamp, handles wall_jump
 * kick trigger, and steps the horizontal lock.
 *
 * Wall slide clamp is exposed separately (buildWallJumpSlideClampAsm) so
 * the generator can also wire it into the gravity path via
 * buildMsx2WallJumpGravityHookAsm. The detect-contact + lock-step happen
 * once per frame from the input gate.
 */
function buildWallJumpKickAndStepAsm(config: Msx2WallJumpConfig): string {
  // wallJumpPower88 is 8.8, sign-extended negative (clampMsx2JumpImpulse88
  // returns a 16-bit value). The high byte is the signed magnitude; we
  // write it directly into the high byte of msx2_player_gravity_vel
  // (matching `applyMsx2JumpImpulseToEntity` in the JS parity layer).
  const wallJumpPowerSignedHi = formatAsmByte((config.wallJumpPower88 >> 8) & 0xff);
  const wallJumpHorizontal = formatAsmByte(config.wallJumpHorizontal);
  const lockFrames = formatAsmByte(computeWallJumpLockFrames(config.wallJumpHorizontal));
  const requireKeyRelease = config.requireKeyRelease;

  const keyReleaseGate = requireKeyRelease
    ? `    ld a, (msx2_wall_jump_key_lock)
    or a
    jp nz, .wall_kick_blocked
`
    : '';

  const releaseLockRoutine = requireKeyRelease
    ? `msx2_wall_jump_release_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_wall_jump_release_lock
    ; PURPOSE: Clears the wall_jump key lock once the jump input is
    ;   released. Without this the key_lock set by the first kick stays
    ;   1 forever and only ONE wall jump is possible per life (bug found
    ;   in the 2026-06-11 OpenMSX smoke; same pattern as
    ;   msx2_dash_release_lock).
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF, BC, DE (via msx2_control_wall_jump_pressed). PRESERVES: HL.
    ; ------------------------------------------------------------
    call msx2_control_wall_jump_pressed
    or a
    ret nz
    xor a
    ld (msx2_wall_jump_key_lock), a
    ret

`
    : '';

  return `${releaseLockRoutine}msx2_try_wall_jump_kick:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_try_wall_jump_kick
    ; PURPOSE: If wall_slide is active and the jump key is pressed
    ;   (with optional key-release lock), apply the wall_jump kick:
    ;   set msx2_player_gravity_vel = -wallJumpPower (8.8), arm the
    ;   horizontal lock with signed vx = ±wallJumpHorizontal, and
    ;   set the key_lock if requireKeyRelease is enabled.
    ; NOTES: Caller must have already updated msx2_wall_slide_side via
    ;   msx2_wall_jump_detect_contact. This routine does not probe.
    ; DESTROYS: AF, B, DE, HL.
    ; PRESERVES: C, IX, IY.
    ; ------------------------------------------------------------
    ld a, (msx2_wall_slide_side)
    cp ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ret z
    ; Must be airborne (bit 0 of player_flags is grounded)
    ld a, (msx2_player_flags)
    bit 0, a
    ret nz
    call msx2_control_wall_jump_pressed
    or a
    jp z, .wall_kick_blocked
${keyReleaseGate}    ; Apply wall_jump kick.
    ; gravityVel: high byte = signed -wallJumpPower (negative = up), low = 0
    ld hl, msx2_player_gravity_vel
    ld a, ${wallJumpPowerSignedHi}
    inc hl
    ld (hl), a
    dec hl
    xor a
    ld (hl), a
    ; Compute signed lock_vx based on which wall we are on.
    ; Left wall (side=0) -> push right -> vx = +wallJumpHorizontal
    ; Right wall (side=1) -> push left -> vx = -wallJumpHorizontal
    ld a, (msx2_wall_slide_side)
    or a
    jr z, .wall_kick_push_right
    ; side == 1 (right wall): vx = -N via cpl/inc
    ld a, ${wallJumpHorizontal}
    cpl
    inc a
    jr .wall_kick_store_vx
.wall_kick_push_right:
    ld a, ${wallJumpHorizontal}
.wall_kick_store_vx:
    ld (msx2_wall_jump_lock_vx), a
    ld a, ${lockFrames}
    ld (msx2_wall_jump_lock_timer), a
${requireKeyRelease ? `    ld a, 1
    ld (msx2_wall_jump_key_lock), a
` : ''}    ; Clear slide state so we don't immediately re-trigger.
    ld a, ${formatAsmByte(MSX2_WALL_SLIDE_NONE)}
    ld (msx2_wall_slide_side), a
    ret
.wall_kick_blocked:
    ret

msx2_step_wall_jump_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_step_wall_jump_lock
    ; PURPOSE: While lock_timer > 0, advance sprite_x by lock_vx (which
    ;   is stored SIGNED: +N for right motion, 0x100-N for left motion)
    ;   and decrement the timer. When the timer reaches 0, clear
    ;   lock_vx to avoid stale data leaking.
    ; NOTES: The MSX2 player runtime does not store a persistent vx
    ;   variable; horizontal motion is applied directly to sprite_x by
    ;   'move_hardware_sprite_left/right'. To "lock vx" during the
    ;   wall_jump kick, we re-implement the motion here (same approach
    ;   as dash in msx2_step_dash_movement).
    ;   'lock_vx' is signed: +wallJumpHorizontal for right kick,
    ;   0x100-wallJumpHorizontal for left kick. 'add a, (lock_vx)' with
    ;   a "negative" lock_vx (>= 0x80) automatically subtracts because
    ;   the carry is discarded and the 2's-complement representation
    ;   wraps modulo 256.
    ; INPUT: msx2_wall_jump_lock_timer, msx2_wall_jump_lock_vx.
    ; OUTPUT: msx2_player_sprite_x advanced, dx synced with kick dir.
    ; DESTROYS: AF, B, HL.
    ; PRESERVES: C, D, E, IX, IY.
    ; ------------------------------------------------------------
    ld a, (msx2_wall_jump_lock_timer)
    or a
    ret z
    ; Sync facing direction with the lock's sign bit. high bit = 1 -> left.
    ld a, (msx2_wall_jump_lock_vx)
    bit 7, a
    ld a, 0
    jr nz, .wall_lock_face_left
    inc a
.wall_lock_face_left:
    ld (msx2_player_sprite_dx), a
    ; sprite_x += lock_vx (signed via 2's-complement wrap).
    ; NOTE: add a, (nnnn) is NOT a valid Z80 instruction; we load lock_vx through HL.
    ld hl, msx2_wall_jump_lock_vx
    ld a, (msx2_player_sprite_x)
    add a, (hl)
    ld (msx2_player_sprite_x), a
    ; Decrement lock_timer and clear lock_vx if it just hit 0.
    ld a, (msx2_wall_jump_lock_timer)
    dec a
    ld (msx2_wall_jump_lock_timer), a
    or a
    ret nz
    xor a
    ld (msx2_wall_jump_lock_vx), a
    ret
`;
}

export function buildMsx2WallJumpRuntimeAsm(config: Msx2WallJumpConfig, platformMoveSpeed: number): string {
  if (!config.enabled) return '';

  return `${buildWallJumpPressedRoutine(config)}
${buildWallJumpDetectContactAsm(platformMoveSpeed)}
${buildWallJumpSlideClampAsm(config)}
${buildWallJumpKickAndStepAsm(config)}
`;
}

/**
 * Input gate: detect contact, try to start a wall_jump kick, then step the
 * horizontal lock. Inserted into `update_hardware_sprite_input` between the
 * dash gate and the GTSTCK switch.
 *
 * The slide clamp lives in a separate hook (buildMsx2WallJumpGravityHookAsm)
 * so it runs in the gravity path; this gate owns detect + kick + step only.
 */
export function buildMsx2WallJumpInputGateAsm(config: Msx2WallJumpConfig): string {
  if (!config.enabled) return '';
  return `    ; wall_jump: detect contact, release key lock, try kick, step horizontal lock.
    call msx2_wall_jump_detect_contact
    ld (msx2_wall_slide_side), a
${config.requireKeyRelease ? `    call msx2_wall_jump_release_lock
` : ''}    call msx2_try_wall_jump_kick
    call msx2_step_wall_jump_lock
`;
}

/**
 * Gravity path hook: applies the wall_slide cap to gravityVel. Inserted
 * before `apply_vertical_delta` in the same style as
 * `msx2_glideGravityHookAsm`.
 */
export function buildMsx2WallJumpGravityHookAsm(config: Msx2WallJumpConfig): string {
  if (!config.enabled) return '';
  return `    call msx2_wall_jump_slide_clamp
`;
}

/**
 * Damage-skip ASM: when the wall_jump lock is active and
 * `requireKeyRelease` is enabled, the player is invulnerable during the
 * kick. Returns `ret nz` so the enemy-damage handler skips the hit.
 */
export function buildMsx2WallJumpDamageSkipAsm(config: Msx2WallJumpConfig): string {
  if (!config.enabled || !config.requireKeyRelease) return '';
  return `    ld a, (msx2_wall_jump_lock_timer)
    or a
    ret nz
`;
}

/** Hazard-skip ASM: same logic as damage-skip but for tile hazards. */
export function buildMsx2WallJumpHazardSkipAsm(config: Msx2WallJumpConfig): string {
  if (!config.enabled || !config.requireKeyRelease) return '';
  return `    ld a, (msx2_wall_jump_lock_timer)
    or a
    jp nz, .no_effect
`;
}
