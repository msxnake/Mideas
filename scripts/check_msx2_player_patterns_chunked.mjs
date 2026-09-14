#!/usr/bin/env node
// C2-PARCHE acceptance gate (canal [Codex-023]/[ZCode-026]).
// Scope: a new fast_copy_to_vram_chunked helper (256-byte OTIR chunks + tail,
// single R#14/address setup, BC=0 no-op) and ONE call-site change inside
// bitmap_restore_player_sprite_patterns. Everything else must stay
// byte-identical to the pinned pre-patch reference (HEAD 4ee56a26).
//
// Structure assertions on the helper (ordered): early-out BEFORE any VDP
// access; single R#14 set + address latch; chunk loop with `ld b,0` OTIRs;
// tail guarded so exact multiples never issue a zero-size tail; R#14=0 only
// on the non-empty path; no DI/EI, no exx/alternate regs, no mapper calls.
// Negative mutations (drop early-out, drop tail guard, drop R#14 restore)
// must each break the verdict.
//
// Run: node scripts/check_msx2_player_patterns_chunked.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = 'utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts';
const reference = '4ee56a26'; // pre-patch HEAD (A1+B committed, no chunked)
const fixtures = [
  'test/msx2-screen5-fg/fg_fastcopy_fixture.json',
  'test/msx2-screen5-c2trans/fg_patterns1k_fixture.json',
];
const CONFIGS = {
  banked: { generateUnified: true, romMode: 'megarom', targetFormat: 'konami' },
  resident: {},
};

