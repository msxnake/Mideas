import { DEFAULT_SCREEN5_CUSTOM_PALETTE } from '../../../../constants';
import { GameFlowConnection, GameFlowNode, Msx2Bitmap, Msx2Screen5TileScreen, Msx2Sprite, PaletteAsset, Screen5PaletteSlot, ScreenMap, Tile } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';

interface Msx2Screen5Config {
  screenMode: 'SCREEN 5 (Graphics III)';
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
}

const SCREEN5_WIDTH = 256;
const SCREEN5_HEIGHT = 212;
const SCREEN5_BYTES = (SCREEN5_WIDTH * SCREEN5_HEIGHT) / 2;
const CELL_SIZE = 8;
const TRANSPARENT_HEX = 'RGBA(0,0,0,0)';
const SCREEN5_SPRATR_VRAM = '#7600';
const SCREEN5_SPRCOL_VRAM = '#7400';
const SCREEN5_SPRPAT_VRAM = '#7800';
const MSX2_TILE_SCREEN_WIDTH = 16;
const MSX2_TILE_SCREEN_HEIGHT = 14;
const MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN = 4;
const MSX2_MAX_PLAYER_HARDWARE_LAYERS = 32 - MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN - 1;
const MSX2_ENEMY_SPRITE_COLOR = 13;
const MSX2_ENEMY_SPRITE_PATTERN = [
  0x00, 0x03, 0x07, 0x0F, 0x1F, 0x1B, 0x3F, 0x3C,
  0x3C, 0x3F, 0x1B, 0x1F, 0x0F, 0x07, 0x03, 0x00,
  0x00, 0xC0, 0xE0, 0xF0, 0xF8, 0xD8, 0xFC, 0x3C,
  0x3C, 0xFC, 0xD8, 0xF8, 0xF0, 0xE0, 0xC0, 0x00,
];

const sanitizeLabel = (value: string, fallback: string): string =>
  String(value || fallback)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || fallback.toUpperCase();

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

function resolveScreen5Palette(analysis: ProjectAnalysis): Screen5PaletteSlot[] {
  const assets = (analysis as any).assets as Array<{ type?: string; data?: unknown }> | undefined;
  const paletteAsset = assets?.find(asset => asset?.type === 'palette')?.data as PaletteAsset | undefined;
  if (paletteAsset?.mode === 'SCREEN5' && paletteAsset.slots?.length === 16) {
    return paletteAsset.slots.map(slot => ({ ...slot }));
  }

  const bitmapPalette = (analysis.msx2Bitmaps || []).find(bitmap => bitmap.palette?.length === 16)?.palette;
  if (bitmapPalette?.length === 16) {
    return bitmapPalette.map(slot => ({ ...slot }));
  }

  const tileScreenPalette = (analysis.msx2Screens || []).find(screen => screen.palette?.length === 16)?.palette;
  if (tileScreenPalette?.length === 16) {
    return tileScreenPalette.map(slot => ({ ...slot }));
  }

  const tilePalette = (analysis.tiles || []).find(tile => tile.screen5Palette?.length === 16)?.screen5Palette;
  if (tilePalette?.length === 16) {
    return tilePalette.map(slot => ({ ...slot }));
  }

  return DEFAULT_SCREEN5_CUSTOM_PALETTE.map(slot => ({ ...slot }));
}

function paletteIndexForColor(color: string | undefined, slots: Screen5PaletteSlot[]): number {
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

function getTilePixel(tile: Tile | undefined, subTileX: number, subTileY: number, x: number, y: number): string | undefined {
  if (!tile) return undefined;
  return tile.data?.[(subTileY * CELL_SIZE) + y]?.[(subTileX * CELL_SIZE) + x];
}

function buildScreen5BitmapBytes(screen: ScreenMap | undefined, tiles: Tile[], slots: Screen5PaletteSlot[]): number[] {
  const bytes: number[] = [];
  const tileById = new Map(tiles.map(tile => [tile.id, tile]));
  const backgroundLayer = screen?.layers?.background || [];

  for (let y = 0; y < SCREEN5_HEIGHT; y++) {
    const cellY = Math.floor(y / CELL_SIZE);
    const pixelY = y % CELL_SIZE;
    for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
      const x0 = byteX * 2;
      const x1 = x0 + 1;
      const cellX0 = Math.floor(x0 / CELL_SIZE);
      const cellX1 = Math.floor(x1 / CELL_SIZE);
      const screenTile0 = backgroundLayer[cellY]?.[cellX0];
      const screenTile1 = backgroundLayer[cellY]?.[cellX1];
      const tile0 = screenTile0?.tileId ? tileById.get(screenTile0.tileId) : undefined;
      const tile1 = screenTile1?.tileId ? tileById.get(screenTile1.tileId) : undefined;
      const hi = paletteIndexForColor(
        getTilePixel(tile0, screenTile0?.subTileX || 0, screenTile0?.subTileY || 0, x0 % CELL_SIZE, pixelY),
        slots
      );
      const lo = paletteIndexForColor(
        getTilePixel(tile1, screenTile1?.subTileX || 0, screenTile1?.subTileY || 0, x1 % CELL_SIZE, pixelY),
        slots
      );
      bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
    }
  }

  return bytes;
}

function buildScreen5BitmapBytesFromAsset(bitmap: Msx2Bitmap | undefined): number[] {
  const bytes: number[] = [];
  const pixels = bitmap?.pixels || [];
  for (let y = 0; y < SCREEN5_HEIGHT; y++) {
    const row = pixels[y] || [];
    for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
      const x0 = byteX * 2;
      const hi = Math.max(0, Math.min(15, Number(row[x0]) || 0));
      const lo = Math.max(0, Math.min(15, Number(row[x0 + 1]) || 0));
      bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
    }
  }
  return bytes;
}

function buildScreen5BitmapBytesFromTileScreen(screen: Msx2Screen5TileScreen | undefined): number[] {
  const bytes: number[] = [];
  const tiles = screen?.tiles || [];
  const map = screen?.map || [];
  const tileByIndex = (index: number) => tiles[Math.max(0, Math.min(tiles.length - 1, Number(index) || 0))];

  for (let y = 0; y < SCREEN5_HEIGHT; y++) {
    const tileY = Math.floor(y / 16);
    const pixelY = y % 16;
    for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
      const x0 = byteX * 2;
      const x1 = x0 + 1;
      const tileX0 = Math.floor(x0 / 16);
      const tileX1 = Math.floor(x1 / 16);
      const tile0 = tileByIndex(map[tileY]?.[tileX0] ?? 0);
      const tile1 = tileByIndex(map[tileY]?.[tileX1] ?? 0);
      const hi = Math.max(0, Math.min(15, Number(tile0?.pixels?.[pixelY]?.[x0 % 16]) || 0));
      const lo = Math.max(0, Math.min(15, Number(tile1?.pixels?.[pixelY]?.[x1 % 16]) || 0));
      bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
    }
  }
  return bytes;
}

