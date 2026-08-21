import fs from 'node:fs';
import path from 'node:path';

const targetPath = process.argv[2] || 'C:/Users/salam/Downloads/test554.json';
const target = path.resolve(targetPath);
const stamp = '20260821';

const ids = {
  room: 'bitmap_room_area51_defense_omega_20260818',
  world: 'worldmap_1787108640858',
  flow: 'asset_bitmapPlatform_gameflow_1781954607779',
  flowWorldLink: 'msx2_gf_worldlink_1787157064627',
  pathAlpha: `msx2bosspath_test554_defense_core_alpha_${stamp}`,
  pathBeta: `msx2bosspath_test554_defense_core_beta_${stamp}`,
  bossAlpha: `msx2boss_test554_defense_core_alpha_${stamp}`,
  bossBeta: `msx2boss_test554_defense_core_beta_${stamp}`,
  entityAlpha: `msx2_entity_test554_defense_core_alpha_${stamp}`,
  entityBeta: `msx2_entity_test554_defense_core_beta_${stamp}`,
};

function fail(message) {
  throw new Error(`[test554 dual boss] ${message}`);
}

if (!fs.existsSync(target)) fail(`input JSON not found: ${target}`);
const project = JSON.parse(fs.readFileSync(target, 'utf8'));
if (!Array.isArray(project.assets)) fail('project.assets is not an array');

const assets = project.assets;
const assetById = id => assets.find(asset => asset?.id === id);
const roomAsset = assetById(ids.room);
const worldAsset = assetById(ids.world);
const flowAsset = assetById(ids.flow) || assets.find(asset => asset?.type === 'msx2gameflow');

if (!roomAsset?.data) fail(`target room missing: ${ids.room}`);
if (roomAsset.type !== 'msx2bitmaproom') fail(`target asset is not msx2bitmaproom: ${ids.room}`);
if (!worldAsset?.data) fail(`target world missing: ${ids.world}`);
if (worldAsset.type !== 'worldmap') fail(`target asset is not worldmap: ${ids.world}`);
if (!flowAsset?.data) fail('MSX2 GameFlow asset missing');

const room = roomAsset.data;
const world = worldAsset.data;
const flow = flowAsset.data;
const atlasEntries = room.atlas?.entries || [];
const atlasEntry = id => atlasEntries.find(entry => entry?.id === id);

for (const required of [
  'atlas_area51_omega_defense_core',
  'atlas_area51_omega_laser_horizontal',
]) {
  const entry = atlasEntry(required);
  if (!entry || Number(entry.w) !== 16 || Number(entry.h) !== 16) {
    fail(`required 16x16 atlas entry missing from target room: ${required}`);
  }
}
if (!Array.isArray(room.entities)) room.entities = [];
if (room.entities.some(entity => entity?.kind === 'boss')) {
  fail('target room already contains a boss entity; refusing to create a third/duplicate encounter');
}
const newIds = [
  ids.pathAlpha,
  ids.pathBeta,
  ids.bossAlpha,
  ids.bossBeta,
  ids.entityAlpha,
  ids.entityBeta,
];
for (const id of newIds) {
  if (assetById(id) || room.entities.some(entity => entity?.id === id)) {
    fail(`id already exists, refusing to overwrite: ${id}`);
  }
}

const now = new Date().toISOString();
const asset = (id, type, name, data) => ({ id, name, type, data });
const fireAtNode = frames => [
  { action: 'wait', frames },
  { action: 'fire' },
];

