#!/usr/bin/env node
/**
 * The SCREEN 5 GameFlow screens keep the music going (Music node -> menu / scroll / text).
 *
 *   node scripts/check_msx2_gameflow_menu_music.mjs [--reuse-build] [--static-only]
 *
 * The song only advances while something calls `music_update`. The gameplay loop does, the menu
 * loop did not: a Music node in front of a SubMenu started the track and then froze it on the
 * first frame of the menu (a held chord), until START entered the world.
 *
 * Six projects are built from test/msx2-lighting/nuts_torchoff.json (2 bitmap rooms, one PT3 track):
 *   - music:         Start -> Music -> SubMenu -> WorldLink -> End
 *   - silent:        the same without the track and the Music node (no music runtime in the ROM)
 *   - music_scroll:  Start -> Music -> TextScroll (pixel-smooth) -> SubMenu -> WorldLink -> End
 *   - silent_scroll: the same without music
 *   - music_trans:   Start -> Presentation -> Transition (boot intro) -> Music -> wipe -> palette flash ->
 *                    SubMenu -> WorldLink -> End (the transition engine runs in the boot intro AND the dispatcher)
 *   - silent_trans:  the same without music
 *
 * Static (ASM): with music the menu loop waits through bitmap_flow_wait_vblank (frame wait + one
 * music_update); without music it still calls bitmap_wait_vblank and no tick routine exists, so
 * ROMs with no music are untouched.
 *
 * Dynamic (OpenMSX, emulated time):
 *   - menu:   the song is ticked ~60 times a second, the sound chip registers keep changing and
 *             START hands the song over to the gameplay loop without stopping it. Checking the RAM
 *             flag alone would pass on a frozen song, so the calls to music_update and the PSG
 *             registers are what is measured.
 *   - scroll: the raster-split scroll ticks the song too, and ticking it costs the scroll no time
 *             (same duration as the silent ROM): the split is timing-critical.
 *   - trans:  the transition engine (fill wipe, palette flash) ticks the song, takes as long as in the
 *             silent ROM, and the boot intro -- which shares the engine and now runs after the music
 *             init -- still reaches the menu with the song playing.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'server', 'temp', 'menu_music');
const SOURCE = path.join(ROOT, 'test', 'msx2-lighting', 'nuts_torchoff.json');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const MENU_ID = 'gf_menu1';
const args = new Set(process.argv.slice(2));

fs.mkdirSync(WORK, { recursive: true });
/** Dispatcher labels of the nodes the transition run measures between, per project. */
const labels = {};

let presentationAsset;
function loadPresentationAsset() {
  if (!presentationAsset) {
    const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-bitmap-intro', 'bitmap_intro_test.json'), 'utf8'));
    presentationAsset = source.assets.find(asset => asset.type === 'msx2presentation');
  }
  return presentationAsset;
}

function buildFixture(name, { music, scroll, trans }) {
  const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const flow = raw.assets.find(asset => asset.type === 'msx2gameflow').data;
  const start = flow.nodes.find(node => node.type === 'Start');
  const world = flow.nodes.find(node => node.type === 'WorldLink');
  const end = flow.nodes.find(node => node.type === 'End');
  const musicNode = flow.nodes.find(node => node.type === 'Music');
  const menu = {
    id: MENU_ID, type: 'SubMenu', position: { x: 600, y: 90 }, title: 'MENU',
    options: [{ id: 'opt_start', text: 'START GAME' }, { id: 'opt_other', text: 'OPTIONS' }],
  };
  const scrollNode = {
    id: 'gf_scroll1', type: 'TextScroll', position: { x: 450, y: 90 }, title: 'CREDITS', scrollMode: 'smooth',
    scrollStepFrames: 18, waitForKey: false, waitFrames: 0,
    text: 'ONE LINE\nTWO LINES\nTHREE LINES\nFOUR LINES\nFIVE LINES\nSIX LINES',
  };
  const presentationNode = { id: 'gf_pres1', type: 'Screen5Presentation', position: { x: 150, y: 90 }, presentationAssetId: loadPresentationAsset().id, waitForKey: false, waitFrames: 20 };
  // t1 follows the presentation directly, so the boot intro plays it (through the shared engine because of framesPerStep).
  const transition = (id, effect, extra) => ({ id, type: 'Transition', position: { x: 300, y: 90 }, effect, durationFrames: 10, ...extra });
  const t1 = transition('gf_t1', 'screen5_wipe', { framesPerStep: 2 });
  const t2 = transition('gf_t2', 'screen5_wipe', { framesPerStep: 2 });
  const t3 = transition('gf_t3', 'palette_flash', { fadeColor: { r: 7, g: 7, b: 7 }, flashCount: 2 });
  if (trans) raw.assets.push(loadPresentationAsset());
  const chain = [start, ...(trans ? [presentationNode, t1] : []), ...(music ? [musicNode] : []), ...(scroll ? [scrollNode] : []), ...(trans ? [t2, t3] : []), menu];
  flow.nodes = [...chain, world, end];
  if (trans) labels[name] = Object.fromEntries(['gf_t2', 'gf_t3', MENU_ID].map(id => [id, `bitmap_gf_node_${flow.nodes.findIndex(node => node.id === id)}`]));
  flow.connections = chain.slice(0, -1).map((node, index) => ({ id: `gfc_chain_${index}`, from: { nodeId: node.id }, to: { nodeId: chain[index + 1].id } }));
  flow.connections.push({ id: 'gfc_menu_start', from: { nodeId: MENU_ID, sourceId: 'opt_start' }, to: { nodeId: world.id } });
  flow.connections.push({ id: 'gfc_world_end', from: { nodeId: world.id }, to: { nodeId: end.id } });
  if (!music) raw.assets = raw.assets.filter(asset => asset.type !== 'track');
  const file = path.join(WORK, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(raw));
  return file;
}

