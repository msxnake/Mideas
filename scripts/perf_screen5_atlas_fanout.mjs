#!/usr/bin/env node
/**
 * Cost of ONE atlas edit, fanned out across a world's rooms.
 *
 * `AppUI.handleUpdateBitmapRoom` reacts to any patch carrying `atlas` by
 * rewriting EVERY room of the active world: rooms share one atlas but each
 * persists its own copy, so the edit really does touch all of them.
 *
 * It used to deep-clone the atlas per room and then compare with a
 * `JSON.stringify` pair per room, which is where the time went. The rows below
 * keep both the OLD costs (as a baseline) and the SHIPPED path, which runs the
 * real `applySharedAtlasToWorldRooms` and the real `historyValuesEqual`.
 *
 * Scope: the baseline rows reproduce the old algorithm's shape rather than
 * executing the removed code, and none of this runs React. Read it as a budget,
 * not a contract test -- the contracts are check_msx2_atlas_share_immutability.mjs
 * and check_history_value_equality.mjs. Absolute numbers move with machine load;
 * compare rows within one run, not across runs.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = process.env.FANOUT_FIXTURE
  || join(repoRoot, 'test', 'msx2-destroy', 'fixture_base.json');

const project = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const assets = project.assets || [];

const rooms = assets.filter(a => a.type === 'msx2bitmaproom');
const world = assets.find(a => a.type === 'worldmap');
const worldRoomIds = new Set(
  (world?.data?.nodes || []).map(node => node.screenAssetId).filter(Boolean)
);
const worldRooms = rooms.filter(room => worldRoomIds.has(room.id));

/** Bundles the shipped atlas fan-out so the SHIPPED row measures real code. */
async function bundleFanout() {
  const out = join(mkdtempSync(join(tmpdir(), 'mideas-fanout-')), 'fanout.mjs');
  await build({
    entryPoints: [join(repoRoot, 'utils', 'msx2BitmapAtlasFanout.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
  });
  return import(pathToFileURL(out).href);
}

/** Bundles the shipped history comparator so (B) below measures real code. */
async function bundleHistoryComparator() {
  const out = join(mkdtempSync(join(tmpdir(), 'mideas-hve-')), 'equality.mjs');
  await build({
    entryPoints: [join(repoRoot, 'utils', 'historyValueEquality.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
  });
  return import(pathToFileURL(out).href);
}

const countPixels = atlas => (atlas?.pixels || []).reduce((sum, row) => sum + (row?.length || 0), 0);

const sample = worldRooms[0] || rooms[0];
const atlasPixelCount = countPixels(sample?.data?.atlas);
const entryCount = (sample?.data?.atlas?.entries || []).length;
const commandCount = (sample?.data?.composition?.commands || []).length;

console.log(`Fixture: ${FIXTURE.split(/[\\/]/).slice(-2).join('/')}`);
console.log(`  bitmap rooms in project : ${rooms.length}`);
console.log(`  rooms in the active world: ${worldRooms.length}`);
console.log(`  atlas pixels per room    : ${atlasPixelCount}`);
console.log(`  atlas entries per room   : ${entryCount}`);
console.log(`  composition commands     : ${commandCount}`);
console.log('');

// --- What the fan-out costs, per single atlas edit -------------------------
const cloneAtlas = atlas => ({
  width: atlas.width,
  height: atlas.height,
  offscreenBaseY: atlas.offscreenBaseY,
  pixels: (atlas.pixels || []).map(row => [...row]),
  entries: (atlas.entries || []).map(entry => ({ ...entry })),
});

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const time = (label, iterations, fn) => {
  for (let i = 0; i < 3; i++) fn();               // warm up JIT
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  const p50 = median(samples);
  console.log(`  ${label.padEnd(52)} p50 ${p50.toFixed(1)} ms`);
  return p50;
};

const sharedAtlas = cloneAtlas(sample.data.atlas);

const cloneMs = time(`clone the atlas once per world room (x${worldRooms.length})`, 15, () => {
  for (const _room of worldRooms) cloneAtlas(sharedAtlas);
});

// Reference-equal assets short-circuit; the fan-out makes them all differ, so
// this is the branch the history filter actually takes after an atlas edit.
const stringifyMs = time(`JSON.stringify x2 per changed room (x${worldRooms.length})`, 7, () => {
  for (const room of worldRooms) {
    JSON.stringify(room);
    JSON.stringify(room);
  }
});

// The contrast: what the same edit would cost if only the edited room's
// reference changed and the rest were left alone (shared atlas reference).
const singleMs = time('same edit, edited room only (1 clone + 2 stringify)', 15, () => {
  cloneAtlas(sharedAtlas);
  JSON.stringify(sample);
  JSON.stringify(sample);
});

// --- Candidate fixes ------------------------------------------------------
// (A) Share one atlas object across rooms instead of cloning per room. Kills
//     the clone, but every room still gets a fresh `data`, so history still
//     serialises.
time(`(A) share one atlas reference across ${worldRooms.length} rooms`, 15, () => {
  for (const _room of worldRooms) ({ ..._room, data: { ..._room.data, atlas: sharedAtlas } });
});

// (B) What `pushToHistory` now uses instead of the stringify pair. This imports
//     the REAL comparator, so the numbers below describe shipped behaviour.
const { historyValuesEqual: deepEqual } = await bundleHistoryComparator();

// The realistic case after an atlas edit: content DID change, so the compare
// must find a difference. That is the cheap direction for an early-bail walk.
const changedRooms = worldRooms.map(room => ({
  ...room,
  data: { ...room.data, atlas: { ...room.data.atlas, offscreenBaseY: (room.data.atlas?.offscreenBaseY || 0) + 1 } },
}));
time(`(B) deep-compare x${worldRooms.length} changed rooms (early bail)`, 15, () => {
  for (let i = 0; i < worldRooms.length; i++) deepEqual(worldRooms[i], changedRooms[i]);
});

// The worst case for (B): a clone with identical content, which must be walked
// in full before it can be declared equal. This is the no-op edit the
// stringify comparison exists to catch.
const identicalClones = worldRooms.map(room => JSON.parse(JSON.stringify(room)));
time(`(B) deep-compare x${worldRooms.length} identical clones (full walk)`, 7, () => {
  for (let i = 0; i < worldRooms.length; i++) deepEqual(worldRooms[i], identicalClones[i]);
});

// --- Shipped path: the real fan-out + the real history comparator ---------
const { applySharedAtlasToWorldRooms, cloneBitmapAtlas } = await bundleFanout();
const fanoutOptions = {
  activeRoomId: sample.id,
  worldRoomIds: new Set(worldRooms.map(room => room.id)),
  patch: { atlas: sample.data.atlas },
};
// A real edit: one atlas pixel differs, so the comparator bails early. This is
// the number that matters for "what does painting a tile cost".
const realEditAtlas = {
  ...sample.data.atlas,
  pixels: sample.data.atlas.pixels.map((row, y) => (
    y === 0 ? row.map((v, x) => (x === 0 ? (v + 1) & 0x0f : v)) : row
  )),
};
const shippedMs = time('SHIPPED: real atlas edit (fan-out + compare)', 15, () => {
  const next = applySharedAtlasToWorldRooms(assets, {
    ...fanoutOptions,
    patch: { atlas: realEditAtlas },
    sharedAtlas: cloneBitmapAtlas(realEditAtlas),
  });
  deepEqual(assets, next);
});

// A no-op rewrite: same content, all-new objects. The comparator must walk it
// all before it can say "nothing changed", so this is its worst case.
time('SHIPPED: no-op rewrite (worst case for the compare)', 7, () => {
  const next = applySharedAtlasToWorldRooms(assets, {
    ...fanoutOptions,
    sharedAtlas: cloneBitmapAtlas(sample.data.atlas),
  });
  deepEqual(assets, next);
});

console.log('');
const fanoutTotal = cloneMs + stringifyMs;
console.log(`  fan-out total per atlas edit : ${fanoutTotal.toFixed(1)} ms`);
console.log(`  edited-room-only equivalent  : ${singleMs.toFixed(1)} ms`);
if (singleMs > 0) {
  console.log(`  ratio                        : ${(fanoutTotal / singleMs).toFixed(1)}x`);
}
console.log(`  SHIPPED total per atlas edit : ${shippedMs.toFixed(1)} ms`);
if (shippedMs > 0) {
  console.log(`  improvement vs the old path  : ${(fanoutTotal / shippedMs).toFixed(0)}x faster`);
}
console.log(`  numbers cloned per edit      : ${(atlasPixelCount * worldRooms.length).toLocaleString('en-US')}`);
console.log('');
console.log('Budget reference: a 60 Hz frame is 16.7 ms.');
