import { Msx2GrabConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room GRAB skill — wall cling with slow slide.
 *
 * Gravity hook: when the player is airborne and a solid wall is detected on
 * the facing side (toward which the player is holding direction), clamps
 * player_vy to slideSpeed so the player slides down slowly instead of falling.
 *
 * RAM: 1 byte (grabbing flag).
 * No key — triggers automatically on wall contact while holding direction.
 */

export const MSX2_BITMAP_GRAB_RAM_BYTES = 1;

function asmByte(v: number): string { const b = Math.max(0, Math.min(255, Math.floor(v||0))); return `#${b.toString(16).toUpperCase().padStart(2,'0')}`; }
function asmWord(v: number): string { const w = Math.max(0, Math.min(0xFFFF, Math.floor(v||0))); return `#${w.toString(16).toUpperCase().padStart(4,'0')}`; }

export function bitmapGrabEnabled(c: Msx2GrabConfig | undefined): boolean { return Boolean(c?.enabled); }

export function buildBitmapGrabEquates(c: Msx2GrabConfig | undefined, ramBase: number): string {
  if (!bitmapGrabEnabled(c)) return '';
  return `; --- GRAB skill runtime state (1 byte) ---
bitmap_grab_active EQU ${asmWord(ramBase)}
`;
}

export function buildBitmapGrabInitClearAsm(c: Msx2GrabConfig | undefined): string {
  if (!bitmapGrabEnabled(c)) return '';
  return `    xor a
    ld (bitmap_grab_active), a
`;
}

export function buildBitmapGrabGravityHookAsm(c: Msx2GrabConfig | undefined): string {
  if (!bitmapGrabEnabled(c)) return '';
  const slideSpeed = asmByte(Math.max(0, Math.min(4, c.slideSpeed ?? 1)));
  return `    ; GRAB gravity hook: clamp fall to slideSpeed when clinging to wall.
    ld a, (bitmap_grab_active)
    or a
    jp z, .grab_hook_done
    ld a, (player_vy)
    or a
    jp m, .grab_hook_done
    cp ${slideSpeed}
    jp c, .grab_hook_done
    ld a, ${slideSpeed}
    ld (player_vy), a
.grab_hook_done:
`;
}

export function buildBitmapGrabRuntimeAsm(c: Msx2GrabConfig | undefined): string {
  if (!c || !bitmapGrabEnabled(c)) return '';
  const slideSpeed = asmByte(Math.max(0, Math.min(4, c.slideSpeed ?? 1)));
  return `
; FUNCTION: bitmap_grab_detect — checks if player is touching a wall on the
;   facing side while airborne. Sets bitmap_grab_active accordingly and clamps
;   player_vy to ${slideSpeed} (slide) when grabbing.
; INPUT: player_x, player_y, player_facing. DESTROYS: AF,BC,DE,HL. PRESERVES: IX,IY.
; CALLS: bitmap_probe_solid.
bitmap_grab_detect:
    ; Only grab when airborne (player_flags bit 0 = 0 means NOT grounded).
    ld a, (player_flags)
    bit 0, a
    jp nz, .grab_not
    ; Check wall on facing side at mid-height.
    ld a, (player_facing)
    or a
    jp z, .grab_check_left
    ; Facing right: probe at player_x + 16 (right edge + 1).
    ld a, (player_x)
    add a, 16
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    jp z, .grab_not
    jp .grab_yes
.grab_check_left:
    ld a, (player_x)
    dec a
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    jp z, .grab_not
.grab_yes:
    ld a, 1
    ld (bitmap_grab_active), a
    ; Clamp falling velocity to slide speed.
    ld a, (player_vy)
    or a
    jp m, .grab_ret
    cp ${slideSpeed}
    jp c, .grab_ret
    ld a, ${slideSpeed}
    ld (player_vy), a
.grab_ret:
    ret
.grab_not:
    xor a
    ld (bitmap_grab_active), a
    ret
`;
}

export function buildBitmapGrabGateAsm(c: Msx2GrabConfig | undefined): string {
  if (!bitmapGrabEnabled(c)) return '';
  return '    call bitmap_grab_detect\n';
}
