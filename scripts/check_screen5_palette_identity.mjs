#!/usr/bin/env node
/**
 * Palette identity stability, measured against real projects.
 *
 * Every SCREEN 5 editor resolves its colours through `ensureScreen5PaletteSlots`
 * and `resolveWorldPalettes`, and feeds the result into `useMemo` deps, effect
 * deps and `React.memo` props. If those helpers hand back a NEW array for data
 * that did not change, the memo is defeated: WorldView re-rasterises every room
 * and re-encodes a PNG per room on any unrelated asset edit.
 *
 * So the property under test is not "are the colours right" (check_msx2_world_palette
 * already covers that) but "is the reference preserved when nothing changed".
 *
 * This imports the REAL helpers and asserts on the project's OWN palettes, then
 * deliberately de-normalises one to prove the probe can actually go red.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const FIXTURES = [
  join(repoRoot, 'test', 'msx2-boss', 'fixture_boss.json'),
  join(repoRoot, 'test', 'msx2-destroy', 'fixture_base.json'),
];

const bundle = async (entry, name) => {
  const out = join(mkdtempSync(join(tmpdir(), `mideas-${name}-`)), `${name}.mjs`);
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
  });
  return import(pathToFileURL(out).href);
};

const { ensureScreen5PaletteSlots, createDefaultScreen5PaletteSlots } =
  await bundle(join(repoRoot, 'utils', 'msx2PaletteUtils.ts'), 'palette');
const { resolveWorldPalettes } =
  await bundle(join(repoRoot, 'utils', 'msx2WorldPalette.ts'), 'world');

const checks = [];
const note = [];

/** Every distinct palette array a real project actually holds. */
const collectPalettes = assets => {
  const out = [];
  for (const asset of assets) {
    if (asset.type === 'palette' && Array.isArray(asset.data?.slots)) {
      out.push({ label: `palette asset "${asset.name}"`, slots: asset.data.slots });
    }
    if (asset.type === 'msx2bitmaproom' && Array.isArray(asset.data?.palette)) {
      out.push({ label: `room "${asset.name}".palette`, slots: asset.data.palette });
    }
  }
  return out;
};

for (const fixture of FIXTURES) {
  let project;
  try {
    project = JSON.parse(readFileSync(fixture, 'utf8'));
  } catch (error) {
    note.push(`SKIP: ${fixture} unreadable (${error.message})`);
    continue;
  }
  const assets = project.assets || [];
  const label = fixture.split(/[\\/]/).slice(-2).join('/');
  const palettes = collectPalettes(assets);

  note.push(`${label}: ${assets.length} assets, ${palettes.length} palette arrays inspected`);

  // 1. The core property: an already-normalised palette must come back BY REFERENCE.
  const unstable = palettes.filter(({ slots }) => {
    const { slots: resolved, changed } = ensureScreen5PaletteSlots(slots);
    return !changed && resolved !== slots;
  });
  checks.push([
    `${label}: unchanged palettes are returned by reference (not cloned)`,
    unstable.length === 0,
    unstable.length ? `${unstable.length} cloned: ${unstable.slice(0, 3).map(u => u.label).join(', ')}` : '',
  ]);

  // 2. How many of this project's palettes actually hit the happy path at all?
  //    A project whose palettes all report `changed` would defeat the memo anyway.
  const renormalised = palettes.filter(({ slots }) => ensureScreen5PaletteSlots(slots).changed);
  note.push(
    `${label}: ${palettes.length - renormalised.length}/${palettes.length} palettes already normalised `
    + `(${renormalised.length} report changed -> unavoidable fresh array)`
  );
  checks.push([
    `${label}: the happy path is the common case (majority already normalised)`,
    palettes.length === 0 || renormalised.length * 2 <= palettes.length,
    renormalised.length ? `${renormalised.length} need re-normalising` : '',
  ]);

  // 3. What WorldView / collectAtlasEntries consume: two identical calls must
  //    yield the same references, or every ScreenCanvas memo is invalidated.
  const t0 = performance.now();
  const first = resolveWorldPalettes(assets);
  const firstMs = performance.now() - t0;
  const second = resolveWorldPalettes(assets);
  const roomIds = [...first.byRoom.keys()];
  const stable = roomIds.every(id => first.byRoom.get(id) === second.byRoom.get(id));
  note.push(`${label}: resolveWorldPalettes -> ${roomIds.length} rooms in ${firstMs.toFixed(1)} ms`);
  if (roomIds.length === 0) {
    note.push(`SKIP: ${label} has no palette-carrying world, room stability not exercised`);
  } else {
    checks.push([
      `${label}: repeated resolveWorldPalettes returns the SAME slot references`,
      stable,
      stable ? '' : 'a re-resolve hands out new arrays -> memo defeated',
    ]);
  }
}

// 4. Prove the probe can fail: de-normalise a palette on purpose and confirm
//    the helper reports `changed` and allocates. A probe that cannot go red
//    is not measuring anything.
const good = createDefaultScreen5PaletteSlots();
const goodResult = ensureScreen5PaletteSlots(good);
const broken = createDefaultScreen5PaletteSlots().map((slot, idx) => (
  idx === 5 ? { ...slot, slotIndex: 99 } : slot
));
const brokenResult = ensureScreen5PaletteSlots(broken);
checks.push([
  'Self-check: a clean palette round-trips by reference with changed=false',
  goodResult.changed === false && goodResult.slots === good,
]);
checks.push([
  'Self-check: a de-normalised palette is detected (changed=true, new array)',
  brokenResult.changed === true && brokenResult.slots !== broken
    && brokenResult.slots[5].slotIndex === 5,
]);
checks.push([
  'Self-check: a short palette is replaced wholesale',
  ensureScreen5PaletteSlots(good.slice(0, 8)).changed === true,
]);
checks.push([
  'Self-check: createDefaultScreen5PaletteSlots does NOT share mutable state',
  createDefaultScreen5PaletteSlots() !== createDefaultScreen5PaletteSlots(),
]);

for (const line of note) console.log(`  ${line}`);
console.log('');

let failed = 0;
for (const [name, passed, detail] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}${detail && !passed ? ` -- ${detail}` : ''}`);
  if (!passed) failed += 1;
}

if (failed) {
  throw new Error(`Palette identity checks failed: ${failed}`);
}
console.log('\nPalette identity checks passed.');
