import { ProjectAnalysis } from '../../../../asmTemplateGenerator';
import { V2Options, V2Output, SpriteLayout, RoleLayout } from './types';
import { resolvePhysicsConfig } from './physicsUtils';
import { generateSpriteData, rolePatternSlotCount } from './dataGen';
import { generateInit } from './generators/initGen';
import { generateInput } from './generators/inputGen';
import { generateMovement } from './generators/movementGen';
import { generateStateMachine } from './generators/stateMachineGen';
import { generateCollision } from './generators/collisionGen';
import { generateSatWrites } from './generators/satGen';
import {
  getHardwareSpriteSource, getHardwareSpriteRuntimeSettings,
  buildHardwareSpriteLayers, buildHardwareSpriteLayersForFrame,
  clampHardwareSpriteCount, mirrorHardwareSpritePatternHorizontally,
  getHorizontalFacingDirection, getPlayerAnimRoles,
  getMsx2PlayerUsesFlipX, getFallbackPlayerHorizontalFacing,
  getEffectivePlayerRoleFacing, getHardwareSpriteAnimationFrameCount,
  getHardwareSpriteAnimationDelayFrames, getMsx2PlayerAnimateOnlyWhenMoving,
  getMsx2PlatformPlayerEntity, getPlayerRuntimeSource, getPrimaryRuntimeTileScreen,
  getPrimaryPlayerEntry, getEnemyHardwareSpriteSource, usesControl2Players,
  getRuntimePatrolBounds, getPlayerBulletSlotCount,
  MSX2_MAX_PLAYER_HARDWARE_LAYERS,
} from '../msx2Screen4Generator';

function sanitizeLabel(name: string | undefined, fallback: string): string {
  if (!name) return fallback;
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .substring(0, 64) || fallback;
}

export function buildPlayerRuntimeAsmV2(
  analysis: ProjectAnalysis,
  options: V2Options
): V2Output {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) {
    return { init: '', data: '', runtime: '' };
  }

  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const playerEntity = getMsx2PlatformPlayerEntity(analysis);
  const screen = getPrimaryRuntimeTileScreen(analysis);
  const entry = getPrimaryPlayerEntry(screen);
  const hbPlayer = getPlayerRuntimeSource(screen, analysis);
  const physics = resolvePhysicsConfig(playerEntity);
  const roles = getPlayerAnimRoles(analysis);
  const hasRoles = roles && Object.keys(roles).length >= 2;
  const playerUsesFlipX = getMsx2PlayerUsesFlipX(analysis);
  const fallbackPlayerFacing = getFallbackPlayerHorizontalFacing(roles, sprite);
  const animateOnlyWhenMoving = getMsx2PlayerAnimateOnlyWhenMoving(analysis);
  const control2Players = usesControl2Players(analysis);
  const color = Math.max(1, Math.min(15, settings.color));
  const horizontalFacing = getHorizontalFacingDirection(sprite);
  const usesVertical = physics.gravityEnabled || physics.jumpEnabled;
  const patrolBounds = getRuntimePatrolBounds(analysis);

  // --- Single sprite path ---
  const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(sprite, color))
    .slice(0, MSX2_MAX_PLAYER_HARDWARE_LAYERS);
  const frameCount = getHardwareSpriteAnimationFrameCount(sprite, layers.length);
  const animationDelayFrames = getHardwareSpriteAnimationDelayFrames(sprite);

  const mirrorPatternVariantCount = horizontalFacing ? 2 : 1;
  const mirrorPatternOffset = horizontalFacing
    ? layers.length * frameCount * mirrorPatternVariantCount - (layers.length * frameCount)
    : 0;

  // --- Role data (idle / walk) ---
  let idle: RoleLayout | null = null;
  let walk: RoleLayout | null = null;
  let playerPatternCount = layers.length * frameCount * mirrorPatternVariantCount;

  if (hasRoles) {
    let patternOffset = 0;
    const idleRole = roles!['idle'];
    const walkRole = roles!['walk'];

    if (idleRole) {
      idle = buildRoleLayout('idle', idleRole, color, fallbackPlayerFacing, playerUsesFlipX, patternOffset);
      patternOffset += idle.patternSlotCount;
    }
    if (walkRole) {
      walk = buildRoleLayout('walk', walkRole, color, fallbackPlayerFacing, playerUsesFlipX, patternOffset);
      patternOffset += walk.patternSlotCount;
    }
    playerPatternCount = patternOffset;
  }

  // --- Enemy/bullet pattern indices ---
  const enemySprite = getEnemyHardwareSpriteSource(analysis);
  const enemyHorizontalFacing = !control2Players && enemySprite
    ? getHorizontalFacingDirection(enemySprite) : undefined;
  const enemyPatternVariantCount = enemyHorizontalFacing ? 2 : 1;

  const enemyPatternIndex = playerPatternCount;
  const playerBulletPatternIndex = enemyPatternIndex + enemyPatternVariantCount;
  const enemyBulletPatternIndex = playerBulletPatternIndex + 1;
  const pushBoxPatternIndex = enemyBulletPatternIndex + 1;

  // --- Hitbox offsets ---
  const hb = resolvePlayerHitbox(hbPlayer);
  const hbLeft = hb.offsetX;
  const hbRight = hb.offsetX + hb.w;
  const hbFeet = hb.offsetY + hb.h;
  const hbCenterX = hb.offsetX + Math.floor(hb.w / 2);
  const hbCenterY = hb.offsetY + Math.floor(hb.h / 2);

  // --- Walking flag management ---
  const usePlayerWalkingFlag = animateOnlyWhenMoving && !usesSnakeGrowth(analysis);
  const walkingFlagManaged = usePlayerWalkingFlag || hasRoles;
  const clearPlayerWalkingFlagAsm = walkingFlagManaged
    ? '    ld a, (msx2_player_walking_flag)\n    or a\n    jp z, .no_walking_clear\n    xor a\n    ld (msx2_player_walking_flag), a\n.no_walking_clear:\n'
    : '';
  const setPlayerWalkingFlagAsm = walkingFlagManaged
    ? '    ld a, 1\n    ld (msx2_player_walking_flag), a\n'
    : '';

  // --- Layout ---
  const layout: SpriteLayout = {
    basePatternIndex: 0,
    layers,
    frameCount,
    frameStride: layers.length,
    mirrorPatternOffset,
    horizontalFacing: !!horizontalFacing,
    playerUsesFlipX,
    animationDelayFrames,
    animateOnlyWhenMoving,
    usePlayerWalkingFlag,
    hasPlayerAnimRoles: hasRoles,
    idle,
    walk,
    hbLeft,
    hbFeet,
    hbRight,
    hbCenterX,
    hbCenterY,
    playerPatternCount,
    enemyPatternIndex,
    enemyMirrorPatternIndex: enemyPatternIndex + 1,
    playerBulletPatternIndex,
    enemyBulletPatternIndex,
    pushBoxPatternIndex,
    color,
    visible: settings.visible,
    initX: clampHardwareSpriteX(settings.x),
    initY: clampHardwareSpriteY(settings.y),
    initialFacingDx: getPlayerInitialFacingDx(analysis),
    initialFrame: settings.initialFrame,
    patrolBounds,
    control2Players,
    playerHardwareVisible: settings.visible,
    usesVerticalPhysics: usesVertical,
    walkingFlagManaged,
    fallbackPlayerFacing,
    mirrorPatternVariantCount,
    enemyPatternVariantCount,
    playerBulletSlotCount: getPlayerBulletSlotCount(analysis),
    enemyBulletSlotCount: 2,
    setPlayerWalkingFlagAsm,
    clearPlayerWalkingFlagAsm,
  };

  const init = generateInit(analysis, layout, options);
  const data = generateSpriteData(analysis, layout, options);
  const runtime = [
    generateInput(analysis, layout, physics, options),
    generateMovement(analysis, layout, physics, options),
    generateStateMachine(analysis, layout, physics, options),
    generateCollision(analysis, layout, options),
    generateSatWrites(analysis, layout, physics, options),
  ].join('\n');

  return { init, data, runtime };
}

