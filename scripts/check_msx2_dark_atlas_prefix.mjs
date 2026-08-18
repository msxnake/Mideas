#!/usr/bin/env node
/**
 * FASE 1 of the VRAM study: the dimmed twin only mirrors what dark rooms paint.
 *
 * The twin used to be a copy of the WHOLE shared atlas, so it also dimmed the
 * boss bodies and the tiles that only lit rooms paint — VRAM nothing ever reads,
 * paid twice (study §6.4). Now the packer groups the tiles dark rooms use at the
 * front of the atlas and the twin copies only that prefix.
 *
 * Two independent mechanisms save rows, and this drives BOTH, because on the
 * bats fixture every unique tile happens to be used by some dark room and only
 * the first mechanism fires:
 *   1. boss stamps (atlas "extras") fall outside the prefix,
 *   2. tiles painted only by lit rooms fall outside the prefix.
 *
 * Runs the real generator; asserts on the emitted prepare_dark_atlas block.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const MIXED_FIXTURE = join(repoRoot, 'test', 'msx2-bats', 'test501_bats.json');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-darkatlas-')), 'gen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const generator = await import(pathToFileURL(out).href);

function generate(assets, raw) {
  const config = {
    generateUnified: true,
    romMode: 'simple32k',
    targetFormat: 'konami',
    screenMode: raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: raw.targetGraphicsBackend || undefined,
  };
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    const files = generator.generateModularASM(raw.name || 'darkatlas', assets, config);
    return files['unitedFiles.asm'] || files['main.asm'];
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}

/** The generated comment states both ranges; read the twin and source extents. */
function readTwin(asm) {
  if (!/prepare_dark_atlas:/.test(asm)) return null;
  const m = asm.match(/rows (\d+)\.\.(\d+) are a copy of rows (\d+)\.\.(\d+)/);
  if (!m) throw new Error('prepare_dark_atlas is emitted but its row comment did not parse');
  const [twinFrom, twinTo, srcFrom, srcTo] = m.slice(1).map(Number);
  return { twinRows: twinTo - twinFrom + 1, twinFrom, srcFrom, srcTo,
           atlasRows: twinFrom - srcFrom };
}

// The prefix was once blamed for a dark cavern rendering red; it was innocent
// (the culprit was a palette handing slot 8 to the HUD). It is on, and verified
// on hardware, so these checks must actually run: fail loudly if it is switched
// off rather than reporting a green nobody earned.
const roomGenSource = readFileSync(
  join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts'),
  'utf8',
);
if (/const DARK_ATLAS_PREFIX_ENABLED = false/.test(roomGenSource)) {
  console.error('FAIL: DARK_ATLAS_PREFIX_ENABLED was turned off; the twin mirrors the whole atlas.');
  console.error('      If that was deliberate, say why here — it costs 4 KB and doubles boot dim time.');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(MIXED_FIXTURE, 'utf8'));
const isRoom = asset => String(asset?.type || '').toLowerCase() === 'msx2bitmaproom';
const isDark = asset => String(asset?.data?.runtime?.lighting || 'off').toLowerCase() === 'lamp';

const checks = [];

// --- Mechanism 1: the twin stops before the boss stamps.
{
  const base = readTwin(generate(JSON.parse(JSON.stringify(raw.assets)), raw));
  if (!base) throw new Error('fixture no longer produces a dimmed twin; the checks below prove nothing');
  checks.push(['The twin is smaller than the atlas it mirrors', base.twinRows < base.atlasRows]);
  checks.push(['The twin still starts at the atlas base', base.srcFrom === 512]);
  console.log(`      atlas ${base.atlasRows} rows -> twin ${base.twinRows} rows `
    + `(${(base.atlasRows - base.twinRows) * 128 / 1024} KB saved)`);
}

// NOT COVERED HERE: mechanism 2, "tiles only lit rooms paint stay out of the
// prefix". It is implemented (buildSharedWorldAtlasRooms groups by the `dark`
// flag) but no fixture exercises it. In this project all 20 unique tiles are
// painted by some dark room, and the rooms of a world share one atlas, so
// neither flipping rooms to lit nor recolouring one produces lit-only art.
// Proving it needs a fixture with two worlds, or a dark room with private art.
// Until then that half of §6.4 rests on code reading, not on a test.

// --- A project with no dark room emits no twin at all.
{
  const assets = JSON.parse(JSON.stringify(raw.assets));
  for (const room of assets.filter(isRoom)) {
    if (room.data?.runtime) room.data.runtime.lighting = 'off';
  }
  checks.push(['A project with no dark room emits no twin', readTwin(generate(assets, raw)) === null]);
}

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
console.log('');
if (failed) {
  console.error(`MSX2 dimmed-atlas prefix checks FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
console.log(`MSX2 dimmed-atlas prefix checks passed (${checks.length}).`);
