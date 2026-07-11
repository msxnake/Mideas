/**
 * SCREEN 5 bitmap-room MOVING PLATFORM runtime.
 *
 * Each placed `kind: 'platform'` entity becomes one LOGICAL platform: a
 * hardware-sprite body 16 or 32 px wide (1-2 sprite mode 2 cells) that
 * ping-pongs between its patrol bounds at 1 px/frame, exactly like the enemy
 * PATROL handler (check-then-move, so positions never overshoot). Platforms
 * are one-way: the player passes through from below/sides and only "lands"
 * when falling with the feet inside the stand window over the platform top.
 * While riding, the player is re-snapped to the platform top every frame and
 * carried horizontally through bitmap_try_move_x (walls still block).
 *
 * Main-loop contract (see msx2Screen5BitmapRoomGenerator):
 *   bitmap_update_platforms   BEFORE update_player_movement (move + carry rider)
 *   bitmap_platform_ride_detect AFTER update_player_movement (land / drop check)
 *   bitmap_update_platform_sat  after the enemy SAT writer, before the bullets
 *
 * VRAM: platform SAT slots sit right after the enemy slots; pattern groups
 * after the enemy groups; 16-byte line-colour blocks after the enemy blocks.
 * Colours are static (frame 0 only) so they upload once per room load.
 *
 * RAM (chained after the enemy pool, below the #C1F0 ceiling):
 *   bitmap_platform_count  1 byte   active logical platforms in this room
 *   bitmap_platform_rider  1 byte   pool index the player stands on (#FF none)
 *   bitmap_platform_pool   11 bytes/slot: x, y, dx, dy, minX, maxX, minY, maxY,
 *                          widthCells, movedX, movedY
 *
 * ROM (resident):
 *   bitmap_room_platform_table_N  1 + maxSlots*11 bytes: count + per-slot
 *                                 x,y,dx,dy,minX,maxX,minY,maxY,widthCells,
 *                                 patOff,colorOff
 *   bitmap_room_platform_ptr_table  DW per room
 *   bitmap_platform_sprite_patterns 32 bytes per unique platform cell
 *   bitmap_platform_sprite_colors   16 bytes per unique platform cell
 */

export const BITMAP_MAX_PLATFORM_SLOTS = 3;
const POOL_STRIDE = 11;  // RAM bytes per logical platform
const TABLE_STRIDE = 11; // ROM bytes per logical platform
/** Same off-screen non-terminator Y the foreground/enemy empty slots use. */
const PLATFORM_EMPTY_SPRITE_Y = 0xD4;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapPlatformRoomData {
  /** Max logical platform slots used by any room (0 disables the system). */
  maxSlots: number;
  /** Max cells (16px columns) across every platform sprite: 1 or 2. */
  maxCells: number;
  /** Per-room table bytes: [count] + maxSlots * TABLE_STRIDE. */
  roomTables: number[][];
  /** 32 bytes per unique platform cell pattern. */
  patternBytes: number[];
  /** 16 bytes per unique platform cell line-colour table. */
  colorBytes: number[];
}

export interface BitmapPlatformRuntimeOptions {
  ramBase: number;
  /** First platform SAT entry (after foreground + player layers + enemies). */
  satBase: number;
  /** First platform 16-byte colour block (mirrors satBase slot order). */
  colorBase: number;
  /** First V9938 sprite pattern group reserved for platform cells. */
  patternGroupBase: number;
  /** HUD band offset added to logical Y before the SAT write. */
  gameYOffset: number;
  /** Player body hitbox in local player coordinates. */
  playerHitbox: { x: number; y: number; w: number; h: number };
  /** Player terminal fall speed in px/frame (stand window must cover it). */
  terminalFallPx: number;
  /** Early-return gate prepended to the movement/detect routines (e.g. the
   * NPC dialogue pause). Empty when no pausing system exists in this ROM. */
  pauseGateAsm?: string;
}

