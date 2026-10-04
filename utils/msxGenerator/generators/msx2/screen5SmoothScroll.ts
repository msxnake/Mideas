/**
 * Pixel-smooth vertical text scroll for SCREEN 5 GameFlow TextScroll nodes.
 *
 * Works on every MSX2 VDP (V9938 and V9958): the text lives in a 256-line ring
 * on the OTHER VRAM page and the window is shown through a raster split:
 *
 *   top of frame ........ R#2 = main page, R#23 = 0   (title stays fixed)
 *   window top line ..... R#2 = ring page, R#23 = s   (text, scrolled by s)
 *   window bottom line .. R#2 = main page, R#23 = 0
 *
 * The split lines are found by polling the line-interrupt flag (S#1 FH, set
 * when the raster reaches R#19) with IE1 left OFF, so it works both in the
 * interrupt-driven GameFlow walker and in the DI-only bitmap-room runtime.
 * Scrolling one pixel is just `s = s + 1`: no VRAM is moved. Each new text line
 * is prepared ahead, below the visible window, in small steps spread over the
 * 12 frames a line takes to scroll in (clear band, expand 7 glyphs per frame,
 * blit 2 rows per frame), so the split never misses a frame.
 *
 * The ring page's hidden rows 212..255 may hold other data (sprite tables,
 * HUD tiles). They are parked in the main page's window rows, which are never
 * displayed while the split runs, and put back when the scroll ends.
 *
 * This module only emits code; each backend supplies its own primitives
 * (text engine, VDP command block, frame wait) through Screen5SmoothScrollHost.
 */

export const SMOOTH_SCROLL_LINE_STEP = 12; // pixels per text line
const PARKED_ROWS = 44; // rows 212..255 of the ring page
const STRIP_ROWS = 16; // glyph strip: 2 rows of 8 px, 42 cells of 6 px each
const STRIP_CELLS = 42;
const FONT_FIRST_CHAR = 32;
const FONT_GLYPHS = 59; // ASCII 32..90
const GLYPHS_PER_CALL = 14; // 3 calls per 42-cell line
// R#19 is armed this many lines before the window edge; wait_line then locks
// onto the HR falling edge of the line right above the edge.
const SPLIT_LEAD = 3;
/** djnz count that parks the split writes in the horizontal blank (openMSX-calibrated). */
const SPLIT_DELAY = 9;

export interface Screen5SmoothScrollHost {
  /** Label prefix, e.g. `gf_vs`. */
  prefix: string;
  /** RAM base for 16 bytes of scroll state. */
  ramBase: number;
  /** True when the runtime runs with interrupts on (walker): DI/EI around VDP accesses. */
  interrupts: boolean;
  /**
   * How a frame boundary is detected without ever skipping one when the
   * per-frame work overran into the blanking period:
   *   'jiffy'  - the BIOS frame counter JIFFY (#FC9E) changed (interrupts on);
   *   'status' - the latched S#0 F flag (interrupts off).
   */
  vblankKind: 'jiffy' | 'status';
  /** Extra per-frame work (e.g. music tick), may clobber everything. */
  perFrameAsm?: string;
  /** Main (title) page and ring page (0 or 1). */
  mainPage: number;
  ringPage: number;
  /** Window top line and height inside the page. */
  windowTop: number;
  windowHeight: number;
  /** RAM byte holding the background palette index (fills). */
  bgVar: string;
  // VDP command block symbols.
  cmdSx: string;
  cmdSy: string;
  cmdDx: string;
  cmdDy: string;
  cmdNx: string;
  cmdNy: string;
  /** A = palette index -> fill colour of the block. */
  setFillColorCall: string;
  /** Runs HMMV / HMMM with the block and waits for completion. */
  runFillAsm: string;
  runCopyAsm: string;
  /** Blank / unblank the display (R#1 BL). */
  displayOffAsm: string;
  displayOnAsm: string;
}

const hexWord = (value: number): string => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
const r2ForPage = (page: number): number => (page === 1 ? 0x3f : 0x1f);

export function smoothScrollRamEquates(host: Screen5SmoothScrollHost): string {
  const p = host.prefix.toUpperCase();
  const at = (offset: number) => hexWord(host.ramBase + offset);
  return `; ---- smooth text scroll state ----
${p}_S        EQU ${at(0)}    ; ring scroll offset (R#23 value in the window)
${p}_ACC      EQU ${at(1)}    ; pixel pacing accumulator
${p}_STEP     EQU ${at(2)}    ; frames per ${SMOOTH_SCROLL_LINE_STEP}-pixel line
${p}_PIX      EQU ${at(3)}    ; pixel inside the current line (0..${SMOOTH_SCROLL_LINE_STEP - 1})
${p}_PHASE    EQU ${at(4)}    ; 0 clear band, 2 glyphs, 4 idle
${p}_COL      EQU ${at(5)}    ; cell (0..41) of the next glyph
${p}_TBL      EQU ${at(6)}    ; word: next line table entry
${p}_STR      EQU ${at(8)}    ; word: next character (0 = blank line)
${p}_BAND     EQU ${at(10)}   ; ring row of the line being prepared
${p}_Y0       EQU ${at(11)}   ; ring row of the first glyph row (BAND + 2)
${p}_N1       EQU ${at(15)}   ; glyph rows before the ring wraps (8 = no wrap)
${p}_REMAIN   EQU ${at(12)}   ; word: pixels left to scroll
${p}_JIF      EQU ${at(14)}   ; last JIFFY low byte seen (interrupt-driven hosts)
`;
}

