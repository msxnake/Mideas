"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_WALL_BREAK_RAM_BYTES = void 0;
exports.bitmapWallBreakEnabled = bitmapWallBreakEnabled;
exports.buildBitmapWallBreakEquates = buildBitmapWallBreakEquates;
exports.buildBitmapWallBreakInitClearAsm = buildBitmapWallBreakInitClearAsm;
exports.buildBitmapWallBreakGateAsm = buildBitmapWallBreakGateAsm;
exports.buildBitmapWallBreakRuntimeAsm = buildBitmapWallBreakRuntimeAsm;
/**
 * SCREEN 5 bitmap-room WALL BREAK skill.
 *
 * On key press, probes the tile directly ahead of the player (facing direction)
 * and, if solid, clears it in the RAM collision map so the player can pass
 * through. Visual tile clearing is a TODO (requires VDP command fill).
 *
 * RAM: 2 bytes (cooldown, lock).
 * Key: 'R' = keyboard matrix row 4, bit 7 (mask #80).
 */
exports.MSX2_BITMAP_WALL_BREAK_RAM_BYTES = 2;
const WALL_BREAK_KEY_ROW = 4;
const WALL_BREAK_KEY_MASK = 0x80; // bit 7 = 'R'
function asmByte(v) { const b = Math.max(0, Math.min(255, Math.floor(v || 0))); return `#${b.toString(16).toUpperCase().padStart(2, '0')}`; }
function asmWord(v) { const w = Math.max(0, Math.min(0xFFFF, Math.floor(v || 0))); return `#${w.toString(16).toUpperCase().padStart(4, '0')}`; }
function bitmapWallBreakEnabled(c) { return Boolean(c?.enabled); }
function buildBitmapWallBreakEquates(c, ramBase) {
    if (!bitmapWallBreakEnabled(c))
        return '';
    return `; --- WALL BREAK skill runtime state (2 bytes) ---
bitmap_wallbreak_cooldown EQU ${asmWord(ramBase)}
bitmap_wallbreak_lock     EQU ${asmWord(ramBase + 1)}
`;
}
function buildBitmapWallBreakInitClearAsm(c) {
    if (!bitmapWallBreakEnabled(c))
        return '';
    return `    xor a
    ld (bitmap_wallbreak_cooldown), a
    ld (bitmap_wallbreak_lock), a
`;
}
function buildBitmapWallBreakGateAsm(c) {
    if (!bitmapWallBreakEnabled(c))
        return '';
    return '    call bitmap_try_wall_break\n';
}
function buildBitmapWallBreakRuntimeAsm(c) {
    if (!c || !bitmapWallBreakEnabled(c))
        return '';
    const breakCooldown = asmByte(Math.max(0, Math.min(120, c.breakCooldown || 20)));
    // COLLISION_COLS = 16 (from bitmap room constants)
    return `
; FUNCTION: bitmap_wallbreak_pressed — reads 'R' key (row ${WALL_BREAK_KEY_ROW} bit 7).
bitmap_wallbreak_pressed:
    in a, (PPI_C)
    and #F0
    or ${WALL_BREAK_KEY_ROW}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(WALL_BREAK_KEY_MASK)}
    ret z
    ld a, 1
    ret

; FUNCTION: bitmap_try_wall_break — on key press, clears the solid tile ahead.
; The collision map is at bitmap_room_collision_map (16 cols x 12 rows).
; Cell address = base + cellY * 16 + cellX.
; DESTROYS: AF,BC,DE,HL. PRESERVES: IX,IY.
bitmap_try_wall_break:
    ; Tick cooldown.
    ld a, (bitmap_wallbreak_cooldown)
    or a
    jp z, .wb_check_lock
    dec a
    ld (bitmap_wallbreak_cooldown), a
.wb_check_lock:
    call bitmap_wallbreak_pressed
    or a
    jp nz, .wb_maybe_release
    xor a
    ld (bitmap_wallbreak_lock), a
    jp .wb_done
.wb_maybe_release:
    ld a, (bitmap_wallbreak_lock)
    or a
    jp nz, .wb_done
    ld a, (bitmap_wallbreak_cooldown)
    or a
    jp nz, .wb_done
    ; Compute target cell ahead.
    ld a, (player_facing)
    or a
    jp z, .wb_face_left
    ; Facing right: cellX = (player_x + 16) / 16.
    ld a, (player_x)
    add a, 16
    jp .wb_got_x
.wb_face_left:
    ld a, (player_x)
    dec a
.wb_got_x:
    srl a
    srl a
    srl a
    srl a
    ld e, a          ; E = cellX
    ld a, (player_y)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    ld d, a          ; D = cellY
    ; Bounds check: cellX < 16, cellY < 12.
    ld a, e
    cp 16
    jp nc, .wb_done
    ld a, d
    cp 12
    jp nc, .wb_done
    ; Compute address = bitmap_room_collision_map + D * 16 + E.
    ld hl, bitmap_room_collision_map
    ld b, 0
    ld c, e
    add hl, bc       ; + cellX
    ; D * 16: shift left 4.
    ld a, d
    sla a
    sla a
    sla a
    sla a
    ld c, a
    ld b, 0
    add hl, bc       ; + cellY * 16
    ; Check if solid.
    ld a, (hl)
    or a
    jp z, .wb_done   ; already empty, nothing to break
    ; Clear it.
    xor a
    ld (hl), a
    ; Set cooldown + lock.
    ld a, ${breakCooldown}
    ld (bitmap_wallbreak_cooldown), a
    ld a, 1
    ld (bitmap_wallbreak_lock), a
.wb_done:
    ret
`;
}
