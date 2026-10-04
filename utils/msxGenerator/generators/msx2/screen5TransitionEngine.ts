/**
 * Shared Z80 engine for the advanced SCREEN 5 GameFlow transitions.
 *
 * Two primitives cover every new effect:
 *
 *   <p>_play      HL = fill table, DE = Y offset of the visible page (0 / 256).
 *                 Plays a tiled rectangle plan (utils/msx2TransitionPatterns.ts)
 *                 with V9938 HMMV fills, waiting `framesPerStep` frames after
 *                 each step. Wipes, blinds, iris and pattern dissolves.
 *
 *   <p>_pal_lerp  HL = "from" palette (32 bytes), DE = "to" palette, A = frames
 *                 per step. Eight interpolation steps, from -> to, written
 *                 straight to the palette port. Fades, crossfades and flashes.
 *
 * The same source is emitted by the generic GameFlow walker (interrupts ON,
 * frame pacing with HALT) and by the bitmap-room runtime (interrupts OFF, frame
 * pacing by polling S#0). `interrupts` decides whether VDP register accesses
 * are bracketed with DI/EI; nothing here ever enables interrupts in a DI
 * runtime.
 *
 * Working storage lives in a frame carved out of the stack and addressed with
 * IX, so the engine needs no RAM equates of its own. IX is preserved.
 */

import type { Msx2GameFlowTransitionNode } from '../../../../types';
import {
  buildScreen5FillPlan,
  buildSolidScreen5PaletteBytes,
  encodeScreen5FillPlan,
  resolveScreen5TransitionSpec,
  screen5TransitionSpecKey,
  SCREEN5_TFX_HEIGHT,
  type Screen5TransitionSpec,
} from '../../../msx2TransitionPatterns';

export interface Screen5TfxRuntimeOptions {
  /** Label prefix, e.g. `gf_tfx` or `bitmap_tfx`. */
  prefix: string;
  /** True when the host runtime runs with interrupts enabled (BIOS HALT pacing). */
  interrupts: boolean;
  /** One-frame wait. May clobber AF, BC; must preserve DE, HL, IX. */
  frameWaitAsm: string;
  fill: boolean;
  palette: boolean;
}

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

export function chunkTfxBytes(bytes: number[]): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }
  return lines.join('\n');
}

