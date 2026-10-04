#!/usr/bin/env node
/**
 * The Intro node played BETWEEN two zones (WorldLink -> Intro -> WorldLink) in OpenMSX.
 *
 *   node scripts/check_msx2_intro_midgame.mjs
 *
 * Forces the first zone to end (bitmap_game_over_flag = 1, exactly what leaving a world does),
 * lets the intro play, and compares the machine before and after: hearts, screen index, the
 * room drawn on page 0, the VDP palette, sprites on, music still playing and the game loop
 * alive again. Prints what changed so the semantics are visible, not only pass/fail.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'test', 'msx2-intro');
const FIXTURE = path.join(DIR, 'fixture_intro_midgame.json');
const ROM = path.join(DIR, 'midgame.rom');
const SYM = path.join(DIR, 'midgame.sym');
const RESULT = path.join(DIR, 'intro_midgame_result.txt');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';

const MUSIC = process.env.INTRO_MUSIC || 'track'; // track | none | keep
const node = (script, args, env = {}) => execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', script), ...args],
  { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28, env: { ...process.env, ...env } });
node('build_msx2_intro_test_project.mjs', [], { INTRO_MIDGAME: '1', INTRO_MUSIC: MUSIC });
node('measure_bitmap_rom_budget.mjs', [FIXTURE, '--keep', ROM, '--sym', SYM]);

const sym = new Map();
for (const line of fs.readFileSync(SYM, 'utf8').split('\n')) {
  const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
  if (m) sym.set(m[1], parseInt(m[2], 16));
}
const a = name => { if (!sym.has(name)) throw new Error(`symbol ${name} missing`); return `0x${sym.get(name).toString(16).toUpperCase().padStart(4, '0')}`; };

const tcl = `
set result [open "${RESULT.replace(/\\/g, '/')}" w]
set fails 0
proc rd {a} { return [debug read memory $a] }
proc note {msg} { global result; puts $result "note  $msg"; flush $result }
proc check {name cond detail} {
  global result fails
  if {$cond} { puts $result "ok    $name" } else { puts $result "FAIL  $name ($detail)"; incr fails }
  flush $result
}
proc room_sum {} {
  # rows 24..189 of page 0 (below the HUD band, above the letterbox): the drawn room
  set blk [debug read_block "physical VRAM" [expr {24*128}] [expr {166*128}]]
  binary scan $blk c* bytes
  set s 0
  foreach b $bytes { set s [expr {($s * 31 + ($b & 255)) & 0xFFFFFF}] }
  return $s
}
proc palette {} {
  set l {}
  for {set i 0} {$i < 32} {incr i} { lappend l [debug read "VDP palette" $i] }
  return $l
}
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
set marker_a ${a('bitmap_intro_marker')}
set over_a ${a('bitmap_game_over_flag')}
set hp_a ${a('player_health')}
set scr_a ${a('current_screen_index')}
set music_a ${a('music_active')}
set slides_a ${a('bitmap_intro_slides')}
set intro_seen 0
set music_off 0
set throttle_dummy 0
set throttle off
set music_mode "${MUSIC}"
set music_on_after_intro 0

after time 6 { press }
proc music_watch {} {
  global music_a music_off
  if {[rd $music_a] != 1} { incr music_off }
  after time 0.25 music_watch
}
after time [expr {$music_mode eq "track" ? 9 : 100}] { music_watch }

# 1. zone A running: remember the world, then leave it
after time 12 {
  global before_room before_pal before_hp before_scr
  set before_room [room_sum]
  set before_pal [palette]
  set before_hp [rd $hp_a]
  set before_scr [rd $scr_a]
  note "before: hearts=$before_hp screen=$before_scr room_sum=$before_room"
  debug write memory $hp_a 3    ;# zone A ends with 3 hearts: does the next WorldLink keep them?
  note "hearts set to 3 just before leaving zone A"
  debug write memory $over_a 1
}
# 2. while the intro shows, press SPACE whenever it is waiting (the "more" marker is on)
proc auto_press {} {
  global marker_a intro_seen
  if {[rd $marker_a] == 1} { incr intro_seen; press; after time 0.6 auto_press } else { after time 0.1 auto_press }
}
after time 12.3 { auto_press }

# 3. zone B running again
after time 34 {
  global before_room before_pal before_hp before_scr
  set room [room_sum]
  set pal [palette]
  set sprites_on [expr {([debug read "VDP regs" 8] & 2) == 0}]
  note "after:  hearts=[rd $hp_a] screen=[rd $scr_a] room_sum=$room intro_presses=$intro_seen"
  check "the intro ran between the zones (4 steps)" [expr {$intro_seen >= 4}] "waits=$intro_seen"
  check "game loop is back (game-over flag cleared)" [expr {[rd $over_a] == 0}] "flag=[rd $over_a]"
  check "same start room after the second WorldLink" [expr {[rd $scr_a] == $before_scr}] "before=$before_scr after=[rd $scr_a]"
  check "room on page 0 identical to zone A's start room" [expr {$room == $before_room}] "before=$before_room after=$room"
  check "game palette restored (slide palette gone)" [expr {$pal == $before_pal}] "differs"
  check "sprites re-enabled" $sprites_on "R#8=[debug read "VDP regs" 8]"
  # track: the intro starts the song -> never off after zone A ends. none/keep: leaving a zone silences it and
  # neither option restarts it -> off after the zone ended (the intro left it alone / silenced it).
  if {$music_mode eq "track"} {
    check "intro music option: song keeps playing through the intermission" [expr {$music_off == 0 && [rd $music_a] == 1}] "off_samples=$music_off active=[rd $music_a]"
  } else {
    check "music option '$music_mode': silent after leaving the zone" [expr {[rd $music_a] == 0}] "active=[rd $music_a]"
  }
  check "intro scratch flag cleared" [expr {[rd $marker_a] == 0}] "marker=[rd $marker_a]"
  puts $result [expr {$fails == 0 ? "RESULT PASS" : "RESULT FAIL ($fails)"}]
  close $result
  exit
}
`;
const tclPath = path.join(DIR, 'intro_midgame.tcl');
fs.writeFileSync(tclPath, tcl);
fs.rmSync(RESULT, { force: true });
const proc = spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', '-cart', ROM.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/')],
  { cwd: ROOT, timeout: 300000, stdio: 'pipe' });
if (!fs.existsSync(RESULT)) { console.error(`no result file (exit ${proc.status})\n${proc.stderr?.toString().slice(0, 1200)}`); process.exit(2); }
const text = fs.readFileSync(RESULT, 'utf8');
console.log(text);
process.exit(/RESULT PASS/.test(text) ? 0 : 1);
