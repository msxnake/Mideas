#!/usr/bin/env node
/**
 * Palette fades of the Intro in OpenMSX.
 *
 *   node scripts/check_msx2_intro_fade.mjs
 *
 * The fixture makes slide 1 fade in and out and slide 2 fade in. The VDP palette is sampled every
 * 20 ms (emulated) together with the interpreter's "waiting" flag; SPACE is pressed whenever the
 * intro waits for it. From the brightness series the test checks three ramps in order:
 * up (slide 1 in), down (slide 1 out), up (slide 2 in), each with several intermediate steps that
 * start or end at black, and that the slide shows at its authored brightness while waiting.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'test', 'msx2-intro');
const FIXTURE = path.join(DIR, 'fixture_intro.json');
const ROM = path.join(DIR, 'fade.rom');
const SYM = path.join(DIR, 'fade.sym');
const SAMPLES = path.join(DIR, 'intro_fade_samples.txt');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';

const node = (script, args, env = {}) => execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', script), ...args],
  { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28, env: { ...process.env, ...env } });
node('build_msx2_intro_test_project.mjs', [], { INTRO_FADE: '1' });
node('measure_bitmap_rom_budget.mjs', [FIXTURE, '--keep', ROM, '--sym', SYM]);

const sym = new Map();
for (const line of fs.readFileSync(SYM, 'utf8').split('\n')) {
  const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
  if (m) sym.set(m[1], parseInt(m[2], 16));
}
const marker = `0x${sym.get('bitmap_intro_marker').toString(16)}`;

const tcl = `
set out [open "${SAMPLES.replace(/\\/g, '/')}" w]
set marker_a ${marker}
proc bright {} {
  set blk [debug read_block "VDP palette" 0 32]
  binary scan $blk c* bytes
  set s 0
  for {set i 0} {$i < 16} {incr i} {
    set rb [expr {[lindex $bytes [expr {2*$i}]] & 255}]
    set g [expr {[lindex $bytes [expr {2*$i+1}]] & 255}]
    incr s [expr {(($rb >> 4) & 7) + ($rb & 7) + ($g & 7)}]
  }
  return $s
}
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
proc sample {} {
  global out marker_a
  puts $out "[format %.3f [machine_info time]] [bright] [debug read memory $marker_a]"
  after time 0.02 sample
}
proc auto_press {} {
  global marker_a
  if {[debug read memory $marker_a] == 1} { press; after time 0.6 auto_press } else { after time 0.1 auto_press }
}
set throttle off
after time 6 { press }
after time 5 { sample }
after time 6.5 { auto_press }
after time 40 { close $out; exit }
`;
const tclPath = path.join(DIR, 'intro_fade.tcl');
fs.writeFileSync(tclPath, tcl);
fs.rmSync(SAMPLES, { force: true });
const proc = spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', '-cart', ROM.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/')],
  { cwd: ROOT, timeout: 300000, stdio: 'pipe' });
if (!fs.existsSync(SAMPLES)) { console.error(`no samples (exit ${proc.status})\n${proc.stderr?.toString().slice(0, 800)}`); process.exit(2); }

const rows = fs.readFileSync(SAMPLES, 'utf8').trim().split('\n').map(l => l.split(' ').map(Number));
// brightness while the intro waits = the authored slide palette
const waiting = rows.filter(r => r[2] === 1).map(r => r[1]);
const full = Math.max(...waiting);
// collapse repeats, then find monotone ramps that touch black
const series = rows.map(r => r[1]).filter((v, i, a) => i === 0 || v !== a[i - 1]);
const ramps = [];
let i = 0;
while (i < series.length - 1) {
  const dir = Math.sign(series[i + 1] - series[i]);
  if (dir === 0) { i++; continue; }
  let j = i;
  while (j < series.length - 1 && Math.sign(series[j + 1] - series[j]) === dir) j++;
  const run = series.slice(i, j + 1);
  // level 0 (pure black) lasts less than one 20 ms sample when fading in, so "near black" = level 1 or less
  const nearBlack = v => v <= full / 6;
  const touchesBlack = dir > 0 ? nearBlack(run[0]) : nearBlack(run[run.length - 1]);
  if (run.length >= 5 && touchesBlack) ramps.push({ dir: dir > 0 ? 'up' : 'down', steps: run.length, from: run[0], to: run[run.length - 1] });
  i = j;
}
const fails = [];
const order = ramps.map(r => r.dir).join(',');
if (!/^up,down,up/.test(order)) fails.push(`expected ramps up,down,up (fade in, out, in); saw "${order || 'none'}"`);
for (const r of ramps.slice(0, 3)) {
  if (r.dir === 'up' && r.to !== full) fails.push(`a fade in ends at ${r.to}, not at the authored brightness ${full}`);
  if (r.dir === 'down' && r.from !== full) fails.push(`a fade out starts at ${r.from}, not at the authored brightness ${full}`);
}
console.log(`samples=${rows.length} authored brightness=${full} ramps=${JSON.stringify(ramps.slice(0, 4))}`);
console.log(fails.length ? `RESULT FAIL\n - ${fails.join('\n - ')}` : 'RESULT PASS (fade in, fade out, fade in; all reach black and the authored brightness)');
process.exit(fails.length ? 1 : 0);
