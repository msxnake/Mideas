#!/usr/bin/env node
/**
 * End-to-end smoke test of the SCREEN 5 Transition FX (entry effect of a boot presentation) in OpenMSX.
 *
 *   node scripts/check_msx2_transition_fx_smoke.mjs [--skip] [--sabotage=<name>] [--reuse]
 *
 * 1. Builds test/msx2-transition-fx/out/fixture_fx.json (scripts/build_msx2_transition_fx_test_project.ts): the
 *    bitmap-room donor project whose boot presentation ("Back to Mars") carries the F1a default effect (alien fade in,
 *    logo drop with bounce, whoosh + thud, wait for a key). The same script runs the JS DECODER over the compiled block and
 *    writes what the ROM must end on: expected_page0.bin (VRAM page 0), expected_page1.bin (the derived picture the RLE
 *    upload must leave on page 1) and the final palette. The expectations come from the decoder, never from the Z80.
 * 2. Generates + assembles the ROM (fresh tsc build, glass.jar) and, for sabotage runs, patches the interpreter first.
 * 3. Runs it in OpenMSX (emulated time, throttle off) and, at the instruction right after `call bitmap_fx_run`, dumps
 *    VRAM page 0 (27 136 B), page 1 rows 0..211, the VDP palette and R#2 / R#7 / R#15. Everything is asserted from VRAM,
 *    RAM and registers, never from screenshots.
 *
 * F3 (every tick): the keyboard / joystick is driven from the TICK counter (a breakpoint on the label that ends bitmap_fx_tick), so a run is
 * deterministic in the decoder's own time base; at every tick of the animation the page 0 of VRAM (27 136 B), the 16 palette entries and the PSG
 * registers are compared with the decoder's state at the same tick (the decoder steps whole ticks: its state after tick N is what the Z80 holds
 * when its Nth tick returns, because a SYNC waits for the command engine before it counts its first tick). A frame that takes several ticks
 * (SYNC n) needs no special care: ticks are COUNTED by calls, never taken from the clock. The END must come at exactly the decoder's tick.
 *
 * Checks: (a) the ROM assembles, the interpreter fits its size budget and the effect reaches its END;
 *         (b) page 0 is BYTE-IDENTICAL to the decoder's page 0 and the VDP palette is the decoder's final palette;
 *         page 1 holds the derived picture; (c) R#2 = page 0, R#7 = 0 (the effect's backdrop) at the end, the room backdrop is
 *         back at the game loop, the interpreter RAM is released and the game goes on (the room paints over the picture).
 *
 * Options (each has an environment twin: FX_INPUT=skip, FX_SABOTAGE=<name>, FX_REUSE=1):
 *   --skip              SPACE is pressed early so the skip sequence runs, and the result must still be the same picture
 *                       (default: SPACE is pressed once the effect waits for it)
 *   --sabotage=<name>   patch the interpreter on purpose and EXPECT this script to go red (exit 0 = the sabotage was
 *                       detected): dy_high | palrun_stride | no_wait_ce | sx_not_doubled | sync_no_ticks |
 *                       vblank_discard_stale | no_backdrop_restore | no_cls_before_fx (needs --chain) | block_index_ignored (needs --two-fx)
 *   --chain             the effect is the SECOND scene of the boot chain (a plain coloured presentation plays first): page 0 is not black
 *                       when the effect starts, so the interpreter's caller must clear it first
 *   --noskip            the effect is NOT skippable (no skip sequence in the block) and SPACE is pressed early anyway: it must be ignored
 *   --two-fx            two different effects in the ROM (the first scene reveals its own picture): the Back to Mars effect then runs from block 1
 *                       of the block table, which is what this variant checks
 *   --joy=<1|2>         press the fire button of joystick port 1 or 2 instead of SPACE (openMSX cannot press a joystick from a script, so the
 *                       trigger bit of the PSG read is FORCED by a breakpoint, as INTRO_INPUT=joy1|joy2 does in the Intro smoke); the keyboard
 *                       is left alone. Combine with --skip (the press must skip) or alone (the press must pass the WAITKEY)
 *   --reuse             skip the fixture/ROM build and reuse the files of the last clean run (fast iteration)
 *   --project=<json>    build the ROM from another project that carries the same effect on the same presentation (e.g. test716 with
 *                       the effect grafted on) instead of the small fixture; implies --until-done
 *   --until-done        stop at the END of the effect: no game-loop checks (for projects whose flow needs more keys to start)
 *
 * Exit code 0 = PASS (or, with FX_SABOTAGE, "the sabotage was caught"). Any failed check is listed with the value that was read.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'test', 'msx2-transition-fx', 'out');
const FIXTURE = path.join(DIR, 'fixture_fx.json');
const argv = process.argv.slice(2);
const argValue = name => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const PROJECT = argValue('project') ? path.resolve(argValue('project')) : '';
const UNTIL_DONE = argv.includes('--until-done') || Boolean(PROJECT);
const CHAIN = argv.includes('--chain');
const NOSKIP = argv.includes('--noskip');
const TWOFX = argv.includes('--two-fx');
const JOY = Number(argValue('joy') || 0);
if (![0, 1, 2].includes(JOY)) { console.error('--joy must be 1 or 2'); process.exit(2); }
const TAG = PROJECT ? 'fx_project' : CHAIN ? 'fx_chain' : NOSKIP ? 'fx_noskip' : TWOFX ? 'fx_two' : 'fx';
const ASM = path.join(DIR, `${TAG}.asm`);
const ROM = path.join(DIR, `${TAG}.rom`);
const SYM = path.join(DIR, `${TAG}.sym`);
// Sabotaged builds go to their own files so the clean ASM/ROM of the last normal run stay usable (FX_REUSE=1).
const S_ASM = path.join(DIR, `${TAG}_sabotaged.asm`);
const S_ROM = path.join(DIR, `${TAG}_sabotaged.rom`);
const S_SYM = path.join(DIR, `${TAG}_sabotaged.sym`);
const RESULT = path.join(DIR, 'fx_smoke_result.txt');
const DUMP_P0 = path.join(DIR, 'fx_dump_page0.bin');
const DUMP_P1 = path.join(DIR, 'fx_dump_page1.bin');
const DUMP_PAL = path.join(DIR, 'fx_dump_palette.bin');
// one record per tick, appended by the tick breakpoint: page 0 (27 136 B), the 16 palette entries (32 B), the PSG register file (16 B)
const TICKS_P0 = path.join(DIR, 'fx_ticks_page0.bin');
const TICKS_PAL = path.join(DIR, 'fx_ticks_palette.bin');
const TICKS_PSG = path.join(DIR, 'fx_ticks_psg.bin');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const INPUT = argv.includes('--skip') || NOSKIP ? 'skip' : (process.env.FX_INPUT || 'space');
const SABOTAGE = argValue('sabotage') ?? process.env.FX_SABOTAGE ?? '';
if (!['space', 'skip'].includes(INPUT)) { console.error(`FX_INPUT must be space or skip, got "${INPUT}"`); process.exit(2); }

/** Interpreter patches: [text to find (exactly once), replacement], or a list of such pairs. Each one breaks a different thing the checks must notice. */
const SABOTAGES = {
  // HMMM writes its copy onto the SOURCE page (DY high byte = source page, not destination page): page 0 never gets painted
  dy_high: ['    ld a, (ix+7)\n    rrca\n    rrca\n    and 3\n    out (#9B), a                   ; R#39 DY high = destination page', '    ld a, (ix+7)\n    and 3\n    out (#9B), a                   ; R#39 DY high = destination page'],
  // PALRUN starts its colour data one byte early: every palette entry shifts
  palrun_stride: ['    inc hl\n    inc hl\n    inc hl                         ; HL = first pair', '    inc hl\n    inc hl                         ; HL = first pair'],
  // HMMV does not wait for the command before it (the HMMM of the logo, in the same frame) to finish
  no_wait_ce: ['bitmap_fx_op_hmmv:\n    call bitmap_fx_wait_ce\n', 'bitmap_fx_op_hmmv:\n'],
  // SX is not doubled (byte units used as pixels)
  sx_not_doubled: ['    ld a, (ix+1)\n    add a, a\n    out (#9B), a                   ; R#32 SX low', '    ld a, (ix+1)\n    out (#9B), a                   ; R#32 SX low'],
  // SYNC never waits for a tick: the animation would run at CPU speed (only the timing check can see it)
  sync_no_ticks: ['bitmap_fx_sync_tick:\n    call bitmap_fx_tick            ; B = fresh press', 'bitmap_fx_sync_tick:\n    ld b, 0                        ; (sabotage: no tick)'],
  // The tick waits like bitmap_wait_vblank (discard a latched flag, wait for the NEXT edge): a frame the compiler priced at 2 ticks takes 3
  vblank_discard_stale: ['    ld bc, #4000\nbitmap_fx_vb_poll:', '    in a, (#99)                    ; (sabotage: discard a stale flag first)\n    ld bc, #4000\nbitmap_fx_vb_poll:'],
  // The second scene does not clear page 0 before the effect (--chain): the first picture shows through wherever the effect paints nothing
  no_cls_before_fx: ['    call bitmap_intro_cls         ; the effect composes onto a black page 0\n', ''],
  // The interpreter always plays block 0 whatever index the scene passes (only --two-fx can see it: with one block 0 is the right one)
  block_index_ignored: ['    ld a, c                        ; block index (the RAM clear below needs BC)\n', '    xor a                          ; (sabotage: always block 0)\n'],
  // MID-FLOW corruption that heals itself: while the tick counter is in [50, 70) every HMMM aims at x + 256 (outside the page, nothing is
  // copied); the frames after it redraw everything, so the FINAL picture is right and only the intermediate ticks are wrong
  dx_high_midflow: [
    ['BITMAP_FX_RAM_BYTES  EQU 12\n', 'BITMAP_FX_RAM_BYTES  EQU 13\nbitmap_fx_ticks      EQU #E70C   ; (sabotage: tick counter)\n'],
    ['bitmap_fx_tick:\n    call bitmap_fx_wait_vblank\n', 'bitmap_fx_tick:\n    call bitmap_fx_wait_vblank\n    ld hl, bitmap_fx_ticks\n    inc (hl)                       ; (sabotage)\n'],
    ['    out (#9B), a                   ; R#35 SY high = source page\n    ld a, (ix+3)\n    add a, a\n    out (#9B), a                   ; R#36 DX low\n    xor a\n    out (#9B), a                   ; R#37 DX high\n',
      '    out (#9B), a                   ; R#35 SY high = source page\n    ld a, (ix+3)\n    add a, a\n    out (#9B), a                   ; R#36 DX low\n    ld a, (bitmap_fx_ticks)\n    sub 50\n    cp 20\n    ld a, 0\n    rla                            ; (sabotage) DX high = 1 while 50 <= tick < 70\n    out (#9B), a                   ; R#37 DX high\n'],
  ],
  // Every SYNC lasts ONE tick whatever its operand: the whole stream still runs, so the final picture is right, but tick N no longer shows
  // what the decoder shows at tick N (stretched frames collapse)
  sync_collapse: ['    ld a, (ix+1)\n    ld (bitmap_fx_n), a\n', '    ld a, 1                        ; (sabotage: every SYNC lasts one tick)\n    ld (bitmap_fx_n), a\n'],
  // The sound sequencer is never advanced: a sound keeps its first step forever (R#10 stays at the first volume)
  psg_no_tick: ['bitmap_fx_tick:\n    call bitmap_fx_wait_vblank\n    call bitmap_fx_psg_tick\n', 'bitmap_fx_tick:\n    call bitmap_fx_wait_vblank\n'],
  // SFX starts the wrong sound (always table entry 0): the second event (the thud, entry 1) sounds like the first
  sfx_wrong_id: ['bitmap_fx_op_sfx:\n    ld l, (ix+1)\n', 'bitmap_fx_op_sfx:\n    ld l, 0                        ; (sabotage: always sound 0)\n'],
  // END (also the end of a skip) forgets to silence the PSG: the sound that was ringing keeps ringing
  skip_no_sfxoff: ['bitmap_fx_end:\n    call bitmap_fx_wait_ce\n    call bitmap_fx_psg_stop\n', 'bitmap_fx_end:\n    call bitmap_fx_wait_ce\n'],
  // The trigger of joystick port 1 / 2 is never honoured
  joy1_ignored: ['    and #10                        ; trigger A, 0 = pressed\n    jp nz, bitmap_fx_key_port2\n', '    and #10                        ; trigger A, 0 = pressed\n    jp bitmap_fx_key_port2         ; (sabotage: port 1 ignored)\n'],
  joy2_ignored: ['bitmap_fx_key_joy2:\n    and #10\n    jp nz, bitmap_fx_key_done\n', 'bitmap_fx_key_joy2:\n    and #10\n    jp bitmap_fx_key_done          ; (sabotage: port 2 ignored)\n'],
  // The WorldLink boot init does not apply the room backdrop (R#7) when the game starts: the game would run on backdrop 0
  no_backdrop_restore: ["; Game starts: colour-0 pixels and the border show the room's background colour again.\n    ld a, #07\n    ld e, #", "; (sabotage: R#7 applied as 0)\n    ld a, #07\n    ld e, #00 ; was #"],
};
if (SABOTAGE && !SABOTAGES[SABOTAGE]) { console.error(`unknown FX_SABOTAGE "${SABOTAGE}"; known: ${Object.keys(SABOTAGES).join(', ')}`); process.exit(2); }

