import { Msx2PowerStompConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room POWER STOMP skill.
 *
 * Native bitmap-room port: it uses player_x/player_y/player_vy, direct PPI
 * input reads, and the bitmap room collision path. Optional shake writes V9938
 * R#18 through vdp_write_register (A=register, E=value), not through BIOS.
 */

export const MSX2_BITMAP_POWER_STOMP_RAM_BYTES = 2;
export const MSX2_BITMAP_SCREEN_SHAKE_RAM_BYTES = 1;

const POWER_STOMP_ATTACK_ROW = 2;     // MSX keyboard matrix row holding M on C-BIOS/US layout.
const POWER_STOMP_ATTACK_MASK = 0x01; // bit 0 = 'M'.
const POWER_STOMP_DOWN_MASK = 0x40;   // row 8 bit 6 = cursor DOWN.
const SCREEN_SHAKE_TABLE = [0x00, 0xf0, 0x10, 0xf0, 0x20];

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapPowerStompEnabled(config: Msx2PowerStompConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

export function bitmapPowerStompWantsShake(config: Msx2PowerStompConfig | undefined): boolean {
  return bitmapPowerStompEnabled(config) && config?.screenShake !== false;
}

export function buildBitmapPowerStompEquates(
  config: Msx2PowerStompConfig | undefined,
  ramBase: number,
  shakeRamBase: number,
): string {
  if (!bitmapPowerStompEnabled(config)) return '';
  const shakeEquate = bitmapPowerStompWantsShake(config)
    ? `bitmap_shake_timer       EQU ${asmWord(shakeRamBase)}\n`
    : '';
  return `; --- POWER STOMP skill runtime state (2 bytes) ---
bitmap_stomp_active     EQU ${asmWord(ramBase)}
bitmap_stomp_cooldown   EQU ${asmWord(ramBase + 1)}
${shakeEquate}`;
}

export function buildBitmapPowerStompInitClearAsm(config: Msx2PowerStompConfig | undefined): string {
  if (!bitmapPowerStompEnabled(config)) return '';
  const shakeClear = bitmapPowerStompWantsShake(config)
    ? `    ld (bitmap_shake_timer), a
    ld a, #12
    ld e, #00
    call vdp_write_register
    xor a
`
    : '';
  return `    xor a
    ld (bitmap_stomp_active), a
    ld (bitmap_stomp_cooldown), a
${shakeClear}`;
}

export function buildBitmapPowerStompInputHookAsm(config: Msx2PowerStompConfig | undefined): string {
  if (!bitmapPowerStompEnabled(config)) return '';
  return `    push bc
    call bitmap_power_stomp_frame_gate
    pop bc
    jp c, .apply_gravity
`;
}

export function buildBitmapPowerStompGravityHookAsm(config: Msx2PowerStompConfig | undefined): string {
  if (!bitmapPowerStompEnabled(config)) return '';
  return `    call bitmap_step_stomp_fall
`;
}

export function buildBitmapPowerStompLandClearAsm(config: Msx2PowerStompConfig | undefined): string {
  if (!bitmapPowerStompEnabled(config)) return '';
  return `    call bitmap_stomp_on_land
`;
}

export function buildBitmapPowerStompMainLoopCallAsm(config: Msx2PowerStompConfig | undefined): string {
  if (!bitmapPowerStompWantsShake(config)) return '';
  return `    call bitmap_screen_shake_update
`;
}

export function buildBitmapPowerStompRuntimeAsm(config: Msx2PowerStompConfig | undefined): string {
  if (!config || !bitmapPowerStompEnabled(config)) return '';

  const stompSpeed = asmByte(config.stompSpeed);
  const stompCooldown = asmByte(config.stompCooldown);
  const shakeTrigger = bitmapPowerStompWantsShake(config)
    ? `    call bitmap_screen_shake_trigger\n`
    : '';
  const shakeRuntime = bitmapPowerStompWantsShake(config)
    ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_screen_shake_trigger
; ------------------------------------------------------------
; PURPOSE: Arms the SCREEN 5 shake timer used by bitmap_screen_shake_update.
; INPUT: none.
; OUTPUT: bitmap_shake_timer = ${SCREEN_SHAKE_TABLE.length}.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_screen_shake_trigger:
    ld a, ${asmByte(SCREEN_SHAKE_TABLE.length)}
    ld (bitmap_shake_timer), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_screen_shake_update
; ------------------------------------------------------------
; PURPOSE: Writes one V9938 R#18 display-adjust step per frame and decrements
;   bitmap_shake_timer. The final table entry writes #00 so the display returns
;   to neutral.
; INPUT: bitmap_shake_timer.
; OUTPUT: V9938 R#18 updated; bitmap_shake_timer decremented.
; DESTROYS: AF, BC, E, HL. PRESERVES: D, IX, IY.
; CALLS: vdp_write_register.
; ------------------------------------------------------------
bitmap_screen_shake_update:
    ld a, (bitmap_shake_timer)
    or a
    ret z
    dec a
    ld (bitmap_shake_timer), a
    ld hl, bitmap_shake_decay_table
    ld c, a
    ld b, 0
    add hl, bc
    ld e, (hl)
    ld a, #12
    call vdp_write_register
    ret

bitmap_shake_decay_table:
    db ${SCREEN_SHAKE_TABLE.map(asmByte).join(', ')}
`
    : '';

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_power_stomp_combo_pressed
; ------------------------------------------------------------
; PURPOSE: Reads DOWN+M directly from the keyboard matrix.
; INPUT: none.
; OUTPUT: A=1 when both DOWN and M are pressed; A=0 otherwise (Z when false).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 8, then row ${POWER_STOMP_ATTACK_ROW}, on PPI_C.
; ------------------------------------------------------------
bitmap_power_stomp_combo_pressed:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(POWER_STOMP_DOWN_MASK)}
    ret z
    in a, (PPI_C)
    and #F0
    or ${asmByte(POWER_STOMP_ATTACK_ROW)}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(POWER_STOMP_ATTACK_MASK)}
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_stomp_cooldown
; ------------------------------------------------------------
; PURPOSE: Decrements the power_stomp cooldown when non-zero.
; INPUT: bitmap_stomp_cooldown.
; OUTPUT: bitmap_stomp_cooldown decremented when active.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_stomp_cooldown:
    ld a, (bitmap_stomp_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_stomp_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_stomp
; ------------------------------------------------------------
; PURPOSE: Starts a power_stomp when airborne, off cooldown, and DOWN+M is held.
; INPUT: player_flags, bitmap_stomp_active/cooldown, keyboard matrix.
; OUTPUT: bitmap_stomp_active=1 and player_vy pinned to stompSpeed when started.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_tick_stomp_cooldown, bitmap_power_stomp_combo_pressed.
; ------------------------------------------------------------
bitmap_try_start_stomp:
    call bitmap_tick_stomp_cooldown
    ld a, (bitmap_stomp_active)
    or a
    ret nz
    ld a, (player_flags)
    bit 0, a
    ret nz
    ld a, (bitmap_stomp_cooldown)
    or a
    ret nz
    call bitmap_power_stomp_combo_pressed
    or a
    ret z
    ld a, 1
    ld (bitmap_stomp_active), a
    ld a, ${stompCooldown}
    ld (bitmap_stomp_cooldown), a
    ld a, ${stompSpeed}
    ld (player_vy), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_stomp_fall
; ------------------------------------------------------------
; PURPOSE: While active, re-pins player_vy to stompSpeed after gravity.
; INPUT: bitmap_stomp_active.
; OUTPUT: player_vy = stompSpeed when stomping.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_step_stomp_fall:
    ld a, (bitmap_stomp_active)
    or a
    ret z
    ld a, ${stompSpeed}
    ld (player_vy), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_stomp_on_land
; ------------------------------------------------------------
; PURPOSE: Clears an active power_stomp on landing and optionally starts shake.
; INPUT: bitmap_stomp_active.
; OUTPUT: bitmap_stomp_active=0; bitmap_shake_timer armed when enabled.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_screen_shake_trigger when screenShake is enabled.
; ------------------------------------------------------------
bitmap_stomp_on_land:
    ld a, (bitmap_stomp_active)
    or a
    ret z
    xor a
    ld (bitmap_stomp_active), a
${shakeTrigger}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_power_stomp_frame_gate
; ------------------------------------------------------------
; PURPOSE: Ticks/starts power_stomp and reports whether normal horizontal input
;   should skip this frame.
; INPUT: none.
; OUTPUT: Carry SET when power_stomp is active; carry CLEAR otherwise.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_try_start_stomp.
; ------------------------------------------------------------
bitmap_power_stomp_frame_gate:
    call bitmap_try_start_stomp
    ld a, (bitmap_stomp_active)
    or a
    jp z, .power_stomp_idle
    scf
    ret
.power_stomp_idle:
    or a
    ret
${shakeRuntime}`;
}
