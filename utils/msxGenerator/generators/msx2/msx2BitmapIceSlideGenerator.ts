/**
 * SCREEN 5 bitmap-room ICE SLIDE skill.
 *
 * Adds signed horizontal inertia while the player is grounded on a behavior
 * cell marked as ice. The behavior map is room-local and copied to RAM by the
 * bitmap backend.
 */

import type { Msx2IceSlideConfig } from '../../../msx2PlatformPhysics';

export const MSX2_BITMAP_ICE_SLIDE_RAM_BYTES = 4;

function asmWord(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, value)).toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapIceSlideEnabled(config: Msx2IceSlideConfig): boolean {
  return !!config.enabled;
}

export function buildBitmapIceSlideEquates(config: Msx2IceSlideConfig, ramBase: number): string {
  if (!bitmapIceSlideEnabled(config)) return '';
  return `; --- ICE SLIDE skill RAM (SCREEN 5 bitmap) ---
bitmap_ice_vx       EQU ${asmWord(ramBase)}
bitmap_ice_accel_t  EQU ${asmWord(ramBase + 1)}
bitmap_ice_friction_t EQU ${asmWord(ramBase + 2)}
bitmap_ice_input    EQU ${asmWord(ramBase + 3)}
`;
}

export function buildBitmapIceSlideInitClearAsm(config: Msx2IceSlideConfig): string {
  if (!bitmapIceSlideEnabled(config)) return '';
  return `    xor a
    ld (bitmap_ice_vx), a
    ld (bitmap_ice_accel_t), a
    ld (bitmap_ice_friction_t), a
    ld (bitmap_ice_input), a
`;
}

export function buildBitmapIceSlideHorizontalHookAsm(config: Msx2IceSlideConfig): string {
  if (!bitmapIceSlideEnabled(config)) return '';
  return `    push bc
    call bitmap_ice_slide_step
    pop bc
    jp nc, .ice_slide_hook_done
    ; ice_slide owned horizontal movement this frame. Cross a room edge ONLY
    ; when the player is actually sliding toward it (signed bitmap_ice_vx).
    ; commit_room_flip places the player at player_x = 2 (west entry) / 238
    ; (east entry); a purely positional edge check would fire on the first
    ; frame and bounce the player back into the previous room, causing an
    ; enter/exit oscillation when entering an ice room from a non-ice one.
    ld a, (bitmap_ice_vx)
    or a
    jp z, .check_jump              ; stationary on ice -> no edge transition
    bit 7, a
    jp nz, .ice_slide_edge_west    ; negative vx -> sliding west
    ; sliding east: transition only once the east edge is actually reached
    ld a, (player_x)
    cp 238
    jp c, .check_jump
    ld a, 1                        ; direction east
    call start_room_transition
    ret c                          ; transition queued -> done this frame
    jp .check_jump
.ice_slide_edge_west:
    ld a, (player_x)
    cp 3
    jp nc, .check_jump
    xor a                          ; direction west
    call start_room_transition
    ret c
    jp .check_jump
.ice_slide_hook_done:
`;
}