function buildTileScreenLayerBytes(
  screen: Msx2Screen5TileScreen | undefined,
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
  return bytes;
}

function countTileScreenEffectCode(screen: Msx2Screen5TileScreen | undefined, code: number): number {
  return buildTileScreenLayerBytes(screen, 'effects').filter(value => value === code).length;
}

function buildTilePatternBytes(tile: any | undefined): number[] {
  const bytes: number[] = [];
  for (let y = 0; y < 16; y++) {
    const row = tile?.pixels?.[y] || [];
    for (let byteX = 0; byteX < 8; byteX++) {
      const x0 = byteX * 2;
      const hi = Math.max(0, Math.min(15, Number(row[x0]) || 0));
      const lo = Math.max(0, Math.min(15, Number(row[x0 + 1]) || 0));
      bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
    }
  }
  return bytes;
}

function buildTileScreenTileBlocks(label: string, screen: Msx2Screen5TileScreen | undefined): string {
  const tiles = screen?.tiles?.length ? screen.tiles : [{ pixels: Array.from({ length: 16 }, () => Array(16).fill(0)) }];
  return tiles
    .map((tile, index) => formatBytes(`${label}_TILE_${index}`, buildTilePatternBytes(tile), `${screen?.name || label} tile ${index}, 16x16 packed SCREEN 5`))
    .join('\n');
}

function buildTileScreenLoadRoutine(
  label: string,
  screen: Msx2Screen5TileScreen | undefined,
  loadRuntimeLayerPointers: (label: string) => string
): string {
  const tiles = screen?.tiles || [];
  const map = screen?.map || [];
  const tileBytes = tiles.map(tile => buildTilePatternBytes(tile));
  const maxTileIndex = Math.max(0, tiles.length - 1);
  const calls: string[] = [];
  for (let tileY = 0; tileY < MSX2_TILE_SCREEN_HEIGHT; tileY++) {
    const pixelY = tileY * 16;
    const rowCount = Math.max(0, Math.min(16, SCREEN5_HEIGHT - pixelY));
    if (rowCount <= 0) continue;
    for (let tileX = 0; tileX < MSX2_TILE_SCREEN_WIDTH; tileX++) {
      const tileIndex = Math.max(0, Math.min(maxTileIndex, Number(map[tileY]?.[tileX]) || 0));
      if ((tileBytes[tileIndex] || []).every(value => value === 0)) continue;
      const vramAddress = (pixelY * (SCREEN5_WIDTH / 2)) + (tileX * 8);
      calls.push(`    ld hl, ${label}_TILE_${tileIndex}
    ld de, #${vramAddress.toString(16).toUpperCase().padStart(4, '0')}
    ld b, ${rowCount}
    call copy_tile_rows_to_vram`);
    }
  }

  return `load_${label}_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
${calls.join('\n')}
${loadRuntimeLayerPointers(label)}    ret
`;
}

