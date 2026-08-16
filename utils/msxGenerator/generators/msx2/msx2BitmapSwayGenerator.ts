/**
 * SCREEN 5 bitmap-room GRASS SWAY — el contorno que reacciona al paso del player.
 *
 * An atlas tile marked "Se mueve al pasar" names two extra atlas tiles: the same
 * grass bent LEFT and bent RIGHT. Every room cell painted with the rest tile is
 * compiled into a per-room record list; while the player body overlaps such a
 * cell the engine HMMMs the bent frame that matches the player facing over it,
 * and `holdFrames` after the player stops touching it the rest frame is HMMMed
 * back. Walking through a patch therefore parts it and lets it spring closed.
 *
 * PURELY COSMETIC. The collision and behavior maps are never touched, so the
 * bent frames must be drawn on the same silhouette as the rest frame if the
 * cell is solid — the player will keep colliding with the rest shape.
 *
 * LIKE the crumbling floor and UNLIKE destroy_tile, the state is TEMPORARY and
 * per-room: the pool is wiped on every room (re)composition, and since rooms are
 * always rebuilt from the atlas, forgetting the state IS the reset — the grass
 * is upright again when you come back.
 *
 * HMMM IS OPAQUE. It copies the whole 16x16 rectangle, there is no transparency,
 * so each bent frame must be authored with the background already baked into it.
 * Grass over two different backgrounds needs two sets of frames.
 *
 * Cost: one 16x16 HMMM is 128 bytes of VRAM (~0.73 ms) and runs asynchronously on
 * the V9938 command engine. The CPU only pays `vdp_wait_cmd_ready` when two draws
 * land in the same frame, so the draws are budgeted (SWAY_DRAWS_PER_FRAME) and any
 * excess simply slides to the next frame — invisible at 60 fps and it keeps the
 * player budget intact.
 *
 * RAM (44 + the body-sample scratch, at `ramBase`, from the linked-HUD chain):
 *   +0  page    target page for the sway draws (0/1)
 *   +1  cell    scratch: cell index being tested
 *   +2  set     scratch: sway set of that cell
 *   +3  budget  draws left this frame
 *   +4  cols    deduplicated body columns, #FF-terminated
 *   +.  cells   the cells the body overlaps (cols x rows), #FF-terminated
 *   +.  pool    8 slots x 5 bytes (cell | #FF free, set, want, drawn, timer)
 *
 * The body sample is sized from the player hitbox, NOT fixed at the four corners:
 * a 32px-tall body straddles THREE cell rows, and sampling only its top and bottom
 * would walk straight through the middle row without bending anything.
 *
 * `want` / `drawn` are frame indices: 0 = rest, 1 = bent left, 2 = bent right.
 * A slot is released once it has drawn its way back to rest.
 */

/** Cells that can be bent at once. A body spans at most 4, the rest are springing back. */
const SWAY_POOL_SLOTS = 8;
const SWAY_POOL_STRIDE = 5;
/**
 * HMMM launches allowed per frame. Each extra launch costs the CPU one
 * `vdp_wait_cmd_ready` on the previous 16x16 copy (~0.73 ms), so 2 caps the
 * worst case at ~4% of a frame. Slots over budget redraw on the next frame.
 */
const SWAY_DRAWS_PER_FRAME = 2;
/** Frame indices inside a sway set. */
const SWAY_FRAME_REST = 0;
const SWAY_FRAME_LEFT = 1;
const SWAY_FRAME_RIGHT = 2;
/** Bytes per sway set in ROM: hold + 3 frames x (sx, syLo, syHi). */
const SWAY_SET_STRIDE = 10;
const TILE_SIZE = 16;

const COLS_OFFSET = 4;

/**
 * Pixel offsets inside the hitbox at which a cell row/column must be sampled:
 * every 16px step plus the far edge, so a body of any size hits every cell row
 * and column it actually overlaps (16px body -> 2 samples, 32px body -> 3).
 */
function sampleOffsets(start: number, end: number): number[] {
  const list: number[] = [];
  for (let value = start; value < end; value += TILE_SIZE) list.push(value);
  list.push(end);
  return Array.from(new Set(list)).sort((a, b) => a - b);
}

