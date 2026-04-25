/**
 * Generate minimal ASM fixtures for the canonical MSX 2D templates.
 *
 * This catches the class of regressions where a component exists in defaults
 * but the real ASM generator cannot process a minimal project that uses it.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const root = process.cwd();
const outDir = path.join(root, 'server', 'temp', 'tsbuild_msx2d');
const fixtureDir = path.join(root, 'test', 'fixtures', 'msx2d');
const asmOutDir = path.join(root, 'server', 'temp', 'msx2d_minimal');

function compileGeneratorToCommonJs() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const args = [
    ...(process.platform === 'win32' ? ['/c', 'npx'] : []),
    'tsc',
    'utils/msxGenerator/index.ts',
    'data/defaults.ts',
    '--target', 'ES2022',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--esModuleInterop',
    '--skipLibCheck',
    '--allowJs',
    '--jsx', 'react-jsx',
    '--outDir', outDir,
    '--noEmit', 'false',
  ];

  execFileSync(command, args, { cwd: root, stdio: 'pipe' });
}

function makeSprite(id, name, color) {
  const bg = '#000000';
  const frame = Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) =>
      x >= 4 && x < 12 && y >= 4 && y < 12 ? color : bg
    )
  );

  return {
    id,
    name,
    size: { width: 16, height: 16 },
    spritePalette: [bg, color, '#808080', '#FFFFFF'],
    backgroundColor: bg,
    frames: [{ id: `${id}_frame0`, data: frame }],
    currentFrameIndex: 0,
    hitbox: { width: 12, height: 12, offsetX: 2, offsetY: 2 },
  };
}

function makeScreen(id, entityTemplateId, x = 4, y = 10) {
  const emptyLayer = () => Array.from({ length: 24 }, () => Array.from({ length: 32 }, () => null));

  return {
    id,
    name: id,
    width: 32,
    height: 24,
    backgroundColor: 1,
    borderColor: 1,
    layers: {
      background: emptyLayer(),
      collision: emptyLayer(),
      effects: emptyLayer(),
      entities: [{
        id: `${id}_entity0`,
        name: `${entityTemplateId}_instance`,
        entityTemplateId,
        position: { x, y },
        componentOverrides: {},
      }],
    },
    activeAreaX: 0,
    activeAreaY: 0,
    activeAreaWidth: 32,
    activeAreaHeight: 24,
  };
}

function makeAssets(componentDefinitions, entityTemplates, screen) {
  const spriteIds = [
    ['placeholder_sprite_player', 'Player', '#FFFFFF'],
    ['placeholder_sprite_collector', 'Collector', '#00A0FF'],
    ['placeholder_sprite_player_ship', 'Ship', '#00FF00'],
    ['placeholder_sprite_bullet', 'Bullet', '#FFFF00'],
    ['placeholder_sprite_enemy', 'Enemy', '#FF4040'],
  ];

  return [
    ...componentDefinitions.map(component => ({
      id: component.id,
      name: component.name,
      type: 'componentdefinition',
      data: component,
    })),
    ...entityTemplates.map(template => ({
      id: template.id,
      name: template.name,
      type: 'entitytemplate',
      data: template,
    })),
    ...spriteIds.map(([id, name, color]) => ({
      id,
      name,
      type: 'sprite',
      data: makeSprite(id, name, color),
    })),
    {
      id: screen.id,
      name: screen.name,
      type: 'screenmap',
      data: screen,
    },
  ];
}

const projects = [
  {
    name: 'msx2d_platform_minimal',
    templateId: 'tpl_msx_platform_player',
    symbols: ['update_wallcollision_component', 'update_gravity_component', 'update_jump_component', 'update_walljump_component'],
  },
  {
    name: 'msx2d_topdown_minimal',
    templateId: 'tpl_msx_topdown_player',
    symbols: ['update_cursors_component', 'check_tile_interaction', 'update_wallcollision_component'],
  },
  {
    name: 'msx2d_shooter_minimal',
    templateId: 'tpl_msx_shooter_player',
    symbols: ['update_cursors_component', 'update_shoot_component'],
  },
  {
    name: 'msx2d_projectile_minimal',
    templateId: 'tpl_msx_projectile',
    symbols: ['update_auto_destroy_component', 'update_damage_component'],
  },
  {
    name: 'msx2d_patrol_enemy_minimal',
    templateId: 'tpl_msx_basic_patrol_enemy',
    symbols: ['update_entity_patrol_facing', 'update_damage_component', 'update_wallcollision_component'],
  },
];

compileGeneratorToCommonJs();

const require = createRequire(import.meta.url);
const { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } = require('../server/temp/tsbuild_msx2d/data/defaults.js');
const { generateModularASM } = require('../server/temp/tsbuild_msx2d/utils/msxGenerator/index.js');

fs.mkdirSync(fixtureDir, { recursive: true });
fs.mkdirSync(asmOutDir, { recursive: true });

const failures = [];

for (const project of projects) {
  const screen = makeScreen(`${project.name}_screen`, project.templateId);
  const assets = makeAssets(DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES, screen);
  const projectJson = {
    name: project.name,
    assets,
    componentDefinitions: DEFAULT_COMPONENT_DEFINITIONS,
    entityTemplates: DEFAULT_ENTITY_TEMPLATES,
    screenMaps: [screen],
  };

  fs.writeFileSync(path.join(fixtureDir, `${project.name}.json`), JSON.stringify(projectJson, null, 2), 'utf8');

  let files;
  try {
    files = generateModularASM(project.name, assets, {
      generateUnified: true,
      romMode: 'simple32k',
      targetFormat: 'konami',
      autoMegaROM: false,
      interruptDrivenComponents: false,
    });
  } catch (error) {
    failures.push(`${project.name}: generator threw ${error.message}`);
    continue;
  }

  const unified = files['unitedFiles.asm'] || '';
  fs.writeFileSync(path.join(asmOutDir, `${project.name}.asm`), unified, 'utf8');

  if (unified.length < 1000) {
    failures.push(`${project.name}: unified ASM is unexpectedly small (${unified.length} bytes)`);
  }

  for (const symbol of project.symbols) {
    if (!unified.includes(symbol)) {
      failures.push(`${project.name}: missing expected ASM symbol ${symbol}`);
    }
  }

  if (!Array.isArray(projectJson.stateMachines) && /\bcall\s+SM_Update\b/.test(unified)) {
    failures.push(`${project.name}: calls SM_Update without state machine assets`);
  }
}

if (failures.length > 0) {
  console.error('MSX 2D minimal generation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('MSX 2D minimal generation passed');
