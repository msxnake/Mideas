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
 *   --angle22   one bullet at the AUTHORED angle 15 (337.5 deg, 22.5 left of
 *               up), speed 2: dx -1 + 60/256, dy -2 + 38/256. Proves a linear
 *               shot can leave along an odd ring slot.
 *   --fanfixed  radial of 2 with fixedAngle: true, angle 6. The wave must centred
 *               on slot 6 (slots 6 and 14) even though the player stands
 *               somewhere else entirely — bit 7 of the pattern byte.
 *   --spiral    spread of 1 (stride 1), spin: true, 3 waves 10 frames apart:
 *               wave k leaves along ring slot k. Proves the rotation byte and
 *               the pattern bit 6: velocities slot0 (0,-2), slot1 (-1,-2)+frac,
 *               slot2 (1,-2)+frac in that order.
 *   --aimed     one AIMED bullet at speed 2 from a boss parked at --boss-x N
 *               (default 64). Build once, read player_x/boss_x from the probe
 *               log, rebuild aligned so the player body centre sits straight
 *               below the boss centre: the bullet must then fire dx=0 dy=+2.
 *               The old aim compared the player render ORIGIN against the boss
 *               centre and answered down-left in exactly that setup.
 *
 * Usage: node scripts/build_msx2_boss_radial_burst_smoke.mjs [--linear|--diagonal|--angle22|--fanfixed|--aimed [--boss-x N]]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-boss/fixture_boss_def.json');
const OUT_DIR = resolve(ROOT, 'test/msx2-boss');

const variant = process.argv.includes('--linear') ? 'linear'
  : process.argv.includes('--diagonal') ? 'diagonal'
    : process.argv.includes('--angle22') ? 'angle22'
      : process.argv.includes('--fanfixed') ? 'fanfixed'
        : process.argv.includes('--spiral') ? 'spiral'
          : process.argv.includes('--aimed') ? 'aimed'
            : 'radial';
const bossXArg = process.argv.find(arg => arg.startsWith('--boss-x='));
const bossX = bossXArg ? Number(bossXArg.split('=')[1]) : 64;

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
  // Authored odd ring slot: unit (sin 337.5deg, -cos 337.5deg) = (-0.3827, -0.9239).
  // Table words -98 / -237, doubled by speed 2 -> dx #FF3C, dy #FE26.
  angle22: {
    id: SHOOT_ID, name: 'Authored 337.5 degrees',
    pattern: 'linear', bulletCount: 1, direction: 'down', angle: 15, speed: 2,
    burstCount: 1, burstInterval: 8,
  },
  // Fixed-angle ring: centred on slot 6 whatever the player does (pattern
  // byte 3 | 0x80 = #83). Wave = slots 6 and 14.
  fanfixed: {
    id: SHOOT_ID, name: 'Fixed-angle ring x2',
    pattern: 'radial', bulletCount: 2, direction: 'down', angle: 6,
    fixedAngle: true, speed: 2,
    burstCount: 1, burstInterval: 8,
  },
  // The turret: follow the player. Alignment under test, see the header.
  aimed: {
    id: SHOOT_ID, name: 'Aimed at the player',
    pattern: 'aimed', bulletCount: 1, direction: 'down', speed: 2,
    burstCount: 1, burstInterval: 8,
  },
  // Spiral: spread of 1 at the FIXED angle 0 (up), spin. Wave k leaves along
  // slot k: 0, 1, then 2. Record pattern byte = 2 | 0x80 | 0x40 = #C2. Speed 2.
  spiral: {
    id: SHOOT_ID, name: 'Spiral 3 waves',
    pattern: 'spread', bulletCount: 1, spreadStep: 1,
    direction: 'up', angle: 0, fixedAngle: true, spin: true, speed: 2,
    burstCount: 3, burstInterval: 10,
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
      { id: 'n0', x: bossX, y: 32, actions: [{ action: 'wait', frames: 90 }, { action: 'fire', shootId: SHOOT_ID }] },
      { id: 'n1', x: bossX + 4, y: 32, actions: [] },
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