let reuse = args.has('--reuse-build');
function buildRom(name, options) {
  const project = buildFixture(name, options);
  const out = { asm: path.join(WORK, `${name}.asm`), sym: path.join(WORK, `${name}.sym`), rom: path.join(WORK, `${name}.rom`) };
  try {
    execFileSync(process.execPath, [
      '--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), project,
      ...(reuse ? ['--reuse-build'] : []), '--asm', out.asm, '--sym', out.sym, '--keep', out.rom,
    ], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    throw new Error(`${name}: ROM build failed:\n${error.stdout || ''}${error.stderr || ''}`.slice(0, 3000));
  }
  reuse = true; // one tsc build is enough for every project
  return out;
}

const problems = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok   ' : 'FAIL '} ${name}${ok ? '' : ` (${detail})`}`);
  if (!ok) problems.push(name);
};

/** Text of a routine/label block: from `label:` up to the next label at column 0. */
function block(asm, label) {
  const lines = asm.split(/\r?\n/);
  const start = lines.findIndex(line => line === `${label}:`);
  if (start < 0) return undefined;
  let end = start + 1;
  while (end < lines.length && !/^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[end])) end++;
  return lines.slice(start, end).join('\n');
}

const readSymbols = file => {
  const table = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (match) table.set(match[1], parseInt(match[2], 16));
  }
  return table;
};
const addressOf = (table, name) => {
  if (!table.has(name)) throw new Error(`symbol ${name} missing from the .sym`);
  return `0x${table.get(name).toString(16).toUpperCase().padStart(4, '0')}`;
};

function runOpenMsx(rom, tclPath, resultPath) {
  fs.rmSync(resultPath, { force: true });
  const proc = spawnSync(OPENMSX, [
    '-machine', 'C-BIOS_MSX2+_JP', '-cart', rom.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/'),
  ], { cwd: ROOT, timeout: 240000, stdio: 'pipe' });
  if (!fs.existsSync(resultPath)) {
    console.error(`OpenMSX produced no result file (exit ${proc.status}).\n${proc.stderr?.toString().slice(0, 1500)}`);
    process.exit(2);
  }
  return fs.readFileSync(resultPath, 'utf8');
}

console.log('building the music project ...');
const music = buildRom('music', { music: true, scroll: false });
console.log('building the silent project ...');
const silent = buildRom('silent', { music: false, scroll: false });

const musicAsm = fs.readFileSync(music.asm, 'utf8');
const silentAsm = fs.readFileSync(silent.asm, 'utf8');
const loopLabel = `bitmap_flow_menu_loop_${MENU_ID}`;

// ---- static: the ASM ----
const tickRoutine = block(musicAsm, 'bitmap_flow_wait_vblank');
check('music ROM defines bitmap_flow_wait_vblank once', (musicAsm.match(/^bitmap_flow_wait_vblank:/gm) || []).length === 1);
check('the tick routine calls music_update first, then waits for the frame, keeping DE/HL/IX/IY',
  Boolean(tickRoutine) && /push de[\s\S]*push hl[\s\S]*push ix[\s\S]*push iy[\s\S]*call music_update[\s\S]*pop iy[\s\S]*pop ix[\s\S]*pop hl[\s\S]*pop de[\s\S]*jp bitmap_wait_vblank/.test(tickRoutine || ''),
  tickRoutine || 'routine missing');
