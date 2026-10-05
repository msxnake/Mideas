#!/usr/bin/env node
/**
 * PARITY of the SCREEN 5 transition engine (bitmap_tfx_*) before / after it moves to a bank
 * (docs/msx/MSX2_TFX_BANK_PLAN.md, sections 3, 4, 5(b), 5(c) and 5(f); phase F3).
 *
 * For every case (A boot intro, B boot intro with music, C dispatcher with music, D dispatcher after a game, SCC variants)
 * it boots the REFERENCE ROM (engine resident, built from the tree before the change) and the NEW ROM (engine in a bank) in OpenMSX
 * and compares, frame by frame, what the transition did. Everything is asserted from VRAM, palette, VDP / PSG / SCC registers,
 * RAM and CPU state, NEVER from screenshots.
 *
 * USAGE
 *   node scripts/check_msx2_tfx_bank_parity.mjs [--ref DIR] [--new DIR] [--only ID,GROUP,...] [--jobs N] [--keep] [--verbose]
 *   node scripts/check_msx2_tfx_bank_parity.mjs --self [--only ...]              reference against ITSELF (instrument check: must be green)
 *   node scripts/check_msx2_tfx_bank_parity.mjs --sabotage NAME|all [--only ...] instrument check: the reference against a ROM patched on
 *                                                                                purpose; exit 0 only if the script goes RED (see --list-sabotages)
 *   node scripts/check_msx2_tfx_bank_parity.mjs --list | --list-sabotages | --help
 *   npm run test:msx2-tfx-bank-parity [-- <same options>]
 *
 *   --ref DIR        reference artefacts (default test/msx2-transition-fx/out/tfxbank_ref); cases/<id>.{rom,sym,asm}
 *   --new DIR        the artefacts after the change (default test/msx2-transition-fx/out/tfxbank_new, written by
 *                    `node scripts/build_tfx_bank_reference.mjs --out test/msx2-transition-fx/out/tfxbank_new --label after`)
 *   --only LIST      comma separated case ids (A_diagonal) or groups (A B C D) or substrings (wipe, scc); default = every case that carries the engine
 *   --self           NEW = REF (two independent OpenMSX runs of the same ROM: also proves the run is deterministic)
 *   --sabotage NAME  INSTRUMENT CHECK. NEW = an ASM patched (and re-assembled with glass.jar) so that ONE thing is wrong; the script has to go
 *                    RED, on the check that sabotage names (--list-sabotages). `all` runs every sabotage and prints a table (about 1 minute).
 *                    Most patch the REFERENCE ASM (engine resident: they prove each check can fail, with no dependence on F1's work); the
 *                    `nw_*` ones patch the ASM of --new (the banked engine: plan 5(f) items 1-5 -- wrong bank EQU, trampoline with RET, frame
 *                    wait that does not re-map the bank, altered table, music bypassed -- plus "banks not restored before the song").
 *                    `jitter` / `jitter_big` are BENIGN mutations (extra T-states per frame) that must stay GREEN: they calibrate the tolerance.
 *   --jobs N         cases in parallel (each case runs its two ROMs in parallel too; default 3)
 *   --window S       emulated seconds watched after the effect returns (default 4)
 *   --timeout S      wall-clock seconds per OpenMSX run (default 240)
 *   --work DIR       scratch directory (default test/msx2-transition-fx/out/tfxparity, gitignored)
 *   --keep           keep every run's dumps (default: only the runs of failing cases are kept)
 *   --verbose        print every check, not only the failing ones
 *   --no-oracle      skip the independent oracle (the fill plan of utils/msx2TransitionPatterns.ts); the ROM-vs-ROM checks stay
 *
 * METHOD (what is measured in each ROM, in this order)
 *   1. Breakpoint on `bitmap_tfx_play` (must be resident, < #8000, in BOTH ROMs; the call site / return address, read from the stack, too).
 *      At entry: full 128 KB VRAM, palette, R#0-R#46, PSG (+ SCC) registers, SP, IX, IY, IFF1, the mapper blocks seen at #8000 / #A000
 *      (openMSX's `romblocks` debuggable, plus a 128 byte signature of each page compared with the banks of the ROM FILE, after checking
 *      that those signatures are unique in the file so that the instrument can tell one bank from another).
 *   2. One SAMPLE per frame wait: reference ROM at `bitmap_tfx_play_wait+4` (the `pop bc` after the wait; opcode #C1 verified), new ROM
 *      at `bitmap_tfx_frame_wait_done`. Each sample: visible page rows 0-211 (27 136 B), palette, PSG/SCC regs, S#2 CE bit, frames since entry
 *      (`after frame`), HMMVs issued so far, `music_update` calls so far, mapper blocks, IFF1. A sample taken while the command engine is busy
 *      is SETTLED: it is read again at the next exit of wait_ce (nothing has been issued in between), so tolerance is 0 frames AND 0 bytes.
 *   3. Breakpoint on `bitmap_tfx_hmmv` (`bitmap_tfxb_hmmv` when the engine is in a bank): DX, DY, NX, NY, colour of every rectangle.
 *   4. Return (breakpoint on the return address): SP balanced (entry+2), IX/IY/IFF1 as at entry, mapper blocks 2/3, software mirror
 *      `mapper_bank_p2_current`, 128 KB VRAM, palette, R#0-R#46, frames spent, `music_update` calls.
 *   5. After the return, `--window` seconds: the next node / the code after the intro is reached (frames to it must match), and in the music
 *      cases the PSG/SCC registers keep changing with the same sequence.
 *   ROM against ROM, AND each ROM against an INDEPENDENT ORACLE that does not come from the ROM: `buildScreen5FillPlan` of
 *   utils/msx2TransitionPatterns.ts expanded the way bitmap_tfx_rect_tiles does (list of HMMVs, HMMVs issued per step, the table bytes, the
 *   visible page after every step simulated from the page as it was at entry, and finally every row 0-211 holding the fill byte).
 *
 * CHECK IDS (what each FAIL line is called): instrument, static-layout, engine-reached | banks-entry, entry-state, table, page-offset, hmmv-list,
 *   hmmv-vs-plan, samples-count | sample-vram, sample-vram-plan-ref/new, sample-step-pacing, sample-palette, sample-psg, sample-scc, sample-banks,
 *   sample-iff, sample-frames, sample-hmmv-count, sample-music | music-calls, music-banks | return-sp, return-ixiy, return-iff, return-mirror,
 *   return-banks, return-vram, return-palette, return-vdp-regs, return-psg, frames-in-play, final-fill | next-node, post-psg.
 *   A FAIL line prints the first thing that differs (step / byte (row, x) / register / frame) with both values.
 *
 * LABELS THE NEW ROM MUST EXPORT (.sym): bitmap_tfx_play, bitmap_tfx_frame_wait_done (opcode #3E, `ld a, BANK`), BITMAP_TFX_CODE_BANK,
 *   bitmap_tfxb_hmmv + bitmap_tfxb_wait_ce (the engine copy in the bank; `bitmap_tfx_hmmv` / `bitmap_tfx_wait_ce` are used when absent), and the
 *   tables `bitmap_tfx_table_N` inside the bank. Shared: music_update, mapper_bank_p2_current, bitmap_displayed_page, run_bitmap_intro,
 *   bitmap_update_player_sprite_animation, bitmap_gameflow_exit_flag, bitmap_gf_node_N.
 *
 * Cases: A_* boot intro (no music), B_* boot intro with PT3 (+ B_scc_wipe), C_* dispatcher with the song playing (+ C_scc_wipe, C_palette_fade_out),
 * D_* dispatcher after a game; D_*_page1 = the same ROM as D_* but the script raises bitmap_displayed_page so the engine gets DE = 256.
 * Exit code 0 = every case PASS (with --sabotage: the sabotage was CAUGHT); 1 = some case FAILED; 2 = the instrument could not run.
 * Cases not covered: test719 variants (their presentation waits for a key: see build_tfx_bank_reference.mjs --probe) and the ones
 * without engine (A_control_legacy, C_cls, C_fade_to_black: byte identity is the genbaseline harness's job).
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES, EFFECTS, TFX_NODE_PARAMS } from './build_tfx_bank_parity_fixtures.mjs';

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), '..');
const OUT_ROOT = path.join(ROOT, 'test', 'msx2-transition-fx', 'out');
const DEFAULT_REF = path.join(OUT_ROOT, 'tfxbank_ref');
const DEFAULT_NEW = path.join(OUT_ROOT, 'tfxbank_new');
const DEFAULT_WORK = path.join(OUT_ROOT, 'tfxparity');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const GLASS_JAR = path.join(ROOT, 'server', 'glass.jar');

const PAGE_BYTES = 27136; // 212 rows x 128 bytes
const VRAM_BYTES = 131072;
const SIG_OFFSETS = [0, 0x400, 0x800, 0xc00, 0x1000, 0x1400, 0x1800, 0x1ff0];
const SIG_LEN = 16;
const WAIT_CE_RET_OFFSET = 23; // bitmap_tfx_wait_ce is 24 bytes long and ends with RET

// ---------------------------------------------------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    ref: DEFAULT_REF, new: DEFAULT_NEW, only: null, self: false, sabotage: null, jobs: 3, window: 4, timeout: 240, work: DEFAULT_WORK,
    keep: false, verbose: false, oracle: true, list: false, listSabotages: false, help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => { if (i + 1 >= argv.length) throw new UsageError(`${arg} needs a value`); return argv[++i]; };
    if (arg === '--ref') args.ref = path.resolve(ROOT, value());
    else if (arg === '--new') args.new = path.resolve(ROOT, value());
    else if (arg === '--only') args.only = value().split(',').map(item => item.trim()).filter(Boolean);
    else if (arg === '--self') args.self = true;
    else if (arg === '--sabotage') args.sabotage = value();
    else if (arg.startsWith('--sabotage=')) args.sabotage = arg.slice('--sabotage='.length);
    else if (arg === '--jobs') args.jobs = Math.max(1, Number(value()) || 1);
    else if (arg === '--window') args.window = Math.max(1, Number(value()) || 4);
    else if (arg === '--timeout') args.timeout = Math.max(10, Number(value()) || 240);
    else if (arg === '--work') args.work = path.resolve(ROOT, value());
    else if (arg === '--keep') args.keep = true;
    else if (arg === '--verbose' || arg === '-v') args.verbose = true;
    else if (arg === '--no-oracle') args.oracle = false;
    else if (arg === '--list') args.list = true;
    else if (arg === '--list-sabotages') args.listSabotages = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new UsageError(`unknown argument ${arg} (see --help)`);
  }
  return args;
}

// ---------------------------------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------------------------------

const slashes = file => file.replace(/\\/g, '/');
const rel = file => path.relative(ROOT, file).replace(/\\/g, '/');
const hex4 = value => `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
const hex2 = value => value.toString(16).toUpperCase().padStart(2, '0');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function readSymbols(file) {
  const table = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (match) table.set(match[1], parseInt(match[2], 16));
  }
  return table;
}

class SetupError extends Error {}
class UsageError extends Error {}

/** First differing byte of two buffers + how many differ. */
function diffBuffers(got, want) {
  let first = -1;
  let count = 0;
  const n = Math.min(got.length, want.length);
  for (let i = 0; i < n; i++) if (got[i] !== want[i]) { count++; if (first < 0) first = i; }
  if (got.length !== want.length) { count += Math.abs(got.length - want.length); if (first < 0) first = n; }
  return { first, count };
}
const vramWhere = (index, base = 0) => {
  const at = index - base;
  return `row ${Math.floor(at / 128)} byte ${at % 128} (x=${(at % 128) * 2})`;
};
const fmtBuf = (buf, i) => (i < buf.length ? hex2(buf[i]) : 'EOF');

// ---------------------------------------------------------------------------------------------------------------------
// cases
// ---------------------------------------------------------------------------------------------------------------------

/** Cases the script can run: the small ones (A-D) whose ROM carries the engine. */
const RUNNABLE_BASE = CASES.filter(def => def.kind === 'small' && def.expectsTfx);
/**
 * Virtual cases: the SAME ROM of a D case, but the script raises bitmap_displayed_page to 1 together with the exit flag, so the dispatcher
 * hands the engine DE = 256 (page 1) instead of DE = 0: the 16-bit Y offset path of the engine, which no fixture reaches by itself
 * (the start room is always shown from page 0).
 */
