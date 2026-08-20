/**
 * SCREEN 5 bitmap-atlas animation.
 *
 * This is deliberately separate from character/tile-table animation: SCREEN 5
 * rooms keep their 16x16 tile map and the atlas is already resident in VRAM.
 * Each animation set advances one shared phase, and the runtime HMMMs only the
 * painted cells whose frame changed. A room with many copies of one lamp thus
 * pays one tiny state update per frame plus one 16x16 bitmap copy per lamp only
 * at the configured interval (60 frames is roughly one second at 60 Hz).
 */

const TILE_SIZE = 16;
const ROOM_CELL_COUNT = 16 * 12;
const FRAME_MAX = 8;
const SET_STRIDE = 2 + FRAME_MAX * 3;
const STATE_STRIDE = 2;

export const MSX2_BITMAP_ATLAS_ANIMATION_SPEED_MIN = 1;
export const MSX2_BITMAP_ATLAS_ANIMATION_SPEED_MAX = 255;
export const MSX2_BITMAP_ATLAS_ANIMATION_SPEED_DEFAULT = 60;
export const MSX2_BITMAP_ATLAS_ANIMATION_MAX_FRAMES = FRAME_MAX;
export const MSX2_BITMAP_ATLAS_ANIMATION_MAX_SETS = 255;
/** Four launches are still a small fraction of a 60 Hz frame on V9938. */
export const MSX2_BITMAP_ATLAS_ANIMATION_DRAWS_PER_FRAME = 4;

function asmByte(value: number): string {
  return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}
function asmWord(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, Math.floor(value))).toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapAtlasAnimationCell {
  /** Room cell index, row * 16 + column (0..191). */
  cell: number;
  /** Index into the global animation-set table. */
  set: number;
}

export interface BitmapAtlasAnimationFrameSource {
  /** Absolute VRAM X of the 16x16 atlas source. */
  sx: number;
  /** Absolute VRAM Y of the 16x16 atlas source. */
  sy: number;
}

export interface BitmapAtlasAnimationSet {
  /** Frames between changes at 60 Hz. */
  speed: number;
  /** Ordered atlas sources. Frame zero is the painted/base tile. */
  frames: BitmapAtlasAnimationFrameSource[];
}

export interface BitmapAtlasAnimationOptions {
  /** RAM base from the linked-HUD chain. */
  ramBase: number;
  /** Animated cells per room, in room order. */
  roomCells: BitmapAtlasAnimationCell[][];
  /** Global animation sets indexed by BitmapAtlasAnimationCell.set. */
  sets: BitmapAtlasAnimationSet[];
  /** HUD band offset added to bitmap Y (BITMAP_ROOM_GAME_Y_OFFSET). */
  gameYOffset: number;
  /** Optional dialogue/perception pause gates. */
  pauseGateAsm?: string;
  /** Optional dark-room repaint after an opaque HMMM. */
  dimRepaintCallAsm?: string;
}

export interface BitmapAtlasAnimationSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  initAsm: string;
  mainLoopCall: string;
  initialDrawCall: string;
  pendingPageDrawCall: string;
  routinesAsm: string;
  dataAsm: string;
}

const DISABLED: BitmapAtlasAnimationSystemAsm = {
  enabled: false,
  ramBytes: 0,
  equates: '',
  initAsm: '',
  mainLoopCall: '',
  initialDrawCall: '',
  pendingPageDrawCall: '',
  routinesAsm: '',
  dataAsm: '',
};

export function bitmapAtlasAnimationCellCount(roomCells: BitmapAtlasAnimationCell[][]): number {
  return roomCells.reduce((total, cells) => total + cells.length, 0);
}

