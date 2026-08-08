/**
 * SCREEN 5 bitmap-room CRUMBLING FLOOR — the Manic Miner collapsing platform.
 *
 * A cell marked "Se desmorona" in the SCREEN 5 screen editor erodes while the
 * player stands on it: every `framesPerStage` frames of contact the top 2 px
 * band of the 16x16 tile is HMMV-filled with the room background colour, and
 * after 8 stages the whole tile is gone and its collision cell opens, so the
 * player falls through. Faithful to the original, the collision box stays whole
 * until the last stage: the player keeps its height while the floor is consumed
 * under its feet and only drops when nothing is left.
 *
 * UNLIKE destroy_tile (the pick), the erosion is TEMPORARY. There is no
 * persistence list: the state lives in a small RAM pool that is wiped whenever
 * the room is (re)composed, and since rooms are always rebuilt from the atlas,
 * forgetting the state IS the regeneration — leave the room and come back and
 * the floor is whole again.
 *
 * Authoring: the per-cell bit 0x04 of `room.collision` (see PROP_BIT.crumbling
 * in Msx2BitmapScreenEditor). That bit is authoring-only — buildCollisionTableBytes
 * masks bits 2..1 away because the exported byte carries the Effects layer there —
 * so it never reaches the ROM and can never make a cell read as solid by accident.
 * The generator turns the marked cells into the per-room record list below, taking
 * each cell's speed from the atlas tile painted on it.
 *
 * Per-frame cost when nothing is eroding: composition/pause gates, the debris
 * pool walk (2 slots) and, only while grounded, two record-list lookups. The
 * fills run on the V9938 command engine (async), so the 60 fps player budget is
 * untouched.
 *
 * RAM (62 bytes at `ramBase`, allocated from the linked-HUD chain):
 *   +0  page      target page for the erosion fills (0/1)
 *   +1  cell      scratch: cell index being ticked
 *   +2  frames    scratch: frames-per-stage of that cell
 *   +3  band      scratch: pixel row offset inside the cell of the current stage
 *   +4  pool      16 slots x 3 bytes (cell | #FF free, stage, tick)
 *   +52 debris    2 slots x 5 bytes (ttl, x, y, vx, vy)
 */

/** Erosion stages consumed by one 16px cell (2 px each). */
export const MSX2_BITMAP_CRUMBLE_STAGES = 8;
/** Pixel rows erased per stage. STAGES * BAND = 16 = the cell height. */
const CRUMBLE_BAND_HEIGHT = 2;
/** Cells that can hold partial erosion at once (a room row is 16 cells wide). */
const CRUMBLE_POOL_SLOTS = 16;
const CRUMBLE_POOL_STRIDE = 3;
/** Falling-chip sprites. Two are enough: one chip is spawned per stage. */
export const MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS = 2;
const DEBRIS_STRIDE = 5;
const DEBRIS_TTL = 40;
/** Register/value pairs in bitmap_crumble_sfx_data (keep in sync with the DB row). */
const CRUMBLE_SFX_PAIRS = 8;
/** Off-screen, non-terminating sprite Y (same one enemies/foreground/debris use). */
const DEBRIS_HIDDEN_SPRITE_Y = 0xd4;

const POOL_OFFSET = 4;
const DEBRIS_OFFSET = POOL_OFFSET + CRUMBLE_POOL_SLOTS * CRUMBLE_POOL_STRIDE;
const CRUMBLE_RAM_BYTES = DEBRIS_OFFSET + MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS * DEBRIS_STRIDE;

export const MSX2_BITMAP_CRUMBLE_FRAMES_MIN = 2;
export const MSX2_BITMAP_CRUMBLE_FRAMES_MAX = 30;
export const MSX2_BITMAP_CRUMBLE_FRAMES_DEFAULT = 6;

function asmByte(value: number): string {
  return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, Math.floor(value))).toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapCrumblePlayerHitbox { x: number; y: number; w: number; h: number; }

