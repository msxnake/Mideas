/**
 * SCREEN 5 bitmap-room PERCEPTION skill + hidden-object collection + parts window.
 *
 * Passive alien sense: every frame the runtime measures the player-center to
 * object-center distance against each `hidden_obj` entity of the current room
 * (invisible markers placed in the bitmap screen editor — they bake no visual
 * into the room). When both |dx| and |dy| fall within the configured radius
 * (square radius, cheap Chebyshev test) it raises `bitmap_flag_near` and, when
 * a 'perceiving' state sprite is mapped in the Player Animations table, asserts
 * the perceiving animation state (e.g. the alien's tail glows) — unless an
 * action skill (dash, crouch, wall_jump...) already owns `player_anim_state`
 * this frame, so action animations always win over the ambient glow.
 *
 * COLLECTION: stepping on the object's 16x16 cell (gem-style hitbox overlap;
 * the glow guides you there) collects it once, latching a per-object RAM flag
 * (persists across rooms until reset, like gem flags) and paying the reward
 * declared in the entity's `params.hiddenReward.type`:
 *   0 shipPart    -> bitmap_hidden_count +1 (8-bit, saturating)
 *   1 collectible -> +1 on the HUD 'collectibles' counter (when one exists)
 *   2 keyItem     -> bitmap_key_count +1 (when the key/door system emits it)
 * A collected object stops raising flag_near/glow. A short PSG blip plays.
 * NOTE: the collect overlap only runs when the object is already within the
 * perception radius, so with a radius under ~24px the pickup zone shrinks to
 * the radius square.
 *
 * PARTS WINDOW (emitted only when at least one shipPart object exists): the
 * 'I' key toggles a dialogue-style centered box that freezes the world (player
 * gate + enemy/platform pause, same contract as the NPC dialogue) and shows
 * one slot per ship part: collected -> its atlas tile blitted with HMMM
 * (params.hiddenReward.atlasEntryId), missing -> a dark placeholder fill.
 * Closing replays the room render program on the displayed page (the same
 * mechanism as bitmap_dlg_close_box) plus the overlay redraw chain.
 *
 * The whole system is emitted ONLY when the skill is active AND at least one
 * hidden_obj exists, so plain projects stay byte-identical.
 */

import type { Msx2PerceptionConfig } from '../../../msx2PlatformPhysics';

const TILE_GRID_SIZE = 16;
const COLLISION_COLS = 16;
const COLLISION_ROWS = 12;
const MAX_SHIP_PARTS = 10;

// Mirrors the room generator's VRAM/command constants (single source there; the
// values are stable engine geometry). Override through BitmapPerceptionOptions.env
// if the room layout ever changes.
const DEFAULT_ENV = {
  atlasBaseY: 512,
  gameYOffset: 20,
  cmdCopy: 0xd0, // HMMM
  cmdFill: 0xc0, // HMMV
  cmdPort: '#9B',
};

