import { Msx2GlideConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room GLIDE skill.
 *
 * Bitmap rooms use a compact integer player_vy, not the SCREEN 4 8.8 gravity
 * velocity pair. This port clamps only positive/downward player_vy after gravity
 * has been applied and before bitmap_try_move_y consumes it.
 *
 * RAM is assigned by the caller after dash/air_dash runtime blocks so each
 * optional skill keeps a non-overlapping slice.
 */

export const MSX2_BITMAP_GLIDE_RAM_BYTES = 2;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapGlideEnabled(config: Msx2GlideConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

export function buildBitmapGlideEquates(
  config: Msx2GlideConfig | undefined,
  ramBase: number,
): string {
  if (!bitmapGlideEnabled(config)) return '';
  return `; --- GLIDE skill runtime state (2 bytes) ---
bitmap_glide_stamina EQU ${asmWord(ramBase)}
bitmap_glide_active  EQU ${asmWord(ramBase + 1)}
`;
}

export function buildBitmapGlideInitClearAsm(config: Msx2GlideConfig | undefined): string {
  if (!bitmapGlideEnabled(config)) return '';
  const initialStamina = (config?.glideBoostCost || 0) > 0
    ? '    ld a, #64\n    ld (bitmap_glide_stamina), a\n'
    : '';
  return `${initialStamina}    xor a
    ld (bitmap_glide_active), a
`;
}

export function buildBitmapGlideGravityHookAsm(config: Msx2GlideConfig | undefined): string {
  if (!bitmapGlideEnabled(config)) return '';
  return `    call bitmap_apply_glide_clamp
`;
}

export function buildBitmapGlideRuntimeAsm(config: Msx2GlideConfig | undefined): string {
  if (!config || !bitmapGlideEnabled(config)) return '';

  const glideSpeed = asmByte(config.glideSpeed);
  const staminaGate = config.glideBoostCost > 0
    ? `    ld a, (bitmap_glide_stamina)
    or a
    jp z, .glide_inactive
    dec a
    ld (bitmap_glide_stamina), a
`
    : '';
  const staminaRefill = config.glideBoostCost > 0
    ? `    ld a, #64
    ld (bitmap_glide_stamina), a
`
    : '';

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_glide_jump_pressed
; ------------------------------------------------------------
; PURPOSE: Reads row 8 jump inputs (SPACE or UP) directly from the PPI.
; INPUT: none.
; OUTPUT: A = 1 when SPACE/UP is pressed, A = 0 otherwise (Z set when none).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 8 on PPI_C, matching update_player_movement.
; ------------------------------------------------------------
bitmap_glide_jump_pressed:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #21
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_glide_clamp
; ------------------------------------------------------------
; PURPOSE: While airborne and holding jump, caps downward player_vy at glideSpeed.
;   glideSpeed=0 creates a hover/floating fall cap.
; INPUT: player_flags bit 0 grounded flag, player_vy signed byte.
; OUTPUT: player_vy clamped when falling faster than glideSpeed;
;   bitmap_glide_active set to 1 only on frames where glide input is accepted.
; DESTROYS: AF, BC. PRESERVES: DE, HL, IX, IY.
; CALLS: bitmap_glide_jump_pressed.
; SIDE EFFECTS: Updates bitmap_glide_active and optionally bitmap_glide_stamina.
; NOTES: Only positive/downward velocity is capped. Negative upward velocity is
;   preserved so glide cannot cancel an active jump ascent. No PUSH/POP required:
;   BC is intentionally volatile and no caller-owned loop counter is live here.
; ------------------------------------------------------------
bitmap_apply_glide_clamp:
    ld a, (player_flags)
    bit 0, a
    jp nz, .glide_grounded
    call bitmap_glide_jump_pressed
    or a
    jp z, .glide_inactive
${staminaGate}    ld a, (player_vy)
    bit 7, a
    jp nz, .glide_set_active
    ld b, a
    ld a, ${glideSpeed}
    or a
    jp z, .glide_float
    cp b
    jp c, .glide_cap_store
.glide_set_active:
    ld a, 1
    ld (bitmap_glide_active), a
    ret
.glide_cap_store:
    ld (player_vy), a
    ld a, 1
    ld (bitmap_glide_active), a
    ret
.glide_float:
    xor a
    ld (player_vy), a
    ld a, 1
    ld (bitmap_glide_active), a
    ret
.glide_grounded:
${staminaRefill}.glide_inactive:
    xor a
    ld (bitmap_glide_active), a
    ret
`;
}