// Both routes stay comfortably inside the 256x168 gameplay area for a 16x16
// body. The sine segments add a controlled, repeatable variation without
// requiring runtime geometry or per-frame trigonometry on the Z80.
const pathAlpha = {
  id: ids.pathAlpha,
  name: 'Defense Core Alpha - Outer Circuit',
  nodes: [
    { id: 'alpha_node_1', x: 72, y: 72, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
    { id: 'alpha_node_2', x: 184, y: 72, actions: fireAtNode(36), segment: { mode: 'linear' } },
    { id: 'alpha_node_3', x: 184, y: 120, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
    { id: 'alpha_node_4', x: 72, y: 120, actions: fireAtNode(36), segment: { mode: 'linear' } },
  ],
  speedPxPerTick: 2,
  loopMode: 'loop',
  firing: 'path',
  notes: 'Outer rectangular circuit with a gentle sine sweep; each corner fires a four-way growing laser.',
  createdAt: now,
  updatedAt: now,
};

const pathBeta = {
  id: ids.pathBeta,
  name: 'Defense Core Beta - Inner Diamond',
  nodes: [
    { id: 'beta_node_1', x: 128, y: 48, actions: fireAtNode(72), segment: { mode: 'linear' } },
    { id: 'beta_node_2', x: 200, y: 96, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
    { id: 'beta_node_3', x: 128, y: 144, actions: fireAtNode(36), segment: { mode: 'linear' } },
    { id: 'beta_node_4', x: 56, y: 96, actions: fireAtNode(36), segment: { mode: 'sine', amplitude: 6, frequency: 1 } },
  ],
  speedPxPerTick: 2,
  loopMode: 'loop',
  firing: 'path',
  notes: 'Inner diamond circuit phase-shifted from Alpha so the two laser waves do not stack.',
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
  bossProjectileKind: undefined,
  bossProjectileSpriteId: '',
  bossProjectileTileId: '',
  bossShootInterval: undefined,
  bossProjectileSpeed: 2,
  bossProjectileDamage: 1,
  bossProjectilePattern: 'aimed',
  bossPhases: [],
  damageZones: [],
  onDefeated: [],
  bossPathId: '',
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
  notes: '16x16 bitmap boss. Path nodes fire N/E/S/W; laser growth freezes this boss until the wave is restored.',
  createdAt: now,
  updatedAt: now,
};
const bossBeta = {
  id: ids.bossBeta,
  name: 'Defense Core Beta',
  ...commonBoss,
  bossPathId: ids.pathBeta,
  notes: 'Independent 16x16 bitmap boss. Its phase-shifted path lets Alpha continue attacking if Beta is defeated.',
  createdAt: now,
  updatedAt: now,
};

// JSON does not need undefined fields, and omitting them is what disables the
// normal projectile backend while leaving the bitmap laser enabled.
for (const boss of [bossAlpha, bossBeta]) {
  for (const [key, value] of Object.entries(boss)) {
    if (value === undefined) delete boss[key];
  }
}

const bossEntity = (id, name, tileX, tileY, bossId, minX, maxX) => ({
  id,
  name,
  kind: 'boss',
  position: { x: tileX, y: tileY },
  components: {
    msx2_transform: {},
    msx2_movement: {
      mode: 'patrolX',
      direction: 1,
      boundsUnit: 'px',
      minX,
      maxX,
    },
    msx2_collision: {
      damage: 1,
      hitboxW: 16,
      hitboxH: 16,
      offsetX: 0,
      offsetY: 0,
    },
  },
  params: {
    runtime: 'MSX2',
    engine: 'bitmapBoss',
    bossId,
  },
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

const worldNode = (world.nodes || []).find(node => node?.screenAssetId === ids.room);
if (!worldNode) fail(`world does not point to target room: ${ids.room}`);
const worldLink = (flow.nodes || []).find(node => node?.id === ids.flowWorldLink && node?.type === 'WorldLink');
if (!worldLink) fail(`GameFlow WorldLink missing: ${ids.flowWorldLink}`);
worldLink.worldAssetId = ids.world;
worldLink.musicTrackAssetId = '__none';

const startNode = (flow.nodes || []).find(node => node?.id === flow.startNodeId);
if (!startNode) fail(`GameFlow start node missing: ${flow.startNodeId}`);
if (!Array.isArray(flow.connections)) flow.connections = [];
const startConnections = flow.connections.filter(connection => connection?.from?.nodeId === startNode.id);
if (startConnections.length === 0) {
  flow.connections.push({
    id: `msx2_gfc_test554_start_${stamp}`,
    from: { nodeId: startNode.id },
    to: { nodeId: ids.flowWorldLink },
  });
} else {
  // The boss arena is the explicit cooperation fixture entry point. Bypass the
  // old presentation/legacy-world chain, but leave those nodes available for
  // later authoring and recovery.
  startConnections[0].to = { nodeId: ids.flowWorldLink };
  for (const extra of startConnections.slice(1)) {
    const index = flow.connections.indexOf(extra);
    if (index >= 0) flow.connections.splice(index, 1);
  }
}

const temp = `${target}.dualboss.tmp`;
const serialized = `${JSON.stringify(project, null, 2)}\n`;
fs.writeFileSync(temp, serialized, 'utf8');
fs.copyFileSync(temp, target);
fs.unlinkSync(temp);

console.log(JSON.stringify({
  target,
  bytes: Buffer.byteLength(serialized, 'utf8'),
  room: { id: ids.room, entityCount: room.entities.length, bosses: room.entities.filter(entity => entity.kind === 'boss').map(entity => entity.params.bossId) },
  paths: [ids.pathAlpha, ids.pathBeta],
  worldLink: { id: ids.flowWorldLink, worldAssetId: worldLink.worldAssetId, startTarget: (flow.connections.find(connection => connection.from?.nodeId === startNode.id)?.to?.nodeId) },
}, null, 2));
