// SCREEN 5 GameFlow runtime: the reusable Z80 blocks shared by every node the
// generic flow walker can emit (msx2Screen5FlowGenerator.ts).
//
// Everything here is written against the V9938 command engine (HMMV/HMMM) plus
// the MSX2 BIOS, so a wipe or a scroll costs a handful of VDP writes instead of
// thousands of FILVRM calls like the legacy strict-shape backend did.

export const GF_LINE_BYTES = 128; // SCREEN 5 = 256 px / 2 px per byte
export const GF_WIPE_LINES = 212;
export const GF_CHAR_WIDTH_BYTES = 3; // 6 px per character cell
export const GF_CHAR_HEIGHT = 8;
export const GF_MAX_COLUMNS = Math.floor(GF_LINE_BYTES / GF_CHAR_WIDTH_BYTES); // 42

// Text-node layout (pixel rows inside the page).
export const GF_TEXT_TITLE_Y = 24;
export const GF_TEXT_FIRST_LINE_Y = 56;
export const GF_TEXT_LINE_STEP = 12;
export const GF_TEXT_MAX_LINES = 8;
export const GF_TEXT_PROMPT_Y = 176;

// SubMenu layout.
export const GF_MENU_TITLE_Y = 32;
export const GF_MENU_FIRST_OPTION_Y = 72;
export const GF_MENU_OPTION_STEP = 18;
export const GF_MENU_MAX_OPTIONS = 6;

// Scrolling-text window.
export const GF_SCROLL_TOP = 40;
export const GF_SCROLL_HEIGHT = 144;
export const GF_SCROLL_STEP = 12;

export interface Screen5FlowRuntimeFeatures {
  text: boolean;
  menu: boolean;
  scroll: boolean;
  fade: boolean;
  wipeVertical: boolean;
  wipeHorizontal: boolean;
  wipeMirror: boolean;
  wipeDiagonal: boolean;
  psgSilence: boolean;
}

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

/** RAM equates. `base` must leave 0x600 free bytes below the ZX0 staging buffer. */
export function generateScreen5FlowRamEquates(base: number, textBufferBase: number): string {
  const at = (offset: number) => `#${(base + offset).toString(16).toUpperCase().padStart(4, '0')}`;
  return `; ---- SCREEN 5 GameFlow runtime RAM ----
GF_FG_PIX        EQU ${at(0x00)}   ; foreground palette index used by gf_print
GF_BG_PIX        EQU ${at(0x01)}   ; background palette index used by gf_print
GF_PRINT_WIDTH   EQU ${at(0x02)}   ; span width in bytes of the string being drawn
GF_PRINT_ROWS    EQU ${at(0x03)}   ; blit row counter
GF_PRINT_DEST    EQU ${at(0x04)}   ; word: VRAM address of the string top-left byte
GF_MENU_INDEX    EQU ${at(0x06)}   ; highlighted SubMenu option
GF_MENU_PREV     EQU ${at(0x07)}   ; previous GTSTCK value (edge detection)
GF_SCROLL_BG     EQU ${at(0x08)}   ; palette index used to clear the scroll band
GF_MIRROR_X      EQU ${at(0x0A)}   ; word: mirror wipe cursor
GF_CMD_PARAMS    EQU ${at(0x10)}   ; 15 bytes mirroring VDP R#32..R#46
GF_CMD_SX        EQU GF_CMD_PARAMS + 0
GF_CMD_SY        EQU GF_CMD_PARAMS + 2
GF_CMD_DX        EQU GF_CMD_PARAMS + 4
GF_CMD_DY        EQU GF_CMD_PARAMS + 6
GF_CMD_NX        EQU GF_CMD_PARAMS + 8
GF_CMD_NY        EQU GF_CMD_PARAMS + 10
GF_CMD_CLR       EQU GF_CMD_PARAMS + 12
GF_CMD_ARG       EQU GF_CMD_PARAMS + 13
GF_CMD_CMD       EQU GF_CMD_PARAMS + 14
GF_PALETTE_RAM   EQU ${at(0x20)}   ; 32 bytes: live palette, faded in place
GF_TEXTBUF       EQU #${textBufferBase.toString(16).toUpperCase().padStart(4, '0')}   ; ${GF_CHAR_HEIGHT} rows x ${GF_LINE_BYTES} bytes staging buffer
`;
}

