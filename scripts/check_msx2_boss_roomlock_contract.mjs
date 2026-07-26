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
const bossEditor = read('components', 'editors', 'Msx2BossEditor.tsx');

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
  // The player enters THROUGH the perimeter, so on room load they stand on a
  // cell the chain wants to seal (top entry puts them on row 0, side entries on
  // col 0 / col 15). Sealing it buried them inside a solid tile.
  [
    'A cell the player occupies is never sealed',
    bossGen.includes('call bitmap_player_overlaps_16') &&
      bossGen.includes('.cell_seal') &&
      bossGen.includes('ld (boss_barrier_pending), a'),
  ],
  [
    'The player overlap test preserves the caller loop counter (push/pop bc)',
    /push bc[\s\S]{0,400}?call bitmap_player_overlaps_16[\s\S]{0,40}?pop bc/.test(bossGen),
  ],
  [
    'Skipped openings are retried until the player steps clear',
    bossGen.includes('boss_barrier_pending EQU') &&
      bossGen.includes('boss_barrier_retry EQU') &&
      bossGen.includes('.no_barrier_resweep'),
  ],
  [
    'Barrier RAM block was resized for the two new bytes',
    bossGen.includes('barrierRamBase + (hasBarrier ? 7 : 0)') &&
      !bossGen.includes('(hasBarrier ? 5 : 0)'),
  ],
];

// ---------------------------------------------------------------- Part C ---
// Boss Editor "Body & Graphics". The body is a `msx2bitmapstamp` asset drawn as
// a picture, NOT an atlas entry: importing a stamp into a room splits it into
// 16x16 cells, so an atlas-entry dropdown lists stamp fragments
// (`door_market_r0_c0`, `_r0_c1`, ...) repeated once per room. This regressed
// once when the file was reverted wholesale, so it is pinned here.
const editorChecks = [
  [
    'Body picker reads msx2bitmapstamp assets, composed into pixels',
    bossEditor.includes("asset.type !== 'msx2bitmapstamp'") &&
      bossEditor.includes('bitmapStampToPixelGrid') &&
      bossEditor.includes('function useBodyStamps'),
  ],
  [
    'Body picker draws each stamp instead of listing names in a <select>',
    bossEditor.includes('const BossBodyPicker') &&
      bossEditor.includes('const StampCanvas') &&
      bossEditor.includes('<BossBodyPicker'),
  ],
  [
    'Body selection writes bossStampAssetId (not bossAtlasEntryId)',
    bossEditor.includes('bossStampAssetId: id'),
  ],
  [
    'Body label names Bitmap Stamps, not the old atlas entry',
    bossEditor.includes('Body — Bitmap Stamp') &&
      !bossEditor.includes('Body atlas entry'),
  ],
  [
    'Damage-zone canvas draws the stamp body behind the zones',
    bossEditor.includes('bodyStamp={bodyStamp}') &&
      bossEditor.includes('<StampCanvas stamp={bodyStamp}') &&
      !bossEditor.includes('bodyEntry'),
  ],
  [
    'Legacy bossAtlasEntryId bodies still warn instead of silently breaking',
    bossEditor.includes('still points at the old atlas entry'),
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

for (const [name, passed] of [...contractChecks, ...editorChecks]) {
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
