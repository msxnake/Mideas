import { Msx2CarryAndThrowConfig } from '../../../msx2PlatformPhysics';
import { Msx2Screen5BitmapRoom } from '../../../../types';
import { buildHardwareSpriteLayersForFrame, resolveMsx2SpriteById } from './msx2Screen4Generator';
import { isMsx2CarryableEntity } from './msx2CarryObjectGenerator';

/** Maximum number of carryable objects exported per SCREEN 5 room. */
export const BITMAP_MAX_CARRY_AND_THROW_SLOTS = 2;
export const BITMAP_CARRY_AND_THROW_POOL_STRIDE = 12;
export const BITMAP_CARRY_ROOM_RECORD_STRIDE = 6;
const BITMAP_CARRY_RAM_HEADER_BYTES = 5;
const BITMAP_CARRY_COMMAND_BYTES = 15;

const DEFAULT_PATTERN = [
  0x00, 0x03, 0x0F, 0x1F, 0x3F, 0x3F, 0x7F, 0x7F,
  0x7F, 0x7F, 0x3F, 0x3F, 0x1F, 0x0F, 0x03, 0x00,
  0x00, 0xC0, 0xF0, 0xF8, 0xFC, 0xFC, 0xFE, 0xFE,
  0xFE, 0xFE, 0xFC, 0xFC, 0xF8, 0xF0, 0xC0, 0x00,
];

function asmByte(value: number): string {
  return `#${Math.max(0, Math.min(255, Math.floor(Number(value) || 0))).toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  return `#${Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0))).toString(16).toUpperCase().padStart(4, '0')}`;
}

function buildCarryInputRoutine(config: Msx2CarryAndThrowConfig): string {
  const key = config.primaryKeyboard || { label: 'M', row: 4, mask: 0x04 };
  const mask = asmByte(key.mask);
  return `bitmap_carry_and_throw_pressed:
    ; ------------------------------------------------------------
    ; FUNCTION: bitmap_carry_and_throw_pressed
    ; PURPOSE: Reads the configured carry/throw keyboard binding directly from PPI.
    ; INPUT: none.
    ; OUTPUT: A=1 while pressed, A=0 otherwise (Z set when released).
    ; DESTROYS: AF.
    ; PRESERVES: BC, DE, HL, IX, IY.
    ; ------------------------------------------------------------
    in a, (PPI_C)
    and #F0
    or ${key.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${mask}
    ret z
    ld a, 1
    ret
`;
}

function clampTile(value: unknown, max: number): number {
  return Math.max(0, Math.min(max, Number(value) || 0));
}

function spriteIdForEntity(entity: any): string {
  return String(
    entity?.components?.msx2_hardware_sprite?.msx2SpriteAssetId
      || entity?.components?.msx2_render?.msx2SpriteAssetId
      || entity?.components?.msx2_render?.spriteAssetId
      || entity?.spriteAssetId
      || entity?.params?.sprite
      || entity?.params?.spriteId
      || '',
  ).trim();
}

function bitmapAtlasEntryIdForEntity(entity: any): string {
  return String(
    entity?.components?.msx2_bitmap_sprite?.atlasEntryId
      || entity?.components?.msx2_bitmap_sprite?.bitmapAtlasEntryId
      || entity?.components?.msx2_render?.bitmapAtlasEntryId
      || entity?.params?.carryableBitmapAtlasEntryId
      || entity?.params?.bitmapSpriteAtlasEntryId
      || '',
  ).trim();
}

function bitmapAtlasEntryForEntity(entity: any, room: Msx2Screen5BitmapRoom): any | undefined {
  const renderMode = String(
    entity?.components?.msx2_bitmap_sprite?.renderMode
      || entity?.components?.msx2_render?.renderMode
      || entity?.params?.carryableRenderMode
      || '',
  ).trim().toLowerCase();
  if (renderMode !== 'bitmap_sprite' && renderMode !== 'bitmap') return undefined;
  const entryId = bitmapAtlasEntryIdForEntity(entity);
  const entry = entryId ? (room.atlas?.entries || []).find(item => item.id === entryId) : undefined;
  return entry && Number(entry.w) >= 16 && Number(entry.h) >= 16 ? entry : undefined;
}

export interface BitmapCarryAndThrowRoomData {
  maxSlots: number;
  bitmapSlots: number;
  roomTables: number[][];
  patternBytes: number[];
  colorBytes: number[];
}

