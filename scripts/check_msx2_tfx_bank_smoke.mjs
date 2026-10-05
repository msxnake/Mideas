#!/usr/bin/env node
/**
 * OpenMSX smoke of the SCREEN 5 transition engine placement (docs/msx/MSX2_TFX_BANK_PLAN.md, F1).
 *
 * Boots the small cases A-D of scripts/build_tfx_bank_reference.mjs (the ROMs it wrote under --dir) and, for each one
 * that carries the engine, measures with breakpoints (never screenshots):
 *   - bitmap_tfx_play is reached, from which call site, and RETURNS to it with SP balanced (SP_return == SP_entry + 2);
 *   - the mapper state (P2 = #8000, P3 = #A000) at entry and at return is the resident one (banks 2 / 3). The mapper is
 *     read by comparing 2 x 16 bytes of the live window with the same bytes of every bank of the ROM file, so the probe
 *     refuses to run when the signatures of the banks it must tell apart are not distinct (instrument check);
 *   - AFTER ROMs only (the engine lives in BITMAP_TFX_CODE_BANK): bitmap_tfx_play and bitmap_tfx_frame_wait sit below
 *     #8000, bitmap_tfxb_play runs with P2 = the engine bank, every frame wait is entered with P2 = the engine bank, music_update
 *     (when the ROM has music) is entered with P2 = bank 2 exactly once per wait, and every wait leaves P2 = the engine bank;
 *   - the number of frame waits, HMMV launches and music_update calls inside the transition equals the BEFORE reference
 *     (the manifest.json of --ref), i.e. the engine plays the same plan;
 *   - the game reaches the next node (bitmap_enter_game_loop, or draw_bitmap_end_screen for the dispatcher-after-game case).
 *
 * USAGE
 *   node scripts/check_msx2_tfx_bank_smoke.mjs --dir test/msx2-transition-fx/out/tfxbank_ref            (BEFORE ROMs: invariants only)
 *   node scripts/check_msx2_tfx_bank_smoke.mjs --dir test/msx2-transition-fx/out/tfxbank_new --ref test/msx2-transition-fx/out/tfxbank_ref
 *   --only A_wipe,C_iris,...   subset of case ids          --keep   keep the generated TCL / result files (under <dir>/smoke)
 *   --t719                     boot the test719 variants of <dir>/test719 instead (ROMs the script builds from the real project):
 *                              SPACE is pulsed to leave the first presentation, then the same entry / return / bank checks run,
 *                              page 0 of VRAM must be all #00 after the transition and the boot must reach bitmap_intro_run.
 *                              In that project banks 2 and 3 of the ROM differ (the resident image is > 16 KB), so a P2/P3 swap is detected.
 * Exit code 0 = every check held, 1 = a check failed or the instrument could not run.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const slashes = file => file.replace(/\\/g, '/');
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const flag = name => argv.includes(name);
const dir = path.resolve(ROOT, opt('--dir') || 'test/msx2-transition-fx/out/tfxbank_new');
const refDir = opt('--ref') ? path.resolve(ROOT, opt('--ref')) : null;
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const t719 = flag('--t719');
const caseDirName = t719 ? 'test719' : 'cases';
const smokeDir = path.join(dir, 'smoke');
fs.mkdirSync(smokeDir, { recursive: true });

const readSymbols = file => {
  const table = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (m) table.set(m[1], parseInt(m[2], 16));
  }
  return table;
};
const hex4 = value => `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
const sigOf = (rom, bank) => [0, 0x400].map(off => rom.subarray(bank * 0x2000 + off, bank * 0x2000 + off + 16).toString('hex')).join('');

const problems = [];
const results = [];
function check(caseId, name, ok, detail = '') {
  results.push({ caseId, name, ok, detail });
  if (!ok) problems.push(`${caseId}: ${name}${detail ? ` (${detail})` : ''}`);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${caseId}: ${name}${!ok && detail ? ` -- ${detail}` : ''}`);
}

const manifestOf = base => {
  const file = path.join(base, 'manifest.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
};
const refManifest = refDir ? manifestOf(refDir) : null;

const caseIds = fs.readdirSync(path.join(dir, caseDirName)).filter(f => f.endsWith('.rom')).map(f => f.slice(0, -4)).sort()
  .filter(id => !only || only.has(id));

for (const id of caseIds) {
  const romFile = path.join(dir, caseDirName, `${id}.rom`);
  const symFile = path.join(dir, caseDirName, `${id}.sym`);
  if (!fs.existsSync(romFile)) continue; // e.g. test719 variants that did not fit before the move
  const rom = fs.readFileSync(romFile);
  const sym = readSymbols(symFile);
  if (!sym.has('bitmap_tfx_play')) continue; // no engine in this ROM (control / cls / fade_to_black cases)
  const after = sym.has('bitmap_tfxb_play');
  const group = t719 ? 'T' : id[0];
  const musicAddr = sym.has('music_update') ? sym.get('music_update') : null;
  const bankNumber = after ? sym.get('BITMAP_TFX_CODE_BANK') : null;
  const sig2 = sigOf(rom, 2);
  const sig3 = sigOf(rom, 3);
  const sigE = after ? sigOf(rom, bankNumber) : null;

  // ---- instrument check: the signatures must tell the banks apart ----
  // The small cases have a resident image shorter than 16 KB, so ROM banks 2 and 3 are both blank (#FF): they cannot be told
  // apart from each other here (a P2/P3 mix-up would go unseen), but each differs from any bank that holds code or data, which
  // is what matters (the engine bank, a music or data bank mapped by mistake). Reported, not failed.
  if (sig2 === sig3) console.log(`note ${id}: ROM banks 2 and 3 have identical signatures (blank): the P2/P3 check detects a window mapped to any code/data bank, not a 2 <-> 3 swap`);
  check(id, 'instrument: bank 2 differs from the engine bank', !after || sig2 !== sigE, `banks 2/${bankNumber}`);
  check(id, 'instrument: bank 2 differs from bank 0 (code)', sig2 !== sigOf(rom, 0));
  if (after && bankNumber === undefined) { check(id, 'BITMAP_TFX_CODE_BANK symbol present', false); continue; }

  const resultFile = path.join(smokeDir, `${id}.txt`);
  const tclFile = path.join(smokeDir, `${id}.tcl`);
  const need = name => { if (!sym.has(name)) throw new Error(`${id}: symbol ${name} missing`); return hex4(sym.get(name)); };
  // Next node of each chain (scripts/build_tfx_bank_parity_fixtures.mjs): A/C -> WorldLink, B -> SubMenu, D -> End.
  const menuLoop = [...sym.keys()].find(key => key.startsWith('bitmap_flow_menu_loop_'));
  const nextNode = group === 'T' ? need('bitmap_intro_run') : group === 'D' ? need('draw_bitmap_end_screen') : group === 'B' ? need(menuLoop || 'bitmap_flow_menu_loop_') : need('bitmap_enter_game_loop');
  const waitAddr = after ? need('bitmap_tfx_frame_wait') : need('bitmap_tfx_play_wait');
  const waitDoneAddr = after ? need('bitmap_tfx_frame_wait_done') : null;
  // First instruction after the engine's `call bitmap_tfx_frame_wait` (push bc / call = 4 bytes): `pop bc`, opcode #C1.
  // The player is entered through the engine bank, so its bytes are read from the bank in the ROM file.
  const afterWaitAddr = after ? sym.get('bitmap_tfxb_play_wait') + 4 : null;
  if (after) {
    const fileOffset = bankNumber * 0x2000 + (afterWaitAddr - 0x8000);
    check(id, 'instrument: the byte after the frame-wait call inside the engine is `pop bc` (#C1)', rom[fileOffset] === 0xc1 && rom[fileOffset - 4] === 0xc5, `got ${rom[fileOffset]?.toString(16)}`);
  }
  const hmmvAddr = after ? need('bitmap_tfxb_hmmv') : need('bitmap_tfx_hmmv');
  const tcl = [
    `set result [open "${slashes(resultFile)}" w]`,
    'set throttle off',
    'proc note {msg} { global result; puts $result $msg; flush $result }',
    'proc sig {base} { set s {}; foreach off {0 0x400} { for {set i 0} {$i < 16} {incr i} { append s [format %02x [debug read memory [expr {$base + $off + $i}]]] } }; return $s }',
    'set hits 0; set returned 0; set in_play 0; set waits 0; set dones 0; set hmmv 0; set music 0; set finished 0; set next 0',
    'set wait_p2 {}; set done_p2 {}; set music_p2 {}; set engine_p2 {}; set back 0; set back_p2 {}',
    `debug set_bp ${need('bitmap_tfx_play')} {} {`,
    '  if {$::hits == 0} {',
    '    set ::in_play 1',
    '    set ::sp_entry [reg SP]',
    '    set ::caller [peek16 [reg SP]]',
    '    set ::entry_p2 [sig 0x8000]; set ::entry_p3 [sig 0xA000]',
    '    set ::play_hl [reg HL]; set ::play_de [reg DE]',
    '    debug set_bp $::caller {} { if {!$::returned} { set ::returned 1; set ::in_play 0; set ::sp_ret [reg SP]; set ::ret_p2 [sig 0x8000]; set ::ret_p3 [sig 0xA000]; set ::page0_nonzero [string length [string map {"\\x00" ""} [debug read_block VRAM 0 27136]]]; after time 30 finish } }',
    '  }',
    '  incr ::hits',
    '}',
    `debug set_bp ${waitAddr} {} { if {$::in_play} { incr ::waits; lappend ::wait_p2 [sig 0x8000] } }`,
    ...(waitDoneAddr ? [`debug set_bp ${waitDoneAddr} {} { if {$::in_play} { incr ::dones; lappend ::done_p2 [sig 0x8000] } }`] : []),
    ...(afterWaitAddr !== null ? [`debug set_bp ${hex4(afterWaitAddr)} {} { if {$::in_play} { incr ::back; lappend ::back_p2 [sig 0x8000] } }`] : []),
    `debug set_bp ${hmmvAddr} {} { if {$::in_play} { incr ::hmmv } }`,
    ...(after ? [`debug set_bp ${need('bitmap_tfxb_play')} {} { if {$::in_play} { lappend ::engine_p2 [sig 0x8000] } }`] : []),
    ...(musicAddr !== null ? [`debug set_bp ${hex4(musicAddr)} {} { if {$::in_play} { incr ::music; lappend ::music_p2 [sig 0x8000] } }`] : []),
    `debug set_bp ${nextNode} {} { set ::next 1; finish }`,
    'proc uniq {l} { set o {}; foreach x $l { if {[lsearch -exact $o $x] < 0} { lappend o $x } }; return $o }',
    'proc finish {} {',
    '  global finished hits returned waits dones back back_p2 hmmv music next caller sp_entry sp_ret entry_p2 entry_p3 ret_p2 ret_p3 wait_p2 done_p2 music_p2 engine_p2 play_hl play_de page0_nonzero',
    '  if {$finished} { return }',
    '  if {$hits > 0 && !$returned} { return }',
    '  set finished 1',
    '  note "PLAY_HITS $hits"; note "RETURNED $returned"; note "NEXT_NODE $next"',
    '  note "WAITS $waits"; note "DONES $dones"; note "BACK $back"; note "HMMV $hmmv"; note "MUSIC $music"',
    '  if {$hits > 0} { note [format "CALLER 0x%04X" $caller]; note "SP_ENTRY $sp_entry"; note "HL $play_hl"; note "DE $play_de"; note "ENTRY_P2 $entry_p2"; note "ENTRY_P3 $entry_p3" }',
    '  if {$returned && [info exists page0_nonzero]} { note "SP_RET $sp_ret"; note "RET_P2 $ret_p2"; note "RET_P3 $ret_p3"; note "PAGE0_NONZERO $page0_nonzero" }',
    '  note "WAIT_P2 [uniq $wait_p2]"; note "DONE_P2 [uniq $done_p2]"; note "MUSIC_P2 [uniq $music_p2]"; note "ENGINE_P2 [uniq $engine_p2]"; note "BACK_P2 [uniq $back_p2]"',
    '  note "RESULT DONE"',
    '  close $::result',
    '  exit',
    '}',
    ...(group === 'T' ? [
      // test719 shows its first presentation until SPACE is released -> pressed -> released: pulse the key until the transition has run
      'proc pulse {} { if {$::hits == 0 && !$::finished} { keymatrixdown 8 1; after time 0.4 { keymatrixup 8 1 }; after time 1.5 pulse } }',
      'after time 2 pulse',
    ] : []),
    ...(group === 'D' ? [
      `proc raise_exit {} { if {$::hits == 0 && !$::finished} { debug write memory ${need('bitmap_gameflow_exit_flag')} 1; after time 1 raise_exit } }`,
      'after time 6 raise_exit',
    ] : []),
    'after time 90 { note "TIMEOUT 90s emulated"; set ::returned 1; set ::finished 0; finish }',
  ];
  fs.writeFileSync(tclFile, `${tcl.join('\n')}\n`);
  fs.rmSync(resultFile, { force: true });
  const proc = spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', '-cart', slashes(romFile), '-romtype', 'KonamiSCC', '-script', slashes(tclFile)], { cwd: ROOT, timeout: 180000, stdio: 'pipe' });
  const text = fs.existsSync(resultFile) ? fs.readFileSync(resultFile, 'utf8') : '';
  const field = key => { const m = new RegExp(`^${key} (.*)$`, 'm').exec(text); return m ? m[1].trim() : null; };
  check(id, 'OpenMSX ran the probe to completion', /RESULT DONE/.test(text) && !/TIMEOUT/.test(text), `exit ${proc.status}`);
  if (!/RESULT DONE/.test(text)) continue;

  check(id, 'bitmap_tfx_play reached once and returned', field('PLAY_HITS') === '1' && field('RETURNED') === '1', `hits ${field('PLAY_HITS')} returned ${field('RETURNED')}`);
  const spEntry = Number(field('SP_ENTRY'));
  const spRet = Number(field('SP_RET'));
  check(id, 'SP balanced across bitmap_tfx_play (return = entry + 2)', spRet === spEntry + 2, `entry ${spEntry} return ${spRet}`);
  check(id, 'P2 = bank 2 and P3 = bank 3 at entry', field('ENTRY_P2') === sig2 && field('ENTRY_P3') === sig3, `P2 ${field('ENTRY_P2')?.slice(0, 16)} P3 ${field('ENTRY_P3')?.slice(0, 16)}`);
  check(id, 'P2 = bank 2 and P3 = bank 3 at return', field('RET_P2') === sig2 && field('RET_P3') === sig3, `P2 ${field('RET_P2')?.slice(0, 16)} P3 ${field('RET_P3')?.slice(0, 16)}`);
  check(id, group === 'T' ? 'the boot reaches bitmap_intro_run (next node after the transition)' : 'the game reaches the next node after the transition', field('NEXT_NODE') === '1');
  if (group === 'T') check(id, 'VRAM page 0 (rows 0-211) is all #00 after the transition (fill colour 0)', field('PAGE0_NONZERO') === '0', `non-zero bytes: ${field('PAGE0_NONZERO')}`);
  const callerAddr = parseInt(field('CALLER') || '0', 16);
  const below = [...sym.entries()].filter(([, v]) => v >= 0x4000 && v <= callerAddr).sort((a, b) => b[1] - a[1]);
  const callerLabel = below.length ? `${below[0][0]}+${callerAddr - below[0][1]}` : null;
  const refProbe = refManifest?.artifacts?.[id]?.probe;
  check(id, `caller is the expected call site (${callerLabel})`, callerLabel !== null && (!refProbe || refProbe.callerNearestLabel === callerLabel), refProbe ? `reference ${refProbe.callerNearestLabel}` : '');

  const waits = Number(field('WAITS'));
  const hmmv = Number(field('HMMV'));
  const music = Number(field('MUSIC'));
  const expectMusic = musicAddr !== null && group !== 'A' && group !== 'D' ? waits : 0;
  check(id, `music_update called once per wait (${music} calls / ${waits} waits)`, musicAddr === null ? music === 0 : music === expectMusic && waits > 0);
  if (refProbe) {
    const ref = refProbe;
    check(id, `frame waits = BEFORE reference (${ref.waitIterations})`, waits === ref.waitIterations, `${waits}`);
    check(id, `HMMV launches = BEFORE reference (${ref.hmmvCalls})`, hmmv === ref.hmmvCalls, `${hmmv}`);
    check(id, `music_update calls = BEFORE reference (${ref.musicUpdatesInsidePlay})`, music === ref.musicUpdatesInsidePlay, `${music}`);
  }
  if (after) {
    check(id, 'bitmap_tfx_play and bitmap_tfx_frame_wait are below #8000', sym.get('bitmap_tfx_play') < 0x8000 && sym.get('bitmap_tfx_frame_wait') < 0x8000, `${hex4(sym.get('bitmap_tfx_play'))} ${hex4(sym.get('bitmap_tfx_frame_wait'))}`);
    check(id, 'bitmap_tfxb_* labels sit inside the bank window #8000-#9FFF', [...sym.entries()].filter(([k]) => k.startsWith('bitmap_tfxb_')).every(([, v]) => v >= 0x8000 && v < 0xA000));
    // Glass lists a bank-resident label at its bank-window address (#8000-#9FFF), so the .sym cannot tell a table that lives in the
    // engine bank from one in the resident image. The BYTES can: each table must sit in the engine bank of the ROM file, and
    // must not appear anywhere in the resident window (ROM file offsets 0-#7FFF = #4000-#BFFF).
    const asmText = fs.readFileSync(path.join(dir, caseDirName, `${id}.asm`), 'utf8');
    const tableSyms = [...sym.entries()].filter(([k]) => /^bitmap_tfx_table_\d+$/.test(k));
    check(id, 'at least one fill table is emitted', tableSyms.length > 0);
    for (const [name, addr] of tableSyms) {
      const m = new RegExp(`^${name}:[^\n]*\n((?:    DB [^\n]*\n){1,2})`, 'm').exec(asmText);
      const expected = m ? Buffer.from([...m[1].matchAll(/#([0-9A-F]{2})/g)].map(x => parseInt(x[1], 16))) : null;
      const inBank = expected && rom.subarray(bankNumber * 0x2000 + (addr - 0x8000), bankNumber * 0x2000 + (addr - 0x8000) + expected.length).equals(expected);
      const inResident = expected ? rom.subarray(0, 0x8000).indexOf(expected) : -2;
      check(id, `${name} (${hex4(addr)}) is in the engine bank and nowhere in the resident window #4000-#BFFF`, Boolean(inBank) && inResident === -1, `inBank ${Boolean(inBank)} residentOffset ${inResident}`);
      check(id, `${name} lies in the bank window #8000-#9FFF`, addr >= 0x8000 && addr < 0xa000);
    }
    // The TS size check (msx2BitmapTfxBankGenerator.ts) budgets BITMAP_TFX_CODE_BYTES_ESTIMATE bytes of player code in front of the tables:
    // if Glass produces more, only the generic "Negative initial size" would remain for a project near the limit.
    const estimate = Number(/BITMAP_TFX_CODE_BYTES_ESTIMATE = (\d+)/.exec(fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapTfxBankGenerator.ts'), 'utf8'))?.[1]);
    const playerBytes = Math.min(...tableSyms.map(([, addr]) => addr)) - 0x8000;
    check(id, `player code (${playerBytes} B) fits the TS estimate (${estimate} B)`, Number.isFinite(estimate) && playerBytes > 0 && playerBytes <= estimate);
    check(id, 'bitmap_tfxb_play runs with P2 = engine bank', field('ENGINE_P2') === sigE, `${field('ENGINE_P2')?.slice(0, 16)}`);
    check(id, 'every frame wait is entered with P2 = engine bank', field('WAIT_P2') === sigE, `${field('WAIT_P2')?.slice(0, 16)}`);
    check(id, 'every frame wait is done (vblank reached) with P2 = bank 2, before the engine bank comes back', field('DONE_P2') === sig2 && Number(field('DONES')) === waits, `dones ${field('DONES')} ${field('DONE_P2')?.slice(0, 16)}`);
    check(id, 'every frame wait returns into the engine with P2 = engine bank', field('BACK_P2') === sigE && Number(field('BACK')) === waits, `back ${field('BACK')} ${field('BACK_P2')?.slice(0, 16)}`);
    if (musicAddr !== null && music > 0) check(id, 'music_update is entered with P2 = bank 2', field('MUSIC_P2') === sig2, `${field('MUSIC_P2')?.slice(0, 16)}`);
  }
}

const failed = results.filter(r => !r.ok).length;
const caseCount = new Set(results.map(r => r.caseId)).size;
console.log(`\n${failed ? 'RESULT FAIL' : 'RESULT PASS'}: ${results.length - failed}/${results.length} checks over ${caseCount} case(s)${failed ? `; ${problems.join('; ')}` : ''}`);
if (!flag('--keep')) {
  for (const f of fs.readdirSync(smokeDir)) fs.rmSync(path.join(smokeDir, f), { force: true });
  fs.rmSync(smokeDir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