function buildPaletteBytes(slots: Screen5PaletteSlot[]): number[] {
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

function getHardwareSpriteSource(analysis: ProjectAnalysis): Msx2Sprite | undefined {
  return analysis.msx2Sprites?.[0];
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

function getPrimaryRuntimeTileScreen(analysis: ProjectAnalysis): Msx2Screen5TileScreen | undefined {
  return collectReferencedTileScreens(analysis)[0] || analysis.msx2Screens?.[0];
}

function getPlayerStartFromTileScreen(screen: Msx2Screen5TileScreen | undefined): { x: number; y: number } | undefined {
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player')
    || screen?.layers?.entities?.[0];
  if (!player?.position) return undefined;
  return {
    x: clampHardwareSpriteX(clampTileCoordinate(player.position.x, 15) * 16),
    y: clampHardwareSpriteY(clampTileCoordinate(player.position.y, 13) * 16),
  };
}

function getEntityParamNumber(params: Record<string, any> | undefined, key: string, fallback: number): number {
  const value = Number(params?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function getEnemyHazardRuntimeSlots(screen: Msx2Screen5TileScreen | undefined): Array<{ x: number; y: number; minX: number; maxX: number; minY: number; maxY: number; dx: number; dy: number }> {
  return (screen?.layers?.entities || [])
    .filter(entity => (entity.kind === 'enemy' || entity.kind === 'hazard') && entity.position)
    .slice(0, MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN)
    .map(entity => {
      const xTile = clampTileCoordinate(entity.position?.x, 15);
      const yTile = clampTileCoordinate(entity.position?.y, 13);
      const movement = String(entity.params?.movement || entity.params?.motion || '').toLowerCase();
      const hasPatrolX = movement === 'patrolx' || movement === 'patrol-x' || movement === 'horizontal';
      const hasPatrolY = movement === 'patroly' || movement === 'patrol-y' || movement === 'vertical';
      const minXTile = hasPatrolX ? clampTileCoordinate(getEntityParamNumber(entity.params, 'minX', xTile), 15) : xTile;
      const maxXTile = hasPatrolX ? clampTileCoordinate(getEntityParamNumber(entity.params, 'maxX', xTile), 15) : xTile;
      const minYTile = hasPatrolY ? clampTileCoordinate(getEntityParamNumber(entity.params, 'minY', yTile), 13) : yTile;
      const maxYTile = hasPatrolY ? clampTileCoordinate(getEntityParamNumber(entity.params, 'maxY', yTile), 13) : yTile;
      const direction = getEntityParamNumber(entity.params, 'direction', 1) < 0 ? -1 : 1;
      return {
        x: clampHardwareSpriteX(xTile * 16),
        y: clampHardwareSpriteY(yTile * 16),
        minX: clampHardwareSpriteX(Math.min(minXTile, maxXTile) * 16),
        maxX: clampHardwareSpriteX(Math.max(minXTile, maxXTile) * 16),
        minY: clampHardwareSpriteY(Math.min(minYTile, maxYTile) * 16),
        maxY: clampHardwareSpriteY(Math.max(minYTile, maxYTile) * 16),
        dx: hasPatrolX ? direction : 0,
        dy: hasPatrolY ? direction : 0,
      };
    });
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
  // top-left, top-right, bottom-left, bottom-right.
  for (let y = 0; y < 8; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));
  for (let y = 0; y < 8; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));
  for (let y = 8; y < 16; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));
  for (let y = 8; y < 16; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));
  return bytes;
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

function buildHardwareSpriteLayers(sprite: Msx2Sprite, fallbackColor: number): Msx2HardwareLayer[] {
  const frame = sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
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

function clampHardwareSpriteY(value: number): number {
  return Math.max(0, Math.min(211, value));
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

function buildHardwareSpriteInitAsm(analysis: ProjectAnalysis): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const x = clampHardwareSpriteX(settings.x);
  const y = clampHardwareSpriteY(settings.y);
  return `init_hardware_sprites:
    ; SCREEN 5 hardware sprite runtime. Clobbers AF/BC/DE/HL.
    ; Preserve the SCREEN 5 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (#F3E0)
    or #02
    and #FE
    ld (#F3E0), a
    ld b, a
    ld c, #01
    call WRTVDP

    ; Sprite attribute/color/pattern tables live above the SCREEN 5 bitmap.
    ; In sprite mode 2, R#5 selects the combined color+attribute table:
    ; color table #7400, SAT #7600. Bits 0-2 must be 1.
    ld bc, #EF05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0F06
    call WRTVDP

    ld hl, msx2_hw_sprite_patterns
    ld de, ${SCREEN5_SPRPAT_VRAM}
    ld bc, msx2_hw_sprite_patterns_end - msx2_hw_sprite_patterns
    call LDIRVM

    ld hl, msx2_hw_sprite_colors
    ld de, ${SCREEN5_SPRCOL_VRAM}
    ld bc, msx2_hw_sprite_colors_end - msx2_hw_sprite_colors
    call LDIRVM

    ld hl, msx2_hw_sprite_attrs
    ld de, ${SCREEN5_SPRATR_VRAM}
    ld bc, 128
    call LDIRVM

    ld a, ${x}
    ld (msx2_player_sprite_x), a
    ld a, ${y}
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    xor a
    ld (msx2_player_sprite_frame), a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_air_frame_counter), a
    ld a, 255
    ld (msx2_air_value), a
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
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
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
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
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret

copy_tile_rows_to_vram:
    ; HL=packed 16x16 tile source, DE=SCREEN 5 VRAM destination, B=row count.
    ; Copies 8 packed bytes per row and advances VRAM by one SCREEN 5 scanline.
.tile_row_loop:
    push bc
    ld bc, 8
    call copy_to_vram_ext
    ex de, hl
    ld bc, 128
    add hl, bc
    ex de, hl
    pop bc
    djnz .tile_row_loop
    ret

write_vram_byte_ext:
    ; A=data, HL=absolute VRAM destination. Clobbers AF/B.
    ld b, a
    ld a, h
    and #C0
    rlca
    rlca
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ld a, l
    out (VDP_CTRL_PORT), a
    ld a, h
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld a, b
    out (VDP_DATA_PORT), a
    xor a
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

function buildCollectibleHudSlotAsm(requiredCollectibles: number): string {
  const slotCount = Math.max(0, Math.min(4, Math.floor(requiredCollectibles)));
  if (slotCount === 0) {
    return `draw_msx2_collectible_hud:
    ; No collectibles are required for this level. Clobbers AF/BC/DE/HL.
    ret
`;
  }
  return `draw_msx2_collectible_hud:
    ; Tiny SCREEN 5 collectible-progress pips after the life HUD. Clobbers AF/BC/DE/HL.
${Array.from({ length: slotCount }, (_unused, index) => {
  const required = index + 1;
  const destination = 0x0119 + (index * 0x0006);
  return `    ld a, (msx2_collectible_count)
    cp ${required}
    jp nc, .collectible_hud_${required}_on
    ld a, #11
    jp .draw_collectible_hud_${required}
.collectible_hud_${required}_on:
    ld a, #AA
.draw_collectible_hud_${required}:
    ld hl, #${destination.toString(16).toUpperCase().padStart(4, '0')}
    call draw_msx2_life_pip
`;
}).join('')}    ret
`;
}

function buildAirHudSlotAsm(): string {
  return `draw_msx2_air_hud:
    ; SCREEN 5 air/time bar at the top-right. Clobbers AF/BC/DE/HL.
${Array.from({ length: 16 }, (_unused, index) => {
  const threshold = Math.max(1, Math.min(255, Math.ceil(((index + 1) * 255) / 16)));
  const destination = 0x0150 + (index * 0x0002);
  return `    ld a, (msx2_air_value)
    cp ${threshold}
    jp nc, .air_hud_${index}_on
    ld a, #11
    jp .draw_air_hud_${index}
.air_hud_${index}_on:
    ld a, #33
.draw_air_hud_${index}:
    ld hl, #${destination.toString(16).toUpperCase().padStart(4, '0')}
    call draw_msx2_air_segment
`;
}).join('')}    ret

draw_msx2_air_segment:
    ; A=packed color byte, HL=SCREEN 5 VRAM destination. Clobbers AF/BC/DE/HL.
    ld e, a
    ld d, 4
.air_segment_row:
    push hl
    ld c, 2
.air_segment_col:
    ld a, e
    call write_vram_byte_ext
    inc hl
    dec c
    jp nz, .air_segment_col
    pop hl
    ld bc, 128
    add hl, bc
    dec d
    jp nz, .air_segment_row
    ret
`;
}

function buildHardwareSpriteRuntimeAsm(
  analysis: ProjectAnalysis,
  requiredCollectibles: number,
  restartScreenLabel: string,
  restartScreenIndex: number
): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  const settings = getHardwareSpriteSettings(sprite);
  const color = Math.max(1, Math.min(15, settings.color));
  const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(sprite, color)).slice(0, MSX2_MAX_PLAYER_HARDWARE_LAYERS);
  const basePatternIndex = clampBasePatternIndex(settings.patternIndex, layers.length + 1);
  const enemyPatternIndex = basePatternIndex + (layers.length * 4);
  const patrolBounds = getRuntimePatrolBounds(analysis);
  const attrWrites = layers.map((layer, layerIndex) => {
    const attrAddress = 0x7600 + (layerIndex * 4);
    return `    ; Sprite layer ${layerIndex}: x+${layer.xOffset}, y+${layer.yOffset}
    ld a, (msx2_player_sprite_y)
${addImmediateToA(layer.yOffset)}    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
${addImmediateToA(layer.xOffset)}    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${basePatternIndex + (layerIndex * 4)}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
`;
  }).join('\n');
  const enemyAttrWrites = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const attrAddress = 0x7600 + ((layers.length + slot) * 4);
    const slotAddress = (base: string): string => slot
      ? `    ld hl, ${base}
    ld de, ${slot}
    add hl, de
`
      : `    ld hl, ${base}
`;
    return `    ; Enemy/hazard sprite slot ${slot}.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp nc, .enemy_sprite_${slot}_visible
    ld a, 216
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .enemy_sprite_${slot}_done
.enemy_sprite_${slot}_visible:
${slotAddress('msx2_enemy_runtime_y')}    ld a, (hl)
    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${slotAddress('msx2_enemy_runtime_x')}    ld a, (hl)
    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${enemyPatternIndex}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.enemy_sprite_${slot}_done:
`;
  }).join('\n');
  const terminatorAttrAddress = 0x7600 + ((layers.length + MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN) * 4);
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
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
${addSlot}    ld e, a
    ld d, 0
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
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
${addSlot}    ld e, a
    ld d, 0
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
  const enemySlotMovementRoutines = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    return `    call update_msx2_enemy_position_slot_${slot}
`;
  }).join('');
  const enemySlotMovementHandlers = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, slot) => {
    const addSlot = slot ? `    add a, ${slot}\n` : '';
    return `update_msx2_enemy_position_slot_${slot}:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    ret c
${enemySlotAddress('msx2_enemy_runtime_dx', slot)}
    ld a, (hl)
    or a
    jp z, .enemy_slot_${slot}_check_y
    cp #FF
    jp z, .enemy_slot_${slot}_left
.enemy_slot_${slot}_right:
${enemySlotAddress('msx2_enemy_runtime_x', slot)}
    ld b, (hl)
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
${addSlot}    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_max_x
    add hl, de
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
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
${addSlot}    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_min_x
    add hl, de
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
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
${addSlot}    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_max_y
    add hl, de
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
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
${addSlot}    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_min_y
    add hl, de
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

`;
  }).join('');

  return `draw_msx2_lives_hud:
    ; Tiny SCREEN 5 life pips at the top-left. Clobbers AF/BC/DE/HL.
    ld a, (msx2_lives)
    cp 1
    jp nc, .life_1_on
    ld a, #88
    jp .draw_life_1
.life_1_on:
    ld a, #33
.draw_life_1:
    ld hl, #0101
    call draw_msx2_life_pip
    ld a, (msx2_lives)
    cp 2
    jp nc, .life_2_on
    ld a, #88
    jp .draw_life_2
.life_2_on:
    ld a, #33
.draw_life_2:
    ld hl, #0107
    call draw_msx2_life_pip
    ld a, (msx2_lives)
    cp 3
    jp nc, .life_3_on
    ld a, #88
    jp .draw_life_3
.life_3_on:
    ld a, #33
.draw_life_3:
    ld hl, #010D
    call draw_msx2_life_pip
    ret

draw_msx2_life_pip:
    ; A=packed color byte, HL=SCREEN 5 VRAM destination. Clobbers AF/BC/DE/HL.
    ld e, a
    ld d, 6
.pip_row:
    push hl
    ld c, 4
.pip_col:
    ld a, e
    call write_vram_byte_ext
    inc hl
    dec c
    jp nz, .pip_col
    pop hl
    ld bc, 128
    add hl, bc
    dec d
    jp nz, .pip_row
    ret

${buildCollectibleHudSlotAsm(requiredCollectibles)}

${buildAirHudSlotAsm()}

draw_msx2_game_over_banner:
    ; Simple visible game-over mark in SCREEN 5. Clobbers AF/BC/DE/HL.
    ld hl, #0828
    ld d, 12
.game_over_row:
    push hl
    ld c, 48
.game_over_col:
    ld a, #88
    call write_vram_byte_ext
    inc hl
    dec c
    jp nz, .game_over_col
    pop hl
    ld bc, 128
    add hl, bc
    dec d
    jp nz, .game_over_row
    ret

draw_msx2_level_complete_banner:
    ; Simple visible level-complete mark in SCREEN 5. Clobbers AF/BC/DE/HL.
    ld hl, #1028
    ld d, 12
.level_complete_row:
    push hl
    ld c, 48
.level_complete_col:
    ld a, #AA
    call write_vram_byte_ext
    inc hl
    dec c
    jp nz, .level_complete_col
    pop hl
    ld bc, 128
    add hl, bc
    dec d
    jp nz, .level_complete_row
    ret

update_msx2_air_timer:
    ; Decrements the SCREEN 5 air/time resource on a coarse frame divider. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
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

update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right plus jump/gravity.
    ; Clobbers AF/BC/DE/HL.
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
    jp update_hardware_sprite_vertical
.right_blocked:
    xor a
    ld (msx2_player_sprite_dx), a
    jp update_hardware_sprite_vertical

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
    jp update_hardware_sprite_vertical
.left_blocked:
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp update_hardware_sprite_vertical

msx2_game_over_idle:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .restart_space_released
    ld a, (msx2_game_over_restart_lock)
    or a
    jp z, msx2_restart_game
    jp .draw_game_over
.restart_space_released:
    xor a
    ld (msx2_game_over_restart_lock), a
.draw_game_over:
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

msx2_level_complete_idle:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .continue_space_released
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
    call load_${restartScreenLabel}_bitmap
    ld a, ${Math.max(0, Math.min(255, restartScreenIndex))}
    ld (msx2_current_screen_index), a
    xor a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_player_dead_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_air_frame_counter), a
    ld a, 255
    ld (msx2_air_value), a
    call msx2_reset_enemy_runtime_for_current_screen
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    call write_hardware_sprite_attrs
    ret

msx2_restart_game:
    call load_${restartScreenLabel}_bitmap
    ld a, ${Math.max(0, Math.min(255, restartScreenIndex))}
    ld (msx2_current_screen_index), a
    xor a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_air_frame_counter), a
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 255
    ld (msx2_air_value), a
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
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
    ; Jump uses SPACE on keyboard matrix row 8, bit 0. Gravity is 1 px/frame.
    ; Clobbers AF/BC/DE/HL.
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .space_released
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

write_hardware_sprite_attrs:
    ; Writes player and enemy sprite attributes to SCREEN 5 SAT. Clobbers AF/BC/DE/HL.
${attrWrites}
${enemyAttrWrites}    ld a, 216
    ld hl, #${terminatorAttrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:
    call write_hardware_sprite_attrs
    call update_msx2_effect_state
    call update_msx2_enemy_positions
    call update_msx2_enemy_state
    ret

msx2_reset_enemy_runtime_for_current_screen:
    ; Copy static enemy slots for current screen into mutable runtime RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_x
    add hl, de
    ld de, msx2_enemy_runtime_x
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_y
    add hl, de
    ld de, msx2_enemy_runtime_y
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_dx
    add hl, de
    ld de, msx2_enemy_runtime_dx
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_dy
    add hl, de
    ld de, msx2_enemy_runtime_dy
    ld bc, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}
    ldir
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
${enemySlotMovementRoutines}    ret

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
    ld b, #08
    ld c, #07
    call WRTVDP
    ret

