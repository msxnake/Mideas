import { Msx2DestroyTileConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room DESTROY TILE (dig) skill — Terraria-style picking.
 *
 * On the configurable dig key, the player swings a pick at the wall directly
 * ahead (facing direction). The TOP body cell is probed first, then the BOTTOM
 * one (a 16x32 two-sprite player digs its upper front tile before the lower
 * one; a 16x16 player has a single front cell). A cell reacts only when it is
 * SOLID in the collision map AND painted with an atlas tile marked
 * "Destructible" in the SCREEN 5 screen editor (per-room ROM bitmask).
 *
 * Every connected swing spawns debris chips (hardware sprites, ~1 second of
 * scatter with gravity) and plays an optional PSG thud. After `hitsPerTile`
 * swings on the same cell the tile dissolves: HMMV fills the 16x16 cell with
 * the room background colour on the displayed page, the collision cell flips
 * to no-solid (and the behavior cell clears), and the (room, cell) pair is
 * appended to a persistence list. The list is re-applied after every room
 * composition (boot, edge transition, dialogue repaint), so holes survive
 * leaving and re-entering the screen. Compressed/banked room data is never
 * touched: rooms compose from ROM as authored and the holes are re-punched
 * on top, exactly like the collector-gems overlay.
 *
 * Per-frame cost when idle: one key read + two cooldown ticks (~90 cycles).
 * The debris pool only iterates when chips are alive; the HMMV fill runs on
 * the V9938 command engine (async), so the 60 fps main loop is preserved.
 *
 * RAM: fixed region at `ramBase` (#C2D0, above the behavior map + the shared
 * #C2C0 command scratch, far below the BIOS stack):
 *   +0  cooldown          frames until the next swing
 *   +1  lock              requireKeyRelease latch
 *   +2  target            cell index being picked (#FF = none)
 *   +3  hits              swings landed on the target
 *   +4  anim              frames left asserting the 'digging' anim state
 *   +5  count             persisted destroyed-tile entries
 *   +6  page              target page for the HMMV fill (0/1)
 *   +7  debris pool       4 slots x 5 bytes (ttl, x, y, vx, vy)
 *   +27 destroyed list    destroyedLimit x 2 bytes (room, cell)
 */

export const MSX2_BITMAP_DESTROY_DEBRIS_SLOTS = 4;
const DEBRIS_STRIDE = 5;
const DEBRIS_TTL = 60;            // ~1 second at 60 fps
const DEBRIS_HIDDEN_SPRITE_Y = 0xd4; // same off-screen non-terminator Y as enemies/foreground

/** digKey selector -> PPI keyboard matrix (row, pressed-bit mask). */
const DIG_KEYS: Array<{ row: number; mask: number; label: string }> = [
  { row: 8, mask: 0x01, label: 'SPACE' },
  { row: 2, mask: 0x80, label: 'B' },
  { row: 4, mask: 0x08, label: 'N' },
  { row: 5, mask: 0x80, label: 'Z' },
  { row: 5, mask: 0x20, label: 'X' },
  { row: 4, mask: 0x04, label: 'M' },
];

function asmByte(value: number): string {
  return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, Math.floor(value))).toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapDestroyTilePlayerHitbox { x: number; y: number; w: number; h: number; }

export interface BitmapDestroyTileOptions {
  /** Fixed RAM base for the whole destroy-tile state (see module header). */
  ramBase: number;
  hitbox: BitmapDestroyTilePlayerHitbox;
  /** player_anim_state clip id for the 'digging' animation row (undefined = no state sprite authored). */
  digAnimId?: number;
  /** Sprite pattern NUMBER (group*4) reserved for the debris chip. */
  debrisPatternNumber: number;
  /** VRAM address of the first debris SAT slot (after carry, before bullets). */
  debrisSatBase: number;
  /** VRAM address of the first debris sprite line-colour table. */
  debrisColorBase: number;
  /** HUD band offset added to sprite Y (BITMAP_ROOM_GAME_Y_OFFSET). */
  gameYOffset: number;
  /** Per-room 24-byte destructible-cell bitmask (bit set = cell can be dug). */
  destructibleMasks: number[][];
  /** Per-room HMMV colour byte ((bg<<4)|bg) used to dissolve cells. */
  bgColorBytes: number[];
}

export interface BitmapDestroyDebrisSprite {
  patternBytes: number[]; // 32 bytes, 16x16 mode-2 quadrants
  colorBytes: number[];   // 16 bytes, per-line colours
}

export function bitmapDestroyTileEnabled(config: Msx2DestroyTileConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

export function bitmapDestroyTileRamBytes(config: Msx2DestroyTileConfig | undefined): number {
  if (!bitmapDestroyTileEnabled(config)) return 0;
  return 7 + MSX2_BITMAP_DESTROY_DEBRIS_SLOTS * DEBRIS_STRIDE + config!.destroyedLimit * 2;
}

export function buildBitmapDestroyTileEquates(
  config: Msx2DestroyTileConfig | undefined,
  opts: BitmapDestroyTileOptions,
): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  const base = opts.ramBase;
  const listBase = base + 7 + MSX2_BITMAP_DESTROY_DEBRIS_SLOTS * DEBRIS_STRIDE;
  return `; --- DESTROY TILE (dig) skill RAM (${bitmapDestroyTileRamBytes(config)} bytes at ${asmWord(base)}) ---
; Fixed region above the behavior map / #C2C0 command scratch; NOT part of the
; sub-#C1F0 skill chain (the persistence list would not fit there).
bitmap_destroy_cooldown  EQU ${asmWord(base)}
bitmap_destroy_lock      EQU ${asmWord(base + 1)}
bitmap_destroy_target    EQU ${asmWord(base + 2)}
bitmap_destroy_hits      EQU ${asmWord(base + 3)}
bitmap_destroy_anim      EQU ${asmWord(base + 4)}
bitmap_destroy_count     EQU ${asmWord(base + 5)}
bitmap_destroy_page      EQU ${asmWord(base + 6)}
bitmap_destroy_debris    EQU ${asmWord(base + 7)}
bitmap_destroy_list      EQU ${asmWord(listBase)}
bitmap_destroy_cmd_block EQU #C2C0
`;
}

export function buildBitmapDestroyTileInitClearAsm(config: Msx2DestroyTileConfig | undefined): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  const debrisClears = Array.from({ length: MSX2_BITMAP_DESTROY_DEBRIS_SLOTS }, (_u, i) =>
    `    ld (bitmap_destroy_debris + ${i * DEBRIS_STRIDE}), a`).join('\n');
  return `    ; destroy_tile: fresh game -> no cooldown, no target, empty destroyed list.
    xor a
    ld (bitmap_destroy_cooldown), a
    ld (bitmap_destroy_lock), a
    ld (bitmap_destroy_hits), a
    ld (bitmap_destroy_anim), a
    ld (bitmap_destroy_count), a
    ld (bitmap_destroy_page), a
${debrisClears}
    dec a
    ld (bitmap_destroy_target), a
`;
}

/** Main-loop gate after update_player_movement: debris step + dig input. */
export function buildBitmapDestroyTileGateAsm(config: Msx2DestroyTileConfig | undefined): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  return '    call bitmap_destroy_update\n';
}

