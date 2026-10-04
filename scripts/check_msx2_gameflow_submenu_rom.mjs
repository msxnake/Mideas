#!/usr/bin/env node
/**
 * ROM side of the SubMenu link repair: a menu whose START link has no option (what older editor builds
 * saved) must still lead somewhere in the exported ROM instead of keeping the player on the menu.
 *
 *   node scripts/check_msx2_gameflow_submenu_rom.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/msx2-bitmap-intro/bitmap_intro_test.json'), 'utf8'));
const flow = raw.assets.find(a => a.type === 'msx2gameflow').data;
const transition = flow.nodes.find(n => n.type === 'Transition');
const world = flow.nodes.find(n => n.type === 'WorldLink');
const end = flow.nodes.find(n => n.type === 'End');
const menu = { id: 'gf_menu', type: 'SubMenu', position: { x: 300, y: 200 }, title: 'Main Menu',
  options: [{ id: 'opt_start', text: 'START' }, { id: 'opt_end', text: 'QUIT' }] };
flow.nodes.push(menu);
flow.connections = flow.connections.filter(c => c.from.nodeId !== transition.id && c.to.nodeId !== world.id);
flow.connections.push(
  { id: 'c1', from: { nodeId: transition.id }, to: { nodeId: menu.id } },
  { id: 'c2', from: { nodeId: menu.id }, to: { nodeId: world.id } },                      // START, saved WITHOUT its option
  { id: 'c3', from: { nodeId: menu.id, sourceId: 'opt_end' }, to: { nodeId: end.id } },
);
const worldLabel = `bitmap_gf_node_${flow.nodes.indexOf(world)}`;

const work = fs.mkdtempSync(path.join(os.tmpdir(), "mideas_submenu_"));
if (process.env.KEEP) console.log("work dir", work);
try {
  fs.writeFileSync(path.join(work, 'p.json'), JSON.stringify(raw));
  execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), path.join(work, 'p.json'), '--asm', path.join(work, 'p.asm')],
    { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
  const asm = fs.readFileSync(path.join(work, 'p.asm'), 'utf8');
  // the first `jp` after the pick label is where the option leads
  const pick = index => new RegExp(String.raw`bitmap_flow_menu_pick_gf_menu_${index}:[\s\S]*?jp (\w+)`).exec(asm)?.[1];
  const problems = [];
  if (pick(0) !== worldLabel) problems.push(`START leads to "${pick(0)}", expected ${worldLabel} (the WorldLink)`);
  if (!pick(1) || pick(1) === 'bitmap_flow_menu_loop_gf_menu') problems.push(`QUIT is not wired (${pick(1)})`);
  console.log(problems.length ? `RESULT FAIL\n - ${problems.join('\n - ')}` : `RESULT PASS (START -> ${pick(0)}, QUIT -> ${pick(1)})`);
  process.exit(problems.length ? 1 : 0);
} catch (error) {
  console.log(`RESULT FAIL\n - ${String(error.stdout || '')}${String(error.stderr || error.message)}`.slice(0, 1200));
  process.exit(1);
} finally {
  if (!process.env.KEEP) fs.rmSync(work, { recursive: true, force: true });
}
