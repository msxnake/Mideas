#!/usr/bin/env node
/**
 * Fixture builder for the SCREEN 5 bitmap GRASS SWAY system.
 *
 * Source project: the canonical bitmap-room smoke JSON (produced by
 * scripts/build_msx2_screen5_bitmap_room_smoke.py --skip-openmsx), which is the
 * one fixture in the repo that reliably builds. On top of it this adds
 *
 *   - a solid floor on row 11 so the player has something to walk along;
 *   - a strip of swaying grass on row 10, the air row the body wades through;
 *   - a player spawn standing on that floor, left of the strip.
 *
 * The three grass frames are three DIFFERENT coloured bricks on purpose: the
 * smoke is not checking that the art is pretty, it is checking that the runtime
 * swaps the VRAM source when the player walks in and swaps it back when it
 * leaves. Green = at rest, red = bent left, cyan = bent right, so a single
 * screenshot says whether the swap happened and in which direction.
 *
 * Usage:
 *   node test/msx2-sway/make_fixture.mjs [--src <smoke.json>] [--out <path>] [--no-sway]
 *
 * `--no-sway` writes the same room WITHOUT the sway marking: building both and
 * diffing the ROMs is what proves the feature is byte-identical when unused.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const BOOT_ROOM_ID = 'bitmap_room_smoke';
const FLOOR_ROW = 11;
/** Row 10 is the air strip right above the floor: grass the player wades through. */
const GRASS_ROW = 10;
const GRASS_COLS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const CELL = 16;
const SOLID = 0x10;

const argValue = (flag, fallback) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const withSway = !process.argv.includes('--no-sway');
const srcPath = resolve(argValue('--src', join(root, 'test', 'msx2-screen4', 'out', 'msx2_bitmap_room_smoke.json')));
const outPath = resolve(argValue('--out', join(here, withSway ? 'fixture_sway.json' : 'fixture_nosway.json')));

const project = JSON.parse(readFileSync(srcPath, 'utf8'));
const room = (project.assets || []).find(asset => asset.id === BOOT_ROOM_ID);
if (!room) throw new Error(`Boot room ${BOOT_ROOM_ID} not found in ${srcPath}`);

const entries = room.data.atlas.entries;
const byName = name => {
  const entry = entries.find(item => item.id === name);
  if (!entry) throw new Error(`Atlas entry ${name} missing from the source fixture`);
  return entry;
};
const rest = byName('brick_green');
const left = byName('brick_red');
const right = byName('brick_cyan');
const floor = byName('brick_white');

if (withSway) {
  rest.sway = true;
  rest.swayLeftAtlasEntryId = left.id;
  rest.swayRightAtlasEntryId = right.id;
  rest.swayHoldFrames = 12;
}

const indexOf = entry => entries.indexOf(entry) + 1; // tileGrid is 1-based
const commands = room.data.composition.commands;
/** The ROM paints the room from composition.commands, so grid and commands must agree. */
const paint = (col, row, entry) => {
  room.data.tileGrid[row][col] = indexOf(entry);
  const id = `sway_tile_${col}_${row}`;
  const command = { id, op: 'copy', atlasEntryId: entry.id, dx: col * CELL, dy: row * CELL, w: CELL, h: CELL };
  const existing = commands.findIndex(item => item.id === id);
  if (existing >= 0) commands[existing] = command;
  else commands.push(command);
};

for (let col = 0; col < 16; col++) {
  paint(col, FLOOR_ROW, floor);
  room.data.collision[FLOOR_ROW][col] = SOLID;
}
for (const col of GRASS_COLS) {
  paint(col, GRASS_ROW, rest);
  // Grass is decorative: the cell stays non-solid so the player wades through it.
  room.data.collision[GRASS_ROW][col] = 0;
}

// Stand the player on the floor, to the LEFT of the strip, so walking right is
// what carries it into the grass.
const spawn = (room.data.playerEntries || [])[0];
if (spawn) {
  spawn.x = 16;
  spawn.y = FLOOR_ROW * CELL - 32; // 32px body: feet exactly on the floor
  spawn.facing = 'right';
}

project.name = `${project.name || 'fixture'}${withSway ? '_sway' : '_nosway'}`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(`Fixture written: ${outPath}  (sway ${withSway ? 'ON' : 'OFF'})`);
if (withSway) {
  console.log(`  rest  = ${rest.id} (sx ${rest.sx}, sy ${rest.sy})`);
  console.log(`  left  = ${left.id} (sx ${left.sx}, sy ${left.sy})`);
  console.log(`  right = ${right.id} (sx ${right.sx}, sy ${right.sy})`);
  console.log(`  cells = row ${GRASS_ROW}, cols ${GRASS_COLS.join(',')}`);
}