/** One crumbling cell: where it is and how many contact frames each stage costs. */
export interface BitmapCrumbleCell {
  /** Collision cell index, row * 16 + col (0..191). */
  cell: number;
  /** Frames the player must stand on it per 2px stage. */
  framesPerStage: number;
}

export interface BitmapCrumbleDebrisSprite {
  patternBytes: number[]; // 32 bytes, 16x16 sprite-mode-2 quadrants
  colorBytes: number[];   // 16 bytes, per-line colours
}

export interface BitmapCrumbleOptions {
  /** RAM base from the linked-HUD chain. */
  ramBase: number;
  hitbox: BitmapCrumblePlayerHitbox;
  /** HUD band offset added to bitmap Y / sprite Y (BITMAP_ROOM_GAME_Y_OFFSET). */
  gameYOffset: number;
  /** Crumbling cells per room, in room order (empty arrays for plain rooms). */
  roomCells: BitmapCrumbleCell[][];
  /** Per-room HMMV colour byte ((bg<<4)|bg) the erosion paints with. */
  bgColorBytes: number[];
  /** Sprite pattern NUMBER (group * 4) reserved for the falling chip. */
  debrisPatternNumber: number;
  /** VRAM address of the first debris SAT slot. */
  debrisSatBase: number;
  /** VRAM address of the first debris sprite line-colour table. */
  debrisColorBase: number;
  /** Chip artwork; a grey 2x2 nugget is used when absent. */
  debrisSprite?: BitmapCrumbleDebrisSprite;
  /** Extra `ret`-style gates (NPC dialogue / perception freeze), like the other systems. */
  pauseGateAsm?: string;
  /** PSG crunch on each stage. */
  sound?: boolean;
}

export interface BitmapCrumbleSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /** RAM-only boot clear; safe inside the linked-HUD init block. */
  initAsm: string;
  /** Chip pattern + colour-table VRAM upload; goes in the sprite upload block. */
  initUploadAsm: string;
  mainLoopCall: string;
  satCallAsm: string;
  initialDrawCall: string;
  pendingPageDrawCall: string;
  routinesAsm: string;
  dataAsm: string;
}

const DISABLED: BitmapCrumbleSystemAsm = {
  enabled: false,
  ramBytes: 0,
  equates: '',
  initAsm: '',
  initUploadAsm: '',
  mainLoopCall: '',
  satCallAsm: '',
  initialDrawCall: '',
  pendingPageDrawCall: '',
  routinesAsm: '',
  dataAsm: '',
};

export function bitmapCrumbleCellCount(roomCells: BitmapCrumbleCell[][]): number {
  return roomCells.reduce((total, cells) => total + cells.length, 0);
}

/**
 * Build the whole crumbling-floor system. Returns the DISABLED shape (all empty
 * strings, 0 RAM) when no room has a crumbling cell, so projects that do not use
 * it generate a byte-identical ROM.
 */