update_msx2_effect_state:
    ; Effect layer contract: 1=hazard, 2=exit, 3=collectible.
    ; Clobbers AF/BC/DE/HL.
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
    ld b, #07
    jp .write_border
.no_effect:
    xor a
    ld (msx2_collectible_latch), a
    ld b, #04
    jp .write_border
.hazard:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ld b, #08
    jp .write_border
.exit:
    xor a
    ld (msx2_collectible_latch), a
    ld a, (msx2_collectible_count)
    cp ${Math.max(0, Math.min(255, requiredCollectibles))}
    jp c, .exit_locked
    ld a, 1
    ld (msx2_exit_reached_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_exit_blocked_flag), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ld b, #07
    jp .write_border
.exit_locked:
    ld a, 1
    ld (msx2_exit_blocked_flag), a
    ld b, #06
    jp .write_border
.collectible:
    ld a, (msx2_collectible_latch)
    or a
    jp nz, .collectible_border
    xor a
    ld (hl), a
    call clear_msx2_collectible_visual
    ld a, 1
    ld (msx2_collectible_latch), a
    ld a, (msx2_collectible_count)
    cp ${Math.max(0, Math.min(255, requiredCollectibles))}
    jp nc, .collectible_border
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
    call draw_msx2_collectible_hud
.collectible_border:
    ld b, #0A
