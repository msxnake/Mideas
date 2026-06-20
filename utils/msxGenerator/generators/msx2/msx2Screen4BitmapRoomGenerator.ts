import { ConnectionDirection, Msx2BitmapRoomCommand, Msx2HudFontAsset, Msx2HudWidget, Msx2PlayerDefinition, Msx2Screen4BitmapRoom, Msx2Sprite, Screen5PaletteSlot } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';
import {
  buildHardwareSpriteLayersForFrame,
  getFirstReferencedMsx2Sprite,
  getMsx2PlayerAssetRecords,
  resolveMsx2SpriteById,
} from './msx2Screen4Generator';

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
const TILE_GRID_SIZE = 16;
const VDP_CTRL_PORT = '#99';
const VDP_DATA_PORT = '#98';
const VDP_CMD_PORT = '#9B';
const VDP_PALETTE_PORT = '#9A';

// V9938 LOGICAL commands operate in DOT (pixel) units, which is what the room
// records store (dx/dy/nx/ny in pixels). The earlier engine used the high-speed
// byte commands (0xD0/0xC0) with pixel values, which doubled every X coordinate;
// the world engine uses the logical variants so a 16px tile lands on 16px.
const CMD_COPY_8 = 0x90;   // LMMM: logical move VRAM -> VRAM
const CMD_COPY_16 = 0x90;  // LMMM
const CMD_FILL = 0x80;     // LMMV: logical move VDP color -> VRAM (rectangle fill)
const CMD_LINE = 0x70;     // LINE

const OP_FILL = 0;
const OP_LINE_H = 1;
const OP_LINE_V = 2;
const OP_COPY_8 = 3;
const OP_COPY_16 = 4;

const VDP_CMD_BLOCK_SIZE = 15;
const VRAM_BANK_BYTES = 0x4000;
const ROM_DATA_BANK_BYTES = 0x2000;
const BITMAP_ROOM_MEGAROM_FIRST_DATA_BANK = 4;
const RLE_ROM_CHUNK_MAX_BYTES = 0x1f00;

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

type RoomTransitions = Map<number, Partial<Record<ConnectionDirection, number>>>;

/**
 * A "world" is a `worldmap` asset; its nodes are the bitmap-room screens that
 * share one tileset/palette. This collects the ordered rooms of the world that
 * contains the first bitmap room, the start room index, and the edge-transition
 * table (room index + direction -> destination room index) derived from the
 * worldmap connections. With no worldmap it degrades to a single standalone room.
 */
