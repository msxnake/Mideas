#!/usr/bin/env node
// ACUERDO A1 acceptance gate (canal exchange.txt, [Codex-006]/[ZCode-008]).
// Scope: ONLY the two foreground uploads inside bitmap_load_foreground_sprites
// (32-byte mask pattern, 16-byte colour table per slot) switch from the slow
// byte-loop copier to the existing OTIR fast copier. Everything else in the
// generated image must stay byte-identical to the pinned reference commit.
//
// Checks:
//   1. Generated output of the pinned commit vs the working tree differs ONLY
//      inside the bitmap_load_foreground_sprites routine.
//   2. Pinned version uses copy_to_vram_ext with `ld bc,` inside that routine.
//   3. Working-tree version calls fast_copy_to_vram_ext once per upload
//      (2 slots x pattern+colour = 4 calls) and each call is IMMEDIATELY
//      preceded by `ld b, 32` / `ld b, 16`. The counter MUST be B-only:
//      the fast copier overwrites C with the data port, so a leftover
//      `ld bc,32` would leave B=0 and OTIR would copy 256 bytes.
//   4. Both copier definitions still exist exactly once; FG art stays resident
//      (no banked variant), so the direct call is safe in every build mode.
//
// Run: node scripts/check_msx2_fg_vram_fast_copy.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatorIndex = 'utils/msxGenerator/index.ts';
const generatorModule = 'utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts';
const reference = 'cb308f04ad9ead3595f068be01ee28251e34afd1';
const fixturePath = 'test/msx2-screen5-fg/fg_fastcopy_fixture.json';
const FG_LABEL = 'bitmap_load_foreground_sprites:';