const run = (cmd, args, label, opts = {}) => {
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28, ...opts });
  } catch (error) {
    throw new Error(`${label} failed:\n${error.stdout || ''}${error.stderr || ''}`.slice(0, 3000));
  }
};

const REUSE = (argv.includes('--reuse') || Boolean(process.env.FX_REUSE)) && fs.existsSync(ASM) && fs.existsSync(ROM) && fs.existsSync(SYM)
  && fs.existsSync(path.join(DIR, 'expected.json')) && (NOSKIP || fs.existsSync(path.join(DIR, 'expected_skip_page0.bin')));
console.log(`1/5 ${REUSE ? 'reusing' : 'building'} the fixture and the decoder expectations ...`);
if (!REUSE) {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const built = spawnSync(`${npx} tsx scripts/build_msx2_transition_fx_test_project.ts${CHAIN ? ' --chain' : ''}${NOSKIP ? ' --no-skip' : ''}${TWOFX ? ' --two-fx' : ''}`, [], { cwd: ROOT, stdio: 'pipe', shell: true, maxBuffer: 1 << 28 });
  if (built.status !== 0) { console.error(`fixture build failed:\n${built.stdout}${built.stderr}`.slice(0, 3000)); process.exit(2); }
  console.log(`    ${String(built.stdout).trim().split('\n')[0]}`);
}
const expected = JSON.parse(fs.readFileSync(path.join(DIR, 'expected.json'), 'utf8'));
const expectedPage0 = fs.readFileSync(path.join(DIR, 'expected_page0.bin'));
const expectedPage1 = fs.readFileSync(path.join(DIR, 'expected_page1.bin'));
const expectedSkipPage0 = NOSKIP ? null : fs.readFileSync(path.join(DIR, 'expected_skip_page0.bin'));

