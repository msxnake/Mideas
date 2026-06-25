import { Msx2AirDashConfig, Msx2BitmapKeyboardBinding } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room AIR DASH skill.
 *
 * This is a bitmap-room native port: it uses the same player-facing config
 * contract as SCREEN 4, but it does not call SCREEN 4 labels. Movement is done
 * with bitmap_try_move_x so the existing 16x12 room collision cache remains the
 * single source of truth.
 *
 * RAM is placed after the bitmap-room dash block when dash is enabled. With
 * dash active this is #C0DD..#C0E0; without dash it starts at #C0D9.
 */

export const MSX2_BITMAP_AIR_DASH_RAM_BYTES = 4;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapAirDashEnabled(config: Msx2AirDashConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

export function buildBitmapAirDashEquates(
  config: Msx2AirDashConfig | undefined,
  ramBase: number,
): string {
  if (!bitmapAirDashEnabled(config)) return '';
  return `; --- AIR DASH skill runtime state (4 bytes) ---
bitmap_air_dash_timer     EQU ${asmWord(ramBase)}
bitmap_air_dash_cooldown  EQU ${asmWord(ramBase + 1)}
bitmap_air_dash_lock      EQU ${asmWord(ramBase + 2)}
bitmap_air_dash_direction EQU ${asmWord(ramBase + 3)}
`;
}

export function buildBitmapAirDashInitClearAsm(config: Msx2AirDashConfig | undefined): string {
  if (!bitmapAirDashEnabled(config)) return '';
  return `    xor a
    ld (bitmap_air_dash_timer), a
    ld (bitmap_air_dash_cooldown), a
    ld (bitmap_air_dash_lock), a
    ld (bitmap_air_dash_direction), a
`;
}

function buildBitmapAirDashKeyCheck(key: Msx2BitmapKeyboardBinding | undefined): string {
  if (!key) {
    return `    xor a
    ret
`;
  }
  return `    in a, (PPI_C)
    and #F0
    or ${key.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(key.mask)}
    ret z
`;
}

function buildBitmapAirDashPressedRoutine(config: Msx2AirDashConfig): string {
  const primaryKey = config.primaryKeyboard ?? { label: 'M', row: 4, mask: 0x04 };
  const secondaryKey = config.secondaryControl !== 'none' ? config.secondaryKeyboard : undefined;
  const comboLabel = secondaryKey ? `${primaryKey.label}+${secondaryKey.label}` : primaryKey.label;
  const rows = secondaryKey && secondaryKey.row !== primaryKey.row
    ? `${primaryKey.row}/${secondaryKey.row}`
    : String(primaryKey.row);
  const secondaryCheck = secondaryKey ? buildBitmapAirDashKeyCheck(secondaryKey) : '';
  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_air_dash_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the configured air_dash input (${comboLabel}) via PPI.
; INPUT: none.
; OUTPUT: A = 1 when pressed, A = 0 otherwise (Z set when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row ${rows} on PPI_C. update_player_movement
;   re-selects row 8 next frame, so the transient selection is safe.
; ------------------------------------------------------------
bitmap_air_dash_pressed:
${buildBitmapAirDashKeyCheck(primaryKey)}${secondaryCheck}    ld a, 1
    ret
`;
}

/**
 * Main-loop gate. Returns carry set when air_dash consumed this frame, so the
 * caller can skip normal movement/gravity until the burst ends.
 */
export function buildBitmapAirDashGateAsm(config: Msx2AirDashConfig | undefined): string {
  if (!bitmapAirDashEnabled(config)) return '';
  return `    call bitmap_try_start_air_dash
    call bitmap_step_air_dash_movement
    jp c, .skip_player_movement
`;
}

export function buildBitmapAirDashRuntimeAsm(
  config: Msx2AirDashConfig | undefined,
  options: { lockGroundDashOnStart?: boolean } = {},
): string {
  if (!config || !bitmapAirDashEnabled(config)) return '';

  const airDashSpeed = Math.max(1, Math.min(24, Math.floor(config.airDashSpeed) || 6));
  const airDashDuration = asmByte(config.airDashDuration);
  const airDashCooldown = asmByte(config.airDashCooldown);
  const lockGate = config.requireKeyRelease
    ? `    ld a, (bitmap_air_dash_lock)
    or a
    jp nz, .air_dash_start_blocked
`
    : '';
  const armLock = config.requireKeyRelease
    ? `    ld a, 1
    ld (bitmap_air_dash_lock), a
`
    : '';
  const lockGroundDash = options.lockGroundDashOnStart
    ? `    ld a, 1
    ld (bitmap_dash_lock), a
`
    : '';

  return `${buildBitmapAirDashPressedRoutine(config)}
; ------------------------------------------------------------
; FUNCTION: bitmap_air_dash_release_lock
; ------------------------------------------------------------
; PURPOSE: Clears the requireKeyRelease lock once the air_dash key is released.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_air_dash_pressed.
; SIDE EFFECTS: Updates bitmap_air_dash_lock in RAM.
; ------------------------------------------------------------
bitmap_air_dash_release_lock:
    call bitmap_air_dash_pressed
    or a
    ret nz
    xor a
    ld (bitmap_air_dash_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_air_dash_cooldown
; ------------------------------------------------------------
; PURPOSE: Decrements the air_dash cooldown when active.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_air_dash_cooldown:
    ld a, (bitmap_air_dash_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_air_dash_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_air_dash_grounded
; ------------------------------------------------------------
; PURPOSE: True when a solid 16x16 cell sits directly below the player feet.
; INPUT: player_x, player_y. OUTPUT: A = 1 grounded, A = 0 airborne (Z when airborne).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_air_dash_grounded:
    ld a, (player_x)
    add a, 8
    ld b, a
    ld a, (player_y)
    add a, 16
    ld c, a
    call bitmap_probe_solid
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_air_dash_airborne
; ------------------------------------------------------------
; PURPOSE: Returns true when the player is not grounded.
; INPUT: player_flags plus player_x/player_y for the direct foot probe.
; OUTPUT: A=1 airborne, A=0 grounded (Z when grounded).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_air_dash_grounded.
; NOTES: The cached grounded flag wins when set; otherwise bitmap_air_dash_grounded
;   probes the current collision map under the player's feet.
; ------------------------------------------------------------
bitmap_air_dash_airborne:
    ld a, (player_flags)
    bit 0, a
    jp nz, .air_dash_grounded
    call bitmap_air_dash_grounded
    or a
    jp nz, .air_dash_grounded
    ld a, 1
    ret
.air_dash_grounded:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_air_dash
; ------------------------------------------------------------
; PURPOSE: Ticks cooldown/lock and arms an air dash when input, cooldown and
;   airborne state allow it. Direction is latched from player_facing.
; INPUT: none.
; OUTPUT: bitmap_air_dash_timer > 0 when started.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_tick_air_dash_cooldown, bitmap_air_dash_release_lock,
;   bitmap_air_dash_airborne, bitmap_air_dash_pressed.
; SIDE EFFECTS: Updates air_dash RAM and clears vertical velocity for the burst.
; ------------------------------------------------------------
bitmap_try_start_air_dash:
    call bitmap_tick_air_dash_cooldown
    ld a, (bitmap_air_dash_timer)
    or a
    ret nz
    call bitmap_air_dash_release_lock
    call bitmap_air_dash_airborne
    or a
    jp z, .air_dash_start_blocked
    call bitmap_air_dash_pressed
    or a
    jp z, .air_dash_start_blocked
${lockGate}    ld a, (bitmap_air_dash_cooldown)
    or a
    jp nz, .air_dash_start_blocked
    ld a, (player_facing)
    ld (bitmap_air_dash_direction), a
    ld a, ${airDashDuration}
    ld (bitmap_air_dash_timer), a
    ld a, ${airDashCooldown}
    ld (bitmap_air_dash_cooldown), a
${armLock}${lockGroundDash}    xor a
    ld (player_vy), a
    ret
.air_dash_start_blocked:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_air_dash_movement
; ------------------------------------------------------------
; PURPOSE: Advances an active air dash. Moves ${airDashSpeed} px horizontally
;   via 1px bitmap_try_move_x steps and skips normal gravity this frame.
; INPUT: bitmap_air_dash_timer/direction.
; OUTPUT: Carry SET when air_dash consumed this frame; carry CLEAR when idle.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_try_move_x.
; SIDE EFFECTS: Updates player_x and decrements bitmap_air_dash_timer.
; NOTES: bitmap_try_move_x clobbers BC, so the loop counter is wrapped with
;   PUSH/POP BC on every pixel step.
; ------------------------------------------------------------
bitmap_step_air_dash_movement:
    ld a, (bitmap_air_dash_timer)
    or a
    jp z, .air_dash_idle
    dec a
    ld (bitmap_air_dash_timer), a
    xor a
    ld (player_vy), a
    ld a, (bitmap_air_dash_direction)
    or a
    jp z, .air_dash_step_left
.air_dash_step_right:
    ld b, ${airDashSpeed}
.air_dash_right_loop:
    push bc
    ld a, #01
    call bitmap_try_move_x
    pop bc
    djnz .air_dash_right_loop
    scf
    ret
.air_dash_step_left:
    ld b, ${airDashSpeed}
.air_dash_left_loop:
    push bc
    ld a, #FF
    call bitmap_try_move_x
    pop bc
    djnz .air_dash_left_loop
    scf
    ret
.air_dash_idle:
    or a
    ret
`;
}
