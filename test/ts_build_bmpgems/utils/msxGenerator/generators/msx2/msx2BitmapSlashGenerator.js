"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_SLASH_RAM_BYTES = void 0;
exports.bitmapSlashEnabled = bitmapSlashEnabled;
exports.buildBitmapSlashEquates = buildBitmapSlashEquates;
exports.buildBitmapSlashInitClearAsm = buildBitmapSlashInitClearAsm;
exports.buildBitmapSlashGateAsm = buildBitmapSlashGateAsm;
exports.buildBitmapSlashRuntimeAsm = buildBitmapSlashRuntimeAsm;
/**
 * SCREEN 5 bitmap-room SLASH skill.
 *
 * Melee attack: on key press, performs an instant hitbox check in the player's
 * facing direction within slashRange pixels. Enemy collision is a stub until
 * the bitmap-room enemy runtime exists.
 *
 * RAM: 3 bytes (timer, cooldown, lock).
 * Key: 'P' = keyboard matrix row 4, bit 5 (mask #20).
 */
exports.MSX2_BITMAP_SLASH_RAM_BYTES = 3;
const SLASH_KEY_ROW = 4;
const SLASH_KEY_MASK = 0x20; // bit 5 = 'P'
function asmByte(v) { const b = Math.max(0, Math.min(255, Math.floor(v || 0))); return `#${b.toString(16).toUpperCase().padStart(2, '0')}`; }
function asmWord(v) { const w = Math.max(0, Math.min(0xFFFF, Math.floor(v || 0))); return `#${w.toString(16).toUpperCase().padStart(4, '0')}`; }
function bitmapSlashEnabled(c) { return Boolean(c?.enabled); }
function buildBitmapSlashEquates(c, ramBase) {
    if (!bitmapSlashEnabled(c))
        return '';
    return `; --- SLASH skill runtime state (3 bytes) ---
bitmap_slash_timer    EQU ${asmWord(ramBase)}
bitmap_slash_cooldown EQU ${asmWord(ramBase + 1)}
bitmap_slash_lock     EQU ${asmWord(ramBase + 2)}
`;
}
function buildBitmapSlashInitClearAsm(c) {
    if (!bitmapSlashEnabled(c))
        return '';
    return `    xor a
    ld (bitmap_slash_timer), a
    ld (bitmap_slash_cooldown), a
    ld (bitmap_slash_lock), a
`;
}
function buildBitmapSlashGateAsm(c) {
    if (!bitmapSlashEnabled(c))
        return '';
    return '    call bitmap_try_slash\n';
}
function buildBitmapSlashRuntimeAsm(c) {
    if (!c || !bitmapSlashEnabled(c))
        return '';
    const slashTimer = asmByte(Math.max(1, Math.min(60, c.slashDuration || 10)));
    const slashCooldown = asmByte(Math.max(0, Math.min(120, c.slashCooldown || 30)));
    return `
; FUNCTION: bitmap_slash_pressed — reads 'P' key (row ${SLASH_KEY_ROW} bit 5).
; OUTPUT: A=1 pressed, A=0 not. DESTROYS: AF. PRESERVES: BC,DE,HL,IX,IY.
bitmap_slash_pressed:
    in a, (PPI_C)
    and #F0
    or ${SLASH_KEY_ROW}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(SLASH_KEY_MASK)}
    ret z
    ld a, 1
    ret

; FUNCTION: bitmap_try_slash — arms a slash on key press (cooldown + lock),
;   then checks the melee hitbox in facing direction for enemy collision (stub).
; DESTROYS: AF,BC,DE,HL. PRESERVES: IX,IY.
bitmap_try_slash:
    ld a, (bitmap_slash_cooldown)
    or a
    jp z, .slash_tick_timer
    dec a
    ld (bitmap_slash_cooldown), a
.slash_tick_timer:
    ld a, (bitmap_slash_timer)
    or a
    jp z, .slash_check_input
    dec a
    ld (bitmap_slash_timer), a
    ; While slashing, re-check enemy collision each frame (stub).
    call bitmap_slash_check_enemy_collision
.slash_check_input:
    call bitmap_slash_pressed
    or a
    jp nz, .slash_maybe_release
    xor a
    ld (bitmap_slash_lock), a
    jp .slash_done
.slash_maybe_release:
    ld a, (bitmap_slash_lock)
    or a
    jp nz, .slash_done
    ld a, (bitmap_slash_cooldown)
    or a
    jp nz, .slash_done
    ld a, (bitmap_slash_timer)
    or a
    jp nz, .slash_done
    ; Start slash.
    ld a, ${slashTimer}
    ld (bitmap_slash_timer), a
    ld a, ${slashCooldown}
    ld (bitmap_slash_cooldown), a
    ld a, 1
    ld (bitmap_slash_lock), a
    call bitmap_slash_check_enemy_collision
.slash_done:
    ret

; FUNCTION: bitmap_slash_check_enemy_collision
; PURPOSE: Stub — checks the melee hitbox (player_x +/- range, player_y..+16)
;   against enemy slots. The bitmap-room has no enemy runtime yet; when added,
;   iterate enemies, bounding-box test against the slash area, apply slashDamage.
; INPUT: player_x, player_y, player_facing. OUTPUT: none (currently).
; DESTROYS: none. PRESERVES: AF,BC,DE,HL,IX,IY.
; TODO (hacer proximamente): wire enemy collision once enemies exist.
bitmap_slash_check_enemy_collision:
    ret
`;
}
