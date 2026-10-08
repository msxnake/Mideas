#!/usr/bin/env node
/**
 * Regenerates test/msx2-boss/fixture_boss_burst_freeze_no_enemy.json, the fixture of the
 * "bitmap-room-boss-no-enemy-freeze" case of scripts/check_generator_output_identical.mjs.
 *
 * WHAT IT PINS. A project with a boss and NO enemy anywhere gives the boss no hardware-sprite
 * bullets (the bullet pool reuses idle enemy sprite slots), so the boss generator has shoot records
 * (a path node fires a pattern) but no burst RAM (`boss_burst_idx` is declared only when `hasShoots`).
 * `shootFreezeUsed` ("hold still while a burst is in flight", bit 2 of a shoot record) was read
 * straight off the records, so the boss movement code read `boss_burst_idx` anyway and glass stopped
 * with "Symbol not found: boss_burst_idx". Fixed in 4a53642e (`shootFreezeUsed = hasShoots && ...`).
 * Every ingredient is needed:
 *   - a boss whose body stamp resolves (otherwise "boss disabled in this room" and no boss runtime),
 *   - an `msx2bosspath` whose node fires an `msx2shoot`            (-> shoot records, hasPaths),
 *   - that `msx2shoot` with freezeWhileFiring = true                (-> bit 2 of the record),
 *   - zero `enemy` entities in the project                          (-> no sprite bullets, hasShoots = false).
 *
 * Derived, never hand-edited:
 *   base  test/msx2-boss/fixture_boss_dark_room.json        (87 KB: one room, one boss encounter, its definition)
 *   stamp test/msx2-boss/fixture_boss_final_sequence.json   (only the 64x64 body stamp is copied out of it)
 * The output is deterministic (no timestamps, no randomness): running it twice yields the same bytes.
 *
 *   node test/msx2-boss/make_burst_freeze_no_enemy_fixture.mjs [out.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(here, 'fixture_boss_dark_room.json');
const STAMP_SOURCE = path.join(here, 'fixture_boss_final_sequence.json');
const OUT = path.resolve(process.argv[2] || path.join(here, 'fixture_boss_burst_freeze_no_enemy.json'));

const STAMP_ID = 'tileset_sabana1_1782578940127'; // the id the base boss definition already names (bossStampAssetId)
const SHOOT_ID = 'shoot_burst_freeze';
const PATH_ID = 'bosspath_smoke_fire';                // the id the base boss definition already names (bossPathId)

const project = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const stampSource = JSON.parse(fs.readFileSync(STAMP_SOURCE, 'utf8'));

// 1. The boss body stamp (without it the generator disables the boss and emits no boss runtime at all).
const stamp = stampSource.assets.find(a => a.type === 'msx2bitmapstamp' && a.id === STAMP_ID);
if (!stamp) throw new Error(`stamp ${STAMP_ID} not found in ${path.basename(STAMP_SOURCE)}`);
project.assets = project.assets.filter(a => a.id !== STAMP_ID);
project.assets.push(JSON.parse(JSON.stringify(stamp)));

// 2. A shot pattern that holds the boss still while its burst is in flight (record byte 0, bit 2) ...
project.assets = project.assets.filter(a => a.id !== SHOOT_ID && a.id !== PATH_ID);
project.assets.push({
  id: SHOOT_ID,
  name: 'Ring x4 burst x3, freeze while firing',
  type: 'msx2shoot',
  data: {
    id: SHOOT_ID,
    name: 'Ring x4 burst x3, freeze while firing',
    pattern: 'radial',
    bulletCount: 4,
    direction: 'down',
    speed: 2,
    burstCount: 3,
    burstInterval: 10,
    freezeWhileFiring: true,
  },
});

// 3. ... fired by a path node, and the path the base boss definition already points at.
project.assets.push({
  id: PATH_ID,
  name: 'Fire in place',
  type: 'msx2bosspath',
  data: {
    id: PATH_ID,
    name: 'Fire in place',
    speedPxPerTick: 2,
    loopMode: 'loop',
    firing: 'path',
    nodes: [
      { id: 'n0', x: 64, y: 32, actions: [{ action: 'wait', frames: 90 }, { action: 'fire', shootId: SHOOT_ID }] },
      { id: 'n1', x: 68, y: 32, actions: [] },
    ],
  },
});

// 4. Zero enemies anywhere: that is what leaves the bosses without sprite bullets.
let removed = 0;
for (const asset of project.assets) {
  if (asset.type !== 'msx2bitmaproom') continue;
  const before = (asset.data.entities || []).length;
  asset.data.entities = (asset.data.entities || []).filter(e => e.kind !== 'enemy');
  removed += before - asset.data.entities.length;
}
project.enemyDefinitions = [];
project.name = 'Boss burst freeze, no enemies';
project.currentProjectName = project.name;

// Stable asset order so two runs (and two machines) write the same bytes.
const order = a => `${a.type}\u0000${a.id}`;
const withIndex = project.assets.map((a, i) => ({ a, i }));
withIndex.sort((x, y) => (order(x.a) < order(y.a) ? -1 : order(x.a) > order(y.a) ? 1 : x.i - y.i));
project.assets = withIndex.map(x => x.a);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(project)}\n`);
const bosses = project.assets.filter(a => a.type === 'msx2bitmaproom').flatMap(r => (r.data.entities || []).filter(e => e.kind === 'boss')).length;
const enemies = project.assets.filter(a => a.type === 'msx2bitmaproom').flatMap(r => (r.data.entities || []).filter(e => e.kind === 'enemy')).length;
console.log(JSON.stringify({ out: OUT, bytes: fs.statSync(OUT).size, bosses, enemies, enemiesRemoved: removed }));