/** SAT chain call (placed BEFORE the shoot bullet writer, like carry). */
export function buildBitmapDestroyTileSatCallAsm(config: Msx2DestroyTileConfig | undefined): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  return '    call bitmap_destroy_update_debris_sat\n';
}

/** Re-punch destroyed holes on the visible page (boot + dialogue/perception repaints). */
export function buildBitmapDestroyTileApplyVisibleCallAsm(config: Msx2DestroyTileConfig | undefined): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  return '    call bitmap_destroy_apply_visible    ; re-punch destroyed tiles on current page\n';
}

/** Re-punch destroyed holes on the hidden page before commit_room_flip publishes it. */
export function buildBitmapDestroyTileApplyPendingCallAsm(config: Msx2DestroyTileConfig | undefined): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  return '    call bitmap_destroy_apply_pending    ; re-punch destroyed tiles on hidden page before flip\n';
}

/** Boot-time upload of the debris chip pattern + the 4 debris slot colour tables. */
export function buildBitmapDestroyTileInitUploadAsm(
  config: Msx2DestroyTileConfig | undefined,
  opts: BitmapDestroyTileOptions,
): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  const patternVram = 0xf800 + opts.debrisPatternNumber * 8;
  const colorUploads = Array.from({ length: MSX2_BITMAP_DESTROY_DEBRIS_SLOTS }, (_u, i) => {
    const colorVram = opts.debrisColorBase + i * 16;
    return `    ld hl, bitmap_destroy_chip_color_data
    ld de, ${asmWord(colorVram)}
    ld bc, bitmap_destroy_chip_color_data_end - bitmap_destroy_chip_color_data
    call copy_to_vram_ext
`;
  }).join('');
  return `    ; destroy_tile: debris chip pattern (32 bytes) -> VRAM ${asmWord(patternVram)} + 4 slot colour tables
    ld hl, bitmap_destroy_chip_pattern_data
    ld de, ${asmWord(patternVram)}
    ld bc, bitmap_destroy_chip_pattern_data_end - bitmap_destroy_chip_pattern_data
    call copy_to_vram_ext
${colorUploads}`;
}

