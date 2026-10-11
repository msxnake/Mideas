#!/usr/bin/env node
/**
 * bitmap_load_enemies walks the enemy slots with ONE loop from BITMAP_ENEMY_LOAD_LOOP_MIN_SLOTS slots up and stays unrolled below it.
 *
 *   node scripts/check_msx2_enemy_load_loop.mjs [--reference <commit>] [--quiet]
 *
 * What is pinned (every number comes from assembling the real emitted routine with server/glass.jar):
 *   1. THRESHOLD    for every shape (resident / banked art x plain / slime / scripted+path+clip x compact / own art) the loop is used
 *                   exactly when slots >= N, and N is the BREAK-EVEN: at N the loop routine (plus the destination table it reads) is strictly
 *                   smaller than the unrolled one forced for the same project, and at N-1 it is not smaller.
 *   2. BELOW N      the unrolled emission is byte for byte the one of the reference commit (equates, routines and data), so projects under
 *                   the threshold keep an identical ROM.
 *   3. BUDGET       8 slots of the soldier build (compact, scripted+path+clip) fit in <= 300 bytes.
 *   4. STRUCTURE    the loop advances IX by the room record stride and IY by the pool stride, starts IY at bitmap_enemy_pool, seeds exactly
 *                   the pool bytes the unrolled slot 0 seeds from the same record bytes, keeps IX/IY (push/pop), keeps its stack balanced and
 *                   never lets the loop state word (pushed per iteration) be popped early. Negative controls: each mutation below must fail.
 *
 * Run from the repo root. Needs java (glass.jar) and git (the reference commit).
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const referenceArg = args.indexOf('--reference');
const REFERENCE = referenceArg >= 0 ? args[referenceArg + 1] : 'f69b62077';   // HEAD the loop was written against
const enemyModule = 'utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator.ts';
const log = (...a) => { if (!quiet) console.log(...a); };
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_load_loop_'));

async function bundle(label, pinnedSource) {
  const outfile = path.join(out, `${label}.mjs`);
  const plugins = pinnedSource == null ? [] : [{
    name: 'pin-enemy-module',
    setup(p) {
      p.onLoad({ filter: /generators[\\/]msx2[\\/]msx2BitmapEnemyGenerator\.ts$/ }, () => ({ contents: pinnedSource, loader: 'ts', resolveDir: path.dirname(path.join(root, enemyModule)) }));
    },
  }];
  await build({
    stdin: { resolveDir: root, loader: 'ts', contents: `
export * from './${enemyModule.replace(/\.ts$/, '')}';
export { compactBitmapEnemyPatterns } from './utils/msxGenerator/generators/msx2/msx2BitmapEnemyPatternCompaction';` },
    bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'silent', plugins,
  });
  return import(pathToFileURL(outfile).href);
}
const referenceSource = execFileSync('git', ['show', `${REFERENCE}:${enemyModule}`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const cur = await bundle('current', null);
const ref = await bundle('reference', referenceSource);
const MIN = cur.BITMAP_ENEMY_LOAD_LOOP_MIN_SLOTS;
assert.ok(Number.isInteger(MIN) && MIN >= 2, 'BITMAP_ENEMY_LOAD_LOOP_MIN_SLOTS is an integer >= 2 (one slot never wins)');

// ---- synthetic projects: every shape of the loader ---------------------------------------------------------------------------------
const SHAPES = [
  { name: 'plain, resident art, own patterns', slime: false, scripted: false, banked: false, compact: false },
  { name: 'plain, banked art, own patterns', slime: false, scripted: false, banked: true, compact: false },
  { name: 'plain, resident art, shared patterns', slime: false, scripted: false, banked: false, compact: true },
  { name: 'soldier build (scripted+path+clip), banked, shared patterns', slime: false, scripted: true, banked: true, compact: true, programs: true },
  { name: 'scripted, banked, own patterns', slime: false, scripted: true, banked: true, compact: false },
  { name: 'slime mix (pair+quad art), banked, own patterns', slime: true, scripted: false, banked: true, compact: false, variants: n => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 4 : 2)) },
  { name: 'slime, all pair art, resident, own patterns', slime: true, scripted: false, banked: false, compact: false, variants: n => Array(n).fill(2) },
  { name: 'slime, all quad art, banked, own patterns', slime: true, scripted: false, banked: true, compact: false, variants: n => Array(n).fill(4) },
  { name: 'every engine (slime+gear+bats+scripted+path+clip+konami), banked, own patterns', slime: true, gear: true, fly8: true, konami: true, scripted: true, banked: true, compact: false, programs: true, variants: n => Array(n).fill(4) },
  { name: 'gear + bats, resident, own patterns', slime: false, gear: true, fly8: true, scripted: false, banked: false, compact: false },
  { name: 'slime, banked, shared patterns', slime: true, scripted: false, banked: true, compact: true, variants: n => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 4 : 2)) },
];
const hex = n => `#${n.toString(16).toUpperCase()}`;
function makeData(shape, n) {
  const stride = 22 + (shape.slime ? 1 : 0) + (shape.gear ? 2 : 0) + (shape.fly8 ? 1 : 0) + (shape.scripted ? 1 : 0);
  const variants = shape.variants ? shape.variants(n) : Array(n).fill(2);
  const maxFrames = 2;
  const patternGroupOffsets = []; let groups = 0;
  for (const v of variants) { patternGroupOffsets.push(groups); groups += maxFrames * v; }
  const romVariants = shape.slime ? 4 : 2;
  const patternBytes = [], colorBytes = [];
  const record = slot => {
    const r = new Array(stride).fill(0);
    // x,y,dx,dy,minX,maxX,minY,maxY, patOff, colOff, frames, delay, mode, xOff, yOff, damage, hitX, hitY, hitW, hitH, speed, interval
    Object.assign(r, { 0: 40 + slot, 1: 60, 2: 1, 4: 8, 5: 200, 8: slot * maxFrames * romVariants, 9: slot * maxFrames, 10: maxFrames, 11: 6, 12: shape.scripted ? 14 : 0, 15: 1, 20: 1, 21: 3 });
    return r;
  };
  for (let slot = 0; slot < n; slot++) {
    for (let g = 0; g < maxFrames * romVariants; g++) for (let b = 0; b < 32; b++) patternBytes.push(shape.compact ? (b * 5 + 3) & 0xFF : (b === 0 ? slot * 16 + g : g * 17 + b * 3 + slot) & 0xFF);   // byte 0 differs per group: nothing can be shared
    for (let b = 0; b < maxFrames * 16; b++) colorBytes.push((slot + b) & 0x0F);
  }
  const emptyRecord = new Array(stride).fill(0); emptyRecord[11] = 1; emptyRecord[18] = 16; emptyRecord[19] = 16;
  const roomFull = [n, ...Array.from({ length: n }, (_, s) => record(s)).flat()];
  const roomOne = [1, ...record(0), ...Array.from({ length: n - 1 }, () => emptyRecord).flat()];
  const roomEmpty = [0, ...Array.from({ length: n }, () => emptyRecord).flat()];
  const programs = shape.programs ? [
    { id: 'p0', name: 'walker', bytes: [0xFF, 0x00], clip: true },
    { id: 'p1', name: 'path', bytes: [0xFF, 0x00], kind: 'path_follow' },
  ] : [];
  let data = {
    maxSlots: n, maxFrames, roomTables: [roomFull, roomOne, roomEmpty], patternBytes, colorBytes,
    slimeEnabled: shape.slime, gearEnabled: Boolean(shape.gear), fly8Enabled: Boolean(shape.fly8), scriptedEnabled: shape.scripted,
    ...(shape.konami ? { konamiPaths: [{ bytes: new Array(8).fill(0), loop: true }], konamiRoomPaths: [[], [], []].map(() => Array(n).fill(-1)) } : {}),
    scriptedBehaviorPrograms: programs, patternGroupOffsets, patternVariantCounts: variants, patternGroupCount: groups,
  };
  if (shape.compact) {
    data = cur.compactBitmapEnemyPatterns(data);
    assert.ok(data.compactPatterns, `${shape.name} n=${n}: the synthetic art must select the shared-pattern runtime`);
  } else {
    assert.ok(!cur.compactBitmapEnemyPatterns(data).compactPatterns, `${shape.name} n=${n}: the synthetic art must keep the own-pattern runtime`);
  }
  return data;
}
const optsFor = (shape, extra = {}) => ({
  ramBase: 0xD000, satBase: 0xF600, colorBase: 0xF400, patternGroupBase: 8, gameYOffset: 20,
  playerHitbox: { x: 0, y: 0, w: 16, h: 16 }, damageInvulnFrames: 60, bankedSpriteData: shape.banked,
  // Keep the other per-slot routines unrolled so this check compares bitmap_load_enemies only (the SAT loop has its own check).
  satLoopMinSlots: 99, ...extra,
});
const emit = (mod, shape, n, extra) => mod.buildBitmapEnemySystemAsm(makeData(shape, n), optsFor(shape, extra));

// ---- assembling the routine on its own ------------------------------------------------------------------------------------------------
const glass = path.join(root, 'server', 'glass.jar');
function routineText(asm, label) {
  const start = asm.indexOf(`\n${label}:`);
  assert.ok(start >= 0, `routine ${label} is emitted`);
  const tail = asm.slice(start + 1);
  const end = tail.slice(label.length + 1).search(/^[A-Za-z_]\w*:/m);
  return end < 0 ? tail : tail.slice(0, label.length + 1 + end);
}
function descBytes(dataAsm) {
  const i = dataAsm.indexOf('bitmap_enemy_load_desc:');
  if (i < 0) return 0;
  let bytes = 0;
  for (const line of dataAsm.slice(i).split('\n').slice(1)) {
    if (/^\s+DW /.test(line)) bytes += 2; else if (/^\s+DB /.test(line)) bytes += 1; else break;
  }
  return bytes;
}
let asmCounter = 0;
const NOT_SYMBOLS = new Set('ld push pop ldir ldi add adc sub sbc cp or and xor inc dec jp jr call ret djnz ex nop rlca rrca rla rra sla sra srl bit set res a b c d e h l af bc de hl ix iy sp nz z nc po pe p m ds db dw org equ'.split(' '));
function routineSize(system) {
  const body = routineText(`\n${system.routinesAsm}`, 'bitmap_load_enemies');
  // Everything the loader refers to but does not define (helper routines, tables, bank numbers) becomes an EQU: only its own bytes are counted.
  const defined = new Set([...`${system.equates}\n${body}`.matchAll(/^([A-Za-z_]\w*)(?::|\s+EQU\b)/gm)].map(m => m[1]));
  const used = new Set();
  for (const line of body.split('\n')) {
    const code = line.replace(/;.*$/, '').replace(/^\s*[A-Za-z_.]\w*:/, '');
    for (const m of code.matchAll(/(?<![\w.#])([A-Za-z_]\w*)/g)) {
      if (!NOT_SYMBOLS.has(m[1].toLowerCase()) && !defined.has(m[1])) used.add(m[1]);
    }
  }
  const src = `    ORG #4000\n${system.equates}\n${[...used].map(name => `${name} EQU #8000`).join('\n')}\n${body}\nload_end:\n`;
  const base = path.join(out, `size_${asmCounter++}`);
  fs.writeFileSync(`${base}.asm`, src);
  try {
    execFileSync('java', ['-jar', glass, `${base}.asm`, `${base}.rom`, `${base}.sym`], { cwd: root, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`glass failed on the extracted routine (${base}.asm):\n${`${e.stdout || ''}${e.stderr || ''}`.slice(0, 600)}`);
  }
  const sym = fs.readFileSync(`${base}.sym`, 'utf8');
  const addr = name => parseInt(sym.match(new RegExp(`^${name}: equ ([0-9A-F]+)H`, 'm'))[1], 16);
  return addr('load_end') - addr('bitmap_load_enemies');
}
// Subroutines the loader calls are stubbed by the symbol loop above (EQU #8000), so only the loader's own bytes are counted.

// ---- 1 + 2 + 3: threshold, byte-identical unrolled output, budget ---------------------------------------------------------------------
const rows = [];
for (const shape of SHAPES) {
  const sizes = {};
  for (const n of [1, 2, 3, 4, 8]) {
    const looped = emit(cur, shape, n, { loadLoopMinSlots: 1 });
    const unrolled = emit(cur, shape, n, { loadLoopMinSlots: 99 });
    const natural = emit(cur, shape, n);
    const isLoop = text => /^\.benemy_loop:/m.test(text);
    assert.equal(isLoop(looped.routinesAsm), true, `${shape.name} n=${n}: forced loop emits the loop`);
    assert.equal(isLoop(unrolled.routinesAsm), false, `${shape.name} n=${n}: forced unrolled has no loop`);
    assert.equal(isLoop(natural.routinesAsm), n >= MIN, `${shape.name} n=${n}: the loop is used exactly from ${MIN} slots up`);
    assert.equal(natural.routinesAsm, (n >= MIN ? looped : unrolled).routinesAsm, `${shape.name} n=${n}: natural emission is one of the two shapes`);
    const loopBytes = routineSize(looped) + descBytes(looped.dataAsm);
    const unrolledBytes = routineSize(unrolled) + descBytes(unrolled.dataAsm);
    sizes[n] = { loopBytes, unrolledBytes };
    if (n >= MIN) assert.ok(loopBytes < unrolledBytes, `${shape.name} n=${n}: loop (${loopBytes} B incl. table) must be smaller than unrolled (${unrolledBytes} B)`);
    else assert.ok(unrolledBytes <= loopBytes, `${shape.name} n=${n}: below ${MIN} slots the unrolled code (${unrolledBytes} B) must not be bigger than the loop (${loopBytes} B)`);
    // BELOW the threshold: the whole emission is the reference commit's, byte for byte.
    if (n < MIN) {
      const old = emit(ref, shape, n);
      assert.equal(natural.routinesAsm, old.routinesAsm, `${shape.name} n=${n}: routines identical to ${REFERENCE}`);
      assert.equal(natural.dataAsm, old.dataAsm, `${shape.name} n=${n}: data identical to ${REFERENCE}`);
      assert.equal(natural.equates, old.equates, `${shape.name} n=${n}: equates identical to ${REFERENCE}`);
    }
    // The shared field template must not have changed the unrolled output at any slot count.
    assert.equal(unrolled.routinesAsm, emit(ref, shape, n).routinesAsm, `${shape.name} n=${n}: forced-unrolled routines identical to ${REFERENCE}`);
    assert.equal(unrolled.dataAsm, emit(ref, shape, n).dataAsm, `${shape.name} n=${n}: forced-unrolled data identical to ${REFERENCE}`);
  }
  rows.push({ shape: shape.name, sizes });
  if (shape.name.startsWith('soldier build')) {
    assert.ok(sizes[8].loopBytes <= 300, `soldier build, 8 slots: loop routine must stay within 300 bytes (is ${sizes[8].loopBytes})`);
  }
}
log('bitmap_load_enemies bytes (loop incl. its destination table / unrolled), by slot count:');
for (const r of rows) log(`  ${r.shape.padEnd(62)} ` + Object.entries(r.sizes).map(([n, s]) => `${n}: ${s.loopBytes}/${s.unrolledBytes}`).join('  '));

// ---- 4: structure of the loop -------------------------------------------------------------------------------------------------------
const soldier = SHAPES.find(s => s.name.startsWith('soldier build'));
const ownArt = SHAPES.find(s => s.name === 'slime mix (pair+quad art), banked, own patterns');
function structureErrors(text, system, unrolledText, expect) {
  const errors = [];
  const count = (re) => (text.match(re) || []).length;
  if (count(/^\.benemy_loop:/gm) !== 1) errors.push('exactly one .benemy_loop');
  if (count(/^\.benemy_slot_\d/gm) !== 0) errors.push('no unrolled slot labels');
  if (!text.includes(`    ld bc, ${expect.tableStride}\n    add ix, bc`)) errors.push(`IX advances by the record stride ${expect.tableStride}`);
  if (!text.includes(`    ld bc, ${expect.poolStride}\n    add iy, bc`)) errors.push(`IY advances by the pool stride ${expect.poolStride}`);
  if (!text.includes('    ld iy, bitmap_enemy_pool\n')) errors.push('IY starts at bitmap_enemy_pool');
  if (count(/^    push iy$/gm) !== 2 || count(/^    pop iy$/gm) !== 1) errors.push('IY is saved once and restored once (plus the pool pointer copy)');
  if (!/jp z, \.benemy_slots_done/.test(text)) errors.push('an empty room skips the loop');
  if (!/    dec b\n    jp nz, \.benemy_loop/.test(text)) errors.push('dec b / jp nz closes the loop (the body is longer than djnz reaches)');
  if (/djnz/.test(text)) errors.push('no djnz');
  // pool bytes: the loop stores (iy+N) from the same record bytes as the unrolled slot 0 stores (pool + 0 + N)
  const unrolledStores = [...unrolledText.matchAll(/\(bitmap_enemy_pool \+ 0 \+ (\d+)\)/g)].map(m => Number(m[1]));
  const loopStores = [...text.matchAll(/\(iy\+(\d+)\)/g)].map(m => Number(m[1]));
  if (JSON.stringify(loopStores) !== JSON.stringify(unrolledStores)) errors.push(`pool stores equal the unrolled slot 0 stores in order (${loopStores.join(',')} vs ${unrolledStores.join(',')})`);
  // the record bytes read to SEED the pool (everything before the first VRAM upload comment)
  const seedPart = t => t.slice(0, t.search(/^    ; (--- upload|Patterns already uploaded)/m));
  const unrolledReads = [...seedPart(unrolledText.slice(unrolledText.indexOf('.benemy_slot_0:'))).matchAll(/\(ix\+(\d+)\)/g)].map(m => Number(m[1]));
  const loopReads = [...seedPart(text.slice(text.indexOf('.benemy_loop:'))).matchAll(/\(ix\+(\d+)\)/g)].map(m => Number(m[1]));
  if (JSON.stringify(loopReads) !== JSON.stringify(unrolledReads)) errors.push(`record reads equal the unrolled slot 0 reads in order (${loopReads.join(',')} vs ${unrolledReads.join(',')})`);
  // stack: balanced per iteration, the loop state word (pushed right after bc) is never popped before the epilogue
  let depth = 0, min = Infinity, started = false, exSp = 0;
  for (const line of text.split('\n')) {
    if (/^\.benemy_loop:/.test(line)) { started = true; depth = 0; continue; }
    if (!started) continue;
    if (/^    push /.test(line)) depth++;
    else if (/^    pop /.test(line)) depth--;
    else if (/^    ex \(sp\), hl/.test(line)) { exSp++; if (depth < 2) errors.push('ex (sp),hl runs with the loop state word on top of the stack'); }
    if (/^    jp nz, \.benemy_loop/.test(line)) break;
    if (depth > 0 || /^    pop /.test(line)) min = Math.min(min, depth);
  }
  if (depth !== 0) errors.push(`stack balanced per iteration (net ${depth})`);
  if (!expect.compact && exSp !== (expect.selects ? 4 : 4)) errors.push(`4 ex (sp),hl swaps in the own-art loop (found ${exSp})`);
  if (expect.compact && exSp !== 2) errors.push(`2 ex (sp),hl swaps in the shared-pattern loop (found ${exSp})`);
  void min;
  return errors;
}
const mutations = [
  ['IX stride + 1', (t, e) => t.replace(`    ld bc, ${e.tableStride}\n    add ix, bc`, `    ld bc, ${e.tableStride + 1}\n    add ix, bc`)],
  ['IY stride - 1', (t, e) => t.replace(`    ld bc, ${e.poolStride}\n    add iy, bc`, `    ld bc, ${e.poolStride - 1}\n    add iy, bc`)],
  ['IY starts one byte late', t => t.replace('    ld iy, bitmap_enemy_pool\n', '    ld iy, bitmap_enemy_pool+1\n')],
  ['one record byte shifted', t => t.replace('    ld a, (ix+21)', '    ld a, (ix+20)')],
  ['one pool byte shifted', t => t.replace('    ld (iy+13), a', '    ld (iy+14), a')],
  ['stack leak (state word never popped)', t => t.replace(/    pop (de|hl)\n    pop bc\n    dec b/, '    pop bc\n    dec b')],
  ['djnz instead of dec/jp', t => t.replace('    dec b\n    jp nz, .benemy_loop', '    djnz .benemy_loop')],
];
const everyEngine = SHAPES.find(s => s.name.startsWith('every engine'));
for (const shape of [soldier, ownArt, everyEngine]) {
  const n = 8;
  const data = makeData(shape, n);
  const looped = cur.buildBitmapEnemySystemAsm(data, optsFor(shape, { loadLoopMinSlots: 1 }));
  const unrolled = cur.buildBitmapEnemySystemAsm(data, optsFor(shape, { loadLoopMinSlots: 99 }));
  const stride = cur.bitmapEnemyPoolStride(data);
  const expect = { tableStride: 22 + (data.slimeEnabled ? 1 : 0) + (data.gearEnabled ? 2 : 0) + (data.fly8Enabled ? 1 : 0) + (data.scriptedEnabled ? 1 : 0), poolStride: stride, compact: Boolean(data.compactPatterns), selects: shape === ownArt };
  const text = routineText(`\n${looped.routinesAsm}`, 'bitmap_load_enemies');
  const unrolledText = routineText(`\n${unrolled.routinesAsm}`, 'bitmap_load_enemies');
  const errors = structureErrors(text, looped, unrolledText, expect);
  assert.deepEqual(errors, [], `${shape.name}: structure of the loop`);
  for (const [name, mutate] of mutations) {
    const mutated = mutate(text, expect);
    if (mutated === text) { log(`  (mutation "${name}" does not apply to ${shape.name}; skipped)`); continue; }
    assert.notDeepEqual(structureErrors(mutated, looped, unrolledText, expect), [], `${shape.name}: mutation "${name}" must be caught`);
  }
}
console.log(`PASS: loop from ${MIN} slots up is the break-even for ${SHAPES.length} shapes; below it the output is identical to ${REFERENCE}; structure + ${mutations.length} negative controls hold`);
