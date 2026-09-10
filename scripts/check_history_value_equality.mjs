#!/usr/bin/env node
/**
 * The undo history's change detector, checked against the behaviour it replaces.
 *
 * `pushToHistory` used to ask `JSON.stringify(before) === JSON.stringify(after)`.
 * The replacement must return the SAME verdict on real project data and on the
 * edit shapes the editors actually produce, or undo/redo silently changes: a
 * false "equal" loses an undo step, a false "different" records a no-op.
 *
 * This imports the REAL comparator and diffs it against the old stringify
 * oracle. Cases where the two are meant to disagree are listed explicitly, so a
 * new disagreement appearing anywhere else fails the run.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-history-')), 'equality.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'historyValueEquality.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { historyValuesEqual } = await import(pathToFileURL(out).href);

/** The behaviour being replaced, kept verbatim as the oracle. */
const stringifyEqual = (before, after) =>
  before === after || JSON.stringify(before) === JSON.stringify(after);

const checks = [];
const expect = (name, passed, detail = '') => checks.push([name, passed, detail]);

/**
 * Asserts the new comparator's verdict, and whether it is allowed to differ
 * from the stringify oracle.
 */
const compare = (name, before, after, expected, { divergesFromOracle = false } = {}) => {
  const actual = historyValuesEqual(before, after);
  const oracle = stringifyEqual(before, after);
  expect(`${name} -> ${expected ? 'equal' : 'different'}`, actual === expected,
    `got ${actual}`);
  if (divergesFromOracle) {
    expect(`${name}: documented divergence from stringify is real`, actual !== oracle,
      'the comparators agree, so the divergence note is stale');
  } else {
    expect(`${name}: agrees with the stringify oracle`, actual === oracle,
      `new=${actual} old=${oracle}`);
  }
};

// --- Shapes the editors actually produce ----------------------------------
const shared = { atlas: { pixels: [[1, 2], [3, 4]] } };
compare('same reference', shared, shared, true);
compare('clone with identical content', shared, JSON.parse(JSON.stringify(shared)), true);
compare('one pixel changed deep down',
  { atlas: { pixels: [[1, 2], [3, 4]] } },
  { atlas: { pixels: [[1, 2], [3, 9]] } }, false);
compare('asset added', [{ id: 'a' }], [{ id: 'a' }, { id: 'b' }], false);
compare('asset removed', [{ id: 'a' }, { id: 'b' }], [{ id: 'a' }], false);
compare('assets reordered', [{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'a' }], false);
compare('nested empty structures', { a: [], b: {} }, { a: [], b: {} }, true);
compare('number vs string', { hp: 3 }, { hp: '3' }, false);
compare('null vs missing key', { a: null }, {}, false);
compare('zero vs empty string', { a: 0 }, { a: '' }, false);
compare('false vs null', { a: false }, { a: null }, false);
compare('nested array length differs', { a: [[1]] }, { a: [[1, 1]] }, false);
compare('deep object vs array at same key', { a: { 0: 1 } }, { a: [1] }, false);

// A long flat array whose ONLY difference is its last element. Packed bitmaps
// are this shape (a 256x212 SCREEN 5 presentation packs to 27,136 bytes), and a
// comparator that gives up partway through would call these equal and lose the
// undo step.
const longRun = Array.from({ length: 27136 }, (_unused, index) => index & 0x0f);
const longRunTail = [...longRun];
longRunTail[longRunTail.length - 1] ^= 1;
compare('27k-element array, difference in the LAST element',
  { packedBitmap: longRun }, { packedBitmap: longRunTail }, false);
compare('27k-element array, difference in the middle',
  { packedBitmap: longRun },
  { packedBitmap: longRun.map((v, i) => (i === 13568 ? v ^ 1 : v)) }, false);
compare('27k-element array, identical content',
  { packedBitmap: longRun }, { packedBitmap: [...longRun] }, true);

// Same idea one level down: many rows, difference in the last row's last cell.
const grid = Array.from({ length: 2048 }, () => Array.from({ length: 32 }, () => 0));
const gridTail = grid.map(row => [...row]);
gridTail[gridTail.length - 1][31] = 1;
compare('2048-row grid, difference in the last cell', { grid }, { grid: gridTail }, false);

