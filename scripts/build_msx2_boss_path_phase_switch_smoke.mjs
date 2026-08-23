#!/usr/bin/env node
/**
 * SCREEN 5 bitmap boss: PHASE ROUTE SWAP smoke fixture.
 *
 * Builds the case the deferred swap exists for. The boss walks a tight box while
 * healthy and swaps to a wide sweep at half health:
 *
 *   Box loop    a 96x56 rectangle, looping, drawn around the spawn cell
 *   Wide sweep  a 160px run, looping, which fits the room ONLY if it starts
 *               where the box started
 *
 * With the old runtime the sweep was anchored wherever the box happened to have
 * reached when the HP threshold was crossed, so most of it ended up off screen.
 * With the swap deferred to the end of the lap, both routes share one anchor and
 * the sweep is exactly the shape that was drawn.
 *
 * Usage: node scripts/build_msx2_boss_path_phase_switch_smoke.mjs
 * Then:  python scripts/build_mideas_unified_rom.py --json test/msx2-boss/fixture_path_phase_switch.json --rom-mode megarom
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-boss/fixture_shoot_radial.json');
const OUT_JSON = resolve(ROOT, 'test/msx2-boss/fixture_path_phase_switch.json');

const BOX_ID = 'bosspath_box_loop';
const SWEEP_ID = 'bosspath_wide_sweep';

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
project.name = 'Boss Path Phase Switch Smoke';
project.currentProjectName = project.name;

const node = (x, y, actions = []) => ({ id: `n_${x}_${y}`, x, y, actions });

// Out with whatever routes the base fixture had; in with the two this needs.
project.assets = project.assets.filter(asset => asset.type !== 'msx2bosspath');
project.assets.push(
  {
    id: BOX_ID,
    name: 'Box loop',
    type: 'msx2bosspath',
    data: {
      id: BOX_ID,
      name: 'Box loop',
      speedPxPerTick: 2,
      loopMode: 'loop',
      firing: 'auto',
      // A route is a RELATIVE shape: only the span counts. This boss spawns at
      // 98,16 with a 64x64 body, so it has 94px before the right wall and 88
      // before the bottom one. 60x40 sits comfortably inside that.
      nodes: [node(64, 40), node(124, 40), node(124, 80), node(64, 80)],
    },
  },
  {
    id: SWEEP_ID,
    name: 'Wide sweep',
    type: 'msx2bosspath',
    data: {
      id: SWEEP_ID,
      name: 'Wide sweep',
      speedPxPerTick: 2,
      loopMode: 'loop',
      firing: 'auto',
      // 92px across: it clears the right wall by 2px from the spawn, and by
      // nothing at all from anywhere the box could have left the boss. That is
      // the whole fixture — the same route is legal or off screen depending on
      // where it is anchored.
      nodes: [node(20, 40), node(112, 40), node(112, 64), node(20, 64)],
    },
  },
);

const boss = project.assets.find(asset => asset.type === 'msx2boss');
if (!boss) throw new Error('base fixture has no msx2boss asset');
const params = boss.data.params || boss.data;
// 30 HP so the half-health threshold is crossed well into a lap, not on frame 1.
params.bossHp = 30;
params.bossPathId = BOX_ID;
params.bossPhases = [
  { id: 'phase_1', enterWhenHpBelowPercent: 100, interval: 40, projectileSpeed: 3 },
  { id: 'phase_2', enterWhenHpBelowPercent: 50, interval: 24, projectileSpeed: 3, pathId: SWEEP_ID },
];
// A weak point that multiplies damage is irrelevant here and only makes the
// probe's job harder; the probe pokes boss_hp directly.
delete params.damageZones;
// A barrier tile with no authored Room Lock sequence still raises the legacy
// chain intro, and the body does not update until that has run. This fixture is
// about the route, so the boss starts fighting on the first frame.
delete params.bossBarrierTileId;
delete params.roomLockSequence;

// The PLACED encounter overrides the definition's health, and the phase
// thresholds are a percentage of whatever wins. Left at the base fixture's 5,
// half health is 3 and the probe has almost no room to poke a value that is
// both alive and past the threshold.
const rooms = project.assets.filter(asset => asset.type === 'msx2bitmaproom');
let placed = 0;
const raiseHp = value => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach(raiseHp); return; }
  if (value.kind === 'boss' && value.params) { value.params.hpOverride = params.bossHp; placed++; }
  Object.values(value).forEach(raiseHp);
};
rooms.forEach(room => raiseHp(room.data));
if (!placed) throw new Error('no placed boss encounter found to raise the health of');

writeFileSync(OUT_JSON, JSON.stringify(project, null, 2));
console.log(`Wrote ${OUT_JSON}`);
console.log(`  boss "${boss.name}" hp=${params.bossHp}, default route "${BOX_ID}", phase 2 (50%) -> "${SWEEP_ID}"`);
