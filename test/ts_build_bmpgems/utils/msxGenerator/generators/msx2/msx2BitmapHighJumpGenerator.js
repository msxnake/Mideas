"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_HIGH_JUMP_RAM_BYTES = void 0;
exports.bitmapHighJumpEnabled = bitmapHighJumpEnabled;
exports.buildBitmapHighJumpEquates = buildBitmapHighJumpEquates;
exports.buildBitmapHighJumpInitClearAsm = buildBitmapHighJumpInitClearAsm;
exports.buildBitmapHighJumpLandClearAsm = buildBitmapHighJumpLandClearAsm;
exports.buildBitmapHighJumpGravityHookAsm = buildBitmapHighJumpGravityHookAsm;
exports.buildBitmapHighJumpRuntimeAsm = buildBitmapHighJumpRuntimeAsm;
exports.buildBitmapHighJumpInputHookAsm = buildBitmapHighJumpInputHookAsm;
/**
 * SCREEN 5 bitmap-room HIGH JUMP skill.
 *
 * When the player jumps and holds the jump key, gravity is reduced for
 * holdFrames frames, producing a taller jump. Implemented as a gravity hook
 * that adds a small upward boost each frame while the counter is active and
 * the player is ascending.
 *
 * RAM: 1 byte (hold counter).
 * No key — augments the existing jump key behaviour.
 */
exports.MSX2_BITMAP_HIGH_JUMP_RAM_BYTES = 1;
function asmByte(v) { const b = Math.max(0, Math.min(255, Math.floor(v || 0))); return `#${b.toString(16).toUpperCase().padStart(2, '0')}`; }
function asmWord(v) { const w = Math.max(0, Math.min(0xFFFF, Math.floor(v || 0))); return `#${w.toString(16).toUpperCase().padStart(4, '0')}`; }
function bitmapHighJumpEnabled(c) { return Boolean(c?.enabled); }
function buildBitmapHighJumpEquates(c, ramBase) {
    if (!bitmapHighJumpEnabled(c))
        return '';
    return `; --- HIGH JUMP skill runtime state (1 byte) ---
bitmap_highjump_hold EQU ${asmWord(ramBase)}
`;
}
function buildBitmapHighJumpInitClearAsm(c) {
    if (!bitmapHighJumpEnabled(c))
        return '';
    return `    xor a
    ld (bitmap_highjump_hold), a
`;
}
/** Called on landing to reset the hold counter. */
function buildBitmapHighJumpLandClearAsm(c) {
    if (!bitmapHighJumpEnabled(c))
        return '';
    return `    xor a
    ld (bitmap_highjump_hold), a
`;
}
/** Gravity hook: while ascending and jump held and counter > 0, add upward boost. */
function buildBitmapHighJumpGravityHookAsm(c) {
    if (!bitmapHighJumpEnabled(c))
        return '';
    const boost = asmByte(1);
    return `    ; HIGH JUMP gravity hook: reduce fall while jump held and counter active.
    ld a, (bitmap_highjump_hold)
    or a
    jp z, .hj_hook_done
    ; Only boost while ascending (player_vy negative => bit 7 set).
    ld a, (player_vy)
    or a
    jp p, .hj_hook_done
    ; Player is ascending — subtract 1 from vy (make more negative = rise faster).
    dec a
    ld (player_vy), a
    ld a, (bitmap_highjump_hold)
    dec a
    ld (bitmap_highjump_hold), a
.hj_hook_done:
`;
}
function buildBitmapHighJumpRuntimeAsm(c) {
    if (!c || !bitmapHighJumpEnabled(c))
        return '';
    const holdFrames = asmByte(Math.max(1, Math.min(30, c.holdFrames || 10)));
    return `
; FUNCTION: bitmap_highjump_arm — arms the hold counter when a jump starts.
; Called from the jump-input gate (after the normal jump triggers).
; DESTROYS: AF. PRESERVES: BC,DE,HL,IX,IY.
bitmap_highjump_arm:
    ld a, ${holdFrames}
    ld (bitmap_highjump_hold), a
    ret
`;
}
/** Input gate: detect a fresh jump and arm the hold counter. */
function buildBitmapHighJumpInputHookAsm(c) {
    if (!bitmapHighJumpEnabled(c))
        return '';
    return `    ; HIGH JUMP: arm hold counter when player just left the ground ascending.
    ld a, (player_vy)
    or a
    jp p, .hj_input_done
    ld a, (bitmap_highjump_hold)
    or a
    jp nz, .hj_input_done
    ; Ascending with no hold active — check if jump key (space, row 8 bit 0) held.
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    jp z, .hj_input_done
    call bitmap_highjump_arm
.hj_input_done:
`;
}
