// Transition engine bank (SCREEN 5 bitmap-room backend, Konami MegaROM).
//
// The shared transition engine (screen5TransitionEngine.ts) used to live entirely in the resident window #4000-#BFFF, which
// nearly every real project fills (test719: a Transition node with the diagonal wipe overflowed it by 223 bytes: 385 B of HMMV
// fill player + a 932 B fill table + glue). The fill half (HMMV launch, tile-expanding rectangle player, the tables it walks)
// is only ever CALLED from the boot intro and from the GameFlow dispatcher, never from a game frame, and it reads nothing but
// its own table and the stack, so it can run from a bank mapped at #8000:
//
//   resident (bitmap_tfx_play, bitmap_tfx_frame_wait)  maps the bank, calls the player, restores P2/P3 / keeps the song ticking
//   bank T @#8000   bitmap_tfxb_* player + every bitmap_tfx_table_N
//
// What stays resident (docs/msx/MSX2_TFX_BANK_PLAN.md section 7.1): the PALETTE half (pal_set / pal_lerp / pal_emit, the solid
// palettes, bitmap_tfx_world_palette_ptr). It reads screen5_bitmap_palette_data and bitmap_intro_sceneN_palette, which in a big
// project sit in #8000-#9FFF, i.e. hidden while a bank is mapped there.
//
// The call sites do not change: they still do `ld hl, bitmap_tfx_table_N` / `call bitmap_tfx_play`. HL is an address inside the
// bank window, DE = Y offset of the visible page.
//
// The bank is appended after the music, Intro and Transition-FX banks, so a project without the engine (or a simple32k ROM,
// where there are no banks) keeps a byte-identical ROM.

import type { Screen5TfxDataPool } from './screen5TransitionEngine';
import { generateScreen5TfxRuntime } from './screen5TransitionEngine';

/** Label prefix of the bank-resident player. The resident trampolines keep the historical `bitmap_tfx_*` names. */
export const BITMAP_TFX_BANK_PREFIX = 'bitmap_tfxb';
const BANK_BYTES = 0x2000;
const MAX_BANK = 255;
/**
 * Bytes of player code at the start of the bank (wait_ce + hmmv + play + rect_tiles, with headroom). The tables follow it.
 * scripts/check_msx2_tfx_bank_smoke.mjs / the export test fail if Glass produces more than this (the TS size check below
 * would under-count and only the generic Glass "Negative initial size" would remain).
 */
export const BITMAP_TFX_CODE_BYTES_ESTIMATE = 400;
/** Banks whose low 6 bits are all set would expose the SCC in the P2 window: never used for data. */
const SCC_WINDOW_MASK = 0x3f;
const isSccWindowBank = (bank: number): boolean => (bank & SCC_WINDOW_MASK) === SCC_WINDOW_MASK;

/** Contract header required by ai/ASM_GUIDELINES.md for every generated routine (same layout as the other bank generators). */
function routineHeader(name: string, purpose: string, c: {
  input?: string; output?: string; destroys: string; preserves?: string; calls?: string; side?: string; notes?: string;
}): string {
  const block = (title: string, text?: string) => (text ? `; ${title}:\n${text.split('\n').map(l => `;   ${l}`).join('\n')}\n;\n` : '');
  return `
; ------------------------------------------------------------
; FUNCTION: ${name}
; ------------------------------------------------------------
; PURPOSE:
${purpose.split('\n').map(l => `;   ${l}`).join('\n')}
;
${block('INPUT', c.input ?? 'None.')}${block('OUTPUT', c.output ?? 'None.')}${block('DESTROYS', c.destroys)}${block('PRESERVES', c.preserves ?? 'IX, IY (and whatever DESTROYS does not list).')}${block('CALLS', c.calls ?? 'None.')}${block('SIDE EFFECTS', c.side ?? 'None.')}${block('NOTES', c.notes ?? 'None.')}; ------------------------------------------------------------
`;
}