console.log(`2/5 ${REUSE ? 'reusing' : 'generating + assembling'} the ROM ...`);
if (!REUSE) {
  run(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), PROJECT || FIXTURE, '--asm', ASM, '--sym', SYM, '--keep', ROM], 'ROM build');
}
let romPath = ROM;
let symPath = SYM;
if (SABOTAGE) {
  const pairs = Array.isArray(SABOTAGES[SABOTAGE][0]) ? SABOTAGES[SABOTAGE] : [SABOTAGES[SABOTAGE]];
  let asm = fs.readFileSync(ASM, 'utf8').replace(/\r\n/g, '\n');
  for (const [find, replace] of pairs) {
    const hits = asm.split(find).length - 1;
    if (hits !== 1) { console.error(`sabotage ${SABOTAGE}: pattern found ${hits} times (expected exactly 1): ${find.slice(0, 60)}; the interpreter text changed, update SABOTAGES`); process.exit(2); }
    asm = asm.replace(find, () => replace);
  }
  fs.writeFileSync(S_ASM, asm);
  run('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'), S_ASM, S_ROM, S_SYM], `assembling the sabotaged ASM (${SABOTAGE})`);
  romPath = S_ROM;
  symPath = S_SYM;
  console.log(`    SABOTAGE ${SABOTAGE}: interpreter patched, this run is EXPECTED to fail`);
}

