import fs from 'node:fs';

// Gem-route fixture: is the gem hang exclusive to the BOOT path, or does the
// REAL room-entry path (start_room_transition -> hidden-page composition ->
// flip -> commit loaders) hang too?
//
// pan1 -> predecessor with its 2 collectibles STRIPPED so the machine boots
// and the player can walk; pan2 -> "caverna1" (the Caverna2 root room, 7
// collectibles) so the east rail leads into a gem room through a genuine
// transition. test551_gemroute.tcl then reports whether the machine survives
// the entry.
const input = 'C:/Users/salam/Downloads/test551.json';
const output = 'C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_gemroute_fixture.json';
const project = JSON.parse(fs.readFileSync(input, 'utf8'));

const PREDECESSOR_ID = 'msx2bitmaproom_1785347065413_east_north_north_north_north';
const GEM_ROOM_ID = 'msx2bitmaproom_1785347065413';
const surface = project.assets.find(asset => asset.id === 'worldmap_1781958895943');
if (!surface) throw new Error('gemroute fixture: surface not found');

const startNode = surface.data.nodes[0];
const eastNode = surface.data.nodes[1];
if (!eastNode || eastNode.id !== 'wmnode_bitmap_room_bitmapPlatform_mymsxgame_east') {
  throw new Error(`gemroute: expected pan2 as node 1, found ${eastNode && eastNode.id}`);
}
startNode.screenAssetId = PREDECESSOR_ID;
startNode.name = 'gemroute boot (gems stripped)';
eastNode.screenAssetId = GEM_ROOM_ID;
eastNode.name = 'gemroute target: caverna1 (7 gems)';
surface.data.startScreenNodeId = startNode.id;

const predecessor = project.assets.find(asset => asset.id === PREDECESSOR_ID);
const before = (predecessor.data.entities || []).length;
predecessor.data.entities = (predecessor.data.entities || []).filter(e => e.kind !== 'collectible');
console.log(`boot room collectibles stripped: ${before} -> ${predecessor.data.entities.length} entities`);

fs.writeFileSync(output, JSON.stringify(project));
console.log(output);
