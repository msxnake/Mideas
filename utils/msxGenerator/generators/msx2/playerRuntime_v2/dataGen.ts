import { SpriteLayout, RoleLayout } from './types';
import {
  Msx2HardwareLayer, formatBytes,
  getHardwareSpriteSource, getHardwareSpriteRuntimeSettings,
  buildHardwareSpriteLayersForFrame, clampHardwareSpriteCount,
  mirrorHardwareSpritePatternHorizontally, getHorizontalFacingDirection,
  getPlayerAnimRoles, getMsx2PlayerUsesFlipX, getFallbackPlayerHorizontalFacing,
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

  const frameMapAsm = [layout.idle, layout.walk].filter(Boolean).map((rl: RoleLayout) => {
    // V2 pattern data is indexed by main-sprite frame (0..frameCount-1), not unique-role index.
    return `${rl.frameMapLabel}:\n    DB ${rl.frames.join(', ')}\n`;
  }).join('');

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

; Frame map tables (anim frame → main sprite frame index)
${frameMapAsm}
${formatBytes('msx2_hw_sprite_attrs', attrs, `${layers.length} player, ${MSX2_MAX_ENTITY_HAZARDS_PER_SCREEN} enemy, ${playerBulletSlotCount} pb, ${MSX2_ENEMY_BULLET_HARDWARE_SLOTS} eb${hideHud ? '' : ', 3 hud'}`)}
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
