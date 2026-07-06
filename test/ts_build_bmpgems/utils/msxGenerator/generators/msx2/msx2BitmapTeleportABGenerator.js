"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_TELEPORT_AB_RAM_BYTES = void 0;
exports.bitmapTeleportABEnabled = bitmapTeleportABEnabled;
exports.buildBitmapTeleportABEquates = buildBitmapTeleportABEquates;
exports.buildBitmapTeleportABInitClearAsm = buildBitmapTeleportABInitClearAsm;
exports.buildBitmapTeleportABGateAsm = buildBitmapTeleportABGateAsm;
exports.buildBitmapTeleportABRuntimeAsm = buildBitmapTeleportABRuntimeAsm;
/**
 * SCREEN 5 bitmap-room TELEPORT A-B skill.
 *
 * Saves a position A on the first press; on subsequent presses warps between
 * the saved point A and the current position (B), as long as the destination
 * is within maxDistance tiles and not inside a solid cell. Pure RAM — no
 * sprites, enemies, or entities required.
 *
 * RAM: 8 bytes (cooldown, delay, lock, flags, ax, ay, bx, by).
 *
 * Teleport key (pilot): 'O' = keyboard matrix row 4, bit 4 (mask #10).
 * M = dash (bit 2), N = shoot (bit 3), O = teleport (bit 4) — all on row 4.
 */
