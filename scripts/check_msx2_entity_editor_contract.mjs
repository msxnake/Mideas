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
  ['entity creation palette replaces tile palette in entities mode', source.includes('Panel title="Create Entity"') && source.includes("mode !== 'entities'") && source.includes('DEFAULT_MSX2_ENTITY_CREATE_PRESETS')],
  ['entity creation presets include core MSX2 actors', source.includes("id: 'player'") && source.includes("id: 'ghost_maze'") && source.includes("id: 'patrol_x'") && source.includes("id: 'door'")],
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
  ['copy paste uses active or selected area crop', source.includes('activeEditRect.y + y') && source.includes('activeEditRect.x + x') && source.includes('pasteWidth') && source.includes('pasteHeight')],
  ['selection tools panel exists', source.includes('Panel title="Selection Tools"') && source.includes('Select Area') && source.includes('Fill') && source.includes('Clear')],
  ['selection rect is rendered in grid', source.includes('selectionRect.x * TILE_SIZE * 2') && source.includes('selectionRect.width * TILE_SIZE * 2')],
  ['variable tile dimensions controls exist', source.includes('MSX2_TILE_DIMENSION_OPTIONS') && source.includes('aria-label="MSX2 tile width"') && source.includes('aria-label="MSX2 tile height"')],
  ['variable tile dimensions are normalized to multiples of 8', source.includes('Math.round(numeric / 8) * 8') && source.includes('Math.max(8, Math.min(32')],
  ['tile list shows visual previews', source.includes('Msx2TilePreview') && source.includes('MSX2 tile ${tile.name} preview')],
  ['tile editor exposes MSX2 palette swatches', source.includes('aria-label="MSX2 tile palette"') && source.includes('aria-label={`MSX2 paint slot ${slot.slotIndex}`}')],
  ['tile editor exposes fill and transform tools', [
    'aria-label="MSX2 fill tile"',
    'aria-label="MSX2 flip tile horizontal"',
    'aria-label="MSX2 flip tile vertical"',
    'aria-label="MSX2 shift tile left"',
    'aria-label="MSX2 shift tile up"',
    'aria-label="MSX2 shift tile right"',
    'aria-label="MSX2 shift tile down"',
  ].every((needle) => source.includes(needle))],
  ['tile editor exposes paint modes', [
    'aria-label="MSX2 tile paint tools"',
    'aria-label={`MSX2 tile tool ${tool}`}',
    "Msx2Screen5TilePaintTool = 'pencil' | 'erase' | 'fill' | 'pick'",
    "paintTool === 'fill'",
    "paintTool === 'pick'",
  ].every((needle) => source.includes(needle))],
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
