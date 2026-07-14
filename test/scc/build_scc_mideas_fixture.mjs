// Build a full Mideas SCREEN 5 MegaROM fixture with the compact SCC tracker
// asset from scc_mideas_integration.json inserted before the existing flow.
// Usage: node test/scc/build_scc_mideas_fixture.mjs <base-project.json> [output.json]
import fs from 'node:fs';
import path from 'node:path';

const basePath = process.argv[2];
if (!basePath) throw new Error('Expected a full Mideas base-project.json path');
const outputPath = process.argv[3] || path.resolve('test/scc/out/scc_mideas_megarom.json');

const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const integration = JSON.parse(fs.readFileSync(new URL('./scc_mideas_integration.json', import.meta.url), 'utf8'));
const trackAsset = integration.assets.find((asset) => asset.type === 'track');
if (!trackAsset) throw new Error('Integration fixture is missing its SCC track asset');

base.assets = (base.assets || []).filter((asset) => asset.id !== trackAsset.id);
base.assets.push(trackAsset);

const flowAsset = base.assets.find((asset) => asset.type === 'msx2gameflow')
  || base.assets.find((asset) => asset.type === 'gameflow');
if (!flowAsset?.data?.startNodeId) throw new Error('Base fixture needs a GameFlow');
const flow = flowAsset.data;
const startId = flow.startNodeId;
const outgoing = flow.connections.find((connection) => connection.from?.nodeId === startId);
if (!outgoing) throw new Error('Base fixture start node has no outgoing connection');

const musicId = 'scc_integration_music_node';
flow.nodes = flow.nodes.filter((node) => node.id !== musicId);
flow.nodes.push({
  id: musicId,
  type: 'Music',
  position: { x: 185, y: 25 },
  trackAssetId: trackAsset.id,
  loop: true,
  autoPlay: true,
});
outgoing.from.nodeId = musicId;
flow.connections = flow.connections.filter((connection) => connection.id !== 'scc_start_music');
flow.connections.push({
  id: 'scc_start_music',
  from: { nodeId: startId },
  to: { nodeId: musicId },
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(base, null, 2)}\n`);
console.log(outputPath);
