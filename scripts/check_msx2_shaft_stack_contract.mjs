#!/usr/bin/env node
/**
 * Static stack-balance contract of the lift (platform_shaft) runtime, no emulator needed.
 *
 * Why: bitmap_shaft_ride_detect once skipped to a label that starts with `pop bc` from a point BEFORE its `push bc`
 * (the "hand-over in flight, rider = 2" test). The pop took the caller's return address, the final `ret` returned one level too
 * high and the game loop ended up in the GameFlow node that had called it (End / Restart). Nothing in the generator or in Glass
 * complains about that, so this script reads the ASM of every `bitmap_shaft_*` routine and walks its control flow tracking the
 * stack depth (push +1, pop -1, call = balanced), failing on:
 *   - a `pop` at depth 0 (it consumes a word the routine never pushed: the caller's return address),
 *   - a `ret` / `ret cc` / tail jump out of the routine at depth != 0,
 *   - two paths reaching the same instruction with different depths (a jump over a push, the exact old shape),
 *   - execution falling off the end of a routine into data, or an instruction this walker cannot model (ld sp, ...).
 * Callees are assumed balanced; every `bitmap_shaft_*` routine is itself an entry, so the assumption is checked too.
 *
 *   node scripts/check_msx2_shaft_stack_contract.mjs                 routines of the CURRENT source, for 1 and 2 cabins, 1- and 2-cell
 *                                                                    widths (compiles only msx2BitmapShaftGenerator.ts, ~3 s)
 *   node scripts/check_msx2_shaft_stack_contract.mjs --gen <dir>     same, using an already compiled generator (tsc output of
 *                                                                    utils/msxGenerator/index.ts), e.g. the one a ROM build used
 *   node scripts/check_msx2_shaft_stack_contract.mjs --asm <file>    the routines found in a generated unitedFiles.asm (a real
 *                                                                    JSON -> ASM build, so the entity -> generator seam is crossed)
 *
 * Both modes also run the analyzer on a SABOTAGED copy of the same text (the rider==2 skip retargeted to .shaft_detect_next, the old
 * code) and demand that it is reported: a walker that cannot see the historic defect would otherwise pass everything.
 * Exit code 1 on any failure.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const asmFile = val('--asm');
const genArg = val('--gen') ? path.resolve(val('--gen')) : null; // createRequire resolves a relative path against this script

let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

// ---- the walker -------------------------------------------------------------------------------------------------------------------
const DATA_DIRECTIVES = new Set(['db', 'dw', 'ds', 'defb', 'defw', 'defs', 'defm', 'dm', 'org', 'include', 'incbin', 'equ', 'align', 'end']);
const CONDITIONS = new Set(['nz', 'z', 'nc', 'c', 'po', 'pe', 'p', 'm']);
const inFamily = label => label.startsWith('.') || /^bitmap_shaft_/.test(label); // a Glass local label is always intra-routine

function parseLines(text) {
  const lines = text.split(/\r?\n/);
  return lines.map((raw, i) => {
    const code = raw.replace(/;.*$/, '');
    let rest = code;
    let label = null;
    const lm = rest.match(/^\s*([A-Za-z_.][\w.]*):(.*)$/);
    if (lm) { label = lm[1]; rest = lm[2]; }
    const im = rest.match(/^\s*([A-Za-z]+)\b\s*(.*?)\s*$/);
    return { n: i + 1, label, op: im ? im[1].toLowerCase() : null, arg: im ? im[2] : '' };
  });
}

/** Walks every code routine whose top-level label is bitmap_shaft_*; returns { entries, violations, states }. */
function analyze(text) {
  const L = parseLines(text);
  const labelAt = new Map();
  L.forEach((l, idx) => { if (l.label && !labelAt.has(l.label)) labelAt.set(l.label, idx); });
  const nearestLabel = idx => { for (let k = idx; k >= 0; k--) if (L[k].label) return L[k].label; return '?'; };
  const entries = [];
  for (const [name, idx] of labelAt) {
    if (!/^bitmap_shaft_/.test(name)) continue;
    let k = idx;
    while (k < L.length && !L[k].op) k++; // skip label-only / comment lines up to the first instruction or directive
    if (k < L.length && L[k].op && !DATA_DIRECTIVES.has(L[k].op)) entries.push(name);
  }
  const violations = [];
  const seenViolation = new Set();
  const violate = (idx, msg) => {
    const key = `${idx}:${msg}`;
    if (seenViolation.has(key)) return;
    seenViolation.add(key);
    violations.push(`line ${L[idx].n} (${nearestLabel(idx)}): ${msg}`);
  };
  let visited = 0;
  for (const entry of entries) {
    const seen = new Map(); // idx -> { depth, from }
    const work = [{ idx: labelAt.get(entry), depth: 0, from: `entry ${entry}` }];
    while (work.length) {
      let { idx, depth, from } = work.pop();
      for (;;) {
        if (idx >= L.length) { violate(L.length - 1, `routine ${entry} runs off the end of the file`); break; }
        const prev = seen.get(idx);
        if (prev) {
          if (prev.depth !== depth) {
            violate(idx, `${entry}: reached with stack depth ${prev.depth} (${prev.from}) and with depth ${depth} (${from}): a jump skips a push/pop`);
          }
          break;
        }
        seen.set(idx, { depth, from });
        visited++;
        const { op, arg } = L[idx];
        if (!op) { idx++; continue; }
        const next = () => { idx++; from = `fallthrough from line ${L[idx - 1].n}`; };
        if (DATA_DIRECTIVES.has(op)) { violate(idx, `${entry}: execution falls into a data/directive line "${op}"`); break; }
        if (op === 'push') { depth++; next(); continue; }
        if (op === 'pop') {
          depth--;
          if (depth < 0) { violate(idx, `${entry}: "pop ${arg}" at stack depth 0 takes a word this routine never pushed (the caller's return address)`); break; }
          next(); continue;
        }
        if (op === 'ret' || op === 'reti' || op === 'retn') {
          if (depth !== 0) violate(idx, `${entry}: "${op} ${arg}" with ${depth} word(s) still pushed`);
          if (arg === '' || op !== 'ret') break; // unconditional
          next(); continue; // ret cc: falls through
        }
        if (op === 'ld' && /^sp\s*,|,\s*sp$/i.test(arg)) { violate(idx, `${entry}: "ld ${arg}" - the walker cannot model a stack pointer reload`); break; }
        if (op === 'jp' || op === 'jr' || op === 'djnz') {
          let cond = null; let target = arg;
          const cm = arg.match(/^([a-z]+)\s*,\s*(.+)$/i);
          if (cm && CONDITIONS.has(cm[1].toLowerCase())) { cond = cm[1].toLowerCase(); target = cm[2]; }
          if (op === 'djnz') cond = 'djnz';
          if (/^\(/.test(target)) { if (depth !== 0) violate(idx, `${entry}: indirect jump "${op} ${arg}" with ${depth} word(s) still pushed`); if (!cond) break; next(); continue; }
          if (labelAt.has(target) && inFamily(target)) {
            work.push({ idx: labelAt.get(target), depth, from: `"${op} ${arg}" at line ${L[idx].n}` });
          } else {
            // leaves the lift code (tail call): the callee returns to OUR caller, so nothing may be left pushed
            if (depth !== 0) violate(idx, `${entry}: tail jump "${op} ${arg}" out of the routine with ${depth} word(s) still pushed`);
          }
          if (!cond) break; // unconditional: no fallthrough
          next(); continue;
        }
        next(); // everything else (ld, call, add, cp, out, ...): no stack effect. call is balanced by assumption.
      }
    }
  }
  return { entries, violations, visited };
}

/** The shaft routines are all the code between the first bitmap_shaft_* code label and the data tables; for the unit mode we hand
 *  the whole routinesAsm (+ a stub for the symbols it calls is NOT needed: calls are not followed). */
function reportAnalysis(title, text, expectEntries) {
  const r = analyze(text);
  check(`${title}: lift routines found`, expectEntries.every(e => r.entries.includes(e)), `${r.entries.length} entries, ${r.visited} instruction states${expectEntries.every(e => r.entries.includes(e)) ? '' : ' (missing ' + expectEntries.filter(e => !r.entries.includes(e)).join(', ') + ')'}`);
  check(`${title}: stack balanced on every path`, r.violations.length === 0, r.violations.length ? '\n    ' + r.violations.join('\n    ') : `${r.entries.length} routines`);
  return r;
}

const REQUIRED = ['bitmap_shaft_ride_detect', 'bitmap_shaft_update', 'bitmap_shaft_after_commit', 'bitmap_shaft_cross_room', 'bitmap_shaft_player_on_cabin', 'bitmap_shaft_sat'];

/** The historic defect: the rider==2 skip jumps to the pop instead of past it. */
function sabotage(text) {
  const re = /^(\s*jp z, )\.shaft_detect_advance\b/m;
  const count = text.split(/\r?\n/).filter(l => /^\s*jp z, \.shaft_detect_advance\b/.test(l)).length;
  if (count !== 1) return { text: null, count };
  return { text: text.replace(re, '$1.shaft_detect_next      ; SABOTAGE: the old, unbalanced skip'), count };
}

function sabotageCheck(title, text, baseline) {
  if (baseline.violations.length > 0) { console.log(`SKIP  ${title}: sabotage check (the unmodified text is already reported above)`); return; }
  const s = sabotage(text);
  if (s.text === null) { check(`${title}: sabotage (old rider==2 skip) applies`, false, `found ${s.count} "jp z, .shaft_detect_advance" lines, expected exactly 1`); return; }
  const r = analyze(s.text);
  const hit = r.violations.some(v => /shaft_detect_next|bitmap_shaft_ride_detect/.test(v));
  check(`${title}: sabotaged copy (old skip) is REPORTED`, hit && r.violations.length > 0, `${r.violations.length} violation(s)${r.violations[0] ? ': ' + r.violations[0] : ''}`);
}

// ---- the inputs -------------------------------------------------------------------------------------------------------------------
if (asmFile) {
  const text = fs.readFileSync(asmFile, 'utf8');
  console.log(`# ${asmFile}`);
  const base = reportAnalysis('asm', text, REQUIRED);
  // a ROM built without lifts has no shaft routines at all: then there is nothing to sabotage, only the first check fails above
  sabotageCheck('asm', text, base);
} else {
  let gen = genArg;
  let shaftJs;
  if (gen) {
    shaftJs = path.join(gen, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShaftGenerator.js');
  } else {
    gen = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_shaft_contract_gen_')); // private dir: other agents may run this in parallel
    process.on('exit', () => fs.rmSync(gen, { recursive: true, force: true }));
    const src = path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShaftGenerator.ts');
    try {
      execFileSync(process.execPath, [path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
        '--outDir', gen, '--skipLibCheck', src], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 26 });
    } catch (error) {
      throw new Error(`tsc failed on the shaft generator:\n${error.stdout || error.message}`);
    }
    fs.writeFileSync(path.join(gen, 'package.json'), '{"type":"commonjs"}');
    shaftJs = path.join(gen, 'msx2BitmapShaftGenerator.js');
  }
  if (!fs.existsSync(shaftJs)) throw new Error(`compiled shaft generator not found: ${shaftJs}`);
  const { buildBitmapShaftSystemAsm } = createRequire(import.meta.url)(shaftJs);

  const shaft = (over = {}) => ({
    path: [0, 1], bottomSlot: 0, bottomY: 176, topSlot: 1, topY: 16, startSlot: 0, startY: 176, startDir: 0, speed: 1, x: 32,
    widthCells: 1, patOff: 0, colorOff: 0, ...over,
  });
  const opts = (over = {}) => ({
    ramBase: 0xd080, satBase: 0x7600, colorBase: 0x7400, patternGroupBase: 8, gameYOffset: 0,
    playerHitbox: { x: 3, y: 3, w: 9, h: 29 }, terminalFallPx: 6, ...over,
  });
  const variants = [
    ['1 cabin, 1 cell', [shaft()], 1, {}],
    ['2 cabins, 2 cells', [shaft({ widthCells: 2 }), shaft({ path: [1, 0], startSlot: 1, startY: 100, startDir: 1, widthCells: 2, patOff: 2, colorOff: 2, x: 192 })], 2, {}],
    ['1 cabin + pause gate', [shaft()], 1, { pauseGateAsm: '    ld a, (bitmap_dialogue_active)\n    or a\n    ret nz\n' }],
  ];
  for (const [title, shafts, cells, extra] of variants) {
    const asm = buildBitmapShaftSystemAsm({ shafts, patternBytes: new Array(32 * cells * shafts.length).fill(0), colorBytes: new Array(16 * cells * shafts.length).fill(0) }, opts(extra));
    check(`${title}: generator enabled`, asm.enabled === true && asm.routinesAsm.length > 0);
    const base = reportAnalysis(title, asm.routinesAsm, REQUIRED);
    sabotageCheck(title, asm.routinesAsm, base);
  }
}

console.log(failures === 0 ? '\nSHAFT STACK CONTRACT PASS' : `\nSHAFT STACK CONTRACT FAIL (${failures} failing check${failures > 1 ? 's' : ''})`);
process.exit(failures === 0 ? 0 : 1);
