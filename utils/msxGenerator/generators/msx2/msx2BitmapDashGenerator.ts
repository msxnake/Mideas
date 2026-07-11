import { Msx2DashConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room DASH skill (pilot port of the SCREEN 4 dash).
 *
 * Unlike the SCREEN 4 dash (which probes/move with msx2_collision_at_pixel and a
 * GTSTCK input dispatch), the bitmap-room runtime already exposes:
 *   - bitmap_probe_solid (B=pixel X, C=pixel Y -> A=cell, Z when empty; keeps BC)
 *   - bitmap_try_move_x  (A = signed 1px dx: #01 right / #FF left; commits player_x
 *                         only when the leading edge is not solid)
 * so the dash STEP just calls bitmap_try_move_x 1px at a time, dashSpeed times,
 * and naturally stops at walls. Input is read directly from the PPI (no BIOS),
 * matching update_player_movement.
 *
 * RAM: 4 bytes at #C0D9..#C0DC (after the room-transition double-buffer state,
 * which ends at #C0D8). The OR per-frame colour gate owns #C00C, so the player
 * timer gap #C00D..#C00F is left free for future skills.
 *
 * Dash trigger key (pilot): 'M' = MSX keyboard matrix row 4, bit 2 (mask #04).
 * Direction comes from player_facing (0=left, 1=right), which update_player_movement
 * sets from the held cursor. Honouring the Player Config control binding on the PPI
 * is a follow-up (the SCREEN 4 control->GTSTCK mapping does not apply here).
 */

export const MSX2_BITMAP_DASH_RAM_BASE = 0xC0DA;
export const MSX2_BITMAP_DASH_RAM_BYTES = 4;

const DASH_KEY_ROW = 4;     // MSX keyboard matrix row holding K..R
const DASH_KEY_MASK = 0x04; // bit 2 = 'M'

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** True when the dash skill is enabled for the resolved player. */
export function bitmapDashEnabled(config: Msx2DashConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

/** RAM EQU block (empty when the dash is disabled). */
export function buildBitmapDashEquates(config: Msx2DashConfig | undefined): string {
  if (!bitmapDashEnabled(config)) return '';
  const base = MSX2_BITMAP_DASH_RAM_BASE;
  return `; --- DASH skill runtime state (4 bytes) ---
bitmap_dash_timer     EQU ${asmWord(base)}
bitmap_dash_cooldown  EQU ${asmWord(base + 1)}
bitmap_dash_lock      EQU ${asmWord(base + 2)}
bitmap_dash_direction EQU ${asmWord(base + 3)}
`;
}

/** Clears the dash state. Inlined at init_rom and on screen transitions. */
export function buildBitmapDashInitClearAsm(config: Msx2DashConfig | undefined): string {
  if (!bitmapDashEnabled(config)) return '';
  return `    xor a
    ld (bitmap_dash_timer), a
    ld (bitmap_dash_cooldown), a
    ld (bitmap_dash_lock), a
    ld (bitmap_dash_direction), a
`;
}

/** Main-loop gate: arm the dash on key press, then advance an active dash. */
export function buildBitmapDashGateAsm(config: Msx2DashConfig | undefined): string {
  if (!bitmapDashEnabled(config)) return '';
  return `    call bitmap_try_start_dash
    call bitmap_step_dash_movement
`;
}

/** The dash routines (empty when disabled). */
export function buildBitmapDashRuntimeAsm(
  config: Msx2DashConfig | undefined,
  stateAnimIds: { dashing?: number } = {},
): string {
  if (!config || !bitmapDashEnabled(config)) return '';

  const dashSpeed = Math.max(1, Math.min(24, Math.floor(config.dashSpeed) || 8));
  const dashDuration = asmByte(config.dashDuration);
  const dashCooldown = asmByte(config.dashCooldown);
  // Assert the 'dashing' animation state while a dash is active, when a separate
  // sprite is mapped for it. player_anim_state is reset to 0 each frame in
  // update_player_movement (which runs before this gate), so writing it here only
  // holds for the dash frames. The symbol exists only when state animations are on.
  const dashStateSetAsm = typeof stateAnimIds.dashing === 'number'
    ? `    ld a, ${stateAnimIds.dashing}\n    ld (player_anim_state), a\n`
    : '';
  const lockGate = config.requireKeyRelease
    ? `    ld a, (bitmap_dash_lock)
    or a
    ret nz
`
    : '';
  const armLock = config.requireKeyRelease
    ? `    ld a, 1
    ld (bitmap_dash_lock), a
`
    : '';

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_dash_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the dash key ('M', keyboard matrix row ${DASH_KEY_ROW} bit 2) via PPI.
; INPUT: none.
; OUTPUT: A = 1 when pressed, A = 0 otherwise (Z set when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row ${DASH_KEY_ROW} on PPI_C. update_player_movement
;   re-selects row 8 next frame, so the transient selection is safe.
; ------------------------------------------------------------
bitmap_dash_pressed:
    in a, (PPI_C)
    and #F0
    or ${DASH_KEY_ROW}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(DASH_KEY_MASK)}
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dash_grounded
; ------------------------------------------------------------
; PURPOSE: True when a solid 16x16 cell sits directly below the player feet.
; INPUT: player_x, player_y. OUTPUT: A = 1 grounded, A = 0 airborne (Z when airborne).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_dash_grounded:
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
; FUNCTION: bitmap_tick_dash_cooldown
; ------------------------------------------------------------
; PURPOSE: Decrements the dash cooldown when active.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_dash_cooldown:
    ld a, (bitmap_dash_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_dash_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dash_release_lock
; ------------------------------------------------------------
; PURPOSE: Clears the requireKeyRelease lock once the dash key is released.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_dash_pressed.
; ------------------------------------------------------------
bitmap_dash_release_lock:
    call bitmap_dash_pressed
    or a
    ret nz
    xor a
    ld (bitmap_dash_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_dash
; ------------------------------------------------------------
; PURPOSE: Ticks the cooldown and, when key + grounded + cooldown + lock allow,
;   arms a ground dash: latches the direction from player_facing and sets the
;   dash timer/cooldown (and key lock when requireKeyRelease).
; INPUT: none. OUTPUT: bitmap_dash_timer > 0 when a dash started.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_tick_dash_cooldown, bitmap_dash_release_lock, bitmap_dash_pressed,
;   bitmap_dash_grounded.
; NOTES: Direction: player_facing 0=left, 1=right (set by update_player_movement).
; ------------------------------------------------------------
bitmap_try_start_dash:
    call bitmap_tick_dash_cooldown
    ld a, (bitmap_dash_timer)
    or a
    ret nz
    call bitmap_dash_release_lock
    call bitmap_dash_pressed
    or a
    ret z
    call bitmap_dash_grounded
    or a
    ret z
    ld a, (bitmap_dash_cooldown)
    or a
    ret nz
${lockGate}    ld a, (player_facing)
    ld (bitmap_dash_direction), a
    ld a, ${dashDuration}
    ld (bitmap_dash_timer), a
    ld a, ${dashCooldown}
    ld (bitmap_dash_cooldown), a
${armLock}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_dash_movement
; ------------------------------------------------------------
; PURPOSE: While a dash is active, moves the player ${dashSpeed} px in the latched
;   direction this frame (1px probes via bitmap_try_move_x, so it stops at solids),
;   and decrements the dash timer.
; INPUT: none. OUTPUT: player_x updated; bitmap_dash_timer decremented.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_try_move_x.
; NOTES: bitmap_try_move_x clobbers BC, so the djnz counter is kept across the
;   call with push/pop bc (register corruption is the first bug hypothesis).
; ------------------------------------------------------------
bitmap_step_dash_movement:
    ld a, (bitmap_dash_timer)
    or a
    ret z
    dec a
    ld (bitmap_dash_timer), a
${dashStateSetAsm}    ld a, (bitmap_dash_direction)
    or a
    jp z, .dash_step_left
.dash_step_right:
    ld b, ${dashSpeed}
.dash_right_loop:
    push bc
    ld a, #01
    call bitmap_try_move_x
    pop bc
    djnz .dash_right_loop
    ret
.dash_step_left:
    ld b, ${dashSpeed}
.dash_left_loop:
    push bc
    ld a, #FF
    call bitmap_try_move_x
    pop bc
    djnz .dash_left_loop
    ret
`;
}