export interface BitmapPlatformSystemAsm {
  enabled: boolean;
  ramBytes: number;
  /** Hardware SAT entries consumed (maxSlots * maxCells). */
  hardwareSlotCount: number;
  equates: string;
  /** `call bitmap_load_platforms` — after load_room at init and on room commit. */
  loadCallAsm: string;
  /** `call bitmap_update_platforms` — BEFORE update_player_movement. */
  updateCallAsm: string;
  /** `call bitmap_platform_ride_detect` — right AFTER update_player_movement. */
  detectCallAsm: string;
  /** `call bitmap_update_platform_sat` — after the enemy SAT writer, before bullets. */
  satCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

export function bitmapPlatformSystemEnabled(data: BitmapPlatformRoomData | undefined): boolean {
  return Boolean(data && data.maxSlots > 0);
}

export function buildBitmapPlatformSystemAsm(
  data: BitmapPlatformRoomData,
  opts: BitmapPlatformRuntimeOptions,
): BitmapPlatformSystemAsm {
  if (!bitmapPlatformSystemEnabled(data)) {
    return { enabled: false, ramBytes: 0, hardwareSlotCount: 0, equates: '', loadCallAsm: '', updateCallAsm: '', detectCallAsm: '', satCallAsm: '', routinesAsm: '', dataAsm: '' };
  }
  const maxSlots = data.maxSlots;
  const maxCells = Math.max(1, Math.min(2, data.maxCells));
  const hardwareSlotCount = maxSlots * maxCells;
  const ramBytes = 2 + maxSlots * POOL_STRIDE;
  const countAddr = opts.ramBase;
  const riderAddr = opts.ramBase + 1;
  const poolAddr = opts.ramBase + 2;

  // Feet line = player_y + standOffset (first pixel row below the body).
  // Riding keeps player_y = platformTop - standOffset.
  const hitbox = opts.playerHitbox;
  const standOffset = Math.max(1, Math.min(32, (Math.floor(hitbox.y) || 0) + (Math.floor(hitbox.h) || 16)));
  const hbLeft = Math.max(0, Math.min(31, Math.floor(hitbox.x) || 0));
  const hbRight = Math.max(hbLeft, Math.min(63, hbLeft + (Math.floor(hitbox.w) || 16) - 1));
  // delta = feetLine - platformTop is accepted in [-2 .. terminal+2]: the +2
  // below covers a platform that moved up under the player this frame; the
  // upper bound covers the worst per-frame fall so landing cannot tunnel.
  const rideWindow = Math.max(3, Math.min(24, (Math.floor(opts.terminalFallPx) || 4) + 2));
  const deltaBias = 2;
  const deltaSpan = rideWindow + deltaBias + 1; // cp bound (exclusive)

  const equates = `; --- MOVING PLATFORM runtime state (${ramBytes} bytes): count + rider + ${maxSlots} slot(s) x ${POOL_STRIDE}
; (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,movedX,movedY) ---
bitmap_platform_count EQU ${asmWord(countAddr)}
bitmap_platform_rider EQU ${asmWord(riderAddr)}
bitmap_platform_pool  EQU ${asmWord(poolAddr)}
`;

  // ---- bitmap_load_platforms: per-room table -> RAM pool + VRAM uploads ----
  const loadSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const patternGroup = opts.patternGroupBase + i * maxCells;
    const patternVram = 0xF800 + patternGroup * 32;
    const colorVram = opts.colorBase + i * maxCells * 16;
    const poolBase = `bitmap_platform_pool + ${i * POOL_STRIDE}`;
    return `.bplat_slot_${i}:
    ld a, (bitmap_platform_count)
    cp ${i + 1}
    jp c, .bplat_slot_${i}_done      ; slot unused in this room
    push ix
    pop hl
    ld de, ${poolBase}
    ld bc, 9
    ldir                      ; x..widthCells
    xor a
    ld (${poolBase} + 9), a   ; movedX = 0
    ld (${poolBase} + 10), a  ; movedY = 0
    ; --- upload widthCells pattern groups -> VRAM ${asmWord(patternVram)} (group ${patternGroup}+) ---
    ld a, (ix+9)              ; patOff, in 32-byte groups
    call bitmap_platform_patterns_offset
    ld a, (ix+8)              ; widthCells
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32 bytes/group
    ld b, h
    ld c, l
    pop hl
    ld de, ${asmWord(patternVram)}
    call copy_to_vram_ext
    ; --- upload widthCells 16-byte colour tables -> VRAM ${asmWord(colorVram)} ---
    ld a, (ix+10)             ; colorOff, in 16-byte blocks
    call bitmap_platform_colors_offset
    ld a, (ix+8)              ; widthCells
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16 bytes/block
    ld b, h
    ld c, l
    pop hl
    ld de, ${asmWord(colorVram)}
    call copy_to_vram_ext
.bplat_slot_${i}_done:
    ld de, ${TABLE_STRIDE}
    add ix, de`;
  }).join('\n');

  // ---- shared stand test: IX = platform slot -> NZ when the player stands on it ----
  const standCheckAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_platform_player_on_slot
