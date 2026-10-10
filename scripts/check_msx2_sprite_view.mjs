// Sprite View: real hardware bytes, world entry selection, state bank sharing,
// catalogue completeness, dynamic exclusion and overflow accounting.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(mkdtempSync(join(tmpdir(), 'mideas-sprite-view-')), 'model.mjs');
await build({ entryPoints: [join(root, 'utils/msx2SpriteView.ts')], bundle: true,
  format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' });
const { getSpriteViewWorld, getSpriteViewScreens, collectSpriteViewAssets, spritePatternPixel } = await import(pathToFileURL(out).href);

const palette = Array.from({ length: 16 }, (_, i) => ({ slotIndex: i, masterIndex: i, hex: `#${(i * 0x111111).toString(16).padStart(6, '0')}` }));
const asset = (type, data) => ({ id: data.id, name: data.name || data.id, type, data });
const sprite = (id, count = 1, facingDirection) => asset('msx2sprite', {
  id, name: id, target: 'MSX2', vdpMode: 'SCREEN5', size: { width: 16, height: 16 },
  palette, backgroundColor: 'rgba(0,0,0,0)', facingDirection,
  hardware: { color: 15, useOrColor: false },
  frames: Array.from({ length: count }, (_, f) => ({ id: `${id}_${f}`, data:
    Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) =>
      x === (f + y) % 16 ? '#ffffff' : 'rgba(0,0,0,0)')) })),
});
const room = (id, playerId) => asset('msx2bitmaproom', { id, name: id, palette,
  playerEntries: [{ playerId }], entities: [{ kind: 'enemy', spriteAssetId: 'enemy' }] });
const world = (id, rooms, start = 0) => asset('worldmap', { id, name: id,
  nodes: rooms.map((screenAssetId, i) => ({ id: `${id}_${i}`, screenAssetId })),
  startScreenNodeId: `${id}_${start}`, connections: [] });
const player = (id, spriteId) => asset('msx2player', { id, name: id, render: { spriteAssetId: spriteId } });
const assets = [sprite('other'), sprite('hero', 2, 'right'), sprite('jump'), sprite('enemy', 10),
  player('wrong', 'other'), { ...player('player', 'hero'), data: {
    ...player('player', 'hero').data, animations: {
      walking: { stateMachineState: 'walking', spriteAssetId: 'hero' },
      jump: { stateMachineState: 'jumping', spriteAssetId: 'jump' },
    }, animationOrder: ['walking', 'jump'] } },
  room('first', 'wrong'), room('entry', 'player'), world('world_a', ['first', 'entry'], 1)];
const snapshot = JSON.stringify(assets);
const bank = getSpriteViewWorld(assets, 'world_a');
assert.equal(bank.entryRoomName, 'entry');
assert.equal(bank.patterns.length, 6, '2 base + 1 state frames, with mirrored halves');
assert.equal(bank.usedBytes, 192);
assert.equal(bank.freeBytes, 1856);
assert.deepEqual(bank.aliases, ['walking']);
assert.deepEqual(bank.patterns.map(p => p.mirrored), [false, false, false, true, true, true]);
assert.ok(!bank.patterns.some(p => p.label === 'enemy'), 'Dynamic enemy excluded from general bank');
assert.equal(spritePatternPixel(bank.patterns[0].pattern, 0, 0), true);
assert.equal(spritePatternPixel(bank.patterns[0].pattern, 15, 0), false);
assert.equal(spritePatternPixel(bank.patterns[3].pattern, 15, 0), true, 'Mirrored byte orientation');
assert.equal(spritePatternPixel(bank.patterns[0].pattern, 15, 15), true, 'Bottom-right quadrant');
assert.equal(collectSpriteViewAssets(assets).filter(p => p.assetId === 'enemy').length, 10, 'All authored frames, beyond runtime cap');
assert.equal(JSON.stringify(assets), snapshot, 'Inspection does not mutate assets');
assert.equal(getSpriteViewWorld([], 'missing'), undefined);
assert.equal(getSpriteViewWorld([world('empty', [])], 'empty'), undefined);

// Native SCREEN 4: exact init offsets, entry screen, mirrors and dynamic holes.
const tileScreen = (id, playerId) => asset('msx2screen', { id, name: id, target: 'MSX2', vdpMode: 'SCREEN4',
  palette, tileSize: 16, widthTiles: 16, heightTiles: 12, tiles: [],
  playerEntries: [{ id: 'default', playerId, x: 2, y: 6 }],
  layers: { entities: [{ id: 'placed_enemy', kind: 'enemy', params: { enemyAssetId: 'dynamic_enemy' } }] } });