const sym = new Map();
for (const line of fs.readFileSync(symPath, 'utf8').split('\n')) {
  const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
  if (m) sym.set(m[1], parseInt(m[2], 16));
}
const need = name => {
  if (!sym.has(name)) throw new Error(`symbol ${name} missing from the .sym`);
  return sym.get(name);
};
const addr = name => `0x${need(name).toString(16).toUpperCase().padStart(4, '0')}`;
const fxDoneSymbols = [...sym.keys()].filter(name => /^bitmap_intro_scene\d+_fx_done$/.test(name)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
// --two-fx: the checked effect is the LAST scene's (block index 1 of the table)
const fxDoneSymbol = TWOFX ? fxDoneSymbols[fxDoneSymbols.length - 1] : fxDoneSymbols[0];
if (!fxDoneSymbol) throw new Error('no bitmap_intro_scene<N>_fx_done label in the .sym: the ROM carries no effect scene');

const failures = [];
const check = (name, ok, detail) => { console.log(`    ${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : ` (${detail})`}`); if (!ok) failures.push(`${name} (${detail})`); };

// The byte budget the exporter reserves for the interpreter must cover what glass really produced.
const generatorSource = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapTransitionFxGenerator.ts'), 'utf8');
const estimate = Number(/BITMAP_FX_CODE_BYTES_ESTIMATE = (\d+)/.exec(generatorSource)?.[1]);
const measuredCode = need('bitmap_fx_table') - need('bitmap_fx_main');
const trampoline = need('bitmap_fx_resident_end') - need('bitmap_fx_run');
const bankUsed = need('BITMAP_FX_CODE_BANK_USED_END') - 0x8000;
console.log(`3/5 interpreter ${measuredCode} bytes (budget ${estimate}), trampoline ${trampoline} bytes, bank ${need('BITMAP_FX_CODE_BANK')} uses ${bankUsed} of 8192, block ${expected.blockBytes} bytes`);
check('interpreter fits its budget (BITMAP_FX_CODE_BYTES_ESTIMATE)', measuredCode > 0 && measuredCode <= estimate, `${measuredCode} > ${estimate}`);
if (TWOFX) check('two effect blocks in the ROM', sym.has('bitmap_fx_block_1') && !sym.has('bitmap_fx_block_2') && fxDoneSymbols.length === 2, `fx_done labels: ${fxDoneSymbols.join(',')}`);
check('trampoline stays below #8000', need('bitmap_fx_resident_end') <= 0x8000, `ends at ${need('bitmap_fx_resident_end').toString(16)}`);
check('bank holds interpreter + block', bankUsed <= 0x2000 && bankUsed >= measuredCode + expected.blockBytes, `bankUsed=${bankUsed}`);
// The IDE bank map ("Bancos" button) reads this one-line report: the effect bank must be in it, sized from the Glass symbol.
const reportLine = /^; @mideas-bank-map (.*)$/m.exec(fs.readFileSync(ASM, 'utf8'));
const report = reportLine ? JSON.parse(reportLine[1]) : { banks: [] };
const fxEntry = report.banks.find(entry => entry.endLabel === 'BITMAP_FX_CODE_BANK_USED_END');
check('bank map report lists the effect bank as fx-code', Boolean(fxEntry) && fxEntry.kind === 'fx-code' && fxEntry.bank === need('BITMAP_FX_CODE_BANK') && fxEntry.startAddr === 0x8000
  && need(fxEntry.endLabel) - fxEntry.startAddr === bankUsed, JSON.stringify(fxEntry));

// Key / joystick schedule, in TICKS: [tick-return count at which the key goes down, ticks it stays down]. The decoder's own run
// (build_msx2_transition_fx_test_project.ts) uses the same numbers, so both sides see the same presses at the same ticks.
const windows = [];
if (INPUT === 'skip') windows.push([expected.skipFrom, expected.skipTicks]);
if (INPUT === 'space' || NOSKIP) windows.push([expected.pressFrom, expected.pressTicks]);
const joyLabel = JOY === 1 ? 'bitmap_fx_key_joy1' : JOY === 2 ? 'bitmap_fx_key_joy2' : '';
const tcl = `
set result [open "${RESULT.replace(/\\/g, '/')}" w]
proc out {k v} { global result; puts $result "$k $v"; flush $result }
proc rd {a} { return [debug read memory $a] }
proc vreg {n} { return [debug read "VDP regs" $n] }
proc dump {path blk} { set f [open $path wb]; puts -nonewline $f $blk; close $f }
set throttle off
set t_run -1
set t_wait -1
set t_done -1
set done_hit 0
set in_fx 0
set tick 0
set joy 0
set joy_port ${JOY}
set tick_count ${expected.tickCount}
set windows {${windows.map(([from, n]) => `{${from} ${n}}`).join(' ')}}
set pf ""
set palf ""
set psgf ""

# SPACE goes through the keyboard matrix; the joystick button cannot be pressed from a script, so a flag makes the breakpoint on the
# trigger test below force the bit (as INTRO_INPUT=joy1|joy2 does in the Intro smoke)
proc key_down {} { if {$::joy_port == 0} { keymatrixdown 8 0x01 } else { set ::joy 1 } }
proc key_up {} { if {$::joy_port == 0} { keymatrixup 8 0x01 } else { set ::joy 0 } }
proc close_ticks {} {
  if {$::pf ne ""} { close $::pf; set ::pf "" }
  if {$::palf ne ""} { close $::palf; set ::palf "" }
  if {$::psgf ne ""} { close $::psgf; set ::psgf "" }
}
proc finish {} {
  close_ticks
  out DONE 1
  close $::result
  exit
}
proc timeout {} {
  out TIMEOUT "fx_done=$::done_hit tick=$::tick t=[format %.2f [machine_info time]]"
  finish
}
after time 90 timeout

# R#7 at the start of the boot intro: a GameFlow keeps it at 0 from boot (init_rom) until the game starts, so no scene shows the room's index.
debug set_bp ${addr('run_bitmap_intro')} {} {
  out R7_BOOT [vreg 7]
}

# The effect starts: from here every tick is counted. (A ROM with two effects calls this twice: the last run is the one that is kept.)
debug set_bp ${addr('bitmap_fx_run')} {} {
  set ::t_run [machine_info time]
  out T_RUN [format %.4f $::t_run]
  set ::in_fx 1
  set ::tick 0
  close_ticks
  set ::pf [open "${TICKS_P0.replace(/\\/g, '/')}" wb]
  set ::palf [open "${TICKS_PAL.replace(/\\/g, '/')}" wb]
  set ::psgf [open "${TICKS_PSG.replace(/\\/g, '/')}" wb]
}

# One tick has just returned (the label sits on the RET of bitmap_fx_tick): the Nth hit is the decoder's tick N. The command engine is idle
# here (a SYNC waits for it before its first tick), so VRAM holds the whole frame. Record it, then drive the key from the tick count.
debug set_bp ${addr('bitmap_fx_tick_done')} {$::in_fx} {
  incr ::tick
  if {$::tick <= $::tick_count} {
    puts -nonewline $::pf [debug read_block "physical VRAM" 0 27136]
    puts -nonewline $::palf [debug read_block "VDP palette" 0 32]
    puts -nonewline $::psgf [debug read_block "PSG regs" 0 16]
  }
  foreach w $::windows {
    lassign $w from n
    if {$::tick == $from} { key_down }
    if {$::tick == $from + $n} { key_up }
  }
}
${joyLabel ? `
# Force the trigger bit (0 = pressed) of port ${JOY} while the "joystick" is down. The opcode check keeps other banks mapped at #8000 out.
debug set_bp ${addr(joyLabel)} {$::in_fx && $::joy == 1 && [debug read memory ${addr(joyLabel)}] == 0xE6} { reg A 0 }
` : ''}
# The stream reached WAITKEY: the compiler's animation is over (only the time is noted; the press comes from the tick schedule).
debug set_bp ${addr('bitmap_fx_op_waitkey')} {$::in_fx && [debug read memory ${addr('bitmap_fx_op_waitkey')}] == 0x0E} {
  set ::t_wait [machine_info time]
  out T_WAIT [format %.4f $::t_wait]
}

# Right after "call bitmap_fx_run": the END of the effect.
debug set_bp ${addr(fxDoneSymbol)} {} {
  if {!$::done_hit} {
    set ::done_hit 1
    set ::in_fx 0
    set ::t_done [machine_info time]
    out T_DONE [format %.4f $::t_done]
    out TICKS_DONE $::tick
    close_ticks
    dump "${DUMP_P0.replace(/\\/g, '/')}" [debug read_block "physical VRAM" 0 27136]
    dump "${DUMP_P1.replace(/\\/g, '/')}" [debug read_block "physical VRAM" 32768 27136]
    dump "${DUMP_PAL.replace(/\\/g, '/')}" [debug read_block "VDP palette" 0 32]
    out R2_DONE [vreg 2]
    out R7_DONE [vreg 7]
    out R14_DONE [vreg 14]
    out R15_DONE [vreg 15]
    out R8_DONE [vreg 8]
    out PSG10_DONE [debug read "PSG regs" 10]
    out FX_ACTIVE [rd ${addr('bitmap_fx_psg_active')}]
    if {${UNTIL_DONE ? 1 : 0}} { finish }
  }
}

# The game goes on: the room loop is reached and the picture is painted over.
set game_hit 0
debug set_bp ${addr('bitmap_enter_game_loop')} {} {
  if {!$::game_hit} {
    set ::game_hit 1
    after time 1.0 {
      out T_GAME [format %.4f [machine_info time]]
      out R7_GAME [vreg 7]
      out R2_GAME [vreg 2]
      out R15_GAME [vreg 15]
      set blk [debug read_block "physical VRAM" [expr {24*128}] [expr {166*128}]]
      binary scan $blk c* bytes
      set s 0
      foreach b $bytes { set s [expr {($s * 31 + ($b & 255)) & 0xFFFFFF}] }
      out ROOM_SUM $s
      finish
    }
  }
}
`;
const tclPath = path.join(DIR, 'fx_smoke.tcl');
fs.writeFileSync(tclPath, tcl);
for (const file of [RESULT, DUMP_P0, DUMP_P1, DUMP_PAL, TICKS_P0, TICKS_PAL, TICKS_PSG]) fs.rmSync(file, { force: true });

console.log(`4/5 running OpenMSX (input ${INPUT}${JOY ? `, joystick port ${JOY}` : ''}) ...`);
const proc = spawnSync(OPENMSX, [
  '-machine', 'C-BIOS_MSX2+_JP', '-cart', romPath.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/'),
], { cwd: ROOT, timeout: 240000, stdio: 'pipe' });
if (!fs.existsSync(RESULT)) {
  console.error(`OpenMSX produced no result file (exit ${proc.status}).\n${proc.stderr?.toString().slice(0, 1500)}`);
  process.exit(2);
}
console.log('5/5 checking what OpenMSX saw:');
const kv = new Map();
for (const line of fs.readFileSync(RESULT, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^(\S+)\s+(.*)$/);
  if (m) kv.set(m[1], m[2].trim());
}
const num = key => (kv.has(key) ? Number(kv.get(key)) : NaN);
check('the effect reached its END before the timeout', kv.has('T_DONE') && !kv.has('TIMEOUT'), kv.get('TIMEOUT') || 'no T_DONE');

if (kv.has('T_DONE') && fs.existsSync(DUMP_P0)) {
  // (b) VRAM page 0 byte for byte against the JS decoder's page 0
  const p0 = fs.readFileSync(DUMP_P0);
  const want = INPUT === 'skip' && !NOSKIP ? expectedSkipPage0 : expectedPage0;
  let diff = 0;
  let first = -1;
  for (let i = 0; i < want.length; i++) if (p0[i] !== want[i]) { diff++; if (first < 0) first = i; }
  check(`VRAM page 0 is byte-identical to the decoder's (${want.length} bytes)`, p0.length === want.length && diff === 0,
    `${diff} bytes differ${first >= 0 ? `, first at row ${Math.floor(first / 128)} byte ${first % 128}: got ${p0[first]?.toString(16)} want ${want[first].toString(16)}` : ''}; dumped ${p0.length} bytes`);
  // the derived picture the RLE upload left on page 1
  const p1 = fs.readFileSync(DUMP_P1);
  let diff1 = 0;
  for (let i = 0; i < expectedPage1.length; i++) if (p1[i] !== expectedPage1[i]) diff1++;
  check('VRAM page 1 rows 0..211 hold the derived picture (RLE upload)', p1.length === expectedPage1.length && diff1 === 0, `${diff1} bytes differ`);
  // the VDP palette is the decoder's final palette
  const pal = fs.readFileSync(DUMP_PAL);
  const badPal = [];
  expected.palette.forEach(([r, g, b], i) => {
    const gotRb = pal[2 * i]; const gotG = pal[2 * i + 1];
    const got = [(gotRb >> 4) & 7, gotG & 7, gotRb & 7];
    if (got[0] !== r || got[1] !== g || got[2] !== b) badPal.push(`#${i} got ${got} want ${[r, g, b]}`);
  });
  check('VDP palette is the decoder\'s final palette (16 entries)', pal.length === 32 && badPal.length === 0, badPal.slice(0, 3).join('; '));
  // (c) registers at the end of the effect
  check('R#2 = #1F (page 0 on screen)', num('R2_DONE') === 0x1f, `R#2=${kv.get('R2_DONE')}`);
  check('R#7 = 0 (the effect\'s backdrop)', num('R7_DONE') === 0, `R#7=${kv.get('R7_DONE')}`);
  check('R#15 = 0 (S#0 selected for the room code)', num('R15_DONE') === 0, `R#15=${kv.get('R15_DONE')}`);
  check('R#14 = 0 (VRAM address bank cleared)', num('R14_DONE') === 0, `R#14=${kv.get('R14_DONE')}`);
  check('sprites still off (R#8 = #0A)', num('R8_DONE') === 0x0a, `R#8=${kv.get('R8_DONE')}`);
  check('PSG one-shot released at END', num('FX_ACTIVE') === 0, `active=${kv.get('FX_ACTIVE')}`);
  // Timing hook (the fine timing assertions are phase F3): animation ticks vs the compiler's estimate.
  if (INPUT === 'space' && kv.has('T_RUN') && kv.has('T_WAIT')) {
    const ticks = (num('T_WAIT') - num('T_RUN')) * 60;
    const want = expected.totalTicks;
    check(`animation lasts about ${want} ticks (within 10 %)`, Math.abs(ticks - want) <= want * 0.1, `${ticks.toFixed(1)} ticks measured`);
  }
  if (NOSKIP && kv.has('T_RUN') && kv.has('T_WAIT')) {
    // SPACE pressed at 0.5 s of an effect that is not skippable: the animation must run its whole length
    const ticks = (num('T_WAIT') - num('T_RUN')) * 60;
    check(`a press is ignored when the effect is not skippable (still ~${expected.totalTicks} ticks)`, Math.abs(ticks - expected.totalTicks) <= expected.totalTicks * 0.1, `${ticks.toFixed(1)} ticks measured`);
  }
  if (INPUT === 'skip' && !NOSKIP && kv.has('T_RUN')) {
    const elapsed = (num('T_DONE') - num('T_RUN')) * 60;
    check('skip reaches the END in well under the full animation', elapsed < expected.totalTicks * 0.6, `${elapsed.toFixed(1)} ticks`);
  }
  // ---- F3: every tick of the animation against the decoder at the SAME tick -------------------------------------------------
  const skipRun = INPUT === 'skip' && !NOSKIP;
  const wantEnd = skipRun ? expected.skipEndTick : expected.endTick;
  const wantTicks = skipRun ? expected.skipEndTick : expected.tickCount;
  check(`END reached at exactly the decoder's tick (${wantEnd}; key driven by ticks${JOY ? `, joystick port ${JOY}` : ''})`, num('TICKS_DONE') === wantEnd, `ticks counted ${kv.get('TICKS_DONE')}`);
  const readOr = file => (fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0));
  const tickP0 = readOr(TICKS_P0);
  const tickPal = readOr(TICKS_PAL);
  const tickPsg = readOr(TICKS_PSG);
  const expTickP0 = readOr(path.join(DIR, 'expected_ticks_page0.bin'));
  const ticksRecorded = Math.floor(tickP0.length / 27136);
  check(`${wantTicks} ticks sampled (page 0, palette, PSG)`, ticksRecorded === wantTicks && tickPal.length === 32 * wantTicks && tickPsg.length === 16 * wantTicks,
    `page0 ${ticksRecorded} palette ${tickPal.length / 32} psg ${tickPsg.length / 16}`);
  const bad = { p0: [], pal: [], psg: [] };
  const p0Detail = {};
  const psgDetail = {};
  // R#7: only the six mixer bits are sound (bits 6-7 are the I/O port directions, which the MSX hardware / openMSX force to their own values)
  const PSG_MASK = { 4: 0xff, 5: 0x0f, 6: 0x1f, 7: 0x3f, 10: 0x1f, 11: 0xff, 12: 0xff, 13: 0x0f };
  for (let t = 1; t <= Math.min(ticksRecorded, wantTicks); t++) {
    const got = tickP0.subarray((t - 1) * 27136, t * 27136);
    const want = expTickP0.subarray((t - 1) * 27136, t * 27136);
    if (Buffer.compare(got, want) !== 0) {
      let n = 0; let first = -1;
      for (let i = 0; i < 27136; i++) if (got[i] !== want[i]) { n++; if (first < 0) first = i; }
      bad.p0.push(t);
      p0Detail[t] = `${n} bytes differ, first at row ${Math.floor(first / 128)} byte ${first % 128}`;
    }
    const palBad = [];
    expected.tickPalettes[t - 1].forEach(([r, g, b], i) => {
      const rb = tickPal[(t - 1) * 32 + 2 * i]; const gg = tickPal[(t - 1) * 32 + 2 * i + 1];
      if (((rb >> 4) & 7) !== r || (gg & 7) !== g || (rb & 7) !== b) palBad.push(`#${i} got ${[(rb >> 4) & 7, gg & 7, rb & 7]} want ${[r, g, b]}`);
    });
    if (palBad.length) { bad.pal.push(t); p0Detail[`pal${t}`] = palBad.slice(0, 2).join('; '); }
    // PSG: R#10 (volume of channel C) at every tick; the other registers only once a sound has defined them (before the first SFX the
    // register file still holds what the BIOS left, which the decoder does not model)
    const psgBad = [];
    for (const [reg, mask] of Object.entries(PSG_MASK)) {
      if (Number(reg) !== 10 && t < expected.firstSfxTick) continue;
      const g = tickPsg[(t - 1) * 16 + Number(reg)] & mask;
      const w = expected.tickPsg[t - 1][Number(reg)] & mask;
      if (g !== w) psgBad.push(`R#${reg} got ${g} want ${w}`);
    }
    if (psgBad.length) { bad.psg.push(t); psgDetail[t] = psgBad.join(', '); }
  }
  for (const t of expected.sampleTicks.filter(tick => tick <= wantTicks)) {
    check(`tick ${t}: VRAM page 0 and palette equal the decoder's at that tick`, !bad.p0.includes(t) && !bad.pal.includes(t), p0Detail[t] || p0Detail[`pal${t}`] || 'not sampled');
  }
  const firstBad = list => (list.length ? `first at tick ${list[0]}, ${list.length} ticks differ` : '');
  check(`all ${wantTicks} ticks: VRAM page 0 equals the decoder's`, bad.p0.length === 0, `${firstBad(bad.p0)} (${p0Detail[bad.p0[0]]})`);
  check(`all ${wantTicks} ticks: the 16 palette entries equal the decoder's`, bad.pal.length === 0, `${firstBad(bad.pal)} (${p0Detail[`pal${bad.pal[0]}`]})`);
  check(`all ${wantTicks} ticks: PSG registers equal the decoder's (R#10 always, R#4-7/11-13 from the first sound)`, bad.psg.length === 0, `${firstBad(bad.psg)} (${psgDetail[bad.psg[0]]})`);
  // The SFX events of the decoder, one by one: the register file at the event's tick and the ones around it (+-1) must match, and the
  // event must be OBSERVABLE there (the decoder's registers change), so the check cannot pass on a silent stream
  expected.sfx.forEach((event, index) => {
    const first = event.tick + 1; // the SFX op runs after tick `event.tick`: its registers are first visible at the next tick
    if (first > wantTicks) return;
    const around = [first - 1, first, first + 1].filter(t => t >= 1 && t <= wantTicks);
    const observable = JSON.stringify(expected.tickPsg[first - 1]) !== JSON.stringify(expected.tickPsg[Math.max(0, first - 2)]);
    check(`SFX #${index} (sound ${event.id}, decoder tick ${event.tick}): PSG matches the decoder at ticks ${around[0]}..${around[around.length - 1]}`,
      observable && around.every(t => !bad.psg.includes(t)), observable ? around.filter(t => bad.psg.includes(t)).map(t => `tick ${t}: ${psgDetail[t]}`).join('; ') : 'event not observable in the decoder registers');
  });
  check('PSG volume C (R#10) is 0 at the END', num('PSG10_DONE') === 0, `R#10=${kv.get('PSG10_DONE')}`);
  if (skipRun) check('(fixture) the skip lands while a sound rings, so "0 after the skip" is meaningful', expected.tickPsg[wantTicks - 1][10] !== 0, `decoder R#10 at tick ${wantTicks} = ${expected.tickPsg[wantTicks - 1][10]}`);
}
if (!UNTIL_DONE) check('game loop reached after the effect', kv.has('T_GAME'), 'bitmap_enter_game_loop never hit');
if (!UNTIL_DONE && kv.has('T_GAME')) {
  // The room backdrop is whatever init_screen5_bitmap_vdp writes to R#7; the WorldLink boot init applies it when the game starts.
  const roomBackdrop = Number.parseInt(/init_screen5_bitmap_vdp:[\s\S]*?ld a, #07\n\s+ld e, #([0-9A-Fa-f]{2})/.exec(fs.readFileSync(ASM, 'utf8').replace(/\r\n/g, '\n'))?.[1] ?? 'FF', 16);
  check('room backdrop applied to R#7 at the game loop', num('R7_GAME') === roomBackdrop, `room backdrop=${roomBackdrop} game R#7=${kv.get('R7_GAME')}`);
  if (roomBackdrop !== 0) check('R#7 = 0 while the boot intro runs (the room index would show a colour of the scene palette)', num('R7_BOOT') === 0, `boot R#7=${kv.get('R7_BOOT')}`);
  check('R#2 = page 0 at the game loop', num('R2_GAME') === 0x1f, `R#2=${kv.get('R2_GAME')}`);
  // the room paints over the effect's picture: rows 24..189 of page 0 are no longer the decoder's picture
  let pictureSum = 0;
  for (let i = 24 * 128; i < 190 * 128; i++) pictureSum = (pictureSum * 31 + expectedPage0[i]) & 0xffffff;
  check('the room is painted over the picture (page 0 rows 24..189 changed)', Number.isFinite(num('ROOM_SUM')) && num('ROOM_SUM') !== pictureSum, `ROOM_SUM=${kv.get('ROOM_SUM')} picture=${pictureSum}`);
}

console.log('');
if (SABOTAGE) {
  if (failures.length > 0) {
    console.log(`RESULT PASS (sabotage "${SABOTAGE}" was CAUGHT by ${failures.length} check(s))`);
    process.exit(0);
  }
  console.log(`RESULT FAIL: sabotage "${SABOTAGE}" went UNDETECTED (every check passed)`);
  process.exit(1);
}
if (failures.length > 0) {
  console.log(`RESULT FAIL (${failures.length})`);
  process.exit(1);
}
console.log('RESULT PASS');
process.exit(0);
