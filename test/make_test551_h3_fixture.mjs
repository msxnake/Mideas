import fs from 'node:fs';

// H3 fixture: enter the boss room through a REAL room transition.
//
// The fight fixture boots the player straight into the boss room, which is
// exactly how the [016] false closure happened: a direct spawn never leaves a
// previous room on the hidden page, so restore_strips copying garbage from it
// was invisible. This fixture boots into the boss room's authored PREDECESSOR
// ("caverna1 Este Norte Norte Norte Norte") and redirects the next node of the
// boot surface to the boss room, so walking east fires a genuine
// start_room_transition -> hidden-page composition -> flip.
//
// Why redirecting pan1/pan2 works: room 0's east rail comes from the boot
// surface's connections (pan1 -east-> pan2), not from the room data, so the
// room placed at index 1 is reached by the east edge regardless of which room
// asset actually sits there.
const input = 'C:/Users/salam/Downloads/test551.json';
const output = 'C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_h3_fixture.json';
const project = JSON.parse(fs.readFileSync(input, 'utf8'));

const PREDECESSOR_ID = 'msx2bitmaproom_1785347065413_east_north_north_north_north';
const BOSS_ROOM_ID = 'msx2bitmaproom_1785347065413_east_north_north_north_north_east';
const surface = project.assets.find(asset => asset.id === 'worldmap_1781958895943');
const tunnelBoss = project.assets.find(asset => asset.id === 'msx2boss_1786877495004');
if (!surface || !tunnelBoss) throw new Error('H3 fixture assets not found');

const startNode = surface.data.nodes[0];
const eastNode = surface.data.nodes[1];
if (!eastNode || eastNode.id !== 'wmnode_bitmap_room_bitmapPlatform_mymsxgame_east') {
  throw new Error(`expected pan2 as node 1, found ${eastNode && eastNode.id}`);
}
startNode.screenAssetId = PREDECESSOR_ID;
startNode.name = 'H3 predecessor (caverna1 Este Norte Norte Norte Norte)';
eastNode.screenAssetId = BOSS_ROOM_ID;
eastNode.name = 'H3 boss room (caverna1 ... Este)';
surface.data.startScreenNodeId = startNode.id;

// Fight semantics: the boss must patrol immediately, so the authored Room Lock
// dialogue cannot pause it during the measurement window.
tunnelBoss.data.roomLockSequence = [];

// Booting into a Caverna2 room whose collectibles live in banked data hangs the
// machine in bitmap_apply_gems_for_current_room -> bitmap_gem_launch_cmd ->
// vdp_wait_cmd_ready (stack captured in test/test551_h3_stack.tcl): a VDP
// command with garbage operands never completes. The boss room has no
// collectibles, which is why every earlier fixture dodged this. The H3
// measurement does not need predecessor gems, so drop them here and report the
// hang separately in the channel.
const predecessor = project.assets.find(asset => asset.id === PREDECESSOR_ID);
const before = (predecessor.data.entities || []).length;
predecessor.data.entities = (predecessor.data.entities || []).filter(e => e.kind !== 'collectible');
console.log(`predecessor collectibles stripped: ${before} -> ${predecessor.data.entities.length} entities`);

fs.writeFileSync(output, JSON.stringify(project));
console.log(output);