const tileAssets = [sprite('hero', 2, 'right'), sprite('other'), sprite('enemy', 2),
  player('player', 'hero'), player('wrong', 'other'),
  asset('msx2enemy', { id: 'dynamic_enemy', name: 'Dynamic enemy', render: { spriteId: 'enemy' } }),
  tileScreen('tile_first', 'wrong'), tileScreen('tile_entry', 'player'),
  world('tile_world', ['tile_first', 'tile_entry'], 1),
  asset('msx2gameflow', { id: 'tile_flow', purpose: 'screen4-runtime', startNodeId: 'start',
    nodes: [{ id: 'start', type: 'Start' }, { id: 'world', type: 'WorldLink', worldAssetId: 'tile_world' }],
    connections: [{ from: { nodeId: 'start' }, to: { nodeId: 'world' } }] })];
const tileSnapshot = JSON.stringify(tileAssets);
const tileBank = getSpriteViewWorld(tileAssets, 'tile_world');
assert.equal(tileBank.screenMode, 'SCREEN 4');
assert.equal(tileBank.patternBase, 0x3800);
assert.equal(tileBank.entryRoomName, 'tile_entry');
assert.equal(tileBank.bootRoomName, 'tile_entry');
assert.equal(tileBank.inspectionError, undefined);
assert.deepEqual(tileBank.patterns.slice(0, 4).map(p => p.group), [0, 1, 2, 3]);
assert.deepEqual(tileBank.patterns.slice(0, 4).map(p => p.mirrored), [false, false, true, true]);
assert.deepEqual(tileBank.patterns.slice(0, 4).map(p => p.assetId), Array(4).fill('hero'));
assert.equal(spritePatternPixel(tileBank.patterns[2].pattern, 15, 0), true);
assert.equal(tileBank.patterns.find(p => p.label === 'Player shot').group, 12, '8 dynamic groups retain their physical hole');
assert.equal(tileBank.usedBytes, 6 * 32);
assert.equal(tileBank.freeBytes, 2048 - 6 * 32);
assert.ok(!tileBank.patterns.some(p => p.assetId === 'enemy'), 'Per-screen enemy pack excluded');
assert.equal(JSON.stringify(tileAssets), tileSnapshot, 'SCREEN 4 inspection is read-only');
assert.deepEqual(getSpriteViewScreens(tileAssets, 'tile_world').map(screen => screen.id), ['tile_first', 'tile_entry']);
const tileScreenBank = getSpriteViewWorld(tileAssets, 'tile_world', 'tile_entry');
assert.equal(tileScreenBank.inspectionError, undefined);
assert.equal(tileScreenBank.screenName, 'tile_entry');
assert.equal(tileScreenBank.patterns.filter(pattern => pattern.dynamic).length, 8);
assert.equal(tileScreenBank.usedBytes, 14 * 32);
assert.equal(tileScreenBank.freeBytes, 2048 - 14 * 32);
assert.deepEqual(tileScreenBank.patterns.filter(pattern => !pattern.dynamic), tileBank.patterns);
assert.equal(getSpriteViewWorld(tileAssets, 'tile_world', 'outside'), undefined);
const tileUnlinked = [...tileAssets, world('tile_unlinked', ['tile_first'])];
assert.deepEqual(getSpriteViewScreens(tileUnlinked, 'tile_unlinked').map(screen => screen.id), ['tile_first']);
// A screen linked from another world is already part of the compiled bank.
assert.equal(getSpriteViewWorld(tileUnlinked, 'tile_unlinked').bootRoomName, 'tile_entry');
const trulyUnlinked = [...tileAssets, tileScreen('tile_outside', 'wrong'), world('tile_outside_world', ['tile_outside'])];
assert.equal(getSpriteViewWorld(trulyUnlinked, 'tile_outside_world').independentPreview, true);
assert.equal(getSpriteViewWorld(trulyUnlinked, 'tile_outside_world').bootRoomName, 'tile_outside');
const invalidTile = structuredClone(tileAssets);
invalidTile.find(a => a.id === 'dynamic_enemy').data.render.spriteId = 'missing';
assert.match(getSpriteViewWorld(invalidTile, 'tile_world').inspectionError, /missing/);
if (process.env.MIDEAS_SPRITE_VIEW_TILE_FIXTURE) writeFileSync(process.env.MIDEAS_SPRITE_VIEW_TILE_FIXTURE,
  JSON.stringify({ name: 'Sprite View SCREEN 4 check', currentScreenMode: 'SCREEN 4 (Graphics II)', assets: tileAssets }));

const overflow = structuredClone(assets);
overflow.find(a => a.id === 'hero').data.size = { width: 64, height: 64 };
overflow.find(a => a.id === 'hero').data.frames = Array.from({ length: 8 }, (_, f) => ({ id: `big_${f}`,
  data: Array.from({ length: 64 }, () => Array(64).fill('#ffffff')) }));
