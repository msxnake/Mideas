import { Msx2PlayerDefinition, Msx2Sprite, ProjectAsset } from '../types';

export const MSX2_HARDWARE_SPRITE_CAPACITY = 32;
export const MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY = 64;
export const MSX2_PATROL_ENEMY_MAX_COLOR_LAYERS = 2;
export const MSX2_PATROL_ENEMY_MAX_FRAMES = 2;
export const MSX2_PATROL_ENEMY_ORIENTATION_VARIANTS = 2;
export const MSX2_PATROL_ENEMY_PATTERN_RESERVE =
  MSX2_PATROL_ENEMY_MAX_COLOR_LAYERS
  * MSX2_PATROL_ENEMY_MAX_FRAMES
  * MSX2_PATROL_ENEMY_ORIENTATION_VARIANTS;

interface OrColorPair {
  base: number;
  overlay: number;
  result: number;
}

interface RowLayerComposition {
  masks: number[];
  colors: number[];
}

export interface Msx2SpriteFrameHardwareUsage {
  spriteAssetId: string;
  spriteName: string;
  frameIndex: number;
  hardwareSprites: number;
  cellCount: number;
  layerCountsByCell: number[];
  distinctPatternKeys: string[];
  mirrorEnabled: boolean;
  mirrorPatternVariantCount: 1 | 2;
  emittedPatternCount: number;
}

export interface Msx2PlayerHardwareSpriteUsage {
  capacity: number;
  used: number;
  available: number;
  percentUsed: number;
  patternCapacity: number;
  patternUsed: number;
  patternAvailable: number;
  patternPercentUsed: number;
  spriteAssetIds: string[];
  sourceSpriteNames: string[];
  framesAnalyzed: number;
  distinctPatternCount: number;
  emittedPatternCount: number;
  mirrorEnabled: boolean;
  mirrorSpriteNames: string[];
  worstFrame?: Msx2SpriteFrameHardwareUsage;
  frameUsages: Msx2SpriteFrameHardwareUsage[];
  screenPatternUsage: Msx2ScreenPatternUsage;
  warnings: string[];
}

export interface Msx2ScreenPatternUsage {
  capacity: number;
  used: number;
  available: number;
  percentUsed: number;
  playerPatternCount: number;
  patrolEnemyPatternCount: number;
  patrolEnemyColorLayers: number;
  patrolEnemyFrameCount: number;
  patrolEnemyOrientationVariants: number;
}

const TRANSPARENT_HEX = 'RGBA(0,0,0,0)';

const normalizeColor = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const isTransparentSpritePixel = (sprite: Msx2Sprite, color: string | undefined): boolean => {
  const normalized = normalizeColor(color);
  return !normalized
    || normalized === TRANSPARENT_HEX
    || normalized === normalizeColor(sprite.backgroundColor);
};

const paletteSlotForSpriteColor = (sprite: Msx2Sprite, color: string | undefined): number | undefined => {
  const normalized = normalizeColor(color);
  if (isTransparentSpritePixel(sprite, color)) return undefined;
  const slotIndex = sprite.palette?.find(slot => normalizeColor(slot.hex) === normalized)?.slotIndex;
  if (typeof slotIndex === 'number' && slotIndex > 0 && slotIndex < 16) return slotIndex;
  return undefined;
};

const hasHorizontalMirrorVariant = (sprite: Msx2Sprite): boolean =>
  sprite.facingDirection === 'left' || sprite.facingDirection === 'right';

const mirrorMask16 = (mask: number): number => {
  let mirrored = 0;
  for (let bit = 0; bit < 16; bit++) {
    if (mask & (1 << bit)) mirrored |= 1 << (15 - bit);
  }
  return mirrored;
};

const findBestOrColorPair = (slots: number[], counts: Map<number, number>): OrColorPair | undefined => {
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
};

const buildCellRowComposition = (slots: number[], useOrColor: boolean): RowLayerComposition => {
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
};