/** Collects one 16x16 hardware or bitmap visual per carryable entity. */
export function buildBitmapCarryAndThrowData(
  analysis: any,
  rooms: Msx2Screen5BitmapRoom[],
): BitmapCarryAndThrowRoomData {
  const patternBytes: number[] = [];
  const colorBytes: number[] = [];
  const patternBySprite = new Map<string, number>();
  const roomSlots = rooms.map(room => (room.entities || [])
    .filter((entity: any) => entity?.kind !== 'player' && entity?.position && isMsx2CarryableEntity(entity))
    .slice(0, BITMAP_MAX_CARRY_AND_THROW_SLOTS)
    .map((entity: any) => {
      const spriteId = spriteIdForEntity(entity);
      const key = spriteId || '__default_rock__';
      let patternOffset = patternBySprite.get(key);
      if (patternOffset === undefined) {
        const sprite = spriteId ? resolveMsx2SpriteById(analysis, spriteId) : undefined;
        const layer = sprite
          ? buildHardwareSpriteLayersForFrame(sprite, 14, 0)
            .find(candidate => candidate.xOffset === 0 && candidate.yOffset === 0)
            || buildHardwareSpriteLayersForFrame(sprite, 14, 0)[0]
          : undefined;
        const pattern = (layer?.pattern || DEFAULT_PATTERN).slice(0, 32);
        while (pattern.length < 32) pattern.push(0);
        const colors = (layer?.colors || []).slice(0, 16);
        while (colors.length < 16) colors.push(14);
        patternOffset = patternBytes.length / 32;
        patternBySprite.set(key, patternOffset);
        patternBytes.push(...pattern.map(value => value & 0xff));
        colorBytes.push(...colors.map(value => value & 0xff));
      }
      const bitmapEntry = bitmapAtlasEntryForEntity(entity, room);
      return {
        x: clampTile(entity.position?.x, 15) * 16,
        y: clampTile(entity.position?.y, 11) * 16,
        patternOffset,
        bitmapMode: bitmapEntry ? 1 : 0,
        bitmapSourceX: bitmapEntry ? clampTile(bitmapEntry.sx, 255) : 0,
        bitmapSourceRow: bitmapEntry ? clampTile(Math.floor(Number(bitmapEntry.sy || 0) / 16), 63) : 0,
      };
    }));
  const maxSlots = Math.max(0, ...roomSlots.map(slots => slots.length));
  const bitmapSlots = Math.max(0, ...roomSlots.map(slots => slots.filter(item => item.bitmapMode).length));
  if (!maxSlots) return { maxSlots: 0, bitmapSlots: 0, roomTables: [], patternBytes: [], colorBytes: [] };
  const roomTables = roomSlots.map(slots => {
    const bytes = [slots.length & 0xff];
    for (let slot = 0; slot < maxSlots; slot++) {
      const item = slots[slot];
      bytes.push(item?.x || 0, item?.y || 0, item?.patternOffset || 0, item?.bitmapMode || 0, item?.bitmapSourceX || 0, item?.bitmapSourceRow || 0);
    }
    return bytes;
  });
  return { maxSlots, bitmapSlots, roomTables, patternBytes, colorBytes };
}

export interface BitmapCarryAndThrowRuntimeOptions {
  ramBase: number;
  satBase: number;
  colorBase: number;
  patternGroupBase: number;
  gameYOffset: number;
  screenWidth: number;
  enemySlotCount: number;
  enemyPoolStride: number;
  bitmapAtlasBaseY?: number;
  bitmapScratchBaseY?: number;
  pauseGateAsm?: string;
}

export interface BitmapCarryAndThrowSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  loadCallAsm: string;
  updateCallAsm: string;
  satCallAsm: string;
  bitmapDrawCallAsm: string;
  initClearAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

export function bitmapCarryAndThrowEnabled(
  config: Msx2CarryAndThrowConfig | undefined,
  data: BitmapCarryAndThrowRoomData | undefined,
): boolean {
  return Boolean(config?.enabled && data?.maxSlots);
}

export function bitmapCarryAndThrowRamBytes(
  config: Msx2CarryAndThrowConfig | undefined,
  data: BitmapCarryAndThrowRoomData | undefined,
): number {
  return bitmapCarryAndThrowEnabled(config, data)
    ? BITMAP_CARRY_RAM_HEADER_BYTES
      + (data!.maxSlots * BITMAP_CARRY_AND_THROW_POOL_STRIDE)
      + (data!.bitmapSlots > 0 ? BITMAP_CARRY_COMMAND_BYTES : 0)
    : 0;
}