; ------------------------------------------------------------
; PURPOSE: Tests whether the player currently stands on the platform slot at
;   IX: horizontal body overlap with the platform span (widthCells*16 px) AND
;   feet line within the one-way stand window over the platform top
;   (delta = feet - top accepted in [-${deltaBias}..${rideWindow}]).
; INPUT: IX -> pool slot, player_x/player_y.
; OUTPUT: A=1 and NZ when standing, A=0 and Z otherwise.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
; ------------------------------------------------------------
bitmap_platform_player_on_slot:
    ; platRight (exclusive, clamped to 255) = platX + widthCells*16
    ld a, (ix+8)
    add a, a
    add a, a
    add a, a
    add a, a                  ; widthCells * 16
    ld e, a
    ld a, (ix+0)
    ld d, a                   ; D = platLeft
    add a, e
    jp nc, .plat_right_ok
    ld a, 255
.plat_right_ok:
    ld e, a                   ; E = platRight (exclusive)
    ; playerLeft < platRight ?
    ld a, (player_x)
${hbLeft ? `    add a, ${hbLeft}\n` : ''}    cp e
    jp nc, .not_standing      ; playerLeft >= platRight -> separated
    ; playerRight (inclusive) >= platLeft ?
    ld a, (player_x)
    add a, ${hbRight}
    cp d
    jp c, .not_standing       ; playerRight < platLeft -> separated
    ; feet delta: A = player_y + ${standOffset} - platTop, accepted in [-${deltaBias}..${rideWindow}]
    ld a, (player_y)
    add a, ${standOffset}
    sub (ix+1)
    add a, ${deltaBias}
    cp ${deltaSpan}
    jp nc, .not_standing
    ld a, 1
    or a
    ret
.not_standing:
    xor a
    ret
`;

  // ---- bitmap_update_platforms: patrol step + carry the rider ----
  const updateAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_platforms
; ------------------------------------------------------------
; PURPOSE: Steps every active platform slot with the PATROL rules (1 px/frame,
;   turn at the bounds without moving) recording the applied per-frame delta
;   in movedX/movedY, then carries the riding player: horizontal carry goes
;   through bitmap_try_move_x (walls still block), vertical follow re-snaps
;   player_y to the platform top. Runs BEFORE update_player_movement so the
;   player input/gravity acts on the carried position. Paused entirely while
;   a pause gate holds (e.g. an open NPC dialogue).
; INPUT: bitmap_platform_count/pool/rider, player_x/player_y.
; OUTPUT: pool x/y/dx/dy/movedX/movedY updated; rider carried or dropped.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_update_platforms:
${opts.pauseGateAsm || ''}    ld a, (bitmap_platform_count)
    or a
    ret z
    ld b, a
    ld ix, bitmap_platform_pool
.plat_step_loop:
    xor a
    ld (ix+9), a              ; movedX = 0
    ld (ix+10), a             ; movedY = 0
    ; --- X axis ---
    ld a, (ix+2)              ; dx
    or a
    jp z, .plat_step_y
    bit 7, a
    jp nz, .plat_step_left
    ld a, (ix+0)
    cp (ix+5)                 ; x vs maxX
    jp nc, .plat_turn_left
    inc (ix+0)
    ld (ix+9), #01
    jp .plat_step_y
.plat_turn_left:
    ld (ix+2), #FF
    jp .plat_step_y
.plat_step_left:
    ld a, (ix+0)
    cp (ix+4)                 ; x vs minX
    jp z, .plat_turn_right
    jp c, .plat_turn_right
    dec (ix+0)
    ld (ix+9), #FF
    jp .plat_step_y
.plat_turn_right:
    ld (ix+2), #01
.plat_step_y:
    ; --- Y axis ---
    ld a, (ix+3)              ; dy
    or a
    jp z, .plat_step_next
    bit 7, a
    jp nz, .plat_step_up
    ld a, (ix+1)
    cp (ix+7)                 ; y vs maxY
    jp nc, .plat_turn_up
    inc (ix+1)
    ld (ix+10), #01
    jp .plat_step_next
.plat_turn_up:
    ld (ix+3), #FF
    jp .plat_step_next
.plat_step_up:
    ld a, (ix+1)
    cp (ix+6)                 ; y vs minY
    jp z, .plat_turn_down
    jp c, .plat_turn_down
    dec (ix+1)
    ld (ix+10), #FF
    jp .plat_step_next
.plat_turn_down:
    ld (ix+3), #01
.plat_step_next:
    ld de, ${POOL_STRIDE}
    add ix, de
    dec b
    jp nz, .plat_step_loop
    ; --- carry the rider (if any) with the platform it stands on ---
    ld a, (bitmap_platform_rider)
    cp #FF
    ret z
    call bitmap_platform_slot_ptr
    ; re-validate: a respawn/teleport since the last detect must not snap the
    ; player back onto the platform from anywhere on the screen.
    call bitmap_platform_player_on_slot
    jp nz, .plat_carry_valid
    ld a, #FF
    ld (bitmap_platform_rider), a
    ret
.plat_carry_valid:
    ld a, (ix+9)              ; movedX
    or a
    jp z, .plat_carry_vertical
    push ix
    call bitmap_try_move_x    ; A = signed 1px dx; walls still block the rider
    pop ix
.plat_carry_vertical:
    ; vertical follow: keep the feet exactly on the platform top
    ld a, (ix+1)
    sub ${standOffset}
    ld (player_y), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld a, (player_flags)
    or #01                    ; riding counts as grounded (jump works)
    ld (player_flags), a
    ret

; HL/IX = bitmap_platform_pool + A * ${POOL_STRIDE} (A = slot index).
bitmap_platform_slot_ptr:
    ld l, a
    ld h, 0
    ld e, l
    ld d, h
    add hl, hl                ; 2x
    ld c, l
    ld b, h
    add hl, hl                ; 4x
    add hl, hl                ; 8x
    add hl, bc                ; 10x
    add hl, de                ; 11x
    ld de, bitmap_platform_pool
    add hl, de
    push hl
    pop ix
    ret
`;

  // ---- bitmap_platform_ride_detect: land on / drop off, after movement ----
  const detectAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_platform_ride_detect
