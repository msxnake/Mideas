#!/usr/bin/env node
/**
 * SLOT 8 RESERVE in dark SCREEN 5 bitmap worlds, checked against the REAL generator.
 *
 * A dark room composes from a pre-dimmed twin of the atlas, and dimming is a
 * plain `OR #8` on every pixel. Colour 0 is the empty space inside tiles, so it
 * covers roughly half the screen — and once dimmed it becomes palette slot 8,
 * which pins that slot to "whatever black the darkness is" and makes it unusable
 * for anything else. Since colour 0 is transparent (R#8 TP=0) it displays
 * exactly palette[R#7], i.e. the very same thing the backdrop INDEX displays, so
 * the generator swaps one for the other on the way to VRAM. Nothing changes on
 * screen and slot 8 is left free for the HUD band, which is never dimmed.
 *
 * The generator is transpiled and invoked here, not restated, and the fixture is
 * a real authored project. Remove the promotion in `packAtlasPixels` or in
 * `dimRoomRenderRecords` and these checks go red.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = join(repoRoot, 'test', 'msx2-lighting', 'mina.json');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-slot8-')), 'generator.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { generateMsx2Screen5BitmapRoomFiles } = await import(pathToFileURL(out).href);

// ---- helpers ---------------------------------------------------------------
const clone = value => JSON.parse(JSON.stringify(value));

const buildAsm = project => {
  const assets = project.assets;
  const pick = type => assets.filter(asset => asset.type === type).map(asset => asset.data);
  const analysis = {
    msx2BitmapRooms: pick('msx2bitmaproom'),
    worldmaps: pick('worldmap'),
    msx2GameFlows: pick('msx2gameflow'),
    tiles: [],
    tracks: [],
    assets,
  };
  const files = generateMsx2Screen5BitmapRoomFiles('slot8_check', analysis, {
    screenMode: 'SCREEN 4 (Graphics II)',
    romMode: 'megarom',
    targetFormat: 'konami',
  });
  return files['unitedFiles.asm'];
};

/** Bytes of the consecutive `DB` lines that follow `label:`. */
const dbBytesAfter = (asm, label) => {
  const start = asm.search(new RegExp(`^${label}:\\s*$`, 'm'));
  if (start < 0) return [];
  const bytes = [];
  for (const line of asm.slice(start).split(/\r?\n/).slice(1)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('DB ')) break;
    for (const token of trimmed.slice(3).split(',')) {
      const hex = token.trim().replace(/^#/, '');
      if (/^[0-9A-Fa-f]{1,2}$/.test(hex)) bytes.push(parseInt(hex, 16));
    }
  }
  return bytes;
};

/** VALUE bytes of every tileset RLE chunk (chunks are count,value pairs). */
const tilesetValueBytes = asm => {
  const values = [];
  for (let index = 0; ; index++) {
    const bytes = dbBytesAfter(asm, `bitmap_room_tileset_rle_chunk_${index}`);
    if (!bytes.length) break;
    for (let i = 1; i < bytes.length; i += 2) values.push(bytes[i]);
  }
  return values;
};

const hasZeroNibble = bytes => bytes.some(byte => (byte & 0x0f) === 0 || (byte >> 4) === 0);

/** CLR byte of block 0 (the full-band background HMMV) of a room's program. */
const backgroundFillColor = (asm, roomIndex) => dbBytesAfter(asm, `bitmap_room_render_${roomIndex}_p0`)[12];

// ---- fixture ---------------------------------------------------------------
// The repo's dark fixtures were all authored without colour 0 (their tiles are
// solid), so on their own they cannot tell a working promotion from a missing
// one. Real dark rooms are the opposite case — in the project this came from,
// colour 0 is the empty space inside tiles and covers ~47% of the screen — so
// paint some into every atlas entry and let the lit control below prove those
// pixels really do reach VRAM.
const paintZeroIntoTiles = project => {
  for (const room of project.assets.filter(asset => asset.type === 'msx2bitmaproom')) {
    const pixels = room.data.atlas.pixels;
    for (const entry of room.data.atlas.entries || []) {
      for (let y = entry.sy; y < entry.sy + Math.min(4, entry.h); y++) {
        for (let x = entry.sx; x < entry.sx + Math.min(4, entry.w); x++) {
          if (pixels[y]) pixels[y][x] = 0;
        }
      }
    }
  }
  return project;
};

