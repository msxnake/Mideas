#!/usr/bin/env node
// CONTRATO B acceptance gate (canal exchange.txt [Codex-011]/[ZCode-013]/[Codex-013]).
// Scope: bitmap_update_enemy_colors gains a per-slot colour cache
// ({offset, valid} = 2 bytes/slot at the END of the subsystem RAM),
// bitmap_load_enemies invalidates all cached slots on room load.
// Nothing else may change vs the pinned baseline enemy generator.
//
// Checks per fixture (resident and banked generation):
//   1. SEQUENCE diff: outside the two contracted routines every line must be
//      identical, with the single allowed variation of RAM equates whose
//      address shifts by EXACTLY 2*maxSlots (the cache reserve).
//   2. bitmap_load_enemies: xor a followed by one valid=0 store per slot with
//      no intervening A mutation.
//   3. bitmap_update_enemy_colors, per slot block, ORDERED: valid check,
//      or a, jp z upload, key load, cp e, jp nz upload, skip -> done, upload,
//      key store, colours offset call, copy call, valid=1 AFTER the copy.
//   4. Cache equates: valid = keys + maxSlots; no other EQU label inside the
//      cache address range; RAM map total grows by exactly 2*maxSlots.
//   5. Negative mutations (drop invalidation, break cp, hoist valid=1) must
//      each make the structural verdict fail.
//
// Run: node scripts/check_msx2_enemy_color_cache.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const enemyModule = 'utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator.ts';
const reference = 'cb308f04ad9ead3595f068be01ee28251e34afd1';
const fixtures = [
  'test/msx2-behavior/fixture_scripted_enemy.json',
  'test/msx2-bats/test501_bats.json',
  'test/msx2-slime/fixture_slime_mix.json',
];
const CONFIGS = {
  resident: {},
  banked: { generateUnified: true, romMode: 'megarom', targetFormat: 'konami' },
};