export function buildBitmapCarryAndThrowEquates(
  config: Msx2CarryAndThrowConfig | undefined,
  data: BitmapCarryAndThrowRoomData | undefined,
  ramBase: number,
): string {
  if (!bitmapCarryAndThrowEnabled(config, data)) return '';
  const slots = data!.maxSlots;
  const drawPage = ramBase + 4;
  const x = ramBase + BITMAP_CARRY_RAM_HEADER_BYTES;
  const y = x + slots;
  const vx = y + slots;
  const vy = vx + slots;
  const state = vy + slots;
  const pattern = state + slots;
  const render = pattern + slots;
  const sourceX = render + slots;
  const sourceRow = sourceX + slots;
  const drawn = sourceRow + slots;
  const oldX = drawn + slots;
  const oldY = oldX + slots;
  const commandBuffer = oldY + slots;
  return `; --- SCREEN 5 CARRY & THROW runtime (${bitmapCarryAndThrowRamBytes(config, data)} bytes) ---
bitmap_carry_slot     EQU ${asmWord(ramBase)}
bitmap_carry_lock     EQU ${asmWord(ramBase + 1)}
bitmap_carry_cooldown EQU ${asmWord(ramBase + 2)}
bitmap_carry_count    EQU ${asmWord(ramBase + 3)}
bitmap_carry_draw_page EQU ${asmWord(drawPage)}
bitmap_carry_x        EQU ${asmWord(x)}
bitmap_carry_y        EQU ${asmWord(y)}
bitmap_carry_vx       EQU ${asmWord(vx)}
bitmap_carry_vy       EQU ${asmWord(vy)}
bitmap_carry_state    EQU ${asmWord(state)}
bitmap_carry_pattern  EQU ${asmWord(pattern)}
bitmap_carry_render   EQU ${asmWord(render)}
bitmap_carry_source_x EQU ${asmWord(sourceX)}
bitmap_carry_source_row EQU ${asmWord(sourceRow)}
bitmap_carry_drawn    EQU ${asmWord(drawn)}
bitmap_carry_old_x    EQU ${asmWord(oldX)}
bitmap_carry_old_y    EQU ${asmWord(oldY)}
${data!.bitmapSlots > 0 ? `bitmap_carry_cmd_buffer EQU ${asmWord(commandBuffer)}
` : ''}
; Shared HUD state. #C1FC is the classic hearts dirty byte when no linked HUD
; exists; linked carry HUDs disable that legacy renderer, so the byte is safe.
bitmap_carry_held     EQU #C1FC
BITMAP_MAX_CARRY_AND_THROW_SLOTS EQU ${slots}
BITMAP_CARRY_BITMAP_SLOTS EQU ${data!.bitmapSlots}
`;
}

