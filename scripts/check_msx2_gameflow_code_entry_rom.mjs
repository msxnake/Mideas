#!/usr/bin/env node
/**
 * CodeEntry (password) node of the SCREEN 5 bitmap GameFlow, checked on the REAL generator + glass.
 *
 * Fixture: the bitmap intro test project with its world split in two, and the flow
 *   Start -> Presentation -> Transition -> SubMenu [START -> WorldLink(w1), PASSWORD -> CodeEntry]
 *   CodeEntry [LEV2 -> WorldLink(w2), BOSS -> End, wrong/ESC -> SubMenu]
 * The ROM must compile, every code must jump to its own node, a wrong code must go back to the menu,
 * and the CodeEntry RAM must not overlap any other EQU of the ROM.
 *
 *   node scripts/check_msx2_gameflow_code_entry_rom.mjs            static checks + glass
 *   node scripts/check_msx2_gameflow_code_entry_rom.mjs --smoke    + OpenMSX: type LEV2, expect world 2
 *   KEEP=1 ...                                                     keep the work dir (ASM, ROM, screenshots)
 *   node scripts/check_msx2_gameflow_code_entry_rom.mjs --write-fixture out.json   only write the project
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPENMSX = 'C:/Program Files/openMSX/openmsx.exe';
const smoke = process.argv.includes('--smoke');

// ---- fixture -------------------------------------------------------------------------------
function buildCodeEntryFixture() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/msx2-bitmap-intro/bitmap_intro_test.json'), 'utf8'));
  const world1 = raw.assets.find(a => a.type === 'worldmap');
  const nodes = world1.data.nodes;
  const half = Math.ceil(nodes.length / 2);
  const kept = new Set(nodes.slice(0, half).map(n => n.id));
  const moved = new Set(nodes.slice(half).map(n => n.id));
  const connections = world1.data.connections || [];
  raw.assets.push({
    id: 'worldmap_code_w2',
    name: 'World 2',
    type: 'worldmap',
    data: {
      ...JSON.parse(JSON.stringify(world1.data)),
      id: 'worldmap_code_w2',
      name: 'World 2',
      nodes: JSON.parse(JSON.stringify(nodes.slice(half))),
      connections: JSON.parse(JSON.stringify(connections.filter(c => moved.has(c.fromNodeId) && moved.has(c.toNodeId)))),
      startScreenNodeId: nodes[half].id,
    },
  });
  world1.data.nodes = nodes.slice(0, half);
  world1.data.connections = connections.filter(c => kept.has(c.fromNodeId) && kept.has(c.toNodeId));
  if (!kept.has(world1.data.startScreenNodeId)) world1.data.startScreenNodeId = nodes[0].id;

  const flow = raw.assets.find(a => a.type === 'msx2gameflow').data;
  const transition = flow.nodes.find(n => n.type === 'Transition');
  const link1 = flow.nodes.find(n => n.type === 'WorldLink');
  const end = flow.nodes.find(n => n.type === 'End');
  link1.worldAssetId = world1.id;
  const link2 = { ...JSON.parse(JSON.stringify(link1)), id: 'gf_code_link2', worldAssetId: 'worldmap_code_w2' };
  const menu = {
    id: 'gf_menu', type: 'SubMenu', position: { x: 300, y: 200 }, title: 'MAIN MENU',
    options: [{ id: 'opt_start', text: 'START' }, { id: 'opt_code', text: 'PASSWORD' }],
  };
  const code = {
    id: 'gf_code', type: 'CodeEntry', position: { x: 500, y: 300 }, title: 'ENTER CODE', codeLength: 4,
    codes: [{ id: 'code_lev2', code: 'lev2' }, { id: 'code_boss', code: 'BOSS' }, { id: 'code_bad', code: 'TOOLONG' }],
  };
  flow.nodes.push(link2, menu, code);
  // Laid out left to right so --write-fixture opens readable in the GameFlow editor (some fixture nodes only
  // carry x/y, and the editor reads node.position).
  const layout = { [flow.startNodeId]: [40, 120], gf_intro_presentation_node: [240, 120], gf_intro_transition_node: [440, 120],
    [menu.id]: [640, 120], [link1.id]: [880, 20], [code.id]: [880, 240], [link2.id]: [1120, 240], [end.id]: [1360, 120] };
  for (const node of flow.nodes) {
    const at = layout[node.id];
    node.position = at ? { x: at[0], y: at[1] } : (node.position || { x: node.x ?? 0, y: node.y ?? 0 });
  }
  flow.connections = flow.connections.filter(c => c.from.nodeId !== transition.id && c.to.nodeId !== link1.id);
  flow.connections.push(
    { id: 'cc1', from: { nodeId: transition.id }, to: { nodeId: menu.id } },
    { id: 'cc2', from: { nodeId: menu.id, sourceId: 'opt_start' }, to: { nodeId: link1.id } },
    { id: 'cc3', from: { nodeId: menu.id, sourceId: 'opt_code' }, to: { nodeId: code.id } },
    { id: 'cc4', from: { nodeId: code.id, sourceId: 'code_lev2' }, to: { nodeId: link2.id } },
    { id: 'cc5', from: { nodeId: code.id, sourceId: 'code_boss' }, to: { nodeId: end.id } },
    { id: 'cc6', from: { nodeId: code.id, sourceId: '__wrong' }, to: { nodeId: menu.id } },
    { id: 'cc7', from: { nodeId: link2.id }, to: { nodeId: end.id } },
  );
  const label = node => `bitmap_gf_node_${flow.nodes.indexOf(node)}`;
  return { raw, labels: { link2: label(link2), end: label(end), menu: label(menu), code: label(code) } };
}

// ---- run -------------------------------------------------------------------------------------
const { raw, labels } = buildCodeEntryFixture();
const fixtureOut = process.argv[process.argv.indexOf('--write-fixture') + 1];
if (process.argv.includes('--write-fixture')) {
  // Same project, to open in Mideas and look at the flow in the GameFlow editor.
  fs.writeFileSync(fixtureOut, JSON.stringify(raw));
  console.log(`fixture written to ${fixtureOut}`);
  process.exit(0);
}
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_codeentry_'));
if (process.env.KEEP) console.log('work dir', work);
const problems = [];
try {
  const files = { json: path.join(work, 'p.json'), asm: path.join(work, 'p.asm'), rom: path.join(work, 'p.rom'), sym: path.join(work, 'p.sym') };
  fs.writeFileSync(files.json, JSON.stringify(raw));
  execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), files.json,
    '--asm', files.asm, '--keep', files.rom, '--sym', files.sym], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
  const asm = fs.readFileSync(files.asm, 'utf8').replace(/\r\n/g, '\n');

  // Where each label's first `jp` leads.
  const firstJp = name => new RegExp(String.raw`\n${name}:[\s\S]*?\n\s+jp (\w+)`).exec(asm)?.[1];
  const expectJp = (name, target, what) => {
    const got = firstJp(name);
    if (got !== target) problems.push(`${what}: ${name} jumps to "${got}", expected ${target}`);
  };
  expectJp('bitmap_flow_menu_pick_gf_menu_1', labels.code, 'menu PASSWORD');
  expectJp('bitmap_flow_code_pick_gf_code_0', labels.link2, 'code LEV2 (typed in lower case in the editor)');
  expectJp('bitmap_flow_code_pick_gf_code_1', labels.end, 'code BOSS');
  expectJp('bitmap_flow_code_back_gf_code', labels.menu, 'wrong code / ESC');
  if (/bitmap_flow_code_pick_gf_code_2:/.test(asm)) problems.push('a 7-character code was emitted for a 4-slot entry');
  if (!/bitmap_flow_code_gf_code_0:\s*; "LEV2"\n\s*DB #4C,#45,#56,#32/.test(asm)) problems.push('code LEV2 data is not the ASCII bytes of "LEV2"');

  // The CodeEntry RAM must not share an address with any other RAM equate.
  const equ = [...asm.matchAll(/^(\w+)\s+EQU\s+#([0-9A-F]{4})\b/gim)].map(m => [m[1], parseInt(m[2], 16)]);
  const codeRam = equ.filter(([name]) => name.startsWith('bitmap_flow_code_'));
  if (codeRam.length < 10) problems.push(`CodeEntry RAM equates missing (${codeRam.length})`);
  const codeEnd = { bitmap_flow_code_buf: 8, bitmap_flow_code_de: 2, bitmap_flow_code_chr: 2 };
  for (const [name, address] of codeRam) {
    const size = codeEnd[name] || 1;
    for (const [other, otherAddress] of equ) {
      if (other.startsWith('bitmap_flow_code_') || otherAddress < 0xc000) continue;
      if (otherAddress >= address && otherAddress < address + size) problems.push(`${name} (#${address.toString(16)}) overlaps ${other}`);
    }
  }

  if (smoke && problems.length === 0) problems.push(...runSmoke(files, work, labels));
  console.log(problems.length ? `RESULT FAIL\n - ${problems.join('\n - ')}` : `RESULT PASS (LEV2 -> ${labels.link2}, BOSS -> ${labels.end}, wrong -> ${labels.menu})`);
  process.exitCode = problems.length ? 1 : 0;
} catch (error) {
  console.log(`RESULT FAIL\n - ${String(error.stdout || '')}${String(error.stderr || error.message)}`.slice(0, 1500));
  process.exitCode = 1;
} finally {
  if (!process.env.KEEP) fs.rmSync(work, { recursive: true, force: true });
}

// ---- OpenMSX: menu -> PASSWORD -> type "LEV2" -> SPACE -> world 2 ------------------------------
function runSmoke(files, dir, labels) {
  const syms = new Map();
  for (const line of fs.readFileSync(files.sym, 'utf8').split('\n')) {
    const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (m) syms.set(m[1], parseInt(m[2], 16));
  }
  const menuNode = labels.menu;
  const need = ['bitmap_world_index', 'bitmap_flow_code_edit', 'bitmap_flow_code_buf', 'bitmap_enter_game_loop', menuNode];
  const missing = need.filter(name => !syms.has(name));
  if (missing.length) return [`symbols missing for the smoke: ${missing.join(', ')}`];
  const hex = name => `0x${syms.get(name).toString(16)}`;
  const fwd = p => p.split(path.sep).join('/');
  const out = fwd(path.join(dir, 'smoke.txt'));
  const shot = name => fwd(path.join(dir, name));
  // Driven by breakpoints, not by wall-clock guesses: the menu node and the code editor announce themselves.
  // Visit 1 types "BOSX" (wrong -> back to the menu), visit 2 types "LEV" and reaches "2" with DOWN x8
  // (empty slot -> 9 -> 8 ... -> 2), then SPACE must land in world 2.
  // Keys: row 8 SPACE #01 / DOWN #40; B r2 #80, O r4 #10, S r5 #01, X r5 #20, L r4 #02, E r3 #04, V r5 #08.
  const tcl = `
set out [open "${out}" w]
set ::menu_visits 0
set ::code_visits 0
set ::loop_hits 0
proc say {text} { global out; puts $out $text; flush $out }
proc tap {row mask} { keymatrixdown $row $mask; after time 0.12 [list keymatrixup $row $mask] }
proc seq {t steps} { foreach step $steps { after time $t $step; set t [expr {$t + 0.35}] }; return $t }
proc kick {} { if {$::menu_visits == 0} { tap 8 0x01; after time 1 kick } }
proc on_menu {} {
  incr ::menu_visits
  seq 1.0 {{tap 8 0x40} {tap 8 0x01}}
}
proc buffer {} {
  set b {}
  for {set i 0} {$i < 4} {incr i} { lappend b [debug read memory [expr {${hex('bitmap_flow_code_buf')} + $i}]] }
  return $b
}
proc on_code {} {
  incr ::code_visits
  if {$::code_visits == 1} {
    after time 0.8 { screenshot "${shot('code_empty.png')}" }
    set t [seq 1.0 {{tap 2 0x80} {tap 4 0x10} {tap 5 0x01} {tap 5 0x20}}]
    after time $t { say "wrong_buffer [buffer]"; tap 8 0x01 }
    after time [expr {$t + 0.5}] { screenshot "${shot('wrong.png')}" }
  } else {
    set t [seq 1.0 {{tap 4 0x02} {tap 3 0x04} {tap 5 0x08} {tap 8 0x40} {tap 8 0x40} {tap 8 0x40} {tap 8 0x40} {tap 8 0x40} {tap 8 0x40} {tap 8 0x40} {tap 8 0x40}}]
    after time $t { screenshot "${shot('code_typed.png')}"; say "buffer [buffer]"; tap 8 0x01 }
    after time [expr {$t + 4}] {
      screenshot "${shot('world2.png')}"
      say "menu_visits $::menu_visits"
      say "code_visits $::code_visits"
      say "world_index [debug read memory ${hex('bitmap_world_index')}]"
      say "loop_hits $::loop_hits"
      close $::out
      exit
    }
  }
}
debug set_bp ${hex(menuNode)} {} { on_menu }
debug set_bp ${hex('bitmap_flow_code_edit')} {} { on_code }
debug set_bp ${hex('bitmap_enter_game_loop')} {} { incr ::loop_hits }
after time 3 kick
after time 80 { say "timeout menu=$::menu_visits code=$::code_visits"; close $::out; exit }
`;
  const tclPath = path.join(dir, 'smoke.tcl');
  fs.writeFileSync(tclPath, tcl);
  try {
    execFileSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+', '-cart', fwd(files.rom), '-romtype', 'KonamiSCC', '-script', fwd(tclPath)],
      { stdio: 'pipe', timeout: 150000 });
  } catch (error) {
    if (!fs.existsSync(out)) return [`OpenMSX failed: ${String(error.stderr || error.message).slice(0, 400)}`];
  }
  const report = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  console.log(report.trim());
  const found = {};
  for (const line of report.split('\n')) {
    const [key, ...rest] = line.trim().split(' ');
    if (key) found[key] = rest.join(' ');
  }
  const issues = [];
  if (found.timeout !== undefined) issues.push(`smoke timed out (${found.timeout})`);
  if (found.wrong_buffer !== '66 79 83 88') issues.push(`first attempt buffer is "${found.wrong_buffer}", expected "66 79 83 88" (BOSX)`);
  if (found.menu_visits !== '2') issues.push(`menu visited ${found.menu_visits} times, expected 2 (the wrong code must lead back to it)`);
  if (found.code_visits !== '2') issues.push(`code screen visited ${found.code_visits} times, expected 2`);
  if (found.buffer !== '76 69 86 50') issues.push(`typed buffer is "${found.buffer}", expected "76 69 86 50" (LEV2)`);
  if (found.world_index !== '1') issues.push(`world index after LEV2 is ${found.world_index}, expected 1 (world 2)`);
  if (!(Number(found.loop_hits) >= 1)) issues.push('the gameplay loop was never entered');
  return issues;
}
