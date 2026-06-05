import { SpriteLayout, RoleLayout } from './types';
import {
  Msx2HardwareLayer, formatBytes,
  getHardwareSpriteSource, getHardwareSpriteRuntimeSettings,
  buildHardwareSpriteLayers, buildHardwareSpriteLayersForFrame, clampHardwareSpriteCount,
  mirrorHardwareSpritePatternHorizontally, getHorizontalFacingDirection,
  getEnemyHardwareSpriteSource, getPongBallHardwareSpriteSource, isRuntimeHudHidden, getPlayerBulletSlotCount,
  usesControl2Players, resolvePushBoxHardwareSpriteLayer,
  MSX2_ENEMY_SPRITE_COLOR,
  MSX2_ENEMY_SPRITE_PATTERN, MSX2_PLAYER_BULLET_PATTERN,
  MSX2_ENEMY_BULLET_PATTERN, MSX2_PONG_BALL_PATTERN,
  MSX2_ENEMY_BULLET_HARDWARE_SLOTS,
} from '../msx2Screen4Generator';
import { MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN } from '../msx2EntityRuntimeGenerator';
import { ProjectAnalysis } from '../../../../asmTemplateGenerator';
import { V2Options } from './types';

function sanitizeLabel(name: string | undefined, fallback: string): string {
  if (!name) return fallback;
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .substring(0, 64) || fallback;
}

function rolePatternSlotCount(uniqueFrameCount: number, layerCount: number, mirrored: boolean): number {
  return uniqueFrameCount * layerCount * (mirrored ? 2 : 1);
}

export function generateSpriteData(analysis: ProjectAnalysis, layout: SpriteLayout, options: V2Options): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';

  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const color = layout.color;
  const enemySprite = getEnemyHardwareSpriteSource(analysis);
  const enemySpriteLayer = enemySprite
    ? buildHardwareSpriteLayersForFrame(enemySprite, MSX2_ENEMY_SPRITE_COLOR, 0)[0]
    : undefined;
  const control2Players = usesControl2Players(analysis);
  const enemyHorizontalFacing = !control2Players && enemySprite ? getHorizontalFacingDirection(enemySprite) : undefined;
  const enemyMirroredPattern = enemyHorizontalFacing && enemySpriteLayer
    ? mirrorHardwareSpritePatternHorizontally(enemySpriteLayer.pattern)
    : undefined;
  const pongBallSprite = control2Players ? getPongBallHardwareSpriteSource(analysis) : undefined;
  const pongBallSpriteLayer = pongBallSprite
    ? buildHardwareSpriteLayersForFrame(pongBallSprite, color, 0)[0]
    : undefined;
  const hideHud = isRuntimeHudHidden(analysis);
  const playerBulletSlotCount = getPlayerBulletSlotCount(analysis);
  const pushBoxLayer = options.pushBoxEnabled
    ? resolvePushBoxHardwareSpriteLayer(analysis, options.tileScreens || [])
    : undefined;

  if (layout.hasPlayerAnimRoles && (layout.idle || layout.walk)) {
    return generateMultiRoleSpriteData(
      analysis,
      layout,
      settings,
      color,
      enemySpriteLayer,
      enemyHorizontalFacing,
      enemyMirroredPattern,
      control2Players,
      pongBallSpriteLayer,
      pushBoxLayer,
      hideHud,
      playerBulletSlotCount
    );
  }

  return generateSingleSpriteData(
    layout,
    sprite,
    color,
    enemySpriteLayer,
    enemyHorizontalFacing,
    enemyMirroredPattern,
    control2Players,
    pongBallSpriteLayer,
    pushBoxLayer,
    hideHud,
    playerBulletSlotCount
  );
}

