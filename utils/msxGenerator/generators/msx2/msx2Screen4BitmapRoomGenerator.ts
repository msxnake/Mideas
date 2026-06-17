import { Msx2BitmapRoomCommand, Msx2Screen4BitmapRoom, Screen5PaletteSlot } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';

interface Msx2BitmapRoomConfig {
  screenMode: 'SCREEN 4 (Graphics II)';
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
  autoMegaROM?: boolean;
}

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT_DEFAULT = 192;
const SCREEN5_VISIBLE_HEIGHT = 212;
const BITMAP_ROOM_HUD_HEIGHT = 16;
const BITMAP_ROOM_GAME_Y_OFFSET = BITMAP_ROOM_HUD_HEIGHT;
const ROW_BYTES = SCREEN_WIDTH / 2;
const VDP_CTRL_PORT = '#99';
const VDP_DATA_PORT = '#98';
const VDP_CMD_PORT = '#9B';
const VDP_PALETTE_PORT = '#9A';

const CMD_COPY_8 = 0xD0;
const CMD_COPY_16 = 0xD0;
const CMD_FILL = 0xC0;
const CMD_LINE = 0x70;

const OP_FILL = 0;
const OP_LINE_H = 1;
const OP_LINE_V = 2;
const OP_COPY_8 = 3;
const OP_COPY_16 = 4;

const VDP_CMD_BLOCK_SIZE = 15;
const VRAM_BANK_BYTES = 0x4000;

const clampByte = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(255, Math.trunc(numeric)));
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(numeric)));
};

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
const hexWord = (value: number): string => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

function firstBitmapRoom(analysis: ProjectAnalysis): Msx2Screen4BitmapRoom | undefined {
  return ((analysis as any).msx2BitmapRooms || [])[0] as Msx2Screen4BitmapRoom | undefined;
}

function normalizeRoom(room: Msx2Screen4BitmapRoom | undefined): Msx2Screen4BitmapRoom {
  const atlasWidth = clampInt(room?.atlas?.width, 1, 256, 256);
  const atlasHeight = clampInt(room?.atlas?.height, 1, 256, 256);
  const height = room?.height === 212 ? 212 : SCREEN_HEIGHT_DEFAULT;
  return {
    id: room?.id || 'bitmap_room_0',
    name: room?.name || 'MSX2 SCREEN 4 Bitmap Room',
    target: 'MSX2',
    vdpMode: 'SCREEN4_BITMAP_ROOM',
    width: SCREEN_WIDTH,
    height,
    palette: Array.isArray(room?.palette) ? room!.palette : [],
    atlas: {
      width: atlasWidth,
      height: atlasHeight,
      offscreenBaseY: clampInt(room?.atlas?.offscreenBaseY, 0, 511, 320),
      pixels: room?.atlas?.pixels || [],
      entries: room?.atlas?.entries || [],
    },
    composition: {
      source: room?.composition?.source || 'authored',
      commands: room?.composition?.commands || [],
    },
    visibleFramebuffer: room?.visibleFramebuffer,
    collision: room?.collision || [],
    effects: room?.effects || [],
    behavior: room?.behavior || [],
    entities: room?.entities || [],
    playerEntries: room?.playerEntries || [],
    notes: room?.notes,
  };
}

function normalizeAtlasPixels(room: Msx2Screen4BitmapRoom): number[][] {
  return Array.from({ length: room.atlas.height }, (_unused, y) =>
    Array.from({ length: room.atlas.width }, (_unused2, x) => clampByte(room.atlas.pixels?.[y]?.[x], 0) & 0x0f)
  );
}

function createScreenPixels(fill = 0): number[][] {
  return Array.from({ length: SCREEN_HEIGHT_DEFAULT }, () => Array.from({ length: SCREEN_WIDTH }, () => fill & 0x0f));
}

function paintRect(screen: number[][], x: number, y: number, w: number, h: number, color: number): void {
  const x0 = clampInt(x, 0, SCREEN_WIDTH, 0);
  const y0 = clampInt(y, 0, SCREEN_HEIGHT_DEFAULT, 0);
  const x1 = clampInt(x + Math.max(0, w), 0, SCREEN_WIDTH, 0);
  const y1 = clampInt(y + Math.max(0, h), 0, SCREEN_HEIGHT_DEFAULT, 0);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      screen[py][px] = color & 0x0f;
    }
  }
}

