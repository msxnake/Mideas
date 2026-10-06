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
import {
  generateSmoothScrollRuntime,
  smoothScrollNodeData,
  smoothScrollRamEquates,
  smoothScrollStripTexts,
  marqueeNodeData,
  marqueeRamEquates,
  SMOOTH_SCROLL_LINE_STEP,
  type Screen5SmoothScrollHost,
} from './screen5SmoothScroll';
import {
  MSX2_CODE_ENTRY_MAX_CODES,
  MSX2_CODE_ENTRY_MAX_LENGTH,
  MSX2_CODE_ENTRY_WRONG_PORT,
} from '../../../../types';
import type { Msx2Screen5PresentationConfig } from '../../../../types';
import { clampMsx2CodeLength, normalizeMsx2Code } from '../../../msx2GameFlowCodeEntry';
import { extractScreen5MenuTitleImage } from '../../../msx2Screen5MenuTitleImage';
import {
  buildScreen5PaletteBytes,
  normalizeScreen5Presentation,
  resolveScreen5BrightestPaletteIndex,
} from './screen5PresentationData';

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
export const BF_MENU_TITLE_Y = 24;
export const BF_MENU_FIRST_OPTION_Y = 64;
export const BF_MENU_OPTION_STEP = 18;
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

/**
 * One-frame wait of the GameFlow screens. With a music runtime it is
 * `bitmap_flow_wait_vblank` (the frame wait plus one `music_update` tick);
 * without one it stays the plain `bitmap_wait_vblank`, so ROMs with no music
 * assemble exactly as before.
 */
const flowFrameWait = (musicTick: boolean | undefined): string =>
  musicTick ? 'call bitmap_flow_wait_vblank' : 'call bitmap_wait_vblank';

/**
 * The song only advances while something calls `music_update`, and during a
 * menu, text screen or transition the GameFlow waits are the only code running.
 * This wraps `bitmap_wait_vblank` with the tick and keeps its register contract,
 * so every frame wait of the text and transition engines can be swapped for it.
 *
 * The tick goes BEFORE the wait, like the gameplay loop (music_update is the
 * last call of its iteration): whatever follows the wait still starts right at
 * the vertical blank, which the palette fades of the transition engine need.
 */
export const BITMAP_FLOW_WAIT_VBLANK_ROUTINE = `; ------------------------------------------------------------
; FUNCTION: bitmap_flow_wait_vblank
; ------------------------------------------------------------
; PURPOSE:
;   One music_update tick, then bitmap_wait_vblank: keeps the song running while
;   a GameFlow menu, text, scroll, password or transition screen waits.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC
;
; PRESERVES:
;   DE, HL, IX, IY
;
; CALLS:
;   music_update, bitmap_wait_vblank
;
; SIDE EFFECTS:
;   One frame passes; R#15 = 0 on return (S#0 selected). The music driver
;   writes the sound chip and leaves P2 on the resident bank.
;
; NOTES:
;   music_update destroys AF, BC, DE, HL (and may use IX/IY), so the caller's
;   DE/HL/IX/IY are saved around it: this is a drop-in for bitmap_wait_vblank.
;   The tick is first so that the code after the wait starts at the vertical
;   blank (palette fades write the palette right there). Only emitted when the
;   ROM has a music runtime, and never reached before music_init_system.
; ------------------------------------------------------------
bitmap_flow_wait_vblank:
    push de
    push hl
    push ix
    push iy
    call music_update
    pop iy
    pop ix
    pop hl
    pop de
    jp bitmap_wait_vblank

`;

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
export const BITMAP_FLOW_TEXT_NODE_TYPES = new Set(['Text', 'TextScroll', 'TextScrollColor', 'SubMenu', 'CodeEntry']);

export interface BitmapFlowTextFeatures {
  text: boolean;
  menu: boolean;
  scroll: boolean;
  /** A CodeEntry (password) node exists. Absent keeps older ROMs byte-identical. */
  code?: boolean;
  /** A TextScroll node uses the pixel-smooth raster-split scroll. */
  smooth?: boolean;
  /** A TextScroll node uses the horizontal marquee. */
  marquee?: boolean;
  /** A SubMenu node has a bitmap title (`titleImageAssetId`): palette + banked blit routines. */
  titleImage?: boolean;
}

export function collectBitmapFlowTextFeatures(nodes: Array<{ type?: string; scrollMode?: string; titleImageAssetId?: string }>): BitmapFlowTextFeatures {
  const types = new Set(nodes.map(node => String(node?.type || '')));
  const scroll = types.has('TextScroll') || types.has('TextScrollColor');
  const menu = types.has('SubMenu');
  const isScroll = (node: { type?: string }) => node?.type === 'TextScroll' || node?.type === 'TextScrollColor';
  const smooth = nodes.some(node => isScroll(node) && node.scrollMode === 'smooth');
  const marquee = nodes.some(node => isScroll(node) && node.scrollMode === 'marquee');
  const code = types.has('CodeEntry');
  const base: BitmapFlowTextFeatures = { text: types.has('Text') || scroll || menu || code, menu, scroll };
  if (code) base.code = true;
  if (nodes.some(node => node?.type === 'SubMenu' && String(node.titleImageAssetId || '').trim() !== '')) base.titleImage = true;
  return smooth || marquee ? { ...base, smooth, marquee } : base;
}

/**
 * Host description for the shared pixel-smooth scroll (screen5SmoothScroll.ts):
 * text screens pin the display to page 0, so page 1 carries the text ring.
 */
