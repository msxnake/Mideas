#!/usr/bin/env node
/**
 * SCREEN 5 bitmap-room GameFlow: the backdrop (R#7) must not paint the screens before the game.
 *
 *   node scripts/check_msx2_bitmap_boot_backdrop.mjs [--static-only]
 *
 * Bug (reported on a Back to Mars project): after a transition cleared the boot presentation, the screen stayed GREEN
 * instead of black. In SCREEN 5 colour-0 pixels (what a transition clears the page with) and the border display
 * palette[R#7], and R#7 was the ROOM background index. The presentation / Intro / menus run on their own palette, where
 * that index is any colour: a room background of 2 was green in the Intro palette. The entry effect also put the room
 * backdrop back right after the scene's wait, i.e. before the transition that clears the page, and init_rom kept it
 * through the whole init that follows the boot presentation.
 *
 * Policy now: with a GameFlow, R#7 = 0 from boot until the game starts; the WorldLink boot init applies the room index.
 * Rooms with background 0 (and ROMs without a GameFlow) are untouched.
 *
 * Fixture: test/msx2-bitmap-intro/bitmap_intro_test.json (Start -> Presentation -> wipe -> WorldLink -> End), every room
 * set to background BG. OpenMSX presses SPACE through the presentation and samples R#7 every 0.1 s emulated between
 * run_bitmap_intro and the first pass of the gameplay loop: every sample must read 0, and the gameplay loop must read BG.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'server', 'temp', 'boot_backdrop');
const SOURCE = path.join(ROOT, 'test', 'msx2-bitmap-intro', 'bitmap_intro_test.json');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const BG = 2;
const staticOnly = process.argv.includes('--static-only');
fs.mkdirSync(WORK, { recursive: true });

const problems = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok   ' : 'FAIL '} ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) problems.push(name);
};

const bundle = await esbuild.build({
  entryPoints: [path.join(ROOT, 'utils/msxGenerator/index.ts')], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'error',
  external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
});
const generator = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

function build(name, background) {
  const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  for (const asset of raw.assets) if (asset.type === 'msx2bitmaproom') asset.data.backgroundColor = background;
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  let files;
  try {
    files = generator.generateModularASM('boot_backdrop', raw.assets, {
      generateUnified: true, romMode: 'megarom', targetFormat: 'konami', autoMegaROM: true,
      screenMode: raw.screenMode || raw.currentScreenMode, targetGraphicsBackend: raw.targetGraphicsBackend || undefined,
    });
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
  const asm = (files['unitedFiles.asm'] || files['main.asm']).replace(/\r\n/g, '\n');
  const asmPath = path.join(WORK, `${name}.asm`);
  const romPath = path.join(WORK, `${name}.rom`);
  const symPath = path.join(WORK, `${name}.sym`);
  fs.writeFileSync(asmPath, asm);
  fs.rmSync(romPath, { force: true });
  try {
    execFileSync('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'), asmPath, romPath, symPath], { stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    return { asm, ok: false, detail: `${error.stdout || ''}${error.stderr || ''}`.slice(0, 500) };
  }
  const rom = fs.readFileSync(romPath);
  let size = 1;
  while (size < rom.length) size *= 2;
  if (size !== rom.length) fs.writeFileSync(romPath, Buffer.concat([rom, Buffer.alloc(size - rom.length, 0xff)]));
  const symbols = new Map();
  for (const line of fs.readFileSync(symPath, 'utf8').split('\n')) {
    const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (match) symbols.set(match[1], parseInt(match[2], 16));
  }
  return { asm, ok: true, romPath, symbols };
}
const block = (asm, label) => {
  const lines = asm.split('\n');
  const start = lines.findIndex(line => line.startsWith(`${label}:`));
  if (start < 0) return '';
  let end = start + 1;
  while (end < lines.length && !/^[A-Za-z_][A-Za-z0-9_.]*:/.test(lines[end])) end++;
  return lines.slice(start + 1, end).join('\n');
};
const hex2 = value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`;

// ---- static ----
const withBackdrop = build('bg2', BG);
check('the BG=2 variant assembles', withBackdrop.ok, withBackdrop.detail);
const zero = '    ld a, #07\n    ld e, #00\n    call vdp_write_register';
const initRom = block(withBackdrop.asm, 'init_rom');
check('init_rom zeroes R#7 right after init_screen5_bitmap_vdp when a GameFlow exists', initRom.includes(`call init_screen5_bitmap_vdp\n${'    ; GameFlow before the game'}`) && initRom.includes(zero), initRom.slice(0, 300));
check('the WorldLink boot init applies the room background (R#7 = 2) before the room is composed',
  new RegExp(`    ; Game starts[^\\n]*\\n    ld a, #07\\n    ld e, ${hex2(BG)}\\n    call vdp_write_register\\n`).test(withBackdrop.asm));
check('the entry-effect scene no longer puts the room backdrop back before the transition ("R#7 = the room backdrop")', !/R#7 = the room backdrop/.test(withBackdrop.asm));
const plainBackdrop = build('bg0', 0);
check('the BG=0 variant assembles', plainBackdrop.ok, plainBackdrop.detail);
check('background 0: nothing of this is emitted (ROM untouched)', !/GameFlow before the game|Game starts: colour-0/.test(plainBackdrop.asm));

if (staticOnly || !withBackdrop.ok) {
  console.log(problems.length ? `\nRESULT FAIL (${problems.length})` : '\nRESULT PASS (static only)');
  process.exit(problems.length ? 1 : 0);
}

// ---- dynamic ----
const addr = name => {
  if (!withBackdrop.symbols.has(name)) throw new Error(`symbol ${name} missing from the .sym`);
  return withBackdrop.symbols.get(name);
};
const resultPath = path.join(WORK, 'result.txt').replace(/\\/g, '/');
fs.rmSync(resultPath, { force: true });
const tcl = `
set result [open "${resultPath}" w]
set throttle off
set stage 0
set samples 0
set bad {}
proc sample {} {
  if {$::stage == 1} {
    incr ::samples
    set r7 [debug read "VDP regs" 7]
    if {$r7 != 0} { lappend ::bad [format "%d@%.1f" $r7 [machine_info time]] }
  }
  after time 0.1 sample
}
proc press {} { keymatrixdown 8 0x01; after time 0.15 { keymatrixup 8 0x01 }; after time 1.2 press }
after time 1 sample
after time 2 press
debug set_bp ${addr('run_bitmap_intro')} {} { if {$::stage == 0} { set ::stage 1 } }
# The window ends where the game starts: the WorldLink boot init applies the room backdrop and then calls load_room.
debug set_bp ${addr('load_room')} {} {
  if {$::stage == 1} {
    set ::stage 2
    puts $::result "SAMPLES $::samples"
    puts $::result "BAD [llength $::bad] $::bad"
    puts $::result "R7_LOAD_ROOM [debug read "VDP regs" 7]"
  }
}
debug set_bp ${addr('bitmap_enter_game_loop')} {} {
  if {$::stage == 2} {
    set ::stage 3
    puts $::result "R7_GAME [debug read "VDP regs" 7]"
    puts $::result "DONE"
    close $::result
    exit
  }
}
after time 200 { puts $::result "TIMEOUT stage=$::stage samples=$::samples"; close $::result; exit }
`;
const tclPath = path.join(WORK, 'sample.tcl');
fs.writeFileSync(tclPath, tcl);
console.log('running OpenMSX ...');
spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', '-cart', withBackdrop.romPath.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/')], { cwd: ROOT, timeout: 600000, stdio: 'pipe' });
const out = fs.existsSync(resultPath) ? fs.readFileSync(resultPath, 'utf8') : '(no result file)';
check('the ROM runs the boot presentation and reaches the gameplay loop', /DONE/.test(out), out.slice(0, 200));
const samples = Number(/SAMPLES (\d+)/.exec(out)?.[1] ?? 0);
check('R#7 was sampled through the presentation, the wipe and the init (>= 20 samples)', samples >= 20, `${samples} samples`);
const bad = /BAD (\d+)(.*)/.exec(out);
check('R#7 = 0 in every sample before the game starts (a room background of 2 must not paint the presentation, the cleared page or the border)',
  Number(bad?.[1] ?? 1) === 0, bad ? `${bad[1]} samples had R#7 != 0:${bad[2]}` : 'no result');
check(`the room is composed with the room background already applied (R#7 = ${BG} when load_room starts)`, Number(/R7_LOAD_ROOM (\d+)/.exec(out)?.[1] ?? -1) === BG, `R#7 = ${/R7_LOAD_ROOM (\d+)/.exec(out)?.[1]}`);
check(`the gameplay loop runs with the room background (R#7 = ${BG})`, Number(/R7_GAME (\d+)/.exec(out)?.[1] ?? -1) === BG, `R#7 = ${/R7_GAME (\d+)/.exec(out)?.[1]}`);

console.log(problems.length ? `\nRESULT FAIL (${problems.length}): ${problems.join('; ')}` : '\nRESULT PASS');
process.exit(problems.length ? 1 : 0);