export function generateScreen5TfxRuntime(options: Screen5TfxRuntimeOptions): string {
  const p = options.prefix;
  const di = options.interrupts ? '    di\n' : '';
  const ei = options.interrupts ? '    ei\n' : '';
  const frameWait = options.frameWaitAsm.trimEnd();
  const parts: string[] = [];

  parts.push(`
; ==================================================================
; SCREEN 5 transition engine (${p}_*): HMMV fill tables + palette fades.
; ==================================================================
; ------------------------------------------------------------
; FUNCTION: ${p}_wait_ce
; ------------------------------------------------------------
; PURPOSE:
;   Wait until the V9938 command engine is idle (S#2 bit 0 = CE).
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF
;
; PRESERVES:
;   BC, DE, HL, IX, IY
;
; CALLS:
;   None
;
; SIDE EFFECTS:
;   R#15 is left at 0 (S#0 selected) on every exit.
;
; NOTES:
;   With interrupts ON each poll is bracketed by DI/EI so the BIOS ISR
;   never reads S#2.
; ------------------------------------------------------------
${p}_wait_ce:
${di}    ld a, 2
    out (#99), a
    ld a, #8F
    out (#99), a
    in a, (#99)
    push af
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a
${ei}    pop af
    rrca
    jp c, ${p}_wait_ce
    ret
`);

  if (options.fill) {
    parts.push(`
; ------------------------------------------------------------
; FUNCTION: ${p}_hmmv
; ------------------------------------------------------------
; PURPOSE:
;   Launch one HMMV (high-speed byte fill) rectangle.
;
; INPUT:
;   HL = DX (even pixel), DE = DY (absolute, page offset included)
;   BC = NX (even pixels), A = NY (1..212)
;   (IX+6) = colour byte (index in both nibbles)
;
; OUTPUT:
;   None (the command runs asynchronously).
;
; DESTROYS:
;   AF
;
; PRESERVES:
;   BC, DE, HL, IX, IY
;
; CALLS:
;   ${p}_wait_ce
;
; SIDE EFFECTS:
;   R#17 is left pointing past R#46; R#15 = 0.
; ------------------------------------------------------------
${p}_hmmv:
    push af
    call ${p}_wait_ce
${di}    ld a, 36
    out (#99), a
    ld a, #91                 ; R#17 = 36, auto-increment
    out (#99), a
    ld a, l
    out (#9B), a              ; DX
    ld a, h
    out (#9B), a
    ld a, e
    out (#9B), a              ; DY
    ld a, d
    out (#9B), a
    ld a, c
    out (#9B), a              ; NX
    ld a, b
    out (#9B), a
    pop af
    out (#9B), a              ; NY
    xor a
    out (#9B), a
    ld a, (ix+6)
    out (#9B), a              ; CLR
    xor a
    out (#9B), a              ; ARG
    ld a, #C0
    out (#9B), a              ; CMD = HMMV
${ei}    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_play
; ------------------------------------------------------------
; PURPOSE:
;   Play a SCREEN 5 transition fill table: every step paints its
;   rectangles in every tile of the page, then waits fps frames.
;
; INPUT:
;   HL = table: DB tileW/2, tileH, tilesX, tilesY, fps, colour;
;        per step DB x/2, y, w/2, h ... DB #FF; DB #FE at the end
;   DE = Y offset of the visible page (0 = page 0, 256 = page 1)
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   ${p}_rect_tiles, ${p}_wait_ce, frame wait
;
; SIDE EFFECTS:
;   Fills VRAM of the visible page. R#15 = 0 and R#17 = 32 on exit.
;
; NOTES:
;   Uses a 20-byte frame on the stack addressed by IX:
;   0-1 tileW, 2 tileH, 3 tilesX, 4 tilesY, 5 fps, 6 colour, 7-8 rect ptr,
;   9 rows left, 10-11 row base, 12 cols left, 13-14 col base, 15 NY,
;   16-17 DY, 18-19 Y offset.
; ------------------------------------------------------------
${p}_play:
    push ix
    ld ix, -20
    add ix, sp
    ld sp, ix
    ld (ix+18), e
    ld (ix+19), d
    ld a, (hl)
    ld e, a
    ld d, 0
    ex de, hl
    add hl, hl
    ld (ix+0), l
    ld (ix+1), h
    ex de, hl
    inc hl
    ld a, (hl)
    ld (ix+2), a
    inc hl
    ld a, (hl)
    ld (ix+3), a
    inc hl
    ld a, (hl)
    ld (ix+4), a
    inc hl
    ld a, (hl)
    ld (ix+5), a
    inc hl
    ld a, (hl)
    ld (ix+6), a
    inc hl
${p}_play_step:
    ld a, (hl)
    cp #FE
    jp z, ${p}_play_done
    cp #FF
    jp z, ${p}_play_step_end
    ld (ix+7), l
    ld (ix+8), h
    call ${p}_rect_tiles
    ld l, (ix+7)
    ld h, (ix+8)
    inc hl
    inc hl
    inc hl
    inc hl
    jp ${p}_play_step
${p}_play_step_end:
    inc hl
    ld (ix+7), l
    ld (ix+8), h
    ld b, (ix+5)
${p}_play_wait:
    push bc
${frameWait}
    pop bc
    djnz ${p}_play_wait
    ld l, (ix+7)
    ld h, (ix+8)
    jp ${p}_play_step
${p}_play_done:
    call ${p}_wait_ce
${di}    ld a, 32
    out (#99), a
    ld a, #91                 ; R#17 = 32: the rest of the runtime expects it
    out (#99), a
${ei}    ld hl, 20
    add hl, sp
    ld sp, hl
    pop ix
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_rect_tiles
; ------------------------------------------------------------
; PURPOSE:
;   Paint the rectangle at (IX+7/8) in every tile, clipped to the
;   ${SCREEN5_TFX_HEIGHT} visible lines.
;
; INPUT:
;   IX = ${p}_play frame (header already copied).
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   ${p}_hmmv
;
; SIDE EFFECTS:
;   Frame bytes 9..17 are used as loop state.
; ------------------------------------------------------------
${p}_rect_tiles:
    xor a
    ld (ix+10), a
    ld (ix+11), a
    ld a, (ix+4)
    ld (ix+9), a
${p}_rect_row:
    ld l, (ix+7)
    ld h, (ix+8)
    inc hl
    ld e, (hl)                ; rect y
    ld d, 0
    ld l, (ix+10)
    ld h, (ix+11)
    add hl, de                ; HL = local DY
    push hl
    ld de, ${SCREEN5_TFX_HEIGHT}
    or a
    sbc hl, de
    pop de                    ; DE = local DY
    ret nc                    ; row starts below the visible page: done
    ld a, l
    neg
    ld c, a                   ; C = lines left on the page
    ld l, (ix+7)
    ld h, (ix+8)
    inc hl
    inc hl
    inc hl
    ld a, (hl)                ; rect h
    cp c
    jp c, ${p}_rect_h_ok
    ld a, c
${p}_rect_h_ok:
    ld (ix+15), a
    ld l, (ix+18)
    ld h, (ix+19)
    add hl, de
    ld (ix+16), l
    ld (ix+17), h
    xor a
    ld (ix+13), a
    ld (ix+14), a
    ld a, (ix+3)
    ld (ix+12), a
${p}_rect_col:
    ld l, (ix+7)
    ld h, (ix+8)
    inc hl
    inc hl
    ld a, (hl)                ; rect w/2
    ld c, a
    ld b, 0
    sla c
    rl b                      ; BC = NX
    dec hl
    dec hl
    ld a, (hl)                ; rect x/2
    ld l, a
    ld h, 0
    add hl, hl
    ld e, (ix+13)
    ld d, (ix+14)
    add hl, de                ; HL = DX
    ld e, (ix+16)
    ld d, (ix+17)             ; DE = DY
    ld a, (ix+15)             ; A = NY
    call ${p}_hmmv
    ld l, (ix+13)
    ld h, (ix+14)
    ld e, (ix+0)
    ld d, (ix+1)
    add hl, de
    ld (ix+13), l
    ld (ix+14), h
    dec (ix+12)
    jp nz, ${p}_rect_col
    ld l, (ix+10)
    ld h, (ix+11)
    ld e, (ix+2)
    ld d, 0
    add hl, de
    ld (ix+10), l
    ld (ix+11), h
    dec (ix+9)
    jp nz, ${p}_rect_row
    ret
`);
  }

  if (options.palette) {
    parts.push(`
; ------------------------------------------------------------
; FUNCTION: ${p}_pal_set
; ------------------------------------------------------------
; PURPOSE:
;   Upload a whole 16-colour palette at once.
;
; INPUT:
;   HL = 32-byte palette (R<<4|B, G per slot).
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, B, HL
;
; PRESERVES:
;   C, DE, IX, IY
;
; CALLS:
;   None
;
; SIDE EFFECTS:
;   R#16 ends back at slot 0 (auto-wrap after 16 slots).
; ------------------------------------------------------------
${p}_pal_set:
${di}    xor a
    out (#99), a
    ld a, #90                 ; R#16 = 0
    out (#99), a
${ei}    ld b, 32
${p}_pal_set_loop:
    ld a, (hl)
    out (#9A), a
    inc hl
    djnz ${p}_pal_set_loop
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_pal_lerp
; ------------------------------------------------------------
; PURPOSE:
;   8-step palette interpolation from one palette to another. Step k
;   (1..8) uploads from + round((to - from) * k / 8) per component, so
;   the last step is exactly "to".
;
; INPUT:
;   HL = from palette, DE = to palette (32 bytes each)
;   A  = frames per step (0 is treated as 1)
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   ${p}_pal_emit, frame wait
;
; SIDE EFFECTS:
;   Writes the VDP palette. Neither source palette is modified.
;
; NOTES:
;   8-byte stack frame via IX: 0-1 from, 2-3 to, 4 fps, 5 k, 6 slots left,
;   7 red nibble.
; ------------------------------------------------------------
${p}_pal_lerp:
    push ix
    ld ix, -8
    add ix, sp
    ld sp, ix
    ld (ix+0), l
    ld (ix+1), h
    ld (ix+2), e
    ld (ix+3), d
    or a
    jp nz, ${p}_pal_fps_ok
    inc a
${p}_pal_fps_ok:
    ld (ix+4), a
    ld (ix+5), 1
${p}_pal_step:
    call ${p}_pal_emit
    ld b, (ix+4)
${p}_pal_wait:
    push bc
${frameWait}
    pop bc
    djnz ${p}_pal_wait
    inc (ix+5)
    ld a, (ix+5)
    cp 9
    jp c, ${p}_pal_step
    ld hl, 8
    add hl, sp
    ld sp, hl
    pop ix
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_pal_emit
; ------------------------------------------------------------
; PURPOSE:
;   Upload the interpolated palette for step k = (IX+5).
;
; INPUT:
;   IX = ${p}_pal_lerp frame.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   ${p}_pal_comp
;
; SIDE EFFECTS:
;   Writes the 16 VDP palette slots.
; ------------------------------------------------------------
${p}_pal_emit:
${di}    xor a
    out (#99), a
    ld a, #90                 ; R#16 = 0
    out (#99), a
${ei}    ld l, (ix+0)
    ld h, (ix+1)
    ld e, (ix+2)
    ld d, (ix+3)
    ld (ix+6), 16
${p}_pal_slot:
    ; red: bits 6..4 of byte 0
    ld a, (hl)
    rrca
    rrca
    rrca
    rrca
    and 7
    ld b, a
    ld a, (de)
    rrca
    rrca
    rrca
    rrca
    and 7
    ld c, a
    call ${p}_pal_comp
    rlca
    rlca
    rlca
    rlca
    ld (ix+7), a
    ; blue: bits 2..0 of byte 0
    ld a, (hl)
    and 7
    ld b, a
    ld a, (de)
    and 7
    ld c, a
    call ${p}_pal_comp
    or (ix+7)
    out (#9A), a
    inc hl
    inc de
    ; green: bits 2..0 of byte 1
    ld a, (hl)
    and 7
    ld b, a
    ld a, (de)
    and 7
    ld c, a
    call ${p}_pal_comp
    out (#9A), a
    inc hl
    inc de
    dec (ix+6)
    jp nz, ${p}_pal_slot
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_pal_comp
; ------------------------------------------------------------
; PURPOSE:
;   Interpolate one 3-bit colour component.
;
; INPUT:
;   B = from (0..7), C = to (0..7), (IX+5) = k (1..8)
;
; OUTPUT:
;   A = from +/- (|to - from| * k + 4) / 8
;
; DESTROYS:
;   AF, C
;
; PRESERVES:
;   B, DE, HL, IX, IY
;
; CALLS:
;   ${p}_pal_scale
;
; SIDE EFFECTS:
;   None.
; ------------------------------------------------------------
${p}_pal_comp:
    ld a, c
    sub b
    jp c, ${p}_pal_comp_down
    call ${p}_pal_scale
    add a, b
    ret
${p}_pal_comp_down:
    neg
    call ${p}_pal_scale
    ld c, a
    ld a, b
    sub c
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_pal_scale
; ------------------------------------------------------------
; PURPOSE:
;   Scale a component delta by k/8 with rounding.
;
; INPUT:
;   A = |delta| (0..7), (IX+5) = k (1..8)
;
; OUTPUT:
;   A = (A * k + 4) >> 3
;
; DESTROYS:
;   AF, C
;
; PRESERVES:
;   B, DE, HL, IX, IY
;
; CALLS:
;   None
;
; SIDE EFFECTS:
;   None.
; ------------------------------------------------------------
${p}_pal_scale:
    push bc
    ld c, a
    xor a
    ld b, (ix+5)
${p}_pal_scale_loop:
    add a, c
    djnz ${p}_pal_scale_loop
    add a, 4
    rrca
    rrca
    rrca
    and #1F
    pop bc
    ret
`);
  }

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Per-node data + call emission
// ---------------------------------------------------------------------------

/**
 * Collects the fill tables and solid-colour palettes used by a build so that
 * identical transitions share one table.
 */
export class Screen5TfxDataPool {
  private readonly fillTables = new Map<string, { label: string; bytes: number[] }>();
  private readonly solidPalettes = new Map<string, { label: string; bytes: number[] }>();
  usesFill = false;
  usesPalette = false;

  constructor(private readonly prefix: string) {}

  fillTableLabel(spec: Extract<Screen5TransitionSpec, { kind: 'fill' }>): string {
    this.usesFill = true;
    const key = screen5TransitionSpecKey(spec);
    const existing = this.fillTables.get(key);
    if (existing) return existing.label;
    const label = `${this.prefix}_table_${this.fillTables.size}`;
    const plan = buildScreen5FillPlan(spec);
    this.fillTables.set(key, { label, bytes: encodeScreen5FillPlan(plan, spec.fillColorIndex, spec.framesPerStep) });
    return label;
  }

  solidPaletteLabel(color: { r: number; g: number; b: number }): string {
    this.usesPalette = true;
    const key = `${color.r & 7}${color.g & 7}${color.b & 7}`;
    const existing = this.solidPalettes.get(key);
    if (existing) return existing.label;
    const label = `${this.prefix}_solid_${key}`;
    this.solidPalettes.set(key, { label, bytes: buildSolidScreen5PaletteBytes(color) });
    return label;
  }

  get isEmpty(): boolean {
    return this.fillTables.size === 0 && this.solidPalettes.size === 0 && !this.usesFill && !this.usesPalette;
  }

  emitData(): string {
    const blocks: string[] = [];
    for (const { label, bytes } of this.fillTables.values()) {
      blocks.push(`${label}:   ; SCREEN 5 transition fill table\n${chunkTfxBytes(bytes)}`);
    }
    for (const { label, bytes } of this.solidPalettes.values()) {
      blocks.push(`${label}:   ; solid transition palette (R<<4|B, G)\n${chunkTfxBytes(bytes)}`);
    }
    return blocks.join('\n');
  }
}

export interface Screen5TfxCallContext {
  prefix: string;
  pool: Screen5TfxDataPool;
  /** ASM that loads DE with the Y offset of the visible page. */
  loadPageOffsetAsm: string;
  /** ASM that loads HL with the palette currently on screen. */
  loadCurrentPaletteAsm: string;
  /**
   * Label of the palette of the scene that follows this transition (fade in /
   * crossfade targets), or undefined when the next node is not a presentation.
   */
  nextScenePaletteLabel?: string;
}

/**
 * Emit the call sequence for an engine transition whose effect does not depend
 * on the next scene (fills, fade out, flash). Palette effects that target the
 * next scene are handled by each backend because they must hook into the
 * scene upload; this helper throws for them.
 */
export function emitScreen5TfxCall(node: Partial<Msx2GameFlowTransitionNode>, ctx: Screen5TfxCallContext): string {
  const spec = resolveScreen5TransitionSpec(node);
  const p = ctx.prefix;
  if (spec.kind === 'fill') {
    const table = ctx.pool.fillTableLabel(spec);
    return `${ctx.loadPageOffsetAsm.trimEnd()}
    ld hl, ${table}
    call ${p}_play
`;
  }
  const solid = ctx.pool.solidPaletteLabel(spec.color);
  switch (spec.effect) {
    case 'palette_fade_out':
      return `${ctx.loadCurrentPaletteAsm.trimEnd()}
    ld de, ${solid}
    ld a, ${spec.framesPerStep}
    call ${p}_pal_lerp
`;
    case 'palette_flash': {
      let asm = '';
      for (let i = 0; i < spec.flashCount; i++) {
        asm += `${ctx.loadCurrentPaletteAsm.trimEnd()}
    ld de, ${solid}
    ld a, ${spec.framesPerStep}
    call ${p}_pal_lerp
${ctx.loadCurrentPaletteAsm.trimEnd()}
    ex de, hl
    ld hl, ${solid}
    ld a, ${spec.framesPerStep}
    call ${p}_pal_lerp
`;
      }
      return asm;
    }
    case 'palette_crossfade': {
      if (!ctx.nextScenePaletteLabel) {
        throw new Error('SCREEN 5 palette_crossfade needs the next node to be a SCREEN 5 Presentation.');
      }
      return `${ctx.loadCurrentPaletteAsm.trimEnd()}
    ld de, ${ctx.nextScenePaletteLabel}
    ld a, ${spec.framesPerStep}
    call ${p}_pal_lerp
`;
    }
    default:
      throw new Error(`SCREEN 5 transition "${spec.effect}" must be emitted by the backend (it hooks the next scene).`);
  }
}