const full = getSpriteViewWorld(overflow, 'world_a');
assert.ok(full.overflowBytes > 0);
assert.equal(full.freeBytes, 0);

// The game shares the boot player's bank even when world B references another player.
const flow = asset('msx2gameflow', { id: 'flow', name: 'Main MSX2', purpose: 'screen5', startNodeId: 'start',
  nodes: [{ id: 'start', type: 'Start' }, { id: 'a', type: 'WorldLink', worldAssetId: 'world_a' },
    { id: 'b', type: 'WorldLink', worldAssetId: 'world_b' }],
  connections: [{ from: { nodeId: 'start' }, to: { nodeId: 'a' } }, { from: { nodeId: 'a' }, to: { nodeId: 'b' } }] });
const multi = [...assets, world('world_b', ['first']), world('unlinked', ['first']), flow];
const second = getSpriteViewWorld(multi, 'world_b');
assert.equal(second.sharedBank, true);
assert.deepEqual(second.patterns.map(p => p.pattern), bank.patterns.map(p => p.pattern));
assert.equal(second.entryRoomName, 'first');
assert.equal(getSpriteViewWorld(multi, 'unlinked').independentPreview, true);

// Existing project fixture: moving enemies must not change the fixed bank.
const real = JSON.parse(readFileSync(join(root, 'test/msx2-shoot/fixture_shot_sound.json'), 'utf8'));
const realWorld = real.assets.find(a => a.type === 'worldmap');
const realSnapshot = JSON.stringify(real.assets);
const realBank = getSpriteViewWorld(real.assets, realWorld.id);
assert.ok(realBank.patterns.length > 0);
assert.equal(realBank.inspectionError, undefined);
assert.equal(JSON.stringify(real.assets), realSnapshot, 'Full allocator inspection preserves project data');
const shot = realBank.patterns.find(pattern => pattern.label === 'Player shot');
assert.ok(shot, 'Initial shoot pattern is included');
assert.equal(shot.pattern.length, 32);
assert.equal(realBank.usedBytes, realBank.patterns.length * 32);
const withoutEnemies = structuredClone(real.assets);
withoutEnemies.filter(a => a.type === 'msx2bitmaproom').forEach(a => { a.data.entities = []; });
assert.deepEqual(getSpriteViewWorld(withoutEnemies, realWorld.id).patterns, realBank.patterns);
const screenProject = structuredClone(real);
screenProject.assets.push(sprite('screen_enemy', 2));
const bitmapScreens = screenProject.assets.filter(asset => asset.type === 'msx2bitmaproom');
const dynamicEnemy = index => ({ id: `dynamic_${index}`, name: `Enemy ${index}`, kind: 'enemy',
  position: { x: 4 + index, y: 6 }, spriteAssetId: 'screen_enemy',
  components: { msx2_movement: { mode: 'patrolX', direction: 1, speed: 1 },
    msx2_hardware_sprite: { msx2SpriteAssetId: 'screen_enemy' },
    msx2_animation: { frameList: [0, 1], frameCount: 2, frameDelay: 4 } }, params: { movement: 'patrolX' } });
bitmapScreens[0].data.entities.push(dynamicEnemy(0));
bitmapScreens[1].data.entities = [];
const screenSnapshot = JSON.stringify(screenProject.assets);
assert.equal(getSpriteViewScreens(screenProject.assets, realWorld.id).length, 2);
const generalWithDynamic = getSpriteViewWorld(screenProject.assets, realWorld.id);
const screenCombined = getSpriteViewWorld(screenProject.assets, realWorld.id, bitmapScreens[0].id);
assert.equal(screenCombined.inspectionError, undefined);
assert.equal(screenCombined.screenName, bitmapScreens[0].name);
assert.ok(screenCombined.patterns.some(pattern => pattern.dynamic && pattern.pattern.some(Boolean)));
assert.ok(screenCombined.usedBytes > generalWithDynamic.usedBytes);
assert.deepEqual(screenCombined.patterns.filter(pattern => !pattern.dynamic), generalWithDynamic.patterns);
const emptyScreen = getSpriteViewWorld(screenProject.assets, realWorld.id, bitmapScreens[1].id);
assert.equal(emptyScreen.inspectionError, undefined);
assert.equal(emptyScreen.usedBytes, generalWithDynamic.usedBytes, 'Another screen\'s enemies are excluded');
assert.equal(JSON.stringify(screenProject.assets), screenSnapshot, 'Screen inspection preserves all assets');
const platformProject = structuredClone(screenProject.assets);
platformProject.find(asset => asset.id === bitmapScreens[1].id).data.entities = [{ ...dynamicEnemy(0), kind: 'platform' }];
const platformBank = getSpriteViewWorld(platformProject, realWorld.id, bitmapScreens[1].id);
assert.equal(platformBank.inspectionError, undefined);
assert.equal(platformBank.patterns.filter(pattern => pattern.dynamic).length, 1);
assert.equal(platformBank.patterns.find(pattern => pattern.dynamic).group, screenCombined.patterns.find(pattern => pattern.dynamic).group,
  'Categories on separate screens reuse their physical pattern range');
