#!/usr/bin/env node
// Boss smoothness probe (trampicones report, Jordi 2026-09-12).
// Boots a boss smoke ROM the same way the official path-phase check does
// (SPACE at 6/8/10s to pass the intro, boss_intro_state=0 at t=12 to skip the
// Room Lock walk-in), then samples boss_x/boss_y/blits on EVERY rendered frame
// via `after frame`. `pokehp` mirrors the official check's damage poke so the
// phase route swap is exercised. A quantised body update shows position deltas
// of the whole step every Nth frame; smooth motion shows {-1,0,+1} with a blit
// on every moving frame.
// Usage: node test/msx2-boss/build_boss_smooth.mjs <stem> [seconds] [pokehp]
import fs from 'fs';

const stem = process.argv[2] || 'boss_smooth_pre';
const seconds = Number(process.argv[3] || 33);
const pokeHp = process.argv[4] === 'pokehp';
const sym = fs.readFileSync(`server/temp/${stem}.sym`, 'utf8');
const addr = (label) => {
  const m = sym.match(new RegExp(`^${label}: equ ([0-9A-F]+)H`, 'm'));
  if (!m) throw new Error(`symbol not found: ${label}`);
  return parseInt(m[1], 16);
};
const h = (n) => '0x' + n.toString(16).toUpperCase();
const A = {
  bossX: addr('boss_x'),
  bossY: addr('boss_y'),
  bossHp: addr('boss_hp'),
  pathIdx: addr('boss_path_idx'),
  intro: addr('boss_intro_state'),
  launch: addr('bitmap_boss_launch_cmd'),
};
const freeze = process.argv[4] === 'freeze';
const protect = process.argv[5] === 'protect';
const has = (label) => new RegExp(`^${label}: equ `, 'm').test(sym);
const extra = [
  ['hp=', A.bossHp], ['act=', addr('boss_active')], ['intro=', A.intro],
  ['ph=', addr('player_health')],
].concat(freeze ? [
  ['sdx=', has('boss_step_dx') ? addr('boss_step_dx') : null],
  ['sdy=', has('boss_step_dy') ? addr('boss_step_dy') : null],
  ['rx=', has('boss_step_rx') ? addr('boss_step_rx') : null],
  ['ry=', has('boss_step_ry') ? addr('boss_step_ry') : null],
  ['pw=', addr('boss_path_wait')], ['cur=', addr('boss_path_cur')],
  ['it=', has('boss_int_tick') ? addr('boss_int_tick') : null],
].filter(([, a]) => a !== null) : []);
// Player protection (authorized by Codex-036): keep the damage-invulnerability
// timer pinned so the measurement window cannot die of contact/bullet damage.
// Documented mechanism; same fixture PRE/POST; the hp poke stays at t=26.
const invulnAddr = protect && has('player_invuln') ? addr('player_invuln') : null;

const tcl = `# Boss smoothness probe: ${stem}, sampling t=13..${seconds}s${pokeHp ? ', hp poke at t=26' : ''}
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/smooth_${stem}.txt"
set f [open $log_path "w"]
proc logline {s} { puts $::f $s; flush $::f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
set X ${h(A.bossX)}
set Y ${h(A.bossY)}
set frame 0
set blits 0
debug set_bp ${h(A.launch)} {} { incr ::blits; debug cont }
foreach t {6 8 10} {
  after time $t "keymatrixdown 8 0x01"
  after time [expr {\$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory ${h(A.intro)} 0 }
${pokeHp ? 'after time 26 { debug write memory ' + h(A.bossHp) + ' 10; logline "POKE hp=10" }\n' : ''}after time 13 { logline "START x=[mem8 $X] y=[mem8 $Y] hp=[mem8 ${h(A.bossHp)}]" }
proc watch {} {
  incr ::frame
  ${invulnAddr ? `debug write memory ${h(invulnAddr)} 255 ; player protection: invuln pinned` : ''}
  if {$::frame >= 30} {
    logline "F $::frame [mem8 $::X] [mem8 $::Y] idx=[mem8 ${h(A.pathIdx)}] blits=$::blits${extra.map(([n, a]) => ` ${n}[mem8 ${h(a)}]`).join('')}"
  }
  if {$::frame >= ${seconds} * 60 - 780} { finish }
  after frame watch
}
after frame watch
proc finish {} {
  logline "TOTAL frames=$::frame bodyBlits=$::blits"
  logline "PROBE-DONE"
  close $::f
  exit
}
after time ${seconds + 20} { logline "VERDICT: FAIL timeout frames=$::frame"; close $::f; exit }
logline "smoothness start ${stem} bossX=${h(A.bossX)} launch=${h(A.launch)}"
`;
fs.writeFileSync(`test/msx2-boss/smooth_${stem}.tcl`, tcl);
console.log(`smooth_${stem}.tcl: sample t=13..${seconds}s${pokeHp ? ' +hp poke' : ''} bossX=${h(A.bossX)} launch=${h(A.launch)}`);
