import { Msx2Screen5BitmapRoom } from '../../../../types';
import { isMsx2CarryableEntity } from './msx2CarryObjectGenerator';

/**
 * SCREEN 5 "Infinite Room" (Lost Woods style loop).
 *
 * A room flagged `infiniteRoom.enabled` sends the player back into ITSELF, entering
 * from the opposite edge, while its loop is active. The loop level is
 *
 *     loop_active = initialLoopActive XOR (a resting carryable is inside the room's zone)
 *
 * Everything here is opt-in: when no room is flagged this module returns empty
 * strings everywhere, so the generated ROM is byte-identical to a project without
 * the feature.
 *
 * Runtime pieces (all emitted only when the feature is in use):
 *   - `bitmap_inf_active`     current room's loop level (0 in non-infinite rooms).
 *   - rail hook               inside start_room_transition: destination := current room
 *                             while the loop is active (also over a missing rail).
 *   - `bitmap_inf_self_wrap`  set by the hook, consumed by the next commit so the
 *                             carry slots survive the wrap (a held box stays held).
 *   - zone check              per frame, resting carryable centre vs the zone rectangle.
 *   - save records            per infinite room, the resting carryable positions, restored
 *                             on a normal entry so a box left in the zone is still there.
 */

/** Maximum infinite rooms (save record = 5 bytes, index kept in one byte). */
export const BITMAP_INFINITE_MAX_ROOMS = 50;
const SAVE_RECORD_BYTES = 5;
const ZONE_RECORD_STRIDE = 8;
const ZONE_FLAG_INITIAL = 0x01;
const ZONE_FLAG_HAS_ZONE = 0x02;
const HEADER_BYTES = 4;
const ZONE_BYTES = 6;

export interface BitmapInfiniteZone {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Bit i set = carryable slot i is accepted by the zone. */
  slotMask: number;
}

export interface BitmapInfiniteRoomEntry {
  roomIndex: number;
  initialLoopActive: boolean;
  zone: BitmapInfiniteZone | null;
}

export interface BitmapInfiniteRoomData {
  entries: BitmapInfiniteRoomEntry[];
  /** Zone checking is emitted (carry system on and at least one room has a zone). */
  zoneLogic: boolean;
}

export interface BitmapInfiniteRoomOptions {
  ramBase: number;
  /** Number of carryable slots the carry runtime allocates (0 = carry disabled). */
  carrySlots: number;
  bankedRle: boolean;
  /** The shaft cabin can force a destination room: when it does, the shaft wins over the loop. */
  shaftOverride?: boolean;
}

export interface BitmapInfiniteRoomSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /** Cold-boot clear. MUST run before the start room is loaded. */
  preLoadInitAsm: string;
  /** Per-room load for the commit path: the carry load is skipped on a self-wrap. */
  commitCarryLoadAsm: (carryLoadCallAsm: string) => string;
  /** Per-room load for the boot path (after the carry load). */
  loadCallAsm: string;
  updateCallAsm: string;
  /** Snippet spliced into start_room_transition BEFORE the shaft override and `cp #FF`. */
  railHookAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

const hexByte = (value: number) => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
const hexWord = (value: number) => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

