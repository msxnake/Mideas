#!/usr/bin/env node
/**
 * Probe fixture: ONE GameFlow that visits TWO worlds.
 *
 * Rooms are split across world 1 (oficial_w1) and world 2 (a second palette), and
 * the flow becomes Start -> ... -> WorldLink(w1) -> WorldLink(w2) -> End. This is
 * the shape a "each world has its own palette" project needs: the ROM must hold
 * both worlds and reload the palette when the flow enters the second one.
 *
 * Usage: node make_two_worldlink_probe.cjs <in.json> <out.json>
 */
const fs = require('node:fs');

const [, , inPath, outPath] = process.argv;
const project = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const assets = project.assets;

const world1 = assets.find(a => a.type === 'worldmap');
if (!world1) throw new Error('fixture has no worldmap');

const PALETTE_2_ID = 'palette_probe_world2';
const rgb333 = (r, g, b) => (r << 6) | (g << 3) | b;
assets.push({
  id: PALETTE_2_ID,
  name: 'oficial_w2',
  type: 'palette',
  data: {
    id: PALETTE_2_ID,
    name: 'oficial_w2',
    mode: 'SCREEN5',
    slots: [
      [0, 0, 0], [0, 0, 0], [7, 0, 7], [0, 7, 7], [7, 7, 0], [7, 0, 0], [0, 7, 0], [0, 0, 7],
      [7, 7, 7], [4, 2, 4], [2, 3, 4], [3, 4, 2], [6, 1, 0], [0, 6, 1], [1, 0, 6], [5, 5, 5],
    ].map(([r, g, b], i) => ({
      slotIndex: i,
      masterIndex: i === 0 ? -1 : rgb333(r, g, b),
      hex: i === 0 ? 'rgba(0,0,0,0)' : '#000000',
    })),
  },
});

const nodes = world1.data.nodes || [];
const half = Math.ceil(nodes.length / 2);
const keptNodes = nodes.slice(0, half);
const movedNodes = nodes.slice(half);
const movedIds = new Set(movedNodes.map(n => n.id));
const keptIds = new Set(keptNodes.map(n => n.id));
const connections = world1.data.connections || [];

assets.push({
  id: 'worldmap_probe_2',
  name: 'World Map 2',
  type: 'worldmap',
  data: {
    ...JSON.parse(JSON.stringify(world1.data)),
    id: 'worldmap_probe_2',
    name: 'World Map 2',
    paletteAssetId: PALETTE_2_ID,
    nodes: JSON.parse(JSON.stringify(movedNodes)),
    connections: JSON.parse(JSON.stringify(
      connections.filter(c => movedIds.has(c.fromNodeId) && movedIds.has(c.toNodeId)),
    )),
    startScreenNodeId: movedNodes[0]?.id,
  },
});
world1.data.nodes = keptNodes;
world1.data.connections = connections.filter(c => keptIds.has(c.fromNodeId) && keptIds.has(c.toNodeId));
if (!keptIds.has(world1.data.startScreenNodeId)) world1.data.startScreenNodeId = keptNodes[0]?.id;

// Insert a second WorldLink between the existing one and whatever follows it.
const flow = assets.find(a => a.type === 'msx2gameflow' && a.data?.purpose === 'screen4-bitmap-runtime');
if (!flow) throw new Error('fixture has no bitmap-runtime gameflow');
const link1 = flow.data.nodes.find(n => n.type === 'WorldLink');
if (!link1) throw new Error('gameflow has no WorldLink');
link1.worldAssetId = world1.id;

const LINK2_ID = 'gf_worldlink_probe_2';
flow.data.nodes.push({ ...JSON.parse(JSON.stringify(link1)), id: LINK2_ID, worldAssetId: 'worldmap_probe_2' });

// Connections are {from:{nodeId}, to:{nodeId}} — not flat fromNodeId/toNodeId.
const outgoing = (flow.data.connections || []).filter(c => c.from?.nodeId === link1.id);
for (const c of outgoing) c.from.nodeId = LINK2_ID;
flow.data.connections.push({
  id: 'gf_conn_probe_link1_link2',
  from: { nodeId: link1.id },
  to: { nodeId: LINK2_ID },
});

project.currentProjectName = 'two_worldlinks';
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Probe: ${outPath}`);
console.log(`  world 1 rooms: ${keptNodes.length}, world 2 rooms: ${movedNodes.length}`);
console.log(`  flow: ${link1.id}(world 1) -> ${LINK2_ID}(world 2) -> ${outgoing.map(c => c.to.nodeId).join(', ') || '(nothing)'}`);