.write_border:
    ld c, #07
    call WRTVDP
    ret

clear_msx2_collectible_visual:
    ; Clears the 16x16 visual tile under the active collectible cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_y)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    ld h, a
    ld l, 0
    ld a, (msx2_player_sprite_x)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld d, h
    ld e, l
    ld hl, screen5_blank_tile
    ld b, 16
    call copy_tile_rows_to_vram
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
    inc a
    ld (msx2_player_jump_lock), a
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
  const basePatternIndex = clampBasePatternIndex(settings.patternIndex, layers.length + 1);
  const enemyPatternIndex = basePatternIndex + (layers.length * 4);
  const visibleAttributes = layers.flatMap((layer, layerIndex) => [
    clampHardwareSpriteY(y + layer.yOffset),
    clampHardwareSpriteX(x + layer.xOffset),
    basePatternIndex + (layerIndex * 4),
    0,
  ]);
  const enemyAttributes = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, () => [
    216,
    0,
    enemyPatternIndex,
    0,
  ]).flat();
  const terminator = [216, 0, 0, 0];
  const attributes = [...visibleAttributes, ...enemyAttributes, ...terminator, ...Array(Math.max(0, 128 - visibleAttributes.length - enemyAttributes.length - terminator.length)).fill(0)];

  return `
msx2_hw_sprite_patterns:
${layers.map((layer, index) => formatBytes(`msx2_hw_sprite_pattern_${index}`, layer.pattern, `Hardware metasprite part ${index}: x+${layer.xOffset}, y+${layer.yOffset}`)).join('')}${formatBytes('msx2_hw_enemy_sprite_pattern', MSX2_ENEMY_SPRITE_PATTERN, 'Shared 16x16 enemy/hazard hardware sprite pattern')}msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
${layers.map((layer, index) => formatBytes(`msx2_hw_sprite_colors_${index}`, layer.colors, `Line colors for hardware sprite layer ${index}`)).join('')}${Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => formatBytes(`msx2_hw_enemy_sprite_colors_${index}`, Array(16).fill(MSX2_ENEMY_SPRITE_COLOR), `Line colors for enemy/hazard hardware sprite slot ${index}`)).join('')}msx2_hw_sprite_colors_end:

${formatBytes('msx2_hw_sprite_attrs', attributes, `${layers.length} player hardware sprite(s), ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} enemy/hazard sprite slots; next Y=216 terminates the SAT`)}
`;
}

function defaultTargetNodeId(connections: GameFlowConnection[] | undefined, nodeId: string): string | undefined {
  const connection = (connections || []).find((candidate: any) => {
    const fromNodeId = candidate.from?.nodeId || candidate.fromNodeId;
    return fromNodeId === nodeId && !candidate.from?.sourceId;
  }) as any;
  return connection?.to?.nodeId || connection?.toNodeId;
}

function resolveScreenByAssetId(analysis: ProjectAnalysis, assetId: string | undefined): ScreenMap | undefined {
  if (!assetId) return undefined;
  const assets = (analysis as any).assets as Array<{ id?: string; type?: string; data?: unknown }> | undefined;
  const asset = assets?.find(item => item.id === assetId && item.type === 'screenmap');
  if (asset?.data) return asset.data as ScreenMap;
  return (analysis.screenMaps || []).find(screen => screen.id === assetId);
}

function resolveTileScreenByAssetId(analysis: ProjectAnalysis, assetId: string | undefined): Msx2Screen5TileScreen | undefined {
  if (!assetId) return undefined;
  const assets = (analysis as any).assets as Array<{ id?: string; type?: string; data?: unknown }> | undefined;
  const asset = assets?.find(item => item.id === assetId && item.type === 'msx2screen');
  if (asset?.data) return asset.data as Msx2Screen5TileScreen;
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
  const screens = new Map<string, ScreenMap>();
  const addScreen = (screen: ScreenMap | undefined) => {
    if (!screen) return;
    screens.set(screen.id || screen.name || `screen_${screens.size}`, screen);
  };

  addScreen(analysis.screenMaps?.[0]);

  for (const node of analysis.gameFlow?.nodes || []) {
    if (node.type === 'Text') {
      addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
    } else if (node.type === 'SubMenu') {
      addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
    } else if (node.type === 'Restart') {
      addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
    }
  }

  return Array.from(screens.values());
}

