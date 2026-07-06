"use strict";
/**
 * SCREEN 5 bitmap-room WALL CLIMB skill.
 *
 * While the player holds a horizontal direction INTO a solid wall (a "wall grab"),
 * UP climbs up, DOWN climbs down, and holding neither clings in place without
 * falling. Vertical logic adapted from the SCREEN 4 wallgrab
 * (componentsGenerator.ts wallgrab_choose_vertical_velocity_c).
 *
 * Implemented as a gravity hook (like glide): after gravity has ticked player_vy
 * and before the vertical movement loop consumes it, this overrides player_vy, so
 * the existing bitmap_try_move_y loop carries the player and stops at any solid.
 * Letting go of the wall direction returns control to gravity.
 *
 * Stateless: re-evaluated every frame, so it needs NO RAM (no EQU/init).
 *
 * Input (no new key): UP (row 8 bit 5) + RIGHT (bit 7) into a right wall, or
 * UP + LEFT (bit 4) into a left wall. Wall contact is a single bitmap_probe_solid
 * just past the player edge at mid-height.
 *
 * This is a SCREEN 5-only skill (no SCREEN 4 equivalent), so the small config is
 * read locally from the Player Config rather than from msx2PlatformPhysics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBitmapWallClimbConfig = resolveBitmapWallClimbConfig;
exports.bitmapWallClimbEnabled = bitmapWallClimbEnabled;
exports.buildBitmapWallClimbGravityHookAsm = buildBitmapWallClimbGravityHookAsm;
exports.buildBitmapWallClimbRuntimeAsm = buildBitmapWallClimbRuntimeAsm;
function asmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
/** Reads the wall-climb config from the linked Player Config (activeSkills + skillParameters.climb). */
function resolveBitmapWallClimbConfig(player) {
    const activeSkills = Array.isArray(player?.activeSkills)
        ? player.activeSkills.map((id) => String(id || '').trim())
        : [];
    const enabled = activeSkills.includes('climb');
    const params = (player?.skillParameters?.climb || {});
    const climbSpeed = Math.max(1, Math.min(8, Math.floor(Number(params.climbSpeed)) || 2));
    return { enabled, climbSpeed };
}
function bitmapWallClimbEnabled(config) {
    return Boolean(config?.enabled);
}
/** Gravity-hook call, injected after gravity and before the vertical move loop. */
function buildBitmapWallClimbGravityHookAsm(config) {
    if (!bitmapWallClimbEnabled(config))
        return '';
    return '    call bitmap_wall_climb_step\n';
}
/** The wall-climb routine (empty when disabled). */
function buildBitmapWallClimbRuntimeAsm(config) {
    if (!bitmapWallClimbEnabled(config))
        return '';
    const climbSpeed = Math.max(1, Math.min(8, Math.floor(config.climbSpeed) || 2));
    const climbVyByte = asmByte((256 - climbSpeed) & 0xff); // signed -climbSpeed (upward)
    const climbDownByte = asmByte(climbSpeed); // +climbSpeed (downward)
    return `
; ------------------------------------------------------------
; FUNCTION: bitmap_wall_climb_step
; ------------------------------------------------------------
; PURPOSE:
;   Wall-grab + climb gravity hook, adapted from the SCREEN 4 wallgrab vertical
;   logic (componentsGenerator.ts wallgrab_choose_vertical_velocity_c). While a
;   horizontal key holds the player INTO an adjacent solid wall, override
;   player_vy: UP climbs up (-${climbSpeed} px/frame), DOWN climbs down
;   (+${climbSpeed}), and holding neither clings in place (vy=0, no fall). The
;   vertical movement loop then carries the player and stops at solids. No-op
;   when the player is not grabbing a wall (normal gravity).
;
; INPUT:
;   player_x, player_y; PPI keyboard row 8 (UP bit 5, DOWN bit 6, RIGHT bit 7,
;   LEFT bit 4).
;
; OUTPUT:
;   player_vy set to the climb/cling velocity and player_flags grounded bit
;   cleared while grabbing.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   bitmap_probe_solid.
;
; SIDE EFFECTS:
;   Selects keyboard row 8 on PPI_C (update_player_movement re-selects it next
;   frame). Writes player_vy and player_flags only while grabbing.
;
; NOTES:
;   Runs at .after_gravity_tick where DE/HL are not live (the vertical loop uses
;   only A/B/C), so clobbering DE/HL via the probe is safe. Wall contact is a
;   single probe one pixel past the player edge at mid-height (player_y + 8). The
;   SCREEN 4 stamina timer/lockout is NOT ported yet, so the grab is unlimited.
; ------------------------------------------------------------
bitmap_wall_climb_step:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ld c, a                 ; C = row 8 pressed mask
    bit 7, c                ; RIGHT held? -> probe a right wall
    jp z, .wc_try_left
    ld a, (player_x)
    add a, 16
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    jp nz, .wc_grabbed
    ret
.wc_try_left:
    bit 4, c                ; LEFT held? -> probe a left wall
    ret z
    ld a, (player_x)
    sub 1
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    ret z
.wc_grabbed:
    ld a, (player_flags)
    and #FE                 ; grabbing the wall -> not grounded
    ld (player_flags), a
    in a, (PPI_C)           ; re-read row 8 (C held the wall-probe Y)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ld c, a
    bit 5, c                ; UP -> climb up
    jp nz, .wc_up
    bit 6, c                ; DOWN -> climb down
    jp nz, .wc_down
    xor a                   ; cling: hold position, no fall
    ld (player_vy), a
    ret
.wc_up:
    ld a, ${climbVyByte}    ; -${climbSpeed} px/frame (up)
    ld (player_vy), a
    ret
.wc_down:
    ld a, ${climbDownByte}  ; +${climbSpeed} px/frame (down)
    ld (player_vy), a
    ret
`;
}