export function buildBitmapIceSlideRuntimeAsm(config: Msx2IceSlideConfig): string {
  if (!bitmapIceSlideEnabled(config)) return '';
  const surfaceCode = Math.max(1, Math.min(255, Math.trunc(config.surfaceCode || 3)));
  const maxSlideSpeed = Math.max(1, Math.min(8, Math.trunc(config.maxSlideSpeed || 4)));
  const accelerationFrames = Math.max(1, Math.min(8, Math.trunc(config.accelerationFrames || 2)));
  const frictionFrames = Math.max(1, Math.min(32, Math.trunc(config.frictionFrames || 8)));
  const footProbeLeftOffset = Math.max(0, Math.min(31, Math.trunc(config.footProbeLeftOffset ?? 1)));
  const footProbeRightOffset = Math.max(0, Math.min(31, Math.trunc(config.footProbeRightOffset ?? 14)));
  const footProbeYOffset = Math.max(1, Math.min(32, Math.trunc(config.footProbeYOffset ?? 16)));
  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_ice_player_on_surface
; ------------------------------------------------------------
; PURPOSE:
;   Check whether both player foot probes stand on a SCREEN 5 bitmap behavior
;   cell marked as ice.
;
; INPUT:
;   player_x/player_y = top-left player position. The probe checks the two
;   foot cells directly; it does not depend on player_flags because grounded
;   state is updated later in the same movement frame.
;
; OUTPUT:
;   Z set when the player is on ice; Z clear otherwise.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_probe_behavior.
;
; SIDE EFFECTS:
;   None.
;
; NOTES:
;   Ice is authored in the room behavior layer. Code ${surfaceCode} is treated
;   as slippery surface for this skill.
;   Foot probes use the resolved Player Config body hitbox offsets:
;   left +${footProbeLeftOffset}, right +${footProbeRightOffset}, y +${footProbeYOffset}.
; ------------------------------------------------------------
bitmap_ice_player_on_surface:
    ld a, (player_x)
    add a, ${footProbeLeftOffset}
    ld b, a
    ld a, (player_y)
    add a, ${footProbeYOffset}
    ld c, a
    call bitmap_probe_behavior
    cp ${surfaceCode}
    jp nz, .ice_not_on_surface
    ld a, (player_x)
    add a, ${footProbeRightOffset}
    ld b, a
    ld a, (player_y)
    add a, ${footProbeYOffset}
    ld c, a
    call bitmap_probe_behavior
    cp ${surfaceCode}
    ret
.ice_not_on_surface:
    or 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_ice_slide_step
; ------------------------------------------------------------
; PURPOSE:
;   Consume horizontal movement while the player is grounded on an ice behavior
;   cell. Input accelerates signed inertia; releasing input applies slow
;   friction, so the player keeps sliding.
;
; INPUT:
;   C = row-8 keyboard pressed mask from update_player_movement
;       (bit7=right, bit4=left, pressed bit = 1).
;
; OUTPUT:
;   Carry set if ice_slide handled horizontal movement this frame.
;   Carry clear if normal horizontal movement should run.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_ice_player_on_surface, bitmap_try_move_x.
;
; SIDE EFFECTS:
;   Updates bitmap_ice_vx/timers, player_x, player_facing, player_moving.
;
; NOTES:
;   This routine intentionally runs before the normal 2px/frame movement block.
;   It accelerates only on behavior code ${surfaceCode}. If the player leaves
;   ice with pending inertia, the routine keeps applying friction until the
;   signed velocity reaches zero instead of stopping abruptly.
;   The input mask is copied to bitmap_ice_input before probing because the
;   behavior probes destroy BC.
; ------------------------------------------------------------
bitmap_ice_slide_step:
    ld a, c
    ld (bitmap_ice_input), a
    call bitmap_ice_player_on_surface
    jp z, .ice_active
    ld a, (bitmap_ice_vx)
    or a
    jp nz, .ice_coast_off_surface
    xor a
    ld (bitmap_ice_accel_t), a
    ld (bitmap_ice_friction_t), a
    ld (bitmap_ice_input), a
    or a
    ret
.ice_coast_off_surface:
    xor a
    ld (bitmap_ice_accel_t), a
    inc a
    ld (player_moving), a
    jp .ice_no_input
.ice_active:
    ld a, (bitmap_ice_input)
    bit 7, a
    jp z, .ice_check_left
    ld a, 1
    ld (player_facing), a
    ld (player_moving), a
    call bitmap_ice_accel_right
    jp .ice_apply_vx
.ice_check_left:
    ld a, (bitmap_ice_input)
    bit 4, a
    jp z, .ice_no_input
    xor a
    ld (player_facing), a
    inc a
    ld (player_moving), a
    call bitmap_ice_accel_left
    jp .ice_apply_vx
.ice_no_input:
    call bitmap_ice_apply_friction
.ice_apply_vx:
    ld a, (bitmap_ice_vx)
    or a
    jp z, .ice_handled
    call bitmap_try_move_x
.ice_handled:
    scf
    ret

bitmap_ice_accel_right:
    ld a, (bitmap_ice_accel_t)
    inc a
    cp ${accelerationFrames}
    jp c, .ice_store_accel_t
    xor a
    ld (bitmap_ice_accel_t), a
    ld a, (bitmap_ice_vx)
    cp ${maxSlideSpeed}
    ret z
    inc a
    ld (bitmap_ice_vx), a
    ret
.ice_store_accel_t:
    ld (bitmap_ice_accel_t), a
    ret

bitmap_ice_accel_left:
    ld a, (bitmap_ice_accel_t)
    inc a
    cp ${accelerationFrames}
    jp c, .ice_store_accel_left_t
    xor a
    ld (bitmap_ice_accel_t), a
    ld a, (bitmap_ice_vx)
    cp #${(0x100 - maxSlideSpeed).toString(16).toUpperCase().padStart(2, '0')}
    ret z
    dec a
    ld (bitmap_ice_vx), a
    ret
.ice_store_accel_left_t:
    ld (bitmap_ice_accel_t), a
    ret

bitmap_ice_apply_friction:
    ld a, (bitmap_ice_vx)
    or a
    ret z
    ld a, (bitmap_ice_friction_t)
    inc a
    cp ${frictionFrames}
    jp c, .ice_store_friction_t
    xor a
    ld (bitmap_ice_friction_t), a
    ld a, (bitmap_ice_vx)
    bit 7, a
    jp nz, .ice_friction_negative
    dec a
    ld (bitmap_ice_vx), a
    ret
.ice_friction_negative:
    inc a
    ld (bitmap_ice_vx), a
    ret
.ice_store_friction_t:
    ld (bitmap_ice_friction_t), a
    ret
`;
}
