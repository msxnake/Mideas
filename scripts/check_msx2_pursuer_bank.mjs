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
 * PART 1 - the bank itself. The scan covers the instructions between `bitmap_pursuerb_begin` and `bitmap_pursuerb_code_end` of the ASM
 * and, for DW operands, the whole bank up to BITMAP_PURSUER_CODE_BANK_USED_END. It lists EVERY
 *     call / jp / jr / djnz / rst target,
 *     absolute memory read and write (`ld a,(nn)`, `ld (nn),hl`, ...),
 *     address taken as an immediate (`ld hl, label`, `ld de, nn`),
 *     DW pointer,
 * resolves each expression with the symbol table of the SAME build (Glass .sym) and exits 1 on any of:
 *     * a reference into #8000-#9FFF that is not the bank itself,
 *     * a store into #4000-#BFFF (or below #4000),
 *     * a call/jump to a routine whose name says it moves P2 (music_*, mapper_set_bank_*, *select_data_bank*, *restore_resident_banks,
 *       *copy_banked*, load_room),
 *     * a call/jump OUT of the bank to anything that is not on the WHITELIST below (resident routines are not free to call: each one
 *       the soldier needs is added to the list on purpose, and PART 2 proves it safe),
 *     * an indirect jump/call (`jp (hl)`...) that cannot be checked,
 *     * a symbol or expression that cannot be resolved (a check that cannot see is a check that fails).
 *
 * PART 2 - the WHITELIST and its TRANSITIVE CLOSURE. A routine on the list is called from code that has P2 = the soldier's bank, so
 * everything it can reach must be safe in THAT state. The closure is walked over the ASM (call/jp/jr/djnz targets, fall-through, the
 * code after a call) from every list entry that exists in this build, and every instruction reached is held to the rules above:
 *     * it must LIVE below #8000 or at or above #A000. The location is taken from the .sym of THIS build: a big project's resident
 *       code runs up to ~#BC00, so a routine that sits at #7FF0 in the lab can sit at #8F00 in a big ROM and the check is only
 *       worth anything run against that ROM. The block between a label and the next symbol is checked as a whole, so a routine
 *       that merely CROSSES #8000 is caught too;
 *     * it may not reference (read, write, jump, take the address of) anything inside #8000-#9FFF: that is the soldier's bank, not
 *       what the routine meant;
 *     * it may not store into #4000-#BFFF, call anything whose name moves P2, jump through a register, or use a symbol the .sym does
 *       not know.
 * Every whitelisted routine is checked whether or not the bank calls it today, so an F1b that starts calling it finds it already
 * proven for this ROM. An entry marked `optional` may be absent from a build (bitmap_probe_floor exists only with one-way platforms).
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

/**
 * The resident routines the soldier's bank may CALL. Edit this list on purpose, never to silence the check: each entry is a routine
 * that (1) does not touch the mapper, (2) reads only RAM and tables below #8000 / above #A000 and (3) lives outside #8000-#9FFF in
 * the ROM being checked (PART 2 verifies all three, in the .sym of that ROM).
 *   bitmap_probe_solid   B = x, C = y -> NZ when the pixel is solid (cells, shapes, closed doors): the line of sight and the
 *                        collision queries of the soldier. Keeps BC, clobbers AF/DE/HL.
 *   bitmap_probe_floor   the same question for "can I stand here" once the room has one-way platforms.
 */
const WHITELIST = [
  { name: 'bitmap_probe_solid' },
  { name: 'bitmap_probe_floor', optional: true },
];

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
const whitelistNames = new Set(WHITELIST.map(entry => entry.name));
const whitelisted = value => (namesAt.get(value) || []).find(n => whitelistNames.has(n));

/** One ASM line -> { labels, op, operands } or null for blank / comment-only lines. */
function parseLine(raw) {
  let line = stripComment(raw).trim();
  if (!line) return null;
  const labels = [];
  for (;;) {
    const m = line.match(/^([A-Za-z_.][A-Za-z0-9_.]*):\s*/);
    if (!m) break;
    labels.push(m[1]);
    line = line.slice(m[0].length);
  }
  if (!line) return { labels, op: '', operands: [] };
  const m = line.match(/^(\S+)\s*(.*)$/);
  return { labels, op: m[1].toLowerCase(), operands: splitOperands(m[2]) };
}

