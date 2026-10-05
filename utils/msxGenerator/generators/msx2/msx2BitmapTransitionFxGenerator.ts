// Transition FX (entry effect of a boot presentation) for the SCREEN 5 bitmap-room backend.
//
// The editor side (utils/msx2TransitionFx.ts) compiles an `msx2transition` asset into a flat
// byte block: a header, a stream of VDP commands (HMMM / HMMV / palette / page flip / sound /
// waits) with easing and bounces already evaluated, a skip sequence and a sound table. The
// editor's Play decodes THAT block on a JS model of the VDP. This module is the other half:
// a small Z80 interpreter that replays the very same bytes on the real VDP, and the glue that
// lays it out in the ROM.
//
//   resident (12 B)   bitmap_fx_run          maps the bank, calls the interpreter, restores P2/P3
//   bank F @#8000     interpreter + PSG one-shot sequencer + block table + the effect blocks
//
// The resident window of a real project is nearly full (test703: 229 bytes free), so only the
// trampoline lives below #8000. The interpreter, the effect block(s) and the sound records all
// share ONE bank and the bank never changes while an effect plays (unlike the music, which moves
// P2). The bank is appended after the music and Intro banks, so a project that uses no effect keeps
// a byte-identical ROM.
//
// The picture the effect composes is the DERIVED image (deriveFxImage) uncompressed to VRAM
// page 1 (invisible) by the ordinary RLE upload; the interpreter copies it to page 0 piece by piece.
//
// RAM: #E700-#E70B (BITMAP_FX_RAM_BASE). The Intro owns #E600-#E6FF entirely and nothing else
// uses #E700+ (measured, docs/msx/MSX2_TRANSITION_FX_F0.md). The effect runs BEFORE the game RAM is
// initialised (run_bitmap_intro is called from init_rom), so the interpreter clears its own state.

import type { ProjectAnalysis } from '../../../asmTemplateGenerator';
import type { Msx2Screen5PresentationConfig, Msx2TransitionAsset, ProjectAsset } from '../../../../types';
import {
  compileTransitionDetailed,
  decodeFxBlock,
  readFxSourceImage,
  soundsFromAssets,
} from '../../../msx2TransitionFx';
import { buildPsgOneShotAsm } from './msx2PsgOneShot';

export const BITMAP_FX_RAM_BASE = 0xe700;
/** Bytes of RAM the interpreter clears and uses: #E700-#E70B (the range #E700-#E73F is reserved for it). */
export const BITMAP_FX_RAM_BYTES = 12;
/** First RAM byte the Intro owns (#E600-#E6FF). */
const INTRO_RAM_BASE = 0xe600;
const BANK_BYTES = 0x2000;
const MAX_BANK = 255;
/**
 * Interpreter + PSG sequencer + dispatch tables, with headroom. scripts/check_msx2_transition_fx_smoke.mjs
 * fails if glass produces more than this (the bank-size check below would under-count).
 */
export const BITMAP_FX_CODE_BYTES_ESTIMATE = 900;
/** Banks whose low 6 bits are all set would expose the SCC in the P2 window: never used for data. */
const SCC_WINDOW_MASK = 0x3f;

const hex = (value: number, width = 2): string => `#${(value & (width === 2 ? 0xff : 0xffff)).toString(16).toUpperCase().padStart(width, '0')}`;
const isSccWindowBank = (bank: number): boolean => (bank & SCC_WINDOW_MASK) === SCC_WINDOW_MASK;
const oneLine = (text: unknown): string => String(text ?? '').replace(/[\r\n\t]+/g, ' ');
const dbLines = (bytes: ArrayLike<number>): string[] => {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk: string[] = [];
    for (let j = i; j < Math.min(bytes.length, i + 16); j++) chunk.push(hex(bytes[j]));
    lines.push(`    DB ${chunk.join(',')}`);
  }
  return lines;
};

/** Contract header required by ai/ASM_GUIDELINES.md for every generated routine. */
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

// ---------------------------------------------------------------------------
// Compile one presentation's effect (called while the GameFlow intro scenes are resolved)
// ---------------------------------------------------------------------------

/** One effect block as it goes to the ROM. Two scenes using the same asset on the same picture share one. */
export interface BitmapFxBlock {
  key: string;
  name: string;
  bytes: Uint8Array;
}

/** What a presentation scene needs from its effect: the picture it ends on and the block that builds it. */
export interface BitmapFxCompiled extends BitmapFxBlock {
  /** The DERIVED picture, 4 bpp, 128 bytes per row, 212 rows: goes to VRAM page 1. */
  bitmapBytes: number[];
  /** Palette of that picture (the final palette of the effect), 32 bytes: byte1 = (R << 4) | B, byte2 = G. */
  paletteBytes: number[];
  warnings: string[];
}

