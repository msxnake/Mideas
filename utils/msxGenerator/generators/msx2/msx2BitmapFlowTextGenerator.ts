// Text / menu / scrolling-text nodes for the SCREEN 5 bitmap-room GameFlow.
//
// The bitmap-room runtime never calls the BIOS: interrupts stay disabled, frame
// pacing polls S#0 and key input reads the PPI keyboard matrix directly. So this
// engine is written against the same primitives the rest of that backend uses
// (`copy_to_vram_ext`, `vdp_wait_cmd_ready`, `vdp_reinit_cmd_pointer`,
// `bitmap_wait_vblank`) instead of LDIRVM/CHGET/HALT.
//
// Glyphs come from the shared 6x8 GameFlow font: expanded from 1bpp to 4bpp in a
// RAM buffer and blitted row by row, so a menu redraw or a scroll step costs a
// handful of VRAM writes instead of one HMMV per lit pixel like the End screen.

import {
  buildScreen5FlowFontBytes,
  sanitizeScreen5FlowText,
  wrapScreen5FlowText,
} from './msx2Screen5FlowFont';

export const BF_LINE_BYTES = 128;
export const BF_CHAR_WIDTH_BYTES = 3; // 6 px cell
export const BF_CHAR_HEIGHT = 8;
export const BF_MAX_COLUMNS = Math.floor(BF_LINE_BYTES / BF_CHAR_WIDTH_BYTES); // 42
export const BF_VISIBLE_LINES = 192; // bitmap rooms display 192 lines

// Text node layout (pixel rows inside the displayed page).
const BF_TEXT_TITLE_Y = 16;
const BF_TEXT_FIRST_LINE_Y = 48;
const BF_TEXT_LINE_STEP = 12;
const BF_TEXT_MAX_LINES = 8;
const BF_TEXT_PROMPT_Y = 168;

// SubMenu layout.
const BF_MENU_TITLE_Y = 24;
const BF_MENU_FIRST_OPTION_Y = 64;
const BF_MENU_OPTION_STEP = 18;
export const BF_MENU_MAX_OPTIONS = 6;

// Scrolling window.
const BF_SCROLL_TOP = 32;
const BF_SCROLL_HEIGHT = 132;
const BF_SCROLL_STEP = 12;

// RAM: parked at #E000, well clear of the player/skill chain (<= #C0A8), the
// room behaviour map (#C200), the system tables (<= #C405) and the SCC music
// workspace, and below the MSX system area at #F380.
const BF_RAM_BASE = 0xe000;
const BF_TEXTBUF_BASE = 0xe100; // 8 rows x 128 bytes

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
const hexWord = (value: number): string => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
const sanitizeLabel = (value: string): string => value.replace(/[^A-Za-z0-9_]/g, '_');

const clampByte = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(255, Math.trunc(numeric)));
};

const clampPaletteIndex = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(15, Math.trunc(numeric)));
};

/** Node types this module implements inside the bitmap-room dispatcher. */
export const BITMAP_FLOW_TEXT_NODE_TYPES = new Set(['Text', 'TextScroll', 'TextScrollColor', 'SubMenu']);

export interface BitmapFlowTextFeatures {
  text: boolean;
  menu: boolean;
  scroll: boolean;
}

export function collectBitmapFlowTextFeatures(nodes: Array<{ type?: string }>): BitmapFlowTextFeatures {
  const types = new Set(nodes.map(node => String(node?.type || '')));
  const scroll = types.has('TextScroll') || types.has('TextScrollColor');
  const menu = types.has('SubMenu');
  return { text: types.has('Text') || scroll || menu, menu, scroll };
}