export const calculateMsx2SpriteFrameHardwareUsage = (
  spriteAssetId: string,
  spriteName: string,
  sprite: Msx2Sprite,
  frameIndex: number,
): Msx2SpriteFrameHardwareUsage => {
  const frame = sprite.frames?.[frameIndex] || sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
  const width = Math.max(1, sprite.size?.width || 16);
  const height = Math.max(1, sprite.size?.height || 16);
  const useOrColor = sprite.hardware?.useOrColor !== false;
  const cellColumns = Math.max(1, Math.ceil(width / 16));
  const cellRows = Math.max(1, Math.ceil(height / 16));
  const mirrorEnabled = hasHorizontalMirrorVariant(sprite);
  const mirrorPatternVariantCount: 1 | 2 = mirrorEnabled ? 2 : 1;
  const layerCountsByCell: number[] = [];
  const distinctPatternKeys = new Set<string>();
  let emittedPatternCount = 0;
  let hardwareSprites = 0;

  for (let cellY = 0; cellY < cellRows; cellY++) {
    for (let cellX = 0; cellX < cellColumns; cellX++) {
      const xOffset = cellX * 16;
      const yOffset = cellY * 16;
      const rowCompositions = Array.from({ length: 16 }, (_, y) => {
        const slots = Array.from({ length: 16 }, (_unused, x) =>
          paletteSlotForSpriteColor(sprite, frame?.data?.[yOffset + y]?.[xOffset + x]) || 0
        );
        return buildCellRowComposition(slots, useOrColor);
      });
      const layerCount = Math.min(8, Math.max(0, ...rowCompositions.map(row => row.colors.length)));
      let visibleLayers = 0;
      for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
        const masks = rowCompositions.map(row => row.masks[layerIndex] || 0);
        if (!masks.some(mask => mask !== 0)) continue;
        visibleLayers += 1;
        emittedPatternCount += mirrorPatternVariantCount;
        const colors = rowCompositions.map(row => row.colors[layerIndex] || 0);
        distinctPatternKeys.add(`${cellX},${cellY}:${masks.join(',')}:${colors.join(',')}`);
        if (mirrorEnabled) {
          const mirroredMasks = masks.map(mirrorMask16);
          distinctPatternKeys.add(`${cellX},${cellY}:mirror:${mirroredMasks.join(',')}:${colors.join(',')}`);
        }
      }
      layerCountsByCell.push(visibleLayers);
      hardwareSprites += visibleLayers;
    }
  }

  return {
    spriteAssetId,
    spriteName,
    frameIndex,
    hardwareSprites,
    cellCount: cellColumns * cellRows,
    layerCountsByCell,
    distinctPatternKeys: Array.from(distinctPatternKeys),
    mirrorEnabled,
    mirrorPatternVariantCount,
    emittedPatternCount,
  };
};

export const calculateMsx2SpriteAssetHardwareUsage = (
  spriteAssetId: string,
  spriteName: string,
  sprite: Msx2Sprite,
): Msx2SpriteFrameHardwareUsage[] => {
  const frames = sprite.frames?.length ? sprite.frames : [undefined];
  return frames.map((_frame, frameIndex) =>
    calculateMsx2SpriteFrameHardwareUsage(spriteAssetId, spriteName, sprite, frameIndex)
  );
};

export const collectMsx2PlayerSpriteAssetIds = (player: Msx2PlayerDefinition): string[] => {
  const ids = new Set<string>();
  if (player.render?.spriteAssetId) ids.add(player.render.spriteAssetId);
  Object.values(player.animations || {}).forEach(animation => {
    if (animation?.spriteAssetId) ids.add(animation.spriteAssetId);
  });
  Object.values(player.render?.stateSprites || {}).forEach(spriteAssetId => {
    if (spriteAssetId) ids.add(spriteAssetId);
  });
  return Array.from(ids);
};