export interface BitmapFxSceneContext {
  analysis: ProjectAnalysis;
  /** GameFlow node that carries `fxAssetId`, for the messages. */
  nodeId: string;
  fxAssetId: string;
  /** The presentation asset the node shows (resolved by the caller, `id` filled in). */
  presentation: Msx2Screen5PresentationConfig & { id?: string; name?: string };
}

/**
 * Compiles the `msx2transition` asset named by a Screen5Presentation node. Throws a user-facing
 * error (the export stops) for an unknown asset, an effect made for another picture, an invalid
 * asset, or a block the interpreter cannot replay; returns the compiler's warnings otherwise.
 */
export function compileBitmapFxForPresentation(ctx: BitmapFxSceneContext): BitmapFxCompiled {
  const assets = (((ctx.analysis as any).assets || []) as ProjectAsset[]);
  const asset = assets.find(item => item.id === ctx.fxAssetId && item.type === 'msx2transition');
  const where = `Transition FX of node "${ctx.nodeId}"`;
  if (!asset || !asset.data) {
    throw new Error(`${where}: it names the effect "${ctx.fxAssetId}", but the project has no such Transition asset (msx2transition). Pick another effect on the node or clear it.`);
  }
  const data = asset.data as unknown as Msx2TransitionAsset;
  const presentationId = String(ctx.presentation.id || '');
  if (data.sourcePresentationAssetId !== presentationId) {
    throw new Error(`${where}: the effect "${asset.name}" was authored for the presentation "${data.sourcePresentationAssetId || '(none)'}" but the node shows "${presentationId || '(none)'}". Open the effect and pick that presentation as its source, or use the matching effect.`);
  }
  let image;
  try {
    image = readFxSourceImage(ctx.presentation);
  } catch (error) {
    throw new Error(`${where}: ${(error as Error).message}`);
  }
  const result = compileTransitionDetailed(data, image, { sounds: soundsFromAssets(assets) });
  if (result.errors.length) {
    throw new Error(`${where}: the effect "${asset.name}" cannot be compiled:\n- ${result.errors.join('\n- ')}`);
  }
  const derived = result.derived!;
  validateBitmapFxBlock(result.bytes, String(asset.name || ctx.fxAssetId), where);
  const paletteBytes = derived.palette.flatMap(([r, g, b]) => [((r & 7) << 4) | (b & 7), g & 7]);
  return {
    key: `${ctx.fxAssetId}|${presentationId}`,
    name: String(asset.name || ctx.fxAssetId),
    bytes: result.bytes,
    bitmapBytes: Array.from(derived.packed),
    paletteBytes,
    warnings: result.warnings,
  };
}

/** Structural checks on top of the compiler's own: what only THIS interpreter cannot replay. Throws a user-facing error. */
export function validateBitmapFxBlock(bytes: Uint8Array, assetName: string, where: string): void {
  let decoded;
  try {
    decoded = decodeFxBlock(bytes);
  } catch (error) {
    throw new Error(`${where}: the compiled block of "${assetName}" is malformed (${(error as Error).message}).`);
  }
  const soundCount = decoded.sounds.length;
  for (const op of [...decoded.mainOps, ...decoded.finalOps]) {
    if (op.op === 'LMMM') {
      throw new Error(`${where}: the effect "${assetName}" uses the per-pixel copy (LMMM), which the Z80 interpreter does not implement yet.`);
    }
    if (op.op === 'SFX' && op.id >= soundCount) {
      throw new Error(`${where}: the compiled block of "${assetName}" starts sound ${op.id} but its table has ${soundCount}.`);
    }
  }
}

// ---------------------------------------------------------------------------
// ROM layout
// ---------------------------------------------------------------------------

export interface BitmapFxBuild {
  /** Block key -> index passed in A to bitmap_fx_run. */
  indexByKey: Map<string, number>;
  equatesAsm: string;
  residentAsm: string;
  banksAsm: string;
  /** Last bank used (== firstBank - 1 when the build is empty). */
  lastBank: number;
  /** For the IDE bank map: the code bank is sized by Glass from its end label. */
  banks: Array<{ bank: number; kind: 'code' }>;
  /** Block names, for the bank map tooltip. */
  blockNames: string[];
  warnings: string[];
}