assert.ok(platformBank.patterns.find(pattern => pattern.dynamic).pattern.some(Boolean));
const foregroundProject = structuredClone(screenProject.assets);
foregroundProject.find(asset => asset.id === bitmapScreens[0].id).data.foregroundTiles = [{ cellX: 1, cellY: 1, atlasEntryId: 'missing_uses_real_fallback' }];
foregroundProject.find(asset => asset.id === bitmapScreens[0].id).data.backgroundColor = 0;
const foregroundBank = getSpriteViewWorld(foregroundProject, realWorld.id, bitmapScreens[0].id);
assert.equal(foregroundBank.inspectionError, undefined);
assert.ok(foregroundBank.patterns.some(pattern => pattern.dynamic && pattern.label.startsWith('Foreground') && pattern.pattern.some(Boolean)));
const overloadedScreen = structuredClone(screenProject.assets);
overloadedScreen.find(asset => asset.id === bitmapScreens[0].id).data.entities.push(...Array.from({ length: 6 }, (_, i) => dynamicEnemy(i + 1)));
assert.match(getSpriteViewWorld(overloadedScreen, realWorld.id, bitmapScreens[0].id).inspectionError, /64|32/, 'Real allocator rejection is visible');
if (process.env.MIDEAS_SPRITE_VIEW_SCREEN_FIXTURE) writeFileSync(process.env.MIDEAS_SPRITE_VIEW_SCREEN_FIXTURE, JSON.stringify(screenProject));
const effects = structuredClone(real.assets);
const effectPlayerData = effects.find(asset => asset.type === 'msx2player').data;
const effectPlayer = effectPlayerData.player || effectPlayerData;
effectPlayer.activeSkills.push('destroy_tile');
const effectBank = getSpriteViewWorld(effects, realWorld.id);
assert.equal(effectBank.inspectionError, undefined);
assert.ok(effectBank.patterns.some(pattern => pattern.label === 'Destroy tile debris'));
assert.equal(effectBank.usedBytes, realBank.usedBytes + 32);
const crumble = structuredClone(effects);
const crumbleRoom = crumble.find(asset => asset.type === 'msx2bitmaproom').data;
crumbleRoom.collision[10][2] |= 0x04;
const crumbleBank = getSpriteViewWorld(crumble, realWorld.id);
assert.equal(crumbleBank.inspectionError, undefined);
assert.ok(crumbleBank.patterns.some(pattern => pattern.label === 'Crumbling floor debris'));
assert.equal(crumbleBank.usedBytes, effectBank.usedBytes + 32);

// Optional inspection must not alter exported ASM (including all pre-existing local changes).
const generatorFile = join(root, 'utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts');
const source = readFileSync(generatorFile, 'utf8');
const beforeSource = source.replace(/  \/\/ Read-only early exit[\s\S]*?(?=  hudLinkedRamCursor \+= crumbleSystem.ramBytes;)/, '');
assert.notEqual(source, beforeSource, 'Parity baseline removes the inspection-only early exit');
async function loadExporter(label, baseline) {
  const output = join(dirname(out), `${label}.mjs`);
  await build({ stdin: { contents: "export { generateModularASM } from './utils/msxGenerator/index.ts';", resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile: output, logLevel: 'silent', plugins: baseline ? [{
      name: 'before-sprite-inspection', setup(plugin) {
        plugin.onLoad({ filter: /msx2Screen5BitmapRoomGenerator\.ts$/ }, () => ({ contents: beforeSource, loader: 'ts', resolveDir: dirname(generatorFile) }));
      },
    }] : [] });
  return import(pathToFileURL(output).href);
}
const before = await loadExporter('before', true);
const after = await loadExporter('after', false);
const generate = implementation => {
  const log = console.log, warn = console.warn;
  try {
    console.log = console.warn = () => {};
    return implementation.generateModularASM('sprite_view_parity', structuredClone(effects), {
      screenMode: 'SCREEN 4 (Graphics II)', generateUnified: true, romMode: 'megarom', targetFormat: 'konami',
    });
  } finally { console.log = log; console.warn = warn; }
};
assert.deepEqual(generate(after), generate(before), 'All exported ASM files stay byte-identical');
console.log('PASS Sprite View SCREEN 4 / 5: hardware bytes, world selection, aliases, all frames, world-filtered screens, combined general/dynamic banks, dynamic exclusion and holes, multi-world, empty worlds, overflow rejection, initial shot/debris, immutability and ASM parity.');
