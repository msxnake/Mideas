#!/usr/bin/env node
/**
 * SCREEN 5 bitmap boss: ATTACK PHASE ESCALATION smoke fixture.
 *
 * Takes the boss-definition smoke project and makes the boss get angrier as it
 * loses health, using every escalation knob a phase owns:
 *
 *   phase_1  100%  the authored base rhythm, nothing overridden
 *   phase_2   60%  fires a 3-bullet fan instead of one aimed shot, moves in
 *                  double steps
 *   phase_3   30%  shorter cadence, body updated twice as often, triple steps,
 *                  and a faster laser wave
 *
 * Deliberately NO path: the shot pattern used to be reachable only from a path
 * node, so a project with phase-driven patterns and no path at all is exactly
 * the case that proves the runtime routines are emitted on their own terms.
 *
 * Usage: node scripts/build_msx2_boss_phase_escalation_smoke.mjs
 * Then:  python scripts/build_mideas_unified_rom.py --json test/msx2-boss/fixture_phase_escalation.json --rom-mode megarom
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-boss/fixture_boss_def.json');
const OUT_JSON = resolve(ROOT, 'test/msx2-boss/fixture_phase_escalation.json');

const SHOOT_ID = 'shoot_phase_fan';

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
const assets = project.assets || (project.assets = []);

const bossAsset = assets.find(asset => asset.type === 'msx2boss');
if (!bossAsset) throw new Error('No msx2boss asset in the base project');

// Idempotent: drop anything a previous run added.
project.assets = assets.filter(asset => asset.id !== SHOOT_ID);

project.assets.push({
  id: SHOOT_ID,
  name: 'Angry fan x3',
  type: 'msx2shoot',
  data: {
    id: SHOOT_ID,
    name: 'Angry fan x3',
    pattern: 'spread',
    // The bullet pool is small (2 slots here), so the volley is a BURST: two
    // waves of two, which is also what makes the fan visible instead of four
    // sprites born on the same line.
    bulletCount: 2,
    direction: 'down',
    speed: 0,            // 0 = inherit the phase's bullet speed
    spreadStep: 2,
    burstCount: 2,
    burstInterval: 8,
  },
});

const params = bossAsset.data.params || (bossAsset.data.params = {});
params.bossProjectileKind = 'sprite';
params.bossPathId = '';                 // no path: the cadence does the firing
params.bossMovement = params.bossMovement || 'patrolX';
params.bossSpeed = params.bossSpeed || 2;
params.bossInterval = params.bossInterval || 4;
// Give the boss a laser too, so the fixture covers the one knob a laser-only
// boss has. Any 16x16 atlas tile of the boss room will do as the beam segment.
const bossRoom = project.assets.find(asset => asset.type === 'msx2bitmaproom'
  && (asset.data?.atlas?.entries || []).some(entry => entry.w === 16 && entry.h === 16));
const laserTile = (bossRoom?.data?.atlas?.entries || []).find(entry => entry.w === 16 && entry.h === 16);
if (!laserTile) throw new Error('No 16x16 atlas entry to use as the laser segment');
params.bossLaserTileId = laserTile.id;
params.bossLaserDirectionMask = 0x05;   // N + S
params.bossLaserMaxLengthPx = 64;
params.bossLaserInterval = params.bossLaserInterval || 90;
params.bossPhases = [
  {
    id: 'phase_1',
    enterWhenHpBelowPercent: 100,
    interval: params.bossShootInterval || 90,
    projectileSpeed: params.bossProjectileSpeed || 2,
  },
  {
    id: 'phase_2',
    enterWhenHpBelowPercent: 60,
    interval: 30,
    projectileSpeed: 3,
    shootId: SHOOT_ID,
    moveStepMultiplier: 2,
  },
  {
    id: 'phase_3',
    enterWhenHpBelowPercent: 30,
    interval: 18,
    projectileSpeed: 4,
    shootId: SHOOT_ID,
    laserInterval: 40,
    bodyInterval: 2,
    moveStepMultiplier: 3,
  },
];

project.name = 'msx2_boss_phase_escalation_smoke';
project.currentProjectName = project.name;

mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(`Fixture written: ${OUT_JSON}`);
console.log('  phases   : 100% base, 60% fan + double step, 30% everything');
console.log('  shoot    : spread x3 (speed inherited from the phase)');
console.log('  path     : none, so the phase cadence is what fires');
