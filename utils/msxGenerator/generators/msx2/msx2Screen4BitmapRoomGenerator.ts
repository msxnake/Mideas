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
const SCREEN_HEIGHT = 192;
const TILE_SIZE = 8;
const TILES_X = 32;
const TILES_Y = 24;
const BANK_ROWS = 8;
const BANK_COUNT = 3;
const BANK_PATTERN_BYTES = 256 * 8;

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

function firstBitmapRoom(analysis: ProjectAnalysis): Msx2Screen4BitmapRoom | undefined {
  return ((analysis as any).msx2BitmapRooms || [])[0] as Msx2Screen4BitmapRoom | undefined;
}

function normalizeRoom(room: Msx2Screen4BitmapRoom | undefined): Msx2Screen4BitmapRoom {
  const atlasWidth = clampInt(room?.atlas?.width, 1, 256, 256);
  const atlasHeight = clampInt(room?.atlas?.height, 1, 128, 128);
  return {
    id: room?.id || 'bitmap_room_0',
    name: room?.name || 'MSX2 SCREEN 4 Bitmap Room',
    target: 'MSX2',
    vdpMode: 'SCREEN4_BITMAP_ROOM',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    palette: Array.isArray(room?.palette) ? room!.palette : [],
    atlas: {
      width: atlasWidth,
      height: atlasHeight,
      offscreenBaseY: 0,
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
  return Array.from({ length: SCREEN_HEIGHT }, () => Array.from({ length: SCREEN_WIDTH }, () => fill & 0x0f));
}

function paintRect(screen: number[][], x: number, y: number, w: number, h: number, color: number): void {
  const x0 = clampInt(x, 0, SCREEN_WIDTH, 0);
  const y0 = clampInt(y, 0, SCREEN_HEIGHT, 0);
  const x1 = clampInt(x + Math.max(0, w), 0, SCREEN_WIDTH, 0);
  const y1 = clampInt(y + Math.max(0, h), 0, SCREEN_HEIGHT, 0);
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
  const dy = clampInt(command.dy, 0, SCREEN_HEIGHT, 0);
  const width = clampInt(command.w ?? entry.w, 1, SCREEN_WIDTH, entry.w || TILE_SIZE);
  const height = clampInt(command.h ?? entry.h, 1, SCREEN_HEIGHT, entry.h || TILE_SIZE);
  for (let y = 0; y < height; y++) {
    const dstY = dy + y;
    const srcY = sy + y;
    if (dstY < 0 || dstY >= SCREEN_HEIGHT || srcY < 0 || srcY >= room.atlas.height) continue;
    for (let x = 0; x < width; x++) {
      const dstX = dx + x;
      const srcX = sx + x;
      if (dstX < 0 || dstX >= SCREEN_WIDTH || srcX < 0 || srcX >= room.atlas.width) continue;
      screen[dstY][dstX] = atlasPixels[srcY]?.[srcX] ?? 0;
    }
  }
}

function renderRoomToPixels(room: Msx2Screen4BitmapRoom): number[][] {
  const atlasPixels = normalizeAtlasPixels(room);
  const screen = createScreenPixels(0);
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

function chooseTwoColors(row: number[]): [number, number] {
  const counts = new Map<number, number>();
  row.forEach(color => counts.set(color & 0x0f, (counts.get(color & 0x0f) || 0) + 1));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const bg = sorted[0]?.[0] ?? 0;
  const fg = sorted.find(([color]) => color !== bg)?.[0] ?? bg;
  return [fg & 0x0f, bg & 0x0f];
}

function buildPatternColorTables(screen: number[][]): { names: number[]; patterns: number[]; colors: number[] } {
  const names: number[] = [];
  const patterns = Array.from({ length: BANK_COUNT * BANK_PATTERN_BYTES }, () => 0);
  const colors = Array.from({ length: BANK_COUNT * BANK_PATTERN_BYTES }, () => 0);

  for (let tileY = 0; tileY < TILES_Y; tileY++) {
    const bank = Math.floor(tileY / BANK_ROWS);
    const rowInBank = tileY % BANK_ROWS;
    for (let tileX = 0; tileX < TILES_X; tileX++) {
      const tileIndex = rowInBank * TILES_X + tileX;
      names.push(tileIndex & 0xff);
      const base = bank * BANK_PATTERN_BYTES + tileIndex * TILE_SIZE;
      for (let line = 0; line < TILE_SIZE; line++) {
        const pixelRow = screen[tileY * TILE_SIZE + line].slice(tileX * TILE_SIZE, tileX * TILE_SIZE + TILE_SIZE);
        const [fg, bg] = chooseTwoColors(pixelRow);
        let pattern = 0;
        pixelRow.forEach((color, bit) => {
          const normalized = color & 0x0f;
          const useFg = normalized === fg || (normalized !== bg && fg === bg);
          if (useFg) pattern |= 0x80 >> bit;
        });
        patterns[base + line] = pattern & 0xff;
        colors[base + line] = ((fg & 0x0f) << 4) | (bg & 0x0f);
      }
    }
  }

  return { names, patterns, colors };
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

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2BitmapRoomConfig): string {
  const room = normalizeRoom(firstBitmapRoom(analysis));
  const screenPixels = renderRoomToPixels(room);
  const tables = buildPatternColorTables(screenPixels);
  const paletteBytes = buildPaletteBytes(room.palette);

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 pattern-bitmap room backend
; Project: ${projectName}
; Room: ${room.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen4-bitmap-room
; ==================================================================

CHGMOD  EQU #005F
LDIRVM  EQU #005C
CHGET   EQU #009F
VDP_CTRL_PORT EQU #99
VDP_PALETTE_PORT EQU #9A

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
    ld a, 4
    call CHGMOD
    call load_screen4_palette
    call upload_screen4_room
.main_loop:
    call CHGET
    jp .main_loop

load_screen4_palette:
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
    out (VDP_PALETTE_PORT), a
    inc hl
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    pop bc
    pop af
    inc a
    djnz .palette_loop
    ret

vdp_write_register:
    ; A=register, E=value. Preserves BC, clobbers AF.
    push bc
    ld b, a
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, b
    or #80
    out (VDP_CTRL_PORT), a
    pop bc
    ret

upload_screen4_room:
    ld hl, screen4_pattern_data
    ld de, #0000
    ld bc, screen4_pattern_data_end - screen4_pattern_data
    call LDIRVM
    ld hl, screen4_name_data
    ld de, #1800
    ld bc, screen4_name_data_end - screen4_name_data
    call LDIRVM
    ld hl, screen4_color_data
    ld de, #2000
    ld bc, screen4_color_data_end - screen4_color_data
    jp LDIRVM

${formatBytes('screen4_bitmap_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes('screen4_pattern_data', tables.patterns, 'PGT: 3 banks x 256 unique 8x8 patterns')}
screen4_pattern_data_end:

${formatBytes('screen4_name_data', tables.names, 'PNT: 32x24 names, each row points to its bank-local unique tile')}
screen4_name_data_end:

${formatBytes('screen4_color_data', tables.colors, 'CGT: one FG/BG byte per pattern line; max 2 colors per 8 pixels horizontally')}
screen4_color_data_end:

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
    'page0.asm': '; MSX2 SCREEN 4 pattern-bitmap backend: page0 not used in MVP.\n',
    'bios.asm': '; BIOS equates emitted in unitedFiles.asm.\n',
    'constants.asm': '; Constants emitted in unitedFiles.asm.\n',
    'variables.asm': '; No runtime RAM variables in pattern-bitmap MVP.\n',
    'mapper.asm': '; Mapper support is out of scope for pattern-bitmap MVP.\n',
    'resource_ids.asm': '; Resource IDs not used by pattern-bitmap MVP.\n',
    'resource_table.asm': '; Resource table not used by pattern-bitmap MVP.\n',
    'resource_manager.asm': '; Resource manager not used by pattern-bitmap MVP.\n',
    'interrupt.asm': '; Interrupt runtime not used by pattern-bitmap MVP.\n',
    'header.asm': '; Header emitted in unitedFiles.asm.\n',
    'patterns.asm': '; Pattern tables are emitted in unitedFiles.asm.\n',
    'colors.asm': '; Color tables are emitted in unitedFiles.asm.\n',
    'sprites.asm': '; Sprites are not emitted by pattern-bitmap MVP yet.\n',
    'worlds.asm': '; Worlds are not emitted by pattern-bitmap MVP yet.\n',
    'screens.asm': '; Bitmap room data is emitted in unitedFiles.asm.\n',
    'components.asm': '; Components are not emitted by pattern-bitmap MVP yet.\n',
    'entities.asm': '; Entities are not emitted by pattern-bitmap MVP yet.\n',
    'sound.asm': '; Sound is not emitted by pattern-bitmap MVP yet.\n',
    'scroll.asm': '; Scroll is not emitted by pattern-bitmap MVP yet.\n',
    'animtiles.asm': '; Animated tiles are not emitted by pattern-bitmap MVP yet.\n',
    'bosses.asm': '; Bosses are not emitted by pattern-bitmap MVP yet.\n',
    'gameflow.asm': '; GameFlow is not emitted by pattern-bitmap MVP yet.\n',
    'menus.asm': '; Menus are not emitted by pattern-bitmap MVP yet.\n',
    'statemachine.asm': '; State machines are not emitted by pattern-bitmap MVP yet.\n',
    'font.asm': '; Bitmap HUD font is not emitted by pattern-bitmap MVP yet.\n',
    'hud.asm': '; Bitmap HUD is not emitted by pattern-bitmap MVP yet.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