// --- Documented divergences ------------------------------------------------
compare('key order only', { a: 1, b: 2 }, { b: 2, a: 1 }, true, { divergesFromOracle: true });

// --- Alignment with stringify on JSON edge cases --------------------------
compare('explicit undefined equals absent', { a: undefined, b: 1 }, { b: 1 }, true);
compare('undefined on the after side', { b: 1 }, { a: undefined, b: 1 }, true);
compare('undefined vs a real value', { a: undefined }, { a: 1 }, false);
compare('NaN reads as null', { a: NaN }, { a: null }, true);
compare('Infinity reads as null', { a: Infinity }, { a: null }, true);
compare('NaN vs a number', { a: NaN }, { a: 1 }, false);
compare('minus zero equals zero', { a: -0 }, { a: 0 }, true);

// --- Top-level primitives (FONT_UPDATE and friends can pass scalars) ------
compare('equal scalars', 5, 5, true);
compare('different scalars', 5, 6, false);
// Parity, not elegance: stringify(undefined) is `undefined` rather than "null",
// so the old comparator called this a change too. No caller passes a bare
// undefined, so this only pins the behaviour down.
compare('null vs undefined at top level', null, undefined, false);
compare('empty arrays', [], [], true);

// --- Real project data ----------------------------------------------------
const FIXTURE = join(repoRoot, 'test', 'msx2-destroy', 'fixture_base.json');
let assets = null;
try {
  assets = JSON.parse(readFileSync(FIXTURE, 'utf8')).assets || [];
} catch (error) {
  console.log(`  SKIP: fixture unreadable (${error.message})`);
}

if (assets && assets.length) {
  console.log(`  Fixture: ${assets.length} assets`);

  expect('real assets: an untouched list is equal to itself',
    historyValuesEqual(assets, assets) === true);

  const clone = JSON.parse(JSON.stringify(assets));
  expect('real assets: a full clone with identical content is equal',
    historyValuesEqual(assets, clone) === true);
  expect('real assets: the clone verdict matches the stringify oracle',
    historyValuesEqual(assets, clone) === stringifyEqual(assets, clone));

  // The edit that matters: one room's atlas changes, the rest keep references.
  const roomIndex = assets.findIndex(a => a.type === 'msx2bitmaproom');
  if (roomIndex >= 0) {
    const room = assets[roomIndex];
    const edited = assets.map((asset, index) => (
      index === roomIndex
        ? { ...asset, data: { ...asset.data, atlas: { ...asset.data.atlas, offscreenBaseY: (asset.data.atlas?.offscreenBaseY || 0) + 1 } } }
        : asset
    ));
    expect('real assets: a single-room atlas edit is detected',
      historyValuesEqual(assets, edited) === false);
    expect('real assets: that verdict matches the stringify oracle',
      historyValuesEqual(assets, edited) === stringifyEqual(assets, edited));

    // A pixel deep inside the biggest array in the project.
    const pixelEdited = assets.map((asset, index) => {
      if (index !== roomIndex) return asset;
      const pixels = (asset.data.atlas?.pixels || []).map(row => [...row]);
      if (pixels.length && pixels[pixels.length - 1].length) {
        const lastRow = pixels[pixels.length - 1];
        lastRow[lastRow.length - 1] = (lastRow[lastRow.length - 1] + 1) & 0x0f;
      }
      return { ...asset, data: { ...asset.data, atlas: { ...asset.data.atlas, pixels } } };
    });
    expect('real assets: a single pixel in the last atlas row is detected',
      historyValuesEqual(assets, pixelEdited) === false);

    // A no-op rewrite: same content, all-new objects. This is the case the
    // check exists for, and the one that used to cost ~115 ms.
    const noop = assets.map(asset => (
      asset.id === room.id ? JSON.parse(JSON.stringify(asset)) : asset
    ));
    expect('real assets: a no-op rewrite of one room is still equal',
      historyValuesEqual(assets, noop) === true);
  } else {
    console.log('  SKIP: fixture has no bitmap room');
  }
}

let failed = 0;
for (const [name, passed, detail] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}${!passed && detail ? ` -- ${detail}` : ''}`);
  if (!passed) failed += 1;
}

if (failed) {
  throw new Error(`History equality checks failed: ${failed}`);
}
console.log(`\nHistory equality checks passed (${checks.length}).`);