function buildRoleLayout(
  roleName: string,
  role: any,
  color: number,
  fallbackFacing: 'left' | 'right' | undefined,
  playerUsesFlipX: boolean,
  patternOffset: number
): RoleLayout {
  const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(role.sprite, color))
    .slice(0, MSX2_MAX_PLAYER_HARDWARE_LAYERS);
  const uniqueFrameIndices = Array.from(new Set<number>(role.frames));
  const effectiveFacing = getEffectivePlayerRoleFacing(role, fallbackFacing, playerUsesFlipX);
  const uniqueFrameCount = uniqueFrameIndices.length;
  const patternSlotCount = rolePatternSlotCount(uniqueFrameCount, layers.length, Boolean(effectiveFacing));
  const mirrorPatternOffset = effectiveFacing
    ? layers.length * uniqueFrameCount
    : 0;

  return {
    sprite: role.sprite,
    basePatternIndex: patternOffset,
    frameStride: layers.length,
    mirrorPatternOffset,
    patternSlotCount,
    layers,
    frameCount: role.frames.length,
    delay: role.speed,
    facingDirection: effectiveFacing,
    uniqueFrameCount,
    uniqueFrameIndices,
    frameMapLabel: `msx2_hw_${sanitizeLabel(roleName, 'role')}_frame_map`,
    frames: role.frames,
  };
}

function resolvePlayerHitbox(player: any): { offsetX: number; offsetY: number; w: number; h: number } {
  const hb = player?.hitbox ?? player?.params?.hitbox ?? {};
  const offsetX = Math.max(0, Math.min(15, Number(hb.x) || 0));
  const offsetY = Math.max(0, Math.min(15, Number(hb.y) || 0));
  const w = Math.max(1, Math.min(16, Number(hb.w) || 16));
  const h = Math.max(1, Math.min(16, Number(hb.h) || 16));
  return { offsetX, offsetY, w, h };
}

function clampHardwareSpriteX(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function clampHardwareSpriteY(value: number): number {
  return Math.max(0, Math.min(191, value));
}

function getPlayerInitialFacingDx(analysis: ProjectAnalysis): number {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return 1;
  const facing = getHorizontalFacingDirection(sprite);
  return facing === 'left' ? 0 : 1;
}

function usesSnakeGrowth(analysis: ProjectAnalysis): boolean {
  return false;
}