export function generateScreen5FlowConstants(pageYOffset: number, vramBase: number): string {
  return `; ---- SCREEN 5 GameFlow runtime constants ----
GF_VDP_CTRL_PORT EQU #99
GF_VDP_DATA_PORT EQU #9B
GF_VDP_PAL_PORT  EQU #9A
GF_LINE_BYTES    EQU ${GF_LINE_BYTES}
GF_CHAR_HEIGHT   EQU ${GF_CHAR_HEIGHT}
GF_FONT_GLYPHS   EQU 59
GF_PAGE_Y        EQU ${pageYOffset}
GF_VRAM_BASE     EQU #${vramBase.toString(16).toUpperCase().padStart(4, '0')}
GF_WIPE_LINES    EQU ${GF_WIPE_LINES}
GF_SCROLL_TOP    EQU ${GF_SCROLL_TOP}
GF_SCROLL_HEIGHT EQU ${GF_SCROLL_HEIGHT}
GF_SCROLL_STEP   EQU ${GF_SCROLL_STEP}
`;
}

/** VDP command-engine helpers. Always emitted: every node type needs a fill. */
function generateVdpCommandHelpers(): string {
  return `
; ------------------------------------------------------------------
; gf_vdp_wait: block until the V9938 command engine reports idle (S#2 bit0).
; Clobbers AF. Leaves the status register selector back on S#0.
; ------------------------------------------------------------------
gf_vdp_wait:
    ld a, 2
    di
    out (GF_VDP_CTRL_PORT), a
    ld a, #8F
    out (GF_VDP_CTRL_PORT), a
    in a, (GF_VDP_CTRL_PORT)
    ex af, af'
    xor a
    out (GF_VDP_CTRL_PORT), a
    ld a, #8F
    out (GF_VDP_CTRL_PORT), a
    ei
    ex af, af'
    and #01
    jp nz, gf_vdp_wait
    ret

; ------------------------------------------------------------------
; gf_vdp_exec: push GF_CMD_PARAMS into R#32..R#46 through the indirect
; register port. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_vdp_exec:
    call gf_vdp_wait
    di
    ld a, 32
    out (GF_VDP_CTRL_PORT), a
    ld a, #91
    out (GF_VDP_CTRL_PORT), a
    ld hl, GF_CMD_PARAMS
    ld c, GF_VDP_DATA_PORT
    ld b, 15
    otir
    ei
    ret

; ------------------------------------------------------------------
; gf_set_fill_color: A = palette index -> GF_CMD_CLR = both nibbles.
; ------------------------------------------------------------------
gf_set_fill_color:
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (GF_CMD_CLR), a
    ret

; ------------------------------------------------------------------
; gf_fill_rect (HMMV) / gf_copy_rect (HMMM): callers fill the DX/DY/NX/NY
; (and SX/SY) words plus GF_CMD_CLR first. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_fill_rect:
    xor a
    ld (GF_CMD_ARG), a
    ld a, #C0
    ld (GF_CMD_CMD), a
    call gf_vdp_exec
    jp gf_vdp_wait

gf_copy_rect:
    xor a
    ld (GF_CMD_ARG), a
    ld a, #D0
    ld (GF_CMD_CMD), a
    call gf_vdp_exec
    jp gf_vdp_wait

; ------------------------------------------------------------------
; gf_clear_page: HMMV over the whole visible page with palette index 0.
; ------------------------------------------------------------------
gf_clear_page:
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_WIPE_LINES
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    jp gf_fill_rect
`;
}

/** Palette upload + gradual fade to black. */
function generatePaletteHelpers(withFade: boolean): string {
  const fade = withFade
    ? `
; ------------------------------------------------------------------
; gf_fade_out: 8 steps, each one dims every R/G/B component by one level
; and re-uploads GF_PALETTE_RAM. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_fade_out:
    ld b, 8
gf_fade_out_step:
    push bc
    call gf_fade_one_level
    halt
    halt
    halt
    pop bc
    djnz gf_fade_out_step
    ret

gf_fade_one_level:
    ld hl, GF_PALETTE_RAM
    ld b, 16
gf_fade_slot_loop:
    ld a, (hl)
    and #F0
    jp z, gf_fade_red_done
    sub #10
gf_fade_red_done:
    ld c, a
    ld a, (hl)
    and #0F
    jp z, gf_fade_blue_done
    dec a
gf_fade_blue_done:
    or c
    ld (hl), a
    inc hl
    ld a, (hl)
    and #07
    jp z, gf_fade_green_done
    dec a
gf_fade_green_done:
    ld (hl), a
    inc hl
    djnz gf_fade_slot_loop
    jp gf_upload_palette_ram
`
    : '';
  return `
; ------------------------------------------------------------------
; gf_upload_palette_ram: R#16 = 0, then the 32 live palette bytes.
; Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_upload_palette_ram:
    ld bc, #0010
    call WRTVDP
    ld hl, GF_PALETTE_RAM
    ld b, 32
gf_upload_palette_loop:
    ld a, (hl)
    out (GF_VDP_PAL_PORT), a
    inc hl
    djnz gf_upload_palette_loop
    ret
${fade}`;
}

