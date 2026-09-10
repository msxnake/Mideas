#!/usr/bin/env node
// Compare the real helper and full exports with the pre-optimization module.
// Pin the reference so running this after a commit still exercises the old path.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = 'utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts';
const reference = '79537efd7866382b95a72ba242f92ba0a04b47d5';
const beforeSource = execFileSync('git', ['show', `${reference}:${modulePath}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const work = join(root, 'work', 'atlas-extraction-check');
mkdirSync(work, { recursive: true });
async function load(label, source) {
  const outfile = join(work, `${label}.mjs`);
  await build({
    stdin: { contents: `export { generateModularASM } from './utils/msxGenerator/index.ts'; export { extractAtlasEntryPixels } from './${modulePath}';`, resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent',
    plugins: [{ name: 'expose-helper', setup(plugin) {
      plugin.onLoad({ filter: /msx2Screen5BitmapRoomGenerator\.ts$/ }, () => ({
        contents: `${source}\nexport { extractAtlasEntryPixels };`, loader: 'ts', resolveDir: dirname(join(root, modulePath)),
      }));
    } }],
  });
  try { return await import(pathToFileURL(outfile).href); }
  finally { unlinkSync(outfile); }
}
const before = await load('before', beforeSource);
const after = await load('after', readFileSync(join(root, modulePath), 'utf8'));
let seed = 12345;
const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
const values = [undefined, null, NaN, Infinity, -4, 0, 1, 15, 16, 255, 256, 2.9, '12', 'bad'];
for (let i = 0; i < 600; i++) {
  const room = { atlas: { width: random(40), height: random(40), pixels: Array.from({ length: random(42) }, () =>
    random(4) ? Array.from({ length: random(42) }, () => values[random(values.length)]) : undefined) } };
  const entry = { sx: random(60) - 10, sy: random(60) - 10, w: random(50) - 5, h: random(50) - 5 };
  const options = i % 2 ? { maxWidth: 16, maxHeight: 16 } : {};
  const snapshot = structuredClone(room);
  assert.deepStrictEqual(after.extractAtlasEntryPixels(room, entry, options), before.extractAtlasEntryPixels(room, entry, options), `rectangle ${i}`);
  assert.deepStrictEqual(room, snapshot, 'source atlas must remain unchanged');
}
console.log('PASS: 600 rectangle cases (clipping, missing pixels, colors, size limits, source immutability)');

const room = { atlas: { width: 256, height: 352, pixels: Array.from({ length: 352 }, (_, y) => Array.from({ length: 256 }, (_, x) => (x + y) & 15)) } };
const entry = { sx: 32, sy: 320, w: 16, h: 16 };
const cropped = after.extractAtlasEntryPixels(room, entry);
cropped[0][0] = 7;
assert.equal(room.atlas.pixels[320][32], 0, 'output must own its pixel arrays');
room.atlas.pixels[320][32] = 9;
assert.equal(after.extractAtlasEntryPixels(room, entry)[0][0], 9, 'later edits must not use stale pixels');
let reads = 0;
const counted = { atlas: { ...room.atlas, pixels: room.atlas.pixels.map(row => new Proxy(row, { get(target, key) { if (/^\d+$/.test(String(key))) reads++; return Reflect.get(target, key); } })) } };
after.extractAtlasEntryPixels(counted, entry);
assert.equal(reads, 256, 'a 16x16 extraction must read only 256 pixels');
const median = list => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
const timings = { before: [], after: [] };
for (let run = 0; run < 7; run++) {
  for (const [label, implementation] of run % 2 ? [['after', after], ['before', before]] : [['before', before], ['after', after]]) {
    const start = performance.now();
    for (let i = 0; i < 208; i++) implementation.extractAtlasEntryPixels(room, entry);
    if (run > 0) timings[label].push(performance.now() - start);
  }
}
console.log(`208 tile extractions, median ms: before=${median(timings.before).toFixed(2)}, after=${median(timings.after).toFixed(2)} (isolated benchmark)`);

const fixtures = ['test/msx2-bitmap-intro/bitmap_intro_test.json', 'test/msx2-boss/fixture_boss_def.json', 'test/msx2-shoot/shoot_verify.json', 'test/msx2-slime/fixture_slime_mix.json', 'test/msx2-behavior/fixture_scripted_enemy.json', 'test/msx2-bats/test501_bats.json'];
for (const fixture of fixtures) {
  const raw = JSON.parse(readFileSync(join(root, fixture), 'utf8'));
  const config = { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)', targetGraphicsBackend: raw.targetGraphicsBackend || undefined };
  const generate = implementation => {
    const log = console.log, warn = console.warn;
    try {
      console.log = console.warn = () => {};
      return implementation.generateModularASM(raw.name || raw.currentProjectName || 'atlas-check', structuredClone(raw.assets), config);
    } finally { console.log = log; console.warn = warn; }
  };
  const expected = generate(before);
  const actual = generate(after);
  assert.deepStrictEqual(actual, expected, `all generated files must match for ${fixture}`);
  console.log(`PASS: all generated files byte-identical: ${fixture}`);
}
