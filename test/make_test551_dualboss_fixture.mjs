import fs from 'node:fs';

// Dual-boss fixture: two independent 16x16 bitmap bosses in one room, each
// with its own Path asset, firing lasers in N/S/E/W — the cooperation task
// opened in exchange.txt on 2026-08-21 ([001]..[006]).
//
// The project has NO 16x16 stamp (smallest boss art is Boss_Drone 80x48), so
// this fixture SYNTHESIZES one: a 1x1 stamp cloned from Boss_Drone's first
// cell (tile_0 is exactly 16x16 with its own palette). Data-only, my side;
// generators stay Codex's.
//
// PLACEHOLDER pending Codex's authoring surface (channel [006]): the laser
// pattern name. Tuneladora uses bossProjectilePattern "fallingRocks"; the
// 4-direction laser pattern will get its own name — adjust PATTERN below when
// Codex publishes it, nothing else should need to change.
const PATTERN = process.env.DUALBOSS_PATTERN || 'crossLasers';

const input = 'C:/Users/salam/Downloads/test551.json';
const output = 'C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_dualboss_fixture.json';
const project = JSON.parse(fs.readFileSync(input, 'utf8'));

// ---- 1. synthesized 16x16 stamp ---------------------------------------------
const droneAsset = project.assets.find(a => a.id === 'boss_drone_1785058523184');
if (!droneAsset) throw new Error('dualboss: Boss_Drone stamp not found');
const droneStamp = droneAsset.data.stamp;
const stampId = `dualboss16_${Date.now()}`;
const stampAsset = {
  id: stampId,
  name: 'dualboss16',
  type: 'msx2bitmapstamp',
  data: {
    id: stampId,
    name: 'dualboss16',
    savedAt: new Date().toISOString(),
    palette: droneAsset.data.palette,
    stamp: {
      id: stampId,
      name: 'dualboss16',
      mode: droneStamp.mode,
      columns: 1,
      rows: 1,
      tileWidth: 16,
      tileHeight: 16,
      sourceType: droneStamp.sourceType,
      paletteId: droneStamp.paletteId,
      tiles: [droneStamp.tiles[0]],   // Boss_Drone_r0_c0: 16x16, self-contained
      createdAt: droneStamp.createdAt,
      updatedAt: new Date().toISOString(),
    },
  },
};
project.assets.push(stampAsset);

// ---- 2. two Path assets (disjoint horizontal patrol bands) -------------------
const mkPath = (name, ax, ay, bx, by, phase) => ({
  id: `msx2bosspath_dual_${phase}`,
  name,
  type: 'msx2bosspath',
  data: {
    id: `msx2bosspath_dual_${phase}`,
    name,
    nodes: [
      { id: `${phase}_a`, x: ax, y: ay, actions: [] },
      { id: `${phase}_b`, x: bx, y: by, actions: [] },
    ],
    speedPxPerTick: 1,
    loopMode: 'loop',
    firing: 'auto',
  },
});
// Boss A patrols the upper band left-right; boss B the lower band, mirrored,
// so their patrol phases start opposed (cheap staggering per channel [004]).
project.assets.push(mkPath('dualboss_path_A', 48, 64, 120, 64, 'a'));
project.assets.push(mkPath('dualboss_path_B', 192, 144, 120, 144, 'b'));

// ---- 3. two boss entities in the boot room ----------------------------------
const BOSS_ROOM_ID = 'msx2bitmaproom_1785347065413_east_north_north_north_north_east';
const surface = project.assets.find(asset => asset.id === 'worldmap_1781958895943');
const bossRoom = project.assets.find(asset => asset.id === BOSS_ROOM_ID);
if (!surface || !bossRoom) throw new Error('dualboss: surface/room not found');

const bossParams = (pathId, tag) => ({
  runtime: 'MSX2',
  engine: 'bitmapBoss',
  movement: 'patrolX',
  direction: 1,
  bossStampAssetId: stampId,
  bossAtlasEntryId: '',
  bossFrames: 1,
  bossAnimDelay: 12,
  bossHp: 4,
  bossDamage: 1,
  bossInterval: 3,
  bossMovement: 'patrolX',
  bossSpeed: 1,
  bossRangePx: 0,
  bossBarrierTileId: '',
  // Lasers: bitmap projectiles per the agreed design ([003]/[005]); interval
  // >= 2.5 s/direction keeps simultaneous lasers ~5-6 (channel [004] budget).
  bossProjectileKind: 'bitmap',
  bossProjectileSpriteId: '',
  bossProjectileTileId: '',
  bossProjectilePattern: PATTERN,
  bossShootInterval: 160,
  bossProjectileSpeed: 2,
  bossProjectileDamage: 1,
  bossPhases: [],
  bossPathId: pathId,
  roomLockSequence: [],
  __dualboss_tag: tag,
});

bossRoom.data.entities = (bossRoom.data.entities || []).filter(e => e.kind !== 'boss');
bossRoom.data.entities.push({
  id: `msx2_boss_dual_a_${Date.now()}`,
  name: 'DualBoss-A',
  kind: 'boss',
  position: { x: 3, y: 4 },
  components: {
    msx2_transform: { tileX: 3, tileY: 4, pixelX: 48, pixelY: 64, spawnX: 48, spawnY: 64 },
    msx2_movement: { mode: 'patrolX', direction: 1, boundsUnit: 'px' },
    msx2_collision: { damage: 1 },
    msx2_health: {},
  },
  params: bossParams('msx2bosspath_dual_a', 'A'),
});
bossRoom.data.entities.push({
  id: `msx2_boss_dual_b_${Date.now()}`,
  name: 'DualBoss-B',
  kind: 'boss',
  position: { x: 12, y: 9 },
  components: {
    msx2_transform: { tileX: 12, tileY: 9, pixelX: 192, pixelY: 144, spawnX: 192, spawnY: 144 },
    msx2_movement: { mode: 'patrolX', direction: -1, boundsUnit: 'px' },
    msx2_collision: { damage: 1 },
    msx2_health: {},
  },
  params: bossParams('msx2bosspath_dual_b', 'B'),
});

// ---- 4. boot straight into the dual-boss room (fight-fixture pattern) -------
const startNode = surface.data.nodes[0];
startNode.screenAssetId = BOSS_ROOM_ID;
startNode.name = 'dualboss room';
surface.data.startScreenNodeId = startNode.id;

fs.writeFileSync(output, JSON.stringify(project));
console.log(`${output}`);
console.log(`pattern=${PATTERN} stamp=${stampId} (16x16, 1 celda de Boss_Drone)`);
console.log('bosses: A path 48..120@y64 | B path 192..120@y144, fases opuestas');
