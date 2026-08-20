import fs from 'node:fs';

// Gem-hang boot fixture: identical to the H3 fixture EXCEPT the predecessor's
// collectibles are LEFT IN. Boots a Caverna2 room with banked gem records so
// the gem-apply path runs at boot; the machine hangs in
// bitmap_gem_launch_cmd -> vdp_wait_cmd_ready (stack captured in
// test/test551_h3_stack.tcl). Used by test551_gemblock.tcl to dump the exact
// VDP command block that never completes.
const input = 'C:/Users/salam/Downloads/test551.json';
const output = 'C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_gemboot_fixture.json';
const project = JSON.parse(fs.readFileSync(input, 'utf8'));

const PREDECESSOR_ID = 'msx2bitmaproom_1785347065413_east_north_north_north_north';
const surface = project.assets.find(asset => asset.id === 'worldmap_1781958895943');
if (!surface) throw new Error('gemboot fixture: surface not found');
const startNode = surface.data.nodes[0];
startNode.screenAssetId = PREDECESSOR_ID;
startNode.name = 'gemboot predecessor (gems kept)';
surface.data.startScreenNodeId = startNode.id;

fs.writeFileSync(output, JSON.stringify(project));
console.log(output);