export interface BitmapTfxBankBuild {
  /** `BITMAP_TFX_CODE_BANK EQU n`; empty when the engine does not use a bank. */
  equatesAsm: string;
  /** The two resident trampolines (goes at INTRO_RESIDENT_MARKER, below #8000). */
  residentAsm: string;
  /** The bank itself (player + tables), appended after the last data / FX bank. */
  banksAsm: string;
  /** Last bank used (== firstBank - 1 when the build is empty). */
  lastBank: number;
  /** For the IDE bank map: the code bank is sized by Glass from its end label. */
  banks: Array<{ bank: number; kind: 'code' }>;
  /** Table descriptions for the bank map tooltip. */
  tableNames: string[];
  /** Sum of the fill tables, for reports. */
  tableBytes: number;
  warnings: string[];
}

export const EMPTY_BITMAP_TFX_BANK_BUILD: Readonly<BitmapTfxBankBuild> = Object.freeze({
  equatesAsm: '',
  residentAsm: '',
  banksAsm: '',
  lastBank: 0,
  banks: [] as BitmapTfxBankBuild['banks'],
  tableNames: [] as string[],
  tableBytes: 0,
  warnings: [] as string[],
});

/** Largest block sizes the editor offers per effect are in SCREEN5_TRANSITION_BLOCK_SIZES; the message just points at them. */
function tablesDoNotFitMessage(pool: Screen5TfxDataPool, budget: number): string {
  const tables = pool.describeFillTables().sort((a, b) => b.bytes - a.bytes);
  const list = tables.slice(0, 4).map(t => `${t.effect}${t.effect === 'screen5_iris' ? ` (${t.irisShape})` : ''} with block size ${t.blockSize}: ${t.bytes} bytes`).join('; ');
  return `Transition engine export: the fill tables of the Transition nodes need ${pool.fillTableBytes} bytes but the transition engine bank has ${budget} free (${BANK_BYTES} - ${BITMAP_TFX_CODE_BYTES_ESTIMATE} of player code). Largest: ${list}. Pick a larger block size on those nodes (a bigger block means fewer rectangles per step), a lighter effect, or fewer different transition effects.`;
}

/**
 * Lays out the engine bank for the fill tables the project collected in `pool`.
 *
 * Call it AFTER the pool is complete (the boot intro and the GameFlow dispatcher fill it while their ASM is built).
 * Returns the empty build for a simple32k ROM (no banks: the engine stays resident exactly as before) and when no fill
 * transition is used. Throws a user-facing error when the tables do not fit one bank.
 *
 * @param options.firstBank   first bank number free for this bank (after music, Intro and Transition-FX banks)
 * @param options.musicTick   the song is ticked during the waits (bitmap_flow_wait_vblank) instead of a bare bitmap_wait_vblank
 */
