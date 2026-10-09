#!/usr/bin/env node
// Builds the minimal "lift crosses a room boundary with the player aboard" project used by run_shaft_cross_stack.sh.
//
//   node test/msx2-platform/make_shaft_cross_lab.mjs --dir up|down --out <file.json> [--lab <pursuer_lab.json>]
//
// Derived READ-ONLY from test/msx2-pursuer/pursuer_lab.json (tracked; refuses --out === --lab). Nothing of the pursuer / alert-zone
// mechanic is used: the two rooms A and B stay exactly as the lab has them, so the lift is the only thing under test.
//
//   * ONE platform_shaft entity (the authored kind, not a hand-written ROM table) placed in room A at tile (2,11), x = 32, with a
//     two-room path. The shaft column (tile column 2) is opened in the top and bottom rows of BOTH rooms so the cabin and the
//     player can travel through the boundary.
//   * up   : path [A, B] (A is the bottom room). The cabin starts in A at y = 176 climbing; the player rides it out of A through
//            the top edge and enters B from its BOTTOM.
//   * down : path [B, A] (B is the bottom room). The cabin starts in A at y = 100 descending; the player rides it out of A through
//            the bottom edge and enters B from its TOP.
//   * a minimal GameFlow Start -> WorldLink -> End(waitForKey), the production path of a real game: the main loop is CALLED by
//     the WorldLink node, so a main loop that returns lands on the End node (bitmap_end_wait_key). That is the symptom of the
//     unbalanced-stack defect in bitmap_shaft_ride_detect, and the probe watches for it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const value = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const dir = value('--dir', '');
const outPath = value('--out', '');
const labPath = path.resolve(value('--lab', path.join(here, '..', 'msx2-pursuer', 'pursuer_lab.json')));
if (!['up', 'down'].includes(dir) || !outPath) {
  console.error('usage: make_shaft_cross_lab.mjs --dir up|down --out <file.json> [--lab <pursuer_lab.json>]');
  process.exit(2);
}
if (path.resolve(outPath) === labPath) { console.error('refusing: --out is the input lab (the lab is read-only)'); process.exit(2); }

const project = JSON.parse(fs.readFileSync(labPath, 'utf8'));
const room = letter => project.assets.find(a => a.id === `pursuer_lab_${letter}`);
const A = room('a');
const B = room('b');
if (!A || !B) { console.error('rooms pursuer_lab_a / pursuer_lab_b not found: is --lab the pursuer lab?'); process.exit(2); }

// Open the shaft column (tile column 2, x = 32..47) in the top row (0) and the bottom row (11) of both rooms.
const COL = 2;
for (const r of [A, B]) {
  const grid = r.data.collision;
  if (!Array.isArray(grid) || !Array.isArray(grid[0])) { console.error('unexpected collision layout'); process.exit(2); }
  for (const row of [0, 11]) grid[row][COL] = 0;
}

const params = dir === 'up'
  ? { path: [A.id, B.id], x: 32, bottomSlot: 0, bottomY: 176, topSlot: 1, topY: 16, startSlot: 0, startY: 176, startDir: 0, speed: 1 }
  : { path: [B.id, A.id], x: 32, bottomSlot: 0, bottomY: 176, topSlot: 1, topY: 16, startSlot: 1, startY: 100, startDir: 1, speed: 1 };
A.data.entities.push({
  id: `shaft_cross_lift_${dir}`, name: `Shaft cross lift ${dir}`, kind: 'platform_shaft', position: { x: 2, y: 11 },
  components: { msx2_hardware_sprite: { msx2SpriteAssetId: '' } }, params,
});

// World start room = A (the lab already starts there; set it explicitly so a different --lab cannot change the fixture).
const world = project.assets.find(a => a.type === 'worldmap');
const startNode = world && world.data.nodes.find(n => n.screenAssetId === A.id);
if (!startNode) { console.error('world has no node for room A'); process.exit(2); }
world.data.startScreenNodeId = startNode.id;

project.assets.push({
  id: 'shaft_cross_lab_gameflow',
  name: 'Shaft cross lab flow',
  type: 'msx2gameflow',
  data: {
    id: 'shaft_cross_lab_gameflow', name: 'Shaft cross lab flow', target: 'MSX2', purpose: 'screen4-bitmap-runtime',
    startNodeId: 'gf_start', panOffset: { x: 0, y: 0 }, zoomLevel: 1,
    nodes: [
      { id: 'gf_start', type: 'Start', position: { x: 70, y: 110 } },
      { id: 'gf_worldlink', type: 'WorldLink', position: { x: 300, y: 110 }, worldAssetId: world.id },
      { id: 'gf_end', type: 'End', position: { x: 530, y: 110 }, title: 'End', message: 'THE END', waitForKey: true, waitFrames: 0 },
    ],
    connections: [
      { id: 'gfc_1', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_worldlink' } },
      { id: 'gfc_2', from: { nodeId: 'gf_worldlink' }, to: { nodeId: 'gf_end' } },
    ],
  },
});

project.name = `shaft_cross_lab_${dir}`;
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(project)}\n`);
console.log(`wrote ${outPath}: lift ${dir} ${JSON.stringify(params)}`);
