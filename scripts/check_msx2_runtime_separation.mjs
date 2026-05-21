#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const msx2Generator = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5Generator.ts');
const msx2EntityRuntime = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2EntityRuntimeGenerator.ts');
const msx2Catalog = read('components', 'msx2_screen5_editor', 'msx2EntityCatalog.ts');
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
    'MSX2 native catalog owns component and entity repertoires',
    msx2Catalog.includes('MSX2_COMPONENT_REPERTOIRE') &&
      msx2Catalog.includes('MSX2_ENTITY_REPERTOIRE') &&
      msx2Catalog.includes("runtime: 'MSX2'"),
  ],
  [
    'Defaults expose MSX2 components only through explicit MSX2 target',
    defaults.includes('DEFAULT_MSX2_COMPONENT_DEFINITIONS') &&
      defaults.includes('MSX2_COMPONENT_REPERTOIRE.map') &&
      defaults.includes("target: 'MSX2'") &&
      !/DEFAULT_ENTITY_TEMPLATES[\s\S]*?target:\s*['"]MSX2['"]/.test(defaults),
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
    ].every(token => msx2Catalog.includes(token)),
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