export const BITMAP_FX_NEEDS_MEGAROM_MESSAGE = 'Transition FX needs a Konami MegaROM export (the interpreter and the effect live in a ROM bank); switch the export to MegaROM, or clear the effect on the presentation node.';

export const EMPTY_BITMAP_FX_BUILD: Readonly<BitmapFxBuild> = Object.freeze({
  indexByKey: new Map<string, number>(),
  equatesAsm: '',
  residentAsm: '',
  banksAsm: '',
  lastBank: 0,
  banks: [] as BitmapFxBuild['banks'],
  blockNames: [] as string[],
  warnings: [] as string[],
});

export function buildBitmapTransitionFx(
  blocks: BitmapFxBlock[],
  options: {
    firstBank: number;
    megaRom: boolean;
    /** First free byte after the project's dedicated RAM chain. */
    ramChainEnd?: number;
    /** An Intro node also exists: it owns #E600-#E6FF, so the chain must stop there. */
    introPresent: boolean;
  },
): BitmapFxBuild {
  if (blocks.length === 0) return EMPTY_BITMAP_FX_BUILD;
  if (!options.megaRom) {
    throw new Error(BITMAP_FX_NEEDS_MEGAROM_MESSAGE);
  }
  const ramLimit = options.introPresent ? INTRO_RAM_BASE : BITMAP_FX_RAM_BASE;
  if (options.ramChainEnd !== undefined && options.ramChainEnd > ramLimit) {
    throw new Error(`Transition FX export: the project's dedicated RAM chain already reaches ${hex(options.ramChainEnd, 4)}, which collides with ${options.introPresent ? `the Intro scratch RAM (${hex(INTRO_RAM_BASE, 4)}-${hex(INTRO_RAM_BASE + 0xff, 4)}), placed just below the effect's` : `the effect's scratch RAM (${hex(BITMAP_FX_RAM_BASE, 4)}-${hex(BITMAP_FX_RAM_BASE + BITMAP_FX_RAM_BYTES - 1, 4)})`}. Reduce dynamic HUD widgets, pickups, enemies or platforms.`);
  }
  if (blocks.length > 127) throw new Error(`Transition FX export: ${blocks.length} different effects; the block table holds at most 127.`);

  const dataBytes = blocks.reduce((sum, block) => sum + block.bytes.length, 0) + blocks.length * 2;
  const budget = BANK_BYTES - BITMAP_FX_CODE_BYTES_ESTIMATE;
  if (dataBytes > budget) {
    throw new Error(`Transition FX export: the effect block(s) need ${dataBytes} bytes but the interpreter bank has ${budget} free (${BANK_BYTES} - ${BITMAP_FX_CODE_BYTES_ESTIMATE} of code). Shorten the effect (fewer frames, fewer strips, shorter sounds) or use fewer different effects.`);
  }

  let codeBank = options.firstBank;
  const padding: string[] = [];
  for (let expected = options.firstBank; isSccWindowBank(expected); expected++) {
    padding.push(`; Bank ${expected} reserved: (bank & #3F) == #3F would expose the SCC in the P2 window.\n    ds #2000, #FF`);
    codeBank = expected + 1;
  }
  if (codeBank > MAX_BANK) throw new Error('No ROM bank left for the Transition FX interpreter.');

  const R = (offset: number) => hex(BITMAP_FX_RAM_BASE + offset, 4);
  const equates = `; ---- Transition FX (boot entry effect): bank + RAM ----
BITMAP_FX_CODE_BANK  EQU ${codeBank}
BITMAP_FX_RAM_BYTES  EQU ${BITMAP_FX_RAM_BYTES}
bitmap_fx_prev       EQU ${R(0x00)}   ; key state of the previous tick (0/1)
bitmap_fx_n          EQU ${R(0x01)}   ; ticks left in the current SYNC
bitmap_fx_final      EQU ${R(0x02)}   ; word: skip sequence (absolute), 0 = not skippable
bitmap_fx_sounds     EQU ${R(0x04)}   ; word: sound table (absolute)
bitmap_fx_base       EQU ${R(0x06)}   ; word: block being played
bitmap_fx_psg_active EQU ${R(0x08)}   ; PSG one-shot: playing flag
bitmap_fx_psg_timer  EQU ${R(0x09)}   ; PSG one-shot: frames left in the record
bitmap_fx_psg_ptr    EQU ${R(0x0A)}   ; word: PSG one-shot read cursor
`;

  const resident = `
; ---- Transition FX: resident part (the interpreter lives in bank ${codeBank}, mapped at #8000) ----
${routineHeader('bitmap_fx_run', 'Play one boot transition effect. Maps the effect bank at #8000, runs the interpreter and puts the\nresident banks back.', {
    input: 'A = effect block index (order of the different effects used by the GameFlow presentations).',
    destroys: 'AF, BC, DE, HL.',
    calls: 'mapper_set_bank_p2, bitmap_fx_main (banked), bitmap_room_restore_resident_banks.',
    side: 'VRAM page 0 is composed from page 1, the VDP palette, R#2 and R#7 change and the effect RAM (#E700-#E70B)\nis cleared; on return P2 = 2, P3 = 3, R#2 = page 0 and R#15 = 0.',
    notes: 'Lives below #8000 on purpose: it maps the bank that would otherwise hide its own next instruction.\nR#7 is NOT restored here: the caller puts the room backdrop back after the scene wait.',
  })}bitmap_fx_run:
    ld c, a
    ld a, BITMAP_FX_CODE_BANK
    call mapper_set_bank_p2
    call bitmap_fx_main
    jp bitmap_room_restore_resident_banks
bitmap_fx_resident_end:
    if bitmap_fx_resident_end > #8000
    ds -1   ; the effect trampoline crosses #8000: it would unmap itself. Free resident space below #8000.
    endif
`;

  const blockLines: string[] = [];
  blocks.forEach((block, index) => {
    blockLines.push(`bitmap_fx_block_${index}:  ; ${oneLine(block.name)}: ${block.bytes.length} bytes`);
    blockLines.push(...dbLines(block.bytes));
  });
  const code = buildFxCode();
  const out: string[] = ['; ==================================================================', '; TRANSITION FX BANK (boot entry effect of a Screen5Presentation node)', '; =================================================================='];
  out.push(...padding);
  out.push('BITMAP_FX_CODE_BANK_PHYS_START:', '    org #8000', code);
  out.push('bitmap_fx_table:', `    DW ${blocks.map((_b, i) => `bitmap_fx_block_${i}`).join(', ')}`, ...blockLines);
  out.push('BITMAP_FX_CODE_BANK_USED_END:', '    ds #A000 - $, #FF   ; fails loudly if the interpreter + effect blocks outgrow one 8KB bank', '    org BITMAP_FX_CODE_BANK_PHYS_START + #2000', '');

  return {
    indexByKey: new Map(blocks.map((block, index) => [block.key, index])),
    equatesAsm: equates,
    residentAsm: resident,
    banksAsm: out.join('\n'),
    lastBank: codeBank,
    banks: [{ bank: codeBank, kind: 'code' }],
    blockNames: blocks.map(block => block.name),
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// The interpreter (assembled at #8000 inside the effect bank)
// ---------------------------------------------------------------------------

/**
 * Runs in P2: it may only CALL resident routines (below #8000) that leave P2 alone. It calls none:
 * it talks to the VDP, the PPI and the PSG on its own, so the bank stays mapped for the whole effect.
 *
 * Timing model (what stream/decoder agree on):
 *  - A "tick" is one 60 Hz vblank. bitmap_fx_wait_vblank polls S#0 until the frame flag is SET and
 *    that read clears it, WITHOUT first discarding a stale flag: a frame whose commands outlast one
 *    vblank finds the flag already latched and its first tick passes at once. That is what keeps a
 *    frame the compiler priced at n ticks at n ticks (a "discard, then wait for the next edge" wait
 *    would turn 2 into 3).
 *  - Palette / R#2 / R#7 writes follow a tick immediately, inside the ~3.1 ms the VDP leaves between
 *    the vblank flag and the first visible line.
 */
function buildFxCode(): string {
  const H = routineHeader;
  const psg = buildPsgOneShotAsm('bitmap_fx_psg', 'bitmap_fx_table', { exportStartHl: true });
  return `
${H('bitmap_fx_main', 'Play the effect block number given in C: run its command stream until END (or until a key press jumps\nto the skip sequence) and leave the VDP showing page 0.', {
    input: 'C = block index (0-based, order of bitmap_fx_table).',
    destroys: 'AF, BC, DE, HL.',
    preserves: 'IX, IY.',
    calls: 'bitmap_fx_wait_vblank, then the op handlers through bitmap_fx_loop.',
    side: 'Clears #E700-#E70B first (the effect runs before the game RAM is initialised), sets R#7 from the block\nheader and R#2 = page 0, paints VRAM page 0 and the palette, may play one PSG sound on channel C and\nreads the keyboard (SPACE) and both joystick buttons. R#15 = 0 on return.',
    notes: 'Runs from the effect bank mapped at #8000; IX walks the stream. Every handler ends in "jp bitmap_fx_loop",\nso the stack only holds the saved IX and the return address.',
  })}bitmap_fx_main:
    push ix
    ld a, c                        ; block index (the RAM clear below needs BC)
    ld hl, ${hex(BITMAP_FX_RAM_BASE, 4)}
    ld de, ${hex(BITMAP_FX_RAM_BASE + 1, 4)}
    ld bc, BITMAP_FX_RAM_BYTES - 1
    ld (hl), 0
    ldir                           ; every state variable starts at zero
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_fx_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)                     ; DE = block address
    ld (bitmap_fx_base), de
    push de
    pop ix                         ; IX = block header
    ld a, (ix+2)                   ; R#7 at the start
    out (#99), a
    ld a, #87
    out (#99), a
    ld a, #1F
    out (#99), a
    ld a, #82
    out (#99), a                   ; R#2 = page 0 on screen
    ld a, (ix+1)
    and 1                          ; bit 0 = skippable
    jp z, bitmap_fx_no_skip
    ld l, (ix+6)
    ld h, (ix+7)                   ; offFinal (0 = no skip sequence)
    ld a, h
    or l
    jp z, bitmap_fx_no_skip
    push ix
    pop de
    add hl, de
    ld (bitmap_fx_final), hl
bitmap_fx_no_skip:
    push ix
    pop de                         ; DE = block address
    ld l, (ix+8)
    ld h, (ix+9)                   ; offSounds
    add hl, de
    ld (bitmap_fx_sounds), hl
    ld l, (ix+4)
    ld h, (ix+5)                   ; offStream
    add hl, de
    push hl
    pop ix                         ; IX = first op
    call bitmap_fx_wait_vblank     ; start on a vblank edge: the first palette lands inside its window
bitmap_fx_loop:
    ld a, (ix+0)
    cp 12
    jp nc, bitmap_fx_end           ; >= #0C is invalid: treat as END
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_fx_ops
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    jp (hl)
bitmap_fx_ops:
    DW bitmap_fx_end, bitmap_fx_op_sync, bitmap_fx_op_hmmm, bitmap_fx_op_hmmv
    DW bitmap_fx_end, bitmap_fx_op_pal, bitmap_fx_op_palrun, bitmap_fx_op_flip
    DW bitmap_fx_op_sfx, bitmap_fx_op_sfxoff, bitmap_fx_op_waitkey, bitmap_fx_op_backdrop

${H('bitmap_fx_end', 'Op #00 (END) and every unknown or reserved opcode (LMMM #04, >= #0C): finish the effect.', {
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_fx_wait_ce, bitmap_fx_psg_stop.',
    side: 'Waits for the command engine, silences PSG channel C, R#2 = page 0, R#15 = 0, restores IX and returns\nto the caller of bitmap_fx_main.',
    notes: 'Entered by JP with the saved IX still on the stack.',
  })}bitmap_fx_end:
    call bitmap_fx_wait_ce
    call bitmap_fx_psg_stop
    ld a, #1F
    out (#99), a
    ld a, #82
    out (#99), a                   ; R#2 = page 0
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a                   ; R#15 = 0: S#0, what the room code expects
    pop ix
    ret

${H('bitmap_fx_op_sync', 'Op #01 (SYNC n): wait for the command engine, then n ticks. A new press of SPACE or fire during a tick\njumps to the skip sequence when the block is skippable.', {
    input: 'IX = op (IX+1 = n, 1..255).',
    destroys: 'AF, BC, DE, HL, IX.',
    calls: 'bitmap_fx_wait_ce, bitmap_fx_tick.',
    notes: 'The skip jump leaves IX at the skip sequence (bitmap_fx_final); it contains no SYNC, only the palette, the\nrepaint of whatever the animation touched, and END.',
  })}bitmap_fx_op_sync:
    call bitmap_fx_wait_ce
    ld a, (ix+1)
    ld (bitmap_fx_n), a
bitmap_fx_sync_tick:
    call bitmap_fx_tick            ; B = fresh press
    ld a, b
    or a
    jp z, bitmap_fx_sync_next
    ld hl, (bitmap_fx_final)
    ld a, h
    or l
    jp z, bitmap_fx_sync_next      ; not skippable
    push hl
    pop ix                         ; IX = skip sequence
    jp bitmap_fx_loop
bitmap_fx_sync_next:
    ld a, (bitmap_fx_n)
    dec a
    ld (bitmap_fx_n), a
    jp nz, bitmap_fx_sync_tick
    inc ix
    inc ix
    jp bitmap_fx_loop

${H('bitmap_fx_op_hmmm', 'Op #02 (HMMM sxb, sy, dxb, dy, wb, h, pages): high-speed VRAM -> VRAM copy.', {
    input: 'IX = op: SX = sxb*2, SY = sy + 256*(pages & 3), DX = dxb*2, DY = dy + 256*(pages >> 2 & 3), NX = wb*2 (wb 1..128), NY = h.',
    destroys: 'AF, BC, HL (IX += 8).',
    calls: 'bitmap_fx_wait_ce.',
    side: 'Waits for the engine to be idle, loads R#32..R#46 through R#17 (auto-increment) and starts the command with the\nlast write; does not wait for it to finish. Leaves R#15 = 2.',
  })}bitmap_fx_op_hmmm:
    call bitmap_fx_wait_ce
    ld a, #20
    out (#99), a
    ld a, #91
    out (#99), a                   ; R#17 = 32: indirect writes start at R#32 with auto-increment
    ld a, (ix+1)
    add a, a
    out (#9B), a                   ; R#32 SX low
    xor a
    out (#9B), a                   ; R#33 SX high
    ld a, (ix+2)
    out (#9B), a                   ; R#34 SY low
    ld a, (ix+7)
    and 3
    out (#9B), a                   ; R#35 SY high = source page
    ld a, (ix+3)
    add a, a
    out (#9B), a                   ; R#36 DX low
    xor a
    out (#9B), a                   ; R#37 DX high
    ld a, (ix+4)
    out (#9B), a                   ; R#38 DY low
    ld a, (ix+7)
    rrca
    rrca
    and 3
    out (#9B), a                   ; R#39 DY high = destination page
    ld a, (ix+5)
    add a, a                       ; NX = wb*2; carry = wb >> 7
    out (#9B), a                   ; R#40 NX low
    ld a, 0
    rla
    out (#9B), a                   ; R#41 NX high (1 only for wb = 128)
    ld a, (ix+6)
    out (#9B), a                   ; R#42 NY low
    xor a
    out (#9B), a                   ; R#43 NY high
    out (#9B), a                   ; R#44 CLR (unused by HMMM)
    out (#9B), a                   ; R#45 ARG: left to right, top to bottom, VRAM
    ld a, #D0
    out (#9B), a                   ; R#46 CMD = HMMM: starts the copy
    ld bc, 8
    add ix, bc
    jp bitmap_fx_loop

${H('bitmap_fx_op_hmmv', 'Op #03 (HMMV dxb, dy, wb, h, page, col): high-speed rectangle fill.', {
    input: 'IX = op: DX = dxb*2, DY = dy + 256*(page & 3), NX = wb*2 (wb 1..128), NY = h, col = both nibbles.',
    destroys: 'AF, BC, HL (IX += 7).',
    calls: 'bitmap_fx_wait_ce.',
    side: 'Same protocol as HMMM, starting at R#36. Leaves R#15 = 2.',
  })}bitmap_fx_op_hmmv:
    call bitmap_fx_wait_ce
    ld a, #24
    out (#99), a
    ld a, #91
    out (#99), a                   ; R#17 = 36: indirect writes start at R#36
    ld a, (ix+1)
    add a, a
    out (#9B), a                   ; R#36 DX low
    xor a
    out (#9B), a                   ; R#37 DX high
    ld a, (ix+2)
    out (#9B), a                   ; R#38 DY low
    ld a, (ix+5)
    and 3
    out (#9B), a                   ; R#39 DY high = page
    ld a, (ix+3)
    add a, a
    out (#9B), a                   ; R#40 NX low
    ld a, 0
    rla
    out (#9B), a                   ; R#41 NX high
    ld a, (ix+4)
    out (#9B), a                   ; R#42 NY low
    xor a
    out (#9B), a                   ; R#43 NY high
    ld a, (ix+6)
    out (#9B), a                   ; R#44 CLR = colour byte
    xor a
    out (#9B), a                   ; R#45 ARG
    ld a, #C0
    out (#9B), a                   ; R#46 CMD = HMMV: starts the fill
    ld bc, 7
    add ix, bc
    jp bitmap_fx_loop

${H('bitmap_fx_op_pal', 'Op #05 (PAL idx, rb, g): write one palette entry.', {
    input: 'IX = op (IX+1 = index, IX+2 = (R << 4) | B, IX+3 = G).',
    destroys: 'AF, BC (IX += 4).',
    side: 'R#16 = index, then two writes to port #9A. Only valid right after a SYNC (the compiler guarantees it).',
  })}bitmap_fx_op_pal:
    ld a, (ix+1)
    out (#99), a
    ld a, #90
    out (#99), a                   ; R#16 = palette index
    ld a, (ix+2)
    out (#9A), a
    ld a, (ix+3)
    out (#9A), a
    ld bc, 4
    add ix, bc
    jp bitmap_fx_loop

${H('bitmap_fx_op_palrun', 'Op #06 (PALRUN first, n, (rb, g) x n): write n contiguous palette entries.', {
    input: 'IX = op (IX+1 = first slot, IX+2 = n, then n pairs).',
    destroys: 'AF, BC, HL (IX += 3 + 2n).',
    side: 'R#16 = first, then 2n bytes with OTIR to port #9A (the VDP auto-increments the palette index).',
  })}bitmap_fx_op_palrun:
    ld a, (ix+1)
    out (#99), a
    ld a, #90
    out (#99), a                   ; R#16 = first slot
    ld a, (ix+2)
    add a, a
    ld b, a                        ; B = 2n bytes
    push ix
    pop hl
    inc hl
    inc hl
    inc hl                         ; HL = first pair
    ld c, #9A
    otir
    push hl
    pop ix                         ; HL now sits on the next op
    jp bitmap_fx_loop

${H('bitmap_fx_op_flip', 'Op #07 (FLIP page): show another VRAM page.', {
    input: 'IX = op (IX+1 = page 0..3).',
    destroys: 'AF (IX += 2).',
    side: 'R#2 = (page << 5) | #1F; takes effect on the next raster line (hence only valid right after a SYNC).',
  })}bitmap_fx_op_flip:
    ld a, (ix+1)
    and 3
    rrca
    rrca
    rrca
    or #1F
    out (#99), a
    ld a, #82
    out (#99), a
    inc ix
    inc ix
    jp bitmap_fx_loop

${H('bitmap_fx_op_backdrop', 'Op #0B (BACKDROP c): set the backdrop colour (R#7).', {
    input: 'IX = op (IX+1 = colour 0..15).',
    destroys: 'AF (IX += 2).',
  })}bitmap_fx_op_backdrop:
    ld a, (ix+1)
    and #0F
    out (#99), a
    ld a, #87
    out (#99), a
    inc ix
    inc ix
    jp bitmap_fx_loop

${H('bitmap_fx_op_sfx', 'Op #08 (SFX id): start the id-th sound of the block on PSG channel C (restarts it if it was playing).', {
    input: 'IX = op (IX+1 = table index, bit 7 clear).',
    destroys: 'AF, DE, HL (IX += 2).',
    calls: 'bitmap_fx_psg_start_hl.',
    side: 'Looks the sound up in the block table: bitmap_fx_sounds = count byte, then one word per sound holding the\noffset of its records from the block start.',
  })}bitmap_fx_op_sfx:
    ld l, (ix+1)
    ld h, 0
    add hl, hl                     ; 2 * id
    ld de, (bitmap_fx_sounds)
    add hl, de
    inc hl                         ; skip the count byte
    ld e, (hl)
    inc hl
    ld d, (hl)                     ; DE = record stream offset from the block start
    ld hl, (bitmap_fx_base)
    add hl, de                     ; HL = the records
    call bitmap_fx_psg_start_hl
    inc ix
    inc ix
    jp bitmap_fx_loop

${H('bitmap_fx_op_sfxoff', 'Op #09 (SFXOFF): silence PSG channel C.', {
    input: 'IX = op.',
    destroys: 'AF (IX += 1).',
    calls: 'bitmap_fx_psg_stop.',
  })}bitmap_fx_op_sfxoff:
    call bitmap_fx_psg_stop
    inc ix
    jp bitmap_fx_loop

${H('bitmap_fx_op_waitkey', 'Op #0A (WAITKEY): wait for SPACE or fire: release, press, release (a held key cannot leak through).', {
    input: 'IX = op.',
    destroys: 'AF, BC, DE, HL (IX += 1).',
    calls: 'bitmap_fx_tick.',
    notes: 'One poll per tick, so the sound sequencer keeps running; C = phase (0 wait for release, 1 wait for press, 2 wait\nfor release). A skip press is NOT acted on here: WAITKEY is the "wait for the player" the author asked for.',
  })}bitmap_fx_op_waitkey:
    ld c, 0
bitmap_fx_wk_poll:
    push bc
    call bitmap_fx_tick            ; A = key down
    pop bc
    ld b, a
    ld a, c
    or a
    jp z, bitmap_fx_wk_p0
    dec a
    jp z, bitmap_fx_wk_p1
    ld a, b                        ; phase 2: done when the key is up again
    or a
    jp nz, bitmap_fx_wk_poll
    inc ix
    jp bitmap_fx_loop
bitmap_fx_wk_p0:
    ld a, b
    or a
    jp nz, bitmap_fx_wk_poll       ; still held from before
    ld c, 1
    jp bitmap_fx_wk_poll
bitmap_fx_wk_p1:
    ld a, b
    or a
    jp z, bitmap_fx_wk_poll
    ld c, 2
    jp bitmap_fx_wk_poll

${H('bitmap_fx_tick', 'One 60 Hz tick: wait for the vblank, advance the sound, sample the controls.', {
    output: 'A = 1 while SPACE / fire is down, 0 otherwise. B = 1 on a FRESH press (up -> down edge), 0 otherwise.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_fx_wait_vblank, bitmap_fx_psg_tick, bitmap_fx_read_key.',
    side: 'bitmap_fx_prev = the key state just read.',
  })}bitmap_fx_tick:
    call bitmap_fx_wait_vblank
    call bitmap_fx_psg_tick
    call bitmap_fx_read_key
    ld b, a                        ; B = key now
    ld a, (bitmap_fx_prev)
    ld c, a                        ; C = key at the previous tick
    ld a, b
    ld (bitmap_fx_prev), a
    ld a, c
    xor 1
    and b                          ; press = now AND NOT before
    ld c, a
    ld a, b
    ld b, c
bitmap_fx_tick_done:               ; the tick is over (a label: the OpenMSX smoke samples the VDP/PSG here)
    ret

${H('bitmap_fx_wait_vblank', 'Wait for the frame flag (S#0 bit 7) and clear it.', {
    destroys: 'AF, BC.',
    preserves: 'DE, HL, IX, IY.',
    side: 'R#15 = 0 on return. A flag that is already latched (set while the command engine was busy) passes at once.',
    notes: 'The poll is bounded (about 0.2 s) like bitmap_wait_vblank, so a host that never raises the flag cannot hang the boot.',
  })}bitmap_fx_wait_vblank:
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a                   ; R#15 = 0: status port reads S#0
    ld bc, #4000
bitmap_fx_vb_poll:
    in a, (#99)                    ; reading S#0 clears the flag
    or a
    ret m                          ; bit 7 set
    dec bc
    ld a, b
    or c
    jp nz, bitmap_fx_vb_poll
    ret

${H('bitmap_fx_wait_ce', 'Wait until the VDP command engine is idle (S#2 bit 0 = CE clear).', {
    destroys: 'AF.',
    preserves: 'BC, DE, HL, IX, IY.',
    side: 'Leaves R#15 = 2 (the next vblank wait selects S#0 again).',
  })}bitmap_fx_wait_ce:
    ld a, 2
    out (#99), a
    ld a, #8F
    out (#99), a
bitmap_fx_ce_poll:
    in a, (#99)
    rrca                           ; CE -> carry
    jp c, bitmap_fx_ce_poll
    ret

${H('bitmap_fx_read_key', 'Sample the advance controls: SPACE (PPI row 8 bit 0) or the fire button A of either joystick port.', {
    output: 'A = 1 while any of them is down, 0 otherwise.',
    destroys: 'AF, B.',
    preserves: 'C, DE, HL, IX, IY.',
    side: 'Selects PPI row 8; writes PSG register 15 (joystick port select) and leaves register 14 latched. No BIOS call.',
    notes: 'Same routine as the Intro (bitmap_intro_read_key). Joystick lines are active low and pulled up, so an unplugged port reads as released.',
  })}bitmap_fx_read_key:
    in a, (#AA)
    and #F0
    or 8
    out (#AA), a
    in a, (#A9)
    cpl
    and #01
    ld b, a                        ; B = SPACE
    ld a, 15
    out (#A0), a
    in a, (#A2)
    and #BF
    out (#A1), a                   ; joystick port 1
    ld a, 14
    out (#A0), a
    in a, (#A2)
bitmap_fx_key_joy1:                ; (label: the smoke forces the trigger bit here, as the Intro's does)
    and #10                        ; trigger A, 0 = pressed
    jp nz, bitmap_fx_key_port2
    ld b, 1
bitmap_fx_key_port2:
    ld a, 15
    out (#A0), a
    in a, (#A2)
    or #40
    out (#A1), a                   ; joystick port 2
    ld a, 14
    out (#A0), a
    in a, (#A2)
bitmap_fx_key_joy2:
    and #10
    jp nz, bitmap_fx_key_done
    ld b, 1
bitmap_fx_key_done:
    ld a, b
    ret
${psg}`;
}
