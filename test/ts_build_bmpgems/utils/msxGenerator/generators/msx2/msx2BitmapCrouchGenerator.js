"use strict";
/**
 * SCREEN 5 bitmap-room CROUCH skill.
 *
 * Holding DOWN while grounded puts the player into a crouch: horizontal motion
 * is reduced to `crouchSpeed` px/frame (0 = frozen in place) and the walk
 * animation is suppressed when stationary. Releasing DOWN can hand off a short
 * momentum slide of `slideDistance` px in the facing direction.
 *
 * NOTE on "duck under obstacles": the SCREEN 5 bitmap room collision grid uses
 * 16x16 px cells and the player body is exactly 16 px tall, so there is no
 * sub-cell gap to squeeze under. `crouchHitboxHeight` is therefore inert here
 * (kept only for parity with the SCREEN 4 pattern config); crouch in this engine
 * is a movement/pose skill, not a hitbox-shrink skill.
 *
 * Integration style: an additive carry gate injected into the horizontal hook of
 * `update_player_movement` (same slot as ice_slide). When the gate handles the
 * frame it sets carry and the caller jumps to `.check_jump`, so the player can
 * still jump out of a crouch and the normal 2 px/frame walk block is skipped.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_CROUCH_RAM_BYTES = void 0;
exports.bitmapCrouchEnabled = bitmapCrouchEnabled;
exports.buildBitmapCrouchEquates = buildBitmapCrouchEquates;
exports.buildBitmapCrouchInitClearAsm = buildBitmapCrouchInitClearAsm;
exports.buildBitmapCrouchHorizontalHookAsm = buildBitmapCrouchHorizontalHookAsm;
exports.buildBitmapCrouchRuntimeAsm = buildBitmapCrouchRuntimeAsm;
// bitmap_crouch_active / bitmap_crouch_slide_t / bitmap_crouch_slide_dir
exports.MSX2_BITMAP_CROUCH_RAM_BYTES = 3;
function asmWord(value) {
    return `#${Math.max(0, Math.min(0xffff, value)).toString(16).toUpperCase().padStart(4, '0')}`;
}
function asmByte(value) {
    return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}
function bitmapCrouchEnabled(config) {
    return !!config.enabled;
}
function buildBitmapCrouchEquates(config, ramBase) {
    if (!bitmapCrouchEnabled(config))
        return '';
    return `; --- CROUCH skill RAM (SCREEN 5 bitmap) ---
bitmap_crouch_active    EQU ${asmWord(ramBase)}
bitmap_crouch_slide_t   EQU ${asmWord(ramBase + 1)}
bitmap_crouch_slide_dir EQU ${asmWord(ramBase + 2)}
`;
}
function buildBitmapCrouchInitClearAsm(config) {
    if (!bitmapCrouchEnabled(config))
        return '';
    return `    xor a
    ld (bitmap_crouch_active), a
    ld (bitmap_crouch_slide_t), a
    ld (bitmap_crouch_slide_dir), a
`;
}
function buildBitmapCrouchHorizontalHookAsm(config) {
    if (!bitmapCrouchEnabled(config))
        return '';
    return `    push bc
    call bitmap_crouch_step
    pop bc
    jp c, .check_jump
`;
}
function buildBitmapCrouchRuntimeAsm(config, stateAnimIds = {}) {
    if (!bitmapCrouchEnabled(config))
        return '';
    const crouchSpeed = Math.max(0, Math.min(4, Math.trunc(config.crouchSpeed)));
    const slideDistance = Math.max(0, Math.min(16, Math.trunc(config.slideDistance)));
    const hasMove = crouchSpeed > 0;
    const hasSlide = slideDistance > 0;
    // Per-state animation hooks: assert the crouch/slide animation state when a
    // separate sprite is mapped for it (player.render.stateSprites). The symbol
    // player_anim_state only exists when state animations are active, so emit the
    // write only when an id was resolved.
    const crouchStateSetAsm = typeof stateAnimIds.crouching === 'number'
        ? `    ld a, ${stateAnimIds.crouching}\n    ld (player_anim_state), a\n`
        : '';
    const slideStateSetAsm = typeof stateAnimIds.sliding === 'number'
        ? `    ld a, ${stateAnimIds.sliding}\n    ld (player_anim_state), a\n`
        : '';
    // Horizontal movement while crouched (only emitted when crouchSpeed > 0).
    const crouchMoveAsm = hasMove
        ? `    bit 7, c                ; RIGHT held while crouched
    jp z, .cr_try_left
    ld a, 1
    ld (player_facing), a
    ld (player_moving), a
    ld a, ${crouchSpeed}
    call bitmap_try_move_x
    jp .cr_take
.cr_try_left:
    bit 4, c                ; LEFT held while crouched
    jp z, .cr_take
    xor a
    ld (player_facing), a
    inc a
    ld (player_moving), a
    ld a, ${asmByte(0x100 - crouchSpeed)}   ; -${crouchSpeed} px/frame
    call bitmap_try_move_x
`
        : '';
    // Seed a momentum slide on release (only when slideDistance > 0).
    const slideSeedAsm = hasSlide
        ? `    ld a, (player_facing)
    or a
    jp z, .cr_seed_left
    ld a, 1
    ld (bitmap_crouch_slide_dir), a
    jp .cr_seed_set
.cr_seed_left:
    ld a, #FF
    ld (bitmap_crouch_slide_dir), a
.cr_seed_set:
    ld a, ${slideDistance}
    ld (bitmap_crouch_slide_t), a
`
        : '';
    // Decay/apply the residual slide each frame (only when slideDistance > 0).
    const slideApplyAsm = hasSlide
        ? `    ld a, (bitmap_crouch_slide_t)
    or a
    jp z, .cr_normal
    ld a, c
    and #90                 ; RIGHT(#80) | LEFT(#10): regaining control cancels slide
    jp nz, .cr_cancel
    ld a, (bitmap_crouch_slide_t)
    dec a
    ld (bitmap_crouch_slide_t), a
${slideStateSetAsm}    ld a, (bitmap_crouch_slide_dir)
    call bitmap_try_move_x
    scf
    ret
.cr_cancel:
    xor a
    ld (bitmap_crouch_slide_t), a
`
        : '';
    // Airborne: drop any crouch/slide state and let normal movement run.
    const airborneClearSlide = hasSlide ? `    ld (bitmap_crouch_slide_t), a\n` : '';
    return `
; ------------------------------------------------------------
; FUNCTION: bitmap_crouch_step
; ------------------------------------------------------------
; PURPOSE:
;   Drive the crouch skill from update_player_movement's horizontal hook.
;   Holding DOWN while grounded crouches the player (move at ${crouchSpeed} px/frame,
;   0 = immobile). Releasing DOWN can carry a ${slideDistance} px momentum slide.
;
; INPUT:
;   C = row-8 keyboard pressed mask (bit7=right, bit6=down, bit4=left; 1=pressed).
;
; OUTPUT:
;   Carry set  -> crouch/slide handled horizontal movement this frame
;                 (caller jumps to .check_jump; jump-out still allowed).
;   Carry clear -> normal horizontal movement should run.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_try_move_x.
;
; SIDE EFFECTS:
;   Updates bitmap_crouch_active/slide state, player_x, player_facing,
;   player_moving.
;
; NOTES:
;   Collision cells are 16x16 px and the player body is 16 px tall, so this is a
;   movement/pose crouch (no sub-cell duck-under). Runs before the normal
;   2 px/frame walk block; off-crouch it returns carry clear so legacy movement
;   is unchanged.
; ------------------------------------------------------------
bitmap_crouch_step:
    ld a, (player_flags)
    bit 0, a                ; grounded?
    jp z, .cr_airborne
    bit 6, c                ; DOWN held?
    jp z, .cr_released
    ; ---- crouching (grounded + DOWN) ----
    ld a, 1
    ld (bitmap_crouch_active), a
    xor a
    ld (player_moving), a    ; default to idle pose when stationary
${crouchStateSetAsm}${crouchMoveAsm}.cr_take:
    scf
    ret
.cr_airborne:
    xor a
    ld (bitmap_crouch_active), a
${airborneClearSlide}    or a
    ret
.cr_released:
    ld a, (bitmap_crouch_active)
    or a
    jp z, .cr_slidecheck     ; was not crouching: only residual slide may remain
    xor a
    ld (bitmap_crouch_active), a
${slideSeedAsm}.cr_slidecheck:
${slideApplyAsm}.cr_normal:
    or a                     ; carry clear -> normal movement
    ret
`;
}