export function bitmapFlowTextEquates(features: BitmapFlowTextFeatures): string {
  if (!features.text) return '';
  const at = (offset: number) => hexWord(BF_RAM_BASE + offset);
  return `; ---- GameFlow text/menu/scroll engine ----
bitmap_flow_fg         EQU ${at(0x00)}
bitmap_flow_bg         EQU ${at(0x01)}
bitmap_flow_width      EQU ${at(0x02)}
bitmap_flow_rows       EQU ${at(0x03)}
bitmap_flow_dest       EQU ${at(0x04)}   ; word: VRAM address of the text span
bitmap_flow_menu_index EQU ${at(0x06)}
bitmap_flow_menu_prev  EQU ${at(0x07)}
bitmap_flow_scroll_bg  EQU ${at(0x08)}
bitmap_flow_cmd        EQU ${at(0x10)}   ; 15 bytes mirroring VDP R#32..R#46
bitmap_flow_cmd_sx     EQU bitmap_flow_cmd + 0
bitmap_flow_cmd_sy     EQU bitmap_flow_cmd + 2
bitmap_flow_cmd_dx     EQU bitmap_flow_cmd + 4
bitmap_flow_cmd_dy     EQU bitmap_flow_cmd + 6
bitmap_flow_cmd_nx     EQU bitmap_flow_cmd + 8
bitmap_flow_cmd_ny     EQU bitmap_flow_cmd + 10
bitmap_flow_cmd_clr    EQU bitmap_flow_cmd + 12
bitmap_flow_cmd_arg    EQU bitmap_flow_cmd + 13
bitmap_flow_cmd_cmd    EQU bitmap_flow_cmd + 14
bitmap_flow_textbuf    EQU ${hexWord(BF_TEXTBUF_BASE)}
`;
}