function collectReferencedTileScreens(analysis: ProjectAnalysis): Msx2Screen5TileScreen[] {
  const screens = new Map<string, Msx2Screen5TileScreen>();
  const addScreen = (screen: Msx2Screen5TileScreen | undefined) => {
    if (!screen) return;
    screens.set(screen.id || screen.name || `msx2_screen_${screens.size}`, screen);
  };

  addScreen(analysis.msx2Screens?.[0]);

  for (const node of analysis.gameFlow?.nodes || []) {
    if (node.type !== 'WorldLink') continue;
    const world = resolveWorldByAssetId(analysis, getGameFlowWorldAssetId(node));
    for (const worldNode of world?.nodes || []) {
      addScreen(resolveTileScreenByAssetId(analysis, worldNode?.screenAssetId || worldNode?.screenId));
    }
  }

  return Array.from(screens.values());
}

function buildMsx2TileScreenLoadLines(label: string | undefined, tileScreenIndexByLabel: Map<string, number>): string {
  if (!label) return '';
  const index = tileScreenIndexByLabel.get(label);
  const setIndex = index === undefined
    ? ''
    : `    ld a, ${index}\n    ld (msx2_current_screen_index), a\n`;
  return `    call load_${label}_bitmap\n${setIndex}`;
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

function buildMsx2GameFlowProgram(
  analysis: ProjectAnalysis,
  screenLabels: Map<string, string>,
  tileScreenLabels: Map<string, string>,
  tileScreenIndexByLabel: Map<string, number>
): string {
  const graph = analysis.gameFlow;
  const fallbackLabel = tileScreenLabels.values().next().value || screenLabels.values().next().value;
  if (!graph?.nodes?.length) {
    return buildMsx2TileScreenLoadLines(fallbackLabel, tileScreenIndexByLabel);
  }

  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const startNodeId = graph.startNodeId || graph.nodes.find(node => node.type === 'Start')?.id;
  const lines: string[] = [
    '    ; MSX2 minimal GameFlow: Start/Text(background)/Transition(cls)/End.',
  ];
  const unsupported = new Set<string>();
  const visited = new Set<string>();
  let terminated = false;
  let current: GameFlowNode | undefined = startNodeId ? nodeById.get(startNodeId) : undefined;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);

    switch (current.type) {
      case 'Start':
      case 'Waypoint':
      case 'Globals':
      case 'Music':
        break;
      case 'Text': {
        const screen = resolveScreenByAssetId(analysis, current.appearance?.backgroundScreenAssetId) || analysis.screenMaps?.[0];
        const label = screen ? screenLabels.get(screen.id || screen.name) : undefined;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel).trimEnd());
        lines.push('    call wait_key');
        break;
      }
      case 'SubMenu': {
        const screen = resolveScreenByAssetId(analysis, current.appearance?.backgroundScreenAssetId) || analysis.screenMaps?.[0];
        const label = screen ? screenLabels.get(screen.id || screen.name) : undefined;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel).trimEnd());
        lines.push('    call wait_key');
        break;
      }
      case 'WorldLink': {
        const screenAssetId = resolveWorldStartScreenAssetId(analysis, getGameFlowWorldAssetId(current));
        const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, screenAssetId) || fallbackLabel;
        if (label) lines.push(buildMsx2TileScreenLoadLines(label, tileScreenIndexByLabel).trimEnd());
        lines.push('    jp .main_loop');
        terminated = true;
        current = undefined;
        continue;
      }
      case 'Transition':
        if (current.effect === 'cls') {
          lines.push('    call clear_screen5_bitmap');
        } else {
          unsupported.add(`Transition:${current.effect}`);
        }
        break;
      case 'End':
        lines.push('    jp .main_loop');
        terminated = true;
        current = undefined;
        continue;
      case 'Restart':
        lines.push('    jp init_rom');
        terminated = true;
        current = undefined;
        continue;
      default:
        unsupported.add(current.type);
        break;
    }

    const nextNodeId = defaultTargetNodeId(graph.connections, current.id);
    current = nextNodeId ? nodeById.get(nextNodeId) : undefined;
  }

  if (unsupported.size > 0) {
    lines.push(`    ; Unsupported MSX2 GameFlow nodes skipped in MVP: ${Array.from(unsupported).join(', ')}`);
  }

  if (!terminated) {
    lines.push('    jp .main_loop');
  }
  return `${lines.join('\n')}\n`;
}

