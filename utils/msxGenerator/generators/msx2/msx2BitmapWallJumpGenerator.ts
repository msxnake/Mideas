import { Msx2WallJumpConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room WALL JUMP skill.
 *
 * Native bitmap-room port: it uses player_x/player_y/player_vy and the local
 * bitmap collision helpers instead of SCREEN 4 labels or 8.8 gravity velocity.
 * RAM is assigned by the caller after dash/air_dash/glide runtime blocks.
 */

export const MSX2_BITMAP_WALL_JUMP_RAM_BYTES = 4;

const BITMAP_WALL_SLIDE_NONE = 0xff;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapWallJumpEnabled(config: Msx2WallJumpConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

export function buildBitmapWallJumpEquates(
  config: Msx2WallJumpConfig | undefined,
  ramBase: number,
): string {
  if (!bitmapWallJumpEnabled(config)) return '';
  return `; --- WALL JUMP skill runtime state (4 bytes) ---
bitmap_wall_slide_side       EQU ${asmWord(ramBase)}
bitmap_wall_jump_lock_timer  EQU ${asmWord(ramBase + 1)}
bitmap_wall_jump_lock_vx     EQU ${asmWord(ramBase + 2)}
bitmap_wall_jump_key_lock    EQU ${asmWord(ramBase + 3)}
`;
}

export function buildBitmapWallJumpInitClearAsm(config: Msx2WallJumpConfig | undefined): string {
  if (!bitmapWallJumpEnabled(config)) return '';
  return `    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ld (bitmap_wall_slide_side), a
    xor a
    ld (bitmap_wall_jump_lock_timer), a
    ld (bitmap_wall_jump_lock_vx), a
    ld (bitmap_wall_jump_key_lock), a
`;
}

export function buildBitmapWallJumpInputHookAsm(config: Msx2WallJumpConfig | undefined): string {
  if (!bitmapWallJumpEnabled(config)) return '';
  return `    push bc
    call bitmap_wall_jump_frame_gate
    pop bc
    jp c, .apply_gravity
`;
}

export function buildBitmapWallJumpGravityHookAsm(config: Msx2WallJumpConfig | undefined): string {
  if (!bitmapWallJumpEnabled(config)) return '';
  return `    call bitmap_wall_jump_slide_clamp
`;
}

export function buildBitmapWallJumpLandClearAsm(config: Msx2WallJumpConfig | undefined): string {
  if (!bitmapWallJumpEnabled(config)) return '';
  return `    call bitmap_wall_jump_clear_lock
`;
}

export function buildBitmapWallJumpRuntimeAsm(config: Msx2WallJumpConfig | undefined): string {
  if (!config || !bitmapWallJumpEnabled(config)) return '';

  const slideSpeed = asmByte(config.wallSlideSpeed);
  const wallJumpPowerSigned = asmByte((config.wallJumpPower88 >> 8) & 0xff);
  const wallJumpHorizontal = Math.max(1, Math.min(12, Math.floor(config.wallJumpHorizontal) || 4));
  const wallJumpHorizontalByte = asmByte(wallJumpHorizontal);
  const requireKeyRelease = config.requireKeyRelease !== false;
  const keyGate = requireKeyRelease
    ? `    ld a, (bitmap_wall_jump_key_lock)
    or a
    jp nz, .wall_kick_blocked
`
    : '';
  const keyArm = requireKeyRelease
    ? `    ld a, 1
    ld (bitmap_wall_jump_key_lock), a
`
    : '';

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_row8_pressed
; ------------------------------------------------------------
; PURPOSE: Reads row 8 movement/jump inputs directly from PPI.
; INPUT: none.
; OUTPUT: A = row 8 pressed mask after CPL (bit7 right, bit4 left, bit5 up, bit0 SPACE).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 8 on PPI_C.
; ------------------------------------------------------------
bitmap_wall_jump_row8_pressed:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_jump_pressed
; ------------------------------------------------------------
; PURPOSE: Returns true when SPACE or UP is pressed.
; INPUT: none.
; OUTPUT: A = 1 when pressed, A = 0 otherwise (Z set when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_wall_jump_row8_pressed.
; ------------------------------------------------------------
bitmap_wall_jump_jump_pressed:
    call bitmap_wall_jump_row8_pressed
    and #21
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_release_lock
; ------------------------------------------------------------
; PURPOSE: Clears the requireKeyRelease lock once the jump key is released.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_wall_jump_jump_pressed.
; SIDE EFFECTS: Updates bitmap_wall_jump_key_lock.
; ------------------------------------------------------------
bitmap_wall_jump_release_lock:
    call bitmap_wall_jump_jump_pressed
    or a
    ret nz
    xor a
    ld (bitmap_wall_jump_key_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_clear_lock
; ------------------------------------------------------------
; PURPOSE: Clears all wall_jump runtime state except the key release lock.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Updates wall_jump RAM.
; ------------------------------------------------------------
bitmap_wall_jump_clear_lock:
    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ld (bitmap_wall_slide_side), a
    xor a
    ld (bitmap_wall_jump_lock_timer), a
    ld (bitmap_wall_jump_lock_vx), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_detect_contact
; ------------------------------------------------------------
; PURPOSE: Detects initial wall contact only when the player is airborne and
;   holding the direction into that wall. Uses bitmap_probe_solid at mid-body.
; INPUT: player_x/player_y/player_flags plus row 8 keyboard state.
; OUTPUT: A = 0 left wall, A = 1 right wall, A = #FF none.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_wall_jump_row8_pressed, bitmap_probe_solid.
; NOTES: Left probe uses X-2 and right probe uses X+17, matching the 2px
;   horizontal platform step that stops short of solid tiles.
; ------------------------------------------------------------
bitmap_wall_jump_detect_contact:
    ld a, (player_flags)
    bit 0, a
    jp nz, .wall_detect_none
    call bitmap_wall_jump_row8_pressed
    ld d, a
    bit 4, d
    jp z, .wall_detect_right
    ld a, (player_x)
    cp 2
    jp c, .wall_detect_right
    sub 2
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_detect_right
    xor a
    ret
.wall_detect_right:
    bit 7, d
    jp z, .wall_detect_none
    ld a, (player_x)
    add a, 17
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_detect_none
    ld a, 1
    ret
.wall_detect_none:
    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_detect_any_contact
; ------------------------------------------------------------
; PURPOSE: Detects wall contact after the wall_jump chain has started, without
;   requiring the player to hold direction toward the wall. Probe order follows
;   the previous kick direction so narrow two-wall gaps prefer the wall just hit.
; INPUT: player_x/player_y/player_flags/bitmap_wall_jump_lock_vx.
; OUTPUT: A = 0 left wall, A = 1 right wall, A = #FF none.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; NOTES: Only valid while airborne; grounded state returns #FF.
; ------------------------------------------------------------
bitmap_wall_jump_detect_any_contact:
    ld a, (player_flags)
    bit 0, a
    jp nz, .wall_any_none
    ld a, (bitmap_wall_jump_lock_vx)
    bit 7, a
    jp nz, .wall_any_left_first
.wall_any_right_first:
    call bitmap_wall_jump_probe_right
    cp ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret nz
    call bitmap_wall_jump_probe_left
    ret
.wall_any_left_first:
    call bitmap_wall_jump_probe_left
    cp ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret nz
    call bitmap_wall_jump_probe_right
    ret
.wall_any_none:
    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_probe_left
; ------------------------------------------------------------
; PURPOSE: Tests the wall_jump left-side mid-body probe.
; INPUT: player_x/player_y.
; OUTPUT: A = 0 when the left wall is solid, A = #FF otherwise.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_wall_jump_probe_left:
    ld a, (player_x)
    cp 2
    jp c, .wall_probe_left_none
    sub 2
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_probe_left_none
    xor a
    ret
.wall_probe_left_none:
    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_probe_right
; ------------------------------------------------------------
; PURPOSE: Tests the wall_jump right-side mid-body probe.
; INPUT: player_x/player_y.
; OUTPUT: A = 1 when the right wall is solid, A = #FF otherwise.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_wall_jump_probe_right:
    ld a, (player_x)
    add a, 17
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_probe_right_none
    ld a, 1
    ret
.wall_probe_right_none:
    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_slide_clamp
; ------------------------------------------------------------
; PURPOSE: Caps downward player_vy while wall_slide is active.
; INPUT: bitmap_wall_slide_side, player_flags, player_vy.
; OUTPUT: player_vy clamped to wallSlideSpeed when falling faster than the cap.
; DESTROYS: AF, B. PRESERVES: C, DE, HL, IX, IY.
; SIDE EFFECTS: Updates player_vy.
; NOTES: Only positive/downward velocity is capped; upward jump velocity is preserved.
; ------------------------------------------------------------
bitmap_wall_jump_slide_clamp:
    ld a, (bitmap_wall_slide_side)
    cp ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret z
    ld a, (player_flags)
    bit 0, a
    ret nz
    ld a, (player_vy)
    bit 7, a
    ret nz
    ld b, a
    ld a, ${slideSpeed}
    cp b
    jp c, .wall_slide_cap_store
    ret
.wall_slide_cap_store:
    ld (player_vy), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_wall_jump_kick
; ------------------------------------------------------------
; PURPOSE: Starts a wall_jump kick when wall_slide is active and jump is pressed.
; INPUT: bitmap_wall_slide_side; player_vy.
; OUTPUT: player_vy receives upward impulse; lock_vx/timer armed.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_wall_jump_jump_pressed.
; SIDE EFFECTS: Updates wall_jump RAM and player_vy.
; ------------------------------------------------------------
bitmap_try_wall_jump_kick:
    ld a, (bitmap_wall_slide_side)
    cp ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ret z
    ld a, (player_flags)
    bit 0, a
    ret nz
    call bitmap_wall_jump_jump_pressed
    or a
    jp z, .wall_kick_blocked
${keyGate}    ld a, ${wallJumpPowerSigned}
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the kick impulse is not clipped by a stale carry
    ld a, (bitmap_wall_slide_side)
    or a
    jp z, .wall_kick_push_right
    ld a, ${wallJumpHorizontalByte}
    cpl
    inc a
    jp .wall_kick_store_vx
.wall_kick_push_right:
    ld a, ${wallJumpHorizontalByte}
.wall_kick_store_vx:
    ld (bitmap_wall_jump_lock_vx), a
    ld a, #FF
    ld (bitmap_wall_jump_lock_timer), a
${keyArm}    ld a, ${asmByte(BITMAP_WALL_SLIDE_NONE)}
    ld (bitmap_wall_slide_side), a
    ret
.wall_kick_blocked:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_wall_jump_lock
; ------------------------------------------------------------
; PURPOSE: While lock_timer is active, moves horizontally by |lock_vx| pixels
;   this frame using bitmap_try_move_x one pixel at a time.
; INPUT: bitmap_wall_jump_lock_timer (#FF = moving, 1 = chain armed, 0 = idle),
;   bitmap_wall_jump_lock_vx.
; OUTPUT: player_x advanced; carry is not used by caller.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_try_move_x.
; SIDE EFFECTS: Updates player_x and may set lock_timer=1 when blocked.
; NOTES: bitmap_try_move_x clobbers BC, so each pixel step wraps BC with PUSH/POP.
;   The compare against the previous X detects blocked movement because
;   bitmap_try_move_x does not return carry on X blockage.
; ------------------------------------------------------------
bitmap_step_wall_jump_lock:
    ld a, (bitmap_wall_jump_lock_timer)
    cp #FF
    ret nz
    ld a, (player_flags)
    bit 0, a
    jp nz, bitmap_wall_jump_clear_lock
    ld a, (bitmap_wall_jump_lock_vx)
    bit 7, a
    jp nz, .wall_lock_left_setup
.wall_lock_right_setup:
    ld a, 1
    ld (player_facing), a
    ld a, (bitmap_wall_jump_lock_vx)
    ld b, a
.wall_lock_right_loop:
    push bc
    ld a, (player_x)
    ld e, a
    ld a, #01
    call bitmap_try_move_x
    ld a, (player_x)
    cp e
    pop bc
    jp z, .wall_lock_stop
    djnz .wall_lock_right_loop
    ret
.wall_lock_left_setup:
    xor a
    ld (player_facing), a
    ld a, (bitmap_wall_jump_lock_vx)
    cpl
    inc a
    ld b, a
.wall_lock_left_loop:
    push bc
    ld a, (player_x)
    ld e, a
    ld a, #FF
    call bitmap_try_move_x
    ld a, (player_x)
    cp e
    pop bc
    jp z, .wall_lock_stop
    djnz .wall_lock_left_loop
    ret
.wall_lock_stop:
    ld a, 1
    ld (bitmap_wall_jump_lock_timer), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_frame_gate
; ------------------------------------------------------------
; PURPOSE: Per-frame wall_jump gate: release key lock, step active kick,
;   detect wall contact, then try a new kick. The first contact requires holding
;   direction into the wall; after one valid wall_jump, chained jumps only need
;   the jump button while airborne and touching a wall.
; INPUT: none.
; OUTPUT: Carry SET while the committed kick movement is active and normal
;   horizontal input must skip; carry CLEAR otherwise.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_wall_jump_release_lock, bitmap_step_wall_jump_lock,
;   bitmap_wall_jump_detect_contact, bitmap_wall_jump_detect_any_contact,
;   bitmap_try_wall_jump_kick, bitmap_wall_jump_clear_lock.
; SIDE EFFECTS: Updates wall_jump RAM and player position/velocity.
; ------------------------------------------------------------
bitmap_wall_jump_frame_gate:
${requireKeyRelease ? `    call bitmap_wall_jump_release_lock
` : ''}    call bitmap_step_wall_jump_lock
    ld a, (player_flags)
    bit 0, a
    jp z, .wall_gate_airborne
    call bitmap_wall_jump_clear_lock
    jp .wall_gate_no_skip
.wall_gate_airborne:
    ld a, (bitmap_wall_jump_lock_timer)
    cp #FF
    jp z, .wall_gate_active_skip
    or a
    jp z, .wall_gate_initial_detect
    call bitmap_wall_jump_detect_any_contact
    jp .wall_gate_store_contact
.wall_gate_initial_detect:
    call bitmap_wall_jump_detect_contact
.wall_gate_store_contact:
    ld (bitmap_wall_slide_side), a
    call bitmap_try_wall_jump_kick
    ld a, (bitmap_wall_jump_lock_timer)
    cp #FF
    jp nz, .wall_gate_no_skip
.wall_gate_active_skip:
    ld a, (bitmap_wall_jump_lock_vx)
    or a
    jp z, .wall_gate_no_skip
    scf
    ret
.wall_gate_no_skip:
    or a
    ret
`;
}
