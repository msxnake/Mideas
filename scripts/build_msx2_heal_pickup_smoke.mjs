#!/usr/bin/env node
/**
 * SCREEN 5 bitmap room: health pickup (+1 heart) smoke fixture.
 *
 * Takes the standard bitmap-room smoke project as a base and authors a single
 * corridor that exercises the whole feature in one left-to-right walk:
 *
 *   cell (5,10)  deadly, NOT solid  -> costs the player one heart on contact
 *   cell (8,10)  health pickup      -> refills it back to max
 *   cell (9,10)  health pickup      -> must be LEFT untouched (already full)
 *
 * The two pickups sit side by side on purpose: the player body is 16px wide, so
 * mid-stride it overlaps BOTH cells on the same frame. A correct build takes
 * exactly one (the per-item re-check against maxHealth) and leaves the other on
 * the floor for later.
 *
 * The player config sets health.deadlyInstantRespawn = false so a deadly touch
 * only costs a heart instead of teleporting the player back to the spawn, which
 * would make the walk non-deterministic.
 *
 * Usage: node scripts/build_msx2_heal_pickup_smoke.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-screen4/out/msx2_bitmap_room_smoke.json');
const OUT_DIR = resolve(ROOT, 'test/msx2-heal');

const SOLID = 0x10;
const DEADLY = 0x40;
const FLOOR_ROW = 11;
const BODY_ROW = 10;   // the 16px band a player standing on the floor occupies
const HEAL_TILE = 'brick_green';
const FLOOR_TILE = 'brick_red';

const grid = (fill) => Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => fill));

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
const roomAsset = (project.assets || []).find(asset => asset.type === 'msx2bitmaproom');
if (!roomAsset) throw new Error('No msx2bitmaproom asset in the base smoke project');
const room = roomAsset.data;

const atlasIndex = (id) => {
  const index = (room.atlas?.entries || []).findIndex(entry => entry.id === id);
  if (index < 0) throw new Error(`Base project atlas has no entry '${id}'`);
  return index + 1; // tileGrid stores index+1; 0 means empty
};

const collision = grid(0);
const tileGrid = grid(0);
for (let x = 0; x < 16; x++) {
  collision[FLOOR_ROW][x] = SOLID;
  tileGrid[FLOOR_ROW][x] = atlasIndex(FLOOR_TILE);
}
// Hazard the player walks into on the way to the pickups. Deadly but passable,
// so it never blocks the walk.
collision[BODY_ROW][5] = DEADLY;

room.collision = collision;
room.tileGrid = tileGrid;
room.playerEntries = [{ id: 'spawn0', x: 16, y: 144, facing: 'right', playerId: 'smoke_player' }];
room.entities = [
  {
    id: 'heal_a',
    name: 'Health Pickup A',
    kind: 'collectible',
    position: { x: 8, y: BODY_ROW },
    params: { healAtlasEntryId: HEAL_TILE },
  },
  {
    id: 'heal_b',
    name: 'Health Pickup B',
    kind: 'collectible',
    position: { x: 9, y: BODY_ROW },
    params: { healAtlasEntryId: HEAL_TILE },
  },
];

const playerAsset = (project.assets || []).find(asset => asset.type === 'msx2player');
if (!playerAsset) throw new Error('No msx2player asset in the base smoke project');
playerAsset.data.health = {
  ...(playerAsset.data.health || {}),
  maxHealth: 5,
  lives: 3,
  invulnerabilityFrames: 60,
  deadlyInstantRespawn: false,
};

project.name = 'msx2_heal_pickup_smoke';

mkdirSync(OUT_DIR, { recursive: true });
const outJson = resolve(OUT_DIR, 'fixture_heal.json');
writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(`Fixture written: ${outJson}`);
console.log(`  row ${FLOOR_ROW}: solid floor (${FLOOR_TILE})`);
console.log(`  cell (5,${BODY_ROW}): deadly, passable`);
console.log(`  cell (8,${BODY_ROW}) + (9,${BODY_ROW}): health pickups (${HEAL_TILE})`);
console.log('  player: maxHealth 5, deadlyInstantRespawn false');