const initRom = block(musicAsm, 'init_rom') || '';
check('without transitions the boot order is unchanged (music init after the VDP/atlas setup)',
  initRom.indexOf('call music_init_system') > initRom.indexOf('call upload_tileset_atlas') && initRom.indexOf('call upload_tileset_atlas') > 0, initRom.slice(0, 200));
const menuLoop = block(musicAsm, loopLabel) || '';
check('music menu loop waits through bitmap_flow_wait_vblank', /call bitmap_flow_wait_vblank/.test(menuLoop) && !/call bitmap_wait_vblank/.test(menuLoop), menuLoop.slice(0, 120));
for (const label of ['bitmap_flow_menu_wait_release', 'bitmap_flow_wait_key', 'bitmap_flow_wait_key_press', 'bitmap_flow_wait_frames_loop']) {
  const body = block(musicAsm, label) || '';
  check(`music ${label} ticks the song`, /call bitmap_flow_wait_vblank/.test(body) && !/call bitmap_wait_vblank/.test(body), body.slice(0, 100));
}
const silentLoop = block(silentAsm, loopLabel) || '';
check('silent ROM has no tick routine', !/bitmap_flow_wait_vblank/.test(silentAsm));
check('silent menu loop still calls bitmap_wait_vblank', /call bitmap_wait_vblank/.test(silentLoop), silentLoop.slice(0, 120));
check('silent ROM has no music runtime', !/^music_update:/m.test(silentAsm));

console.log('building the scroll projects ...');
const musicScroll = buildRom('music_scroll', { music: true, scroll: true });
const silentScroll = buildRom('silent_scroll', { music: false, scroll: true });
const scrollAsm = fs.readFileSync(musicScroll.asm, 'utf8');
check('smooth scroll frame loop ticks the song (perFrameAsm)', /call music_update/.test(block(scrollAsm, 'bitmap_vs_run_frame') || ''), (block(scrollAsm, 'bitmap_vs_run_frame') || 'bitmap_vs_run_frame missing').slice(0, 120));
check('silent smooth scroll has no music call', !/call music_update/.test(fs.readFileSync(silentScroll.asm, 'utf8')));

console.log('building the transition projects ...');
const musicTrans = buildRom('music_trans', { music: true, trans: true });
const silentTrans = buildRom('silent_trans', { music: false, trans: true });
const transAsm = fs.readFileSync(musicTrans.asm, 'utf8');
const silentTransAsm = fs.readFileSync(silentTrans.asm, 'utf8');
const transInit = block(transAsm, 'init_rom') || '';
check('music + transitions: the music init is hoisted ahead of the boot intro',
  transInit.indexOf('call music_init_system') > 0 && transInit.indexOf('call music_init_system') < transInit.indexOf('call run_bitmap_intro'), transInit.slice(0, 260));
check('music + transitions: the SFX mixer shadow is set before the music init',
  transInit.indexOf('ld (psg_sfx_r7_c_bits), a') > 0 && transInit.indexOf('ld (psg_sfx_r7_c_bits), a') < transInit.indexOf('call music_init_system'));
check('music + transitions: the music is initialised once at boot', (transInit.match(/call music_init_system/g) || []).length === 1);
check('music + transitions: bitmap_flow_wait_vblank is defined once', (transAsm.match(/^bitmap_flow_wait_vblank:/gm) || []).length === 1);
const tfxStart = transAsm.indexOf('bitmap_tfx_wait_ce:');
const tfxText = tfxStart >= 0 ? transAsm.slice(tfxStart, tfxStart + 60000) : '';
check('music + transitions: the engine waits through the tick (no bare bitmap_wait_vblank inside it)',
  tfxStart >= 0 && /call bitmap_flow_wait_vblank/.test(tfxText) && !/call bitmap_wait_vblank/.test(tfxText.slice(0, tfxText.indexOf('bitmap_tfx_world_palette_ptr:') > 0 ? tfxText.indexOf('bitmap_tfx_world_palette_ptr:') : tfxText.length)),
  tfxStart >= 0 ? 'engine found' : 'bitmap_tfx_wait_ce missing');
