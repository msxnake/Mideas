import { Msx2BitmapRoomCommand, Msx2HudFontAsset, Msx2HudWidget, Msx2Screen4BitmapRoom, Screen5PaletteSlot } from '../../../../types';
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
const BITMAP_ROOM_GAME_VRAM_BASE = BITMAP_ROOM_GAME_Y_OFFSET * ROW_BYTES;
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
    runtime: room?.runtime,
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

const DEFAULT_HUD_CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const DEFAULT_HUD_PATTERNS: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0, 0],
  '0': [0x3C,0x66,0x6E,0x76,0x66,0x66,0x3C,0],
  '1': [0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0],
  '2': [0x3C,0x66,0x06,0x1C,0x30,0x60,0x7E,0],
  '3': [0x3C,0x66,0x06,0x1C,0x06,0x66,0x3C,0],
  '4': [0x0C,0x1C,0x3C,0x6C,0x7E,0x0C,0x0C,0],
  '5': [0x7E,0x60,0x7C,0x06,0x06,0x66,0x3C,0],
  '6': [0x1C,0x30,0x60,0x7C,0x66,0x66,0x3C,0],
  '7': [0x7E,0x06,0x0C,0x18,0x30,0x30,0x30,0],
  '8': [0x3C,0x66,0x66,0x3C,0x66,0x66,0x3C,0],
  '9': [0x3C,0x66,0x66,0x3E,0x06,0x0C,0x38,0],
  A: [0x18,0x3C,0x66,0x66,0x7E,0x66,0x66,0],
  B: [0x7C,0x66,0x66,0x7C,0x66,0x66,0x7C,0],
  C: [0x3C,0x66,0x60,0x60,0x60,0x66,0x3C,0],
  D: [0x78,0x6C,0x66,0x66,0x66,0x6C,0x78,0],
  E: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x7E,0],
  F: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x60,0],
  G: [0x3C,0x66,0x60,0x6E,0x66,0x66,0x3C,0],
  H: [0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0],
  I: [0x7E,0x18,0x18,0x18,0x18,0x18,0x7E,0],
  J: [0x1E,0x0C,0x0C,0x0C,0x0C,0x6C,0x38,0],
  K: [0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0],
  L: [0x60,0x60,0x60,0x60,0x60,0x60,0x7E,0],
  M: [0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0],
  N: [0x66,0x76,0x7E,0x7E,0x6E,0x66,0x66,0],
  O: [0x3C,0x66,0x66,0x66,0x66,0x66,0x3C,0],
  P: [0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0],
  Q: [0x3C,0x66,0x66,0x66,0x6A,0x6C,0x36,0],
  R: [0x7C,0x66,0x66,0x7C,0x78,0x6C,0x66,0],
  S: [0x3C,0x66,0x60,0x3C,0x06,0x66,0x3C,0],
  T: [0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0],
  U: [0x66,0x66,0x66,0x66,0x66,0x66,0x3C,0],
  V: [0x66,0x66,0x66,0x66,0x66,0x3C,0x18,0],
  W: [0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0],
  X: [0x66,0x66,0x3C,0x18,0x3C,0x66,0x66,0],
  Y: [0x66,0x66,0x66,0x3C,0x18,0x18,0x18,0],
  Z: [0x7E,0x06,0x0C,0x18,0x30,0x60,0x7E,0],
  ':': [0x00,0x18,0x18,0x00,0x00,0x18,0x18,0],
  '-': [0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0],
  '/': [0x06,0x0C,0x0C,0x18,0x30,0x30,0x60,0],
};

function getBitmapHudFontAsset(analysis: ProjectAnalysis, room: Msx2Screen4BitmapRoom): Msx2HudFontAsset | undefined {
  const assets = ((analysis as any).assets || []) as Array<{ id?: string; type?: string; data?: unknown }>;
  const preferredId = room.runtime?.hudFontAssetId;
  const preferred = preferredId
    ? assets.find(asset => asset.type === 'msx2hudfont' && asset.id === preferredId)?.data as Msx2HudFontAsset | undefined
    : undefined;
  return preferred || assets.find(asset => asset.type === 'msx2hudfont')?.data as Msx2HudFontAsset | undefined;
}

