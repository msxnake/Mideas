/**
 * MSX2 air_dash skill generator (Z80 ASM).
 *
 * Implements a horizontal dash that can start only while the player is not
 * grounded. It intentionally owns separate RAM from ground dash so projects
 * can tune cooldown/duration independently and bind either skill separately.
 *
 * Register-safety notes:
 *  - Collision probes wrap `msx2_collision_at_pixel` with push/pop because
 *    that routine clobbers DE; the target X lives in E across the call.
 *  - The active-frame hook skips vertical physics while the air dash timer is
 *    running, so the player gets a short suspended burst instead of blending
 *    with gravity.
 */

import { Msx2AirDashConfig } from '../../../msx2PlatformPhysics';
import { Msx2SkillRamOptions, resolveMsx2SkillExtensionRamBase } from './msx2SkillRamLayout';
import { buildMsx2SkillPressedRoutine } from './msx2SkillControlsGenerator';

/** timer + cooldown + key lock + direction. */
export const MSX2_AIR_DASH_RAM_BYTES = 4;

function formatAsmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function formatAsmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function resolveMsx2AirDashRamBase(options: Msx2SkillRamOptions): number {
  return resolveMsx2SkillExtensionRamBase(options);
}

function buildAirDashPressedRoutine(config: Msx2AirDashConfig): string {
  return buildMsx2SkillPressedRoutine(
    'msx2_control_air_dash_pressed',
    'air dash skill',
    config.primaryControl,
    config.secondaryControl,
  );
}

function buildAirDashDirectionResolveAsm(): string {
  return `    ld a, (msx2_player_sprite_dx)
    ld (msx2_air_dash_direction), a
`;
}

export function buildMsx2AirDashEquates(ramBase: number): string {
  return `msx2_air_dash_timer EQU ${formatAsmWord(ramBase)}
msx2_air_dash_cooldown EQU ${formatAsmWord(ramBase + 1)}
msx2_air_dash_lock EQU ${formatAsmWord(ramBase + 2)}
msx2_air_dash_direction EQU ${formatAsmWord(ramBase + 3)}
`;
}