const RUNNABLE = [...RUNNABLE_BASE];
for (const id of ['D_wipe', 'D_diagonal']) {
  const base = RUNNABLE_BASE.find(def => def.id === id);
  if (base) RUNNABLE.push({ ...base, id: `${id}_page1`, artefactId: id, forcePage: 1, blurb: `${base.blurb}, with bitmap_displayed_page forced to 1 (DE = 256)` });
}

function selectCases(only) {
  if (!only) return RUNNABLE;
  const picked = [];
  for (const def of RUNNABLE) {
    if (only.some(token => def.id === token || def.group === token || def.id.includes(token))) picked.push(def);
  }
  const unknown = only.filter(token => !RUNNABLE.some(def => def.id === token || def.group === token || def.id.includes(token)));
  if (unknown.length) throw new UsageError(`--only: nothing matches ${unknown.join(', ')}. Cases: ${RUNNABLE.map(def => def.id).join(', ')}`);
  return picked;
}

/** Node of the Transition the case's flow carries (build_tfx_bank_parity_fixtures.mjs: transitionNode / buildA). */
function nodeOfCase(def) {
  const node = { effect: EFFECTS[def.effect], ...TFX_NODE_PARAMS };
  if (def.effect === 'palette_fade_out') Object.assign(node, { fadeColor: { r: 0, g: 0, b: 0 }, framesPerStep: 2 });
  if (def.group === 'A' && def.effect === 'pattern') Object.assign(node, { patternId: 'checker', blockSize: 8 });
  return node;
}

// ---------------------------------------------------------------------------------------------------------------------
// the independent oracle: the fill plan of utils/msx2TransitionPatterns.ts, expanded the way bitmap_tfx_rect_tiles does
// ---------------------------------------------------------------------------------------------------------------------

async function loadPatterns() {
  try {
    return await import(`file:///${slashes(path.join(ROOT, 'utils', 'msx2TransitionPatterns.ts'))}`);
  } catch (error) {
    if (process.env.TFX_PARITY_TSX) throw error;
    // plain node cannot load the TypeScript module (older node): run again under tsx
    console.log('(loading utils/msx2TransitionPatterns.ts through npx tsx)');
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawnSync(`${npx} tsx "${SELF}" ${process.argv.slice(2).map(a => `"${a}"`).join(' ')}`, [], { cwd: ROOT, stdio: 'inherit', shell: true, env: { ...process.env, TFX_PARITY_TSX: '1' } });
    process.exit(child.status ?? 2);
  }
}

function buildOracle(patterns, def) {
  const node = nodeOfCase(def);
  const spec = patterns.resolveScreen5TransitionSpec(node);
  let fillSpec = spec;
  if (spec.kind === 'palette') {
    if (spec.effect !== 'palette_fade_out') return null;
    // bitmapTfxTransitionAsm: the palette fade is followed by the `cls` table of colour 0 (one step, one rectangle)
    fillSpec = { kind: 'fill', effect: 'cls', direction: 'left_to_right', blockSize: 8, fillColorIndex: 0, framesPerStep: 1, reverse: false, patternId: 'bayer4', irisShape: 'circle' };
  }
  const plan = patterns.buildScreen5FillPlan(fillSpec);
  const table = patterns.encodeScreen5FillPlan(plan, fillSpec.fillColorIndex, fillSpec.framesPerStep);
  const fps = Math.max(1, Math.min(255, fillSpec.framesPerStep));
  const color = fillSpec.fillColorIndex & 0x0f;
  return { spec: fillSpec, plan, table: Buffer.from(table), fps, fillByte: (color << 4) | color };
}

/**
 * HMMVs bitmap_tfx_play issues for `plan` with the visible page at Y offset `yOffset` (0 or 256), in order, plus how many
 * HMMVs each step has issued. Mirrors bitmap_tfx_rect_tiles: tile rows then tile columns, rows below line 212 dropped, NY clipped.
 */
function expandHmmvs(oracle, yOffset) {
  const { plan } = oracle;
  const rects = [];
  const perStep = [];
  for (const step of plan.steps) {
    for (const rect of step) {
      if (rect.w <= 0 || rect.h <= 0) continue;
      const rx = (rect.x >> 1) << 1;
      const rw = (rect.w >> 1) << 1;
      const tileW = (plan.tileW >> 1) << 1;
      for (let row = 0; row < plan.tilesY; row++) {
        const localDy = row * plan.tileH + rect.y;
        if (localDy >= 212) break;
        const ny = Math.min(rect.h, 212 - localDy);
        for (let col = 0; col < plan.tilesX; col++) rects.push({ dx: col * tileW + rx, dy: yOffset + localDy, nx: rw, ny });
      }
    }
    perStep.push(rects.length);
  }
  return { rects, perStep };
}

