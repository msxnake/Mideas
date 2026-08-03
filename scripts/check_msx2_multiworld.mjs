#!/usr/bin/env node
/**
 * Multi-world SCREEN 5 bitmap ROMs, checked against the REAL generator.
 *
 * A Game Flow may visit several worlds, and each world owns its palette. Before
 * this existed the generator compiled only the FIRST WorldLink's world and every
 * later WorldLink replayed it, so a second world silently rendered world 1's
 * rooms in world 1's colours ("as if there were a single global palette").
 *
 * The generator is transpiled and invoked here, not restated: the assertions run
 * against the ASM it actually emits. Break `collectBitmapWorldRooms` (drop the
 * extra worlds) or `bitmap_prepare_world` and these checks go red.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-multiworld-')), 'generator.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { generateMsx2Screen5BitmapRoomFiles } = await import(pathToFileURL(out).href);

// ---- fixture ---------------------------------------------------------------
// Two worlds of two rooms each, with different palettes, visited by two
// WorldLinks: Start -> WorldLink(A) -> WorldLink(B) -> End.
const paletteSlots = base => Array.from({ length: 16 }, (_unused, i) => ({
  slotIndex: i,
  masterIndex: i === 0 ? -1 : (base + i * 9) % 512,
  hex: '#000000',
}));

const makeRoom = (id, tint) => ({
  id,
  name: id,
  width: 256,
  height: 192,
  backgroundColor: 1,
  palette: paletteSlots(tint),
  atlas: {
    width: 256,
    height: 16,
    offscreenBaseY: 512,
    pixels: Array.from({ length: 16 }, () => Array.from({ length: 256 }, (_u, x) => (x >> 4) & 0x0f)),
    entries: [{ id: `${id}_tile`, sx: 0, sy: 0, width: 16, height: 16 }],
  },
  tileGrid: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 1)),
  runtime: { spawnX: 32, spawnY: 48 },
});

const makeWorld = (id, name, roomIds, paletteAssetId) => ({
  id,
  name,
  paletteAssetId,
  startScreenNodeId: `${id}_n0`,
  nodes: roomIds.map((roomId, index) => ({ id: `${id}_n${index}`, screenAssetId: roomId, position: { x: index * 200, y: 0 } })),
  connections: roomIds.length > 1
    ? [{ id: `${id}_c0`, fromNodeId: `${id}_n0`, toNodeId: `${id}_n1`, fromDirection: 'east', toDirection: 'west' }]
    : [],
});

const paletteA = { id: 'pal_a', name: 'Palette A', type: 'palette', data: { mode: 'SCREEN5', slots: paletteSlots(11) } };
const paletteB = { id: 'pal_b', name: 'Palette B', type: 'palette', data: { mode: 'SCREEN5', slots: paletteSlots(300) } };

const rooms = [makeRoom('room_a0', 3), makeRoom('room_a1', 3), makeRoom('room_b0', 5), makeRoom('room_b1', 5)];
const worldA = makeWorld('world_a', 'World A', ['room_a0', 'room_a1'], 'pal_a');
const worldB = makeWorld('world_b', 'World B', ['room_b0', 'room_b1'], 'pal_b');

const gameFlow = (worldIds) => ({
  purpose: 'screen4-bitmap-runtime',
  name: 'Main MSX2',
  startNodeId: 'gf_start',
  nodes: [
    { id: 'gf_start', type: 'Start' },
    ...worldIds.map((worldAssetId, index) => ({ id: `gf_link${index}`, type: 'WorldLink', worldAssetId })),
    { id: 'gf_end', type: 'End', title: 'GAME OVER' },
  ],
  connections: [
    { id: 'gc0', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_link0' } },
    ...worldIds.slice(1).map((_id, index) => ({
      id: `gc${index + 1}`,
      from: { nodeId: `gf_link${index}` },
      to: { nodeId: `gf_link${index + 1}` },
    })),
    { id: 'gcend', from: { nodeId: `gf_link${worldIds.length - 1}` }, to: { nodeId: 'gf_end' } },
  ],
});

const buildAsm = (worldIds) => {
  const flow = gameFlow(worldIds);
  const worldmaps = [worldA, worldB].filter(world => worldIds.includes(world.id));
  const analysis = {
    msx2BitmapRooms: rooms,
    worldmaps,
    msx2GameFlows: [flow],
    tiles: [],
    tracks: [],
    assets: [
      paletteA,
      paletteB,
      ...rooms.map(room => ({ id: room.id, name: room.name, type: 'msx2bitmaproom', data: room })),
      ...worldmaps.map(world => ({ id: world.id, name: world.name, type: 'worldmap', data: world })),
      { id: 'flow', name: 'Main MSX2', type: 'msx2gameflow', data: flow },
    ],
  };
  const files = generateMsx2Screen5BitmapRoomFiles('multiworld_check', analysis, {
    screenMode: 'SCREEN 4 (Graphics II)',
    romMode: 'megarom',
    targetFormat: 'konami',
  });
  return files['unitedFiles.asm'];
};

const single = buildAsm(['world_a']);
const dual = buildAsm(['world_a', 'world_b']);

// MIDEAS_DUMP_ASM=<dir> writes both variants out for eyeballing a failure.
if (process.env.MIDEAS_DUMP_ASM) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(process.env.MIDEAS_DUMP_ASM, 'multiworld_single.asm'), single);
  writeFileSync(join(process.env.MIDEAS_DUMP_ASM, 'multiworld_dual.asm'), dual);
}

const checks = [];
const count = (text, needle) => text.split(needle).length - 1;

// ---- single world: nothing multi-world may appear ---------------------------
checks.push([
  'Single-world ROM emits no per-world palette table',
  !single.includes('screen5_bitmap_palette_data_w1') && !single.includes('bitmap_world_palette_ptr_table'),
]);
checks.push([
  'Single-world ROM emits no bitmap_prepare_world routine or call',
  !single.includes('bitmap_prepare_world'),
]);
checks.push([
  'Single-world ROM keeps the literal start room in the boot init',
  !single.includes('ld a, (bitmap_world_start_room)') && single.includes('call load_room'),
]);
checks.push([
  'Single-world ROM allocates no multi-world RAM',
  !single.includes('bitmap_world_index'),
]);
checks.push([
  'Single-world ROM emits no active-world pool index table',
  !single.includes('bitmap_room_world_local_index_table'),
]);

// ---- two worlds: both are really compiled -----------------------------------
const roomCount = text => (text.match(/^bitmap_room_collision_\d+:/gm) || []).length;
checks.push([
  'Both worlds contribute their rooms to one global room list',
  roomCount(dual) === 4 && roomCount(single) === 2,
]);
checks.push([
  'Each world gets its own palette table',
  dual.includes('screen5_bitmap_palette_data:') && dual.includes('screen5_bitmap_palette_data_w1:'),
]);
checks.push([
  'The two palettes actually differ (the fixture would be meaningless otherwise)',
  (() => {
    const grab = label => (dual.split(`${label}:`)[1] || '').split('\n').slice(1, 3).join('');
    return grab('screen5_bitmap_palette_data') !== grab('screen5_bitmap_palette_data_w1');
  })(),
]);
checks.push([
  'A palette pointer table indexes the worlds',
  /bitmap_world_palette_ptr_table:\s*\n\s*DW screen5_bitmap_palette_data, screen5_bitmap_palette_data_w1/.test(dual),
]);
checks.push([
  'Every WorldLink selects ITS OWN world before the shared boot init',
  count(dual, 'call bitmap_prepare_world') === 2
    && /ld a, 0\s+; world "world_a"/.test(dual)
    && /ld a, 1\s+; world "world_b"/.test(dual),
]);
checks.push([
  'The boot init reads the entry room and spawn from the selected world',
  dual.includes('ld a, (bitmap_world_start_room)')
    && dual.includes('ld a, (bitmap_world_spawn_x)')
    && dual.includes('ld a, (bitmap_world_spawn_y)'),
]);
checks.push([
  'World 1 enters at a room that belongs to world 1, not world 0',
  (() => {
    const table = (dual.split('bitmap_world_start_room_table:')[1] || '').split('\n')[1] || '';
    // Rooms 0-1 are world A, rooms 2-3 are world B.
    return /DB #00,#02/.test(table.trim());
  })(),
]);
checks.push([
  'Edge rails never cross a world boundary',
  (() => {
    const body = (dual.split('bitmap_room_transition_table:')[1] || '').split('\n\n')[0];
    const bytes = (body.match(/#[0-9A-F]{2}/g) || []).map(value => parseInt(value.slice(1), 16));
    if (bytes.length < 16) return false;
    return bytes.every((target, index) => {
      if (target === 0xff) return true;
      const fromWorld = Math.floor(Math.floor(index / 4) / 2);
      return Math.floor(target / 2) === fromWorld;
    });
  })(),
]);
checks.push([
  'Cold boot latches world 0 before the palette loader indexes its table',
  /xor a\s*\n\s*ld \(bitmap_world_index\), a\s*\n(?:\s*ld \(bitmap_world_session_started\), a\s*\n)?\s*call load_screen5_bitmap_palette/.test(dual),
]);
checks.push([
  'WorldLink boot reserves a persistent progress mailbox',
  dual.includes('bitmap_world_saved_health')
    && dual.includes('bitmap_world_saved_lives')
    && dual.includes('bitmap_world_saved_key_count')
    && dual.includes('bitmap_world_saved_gems_lo')
    && dual.includes('bitmap_world_session_started'),
]);
checks.push([
  'WorldLink reinitialises the atlas before loading the new entry room',
  (dual.match(/call upload_tileset_atlas/g) || []).length >= 2
    && dual.includes('bitmap_world_save_progress:')
    && dual.includes('bitmap_world_restore_progress:'),
]);
checks.push([
  'Dual-world ROM reuses one local room-pool index for load and commit',
  dual.includes('bitmap_room_world_local_index_table:')
    && (dual.match(/ld \(bitmap_room_pool_index\), a/g) || []).length >= 2
    && /DB #00,#01,#00,#01/.test(dual.split('bitmap_room_world_local_index_table:')[1] || ''),
]);

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
}
if (failed) {
  throw new Error(`MSX2 multi-world checks failed: ${failed}`);
}
console.log('MSX2 multi-world checks passed.');