/** Shared runtime routines + font data. Emitted only when a text node exists. */
export function bitmapFlowTextRuntime(features: BitmapFlowTextFeatures): string {
  if (!features.text) return '';
  const fontBytes = buildScreen5FlowFontBytes();
  const fontData: string[] = [];
  for (let offset = 0; offset < fontBytes.length; offset += 16) {
    fontData.push(`    DB ${fontBytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }

  const scrollRoutines = features.scroll
    ? `
; ------------------------------------------------------------
; bitmap_flow_scroll_window: HMMM the text window up one line and clear the
; freed band with bitmap_flow_scroll_bg. Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_flow_scroll_window:
    ld hl, 0
    ld (bitmap_flow_cmd_sx), hl
    ld hl, ${BF_SCROLL_TOP + BF_SCROLL_STEP}
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_sy), hl
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, ${BF_SCROLL_TOP}
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, ${BF_SCROLL_HEIGHT - BF_SCROLL_STEP}
    ld (bitmap_flow_cmd_ny), hl
    ld a, #D0                  ; HMMM
    call bitmap_flow_run_cmd
    ; Clear the band that scrolled in at the bottom.
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, ${BF_SCROLL_TOP + BF_SCROLL_HEIGHT - BF_SCROLL_STEP}
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, ${BF_SCROLL_STEP}
    ld (bitmap_flow_cmd_ny), hl
    ld a, (bitmap_flow_scroll_bg)
    call bitmap_flow_set_clr
    ld a, #C0                  ; HMMV
    jp bitmap_flow_run_cmd

bitmap_flow_scroll_clear_window:
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, ${BF_SCROLL_TOP}
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, ${BF_SCROLL_HEIGHT}
    ld (bitmap_flow_cmd_ny), hl
    ld a, (bitmap_flow_scroll_bg)
    call bitmap_flow_set_clr
    ld a, #C0
    jp bitmap_flow_run_cmd
`
    : '';

  const menuRoutines = features.menu
    ? `
; ------------------------------------------------------------
; SubMenu input: PPI keyboard row 8 (bit5 UP, bit6 DOWN, bit0 SPACE).
; bitmap_flow_read_row8 returns the row in A, active-high.
; ------------------------------------------------------------
bitmap_flow_read_row8:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret

bitmap_flow_menu_wait_release:
    ; Swallow the trigger that is still held from the previous node so the menu
    ; does not select its first option the instant it appears.
    call bitmap_wait_vblank
    call bitmap_flow_read_row8
    and #01
    jp nz, bitmap_flow_menu_wait_release
    xor a
    ld (bitmap_flow_menu_prev), a
    ret
`
    : '';

  return `${bitmapFlowTextEquates(features) ? '' : ''}
; ============================================================
; GameFlow text engine (6x8 font, 4bpp expansion, no BIOS)
; ============================================================

; ------------------------------------------------------------
; bitmap_flow_use_page0: force the visible page to 0 before drawing.
;
; bitmap_displayed_page is only ever written by the room flip, so a text screen
; that runs BEFORE the first WorldLink (intro -> transition -> text) would read
; cartridge boot garbage and blit onto the hidden page — the screen looked
; simply never drawn. These nodes run outside the gameplay loop, so pin the
; display to page 0 and keep the shadow variable in sync.
; Clobbers AF, E.
; ------------------------------------------------------------
bitmap_flow_sprites_off:
    ; R#8 bit 1 = SPD. The room sprites (player, enemies) are still armed from
    ; the boot init and would sit on top of a full-screen text node.
    ld a, #08
    ld e, #0A
    jp vdp_write_register

bitmap_flow_sprites_on:
    ld a, #08
    ld e, #08
    jp vdp_write_register

bitmap_flow_use_page0:
    xor a
    ld (bitmap_displayed_page), a
    ld (bitmap_pending_display_page), a
    ld e, #1F
    ld a, #02
    call vdp_write_register
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; bitmap_flow_page_dy: HL = Y inside the page -> HL = Y with the displayed
; page offset applied (page 1 lives at Y 256..). Clobbers AF.
; ------------------------------------------------------------
bitmap_flow_page_dy:
    ld a, (bitmap_displayed_page)
    or a
    ret z
    inc h
    ret

; ------------------------------------------------------------
; bitmap_flow_page_addr: HL = byte offset inside the page (Y*128 + X) ->
; HL = absolute VRAM address on the displayed page. Clobbers AF.
; ------------------------------------------------------------
bitmap_flow_page_addr:
    ld a, (bitmap_displayed_page)
    or a
    ret z
    ld a, h
    add a, #80
    ld h, a
    ret

; ------------------------------------------------------------
; bitmap_flow_set_clr: A = palette index -> command colour byte (both nibbles).
; ------------------------------------------------------------
bitmap_flow_set_clr:
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (bitmap_flow_cmd_clr), a
    ret

; ------------------------------------------------------------
; bitmap_flow_run_cmd: A = command byte. Sends the 15-byte block through the
; indirect register port and waits for the engine. Clobbers AF, BC, HL.
; ------------------------------------------------------------
bitmap_flow_run_cmd:
    ld (bitmap_flow_cmd_cmd), a
    xor a
    ld (bitmap_flow_cmd_arg), a
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_flow_cmd
    ld b, 15
bitmap_flow_run_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz bitmap_flow_run_cmd_loop
    call vdp_wait_cmd_ready
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; bitmap_flow_print: draw a zero-terminated string (chars 32..90).
;   HL = string pointer
;   DE = byte offset inside the page (Y*128 + X)
;   B  = span width in bytes (3 per character cell)
; Colours come from bitmap_flow_fg / bitmap_flow_bg.
; Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_flow_print:
    push hl
    ex de, hl
    call bitmap_flow_page_addr
    ld (bitmap_flow_dest), hl
    pop hl
    ld a, b
    ld (bitmap_flow_width), a
    push hl
    call bitmap_flow_fill_textbuf
    pop hl
    ld c, 0
bitmap_flow_print_char_loop:
    ld a, (hl)
    or a
    jp z, bitmap_flow_print_blit
    inc hl
    ld e, a
    ld a, (bitmap_flow_width)
    sub c
    cp 3
    jp c, bitmap_flow_print_blit
    ld a, e
    push hl
    call bitmap_flow_draw_char
    pop hl
    ld a, c
    add a, 3
    ld c, a
    jp bitmap_flow_print_char_loop

bitmap_flow_print_blit:
    ld hl, bitmap_flow_textbuf
    ld de, (bitmap_flow_dest)
    ld a, ${BF_CHAR_HEIGHT}
    ld (bitmap_flow_rows), a
bitmap_flow_print_blit_loop:
    push hl
    push de
    ld a, (bitmap_flow_width)
    ld c, a
    ld b, 0
    call copy_to_vram_ext
    pop de
    pop hl
    ld a, (bitmap_flow_width)
    ld c, a
    ld b, 0
    add hl, bc
    ex de, hl
    ld bc, ${BF_LINE_BYTES}
    add hl, bc
    ex de, hl
    ld a, (bitmap_flow_rows)
    dec a
    ld (bitmap_flow_rows), a
    jp nz, bitmap_flow_print_blit_loop
    ret

bitmap_flow_fill_textbuf:
    ld a, (bitmap_flow_bg)
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (bitmap_flow_textbuf), a
    ld a, (bitmap_flow_width)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    dec hl
    ld b, h
    ld c, l
    ld hl, bitmap_flow_textbuf
    ld de, bitmap_flow_textbuf + 1
    ldir
    ret

; A = character code, C = byte column inside the span.
bitmap_flow_draw_char:
    push bc
    call bitmap_flow_draw_char_inner
    pop bc
    ret

bitmap_flow_draw_char_inner:
    sub 32
    ret c
    cp 59
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_flow_font
    add hl, de
    ld e, c
    ld d, 0
    push hl
    ld hl, bitmap_flow_textbuf
    add hl, de
    ex de, hl
    pop hl
    ld b, ${BF_CHAR_HEIGHT}
bitmap_flow_draw_char_row:
    ld a, (hl)
    inc hl
    push hl
    push bc
    call bitmap_flow_expand_row
    pop bc
    pop hl
    ld a, (bitmap_flow_width)
    sub 3
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    djnz bitmap_flow_draw_char_row
    ret

; A = glyph row bits (bit7 leftmost). Writes 3 bytes / 6 pixels at (DE).
bitmap_flow_expand_row:
    ld c, a
    ld b, 3
bitmap_flow_expand_row_loop:
    ld a, c
    rlca
    ld c, a
    call bitmap_flow_expand_pick
    rlca
    rlca
    rlca
    rlca
    ld l, a
    ld a, c
    rlca
    ld c, a
    call bitmap_flow_expand_pick
    or l
    ld (de), a
    inc de
    djnz bitmap_flow_expand_row_loop
    ret

bitmap_flow_expand_pick:
    jp nc, bitmap_flow_expand_pick_bg
    ld a, (bitmap_flow_fg)
    ret
bitmap_flow_expand_pick_bg:
    ld a, (bitmap_flow_bg)
    ret

; ------------------------------------------------------------
; bitmap_flow_wait_key / bitmap_flow_wait_frames
; PPI row 8 bit 0 = SPACE. No BIOS, no interrupts.
; ------------------------------------------------------------
bitmap_flow_wait_key:
    ; Require a release first so a key still held from the previous node does
    ; not skip this screen instantly.
    call bitmap_wait_vblank
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    jp nz, bitmap_flow_wait_key
bitmap_flow_wait_key_press:
    call bitmap_wait_vblank
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    jp z, bitmap_flow_wait_key_press
    ret

bitmap_flow_wait_frames:
    ld a, b
    or a
    ret z
bitmap_flow_wait_frames_loop:
    push bc
    call bitmap_wait_vblank
    pop bc
    djnz bitmap_flow_wait_frames_loop
    ret
${scrollRoutines}${menuRoutines}
; 6x8 GameFlow font: 59 glyphs (ASCII 32..90), 8 rows each, 5 pixels
; left-aligned on bits 7..3 so bit 2 becomes the inter-character gap.
bitmap_flow_font:
${fontData.join('\n')}
`;
}

// ---------------------------------------------------------------------------
// Per-node emission
// ---------------------------------------------------------------------------

interface EmitContext {
  /** Palette index used when a node does not pick one. */
  defaultTextColor: number;
  /** Emits `jp <label>` to the node's default connection. */
  jumpToNext: string;
  /** Collects the DB blocks for the strings this node draws. */
  pushData: (asm: string) => void;
}

let stringCounter = 0;
export function resetBitmapFlowStringCounter(): void {
  stringCounter = 0;
}

function stringData(text: string, pushData: (asm: string) => void): string {
  const label = `bitmap_flow_str_${stringCounter++}`;
  const bytes = [...text].map(character => character.charCodeAt(0) & 0xff);
  bytes.push(0);
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }
  pushData(`${label}:   ; "${text}"\n${lines.join('\n')}\n`);
  return label;
}

const centeredColumn = (characters: number): number =>
  Math.max(0, Math.floor((BF_MAX_COLUMNS - Math.min(characters, BF_MAX_COLUMNS)) / 2)) * BF_CHAR_WIDTH_BYTES;

function printCall(
  text: string,
  y: number,
  foreground: number,
  background: number,
  context: EmitContext,
  options: { spanCharacters?: number } = {}
): string {
  const sanitized = sanitizeScreen5FlowText(text, BF_MAX_COLUMNS);
  const spanCharacters = Math.min(
    BF_MAX_COLUMNS,
    Math.max(options.spanCharacters ?? sanitized.length, sanitized.length, 1)
  );
  const padded = sanitized.padEnd(spanCharacters, ' ');
  const column = centeredColumn(spanCharacters);
  const label = stringData(padded, context.pushData);
  return `    ld a, ${hexByte(foreground)}
    ld (bitmap_flow_fg), a
    ld a, ${hexByte(background)}
    ld (bitmap_flow_bg), a
    ld hl, ${label}
    ld de, ${hexWord(y * BF_LINE_BYTES + column)}
    ld b, ${spanCharacters * BF_CHAR_WIDTH_BYTES}
    call bitmap_flow_print
`;
}

function fillRect(x: number, y: number, width: number, height: number, colorIndex: number): string {
  return `    ld hl, ${x}
    ld (bitmap_flow_cmd_dx), hl
    ld hl, ${y}
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, ${width}
    ld (bitmap_flow_cmd_nx), hl
    ld hl, ${height}
    ld (bitmap_flow_cmd_ny), hl
    ld a, ${hexByte(colorIndex)}
    call bitmap_flow_set_clr
    ld a, #C0
    call bitmap_flow_run_cmd
`;
}

function waitCall(waitForKey: unknown, waitFrames: unknown): string {
  if (waitForKey !== false) return '    call bitmap_flow_wait_key\n';
  const frames = clampByte(waitFrames, 0);
  return frames > 0 ? `    ld b, ${hexByte(frames)}\n    call bitmap_flow_wait_frames\n` : '';
}

/** `Text`: title + word-wrapped message over the current room, optional prompt. */
export function emitBitmapFlowTextNode(node: any, context: EmitContext): string {
  const foreground = clampPaletteIndex(node.textColorIndex, context.defaultTextColor);
  const background = clampPaletteIndex(node.backgroundColorIndex, 0);
  const title = sanitizeScreen5FlowText(node.title || '', BF_MAX_COLUMNS);
  const lines = wrapScreen5FlowText(node.message || '', BF_MAX_COLUMNS - 2, BF_TEXT_MAX_LINES);
  const body = lines
    .map((line, index) => (line
      ? printCall(line, BF_TEXT_FIRST_LINE_Y + index * BF_TEXT_LINE_STEP, foreground, background, context)
      : ''))
    .join('');
  const prompt = node.waitForKey === false
    ? ''
    : printCall('PRESS SPACE', BF_TEXT_PROMPT_Y, foreground, background, context);
  return `    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}${
    title ? printCall(title, BF_TEXT_TITLE_Y, foreground, background, context) : ''
  }${body}${prompt}${waitCall(node.waitForKey, node.waitFrames)}    call bitmap_flow_sprites_on
${context.jumpToNext}`;
}

/** `TextScroll` / `TextScrollColor`: credits-style window scrolled with HMMM. */
export function emitBitmapFlowTextScrollNode(node: any, context: EmitContext): string {
  const safeId = sanitizeLabel(String(node.id || 'scroll'));
  const foreground = clampPaletteIndex(node.textColorIndex, context.defaultTextColor);
  const background = clampPaletteIndex(node.backgroundColorIndex, 0);
  const stepFrames = clampByte(node.scrollStepFrames, 18) || 18;
  const lines = wrapScreen5FlowText(node.text || '', BF_MAX_COLUMNS - 2, 32);
  const bottomTextY = BF_SCROLL_TOP + BF_SCROLL_HEIGHT - BF_SCROLL_STEP + 2;
  const trailingScrolls = Math.ceil(BF_SCROLL_HEIGHT / BF_SCROLL_STEP);
  const title = sanitizeScreen5FlowText(node.title || '', BF_MAX_COLUMNS);

  const body = lines.map(line => `    call bitmap_flow_scroll_window
${line ? printCall(line, bottomTextY, foreground, background, context) : ''}    ld b, ${hexByte(stepFrames)}
    call bitmap_flow_wait_frames
`).join('');

  return `    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
    ld a, ${hexByte(background)}
    ld (bitmap_flow_scroll_bg), a
${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}    call bitmap_flow_scroll_clear_window
${title ? printCall(title, BF_SCROLL_TOP - 20, foreground, background, context) : ''}${body}    ld b, ${trailingScrolls}
bitmap_flow_tail_${safeId}:
    push bc
    call bitmap_flow_scroll_window
    ld b, ${hexByte(stepFrames)}
    call bitmap_flow_wait_frames
    pop bc
    djnz bitmap_flow_tail_${safeId}
${waitCall(node.waitForKey, node.waitFrames)}    call bitmap_flow_sprites_on
${context.jumpToNext}`;
}

/** `SubMenu`: cursor keys move the highlight, SPACE picks the option branch. */
export function emitBitmapFlowSubMenuNode(
  node: any,
  context: EmitContext & { optionTargets: string[] }
): string {
  const safeId = sanitizeLabel(String(node.id || 'menu'));
  const options = (node.options || []).slice(0, BF_MENU_MAX_OPTIONS);
  if (options.length === 0) {
    throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}" must include at least one option.`);
  }
  const foreground = clampPaletteIndex(node.textColorIndex, context.defaultTextColor);
  const background = clampPaletteIndex(node.backgroundColorIndex, 0);
  const highlightForeground = clampPaletteIndex(node.highlightColorIndex, background);
  const highlightBackground = clampPaletteIndex(node.highlightBackgroundIndex, foreground);
  const optionTexts = options.map((option: any) => sanitizeScreen5FlowText(option.text || '', BF_MAX_COLUMNS - 4));
  const spanCharacters = Math.max(...optionTexts.map((text: string) => text.length)) + 4;
  const title = sanitizeScreen5FlowText(node.title || '', BF_MAX_COLUMNS);

  const centerInSpan = (text: string): string => {
    const padding = Math.max(0, spanCharacters - text.length);
    const left = Math.floor(padding / 2);
    return `${' '.repeat(left)}${text}${' '.repeat(padding - left)}`;
  };

  const drawRoutine = `bitmap_flow_menu_draw_${safeId}:
${options.map((_option: any, index: number) => {
    const optionY = BF_MENU_FIRST_OPTION_Y + index * BF_MENU_OPTION_STEP;
    const text = centerInSpan(optionTexts[index]);
    return `    ld a, (bitmap_flow_menu_index)
    cp ${index}
    jp z, bitmap_flow_menu_sel_${safeId}_${index}