function hexByte(value: number): string {
  return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function hexWord(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, value)).toString(16).toUpperCase().padStart(4, '0')}`;
}

function formatBytes(label: string, bytes: number[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = Math.trunc(Number(value));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export type BitmapHiddenRewardType = 'shipPart' | 'collectible' | 'keyItem';
const REWARD_CODE: Record<BitmapHiddenRewardType, number> = { shipPart: 0, collectible: 1, keyItem: 2 };

export interface BitmapPerceptionRecord {
  roomIndex: number;
  /** Object center in room pixels (cell center of the placed 16x16 marker). */
  x: number;
  y: number;
  flagOffset: number;
  rewardType: number;
  /** Global slot index in the parts window (shipPart only, -1 otherwise). */
  partIndex: number;
  /** Atlas tile for the window slot (shipPart only). */
  atlasEntry?: { sx: number; sy: number };
}

/** True when a placed entity is a Perception hidden object marker. */
export function isBitmapHiddenObjEntity(entity: any): boolean {
  if (!entity) return false;
  if (entity.kind === 'hidden_obj') return true;
  return entity.params?.hiddenObj === true || entity.params?.engine === 'hiddenObj';
}

function readRewardType(entity: any): number {
  const raw = entity?.params?.hiddenReward?.type;
  if (raw === 'collectible') return REWARD_CODE.collectible;
  if (raw === 'keyItem') return REWARD_CODE.keyItem;
  return REWARD_CODE.shipPart;
}

export function collectBitmapPerceptionRecords(
  rooms: Array<{ entities?: any[]; atlas?: { entries?: any[] } }>,
): BitmapPerceptionRecord[] {
  const records: BitmapPerceptionRecord[] = [];
  let partCount = 0;
  for (const [roomIndex, room] of rooms.entries()) {
    for (const entity of room.entities || []) {
      if (!isBitmapHiddenObjEntity(entity)) continue;
      const cellX = clampInt(entity.position?.x ?? 0, 0, COLLISION_COLS - 1, 0);
      const cellY = clampInt(entity.position?.y ?? 0, 0, COLLISION_ROWS - 1, 0);
      const rewardType = readRewardType(entity);
      let partIndex = -1;
      let atlasEntry: { sx: number; sy: number } | undefined;
      if (rewardType === REWARD_CODE.shipPart) {
        partIndex = partCount;
        partCount += 1;
        const atlasEntryId = typeof entity.params?.hiddenReward?.atlasEntryId === 'string'
          ? entity.params.hiddenReward.atlasEntryId
          : '';
        const entry = atlasEntryId ? (room.atlas?.entries || []).find((item: any) => item.id === atlasEntryId) : undefined;
        if (entry) atlasEntry = { sx: clampInt(entry.sx, 0, 255, 0), sy: clampInt(entry.sy, 0, 511, 0) };
      }
      records.push({
        roomIndex,
        x: cellX * TILE_GRID_SIZE + TILE_GRID_SIZE / 2,
        y: cellY * TILE_GRID_SIZE + TILE_GRID_SIZE / 2,
        flagOffset: records.length,
        rewardType,
        partIndex,
        atlasEntry,
      });
    }
  }
  return records;
}

/** True when the project needs the parts window ('I' key inventory). */
export function bitmapPerceptionWindowNeeded(
  rooms: Array<{ entities?: any[]; atlas?: { entries?: any[] } }>,
): boolean {
  return collectBitmapPerceptionRecords(rooms).some(record => record.partIndex >= 0);
}

export interface BitmapPerceptionOptions {
  ramBase: number;
  playerHitbox: { x: number; y: number; w: number; h: number };
  perceivingAnimId?: number;
  /** HUD 'collectibles' counter RAM label (collectible reward), or null. */
  collectibleCounter: { label: string; wide: boolean } | null;
  /** True when the key/door system emits bitmap_key_count (keyItem reward). */
  keyCountAvailable: boolean;
  /** True on Konami MegaROM builds (room data lives in switched banks). */
  bankedRoomData: boolean;
  /** Overlay redraw chain appended after the room replay on window close. */
  repaintOverlaysAsm: string;
  env?: Partial<typeof DEFAULT_ENV>;
}

export interface BitmapPerceptionSystem {
  enabled: boolean;
  windowEnabled: boolean;
  ramBytes: number;
  equates: string;
  initAsm: string;
  /** Per-frame proximity + collect scan (before the sprite-animation update). */
  mainLoopCall: string;
  /** Player-freeze gate for the parts window (next to the dialogue gate). */
  inventoryGateAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

const DISABLED_SYSTEM: BitmapPerceptionSystem = {
  enabled: false,
  windowEnabled: false,
  ramBytes: 0,
  equates: '',
  initAsm: '',
  mainLoopCall: '',
  inventoryGateAsm: '',
  routinesAsm: '',
  dataAsm: '',
};

/** 15-byte V9938 command block, gem-format: SX SY DX DY NX NY CLR ARG CMD. */
function fillCommand(env: typeof DEFAULT_ENV, dx: number, dy: number, w: number, h: number, color: number): number[] {
  const destY = env.gameYOffset + dy;
  return [
    0, 0, 0, 0,
    dx & 0xff, 0,
    destY & 0xff, 0,
    w & 0xff, (w >> 8) & 0xff,
    h & 0xff, 0,
    (color & 0x0f) * 0x11, 0, env.cmdFill,
  ];
}

function atlasCopyCommand(env: typeof DEFAULT_ENV, sx: number, sy: number, dx: number, dy: number): number[] {
  const srcY = env.atlasBaseY + sy;
  const destY = env.gameYOffset + dy;
  return [
    sx & 0xff, (sx >> 8) & 0xff,
    srcY & 0xff, (srcY >> 8) & 0xff,
    dx & 0xff, 0,
    destY & 0xff, 0,
    TILE_GRID_SIZE, 0,
    TILE_GRID_SIZE, 0,
    0, 0, env.cmdCopy,
  ];
}

export function buildBitmapPerceptionSystemAsm(
  rooms: Array<{ entities?: any[]; atlas?: { entries?: any[] } }>,
  config: Msx2PerceptionConfig,
  options: BitmapPerceptionOptions,
): BitmapPerceptionSystem {
  const records = config.enabled ? collectBitmapPerceptionRecords(rooms) : [];
  if (records.length === 0) return DISABLED_SYSTEM;
  const env = { ...DEFAULT_ENV, ...(options.env || {}) };

  const shipParts = records.filter(record => record.partIndex >= 0);
  if (shipParts.length > MAX_SHIP_PARTS) {
    throw new Error(
      `MSX2 SCREEN 5 bitmap rooms define ${shipParts.length} hidden_obj ship parts, but the parts window fits at most ${MAX_SHIP_PARTS} slots. ` +
      `Switch some rewards to 'collectible'/'keyItem' or remove markers.`,
    );
  }
  const windowEnabled = shipParts.length > 0;
  const anyShipPart = windowEnabled;
  if (records.some(record => record.rewardType === REWARD_CODE.collectible) && !options.collectibleCounter) {
    console.warn(`⚠️ MSX2 bitmap perception: hidden_obj with 'collectible' reward but no HUD counter bound to 'collectibles'; collecting it will only play the blip.`);
  }
  if (records.some(record => record.rewardType === REWARD_CODE.keyItem) && !options.keyCountAvailable) {
    console.warn(`⚠️ MSX2 bitmap perception: hidden_obj with 'keyItem' reward but the project has no key doors/keyItem HUD (no bitmap_key_count); collecting it will only play the blip.`);
  }

  const radius = Math.max(8, Math.min(96, Math.trunc(config.radius)));
  const hitbox = options.playerHitbox;
  const centerXOffset = clampInt(hitbox.x + Math.floor(hitbox.w / 2), 0, 31, 8);
  const centerYOffset = clampInt(hitbox.y + Math.floor(hitbox.h / 2), 0, 31, 8);
  const hbLeft = hitbox.x;
  const hbRight = hitbox.x + hitbox.w - 1;
  const hbTop = hitbox.y;
  const hbBottom = hitbox.y + hitbox.h - 1;
  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');

  // --- RAM layout (chained after every other optional system) ---
  const ramBase = options.ramBase;
  const flagNearAddress = ramBase;
  const workFlagAddress = ramBase + 1;
  const workTypeAddress = ramBase + 2;
  let cursor = ramBase + 3;
  const hiddenCountAddress = anyShipPart ? cursor : -1;
  if (anyShipPart) cursor += 1;
  const invStateAddress = windowEnabled ? cursor : -1;
  const invKeyLockAddress = windowEnabled ? cursor + 1 : -1;
  if (windowEnabled) cursor += 2;
  const flagsAddress = cursor;
  cursor += records.length;
  const ramBytes = cursor - ramBase;

  // --- ROM data ---
  const roomTables = rooms.map((_room, roomIndex) => records.filter(item => item.roomIndex === roomIndex));
  let dataAsm = roomTables.map((items, roomIndex) =>
    items.length > 0
      ? formatBytes(
          `bitmap_percept_room_${roomIndex}`,
          items.flatMap(item => [item.x, item.y, item.flagOffset, item.rewardType]),
          `Room ${roomIndex} hidden_obj records: centerX, centerY, flagOffset, rewardType(0 part/1 gem/2 key)`,
        )
      : `bitmap_percept_room_${roomIndex}:    ; no hidden_obj in this room\n`
  ).join('') +
    `bitmap_percept_ptr_table:\n${roomTables.map((_items, i) => `    DW bitmap_percept_room_${i}`).join('\n')}\n` +
    `bitmap_percept_count_table:\n    DB ${roomTables.map(items => items.length).join(',')}\n`;

  // Parts window geometry (game-band pixel coords; commands add the HUD offset).
  const slotStride = TILE_GRID_SIZE + 4;
  const contentW = shipParts.length * slotStride - 4;
  const boxW = contentW + 16;
  const boxX = Math.max(0, Math.floor((256 - boxW) / 2)) & ~1;
  const boxY = 64;
  const boxH = 32;
  if (windowEnabled) {
    const boxCommands = [
      ...fillCommand(env, boxX, boxY, boxW, boxH, 15),
      ...fillCommand(env, boxX + 2, boxY + 2, boxW - 4, boxH - 4, 1),
    ];
    dataAsm += formatBytes('bitmap_inv_cmd_box', boxCommands, `Parts window box: outer 15-fill + inner 1-fill, ${boxW}x${boxH} at (${boxX},${boxY})`);
    // Per part: flagOffset(1) + empty cmd(15) + collected cmd(15) = 31 bytes.
    const slotBytes = shipParts.flatMap(part => {
      const slotX = boxX + 8 + part.partIndex * slotStride;
      const slotY = boxY + 8;
      const emptyCmd = fillCommand(env, slotX, slotY, TILE_GRID_SIZE, TILE_GRID_SIZE, 14);
      const drawCmd = part.atlasEntry
        ? atlasCopyCommand(env, part.atlasEntry.sx, part.atlasEntry.sy, slotX, slotY)
        : fillCommand(env, slotX, slotY, TILE_GRID_SIZE, TILE_GRID_SIZE, 15);
      return [part.flagOffset, ...emptyCmd, ...drawCmd];
    });
    dataAsm += formatBytes('bitmap_inv_slot_cmds', slotBytes, `${shipParts.length} part slot(s): flagOffset, emptyCmd(15), collectedCmd(15)`);
  }

  const equates = `; perception skill (SCREEN 5 bitmap): ${records.length} hidden_obj marker(s), radius ${radius}px${windowEnabled ? `, ${shipParts.length} ship part(s) + 'I' window` : ''}.
