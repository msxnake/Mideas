import { Msx2BitmapKeyboardBinding, Msx2PlatformDropConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room PLATFORM DROP skill: step down through a one-way platform.
 *
 * The room decides WHICH cells are one-way (the "Platform" brush, cell bit #20,
 * read by bitmap_probe_floor). This skill decides whether the player may leave
 * one on purpose, and with which key. Enemies need none of it: their
 * DROP_THROUGH is an authored behaviour rule, not an input.
 *
 * HOW THE DROP ACTUALLY WORKS
 *   Nothing teleports the player. A one-way platform only holds a body whose
 *   feet are in the top few pixels of its cell, so all the drop has to do is
 *   make the floor probe stop seeing platforms for a few frames. Gravity does
 *   the rest, and the player lands on whatever is underneath — which may well be
 *   another platform, and that is the point.
 *
 * WHY A TIMER AND NOT A FLAG
 *   A flag cleared "once past the cell" needs to know when that happened, and
 *   the player can be pushed, hurt or teleported mid-fall. A countdown cannot
 *   get stuck: worst case the player falls one cell further than intended.
 *   dropFrames is authored precisely so that failure stays small and visible.
 */

/** timer, lock, probe mode. */
export const MSX2_BITMAP_PLATFORM_DROP_RAM_BYTES = 3;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function bitmapPlatformDropEnabled(config: Msx2PlatformDropConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

export function buildBitmapPlatformDropEquates(
  config: Msx2PlatformDropConfig | undefined,
  ramBase: number,
): string {
  if (!bitmapPlatformDropEnabled(config)) return '';
  return `; --- PLATFORM DROP skill state (${MSX2_BITMAP_PLATFORM_DROP_RAM_BYTES} bytes) ---
bitmap_platform_drop_timer EQU ${asmWord(ramBase)}
bitmap_platform_drop_lock  EQU ${asmWord(ramBase + 1)}
bitmap_platform_probe_mode EQU ${asmWord(ramBase + 2)}
`;
}

export function buildBitmapPlatformDropInitClearAsm(config: Msx2PlatformDropConfig | undefined): string {
  if (!bitmapPlatformDropEnabled(config)) return '';
  return `    xor a
    ld (bitmap_platform_drop_timer), a
    ld (bitmap_platform_drop_lock), a
    ld (bitmap_platform_probe_mode), a
`;
}

/** Called once per frame from the player update, before movement. */
export function buildBitmapPlatformDropGateAsm(config: Msx2PlatformDropConfig | undefined): string {
  if (!bitmapPlatformDropEnabled(config)) return '';
  return `    call bitmap_tick_platform_drop
    call bitmap_try_start_platform_drop
`;
}

function buildKeyCheck(key: Msx2BitmapKeyboardBinding | undefined): string {
  if (!key) {
    return `    xor a
    ret
`;
  }
  return `    in a, (PPI_C)
    and #F0
    or ${key.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(key.mask)}
    ret z
`;
}

export function buildBitmapPlatformDropRuntimeAsm(config: Msx2PlatformDropConfig | undefined): string {
  if (!bitmapPlatformDropEnabled(config)) return '';

  const primaryKey = config.primaryKeyboard ?? { label: 'N', row: 4, mask: 0x08 };
  const secondaryKey = config.secondaryControl !== 'none' ? config.secondaryKeyboard : undefined;
  const comboLabel = secondaryKey ? `${primaryKey.label}+${secondaryKey.label}` : primaryKey.label;
  const lockGate = config.requireKeyRelease
    ? `    ld a, (bitmap_platform_drop_lock)
    or a
    ret nz
`
    : '';
  const armLock = config.requireKeyRelease
    ? `    ld a, 1
    ld (bitmap_platform_drop_lock), a
`
    : '';

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_platform_drop_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the configured platform-drop input (${comboLabel}) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_platform_drop_pressed:
${buildKeyCheck(primaryKey)}${secondaryKey ? buildKeyCheck(secondaryKey) : ''}    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_platform_drop_down_held
; ------------------------------------------------------------
; PURPOSE: DOWN on the cursor pad, row 8 bit 6. The drop deliberately needs a
;   direction as well as the button: the skill key on its own would fight every
;   other use of that key, and "press down to go down" is what a player guesses.
; OUTPUT: A = 1 when held, A = 0 otherwise (Z when released).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_platform_drop_down_held:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #40
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_platform_drop
; ------------------------------------------------------------
; PURPOSE: Runs the drop window down, and releases the key lock. The countdown
;   is what makes platforms invisible to the floor probe; when it hits zero the
;   world goes back to normal on its own, with nothing to reset.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_platform_drop:
    call bitmap_platform_drop_pressed
    or a
    jp nz, .drop_tick_timer
    xor a
    ld (bitmap_platform_drop_lock), a
.drop_tick_timer:
    ld a, (bitmap_platform_drop_timer)
    or a
    ret z
    dec a
    ld (bitmap_platform_drop_timer), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_platform_drop
; ------------------------------------------------------------
; PURPOSE: Opens the drop window when the player holds DOWN, presses the skill
;   key, and is actually standing on a one-way platform.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
; The platform test is not politeness: without it the key would let the player
; sink through ordinary ground, and the bug would surface far from here.
bitmap_try_start_platform_drop:
    ld a, (bitmap_platform_drop_timer)
    or a
    ret nz                     ; already dropping
${lockGate}    call bitmap_platform_drop_down_held
    or a
    ret z
    call bitmap_platform_drop_pressed
    or a
    ret z
    ld a, (player_x)
    add a, 8
    ld b, a
    ld a, (player_y)
    add a, 32                  ; the row under the feet
    ld c, a
    call bitmap_probe_solid
    bit 5, a                   ; one-way platform underfoot?
    ret z
${armLock}    ld a, ${asmByte(config.dropFrames)}
    ld (bitmap_platform_drop_timer), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_probe_player_vertical
; ------------------------------------------------------------
; PURPOSE: The single question the player's vertical mover asks. Which routine
;   answers it depends on where the player is going and whether a drop is open:
;     moving UP        -> bitmap_probe_solid, so platforms are passed through
;     dropping         -> bitmap_probe_solid, so the platform underfoot lets go
;     otherwise        -> bitmap_probe_floor, so platforms are ground
; INPUT: B = pixel X, C = pixel Y. OUTPUT: as bitmap_probe_solid.
; DESTROYS: AF, DE, HL. PRESERVES: BC.
; ------------------------------------------------------------
bitmap_probe_player_vertical:
    ld a, (bitmap_platform_probe_mode)
    or a
    jp z, bitmap_probe_solid
    ld a, (bitmap_platform_drop_timer)
    or a
    jp nz, bitmap_probe_solid
    jp bitmap_probe_floor
`;
}
