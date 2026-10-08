#!/usr/bin/env node
// Derives a COPY of a Mideas project for MEASURING the resident ROM budget without enemies.
// Never writes next to / over the input and refuses in === out. Paths may be relative (resolved against the cwd).
//
//   node test/msx2-pursuer/strip_enemies_for_budget.mjs <in.json> <out.json>
//        [--soldier]                    add ONE 16x32 scripted enemy (BoinaVerde)          -> "(b2)"
//        [--soldier-room <regex>]       room NAME where it goes (default: the LAST room reachable from the WorldLink world that has NO boss)
//        [--allow-boss-room]            let the soldier go into a room with a 'boss' entity (default: error, see below)
//        [--soldier-tile <x,y>]         top-left cell of the 16x32 body (default 10,9: stands on the row-11 floor)
//        [--keep-enemy-assets]          keep msx2enemy / msx2enemybehavior assets (default: drop the unreferenced ones)
//        [--world <worldAssetId>]       retarget every WorldLink node to this world (to size a bigger game)
//        [--start-room <regex>]         make the (linked) world start in the room whose NAME matches (probe starts in that room)
//        [--keep-enemies]               do NOT remove enemies (only apply the other options; a derivation helper for probes)
//
// Removes every entity of kind 'enemy' from every msx2bitmaproom (bosses, player, doors, items, platforms,
// hidden objects, NPCs... are untouched). Prints one JSON summary line on stdout (warnings also go to stderr).
//
// WHY THE SOLDIER MAY NOT GO INTO A BOSS ROOM
//   The generator hands the bosses their hardware-sprite bullets only when (a) NO room mixes a boss with an
//   enemy (msx2Screen5BitmapRoomGenerator.ts: bossRoomsHaveEnemies) and (b) some room has an enemy (the bullets
//   reuse idle enemy sprite slots: enemyData.maxSlots > 0). A soldier dropped in a boss room breaks (a) and
//   silently turns every boss's sprite bullets off for the whole project, which also changes the ROM budget being
//   measured. The summary therefore carries `bossRoomsWithEnemies` (rooms reachable from the WorldLink world that
//   hold both a boss and an enemy, after this script ran) and a warning when the final project has bosses but
//   no enemy outside the boss rooms.
import fs from 'node:fs';
import path from 'node:path';
import { makeSoldierSpriteAsset, makeSoldierBehaviorAsset, makeSoldierEntity, SOLDIER_SPRITE_ID, SOLDIER_BEHAVIOR_ID } from './pursuer_common.mjs';

const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(['--soldier-room', '--soldier-tile', '--world', '--start-room']);
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && VALUE_FLAGS.has(args[i - 1])));
const flag = n => args.includes(n);
const value = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const die = message => { console.error(`error: ${message}`); process.exit(2); };
const [inPath, outPath] = positional;
if (!inPath || !outPath) {
  console.error('usage: strip_enemies_for_budget.mjs <in.json> <out.json> [--soldier] [--soldier-room re] [--allow-boss-room] [--soldier-tile x,y] [--keep-enemy-assets] [--world id] [--start-room re] [--keep-enemies]');
  process.exit(2);
}
const inAbs = path.resolve(inPath);
const outAbs = path.resolve(outPath);
if (inAbs === outAbs) die('refusing: in === out (the original must never be modified)');
if (!fs.existsSync(inAbs)) die(`input not found: ${inAbs}`);

const project = JSON.parse(fs.readFileSync(inAbs, 'utf8'));
const summary = {
  in: path.basename(inAbs), out: path.basename(outAbs),
  enemiesRemoved: 0, enemiesRemovedByRoom: {}, carryableEnemyKindsRemoved: 0,
  droppedAssets: [], keptAssetsStillReferenced: [], soldier: null, worldRetargeted: null, startRoom: null,
  bossRoomsWithEnemies: [], enemiesOutsideBossRooms: 0, warnings: [],
};

const isBossRoom = room => (room.data?.entities || []).some(e => e?.kind === 'boss');
const enemyCount = room => (room.data?.entities || []).filter(e => e?.kind === 'enemy').length;
/** The rooms the generator will emit: those of the world the (first) WorldLink node points at; every room if there is none. */
function reachableRooms() {
  const rooms = project.assets.filter(a => a.type === 'msx2bitmaproom');
  const flow = project.assets.find(a => a.type === 'msx2gameflow');
  const link = (flow?.data?.nodes || []).find(n => n.type === 'WorldLink');
  const world = project.assets.find(a => a.type === 'worldmap' && a.id === link?.worldAssetId);
  if (!world) return { rooms, linked: false };
  const ids = new Set((world.data?.nodes || []).map(n => n.screenAssetId));
  return { rooms: rooms.filter(r => ids.has(r.id)), linked: true };
}

// 1. Entities: every kind 'enemy'.
for (const asset of project.assets) {
  if (asset.type !== 'msx2bitmaproom' || flag('--keep-enemies')) continue;
  const ents = asset.data.entities || [];
  const kept = ents.filter(e => e.kind !== 'enemy');
  const removed = ents.length - kept.length;
  if (removed) {
    summary.enemiesRemoved += removed;
    summary.enemiesRemovedByRoom[asset.name] = removed;
    summary.carryableEnemyKindsRemoved += ents.filter(e => e.kind === 'enemy' && (e.params?.carryable || e.components?.msx2_carryable?.enabled)).length;
    asset.data.entities = kept;
  }
}