function generateSingleSpriteData(
  layout: SpriteLayout,
  sprite: NonNullable<ReturnType<typeof getHardwareSpriteSource>>,
  color: number,
  enemySpriteLayer: any,
  enemyHorizontalFacing: 'left' | 'right' | undefined,
  enemyMirroredPattern: number[] | undefined,
  control2Players: boolean,
  pongBallSpriteLayer: any,
  pushBoxLayer: any,
  hideHud: boolean,
  playerBulletSlotCount: number
): string {
  const layers = layout.layers;
  const frameCount = layout.frameCount;
  const frameLayerSets = Array.from({ length: frameCount }, (_unused, fi) => {
    const fl = clampHardwareSpriteCount(buildHardwareSpriteLayersForFrame(sprite, color, fi)).slice(0, layers.length);
    return layers.map((fb, li) => fl[li] || fb);
  });
  const mirroredSets = layout.horizontalFacing
    ? frameLayerSets.map(fls => fls.map(l => ({ ...l, pattern: mirrorHardwareSpritePatternHorizontally(l.pattern) })))
    : [];

  const basePI = layout.basePatternIndex;
  const enemyPI = basePI + layout.playerPatternCount;
  const pbPI = enemyPI + layout.enemyPatternVariantCount;
  const ebPI = pbPI + 1;
  const pushPI = ebPI + 1;

  const visAttr = layers.flatMap((layer, li) => [
    layout.visible ? (layout.initY + layer.yOffset) : 208,
    layout.initX + layer.xOffset,
    basePI + li,
    0,
  ]);
  const enemyAttr = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, () => [208, 0, enemyPI, 0]).flat();
  const pbAttr = Array.from({ length: playerBulletSlotCount }, () => [208, 0, pbPI, 0]).flat();
  const ebAttr = [208, 0, ebPI, 0];
  const hudLife = hideHud ? [] : Array.from({ length: 3 }, (_, i) => [208, 8 + i * 10, ebPI, 0]).flat();
  const terminator = [208, 0, 0, 0];
  const attrs = [...visAttr, ...enemyAttr, ...pbAttr, ...ebAttr, ...hudLife, ...terminator];

  return `
msx2_hw_sprite_patterns:
${frameLayerSets.map((fls, fi) => fls.map((l, li) =>
  formatBytes(`msx2_hw_sprite_frame_${fi}_pattern_${li}`, l.pattern, `msprite frame ${fi} part ${li}`)
).join('')).join('')}${mirroredSets.map((fls, fi) => fls.map((l, li) =>
  formatBytes(`msx2_hw_sprite_frame_${fi}_mirror_pattern_${li}`, l.pattern, `Mirrored msprite frame ${fi} part ${li}`)
).join('')).join('')}${fmtEnemyPattern(enemySpriteLayer, enemyHorizontalFacing, enemyMirroredPattern)}
${fmtBulletPatterns(control2Players, pongBallSpriteLayer, pushBoxLayer)}
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
${layers.map((l, i) => formatBytes(`msx2_hw_sprite_colors_${i}`, l.colors, `Colors layer ${i}`)).join('')}
${fmtEnemyColors(enemySpriteLayer, playerBulletSlotCount, control2Players, pongBallSpriteLayer, pushBoxLayer, hideHud)}
msx2_hw_sprite_colors_end:

${formatBytes('msx2_hw_sprite_attrs', attrs, `${layers.length} player, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} enemy, ${playerBulletSlotCount} pb, ${MSX2_ENEMY_BULLET_HARDWARE_SLOTS} eb${hideHud ? '' : ', 3 hud'}`)}
`;
}

function generateMultiRoleSpriteData(
  _analysis: ProjectAnalysis,
  layout: SpriteLayout,
  _settings: ReturnType<typeof getHardwareSpriteRuntimeSettings>,
  color: number,
  enemySpriteLayer: any,
  enemyHorizontalFacing: 'left' | 'right' | undefined,
  enemyMirroredPattern: number[] | undefined,
  control2Players: boolean,
  pongBallSpriteLayer: any,
  pushBoxLayer: any,
  hideHud: boolean,
  playerBulletSlotCount: number
): string {
  const rolesFromLayout: Array<{ name: string; rl: RoleLayout }> = [];
  if (layout.idle) rolesFromLayout.push({ name: 'idle', rl: layout.idle });
  if (layout.walk) rolesFromLayout.push({ name: 'walk', rl: layout.walk });

  const primaryLayers = layout.idle?.layers || layout.walk?.layers || layout.layers;
  let patternAsm = '';
  const frameMapAsm: string[] = [];

  for (const { name, rl } of rolesFromLayout) {
    const spriteForRole = rl.sprite;
    const roleLayers = rl.layers;
    const uniqueFrameIndices = rl.uniqueFrameIndices;
    const effectiveFacing = rl.facingDirection;

    const frameLayerSets = uniqueFrameIndices.map(fi => {
      const fl = clampHardwareSpriteCount(buildHardwareSpriteLayersForFrame(spriteForRole, color, fi)).slice(0, roleLayers.length);
      return roleLayers.map((fallback, li) => fl[li] || fallback);
    });
    const mirrorLayerSets = effectiveFacing
      ? frameLayerSets.map(fls => fls.map(l => ({
        ...l,
        pattern: mirrorHardwareSpritePatternHorizontally(l.pattern),
      })))
      : [];

    const roleLabel = sanitizeLabel(name, 'role');
    for (let fi = 0; fi < frameLayerSets.length; fi++) {
      const spriteFrameIndex = uniqueFrameIndices[fi];
      for (let li = 0; li < frameLayerSets[fi].length; li++) {
        patternAsm += formatBytes(
          `msx2_hw_${roleLabel}_f${spriteFrameIndex}_l${li}`,
          frameLayerSets[fi][li].pattern,
          `${roleLabel} sprite frame ${spriteFrameIndex} part ${li}`
        );
      }
    }
    if (mirrorLayerSets.length) {
      for (let fi = 0; fi < mirrorLayerSets.length; fi++) {
        const spriteFrameIndex = uniqueFrameIndices[fi];
        for (let li = 0; li < mirrorLayerSets[fi].length; li++) {
          patternAsm += formatBytes(
            `msx2_hw_${roleLabel}_mirror_f${spriteFrameIndex}_l${li}`,
            mirrorLayerSets[fi][li].pattern,
            `Mirrored ${roleLabel} sprite frame ${spriteFrameIndex} part ${li}`
          );
        }
      }
    }

    const physicalFrames = rl.frames.map(f => uniqueFrameIndices.indexOf(f));
    frameMapAsm.push(`${rl.frameMapLabel}:\n    DB ${physicalFrames.join(', ')}\n`);
  }

  const basePI = layout.basePatternIndex;
  const enemyPI = basePI + layout.playerPatternCount;
  const pbPI = enemyPI + layout.enemyPatternVariantCount;
  const ebPI = pbPI + 1;

  const visAttr = primaryLayers.flatMap((layer, li) => [
    layout.visible ? (layout.initY + layer.yOffset) : 208,
    layout.initX + layer.xOffset,
    basePI + li,
    0,
  ]);
  const enemyAttr = Array.from({ length: MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN }, () => [208, 0, enemyPI, 0]).flat();
  const pbAttr = Array.from({ length: playerBulletSlotCount }, () => [208, 0, pbPI, 0]).flat();
  const ebAttr = [208, 0, ebPI, 0];
  const hudLife = hideHud ? [] : Array.from({ length: 3 }, (_, i) => [208, 8 + i * 10, ebPI, 0]).flat();
  const terminator = [208, 0, 0, 0];
  const attrs = [...visAttr, ...enemyAttr, ...pbAttr, ...ebAttr, ...hudLife, ...terminator];

  return `
msx2_hw_sprite_patterns:
${patternAsm}${fmtEnemyPattern(enemySpriteLayer, enemyHorizontalFacing, enemyMirroredPattern)}
${fmtBulletPatterns(control2Players, pongBallSpriteLayer, pushBoxLayer)}
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
${primaryLayers.map((l, i) => formatBytes(`msx2_hw_sprite_colors_${i}`, l.colors, `Colors layer ${i}`)).join('')}
${fmtEnemyColors(enemySpriteLayer, playerBulletSlotCount, control2Players, pongBallSpriteLayer, pushBoxLayer, hideHud)}
msx2_hw_sprite_colors_end:

; Frame map tables (anim frame → unique frame index within role sprite blob)
${frameMapAsm.join('')}
${formatBytes('msx2_hw_sprite_attrs', attrs, `${primaryLayers.length} player, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} enemy, ${playerBulletSlotCount} pb, ${MSX2_ENEMY_BULLET_HARDWARE_SLOTS} eb${hideHud ? '' : ', 3 hud'}`)}
`;
}