async function loadGenerator(label, pinnedSource) {
  const outfile = join(root, 'work', 'c2-chunked-check', `${label}.mjs`);
  mkdirSync(dirname(outfile), { recursive: true });
  const plugins = pinnedSource == null ? [] : [{
    name: 'pin-room-generator',
    setup(plugin) {
      plugin.onLoad({ filter: /generators[\\/]msx2[\\/]msx2Screen5BitmapRoomGenerator\.ts$/ }, () => ({
        contents: pinnedSource, loader: 'ts', resolveDir: dirname(join(root, modulePath)),
      }));
    },
  }];
  await build({
    stdin: { contents: `export { generateModularASM } from './utils/msxGenerator/index.ts';`, resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent', plugins,
  });
  return import(pathToFileURL(outfile).href);
}

const pinned = execFileSync('git', ['show', `${reference}:${modulePath}`], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const before = await loadGenerator('before', pinned);
const after = await loadGenerator('after', null);

const HELPER = 'fast_copy_to_vram_chunked:';
const RESTORE = 'bitmap_restore_player_sprite_patterns:';
const routineEnd = (text, start) => {
  const next = text.indexOf('\n; ------', start + 1);
  return next === -1 ? text.length : next;
};

// ---- structural verdict helpers (reused by the negative mutations) ----
function assertHelperStructure(text, tag) {
  const hs = text.indexOf(HELPER);
  assert.notEqual(hs, -1, `${tag}: helper emitted`);
  // Body ends at the helper's final instruction (R#14 restore tail), NOT at
  // the next doc separator: the helper is emitted inline among other code
  // and the separator can be far away.
  const doneAt = text.indexOf('.chunked_done:', hs);
  assert.notEqual(doneAt, -1, `${tag}: helper done marker`);
  const jpAt = text.indexOf('jp vdp_write_register', doneAt);
  assert.notEqual(jpAt, -1, `${tag}: helper final jp`);
  const body = text.slice(hs, jpAt + 'jp vdp_write_register'.length);
  // Ordered markers.
  const earlyOut = body.indexOf('ld a, b');
  const orC = body.indexOf('or c');
  const retZ = body.indexOf('ret z');
  const firstVdp = body.indexOf('vdp_write_register');
  assert.ok(earlyOut !== -1 && orC > earlyOut && retZ > orC, `${tag}: BC=0 early-out present`);
  assert.ok(firstVdp === -1 || firstVdp > retZ, `${tag}: early-out BEFORE any VDP access`);
  assert.equal((body.match(/ld a, #0E/g) || []).length, 2, `${tag}: R#14 written exactly twice (set + restore)`);
  const chunkLoop = body.indexOf('.chunked_full:');
  const tail = body.indexOf('.chunked_tail:');
  const done = body.indexOf('.chunked_done:');
  assert.ok(chunkLoop !== -1 && tail > chunkLoop && done > tail, `${tag}: chunk loop -> tail -> done order`);
  assert.match(body, /ld b, 0\s+; OTIR B=0 copies exactly 256 bytes/, `${tag}: full chunks use B=0`);
  assert.match(body, /ld a, e\s+or a\s+jp z, \.chunked_done/, `${tag}: tail guarded (exact multiple skips zero-size tail)`);
  assert.match(body, /\.chunked_done:\s+ld e, 0\s+ld a, #0E\s+jp vdp_write_register/, `${tag}: R#14=0 restore after non-empty copy`);
  // Forbidden inside the helper.
  assert.doesNotMatch(body, /\b(di|ei|exx|ex af|ex de|ex hl)\b/i, `${tag}: no interrupt/alternate-register ops`);
  assert.doesNotMatch(body, /mapper|select_data_bank|restore_resident/i, `${tag}: no mapper calls`);
  assert.doesNotMatch(body, /R#15|R#17|r15|r17/, `${tag}: R#15/R#17 untouched`);
  return body;
}
function assertRestoreCallSite(text, tag) {
  const rs = text.indexOf(RESTORE);
  assert.notEqual(rs, -1, `${tag}: restore emitted`);
  const re = routineEnd(text, rs);
  const body = text.slice(rs, re);
  assert.match(body, /call fast_copy_to_vram_chunked/, `${tag}: restore calls the chunked helper`);
  assert.doesNotMatch(body, /call copy_to_vram_ext/, `${tag}: restore no longer calls the slow copier`);
  return body;
}

for (const fixture of fixtures) {
  for (const [cfgName, config] of Object.entries(CONFIGS)) {
    const raw = JSON.parse(readFileSync(join(root, fixture), 'utf8'));
    const fullConfig = { ...config, screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)' };
    const generate = (impl) => {
      const log = console.log, warn = console.warn, err = console.error;
      try {
        console.log = console.warn = console.error = () => {};
        return impl.generateModularASM(raw.name || 'c2-check', structuredClone(raw.assets), fullConfig);
      } finally { console.log = log; console.warn = warn; console.error = err; }
    };
    const expected = (() => { try { return generate(before); } catch (e) { if (/cannot fit a simple 32KB ROM/.test(String(e))) { console.log(`SKIP [${fixture}/${cfgName}]: needs MegaROM`); return null; } throw e; } })();
    if (expected === null) continue;
    const actual = generate(after);
    const tagName = `[${fixture.split('/').pop()}/${cfgName}]`;

    for (const [name, content] of Object.entries(actual)) {
      if (typeof content !== 'string' || !content.includes(RESTORE)) continue;
      const base = expected[name];
      // The ONLY allowed differences: the whole helper block (label..next
      // doc separator) and the restore call/doc lines. Strip the helper
      // region, mask the call lines, then require line-by-line equality.
      const stripHelper = (text) => {
        let hs = text.indexOf(HELPER);
        if (hs === -1) return text;
        // Include the helper's doc block ('; FUNCTION: ...' header) above it.
        const docAt = text.lastIndexOf('; FUNCTION: fast_copy_to_vram_chunked', hs);
        if (docAt !== -1) {
          // Include the '; ------' separator line that opens the doc block.
          const sepAt = text.lastIndexOf('; ------', docAt);
          if (sepAt !== -1) hs = sepAt;
          else hs = docAt;
        }
        // End at the helper's final instruction (the R#14 restore tail).
        const doneAt = text.indexOf('.chunked_done:', hs);
        assert.notEqual(doneAt, -1, 'helper end marker');
        const jpAt = text.indexOf('jp vdp_write_register', doneAt);
        assert.notEqual(jpAt, -1, 'helper final jp');
        return text.slice(0, hs) + text.slice(text.indexOf('\n', jpAt) + 1);
      };
      // Copier-name normalization ONLY for lines inside the restore routine
      // span, computed on the STRIPPED text (the helper is stripped before
      // restore, so spans align in both stripped arrays). The same call/doc
      // wording appearing anywhere else must fail.
      const spanOf = (lines) => {
        const labelIdx = lines.findIndex(l => l.startsWith(RESTORE));
        assert.notEqual(labelIdx, -1, `${tagName}: restore label in stripped lines`);
        // Span = the whole doc block plus the routine: walk back from the
        // label over the doc block to its opening '; ------' separator.
        let start = labelIdx;
        let seps = 0;
        for (let i = labelIdx - 1; i >= 0 && labelIdx - i < 40; i--) {
          if (lines[i].startsWith('; ------')) { seps++; if (seps === 2) { start = i; break; } }
        }
        let end = lines.length;
        for (let i = labelIdx + 1; i < lines.length; i++) {
          if (lines[i].startsWith('; ------')) { end = i; break; }
        }
        return [start, end];
      };
      const mask = (lines, span) => lines.map((line, i) => {
        const inSpan = i >= span[0] && i < span[1];
        if (inSpan && /^\s*call (copy_to_vram_ext|fast_copy_to_vram_chunked)/.test(line)) return '@call@';
        if (inSpan && /^\s*;   bitmap_room_select_data_bank_a \(MegaROM only\), (copy_to_vram_ext|fast_copy_to_vram_chunked),/.test(line)) return '@doc@';
        return line;
      });
      const linesA = stripHelper(content).split('\n');
      const linesB = stripHelper(base).split('\n');
      const a1 = mask(linesA, spanOf(linesA)).filter(l => l.trim() !== '');
      const b1 = mask(linesB, spanOf(linesB)).filter(l => l.trim() !== '');
      assert.equal(a1.length, b1.length, `${tagName}/${name}: line count after stripping the helper (${a1.length} vs ${b1.length})`);
      for (let i = 0; i < a1.length; i++) {
        assert.equal(a1[i], b1[i], `${tagName}/${name}: line ${i + 1} differs outside the helper + call site\n  base: ${b1[i]}\n  cur : ${a1[i]}`);
      }
      assertHelperStructure(content, `${tagName}/${name}`);
      assertRestoreCallSite(content, `${tagName}/${name}`);
      // Exactly one caller of the helper in the whole image.
      const whole = Object.values(actual).filter(v => typeof v === 'string').join('\n');
      assert.equal((whole.match(/call fast_copy_to_vram_chunked/g) || []).length, 2, `${tagName}: exactly one call site (main+united)`);
    }
  }
}

// ---- negative mutations on an emitted image ----
{
  const raw = JSON.parse(readFileSync(join(root, fixtures[1]), 'utf8'));
  const config = { generateUnified: true, romMode: 'megarom', targetFormat: 'konami' };
  const generate = (impl) => {
    const log = console.log, warn = console.warn, err = console.error;
    try { console.log = console.warn = console.error = () => {}; return impl.generateModularASM('c2-mut', structuredClone(raw.assets), config); }
    finally { console.log = log; console.warn = warn; console.error = err; }
  };
  const files = generate(after);
  const name = Object.keys(files).find(n => typeof files[n] === 'string' && files[n].includes(RESTORE));
  const good = files[name];
  const holds = (text) => { try { assertHelperStructure(text, 'mut'); assertRestoreCallSite(text, 'mut'); return true; } catch { return false; } };
  assert.equal(holds(good), true, 'control: unmutated image passes');

  // Mutations must target the HELPER body only: the same BC=0 early-out
  // pattern exists in other routines, so a global replace would mutate the
  // wrong code and the control would still hold.
  const hStart = good.indexOf(HELPER);
  const hDone = good.indexOf('.chunked_done:', hStart);
  const hJp = good.indexOf('jp vdp_write_register', hDone) + 'jp vdp_write_register'.length;
  const mutateHelper = (re, rep) => {
    const body = good.slice(hStart, hJp);
    const mutated = body.replace(re, rep);
    assert.notEqual(mutated, body, 'mutation applies inside the helper');
    return good.slice(0, hStart) + mutated + good.slice(hJp);
  };

  // M1: drop the BC=0 early-out (ld a,b / or c / ret z).
  const m1 = mutateHelper(/ld a, b\s+or c\s+ret z\s/, '');
  assert.equal(holds(m1), false, 'M1 (no early-out) must fail');

  // M2: drop the exact-multiple tail guard.
  const m2 = mutateHelper(/ld a, e\s+or a\s+jp z, \.chunked_done\s/, 'ld a, e\n');
  assert.equal(holds(m2), false, 'M2 (zero-size tail on exact multiple) must fail');

  // M3: drop the R#14=0 restore.
  const m3 = good.replace(/\.chunked_done:\s+ld e, 0\s+ld a, #0E\s+jp vdp_write_register/, '.chunked_done:\n    ret');
  assert.notEqual(m3, good, 'M3 applies');
  assert.equal(holds(m3), false, 'M3 (R#14 not restored) must fail');

  console.log('PASS: negative mutations detected (M1 early-out, M2 tail guard, M3 R#14 restore)');
}
console.log('PASS: chunked helper confined to helper + restore call site (FG-256B and 1K fixtures, resident+banked)');
console.log('PASS: ordered contract structure (BC=0 no-op before VDP, B=0 chunks, guarded tail, R#14=0 after copy)');
