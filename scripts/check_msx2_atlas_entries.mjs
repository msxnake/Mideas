#!/usr/bin/env node
/**
 * Atlas tile collection, run against a real project.
 *
 * Rooms in a world share one atlas, so walking rooms and pushing every entry
 * lists each tile once per room. This imports the REAL collector rather than
 * restating it, and asserts on fixture data that actually has the duplication.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss.json');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-atlas-')), 'entries.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2AtlasEntries.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { collectAtlasEntries } = await import(pathToFileURL(out).href);

const assets = JSON.parse(readFileSync(FIXTURE, 'utf8')).assets;
const entries = collectAtlasEntries(assets);

// What a naive per-room walk would have produced.
const rooms = assets.filter(a => a.type === 'msx2bitmaproom');
let rawCount = 0;
const rawIds = new Set();
const geometryById = new Map();
for (const room of rooms) {
  for (const entry of room.data?.atlas?.entries || []) {
    if (!entry?.id) continue;
    rawCount += 1;
    rawIds.add(String(entry.id));
    const signature = JSON.stringify([entry.sx, entry.sy, entry.w, entry.h]);
    if (!geometryById.has(entry.id)) geometryById.set(entry.id, new Set());
    geometryById.get(entry.id).add(signature);
  }
}

const ids = entries.map(e => e.id);
const checks = [];

checks.push([
  `Fixture is meaningful: rooms really do repeat entries (${rawCount} listings across ${rooms.length} rooms)`,
  rawCount > rawIds.size,
]);

checks.push([
  'Dedup is safe: an entry id names the same rectangle in every room',
  [...geometryById.values()].every(set => set.size === 1),
]);

checks.push([
  `No tile is listed twice (${ids.length} returned, ${new Set(ids).size} distinct)`,
  ids.length === new Set(ids).size,
]);

checks.push([
  `Every distinct tile survives (${entries.length} of ${rawIds.size})`,
  entries.length === rawIds.size,
]);

checks.push([
  'Shared tiles report how many rooms use them',
  entries.some(e => e.roomCount > 1) && entries.every(e => e.roomCount >= 1),
]);

checks.push([
  'Every entry carries pixels and a 16-slot palette to draw with',
  entries.length > 0 && entries.every(e => Array.isArray(e.pixels) && e.palette?.length === 16),
]);

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
}

if (failed) {
  throw new Error(`Atlas entry checks failed: ${failed}`);
}
console.log('Atlas entry checks passed.');
