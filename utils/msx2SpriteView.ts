import type { Msx2Sprite, ProjectAsset, Screen5PaletteSlot, WorldMapGraph } from '../types';
import { analyzeProject } from './asmTemplateGenerator';
import { buildHardwareSpriteLayersForFrame, inspectScreen4WorldSpritePatterns, mirrorHardwareSpritePatternHorizontally } from './msxGenerator/generators/msx2/msx2Screen4Generator';
import { inspectScreen5WorldSpritePatterns } from './msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator';

export const SPRITE_PATTERN_BASE = 0xF800;
export const SPRITE_PATTERN_BYTES = 32;
export const SPRITE_PATTERN_CAPACITY = 64;
export const SPRITE_PATTERN_TABLE_BYTES = SPRITE_PATTERN_CAPACITY * SPRITE_PATTERN_BYTES;

export interface SpriteViewPattern {
  label: string;
  assetId?: string;
  group?: number;
  frame: number;
  mirrored: boolean;
  x: number;
  y: number;
  layer: number;
  pattern: number[];
  colors: number[];
  palette?: Screen5PaletteSlot[];
  dynamic?: boolean;
  reserved?: boolean;
}

/** VDP stores the left 8x16 half first, then the right 8x16 half. */
export function spritePatternPixel(pattern: number[], x: number, y: number): boolean {
  return Boolean((pattern[(x < 8 ? 0 : 16) + y] || 0) & (0x80 >> (x & 7)));
}

/** Asset catalogue: all authored frames and colour layers, with no runtime frame cap. */
export function collectSpriteViewAssets(assets: ProjectAsset[]): SpriteViewPattern[] {
  return assets.filter(asset => asset.type === 'msx2sprite' && asset.data).flatMap(asset => {
    const sprite = asset.data as Msx2Sprite;
    return (sprite.frames || []).flatMap((_frame, frame) =>
      buildHardwareSpriteLayersForFrame(sprite, 15, frame).map((layer, index, layers) => ({
        label: asset.name, assetId: asset.id, frame, mirrored: false,
        x: layer.xOffset, y: layer.yOffset,
        layer: layers.slice(0, index).filter(previous =>
          previous.xOffset === layer.xOffset && previous.yOffset === layer.yOffset).length,
        pattern: layer.pattern, colors: layer.colors, palette: sprite.palette,
      }))
    );
  });
}

/** Only MSX2 screens referenced by the selected World, deduplicated in world order. */
export function getSpriteViewScreens(assets: ProjectAsset[], worldAssetId: string): ProjectAsset[] {
  const world = assets.find(asset => asset.type === 'worldmap' && asset.id === worldAssetId)?.data as WorldMapGraph | undefined;
  const ids = new Set((world?.nodes || []).map(node => node.screenAssetId || (node as any).screenId));
  return Array.from(ids).flatMap(id => {
    const screen = assets.find(asset => (asset.type === 'msx2screen' || asset.type === 'msx2bitmaproom') && (asset.id === id || (asset.data as any)?.id === id));
    return screen ? [screen] : [];
  }).filter((screen, index, screens) => screens.findIndex(candidate => candidate.id === screen.id) === index);
}

export function getSpriteViewWorld(assets: ProjectAsset[], worldAssetId: string, screenAssetId?: string) {
  const worldAsset = assets.find(asset => asset.type === 'worldmap' && asset.id === worldAssetId);
  if (!worldAsset?.data) return undefined;
  const world = worldAsset.data as WorldMapGraph;
  const analysis = analyzeProject('Sprite View', assets);
  const worldId = world.id || worldAsset.id;
  const screens = getSpriteViewScreens(assets, worldAssetId);
  const screen = screens.find(asset => asset.id === screenAssetId);
  if (screenAssetId && !screen) return undefined;
  const screenId = screen ? (screen.data as any)?.id || screen.id : undefined;
  const tileWorld = screens.some(asset => asset.type === 'msx2screen');
  const compiled = tileWorld ? inspectScreen4WorldSpritePatterns(analysis, worldId, screenId) : inspectScreen5WorldSpritePatterns(analysis, worldId, screenId);
  // Unlinked worlds are still inspectable; explicitly label the independent preview.
  const result = compiled || (!tileWorld && inspectScreen5WorldSpritePatterns({
    ...analysis, worldmaps: [world], msx2GameFlows: [],
  }, worldId, screenId));
  if (!result) return undefined;
  // A compacted plane can have several owners. Link it only when its authored
  // sprite is unambiguous; never guess from entity ordering or geometry.
  const sources = new Map<string, SpriteViewPattern[]>();
  if (screen) for (const entry of collectSpriteViewAssets(assets)) {
    for (const bytes of [entry.pattern, mirrorHardwareSpritePatternHorizontally(entry.pattern)]) {
      const key = bytes.join(',');
      sources.set(key, [...sources.get(key) || [], entry]);
    }
  }
  const patterns = result.patterns.map(pattern => {
    const entry = { ...pattern, palette: result.palette } as SpriteViewPattern;
    if (entry.dynamic && !entry.reserved && !entry.assetId) {
      const matches = sources.get(entry.pattern.join(',')) || [];
      if (new Set(matches.map(source => source.assetId)).size === 1) {
        const source = matches.find(source => source.frame === entry.frame) || matches[0];
        entry.assetId = source.assetId;
        entry.label += ` · ${source.label}`;
      }
    }
    return entry;
  });
  const usedBytes = result.patterns.length * SPRITE_PATTERN_BYTES;
  const lastGroup = Math.max(-1, ...result.patterns.map(pattern => pattern.group));
  return {
    ...result, independentPreview: 'independentPreview' in result ? result.independentPreview : !compiled,
    screenMode: tileWorld ? 'SCREEN 4' : 'SCREEN 5', patternBase: tileWorld ? 0x3800 : SPRITE_PATTERN_BASE,
    screenName: screen?.name,
    patterns,
    usedBytes, freeBytes: Math.max(0, SPRITE_PATTERN_TABLE_BYTES - usedBytes),
    overflowBytes: Math.max(0, usedBytes - SPRITE_PATTERN_TABLE_BYTES, (lastGroup + 1 - SPRITE_PATTERN_CAPACITY) * SPRITE_PATTERN_BYTES),
  };
}