export function buildBitmapCrumbleSystemAsm(opts: BitmapCrumbleOptions): BitmapCrumbleSystemAsm {
  if (bitmapCrumbleCellCount(opts.roomCells) === 0) return DISABLED;

  const base = opts.ramBase;
  const pageAddr = base;
  const cellAddr = base + 1;
  const framesAddr = base + 2;
  const bandAddr = base + 3;
  const poolAddr = base + POOL_OFFSET;
  const debrisAddr = base + DEBRIS_OFFSET;
  const gameYOffset = asmByte(opts.gameYOffset);
  const patternNumber = asmByte(opts.debrisPatternNumber);
  const satBase = asmWord(opts.debrisSatBase);
  const sound = opts.sound !== false;

  // Feet row: the first pixel row BELOW the body box. When the player stands on
  // a solid cell this row is inside that cell, so `and #F0` yields its row.
  const feetOffset = opts.hitbox.y + opts.hitbox.h;
  const hbLeft = opts.hitbox.x;
  const hbRight = opts.hitbox.x + opts.hitbox.w - 1;
  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');

  const equates = `; --- CRUMBLING FLOOR (Manic Miner) RAM (${CRUMBLE_RAM_BYTES} bytes at ${asmWord(base)}) ---
; ${bitmapCrumbleCellCount(opts.roomCells)} crumbling cell(s). State is per-room and TEMPORARY:
; every room (re)composition wipes the pool, which is what regenerates the tiles.
bitmap_crumble_page       EQU ${asmWord(pageAddr)}
bitmap_crumble_cell       EQU ${asmWord(cellAddr)}
bitmap_crumble_frames     EQU ${asmWord(framesAddr)}
bitmap_crumble_band       EQU ${asmWord(bandAddr)}
bitmap_crumble_pool       EQU ${asmWord(poolAddr)}
bitmap_crumble_debris     EQU ${asmWord(debrisAddr)}
; Shared 15-byte command scratch (jumpers / gems / destroy_tile use it too: every
; launch in this engine is sequential inside the main loop).
bitmap_crumble_cmd_block  EQU #C2C0
`;

  const debrisClears = Array.from({ length: MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS }, (_u, i) =>
    `    ld (bitmap_crumble_debris + ${i * DEBRIS_STRIDE}), a`).join('\n');

  const initAsm = `    ; crumbling floor: no page yet, empty pool (#FF = free slot), no chips.
    xor a
    ld (bitmap_crumble_page), a
    ld (bitmap_crumble_cell), a
    ld (bitmap_crumble_frames), a
    ld (bitmap_crumble_band), a
${debrisClears}
    call bitmap_crumble_clear_pool
`;

  const sfxCall = sound
    ? `    call bitmap_crumble_sfx      ; LAST: the PSG writes clobber HL
`
    : '';
  const sfxRoutine = sound
    ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_sfx
; ------------------------------------------------------------
; PURPOSE: short crunch on each erosion stage (fire-and-forget PSG writes on
;   channel C, the gameplay SFX channel, like the gem blip / pick thud).
; DESTROYS: AF, B, HL. PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_crumble_sfx:
    ld hl, bitmap_crumble_sfx_data
    ld b, ${CRUMBLE_SFX_PAIRS}
.csfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .csfx_loop
    ; Shadow holds the channel-C DISABLE bits of R7 (bit2 tone, bit5 noise); the
    ; music merges it after clearing those two bits. Both clear = tone + noise on.
    xor a
    ld (psg_sfx_r7_c_bits), a
    ret
`
    : '';

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_clear_pool
; ------------------------------------------------------------
; PURPOSE:
;   Forget every partially eroded cell (slot cell = #FF, stage/tick = 0). This
;   is the regeneration: the room composition repaints the pristine tiles and
;   the runtime no longer remembers any erosion.
;
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_crumble_clear_pool:
    ld hl, bitmap_crumble_pool
    ld b, ${CRUMBLE_POOL_SLOTS}
.ccp_loop:
    ld (hl), #FF                ; free slot
    inc hl
    ld (hl), 0                  ; stage
    inc hl
    ld (hl), 0                  ; tick
    inc hl
    djnz .ccp_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_reset_visible / bitmap_crumble_reset_pending
; ------------------------------------------------------------
; PURPOSE:
;   Room (re)composition hook: latch the page the erosion must draw on and drop
;   all erosion state + live chips. Called at boot / room load with the visible
;   page and from commit_room_flip with the hidden page.
;
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_crumble_reset_visible:
    ld a, (bitmap_displayed_page)
    jp bitmap_crumble_reset_page
bitmap_crumble_reset_pending:
    ld a, (bitmap_pending_display_page)
bitmap_crumble_reset_page:
    ld (bitmap_crumble_page), a
    xor a
${debrisClears}
    jp bitmap_crumble_clear_pool

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_find_record
; ------------------------------------------------------------
; PURPOSE:
;   Look up bitmap_crumble_cell in the current room's crumbling-cell list.
;
; OUTPUT: NZ + A = frames per stage when the cell crumbles; Z when it does not.
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_crumble_find_record:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_crumble_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z                       ; no crumbling cell in this room
    ld hl, bitmap_crumble_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                     ; HL = first record of the room
    ld a, (bitmap_crumble_cell)
    ld c, a                     ; C = wanted cell
.cfr_loop:
    ld a, (hl)
    inc hl
    cp c
    jp z, .cfr_hit
    inc hl                      ; skip frames byte
    djnz .cfr_loop
    xor a                       ; not a crumbling cell (Z)
    ret
.cfr_hit:
    ld a, (hl)                  ; A = frames per stage (never 0, so NZ)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_slot_for_cell
; ------------------------------------------------------------
; PURPOSE:
;   Find the pool slot tracking cell A, claiming a free one on first contact.
;
; INPUT: A = cell index.
; OUTPUT: IX = slot (NZ). Z when the pool is full (the cell just does not erode).
; DESTROYS: AF, B, IX.  PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_crumble_slot_for_cell:
    ld ix, bitmap_crumble_pool
    ld b, ${CRUMBLE_POOL_SLOTS}
.csfc_find:
    cp (ix+0)
    jp z, .csfc_hit
    inc ix
    inc ix
    inc ix
    djnz .csfc_find
    push af                     ; keep the wanted cell while scanning for a free slot
    ld ix, bitmap_crumble_pool
    ld b, ${CRUMBLE_POOL_SLOTS}
.csfc_free:
    ld a, (ix+0)
    cp #FF
    jp z, .csfc_new
    inc ix
    inc ix
    inc ix
    djnz .csfc_free
    pop af
    xor a                       ; pool full (Z): skip this cell
    ret
.csfc_new:
    pop af
    ld (ix+0), a                ; claim the slot
    xor a
    ld (ix+1), a                ; stage 0
    ld (ix+2), a                ; tick 0
.csfc_hit:
    ld a, 1
    or a                        ; NZ
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_fill_band
; ------------------------------------------------------------
; PURPOSE:
;   Erase the ${CRUMBLE_BAND_HEIGHT}px band a stage consumes: build + launch an HMMV filling
;   16 x ${CRUMBLE_BAND_HEIGHT} px at (col*16, row*16 + band) with the room background colour,
;   on page bitmap_crumble_page.
;
; INPUT: A = cell index, bitmap_crumble_band = row offset inside the cell.
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; SIDE EFFECTS: waits for the previous VDP command; restores R#15 = S#0.
; ------------------------------------------------------------
bitmap_crumble_fill_band:
    ld c, a                     ; C = cell
    ld hl, bitmap_crumble_cmd_block
    xor a
    ld b, 4                     ; SX (2) + SY (2): unused by HMMV
.cfb_zero:
    ld (hl), a
    inc hl
    djnz .cfb_zero
    ld a, c
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld (hl), a                  ; DX low = col * 16
    inc hl
    xor a
    ld (hl), a                  ; DX high
    inc hl
    ld a, (bitmap_crumble_band)
    ld b, a
    ld a, c
    and #F0                     ; row * 16
    add a, b                    ; + rows already eaten by previous stages
    add a, ${gameYOffset}
    ld (hl), a                  ; DY low
    inc hl
    ld a, (bitmap_crumble_page)
    ld (hl), a                  ; DY high = page (0 -> Y 0..255, 1 -> Y 256..511)
    inc hl
    ld a, 16
    ld (hl), a                  ; NX = 16
    inc hl
    xor a
    ld (hl), a
    inc hl
    ld a, ${CRUMBLE_BAND_HEIGHT}
    ld (hl), a                  ; NY = band height
    inc hl
    xor a
    ld (hl), a
    inc hl
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    push hl
    ld hl, bitmap_crumble_bg_table
    add hl, de
    ld a, (hl)
    pop hl
    ld (hl), a                  ; CLR = (bg<<4)|bg
    inc hl
    xor a
    ld (hl), a                  ; ARG
    inc hl
    ld a, #C0
    ld (hl), a                  ; CMD = HMMV
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_crumble_cmd_block
    ld b, 15
.cfb_launch:
    ld a, (hl)
    out (VDP_CMD_PORT), a
    inc hl
    djnz .cfb_launch
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_tick_cell
; ------------------------------------------------------------
; PURPOSE:
;   One frame of player contact on cell A: count it, and on a stage boundary eat
;   the next ${CRUMBLE_BAND_HEIGHT}px band, throw a chip and crunch. On the last stage the cell
;   opens (collision + behavior cleared) so the player falls through.
;
; INPUT: A = cell index (0..191).
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_crumble_tick_cell:
    ld (bitmap_crumble_cell), a
    ; An already consumed cell must be ignored. The engine keeps the grounded flag
    ; for the coyote window (~12 frames) after the floor disappears, and without
    ; this check those frames re-claimed a pool slot for the open cell and started
    ; a second erosion cycle on it (caught by the OpenMSX smoke: stage went 8 -> 0
    ; and the slot was never released).
    ld c, a
    ld b, 0
    ld hl, bitmap_room_collision_map
    add hl, bc
    ld a, (hl)
    or a
    ret z
    call bitmap_crumble_find_record
    ret z                       ; plain floor: nothing to erode
    ld (bitmap_crumble_frames), a
    ld a, (bitmap_crumble_cell)
    call bitmap_crumble_slot_for_cell
    ret z                       ; pool full
    ld a, (ix+2)
    inc a
    ld (ix+2), a
    ld hl, bitmap_crumble_frames
    cp (hl)
    ret c                       ; still counting frames for this stage
    xor a
    ld (ix+2), a                ; stage boundary: restart the frame count
    ld a, (ix+1)
    inc a
    ld (ix+1), a                ; A = new stage (1..${MSX2_BITMAP_CRUMBLE_STAGES})
    dec a
    add a, a                    ; A = (stage - 1) * ${CRUMBLE_BAND_HEIGHT}
    ld (bitmap_crumble_band), a
    ; Last stage: the tile is fully consumed, so open the cell. Done BEFORE the
    ; chip/sfx calls because those clobber IX/HL.
    ld a, (ix+1)
    cp ${MSX2_BITMAP_CRUMBLE_STAGES}
    jp nz, .ctc_erode
    ld a, #FF
    ld (ix+0), a                ; release the slot: this cell is gone for good
    ld a, (bitmap_crumble_cell)
    ld c, a
    ld b, 0
    ld hl, bitmap_room_collision_map
    add hl, bc
    ld (hl), 0                  ; no longer solid -> the player drops
    ld hl, bitmap_room_behavior_map
    add hl, bc
    ld (hl), 0
.ctc_erode:
    ld a, (bitmap_crumble_cell)
    call bitmap_crumble_fill_band
    ld a, (bitmap_crumble_cell)
    ld c, a
    call bitmap_crumble_spawn_debris
${sfxCall}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame driver: step the falling chips and, while the player is grounded,
;   feed one contact frame to the cell(s) under its feet. A 16px-wide body can
;   straddle two cells, so both crumble (as in the original).
;
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_crumble_update:
    ld a, (bitmap_composition_state)
    or a
    ret nz                      ; mid room transition: the bitmap is being rebuilt
${opts.pauseGateAsm || ''}    call bitmap_crumble_step_debris
    ld a, (player_flags)
    and #01
    ret z                       ; airborne: nothing is being stood on
    ld a, (bitmap_displayed_page)
    ld (bitmap_crumble_page), a
    ; Cell row right below the body box.
    ld a, (player_y)
    add a, ${feetOffset}
    and #F0
    ld d, a                     ; D = row * 16 = the cell index minus its column
    ; Left body column.
    ld a, (player_x)
${addA(hbLeft)}    rrca
    rrca
    rrca
    rrca
    and #0F
    or d
    ld b, a                     ; B = cell under the left edge
    ; Right body column.
    ld a, (player_x)
${addA(hbRight)}    rrca
    rrca
    rrca
    rrca
    and #0F
    or d
    ld c, a                     ; C = cell under the right edge
    push bc
    ld a, b
    call bitmap_crumble_tick_cell
    pop bc
    ld a, b
    cp c
    ret z                       ; body inside a single cell: already ticked
    ld a, c
    jp bitmap_crumble_tick_cell

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_spawn_debris
; ------------------------------------------------------------
; PURPOSE:
;   Throw one chip from the eroding band of cell C (first free pool slot; when
;   both are busy the stage simply shows no chip).
;
; INPUT: C = cell index, bitmap_crumble_band = row offset inside the cell.
; DESTROYS: AF, B, DE, HL, IX.  PRESERVES: C, IY.
; ------------------------------------------------------------
bitmap_crumble_spawn_debris:
    ld a, c
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    add a, 6
    ld d, a                     ; D = chip x (cell centre-ish)
    ld a, (bitmap_crumble_band)
    ld e, a
    ld a, c
    and #F0
    add a, e
    ld e, a                     ; E = chip y (the row that just vanished)
    ld ix, bitmap_crumble_debris
    ld hl, bitmap_crumble_vel_table
    ld b, ${MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS}
.csd_loop:
    ld a, (ix+0)
    or a
    jp z, .csd_spawn
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    inc hl
    inc hl
    djnz .csd_loop
    ret                         ; both chips still in the air
.csd_spawn:
    ld a, ${DEBRIS_TTL}
    ld (ix+0), a
    ld (ix+1), d
    ld (ix+2), e
    ld a, (hl)
    ld (ix+3), a                ; vx
    inc hl
    ld a, (hl)
    ld (ix+4), a                ; vy
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_step_debris
; ------------------------------------------------------------
; PURPOSE:
;   Advance live chips: x += vx, vy gains +1 every 4 frames (capped at +3),
;   y += vy. A chip dies on ttl 0 or when it leaves the play band.
;
; DESTROYS: AF, B, IX.  PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_crumble_step_debris:
    ld ix, bitmap_crumble_debris
    ld b, ${MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS}
.csdb_loop:
    ld a, (ix+0)
    or a
    jp z, .csdb_next
    dec a
    ld (ix+0), a
    jp z, .csdb_next            ; expired this frame
    ld a, (ix+1)
    add a, (ix+3)
    ld (ix+1), a
    ld a, (ix+0)
    and 3
    jp nz, .csdb_fall
    ld a, (ix+4)
    cp 3
    jp z, .csdb_fall
    inc a
    ld (ix+4), a
.csdb_fall:
    ld a, (ix+2)
    add a, (ix+4)
    ld (ix+2), a
    cp 192
    jp c, .csdb_next
    xor a                       ; left the band (or wrapped above): kill it
    ld (ix+0), a
.csdb_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .csdb_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_update_debris_sat
; ------------------------------------------------------------
; PURPOSE:
;   Write the ${MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS} chip SAT slots (idle chips park at Y ${asmByte(DEBRIS_HIDDEN_SPRITE_Y)}, the
;   off-screen non-terminator Y the other systems use) plus a #D8 terminator;
;   when shoot is active its bullet writer runs after this one and overwrites
;   the terminator with its first slot.
;
; OUTPUT: SAT entries at VRAM ${satBase} onwards.
; DESTROYS: AF, DE, HL, IX.  PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_crumble_update_debris_sat:
    ld de, ${satBase}
    push bc
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld ix, bitmap_crumble_debris
    ld b, ${MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS}
.csat_loop:
    ld a, (ix+0)
    or a
    jp z, .csat_hidden
    ld a, (ix+2)
    add a, ${gameYOffset}
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, ${patternNumber}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .csat_next
.csat_hidden:
    ld a, ${asmByte(DEBRIS_HIDDEN_SPRITE_Y)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.csat_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .csat_loop
    ld a, #D8
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop bc
    ret
${sfxRoutine}`;

  // --- ROM data -------------------------------------------------------------
  const emit = (label: string, bytes: number[], comment: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b)).join(',')}`);
    }
    lines.push(`${label}_end:`);
    return lines.join('\n') + '\n';
  };
  // Fallback chip: a 2x2 nugget in the top-left corner of the 16x16 sprite
  // (mode 2 quadrant layout: bytes 0..15 = left column, rows 0..15).
  const fallbackPattern = Array(32).fill(0);
  fallbackPattern[0] = 0xc0;
  fallbackPattern[1] = 0xc0;
  const pattern = opts.debrisSprite?.patternBytes && opts.debrisSprite.patternBytes.length === 32
    ? opts.debrisSprite.patternBytes
    : fallbackPattern;
  const colors = opts.debrisSprite?.colorBytes && opts.debrisSprite.colorBytes.length === 16
    ? opts.debrisSprite.colorBytes
    : Array(16).fill(14);

  const recordRows = opts.roomCells.map((cells, roomIndex) =>
    emit(
      `bitmap_crumble_room_${roomIndex}`,
      cells.flatMap(item => [item.cell & 0xff, Math.max(1, Math.min(255, item.framesPerStage))]),
      `Room ${roomIndex} crumbling cells: cell index, frames per ${CRUMBLE_BAND_HEIGHT}px stage`,
    )
  ).join('');

  const dataAsm = `${recordRows}bitmap_crumble_ptr_table:
