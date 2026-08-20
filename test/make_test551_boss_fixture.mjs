import fs from 'node:fs';

const input = 'C:/Users/salam/Downloads/test551.json';
const output = 'C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_fixture.json';
const dialogueOutput = 'C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_dialog_fixture.json';
const project = JSON.parse(fs.readFileSync(input, 'utf8'));
const bossRoom = project.assets.find(asset => asset.id === 'msx2bitmaproom_1785347065413_east_north_north_north_north_east');
const surface = project.assets.find(asset => asset.id === 'worldmap_1781958895943');
const tunnelBoss = project.assets.find(asset => asset.id === 'msx2boss_1786877495004');
if (!bossRoom || !surface || !tunnelBoss) throw new Error('test551 fixture assets not found');
const startNode = surface.data.nodes[0];
startNode.screenAssetId = bossRoom.id;
startNode.name = bossRoom.name;
surface.data.startScreenNodeId = startNode.id;
// Preserve the authored Room Lock variant for the dialogue/background probe.
// The current saved project has only closeBarrier (and its barrier tile is not
// present in this room), so inject the real four-line dialogue explicitly.
tunnelBoss.data.roomLockSequence = [
  { kind: 'dialogue', dialogueAssetId: 'msx2dialogue_1783089737046' },
  ...(tunnelBoss.data.roomLockSequence || []).filter(step => step?.kind !== 'dialogue'),
];
fs.writeFileSync(dialogueOutput, JSON.stringify(project));
// This fixture measures the fight itself. The authored four-line Room Lock
// dialogue has its own regression fixture; leaving it here would correctly
// pause the boss for the whole timing window and produce zero body samples.
tunnelBoss.data.roomLockSequence = [];
fs.writeFileSync(output, JSON.stringify(project));
console.log(output);
console.log(dialogueOutput);
