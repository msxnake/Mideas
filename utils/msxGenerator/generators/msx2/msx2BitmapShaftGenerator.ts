/**
 * SCREEN 5 bitmap-room MULTI-SCREEN SHAFT ("pou") runtime.
 *
 * One authored entity is ONE elevator that travels across several rooms, instead
 * of the legacy design where each room held its own twin platform and a latch
 * relayed the ride at the edge. The author places the entity once and gives it an
 * ordered `path` of rooms, BOTTOM FIRST: path[0] is the lowest room, path[n-1]
 * the highest.
 *
 * COORDINATES
 *   The elevator position is a pair (slot, y), both 8-bit:
 *     slot = index into the path, y = normal SCREEN 5 room-local Y (0 = top of
 *     the game band, 191 = bottom).
 *   A global 16-bit Y was considered and rejected: player_y and the SAT Y are
 *   both 8-bit and room-relative, so a global Y would need a divide by 192 (not a
 *   power of two) every frame plus 16-bit bound compares, and every ride test
 *   would have to convert back. The editor may still SHOW a global number; it is
 *   normalised to this pair before it reaches the ROM.
 *
 *   Because path[0] is the bottom room, "higher up the shaft" means a GREATER
 *   slot and, within one room, a SMALLER y. That ordering is what
 *   `shaft_cmp_above` implements and every bound test uses.
 *
 * SIMULATION
 *   The elevator runs every frame whatever room is displayed, so leaving it
 *   climbing and coming back later finds it where it should be. It is drawn only
 *   while path[slot] is the displayed room; otherwise its SAT slot is parked
 *   off-screen. Nothing here is reset by a room load: `bitmap_shaft_init` runs
 *   once at boot.
 *
 * ROOM CROSSING
 *   Crossing a room boundary is `y` wrapping over 191 / under 0 with slot -1/+1.
 *   If the player is riding when that happens the elevator drives the room
 *   change itself: the shaft path is authored independently of the worldmap, so
 *   the rail table cannot be trusted to hold that link. The target room is left
 *   in `bitmap_shaft_forced_room` and consumed by start_room_transition, which
 *   then ignores its own rail lookup.
 *
 * RAM (4 bytes per shaft):
 *   bitmap_shaft_slot   path index the cabin is in
 *   bitmap_shaft_y      room-local Y of the cabin top
 *   bitmap_shaft_dir    0 = climbing (y decreases), 1 = descending
 *   bitmap_shaft_rider  1 while the player stands on it, 0 otherwise
 *   bitmap_shaft_forced_room  shared, 1 byte: target room for the next
 *                       start_room_transition, #FF = use the normal rail.
 *
 * ROM (resident):
 *   bitmap_shaft_path_N   1 + n bytes: room count + room indices, bottom first
 *   bitmap_shaft_def_N    bounds, start position/direction, speed, x, geometry
 *   bitmap_shaft_sprite_patterns / _colors  as the moving-platform tables
 */

/** Rooms are 192 px tall in the SCREEN 5 game band. */
const SHAFT_ROOM_HEIGHT = 192;
/** Same off-screen non-terminator Y the platform/enemy empty slots use. */
const SHAFT_EMPTY_SPRITE_Y = 0xd4;
/** Keeps RAM, SAT slots and pattern groups bounded. */
export const BITMAP_MAX_SHAFTS = 2;
/** Bytes per shaft in RAM: slot, y, dir, rider. */
const SHAFT_RAM_STRIDE = 4;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xffff, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** One authored elevator, already normalised to (slot, y) pairs. */
export interface BitmapShaftDef {
  /** Room indices in travel order, BOTTOM FIRST. */
  path: number[];
  /** Lowest point of travel (greatest y in the smallest slot it reaches). */
  bottomSlot: number;
  bottomY: number;
  /** Highest point of travel. */
  topSlot: number;
  topY: number;
  /** Where the cabin sits at boot, and which way it is going. */
  startSlot: number;
  startY: number;
  /** 0 = climbing, 1 = descending. */
  startDir: number;
  /** Pixels per frame, 1..4. */
  speed: number;
  /** Fixed column (the cabin only moves vertically). */
  x: number;
  /** 1 or 2 hardware sprite cells (16 or 32 px wide). */
  widthCells: number;
  /** Offsets into the shared shaft pattern/colour tables. */
  patOff: number;
  colorOff: number;
}