const BITMAP_SMOOTH_SCROLL_HOST: Screen5SmoothScrollHost = {
  prefix: 'bitmap_vs',
  ramBase: BF_RAM_BASE + 0x40,
  interrupts: false,
  vblankKind: 'status',
  mainPage: 0,
  ringPage: 1,
  windowTop: BF_SCROLL_TOP,
  windowHeight: BF_SCROLL_HEIGHT,
  bgVar: 'bitmap_flow_bg',
  cmdSx: 'bitmap_flow_cmd_sx',
  cmdSy: 'bitmap_flow_cmd_sy',
  cmdDx: 'bitmap_flow_cmd_dx',
  cmdDy: 'bitmap_flow_cmd_dy',
  cmdNx: 'bitmap_flow_cmd_nx',
  cmdNy: 'bitmap_flow_cmd_ny',
  setFillColorCall: 'call bitmap_flow_set_clr',
  runFillAsm: '    ld a, #C0                  ; HMMV\n    call bitmap_flow_run_cmd',
  runCopyAsm: '    ld a, #D0                  ; HMMM\n    call bitmap_flow_run_cmd',
  // R#1: #62 = display on + IE0 + 16x16 sprites (init_screen5_bitmap_vdp value).
  displayOffAsm: '    ld a, #01\n    ld e, #22\n    call vdp_write_register',
  displayOnAsm: '    ld a, #01\n    ld e, #62\n    call vdp_write_register',
};

