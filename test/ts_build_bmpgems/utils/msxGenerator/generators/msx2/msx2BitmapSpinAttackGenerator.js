"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_SPIN_ATTACK_RAM_BYTES = void 0;
exports.bitmapSpinAttackEnabled = bitmapSpinAttackEnabled;
exports.buildBitmapSpinAttackEquates = buildBitmapSpinAttackEquates;
exports.buildBitmapSpinAttackInitClearAsm = buildBitmapSpinAttackInitClearAsm;
exports.buildBitmapSpinAttackGateAsm = buildBitmapSpinAttackGateAsm;
exports.buildBitmapSpinAttackRuntimeAsm = buildBitmapSpinAttackRuntimeAsm;
/**
 * SCREEN 5 bitmap-room SPIN ATTACK skill.
 *
 * On key press, the player spins for spinDuration frames, dealing spinDamage
 * to any enemy in contact (stub). Enemy collision is checked each frame while
 * spinning.
 *
 * RAM: 3 bytes (timer, cooldown, lock).
 * Key: 'Q' = keyboard matrix row 4, bit 6 (mask #40).
 */
exports.MSX2_BITMAP_SPIN_ATTACK_RAM_BYTES = 3;
const SPIN_KEY_ROW = 4;
const SPIN_KEY_MASK = 0x40; // bit 6 = 'Q'
function asmByte(v) { const b = Math.max(0, Math.min(255, Math.floor(v || 0))); return `#${b.toString(16).toUpperCase().padStart(2, '0')}`; }
function asmWord(v) { const w = Math.max(0, Math.min(0xFFFF, Math.floor(v || 0))); return `#${w.toString(16).toUpperCase().padStart(4, '0')}`; }
function bitmapSpinAttackEnabled(c) { return Boolean(c?.enabled); }
function buildBitmapSpinAttackEquates(c, ramBase) {
    if (!bitmapSpinAttackEnabled(c))
        return '';
    return `; --- SPIN ATTACK skill runtime state (3 bytes) ---
bitmap_spin_timer    EQU ${asmWord(ramBase)}
bitmap_spin_cooldown EQU ${asmWord(ramBase + 1)}
bitmap_spin_lock     EQU ${asmWord(ramBase + 2)}
`;
}
function buildBitmapSpinAttackInitClearAsm(c) {
    if (!bitmapSpinAttackEnabled(c))
        return '';
    return `    xor a
    ld (bitmap_spin_timer), a
    ld (bitmap_spin_cooldown), a
    ld (bitmap_spin_lock), a
`;
}
function buildBitmapSpinAttackGateAsm(c) {
    if (!bitmapSpinAttackEnabled(c))
        return '';
    return '    call bitmap_try_spin_attack\n';
}
function buildBitmapSpinAttackRuntimeAsm(c) {
    if (!c || !bitmapSpinAttackEnabled(c))
        return '';
    const spinDuration = asmByte(Math.max(10, Math.min(60, c.spinDuration || 30)));
    const spinCooldown = asmByte(Math.max(10, Math.min(120, c.spinCooldown || 40)));
    return `
; FUNCTION: bitmap_spin_pressed — reads 'Q' key (row ${SPIN_KEY_ROW} bit 6).
bitmap_spin_pressed:
    in a, (PPI_C)
    and #F0
    or ${SPIN_KEY_ROW}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(SPIN_KEY_MASK)}
    ret z
    ld a, 1
    ret

; FUNCTION: bitmap_try_spin_attack — arms a spin on key press, checks enemy
;   collision (stub) each frame while active.
; DESTROYS: AF,BC,DE,HL. PRESERVES: IX,IY.
bitmap_try_spin_attack:
    ; Tick cooldown.
    ld a, (bitmap_spin_cooldown)
    or a
    jp z, .spin_tick_timer
    dec a
    ld (bitmap_spin_cooldown), a
.spin_tick_timer:
    ld a, (bitmap_spin_timer)
    or a
    jp z, .spin_check_input
    dec a
    ld (bitmap_spin_timer), a
    call bitmap_spin_check_enemy_collision
.spin_check_input:
    call bitmap_spin_pressed
    or a
    jp nz, .spin_maybe_release
    xor a
    ld (bitmap_spin_lock), a
    jp .spin_done
.spin_maybe_release:
    ld a, (bitmap_spin_lock)
    or a
    jp nz, .spin_done
    ld a, (bitmap_spin_cooldown)
    or a
    jp nz, .spin_done
    ld a, (bitmap_spin_timer)
    or a
    jp nz, .spin_done
    ld a, ${spinDuration}
    ld (bitmap_spin_timer), a
    ld a, ${spinCooldown}
    ld (bitmap_spin_cooldown), a
    ld a, 1
    ld (bitmap_spin_lock), a
    call bitmap_spin_check_enemy_collision
.spin_done:
    ret

; FUNCTION: bitmap_spin_check_enemy_collision
; PURPOSE: Stub — checks the player's full hitbox (16x16 expanded by spin radius)
;   against enemy slots. TODO: wire enemy collision once enemies exist.
; DESTROYS: none. PRESERVES: AF,BC,DE,HL,IX,IY.
bitmap_spin_check_enemy_collision:
    ret
`;
}