; ------------------------------------------------------------
; PURPOSE: Runs right AFTER update_player_movement. While the player moves up
;   (jump) the rider is released so one-way pass-through works. Otherwise the
;   first platform whose stand window contains the player's feet becomes the
;   rider: the player snaps onto the top, vertical velocity clears and the
;   grounded flag is asserted. No platform under the feet clears the rider.
; INPUT: bitmap_platform_count/pool, player_x/player_y/player_vy.
; OUTPUT: bitmap_platform_rider, player_y/player_vy/player_vy_frac/player_flags.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_platform_ride_detect:
${opts.pauseGateAsm || ''}    ld a, (player_vy)
    bit 7, a
    jp nz, .detect_clear      ; moving up: never grab a platform
    ld a, (player_y)
    cp 192
    jp nc, .detect_clear      ; wrapped above the top edge: ignore platforms
    ld a, (bitmap_platform_count)
    or a
    jp z, .detect_clear
    ld b, a
    ld c, 0                   ; C = slot index
    ld ix, bitmap_platform_pool
.detect_loop:
    call bitmap_platform_player_on_slot
    jp nz, .detect_stand
    inc c
    ld de, ${POOL_STRIDE}
    add ix, de
    dec b
    jp nz, .detect_loop
.detect_clear:
    ld a, #FF
    ld (bitmap_platform_rider), a
    ret
.detect_stand:
    ld a, (ix+1)
    sub ${standOffset}
    ld (player_y), a          ; snap the feet onto the platform top
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld a, (player_flags)
    or #01
    ld (player_flags), a
    ld a, c
    ld (bitmap_platform_rider), a
    ret
`;

  // ---- bitmap_update_platform_sat: fixed slots after the enemy block ----
  const satSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const cellBlocks = Array.from({ length: maxCells }, (_unusedCell, j) => {
      const patternByte = ((opts.patternGroupBase + i * maxCells + j) * 4) & 0xff;
      const poolBase = `bitmap_platform_pool + ${i * POOL_STRIDE}`;
      const hiddenGate = j === 0
        ? `    ld a, (bitmap_platform_count)
    cp ${i + 1}
    jp c, .sat_slot_${i}_${j}_hidden`
        : `    ld a, (bitmap_platform_count)
    cp ${i + 1}
    jp c, .sat_slot_${i}_${j}_hidden
    ld a, (${poolBase} + 8)   ; widthCells
    cp ${j + 1}
    jp c, .sat_slot_${i}_${j}_hidden`;
      return `.sat_slot_${i}_${j}:
${hiddenGate}
    ld a, (${poolBase} + 1)
    add a, ${opts.gameYOffset}
    out (VDP_DATA_PORT), a    ; Y
    ld a, (${poolBase})
