#!/usr/bin/env node
/**
 * Probe fixture: TWO bitmap worlds, each with its own palette asset.
 *
 * World 1 keeps the project's original rooms + palette (oficial_w1). World 2 is a
 * copy of the same rooms under a second worldmap whose paletteAssetId points at a
 * clearly different palette. The GameFlow WorldLink is repointed at world 2, so a
 * generator that honours the selected world must emit world 2's palette bytes.
 *
 * Usage: node make_two_world_probe.cjs <in.json> <out.json> <1|2>
 */
const fs = require('node:fs');

const [, , inPath, outPath, whichArg] = process.argv;
const which = String(whichArg || '2');

const project = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const assets = project.assets;

const world1 = assets.find(a => a.type === 'worldmap');
if (!world1) throw new Error('fixture has no worldmap');

const PALETTE_2_ID = 'palette_probe_world2';
// Deliberately loud and unlike oficial_w1 so the emitted bytes cannot be confused.
// NOTE: the generator reads `masterIndex` (511-colour master palette), NOT `hex`;
// a probe that only sets hex silently produces an all-black/ramp palette.
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

const world2 = JSON.parse(JSON.stringify(world1));
world2.id = 'worldmap_probe_2';
world2.name = 'World Map 2';
world2.data.id = world2.id;
world2.data.name = world2.name;
world2.data.paletteAssetId = PALETTE_2_ID;
world2.data.nodes = (world2.data.nodes || []).map(node => ({ ...node, id: `${node.id}_w2` }));
world2.data.connections = (world2.data.connections || []).map(c => ({
  ...c,
  id: `${c.id}_w2`,
  fromNodeId: `${c.fromNodeId}_w2`,
  toNodeId: `${c.toNodeId}_w2`,
}));
if (world2.data.startScreenNodeId) world2.data.startScreenNodeId = `${world2.data.startScreenNodeId}_w2`;
assets.push(world2);

const targetWorldId = which === '1' ? world1.id : world2.id;
let linked = 0;
for (const asset of assets) {
  if (asset.type !== 'msx2gameflow') continue;
  for (const node of asset.data?.nodes || []) {
    if (node.type === 'WorldLink') {
      node.worldAssetId = targetWorldId;
      linked += 1;
    }
  }
}

project.currentProjectName = `${project.currentProjectName || 'probe'}_w${which}`;
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Probe written: ${outPath} (WorldLink -> ${targetWorldId}, ${linked} node(s))`);