export function bitmapFlowTextEquates(features: BitmapFlowTextFeatures, bankedFont = false): string {
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
${features.titleImage && bankedFont ? `bitmap_flow_title_bank EQU ${at(0x09)}   ; data bank of the SubMenu title picture being blitted
` : ''}bitmap_flow_cmd        EQU ${at(0x10)}   ; 15 bytes mirroring VDP R#32..R#46
bitmap_flow_cmd_sx     EQU bitmap_flow_cmd + 0
bitmap_flow_cmd_sy     EQU bitmap_flow_cmd + 2
bitmap_flow_cmd_dx     EQU bitmap_flow_cmd + 4
bitmap_flow_cmd_dy     EQU bitmap_flow_cmd + 6
bitmap_flow_cmd_nx     EQU bitmap_flow_cmd + 8
bitmap_flow_cmd_ny     EQU bitmap_flow_cmd + 10
bitmap_flow_cmd_clr    EQU bitmap_flow_cmd + 12
bitmap_flow_cmd_arg    EQU bitmap_flow_cmd + 13
bitmap_flow_cmd_cmd    EQU bitmap_flow_cmd + 14
${bankedFont ? `bitmap_flow_glyph      EQU ${at(0x20)}   ; one glyph staged out of the banked font
` : ''}bitmap_flow_textbuf    EQU ${hexWord(BF_TEXTBUF_BASE)}
${features.code ? codeEntryRamEquates() : ''}${features.smooth || features.marquee ? smoothScrollRamEquates(BITMAP_SMOOTH_SCROLL_HOST) : ''}${features.marquee ? marqueeRamEquates(BITMAP_SMOOTH_SCROLL_HOST) : ''}`;
}

/** Shared runtime routines + font data. Emitted only when a text node exists. */
export function bitmapFlowTextRuntime(features: BitmapFlowTextFeatures, bankedFont = false, musicTick = false): string {
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
    ${flowFrameWait(musicTick)}
    call bitmap_flow_read_row8
    and #01
    jp nz, bitmap_flow_menu_wait_release
    xor a
    ld (bitmap_flow_menu_prev), a
    ret
`
    : '';

  // SubMenu bitmap title. The picture box and its palette sit in a MegaROM data bank (resident data on a
  // 32KB ROM), so the only resident cost is these two routines and the call sequence of the node.
  const titleImageRoutines = features.titleImage
    ? `
; ------------------------------------------------------------
; bitmap_flow_load_palette: HL = 32 bytes in RAM, 16 x ((R<<4)|B, G), written to
; the VDP palette from entry 0. Clobbers AF, BC, HL.
; ------------------------------------------------------------
bitmap_flow_load_palette:
    push hl
    ld a, #10
    ld e, #00
    call vdp_write_register    ; R#16 = 0: palette pointer
    pop hl
    ld c, #9A
    ld b, 32
    otir
    ret

; ------------------------------------------------------------
; bitmap_flow_title_leave: the menu with a bitmap title is done. The logo palette would stay on
; screen (a WorldLink does not reload the room palette), so blank the page first and put the
; room palette back: the logo never shows in the game's colours while the next node loads.
; Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_flow_title_leave:
${fillRect(0, 0, 256, BF_VISIBLE_LINES, 0)}    jp load_screen5_bitmap_palette

; ------------------------------------------------------------
; bitmap_flow_blit_title: copy a packed picture box to VRAM, one row at a time.
;   HL = source (rows one after another)${bankedFont ? ', inside the data bank in (bitmap_flow_title_bank)' : ''}
;   DE = VRAM address of the top-left byte (page 0)
;   B  = rows (1..212)    C = width in bytes (1..128)
; Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_flow_blit_title:
    ld a, c
    ld (bitmap_flow_width), a
    ld a, b
    ld (bitmap_flow_rows), a
bitmap_flow_blit_title_row:
    push hl
    push de
    ld a, (bitmap_flow_width)
    ld c, a
    ld b, 0
${bankedFont ? `    ld a, (bitmap_flow_title_bank)
    call bitmap_copy_banked_to_vram
` : `    call copy_to_vram_ext
`}    pop de
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
    jp nz, bitmap_flow_blit_title_row
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
${bankedFont ? `    push bc                   ; C = target column
    ld de, bitmap_flow_glyph
    ld a, bitmap_flow_font_DATA_BANK
    ld bc, ${BF_CHAR_HEIGHT}
    call bitmap_copy_banked_to_ram
    pop bc
    ld hl, bitmap_flow_glyph
` : ''}    ld e, c
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
    ${flowFrameWait(musicTick)}
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    jp nz, bitmap_flow_wait_key
bitmap_flow_wait_key_press:
    ${flowFrameWait(musicTick)}
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
    ${flowFrameWait(musicTick)}
    pop bc
    djnz bitmap_flow_wait_frames_loop
    ret
${scrollRoutines}${menuRoutines}${titleImageRoutines}${features.code ? codeEntryRuntime(musicTick) : ''}${features.smooth || features.marquee ? generateSmoothScrollRuntime(musicTick ? { ...BITMAP_SMOOTH_SCROLL_HOST, perFrameAsm: '    call music_update' } : BITMAP_SMOOTH_SCROLL_HOST, { vertical: features.smooth, marquee: features.marquee }) : ''}
; 6x8 GameFlow font: 59 glyphs (ASCII 32..90), 8 rows each, 5 pixels
; left-aligned on bits 7..3 so bit 2 becomes the inter-character gap.
${bankedFont ? '; Emitted in a Konami MegaROM data bank; bitmap_flow_draw_char_inner stages one glyph at a time.' : `bitmap_flow_font:
${fontData.join('\n')}`}
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
  /** The ROM has a music runtime: the node's own wait loops tick it (see bitmap_flow_wait_vblank). */
  musicTick?: boolean;
  /** SubMenu bitmap titles by msx2presentation asset id (see resolveBitmapFlowTitleImages). */
  titleImages?: Map<string, BitmapFlowTitleImage>;
  /**
   * R#7 of the ROM (the room background index). Colour-0 pixels show palette[R#7], so a menu with a
   * bitmap title sets it to 0 (slot 0 of the logo palette is the background) and puts it back on exit.
   */
  backdropColorIndex?: number;
}

let stringCounter = 0;
/** Asset ids whose title picture data a node already pushed (32KB ROMs keep it resident, once). */
let titleImageDataPushed = new Set<string>();
export function resetBitmapFlowStringCounter(): void {
  stringCounter = 0;
  titleImageDataPushed = new Set<string>();
}

// ---------------------------------------------------------------------------
// SubMenu bitmap title
// ---------------------------------------------------------------------------

/** One SubMenu title picture: the cropped box of an msx2presentation asset and the palette it is shown with. */
export interface BitmapFlowTitleImage {
  assetId: string;
  /** `bitmap_flow_title_N`: 32 palette bytes, then the box rows. In a data bank on a MegaROM. */
  label: string;
  widthBytes: number;
  height: number;
  /** 32 palette bytes ((R<<4)|B, G for each of the 16 slots) followed by the box. */
  bytes: number[];
  /** Brightest non-zero palette slot: the menu text colour when the node sets none. */
  brightestIndex: number;
  /** Data bank (MegaROM) or resident (32KB ROM). */
  banked: boolean;
}

/**
 * Where the title picture goes: `titleY` (default BF_MENU_TITLE_Y) and the room above the first
 * option. The editor shows the same message, so it is part of the layout and not of the emitter.
 */
export function resolveBitmapFlowMenuTitleLayout(titleYRaw: unknown, imageHeight: number): { titleY: number; error?: string } {
  const numeric = Math.trunc(Number(titleYRaw));
  const titleY = titleYRaw === undefined || titleYRaw === null || titleYRaw === '' || !Number.isFinite(numeric)
    ? BF_MENU_TITLE_Y
    : Math.max(0, Math.min(BF_VISIBLE_LINES - 1, numeric));
  if (titleY + imageHeight > BF_MENU_FIRST_OPTION_Y) {
    return {
      titleY,
      error: `the title image is ${imageHeight} px tall, so from y=${titleY} it ends at y=${titleY + imageHeight} and runs into the first option at y=${BF_MENU_FIRST_OPTION_Y}. Lower titleY or use a smaller image.`,
    };
  }
  return { titleY };
}

/**
 * Title pictures of the SubMenu nodes, in order of first use. Pure: the dispatcher and the data-bank
 * pass both call it, so they agree on labels and bytes. Throws a user-facing error for a missing,
 * empty or too big picture.
 */
export function resolveBitmapFlowTitleImages(
  nodes: Array<{ id?: string; type?: string; titleImageAssetId?: string; titleY?: unknown }>,
  presentations: Array<Msx2Screen5PresentationConfig & { id?: string }>,
  banked: boolean
): BitmapFlowTitleImage[] {
  const images: BitmapFlowTitleImage[] = [];
  for (const node of nodes) {
    if (node?.type !== 'SubMenu') continue;
    const assetId = String(node.titleImageAssetId || '').trim();
    if (!assetId) continue;
    let image = images.find(item => item.assetId === assetId);
    if (!image) {
      const source = presentations.find(item => item.id === assetId);
      if (!source) {
        throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}" references missing msx2presentation asset "${assetId}" as its title image.`);
      }
      const { image: box, error } = extractScreen5MenuTitleImage(source);
      if (!box) throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}" title image: ${error}`);
      const palette = normalizeScreen5Presentation(source).palette;
      const bytes = [...buildScreen5PaletteBytes(palette), ...box.bytes];
      if (banked && bytes.length > 0x2000) {
        throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}" title image is ${box.widthBytes * 2}x${box.height} px (${bytes.length} bytes with its palette) and does not fit one 8KB data bank. Use a smaller image.`);
      }
      image = {
        assetId,
        label: `bitmap_flow_title_${images.length}`,
        widthBytes: box.widthBytes,
        height: box.height,
        bytes,
        brightestIndex: resolveScreen5BrightestPaletteIndex(palette),
        banked,
      };
      images.push(image);
    }
    const { error } = resolveBitmapFlowMenuTitleLayout(node.titleY, image.height);
    if (error) throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}": ${error}`);
  }
  return images;
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
  options: { spanCharacters?: number; column?: number } = {}
): string {
  const sanitized = sanitizeScreen5FlowText(text, BF_MAX_COLUMNS);
  const spanCharacters = Math.min(
    BF_MAX_COLUMNS,
    Math.max(options.spanCharacters ?? sanitized.length, sanitized.length, 1)
  );
  const padded = sanitized.padEnd(spanCharacters, ' ');
  const column = options.column ?? centeredColumn(spanCharacters);
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
  if (node.scrollMode === 'smooth' || node.scrollMode === 'marquee') return emitBitmapFlowSmoothScrollNode(node, context);
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

/** Pixel-smooth `TextScroll` (raster split, text ring on page 1). */
function emitBitmapFlowSmoothScrollNode(node: any, context: EmitContext): string {
  const foreground = clampPaletteIndex(node.textColorIndex, context.defaultTextColor);
  const background = clampPaletteIndex(node.backgroundColorIndex, 0);
  const stepFrames = Math.max(SMOOTH_SCROLL_LINE_STEP, clampByte(node.scrollStepFrames, 18) || 18);
  const lines = wrapScreen5FlowText(node.text || '', BF_MAX_COLUMNS - 2, 32);
  const marquee = node.scrollMode === 'marquee';
  const data = marquee
    ? (() => {
        const text = marqueeNodeData(`bitmap_vsm_${sanitizeLabel(String(node.id || 'scroll'))}`, lines);
        return { tableLabel: text.textLabel, dataAsm: text.dataAsm, totalPixels: text.totalPixels - BF_SCROLL_HEIGHT };
      })()
    : smoothScrollNodeData(`bitmap_vs_${sanitizeLabel(String(node.id || 'scroll'))}`, lines, BF_MAX_COLUMNS);
  context.pushData(data.dataAsm);
  const title = sanitizeScreen5FlowText(node.title || '', BF_MAX_COLUMNS);
  const strip = smoothScrollStripTexts();
  const stripY = strip.firstRowY(BF_SCROLL_TOP);
  const stripAsm = strip.rows
    .map((row, index) => printCall(row, stripY + index * 8, foreground, background, context, { column: 0, spanCharacters: BF_MAX_COLUMNS }))
    .join('');
  return `    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}${title ? printCall(title, BF_SCROLL_TOP - 20, foreground, background, context) : ''}${BITMAP_SMOOTH_SCROLL_HOST.displayOffAsm}
${stripAsm}    ld a, ${hexByte(background)}
    ld (bitmap_flow_bg), a
    ld hl, ${data.tableLabel}
    ld de, ${data.totalPixels + BF_SCROLL_HEIGHT}
    ld a, ${stepFrames}
    call ${marquee ? 'bitmap_vsm_run' : 'bitmap_vs_run'}
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
  // A bitmap title replaces the text title and brings its own palette, so the menu colours default to
  // that palette's brightest slot instead of the room palette's.
  const titleAssetId = String(node.titleImageAssetId || '').trim();
  const titleImage = titleAssetId ? context.titleImages?.get(titleAssetId) : undefined;
  if (titleAssetId && !titleImage) {
    throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}": the title image "${titleAssetId}" was not resolved by the exporter.`);
  }
  const foreground = clampPaletteIndex(node.textColorIndex, titleImage ? titleImage.brightestIndex : context.defaultTextColor);
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
  // With a bitmap title the logo palette is still loaded: leaving the menu blanks the page and restores
  // the room palette. An unwired option stays on the menu (it jumps back to the loop), so it keeps both.
  const backdrop = clampPaletteIndex(context.backdropColorIndex, 0);
  const leaveAsm = titleImage
    ? `    call bitmap_flow_title_leave\n${backdrop !== 0 ? `    ld a, #07\n    ld e, ${hexByte(backdrop)}\n    call vdp_write_register    ; back to the room backdrop colour\n` : ''}`
    : '';
  const dispatchTargets = options.map((_option: any, index: number) => `bitmap_flow_menu_pick_${safeId}_${index}:
${titleImage && context.optionTargets[index] !== `bitmap_flow_menu_loop_${safeId}` ? leaveAsm : ''}    call bitmap_flow_sprites_on
    jp ${context.optionTargets[index]}
`).join('');

  // Bitmap title: screen off while the palette changes and the picture is drawn, so neither shows in the
  // wrong colours. The menu is drawn BEFORE the key release wait, so a held trigger cannot leave the
  // screen blank. Without a title picture the code below is the original sequence, byte for byte.
  let entryAsm: string;
  if (titleImage) {
    const { titleY, error } = resolveBitmapFlowMenuTitleLayout(node.titleY, titleImage.height);
    if (error) throw new Error(`MSX2 bitmap GameFlow SubMenu node "${node.id}": ${error}`);
    if (!titleImage.banked && !titleImageDataPushed.has(titleImage.assetId)) {
      titleImageDataPushed.add(titleImage.assetId);
      const lines: string[] = [];
      for (let offset = 0; offset < titleImage.bytes.length; offset += 16) {
        lines.push(`    DB ${titleImage.bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
      }
      context.pushData(`${titleImage.label}:   ; ${titleImage.widthBytes}x${titleImage.height} bytes + 32 palette bytes first\n${lines.join('\n')}\n`);
    }
    const column = Math.floor((BF_LINE_BYTES - titleImage.widthBytes) / 2);
    const bank = `${titleImage.label}_DATA_BANK`;
    const paletteAsm = titleImage.banked
      ? `    ld a, ${bank}
    ld hl, ${titleImage.label}
    ld de, bitmap_flow_textbuf
    ld bc, 32
    call bitmap_copy_banked_to_ram
    ld hl, bitmap_flow_textbuf
    call bitmap_flow_load_palette
`
      : `    ld hl, ${titleImage.label}
    call bitmap_flow_load_palette
`;
    const blitAsm = `${titleImage.banked ? `    ld a, ${bank}
    ld (bitmap_flow_title_bank), a
` : ''}    ld hl, ${titleImage.label} + 32
    ld de, ${hexWord(titleY * BF_LINE_BYTES + column)}
    ld b, ${titleImage.height}
    ld c, ${titleImage.widthBytes}
    call bitmap_flow_blit_title
`;
    // Colour-0 pixels (the picture's slot-0 margins and the cleared page) show palette[R#7]; make that
    // slot 0 of the logo palette instead of whatever index the room backdrop uses.
    const backdropAsm = backdrop !== 0 ? '    ld a, #07\n    ld e, #00\n    call vdp_write_register    ; backdrop = logo palette slot 0\n' : '';
    entryAsm = `${BITMAP_SMOOTH_SCROLL_HOST.displayOffAsm}
${backdropAsm}${paletteAsm}${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}${blitAsm}    call bitmap_flow_menu_draw_${safeId}
${BITMAP_SMOOTH_SCROLL_HOST.displayOnAsm}
    call bitmap_flow_menu_wait_release
`;
  } else {
    entryAsm = `${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}${
      title ? printCall(title, BF_MENU_TITLE_Y, foreground, background, context) : ''
    }    call bitmap_flow_menu_wait_release
    call bitmap_flow_menu_draw_${safeId}
`;
  }

  return `    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
    xor a
    ld (bitmap_flow_menu_index), a
${entryAsm}bitmap_flow_menu_loop_${safeId}:
    ${flowFrameWait(context.musicTick)}
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

// ---------------------------------------------------------------------------
// CodeEntry (password screen)
// ---------------------------------------------------------------------------

/** Output port a CodeEntry follows on a wrong code / ESC. */
export const BF_CODE_WRONG_PORT = MSX2_CODE_ENTRY_WRONG_PORT;
export const BF_CODE_MAX_CODES = MSX2_CODE_ENTRY_MAX_CODES;
const BF_CODE_MAX_LENGTH = MSX2_CODE_ENTRY_MAX_LENGTH;
/** Glyph shown in a slot the player has not filled yet. */
const BF_CODE_EMPTY_CHAR = '-';
const BF_CODE_TITLE_Y = 40;
const BF_CODE_SLOTS_Y = 80;
const BF_CODE_ERROR_Y = 108;
const BF_CODE_HINT_Y = 150;
/** Two character cells per slot: the glyph and a gap. */
const BF_CODE_SLOT_BYTES = 2 * BF_CHAR_WIDTH_BYTES;
/** Frames the error message stays on screen. */
const BF_CODE_ERROR_FRAMES = 60;
/** Held direction: frames before the first repeat, then frames between repeats. */
const BF_CODE_REPEAT_DELAY = 20;
const BF_CODE_REPEAT_RATE = 5;

// #E050..#E064: free between the smooth-scroll block (#E040..#E04F) and the End
// screen state (#E0C0).
function codeEntryRamEquates(): string {
  const at = (offset: number) => hexWord(BF_RAM_BASE + offset);
  return `bitmap_flow_code_buf   EQU ${at(0x50)}   ; ${BF_CODE_MAX_LENGTH} bytes: the code being typed
bitmap_flow_code_len   EQU ${at(0x58)}
bitmap_flow_code_pos   EQU ${at(0x59)}   ; slot under the cursor (0..len-1)
bitmap_flow_code_key   EQU ${at(0x5A)}   ; letter/digit key seen last frame (0 = none)
bitmap_flow_code_ctl   EQU ${at(0x5B)}   ; control bits seen last frame
bitmap_flow_code_rep   EQU ${at(0x5C)}   ; held-direction repeat countdown
bitmap_flow_code_fg    EQU ${at(0x5D)}
bitmap_flow_code_bg    EQU ${at(0x5E)}
bitmap_flow_code_hfg   EQU ${at(0x5F)}
bitmap_flow_code_hbg   EQU ${at(0x60)}
bitmap_flow_code_de    EQU ${at(0x61)}   ; word: page byte offset of slot 0
bitmap_flow_code_chr   EQU ${at(0x63)}   ; 2 bytes: one-character string for bitmap_flow_print
`;
}

/**
 * International MSX keyboard matrix, rows 0..5, bit 0 first: the ASCII each key
 * types into a code slot (0 = not a code key).
 */
const CODE_KEYMAP_ROWS: string[] = [
  '01234567',
  '89\0\0\0\0\0\0',
  '\0\0\0\0\0\0AB',
  'CDEFGHIJ',
  'KLMNOPQR',
  'STUVWXYZ',
];

/**
 * Control bits returned by bitmap_flow_code_read_ctl (active-high):
 *   0 UP  1 DOWN  2 LEFT  3 RIGHT  4 CONFIRM  5 CANCEL  6 BACKSPACE
 * Bits 0..4 line up with PSG R#14 (joystick: up, down, left, right, trigger A).
 * Pairs are [key bit in the matrix row, control bit].
 */
const CODE_CTL_ROW8: Array<[number, number]> = [
  [0, 4], // SPACE -> confirm
  [3, 6], // DEL -> backspace
  [4, 2], // LEFT
  [5, 0], // UP
  [6, 1], // DOWN
  [7, 3], // RIGHT
];
const CODE_CTL_ROW7: Array<[number, number]> = [
  [2, 5], // ESC -> cancel
  [5, 6], // BS -> backspace
  [7, 4], // RETURN -> confirm
];

function codeEntryRuntime(musicTick = false): string {
  const keymapBytes = CODE_KEYMAP_ROWS.flatMap(row => [...row].map(ch => ch.charCodeAt(0)));
  const keymapData: string[] = [];
  for (let offset = 0; offset < keymapBytes.length; offset += 8) {
    keymapData.push(`    DB ${keymapBytes.slice(offset, offset + 8).map(hexByte).join(',')}`);
  }
  let ctlLabel = 0;
  const mapBits = (pairs: Array<[number, number]>): string => pairs.map(([keyBit, ctlBit]) => {
    const skip = `bitmap_flow_code_ctl_${ctlLabel++}`;
    return `    bit ${keyBit}, b
    jp z, ${skip}
    set ${ctlBit}, c
${skip}:
`;
  }).join('');
  const empty = hexByte(BF_CODE_EMPTY_CHAR.charCodeAt(0));

  return `
; ------------------------------------------------------------
; CodeEntry (password) runtime. Keyboard: A-Z / 0-9 type, BS/DEL erase,
; SPACE/RETURN confirm, ESC cancel. Cursor keys / joystick 1: UP/DOWN cycle the
; slot's character (held = repeat), LEFT/RIGHT move, trigger A confirms.
; No BIOS: PPI for the keyboard, PSG R#14 for the joystick.
; ------------------------------------------------------------

; bitmap_flow_code_scan_key: A = ASCII of the first code key held on keyboard
; rows 0..5, or 0. Clobbers AF, BC, DE, HL.
bitmap_flow_code_scan_key:
    ld hl, bitmap_flow_code_keymap
    ld d, 0
bitmap_flow_code_scan_row:
    in a, (PPI_C)
    and #F0
    or d
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ld e, a
    ld b, 8
bitmap_flow_code_scan_bit:
    srl e
    jp nc, bitmap_flow_code_scan_next
    ld a, (hl)
    or a
    ret nz
bitmap_flow_code_scan_next:
    inc hl
    djnz bitmap_flow_code_scan_bit
    inc d
    ld a, d
    cp 6
    jp c, bitmap_flow_code_scan_row
    xor a
    ret

; bitmap_flow_code_read_ctl: A = control bits (see the table above).
; Clobbers AF, BC.
bitmap_flow_code_read_ctl:
    ld a, 15                   ; PSG R#15 bit 6 = 0 -> joystick port 1
    out (#A0), a
    in a, (#A2)
    and #BF
    out (#A1), a
    ld a, 14
    out (#A0), a
    in a, (#A2)                ; R#14: 0 = pressed
    cpl
    and #1F                    ; up, down, left, right, trigger A
    ld c, a
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ld b, a
${mapBits(CODE_CTL_ROW8)}    in a, (PPI_C)
    and #F0
    or 7
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ld b, a
${mapBits(CODE_CTL_ROW7)}    ld a, c
    ret

; bitmap_flow_code_slot: HL = address of the slot under the cursor. Clobbers AF, DE.
bitmap_flow_code_slot:
    ld a, (bitmap_flow_code_pos)
    ld e, a
    ld d, 0
    ld hl, bitmap_flow_code_buf
    add hl, de
    ret

; bitmap_flow_code_draw: redraw every slot, the one under the cursor inverted.
; Clobbers AF, BC, DE, HL.
bitmap_flow_code_draw:
    ld c, 0
bitmap_flow_code_draw_loop:
    ld a, (bitmap_flow_code_len)
    cp c
    ret z
    push bc
    ld a, (bitmap_flow_code_pos)
    cp c
    jp z, bitmap_flow_code_draw_hl
    ld a, (bitmap_flow_code_fg)
    ld (bitmap_flow_fg), a
    ld a, (bitmap_flow_code_bg)
    ld (bitmap_flow_bg), a
    jp bitmap_flow_code_draw_char
bitmap_flow_code_draw_hl:
    ld a, (bitmap_flow_code_hfg)
    ld (bitmap_flow_fg), a
    ld a, (bitmap_flow_code_hbg)
    ld (bitmap_flow_bg), a
bitmap_flow_code_draw_char:
    ld b, 0
    ld hl, bitmap_flow_code_buf
    add hl, bc
    ld a, (hl)
    ld (bitmap_flow_code_chr), a
    xor a
    ld (bitmap_flow_code_chr + 1), a
    ld a, c                    ; DE = slot 0 + C * ${BF_CODE_SLOT_BYTES}
    add a, a
    ld b, a
    add a, a
    add a, b
    ld e, a
    ld d, 0
    ld hl, (bitmap_flow_code_de)
    add hl, de
    ex de, hl
    ld hl, bitmap_flow_code_chr
    ld b, ${BF_CHAR_WIDTH_BYTES}
    call bitmap_flow_print
    pop bc
    inc c
    jp bitmap_flow_code_draw_loop

; bitmap_flow_code_edit: clear the slots and let the player type until CONFIRM
; (A = 0) or CANCEL (A = 1). Keys held on entry are ignored until released.
; Clobbers AF, BC, DE, HL.
bitmap_flow_code_edit:
    ld hl, bitmap_flow_code_buf
    ld (hl), ${empty}
    ld de, bitmap_flow_code_buf + 1
    ld bc, ${BF_CODE_MAX_LENGTH - 1}
    ldir
    xor a
    ld (bitmap_flow_code_pos), a
    call bitmap_flow_code_scan_key
    ld (bitmap_flow_code_key), a
    call bitmap_flow_code_read_ctl
    ld (bitmap_flow_code_ctl), a
    call bitmap_flow_code_draw
bitmap_flow_code_loop:
    ${flowFrameWait(musicTick)}
    ; Typed letter/digit: act once per new key.
    call bitmap_flow_code_scan_key
    ld hl, bitmap_flow_code_key
    cp (hl)
    jp z, bitmap_flow_code_controls
    ld (hl), a
    or a
    jp z, bitmap_flow_code_controls
    ld b, a
    call bitmap_flow_code_slot
    ld (hl), b
    ld a, (bitmap_flow_code_len)
    dec a
    ld b, a
    ld a, (bitmap_flow_code_pos)
    cp b
    jp nc, bitmap_flow_code_typed
    inc a
    ld (bitmap_flow_code_pos), a
bitmap_flow_code_typed:
    call bitmap_flow_code_draw
bitmap_flow_code_controls:
    call bitmap_flow_code_read_ctl
    ld b, a                    ; B = held now
    ld a, (bitmap_flow_code_ctl)
    cpl
    and b
    ld d, a                    ; D = pressed this frame
    ld a, b
    ld (bitmap_flow_code_ctl), a
    bit 4, d
    jp nz, bitmap_flow_code_confirm
    bit 5, d
    jp nz, bitmap_flow_code_cancel
    bit 6, d
    jp nz, bitmap_flow_code_backspace
    ld a, b
    and #0F
    jp z, bitmap_flow_code_loop
    ld a, d
    and #0F
    jp nz, bitmap_flow_code_dir_first
    ld hl, bitmap_flow_code_rep
    dec (hl)
    jp nz, bitmap_flow_code_loop
    ld (hl), ${BF_CODE_REPEAT_RATE}
    ld a, b
    jp bitmap_flow_code_dir
bitmap_flow_code_dir_first:
    ld a, ${BF_CODE_REPEAT_DELAY}
    ld (bitmap_flow_code_rep), a
    ld a, d
bitmap_flow_code_dir:
    bit 0, a
    jp nz, bitmap_flow_code_char_next
    bit 1, a
    jp nz, bitmap_flow_code_char_prev
    bit 2, a
    jp nz, bitmap_flow_code_left
    ; RIGHT
    ld a, (bitmap_flow_code_len)
    dec a
    ld b, a
    ld a, (bitmap_flow_code_pos)
    cp b
    jp nc, bitmap_flow_code_loop
    inc a
    ld (bitmap_flow_code_pos), a
    jp bitmap_flow_code_redraw
bitmap_flow_code_left:
    ld a, (bitmap_flow_code_pos)
    or a
    jp z, bitmap_flow_code_loop
    dec a
    ld (bitmap_flow_code_pos), a
    jp bitmap_flow_code_redraw
; A..Z then 0..9, wrapping; an empty slot starts at A going up, at 9 going down.
bitmap_flow_code_char_next:
    call bitmap_flow_code_slot
    ld a, (hl)
    cp ${empty}
    jp z, bitmap_flow_code_set_a
    cp 'Z'
    jp z, bitmap_flow_code_set_0
    cp '9'
    jp z, bitmap_flow_code_set_a
    inc a
    jp bitmap_flow_code_store
bitmap_flow_code_char_prev:
    call bitmap_flow_code_slot
    ld a, (hl)
    cp ${empty}
    jp z, bitmap_flow_code_set_9
    cp 'A'
    jp z, bitmap_flow_code_set_9
    cp '0'
    jp z, bitmap_flow_code_set_z
    dec a
    jp bitmap_flow_code_store
bitmap_flow_code_set_a:
    ld a, 'A'
    jp bitmap_flow_code_store
bitmap_flow_code_set_0:
    ld a, '0'
    jp bitmap_flow_code_store
bitmap_flow_code_set_9:
    ld a, '9'
    jp bitmap_flow_code_store
bitmap_flow_code_set_z:
    ld a, 'Z'
bitmap_flow_code_store:
    ld (hl), a
    jp bitmap_flow_code_redraw
; Erase the slot under the cursor; on an empty slot, step back and erase that one.
bitmap_flow_code_backspace:
    call bitmap_flow_code_slot
    ld a, (hl)
    cp ${empty}
    jp nz, bitmap_flow_code_erase
    ld a, (bitmap_flow_code_pos)
    or a
    jp z, bitmap_flow_code_loop
    dec a
    ld (bitmap_flow_code_pos), a
    call bitmap_flow_code_slot
bitmap_flow_code_erase:
    ld (hl), ${empty}
bitmap_flow_code_redraw:
    call bitmap_flow_code_draw
    jp bitmap_flow_code_loop
bitmap_flow_code_confirm:
    xor a
    ret
bitmap_flow_code_cancel:
    ld a, 1
    ret

; bitmap_flow_code_match: HL = code (len bytes). Z = the typed code matches.
; Clobbers AF, B, DE, HL.
bitmap_flow_code_match:
    ld de, bitmap_flow_code_buf
    ld a, (bitmap_flow_code_len)
    ld b, a
bitmap_flow_code_match_loop:
    ld a, (de)
    cp (hl)
    ret nz
    inc de
    inc hl
    djnz bitmap_flow_code_match_loop
    ret

; Keyboard rows 0..5 -> code character (bit 0 first; 0 = not a code key).
bitmap_flow_code_keymap:
${keymapData.join('\n')}
`;
}

/** `CodeEntry`: type a password; the matching code's port is followed. */
export function emitBitmapFlowCodeEntryNode(
  node: any,
  context: EmitContext & {
    /** Jump target per entry of `codes` (same order); '' = unwired. */
    codeTargets: string[];
    /** Wrong code / ESC target; undefined = ask again. */
    wrongTarget?: string;
  }
): string {
  const safeId = sanitizeLabel(String(node.id || 'code'));
  const entryLabel = `bitmap_flow_code_node_${safeId}`;
  const length = clampMsx2CodeLength(node.codeLength);
  const codes = (node.codes || []).slice(0, BF_CODE_MAX_CODES);
  const foreground = clampPaletteIndex(node.textColorIndex, context.defaultTextColor);
  const background = clampPaletteIndex(node.backgroundColorIndex, 0);
  const highlightForeground = clampPaletteIndex(node.highlightColorIndex, background);
  const highlightBackground = clampPaletteIndex(node.highlightBackgroundIndex, foreground);
  const title = sanitizeScreen5FlowText(node.title || '', BF_MAX_COLUMNS);
  const hint = sanitizeScreen5FlowText(node.hintText ?? 'SPACE: OK   ESC: BACK', BF_MAX_COLUMNS);
  const errorText = sanitizeScreen5FlowText(node.errorText ?? 'WRONG CODE', BF_MAX_COLUMNS);
  const slotCharacters = length * 2 - 1;
  const slotsOffset = BF_CODE_SLOTS_Y * BF_LINE_BYTES + centeredColumn(slotCharacters);
  // Unwired: back to the start of this node, which clears the slots and asks again.
  const wrongTarget = context.wrongTarget || entryLabel;
  const isUsable = (code: any): boolean => normalizeMsx2Code(code?.code).length === length;

  // A code that cannot fill exactly `length` slots can never match: skip it.
  const checks = codes.map((code: any, index: number) => {
    if (!isUsable(code)) {
      return `    ; code #${index + 1} "${String(code?.code ?? '')}" skipped: it must be ${length} characters A-Z / 0-9.
`;
    }
    const text = normalizeMsx2Code(code.code);
    const dataLabel = `bitmap_flow_code_${safeId}_${index}`;
    context.pushData(`${dataLabel}:   ; "${text}"\n    DB ${[...text].map(ch => hexByte(ch.charCodeAt(0))).join(',')}\n`);
    return `    ld hl, ${dataLabel}
    call bitmap_flow_code_match
    jp z, bitmap_flow_code_pick_${safeId}_${index}
`;
  }).join('');
  const picks = codes.map((code: any, index: number) => (isUsable(code)
    ? `bitmap_flow_code_pick_${safeId}_${index}:
    call bitmap_flow_sprites_on
    jp ${context.codeTargets[index] || entryLabel}
`
    : '')).join('');

  return `${entryLabel}:
    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
${fillRect(0, 0, 256, BF_VISIBLE_LINES, background)}${
    title ? printCall(title, BF_CODE_TITLE_Y, foreground, background, context) : ''
  }${hint ? printCall(hint, BF_CODE_HINT_Y, foreground, background, context) : ''}    ld a, ${length}
    ld (bitmap_flow_code_len), a
    ld hl, ${hexWord(slotsOffset)}
    ld (bitmap_flow_code_de), hl
    ld a, ${hexByte(foreground)}
    ld (bitmap_flow_code_fg), a
    ld a, ${hexByte(background)}
    ld (bitmap_flow_code_bg), a
    ld a, ${hexByte(highlightForeground)}
    ld (bitmap_flow_code_hfg), a
    ld a, ${hexByte(highlightBackground)}
    ld (bitmap_flow_code_hbg), a
    call bitmap_flow_code_edit
    or a
    jp nz, bitmap_flow_code_back_${safeId}
${checks}${errorText ? printCall(errorText, BF_CODE_ERROR_Y, highlightForeground, highlightBackground, context) : ''}    ld b, ${BF_CODE_ERROR_FRAMES}
    call bitmap_flow_wait_frames
bitmap_flow_code_back_${safeId}:
    call bitmap_flow_sprites_on
    jp ${wrongTarget}
${picks}`;
}