export const MSX2_BITMAP_SWAY_HOLD_MIN = 2;
export const MSX2_BITMAP_SWAY_HOLD_MAX = 60;
export const MSX2_BITMAP_SWAY_HOLD_DEFAULT = 8;
/** The set index is one byte in the per-cell record. */
export const MSX2_BITMAP_SWAY_MAX_SETS = 256;

function asmByte(value: number): string {
  return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, Math.floor(value))).toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapSwayPlayerHitbox { x: number; y: number; w: number; h: number; }

/** One swaying cell: where it is and which set of three frames it animates with. */
export interface BitmapSwayCell {
  /** Collision cell index, row * 16 + col (0..191). */
  cell: number;
  /** Index into the global sway set table. */
  set: number;
}

/**
 * One grass variant: the three atlas frames plus how long the bend is held.
 * The VRAM source coordinates are already absolute (atlas base applied), which
 * is why SY needs two bytes — the atlas lives at Y >= 512.
 */
export interface BitmapSwaySet {
  holdFrames: number;
  restSx: number;
  restSy: number;
  leftSx: number;
  leftSy: number;
  rightSx: number;
  rightSy: number;
}

export interface BitmapSwayOptions {
  /** RAM base from the linked-HUD chain. */
  ramBase: number;
  hitbox: BitmapSwayPlayerHitbox;
  /** HUD band offset added to bitmap Y (BITMAP_ROOM_GAME_Y_OFFSET). */
  gameYOffset: number;
  /** Swaying cells per room, in room order (empty arrays for plain rooms). */
  roomCells: BitmapSwayCell[][];
  /** Global frame sets, indexed by BitmapSwayCell.set. */
  sets: BitmapSwaySet[];
  /** Extra `ret`-style gates (NPC dialogue / perception freeze), like the other systems. */
  pauseGateAsm?: string;
  /**
   * Tail call after a launched command in a dark room (BITMAP_LIGHT_DIM_CMD_CALL),
   * empty when the project has no dark room. The blit paints with the LIT palette;
   * this brings it down to the room light level and gives the halo back.
   */
  dimRepaintCallAsm?: string;
}

export interface BitmapSwaySystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /** RAM-only boot clear; safe inside the linked-HUD init block. */
  initAsm: string;
  mainLoopCall: string;
  initialDrawCall: string;
  pendingPageDrawCall: string;
  routinesAsm: string;
  dataAsm: string;
}

