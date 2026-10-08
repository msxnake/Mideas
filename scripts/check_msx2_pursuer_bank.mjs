#!/usr/bin/env node
/**
 * Contract check of the pursuer soldier's CODE BANK (SCREEN 5 bitmap-room backend).
 *
 *   node scripts/check_msx2_pursuer_bank.mjs <unitedFiles.asm> <rom.sym> [--quiet]
 *
 * The runtime of the soldier is mapped in P2 (#8000-#9FFF) only while it runs. Anything it touches that lives in P2 but not in its
 * own bank would read or jump into whatever bank happens to be there (or into itself, unmapped under its feet), and anything that
 * moves P2 (music_update, every banked loader, the boss runtime in a big project) would pull the code from under its own ret.
 * So the code of the bank may only reference:
 *     * its own bank,
 *     * resident addresses BELOW #8000,
 *     * addresses at or above #A000 (P3 / RAM),
 *   and may never write to ROM space (a store into #4000-#BFFF is a Konami mapper register write).
 *
 * The scan covers the instructions between `bitmap_pursuerb_begin` and `bitmap_pursuerb_code_end` of the ASM and, for DW operands,
 * the whole bank up to BITMAP_PURSUER_CODE_BANK_USED_END. It lists EVERY
 *     call / jp / jr / djnz / rst target,
 *     absolute memory read and write (`ld a,(nn)`, `ld (nn),hl`, ...),
 *     address taken as an immediate (`ld hl, label`, `ld de, nn`),
 *     DW pointer,
 * resolves each expression with the symbol table of the SAME build (Glass .sym) and exits 1 on any of:
 *     * a reference into #8000-#9FFF that is not the bank itself,
 *     * a store into #4000-#BFFF (or below #4000),
 *     * a call/jump to a routine whose name says it moves P2 (music_*, mapper_set_bank_*, *select_data_bank*, *restore_resident_banks,
 *       *copy_banked*, load_room),
 *     * an indirect jump/call (`jp (hl)`...) that cannot be checked,
 *     * a symbol or expression that cannot be resolved (a check that cannot see is a check that fails).
 *
 * Read-only: neither input is modified.
 */
import fs from 'node:fs';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const quiet = process.argv.includes('--quiet');
const [asmPath, symPath] = args;
if (!asmPath || !symPath) { console.error('usage: check_msx2_pursuer_bank.mjs <unitedFiles.asm> <rom.sym> [--quiet]'); process.exit(2); }

const WINDOW_LO = 0x8000;
const WINDOW_HI = 0xA000;
const ROM_LO = 0x4000;
const RAM_LO = 0xC000;
const MOVES_P2 = [/^music_/, /^mapper_set_bank/, /select_data_bank/, /restore_resident_banks/, /copy_banked/, /^load_room$/, /^bitmap_.*_boss_/, /^bitmap_boss_/];

// ---- symbol table (Glass: "name: equ 40C4H") -------------------------------------------------------------------------------------
const sym = new Map();
const namesAt = new Map();
for (const line of fs.readFileSync(symPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^(\S+):\s*equ\s+([0-9A-Fa-f]+)H\s*$/);
  if (!m) continue;
  const value = parseInt(m[2], 16);
  sym.set(m[1], value);
  if (!namesAt.has(value)) namesAt.set(value, []);
  namesAt.get(value).push(m[1]);
}
const need = name => { if (!sym.has(name)) { console.error(`FAIL: symbol ${name} not in ${symPath} (is this a ROM with a pursuer bank?)`); process.exit(1); } return sym.get(name); };
const bankBegin = need('bitmap_pursuerb_begin');
const bankCodeEnd = need('bitmap_pursuerb_code_end');
const bankUsedEnd = need('BITMAP_PURSUER_CODE_BANK_USED_END');
const bankNumber = need('BITMAP_PURSUER_CODE_BANK');