${opts.roomCells.map((_cells, i) => `    DW bitmap_crumble_room_${i}`).join('\n')}
bitmap_crumble_count_table:
    DB ${opts.roomCells.map(cells => cells.length).join(',')}
; Per-room HMMV colour byte ((bg<<4)|bg) the erosion paints the band with.
bitmap_crumble_bg_table:
    DB ${opts.bgColorBytes.map(b => asmByte(b)).join(',')}
; Chip velocities per pool slot: vx, vy (signed px/frame; vy gains +1 every 4
; frames up to +3, so the chips tumble apart and rain down).
bitmap_crumble_vel_table:
    DB #FF,#FF, #01,#FF
${emit('bitmap_crumble_chip_pattern_data', pattern, 'crumbling floor: 16x16 chip sprite pattern (mode 2 quadrants)')}${emit('bitmap_crumble_chip_color_data', colors, 'crumbling floor: 16-byte line colour table for the chip')}${sound
  ? `; crumbling-floor crunch: ${CRUMBLE_SFX_PAIRS} PSG register/value pairs. Mixer #1B = channel C
; tone AND noise on (A/B untouched by the music merge), noise period #10, tone
; period #0240, R10 #10 = channel C driven by the hardware envelope, shape #09 =
; one decay. Channel C is the gameplay SFX channel by convention.
bitmap_crumble_sfx_data:
    db 7,#1B, 6,#10, 4,#40, 5,#02, 11,#30, 12,#00, 10,#10, 13,#09
`
  : ''}`;

  const uploadAsm = (() => {
    const patternVram = 0xf800 + opts.debrisPatternNumber * 8;
    const colorUploads = Array.from({ length: MSX2_BITMAP_CRUMBLE_DEBRIS_SLOTS }, (_u, i) => {
      const colorVram = opts.debrisColorBase + i * 16;
      return `    ld hl, bitmap_crumble_chip_color_data
    ld de, ${asmWord(colorVram)}
    ld bc, bitmap_crumble_chip_color_data_end - bitmap_crumble_chip_color_data
    call copy_to_vram_ext
`;
    }).join('');
    return `    ; crumbling floor: chip pattern (32 bytes) -> VRAM ${asmWord(patternVram)} + slot colour tables
    ld hl, bitmap_crumble_chip_pattern_data
    ld de, ${asmWord(patternVram)}
    ld bc, bitmap_crumble_chip_pattern_data_end - bitmap_crumble_chip_pattern_data
    call copy_to_vram_ext
${colorUploads}`;
  })();

  return {
    enabled: true,
    ramBytes: CRUMBLE_RAM_BYTES,
    equates,
    initAsm,
    initUploadAsm: uploadAsm,
    mainLoopCall: '    call bitmap_crumble_update\n',
    satCallAsm: '    call bitmap_crumble_update_debris_sat\n',
    initialDrawCall: '    call bitmap_crumble_reset_visible    ; crumbling floors come back whole\n',
    pendingPageDrawCall: '    call bitmap_crumble_reset_pending   ; crumbling floors come back whole\n',
    routinesAsm,
    dataAsm,
  };
}