export const calculateMsx2ScreenPatternUsage = (
  playerFrameUsages: Msx2SpriteFrameHardwareUsage[],
): Msx2ScreenPatternUsage => {
  const distinctPatterns = new Set(playerFrameUsages.flatMap(frame => frame.distinctPatternKeys));
  const playerPatternCount = distinctPatterns.size;
  const patrolEnemyPatternCount = MSX2_PATROL_ENEMY_PATTERN_RESERVE;
  const used = playerPatternCount + patrolEnemyPatternCount;

  return {
    capacity: MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY,
    used,
    available: Math.max(0, MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY - used),
    percentUsed: MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY
      ? Math.round((used / MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY) * 100)
      : 0,
    playerPatternCount,
    patrolEnemyPatternCount,
    patrolEnemyColorLayers: MSX2_PATROL_ENEMY_MAX_COLOR_LAYERS,
    patrolEnemyFrameCount: MSX2_PATROL_ENEMY_MAX_FRAMES,
    patrolEnemyOrientationVariants: MSX2_PATROL_ENEMY_ORIENTATION_VARIANTS,
  };
};

export const calculateMsx2PlayerHardwareSpriteUsage = (
  player: Msx2PlayerDefinition,
  allAssets: ProjectAsset[],
): Msx2PlayerHardwareSpriteUsage => {
  const spriteAssetIds = collectMsx2PlayerSpriteAssetIds(player);
  const warnings: string[] = [];
  const frameUsages: Msx2SpriteFrameHardwareUsage[] = [];

  if (!spriteAssetIds.length) {
    warnings.push('No MSX2 sprite asset is assigned to this player render.');
  }

  spriteAssetIds.forEach(spriteAssetId => {
    const asset = allAssets.find(candidate => candidate.id === spriteAssetId && candidate.type === 'msx2sprite');
    const sprite = asset?.data as Msx2Sprite | undefined;
    if (!sprite) {
      warnings.push(`Sprite asset not found: ${spriteAssetId}`);
      return;
    }
    frameUsages.push(...calculateMsx2SpriteAssetHardwareUsage(spriteAssetId, asset.name || sprite.name || spriteAssetId, sprite));
  });

  const worstFrame = frameUsages.reduce<Msx2SpriteFrameHardwareUsage | undefined>(
    (best, frame) => !best || frame.hardwareSprites > best.hardwareSprites ? frame : best,
    undefined,
  );
  const distinctPatterns = new Set(frameUsages.flatMap(frame => frame.distinctPatternKeys));
  const mirrorSpriteNames = Array.from(new Set(
    frameUsages.filter(frame => frame.mirrorEnabled).map(frame => frame.spriteName)
  ));
  const used = Math.min(MSX2_HARDWARE_SPRITE_CAPACITY, worstFrame?.hardwareSprites || 0);
  const patternUsed = Math.min(MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY, distinctPatterns.size);
  const screenPatternUsage = calculateMsx2ScreenPatternUsage(frameUsages);
  if (screenPatternUsage.used > screenPatternUsage.capacity) {
    warnings.push(
      `Player plus the patrol-enemy reserve exceed VRAM capacity by ${screenPatternUsage.used - screenPatternUsage.capacity} pattern slot(s).`
    );
  }

  return {
    capacity: MSX2_HARDWARE_SPRITE_CAPACITY,
    used,
    available: Math.max(0, MSX2_HARDWARE_SPRITE_CAPACITY - used),
    percentUsed: MSX2_HARDWARE_SPRITE_CAPACITY ? Math.round((used / MSX2_HARDWARE_SPRITE_CAPACITY) * 100) : 0,
    patternCapacity: MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY,
    patternUsed,
    patternAvailable: Math.max(0, MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY - patternUsed),
    patternPercentUsed: MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY ? Math.round((patternUsed / MSX2_HARDWARE_SPRITE_PATTERN_CAPACITY) * 100) : 0,
    spriteAssetIds,
    sourceSpriteNames: frameUsages.length
      ? Array.from(new Set(frameUsages.map(frame => frame.spriteName)))
      : [],
    framesAnalyzed: frameUsages.length,
    distinctPatternCount: distinctPatterns.size,
    emittedPatternCount: frameUsages.reduce((sum, frame) => sum + frame.emittedPatternCount, 0),
    mirrorEnabled: mirrorSpriteNames.length > 0,
    mirrorSpriteNames,
    worstFrame,
    frameUsages,
    screenPatternUsage,
    warnings,
  };
};