/** ROM data: per-room destructible masks, bg colours, chip sprite, velocities, sfx. */
export function buildBitmapDestroyTileDataAsm(
  config: Msx2DestroyTileConfig | undefined,
  opts: BitmapDestroyTileOptions,
  sprite: BitmapDestroyDebrisSprite | undefined,
): string {
  if (!bitmapDestroyTileEnabled(config)) return '';
  // Built-in fallback chip: a 3x3 pixel nugget in the top-left corner of the
  // 16x16 sprite (mode 2 quadrant layout: bytes 0..15 = left column rows 0..15).
  const fallbackPattern = Array(32).fill(0);
  fallbackPattern[0] = 0xe0;
  fallbackPattern[1] = 0xe0;
  fallbackPattern[2] = 0xe0;
  const pattern = sprite?.patternBytes && sprite.patternBytes.length === 32
    ? sprite.patternBytes
    : fallbackPattern;
  const colors = sprite?.colorBytes && sprite.colorBytes.length === 16
    ? sprite.colorBytes
    : Array(16).fill(14);
  const emit = (label: string, bytes: number[], comment: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b)).join(',')}`);
    }
    lines.push(`${label}_end:`);
    return lines.join('\n') + '\n';
  };
  const maskRows = opts.destructibleMasks.map((mask, roomIndex) =>
    emit(`bitmap_destroy_mask_room_${roomIndex}`, mask, `Room ${roomIndex} destructible cells (192 cells / 8 = 24 bytes, bit = cell & 7)`)
  ).join('');
  const sfxData = config!.digSound
    ? `; destroy_tile pick thud: PSG register/value pairs (mixer, period A #1E0, envelope decay)
bitmap_destroy_sfx_data:
    db 7,#3E,0,#E0,1,#01,11,#38,12,#00,8,#10,13,#09
`
    : '';
  return `${maskRows}bitmap_destroy_mask_ptrs:
${opts.destructibleMasks.map((_m, i) => `    DW bitmap_destroy_mask_room_${i}`).join('\n')}
; Per-room HMMV colour byte ((bg<<4)|bg) used when a tile dissolves.
bitmap_destroy_bg_table:
    DB ${opts.bgColorBytes.map(b => asmByte(b)).join(',')}
bitmap_destroy_bit_table:
    DB #01,#02,#04,#08,#10,#20,#40,#80
; Debris chip velocities per pool slot: vx, vy (signed px/frame; vy gains
; +1 every 4 frames until +3, so chips arc apart and rain down in ~1 second).
bitmap_destroy_vel_table:
    DB #FE,#FD, #02,#FD, #FF,#FE, #01,#FE
${emit('bitmap_destroy_chip_pattern_data', pattern, 'destroy_tile: 16x16 debris chip sprite pattern (mode 2 quadrants)')}${emit('bitmap_destroy_chip_color_data', colors, 'destroy_tile: 16-byte line colour table for the debris chip')}${sfxData}`;
}

/** The full destroy_tile runtime. Empty when the skill is disabled. */
export function buildBitmapDestroyTileRuntimeAsm(
  config: Msx2DestroyTileConfig | undefined,
  opts: BitmapDestroyTileOptions,
): string {
  if (!config || !bitmapDestroyTileEnabled(config)) return '';

  const key = DIG_KEYS[Math.max(0, Math.min(DIG_KEYS.length - 1, config.digKey))];
  const cooldown = Math.max(4, Math.min(60, config.digCooldown));
  const hitsPerTile = Math.max(1, Math.min(8, config.hitsPerTile));
  const animFrames = Math.min(cooldown, 12);
  const limit = Math.max(16, Math.min(128, config.destroyedLimit));
  const hb = opts.hitbox;
  // Pick reach: 4px beyond the hitbox edge. The walk moves in 2px steps, so the
  // player can stop up to 3px short of the cell boundary; probing just 1px past
  // the edge then lands in the player's OWN column and the wall is never hit
  // (caught by the OpenMSX smoke on a staircase wall). 4px still stays inside
  // the adjacent 16px cell when the player is flush against it.
  const rightProbeAdd = Math.max(1, Math.min(48, hb.x + hb.w + 3));
  const leftDelta = hb.x - 4;
  const topOffset = Math.max(0, Math.min(31, hb.y));
  const bottomOffset = Math.max(0, Math.min(47, hb.y + hb.h - 1));
  const gameYOffset = asmByte(opts.gameYOffset);
  const patternNumber = asmByte(opts.debrisPatternNumber);
  const satBase = asmWord(opts.debrisSatBase);

  const animAssert = typeof opts.digAnimId === 'number'
    ? `    ld a, ${opts.digAnimId}
    ld (player_anim_state), a    ; assert the 'digging' clip while the swing plays
`
    : '';
  const lockGate = config.requireKeyRelease
    ? `    ld a, (bitmap_destroy_lock)
    or a
    ret nz
    ld a, 1
    ld (bitmap_destroy_lock), a
`
    : '';
  // HL holds the collision-cell pointer across the hit path and the PSG sfx
  // clobbers HL: without the push/pop the destroy step wrote its collision
  // clear through a stale ROM address inside the Konami bank-switch window
  // (#6000+), silently remapping the resident data bank instead of opening
  // the cell (caught by the OpenMSX smoke).
  const sfxCall = config.digSound ? `    push hl
    call bitmap_destroy_sfx
    pop hl
` : '';
  const sfxRoutine = config.digSound
    ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_sfx
; ------------------------------------------------------------
; PURPOSE: pick-hit PSG thud (fire-and-forget register writes, no per-frame
;   engine; same pattern as the gem blip but a lower square tone).
; DESTROYS: AF, B, HL. PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_destroy_sfx:
    ld hl, bitmap_destroy_sfx_data
    ld b, 7
.dsfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .dsfx_loop
    ret
`
    : '';

  const leftProbeAsm = leftDelta < 0
    ? `    ld a, (player_x)
    sub ${-leftDelta}
    jp c, .dig_done          ; already at the room's left edge
`
    : `    ld a, (player_x)
    add a, ${leftDelta}
`;

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_key_pressed
; ------------------------------------------------------------
; PURPOSE: reads the dig key ('${key.label}', keyboard matrix row ${key.row} mask ${asmByte(key.mask)}) via PPI.
; OUTPUT: A = 1 when pressed (NZ), A = 0 otherwise (Z).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_destroy_key_pressed:
    in a, (PPI_C)
    and #F0
    or ${key.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(key.mask)}
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame destroy_tile driver: steps the debris chips, keeps the
;   'digging' animation asserted while a swing plays, ticks the swing
;   cooldown and, on the dig key, picks the destructible cell ahead
;   (top body cell first, then the bottom one).
;
; INPUT: player_x/player_y/player_facing, bitmap_room_collision_map,
;   bitmap_destroy_* state.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; ------------------------------------------------------------
bitmap_destroy_update:
    call bitmap_destroy_step_debris
    ; 'digging' pose while the swing timer runs.
    ld a, (bitmap_destroy_anim)
    or a
    jp z, .dig_no_anim
    dec a
    ld (bitmap_destroy_anim), a
${animAssert}.dig_no_anim:
    ; Swing cooldown tick.
    ld a, (bitmap_destroy_cooldown)
    or a
    jp z, .dig_cool_ready
    dec a
    ld (bitmap_destroy_cooldown), a
.dig_cool_ready:
    call bitmap_destroy_key_pressed
    or a
    jp nz, .dig_pressed
    xor a
    ld (bitmap_destroy_lock), a
    ret
.dig_pressed:
    ld a, (bitmap_destroy_cooldown)
    or a
    ret nz
${lockGate}    ; Front column: probe one pixel beyond the facing edge of the hitbox.
    ld a, (player_facing)
    or a
    jp z, .dig_face_left
    ld a, (player_x)
    add a, ${rightProbeAdd}
    jp c, .dig_done          ; past the right edge of the room
    jp .dig_col_ready
.dig_face_left:
${leftProbeAsm}.dig_col_ready:
    srl a
    srl a
    srl a
    srl a
    ld e, a                  ; E = front column (0..15)
    ; Candidate 1: TOP body cell ("primer el tile superior/davant").
    ld a, (player_y)
${topOffset > 0 ? `    add a, ${topOffset}\n` : ''}    srl a
    srl a
    srl a
    srl a
    ld d, a                  ; D = top row
    call bitmap_destroy_try_cell
    ret c                    ; swing landed
    ; Candidate 2: BOTTOM body cell (only when it is a different row).
    ld a, (player_y)
    add a, ${bottomOffset}
    srl a
    srl a
    srl a
    srl a
    cp d
    ret z                    ; same cell already probed
    ld d, a
    jp bitmap_destroy_try_cell
.dig_done:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_try_cell
; ------------------------------------------------------------
; PURPOSE:
;   Swing at cell (row D, column E). Lands only on a SOLID collision cell
;   whose atlas tile is marked destructible. Tracks the multi-hit target;
;   after ${hitsPerTile} hit(s) the tile dissolves (HMMV background fill on the
;   displayed page + collision/behavior cleared + persistence entry).
;
; INPUT: D = row, E = column. OUTPUT: carry SET when the swing landed.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; ------------------------------------------------------------
bitmap_destroy_try_cell:
    ld a, d
    cp 12
    jp nc, .dtc_miss
    ; C = cell index = row*16 + column.
    ld a, d
    add a, a
    add a, a
    add a, a
    add a, a
    add a, e
    ld c, a
    ; Solid?
    ld hl, bitmap_room_collision_map
    ld b, 0
    add hl, bc
    ld a, (hl)
    or a
    jp z, .dtc_miss
    ; Destructible in this room's mask?
    push hl
    ld a, c
    call bitmap_destroy_cell_flag
    pop hl
    jp z, .dtc_miss
    ; ---- swing landed ----
    ld a, ${cooldown}
    ld (bitmap_destroy_cooldown), a
    ld a, ${animFrames}
    ld (bitmap_destroy_anim), a
${sfxCall}    ; Multi-hit target tracking (switching cells restarts the count).
    ld a, (bitmap_destroy_target)
    cp c
    jp z, .dtc_same_target
    ld a, c
    ld (bitmap_destroy_target), a
    ld a, 1
    jp .dtc_store_hits
.dtc_same_target:
    ld a, (bitmap_destroy_hits)
    inc a
.dtc_store_hits:
    ld (bitmap_destroy_hits), a
    cp ${hitsPerTile}
    jp nc, .dtc_destroy
    ; Partial hit: sparks only (2 chips).
    push hl
    ld b, 2
    call bitmap_destroy_spawn_debris
    pop hl
    scf
    ret
.dtc_destroy:
    ; Dissolve: collision + behavior cells to 0 (HL still points at the cell).
    xor a
    ld (hl), a
    ld hl, bitmap_room_behavior_map
    ld b, 0
    add hl, bc
    ld (hl), a
    ld (bitmap_destroy_hits), a
    dec a
    ld (bitmap_destroy_target), a
    ; Visual fill on the currently displayed page.
    ld a, (bitmap_displayed_page)
    ld (bitmap_destroy_page), a
    push bc
    call bitmap_destroy_fill_cell
    pop bc
    ; Persist (room, cell) so the hole is re-punched on every room compose.
    ld a, (bitmap_destroy_count)
    cp ${limit}
    jp nc, .dtc_burst        ; list full: hole is visual-only for this visit
    ld l, a
    ld h, 0
    add hl, hl
    ld de, bitmap_destroy_list
    add hl, de
    ld a, (current_screen_index)
    ld (hl), a
    inc hl
    ld (hl), c
    ld a, (bitmap_destroy_count)
    inc a
    ld (bitmap_destroy_count), a
.dtc_burst:
    ld b, ${MSX2_BITMAP_DESTROY_DEBRIS_SLOTS}
    call bitmap_destroy_spawn_debris
    scf
    ret
.dtc_miss:
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_cell_flag
; ------------------------------------------------------------
; PURPOSE: test the current room's destructible bitmask for one cell.
; INPUT: A = cell index (0..191). OUTPUT: NZ when destructible.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_destroy_cell_flag:
    ld e, a
    ld d, 0
    push de                  ; save cell
    ld a, (current_screen_index)
    ld e, a
    ld hl, bitmap_destroy_mask_ptrs
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                  ; HL = room mask base
    pop de                   ; DE = cell
    ld a, e
    and 7
    push de
    push hl
    ld e, a
    ld hl, bitmap_destroy_bit_table
    add hl, de
    ld a, (hl)               ; A = bit mask for (cell & 7)
    pop hl
    pop de
    srl e
    srl e
    srl e                    ; DE = cell >> 3 (byte index, D stays 0)
    add hl, de
    and (hl)
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_fill_cell
; ------------------------------------------------------------
; PURPOSE:
;   Build + launch an HMMV that fills cell C with the room background colour
;   on page bitmap_destroy_page. 15-byte block in the shared #C2C0 scratch
;   (all launches in this engine are sequential in the main loop).
;
; INPUT: C = cell index, bitmap_destroy_page = 0/1.
; DESTROYS: AF, B, DE, HL. PRESERVES: C, IX, IY.
; SIDE EFFECTS: waits for the previous VDP command; restores R#15 = S#0.
; ------------------------------------------------------------
bitmap_destroy_fill_cell:
    ld hl, bitmap_destroy_cmd_block
    xor a
    ld b, 4                  ; SX (2) + SY (2) = 0 (unused by HMMV)
.dfc_zero:
    ld (hl), a
    inc hl
    djnz .dfc_zero
    ld a, c
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld (hl), a               ; DX low = (cell & 15) * 16
    inc hl
    xor a
    ld (hl), a               ; DX high
    inc hl
    ld a, c
    and #F0                  ; (cell >> 4) * 16 in one mask
    add a, ${gameYOffset}
    ld (hl), a               ; DY low = row*16 + HUD band offset
    inc hl
    ld a, (bitmap_destroy_page)
    ld (hl), a               ; DY high = page (0 -> Y 0..255, 1 -> Y 256..511)
    inc hl
    ld a, 16
    ld (hl), a               ; NX = 16
    inc hl
    xor a
    ld (hl), a
    inc hl
    ld a, 16
    ld (hl), a               ; NY = 16
    inc hl
    xor a
    ld (hl), a
    inc hl
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    push hl
    ld hl, bitmap_destroy_bg_table
    add hl, de
    ld a, (hl)
    pop hl
    ld (hl), a               ; CLR = (bg<<4)|bg
    inc hl
    xor a
    ld (hl), a               ; ARG
    inc hl
    ld a, #C0
    ld (hl), a               ; CMD = HMMV
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_destroy_cmd_block
    ld b, 15
.dfc_launch:
    ld a, (hl)
    out (VDP_CMD_PORT), a
    inc hl
    djnz .dfc_launch
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_spawn_debris
; ------------------------------------------------------------
; PURPOSE: activate up to B debris chips at the centre of cell C, each free
;   pool slot taking the next velocity pair from the table.
; INPUT: B = chips to spawn, C = cell index.
; DESTROYS: AF, B, DE, HL, IX. PRESERVES: C, IY.
; ------------------------------------------------------------
bitmap_destroy_spawn_debris:
    ld a, c
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    add a, 4
    ld d, a                  ; D = chip x (cell centre-ish)
    ld a, c
    and #F0
    add a, 4
    ld e, a                  ; E = chip y
    ld ix, bitmap_destroy_debris
    ld hl, bitmap_destroy_vel_table
    push bc
    ld c, ${MSX2_BITMAP_DESTROY_DEBRIS_SLOTS}
.dsp_loop:
    ld a, (ix+0)
    or a
    jp nz, .dsp_next
    ld a, ${DEBRIS_TTL}
    ld (ix+0), a
    ld (ix+1), d
    ld (ix+2), e
    ld a, (hl)
    ld (ix+3), a
    inc hl
    ld a, (hl)
    ld (ix+4), a
    dec hl
    dec b
    jp z, .dsp_done
.dsp_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    inc hl
    inc hl
    dec c
    jp nz, .dsp_loop
.dsp_done:
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_step_debris
; ------------------------------------------------------------
; PURPOSE: advance live debris chips: x += vx every frame, vy gains +1 every
;   4 frames (capped at +3), y += vy; chips die on ttl 0 or leaving the band.
; DESTROYS: AF, B, IX. PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_destroy_step_debris:
    ld ix, bitmap_destroy_debris
    ld b, ${MSX2_BITMAP_DESTROY_DEBRIS_SLOTS}
.dst_loop:
    ld a, (ix+0)
    or a
    jp z, .dst_next
    dec a
    ld (ix+0), a
    jp z, .dst_next          ; expired this frame
    ld a, (ix+1)
    add a, (ix+3)
    ld (ix+1), a
    ld a, (ix+0)
    and 3
    jp nz, .dst_fall
    ld a, (ix+4)
    cp 3
    jp z, .dst_fall
    inc a
    ld (ix+4), a
.dst_fall:
    ld a, (ix+2)
    add a, (ix+4)
    ld (ix+2), a
    cp 192
    jp c, .dst_next
    xor a                    ; fell below the band (or wrapped above): kill
    ld (ix+0), a
.dst_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .dst_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_update_debris_sat
; ------------------------------------------------------------
; PURPOSE: write the ${MSX2_BITMAP_DESTROY_DEBRIS_SLOTS} debris SAT slots (hidden chips park at Y ${asmByte(DEBRIS_HIDDEN_SPRITE_Y)},
;   the same off-screen non-terminator Y the other systems use) plus a #D8
;   terminator; when shoot is active its bullet writer runs after this one
;   and overwrites the terminator with the first bullet slot.
; OUTPUT: SAT entries at VRAM ${satBase} onwards.
; DESTROYS: AF, DE, HL, IX. PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_destroy_update_debris_sat:
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
    ld ix, bitmap_destroy_debris
    ld b, ${MSX2_BITMAP_DESTROY_DEBRIS_SLOTS}
.dsat_loop:
    ld a, (ix+0)
    or a
    jp z, .dsat_hidden
    ld a, (ix+2)
    add a, ${gameYOffset}
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, ${patternNumber}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .dsat_next
.dsat_hidden:
    ld a, ${asmByte(DEBRIS_HIDDEN_SPRITE_Y)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.dsat_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .dsat_loop
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

; ------------------------------------------------------------
; FUNCTION: bitmap_destroy_apply_visible / bitmap_destroy_apply_pending
; ------------------------------------------------------------
; PURPOSE:
;   Re-punch every destroyed tile of the CURRENT room: clear its collision +
;   behavior cells (the room loaders just re-copied the pristine ROM grids)
;   and HMMV-fill the cell on the target page. Runs at boot, on the hidden
;   page inside commit_room_flip, and on dialogue/perception repaints. Also
;   resets the in-progress swing target and despawns stale debris chips.
;
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_destroy_apply_visible:
    ld a, (bitmap_displayed_page)
    jp bitmap_destroy_apply_page
bitmap_destroy_apply_pending:
    ld a, (bitmap_pending_display_page)
bitmap_destroy_apply_page:
    ld (bitmap_destroy_page), a
    ld a, #FF
    ld (bitmap_destroy_target), a
    xor a
    ld (bitmap_destroy_hits), a
    ld (bitmap_destroy_anim), a
${Array.from({ length: MSX2_BITMAP_DESTROY_DEBRIS_SLOTS }, (_u, i) => `    ld (bitmap_destroy_debris + ${i * DEBRIS_STRIDE}), a`).join('\n')}
    ld a, (bitmap_destroy_count)
    or a
    ret z
    ld b, a
    ld hl, bitmap_destroy_list
.dap_loop:
    ld a, (current_screen_index)
    cp (hl)
    inc hl
    ld c, (hl)
    inc hl
    jp nz, .dap_next
    push hl
    push bc
    ld hl, bitmap_room_collision_map
    ld b, 0
    add hl, bc
    ld (hl), 0
    ld hl, bitmap_room_behavior_map
    add hl, bc
    ld (hl), 0
    call bitmap_destroy_fill_cell
    pop bc
    pop hl
.dap_next:
    djnz .dap_loop
    ret
${sfxRoutine}`;
}