async function loadGenerator(label, pinnedModuleSource) {
  const outfile = join(root, 'work', 'enemy-color-cache-check', `${label}.mjs`);
  mkdirSync(dirname(outfile), { recursive: true });
  const plugins = pinnedModuleSource == null ? [] : [{
    name: 'pin-enemy-module',
    setup(plugin) {
      plugin.onLoad({ filter: /generators[\\/]msx2[\\/]msx2BitmapEnemyGenerator\.ts$/ }, () => ({
        contents: pinnedModuleSource,
        loader: 'ts',
        resolveDir: dirname(join(root, enemyModule)),
      }));
    },
  }];
  await build({
    stdin: { contents: `export { generateModularASM } from './utils/msxGenerator/index.ts';`, resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent', plugins,
  });
  return import(pathToFileURL(outfile).href);
}

const pinnedModule = execFileSync('git', ['show', `${reference}:${enemyModule}`], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const before = await loadGenerator('before', pinnedModule);
const after = await loadGenerator('after', null);

const LOAD_ANCHOR = '; FUNCTION: bitmap_load_enemies';
const UPDATE_ANCHOR = '; FUNCTION: bitmap_update_enemy_colors';

function splitSegments(text) {
  const loadA = text.indexOf(LOAD_ANCHOR);
  const loadL = text.indexOf('bitmap_load_enemies:', loadA);
  const loadEnd = text.indexOf('\n; ------', loadL) + 1;
  const updA = text.indexOf(UPDATE_ANCHOR);
  const updL = text.indexOf('bitmap_update_enemy_colors:', updA);
  const updEnd = text.indexOf('\n; ------', updL) + 1;
  assert.ok(loadA !== -1 && loadL !== -1 && updA !== -1 && updL !== -1 && loadEnd > loadL && updEnd > updL, 'routine anchors must exist');
  return {
    pre: text.slice(0, loadA),
    load: text.slice(loadA, loadEnd),
    mid: text.slice(loadEnd, updA),
    update: text.slice(updA, updEnd),
    post: text.slice(updEnd),
  };
}

const EQU_RE = /^(\w+)\s+EQU #([0-9A-F]{4})$/;
function maxSlotsOf(text) {
  const idx = [...text.matchAll(/^\.color_slot_(\d+):/gm)].map(m => parseInt(m[1], 10) + 1);
  const fromMap = parseInt(text.match(/ENEMY runtime state \(\d+ bytes\): count \+ (\d+) slot/)?.[1] || '0', 10);
  return Math.max(...idx, fromMap);
}
// Canonicalise RAM equates: baseline keeps its own address; the patched text
// may shift a label's address by EXACTLY 2*maxSlots (the cache reserve).
// Cache-specific lines (equates handled above; cache map comments) are DROPPED
// from both sides so their presence alone cannot hide other changes.
function canonicalize(lines, base, maxSlots) {
  return lines
    .filter(line => !/colour cache|bitmap_enemy_color_(keys|valid)/i.test(line))
    .map(line => {
      // The exact byte-total growth is asserted numerically in assertEquates.
      line = line.replace(/ENEMY runtime state \(\d+ bytes\)/, 'ENEMY runtime state (N bytes)');
      const m = line.match(EQU_RE);
      if (!m) return line;
      const [, label, hex] = m;
      const baseAddr = base.get(label);
      if (baseAddr === undefined) return `${label} @new`;
      const addr = parseInt(hex, 16);
      const shift = addr - baseAddr;
      if (shift === 0) return `${label} @base`;
      if (shift === 2 * maxSlots) return `${label} @base`;
      return `${label} EQU #${hex} (UNEXPECTED SHIFT ${shift})`;
    });
}

function assertSequence(context, baseSeg, curSeg, baseEquMap, curEquMap, maxSlots) {
  const a = canonicalize(baseSeg.split('\n'), baseEquMap, maxSlots);
  const b = canonicalize(curSeg.split('\n'), curEquMap, maxSlots);
  assert.equal(b.length, a.length, `${context}: line count must match`);
  for (let i = 0; i < a.length; i++) {
    assert.equal(b[i], a[i], `${context}: line ${i + 1} must be identical (only cache-shifted equates allowed)\n  baseline: ${a[i]}\n  current : ${b[i]}`);
  }
}

function assertLoadInvalidation(loadSeg, maxSlots, tag) {
  const xor = loadSeg.indexOf('\n    xor a\n');
  assert.notEqual(xor, -1, `${tag}: load must contain "xor a" before the invalidation stores`);
  let pos = xor;
  for (let slot = 0; slot < maxSlots; slot++) {
    const store = loadSeg.indexOf(`ld (bitmap_enemy_color_valid + ${slot}), a`, pos);
    assert.notEqual(store, -1, `${tag}: load must clear valid for slot ${slot} after xor a`);
    const between = loadSeg.slice(pos, store);
    assert.doesNotMatch(between, /ld a,/, `${tag}: A must stay zero between xor a and slot ${slot} store`);
    pos = store;
  }
}

function assertUpdateStructure(updateSeg, maxSlots, tag) {
  for (let slot = 0; slot < maxSlots; slot++) {
    const start = updateSeg.indexOf(`.color_slot_${slot}:`);
    const end = updateSeg.indexOf(`.color_slot_${slot}_done:`, start);
    assert.ok(start !== -1 && end !== -1, `${tag}: slot ${slot} block must exist`);
    const block = updateSeg.slice(start, end);
    const order = [];
    const want = [
      [`ld a, (bitmap_enemy_color_valid + ${slot})`, 'valid load'],
      ['or a', 'or a'],
      [`jp z, .color_slot_${slot}_upload`, 'jp z upload'],
      [`ld a, (bitmap_enemy_color_keys + ${slot})`, 'key load'],
      ['cp e', 'cp e (offset compare)'],
      [`jp nz, .color_slot_${slot}_upload`, 'jp nz upload'],
      [`.color_slot_${slot}_skip:`, 'skip label'],
      [`jp .color_slot_${slot}_done`, 'jp done'],
      [`.color_slot_${slot}_upload:`, 'upload label'],
      [`ld (bitmap_enemy_color_keys + ${slot}), a`, 'key store'],
      ['call bitmap_enemy_colors_offset', 'colours offset call'],
    ];
    let pos = 0;
    for (const [needle, what] of want) {
      const at = block.indexOf(needle, pos);
      assert.notEqual(at, -1, `${tag}: slot ${slot} missing ${what} in order (after char ${pos})`);
      order.push(what); pos = at + needle.length;
    }
    // The copy: either direct or banked wrapper; exactly one, after the offset call.
    const copies = ['.color_slot_' + slot + '_x', 'call copy_to_vram_ext', 'call bitmap_copy_banked_to_vram']
      .filter(n => block.indexOf(n, pos) !== -1);
    void copies;
    const copyCall = ['call copy_to_vram_ext', 'call bitmap_copy_banked_to_vram'].map(n => block.indexOf(n, pos)).filter(i => i !== -1);
    assert.equal(copyCall.length, 1, `${tag}: slot ${slot} must have exactly one copy call after the offset call`);
    const copyAt = copyCall[0];
    const copyLine = block.slice(copyAt).split('\n')[0];
    const validAt = block.indexOf(`ld (bitmap_enemy_color_valid + ${slot}), a`, copyAt);
    assert.notEqual(validAt, -1, `${tag}: slot ${slot} valid=1 must come AFTER the copy call (${copyLine.trim()})`);
    const preCopy = block.slice(0, copyAt);
    assert.doesNotMatch(preCopy, new RegExp(`ld \\(bitmap_enemy_color_valid \\+ ${slot}\\), a`), `${tag}: slot ${slot} must not set valid BEFORE the copy`);
    order.push('copy', 'valid=1 after copy');
    void order;
  }
}

function assertEquates(text, baselineText, maxSlots, tag) {
  const keys = text.match(/bitmap_enemy_color_keys EQU #([0-9A-F]{4})/);
  const valid = text.match(/bitmap_enemy_color_valid EQU #([0-9A-F]{4})/);
  assert.ok(keys && valid, `${tag}: cache equates must be emitted`);
  const keysAddr = parseInt(keys[1], 16);
  const validAddr = parseInt(valid[1], 16);
  assert.equal(validAddr, keysAddr + maxSlots, `${tag}: valid must follow keys (+maxSlots)`);
  // No other EQU label inside the cache range.
  for (const line of text.split('\n')) {
    const m = line.match(/^(\w+)\s+EQU #([0-9A-F]{4})$/);
    if (!m || m[1].startsWith('bitmap_enemy_color_')) continue;
    const addr = parseInt(m[2], 16);
    assert.ok(addr < keysAddr || addr >= validAddr + maxSlots, `${tag}: ${m[1]} overlaps the cache range`);
  }
  // RAM map total grows by exactly 2*maxSlots.
  const oldTotal = parseInt(baselineText.match(/ENEMY runtime state \((\d+) bytes\)/)[1], 16 * 0 + 10);
  const newTotal = parseInt(text.match(/ENEMY runtime state \((\d+) bytes\)/)[1], 10);
  assert.equal(newTotal, oldTotal + 2 * maxSlots, `${tag}: RAM map must grow exactly 2*maxSlots (old=${oldTotal}, new=${newTotal})`);
}

for (const fixture of fixtures) {
  for (const [cfgName, config] of Object.entries(CONFIGS)) {
    const raw = JSON.parse(readFileSync(join(root, fixture), 'utf8'));
    const fullConfig = { ...config, screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)', targetGraphicsBackend: raw.targetGraphicsBackend || undefined };
    const generate = (implementation) => {
      const log = console.log, warn = console.warn, err = console.error;
      try {
        console.log = console.warn = console.error = () => {};
        return implementation.generateModularASM(raw.name || 'enemy-cache-check', structuredClone(raw.assets), fullConfig);
      } finally { console.log = log; console.warn = warn; console.error = err; }
    };
    const expected = (() => { try { return generate(before); } catch (e) { if (/cannot fit a simple 32KB ROM/.test(String(e))) { console.log(`SKIP [${fixture}/${cfgName}]: fixture requires MegaROM (${String(e).slice(0, 60)}...)`); return null; } throw e; } })();
    if (expected === null) continue;
    const actual = generate(after);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `[${fixture}/${cfgName}] same generated file set`);

    const tagName = `[${fixture}/${cfgName}]`;
    for (const [name, content] of Object.entries(actual)) {
      if (typeof content !== 'string' || !content.includes(UPDATE_ANCHOR)) continue;
      const base = expected[name];
      const baseSeg = splitSegments(base);
      const curSeg = splitSegments(content);
      const maxSlots = maxSlotsOf(content);
      assert.ok(maxSlots >= 1, `${tagName}: could not derive slot count`);
      const baseEquMap = new Map([...base.matchAll(/^(\w+)\s+EQU #([0-9A-F]{4})$/gm)].map(m => [m[1], parseInt(m[2], 16)]));
      const curEquMap = new Map([...content.matchAll(/^(\w+)\s+EQU #([0-9A-F]{4})$/gm)].map(m => [m[1], parseInt(m[2], 16)]));
      assertSequence(`${tagName}/${name} pre`, baseSeg.pre, curSeg.pre, baseEquMap, curEquMap, maxSlots);
      assertSequence(`${tagName}/${name} mid`, baseSeg.mid, curSeg.mid, baseEquMap, curEquMap, maxSlots);
      assertSequence(`${tagName}/${name} post`, baseSeg.post, curSeg.post, baseEquMap, curEquMap, maxSlots);
      assertLoadInvalidation(curSeg.load, maxSlots, `${tagName}/${name} load`);
      assertUpdateStructure(curSeg.update, maxSlots, `${tagName}/${name} update`);
      assertEquates(content, base, maxSlots, `${tagName}/${name}`);
    }
  }
}

// --- negative mutations on the emitted ASM: the verdict helper must fail ---
{
  const raw = JSON.parse(readFileSync(join(root, fixtures[0]), 'utf8'));
  const fullConfig = { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: raw.screenMode || 'SCREEN 4 (Graphics II)' };
  const log = console.log, warn = console.warn, err = console.error;
  let files;
  try {
    console.log = console.warn = console.error = () => {};
    files = after.generateModularASM(raw.name || 'enemy-cache-check', structuredClone(raw.assets), fullConfig);
  } finally { console.log = log; console.warn = warn; console.error = err; }
  const name = Object.keys(files).find(n => files[n].includes(UPDATE_ANCHOR));
  const good = files[name];

  const structureHolds = (text) => {
    try {
      const seg = splitSegments(text);
      const maxSlots = maxSlotsOf(text);
      assertLoadInvalidation(seg.load, maxSlots, 'mut');
      assertUpdateStructure(seg.update, maxSlots, 'mut');
      return true;
    } catch { return false; }
  };
  assert.equal(structureHolds(good), true, 'control: unmutated text must pass structure');

  // M1: drop the load-segment invalidation stores only.
  const segA = good.indexOf(LOAD_ANCHOR);
  const segEnd = good.indexOf('\n; ------', good.indexOf('bitmap_load_enemies:', segA)) + 1;
  const m1 = good.slice(0, segA)
    + good.slice(segA, segEnd).split('\n').filter(l => !l.trim().startsWith('ld (bitmap_enemy_color_valid +')).join('\n')
    + good.slice(segEnd);
  assert.equal(structureHolds(m1), false, 'mutation M1 (drop invalidation) must fail');

  // M2: break the offset compare (cp e -> cp 1) in EVERY slot block.
  const m2 = good.replace(/\n    cp e\r?\n/g, '\n    cp 1\n');
  assert.notEqual(m2, good, 'mutation M2 must apply');
  assert.equal(structureHolds(m2), false, 'mutation M2 (cp e -> cp 1) must fail');

  // M3: hoist valid=1 ahead of the copy call.
  const m3 = good.replace(/(call (?:bitmap_copy_banked_to_vram|copy_to_vram_ext)[^\n]*\r?\n)(    ld a, 1\r?\n    ld \(bitmap_enemy_color_valid \+ \d+\), a)/g, '$2$1');
  assert.notEqual(m3, good, 'mutation M3 must apply');
  assert.equal(structureHolds(m3), false, 'mutation M3 (valid=1 hoisted before copy) must fail');

  console.log('PASS: negative mutations detected (M1 invalidation dropped, M2 compare broken, M3 valid hoisted)');
}
console.log('PASS: enemy colour cache confined to load/update; sequence diff clean; equates sane');
console.log('PASS: per-slot valid/compare/skip/upload ordered structure with key before copy and valid=1 after copy');
