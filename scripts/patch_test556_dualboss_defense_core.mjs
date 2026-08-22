import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'C:/Users/salam/Downloads/test556.json');
const stamp = '20260822';
const ids = {
  room: 'bitmap_room_area51_defense_omega_20260818',
  world: 'worldmap_1787108640858',
  flow: 'asset_bitmapPlatform_gameflow_1781954607779',
  worldLink: 'msx2_gf_worldlink_1787157064627',
  pathAlpha: `msx2bosspath_test556_defense_core_alpha_${stamp}`,
  pathBeta: `msx2bosspath_test556_defense_core_beta_${stamp}`,
  bossAlpha: `msx2boss_test556_defense_core_alpha_${stamp}`,
  bossBeta: `msx2boss_test556_defense_core_beta_${stamp}`,
  entityAlpha: `msx2_entity_test556_defense_core_alpha_${stamp}`,
  entityBeta: `msx2_entity_test556_defense_core_beta_${stamp}`,
};

const fail = message => { throw new Error(`[test556 dual boss] ${message}`); };
if (!fs.existsSync(target)) fail(`input JSON not found: ${target}`);

const project = JSON.parse(fs.readFileSync(target, 'utf8'));
if (!Array.isArray(project.assets)) fail('project.assets is not an array');
const assets = project.assets;
const assetById = id => assets.find(asset => asset?.id === id);
const roomAsset = assetById(ids.room);
const worldAsset = assetById(ids.world);
const flowAsset = assetById(ids.flow) || assets.find(asset => asset?.type === 'msx2gameflow');
if (!roomAsset?.data || roomAsset.type !== 'msx2bitmaproom') fail(`target room missing: ${ids.room}`);
if (!worldAsset?.data || worldAsset.type !== 'worldmap') fail(`target world missing: ${ids.world}`);
if (!flowAsset?.data) fail('GameFlow asset missing');

const room = roomAsset.data;
const world = worldAsset.data;
const flow = flowAsset.data;
const atlasEntry = id => (room.atlas?.entries || []).find(entry => entry?.id === id);
for (const id of ['atlas_area51_omega_defense_core', 'atlas_area51_omega_laser_horizontal']) {
  const entry = atlasEntry(id);
  if (!entry || Number(entry.w) !== 16 || Number(entry.h) !== 16) fail(`required 16x16 atlas entry missing: ${id}`);
}
if (!(world.nodes || []).some(node => node?.screenAssetId === ids.room)) {
  fail(`world does not contain target room: ${ids.room}`);
}

if (!Array.isArray(room.entities)) room.entities = [];
if (room.entities.some(entity => entity?.kind === 'boss')) {
  fail('target room already contains a boss; refusing to duplicate the encounter');
}
for (const id of Object.values(ids)) {
  if (id === ids.room || id === ids.world || id === ids.flow || id === ids.worldLink) continue;
  if (assetById(id) || room.entities.some(entity => entity?.id === id)) fail(`id already exists: ${id}`);
}

const now = new Date().toISOString();
const asset = (id, type, name, data) => ({ id, name, type, data });
const fireAtNode = frames => [{ action: 'wait', frames }, { action: 'fire' }];