check('silent + transitions: the engine still waits with bitmap_wait_vblank and nothing is hoisted',
  !/bitmap_flow_wait_vblank/.test(silentTransAsm) && !/music_init_system/.test(silentTransAsm) && /call bitmap_wait_vblank/.test(silentTransAsm));

if (args.has('--static-only')) {
  console.log(problems.length ? `\nRESULT FAIL (${problems.length})` : '\nRESULT PASS (static only)');
  process.exit(problems.length ? 1 : 0);
}

// ---- dynamic: the menu ----
const symbols = readSymbols(music.sym);
const menuResult = path.join(WORK, 'menu_result.txt').replace(/\\/g, '/');
const menuTcl = `
set result [open "${menuResult}" w]
set throttle off
proc rd {a} { return [debug read memory $a] }
proc psg_snapshot {} {
  set s {}
  for {set r 0} {$r < 14} {incr r} { lappend s [debug read "PSG regs" $r] }
  return $s
}
proc note {msg} { global result; puts $result $msg; flush $result }
set fails 0
proc check {name cond detail} {
  global fails
  if {$cond} { note "ok    $name" } else { note "FAIL  $name ($detail)"; incr fails }
}
set in_menu 0
set menu_t0 0
set ticks_menu 0
set ticks_game 0
set entered 0
set snaps {}
# first pass of the menu loop = the menu is up
debug set_bp ${addressOf(symbols, loopLabel)} {} { if {!$::in_menu} { set ::in_menu 1; set ::menu_t0 [machine_info time]; menu_sample 0 } }
debug set_bp ${addressOf(symbols, 'music_update')} {} { if {$::in_menu && !$::entered} { incr ::ticks_menu } elseif {$::entered} { incr ::ticks_game } }
debug set_bp ${addressOf(symbols, 'bitmap_enter_game_loop')} {} { if {!$::entered} { set ::entered 1; set ::game_t0 [machine_info time] } }

proc menu_sample {n} {
  global snaps
  lappend snaps [psg_snapshot]
  if {$n < 12} { after time 0.25 [list menu_sample [expr {$n + 1}]] } else { menu_done }
}
proc menu_done {} {
  global ticks_menu menu_t0 snaps
  set elapsed [expr {[machine_info time] - $menu_t0}]
  set rate [expr {$ticks_menu / $elapsed}]
  check "menu: music_update runs about 60 times a second" [expr {$rate > 50 && $rate < 70}] [format "%.1f/s over %.2f s" $rate $elapsed]
  check "menu: the song is active" [expr {[rd ${addressOf(symbols, 'music_active')}] == 1}] "music_active=[rd ${addressOf(symbols, 'music_active')}]"
  set distinct [llength [lsort -unique $snaps]]
  check "menu: the sound chip registers keep changing (song advances)" [expr {$distinct >= 4}] "$distinct distinct snapshots of [llength $snaps]"
  keymatrixdown 8 0x01
  after time 0.2 { keymatrixup 8 0x01 }
  after time 6 game_done
}
proc game_done {} {
  global entered ticks_game game_t0
  check "START enters the gameplay loop" $entered "never reached bitmap_enter_game_loop"
  if {$entered} {
    set elapsed [expr {[machine_info time] - $game_t0}]
    check "gameplay: the song is still ticked after START" [expr {$ticks_game > 60 * $elapsed * 0.8}] "$ticks_game ticks in [format %.2f $elapsed] s"
    check "gameplay: the song is still active" [expr {[rd ${addressOf(symbols, 'music_active')}] == 1}] "music_active=[rd ${addressOf(symbols, 'music_active')}]"
  }
  finish
}
proc finish {} {
  global result fails
  note [expr {$fails == 0 ? "RESULT PASS" : "RESULT FAIL ($fails)"}]
  close $result
  exit
}
after time 90 { check "reached the menu" $::in_menu "the menu loop never ran"; finish }
`;
const menuTclPath = path.join(WORK, 'menu_music.tcl');
fs.writeFileSync(menuTclPath, menuTcl);
console.log('running OpenMSX (menu) ...');
const menuText = runOpenMsx(music.rom, menuTclPath, menuResult);
console.log(menuText);
if (!/RESULT PASS/.test(menuText)) problems.push('menu run');

