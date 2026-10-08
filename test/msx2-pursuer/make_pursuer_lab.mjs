#!/usr/bin/env node
// Builds test/msx2-pursuer/pursuer_lab.json: a 4-room geometry lab for the "Soldado perseguidor"
// (Boina Verde) of Back to Mars. It contains ONLY what the engine supports today: no alertZone,
// no pursuer, no new mechanic. The BoinaVerde is a normal 16x32 scripted enemy (walk + turn).
//
//   node test/msx2-pursuer/make_pursuer_lab.mjs [out.json]      (default: test/msx2-pursuer/pursuer_lab.json)
//
// Starts from the tracked fixture test/msx2-behavior/fixture_scripted_enemy.json (a bitmap-room project
// that compiles): keeps its tile atlas/palette, HUD font and room "runtime" block; replaces the rooms,
// the world, the player (16x32, same physics/hitbox as Back to Mars) and the behaviour.
//
// Rooms in a row, A - B - C - D (cell grid 16x12, 16 px cells, floor = row 11 = y 176, solid byte #10,
// one-way platform byte #20). The player is 16x32 (hitbox 9x29 at 3,3), apex of a jump = 64 px = 4 cells:
//   A "entrada"   low (row 8, cols 5-7: 3 cells above the floor) and high (row 5, cols 9-11) platforms
//   B "sentido"   solid ledge (row 8, cols 4-5) continued by a one-way platform (row 8, cols 6-10) + a carry_and_throw
//                 object on the floor. NOTE (measured in OpenMSX): a one-way cell cannot be crossed from BELOW, the head probe
//                 of bitmap_try_move_y (bitmap_probe_floor, Y = y+3) stops in its top 4 px; it is reached by walking from the ledge.
//   C "pasillo"   open row: rows 9-10 free from edge to edge under a slab (row 8), BoinaVerde patrols it
//   D "reja"      wall at col 10 closed by a 16x32 grille (door, NO transition); the latched pressure plate sits on a ledge
//                 (row 8, cols 3-5) you must jump onto. The grille needs a key nobody has, so only the plate opens it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeHumanoidSpriteAsset, makeSoldierSpriteAsset, makeSoldierBehaviorAsset, makeSoldierEntity, LAB_PLAYER_COLORS, SOLDIER_SPRITE_ID, SOLDIER_BEHAVIOR_ID } from './pursuer_common.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('usage: node test/msx2-pursuer/make_pursuer_lab.mjs [out.json]   (default: test/msx2-pursuer/pursuer_lab.json)');
  process.exit(0);
}
if (args.length > 1 || args.some(a => a.startsWith('-'))) {
  console.error(`make_pursuer_lab: unexpected argument(s): ${args.join(' ')}`);
  console.error('usage: node test/msx2-pursuer/make_pursuer_lab.mjs [out.json]');
  process.exit(2);
}
const outPath = args[0] ? path.resolve(args[0]) : path.join(here, 'pursuer_lab.json');
const base = JSON.parse(fs.readFileSync(path.join(root, 'test', 'msx2-behavior', 'fixture_scripted_enemy.json'), 'utf8'));

const COLS = 16, ROWS = 12;
const SOLID = 0x10, ONEWAY = 0x20;
const FLOOR_ROW = ROWS - 1;                       // 11
const PLAYER_ID = 'pursuer_lab_player';
const PLAYER_SPRITE_ID = 'pursuer_lab_player_sprite';

// ---- tile atlas: keep the fixture's, add two 16x32 entries (grille closed / open) in a 32-row atlas ----
const baseRoom = base.assets.find(a => a.id === 'bitmap_room_smoke').data;
const atlas = JSON.parse(JSON.stringify(baseRoom.atlas));
while (atlas.pixels.length < 32) atlas.pixels.push(new Array(atlas.width).fill(0));
atlas.height = 32;
const WALL_INK = 4;       // palette slot of the back wall (same one the fixture fills with)
const BAR_INK = 14;       // light grey bars
for (let y = 0; y < 32; y++) {
  for (let x = 0; x < 16; x++) {
    // closed grille: vertical bars every 4 px, a horizontal rail every 8 rows, black behind the bars
    const bar = (x % 4 === 1 || x % 4 === 2);
    atlas.pixels[y][144 + x] = (bar || y % 8 === 0) ? BAR_INK : 1;
    // open grille: the back wall colour again (nothing in the way)
    atlas.pixels[y][160 + x] = WALL_INK;
  }
}
atlas.entries.push(
  { id: 'reja_closed', name: 'Reja cerrada 16x32', sx: 144, sy: 0, w: 16, h: 32 },
  { id: 'reja_open', name: 'Reja abierta 16x32', sx: 160, sy: 0, w: 16, h: 32 },
);
const entryIndex = id => atlas.entries.findIndex(e => e.id === id);
const tileValue = id => entryIndex(id) + 1;      // tileGrid cell = atlas entry index + 1, 0 = empty

