#!/usr/bin/env node
/**
 * FASE 2a of the VRAM study (§3.4): shelf-pack the dialogue portraits.
 *
 * Each portrait used to take a full band of VRAM rows to itself even though a
 * mouth-frame pair is only `width*2` px wide, wasting 62,5 % of the portrait
 * area. Now portraits share a band until the row is full, so three 48x48
 * portraits occupy 96 rows instead of 144.
 *
 * The rows freed matter more than their size: the pre-dimmed atlas twin is
 * dropped silently when the dialogue blob leaves no space under it, so a fat
 * portrait blob is what costs a dark project its fast dark rooms.
 *
 * Drives the real generator and reads the emitted portrait records, whose
 * layout is the thing that must not regress: SY(word), SX, width, height.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
// A MegaROM fixture: this project's intro cannot fit a simple 32KB ROM.
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss.json');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-portraits-')), 'gen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const generator = await import(pathToFileURL(out).href);

const raw = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const realLog = console.log;
const realWarn = console.warn;
console.log = () => {};
console.warn = () => {};
let asm;
try {
  const files = generator.generateModularASM(raw.name || 'portraits', raw.assets, {
    generateUnified: true,
    romMode: 'megarom',
    targetFormat: 'konami',
    screenMode: raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: raw.targetGraphicsBackend || undefined,
  });
  asm = files['unitedFiles.asm'] || files['main.asm'];
} finally {
  console.log = realLog;
  console.warn = realWarn;
}

if (!/bitmap_dlg_portrait_records/.test(asm)) {
  throw new Error('fixture no longer emits dialogue portraits; the checks below prove nothing');
}

/** Portrait records are 5 bytes: SY low, SY high, SX, width, height. */
const recordLine = asm.match(/bitmap_dlg_portrait_records:\s*\n\s*DB ([^\n]+)/);
if (!recordLine) throw new Error('could not read bitmap_dlg_portrait_records');
const bytes = recordLine[1].split(',').map(token => parseInt(token.trim().replace('#', ''), 16));
if (bytes.length % 5 !== 0) {
  throw new Error(`portrait record table is ${bytes.length} bytes, not a multiple of the 5-byte stride`);
}
const portraits = [];
for (let i = 0; i < bytes.length; i += 5) {
  portraits.push({ sy: bytes[i] | (bytes[i + 1] << 8), sx: bytes[i + 2], w: bytes[i + 3], h: bytes[i + 4] });
}

const blob = asm.match(/offscreen VRAM rows (\d+)\.\.(\d+), once at boot/);
const blobRows = blob ? Number(blob[2]) - Number(blob[1]) + 1 : null;

const checks = [];

checks.push(['The fixture has enough portraits to need a shelf', portraits.length >= 3]);

// The point of the change: portraits share a row band instead of each taking one.
const bandCounts = new Map();
for (const p of portraits) bandCounts.set(p.sy, (bandCounts.get(p.sy) || 0) + 1);
checks.push(['At least one band holds more than one portrait',
  [...bandCounts.values()].some(count => count > 1)]);
checks.push(['Portraits sharing a band sit at different columns',
  [...bandCounts.entries()].every(([sy, count]) => {
    const columns = new Set(portraits.filter(p => p.sy === sy).map(p => p.sx));
    return columns.size === count;
  })]);

// Both mouth frames of a portrait must still fit the 256px row alongside its
// neighbours: overlapping pairs would draw one portrait's mouth over another.
checks.push(['No portrait pair runs past the 256px row',
  portraits.every(p => p.sx + p.w * 2 <= 256)]);
const overlaps = portraits.some((a, i) => portraits.some((b, j) => (
  i !== j && a.sy === b.sy && a.sx < b.sx + b.w * 2 && b.sx < a.sx + a.w * 2
)));
checks.push(['No two portraits in a band overlap', !overlaps]);

// Three 48x48 portraits: 2 per band -> 96 rows of portraits, not 144.
const portraitRows = new Set(portraits.map(p => p.sy)).size
  * Math.max(...portraits.map(p => p.h));
checks.push(['Three 48x48 portraits occupy 96 rows, not 144', portraitRows === 96]);
realLog(`      ${portraits.length} portraits -> ${portraitRows} rows of portraits`
  + `${blobRows === null ? '' : `, whole blob ${blobRows} rows`}`);

// The runtime must read SX from the record instead of assuming the pair starts
// at column 0, and index by the 5-byte stride.
checks.push(['The drawing routine reads SX from the record',
  /A = SX of the closed frame/.test(asm) && /add a, c\s+; open frame lives one width to the right/.test(asm)]);
checks.push(['The drawing routine indexes by the 5-byte stride',
  /HL = index\*5 \(record is 5 bytes\)/.test(asm)]);

// Opening saves the live box rectangle; closing restores that exact snapshot.
// Replaying the whole room here caused large bosses to sweep the dialogue away
// over many frames and also lost runtime-mutated pixels.
const openRoutine = /bitmap_dlg_open:([\s\S]{0,900}?)bitmap_dlg_start_line:/.exec(asm)?.[1] || '';
const closeRoutine = /bitmap_dlg_close_box:([\s\S]{0,900}?)bitmap_dlg_launch_cmd:/.exec(asm)?.[1] || '';
checks.push(['Dialogue open saves the box before drawing it',
  /call bitmap_dlg_save_box[\s\S]*call bitmap_dlg_draw_box/.test(openRoutine)]);
checks.push(['Dialogue close restores its snapshot without replaying the room',
  /jp bitmap_dlg_restore_box/.test(closeRoutine)
  && !/replay_room_commands/.test(closeRoutine)]);
checks.push(['Dialogue save/restore use one opaque HMMM command',
  /bitmap_dlg_save_box:/.test(asm)
  && /bitmap_dlg_restore_box:/.test(asm)
  && /bitmap_dlg_finish_hmmm:[\s\S]{0,220}?ld a, #D0/.test(asm)]);
checks.push(['VRAM report reserves the dialogue snapshot shelf',
  /dialogue box save\/restore scratch/.test(asm)]);

let failed = 0;
for (const [label, ok] of checks) {
  realLog(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
realLog('');
if (failed) {
  console.error(`MSX2 dialogue portrait shelf checks FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
realLog(`MSX2 dialogue portrait shelf checks passed (${checks.length}).`);
