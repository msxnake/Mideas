#!/usr/bin/env node
/**
 * MSX2 boss Room Lock (chain barrier) contract + Z80 validity checks.
 *
 * Part A pins the chain barrier that actually ships: the perimeter walk that
 * seals only EMPTY cells, its collision marker, and the two call sites that
 * raise it on room load and drop it on defeat.
 *
 * Part B scans every ASM line the boss generator emits for instructions the
 * Z80 does not have and for literals Glass cannot parse. This exists because a
 * parallel barrier was once added that used `call LDIRVM` (bitmap rooms paint
 * with V9938 commands, so the symbol is not defined here), `add hl, 16` and
 * `0x8000` literals. Glass only reported the first one, at assembly time.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const bossGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts');

// ---------------------------------------------------------------- Part A ---
// The shipping chain barrier. These are the pieces a rewrite must not drop.
const contractChecks = [
  [
    'Barrier raise/drop entry points exist',
    bossGen.includes('bitmap_boss_barrier_apply:') &&
      bossGen.includes('bitmap_boss_barrier_remove:') &&
      bossGen.includes('bitmap_boss_barrier_walk:'),
  ],
  [
    'Perimeter is walked as two rows + two columns (not a full-screen blit)',
    bossGen.includes('bitmap_boss_barrier_row:') &&
      bossGen.includes('bitmap_boss_barrier_col:') &&
      bossGen.includes('bitmap_boss_barrier_cell:'),
  ],
  [
    'Barrier is raised on room load and dropped on boss defeat',
    bossGen.includes('call bitmap_boss_barrier_apply') &&
      bossGen.includes('call bitmap_boss_barrier_remove'),
  ],
  [
    'Sealed cells use the #80 marker so only empty cells are restored later',
    bossGen.includes('boss_barrier_draw') && /#80/.test(bossGen),
  ],
  [
    'Barrier RAM is chained off the generator base, never a hardcoded address',
    bossGen.includes('barrierRamBase') &&
      bossGen.includes('boss_barrier_draw EQU ${asmWord(barrierRamBase)'),
  ],
  [
    'Barrier tables stay opt-in (byte-identical ROM when no barrier tile)',
    bossGen.includes('const hasBarrier = (data.barrierTables || []).some'),
  ],
];

// ---------------------------------------------------------------- Part B ---
// Strip ASM comments, then look for instructions the Z80 does not have.
// Registers that `add hl,` / `adc hl,` / `sbc hl,` genuinely accept.
const HL_PAIR_OPERANDS = /^(bc|de|hl|sp)$/i;

const invalidPatterns = [
  {
    // `add hl, 16` — no immediate form. Same for ix/iy.
    name: 'add/adc/sbc on a 16-bit pair with a non-pair operand',
    test: (line) => {
      const m = line.match(/^\s*(?:add|adc|sbc)\s+(hl|ix|iy)\s*,\s*([^;]+)$/i);
      if (!m) return false;
      return !HL_PAIR_OPERANDS.test(m[2].trim());
    },
  },
  {
    // `ld hl, de` and friends: no 16-bit register-to-register load.
    name: '16-bit register-to-register ld (use push/pop or two 8-bit lds)',
    test: (line) => /^\s*ld\s+(hl|de|bc)\s*,\s*(hl|de|bc)\s*$/i.test(line),
  },
  {
    name: 'sub on a 16-bit pair (use or a / sbc hl,rr)',
    test: (line) => /^\s*sub\s+(hl|ix|iy)\s*,/i.test(line),
  },
  {
    // Glass wants #FF / 0FFh, not 0xFF.
    name: '0x hex literal (Glass expects #)',
    test: (line) => /\b0x[0-9a-f]+/i.test(line),
  },
  {
    // BIOS name-table helpers do not belong in the SCREEN 5 bitmap path.
    name: 'BIOS LDIRVM/CHGMOD call in the bitmap boss path (use V9938 commands)',
    test: (line) => /^\s*call\s+(LDIRVM|CHGMOD)\b/i.test(line),
  },
];

/**
 * Pull candidate ASM lines out of the generator's template literals. A line
 * counts as ASM when it starts with a known mnemonic; everything else (TS
 * code, JSX, prose) is skipped. Comments are stripped first so a `;` note
 * mentioning `0x40` never trips the literal check.
 */
const MNEMONIC = /^\s*(ld|add|adc|sub|sbc|and|or|xor|cp|inc|dec|push|pop|call|jp|jr|djnz|ret|rst|ex|exx|halt|nop|di|ei|rl|rr|rla|rra|rlc|rrc|sla|sra|srl|bit|set|res|ldir|lddr|ldi|ldd|neg|cpl|scf|ccf|in|out|im)\b/i;

const offenders = [];
bossGen.split(/\r?\n/).forEach((raw, index) => {
  // Drop the ASM comment tail; keep the instruction.
  const line = raw.split(';')[0];
  if (!MNEMONIC.test(line)) return;
  // Template interpolations are not literal ASM; the emitted value is checked
  // where it is built, not here.
  if (line.includes('${')) return;
  for (const pattern of invalidPatterns) {
    if (pattern.test(line)) {
      offenders.push({ line: index + 1, text: raw.trim(), rule: pattern.name });
    }
  }
});

// ------------------------------------------------------------------ run ---
let failed = 0;

for (const [name, passed] of contractChecks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
}

if (offenders.length === 0) {
  console.log('OK: emitted ASM has no invalid Z80 instructions or 0x literals');
} else {
  failed += offenders.length;
  console.log(`FAIL: ${offenders.length} invalid ASM line(s):`);
  for (const offender of offenders) {
    console.log(`  msx2BitmapBossGenerator.ts:${offender.line}  ${offender.text}`);
    console.log(`    -> ${offender.rule}`);
  }
}

if (failed) {
  throw new Error(`MSX2 boss Room Lock checks failed: ${failed}`);
}
console.log('MSX2 boss Room Lock checks passed.');