${printCall(text, optionY, foreground, background, context, { spanCharacters })}    jp bitmap_flow_menu_done_${safeId}_${index}
bitmap_flow_menu_sel_${safeId}_${index}:
${printCall(text, optionY, highlightForeground, highlightBackground, context, { spanCharacters })}bitmap_flow_menu_done_${safeId}_${index}:
`;
  }).join('')}    ret
`;

  const dispatch = options.map((_option: any, index: number) => `    cp ${index}
    jp z, bitmap_flow_menu_pick_${safeId}_${index}
`).join('');
  const dispatchTargets = options.map((_option: any, index: number) => `bitmap_flow_menu_pick_${safeId}_${index}:
    call bitmap_flow_sprites_on
    jp ${context.optionTargets[index]}
`).join('');

  return `    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
    xor a
    ld (bitmap_flow_menu_index), a
${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}${
    title ? printCall(title, BF_MENU_TITLE_Y, foreground, background, context) : ''
  }    call bitmap_flow_menu_wait_release
    call bitmap_flow_menu_draw_${safeId}
bitmap_flow_menu_loop_${safeId}:
    call bitmap_wait_vblank
    call bitmap_flow_read_row8
    ld c, a
    and #60                    ; bit5 UP, bit6 DOWN
    ld b, a
    ld a, (bitmap_flow_menu_prev)
    cp b
    jp z, bitmap_flow_menu_trigger_${safeId}
    ld a, b
    ld (bitmap_flow_menu_prev), a
    and #20
    jp nz, bitmap_flow_menu_up_${safeId}
    ld a, b
    and #40
    jp nz, bitmap_flow_menu_down_${safeId}
    jp bitmap_flow_menu_trigger_${safeId}
bitmap_flow_menu_up_${safeId}:
    ld a, (bitmap_flow_menu_index)
    or a
    jp z, bitmap_flow_menu_wrap_${safeId}
    dec a
    jp bitmap_flow_menu_apply_${safeId}
bitmap_flow_menu_wrap_${safeId}:
    ld a, ${options.length - 1}
    jp bitmap_flow_menu_apply_${safeId}
bitmap_flow_menu_down_${safeId}:
    ld a, (bitmap_flow_menu_index)
    inc a
    cp ${options.length}
    jp c, bitmap_flow_menu_apply_${safeId}
    xor a
bitmap_flow_menu_apply_${safeId}:
    ld (bitmap_flow_menu_index), a
    call bitmap_flow_menu_draw_${safeId}
bitmap_flow_menu_trigger_${safeId}:
    ld a, c
    and #01                    ; SPACE
    jp z, bitmap_flow_menu_loop_${safeId}
    ld a, (bitmap_flow_menu_index)
${dispatch}    jp bitmap_flow_menu_loop_${safeId}
${dispatchTargets}
${drawRoutine}`;
}