bitmap_flag_near         EQU ${hexWord(flagNearAddress)}
bitmap_percept_work_flag EQU ${hexWord(workFlagAddress)}
bitmap_percept_work_type EQU ${hexWord(workTypeAddress)}
${anyShipPart ? `bitmap_hidden_count      EQU ${hexWord(hiddenCountAddress)}\n` : ''}${windowEnabled ? `bitmap_inv_state         EQU ${hexWord(invStateAddress)}
bitmap_inv_key_lock      EQU ${hexWord(invKeyLockAddress)}
bitmap_inv_cmd_block     EQU #C2C0
` : ''}bitmap_hidden_flags      EQU ${hexWord(flagsAddress)}
`;

  const clearFlagBytes = Array.from({ length: records.length }, (_unused, i) => `    ld (bitmap_hidden_flags + ${i}), a`).join('\n');
  const initAsm = `    ; perception: clear near flag, counters and per-object collected flags.
    xor a
    ld (bitmap_flag_near), a
${anyShipPart ? `    ld (bitmap_hidden_count), a\n` : ''}${windowEnabled ? `    ld (bitmap_inv_state), a
    ld (bitmap_inv_key_lock), a
` : ''}${clearFlagBytes}
`;

  const animAssertAsm = typeof options.perceivingAnimId === 'number'
    ? `    ld a, (player_anim_state)
    or a
    jp nz, .percept_anim_done  ; an action skill owns the animation this frame
    ld a, ${options.perceivingAnimId}
    ld (player_anim_state), a