function normalizeHudText(value: string, maxLength: number, allowedCharacters: string): string {
  const allowed = new Set(Array.from(allowedCharacters || DEFAULT_HUD_CHARS));
  return Array.from(String(value || '').toUpperCase())
    .map(char => allowed.has(char) ? char : ' ')
    .join('')
    .slice(0, Math.max(0, maxLength));
}

function getBitmapHudWidgetText(widget: Msx2HudWidget, room: Msx2Screen4BitmapRoom, allowedCharacters: string): string {
  const maxChars = Math.max(1, Math.min(31, Math.floor((Number(widget.width) || 64) / 8)));
  if (widget.kind === 'text') return normalizeHudText(widget.text || widget.name || 'TEXT', maxChars, allowedCharacters);
  if (widget.kind !== 'counter') return '';
  const binding = widget.binding || 'custom';
  const fallbackValue =
    binding === 'air' ? room.runtime?.initialAir ?? 255 :
    binding === 'lives' ? 3 :
    binding === 'collectibles' ? 0 :
    binding === 'playerEnergy' ? room.runtime?.playerEnergyInitial ?? 16 :
    binding === 'bossEnergy' ? room.runtime?.bossEnergyInitial ?? 16 :
    0;
  const value = clampByte(widget.initialValue, fallbackValue);
  return normalizeHudText(String(value).padStart(maxChars, '0'), maxChars, allowedCharacters);
}

function drawBitmapHudText(
  pixels: number[][],
  text: string,
  x: number,
  y: number,
  font: Msx2HudFontAsset | undefined,
  color: number
): void {
  const patterns = font?.patterns || DEFAULT_HUD_PATTERNS;
  for (const [charIndex, char] of Array.from(text).entries()) {
    const pattern = patterns[char] || patterns[' '] || DEFAULT_HUD_PATTERNS[' '];
    for (let row = 0; row < 8; row++) {
      const bits = Number(pattern[row]) || 0;
      for (let col = 0; col < 8; col++) {
        if (!(bits & (0x80 >> col))) continue;
        const px = x + (charIndex * 8) + col;
        const py = y + row;
        if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < pixels.length) pixels[py][px] = color & 0x0f;
      }
    }
  }
}

function drawBitmapHudAtlasIcon(
  pixels: number[][],
  room: Msx2Screen4BitmapRoom,
  atlasPixels: number[][],
  widget: Msx2HudWidget
): void {
  const entries = room.atlas.entries || [];
  const entry = entries.find(item => item.id === widget.atlasEntryId) || entries[clampByte(widget.iconTileIndex, 0)];
  const x0 = clampInt(widget.x, 0, SCREEN_WIDTH - 1, 0);
  const y0 = clampInt(widget.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 0);
  const width = Math.max(1, Math.min(Number(widget.width) || entry?.w || 8, SCREEN_WIDTH - x0));
  const height = Math.max(1, Math.min(Number(widget.height) || entry?.h || 8, BITMAP_ROOM_HUD_HEIGHT - y0));
  if (!entry) {
    paintRect(pixels, x0, y0, width, height, widget.primaryColor ?? 15);
    return;
  }
  for (let yy = 0; yy < height; yy++) {
    for (let xx = 0; xx < width; xx++) {
      const color = atlasPixels[entry.sy + yy]?.[entry.sx + xx];
      if (color === undefined) continue;
      pixels[y0 + yy][x0 + xx] = color & 0x0f;
    }
  }
}