function emitBytes(label: string, bytes: number[], comment: string): string {
  const lines = [`; ${comment}`, `${label}:`];
  for (let i = 0; i < bytes.length; i += 16) {
    lines.push(`    DB ${bytes.slice(i, i + 16).map(value => asmByte(value)).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

export function buildBitmapCarryAndThrowDataAsm(data: BitmapCarryAndThrowRoomData): string {
  if (!data.maxSlots) return '';
  return data.roomTables.map((table, index) => emitBytes(
    `bitmap_room_carry_table_${index}`,
    table,
    `Room ${index} carryable objects: count + ${data.maxSlots} slot(s) x ${BITMAP_CARRY_ROOM_RECORD_STRIDE} bytes (x,y,pattern,render,sourceX,sourceRow)`,
  )).join('')
    + `bitmap_room_carry_ptr_table:\n${data.roomTables.map((_table, index) => `    DW bitmap_room_carry_table_${index}`).join('\n')}\n`
    + emitBytes('bitmap_carry_sprite_patterns', data.patternBytes, 'SCREEN 5 carryable object patterns')
    + emitBytes('bitmap_carry_sprite_colors', data.colorBytes, 'SCREEN 5 carryable object line colours');
}

export function buildBitmapCarryAndThrowSystemAsm(
  config: Msx2CarryAndThrowConfig | undefined,
  data: BitmapCarryAndThrowRoomData,
  opts: BitmapCarryAndThrowRuntimeOptions,
): BitmapCarryAndThrowSystemAsm {
  if (!bitmapCarryAndThrowEnabled(config, data)) {
    return { enabled: false, ramBytes: 0, equates: '', loadCallAsm: '', updateCallAsm: '', satCallAsm: '', bitmapDrawCallAsm: '', initClearAsm: '', routinesAsm: '', dataAsm: '' };
  }
  const slots = data.maxSlots;
  const stride = BITMAP_CARRY_AND_THROW_POOL_STRIDE;
  const xOff = 0;
  const yOff = slots;
  const vxOff = slots * 2;
  const vyOff = slots * 3;
  const stateOff = slots * 4;
  const patternOff = slots * 5;
  const renderOff = slots * 6;
  const sourceXOff = slots * 7;
  const sourceRowOff = slots * 8;
  const drawnOff = slots * 9;
  const oldXOff = slots * 10;
  const oldYOff = slots * 11;
  const speed = asmByte(Math.max(1, Math.min(24, config!.throwSpeed)));
  const gravity = asmByte(Math.max(1, Math.min(8, config!.throwGravity)));
  const initialVy = asmByte((256 - Math.max(1, Math.min(24, config!.throwVertical))) & 0xff);
  const cooldown = asmByte(Math.max(1, Math.min(120, config!.throwCooldown)));
  const pickupRadius = Math.max(8, Math.min(32, Math.floor(config!.pickupRadius)));
  const objectCollision = config!.objectCollision;
  const patternBase = opts.patternGroupBase * 32;
  const satStart = opts.satBase;
  const colorStart = opts.colorBase;
  const hiddenY = 0xd4;
  const fieldNames = new Map<number, string>([
    [xOff, 'x'], [yOff, 'y'], [vxOff, 'vx'], [vyOff, 'vy'], [stateOff, 'state'],
    [patternOff, 'pattern'], [renderOff, 'render'], [sourceXOff, 'source_x'],
    [sourceRowOff, 'source_row'], [drawnOff, 'drawn'], [oldXOff, 'old_x'], [oldYOff, 'old_y'],
  ]);
  const slotAddress = (offset: number, slot: number) => `bitmap_carry_${fieldNames.get(offset)} + ${slot}`;
  const bitmapEnabled = data.bitmapSlots > 0 && opts.bitmapScratchBaseY !== undefined;
  const bitmapAtlasBaseY = Math.max(0, Math.min(1023, Math.trunc(opts.bitmapAtlasBaseY ?? 512)));
  const bitmapScratchBaseY = Math.max(0, Math.min(1023, Math.trunc(opts.bitmapScratchBaseY ?? 0)));

  const loadSlots = Array.from({ length: slots }, (_unused, slot) => {
    const tableGuard = `.carry_load_slot_${slot}`;
    const patternVram = patternBase + slot * 32;
    const colorVram = colorStart + slot * 16;
    return `    ld a, (bitmap_carry_count)
    cp ${slot + 1}
    jp c, .carry_load_slot_${slot}_inactive
    ld a, (ix+0)
    ld (${slotAddress(xOff, slot)}), a
    inc ix
    ld a, (ix+0)
    ld (${slotAddress(yOff, slot)}), a
    inc ix
    ld a, (ix+0)
    ld (${slotAddress(patternOff, slot)}), a
    inc ix
    ld a, (ix+0)
    ld (${slotAddress(renderOff, slot)}), a
    inc ix
    ld a, (ix+0)
    ld (${slotAddress(sourceXOff, slot)}), a
    inc ix
    ld a, (ix+0)
    ld (${slotAddress(sourceRowOff, slot)}), a
    inc ix
    xor a
    ld (${slotAddress(stateOff, slot)}), a
    ld (${slotAddress(drawnOff, slot)}), a
    ld (${slotAddress(oldXOff, slot)}), a
    ld (${slotAddress(oldYOff, slot)}), a
    ld a, (${slotAddress(renderOff, slot)})
    or a
    jp nz, .carry_load_slot_${slot}_bitmap
    ld a, (${slotAddress(patternOff, slot)})
    call bitmap_carry_patterns_offset
    ld de, ${asmWord(patternVram)}
    ld bc, 32
    call copy_to_vram_ext
    ld a, (${slotAddress(patternOff, slot)})
    call bitmap_carry_colors_offset
    ld de, ${asmWord(colorVram)}
    ld bc, 16
    call copy_to_vram_ext
    jp ${tableGuard}_done
.carry_load_slot_${slot}_bitmap:
    ; Bitmap visuals are copied from the SCREEN 5 atlas at runtime. They do not
    ; consume a hardware SAT pattern or colour-table slot.
    jp ${tableGuard}_done
.carry_load_slot_${slot}_inactive:
    ld a, #FF
    ld (${slotAddress(stateOff, slot)}), a
    xor a
    ld (${slotAddress(renderOff, slot)}), a
    ld (${slotAddress(drawnOff, slot)}), a
${tableGuard}_done:`;
  }).join('\n');

  const pickupChecks = Array.from({ length: slots }, (_unused, slot) => `    ld ix, bitmap_carry_x + ${slot}
    call bitmap_carry_pickup_probe
    or a
    jp z, .carry_pickup_miss_${slot}
    ld a, ${slot}
    jp .carry_pickup_hit
.carry_pickup_miss_${slot}:`).join('\n');

  const phaseCalls = Array.from({ length: slots }, (_unused, slot) => `    ld ix, bitmap_carry_x + ${slot}
    call bitmap_carry_step`).join('\n');

  const satSlots = Array.from({ length: slots }, (_unused, slot) => {
    const groupByte = opts.patternGroupBase + slot;
    return `.carry_sat_${slot}:
    ld a, (bitmap_carry_state + ${slot})
    cp #FF
    jp z, .carry_sat_${slot}_hidden
    ld a, (bitmap_carry_render + ${slot})
    or a
    jp nz, .carry_sat_${slot}_hidden
    ld a, (bitmap_carry_y + ${slot})
    add a, ${asmByte(opts.gameYOffset)}
    out (VDP_DATA_PORT), a
    ld a, (bitmap_carry_x + ${slot})
    out (VDP_DATA_PORT), a
    ld a, ${asmByte(groupByte * 4)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .carry_sat_${slot}_done
.carry_sat_${slot}_hidden:
    ld a, ${asmByte(hiddenY)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.carry_sat_${slot}_done:`;
  }).join('\n');

  const bitmapCommandByte = (offset: number) => `bitmap_carry_cmd_buffer + ${offset}`;
  const setCommandImmediate = (offset: number, value: number) => `    ld a, ${asmByte(value)}
    ld (${bitmapCommandByte(offset)}), a
`;
  const setCommandMemory = (offset: number, label: string) => `    ld a, (${label})
    ld (${bitmapCommandByte(offset)}), a
`;
  const setCommandWordImmediate = (offset: number, value: number) => `${setCommandImmediate(offset, value & 0xff)}${setCommandImmediate(offset + 1, (value >> 8) & 0xff)}`;
  const setCommandSourceAtlasY = (slot: number) => `    ld a, (${slotAddress(sourceRowOff, slot)})
    add a, a
    add a, a
    add a, a
    add a, a
    add a, ${asmByte(bitmapAtlasBaseY & 0xff)}
    ld (${bitmapCommandByte(2)}), a
    ld a, (${slotAddress(sourceRowOff, slot)})
    srl a
    srl a
    srl a
    srl a
    add a, ${asmByte((bitmapAtlasBaseY >> 8) & 0xff)}
    ld (${bitmapCommandByte(3)}), a
`;
  // X coordinates fed to the VDP commands are forced EVEN (and #FE): HMMM is a
  // byte command and in SCREEN 5 it ignores bit 0 of SX/DX, while the LMMM draw
  // is pixel-accurate. With an odd X the drawn rectangle would extend one pixel
  // past the saved/restored rectangle, leaving a 1px column trail behind moving
  // carryables. Masking all three commands keeps the rectangles coincident.
  const setCommandDestinationCurrent = (slot: number) => `    ld a, (${slotAddress(xOff, slot)})
    and #FE
    ld (${bitmapCommandByte(4)}), a
    xor a
    ld (${bitmapCommandByte(5)}), a
    ld a, (${slotAddress(yOff, slot)})
    add a, ${asmByte(opts.gameYOffset)}
    ld (${bitmapCommandByte(6)}), a
    ld a, (bitmap_displayed_page)
    ld (${bitmapCommandByte(7)}), a
`;
  const setCommandSourceCurrent = (slot: number) => `    ld a, (${slotAddress(xOff, slot)})
    and #FE
    ld (${bitmapCommandByte(0)}), a
    xor a
    ld (${bitmapCommandByte(1)}), a
    ld a, (${slotAddress(yOff, slot)})
    add a, ${asmByte(opts.gameYOffset)}
    ld (${bitmapCommandByte(2)}), a
    ld a, (bitmap_displayed_page)
    ld (${bitmapCommandByte(3)}), a
`;
  const setCommandDestinationOld = (slot: number) => `    ld a, (${slotAddress(oldXOff, slot)})
    and #FE
    ld (${bitmapCommandByte(4)}), a
    xor a
    ld (${bitmapCommandByte(5)}), a
    ld a, (${slotAddress(oldYOff, slot)})
    add a, ${asmByte(opts.gameYOffset)}
    ld (${bitmapCommandByte(6)}), a
    ld a, (bitmap_displayed_page)
    ld (${bitmapCommandByte(7)}), a
`;
  const setCommandScratchSource = (scratchY: number) => `${setCommandWordImmediate(0, 0)}${setCommandWordImmediate(2, scratchY)}`;
  const setCommandScratchDestination = (scratchY: number) => `${setCommandWordImmediate(4, 0)}${setCommandWordImmediate(6, scratchY)}`;
  const setCommandSizeAndOp = (command: number) => `${setCommandWordImmediate(8, 16)}${setCommandWordImmediate(10, 16)}${setCommandImmediate(12, 0)}${setCommandImmediate(13, 0)}${setCommandImmediate(14, command)}`;
  const bitmapIssueCommandAsm = bitmapEnabled ? `
; FUNCTION: bitmap_carry_issue_command
; PURPOSE: Executes the 15-byte command in bitmap_carry_cmd_buffer.
; INPUT: command buffer populated by bitmap_draw_carry_objects.
; OUTPUT: None.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; SIDE EFFECTS: Uses VDP status 2 while waiting and restores R#15=S#0.
bitmap_carry_issue_command:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_carry_cmd_buffer
    ld b, 15
.carry_cmd_write:
    ld a, (hl)
    out (VDP_CMD_PORT), a
    inc hl
    djnz .carry_cmd_write
    ld a, #0F
    ld e, #00
    jp vdp_write_register
` : '';
  const bitmapDrawAsm = bitmapEnabled ? `
${bitmapIssueCommandAsm}
; FUNCTION: bitmap_draw_carry_objects
; PURPOSE: Restores and redraws multicolour carryables as SCREEN 5 bitmap patches.
; INPUT: carry runtime state and bitmap_displayed_page.
; OUTPUT: Current page contains the active bitmap carryables.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; NOTES: Each slot uses one scratch 16x16 rectangle after the atlas. The old
; background is restored before saving the new background and applying TIMP.
bitmap_draw_carry_objects:
    ld a, (bitmap_displayed_page)
    ld b, a
    ld a, (bitmap_carry_draw_page)
    cp b
    jp z, .carry_draw_page_ready
    ld a, b
    ld (bitmap_carry_draw_page), a
${Array.from({ length: slots }, (_unused, slot) => `    xor a
    ld (${slotAddress(drawnOff, slot)}), a`).join('\n')}
.carry_draw_page_ready:
${Array.from({ length: slots }, (_unused, slot) => {
    const scratchY = bitmapScratchBaseY + (slot * 16);
    const restore = `${setCommandScratchSource(scratchY)}${setCommandDestinationOld(slot)}${setCommandSizeAndOp(0xD0)}    call bitmap_carry_issue_command
`;
    const save = `${setCommandSourceCurrent(slot)}${setCommandScratchDestination(scratchY)}${setCommandSizeAndOp(0xD0)}    call bitmap_carry_issue_command
`;
    const draw = `${setCommandMemory(0, slotAddress(sourceXOff, slot))}    xor a
    ld (${bitmapCommandByte(1)}), a
${setCommandSourceAtlasY(slot)}${setCommandDestinationCurrent(slot)}${setCommandSizeAndOp(0x98)}    call bitmap_carry_issue_command
`;
    return `    ld a, (${slotAddress(renderOff, slot)})
    or a
    jp z, .carry_bitmap_slot_${slot}_done
    ld a, (${slotAddress(stateOff, slot)})
    cp #FF
    jp z, .carry_bitmap_slot_${slot}_hide
    ld a, (${slotAddress(drawnOff, slot)})
    or a
    jp z, .carry_bitmap_slot_${slot}_changed
    ld a, (${slotAddress(oldXOff, slot)})
    ld b, a
    ld a, (${slotAddress(xOff, slot)})
    cp b
    jp nz, .carry_bitmap_slot_${slot}_changed
    ld a, (${slotAddress(oldYOff, slot)})
    ld b, a
    ld a, (${slotAddress(yOff, slot)})
    cp b
    jp z, .carry_bitmap_slot_${slot}_done
.carry_bitmap_slot_${slot}_changed:
${restore}
${save}    ld a, (${slotAddress(xOff, slot)})
    ld (${slotAddress(oldXOff, slot)}), a
    ld a, (${slotAddress(yOff, slot)})
    ld (${slotAddress(oldYOff, slot)}), a
${draw}    ld a, 1
    ld (${slotAddress(drawnOff, slot)}), a
    jp .carry_bitmap_slot_${slot}_done
.carry_bitmap_slot_${slot}_hide:
    ld a, (${slotAddress(drawnOff, slot)})
    or a
    jp z, .carry_bitmap_slot_${slot}_done
${restore}    xor a
    ld (${slotAddress(drawnOff, slot)}), a
.carry_bitmap_slot_${slot}_done:`;
  }).join('\n')}
    ret
` : '';

  const enemyCollision = opts.enemySlotCount > 0 && config!.enemyCollision
    ? `
; FUNCTION: bitmap_carry_check_enemy_collision
; PURPOSE: Kills the first active enemy overlapping the flying object in IX.
; INPUT: IX = bitmap_carry_x + slot; bitmap_enemy_pool/count.
; OUTPUT: A = 1 when an enemy is marked dead (#FF movement mode).
; DESTROYS: AF, BC, DE, IY. PRESERVES: IX, HL.
bitmap_carry_check_enemy_collision:
    ld a, (bitmap_enemy_count)
    or a
    ret z
    ld b, a
    ld iy, bitmap_enemy_pool
.carry_enemy_loop:
    ld a, (iy+13)
    cp #FF
    jp z, .carry_enemy_next
    ld a, (ix+0)
    sub (iy+0)
    jp nc, .carry_enemy_dx_ok
    neg
.carry_enemy_dx_ok:
    cp 16
    jp nc, .carry_enemy_next
    ld a, (ix+${yOff})
    sub (iy+1)
    jp nc, .carry_enemy_dy_ok
    neg
.carry_enemy_dy_ok:
    cp 16
    jp nc, .carry_enemy_next
    ld (iy+13), #FF
    ld a, 1
    ret
.carry_enemy_next:
    ld de, ${opts.enemyPoolStride}
    add iy, de
    djnz .carry_enemy_loop
    xor a
    ret
`
    : `
bitmap_carry_check_enemy_collision:
    xor a
    ret
`;

  const routinesAsm = `${buildCarryInputRoutine(config!)}
; FUNCTION: bitmap_load_carry_objects
; PURPOSE: Loads the active room's carryable positions and sprite graphics.
; INPUT: current_screen_index.
; OUTPUT: carryable slot state/position arrays initialized.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
bitmap_load_carry_objects:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_room_carry_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (hl)
    ld (bitmap_carry_count), a
    inc hl
    push hl
    pop ix
    xor a
    ld (bitmap_carry_lock), a
    ld (bitmap_carry_cooldown), a
    ld (bitmap_carry_held), a
    ld a, #FF
    ld (bitmap_carry_draw_page), a
    ld a, #FF
    ld (bitmap_carry_slot), a
${loadSlots}
    ld a, #FF
    ld (bitmap_carry_slot), a
    ret

bitmap_carry_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_carry_sprite_patterns
    add hl, de
    ret

bitmap_carry_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_carry_sprite_colors
    add hl, de
    ret

; FUNCTION: bitmap_carry_pickup_probe
; PURPOSE: Tests whether the player overlaps the idle carryable in IX.
; INPUT: IX = bitmap_carry_x + slot.
; OUTPUT: A = 1 on overlap, A = 0 otherwise.
; DESTROYS: AF, BC. PRESERVES: IX, IY.
bitmap_carry_pickup_probe:
    ld a, (ix+${stateOff})
    or a
    jp nz, .carry_probe_no
    ld a, (ix+0)
    ld b, a
    ld a, (player_x)
    sub b
    jp nc, .carry_probe_dx
    neg
.carry_probe_dx:
    cp ${pickupRadius}
    jp nc, .carry_probe_no
    ld a, (ix+${yOff})
    ld b, a
    ld a, (player_y)
    sub b
    jp nc, .carry_probe_dy
    neg
.carry_probe_dy:
    cp ${pickupRadius + 8}
    jp nc, .carry_probe_no
    ld a, 1
    ret
.carry_probe_no:
    xor a
    ret

; FUNCTION: bitmap_carry_step
; PURPOSE: Advances one flying carryable through its ballistic arc.
; INPUT: IX = bitmap_carry_x + slot.
; OUTPUT: slot position/state updated.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
bitmap_carry_step:
    ld a, (ix+${stateOff})
    cp 2
    jp z, .carry_step_active
    ; State 3 is the launch frame. It follows the same ballistic update,
    ; but skips the initial solid probe so the object cannot collide with the
    ; player's support cell before it has visibly left the player.
    cp 3
    ret nz
.carry_step_active:
    ld a, (ix+${vxOff})
    bit 7, a
    jp nz, .carry_step_left
    ld a, (ix+0)
    add a, ${speed}
    jp c, .carry_step_land
    cp ${Math.max(1, opts.screenWidth - 16)}
    jp nc, .carry_step_land
    ld (ix+0), a
    jp .carry_step_vertical
.carry_step_left:
    ld a, (ix+0)
    sub ${speed}
    jp c, .carry_step_land
    ld (ix+0), a
.carry_step_vertical:
    ld a, (ix+${vyOff})
    bit 7, a
    jp nz, .carry_step_up
    ld d, a
    ld a, (ix+${yOff})
    add a, d
    jp c, .carry_step_land
    ld (ix+${yOff}), a
    jp .carry_step_gravity
.carry_step_up:
    neg
    ld d, a
    ld a, (ix+${yOff})
    sub d
    jp c, .carry_step_land
    ld (ix+${yOff}), a
.carry_step_gravity:
    ld a, (ix+${vyOff})
    add a, ${gravity}
    ld (ix+${vyOff}), a
    ld a, (ix+${stateOff})
    cp 3
    jp z, .carry_step_launch_done
    ld a, (ix+${yOff})
    cp 176
    jp nc, .carry_step_land
    push ix
    ld a, (ix+0)
    add a, 8
    ld b, a
    ld a, (ix+${yOff})
    add a, 8
    ld c, a
${objectCollision ? `    call bitmap_probe_solid
    pop ix
    or a
    jp nz, .carry_step_land
` : `    pop ix
`}${objectCollision ? '' : ''}    call bitmap_carry_check_enemy_collision
    or a
    ret z
.carry_step_launch_done:
    ld a, 2
    ld (ix+${stateOff}), a
    ret
.carry_step_land:
    ld a, (ix+${yOff})
    cp 176
    jp c, .carry_step_land_store
    ld a, 176
.carry_step_land_store:
    ld (ix+${yOff}), a
    xor a
    ld (ix+${stateOff}), a
    ret

; FUNCTION: update_bitmap_carry_and_throw
; PURPOSE: Handles B-button pickup/throw state and advances every object.
; INPUT: player position/facing and carry runtime RAM.
; OUTPUT: held HUD state and object slots updated.
; DESTROYS: AF, BC, DE, HL, IX, IY. PRESERVES: none.
update_bitmap_carry_and_throw:
${opts.pauseGateAsm || ''}    ld a, (bitmap_carry_cooldown)
    or a
    jp z, .carry_cooldown_done
    dec a
    ld (bitmap_carry_cooldown), a
.carry_cooldown_done:
    call bitmap_carry_and_throw_pressed
    or a
    jp nz, .carry_pressed
    xor a
    ld (bitmap_carry_lock), a
.carry_pressed:
    ld a, (bitmap_carry_slot)
    cp #FF
    jp z, .carry_try_pickup
    ld e, a
    ld d, 0
    ; A held object must keep its last carried position when the throw is
    ; accepted. The old order followed the player first, so player movement
    ; in this frame teleported the launch origin before the arc started.
    call bitmap_carry_and_throw_pressed
    or a
    jp z, .carry_follow_player
    ld a, (bitmap_carry_lock)
    or a
    jp nz, .carry_follow_player
    ld a, (bitmap_carry_cooldown)
    or a
    jp nz, .carry_follow_player
    jp .carry_throw
.carry_follow_player:
    ld hl, bitmap_carry_x
    add hl, de
    ld a, (player_x)
    ld (hl), a
    ld hl, bitmap_carry_y
    add hl, de
    ld a, (player_y)
    sub 16
    jp nc, .carry_follow_y_ok
    xor a
.carry_follow_y_ok:
    ld (hl), a
    jp .carry_update_phases
.carry_throw:
    ld a, (bitmap_carry_slot)
    ld e, a
    ld d, 0
    ld hl, bitmap_carry_vx
    add hl, de
    ld a, (player_facing)
    or a
    jp z, .carry_throw_left
    ld (hl), 1
    jp .carry_throw_vertical
.carry_throw_left:
    ld (hl), #FF
.carry_throw_vertical:
    ld hl, bitmap_carry_vy
    add hl, de
    ld a, ${initialVy}
    ld (hl), a
    ld hl, bitmap_carry_state
    add hl, de
    ld (hl), 3
    ld a, #FF
    ld (bitmap_carry_slot), a
    xor a
    ld (bitmap_carry_held), a
    ld a, ${cooldown}
    ld (bitmap_carry_cooldown), a
    ld a, 1
    ld (bitmap_carry_lock), a
    jp .carry_update_phases
.carry_try_pickup:
    call bitmap_carry_and_throw_pressed
    or a
    jp z, .carry_update_phases
    ld a, (bitmap_carry_lock)
    or a
    jp nz, .carry_update_phases
    ld a, (bitmap_carry_cooldown)
    or a
    jp nz, .carry_update_phases
${pickupChecks}
    jp .carry_update_phases
.carry_pickup_hit:
    ld (bitmap_carry_slot), a
    ld a, 1
    ld (bitmap_carry_held), a
    ld a, (bitmap_carry_slot)
    ld e, a
    ld d, 0
    ld hl, bitmap_carry_state
    add hl, de
    ld (hl), 1
    ld a, 1
    ld (bitmap_carry_lock), a
    ld a, ${cooldown}
    ld (bitmap_carry_cooldown), a
.carry_update_phases:
${phaseCalls}
    ret

${enemyCollision}
${bitmapDrawAsm}

; FUNCTION: bitmap_update_carry_sat
; PURPOSE: Appends carryable object sprites to the SCREEN 5 SAT stream.
; INPUT: bitmap_carry_state/x/y/pattern arrays.
; OUTPUT: carry slots plus a SAT terminator written to VRAM.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
bitmap_update_carry_sat:
    ld de, ${asmWord(satStart)}
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
${satSlots}
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
`;

  return {
    enabled: true,
    ramBytes: bitmapCarryAndThrowRamBytes(config, data),
    equates: buildBitmapCarryAndThrowEquates(config, data, opts.ramBase),
    loadCallAsm: '    call bitmap_load_carry_objects\n',
    updateCallAsm: '    call update_bitmap_carry_and_throw\n',
    satCallAsm: '    call bitmap_update_carry_sat\n',
    bitmapDrawCallAsm: bitmapEnabled ? '    call bitmap_draw_carry_objects\n' : '',
    initClearAsm: '',
    routinesAsm,
    dataAsm: buildBitmapCarryAndThrowDataAsm(data),
  };
}
