/**
 * Validate that canonical MSX 2D templates are connected to the ASM pipeline.
 */

import fs from 'fs';

const defaults = fs.readFileSync('data/defaults.ts', 'utf8');
const analyzer = fs.readFileSync('utils/msxGenerator/utils/componentAnalyzer.ts', 'utf8');
const componentsGenerator = fs.readFileSync('utils/msxGenerator/generators/componentsGenerator.ts', 'utf8');
const entitiesGenerator = fs.readFileSync('utils/msxGenerator/generators/entitiesGenerator.ts', 'utf8');

const canonicalTemplates = [
  'tpl_msx_platform_player',
  'tpl_msx_topdown_player',
  'tpl_msx_shooter_player',
  'tpl_msx_projectile',
  'tpl_msx_basic_patrol_enemy',
];

const expectedRuntimeSymbols = {
  comp_pos: 'generatePositionSystem',
  comp_render: 'generateSpriteSystem',
  comp_physics: 'generateMovementSystem',
  comp_collision: 'generateCollisionSystem',
  comp_wall_collision: 'generateWallCollisionSystem',
  comp_player_input: 'generateInputSystem',
  comp_cursors: 'generateCursorsSystem',
  comp_gravity: 'generateGravitySystem',
  comp_jump: 'generateJumpSystem',
  comp_air_control: 'generateAirControlHelpers',
  comp_wall_grab: 'generateWallGrabSystem',
  comp_wall_jump: 'generateWallJumpSystem',
  comp_deadly_tiles: 'generateDeadlyTilesSystem',
  comp_tile_collector: 'generateTileInteractionSystem',
  comp_health: 'generateHealthSystem',
  comp_damage: 'generateDamageSystem',
  comp_shoot: 'generateShootSystem',
  comp_lifetime: 'generateAutoDestroySystem',
  comp_patrol: 'Patrol',
  comp_animation: 'generateAnimationSystem',
  comp_statemachine: 'statemachine',
};

const expectedEntityInitRefs = [
  'comp_wall_collision',
  'comp_lifetime',
  'comp_damage',
  'comp_shoot',
  'comp_wall_jump',
  'comp_wall_grab',
  'comp_air_control',
];

function getTemplateBlock(templateId) {
  const marker = `id: "${templateId}"`;
  const start = defaults.indexOf(marker);
  if (start === -1) return null;

  const nextTemplate = defaults.indexOf('\n  {\n    id: "tpl_', start + marker.length);
  const listEnd = defaults.indexOf('\n];', start + marker.length);
  const end = nextTemplate === -1 ? listEnd : Math.min(nextTemplate, listEnd);

  return defaults.slice(start, end);
}

const failures = [];
const usedComponentIds = new Set();

for (const templateId of canonicalTemplates) {
  const block = getTemplateBlock(templateId);
  if (!block) {
    failures.push(`Missing canonical template ${templateId}`);
    continue;
  }

  for (const match of block.matchAll(/definitionId:\s*"([^"]+)"/g)) {
    usedComponentIds.add(match[1]);
  }
}

for (const componentId of usedComponentIds) {
  if (!analyzer.includes(`'${componentId}'`)) {
    failures.push(`${componentId} is used by canonical templates but is not mapped by componentAnalyzer`);
  }

  const runtimeSymbol = expectedRuntimeSymbols[componentId];
  if (runtimeSymbol && !componentsGenerator.includes(runtimeSymbol)) {
    failures.push(`${componentId} expects runtime symbol ${runtimeSymbol}, but it was not found`);
  }
}

for (const componentId of expectedEntityInitRefs) {
  if (usedComponentIds.has(componentId) && !entitiesGenerator.includes(componentId)) {
    failures.push(`${componentId} is used but has no entity initialization reference`);
  }
}

const shooterBlock = getTemplateBlock('tpl_msx_shooter_player') || '';
const projectileBlock = getTemplateBlock('tpl_msx_projectile') || '';
const patrolBlock = getTemplateBlock('tpl_msx_basic_patrol_enemy') || '';

if (!shooterBlock.includes('spriteAssetId: "placeholder_sprite_bullet"')) {
  failures.push('tpl_msx_shooter_player must point Shoot.spriteAssetId to placeholder_sprite_bullet');
}

if (!projectileBlock.includes('definitionId: "comp_lifetime"')) {
  failures.push('tpl_msx_projectile must include Lifetime for projectile expiry');
}

if (!patrolBlock.includes('definitionId: "comp_patrol"')) {
  failures.push('tpl_msx_basic_patrol_enemy must include Patrol for AI validation');
}

if (failures.length > 0) {
  console.error('MSX 2D ROM contract validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('MSX 2D ROM contract validation passed');