/**
 * Every address an instruction can transfer control to or touch. Yields { kind, expr } with kind in
 * call | jump | read | write | pointer. `in`/`out` operands are ports, not memory. Throws Unresolved on indirect control flow.
 */
function* instructionRefs(parsed) {
  const { op, operands } = parsed;
  if (!op || ['db', 'defb', 'dw', 'defw', 'ds', 'defs', 'org', 'equ', 'if', 'endif', 'else', 'align'].includes(op)) return;
  if (['call', 'jp', 'jr', 'djnz', 'rst'].includes(op)) {
    const target = operands[operands.length - 1];
    if (!target) throw new Unresolved('no target operand');
    if (/^\(.*\)$/.test(target) || /^(hl|ix|iy)$/i.test(target)) throw new Unresolved('indirect control flow cannot be checked');
    yield { kind: op === 'call' || op === 'rst' ? 'call' : 'jump', expr: target };
    return;
  }
  if (op === 'in' || op === 'out') return;
  for (let index = 0; index < operands.length; index++) {
    const operand = operands[index];
    const paren = operand.match(/^\((.*)\)$/);
    if (paren && !isIndirectReg(paren[1])) yield { kind: op === 'ld' && index === 0 ? 'write' : 'read', expr: paren[1] };
    else if (op === 'ld' && index === 1 && REGS16.has(operands[0].toLowerCase()) && !paren && !REGS16.has(operand.toLowerCase())) yield { kind: 'pointer', expr: operand };
  }
}

// ======== PART 1: the bank ======================================================================================================
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
    // A transfer out of the bank is allowed only to a routine on the WHITELIST (a jump or call inside the bank is the bank itself).
    if (zone !== 'own-bank') {
      const listed = whitelisted(value);
      if (listed) note = `whitelisted: ${listed}`;
      else if (verdict !== 'FAIL' || zone !== 'FOREIGN-P2') { verdict = 'FAIL'; why.push(`${nameOf(value)} is not on the whitelist of routines the soldier's bank may call`); }
    }
  }
  refs.push({ lineNo, text, kind, expr, value, zone, verdict, why: why.join('; '), note });
  if (verdict === 'FAIL') problems.push(`line ${lineNo}: ${text.trim()} -> ${hex4(value)} (${zone}) ${why.join('; ')}`);
}
function fail(lineNo, text, msg) { problems.push(`line ${lineNo}: ${text.trim()} -> ${msg}`); refs.push({ lineNo, text, kind: 'unresolved', expr: '', value: NaN, zone: '?', verdict: 'FAIL', why: msg, note: '' }); }

for (let i = first; i < usedEnd; i++) {
  const inCode = i < codeEnd;
  const parsed = parseLine(lines[i]);
  if (!parsed || !parsed.op) continue;
  const lineNo = i + 1;
  const { op, operands } = parsed;
  try {
    if (op === 'dw' || op === 'defw') {
      for (const operand of operands) {
        const value = evaluate(operand);
        if (value >= WINDOW_LO && value < WINDOW_HI) addRef(lineNo, lines[i], 'dw-pointer', operand, value);
      }
      continue;
    }
    if (!inCode) continue;
    for (const ref of instructionRefs(parsed)) addRef(lineNo, lines[i], ref.kind, ref.expr, evaluate(ref.expr));
  } catch (e) {
    if (e instanceof Unresolved) fail(lineNo, lines[i], `cannot resolve ${e.message}`);
    else throw e;
  }
}

// ======== PART 2: the whitelist and its transitive closure ======================================================================
const labelLine = new Map();
lines.forEach((raw, index) => {
  const parsed = parseLine(raw);
  if (parsed) for (const label of parsed.labels) if (!labelLine.has(label)) labelLine.set(label, index);
});
// Symbol addresses in order, to know how far the code under a label extends (the block ends at the next symbol).
const addressesSorted = [...new Set([...sym.values()])].sort((a, b) => a - b);
const blockEnd = address => {
  let lo = 0, hi = addressesSorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (addressesSorted[mid] <= address) lo = mid + 1; else hi = mid; }
  return lo < addressesSorted.length ? addressesSorted[lo] : address + 1;
};