/** 6x8 proportional-cell text blitter. */
function generateTextEngine(): string {
  return `
; ------------------------------------------------------------------
; gf_print: draw a zero-terminated ASCII string (chars 32..90).
;   HL = string pointer
;   DE = VRAM address of the top-left byte of the text span
;   B  = span width in bytes (3 per character cell)
; Colours come from GF_FG_PIX / GF_BG_PIX. Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------------
gf_print:
    ld (GF_PRINT_DEST), de
    ld a, b
    ld (GF_PRINT_WIDTH), a
    push hl
    call gf_fill_textbuf
    pop hl
    ld c, 0
gf_print_char_loop:
    ld a, (hl)
    or a
    jp z, gf_print_blit
    inc hl
    ld e, a
    ld a, (GF_PRINT_WIDTH)
    sub c
    cp 3
    jp c, gf_print_blit
    ld a, e
    push hl
    call gf_draw_char
    pop hl
    ld a, c
    add a, 3
    ld c, a
    jp gf_print_char_loop

gf_print_blit:
    ld hl, GF_TEXTBUF
    ld de, (GF_PRINT_DEST)
    ld a, GF_CHAR_HEIGHT
    ld (GF_PRINT_ROWS), a
gf_print_blit_loop:
    push hl
    push de
    ld a, (GF_PRINT_WIDTH)
    ld c, a
    ld b, 0
    call LDIRVM
    pop de
    pop hl
    ld a, (GF_PRINT_WIDTH)
    ld c, a
    ld b, 0
    add hl, bc
    ex de, hl
    ld bc, GF_LINE_BYTES
    add hl, bc
    ex de, hl
    ld a, (GF_PRINT_ROWS)
    dec a
    ld (GF_PRINT_ROWS), a
    jp nz, gf_print_blit_loop
    ret

; Fill GF_TEXTBUF (8 rows x GF_PRINT_WIDTH bytes) with the background colour.
gf_fill_textbuf:
    ld a, (GF_BG_PIX)
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (GF_TEXTBUF), a
    ld a, (GF_PRINT_WIDTH)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    dec hl
    ld b, h
    ld c, l
    ld hl, GF_TEXTBUF
    ld de, GF_TEXTBUF + 1
    ldir
    ret

; A = character code, C = byte column inside the span.
gf_draw_char:
    push bc
    call gf_draw_char_inner
    pop bc
    ret

gf_draw_char_inner:
    sub 32
    ret c
    cp GF_FONT_GLYPHS
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, gf_font_data
    add hl, de
    ld e, c
    ld d, 0
    push hl
    ld hl, GF_TEXTBUF
    add hl, de
    ex de, hl
    pop hl
    ld b, GF_CHAR_HEIGHT
gf_draw_char_row:
    ld a, (hl)
    inc hl
    push hl
    push bc
    call gf_expand_row
    pop bc
    pop hl
    ld a, (GF_PRINT_WIDTH)
    sub 3
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    djnz gf_draw_char_row
    ret

; A = glyph row bits (bit7 leftmost). Writes 3 bytes / 6 pixels at (DE).
gf_expand_row:
    ld c, a
    ld b, 3
gf_expand_row_loop:
    ld a, c
    rlca
    ld c, a
    call gf_expand_pick
    rlca
    rlca
    rlca
    rlca
    ld l, a
    ld a, c
    rlca
    ld c, a
    call gf_expand_pick
    or l
    ld (de), a
    inc de
    djnz gf_expand_row_loop
    ret

gf_expand_pick:
    jp nc, gf_expand_pick_bg
    ld a, (GF_FG_PIX)
    ret
gf_expand_pick_bg:
    ld a, (GF_BG_PIX)
    ret

; ------------------------------------------------------------------
; gf_wait_key / gf_wait_frames
; ------------------------------------------------------------------
gf_wait_key:
    call KILBUF
gf_wait_key_loop:
    halt
    call CHSNS
    jp z, gf_wait_key_loop
    call CHGET
    ret

gf_wait_frames:
    ld a, b
    or a
    ret z
gf_wait_frames_loop:
    halt
    djnz gf_wait_frames_loop
    ret
`;
}

