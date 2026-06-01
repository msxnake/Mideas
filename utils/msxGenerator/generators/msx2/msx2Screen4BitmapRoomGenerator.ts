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
const ROW_BYTES = SCREEN_WIDTH / 2;
const VDP_CTRL_PORT = '#99';
const VDP_DATA_PORT = '#98';
const VDP_CMD_PORT = '#9B';
const VDP_PALETTE_PORT = '#9A';

const CMD_COPY_8 = 0xD0;
const CMD_COPY_16 = 0x98;
const CMD_FILL = 0xC0;
const CMD_LINE = 0x70;

const OP_FILL = 0;
const OP_LINE_H = 1;
const OP_LINE_V = 2;
const OP_COPY_8 = 3;
const OP_COPY_16 = 4;

const VDP_CMD_BLOCK_SIZE = 15;

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
    collision: room?.collision || [],
    effects: room?.effects || [],
    behavior: room?.behavior || [],
    entities: room?.entities || [],
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
    record.op === OP_FILL || record.op === OP_LINE_H || record.op === OP_LINE_V ? (record.color & 0x0f) : 0,
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

function buildRuntimeAsm(room: Msx2Screen4BitmapRoom, commandCount: number): string {
  const atlasVramBase = (room.atlas.offscreenBaseY || 320) * ROW_BYTES;

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

copy_to_vram_ext:
    ; HL=ROM/RAM source, DE=absolute VRAM destination, BC=length. Clobbers AF/BC/DE/HL.
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

vdp_reinit_cmd_pointer:
    ; Point indirect writes at R#32 with auto-increment. Clobbers AF.
    ld a, #20
    ld e, a
    ld a, #17
    jp vdp_write_register

read_vdp_status_2:
    ; Returns S#2 in A. Clobbers AF.
    ld a, #8F
    out (${VDP_CTRL_PORT}), a
    in a, (${VDP_CTRL_PORT})
    ret

vdp_wait_cmd_ready:
    ; Wait until CE (bit 0) is set. Clobbers AF.
.wait_loop:
    call read_vdp_status_2
    bit 0, a
    jp z, .wait_loop
    ret

init_screen4_bitmap_vdp:
    ; MSX2 bitmap mode registers observed in Vampire Killer gameplay.
    ld a, #00
    ld e, #06
    call vdp_write_register
    ld a, #01
    ld e, #62
    call vdp_write_register
    ld a, #02
    ld e, #1F
    call vdp_write_register
    ld a, #03
    ld e, #80
    call vdp_write_register
    ld a, #04
    ld e, #00
    call vdp_write_register
    ld a, #05
    ld e, #EF
    call vdp_write_register
    ld a, #06
    ld e, #1F
    call vdp_write_register
    ld a, #07
    ld e, #00
    call vdp_write_register
    ld a, #08
    ld e, #08
    call vdp_write_register
    ld a, #09
    ld e, #80
    call vdp_write_register
    ld a, #11
    ld e, #01
    call vdp_write_register
    ld a, #14
    ld e, #03
    call vdp_write_register
    ld a, #17
    ld e, #20
    call vdp_write_register
    ret

compose_bitmap_room:
    ; Streams prepacked R#32-R#46 blocks to port #9B. Clobbers AF/BC/HL.
    ld hl, bitmap_room_vdp_cmds
    ld b, ${commandCount}
.command_loop:
    push bc
    call vdp_reinit_cmd_pointer
    ld c, #${VDP_CMD_BLOCK_SIZE}
.cmd_bytes:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    dec c
    jp nz, .cmd_bytes
    call vdp_wait_cmd_ready
    pop bc
    dec b
    jp nz, .command_loop
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
    ld hl, bitmap_room_atlas_data
    ld de, ${hexWord(atlasVramBase)}
    ld bc, bitmap_room_atlas_data_end - bitmap_room_atlas_data
    call copy_to_vram_ext
    ret

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
`;
}

function buildSpriteTables(): { colors: number[]; attrs: number[]; patterns: number[] } {
  const colors = Array.from({ length: 16 }, () => 0x01);
  const attrs = [
    0x90, 0x80, 0x08, 0x00,
    0xA0, 0x80, 0x00, 0x00,
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

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2BitmapRoomConfig): string {
  const room = normalizeRoom(firstBitmapRoom(analysis));
  const commandRecords = buildCommandRecords(room);
  const commandBytes = commandRecordsToVdpBlocks(commandRecords);
  const paletteBytes = buildPaletteBytes(room.palette);
  const atlasBytes = packAtlasPixels(room);
  const spriteTables = buildSpriteTables();
  const runtimeAsm = buildRuntimeAsm(room, commandRecords.length);
  const visibleHeight = room.height || SCREEN_HEIGHT_DEFAULT;

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: ${projectName}
; Room: ${room.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen4-bitmap-room
; Visible page: VRAM #0000, ${ROW_BYTES} bytes/row, ${visibleHeight} lines
; Atlas VRAM base: ${hexWord((room.atlas.offscreenBaseY || 320) * ROW_BYTES)} (offscreen Y=${room.atlas.offscreenBaseY || 320})
; Commands: ${commandRecords.length}
; ==================================================================

CHGMOD  EQU #005F
GTSTCK  EQU #00DC
VDP_CTRL_PORT EQU ${VDP_CTRL_PORT}
VDP_DATA_PORT EQU ${VDP_DATA_PORT}
VDP_CMD_PORT EQU ${VDP_CMD_PORT}
VDP_PALETTE_PORT EQU ${VDP_PALETTE_PORT}

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
    call upload_bitmap_atlas
    call compose_bitmap_room
    call init_hardware_sprite_tables
    ei
.main_loop:
    halt
    call GTSTCK
    bit 0, a
    jp nz, init_rom
    jp .main_loop

${runtimeAsm}

${formatBytes('screen4_bitmap_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes('bitmap_room_atlas_data', atlasBytes, `Offscreen atlas 4bpp bitmap (${room.atlas.width}x${room.atlas.height})`)}
bitmap_room_atlas_data_end:

${formatBytes('bitmap_room_vdp_cmds', commandBytes, `V9938 command blocks (${VDP_CMD_BLOCK_SIZE} bytes each)`)}
bitmap_room_vdp_cmds_end:

${formatBytes('bitmap_room_sprite_colors', spriteTables.colors, 'Sprite color table sample (slot 1)')}
bitmap_room_sprite_colors_end:

${formatBytes('bitmap_room_sprite_attrs', spriteTables.attrs, 'SAT sample entries (dual 16x16 cells)')}
bitmap_room_sprite_attrs_end:

${formatBytes('bitmap_room_sprite_patterns', spriteTables.patterns, 'Sprite patterns for sample player placeholder')}
bitmap_room_sprite_patterns_end:

    ds #8000 - $, #FF
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