.percept_anim_done:
`
    : '';

  const collectibleRewardAsm = options.collectibleCounter
    ? (options.collectibleCounter.wide
      ? `    ld hl, (${options.collectibleCounter.label})
    inc hl
    ld a, h
    or l
    jp z, .percept_reward_done
    ld (${options.collectibleCounter.label}), hl
`
      : `    ld a, (${options.collectibleCounter.label})
    inc a
    jp z, .percept_reward_done
    ld (${options.collectibleCounter.label}), a
`)
    : `    ; no HUD 'collectibles' counter in this project: blip only
`;

  const keyRewardAsm = options.keyCountAvailable
    ? `    ld a, (bitmap_key_count)
    inc a
    jp z, .percept_reward_done
    ld (bitmap_key_count), a
`
    : `    ; no key/door system in this project: blip only
`;

  const shipPartRewardAsm = anyShipPart
    ? `    ld a, (bitmap_hidden_count)
    inc a
    jp z, .percept_reward_done
    ld (bitmap_hidden_count), a
`
    : `    ; (no shipPart markers exist; unreachable)
`;

  const scanRoutineAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_percept_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's hidden_obj record table (4 bytes/record).
;
; OUTPUT:
;   HL = first record, B = record count. Z set (and B=0) when empty.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_percept_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_percept_count_table
    add hl, de
    ld b, (hl)
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_percept_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, b
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_hidden_player_overlaps_16
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 hidden-object
;   cell (perception-owned copy of the gem overlap test).
;
; INPUT:
;   D = cell X in pixels, E = cell Y in pixels (top-left corner).
;
; OUTPUT:
;   A = 1 and NZ when overlapping; A = 0 and Z when separated.
;
; DESTROYS: AF, B.  PRESERVES: C, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_hidden_player_overlaps_16:
    ld a, (player_x)
${addA(hbRight)}    cp d
    jp c, .hidden_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
${addA(hbLeft)}    cp b
    jp z, .hidden_overlap_x_ok
    jp nc, .hidden_overlap_no
.hidden_overlap_x_ok:
    ld a, (player_y)
${addA(hbBottom)}    cp e
    jp c, .hidden_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
${addA(hbTop)}    cp b
    jp z, .hidden_overlap_yes
    jp nc, .hidden_overlap_no
.hidden_overlap_yes:
    ld a, 1
    or a
    ret
.hidden_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_perception
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame Perception scan over the current room's hidden objects:
;   uncollected object within the ${radius}px square radius -> bitmap_flag_near = 1
;   (+ perceiving animation when no action skill owns the state); stepping on
;   its 16x16 cell collects it (latch flag, pay reward, PSG blip).
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state,
;   player_x/player_y, bitmap_hidden_flags.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
;
; NOTES:
;   |dx|/|dy| are exact 8-bit absolute differences (sub + conditional neg),
;   so the test is wrap-safe across the whole 0..255 pixel range. The collect
;   overlap only runs on near objects (pickup zone ⊆ radius square).
; ------------------------------------------------------------
bitmap_update_perception:
    xor a
    ld (bitmap_flag_near), a
    ld a, (bitmap_composition_state)
    or a
    ret nz                   ; room transition in progress: sense off
    call bitmap_percept_room_table
    ret z
.percept_loop:
    push bc
    ld a, (hl)               ; D = object center X
    inc hl
    ld d, a
    ld a, (hl)               ; E = object center Y
    inc hl
    ld e, a
    ld a, (hl)               ; record flag offset
    inc hl
    ld (bitmap_percept_work_flag), a
    ld a, (hl)               ; record reward type
    inc hl
    ld (bitmap_percept_work_type), a
    push hl                  ; save record walker
    ; collected objects neither glow nor re-trigger
    ld a, (bitmap_percept_work_flag)
    ld l, a
    ld h, 0
    ld bc, bitmap_hidden_flags
    add hl, bc
    ld a, (hl)
    or a
    jp nz, .percept_next
    ; |player_cx - object_cx| within radius?
    ld a, (player_x)
${addA(centerXOffset)}    sub d
    jp nc, .percept_dx_abs
    neg
.percept_dx_abs:
    cp ${radius + 1}
    jp nc, .percept_next
    ; |player_cy - object_cy| within radius?
    ld a, (player_y)
${addA(centerYOffset)}    sub e
    jp nc, .percept_dy_abs
    neg
.percept_dy_abs:
    cp ${radius + 1}
    jp nc, .percept_next
    ; NEAR: latch the frame flag and assert the perceiving clip.
    ld a, 1
    ld (bitmap_flag_near), a
${animAssertAsm}    ; stepping on the cell collects it: D/E center -> top-left corner
    ld a, d
    sub 8
    ld d, a
    ld a, e
    sub 8
    ld e, a
    call bitmap_hidden_player_overlaps_16
    or a
    jp z, .percept_next
    ; COLLECT: latch the per-object flag so it never re-triggers.
    ld a, (bitmap_percept_work_flag)
    ld l, a
    ld h, 0
    ld bc, bitmap_hidden_flags
    add hl, bc
    ld (hl), 1
    ; reward dispatch by record type
    ld a, (bitmap_percept_work_type)
    or a
    jp nz, .percept_rw_not_part
${shipPartRewardAsm}    jp .percept_reward_done
.percept_rw_not_part:
    cp 1
    jp nz, .percept_rw_key
${collectibleRewardAsm}    jp .percept_reward_done
.percept_rw_key:
${keyRewardAsm}.percept_reward_done:
    call bitmap_sfx_hidden
.percept_next:
    pop hl
    pop bc
    dec b                    ; loop body exceeds djnz's -128 range
    jp nz, .percept_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sfx_hidden
; ------------------------------------------------------------
; PURPOSE:
;   Hidden-object pickup PSG blip (fire-and-forget register writes; same
;   envelope recipe as the collector_gems blip, one octave lower).
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_sfx_hidden:
    ld hl, bitmap_sfx_hidden_data
    ld b, 7
.hidden_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .hidden_sfx_loop
    ret

bitmap_sfx_hidden_data:
    db 7,#3E,0,#38,1,#00,11,#40,12,#00,8,#10,13,#09
`;

  const windowRoutineAsm = windowEnabled ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_inventory_frame
