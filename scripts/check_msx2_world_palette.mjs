#!/usr/bin/env node
/**
 * World palette resolution, run against a real project.
 *
 * Rooms keep a private `palette` copy that goes stale once the world moves to a
 * shared `palette` asset. Editors that preview atlas pixels must resolve through
 * the world, or they paint tiles in colours the game never shows.
 *
 * This transpiles and imports the REAL resolver instead of restating it, then
 * asserts against fixture data whose room and world palettes genuinely differ.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss.json');

// Bundle the resolver (and its palette-utils dependency) into one ESM file.
const out = join(mkdtempSync(join(tmpdir(), 'mideas-palette-')), 'resolver.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2WorldPalette.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { resolveWorldPalettes } = await import(pathToFileURL(out).href);

const project = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const assets = project.assets;
const { byRoom, shared } = resolveWorldPalettes(assets);

const world = assets.find(a => a.type === 'worldmap');
const worldPaletteId = world?.data?.paletteAssetId;
const worldSlots = assets.find(a => a.id === worldPaletteId && a.type === 'palette')?.data?.slots;
const hex = slots => (slots || []).map(s => s.hex).join(',');

const rooms = (world?.data?.nodes || [])
  .map(node => assets.find(a => a.id === node.screenAssetId))
  .filter(Boolean);

const checks = [];

checks.push([
  'Fixture is meaningful: at least one room palette differs from the world',
  rooms.some(room => hex(room.data?.palette) !== hex(worldSlots)),
]);

checks.push([
  'Every room in a palette-carrying world resolves to the WORLD palette',
  rooms.length > 0 && rooms.every(room => hex(byRoom.get(room.id)) === hex(worldSlots)),
]);

checks.push([
  'Resolution does not silently return the stale room palette',
  rooms.every(room => {
    const resolved = hex(byRoom.get(room.id));
    return hex(room.data?.palette) === hex(worldSlots) || resolved !== hex(room.data?.palette);
  }),
]);

checks.push([
  'A single-world project exposes one unambiguous shared palette (for stamps)',
  hex(shared) === hex(worldSlots),
]);

// A world without a palette asset must fall through to the room's own slots.
const noPalette = JSON.parse(JSON.stringify(assets));
for (const asset of noPalette) {
  if (asset.type === 'worldmap') delete asset.data.paletteAssetId;
}
const bare = resolveWorldPalettes(noPalette);
checks.push([
  'A world with no palette asset resolves nothing (caller falls back to the room)',
  bare.byRoom.size === 0 && bare.shared === undefined,
]);

// Two differing world palettes are ambiguous for room-less assets.
const twoWorlds = JSON.parse(JSON.stringify(assets));
const secondPalette = twoWorlds.find(a => a.type === 'palette' && a.id !== worldPaletteId);
const firstWorld = twoWorlds.find(a => a.type === 'worldmap');
let ambiguousChecked = false;
if (secondPalette && firstWorld) {
  twoWorlds.push({
    ...JSON.parse(JSON.stringify(firstWorld)),
    id: 'world_probe_2',
    name: 'Probe World 2',
    data: { ...JSON.parse(JSON.stringify(firstWorld.data)), paletteAssetId: secondPalette.id },
  });
  const ambiguous = resolveWorldPalettes(twoWorlds);
  ambiguousChecked = true;
  checks.push([
    'Two world palettes leave `shared` undefined instead of guessing',
    ambiguous.shared === undefined,
  ]);
}

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
}
if (!ambiguousChecked) {
  console.log('SKIP: ambiguity check (fixture has only one palette asset)');
}

if (failed) {
  throw new Error(`World palette checks failed: ${failed}`);
}
console.log('World palette checks passed.');