const closure = {
  entries: [],          // { name, address, zone, status }
  routines: new Map(),  // label -> { address, zone, via }
  instructions: 0,
  problems: [],
};
const closureProblem = (via, lineNo, text, msg) => {
  closure.problems.push(`${via} (line ${lineNo}): ${text.trim()} -> ${msg}`);
};
// The label a line belongs to (the last label at or before it, in file order): where the code under that line lives.
const owningLabel = new Map();
{
  let current = null;
  lines.forEach((raw, index) => {
    const parsed = parseLine(raw);
    if (parsed && parsed.labels.length) current = parsed.labels[parsed.labels.length - 1];
    owningLabel.set(index, current);
  });
}
const noFallThrough = new Set(['ret', 'reti', 'retn']);
function walkClosure(entry) {
  const entryName = entry.name;
  const seen = new Set();
  const range = { lo: Infinity, hi: 0 };
  const stack = [{ line: labelLine.get(entryName), via: entryName }];
  while (stack.length) {
    const { line: startLine, via } = stack.pop();
    let i = startLine;
    for (;;) {
      if (i === undefined || i >= lines.length || seen.has(i)) break;
      seen.add(i);
      const parsed = parseLine(lines[i]);
      if (parsed) {
        const label = parsed.labels[parsed.labels.length - 1];
        for (const name of parsed.labels) {
          if (!closure.routines.has(name) && sym.has(name)) {
            const address = sym.get(name);
            const end = blockEnd(address);
            // The block under this label: the whole of it has to stay outside the window, so a routine that crosses #8000 is caught.
            let zone = zoneOf(address);
            if (zone !== 'own-bank' && address < WINDOW_LO && end > WINDOW_LO && end - address < 0x2000) zone = 'CROSSES-#8000';
            if (zone === 'FOREIGN-P2' || zone === 'own-bank' || zone === 'CROSSES-#8000') {
              closureProblem(via, i + 1, lines[i], `${name} lives at ${hex4(address)}-${hex4(end - 1)} (${zone}): the soldier's bank is mapped there while this runs`);
            }
            closure.routines.set(name, { address, zone, via });
            range.lo = Math.min(range.lo, address);
            range.hi = Math.max(range.hi, Math.min(end, address + 0x2000));
          }
        }
        if (label === undefined) { /* anonymous continuation */ }
        if (parsed.op) {
          closure.instructions++;
          if (['db', 'defb', 'dw', 'defw', 'ds', 'defs', 'org'].includes(parsed.op)) break;       // data or an origin change: not code
          try {
            for (const ref of instructionRefs(parsed)) {
              let value;
              try { value = evaluate(ref.expr); } catch (e) { if (e instanceof Unresolved) { closureProblem(via, i + 1, lines[i], `cannot resolve ${e.message}`); continue; } throw e; }
              const zone = zoneOf(value);
              const names = namesAt.get(value) || [];
              if (zone === 'FOREIGN-P2' || zone === 'own-bank') closureProblem(via, i + 1, lines[i], `${ref.kind} of ${nameOf(value)} at ${hex4(value)}: inside #8000-#9FFF, where the soldier's bank is mapped`);
              if (ref.kind === 'write' && !(value >= RAM_LO)) closureProblem(via, i + 1, lines[i], `store into ROM space at ${hex4(value)} (a mapper register write)`);
              if (ref.kind === 'call' || ref.kind === 'jump') {
                const bad = names.find(n => MOVES_P2.some(re => re.test(n)));
                if (bad) closureProblem(via, i + 1, lines[i], `${ref.kind} to ${bad}, which moves P2`);
                // follow the edge: into the code of the target (BIOS and anything without source in this ASM stops here)
                const targetName = /^[A-Za-z_.][A-Za-z0-9_.]*$/.test(ref.expr) ? ref.expr : names.find(n => labelLine.has(n));
                if (targetName && labelLine.has(targetName)) stack.push({ line: labelLine.get(targetName), via: `${via} > ${targetName}` });
                else if (zone !== 'low(<#4000)') closureProblem(via, i + 1, lines[i], `${ref.kind} to ${hex4(value)} (${nameOf(value)}) has no code in the ASM to follow`);
              }
            }
          } catch (e) {
            if (e instanceof Unresolved) closureProblem(via, i + 1, lines[i], e.message);
            else throw e;
          }
          // control flow after this instruction
          if (noFallThrough.has(parsed.op) && parsed.operands.length === 0) break;                      // ret
          if (parsed.op === 'jp' || parsed.op === 'jr') { if (parsed.operands.length === 1) break; }    // unconditional
        }
      }
      i += 1;
    }
  }
  return range;
}
for (const entry of WHITELIST) {
  if (!sym.has(entry.name)) {
    closure.entries.push({ name: entry.name, address: NaN, zone: '-', status: entry.optional ? 'absent (optional)' : 'MISSING' });
    if (!entry.optional) closure.problems.push(`${entry.name}: on the whitelist but not in the .sym of this ROM (the soldier's bank has nothing to call)`);
    continue;
  }
  const address = sym.get(entry.name);
  const end = blockEnd(address);
  const zone = zoneOf(address);
  const status = [];
  if (!labelLine.has(entry.name)) {
    closure.problems.push(`${entry.name}: in the .sym (${hex4(address)}) but without a label in the ASM, so its code cannot be read`);
    closure.entries.push({ name: entry.name, address, zone, status: 'NO-SOURCE' });
    continue;
  }
  if (zone === 'FOREIGN-P2' || zone === 'own-bank') {
    closure.problems.push(`${entry.name}: lives at ${hex4(address)}-${hex4(end - 1)} in THIS ROM, inside #8000-#9FFF: unreachable while the soldier's bank is mapped`);
    status.push('IN P2');
  }
  const range = walkClosure(entry);
  closure.entries.push({ name: entry.name, address, lo: range.lo, end: range.hi, zone, status: status.join(', ') || 'ok' });
}
for (const message of closure.problems) problems.push(`whitelist closure: ${message}`);

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
      console.log(`  line ${String(r.lineNo).padStart(5)}  ${r.text.trim().padEnd(48)} -> ${Number.isNaN(r.value) ? '?' : hex4(r.value)} ${nameOf(r.value).padEnd(32)} ${r.zone.padEnd(15)} ${r.verdict}${r.why ? ' (' + r.why + ')' : r.note ? ' (' + r.note + ')' : ''}`);
    }
  }
  console.log(`\nwhitelist (${WHITELIST.length} entries) in THIS ROM:`);
  for (const e of closure.entries) {
    const span = e.end && Number.isFinite(e.lo) ? ` closure ${hex4(e.lo)}-${hex4(e.end - 1)}` : '';
    console.log(`  ${e.name.padEnd(28)} ${Number.isNaN(e.address) ? '-----' : hex4(e.address)}  ${String(e.zone).padEnd(15)} ${e.status}${span}`);
  }
  console.log(`\nclosure of the whitelist: ${closure.routines.size} labelled routine/label(s), ${closure.instructions} instruction line(s) walked`);
  const byZone = new Map();
  for (const [name, info] of closure.routines) byZone.set(info.zone, (byZone.get(info.zone) || 0) + 1);
  console.log(`  by zone: ${[...byZone].map(([zone, n]) => `${zone} ${n}`).join(', ') || '(none)'}`);
  const highest = [...closure.routines].sort((a, b) => b[1].address - a[1].address)[0];
  if (highest) console.log(`  highest address reached: ${highest[0]} at ${hex4(highest[1].address)} (${highest[1].zone})`);
} else {
  console.log(header);
}
const count = kind => refs.filter(r => r.kind === kind).length;
console.log(`\nsummary: ${count('call')} call target(s), ${count('jump')} jp/jr/djnz target(s), ${count('read')} absolute read(s), ${count('write')} absolute write(s), ${count('pointer')} immediate address(es), ${count('dw-pointer')} DW pointer(s) into P2; whitelist ${closure.entries.filter(e => e.status === 'ok').length}/${WHITELIST.length} proven (${closure.routines.size} routines, ${closure.instructions} instruction lines in the closure); ${problems.length} problem(s)`);
if (problems.length) {
  console.log('\nFAIL pursuer bank contract:');
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('PASS pursuer bank contract: every reference is the bank itself, resident < #8000 or >= #A000, stores are RAM only, nothing moves P2, and every call out of the bank goes to a whitelisted routine whose whole closure is outside #8000-#9FFF');
