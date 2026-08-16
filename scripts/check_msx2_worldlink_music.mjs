#!/usr/bin/env node
/**
 * Per-world music in the SCREEN 5 bitmap route, checked against the REAL generator.
 *
 * A WorldLink node owns the song of its world ("Music on entry" in the MSX2 Game
 * Flow editor):
 *   - unset      -> the node emits no music code, and a project with tracks but
 *                   no Music node keeps the legacy boot autoplay of track 0;
 *   - '__none'   -> the world is entered in silence;
 *   - <track id> -> that track starts, looped, as the gameplay loop begins.
 * Leaving the world always stops the song (.bitmap_gameflow_exit).
 *
 * The generator is transpiled and invoked here, not restated: break the WorldLink
 * music emission or the `flowOwnsMusic` predicate and these checks go red.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-worldlink-music-')), 'generator.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { generateMsx2Screen5BitmapRoomFiles } = await import(pathToFileURL(out).href);

const MUSIC_NONE = '__none';

// ---- fixture ---------------------------------------------------------------
const paletteSlots = base => Array.from({ length: 16 }, (_unused, i) => ({
  slotIndex: i,
  masterIndex: i === 0 ? -1 : (base + i * 9) % 512,
  hex: '#000000',
}));

const makeRoom = id => ({
  id,
  name: id,
  width: 256,
  height: 192,
  backgroundColor: 1,
  palette: paletteSlots(3),
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

const makeWorld = (id, name, roomIds) => ({
  id,
  name,
  startScreenNodeId: `${id}_n0`,
  nodes: roomIds.map((roomId, index) => ({ id: `${id}_n${index}`, screenAssetId: roomId, position: { x: index * 200, y: 0 } })),
  connections: [],
});

// Two PSG tracker songs: enough for the generator to emit the music runtime and
// a two-entry track table (indices 0 and 1 in music_play_track order).
const makeTrack = (id, name) => ({
  id,
  name,
  title: name,
  author: 'contract check',
  soundChip: 'PSG',
  bpm: 125,
  speed: 6,
  globalVolume: 15,
  patterns: [{
    id: `${id}_p0`,
    name: 'P0',
    numRows: 8,
    rows: Array.from({ length: 8 }, (_unused, rowIndex) => ({
      A: { note: rowIndex === 0 ? 'C-4' : null, instrument: null, ornament: null, volume: 15 },
      B: { note: null, instrument: null, ornament: null, volume: null },
      C: { note: null, instrument: null, ornament: null, volume: null },
    })),
  }],
  order: [{ patternId: `${id}_p0` }],
  lengthInPatterns: 1,
  restartPosition: 0,
  instruments: [],
  ornaments: [],
  currentPatternIndexInOrder: 0,
});

const rooms = [makeRoom('room_a0'), makeRoom('room_b0')];
const worldA = makeWorld('world_a', 'World A', ['room_a0']);
const worldB = makeWorld('world_b', 'World B', ['room_b0']);
const trackA = makeTrack('track_a', 'Track A');
const trackB = makeTrack('track_b', 'Track B');

const gameFlow = (worldMusic) => ({
  purpose: 'screen4-bitmap-runtime',
  name: 'Main MSX2',
  startNodeId: 'gf_start',
  nodes: [
    { id: 'gf_start', type: 'Start' },
    { id: 'gf_link0', type: 'WorldLink', worldAssetId: 'world_a', ...(worldMusic[0] ? { musicTrackAssetId: worldMusic[0] } : {}) },
    { id: 'gf_link1', type: 'WorldLink', worldAssetId: 'world_b', ...(worldMusic[1] ? { musicTrackAssetId: worldMusic[1] } : {}) },
    { id: 'gf_end', type: 'End', title: 'GAME OVER' },
  ],
  connections: [
    { id: 'gc0', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_link0' } },
    { id: 'gc1', from: { nodeId: 'gf_link0' }, to: { nodeId: 'gf_link1' } },
    { id: 'gc2', from: { nodeId: 'gf_link1' }, to: { nodeId: 'gf_end' } },
  ],
});

const buildAsm = (worldMusic, { withTracks = true } = {}) => {
  const flow = gameFlow(worldMusic);
  const tracks = withTracks ? [trackA, trackB] : [];
  const analysis = {
    msx2BitmapRooms: rooms,
    worldmaps: [worldA, worldB],
    msx2GameFlows: [flow],
    tiles: [],
    tracks,
    assets: [
      ...rooms.map(room => ({ id: room.id, name: room.name, type: 'msx2bitmaproom', data: room })),
      ...[worldA, worldB].map(world => ({ id: world.id, name: world.name, type: 'worldmap', data: world })),
      ...tracks.map(track => ({ id: track.id, name: track.name, type: 'track', data: track })),
      { id: 'flow', name: 'Main MSX2', type: 'msx2gameflow', data: flow },
    ],
  };
  const files = generateMsx2Screen5BitmapRoomFiles('worldlink_music_check', analysis, {
    screenMode: 'SCREEN 4 (Graphics II)',
    romMode: 'megarom',
    targetFormat: 'konami',
  });
  return files['unitedFiles.asm'];
};

const inherited = buildAsm([undefined, undefined]);
const perWorld = buildAsm([trackB.id, trackA.id]);
const silentFirst = buildAsm([MUSIC_NONE, trackA.id]);
const noTracks = buildAsm([trackB.id, MUSIC_NONE], { withTracks: false });

if (process.env.MIDEAS_DUMP_ASM) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(process.env.MIDEAS_DUMP_ASM, 'worldlink_music_inherited.asm'), inherited);
  writeFileSync(join(process.env.MIDEAS_DUMP_ASM, 'worldlink_music_per_world.asm'), perWorld);
  writeFileSync(join(process.env.MIDEAS_DUMP_ASM, 'worldlink_music_silent.asm'), silentFirst);
}

const count = (text, needle) => text.split(needle).length - 1;
const BOOT_AUTOPLAY = 'call music_play_track    ; no Music node in the flow: autoplay track 0 (loop)';
// Body of one WorldLink node: from its world selection to the gameplay loop call.
const worldLinkBody = (text, worldAssetId) => {
  const after = text.split(`; world "${worldAssetId}"`)[1] || '';
  return after.split('call bitmap_enter_game_loop')[0];
};

const checks = [];

// ---- unset: nothing changes -------------------------------------------------
checks.push([
  'A WorldLink without world music emits no music code of its own',
  count(worldLinkBody(inherited, 'world_a'), 'call music_play_track') === 0
    && count(worldLinkBody(inherited, 'world_a'), 'call music_stop') === 0,
]);
checks.push([
  'Legacy graphs (no Music node, no world music) keep the boot autoplay',
  inherited.includes(BOOT_AUTOPLAY),
]);

// ---- per-world track --------------------------------------------------------
checks.push([
  'Configured world music replaces the boot autoplay',
  !perWorld.includes(BOOT_AUTOPLAY) && !silentFirst.includes(BOOT_AUTOPLAY),
]);
checks.push([
  'Each WorldLink plays ITS OWN track, looped, before entering the gameplay loop',
  (() => {
    const a = worldLinkBody(perWorld, 'world_a');
    const b = worldLinkBody(perWorld, 'world_b');
    return /ld a, 1\s+; World music: track 1 \(loop\)\s*\n\s*ld b, 1\s*\n\s*call music_play_track/.test(a)
      && /ld a, 0\s+; World music: track 0 \(loop\)\s*\n\s*ld b, 1\s*\n\s*call music_play_track/.test(b);
  })(),
]);
checks.push([
  'The previous song is stopped before the new world loads (no drone across the load)',
  (() => {
    const body = worldLinkBody(perWorld, 'world_a');
    return body.indexOf('call music_stop') >= 0
      && body.indexOf('call music_stop') < body.indexOf('call music_play_track');
  })(),
]);

// ---- None -------------------------------------------------------------------
checks.push([
  'A world set to None enters in silence: stop, and no play',
  (() => {
    const body = worldLinkBody(silentFirst, 'world_a');
    return body.includes('call music_stop           ; World music: None (enter in silence)')
      && count(body, 'call music_play_track') === 0;
  })(),
]);
checks.push([
  'None on one world does not silence the world that does choose a track',
  count(worldLinkBody(silentFirst, 'world_b'), 'call music_play_track') === 1,
]);

// ---- leaving the world ------------------------------------------------------
checks.push([
  'Leaving the gameplay loop always stops the song',
  /\.bitmap_gameflow_exit:[\s\S]*?call music_stop/.test(perWorld),
]);

// ---- no music runtime -------------------------------------------------------
checks.push([
  'Without tracks the world music setting emits no call to a missing runtime',
  !noTracks.includes('call music_play_track')
    && !noTracks.includes('call music_stop')
    && noTracks.includes('; World music "track_b" skipped'),
]);

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
}
if (failed) {
  throw new Error(`MSX2 WorldLink music checks failed: ${failed}`);
}
console.log('MSX2 WorldLink music checks passed.');