// ---- expression evaluator ---------------------------------------------------------------------------------------------------------
class Unresolved extends Error {}
function tokenize(text) {
  const tokens = [];
  const re = /\s*(?:(#[0-9A-Fa-f]+|0[xX][0-9A-Fa-f]+|\$[0-9A-Fa-f]+|[0-9][0-9A-Fa-f]*[hH]\b|%[01]+|[0-9]+)|([A-Za-z_.][A-Za-z0-9_.]*)|(<<|>>|[-+*/()&|^~]))/y;
  let pos = 0;
  while (pos < text.length) {
    re.lastIndex = pos;
    const m = re.exec(text);
    if (!m) { if (text.slice(pos).trim() === '') break; throw new Unresolved(`cannot tokenize "${text.slice(pos)}"`); }
    pos = re.lastIndex;
    if (m[1] !== undefined) {
      const t = m[1];
      let v;
      if (t[0] === '#') v = parseInt(t.slice(1), 16);
      else if (/^0[xX]/.test(t)) v = parseInt(t.slice(2), 16);
      else if (t[0] === '$') v = parseInt(t.slice(1), 16);
      else if (/[hH]$/.test(t)) v = parseInt(t.slice(0, -1), 16);
      else if (t[0] === '%') v = parseInt(t.slice(1), 2);
      else v = parseInt(t, 10);
      tokens.push({ k: 'n', v });
    } else if (m[2] !== undefined) tokens.push({ k: 'i', v: m[2] });
    else tokens.push({ k: 'o', v: m[3] });
  }
  return tokens;
}
function evaluate(text) {
  const tokens = tokenize(text);
  let p = 0;
  const peek = () => tokens[p];
  const eat = () => tokens[p++];
  function primary() {
    const t = eat();
    if (!t) throw new Unresolved(`unexpected end of "${text}"`);
    if (t.k === 'n') return t.v;
    if (t.k === 'i') {
      if (!sym.has(t.v)) throw new Unresolved(`symbol ${t.v}`);
      return sym.get(t.v);
    }
    if (t.v === '(') { const v = or(); const c = eat(); if (!c || c.v !== ')') throw new Unresolved(`missing ) in "${text}"`); return v; }
    if (t.v === '-') return -primary();
    if (t.v === '+') return primary();
    if (t.v === '~') return ~primary();
    throw new Unresolved(`unexpected "${t.v}" in "${text}"`);
  }
  function mul() { let v = primary(); while (peek() && ['*', '/'].includes(peek().v) && peek().k === 'o') { const o = eat().v; const r = primary(); v = o === '*' ? v * r : Math.trunc(v / r); } return v; }
  function add() { let v = mul(); while (peek() && ['+', '-'].includes(peek().v) && peek().k === 'o') { const o = eat().v; const r = mul(); v = o === '+' ? v + r : v - r; } return v; }
  function shift() { let v = add(); while (peek() && ['<<', '>>'].includes(peek().v)) { const o = eat().v; const r = add(); v = o === '<<' ? v << r : v >> r; } return v; }
  function and() { let v = shift(); while (peek() && peek().v === '&') { eat(); v &= shift(); } return v; }
  function or() { let v = and(); while (peek() && (peek().v === '|' || peek().v === '^')) { const o = eat().v; const r = and(); v = o === '|' ? v | r : v ^ r; } return v; }
  const value = or();
  if (p !== tokens.length) throw new Unresolved(`trailing "${tokens[p].v}" in "${text}"`);
  return value & 0x1ffff;
}

// ---- ASM scan ---------------------------------------------------------------------------------------------------------------------
const lines = fs.readFileSync(asmPath, 'utf8').split(/\r?\n/);
const first = lines.findIndex(l => /^bitmap_pursuerb_begin:/.test(l));
const codeEnd = lines.findIndex(l => /^bitmap_pursuerb_code_end:/.test(l));
const usedEnd = lines.findIndex(l => /^BITMAP_PURSUER_CODE_BANK_USED_END:/.test(l));
if (first < 0 || codeEnd < 0 || usedEnd < 0) { console.error('FAIL: the ASM has no pursuer bank (bitmap_pursuerb_begin / _code_end / BITMAP_PURSUER_CODE_BANK_USED_END)'); process.exit(1); }

const stripComment = s => { let q = null; for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === ';') return s.slice(0, i); } return s; };
function splitOperands(text) {
  const out = [];
  let depth = 0, cur = '';
  for (const c of text) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const REGS16 = new Set(['bc', 'de', 'hl', 'sp', 'ix', 'iy']);
const isIndirectReg = inner => /^(hl|de|bc|sp|c)$/i.test(inner.trim()) || /^(ix|iy)\s*[-+]/i.test(inner.trim()) || /^(ix|iy)$/i.test(inner.trim());
const zoneOf = a => (a >= bankBegin && a < bankUsedEnd ? 'own-bank' : a >= WINDOW_LO && a < WINDOW_HI ? 'FOREIGN-P2' : a < ROM_LO ? 'low(<#4000)' : a < WINDOW_LO ? 'resident<#8000' : a < RAM_LO ? 'P3(>=#A000)' : 'RAM');
const hex4 = a => `#${a.toString(16).toUpperCase().padStart(4, '0')}`;
const nameOf = a => (namesAt.get(a) || []).filter(n => !n.startsWith('.')).slice(0, 2).join('|') || (namesAt.get(a) || []).slice(0, 1).join('') || '-';

const refs = [];
const problems = [];
function addRef(lineNo, text, kind, expr, value, note = '') {
  const zone = zoneOf(value);
  let verdict = 'ok';
  const why = [];
  if (zone === 'FOREIGN-P2') { verdict = 'FAIL'; why.push('reference into P2 outside the bank'); }
  if (kind === 'write' && !(value >= RAM_LO)) { verdict = 'FAIL'; why.push('store into ROM space (a mapper register write at #6000/#8000/#9000/#A000/#B000)'); }
  if (kind === 'call' || kind === 'jump') {
    const names = namesAt.get(value) || [];
    const bad = names.find(n => MOVES_P2.some(re => re.test(n)));
    if (bad) { verdict = 'FAIL'; why.push(`${bad} moves P2`); }
  }
  refs.push({ lineNo, text, kind, expr, value, zone, verdict, why: why.join('; '), note });
  if (verdict === 'FAIL') problems.push(`line ${lineNo}: ${text.trim()} -> ${hex4(value)} (${zone}) ${why.join('; ')}`);
}
function fail(lineNo, text, msg) { problems.push(`line ${lineNo}: ${text.trim()} -> ${msg}`); refs.push({ lineNo, text, kind: 'unresolved', expr: '', value: NaN, zone: '?', verdict: 'FAIL', why: msg, note: '' }); }

for (let i = first; i < usedEnd; i++) {
  const inCode = i < codeEnd;
  let line = stripComment(lines[i]).trim();
  if (!line) continue;
  line = line.replace(/^[A-Za-z_.][A-Za-z0-9_.]*:\s*/, '');       // a leading label
  if (!line) continue;
  const m = line.match(/^(\S+)\s*(.*)$/);
  const op = m[1].toLowerCase();
  const rest = m[2];
  const operands = splitOperands(rest);
  const lineNo = i + 1;
  try {
    if (op === 'dw' || op === 'defw') {
      for (const operand of operands) {
        const value = evaluate(operand);
        if (value >= WINDOW_LO && value < WINDOW_HI) addRef(lineNo, lines[i], 'dw-pointer', operand, value);
      }
      continue;
    }
    if (!inCode) continue;
    if (['db', 'defb', 'ds', 'defs', 'org', 'equ', 'if', 'endif', 'else', 'align'].includes(op)) continue;
    if (['call', 'jp', 'jr', 'djnz', 'rst'].includes(op)) {
      const target = operands[operands.length - 1];
      if (!target) { fail(lineNo, lines[i], 'no target operand'); continue; }
      if (/^\(.*\)$/.test(target) || /^(hl|ix|iy)$/i.test(target)) { fail(lineNo, lines[i], 'indirect control flow cannot be checked'); continue; }
      addRef(lineNo, lines[i], op === 'call' || op === 'rst' ? 'call' : 'jump', target, evaluate(target));
      continue;
    }
    if (op === 'in' || op === 'out') continue;                       // port I/O: the parenthesised operand is a port, not memory
    operands.forEach((operand, index) => {
      const paren = operand.match(/^\((.*)\)$/);
      if (paren && !isIndirectReg(paren[1])) {
        const kind = op === 'ld' && index === 0 ? 'write' : 'read';
        addRef(lineNo, lines[i], kind, paren[1], evaluate(paren[1]));
      } else if (op === 'ld' && index === 1 && REGS16.has(operands[0].toLowerCase()) && !paren && !REGS16.has(operand.toLowerCase())) {
        addRef(lineNo, lines[i], 'pointer', operand, evaluate(operand));       // ld hl, label / ld de, nn
      }
    });
  } catch (e) {
    if (e instanceof Unresolved) fail(lineNo, lines[i], `cannot resolve ${e.message}`);
    else throw e;
  }
}

// ---- report -----------------------------------------------------------------------------------------------------------------------
const header = `pursuer bank ${bankNumber}: code ${hex4(bankBegin)}-${hex4(bankCodeEnd - 1)} (${bankCodeEnd - bankBegin} B), bank used up to ${hex4(bankUsedEnd - 1)} (${bankUsedEnd - bankBegin} B); asm lines ${first + 1}-${usedEnd + 1}`;
const geometry = [];
if (bankBegin !== WINDOW_LO) geometry.push(`bank code does not start at #8000 (starts at ${hex4(bankBegin)})`);
if (bankUsedEnd > WINDOW_HI) geometry.push(`bank overflows #A000 (ends at ${hex4(bankUsedEnd)})`);
for (const g of geometry) problems.push(g);
if (!quiet) {
  console.log(header);
  const kinds = ['call', 'jump', 'read', 'write', 'pointer', 'dw-pointer', 'unresolved'];
  for (const kind of kinds) {
    const list = refs.filter(r => r.kind === kind);
    console.log(`\n${kind}: ${list.length}`);
    for (const r of list) {
      console.log(`  line ${String(r.lineNo).padStart(5)}  ${r.text.trim().padEnd(48)} -> ${Number.isNaN(r.value) ? '?' : hex4(r.value)} ${nameOf(r.value).padEnd(32)} ${r.zone.padEnd(15)} ${r.verdict}${r.why ? ' (' + r.why + ')' : ''}`);
    }
  }
} else {
  console.log(header);
}
const count = kind => refs.filter(r => r.kind === kind).length;
console.log(`\nsummary: ${count('call')} call target(s), ${count('jump')} jp/jr/djnz target(s), ${count('read')} absolute read(s), ${count('write')} absolute write(s), ${count('pointer')} immediate address(es), ${count('dw-pointer')} DW pointer(s) into P2; ${problems.length} problem(s)`);
if (problems.length) {
  console.log('\nFAIL pursuer bank contract:');
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('PASS pursuer bank contract: every reference is the bank itself, resident < #8000 or >= #A000, stores are RAM only, nothing moves P2');