function copyAtlasEntry(screen: number[][], atlasPixels: number[][], room: Msx2Screen4BitmapRoom, command: Extract<Msx2BitmapRoomCommand, { op: 'copy' }>): void {
  const entry = room.atlas.entries.find(item => item.id === command.atlasEntryId);
  if (!entry) return;
  const sx = clampInt(entry.sx, 0, room.atlas.width, 0);
  const sy = clampInt(entry.sy, 0, room.atlas.height, 0);
  const dx = clampInt(command.dx, 0, SCREEN_WIDTH, 0);
  const dy = clampInt(command.dy, 0, SCREEN_HEIGHT_DEFAULT, 0);
  const width = clampInt(command.w ?? entry.w, 1, SCREEN_WIDTH, entry.w || 8);
  const height = clampInt(command.h ?? entry.h, 1, SCREEN_HEIGHT_DEFAULT, entry.h || 8);
  for (let y = 0; y < height; y++) {
    const dstY = dy + y;
    const srcY = sy + y;
    if (dstY < 0 || dstY >= SCREEN_HEIGHT_DEFAULT || srcY < 0 || srcY >= room.atlas.height) continue;
    for (let x = 0; x < width; x++) {
      const dstX = dx + x;
      const srcX = sx + x;
      if (dstX < 0 || dstX >= SCREEN_WIDTH || srcX < 0 || srcX >= room.atlas.width) continue;
      screen[dstY][dstX] = atlasPixels[srcY]?.[srcX] ?? 0;
    }
  }
}

function renderRoomToPixels(room: Msx2Screen4BitmapRoom): number[][] {
  const height = room.height || SCREEN_HEIGHT_DEFAULT;
  const atlasPixels = normalizeAtlasPixels(room);
  const screen = Array.from({ length: height }, () => Array.from({ length: SCREEN_WIDTH }, () => 0));
  for (const command of room.composition.commands || []) {
    if (command.op === 'copy') {
      copyAtlasEntry(screen, atlasPixels, room, command);
    } else if (command.op === 'fill') {
      paintRect(screen, command.x, command.y, command.w, command.h, command.color);
    } else if (command.op === 'lineH') {
      paintRect(screen, command.x, command.y, command.length, 1, command.color);
    } else if (command.op === 'lineV') {
      paintRect(screen, command.x, command.y, 1, command.length, command.color);
    }
  }
  return screen;
}

function packBitmapPixels(pixels: number[][]): number[] {
  const packed: number[] = [];
  for (const row of pixels) {
    for (let x = 0; x < SCREEN_WIDTH; x += 2) {
      const left = clampByte(row[x], 0) & 0x0f;
      const right = clampByte(row[x + 1], 0) & 0x0f;
      packed.push(((left & 0x0f) << 4) | (right & 0x0f));
    }
  }
  return packed;
}

function packAtlasPixels(room: Msx2Screen4BitmapRoom): number[] {
  const atlasPixels = normalizeAtlasPixels(room);
  const rows: number[][] = [];
  for (let y = 0; y < room.atlas.height; y++) {
    const row = Array.from({ length: SCREEN_WIDTH }, () => 0);
    for (let x = 0; x < room.atlas.width; x++) {
      row[x] = atlasPixels[y]?.[x] ?? 0;
    }
    rows.push(row);
  }
  return packBitmapPixels(rows);
}

function normalizeVisibleFramebuffer(room: Msx2Screen4BitmapRoom): number[][] | undefined {
  const pixels = room.visibleFramebuffer?.pixels;
  if (!Array.isArray(pixels)) return undefined;
  return Array.from({ length: SCREEN_HEIGHT_DEFAULT }, (_unused, y) =>
    Array.from({ length: SCREEN_WIDTH }, (_unused2, x) => clampByte(pixels[y]?.[x], 0) & 0x0f)
  );
}

function buildScreen5VisibleFramebuffer(gamePixels: number[][]): number[][] {
  const framebuffer = Array.from({ length: SCREEN5_VISIBLE_HEIGHT }, () => Array.from({ length: SCREEN_WIDTH }, () => 1));
  for (let y = 0; y < BITMAP_ROOM_HUD_HEIGHT - 1; y++) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      framebuffer[y][x] = 1;
    }
  }
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    framebuffer[BITMAP_ROOM_HUD_HEIGHT - 1][x] = 15;
  }
  for (let y = 0; y < SCREEN_HEIGHT_DEFAULT; y++) {
    const targetY = y + BITMAP_ROOM_GAME_Y_OFFSET;
    if (targetY >= SCREEN5_VISIBLE_HEIGHT) break;
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      framebuffer[targetY][x] = clampByte(gamePixels[y]?.[x], 0) & 0x0f;
    }
  }
  return framebuffer;
}

interface CommandRecord {
  op: number;
  sx: number;
  sy: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
  color: number;
}

