/**
 * Validate that canonical MSX 2D templates are connected to the ASM pipeline.
 */

import fs from 'fs';

const defaults = fs.readFileSync('data/defaults.ts', 'utf8').replace(/\r\n/g, '\n');
const analyzer = fs.readFileSync('utils/msxGenerator/utils/componentAnalyzer.ts', 'utf8');
const componentsGenerator = fs.readFileSync('utils/msxGenerator/generators/componentsGenerator.ts', 'utf8');
const entitiesGenerator = fs.readFileSync('utils/msxGenerator/generators/entitiesGenerator.ts', 'utf8');

const canonicalTemplates = [
  'tpl_msx_platform_player',
  'tpl_player_platform',
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
  comp_dash: 'player_fast_dash_process_c',
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
  comp_mirror: 'generateMirrorSystem',
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

if (!entitiesGenerator.includes('entity_dash_cfg_enabled')) {
  failures.push('entitiesGenerator must emit entity_dash_cfg_enabled so Player dash is per-entity gated');
}

if (!defaults.includes('id: "comp_mirror"')) {
  failures.push('defaults must expose comp_mirror as a reusable component');
}

if (!analyzer.includes("'comp_mirror': 'Mirror'")) {
  failures.push('componentAnalyzer must map comp_mirror to the Mirror runtime');
}

if (!componentsGenerator.includes('entity_mirror_flags') || !componentsGenerator.includes('update_mirror_component')) {
  failures.push('componentsGenerator must emit Mirror flags and update_mirror_component');
}

if (!entitiesGenerator.includes('entity_mirror_flags') || !entitiesGenerator.includes('comp_mirror')) {
  failures.push('entitiesGenerator must initialize per-entity Mirror flags from comp_mirror');
}

if (
  !componentsGenerator.includes('BEHAVIOR_TYPE_FOLLOW_PLAYER_X') ||
  !componentsGenerator.includes('BEHAVIOR_TYPE_WALK_X_WALL_TURN') ||
  !componentsGenerator.includes('behavior_turn_on_wall_d') ||
  !componentsGenerator.includes('behavior_distance_allows')
) {
  failures.push('Behavior runtime must expose built-in table-driven movement modes');
}

if (
  !entitiesGenerator.includes('entity_behavior_cfg_type') ||
  !entitiesGenerator.includes('entity_behavior_cfg_dir') ||
  !entitiesGenerator.includes('resolveBehaviorType')
) {
  failures.push('entitiesGenerator must emit per-entity Behavior config tables');
}

const dashRoutineIndex = componentsGenerator.indexOf('player_fast_dash_process_c:');
const dashConfigIndex = componentsGenerator.indexOf('entity_dash_cfg_enabled', dashRoutineIndex);
const dashInputIndex = componentsGenerator.indexOf('and INPUT_BTN_GRAB', dashRoutineIndex);
if (dashRoutineIndex === -1 || dashConfigIndex === -1 || dashInputIndex === -1 || dashConfigIndex > dashInputIndex) {
  failures.push('player_fast_dash_process_c must check entity_dash_cfg_enabled before consuming INPUT_BTN_GRAB');
}

if (analyzer.includes('Legacy runtime') || analyzer.includes('isLegacyDashPlayerTemplate')) {
  failures.push('componentAnalyzer must not infer Dash from legacy player template IDs; only comp_dash should enable Dash usage');
}

if (entitiesGenerator.includes('isLegacyDashPlayerTemplate')) {
  failures.push('entitiesGenerator must not enable entity_dash_cfg_enabled from legacy player template IDs');
}

const wallGrabChooseIndex = componentsGenerator.indexOf('wallgrab_choose_vertical_velocity_c:');
const wallGrabStopIndex = componentsGenerator.indexOf('.wg_stop_vertical:', wallGrabChooseIndex);
const wallGrabNotGrabbingIndex = componentsGenerator.indexOf('.not_grabbing:', wallGrabChooseIndex);
if (wallGrabChooseIndex === -1 || wallGrabStopIndex === -1 || wallGrabNotGrabbingIndex === -1) {
  failures.push('WallGrab vertical velocity chooser must include the stop-vertical path');
} else {
  const wallGrabChooseBody = componentsGenerator.slice(wallGrabChooseIndex, wallGrabNotGrabbingIndex);
  if (!wallGrabChooseBody.includes('jp .wg_stop_vertical') || !wallGrabChooseBody.includes('ld b, 0')) {
    failures.push('WallGrab must stop vertical velocity while N is held without UP/DOWN');
  }
}

const wallGrabInputIndex = componentsGenerator.indexOf('wallgrab_input_toward_wall_c:');
const wallGrabProbeIndex = componentsGenerator.indexOf('jp .wg_probe_adjacent_wall', wallGrabInputIndex);
const wallGrabFlagsIndex = componentsGenerator.indexOf('entity_wall_collision_flags', wallGrabInputIndex);
if (wallGrabInputIndex === -1 || wallGrabProbeIndex === -1 || wallGrabFlagsIndex === -1 || wallGrabProbeIndex > wallGrabFlagsIndex) {
  failures.push('WallGrab must prefer a fresh adjacent-wall probe before previous-frame wall flags');
}

const wallGrabProcessIndex = componentsGenerator.indexOf('wallgrab_process_entity_c:');
const wallGrabLockoutIndex = componentsGenerator.indexOf('entity_wallgrab_lockout', wallGrabProcessIndex);
const wallGrabGroundIndex = componentsGenerator.indexOf('entity_on_ground', wallGrabProcessIndex);
const wallGrabActiveBeforeGroundIndex = componentsGenerator.indexOf('entity_wallgrab_active', wallGrabProcessIndex);
const wallGrabAfterGroundLabelIndex = componentsGenerator.indexOf('.wallgrab_after_ground_check:', wallGrabProcessIndex);
if (
  wallGrabProcessIndex === -1 ||
  wallGrabActiveBeforeGroundIndex === -1 ||
  wallGrabGroundIndex === -1 ||
  wallGrabAfterGroundLabelIndex === -1 ||
  wallGrabLockoutIndex === -1 ||
  wallGrabActiveBeforeGroundIndex > wallGrabGroundIndex ||
  wallGrabAfterGroundLabelIndex > wallGrabLockoutIndex
) {
  failures.push('WallGrab must not let a transient on-ground flag reset the active grab timer before lockout processing');
}

const wallGrabTickIndex = componentsGenerator.indexOf('wallgrab_tick_timer_c:');
const wallGrabChooseAfterTickIndex = componentsGenerator.indexOf('wallgrab_choose_vertical_velocity_c:', wallGrabTickIndex);
if (wallGrabTickIndex === -1 || wallGrabChooseAfterTickIndex === -1) {
  failures.push('WallGrab must include a timer tick routine');
} else {
  const tickBody = componentsGenerator.slice(wallGrabTickIndex, wallGrabChooseAfterTickIndex);
  if (!tickBody.includes('dec (hl)') || !tickBody.includes('ld a, 1')) {
    failures.push('WallGrab timer tick must decrement and allow the final configured frame to run');
  }
  const afterDec = tickBody.slice(tickBody.indexOf('dec (hl)'), tickBody.indexOf('ld a, 1'));
  if (afterDec.includes('jp z, .wg_timer_expired')) {
    failures.push('WallGrab timer must not expire immediately after decrementing to zero');
  }
}

const wallGrabLoopIndex = componentsGenerator.indexOf('wallgrab_resolve_grab_loop_flag_c:');
const wallGrabRestoreIndex = componentsGenerator.indexOf('wallgrab_restore_base_sprite_c:', wallGrabLoopIndex);
if (wallGrabLoopIndex === -1 || wallGrabRestoreIndex === -1) {
  failures.push('WallGrab must include a grab animation loop resolver');
} else {
  const loopBody = componentsGenerator.slice(wallGrabLoopIndex, wallGrabRestoreIndex);
  for (const token of [
    'cp STICK_UP',
    'cp STICK_DOWN',
    'ld e, ANIM_FLAG_LOOP',
    'pop af',
  ]) {
    if (!loopBody.includes(token)) {
      failures.push(`WallGrab grab animation loop resolver missing "${token}"`);
    }
  }
  const commitBody = componentsGenerator.slice(componentsGenerator.indexOf('wallgrab_commit_grab_sprite_if_needed_c:'), wallGrabLoopIndex);
  const resolveCalls = [...commitBody.matchAll(/call wallgrab_resolve_grab_loop_flag_c/g)].map(match => match.index ?? -1);
  const commitCall = commitBody.indexOf('call wallgrab_commit_sprite_c');
  const refreshCall = commitBody.indexOf('call wallgrab_refresh_sprite_c');
  if (resolveCalls.length < 2 || commitCall === -1 || refreshCall === -1 || resolveCalls[0] > commitCall || resolveCalls[1] > refreshCall) {
    failures.push('WallGrab must resolve the grab loop flag before commit and refresh paths');
  }
}

const wallJumpProcessIndex = componentsGenerator.indexOf('walljump_process_entity_c:');
const wallJumpGroundIndex = componentsGenerator.indexOf('entity_on_ground', wallJumpProcessIndex);
const wallJumpDownFlagIndex = componentsGenerator.indexOf('bit 1, (hl)', wallJumpProcessIndex);
const wallJumpInputIndex = componentsGenerator.indexOf('input_btn_curr', wallJumpProcessIndex);
if (
  wallJumpProcessIndex === -1 ||
  wallJumpGroundIndex === -1 ||
  wallJumpDownFlagIndex === -1 ||
  wallJumpInputIndex === -1 ||
  wallJumpGroundIndex > wallJumpInputIndex ||
  wallJumpDownFlagIndex > wallJumpInputIndex
) {
  failures.push('WallJump must reject grounded/DOWN collision state before consuming the jump trigger');
}

const shooterBlock = getTemplateBlock('tpl_msx_shooter_player') || '';
const playerPlatformBlock = getTemplateBlock('tpl_player_platform') || '';
const projectileBlock = getTemplateBlock('tpl_msx_projectile') || '';
const patrolBlock = getTemplateBlock('tpl_msx_basic_patrol_enemy') || '';

if (!shooterBlock.includes('spriteAssetId: "placeholder_sprite_bullet"')) {
  failures.push('tpl_msx_shooter_player must point Shoot.spriteAssetId to placeholder_sprite_bullet');
}

for (const componentId of [
  'comp_pos',
  'comp_render',
  'comp_wall_collision',
  'comp_wall_grab',
  'comp_dash',
  'comp_jump',
  'comp_animation',
  'comp_cursors',
  'comp_statemachine',
  'comp_player_input',
  'comp_collision',
  'comp_gravity',
  'comp_tile_collector',
  'comp_deadly_tiles',
  'comp_health',
]) {
  if (!playerPlatformBlock.includes(`definitionId: "${componentId}"`)) {
    failures.push(`tpl_player_platform must include ${componentId}`);
  }
}

if (!projectileBlock.includes('definitionId: "comp_lifetime"')) {
  failures.push('tpl_msx_projectile must include Lifetime for projectile expiry');
}

if (!patrolBlock.includes('definitionId: "comp_patrol"')) {
  failures.push('tpl_msx_basic_patrol_enemy must include Patrol for AI validation');
}

if (componentsGenerator.includes("'update_cursors_component', '")) {
  failures.push('Cursors must not be scheduled as a second movement path; update_input_component owns cursor movement');
}

if (failures.length > 0) {
  console.error('MSX 2D ROM contract validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('MSX 2D ROM contract validation passed');
