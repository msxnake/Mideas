#!/usr/bin/env node
// Builds test/msx2-pursuer/pursuer_alert_lab.json: the 4-room pursuer lab (A - B - C - D) with the ALERT ZONE mechanic switched on.
// Derived READ-ONLY from pursuer_lab.json (never writes it, refuses out === lab):
//
//   * rooms B ("sentido") and C ("pasillo") get data.runtime.alertZone = { enabled, spawnDelaySec: 2, guardPx: 32 };
//   * the BoinaVerde that used to patrol C as a plain scripted enemy is REMOVED from C; the soldier is now the one msx2enemy asset
//     with data.pursuer.enabled = true (same 16x32 stackVertical sprite, same `rules` program), which the generator puts in every
//     alert room by itself, hidden, and shows at the entry door when the countdown ends;
//   * a minimal GameFlow (Start -> WorldLink) so the ROM boots through the WorldLink dispatcher, the production path of a real game
//     (the boot init that places the player runs inside the dispatcher, not inline).
//
//   node test/msx2-pursuer/make_pursuer_alert_lab.mjs [--out file.json] [--lab pursuer_lab.json] [--start-room A|B|C|D]
//        [--alert-rooms B,C] [--delay <seconds>] [--guard <px>] [--no-worldlink]
//
// --start-room moves the world start (the room the game boots in). Rooms: A entrada, B sentido, C pasillo, D reja.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOLDIER_SPRITE_ID, SOLDIER_BEHAVIOR_ID } from './pursuer_common.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const value = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const flag = name => args.includes(name);

const labPath = path.resolve(value('--lab', path.join(here, 'pursuer_lab.json')));
const outPath = path.resolve(value('--out', path.join(here, 'pursuer_alert_lab.json')));
if (labPath === outPath) { console.error('refusing: --out is the input lab (the lab is read-only)'); process.exit(2); }

const ROOM_IDS = { A: 'pursuer_lab_a', B: 'pursuer_lab_b', C: 'pursuer_lab_c', D: 'pursuer_lab_d' };
const startRoom = value('--start-room', 'A').toUpperCase();
if (!ROOM_IDS[startRoom]) { console.error(`--start-room must be one of ${Object.keys(ROOM_IDS).join(', ')}`); process.exit(2); }
const alertRooms = value('--alert-rooms', 'B,C').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
for (const r of alertRooms) if (!ROOM_IDS[r]) { console.error(`--alert-rooms: unknown room ${r}`); process.exit(2); }
const delaySec = Number(value('--delay', '2'));
const guardPx = Number(value('--guard', '32'));

const project = JSON.parse(fs.readFileSync(labPath, 'utf8'));
const assetById = id => project.assets.find(a => a.id === id);

// 1. Alert zones; the plain BoinaVerde leaves room C.
for (const letter of alertRooms) {
  const room = assetById(ROOM_IDS[letter]);
  if (!room) throw new Error(`lab has no room ${ROOM_IDS[letter]}`);
  room.data.runtime = { ...(room.data.runtime || {}), alertZone: { enabled: true, spawnDelaySec: delaySec, guardPx } };
}
const roomC = assetById(ROOM_IDS.C);
const before = roomC.data.entities.length;
roomC.data.entities = roomC.data.entities.filter(e => e.id !== 'pursuer_lab_boina_verde');
if (roomC.data.entities.length !== before - 1) throw new Error('room C did not contain the plain BoinaVerde (is this the pursuer_lab.json?)');
roomC.data.notes = 'Corridor: rows 9-10 open end to end. ALERT ZONE: the pursuer soldier appears at the entry door after the countdown.';

// 2. The soldier as an enemy asset (what the editor will author in a later phase).
const soldierId = 'msx2enemy_pursuer_boina_verde';
project.assets.push({
  id: soldierId,
  name: 'BoinaVerde',
  type: 'msx2enemy',
  data: {
    enemyId: 'pursuer_boina_verde',
    assetId: soldierId,
    name: 'BoinaVerde',
    world: 'common',
    behaviorGroup: 'common_entities',
    category: 'simpleEnemy',
    scope: 'common',
    logicUpdateIntervalFrames: 2,
    behavior: { type: 'CustomBehavior', behaviorAssetId: SOLDIER_BEHAVIOR_ID },
    attack: { type: 'DamageOnTouch' },
    render: {
      renderMode: 'hardwareSprite',
      spriteId: SOLDIER_SPRITE_ID,
      palette: '',
      size: '16x32',
      animations: { walk: { frames: [0, 1], speed: 8, loop: true } },
      roles: [{ id: 'walk', label: 'Walk', state: 'Walk', behavior: 'CustomBehavior', attack: 'DamageOnTouch', spriteId: SOLDIER_SPRITE_ID, animation: 'walk', frames: [0, 1], speed: 8, loop: true, notes: '' }],
    },
    hitboxes: { body: { x: 3, y: 2, w: 10, h: 30 }, damage: { x: 0, y: 0, w: 16, h: 32 } },
    stats: { hp: 1, damage: 1, invulnerabilityFrames: 0, knockback: 0 },
    sound: { onSpawn: null, onAttack: null, onHit: null, onDeath: null, onBounce: null, onDespawn: null },
    spawnParamsSchema: [],
    requiredRoutines: [],
    budget: { cpu: 2, sprites: 2, ram: 0, codePackage: 'common_entity_code', graphicsPackage: 'common_enemy_gfx', graphicsBank: 'auto', ramPackage: '' },
    pursuer: { enabled: true },
  },
});

// 3. World start room.
const world = project.assets.find(a => a.type === 'worldmap');
const startNode = world.data.nodes.find(n => n.screenAssetId === ROOM_IDS[startRoom]);
if (!startNode) throw new Error(`world has no node for room ${startRoom}`);
world.data.startScreenNodeId = startNode.id;

// 4. Minimal GameFlow: Start -> WorldLink(world).
if (!flag('--no-worldlink')) {
  project.assets.push({
    id: 'pursuer_alert_lab_gameflow',
    name: 'Pursuer alert lab flow',
    type: 'msx2gameflow',
    data: {
      id: 'pursuer_alert_lab_gameflow', name: 'Pursuer alert lab flow', target: 'MSX2', purpose: 'screen4-bitmap-runtime',
      startNodeId: 'gf_start', panOffset: { x: 0, y: 0 }, zoomLevel: 1,
      nodes: [
        { id: 'gf_start', type: 'Start', position: { x: 70, y: 110 } },
        { id: 'gf_worldlink', type: 'WorldLink', position: { x: 300, y: 110 }, worldAssetId: world.id },
        { id: 'gf_end', type: 'End', position: { x: 530, y: 110 }, title: 'End', message: 'THE END', waitForKey: true, waitFrames: 0 },
      ],
      connections: [
        { id: 'gfc_1', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_worldlink' } },
        { id: 'gfc_2', from: { nodeId: 'gf_worldlink' }, to: { nodeId: 'gf_end' } },
      ],
    },
  });
}

project.name = 'Pursuer Alert Lab';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 1)}\n`);
console.log(`wrote ${outPath}  (${project.assets.length} assets; alert rooms ${alertRooms.join(',')} ${delaySec}s guard ${guardPx}px; start ${startRoom}; worldlink ${!flag('--no-worldlink')})`);
