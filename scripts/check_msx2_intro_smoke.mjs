#!/usr/bin/env node
/**
 * End-to-end smoke test of the SCREEN 5 Intro node in OpenMSX.
 *
 *   node scripts/check_msx2_intro_smoke.mjs [--keep]
 *
 * 1. Rebuilds test/msx2-intro/fixture_intro.json (two slides, image + zones, built-in and custom
 *    font, a PT3 track playing from a Music node before the Intro).
 * 2. Generates the ROM (fresh tsc build) and assembles it with glass.
 * 3. Runs it in OpenMSX (emulated time, throttle off), pressing SPACE whenever the intro reports it is
 *    waiting (with a 120 s emulated timeout), and checks from the outside: the interpreter's own state variables, that the music stays
 *    active during the whole intro, that pixels really reached VRAM page 0 (image, typed text,
 *    the "more" marker) and that the game starts afterwards.
 *
 * Exit code 0 = PASS. Any failed check is listed with the value that was read.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'test', 'msx2-intro');
const FIXTURE = path.join(DIR, 'fixture_intro.json');
const ROM = path.join(DIR, 'intro.rom');
const SYM = path.join(DIR, 'intro.sym');
const RESULT = path.join(DIR, 'intro_smoke_result.txt');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';

// INTRO_MUSIC = keep (default: a Music node started the song, the intro leaves it alone) | none (intro silences it) | track
const MUSIC = process.env.INTRO_MUSIC || 'keep';
// INTRO_INPUT = space (default) | joy1 | joy2: what advances the intro. openMSX cannot press a joystick from a
// script, so the joystick modes force the trigger bit of the PSG read (a breakpoint on the `and #10` that
// follows `in a,(#A2)`); the interpreter's own edge/flag logic is what is exercised.
const INPUT = process.env.INTRO_INPUT || 'space';
// INTRO_MONO=1: the fixture's images are 1 bpp; their VRAM rectangles are dumped and compared
// byte-exact with the editor's own rendering (scripts/compare_msx2_intro_mono_vram.ts).
const MONO = Boolean(process.env.INTRO_MONO);
const MONO_DUMP = path.join(DIR, 'intro_mono_vram.txt');
const run = (script, args, label) => {
  try {
    execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28, env: { ...process.env, INTRO_MUSIC: MUSIC } });
  } catch (error) {
    throw new Error(`${label} failed:\n${error.stdout || ''}${error.stderr || ''}`.slice(0, 3000));
  }
};

console.log('1/4 building the fixture ...');
run('build_msx2_intro_test_project.mjs', [], 'fixture build');
console.log('2/4 generating + assembling the ROM ...');
run('measure_bitmap_rom_budget.mjs', [FIXTURE, '--keep', ROM, '--sym', SYM], 'ROM build');

const sym = new Map();
for (const line of fs.readFileSync(SYM, 'utf8').split('\n')) {
  const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
  if (m) sym.set(m[1], parseInt(m[2], 16));
}
const need = name => {
  if (!sym.has(name)) throw new Error(`symbol ${name} missing from the .sym`);
  return `0x${sym.get(name).toString(16).toUpperCase().padStart(4, '0')}`;
};
const A = {
  slides: need('bitmap_intro_slides'), steps: need('bitmap_intro_steps'), marker: need('bitmap_intro_marker'),
  music: need('music_active'), which: need('bitmap_intro_which'),
  joy1: need('bitmap_intro_key_joy1'), joy2: need('bitmap_intro_key_joy2'),
};

// The byte budget the exporter reserves for the interpreter must cover what glass really produced.
const estimate = Number(/INTRO_CODE_BYTES_ESTIMATE = (\d+)/.exec(fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapIntroGenerator.ts'), 'utf8'))?.[1]);
const measured = sym.get('bitmap_intro_table') - sym.get('bitmap_intro_main');
if (!(measured > 0 && measured <= estimate)) {
  console.error(`interpreter is ${measured} bytes but INTRO_CODE_BYTES_ESTIMATE is ${estimate}: raise the estimate (the bank-size check would under-count).`);
  process.exit(1);
}
console.log(`interpreter ${measured} bytes (budget ${estimate})`);

// Emulated-time schedule (seconds). C-BIOS needs ~3.5 s before the cartridge runs.
const tcl = `
set result [open "${RESULT.replace(/\\/g, '/')}" w]
set fails 0
set music_seen_off 0
proc rd {a} { return [debug read memory $a] }
proc vram {a} { return [debug read "physical VRAM" $a] }
proc check {name cond detail} {
  global result fails
  if {$cond} { puts $result "ok    $name" } else { puts $result "FAIL  $name ($detail)"; incr fails }
  flush $result
}
# number of nibbles equal to \`c\` in \`n\` bytes of page 0 starting at \`addr\`
proc nibbles {addr n c} {
  set k 0
  for {set i 0} {$i < $n} {incr i} {
    set b [vram [expr {$addr + $i}]]
    if {(($b >> 4) & 15) == $c} { incr k }
    if {($b & 15) == $c} { incr k }
  }
  return $k
}
# bytes of a page-0 rectangle (x, w in bytes) as a Tcl list, for the 1 bpp comparison
proc dump_rect {x y w h} {
  set out {}
  for {set r 0} {$r < $h} {incr r} {
    for {set i 0} {$i < $w} {incr i} { lappend out [vram [expr {($y + $r) * 128 + $x + $i}]] }
  }
  return $out
}
set mono ${MONO ? 1 : 0}
set mono_dump {}
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
set slides_a ${A.slides}
set steps_a ${A.steps}
set marker_a ${A.marker}
set music_a ${A.music}
set intro_active 0
# Music must never drop once the Music node has started it: sample every 0.25 s from t=9.
proc music_watch {} {
  global music_a music_seen_off intro_active result
  if {[rd $music_a] != 1} { incr music_seen_off; puts $result "note  music_active=[rd $music_a] at t=[format %.2f [machine_info time]]" }
  after time 0.25 music_watch
}
set throttle off
set joy_mode "${INPUT}"
set joy 0
set joy1_a ${A.joy1}
set joy2_a ${A.joy2}
if {$joy_mode ne "space"} {
  set jaddr [expr {$joy_mode eq "joy1" ? $joy1_a : $joy2_a}]
  # opcode check: the same address exists in the other banks mapped at #8000
  debug set_bp $jaddr {$joy == 1 && [debug read memory $jaddr] == 0xE6 && [debug read memory [expr {$jaddr + 1}]] == 0x10} { reg A 0 }
}
proc press_intro {} {
  global joy_mode joy
  if {$joy_mode eq "space"} { press } else { set joy 1; after time 0.2 { set ::joy 0 } }
}
set expect_music [expr {"${MUSIC}" ne "none"}]

# The driver reacts to the intro's own "waiting for a press" flag instead of fixed times, so a slower
# BIOS boot or a longer transition only delays the test. k = index of the waiting moment.
set k 0
set started 0
set busy 0
set armed 1
set marker_on 0
set marker_off 0
set marker_px 0

proc finish {} {
  global result fails mono mono_dump
  if {$mono} {
    set f [open "${MONO_DUMP.replace(/\\/g, '/')}" w]
    foreach item $mono_dump { puts $f "[lindex $item 0] [join [lindex $item 1] { }]" }
    close $f
  }
  puts $result [expr {$fails == 0 ? "RESULT PASS" : "RESULT FAIL ($fails)"}]
  close $result
  exit
}
proc timeout {} {
  global result fails k slides_a steps_a marker_a
  puts $result "FAIL  timeout: waiting moment $k never came (slides=[rd $slides_a] steps=[rd $steps_a] marker=[rd $marker_a])"
  incr fails
  finish
}
after time 120 timeout

# Music must never drop once the intro is up (the Music node started it before).
proc music_watch {} {
  global music_a music_seen_off result
  if {[rd $music_a] != 1} { incr music_seen_off; puts $result "note  music_active=[rd $music_a] at t=[format %.2f [machine_info time]]" }
  after time 0.25 music_watch
}

# The presentation before the intro waits for a key: press until the intro shows its first wait.
proc press_presentation {} {
  global started
  if {!$started} { press; after time 1.5 press_presentation }
}
after time 5.5 press_presentation

# The "more" triangle blinks every 16 frames: over ~1.2 s it must be seen drawn (RAM flag and slot-15
# pixels at the corner of the zone) and hidden again.
proc marker_watch {n} {
  global marker_a marker_on marker_off marker_px
  if {[rd $marker_a] == 1} {
    incr marker_on
    if {[nibbles [expr {180*128+116}] 3 15] > 0} { incr marker_px }
  } else { incr marker_off }
  if {$n > 0} { after time 0.05 [list marker_watch [expr {$n - 1}]] }
}

proc done_press {} { global busy armed; press_intro; set busy 0; set armed 0 }

proc on_wait {k} {
  global slides_a steps_a marker_a music_a expect_music started music_seen_off marker_on marker_off marker_px
  set slides [rd $slides_a]
  set steps [rd $steps_a]
  if {$k == 0} {
    set started 1
    if {$expect_music} { music_watch }
    check "slide1 step1 reached (slides left=1, steps left=1)" [expr {$slides == 1 && $steps == 1}] "slides=$slides steps=$steps"
    if {$::mono} { lappend ::mono_dump [list img_a [dump_rect 16 8 96 120]] }
    # image dest (32,8) 192x120: the sun (slot 10) lands around pixel (174,39) = byte 87, row 39
    check "image pixels in VRAM (sun, slot 10)" [expr {[nibbles [expr {39*128+80}] 16 10] > 10}] "count=[nibbles [expr {39*128+80}] 16 10]"
    check "typed text in VRAM (slot 15 in the zone rows)" [expr {[nibbles [expr {138*128+8}] 40 15] > 8}] "count=[nibbles [expr {138*128+8}] 40 15]"
    check "music during the intro follows the option (${MUSIC})" [expr {[rd $music_a] == $expect_music}] "music_active=[rd $music_a] expected=$expect_music"
    # the runtime displays 212 lines: the slide colour (slot 1) must reach rows 192..211 too
    check "background fills the 212-line display" [expr {[nibbles [expr {205*128+10}] 20 1] > 30}] "count=[nibbles [expr {205*128+10}] 20 1]"
    marker_watch 24
    after time 1.4 {
      check "'more' marker blinks (drawn and hidden)" [expr {$marker_on > 0 && $marker_off > 0}] "on=$marker_on off=$marker_off"
      check "'more' marker really painted in VRAM" [expr {$marker_px > 0}] "pixel samples=$marker_px"
      done_press
    }
  } elseif {$k == 1} {
    check "slide1 step2 reached (steps left=0)" [expr {$slides == 1 && $steps == 0}] "slides=$slides steps=$steps"
    done_press
  } elseif {$k == 2} {
    check "slide2 step1 reached (slides left=0, steps left=1)" [expr {$slides == 0 && $steps == 1}] "slides=$slides steps=$steps"
    if {$::mono} { lappend ::mono_dump [list img_b [dump_rect 32 40 62 48]] }
    # slide 2 title zone x=64,y=8 -> byte 32, row 8+: custom font glyph pixels in slot 15
    check "custom-font title typed" [expr {[nibbles [expr {10*128+32}] 64 15] > 6}] "count=[nibbles [expr {10*128+32}] 64 15]"
    done_press
  } elseif {$k == 3} {
    check "slide2 last step reached (steps left=0)" [expr {$slides == 0 && $steps == 0}] "slides=$slides steps=$steps"
    check "body text of the last step in VRAM" [expr {[nibbles [expr {102*128+12}] 100 15] > 20}] "count=[nibbles [expr {102*128+12}] 100 15]"
    done_press
    # the last press leaves the intro: the room is loaded and the marker is off
    after time 3 {
      check "intro finished, marker cleared" [expr {[rd $marker_a] == 0}] "marker=[rd $marker_a]"
      check "game room drawn after the intro (not the slide colour)" [expr {[nibbles [expr {14*128+8}] 40 2] < 20}] "count=[nibbles [expr {14*128+8}] 40 2]"
      check "music after the intro follows the option (${MUSIC})" [expr {[rd $music_a] == $expect_music}] "music_active=[rd $music_a] expected=$expect_music"
      if {$expect_music} { check "music never dropped" [expr {$music_seen_off == 0}] "dropped=$music_seen_off samples" }
      finish
    }
  }
}

proc poll {} {
  global marker_a k busy armed
  set m [rd $marker_a]
  if {$m == 0} { set armed 1 }
  if {!$busy && $armed && $m == 1} {
    set busy 1
    set armed 0
    set n $k
    incr k
    on_wait $n
  }
  after time 0.05 poll
}
debug write memory $marker_a 0
after time 5 poll
`;
const tclPath = path.join(DIR, 'intro_smoke.tcl');
fs.writeFileSync(tclPath, tcl);
fs.rmSync(RESULT, { force: true });
fs.rmSync(MONO_DUMP, { force: true });

console.log('3/4 running OpenMSX ...');
const proc = spawnSync(OPENMSX, [
  '-machine', 'C-BIOS_MSX2+_JP', '-cart', ROM.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/'),
], { cwd: ROOT, timeout: 240000, stdio: 'pipe' });
if (!fs.existsSync(RESULT)) {
  console.error(`OpenMSX produced no result file (exit ${proc.status}).\n${proc.stderr?.toString().slice(0, 1500)}`);
  process.exit(2);
}
console.log('4/4 result:\n');
const text = fs.readFileSync(RESULT, 'utf8');
console.log(text);
let pass = /RESULT PASS/.test(text);
if (MONO) {
  const cmp = spawnSync('npx', ['tsx', 'scripts/compare_msx2_intro_mono_vram.ts', FIXTURE, MONO_DUMP], { cwd: ROOT, stdio: 'pipe', shell: true });
  console.log(`${cmp.stdout?.toString() ?? ''}${cmp.stderr?.toString() ?? ''}`.trim());
  if (cmp.status !== 0) pass = false;
}
process.exit(pass ? 0 : 1);