function buildBitmapHudSeedPixels(room: Msx2Screen4BitmapRoom, atlasPixels: number[][], analysis: ProjectAnalysis): number[][] {
  const framebuffer = Array.from({ length: BITMAP_ROOM_HUD_HEIGHT }, () => Array.from({ length: SCREEN_WIDTH }, () => 1));
  for (let y = 0; y < BITMAP_ROOM_HUD_HEIGHT - 1; y++) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      framebuffer[y][x] = 1;
    }
  }
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    framebuffer[BITMAP_ROOM_HUD_HEIGHT - 1][x] = 15;
  }
  const widgets = room.runtime?.showHud === false || room.runtime?.hideHud === true ? [] : room.runtime?.hudWidgets || [];
  const font = getBitmapHudFontAsset(analysis, room);
  const allowedCharacters = font?.characters || DEFAULT_HUD_CHARS;
  for (const widget of widgets) {
    const x = clampInt(widget.x, 0, SCREEN_WIDTH - 1, 0);
    const y = clampInt(widget.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 0);
    const width = clampInt(widget.width, 1, SCREEN_WIDTH - x, widget.kind === 'icon' ? 8 : 64);
    const height = clampInt(widget.height, 1, BITMAP_ROOM_HUD_HEIGHT - y, widget.kind === 'bar' ? 6 : 8);
    if (widget.kind === 'bar') {
      const maxValue = Math.max(1, clampByte(widget.maxValue, 16));
      const initialValue = Math.min(maxValue, clampByte(widget.initialValue, maxValue));
      const fillWidth = Math.max(0, Math.min(width - 2, Math.floor(((width - 2) * initialValue) / maxValue)));
      paintRect(framebuffer, x, y, width, height, widget.borderColor ?? 15);
      paintRect(framebuffer, x + 1, y + 1, Math.max(0, width - 2), Math.max(0, height - 2), widget.emptyColor ?? 4);
      paintRect(framebuffer, x + 1, y + 1, fillWidth, Math.max(0, height - 2), widget.primaryColor ?? 10);
    } else if (widget.kind === 'icon') {
      drawBitmapHudAtlasIcon(framebuffer, room, atlasPixels, { ...widget, width, height });
    } else {
      const color = widget.primaryColor ?? ((font?.colorByte ?? 0xF1) >> 4);
      drawBitmapHudText(framebuffer, getBitmapHudWidgetText(widget, room, allowedCharacters), x, y, font, color);
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

function buildRleChunksForVram(bytes: number[], vramBaseOffset: number, labelPrefix: string): RleChunk[] {
  const chunks: RleChunk[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const absoluteVramOffset = vramBaseOffset + offset;
    const remainingInBank = VRAM_BANK_BYTES - (absoluteVramOffset % VRAM_BANK_BYTES);
    const rawLength = Math.min(remainingInBank, bytes.length - offset);
    const raw = bytes.slice(offset, offset + rawLength);
    chunks.push({
      label: `${labelPrefix}_${chunks.length}`,
      vramOffset: absoluteVramOffset,
      rawLength: raw.length,
      bytes: rleEncodeBytes(raw),
    });
    offset += rawLength;
  }
  return chunks;
}

function buildRleUploadAsm(rleChunks: RleChunk[]): string {
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

function formatRleChunks(chunks: RleChunk[], rawByteCount: number, description: string): string {
  const encodedByteCount = chunks.reduce((total, chunk) => total + chunk.bytes.length, 0);
  const lines: string[] = [
    `; ${description}`,
    `; Raw bytes: ${rawByteCount}; encoded bytes: ${encodedByteCount}`,
  ];
  for (const chunk of chunks) {
    lines.push(`; VRAM ${hexWord(chunk.vramOffset)}, raw ${chunk.rawLength} bytes, RLE ${chunk.bytes.length} bytes`);
    lines.push(`${chunk.label}:`);
    for (let offset = 0; offset < chunk.bytes.length; offset += 16) {
      lines.push(`    DB ${chunk.bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
    }
    lines.push(`${chunk.label}_end:`);
  }
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

function buildRuntimeAsm(
  room: Msx2Screen4BitmapRoom,
  commandCount: number,
  rleChunks: RleChunk[],
  hudSeedRleChunks: RleChunk[]
): string {
  const atlasVramBase = (room.atlas.offscreenBaseY || 320) * ROW_BYTES;
  const hudSeedUploadAsm = buildRleUploadAsm(hudSeedRleChunks);
  const framebufferUploadAsm = buildRleUploadAsm(rleChunks);

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
; FUNCTION: init_bitmap_hud_band
; ------------------------------------------------------------
; PURPOSE:
;   Initialize the persistent top HUD band once after entering SCREEN 5.
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
;   Writes the top ${BITMAP_ROOM_HUD_HEIGHT} scanlines at VRAM #0000.
;
; NOTES:
;   Room transitions should normally call upload_bitmap_framebuffer only. HUD
;   widgets are expected to redraw their changed glyphs/bars separately.
; ------------------------------------------------------------
init_bitmap_hud_band:
${hudSeedUploadAsm}

; ------------------------------------------------------------
; FUNCTION: upload_bitmap_framebuffer
; ------------------------------------------------------------
; PURPOSE:
;   Upload the pre-rendered packed 4bpp game room framebuffer to visible VRAM.
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
;   Writes the game area VRAM starting at ${hexWord(BITMAP_ROOM_GAME_VRAM_BASE)}.
;
; NOTES:
;   Reads compact RLE data from the resident ROM window, then re-arms R#14 per
;   16KB VRAM bank so rows beyond physical VRAM #3FFF are written correctly.
;   The HUD band is persistent and is not rewritten by normal room loads.
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
  const atlasPixels = normalizeAtlasPixels(room);
  const gameFramebufferPixels = normalizeVisibleFramebuffer(room) || renderRoomToPixels(room);
  const framebufferBytes = packBitmapPixels(gameFramebufferPixels.slice(0, SCREEN_HEIGHT_DEFAULT));
  const framebufferRleChunks = buildRleChunksForVram(
    framebufferBytes,
    BITMAP_ROOM_GAME_VRAM_BASE,
    'bitmap_room_framebuffer_rle_chunk'
  );
  const hudSeedBytes = packBitmapPixels(buildBitmapHudSeedPixels(room, atlasPixels, analysis));
  const hudSeedRleChunks = buildRleChunksForVram(hudSeedBytes, 0, 'bitmap_room_hud_seed_rle_chunk');
  const spriteTables = buildSpriteTables();
  const runtimeAsm = buildRuntimeAsm(room, 0, framebufferRleChunks, hudSeedRleChunks);
  const visibleHeight = SCREEN5_VISIBLE_HEIGHT;
  const hudWidgetCount = room.runtime?.showHud === false || room.runtime?.hideHud === true ? 0 : room.runtime?.hudWidgets?.length || 0;

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: ${projectName}
; Room: ${room.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen4-bitmap-room
; Visible page: VRAM #0000, ${ROW_BYTES} bytes/row, ${visibleHeight} lines
; Bitmap room HUD height: ${BITMAP_ROOM_HUD_HEIGHT} px
; Bitmap room HUD widgets: ${hudWidgetCount}
; Bitmap room game area: ${SCREEN_WIDTH}x${SCREEN_HEIGHT_DEFAULT} at visual Y=${BITMAP_ROOM_GAME_Y_OFFSET}
; Bitmap room upload area: ${SCREEN_WIDTH}x${SCREEN_HEIGHT_DEFAULT} at VRAM ${hexWord(BITMAP_ROOM_GAME_VRAM_BASE)}
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
    call init_bitmap_hud_band
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
bitmap_room_hud_seed_data:
${formatRleChunks(hudSeedRleChunks, hudSeedBytes.length, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed, packed 4bpp RLE`)}
bitmap_room_hud_seed_data_end:

bitmap_room_framebuffer_data:
${formatRleChunks(framebufferRleChunks, framebufferBytes.length, `Game ${SCREEN_WIDTH}x${SCREEN_HEIGHT_DEFAULT} framebuffer, packed 4bpp RLE, destination VRAM ${hexWord(BITMAP_ROOM_GAME_VRAM_BASE)}`)}
bitmap_room_framebuffer_data_end:

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