/** Build the complete runtime/data block, or no-op when no room uses it. */
export function buildBitmapAtlasAnimationSystemAsm(opts: BitmapAtlasAnimationOptions): BitmapAtlasAnimationSystemAsm {
  if (bitmapAtlasAnimationCellCount(opts.roomCells) === 0 || opts.sets.length === 0) return DISABLED;

  const setCount = Math.min(MSX2_BITMAP_ATLAS_ANIMATION_MAX_SETS, opts.sets.length);
  const base = opts.ramBase;
  const pageAddr = base;
  const cellAddr = base + 1;
  const setAddr = base + 2;
  const wantAddr = base + 3;
  const budgetAddr = base + 4;
  const drawnAddr = base + 5;
  const stateAddr = drawnAddr + ROOM_CELL_COUNT;
  const ramBytes = (stateAddr - base) + setCount * STATE_STRIDE;
  const dimRepaintCall = opts.dimRepaintCallAsm || '';
  const gameYOffset = asmByte(opts.gameYOffset);
  const advanceSetTable = Array(SET_STRIDE).fill('    inc de').join('\n');

  const equates = `; --- BITMAP ATLAS ANIMATION RAM (${ramBytes} bytes at ${asmWord(base)}) ---
; ${bitmapAtlasAnimationCellCount(opts.roomCells)} painted cell(s), ${setCount} shared frame set(s).
; The room tile map remains on frame zero; this is a cosmetic opaque HMMM overlay.
bitmap_atlas_anim_page       EQU ${asmWord(pageAddr)}
bitmap_atlas_anim_cell       EQU ${asmWord(cellAddr)}
bitmap_atlas_anim_set        EQU ${asmWord(setAddr)}
bitmap_atlas_anim_want       EQU ${asmWord(wantAddr)}
bitmap_atlas_anim_budget     EQU ${asmWord(budgetAddr)}
bitmap_atlas_anim_drawn      EQU ${asmWord(drawnAddr)}
bitmap_atlas_anim_state      EQU ${asmWord(stateAddr)}
bitmap_atlas_anim_cmd_block  EQU #C2C0
`;

  const initAsm = `    ; bitmap atlas animation: phase starts at frame zero; composition paints it.
    xor a
    ld (bitmap_atlas_anim_page), a
    ld (bitmap_atlas_anim_cell), a
    ld (bitmap_atlas_anim_set), a
    ld (bitmap_atlas_anim_want), a
    ld (bitmap_atlas_anim_budget), a
    call bitmap_atlas_anim_clear_drawn
    call bitmap_atlas_anim_clear_state
`;

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_clear_drawn
; ------------------------------------------------------------
; Mark every room cell dirty. The next update paints the current phase on the
; newly composed page, while unanimated cells remain untouched.
bitmap_atlas_anim_clear_drawn:
    ld hl, bitmap_atlas_anim_drawn
    ld b, ${ROOM_CELL_COUNT}
.bad_clear_loop:
    ld (hl), #FF
    inc hl
    djnz .bad_clear_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_clear_state
; ------------------------------------------------------------
; State record = current frame, timer. The phase is global per animation set,
; not per painted cell, so multiple lights using one tile stay synchronized.
bitmap_atlas_anim_clear_state:
    ld hl, bitmap_atlas_anim_state
    ld b, ${setCount}
.bas_clear_loop:
    xor a
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    djnz .bas_clear_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_reset_visible / _pending
; ------------------------------------------------------------
bitmap_atlas_anim_reset_visible:
    ld a, (bitmap_displayed_page)
    jp bitmap_atlas_anim_reset_page
bitmap_atlas_anim_reset_pending:
    ld a, (bitmap_pending_display_page)
bitmap_atlas_anim_reset_page:
    ld (bitmap_atlas_anim_page), a
    jp bitmap_atlas_anim_clear_drawn

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_set_ptr
; ------------------------------------------------------------
; INPUT A = set index. OUTPUT HL = set table + A * ${SET_STRIDE}.
bitmap_atlas_anim_set_ptr:
    ld l, a
    ld h, 0
    add hl, hl                  ; 2n
    ld e, l
    ld d, h                     ; DE = 2n
    add hl, hl                  ; 4n
    add hl, hl                  ; 8n
    add hl, hl                  ; 16n
    add hl, de                  ; 18n
    add hl, de                  ; 20n
    add hl, de                  ; 22n
    add hl, de                  ; 24n
    add hl, de                  ; 26n
    ld de, bitmap_atlas_anim_set_table
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_state_ptr
; ------------------------------------------------------------
; INPUT A = set index. OUTPUT HL = state table + A * 2.
bitmap_atlas_anim_state_ptr:
    ld l, a
    ld h, 0
    add hl, hl
    ld de, bitmap_atlas_anim_state
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_tick_states
; ------------------------------------------------------------
; Advance each set's timer/frame. No division or multiplication is needed in
; the main loop: every cell reads the already updated one-byte frame index.
bitmap_atlas_anim_tick_states:
    ld hl, bitmap_atlas_anim_state
    ld de, bitmap_atlas_anim_set_table
    ld b, ${setCount}
.bats_loop:
    inc hl
    ld a, (hl)                  ; timer + 1
    inc a
    ld c, a
    dec hl
    ld a, (de)                  ; speed
    cp c
    jr c, .bats_advance
    jr z, .bats_advance
    inc hl
    ld a, c
    ld (hl), a
    dec hl
    jr .bats_next
.bats_advance:
    inc hl
    xor a
    ld (hl), a                  ; timer = 0
    dec hl
    ld a, (hl)                  ; current frame + 1
    inc a
    ld c, a
    inc de
    ld a, (de)                  ; frame count
    cp c
    jr c, .bats_wrap
    jr z, .bats_wrap
    ld a, c
    jr .bats_store_frame
.bats_wrap:
    xor a
.bats_store_frame:
    ld (hl), a
    dec de
.bats_next:
    inc hl
    inc hl
${advanceSetTable}
    djnz .bats_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_draw
; ------------------------------------------------------------
; Uses bitmap_atlas_anim_cell, _set and _want to HMMM one 16x16 frame.
bitmap_atlas_anim_draw:
    ld a, (bitmap_atlas_anim_set)
    call bitmap_atlas_anim_set_ptr
    inc hl
    inc hl                      ; HL = first frame source
    ld a, (bitmap_atlas_anim_want)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    add hl, de                  ; frame * 3 = sx, syLo, syHi
    ld de, bitmap_atlas_anim_cmd_block
    ld a, (hl)
    ld (de), a                  ; SX low
    inc de
    xor a
    ld (de), a                  ; SX high
    inc de
    inc hl
    ld a, (hl)
    ld (de), a                  ; SY low
    inc de
    inc hl
    ld a, (hl)
    ld (de), a                  ; SY high
    inc de
    ld a, (bitmap_atlas_anim_cell)
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld (de), a                  ; DX low
    inc de
    xor a
    ld (de), a                  ; DX high
    inc de
    ld a, (bitmap_atlas_anim_cell)
    and #F0
    add a, ${gameYOffset}
    ld (de), a                  ; DY low
    inc de
    ld a, (bitmap_atlas_anim_page)
    ld (de), a                  ; DY high
    inc de
    ld a, ${TILE_SIZE}
    ld (de), a                  ; NX low
    inc de
    xor a
    ld (de), a                  ; NX high
    inc de
    ld a, ${TILE_SIZE}
    ld (de), a                  ; NY low
    inc de
    xor a
    ld (de), a                  ; NY high
    inc de
    ld (de), a                  ; CLR
    inc de
    ld (de), a                  ; ARG
    inc de
    ld a, #D0
    ld (de), a                  ; CMD = HMMM
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_atlas_anim_cmd_block
    ld b, 15
.baad_launch:
    ld a, (hl)
    out (VDP_CMD_PORT), a
    inc hl
    djnz .baad_launch
${dimRepaintCall}    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_atlas_anim_update
; ------------------------------------------------------------
; Update the shared phases, then redraw dirty painted cells on the displayed
; page. The draw budget avoids queueing a long burst of opaque HMMMs in one tick.
bitmap_atlas_anim_update:
    ld a, (bitmap_composition_state)
    or a
    ret nz
${opts.pauseGateAsm || ''}    ld a, (bitmap_displayed_page)
    ld (bitmap_atlas_anim_page), a
    call bitmap_atlas_anim_tick_states
    ld a, ${MSX2_BITMAP_ATLAS_ANIMATION_DRAWS_PER_FRAME}
    ld (bitmap_atlas_anim_budget), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_atlas_anim_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld hl, bitmap_atlas_anim_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.ba_update_loop:
    ld a, (hl)
    inc hl
    ld (bitmap_atlas_anim_cell), a
    ld a, (hl)
    inc hl
    ld (bitmap_atlas_anim_set), a
    push hl
    ld a, (bitmap_atlas_anim_set)
    call bitmap_atlas_anim_state_ptr
    ld a, (hl)
    ld (bitmap_atlas_anim_want), a
    pop hl
    push hl
    ld a, (bitmap_atlas_anim_cell)
    ld e, a
    ld d, 0
    ld hl, bitmap_atlas_anim_drawn
    add hl, de
    ld a, (hl)
    ld c, a
    ld a, (bitmap_atlas_anim_want)
    cp c
    jr z, .ba_already_drawn
    ld a, (bitmap_atlas_anim_budget)
    or a
    jr z, .ba_budget_done
    dec a
    ld (bitmap_atlas_anim_budget), a
    push bc
    call bitmap_atlas_anim_draw
    pop bc
    push hl
    ld a, (bitmap_atlas_anim_cell)
    ld e, a
    ld d, 0
    ld hl, bitmap_atlas_anim_drawn
    add hl, de
    ld a, (bitmap_atlas_anim_want)
    ld (hl), a
    pop hl
.ba_already_drawn:
.ba_budget_done:
    pop hl
    djnz .ba_update_loop
    ret
`;

  const formatBytes = (label: string, bytes: number[], comment: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    if (bytes.length === 0) {
      lines.push('    DB #00');
    } else {
      for (let i = 0; i < bytes.length; i += 16) {
        lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b)).join(',')}`);
      }
    }
    return `${lines.join('\n')}\n`;
  };

  const recordRows = opts.roomCells.map((cells, roomIndex) => formatBytes(
    `bitmap_atlas_anim_room_${roomIndex}`,
    cells.flatMap(item => [item.cell & 0xff, item.set & 0xff]),
    `Room ${roomIndex} animated cells: cell index, animation set index`,
  )).join('');

  const setBytes = opts.sets.slice(0, setCount).flatMap(set => {
    const frames = set.frames.slice(0, FRAME_MAX);
    const frameBytes = frames.flatMap(frame => [
      frame.sx & 0xff,
      frame.sy & 0xff,
      (frame.sy >> 8) & 0xff,
    ]);
    while (frameBytes.length < FRAME_MAX * 3) frameBytes.push(0);
    return [
      Math.max(MSX2_BITMAP_ATLAS_ANIMATION_SPEED_MIN, Math.min(MSX2_BITMAP_ATLAS_ANIMATION_SPEED_MAX, Math.floor(set.speed))) & 0xff,
      Math.max(1, Math.min(FRAME_MAX, frames.length)) & 0xff,
      ...frameBytes,
    ];
  });

  const dataAsm = `${recordRows}bitmap_atlas_anim_ptr_table:
${opts.roomCells.map((_cells, index) => `    DW bitmap_atlas_anim_room_${index}`).join('\n')}
bitmap_atlas_anim_count_table:
    DB ${opts.roomCells.map(cells => cells.length & 0xff).join(',')}
${formatBytes(
    'bitmap_atlas_anim_set_table',
    setBytes,
    `Bitmap atlas animation sets (${SET_STRIDE} bytes each): speed, frame count, then ${FRAME_MAX} ` +
    'frames as sx, syLow, syHigh (absolute VRAM atlas sources)',
  )}`;

  return {
    enabled: true,
    ramBytes,
    equates,
    initAsm,
    mainLoopCall: '    call bitmap_atlas_anim_update\n',
    initialDrawCall: '    call bitmap_atlas_anim_reset_visible   ; paint frame zero on room load\n',
    pendingPageDrawCall: '    call bitmap_atlas_anim_reset_pending    ; invalidate hidden page\n',
    routinesAsm,
    dataAsm,
  };
}