function fmtEnemyPattern(el: any, ehf: any, emp: any): string {
  let s = formatBytes('msx2_hw_enemy_sprite_pattern', el?.pattern || MSX2_ENEMY_SPRITE_PATTERN, 'Enemy 16x16 pattern');
  if (emp) s += formatBytes('msx2_hw_enemy_sprite_mirror_pattern', emp, `Mirrored enemy ${ehf}`);
  return s;
}

function fmtBulletPatterns(c2p: boolean, pbsl: any, pbl: any): string {
  const pb = c2p ? (pbsl?.pattern || MSX2_PONG_BALL_PATTERN) : MSX2_PLAYER_BULLET_PATTERN;
  let s = formatBytes('msx2_hw_player_bullet_pattern', pb, 'Player bullet 16x16');
  s += formatBytes('msx2_hw_enemy_bullet_pattern', MSX2_ENEMY_BULLET_PATTERN, 'Enemy bullet 16x16');
  if (pbl) s += formatBytes('msx2_hw_push_box_sprite_pattern', pbl.pattern, 'Push box 16x16');
  return s;
}

function fmtEnemyColors(el: any, pbs: number, c2p: boolean, pbsl: any, pbl: any, hh: boolean): string {
  let s = '';
  for (let i = 0; i < MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN; i++) {
    s += formatBytes(`msx2_hw_enemy_sprite_colors_${i}`,
      el?.colors || Array(16).fill(MSX2_ENEMY_SPRITE_COLOR), `Enemy colors ${i}`);
  }
  for (let i = 0; i < pbs; i++) {
    s += formatBytes(`msx2_hw_player_bullet_colors${i === 0 ? '' : `_${i}`}`,
      c2p ? (pbsl?.colors || Array(16).fill(15)) : Array(16).fill(6), `Bullet colors ${i}`);
  }
  s += formatBytes('msx2_hw_enemy_bullet_colors', Array(16).fill(8), 'Enemy bullet colors');
  if (pbl) s += formatBytes('msx2_hw_push_box_sprite_colors', pbl.colors, 'Push box colors');
  if (!hh) {
    for (let i = 0; i < 3; i++) {
      s += formatBytes(`msx2_hw_hud_life_colors_${i}`, Array(16).fill(10), `HUD life ${i + 1}`);
    }
  }
  return s;
}

export { rolePatternSlotCount };