export function isBitmapTriggerZoneEntity(entity: any): boolean {
  if (!entity) return false;
  const engine = String(entity.params?.engine || '').replace(/[\s_-]+/g, '').toLowerCase();
  return engine === 'triggerzone' || Boolean(entity.params?.triggerZone || entity.components?.msx2_trigger_zone);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

/** First (and only, in v1) trigger zone of a room, resolved to pixel bounds + slot mask. */
function resolveRoomZone(room: Msx2Screen5BitmapRoom, roomLabel: string): BitmapInfiniteZone | null {
  const entities: any[] = Array.isArray(room.entities) ? room.entities : [];
  const zones = entities.filter(entity => entity?.position && isBitmapTriggerZoneEntity(entity));
  if (zones.length === 0) return null;
  if (zones.length > 1) {
    console.warn(`[infinite-room] ${roomLabel}: ${zones.length} trigger zones found, only the first one is used.`);
  }
  const zone = zones[0];
  const raw = zone.params?.triggerZone || zone.components?.msx2_trigger_zone || {};
  if (raw.enabled === false || raw.enabled === 'false') return null;
  const x0 = clampInt(zone.position.x, 0, 15, 0) * 16;
  const y0 = clampInt(zone.position.y, 0, 11, 0) * 16;
  const w = clampInt(raw.w, 1, 255, 16);
  const h = clampInt(raw.h, 1, 255, 16);
  // The carry slots are the first two carryables of the room, in entity order
  // (same filter as buildBitmapCarryAndThrowData).
  const carryables = entities
    .filter(entity => entity?.kind !== 'player' && entity?.position && isMsx2CarryableEntity(entity))
    .slice(0, 2);
  const targetId = typeof raw.targetEntityId === 'string' ? raw.targetEntityId : '';
  let slotMask = 0x03;
  if (targetId) {
    const slot = carryables.findIndex(entity => entity.id === targetId);
    if (slot >= 0) slotMask = 1 << slot;
    else console.warn(`[infinite-room] ${roomLabel}: trigger zone target "${targetId}" is not a carryable of the room; any carryable is accepted.`);
  }
  return {
    x0,
    y0,
    // Exclusive bounds; a carryable centre never reaches 255 so clamping is exact.
    x1: Math.min(255, x0 + w),
    y1: Math.min(255, y0 + h),
    slotMask,
  };
}

export function buildBitmapInfiniteRoomData(
  rooms: Msx2Screen5BitmapRoom[],
  carryEnabled: boolean,
): BitmapInfiniteRoomData {
  const entries: BitmapInfiniteRoomEntry[] = [];
  rooms.forEach((room, roomIndex) => {
    const config = (room as any)?.infiniteRoom;
    if (!config || config.enabled !== true) return;
    const label = `room ${roomIndex} "${room.name || room.id}"`;
    if (entries.length >= BITMAP_INFINITE_MAX_ROOMS) {
      console.warn(`[infinite-room] ${label}: more than ${BITMAP_INFINITE_MAX_ROOMS} infinite rooms, this one is not looped.`);
      return;
    }
    let zone = resolveRoomZone(room, label);
    if (zone && !carryEnabled) {
      console.warn(`[infinite-room] ${label}: has a trigger zone but the carry_and_throw skill is not enabled; the loop stays at its initial state.`);
      zone = null;
    }
    if (!zone) {
      console.warn(`[infinite-room] ${label}: no usable trigger zone, the loop is constant (${config.initialLoopActive === false ? 'off' : 'on'}).`);
    }
    entries.push({ roomIndex, initialLoopActive: config.initialLoopActive !== false, zone });
  });
  return { entries, zoneLogic: carryEnabled && entries.some(entry => entry.zone) };
}

export function buildBitmapInfiniteRoomRamBytes(data: BitmapInfiniteRoomData): number {
  return data.entries.length ? HEADER_BYTES + ZONE_BYTES + data.entries.length * SAVE_RECORD_BYTES : 0;
}

const emptySystem: BitmapInfiniteRoomSystemAsm = {
  enabled: false,
  ramBytes: 0,
  equates: '',
  preLoadInitAsm: '',
  commitCarryLoadAsm: (carryLoadCallAsm: string) => carryLoadCallAsm,
  loadCallAsm: '',
  updateCallAsm: '',
  railHookAsm: '',
  routinesAsm: '',
  dataAsm: '',
};

export function buildBitmapInfiniteRoomSystemAsm(
  roomCount: number,
  data: BitmapInfiniteRoomData,
  opts: BitmapInfiniteRoomOptions,
): BitmapInfiniteRoomSystemAsm {
  if (!data.entries.length) return emptySystem;
  const anchorCount = data.entries.length;
  const zoneLogic = data.zoneLogic;
  const carryOn = opts.carrySlots > 0;
  const slots = Math.max(1, Math.min(2, opts.carrySlots));
  const ramBytes = buildBitmapInfiniteRoomRamBytes(data);
  const zoneBase = opts.ramBase + HEADER_BYTES;
  const saveBase = zoneBase + ZONE_BYTES;

  const equates = `; --- SCREEN 5 INFINITE ROOM runtime (${ramBytes} bytes) ---
; header: active loop level, current anchor (#FF = room is not infinite), self-wrap latch
; zone copy (x0,y0,x1,y1,slotMask,flags) and per-anchor save records (valid mask + x,y per slot).
bitmap_inf_active    EQU ${hexWord(opts.ramBase)}
bitmap_inf_cur       EQU ${hexWord(opts.ramBase + 1)}
bitmap_inf_self_wrap EQU ${hexWord(opts.ramBase + 2)}
bitmap_inf_zone      EQU ${hexWord(zoneBase)}
bitmap_inf_save      EQU ${hexWord(saveBase)}
`;

  // --- data tables (resident, read below #8000 like the carry tables) ---
  const roomTableBytes: number[] = Array.from({ length: roomCount }, () => 0xff);
  data.entries.forEach((entry, anchor) => { roomTableBytes[entry.roomIndex] = anchor; });
  const fmt = (label: string, bytes: number[], comment: string) => {
    const lines = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      lines.push(`    DB ${bytes.slice(i, i + 16).map(hexByte).join(',')}`);
    }
    return `${lines.join('\n')}\n`;
  };
  const zoneBytes = data.entries.flatMap(entry => {
    const z = entry.zone;
    const flags = (entry.initialLoopActive ? ZONE_FLAG_INITIAL : 0) | (z ? ZONE_FLAG_HAS_ZONE : 0);
    return [z?.x0 ?? 0, z?.y0 ?? 0, z?.x1 ?? 0, z?.y1 ?? 0, z?.slotMask ?? 0, flags, 0, 0];
  });
  const dataAsm = fmt('bitmap_inf_room_table', roomTableBytes, 'Infinite Room: anchor index per room (#FF = not infinite)')
    + fmt('bitmap_inf_zone_table', zoneBytes, `Infinite Room: per anchor ${ZONE_RECORD_STRIDE} bytes (x0,y0,x1,y1 exclusive px, carry slot mask, flags b0=initial loop b1=has zone, pad x2)`);

  // --- sound: two distinct fire-and-forget PSG blips on SFX channel C ---
  const sfxAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_sfx_loop_off
; ------------------------------------------------------------
; PURPOSE:
;   "Loop off / solved" blip: high bright tone on PSG channel C with a fast
;   envelope decay. Fire-and-forget register writes, no per-frame engine.
;
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; SIDE EFFECTS: Writes PSG registers through ports #A0/#A1; sets the channel-C mixer shadow.
; ------------------------------------------------------------
bitmap_sfx_loop_off:
    ld hl, bitmap_sfx_loop_off_data
    jp bitmap_sfx_loop_play

; ------------------------------------------------------------
; FUNCTION: bitmap_sfx_loop_on
; ------------------------------------------------------------
; PURPOSE:
;   "Loop on" blip: low dull tone on PSG channel C, slower decay, so the
;   player hears the difference between solving and un-solving the zone.
;
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; SIDE EFFECTS: Writes PSG registers through ports #A0/#A1; sets the channel-C mixer shadow.
; ------------------------------------------------------------
bitmap_sfx_loop_on:
    ld hl, bitmap_sfx_loop_on_data
bitmap_sfx_loop_play:
    ld b, 7
.inf_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .inf_sfx_loop
    ld a, #20               ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_sfx_loop_off_data:
    db 7,#3B,4,#0F,5,#00,11,#28,12,#00,10,#10,13,#09
bitmap_sfx_loop_on_data:
    db 7,#3B,4,#C0,5,#00,11,#48,12,#00,10,#10,13,#09
`;

  // --- zone check: only when carry is on and some room has a zone ---
  const slotChecks = Array.from({ length: slots }, (_unused, slot) => `.inf_slot_${slot}:
    ld a, (bitmap_carry_state + ${slot})
    or a
    jp nz, .inf_slot_${slot}_done      ; carried / flying / inactive: not resting
    ld a, (bitmap_carry_x + ${slot})
    ld (ix+${1 + slot * 2}), a
    ld a, (bitmap_carry_y + ${slot})
    ld (ix+${2 + slot * 2}), a          ; remember the resting position for re-entry
    ld a, (ix+0)
    or ${1 << slot}
    ld (ix+0), a
    ld a, (bitmap_inf_zone + 4)
    and ${1 << slot}
    jp z, .inf_slot_${slot}_done      ; this slot is not a target of the zone
    ld a, (bitmap_carry_x + ${slot})
    add a, 8
    ld b, a                             ; B = centre X
    ld a, (bitmap_inf_zone)
    ld c, a
    ld a, b
    cp c
    jp c, .inf_slot_${slot}_done      ; left of the zone
    ld a, (bitmap_inf_zone + 2)
    ld c, a
    ld a, b
    cp c
    jp nc, .inf_slot_${slot}_done     ; right of the zone
    ld a, (bitmap_carry_y + ${slot})
    add a, 8
    ld b, a                             ; B = centre Y
    ld a, (bitmap_inf_zone + 1)
    ld c, a
    ld a, b
    cp c
    jp c, .inf_slot_${slot}_done      ; above the zone
    ld a, (bitmap_inf_zone + 3)
    ld c, a
    ld a, b
    cp c
    jp nc, .inf_slot_${slot}_done     ; below the zone
    ld e, 1                             ; resting carryable centre inside the zone
.inf_slot_${slot}_done:`).join('\n');

  const restoreSlots = Array.from({ length: slots }, (_unused, slot) => `    ld a, (ix+0)
    and ${1 << slot}
    jp z, .inf_restore_${slot}_done
    ld a, (ix+${1 + slot * 2})
    ld (bitmap_carry_x + ${slot}), a
    ld a, (ix+${2 + slot * 2})
    ld (bitmap_carry_y + ${slot}), a
.inf_restore_${slot}_done:`).join('\n');

  const saveBaseAsm = `    ld a, (bitmap_inf_cur)
    ld c, a
    add a, a
    add a, a
    add a, c                    ; A = anchor * ${SAVE_RECORD_BYTES}
    ld c, a
    ld b, 0
    ld ix, bitmap_inf_save
    add ix, bc                  ; IX = this room's save record
`;

  const zoneRoutinesAsm = zoneLogic ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_inf_eval
; ------------------------------------------------------------
; PURPOSE:
;   Evaluate the loop level of the current infinite room:
;   active = initialLoopActive XOR (a RESTING carryable has its centre inside the zone).
;   While at it, record every resting carryable position in the room's save record.
;
; INPUT:
;   bitmap_inf_cur (valid anchor), bitmap_inf_zone, bitmap_carry_state/x/y.
;
; OUTPUT:
;   D = loop level (0/1).
;
; DESTROYS:
;   AF, BC, DE, IX.
;
; PRESERVES:
;   HL, IY.
;
; SIDE EFFECTS:
;   Writes the room's bitmap_inf_save record. Does not play sound and does not
;   write bitmap_inf_active (callers decide).
; ------------------------------------------------------------
bitmap_inf_eval:
    ld a, (bitmap_inf_zone + 5)
    ld d, a                     ; D = zone flags (kept: the slot checks only use A, B, C, E)
    and ${ZONE_FLAG_HAS_ZONE}
    jp z, .inf_eval_constant
${saveBaseAsm}    ld e, 0                     ; E = zone satisfied
${slotChecks}
    ld a, d
    and ${ZONE_FLAG_INITIAL}
    xor e                       ; initial XOR inside
    ld d, a
    ret
.inf_eval_constant:
    ld a, d
    and ${ZONE_FLAG_INITIAL}
    ld d, a                     ; no zone: the loop level is the constant initial state
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_inf_restore_carry
; ------------------------------------------------------------
; PURPOSE:
;   After bitmap_load_carry_objects reset the slots to their authored cells,
;   put the carryables back where the player left them in this infinite room.
;
; INPUT:  bitmap_inf_cur (valid anchor).
; OUTPUT: bitmap_carry_x/y overwritten for the slots that have a saved position.
; DESTROYS: AF, BC, IX.  PRESERVES: DE, HL, IY.
; ------------------------------------------------------------
bitmap_inf_restore_carry:
${saveBaseAsm}${restoreSlots}
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_inf_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame zone check. Recomputes the loop level and, when it changed because
;   of the zone, stores it and plays the matching blip (off = solved, on = unsolved).
;
; INPUT:  None.
; OUTPUT: bitmap_inf_active updated.
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; CALLS: bitmap_inf_eval, bitmap_sfx_loop_off, bitmap_sfx_loop_on.
; SIDE EFFECTS: PSG writes on a level change. Idle while a room transition runs.
; ------------------------------------------------------------
bitmap_inf_update:
    ld a, (bitmap_composition_state)
    or a
    ret nz                      ; transition in flight: positions are not trustworthy
    ld a, (bitmap_inf_cur)
    inc a
    ret z                       ; not an infinite room
    call bitmap_inf_eval        ; D = loop level
    ld a, (bitmap_inf_active)
    cp d
    ret z                       ; unchanged
    ld a, d
    ld (bitmap_inf_active), a
    or a
    jp z, bitmap_sfx_loop_off   ; loop switched off: "solved"
    jp bitmap_sfx_loop_on
` : '';

  const restoreHere = zoneLogic ? '    call bitmap_inf_restore_carry   ; box left in the zone is still there\n' : '';
  const levelHere = zoneLogic
    ? `    call bitmap_inf_eval            ; silent: derive the level from the restored positions
    ld a, d
    ld (bitmap_inf_active), a
`
    : `    ld a, (bitmap_inf_zone + 5)
    and ${ZONE_FLAG_INITIAL}
    ld (bitmap_inf_active), a       ; no zone logic: constant initial level
`;
  const wrapCarryAsm = carryOn ? `    ld a, #FF
    ld (bitmap_carry_draw_page), a  ; the new page was composed from ROM: repaint bitmap carryables
` : '';
  const bankRestoreAsm = opts.bankedRle ? '    call bitmap_room_restore_resident_banks   ; a loader before us may leave P2 on a data bank\n' : '';

  const loadRoutineAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_inf_load_room
; ------------------------------------------------------------
; PURPOSE:
;   Per-room hook run after the carry load (boot and room commit). Caches the
;   current room's anchor, copies its zone, restores saved carryable positions and
;   derives the loop level silently (no sound at load).
;   After a self-wrap (loop active, destination == current room) the carry slots
;   were NOT reloaded, so a held box is still held; only the repaint latch is reset.
;
; INPUT:  current_screen_index, bitmap_inf_self_wrap.
; OUTPUT: bitmap_inf_cur, bitmap_inf_zone, bitmap_inf_active.
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_inf_load_room:
    ld a, (bitmap_inf_self_wrap)
    or a
    jp z, .inf_load_normal
    xor a
    ld (bitmap_inf_self_wrap), a
${wrapCarryAsm}    ret                         ; same room, same anchor, same zone, same level
.inf_load_normal:
${bankRestoreAsm}    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_inf_room_table
    add hl, de
    ld a, (hl)
    ld (bitmap_inf_cur), a
    cp #FF
    jp nz, .inf_load_anchor
    xor a
    ld (bitmap_inf_active), a
    ret
.inf_load_anchor:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl                  ; anchor * ${ZONE_RECORD_STRIDE}
    ld de, bitmap_inf_zone_table
    add hl, de
    ld de, bitmap_inf_zone
    ld bc, ${ZONE_BYTES}
    ldir
${restoreHere}${levelHere}    ret
`;

  // A shaft cabin crossing a room boundary forces its own target room; that request wins.
  // The hook sits BEFORE the shaft override (which consumes the request), so it can still see it.
  const shaftWinsAsm = opts.shaftOverride
    ? `    ld a, (bitmap_shaft_forced_room)
    cp #FF
    ld a, b                     ; (ld does not touch the flags)
    jp nz, .inf_keep_rail       ; a shaft hand-over is in flight: it picks the room
`
    : '';
  const railHookAsm = `    ; Infinite Room: while the room's loop is active the destination is the room itself.
    ld b, a                     ; B = the rail proposed so far (C = direction)
    ld a, (bitmap_inf_active)
    or a
    ld a, b                     ; (ld does not touch the flags)
    jp z, .inf_keep_rail
${shaftWinsAsm}    ld a, 1
    ld (bitmap_inf_self_wrap), a ; commit must keep the carry slots
    ld a, (current_screen_index)
.inf_keep_rail:
`;

  return {
    enabled: true,
    ramBytes,
    equates,
    preLoadInitAsm: `    ; Infinite Room: clear the self-wrap latch and the saved carryable positions before the
    ; start room is loaded (cold-boot RAM is garbage and the loader reads them).
    xor a
    ld (bitmap_inf_self_wrap), a
    ld (bitmap_inf_active), a
    ld hl, bitmap_inf_save
    ld de, bitmap_inf_save + 1
    ld bc, ${anchorCount * SAVE_RECORD_BYTES - 1}
    ld (hl), a
    ldir
`,
    commitCarryLoadAsm: (carryLoadCallAsm: string) => carryOn
      ? `    ld a, (bitmap_inf_self_wrap)   ; Infinite Room self-wrap: keep the carry slots
    or a
${carryLoadCallAsm.replace('    call ', '    call z, ')}`
      : carryLoadCallAsm,
    loadCallAsm: '    call bitmap_inf_load_room\n',
    updateCallAsm: zoneLogic ? '    call bitmap_inf_update\n' : '',
    railHookAsm,
    routinesAsm: `${sfxAsm}${loadRoutineAsm}${zoneRoutinesAsm}`,
    dataAsm,
  };
}
