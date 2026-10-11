#!/usr/bin/env node
/**
 * bitmap_update_enemy_sat writes the SAT slots with ONE loop from BITMAP_ENEMY_SAT_LOOP_MIN_SLOTS slots up (BITMAP_ENEMY_SAT_LOOP_MIN_SLOTS_OWN_ART
 * for builds that upload their own sprite art: their loop pays the 5-NOP waits the unrolled routine never had) and stays unrolled below it.
 *
 *   node scripts/check_msx2_enemy_sat_loop.mjs [--reference <commit>] [--quiet]
 *
 * What is pinned (every size comes from assembling the real emitted routine with server/glass.jar):
 *   1. THRESHOLD    for every shape (shared / own patterns x plain / slime pair+quad / gear / bats / scripted) the loop is used exactly when
 *                   slots >= N, N is the BREAK-EVEN: at N the loop routine (plus the one-byte-per-slot table it reads) is strictly smaller than
 *                   the unrolled one forced for the same project, and at N-1 it is not smaller.
 *   2. BELOW N      the unrolled routine and its data are byte for byte the ones of the reference commit, so projects under the threshold keep
 *                   an identical ROM. The forced-unrolled routine is the reference's at EVERY slot count.
 *   3. BUDGET       8 slots of the soldier build (shared patterns) fit in <= 260 bytes including the table.
 *   4. STRUCTURE    the loop walks maxSlots slots with the pool stride, starts IY at bitmap_enemy_pool and HL at the table, reads exactly the pool
 *                   bytes the unrolled slot 0 reads, keeps BC/HL/IY (push/pop in order), balances the stack on every path and restores R#14 = 0
 *                   at the end exactly like the unrolled routine. The table has one byte per slot with the values the unrolled code hard-wires.
 *   5. VDP TIMING   (static, nominal T-states) every `out (VDP_DATA_PORT), a` of a shared-pattern build is preceded by 5 NOPs that no jump can skip,
 *                   and the minimum distance between two consecutive data-port OUTs over EVERY path of the routine (hidden, visible, ceiling flip,
 *                   gear, the jump back of the loop, the reserved-slot tail, the terminator) is >= 31 T. Own-pattern builds keep the historical rule:
 *                   their minimum distance must not be shorter than the unrolled routine's.
 *   Negative controls: every mutation listed below must turn one of those checks red.
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
const REFERENCE = referenceArg >= 0 ? args[referenceArg + 1] : '1e643667';   // HEAD the SAT loop was written against
const enemyModule = 'utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator.ts';
const log = (...a) => { if (!quiet) console.log(...a); };
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_sat_loop_'));
const MIN_GAP = 31;   // T-states between the starts of two consecutive data-port OUTs, nominal (Codex's contract: OUT 11 + 5 NOP 20)
const SAT_LABEL = 'bitmap_update_enemy_sat';

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
const MIN_SHARED = cur.BITMAP_ENEMY_SAT_LOOP_MIN_SLOTS;
const MIN_OWN = cur.BITMAP_ENEMY_SAT_LOOP_MIN_SLOTS_OWN_ART;
const MIN = MIN_SHARED;
assert.ok(Number.isInteger(MIN) && MIN >= 2, 'BITMAP_ENEMY_SAT_LOOP_MIN_SLOTS is an integer >= 2 (one slot never wins)');

// ---- synthetic projects: every shape of the SAT writer ---------------------------------------------------------------------------
const SHAPES = [
  { name: 'plain, own patterns', slime: false, scripted: false, compact: false },
  { name: 'plain, shared patterns', slime: false, scripted: false, compact: true },
  { name: 'soldier build (scripted+path+clip), shared patterns', slime: false, scripted: true, compact: true, programs: true, soldier: true },
  { name: 'scripted, own patterns', slime: false, scripted: true, compact: false },
  { name: 'slime mix (pair+quad), own patterns', slime: true, scripted: false, compact: false, variants: n => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 4 : 2)) },
  { name: 'slime, all pair, own patterns', slime: true, scripted: false, compact: false, variants: n => Array(n).fill(2) },
  { name: 'slime, all quad, own patterns', slime: true, scripted: false, compact: false, variants: n => Array(n).fill(4) },
  { name: 'slime mix, shared patterns', slime: true, scripted: false, compact: true, variants: n => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 4 : 2)) },
  { name: 'slime, all quad, shared patterns', slime: true, scripted: false, compact: true, variants: n => Array(n).fill(4) },
  { name: 'gear + bats, own patterns', slime: false, gear: true, fly8: true, scripted: false, compact: false },
  { name: 'gear, shared patterns', slime: false, gear: true, scripted: false, compact: true },
  { name: 'every engine (slime+gear+bats+scripted+path+clip), own patterns', slime: true, gear: true, fly8: true, scripted: true, compact: false, programs: true, variants: n => Array(n).fill(4) },
];
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
    Object.assign(r, { 0: 40 + slot, 1: 60, 2: 1, 4: 8, 5: 200, 8: slot * maxFrames * romVariants, 9: slot * maxFrames, 10: maxFrames, 11: 6, 12: shape.scripted ? 14 : 0, 15: 1, 20: 1, 21: 3 });
    return r;
  };
  for (let slot = 0; slot < n; slot++) {
    for (let g = 0; g < maxFrames * romVariants; g++) for (let b = 0; b < 32; b++) patternBytes.push(shape.compact ? (b * 5 + 3) & 0xFF : (b === 0 ? slot * 16 + g : g * 17 + b * 3 + slot) & 0xFF);
    for (let b = 0; b < maxFrames * 16; b++) colorBytes.push((slot + b) & 0x0F);
  }
  const emptyRecord = new Array(stride).fill(0); emptyRecord[11] = 1; emptyRecord[18] = 16; emptyRecord[19] = 16;
  const roomFull = [n, ...Array.from({ length: n }, (_, s) => record(s)).flat()];
  const roomEmpty = [0, ...Array.from({ length: n }, () => emptyRecord).flat()];
  const programs = shape.programs ? [
    { id: 'p0', name: 'walker', bytes: [0xFF, 0x00], clip: true },
    { id: 'p1', name: 'path', bytes: [0xFF, 0x00], kind: 'path_follow' },
  ] : [];
  let data = {
    maxSlots: n, maxFrames, roomTables: [roomFull, roomEmpty], patternBytes, colorBytes,
    slimeEnabled: shape.slime, gearEnabled: Boolean(shape.gear), fly8Enabled: Boolean(shape.fly8), scriptedEnabled: shape.scripted,
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
const optsFor = (extra = {}) => ({
  ramBase: 0xD000, satBase: 0xF600, colorBase: 0xF400, patternGroupBase: 8, gameYOffset: 20,
  playerHitbox: { x: 0, y: 0, w: 16, h: 16 }, damageInvulnFrames: 60, bankedSpriteData: false, ...extra,
});
// The room generator hands the per-slot allocation to the runtime through the options (it is not read from the data).
const optsForData = (data, extra = {}) => optsFor({ patternGroupOffsets: data.patternGroupOffsets, patternVariantCounts: data.patternVariantCounts, ...extra });
const emit = (mod, shape, n, extra) => { const data = makeData(shape, n); return mod.buildBitmapEnemySystemAsm(data, optsForData(data, extra)); };

// ---- text helpers -----------------------------------------------------------------------------------------------------------------
const glass = path.join(root, 'server', 'glass.jar');
function routineText(asm, label) {
  const start = asm.indexOf(`\n${label}:`);
  assert.ok(start >= 0, `routine ${label} is emitted`);
  const tail = asm.slice(start + 1);
  const end = tail.slice(label.length + 1).search(/^[A-Za-z_]\w*:/m);
  return end < 0 ? tail : tail.slice(0, label.length + 1 + end);
}
function tableText(dataAsm) {
  const i = dataAsm.indexOf('bitmap_enemy_sat_desc:');
  if (i < 0) return '';
  const lines = ['bitmap_enemy_sat_desc:'];
  for (const line of dataAsm.slice(i).split('\n').slice(1)) { if (/^\s+DB /.test(line)) lines.push(line); else break; }
  return lines.join('\n') + '\n';
}
function tableBytes(dataAsm) {
  return tableText(dataAsm).split('\n').filter(l => /^\s+DB /.test(l)).map(l => parseInt(l.replace(/^\s+DB\s+/, '').replace('#', ''), 16));
}
let asmCounter = 0;
const NOT_SYMBOLS = new Set('out in ld push pop ldir ldi add adc sub sbc cp or and xor inc dec jp jr call ret djnz ex nop rlca rrca rla rra sla sra srl bit set res a b c d e h l af bc de hl ix iy sp nz z nc po pe p m ds db dw org equ'.split(' '));
function routineSize(system) {
  const body = routineText(`\n${system.routinesAsm}`, SAT_LABEL);
  const table = tableText(system.dataAsm);
  const defined = new Set([...`${system.equates}\n${body}\n${table}`.matchAll(/^([A-Za-z_]\w*)(?::|\s+EQU\b)/gm)].map(m => m[1]));
  const used = new Set();
  for (const line of body.split('\n')) {
    const code = line.replace(/;.*$/, '').replace(/^\s*[A-Za-z_.]\w*:/, '');
    for (const m of code.matchAll(/(?<![\w.#])([A-Za-z_]\w*)/g)) {
      if (!NOT_SYMBOLS.has(m[1].toLowerCase()) && !defined.has(m[1])) used.add(m[1]);
    }
  }
  const stubs = [...used].filter(name => name !== 'VDP_DATA_PORT' && name !== 'VDP_CTRL_PORT').map(name => `${name} EQU #8000`).join('\n');
  const src = `    ORG #4000\nVDP_DATA_PORT EQU #98\nVDP_CTRL_PORT EQU #99\n${system.equates}\n${stubs}\n${body}\n${table}sat_end:\n`;
  const base = path.join(out, `size_${asmCounter++}`);
  fs.writeFileSync(`${base}.asm`, src);
  try {
    execFileSync('java', ['-jar', glass, `${base}.asm`, `${base}.rom`, `${base}.sym`], { cwd: root, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`glass failed on the extracted routine (${base}.asm):\n${`${e.stdout || ''}${e.stderr || ''}`.slice(0, 600)}`);
  }
  const sym = fs.readFileSync(`${base}.sym`, 'utf8');
  const addr = name => parseInt(sym.match(new RegExp(`^${name}: equ ([0-9A-F]+)H`, 'm'))[1], 16);
  return addr('sat_end') - addr(SAT_LABEL);
}

// ---- static VDP timing: nominal Z80 T-states over the control-flow graph of the emitted routine ------------------------------------
// A tiny instruction cost table for the subset the SAT writer uses. Unknown instructions are an error: the check must never silently skip one.
const R8 = '[abcdehl]';
const COSTS = [
  [/^nop$/, 4], [/^(push|pop) (bc|de|hl|af)$/, ins => (ins.startsWith('push') ? 11 : 10)], [/^push (ix|iy)$/, 15], [/^pop (ix|iy)$/, 14],
  [new RegExp(`^ld ${R8},${R8}$`), 4], [new RegExp(`^ld ${R8},[^()]+$`), 7], [/^ld a,\((?!iy|ix)[\w.+ -]+\)$/, ins => (/^ld a,\((hl|bc|de)\)$/.test(ins) ? 7 : 13)],
  [/^ld \(.+\),a$/, 13], [/^ld (bc|de|hl),[^()]+$/, 10], [/^ld (ix|iy),[^()]+$/, 14], [/^ld [abcdehl],\(hl\)$/, 7], [/^ld [abcdehl],\((ix|iy)[+-]\d+\)$/, 19],
  [/^ld \((ix|iy)[+-]\d+\),[abcdehl]$/, 19],
  [new RegExp(`^(add|adc|sbc) a,${R8}$`), 4], [/^(add|adc|sbc|sub|and|or|xor|cp) [^,()]+$/, ins => (/^(sub|and|or|xor|cp) [abcdehl]$/.test(ins) ? 4 : 7)],
  [/^(add|adc|sbc) a,\(hl\)$/, 7], [/^(add|adc|sbc) a,[^,()]+$/, 7], [/^(inc|dec) [abcdehl]$/, 4], [/^(inc|dec) (bc|de|hl)$/, 6],
  [/^add hl,(bc|de|hl)$/, 11], [/^add iy,(bc|de|hl|iy)$/, 15], [/^(rlca|rrca|rla|rra)$/, 4], [/^bit \d,\(hl\)$/, 12],
  [/^jp (nz|z|nc|c|po|pe|p|m),[.\w]+$/, 10], [/^jp [.\w]+$/, 10], [/^jr [.\w]+$/, 12], [/^jr (nz|z|nc|c),[.\w]+$/, { taken: 12, not: 7 }], [/^djnz [.\w]+$/, { taken: 13, not: 8 }],
  [/^call vdp_write_register$/, 17 + 72], [/^ret$/, 10], [/^out \((vdp_data_port|vdp_ctrl_port)\),a$/, 11], [/^xor a$/, 4],
];
function costOf(ins) {
  for (const [re, c] of COSTS) if (re.test(ins)) return typeof c === 'function' ? c(ins) : c;
  throw new Error(`timing table has no entry for "${ins}"`);
}
function parseRoutine(text) {
  const instrs = []; let pending = [];
  for (const raw of text.split('\n')) {
    const code = raw.replace(/;.*$/, '').trim();
    if (!code) continue;
    const label = code.match(/^([.\w]+):\s*(.*)$/);   // the unrolled own-pattern emission puts the tail's first instruction on the label's line
    if (label) { pending.push(label[1]); if (!label[2]) continue; }
    const body = label ? label[2] : code;
    instrs.push({ text: body.toLowerCase().replace(/\s*,\s*/g, ','), labels: pending }); pending = [];
  }
  return instrs;
}
function timing(text) {
  const instrs = parseRoutine(text);
  const labelAt = new Map();
  instrs.forEach((ins, i) => ins.labels.forEach(l => labelAt.set(l, i)));
  const edges = instrs.map((ins, i) => {
    const t = ins.text; const c = costOf(t); const next = i + 1 < instrs.length ? i + 1 : -1;
    const target = () => { const l = t.match(/[,\s]([.\w]+)$/)[1]; if (!labelAt.has(l)) throw new Error(`jump target ${l} is not inside the routine`); return labelAt.get(l); };
    if (/^jp [.\w]+$/.test(t) || /^jr [.\w]+$/.test(t)) return [[target(), c]];
    if (/^jp (nz|z|nc|c|po|pe|p|m),/.test(t)) return [[target(), c], [next, c]];
    if (/^(jr (nz|z|nc|c),|djnz )/.test(t)) return [[target(), c.taken], [next, c.not]];
    if (t === 'ret') return [];
    return [[next, c]];
  });
  const isData = i => /^out \(vdp_data_port\),a$/.test(instrs[i].text);
  const outs = instrs.map((_, i) => i).filter(isData);
  const problems = [];
  // 1. each data OUT is preceded by 5 NOPs and only the first NOP of the run may be a jump target
  for (const k of outs) {
    let ok = k >= 5;
    for (let j = 1; ok && j <= 5; j++) ok = instrs[k - j].text === 'nop';
    for (let j = 0; ok && j <= 4; j++) if (instrs[k - j].labels.length) ok = false;
    if (!ok) problems.push(`out #${k} has no unskippable 5-NOP run before it`);
  }
  // 2. shortest path between two consecutive data OUTs over every path (including the jump back of the loop)
  let minGap = Infinity, minAt = '';
  for (const u of outs) {
    const dist = new Map(); const queue = [];
    for (const [to, c] of edges[u]) if (to >= 0 && c < (dist.get(to) ?? Infinity)) { dist.set(to, c); queue.push(to); }
    const done = new Set();
    while (queue.length) {
      queue.sort((a, b) => dist.get(a) - dist.get(b));
      const n = queue.shift(); if (done.has(n)) continue; done.add(n);
      if (isData(n)) { if (dist.get(n) < minGap) { minGap = dist.get(n); minAt = `out #${u} -> out #${n}`; } continue; }   // stop at the next data OUT
      for (const [to, c] of edges[n]) if (to >= 0 && dist.get(n) + c < (dist.get(to) ?? Infinity)) { dist.set(to, dist.get(n) + c); queue.push(to); }
    }
  }
  return { outs: outs.length, minGap, minAt, problems };
}