// ---- room builder ----
const grid = (fill = 0) => Array.from({ length: ROWS }, () => new Array(COLS).fill(fill));
function newRoom(id, name) {
  return { id, name, collision: grid(), tiles: grid(), entities: [], playerEntries: [], keyItems: [], notes: '' };
}
const put = (room, x, y, flag, tile) => { room.collision[y][x] = flag; room.tiles[y][x] = tile ? tileValue(tile) : 0; };
const hline = (room, y, x0, x1, flag, tile) => { for (let x = x0; x <= x1; x++) put(room, x, y, flag, tile); };
const vline = (room, x, y0, y1, flag, tile) => { for (let y = y0; y <= y1; y++) put(room, x, y, flag, tile); };
/** Floor on row 11, ceiling on row 0, side walls except the cells where a neighbour room connects (rows 8-10). */
function shell(room, { west, east }) {
  hline(room, FLOOR_ROW, 0, COLS - 1, SOLID, 'brick_red');
  hline(room, 0, 0, COLS - 1, SOLID, 'brick_red');
  if (!west) vline(room, 0, 1, FLOOR_ROW - 1, SOLID, 'brick_red'); else vline(room, 0, 1, 7, SOLID, 'brick_red');
  if (!east) vline(room, COLS - 1, 1, FLOOR_ROW - 1, SOLID, 'brick_red'); else vline(room, COLS - 1, 1, 7, SOLID, 'brick_red');
}

const ids = ['pursuer_lab_a', 'pursuer_lab_b', 'pursuer_lab_c', 'pursuer_lab_d'];
const A = newRoom(ids[0], 'Lab A entrada');
const B = newRoom(ids[1], 'Lab B sentido');
const C = newRoom(ids[2], 'Lab C pasillo');
const D = newRoom(ids[3], 'Lab D reja');

// A: low platform (3 cells above floor: row 8 top at y 128 = 48 px over the floor) and high platform (row 5, y 80)
shell(A, { west: false, east: true });
hline(A, 8, 5, 7, SOLID, 'brick_orange');
hline(A, 5, 9, 11, SOLID, 'brick_orange');
A.playerEntries = [{ id: 'spawn0', x: 32, y: 144, facing: 'right', playerId: PLAYER_ID }];
A.notes = 'Entry. Low platform row 8 (cols 5-7), high platform row 5 (cols 9-11).';

// B: solid ledge (row 8, cols 4-5) continued by a one-way platform (row 8, cols 6-10); reach it from the ledge.
//    A carry_and_throw object on the floor.
shell(B, { west: true, east: true });
hline(B, 8, 4, 5, SOLID, 'brick_orange');
hline(B, 8, 6, 10, ONEWAY, 'brick_cyan');
B.entities.push({
  id: 'lab_carry_box', name: 'Lab carry object', kind: 'carryable', position: { x: 12, y: 10 },
  components: { msx2_carryable: { enabled: true }, msx2_hardware_sprite: { msx2SpriteAssetId: 'smoke_player_sprite' } },
  params: { carryableRenderMode: 'bitmap_sprite', carryableBitmapAtlasEntryId: 'carryable_multicolor' },
});
B.playerEntries = [{ id: 'spawn0', x: 32, y: 144, facing: 'right', playerId: PLAYER_ID }];
B.notes = 'Solid ledge row 8 (cols 4-5) + one-way platform row 8 (cols 6-10); carryable object on the floor at cell (12,10).';

