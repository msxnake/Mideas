#!/usr/bin/env node
/**
 * The Intro node in a BIG project (the resident window almost full).
 *
 *   node scripts/check_msx2_intro_bigproject.mjs
 *
 * Injects an Intro node between Start and WorldLink of test/msx2-boss/fixture_test606.json (23 rooms,
 * 5 bosses, PT3 music) and checks that the ROM assembles and that the resident part of the Intro
 * (which swaps P2) landed BELOW #8000. When it was emitted at the end of the runtime it landed in
 * #98xx for a project like this one and Glass failed with "Negative initial size".
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/msx2-boss/fixture_test606.json'), 'utf8'));
const flow = raw.assets.find(a => a.type === 'msx2gameflow').data;
const world = flow.nodes.find(n => n.type === 'WorldLink');
const palette = raw.assets.find(a => a.type === 'palette').data.slots;
raw.assets.push({
  id: 'big_intro', name: 'Big project intro', type: 'msx2intro',
  data: { id: 'big_intro', name: 'Big project intro', target: 'MSX2', slides: [{
    id: 's1', name: 'One', backgroundColor: 1, palette, images: [],
    textZones: [{ id: 'z', name: 'Body', rect: { x: 16, y: 150, w: 224, h: 40 }, fg: 15, bg: 1, lineSpacing: 10, charDelayFrames: 2 }],
    steps: [{ id: 'a', zoneId: 'z', text: 'A BIG PROJECT.', clearBefore: true, autoAdvanceFrames: 0 }],
    transitionIn: 'cut', transitionOut: 'cut' }] },
});
flow.nodes.push({ id: 'gf_big_intro', type: 'Intro', position: { x: 300, y: 300 }, introAssetId: 'big_intro' });
for (const c of flow.connections) if (c.to.nodeId === world.id) c.to.nodeId = 'gf_big_intro';
flow.connections.push({ id: 'big_c', from: { nodeId: 'gf_big_intro' }, to: { nodeId: world.id } });

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_big_intro_'));
const project = path.join(work, 'project.json');
const sym = path.join(work, 'p.sym');
fs.writeFileSync(project, JSON.stringify(raw));
try {
  const out = execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), project, '--sym', sym, '--keep', path.join(work, 'p.rom')],
    { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 }).toString();
  const free = /(\d+) FREE of 32768/.exec(out)?.[1];
  const labels = new Map();
  for (const line of fs.readFileSync(sym, 'utf8').split('\n')) {
    const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (m) labels.set(m[1], parseInt(m[2], 16));
  }
  const need = name => { if (!labels.has(name)) throw new Error(`symbol ${name} missing`); return labels.get(name); };
  const end = need('bitmap_intro_resident_end');
  const problems = [];
  if (end > 0x8000) problems.push(`the resident part ends at #${end.toString(16)}, above #8000`);
  for (const name of ['bitmap_intro_run', 'bitmap_intro_copy_vram', 'bitmap_intro_music']) {
    if (need(name) >= 0x8000) problems.push(`${name} is at #${need(name).toString(16)}, in the P2 window`);
  }
  console.log(`resident Intro code: #${need('bitmap_intro_run').toString(16)}-#${end.toString(16)}; resident window free: ${free} bytes`);
  console.log(problems.length ? `RESULT FAIL\n - ${problems.join('\n - ')}` : 'RESULT PASS');
  process.exit(problems.length ? 1 : 0);
} catch (error) {
  console.log(`RESULT FAIL\n - ${String(error.stdout || '')}${String(error.stderr || error.message)}`.slice(0, 1500));
  process.exit(1);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