async function loadGenerator(label, pinnedModuleSource) {
  const outfile = join(root, 'work', 'fg-fastcopy-check', `${label}.mjs`);
  mkdirSync(dirname(outfile), { recursive: true });
  const plugins = pinnedModuleSource == null ? [] : [{
    name: 'pin-generator-module',
    setup(plugin) {
      plugin.onLoad({ filter: /generators[\\/]msx2[\\/]msx2Screen5BitmapRoomGenerator\.ts$/ }, () => ({
        contents: pinnedModuleSource,
        loader: 'ts',
        resolveDir: dirname(join(root, generatorModule)),
      }));
    },
  }];
  await build({
    // Re-export shim: stdin has no path, so the index must be imported by its
    // real location for its own relative imports to resolve.
    stdin: { contents: `export { generateModularASM } from './${generatorIndex}';`, resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent', plugins,
  });
  return import(pathToFileURL(outfile).href);
}

const currentIndex = readFileSync(join(root, generatorIndex), 'utf8');
// utils/msxGenerator/index.ts is untouched in the working tree, so the pinned
// commit's index equals the current one; only the generator module is pinned.
const pinnedModule = execFileSync('git', ['show', `${reference}:${generatorModule}`], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const before = await loadGenerator('before', pinnedModule);
const after = await loadGenerator('after', null);

const raw = JSON.parse(readFileSync(join(root, fixturePath), 'utf8'));
const config = { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)', targetGraphicsBackend: raw.targetGraphicsBackend || undefined };
const generate = (implementation) => {
  const log = console.log, warn = console.warn, err = console.error;
  try {
    console.log = console.warn = console.error = () => {};
    return implementation.generateModularASM(raw.name || 'fg-fastcopy-check', structuredClone(raw.assets), config);
  } finally { console.log = log; console.warn = warn; console.error = err; }
};

const expected = generate(before);
const actual = generate(after);

assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'same generated file set');

// The only allowed difference is inside the FG routine (label .. fg_colors_offset).
// The generator emits the routine into every output variant (main.asm, unitedFiles.asm).
const ROUTINE_END = 'fg_colors_offset:';
const filesWithRoutine = Object.keys(actual).filter(k => typeof actual[k] === 'string' && actual[k].includes(FG_LABEL));
assert.ok(filesWithRoutine.length >= 1, `fixture must emit ${FG_LABEL}`);
const splitRoutine = (text) => {
  const start = text.indexOf(FG_LABEL);
  const end = text.indexOf(ROUTINE_END, start);
  assert.notEqual(end, -1, 'fg_colors_offset helper must follow the routine');
  return { head: text.slice(0, start), tail: text.slice(end), block: text.slice(start, end) };
};
const assertBlockState = (block, label) => {
  assert.match(block, /call fast_copy_to_vram_ext/, `${label}: patched FG block must call the fast copier`);
  assert.doesNotMatch(block, /call copy_to_vram_ext/, `${label}: patched FG block must not keep any slow call`);
  // Each fast call must be immediately preceded by a B-only count load. The
  // fast copier overwrites C with the data port and OTIR counts with B, so a
  // `ld bc,32` there would leave B=0 and copy 256 bytes of garbage.
  const lines = block.split('\n');
  const fastCalls = lines.filter(l => l.includes('call fast_copy_to_vram_ext')).length;
  assert.equal(fastCalls, 4, `${label}: expected 2 uploads x 2 slots = 4 fast calls, found ${fastCalls}`);
  lines.forEach((line, i) => {
    if (!line.includes('call fast_copy_to_vram_ext')) return;
    let prev = i - 1;
    while (prev >= 0 && !lines[prev].trim()) prev--;
    assert.match(
      lines[prev] || '',
      /^\s*ld b,\s*(32|#20|16|#10)\b/,
      `${label}: each fast call must be immediately preceded by "ld b,32/16", found: ${(lines[prev] || '').trim()}`
    );
  });
  assert.doesNotMatch(block, /ld bc,\s*(32|#20|16|#10)\b/, `${label}: no full-BC loads may feed the fast copier (B=0 -> OTIR copies 256 bytes)`);
};let routineKey = null;
for (const [name, content] of Object.entries(actual)) {
  if (typeof content !== 'string' || !content.includes(FG_LABEL)) {
    assert.equal(content, expected[name], `file ${name} must stay byte-identical`);
    continue;
  }
  const beforeSplit = splitRoutine(expected[name]);
  const afterSplit = splitRoutine(content);
  assert.equal(afterSplit.head, beforeSplit.head, `content before the routine must stay byte-identical (${name})`);
  assert.equal(afterSplit.tail, beforeSplit.tail, `content after the routine must stay byte-identical (${name})`);
  assert.match(beforeSplit.block, /ld bc,\s*32\b/, `pinned FG block must load bc,32 for the pattern upload (${name})`);
  assert.match(beforeSplit.block, /ld bc,\s*16\b/, `pinned FG block must load bc,16 for the colour upload (${name})`);
  assert.match(beforeSplit.block, /call copy_to_vram_ext/, `pinned FG block must call the slow copier (${name})`);
  assert.doesNotMatch(beforeSplit.block, /fast_copy_to_vram_ext/, `pinned FG block must not call the fast copier (${name})`);
  assertBlockState(afterSplit.block, name);
  routineKey = name;
}

// Per-file invariants: every output variant carrying the runtime embeds its
// own copy of both copiers (main.asm and unitedFiles.asm), so uniqueness is
// checked within each file, never across the concatenation.
const all = Object.values(actual).filter(v => typeof v === 'string');
for (const [index, content] of all.entries()) {
  if (content.includes('\nfast_copy_to_vram_ext:') || content.startsWith('fast_copy_to_vram_ext:')) {
    assert.equal((content.match(/^fast_copy_to_vram_ext:/gm) || []).length, 1, `file #${index}: fast copier definition must remain unique`);
  }
  if (content.includes('\ncopy_to_vram_ext:') || content.startsWith('copy_to_vram_ext:')) {
    assert.equal((content.match(/^copy_to_vram_ext:/gm) || []).length, 1, `file #${index}: slow copier definition must remain (other call sites)`);
  }
}
assert.doesNotMatch(all.join('\n'), /bitmap_room_foreground_patterns_DATA_BANK/, 'FG art must stay resident; a banked variant needs the wrapper, not a direct fast call');

console.log(`PASS: A1 scope confined to the FG routine in ${filesWithRoutine.length} generated file(s) (e.g. ${routineKey})`);
console.log('PASS: FG uploads call fast_copy_to_vram_ext (4 calls, B counts 32/16), rest byte-identical');