/** Paint `rects` with HMMV semantics (byte fill, clipped at x = 256) over a copy of `page` (rows 0..211 of the visible page). */
function paintRects(page, rects, yOffset, fillByte) {
  const out = Buffer.from(page);
  for (const { dx, dy, nx, ny } of rects) {
    for (let y = dy - yOffset; y < dy - yOffset + ny && y < 212; y++) {
      for (let x = dx; x < dx + nx && x < 256; x += 2) out[y * 128 + (x >> 1)] = fillByte;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// artefacts: rom + sym + static facts
// ---------------------------------------------------------------------------------------------------------------------

function loadArtefact(dir, id, role, def) {
  const romPath = path.join(dir, 'cases', `${id}.rom`);
  const symPath = path.join(dir, 'cases', `${id}.sym`);
  if (!fs.existsSync(romPath) || !fs.existsSync(symPath)) throw new SetupError(`${role}: ${rel(romPath)} or its .sym is missing (build it with scripts/build_tfx_bank_reference.mjs)`);
  const rom = fs.readFileSync(romPath);
  const sym = readSymbols(symPath);
  return { id, role, def, romPath, symPath, rom, sym, megarom: def.romMode === 'megarom' };
}

function bankCount(art) { return Math.floor(art.rom.length / 0x2000); }
function bankSignature(art, bank) {
  const base = bank * 0x2000;
  return SIG_OFFSETS.map(off => art.rom.subarray(base + off, base + off + SIG_LEN).toString('hex')).join('');
}
/** Banks of the ROM file whose 128-byte signature equals `signature`. */
function banksMatching(art, signature) {
  const found = [];
  for (let bank = 0; bank < bankCount(art); bank++) if (bankSignature(art, bank) === signature) found.push(bank);
  return found;
}

/** CPU address -> ROM FILE offset for the resident window (banks 0-3 = #4000-#BFFF) or, for the engine's bank, that bank. */
function fileOffsetOf(art, name, extra = 0) {
  const addr = art.sym.get(name);
  if (addr === undefined) throw new SetupError(`${art.role} (${art.id}): symbol ${name} missing from ${rel(art.symPath)}`);
  return fileOffsetOfAddress(art, addr, name) + extra;
}
function fileOffsetOfAddress(art, addr, name = '') {
  const tfxBank = art.sym.get('BITMAP_TFX_CODE_BANK');
  const inEngineBank = tfxBank !== undefined && addr >= 0x8000 && addr < 0xa000 && (/^bitmap_tfxb_/.test(name) || /^bitmap_tfx_table_/.test(name) || name === '');
  if (inEngineBank) return tfxBank * 0x2000 + (addr - 0x8000);
  if (addr < 0x4000 || addr >= 0xc000) throw new SetupError(`${art.role} (${art.id}): address ${hex4(addr)} (${name}) is outside the cartridge window`);
  return addr - 0x4000;
}

/** Everything the TCL needs, resolved from the .sym and verified against the ROM bytes. Throws SetupError with a clear message. */
function inspectArtefact(art) {
  const { sym } = art;
  const need = name => { if (!sym.has(name)) throw new SetupError(`${art.role} (${art.id}): label ${name} missing from ${rel(art.symPath)}`); return sym.get(name); };
  const info = { problems: [], notes: [] };
  info.banked = sym.has('bitmap_tfx_frame_wait_done');
  info.play = need('bitmap_tfx_play');
  if (info.play >= 0x8000) throw new SetupError(`${art.role} (${art.id}): bitmap_tfx_play is at ${hex4(info.play)}, >= #8000: it must be resident (the breakpoint would depend on the mapped bank)`);
  if (info.banked) {
    info.sample = need('bitmap_tfx_frame_wait_done');
    info.sampleOpcode = 0x3e; // ld a, BITMAP_TFX_CODE_BANK
    info.engineBank = need('BITMAP_TFX_CODE_BANK');
  } else {
    info.sample = need('bitmap_tfx_play_wait') + 4;
    info.sampleOpcode = 0xc1; // pop bc
  }
  if (info.sample >= 0x8000) throw new SetupError(`${art.role} (${art.id}): the sample point ${hex4(info.sample)} is >= #8000 (must be resident)`);
  info.layout = [];
  const byteAt = offset => (offset >= 0 && offset < art.rom.length ? art.rom[offset] : undefined);
  const byteText = value => (value === undefined ? 'no byte (offset beyond the end of the ROM file)' : `#${hex2(value)}`);
  const opcode = byteAt(info.sample - 0x4000);
  if (opcode !== info.sampleOpcode) {
    info.layout.push(`the byte at the sample point ${hex4(info.sample)} is ${byteText(opcode)}, expected #${hex2(info.sampleOpcode)} (${info.banked ? 'ld a, BITMAP_TFX_CODE_BANK right after the frame wait: the bank is not re-mapped on the way out of bitmap_tfx_frame_wait' : 'pop bc after the frame wait in bitmap_tfx_play_wait'}); the engine text is not what the instrument expects`);
  }
  // HMMV and wait_ce: in the engine's bank when the engine is banked
  const hmmvName = sym.has('bitmap_tfxb_hmmv') ? 'bitmap_tfxb_hmmv' : 'bitmap_tfx_hmmv';
  info.hmmvName = hmmvName;
  info.hmmv = need(hmmvName);
  const hmmvOffset = fileOffsetOf(art, hmmvName);
  const hmmvOpcode = byteAt(hmmvOffset);
  if (hmmvOpcode !== 0xf5) {
    info.layout.push(`${hmmvName} (${hex4(info.hmmv)}) does not start with PUSH AF (#F5): the ROM file ${info.banked ? `bank ${info.engineBank}` : 'resident window'} holds ${byteText(hmmvOpcode)} there${info.banked ? `; is BITMAP_TFX_CODE_BANK (${info.engineBank}) the bank the engine really lives in?` : ''}`);
  }
  const waitName = sym.has('bitmap_tfxb_wait_ce') ? 'bitmap_tfxb_wait_ce' : 'bitmap_tfx_wait_ce';
  if (sym.has(waitName)) {
    const retOffset = fileOffsetOf(art, waitName, WAIT_CE_RET_OFFSET);
    if (byteAt(retOffset) === 0xc9) info.waitCeRet = sym.get(waitName) + WAIT_CE_RET_OFFSET;
    else info.notes.push(`${waitName}+${WAIT_CE_RET_OFFSET} is not RET (${byteText(byteAt(retOffset))}): samples taken while the command engine is busy cannot be settled`);
  }
  info.music = sym.get('music_update') ?? null;
  info.mirror = sym.get('mapper_bank_p2_current') ?? null;
  info.displayed = sym.get('bitmap_displayed_page') ?? null;
  info.exitFlag = sym.get('bitmap_gameflow_exit_flag') ?? null;
  info.animLabel = sym.get('bitmap_update_player_sprite_animation') ?? null;
  info.gfNodes = [...sym.entries()].filter(([name]) => /^bitmap_gf_node_\d+$/.test(name)).map(([, addr]) => addr);
  // the instruction after `call run_bitmap_intro` (where the boot continues once the intro, with its transition, is over)
  info.introNext = 0;
  if (sym.has('run_bitmap_intro')) {
    const target = sym.get('run_bitmap_intro');
    const hits = [];
    for (let p = 0; p + 2 < Math.min(art.rom.length, 0x8000); p++) if (art.rom[p] === 0xcd && art.rom[p + 1] === (target & 0xff) && art.rom[p + 2] === (target >> 8)) hits.push(p + 0x4000 + 3);
    if (hits.length === 1) info.introNext = hits[0];
    else info.notes.push(`call run_bitmap_intro found ${hits.length} times in the resident window: the intro continuation is not tracked`);
  }
  // instrument discrimination: openMSX's own `romblocks` report is the hardware truth; the 128-byte signature of the mapped page is the
  // content cross-check against the ROM FILE. When two banks have identical content in the sampled bytes (padding #FF in the small
  // fixtures) the signature cannot tell them apart: noted, and the check relies on romblocks (which cannot be fooled by content).
  info.ambiguousBanks = [];
  if (art.megarom) {
    const must = [2, 3, ...(info.banked ? [info.engineBank] : [])];
    for (const bank of must) {
      const same = banksMatching(art, bankSignature(art, bank));
      if (same.length !== 1) info.ambiguousBanks.push(`bank ${bank} (also ${same.filter(b2 => b2 !== bank).join(',')})`);
    }
    if (info.ambiguousBanks.length) info.notes.push(`content signature cannot tell ${info.ambiguousBanks.join('; ')} apart in ${rel(art.romPath)} (padding): the mapped bank is judged by openMSX's romblocks`);
  }
  return info;
}

// ---------------------------------------------------------------------------------------------------------------------
// TCL
// ---------------------------------------------------------------------------------------------------------------------

function buildTcl(art, info, runDir, opts) {
  const group = art.def.group;
  const addr = value => (value ? hex4(value) : '0');
  const forcePageTcl = art.def.forcePage && info.displayed ? '; debug write memory $::DISPLAYED 1' : '';
  return `# generated by scripts/check_msx2_tfx_bank_parity.mjs (${art.role} ${art.id})
set OUT "${slashes(runDir)}"
set meta [open "$OUT/meta.txt" w]
proc note {k v} { puts $::meta "$k $v"; flush $::meta }
proc hex {blk} { binary scan $blk H* h; return $h }
proc safely {name} { if {[catch {$name} err]} { note ERROR "$name: [string map [list \\n { | }] "$err $::errorInfo"]" } }
proc dumpbin {path blk} { set f [open $path wb]; puts -nonewline $f $blk; close $f }
set throttle off

set PLAY ${hex4(info.play)}
set SAMPLE ${hex4(info.sample)}
set HMMV ${hex4(info.hmmv)}
set WAITCE ${addr(info.waitCeRet)}
set MUSIC ${addr(info.music)}
set MIRROR ${addr(info.mirror)}
set DISPLAYED ${addr(info.displayed)}
set EXITFLAG ${addr(info.exitFlag)}
set ANIM ${addr(info.animLabel)}
set INTRO_NEXT ${addr(info.introNext)}
set GF_NODES {${info.gfNodes.map(a => a).join(' ')}}
set WINDOW_FRAMES ${Math.round(opts.window * 60)}
set SIGOFF {${SIG_OFFSETS.join(' ')}}
set GROUP_D ${group === 'D' ? 1 : 0}

set romblocks ""
set sccdbg ""
foreach d [debug list] {
  if {[string match "* romblocks" $d] && ![string match "C-BIOS*" $d]} { set romblocks $d }
  if {[string match "* SCC SCC" $d] && ![string match "C-BIOS*" $d]} { set sccdbg $d }
}
note ROMBLOCKS $romblocks
note SCCDBG $sccdbg

proc banks {} {
  if {$::romblocks eq ""} { return "-1 -1" }
  return "[debug read $::romblocks 0x8000] [debug read $::romblocks 0xA000]"
}
proc sig {base} {
  set s ""
  foreach off $::SIGOFF { append s [hex [debug read_block memory [expr {$base + $off}] ${SIG_LEN}]] }
  return $s
}
proc iffs {} { return [expr {[debug read {CPU regs} 27] & 3}] }
proc regs_line {} {
  return "sp=[reg SP] ix=[reg IX] iy=[reg IY] iff=[iffs] af=[reg AF] bc=[reg BC] de=[reg DE] hl=[reg HL]"
}
proc snapshot {tag} {
  dumpbin "$::OUT/$tag.vram" [debug read_block "physical VRAM" 0 ${VRAM_BYTES}]
  note "$tag.pal" [hex [debug read_block {VDP palette} 0 32]]
  note "$tag.vdp" [hex [debug read_block {VDP regs} 0 47]]
  note "$tag.psg" [hex [debug read_block {PSG regs} 0 16]]
  if {$::sccdbg ne ""} { note "$tag.scc" [hex [debug read_block $::sccdbg 0 256]] }
  note "$tag.sig2" [sig 0x8000]
  note "$tag.sig3" [sig 0xA000]
  note "$tag.banks" [banks]
  note "$tag.r2" [debug read {VDP regs} 2]
  if {$::MIRROR != 0} { note "$tag.mirror" [debug read memory $::MIRROR] }
  if {$::DISPLAYED != 0} { note "$tag.displayed" [debug read memory $::DISPLAYED] }
  note "$tag.regs" [regs_line]
}

set frames 0
set frame0 0
set ret_frame 0
set hits 0
set returned 0
set in_play 0
set finished 0
set nsamp 0
set hl {}
set mus 0
set mus_total 0
set pending {}
set next_addr 0
set next_hit 0
set pageoff 0
set post_psg {}
array set vram {}

proc frame_cb {} {
  incr ::frames
  if {$::returned && !$::finished} { post_frame }
  after frame frame_cb
}
after frame frame_cb

proc post_frame {} {
  set p [hex [debug read_block {PSG regs} 0 16]]
  if {$::sccdbg ne ""} { append p ":" [hex [debug read_block $::sccdbg 0 256]] }
  if {[llength $::post_psg] == 0 || [lindex $::post_psg end] ne $p} {
    if {[llength $::post_psg] < 400} { lappend ::post_psg $p }
  }
  if {$::frames - $::ret_frame >= $::WINDOW_FRAMES} { finish }
}

proc finish {} {
  if {$::finished} { return }
  set ::finished 1
  note HITS $::hits
  note RETURNED $::returned
  note MUS_TOTAL $::mus_total
  note MUSBANKS [join $::musbanks " "]
  note NSAMP $::nsamp
  note PENDING_LEFT [llength $::pending]
  note FRAMES_END $::frames
  set f [open "$::OUT/samples.bin" wb]
  foreach i [lsort -integer [array names ::vram]] { puts -nonewline $f $::vram($i) }
  close $f
  set f [open "$::OUT/hmmv.txt" w]
  foreach h $::hl { puts $f $h }
  close $f
  set f [open "$::OUT/post.txt" w]
  foreach p $::post_psg { puts $f $p }
  close $f
  note DONE 1
  close $::meta
  exit
}
after time ${opts.emuTimeout} { note TIMEOUT 1; finish }

proc pick_next {} {
  set blk [debug read_block memory $::caller 40]
  binary scan $blk c* bytes
  for {set k 0} {$k < 37} {incr k} {
    if {([lindex $bytes $k] & 255) == 0xC3} {
      set t [expr {([lindex $bytes [expr {$k+1}]] & 255) | (([lindex $bytes [expr {$k+2}]] & 255) << 8)}]
      if {$t in $::GF_NODES} { return $t }
    }
  }
  return $::INTRO_NEXT
}

proc on_return {} {
  set ::returned 1
  set ::in_play 0
  set ::ret_frame $::frames
  set ::mus_total $::mus
  note RET_PC [reg PC]
  note FRAMES_IN_PLAY [expr {$::frames - $::frame0}]
  note T_IN_PLAY [format %.5f [expr {[machine_info time] - $::t0}]]
  snapshot return
  set ::next_addr [pick_next]
  note NEXT_ADDR $::next_addr
  if {$::next_addr != 0} {
    debug set_bp $::next_addr {$::returned && !$::next_hit} { set ::next_hit 1; note NEXT_HIT [expr {$::frames - $::ret_frame}] }
  }
}

proc do_play {} {
  incr ::hits
  if {$::hits == 1} {
    set ::in_play 1
    set ::t0 [machine_info time]
    set ::frame0 $::frames
    set ::caller [peek16 [reg SP]]
    set ::pageoff [expr {[reg DE] * 128}]
    note CALLER $::caller
    note PAGEOFF $::pageoff
    note HL_ENTRY [reg HL]
    snapshot entry
    debug set_bp $::caller {} { safely do_return }
  }
}
proc do_return {} {
  if {!$::returned && $::in_play} { on_return }
}
debug set_bp $PLAY {} { safely do_play }

proc do_sample {} {
  incr ::nsamp
  set i $::nsamp
  set ce [expr {[debug read {VDP status regs} 2] & 1}]
  set rec "i=$i frame=[expr {$::frames - $::frame0}] ce=$ce hmmv=[llength $::hl] music=$::mus banks=[join [banks] ,] iff=[iffs]"
  append rec " pal=[hex [debug read_block {VDP palette} 0 32]] psg=[hex [debug read_block {PSG regs} 0 16]]"
  if {$::sccdbg ne ""} { append rec " scc=[hex [debug read_block $::sccdbg 0 256]]" }
  note S $rec
  if {$ce} {
    lappend ::pending $i
    set ::vram($i) ""
  } else {
    set ::vram($i) [debug read_block "physical VRAM" $::pageoff ${PAGE_BYTES}]
  }
}
debug set_bp $SAMPLE {$::in_play} { safely do_sample }

if {$WAITCE != 0} {
  debug set_bp $WAITCE {$::in_play && [llength $::pending] > 0} {
    foreach i $::pending { set ::vram($i) [debug read_block "physical VRAM" $::pageoff ${PAGE_BYTES}] }
    set ::pending {}
  }
}

debug set_bp $HMMV {$::in_play} {
  lappend ::hl "[reg HL] [reg DE] [reg BC] [reg A] [debug read memory [expr {[reg IX] + 6}]]"
}

set musbanks {}
proc do_music {} {
  incr ::mus
  lappend ::musbanks [join [banks] ,]
}
if {$MUSIC != 0} {
  debug set_bp $MUSIC {$::in_play} { safely do_music }
}
${group === 'D' && info.animLabel && info.exitFlag ? `
# Case D: leave the game after a FIXED number of game-loop iterations (not at a fixed time), so the picture the transition starts from
# does not depend on how many frames the boot took. The flag is raised on every iteration from the 180th until the effect starts.
set anim_hits 0
debug set_bp $ANIM {$::hits == 0} {
  incr ::anim_hits
  if {$::anim_hits >= 180} { debug write memory $::EXITFLAG 1${forcePageTcl} }
}
` : ''}
`;
}

// ---------------------------------------------------------------------------------------------------------------------
// OpenMSX runner
// ---------------------------------------------------------------------------------------------------------------------

/** Runs one ROM; resolves with { dir, timedOut, exitCode }. */
function runOpenMsx(art, info, runDir, opts) {
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.mkdirSync(runDir, { recursive: true });
  const tclPath = path.join(runDir, 'probe.tcl');
  fs.writeFileSync(tclPath, buildTcl(art, info, runDir, { window: opts.window, emuTimeout: 150 }));
  const cmd = ['-machine', 'C-BIOS_MSX2+_JP', '-cart', slashes(art.romPath), ...(art.megarom ? ['-romtype', 'KonamiSCC'] : []), '-script', slashes(tclPath)];
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(OPENMSX, cmd, { cwd: ROOT, stdio: 'ignore', windowsHide: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; try { child.kill(); } catch { /* already gone */ } }, opts.timeout * 1000);
    child.on('error', error => { clearTimeout(timer); resolve({ dir: runDir, error: String(error), exitCode: null, timedOut: false, seconds: 0 }); });
    child.on('exit', code => { clearTimeout(timer); resolve({ dir: runDir, exitCode: code, timedOut, seconds: Math.round((Date.now() - started) / 100) / 10 }); });
  });
}

function parseRun(runInfo) {
  const dir = runInfo.dir;
  const run = { dir, exitCode: runInfo.exitCode, timedOutHard: runInfo.timedOut, seconds: runInfo.seconds, kv: new Map(), samples: [] };
  const metaPath = path.join(dir, 'meta.txt');
  if (!fs.existsSync(metaPath)) { run.noMeta = true; return run; }
  for (const line of fs.readFileSync(metaPath, 'utf8').split(/\r?\n/)) {
    if (!line) continue;
    const space = line.indexOf(' ');
    const key = space < 0 ? line : line.slice(0, space);
    const value = space < 0 ? '' : line.slice(space + 1);
    if (key === 'ERROR') { (run.errors ||= []).push(value); continue; }
    if (key === 'S') {
      const sample = {};
      for (const part of value.split(' ')) { const eq = part.indexOf('='); if (eq > 0) sample[part.slice(0, eq)] = part.slice(eq + 1); }
      run.samples.push(sample);
    } else run.kv.set(key, value);
  }
  run.done = run.kv.has('DONE');
  run.timedOut = run.kv.has('TIMEOUT');
  run.hits = Number(run.kv.get('HITS') ?? 0);
  run.returned = run.kv.get('RETURNED') === '1';
  const samplesBin = path.join(dir, 'samples.bin');
  run.sampleVram = fs.existsSync(samplesBin) ? fs.readFileSync(samplesBin) : Buffer.alloc(0);
  run.hmmv = fs.existsSync(path.join(dir, 'hmmv.txt'))
    ? fs.readFileSync(path.join(dir, 'hmmv.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map(line => line.split(' ').map(Number))
    : [];
  run.post = fs.existsSync(path.join(dir, 'post.txt')) ? fs.readFileSync(path.join(dir, 'post.txt'), 'utf8').split(/\r?\n/).filter(Boolean) : [];
  const readVram = tag => (fs.existsSync(path.join(dir, `${tag}.vram`)) ? fs.readFileSync(path.join(dir, `${tag}.vram`)) : null);
  run.entryVram = readVram('entry');
  run.returnVram = readVram('return');
  return run;
}

const kvNum = (run, key) => Number(run.kv.get(key));
const kvRegs = (run, key) => {
  const text = run.kv.get(key);
  if (!text) return null;
  const out = {};
  for (const part of text.split(' ')) { const eq = part.indexOf('='); if (eq > 0) out[part.slice(0, eq)] = Number(part.slice(eq + 1)); }
  return out;
};

// ---------------------------------------------------------------------------------------------------------------------
// comparison
// ---------------------------------------------------------------------------------------------------------------------

class Report {
  constructor() { this.checks = []; }
  add(id, ok, detail = '') { this.checks.push({ id, ok: Boolean(ok), detail }); return Boolean(ok); }
  get failed() { return this.checks.filter(check => !check.ok); }
}

function compareCase(def, refArt, refInfo, refRun, newArt, newInfo, newRun, oracle) {
  const report = new Report();
  const runs = [['ref', refRun, refInfo], ['new', newRun, newInfo]];

  // ---- the instrument itself ------------------------------------------------------------------------------------------------
  for (const [role, run, info] of runs) {
    const art = role === 'ref' ? refArt : newArt;
    for (const problem of info.problems) report.add('instrument', false, `${role}: ${problem}`);
    for (const problem of info.layout) report.add('static-layout', false, `${role}: ${problem}`);
    for (const note of info.notes) report.add('instrument-note', true, `${role}: ${note}`);
    if (run.errors?.length) report.add('instrument', false, `${role}: the OpenMSX script raised: ${run.errors[0]}`);
    if (run.noMeta) report.add('engine-reached', false, `${role}: OpenMSX produced no result (exit ${run.exitCode}${run.timedOutHard ? ', killed by the wall-clock timeout' : ''})`);
    else if (!run.done || run.timedOut) report.add('engine-reached', false, `${role}: the run did not finish (${run.timedOut ? `emulated-time TIMEOUT: bitmap_tfx_play hits=${run.hits} returned=${run.returned}` : 'no DONE marker'})`);
    else if (run.hits !== 1) report.add('engine-reached', false, `${role}: bitmap_tfx_play was entered ${run.hits} time(s), the case promises exactly 1`);
    else if (!run.returned) report.add('engine-reached', false, `${role}: bitmap_tfx_play never returned to ${hex4(kvNum(run, 'CALLER'))}`);
    else {
      report.add('engine-reached', true, `${role}: play entered once from ${hex4(kvNum(run, 'CALLER'))}, returned after ${run.kv.get('FRAMES_IN_PLAY')} frames`);
      const caller = kvNum(run, 'CALLER');
      if (caller >= 0x8000) report.add('instrument', false, `${role}: the return address ${hex4(caller)} is >= #8000 (breakpoint depends on the mapped bank)`);
    }
    void art;
  }
  if (report.failed.some(check => check.id === 'engine-reached' || check.id === 'instrument')) return report;

  const refR = kvRegs(refRun, 'entry.regs');
  const newR = kvRegs(newRun, 'entry.regs');

  // ---- mapper: entry and return must see banks 2 / 3 at #8000 / #A000 --------------------------------------------------------
  if (refArt.megarom) {
    for (const [role, run, art] of [['ref', refRun, refArt], ['new', newRun, newArt]]) {
      for (const tag of ['entry', 'return']) {
        const blocks = run.kv.get(`${tag}.banks`);
        const m2 = banksMatching(art, run.kv.get(`${tag}.sig2`) ?? '');
        const m3 = banksMatching(art, run.kv.get(`${tag}.sig3`) ?? '');
        const okBlocks = blocks === '2 3';
        const okSig = m2.includes(2) && m3.includes(3);
        report.add(tag === 'entry' ? 'banks-entry' : 'return-banks', okBlocks && okSig,
          `${role} at ${tag}: openMSX maps blocks [${blocks}] at #8000/#A000 (want 2 3); the 128-byte signature there matches ROM-file banks [${m2.join(',') || 'none'}] / [${m3.join(',') || 'none'}] (must include 2 / 3)`);
      }
    }
  }

  // ---- entry state: both runs must start the effect from the same machine state -------------------------------------------------
  {
    const parts = [];
    if (refRun.entryVram && newRun.entryVram) {
      const d = diffBuffers(newRun.entryVram, refRun.entryVram);
      if (d.count) parts.push(`VRAM differs in ${d.count} bytes (first ${vramWhere(d.first)}: new ${fmtBuf(newRun.entryVram, d.first)} ref ${fmtBuf(refRun.entryVram, d.first)})`);
    } else parts.push('VRAM dump missing');
    for (const key of ['pal', 'vdp', 'psg', 'scc', 'r2']) {
      if (refRun.kv.get(`entry.${key}`) !== newRun.kv.get(`entry.${key}`)) parts.push(`${key} differs`);
    }
    report.add('entry-state', parts.length === 0, parts.length === 0
      ? 'VRAM (128 KB), palette, R#0-R#46, R#2, PSG/SCC registers identical when bitmap_tfx_play is entered'
      : `the machine state when bitmap_tfx_play is entered differs between the ROMs (boot/timing change OUTSIDE the engine?): ${parts.join('; ')}`);
  }

  // ---- table bytes (static, from the ROM files) and the oracle's table -----------------------------------------------------------
  const hlRef = kvNum(refRun, 'HL_ENTRY');
  const hlNew = kvNum(newRun, 'HL_ENTRY');
  const tableOf = (art, hl, length) => {
    const off = fileOffsetOfAddress(art, hl, 'bitmap_tfx_table_');
    return art.rom.subarray(off, off + length);
  };
  const tableLength = oracle ? oracle.table.length : 0;
  if (oracle) {
    try {
      const refTable = tableOf(refArt, hlRef, tableLength);
      const newTable = tableOf(newArt, hlNew, tableLength);
      const dRef = diffBuffers(refTable, oracle.table);
      const dNew = diffBuffers(newTable, oracle.table);
      report.add('table', dRef.count === 0 && dNew.count === 0,
        `fill table (${tableLength} bytes) vs encodeScreen5FillPlan(buildScreen5FillPlan): ref ${dRef.count ? `differs from byte ${dRef.first} (${count(dRef.count)}: rom ${fmtBuf(refTable, dRef.first)} plan ${fmtBuf(oracle.table, dRef.first)})` : 'ok'}; new ${dNew.count ? `differs from byte ${dNew.first} (${count(dNew.count)}: rom ${fmtBuf(newTable, dNew.first)} plan ${fmtBuf(oracle.table, dNew.first)})` : 'ok'}`);
    } catch (error) {
      report.add('table', false, String(error.message || error));
    }
  }

  // ---- HMMV list: oracle vs ref vs new -------------------------------------------------------------------------------------------
  const pageOffRef = kvNum(refRun, 'PAGEOFF') / 128;
  const pageOffNew = kvNum(newRun, 'PAGEOFF') / 128;
  const wantOffset = def.forcePage ? 256 : 0;
  report.add('page-offset', pageOffRef === wantOffset && pageOffNew === wantOffset && kvNum(refRun, 'entry.r2') === kvNum(newRun, 'entry.r2'),
    `Y offset the effect paints at (DE): ref ${pageOffRef}, new ${pageOffNew} (the case hands the engine ${wantOffset}); R#2 ref ${refRun.kv.get('entry.r2')} new ${newRun.kv.get('entry.r2')}`);
  const sameHmmv = refRun.hmmv.length === newRun.hmmv.length && refRun.hmmv.every((row, i) => row.every((v, k) => v === newRun.hmmv[i][k]));
  {
    let detail = `ref ${refRun.hmmv.length} HMMVs, new ${newRun.hmmv.length}`;
    if (!sameHmmv) {
      const n = Math.min(refRun.hmmv.length, newRun.hmmv.length);
      let at = -1;
      for (let i = 0; i < n && at < 0; i++) if (refRun.hmmv[i].some((v, k) => v !== newRun.hmmv[i][k])) at = i;
      if (at < 0) at = n;
      detail += `; first difference at HMMV #${at}: ref [${(refRun.hmmv[at] || []).join(' ')}] new [${(newRun.hmmv[at] || []).join(' ')}] (HL=DX DE=DY BC=NX A=NY colour)`;
    }
    report.add('hmmv-list', sameHmmv, `HMMV (DX DY NX NY colour) sequence ref == new: ${detail}`);
  }
  let expected = null;
  if (oracle) {
    expected = expandHmmvs(oracle, pageOffRef * 1);
    for (const [role, run, off] of [['ref', refRun, pageOffRef], ['new', newRun, pageOffNew]]) {
      const exp = off === pageOffRef ? expected : expandHmmvs(oracle, off);
      const got = run.hmmv;
      let at = -1;
      const n = Math.min(got.length, exp.rects.length);
      for (let i = 0; i < n && at < 0; i++) {
        const r = exp.rects[i];
        const g = got[i];
        if (g[0] !== r.dx || g[1] !== r.dy || g[2] !== r.nx || g[3] !== r.ny) at = i;
      }
      const colorOk = got.every(g => g[4] === oracle.fillByte);
      const ok = at < 0 && got.length === exp.rects.length && colorOk;
      let detail = `${role}: ${got.length} HMMVs issued, plan expands to ${exp.rects.length}`;
      if (at >= 0) detail += `; first difference at HMMV #${at}: rom DX=${got[at][0]} DY=${got[at][1]} NX=${got[at][2]} NY=${got[at][3]}, plan DX=${exp.rects[at].dx} DY=${exp.rects[at].dy} NX=${exp.rects[at].nx} NY=${exp.rects[at].ny}`;
      if (!colorOk) detail += `; colour byte of the HMMVs is not the plan's #${hex2(oracle.fillByte)}`;
      report.add('hmmv-vs-plan', ok, detail);
    }
  }

  // ---- samples: one per frame wait -----------------------------------------------------------------------------------------------
  const nRef = refRun.samples.length;
  const nNew = newRun.samples.length;
  const waits = oracle ? oracle.plan.steps.length * oracle.fps : null;
  report.add('samples-count', nRef === nNew && (waits === null || nRef === waits), `frame waits sampled: ref ${nRef}, new ${nNew}${waits === null ? '' : `, plan says ${oracle.plan.steps.length} steps x ${oracle.fps} frame(s) = ${waits}`}`);
  const n = Math.min(nRef, nNew);
  const unsettled = [];
  const badVram = [];
  const badVramPlan = { ref: [], new: [] };
  const badPal = [];
  const badPsg = [];
  const badScc = [];
  const badBanks = [];
  const badIff = [];
  const badFrame = [];
  const badHmmvCount = [];
  const badMusic = [];
  const badPlanCount = { ref: [], new: [] };
  const vramDetail = {};
  for (let k = 0; k < n; k++) {
    const sr = refRun.samples[k];
    const sn = newRun.samples[k];
    const bufRef = refRun.sampleVram.subarray(k * PAGE_BYTES, (k + 1) * PAGE_BYTES);
    const bufNew = newRun.sampleVram.subarray(k * PAGE_BYTES, (k + 1) * PAGE_BYTES);
    if ((sr.ce === '1' && !refInfo.waitCeRet) || (sn.ce === '1' && !newInfo.waitCeRet)) unsettled.push(k + 1);
    if (bufRef.length !== PAGE_BYTES || bufNew.length !== PAGE_BYTES) { badVram.push(k + 1); vramDetail[k + 1] = 'VRAM of the sample missing (unsettled?)'; continue; }
    const d = diffBuffers(bufNew, bufRef);
    if (d.count) { badVram.push(k + 1); vramDetail[k + 1] = `${d.count} bytes differ, first ${vramWhere(d.first)}: new ${fmtBuf(bufNew, d.first)} ref ${fmtBuf(bufRef, d.first)}`; }
    if (sr.pal !== sn.pal) badPal.push(k + 1);
    if (sr.psg !== sn.psg) badPsg.push(k + 1);
    if ((sr.scc || '') !== (sn.scc || '')) badScc.push(k + 1);
    if (sr.banks !== sn.banks || (refArt.megarom && sr.banks !== '2,3')) badBanks.push(k + 1);
    if (sr.iff !== sn.iff) badIff.push(k + 1);
    if (sr.frame !== sn.frame) badFrame.push(k + 1);
    if (sr.hmmv !== sn.hmmv) badHmmvCount.push(k + 1);
    if (sr.music !== sn.music) badMusic.push(k + 1);
    if (expected && oracle) {
      const step = Math.ceil((k + 1) / oracle.fps);
      const wantCount = expected.perStep[step - 1];
      if (Number(sr.hmmv) !== wantCount) badPlanCount.ref.push(`#${k + 1} has ${sr.hmmv}, plan ${wantCount}`);
      if (Number(sn.hmmv) !== wantCount) badPlanCount.new.push(`#${k + 1} has ${sn.hmmv}, plan ${wantCount}`);
      const entryRefPage = refRun.entryVram.subarray(pageOffRef * 128, pageOffRef * 128 + PAGE_BYTES);
      const entryNewPage = newRun.entryVram.subarray(pageOffNew * 128, pageOffNew * 128 + PAGE_BYTES);
      const want = paintRects(entryRefPage, expected.rects.slice(0, wantCount), pageOffRef, oracle.fillByte);
      const wantNew = pageOffNew === pageOffRef && Buffer.compare(entryRefPage, entryNewPage) === 0 ? want : paintRects(entryNewPage, expandHmmvs(oracle, pageOffNew).rects.slice(0, wantCount), pageOffNew, oracle.fillByte);
      const dr = diffBuffers(bufRef, want);
      if (dr.count) { badVramPlan.ref.push(`sample ${k + 1}: ${dr.count} bytes differ from the plan, first ${vramWhere(dr.first)} (rom ${fmtBuf(bufRef, dr.first)} plan ${fmtBuf(want, dr.first)})`); }
      const dn = diffBuffers(bufNew, wantNew);
      if (dn.count) { badVramPlan.new.push(`sample ${k + 1}: ${dn.count} bytes differ from the plan, first ${vramWhere(dn.first)} (rom ${fmtBuf(bufNew, dn.first)} plan ${fmtBuf(wantNew, dn.first)})`); }
    }
  }
  const list = arr => `${arr.length} of ${n} samples (first #${arr[0]})`;
  const sampleCheck = (id, bad, what, extra = () => '') => report.add(id, bad.length === 0, bad.length ? `${what} differ in ${list(bad)}${extra(bad[0])}` : `${what} identical in all ${n} samples`);
  report.add('sample-vram', badVram.length === 0, badVram.length ? `visible page ref vs new differs in ${list(badVram)}: ${vramDetail[badVram[0]]}` : `visible page rows 0-211 byte-identical in all ${n} samples`);
  if (oracle) {
    report.add('sample-vram-plan-ref', badVramPlan.ref.length === 0, badVramPlan.ref.length ? `reference page after each step is not what the plan paints: ${badVramPlan.ref.length} samples; ${badVramPlan.ref[0]}` : 'ref: every sample equals entry page + plan rectangles');
    report.add('sample-vram-plan-new', badVramPlan.new.length === 0, badVramPlan.new.length ? `new page after each step is not what the plan paints: ${badVramPlan.new.length} samples; ${badVramPlan.new[0]}` : 'new: every sample equals entry page + plan rectangles');
    report.add('sample-step-pacing', badPlanCount.ref.length === 0 && badPlanCount.new.length === 0, `HMMVs issued before each frame wait vs the plan: ref ${badPlanCount.ref.length ? badPlanCount.ref[0] : 'ok'}; new ${badPlanCount.new.length ? badPlanCount.new[0] : 'ok'}`);
  }
  sampleCheck('sample-palette', badPal, 'palette (16 entries)');
  sampleCheck('sample-psg', badPsg, 'PSG registers');
  if (refRun.samples.some(s => s.scc)) sampleCheck('sample-scc', badScc, 'SCC registers');
  if (refArt.megarom) sampleCheck('sample-banks', badBanks, 'mapper blocks at #8000/#A000 (must be 2,3 and equal to the ref)', k => `: ref [${refRun.samples[k - 1].banks}] new [${newRun.samples[k - 1].banks}]`);
  sampleCheck('sample-iff', badIff, 'IFF1');
  report.add('sample-frames', badFrame.length === 0, badFrame.length ? `frames since entry differ in ${list(badFrame)}: sample #${badFrame[0]} ref frame ${refRun.samples[badFrame[0] - 1].frame} new frame ${newRun.samples[badFrame[0] - 1].frame}` : `every frame wait ends in the same frame (tolerance 0; last at frame ${refRun.samples[n - 1]?.frame})`);
  sampleCheck('sample-hmmv-count', badHmmvCount, 'HMMVs issued so far');
  sampleCheck('sample-music', badMusic, 'music_update calls so far');
  {
    const busyRef = refRun.samples.filter(sample => sample.ce === '1').length;
    const busyNew = newRun.samples.filter(sample => sample.ce === '1').length;
    report.add('sample-ce-info', true, `samples taken with the command engine busy (settled at the next wait_ce exit): ref ${busyRef}, new ${busyNew}`);
  }
  if (unsettled.length) report.add('sample-settled', false, `${unsettled.length} samples were taken with the command engine busy and could not be settled (no wait_ce exit to hook): ${unsettled.slice(0, 5).join(',')}`);

  // ---- music: one music_update per frame wait -------------------------------------------------------------------------------------
  {
    const mRef = kvNum(refRun, 'MUS_TOTAL');
    const mNew = kvNum(newRun, 'MUS_TOTAL');
    const hasMusic = def.expectsMusic === 'pt3' || def.expectsMusic === 'scc';
    const ok = mRef === mNew && (!hasMusic || (mRef === nRef && mNew === nNew && mRef > 0)) && (hasMusic || mRef === 0);
    report.add('music-calls', ok, `music_update calls inside bitmap_tfx_play: ref ${mRef}, new ${mNew}; frame waits ref ${nRef} new ${nNew}${hasMusic ? ' (expected one per wait)' : ' (silent case: expected 0)'}`);
    {
      // the plan's improvement: the resident banks are put back BEFORE the music runs, so the sound driver sees P2/P3 as its mirror says
      const mbRef = (refRun.kv.get('MUSBANKS') || '').split(' ').filter(Boolean);
      const mbNew = (newRun.kv.get('MUSBANKS') || '').split(' ').filter(Boolean);
      const sameList = mbRef.length === mbNew.length && mbRef.every((value, i) => value === mbNew[i]);
      const allResident = !refArt.megarom || (mbRef.every(value => value === '2,3') && mbNew.every(value => value === '2,3'));
      const firstBad = mbNew.findIndex(value => value !== '2,3');
      if (mRef > 0 || mNew > 0) {
        report.add('music-banks', sameList && allResident, `mapper blocks at #8000/#A000 each time music_update is entered inside the effect: ref ${mbRef.length} calls, new ${mbNew.length} calls; ${allResident ? 'always 2,3' : `new call #${firstBad + 1} sees [${mbNew[firstBad]}], ref sees [${mbRef[firstBad]}] (want 2,3)`}`);
      }
    }
  }

  // ---- return state ---------------------------------------------------------------------------------------------------------------
  {
    const retRef = kvRegs(refRun, 'return.regs');
    const retNew = kvRegs(newRun, 'return.regs');
    if (refR && newR && retRef && retNew) {
      report.add('return-sp', retRef.sp === refR.sp + 2 && retNew.sp === newR.sp + 2, `SP at return = SP at entry + 2: ref ${refR.sp}->${retRef.sp}, new ${newR.sp}->${retNew.sp}`);
      report.add('return-ixiy', retRef.ix === refR.ix && retRef.iy === refR.iy && retNew.ix === newR.ix && retNew.iy === newR.iy,
        `IX/IY preserved: ref IX ${refR.ix}->${retRef.ix} IY ${refR.iy}->${retRef.iy}; new IX ${newR.ix}->${retNew.ix} IY ${newR.iy}->${retNew.iy}`);
      report.add('return-iff', retRef.iff === refR.iff && retNew.iff === newR.iff, `IFF1 preserved: ref ${refR.iff}->${retRef.iff}, new ${newR.iff}->${retNew.iff}`);
      const informational = ['af', 'bc', 'de', 'hl'].filter(r => retRef[r] !== retNew[r]);
      report.add('return-regs-info', true, informational.length ? `registers the doc lists as DESTROYED differ (informational): ${informational.map(r => `${r} ref ${retRef[r]} new ${retNew[r]}`).join(', ')}` : 'AF/BC/DE/HL at return equal as well');
    } else report.add('return-sp', false, 'register dump missing');
    if (refArt.megarom && refInfo.mirror && newInfo.mirror) {
      report.add('return-mirror', refRun.kv.get('return.mirror') === '2' && newRun.kv.get('return.mirror') === '2' && refRun.kv.get('entry.mirror') === newRun.kv.get('entry.mirror'),
        `software mirror mapper_bank_p2_current: entry ref ${refRun.kv.get('entry.mirror')} new ${newRun.kv.get('entry.mirror')}; return ref ${refRun.kv.get('return.mirror')} new ${newRun.kv.get('return.mirror')} (want 2)`);
    }
    if (refRun.returnVram && newRun.returnVram) {
      const d = diffBuffers(newRun.returnVram, refRun.returnVram);
      report.add('return-vram', d.count === 0, d.count ? `128 KB VRAM at return differs in ${d.count} bytes (first ${vramWhere(d.first)}: new ${fmtBuf(newRun.returnVram, d.first)} ref ${fmtBuf(refRun.returnVram, d.first)})` : '128 KB of VRAM identical at return');
    } else report.add('return-vram', false, 'VRAM dump at return missing');
    report.add('return-palette', refRun.kv.get('return.pal') === newRun.kv.get('return.pal'), `palette at return: ref ${refRun.kv.get('return.pal')} new ${newRun.kv.get('return.pal')}`);
    {
      const a = refRun.kv.get('return.vdp') || '';
      const b = newRun.kv.get('return.vdp') || '';
      let detail = 'R#0-R#46 identical';
      let ok = a === b && a.length === 94;
      if (!ok) {
        const regs = [];
        for (let r = 0; r < 47; r++) if (a.slice(r * 2, r * 2 + 2) !== b.slice(r * 2, r * 2 + 2)) regs.push(`R#${r} ref ${a.slice(r * 2, r * 2 + 2)} new ${b.slice(r * 2, r * 2 + 2)}`);
        detail = `VDP registers differ: ${regs.join(', ') || 'dump missing'}`;
        ok = false;
      }
      report.add('return-vdp-regs', ok, detail);
    }
    report.add('return-psg', refRun.kv.get('return.psg') === newRun.kv.get('return.psg') && (refRun.kv.get('return.scc') || '') === (newRun.kv.get('return.scc') || ''), 'PSG/SCC registers at return identical');
    report.add('frames-in-play', refRun.kv.get('FRAMES_IN_PLAY') === newRun.kv.get('FRAMES_IN_PLAY'), `frames between entry and return: ref ${refRun.kv.get('FRAMES_IN_PLAY')} new ${newRun.kv.get('FRAMES_IN_PLAY')} (tolerance 0)${waits !== null ? `; the plan has ${waits} frame waits` : ''}`);
  }

  // ---- final picture: every row 0..211 holds the fill byte ---------------------------------------------------------------------------
  if (oracle && expected) {
    for (const [role, run, off] of [['ref', refRun, pageOffRef], ['new', newRun, pageOffNew]]) {
      const page = run.returnVram ? run.returnVram.subarray(off * 128, off * 128 + PAGE_BYTES) : Buffer.alloc(0);
      const planEnd = paintRects(run.entryVram.subarray(off * 128, off * 128 + PAGE_BYTES), (off === pageOffRef ? expected : expandHmmvs(oracle, off)).rects, off, oracle.fillByte);
      const wantFull = planEnd.every(b => b === oracle.fillByte);
      let bad = 0;
      let first = -1;
      for (let i = 0; i < page.length; i++) if (page[i] !== planEnd[i]) { bad++; if (first < 0) first = i; }
      const notFill = page.reduce((acc, b) => acc + (b !== oracle.fillByte ? 1 : 0), 0);
      report.add('final-fill', page.length === PAGE_BYTES && bad === 0 && (!wantFull || notFill === 0),
        `${role}: final visible page ${bad ? `differs from entry+plan in ${bad} bytes (first ${vramWhere(first)})` : 'equals entry+plan'}; ${notFill === 0 ? `all 212 rows hold #${hex2(oracle.fillByte)}` : `${notFill} bytes are not #${hex2(oracle.fillByte)}${wantFull ? '' : ' (the plan itself leaves them uncovered)'}`}`);
    }
  }

  // ---- after the effect: the flow goes on --------------------------------------------------------------------------------------------
  {
    const nextRef = refRun.kv.get('NEXT_HIT');
    const nextNew = newRun.kv.get('NEXT_HIT');
    const addrRef = kvNum(refRun, 'NEXT_ADDR');
    const addrNew = kvNum(newRun, 'NEXT_ADDR');
    if (!addrRef || !addrNew) report.add('next-node', false, `could not identify the code that follows the effect (ref ${addrRef} new ${addrNew}): neither a jp to a bitmap_gf_node_N nor the call to run_bitmap_intro`);
    else report.add('next-node', nextRef !== undefined && nextNew !== undefined && nextRef === nextNew,
      `next stage (${hex4(addrRef)} ref / ${hex4(addrNew)} new) reached: ref after ${nextRef ?? 'never'} frames, new after ${nextNew ?? 'never'} (window ${refRun.kv.get('FRAMES_END') ? 'ok' : '?'}; tolerance 0)`);
    const hasMusic = def.expectsMusic === 'pt3' || def.expectsMusic === 'scc';
    if (hasMusic) {
      const k = Math.min(refRun.post.length, newRun.post.length, 24);
      let same = true;
      let at = -1;
      for (let i = 0; i < k && same; i++) if (refRun.post[i] !== newRun.post[i]) { same = false; at = i; }
      report.add('post-psg', same && refRun.post.length >= 3 && newRun.post.length >= 3,
        `after the effect the sound keeps changing: distinct PSG/SCC states ref ${refRun.post.length}, new ${newRun.post.length} (>= 3 each) and the first ${k} identical${same ? '' : ` (differs at #${at})`}`);
    }
  }
  return report;
}
const count = value => `${value} bytes`;

// ---------------------------------------------------------------------------------------------------------------------
// sabotages: the reference ASM patched so that ONE thing is wrong. The script must go red, on the intended check.
// ---------------------------------------------------------------------------------------------------------------------

function replaceOnce(asm, find, replacement, what) {
  const parts = asm.split(find);
  if (parts.length !== 2) throw new SetupError(`sabotage: the pattern for "${what}" occurs ${parts.length - 1} times in the ASM (expected 1); the engine text changed, update the sabotage`);
  return parts[0] + replacement + parts[1];
}

/** Rewrites bytes of `bitmap_tfx_table_0` (the DB lines under the label). edit(bytes) -> void. */
function editTable(asm, edit, what) {
  const lines = asm.split('\n');
  const start = lines.findIndex(line => /^bitmap_tfx_table_0:/.test(line));
  if (start < 0) throw new SetupError(`sabotage ${what}: no bitmap_tfx_table_0 in the ASM`);
  let end = start + 1;
  const bytes = [];
  while (end < lines.length && /^\s+DB\s+#/i.test(lines[end])) {
    for (const part of lines[end].trim().replace(/^DB\s+/i, '').split(',')) bytes.push(parseInt(part.trim().replace('#', ''), 16));
    end++;
  }
  edit(bytes);
  const out = [];
  for (let i = 0; i < bytes.length; i += 16) out.push(`    DB ${bytes.slice(i, i + 16).map(b => `#${hex2(b)}`).join(',')}`);
  lines.splice(start + 1, end - start - 1, ...out);
  return lines.join('\n');
}

/** Byte offsets of the rectangles of the table: [{step, at}] (at = offset of the x/2 byte). */
function tableRects(bytes) {
  const rects = [];
  let i = 6;
  let step = 0;
  while (i < bytes.length && bytes[i] !== 0xfe) {
    if (bytes[i] === 0xff) { step++; i++; continue; }
    rects.push({ step, at: i });
    i += 4;
  }
  return { rects, steps: step };
}

const SABOTAGES = {
  table_byte: {
    describe: 'one rectangle of the MIDDLE step of the fill table is shifted by 2 px (x/2 + 1)',
    cases: ['A_wipe', 'C_wipe', 'D_diagonal'], expect: ['sample-vram', 'sample-vram-plan-new', 'hmmv-list', 'table'],
    patch: asm => editTable(asm, bytes => {
      const { rects, steps } = tableRects(bytes);
      const target = rects.find(r => r.step >= Math.floor(steps / 2));
      bytes[target.at] = (bytes[target.at] + 1) & 0x7f;
    }, 'table_byte'),
  },
  table_byte_last: {
    describe: 'one rectangle of the LAST step of the fill table is one line shorter (h - 1): only the final samples differ',
    cases: ['A_wipe', 'C_blinds'], expect: ['sample-vram', 'sample-vram-plan-new', 'hmmv-list', 'table'],
    patch: asm => editTable(asm, bytes => {
      const { rects, steps } = tableRects(bytes);
      const target = rects.filter(r => r.step === steps - 1).pop();
      bytes[target.at + 3] = Math.max(1, bytes[target.at + 3] - 1);
    }, 'table_byte_last'),
  },
  fill_byte: {
    describe: 'the colour byte of the table header (byte 5) is #11 instead of #00: the effect fills with another colour',
    cases: ['A_wipe', 'C_wipe', 'D_wipe'], expect: ['sample-vram', 'sample-vram-plan-new', 'final-fill', 'table', 'hmmv-vs-plan'],
    patch: asm => editTable(asm, bytes => { bytes[5] = bytes[5] === 0x11 ? 0x22 : 0x11; }, 'fill_byte'),
  },
  hmmv_nx: {
    describe: 'bitmap_tfx_hmmv sends NX - 2 to the VDP (the entry registers, i.e. the HMMV list, stay correct): a 2 px gap in every rectangle',
    cases: ['A_wipe', 'C_wipe'], expect: ['sample-vram', 'sample-vram-plan-new'],
    patch: asm => replaceOnce(asm, '    ld a, c\n    out (#9B), a              ; NX\n', '    ld a, c\n    sub 2\n    out (#9B), a              ; NX\n', 'hmmv_nx'),
  },
  bank_pre: {
    describe: 'bitmap_tfx_play maps bank 4 at #8000 on entry and never puts bank 2 back (the engine is resident, so the picture is unaffected)',
    cases: ['A_wipe', 'B_wipe', 'C_wipe', 'C_scc_wipe'], expect: ['sample-banks', 'return-banks', 'music-banks'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_play:\n    push ix\n', 'bitmap_tfx_play:\n    ld a, 4\n    ld (#9000), a\n    push ix\n', 'bank_pre'),
  },
  p2_wrong: {
    describe: 'bitmap_tfx_play returns with bank 3 at #8000 instead of 2 (trampoline that does not restore the resident banks)',
    cases: ['A_wipe', 'B_wipe', 'C_wipe', 'D_wipe'], expect: ['return-banks'],
    patch: asm => replaceOnce(asm, '    ld sp, hl\n    pop ix\n    ret\n', '    ld sp, hl\n    pop ix\n    ld a, 3\n    ld (#9000), a\n    ret\n', 'p2_wrong'),
  },
  music_off: {
    describe: 'bitmap_flow_wait_vblank does not call music_update (the wait the engine uses with music)',
    cases: ['B_wipe', 'C_wipe', 'C_scc_wipe'], expect: ['music-calls', 'sample-music', 'sample-psg', 'post-psg'],
    patch: asm => replaceOnce(asm, 'bitmap_flow_wait_vblank:\n    push de\n    push hl\n    push ix\n    push iy\n    call music_update\n', 'bitmap_flow_wait_vblank:\n    push de\n    push hl\n    push ix\n    push iy\n    nop\n    nop\n    nop\n', 'music_off'),
  },
  music_twice: {
    describe: 'bitmap_flow_wait_vblank calls music_update twice per wait (the song would play at double speed)',
    cases: ['C_wipe'], expect: ['music-calls', 'sample-music'],
    patch: asm => replaceOnce(asm, 'bitmap_flow_wait_vblank:\n    push de\n    push hl\n    push ix\n    push iy\n    call music_update\n', 'bitmap_flow_wait_vblank:\n    push de\n    push hl\n    push ix\n    push iy\n    call music_update\n    call music_update\n', 'music_twice'),
  },
  frame_extra: {
    describe: 'bitmap_tfx_play waits one extra frame before it returns',
    cases: ['A_wipe', 'D_wipe', 'C_wipe'], expect: ['frames-in-play', 'next-node', 'return-vram'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_play_done:\n    call bitmap_tfx_wait_ce\n', 'bitmap_tfx_play_done:\n    call bitmap_wait_vblank\n    call bitmap_tfx_wait_ce\n', 'frame_extra'),
  },
  frame_missing: {
    describe: 'the frame wait of every step is removed (the effect runs as fast as the command engine allows)',
    cases: ['A_wipe', 'D_wipe'], expect: ['sample-frames', 'frames-in-play'],
    patch: asm => {
      const wait = /(bitmap_tfx_play_wait:\n    push bc\n)    call (bitmap_wait_vblank|bitmap_flow_wait_vblank)\n/;
      if (!wait.test(asm)) throw new SetupError('sabotage frame_missing: the wait call of bitmap_tfx_play_wait was not found');
      return asm.replace(wait, '$1    nop\n    nop\n    nop\n');
    },
  },
  ei_left: {
    describe: 'bitmap_tfx_play returns with interrupts enabled (EI before RET)',
    cases: ['A_wipe', 'C_wipe'], expect: ['return-iff'],
    patch: asm => replaceOnce(asm, '    ld sp, hl\n    pop ix\n    ret\n', '    ld sp, hl\n    pop ix\n    ei\n    ret\n', 'ei_left'),
  },
  ix_clobber: {
    describe: 'bitmap_tfx_play returns with IX incremented (the doc says IX/IY are PRESERVED)',
    cases: ['A_wipe', 'C_wipe'], expect: ['return-ixiy'],
    patch: asm => replaceOnce(asm, '    ld sp, hl\n    pop ix\n    ret\n', '    ld sp, hl\n    pop ix\n    inc ix\n    ret\n', 'ix_clobber'),
  },
  r17_left: {
    describe: 'bitmap_tfx_play leaves R#17 = 36 instead of 32 (the runtime expects 32 after the effect)',
    cases: ['A_wipe', 'D_wipe'], expect: ['return-vdp-regs'],
    patch: asm => replaceOnce(asm, '    ld a, 32\n    out (#99), a\n    ld a, #91                 ; R#17 = 32: the rest of the runtime expects it\n', '    ld a, 36\n    out (#99), a\n    ld a, #91                 ; R#17 = 32: the rest of the runtime expects it\n', 'r17_left'),
  },
  stray_vram: {
    describe: 'bitmap_tfx_play writes a stray byte to the HIDDEN page when it ends (outside rows 0-211 of the visible page)',
    cases: ['A_wipe', 'D_wipe'], expect: ['return-vram'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_play_done:\n    call bitmap_tfx_wait_ce\n', 'bitmap_tfx_play_done:\n    call bitmap_tfx_wait_ce\n    ld a, #05\n    out (#99), a\n    ld a, #8E\n    out (#99), a\n    xor a\n    out (#99), a\n    ld a, #40\n    out (#99), a\n    ld a, #AA\n    out (#98), a\n    xor a\n    out (#99), a\n    ld a, #8E\n    out (#99), a\n', 'stray_vram'),
  },
  entry_vram: {
    describe: 'the boot intro draws one byte on page 0 right before the effect: the two runs start the effect from different pictures',
    cases: ['A_wipe', 'A_diagonal'], expect: ['entry-state'],
    patch: asm => replaceOnce(asm, '    ld de, 0\n    ld hl, bitmap_tfx_table_0\n    call bitmap_tfx_play\n', '    xor a\n    out (#99), a\n    ld a, #8E\n    out (#99), a\n    xor a\n    out (#99), a\n    ld a, #70\n    out (#99), a\n    ld a, #77\n    out (#98), a\n    ld de, 0\n    ld hl, bitmap_tfx_table_0\n    call bitmap_tfx_play\n', 'entry_vram'),
  },
  page_offset: {
    describe: 'the caller loads DE = 1 (instead of 0) as the Y offset of the visible page: the effect paints one line low',
    cases: ['A_wipe', 'A_blinds'], expect: ['page-offset'],
    patch: asm => replaceOnce(asm, '    ld de, 0\n    ld hl, bitmap_tfx_table_0\n    call bitmap_tfx_play\n', '    ld de, 1\n    ld hl, bitmap_tfx_table_0\n    call bitmap_tfx_play\n', 'page_offset'),
  },
  fps_double: {
    describe: 'the table header says 2 frames per step instead of 1 (the effect lasts twice as long)',
    cases: ['A_wipe', 'D_wipe'], expect: ['table', 'samples-count', 'frames-in-play'],
    patch: asm => editTable(asm, bytes => { bytes[4] += 1; }, 'fps_double'),
  },
  palette_poke: {
    describe: 'bitmap_tfx_play rewrites palette entry 7 at the end of every step',
    cases: ['A_wipe', 'C_wipe'], expect: ['sample-palette', 'return-palette'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_play_step_end:\n    inc hl\n', 'bitmap_tfx_play_step_end:\n    ld a, 7\n    out (#99), a\n    ld a, #90\n    out (#99), a\n    ld a, #66\n    out (#9A), a\n    ld a, #05\n    out (#9A), a\n    xor a\n    out (#99), a\n    ld a, #90\n    out (#99), a\n    inc hl\n', 'palette_poke'),
  },
  psg_poke: {
    describe: 'bitmap_tfx_play writes PSG R#9 = 3 at the end of every step',
    cases: ['A_wipe', 'D_wipe'], expect: ['sample-psg', 'return-psg'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_play_step_end:\n    inc hl\n', 'bitmap_tfx_play_step_end:\n    ld a, 9\n    out (#A0), a\n    ld a, 3\n    out (#A1), a\n    inc hl\n', 'psg_poke'),
  },
  mirror_left: {
    describe: 'bitmap_tfx_play returns with the software mirror mapper_bank_p2_current = 5 (the hardware still shows bank 2)',
    cases: ['B_wipe', 'C_wipe'], expect: ['return-mirror'],
    patch: asm => replaceOnce(asm, '    ld sp, hl\n    pop ix\n    ret\n', '    ld sp, hl\n    pop ix\n    ld a, 5\n    ld (mapper_bank_p2_current), a\n    ret\n', 'mirror_left'),
  },
  sp_leak: {
    describe: 'bitmap_tfx_play returns to the right address but leaves SP two bytes higher than it found it',
    cases: ['A_wipe', 'D_wipe'], expect: ['return-sp'],
    patch: asm => replaceOnce(asm, '    ld sp, hl\n    pop ix\n    ret\n', '    ld sp, hl\n    pop ix\n    pop hl\n    inc sp\n    inc sp\n    jp (hl)\n', 'sp_leak'),
  },
  skip_return: {
    describe: "bitmap_tfx_play pops one word too many and returns to its caller's caller",
    cases: ['D_wipe'], expect: ['engine-reached'],
    patch: asm => replaceOnce(asm, '    ld sp, hl\n    pop ix\n    ret\n', '    ld sp, hl\n    pop ix\n    pop hl\n    ret\n', 'skip_return'),
  },
  post_wait: {
    describe: 'the code after the effect waits 29 frames instead of 30 (the flow after the effect is one frame short)',
    cases: ['A_wipe', 'B_wipe'], expect: ['next-node'],
    patch: asm => replaceOnce(asm, '    call bitmap_tfx_play\n    ld b, 30\n    call bitmap_intro_wait_frames\n', '    call bitmap_tfx_play\n    ld b, 29\n    call bitmap_intro_wait_frames\n', 'post_wait'),
  },
  // ---- sabotages of the NEW ROM (plan section 5(f)): the ASM of --new is patched, so they need the banked engine of F1 ----
  nw_frame_wait_no_remap: {
    on: 'new',
    describe: 'NEW: bitmap_tfx_frame_wait returns with RET instead of mapping the engine bank again (plan 5(f)-1: the player returns into the wrong bank)',
    cases: ['A_wipe', 'C_wipe', 'C_scc_wipe'], expect: ['static-layout', 'engine-reached'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_frame_wait_done:\n    ld a, BITMAP_TFX_CODE_BANK\n    jp mapper_set_bank_p2\n', 'bitmap_tfx_frame_wait_done:\n    ret\n', 'nw_frame_wait_no_remap'),
  },
  nw_tramp_ret: {
    on: 'new',
    describe: 'NEW: the bitmap_tfx_play trampoline ends with RET instead of jp bitmap_room_restore_resident_banks (plan 5(f)-2: P2 stays on the engine bank)',
    cases: ['A_wipe', 'C_wipe', 'D_wipe'], expect: ['return-banks'],
    patch: asm => replaceOnce(asm, '    call bitmap_tfxb_play\n    jp bitmap_room_restore_resident_banks\n', '    call bitmap_tfxb_play\n    ret\n', 'nw_tramp_ret'),
  },
  nw_bank_off_by_one: {
    on: 'new',
    describe: 'NEW: BITMAP_TFX_CODE_BANK EQU n+1 (plan 5(f)-3: the trampoline maps a bank that is not the engine)',
    cases: ['A_wipe', 'C_wipe'], expect: ['static-layout', 'engine-reached', 'sample-vram', 'hmmv-list'],
    patch: asm => {
      const match = /^(BITMAP_TFX_CODE_BANK\s+EQU\s+)(\d+)\s*$/m.exec(asm);
      if (!match) throw new SetupError('sabotage nw_bank_off_by_one: no "BITMAP_TFX_CODE_BANK EQU n" line in the new ASM');
      return asm.replace(match[0], `${match[1]}${Number(match[2]) + 1}`);
    },
  },
  nw_table_byte: {
    on: 'new',
    describe: 'NEW: one rectangle of the middle step of the fill table inside the engine bank is shifted by 2 px (plan 5(f)-4)',
    cases: ['A_wipe', 'C_wipe', 'D_diagonal'], expect: ['table', 'hmmv-list', 'sample-vram', 'sample-vram-plan-new'],
    patch: asm => editTable(asm, bytes => {
      const { rects, steps } = tableRects(bytes);
      const target = rects.find(r => r.step >= Math.floor(steps / 2));
      bytes[target.at] = (bytes[target.at] + 1) & 0x7f;
    }, 'nw_table_byte'),
  },
  nw_music_bypass: {
    on: 'new',
    describe: 'NEW: bitmap_tfx_frame_wait waits with bitmap_wait_vblank (no music tick) instead of bitmap_flow_wait_vblank (plan 5(f)-5)',
    cases: ['C_wipe', 'C_scc_wipe', 'B_wipe'], expect: ['music-calls', 'sample-music', 'post-psg'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_frame_wait:\n    call bitmap_room_restore_resident_banks\n    call bitmap_flow_wait_vblank\n', 'bitmap_tfx_frame_wait:\n    call bitmap_room_restore_resident_banks\n    call bitmap_wait_vblank\n', 'nw_music_bypass'),
  },
  nw_no_restore_before_music: {
    on: 'new',
    describe: 'NEW: bitmap_tfx_frame_wait does not put banks 2/3 back before the song is ticked (the SCC driver would see the engine bank in P2)',
    cases: ['C_wipe', 'C_scc_wipe', 'A_wipe'], expect: ['music-banks', 'sample-banks'],
    patch: asm => replaceOnce(asm, 'bitmap_tfx_frame_wait:\n    call bitmap_room_restore_resident_banks\n', 'bitmap_tfx_frame_wait:\n', 'nw_no_restore_before_music'),
  },
  // BENIGN mutations: they must NOT turn the script red (they calibrate the tolerance: the new trampoline costs ~150 T-states per frame)
  jitter: {
    benign: true,
    describe: 'BENIGN: 40 NOPs (160 T-states) after every frame wait and 40 more at the end of every step: only the timing inside a frame moves',
    cases: ['A_wipe', 'B_wipe', 'C_wipe', 'C_scc_wipe', 'D_diagonal', 'C_blinds'], expect: [],
    patch: asm => {
      const nops = count => '    nop\n'.repeat(count);
      let out = replaceOnce(asm, '    pop bc\n    djnz bitmap_tfx_play_wait\n', `    pop bc\n${nops(40)}    djnz bitmap_tfx_play_wait\n`, 'jitter wait');
      out = replaceOnce(out, 'bitmap_tfx_play_step_end:\n    inc hl\n', `bitmap_tfx_play_step_end:\n${nops(40)}    inc hl\n`, 'jitter step');
      return out;
    },
  },
  jitter_big: {
    benign: true,
    describe: 'BENIGN: a delay loop of about 1600 T-states (2.7 % of a frame) after every frame wait',
    cases: ['A_wipe', 'C_wipe', 'C_pattern', 'D_diagonal'], expect: [],
    patch: asm => replaceOnce(asm, '    pop bc\n    djnz bitmap_tfx_play_wait\n', '    pop bc\n    ld a, 100\n.jitter_big_loop:\n    dec a\n    jr nz, .jitter_big_loop\n    djnz bitmap_tfx_play_wait\n', 'jitter_big'),
  },
};

/** Patches the ASM of `baseArt` (the reference, or the NEW artefacts for the `nw_*` sabotages) and re-assembles it. */
function buildSabotagedArtefact(sabotageName, def, baseArt, work) {
  const sab = SABOTAGES[sabotageName];
  const asmPath = path.join(path.dirname(baseArt.romPath), `${def.artefactId ?? def.id}.asm`);
  if (!fs.existsSync(asmPath)) throw new SetupError(`sabotage ${sabotageName}: ${rel(asmPath)} is missing (build_tfx_bank_reference.mjs keeps the ASM of the small cases)`);
  const dir = path.join(work, 'sabotage', sabotageName, 'cases');
  fs.mkdirSync(dir, { recursive: true });
  const asm = sab.patch(fs.readFileSync(asmPath, 'utf8').replace(/\r\n/g, '\n'));
  const outAsm = path.join(dir, `${def.artefactId ?? def.id}.asm`);
  const outRom = path.join(dir, `${def.artefactId ?? def.id}.rom`);
  const outSym = path.join(dir, `${def.artefactId ?? def.id}.sym`);
  fs.writeFileSync(outAsm, asm);
  const glass = spawnSync('java', ['-jar', GLASS_JAR, '-I', path.join(ROOT, 'server'), outAsm, outRom, outSym], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (glass.status !== 0 || !fs.existsSync(outRom)) throw new SetupError(`sabotage ${sabotageName}: glass failed on the patched ASM:\n${(glass.stdout || '') + (glass.stderr || '')}`.slice(0, 1500));
  return loadArtefact(path.join(work, 'sabotage', sabotageName), def.artefactId ?? def.id, 'new', def);
}

// ---------------------------------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------------------------------

async function runCase(def, args, oracles) {
  const result = { id: def.id, status: 'FAIL', lines: [], seconds: 0, checks: [], failedIds: [] };
  const log = line => result.lines.push(line);
  const started = Date.now();
  try {
    const refArt = loadArtefact(args.ref, def.artefactId ?? def.id, 'ref', def);
    const sabotageBase = args.sabotage ? (SABOTAGES[args.sabotage].on === 'new' ? loadArtefact(args.new, def.artefactId ?? def.id, 'new', def) : refArt) : null;
    const newArt = args.sabotage
      ? buildSabotagedArtefact(args.sabotage, def, sabotageBase, args.work)
      : loadArtefact(args.self ? args.ref : args.new, def.artefactId ?? def.id, 'new', def);
    const refInfo = inspectArtefact(refArt);
    const newInfo = inspectArtefact(newArt);
    const runBase = path.join(args.work, 'runs', String(process.pid), def.id);
    const [refRaw, newRaw] = await Promise.all([
      runOpenMsx(refArt, refInfo, path.join(runBase, 'ref'), args),
      runOpenMsx(newArt, newInfo, path.join(runBase, 'new'), args),
    ]);
    const refRun = parseRun(refRaw);
    const newRun = parseRun(newRaw);
    const oracle = oracles.get(def.id) || null;
    const report = compareCase(def, refArt, refInfo, refRun, newArt, newInfo, newRun, oracle);
    result.checks = report.checks;
    result.failedIds = [...new Set(report.failed.map(check => check.id))];
    result.status = report.failed.length === 0 ? 'PASS' : 'FAIL';
    result.engine = `${refInfo.banked ? 'banked' : 'resident'} -> ${newInfo.banked ? `banked(bank ${newInfo.engineBank})` : 'resident'}`;
    result.steps = oracle ? `${oracle.plan.steps.length} steps x ${oracle.fps}f, ${refRun.hmmv.length} HMMV` : `${refRun.hmmv.length} HMMV`;
    result.frames = refRun.kv.get('FRAMES_IN_PLAY');
    result.seconds = Math.round((Date.now() - started) / 100) / 10;
    result.runSeconds = `ref ${refRaw.seconds}s, new ${newRaw.seconds}s`;
    for (const check of report.checks) {
      if (!check.ok || args.verbose) log(`    ${check.ok ? 'ok  ' : 'FAIL'}  ${check.id}: ${check.detail}`);
    }
    if (result.status === 'PASS' && !args.keep) fs.rmSync(runBase, { recursive: true, force: true });
    else log(`    (dumps of both runs kept in ${rel(runBase)}: meta.txt, hmmv.txt, samples.bin, entry.vram, return.vram, probe.tcl)`);
  } catch (error) {
    result.status = error instanceof SetupError ? 'SETUP' : 'ERROR';
    result.lines.push(`    ${result.status}: ${error instanceof SetupError ? error.message : (error.stack || error)}`);
    result.seconds = Math.round((Date.now() - started) / 100) / 10;
  }
  return result;
}

async function pool(items, jobs, worker, onDone) {
  const results = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(jobs, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
      onDone(results[index], index);
    }
  });
  await Promise.all(lanes);
  return results;
}

let patternsCache = null;

/** One pass of the harness (a normal comparison, or one sabotage): prints its report, returns { code, ... }. */
async function execute(args) {
  const sab = args.sabotage ? SABOTAGES[args.sabotage] : null;
  let cases;
  if (sab && !args.only) cases = RUNNABLE.filter(def => sab.cases.includes(def.id));
  else cases = selectCases(args.only);
  fs.mkdirSync(args.work, { recursive: true });

  const oracles = new Map();
  if (args.oracle) {
    patternsCache ||= await loadPatterns();
    for (const def of cases) {
      const oracle = buildOracle(patternsCache, def);
      if (oracle) oracles.set(def.id, oracle);
    }
  }
  const mode = sab ? `SABOTAGE "${args.sabotage}" (${sab.describe})` : args.self ? 'SELF (reference against itself)' : `${rel(args.ref)}  vs  ${rel(args.new)}`;
  console.log(`tfx bank parity: ${cases.length} case(s), ${mode}
`);

  const started = Date.now();
  const results = await pool(cases, args.jobs, def => runCase(def, args, oracles), result => {
    const tag = result.status === 'PASS' ? 'PASS ' : result.status === 'FAIL' ? 'FAIL ' : result.status;
    console.log(`${tag} ${result.id.padEnd(22)} ${result.engine ? `${result.engine}; ` : ''}${result.steps || ''}${result.frames ? `, ${result.frames} frames in play` : ''}  [${result.seconds}s${result.runSeconds ? `; ${result.runSeconds}` : ''}]`);
    for (const line of result.lines) console.log(line);
  });

  const passed = results.filter(result => result.status === 'PASS').length;
  console.log(`
${passed}/${results.length} case(s) PASS in ${Math.round((Date.now() - started) / 1000)} s`);
  const broken = results.filter(result => result.status === 'SETUP' || result.status === 'ERROR');
  if (sab) {
    if (sab.benign) {
      for (const result of results) console.log(`  ${result.id.padEnd(22)} ${result.status}${result.failedIds.length ? `  failing: ${result.failedIds.join(', ')}` : ''}`);
      if (passed === results.length) { console.log(`RESULT PASS (benign mutation "${args.sabotage}" did not move any check: the tolerance holds)`); return { code: 0, results }; }
      console.log(`RESULT FAIL: the BENIGN mutation "${args.sabotage}" turned the script red in ${results.filter(r => r.status !== 'PASS').map(r => r.id).join(', ')}: the instrument is too strict for that timing change`);
      return { code: 1, results };
    }
    const caught = results.filter(result => result.status === 'FAIL');
    const notCaught = results.filter(result => result.status === 'PASS');
    const wrongReason = caught.filter(result => !sab.expect.some(id => result.failedIds.includes(id)));
    for (const result of results) {
      console.log(`  ${result.id.padEnd(22)} ${result.status === 'FAIL' ? 'caught' : result.status === 'PASS' ? 'UNDETECTED' : result.status}  by: ${result.failedIds.join(', ') || '-'}`);
    }
    if (notCaught.length || wrongReason.length || broken.length) {
      console.log(`RESULT FAIL: sabotage "${args.sabotage}" ${notCaught.length ? `went UNDETECTED in ${notCaught.map(r => r.id).join(', ')}` : ''}${wrongReason.length ? `; caught only by unexpected checks in ${wrongReason.map(r => r.id).join(', ')} (wanted one of ${sab.expect.join(' | ')})` : ''}${broken.length ? `; could not run ${broken.map(r => r.id).join(', ')}` : ''}`);
      return { code: 1, results };
    }
    console.log(`RESULT PASS (sabotage "${args.sabotage}" was CAUGHT in ${caught.length} case(s), always by one of: ${sab.expect.join(' | ')})`);
    return { code: 0, results };
  }
  if (results.some(result => result.status === 'FAIL')) { console.log(`RESULT FAIL (${results.filter(r => r.status !== 'PASS').length} case(s): ${results.filter(r => r.status !== 'PASS').map(r => r.id).join(', ')})`); return { code: 1, results }; }
  if (broken.length) { console.log(`RESULT FAIL (the instrument could not run ${broken.map(r => r.id).join(', ')})`); return { code: 2, results }; }
  console.log('RESULT PASS');
  return { code: 0, results };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(fs.readFileSync(SELF, 'utf8').split('*/')[0].replace(/^#!.*\n/, '')); return 0; }
  if (args.listSabotages) {
    for (const [name, sab] of Object.entries(SABOTAGES)) console.log(`${name.padEnd(16)} ${sab.describe}
${' '.repeat(17)}default cases: ${sab.cases.join(', ')}; ${sab.benign ? 'must stay GREEN (benign)' : `must turn red: ${sab.expect.join(' | ')}`}`);
    return 0;
  }
  if (args.list) {
    for (const def of RUNNABLE) console.log(`${def.id.padEnd(22)} ${def.romMode.padEnd(9)} ${def.expectsMusic === 'none' ? 'silent' : def.expectsMusic.padEnd(6)} ${def.chain.join(' > ')}`);
    return 0;
  }
  if (args.sabotage && args.sabotage !== 'all' && !SABOTAGES[args.sabotage]) throw new UsageError(`unknown sabotage "${args.sabotage}". Known: all, ${Object.keys(SABOTAGES).join(', ')}`);
  if (!fs.existsSync(OPENMSX)) { console.error(`OpenMSX not found at ${OPENMSX} (set OPENMSX_EXE)`); return 2; }
  if (!fs.existsSync(args.ref)) { console.error(`reference directory ${rel(args.ref)} does not exist (node scripts/build_tfx_bank_reference.mjs)`); return 2; }
  const needsNew = !args.self && (!args.sabotage || SABOTAGES[args.sabotage]?.on === 'new');
  if (needsNew && !fs.existsSync(args.new)) {
    console.error(`the NEW artefacts ${rel(args.new)} do not exist yet. Build them with:
  node scripts/build_tfx_bank_reference.mjs --out ${rel(args.new)} --label after
(or use --self / --sabotage NAME to test the instrument against the reference)`);
    return 2;
  }
  if (args.sabotage === 'all') {
    // every sabotage in turn, each on its own default cases; one summary table at the end
    const table = [];
    for (const name of Object.keys(SABOTAGES)) {
      if (SABOTAGES[name].on === 'new' && (args.self || !fs.existsSync(args.new))) { console.log(`
######## sabotage ${name}: skipped (needs the NEW artefacts: --new DIR, not --self)`); continue; }
      console.log(`\n######## sabotage ${name}`);
      const { code, results } = await execute({ ...args, sabotage: name });
      table.push({ name, code, benign: Boolean(SABOTAGES[name].benign), cases: results.length, by: [...new Set(results.flatMap(r => r.failedIds))] });
    }
    console.log('\n======== sabotage summary (every row must say OK)');
    for (const row of table) console.log(`${row.code === 0 ? 'OK  ' : 'FAIL'} ${row.name.padEnd(28)} ${row.benign ? 'benign, stays green' : `red in ${row.cases} case(s) by: ${row.by.join(', ')}`}`);
    const bad = table.filter(row => row.code !== 0);
    console.log(bad.length ? `RESULT FAIL (${bad.map(row => row.name).join(', ')})` : `RESULT PASS (${table.length} sabotages behave as expected)`);
    return bad.length ? 1 : 0;
  }
  return (await execute(args)).code;
}

function tidyWork() {
  // leave no empty scratch directories behind (the dumps of failing cases stay, on purpose)
  for (const dir of [path.join(DEFAULT_WORK, 'runs', String(process.pid)), path.join(DEFAULT_WORK, 'runs')]) { try { fs.rmdirSync(dir); } catch { /* not empty or absent */ } }
}

main().then(code => { tidyWork(); process.exit(code); }, error => { console.error(error instanceof UsageError ? `error: ${error.message}` : (error.stack || error)); process.exit(2); });