// C: open-row corridor. Rows 9-10 are free from edge to edge; a slab on row 8 (cols 1-14) roofs it.
shell(C, { west: true, east: true });
hline(C, 8, 1, 14, SOLID, 'brick_magenta');
C.entities.push(makeSoldierEntity({ id: 'pursuer_lab_boina_verde', name: 'BoinaVerde', tileX: 10, tileY: 9, minX: 16, maxX: 224 }));
C.playerEntries = [{ id: 'spawn0', x: 32, y: 144, facing: 'right', playerId: PLAYER_ID }];
C.notes = 'Corridor: rows 9-10 open end to end (long line of sight), slab on row 8. BoinaVerde 16x32 patrols it (scripted walk + turn).';

// D: wall at col 10 (rows 1-8) over a 2-cell gap (rows 9-10) closed by a 16x32 grille; a latched pressure plate on a
//    ledge opens it (the plate must NOT be on the walking path or it opens by itself).
shell(D, { west: true, east: false });
hline(D, 8, 3, 5, SOLID, 'brick_orange');
vline(D, 10, 1, 8, SOLID, 'brick_orange');
D.entities.push({
  id: 'lab_gate', name: 'Lab grille', kind: 'door', position: { x: 10, y: 9 },
  components: { msx2_transform: {}, msx2_door_exit: { locked: true } },
  params: {
    runtime: 'MSX2', engine: 'door',
    lockedDoor: { enabled: true, requiredKeyId: 'lab_no_key', consumeKey: false, openOnce: true, closedAtlasEntryId: 'reja_closed', openAtlasEntryId: 'reja_open', targetRoomId: '', targetEntryId: '' },
  },
}, {
  id: 'lab_plate', name: 'Lab pressure plate', kind: 'custom', position: { x: 4, y: 7 },
  components: { msx2_transform: {}, msx2_pressure_button: { enabled: true, targetDoorId: 'lab_gate', actors: 'playerAndEnemies', latch: true, atlasEntryId: 'brick_yellow', pressedAtlasEntryId: 'brick_green' } },
  params: { runtime: 'MSX2', engine: 'pressureButton', pressureButton: { enabled: true, targetDoorId: 'lab_gate', actors: 'playerAndEnemies', latch: true, atlasEntryId: 'brick_yellow', pressedAtlasEntryId: 'brick_green' } },
});
// A door whose key id is not defined anywhere opens on contact (required mask 0). An id that exists but is never
// picked up keeps the grille shut until the pressure plate sets its open flag.
D.keyItems = [{ id: 'lab_no_key', name: 'Unobtainable key (the grille only opens with the plate)', bitIndex: 7, color: 14, persistent: true }];
D.playerEntries = [{ id: 'spawn0', x: 32, y: 144, facing: 'right', playerId: PLAYER_ID }];
D.notes = 'Grille (door without target room = NO_TRANSITION) at cell (10,9), 16x32; latched pressure plate at cell (4,7) on a solid ledge (row 8, cols 3-5).';

// ---- composition: dark wall + a 1 px grid every 16 px so screenshots show the cell geometry ----
function composition() {
  const cmds = [{ id: 'wall', op: 'fill', x: 0, y: 0, w: 256, h: 192, color: 4 }];
  for (let c = 1; c < COLS; c++) cmds.push({ id: `grid_v_${c}`, op: 'fill', x: c * 16, y: 0, w: 1, h: 192, color: 5 });
  for (let r = 1; r < ROWS; r++) cmds.push({ id: `grid_h_${r}`, op: 'fill', x: 0, y: r * 16, w: 256, h: 1, color: 5 });
  return { source: 'authored', commands: cmds };
}

function toAsset(room) {
  const data = {
    id: room.id, name: room.name, target: 'MSX2', vdpMode: 'SCREEN5_BITMAP_ROOM', width: 256, height: 192,
    palette: JSON.parse(JSON.stringify(baseRoom.palette)), backgroundColor: baseRoom.backgroundColor,
    atlas: JSON.parse(JSON.stringify(atlas)),
    composition: composition(),
    tileGrid: room.tiles, collision: room.collision,
    effects: grid(), behavior: grid(),
    entities: room.entities, playerEntries: room.playerEntries,
    runtime: JSON.parse(JSON.stringify(baseRoom.runtime)),
    keyItems: room.keyItems,
    notes: room.notes,
  };
  return { id: room.id, name: room.name, type: 'msx2bitmaproom', data };
}
const rooms = [A, B, C, D];