function buildCommandRecords(room: Msx2Screen4BitmapRoom): CommandRecord[] {
  const offscreenBaseY = room.atlas.offscreenBaseY || 320;
  const entryById = new Map((room.atlas.entries || []).map(entry => [entry.id, entry]));
  const records: CommandRecord[] = [];

  for (const command of room.composition.commands || []) {
    if (command.op === 'fill') {
      records.push({
        op: OP_FILL,
        sx: 0,
        sy: 0,
        dx: clampInt(command.x, 0, 255, 0),
        dy: clampInt(command.y, 0, 511, 0),
        nx: clampInt(command.w, 1, 256, 1),
        ny: clampInt(command.h, 1, 256, 1),
        color: clampByte(command.color, 0) & 0x0f,
      });
      continue;
    }
    if (command.op === 'lineH') {
      records.push({
        op: OP_LINE_H,
        sx: 0,
        sy: 0,
        dx: clampInt(command.x, 0, 255, 0),
        dy: clampInt(command.y, 0, 511, 0),
        nx: clampInt(command.length, 1, 256, 1),
        ny: 1,
        color: clampByte(command.color, 0) & 0x0f,
      });
      continue;
    }
    if (command.op === 'lineV') {
      records.push({
        op: OP_LINE_V,
        sx: 0,
        sy: 0,
        dx: clampInt(command.x, 0, 255, 0),
        dy: clampInt(command.y, 0, 511, 0),
        nx: 1,
        ny: clampInt(command.length, 1, 256, 1),
        color: clampByte(command.color, 0) & 0x0f,
      });
      continue;
    }
    const entry = entryById.get(command.atlasEntryId);
    if (!entry) continue;
    const width = clampInt(command.w ?? entry.w, 1, 256, entry.w || 8);
    const height = clampInt(command.h ?? entry.h, 1, 256, entry.h || 8);
    records.push({
      op: width >= 16 || height >= 16 ? OP_COPY_16 : OP_COPY_8,
      sx: clampInt(entry.sx, 0, 255, 0),
      sy: clampInt(entry.sy, 0, 511, 0) + offscreenBaseY,
      dx: clampInt(command.dx, 0, 255, 0),
      dy: clampInt(command.dy, 0, 511, 0),
      nx: width,
      ny: height,
      color: 0,
    });
  }

  return records;
}

function buildVdpCommandBlock(record: CommandRecord): number[] {
  const commandByte =
    record.op === OP_COPY_16 ? CMD_COPY_16 :
    record.op === OP_COPY_8 ? CMD_COPY_8 :
    CMD_FILL;
  const color = record.op === OP_FILL || record.op === OP_LINE_H || record.op === OP_LINE_V
    ? ((record.color & 0x0f) << 4) | (record.color & 0x0f)
    : 0;
  return [
    record.sx & 0xff,
    (record.sx >> 8) & 0xff,
    record.sy & 0xff,
    (record.sy >> 8) & 0xff,
    record.dx & 0xff,
    (record.dx >> 8) & 0xff,
    record.dy & 0xff,
    (record.dy >> 8) & 0xff,
    record.nx & 0xff,
    (record.nx >> 8) & 0xff,
    record.ny & 0xff,
    (record.ny >> 8) & 0xff,
    color,
    0,
    commandByte,
  ];
}