const project = paintZeroIntoTiles(JSON.parse(readFileSync(FIXTURE, 'utf8')));
const rooms = project.assets.filter(asset => asset.type === 'msx2bitmaproom');

const checks = [];

// ---- the fixture has to be able to fail --------------------------------------
checks.push([
  'Fixture is meaningful: at least one room is a dark (lamp) room',
  rooms.some(room => room.data?.runtime?.lighting === 'lamp'),
]);
checks.push([
  'Fixture is meaningful: the entry room has a non-zero backdrop, so a promotion target exists',
  (rooms[0].data.backgroundColor & 0x0f) !== 0,
]);

// ---- the invariant -----------------------------------------------------------
const darkAsm = buildAsm(project);
const backdrop = rooms[0].data.backgroundColor & 0x0f;

checks.push([
  'Dark world: no colour 0 reaches VRAM, so the dimmed twin never produces slot 8',
  !hasZeroNibble(tilesetValueBytes(darkAsm)),
]);
checks.push([
  `Dark world: the background band dims to ${backdrop | 8}, never to slot 8`,
  rooms.every((_room, index) => backgroundFillColor(darkAsm, index) === ((backdrop | 8) * 0x11)),
]);

// ---- a room that never set its own background colour --------------------------
// Rooms authored after the first one routinely leave `backgroundColor` undefined,
// which clamps to 0. That is invisible on its own — colour 0 displays the
// backdrop — but a dark room re-dims travelling rectangles with LMMV + OR #08 as
// the halo moves, and colour 0 lands on slot 8 right there. It bit for real: the
// crumbling floor's erosion band painted colour 0 and turned red under the player
// the moment slot 8 was spent on a HUD marker. So the room fill AND every runtime
// repaint that quotes the room background have to carry the backdrop index.
const zeroBgProject = clone(project);
for (const room of zeroBgProject.assets.filter(asset => asset.type === 'msx2bitmaproom').slice(1)) {
  delete room.data.backgroundColor;
}
// The fixture has no crumbling floor, so mark its tiles crumbling to bring the
// erosion band — the repaint that actually turned red — into the build.
for (const room of zeroBgProject.assets.filter(asset => asset.type === 'msx2bitmaproom')) {
  for (const entry of room.data.atlas.entries || []) entry.crumbling = true;
}
const zeroBgAsm = buildAsm(zeroBgProject);
checks.push([
  'A dark room with no authored background colour still dims to the backdrop, not to slot 8',
  rooms.slice(1).every((_room, index) => backgroundFillColor(zeroBgAsm, index + 1) === ((backdrop | 8) * 0x11)),
]);

// Runtime repaints quote the room background as a doubled colour byte. None of
// them may carry 0, or the next OR #08 over that rectangle paints slot 8.
const crumbleBg = dbBytesAfter(zeroBgAsm, 'bitmap_crumble_bg_table');
checks.push([
  'Fixture is meaningful: the crumbling floor is actually compiled in',
  crumbleBg.length > 0,
]);
checks.push([
  'Crumbling floor erosion band never paints colour 0, so OR #08 cannot reach slot 8',
  crumbleBg.length > 0 && crumbleBg.every(byte => byte !== 0x00),
]);

// ---- lit projects must be untouched ------------------------------------------
// Doubles as the fixture's control. The promotion is gated on a dark world: a
// lit-only project has no dimmed twin, nothing can turn into slot 8, and its
// atlas must reach VRAM exactly as authored. If this goes red the painted zeros
// never reached VRAM and the dark check above proved nothing.
const litProject = clone(project);
for (const room of litProject.assets.filter(asset => asset.type === 'msx2bitmaproom')) {
  if (room.data.runtime) delete room.data.runtime.lighting;
}
const litAsm = buildAsm(litProject);
checks.push([
  'Lit-only project: colour 0 still reaches VRAM untouched (the promotion stays gated)',
  hasZeroNibble(tilesetValueBytes(litAsm)),
]);

// ---- report ------------------------------------------------------------------
let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