// ---- 1 + 2 + 3: threshold, byte-identical unrolled output, budget -----------------------------------------------------------------
const rows = [];
for (const shape of SHAPES) {
  const sizes = {};
  const MIN = shape.compact ? MIN_SHARED : MIN_OWN;   // own art pays the 5-NOP waits in the loop only
  for (const n of [1, 2, 3, 4, 8]) {
    const looped = emit(cur, shape, n, { satLoopMinSlots: 1 });
    const unrolled = emit(cur, shape, n, { satLoopMinSlots: 99 });
    const natural = emit(cur, shape, n);
    const old = emit(ref, shape, n);
    const isLoop = system => /^\.esat_loop:/m.test(routineText(`\n${system.routinesAsm}`, SAT_LABEL));
    assert.equal(isLoop(looped), true, `${shape.name} n=${n}: forced loop emits the loop`);
    assert.equal(isLoop(unrolled), false, `${shape.name} n=${n}: forced unrolled has no loop`);
    assert.equal(isLoop(natural), n >= MIN, `${shape.name} n=${n}: the loop is used exactly from ${MIN} slots up`);
    assert.equal(routineText(`\n${natural.routinesAsm}`, SAT_LABEL), routineText(`\n${(n >= MIN ? looped : unrolled).routinesAsm}`, SAT_LABEL), `${shape.name} n=${n}: natural emission is one of the two shapes`);
    const loopBytes = routineSize(looped);
    const unrolledBytes = routineSize(unrolled);
    sizes[n] = { loopBytes, unrolledBytes };
    if (n >= MIN) assert.ok(loopBytes < unrolledBytes, `${shape.name} n=${n}: loop (${loopBytes} B incl. table) must be smaller than unrolled (${unrolledBytes} B)`);
    // One own-art threshold for every own-art build: in the synthetic every-engine shape the paced loop already wins by 3 B at 2 slots.
    else assert.ok(unrolledBytes <= loopBytes + (shape.compact ? 0 : 8), `${shape.name} n=${n}: below ${MIN} slots the unrolled code (${unrolledBytes} B) must not be bigger than the loop (${loopBytes} B)${shape.compact ? '' : ' + 8 B'}`);
    // The forced-unrolled routine is the reference's at every slot count, and below the threshold so is every other emitted byte.
    assert.equal(routineText(`\n${unrolled.routinesAsm}`, SAT_LABEL), routineText(`\n${old.routinesAsm}`, SAT_LABEL), `${shape.name} n=${n}: forced-unrolled SAT routine identical to ${REFERENCE}`);
    assert.equal(unrolled.dataAsm, old.dataAsm, `${shape.name} n=${n}: forced-unrolled data identical to ${REFERENCE}`);
    assert.equal(unrolled.equates, old.equates, `${shape.name} n=${n}: equates identical to ${REFERENCE}`);
    if (n < MIN) {
      assert.equal(natural.routinesAsm, old.routinesAsm, `${shape.name} n=${n}: routines identical to ${REFERENCE}`);
      assert.equal(natural.dataAsm, old.dataAsm, `${shape.name} n=${n}: data identical to ${REFERENCE}`);
    }
  }
  rows.push({ shape: shape.name, sizes });
  if (shape.soldier) assert.ok(sizes[8].loopBytes <= 260, `soldier build, 8 slots: the SAT loop plus its table must stay within 260 bytes (is ${sizes[8].loopBytes})`);
}
log('bitmap_update_enemy_sat bytes (loop incl. its table / unrolled), by slot count:');
for (const r of rows) log(`  ${r.shape.padEnd(66)} ` + Object.entries(r.sizes).map(([n, s]) => `${n}: ${s.loopBytes}/${s.unrolledBytes}`).join('  '));

