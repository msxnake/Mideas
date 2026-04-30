import { Boss, BossPhase, ProjectAsset, ScreenMap, Sprite, Tile } from '../../types';
import { SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../../constants';
import { isScreen2Mode } from '../../utils/screenModeConfig';

const TRANSPARENT_COLOR = 'rgba(0,0,0,0)';

const findBossAsset = (allAssets: ProjectAsset[], bossAssetId: string): Boss | null => {
  const asset = allAssets.find(candidate => {
    if (candidate.type !== 'boss' || !candidate.data) return false;
    const boss = candidate.data as Boss;
    return candidate.id === bossAssetId || boss.id === bossAssetId;
  });
  return (asset?.data as Boss | undefined) || null;
};

const findSpriteAsset = (allAssets: ProjectAsset[], spriteAssetId: string): Sprite | null => {
  const asset = allAssets.find(candidate => {
    if (candidate.type !== 'sprite' || !candidate.data) return false;
    const sprite = candidate.data as Sprite;
    return candidate.id === spriteAssetId || sprite.id === spriteAssetId;
  });
  return (asset?.data as Sprite | undefined) || null;
};

const selectBossPhase = (boss: Boss, initialPhaseIndex?: number): BossPhase | null => {
  if (!boss.phases.length) return null;

  const clampedIndex = Math.max(0, Math.min(boss.phases.length - 1, initialPhaseIndex ?? 0));
  if (boss.phases[clampedIndex]) return boss.phases[clampedIndex];

  return boss.phases.find((_phase, index) => boss.phasesEnabled?.[index] !== false) || boss.phases[0];
};

const drawTileAt = (
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  destX: number,
  destY: number,
  cellSize: number,
  currentScreenMode: string
) => {
  const { data, width, height, lineAttributes } = tile;
  if (!data || width <= 0 || height <= 0) return;

  const sourceSize = Math.max(1, Math.min(8, width, height));
  const scale = cellSize / sourceSize;
  const isScreen2 = isScreen2Mode(currentScreenMode);

  for (let y = 0; y < sourceSize; y++) {
    for (let x = 0; x < sourceSize; x++) {
      let color = data[y]?.[x];
      if (!color || color === TRANSPARENT_COLOR) continue;

      if (isScreen2 && lineAttributes?.[y]) {
        const segmentIndex = Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
        const attr = lineAttributes[y][segmentIndex];
        if (attr && color !== attr.fg && color !== attr.bg) {
          color = attr.fg;
        }
      }

      ctx.fillStyle = color;
      ctx.fillRect(destX + x * scale, destY + y * scale, scale, scale);
    }
  }
};

const drawSpriteAt = (
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  destX: number,
  destY: number
) => {
  const frameIndex = Math.max(0, Math.min(sprite.frames.length - 1, sprite.currentFrameIndex ?? 0));
  const frame = sprite.frames[frameIndex] || sprite.frames[0];
  if (!frame?.data) return;

  for (let y = 0; y < sprite.size.height; y++) {
    for (let x = 0; x < sprite.size.width; x++) {
      const color = frame.data[y]?.[x];
      if (!color || color === TRANSPARENT_COLOR) continue;
      ctx.fillStyle = color;
      ctx.fillRect(destX + x, destY + y, 1, 1);
    }
  }
};

const buildTileLookup = (allAssets: ProjectAsset[], tileset: Tile[]) => {
  const tileById = new Map<string, Tile>();
  tileset.forEach(tile => {
    if (tile?.id) tileById.set(tile.id, tile);
  });
  allAssets.forEach(asset => {
    if (asset.type === 'tile' && asset.data) {
      const tile = asset.data as Tile;
      if (tile.id) tileById.set(tile.id, tile);
      if (asset.id) tileById.set(asset.id, tile);
    }
  });
  return tileById;
};

export const renderBossPhaseToCanvas = (
  ctx: CanvasRenderingContext2D,
  phase: BossPhase | null | undefined,
  allAssets: ProjectAsset[],
  tileset: Tile[],
  currentScreenMode: string,
  cellSize: number,
  xChar: number,
  yChar: number
) => {
  if (!phase) return;

  const originX = xChar * cellSize;
  const originY = yChar * cellSize;

  if (phase.buildType === 'sprite' && phase.spriteAssetId) {
    const sprite = findSpriteAsset(allAssets, phase.spriteAssetId);
    if (sprite) drawSpriteAt(ctx, sprite, originX, originY);
    return;
  }

  const tileById = buildTileLookup(allAssets, tileset);
  const dimensions = phase.dimensions || {
    width: Math.max(1, phase.tileMatrix?.[0]?.length || 1),
    height: Math.max(1, phase.tileMatrix?.length || 1),
  };

  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const tileId = phase.tileMatrix?.[y]?.[x];
      if (!tileId) continue;

      const tile = tileById.get(tileId);
      if (!tile) continue;

      drawTileAt(ctx, tile, originX + x * cellSize, originY + y * cellSize, cellSize, currentScreenMode);
    }
  }
};

export const renderBossInstancesToCanvas = (
  ctx: CanvasRenderingContext2D,
  screenMap: ScreenMap | null | undefined,
  allAssets: ProjectAsset[],
  tileset: Tile[],
  currentScreenMode: string,
  cellSize: number
) => {
  const bossInstances = screenMap?.bossInstances || [];
  if (!bossInstances.length) return;

  bossInstances.forEach(instance => {
    if (instance.enabled === false) return;

    const boss = findBossAsset(allAssets, instance.bossAssetId);
    if (!boss) return;

    const phase = selectBossPhase(boss, instance.initialPhaseIndex);
    if (!phase) return;

    renderBossPhaseToCanvas(ctx, phase, allAssets, tileset, currentScreenMode, cellSize, instance.xChar, instance.yChar);
  });
};
