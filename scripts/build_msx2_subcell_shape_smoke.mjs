#!/usr/bin/env node
/**
 * SCREEN 5 bitmap room: 8x8 SUB-CELL solidity smoke fixture.
 *
 * Takes the standard bitmap-room smoke project as a base and authors a room whose
 * floor is built from PARTIAL 16x16 cells:
 *
 *   row 11 -> full solid floor          (collisionShape 0)
 *   row  8 -> ledge, BOTTOM half only   (collisionShape 12 = BL|BR)
 *   row  5 -> ceiling, TOP half only    (collisionShape  3 = TL|TR)
 *
 * The player spawns above the row-8 ledge, so a correct build lands it 8px LOWER
 * than a full cell would (feet at y=143 instead of y=135... see the assertions in
 * the TCL harness).
 *
 * Usage: node scripts/build_msx2_subcell_shape_smoke.mjs [--out <dir>]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-screen4/out/msx2_bitmap_room_smoke.json');
const OUT_DIR = resolve(ROOT, 'test/msx2-subcell');

const SOLID = 0x10;
const SHAPE_BOTTOM_HALF = 12; // BL | BR
const SHAPE_TOP_HALF = 3;     // TL | TR
const DEADLY = 0x40;

const grid = (fill) => Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => fill));

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
const roomAsset = (project.assets || []).find(asset => asset.type === 'msx2bitmaproom');
if (!roomAsset) throw new Error('No msx2bitmaproom asset in the base smoke project');
const room = roomAsset.data;

const collision = grid(0);
const collisionShape = grid(0);

// Full-solid floor at the bottom row.
for (let x = 0; x < 16; x++) collision[11][x] = SOLID;
// Half-height ledge: solid cells whose upper 8px are a hole.
for (let x = 2; x <= 9; x++) {
  collision[8][x] = SOLID;
  collisionShape[8][x] = SHAPE_BOTTOM_HALF;
}
// Half-height ceiling: solid only in its upper 8px.
for (let x = 2; x <= 9; x++) {
  collision[5][x] = SOLID;
  collisionShape[5][x] = SHAPE_TOP_HALF;
}
// Deadly probe test, on the floor the player ends up walking on (row 11 keeps it
// at y=160..175, and the hazard probe samples the lower body edge, y=175).
// Row 10 spans y=160..175: its TOP half is 160..167 and its BOTTOM half 168..175.
// The cells are deadly but NOT solid, so they never block the walk.
//   feature build: shape 3  -> only the top half hurts  -> y=175 is safe, no damage
//   --deadly-control: shape 0 -> the whole cell hurts   -> y=175 hurts, health drops
const deadlyControl = process.argv.includes('--deadly-control');
for (let x = 12; x <= 13; x++) {
  collision[10][x] = DEADLY;
  collisionShape[10][x] = deadlyControl ? 0 : SHAPE_TOP_HALF;
}

room.collision = collision;
room.collisionShape = collisionShape;
room.playerEntries = [{ id: 'spawn0', x: 48, y: 96, facing: 'right', playerId: 'smoke_player' }];
project.name = 'msx2_subcell_shape_smoke';

mkdirSync(OUT_DIR, { recursive: true });
const outJson = resolve(OUT_DIR, deadlyControl ? 'fixture_subcell_control.json' : 'fixture_subcell.json');
writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(`Fixture written: ${outJson}`);
console.log('  row  5: solid + shape 3  (top half)');
console.log('  row  8: solid + shape 12 (bottom half)');
console.log('  row 11: solid, no shape  (full cell)');