/** SubMenu input helpers (cursor keys / joystick + trigger). */
function generateMenuHelpers(): string {
  return `
; ------------------------------------------------------------------
; gf_menu_wait_release: swallow a trigger that is still held from the
; previous node so the menu does not self-select on entry.
; ------------------------------------------------------------------
gf_menu_wait_release:
    call KILBUF
gf_menu_wait_release_loop:
    halt
    xor a
    call GTTRIG
    or a
    jp nz, gf_menu_wait_release_loop
    xor a
    ld (GF_MENU_PREV), a
    ret

; ------------------------------------------------------------------
; gf_menu_read_stick: merge cursor keys (port 0) and joystick 1 so the
; menu answers to both. Returns A = 0 idle / 1 up / 5 down.
; ------------------------------------------------------------------
gf_menu_read_stick:
    xor a
    call GTSTCK
    or a
    ret nz
    ld a, 1
    jp GTSTCK

; ------------------------------------------------------------------
; gf_menu_read_trigger: space bar or joystick 1 fire. A = 0 when idle.
; ------------------------------------------------------------------
gf_menu_read_trigger:
    xor a
    call GTTRIG
    or a
    ret nz
    ld a, 1
    jp GTTRIG
`;
}

/** Scrolling-text window driven by HMMM. */
function generateScrollHelpers(): string {
  return `
; ------------------------------------------------------------------
; gf_scroll_window: HMMM the text window up by GF_SCROLL_STEP pixels and
; clear the freed band with GF_SCROLL_BG. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_scroll_window:
    ld hl, 0
    ld (GF_CMD_SX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP + GF_SCROLL_STEP
    ld (GF_CMD_SY), hl
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_SCROLL_HEIGHT - GF_SCROLL_STEP
    ld (GF_CMD_NY), hl
    call gf_copy_rect
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP + GF_SCROLL_HEIGHT - GF_SCROLL_STEP
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_SCROLL_STEP
    ld (GF_CMD_NY), hl
    ld a, (GF_SCROLL_BG)
    call gf_set_fill_color
    jp gf_fill_rect

; ------------------------------------------------------------------
; gf_scroll_clear_window: paint the whole window with GF_SCROLL_BG.
; ------------------------------------------------------------------
gf_scroll_clear_window:
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_SCROLL_HEIGHT
    ld (GF_CMD_NY), hl
    ld a, (GF_SCROLL_BG)
    call gf_set_fill_color
    jp gf_fill_rect
`;
}