const pathAlpha = {
  id: ids.pathAlpha,
  name: 'Defense Core Alpha - Outer Circuit',
  nodes: [
    { id: 'test556_alpha_node_1', x: 72, y: 72, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
    { id: 'test556_alpha_node_2', x: 184, y: 72, actions: fireAtNode(36), segment: { mode: 'linear' } },
    { id: 'test556_alpha_node_3', x: 184, y: 120, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
    { id: 'test556_alpha_node_4', x: 72, y: 120, actions: fireAtNode(36), segment: { mode: 'linear' } },
  ],
  speedPxPerTick: 2,
  loopMode: 'loop',
  firing: 'path',
  notes: 'Outer circuit with a gentle sine sweep; each node fires a four-way growing laser.',
  createdAt: now,
  updatedAt: now,
};

const pathBeta = {
  id: ids.pathBeta,
  name: 'Defense Core Beta - Inner Diamond',
  nodes: [
    { id: 'test556_beta_node_1', x: 128, y: 48, actions: fireAtNode(72), segment: { mode: 'linear' } },
    { id: 'test556_beta_node_2', x: 200, y: 96, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
    { id: 'test556_beta_node_3', x: 128, y: 144, actions: fireAtNode(36), segment: { mode: 'linear' } },
    { id: 'test556_beta_node_4', x: 56, y: 96, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
  ],
  speedPxPerTick: 2,
  loopMode: 'loop',
  firing: 'path',
  notes: 'Phase-shifted inner diamond so the two laser waves do not stack.',
  createdAt: now,
  updatedAt: now,
};

const commonBoss = {
  bossAtlasEntryId: 'atlas_area51_omega_defense_core',
  bossStampAssetId: '',
  bossFrames: 1,
  bossAnimDelay: 12,
  bossHp: 12,
  bossDamage: 1,
  bossInterval: 2,
  bossMovement: 'static',
  bossSpeed: 1,
  bossRangePx: 0,
  bossProjectileSpriteId: '',
  bossProjectileTileId: '',
  bossProjectileSpeed: 2,
  bossProjectileDamage: 1,
  bossProjectilePattern: 'aimed',
  bossPhases: [],
  damageZones: [],
  onDefeated: [],
  roomLockSequence: [],
  bossDeathExplosionAnimated: false,
  bossDeathExplosionStampIds: [],
  bossDeathExplosionCount: 0,
  bossDeathExplosionInterval: 0,
  bossDeathExplosionHoldFrames: 0,
  bossDeathExplosionFrameDelay: 0,
  bossLaserTileId: 'atlas_area51_omega_laser_horizontal',
  bossLaserInterval: 90,
  bossLaserMaxLengthPx: 64,
  bossLaserDirectionMask: 15,
};

const bossAlpha = {
  id: ids.bossAlpha,
  name: 'Defense Core Alpha',
  ...commonBoss,
  bossPathId: ids.pathAlpha,
  notes: '16x16 bitmap boss. Its path nodes fire N/E/S/O and freeze it during the growing wave.',
  createdAt: now,
  updatedAt: now,
};
const bossBeta = {
  id: ids.bossBeta,
  name: 'Defense Core Beta',
  ...commonBoss,
  bossPathId: ids.pathBeta,
  notes: 'Independent 16x16 bitmap boss. It remains active if Alpha is defeated.',
  createdAt: now,
  updatedAt: now,
};

const bossEntity = (id, name, tileX, tileY, bossId, minX, maxX) => ({
  id,
  name,
  kind: 'boss',
  position: { x: tileX, y: tileY },
  components: {
    msx2_transform: {},
    msx2_movement: { mode: 'patrolX', direction: 1, boundsUnit: 'px', minX, maxX },
    msx2_collision: { damage: 1, hitboxW: 16, hitboxH: 16, offsetX: 0, offsetY: 0 },
  },
  params: { runtime: 'MSX2', engine: 'bitmapBoss', bossId },
});

assets.push(
  asset(ids.pathAlpha, 'msx2bosspath', pathAlpha.name, pathAlpha),
  asset(ids.pathBeta, 'msx2bosspath', pathBeta.name, pathBeta),
  asset(ids.bossAlpha, 'msx2boss', bossAlpha.name, bossAlpha),
  asset(ids.bossBeta, 'msx2boss', bossBeta.name, bossBeta),
);
room.entities.push(
  bossEntity(ids.entityAlpha, 'Defense Core Alpha', 4, 4, ids.bossAlpha, 56, 184),
  bossEntity(ids.entityBeta, 'Defense Core Beta', 7, 2, ids.bossBeta, 48, 200),
);

const worldLink = (flow.nodes || []).find(node => node?.id === ids.worldLink && node?.type === 'WorldLink');
if (!worldLink) fail(`WorldLink missing: ${ids.worldLink}`);
worldLink.worldAssetId = ids.world;
worldLink.musicTrackAssetId = '__none';
const startNode = (flow.nodes || []).find(node => node?.id === flow.startNodeId && node?.type === 'Start');
if (!startNode) fail(`GameFlow start node missing: ${flow.startNodeId}`);
flow.nodes = [startNode, worldLink];
flow.connections = [{
  id: `msx2_gfc_test556_start_defense_core_${stamp}`,
  from: { nodeId: startNode.id },
  to: { nodeId: worldLink.id },
}];

const serialized = `${JSON.stringify(project, null, 2)}\n`;
const temp = `${target}.dualboss.tmp`;
fs.writeFileSync(temp, serialized, 'utf8');
fs.copyFileSync(temp, target);
fs.unlinkSync(temp);
console.log(JSON.stringify({
  target,
  bytes: Buffer.byteLength(serialized, 'utf8'),
  room: ids.room,
  bosses: [ids.bossAlpha, ids.bossBeta],
  paths: [ids.pathAlpha, ids.pathBeta],
  gameFlow: `${startNode.id} -> ${worldLink.id} -> ${ids.world}`,
  laser: { interval: 90, maxLengthPx: 64, directions: 'N/E/S/O' },
}, null, 2));
