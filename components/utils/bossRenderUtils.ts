import { Boss, BossBehaviorAction, BossBehaviorTarget, BossForm, BossPhase, ProjectAsset, ScreenMap, Sprite, Tile } from '../../types';
import { SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../../constants';
import { isScreen2Mode } from '../../utils/screenModeConfig';

const TRANSPARENT_COLOR = 'rgba(0,0,0,0)';
const CURRENT_FORM_ID = '__phase_current_form';

export interface BossRenderOptions {
  frame?: number;
  playerXChar?: number;
  playerYChar?: number;
}

interface BossBehaviorEvaluation {
  xChar: number;
  yChar: number;
  formId?: string;
}

const findBossAsset = (allAssets: ProjectAsset[], bossAssetId: string): Boss | null => {
  const asset = allAssets.find(candidate => {
    if (candidate.type !== 'boss' || !candidate.data) return false;
    const boss = candidate.data as Boss;
    return candidate.id === bossAssetId || boss.id === bossAssetId;
  });
  return (asset?.data as Boss | undefined) || null;
};

const resolveBossInstanceStart = (boss: Boss, screenMap: ScreenMap, instance: { xChar: number; yChar: number }) => {
  const hasBehaviorX = Number.isFinite(boss.behaviorPreviewStartXChar);
  const hasBehaviorY = Number.isFinite(boss.behaviorPreviewStartYChar);
  const isLinkedToScreen = !!boss.linkedScreenId && boss.linkedScreenId === screenMap.id;
  if ((hasBehaviorX || hasBehaviorY) && isLinkedToScreen) {
    return {
      xChar: Math.max(0, Math.min(screenMap.width - 1, Math.round(hasBehaviorX ? boss.behaviorPreviewStartXChar as number : instance.xChar))),
      yChar: Math.max(0, Math.min(screenMap.height - 1, Math.round(hasBehaviorY ? boss.behaviorPreviewStartYChar as number : instance.yChar))),
    };
  }

  return { xChar: instance.xChar, yChar: instance.yChar };
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

const actionDuration = (action: BossBehaviorAction): number => {
  switch (action.type) {
    case 'wait':
      return action.frames;
    case 'moveTo':
      return action.durationFrames;
    case 'attack':
      return Math.max(1, action.delayAfterFrames ?? 1);
    case 'slam':
      return action.windupFrames + action.slamFrames + (action.holdFrames ?? 0) + action.returnFrames;
    case 'protect':
    case 'shield':
      return action.durationFrames;
    case 'setForm':
      return 1;
    case 'animateForm':
      return Math.max(1, action.frameDurationFrames) * Math.max(1, action.formIds.length) * Math.max(1, action.loops);
    case 'loop':
      return 1;
    default:
      return 1;
  }
};

const resolveBehaviorTarget = (
  target: BossBehaviorTarget | undefined,
  bossX: number,
  bossY: number,
  playerX: number,
  playerY: number
) => {
  if (!target) return { xChar: bossX, yChar: bossY };
  switch (target.type) {
    case 'fixed':
      return { xChar: target.xChar ?? bossX, yChar: target.yChar ?? bossY };
    case 'playerCurrent':
    case 'playerLastKnown':
      return { xChar: playerX, yChar: playerY };
    case 'playerPredicted':
      return { xChar: playerX + Math.max(1, Math.round((target.framesAhead ?? 20) / 20)), yChar: playerY };
    case 'bossRelative':
      return { xChar: bossX + (target.dxChar ?? 0), yChar: bossY + (target.dyChar ?? 0) };
    default:
      return { xChar: bossX, yChar: bossY };
  }
};

const lerp = (from: number, to: number, progress: number) => from + (to - from) * Math.max(0, Math.min(1, progress));

const evaluateBossBehavior = (
  phase: BossPhase,
  startXChar: number,
  startYChar: number,
  options: BossRenderOptions | undefined
): BossBehaviorEvaluation => {
  const loop = phase.behaviorLoop || [];
  if (!loop.length) return { xChar: startXChar, yChar: startYChar, formId: phase.initialFormId || CURRENT_FORM_ID };

  const totalFrames = loop.reduce((sum, action) => sum + actionDuration(action), 0);
  const frame = totalFrames > 0 ? Math.max(0, Math.floor(options?.frame ?? 0)) % totalFrames : 0;
  const playerX = options?.playerXChar ?? 16;
  const playerY = options?.playerYChar ?? 18;
  let xChar = startXChar;
  let yChar = startYChar;
  let formId = phase.initialFormId || CURRENT_FORM_ID;
  let cursor = 0;

  for (const action of loop) {
    const duration = actionDuration(action);
    const localFrame = frame - cursor;
    const isActive = localFrame >= 0 && localFrame < duration;

    if (action.type === 'moveTo') {
      const target = resolveBehaviorTarget(action.target, xChar, yChar, playerX, playerY);
      if (isActive) {
        const progress = duration <= 1 ? 1 : localFrame / duration;
        return { xChar: lerp(xChar, target.xChar, progress), yChar: lerp(yChar, target.yChar, progress), formId };
      }
      xChar = target.xChar;
      yChar = target.yChar;
    } else if (action.type === 'slam') {
      const target = resolveBehaviorTarget(action.target, xChar, yChar, playerX, playerY);
      let slamTargetX = target.xChar;
      let slamTargetY = target.yChar;
      if (action.direction && action.direction !== 'target') {
        slamTargetX = xChar + (action.direction === 'left' ? -action.distanceChars : action.direction === 'right' ? action.distanceChars : 0);
        slamTargetY = yChar + (action.direction === 'up' ? -action.distanceChars : action.direction === 'down' ? action.distanceChars : 0);
      }
      if (isActive) {
        const windupEnd = action.windupFrames;
        const slamEnd = windupEnd + action.slamFrames;
        const holdEnd = slamEnd + (action.holdFrames ?? 0);
        if (localFrame < windupEnd) return { xChar, yChar, formId };
        if (localFrame < slamEnd) {
          const progress = (localFrame - windupEnd) / Math.max(1, action.slamFrames);
          return { xChar: lerp(xChar, slamTargetX, progress), yChar: lerp(yChar, slamTargetY, progress), formId };
        }
        if (localFrame < holdEnd) return { xChar: slamTargetX, yChar: slamTargetY, formId };
        const progress = (localFrame - holdEnd) / Math.max(1, action.returnFrames);
        return { xChar: lerp(slamTargetX, xChar, progress), yChar: lerp(slamTargetY, yChar, progress), formId };
      }
    } else if (action.type === 'setForm') {
      if (isActive) return { xChar, yChar, formId: action.formId || formId };
      formId = action.formId || formId;
    } else if (action.type === 'animateForm') {
      if (isActive) {
        const formIds = action.formIds.length > 0 ? action.formIds : formId ? [formId] : [];
        const frameIndex = formIds.length > 0
          ? Math.floor(localFrame / Math.max(1, action.frameDurationFrames)) % formIds.length
          : 0;
        return { xChar, yChar, formId: formIds[frameIndex] || formId };
      }
      if (action.formIds.length > 0) formId = action.formIds[action.formIds.length - 1];
    } else if (isActive) {
      return { xChar, yChar, formId };
    }

    cursor += duration;
  }

  return { xChar, yChar, formId };
};

const formToPhase = (phase: BossPhase, formId?: string): BossPhase => {
  if (!formId || formId === CURRENT_FORM_ID) return phase;
  const form = (phase.forms || []).find(candidate => candidate.id === formId) as BossForm | undefined;
  if (!form) return phase;
  return {
    ...phase,
    buildType: 'tile',
    dimensions: form.dimensions,
    tileMatrix: form.tileMatrix,
    collisionMatrix: form.collisionMatrix,
    weakPoints: form.weakPoints,
  };
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
  cellSize: number,
  options?: BossRenderOptions
) => {
  const bossInstances = screenMap?.bossInstances || [];
  if (!bossInstances.length) return;

  bossInstances.forEach(instance => {
    if (instance.enabled === false) return;

    const boss = findBossAsset(allAssets, instance.bossAssetId);
    if (!boss) return;

    const phase = selectBossPhase(boss, instance.initialPhaseIndex);
    if (!phase) return;

    const start = resolveBossInstanceStart(boss, screenMap, instance);
    const behaviorState = evaluateBossBehavior(phase, start.xChar, start.yChar, options);
    const phaseToRender = formToPhase(phase, behaviorState.formId);
    renderBossPhaseToCanvas(ctx, phaseToRender, allAssets, tileset, currentScreenMode, cellSize, behaviorState.xChar, behaviorState.yChar);
  });
};