function buildMsx2WorldTransitionAsm(
  analysis: ProjectAnalysis,
  tileScreens: Msx2Screen5TileScreen[],
  tileScreenLoadLabels: string[]
): string {
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

  for (const node of analysis.gameFlow?.nodes || []) {
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
      return `.${suffix}_screen_${index}:
    call load_${targetLabel}_bitmap
    ld a, ${targetIndex}
    ld (msx2_current_screen_index), a
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, ${enterX}
    ld (msx2_player_sprite_x), a
    ld a, ${enterY}
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    jp update_hardware_sprite_vertical
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

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2Screen5Config): string {
  const screens = collectReferencedScreens(analysis);
  const bitmaps = analysis.msx2Bitmaps || [];
  const tileScreens = collectReferencedTileScreens(analysis);
  const slots = resolveScreen5Palette(analysis);
  const paletteBytes = buildPaletteBytes(slots);
  const title = projectName.replace(/[^ -~]/g, '');
  const bitmapLabels = new Map<string, string>();
  const screenLabels = new Map<string, string>();
  const bitmapBlocks = bitmaps.map((bitmap, index) => {
    const label = sanitizeLabel(bitmap?.name || `msx2_bitmap_${index}`, `MSX2_BITMAP_${index}`);
    bitmapLabels.set(bitmap.id || bitmap.name || `bitmap_${index}`, label);
    return formatBytes(
      `${label}_BITMAP`,
      buildScreen5BitmapBytesFromAsset(bitmap),
      `${bitmap?.name || `Bitmap ${index}`} packed as SCREEN 5, 2 pixels per byte`
    );
  });
  const screenBitmapBlocks = screens.map((screen, index) => {
    const label = sanitizeLabel(screen?.name || `screen5_screen_${index}`, `SCREEN5_SCREEN_${index}`);
    screenLabels.set(screen.id || screen.name || `screen_${index}`, label);
    return formatBytes(
      `${label}_BITMAP`,
      buildScreen5BitmapBytes(screen, analysis.tiles || [], slots),
      `${screen?.name || `Screen ${index}`} rasterized as SCREEN 5, 2 pixels per byte`
    );
  });
  const tileScreenBlocks = tileScreens.map((screen, index) => {
    const label = sanitizeLabel(screen?.name || `msx2_screen5_screen_${index}`, `MSX2_SCREEN5_SCREEN_${index}`);
    bitmapLabels.set(screen.id || screen.name || `tile_screen_${index}`, label);
    return buildTileScreenTileBlocks(label, screen);
  });
  if (bitmapBlocks.length === 0 && screenBitmapBlocks.length === 0 && tileScreenBlocks.length === 0) {
    bitmapBlocks.push(formatBytes('SCREEN5_SCREEN_0_BITMAP', Array(SCREEN5_BYTES).fill(0), 'Empty SCREEN 5 bitmap'));
  }
  const bitmapLoadLabels = bitmaps.map((bitmap, index) =>
    bitmapLabels.get(bitmap.id || bitmap.name || `bitmap_${index}`) || sanitizeLabel(bitmap.name, `MSX2_BITMAP_${index}`)
  );
  const screenLoadLabels = screens.map((screen, index) =>
    screenLabels.get(screen.id || screen.name || `screen_${index}`) || sanitizeLabel(screen.name, `SCREEN5_SCREEN_${index}`)
  );
  const tileScreenLabels = new Map<string, string>();
  const tileScreenLoadLabels = tileScreens.map((screen, index) =>
    bitmapLabels.get(screen.id || screen.name || `tile_screen_${index}`) || sanitizeLabel(screen.name, `MSX2_SCREEN5_SCREEN_${index}`)
  );
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
  const genericLoadLabels = [...bitmapLoadLabels, ...screenLoadLabels];
  const allLoadLabels = [...tileScreenLoadLabels, ...genericLoadLabels];
  const firstScreen = screens[0] || analysis.screenMaps?.[0];
  const firstScreenLabel = allLoadLabels[0]
    || (firstScreen ? screenLabels.get(firstScreen.id || firstScreen.name) || sanitizeLabel(firstScreen.name, 'SCREEN5_SCREEN_0') : 'SCREEN5_SCREEN_0');
  const gameFlowProgram = buildMsx2GameFlowProgram(analysis, screenLabels, tileScreenLabels, tileScreenIndexByLabel);
  const hardwareSpriteInitAsm = buildHardwareSpriteInitAsm(analysis);
  const hardwareSpriteDataAsm = buildHardwareSpriteDataAsm(analysis);
  const requiredCollectibles = Math.min(255, tileScreens.reduce((total, screen) => total + countTileScreenEffectCode(screen, 3), 0));
  const spawnXBytes = tileScreens.map(screen => clampHardwareSpriteX(getPlayerStartFromTileScreen(screen)?.x ?? 96));
  const spawnYBytes = tileScreens.map(screen => clampHardwareSpriteY(getPlayerStartFromTileScreen(screen)?.y ?? 144));
  const enemyHazards = tileScreens.map(screen => getEnemyHazardRuntimeSlots(screen));
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
  const enemyDxBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => enemies[index]?.dx === -1 ? 0xFF : enemies[index]?.dx ? 1 : 0)
  );
  const enemyDyBytes = enemyHazards.flatMap(enemies =>
    Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, (_unused, index) => enemies[index]?.dy === -1 ? 0xFF : enemies[index]?.dy ? 1 : 0)
  );
  const worldTransitionAsm = buildMsx2WorldTransitionAsm(analysis, tileScreens, tileScreenLoadLabels);
  const firstScreenIndex = tileScreenIndexByLabel.get(firstScreenLabel);
  const firstScreenIndexInit = firstScreenIndex === undefined
    ? ''
    : `    ld a, ${firstScreenIndex}\n    ld (msx2_current_screen_index), a\n`;
  const firstScreenEnemyRuntimeInit = firstScreenIndex === undefined || !hasHardwareSprite(analysis)
    ? ''
    : '    call msx2_reset_enemy_runtime_for_current_screen\n';
  const loadRuntimeLayerPointers = (label: string): string => {
    const runtimeLabels = runtimeLayerLabels.get(label);
    const collisionLabel = runtimeLabels?.collision || 'screen5_empty_collision_layer';
    const effectsLabel = runtimeLabels?.effects || 'screen5_empty_effects_layer';
    const behaviorLabel = runtimeLabels?.behavior || 'screen5_empty_behavior_layer';
    return `    ld hl, ${collisionLabel}
    ld (msx2_current_collision_ptr), hl
    ld hl, ${behaviorLabel}
    ld (msx2_current_behavior_ptr), hl
    ld hl, ${effectsLabel}
    ld de, msx2_effects_runtime_buffer
    ld bc, msx2_layer_size
    ldir
    ld hl, msx2_effects_runtime_buffer
    ld (msx2_current_effects_ptr), hl
`;
  };
  const tileScreenLoadRoutines = tileScreens.map((screen, index) =>
    buildTileScreenLoadRoutine(tileScreenLoadLabels[index], screen, loadRuntimeLayerPointers)
  );
  const genericScreenLoadRoutines = genericLoadLabels.map(label => `load_${label}_bitmap:
    ld hl, ${label}_BITMAP
    ld de, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call LDIRVM
${loadRuntimeLayerPointers(label)}    ret
`);

  return `; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap backend
; Project: ${title}
; Screen mode: ${config.screenMode}
; ROM mode requested: ${config.romMode}
; Mapper requested: ${config.targetFormat}
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
FILVRM  EQU #0056
WRTVRM  EQU #004D
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
CHGET   EQU #009F
GTSTCK  EQU #00D5
SNSMAT  EQU #0141
HKEY    EQU #F3DB
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
VDP_DATA_PORT EQU #98
VDP_CTRL_PORT EQU #99
SCREEN5_BITMAP_VRAM EQU #0000
SCREEN5_BITMAP_SIZE EQU ${SCREEN5_BYTES}
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
msx2_effects_runtime_buffer EQU #C020
msx2_enemy_runtime_x EQU #C100
msx2_enemy_runtime_y EQU #C104
msx2_enemy_runtime_dx EQU #C108
msx2_enemy_runtime_dy EQU #C10C
msx2_layer_size EQU ${MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT}
msx2_required_collectibles EQU ${requiredCollectibles}

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

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    call DISSCR
    ld a, 5
    call CHGMOD

    ; Enable 212-line display on V9938/V9958.
    ld bc, #8009
    call WRTVDP

    call load_screen5_palette
    call load_${firstScreenLabel}_bitmap
${firstScreenIndexInit}${firstScreenEnemyRuntimeInit}${hasHardwareSprite(analysis) ? '    call init_hardware_sprites\n' : ''}
    call ENASCR
    ei

${gameFlowProgram}
.main_loop:
${hasHardwareSprite(analysis) ? '    call update_hardware_sprite_input\n' : ''}
${hasHardwareSprite(analysis) ? '    call update_msx2_air_timer\n' : ''}
    call wait_frame_busy
    jr .main_loop

wait_frame_busy:
    ; Simple ROM backend delay. Avoid HALT here so C-BIOS/OpenMSX smoke tests
    ; keep advancing even when no VBlank hook is installed by the minimal backend.
    ld bc, #0800
.wait_loop:
    dec bc
    ld a, b
    or c
    jp nz, .wait_loop
    ret

map_page2_to_cart_primary:
    ; Keep #8000-#BFFF on the same primary slot as the cart page at #4000.
    ; Raw SCREEN 5 backgrounds are larger than 16 KB, so LDIRVM may read data above #8000.
    in a, (#A8)
    ld b, a
    and #0C
    add a, a
    add a, a
    ld c, a
    ld a, b
    and #CF
    or c
    out (#A8), a
    ret

wait_key:
    call CHGET
    ret

clear_screen5_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
    ret

${hardwareSpriteInitAsm}
${buildHardwareSpriteRuntimeAsm(analysis, requiredCollectibles, firstScreenLabel, firstScreenIndex ?? 0)}
${worldTransitionAsm}
load_screen5_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

${[...tileScreenLoadRoutines, ...genericScreenLoadRoutines].join('\n')}
${formatBytes('screen5_palette_data', paletteBytes, 'Palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes('msx2_screen_spawn_x', spawnXBytes.length ? spawnXBytes : [96], 'Per-msx2screen respawn X coordinates')}
${formatBytes('msx2_screen_spawn_y', spawnYBytes.length ? spawnYBytes : [144], 'Per-msx2screen respawn Y coordinates')}
${formatBytes('msx2_screen_enemy_count', enemyCountBytes.length ? enemyCountBytes : [0], `Per-msx2screen active enemy/hazard entity count, capped at ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN}`)}
${formatBytes('msx2_screen_enemy_x', enemyXBytes.length ? enemyXBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard entity X coordinates, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_y', enemyYBytes.length ? enemyYBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard entity Y coordinates, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_min_x', enemyMinXBytes.length ? enemyMinXBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol minimum X, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_max_x', enemyMaxXBytes.length ? enemyMaxXBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol maximum X, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_min_y', enemyMinYBytes.length ? enemyMinYBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol minimum Y, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_max_y', enemyMaxYBytes.length ? enemyMaxYBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard patrol maximum Y, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_dx', enemyDxBytes.length ? enemyDxBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard initial movement direction, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('msx2_screen_enemy_dy', enemyDyBytes.length ? enemyDyBytes : Array(MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN).fill(0), `Per-msx2screen enemy/hazard initial vertical movement direction, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} slots per screen`)}
${formatBytes('screen5_blank_tile', Array(16 * 8).fill(0), 'Packed blank 16x16 tile used to erase collected items')}
${formatBytes('screen5_empty_collision_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 collision layer, 16x14 bytes')}
${formatBytes('screen5_empty_effects_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 effects layer, 16x14 bytes')}
${formatBytes('screen5_empty_behavior_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 behavior layer, 16x14 bytes')}
${hardwareSpriteDataAsm}
${[...tileScreenRuntimeBlocks, ...tileScreenBlocks, ...bitmapBlocks, ...screenBitmapBlocks].join('\n')}
    ds #C000 - $, #FF
    end
`;
}

export function generateMsx2Screen5Files(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2Screen5Config
): GeneratedASMFiles {
  const unitedFiles = generateUnitedFiles(projectName, analysis, config);
  return {
    'page0.asm': '; MSX2 SCREEN 5 backend: page0 not used in MVP.\n',
    'bios.asm': '; MSX2 SCREEN 5 backend emits BIOS equates in unitedFiles.asm.\n',
    'constants.asm': '; MSX2 SCREEN 5 backend constants are local to unitedFiles.asm.\n',
    'variables.asm': '; MSX2 SCREEN 5 backend has no RAM variables in MVP.\n',
    'mapper.asm': '; MSX2 SCREEN 5 backend MVP is a simple ROM path.\n',
    'resource_ids.asm': '; MSX2 SCREEN 5 backend has no resource table in MVP.\n',
    'resource_table.asm': '; MSX2 SCREEN 5 backend has no resource table in MVP.\n',
    'resource_manager.asm': '; MSX2 SCREEN 5 backend has no resource manager in MVP.\n',
    'interrupt.asm': '; MSX2 SCREEN 5 backend uses BIOS CHGET and HALT loop in MVP.\n',
    'header.asm': '; MSX2 SCREEN 5 backend header is emitted in unitedFiles.asm.\n',
    'patterns.asm': '; SCREEN 2 pattern tables are intentionally not used by MSX2 SCREEN 5.\n',
    'colors.asm': '; SCREEN 2 color tables are intentionally not used by MSX2 SCREEN 5.\n',
    'components.asm': '; Components are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'entities.asm': '; MSX2 SCREEN 5 backend emits player spawn and enemy/hazard runtime data in unitedFiles.asm.\n',
    'worlds.asm': '; Worlds are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'screens.asm': '; SCREEN 5 bitmap data is emitted in unitedFiles.asm.\n',
    'sprites.asm': hasHardwareSprite(analysis)
      ? '; MSX2 SCREEN 5 hardware sprite MVP is emitted inline in unitedFiles.asm.\n'
      : '; Sprites are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'font.asm': '; Font is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'hud.asm': '; MSX2 SCREEN 5 lives and collectible HUD are emitted inline in unitedFiles.asm.\n',
    'menus.asm': '; Menus are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'sound.asm': '; Sound is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'scroll.asm': '; Scroll is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'animtiles.asm': '; Animated tiles are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'bosses.asm': '; Bosses are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'statemachine.asm': '; State machines are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'gameflow.asm': '; MSX2 SCREEN 5 minimal GameFlow is emitted inline in unitedFiles.asm.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