// 2. Optional world retarget (WorldLink nodes of the GameFlow).
if (value('--world')) {
  const flow = project.assets.find(a => a.type === 'msx2gameflow');
  if (!project.assets.some(a => a.type === 'worldmap' && a.id === value('--world'))) die(`--world: no worldmap asset ${value('--world')}`);
  let n = 0;
  for (const node of flow?.data?.nodes || []) if (node.type === 'WorldLink') { node.worldAssetId = value('--world'); n++; }
  summary.worldRetargeted = { id: value('--world'), nodes: n };
}

// 2b. Optional start room (probes): the world's startScreenNodeId points at the node whose room matches.
if (value('--start-room')) {
  const flow = project.assets.find(a => a.type === 'msx2gameflow');
  const link = (flow?.data?.nodes || []).find(n => n.type === 'WorldLink');
  const world = project.assets.find(a => a.type === 'worldmap' && a.id === link?.worldAssetId);
  const re = new RegExp(value('--start-room'));
  const node = (world?.data?.nodes || []).find(n => re.test(project.assets.find(a => a.id === n.screenAssetId)?.name ?? ''));
  if (!node) die(`--start-room: no node of world ${world?.id} matches ${value('--start-room')}`);
  world.data.startScreenNodeId = node.id;
  summary.startRoom = { world: world.id, node: node.id, room: project.assets.find(a => a.id === node.screenAssetId).name };
}

// 3. Enemy / behaviour assets that nothing references any more.
if (!flag('--keep-enemy-assets') && !flag('--keep-enemies')) {
  const candidates = project.assets.filter(a => a.type === 'msx2enemy' || a.type === 'msx2enemybehavior');
  const dropIds = new Set();
  const others = a => project.assets.filter(x => x !== a);
  for (const c of candidates) {
    const needle = JSON.stringify(c.id);
    const referenced = others(c).some(a => (a.type !== 'msx2enemy' && a.type !== 'msx2enemybehavior') && JSON.stringify(a).includes(needle))
      || JSON.stringify(project.entityTemplates ?? '').includes(needle)
      || JSON.stringify(project.enemyDefinitions ?? '').includes(needle);
    if (referenced) summary.keptAssetsStillReferenced.push(`${c.type}:${c.name}`);
    else { summary.droppedAssets.push(`${c.type}:${c.name}`); dropIds.add(c.id); }
  }
  project.assets = project.assets.filter(a => !dropIds.has(a.id));
}

// 4. One scripted 16x32 soldier.
if (flag('--soldier')) {
  const rooms = project.assets.filter(a => a.type === 'msx2bitmaproom');
  const reach = reachableRooms();
  const reachableIds = new Set(reach.rooms.map(r => r.id));
  let room;
  if (value('--soldier-room')) {
    const re = new RegExp(value('--soldier-room'));
    room = rooms.find(r => re.test(r.name));
    if (!room) die(`--soldier-room: no room name matches /${value('--soldier-room')}/`);
    if (isBossRoom(room) && !flag('--allow-boss-room')) {
      die(`--soldier-room /${value('--soldier-room')}/ is the boss room "${room.name}". A soldier there makes the generator drop the hardware-sprite bullets of EVERY boss `
        + '(a room that mixes a boss with an enemy disables them). Pick a room without a boss, or pass --allow-boss-room if that is what you want to measure.');
    }
  } else {
    // The LAST reachable room that has no boss (the first rooms of a world are often boss arenas).
    room = [...rooms].reverse().find(r => reachableIds.has(r.id) && !isBossRoom(r));
    if (!room) {
      if (!flag('--allow-boss-room')) die('--soldier: every room reachable from the WorldLink world has a boss. Name a room with --soldier-room, or pass --allow-boss-room.');
      room = [...rooms].reverse().find(r => reachableIds.has(r.id)) ?? rooms[0];
    }
  }
  if (!room) die('--soldier: no msx2bitmaproom in the project');
  const reachable = reach.linked ? reachableIds.has(room.id) : true;
  if (!reachable) summary.warnings.push(`the soldier room "${room.name}" is not reachable from the WorldLink world: the generator will not emit it, so the measurement will not contain the soldier`);
  const [tx, ty] = (value('--soldier-tile') || '10,9').split(',').map(Number);
  project.assets.push(makeSoldierSpriteAsset(), makeSoldierBehaviorAsset());
  room.data.entities = [...(room.data.entities || []), makeSoldierEntity({ id: 'msx2_enemy_pursuer_boina_verde_1', tileX: tx, tileY: ty })];
  summary.soldier = { room: room.name, roomId: room.id, tile: [tx, ty], spriteId: SOLDIER_SPRITE_ID, behaviorId: SOLDIER_BEHAVIOR_ID, bossRoom: isBossRoom(room), reachable };
}

// 5. What the generator will see about bosses and enemies (computed on the FINAL project, over the rooms it emits).
{
  const { rooms } = reachableRooms();
  const bossRooms = rooms.filter(isBossRoom);
  summary.bossRoomsWithEnemies = bossRooms.filter(r => enemyCount(r) > 0).map(r => r.name);
  summary.enemiesOutsideBossRooms = rooms.filter(r => !isBossRoom(r)).reduce((n, r) => n + enemyCount(r), 0);
  if (summary.bossRoomsWithEnemies.length) {
    summary.warnings.push(`boss and enemy share a room (${summary.bossRoomsWithEnemies.join(', ')}): the generator disables the hardware-sprite bullets of every boss in the project`);
  }
  if (bossRooms.length && summary.enemiesOutsideBossRooms === 0) {
    summary.warnings.push('the boss sprite bullets need >= 1 enemy OUTSIDE the boss rooms (they reuse idle enemy sprite slots): with none, the bosses fire no sprite bullets and the ROM drops that whole runtime, so its size is NOT representative of a game that has them');
  }
}

fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, JSON.stringify(project));
for (const w of summary.warnings) console.error(`warning: ${w}`);
console.log(JSON.stringify(summary));