exports.MSX2_BITMAP_TELEPORT_AB_RAM_BYTES = 8;
const TELEPORT_KEY_ROW = 4;
const TELEPORT_KEY_MASK = 0x10; // bit 4 = 'O'
function asmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
function asmWord(value) {
    const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
/** True when the teleport skill is enabled. */
function bitmapTeleportABEnabled(config) {
    return Boolean(config?.enabled);
}
/** RAM EQU block (empty when disabled). */
function buildBitmapTeleportABEquates(config, ramBase) {
    if (!bitmapTeleportABEnabled(config))
        return '';
    return `; --- TELEPORT A-B skill runtime state (8 bytes) ---
bitmap_teleport_cooldown EQU ${asmWord(ramBase)}
bitmap_teleport_delay    EQU ${asmWord(ramBase + 1)}
bitmap_teleport_lock     EQU ${asmWord(ramBase + 2)}
bitmap_teleport_flags    EQU ${asmWord(ramBase + 3)}
bitmap_teleport_ax       EQU ${asmWord(ramBase + 4)}
bitmap_teleport_ay       EQU ${asmWord(ramBase + 5)}
bitmap_teleport_bx       EQU ${asmWord(ramBase + 6)}
bitmap_teleport_by       EQU ${asmWord(ramBase + 7)}
BITMAP_TELEPORT_FLAG_HAS_A    EQU #01
BITMAP_TELEPORT_FLAG_HAS_B    EQU #02
BITMAP_TELEPORT_FLAG_TARGET_B EQU #04
`;
}
/** Clears the teleport state. Inlined at init_rom. */
function buildBitmapTeleportABInitClearAsm(config) {
    if (!bitmapTeleportABEnabled(config))
        return '';
    return `    xor a
    ld (bitmap_teleport_cooldown), a
    ld (bitmap_teleport_delay), a
    ld (bitmap_teleport_lock), a
    ld (bitmap_teleport_flags), a
    ld (bitmap_teleport_ax), a
    ld (bitmap_teleport_ay), a
    ld (bitmap_teleport_bx), a
    ld (bitmap_teleport_by), a
`;
}
/** Main-loop gate: runs the teleport tick + input handler. */
function buildBitmapTeleportABGateAsm(config) {
    if (!bitmapTeleportABEnabled(config))
        return '';
    return '    call bitmap_try_teleport_ab\n';
}
/** The full teleport runtime ASM. Empty when disabled. */
function buildBitmapTeleportABRuntimeAsm(config) {
    if (!config || !bitmapTeleportABEnabled(config))
        return '';
    const cooldownFrames = asmByte(config.teleportCooldown);
    const delayFrames = asmByte(config.teleportDelay);
    const maxDistanceTiles = asmByte(config.maxDistance);
    return `
; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the teleport key ('O', keyboard matrix row ${TELEPORT_KEY_ROW} bit 4) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_teleport_pressed:
    in a, (PPI_C)
    and #F0
    or ${TELEPORT_KEY_ROW}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(TELEPORT_KEY_MASK)}
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_abs_tiles
; ------------------------------------------------------------
; PURPOSE: Converts a signed pixel delta into an absolute tile delta.
; INPUT: A = pixel delta; carry from the caller's SUB. OUTPUT: A = |delta| / 8.
; NOTES: do NOT insert flag-touching instructions before the JP C.
; ------------------------------------------------------------
bitmap_teleport_abs_tiles:
    jp c, .tele_abs_negate
    jp .tele_abs_shift
.tele_abs_negate:
    xor #FF
    inc a
.tele_abs_shift:
    srl a
    srl a
    srl a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_distance_ok_bc
; ------------------------------------------------------------
; PURPOSE: Checks the Chebyshev tile distance to the destination.
; INPUT: B = dest x, C = dest y. OUTPUT: A=1 within range, A=0 (Z) too far.
; DESTROYS: AF, DE. PRESERVES: BC, HL.
; ------------------------------------------------------------
bitmap_teleport_distance_ok_bc:
    push bc
    ld a, (player_x)
    sub b
    call bitmap_teleport_abs_tiles
    ld d, a
    pop bc
    push bc
    ld a, (player_y)
    sub c
    call bitmap_teleport_abs_tiles
    ld e, a
    pop bc
    ld a, d
    cp e
    jp nc, .tele_dist_use_d
    ld a, e
.tele_dist_use_d:
    cp ${maxDistanceTiles}
    jp nc, .tele_dist_fail
    ld a, 1
    ret
.tele_dist_fail:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_dest_free_bc
; ------------------------------------------------------------
; PURPOSE: Verifies the destination is not solid before warping.
; INPUT: B = dest x, C = dest y. OUTPUT: A=1 free, A=0 (Z) blocked.
; DESTROYS: AF. PRESERVES: BC (bitmap_probe_solid keeps BC).
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_teleport_dest_free_bc:
    push bc
    ld a, b
    add a, 4
    ld b, a
    ld a, c
    add a, 8
    ld c, a
    call bitmap_probe_solid
    pop bc
    ret nz
    push bc
    ld a, b
    add a, 12
    ld b, a
    ld a, c
    add a, 8
    ld c, a
    call bitmap_probe_solid
    pop bc
    ret nz
    ld a, 1
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_apply_bc
; ------------------------------------------------------------
; PURPOSE: Warps the player to B/C and resets vertical physics.
; INPUT: B = dest x, C = dest y. OUTPUT: player_x/y updated, vy/flags cleared.
; DESTROYS: AF. PRESERVES: BC, DE, HL.
; ------------------------------------------------------------
bitmap_teleport_apply_bc:
    ld a, b
    ld (player_x), a
    ld a, c
    ld (player_y), a
    xor a
    ld (player_vy), a
    ld (player_flags), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_save_current_to_a
; ------------------------------------------------------------
; PURPOSE: Stores the current position as point A.
; DESTROYS: AF. PRESERVES: BC, DE, HL.
; ------------------------------------------------------------
bitmap_teleport_save_current_to_a:
    ld a, (player_x)
    ld (bitmap_teleport_ax), a
    ld a, (player_y)
    ld (bitmap_teleport_ay), a
    ld a, (bitmap_teleport_flags)
    or BITMAP_TELEPORT_FLAG_HAS_A
    ld (bitmap_teleport_flags), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_teleport_save_current_to_b
; ------------------------------------------------------------
; PURPOSE: Stores the current position as point B.
; DESTROYS: AF. PRESERVES: BC, DE, HL.
; ------------------------------------------------------------
bitmap_teleport_save_current_to_b:
    ld a, (player_x)
    ld (bitmap_teleport_bx), a
    ld a, (player_y)
    ld (bitmap_teleport_by), a
    ld a, (bitmap_teleport_flags)
    or BITMAP_TELEPORT_FLAG_HAS_B
    ld (bitmap_teleport_flags), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_teleport_ab
; ------------------------------------------------------------
; PURPOSE: Handles the teleport A-B input: first press saves point A,
;   later presses warp between A and B when the destination is within
;   range and not inside a solid cell.
; INPUT: none. OUTPUT: player may be warped; timers/locks updated.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_try_teleport_ab:
    ; Tick cooldown.
    ld a, (bitmap_teleport_cooldown)
    or a
    jp z, .tick_delay
    dec a
    ld (bitmap_teleport_cooldown), a
.tick_delay:
    ; Tick invulnerability delay.
    ld a, (bitmap_teleport_delay)
    or a
    jp z, .release_lock
    dec a
    ld (bitmap_teleport_delay), a
.release_lock:
    call bitmap_teleport_pressed
    or a
    jp nz, .check_input
    xor a
    ld (bitmap_teleport_lock), a
.check_input:
    call bitmap_teleport_pressed
    or a
    jp z, .teleport_done
    ld a, (bitmap_teleport_lock)
    or a
    jp nz, .teleport_done
    ld a, (bitmap_teleport_cooldown)
    or a
    jp nz, .teleport_done
    ld a, (bitmap_teleport_flags)
    bit 0, a
    jp nz, .teleport_has_a
${config.savePointA ? `.teleport_save_a:
    call bitmap_teleport_save_current_to_a
    ld a, ${cooldownFrames}
    ld (bitmap_teleport_cooldown), a
    ld a, 1
    ld (bitmap_teleport_lock), a
    jp .teleport_done
` : `    jp .teleport_done
`}.teleport_has_a:
    ld a, (bitmap_teleport_flags)
    bit 2, a
    jp nz, .teleport_to_b
.teleport_to_a:
    ld a, (bitmap_teleport_ax)
    ld b, a
    ld a, (bitmap_teleport_ay)
    ld c, a
    call bitmap_teleport_distance_ok_bc
    or a
    jp z, .teleport_done
    call bitmap_teleport_dest_free_bc
    or a
    jp z, .teleport_done
    call bitmap_teleport_save_current_to_b
    call bitmap_teleport_apply_bc
    ld a, (bitmap_teleport_flags)
    or BITMAP_TELEPORT_FLAG_TARGET_B
    ld (bitmap_teleport_flags), a
    jp .teleport_finish
.teleport_to_b:
    ld a, (bitmap_teleport_flags)
    bit 1, a
    jp z, .teleport_done
    ld a, (bitmap_teleport_bx)
    ld b, a
    ld a, (bitmap_teleport_by)
    ld c, a
    call bitmap_teleport_distance_ok_bc
    or a
    jp z, .teleport_done
    call bitmap_teleport_dest_free_bc
    or a
    jp z, .teleport_done
    call bitmap_teleport_save_current_to_a
    call bitmap_teleport_apply_bc
    ld a, (bitmap_teleport_flags)
    and #FB
    ld (bitmap_teleport_flags), a
.teleport_finish:
    ld a, ${delayFrames}
    ld (bitmap_teleport_delay), a
    ld a, ${cooldownFrames}
    ld (bitmap_teleport_cooldown), a
    ld a, 1
    ld (bitmap_teleport_lock), a
.teleport_done:
    ret
`;
}