const DISABLED: BitmapSwaySystemAsm = {
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

export function bitmapSwayCellCount(roomCells: BitmapSwayCell[][]): number {
  return roomCells.reduce((total, cells) => total + cells.length, 0);
}

/**
 * Build the whole grass-sway system. Returns the DISABLED shape (all empty
 * strings, 0 RAM) when no room has a swaying cell, so projects that do not use
 * it generate a byte-identical ROM.
 */
export function buildBitmapSwaySystemAsm(opts: BitmapSwayOptions): BitmapSwaySystemAsm {
  if (bitmapSwayCellCount(opts.roomCells) === 0 || opts.sets.length === 0) return DISABLED;

  // Where the body has to be sampled. A 16px hitbox yields 2 rows x 2 columns
  // (the classic corner test); a 32px-tall one yields 3 rows, and the middle row
  // is exactly the one a naive corner test would walk through untouched.
  const hbLeft = opts.hitbox.x;
  const hbRight = opts.hitbox.x + opts.hitbox.w - 1;
  const hbTop = opts.hitbox.y;
  const hbBottom = opts.hitbox.y + opts.hitbox.h - 1;
  const colOffsets = sampleOffsets(hbLeft, hbRight);
  const rowOffsets = sampleOffsets(hbTop, hbBottom);
  // Both scratch buffers are #FF-terminated, so the runtime walks them without
  // carrying a count and duplicate rows/columns simply shorten the list.
  const colsBytes = colOffsets.length + 1;
  const cellsBytes = colOffsets.length * rowOffsets.length + 1;

  const base = opts.ramBase;
  const pageAddr = base;
  const cellAddr = base + 1;
  const setAddr = base + 2;
  const budgetAddr = base + 3;
  const colsAddr = base + COLS_OFFSET;
  const cellsAddr = colsAddr + colsBytes;
  const poolAddr = cellsAddr + cellsBytes;
  const ramBytes = (poolAddr - base) + SWAY_POOL_SLOTS * SWAY_POOL_STRIDE;
  const gameYOffset = asmByte(opts.gameYOffset);
  const dimRepaintCall = opts.dimRepaintCallAsm || '';

  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');

  const equates = `; --- GRASS SWAY RAM (${ramBytes} bytes at ${asmWord(base)}) ---
; ${bitmapSwayCellCount(opts.roomCells)} swaying cell(s) over ${opts.sets.length} frame set(s). Cosmetic only:
; the collision/behavior maps are never touched. State is per-room and TEMPORARY:
; every room (re)composition wipes the pool, which is what stands the grass back up.
bitmap_sway_page       EQU ${asmWord(pageAddr)}
bitmap_sway_cell       EQU ${asmWord(cellAddr)}
bitmap_sway_set        EQU ${asmWord(setAddr)}
bitmap_sway_budget     EQU ${asmWord(budgetAddr)}
; Body sample scratch, both #FF-terminated: ${colOffsets.length} column(s) x ${rowOffsets.length} row(s) for a
; ${opts.hitbox.w}x${opts.hitbox.h} hitbox.
bitmap_sway_cols       EQU ${asmWord(colsAddr)}
bitmap_sway_cells      EQU ${asmWord(cellsAddr)}
bitmap_sway_pool       EQU ${asmWord(poolAddr)}
; Shared 15-byte command scratch (gems / crumble / destroy_tile use it too: every
; launch in this engine is sequential inside the main loop).
bitmap_sway_cmd_block  EQU #C2C0
`;

  const initAsm = `    ; grass sway: no page yet, empty pool (#FF = free slot).
    xor a
    ld (bitmap_sway_page), a
    ld (bitmap_sway_cell), a
    ld (bitmap_sway_set), a
    ld (bitmap_sway_budget), a
    call bitmap_sway_clear_pool
`;

  const ixAdvance = Array(SWAY_POOL_STRIDE).fill('    inc ix').join('\n');

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_sway_clear_pool
; ------------------------------------------------------------
; PURPOSE:
;   Forget every bent cell (slot cell = #FF). This is the reset: the room
;   composition repaints the pristine upright tiles and the runtime no longer
;   remembers any bend.
;
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_sway_clear_pool:
    ld hl, bitmap_sway_pool
    ld b, ${SWAY_POOL_SLOTS}
.scp_loop:
    ld (hl), #FF                ; free slot
    inc hl
    ld (hl), 0                  ; set
    inc hl
    ld (hl), 0                  ; want
    inc hl
    ld (hl), 0                  ; drawn
    inc hl
    ld (hl), 0                  ; timer
    inc hl
    djnz .scp_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_reset_visible / bitmap_sway_reset_pending
; ------------------------------------------------------------
; PURPOSE:
;   Room (re)composition hook: latch the page the sway must draw on and drop all
;   bend state. Called at boot / room load with the visible page and from
;   commit_room_flip with the hidden page. Without the pending-page variant a
;   bend drawn before a flip would land on the page about to be discarded.
;
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_sway_reset_visible:
    ld a, (bitmap_displayed_page)
    jp bitmap_sway_reset_page
bitmap_sway_reset_pending:
    ld a, (bitmap_pending_display_page)
bitmap_sway_reset_page:
    ld (bitmap_sway_page), a
    jp bitmap_sway_clear_pool

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_set_ptr
; ------------------------------------------------------------
; PURPOSE:
;   Address the ${SWAY_SET_STRIDE}-byte record of sway set A.
;
; INPUT: A = set index.
; OUTPUT: HL = bitmap_sway_set_table + A * ${SWAY_SET_STRIDE}.
; DESTROYS: AF, DE, HL.  PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_sway_set_ptr:
    ld l, a
    ld h, 0
    add hl, hl                  ; *2
    ld e, l
    ld d, h
    add hl, hl                  ; *4
    add hl, hl                  ; *8
    add hl, de                  ; *10
    ld de, bitmap_sway_set_table
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_find_set
; ------------------------------------------------------------
; PURPOSE:
;   Look up bitmap_sway_cell in the current room's swaying-cell list.
;
; OUTPUT: CARRY + A = sway set index when the cell sways; NC when it does not.
;   The carry (not Z) carries the answer because set 0 is a perfectly valid set.
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_sway_find_set:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_sway_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z                       ; no swaying cell in this room (NC)
    ld hl, bitmap_sway_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                     ; HL = first record of the room
    ld a, (bitmap_sway_cell)
    ld c, a                     ; C = wanted cell
.sfs_loop:
    ld a, (hl)
    inc hl
    cp c
    jp z, .sfs_hit
    inc hl                      ; skip the set byte
    djnz .sfs_loop
    xor a                       ; not a swaying cell (NC)
    ret
.sfs_hit:
    ld a, (hl)                  ; A = sway set index
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_slot_for_cell
; ------------------------------------------------------------
; PURPOSE:
;   Find the pool slot tracking cell A, claiming a free one on first contact.
;
; INPUT: A = cell index.
; OUTPUT: IX = slot (NZ). Z when the pool is full (the cell just does not bend).
; DESTROYS: AF, B, IX.  PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_sway_slot_for_cell:
    ld ix, bitmap_sway_pool
    ld b, ${SWAY_POOL_SLOTS}
.ssfc_find:
    cp (ix+0)
    jp z, .ssfc_hit
${ixAdvance}
    djnz .ssfc_find
    push af                     ; keep the wanted cell while scanning for a free slot
    ld ix, bitmap_sway_pool
    ld b, ${SWAY_POOL_SLOTS}
.ssfc_free:
    ld a, (ix+0)
    cp #FF
    jp z, .ssfc_new
${ixAdvance}
    djnz .ssfc_free
    pop af
    xor a                       ; pool full (Z): skip this cell
    ret
.ssfc_new:
    pop af
    ld (ix+0), a                ; claim the slot
    xor a
    ld (ix+2), a                ; want  = rest
    ld (ix+3), a                ; drawn = rest (composition painted it upright)
    ld (ix+4), a                ; timer
.ssfc_hit:
    ld a, 1
    or a                        ; NZ
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_draw
; ------------------------------------------------------------
; PURPOSE:
;   Blit frame (ix+2) of set (ix+1) over cell (ix+0): a 16x16 HMMM from the atlas
;   region of that frame onto the cell, on page bitmap_sway_page.
;
; INPUT: IX = pool slot.
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; SIDE EFFECTS: waits for the previous VDP command; restores R#15 = S#0.
; ------------------------------------------------------------
bitmap_sway_draw:
    ld a, (ix+1)
    call bitmap_sway_set_ptr
    inc hl                      ; skip the hold byte
    ld a, (ix+2)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    add hl, de                  ; HL = (sx, syLo, syHi) of the wanted frame
    ld de, bitmap_sway_cmd_block
    ld a, (hl)
    ld (de), a                  ; SX low
    inc de
    xor a
    ld (de), a                  ; SX high (the atlas is never wider than 256 px)
    inc de
    inc hl
    ld a, (hl)
    ld (de), a                  ; SY low
    inc de
    inc hl
    ld a, (hl)
    ld (de), a                  ; SY high (the atlas lives at VRAM Y >= 512)
    inc de
    ld a, (ix+0)
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld (de), a                  ; DX low = col * 16
    inc de
    xor a
    ld (de), a                  ; DX high
    inc de
    ld a, (ix+0)
    and #F0                     ; row * 16
    add a, ${gameYOffset}
    ld (de), a                  ; DY low
    inc de
    ld a, (bitmap_sway_page)
    ld (de), a                  ; DY high = page (0 -> Y 0..255, 1 -> Y 256..511)
    inc de
    ld a, ${TILE_SIZE}
    ld (de), a                  ; NX low = ${TILE_SIZE}
    inc de
    xor a
    ld (de), a                  ; NX high
    inc de
    ld a, ${TILE_SIZE}
    ld (de), a                  ; NY low = ${TILE_SIZE}
    inc de
    xor a
    ld (de), a                  ; NY high
    inc de
    ld (de), a                  ; CLR (unused by HMMM)
    inc de
    ld (de), a                  ; ARG = 0 (left->right, top->bottom)
    inc de
    ld a, #D0
    ld (de), a                  ; CMD = HMMM
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_sway_cmd_block
    ld b, 15
.sdw_launch:
    ld a, (hl)
    out (VDP_CMD_PORT), a
    inc hl
    djnz .sdw_launch
${dimRepaintCall}    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_touch_cell
; ------------------------------------------------------------
; PURPOSE:
;   The player body is inside cell A this frame: if it is grass, bend it towards
;   the way the player is looking and re-arm its hold timer. Only \`want\` moves
;   here — the actual blit is budgeted in bitmap_sway_drain.
;
; INPUT: A = cell index (0..191).
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_sway_touch_cell:
    ld (bitmap_sway_cell), a
    call bitmap_sway_find_set
    ret nc                      ; plain cell: nothing to bend
    ld (bitmap_sway_set), a
    ld a, (bitmap_sway_cell)
    call bitmap_sway_slot_for_cell
    ret z                       ; pool full
    ld a, (bitmap_sway_set)
    ld (ix+1), a
    ; Bend towards the facing. Doing it unconditionally (instead of only while
    ; player_moving) keeps the grass parted under a player standing in it, and
    ; makes it flip over when the player turns around on the spot.
    ld a, (player_facing)
    or a
    jp z, .stc_left
    ld a, ${SWAY_FRAME_RIGHT}
    jp .stc_store
.stc_left:
    ld a, ${SWAY_FRAME_LEFT}
.stc_store:
    ld (ix+2), a                ; want = bent frame
    ld a, (bitmap_sway_set)
    call bitmap_sway_set_ptr
    ld a, (hl)                  ; hold frames of this grass variant
    ld (ix+4), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_emit_row
; ------------------------------------------------------------
; PURPOSE:
;   Append (row base OR column) for every column in bitmap_sway_cols.
;
; INPUT: B = row base (row * 16), DE = write cursor in bitmap_sway_cells.
; OUTPUT: DE advanced past the cells written.
; DESTROYS: AF, HL.  PRESERVES: B, C, IX, IY.
; ------------------------------------------------------------
bitmap_sway_emit_row:
    ld hl, bitmap_sway_cols
.ser_loop:
    ld a, (hl)
    cp #FF
    ret z                       ; end of the column list
    or b
    ld (de), a
    inc de
    inc hl
    jp .ser_loop

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_touch_body
; ------------------------------------------------------------
; PURPOSE:
;   Feed every cell the player hitbox overlaps to bitmap_sway_touch_cell.
;   The sample points come from the hitbox size (see sampleOffsets), so a tall
;   body also ticks the cell rows it merely passes THROUGH, not just the two it
;   ends on. Consecutive samples landing in the same row/column collapse, so a
;   body inside a single cell ticks that cell exactly once.
;
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_sway_touch_body:
    ; --- body columns, deduplicated, #FF-terminated ---
    ld hl, bitmap_sway_cols
    ld d, #FF                   ; previous column (no cell column is #FF)
${colOffsets.map((offset, index) => `    ld a, (player_x)
${addA(offset)}    rrca
    rrca
    rrca
    rrca
    and #0F
    cp d
    jp z, .stb_col${index}_dup
    ld d, a
    ld (hl), a
    inc hl
.stb_col${index}_dup:
`).join('')}    ld (hl), #FF
    ; --- body cells = every column of every row, deduplicated, #FF-terminated ---
    ld de, bitmap_sway_cells
    ld b, #FF                   ; previous row base (no row base is #FF)
${rowOffsets.map((offset, index) => `    ld a, (player_y)
${addA(offset)}    and #F0
    cp b
    jp z, .stb_row${index}_dup
    ld b, a
    call bitmap_sway_emit_row
.stb_row${index}_dup:
`).join('')}    ld a, #FF
    ld (de), a
    ; --- tick them ---
    ld hl, bitmap_sway_cells
.stb_loop:
    ld a, (hl)
    cp #FF
    ret z
    push hl
    call bitmap_sway_touch_cell
    pop hl
    inc hl
    jp .stb_loop

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_tick_pool
; ------------------------------------------------------------
; PURPOSE:
;   Age every bent cell. When a hold timer runs out the slot asks for the rest
;   frame back; the blit itself happens in bitmap_sway_drain. Cells still under
;   the player were re-armed by bitmap_sway_touch_body earlier this frame, so
;   they never reach zero.
;
; DESTROYS: AF, B, IX.  PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_sway_tick_pool:
    ld ix, bitmap_sway_pool
    ld b, ${SWAY_POOL_SLOTS}
.stp_loop:
    ld a, (ix+0)
    cp #FF
    jp z, .stp_next             ; free slot
    ld a, (ix+4)
    or a
    jp z, .stp_next             ; already springing back, waiting for its draw
    dec a
    ld (ix+4), a
    jp nz, .stp_next
    xor a
    ld (ix+2), a                ; want = rest: the grass stands back up
.stp_next:
${ixAdvance}
    djnz .stp_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_drain
; ------------------------------------------------------------
; PURPOSE:
;   Blit the slots whose wanted frame is not the drawn one, at most
;   ${SWAY_DRAWS_PER_FRAME} per frame so the CPU never waits on more than one queued 16x16
;   HMMM. A slot that has drawn its way back to rest is released.
;
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_sway_drain:
    ld ix, bitmap_sway_pool
    ld b, ${SWAY_POOL_SLOTS}
.sdr_loop:
    ld a, (ix+0)
    cp #FF
    jp z, .sdr_next             ; free slot
    ld a, (ix+2)
    cp (ix+3)
    jp z, .sdr_next             ; already showing the wanted frame
    ld a, (bitmap_sway_budget)
    or a
    ret z                       ; out of draws: the rest wait for the next frame
    dec a
    ld (bitmap_sway_budget), a
    push bc
    call bitmap_sway_draw
    pop bc
    ld a, (ix+2)
    ld (ix+3), a                ; drawn = want
    or a
    jp nz, .sdr_next
    ld (ix+0), #FF              ; back upright: release the slot
.sdr_next:
${ixAdvance}
    djnz .sdr_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sway_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame driver: bend what the player is walking through, age the rest, and
;   spend this frame's draw budget.
;
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_sway_update:
    ld a, (bitmap_composition_state)
    or a
    ret nz                      ; mid room transition: the bitmap is being rebuilt
${opts.pauseGateAsm || ''}    ld a, (bitmap_displayed_page)
    ld (bitmap_sway_page), a
    ld a, ${SWAY_DRAWS_PER_FRAME}
    ld (bitmap_sway_budget), a
    call bitmap_sway_touch_body
    call bitmap_sway_tick_pool
    jp bitmap_sway_drain
`;

  // --- ROM data -------------------------------------------------------------
  const formatBytes = (label: string, bytes: number[], comment: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    if (bytes.length === 0) {
      lines.push('    DB #00');
    } else {
      for (let i = 0; i < bytes.length; i += 16) {
        lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b)).join(',')}`);
      }
    }
    return lines.join('\n') + '\n';
  };

  const recordRows = opts.roomCells.map((cells, roomIndex) =>
    formatBytes(
      `bitmap_sway_room_${roomIndex}`,
      cells.flatMap(item => [item.cell & 0xff, item.set & 0xff]),
      `Room ${roomIndex} swaying cells: cell index, sway set index`,
    )
  ).join('');

  const setBytes = opts.sets.flatMap(set => [
    Math.max(MSX2_BITMAP_SWAY_HOLD_MIN, Math.min(MSX2_BITMAP_SWAY_HOLD_MAX, set.holdFrames)) & 0xff,
    set.restSx & 0xff, set.restSy & 0xff, (set.restSy >> 8) & 0xff,
    set.leftSx & 0xff, set.leftSy & 0xff, (set.leftSy >> 8) & 0xff,
    set.rightSx & 0xff, set.rightSy & 0xff, (set.rightSy >> 8) & 0xff,
  ]);

  const dataAsm = `${recordRows}bitmap_sway_ptr_table:
${opts.roomCells.map((_cells, i) => `    DW bitmap_sway_room_${i}`).join('\n')}
bitmap_sway_count_table:
    DB ${opts.roomCells.map(cells => cells.length).join(',')}
${formatBytes(
    'bitmap_sway_set_table',
    setBytes,
    `Sway sets (${SWAY_SET_STRIDE} bytes each): holdFrames, then rest/left/right frame as ` +
    'sx, syLow, syHigh (absolute VRAM source of the 16x16 atlas region)',
  )}`;

  return {
    enabled: true,
    ramBytes,
    equates,
    initAsm,
    mainLoopCall: '    call bitmap_sway_update\n',
    initialDrawCall: '    call bitmap_sway_reset_visible      ; grass comes back upright\n',
    pendingPageDrawCall: '    call bitmap_sway_reset_pending      ; grass comes back upright\n',
    routinesAsm,
    dataAsm,
  };
}

export { SWAY_FRAME_REST, SWAY_FRAME_LEFT, SWAY_FRAME_RIGHT, SWAY_POOL_SLOTS, SWAY_DRAWS_PER_FRAME };