export function buildMsx2AirDashRuntimeAsm(
  config: Msx2AirDashConfig,
  patrolBounds: { minX: number; maxX: number },
  options: {
    lockGroundDashOnStart?: boolean;
  } = {},
): string {
  if (!config.enabled) return '';

  const airDashSpeed = formatAsmByte(config.airDashSpeed);
  const airDashDuration = formatAsmByte(config.airDashDuration);
  const airDashCooldown = formatAsmByte(config.airDashCooldown);
  const airDashLockGate = config.requireKeyRelease
    ? `    ld a, (msx2_air_dash_lock)
    or a
    jp nz, .air_dash_start_blocked
`
    : '';
  const lockGroundDash = options.lockGroundDashOnStart
    ? `    ld a, 1
    ld (msx2_dash_lock), a
`
    : '';

  return `${buildAirDashPressedRoutine(config)}
msx2_air_dash_player_grounded:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_air_dash_player_grounded
    ; PURPOSE: Detects whether a solid cell is directly below the player feet.
    ; INPUT: none.
    ; OUTPUT: A=1 grounded, A=0 airborne.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: msx2_collision_at_pixel.
    ; SIDE EFFECTS: none.
    ; NOTES: Uses direct foot probes instead of msx2_player_flags because that
    ;   flag can be stale before the vertical physics pass refreshes it.
    ; ------------------------------------------------------------
    ld a, (msx2_player_sprite_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    or a
    jp nz, .air_dash_grounded_yes
    ld a, (msx2_player_sprite_x)
    add a, 12
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    or a
    jp nz, .air_dash_grounded_yes
    xor a
    ret
.air_dash_grounded_yes:
    ld a, 1
    ret

msx2_tick_air_dash_cooldown:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_tick_air_dash_cooldown
    ; PURPOSE: Decrements the air dash cooldown timer when active.
    ; INPUT: none.
    ; OUTPUT: none.
    ; DESTROYS: AF.
    ; PRESERVES: BC, DE, HL, IX, IY.
    ; CALLS: none.
    ; SIDE EFFECTS: Updates msx2_air_dash_cooldown in RAM.
    ; NOTES: Runs once per input frame while air_dash is enabled.
    ; ------------------------------------------------------------
    ld a, (msx2_air_dash_cooldown)
    or a
    ret z
    dec a
    ld (msx2_air_dash_cooldown), a
    ret

msx2_air_dash_release_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_air_dash_release_lock
    ; PURPOSE: Clears the air dash key lock once input is released.
    ; INPUT: none.
    ; OUTPUT: none.
    ; DESTROYS: AF, BC, DE.
    ; PRESERVES: HL, IX, IY.
    ; CALLS: msx2_control_air_dash_pressed.
    ; SIDE EFFECTS: Updates msx2_air_dash_lock in RAM.
    ; NOTES: Keeps repeated air dashes from retriggering while the key is held.
    ; ------------------------------------------------------------
    call msx2_control_air_dash_pressed
    or a
    ret nz
    xor a
    ld (msx2_air_dash_lock), a
    ret

msx2_try_start_air_dash:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_try_start_air_dash
    ; PURPOSE: Starts air_dash only when input/cooldown/lock allow it and
    ;   the player is not grounded.
    ; INPUT: none.
    ; OUTPUT: msx2_air_dash_timer > 0 when a dash started.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: msx2_tick_air_dash_cooldown, msx2_air_dash_release_lock,
    ;   msx2_control_air_dash_pressed.
    ; SIDE EFFECTS: Updates air_dash timer/cooldown/lock/direction and clears
    ;   msx2_player_gravity_vel so the burst is horizontal.
    ; NOTES: Grounded is bit 0 of msx2_player_flags; ground dash owns that case.
    ; ------------------------------------------------------------
    call msx2_tick_air_dash_cooldown
    ld a, (msx2_air_dash_timer)
    or a
    ret nz
    call msx2_air_dash_release_lock
    call msx2_air_dash_player_grounded
    or a
    jp nz, .air_dash_start_blocked
    call msx2_control_air_dash_pressed
    or a
    jp z, .air_dash_start_blocked
${airDashLockGate}    ld a, (msx2_air_dash_cooldown)
    or a
    jp nz, .air_dash_start_blocked
${buildAirDashDirectionResolveAsm()}    ld a, ${airDashDuration}
    ld (msx2_air_dash_timer), a
    ld a, ${airDashCooldown}
    ld (msx2_air_dash_cooldown), a
${config.requireKeyRelease ? `    ld a, 1
    ld (msx2_air_dash_lock), a
` : ''}${lockGroundDash}    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ret
.air_dash_start_blocked:
    ret

msx2_step_air_dash_movement:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_step_air_dash_movement
    ; PURPOSE: Moves the player horizontally during active air_dash frames,
    ;   clamped to patrol bounds and blocked by solid cells.
    ; INPUT: none.
    ; OUTPUT: msx2_player_sprite_x/_dx updated when movement succeeds.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: msx2_collision_at_pixel.
    ; SIDE EFFECTS: Decrements msx2_air_dash_timer and clears gravity velocity.
    ; NOTES: Target X is preserved in E across collision probes with PUSH/POP.
    ; ------------------------------------------------------------
    ld a, (msx2_air_dash_timer)
    or a
    ret z
    dec a
    ld (msx2_air_dash_timer), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, (msx2_air_dash_direction)
    or a
    jp nz, .air_dash_step_right
.air_dash_step_left:
    ld a, (msx2_player_sprite_x)
    cp ${formatAsmByte(patrolBounds.minX)}
    jp z, .air_dash_step_done
    sub ${airDashSpeed}
    jp nc, .air_dash_left_check_min
    ld a, ${formatAsmByte(patrolBounds.minX)}
    jp .air_dash_left_target
.air_dash_left_check_min:
    cp ${formatAsmByte(patrolBounds.minX)}
    jp nc, .air_dash_left_target
    ld a, ${formatAsmByte(patrolBounds.minX)}
.air_dash_left_target:
    ld e, a
    ld b, e
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    push de
    call msx2_collision_at_pixel
    pop de
    jp nz, .air_dash_step_done
    ld a, e
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp .air_dash_step_done
.air_dash_step_right:
    ld a, (msx2_player_sprite_x)
    add a, ${airDashSpeed}
    jp nc, .air_dash_right_check_max
    ld a, ${formatAsmByte(patrolBounds.maxX)}
    jp .air_dash_right_target
.air_dash_right_check_max:
    cp ${formatAsmByte(patrolBounds.maxX + 1)}
    jp c, .air_dash_right_target
    ld a, ${formatAsmByte(patrolBounds.maxX)}
.air_dash_right_target:
    ld e, a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    push de
    call msx2_collision_at_pixel
    pop de
    jp nz, .air_dash_step_done
    ld a, e
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
.air_dash_step_done:
    ret

`;
}

export function buildMsx2AirDashInputGateAsm(config: Msx2AirDashConfig): string {
  if (!config.enabled) return '';
  return `    ld a, (msx2_air_dash_timer)
    or a
    jp nz, .air_dash_active_input
    call msx2_try_start_air_dash
    ld a, (msx2_air_dash_timer)
    or a
    jp nz, .air_dash_active_input
`;
}

export function buildMsx2AirDashActiveFrameAsm(config: Msx2AirDashConfig): string {
  if (!config.enabled) return '';
  return `.air_dash_active_input:
    call msx2_step_air_dash_movement
    jp upload_hardware_sprite_attrs
`;
}

export function buildMsx2AirDashDamageSkipAsm(config: Msx2AirDashConfig): string {
  if (!config.enabled || !config.invulnerable) return '';
  return `    ld a, (msx2_air_dash_timer)
    or a
    ret nz
`;
}

export function buildMsx2AirDashHazardSkipAsm(config: Msx2AirDashConfig): string {
  if (!config.enabled || !config.invulnerable) return '';
  return `    ld a, (msx2_air_dash_timer)
    or a
    jp nz, .no_effect
`;
}

export function buildMsx2AirDashInitClearAsm(): string {
  return `    xor a
    ld (msx2_air_dash_timer), a
    ld (msx2_air_dash_cooldown), a
    ld (msx2_air_dash_lock), a
    ld (msx2_air_dash_direction), a
`;
}
