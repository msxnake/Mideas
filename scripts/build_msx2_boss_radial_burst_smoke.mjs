#!/usr/bin/env node
/**
 * SCREEN 5 bitmap boss: RADIAL + BURST shoot-pattern smoke fixture.
 *
 * Takes the boss-definition smoke project and adds:
 *   - a `msx2shoot` asset with the pattern under test,
 *   - a `msx2bosspath` whose single node does nothing but fire it, on a `firing:
 *     'path'` path so the automatic cadence stays out of the way,
 *   - `bossPathId` on the boss definition so the boss actually follows it.
 *
 * Three builds, so the runtime claims can be told apart:
 *   (default)   radial, 4 bullets per wave, 3 waves 10 frames apart, speed 2.
 *               A wave of 4 through a small pool proves the ring walks; the
 *               burst proves the waves are staggered rather than simultaneous.
 *   --linear    one bullet straight down at speed 2. With normalised vectors
 *               that is exactly dx=0, dy=2 with no fraction.
 *   --diagonal  one bullet down-right (ring slot 6) at speed 2. THIS is the
 *               8.8 claim: 2 * sin(45deg) = 1.414, i.e. whole 1 and fraction
 *               106, where the old whole-pixel table gave a wrong 2,2.
 *
 * Usage: node scripts/build_msx2_boss_radial_burst_smoke.mjs [--linear|--diagonal]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-boss/fixture_boss_def.json');
const OUT_DIR = resolve(ROOT, 'test/msx2-boss');

const variant = process.argv.includes('--linear') ? 'linear'
  : process.argv.includes('--diagonal') ? 'diagonal'
    : 'radial';

const SHOOT_ID = 'shoot_smoke_ring';
const PATH_ID = 'bosspath_smoke_fire';

const SHOOTS = {
  // A ring of 4 (stride 16/4 = 4 ring slots = 90 degrees), fired as 3 waves.
  radial: {
    id: SHOOT_ID, name: 'Ring x4 burst x3',
    pattern: 'radial', bulletCount: 4, direction: 'down', speed: 2,
    burstCount: 3, burstInterval: 10,
  },
  // Straight down: ring slot 8, unit (0, +1), so speed 2 lands on exactly 0,2.
  linear: {
    id: SHOOT_ID, name: 'Straight down',
    pattern: 'linear', bulletCount: 1, direction: 'down', speed: 2,
    burstCount: 1, burstInterval: 8,
  },
  // Down-right: ring slot 6, unit (0.707, 0.707) -> 1 + 106/256 per axis.
  diagonal: {
    id: SHOOT_ID, name: 'Down-right diagonal',
    pattern: 'linear', bulletCount: 1, direction: 'downRight', speed: 2,
    burstCount: 1, burstInterval: 8,
  },
};

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
const assets = project.assets || (project.assets = []);

const bossAsset = assets.find(asset => asset.type === 'msx2boss');
if (!bossAsset) throw new Error('No msx2boss asset in the base project');

// Drop any previous run's assets so the script is idempotent.
project.assets = assets.filter(asset => asset.id !== SHOOT_ID && asset.id !== PATH_ID);

project.assets.push({
  id: SHOOT_ID,
  name: SHOOTS[variant].name,
  type: 'msx2shoot',
  data: SHOOTS[variant],
});

// One node, one action: fire. The boss barely moves, so the bullets are the
// only thing changing and the probe cannot mistake body motion for a shot.
project.assets.push({
  id: PATH_ID,
  name: 'Fire in place',
  type: 'msx2bosspath',
  data: {
    id: PATH_ID,
    name: 'Fire in place',
    speedPxPerTick: 2,
    loopMode: 'loop',
    firing: 'path',            // silences the phase cadence: only this node shoots
    nodes: [
      { id: 'n0', x: 64, y: 32, actions: [{ action: 'wait', frames: 90 }, { action: 'fire', shootId: SHOOT_ID }] },
      { id: 'n1', x: 68, y: 32, actions: [] },
    ],
  },
});

const params = bossAsset.data.params || (bossAsset.data.params = {});
params.bossPathId = PATH_ID;
params.bossProjectileKind = 'sprite';

project.name = `msx2_boss_shoot_${variant}_smoke`;

mkdirSync(OUT_DIR, { recursive: true });
const outJson = resolve(OUT_DIR, `fixture_shoot_${variant}.json`);
writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(`Fixture written: ${outJson}`);
console.log(`  variant  : ${variant}`);
console.log(`  shoot    : ${JSON.stringify(SHOOTS[variant])}`);
console.log(`  boss path: ${PATH_ID} (firing: path)`);