// ---- dynamic: the pixel-smooth scroll, with and without the song ----
function scrollTcl(build, resultPath) {
  const table = readSymbols(build.sym);
  const hasMusic = table.has('music_update');
  return `
set result [open "${resultPath}" w]
set throttle off
set in_scroll 0
set done 0
set ticks 0
set t0 0
set limit [expr {[machine_info time] + 100}]
debug set_bp ${addressOf(table, 'bitmap_vs_run')} {} { if {!$::in_scroll && !$::done} { set ::in_scroll 1; set ::t0 [machine_info time] } }
${hasMusic ? `debug set_bp ${addressOf(table, 'music_update')} {} { if {$::in_scroll && !$::done} { incr ::ticks } }` : ''}
debug set_bp ${addressOf(table, loopLabel)} {} { if {$::in_scroll && !$::done} { set ::done 1; scroll_done } }
proc scroll_done {} {
  global result t0 ticks
  puts $result [format "SCROLL_SECONDS %.3f" [expr {[machine_info time] - $t0}]]
  puts $result "SCROLL_TICKS $ticks"
  puts $result "RESULT PASS"
  close $result
  exit
}
after time 100 { puts $::result "RESULT FAIL (the scroll never ended)"; close $::result; exit }
`;
}
const scrollRuns = {};
for (const [key, build] of [['music', musicScroll], ['silent', silentScroll]]) {
  const resultPath = path.join(WORK, `scroll_${key}.txt`).replace(/\\/g, '/');
  const tclPath = path.join(WORK, `scroll_${key}.tcl`);
  fs.writeFileSync(tclPath, scrollTcl(build, resultPath));
  console.log(`running OpenMSX (scroll, ${key}) ...`);
  const text = runOpenMsx(build.rom, tclPath, resultPath);
  scrollRuns[key] = {
    ok: /RESULT PASS/.test(text),
    seconds: Number(/SCROLL_SECONDS ([\d.]+)/.exec(text)?.[1]),
    ticks: Number(/SCROLL_TICKS (\d+)/.exec(text)?.[1] ?? 0),
    text,
  };
}
check('scroll (music): the scroll runs to its end', scrollRuns.music.ok, scrollRuns.music.text.trim());
check('scroll (silent): the scroll runs to its end', scrollRuns.silent.ok, scrollRuns.silent.text.trim());
if (scrollRuns.music.ok && scrollRuns.silent.ok) {
  const { seconds, ticks } = scrollRuns.music;
  const rate = ticks / seconds;
  console.log(`      scroll: ${seconds.toFixed(2)} s with music (${ticks} ticks, ${rate.toFixed(1)}/s), ${scrollRuns.silent.seconds.toFixed(2)} s silent`);
  check('scroll: the song is ticked about once per frame', rate > 50 && rate < 70, `${rate.toFixed(1)} ticks/s`);
  check('scroll: ticking the song does not slow the scroll down', Math.abs(seconds - scrollRuns.silent.seconds) / scrollRuns.silent.seconds < 0.05,
    `${seconds.toFixed(3)} s vs ${scrollRuns.silent.seconds.toFixed(3)} s`);
}