; ------------------------------------------------------------
; PURPOSE:
;   Parts-window driver, called every frame next to the dialogue gate.
;   Fresh 'I' press (keyboard row 3 bit 6) toggles the window: opening
;   draws the box + one slot per ship part on the DISPLAYED page; closing
;   replays the room render program (same mechanism as the NPC dialogue)
;   and the overlay redraw chain.
;
; OUTPUT:
;   Carry set while the window is open -> caller skips player movement
;   (enemies/platforms pause through their bitmap_inv_state gate).
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_inventory_frame:
    ld a, (bitmap_composition_state)
    or a
    jp nz, .inv_not_open     ; no toggling during room transitions
    in a, (PPI_C)
    and #F0                  ; preserve CAPS LED / cassette / key-click bits
    or 3                     ; select keyboard row 3 (C..J) in the low nibble
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #40                  ; bit 6 = 'I'
    jp z, .inv_released
    ld a, (bitmap_inv_key_lock)
    or a
    jp nz, .inv_state_gate
    ld a, 1
    ld (bitmap_inv_key_lock), a
    ld a, (bitmap_inv_state)
    or a
    jp nz, .inv_do_close
    ld a, 1
    ld (bitmap_inv_state), a
    call bitmap_inv_draw_window
    jp .inv_state_gate