// ---- 4 + 5: structure and VDP timing of the loop --------------------------------------------------------------------------------------
function unrolledReads(text) {
  const slot0 = text.slice(text.indexOf('.sat_slot_0:'), text.indexOf('.sat_slot_1:') > 0 ? text.indexOf('.sat_slot_1:') : text.length);
  return new Set([...slot0.matchAll(/\(bitmap_enemy_pool \+ 0(?: \+ (\d+))?\)/g)].map(m => Number(m[1] ?? 0)));
}
function structureErrors(text, system, expect) {
  const errors = [];
  const count = re => (text.match(re) || []).length;
  if (count(/^\.esat_loop:/gm) !== 1) errors.push('exactly one .esat_loop');
  if (count(/^\.sat_slot_\d/gm) !== 0) errors.push('no unrolled slot labels');
  if (!text.includes(`    ld de, ${expect.poolStride}\n    add iy, de`)) errors.push(`IY advances by the pool stride ${expect.poolStride}`);
  if (!text.includes('    ld iy, bitmap_enemy_pool\n')) errors.push('IY starts at bitmap_enemy_pool');
  if (!text.includes('    ld hl, bitmap_enemy_sat_desc\n')) errors.push('HL starts at bitmap_enemy_sat_desc');
  if (!new RegExp(`    ld b, ${expect.maxSlots}\\b`).test(text)) errors.push(`B counts ${expect.maxSlots} slots`);
  // the visible slot and the shared hidden writer (killed enemy, waiting gear) each end with the same advance: one table byte, one pool stride, dec b / jp nz
  if (count(new RegExp(`    inc hl[^\\n]*\\n    ld de, ${expect.poolStride}\\n    add iy, de\\n    dec b\\n    jp nz, \\.esat_loop\\n`, 'g')) !== 2) errors.push('HL advances one byte and IY one pool stride per slot, in the visible slot and in the hidden writer, and both close with dec b / jp nz');
  if (!new RegExp(`    ld a, \\(bitmap_enemy_count\\)\\n    cp ${expect.maxSlots + 1}\\n    jr c, \\.esat_count_ok\\n    ld a, ${expect.maxSlots}\\b[^\\n]*\\n\\.esat_count_ok:\\n    ld c, a`).test(text)) errors.push(`C starts at bitmap_enemy_count, clamped to ${expect.maxSlots} (a corrupt count publishes every slot like the unrolled routine)`);
  if (!/\.esat_loop:\n    dec c\n    jp m, \.esat_hidden/.test(text)) errors.push('every slot consumes one enemy and the slots past the count are hidden');
  if (!/    ld a, \(iy\+13\)[^\n]*\n    inc a[^\n]*\n    jp z, \.esat_hidden/.test(text)) errors.push('a killed enemy (#FF) is hidden');
  if (expect.gear && !new RegExp(`    ld a, \\(iy\\+${expect.gearOffset}\\)[^\\n]*\\n    or a\\n    jp z, \\.esat_hidden`).test(text)) errors.push('a waiting gear is hidden');
  if (!expect.gear && count(new RegExp(`\\(iy\\+${expect.gearOffset}\\)`, 'g')) > 0 && expect.gearOffset !== 26) errors.push('no gear read in a build without gear');
  // stack: push bc, push hl, push iy ... pop iy, pop hl, pop bc, ret ; the only other push/pop is none (balanced per path)
  const prologue = text.slice(0, text.indexOf('.esat_loop:'));
  if (!/^bitmap_update_enemy_sat:\n    push bc\n    push hl\n    push iy\n/.test(prologue)) errors.push('prologue saves BC, HL, IY in that order');
  if (!text.includes('    call vdp_write_register\n    pop iy\n    pop hl\n    pop bc\n    ret\n')) errors.push('epilogue restores IY, HL, BC in reverse order');
  if (count(/^    push /gm) !== 4 || count(/^    pop /gm) !== 4) errors.push(`4 pushes and 4 pops in the whole routine (found ${count(/^    push /gm)}/${count(/^    pop /gm)})`);
  // R#14: written with the SAT bank at the start and back to 0 at the end, exactly like the unrolled routine
  if (!/    xor a\n    ld e, a\n    ld a, #0E\n    call vdp_write_register\n    pop iy/.test(text)) errors.push('R#14 is restored to 0 at the end');
  if (count(/call vdp_write_register/g) !== 2) errors.push('vdp_write_register is called exactly twice (R#14 in, R#14 out)');
  if (/VDP_CTRL_PORT/.test(text.slice(text.indexOf('.esat_loop:'), text.lastIndexOf('    xor a\n    ld e, a')))) errors.push('no control-port write inside the slot loop (R#15 and the write pointer are untouched)');
  // the pool bytes the loop reads are the ones the unrolled slot 0 reads
  const reads = new Set([...text.matchAll(/\(iy\+(\d+)\)/g)].map(m => Number(m[1])));
  const want = expect.unrolledReads;
  if (JSON.stringify([...reads].sort((a, b) => a - b)) !== JSON.stringify([...want].sort((a, b) => a - b))) errors.push(`pool reads equal the unrolled slot 0 reads (${[...reads].sort((a, b) => a - b)} vs ${[...want].sort((a, b) => a - b)})`);
  // table
  const bytes = tableBytes(system.dataAsm);
  if (JSON.stringify(bytes) !== JSON.stringify(expect.table)) errors.push(`table bytes ${bytes} must be ${expect.table}`);
  // the rest writer hides every slot left once the room's enemies are published: one off-screen sprite per B, no pointer walking
  if (!/\.esat_hidden:\n    ld a, #D4\n(?:    nop\n){0,5}    out \(VDP_DATA_PORT\), a[^\n]*\n    xor a\n(?:(?:    nop\n){0,5}    out \(VDP_DATA_PORT\), a\n){3}    inc hl[^\n]*\n    ld de, \d+\n    add iy, de\n    dec b\n    jp nz, \.esat_loop\n\.esat_tail:/.test(text)) errors.push('the shared hidden writer (past the count, killed enemy, waiting gear) hides one slot, advances like a visible one and falls into the tail');
  // the data-port writes: 4 visible, 4 hidden, 4 rest, and the 4 of the terminator (+4 of the reserved loop when present)
  if (count(/out \(VDP_DATA_PORT\), a/g) !== 8 + 4 + (expect.pad ? 4 : 0)) errors.push(`${8 + 4 + (expect.pad ? 4 : 0)} data-port writes (found ${count(/out \(VDP_DATA_PORT\), a/g)})`);
  // The looped writer meets the VDP contract in EVERY build, own art included (Codex review of the R5 draft: the own-art loop had 0 NOPs,
  // and its hidden writer and terminator wrote at 11 T). Only the unrolled own-art routine, kept below the threshold, stays as it was.
  const t = timing(text);
  if (t.problems.length) errors.push(...t.problems);
  if (t.minGap < MIN_GAP) errors.push(`minimum distance between data-port OUTs is ${t.minGap} T (${t.minAt}), contract is ${MIN_GAP}`);
  return errors;
}
const mutations = [
  ['IY stride + 1', (t, e) => t.replace(`    ld de, ${e.poolStride}\n    add iy, de`, `    ld de, ${e.poolStride + 1}\n    add iy, de`)],
  ['IY starts one slot early', t => t.replace('    ld iy, bitmap_enemy_pool\n', '    ld iy, bitmap_enemy_pool-30\n')],
  ['table pointer starts one byte early', t => t.replace('    ld hl, bitmap_enemy_sat_desc\n', '    ld hl, bitmap_enemy_sat_desc-1\n')],
  ['one slot less', (t, e) => t.replace(new RegExp(`    ld b, ${e.maxSlots}\\b`), `    ld b, ${e.maxSlots - 1}`)],
  ['table pointer not advanced', t => t.replace('    inc hl', '    nop')],
  ['count not consumed', t => t.replace('.esat_loop:\n    dec c\n', '.esat_loop:\n')],
  ['corrupt count not clamped', t => t.replace(/    cp \d+\n    jr c, \.esat_count_ok\n    ld a, \d+[^\n]*\n\.esat_count_ok:\n/, '')],
  ['hidden writer advances IY by the wrong stride', (t, e) => { const needle = `    ld de, ${e.poolStride}\n    add iy, de\n    dec b\n    jp nz, .esat_loop`; const i = t.lastIndexOf(needle); return i < 0 ? t : t.slice(0, i) + `    ld de, ${e.poolStride + 1}` + t.slice(i + `    ld de, ${e.poolStride}`.length); }],
  ['hidden writer does not advance the table pointer', t => { const i = t.indexOf('.esat_hidden:'); const j = t.indexOf('    inc hl', i); return i < 0 || j < 0 ? t : t.slice(0, j) + '    nop' + t.slice(j + '    inc hl'.length); }],
  ['killed enemies visible', t => t.replace('    inc a                     ; #FF -> 0\n    jp z, .esat_hidden\n', '    inc a                     ; #FF -> 0\n    cp 99\n    jp z, .esat_hidden\n')],
  ['slots past the count are written as visible', t => t.replace(/    jp m, \.esat_hidden[^\n]*\n/, '')],
  ['one pool byte shifted (X)', t => t.replace('    ld a, (iy+0)', '    ld a, (iy+1)')],
  ['IY not restored', t => t.replace('    call vdp_write_register\n    pop iy\n', '    call vdp_write_register\n')],
  ['R#14 left at the SAT bank', t => t.replace('    xor a\n    ld e, a\n    ld a, #0E\n    call vdp_write_register\n    pop iy', '    ld e, a\n    ld a, #0E\n    call vdp_write_register\n    pop iy')],
  ['4 NOPs before the Y write', t => t.replace('    nop\n    nop\n    nop\n    nop\n    nop\n    out (VDP_DATA_PORT), a    ; Y', '    nop\n    nop\n    nop\n    nop\n    out (VDP_DATA_PORT), a    ; Y')],
  ['2 NOPs before the pattern write', t => t.replace('    nop\n    nop\n    nop\n    nop\n    nop\n    out (VDP_DATA_PORT), a    ; pattern', '    nop\n    nop\n    out (VDP_DATA_PORT), a    ; pattern')],
  ['no wait before the first hidden write (the one the jump back reaches)', t => t.replace('.esat_hidden:\n    ld a, #D4\n    nop\n    nop\n    nop\n    nop\n    nop\n    out', '.esat_hidden:\n    ld a, #D4\n    out')],
  ['2 NOPs before the last hidden write', t => { const needle = '    nop\n    nop\n    nop\n    nop\n    nop\n    out (VDP_DATA_PORT), a\n    inc hl'; const i = t.lastIndexOf(needle); return i < 0 ? t : t.slice(0, i) + '    nop\n    nop\n    out (VDP_DATA_PORT), a\n    inc hl' + t.slice(i + needle.length); }],
  ['a jump lands between the NOPs and the OUT', t => t.replace('    nop\n    nop\n    out (VDP_DATA_PORT), a    ; pattern', '    nop\n    nop\n.mid:\n    out (VDP_DATA_PORT), a    ; pattern')],
  ['terminator without waits', t => { const i = t.indexOf('    ld a, #D8\n'); return i < 0 ? t : t.slice(0, i) + t.slice(i).replace(/    nop\n/g, ''); }],
];
const soldier = SHAPES.find(s => s.soldier);
const ownArt = SHAPES.find(s => s.name === 'slime mix (pair+quad), own patterns');
const gearShape = SHAPES.find(s => s.name === 'gear + bats, own patterns');
const everyEngine = SHAPES.find(s => s.name.startsWith('every engine'));
const mixedShared = SHAPES.find(s => s.name === 'slime mix, shared patterns');
const structureShapes = [soldier, SHAPES.find(s => s.name === 'plain, shared patterns'), ownArt, gearShape, everyEngine, mixedShared, SHAPES.find(s => s.name === 'gear, shared patterns'), SHAPES.find(s => s.name === 'slime, all quad, shared patterns')];
const caught = {};
for (const shape of structureShapes) {
  for (const [n, pad] of [[8, 0], [3, 2]]) {
    const data = makeData(shape, n);
    const looped = cur.buildBitmapEnemySystemAsm(data, optsForData(data, { satLoopMinSlots: 1, satPadSlots: pad }));
    const unrolled = cur.buildBitmapEnemySystemAsm(data, optsForData(data, { satLoopMinSlots: 99, satPadSlots: pad }));
    const text = routineText(`\n${looped.routinesAsm}`, SAT_LABEL);
    const unrolledText = routineText(`\n${unrolled.routinesAsm}`, SAT_LABEL);
    const compact = Boolean(data.compactPatterns);
    const variants = data.patternVariantCounts;
    const mixed = variants.some(v => v >= 4) && variants.some(v => v < 4);
    const table = Array.from({ length: n }, (_, i) => (compact ? data.compactPatterns.slotMapOffsets[i] : (8 + data.patternGroupOffsets[i]) & 0x3F) | (mixed && variants[i] >= 4 ? 0x80 : 0));
    const gearOffset = 24 + (data.slimeEnabled ? 3 : 0);
    const expect = {
      maxSlots: n, poolStride: cur.bitmapEnemyPoolStride(data), gear: Boolean(data.gearEnabled), gearOffset, compact, pad, table,
      unrolledReads: unrolledReads(unrolledText), ownArtMinGap: timing(unrolledText).minGap,
    };
    const errors = structureErrors(text, looped, expect);
    assert.deepEqual(errors, [], `${shape.name} n=${n} pad=${pad}: structure and VDP timing of the loop`);
    {
      const t = timing(text);
      assert.ok(t.minGap >= MIN_GAP && t.problems.length === 0, `${shape.name}: the loop keeps 5 NOPs before every data OUT and >= ${MIN_GAP} T between them (${t.minGap} T)`);
    }
    if (compact) {
      const u = timing(unrolledText);
      assert.ok(u.minGap >= MIN_GAP && u.problems.length === 0, `${shape.name}: the unrolled routine meets the same contract`);
    }
    for (const [name, mutate] of mutations) {
      const mutated = mutate(text, expect);
      if (mutated === text) {
        log(`  (mutation "${name}" does not apply to ${shape.name} n=${n} pad=${pad}; skipped)`);
        continue;
      }
      let red;
      try { red = structureErrors(mutated, looped, expect).length > 0; } catch (e) { red = true; }
      assert.ok(red, `${shape.name} n=${n} pad=${pad}: mutation "${name}" must be caught`);
      caught[name] = (caught[name] || 0) + 1;
    }
  }
}
for (const [name] of mutations) assert.ok(caught[name] > 0, `mutation "${name}" applied to at least one shape and was caught`);
const t0 = timing(routineText(`\n${emit(cur, soldier, 8, { satLoopMinSlots: 1 }).routinesAsm}`, SAT_LABEL));
const tu = timing(routineText(`\n${emit(cur, soldier, 8, { satLoopMinSlots: 99 }).routinesAsm}`, SAT_LABEL));
log(`soldier build, 8 slots: ${t0.outs} data OUTs, min distance ${t0.minGap} T (${t0.minAt}); unrolled: ${tu.outs} OUTs, min ${tu.minGap} T`);
console.log(`PASS: SAT loop from ${MIN_SHARED} slots up (shared patterns) / ${MIN_OWN} (own art) is the break-even for ${SHAPES.length} shapes; below it the output is identical to ${REFERENCE}; structure, 5-NOP rule and >= ${MIN_GAP} T spacing hold; ${mutations.length} negative controls caught`);
