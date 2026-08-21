import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'C:/Users/salam/Downloads/test554.json');
const worldId = 'worldmap_1787108640858';
const flowId = 'gf_bitmapPlatform_mymsxgame';
const targetLinkId = 'msx2_gf_worldlink_1787157064627';

if (!fs.existsSync(target)) throw new Error(`JSON not found: ${target}`);
const project = JSON.parse(fs.readFileSync(target, 'utf8'));
const flowAsset = project.assets?.find(asset => asset?.id === flowId)
  || project.assets?.find(asset => asset?.type === 'msx2gameflow');
if (!flowAsset?.data) throw new Error('MSX2 GameFlow asset not found');
const flow = flowAsset.data;
const startNode = (flow.nodes || []).find(node => node?.id === flow.startNodeId && node?.type === 'Start');
const targetLink = (flow.nodes || []).find(node => node?.id === targetLinkId && node?.type === 'WorldLink')
  || (flow.nodes || []).find(node => node?.type === 'WorldLink' && node?.worldAssetId === worldId);
if (!startNode) throw new Error(`GameFlow start node not found: ${flow.startNodeId}`);
if (!targetLink) throw new Error(`WorldLink for ${worldId} not found`);

targetLink.worldAssetId = worldId;
targetLink.musicTrackAssetId = '__none';
flow.nodes = [startNode, targetLink];
flow.connections = [{
  id: 'msx2_gfc_test554_start_defense_core_20260821',
  from: { nodeId: startNode.id },
  to: { nodeId: targetLink.id },
}];

const serialized = `${JSON.stringify(project, null, 2)}\n`;
const temp = `${target}.gameflow.tmp`;
fs.writeFileSync(temp, serialized, 'utf8');
fs.copyFileSync(temp, target);
fs.unlinkSync(temp);
console.log(JSON.stringify({ target, flowId: flowAsset.id, nodes: flow.nodes.map(node => ({ id: node.id, type: node.type, worldAssetId: node.worldAssetId })), connections: flow.connections }, null, 2));
