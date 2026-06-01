#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const msx2Generator = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen4Generator.ts');
const msx2EntityRuntime = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2EntityRuntimeGenerator.ts');
const msx2ShooterRuntime = read('utils', 'msx2ShooterRuntime.ts');
const msx2Catalog = read('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const msxGeneratorIndex = read('utils', 'msxGenerator', 'index.ts');
const defaults = read('data', 'defaults.ts');

const forbiddenInMsx2Runtime = [
  'DEFAULT_COMPONENT_DEFINITIONS',
  'DEFAULT_ENTITY_TEMPLATES',
  'componentsGenerator',
  'entitiesGenerator',
  'componentAnalyzer',
];

const checks = [
  [
    'MSX2 generator does not import legacy ECS defaults or generators',
    forbiddenInMsx2Runtime.every(token => !msx2Generator.includes(token)),
  ],
  [
    'MSX2 entity runtime helper does not import legacy ECS defaults or generators',
    forbiddenInMsx2Runtime.every(token => !msx2EntityRuntime.includes(token)),
  ],
  [
    'MSX2 generator dispatcher returns only SCREEN 4 backend',
    msxGeneratorIndex.includes("export type GraphicsBackend = 'screen2-tilebank' | 'msx2-screen4-pattern'") &&
      msxGeneratorIndex.includes("type LegacyGraphicsBackend = 'msx2-screen5-bitmap' | 'msx2-screen5-tile16'") &&
      !msxGeneratorIndex.includes("targetGraphicsBackend === 'msx2-screen4-pattern' || targetGraphicsBackend === 'msx2-screen5-bitmap'") &&
      msxGeneratorIndex.includes("config.screenMode === 'SCREEN 4 (Graphics II)' || config.screenMode === 'SCREEN 5 (Graphics III)'"),
  ],
  [
    'MSX2 native catalog owns component and entity repertoires',
    msx2Catalog.includes('MSX2_COMPONENT_REPERTOIRE') &&
      msx2Catalog.includes('MSX2_ENTITY_REPERTOIRE') &&
      msx2Catalog.includes("runtime: 'MSX2'"),
  ],
  [
    'Defaults expose MSX2 components and entity templates only through explicit MSX2 target',
    defaults.includes('DEFAULT_MSX2_COMPONENT_DEFINITIONS') &&
      defaults.includes('MSX2_COMPONENT_REPERTOIRE.map') &&
      defaults.includes('DEFAULT_MSX2_ENTITY_TEMPLATES') &&
      defaults.includes('MSX2_ENTITY_REPERTOIRE.map') &&
      defaults.includes('buildMsx2EntityComponents(preset, 0, 0)') &&
      defaults.includes("target: 'MSX2'") &&
      defaults.includes('...DEFAULT_MSX2_ENTITY_TEMPLATES'),
  ],
  [
    'MSX2 runtime reads native component bags',
    msx2EntityRuntime.includes("components?.[componentId]") &&
      msx2EntityRuntime.includes("'msx2_movement'") &&
      msx2EntityRuntime.includes("'msx2_ai'"),
  ],
  [
    'MSX2 native component repertoire covers gameplay essentials',
    [
      'msx2_animation',
      'msx2_health',
      'msx2_damage',
      'msx2_spawn',
      'msx2_checkpoint',
      'msx2_screen_transition',
      'msx2_inventory',
      'msx2_score',
      'msx2_timer',
      'msx2_platform',
      'msx2_paddle',
      'msx2_ball',
      'msx2_brick',
      'msx2_char_render',
      'msx2_snake',
      'msx2_snake_segment',
    ].every(token => msx2Catalog.includes(token)),
  ],
  [
    'MSX2 native entity repertoire includes target simple-game families',
    [
      'player_maze',
      'player',
      'galaxian_player',
      'galaxian_alien_formation',
      'pong_paddle',
      'pong_ball',
      'arkanoid_brick',
      'snake_head',
      'snake_segment',
      'snake_food',
    ].every(token => msx2Catalog.includes(`id: '${token}'`)),
  ],
  [
    'MSX2 SCREEN 4 backend owns Snake char runtime without legacy ECS',
      msx2Generator.includes('usesSnakeCharMovement') &&
      msx2Generator.includes('buildSnakeCharRuntimeAsm') &&
      msx2Generator.includes('msx2_snake_head_x EQU #C030') &&
      msx2Generator.includes('MSX2_SNAKE_BODY_BASE = 0xC047') &&
      msx2Generator.includes('MSX2_EFFECT_RUNTIME_BASE = MSX2_SNAKE_BODY_BASE + (MSX2_SNAKE_MAX_BODY_CELLS * 2)') &&
      msx2Generator.includes('call update_msx2_snake_char'),
  ],
  [
    'MSX2 SCREEN 4 backend owns paddleHorizontal without shooter bullets',
    msx2Generator.includes('function usesPaddleHorizontalMovement') &&
      msx2Generator.includes("mode === 'paddlehorizontal'") &&
      msx2Generator.includes('update_hardware_sprite_input_paddle_horizontal') &&
      msx2Generator.includes("${paddleHorizontal ? '    jp update_hardware_sprite_input_paddle_horizontal\\n' : ''}") &&
      msx2Generator.includes('const shooterBulletsEnabled = shooterHorizontal || shooterVertical') &&
      msx2Generator.includes("${shooterBulletsEnabled ? '    call update_msx2_player_bullet\\n    call update_msx2_enemy_bullet\\n' : ''}"),
  ],
  [
    'MSX2 SCREEN 4 backend owns ballBounce hazard movement',
    msx2EntityRuntime.includes('MSX2_ENEMY_MOVEMENT_BALL_BOUNCE') &&
      msx2EntityRuntime.includes("movement === 'ballbounce'") &&
      msx2Generator.includes('MSX2_ENEMY_MOVEMENT_BALL_BOUNCE') &&
      msx2Generator.includes('signedRuntimeByte(enemies[index]?.dx)') &&
      msx2Generator.includes('function getPaddleCollisionSettings') &&
      msx2Generator.includes('ball_check_paddle') &&
      msx2Generator.includes('ball_miss_paddle') &&
      msx2Generator.includes('call msx2_apply_damage_respawn'),
  ],
  [
    'MSX2 SCREEN 4 backend maps brick entities to mutable effects',
    msx2Generator.includes("layerName === 'effects'") &&
      msx2Generator.includes('entity?.components?.msx2_brick') &&
      msx2Generator.includes('clear_msx2_effect_visual_at_pixel') &&
      msx2Generator.includes('ball_break_brick') &&
      msx2Generator.includes('call draw_msx2_collectible_hud'),
  ],
  [
    'MSX2 SCREEN 4 backend emits shooter 60Hz budget constants from screen.runtime.shooter',
    msx2Generator.includes('buildMsx2Shooter60HzConstantsAsm') &&
      msx2Generator.includes('getMsx2Shooter60HzBudgetFromAnalysis') &&
      msx2Generator.includes('shooter60HzConstantsAsm') &&
      msx2Generator.includes('shooterBudget?.budget.maxPlayerShots') &&
      msx2ShooterRuntime.includes('MSX2_SHOOTER60HZ_MAX_PLAYER_SHOTS EQU') &&
      msx2ShooterRuntime.includes('MSX2_SHOOTER60HZ_ACTIVE_IRQ_PROFILE EQU') &&
      msx2ShooterRuntime.includes('resolveMsx2Shooter60HzBudgetForGeneration'),
  ],
  [
    'MSX2 SCREEN 4 backend wires shooter 60Hz budget into runtime ASM',
    msx2Generator.includes('cp MSX2_SHOOTER60HZ_MAX_PLAYER_SHOTS') &&
      msx2Generator.includes('cp MSX2_SHOOTER60HZ_MAX_ENEMIES') &&
      msx2Generator.includes('shooter60HzContract'),
  ],
  [
    'MSX2 SCREEN 4 HUD contract is exported without legacy HUD coupling',
    msx2Generator.includes('msx2_screen_hud_style') &&
      msx2Generator.includes('msx2_screen_hud_primary_color') &&
      msx2Generator.includes('msx2_screen_hud_empty_color') &&
      msx2Generator.includes('Runtime drawing is intentionally data-driven work, not hardcoded bars') &&
      !msx2Generator.includes('VDP_REGISTER_PORT EQU #9B'),
  ],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}

if (failures.length) {
  console.error(`\nMSX2 runtime separation failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log('\nMSX2 runtime separation passed.');
