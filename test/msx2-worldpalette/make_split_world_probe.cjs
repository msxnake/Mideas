#!/usr/bin/env node
/**
 * Probe fixture: the project's rooms SPLIT across two worlds with different palettes.
 *
 * World 1 keeps the first half of the rooms + oficial_w1; world 2 takes the second
 * half and a second palette asset. The GameFlow WorldLink is repointed at world 2.
 * A generator that honours the selected world must compile world 2's rooms AND
 * emit world 2's palette bytes.
 *
 * Usage: node make_split_world_probe.cjs <in.json> <out.json> <1|2>
 */
const fs = require('node:fs');

const [, , inPath, outPath, whichArg] = process.argv;
const which = String(whichArg || '2');

const project = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const assets = project.assets;

const world1 = assets.find(a => a.type === 'worldmap');
if (!world1) throw new Error('fixture has no worldmap');

const PALETTE_2_ID = 'palette_probe_world2';
// The generator reads `masterIndex` (511-colour master palette), NOT `hex`.
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

const world2 = {
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
};

world1.data.nodes = keptNodes;
world1.data.connections = connections.filter(c => keptIds.has(c.fromNodeId) && keptIds.has(c.toNodeId));
if (!keptIds.has(world1.data.startScreenNodeId)) world1.data.startScreenNodeId = keptNodes[0]?.id;
assets.push(world2);

const targetWorldId = which === '1' ? world1.id : world2.id;
for (const asset of assets) {
  if (asset.type !== 'msx2gameflow') continue;
  for (const node of asset.data?.nodes || []) {
    if (node.type === 'WorldLink') node.worldAssetId = targetWorldId;
  }
}

project.currentProjectName = `split_w${which}`;
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Probe: ${outPath}`);
console.log(`  world 1 "${world1.name}" rooms: ${keptNodes.map(n => n.screenAssetId).join(', ')}`);
console.log(`  world 2 "${world2.name}" rooms: ${movedNodes.map(n => n.screenAssetId).join(', ')}`);
console.log(`  WorldLink -> ${targetWorldId}`);
