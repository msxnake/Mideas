#!/usr/bin/env node
/**
 * FASE 5 of the VRAM study (§9): one tile atlas PER WORLD.
 *
 * Builds the two-world fixture into a real Konami SCC MegaROM so the change can
 * be checked where it matters -- on hardware, crossing the WorldLink.
 *
 * What this proves and what it does NOT:
 *   - it proves the ROM assembles and that the per-world upload dispatcher and
 *     its jump table are emitted with one entry per world;
 *   - it does NOT prove the right atlas reaches VRAM. That needs OpenMSX: dump
 *     the atlas rows before and after the WorldLink and compare them against the
 *     two worlds' expected tile bytes (see the recipe printed at the end).
 *
 * Usage: node scripts/build_msx2_per_world_atlas_smoke.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT_DIR = resolve(ROOT, 'test/msx2-boss/out');
const FIXTURE = resolve(OUT_DIR, 'two_worlds.json');
const ASM_PATH = join(OUT_DIR, 'per_world_atlas.asm');
const ROM_PATH = join(OUT_DIR, 'per_world_atlas.rom');

// test/**/out/ is gitignored, so the fixture is derived from a committed base
// on demand rather than checked in. Without this the check ran here and nowhere
// else, which is worse than not having it.
if (!existsSync(FIXTURE)) {
  execFileSync('node', ['--max-old-space-size=8192', join(ROOT, 'scripts', 'build_msx2_two_world_fixture.mjs')],
    { cwd: ROOT, stdio: 'inherit' });
}