// ---- dynamic: the transition engine, with and without the song ----
function transitionTcl(build, resultPath, names) {
  const table = readSymbols(build.sym);
  const hasMusic = table.has('music_update');
  return `
set result [open "${resultPath}" w]
set throttle off
set stage 0
set t_a 0
set t_b 0
set t_c 0
set ticks_a 0
set ticks_b 0
set init_done 0
set early_ticks 0
proc note {msg} { global result; puts $result $msg; flush $result }
${hasMusic ? `# Cold boot: cartridge RAM is garbage. Poison the music state the moment the cartridge starts, so a
# music_update that runs before music_init_system (the boot intro shares the transition engine) is caught.
debug set_bp ${addressOf(table, 'init_rom')} {} {
  foreach address {${['music_active', 'music_muted', 'music_loop', 'music_track_index'].map(name => addressOf(table, name)).join(' ')}} { debug write memory $address 0xFF }
}` : ''}
# stage 1: the fill wipe (node t2 up to node t3); stage 2: the palette flash (node t3 up to the menu node)
debug set_bp ${addressOf(table, names.gf_t2)} {} { if {$::stage == 0} { set ::stage 1; set ::t_a [machine_info time] } }
debug set_bp ${addressOf(table, names.gf_t3)} {} { if {$::stage == 1} { set ::stage 2; set ::t_b [machine_info time] } }
debug set_bp ${addressOf(table, names[MENU_ID])} {} { if {$::stage == 2} { set ::stage 3; set ::t_c [machine_info time]; trans_done } }
${hasMusic ? `# music_update must never run before music_init_system: until then its RAM is garbage.
debug set_bp ${addressOf(table, 'music_init_system')} {} { set ::init_done 1 }
debug set_bp ${addressOf(table, 'music_update')} {} { if {!$::init_done} { incr ::early_ticks } ; if {$::stage == 1} { incr ::ticks_a } elseif {$::stage == 2} { incr ::ticks_b } }` : ''}
proc trans_done {} {
  global t_a t_b t_c ticks_a ticks_b
  note [format "WIPE_SECONDS %.3f" [expr {$t_b - $t_a}]]
  note [format "FLASH_SECONDS %.3f" [expr {$t_c - $t_b}]]
  note "WIPE_TICKS $ticks_a"
  note "FLASH_TICKS $ticks_b"
  note "EARLY_TICKS $::early_ticks"
  after time 1.5 menu_check
}
proc menu_check {} {
  global result
  note "MUSIC_ACTIVE ${hasMusic ? `[debug read memory ${addressOf(table, 'music_active')}]` : '0'}"
  note "RESULT PASS"
  close $result
  exit
}
after time 100 { puts $::result "RESULT FAIL (never reached the menu: stage $::stage)"; close $::result; exit }
`;
}
const transRuns = {};
for (const [key, build, name] of [['music', musicTrans, 'music_trans'], ['silent', silentTrans, 'silent_trans']]) {
  const resultPath = path.join(WORK, `trans_${key}.txt`).replace(/\\/g, '/');
  const tclPath = path.join(WORK, `trans_${key}.tcl`);
  fs.writeFileSync(tclPath, transitionTcl(build, resultPath, labels[name]));
  console.log(`running OpenMSX (transitions, ${key}) ...`);
  const text = runOpenMsx(build.rom, tclPath, resultPath);
  const num = label => Number(new RegExp(`${label} ([\\d.]+)`).exec(text)?.[1]);
  transRuns[key] = { ok: /RESULT PASS/.test(text), wipe: num('WIPE_SECONDS'), flash: num('FLASH_SECONDS'), wipeTicks: num('WIPE_TICKS'), flashTicks: num('FLASH_TICKS'), active: num('MUSIC_ACTIVE'), early: num('EARLY_TICKS'), text };
}
check('transitions (music): the boot intro and the flow reach the menu', transRuns.music.ok, transRuns.music.text.trim());
check('transitions (silent): the boot intro and the flow reach the menu', transRuns.silent.ok, transRuns.silent.text.trim());
if (transRuns.music.ok && transRuns.silent.ok) {
  const m = transRuns.music;
  const q = transRuns.silent;
  console.log(`      wipe: ${m.wipe.toFixed(2)} s with music (${m.wipeTicks} ticks, ${(m.wipeTicks / m.wipe).toFixed(1)}/s), ${q.wipe.toFixed(2)} s silent`);
  console.log(`      flash: ${m.flash.toFixed(2)} s with music (${m.flashTicks} ticks, ${(m.flashTicks / m.flash).toFixed(1)}/s), ${q.flash.toFixed(2)} s silent`);
  check('wipe: the song is ticked while the wipe runs', m.wipeTicks / m.wipe > 25, `${(m.wipeTicks / m.wipe).toFixed(1)} ticks/s`);
  check('flash: the song is ticked while the palette flash runs', m.flashTicks / m.flash > 25, `${(m.flashTicks / m.flash).toFixed(1)} ticks/s`);
  check('wipe: ticking the song does not slow the wipe down', Math.abs(m.wipe - q.wipe) / q.wipe < 0.05, `${m.wipe.toFixed(3)} s vs ${q.wipe.toFixed(3)} s`);
  check('flash: ticking the song does not slow the palette flash down', Math.abs(m.flash - q.flash) / q.flash < 0.05, `${m.flash.toFixed(3)} s vs ${q.flash.toFixed(3)} s`);
  check('transitions: the song is active on the menu afterwards', m.active === 1, `music_active=${m.active}`);
  check('transitions: music_update never runs before music_init_system (cold-boot RAM is garbage)', m.early === 0, `${m.early} early calls`);
}

console.log(problems.length ? `\nRESULT FAIL (${problems.length}): ${problems.join('; ')}` : '\nRESULT PASS');
process.exit(problems.length ? 1 : 0);