export function buildBitmapTfxBank(
  pool: Screen5TfxDataPool,
  options: { firstBank: number; megaRom: boolean; musicTick: boolean },
): BitmapTfxBankBuild {
  if (!options.megaRom || !pool.usesFill) return EMPTY_BITMAP_TFX_BANK_BUILD;

  const budget = BANK_BYTES - BITMAP_TFX_CODE_BYTES_ESTIMATE;
  if (pool.fillTableBytes > budget) throw new Error(tablesDoNotFitMessage(pool, budget));

  let codeBank = options.firstBank;
  const padding: string[] = [];
  for (let expected = options.firstBank; isSccWindowBank(expected); expected++) {
    padding.push(`; Bank ${expected} reserved: (bank & #3F) == #3F would expose the SCC in the P2 window.\n    ds #2000, #FF`);
    codeBank = expected + 1;
  }
  if (codeBank > MAX_BANK) throw new Error('No ROM bank left for the transition engine.');

  const waitRoutine = options.musicTick ? 'bitmap_flow_wait_vblank' : 'bitmap_wait_vblank';
  const equates = `; ---- Transition engine bank (SCREEN 5 fill player + fill tables) ----
BITMAP_TFX_CODE_BANK  EQU ${codeBank}
`;

  const resident = `
; ---- Transition engine: resident trampolines (the fill player lives in bank ${codeBank}, mapped at #8000) ----
${routineHeader('bitmap_tfx_play', 'Play a SCREEN 5 transition fill table. Maps the engine bank at #8000, runs the player there and\nputs the resident banks back before returning to the caller.', {
    input: 'HL = fill table (an address in the engine bank window, #8000+), DE = Y offset of the visible page (0 / 256).',
    destroys: 'AF, BC, DE, HL.',
    preserves: 'IX, IY.',
    calls: 'mapper_set_bank_p2, bitmap_tfxb_play (banked), bitmap_room_restore_resident_banks.',
    side: 'Fills VRAM of the visible page. On return P2 = 2, P3 = 3, R#15 = 0 and R#17 = 32 (as the resident player left them).',
    notes: 'Lives below #8000 on purpose: it maps the bank that would otherwise hide its own next instruction. Callers may\nthemselves sit in #8000-#BFFF (big projects): the final jp restores P2 before the ret pops their address.\nStack: +4 bytes over the old resident player (this return + the player call).',
  })}bitmap_tfx_play:
    ld a, BITMAP_TFX_CODE_BANK
    call mapper_set_bank_p2
    call ${BITMAP_TFX_BANK_PREFIX}_play
    jp bitmap_room_restore_resident_banks
${routineHeader('bitmap_tfx_frame_wait', 'One frame wait for the banked fill player: puts the resident banks back, waits (ticking the song when the\nROM has music), then maps the engine bank again so the player can return into it.', {
    input: 'P2 = engine bank (called only from the bank).',
    output: 'P2 = engine bank, one frame elapsed, R#15 = 0.',
    destroys: 'AF, BC.',
    preserves: 'DE, HL, IX, IY.',
    calls: `bitmap_room_restore_resident_banks, ${waitRoutine}, mapper_set_bank_p2.`,
    side: `${options.musicTick ? 'One music_update tick (it leaves P2 on the resident bank). ' : ''}The wait routine may live in #8000-#9FFF, which is why bank 2 comes back BEFORE it.`,
    notes: 'Restoring P2 = 2 before the song is ticked keeps the SCC driver\'s mirror (mapper_bank_p2_current) truthful: it saves\nP2, maps #3F to reach the chip and writes P2 back; with the engine bank still in P2 it would unmap its own caller.\nbitmap_tfx_frame_wait_done is the sampling point of the parity tests: the wait has finished, P2 is not yet remapped.',
  })}bitmap_tfx_frame_wait:
    call bitmap_room_restore_resident_banks
    call ${waitRoutine}
bitmap_tfx_frame_wait_done:
    ld a, BITMAP_TFX_CODE_BANK
    jp mapper_set_bank_p2
bitmap_tfx_resident_end:
    if bitmap_tfx_resident_end > #8000
    ds -1   ; the engine trampolines cross #8000: they would unmap themselves. Free resident space below #8000.
    endif
`;

  const player = generateScreen5TfxRuntime({
    prefix: BITMAP_TFX_BANK_PREFIX,
    interrupts: false,
    fill: true,
    palette: false,
    waitCe: true,
    frameWaitAsm: '    call bitmap_tfx_frame_wait',
  });
  const out: string[] = [
    '; ==================================================================',
    '; TRANSITION ENGINE BANK (SCREEN 5 HMMV fill player + fill tables)',
    '; ==================================================================',
    ...padding,
    'BITMAP_TFX_CODE_BANK_PHYS_START:',
    '    org #8000',
    player,
    pool.emitFillTables(),
    'BITMAP_TFX_CODE_BANK_USED_END:',
    '    ds #A000 - $, #FF   ; fails loudly if the player + tables outgrow one 8KB bank',
    '    org BITMAP_TFX_CODE_BANK_PHYS_START + #2000',
    '',
  ];

  return {
    equatesAsm: equates,
    residentAsm: resident,
    banksAsm: out.join('\n'),
    lastBank: codeBank,
    banks: [{ bank: codeBank, kind: 'code' }],
    tableNames: pool.describeFillTables().map(t => `${t.effect}${t.effect === 'screen5_iris' ? ` ${t.irisShape}` : ''} (block ${t.blockSize}): ${t.bytes} B`),
    tableBytes: pool.fillTableBytes,
    warnings: [],
  };
}