.inv_do_close:
    xor a
    ld (bitmap_inv_state), a
    call bitmap_inv_repaint_room
    jp .inv_state_gate
.inv_released:
    xor a
    ld (bitmap_inv_key_lock), a
.inv_state_gate:
    ld a, (bitmap_inv_state)
    or a
    jp nz, .inv_paused
.inv_not_open:
    or a                     ; carry clear -> player runs
    ret
.inv_paused:
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_inv_draw_window
; ------------------------------------------------------------
; PURPOSE:
;   Draw the parts window on the displayed page: white box + dark body,
;   then one 16x16 slot per ship part (collected -> atlas tile HMMM,
;   missing -> dark placeholder fill).
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_inv_draw_window:
    ld hl, bitmap_inv_cmd_box
    call bitmap_inv_copy_submit
    ld hl, bitmap_inv_cmd_box + 15
    call bitmap_inv_copy_submit
    ld hl, bitmap_inv_slot_cmds
    ld b, ${shipParts.length}
.inv_slot_loop:
    push bc
    ld a, (hl)               ; part flag offset
    inc hl                   ; HL -> empty cmd (record base + 1)
    push hl                  ; keep base+1 to advance the walker afterwards
    ld e, a
    ld d, 0
    ld hl, bitmap_hidden_flags
    add hl, de
    ld a, (hl)
    pop hl
    push hl                  ; base+1 stays on the stack across the submit
    or a
    jp z, .inv_slot_pick
    ld de, 15                ; collected -> use the draw command
    add hl, de