// ---- world: A - B - C - D, east/west connections ----
const world = {
  id: 'pursuer_lab_world', name: 'Pursuer Lab World', type: 'worldmap',
  data: {
    id: 'pursuer_lab_world', name: 'Pursuer Lab World',
    nodes: rooms.map((r, i) => ({ id: `wmnode_${r.id}`, screenAssetId: r.id, name: r.name, position: { x: i * 220, y: 0 } })),
    connections: rooms.slice(0, -1).map((r, i) => ({ id: `wmconn_${i}`, fromNodeId: `wmnode_${r.id}`, toNodeId: `wmnode_${rooms[i + 1].id}`, fromDirection: 'east', toDirection: 'west' })),
    startScreenNodeId: `wmnode_${ids[0]}`,
  },
};

// ---- player: Back to Mars physics/hitbox (test730): jump 8 px/f (jumpPower 2048), gravity capped 0.5, terminal 6, coyote 6, buffer 3 ----
const playerAsset = {
  id: PLAYER_ID, name: 'Pursuer Lab Player', type: 'msx2player',
  data: {
    schema: 'mideas.msx2.player', schemaVersion: 1, generatedBy: 'make_pursuer_lab.mjs',
    player: {
      identity: { id: PLAYER_ID, name: 'Pursuer Lab Player', target: 'MSX2', gameType: 'platform', defaultFacing: 'right' },
      render: { mode: 'hardwareSprite', spriteSize: '16x32', usesFlipX: true, spriteAssetId: PLAYER_SPRITE_ID },
      hitboxes: { body: { x: 3, y: 3, w: 9, h: 29 }, feet: { x: 3, y: 30, w: 10, h: 2 }, interaction: { x: -4, y: 4, w: 24, h: 24 } },
      movement: { model: 'platform', moveSpeed: 2, acceleration: 1, deceleration: 1, gravity: 1, maxFallSpeed: 6, jumpPower: 10, coyoteTime: 4, jumpBuffer: 4, airControl: true },
      controls: {
        directions: { left: { enabled: true, inputSource: 'arrows' }, right: { enabled: true, inputSource: 'arrows' }, up: { enabled: true, inputSource: 'arrows' }, down: { enabled: false, inputSource: 'arrows' } },
        buttons: { A: { slot: 'jump', enabled: true, binding: 'spc', label: 'Key SPC' }, B: { slot: 'attack', enabled: true, binding: 'n', label: 'Key N' } },
      },
      health: { maxHealth: 5, lives: 3, invulnerabilityFrames: 60, knockbackX: 8, knockbackY: 4, deadlyInstantRespawn: false },
      interaction: { mode: 'pressUp', box: { x: -4, y: 4, w: 24, h: 24 } },
      activeSkills: ['carry_and_throw'],
      skillBindings: {},
      skillParameters: {
        jump: { coyoteTime: 6, enabled: true, jumpPower: 2048, requireKeyRelease: true, jumpBuffer: 3 },
        carry_and_throw: { throwSpeed: 12, throwVertical: 8, throwGravity: 1, throwCooldown: 30, pickupRadius: 20, objectCollision: true, enemyCollision: true },
      },
    },
  },
};

// ---- assemble from the fixture: keep HUD font + smoke sprite (the carryable references it); drop its rooms/world/player/behaviour ----
const keep = base.assets.filter(a => a.type === 'msx2hudfont' || a.id === 'smoke_player_sprite');
const project = {
  name: 'Pursuer Lab',
  currentScreenMode: base.currentScreenMode,
  screenMode: base.screenMode,
  targetGraphicsBackend: base.targetGraphicsBackend,
  assets: [
    ...rooms.map(toAsset),
    world,
    ...keep,
    makeHumanoidSpriteAsset(PLAYER_SPRITE_ID, 'Pursuer Lab Player', LAB_PLAYER_COLORS),
    playerAsset,
    makeSoldierSpriteAsset(),
    makeSoldierBehaviorAsset(),
  ],
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 1)}\n`);
console.log(`wrote ${path.relative(root, outPath)}  (${project.assets.length} assets, ${rooms.length} rooms, soldier sprite=${SOLDIER_SPRITE_ID} behaviour=${SOLDIER_BEHAVIOR_ID})`);