${j > 0 ? `    add a, ${j * 16}\n` : ''}    out (VDP_DATA_PORT), a    ; X (cell ${j})
    ld a, ${asmByte(patternByte)}
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_${i}_${j}_end
.sat_slot_${i}_${j}_hidden:
    ld a, ${asmByte(PLATFORM_EMPTY_SPRITE_Y)}
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_${i}_${j}_end:`;
    }).join('\n');
    return cellBlocks;
  }).join('\n');

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_load_platforms
; ------------------------------------------------------------
; PURPOSE: Loads the platform slots of the ACTIVE room: copies the per-room
;   ROM table into the mutable RAM pool, releases the rider and uploads each
;   used slot's cell pattern/colour tables to its reserved VRAM groups.
;   Called after load_room at init and on every room-transition commit.
; INPUT: current_screen_index.
; OUTPUT: bitmap_platform_count/rider/pool + VRAM pattern groups ${opts.patternGroupBase}..${opts.patternGroupBase + hardwareSlotCount - 1}.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY (IX saved/restored).
; CALLS: copy_to_vram_ext, bitmap_platform_patterns_offset, bitmap_platform_colors_offset.
; ------------------------------------------------------------
bitmap_load_platforms:
    push ix
    ld a, #FF
    ld (bitmap_platform_rider), a
    ld hl, bitmap_room_platform_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (hl)                ; count byte
    ld (bitmap_platform_count), a
    inc hl
    push hl
    pop ix                    ; IX -> slot 0 (${TABLE_STRIDE} bytes/slot)
${loadSlotBlocks}
    pop ix
    ret

; HL = bitmap_platform_sprite_patterns + A*32 (A = pattern group offset).
bitmap_platform_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32
    ld de, bitmap_platform_sprite_patterns
    add hl, de
    ret

; HL = bitmap_platform_sprite_colors + A*16 (A = color block offset).
bitmap_platform_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16
    ld de, bitmap_platform_sprite_colors
    add hl, de
    ret
${standCheckAsm}${updateAsm}${detectAsm}
; ------------------------------------------------------------
; FUNCTION: bitmap_update_platform_sat
; ------------------------------------------------------------
; PURPOSE: Writes the ${hardwareSlotCount} fixed platform SAT slot(s) at VRAM ${asmWord(opts.satBase)}
;   (right after the enemy block, overwriting the previous writer's
;   terminator), then appends a #D8 terminator. Unused slots/cells get an
;   off-screen Y=${asmByte(PLATFORM_EMPTY_SPRITE_Y)} sprite so the VDP keeps scanning. The bullet
;   writer (when the shoot skill is active) runs AFTER this and overwrites our
;   terminator in turn. Platform colours are static, uploaded at room load.
; INPUT: bitmap_platform_count, bitmap_platform_pool.
; OUTPUT: SAT entries at VRAM ${asmWord(opts.satBase)}..${asmWord(opts.satBase + hardwareSlotCount * 4 + 3)}.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_update_platform_sat:
    push de
    ld de, ${asmWord(opts.satBase)}
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
${satSlotBlocks}
    ld a, #D8
    out (VDP_DATA_PORT), a    ; terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ret
`;

  const emitBytes = (label: string, bytes: number[], comment: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b & 0xff)).join(',')}`);
    }
    return lines.join('\n') + '\n';
  };
  const dataAsm = data.roomTables.map((table, index) =>
    emitBytes(`bitmap_room_platform_table_${index}`, table, `Room ${index} platforms: count + ${maxSlots} slot(s) x ${TABLE_STRIDE} (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)`)
  ).join('')
    + `bitmap_room_platform_ptr_table:\n${data.roomTables.map((_t, index) => `    DW bitmap_room_platform_table_${index}`).join('\n')}\n`
    + emitBytes('bitmap_platform_sprite_patterns', data.patternBytes, `Platform sprites: ${data.patternBytes.length / 32} pattern group(s) (mode 2 quadrants, frame 0 only)`)
    + emitBytes('bitmap_platform_sprite_colors', data.colorBytes, 'Platform sprites: 16-byte line colour tables per cell (frame 0 only)');

  return {
    enabled: true,
    ramBytes,
    hardwareSlotCount,
    equates,
    loadCallAsm: '    call bitmap_load_platforms\n',
    updateCallAsm: '    call bitmap_update_platforms\n',
    detectCallAsm: '    call bitmap_platform_ride_detect\n',
    satCallAsm: '    call bitmap_update_platform_sat\n',
    routinesAsm,
    dataAsm,
  };
}