mkdirSync(OUT_DIR, { recursive: true });
const bundle = join(OUT_DIR, '_gen_per_world_atlas.mjs');
await build({
  entryPoints: [join(ROOT, 'utils', 'msxGenerator', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  logLevel: 'silent',
});
const generator = await import(pathToFileURL(bundle).href);

const raw = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const realLog = console.log;
const realWarn = console.warn;
console.log = () => {};
console.warn = () => {};
let asm;
try {
  const files = generator.generateModularASM(raw.name || 'per_world_atlas', raw.assets, {
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
writeFileSync(ASM_PATH, asm);

// --- What the generator claims it did, read back from the emitted ASM --------
const worldRows = [...asm.matchAll(/^;\s+world (\d+): (\d+) atlas rows, (\d+) raw bytes$/gm)]
  .map(match => ({ world: Number(match[1]), rows: Number(match[2]), bytes: Number(match[3]) }));
const tableMatch = /^bitmap_world_atlas_upload_table:\s*\n\s*DW ([^\n]+)$/m.exec(asm);
const tableEntries = tableMatch ? tableMatch[1].split(',').map(entry => entry.trim()) : [];
const bodies = [...asm.matchAll(/^bitmap_upload_tileset_atlas_w(\d+):$/gm)].map(match => Number(match[1]));

// Bail out before the rest: with no per-world atlas emitted, EVERY check below
// would pass on empty inputs (`0 === 0`, `every` over nothing, `Math.max()` of
// nothing being -Infinity) and report a green nobody earned.
if (worldRows.length < 2) {
  console.error(`FAIL: the build emitted ${worldRows.length} per-world atlas/es; the checks below would prove nothing.`);
  console.error('      Either the fixture stopped compiling two worlds, or buildPerWorldAtlases fell back to one shared atlas.');
  process.exit(1);
}

const checks = [];
checks.push(['One jump-table entry per world',
  tableEntries.length === worldRows.length && tableEntries.length > 1]);
checks.push(['One upload body per world',
  bodies.length === worldRows.length && bodies.length > 1]);
checks.push(['Table entries point at the emitted bodies',
  tableEntries.length > 1
  && tableEntries.every((entry, index) => entry === `bitmap_upload_tileset_atlas_w${index}`)]);
// The whole point of the phase: the VRAM region is sized by the tallest world.
const tallest = Math.max(...worldRows.map(entry => entry.rows));
const summed = worldRows.reduce((total, entry) => total + entry.rows, 0);
checks.push(['Per-world atlases are smaller than their union',
  Number.isFinite(tallest) && tallest > 0 && tallest < summed]);
// The dispatcher must read the world index the WorldLink latched, and tail-jump.
const dispatcher = /^upload_tileset_atlas:\n([\s\S]*?)^bitmap_world_atlas_upload_table:/m.exec(asm);
checks.push(['The dispatcher selects on bitmap_world_index',
  !!dispatcher && /ld a, \(bitmap_world_index\)/.test(dispatcher[1]) && /jp \(hl\)/.test(dispatcher[1])]);
// Every body must return; the dispatcher jumps rather than calls, so a body
// that fell through would run the next world's upload on top of its own.
const bodyBlocks = [...asm.matchAll(/^bitmap_upload_tileset_atlas_w\d+:\n([\s\S]*?)\n    ret\n/gm)];
checks.push(['Every per-world body ends in RET',
  bodyBlocks.length === worldRows.length && bodyBlocks.length > 1]);
// Each world must upload its OWN data, or two worlds would show the same tiles.
checks.push(['Each body uploads its own world\'s RLE chunks',
  bodyBlocks.every((block, index) => new RegExp(`bitmap_room_tileset_w${index}_rle_chunk_`).test(block[1])
    && !new RegExp(`bitmap_room_tileset_w(?!${index}_)\\d+_rle_chunk_`).test(block[1]))]);
// Every world writes the SAME offscreen rows; that is what makes them share the
// region instead of stacking. A body aimed elsewhere would silently grow VRAM.
const atlasVramBase = 512 * 128;
checks.push(['Every world uploads to the same atlas VRAM base',
  bodyBlocks.every(block => new RegExp(`ld a, ${Math.floor(atlasVramBase / 0x4000)}\\s*\\n\\s*ld de, #0000`).test(block[1]))]);

realLog('');
for (const entry of worldRows) {
  realLog(`      world ${entry.world}: ${entry.rows} atlas rows (${entry.bytes} raw bytes)`);
}
realLog(`      VRAM atlas region: ${tallest} rows instead of ${summed} `
  + `(${((summed - tallest) * 128 / 1024).toFixed(1)} KB freed, and it stops growing per world)`);

// --- Assemble, because an ASM that does not build proves nothing -------------
const glassJar = join(ROOT, 'server', 'glass.jar');
let romOk = false;
try {
  execFileSync('java', ['-jar', glassJar, '-I', join(ROOT, 'server'), ASM_PATH, ROM_PATH], {
    cwd: ROOT,
    stdio: 'pipe',
  });
  romOk = existsSync(ROM_PATH) && statSync(ROM_PATH).size > 0;
} catch (error) {
  realLog(String(error.stdout || '') + String(error.stderr || ''));
}
checks.push(['The two-world ROM assembles with glass.jar', romOk]);
if (romOk) realLog(`      ROM: ${ROM_PATH} (${statSync(ROM_PATH).size} bytes)`);

let failed = 0;
realLog('');
for (const [label, ok] of checks) {
  realLog(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
realLog('');
if (failed) {
  console.error(`MSX2 per-world atlas smoke FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
realLog(`MSX2 per-world atlas smoke passed (${checks.length}).`);
realLog('');
realLog('Hardware check -- verified 2026-08-19 on a project with genuinely different worlds:');
realLog('  node test/msx2-boss/decode_world_atlases.mjs <asm>   # find a row the worlds disagree on');
realLog('  "/c/Program Files/openMSX/openmsx.exe" -machine Boosted_MSX2_EN \\');
realLog(`    -cart ${ROM_PATH} -romtype KonamiSCC \\`);
realLog('    -script test/msx2-boss/per_world_atlas_probe.tcl');
realLog('  NOTE: -romtype must come AFTER -cart, or openMSX exits without running the script.');
realLog('  NOTE: the fixture built here clones one world, so its two atlases are IDENTICAL and');
realLog('        no VRAM row can tell them apart. It proves the structure, not the swap. The');
realLog('        swap was verified on a two-world project whose worlds differ (row 545 changed');
realLog('        to world 1 bytes; row 612, past world 1 atlas, did not).');
