import { Msx2PlayerAnimation, Msx2PlayerDefinition, Msx2Sprite, ProjectAsset } from '../types';

/** Frame indices with non-empty pixel data, same contract as MSX2 hardware sprite export. */
export function getMsx2SpriteFrameIndices(sprite: Msx2Sprite | undefined): number[] {
  if (!sprite?.frames?.length) return [0];
  const indices = sprite.frames
    .map((_frame, index) => index)
    .filter(index => Array.isArray(sprite.frames?.[index]?.data) && sprite.frames[index].data.length > 0);
  return indices.length ? indices : [0];
}

/** Animation delay in 60 Hz frames from MSX2 Sprite asset timing. */
export function getMsx2SpriteAnimationDelayFrames(sprite: Msx2Sprite | undefined): number {
  const speedMs = Number(sprite?.animationSpeedMs);
  if (!Number.isFinite(speedMs) || speedMs <= 0) return 8;
  return Math.max(1, Math.min(255, Math.round(speedMs / (1000 / 60))));
}

export function resolvePlayerAnimationSpriteAssetId(
  animation: Pick<Msx2PlayerAnimation, 'spriteAssetId'> | undefined,
  defaultSpriteAssetId?: string,
): string {
  return String(animation?.spriteAssetId || defaultSpriteAssetId || '').trim();
}

/** MSX2 Sprite Render is the animation source of truth (frames + speed). */
export function playerAnimationFromMsx2Sprite(
  animation: Msx2PlayerAnimation,
  sprite?: Msx2Sprite,
): Msx2PlayerAnimation {
  if (!sprite?.frames?.length) return animation;
  return {
    ...animation,
    frames: getMsx2SpriteFrameIndices(sprite),
    speed: getMsx2SpriteAnimationDelayFrames(sprite),
    playback: sprite.loops === false ? 'once' : 'loop',
  };
}

const animationTimingSignature = (animation: Msx2PlayerAnimation): string =>
  `${animation.frames?.join(',') || ''}:${animation.speed}:${animation.playback || 'loop'}:${animation.spriteAssetId || ''}`;

/** Keep player animation rows aligned with MSX2 Sprite Render (frames + speed). */
export function syncPlayerAnimationsFromLinkedSprites(
  player: Pick<Msx2PlayerDefinition, 'animations' | 'animationOrder' | 'render'>,
  spriteAssets: ReadonlyArray<Pick<ProjectAsset, 'id' | 'data'>>,
): { animations: Record<string, Msx2PlayerAnimation>; changed: boolean } {
  const order = player.animationOrder || Object.keys(player.animations);
  const defaultSpriteId = player.render?.spriteAssetId;
  let changed = false;
  const animations = order.reduce((result, key) => {
    const animation = player.animations[key];
    if (!animation) return result;
    const assetId = resolvePlayerAnimationSpriteAssetId(animation, defaultSpriteId);
    const sprite = assetId
      ? spriteAssets.find(asset => asset.id === assetId)?.data as Msx2Sprite | undefined
      : undefined;
    const synced = playerAnimationFromMsx2Sprite(animation, sprite);
    if (animationTimingSignature(synced) !== animationTimingSignature(animation)) {
      changed = true;
    }
    result[key] = synced;
    return result;
  }, {} as Record<string, Msx2PlayerAnimation>);
  return { animations, changed };
}

export function playerAnimationPreviewTiming(
  animation: Msx2PlayerAnimation | undefined,
  sprite?: Msx2Sprite,
): { frameIndices: number[]; speedFrames: number; playback: Msx2PlayerAnimation['playback'] } {
  if (sprite?.frames?.length) {
    return {
      frameIndices: getMsx2SpriteFrameIndices(sprite),
      speedFrames: getMsx2SpriteAnimationDelayFrames(sprite),
      playback: sprite.loops === false ? 'once' : (animation?.playback ?? 'loop'),
    };
  }
  const frameIndices = animation?.frames?.length ? animation.frames : [0];
  return {
    frameIndices,
    speedFrames: Math.max(1, Math.trunc(Number(animation?.speed) || 6)),
    playback: animation?.playback ?? 'loop',
  };
}
