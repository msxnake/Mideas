#!/usr/bin/env node
/**
 * Transition FX leaves its picture on VRAM page 1 (the interpreter composes page 0 from it). The first room change of the game
 * composes the next room on page 1 and flips to it, so whatever the effect left there must be repainted entirely
 * (docs/msx/MSX2_TRANSITION_FX_F0.md risk 3: "probar una transición de sala justo después de una presentación con efecto").
 *
 *   node scripts/check_msx2_transition_fx_room_change.mjs
 *
 * Builds the same project twice (scripts/build_msx2_transition_fx_test_project.ts): WITH the boot effect and WITHOUT it. Each ROM is
 * run in OpenMSX to the game loop, the player is pushed through the west edge and, once the new room is on screen, the 192 rows
 * of the game band (rows 20..211) of the DISPLAYED page are dumped, both before and after the change. The two ROMs must show
 * byte-identical bands in both rooms: no pixel of the effect picture survives, whichever page the room ends up on.
 *
 * Exit code 0 = PASS. Everything is read from VRAM / RAM (never from screenshots).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'test', 'msx2-transition-fx', 'out');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const BAND_ROW0 = 20;
const BAND_ROWS = 192;

const run = (cmd, args, label) => {
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    throw new Error(`${label} failed:\n${error.stdout || ''}${error.stderr || ''}`.slice(0, 3000));
  }
};

console.log('1/4 building the two projects (with / without the effect) ...');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const built = spawnSync(`${npx} tsx scripts/build_msx2_transition_fx_test_project.ts`, [], { cwd: ROOT, stdio: 'pipe', shell: true, maxBuffer: 1 << 28 });
if (built.status !== 0) { console.error(`fixture build failed:\n${built.stdout}${built.stderr}`.slice(0, 3000)); process.exit(2); }

const variants = [
  { tag: 'with', project: path.join(DIR, 'fixture_fx.json') },
  { tag: 'without', project: path.join(DIR, 'fixture_plain.json') },
];
const dumps = {};
const facts = {};
for (const variant of variants) {
  const asm = path.join(DIR, `room_${variant.tag}.asm`);
  const rom = path.join(DIR, `room_${variant.tag}.rom`);
  const symFile = path.join(DIR, `room_${variant.tag}.sym`);
  console.log(`2/4 ${variant.tag}: generating + assembling ...`);
  run(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), variant.project, '--asm', asm, '--sym', symFile, '--keep', rom], `ROM build (${variant.tag})`);
  const sym = new Map();
  for (const line of fs.readFileSync(symFile, 'utf8').split('\n')) {
    const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (m) sym.set(m[1], parseInt(m[2], 16));
  }
  const addr = name => {
    if (!sym.has(name)) throw new Error(`symbol ${name} missing from ${symFile}`);
    return `0x${sym.get(name).toString(16).toUpperCase().padStart(4, '0')}`;
  };
  const resultPath = path.join(DIR, `room_${variant.tag}_result.txt`);
  const dumpBefore = path.join(DIR, `room_${variant.tag}_before.bin`);
  const dumpAfter = path.join(DIR, `room_${variant.tag}_after.bin`);
  const dumpHidden = path.join(DIR, `room_${variant.tag}_hidden_before.bin`);
  const hasFx = variant.tag === 'with';
  if (hasFx && !sym.has('bitmap_fx_run')) throw new Error('the "with" ROM carries no effect');
  if (!hasFx && sym.has('bitmap_fx_run')) throw new Error('the "without" ROM still carries the effect');
  const tcl = `
set result [open "${resultPath.replace(/\\/g, '/')}" w]
proc out {k v} { global result; puts $result "$k $v"; flush $result }
proc rd {a} { return [debug read memory $a] }
proc dump {path blk} { set f [open $path wb]; puts -nonewline $f $blk; close $f }
set throttle off
set scr_a ${addr('current_screen_index')}
set page_a ${addr('bitmap_displayed_page')}
set px_a ${addr('player_x')}
set started 0
set scr0 -1
proc press {} { keymatrixdown 8 0x01; after time 0.25 { keymatrixup 8 0x01 } }
proc finish {} { out DONE 1; close $::result; exit }
after time 120 { out TIMEOUT "started=$::started scr=[rd $::scr_a]"; finish }

# the displayed page's game band (rows ${BAND_ROW0}..${BAND_ROW0 + BAND_ROWS - 1}); page n lives at VRAM n * #8000
proc band {path} {
  set page [rd $::page_a]
  dump $path [debug read_block "physical VRAM" [expr {$page * 32768 + ${BAND_ROW0} * 128}] [expr {${BAND_ROWS} * 128}]]
  return $page
}
proc probe_end {} {
  out SCREEN_AFTER [rd $::scr_a]
  out PAGE_AFTER [band "${dumpAfter.replace(/\\/g, '/')}"]
  finish
}
proc probe_poll {} {
  if {[rd $::scr_a] != $::scr0} {
    keymatrixup 8 0x10
    out T_CHANGED [format %.3f [machine_info time]]
    after time 2.5 probe_end
  } else {
    after time 0.05 probe_poll
  }
}
proc probe_begin {} {
  set ::scr0 [rd $::scr_a]
  out SCREEN_BEFORE $::scr0
  out PAGE_BEFORE [band "${dumpBefore.replace(/\\/g, '/')}"]
  # the HIDDEN page: for the ROM with the effect it still holds the effect's picture (positive control of this probe)
  dump "${dumpHidden.replace(/\\/g, '/')}" [debug read_block "physical VRAM" [expr {(1 - [rd $::page_a]) * 32768 + ${BAND_ROW0} * 128}] [expr {${BAND_ROWS} * 128}]]
  debug write memory $::px_a 6
  keymatrixdown 8 0x10
  after time 0.05 probe_poll
}
${hasFx ? `# the effect ends in "wait for a key": release first, then press
debug set_bp ${addr('bitmap_fx_op_waitkey')} {[debug read memory ${addr('bitmap_fx_op_waitkey')}] == 0x0E} { after time 0.2 { press } }
` : ''}debug set_bp ${addr('bitmap_enter_game_loop')} {} {
  if {!$::started} { set ::started 1; after time 1.0 probe_begin }
}
`;
  const tclPath = path.join(DIR, `room_${variant.tag}.tcl`);
  fs.writeFileSync(tclPath, tcl);
  fs.rmSync(resultPath, { force: true });
  console.log(`3/4 ${variant.tag}: running OpenMSX ...`);
  spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', '-cart', rom.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/')],
    { cwd: ROOT, timeout: 240000, stdio: 'pipe' });
  if (!fs.existsSync(resultPath)) { console.error(`OpenMSX produced no result file (${variant.tag})`); process.exit(2); }
  const kv = new Map();
  for (const line of fs.readFileSync(resultPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(\S+)\s+(.*)$/);
    if (m) kv.set(m[1], m[2].trim());
  }
  facts[variant.tag] = kv;
  dumps[variant.tag] = {
    before: fs.existsSync(dumpBefore) ? fs.readFileSync(dumpBefore) : null,
    after: fs.existsSync(dumpAfter) ? fs.readFileSync(dumpAfter) : null,
    hidden: fs.existsSync(dumpHidden) ? fs.readFileSync(dumpHidden) : null,
  };
}

console.log('4/4 comparing:');
const failures = [];
const check = (name, ok, detail) => { console.log(`    ${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : ` (${detail})`}`); if (!ok) failures.push(name); };
const differences = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
for (const tag of ['with', 'without']) {
  const kv = facts[tag];
  check(`${tag}: the game ran and the room changed`, kv.has('T_CHANGED') && !kv.has('TIMEOUT') && kv.get('SCREEN_BEFORE') !== kv.get('SCREEN_AFTER'),
    `before=${kv.get('SCREEN_BEFORE')} after=${kv.get('SCREEN_AFTER')} ${kv.get('TIMEOUT') || ''}`);
}
const w = dumps.with;
const wo = dumps.without;
if (w.before && wo.before && w.after && wo.after) {
  const bandBytes = BAND_ROWS * 128;
  check(`both dumps are ${bandBytes} bytes`, [w.before, wo.before, w.after, wo.after].every(d => d.length === bandBytes), `${w.before.length}/${wo.before.length}/${w.after.length}/${wo.after.length}`);
  // positive control: before the change the hidden page 1 DOES hold the effect's picture (it differs from the plain ROM's), so the
  // probe is able to see a leftover; the equality checks below then prove the room change repaints all of it
  const dHidden = w.hidden && wo.hidden ? differences(w.hidden, wo.hidden) : -1;
  check('positive control: the effect leaves its picture on the hidden page 1 (it differs from the plain ROM\'s)', dHidden > 1000, `${dHidden} bytes differ`);
  const dBefore = differences(w.before, wo.before);
  check('first room: the band is identical with and without the effect', dBefore === 0, `${dBefore} bytes differ`);
  const dAfter = differences(w.after, wo.after);
  check('after the room change: the band is identical with and without the effect (no leftover of the effect picture)', dAfter === 0, `${dAfter} bytes differ`);
  check('the room really changed (the band is not the first room any more)', differences(w.before, w.after) > 1000, `${differences(w.before, w.after)} bytes differ`);
  console.log(`    (displayed page before/after: with ${facts.with.get('PAGE_BEFORE')}/${facts.with.get('PAGE_AFTER')}, without ${facts.without.get('PAGE_BEFORE')}/${facts.without.get('PAGE_AFTER')})`);
}
console.log('');
console.log(failures.length ? `RESULT FAIL (${failures.length})` : 'RESULT PASS');
process.exit(failures.length ? 1 : 0);