function commandRecordsToVdpBlocks(records: CommandRecord[]): number[] {
  return records.flatMap(record => buildVdpCommandBlock(record));
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

interface RleChunk {
  label: string;
  vramOffset: number;
  rawLength: number;
  bytes: number[];
}

function rleEncodeBytes(bytes: number[]): number[] {
  const encoded: number[] = [];
  for (let offset = 0; offset < bytes.length;) {
    const value = bytes[offset] & 0xff;
    let count = 1;
    offset++;
    while (offset < bytes.length && (bytes[offset] & 0xff) === value && count < 255) {
      count++;
      offset++;
    }
    encoded.push(count, value);
  }
  return encoded;
}

function buildFramebufferRleChunks(framebufferBytes: number[]): RleChunk[] {
  const chunks: RleChunk[] = [];
  for (let offset = 0; offset < framebufferBytes.length; offset += VRAM_BANK_BYTES) {
    const raw = framebufferBytes.slice(offset, Math.min(offset + VRAM_BANK_BYTES, framebufferBytes.length));
    chunks.push({
      label: `bitmap_room_framebuffer_rle_chunk_${chunks.length}`,
      vramOffset: offset,
      rawLength: raw.length,
      bytes: rleEncodeBytes(raw),
    });
  }
  return chunks;
}

function buildFramebufferUploadAsm(rleChunks: RleChunk[]): string {
  const lines: string[] = [];
  for (const chunk of rleChunks) {
    lines.push(`    ld hl, ${chunk.label}`);
    lines.push(`    ld de, ${hexWord(chunk.vramOffset)}`);
    lines.push(`    ld bc, ${chunk.label}_end - ${chunk.label}`);
    lines.push(`    call decompress_bitmap_rle_to_vram`);
  }
  lines.push(`    ret`);
  return lines.join('\n');
}

function formatFramebufferRleChunks(chunks: RleChunk[], rawByteCount: number, visibleHeight: number): string {
  const encodedByteCount = chunks.reduce((total, chunk) => total + chunk.bytes.length, 0);
  const lines: string[] = [
    `; Visible ${SCREEN_WIDTH}x${visibleHeight} framebuffer, packed 4bpp RLE`,
    `; Raw bytes: ${rawByteCount}; encoded bytes: ${encodedByteCount}`,
    `bitmap_room_framebuffer_data:`,
  ];
  for (const chunk of chunks) {
    lines.push(`; VRAM ${hexWord(chunk.vramOffset)}, raw ${chunk.rawLength} bytes, RLE ${chunk.bytes.length} bytes`);
    lines.push(`${chunk.label}:`);
    for (let offset = 0; offset < chunk.bytes.length; offset += 16) {
      lines.push(`    DB ${chunk.bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
    }
    lines.push(`${chunk.label}_end:`);
  }
  lines.push(`bitmap_room_framebuffer_data_end:`);
  lines.push('');
  return lines.join('\n');
}

function buildPaletteBytes(palette: Screen5PaletteSlot[]): number[] {
  return Array.from({ length: 16 }, (_unused, slotIndex) => {
    const slot = palette.find(item => item?.slotIndex === slotIndex) || palette[slotIndex];
    const masterIndex = Number(slot?.masterIndex);
    if (!Number.isFinite(masterIndex) || masterIndex < 0) return [0, 0];
    const index = Math.max(0, Math.min(511, Math.trunc(masterIndex)));
    const r = (index >> 6) & 0x07;
    const g = (index >> 3) & 0x07;
    const b = index & 0x07;
    return [(r << 4) | b, g];
  }).flat();
}

function buildRuntimeAsm(room: Msx2Screen4BitmapRoom, commandCount: number, rleChunks: RleChunk[]): string {
  const atlasVramBase = (room.atlas.offscreenBaseY || 320) * ROW_BYTES;
  const framebufferUploadAsm = buildFramebufferUploadAsm(rleChunks);

  return `
; --- V9938 bitmap SCREEN 4 runtime (Vampire Killer style) ---

vdp_write_register:
    ; A=register, E=value. Preserves BC, clobbers AF.
    push bc
    ld b, a
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, b
    or #80
    out (${VDP_CTRL_PORT}), a
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: copy_to_vram_ext
; ------------------------------------------------------------
; PURPOSE:
;   Copy one contiguous CPU memory block to an absolute V9938 VRAM address.
;
; INPUT:
;   HL = ROM/RAM source pointer.
;   DE = absolute VRAM destination address.
;   BC = byte count. Must not be zero.
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
;   None.
;
; SIDE EFFECTS:
;   Writes VRAM through VDP ports #99/#98 and leaves R#14 reset to zero.
;
; NOTES:
;   The V9938 data-port auto-increment is only trusted inside the current
;   16KB VRAM bank. Callers that copy more than one bank must split the copy.
; ------------------------------------------------------------
copy_to_vram_ext:
    ld a, d
    and #C0
    rlca
    rlca
    push af
    in a, (${VDP_CTRL_PORT})
    pop af
    out (${VDP_CTRL_PORT}), a
    ld a, #8E
    out (${VDP_CTRL_PORT}), a
    in a, (${VDP_CTRL_PORT})
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
.copy_loop:
    ld a, (hl)
    out (${VDP_DATA_PORT}), a
    inc hl
    dec bc
    ld a, b
    or c
    jp nz, .copy_loop
    xor a
    push af
    in a, (${VDP_CTRL_PORT})
    pop af
    out (${VDP_CTRL_PORT}), a
    ld a, #8E
    out (${VDP_CTRL_PORT}), a
    ret

; ------------------------------------------------------------
; FUNCTION: decompress_bitmap_rle_to_vram
; ------------------------------------------------------------
; PURPOSE:
;   Expand count/value RLE bytes from ROM to one absolute V9938 VRAM bank.
;
; INPUT:
;   HL = RLE source pointer. Format is repeated count,value pairs.
;   DE = absolute VRAM destination address.
;   BC = encoded byte count. Must be even and non-zero.
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
;   None.
;
; SIDE EFFECTS:
;   Writes expanded bytes to VRAM through VDP ports #99/#98.
;
; NOTES:
;   Each call must target data that stays inside one 16KB VRAM bank. The
;   generator splits the visible framebuffer on bank boundaries.
; ------------------------------------------------------------
decompress_bitmap_rle_to_vram:
    ld a, d
    and #C0
    rlca
    rlca
    push af
    in a, (${VDP_CTRL_PORT})
    pop af
    out (${VDP_CTRL_PORT}), a
    ld a, #8E
    out (${VDP_CTRL_PORT}), a
    in a, (${VDP_CTRL_PORT})
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
.rle_loop:
    ld a, b
    or c
    jp z, .rle_done
    ld a, (hl)
    inc hl
    dec bc
    ld d, a
    ld a, (hl)
    inc hl
    dec bc
.emit_loop:
    out (${VDP_DATA_PORT}), a
    dec d
    jp nz, .emit_loop
    jp .rle_loop
.rle_done:
    xor a
    push af
    in a, (${VDP_CTRL_PORT})
    pop af
    out (${VDP_CTRL_PORT}), a
    ld a, #8E
    out (${VDP_CTRL_PORT}), a
    ret

vdp_reinit_cmd_pointer:
    ; Point indirect writes at R#32 with auto-increment. Clobbers AF.
    ld a, #20
    ld e, a
    ld a, #11
    jp vdp_write_register

read_vdp_status_2:
    ; Returns S#2 in A. Clobbers AF.
    ld a, #02
    out (${VDP_CTRL_PORT}), a
    ld a, #8F
    out (${VDP_CTRL_PORT}), a
    in a, (${VDP_CTRL_PORT})
    ret

vdp_wait_cmd_ready:
    ; Wait while CE (bit 0) is set. Clobbers AF.
.wait_loop:
    call read_vdp_status_2
    bit 0, a
    jp nz, .wait_loop
    ret

init_screen4_bitmap_vdp:
    ; This backend composes 4bpp bitmap pages with V9938 commands (128 bytes per
    ; 256px row), so the actual VDP mode must be SCREEN 5/Graphic 4. The editor
    ; route is still named SCREEN 4 bitmap-room while this branch is bifurcated.
    ld a, #05
    call CHGMOD
    ; Sprite mode 2 tables at F400/F600/F800 (physical layout used by VK).
    ld a, #05
    ld e, #EF
    call vdp_write_register
    ld a, #06
    ld e, #1F
    call vdp_write_register
    ld a, #0B
    ld e, #01
    call vdp_write_register
    ; Point indirect writes at command register R#32.
    ld a, #11
    ld e, #20
    call vdp_write_register
    ret

compose_bitmap_room:
    ; Deprecated command-stream path. Current bitmap-room smoke uploads a
    ; pre-rendered framebuffer for deterministic full-screen composition.
    ret

load_screen4_bitmap_palette:
    ld hl, screen4_bitmap_palette_data
    ld b, 16
    xor a
.palette_loop:
    push af
    push bc
    push hl
    ld e, a
    ld a, 16
    call vdp_write_register
    pop hl
    ld a, (hl)
    out (${VDP_PALETTE_PORT}), a
    inc hl
    ld a, (hl)
    out (${VDP_PALETTE_PORT}), a
    inc hl
    pop bc
    pop af
    inc a
    djnz .palette_loop
    ret

upload_bitmap_atlas:
    ; Deprecated atlas path; kept as a stable label for older smoke contracts.
    ret

; ------------------------------------------------------------
; FUNCTION: upload_bitmap_framebuffer
; ------------------------------------------------------------
; PURPOSE:
;   Upload the pre-rendered packed 4bpp SCREEN 5 framebuffer to visible VRAM.
;
; INPUT:
;   None.
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
;   decompress_bitmap_rle_to_vram
;
; SIDE EFFECTS:
;   Writes the visible VRAM page starting at #0000.
;
; NOTES:
;   Reads compact RLE data from the resident ROM window, then re-arms R#14 per
;   16KB VRAM bank so rows beyond physical VRAM #3FFF are written correctly.
;   The first ${BITMAP_ROOM_HUD_HEIGHT} scanlines are reserved for HUD, and the
;   192px game framebuffer starts at visual Y=${BITMAP_ROOM_GAME_Y_OFFSET}.
; ------------------------------------------------------------
upload_bitmap_framebuffer:
${framebufferUploadAsm}

init_hardware_sprite_tables:
    ; Sprite mode 2 tables at F400/F600/F800 (physical layout used by VK).
    ld hl, bitmap_room_sprite_colors
    ld de, #F400
    ld bc, bitmap_room_sprite_colors_end - bitmap_room_sprite_colors
    call copy_to_vram_ext
    ld hl, bitmap_room_sprite_attrs
    ld de, #F600
    ld bc, bitmap_room_sprite_attrs_end - bitmap_room_sprite_attrs
    call copy_to_vram_ext
    ld hl, bitmap_room_sprite_patterns
    ld de, #F800
    ld bc, bitmap_room_sprite_patterns_end - bitmap_room_sprite_patterns
    jp copy_to_vram_ext

bitmap_wait_vblank:
    ; Poll VDP status S#0 until the frame flag (bit 7) is set: a 60 Hz tick that
    ; does NOT depend on BIOS frame interrupts (the VK-style VDP init does not
    ; enable a BIOS-compatible vblank IRQ). Assumes R#15 = 0. Clobbers AF.
.wv_loop:
    in a, (VDP_CTRL_PORT)
    bit 7, a
    jp z, .wv_loop
    ret

update_player_movement:
    ; Cursor movement (1px/frame) with 16x16-cell collision. Reads keyboard
    ; row 8 directly via SNSMAT (a 0 bit means pressed): bit7=right, bit6=down,
    ; bit5=up, bit4=left. SNSMAT works without frame interrupts, unlike GTSTCK.
    ; Clobbers AF/BC/DE/HL.
    ld a, 8
    call SNSMAT
    cpl                     ; now a set bit means that key is pressed
    ld c, a                 ; C = pressed mask for keyboard row 8
bitmap_stick_dx:
    bit 7, c
    jp z, .not_right
    ld a, 1
    push bc
    call bitmap_try_move_x
    pop bc
    jp .check_vert
.not_right:
    bit 4, c
    jp z, .check_vert
    ld a, #FF
    push bc
    call bitmap_try_move_x
    pop bc
.check_vert:
    bit 6, c
    jp z, .not_down
    ld a, 1
    jp bitmap_try_move_y
.not_down:
    bit 5, c
    ret z
    ld a, #FF
    jp bitmap_try_move_y

bitmap_try_move_x:
    ; A = signed dx (#01 right, #FF left). Commits player_x when the leading
    ; edge (probed at vertical centre y+8) is not a solid cell. The candidate is
    ; kept on the stack because bitmap_probe_solid clobbers DE (keeps only BC).
    ld b, a
    ld a, (player_x)
    add a, b                ; A = candidate X (top-left)
    push af                 ; save candidate across the probe
    bit 7, b
    jp nz, .left_edge
    add a, 15               ; moving right: probe the right edge
.left_edge:
    ld b, a                 ; B = probe X (left edge keeps the candidate X)
    ld a, (player_y)
    add a, 8
    ld c, a                 ; C = probe Y (vertical centre)
    call bitmap_probe_solid
    jp nz, .x_blocked
    pop af                  ; A = candidate X
    ld (player_x), a
    ret
.x_blocked:
    pop af
    ret

bitmap_try_move_y:
    ; A = signed dy (#01 down, #FF up). Commits player_y when the leading edge
    ; (probed at horizontal centre x+8) is not a solid cell. Candidate kept on
    ; the stack (bitmap_probe_solid clobbers DE).
    ld b, a
    ld a, (player_y)
    add a, b                ; A = candidate Y (top-left)
    push af
    bit 7, b
    jp nz, .up_edge
    add a, 15               ; moving down: probe the bottom edge
.up_edge:
    ld c, a                 ; C = probe Y (top edge keeps the candidate Y)
    ld a, (player_x)
    add a, 8
    ld b, a                 ; B = probe X (horizontal centre)
    call bitmap_probe_solid
    jp nz, .y_blocked
    pop af                  ; A = candidate Y
    ld (player_y), a
    ret
.y_blocked:
    pop af
    ret

bitmap_probe_solid:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when empty. Index = (Y & #F0) + (X >> 4) into the 16x12 grid. Because a
    ; cell is 16 px, (Y >> 4) * 16 == (Y & #F0). Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .probe_y_visible
    ld a, 1                 ; outside visible Y range is solid
    or a
    ret
.probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_sprite_sat
; ------------------------------------------------------------
; PURPOSE:
;   Write sprite 0 SAT bytes, converting logical game Y to visual SCREEN 5 Y.
;
; INPUT:
;   player_y = logical game Y coordinate, 0..191.
;   player_x = visual/logical X coordinate.
;   player_pat = hardware sprite pattern index.
;   player_ec = early-clock byte.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, DE
;
; PRESERVES:
;   BC, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes 4 bytes to sprite 0 SAT at VRAM #F600 through VDP ports #99/#98.
;
; NOTES:
;   Background pixels are shifted down by ${BITMAP_ROOM_GAME_Y_OFFSET}px to
;   reserve the top HUD band, but collision/movement keep logical coordinates.
; ------------------------------------------------------------
bitmap_update_sprite_sat:
    ld de, #F600
    ld a, d
    and #C0
    rlca
    rlca
    push af
    in a, (${VDP_CTRL_PORT})
    pop af
    out (${VDP_CTRL_PORT}), a
    ld a, #8E
    out (${VDP_CTRL_PORT}), a
    in a, (${VDP_CTRL_PORT})
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
    ld a, (player_y)
    add a, ${BITMAP_ROOM_GAME_Y_OFFSET}
    out (${VDP_DATA_PORT}), a
    ld a, (player_x)
    out (${VDP_DATA_PORT}), a
    ld a, (player_pat)
    out (${VDP_DATA_PORT}), a
    ld a, (player_ec)
    out (${VDP_DATA_PORT}), a
    ret
`;
}

function buildSpriteTables(): { colors: number[]; attrs: number[]; patterns: number[] } {
  const colors = Array.from({ length: 16 }, () => 0x01);
  const attrs = [
    0x60, 0x80, 0x00, 0x00, // sprite 0: player (Y,X overwritten each frame), pattern 0
    0xD8, 0x00, 0x00, 0x00, // Y=#D8 stops sprite processing, so only sprite 0 shows
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];
  const patterns = [
    0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C,
    0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
    0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C,
    0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
    0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];
  return { colors, attrs, patterns };
}

const COLLISION_COLS = 16;
const COLLISION_ROWS = 12;

function buildCollisionTableBytes(room: Msx2Screen4BitmapRoom): number[] {
  const bytes: number[] = [];
  for (let y = 0; y < COLLISION_ROWS; y++) {
    for (let x = 0; x < COLLISION_COLS; x++) {
      bytes.push(clampByte(room.collision?.[y]?.[x], 0));
    }
  }
  return bytes;
}

function resolvePlayerSpawnPixels(room: Msx2Screen4BitmapRoom): { x: number; y: number; visible: boolean } {
  const entry = (room.playerEntries || [])[0];
  if (!entry) return { x: 0, y: 0xD8, visible: false };
  const tileX = clampInt(entry?.x, 0, COLLISION_COLS - 1, 1);
  const tileY = clampInt(entry?.y, 0, COLLISION_ROWS - 1, 1);
  return { x: tileX * 16, y: tileY * 16, visible: true };
}

function appendRectBytes(bytes: number[], x: number, y: number, w: number, h: number, color: number): void {
  const x0 = clampInt(x, 0, SCREEN_WIDTH, 0);
  const y0 = clampInt(y, 0, SCREEN_HEIGHT_DEFAULT, 0);
  const x1 = clampInt(x + Math.max(0, w), 0, SCREEN_WIDTH, 0);
  const y1 = clampInt(y + Math.max(0, h), 0, SCREEN_HEIGHT_DEFAULT, 0);
  if (x1 <= x0 || y1 <= y0) return;
  const byteX = Math.floor(x0 / 2);
  const byteX1 = Math.ceil(x1 / 2);
  const widthBytes = byteX1 - byteX;
  const height = y1 - y0;
  const address = y0 * ROW_BYTES + byteX;
  const nibble = clampByte(color, 0) & 0x0f;
  bytes.push(address & 0xff, (address >> 8) & 0xff, widthBytes & 0xff, height & 0xff, (nibble << 4) | nibble);
}

function buildVisibleRectBytes(room: Msx2Screen4BitmapRoom): number[] {
  const bytes: number[] = [];
  for (const command of room.composition.commands || []) {
    if (command.op === 'fill') {
      appendRectBytes(bytes, command.x, command.y, command.w, command.h, command.color);
    } else if (command.op === 'lineH') {
      appendRectBytes(bytes, command.x, command.y, command.length, 1, command.color);
    } else if (command.op === 'lineV') {
      appendRectBytes(bytes, command.x, command.y, 1, command.length, command.color);
    }
  }
  return bytes;
}

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2BitmapRoomConfig): string {
  const room = normalizeRoom(firstBitmapRoom(analysis));
  const collisionBytes = buildCollisionTableBytes(room);
  const spawn = resolvePlayerSpawnPixels(room);
  const paletteBytes = buildPaletteBytes(room.palette);
  const gameFramebufferPixels = normalizeVisibleFramebuffer(room) || renderRoomToPixels(room);
  const framebufferPixels = buildScreen5VisibleFramebuffer(gameFramebufferPixels);
  const framebufferBytes = packBitmapPixels(framebufferPixels);
  const framebufferRleChunks = buildFramebufferRleChunks(framebufferBytes);
  const spriteTables = buildSpriteTables();
  const runtimeAsm = buildRuntimeAsm(room, 0, framebufferRleChunks);
  const visibleHeight = SCREEN5_VISIBLE_HEIGHT;

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: ${projectName}
; Room: ${room.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen4-bitmap-room
; Visible page: VRAM #0000, ${ROW_BYTES} bytes/row, ${visibleHeight} lines
; Bitmap room HUD height: ${BITMAP_ROOM_HUD_HEIGHT} px
; Bitmap room game area: ${SCREEN_WIDTH}x${SCREEN_HEIGHT_DEFAULT} at visual Y=${BITMAP_ROOM_GAME_Y_OFFSET}
; Framebuffer bytes: ${framebufferBytes.length}
; ==================================================================

CHGMOD  EQU #005F
GTSTCK  EQU #00DC
SNSMAT  EQU #0141
VDP_CTRL_PORT EQU ${VDP_CTRL_PORT}
VDP_DATA_PORT EQU ${VDP_DATA_PORT}
VDP_CMD_PORT EQU ${VDP_CMD_PORT}
VDP_PALETTE_PORT EQU ${VDP_PALETTE_PORT}

; Player SAT image in RAM (kept contiguous so the 4 bytes copy straight to the
; sprite 0 SAT slot at VRAM #F600): Y, X, pattern number, early-clock byte.
player_y   EQU #C000
player_x   EQU #C001
player_pat EQU #C002
player_ec  EQU #C003

    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    call init_screen4_bitmap_vdp
    call load_screen4_bitmap_palette
    call upload_bitmap_framebuffer
    call init_hardware_sprite_tables
    ; Place the player at the room spawn point.
    ld a, ${spawn.y}
    ld (player_y), a
    ld a, ${spawn.x}
    ld (player_x), a
    xor a
    ld (player_pat), a
    ld (player_ec), a
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so it does not depend on BIOS frame interrupts.
    ld a, #0F
    ld e, #00
    call vdp_write_register
    ei
.main_loop:
    call bitmap_wait_vblank
    call update_player_movement
    call bitmap_update_sprite_sat
    jp .main_loop

${runtimeAsm}

${formatBytes('screen4_bitmap_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatFramebufferRleChunks(framebufferRleChunks, framebufferBytes.length, visibleHeight)}

${formatBytes('bitmap_room_sprite_colors', spriteTables.colors, 'Sprite color table sample (slot 1)')}
bitmap_room_sprite_colors_end:

${formatBytes('bitmap_room_sprite_attrs', spriteTables.attrs, 'SAT sample entries (dual 16x16 cells)')}
bitmap_room_sprite_attrs_end:

${formatBytes('bitmap_room_sprite_patterns', spriteTables.patterns, 'Sprite patterns for sample player placeholder')}
bitmap_room_sprite_patterns_end:

${formatBytes('bitmap_room_collision_map', collisionBytes, `${COLLISION_COLS}x${COLLISION_ROWS} collision grid (16x16 px cells), row-major, 0=empty`)}

    ds #C000 - $, #FF
    end
`;
}

export function generateMsx2Screen4BitmapRoomFiles(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2BitmapRoomConfig
): GeneratedASMFiles {
  const unitedFiles = generateUnitedFiles(projectName, analysis, config);
  return {
    'page0.asm': '; MSX2 SCREEN 4 bitmap-room backend: page0 not used.\n',
    'bios.asm': '; BIOS equates emitted in unitedFiles.asm.\n',
    'constants.asm': '; Constants emitted in unitedFiles.asm.\n',
    'variables.asm': '; Runtime RAM variables reserved for future bitmap-room gameplay.\n',
    'mapper.asm': '; Mapper support reserved for multi-room bitmap projects.\n',
    'resource_ids.asm': '; Resource IDs not used by bitmap-room MVP.\n',
    'resource_table.asm': '; Resource table not used by bitmap-room MVP.\n',
    'resource_manager.asm': '; Resource manager not used by bitmap-room MVP.\n',
    'interrupt.asm': '; Interrupt runtime not used by bitmap-room MVP.\n',
    'header.asm': '; Header emitted in unitedFiles.asm.\n',
    'patterns.asm': '; Bitmap rooms do not use PGT tile tables.\n',
    'colors.asm': '; Bitmap rooms do not use CGT tile tables.\n',
    'sprites.asm': '; Sprite tables are emitted in unitedFiles.asm.\n',
    'worlds.asm': '; Worlds are not emitted by bitmap-room MVP yet.\n',
    'screens.asm': '; Bitmap room atlas/commands are emitted in unitedFiles.asm.\n',
    'components.asm': '; Components are not emitted by bitmap-room MVP yet.\n',
    'entities.asm': '; Entities are not emitted by bitmap-room MVP yet.\n',
    'sound.asm': '; Sound is not emitted by bitmap-room MVP yet.\n',
    'scroll.asm': '; Scroll is not emitted by bitmap-room MVP yet.\n',
    'animtiles.asm': '; Animated tiles are not emitted by bitmap-room MVP yet.\n',
    'bosses.asm': '; Bosses are not emitted by bitmap-room MVP yet.\n',
    'gameflow.asm': '; GameFlow is not emitted by bitmap-room MVP yet.\n',
    'menus.asm': '; Menus are not emitted by bitmap-room MVP yet.\n',
    'statemachine.asm': '; State machines are not emitted by bitmap-room MVP yet.\n',
    'font.asm': '; Bitmap HUD font is not emitted by bitmap-room MVP yet.\n',
    'hud.asm': '; Bitmap HUD widgets are composed through V9938 commands.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