/**
 * Routines. Entry point `<p>_run`: HL = line table (DW string, 0 = blank line,
 * #FFFF = end), DE = total pixels to scroll, A = frames per 12-pixel line
 * (>= 12, so at most one pixel per frame). The caller sets the text colours
 * and draws the title on the main page first.
 */
export function generateSmoothScrollRuntime(
  host: Screen5SmoothScrollHost,
  parts: { vertical?: boolean; marquee?: boolean } = { vertical: true },
): string {
  const p = host.prefix;
  const P = p.toUpperCase();
  const di = host.interrupts ? '    di\n' : '';
  const ei = host.interrupts ? '    ei\n' : '';
  const ringY = host.ringPage * 256;
  const mainY = host.mainPage * 256;
  const ringAddrHigh = host.ringPage === 1 ? 0x80 : 0x00;
  const top = host.windowTop;
  const height = host.windowHeight;
  const ringR2 = r2ForPage(host.ringPage);
  const mainR2 = r2ForPage(host.mainPage);
  const stripY = mainY + top + PARKED_ROWS;

  const fill = (dyAsm: string, nyAsm: string): string => `${dyAsm}
    ld (${host.cmdDy}), hl
    ld hl, 0
    ld (${host.cmdDx}), hl
    ld hl, 256
    ld (${host.cmdNx}), hl
${nyAsm}
    ld (${host.cmdNy}), hl
    ld a, (${host.bgVar})
    ${host.setFillColorCall}
${host.runFillAsm}`;

  const copy = (sy: number, dy: number, ny: number): string => `    ld hl, 0
    ld (${host.cmdSx}), hl
    ld (${host.cmdDx}), hl
    ld hl, ${sy}
    ld (${host.cmdSy}), hl
    ld hl, ${dy}
    ld (${host.cmdDy}), hl
    ld hl, 256
    ld (${host.cmdNx}), hl
    ld hl, ${ny}
    ld (${host.cmdNy}), hl
${host.runCopyAsm}`;

  const verticalMain = `
; ------------------------------------------------------------
; FUNCTION: ${p}_run
; ------------------------------------------------------------
; PURPOSE:
;   Pixel-smooth vertical text scroll through a raster split (R#2 + R#23),
;   valid on V9938 and V9958. The text ring lives on VRAM page ${host.ringPage}; the window
;   (lines ${top}..${top + height - 1}) shows it, the rest of the screen shows page ${host.mainPage}.
;
; INPUT:
;   HL = line table (DW string pointer per line, 0 = blank, #FFFF = end)
;   DE = pixels to scroll in total
;   A  = frames per ${SMOOTH_SCROLL_LINE_STEP}-pixel line (>= ${SMOOTH_SCROLL_LINE_STEP})
;   ${host.bgVar} = background colour
;   The caller has blanked the display and printed the glyph strip (see
;   smoothScrollStripTexts) on page ${host.mainPage} at rows ${top + PARKED_ROWS}..${top + PARKED_ROWS + STRIP_ROWS - 1}.
;
; OUTPUT:
;   None. Returns with the split off, R#2 on page ${host.mainPage}, R#23 = 0 and the
;   window area of page ${host.mainPage} cleared to the background colour.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   ${p}_frame, ${p}_task, ${p}_start_line, text engine, VDP command block
;
; SIDE EFFECTS:
;   Rewrites VRAM page ${host.ringPage} (rows 212..255 are parked in page ${host.mainPage}'s
;   window rows and restored at the end). Blanks the display for two short
;   moments (setup and teardown).
; ------------------------------------------------------------
${p}_run:
    ld (${P}_TBL), hl
    ld (${P}_STEP), a
    ld (${P}_REMAIN), de
    xor a
    ld (${P}_S), a
    ld (${P}_ACC), a
    ld (${P}_PIX), a
${host.displayOffAsm.trimEnd()}
    ; Park the ring page's hidden rows in the (never displayed) main window rows.
${copy(ringY + 212, mainY + top, PARKED_ROWS)}
    ; Blank ring, and the main-page window rows below the parked rows and the
    ; glyph strip (the bottom split edge can show part of one of them).
${fill(`    ld hl, ${ringY}`, '    ld hl, 256')}
${fill(`    ld hl, ${mainY + top + PARKED_ROWS + STRIP_ROWS}`, `    ld hl, ${height - PARKED_ROWS - STRIP_ROWS}`)}
    ; Line 0 is drawn completely before the scroll starts.
    ld a, ${(top + height) & 0xff}
    ld (${P}_BAND), a
    call ${p}_start_line
${p}_run_first:
    call ${p}_task
    ld a, (${P}_PHASE)
    cp 4
    jp nz, ${p}_run_first
    ld a, ${(top + height + SMOOTH_SCROLL_LINE_STEP) & 0xff}
    ld (${P}_BAND), a
    call ${p}_start_line
${host.vblankKind === 'jiffy' ? `    ld a, (#FC9E)
    ld (${P}_JIF), a
` : ''}${host.displayOnAsm.trimEnd()}
${p}_run_frame:
    call ${p}_frame
    ; The ring row just above the window edge (it scrolled out last frame) is
    ; cleared, so the partially switched edge line never shows old text.
${fill(`    ld a, (${P}_S)
    add a, ${(top - 1) & 0xff}
    ld l, a
    ld h, ${ringY >> 8}`, '    ld hl, 1')}
    call ${p}_task
${host.perFrameAsm ? `${host.perFrameAsm.trimEnd()}\n` : ''}    ld a, (${P}_STEP)
    ld c, a
    ld a, (${P}_ACC)
    add a, ${SMOOTH_SCROLL_LINE_STEP}
    cp c
    jp c, ${p}_run_keep
    sub c
    ld (${P}_ACC), a
    ld a, (${P}_S)
    inc a
    ld (${P}_S), a
    ld hl, (${P}_REMAIN)
    dec hl
    ld (${P}_REMAIN), hl
    ld a, h
    or l
    jp z, ${p}_run_done
    ld a, (${P}_PIX)
    inc a
    cp ${SMOOTH_SCROLL_LINE_STEP}
    jp c, ${p}_run_pix
    ; A new line period starts: prepare the next line 12 rows further down.
    ld a, (${P}_BAND)
    add a, ${SMOOTH_SCROLL_LINE_STEP}
    ld (${P}_BAND), a
    call ${p}_start_line
    xor a
${p}_run_pix:
    ld (${P}_PIX), a
    jp ${p}_run_frame
${p}_run_keep:
    ld (${P}_ACC), a
    jp ${p}_run_frame
${p}_run_done:
    call ${p}_vblank
${host.displayOffAsm.trimEnd()}
${di}    xor a
    out (#99), a
    ld a, #97                 ; R#23 = 0
    out (#99), a
    ld a, ${hexByte(mainR2)}
    out (#99), a
    ld a, #82                 ; R#2 = main page
    out (#99), a
${ei}    ; Put the parked rows back and clear the main window area.
${copy(mainY + top, ringY + 212, PARKED_ROWS)}
${fill(`    ld hl, ${mainY + top}`, `    ld hl, ${height}`)}
${host.displayOnAsm.trimEnd()}
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_frame
; ------------------------------------------------------------
; PURPOSE:
;   One displayed frame of the split: wait for vblank, then switch to the ring
;   page (scrolled by ${P}_S) at the window top line and back to the main page
;   at the window bottom line.
;
; INPUT:
;   ${P}_S = scroll offset.
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
;   ${p}_wait_line
;
; SIDE EFFECTS:
;   Writes R#2, R#19 and R#23; R#15 ends at 0.
;
; NOTES:
;   The V9938 compares R#19 against the display line PLUS the current R#23,
;   so the bottom split line is offset by ${P}_S.
; ------------------------------------------------------------
${p}_frame:
    call ${p}_vblank
    ld h, #82                 ; R#2 (page) first: it is what shows
    ld l, 23                  ; then R#23 (vertical scroll)
    ld a, (${P}_S)
    ld d, a
    ld e, ${hexByte(ringR2)}
    ld a, ${top - SPLIT_LEAD}
    call ${p}_wait_line
    ld a, (${P}_S)
    add a, ${(top + height - SPLIT_LEAD) & 0xff}
    ld d, 0
    ld e, ${hexByte(mainR2)}
    jp ${p}_wait_line
`;

  const primitives = `
; ------------------------------------------------------------
; FUNCTION: ${p}_vblank
; ------------------------------------------------------------
; PURPOSE:
;   Return once a new frame has started since the previous call, without
;   skipping a frame when the caller's work ran past the vertical blank.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, B
;
; PRESERVES:
;   C, DE, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   ${host.vblankKind === 'jiffy' ? `Updates ${P}_JIF.` : 'Consumes the S#0 frame flag; R#15 = 0.'}
; ------------------------------------------------------------
${p}_vblank:
${host.vblankKind === 'jiffy' ? `    ld a, (${P}_JIF)
    ld b, a
${p}_vblank_loop:
    ld a, (#FC9E)
    cp b
    jp z, ${p}_vblank_loop
    ld (${P}_JIF), a
    ret` : `    xor a
    out (#99), a
    ld a, #8F                 ; R#15 = 0 (S#0)
    out (#99), a
${p}_vblank_loop:
    in a, (#99)               ; F (bit 7) stays latched until read
    rlca
    jp nc, ${p}_vblank_loop
    ret`}

; ------------------------------------------------------------
; FUNCTION: ${p}_wait_line
; ------------------------------------------------------------
; PURPOSE:
;   Raster split primitive: set R#19 = A, wait for the raster to reach it
;   (S#1 FH, polled with IE1 off), lock onto the start of the next display
;   line (S#2 HR falling edge) and write two VDP registers at the END of that
;   line, inside the right border / horizontal blank, so the change never
;   lands on visible pixels.
;
; INPUT:
;   A = line for R#19
;   H = first register | #80, E = its value   (written through port #99)
;   L = second register number, D = its value (written through R#17 / #9B)
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
;   None.
;
; SIDE EFFECTS:
;   R#15 = 0 and R#17 = #20 (R#32, auto-increment) on exit.
;
; NOTES:
;   R#19 is armed ${SPLIT_LEAD} lines ahead of the target line. The second register goes
;   through the indirect port so both writes are only 12 T-states apart;
;   the fixed delay centres them in the ~57 T-state window between the end
;   of the active line and the start of the next one (HR poll jitter = 30).
; ------------------------------------------------------------
${p}_wait_line:
${di}    out (#99), a
    ld a, #93                 ; R#19
    out (#99), a
    ld a, l
    or #80                    ; R#17 = second register, no auto-increment
    out (#99), a
    ld a, #91
    out (#99), a
    ld a, 1
    out (#99), a
    ld a, #8F                 ; R#15 = 1 (S#1)
    out (#99), a
    in a, (#99)               ; clear a stale FH
${p}_wait_line_fh:
    in a, (#99)
    rrca
    jp nc, ${p}_wait_line_fh
    ld a, 2
    out (#99), a
    ld a, #8F                 ; R#15 = 2 (S#2: HR = bit 5)
    out (#99), a
    ld bc, #2099              ; B = HR mask, C = port
${p}_wait_line_hr0:
    in a, (c)                 ; leave the current blank (if any)
    and b
    jp nz, ${p}_wait_line_hr0
${p}_wait_line_hr1:
    in a, (c)                 ; wait for the next blank
    and b
    jp z, ${p}_wait_line_hr1
${p}_wait_line_hr2:
    in a, (c)                 ; display of the target line starts
    and b
    jp nz, ${p}_wait_line_hr2
    ld b, ${SPLIT_DELAY}
${p}_wait_line_delay:
    djnz ${p}_wait_line_delay ; skip the active part of the line
    ld a, d
    out (c), e
    out (c), h                ; first register
    out (#9B), a              ; second register
    xor a
    out (#99), a
    ld a, #8F                 ; R#15 = 0
    out (#99), a
    ld a, #20
    out (#99), a
    ld a, #91                 ; R#17 = R#32, auto-increment
    out (#99), a
${ei}    ret
`;

  const verticalTasks = `
; ------------------------------------------------------------
; FUNCTION: ${p}_start_line
; ------------------------------------------------------------
; PURPOSE:
;   Take the next line from the table and restart the preparation phases.
;
; INPUT:
;   ${P}_TBL, ${P}_BAND.
;
; OUTPUT:
;   ${P}_STR = string (0 when blank or past the end), ${P}_PHASE = 0.
;
; DESTROYS:
;   AF, DE, HL
;
; PRESERVES:
;   BC, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Advances ${P}_TBL (never past the #FFFF end marker).
; ------------------------------------------------------------
${p}_start_line:
    xor a
    ld (${P}_PHASE), a
    ld hl, (${P}_TBL)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, d
    and e
    inc a
    jp z, ${p}_start_line_end
    ld (${P}_TBL), hl
    ld (${P}_STR), de
    ret
${p}_start_line_end:
    ld hl, 0
    ld (${P}_STR), hl
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_task
; ------------------------------------------------------------
; PURPOSE:
;   One small step of preparing the line in the band at ${P}_BAND (ring rows,
;   wrapping at 256): clear the band, then ${GLYPHS_PER_CALL} glyphs per call, each one an
;   HMMM from the glyph strip (4 calls per line, well inside the 12 frames a
;   line needs to scroll in at full speed).
;
; INPUT:
;   ${P}_PHASE, ${P}_STR, ${P}_COL, ${P}_BAND.
;
; OUTPUT:
;   Phase state advanced (3 = line ready).
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   VDP command block (HMMV clear, HMMM glyph copies)
;
; SIDE EFFECTS:
;   Writes the text buffer and VRAM page ${host.ringPage}.
; ------------------------------------------------------------
${p}_task:
    ld a, (${P}_PHASE)
    or a
    jp z, ${p}_task_clear
    cp 2
    jp z, ${p}_task_glyphs
    ret

${p}_task_clear:
    ; Band rows BAND..BAND+11, split in two fills when it wraps past row 255.
    ld a, (${P}_BAND)
    cp ${256 - SMOOTH_SCROLL_LINE_STEP + 1}
    jp nc, ${p}_task_clear_wrap
${fill(`    ld a, (${P}_BAND)
    ld l, a
    ld h, ${ringY >> 8}`, `    ld hl, ${SMOOTH_SCROLL_LINE_STEP}`)}
    jp ${p}_task_clear_done
${p}_task_clear_wrap:
${fill(`    ld a, (${P}_BAND)
    ld l, a
    ld h, ${ringY >> 8}`, `    ld a, (${P}_BAND)
    neg
    ld l, a
    ld h, 0`)}
${fill(`    ld hl, ${ringY}`, `    ld a, (${P}_BAND)
    add a, ${SMOOTH_SCROLL_LINE_STEP}
    ld l, a
    ld h, 0`)}
${p}_task_clear_done:
    ld hl, (${P}_STR)
    ld a, h
    or l
    jp z, ${p}_task_idle
    xor a
    ld (${P}_COL), a
    ; Glyph rows are BAND+2..BAND+9; when they straddle ring row 255 each glyph
    ; copy is split in two HMMMs (N1 rows at Y0, the rest at row 0).
    ld a, (${P}_BAND)
    add a, 2
    ld (${P}_Y0), a
    neg
    jp z, ${p}_task_n1_full   ; Y0 = 0 -> 256 rows ahead
    cp 8
    jp c, ${p}_task_n1_set
${p}_task_n1_full:
    ld a, 8
${p}_task_n1_set:
    ld (${P}_N1), a
    ld a, 2
    ld (${P}_PHASE), a
    ret

${p}_task_glyphs:
    ld b, ${GLYPHS_PER_CALL}
${p}_task_glyph_loop:
    push bc
    ld hl, (${P}_STR)
    ld a, (hl)
    or a
    jp z, ${p}_task_glyphs_done
    inc hl
    ld (${P}_STR), hl
    sub 32
    jp c, ${p}_task_glyph_next
    jp z, ${p}_task_glyph_next  ; space: the band is already background
    cp ${FONT_GLYPHS}
    jp nc, ${p}_task_glyph_next
    ; strip cell: SY row 0 for glyphs 0..41, row 1 (+8) for 42..58
    ld e, ${hexByte(stripY & 0xff)}
    cp ${STRIP_CELLS}
    jp c, ${p}_task_glyph_row0
    sub ${STRIP_CELLS}
    ld e, ${hexByte((stripY + 8) & 0xff)}
${p}_task_glyph_row0:
    ; SX = cell * 6
    ld l, a
    ld h, 0
    add hl, hl
    ld c, l
    ld b, h
    add hl, hl
    add hl, bc
    ld (${host.cmdSx}), hl
    ld l, e
    ld h, ${stripY >> 8}
    ld (${host.cmdSy}), hl
    ; DX = 2 + COL * 6
    ld a, (${P}_COL)
    ld l, a
    ld h, 0
    add hl, hl
    ld c, l
    ld b, h
    add hl, hl
    add hl, bc
    inc hl
    inc hl
    ld (${host.cmdDx}), hl
    ld hl, 6
    ld (${host.cmdNx}), hl
    ld a, (${P}_Y0)
    ld l, a
    ld h, ${ringY >> 8}
    ld (${host.cmdDy}), hl
    ld a, (${P}_N1)
    ld l, a
    ld h, 0
    ld (${host.cmdNy}), hl
${host.runCopyAsm}
    ld a, (${P}_N1)
    cp 8
    jp z, ${p}_task_glyph_next
    ; wrapped part: remaining rows at ring row 0
    ld e, a
    ld d, 0
    ld hl, (${host.cmdSy})
    add hl, de
    ld (${host.cmdSy}), hl
    ld hl, ${ringY}
    ld (${host.cmdDy}), hl
    ld a, 8
    sub e
    ld l, a
    ld h, 0
    ld (${host.cmdNy}), hl
${host.runCopyAsm}
${p}_task_glyph_next:
    ld a, (${P}_COL)
    inc a
    ld (${P}_COL), a
    pop bc
    dec b
    jp nz, ${p}_task_glyph_loop
    ret
${p}_task_glyphs_done:
    pop bc
    jp ${p}_task_idle

${p}_task_idle:
    ld a, 4
    ld (${P}_PHASE), a
    ret
`;

  return [
    primitives,
    parts.vertical ? `${verticalMain}${verticalTasks}` : '',
    parts.marquee ? generateMarqueeRuntime(host) : '',
  ].join('');
}

/**
 * Per-node call data: the padded line strings plus the table. `labelPrefix`
 * must be unique per node. Lines are centred inside the 42-cell span.
 */
export function smoothScrollNodeData(labelPrefix: string, lines: string[], maxColumns: number): { tableLabel: string; dataAsm: string; totalPixels: number } {
  const tableLabel = `${labelPrefix}_lines`;
  const strings: string[] = [];
  const entries: string[] = [];
  lines.forEach((line, index) => {
    if (!line) {
      entries.push('0');
      return;
    }
    const padding = Math.max(0, maxColumns - line.length);
    const left = Math.floor(padding / 2);
    const text = `${' '.repeat(left)}${line}`.padEnd(maxColumns, ' ').slice(0, maxColumns);
    const label = `${labelPrefix}_l${index}`;
    const bytes = [...text].map(character => character.charCodeAt(0) & 0xff);
    bytes.push(0);
    strings.push(`${label}:   ; "${text.trim()}"\n    DB ${bytes.map(byte => hexByte(byte)).join(',')}`);
    entries.push(label);
  });
  const dataAsm = `${tableLabel}:
    DW ${[...entries, '#FFFF'].join(', ')}
${strings.join('\n')}
`;
  return { tableLabel, dataAsm, totalPixels: lines.length * SMOOTH_SCROLL_LINE_STEP };
}

/**
 * Glyph strip printed by the host on the main page before `<p>_run`: row 0 at
 * window top + 44 holds ASCII 32..73, row 1 (8 px lower) holds 74..90, each in
 * a 6-pixel cell starting at x = 0, drawn with the node's text colours.
 */
export function smoothScrollStripTexts(): { rows: string[]; firstRowY: (windowTop: number) => number } {
  const chars = Array.from({ length: FONT_GLYPHS }, (_, index) => String.fromCharCode(FONT_FIRST_CHAR + index));
  return {
    rows: [chars.slice(0, STRIP_CELLS).join(''), chars.slice(STRIP_CELLS).join('')],
    firstRowY: windowTop => windowTop + PARKED_ROWS,
  };
}


// ---------------------------------------------------------------------------
// Marquee: one text line running right to left.
// ---------------------------------------------------------------------------

export const MARQUEE_BAND_HEIGHT = 12;

/** Display row of the marquee band inside the scroll window. */
export function marqueeBandTop(windowTop: number, windowHeight: number): number {
  return windowTop + Math.floor(windowHeight / 2) - MARQUEE_BAND_HEIGHT / 2;
}

export function marqueeRamEquates(host: Screen5SmoothScrollHost): string {
  const p = `${host.prefix.toUpperCase()}M`;
  const at = (offset: number) => hexWord(host.ramBase + offset);
  return `; ---- marquee state (shares the smooth-scroll RAM block) ----
${p}_HS       EQU ${at(0)}    ; horizontal scroll in pixels (V9958)
${p}_ACC      EQU ${at(1)}
${p}_STEP     EQU ${at(2)}
${p}_NEXTX    EQU ${at(3)}    ; VRAM x of the next glyph cell (V9958 ring)
${p}_SLICE    EQU ${at(4)}    ; 2-pixel slice of the current glyph (V9938)
${p}_CHIP     EQU ${at(5)}    ; 0 = V9938, else V9958 (S#1 ID bits)
${p}_STR      EQU ${at(8)}    ; word: next character
${p}_R26      EQU ${at(10)}
${p}_R27      EQU ${at(11)}
${p}_REMAIN   EQU ${at(12)}   ; word: pixels left
`;
}

/**
 * Marquee runtime. Entry `<p>m_run`: HL = zero-terminated text, DE = pixels to
 * run (text width + 256), A = frames per 12 pixels (>= 12). The caller has
 * blanked the display and printed the glyph strip on the main page (same rows
 * as the vertical scroll); this routine moves it to the other page.
 *
 * V9958 (MSX2+): the band is a 256-pixel ring on the main page scrolled by
 * R#26/R#27 through the same raster split (R#25 MSK hides the 8-pixel seam
 * where the next glyph is drawn). V9938 (MSX2): no horizontal scroll register,
 * so the band is shifted left 2 pixels with one HMMM right after the raster has
 * left it, and a 2-pixel slice of the next glyph is copied in at the right edge.
 */
function generateMarqueeRuntime(host: Screen5SmoothScrollHost): string {
  const p = `${host.prefix}m`;
  const P = p.toUpperCase();
  const split = host.prefix; // shared primitives: <prefix>_vblank / _wait_line
  const di = host.interrupts ? '    di\n' : '';
  const ei = host.interrupts ? '    ei\n' : '';
  const mainY = host.mainPage * 256;
  const otherY = host.ringPage * 256;
  const top = host.windowTop;
  const height = host.windowHeight;
  const bandTop = marqueeBandTop(top, height);
  const bandAbs = mainY + bandTop;
  const glyphAbs = bandAbs + 2;
  const stripMain = mainY + top + PARKED_ROWS;

  const cmd = (fields: Record<string, string | number>, run: string): string => `${Object.entries(fields)
    .map(([field, value]) => `    ld hl, ${value}\n    ld (${field}), hl`).join('\n')}
${run}`;

  return `
; ------------------------------------------------------------
; FUNCTION: ${p}_run
; ------------------------------------------------------------
; PURPOSE:
;   Marquee: run a text line right to left across the scroll window
;   (band lines ${bandTop}..${bandTop + MARQUEE_BAND_HEIGHT - 1}). Detects the VDP: V9958 scrolls the band by
;   hardware (R#26/R#27 via raster split, 1 px per step), V9938 moves it with
;   HMMM (2 px per step).
;
; INPUT:
;   HL = zero-terminated text (font chars 32..90)
;   DE = pixels to run (text width + 256)
;   A  = frames per 12 pixels (>= 12)
;   ${host.bgVar} = background colour; glyph strip printed on page ${host.mainPage} rows
;   ${top + PARKED_ROWS}..${top + PARKED_ROWS + STRIP_ROWS - 1}; display blanked by the caller.
;
; OUTPUT:
;   None. Horizontal scroll registers back to 0, display on.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   ${split}_vblank, ${split}_wait_line, VDP command block
;
; SIDE EFFECTS:
;   Uses page ${host.ringPage} rows ${otherY}..${otherY + STRIP_ROWS - 1} for the glyph strip; clears the
;   window area of page ${host.mainPage}. R#25 MSK is set while the marquee runs (V9958).
; ------------------------------------------------------------
${p}_run:
    ld (${P}_STR), hl
    ld (${P}_REMAIN), de
    ld (${P}_STEP), a
    xor a
    ld (${P}_HS), a
    ld (${P}_ACC), a
    ld (${P}_SLICE), a
    ld (${P}_R26), a
    ld (${P}_R27), a
    ld a, 2
    ld (${P}_NEXTX), a
    ; VDP ID: S#1 bits 1..5 = 0 on V9938, 2 on V9958.
${di}    ld a, 1
    out (#99), a
    ld a, #8F
    out (#99), a
    in a, (#99)
    rrca
    and #1F
    ld (${P}_CHIP), a
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a
${ei}    ; Move the glyph strip to the hidden page, then clear the window.
${cmd({ [host.cmdSx]: 0, [host.cmdSy]: stripMain, [host.cmdDx]: 0, [host.cmdDy]: otherY, [host.cmdNx]: 256, [host.cmdNy]: STRIP_ROWS }, host.runCopyAsm)}
${cmd({ [host.cmdDx]: 0, [host.cmdDy]: mainY + top, [host.cmdNx]: 256, [host.cmdNy]: height }, `    ld a, (${host.bgVar})
    ${host.setFillColorCall}
${host.runFillAsm}`)}
    ld a, (${P}_CHIP)
    or a
    jp z, ${p}_run_ready
${di}    ld a, 2
    out (#99), a
    ld a, #99                 ; R#25 = MSK: hide the 8-pixel ring seam
    out (#99), a
${ei}    call ${p}_glyph           ; first cell at x = 2 (inside the masked seam)
${p}_run_ready:
${host.vblankKind === 'jiffy' ? `    ld a, (#FC9E)
    ld (${host.prefix.toUpperCase()}_JIF), a
` : ''}${host.displayOnAsm.trimEnd()}
${p}_frame:
    call ${split}_vblank
    ld h, #9A                 ; R#26
    ld l, 27                  ; R#27
    ld a, (${P}_R26)
    ld e, a
    ld a, (${P}_R27)
    ld d, a
    ld a, ${bandTop - SPLIT_LEAD}
    call ${split}_wait_line
    ld de, 0
    ld a, ${bandTop + MARQUEE_BAND_HEIGHT - SPLIT_LEAD}
    call ${split}_wait_line   ; the raster has left the band
${host.perFrameAsm ? `${host.perFrameAsm.trimEnd()}\n` : ''}    ; pacing: V9958 moves 1 px per STEP/12 frames, V9938 2 px per 2*STEP/12
    ld a, (${P}_STEP)
    ld c, a
    ld a, (${P}_CHIP)
    or a
    jp nz, ${p}_pace
    sla c
${p}_pace:
    ld a, (${P}_ACC)
    add a, ${SMOOTH_SCROLL_LINE_STEP}
    cp c
    jp c, ${p}_keep
    sub c
    ld (${P}_ACC), a
    ld a, (${P}_CHIP)
    or a
    jp z, ${p}_step_v9938
    ; ---- V9958: one pixel of hardware scroll ----
    ld a, (${P}_HS)
    inc a
    ld (${P}_HS), a
    ld b, a
    add a, 7
    rrca
    rrca
    rrca
    and #1F
    ld (${P}_R26), a
    add a, a
    add a, a
    add a, a
    sub b
    and 7
    ld (${P}_R27), a
    ld a, (${P}_NEXTX)
    sub 2
    cp b
    call z, ${p}_glyph
    ld hl, (${P}_REMAIN)
    dec hl
    jp ${p}_count
${p}_step_v9938:
    ; ---- V9938: shift the band 2 px left, copy the next 2-px glyph slice ----
${cmd({ [host.cmdSx]: 2, [host.cmdSy]: bandAbs, [host.cmdDx]: 0, [host.cmdDy]: bandAbs, [host.cmdNx]: 254, [host.cmdNy]: MARQUEE_BAND_HEIGHT }, host.runCopyAsm)}
    call ${p}_cell            ; HL = SX, DE = SY of the current glyph
    ld a, (${P}_SLICE)
    add a, a
    ld c, a
    ld b, 0
    add hl, bc
    ld (${host.cmdSx}), hl
    ld (${host.cmdSy}), de
${cmd({ [host.cmdDx]: 254, [host.cmdDy]: glyphAbs, [host.cmdNx]: 2, [host.cmdNy]: 8 }, host.runCopyAsm)}
    ld a, (${P}_SLICE)
    inc a
    cp 3
    jp c, ${p}_slice_ok
    call ${p}_advance
    xor a
${p}_slice_ok:
    ld (${P}_SLICE), a
    ld hl, (${P}_REMAIN)
    dec hl
    ld a, h
    or l
    jp z, ${p}_done
    dec hl
${p}_count:
    ld (${P}_REMAIN), hl
    ld a, h
    or l
    jp nz, ${p}_frame
    jp ${p}_done
${p}_keep:
    ld (${P}_ACC), a
    jp ${p}_frame
${p}_done:
    call ${split}_vblank
${di}    xor a
    out (#99), a
    ld a, #99                 ; R#25 = 0
    out (#99), a
    xor a
    out (#99), a
    ld a, #9A                 ; R#26 = 0
    out (#99), a
    xor a
    out (#99), a
    ld a, #9B                 ; R#27 = 0
    out (#99), a
${ei}    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_cell
; ------------------------------------------------------------
; PURPOSE:
;   Strip coordinates of the current character (a space once the text ended).
;
; INPUT:
;   ${P}_STR.
;
; OUTPUT:
;   HL = SX, DE = SY (absolute) of the 6x8 glyph cell.
;
; DESTROYS:
;   AF, BC
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   None.
; ------------------------------------------------------------
${p}_cell:
    ld hl, (${P}_STR)
    ld a, (hl)
    or a
    jp nz, ${p}_cell_char
    ld a, ${FONT_FIRST_CHAR}
${p}_cell_char:
    sub ${FONT_FIRST_CHAR}
    jp c, ${p}_cell_space
    cp ${FONT_GLYPHS}
    jp c, ${p}_cell_ok
${p}_cell_space:
    xor a
${p}_cell_ok:
    ld de, ${otherY}
    cp ${STRIP_CELLS}
    jp c, ${p}_cell_row0
    sub ${STRIP_CELLS}
    ld de, ${otherY + 8}
${p}_cell_row0:
    ld l, a
    ld h, 0
    add hl, hl
    ld c, l
    ld b, h
    add hl, hl
    add hl, bc
    ret

; ${p}_advance: move ${P}_STR to the next character (stays on the terminator).
${p}_advance:
    ld hl, (${P}_STR)
    ld a, (hl)
    or a
    ret z
    inc hl
    ld (${P}_STR), hl
    ret

; ------------------------------------------------------------
; FUNCTION: ${p}_glyph
; ------------------------------------------------------------
; PURPOSE:
;   V9958 ring: copy the current glyph (with its background) to x = NEXTX of
;   the band, splitting the copy when the 6-pixel cell crosses x = 256, then
;   advance NEXTX by 6 and the text pointer by one.
;
; INPUT:
;   ${P}_STR, ${P}_NEXTX.
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
;   ${p}_cell, ${p}_advance, VDP command block
;
; SIDE EFFECTS:
;   Writes the band on page ${host.mainPage}.
; ------------------------------------------------------------
${p}_glyph:
    call ${p}_cell
    ld (${host.cmdSx}), hl
    ld (${host.cmdSy}), de
    ld a, (${P}_NEXTX)
    ld l, a
    ld h, 0
    ld (${host.cmdDx}), hl
${cmd({ [host.cmdDy]: glyphAbs, [host.cmdNy]: 8 }, '')}
    ld a, (${P}_NEXTX)
    cp ${256 - 6 + 1}
    jp nc, ${p}_glyph_split
    ld hl, 6
    ld (${host.cmdNx}), hl
${host.runCopyAsm}
    jp ${p}_glyph_next
${p}_glyph_split:
    neg                       ; A = 256 - NEXTX (2 or 4)
    ld l, a
    ld h, 0
    ld (${host.cmdNx}), hl
    push hl
${host.runCopyAsm}
    pop bc
    ld hl, (${host.cmdSx})
    add hl, bc
    ld (${host.cmdSx}), hl
    ld hl, 0
    ld (${host.cmdDx}), hl
    ld hl, 6
    or a
    sbc hl, bc
    ld (${host.cmdNx}), hl
    ld hl, ${glyphAbs}
    ld (${host.cmdDy}), hl
${host.runCopyAsm}
${p}_glyph_next:
    ld a, (${P}_NEXTX)
    add a, 6
    ld (${P}_NEXTX), a
    jp ${p}_advance
`;
}

/** Marquee text: all wrapped lines joined with three spaces. */
export function marqueeNodeData(labelPrefix: string, lines: string[]): { textLabel: string; dataAsm: string; totalPixels: number } {
  const text = lines.filter(Boolean).join('   ');
  const bytes = [...text].map(character => character.charCodeAt(0) & 0xff);
  bytes.push(0);
  const rows: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    rows.push(`    DB ${bytes.slice(offset, offset + 16).map(byte => hexByte(byte)).join(',')}`);
  }
  const textLabel = `${labelPrefix}_text`;
  return {
    textLabel,
    dataAsm: `${textLabel}:\n${rows.join('\n')}\n`,
    totalPixels: text.length * 6 + 256,
  };
}