function collectBitmapWorldRooms(analysis: ProjectAnalysis): {
  rooms: Msx2Screen4BitmapRoom[];
  startIndex: number;
  transitions: RoomTransitions;
} {
  const allRooms = (((analysis as any).msx2BitmapRooms || []) as Msx2Screen4BitmapRoom[]).filter(Boolean);
  if (allRooms.length === 0) return { rooms: [], startIndex: 0, transitions: new Map() };

  const roomById = new Map(allRooms.map(room => [room.id, room]));
  const worldmaps = ((analysis as any).worldmaps || []) as any[];
  const graph = worldmaps.find(wm => (wm?.nodes || []).some((node: any) => roomById.has(node?.screenAssetId)));
  if (!graph) return { rooms: [allRooms[0]], startIndex: 0, transitions: new Map() };

  // Order the rooms by the worldmap nodes that resolve to a bitmap room.
  const orderedNodes = (graph.nodes || []).filter((node: any) => roomById.has(node?.screenAssetId));
  const rooms = orderedNodes.map((node: any) => roomById.get(node.screenAssetId)!);
  const indexByScreenId = new Map<string, number>(orderedNodes.map((node: any, index: number) => [node.screenAssetId, index]));
  const nodeById = new Map<string, any>((graph.nodes || []).map((node: any) => [node.id, node]));

  let startIndex = 0;
  const startNode = graph.startScreenNodeId ? nodeById.get(graph.startScreenNodeId) : undefined;
  if (startNode && indexByScreenId.has(startNode.screenAssetId)) {
    startIndex = indexByScreenId.get(startNode.screenAssetId)!;
  }

  const transitions: RoomTransitions = new Map();
  const setTransition = (from: number, dir: ConnectionDirection, to: number) => {
    const entry = transitions.get(from) || {};
    entry[dir] = to;
    transitions.set(from, entry);
  };
  for (const connection of graph.connections || []) {
    const fromNode = nodeById.get(connection?.fromNodeId);
    const toNode = nodeById.get(connection?.toNodeId);
    if (!fromNode || !toNode) continue;
    const fromIndex = indexByScreenId.get(fromNode.screenAssetId);
    const toIndex = indexByScreenId.get(toNode.screenAssetId);
    if (fromIndex === undefined || toIndex === undefined) continue;
    if (connection.fromDirection) setTransition(fromIndex, connection.fromDirection, toIndex);
    if (connection.toDirection) setTransition(toIndex, connection.toDirection, fromIndex);
  }
  return { rooms, startIndex, transitions };
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
    backgroundColor: clampByte(room?.backgroundColor, 0) & 0x0f,
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
    tileGrid: room?.tileGrid,
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

function copyTileGrid(screen: number[][], atlasPixels: number[][], room: Msx2Screen4BitmapRoom): void {
  const grid = room.tileGrid;
  if (!Array.isArray(grid)) return;
  for (let cy = 0; cy < grid.length; cy++) {
    const row = grid[cy];
    if (!Array.isArray(row)) continue;
    for (let cx = 0; cx < row.length; cx++) {
      const entryIndex = clampInt(row[cx], 0, room.atlas.entries.length, 0) - 1;
      const entry = room.atlas.entries[entryIndex];
      if (!entry) continue;
      copyAtlasEntry(screen, atlasPixels, room, {
        id: `tile_${cx}_${cy}`,
        op: 'copy',
        atlasEntryId: entry.id,
        dx: cx * TILE_GRID_SIZE,
        dy: cy * TILE_GRID_SIZE,
        w: entry.w || TILE_GRID_SIZE,
        h: entry.h || TILE_GRID_SIZE,
      });
    }
  }
}

function renderRoomToPixels(room: Msx2Screen4BitmapRoom): number[][] {
  const height = room.height || SCREEN_HEIGHT_DEFAULT;
  const atlasPixels = normalizeAtlasPixels(room);
  const backgroundColor = clampByte(room.backgroundColor, 0) & 0x0f;
  const screen = Array.from({ length: height }, () => Array.from({ length: SCREEN_WIDTH }, () => backgroundColor));
  const shouldUseTileGrid = Array.isArray(room.tileGrid);
  for (const command of room.composition.commands || []) {
    if (shouldUseTileGrid && command.op === 'copy') continue;
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
  if (shouldUseTileGrid) {
    copyTileGrid(screen, atlasPixels, room);
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

/** True when a fill command covers the whole screen (the editor's background fill). */
function isFullScreenFillCommand(command: Msx2BitmapRoomCommand): boolean {
  return command.op === 'fill'
    && command.x <= 0
    && command.y <= 0
    && command.x + command.w >= SCREEN_WIDTH
    && command.y + command.h >= SCREEN_HEIGHT_DEFAULT;
}

/**
 * Read a room's 16x12 tile-index map (the authoritative 192-byte screen). Prefers
 * the persisted `tileGrid`; otherwise reconstructs it from the `copy` commands.
 * Each cell holds an atlas-entry reference (index+1; 0 = empty/background).
 */
function buildRoomTileIndexGrid(room: Msx2Screen4BitmapRoom): number[][] {
  const entries = room.atlas?.entries || [];
  const grid = Array.from({ length: COLLISION_ROWS }, () => Array.from({ length: COLLISION_COLS }, () => 0));
  if (Array.isArray(room.tileGrid)) {
    for (let y = 0; y < COLLISION_ROWS; y++) {
      for (let x = 0; x < COLLISION_COLS; x++) {
        const value = Math.max(0, Math.trunc(Number(room.tileGrid[y]?.[x]) || 0));
        grid[y][x] = value > 0 && value - 1 < entries.length ? value : 0;
      }
    }
    return grid;
  }
  const idToIndex = new Map(entries.map((entry, index) => [entry.id, index]));
  for (const command of room.composition?.commands || []) {
    if (command.op !== 'copy') continue;
    const index = idToIndex.get(command.atlasEntryId);
    if (index === undefined) continue;
    const cx = Math.floor(command.dx / TILE_GRID_SIZE);
    const cy = Math.floor(command.dy / TILE_GRID_SIZE);
    if (cx >= 0 && cx < COLLISION_COLS && cy >= 0 && cy < COLLISION_ROWS) grid[cy][cx] = index + 1;
  }
  return grid;
}

/**
 * World-engine room render program: a list of V9938 command blocks the runtime
 * replays to (re)build one room's visible game band from the shared tileset that
 * already sits in offscreen VRAM. Block 0 clears the game band to the background
 * color; authored fills/lines come next; then one 16x16 VRAM->VRAM copy per
 * occupied cell of the 192-byte tile map (the authoritative screen). Every
 * destination Y is shifted by the HUD band so logical room coords (0..191) land
 * below the persistent HUD. Returns the flattened 15-byte blocks and their count.
 */
function buildRoomRenderBlocks(room: Msx2Screen4BitmapRoom): { bytes: number[]; count: number } {
  const backgroundColor = clampByte(room.backgroundColor, 0) & 0x0f;
  const offscreenBaseY = room.atlas?.offscreenBaseY || 320;
  const entries = room.atlas?.entries || [];
  const records: CommandRecord[] = [
    { op: OP_FILL, sx: 0, sy: 0, dx: 0, dy: BITMAP_ROOM_GAME_Y_OFFSET, nx: SCREEN_WIDTH, ny: SCREEN_HEIGHT_DEFAULT, color: backgroundColor },
  ];
  // Authored color fills/lines (skip the full-screen background fill; the clear above covers it).
  for (const command of room.composition?.commands || []) {
    if (command.op === 'fill') {
      if (isFullScreenFillCommand(command)) continue;
      records.push({ op: OP_FILL, sx: 0, sy: 0, dx: clampInt(command.x, 0, 255, 0), dy: clampInt(command.y, 0, 511, 0) + BITMAP_ROOM_GAME_Y_OFFSET, nx: clampInt(command.w, 1, 256, 1), ny: clampInt(command.h, 1, 256, 1), color: clampByte(command.color, 0) & 0x0f });
    } else if (command.op === 'lineH') {
      records.push({ op: OP_LINE_H, sx: 0, sy: 0, dx: clampInt(command.x, 0, 255, 0), dy: clampInt(command.y, 0, 511, 0) + BITMAP_ROOM_GAME_Y_OFFSET, nx: clampInt(command.length, 1, 256, 1), ny: 1, color: clampByte(command.color, 0) & 0x0f });
    } else if (command.op === 'lineV') {
      records.push({ op: OP_LINE_V, sx: 0, sy: 0, dx: clampInt(command.x, 0, 255, 0), dy: clampInt(command.y, 0, 511, 0) + BITMAP_ROOM_GAME_Y_OFFSET, nx: 1, ny: clampInt(command.length, 1, 256, 1), color: clampByte(command.color, 0) & 0x0f });
    }
  }
  // Tile copies from the authoritative 192-byte map.
  const grid = buildRoomTileIndexGrid(room);
  for (let y = 0; y < COLLISION_ROWS; y++) {
    for (let x = 0; x < COLLISION_COLS; x++) {
      const value = grid[y][x];
      if (!value) continue;
      const entry = entries[value - 1];
      if (!entry) continue;
      records.push({
        op: OP_COPY_16,
        sx: clampInt(entry.sx, 0, 255, 0),
        sy: clampInt(entry.sy, 0, 511, 0) + offscreenBaseY,
        dx: x * TILE_GRID_SIZE,
        dy: y * TILE_GRID_SIZE + BITMAP_ROOM_GAME_Y_OFFSET,
        nx: TILE_GRID_SIZE,
        ny: TILE_GRID_SIZE,
        color: 0,
      });
    }
  }
  return { bytes: commandRecordsToVdpBlocks(records), count: records.length };
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
  dataBank?: number;
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

    let rawOffset = 0;
    let chunkStartRawOffset = 0;
    let chunkBytes: number[] = [];
    let chunkRawLength = 0;
    const flushChunk = () => {
      if (!chunkBytes.length) return;
      chunks.push({
        label: `${labelPrefix}_${chunks.length}`,
        vramOffset: absoluteVramOffset + chunkStartRawOffset,
        rawLength: chunkRawLength,
        bytes: chunkBytes,
      });
      chunkStartRawOffset = rawOffset;
      chunkBytes = [];
      chunkRawLength = 0;
    };

    while (rawOffset < raw.length) {
      const value = raw[rawOffset] & 0xff;
      let count = 1;
      rawOffset++;
      while (rawOffset < raw.length && (raw[rawOffset] & 0xff) === value && count < 255) {
        count++;
        rawOffset++;
      }
      if (chunkBytes.length + 2 > RLE_ROM_CHUNK_MAX_BYTES) {
        rawOffset -= count;
        flushChunk();
        continue;
      }
      chunkBytes.push(count, value);
      chunkRawLength += count;
    }
    flushChunk();
    offset += rawLength;
  }
  return chunks;
}

function buildRleUploadAsm(rleChunks: RleChunk[], banked: boolean): string {
  const lines: string[] = [];
  for (const chunk of rleChunks) {
    if (banked) {
      lines.push(`    ld a, ${chunk.label}_DATA_BANK`);
      lines.push(`    call bitmap_room_select_data_bank_a`);
    }
    lines.push(`    ld hl, ${chunk.label}`);
    lines.push(`    ld de, ${hexWord(chunk.vramOffset)}`);
    lines.push(`    ld bc, ${chunk.label}_end - ${chunk.label}`);
    lines.push(`    call decompress_bitmap_rle_to_vram`);
  }
  if (banked) {
    lines.push(`    call bitmap_room_restore_resident_banks`);
  }
  lines.push(`    ret`);
  return lines.join('\n');
}

interface BankedDataBlock {
  label: string;
  bytes: number[];
  description: string;
}

interface PackedDataBank {
  bank: number;
  used: number;
  blocks: BankedDataBlock[];
}

function buildBankedRleDataBlocks(chunks: RleChunk[], description: string): BankedDataBlock[] {
  return chunks.map(chunk => ({
    label: chunk.label,
    bytes: chunk.bytes,
    description: `${description}; VRAM ${hexWord(chunk.vramOffset)}, raw ${chunk.rawLength} bytes, RLE ${chunk.bytes.length} bytes`,
  }));
}

function packBitmapRoomDataBanks(blocks: BankedDataBlock[]): PackedDataBank[] {
  const banks: PackedDataBank[] = [];
  let current: PackedDataBank | undefined;
  for (const block of blocks) {
    if (block.bytes.length > ROM_DATA_BANK_BYTES) {
      throw new Error(`Bitmap-room data block ${block.label} is ${block.bytes.length} bytes and exceeds one 8KB MegaROM bank`);
    }
    if (!current || current.used + block.bytes.length > ROM_DATA_BANK_BYTES) {
      current = {
        bank: BITMAP_ROOM_MEGAROM_FIRST_DATA_BANK + banks.length,
        used: 0,
        blocks: [],
      };
      banks.push(current);
    }
    current.blocks.push(block);
    current.used += block.bytes.length;
  }
  return banks;
}

function assignDataBankConstants(banks: PackedDataBank[], chunks: RleChunk[]): void {
  const chunkByLabel = new Map(chunks.map(chunk => [chunk.label, chunk]));
  for (const bank of banks) {
    for (const block of bank.blocks) {
      const chunk = chunkByLabel.get(block.label);
      if (chunk) chunk.dataBank = bank.bank;
    }
  }
}

function formatDataBankEquates(chunks: RleChunk[]): string {
  const lines: string[] = [];
  for (const chunk of chunks) {
    if (chunk.dataBank !== undefined) {
      lines.push(`${chunk.label}_DATA_BANK EQU ${chunk.dataBank}`);
    }
  }
  return lines.length ? `${lines.join('\n')}\n` : '';
}

function formatBankedDataBanks(banks: PackedDataBank[]): string {
  if (!banks.length) return '';
  const lines: string[] = ['; --- SCREEN 5 bitmap-room Konami MegaROM data banks ---'];
  for (const bank of banks) {
    lines.push(`BITMAP_ROOM_DATA_BANK_${bank.bank}_PHYS_START:`);
    lines.push(`    org #8000`);
    lines.push(`BITMAP_ROOM_DATA_BANK_${bank.bank}_ROM_START:`);
    for (const block of bank.blocks) {
      lines.push(`; ${block.description}`);
      lines.push(`${block.label}:`);
      for (let offset = 0; offset < block.bytes.length; offset += 16) {
        lines.push(`    DB ${block.bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
      }
      lines.push(`${block.label}_end:`);
      lines.push('');
    }
    lines.push(`BITMAP_ROOM_DATA_BANK_${bank.bank}_USED_END:`);
    lines.push(`    ds #A000 - $, #FF`);
    lines.push('');
  }
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
  hudSeedRleChunks: RleChunk[],
  playerAnimation: { frameCount: number; delayFrames: number; mirror: boolean; authoredFacing?: 'left' | 'right' },
  options: { bankedRle: boolean }
): string {
  const atlasVramBase = (room.atlas.offscreenBaseY || 320) * ROW_BYTES;
  // Single backdrop color (R#7): background fill, transparency (color 0) and franjas share it.
  const backdropColor = clampByte(room.backgroundColor, 0) & 0x0f;
  const hudSeedUploadAsm = buildRleUploadAsm(hudSeedRleChunks, options.bankedRle);
  const tilesetUploadAsm = buildRleUploadAsm(rleChunks, options.bankedRle);
  const shouldEmitPlayerPatternUpdate = playerAnimation.frameCount > 1 || playerAnimation.mirror;
  const mirrorPatternOffset = playerAnimation.frameCount * 4;
  const mirrorSelectionAsm = playerAnimation.mirror && playerAnimation.authoredFacing === 'right'
    ? `    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp nz, .store_player_pattern
    add a, ${mirrorPatternOffset}
`
    : playerAnimation.mirror && playerAnimation.authoredFacing === 'left'
      ? `    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp z, .store_player_pattern
    add a, ${mirrorPatternOffset}
`
      : '';
  const playerAnimationAsm = shouldEmitPlayerPatternUpdate ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_player_sprite_animation
; ------------------------------------------------------------
; PURPOSE:
;   Advance the SCREEN 5 bitmap-room player hardware sprite frame and update
;   the SAT pattern index used by bitmap_update_sprite_sat.
;
; INPUT:
;   player_anim_counter = frame-delay counter.
;   player_anim_frame   = current logical animation frame.
;   player_moving       = 1 when horizontal input moved the player this frame.
;
; OUTPUT:
;   player_pat updated to the V9938 16x16 pattern group for the current frame.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Reads player_moving and writes player_anim_counter, player_anim_frame and
;   player_pat in RAM.
;
; NOTES:
;   V9938 16x16 sprites consume four 8x8 patterns per frame, so the SAT pattern
;   index advances by frame * 4. Stack is not used.
; ------------------------------------------------------------
bitmap_update_player_sprite_animation:
${playerAnimation.frameCount > 1 ? `    ld a, (player_moving)
    or a
    jp nz, .player_anim_active
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    jp .refresh_player_pattern
.player_anim_active:
    ld a, (player_anim_counter)
    inc a
    cp ${playerAnimation.delayFrames}
    jp nc, .advance_player_anim_frame
    ld (player_anim_counter), a
    jp .refresh_player_pattern
.advance_player_anim_frame:
    xor a
    ld (player_anim_counter), a
    ld a, (player_anim_frame)
    inc a
    cp ${playerAnimation.frameCount}
    jp c, .store_player_anim_frame
    xor a
.store_player_anim_frame:
    ld (player_anim_frame), a
` : ''}.refresh_player_pattern:
    ld a, (player_anim_frame)
    add a, a
    add a, a
${mirrorSelectionAsm}.store_player_pattern:
    ld (player_pat), a
    ret
` : '';

  return `
; --- V9938 bitmap SCREEN 4 runtime (Vampire Killer style) ---

; ------------------------------------------------------------
; FUNCTION: init_plain32k_page2_slot
; ------------------------------------------------------------
; PURPOSE:
;   Mirror the cartridge primary slot from page 1 (#4000-#7FFF) into page 2
;   (#8000-#BFFF) so plain 32KB ROM data can be read linearly.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC
;
; PRESERVES:
;   DE, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Updates the primary slot select register at PPI port #A8 for page 2.
;
; NOTES:
;   Bitmap rooms can place RLE source data above #8000 once tile variety grows.
;   Without this setup the second ROM page may still point at RAM/BIOS, causing
;   the decoder to feed #FF bytes into VRAM after the first visible render.
; ------------------------------------------------------------
init_plain32k_page2_slot:
    in a, (PPI_A)
    ld b, a
    and #0C                  ; keep page 1 primary slot bits
    rlca
    rlca                     ; move page 1 bits into page 2 position
    ld c, a
    ld a, b
    and #CF                  ; clear page 2 primary slot bits
    or c
    out (PPI_A), a
    ret

; ------------------------------------------------------------
; FUNCTION: map_page2_to_cart_primary
; ------------------------------------------------------------
; PURPOSE:
;   Map #8000-#BFFF to the same cartridge slot currently used by #4000-#7FFF.
;
; INPUT:
;   Current ROM is executing from the cartridge slot in page 1 (#4000).
;
; OUTPUT:
;   Page 2 (#8000-#BFFF) is switched to the cartridge slot.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
;
; CALLS:
;   RSLREG, get_cart_slot_value, ENASLT.
;
; SIDE EFFECTS:
;   Changes the active slot for #8000-#BFFF.
;
; NOTES:
;   Required before Konami mapper writes. Without this, ld (#8000),A writes RAM
;   instead of the cartridge mapper register on machines where page 2 still
;   points to RAM after boot. Stack use is only the BIOS CALL/RET nesting.
; ------------------------------------------------------------
map_page2_to_cart_primary:
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

; ------------------------------------------------------------
; FUNCTION: get_cart_slot_value
; ------------------------------------------------------------
; PURPOSE:
;   Convert primary slot bits into the ENASLT slot descriptor, including
;   expanded-slot secondary bits when the cartridge slot is expanded.
;
; INPUT:
;   A bits 0-1 = primary slot id for the cartridge page.
;
; OUTPUT:
;   A = ENASLT slot descriptor for the same slot.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Reads BIOS expanded slot table at #FCC1.
;
; NOTES:
;   Mirrors the SCREEN 4 MegaROM slot setup. PUSH/POP are not used.
; ------------------------------------------------------------
get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jp z, .slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
.slot_ready:
    or c
    ret

; ------------------------------------------------------------
; FUNCTION: init_konami8k_fixed_bank0_banks
; ------------------------------------------------------------
; PURPOSE:
;   Initialize a Konami 8KB MegaROM with bank 0 fixed at #4000 and the
;   resident startup banks mapped in #6000/#8000/#A000.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3.
;
; SIDE EFFECTS:
;   Writes Konami mapper registers #6000, #8000 and #A000.
;
; NOTES:
;   Stack is not used here. Bank 0 remains fixed by the cartridge mapper.
; ------------------------------------------------------------
init_konami8k_fixed_bank0_banks:
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    jp mapper_set_bank_p3

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p1
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #6000-#7FFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami mapper register #6000.
;
; NOTES:
;   No PUSH/POP. LD (nn),A does not modify flags.
; ------------------------------------------------------------
mapper_set_bank_p1:
    ld (#6000), a
    ret

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p2
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #8000-#9FFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami mapper register #8000.
;
; NOTES:
;   P2 is the bitmap-room data read window for banked RLE sources.
; ------------------------------------------------------------
mapper_set_bank_p2:
    ld (#8000), a
    ret

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p3
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #A000-#BFFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami mapper register #A000.
;
; NOTES:
;   Present for symmetry with the fixed-bank0 SCREEN 4 MegaROM runtime.
; ------------------------------------------------------------
mapper_set_bank_p3:
    ld (#A000), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_room_select_data_bank_a
; ------------------------------------------------------------
; PURPOSE:
;   Map one bitmap-room data bank into the P2 #8000 read window.
;
; INPUT:
;   A = physical data bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p2.
;
; SIDE EFFECTS:
;   Changes which ROM bank is readable at #8000-#9FFF.
;
; NOTES:
;   Call this before loading HL with a banked data label. Stack is not used.
; ------------------------------------------------------------
bitmap_room_select_data_bank_a:
    jp mapper_set_bank_p2

; ------------------------------------------------------------
; FUNCTION: bitmap_room_restore_resident_banks
; ------------------------------------------------------------
; PURPOSE:
;   Restore the resident physical banks after banked resource uploads.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p2, mapper_set_bank_p3.
;
; SIDE EFFECTS:
;   Restores P2=#8000 to physical bank 2 and P3=#A000 to physical bank 3.
;
; NOTES:
;   Keeps gameplay reads from resident tables deterministic after loading
;   large SCREEN 5 bitmap RLE resources. Stack is not used.
; ------------------------------------------------------------
bitmap_room_restore_resident_banks:
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    jp mapper_set_bank_p3

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
    ld e, a
    ld a, #0E
    call vdp_write_register
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
    ld e, a
    ld a, #0E
    call vdp_write_register
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
    ; Enable 16x16 hardware sprites (R#1 bit1 = SI). CHGMOD 5 leaves R#1=#60 (8x8),
    ; which would render only the top-left 8x8 quadrant of the 16x16 player pattern.
    ld a, #01
    ld e, #62
    call vdp_write_register
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
    ; Backdrop color (R#7) = background color. In SCREEN 5 this paints the outer "franjas"
    ; AND every color-0 (transparent) bitmap pixel, so background/transparency/border match.
    ld a, #07
    ld e, #${backdropColor.toString(16).toUpperCase().padStart(2, '0')}
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
;   The HUD band is uploaded once and persists across room loads (load_room only
;   repaints the game band below it). HUD widgets redraw their glyphs/bars apart.
; ------------------------------------------------------------
init_bitmap_hud_band:
${hudSeedUploadAsm}

; ------------------------------------------------------------
; FUNCTION: upload_tileset_atlas
; ------------------------------------------------------------
; PURPOSE:
;   Upload the shared world tileset (atlas, packed 4bpp RLE) once to offscreen
;   VRAM. load_room then builds each room by copying 16x16 tiles from here.
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
;   Writes the offscreen tileset VRAM starting at ${hexWord(atlasVramBase)}.
;
; NOTES:
;   Reads compact RLE data from the resident ROM window (or P2 data banks), then
;   re-arms R#14 per 16KB VRAM bank so rows beyond physical VRAM #3FFF are
;   written correctly. Uploaded once at boot; rooms reference it by VRAM source.
; ------------------------------------------------------------
upload_tileset_atlas:
${tilesetUploadAsm}

; ------------------------------------------------------------
; FUNCTION: replay_room_commands
; ------------------------------------------------------------
; PURPOSE:
;   Feed a room render program (a list of ${VDP_CMD_BLOCK_SIZE}-byte V9938 command
;   blocks) to the VDP command engine, waiting for each command to finish.
;
; INPUT:
;   HL = pointer to the command blocks. B = number of blocks.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, HL
;
; PRESERVES:
;   DE, IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer.
;
; SIDE EFFECTS:
;   Issues LMMV/LMMM/LINE commands that paint the visible game band.
;
; NOTES:
;   Each block is SX,SY,DX,DY,NX,NY (16-bit LE), CLR, ARG, CMR. Indirect register
;   writes auto-increment from R#32, so the pointer is re-armed per block.
; ------------------------------------------------------------
replay_room_commands:
    ld a, b
    or a
    ret z
.next_block:
    push bc
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld b, ${VDP_CMD_BLOCK_SIZE}
.write_block:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .write_block
    pop bc
    djnz .next_block
    ret

; ------------------------------------------------------------
; FUNCTION: load_room
; ------------------------------------------------------------
; PURPOSE:
;   Render one room's visible game band from the shared tileset and reload its
;   collision map into RAM.
;
; INPUT:
;   A = room/screen index (0-based).
;
; OUTPUT:
;   current_screen_index updated; bitmap_room_collision_map (RAM) refreshed.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   replay_room_commands.
;
; SIDE EFFECTS:
;   Repaints the game band via the VDP command engine; LDIR over collision RAM.
;
; NOTES:
;   Pointer tables are word-indexed (DW), the block-count table is byte-indexed.
;   DE = room index is preserved across the three table lookups (add hl,de only).
; ------------------------------------------------------------
load_room:
    ld (current_screen_index), a
    ld e, a
    ld d, 0
    ld hl, bitmap_room_render_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room render blocks
    push hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    ld b, (hl)              ; B = block count
    pop hl
    call replay_room_commands
    ld hl, bitmap_room_collision_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room collision source
    ld de, bitmap_room_collision_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
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

bitmap_wait_vblank:
    ; Poll VDP status S#0 until the frame flag (bit 7) is set: a 60 Hz tick that
    ; does NOT depend on BIOS frame interrupts (the VK-style VDP init does not
    ; enable a BIOS-compatible vblank IRQ). Assumes R#15 = 0. Clobbers AF/BC.
    ; If the host BIOS/VDP state never raises S#0 bit 7, return after a bounded
    ; delay so gameplay cannot hang on the first rendered frame.
    ld bc, #4000
.wv_loop:
    in a, (VDP_CTRL_PORT)
    bit 7, a
    ret nz
    dec bc
    ld a, b
    or c
    jp nz, .wv_loop
    ret

update_player_movement:
    ; Platform movement with 16x16-cell foreground collision. Reads keyboard row 8
    ; directly via PPI (pressed bit = 1 after CPL): bit7=right, bit5=up,
    ; bit4=left, bit0=SPACE. Clobbers AF/BC/DE/HL.
    ; Read keyboard row 8 (cursor keys) DIRECTLY via the PPI, not via BIOS SNSMAT.
    ; SNSMAT (a BIOS call) stalled the DI cartridge loop far below 60Hz (PC parked in
    ; BIOS) AND let the BIOS reset the VDP (R#1 back to 8x8 sprites) every frame.
    in a, (PPI_C)
    and #F0                 ; preserve CAPS LED / cassette / key-click bits
    or 8                    ; select keyboard row 8 in the low nibble
    out (PPI_C), a
    in a, (PPI_B)           ; row 8 data (0 = key pressed)
    cpl                     ; now a set bit means that key is pressed
    ld c, a                 ; C = pressed mask for keyboard row 8
    xor a
    ld (player_moving), a
bitmap_stick_dx:
    bit 7, c
    jp z, .not_right
    ld a, 1
    ld (player_facing), a
    ld (player_moving), a
    ld a, 2                 ; player speed: 2px/frame (was 1 -> felt sluggish)
    push bc
    call bitmap_try_move_x
    pop bc
    jp .check_jump
.not_right:
    bit 4, c
    jp z, .check_jump
    xor a
    ld (player_facing), a
    inc a
    ld (player_moving), a
    ld a, #FE              ; -2px/frame (left)
    push bc
    call bitmap_try_move_x
    pop bc
.check_jump:
    bit 0, c
    jp nz, .jump_pressed
    bit 5, c
    jp z, .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .apply_gravity
    ld a, #FA              ; -6 px/frame initial jump velocity
    ld (player_vy), a
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a
.apply_gravity:
    ld a, (player_vy)
    cp 6
    jp z, .apply_vertical_velocity
    inc a
    ld (player_vy), a
.apply_vertical_velocity:
    ld a, (player_vy)
    or a
    ret z
    bit 7, a
    jp z, .falling
    neg
    ld b, a
    ld c, #FF
    jp .vertical_step_loop
.falling:
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, (player_vy)
    ld b, a
    ld c, #01
.vertical_step_loop:
    ld a, c
    push bc
    call bitmap_try_move_y
    pop bc
    jp c, .vertical_blocked
    djnz .vertical_step_loop
    ret
.vertical_blocked:
    xor a
    ld (player_vy), a
    bit 7, c
    ret nz
    ld a, (player_flags)
    or #01
    ld (player_flags), a
    ret

${playerAnimationAsm}

bitmap_try_move_x:
    ; A = signed dx. Commits player_x when the leading edge is not solid.
    ; Probes top and bottom of the 16x16 body. Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_x)
    bit 7, b
    jp z, .check_right_bounds
    cp 2
    ret c
    jp .x_bounds_ok
.check_right_bounds:
    cp 239
    ret nc
.x_bounds_ok:
    ld a, (player_x)
    add a, b                ; A = candidate X (top-left)
    push af                 ; save candidate across the probe
    bit 7, b
    jp nz, .left_edge
    add a, 15               ; moving right: probe the right edge
.left_edge:
    ld b, a                 ; B = probe X (left edge keeps the candidate X)
    ld a, (player_y)
    inc a
    ld c, a                 ; C = probe Y (top inset)
    call bitmap_probe_solid
    jp nz, .x_blocked
    ld a, (player_y)
    add a, 15
    ld c, a                 ; C = probe Y (bottom)
    call bitmap_probe_solid
    jp nz, .x_blocked
    pop af                  ; A = candidate X
    ld (player_x), a
    ret
.x_blocked:
    pop af
    ret

bitmap_try_move_y:
    ; A = signed single-pixel dy (#01 down, #FF up). Commits player_y when the
    ; leading edge is not solid. Carry set on blocked. Clobbers AF/BC/DE/HL.
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
    inc a
    ld b, a                 ; B = probe X (left inset)
    call bitmap_probe_solid
    jp nz, .y_blocked
    ld a, (player_x)
    add a, 14
    ld b, a                 ; B = probe X (right inset)
    call bitmap_probe_solid
    jp nz, .y_blocked
    pop af                  ; A = candidate Y
    ld (player_y), a
    or a                    ; clear carry
    ret
.y_blocked:
    pop af
    scf
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
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret
`;
}

// Placeholder blob sprite (a diamond) used only when no configured player
// sprite can be resolved from the project.
const PLACEHOLDER_SPRITE_COLORS = Array.from({ length: 16 }, () => 0x01);
const PLACEHOLDER_SPRITE_PATTERNS = [
  0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

const BITMAP_ROOM_DEFAULT_SPRITE_COLOR = 15;

// Resolve the configured player's 16x16 render sprite for the bitmap room.
// Priority: room.playerEntries[].playerId -> msx2player asset -> render.spriteAssetId;
// else first msx2player asset's render sprite; else first referenced msx2sprite.
function resolveBitmapRoomPlayerSprite(analysis: ProjectAnalysis, room: Msx2Screen4BitmapRoom): Msx2Sprite | undefined {
  const playerRecords = getMsx2PlayerAssetRecords(analysis);

  const referenceIds = new Set<string>();
  for (const entry of room.playerEntries || []) {
    const playerId = String((entry as any)?.playerId || '').trim();
    if (playerId) referenceIds.add(playerId);
  }

  const resolveFromPlayer = (player: Partial<Msx2PlayerDefinition> | undefined): Msx2Sprite | undefined => {
    const spriteAssetId = String(player?.render?.spriteAssetId || '').trim();
    return spriteAssetId ? resolveMsx2SpriteById(analysis, spriteAssetId) : undefined;
  };

  // 1) Explicit playerId reference from the room.
  if (referenceIds.size) {
    const referenced = playerRecords.find(record =>
      referenceIds.has(record.assetId) || referenceIds.has(record.playerId) || referenceIds.has(record.name)
    );
    const sprite = resolveFromPlayer(referenced?.player);
    if (sprite) return sprite;
  }

  // 2) First msx2player asset's render sprite.
  for (const record of playerRecords) {
    const sprite = resolveFromPlayer(record.player);
    if (sprite) return sprite;
  }

  // 3) Any referenced msx2sprite in the project.
  return getFirstReferencedMsx2Sprite(analysis);
}

function getBitmapRoomSpriteFrameIndices(sprite: Msx2Sprite | undefined): number[] {
  if (!sprite?.frames?.length) return [0];
  const indices = sprite.frames
    .map((_frame, index) => index)
    .filter(index => Array.isArray(sprite.frames?.[index]?.data) && sprite.frames[index].data.length > 0);
  return (indices.length ? indices : [0]).slice(0, 8);
}

function getBitmapRoomSpriteAnimationDelayFrames(sprite: Msx2Sprite | undefined): number {
  const speedMs = Number(sprite?.animationSpeedMs);
  if (!Number.isFinite(speedMs) || speedMs <= 0) return 8;
  return Math.max(1, Math.min(255, Math.round(speedMs / (1000 / 60))));
}

function reverseSpritePatternByte(value: number): number {
  let result = 0;
  for (let bit = 0; bit < 8; bit++) {
    if (value & (1 << bit)) result |= 0x80 >> bit;
  }
  return result;
}

function mirrorHardwareSpritePatternHorizontally(pattern: number[]): number[] {
  const topLeft = pattern.slice(0, 8);
  const bottomLeft = pattern.slice(8, 16);
  const topRight = pattern.slice(16, 24);
  const bottomRight = pattern.slice(24, 32);
  return [
    ...topRight.map(reverseSpritePatternByte),
    ...bottomRight.map(reverseSpritePatternByte),
    ...topLeft.map(reverseSpritePatternByte),
    ...bottomLeft.map(reverseSpritePatternByte),
  ];
}

function buildSpriteTables(sprite: Msx2Sprite | undefined): { colors: number[]; attrs: number[]; patterns: number[]; usedConfigured: boolean; frameCount: number; delayFrames: number; mirror: boolean; authoredFacing?: 'left' | 'right' } {
  // sprite 0 = player (Y,X overwritten each frame by bitmap_update_sprite_sat),
  // pattern index 0. sprite 1 Y=#D8 stops further sprite processing.
  const attrs = [
    0x60, 0x80, 0x00, 0x00,
    0xD8, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];

  if (sprite) {
    // V9938 sprite mode 2: 32-byte pattern (four 8x8 quadrants) + 16 line colors.
    // Reuse the SCREEN 4 converter; emit every authored frame, primary (first) color layer.
    const frameIndices = getBitmapRoomSpriteFrameIndices(sprite);
    const frameLayers = frameIndices
      .map(frameIndex => buildHardwareSpriteLayersForFrame(sprite, BITMAP_ROOM_DEFAULT_SPRITE_COLOR, frameIndex)[0])
      .filter((layer): layer is NonNullable<typeof layer> => Boolean(layer && Array.isArray(layer.pattern) && layer.pattern.length === 32));
    const primary = frameLayers[0];
    if (primary && Array.isArray(primary.pattern) && primary.pattern.length === 32) {
      const authoredFacing = sprite.facingDirection === 'left' || sprite.facingDirection === 'right'
        ? sprite.facingDirection
        : undefined;
      const basePatterns = frameLayers.flatMap(layer => layer.pattern.map(value => value & 0xff));
      const mirrorPatterns = authoredFacing
        ? frameLayers.flatMap(layer => mirrorHardwareSpritePatternHorizontally(layer.pattern).map(value => value & 0xff))
        : [];
      const colors = (primary.colors || []).slice(0, 16);
      while (colors.length < 16) colors.push(BITMAP_ROOM_DEFAULT_SPRITE_COLOR);
      return {
        colors: colors.map(value => value & 0xff),
        attrs,
        patterns: [...basePatterns, ...mirrorPatterns],
        usedConfigured: true,
        frameCount: Math.max(1, frameLayers.length),
        delayFrames: getBitmapRoomSpriteAnimationDelayFrames(sprite),
        mirror: Boolean(authoredFacing),
        authoredFacing,
      };
    }
  }

  // Fallback: the original placeholder blob.
  return {
    colors: PLACEHOLDER_SPRITE_COLORS.slice(),
    attrs,
    patterns: PLACEHOLDER_SPRITE_PATTERNS.slice(),
    usedConfigured: false,
    frameCount: 1,
    delayFrames: 8,
    mirror: false,
  };
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
  // playerEntries store PIXEL coordinates (0..255 / 0..191), NOT tile coords.
  const x = clampInt(entry?.x, 0, 255, 32);
  const y = clampInt(entry?.y, 0, 191, 128);
  return { x, y, visible: true };
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
  const isKonamiMegaRom = config.romMode === 'megarom' && config.targetFormat === 'konami';
  if (config.romMode === 'megarom' && config.targetFormat !== 'konami') {
    throw new Error(`MSX2 bitmap-room MegaROM currently supports Konami mapper only, got ${config.targetFormat}`);
  }
  // World engine: all screens of a world share one tileset/palette. The shared
  // tileset (the start room's atlas) is uploaded once to offscreen VRAM; each room
  // is a 192-byte tile map replayed as VRAM->VRAM copies by load_room.
  const world = collectBitmapWorldRooms(analysis);
  const rooms = (world.rooms.length ? world.rooms : [firstBitmapRoom(analysis)]).map(normalizeRoom);
  const startIndex = Math.min(world.startIndex, rooms.length - 1);
  const room = rooms[startIndex];
  const spawn = resolvePlayerSpawnPixels(room);
  const paletteBytes = buildPaletteBytes(room.palette);
  const atlasPixels = normalizeAtlasPixels(room);
  const atlasVramBase = (room.atlas.offscreenBaseY || 320) * ROW_BYTES;
  const tilesetBytes = packAtlasPixels(room);
  const tilesetRleChunks = buildRleChunksForVram(tilesetBytes, atlasVramBase, 'bitmap_room_tileset_rle_chunk');
  // Per-room render program (command blocks) + collision map.
  const roomTables = rooms.map((roomData, index) => {
    const render = buildRoomRenderBlocks(roomData);
    return {
      index,
      renderLabel: `bitmap_room_render_${index}`,
      renderBytes: render.bytes,
      blockCount: render.count,
      collisionLabel: `bitmap_room_collision_${index}`,
      collisionBytes: buildCollisionTableBytes(roomData),
    };
  });
  const hudSeedBytes = packBitmapPixels(buildBitmapHudSeedPixels(room, atlasPixels, analysis));
  const hudSeedRleChunks = buildRleChunksForVram(hudSeedBytes, 0, 'bitmap_room_hud_seed_rle_chunk');
  const allRleChunks = [...hudSeedRleChunks, ...tilesetRleChunks];
  const bankedDataBlocks = isKonamiMegaRom
    ? [
      ...buildBankedRleDataBlocks(hudSeedRleChunks, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed, packed 4bpp RLE`),
      ...buildBankedRleDataBlocks(tilesetRleChunks, `Shared world tileset (atlas), packed 4bpp RLE`),
    ]
    : [];
  const bankedDataBanks = isKonamiMegaRom ? packBitmapRoomDataBanks(bankedDataBlocks) : [];
  if (isKonamiMegaRom) assignDataBankConstants(bankedDataBanks, allRleChunks);
  const bankedDataEquates = isKonamiMegaRom ? formatDataBankEquates(allRleChunks) : '';
  const bankedDataAsm = isKonamiMegaRom ? formatBankedDataBanks(bankedDataBanks) : '';
  const hudSeedDataAsm = isKonamiMegaRom
    ? `; Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed is emitted in Konami MegaROM data banks below.\n`
    : formatRleChunks(hudSeedRleChunks, hudSeedBytes.length, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed, packed 4bpp RLE`);
  const tilesetDataAsm = isKonamiMegaRom
    ? `; Shared world tileset RLE is emitted in Konami MegaROM data banks below.\n`
    : formatRleChunks(tilesetRleChunks, tilesetBytes.length, `Shared world tileset (atlas), packed 4bpp RLE, destination VRAM ${hexWord(atlasVramBase)}`);
  const playerSprite = resolveBitmapRoomPlayerSprite(analysis, room);
  const spriteTables = buildSpriteTables(playerSprite);
  const spriteSourceLabel = spriteTables.usedConfigured
    ? `configured player sprite${playerSprite?.name ? ` "${playerSprite.name}"` : ''}`
    : 'placeholder fallback (no configured player sprite resolvable)';
  const runtimeAsm = buildRuntimeAsm(room, 0, tilesetRleChunks, hudSeedRleChunks, {
    frameCount: spriteTables.frameCount,
    delayFrames: spriteTables.delayFrames,
    mirror: spriteTables.mirror,
    authoredFacing: spriteTables.authoredFacing,
  }, { bankedRle: isKonamiMegaRom });
  // Per-room render-program + collision data and the dispatch tables for load_room.
  const roomDataAsm = roomTables.map(table =>
    `${formatBytes(table.renderLabel, table.renderBytes, `Room ${table.index} render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`)}` +
    `${formatBytes(table.collisionLabel, table.collisionBytes, `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} collision grid (16x16 px cells), row-major, 0=empty`)}`
  ).join('\n');
  const roomRenderPtrTableAsm = `bitmap_room_render_ptr_table:\n${roomTables.map(t => `    DW ${t.renderLabel}`).join('\n')}\n`;
  const roomBlockCountTableAsm = `bitmap_room_blockcount_table:\n    DB ${roomTables.map(t => t.blockCount).join(',')}\n`;
  const roomCollisionPtrTableAsm = `bitmap_room_collision_ptr_table:\n${roomTables.map(t => `    DW ${t.collisionLabel}`).join('\n')}\n`;
  const playerAnimationUpdateCall = (spriteTables.frameCount > 1 || spriteTables.mirror)
    ? '    call bitmap_update_player_sprite_animation\n'
    : '';
  const visibleHeight = SCREEN5_VISIBLE_HEIGHT;
  const hudWidgetCount = room.runtime?.showHud === false || room.runtime?.hideHud === true ? 0 : room.runtime?.hudWidgets?.length || 0;

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: ${projectName}
; Room: ${room.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen4-bitmap-room
; ROM Mode: ${config.romMode}
; Mapper Target: ${config.targetFormat}
; Auto MegaROM: ${config.autoMegaROM ? 'Yes' : 'No'}
; NOTE: ${isKonamiMegaRom ? 'Bitmap-room SCREEN 5 RLE sources are read through Konami P2/#8000 data banks.' : 'Bitmap-room SCREEN 5 uses a linear simple32k ROM layout.'}
; Visible page: VRAM #0000, ${ROW_BYTES} bytes/row, ${visibleHeight} lines
; Bitmap room HUD height: ${BITMAP_ROOM_HUD_HEIGHT} px
; Bitmap room HUD widgets: ${hudWidgetCount}
; Bitmap room game area: ${SCREEN_WIDTH}x${SCREEN_HEIGHT_DEFAULT} at visual Y=${BITMAP_ROOM_GAME_Y_OFFSET}
; Bitmap room game band VRAM base: ${hexWord(BITMAP_ROOM_GAME_VRAM_BASE)}
; World rooms: ${rooms.length}; start room index: ${startIndex}
; Shared tileset bytes: ${tilesetBytes.length} at VRAM ${hexWord(atlasVramBase)}
; ==================================================================

CHGMOD  EQU #005F
ENASLT  EQU #0024
GTSTCK  EQU #00DC
RSLREG  EQU #0138
SNSMAT  EQU #0141
PPI_A EQU #A8
PPI_B EQU #A9
PPI_C EQU #AA
VDP_CTRL_PORT EQU ${VDP_CTRL_PORT}
VDP_DATA_PORT EQU ${VDP_DATA_PORT}
VDP_CMD_PORT EQU ${VDP_CMD_PORT}
VDP_PALETTE_PORT EQU ${VDP_PALETTE_PORT}
${bankedDataEquates}

; Player SAT image in RAM (kept contiguous so the 4 bytes copy straight to the
; sprite 0 SAT slot at VRAM #F600): Y, X, pattern number, early-clock byte.
player_y   EQU #C000
player_x   EQU #C001
player_pat EQU #C002
player_ec  EQU #C003
player_anim_counter EQU #C004
player_anim_frame   EQU #C005
player_vy           EQU #C006
player_flags        EQU #C007
player_facing       EQU #C008
player_jump_lock    EQU #C009
player_moving       EQU #C00A
; World engine runtime state.
current_screen_index EQU #C00B
; Active room collision map copied here by load_room (16x12 = 192 bytes).
bitmap_room_collision_map EQU #C010

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
    ${isKonamiMegaRom ? 'call map_page2_to_cart_primary\n    call init_konami8k_fixed_bank0_banks' : 'call init_plain32k_page2_slot'}
    call init_screen4_bitmap_vdp
    call load_screen4_bitmap_palette
    call init_bitmap_hud_band
    call upload_tileset_atlas
    call init_hardware_sprite_tables
    ; Render the start room from the shared tileset already in VRAM.
    ld a, ${startIndex}
    call load_room
    ; Place the player at the room spawn point.
    ld a, ${spawn.y}
    ld (player_y), a
    ld a, ${spawn.x}
    ld (player_x), a
    xor a
    ld (player_pat), a
    ld (player_ec), a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    ld (player_vy), a
    ld (player_flags), a
    ld (player_jump_lock), a
    ld (player_moving), a
    inc a
    ld (player_facing), a
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so interrupts stay disabled and the BIOS cannot
    ; consume S#0 before the main loop sees it.
    ld a, #0F
    ld e, #00
    call vdp_write_register
.main_loop:
    call bitmap_wait_vblank
    call update_player_movement
${playerAnimationUpdateCall}    call bitmap_update_sprite_sat
    jp .main_loop

${runtimeAsm}

${formatBytes('screen4_bitmap_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
bitmap_room_hud_seed_data:
${hudSeedDataAsm}
bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
${tilesetDataAsm}
bitmap_room_tileset_data_end:

; World engine dispatch tables (indexed by room/screen index).
${roomRenderPtrTableAsm}
${roomBlockCountTableAsm}
${roomCollisionPtrTableAsm}
; Per-room render programs and collision maps.
${roomDataAsm}

${formatBytes('bitmap_room_sprite_colors', spriteTables.colors, `Sprite 0 line color table (mode 2): ${spriteSourceLabel}`)}
bitmap_room_sprite_colors_end:

${formatBytes('bitmap_room_sprite_attrs', spriteTables.attrs, 'SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing')}
bitmap_room_sprite_attrs_end:

${formatBytes('bitmap_room_sprite_patterns', spriteTables.patterns, `Sprite 0 pattern (16x16, mode 2 quadrants): ${spriteSourceLabel}`)}
bitmap_room_sprite_patterns_end:

    ds #C000 - $, #FF
${bankedDataAsm}
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