.inv_slot_pick:
    call bitmap_inv_copy_submit
    pop hl                   ; HL = base+1
    ld de, 30                ; -> next record's flagOffset (31-byte records)
    add hl, de
    pop bc
    djnz .inv_slot_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_inv_copy_submit
; ------------------------------------------------------------
; PURPOSE:
;   Copy the 15-byte command template at HL to bitmap_inv_cmd_block, patch
;   the DY high byte for the displayed page, and stream it to the VDP.
;   Restores R#15 to S#0 (vdp_wait_cmd_ready leaves it at S#2).
; INPUT: HL = command template.  PRESERVES: IX, IY.
; DESTROYS: AF, B, DE, HL.
; ------------------------------------------------------------
bitmap_inv_copy_submit:
    ld de, bitmap_inv_cmd_block
    ld b, 15
.inv_copy_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .inv_copy_loop
    ld a, (bitmap_displayed_page)
    or a
    jp z, .inv_copy_launch
    ld a, 1
    ld (bitmap_inv_cmd_block + 7), a
.inv_copy_launch:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_inv_cmd_block
    ld b, 15
.inv_launch_loop:
    ld a, (hl)
    out (${env.cmdPort}), a
    inc hl
    djnz .inv_launch_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_inv_repaint_room
; ------------------------------------------------------------
; PURPOSE:
;   Close the parts window: replay the current room's render program on
;   the DISPLAYED page (same blocks load_room uses; same mechanism as
;   bitmap_dlg_close_box) and re-apply the overlay draw chain.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_inv_repaint_room:
    ; BISECT: boot-proven path
    ld a, (current_screen_index)
    jp load_room
    ld a, (bitmap_displayed_page)
    or a
    jp z, .inv_close_p0
    ld hl, bitmap_room_render_ptr_table_p1
${options.bankedRoomData ? `    ld bc, bitmap_room_render_bank_table_p1
` : ''}    jp .inv_close_have_table
.inv_close_p0:
    ld hl, bitmap_room_render_ptr_table_p0
${options.bankedRoomData ? `    ld bc, bitmap_room_render_bank_table_p0
` : ''}
.inv_close_have_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
${options.bankedRoomData ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    push hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld c, (hl)
    inc hl
    ld b, (hl)
    pop hl
    call replay_room_commands
${options.bankedRoomData ? `    call bitmap_room_restore_resident_banks
` : ''}${options.repaintOverlaysAsm}    ; Command-engine polls left R#15 at S#2; the main loop's vblank wait
    ; assumes S#0 (same contract as bitmap_dlg_close_box's caller).
    ld a, #0F
    ld e, #00
    jp vdp_write_register
` : '';

  return {
    enabled: true,
    windowEnabled,
    ramBytes,
    equates,
    initAsm,
    mainLoopCall: `    call bitmap_update_perception    ; perception: hidden_obj proximity/collect -> flag_near\n`,
    inventoryGateAsm: windowEnabled
      ? `    call bitmap_inventory_frame     ; 'I' parts window: toggle/draw; carry = player paused\n    jp c, .skip_player_movement\n`
      : '',
    routinesAsm: `${scanRoutineAsm}${windowRoutineAsm}`,
    dataAsm,
  };
}