export interface BitmapShaftRoomData {
  shafts: BitmapShaftDef[];
  /** 32 bytes per unique shaft cell pattern. */
  patternBytes: number[];
  /** 16 bytes per unique shaft cell line-colour table. */
  colorBytes: number[];
}

export interface BitmapShaftRuntimeOptions {
  ramBase: number;
  /** First shaft SAT entry. */
  satBase: number;
  /** First shaft 16-byte colour block (mirrors satBase slot order). */
  colorBase: number;
  /** First V9938 sprite pattern group reserved for shaft cells. */
  patternGroupBase: number;
  /** HUD band offset added to logical Y before the SAT write. */
  gameYOffset: number;
  /** Player hitbox, for the one-way stand test. */
  playerHitbox: { x: number; y: number; w: number; h: number };
  /** Worst per-frame fall, so landing cannot tunnel through the cabin. */
  terminalFallPx: number;
  /** Emitted before any motion, so a dialogue/pause freezes the shaft too. */
  pauseGateAsm?: string;
}

export interface BitmapShaftSystemAsm {
  enabled: boolean;
  ramBytes: number;
  hardwareSlotCount: number;
  equates: string;
  /** Boot-only: seed every cabin. Never re-run on a room load. */
  initCallAsm: string;
  /** BEFORE update_player_movement: move the cabins and carry the rider. */
  updateCallAsm: string;
  /** Right AFTER update_player_movement: land / drop check. */
  detectCallAsm: string;
  /** After the enemy SAT writer, before the bullets. */
  satCallAsm: string;
  /** From the tail of commit_room_flip: re-snap a rider that changed room. */
  commitCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

export function bitmapShaftSystemEnabled(data: BitmapShaftRoomData | undefined): boolean {
  return Boolean(data && data.shafts.length > 0);
}

const DISABLED: BitmapShaftSystemAsm = {
  enabled: false,
  ramBytes: 0,
  hardwareSlotCount: 0,
  equates: '',
  initCallAsm: '',
  updateCallAsm: '',
  detectCallAsm: '',
  satCallAsm: '',
  commitCallAsm: '',
  routinesAsm: '',
  dataAsm: '',
};

export function buildBitmapShaftSystemAsm(
  data: BitmapShaftRoomData,
  opts: BitmapShaftRuntimeOptions,
): BitmapShaftSystemAsm {
  if (!bitmapShaftSystemEnabled(data)) return DISABLED;

  const shafts = data.shafts.slice(0, BITMAP_MAX_SHAFTS);
  const count = shafts.length;
  const maxCells = Math.max(1, Math.min(2, ...shafts.map(s => Math.max(1, Math.min(2, s.widthCells)))));
  const hardwareSlotCount = count * maxCells;

  // Feet line = player_y + standOffset (first pixel row below the body); riding
  // keeps player_y = cabinTop - standOffset. Same contract as the moving platform.
  const hitbox = opts.playerHitbox;
  const standOffset = Math.max(1, Math.min(32, (Math.floor(hitbox.y) || 0) + (Math.floor(hitbox.h) || 16)));
  const hbLeft = Math.max(0, Math.min(31, Math.floor(hitbox.x) || 0));
  const hbRight = Math.max(hbLeft, Math.min(63, hbLeft + (Math.floor(hitbox.w) || 16) - 1));
  const rideWindow = Math.max(3, Math.min(24, (Math.floor(opts.terminalFallPx) || 4) + 2));
  const deltaBias = 2;
  const deltaSpan = rideWindow + deltaBias + 1;

  const slotAddr = opts.ramBase;
  const forcedRoomAddr = opts.ramBase + count * SHAFT_RAM_STRIDE;
  const ramBytes = count * SHAFT_RAM_STRIDE + 1;

  const equates = `; --- MULTI-SCREEN SHAFT state (${ramBytes} bytes): ${count} cabin(s) x ${SHAFT_RAM_STRIDE}
; (slot, y, dir, rider) + 1 shared forced-room byte ---
bitmap_shaft_state EQU ${asmWord(slotAddr)}
; Target room for the next start_room_transition, #FF = follow the normal rail.
; The shaft path is authored independently of the worldmap, so a cabin crossing
; a room boundary cannot rely on a north/south rail existing.
bitmap_shaft_forced_room EQU ${asmWord(forcedRoomAddr)}
`;

  const stateOf = (i: number) => `bitmap_shaft_state + ${i * SHAFT_RAM_STRIDE}`;

  // ---- ROM data -----------------------------------------------------------
  const pathTables = shafts.map((shaft, i) => `bitmap_shaft_path_${i}:
    DB ${shaft.path.length}    ; rooms in the path, BOTTOM FIRST
    DB ${shaft.path.map(room => asmByte(room)).join(',')}`).join('\n');

  const defTables = shafts.map((shaft, i) => `; bottomSlot, bottomY, topSlot, topY, startSlot, startY, startDir, speed, x,
; widthCells, patOff, colorOff
bitmap_shaft_def_${i}:
    DB ${asmByte(shaft.bottomSlot)},${asmByte(shaft.bottomY)},${asmByte(shaft.topSlot)},${asmByte(shaft.topY)}
    DB ${asmByte(shaft.startSlot)},${asmByte(shaft.startY)},${asmByte(shaft.startDir)},${asmByte(shaft.speed)}
    DB ${asmByte(shaft.x)},${asmByte(shaft.widthCells)},${asmByte(shaft.patOff)},${asmByte(shaft.colorOff)}`).join('\n');

  const emitBytes = (bytes: number[], perLine = 16): string => {
    const lines: string[] = [];
    for (let i = 0; i < bytes.length; i += perLine) {
      lines.push(`    DB ${bytes.slice(i, i + perLine).map(asmByte).join(',')}`);
    }
    return lines.join('\n');
  };

  const dataAsm = `${pathTables}
${defTables}
bitmap_shaft_path_ptr_table:
${shafts.map((_s, i) => `    DW bitmap_shaft_path_${i}`).join('\n')}
bitmap_shaft_def_ptr_table:
${shafts.map((_s, i) => `    DW bitmap_shaft_def_${i}`).join('\n')}
bitmap_shaft_sprite_patterns:
${emitBytes(data.patternBytes)}
bitmap_shaft_sprite_colors:
${emitBytes(data.colorBytes)}`;

  // ---- shared helpers -----------------------------------------------------
  const helpersAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_def_ptr / bitmap_shaft_path_ptr
; ------------------------------------------------------------
; PURPOSE: HL = the ROM table for cabin A.
; DESTROYS: AF, DE, HL.
; ------------------------------------------------------------
bitmap_shaft_def_ptr:
    ld hl, bitmap_shaft_def_ptr_table
    jp bitmap_shaft_ptr_common
bitmap_shaft_path_ptr:
    ld hl, bitmap_shaft_path_ptr_table
bitmap_shaft_ptr_common:
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_room_for_slot
; ------------------------------------------------------------
; PURPOSE: A = room index the cabin's current slot maps to.
; INPUT: IX -> cabin state, B = cabin index.
; DESTROYS: AF, DE, HL.
; ------------------------------------------------------------
bitmap_shaft_room_for_slot:
    ld a, b
    call bitmap_shaft_path_ptr
    inc hl                    ; skip the room count
    ld a, (ix+0)              ; slot
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_cmp_above
; ------------------------------------------------------------
; PURPOSE: Order two shaft positions. path[0] is the BOTTOM room, so a position
;   is higher up the shaft when its slot is greater, or -- inside one room --
;   when its y is smaller.
; INPUT: D = slot A, E = y A, H = slot B, L = y B.
; OUTPUT: carry SET when A is strictly above B.
; DESTROYS: AF.
; ------------------------------------------------------------
bitmap_shaft_cmp_above:
    ld a, d
    cp h
    jp z, .same_room
    ; different rooms: the greater slot wins (carry set when A is above)
    ccf                       ; cp set carry when d < h; we want the opposite
    ret
.same_room:
    ld a, e
    cp l                      ; carry set when yA < yB, i.e. A is higher up
    ret
`;

  // ---- one-way stand test -------------------------------------------------
  const standAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_player_on_cabin
; ------------------------------------------------------------
; PURPOSE: Tests whether the player stands on the cabin at IX. Only meaningful
;   while the cabin is in the displayed room; callers check that first.
; INPUT: IX -> cabin state, B = cabin index, player_x/player_y.
; OUTPUT: A=1 and NZ when standing, A=0 and Z otherwise.
; DESTROYS: AF, DE, HL.
; ------------------------------------------------------------
bitmap_shaft_player_on_cabin:
    push bc
    ld a, b
    call bitmap_shaft_def_ptr
    ld de, 8
    add hl, de
    ld d, (hl)                ; D = cabin x
    inc hl
    ld a, (hl)                ; widthCells
    add a, a
    add a, a
    add a, a
    add a, a                  ; * 16
    add a, d
    jp nc, .right_ok
    ld a, 255
.right_ok:
    ld e, a                   ; E = cabin right (exclusive)
    ld a, (player_x)
${hbLeft ? `    add a, ${hbLeft}\n` : ''}    cp e
    jp nc, .not_standing
    ld a, (player_x)
    add a, ${hbRight}
    cp d
    jp c, .not_standing
    ; feet delta accepted in [-${deltaBias}..${rideWindow}]
    ld a, (player_y)
    add a, ${standOffset}
    sub (ix+1)
    add a, ${deltaBias}
    cp ${deltaSpan}
    jp nc, .not_standing
    pop bc
    ld a, 1
    or a
    ret
.not_standing:
    pop bc
    xor a
    ret
`;

  // ---- init ---------------------------------------------------------------
  const initAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_init
; ------------------------------------------------------------
; PURPOSE: Seed every cabin from its ROM definition. BOOT ONLY -- a room load
;   must never reset a shaft, or the cabin would teleport back every time the
;   player re-enters the room and the elevator would stop being one object.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_shaft_init:
    ld a, #FF
    ld (bitmap_shaft_forced_room), a
    ld ix, bitmap_shaft_state
    ld b, 0
.init_one:
    ld a, b
    call bitmap_shaft_def_ptr
    ld de, 4
    add hl, de                ; -> startSlot
    ld a, (hl)
    ld (ix+0), a              ; slot
    inc hl
    ld a, (hl)
    ld (ix+1), a              ; y
    inc hl
    ld a, (hl)
    ld (ix+2), a              ; dir
    xor a
    ld (ix+3), a              ; no rider
    ld de, ${SHAFT_RAM_STRIDE}
    add ix, de
    inc b
    ld a, b
    cp ${count}
    jp c, .init_one
    ret
`;

  // ---- per-frame motion ---------------------------------------------------
  const updateAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_update
; ------------------------------------------------------------
; PURPOSE: Advance every cabin one step, wrap across rooms, bounce at the ends
;   of the authored travel, and carry the rider. Runs whatever room is on
;   screen: the elevator is one continuous object, not a per-room relay.
; INPUT: cabin state + ROM definitions.
; OUTPUT: state advanced; player_y re-snapped while riding; a room transition
;   requested when the rider crosses a boundary.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_shaft_update:
${opts.pauseGateAsm || ''}    ld ix, bitmap_shaft_state
    ld b, 0
.update_one:
    push bc
    ld a, b
    call bitmap_shaft_def_ptr
    push hl                   ; HL = def base, kept for the bound tests
    ld de, 7
    add hl, de
    ld c, (hl)                ; C = speed
    pop hl
    ld a, (ix+2)              ; dir
    or a
    jp nz, .step_down
; --- climbing: y decreases, and under 0 we move up one room (slot + 1) ---
    ld a, (ix+1)
    sub c
    jp nc, .up_same_room
    add a, ${SHAFT_ROOM_HEIGHT}   ; wrapped past the top of this room
    ld (ix+1), a
    inc (ix+0)
    call bitmap_shaft_cross_room
    jp .after_step
.up_same_room:
    ld (ix+1), a
    jp .after_step
; --- descending: y increases, past 191 we move down one room (slot - 1) ---
.step_down:
    ld a, (ix+1)
    add a, c
    cp ${SHAFT_ROOM_HEIGHT}
    jp c, .down_same_room
    sub ${SHAFT_ROOM_HEIGHT}
    ld (ix+1), a
    dec (ix+0)
    call bitmap_shaft_cross_room
    jp .after_step
.down_same_room:
    ld (ix+1), a
.after_step:
    pop bc
    push bc
    ; --- clamp to the authored travel and reverse there ---
    ld a, (ix+2)
    or a
    jp nz, .check_bottom
    ; --- climbing: reverse once the cabin is above (topSlot, topY) = def+2/+3 ---
    ld a, b
    call bitmap_shaft_def_ptr
    inc hl
    inc hl
    ld a, (hl)                ; topSlot
    inc hl
    ld l, (hl)                ; topY
    ld h, a                   ; H/L = the bound
    ld d, (ix+0)
    ld e, (ix+1)              ; D/E = the cabin
    call bitmap_shaft_cmp_above
    jp nc, .step_done         ; still below the top bound
    ld (ix+0), h
    ld (ix+1), l              ; clamp exactly onto the bound
    ld a, 1
    ld (ix+2), a              ; now descending
    jp .step_done
.check_bottom:
    ; --- descending: reverse once the cabin is below (bottomSlot, bottomY) ---
    ; "below the bound" is the same test with the operands swapped, so D/E take
    ; the bound and H/L the cabin.
    ld a, b
    call bitmap_shaft_def_ptr
    ld a, (hl)                ; bottomSlot
    inc hl
    ld l, (hl)                ; bottomY
    ld d, a
    ld e, l                   ; D/E = the bound
    ld h, (ix+0)
    ld l, (ix+1)              ; H/L = the cabin
    call bitmap_shaft_cmp_above
    jp nc, .step_done         ; still above the bottom bound
    ld (ix+0), d
    ld (ix+1), e              ; clamp exactly onto the bound
    xor a
    ld (ix+2), a              ; now climbing
.step_done:
    ; --- carry the rider: the cabin is vertical, so only Y is carried ---
    ld a, (ix+3)
    or a
    jp z, .update_next
    ld a, (ix+1)
    sub ${standOffset}
    ld (player_y), a
.update_next:
    pop bc
    ld de, ${SHAFT_RAM_STRIDE}
    add ix, de
    inc b
    ld a, b
    cp ${count}
    jp c, .update_one
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_cross_room
; ------------------------------------------------------------
; PURPOSE: The cabin at IX just changed room. With the player aboard, the
;   elevator drives the room change itself: the path is authored independently
;   of the worldmap, so the north/south rail may not exist at all. The target
;   room is handed to start_room_transition through bitmap_shaft_forced_room.
; INPUT: IX -> cabin state (slot already updated), B = cabin index.
; DESTROYS: AF, DE, HL.
; ------------------------------------------------------------
bitmap_shaft_cross_room:
    ld a, (ix+3)              ; rider?
    or a
    ret z                     ; empty cabin: it just keeps moving off-screen
    push bc
    call bitmap_shaft_room_for_slot
    ld (bitmap_shaft_forced_room), a
    ld a, (ix+2)
    or a
    ld a, 2                   ; climbing -> enter the new room from its bottom
    jp z, .have_dir
    ld a, 3                   ; descending -> enter from the top
.have_dir:
    call start_room_transition
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_after_commit
; ------------------------------------------------------------
; PURPOSE: Called from the tail of commit_room_flip. commit_room_flip wrote an
;   edge-entry player_y for the room it just published; a rider must sit on its
;   cabin instead.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_shaft_after_commit:
    ld ix, bitmap_shaft_state
    ld b, 0
.commit_one:
    ld a, (ix+3)
    or a
    jp z, .commit_next
    push bc
    call bitmap_shaft_room_for_slot
    ld hl, current_screen_index
    cp (hl)
    jp nz, .commit_pop        ; rider's cabin is not in this room after all
    ld a, (ix+1)
    sub ${standOffset}
    ld (player_y), a
    ld a, (player_flags)
    or #01                    ; grounded on the cabin
    ld (player_flags), a
.commit_pop:
    pop bc
.commit_next:
    ld de, ${SHAFT_RAM_STRIDE}
    add ix, de
    inc b
    ld a, b
    cp ${count}
    jp c, .commit_one
    ret
`;

  // ---- landing / dropping -------------------------------------------------
  const detectAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_ride_detect
; ------------------------------------------------------------
; PURPOSE: After the player moved, decide who is riding. Only a cabin in the
;   displayed room can be boarded.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_shaft_ride_detect:
    ld ix, bitmap_shaft_state
    ld b, 0
.detect_one:
    push bc
    call bitmap_shaft_room_for_slot
    ld hl, current_screen_index
    cp (hl)
    jp nz, .detect_clear
    call bitmap_shaft_player_on_cabin
    jp z, .detect_clear
    ld a, 1
    ld (ix+3), a
    ld a, (ix+1)
    sub ${standOffset}
    ld (player_y), a
    ld a, (player_flags)
    or #01
    ld (player_flags), a
    jp .detect_next
.detect_clear:
    xor a
    ld (ix+3), a
.detect_next:
    pop bc
    ld de, ${SHAFT_RAM_STRIDE}
    add ix, de
    inc b
    ld a, b
    cp ${count}
    jp c, .detect_one
    ret
`;

  // ---- SAT ---------------------------------------------------------------
  const satSlotBlocks = shafts.map((_shaft, i) => {
    const cellBlocks = Array.from({ length: maxCells }, (_unused, j) => {
      const patternByte = ((opts.patternGroupBase + i * maxCells + j) * 4) & 0xff;
      return `.sat_shaft_${i}_${j}:
    ld ix, ${stateOf(i)}
    ld b, ${i}
    call bitmap_shaft_room_for_slot
    ld hl, current_screen_index
    cp (hl)
    jp nz, .sat_shaft_${i}_${j}_hidden
    ld a, ${i}
    call bitmap_shaft_def_ptr
    ld de, 9
    add hl, de
    ld a, (hl)                ; widthCells
    cp ${j + 1}
    jp c, .sat_shaft_${i}_${j}_hidden
    ld ix, ${stateOf(i)}
    ld a, (ix+1)
    add a, ${opts.gameYOffset}
    out (VDP_DATA_PORT), a    ; Y
    ld a, ${i}
    call bitmap_shaft_def_ptr
    ld de, 8
    add hl, de
    ld a, (hl)                ; x
${j > 0 ? `    add a, ${j * 16}\n` : ''}    out (VDP_DATA_PORT), a    ; X (cell ${j})
    ld a, ${asmByte(patternByte)}
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_shaft_${i}_${j}_end
.sat_shaft_${i}_${j}_hidden:
    ld a, ${asmByte(SHAFT_EMPTY_SPRITE_Y)}
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_shaft_${i}_${j}_end:`;
    }).join('\n');
    return cellBlocks;
  }).join('\n');

  const satAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_sat
; ------------------------------------------------------------
; PURPOSE: Write the ${hardwareSlotCount} fixed shaft SAT slot(s) at VRAM ${asmWord(opts.satBase)}.
;   A cabin whose current room is not the displayed one is parked off-screen at
;   Y=${asmByte(SHAFT_EMPTY_SPRITE_Y)} so the VDP keeps scanning.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_shaft_sat:
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
    pop de
    ret
`;

  // ---- VRAM upload of the cabin sprites (boot only) -----------------------
  const uploadAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shaft_upload_sprites
; ------------------------------------------------------------
; PURPOSE: Push every cabin's pattern group and colour block to VRAM once at
;   boot. Cabins never change sprite, so nothing re-uploads per room.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_shaft_upload_sprites:
${shafts.map((shaft, i) => {
  const patternGroup = opts.patternGroupBase + i * maxCells;
  const patternVram = 0xf800 + patternGroup * 32;
  const colorVram = opts.colorBase + i * maxCells * 16;
  const cells = Math.max(1, Math.min(2, shaft.widthCells));
  return `    ld hl, bitmap_shaft_sprite_patterns + ${shaft.patOff * 32}
    ld de, ${asmWord(patternVram)}
    ld bc, ${cells * 32}
    call copy_to_vram_ext
    ld hl, bitmap_shaft_sprite_colors + ${shaft.colorOff * 16}
    ld de, ${asmWord(colorVram)}
    ld bc, ${cells * 16}
    call copy_to_vram_ext`;
}).join('\n')}
    ret
`;

  const routinesAsm = `${helpersAsm}${standAsm}${initAsm}${updateAsm}${detectAsm}${satAsm}${uploadAsm}`;

  return {
    enabled: true,
    ramBytes,
    hardwareSlotCount,
    equates,
    initCallAsm: '    call bitmap_shaft_init\n    call bitmap_shaft_upload_sprites\n',
    updateCallAsm: '    call bitmap_shaft_update\n',
    detectCallAsm: '    call bitmap_shaft_ride_detect\n',
    satCallAsm: '    call bitmap_shaft_sat\n',
    commitCallAsm: '    call bitmap_shaft_after_commit\n',
    routinesAsm,
    dataAsm,
  };
}