function generateWipeHelpers(features: Screen5FlowRuntimeFeatures): string {
  const vertical = features.wipeVertical
    ? `
; Vertical pixel wipe: 4-pixel columns, one HMMV column per frame.
gf_wipe_vertical:
    ld hl, 0
    ld (GF_CMD_DX), hl
gf_wipe_vertical_loop:
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
    ld hl, 4
    ld (GF_CMD_NX), hl
    ld hl, GF_WIPE_LINES
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    call gf_fill_rect
    halt
    ld hl, (GF_CMD_DX)
    ld de, 4
    add hl, de
    ld (GF_CMD_DX), hl
    ld de, 256
    or a
    sbc hl, de
    jp c, gf_wipe_vertical_loop
    ret
`
    : '';
  const horizontal = features.wipeHorizontal
    ? `
; Horizontal pixel wipe: 4-line bands, one HMMV band per frame.
gf_wipe_horizontal:
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
gf_wipe_horizontal_loop:
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, 4
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    call gf_fill_rect
    halt
    ld hl, (GF_CMD_DY)
    ld de, 4
    add hl, de
    ld (GF_CMD_DY), hl
    ld de, GF_PAGE_Y + GF_WIPE_LINES
    or a
    sbc hl, de
    jp c, gf_wipe_horizontal_loop
    ret
`
    : '';
  const mirror = features.wipeMirror
    ? `
; Mirror wipe: both vertical edges close towards the centre.
gf_wipe_mirror:
    ld hl, 0
    ld (GF_MIRROR_X), hl
gf_wipe_mirror_loop:
    ld hl, (GF_MIRROR_X)
    ld (GF_CMD_DX), hl
    call gf_wipe_mirror_column
    ld hl, 252
    ld de, (GF_MIRROR_X)
    or a
    sbc hl, de
    ld (GF_CMD_DX), hl
    call gf_wipe_mirror_column
    halt
    ld hl, (GF_MIRROR_X)
    ld de, 4
    add hl, de
    ld (GF_MIRROR_X), hl
    ld de, 128
    or a
    sbc hl, de
    jp c, gf_wipe_mirror_loop
    ret

gf_wipe_mirror_column:
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
    ld hl, 4
    ld (GF_CMD_NX), hl
    ld hl, GF_WIPE_LINES
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    jp gf_fill_rect
`
    : '';
  const diagonal = features.wipeDiagonal
    ? `
; Diagonal wipe: 16x16 blocks along successive anti-diagonals, one
; anti-diagonal per frame. Table entries are DX,DY words; #FFFE = frame
; boundary, #FFFF = end of table.
gf_wipe_diagonal:
    ld hl, gf_diagonal_wipe_table
gf_wipe_diagonal_loop:
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, d
    cp #FF
    jp nz, gf_wipe_diagonal_block
    ld a, e
    cp #FE
    jp z, gf_wipe_diagonal_wait
    ret
gf_wipe_diagonal_wait:
    halt
    jp gf_wipe_diagonal_loop
gf_wipe_diagonal_block:
    ld (GF_CMD_DX), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (GF_CMD_DY), de
    push hl
    ld hl, 16
    ld (GF_CMD_NX), hl
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    call gf_fill_rect
    pop hl
    jp gf_wipe_diagonal_loop

gf_diagonal_wipe_table:
${generateDiagonalWipeTable()}
`
    : '';
  return `${vertical}${horizontal}${mirror}${diagonal}`;
}

function generateDiagonalWipeTable(): string {
  const blockSize = 16;
  const columns = 256 / blockSize; // 16
  const rows = Math.ceil(GF_WIPE_LINES / blockSize); // 14
  const lines: string[] = [];
  for (let diagonal = 0; diagonal <= columns + rows - 2; diagonal++) {
    for (let row = 0; row < rows; row++) {
      const column = diagonal - row;
      if (column < 0 || column >= columns) continue;
      lines.push(`    DW ${column * blockSize}, GF_PAGE_Y + ${row * blockSize}`);
    }
    lines.push('    DW #FFFE');
  }
  lines.push('    DW #FFFF');
  return lines.join('\n');
}

function generatePsgSilence(): string {
  return `
; ------------------------------------------------------------------
; gf_psg_silence: mute the three PSG channels (Music node "stop").
; ------------------------------------------------------------------
gf_psg_silence:
    ld a, 7
    ld e, #BF
    call WRTPSG
    ld b, 3
    ld c, 8
gf_psg_silence_loop:
    ld a, c
    ld e, 0
    push bc
    call WRTPSG
    pop bc
    inc c
    djnz gf_psg_silence_loop
    ret
`;
}

export function generateScreen5FlowRuntime(features: Screen5FlowRuntimeFeatures, fontBytes: number[]): string {
  const fontData = features.text || features.menu || features.scroll
    ? `
; ------------------------------------------------------------------
; gf_font_data: ${fontBytes.length / GF_CHAR_HEIGHT} glyphs (ASCII 32..90), 8 rows each,
; 5 pixels left-aligned on bits 7..3 so bit 2 becomes the cell gap.
; ------------------------------------------------------------------
gf_font_data:
${chunkedDb(fontBytes)}
`
    : '';
  return [
    generateVdpCommandHelpers(),
    generatePaletteHelpers(features.fade),
    features.text || features.menu || features.scroll ? generateTextEngine() : '',
    features.menu ? generateMenuHelpers() : '',
    features.scroll ? generateScrollHelpers() : '',
    generateWipeHelpers(features),
    features.psgSilence ? generatePsgSilence() : '',
    fontData,
  ].join('');
}

export function chunkedDb(bytes: number[]): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }
  return lines.join('\n');
}
