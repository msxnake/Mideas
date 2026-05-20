#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const editorPath = join(repoRoot, 'components', 'editors', 'Msx2Screen5TileScreenEditor.tsx');
const partsPath = join(repoRoot, 'components', 'msx2_screen5_editor', 'Msx2Screen5EditorParts.tsx');
const source = [
  readFileSync(editorPath, 'utf8'),
  readFileSync(partsPath, 'utf8'),
].join('\n');

const checks = [
  ['single Entity Properties panel', (source.match(/Panel title="Entity Properties"/g) || []).length === 1],
  ['Behavior mode button exists', (source.includes("setMode('behavior')") || source.includes("layerButton('behavior'")) && source.includes("'Behavior'")],
  ['Entities mode button exists', (source.includes("setMode('entities')") || source.includes("layerButton('entities'")) && source.includes("'Entities'")],
  ['entity kind options include enemy', source.includes('<option value="enemy">Enemy</option>')],
  ['movement options include patrol X/Y', source.includes('<option value="patrolX">Patrol X</option>') && source.includes('<option value="patrolY">Patrol Y</option>')],
  ['entity tile coordinate labels exist', source.includes('>Tile X</span>') && source.includes('>Tile Y</span>')],
  ['automation labels exist for core controls', [
    'aria-label="MSX2 screen name"',
    'aria-label="MSX2 effect code"',
    'aria-label="MSX2 behavior code"',
    'aria-label="MSX2 required collectibles"',
    'aria-label="MSX2 initial air"',
    'aria-label="Entity name"',
    'aria-label="Entity kind"',
    'aria-label="Entity movement"',
  ].every((needle) => source.includes(needle))],
  ['patrol X labels exist', source.includes('>Min X</span>') && source.includes('>Max X</span>')],
  ['patrol Y labels exist', source.includes('>Min Y</span>') && source.includes('>Max Y</span>')],
  ['patrol X edits only X bounds', source.includes("selectedEntity.params.movement === 'patrolX'") && source.includes('aria-label="Patrol min X"') && source.includes('aria-label="Patrol max X"')],
  ['patrol Y edits only Y bounds', source.includes('aria-label="Patrol min Y"') && source.includes('aria-label="Patrol max Y"')],
  ['active area clamps width and height to origin', source.includes('MAP_WIDTH - activeAreaX') && source.includes('MAP_HEIGHT - activeAreaY') && source.includes('MAP_WIDTH - x') && source.includes('MAP_HEIGHT - y')],
  ['copy paste uses active area crop', source.includes('runtime.activeAreaY + y') && source.includes('runtime.activeAreaX + x') && source.includes('pasteWidth') && source.includes('pasteHeight')],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}

if (failures.length) {
  console.error(`\nMSX2 entity editor contract failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log('\nMSX2 entity editor contract passed.');
