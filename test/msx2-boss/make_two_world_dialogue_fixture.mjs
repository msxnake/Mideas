/**
 * Two worlds that BOTH have their own dialogue portrait.
 *
 * The plain two-world fixture cannot show what per-world dialogue packing buys,
 * because only world 0 has an NPC: the union of the worlds and the biggest world
 * are the same number, so the saving is real but invisible. This clones the
 * existing NPC and its dialogue into the second world, which is the smallest
 * change that makes the two figures diverge.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'test/msx2-boss/out/two_worlds.json';
const OUT = 'test/msx2-boss/out/two_worlds_dialogue.json';
const project = JSON.parse(readFileSync(SRC, 'utf8'));
const byId = new Map((project.assets || []).map(a => [a.id, a]));

// Locate the NPC that already talks, and the dialogue it opens.
let sourceNpc;
for (const asset of project.assets || []) {
  if (String(asset.type || '').toLowerCase() !== 'msx2bitmaproom') continue;
  for (const entity of asset.data?.layers?.entities || asset.data?.entities || []) {
    if (entity.kind === 'npc' && entity.params?.npcDialogue?.dialogueAssetId) {
      sourceNpc = { entity, room: asset };
      break;
    }
  }
  if (sourceNpc) break;
}
if (!sourceNpc) throw new Error('No talking NPC in the source fixture');
const sourceDialogueId = sourceNpc.entity.params.npcDialogue.dialogueAssetId;
const sourceDialogue = byId.get(sourceDialogueId);
if (!sourceDialogue) throw new Error(`Dialogue asset ${sourceDialogueId} not found`);

// A private copy for world 1: same art, different asset, so it is a portrait
// only the second world can reach.
const clonedId = `${sourceDialogueId}_w1clone`;
project.assets.push({ ...JSON.parse(JSON.stringify(sourceDialogue)), id: clonedId, name: `${sourceDialogue.name || 'dialogue'} (world 1)` });

// Drop a talking NPC into the second world's entry room.
const flow = (project.assets || []).find(a => String(a.type || '').toLowerCase().includes('gameflow'));
const linkIds = (flow.data.nodes || []).filter(n => n.type === 'WorldLink')
  .map(n => n.worldAssetId || (n.data && (n.data.worldAssetId || n.data.worldMapId)));
const secondWorld = byId.get(linkIds[1]) || (project.worldmaps || []).find(w => w.id === linkIds[1]);
const nodes = secondWorld?.data?.nodes || secondWorld?.nodes || [];
const target = byId.get((nodes.find(n => n.isStart) || nodes[0])?.screenAssetId);
if (!target) throw new Error('Second world has no room to place the NPC in');
const clonedNpc = JSON.parse(JSON.stringify(sourceNpc.entity));
clonedNpc.id = `${clonedNpc.id || 'npc'}_w1clone`;
clonedNpc.params.npcDialogue.dialogueAssetId = clonedId;
clonedNpc.position = { x: 4, y: 9 };
target.data.layers = target.data.layers || {};
target.data.layers.entities = target.data.layers.entities || target.data.entities || [];
target.data.layers.entities.push(clonedNpc);

writeFileSync(OUT, JSON.stringify(project));
console.log(`world 0 keeps "${sourceDialogueId}"; world 1 gets "${clonedId}" in room "${target.name}"`);
console.log(`wrote ${OUT}`);
