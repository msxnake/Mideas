#!/usr/bin/env node
/**
 * Builds one visual-test project from Jordi's test600.json: takes the placed
 * `Enemy_test`, hands it to the scripted interpreter, and loads the project's
 * single behaviour asset with the preset named on the command line.
 *
 *   node test/msx2-behavior/make_visual_case.mjs <presetKey> <outFile>
 *
 * THE ENEMY IS NOT MOVED
 *   An earlier version of this script rewrote msx2_transform to reposition it.
 *   MEASURED: the generator ignores that entirely — asking for tile (4,10) and
 *   tile (12,10) both emitted the same X=#D0 Y=#80 in bitmap_room_enemy_table_1.
 *   Whatever owns the spawn position, it is not that component. Rather than
 *   fight it, the tests run on Jordi's own placement, which is what he wants
 *   judged anyway.
 *
 * WHY THE PATROL BOUNDS ARE FORCED
 *   The entity carries no minX/maxX. This exact system has already shipped a
 *   hardware bug where the bounds collapsed to the enemy's own X and WALK bailed
 *   out on the first tick, looking for all the world like a broken interpreter.
 *   Setting them explicitly removes that whole class of false result.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const SOURCE = 'C:/Users/salam/Downloads/test600.json';
const ROOM_NAME = 'Area51-test';
const ENEMY_ENTITY = 'Enemy_test';

const [presetKey, outFile] = process.argv.slice(2);
if (!presetKey || !outFile) {
  console.error('usage: make_visual_case.mjs <presetKey> <outFile>');
  process.exit(2);
}

const bundle = join(mkdtempSync(join(tmpdir(), 'mideas-visual-')), 'behavior.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2EnemyBehavior.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'silent',
});
const { MSX2_ENEMY_BEHAVIOR_PRESETS, bakeEnemyBehavior } = await import(pathToFileURL(bundle).href);

const preset = MSX2_ENEMY_BEHAVIOR_PRESETS.find(entry => entry.key === presetKey);
if (!preset) {
  console.error(`unknown preset "${presetKey}". Available: ${MSX2_ENEMY_BEHAVIOR_PRESETS.map(p => p.key).join(', ')}`);
  process.exit(2);
}

const project = JSON.parse(readFileSync(SOURCE, 'utf8'));
const assets = project.assets || [];

const behaviorAsset = assets.find(asset => asset.type === 'msx2enemybehavior');
if (!behaviorAsset) throw new Error('the project has no msx2enemybehavior asset');
const built = preset.build();
behaviorAsset.name = `Visual test — ${preset.label}`;
Object.assign(behaviorAsset.data, built);

// Bake here too, so a broken preset fails in this script instead of turning
// into an enemy standing still in the emulator for reasons nobody can see.
const baked = bakeEnemyBehavior({ id: behaviorAsset.id, name: behaviorAsset.name, ...built });
if (baked.errors.length) throw new Error(`preset "${presetKey}" does not bake: ${baked.errors.join('; ')}`);

const room = assets.find(asset => asset.name === ROOM_NAME);
if (!room) throw new Error(`room "${ROOM_NAME}" not found`);
const entity = (room.data.entities || []).find(item => item.name === ENEMY_ENTITY);
if (!entity) throw new Error(`entity "${ENEMY_ENTITY}" not found in ${ROOM_NAME}`);

entity.params = {
  ...entity.params,
  engine: 'scripted',
  movement: 'scripted',
  behaviorAssetId: behaviorAsset.id,
  logicUpdateIntervalFrames: built.logicIntervalFrames,
};
entity.components.msx2_movement = {
  ...entity.components.msx2_movement,
  mode: 'scripted',
  speed: built.speedPxPerTick,
  direction: -1,                 // start walking left, into the open floor
  minX: 16, maxX: 232, minY: 16, maxY: 176,
  boundsUnit: 'px',
};
const enemyAsset = assets.find(asset => asset.id === entity.params.enemyAssetId);
if (enemyAsset?.data) enemyAsset.data.logicUpdateIntervalFrames = built.logicIntervalFrames;
entity.components.msx2_ai = {
  ...entity.components.msx2_ai,
  behaviorAssetId: behaviorAsset.id,
  logicUpdateIntervalFrames: built.logicIntervalFrames,
};

project.name = `test600_${presetKey}`;
writeFileSync(outFile, JSON.stringify(project));
console.log(`${presetKey}: ${built.states.length} state(s), ${baked.bytes.length} program bytes, warnings=${baked.warnings.length}`);
for (const warning of baked.warnings) console.log(`  warn: ${warning}`);
