import { DEFAULT_SCREEN5_CUSTOM_PALETTE as DEFAULT_SCREEN4_CUSTOM_PALETTE } from '../../../../constants';
import { GameFlowConnection, GameFlowNode, Msx2Screen4TileScreen, Msx2Sprite, PaletteAsset, Screen5PaletteSlot as Screen4PaletteSlot, ScreenMap } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';
import { renderNamedArtifactAsCommentBlock } from '../../utils/megaromResourceArtifacts';
import {
  MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN,
  MSX2_ENEMY_MOVEMENT_BALL_BOUNCE,
  MSX2_ENEMY_MOVEMENT_DIVE,
  MSX2_ENEMY_MOVEMENT_GHOST_MAZE,
  getMsx2EnemyHazardRuntimeSlots,
} from './msx2EntityRuntimeGenerator';

export interface Msx2Screen4Config {
  screenMode: 'SCREEN 4 (Graphics II)' | 'SCREEN 5 (Graphics III)';
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
  autoMegaROM?: boolean;
}

const SCREEN4_WIDTH = 256;
const SCREEN4_HEIGHT = 192;
const SCREEN4_CHAR_COLUMNS = 32;
const SCREEN4_CHAR_ROWS = 24;
const SCREEN4_PATTERN_BYTES = 0x1800;
const SCREEN4_COLOR_BYTES = 0x1800;
const SCREEN4_NAME_BYTES = SCREEN4_CHAR_COLUMNS * SCREEN4_CHAR_ROWS;
const CELL_SIZE = 8;
const TRANSPARENT_HEX = 'RGBA(0,0,0,0)';
const SCREEN4_PATTERN_VRAM = '#0000';
const SCREEN4_NAME_VRAM = '#1800';
const SCREEN4_SPRCOL_VRAM = '#1C00';
const SCREEN4_SPRATR_VRAM = '#1E00';
const SCREEN4_COLOR_VRAM = '#2000';
const SCREEN4_SPRPAT_VRAM = '#3800';
const MSX2_HUD_FONT_BASE_CHAR = 0xC0;
const MSX2_HUD_FONT_CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const MSX2_ZX_FONT_ASCII_FIRST = 0x20;
const MSX2_TILE_SCREEN_WIDTH = 16;
const MSX2_TILE_SCREEN_HEIGHT = 12;
const MSX2_PLAYER_BULLET_HARDWARE_SLOTS = 2;
const MSX2_ENEMY_BULLET_HARDWARE_SLOTS = 1;
const MSX2_MAX_PLAYER_HARDWARE_LAYERS = 32 - MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN - MSX2_PLAYER_BULLET_HARDWARE_SLOTS - MSX2_ENEMY_BULLET_HARDWARE_SLOTS - 1;
const MSX2_ENEMY_RUNTIME_BYTES = MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN * 7;
const MSX2_ENEMY_SPRITE_COLOR = 13;
const MSX2_RUNTIME_RAM_START = 0xC000;
const MSX2_RUNTIME_RAM_LIMIT = 0xF300;
const MSX2_SNAKE_MAX_BODY_CELLS = 32;
const MSX2_CONTROLS_RAM_BASE = 0xC040;
const MSX2_SNAKE_BODY_BASE = 0xC044;
const MSX2_EFFECT_RUNTIME_BASE = MSX2_SNAKE_BODY_BASE + (MSX2_SNAKE_MAX_BODY_CELLS * 2);
const MSX2_ENEMY_SPRITE_PATTERN = [
  0x07, 0x1F, 0x3F, 0x7F, 0x67, 0xE7, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xEE, 0xC6, 0x80,
  0xE0, 0xF8, 0xFC, 0xFE, 0x9E, 0x9F, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xEF, 0x31, 0x01,
];
const MSX2_PLAYER_BULLET_PATTERN = [
  0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18,
  0x18, 0x18, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
const MSX2_PONG_BALL_PATTERN = [
  0x00, 0x00, 0x07, 0x0F, 0x1F, 0x1F, 0x1F, 0x1F,
  0x0F, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0xE0, 0xF0, 0xF8, 0xF8, 0xF8, 0xF8,
  0xF0, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
const MSX2_ENEMY_BULLET_PATTERN = [
  0x00, 0x00, 0x18, 0x18, 0x3C, 0x3C, 0x18, 0x18,
  0x18, 0x18, 0x3C, 0x3C, 0x18, 0x18, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
const MSX2_HUD_FONT_GLYPHS: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  '0': [0x3C, 0x66, 0x6E, 0x76, 0x66, 0x66, 0x3C, 0x00],
  '1': [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00],
  '2': [0x3C, 0x66, 0x06, 0x1C, 0x30, 0x60, 0x7E, 0x00],
  '3': [0x3C, 0x66, 0x06, 0x1C, 0x06, 0x66, 0x3C, 0x00],
  '4': [0x0C, 0x1C, 0x3C, 0x6C, 0x7E, 0x0C, 0x0C, 0x00],
  '5': [0x7E, 0x60, 0x7C, 0x06, 0x06, 0x66, 0x3C, 0x00],
  '6': [0x1C, 0x30, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0x00],
  '7': [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0x00],
  '8': [0x3C, 0x66, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0x00],
  '9': [0x3C, 0x66, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0x00],
  A: [0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x00],
  B: [0x7C, 0x66, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x00],
  C: [0x3C, 0x66, 0x60, 0x60, 0x60, 0x66, 0x3C, 0x00],
  D: [0x78, 0x6C, 0x66, 0x66, 0x66, 0x6C, 0x78, 0x00],
  E: [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0x00],
  F: [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x00],
  G: [0x3C, 0x66, 0x60, 0x6E, 0x66, 0x66, 0x3C, 0x00],
  H: [0x66, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00],
  I: [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00],
  J: [0x1E, 0x0C, 0x0C, 0x0C, 0x0C, 0x6C, 0x38, 0x00],
  K: [0x66, 0x6C, 0x78, 0x70, 0x78, 0x6C, 0x66, 0x00],
  L: [0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0x00],
  M: [0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x63, 0x00],
  N: [0x66, 0x76, 0x7E, 0x7E, 0x6E, 0x66, 0x66, 0x00],
  O: [0x3C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00],
  P: [0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60, 0x60, 0x00],
  Q: [0x3C, 0x66, 0x66, 0x66, 0x6A, 0x6C, 0x36, 0x00],
  R: [0x7C, 0x66, 0x66, 0x7C, 0x78, 0x6C, 0x66, 0x00],
  S: [0x3C, 0x66, 0x60, 0x3C, 0x06, 0x66, 0x3C, 0x00],
  T: [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00],
  U: [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00],
  V: [0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00],
  W: [0x63, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x00],
  X: [0x66, 0x66, 0x3C, 0x18, 0x3C, 0x66, 0x66, 0x00],
  Y: [0x66, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x00],
  Z: [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x7E, 0x00],
  ':': [0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x00],
  '-': [0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00],
  '/': [0x06, 0x0C, 0x0C, 0x18, 0x30, 0x30, 0x60, 0x00],
};
const sanitizeLabel = (value: string, fallback: string): string =>
  String(value || fallback)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || fallback.toUpperCase();

const formatHexWord = (value: number): string =>
  `#${Math.max(0, Math.min(0xFFFF, Math.floor(value))).toString(16).toUpperCase().padStart(4, '0')}`;

const formatHexByte = (value: number): string =>
  `#${Math.max(0, Math.min(0xFF, Math.floor(value))).toString(16).toUpperCase().padStart(2, '0')}`;

function validateMsx2Screen4RomConfig(config: Msx2Screen4Config): void {
  if (isMsx2Screen4MegaRomRequested(config) && config.targetFormat !== 'konami') {
    throw new Error(
      `MSX2 SCREEN 4 MegaROM currently supports only Konami 8K fixed-bank0 compatibility; requested ${config.targetFormat}.`
    );
  }
}

function isMsx2Screen4MegaRomRequested(config: Msx2Screen4Config): boolean {
  return config.romMode === 'megarom' || (config.romMode === 'auto' && config.autoMegaROM === true);
}

function usesMsx2Screen4KonamiDataBank(config: Msx2Screen4Config): boolean {
  return isMsx2Screen4MegaRomRequested(config) && config.targetFormat === 'konami';
}

const normalizeColor = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const parseHexColor = (hex: string): { r: number; g: number; b: number } | null => {
  const normalized = normalizeColor(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const colorDistance = (a: string, b: string): number => {
  const ca = parseHexColor(a);
  const cb = parseHexColor(b);
  if (!ca || !cb) return Number.MAX_SAFE_INTEGER;
  const dr = ca.r - cb.r;
  const dg = ca.g - cb.g;
  const db = ca.b - cb.b;
  return dr * dr + dg * dg + db * db;
};

function resolveScreen4Palette(analysis: ProjectAnalysis): Screen4PaletteSlot[] {
  const assets = (analysis as any).assets as Array<{ type?: string; data?: unknown }> | undefined;
  const paletteAsset = assets?.find(asset => asset?.type === 'palette')?.data as PaletteAsset | undefined;
  if ((paletteAsset?.mode === 'SCREEN4' || paletteAsset?.mode === 'SCREEN5') && paletteAsset.slots?.length === 16) {
    return paletteAsset.slots.map(slot => ({ ...slot }));
  }


  const tileScreenPalette = collectReferencedTileScreens(analysis).find(screen => screen.palette?.length === 16)?.palette;
  if (tileScreenPalette?.length === 16) {
    return tileScreenPalette.map(slot => ({ ...slot }));
  }

  const tilePalette = (analysis.tiles || []).find(tile => tile.screen5Palette?.length === 16)?.screen5Palette;
  if (tilePalette?.length === 16) {
    return tilePalette.map(slot => ({ ...slot }));
  }

  return DEFAULT_SCREEN4_CUSTOM_PALETTE.map(slot => ({ ...slot }));
}

function paletteIndexForColor(color: string | undefined, slots: Screen4PaletteSlot[]): number {
  const normalized = normalizeColor(color);
  if (!normalized || normalized === TRANSPARENT_HEX) return 0;

  const exactIndex = slots.findIndex(slot => normalizeColor(slot.hex) === normalized);
  if (exactIndex >= 0) return exactIndex & 0x0f;

  let bestIndex = 0;
  let bestDistance = Number.MAX_SAFE_INTEGER;
  for (let i = 1; i < slots.length; i++) {
    const distance = colorDistance(normalized, slots[i].hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex & 0x0f;
}

function getMsx2TilePixelWidth(tile: any | undefined): number {
  const numeric = Number(tile?.width ?? tile?.pixels?.[0]?.length ?? 16);
  if (!Number.isFinite(numeric)) return 16;
  return Math.max(8, Math.min(32, Math.round(numeric / 8) * 8));
}

function getMsx2TilePixelHeight(tile: any | undefined): number {
  const numeric = Number(tile?.height ?? tile?.pixels?.length ?? 16);
  if (!Number.isFinite(numeric)) return 16;
  return Math.max(8, Math.min(32, Math.round(numeric / 8) * 8));
}

function hasVariableMsx2TileSize(screen: Msx2Screen4TileScreen | undefined): boolean {
  return (screen?.tiles || []).some(tile => getMsx2TilePixelWidth(tile) !== 16 || getMsx2TilePixelHeight(tile) !== 16);
}

function buildTileScreenLayerBytes(
  screen: Msx2Screen4TileScreen | undefined,
  layerName: 'collision' | 'effects' | 'behavior'
): number[] {
  const fallback = layerName === 'collision' ? screen?.collisionMap : undefined;
  const layer = screen?.layers?.[layerName];
  const bytes: number[] = [];
  for (let y = 0; y < MSX2_TILE_SCREEN_HEIGHT; y++) {
    for (let x = 0; x < MSX2_TILE_SCREEN_WIDTH; x++) {
      bytes.push(Math.max(0, Math.min(255, Number(layer?.[y]?.[x] ?? fallback?.[y]?.[x] ?? 0) || 0)));
    }
  }
  if (layerName === 'effects') {
    for (const entity of screen?.layers?.entities || []) {
      if (!entity?.position) continue;
      const x = clampTileCoordinate(entity.position.x, 15);
      const y = clampTileCoordinate(entity.position.y, MSX2_TILE_SCREEN_HEIGHT - 1);
      const engine = String(entity?.params?.engine || '').replace(/[\s_-]+/g, '').toLowerCase();
      const isBrick = Boolean(entity?.components?.msx2_brick || entity?.params?.brick || engine === 'brick');
      const isCollectible = isBrick || entity.kind === 'collectible' || Boolean(entity?.components?.msx2_collectible) || engine === 'collectible';
      const isDoor = entity.kind === 'door' || Boolean(entity?.components?.msx2_door_exit) || engine === 'door' || engine === 'checkpoint';
      const isHazard = entity.kind === 'hazard' || Boolean(entity?.components?.msx2_hazard) || engine === 'hazard';
      const effect = isCollectible ? 3 : isDoor ? 2 : isHazard ? 1 : 0;
      if (effect) bytes[(y * MSX2_TILE_SCREEN_WIDTH) + x] = effect;
    }
  }
  return bytes;
}

function countTileScreenEffectCode(screen: Msx2Screen4TileScreen | undefined, code: number): number {
  return buildTileScreenLayerBytes(screen, 'effects').filter(value => value === code).length;
}

function getTileScreenRequiredCollectibles(screen: Msx2Screen4TileScreen | undefined): number {
  const configured = Number(screen?.runtime?.requiredCollectibles);
  if (Number.isFinite(configured)) {
    return Math.max(0, Math.min(255, Math.floor(configured)));
  }
  return Math.max(0, Math.min(255, countTileScreenEffectCode(screen, 3)));
}

function getTileScreenInitialAir(screen: Msx2Screen4TileScreen | undefined): number {
  const runtime = screen?.runtime as unknown as Record<string, unknown> | undefined;
  if (runtime?.disableAirTimer === true || runtime?.airTimer === false || runtime?.initialAir === 0) {
    return 0;
  }
  const configured = Number(screen?.runtime?.initialAir);
  if (Number.isFinite(configured)) {
    return Math.max(1, Math.min(255, Math.floor(configured)));
  }
  return 255;
}

function getTileScreenHudStyle(screen: Msx2Screen4TileScreen | undefined): number {
  const runtime = screen?.runtime as unknown as Record<string, unknown> | undefined;
  return runtime?.hudStyle === 'statusBars' || runtime?.hudStyle === 'vampire' ? 1 : 0;
}

function getTileScreenRuntimeByte(
  screen: Msx2Screen4TileScreen | undefined,
  key: string,
  fallback: number,
  min = 0,
  max = 255
): number {
  const runtime = screen?.runtime as unknown as Record<string, unknown> | undefined;
  const configured = Number(runtime?.[key]);
  if (Number.isFinite(configured)) {
    return Math.max(min, Math.min(max, Math.floor(configured)));
  }
  return fallback;
}

const MSX2_HUD_WIDGET_KIND_IDS: Record<string, number> = {
  bar: 1,
  counter: 2,
  icon: 3,
  text: 4,
};

const MSX2_HUD_WIDGET_BINDING_IDS: Record<string, number> = {
  playerEnergy: 1,
  bossEnergy: 2,
  air: 3,
  score: 4,
  lives: 5,
  collectibles: 6,
  custom: 7,
};

function getTileScreenHudWidgets(screen: Msx2Screen4TileScreen | undefined): any[] {
  const widgets = (screen?.runtime as any)?.hudWidgets;
  return Array.isArray(widgets) ? widgets.slice(0, 16) : [];
}

function hudWidgetByte(widget: any, key: string, fallback: number, min = 0, max = 255): number {
  const configured = Number(widget?.[key]);
  if (Number.isFinite(configured)) {
    return Math.max(min, Math.min(max, Math.floor(configured)));
  }
  return fallback;
}

function hudWidgetKindId(widget: any): number {
  return MSX2_HUD_WIDGET_KIND_IDS[String(widget?.kind || '').trim()] || 0;
}

function hudWidgetBindingId(widget: any): number {
  return MSX2_HUD_WIDGET_BINDING_IDS[String(widget?.binding || '').trim()] || 0;
}

function encodeHudAscii(value: unknown, maxLength = 31, trim = false): number[] {
  const rawText = String(value ?? '');
  const text = (trim ? rawText.trim() : rawText).slice(0, maxLength);
  const bytes: number[] = [];
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    bytes.push(code >= 32 && code <= 126 ? code : 32);
  }
  return bytes;
}

function appendHudStringPoolEntry(pool: number[], bytes: number[]): number {
  if (bytes.length <= 0) return 0;
  const offset = pool.length;
  pool.push(...bytes, 0);
  return offset;
}

function buildTilePatternBytes(tile: any | undefined): number[] {
  const tileWidth = getMsx2TilePixelWidth(tile);
  const tileHeight = getMsx2TilePixelHeight(tile);
  const bytesPerRow = tileWidth / 2;
  const bytes: number[] = [];
  for (let y = 0; y < tileHeight; y++) {
    const row = tile?.pixels?.[y] || [];
    for (let byteX = 0; byteX < bytesPerRow; byteX++) {
      const x0 = byteX * 2;
      const hi = Math.max(0, Math.min(15, Number(row[x0]) || 0));
      const lo = Math.max(0, Math.min(15, Number(row[x0 + 1]) || 0));
      bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
    }
  }
  return bytes;
}

function chooseScreen4RowColors(row: number[]): { fg: number; bg: number } {
  const counts = new Map<number, number>();
  row.forEach(value => {
    const slot = Math.max(0, Math.min(15, Number(value) || 0));
    counts.set(slot, (counts.get(slot) || 0) + 1);
  });
  const sorted = Array.from(counts.entries()).sort((a, b) =>
    b[1] - a[1] || a[0] - b[0]
  );
  const bg = sorted[0]?.[0] ?? 0;
  const fg = sorted.find(([slot]) => slot !== bg)?.[0] ?? bg;
  return { fg, bg };
}

function buildScreen4CharacterBytes(tile: any | undefined, subTileX: number, subTileY: number): { pattern: number[]; color: number[] } {
  const pattern: number[] = [];
  const color: number[] = [];
  const pixels = tile?.pixels || [];
  const baseX = subTileX * CELL_SIZE;
  const baseY = subTileY * CELL_SIZE;
  for (let y = 0; y < CELL_SIZE; y++) {
    const row = Array.from({ length: CELL_SIZE }, (_unused, x) =>
      Math.max(0, Math.min(15, Number(pixels[baseY + y]?.[baseX + x]) || 0))
    );
    const { fg, bg } = chooseScreen4RowColors(row);
    let bits = 0;
    for (let x = 0; x < CELL_SIZE; x++) {
      const slot = row[x];
      if (slot !== bg && (slot === fg || fg === bg)) {
        bits |= 0x80 >> x;
      }
    }
    pattern.push(bits);
    color.push(((fg & 0x0f) << 4) | (bg & 0x0f));
  }
  return { pattern, color };
}

function buildScreen4TilePairBytes(tile: any | undefined): { pattern: number[]; color: number[] } {
  const pattern: number[] = [];
  const color: number[] = [];
  const tileWidth = getMsx2TilePixelWidth(tile);
  const tileHeight = getMsx2TilePixelHeight(tile);
  for (let charY = 0; charY < Math.max(1, Math.min(2, tileHeight / CELL_SIZE)); charY++) {
    for (let charX = 0; charX < Math.max(1, Math.min(2, tileWidth / CELL_SIZE)); charX++) {
      const bytes = buildScreen4CharacterBytes(tile, charX, charY);
      pattern.push(...bytes.pattern);
      color.push(...bytes.color);
    }
  }
  while (pattern.length < 32) pattern.push(0);
  while (color.length < 32) color.push(0);
  return { pattern: pattern.slice(0, 32), color: color.slice(0, 32) };
}

function getScreen4TileBytesForEntity(screen: Msx2Screen4TileScreen | undefined, entity: any): { pattern: number[]; color: number[] } | undefined {
  const explicitTileIndex = Number(entity?.components?.msx2_char_render?.tileIndex ?? entity?.params?.tileIndex);
  const entityToken = String(`${entity?.id || ''} ${entity?.name || ''} ${entity?.params?.engine || ''} ${entity?.params?.role || ''}`)
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
  const inferredTileIndex = Number.isFinite(explicitTileIndex)
    ? explicitTileIndex
    : (screen?.tiles || []).findIndex((tile: any) => {
        const tileToken = String(`${tile?.id || ''} ${tile?.name || ''}`).replace(/[\s_-]+/g, '').toLowerCase();
        if (!tileToken) return false;
        if (entityToken.includes('food')) return tileToken.includes('food') || tileToken.includes('apple');
        if (entityToken.includes('snake') || entityToken.includes('head') || entityToken.includes('body')) {
          return tileToken.includes('snakehead') || tileToken.includes('snakebody') || tileToken.includes('snakechar');
        }
        return false;
      });
  const fallbackTileIndex = screen?.map?.[clampTileCoordinate(entity?.position?.y, MSX2_TILE_SCREEN_HEIGHT - 1)]?.[clampTileCoordinate(entity?.position?.x, 15)];
  const tileIndex = Number.isFinite(inferredTileIndex) && inferredTileIndex >= 0 ? inferredTileIndex : Number(fallbackTileIndex);
  const tile = Number.isFinite(tileIndex) ? screen?.tiles?.[Math.max(0, Math.min((screen?.tiles?.length || 1) - 1, tileIndex))] : undefined;
  return buildScreen4TilePairBytes(tile);
}

interface Screen4CharDefinition {
  bank: number;
  charCode: number;
  pattern: number[];
  color: number[];
}

function buildScreen4ScreenData(screen: Msx2Screen4TileScreen | undefined): { names: number[]; charDefs: Screen4CharDefinition[]; patternBanks: number[][]; colorBanks: number[][] } {
  const tiles = screen?.tiles?.length ? screen.tiles : [{ pixels: Array.from({ length: 16 }, () => Array(16).fill(0)) }];
  const map = screen?.map || [];
  const maxTileIndex = Math.max(0, tiles.length - 1);
  const tileBytes = tiles.map(tile => buildScreen4TilePairBytes(tile));
  const bankCharByKey = Array.from({ length: 3 }, () => new Map<string, number>());
  const bankDefs: Screen4CharDefinition[][] = Array.from({ length: 3 }, () => []);
  const names = Array(SCREEN4_NAME_BYTES).fill(0);
  const reserveCharForAllBanks = (charCode: number, pattern: number[], color: number[]): void => {
    if (charCode < 0 || charCode > 255) return;
    for (let bank = 0; bank < 3; bank++) {
      while (bankDefs[bank].length <= charCode) {
        const reservedCode = bankDefs[bank].length;
        const emptyPattern = Array(CELL_SIZE).fill(0);
        const emptyColor = Array(CELL_SIZE).fill(0);
        bankDefs[bank].push({ bank, charCode: reservedCode, pattern: emptyPattern, color: emptyColor });
        bankCharByKey[bank].set(`${emptyPattern.join(',')}|${emptyColor.join(',')}|reserved:${reservedCode}`, reservedCode);
      }
      bankDefs[bank][charCode] = { bank, charCode, pattern, color };
      bankCharByKey[bank].set(`${pattern.join(',')}|${color.join(',')}`, charCode);
    }
  };
  const reserveCharBlockForAllBanks = (baseCharCode: number, pattern: number[], color: number[]): void => {
    if (baseCharCode < 0 || baseCharCode > 252) return;
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      reserveCharForAllBanks(
        baseCharCode + quadrant,
        pattern.slice(quadrant * 8, quadrant * 8 + 8),
        color.slice(quadrant * 8, quadrant * 8 + 8)
      );
    }
  };
  const charForBytes = (bank: number, pattern: number[], color: number[]): number => {
    const key = `${pattern.join(',')}|${color.join(',')}`;
    const existing = bankCharByKey[bank].get(key);
    if (existing !== undefined) return existing;
    const charCode = bankDefs[bank].length;
    if (charCode > 255) {
      throw new Error(`MSX2 SCREEN 4 conversion exceeded 256 unique 8x8 chars in bank ${bank}`);
    }
    bankCharByKey[bank].set(key, charCode);
    bankDefs[bank].push({ bank, charCode, pattern, color });
    return charCode;
  };

  for (let tileY = 0; tileY < MSX2_TILE_SCREEN_HEIGHT; tileY++) {
    const bank = Math.floor(tileY / 4);
    for (let tileX = 0; tileX < MSX2_TILE_SCREEN_WIDTH; tileX++) {
      const tileIndex = Math.max(0, Math.min(maxTileIndex, Number(map[tileY]?.[tileX]) || 0));
      const bytes = tileBytes[tileIndex];
      const charCodes = Array.from({ length: 4 }, (_unused, quadrant) =>
        charForBytes(
          bank,
          bytes.pattern.slice(quadrant * 8, quadrant * 8 + 8),
          bytes.color.slice(quadrant * 8, quadrant * 8 + 8)
        )
      );
      const nameX = tileX * 2;
      const nameY = tileY * 2;
      names[(nameY * SCREEN4_CHAR_COLUMNS) + nameX] = charCodes[0];
      names[(nameY * SCREEN4_CHAR_COLUMNS) + nameX + 1] = charCodes[1];
      names[((nameY + 1) * SCREEN4_CHAR_COLUMNS) + nameX] = charCodes[2];
      names[((nameY + 1) * SCREEN4_CHAR_COLUMNS) + nameX + 1] = charCodes[3];
    }
  }

  const claimedCharBlocks: number[] = [];
  const reserveBaseForCharBlock = (requestedBase: number): number => {
    let base = Math.max(0, Math.min(252, Math.floor(requestedBase)));
    while (claimedCharBlocks.some(existing => existing !== base && Math.abs(existing - base) < 4)) {
      base += 4;
      if (base > 252) base = 1;
      if (claimedCharBlocks.length >= 63) break;
    }
    if (!claimedCharBlocks.includes(base)) claimedCharBlocks.push(base);
    return base;
  };
  for (const entity of screen?.layers?.entities || []) {
    const charCode = Number(entity?.components?.msx2_char_render?.charCode ?? entity?.params?.charCode);
    if (!Number.isFinite(charCode)) continue;
    const bytes = getScreen4TileBytesForEntity(screen, entity);
    if (bytes) reserveCharBlockForAllBanks(reserveBaseForCharBlock(charCode), bytes.pattern, bytes.color);
  }

  const patternBanks = bankDefs.map(defs => defs.flatMap(def => def.pattern));
  const colorBanks = bankDefs.map(defs => defs.flatMap(def => def.color));
  return {
    names,
    charDefs: bankDefs.flat(),
    patternBanks,
    colorBanks,
  };
}

function getCollectibleErasePaletteIndex(screens: Array<Msx2Screen4TileScreen | undefined>): number {
  const counts = new Map<number, number>();
  screens.forEach(screen => {
    const effects = buildTileScreenLayerBytes(screen, 'effects');
    const tiles = screen?.tiles || [];
    effects.forEach((effect, offset) => {
      if (effect !== 3) return;
      const tileX = offset % MSX2_TILE_SCREEN_WIDTH;
      const tileY = Math.floor(offset / MSX2_TILE_SCREEN_WIDTH);
      const tileIndex = Number(screen?.map?.[tileY]?.[tileX]);
      const tile = Number.isFinite(tileIndex) ? tiles[tileIndex] : undefined;
      const pixels = tile?.pixels || (tile as any)?.data || [];
      for (let y = 0; y < Math.min(16, pixels.length); y++) {
        const row = pixels[y] || [];
        for (let x = 0; x < Math.min(16, row.length); x++) {
          const value = Number(row[x]);
          if (!Number.isFinite(value) || value < 0 || value > 15) continue;
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }
    });
  });

  let best = 0;
  let bestCount = -1;
  counts.forEach((count, value) => {
    if (count > bestCount || (count === bestCount && value < best)) {
      best = value;
      bestCount = count;
    }
  });
  return Math.max(0, Math.min(15, best));
}

function buildTileScreenTileBlocks(label: string, screen: Msx2Screen4TileScreen | undefined): string {
  const data = buildScreen4ScreenData(screen);
  const blocks = [formatBytes(`${label}_NAMES`, data.names, `${screen?.name || label} SCREEN 4 name table, 32x24 chars`)];
  data.patternBanks.forEach((patterns, bank) => {
    if (!patterns.length) return;
    blocks.push(formatBytes(`${label}_BANK_${bank}_PATTERNS`, patterns, `${screen?.name || label} SCREEN 4 bank ${bank} compact patterns`));
    blocks.push(formatBytes(`${label}_BANK_${bank}_COLORS`, data.colorBanks[bank], `${screen?.name || label} SCREEN 4 bank ${bank} compact colors`));
  });
  return blocks.join('\n');
}

function buildTileScreenLoadRoutine(
  label: string,
  screen: Msx2Screen4TileScreen | undefined,
  screenIndex: number | undefined,
  loadRuntimeLayerPointers: (label: string, screenIndex?: number) => string,
  afterPatternLoad = '',
  afterNameLoad = '',
  useKonamiDataBank = false
): string {
  const data = buildScreen4ScreenData(screen);
  const bankLoads = data.patternBanks.map((patterns, bank) => {
    if (!patterns.length) return '';
    const charOffset = bank * 0x0800;
    const byteCount = patterns.length;
    return `    ld hl, ${label}_BANK_${bank}_PATTERNS
    ld de, #${charOffset.toString(16).toUpperCase().padStart(4, '0')}
    ld bc, ${byteCount}
    call LDIRVM
    ld hl, ${label}_BANK_${bank}_COLORS
    ld de, #${(0x2000 + charOffset).toString(16).toUpperCase().padStart(4, '0')}
    ld bc, ${byteCount}
    call LDIRVM`;
  }).filter(Boolean).join('\n');
  const enterDataBank = useKonamiDataBank ? '    call msx2_screen4_data_bank_enter\n' : '';
  const leaveDataBank = useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : '';
  return `load_${label}_screen4:
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_PATTERN_VRAM
    ld bc, SCREEN4_PATTERN_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_COLOR_VRAM
    ld bc, SCREEN4_COLOR_SIZE
    call FILVRM
${enterDataBank}
${bankLoads}
${afterPatternLoad}
    ld hl, ${label}_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
${leaveDataBank}
${afterNameLoad}${loadRuntimeLayerPointers(label, screenIndex)}    call apply_${label}_collected_visuals
    ret
`;
}

function buildTileScreenCollectedVisualsRoutine(
  label: string,
  screen: Msx2Screen4TileScreen | undefined,
  screenIndex: number,
  effectRuntimeBase: number
): string {
  const effects = buildTileScreenLayerBytes(screen, 'effects');
  const collectibleCells: string[] = [];
  effects.forEach((value, offset) => {
    if (value !== 3) return;
    const tileX = offset % MSX2_TILE_SCREEN_WIDTH;
    const tileY = Math.floor(offset / MSX2_TILE_SCREEN_WIDTH);
    const nameAddress = 0x1800 + (tileY * 2 * SCREEN4_CHAR_COLUMNS) + (tileX * 2);
    const runtimeAddress = effectRuntimeBase + (screenIndex * MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT) + offset;
    const keepLabel = `keep_${label}_collectible_${collectibleCells.length}`;
    collectibleCells.push(`    ld hl, #${runtimeAddress.toString(16).toUpperCase().padStart(4, '0')}
    ld a, (hl)
    cp 3
    jp z, ${keepLabel}
    ld hl, #${nameAddress.toString(16).toUpperCase().padStart(4, '0')}
    call clear_screen4_name_cell_16
${keepLabel}:`);
  });

  return `apply_${label}_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
${collectibleCells.length ? collectibleCells.join('\n') : '    ; No collectible cells on this screen.'}
    ret
`;
}

function buildInitEffectBuffersRoutine(tileScreenLoadLabels: string[], effectRuntimeBase: number): string {
  const layerSize = MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT;
  const copies = tileScreenLoadLabels.map((label, index) => {
    const destination = effectRuntimeBase + (index * layerSize);
    return `    ld hl, ${label}_EFFECTS
    ld de, #${destination.toString(16).toUpperCase().padStart(4, '0')}
    ld bc, msx2_layer_size
    ldir`;
  });

  return `init_msx2_effect_buffers:
    ; Restores each msx2screen mutable effect layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
${copies.length ? copies.join('\n') : '    ; No native MSX2 tile screens.'}
    ret
`;
}

function estimateMsx2RuntimeRamEnd(tileScreenCount: number): number {
  const layerSize = MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT;
  const effectRuntimeBase = MSX2_EFFECT_RUNTIME_BASE;
  const effectRuntimeSize = Math.max(1, tileScreenCount) * layerSize;
  const effectScratchBase = Math.max(0xC200, (effectRuntimeBase + effectRuntimeSize + 0x0f) & 0xfff0);
  const enemyRuntimeBase = (effectScratchBase + layerSize + 0x0f) & 0xfff0;
  return enemyRuntimeBase + MSX2_ENEMY_RUNTIME_BYTES;
}

function maxPersistentMsx2ScreenCount(): number {
  let count = 0;
  while (estimateMsx2RuntimeRamEnd(count + 1) <= MSX2_RUNTIME_RAM_LIMIT) {
    count++;
  }
  return count;
}

function buildMsx2RamBudget(tileScreens: Msx2Screen4TileScreen[], runtimeRamEnd: number): Record<string, unknown> {
  const layerSize = MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT;
  const screenCount = Math.max(1, tileScreens.length);
  const effectRuntimeSize = screenCount * layerSize;
  const effectRuntimeBase = MSX2_EFFECT_RUNTIME_BASE;
  const effectRuntimeEnd = effectRuntimeBase + effectRuntimeSize;
  const effectScratchBase = Math.max(0xC200, (effectRuntimeEnd + 0x0f) & 0xfff0);
  const enemyRuntimeBase = (effectScratchBase + layerSize + 0x0f) & 0xfff0;
  const enemyRuntimeEnd = enemyRuntimeBase + MSX2_ENEMY_RUNTIME_BYTES;
  const gameFlowGlobalsBytes = Math.max(0, runtimeRamEnd - enemyRuntimeEnd);
  const usedBytes = Math.max(0, runtimeRamEnd - MSX2_RUNTIME_RAM_START);
  const usableBytes = Math.max(0, MSX2_RUNTIME_RAM_LIMIT - MSX2_RUNTIME_RAM_START);
  const freeBytes = Math.max(0, MSX2_RUNTIME_RAM_LIMIT - runtimeRamEnd);
  const warningThresholdBytes = Math.floor(usableBytes * 0.85);
  const maxPersistentScreens = maxPersistentMsx2ScreenCount();
  const sections = [
    {
      id: 'runtime.globals_player_input',
      start: formatHexWord(MSX2_RUNTIME_RAM_START),
      end: formatHexWord(MSX2_SNAKE_BODY_BASE),
      bytes: Math.max(0, MSX2_SNAKE_BODY_BASE - MSX2_RUNTIME_RAM_START),
      mutable: true,
      reason: 'Fixed hot runtime state for player/input/global counters.',
    },
    {
      id: 'runtime.snake_body_cache',
      start: formatHexWord(MSX2_SNAKE_BODY_BASE),
      end: formatHexWord(MSX2_EFFECT_RUNTIME_BASE),
      bytes: Math.max(0, MSX2_EFFECT_RUNTIME_BASE - MSX2_SNAKE_BODY_BASE),
      mutable: true,
      reason: 'Fixed-size cache reserved only for snake-char body state.',
    },
    {
      id: 'runtime.persistent_effect_layers',
      start: formatHexWord(effectRuntimeBase),
      end: formatHexWord(effectRuntimeEnd),
      bytes: effectRuntimeSize,
      mutable: true,
      count: screenCount,
      bytesPerScreen: layerSize,
      reason: 'One mutable effects layer per reachable SCREEN 4 room.',
    },
    {
      id: 'runtime.effects_scratch',
      start: formatHexWord(effectScratchBase),
      end: formatHexWord(effectScratchBase + layerSize),
      bytes: layerSize,
      mutable: true,
      reason: 'Temporary effect layer buffer for screens without persistent slot or loaders.',
    },
    {
      id: 'runtime.enemy_pool',
      start: formatHexWord(enemyRuntimeBase),
      end: formatHexWord(enemyRuntimeEnd),
      bytes: MSX2_ENEMY_RUNTIME_BYTES,
      mutable: true,
      slots: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN,
      reason: 'Active enemy/hazard runtime arrays; ROM keeps enemy templates.',
    },
  ];
  if (gameFlowGlobalsBytes > 0) {
    sections.push({
      id: 'runtime.gameflow_globals',
      start: formatHexWord(enemyRuntimeEnd),
      end: formatHexWord(runtimeRamEnd),
      bytes: gameFlowGlobalsBytes,
      mutable: true,
      reason: 'MSX2 SCREEN 4 GameFlow Globals/IfThenElse variables.',
    });
  }
  const recommendations: Array<Record<string, unknown>> = [];
  if (runtimeRamEnd > MSX2_RUNTIME_RAM_LIMIT) {
    recommendations.push({
      severity: 'error',
      target: 'runtimeRam',
      reason: `Estimated runtime RAM ends at ${formatHexWord(runtimeRamEnd)}, past ${formatHexWord(MSX2_RUNTIME_RAM_LIMIT)}.`,
      action: 'Reduce persistent per-screen RAM, lower runtime entity pools, or move cold state back to ROM-backed data.',
    });
  } else if (usedBytes >= warningThresholdBytes) {
    recommendations.push({
      severity: 'warning',
      target: 'runtimeRam',
      reason: `Estimated runtime RAM uses ${usedBytes}/${usableBytes} bytes.`,
      action: 'Audit mutable RAM sections before adding more gameplay features.',
    });
  } else {
    recommendations.push({
      severity: 'ok',
      target: 'runtimeRam',
      reason: 'Estimated runtime RAM fits below warning threshold.',
      action: 'No RAM recovery needed for this project slice.',
    });
  }
  if (tileScreens.length > maxPersistentScreens) {
    recommendations.push({
      severity: 'plan_b',
      target: 'runtime.persistent_effect_layers',
      reason: `Reachable screens (${tileScreens.length}) exceed persistent effect capacity (${maxPersistentScreens}).`,
      action: 'Use a small effects cache instead of one persistent mutable layer per room.',
    });
  }
  return {
    scope: 'msx2_screen4_ram_budget',
    start: formatHexWord(MSX2_RUNTIME_RAM_START),
    end: formatHexWord(runtimeRamEnd),
    limit: formatHexWord(MSX2_RUNTIME_RAM_LIMIT),
    usableBytes,
    usedBytes,
    freeBytes,
    warningThresholdBytes,
    maxPersistentScreens,
    reachableScreens: tileScreens.length,
    status: runtimeRamEnd > MSX2_RUNTIME_RAM_LIMIT ? 'error' : usedBytes >= warningThresholdBytes ? 'warning' : 'ok',
    sections,
    recommendations,
    note: 'RAM budget reports mutable runtime state only. ROM and VRAM storage are reported separately.',
  };
}

function buildPaletteBytes(slots: Screen4PaletteSlot[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const slot = slots[i];
    if (!slot || slot.masterIndex < 0) {
      bytes.push(0, 0);
      continue;
    }
    const r = (slot.masterIndex >> 6) & 0x07;
    const g = (slot.masterIndex >> 3) & 0x07;
    const b = slot.masterIndex & 0x07;
    bytes.push((r << 4) | b, g);
  }
  return bytes;
}

function formatBytes(label: string, bytes: number[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatWords(label: string, words: number[], comment?: string): string {
  const bytes = words.flatMap(word => {
    const clamped = Math.max(0, Math.min(0xffff, Math.trunc(word || 0)));
    return [clamped & 0xff, (clamped >> 8) & 0xff];
  });
  return formatBytes(label, bytes, comment);
}

function getMsx2HudFontAsset(analysis: ProjectAnalysis): any | undefined {
  const assets = (analysis as any).assets as Array<{ type?: string; data?: unknown }> | undefined;
  return assets?.find(asset => asset?.type === 'msx2hudfont')?.data;
}

function getMsx2HudFontCharacters(analysis: ProjectAnalysis): string {
  const asset = getMsx2HudFontAsset(analysis);
  const characters = String(asset?.characters || '');
  return characters.length ? characters.slice(0, 96) : MSX2_HUD_FONT_CHARS;
}

function getMsx2HudFontBaseChar(analysis: ProjectAnalysis): number {
  const asset = getMsx2HudFontAsset(analysis);
  const baseChar = Math.trunc(Number(asset?.baseChar ?? MSX2_HUD_FONT_BASE_CHAR));
  return Math.max(0, Math.min(255, Number.isFinite(baseChar) ? baseChar : MSX2_HUD_FONT_BASE_CHAR));
}

function isMsx2HudFontContiguousAscii(analysis: ProjectAnalysis): boolean {
  const characters = getMsx2HudFontCharacters(analysis);
  return characters.length > 0 && Array.from(characters).every((char, index) =>
    char.charCodeAt(0) === MSX2_ZX_FONT_ASCII_FIRST + index
  );
}

function buildMsx2HudFontPatternBytes(analysis: ProjectAnalysis): number[] {
  const asset = getMsx2HudFontAsset(analysis);
  const characters = getMsx2HudFontCharacters(analysis);
  return Array.from(characters).flatMap(char => {
    const pattern = asset?.patterns?.[char] || MSX2_HUD_FONT_GLYPHS[char] || MSX2_HUD_FONT_GLYPHS[' '];
    return Array.from({ length: 8 }, (_unused, index) => Math.max(0, Math.min(255, Number(pattern[index]) || 0)));
  });
}

function buildMsx2HudFontColorBytes(analysis: ProjectAnalysis): number[] {
  const asset = getMsx2HudFontAsset(analysis);
  const colorByte = Math.max(0, Math.min(255, Number(asset?.colorByte ?? 0xF1) || 0xF1));
  return Array.from({ length: getMsx2HudFontCharacters(analysis).length * 8 }, () => colorByte);
}

function normalizeMsx2HudText(value: string, maxLength = 31, allowedCharacters = MSX2_HUD_FONT_CHARS): string {
  const allowed = new Set(Array.from(allowedCharacters));
  return Array.from(String(value || '').toUpperCase())
    .map(char => allowed.has(char) ? char : ' ')
    .join('')
    .slice(0, Math.max(0, maxLength));
}

function getMsx2HudCounterText(widget: any): string {
  const maxValue = Number(widget?.maxValue);
  const initialValue = Number(widget?.initialValue);
  const maxDigits = Number.isFinite(maxValue) ? Math.max(1, Math.min(6, String(Math.max(0, Math.floor(maxValue))).length)) : 3;
  const value = Number.isFinite(initialValue) ? Math.max(0, Math.floor(initialValue)) : 0;
  return String(value).padStart(maxDigits, '0').slice(-maxDigits);
}

function getMsx2HudWidgetText(widget: any, allowedCharacters = MSX2_HUD_FONT_CHARS): string {
  const kind = String(widget?.kind || '').trim();
  if (kind === 'text') return normalizeMsx2HudText(String(widget?.text || widget?.name || ''), Math.max(1, Math.ceil((Number(widget?.width) || 64) / 8)), allowedCharacters);
  if (kind === 'counter') return normalizeMsx2HudText(getMsx2HudCounterText(widget), 31, allowedCharacters);
  return '';
}

function buildMsx2HudTextRoutines(label: string, screen: Msx2Screen4TileScreen | undefined, analysis: ProjectAnalysis): string {
  const allowedCharacters = getMsx2HudFontCharacters(analysis);
  const widgets = getTileScreenHudWidgets(screen).filter(widget => ['text', 'counter'].includes(String(widget?.kind || '').trim()));
  const drawable = widgets
    .map((widget, index) => {
      const text = getMsx2HudWidgetText(widget, allowedCharacters);
      if (!text) return null;
      const column = Math.max(0, Math.min(31, Math.floor((Number(widget?.x) || 0) / 8)));
      const row = Math.max(0, Math.min(23, Math.floor((Number(widget?.y) || 0) / 8)));
      const maxChars = Math.max(1, Math.min(32 - column, Math.ceil((Number(widget?.width) || (text.length * 8)) / 8)));
      return {
        index,
        text: text.slice(0, maxChars),
        vram: 0x1800 + (row * SCREEN4_CHAR_COLUMNS) + column,
      };
    })
    .filter((entry): entry is { index: number; text: string; vram: number } => Boolean(entry));

  const body = drawable.length
    ? drawable.map(entry => `    ld hl, #${entry.vram.toString(16).toUpperCase().padStart(4, '0')}
    ld de, ${label}_HUD_TEXT_${entry.index}
    call draw_msx2_hud_string`).join('\n')
    : '    ret';
  const strings = drawable.map(entry =>
    formatBytes(`${label}_HUD_TEXT_${entry.index}`, [...Array.from(entry.text).map(char => char.charCodeAt(0) & 0xff), 0], `${screen?.name || label} HUD text "${entry.text}"`)
  ).join('');

  return `draw_${label}_hud_text:
${body}
    ret

${strings}`;
}

function buildMsx2SubMenuTextData(label: string, node: any, analysis: ProjectAnalysis): string {
  const allowedCharacters = getMsx2HudFontCharacters(analysis);
  const title = normalizeMsx2HudText(String(node?.title || 'MENU'), 20, allowedCharacters);
  const options = (Array.isArray(node?.options) ? node.options : [])
    .slice(0, 6)
    .map((option: any) => normalizeMsx2HudText(String(option?.text || ''), 18, allowedCharacters));
  const rows = [title, ...options].map((text, index) =>
    formatBytes(`${label}_TEXT_${index}`, [...Array.from(text).map(char => String(char).charCodeAt(0) & 0xff), 0], `MSX2 SCREEN 4 SubMenu text "${text}"`)
  );
  const optionDraws = options.map((_option, index) => {
    const vram = 0x19E7 + (index * SCREEN4_CHAR_COLUMNS);
    return `    ld hl, #${vram.toString(16).toUpperCase().padStart(4, '0')}
    ld de, ${label}_TEXT_${index + 1}
    call draw_msx2_hud_string`;
  }).join('\n');
  return `draw_${label}:
    ld hl, #19A6
    ld de, ${label}_TEXT_0
    call draw_msx2_hud_string
${optionDraws || '    ; No submenu options to draw'}
    ret

${rows.join('')}`;
}

function wrapMsx2Screen4Text(value: unknown, maxChars = 24, maxLines = 5): string[] {
  const words = String(value ?? '').replace(/\r/g, '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word.length > maxChars ? word.slice(0, maxChars) : word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

function buildMsx2TextNodeData(label: string, node: any, analysis: ProjectAnalysis): string {
  const allowedCharacters = getMsx2HudFontCharacters(analysis);
  const title = normalizeMsx2HudText(String(node?.title || 'TEXT'), 22, allowedCharacters);
  const messageLines = wrapMsx2Screen4Text(node?.message || '', 24, 5)
    .map(line => normalizeMsx2HudText(line, 24, allowedCharacters));
  const prompt = node?.waitForKey === false ? '' : normalizeMsx2HudText('PRESS KEY', 12, allowedCharacters);
  const rows = [title, ...messageLines, ...(prompt ? [prompt] : [])].map((text, index) =>
    formatBytes(`${label}_TEXT_${index}`, [...Array.from(text).map(char => String(char).charCodeAt(0) & 0xff), 0], `MSX2 SCREEN 4 Text node text "${text}"`)
  );
  const messageDraws = messageLines.map((_line, index) => {
    const vram = 0x1984 + (index * SCREEN4_CHAR_COLUMNS);
    return `    ld hl, #${vram.toString(16).toUpperCase().padStart(4, '0')}
    ld de, ${label}_TEXT_${index + 1}
    call draw_msx2_hud_string`;
  }).join('\n');
  const promptDraw = prompt
    ? `    ld hl, #1AEE
    ld de, ${label}_TEXT_${messageLines.length + 1}
    call draw_msx2_hud_string`
    : '';
  return `draw_${label}:
    ld hl, #1945
    ld de, ${label}_TEXT_0
    call draw_msx2_hud_string
${messageDraws || '    ; No message lines to draw'}
${promptDraw}
    ret

${rows.join('')}`;
}

function buildMsx2TextScrollNodeData(label: string, node: any, analysis: ProjectAnalysis): string {
  const allowedCharacters = getMsx2HudFontCharacters(analysis);
  const title = normalizeMsx2HudText(String(node?.title || 'TEXT SCROLL'), 22, allowedCharacters);
  const textLines = wrapMsx2Screen4Text(node?.text || '', 26, 8)
    .map(line => normalizeMsx2HudText(line, 26, allowedCharacters));
  const prompt = node?.waitForKey === false ? '' : normalizeMsx2HudText('PRESS KEY', 12, allowedCharacters);
  const rows = [title, ...textLines, ...(prompt ? [prompt] : [])].map((text, index) =>
    formatBytes(`${label}_TEXT_${index}`, [...Array.from(text).map(char => String(char).charCodeAt(0) & 0xff), 0], `MSX2 SCREEN 4 TextScroll panel text "${text}"`)
  );
  const textDraws = textLines.map((_line, index) => {
    const vram = 0x1943 + ((index + 1) * SCREEN4_CHAR_COLUMNS);
    return `    ld hl, #${vram.toString(16).toUpperCase().padStart(4, '0')}
    ld de, ${label}_TEXT_${index + 1}
    call draw_msx2_hud_string`;
  }).join('\n');
  const promptDraw = prompt
    ? `    ld hl, #1AEF
    ld de, ${label}_TEXT_${textLines.length + 1}
    call draw_msx2_hud_string`
    : '';
  return `draw_${label}:
    ld hl, #1905
    ld de, ${label}_TEXT_0
    call draw_msx2_hud_string
${textDraws || '    ; No TextScroll lines to draw'}
${promptDraw}
    ret

${rows.join('')}`;
}

function getMsx2Screen4ColorNibble(value: unknown, fallback: number): number {
  return Math.max(0, Math.min(15, Math.trunc(Number(value) || fallback)));
}

function buildMsx2TextScrollColorNodeData(label: string, node: any, analysis: ProjectAnalysis): string {
  const allowedCharacters = getMsx2HudFontCharacters(analysis);
  const title = normalizeMsx2HudText(String(node?.title || 'TEXT SCROLL COLOR'), 22, allowedCharacters);
  const textLines = wrapMsx2Screen4Text(node?.text || '', 26, 8)
    .map(line => normalizeMsx2HudText(line, 26, allowedCharacters));
  const prompt = node?.waitForKey === false ? '' : normalizeMsx2HudText('PRESS KEY', 12, allowedCharacters);
  const rows = [title, ...textLines, ...(prompt ? [prompt] : [])].map((text, index) =>
    formatBytes(`${label}_TEXT_${index}`, [...Array.from(text).map(char => String(char).charCodeAt(0) & 0xff), 0], `MSX2 SCREEN 4 TextScrollColor panel text "${text}"`)
  );
  const textDraws = textLines.map((_line, index) => {
    const vram = 0x1943 + ((index + 1) * SCREEN4_CHAR_COLUMNS);
    return `    ld hl, #${vram.toString(16).toUpperCase().padStart(4, '0')}
    ld de, ${label}_TEXT_${index + 1}
    call draw_msx2_hud_string`;
  }).join('\n');
  const promptDraw = prompt
    ? `    ld hl, #1AEF
    ld de, ${label}_TEXT_${textLines.length + 1}
    call draw_msx2_hud_string`
    : '';
  return `draw_${label}:
    ld hl, #1905
    ld de, ${label}_TEXT_0
    call draw_msx2_hud_string
${textDraws || '    ; No TextScrollColor lines to draw'}
${promptDraw}
    ret

${rows.join('')}`;
}

function buildMsx2ControlsTextData(label: string, node: any, analysis: ProjectAnalysis): string {
  const allowedCharacters = getMsx2HudFontCharacters(analysis);
  const keyForButton = (button: unknown): string =>
    String(button || '').toLowerCase() === 'button2'
      ? String(node?.keyboardButton2 || 'N').toUpperCase()
      : String(node?.keyboardButton1 || 'SPC').toUpperCase();
  const title = normalizeMsx2HudText(String(node?.title || 'CONTROLS'), 22, allowedCharacters);
  const button1 = normalizeMsx2HudText(`B1 KEY: ${String(node?.keyboardButton1 || 'SPC').toUpperCase()}`, 24, allowedCharacters);
  const button2 = normalizeMsx2HudText(`B2 KEY: ${String(node?.keyboardButton2 || 'N').toUpperCase()}`, 24, allowedCharacters);
  const jumpLabel = normalizeMsx2HudText(String(node?.jumpActionLabel || 'JUMP'), 10, allowedCharacters);
  const actionLabel = normalizeMsx2HudText(String(node?.actionLabel || 'FIRE'), 10, allowedCharacters);
  const action1 = normalizeMsx2HudText(`${jumpLabel}: ${keyForButton(node?.jumpActionButton || 'button1')}`, 24, allowedCharacters);
  const action2 = normalizeMsx2HudText(`${actionLabel}: ${keyForButton(node?.actionButton || 'button2')}`, 24, allowedCharacters);
  const prompt = node?.waitForKey === false ? '' : normalizeMsx2HudText('PRESS KEY', 12, allowedCharacters);
  const rows = [title, button1, button2, action1, action2, ...(prompt ? [prompt] : [])].map((text, index) =>
    formatBytes(`${label}_TEXT_${index}`, [...Array.from(text).map(char => String(char).charCodeAt(0) & 0xff), 0], `MSX2 SCREEN 4 Controls text "${text}"`)
  );
  const drawRows = rows.map((_row, index) => {
    const vram = (index === 0 ? 0x1945 : 0x1984 + ((index - 1) * SCREEN4_CHAR_COLUMNS));
    return `    ld hl, #${vram.toString(16).toUpperCase().padStart(4, '0')}
    ld de, ${label}_TEXT_${index}
    call draw_msx2_hud_string`;
  }).join('\n');
  return `draw_${label}:
${drawRows}
    ret

${rows.join('')}`;
}

function getMsx2ControlsKeyButton1Mode(node: any): 0 | 1 {
  return String(node?.keyboardButton1 || node?.button1Key || 'SPC').toUpperCase() === 'CTRL' ? 1 : 0;
}

function getMsx2ControlsKeyButton2Mode(node: any): 0 | 1 {
  return String(node?.keyboardButton2 || node?.button2Key || 'N').toUpperCase() === 'CTRL' ? 1 : 0;
}

function getMsx2ControlsActionButtonMode(value: any, fallback: 'button1' | 'button2'): 0 | 1 {
  const normalized = String(value || fallback).trim().toLowerCase();
  return normalized === 'button2' || normalized === 'btn2' || normalized === 'b2' || normalized === '2' ? 1 : 0;
}

function getEntityRenderSpriteId(entity: any): string {
  return String(
    entity?.components?.msx2_hardware_sprite?.msx2SpriteAssetId
      ?? entity?.components?.msx2_render?.msx2SpriteAssetId
      ?? entity?.components?.msx2_render?.spriteAssetId
      ?? entity?.spriteAssetId
      ?? ''
  ).trim();
}

function resolveMsx2SpriteById(analysis: ProjectAnalysis, spriteAssetId: string | undefined): Msx2Sprite | undefined {
  if (!spriteAssetId) return undefined;
  return analysis.msx2Sprites?.find(candidate => candidate.id === spriteAssetId || candidate.name === spriteAssetId);
}

function collectReferencedMsx2SpriteIds(analysis: ProjectAnalysis): Set<string> {
  const spriteIds = new Set<string>();
  for (const screen of collectReferencedTileScreens(analysis)) {
    for (const entity of screen.layers?.entities || []) {
      const spriteAssetId = getEntityRenderSpriteId(entity);
      if (spriteAssetId) spriteIds.add(spriteAssetId);
    }
  }
  return spriteIds;
}

function getFirstReferencedMsx2Sprite(analysis: ProjectAnalysis): Msx2Sprite | undefined {
  const referencedIds = collectReferencedMsx2SpriteIds(analysis);
  for (const spriteId of referencedIds) {
    const sprite = resolveMsx2SpriteById(analysis, spriteId);
    if (sprite) return sprite;
  }
  return analysis.msx2Sprites?.[0];
}

function normalizeEntityMovementMode(entity: any): string {
  return String(
    entity?.components?.msx2_movement?.mode
      ?? entity?.params?.movement
      ?? entity?.params?.movementMode
      ?? entity?.params?.engine
      ?? ''
  ).replace(/[\s_-]+/g, '').toLowerCase();
}

function isBallBounceEntity(entity: any): boolean {
  const mode = normalizeEntityMovementMode(entity);
  return mode === 'ballbounce'
    || mode === 'ball'
    || mode === 'pongball'
    || mode === 'arkanoidball';
}

function getHardwareSpriteSource(analysis: ProjectAnalysis): Msx2Sprite | undefined {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const entity = screen?.layers?.entities?.find(candidate => candidate.kind === 'player')
    || screen?.layers?.entities?.[0];
  const spriteAssetId = getEntityRenderSpriteId(entity);
  if (spriteAssetId) {
    const sprite = resolveMsx2SpriteById(analysis, spriteAssetId);
    if (sprite) return sprite;
  }
  return getFirstReferencedMsx2Sprite(analysis);
}

function getEnemyHardwareSpriteSource(analysis: ProjectAnalysis): Msx2Sprite | undefined {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const entity = screen?.layers?.entities?.find(candidate =>
    (candidate.kind === 'enemy' || candidate.kind === 'hazard') &&
    getEntityRenderSpriteId(candidate)
  );
  const spriteAssetId = getEntityRenderSpriteId(entity);
  if (!spriteAssetId) return undefined;
  return resolveMsx2SpriteById(analysis, spriteAssetId);
}

function getPongBallHardwareSpriteSource(analysis: ProjectAnalysis): Msx2Sprite | undefined {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const entity = screen?.layers?.entities?.find(candidate =>
    (candidate.components?.msx2_ball || isBallBounceEntity(candidate)) &&
    getEntityRenderSpriteId(candidate)
  );
  const spriteAssetId = getEntityRenderSpriteId(entity);
  if (!spriteAssetId) return undefined;
  return resolveMsx2SpriteById(analysis, spriteAssetId);
}

function getHardwareSpriteSettings(sprite: Msx2Sprite): { x: number; y: number; color: number; patternIndex: number } {
  const hardware = sprite.hardware;
  return {
    x: Number.isFinite(Number(hardware?.x)) ? Number(hardware?.x) : 56,
    y: Number.isFinite(Number(hardware?.y)) ? Number(hardware?.y) : 120,
    color: Number.isFinite(Number(hardware?.color)) ? Number(hardware?.color) : 5,
    patternIndex: Number.isFinite(Number(hardware?.patternIndex)) ? Number(hardware?.patternIndex) : 0,
  };
}

function clampTileCoordinate(value: unknown, max: number): number {
  return Math.max(0, Math.min(max, Number(value) || 0));
}

function getPrimaryRuntimeTileScreen(analysis: ProjectAnalysis): Msx2Screen4TileScreen | undefined {
  return collectReferencedTileScreens(analysis)[0] || analysis.msx2Screens?.[0];
}

function getPlayerStartFromTileScreen(screen: Msx2Screen4TileScreen | undefined): { x: number; y: number } | undefined {
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player')
    || screen?.layers?.entities?.[0];
  if (!player?.position) return undefined;
  return {
    x: clampHardwareSpriteX(clampTileCoordinate(player.position.x, 15) * 16),
    y: clampHardwareSpriteY(clampTileCoordinate(player.position.y, MSX2_TILE_SCREEN_HEIGHT - 1) * 16),
  };
}

function getHardwareSpriteRuntimeSettings(
  analysis: ProjectAnalysis,
  sprite: Msx2Sprite
): { x: number; y: number; color: number; patternIndex: number } {
  const settings = getHardwareSpriteSettings(sprite);
  const start = getPlayerStartFromTileScreen(getPrimaryRuntimeTileScreen(analysis));
  return {
    ...settings,
    x: start?.x ?? settings.x,
    y: start?.y ?? settings.y,
  };
}

function getRuntimePatrolBounds(analysis: ProjectAnalysis): { minX: number; maxX: number } {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = screen?.runtime;
  const minTileX = clampTileCoordinate(runtime?.activeAreaX, 15);
  const widthTiles = Math.max(1, Math.min(16 - minTileX, Number(runtime?.activeAreaWidth) || 16));
  const minX = Math.max(1, minTileX * 16);
  const maxX = Math.max(minX + 1, Math.min(239, (minTileX + widthTiles) * 16 - 16));
  return { minX, maxX };
}

function getPaddleCollisionSettings(analysis: ProjectAnalysis): { width: number; triggerY: number; bottomY: number; missY: number } {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const width = Math.max(8, Math.min(64, Math.floor(Number(
    player?.components?.msx2_collision?.hitboxW ?? player?.params?.hitboxW ?? 32
  ) || 32)));
  const playerTileY = clampTileCoordinate(player?.position?.y ?? 10, MSX2_TILE_SCREEN_HEIGHT - 1);
  const playerY = Math.max(0, Math.min(176, Math.floor(Number(player?.params?.y) || playerTileY * 16)));
  return {
    width,
    triggerY: Math.max(0, Math.min(176, playerY - 8)),
    bottomY: Math.max(0, Math.min(191, playerY + 16)),
    missY: 192,
  };
}

function getPaddleHorizontalSpeed(analysis: ProjectAnalysis): number {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const speed = Number(
    player?.components?.msx2_paddle?.speed
      ?? player?.components?.msx2_movement?.speed
      ?? player?.components?.msx2_player_control?.speed
      ?? player?.params?.speed
      ?? 1
  );
  return Math.max(1, Math.min(16, Math.floor(speed) || 1));
}

function getPrimaryBallEntity(analysis: ProjectAnalysis): any | undefined {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  return screen?.layers?.entities?.find(entity =>
    (entity.kind === 'enemy' || entity.kind === 'hazard') && isBallBounceEntity(entity)
  );
}

function getPrimaryBallSpeedByte(analysis: ProjectAnalysis, axis: 'x' | 'y'): number {
  const ball = getPrimaryBallEntity(analysis);
  const key = axis === 'x' ? 'speedX' : 'speedY';
  const speedY = Number(
    ball?.components?.msx2_ball?.[key]
      ?? ball?.components?.msx2_movement?.[key]
      ?? ball?.params?.[key]
      ?? ball?.components?.msx2_movement?.speed
      ?? ball?.params?.speed
      ?? 1
  );
  const magnitude = Math.max(1, Math.min(6, Math.abs(Math.floor(speedY) || 1)));
  return magnitude;
}

function getPrimaryBallLaunchDy(analysis: ProjectAnalysis): number {
  return 0x100 - getPrimaryBallSpeedByte(analysis, 'y');
}

function usesMazeMovement(analysis: ProjectAnalysis): boolean {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  const mode = String(
    runtime.movementMode
      ?? runtime.movement
      ?? runtime.controlMode
      ?? runtime.playerMode
      ?? ''
  ).toLowerCase();

  return mode === 'maze'
    || mode === 'maze-chase'
    || mode === 'mazechase'
    || mode === 'pacman'
    || mode === 'pac-man';
}

function usesShooterHorizontalMovement(analysis: ProjectAnalysis): boolean {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const mode = String(
    runtime.movementMode
      ?? runtime.controlMode
      ?? runtime.playerMode
      ?? player?.components?.msx2_player_control?.controlMode
      ?? player?.params?.controlMode
      ?? ''
  ).toLowerCase();

  return mode === 'shooter'
    || mode === 'shooterhorizontal'
    || mode === 'horizontalshooter'
    || mode === 'galaxian'
    || mode === 'space-shooter'
    || mode === 'spaceshooter';
}

function usesMsx2Screen4BackgroundScroll(analysis: ProjectAnalysis): boolean {
  return collectReferencedTileScreens(analysis).some(screen =>
    Boolean((screen?.runtime as any)?.scrollMode)
    || Boolean((screen?.runtime as any)?.scroll)
    || Boolean(screen?.layers?.entities?.some(entity => Boolean(entity?.components?.msx2_scroll)))
  );
}

function isRuntimeHudHidden(analysis: ProjectAnalysis): boolean {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  return runtime.hideHud === true;
}

function getPlayerBulletSlotCount(analysis: ProjectAnalysis): number {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const configured = Number(
    player?.components?.msx2_shooter?.maxProjectiles
      ?? player?.params?.maxProjectiles
      ?? MSX2_PLAYER_BULLET_HARDWARE_SLOTS
  );
  return Math.max(1, Math.min(MSX2_PLAYER_BULLET_HARDWARE_SLOTS, Math.floor(configured) || 1));
}

function getPlayerProjectileEntity(analysis: ProjectAnalysis): any | undefined {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const projectilePresetId = player?.components?.msx2_shooter?.projectilePresetId ?? player?.params?.projectilePresetId;
  const entities = screen?.layers?.entities || [];
  if (projectilePresetId) {
    const presetToken = String(projectilePresetId).replace(/[\s_-]+/g, '').toLowerCase();
    const byId = entities.find(entity => {
      const entityToken = String(`${entity?.id || ''} ${(entity as any).templateId || ''} ${entity?.name || ''}`)
        .replace(/[\s_-]+/g, '')
        .toLowerCase();
      return entity?.id === projectilePresetId || (entity as any).templateId === projectilePresetId || entityToken.includes(presetToken);
    });
    if (byId) return byId;
  }
  return entities.find(entity =>
    entity?.components?.msx2_projectile?.owner === 'player'
      || entity?.params?.owner === 'player'
  );
}

function getPlayerBulletCooldownFrames(analysis: ProjectAnalysis): number {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const configured = Number(
    player?.components?.msx2_shooter?.cooldownFrames
      ?? player?.params?.cooldownFrames
      ?? 8
  );
  return Math.max(1, Math.min(255, Math.floor(configured) || 8));
}

function getPlayerBulletSpeedY(analysis: ProjectAnalysis): number {
  const projectile = getPlayerProjectileEntity(analysis);
  const configured = Number(
    projectile?.components?.msx2_projectile?.velocityY
      ?? projectile?.params?.velocityY
      ?? -6
  );
  return Math.max(1, Math.min(16, Math.floor(Math.abs(configured)) || 6));
}

function getGalaxianAttackWaveSettingsForScreen(screen: Msx2Screen4TileScreen | undefined): {
  intervalFrames: number;
  minAttackers: number;
  maxAttackers: number;
  randomSeed: number;
} {
  const controller = screen?.layers?.entities?.find(entity =>
    Boolean(entity?.components?.msx2_attack_wave)
    || Boolean(entity?.params?.waveController)
    || Boolean(entity?.components?.msx2_wave)
  );
  const component = controller?.components?.msx2_attack_wave || {};
  const intervalFrames = Math.max(1, Math.min(255, Math.floor(Number(
    component.intervalFrames ?? controller?.params?.attackIntervalFrames ?? 180
  ) || 180)));
  const minAttackers = Math.max(1, Math.min(3, Math.floor(Number(
    component.minAttackers ?? controller?.params?.minAttackers ?? 1
  ) || 1)));
  const maxAttackers = Math.max(minAttackers, Math.min(3, Math.floor(Number(
    component.maxAttackers ?? controller?.params?.maxAttackers ?? 3
  ) || 3)));
  const randomSeed = Math.max(1, Math.min(255, Math.floor(Number(
    component.randomSeed ?? controller?.params?.randomSeed ?? 73
  ) || 73)));
  return { intervalFrames, minAttackers, maxAttackers, randomSeed };
}

function getGalaxianAttackWaveSettings(analysis: ProjectAnalysis): {
  intervalFrames: number;
  minAttackers: number;
  maxAttackers: number;
  randomSeed: number;
} {
  return getGalaxianAttackWaveSettingsForScreen(getPrimaryRuntimeTileScreen(analysis));
}

type GalaxianAttackPattern = 'circle' | 'zigzag' | 'diagonal';

function normalizeGalaxianAttackPattern(value: unknown, slot: number): GalaxianAttackPattern {
  const token = String(value || '').replace(/[\s_-]+/g, '').toLowerCase();
  if (token === 'circle' || token === 'loop' || token === 'arc') return 'circle';
  if (token === 'zigzag' || token === 'zig' || token === 'zag') return 'zigzag';
  if (token === 'diagonal' || token === 'diag') return 'diagonal';
  return slot % 3 === 0 ? 'circle' : slot % 3 === 1 ? 'zigzag' : 'diagonal';
}

function getGalaxianAttackPatterns(analysis: ProjectAnalysis): GalaxianAttackPattern[] {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const enemies = (screen?.layers?.entities || [])
    .filter(entity => (entity.kind === 'enemy' || entity.kind === 'hazard') && entity.position)
    .slice(0, MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN);
  return Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) =>
    normalizeGalaxianAttackPattern(
      enemies[slot]?.components?.msx2_attack_pattern?.pattern ?? enemies[slot]?.params?.attackPattern,
      slot
    )
  );
}

function usesPaddleHorizontalMovement(analysis: ProjectAnalysis): boolean {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const mode = String(
    runtime.movementMode
      ?? runtime.controlMode
      ?? runtime.playerMode
      ?? player?.components?.msx2_player_control?.controlMode
      ?? player?.params?.controlMode
      ?? player?.params?.movementMode
      ?? ''
  ).replace(/[\s_-]+/g, '').toLowerCase();

  return mode === 'paddlehorizontal'
    || mode === 'paddle'
    || mode === 'pong'
    || mode === 'arkanoid'
    || mode === 'breakout';
}

function usesControl2Players(analysis: ProjectAnalysis): boolean {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const mode = String(
    runtime.movementMode
      ?? runtime.controlMode
      ?? runtime.playerMode
      ?? player?.components?.control_2_players?.controlMode
      ?? player?.components?.msx2_player_control?.controlMode
      ?? player?.params?.controlMode
      ?? player?.params?.movementMode
      ?? ''
  ).replace(/[\s_-]+/g, '').toLowerCase();
  const hasComponent = (screen?.layers?.entities || []).some(entity => Boolean(entity?.components?.control_2_players));

  return hasComponent
    || mode === 'control2players'
    || mode === '2players'
    || mode === 'twoplayers'
    || mode === 'twoplayerpong'
    || mode === 'pong2p'
    || mode === 'pong2players';
}

function getControl2PlayersComponent(analysis: ProjectAnalysis): Record<string, any> {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const entity = screen?.layers?.entities?.find(candidate => Boolean(candidate?.components?.control_2_players))
    || screen?.layers?.entities?.find(candidate => candidate.kind === 'player');
  return entity?.components?.control_2_players || entity?.params || {};
}

function getControl2PlayersSpeed(analysis: ProjectAnalysis): number {
  const component = getControl2PlayersComponent(analysis);
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const speed = Number(
    component.speed
      ?? player?.components?.msx2_paddle?.speed
      ?? player?.components?.msx2_movement?.speed
      ?? player?.params?.speed
      ?? 3
  );
  return Math.max(1, Math.min(12, Math.floor(speed) || 3));
}

function getControl2PlayersVerticalBounds(analysis: ProjectAnalysis): { minY: number; maxY: number } {
  const component = getControl2PlayersComponent(analysis);
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  const activeY = clampTileCoordinate(runtime.activeAreaY, MSX2_TILE_SCREEN_HEIGHT - 1);
  const activeHeight = Math.max(1, Math.min(MSX2_TILE_SCREEN_HEIGHT - activeY, Number(runtime.activeAreaHeight) || MSX2_TILE_SCREEN_HEIGHT));
  const minY = Math.max(0, Math.min(176, Math.floor(Number(component.minY) || (activeY * 16))));
  const maxYDefault = ((activeY + activeHeight) * 16) - 16;
  const maxY = Math.max(minY, Math.min(176, Math.floor(Number(component.maxY) || maxYDefault)));
  return { minY, maxY };
}

function usesSnakeCharMovement(analysis: ProjectAnalysis): boolean {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, unknown>;
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player');
  const mode = String(
    runtime.movementMode
      ?? runtime.controlMode
      ?? runtime.playerMode
      ?? player?.components?.msx2_player_control?.controlMode
      ?? player?.params?.controlMode
      ?? player?.params?.movementMode
      ?? ''
  ).replace(/[\s_-]+/g, '').toLowerCase();

  return mode === 'snakechar'
    || mode === 'snake'
    || mode === 'snakegrid'
    || mode === 'snakechars';
}

function getComponentNumber(entity: any, componentId: string, key: string, fallback: number): number {
  const value = Number(entity?.components?.[componentId]?.[key] ?? entity?.params?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function clampScreen4CharBlockBase(value: number): number {
  return Math.max(1, Math.min(252, Math.floor(value)));
}

function screen4CharBlocksOverlap(a: number, b: number): boolean {
  return Math.abs(a - b) < 4;
}

function findFreeScreen4CharBlockBase(requestedBase: number, reservedBases: number[]): number {
  let base = clampScreen4CharBlockBase(requestedBase);
  for (let attempts = 0; attempts < 64; attempts++) {
    if (!reservedBases.some(existing => screen4CharBlocksOverlap(existing, base))) return base;
    base += 4;
    if (base > 252) base = 1;
  }
  return base;
}

function buildSnakeWallMapBytes(screen: Msx2Screen4TileScreen | undefined): number[] {
  const tiles = screen?.tiles || [];
  const solidTileIndexes = new Set<number>();
  tiles.forEach((tile: any, index: number) => {
    const token = String(`${tile?.id || ''} ${tile?.name || ''}`)
      .replace(/[\s_-]+/g, '')
      .toLowerCase();
    if (
      token.includes('wall') ||
      token.includes('muro') ||
      token.includes('block') ||
      token.includes('stone') ||
      token.includes('pillar') ||
      token.includes('obstacle')
    ) {
      solidTileIndexes.add(index);
    }
  });

  const bytes: number[] = [];
  for (let y = 0; y < MSX2_TILE_SCREEN_HEIGHT; y++) {
    for (let x = 0; x < MSX2_TILE_SCREEN_WIDTH; x++) {
      const tileIndex = Math.max(0, Math.min(tiles.length - 1, Number(screen?.map?.[y]?.[x]) || 0));
      const collision = Number(screen?.layers?.collision?.[y]?.[x] ?? screen?.collisionMap?.[y]?.[x] ?? 0) || 0;
      const behavior = Number(screen?.layers?.behavior?.[y]?.[x] ?? 0) || 0;
      bytes.push(collision > 0 || behavior > 0 || solidTileIndexes.has(tileIndex) ? 1 : 0);
    }
  }
  return bytes;
}

function getSnakeCharRuntimeSettings(analysis: ProjectAnalysis): {
  headX: number;
  headY: number;
  foodX: number;
  foodY: number;
  speedFrames: number;
  headChar: number;
  foodChar: number;
  bodyChar: number;
  emptyChar: number;
  headPattern: number[];
  headColor: number[];
  bodyPattern: number[];
  bodyColor: number[];
  foodPattern: number[];
  foodColor: number[];
  emptyPattern: number[];
  emptyColor: number[];
  wallMap: number[];
  initialBodyCells: Array<{ x: number; y: number }>;
} {
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const entities = screen?.layers?.entities || [];
  const head = entities.find(entity => {
    const mode = String(entity?.components?.msx2_movement?.mode ?? entity?.params?.movement ?? entity?.params?.movementMode ?? '').toLowerCase();
    return entity?.kind === 'player' && mode.replace(/[\s_-]+/g, '') === 'snakechar';
  }) || entities.find(entity => entity?.kind === 'player') || entities[0];
  const food = entities.find(entity =>
    entity?.components?.msx2_collectible ||
    entity?.params?.food ||
    String(entity?.params?.engine || '').toLowerCase() === 'snakefood'
  );
  const body = entities.find(entity =>
    entity?.components?.msx2_snake_segment ||
    entity?.params?.snakeSegment ||
    String(entity?.params?.role || '').toLowerCase() === 'body'
  );
  const headChar = clampScreen4CharBlockBase(getComponentNumber(head, 'msx2_char_render', 'charCode', 1));
  const requestedFoodChar = clampScreen4CharBlockBase(getComponentNumber(food, 'msx2_char_render', 'charCode', 5));
  const foodChar = findFreeScreen4CharBlockBase(requestedFoodChar, [headChar]);
  const requestedBodyChar = clampScreen4CharBlockBase(getComponentNumber(body, 'msx2_char_render', 'charCode', headChar + 4));
  const bodyChar = findFreeScreen4CharBlockBase(requestedBodyChar, [headChar, foodChar]);
  const headBytes = getScreen4TileBytesForEntity(screen, head) || { pattern: Array(32).fill(0xFF), color: Array(32).fill(0xCC) };
  const bodyBytes = getScreen4TileBytesForEntity(screen, body) || headBytes;
  const foodBytes = getScreen4TileBytesForEntity(screen, food) || { pattern: Array(32).fill(0xFF), color: Array(32).fill(0x54) };
  const emptyBytes = buildScreen4TilePairBytes(screen?.tiles?.[0]);
  const bodySegments = entities
    .filter(entity =>
      entity?.components?.msx2_snake_segment ||
      entity?.params?.snakeSegment ||
      String(entity?.params?.role || '').toLowerCase() === 'body'
    )
    .sort((a, b) => Number(a?.params?.segmentIndex ?? 0) - Number(b?.params?.segmentIndex ?? 0))
    .map(entity => ({
      x: clampTileCoordinate(entity?.position?.x, 15),
      y: clampTileCoordinate(entity?.position?.y, MSX2_TILE_SCREEN_HEIGHT - 1),
    }));
  const headCell = {
    x: clampTileCoordinate(head?.position?.x, 15),
    y: clampTileCoordinate(head?.position?.y, MSX2_TILE_SCREEN_HEIGHT - 1),
  };
  const initialBodyCells = [...bodySegments, headCell].slice(-MSX2_SNAKE_MAX_BODY_CELLS);
  return {
    headX: headCell.x,
    headY: headCell.y,
    foodX: clampTileCoordinate(food?.position?.x ?? 10, 15),
    foodY: clampTileCoordinate(food?.position?.y ?? 6, MSX2_TILE_SCREEN_HEIGHT - 1),
    speedFrames: Math.max(1, Math.min(60, getComponentNumber(head, 'msx2_snake', 'speedFrames', Number(head?.params?.speedFrames) || 8))),
    headChar,
    foodChar,
    bodyChar,
    emptyChar: Math.max(0, Math.min(255, getComponentNumber(head, 'msx2_char_render', 'clearTileId', 0))),
    headPattern: headBytes.pattern,
    headColor: headBytes.color,
    bodyPattern: bodyBytes.pattern,
    bodyColor: bodyBytes.color,
    foodPattern: foodBytes.pattern,
    foodColor: foodBytes.color,
    emptyPattern: emptyBytes.pattern,
    emptyColor: emptyBytes.color,
    wallMap: buildSnakeWallMapBytes(screen),
    initialBodyCells,
  };
}

function usesSnakeGrowth(analysis: ProjectAnalysis): boolean {
  return collectReferencedTileScreens(analysis).some(screen => {
    const runtime = (screen?.runtime || {}) as Record<string, any>;
    const snakeGrowth = runtime.snakeGrowth;
    return snakeGrowth && snakeGrowth.enabled !== false;
  });
}

function getSnakeGrowthBodyTileBytes(analysis: ProjectAnalysis): number[] {
  const screen = collectReferencedTileScreens(analysis).find(candidate => {
    const runtime = (candidate?.runtime || {}) as Record<string, any>;
    return runtime.snakeGrowth && runtime.snakeGrowth.enabled !== false;
  }) || getPrimaryRuntimeTileScreen(analysis);
  const runtime = (screen?.runtime || {}) as Record<string, any>;
  const configuredIndex = Number(runtime.snakeGrowth?.bodyTileIndex);
  const tiles = screen?.tiles || [];
  const fallbackIndex = tiles.findIndex(tile => {
    const key = `${tile?.id || ''} ${tile?.name || ''}`.toLowerCase();
    return key.includes('snake') && key.includes('body');
  });
  const tileIndex = Number.isFinite(configuredIndex)
    ? Math.max(0, Math.min(tiles.length - 1, Math.floor(configuredIndex)))
    : Math.max(0, fallbackIndex);
  const bytes = buildTilePatternBytes(tiles[tileIndex]);
  return bytes.length ? bytes : Array(16 * 8).fill(0);
}

function isTransparentSpritePixel(color: string | undefined, sprite: Msx2Sprite): boolean {
  const normalized = normalizeColor(color);
  if (!normalized || normalized === TRANSPARENT_HEX) return true;
  return normalized === normalizeColor(sprite.backgroundColor);
}

interface Msx2HardwareLayer {
  pattern: number[];
  colors: number[];
  xOffset: number;
  yOffset: number;
}

interface RowLayerComposition {
  masks: number[];
  colors: number[];
}

interface OrColorPair {
  base: number;
  overlay: number;
  result: number;
}

function spritePatternByteForLayer(rowCompositions: RowLayerComposition[], layerIndex: number, x0: number, y: number): number {
  const mask = rowCompositions[y]?.masks[layerIndex] || 0;
  if (!mask) return 0;
  let value = 0;
  for (let bit = 0; bit < 8; bit++) {
    if (mask & (1 << (x0 + bit))) {
      value |= 0x80 >> bit;
    }
  }
  return value;
}

function buildHardwareSpritePatternForLayer(rowCompositions: RowLayerComposition[], layerIndex: number): number[] {
  const bytes: number[] = [];
  // V9938 16x16 sprites use four consecutive 8x8 patterns:
  // top-left, bottom-left, top-right, bottom-right.
  for (let y = 0; y < 8; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));
  for (let y = 8; y < 16; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));
  for (let y = 0; y < 8; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));
  for (let y = 8; y < 16; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));
  return bytes;
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

function getHorizontalFacingDirection(sprite: Msx2Sprite): 'left' | 'right' | undefined {
  return sprite.facingDirection === 'left' || sprite.facingDirection === 'right'
    ? sprite.facingDirection
    : undefined;
}

function paletteSlotForSpriteColor(sprite: Msx2Sprite, color: string | undefined): number | undefined {
  const normalized = normalizeColor(color);
  if (!normalized || isTransparentSpritePixel(color, sprite)) return undefined;
  const slotIndex = sprite.palette?.find(slot => normalizeColor(slot.hex) === normalized)?.slotIndex;
  if (typeof slotIndex === 'number' && slotIndex > 0 && slotIndex < 16) return slotIndex;
  return undefined;
}

function findBestOrColorPair(slots: number[], counts: Map<number, number>): OrColorPair | undefined {
  let best: { pair: OrColorPair; score: number } | undefined;
  slots.forEach(base => {
    slots.forEach(overlay => {
      if (base === overlay) return;
      const result = base | overlay;
      if (result === base || result === overlay || !slots.includes(result)) return;
      const score = ((counts.get(result) || 0) * 4) + (counts.get(base) || 0) + (counts.get(overlay) || 0);
      if (!best || score > best.score || (score === best.score && result < best.pair.result)) {
        best = { pair: { base, overlay, result }, score };
      }
    });
  });
  return best?.pair;
}

function buildCellRowComposition(slots: number[], useOrColor: boolean): RowLayerComposition {
  const counts = new Map<number, number>();
  slots.forEach(slot => {
    if (slot > 0) counts.set(slot, (counts.get(slot) || 0) + 1);
  });
  const uniqueSlots = Array.from(counts.keys()).sort((a, b) => a - b);
  if (!uniqueSlots.length) return { masks: [0], colors: [0] };

  const masks: number[] = [];
  const colors: number[] = [];
  const handled = new Set<number>();
  const orPair = useOrColor ? findBestOrColorPair(uniqueSlots, counts) : undefined;
  if (orPair) {
    let baseMask = 0;
    let overlayMask = 0;
    slots.forEach((slot, x) => {
      if (slot === orPair.base) baseMask |= 1 << x;
      if (slot === orPair.overlay) overlayMask |= 1 << x;
      if (slot === orPair.result) {
        baseMask |= 1 << x;
        overlayMask |= 1 << x;
      }
    });
    masks.push(baseMask);
    colors.push(orPair.base);
    masks.push(overlayMask);
    colors.push(0x40 | orPair.overlay);
    handled.add(orPair.base);
    handled.add(orPair.overlay);
    handled.add(orPair.result);
  }

  uniqueSlots.forEach(slot => {
    if (handled.has(slot)) return;
    let mask = 0;
    slots.forEach((rowSlot, x) => {
      if (rowSlot === slot) mask |= 1 << x;
    });
    masks.push(mask);
    colors.push(slot);
  });

  return { masks, colors };
}

function buildHardwareSpriteLayersForFrame(sprite: Msx2Sprite, fallbackColor: number, frameIndex: number): Msx2HardwareLayer[] {
  const frame = sprite.frames?.[frameIndex] || sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
  const useOrColor = sprite.hardware?.useOrColor !== false;
  const cellColumns = Math.max(1, Math.ceil((sprite.size?.width || 16) / 16));
  const cellRows = Math.max(1, Math.ceil((sprite.size?.height || 16) / 16));
  const layers: Msx2HardwareLayer[] = [];

  for (let cellY = 0; cellY < cellRows; cellY++) {
    for (let cellX = 0; cellX < cellColumns; cellX++) {
      const xOffset = cellX * 16;
      const yOffset = cellY * 16;
      const rowCompositions = Array.from({ length: 16 }, (_, y) => {
        const slots = Array.from({ length: 16 }, (_, x) =>
          paletteSlotForSpriteColor(sprite, frame?.data?.[yOffset + y]?.[xOffset + x]) || 0
        );
        return buildCellRowComposition(slots, useOrColor);
      });
      const layerCount = Math.min(8, Math.max(1, ...rowCompositions.map(row => row.colors.length)));
      for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
        const colors = rowCompositions.map(row => row.colors[layerIndex] ?? 0);
        const hasPixels = rowCompositions.some(row => (row.masks[layerIndex] || 0) !== 0);
        if (!hasPixels) continue;
        layers.push({
          pattern: buildHardwareSpritePatternForLayer(rowCompositions, layerIndex),
          colors: colors.map(color => color || Math.max(1, Math.min(15, fallbackColor))),
          xOffset,
          yOffset,
        });
      }
    }
  }

  return layers.length ? layers : [{
    pattern: Array(32).fill(0),
    colors: Array(16).fill(Math.max(1, Math.min(15, fallbackColor))),
    xOffset: 0,
    yOffset: 0,
  }];
}

function buildHardwareSpriteLayers(sprite: Msx2Sprite, fallbackColor: number): Msx2HardwareLayer[] {
  return buildHardwareSpriteLayersForFrame(sprite, fallbackColor, sprite.currentFrameIndex || 0);
}

function getHardwareSpriteAnimationFrameCount(sprite: Msx2Sprite, layerCount: number): number {
  const authoredFrameCount = (sprite.frames || []).filter(frame => Array.isArray(frame?.data) && frame.data.length > 0).length;
  const maxFramesByPatternSpace = Math.max(1, Math.floor((64 - 1) / Math.max(1, layerCount)));
  return Math.max(1, Math.min(authoredFrameCount || 1, maxFramesByPatternSpace, 8));
}

function getHardwareSpriteAnimationDelayFrames(sprite: Msx2Sprite): number {
  const speedMs = Number(sprite.animationSpeedMs);
  if (!Number.isFinite(speedMs) || speedMs <= 0) return 8;
  return Math.max(1, Math.min(255, Math.round(speedMs / (1000 / 60))));
}

function multiplyABySmallConstant(multiplier: number): string {
  if (multiplier <= 1) return '';
  if (multiplier === 2) return '    add a, a\n';
  if (multiplier === 4) return '    add a, a\n    add a, a\n';
  if (multiplier === 8) return '    add a, a\n    add a, a\n    add a, a\n';
  return `    ld b, a
    xor a
${Array.from({ length: multiplier }, () => '    add a, b\n').join('')}`;
}

function buildEnemyScreenSlotOffsetAsm(slot = 0): string {
  const addSlot = slot ? `    add a, ${slot}\n` : '';
  return `    ld a, (msx2_current_screen_index)
${multiplyABySmallConstant(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN)}${addSlot}    ld e, a
    ld d, 0
`;
}

function buildHardwareSpritePatternIndexAsm(
  basePatternIndex: number,
  framePatternStride: number,
  layerPatternOffset: number,
  frameCount: number,
  mirrorPatternOffset = 0,
  authoredFacing?: 'left' | 'right',
  labelSuffix = '0'
): string {
  const constantPatternIndex = basePatternIndex + layerPatternOffset;
  const basePatternIndexAsm = frameCount <= 1 || framePatternStride <= 0
    ? `    ld a, ${constantPatternIndex}`
    : `    ld a, (msx2_player_anim_frame)
${multiplyABySmallConstant(framePatternStride)}    add a, ${constantPatternIndex}`;
  if (!mirrorPatternOffset || !authoredFacing) {
    return basePatternIndexAsm;
  }
  const mirrorCondition = authoredFacing === 'right'
    ? `    ld a, (msx2_player_sprite_dx)
    or a
`
    : `    ld a, (msx2_player_sprite_dx)
    cp 1
`;
  return `${basePatternIndexAsm}
    ld b, a
${mirrorCondition}    ld a, b
    jp nz, .msx2_player_pattern_base_${labelSuffix}
    add a, ${mirrorPatternOffset}
.msx2_player_pattern_base_${labelSuffix}:`;
}

function clampHardwareSpriteY(value: number): number {
  return Math.max(0, Math.min(191, value));
}

function clampHardwareSpriteX(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function clampBasePatternIndex(patternIndex: number, spriteCount: number): number {
  const aligned = Math.max(0, patternIndex) & 0xFC;
  const maxBase = Math.max(0, 252 - (Math.max(1, spriteCount) - 1) * 4);
  return Math.min(aligned, maxBase & 0xFC);
}

function clampHardwareSpriteCount(layers: Msx2HardwareLayer[]): Msx2HardwareLayer[] {
  return layers.slice(0, 32);
}

function hasHardwareSprite(analysis: ProjectAnalysis): boolean {
  const sprite = getHardwareSpriteSource(analysis);
  return Boolean(sprite?.frames?.[0]?.data);
}

function buildHardwareSpriteInitAsm(analysis: ProjectAnalysis, useKonamiDataBank = false): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const x = clampHardwareSpriteX(settings.x);
  const y = clampHardwareSpriteY(settings.y);
  const enterDataBank = useKonamiDataBank ? '    call msx2_screen4_data_bank_enter\n' : '';
  const leaveDataBank = useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : '';
  return `init_hardware_sprites:
    ; SCREEN 4 hardware sprite runtime. Clobbers AF/BC/DE/HL.
    ; Preserve the SCREEN 4 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (#F3E0)
    or #02
    and #FE
    ld (#F3E0), a
    ld b, a
    ld c, #01
    call WRTVDP

    ; Sprite attribute/color/pattern tables use the SCREEN 4 V9938 layout.
    ; In sprite mode 2, R#5 selects the combined color+attribute table:
    ; color table #7400, SAT #7600. Bits 0-2 must be 1.
    ld bc, #3F05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0706
    call WRTVDP

${enterDataBank}
    ld hl, msx2_hw_sprite_patterns
    ld de, ${SCREEN4_SPRPAT_VRAM}
    ld bc, msx2_hw_sprite_patterns_end - msx2_hw_sprite_patterns
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_colors
    ld de, ${SCREEN4_SPRCOL_VRAM}
    ld bc, msx2_hw_sprite_colors_end - msx2_hw_sprite_colors
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_attrs
    ld de, ${SCREEN4_SPRATR_VRAM}
    ld bc, 128
    call copy_to_vram_ext
${leaveDataBank}

    ld a, ${x}
    ld (msx2_player_sprite_x), a
    ld a, ${y}
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
${usesMazeMovement(analysis) ? '    ld (msx2_player_sprite_frame), a\n' : ''}
    xor a
${usesMazeMovement(analysis) ? '' : '    ld (msx2_player_sprite_frame), a\n'}
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_score_lo), a
    ld (msx2_score_hi), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_score_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call upload_hardware_sprite_attrs

    xor a
    ld bc, #000E
    call WRTVDP
    ret

copy_to_vram_ext:
    ; HL=RAM/ROM source, DE=absolute VRAM destination, BC=length. Clobbers AF/BC/DE/HL.
    ld a, d
    and #C0
    rlca
    rlca
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    in a, (VDP_CTRL_PORT)
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.copy_loop:
    ld a, (hl)
    out (VDP_DATA_PORT), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .copy_loop
    xor a
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret

`;
}

function buildMsx2VramByteWriteAsm(): string {
  return `write_vram_byte_ext:
    ; A=data, HL=absolute VRAM destination. Clobbers AF/B.
    ld b, a
    ld a, h
    and #C0
    rlca
    rlca
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    in a, (VDP_CTRL_PORT)
    ld a, l
    out (VDP_CTRL_PORT), a
    ld a, h
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld a, b
    out (VDP_DATA_PORT), a
    xor a
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret

`;
}

function addImmediateToA(value: number): string {
  if (!value) return '';
  return `    add a, ${Math.max(0, Math.min(255, value))}\n`;
}

function buildMsx2HudTextRuntimeAsm(analysis: ProjectAnalysis, useKonamiDataBank = false): string {
  const hudFontBaseChar = getMsx2HudFontBaseChar(analysis);
  const hudFontPatternVram = hudFontBaseChar * 8;
  const hudFontColorVram = 0x2000 + (hudFontBaseChar * 8);
  const hudFontColorByte = buildMsx2HudFontColorBytes(analysis)[0] ?? 0xF1;
  const hudFontUsesContiguousAscii = isMsx2HudFontContiguousAscii(analysis);
  const hudAsciiMapperAsm = hudFontUsesContiguousAscii ? `msx2_hud_ascii_to_char:
    ; Input A=ASCII. Output A=SCREEN 4 HUD font char code.
    ; ZX-style imports store the first glyph at ASCII #20, so map by subtracting #20.
    cp #20
    jp c, .fallback
    cp #80
    jp nc, .fallback
    sub #20
    add a, MSX2_HUD_FONT_BASE_CHAR
    ret
.fallback:
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ret
` : `msx2_hud_ascii_to_char:
    ; Input A=ASCII. Output A=SCREEN 4 HUD font char code.
    cp #20
    jp z, .space
    cp #30
    jp c, .punct
    cp #3A
    jp c, .digit
    cp #41
    jp c, .punct
    cp #5B
    jp c, .upper
.punct:
    cp #3A
    jp z, .colon
    cp #2D
    jp z, .dash
    cp #2F
    jp z, .slash
.space:
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ret
.digit:
    sub #30
    add a, MSX2_HUD_FONT_BASE_CHAR + 1
    ret
.upper:
    sub #41
    add a, MSX2_HUD_FONT_BASE_CHAR + 11
    ret
.colon:
    ld a, MSX2_HUD_FONT_BASE_CHAR + 37
    ret
.dash:
    ld a, MSX2_HUD_FONT_BASE_CHAR + 38
    ret
.slash:
    ld a, MSX2_HUD_FONT_BASE_CHAR + 39
    ret
`;

  return `load_msx2_hud_font:
    ; Loads the generic MSX2 SCREEN 4 HUD font into reserved high char slots. Clobbers AF/BC/DE/HL.
${useKonamiDataBank ? '    call msx2_screen4_data_bank_enter\n' : ''}
    ld hl, msx2_hud_font_patterns
    ld de, ${formatHexWord(hudFontPatternVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call LDIRVM
    ld hl, msx2_hud_font_patterns
    ld de, ${formatHexWord(0x0800 + hudFontPatternVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call LDIRVM
    ld hl, msx2_hud_font_patterns
    ld de, ${formatHexWord(0x1000 + hudFontPatternVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call LDIRVM
${useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : ''}
    ld a, ${formatHexByte(hudFontColorByte)}
    ld hl, ${formatHexWord(hudFontColorVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    ld a, ${formatHexByte(hudFontColorByte)}
    ld hl, ${formatHexWord(0x0800 + hudFontColorVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    ld a, ${formatHexByte(hudFontColorByte)}
    ld hl, ${formatHexWord(0x1000 + hudFontColorVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    jp FILVRM

fill_msx2_hud_font_color:
    ; A=color byte, high nibble foreground and low nibble background. Clobbers AF/BC/HL.
    push af
    ld hl, ${formatHexWord(hudFontColorVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    pop af
    push af
    ld hl, ${formatHexWord(0x0800 + hudFontColorVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    pop af
    ld hl, ${formatHexWord(0x1000 + hudFontColorVram)}
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    jp FILVRM

draw_msx2_hud_string:
    ; DE=zero-terminated ASCII, HL=SCREEN 4 name-table VRAM destination. Clobbers AF/B/DE/HL.
    ld a, (de)
    or a
    ret z
    inc de
    call msx2_hud_ascii_to_char
    call write_vram_byte_ext
    inc hl
    jp draw_msx2_hud_string

${hudAsciiMapperAsm}
`;
}

function buildMsx2GameFlowTransitionHelpersAsm(needed: boolean): string {
  if (!needed) return '';
  return `
clear_screen4_names:
    ; Clears SCREEN 4 name table with the HUD blank char. Clobbers AF/BC/DE/HL.
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    ret

load_screen4_black_palette:
    ; Sets all SCREEN 4 palette slots to black. Clobbers AF/BC.
    ld bc, #0010
    call WRTVDP
    ld b, 32
    xor a
.black_palette_loop:
    out (VDP_PALETTE_PORT), a
    djnz .black_palette_loop
    ret

clear_screen4_name_cell_blank:
    ; HL=SCREEN 4 name-table cell. Clobbers AF/BC/DE/HL.
    ld a, MSX2_HUD_FONT_BASE_CHAR
    jp WRTVRM

clear_screen4_name_row:
    ; HL=start cell in SCREEN 4 name-table row. Clobbers AF/BC/DE/HL.
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ld bc, 32
    jp FILVRM

clear_screen4_name_rect:
    ; HL=top-left SCREEN 4 name-table cell, B=height, C=width. Clobbers AF/BC/DE/HL.
    ld a, b
    or a
    ret z
    ld a, c
    or a
    ret z
.rect_loop:
    push bc
    push hl
    ld b, 0
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call FILVRM
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .rect_loop
    ret

clear_screen4_name_column:
    ; HL=top cell in SCREEN 4 name-table column. Clobbers AF/BC/DE/HL.
    ld b, 24
.column_loop:
    push bc
    push hl
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .column_loop
    ret

clear_screen4_checkerboard_phase0:
    ; Clears alternating name-table cells. Clobbers AF/BC/DE/HL.
    ld hl, SCREEN4_NAME_VRAM
    ld b, 24
.phase0_row:
    push bc
    push hl
    ld a, b
    and 1
    jp z, .phase0_start
    inc hl
.phase0_start:
    ld c, 16
.phase0_column:
    push bc
    push hl
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    pop hl
    ld de, 2
    add hl, de
    pop bc
    dec c
    jp nz, .phase0_column
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .phase0_row
    ret

clear_screen4_checkerboard_phase1:
    ; Clears the opposite alternating name-table cells. Clobbers AF/BC/DE/HL.
    ld hl, SCREEN4_NAME_VRAM
    ld b, 24
.phase1_row:
    push bc
    push hl
    ld a, b
    and 1
    jp nz, .phase1_start
    inc hl
.phase1_start:
    ld c, 16
.phase1_column:
    push bc
    push hl
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    pop hl
    ld de, 2
    add hl, de
    pop bc
    dec c
    jp nz, .phase1_column
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .phase1_row
    ret
`;
}

function buildMsx2GameFlowMusicHelpersAsm(needed: boolean): string {
  if (!needed) return '';
  return `
msx2_gameflow_psg_write:
    ; Input: A=PSG register, E=value. Clobbers AF.
    out (#A0), a
    ld a, e
    out (#A1), a
    ret

msx2_gameflow_music:
msx2_gameflow_music_stop:
    ; Silence AY channels for SCREEN 4 GameFlow Music stop/mute nodes. Clobbers AF.
    ld a, 8
    ld e, 0
    call msx2_gameflow_psg_write
    ld a, 9
    ld e, 0
    call msx2_gameflow_psg_write
    ld a, 10
    ld e, 0
    call msx2_gameflow_psg_write
    ld a, 7
    ld e, #3F
    call msx2_gameflow_psg_write
    ret
`;
}

function buildHardwareSpriteRuntimeAsm(
  analysis: ProjectAnalysis,
  requiredCollectibles: number,
  restartScreenLabel: string,
  restartScreenIndex: number,
  tileScreenCount = 1
): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  const settings = getHardwareSpriteSettings(sprite);
  const color = Math.max(1, Math.min(15, settings.color));
  const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(sprite, color)).slice(0, MSX2_MAX_PLAYER_HARDWARE_LAYERS);
  const animationFrameCount = getHardwareSpriteAnimationFrameCount(sprite, layers.length);
  const animationDelayFrames = getHardwareSpriteAnimationDelayFrames(sprite);
  const framePatternStride = layers.length * 4;
  const control2Players = usesControl2Players(analysis);
  const horizontalFacing = getHorizontalFacingDirection(sprite);
  const mirrorPatternVariantCount = horizontalFacing ? 2 : 1;
  const mirrorPatternOffset = horizontalFacing ? layers.length * animationFrameCount * 4 : 0;
  const enemySprite = getEnemyHardwareSpriteSource(analysis);
  const enemyHorizontalFacing = !control2Players && enemySprite ? getHorizontalFacingDirection(enemySprite) : undefined;
  const enemyPatternVariantCount = enemyHorizontalFacing ? 2 : 1;
  const playerPatternGroupCount = layers.length * animationFrameCount * mirrorPatternVariantCount;
  const totalHardwarePatternGroups = playerPatternGroupCount + enemyPatternVariantCount + 2;
  const basePatternIndex = clampBasePatternIndex(settings.patternIndex, totalHardwarePatternGroups);
  const enemyPatternIndex = basePatternIndex + (playerPatternGroupCount * 4);
  const enemyMirrorPatternIndex = enemyPatternIndex + 4;
  const playerBulletPatternIndex = enemyPatternIndex + (enemyPatternVariantCount * 4);
  const enemyBulletPatternIndex = playerBulletPatternIndex + 4;
  const patrolBounds = getRuntimePatrolBounds(analysis);
  const paddleCollision = getPaddleCollisionSettings(analysis);
  const mazeMovement = usesMazeMovement(analysis);
  const shooterHorizontal = usesShooterHorizontalMovement(analysis);
  const paddleHorizontal = usesPaddleHorizontalMovement(analysis);
  const stageBannerEnabled = shooterHorizontal;
  const hideHud = isRuntimeHudHidden(analysis);
  const playerBulletSlotCount = getPlayerBulletSlotCount(analysis);
  const secondPlayerBullet = playerBulletSlotCount > 1;
  const attackWaveSettings = getGalaxianAttackWaveSettings(analysis);
  const attackPatterns = getGalaxianAttackPatterns(analysis);
  const playerBulletCooldownFrames = getPlayerBulletCooldownFrames(analysis);
  const playerBulletSpeedY = getPlayerBulletSpeedY(analysis);
  const horizontalMoveSpeed = (paddleHorizontal || shooterHorizontal) ? getPaddleHorizontalSpeed(analysis) : 1;
  const control2PlayersSpeed = control2Players ? getControl2PlayersSpeed(analysis) : 1;
  const control2PlayersBounds = getControl2PlayersVerticalBounds(analysis);
  const ballSpeedX = (paddleHorizontal || control2Players) ? getPrimaryBallSpeedByte(analysis, 'x') : 1;
  const ballSpeedY = control2Players ? getPrimaryBallSpeedByte(analysis, 'y') : 1;
  const ballSpeedXNeg = `#${(0x100 - ballSpeedX).toString(16).toUpperCase().padStart(2, '0')}`;
  const ballSpeedYNeg = `#${(0x100 - ballSpeedY).toString(16).toUpperCase().padStart(2, '0')}`;
  const ballLaunchDy = paddleHorizontal ? getPrimaryBallLaunchDy(analysis) : 0xFF;
  const attrWrites = layers.map((layer, layerIndex) => {
    const attrAddress = 0x1E00 + (layerIndex * 4);
    return `    ; Sprite layer ${layerIndex}: x+${layer.xOffset}, y+${layer.yOffset}
    ld a, (msx2_player_sprite_y)
${addImmediateToA(layer.yOffset)}    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
${addImmediateToA(layer.xOffset)}    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${buildHardwareSpritePatternIndexAsm(basePatternIndex, framePatternStride, layerIndex * 4, animationFrameCount, mirrorPatternOffset, horizontalFacing, String(layerIndex))}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
`;
  }).join('\n');
  const enemyAttrSlotAddress = (base: string, slot: number): string => slot
    ? `    ld hl, ${base}
    ld de, ${slot}
    add hl, de
`
    : `    ld hl, ${base}
`;
  const buildEnemyPatternIndexAsm = (slot: number): string => {
    if (!enemyHorizontalFacing) return `    ld a, ${enemyPatternIndex}`;
    const mirrorCondition = enemyHorizontalFacing === 'right'
      ? `    cp #FF
`
      : `    cp 1
`;
    return `${enemyAttrSlotAddress('msx2_enemy_runtime_dx', slot)}    ld a, (hl)
${mirrorCondition}    ld a, ${enemyPatternIndex}
    jp nz, .enemy_sprite_${slot}_base_pattern
    ld a, ${enemyMirrorPatternIndex}
.enemy_sprite_${slot}_base_pattern:`;
  };
  const buildRegularEnemyAttrWrite = (slot: number): string => {
    const attrAddress = 0x1E00 + ((layers.length + slot) * 4);
    return `    ; Enemy/hazard sprite slot ${slot}.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp nc, .enemy_sprite_${slot}_visible
    ld a, 208
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .enemy_sprite_${slot}_done
.enemy_sprite_${slot}_visible:
${enemyAttrSlotAddress('msx2_enemy_runtime_y', slot)}    ld a, (hl)
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${enemyAttrSlotAddress('msx2_enemy_runtime_x', slot)}    ld a, (hl)
    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${buildEnemyPatternIndexAsm(slot)}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.enemy_sprite_${slot}_done:
`;
  };
  const buildControl2PlayersAttrWrite = (slot: number): string => {
    const attrAddress = 0x1E00 + ((layers.length + slot) * 4);
    const slotAddress = (base: string): string => slot
      ? `    ld hl, ${base}
    ld de, ${slot}
    add hl, de
`
      : `    ld hl, ${base}
`;
    if (slot > 1) {
      return `    ; Unused two-player Pong enemy/hazard sprite slot ${slot}.
    ld a, 208
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
`;
    }
    const patternIndex = slot === 0 ? basePatternIndex : playerBulletPatternIndex;
    const label = slot === 0 ? 'right paddle' : 'ball';
    return `    ; Two-player Pong ${label} sprite slot ${slot}.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp nc, .control_2_players_sprite_${slot}_visible
    ld a, 208
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .control_2_players_sprite_${slot}_done
.control_2_players_sprite_${slot}_visible:
${slotAddress('msx2_enemy_runtime_y')}    ld a, (hl)
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${slotAddress('msx2_enemy_runtime_x')}    ld a, (hl)
    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${patternIndex}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.control_2_players_sprite_${slot}_done:
`;
  };
  const enemyAttrWrites = Array.from(
    { length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN },
    (_unused, slot) => control2Players ? buildControl2PlayersAttrWrite(slot) : buildRegularEnemyAttrWrite(slot)
  ).join('\n');
  const playerBulletAttrAddress = 0x1E00 + ((layers.length + MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN) * 4);
  const playerBulletAttrAddress1 = playerBulletAttrAddress + 4;
  const playerBulletAttrWrite = `    ; Player bullet hardware sprite slot 0.
    ld a, (msx2_player_bullet_active)
    or a
    jp nz, .player_bullet_sprite_visible
    ld a, 208
    ld hl, #${playerBulletAttrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .player_bullet_sprite_done
.player_bullet_sprite_visible:
    ld a, (msx2_player_bullet_y)
    ld hl, #${playerBulletAttrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_x)
    ld hl, #${(playerBulletAttrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${playerBulletPatternIndex}
    ld hl, #${(playerBulletAttrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(playerBulletAttrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.player_bullet_sprite_done:
${secondPlayerBullet ? `
    ; Player bullet hardware sprite slot 1.
    ld a, (msx2_player_bullet_1_active)
    or a
    jp nz, .player_bullet_1_sprite_visible
    ld a, 208
    ld hl, #${playerBulletAttrAddress1.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .player_bullet_1_sprite_done
.player_bullet_1_sprite_visible:
    ld a, (msx2_player_bullet_1_y)
    ld hl, #${playerBulletAttrAddress1.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_1_x)
    ld hl, #${(playerBulletAttrAddress1 + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${playerBulletPatternIndex}
    ld hl, #${(playerBulletAttrAddress1 + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(playerBulletAttrAddress1 + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.player_bullet_1_sprite_done:
` : ''}
`;
  const enemyBulletAttrAddress = 0x1E00 + ((layers.length + MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN + playerBulletSlotCount) * 4);
  const enemyBulletAttrWrite = `    ; Enemy bullet hardware sprite slot.
    ld a, (msx2_enemy_bullet_active)
    or a
    jp nz, .enemy_bullet_sprite_visible
    ld a, 208
    ld hl, #${enemyBulletAttrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .enemy_bullet_sprite_done
.enemy_bullet_sprite_visible:
    ld a, (msx2_enemy_bullet_y)
    ld hl, #${enemyBulletAttrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_enemy_bullet_x)
    ld hl, #${(enemyBulletAttrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${enemyBulletPatternIndex}
    ld hl, #${(enemyBulletAttrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(enemyBulletAttrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.enemy_bullet_sprite_done:
`;
  const hudLivesAttrBase = 0x1E00 + ((layers.length + MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN + playerBulletSlotCount + MSX2_ENEMY_BULLET_HARDWARE_SLOTS) * 4);
  const hudLivesAttrWrite = hideHud ? '' : [0, 1, 2].map(index => {
    const attrAddress = hudLivesAttrBase + (index * 4);
    return `    ; HUD life marker ${index + 1}.
    ld a, (msx2_lives)
    cp ${index + 1}
    jp nc, .hud_life_${index}_visible
    ld a, 208
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .hud_life_${index}_done
.hud_life_${index}_visible:
    ld a, ${8 + (index * 10)}
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, 28
    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${enemyBulletPatternIndex}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.hud_life_${index}_done:
`;
  }).join('\n');
  const terminatorAttrAddress = hudLivesAttrBase + (hideHud ? 0 : 3 * 4);
  const playerAnimationRoutine = animationFrameCount > 1 ? `
update_msx2_player_sprite_animation:
    ; Advances the player hardware sprite frame. Clobbers AF.
    ld a, (msx2_player_anim_counter)
    inc a
    cp ${animationDelayFrames}
    jp nc, .advance_player_sprite_frame
    ld (msx2_player_anim_counter), a
    ret
.advance_player_sprite_frame:
    xor a
    ld (msx2_player_anim_counter), a
    ld a, (msx2_player_anim_frame)
    inc a
    cp ${animationFrameCount}
    jp c, .store_player_sprite_frame
    xor a
.store_player_sprite_frame:
    ld (msx2_player_anim_frame), a
    ret
` : '';
  const mazeMovementInputAsm = mazeMovement ? `
update_hardware_sprite_input_maze:
    ; Four-direction maze movement: no gravity, no jump. Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 1
    jp z, maze_latch_up
    cp 2
    jp z, maze_latch_up
    cp 8
    jp z, maze_latch_up
    cp 5
    jp z, maze_latch_down
    cp 4
    jp z, maze_latch_down
    cp 6
    jp z, maze_latch_down
    cp 3
    jp z, maze_latch_right
    cp 7
    jp z, maze_latch_left
    jp maze_try_latched_direction

maze_latch_up:
    ld a, 2
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_latch_down:
    ld a, 3
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_latch_right:
    ld a, 1
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_latch_left:
    xor a
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_try_latched_direction:
    ld a, (msx2_player_sprite_frame)
    cp 2
    jp z, maze_request_up
    cp 3
    jp z, maze_request_down
    or a
    jp z, maze_request_left
    jp maze_request_right

maze_can_change_direction_16:
    ld a, (msx2_player_sprite_x)
    and #0F
    ret nz
    ld a, (msx2_player_sprite_y)
    and #0F
    ret

maze_request_up:
    ld a, (msx2_player_sprite_dx)
    cp 2
    jp z, maze_move_up
    call maze_can_change_direction_16
    jp z, maze_move_up
    jp maze_continue_current_direction

maze_request_down:
    ld a, (msx2_player_sprite_dx)
    cp 3
    jp z, maze_move_down
    call maze_can_change_direction_16
    jp z, maze_move_down
    jp maze_continue_current_direction

maze_request_right:
    ld a, (msx2_player_sprite_dx)
    cp 1
    jp z, maze_move_right
    call maze_can_change_direction_16
    jp z, maze_move_right
    jp maze_continue_current_direction

maze_request_left:
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, maze_move_left
    call maze_can_change_direction_16
    jp z, maze_move_left
    jp maze_continue_current_direction

maze_continue_current_direction:
    ld a, (msx2_player_sprite_dx)
    cp 2
    jp z, maze_continue_up
    cp 3
    jp z, maze_continue_down
    or a
    jp z, maze_continue_left
    jp maze_continue_right

maze_move_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, maze_continue_current_direction
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    ld a, 2
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, maze_continue_current_direction
    inc a
    add a, 15
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_y)
    inc a
    ld (msx2_player_sprite_y), a
    ld a, 3
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_right:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_left:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_continue_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs

maze_continue_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    add a, 15
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_y)
    inc a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs

maze_continue_right:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    jp upload_hardware_sprite_attrs

maze_continue_left:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    jp upload_hardware_sprite_attrs
` : '';
  const control2PlayersInputAsm = control2Players ? `
update_hardware_sprite_input_control_2_players:
    ; Two-player Pong control. Player 1 uses cursor keys, player 2 uses joystick port 1.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    call control_2_players_update_p1_cursor
    call control_2_players_update_p2_joystick
    jp upload_hardware_sprite_attrs

control_2_players_update_p1_cursor:
    xor a
    call GTSTCK
    cp 1
    jp z, control_2_players_p1_up
    cp 2
    jp z, control_2_players_p1_up
    cp 8
    jp z, control_2_players_p1_up
    cp 4
    jp z, control_2_players_p1_down
    cp 5
    jp z, control_2_players_p1_down
    cp 6
    jp z, control_2_players_p1_down
    ret
control_2_players_p1_up:
    ld a, (msx2_player_sprite_y)
    cp ${control2PlayersBounds.minY}
    ret z
    ret c
    sub ${control2PlayersSpeed}
    jp nc, .control_2_players_p1_up_check_min
    ld a, ${control2PlayersBounds.minY}
    jp .control_2_players_p1_store_y
.control_2_players_p1_up_check_min:
    cp ${control2PlayersBounds.minY}
    jp nc, .control_2_players_p1_store_y
    ld a, ${control2PlayersBounds.minY}
.control_2_players_p1_store_y:
    ld (msx2_player_sprite_y), a
    ret
control_2_players_p1_down:
    ld a, (msx2_player_sprite_y)
    cp ${control2PlayersBounds.maxY}
    ret nc
    add a, ${control2PlayersSpeed}
    cp ${control2PlayersBounds.maxY}
    jp c, .control_2_players_p1_down_store
    ld a, ${control2PlayersBounds.maxY}
.control_2_players_p1_down_store:
    ld (msx2_player_sprite_y), a
    ret

control_2_players_update_p2_joystick:
    ld a, 1
    call GTSTCK
    cp 1
    jp z, control_2_players_p2_up
    cp 2
    jp z, control_2_players_p2_up
    cp 8
    jp z, control_2_players_p2_up
    cp 4
    jp z, control_2_players_p2_down
    cp 5
    jp z, control_2_players_p2_down
    cp 6
    jp z, control_2_players_p2_down
    ret
control_2_players_p2_up:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    cp ${control2PlayersBounds.minY}
    ret z
    ret c
    sub ${control2PlayersSpeed}
    jp nc, .control_2_players_p2_up_check_min
    ld a, ${control2PlayersBounds.minY}
    jp .control_2_players_p2_store_y
.control_2_players_p2_up_check_min:
    cp ${control2PlayersBounds.minY}
    jp nc, .control_2_players_p2_store_y
    ld a, ${control2PlayersBounds.minY}
.control_2_players_p2_store_y:
    ld (hl), a
    ret
control_2_players_p2_down:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    cp ${control2PlayersBounds.maxY}
    ret nc
    add a, ${control2PlayersSpeed}
    cp ${control2PlayersBounds.maxY}
    jp c, .control_2_players_p2_down_store
    ld a, ${control2PlayersBounds.maxY}
.control_2_players_p2_down_store:
    ld (hl), a
    ret
` : '';
  const enemySlotAddress = (base: string, slot: number): string => slot
    ? `    ld hl, ${base}
    ld de, ${slot}
    add hl, de
`
    : `    ld hl, ${base}
`;
  const enemySlotCollisionChecks = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    return `    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp c, .enemy_no_slot_${slot}
${control2Players ? `    jp .enemy_no_slot_${slot}
` : ''}
${paddleHorizontal ? `${buildEnemyScreenSlotOffsetAsm(slot)}    ld hl, msx2_screen_enemy_mode
    add hl, de
    ld a, (hl)
    cp ${MSX2_ENEMY_MOVEMENT_BALL_BOUNCE}
    jp z, .enemy_no_slot_${slot}
` : ''}
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_${slot}
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_${slot}
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_${slot}
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_${slot}
    jp .enemy_damage
.enemy_no_slot_${slot}:
`;
  }).join('');
  const buildBulletEnemyCollisionChecks = (label: string, bulletX: string, bulletY: string, bulletActive: string) => Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    return `    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp c, .bullet_no_enemy_slot_${label}_${slot}
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_${label}_${slot}
    ld b, a
    ld a, (${bulletY})
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_${label}_${slot}
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_${label}_${slot}
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    ld a, (${bulletX})
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_${label}_${slot}
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_${label}_${slot}
    xor a
    ld (${bulletActive}), a
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), 208
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_${label}_${slot}
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_${label}_${slot}:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_${label}_${slot}:
`;
  }).join('');
  const bulletEnemyCollisionChecks = buildBulletEnemyCollisionChecks('0', 'msx2_player_bullet_x', 'msx2_player_bullet_y', 'msx2_player_bullet_active');
  const bullet1EnemyCollisionChecks = buildBulletEnemyCollisionChecks('1', 'msx2_player_bullet_1_x', 'msx2_player_bullet_1_y', 'msx2_player_bullet_1_active');
  const enemyWaveCompleteChecks = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => `    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp c, .wave_slot_${slot}_not_active
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    cp 208
    ret c
.wave_slot_${slot}_not_active:
`).join('');
  const enemyBulletSpawnChecks = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    return `    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp c, .enemy_bullet_no_spawn_${slot}
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_${slot}
    add a, 16
    ld (msx2_enemy_bullet_y), a
${buildEnemyScreenSlotOffsetAsm(slot)}
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_${slot}:
`;
  }).join('');
  const enemySlotMovementRoutines = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    return `    call update_msx2_enemy_position_slot_${slot}
`;
  }).join('');
  const enemySlotMovementHandlers = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    if (control2Players) {
      if (slot !== 1) {
        return `update_msx2_enemy_position_slot_${slot}:
    ret
`;
      }
      return `update_msx2_enemy_position_slot_${slot}:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    ret c
${enemySlotAddress('msx2_enemy_runtime_mode', slot)}
    ld a, (hl)
    cp ${MSX2_ENEMY_MOVEMENT_BALL_BOUNCE}
    jp z, update_control_2_players_ball
    ret
`;
    }
    const attackPattern = attackPatterns[slot];
    const shooterDiveMovement = attackPattern === 'circle'
      ? `${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld a, (hl)
    inc a
    and #1F
    ld (hl), a
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    inc a
    bit 3, b
    jp z, .enemy_slot_${slot}_circle_store_y
    inc a
.enemy_slot_${slot}_circle_store_y:
    ld (hl), a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    bit 4, b
    jp nz, .enemy_slot_${slot}_circle_left
    inc a
    ld (hl), a
    ret
.enemy_slot_${slot}_circle_left:
    dec a
    ld (hl), a
    ret`
      : attackPattern === 'zigzag'
        ? `${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld a, (hl)
    inc a
    and #1F
    ld (hl), a
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    add a, 2
    ld (hl), a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    bit 4, b
    jp nz, .enemy_slot_${slot}_zigzag_left
    add a, 2
    ld (hl), a
    ret
.enemy_slot_${slot}_zigzag_left:
    sub 2
    ld (hl), a
    ret`
        : `${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    add a, 2
    ld (hl), a
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld a, (hl)
    cp #FF
    jp z, .enemy_slot_${slot}_diagonal_left
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    inc a
    ld (hl), a
    ret
.enemy_slot_${slot}_diagonal_left:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    dec a
    ld (hl), a
    ret`;
    return `update_msx2_enemy_position_slot_${slot}:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    ret c
${enemySlotAddress('msx2_enemy_runtime_mode', slot)}
    ld a, (hl)
    cp ${MSX2_ENEMY_MOVEMENT_BALL_BOUNCE}
    jp z, .enemy_slot_${slot}_ball_bounce
    cp ${MSX2_ENEMY_MOVEMENT_DIVE}
    jp z, .enemy_slot_${slot}_dive
    cp ${MSX2_ENEMY_MOVEMENT_GHOST_MAZE}
    jp z, .enemy_slot_${slot}_ghost_maze
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld a, (hl)
    or a
    jp z, .enemy_slot_${slot}_check_y
    cp #FF
    jp z, .enemy_slot_${slot}_left
.enemy_slot_${slot}_right:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_${slot}_turn_left
    inc b
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), b
    ret
.enemy_slot_${slot}_turn_left:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), #FF
.enemy_slot_${slot}_left:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_${slot}_turn_right
    jp z, .enemy_slot_${slot}_turn_right
    dec b
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), b
    ret
.enemy_slot_${slot}_turn_right:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), 1
    ret
.enemy_slot_${slot}_check_y:
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_${slot}_up
.enemy_slot_${slot}_down:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld b, (hl)
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_${slot}_turn_up
    inc b
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), b
    ret
.enemy_slot_${slot}_turn_up:
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), #FF
.enemy_slot_${slot}_up:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld b, (hl)
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_${slot}_turn_down
    jp z, .enemy_slot_${slot}_turn_down
    dec b
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), b
    ret
.enemy_slot_${slot}_turn_down:
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), 1
    ret

.enemy_slot_${slot}_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.
${control2Players && slot === 1 ? '    jp update_control_2_players_ball\n' : ''}
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_${slot}_ball_left
.enemy_slot_${slot}_ball_right:
    ld c, a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    add a, c
    ld b, a
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_${slot}_ball_turn_left
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), b
    jp .enemy_slot_${slot}_ball_y
.enemy_slot_${slot}_ball_turn_left:
    ld a, (hl)
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), b
    xor a
    sub c
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), a
    jp .enemy_slot_${slot}_ball_y
.enemy_slot_${slot}_ball_left:
    neg
    ld c, a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    sub c
    jp c, .enemy_slot_${slot}_ball_turn_right
    ld b, a
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_${slot}_ball_turn_right
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), b
    jp .enemy_slot_${slot}_ball_y
.enemy_slot_${slot}_ball_turn_right:
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), b
    ld a, c
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), a

.enemy_slot_${slot}_ball_y:
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_${slot}_ball_up
.enemy_slot_${slot}_ball_down:
    ld c, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    add a, c
    ld b, a
${paddleHorizontal ? `    ld a, b
    cp ${paddleCollision.missY}
    jp nc, .enemy_slot_${slot}_ball_miss_paddle
    ld a, b
    cp ${paddleCollision.triggerY}
    jp c, .enemy_slot_${slot}_ball_store_y
    ld a, b
    cp ${paddleCollision.bottomY}
    jp c, .enemy_slot_${slot}_ball_check_paddle
    jp .enemy_slot_${slot}_ball_store_y
` : `
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_${slot}_ball_check_paddle
`}
.enemy_slot_${slot}_ball_store_y:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), b
    jp .enemy_slot_${slot}_ball_check_brick
.enemy_slot_${slot}_ball_check_paddle:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp ${paddleCollision.width}
    jp nc, .enemy_slot_${slot}_ball_no_paddle_hit
${paddleHorizontal ? `    cp ${Math.max(1, Math.floor(paddleCollision.width / 2))}
    jp c, .enemy_slot_${slot}_ball_hit_paddle_left
    ld a, ${ballSpeedX}
    jp .enemy_slot_${slot}_ball_store_paddle_dx
.enemy_slot_${slot}_ball_hit_paddle_left:
    ld a, #${(0x100 - ballSpeedX).toString(16).toUpperCase().padStart(2, '0')}
.enemy_slot_${slot}_ball_store_paddle_dx:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), a
` : ''}
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), b
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld a, (hl)
    neg
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), a
    ret
.enemy_slot_${slot}_ball_no_paddle_hit:
${paddleHorizontal ? `    jp .enemy_slot_${slot}_ball_store_y` : `    jp .enemy_slot_${slot}_ball_miss_paddle`}
.enemy_slot_${slot}_ball_miss_paddle:
${slot === 0 ? `    call msx2_apply_damage_respawn
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 1
    ld (msx2_player_bullet_active), a
    ret` : `
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret`}
.enemy_slot_${slot}_ball_up:
    neg
    ld c, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    sub c
    jp c, .enemy_slot_${slot}_ball_turn_down
    ld b, a
    push bc
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_${slot}_ball_turn_down
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), b
    jp .enemy_slot_${slot}_ball_check_brick
.enemy_slot_${slot}_ball_turn_down:
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), b
    ld a, c
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), a
    jp .enemy_slot_${slot}_ball_check_brick

.enemy_slot_${slot}_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    add a, 8
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_${slot}_ball_break_brick
    pop bc
    ret
.enemy_slot_${slot}_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_${slot}_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_${slot}_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
${slot === 0 && requiredCollectibles > 0 ? `    cp ${requiredCollectibles}
    jp c, .enemy_slot_${slot}_ball_brick_not_complete
    ld (msx2_level_complete_flag), a
.enemy_slot_${slot}_ball_brick_not_complete:
` : ''}
    ret

.enemy_slot_${slot}_dive:
${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld a, (hl)
${shooterHorizontal ? `    cp #FF
    ret z
` : `    or a
    jp z, .enemy_slot_${slot}_dive_active
    dec a
    ld (hl), a
    ret
`}
${shooterHorizontal ? '' : `.enemy_slot_${slot}_dive_active:
`}${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_${slot}_dive_reset
${shooterHorizontal ? shooterDiveMovement : `    add a, 2
    ld (hl), a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_${slot}_dive_left
    jp z, .enemy_slot_${slot}_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_${slot}_dive_left:
    dec b
    ld (hl), b
.enemy_slot_${slot}_dive_done:
    ret`}
${shooterHorizontal ? '    ret\n' : ''}.enemy_slot_${slot}_dive_reset:
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld (hl), a
${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld (hl), a
${shooterHorizontal ? `    ld a, #FF
${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld (hl), a
` : `${buildEnemyScreenSlotOffsetAsm(slot)}
    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld (hl), a
`}    ret

.enemy_slot_${slot}_ghost_maze:
${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld a, (hl)
    or a
    jp z, .enemy_slot_${slot}_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_${slot}_ghost_tick_ready:
${enemySlotAddress('msx2_enemy_runtime_speed', slot)}
    ld a, (hl)
    or a
    jp nz, .enemy_slot_${slot}_ghost_store_tick
    ld a, 2
.enemy_slot_${slot}_ghost_store_tick:
${enemySlotAddress('msx2_enemy_runtime_tick', slot)}
    ld (hl), a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_${slot}_ghost_forward
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_${slot}_ghost_forward
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_${slot}_ghost_prefer_left
.enemy_slot_${slot}_ghost_prefer_right:
    jp .enemy_slot_${slot}_ghost_try_right_first
.enemy_slot_${slot}_ghost_prefer_left:
    jp .enemy_slot_${slot}_ghost_try_left_first
.enemy_slot_${slot}_ghost_try_right_first:
    call .enemy_slot_${slot}_ghost_can_right
    jp z, .enemy_slot_${slot}_ghost_set_right
    jp .enemy_slot_${slot}_ghost_try_vertical
.enemy_slot_${slot}_ghost_try_left_first:
    call .enemy_slot_${slot}_ghost_can_left
    jp z, .enemy_slot_${slot}_ghost_set_left
.enemy_slot_${slot}_ghost_try_vertical:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_${slot}_ghost_try_up_first
    call .enemy_slot_${slot}_ghost_can_down
    jp z, .enemy_slot_${slot}_ghost_set_down
    call .enemy_slot_${slot}_ghost_can_up
    jp z, .enemy_slot_${slot}_ghost_set_up
    jp .enemy_slot_${slot}_ghost_try_reverse
.enemy_slot_${slot}_ghost_try_up_first:
    call .enemy_slot_${slot}_ghost_can_up
    jp z, .enemy_slot_${slot}_ghost_set_up
    call .enemy_slot_${slot}_ghost_can_down
    jp z, .enemy_slot_${slot}_ghost_set_down
.enemy_slot_${slot}_ghost_try_reverse:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld a, (hl)
    cp 1
    jp z, .enemy_slot_${slot}_ghost_set_left
    cp #FF
    jp z, .enemy_slot_${slot}_ghost_set_right
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld a, (hl)
    cp 1
    jp z, .enemy_slot_${slot}_ghost_set_up
    cp #FF
    jp z, .enemy_slot_${slot}_ghost_set_down
    ret
.enemy_slot_${slot}_ghost_forward:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld a, (hl)
    cp 1
    jp z, .enemy_slot_${slot}_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_${slot}_ghost_move_left_checked
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld a, (hl)
    cp 1
    jp z, .enemy_slot_${slot}_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_${slot}_ghost_move_up_checked
    jp .enemy_slot_${slot}_ghost_try_right_first
.enemy_slot_${slot}_ghost_set_right:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), 1
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), 0
    jp .enemy_slot_${slot}_ghost_move_right
.enemy_slot_${slot}_ghost_set_left:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), #FF
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), 0
    jp .enemy_slot_${slot}_ghost_move_left
.enemy_slot_${slot}_ghost_set_down:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), 0
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), 1
    jp .enemy_slot_${slot}_ghost_move_down
.enemy_slot_${slot}_ghost_set_up:
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld (hl), 0
${enemySlotAddress('msx2_enemy_runtime_dy', slot)}
    ld (hl), #FF
    jp .enemy_slot_${slot}_ghost_move_up
.enemy_slot_${slot}_ghost_move_right_checked:
    call .enemy_slot_${slot}_ghost_can_right
    jp nz, .enemy_slot_${slot}_ghost_try_vertical
.enemy_slot_${slot}_ghost_move_right:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    inc (hl)
    ret
.enemy_slot_${slot}_ghost_move_left_checked:
    call .enemy_slot_${slot}_ghost_can_left
    jp nz, .enemy_slot_${slot}_ghost_try_vertical
.enemy_slot_${slot}_ghost_move_left:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    dec (hl)
    ret
.enemy_slot_${slot}_ghost_move_down_checked:
    call .enemy_slot_${slot}_ghost_can_down
    jp nz, .enemy_slot_${slot}_ghost_try_right_first
.enemy_slot_${slot}_ghost_move_down:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    inc (hl)
    ret
.enemy_slot_${slot}_ghost_move_up_checked:
    call .enemy_slot_${slot}_ghost_can_up
    jp nz, .enemy_slot_${slot}_ghost_try_right_first
.enemy_slot_${slot}_ghost_move_up:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    dec (hl)
    ret
.enemy_slot_${slot}_ghost_can_right:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    cp ${patrolBounds.maxX}
    jp nc, .enemy_slot_${slot}_ghost_blocked
    inc a
    add a, 15
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_${slot}_ghost_can_left:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    cp ${patrolBounds.minX}
    jp z, .enemy_slot_${slot}_ghost_blocked
    jp c, .enemy_slot_${slot}_ghost_blocked
    dec a
    ld b, a
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_${slot}_ghost_can_down:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_${slot}_ghost_blocked
    inc a
    add a, 15
    ld c, a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_${slot}_ghost_can_up:
${enemySlotAddress('msx2_enemy_runtime_y', slot)}
    ld a, (hl)
    or a
    jp z, .enemy_slot_${slot}_ghost_blocked
    dec a
    ld c, a
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_${slot}_ghost_blocked:
    or 1
    ret

`;
  }).join('');

  const control2PlayersBallAsm = control2Players ? `
update_control_2_players_ball:
    ; Ball for control_2_players Pong. Slot 0 is right paddle, slot 1 is the ball.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_dx + 1
    ld a, (hl)
    bit 7, a
    jp nz, control_2_players_ball_left
control_2_players_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x + 1
    ld a, (hl)
    add a, c
    ld b, a
    cp 244
    jp nc, control_2_players_ball_reset_left
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    sub 8
    ld e, a
    ld a, b
    cp e
    jp c, control_2_players_ball_store_x
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    sub 4
    cp c
    jp nc, control_2_players_ball_store_x
    ld a, (hl)
    add a, 20
    cp c
    jp c, control_2_players_ball_store_x
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    sub 8
    ld b, a
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), b
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), ${ballSpeedXNeg}
    call control_2_players_ball_angle_from_right_paddle
    call msx2_sfx_hit
    jp control_2_players_ball_y

control_2_players_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x + 1
    ld a, (hl)
    sub c
    jp c, control_2_players_ball_reset_right
    ld b, a
    ld a, (msx2_player_sprite_x)
    add a, 16
    ld e, a
    ld a, b
    cp e
    jp nc, control_2_players_ball_store_x
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_y)
    sub 4
    cp c
    jp nc, control_2_players_ball_store_x
    ld a, (msx2_player_sprite_y)
    add a, 20
    cp c
    jp c, control_2_players_ball_store_x
    ld a, (msx2_player_sprite_x)
    add a, 16
    ld b, a
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), b
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), ${ballSpeedX}
    call control_2_players_ball_angle_from_left_paddle
    call msx2_sfx_hit
    jp control_2_players_ball_y

control_2_players_ball_store_x:
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), b
    jp control_2_players_ball_y

control_2_players_ball_reset_left:
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), 120
    ld hl, msx2_enemy_runtime_y + 1
    ld (hl), 88
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), ${ballSpeedXNeg}
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), ${ballSpeedY}
    call msx2_sfx_fire
    ret

control_2_players_ball_reset_right:
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), 120
    ld hl, msx2_enemy_runtime_y + 1
    ld (hl), 88
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), ${ballSpeedX}
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), ${ballSpeedYNeg}
    call msx2_sfx_fire
    ret

control_2_players_ball_angle_from_right_paddle:
    ; Sets Pong ball DY from impact point on the right paddle. Clobbers AF/BC/HL.
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld a, b
    cp (hl)
    jp c, control_2_players_ball_angle_steep_up
    sub (hl)
    jp control_2_players_ball_store_angle

control_2_players_ball_angle_from_left_paddle:
    ; Sets Pong ball DY from impact point on the left paddle. Clobbers AF/BC/HL.
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    ld c, a
    ld a, b
    cp c
    jp c, control_2_players_ball_angle_steep_up
    sub c
    jp control_2_players_ball_store_angle

control_2_players_ball_store_angle:
    ; A=ball center relative to paddle top. Produces six vertical angles.
    cp 4
    jp c, control_2_players_ball_angle_store_steep_up
    cp 8
    jp c, control_2_players_ball_angle_store_up
    cp 13
    jp c, control_2_players_ball_angle_store_soft_up
    cp 17
    jp c, control_2_players_ball_angle_store_soft_down
    cp 19
    jp c, control_2_players_ball_angle_store_down
    ld a, 3
    jp control_2_players_ball_angle_store_dy
control_2_players_ball_angle_steep_up:
control_2_players_ball_angle_store_steep_up:
    ld a, #FD
    jp control_2_players_ball_angle_store_dy
control_2_players_ball_angle_store_up:
    ld a, #FE
    jp control_2_players_ball_angle_store_dy
control_2_players_ball_angle_store_soft_up:
    ld a, #FF
    jp control_2_players_ball_angle_store_dy
control_2_players_ball_angle_store_soft_down:
    ld a, 1
    jp control_2_players_ball_angle_store_dy
control_2_players_ball_angle_store_down:
    ld a, 2
control_2_players_ball_angle_store_dy:
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), a
    ret

control_2_players_ball_y:
    ld hl, msx2_enemy_runtime_dy + 1
    ld a, (hl)
    bit 7, a
    jp nz, control_2_players_ball_up
control_2_players_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, c
    cp ${control2PlayersBounds.maxY}
    jp nc, control_2_players_ball_turn_up
    ld (hl), a
    jp control_2_players_ball_check_item
control_2_players_ball_turn_up:
    ld (hl), ${control2PlayersBounds.maxY}
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), ${ballSpeedYNeg}
    call msx2_sfx_hit
    jp control_2_players_ball_check_item
control_2_players_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    sub c
    jp c, control_2_players_ball_turn_down
    cp ${control2PlayersBounds.minY}
    jp c, control_2_players_ball_turn_down
    ld (hl), a
    jp control_2_players_ball_check_item
control_2_players_ball_turn_down:
    ld (hl), ${control2PlayersBounds.minY}
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), ${ballSpeedY}
    call msx2_sfx_hit
    jp control_2_players_ball_check_item

control_2_players_ball_check_item:
    ; Pong-specific ball/item collision. Effect 3 marks the shoot item target.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x + 1
    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, control_2_players_ball_collect_item
    pop bc
    ret
control_2_players_ball_collect_item:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy + 1
    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 50
    ld (msx2_score_lo), a
    jp nc, .score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
    call msx2_sfx_fire
    ret
` : '';

  const statusHudAsm = `draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
    ; Native SCREEN 4 HUD authoring is exported as metadata for now.
    ; Runtime drawing is intentionally data-driven work, not hardcoded bars.
    ret
`;

  const stageBannerAsm = stageBannerEnabled ? `
load_msx2_stage_font:
    ; Loads the tiny STAGE 1/2 font into unused SCREEN 4 char slots. Clobbers AF/BC/DE/HL.
    ld hl, msx2_stage_font_patterns
    ld de, #0780
    ld bc, 56
    call LDIRVM
    ld hl, msx2_stage_font_patterns
    ld de, #0F80
    ld bc, 56
    call LDIRVM
    ld hl, msx2_stage_font_patterns
    ld de, #1780
    ld bc, 56
    call LDIRVM
    ld a, #51
    ld hl, #2780
    ld bc, 56
    call FILVRM
    ld a, #51
    ld hl, #2F80
    ld bc, 56
    call FILVRM
    ld a, #51
    ld hl, #3780
    ld bc, 56
    jp FILVRM

draw_msx2_stage_banner:
    ; Draws STAGE 1/2 centered in the SCREEN 4 name table. Clobbers AF/BC/DE/HL.
    call load_msx2_stage_font
    ld hl, #1970
    ld a, #F0
    call WRTVRM
    inc hl
    ld a, #F1
    call WRTVRM
    inc hl
    ld a, #F2
    call WRTVRM
    inc hl
    ld a, #F3
    call WRTVRM
    inc hl
    ld a, #F4
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    inc hl
    ld a, (msx2_current_screen_index)
    or a
    jp z, .stage_one_digit
    ld a, #F6
    jp .stage_write_digit
.stage_one_digit:
    ld a, #F5
.stage_write_digit:
    jp WRTVRM

wait_msx2_stage_banner:
    ; Keeps the centered stage banner visible for about one second at 60 Hz.
    ; Clobbers AF/B.
    ld b, 60
.stage_wait_loop:
    call wait_frame_busy
    djnz .stage_wait_loop
    ret
` : `
draw_msx2_stage_banner:
wait_msx2_stage_banner:
    ; Stage banners are omitted when the active MSX2 slice has no shooter wave flow.
    ret
`;
  return `${statusHudAsm}
draw_msx2_game_over_banner:
    ; Final-state feedback: red backdrop. Normal screen reload restores black.
    ; Clobbers BC.
    ld bc, #0607
    call WRTVDP
    ret

draw_msx2_level_complete_banner:
    ; Final-state feedback: green backdrop. Normal screen reload restores black.
    ; Clobbers BC.
    ld bc, #0307
    call WRTVDP
    ret

${stageBannerAsm}
reset_msx2_status_border:
    ; Clear final-state border feedback after restart/continue. Clobbers BC.
    ld bc, #0007
    call WRTVDP
    ret

update_msx2_air_timer:
    ; Decrements the SCREEN 4 air/time resource on a coarse frame divider. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_air_value)
    or a
    ret z
    ld a, (msx2_air_frame_counter)
    inc a
    cp 48
    jp nc, .air_tick
    ld (msx2_air_frame_counter), a
    ret
.air_tick:
    xor a
    ld (msx2_air_frame_counter), a
    ld a, (msx2_air_value)
    or a
    jp z, .air_empty
    dec a
    ld (msx2_air_value), a
    call draw_msx2_air_hud
    ld a, (msx2_air_value)
    or a
    ret nz
.air_empty:
    ld a, 1
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

${mazeMovementInputAsm}
${control2PlayersInputAsm}
update_hardware_sprite_input_paddle_horizontal:
    ; Pong/Arkanoid paddle control: left/right only, no jump/gravity and no bullet engine.
    ; Clobbers AF/BC/DE/HL.
    jp update_hardware_sprite_input_shooter_horizontal

update_hardware_sprite_input_shooter_horizontal:
    ; Galaxian-style horizontal player control: left/right only, no jump/gravity.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 2
    jp z, move_hardware_sprite_right_flat
    cp 3
    jp z, move_hardware_sprite_right_flat
    cp 4
    jp z, move_hardware_sprite_right_flat
    cp 6
    jp z, move_hardware_sprite_left_flat
    cp 7
    jp z, move_hardware_sprite_left_flat
    cp 8
    jp z, move_hardware_sprite_left_flat
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right_flat:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    jp nc, upload_hardware_sprite_attrs
${paddleHorizontal || shooterHorizontal ? `    add a, ${horizontalMoveSpeed}
    cp ${patrolBounds.maxX}
    jp c, .store_hardware_sprite_right_flat
    ld a, ${patrolBounds.maxX}
.store_hardware_sprite_right_flat:
` : `    inc a
`}
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_left_flat:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    jp z, upload_hardware_sprite_attrs
    jp c, upload_hardware_sprite_attrs
${paddleHorizontal || shooterHorizontal ? `    sub ${horizontalMoveSpeed}
    jp nc, .check_hardware_sprite_left_flat_min
    ld a, ${patrolBounds.minX}
    jp .store_hardware_sprite_left_flat
.check_hardware_sprite_left_flat_min:
    cp ${patrolBounds.minX}
    jp nc, .store_hardware_sprite_left_flat
    ld a, ${patrolBounds.minX}
.store_hardware_sprite_left_flat:
` : `    dec a
`}
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

update_msx2_player_bullet:
    ; Player bullet pool for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_cooldown)
    or a
    jp z, .bullet_cooldown_done
    dec a
    ld (msx2_player_bullet_cooldown), a
.bullet_cooldown_done:
    call update_msx2_player_bullet_slot_0
${secondPlayerBullet ? '    call update_msx2_player_bullet_slot_1\n' : ''}
    jp .bullet_try_fire

update_msx2_player_bullet_slot_0:
    ld a, (msx2_player_bullet_active)
    or a
    ret z
    ld a, (msx2_player_bullet_y)
    cp 8
    jp c, .bullet_deactivate_0
    sub ${playerBulletSpeedY}
    ld (msx2_player_bullet_y), a
    call msx2_player_bullet_check_effect_collision
    ld a, (msx2_player_bullet_active)
    or a
    ret z
    call msx2_player_bullet_check_enemy_collision
    ret
.bullet_deactivate_0:
    xor a
    ld (msx2_player_bullet_active), a
    ret

${secondPlayerBullet ? `update_msx2_player_bullet_slot_1:
    ld a, (msx2_player_bullet_1_active)
    or a
    ret z
    ld a, (msx2_player_bullet_1_y)
    cp 8
    jp c, .bullet_deactivate_1
    sub ${playerBulletSpeedY}
    ld (msx2_player_bullet_1_y), a
    call msx2_player_bullet_1_check_effect_collision
    ld a, (msx2_player_bullet_1_active)
    or a
    ret z
    call msx2_player_bullet_1_check_enemy_collision
    ret
.bullet_deactivate_1:
    xor a
    ld (msx2_player_bullet_1_active), a
    ret
` : ''}
.bullet_try_fire:
    ld a, (msx2_player_bullet_cooldown)
    or a
    ret nz
    call msx2_control_action_pressed
    or a
    ret z
.bullet_fire_pressed:
    ld a, (msx2_player_bullet_active)
    or a
    jp z, .bullet_spawn_slot_0
${secondPlayerBullet ? `
    ld a, (msx2_player_bullet_1_active)
    or a
    ret nz
    jp .bullet_spawn_slot_1
` : '    ret\n'}
.bullet_spawn_slot_0:
    ld a, (msx2_player_sprite_x)
    add a, 6
    ld (msx2_player_bullet_x), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_spawn_top
    sub 8
    jp .bullet_spawn_store_y
.bullet_spawn_top:
    xor a
.bullet_spawn_store_y:
    ld (msx2_player_bullet_y), a
    ld a, 1
    ld (msx2_player_bullet_active), a
    ld a, ${playerBulletCooldownFrames}
    ld (msx2_player_bullet_cooldown), a
    call msx2_sfx_fire
    ret
${secondPlayerBullet ? `.bullet_spawn_slot_1:
    ld a, (msx2_player_sprite_x)
    add a, 6
    ld (msx2_player_bullet_1_x), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_1_spawn_top
    sub 8
    jp .bullet_1_spawn_store_y
.bullet_1_spawn_top:
    xor a
.bullet_1_spawn_store_y:
    ld (msx2_player_bullet_1_y), a
    ld a, 1
    ld (msx2_player_bullet_1_active), a
    ld a, 8
    ld (msx2_player_bullet_cooldown), a
    call msx2_sfx_fire
    ret
` : ''}

msx2_play_psg_sfx:
    ; HL=register/value table, B=pair count. Clobbers AF/B/HL.
.sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .sfx_loop
    ret

msx2_sfx_fire:
    ld hl, msx2_sfx_fire_data
    ld b, 6
    jp msx2_play_psg_sfx

msx2_sfx_hit:
    ld hl, msx2_sfx_hit_data
    ld b, 6
    jp msx2_play_psg_sfx

msx2_sfx_fire_data:
    db 7,#3E,0,#38,1,#00,11,#30,8,#10,13,#09
msx2_sfx_hit_data:
    db 7,#37,6,#12,11,#70,12,#00,8,#10,13,#00

msx2_player_bullet_check_enemy_collision:
    ; Hides the hit enemy slot and increments the internal score. Clobbers AF/BC/DE/HL.
${bulletEnemyCollisionChecks}    ret

msx2_player_bullet_check_effect_collision:
    ; Clears a destructible effect cell hit by the player projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .player_bullet_effect_hit
    pop bc
    ret
.player_bullet_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_player_bullet_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret

${secondPlayerBullet ? `msx2_player_bullet_1_check_enemy_collision:
    ; Hides the hit enemy slot and increments the internal score. Clobbers AF/BC/DE/HL.
${bullet1EnemyCollisionChecks}    ret

msx2_player_bullet_1_check_effect_collision:
    ; Clears a destructible effect cell hit by the second player projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .player_bullet_1_effect_hit
    pop bc
    ret
.player_bullet_1_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_player_bullet_1_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret
` : ''}

msx2_check_enemy_wave_complete:
    ; Completes Galaxian-style screens when every active enemy slot is hidden. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    or a
    ret z
${enemyWaveCompleteChecks}    ld a, 1
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_enemy_bullet_active), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

update_msx2_enemy_bullet:
    ; Single enemy projectile for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_enemy_bullet_cooldown)
    or a
    jp z, .enemy_bullet_cooldown_done
    dec a
    ld (msx2_enemy_bullet_cooldown), a
.enemy_bullet_cooldown_done:
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_try_spawn
    ld a, (msx2_enemy_bullet_y)
    cp 204
    jp nc, .enemy_bullet_deactivate
    add a, 2
    ld (msx2_enemy_bullet_y), a
    call msx2_enemy_bullet_check_effect_collision
    ld a, (msx2_enemy_bullet_active)
    or a
    ret z
    call msx2_enemy_bullet_check_player_collision
    ret
.enemy_bullet_deactivate:
    xor a
    ld (msx2_enemy_bullet_active), a
    ret
.enemy_bullet_try_spawn:
    ld a, (msx2_enemy_bullet_cooldown)
    or a
    ret nz
${enemyBulletSpawnChecks}    ret

msx2_enemy_bullet_check_player_collision:
    ; Collides enemy projectile with player 16x16 body. Clobbers AF/BC/DE/HL.
    ld a, (msx2_enemy_bullet_y)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_y)
    ld b, a
    ld a, c
    cp b
    ret c
    ld a, b
    add a, 15
    cp c
    ret c
    ld a, (msx2_enemy_bullet_x)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, c
    cp b
    ret c
    ld a, b
    add a, 15
    cp c
    ret c
    xor a
    ld (msx2_enemy_bullet_active), a
    ld a, 80
    ld (msx2_enemy_bullet_cooldown), a
    call msx2_sfx_hit
    call msx2_apply_damage_respawn
    ret

msx2_enemy_bullet_check_effect_collision:
    ; Clears a destructible effect cell hit by an enemy projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_enemy_bullet_x)
    add a, 4
    ld b, a
    ld a, (msx2_enemy_bullet_y)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_bullet_effect_hit
    pop bc
    ret
.enemy_bullet_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_enemy_bullet_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret

update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right plus jump/gravity.
    ; Clobbers AF/BC/DE/HL.
${mazeMovement ? '    jp update_hardware_sprite_input_maze\n' : ''}
${control2Players ? '    jp update_hardware_sprite_input_control_2_players\n' : ''}
${paddleHorizontal ? '    jp update_hardware_sprite_input_paddle_horizontal\n' : ''}
${shooterHorizontal ? '    jp update_hardware_sprite_input_shooter_horizontal\n' : ''}
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 1
    jp z, try_msx2_ladder_up
    cp 2
    jp z, try_msx2_ladder_up_or_right
    cp 8
    jp z, try_msx2_ladder_up_or_left
    cp 5
    jp z, try_msx2_ladder_down
    cp 4
    jp z, try_msx2_ladder_down_or_right
    cp 6
    jp z, try_msx2_ladder_down_or_left
    cp 2
    jp z, move_hardware_sprite_right
    cp 3
    jp z, move_hardware_sprite_right
    cp 4
    jp z, move_hardware_sprite_right
    cp 6
    jp z, move_hardware_sprite_left
    cp 7
    jp z, move_hardware_sprite_left
    cp 8
    jp z, move_hardware_sprite_left
    jp update_hardware_sprite_vertical

try_msx2_ladder_up:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp update_hardware_sprite_vertical

try_msx2_ladder_up_or_right:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp move_hardware_sprite_right

try_msx2_ladder_up_or_left:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp move_hardware_sprite_left

try_msx2_ladder_down:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp update_hardware_sprite_vertical

try_msx2_ladder_down_or_right:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp move_hardware_sprite_right

try_msx2_ladder_down_or_left:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp move_hardware_sprite_left

move_msx2_ladder_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

move_msx2_ladder_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

hold_msx2_rope:
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .right_blocked
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move
.right_blocked:
    xor a
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move

move_hardware_sprite_left:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .left_blocked
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move
.left_blocked:
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move

finish_msx2_horizontal_move:
    call msx2_rope_at_player_center
    jp z, hold_msx2_rope
    jp update_hardware_sprite_vertical

msx2_game_over_idle:
    ld a, (msx2_game_over_restart_lock)
    or a
    jp z, .restart_action_check
    call msx2_control_action_pressed
    or a
    jp nz, .draw_game_over
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .draw_game_over
    xor a
    ld (msx2_game_over_restart_lock), a
    jp .draw_game_over
.restart_action_check:
    call msx2_control_action_pressed
    or a
    jp nz, msx2_restart_game
.restart_space_check:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, msx2_restart_game
.draw_game_over:
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

msx2_level_complete_idle:
    call msx2_control_action_pressed
    or a
    jp z, .continue_space_released
    ld a, (msx2_level_continue_lock)
    or a
    jp z, msx2_continue_after_level_complete
    jp .draw_level_complete
.continue_space_released:
    xor a
    ld (msx2_level_continue_lock), a
.draw_level_complete:
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

msx2_continue_after_level_complete:
    call msx2_advance_to_next_wave_screen
    call init_msx2_effect_buffers
    call load_current_msx2_screen4
    call reset_msx2_status_border
    call draw_msx2_stage_banner
    call wait_msx2_stage_banner
    call load_current_msx2_screen4
    xor a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_player_dead_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld (msx2_player_jump_lock), a
    call write_hardware_sprite_attrs
    ret

msx2_advance_to_next_wave_screen:
    ; Advances to the next referenced SCREEN 4 sector, wrapping after the final wave. Clobbers AF.
    ld a, (msx2_current_screen_index)
    inc a
    cp ${Math.max(1, Math.min(255, tileScreenCount))}
    jp c, .store_next_wave_screen
    xor a
.store_next_wave_screen:
    ld (msx2_current_screen_index), a
    ret

msx2_restart_game:
    ld a, ${Math.max(0, Math.min(255, restartScreenIndex))}
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_${restartScreenLabel}_screen4
    call reset_msx2_status_border
    xor a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld (msx2_player_jump_lock), a
    call write_hardware_sprite_attrs
    ret

auto_patrol_hardware_sprite:
    ; Move every 4 frames so the sprite visibly patrols without racing.
    ld a, (msx2_player_sprite_frame)
    inc a
    and 3
    ld (msx2_player_sprite_frame), a
    jp nz, update_hardware_sprite_vertical
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, move_hardware_sprite_left
    jp move_hardware_sprite_right

update_hardware_sprite_vertical:
    ; Jump uses the MSX2 GameFlow Controls logical jump mapping. Gravity is 1 px/frame.
    ; Clobbers AF/BC/DE/HL.
${mazeMovement ? `    ; Maze/Pac-Man mode has no platform vertical physics.
    jp upload_hardware_sprite_attrs
` : ''}${shooterHorizontal ? `    ; Shooter mode has no platform vertical physics.
    jp upload_hardware_sprite_attrs
` : ''}
    call msx2_control_jump_pressed
    or a
    jp z, .space_released
    ld a, (msx2_player_jump_lock)
    or a
    jp nz, .after_jump_input
    ld a, (msx2_player_on_ground)
    or a
    jp z, .after_jump_input
    ld a, 22
    ld (msx2_player_jump_frames), a
    xor a
    ld (msx2_player_on_ground), a
    ld a, 1
    ld (msx2_player_jump_lock), a
    jp .after_jump_input
.space_released:
    xor a
    ld (msx2_player_jump_lock), a
.after_jump_input:
    call msx2_rope_at_player_center
    jp z, hold_msx2_rope
    ld a, (msx2_player_jump_frames)
    or a
    jp z, apply_hardware_sprite_gravity
    ld a, (msx2_player_sprite_y)
    or a
    jp z, .cancel_jump
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, .cancel_jump
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    ld a, (msx2_player_jump_frames)
    dec a
    ld (msx2_player_jump_frames), a
    jp upload_hardware_sprite_attrs
.cancel_jump:
    xor a
    ld (msx2_player_jump_frames), a
    jp upload_hardware_sprite_attrs

apply_hardware_sprite_gravity:
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .grounded
    xor a
    ld (msx2_player_on_ground), a
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs
.grounded:
    ld a, 1
    ld (msx2_player_on_ground), a
    call apply_msx2_conveyor
    jp upload_hardware_sprite_attrs

apply_msx2_conveyor:
    ; Behavior code 2 pushes right, code 3 pushes left. Clobbers AF/BC/DE/HL.
    call msx2_behavior_below_player_center
    cp 2
    jp z, .conveyor_right
    cp 3
    jp z, .conveyor_left
    ret
.conveyor_right:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    ret nc
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ret
.conveyor_left:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    ret z
    ret c
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    ret

${playerAnimationRoutine}write_hardware_sprite_attrs:
    ; Writes player and enemy sprite attributes to the SCREEN 4 SAT. Clobbers AF/BC/DE/HL.
${attrWrites}
${enemyAttrWrites}${playerBulletAttrWrite}${enemyBulletAttrWrite}${hudLivesAttrWrite}    ld a, 208
    ld hl, #${terminatorAttrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:
${animationFrameCount > 1 ? '    call update_msx2_player_sprite_animation\n' : ''}${shooterHorizontal ? '    call update_msx2_player_bullet\n    call update_msx2_enemy_bullet\n' : ''}
    call update_msx2_effect_state
${paddleHorizontal ? `    ld a, (msx2_player_bullet_active)
    or a
    jp z, .paddle_serve_not_pending
    call msx2_control_action_pressed
    or a
    jp nz, .paddle_serve_launch
.paddle_serve_space_released:
    xor a
    ld (msx2_player_jump_lock), a
.paddle_serve_follow:
    ld a, (msx2_player_sprite_x)
    add a, 20
    ld (msx2_enemy_runtime_x), a
    call write_hardware_sprite_attrs
    ret
.paddle_serve_launch:
    ld a, (msx2_player_jump_lock)
    or a
    jp nz, .paddle_serve_follow
    xor a
    ld (msx2_player_bullet_active), a
    ld a, #${ballLaunchDy.toString(16).toUpperCase().padStart(2, '0')}
    ld (msx2_enemy_runtime_dy), a
.paddle_serve_not_pending:
` : ''}${usesSnakeGrowth(analysis) ? '    call msx2_try_stamp_snake_growth\n' : ''}    call update_msx2_enemy_positions
    call update_msx2_enemy_state
    call write_hardware_sprite_attrs
    ret

msx2_reset_enemy_runtime_for_current_screen:
    ; Copy static enemy slots for current screen into mutable runtime RAM.
    ; Clobbers AF/BC/DE/HL.
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_x
    add hl, de
    ld de, msx2_enemy_runtime_x
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_y
    add hl, de
    ld de, msx2_enemy_runtime_y
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_dx
    add hl, de
    ld de, msx2_enemy_runtime_dx
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_dy
    add hl, de
    ld de, msx2_enemy_runtime_dy
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_mode
    add hl, de
    ld de, msx2_enemy_runtime_mode
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_speed
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${buildEnemyScreenSlotOffsetAsm()}
    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_tick
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
${shooterHorizontal ? '    call msx2_init_galaxian_attack_runtime\n' : ''}
    ret

update_msx2_enemy_positions:
    ; Move active enemy/hazard runtime slots before collision checks.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
${shooterHorizontal ? `    call update_msx2_galaxian_attack_scheduler
    ld a, (msx2_runtime_frame_counter)
    inc a
    and 1
    ld (msx2_runtime_frame_counter), a
    ret nz
` : ''}${enemySlotMovementRoutines}    ret

${control2PlayersBallAsm}
${shooterHorizontal ? `msx2_init_galaxian_attack_runtime:
    ; Dive attackers wait in formation until the scheduler sets their tick to 0.
    ; Clobbers AF/B/HL.
    xor a
    ld (msx2_attack_timer), a
    ld hl, msx2_enemy_runtime_tick
    ld b, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ld a, #FF
.galaxian_attack_init_loop:
    ld (hl), a
    inc hl
    djnz .galaxian_attack_init_loop
    ret

update_msx2_galaxian_attack_scheduler:
    ; Attack Wave component: every configured interval, choose random formation enemies to attack.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_attack_interval
    add hl, de
    ld b, (hl)
    ld hl, msx2_attack_timer
    inc (hl)
    ld a, (hl)
    cp b
    jr nc, .galaxian_attack_launch
    ret
.galaxian_attack_launch:
    ld (hl), 0
    ld hl, msx2_screen_attack_seed
    add hl, de
    ld a, (msx2_attack_cursor)
    add a, (hl)
    ld b, a
    and 3
    jr nz, .galaxian_attack_clamp_max
    inc a
.galaxian_attack_clamp_max:
    ld c, a
    ld hl, msx2_screen_attack_max
    add hl, de
    ld a, (hl)
    cp c
    jr nc, .galaxian_attack_clamp_min
    ld c, a
.galaxian_attack_clamp_min:
    ld hl, msx2_screen_attack_min
    add hl, de
    ld a, c
    cp (hl)
    jr nc, .galaxian_attack_count_ready
    ld c, (hl)
.galaxian_attack_count_ready:
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld d, (hl)
    ld a, d
    or a
    ret z
    ld a, (msx2_attack_cursor)
    add a, b
.galaxian_attack_cursor_wrap:
    cp d
    jr c, .galaxian_attack_cursor_ready
    sub d
    jr .galaxian_attack_cursor_wrap
.galaxian_attack_cursor_ready:
    ld (msx2_attack_cursor), a
    ld b, d
.galaxian_attack_loop:
    ld a, c
    or a
    ret z
    ld a, (msx2_attack_cursor)
    call msx2_activate_galaxian_attack_slot
    ld a, (msx2_attack_cursor)
    inc a
    cp b
    jr c, .galaxian_attack_store_cursor
    xor a
.galaxian_attack_store_cursor:
    ld (msx2_attack_cursor), a
    dec c
    jr .galaxian_attack_loop

msx2_activate_galaxian_attack_slot:
    ; A=slot index. Galaxian shooter screens use attack-capable enemy slots. Clobbers DE/HL.
    ld e, a
    ld d, 0
    ld hl, msx2_enemy_runtime_tick
    add hl, de
    ld (hl), 0
    ld hl, msx2_enemy_runtime_dx
    add hl, de
    ld a, (hl)
    or a
    ret nz
    ld a, 1
    ld (hl), a
    ret

` : ''}
${enemySlotMovementHandlers}

msx2_apply_damage_respawn:
    ; Shared damage path for effect hazards and entity enemies.
    ; Clobbers AF/DE/HL.
    ld a, 1
    ld (msx2_player_dead_flag), a
    ld a, (msx2_lives)
    or a
    jp z, .damage_game_over
    dec a
    ld (msx2_lives), a
    jp nz, .damage_after_lives
.damage_game_over:
    ld a, 1
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
.damage_after_lives:
    call draw_msx2_lives_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, (msx2_game_over_flag)
    or a
    ret z
    call draw_msx2_game_over_banner
    ret

update_msx2_enemy_state:
    ; Uses enemy/hazard entities for the active screen as tile-sized damage bodies.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_enemy_damage_cooldown)
    or a
    jp z, .enemy_cooldown_ready
    dec a
    ld (msx2_enemy_damage_cooldown), a
    ret
.enemy_cooldown_ready:
${enemySlotCollisionChecks}    ret
.enemy_damage:
    ld a, 1
    ld (msx2_enemy_hit_flag), a
    ld a, 255
    ld (msx2_enemy_damage_cooldown), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret

update_msx2_effect_state:
    ; Effect layer contract: 1=hazard, 2=exit, 3=collectible.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_effect_at_pixel
    or a
    jp z, .no_effect
    cp 1
    jp z, .hazard
    cp 2
    jp z, .exit
    cp 3
    jp z, .collectible
    ret
.no_effect:
    xor a
    ld (msx2_collectible_latch), a
    ret
.hazard:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.exit:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    jp c, .exit_locked
    ld a, 1
    ld (msx2_exit_reached_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_exit_blocked_flag), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret
.exit_locked:
    ld a, 1
    ld (msx2_exit_blocked_flag), a
    ret
.collectible:
    ld a, (msx2_collectible_latch)
    or a
    ret nz
    xor a
    ld (hl), a
    call clear_msx2_collectible_visual
    ld a, 1
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    ret nc
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
${usesSnakeGrowth(analysis) ? `    ld a, (msx2_snake_growth_pending)
    cp 15
    jp nc, .snake_growth_full
    inc a
    ld (msx2_snake_growth_pending), a
.snake_growth_full:
` : ''}    call draw_msx2_collectible_hud
    ret

${usesSnakeGrowth(analysis) ? `msx2_try_stamp_snake_growth:
    ; SnakeGrowth component: marks one SCREEN 4 name-table cell when growth is pending.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_snake_growth_pending)
    or a
    ret z
    ld a, (msx2_player_sprite_x)
    and #0F
    ret nz
    ld a, (msx2_player_sprite_y)
    and #0F
    ret nz
    call screen4_name_cell_from_player
    call clear_screen4_name_cell_16
    ld a, (msx2_snake_growth_pending)
    dec a
    ld (msx2_snake_growth_pending), a
    ret

` : ''}
msx2_compare_collectibles_required:
    ; Compares current collected count with the active screen requirement.
    ; Carry set means collected < required. Clobbers AF/HL, preserves BC/DE.
    ld a, (msx2_current_screen_index)
    ld hl, msx2_screen_required_collectibles
    add a, l
    ld l, a
    ld a, h
    adc a, 0
    ld h, a
    ld a, (msx2_collectible_count)
    cp (hl)
    ret

msx2_load_current_screen_air:
    ; Loads the active screen initial air value. Clobbers AF/HL, preserves BC/DE.
    xor a
    ld (msx2_air_frame_counter), a
    ld a, (msx2_current_screen_index)
    ld hl, msx2_screen_initial_air
    add a, l
    ld l, a
    ld a, h
    adc a, 0
    ld h, a
    ld a, (hl)
    ld (msx2_air_value), a
    ret

msx2_reset_screen_transition_flags:
    ; Clears transient per-screen event flags on WorldMap entry. Clobbers AF only.
    xor a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_latch), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ret

clear_msx2_collectible_visual:
    ; Clears the 16x16 visual tile under the active collectible cell.
    ; Clobbers AF/BC/DE/HL.
    call screen4_name_cell_from_player
    call clear_screen4_name_cell_16
    ret

clear_msx2_effect_visual_at_pixel:
    ; B=x pixel, C=y pixel. Clears the containing 16x16 SCREEN 4 name-table cell.
    ; Clobbers AF/BC/DE/HL.
    call screen4_name_cell_from_bc
    call clear_screen4_name_cell_16
    ret

screen4_name_cell_from_player:
    ; Returns HL=top-left name-table address for the player's 16x16 cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_y)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (msx2_player_sprite_x)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    ret

screen4_name_cell_from_bc:
    ; B=x pixel, C=y pixel. Returns HL=top-left name-table address for the containing 16x16 cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    ret

msx2_collision_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=collision byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_collision_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_effect_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=effect byte with Z set when empty.
    ; HL points at the effect cell so callers may clear mutable RAM effects.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_effects_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_behavior_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=behavior byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_behavior_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_ladder_at_player_center:
    ; Returns Z when the player center is on behavior code 1 (ladder). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_behavior_at_pixel
    cp 1
    ret

msx2_ladder_below_player_center:
    ; Returns Z when the lower center is on behavior code 1 (ladder). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 10
    ld c, a
    call msx2_behavior_at_pixel
    cp 1
    ret

msx2_rope_at_player_center:
    ; Returns Z when the player center is on behavior code 4 (rope). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_behavior_at_pixel
    cp 4
    ret

msx2_behavior_below_player_center:
    ; Returns the behavior byte under the player feet. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_behavior_at_pixel
    ret

msx2_respawn_current_screen:
    ; Respawn at the player entity for the active msx2screen.
    ; Clobbers AF/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_spawn_x
    add hl, de
    ld a, (hl)
    ld (msx2_player_sprite_x), a
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_spawn_y
    add hl, de
    ld a, (hl)
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    inc a
    ld (msx2_player_jump_lock), a
${mazeMovement ? `    ld (msx2_player_sprite_dx), a
    ld (msx2_player_sprite_frame), a
` : ''}
    ret

`;
}

function buildHardwareSpriteDataAsm(analysis: ProjectAnalysis): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const y = clampHardwareSpriteY(settings.y);
  const x = clampHardwareSpriteX(settings.x);
  const color = Math.max(1, Math.min(15, settings.color));
  const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(sprite, color)).slice(0, MSX2_MAX_PLAYER_HARDWARE_LAYERS);
  const enemySprite = getEnemyHardwareSpriteSource(analysis);
  const enemySpriteLayer = enemySprite
    ? buildHardwareSpriteLayersForFrame(enemySprite, MSX2_ENEMY_SPRITE_COLOR, 0)[0]
    : undefined;
  const control2Players = usesControl2Players(analysis);
  const enemyHorizontalFacing = !control2Players && enemySprite ? getHorizontalFacingDirection(enemySprite) : undefined;
  const enemyMirroredPattern = enemyHorizontalFacing && enemySpriteLayer
    ? mirrorHardwareSpritePatternHorizontally(enemySpriteLayer.pattern)
    : undefined;
  // Pong reuses the player-bullet hardware slot for the ball, so pull its
  // pattern/colors from the ball asset when the project provides one.
  const pongBallSprite = control2Players ? getPongBallHardwareSpriteSource(analysis) : undefined;
  const pongBallSpriteLayer = pongBallSprite
    ? buildHardwareSpriteLayersForFrame(pongBallSprite, color, 0)[0]
    : undefined;
  const hideHud = isRuntimeHudHidden(analysis);
  const playerBulletSlotCount = getPlayerBulletSlotCount(analysis);
  const animationFrameCount = getHardwareSpriteAnimationFrameCount(sprite, layers.length);
  const frameLayerSets = Array.from({ length: animationFrameCount }, (_unused, frameIndex) => {
    const frameLayers = clampHardwareSpriteCount(buildHardwareSpriteLayersForFrame(sprite, color, frameIndex)).slice(0, layers.length);
    return layers.map((fallbackLayer, layerIndex) => frameLayers[layerIndex] || fallbackLayer);
  });
  const horizontalFacing = getHorizontalFacingDirection(sprite);
  const mirrorPatternVariantCount = horizontalFacing ? 2 : 1;
  const enemyPatternVariantCount = enemyHorizontalFacing ? 2 : 1;
  const mirroredFrameLayerSets = horizontalFacing
    ? frameLayerSets.map(frameLayers => frameLayers.map(layer => ({
        ...layer,
        pattern: mirrorHardwareSpritePatternHorizontally(layer.pattern),
      })))
    : [];
  const playerPatternGroupCount = layers.length * animationFrameCount * mirrorPatternVariantCount;
  const totalHardwarePatternGroups = playerPatternGroupCount + enemyPatternVariantCount + 2;
  const basePatternIndex = clampBasePatternIndex(settings.patternIndex, totalHardwarePatternGroups);
  const enemyPatternIndex = basePatternIndex + (playerPatternGroupCount * 4);
  const playerBulletPatternIndex = enemyPatternIndex + (enemyPatternVariantCount * 4);
  const enemyBulletPatternIndex = playerBulletPatternIndex + 4;
  const visibleAttributes = layers.flatMap((layer, layerIndex) => [
    clampHardwareSpriteY(y + layer.yOffset),
    clampHardwareSpriteX(x + layer.xOffset),
    basePatternIndex + (layerIndex * 4),
    0,
  ]);
  const enemyAttributes = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, () => [
    208,
    0,
    enemyPatternIndex,
    0,
  ]).flat();
  const playerBulletAttributes = Array.from({ length: playerBulletSlotCount }, () => [208, 0, playerBulletPatternIndex, 0]).flat();
  const enemyBulletAttributes = [208, 0, enemyBulletPatternIndex, 0];
  const hudLifeAttributes = hideHud ? [] : Array.from({ length: 3 }, (_unused, index) => [208, 8 + (index * 10), enemyBulletPatternIndex, 0]).flat();
  const terminator = [208, 0, 0, 0];
  const attributes = [...visibleAttributes, ...enemyAttributes, ...playerBulletAttributes, ...enemyBulletAttributes, ...hudLifeAttributes, ...terminator, ...Array(Math.max(0, 128 - visibleAttributes.length - enemyAttributes.length - playerBulletAttributes.length - enemyBulletAttributes.length - hudLifeAttributes.length - terminator.length)).fill(0)];

  return `
msx2_hw_sprite_patterns:
${frameLayerSets.map((frameLayers, frameIndex) => frameLayers.map((layer, layerIndex) => formatBytes(`msx2_hw_sprite_frame_${frameIndex}_pattern_${layerIndex}`, layer.pattern, `Hardware metasprite frame ${frameIndex} part ${layerIndex}: x+${layer.xOffset}, y+${layer.yOffset}`)).join('')).join('')}${mirroredFrameLayerSets.map((frameLayers, frameIndex) => frameLayers.map((layer, layerIndex) => formatBytes(`msx2_hw_sprite_frame_${frameIndex}_mirror_pattern_${layerIndex}`, layer.pattern, `Mirrored hardware metasprite frame ${frameIndex} part ${layerIndex}: authored ${horizontalFacing}`)).join('')).join('')}${formatBytes('msx2_hw_enemy_sprite_pattern', enemySpriteLayer?.pattern || MSX2_ENEMY_SPRITE_PATTERN, enemySpriteLayer ? 'Shared 16x16 enemy/hazard hardware sprite pattern from MSX2 entity sprite asset' : 'Shared 16x16 enemy/hazard hardware sprite pattern')}${enemyMirroredPattern ? formatBytes('msx2_hw_enemy_sprite_mirror_pattern', enemyMirroredPattern, `Mirrored shared enemy/hazard hardware sprite pattern: authored ${enemyHorizontalFacing}`) : ''}${formatBytes('msx2_hw_player_bullet_pattern', control2Players ? (pongBallSpriteLayer?.pattern || MSX2_PONG_BALL_PATTERN) : MSX2_PLAYER_BULLET_PATTERN, control2Players ? (pongBallSpriteLayer ? 'Shared 16x16 Pong ball hardware sprite pattern from MSX2 entity sprite asset' : 'Shared 16x16 Pong ball hardware sprite pattern') : 'Shared 16x16 player bullet hardware sprite pattern')}${formatBytes('msx2_hw_enemy_bullet_pattern', MSX2_ENEMY_BULLET_PATTERN, 'Shared 16x16 enemy bullet hardware sprite pattern')}msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
${layers.map((layer, index) => formatBytes(`msx2_hw_sprite_colors_${index}`, layer.colors, `Line colors for hardware sprite layer ${index}`)).join('')}${Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => formatBytes(`msx2_hw_enemy_sprite_colors_${index}`, enemySpriteLayer?.colors || Array(16).fill(MSX2_ENEMY_SPRITE_COLOR), enemySpriteLayer ? `Line colors for enemy/hazard hardware sprite slot ${index} from MSX2 entity sprite asset` : `Line colors for enemy/hazard hardware sprite slot ${index}`)).join('')}${formatBytes('msx2_hw_player_bullet_colors', control2Players ? (pongBallSpriteLayer?.colors || Array(16).fill(15)) : Array(16).fill(6), control2Players ? (pongBallSpriteLayer ? 'Line colors for Pong ball hardware sprite slot from MSX2 entity sprite asset' : 'Line colors for Pong ball hardware sprite slot') : 'Line colors for player bullet hardware sprite slot')}${formatBytes('msx2_hw_enemy_bullet_colors', Array(16).fill(8), 'Line colors for enemy bullet hardware sprite slot')}${hideHud ? '' : Array.from({ length: 3 }, (_unused, index) => formatBytes(`msx2_hw_hud_life_colors_${index}`, Array(16).fill(10), `Line colors for HUD life marker ${index + 1}`)).join('')}msx2_hw_sprite_colors_end:

${formatBytes('msx2_hw_sprite_attrs', attributes, `${layers.length} player hardware sprite(s), ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} enemy/hazard sprite slots, ${playerBulletSlotCount} player bullet slot, ${MSX2_ENEMY_BULLET_HARDWARE_SLOTS} enemy bullet slot${hideHud ? '' : ', 3 HUD life slots'}; next Y=208 terminates the SAT`)}
`;
}

function defaultTargetNodeId(connections: GameFlowConnection[] | undefined, nodeId: string): string | undefined {
  const connection = (connections || []).find((candidate: any) => {
    const fromNodeId = candidate.from?.nodeId || candidate.fromNodeId;
    return fromNodeId === nodeId && !candidate.from?.sourceId;
  }) as any;
  return connection?.to?.nodeId || connection?.toNodeId;
}

function sourceTargetNodeId(connections: GameFlowConnection[] | undefined, nodeId: string, sourceIds: string | string[] | undefined): string | undefined {
  const allowedSourceIds = Array.isArray(sourceIds) ? sourceIds.filter(Boolean) : sourceIds ? [sourceIds] : [];
  if (allowedSourceIds.length === 0) return undefined;
  for (const sourceId of allowedSourceIds) {
    const connection = (connections || []).find((candidate: any) => {
      const fromNodeId = candidate.from?.nodeId || candidate.fromNodeId;
      const fromSourceId = candidate.from?.sourceId || candidate.sourceId;
      return fromNodeId === nodeId && fromSourceId === sourceId;
    }) as any;
    if (connection) return connection?.to?.nodeId || connection?.toNodeId;
  }
  return undefined;
}

function validateMsx2GameFlowSubMenuEdges(graph: any): void {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const connections = Array.isArray(graph?.connections) ? graph.connections : [];
  const nodeIds = new Set(nodes.map((node: any) => node?.id).filter(Boolean));
  for (const connection of connections) {
    const fromNodeId = connection.from?.nodeId || connection.fromNodeId;
    const toNodeId = connection.to?.nodeId || connection.toNodeId;
    if (!nodeIds.has(fromNodeId) || !nodeIds.has(toNodeId)) {
      throw new Error('MSX2 SCREEN 4 GameFlow contains a connection to a missing node.');
    }
  }
  for (const node of nodes) {
    if (node?.type !== 'SubMenu') continue;
    const options = Array.isArray(node.options) ? node.options.slice(0, 6) : [];
    if (options.length === 0) {
      throw new Error(`MSX2 SCREEN 4 SubMenu node ${node.id} must include at least one option.`);
    }
    const optionIds = new Set(options.map((option: any) => option?.id).filter(Boolean));
    for (const option of options) {
      const optionConnections = connections.filter((connection: any) => {
        const fromNodeId = connection.from?.nodeId || connection.fromNodeId;
        const fromSourceId = connection.from?.sourceId || connection.sourceId;
        return fromNodeId === node.id && fromSourceId === option?.id;
      });
      if (optionConnections.length === 0) {
        throw new Error(`MSX2 SCREEN 4 SubMenu node ${node.id} option "${option?.text || option?.id || ''}" needs an outgoing connection.`);
      }
      if (optionConnections.length > 1) {
        throw new Error(`MSX2 SCREEN 4 SubMenu node ${node.id} option "${option?.text || option?.id || ''}" has more than one outgoing connection.`);
      }
    }
    for (const connection of connections) {
      const fromNodeId = connection.from?.nodeId || connection.fromNodeId;
      if (fromNodeId !== node.id) continue;
      const fromSourceId = connection.from?.sourceId || connection.sourceId;
      if (!fromSourceId || !optionIds.has(fromSourceId)) {
        throw new Error(`MSX2 SCREEN 4 SubMenu node ${node.id} has an outgoing connection for unknown option "${fromSourceId || 'default'}".`);
      }
    }
  }
}

function validateMsx2GameFlowMusicRuntime(graph: any): void {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  for (const node of nodes) {
    if (node?.type !== 'Music') continue;
    if (node.stop !== true && node.autoPlay !== false) {
      throw new Error(`MSX2 SCREEN 4 Music node ${node.id || ''} requests active playback, but tracker playback is not wired yet; use stop/autoPlay=false.`);
    }
  }
}

function getScreen4RuntimeGameFlow(analysis: ProjectAnalysis): any {
  const msx2Flow = ((analysis as any).msx2GameFlows || []).find((flow: any) => flow?.purpose === 'screen4-runtime');
  return msx2Flow || analysis.gameFlow;
}

function getFlowBackgroundScreenAssetId(node: any): string | undefined {
  return node?.appearance?.backgroundScreenAssetId || node?.backgroundScreenAssetId || node?.screenAssetId;
}

function resolveScreenByAssetId(analysis: ProjectAnalysis, assetId: string | undefined): ScreenMap | undefined {
  if (!assetId) return undefined;
  const assets = (analysis as any).assets as Array<{ id?: string; type?: string; data?: unknown }> | undefined;
  const asset = assets?.find(item => item.id === assetId && item.type === 'screenmap');
  if (asset?.data) return asset.data as ScreenMap;
  return (analysis.screenMaps || []).find(screen => screen.id === assetId);
}

function resolveTileScreenByAssetId(analysis: ProjectAnalysis, assetId: string | undefined): Msx2Screen4TileScreen | undefined {
  if (!assetId) return undefined;
  const assets = (analysis as any).assets as Array<{ id?: string; type?: string; data?: unknown }> | undefined;
  const asset = assets?.find(item => item.id === assetId && item.type === 'msx2screen');
  if (asset?.data) return asset.data as Msx2Screen4TileScreen;
  return (analysis.msx2Screens || []).find(screen => screen.id === assetId);
}

function resolveWorldByAssetId(analysis: ProjectAnalysis, worldAssetId: string | undefined): any | undefined {
  if (!worldAssetId) return undefined;
  return (analysis.worldmaps || []).find((candidate: any) => candidate?.id === worldAssetId);
}

function resolveWorldStartScreenAssetId(analysis: ProjectAnalysis, worldAssetId: string | undefined): string | undefined {
  const world = resolveWorldByAssetId(analysis, worldAssetId);
  const startNodeId = world?.startScreenNodeId || world?.startScreenId || world?.nodes?.[0]?.id;
  const startNode = world?.nodes?.find((node: any) => node?.id === startNodeId) || world?.nodes?.[0];
  return startNode?.screenAssetId || startNode?.screenId;
}

function getGameFlowWorldAssetId(node: any): string | undefined {
  return node?.worldAssetId || node?.data?.worldAssetId || node?.data?.worldMapId;
}

function collectReferencedScreens(analysis: ProjectAnalysis): ScreenMap[] {
  const graph = getScreen4RuntimeGameFlow(analysis);
  const screens = new Map<string, ScreenMap>();
  const addScreen = (screen: ScreenMap | undefined) => {
    if (!screen) return;
    screens.set(screen.id || screen.name || `screen_${screens.size}`, screen);
  };

  for (const node of graph?.nodes || []) {
    if (node.type === 'Screen4Screen') {
      addScreen(resolveScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    } else if (node.type === 'Text') {
      addScreen(resolveScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    } else if (node.type === 'TextScroll' || node.type === 'TextScrollColor') {
      addScreen(resolveScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    } else if (node.type === 'Controls') {
      addScreen(resolveScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    } else if (node.type === 'SubMenu') {
      addScreen(resolveScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    } else if (node.type === 'Restart') {
      addScreen(resolveScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    }
  }

  return Array.from(screens.values());
}

function collectReferencedTileScreens(analysis: ProjectAnalysis): Msx2Screen4TileScreen[] {
  const graph = getScreen4RuntimeGameFlow(analysis);
  const screens = new Map<string, Msx2Screen4TileScreen>();
  const addScreen = (screen: Msx2Screen4TileScreen | undefined) => {
    if (!screen) return;
    screens.set(screen.id || screen.name || `msx2_screen_${screens.size}`, screen);
  };

  for (const node of graph?.nodes || []) {
    if (node.type === 'Screen4Screen' || node.type === 'Text' || node.type === 'TextScroll' || node.type === 'TextScrollColor' || node.type === 'Controls' || node.type === 'SubMenu' || node.type === 'Restart') {
      addScreen(resolveTileScreenByAssetId(analysis, getFlowBackgroundScreenAssetId(node)));
    } else if (node.type === 'WorldLink') {
      const worldAssetId = getGameFlowWorldAssetId(node);
      const world = resolveWorldByAssetId(analysis, worldAssetId);
      addScreen(resolveTileScreenByAssetId(analysis, resolveWorldStartScreenAssetId(analysis, worldAssetId)));
      for (const worldNode of world?.nodes || []) {
        addScreen(resolveTileScreenByAssetId(analysis, worldNode?.screenAssetId || worldNode?.screenId));
      }
    }
  }

  if (screens.size === 0) {
    addScreen(analysis.msx2Screens?.[0]);
  }

  return Array.from(screens.values());
}

function assetKey(type: string | undefined, id: string | undefined): string {
  return `${type || 'unknown'}:${id || ''}`;
}

function getAssetIdFromData(asset: any): string | undefined {
  return asset?.id || asset?.data?.id;
}

function addIncludedAsset(
  included: Map<string, any>,
  asset: any,
  reason: string,
  extra: Record<string, unknown> = {}
): void {
  const id = getAssetIdFromData(asset);
  const key = assetKey(asset?.type, id);
  if (!id) return;
  if (included.has(key)) {
    const existing = included.get(key);
    const existingWorldIds = Array.isArray(existing.ownerWorldIds) ? existing.ownerWorldIds : [];
    const extraWorldIds = Array.isArray(extra.ownerWorldIds) ? extra.ownerWorldIds : [];
    const ownerWorldIds = Array.from(new Set([...existingWorldIds, ...extraWorldIds].filter(Boolean))).sort();
    if (ownerWorldIds.length > 0) existing.ownerWorldIds = ownerWorldIds;
    if (extra.ownerScreenId && !existing.ownerScreenId) existing.ownerScreenId = extra.ownerScreenId;
    return;
  }
  included.set(key, {
    type: asset.type,
    id,
    name: asset.name || asset.data?.name || id,
    reason,
    ...extra,
  });
}

function estimateSerializedByteSize(value: unknown): number {
  try {
    return JSON.stringify(value || {}).length;
  } catch (_error) {
    return 0;
  }
}

function getStorageDecisionForReadonlyData(rawBytes: number, accessPattern: string): string {
  if (accessPattern === 'load_to_vram') {
    return rawBytes > 512 ? 'ROM_ZX0_CANDIDATE_TO_VRAM' : 'ROM_RAW_TO_VRAM';
  }
  if (accessPattern === 'runtime_read') return 'ROM_RAW';
  if (accessPattern === 'manifest_read' || accessPattern === 'stream_or_runtime_read') return 'ROM_RAW';
  if (rawBytes < 64) return 'ROM_RAW';
  if (rawBytes <= 512) return 'ROM_RAW_UNLESS_ZX0_SAVES_25_PERCENT';
  return 'ROM_ZX0_CANDIDATE';
}

function estimateMsx2ScreenStoragePolicy(screen: Msx2Screen4TileScreen): Record<string, unknown> {
  const screenData = buildScreen4ScreenData(screen);
  const patternBytes = screenData.patternBanks.reduce((sum, bytes) => sum + bytes.length, 0);
  const colorBytes = screenData.colorBanks.reduce((sum, bytes) => sum + bytes.length, 0);
  const nameBytes = screenData.names.length;
  const collisionBytes = buildTileScreenLayerBytes(screen, 'collision').length;
  const effectsBytes = buildTileScreenLayerBytes(screen, 'effects').length;
  const behaviorBytes = buildTileScreenLayerBytes(screen, 'behavior').length;
  const spawnBytes = (screen.layers?.entities?.length || 0) * 8;
  const graphicsBytes = nameBytes + patternBytes + colorBytes;
  const runtimeReadBytes = collisionBytes + effectsBytes + behaviorBytes + spawnBytes;
  const rawBytes = graphicsBytes + runtimeReadBytes;
  return {
    rawBytes,
    storedBytesEstimate: rawBytes,
    accessPattern: 'mixed_load_to_vram_and_runtime_read',
    mutable: false,
    decision: graphicsBytes > 512 ? 'MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW' : 'MIXED_ROM_RAW_TO_VRAM_AND_ROM_RAW',
    reason: 'Reachable SCREEN 4 room: graphics are loaded to VRAM; layers/spawns stay as ROM/runtime data.',
    parts: [
      {
        name: 'nameTable',
        rawBytes: nameBytes,
        accessPattern: 'load_to_vram',
        decision: getStorageDecisionForReadonlyData(nameBytes, 'load_to_vram'),
      },
      {
        name: 'patterns',
        rawBytes: patternBytes,
        accessPattern: 'load_to_vram',
        decision: getStorageDecisionForReadonlyData(patternBytes, 'load_to_vram'),
      },
      {
        name: 'colors',
        rawBytes: colorBytes,
        accessPattern: 'load_to_vram',
        decision: getStorageDecisionForReadonlyData(colorBytes, 'load_to_vram'),
      },
      {
        name: 'runtimeLayersAndSpawns',
        rawBytes: runtimeReadBytes,
        accessPattern: 'runtime_read',
        decision: 'ROM_RAW',
      },
    ],
  };
}

function estimateMsx2SpriteStoragePolicy(analysis: ProjectAnalysis, sprite: Msx2Sprite): Record<string, unknown> {
  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const color = Math.max(1, Math.min(15, settings.color));
  const authoredLayers = buildHardwareSpriteLayers(sprite, color);
  const layers = clampHardwareSpriteCount(authoredLayers).slice(0, MSX2_MAX_PLAYER_HARDWARE_LAYERS);
  const animationFrameCount = getHardwareSpriteAnimationFrameCount(sprite, Math.max(1, layers.length));
  const horizontalFacing = getHorizontalFacingDirection(sprite);
  const mirrorPatternVariantCount = horizontalFacing ? 2 : 1;
  const cellColumns = Math.max(1, Math.ceil((sprite.size?.width || 16) / 16));
  const cellRows = Math.max(1, Math.ceil((sprite.size?.height || 16) / 16));
  const authoredParts = Array.isArray(sprite.superSpriteParts) && sprite.superSpriteParts.length
    ? sprite.superSpriteParts
    : Array.from({ length: cellRows }, (_unusedRow, cellY) =>
      Array.from({ length: cellColumns }, (_unusedColumn, cellX) => ({
        label: `${String.fromCharCode(65 + cellY * cellColumns + cellX)}`,
        offsetX: cellX * 16,
        offsetY: cellY * 16,
        width: 16,
        height: 16,
      }))
    ).flat();
  const hardwareLayerCountsByRow = Array.from({ length: cellRows }, (_unused, cellY) =>
    authoredLayers.filter(layer => layer.yOffset === cellY * 16).length
  );
  const worstScanlineHardwareSprites = Math.max(0, ...hardwareLayerCountsByRow);
  const patternBytes = Math.max(1, layers.length) * Math.max(1, animationFrameCount) * mirrorPatternVariantCount * 32;
  const colorBytes = Math.max(1, layers.length) * 16;
  const rawBytes = patternBytes + colorBytes;
  return {
    rawBytes,
    storedBytesEstimate: rawBytes,
    accessPattern: 'load_to_vram',
    mutable: false,
    decision: getStorageDecisionForReadonlyData(rawBytes, 'load_to_vram'),
    reason: 'Referenced MSX2 hardware sprite source; sprite patterns/colors are loaded to VRAM/SAT data.',
    superSpriteLayout: sprite.superSpriteLayout || `${cellColumns}x${cellRows}`,
    superSpriteParts: authoredParts.map(part => ({
      label: part.label,
      offsetX: part.offsetX,
      offsetY: part.offsetY,
      width: part.width,
      height: part.height,
    })),
    metaspriteCells: { columns: cellColumns, rows: cellRows, count: cellColumns * cellRows },
    hardwareLayerCount: authoredLayers.length,
    emittedHardwareLayerCount: layers.length,
    worstScanlineHardwareSprites,
    scanlineLimit: MSX2_MAX_PLAYER_HARDWARE_LAYERS,
    overScanlineLimit: worstScanlineHardwareSprites > MSX2_MAX_PLAYER_HARDWARE_LAYERS,
    parts: [
      { name: 'patterns', rawBytes: patternBytes, accessPattern: 'load_to_vram', decision: getStorageDecisionForReadonlyData(patternBytes, 'load_to_vram') },
      { name: 'lineColors', rawBytes: colorBytes, accessPattern: 'load_to_vram', decision: 'ROM_RAW_TO_VRAM' },
    ],
  };
}

function buildMsx2AssetStoragePolicy(
  analysis: ProjectAnalysis,
  includedAssets: any[],
  tileScreens: Msx2Screen4TileScreen[]
): any[] {
  const screenById = new Map(tileScreens.map(screen => [screen.id, screen]));
  const assetByKey = new Map<string, any>();
  for (const asset of (((analysis as any).assets || []) as any[])) {
    assetByKey.set(assetKey(asset?.type, getAssetIdFromData(asset)), asset);
  }
  return includedAssets.map(entry => {
    let policy: Record<string, unknown>;
    if (entry.type === 'msx2screen' && screenById.has(entry.id)) {
      policy = estimateMsx2ScreenStoragePolicy(screenById.get(entry.id)!);
    } else if (entry.type === 'msx2sprite') {
      const sprite = resolveMsx2SpriteById(analysis, entry.id);
      policy = sprite
        ? estimateMsx2SpriteStoragePolicy(analysis, sprite)
        : { rawBytes: 0, storedBytesEstimate: 0, accessPattern: 'load_to_vram', mutable: false, decision: 'ROM_RAW_TO_VRAM', reason: 'Referenced sprite asset was not resolved for byte estimation.' };
    } else if (entry.type === 'msx2screen_tile') {
      policy = {
        rawBytes: 64,
        storedBytesEstimate: 64,
        accessPattern: 'compiled_into_owner_screen',
        mutable: false,
        decision: 'INHERIT_OWNER_SCREEN_POLICY',
        reason: 'Tile bytes are emitted as part of the reachable SCREEN 4 room graphics.',
      };
    } else {
      const asset = assetByKey.get(assetKey(entry.type, entry.id));
      const rawBytes = estimateSerializedByteSize(asset?.data ?? asset);
      const accessPattern = entry.type === 'track' ? 'stream_or_runtime_read' : 'manifest_read';
      policy = {
        rawBytes,
        storedBytesEstimate: rawBytes,
        accessPattern,
        mutable: false,
        decision: getStorageDecisionForReadonlyData(rawBytes, accessPattern),
        reason: 'Included by the active MSX2 project slice; precise backend packing remains allocator-owned.',
      };
    }
    return {
      type: entry.type,
      id: entry.id,
      name: entry.name,
      ownerScreenId: entry.ownerScreenId,
      ownerWorldIds: entry.ownerWorldIds,
      ...policy,
    };
  }).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
}

function buildMsx2LogicalBankBudget(assetStoragePolicy: any[]): Record<string, unknown> {
  const bankSizeBytes = 8192;
  const warningThresholdBytes = Math.floor(bankSizeBytes * 0.9);
  const originalPackages = assetStoragePolicy
    .filter(policy => policy.decision !== 'INHERIT_OWNER_SCREEN_POLICY')
    .map(policy => {
      const usedBytes = Number(policy.storedBytesEstimate) || 0;
      const canSplit = policy.type === 'msx2screen' || policy.type === 'msx2sprite';
      return {
        id: `${policy.type}.${policy.id}`,
        type: policy.type,
        sourceId: policy.id,
        recommendedBankClass: policy.type === 'msx2screen'
          ? 'world.screen'
          : policy.type === 'msx2sprite'
            ? 'world.graphics.sprite'
            : 'world.manifest',
        usedBytes,
        freeBytesIfAlone: Math.max(0, bankSizeBytes - usedBytes),
        warning: usedBytes >= warningThresholdBytes,
        overBudgetBytes: Math.max(0, usedBytes - bankSizeBytes),
        canSplit,
      };
    });
  const packages = originalPackages.flatMap(entry => {
    if (!entry.canSplit || entry.usedBytes <= bankSizeBytes) return [entry];
    const maxChunkBytes = warningThresholdBytes;
    const splitCount = Math.max(2, Math.ceil(entry.usedBytes / maxChunkBytes));
    const chunks: Array<typeof entry & {
      splitFrom: string;
      splitIndex: number;
      splitCount: number;
      splitStrategy: string;
    }> = [];
    let remainingBytes = entry.usedBytes;
    for (let index = 0; index < splitCount; index += 1) {
      const remainingSlots = splitCount - index;
      const chunkBytes = Math.ceil(remainingBytes / remainingSlots);
      const usedBytes = Math.min(maxChunkBytes, chunkBytes);
      remainingBytes -= usedBytes;
      chunks.push({
        ...entry,
        id: `${entry.id}#chunk${String(index).padStart(2, '0')}`,
        usedBytes,
        freeBytesIfAlone: Math.max(0, bankSizeBytes - usedBytes),
        warning: usedBytes >= warningThresholdBytes,
        overBudgetBytes: Math.max(0, usedBytes - bankSizeBytes),
        splitFrom: entry.id,
        splitIndex: index,
        splitCount,
        splitStrategy: 'auto_world_package_chunk',
      });
    }
    return chunks;
  });
  const totalPayloadBytes = packages.reduce((sum, entry) => sum + entry.usedBytes, 0);
  const packedBanks: Array<{
    bankIndex: number;
    bankSizeBytes: number;
    warningThresholdBytes: number;
    usedBytes: number;
    freeBytes: number;
    usedPercent: number;
    warning: boolean;
    overBudgetBytes: number;
    status: 'ok' | 'warning' | 'error';
    packages: Array<{ id: string; usedBytes: number; recommendedBankClass: string }>;
  }> = [];
  const sortedPackages = [...packages]
    .filter(entry => entry.overBudgetBytes === 0)
    .sort((left, right) => {
      if (right.usedBytes !== left.usedBytes) return right.usedBytes - left.usedBytes;
      return left.id.localeCompare(right.id);
    });
  for (const entry of sortedPackages) {
    let targetBank = packedBanks.find(bank => bank.freeBytes >= entry.usedBytes);
    if (!targetBank) {
      targetBank = {
        bankIndex: packedBanks.length,
        bankSizeBytes,
        warningThresholdBytes,
        usedBytes: 0,
        freeBytes: bankSizeBytes,
        usedPercent: 0,
        warning: false,
        overBudgetBytes: 0,
        status: 'ok',
        packages: [],
      };
      packedBanks.push(targetBank);
    }
    targetBank.packages.push({
      id: entry.id,
      usedBytes: entry.usedBytes,
      recommendedBankClass: entry.recommendedBankClass,
    });
    targetBank.usedBytes += entry.usedBytes;
    targetBank.freeBytes = Math.max(0, bankSizeBytes - targetBank.usedBytes);
    targetBank.usedPercent = Number(((targetBank.usedBytes / bankSizeBytes) * 100).toFixed(2));
    targetBank.warning = targetBank.usedBytes >= warningThresholdBytes;
    targetBank.overBudgetBytes = Math.max(0, targetBank.usedBytes - bankSizeBytes);
    targetBank.status = targetBank.overBudgetBytes > 0 ? 'error' : targetBank.warning ? 'warning' : 'ok';
  }
  const overBudgetPackages = packages.filter(entry => entry.overBudgetBytes > 0);
  const splitPackages = packages.filter(entry => Boolean((entry as any).splitFrom));
  const splitSourcePackages = originalPackages.filter(entry =>
    entry.canSplit && entry.usedBytes > bankSizeBytes
  );
  const warningPackages = packages.filter(entry => entry.warning);
  const warningPackedBanks = packedBanks.filter(bank => bank.warning);
  const bankClassSummary = Array.from(packages.reduce((summary, entry) => {
    const bankClass = entry.recommendedBankClass || 'world.misc';
    const current = summary.get(bankClass) || {
      id: bankClass,
      packageCount: 0,
      usedBytes: 0,
      estimatedMinimumBanks: 0,
      warningPackageCount: 0,
      overBudgetPackageCount: 0,
      largestPackage: { id: entry.id, usedBytes: 0 },
    };
    current.packageCount += 1;
    current.usedBytes += entry.usedBytes;
    current.warningPackageCount += entry.warning ? 1 : 0;
    current.overBudgetPackageCount += entry.overBudgetBytes > 0 ? 1 : 0;
    if (entry.usedBytes > current.largestPackage.usedBytes) {
      current.largestPackage = { id: entry.id, usedBytes: entry.usedBytes };
    }
    current.estimatedMinimumBanks = Math.max(1, Math.ceil(current.usedBytes / bankSizeBytes));
    summary.set(bankClass, current);
    return summary;
  }, new Map<string, {
    id: string;
    packageCount: number;
    usedBytes: number;
    estimatedMinimumBanks: number;
    warningPackageCount: number;
    overBudgetPackageCount: number;
    largestPackage: { id: string; usedBytes: number };
  }>()).values()).sort((left, right) => {
    if (right.usedBytes !== left.usedBytes) return right.usedBytes - left.usedBytes;
    return left.id.localeCompare(right.id);
  });
  const recoveryRecommendations: Array<Record<string, unknown>> = [];
  const graphicsPressurePackages = packages.filter(entry =>
    (entry.type === 'msx2screen' || entry.type === 'msx2sprite') &&
    (entry.warning || entry.overBudgetBytes > 0)
  );
  const unsplittablePressurePackages = packages.filter(entry =>
    !entry.canSplit && (entry.warning || entry.overBudgetBytes > 0)
  );
  const coldDataPressure = warningPackedBanks.length > 0 || unsplittablePressurePackages.length > 0;
  for (const entry of overBudgetPackages) {
    recoveryRecommendations.push({
      severity: 'error',
      target: entry.id,
      reason: `Package exceeds one 8 KB bank by ${entry.overBudgetBytes} bytes.`,
      action: entry.canSplit
        ? 'Split this logical package into independently loadable chunks or move cold data to an additional world bank.'
        : 'Reduce this unsplittable manifest/code package or move optional data behind a different bank boundary.',
    });
    if (entry.type === 'msx2screen' || entry.type === 'msx2sprite') {
      recoveryRecommendations.push({
        severity: 'plan_b',
        target: entry.id,
        reason: 'Large graphics/screen payload may be compressible.',
        action: 'Try ZX0 only for load-to-VRAM graphics/name/color data; keep runtime lookup layers raw.',
      });
    }
  }
  for (const entry of splitSourcePackages) {
    recoveryRecommendations.push({
      severity: 'info',
      target: entry.id,
      reason: `Package estimated at ${entry.usedBytes} bytes was split before bank allocation.`,
      action: 'Mideas generated independently packable 8KB-safe chunks for this world asset.',
    });
  }
  for (const bank of warningPackedBanks) {
    recoveryRecommendations.push({
      severity: 'warning',
      target: `estimatedBank${bank.bankIndex}`,
      reason: `Estimated packed bank uses ${bank.usedBytes}/${bankSizeBytes} bytes.`,
      action: 'Repack by final post-compression sizes, then move cold read-only data to another world data bank if still above threshold.',
    });
  }
  if (packedBanks.length > Math.max(1, Math.ceil(totalPayloadBytes / bankSizeBytes))) {
    recoveryRecommendations.push({
      severity: 'info',
      target: 'first-fit-decreasing',
      reason: 'Estimated packing uses more banks than the theoretical minimum.',
      action: 'Allocator should retry first-fit-decreasing after ZX0 decisions and may group smaller manifest packages together.',
    });
  }
  const recoveryPlan = [
    {
      order: 1,
      id: 'repack_final_sizes',
      status: warningPackedBanks.length > 0 || overBudgetPackages.length > 0 ? 'recommended' : 'not_needed',
      trigger: 'estimated packed bank reaches warning threshold or any package is over one 8 KB window',
      appliesTo: warningPackedBanks.map(bank => `estimatedBank${bank.bankIndex}`),
      action: 'Re-run first-fit-decreasing with final stored sizes after ZX0 policy decisions.',
    },
    {
      order: 2,
      id: 'split_world_packages',
      status: splitSourcePackages.length > 0 ? 'applied' : overBudgetPackages.some(entry => entry.canSplit) ? 'required' : warningPackages.some(entry => entry.canSplit) ? 'recommended' : 'not_needed',
      trigger: 'independently addressable world/screen/sprite package is too large or near the bank limit',
      appliesTo: splitSourcePackages.length > 0
        ? splitSourcePackages.map(entry => entry.id)
        : packages.filter(entry => entry.canSplit && (entry.warning || entry.overBudgetBytes > 0)).map(entry => entry.id),
      action: 'Split the logical world package across additional physical world data banks.',
    },
    {
      order: 3,
      id: 'move_cold_readonly_data',
      status: coldDataPressure ? 'recommended' : 'not_needed',
      trigger: 'resident or manifest data creates bank pressure',
      appliesTo: unsplittablePressurePackages.map(entry => entry.id),
      action: 'Move cold read-only tables out of resident/core placement and into world data banks.',
    },
    {
      order: 4,
      id: 'selective_zx0',
      status: graphicsPressurePackages.length > 0 ? 'recommended' : 'not_needed',
      trigger: 'large load-to-VRAM screen, pattern, color, tilemap, or sprite data creates pressure',
      appliesTo: graphicsPressurePackages.map(entry => entry.id),
      action: 'Try ZX0 only for large load-to-VRAM resources; keep runtime lookup data raw.',
    },
    {
      order: 5,
      id: 'keep_hot_runtime_raw',
      status: 'enforced',
      trigger: 'runtime table is tiny, mutable, or accessed in hot loops',
      appliesTo: ['runtime lookup tables', 'entity instances', 'state-machine runtime state'],
      action: 'Do not solve ROM pressure by decompressing whole worlds into RAM or by compressing hot per-frame tables.',
    },
    {
      order: 6,
      id: 'world_special_code_bank',
      status: unsplittablePressurePackages.length > 0 ? 'recommended' : 'not_needed',
      trigger: 'rare behavior or boss-specific code contributes to resident pressure',
      appliesTo: unsplittablePressurePackages.map(entry => entry.id),
      action: 'Move rare behavior behind a world special-code bank and far-call boundary.',
    },
    {
      order: 7,
      id: 'split_large_payload_chunks',
      status: graphicsPressurePackages.some(entry => entry.overBudgetBytes > 0) ? 'required' : graphicsPressurePackages.length > 0 ? 'recommended' : 'not_needed',
      trigger: 'single screen/graphics payload cannot fit one mapper window as a unit',
      appliesTo: graphicsPressurePackages.map(entry => entry.id),
      action: 'Split large screen or graphics payloads into loader-addressable chunks only when each chunk is independently referenced.',
    },
    {
      order: 8,
      id: 'fail_actionable_report',
      status: overBudgetPackages.length > 0 ? 'required' : 'ready',
      trigger: 'all deterministic recovery attempts still leave an over-budget unit',
      appliesTo: overBudgetPackages.map(entry => entry.id),
      action: 'Fail before Glass with largest contributors and concrete authoring changes.',
    },
  ];
  if (recoveryRecommendations.length === 0) {
    recoveryRecommendations.push({
      severity: 'ok',
      target: 'logicalBankBudget',
      reason: 'All estimated packages fit below warning threshold.',
      action: 'No recovery needed before the final allocator pass.',
    });
  }
  return {
    bankSizeBytes,
    warningThresholdBytes,
    totalPayloadBytes,
    estimatedMinimumBanks: Math.max(1, Math.ceil(totalPayloadBytes / bankSizeBytes)),
    estimatedPackedBankCount: packedBanks.length,
    estimatedPackedBanks: packedBanks,
    overBudgetPackages,
    warningPackages,
    warningPackedBanks,
    bankClassSummary,
    recoveryRecommendations,
    recoveryPlan,
    packages,
    splitPackages,
    splitSourcePackages,
    note: 'Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression.',
  };
}

function buildMsx2WorldPackageSummary(includedAssets: any[], assetStoragePolicy: any[]): Array<Record<string, unknown>> {
  const includedByKey = new Map(includedAssets.map(asset => [assetKey(asset.type, asset.id), asset]));
  const summaries = new Map<string, {
    worldId: string;
    assetCount: number;
    screenCount: number;
    estimatedBytes: number;
    bankClassBytes: Map<string, number>;
  }>();
  const ensureSummary = (worldId: string) => {
    let summary = summaries.get(worldId);
    if (!summary) {
      summary = {
        worldId,
        assetCount: 0,
        screenCount: 0,
        estimatedBytes: 0,
        bankClassBytes: new Map<string, number>(),
      };
      summaries.set(worldId, summary);
    }
    return summary;
  };

  for (const policy of assetStoragePolicy) {
    if (policy.decision === 'INHERIT_OWNER_SCREEN_POLICY') continue;
    const included = includedByKey.get(assetKey(policy.type, policy.id));
    const ownerWorldIds = policy.type === 'worldmap'
      ? [policy.id]
      : (Array.isArray(included?.ownerWorldIds) ? included.ownerWorldIds : []);
    if (ownerWorldIds.length === 0) continue;
    const storedBytes = Number(policy.storedBytesEstimate) || 0;
    const bankClass = policy.type === 'msx2screen'
      ? 'world.screen'
      : policy.type === 'msx2sprite'
        ? 'world.graphics.sprite'
        : 'world.manifest';
    for (const worldId of ownerWorldIds) {
      const summary = ensureSummary(worldId);
      summary.assetCount += 1;
      summary.screenCount += policy.type === 'msx2screen' ? 1 : 0;
      summary.estimatedBytes += storedBytes;
      summary.bankClassBytes.set(bankClass, (summary.bankClassBytes.get(bankClass) || 0) + storedBytes);
    }
  }

  return Array.from(summaries.values())
    .map(summary => ({
      worldId: summary.worldId,
      assetCount: summary.assetCount,
      screenCount: summary.screenCount,
      estimatedBytes: summary.estimatedBytes,
      estimated8kBanks: Math.max(1, Math.ceil(summary.estimatedBytes / 8192)),
      bankClassBytes: Array.from(summary.bankClassBytes.entries())
        .map(([id, usedBytes]) => ({ id, usedBytes }))
        .sort((left, right) => {
          if (right.usedBytes !== left.usedBytes) return right.usedBytes - left.usedBytes;
          return left.id.localeCompare(right.id);
        }),
    }))
    .sort((left, right) => String(left.worldId).localeCompare(String(right.worldId)));
}

function buildMsx2WorldBankManifest(
  includedAssets: any[],
  assetStoragePolicy: any[],
  logicalBankBudget: Record<string, unknown>,
  worldPackageSummary: Array<Record<string, unknown>>,
  useKonamiDataBank: boolean
): Record<string, unknown> {
  const bankSizeBytes = Number(logicalBankBudget.bankSizeBytes || 8192);
  const dataWindowAddress = '#8000';
  const includedByKey = new Map(includedAssets.map(asset => [assetKey(asset.type, asset.id), asset]));
  const physicalBankByPackage = new Map<string, number>();
  for (const bank of (Array.isArray(logicalBankBudget.estimatedPackedBanks) ? logicalBankBudget.estimatedPackedBanks : []) as any[]) {
    for (const pkg of (Array.isArray(bank?.packages) ? bank.packages : [])) {
      if (pkg?.id) physicalBankByPackage.set(String(pkg.id), Number(bank.bankIndex || 0));
    }
  }
  const logicalPackagesBySource = new Map<string, any[]>();
  for (const pkg of (Array.isArray(logicalBankBudget.packages) ? logicalBankBudget.packages : []) as any[]) {
    const sourceKey = assetKey(pkg?.type, pkg?.sourceId);
    if (!sourceKey) continue;
    if (!logicalPackagesBySource.has(sourceKey)) logicalPackagesBySource.set(sourceKey, []);
    logicalPackagesBySource.get(sourceKey)!.push(pkg);
  }
  const logicalSectionForPolicy = (policy: any): string => policy.type === 'msx2screen'
    ? 'world screens'
    : policy.type === 'msx2sprite'
      ? 'world graphics'
      : policy.type === 'track'
        ? 'world music'
        : policy.type === 'worldmap'
          ? 'world manifest'
          : 'world manifest';
  const bankClassForPolicy = (policy: any): string => policy.type === 'msx2screen'
    ? 'world.screen'
    : policy.type === 'msx2sprite'
      ? 'world.graphics.sprite'
      : 'world.manifest';
  const worlds = new Map<string, {
    worldId: string;
    estimatedBytes: number;
    estimated8kBanks: number;
    packages: Array<Record<string, unknown>>;
  }>();
  for (const summary of worldPackageSummary) {
    const worldId = String(summary.worldId || '');
    if (!worldId) continue;
    worlds.set(worldId, {
      worldId,
      estimatedBytes: Number(summary.estimatedBytes || 0),
      estimated8kBanks: Number(summary.estimated8kBanks || 1),
      packages: [],
    });
  }

  for (const policy of assetStoragePolicy) {
    if (!policy || policy.decision === 'INHERIT_OWNER_SCREEN_POLICY') continue;
    const included = includedByKey.get(assetKey(policy.type, policy.id));
    const ownerWorldIds = policy.type === 'worldmap'
      ? [policy.id]
      : (Array.isArray(included?.ownerWorldIds) ? included.ownerWorldIds : []);
    const packageId = `${policy.type}.${policy.id}`;
    const budgetPackages = logicalPackagesBySource.get(assetKey(policy.type, policy.id)) || [{
      id: packageId,
      type: policy.type,
      sourceId: policy.id,
      recommendedBankClass: bankClassForPolicy(policy),
      usedBytes: Number(policy.storedBytesEstimate || 0),
    }];
    const packageRows = budgetPackages.map(pkg => {
      const rowPackageId = String(pkg?.id || packageId);
      const physicalBankIndex = physicalBankByPackage.has(rowPackageId) ? physicalBankByPackage.get(rowPackageId)! : null;
      return {
        packageId: rowPackageId,
        type: policy.type,
        sourceId: policy.id,
        logicalSection: logicalSectionForPolicy(policy),
        recommendedBankClass: pkg?.recommendedBankClass || bankClassForPolicy(policy),
        physicalBankIndex,
        windowAddress: dataWindowAddress,
        bankSizeBytes,
        rawBytes: Number(pkg?.usedBytes || policy.rawBytes || 0),
        storedBytes: Number(pkg?.usedBytes || policy.storedBytesEstimate || 0),
        decision: policy.decision || 'ROM_RAW',
        splitFrom: pkg?.splitFrom,
        splitIndex: pkg?.splitIndex,
        splitCount: pkg?.splitCount,
        splitStrategy: pkg?.splitStrategy,
        placementReason: physicalBankIndex === null
          ? 'Package is not assigned to an estimated physical bank because it is over budget or not independently packable yet.'
          : 'Estimated first-fit-decreasing placement before final compression and allocator pass.',
      };
    });
    for (const worldId of ownerWorldIds) {
      if (!worldId) continue;
      if (!worlds.has(worldId)) {
        worlds.set(worldId, {
          worldId,
          estimatedBytes: 0,
          estimated8kBanks: 1,
          packages: [],
        });
      }
      worlds.get(worldId)!.packages.push(...packageRows);
    }
  }

  const estimatedPhysicalBanks = (Array.isArray(logicalBankBudget.estimatedPackedBanks) ? logicalBankBudget.estimatedPackedBanks : [])
    .map((bank: any) => ({
      bankIndex: Number(bank?.bankIndex || 0),
      windowAddress: dataWindowAddress,
      bankSizeBytes,
      warningThresholdBytes: Number(bank?.warningThresholdBytes || logicalBankBudget.warningThresholdBytes || Math.floor(bankSizeBytes * 0.9)),
      usedBytes: Number(bank?.usedBytes || 0),
      freeBytes: Number(bank?.freeBytes || 0),
      usedPercent: Number(bank?.usedPercent || 0),
      warning: Boolean(bank?.warning),
      overBudgetBytes: Number(bank?.overBudgetBytes || 0),
      status: String(bank?.status || (Number(bank?.overBudgetBytes || 0) > 0 ? 'error' : bank?.warning ? 'warning' : 'ok')),
      packages: Array.isArray(bank?.packages) ? bank.packages : [],
    }));

  return {
    scope: 'msx2_screen4_world_bank_manifest',
    mapper: useKonamiDataBank ? 'konami' : 'linear',
    bankSizeBytes,
    dataWindowAddress,
    estimatedPhysicalBanks,
    worlds: Array.from(worlds.values())
      .map(world => ({
        ...world,
        packages: world.packages.sort((left, right) => String(left.packageId).localeCompare(String(right.packageId))),
      }))
      .sort((left, right) => String(left.worldId).localeCompare(String(right.worldId))),
    note: 'Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression.',
  };
}

function buildMsx2ProjectSliceJson(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2Screen4Config,
  tileScreens: Msx2Screen4TileScreen[],
  runtimeRamEnd: number,
  useKonamiDataBank: boolean
): string {
  const assets = ((analysis as any).assets || []) as any[];
  const screen4RuntimeFlow = getScreen4RuntimeGameFlow(analysis);
  const included = new Map<string, any>();
  const worldIds = new Set<string>();
  const spriteIds = new Set<string>();
  const componentIds = new Set<string>();
  const movementModes = new Set<string>();
  const attackProfiles = new Set<string>();
  const screenIds = new Set(tileScreens.map(screen => screen.id).filter(Boolean));
  const screenOwnerWorldIds = new Map<string, Set<string>>();
  const spriteOwnerWorldIds = new Map<string, Set<string>>();

  const includeByTypeAndId = (type: string, id: string | undefined, reason: string, extra: Record<string, unknown> = {}) => {
    if (!id) return;
    const asset = assets.find(candidate => candidate?.type === type && (candidate.id === id || candidate.data?.id === id));
    if (asset) addIncludedAsset(included, asset, reason, extra);
  };

  for (const node of screen4RuntimeFlow?.nodes || []) {
    if (node.type === 'WorldLink') {
      const worldAssetId = getGameFlowWorldAssetId(node);
      if (worldAssetId) worldIds.add(worldAssetId);
      includeByTypeAndId('worldmap', worldAssetId, `GameFlow WorldLink node ${node.id}`);
    } else if (node.type === 'Screen4Screen' || node.type === 'Text' || node.type === 'TextScroll' || node.type === 'TextScrollColor' || node.type === 'Controls' || node.type === 'SubMenu' || node.type === 'Restart') {
      includeByTypeAndId('msx2screen', getFlowBackgroundScreenAssetId(node), `GameFlow ${node.type} background`);
    } else if (node.type === 'Music') {
      if (node.stop !== true && node.autoPlay !== false) {
        includeByTypeAndId('track', node.trackAssetId, `GameFlow Music node ${node.id}`);
      }
    } else if (node.type === 'Globals') {
      includeByTypeAndId('globalvariables', node.globalVariablesAssetId, `GameFlow Globals node ${node.id}`);
    } else if (node.type === 'PresentationScreen') {
      includeByTypeAndId('presentationscreen', node.presentationScreenAssetId, `GameFlow PresentationScreen node ${node.id}`);
    }
  }

  const gameFlowAssetType = screen4RuntimeFlow === analysis.gameFlow ? 'gameflow' : 'msx2gameflow';
  const gameFlowAsset = assets.find(asset => asset?.type === gameFlowAssetType && asset.data === screen4RuntimeFlow);
  if (gameFlowAsset) {
    addIncludedAsset(included, gameFlowAsset, gameFlowAssetType === 'msx2gameflow' ? 'Active MSX2 SCREEN 4 GameFlow entry point' : 'Active MSX2 GameFlow entry point');
  }
  const paletteAsset = assets.find(asset =>
    asset?.type === 'palette'
    && (asset.data?.mode === 'SCREEN4' || asset.data?.mode === 'SCREEN5')
    && Array.isArray(asset.data?.slots)
    && asset.data.slots.length === 16
  );
  if (paletteAsset) {
    addIncludedAsset(included, paletteAsset, 'Active native MSX2 SCREEN 4 palette source');
  }

  for (const worldId of worldIds) {
    const world = resolveWorldByAssetId(analysis, worldId);
    for (const worldNode of world?.nodes || []) {
      const screenId = worldNode?.screenAssetId || worldNode?.screenId;
      if (screenId) {
        screenIds.add(screenId);
        if (!screenOwnerWorldIds.has(screenId)) screenOwnerWorldIds.set(screenId, new Set());
        screenOwnerWorldIds.get(screenId)!.add(worldId);
      }
      includeByTypeAndId('msx2screen', screenId, `Referenced by world ${worldId}`, { ownerWorldIds: [worldId] });
    }
  }

  for (const screen of tileScreens) {
    const ownerWorldIds = Array.from(screenOwnerWorldIds.get(screen.id) || []).sort();
    includeByTypeAndId('msx2screen', screen.id, 'Reachable native MSX2 screen', { ownerWorldIds });
    for (const tile of screen.tiles || []) {
      if (tile?.id) {
        included.set(assetKey('msx2screen_tile', `${screen.id}:${tile.id}`), {
          type: 'msx2screen_tile',
          id: tile.id,
          name: tile.name || tile.id,
          ownerScreenId: screen.id,
          ownerWorldIds,
          reason: 'Tile used by reachable native MSX2 screen',
        });
      }
    }

    for (const entity of screen.layers?.entities || []) {
      if (entity.spriteAssetId) {
        spriteIds.add(entity.spriteAssetId);
        if (ownerWorldIds.length > 0) {
          if (!spriteOwnerWorldIds.has(entity.spriteAssetId)) spriteOwnerWorldIds.set(entity.spriteAssetId, new Set());
          for (const worldId of ownerWorldIds) spriteOwnerWorldIds.get(entity.spriteAssetId)!.add(worldId);
        }
      }
      for (const componentId of Object.keys(entity.components || {})) {
        componentIds.add(componentId);
      }
      const movement = String(
        entity.components?.msx2_movement?.mode
        ?? entity.params?.movement
        ?? entity.params?.movementMode
        ?? entity.params?.motion
        ?? entity.kind
        ?? ''
      ).trim();
      if (movement) movementModes.add(movement);
      const attack = String(
        entity.components?.msx2_attack_pattern?.pattern
        ?? entity.params?.attackPattern
        ?? ''
      ).trim();
      if (attack) attackProfiles.add(attack);
    }
  }

  if (spriteIds.size === 0 && analysis.msx2Sprites?.[0]) {
    spriteIds.add(analysis.msx2Sprites[0].id);
  }
  for (const spriteId of spriteIds) {
    includeByTypeAndId('msx2sprite', spriteId, 'Referenced by reachable MSX2 entity or sprite fallback', {
      ownerWorldIds: Array.from(spriteOwnerWorldIds.get(spriteId) || []).sort(),
    });
  }

  const includedKeys = new Set(included.keys());
  const excludedAssets = assets
    .filter(asset => !includedKeys.has(assetKey(asset?.type, getAssetIdFromData(asset))))
    .map(asset => ({
      type: asset.type,
      id: getAssetIdFromData(asset),
      name: asset.name || asset.data?.name || getAssetIdFromData(asset),
      reason: asset.type?.startsWith('msx2') || asset.type === 'worldmap' || asset.type === 'gameflow'
        ? 'Not reachable from active MSX2 GameFlow/world slice'
        : 'Not used by native MSX2 SCREEN 4 backend',
    }));

  const runtimeRamBytes = Math.max(0, runtimeRamEnd - MSX2_RUNTIME_RAM_START);
  const runtimeModuleCandidates = [
    { id: 'runtime.msx2.boot', enabled: true, placement: 'resident', reason: 'Required by every native MSX2 SCREEN 4 build' },
    { id: 'runtime.msx2.screen4.vdp', enabled: true, placement: 'resident', reason: 'Required by every native MSX2 SCREEN 4 build' },
    { id: 'runtime.msx2.input', enabled: true, placement: 'resident', reason: 'Required by current MSX2 gameplay loop' },
    { id: 'runtime.msx2.screen_loader', enabled: true, placement: 'resident', reason: 'Required to load reachable native MSX2 screens' },
    { id: 'runtime.msx2.layers.collision', enabled: true, placement: 'resident', reason: 'Collision layer pointers are part of the current runtime contract' },
    { id: 'runtime.msx2.layers.effects', enabled: true, placement: 'resident', reason: 'Effects layer runtime buffers are part of the current runtime contract' },
    { id: 'runtime.msx2.layers.behavior', enabled: true, placement: 'resident', reason: 'Behavior layer pointers are part of the current runtime contract' },
    { id: 'runtime.msx2.hardware_sprites', enabled: hasHardwareSprite(analysis), placement: 'resident', reason: 'Enabled only when a reachable MSX2 sprite source exists' },
    { id: 'runtime.msx2.projectiles', enabled: usesShooterHorizontalMovement(analysis), placement: 'resident', reason: 'Enabled only by shooter-horizontal movement' },
    { id: 'runtime.msx2.stage_banner', enabled: hasHardwareSprite(analysis) && usesShooterHorizontalMovement(analysis), placement: 'resident', reason: 'Enabled only by shooter wave flow' },
    { id: 'runtime.msx2.scroll.vertical', enabled: usesMsx2Screen4BackgroundScroll(analysis), placement: 'resident', reason: 'Enabled only when reachable screens request scroll' },
    { id: 'runtime.msx2.snake_char', enabled: usesSnakeCharMovement(analysis), placement: 'resident', reason: 'Enabled only by snake-char movement' },
    { id: 'runtime.msx2.mapper.konami8k', enabled: useKonamiDataBank, placement: 'resident', reason: 'Enabled by Konami MegaROM data-bank mode' },
  ];
  const runtimeModuleDetails = runtimeModuleCandidates
    .map(module => ({
      id: module.id,
      included: Boolean(module.enabled),
      placement: module.placement,
      reason: module.reason,
    }));
  const includedRuntimeModuleDetails = runtimeModuleDetails
    .filter(module => module.included)
    .map(({ included: _included, ...module }) => module);
  const includedRuntimeModules = runtimeModuleCandidates
    .filter(module => module.enabled)
    .map(module => module.id);
  const excludedRuntimeModules = runtimeModuleDetails
    .filter(module => !module.included)
    .map(({ included: _included, ...module }) => module);
  const includedAssetList = Array.from(included.values()).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
  const assetStoragePolicy = buildMsx2AssetStoragePolicy(analysis, includedAssetList, tileScreens);
  const logicalBankBudget = buildMsx2LogicalBankBudget(assetStoragePolicy);
  const worldPackageSummary = buildMsx2WorldPackageSummary(includedAssetList, assetStoragePolicy);
  const worldBankManifest = buildMsx2WorldBankManifest(
    includedAssetList,
    assetStoragePolicy,
    logicalBankBudget,
    worldPackageSummary,
    useKonamiDataBank
  );
  const ramBudget = buildMsx2RamBudget(tileScreens, runtimeRamEnd);
  const romPayloadBytesEstimate = assetStoragePolicy
    .filter(policy => policy.decision !== 'INHERIT_OWNER_SCREEN_POLICY')
    .reduce((sum, policy) => sum + (Number(policy.storedBytesEstimate) || 0), 0);
  const artifact = {
    scope: 'msx2_screen4_project_slice',
    projectName,
    backend: 'msx2-screen4-pattern',
    screenMode: config.screenMode,
    romMode: useKonamiDataBank ? 'megarom' : config.romMode,
    mapper: config.targetFormat,
    entryPoints: {
      gameFlowId: screen4RuntimeFlow?.id || null,
      gameFlowName: screen4RuntimeFlow?.name || null,
      worldIds: Array.from(worldIds).sort(),
      screenIds: Array.from(screenIds).sort(),
    },
    includedAssets: includedAssetList,
    excludedAssets,
    includedRuntimeModules,
    includedRuntimeModuleDetails,
    excludedRuntimeModules,
    runtimeModuleDetails,
    worldPackageSummary,
    worldBankManifest,
    assetStoragePolicy,
    logicalBankBudget,
    ramBudget,
    includedComponents: Array.from(componentIds).sort(),
    includedMovementProfiles: Array.from(movementModes).sort(),
    includedAttackProfiles: Array.from(attackProfiles).sort(),
    includedStateMachines: [],
    estimatedRamNeeds: {
      start: formatHexWord(MSX2_RUNTIME_RAM_START),
      end: formatHexWord(runtimeRamEnd),
      limit: formatHexWord(MSX2_RUNTIME_RAM_LIMIT),
      usedBytes: runtimeRamBytes,
      freeBytes: Math.max(0, MSX2_RUNTIME_RAM_LIMIT - runtimeRamEnd),
      persistentEffectBytes: Math.max(1, tileScreens.length) * MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT,
      enemyRuntimeBytes: MSX2_ENEMY_RUNTIME_BYTES,
      ramBudgetStatus: ramBudget.status,
    },
    estimatedRomNeeds: {
      reachableMsx2ScreenCount: tileScreens.length,
      reachableMsx2SpriteCount: spriteIds.size,
      reachableWorldCount: worldIds.size,
      usesKonamiDataBank: useKonamiDataBank,
      romPayloadBytesEstimate,
      estimated8kBanksForPayload: Math.max(1, Math.ceil(romPayloadBytesEstimate / 8192)),
      warningThresholdBytesPerBank: Math.floor(8192 * 0.9),
      note: 'Slice reports reachability and storage policy estimates; final bank placement remains allocator-owned.',
    },
  };

  return JSON.stringify(artifact, null, 2) + '\n';
}

function buildSnakeCharRuntimeAsm(analysis: ProjectAnalysis): string {
  if (!usesSnakeCharMovement(analysis)) return '';
  const settings = getSnakeCharRuntimeSettings(analysis);
  const initialBodyCells = settings.initialBodyCells.length > 0
    ? settings.initialBodyCells.slice(0, MSX2_SNAKE_MAX_BODY_CELLS)
    : [{ x: settings.headX, y: settings.headY }];
  const initialBodyStores = initialBodyCells.map((cell, index) => `    ld a, ${cell.x}
    ld (msx2_snake_body_cells + ${index * 2}), a
    ld a, ${cell.y}
    ld (msx2_snake_body_cells + ${(index * 2) + 1}), a`).join('\n');
  const runtimeCharCopy = (label: string, charCode: number, tableBase: number, byteCount = 8): string =>
    [0x0000, 0x0800, 0x1000].map(bankOffset => `    ld hl, ${label}
    ld de, ${formatHexWord(tableBase + bankOffset + (charCode * 8))}
    ld bc, ${byteCount}
    call LDIRVM`).join('\n');
  return `init_msx2_snake_char:
    ; SCREEN 4 char/tile Snake runtime. Clobbers AF/BC/DE/HL.
    call msx2_snake_load_runtime_chars
    ld a, ${settings.headX}
    ld (msx2_snake_head_x), a
    ld a, ${settings.headY}
    ld (msx2_snake_head_y), a
    ld a, ${settings.foodX}
    ld (msx2_snake_food_x), a
    ld a, ${settings.foodY}
    ld (msx2_snake_food_y), a
    xor a
    ld (msx2_game_over_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_collectible_latch), a
    ld (msx2_snake_dir), a
    ld (msx2_snake_frame_counter), a
    ld a, ${settings.speedFrames}
    ld (msx2_snake_speed_frames), a
    ld a, ${initialBodyCells.length}
    ld (msx2_snake_body_length), a
    xor a
    ld (msx2_snake_growth_flag), a
${initialBodyStores}
    call msx2_snake_find_open_food_cell
    call msx2_snake_draw_body
    call msx2_snake_draw_food
    call msx2_snake_draw_head
    ret

msx2_snake_load_runtime_chars:
    ; Dynamic Snake chars are copied into all three SCREEN 4 pattern/color banks.
    ; Clobbers AF/BC/DE/HL.
${runtimeCharCopy('msx2_snake_head_pattern', settings.headChar, 0x0000, 32)}
${runtimeCharCopy('msx2_snake_head_color', settings.headChar, 0x2000, 32)}
${runtimeCharCopy('msx2_snake_body_pattern', settings.bodyChar, 0x0000, 32)}
${runtimeCharCopy('msx2_snake_body_color', settings.bodyChar, 0x2000, 32)}
${runtimeCharCopy('msx2_snake_food_pattern', settings.foodChar, 0x0000, 32)}
${runtimeCharCopy('msx2_snake_food_color', settings.foodChar, 0x2000, 32)}
${runtimeCharCopy('msx2_snake_empty_pattern', settings.emptyChar, 0x0000, 32)}
${runtimeCharCopy('msx2_snake_empty_color', settings.emptyChar, 0x2000, 32)}
    ret

update_msx2_snake_char:
    ; Grid update for Snake. Uses 16x16 logical cells and writes directly to SCREEN 4 name table.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_snake_game_over_idle
    call msx2_snake_read_input
    ld a, (msx2_snake_frame_counter)
    inc a
    ld (msx2_snake_frame_counter), a
    ld b, a
    ld a, (msx2_snake_speed_frames)
    cp b
    ret nc
    xor a
    ld (msx2_snake_frame_counter), a
    call msx2_snake_step_head
    call msx2_snake_check_wall_collision
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    call msx2_snake_check_food
    call msx2_snake_update_body
    call msx2_snake_check_self_collision
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    call msx2_snake_append_head
    call msx2_snake_draw_body
    call msx2_snake_draw_food
    call msx2_snake_draw_head
    ret

msx2_snake_read_input:
    xor a
    call GTSTCK
    cp 1
    jp z, .snake_dir_up
    cp 2
    jp z, .snake_dir_up
    cp 8
    jp z, .snake_dir_up
    cp 5
    jp z, .snake_dir_down
    cp 4
    jp z, .snake_dir_down
    cp 6
    jp z, .snake_dir_down
    cp 7
    jp z, .snake_dir_left
    cp 6
    jp z, .snake_dir_left
    cp 8
    jp z, .snake_dir_left
    cp 3
    jp z, .snake_dir_right
    cp 2
    jp z, .snake_dir_right
    cp 4
    jp z, .snake_dir_right
    ret
.snake_dir_right:
    ld a, (msx2_snake_body_length)
    cp 2
    jp c, .snake_set_right
    ld a, (msx2_snake_dir)
    cp 2
    ret z
.snake_set_right:
    xor a
    ld (msx2_snake_dir), a
    ret
.snake_dir_down:
    ld a, (msx2_snake_body_length)
    cp 2
    jp c, .snake_set_down
    ld a, (msx2_snake_dir)
    cp 3
    ret z
.snake_set_down:
    ld a, 1
    ld (msx2_snake_dir), a
    ret
.snake_dir_left:
    ld a, (msx2_snake_body_length)
    cp 2
    jp c, .snake_set_left
    ld a, (msx2_snake_dir)
    or a
    ret z
.snake_set_left:
    ld a, 2
    ld (msx2_snake_dir), a
    ret
.snake_dir_up:
    ld a, (msx2_snake_body_length)
    cp 2
    jp c, .snake_set_up
    ld a, (msx2_snake_dir)
    cp 1
    ret z
.snake_set_up:
    ld a, 3
    ld (msx2_snake_dir), a
    ret

msx2_snake_game_over_idle:
    ; The GameFlow Controls logical action button restarts after a Snake collision.
    call msx2_control_action_pressed
    or a
    ret z
    jp init_rom

msx2_snake_step_head:
    ld a, (msx2_snake_dir)
    or a
    jp z, .snake_step_right
    cp 1
    jp z, .snake_step_down
    cp 2
    jp z, .snake_step_left
    jp .snake_step_up
.snake_step_right:
    ld a, (msx2_snake_head_x)
    cp 15
    jp nc, msx2_snake_game_over
    inc a
    ld (msx2_snake_head_x), a
    ret
.snake_step_down:
    ld a, (msx2_snake_head_y)
    cp 11
    jp nc, msx2_snake_game_over
    inc a
    ld (msx2_snake_head_y), a
    ret
.snake_step_left:
    ld a, (msx2_snake_head_x)
    or a
    jp z, msx2_snake_game_over
    dec a
    ld (msx2_snake_head_x), a
    ret
.snake_step_up:
    ld a, (msx2_snake_head_y)
    or a
    jp z, msx2_snake_game_over
    dec a
    ld (msx2_snake_head_y), a
    ret

msx2_snake_game_over:
    ld a, 1
    ld (msx2_game_over_flag), a
    ret

msx2_snake_check_food:
    ld a, (msx2_snake_head_x)
    ld b, a
    ld a, (msx2_snake_food_x)
    cp b
    ret nz
    ld a, (msx2_snake_head_y)
    ld b, a
    ld a, (msx2_snake_food_y)
    cp b
    ret nz
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .snake_food_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.snake_food_score_done:
    ld a, 1
    ld (msx2_snake_growth_flag), a
    ld a, (msx2_snake_food_x)
    add a, 5
    and #0F
    ld (msx2_snake_food_x), a
    ld a, (msx2_snake_food_y)
    add a, 3
    cp 12
    jp c, .snake_food_y_ok
    sub 12
.snake_food_y_ok:
    ld (msx2_snake_food_y), a
    call msx2_snake_find_open_food_cell
    ret

msx2_snake_check_wall_collision:
    ; Checks the static obstacle table after movement. Clobbers AF/DE/HL.
    ld a, (msx2_snake_head_x)
    ld b, a
    ld a, (msx2_snake_head_y)
    ld c, a
    call msx2_snake_wall_at_bc
    or a
    jp nz, msx2_snake_game_over
    ret

msx2_snake_find_open_food_cell:
    ; Moves respawned food forward until it lands on a non-wall, non-body cell. Clobbers AF/BC/DE/HL.
    ld d, 32
.snake_food_open_loop:
    push de
    ld a, (msx2_snake_food_x)
    ld b, a
    ld a, (msx2_snake_food_y)
    ld c, a
    call msx2_snake_wall_at_bc
    or a
    jp nz, .snake_food_blocked_candidate
    call msx2_snake_body_at_bc
.snake_food_blocked_candidate:
    pop de
    or a
    ret z
    ld a, (msx2_snake_food_x)
    inc a
    and #0F
    ld (msx2_snake_food_x), a
    ld a, (msx2_snake_food_y)
    inc a
    cp 12
    jp c, .snake_food_y_candidate_ok
    xor a
.snake_food_y_candidate_ok:
    ld (msx2_snake_food_y), a
    dec d
    jp nz, .snake_food_open_loop
    ret

msx2_snake_body_at_bc:
    ; B=tile X, C=tile Y. Returns A=1 when the cell is occupied by the snake queue, 0 otherwise. Clobbers AF/B/DE/HL.
    ld d, b
    ld e, c
    ld a, (msx2_snake_body_length)
    or a
    ret z
    ld b, a
    ld hl, msx2_snake_body_cells
.snake_body_at_loop:
    ld a, (hl)
    cp d
    jp nz, .snake_body_at_next
    inc hl
    ld a, (hl)
    dec hl
    cp e
    jp z, .snake_body_at_hit
.snake_body_at_next:
    inc hl
    inc hl
    djnz .snake_body_at_loop
    xor a
    ret
.snake_body_at_hit:
    ld a, 1
    ret

msx2_snake_wall_at_bc:
    ; B=tile X, C=tile Y. Returns A=1 for wall/obstacle, 0 for open. Clobbers DE/HL.
    ld h, 0
    ld l, c
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, msx2_snake_wall_map
    add hl, de
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ret

msx2_snake_update_body:
    ; Applies growth or removes the oldest cell before appending the new head. Clobbers AF/BC/DE/HL.
    ld a, (msx2_snake_growth_flag)
    or a
    jp z, msx2_snake_remove_tail
    xor a
    ld (msx2_snake_growth_flag), a
    ld a, (msx2_snake_body_length)
    cp ${MSX2_SNAKE_MAX_BODY_CELLS}
    ret c
    jp msx2_snake_remove_tail

msx2_snake_remove_tail:
    ; Erases the oldest 16x16 cell and shifts the compact body queue. Clobbers AF/BC/DE/HL.
    ld a, (msx2_snake_body_length)
    or a
    ret z
    ld hl, msx2_snake_body_cells
    ld b, (hl)
    inc hl
    ld c, (hl)
    ld a, ${settings.emptyChar}
    ld (msx2_snake_draw_char), a
    call msx2_snake_draw_cell_16
    ld a, (msx2_snake_body_length)
    dec a
    ld (msx2_snake_body_length), a
    ret z
    ld b, a
    ld hl, msx2_snake_body_cells + 2
    ld de, msx2_snake_body_cells
.snake_tail_shift_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .snake_tail_shift_loop
    ret

msx2_snake_check_self_collision:
    ; Compares new head against queued body cells. Clobbers AF/BC/DE/HL.
    ld a, (msx2_snake_body_length)
    or a
    ret z
    ld b, a
    ld hl, msx2_snake_body_cells
    ld a, (msx2_snake_head_x)
    ld d, a
    ld a, (msx2_snake_head_y)
    ld e, a
.snake_self_loop:
    ld a, (hl)
    cp d
    jp nz, .snake_self_next
    inc hl
    ld a, (hl)
    dec hl
    cp e
    jp z, msx2_snake_game_over
.snake_self_next:
    inc hl
    inc hl
    djnz .snake_self_loop
    ret

msx2_snake_append_head:
    ; Appends the new head to the compact queue. Clobbers AF/BC/DE/HL.
    ld a, (msx2_snake_body_length)
    cp ${MSX2_SNAKE_MAX_BODY_CELLS}
    ret nc
    ld b, a
    ld hl, msx2_snake_body_cells
    or a
    jp z, .snake_append_at_slot
    ld de, 2
.snake_append_seek_loop:
    add hl, de
    djnz .snake_append_seek_loop
.snake_append_at_slot:
    ld a, (msx2_snake_head_x)
    ld (hl), a
    inc hl
    ld a, (msx2_snake_head_y)
    ld (hl), a
    ld a, (msx2_snake_body_length)
    inc a
    ld (msx2_snake_body_length), a
    ret

msx2_snake_draw_body:
    ; Draws queued body cells except the last one, which is the current head. Clobbers AF/BC/DE/HL.
    ld a, (msx2_snake_body_length)
    cp 2
    ret c
    dec a
    ld d, a
    ld hl, msx2_snake_body_cells
.snake_body_draw_loop:
    push de
    push hl
    ld b, (hl)
    inc hl
    ld c, (hl)
    ld a, ${settings.bodyChar}
    ld (msx2_snake_draw_char), a
    call msx2_snake_draw_cell_16
    pop hl
    pop de
    inc hl
    inc hl
    dec d
    jp nz, .snake_body_draw_loop
    ret

msx2_snake_draw_head:
    ld a, ${settings.headChar}
    ld (msx2_snake_draw_char), a
    ld a, (msx2_snake_head_x)
    ld b, a
    ld a, (msx2_snake_head_y)
    ld c, a
    jp msx2_snake_draw_cell_16

msx2_snake_erase_head:
    ld a, ${settings.emptyChar}
    ld (msx2_snake_draw_char), a
    ld a, (msx2_snake_head_x)
    ld b, a
    ld a, (msx2_snake_head_y)
    ld c, a
    jp msx2_snake_draw_cell_16

msx2_snake_draw_food:
    ld a, ${settings.foodChar}
    ld (msx2_snake_draw_char), a
    ld a, (msx2_snake_food_x)
    ld b, a
    ld a, (msx2_snake_food_y)
    ld c, a
    jp msx2_snake_draw_cell_16

msx2_snake_draw_cell_16:
    ; B=tile X (0..15), C=tile Y (0..11), msx2_snake_draw_char=char code. Clobbers AF/BC/DE/HL.
    ld hl, SCREEN4_NAME_VRAM
    ld a, c
    or a
    jp z, .snake_row_done
    ld de, 64
.snake_row_loop:
    add hl, de
    dec a
    jp nz, .snake_row_loop
.snake_row_done:
    ld a, b
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (msx2_snake_draw_char)
    call WRTVRM
    inc hl
    ld a, (msx2_snake_draw_char)
    inc a
    call WRTVRM
    ld de, 31
    add hl, de
    ld a, (msx2_snake_draw_char)
    add a, 2
    call WRTVRM
    inc hl
    ld a, (msx2_snake_draw_char)
    add a, 3
    call WRTVRM
    ret

${formatBytes('msx2_snake_head_pattern', settings.headPattern, 'Snake dynamic head char pattern, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_head_color', settings.headColor, 'Snake dynamic head char color, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_body_pattern', settings.bodyPattern, 'Snake dynamic body char pattern, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_body_color', settings.bodyColor, 'Snake dynamic body char color, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_food_pattern', settings.foodPattern, 'Snake dynamic food char pattern, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_food_color', settings.foodColor, 'Snake dynamic food char color, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_empty_pattern', settings.emptyPattern, 'Snake dynamic empty char pattern, copied to all SCREEN 4 banks')}${formatBytes('msx2_snake_empty_color', settings.emptyColor, 'Snake dynamic empty char color, copied to all SCREEN 4 banks')}
${formatBytes('msx2_snake_wall_map', settings.wallMap, 'Snake static wall map, 16x12 cells: 1=solid obstacle')}
`;
}

function buildMsx2TileScreenLoadLines(
  label: string | undefined,
  tileScreenIndexByLabel: Map<string, number>,
  refreshHardwareSprites = false
): string {
  if (!label) return '';
  const index = tileScreenIndexByLabel.get(label);
  const setIndex = index === undefined
    ? ''
    : `    ld a, ${index}\n    ld (msx2_current_screen_index), a\n`;
  const spriteRefresh = refreshHardwareSprites
    ? '    call msx2_reset_enemy_runtime_for_current_screen\n    call init_hardware_sprites\n'
    : '';
  return `${setIndex}    call load_${label}_screen4\n${spriteRefresh}`;
}

function buildLoadCurrentTileScreenDispatcher(tileScreenLoadLabels: string[]): string {
  const fallbackLabel = tileScreenLoadLabels[0];
  if (!fallbackLabel) return '';
  const checks = tileScreenLoadLabels.map((label, index) => `    cp ${index}
    jp z, load_${label}_screen4`).join('\n');
  return `load_current_msx2_screen4:
    ; Dispatches the active SCREEN 4 room by msx2_current_screen_index. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
${checks}
    jp load_${fallbackLabel}_screen4
`;
}

function buildScreen4BackgroundScrollAsm(tileScreenLoadLabels: string[], useKonamiDataBank: boolean): string {
  if (!tileScreenLoadLabels.length) return '';
  const dispatch = tileScreenLoadLabels.map((label, index) => `    cp ${index}
    jp z, .copy_${label}`).join('\n');
  const screenCopies = tileScreenLoadLabels.map(label => `.copy_${label}:
    ld a, e
    call msx2_bg_source_row_ptr_${label}
    jp .copy_row
`).join('\n');
  const sourceHelpers = tileScreenLoadLabels.map(label => `msx2_bg_source_row_ptr_${label}:
    ; A = source upper background char row 0..15, returns HL=${label}_NAMES + row*32.
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, ${label}_NAMES
    add hl, de
    ret
`).join('\n');
  const enterDataBank = useKonamiDataBank ? '    call msx2_screen4_data_bank_enter\n' : '';
  const leaveDataBank = useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : '';
  return `install_msx2_split_scroll_hook:
    ; Installs a line-interrupt hook that keeps the lower playfield fixed.
    ; Clobbers AF/BC.
    ld a, #C3
    ld (HKEYI), a
    ld hl, msx2_split_scroll_hkeyi
    ld (HKEYI + 1), hl
    ld b, 128
    ld c, 19
    call WRTVDP
    ld a, (#F3DF)
    or #10
    ld (#F3DF), a
    ld b, a
    ld c, 0
    call WRTVDP
    ret

msx2_split_scroll_hkeyi:
    ; BIOS hook at H.KEYI. Preserve registers and handle only V9938 line IRQ.
    push af
    push bc
    ld a, 1
    out (VDP_CTRL_PORT), a
    ld a, #8F
    out (VDP_CTRL_PORT), a
    in a, (VDP_CTRL_PORT)
    bit 0, a
    jr z, .restore_status_pointer
    xor a
    out (VDP_CTRL_PORT), a
    ld a, #97
    out (VDP_CTRL_PORT), a
.restore_status_pointer:
    xor a
    out (VDP_CTRL_PORT), a
    ld a, #8F
    out (VDP_CTRL_PORT), a
    pop bc
    pop af
    ret

init_msx2_bg_scroll:
    ; Smooth reverse-loop SCREEN 4 background scroll via V9938 R#23.
    xor a
    ld (msx2_bg_scroll_frame), a
    ld (msx2_bg_scroll_fine), a
    ld b, a
    ld c, 23
    call WRTVDP
    call sync_msx2_bg_scroll_wrap_rows
    ret

update_msx2_bg_scroll:
    ; R#23 is cheap enough to update during gameplay without stalling sprite motion.
    ld a, (msx2_bg_scroll_frame)
    inc a
    and 1
    ld (msx2_bg_scroll_frame), a
    ret nz
    ld a, (msx2_bg_scroll_fine)
    or a
    jr nz, .decrement_fine
    ld a, 8
.decrement_fine:
    dec a
    ld (msx2_bg_scroll_fine), a
    ld b, a
    ld c, 23
    call WRTVDP
    or a
    ret nz
    call sync_msx2_bg_scroll_wrap_rows
    ret

sync_msx2_bg_scroll_wrap_rows:
    ; R#23 may expose rows 24..31 (#1B00..#1BFF). Keep them black
    ; instead of showing sprite-table or duplicate-row garbage.
    xor a
    ld hl, #1B00
    ld bc, 256
    call FILVRM
    ret

redraw_msx2_bg_scroll:
    ld c, 0
.row_loop:
    ld a, c
    ld b, c
    push bc
    call copy_msx2_bg_row
    pop bc
    inc c
    ld a, c
    cp 16
    jr nz, .row_loop
    ret

copy_msx2_bg_row:
    ; A = source background row, B = destination name-table row.
    ld e, a
    ld d, b
    ld a, (msx2_current_screen_index)
${dispatch}
${screenCopies}.copy_row:
    ld a, d
    call msx2_bg_dest_row_addr
    ld bc, 32
${enterDataBank}    call LDIRVM
${leaveDataBank}    ret

msx2_bg_dest_row_addr:
    ; A = destination char row, returns DE=#1800 + row*32.
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, #1800
    add hl, de
    ex de, hl
    ret

${sourceHelpers}`;
}

function screenLoadLabelForAssetId(
  analysis: ProjectAnalysis,
  screenLabels: Map<string, string>,
  tileScreenLabels: Map<string, string>,
  screenAssetId: string | undefined
): string | undefined {
  const screen = resolveScreenByAssetId(analysis, screenAssetId);
  if (screen) return screenLabels.get(screen.id || screen.name);
  const tileScreen = resolveTileScreenByAssetId(analysis, screenAssetId);
  if (tileScreen) return tileScreenLabels.get(tileScreen.id || tileScreen.name);
  return undefined;
}

interface Msx2Screen4GameFlowGlobal {
  variableName: string;
  asmName: string;
  address: number;
  isWord: boolean;
  values?: any[];
}

function normalizeMsx2GameFlowGlobalName(name: unknown): string {
  return typeof name === 'string' ? name.trim() : '';
}

function buildMsx2GameFlowGlobalAsmName(variableName: string): string {
  return `global_var_${variableName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;
}

function resolveMsx2GameFlowGlobalInfo(variableName: string, analysis: ProjectAnalysis): { asmName: string; isWord: boolean; values?: any[] } {
  const normalizedName = normalizeMsx2GameFlowGlobalName(variableName);
  const variables = Array.isArray((analysis as any).globalVariables) ? (analysis as any).globalVariables : [];
  const found = variables.find((variable: any) => String(variable?.name || '').toLowerCase() === normalizedName.toLowerCase());
  const type = String(found?.type || '').toLowerCase();
  return {
    asmName: found?.asmName || buildMsx2GameFlowGlobalAsmName(normalizedName),
    isWord: type === 'word' || type === '16bit',
    values: Array.isArray(found?.values) ? found.values : undefined,
  };
}

function parseMsx2GameFlowGlobalValue(rawValue: unknown, values: any[] | undefined, isWord: boolean): number {
  if (typeof rawValue === 'boolean') return rawValue ? 1 : 0;
  const text = String(rawValue ?? '').trim();
  const matchedValue = values?.find(option => String(option?.label).toLowerCase() === text.toLowerCase() || String(option?.value) === text)?.value;
  const source = matchedValue ?? text;
  if (typeof source === 'boolean') return source ? 1 : 0;
  if (typeof source === 'string') {
    if (source.toLowerCase() === 'true') return 1;
    if (source.toLowerCase() === 'false') return 0;
  }
  const numeric = Number(source);
  if (!Number.isFinite(numeric)) return 0;
  return isWord
    ? Math.max(0, Math.min(65535, Math.trunc(numeric)))
    : Math.max(0, Math.min(255, Math.trunc(numeric)));
}

function getMsx2GameFlowOperatorId(operator: unknown): number {
  switch (operator) {
    case '!=': return 1;
    case '>': return 2;
    case '<': return 3;
    case '>=': return 4;
    case '<=': return 5;
    case '==':
    default:
      return 0;
  }
}

function buildMsx2GameFlowGlobalMap(graph: any, analysis: ProjectAnalysis, baseAddress: number): Map<string, Msx2Screen4GameFlowGlobal> {
  const globals = new Map<string, Msx2Screen4GameFlowGlobal>();
  let address = baseAddress;
  const includeName = (rawName: unknown) => {
    const variableName = normalizeMsx2GameFlowGlobalName(rawName);
    if (!variableName || globals.has(variableName.toLowerCase())) return;
    const info = resolveMsx2GameFlowGlobalInfo(variableName, analysis);
    globals.set(variableName.toLowerCase(), {
      variableName,
      asmName: info.asmName,
      address,
      isWord: info.isWord,
      values: info.values,
    });
    address += info.isWord ? 2 : 1;
  };
  (graph?.nodes || []).forEach((node: any) => {
    if (node?.type === 'Globals') {
      (Array.isArray(node.variables) ? node.variables : []).forEach((variable: any) => includeName(variable?.name));
    } else if (node?.type === 'IfThenElse') {
      includeName(node.variableName);
    }
  });
  if (address > MSX2_RUNTIME_RAM_LIMIT) {
    throw new Error(`MSX2 SCREEN 4 GameFlow globals require RAM through ${formatHexWord(address)}, beyond safe limit ${formatHexWord(MSX2_RUNTIME_RAM_LIMIT)}.`);
  }
  return globals;
}

function buildMsx2GameFlowGlobalEquates(globals: Map<string, Msx2Screen4GameFlowGlobal>): string {
  if (globals.size === 0) return '';
  return Array.from(globals.values()).map(global =>
    `${global.asmName} EQU ${formatHexWord(global.address)}    ; MSX2 SCREEN 4 GameFlow global: ${global.variableName}`
  ).join('\n') + '\n';
}

function estimateMsx2GameFlowRuntimeRamEnd(analysis: ProjectAnalysis, baseAddress: number): number {
  const graph = getScreen4RuntimeGameFlow(analysis);
  if (!graph?.nodes?.length) return baseAddress;
  const globals = buildMsx2GameFlowGlobalMap(graph, analysis, baseAddress);
  return Array.from(globals.values()).reduce((end, global) =>
    Math.max(end, global.address + (global.isWord ? 2 : 1)),
    baseAddress
  );
}

function buildMsx2GameFlowGlobalInitLines(globals: Map<string, Msx2Screen4GameFlowGlobal>): string[] {
  const lines: string[] = [];
  for (const global of globals.values()) {
    if (global.isWord) {
      lines.push('    ld hl, 0');
      lines.push(`    ld (${global.asmName}), hl`);
    } else {
      lines.push('    xor a');
      lines.push(`    ld (${global.asmName}), a`);
    }
  }
  return lines;
}

function buildMsx2GameFlowGlobalsApplyLines(node: any, globals: Map<string, Msx2Screen4GameFlowGlobal>): string[] {
  const lines: string[] = [];
  (Array.isArray(node?.variables) ? node.variables : []).forEach((variable: any) => {
    const global = globals.get(normalizeMsx2GameFlowGlobalName(variable?.name).toLowerCase());
    if (!global) return;
    const value = parseMsx2GameFlowGlobalValue(variable?.value, global.values, global.isWord);
    lines.push(`    ; ${global.variableName} = ${value}`);
    if (global.isWord) {
      lines.push(`    ld hl, ${formatHexWord(value)}`);
      lines.push(`    ld (${global.asmName}), hl`);
    } else {
      lines.push(`    ld a, ${formatHexByte(value)}`);
      lines.push(`    ld (${global.asmName}), a`);
    }
  });
  return lines;
}

function buildMsx2GameFlowCompareRoutine(needed: boolean): string {
  if (!needed) return '';
  return `
msx2_gf_compare_hl_de:
    ; Input: HL=current, DE=compare, A=operator. Output: A=1 true, A=0 false.
    ld c, a
    or a
    sbc hl, de
    ld a, c
    cp 0
    jp z, .equals
    cp 1
    jp z, .not_equals
    cp 2
    jp z, .greater
    cp 3
    jp z, .less
    cp 4
    jp z, .greater_equal
    cp 5
    jp z, .less_equal
    xor a
    ret
.equals:
    ld a, h
    or l
    jp z, .true
    xor a
    ret
.not_equals:
    ld a, h
    or l
    jp nz, .true
    xor a
    ret
.greater:
    jp c, .false
    ld a, h
    or l
    jp nz, .true
    xor a
    ret
.less:
    jp c, .true
    xor a
    ret
.greater_equal:
    jp nc, .true
    xor a
    ret
.less_equal:
    jp c, .true
    ld a, h
    or l
    jp z, .true
.false:
    xor a
    ret
.true:
    ld a, 1
    ret
`;
}

function buildMsx2GameFlowTransitionWaitLines(label: string, durationFrames: unknown): string[] {
  const frames = Math.max(0, Math.min(255, Math.trunc(Number(durationFrames) || 0)));
  if (frames <= 0) return [];
  const waitLabel = `.${label}_wait_frames`;
  return [
    `    ld b, ${formatHexByte(frames)}`,
    `${waitLabel}:`,
    '    call wait_frame_busy',
    `    djnz ${waitLabel}`,
  ];
}

function buildMsx2GameFlowTransitionLines(effect: unknown, label: string, durationFrames: unknown): string[] {
  const lines: string[] = ['    call load_msx2_hud_font'];
  const nameAddr = (offset: number): string => formatHexWord(0x1800 + offset);
  const waitStep = () => lines.push('    call wait_frame_busy');
  let timedStepIndex = 0;
  const waitTimedStep = () => {
    const frames = Math.max(1, Math.min(15, Math.trunc(Number(durationFrames) || 1)));
    const waitLabel = `.${label}_timed_step_${timedStepIndex++}`;
    lines.push(`    ld b, ${formatHexByte(frames)}`);
    lines.push(`${waitLabel}:`);
    lines.push('    call wait_frame_busy');
    lines.push(`    djnz ${waitLabel}`);
  };
  const writeBlankCell = (row: number, column: number) => {
    lines.push(`    ld hl, ${nameAddr((row * 32) + column)}`);
    lines.push('    call clear_screen4_name_cell_blank');
  };
  const writeBlankRow = (row: number) => {
    lines.push(`    ld hl, ${nameAddr(row * 32)}`);
    lines.push('    call clear_screen4_name_row');
  };
  const writeBlankBlock = (row: number, column: number, height: number, width: number) => {
    const top = Math.max(0, row);
    const left = Math.max(0, column);
    const bottom = Math.min(24, row + height);
    const right = Math.min(32, column + width);
    const clippedHeight = bottom - top;
    const clippedWidth = right - left;
    if (clippedHeight <= 0 || clippedWidth <= 0) return;
    lines.push(`    ld hl, ${nameAddr((top * 32) + left)}`);
    lines.push(`    ld b, ${clippedHeight}`);
    lines.push(`    ld c, ${clippedWidth}`);
    lines.push('    call clear_screen4_name_rect');
  };

  switch (effect) {
    case 'cls':
      lines.push('    call clear_screen4_names');
      lines.push(...buildMsx2GameFlowTransitionWaitLines(label, durationFrames));
      break;
    case 'fade_to_black':
      lines.push('    call DISSCR');
      lines.push('    call clear_screen4_names');
      lines.push(...buildMsx2GameFlowTransitionWaitLines(label, durationFrames));
      lines.push('    call ENASCR');
      break;
    case 'dissolve_pixels':
      for (let phase = 0; phase < 8; phase++) {
        for (let column = phase; column < 32; column += 8) {
          lines.push(`    ld hl, ${nameAddr(column)}`);
          lines.push('    call clear_screen4_name_column');
        }
        waitStep();
      }
      break;
    case 'dissolve_chars':
      for (let phase = 0; phase < 8; phase++) {
        for (let row = phase; row < 24; row += 8) {
          writeBlankRow(row);
        }
        waitStep();
      }
      break;
    case 'horizontal_lines':
      for (let row = 0; row < 24; row++) {
        writeBlankRow(row);
        waitStep();
      }
      break;
    case 'spiral': {
      for (let inset = 0; inset < 12; inset += 2) {
        const left = inset;
        const right = 31 - inset;
        const top = inset;
        const bottom = 23 - inset;
        writeBlankBlock(top, left, 1, right - left + 1);
        writeBlankBlock(bottom, left, 1, right - left + 1);
        writeBlankBlock(top + 1, left, Math.max(0, bottom - top - 1), 1);
        writeBlankBlock(top + 1, right, Math.max(0, bottom - top - 1), 1);
        waitStep();
      }
      break;
    }
    case 'vertical_lines':
      for (let column = 0; column < 32; column++) {
        lines.push(`    ld hl, ${nameAddr(column)}`);
        lines.push('    call clear_screen4_name_column');
        waitStep();
      }
      break;
    case 'diagonal_clear':
      for (let diagonal = 0; diagonal <= 52; diagonal += 4) {
        for (let row = 0; row < 24; row += 4) {
          const column = diagonal - row;
          if (column < -3 || column >= 32) continue;
          writeBlankBlock(row, Math.max(0, column), 4, 4);
        }
        waitStep();
      }
      break;
    case 'diagonal_inverse':
      for (let diagonal = 0; diagonal <= 52; diagonal += 4) {
        for (let row = 0; row < 24; row += 4) {
          const column = 31 - (diagonal - row);
          if (column < 0 || column >= 35) continue;
          writeBlankBlock(row, Math.min(31, column), 4, 4);
        }
        waitStep();
      }
      break;
    case 'checkerboard':
      lines.push('    call clear_screen4_checkerboard_phase0');
      waitStep();
      lines.push('    call clear_screen4_checkerboard_phase1');
      waitStep();
      break;
    case 'doors':
      for (let offset = 0; offset < 16; offset++) {
        lines.push(`    ld hl, ${nameAddr(offset)}`);
        lines.push('    call clear_screen4_name_column');
        lines.push(`    ld hl, ${nameAddr(31 - offset)}`);
        lines.push('    call clear_screen4_name_column');
        waitStep();
      }
      break;
    case 'center_curtain':
      for (let offset = 0; offset < 16; offset++) {
        lines.push(`    ld hl, ${nameAddr(15 - offset)}`);
        lines.push('    call clear_screen4_name_column');
        lines.push(`    ld hl, ${nameAddr(16 + offset)}`);
        lines.push('    call clear_screen4_name_column');
        waitStep();
      }
      break;
    case 'venetian_blinds':
      for (let phase = 0; phase < 2; phase++) {
        for (let row = phase; row < 24; row += 2) {
          writeBlankRow(row);
        }
        waitStep();
      }
      break;
    case 'radial_wipe':
      for (let radius = 0; radius <= 12; radius += 2) {
        writeBlankBlock(11 - radius, 15 - radius, (radius * 2) + 2, (radius * 2) + 2);
        waitStep();
      }
      break;
    case 'fill_white_squares':
      for (let row = 0; row < 24; row += 4) {
        for (let column = 0; column < 32; column += 4) {
          writeBlankBlock(row, column, 4, 4);
          waitStep();
        }
      }
      break;
    case 'block4_shuffle': {
      const blocks = Array.from({ length: 48 }, (_, index) => index)
        .sort((a, b) => ((a * 13) % 48) - ((b * 13) % 48));
      for (const block of blocks) {
        const blockColumn = block % 8;
        const blockRow = Math.floor(block / 8);
        writeBlankBlock(blockRow * 4, blockColumn * 4, 4, 4);
        waitStep();
      }
      break;
    }
    case 'zoom_box':
      for (let inset = 0; inset < 12; inset += 2) {
        const left = inset;
        const right = 31 - inset;
        const top = inset;
        const bottom = 23 - inset;
        writeBlankBlock(top, left, 2, right - left + 1);
        writeBlankBlock(bottom - 1, left, 2, right - left + 1);
        writeBlankBlock(top + 2, left, Math.max(0, bottom - top - 3), 2);
        writeBlankBlock(top + 2, right - 1, Math.max(0, bottom - top - 3), 2);
        waitStep();
      }
      break;
    case 'raster_bars':
      for (let row = 0; row < 24; row += 4) {
        writeBlankBlock(row, 0, 2, 32);
        waitStep();
      }
      for (let row = 2; row < 24; row += 4) {
        writeBlankBlock(row, 0, 2, 32);
        waitStep();
      }
      break;
    case 'raster_split_wipe':
      for (let offset = 0; offset < 12; offset++) {
        writeBlankRow(11 - offset);
        writeBlankRow(12 + offset);
        waitStep();
      }
      break;
    case 'raster_scanlines':
      for (let row = 0; row < 24; row += 2) {
        writeBlankRow(row);
      }
      waitStep();
      for (let row = 1; row < 24; row += 2) {
        writeBlankRow(row);
      }
      waitStep();
      break;
    case 'raster_palette_fade':
      lines.push('    call load_screen4_black_palette');
      lines.push(...buildMsx2GameFlowTransitionWaitLines(label, durationFrames));
      lines.push('    call clear_screen4_names');
      lines.push('    call load_screen4_palette');
      waitStep();
      break;
    case 'raster_bands_down':
      for (let row = 0; row < 24; row += 3) {
        writeBlankBlock(row, 0, 3, 32);
        waitStep();
      }
      break;
    case 'raster_bands_up':
      for (let row = 21; row >= 0; row -= 3) {
        writeBlankBlock(row, 0, 3, 32);
        waitStep();
      }
      break;
    case 'raster_center_bands':
      for (let offset = 0; offset < 12; offset += 2) {
        writeBlankBlock(10 - offset, 0, 2, 32);
        writeBlankBlock(12 + offset, 0, 2, 32);
        waitTimedStep();
      }
      break;
    case 'raster_wave_bands': {
      const waveRows = [12, 10, 14, 8, 16, 6, 18, 4, 20, 2, 22, 0];
      for (const row of waveRows) {
        writeBlankBlock(row, 0, 2, 32);
        waitTimedStep();
      }
      break;
    }
    case 'raster_corner_wipe': {
      for (let inset = 0; inset < 12; inset += 2) {
        const top = inset;
        const bottom = 22 - inset;
        const leftWidth = Math.min(16, 4 + inset);
        const rightColumn = Math.max(0, 32 - leftWidth);
        writeBlankBlock(top, 0, 2, leftWidth);
        writeBlankBlock(top, rightColumn, 2, leftWidth);
        writeBlankBlock(bottom, 0, 2, leftWidth);
        writeBlankBlock(bottom, rightColumn, 2, leftWidth);
        waitTimedStep();
      }
      lines.push('    call clear_screen4_names');
      break;
    }
    case 'raster_diagonal_corner':
      for (let diagonal = 0; diagonal <= 40; diagonal += 2) {
        for (let row = 0; row < 24; row += 2) {
          const column = diagonal - row;
          if (column < 0 || column >= 32) continue;
          writeBlankBlock(row, column, 2, 2);
        }
        waitTimedStep();
      }
      lines.push('    call clear_screen4_names');
      break;
    default:
      return [];
  }

  return lines;
}

function buildMsx2GameFlowProgram(
  analysis: ProjectAnalysis,
  screenLabels: Map<string, string>,
  tileScreenLabels: Map<string, string>,
  tileScreenIndexByLabel: Map<string, number>,
  globalBaseAddress: number
): string {
  const graph = getScreen4RuntimeGameFlow(analysis);
  const fallbackLabel = tileScreenLabels.values().next().value || screenLabels.values().next().value;
  const refreshHardwareSprites = hasHardwareSprite(analysis);
  const refreshSnakeChars = usesSnakeCharMovement(analysis);
  const showShooterStageBanner = refreshHardwareSprites && usesShooterHorizontalMovement(analysis);
  if (!graph?.nodes?.length) {
    return buildMsx2TileScreenLoadLines(fallbackLabel, tileScreenIndexByLabel, refreshHardwareSprites);
  }

  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const startNodeId = graph.startNodeId || graph.nodes.find(node => node.type === 'Start')?.id;
  if (!startNodeId) {
    return buildMsx2TileScreenLoadLines(fallbackLabel, tileScreenIndexByLabel, refreshHardwareSprites);
  }
  validateMsx2GameFlowSubMenuEdges(graph);
  validateMsx2GameFlowMusicRuntime(graph);

  const nodeLabels = new Map<string, string>();
  graph.nodes.forEach((node: any, index: number) => {
    nodeLabels.set(node.id, `msx2_gf_node_${index}`);
  });
  const globalMap = buildMsx2GameFlowGlobalMap(graph, analysis, globalBaseAddress);
  const hasIfThenElse = graph.nodes.some((node: any) => node?.type === 'IfThenElse');
  const labelForNodeId = (nodeId: string | undefined): string | undefined => nodeId ? nodeLabels.get(nodeId) : undefined;
  const jumpToNodeOrMain = (nodeId: string | undefined): string => {
    const label = labelForNodeId(nodeId);
    return label ? `    jp ${label}` : '    jp .main_loop';
  };
  const lines: string[] = [
    '    ; MSX2 minimal GameFlow: MSX2 SCREEN 4 GameFlow entry.',
    ...buildMsx2GameFlowGlobalInitLines(globalMap),
    jumpToNodeOrMain(startNodeId),
  ];
  const dataBlocks: string[] = [];
  const unsupported = new Set<string>();
  const emitted = new Set<string>();

  const emitNode = (current: any) => {
    if (!current || emitted.has(current.id)) return;
    emitted.add(current.id);
    const label = labelForNodeId(current.id);
    if (!label) return;
    lines.push(`${label}:`);
    switch (current.type) {
      case 'Start':
      case 'Waypoint':
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      case 'Music':
        if (current.stop === true || current.autoPlay === false) {
          lines.push('    call msx2_gameflow_music_stop');
        } else {
          throw new Error(`MSX2 SCREEN 4 Music node ${current.id || ''} requests active playback, but tracker playback is not wired yet; use stop/autoPlay=false.`);
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      case 'Globals': {
        const applyLines = buildMsx2GameFlowGlobalsApplyLines(current, globalMap);
        lines.push(...(applyLines.length ? applyLines : ['    ; Empty Globals node']));
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'IfThenElse': {
        const global = globalMap.get(normalizeMsx2GameFlowGlobalName(current.variableName).toLowerCase());
        const thenTarget = sourceTargetNodeId(graph.connections, current.id, ['then']);
        const elseTarget = sourceTargetNodeId(graph.connections, current.id, ['else']);
        if (!global) {
          throw new Error(`MSX2 SCREEN 4 IfThenElse node ${current.id} references missing global variable "${current.variableName || ''}".`);
        }
        if (!thenTarget || !elseTarget) {
          throw new Error(`MSX2 SCREEN 4 IfThenElse node ${current.id} must have both THEN and ELSE branches.`);
        }
        const compareValue = parseMsx2GameFlowGlobalValue(current.compareValue, global.values, global.isWord);
        lines.push(`    ; ${global.variableName} ${current.operator || '=='} ${compareValue}`);
        if (global.isWord) {
          lines.push(`    ld hl, (${global.asmName})`);
        } else {
          lines.push(`    ld a, (${global.asmName})`);
          lines.push('    ld l, a');
          lines.push('    ld h, 0');
        }
        lines.push(`    ld de, ${formatHexWord(compareValue)}`);
        lines.push(`    ld a, ${getMsx2GameFlowOperatorId(current.operator)}`);
        lines.push('    call msx2_gf_compare_hl_de');
        lines.push('    or a');
        lines.push(`    jp nz, ${labelForNodeId(thenTarget) || '.main_loop'}`);
        lines.push(jumpToNodeOrMain(elseTarget || defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'Screen4Screen': {
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, getFlowBackgroundScreenAssetId(current));
        if (!label) {
          throw new Error(`MSX2 SCREEN 4 GameFlow Screen4Screen node ${current.id} must reference an exportable SCREEN 4 room.`);
        }
        lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        if (current.waitForKey === false) {
          const frames = Math.max(0, Math.min(255, Math.trunc(Number(current.waitFrames) || 0)));
          if (frames > 0) {
            lines.push(`    ld b, ${formatHexByte(frames)}`);
            lines.push(`.${labelForNodeId(current.id)}_wait_frames:`);
            lines.push('    halt');
            lines.push(`    djnz .${labelForNodeId(current.id)}_wait_frames`);
          }
        } else {
          lines.push('    call wait_key_release');
          lines.push('    call wait_key');
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'Text': {
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, getFlowBackgroundScreenAssetId(current)) || fallbackLabel;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        const dataLabel = `${labelForNodeId(current.id)}_TEXT`;
        dataBlocks.push(buildMsx2TextNodeData(dataLabel, current, analysis));
        lines.push('    call load_msx2_hud_font');
        lines.push(`    call draw_${dataLabel}`);
        if (current.waitForKey === false) {
          const frames = Math.max(0, Math.min(255, Math.trunc(Number(current.waitFrames) || 0)));
          if (frames > 0) {
            lines.push(`    ld b, ${formatHexByte(frames)}`);
            lines.push(`.${dataLabel}_wait_frames:`);
            lines.push('    halt');
            lines.push(`    djnz .${dataLabel}_wait_frames`);
          }
        } else {
          lines.push('    call wait_key_release');
          lines.push('    call wait_key');
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'TextScroll': {
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, getFlowBackgroundScreenAssetId(current)) || fallbackLabel;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        const dataLabel = `${labelForNodeId(current.id)}_TEXTSCROLL`;
        dataBlocks.push(buildMsx2TextScrollNodeData(dataLabel, current, analysis));
        lines.push('    call load_msx2_hud_font');
        lines.push(`    call draw_${dataLabel}`);
        if (current.waitForKey === false) {
          const frames = Math.max(0, Math.min(255, Math.trunc(Number(current.waitFrames) || 0)));
          if (frames > 0) {
            lines.push(`    ld b, ${formatHexByte(frames)}`);
            lines.push(`.${dataLabel}_wait_frames:`);
            lines.push('    halt');
            lines.push(`    djnz .${dataLabel}_wait_frames`);
          }
        } else {
          lines.push('    call wait_key_release');
          lines.push('    call wait_key');
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'TextScrollColor': {
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, getFlowBackgroundScreenAssetId(current)) || fallbackLabel;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        const dataLabel = `${labelForNodeId(current.id)}_TEXTSCROLL_COLOR`;
        dataBlocks.push(buildMsx2TextScrollColorNodeData(dataLabel, current, analysis));
        const fg = getMsx2Screen4ColorNibble(current.textColorIndex, 15);
        const bg = getMsx2Screen4ColorNibble(current.backgroundColorIndex, 1);
        lines.push('    call load_msx2_hud_font');
        lines.push(`    ld a, ${formatHexByte((fg << 4) | bg)}`);
        lines.push('    call fill_msx2_hud_font_color');
        lines.push(`    call draw_${dataLabel}`);
        if (current.waitForKey === false) {
          const frames = Math.max(0, Math.min(255, Math.trunc(Number(current.waitFrames) || 0)));
          if (frames > 0) {
            lines.push(`    ld b, ${formatHexByte(frames)}`);
            lines.push(`.${dataLabel}_wait_frames:`);
            lines.push('    halt');
            lines.push(`    djnz .${dataLabel}_wait_frames`);
          }
        } else {
          lines.push('    call wait_key_release');
          lines.push('    call wait_key');
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'Controls': {
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, getFlowBackgroundScreenAssetId(current)) || fallbackLabel;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        const dataLabel = `${labelForNodeId(current.id)}_CONTROLS`;
        dataBlocks.push(buildMsx2ControlsTextData(dataLabel, current, analysis));
        lines.push(`    ld a, ${formatHexByte(getMsx2ControlsKeyButton1Mode(current))}`);
        lines.push('    ld (msx2_input_key_button1_mode), a');
        lines.push(`    ld a, ${formatHexByte(getMsx2ControlsKeyButton2Mode(current))}`);
        lines.push('    ld (msx2_input_key_button2_mode), a');
        lines.push(`    ld a, ${formatHexByte(getMsx2ControlsActionButtonMode(current.jumpActionButton ?? current.jumpButton, 'button1'))}`);
        lines.push('    ld (msx2_control_jump_button), a');
        lines.push(`    ld a, ${formatHexByte(getMsx2ControlsActionButtonMode(current.actionButton ?? current.gameActionButton, 'button2'))}`);
        lines.push('    ld (msx2_control_action_button), a');
        lines.push('    call load_msx2_hud_font');
        lines.push(`    call draw_${dataLabel}`);
        if (current.waitForKey === false) {
          const frames = Math.max(0, Math.min(255, Math.trunc(Number(current.waitFrames) || 0)));
          if (frames > 0) {
            lines.push(`    ld b, ${formatHexByte(frames)}`);
            lines.push(`.${dataLabel}_wait_frames:`);
            lines.push('    halt');
            lines.push(`    djnz .${dataLabel}_wait_frames`);
          }
        } else {
          lines.push('    call wait_key_release');
          lines.push('    call wait_key');
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'SubMenu': {
        const backgroundLabel = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, getFlowBackgroundScreenAssetId(current));
        if (backgroundLabel) lines.push(buildMsx2TileScreenLoadLines(backgroundLabel, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        const options = Array.isArray(current.options) ? current.options.slice(0, 6) : [];
        if (options.length === 0) {
          lines.push('    call wait_key_release');
          lines.push('    call wait_key');
          lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
          break;
        }
        const dataLabel = `${labelForNodeId(current.id)}_SUBMENU`;
        dataBlocks.push(buildMsx2SubMenuTextData(dataLabel, current, analysis));
        lines.push('    call load_msx2_hud_font');
        lines.push(`    call draw_${dataLabel}`);
        lines.push(`    ld b, ${options.length}`);
        lines.push('    call msx2_submenu_select');
        options.forEach((option: any, index: number) => {
          const targetLabel = labelForNodeId(sourceTargetNodeId(graph.connections, current.id, option?.id));
          if (targetLabel) {
            lines.push(`    cp ${index}`);
            lines.push(`    jp z, ${targetLabel}`);
          }
        });
        lines.push(jumpToNodeOrMain(current.id));
        break;
      }
      case 'WorldLink': {
        const screenAssetId = resolveWorldStartScreenAssetId(analysis, getGameFlowWorldAssetId(current));
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, screenAssetId) || fallbackLabel;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel, refreshHardwareSprites).trimEnd());
        if (refreshSnakeChars) lines.push('    call init_msx2_snake_char');
        if (showShooterStageBanner) {
          lines.push('    call draw_msx2_stage_banner');
          lines.push('    call wait_msx2_stage_banner');
          lines.push('    call load_current_msx2_screen4');
        }
        lines.push('    jp .main_loop');
        break;
      }
      case 'Transition': {
        const transitionLines = buildMsx2GameFlowTransitionLines(current.effect, label, current.durationFrames);
        if (transitionLines.length > 0) {
          lines.push(...transitionLines);
        } else {
          throw new Error(`MSX2 SCREEN 4 GameFlow transition "${current.effect || ''}" is not supported.`);
        }
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
      }
      case 'End': {
        const hasEndText = Boolean(String(current.title || '').trim() || String(current.message || '').trim());
        if (hasEndText) {
          const dataLabel = `${labelForNodeId(current.id)}_END`;
          dataBlocks.push(buildMsx2TextNodeData(dataLabel, {
            title: current.title || 'END',
            message: current.message || '',
            waitForKey: current.waitForKey,
          }, analysis));
          lines.push('    call load_msx2_hud_font');
          lines.push(`    call draw_${dataLabel}`);
          if (current.waitForKey === false) {
            const frames = Math.max(0, Math.min(255, Math.trunc(Number(current.waitFrames) || 0)));
            if (frames > 0) {
              lines.push(`    ld b, ${formatHexByte(frames)}`);
              lines.push(`.${dataLabel}_wait_frames:`);
              lines.push('    halt');
              lines.push(`    djnz .${dataLabel}_wait_frames`);
            }
          } else {
            lines.push('    call wait_key_release');
            lines.push('    call wait_key');
          }
        }
        lines.push('    jp .main_loop');
        break;
      }
      case 'Restart':
        lines.push('    jp init_rom');
        break;
      default:
        unsupported.add(current.type);
        lines.push(jumpToNodeOrMain(defaultTargetNodeId(graph.connections, current.id)));
        break;
    }

    const nextNodeIds = [
      defaultTargetNodeId(graph.connections, current.id),
      current.type === 'IfThenElse' ? sourceTargetNodeId(graph.connections, current.id, ['then']) : undefined,
      current.type === 'IfThenElse' ? sourceTargetNodeId(graph.connections, current.id, ['else']) : undefined,
      ...(Array.isArray(current.options) ? current.options.map((option: any) => sourceTargetNodeId(graph.connections, current.id, option?.id)) : []),
    ].filter(Boolean);
    for (const nextNodeId of nextNodeIds) {
      const nextNode = nextNodeId ? nodeById.get(nextNodeId) : undefined;
      if (nextNode) emitNode(nextNode);
    }
  };

  emitNode(nodeById.get(startNodeId));

  if (unsupported.size > 0) {
    lines.push(`    ; Unsupported MSX2 GameFlow nodes skipped in MVP: ${Array.from(unsupported).join(', ')}`);
  }
  return `${buildMsx2GameFlowGlobalEquates(globalMap)}${lines.join('\n')}\n${buildMsx2GameFlowCompareRoutine(hasIfThenElse)}${dataBlocks.join('')}`;
}

function buildMsx2WorldTransitionAsm(
  analysis: ProjectAnalysis,
  tileScreens: Msx2Screen4TileScreen[],
  tileScreenLoadLabels: string[]
): string {
  const mazeMovement = usesMazeMovement(analysis);
  const screenIndexById = new Map<string, number>();
  tileScreens.forEach((screen, index) => {
    if (screen.id) screenIndexById.set(screen.id, index);
  });

  const transitions = new Map<number, { west?: number; east?: number }>();
  const setTransition = (fromIndex: number, direction: 'west' | 'east', toIndex: number) => {
    const entry = transitions.get(fromIndex) || {};
    entry[direction] = toIndex;
    transitions.set(fromIndex, entry);
  };

  const graph = getScreen4RuntimeGameFlow(analysis);
  for (const node of graph?.nodes || []) {
    if (node.type !== 'WorldLink') continue;
    const world = resolveWorldByAssetId(analysis, getGameFlowWorldAssetId(node));
    if (!world?.nodes?.length) continue;
    const worldNodeById = new Map<string, any>((world.nodes || []).map((worldNode: any) => [String(worldNode?.id || ''), worldNode]));
    for (const connection of world.connections || []) {
      const fromNode = worldNodeById.get(String(connection?.fromNodeId || ''));
      const toNode = worldNodeById.get(String(connection?.toNodeId || ''));
      const fromIndex = screenIndexById.get(fromNode?.screenAssetId || fromNode?.screenId);
      const toIndex = screenIndexById.get(toNode?.screenAssetId || toNode?.screenId);
      if (fromIndex === undefined || toIndex === undefined) continue;
      if (connection?.fromDirection === 'west' || connection?.fromDirection === 'east') {
        setTransition(fromIndex, connection.fromDirection, toIndex);
      }
    }
  }

  const buildDirectionRoutine = (direction: 'west' | 'east'): string => {
    const suffix = direction === 'west' ? 'left' : 'right';
    const enterX = direction === 'west' ? 238 : 2;
    const handlers = tileScreenLoadLabels.map((_label, index) => {
      const targetIndex = transitions.get(index)?.[direction];
      return `    cp ${index}
    jp z, .${suffix}_screen_${index}
`;
    }).join('');
    const cases = tileScreenLoadLabels.map((_label, index) => {
      const targetIndex = transitions.get(index)?.[direction];
      if (targetIndex === undefined) {
        return `.${suffix}_screen_${index}:
    jp upload_hardware_sprite_attrs
`;
      }
      const targetLabel = tileScreenLoadLabels[targetIndex];
      const targetStart = getPlayerStartFromTileScreen(tileScreens[targetIndex]);
      const enterY = clampHardwareSpriteY(targetStart?.y ?? 144);
      const mazeDirectionReset = mazeMovement
        ? `    ld a, ${direction === 'west' ? 0 : 1}
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_sprite_frame), a
`
        : '';
      const resumeAfterTransition = mazeMovement ? 'upload_hardware_sprite_attrs' : 'update_hardware_sprite_vertical';
      return `.${suffix}_screen_${index}:
    ld a, ${targetIndex}
    ld (msx2_current_screen_index), a
    call load_${targetLabel}_screen4
    call msx2_reset_screen_transition_flags
    call msx2_reset_enemy_runtime_for_current_screen
    call msx2_load_current_screen_air
    call draw_msx2_air_hud
    ld a, ${enterX}
    ld (msx2_player_sprite_x), a
    ld a, ${enterY}
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
${mazeDirectionReset}    jp ${resumeAfterTransition}
`;
    }).join('\n');

    return `msx2_try_world_edge_transition_${suffix}:
    ld a, (msx2_current_screen_index)
${handlers}    jp upload_hardware_sprite_attrs
${cases}`;
  };

  return `${buildDirectionRoutine('west')}
${buildDirectionRoutine('east')}`;
}

export function generateMsx2Screen4UnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2Screen4Config): string {
  const useKonamiDataBank = usesMsx2Screen4KonamiDataBank(config);
  const screens = collectReferencedScreens(analysis);
  const bitmaps = analysis.msx2Bitmaps || [];
  const tileScreens = collectReferencedTileScreens(analysis);
  if (screens.length || bitmaps.length) {
    throw new Error('MSX2 SCREEN 4 backend requires native msx2screen tile assets; legacy screenmap/msx2bitmap assets are not supported by this backend.');
  }
  if (tileScreens.length === 0) {
    throw new Error('MSX2 SCREEN 4 backend requires at least one native msx2screen tile asset.');
  }
  const slots = resolveScreen4Palette(analysis);
  const paletteBytes = buildPaletteBytes(slots);
  const title = projectName.replace(/[^ -~]/g, '');
  const screenLabels = new Map<string, string>();
  screens.forEach((screen, index) => {
    screenLabels.set(screen.id || screen.name || `screen_${index}`, sanitizeLabel(screen?.name || `legacy_screen_${index}`, `LEGACY_SCREEN_${index}`));
  });
  const tileScreenLabels = new Map<string, string>();
  const tileScreenLoadLabels = tileScreens.map((screen, index) => {
    const label = sanitizeLabel(screen?.name || `msx2_screen4_screen_${index}`, `MSX2_SCREEN4_SCREEN_${index}`);
    tileScreenLabels.set(screen.id || screen.name || `tile_screen_${index}`, label);
    return label;
  });
  const tileScreenBlocks = tileScreens.map((screen, index) => {
    const label = tileScreenLoadLabels[index];
    return buildTileScreenTileBlocks(label, screen);
  });
  const tileScreenIndexByLabel = new Map<string, number>();
  const runtimeLayerLabels = new Map<string, { collision: string; effects: string; behavior: string }>();
  tileScreens.forEach((screen, index) => {
    const label = tileScreenLoadLabels[index];
    tileScreenLabels.set(screen.id || screen.name || `tile_screen_${index}`, label);
    tileScreenIndexByLabel.set(label, index);
    runtimeLayerLabels.set(label, {
      collision: `${label}_COLLISION`,
      effects: `${label}_EFFECTS`,
      behavior: `${label}_BEHAVIOR`,
    });
  });
  const tileScreenRuntimeBlocks = tileScreens.map((screen, index) => {
    const label = tileScreenLoadLabels[index];
    return [
      formatBytes(`${label}_COLLISION`, buildTileScreenLayerBytes(screen, 'collision'), `${screen?.name || `MSX2 Tile Screen ${index}`} collision layer, 16x14 bytes`),
      formatBytes(`${label}_EFFECTS`, buildTileScreenLayerBytes(screen, 'effects'), `${screen?.name || `MSX2 Tile Screen ${index}`} effects layer, 16x14 bytes`),
      formatBytes(`${label}_BEHAVIOR`, buildTileScreenLayerBytes(screen, 'behavior'), `${screen?.name || `MSX2 Tile Screen ${index}`} behavior layer, 16x14 bytes`),
    ].join('\n');
  });
  const emptyRuntimeLayerBlocks = tileScreens.length === 0
    ? [
      formatBytes('screen4_empty_collision_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 SCREEN 4 collision layer, 16x12 cells'),
      formatBytes('screen4_empty_effects_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 SCREEN 4 effects layer, 16x12 cells'),
      formatBytes('screen4_empty_behavior_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 SCREEN 4 behavior layer, 16x12 cells'),
    ].join('\n')
    : '';
  const firstScreenLabel = tileScreenLoadLabels[0];
  const hardwareSpriteInitAsm = buildHardwareSpriteInitAsm(analysis, useKonamiDataBank);
  const hardwareSpriteDataAsm = buildHardwareSpriteDataAsm(analysis);
  const requiredCollectiblesByScreen = tileScreens.map(screen => getTileScreenRequiredCollectibles(screen));
  const requiredCollectibles = Math.min(255, Math.max(0, ...requiredCollectiblesByScreen));
  const initialAirByScreen = tileScreens.map(screen => getTileScreenInitialAir(screen));
  const hudStyleByScreen = tileScreens.map(screen => getTileScreenHudStyle(screen));
  const hudPlayerEnergyMaxByScreen = tileScreens.map(screen => getTileScreenRuntimeByte(screen, 'playerEnergyMax', 16, 1));
  const hudPlayerEnergyInitialByScreen = tileScreens.map((screen, index) =>
    Math.min(hudPlayerEnergyMaxByScreen[index] ?? 16, getTileScreenRuntimeByte(screen, 'playerEnergyInitial', hudPlayerEnergyMaxByScreen[index] ?? 16, 1))
  );
  const hudBossEnergyMaxByScreen = tileScreens.map(screen => getTileScreenRuntimeByte(screen, 'bossEnergyMax', 16, 1));
  const hudBossEnergyInitialByScreen = tileScreens.map((screen, index) =>
    Math.min(hudBossEnergyMaxByScreen[index] ?? 16, getTileScreenRuntimeByte(screen, 'bossEnergyInitial', hudBossEnergyMaxByScreen[index] ?? 16, 1))
  );
  const hudPrimaryColorByScreen = tileScreens.map(screen => getTileScreenRuntimeByte(screen, 'hudPrimaryColor', 10, 0, 15));
  const hudSecondaryColorByScreen = tileScreens.map(screen => getTileScreenRuntimeByte(screen, 'hudSecondaryColor', 8, 0, 15));
  const hudBorderColorByScreen = tileScreens.map(screen => getTileScreenRuntimeByte(screen, 'hudBorderColor', 15, 0, 15));
  const hudEmptyColorByScreen = tileScreens.map(screen => getTileScreenRuntimeByte(screen, 'hudEmptyColor', 4, 0, 15));
  const hudWidgetsByScreen = tileScreens.map(screen => getTileScreenHudWidgets(screen));
  const hudWidgetCountByScreen = hudWidgetsByScreen.map(widgets => widgets.length);
  let hudWidgetRecordOffset = 0;
  const hudWidgetRecordOffsetByScreen = hudWidgetCountByScreen.map(count => {
    const offset = hudWidgetRecordOffset;
    hudWidgetRecordOffset += count * 12;
    return offset;
  });
  const hudWidgetRecords = hudWidgetsByScreen.flatMap(widgets => widgets.flatMap(widget => [
    hudWidgetKindId(widget),
    hudWidgetBindingId(widget),
    hudWidgetByte(widget, 'x', 0),
    hudWidgetByte(widget, 'y', 0),
    hudWidgetByte(widget, 'width', 64, 1),
    hudWidgetByte(widget, 'height', 6, 1),
    hudWidgetByte(widget, 'maxValue', 16, 1),
    hudWidgetByte(widget, 'initialValue', hudWidgetByte(widget, 'maxValue', 16, 1)),
    hudWidgetByte(widget, 'primaryColor', 10, 0, 15),
    hudWidgetByte(widget, 'secondaryColor', 8, 0, 15),
    hudWidgetByte(widget, 'borderColor', 15, 0, 15),
    hudWidgetByte(widget, 'emptyColor', 4, 0, 15),
  ]));
  const hudWidgetsFlat = hudWidgetsByScreen.flat();
  const hudWidgetIconTileByWidget = hudWidgetsFlat.map(widget =>
    hudWidgetKindId(widget) === MSX2_HUD_WIDGET_KIND_IDS.icon
      ? hudWidgetByte(widget, 'iconTileIndex', 0)
      : 0xff
  );
  const hudWidgetTextBytesByWidget = hudWidgetsFlat.map(widget =>
    hudWidgetKindId(widget) === MSX2_HUD_WIDGET_KIND_IDS.text
      ? encodeHudAscii(widget?.text || widget?.name || '', 31)
      : []
  );
  const hudWidgetTextPool: number[] = [0];
  const hudWidgetTextOffsetByWidget = hudWidgetTextBytesByWidget.map(bytes =>
    appendHudStringPoolEntry(hudWidgetTextPool, bytes)
  );
  const hudWidgetTextLengthByWidget = hudWidgetTextBytesByWidget.map(bytes => bytes.length);
  const hudWidgetVariableNameBytesByWidget = hudWidgetsFlat.map(widget =>
    hudWidgetBindingId(widget) === MSX2_HUD_WIDGET_BINDING_IDS.custom
      ? encodeHudAscii(widget?.variableName || widget?.name || '', 31, true)
      : []
  );
  const hudWidgetVariableNamePool: number[] = [0];
  const hudWidgetVariableNameOffsetByWidget = hudWidgetVariableNameBytesByWidget.map(bytes =>
    appendHudStringPoolEntry(hudWidgetVariableNamePool, bytes)
  );
  const hudWidgetVariableNameLengthByWidget = hudWidgetVariableNameBytesByWidget.map(bytes => bytes.length);
  const attackWaveSettingsByScreen = tileScreens.map(screen => getGalaxianAttackWaveSettingsForScreen(screen));
  const collectibleErasePaletteIndex = getCollectibleErasePaletteIndex(tileScreens);
  const collectibleErasePackedByte = ((collectibleErasePaletteIndex & 0x0f) << 4) | (collectibleErasePaletteIndex & 0x0f);
  const effectRuntimeBase = MSX2_EFFECT_RUNTIME_BASE;
  const effectRuntimeSize = Math.max(1, tileScreens.length) * MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT;
  const effectScratchBase = Math.max(0xC200, (effectRuntimeBase + effectRuntimeSize + 0x0f) & 0xfff0);
  const enemyRuntimeBase = (effectScratchBase + (MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT) + 0x0f) & 0xfff0;
  const coreRuntimeRamEnd = estimateMsx2RuntimeRamEnd(tileScreens.length);
  const runtimeRamEnd = estimateMsx2GameFlowRuntimeRamEnd(analysis, coreRuntimeRamEnd);
  if (runtimeRamEnd > MSX2_RUNTIME_RAM_LIMIT) {
    const maxScreens = maxPersistentMsx2ScreenCount();
    throw new Error(
      `MSX2 SCREEN 4 runtime RAM overflow: ${tileScreens.length} native msx2screen rooms require ` +
      `${runtimeRamEnd - MSX2_RUNTIME_RAM_START} bytes through ${formatHexWord(runtimeRamEnd)}, ` +
      `beyond safe limit ${formatHexWord(MSX2_RUNTIME_RAM_LIMIT)}. ` +
      `Reduce referenced rooms, split the WorldMap, or add a banked/streamed MSX2 runtime path. ` +
      `Current simple runtime supports about ${maxScreens} rooms with persistent effects.`
    );
  }
  const gameFlowProgram = buildMsx2GameFlowProgram(analysis, screenLabels, tileScreenLabels, tileScreenIndexByLabel, coreRuntimeRamEnd);
  const spawnXBytes = tileScreens.map(screen => clampHardwareSpriteX(getPlayerStartFromTileScreen(screen)?.x ?? 96));
  const spawnYBytes = tileScreens.map(screen => clampHardwareSpriteY(getPlayerStartFromTileScreen(screen)?.y ?? 144));
  const enemyHazards = tileScreens.map(screen => getMsx2EnemyHazardRuntimeSlots(screen));
  const enemyCountBytes = enemyHazards.map(enemies => Math.min(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN, enemies.length));
  const enemyXBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => clampHardwareSpriteX(enemies[index]?.x ?? 0))
  );
  const enemyYBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => clampHardwareSpriteY(enemies[index]?.y ?? 0))
  );
  const enemyMinXBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => clampHardwareSpriteX(enemies[index]?.minX ?? 0))
  );
  const enemyMaxXBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => clampHardwareSpriteX(enemies[index]?.maxX ?? 0))
  );
  const enemyMinYBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => clampHardwareSpriteY(enemies[index]?.minY ?? 0))
  );
  const enemyMaxYBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => clampHardwareSpriteY(enemies[index]?.maxY ?? 0))
  );
  const signedRuntimeByte = (value: number | undefined): number => {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric >= 0 && numeric <= 255) return Math.floor(numeric);
    return Math.max(0, Math.min(255, Math.floor(numeric) & 0xFF));
  };
  const enemyDxBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => signedRuntimeByte(enemies[index]?.dx))
  );
  const enemyDyBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => signedRuntimeByte(enemies[index]?.dy))
  );
  const enemyModeBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => Math.max(0, Math.min(255, enemies[index]?.mode ?? 0)))
  );
  const enemySpeedBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => Math.max(1, Math.min(240, enemies[index]?.speed ?? 2)))
  );
  const enemyScoreBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => Math.max(1, Math.min(255, enemies[index]?.score ?? 1)))
  );
  const worldTransitionAsm = buildMsx2WorldTransitionAsm(analysis, tileScreens, tileScreenLoadLabels);
  const screen4GameFlow = getScreen4RuntimeGameFlow(analysis);
  const includeGameFlowTransitionHelpers = Boolean(screen4GameFlow?.nodes?.some((node: any) => node?.type === 'Transition'));
  const includeGameFlowMusicHelpers = Boolean(screen4GameFlow?.nodes?.some((node: any) => node?.type === 'Music'));
  const gameFlowTransitionHelperAsm = buildMsx2GameFlowTransitionHelpersAsm(includeGameFlowTransitionHelpers);
  const gameFlowMusicHelperAsm = buildMsx2GameFlowMusicHelpersAsm(includeGameFlowMusicHelpers);
  const firstScreenIndex = tileScreenIndexByLabel.get(firstScreenLabel);
  const firstScreenIndexInit = firstScreenIndex === undefined
    ? ''
    : `    ld a, ${firstScreenIndex}\n    ld (msx2_current_screen_index), a\n`;
  const firstScreenEnemyRuntimeInit = firstScreenIndex === undefined || !hasHardwareSprite(analysis)
    ? ''
    : '    call msx2_reset_enemy_runtime_for_current_screen\n';
  const hardwareSpriteRuntimeAsm = hasHardwareSprite(analysis)
    ? buildHardwareSpriteRuntimeAsm(analysis, requiredCollectibles, firstScreenLabel, firstScreenIndex ?? 0, tileScreens.length)
    : `upload_hardware_sprite_attrs:
write_hardware_sprite_attrs:
update_hardware_sprite_input:
update_msx2_air_timer:
    ret

draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
draw_msx2_game_over_banner:
draw_msx2_level_complete_banner:
draw_msx2_stage_banner:
wait_msx2_stage_banner:
reset_msx2_status_border:
    ret
`;
  const vramByteWriteAsm = buildMsx2VramByteWriteAsm();
  const hudTextRuntimeAsm = buildMsx2HudTextRuntimeAsm(analysis, useKonamiDataBank);
  const backgroundScrollEnabled = usesShooterHorizontalMovement(analysis) && usesMsx2Screen4BackgroundScroll(analysis);
  const backgroundScrollAsm = backgroundScrollEnabled
    ? buildScreen4BackgroundScrollAsm(tileScreenLoadLabels, useKonamiDataBank)
    : '';
  const snakeCharMovement = usesSnakeCharMovement(analysis);
  const stageBannerEnabled = hasHardwareSprite(analysis) && usesShooterHorizontalMovement(analysis);
  const snakeCharRuntimeAsm = buildSnakeCharRuntimeAsm(analysis);
  const hudFontPatternDataAsm = `${formatBytes('msx2_hud_font_patterns', buildMsx2HudFontPatternBytes(analysis), 'MSX2 SCREEN 4 HUD font patterns: space, digits, A-Z, colon, dash, slash')}msx2_hud_font_patterns_end:
`;
  const projectSliceJson = buildMsx2ProjectSliceJson(projectName, analysis, config, tileScreens, runtimeRamEnd, useKonamiDataBank);
  const projectSliceData = JSON.parse(projectSliceJson);
  const projectSliceArtifact = renderNamedArtifactAsCommentBlock(
    'project_slice.json',
    projectSliceJson
  );
  const assetStoragePolicyArtifact = renderNamedArtifactAsCommentBlock(
    'asset_storage_policy.json',
    JSON.stringify(projectSliceData.assetStoragePolicy, null, 2) + '\n'
  );
  const logicalBankBudgetArtifact = renderNamedArtifactAsCommentBlock(
    'logical_bank_budget.json',
    JSON.stringify(projectSliceData.logicalBankBudget, null, 2) + '\n'
  );
  const worldBankManifestArtifact = renderNamedArtifactAsCommentBlock(
    'msx2_world_bank_manifest.json',
    JSON.stringify(projectSliceData.worldBankManifest, null, 2) + '\n'
  );
  const ramBudgetArtifact = renderNamedArtifactAsCommentBlock(
    'ram_budget.json',
    JSON.stringify(projectSliceData.ramBudget, null, 2) + '\n'
  );
  const loadRuntimeLayerPointers = (label: string, screenIndex?: number): string => {
    const runtimeLabels = runtimeLayerLabels.get(label);
    const collisionLabel = runtimeLabels?.collision || 'screen4_empty_collision_layer';
    const effectsLabel = runtimeLabels?.effects || 'screen4_empty_effects_layer';
    const behaviorLabel = runtimeLabels?.behavior || 'screen4_empty_behavior_layer';
    const runtimeEffectsAddress = screenIndex === undefined
      ? undefined
      : effectRuntimeBase + (screenIndex * MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT);
    const loadEffectsPointer = runtimeEffectsAddress === undefined
      ? `    ld hl, ${effectsLabel}
    ld de, msx2_effects_runtime_scratch
    ld bc, msx2_layer_size
    ldir
    ld hl, msx2_effects_runtime_scratch
    ld (msx2_current_effects_ptr), hl
`
      : `    ld hl, #${runtimeEffectsAddress.toString(16).toUpperCase().padStart(4, '0')}
    ld (msx2_current_effects_ptr), hl
`;
    return `    ld hl, ${collisionLabel}
    ld (msx2_current_collision_ptr), hl
    ld hl, ${behaviorLabel}
    ld (msx2_current_behavior_ptr), hl
${loadEffectsPointer}`;
  };
  const tileScreenAfterPatternLoad = snakeCharMovement ? '    call msx2_snake_load_runtime_chars\n' : '';
  const tileScreenLoadRoutines = tileScreens.map((screen, index) =>
    buildTileScreenLoadRoutine(
      tileScreenLoadLabels[index],
      screen,
      index,
      loadRuntimeLayerPointers,
      tileScreenAfterPatternLoad,
      `    call load_msx2_hud_font\n    call draw_${tileScreenLoadLabels[index]}_hud_text\n`,
      useKonamiDataBank
    )
  );
  const tileScreenHudTextRoutines = tileScreens.map((screen, index) =>
    buildMsx2HudTextRoutines(tileScreenLoadLabels[index], screen, analysis)
  );
  const loadCurrentTileScreenDispatcher = buildLoadCurrentTileScreenDispatcher(tileScreenLoadLabels);
  const tileScreenCollectedVisualRoutines = tileScreens.map((screen, index) =>
    buildTileScreenCollectedVisualsRoutine(tileScreenLoadLabels[index], screen, index, effectRuntimeBase)
  );
  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: ${title}
; Screen mode: ${config.screenMode}
; ROM Mode: ${useKonamiDataBank ? 'megarom' : config.romMode}
; Mapper Target: ${config.targetFormat}
; Auto MegaROM: ${config.autoMegaROM ? 'Yes' : 'No'}
; MSX2 MegaROM Path: ${useKonamiDataBank ? 'Konami 8K fixed-bank0 compatibility' : 'simple linear ROM'}
; ROM mode requested: ${config.romMode}
; Mapper requested: ${config.targetFormat}
; ==================================================================

${projectSliceArtifact}

${assetStoragePolicyArtifact}

${logicalBankBudgetArtifact}

${worldBankManifestArtifact}

${ramBudgetArtifact}

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
FILVRM  EQU #0056
WRTVRM  EQU #004D
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
CHGET   EQU #009F
KILBUF  EQU #0156
GTSTCK  EQU #00D5
GTTRIG  EQU #00D8
SNSMAT  EQU #0141
RSLREG  EQU #0138
ENASLT  EQU #0024
HKEY    EQU #F3DB
HKEYI   EQU #FD9A
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
VDP_DATA_PORT EQU #98
VDP_CTRL_PORT EQU #99
SCREEN4_PATTERN_VRAM EQU ${SCREEN4_PATTERN_VRAM}
SCREEN4_NAME_VRAM EQU ${SCREEN4_NAME_VRAM}
SCREEN4_COLOR_VRAM EQU ${SCREEN4_COLOR_VRAM}
SCREEN4_PATTERN_SIZE EQU ${SCREEN4_PATTERN_BYTES}
SCREEN4_COLOR_SIZE EQU ${SCREEN4_COLOR_BYTES}
SCREEN4_NAME_SIZE EQU ${SCREEN4_NAME_BYTES}
msx2_player_sprite_x EQU #C000
msx2_player_sprite_y EQU #C001
msx2_player_sprite_dx EQU #C002
msx2_player_sprite_frame EQU #C003
msx2_current_collision_ptr EQU #C004
msx2_current_effects_ptr EQU #C006
msx2_player_jump_frames EQU #C008
msx2_player_on_ground EQU #C009
msx2_player_jump_lock EQU #C00A
msx2_current_screen_index EQU #C00B
msx2_player_dead_flag EQU #C00C
msx2_exit_reached_flag EQU #C00D
msx2_collectible_count EQU #C00E
msx2_collectible_latch EQU #C00F
msx2_exit_blocked_flag EQU #C010
msx2_lives EQU #C011
msx2_game_over_flag EQU #C012
msx2_game_over_restart_lock EQU #C013
msx2_level_complete_flag EQU #C014
msx2_level_continue_lock EQU #C015
msx2_enemy_hit_flag EQU #C016
msx2_enemy_damage_cooldown EQU #C017
msx2_air_value EQU #C018
msx2_air_frame_counter EQU #C019
msx2_current_behavior_ptr EQU #C01A
msx2_snake_growth_pending EQU #C01C
msx2_player_anim_counter EQU #C01D
msx2_player_anim_frame EQU #C01E
msx2_player_bullet_active EQU #C01F
msx2_player_bullet_x EQU #C020
msx2_player_bullet_y EQU #C021
msx2_player_bullet_cooldown EQU #C022
msx2_score_lo EQU #C023
msx2_score_hi EQU #C024
msx2_score_digit_vram EQU #C025
msx2_runtime_frame_counter EQU #C026
msx2_enemy_bullet_active EQU #C027
msx2_enemy_bullet_x EQU #C028
msx2_enemy_bullet_y EQU #C029
msx2_enemy_bullet_cooldown EQU #C02A
msx2_score_work_lo EQU #C02B
msx2_score_work_hi EQU #C02C
msx2_player_bullet_1_active EQU #C02D
msx2_player_bullet_1_x EQU #C02E
msx2_player_bullet_1_y EQU #C02F
msx2_snake_head_x EQU #C030
msx2_snake_head_y EQU #C031
msx2_snake_food_x EQU #C032
msx2_snake_food_y EQU #C033
msx2_snake_dir EQU #C034
msx2_snake_frame_counter EQU #C035
msx2_snake_speed_frames EQU #C036
msx2_snake_draw_char EQU #C037
msx2_snake_body_length EQU #C038
msx2_snake_growth_flag EQU #C039
msx2_music_tick EQU #C03A
msx2_music_step EQU #C03B
msx2_attack_timer EQU #C03C
msx2_attack_seed EQU #C03D
msx2_attack_cursor EQU #C03E
msx2_attack_pending EQU #C03F
msx2_bg_scroll_frame EQU #C03D
msx2_bg_scroll_fine EQU #C03F
msx2_input_key_button1_mode EQU ${formatHexWord(MSX2_CONTROLS_RAM_BASE)}
msx2_input_key_button2_mode EQU ${formatHexWord(MSX2_CONTROLS_RAM_BASE + 1)}
msx2_control_jump_button EQU ${formatHexWord(MSX2_CONTROLS_RAM_BASE + 2)}
msx2_control_action_button EQU ${formatHexWord(MSX2_CONTROLS_RAM_BASE + 3)}
MSX2_SCREEN4_DATA_BANK EQU 4
msx2_snake_body_cells EQU ${formatHexWord(MSX2_SNAKE_BODY_BASE)}
msx2_effects_runtime_buffers EQU ${formatHexWord(effectRuntimeBase)}
msx2_effects_runtime_scratch EQU ${formatHexWord(effectScratchBase)}
msx2_enemy_runtime_x EQU ${formatHexWord(enemyRuntimeBase)}
msx2_enemy_runtime_y EQU ${formatHexWord(enemyRuntimeBase + MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN)}
msx2_enemy_runtime_dx EQU ${formatHexWord(enemyRuntimeBase + (MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN * 2))}
msx2_enemy_runtime_dy EQU ${formatHexWord(enemyRuntimeBase + (MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN * 3))}
msx2_enemy_runtime_mode EQU ${formatHexWord(enemyRuntimeBase + (MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN * 4))}
msx2_enemy_runtime_speed EQU ${formatHexWord(enemyRuntimeBase + (MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN * 5))}
msx2_enemy_runtime_tick EQU ${formatHexWord(enemyRuntimeBase + (MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN * 6))}
msx2_runtime_ram_end EQU ${formatHexWord(runtimeRamEnd)}
msx2_runtime_ram_limit EQU ${formatHexWord(MSX2_RUNTIME_RAM_LIMIT)}
msx2_layer_size EQU ${MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT}
msx2_required_collectibles EQU ${requiredCollectibles}
MSX2_HUD_FONT_BASE_CHAR EQU #${getMsx2HudFontBaseChar(analysis).toString(16).toUpperCase().padStart(2, '0')}

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
    im 1
    ld sp, #F380
    call map_page2_to_cart_primary
    call init_konami8k_fixed_bank0_banks

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a

    call DISSCR
    ld a, 4
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    ld bc, #0602
    call WRTVDP
    ld bc, #FF03
    call WRTVDP
    ld bc, #0304
    call WRTVDP
    ld bc, #000A
    call WRTVDP

    call load_screen4_palette
${firstScreenIndexInit}    call init_msx2_effect_buffers
    call init_msx2_controls
    call load_${firstScreenLabel}_screen4
${backgroundScrollEnabled ? '    call install_msx2_split_scroll_hook\n    call init_msx2_bg_scroll\n' : ''}${firstScreenEnemyRuntimeInit}${hasHardwareSprite(analysis) ? '    call init_hardware_sprites\n' : ''}
${snakeCharMovement ? '    call init_msx2_snake_char\n' : ''}
${snakeCharMovement ? '    call init_msx2_snake_music\n' : ''}
    call ENASCR
    ei

${gameFlowProgram}
.main_loop:
${backgroundScrollEnabled ? '    call update_msx2_bg_scroll\n' : ''}${hasHardwareSprite(analysis) ? '    call update_hardware_sprite_input\n' : ''}
${hasHardwareSprite(analysis) ? '    call update_msx2_air_timer\n' : ''}
${snakeCharMovement ? '    call update_msx2_snake_char\n' : ''}
${snakeCharMovement ? '    call update_msx2_snake_music\n' : ''}
    call wait_frame_busy
    jr .main_loop

wait_frame_busy:
    ; VBlank-paced frame wait. On 60 Hz machines this locks gameplay to 60 frames/second.
    ei
    halt
    ret

map_page2_to_cart_primary:
    ; Keep #8000-#BFFF on the same slot as the cart page at #4000,
    ; including expanded-slot cartridges.
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jr z, .slot_ready
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

init_konami8k_fixed_bank0_banks:
    ; Konami without SCC: #4000-#5FFF is fixed segment 0.
    ; Runtime explicitly initializes the switchable #6000/#8000/#A000
    ; windows because their power-on contents are not guaranteed.
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ret

mapper_set_bank_p1:
    ; input: A=8KB physical segment for #6000-#7FFF. Clobbers no other registers.
    ld (#6000), a
    ret

mapper_set_bank_p2:
    ; input: A=8KB physical segment for #8000-#9FFF. Clobbers no other registers.
    ld (#8000), a
    ret

mapper_set_bank_p3:
    ; input: A=8KB physical segment for #A000-#BFFF. Clobbers no other registers.
    ld (#A000), a
    ret

msx2_screen4_data_bank_enter:
    ; Maps cold SCREEN 4 data to P2/#8000 while resident code runs from P0/P1.
    ; Clobbers AF. MSX2 SCREEN 4 runtime keeps normal P2 on bank 2.
    ld a, MSX2_SCREEN4_DATA_BANK
    jp mapper_set_bank_p2

msx2_screen4_data_bank_leave:
    ; Restores normal P2 bank 2 after cold data copies.
    ; Clobbers AF.
    ld a, 2
    jp mapper_set_bank_p2

init_msx2_controls:
    ; Defaults match legacy MSX1 Controls: B1=SPC, B2=N, jump=B1, action=B2. Clobbers AF.
    xor a
    ld (msx2_input_key_button1_mode), a
    ld (msx2_input_key_button2_mode), a
    ld (msx2_control_jump_button), a
    ld a, 1
    ld (msx2_control_action_button), a
    ret

msx2_control_jump_pressed:
    ; Output: A=1 when logical jump is pressed, A=0 otherwise. Clobbers AF/CD.
    call msx2_read_control_buttons
    bit 0, c
    jp z, .jump_not_pressed
    ld a, 1
    ret
.jump_not_pressed:
    xor a
    ret

msx2_control_action_pressed:
    ; Output: A=1 when logical action is pressed, A=0 otherwise. Clobbers AF/CD.
    call msx2_read_control_buttons
    bit 1, c
    jp z, .action_not_pressed
    ld a, 1
    ret
.action_not_pressed:
    xor a
    ret

msx2_read_control_buttons:
    ; Output: C bit0=logical jump, bit1=logical action. Clobbers AF/CD.
    ld d, 0
    xor a
    call GTTRIG
    or a
    jp z, .button1_keyboard
    set 0, d
.button1_keyboard:
    ld a, (msx2_input_key_button1_mode)
    or a
    jp nz, .button1_ctrl
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .button1_done
    set 0, d
    jp .button1_done
.button1_ctrl:
    ld a, 6
    call SNSMAT
    bit 2, a
    jp nz, .button1_done
    set 0, d
.button1_done:
    ld a, 3
    call GTTRIG
    or a
    jp z, .button2_keyboard
    set 1, d
.button2_keyboard:
    ld a, (msx2_input_key_button2_mode)
    or a
    jp nz, .button2_ctrl
    ld a, 4
    call SNSMAT
    bit 3, a
    jp nz, .button2_done
    set 1, d
    jp .button2_done
.button2_ctrl:
    ld a, 6
    call SNSMAT
    bit 2, a
    jp nz, .button2_done
    set 1, d
.button2_done:
    ld c, 0
    ld a, (msx2_control_jump_button)
    or a
    jp nz, .jump_uses_button2
    bit 0, d
    jp z, .jump_done
    set 0, c
    jp .jump_done
.jump_uses_button2:
    bit 1, d
    jp z, .jump_done
    set 0, c
.jump_done:
    ld a, (msx2_control_action_button)
    or a
    jp nz, .action_uses_button2
    bit 0, d
    ret z
    set 1, c
    ret
.action_uses_button2:
    bit 1, d
    ret z
    set 1, c
    ret

wait_key:
    ; Wait for the GameFlow Controls logical action button instead of raw BIOS CHGET.
.wait_action:
    call wait_frame_busy
    call msx2_control_action_pressed
    or a
    jp z, .wait_action
    call wait_key_release
    ret

wait_key_release:
    ; Debounce menu-confirm keys and clear BIOS keyboard buffer before action waits.
.release_loop:
    call wait_frame_busy
    call msx2_submenu_confirm_pressed
    or a
    jp nz, .release_loop
    call KILBUF
    ret

msx2_submenu_select:
    ; Input: B=option count, 1..6. Output: A=selected zero-based option.
    ; Uses BIOS GTSTCK plus the GameFlow Controls logical action button. Clobbers AF/BC/HL.
    ld c, 0
    push bc
    call draw_msx2_submenu_cursor
    pop bc
.loop:
    call wait_frame_busy
    ld a, 0
    push bc
    call GTSTCK
    pop bc
    cp 1
    jp z, .up
    cp 5
    jp z, .down
    push bc
    call msx2_submenu_confirm_pressed
    pop bc
    or a
    jp z, .loop
    ld a, c
    push af
.wait_confirm_release:
    call wait_frame_busy
    push bc
    call msx2_submenu_confirm_pressed
    pop bc
    or a
    jp nz, .wait_confirm_release
    pop af
    ret
.up:
    ld a, c
    or a
    jp z, .wait_neutral
    dec c
    push bc
    call draw_msx2_submenu_cursor
    pop bc
    jp .wait_neutral
.down:
    ld a, c
    inc a
    cp b
    jp nc, .wait_neutral
    ld c, a
    push bc
    call draw_msx2_submenu_cursor
    pop bc
    jp .wait_neutral
.wait_neutral:
    call wait_frame_busy
    ld a, 0
    push bc
    call GTSTCK
    pop bc
    or a
    jp nz, .wait_neutral
    jp .loop

msx2_submenu_confirm_pressed:
    ; Output: A=1 when either menu-confirm logical button is pressed.
    ; Clobbers AF/CD. Callers that need BC/DE/HL must preserve them.
    call msx2_control_action_pressed
    or a
    ret nz
    call msx2_control_jump_pressed
    ret

draw_msx2_submenu_cursor:
    ; Input: C=selected option index. Draws a simple '-' marker in fixed menu rows.
    ; Clobbers AF/BC/HL.
    ld hl, #19E5
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A05
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A25
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A45
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A65
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A85
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld a, c
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld bc, #19E5
    add hl, bc
    ld a, MSX2_HUD_FONT_BASE_CHAR + 38
    jp WRTVRM

${gameFlowTransitionHelperAsm}
${gameFlowMusicHelperAsm}
clear_screen4_name_cell_16:
    ; HL=top-left SCREEN 4 name-table cell for a 16x16 block. Clobbers AF/BC/HL.
    xor a
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    ld bc, 31
    add hl, bc
    xor a
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    ret

${snakeCharMovement ? `psg_write_direct:
    ; Input: A=PSG register, E=value. Clobbers AF.
    out (#A0), a
    ld a, e
    out (#A1), a
    ret

init_msx2_snake_music:
    ; Minimal PSG loop for the SCREEN 4 Snake slice. Clobbers AF/BC/DE/HL.
    xor a
    ld (msx2_music_tick), a
    ld (msx2_music_step), a
    ld a, 7
    ld e, #38
    call psg_write_direct
    ld a, 8
    ld e, 11
    call psg_write_direct
    ld a, 9
    ld e, 9
    call psg_write_direct
    ld a, 10
    ld e, 7
    call psg_write_direct
    jp msx2_snake_music_apply_step

update_msx2_snake_music:
    ; Tick is called from the main loop; reload at a coarse rate to avoid
    ; overwhelming the PSG and to keep the loop musical under C-BIOS/OpenMSX.
    ld a, (msx2_music_tick)
    inc a
    ld (msx2_music_tick), a
    cp 10
    ret c
    xor a
    ld (msx2_music_tick), a
    ld a, (msx2_music_step)
    inc a
    and #0F
    ld (msx2_music_step), a
    jp msx2_snake_music_apply_step

msx2_snake_music_apply_step:
    ; Clobbers AF/BC/DE/HL. Writes tone A/B/C and stable volumes.
    ld a, (msx2_music_step)
    ld c, a
    ld e, c
    ld d, 0
    ld hl, msx2_music_ch_a_lo
    add hl, de
    ld e, (hl)
    ld a, 0
    call psg_write_direct
    ld e, c
    ld d, 0
    ld hl, msx2_music_ch_a_hi
    add hl, de
    ld e, (hl)
    ld a, 1
    call psg_write_direct
    ld e, c
    ld d, 0
    ld hl, msx2_music_ch_b_lo
    add hl, de
    ld e, (hl)
    ld a, 2
    call psg_write_direct
    ld e, c
    ld d, 0
    ld hl, msx2_music_ch_b_hi
    add hl, de
    ld e, (hl)
    ld a, 3
    call psg_write_direct
    ld e, c
    ld d, 0
    ld hl, msx2_music_ch_c_lo
    add hl, de
    ld e, (hl)
    ld a, 4
    call psg_write_direct
    ld e, c
    ld d, 0
    ld hl, msx2_music_ch_c_hi
    add hl, de
    ld e, (hl)
    ld a, 5
    call psg_write_direct
    ret

msx2_music_ch_a_lo:
    db #53,#1D,#FE,#E3,#FE,#1D,#53,#7C,#53,#1D,#E3,#CA,#E3,#FE,#1D,#53
msx2_music_ch_a_hi:
    db #01,#01,#00,#00,#00,#01,#01,#01,#01,#01,#00,#00,#00,#00,#01,#01
msx2_music_ch_b_lo:
    db #4C,#4C,#F8,#89,#4C,#B8,#34,#89,#4C,#4C,#F8,#89,#4C,#B8,#34,#89
msx2_music_ch_b_hi:
    db #05,#05,#03,#03,#05,#04,#04,#03,#05,#05,#03,#03,#05,#04,#04,#03
msx2_music_ch_c_lo:
    db #A6,#E3,#1D,#E3,#A6,#E3,#1D,#E3,#A6,#E3,#1D,#E3,#A6,#E3,#1D,#E3
msx2_music_ch_c_hi:
    db #02,#00,#01,#00,#02,#00,#01,#00,#02,#00,#01,#00,#02,#00,#01,#00
` : ''}
${hardwareSpriteInitAsm}
${vramByteWriteAsm}
${hudTextRuntimeAsm}
${hardwareSpriteRuntimeAsm}
${snakeCharRuntimeAsm}
${backgroundScrollAsm}
${worldTransitionAsm}
load_screen4_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
${useKonamiDataBank ? '    call msx2_screen4_data_bank_enter\n' : ''}
    ld bc, #0010
    call WRTVDP
    ld hl, screen4_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
${useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : ''}
    ret

${buildInitEffectBuffersRoutine(tileScreenLoadLabels, effectRuntimeBase)}
${loadCurrentTileScreenDispatcher}
${[...tileScreenLoadRoutines, ...tileScreenCollectedVisualRoutines, ...tileScreenHudTextRoutines].join('\n')}
${useKonamiDataBank ? '' : formatBytes('screen4_palette_data', paletteBytes, 'Palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes('msx2_screen_spawn_x', spawnXBytes.length ? spawnXBytes : [96], 'Per-msx2screen respawn X coordinates')}
${formatBytes('msx2_screen_spawn_y', spawnYBytes.length ? spawnYBytes : [144], 'Per-msx2screen respawn Y coordinates')}
${formatBytes('msx2_screen_required_collectibles', requiredCollectiblesByScreen.length ? requiredCollectiblesByScreen : [requiredCollectibles], 'Per-msx2screen collectible count required before exits unlock')}
${formatBytes('msx2_screen_initial_air', initialAirByScreen.length ? initialAirByScreen : [255], 'Per-msx2screen initial air/time values')}
${formatBytes('msx2_screen_hud_style', hudStyleByScreen.length ? hudStyleByScreen : [0], 'Per-msx2screen HUD style: 0=compact runtime HUD, 1=status bars')}
${formatBytes('msx2_screen_hud_player_energy_max', hudPlayerEnergyMaxByScreen.length ? hudPlayerEnergyMaxByScreen : [16], 'Per-msx2screen planned player energy maximum')}
${formatBytes('msx2_screen_hud_player_energy_initial', hudPlayerEnergyInitialByScreen.length ? hudPlayerEnergyInitialByScreen : [16], 'Per-msx2screen planned player energy initial value')}
${formatBytes('msx2_screen_hud_boss_energy_max', hudBossEnergyMaxByScreen.length ? hudBossEnergyMaxByScreen : [16], 'Per-msx2screen planned boss energy maximum')}
${formatBytes('msx2_screen_hud_boss_energy_initial', hudBossEnergyInitialByScreen.length ? hudBossEnergyInitialByScreen : [16], 'Per-msx2screen planned boss energy initial value')}
${formatBytes('msx2_screen_hud_primary_color', hudPrimaryColorByScreen.length ? hudPrimaryColorByScreen : [10], 'Per-msx2screen planned player energy/fill color slot')}
${formatBytes('msx2_screen_hud_secondary_color', hudSecondaryColorByScreen.length ? hudSecondaryColorByScreen : [8], 'Per-msx2screen planned boss/secondary color slot')}
${formatBytes('msx2_screen_hud_border_color', hudBorderColorByScreen.length ? hudBorderColorByScreen : [15], 'Per-msx2screen planned HUD border color slot')}
${formatBytes('msx2_screen_hud_empty_color', hudEmptyColorByScreen.length ? hudEmptyColorByScreen : [4], 'Per-msx2screen planned HUD empty/background color slot')}
msx2_screen_hud_widget_record_size EQU 12
${formatBytes('msx2_screen_hud_widget_count', hudWidgetCountByScreen.length ? hudWidgetCountByScreen : [0], 'Per-msx2screen authored HUD widget counts')}
${formatWords('msx2_screen_hud_widget_offset', hudWidgetRecordOffsetByScreen.length ? hudWidgetRecordOffsetByScreen : [0], 'Per-msx2screen byte offsets into msx2_screen_hud_widget_records')}
${formatBytes('msx2_screen_hud_widget_records', hudWidgetRecords.length ? hudWidgetRecords : [0], 'Flat authored HUD widget records: kind,binding,x,y,w,h,max,initial,primary,secondary,border,empty')}
${formatBytes('msx2_screen_hud_widget_icon_tile', hudWidgetIconTileByWidget.length ? hudWidgetIconTileByWidget : [0xff], 'Per-widget icon tile index for icon HUD widgets, #FF means none')}
${formatWords('msx2_screen_hud_widget_text_offset', hudWidgetTextOffsetByWidget.length ? hudWidgetTextOffsetByWidget : [0], 'Per-widget byte offsets into msx2_screen_hud_widget_text_pool')}
${formatBytes('msx2_screen_hud_widget_text_length', hudWidgetTextLengthByWidget.length ? hudWidgetTextLengthByWidget : [0], 'Per-widget text lengths for text HUD widgets')}
${formatBytes('msx2_screen_hud_widget_text_pool', hudWidgetTextPool, 'Zero-terminated ASCII text payloads for text HUD widgets; offset 0 is empty')}
${formatWords('msx2_screen_hud_widget_variable_name_offset', hudWidgetVariableNameOffsetByWidget.length ? hudWidgetVariableNameOffsetByWidget : [0], 'Per-widget byte offsets into msx2_screen_hud_widget_variable_name_pool')}
${formatBytes('msx2_screen_hud_widget_variable_length', hudWidgetVariableNameLengthByWidget.length ? hudWidgetVariableNameLengthByWidget : [0], 'Per-widget variable name lengths for custom HUD bindings')}
${formatBytes('msx2_screen_hud_widget_variable_name_pool', hudWidgetVariableNamePool, 'Zero-terminated ASCII variable names for custom HUD bindings; offset 0 is empty')}
${useKonamiDataBank ? '' : hudFontPatternDataAsm}
${formatBytes('msx2_screen_attack_interval', attackWaveSettingsByScreen.map(settings => settings.intervalFrames), 'Per-msx2screen Galaxian Attack Wave interval in frames')}
${formatBytes('msx2_screen_attack_min', attackWaveSettingsByScreen.map(settings => settings.minAttackers), 'Per-msx2screen Galaxian Attack Wave minimum attackers')}
${formatBytes('msx2_screen_attack_max', attackWaveSettingsByScreen.map(settings => settings.maxAttackers), 'Per-msx2screen Galaxian Attack Wave maximum attackers')}
${formatBytes('msx2_screen_attack_seed', attackWaveSettingsByScreen.map(settings => settings.randomSeed), 'Per-msx2screen Galaxian Attack Wave random seed')}
${formatBytes('msx2_screen_enemy_count', enemyCountBytes.length ? enemyCountBytes : [0], `Per-msx2screen active enemy/hazard entity count, capped at ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}`)}
${formatBytes('msx2_screen_enemy_x', enemyXBytes.length ? enemyXBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard entity X coordinates, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_y', enemyYBytes.length ? enemyYBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard entity Y coordinates, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_min_x', enemyMinXBytes.length ? enemyMinXBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol minimum X, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_max_x', enemyMaxXBytes.length ? enemyMaxXBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol maximum X, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_min_y', enemyMinYBytes.length ? enemyMinYBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol minimum Y, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_max_y', enemyMaxYBytes.length ? enemyMaxYBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol maximum Y, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_dx', enemyDxBytes.length ? enemyDxBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard initial movement direction, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_dy', enemyDyBytes.length ? enemyDyBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard initial vertical movement direction, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_mode', enemyModeBytes.length ? enemyModeBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard movement component mode, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_speed', enemySpeedBytes.length ? enemySpeedBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(2), `Per-msx2screen enemy/hazard movement component frame delay, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_score', enemyScoreBytes.length ? enemyScoreBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(1), `Per-msx2screen enemy/hazard score value, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${emptyRuntimeLayerBlocks}
${stageBannerEnabled ? formatBytes('msx2_stage_font_patterns', [
  0x3E,0x60,0x60,0x3C,0x06,0x06,0x7C,0x00,
  0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0x00,
  0x18,0x24,0x42,0x7E,0x42,0x42,0x42,0x00,
  0x3C,0x42,0x40,0x4E,0x42,0x42,0x3C,0x00,
  0x7E,0x40,0x40,0x7C,0x40,0x40,0x7E,0x00,
  0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0x00,
  0x3C,0x42,0x02,0x0C,0x30,0x40,0x7E,0x00,
], 'Tiny centered STAGE banner font patterns: S,T,A,G,E,1,2') : ''}
${useKonamiDataBank ? '' : hardwareSpriteDataAsm}
${tileScreenRuntimeBlocks.join('\n')}
${useKonamiDataBank ? `    ds #C000 - $, #FF

; ==================================================================
; MSX2 SCREEN 4 cold data bank.
; Mapped to P2/#8000 only while copying palette, sprite patterns, and
; screen pattern/name data into VRAM. Resident gameplay code restores P2
; before returning to normal execution.
; ==================================================================
    org #8000
MSX2_SCREEN4_DATA_BANK_ROM_START:

${formatBytes('screen4_palette_data', paletteBytes, 'Palette bytes: byte1=(R<<4)|B, byte2=G')}
${hudFontPatternDataAsm}
${hardwareSpriteDataAsm}
${tileScreenBlocks.join('\n')}
    ds #A000 - $, #FF` : `${tileScreenBlocks.join('\n')}
    ds #C000 - $, #FF`}
    end
`;
}

export function generateMsx2Screen4Files(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2Screen4Config
): GeneratedASMFiles {
  validateMsx2Screen4RomConfig(config);
  const unitedFiles = generateMsx2Screen4UnitedFiles(projectName, analysis, config);
  return {
    'page0.asm': '; MSX2 SCREEN 4 backend: page0 not used in MVP.\n',
    'bios.asm': '; MSX2 SCREEN 4 backend emits BIOS equates in unitedFiles.asm.\n',
    'constants.asm': '; MSX2 SCREEN 4 backend constants are local to unitedFiles.asm.\n',
    'variables.asm': '; MSX2 SCREEN 4 backend has no RAM variables in MVP.\n',
    'mapper.asm': usesMsx2Screen4KonamiDataBank(config)
      ? '; MSX2 SCREEN 4 MegaROM MVP uses Konami 8K fixed-bank0 compatibility; mapper setup is emitted inline.\n'
      : '; MSX2 SCREEN 4 backend MVP is a simple ROM path.\n',
    'resource_ids.asm': '; MSX2 SCREEN 4 backend has no resource table in MVP.\n',
    'resource_table.asm': '; MSX2 SCREEN 4 backend has no resource table in MVP.\n',
    'resource_manager.asm': '; MSX2 SCREEN 4 backend has no resource manager in MVP.\n',
    'interrupt.asm': '; MSX2 SCREEN 4 backend uses Controls-mapped GameFlow waits and HALT loop in MVP.\n',
    'header.asm': '; MSX2 SCREEN 4 backend header is emitted in unitedFiles.asm.\n',
    'patterns.asm': '; SCREEN 2 pattern tables are intentionally not used by MSX2 SCREEN 4.\n',
    'colors.asm': '; SCREEN 2 color tables are intentionally not used by MSX2 SCREEN 4.\n',
    'components.asm': '; Components are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'entities.asm': '; MSX2 SCREEN 4 backend emits player spawn and enemy/hazard runtime data in unitedFiles.asm.\n',
    'worlds.asm': '; Worlds are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'screens.asm': '; SCREEN 4 name/pattern/color data is emitted in unitedFiles.asm.\n',
    'sprites.asm': hasHardwareSprite(analysis)
      ? '; MSX2 SCREEN 4 hardware sprite MVP is emitted inline in unitedFiles.asm.\n'
      : '; Sprites are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'font.asm': '; MSX2 SCREEN 4 HUD font patterns and loader are emitted inline in unitedFiles.asm.\n',
    'hud.asm': '; MSX2 SCREEN 4 HUD metadata, font text, lives, and collectible helpers are emitted inline in unitedFiles.asm.\n',
    'menus.asm': '; Menus are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'sound.asm': '; Sound is out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'scroll.asm': '; Scroll is out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'animtiles.asm': '; Animated tiles are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'bosses.asm': '; Bosses are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'statemachine.asm': '; State machines are out of scope for the first MSX2 SCREEN 4 backend slice.\n',
    'gameflow.asm': '; MSX2 SCREEN 4 minimal GameFlow is emitted inline in unitedFiles.asm.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
