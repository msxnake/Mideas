// Mini-song "Mideas Overworld" — composed with the Fase 5 instrument presets
// (piano / flute / bass / kick / snare / hi-hat). Emits:
//   1. test/scc/minisong.asm            standalone SCC test ROM (quick listen)
//   2. test/scc/out/minisong_game.json  full game fixture: fixture_base.json +
//      the track asset + a Music node wired into the Game Flow before WorldLink.
// Usage: node test/scc/build_minisong.mjs
import fs from 'node:fs';
import path from 'node:path';
import { generateSccTestRom } from '../ts_build_scc/utils/msxGenerator/generators/sccSoundGenerator.js';
import { SCC_INSTRUMENT_PRESETS } from '../ts_build_scc/utils/audio/sccInstrumentPresets.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '..');

const cell = (note = null, instrument = null, volume = null, ornament = null) => ({ note, instrument, ornament, volume });
const emptyRow = () => ({ 1: cell(), 2: cell(), 3: cell(), 4: cell(), 5: cell() });

// row -> [note, instrument, volume?]
function pattern(id, name, lanes) {
  const rows = [];
  for (let r = 0; r < 32; r++) {
    const row = emptyRow();
    for (const ch of ['1', '2', '3', '4', '5']) {
      const hit = lanes[ch]?.[r];
      if (hit) row[ch] = cell(hit[0], hit[1], hit[2] ?? null);
    }
    rows.push(row);
  }
  return { id, name, numRows: 32, rows };
}

// Drums shared by both patterns: kick 0/8/16/24, snare 4/12/20/28, hat evens.
const drums4 = {};
const drums5 = {};
for (let r = 0; r < 32; r += 8) drums4[r] = ['C-2', 4];
for (let r = 4; r < 32; r += 8) drums4[r] = ['C-5', 5];
for (let r = 0; r < 32; r += 2) drums5[r] = ['A-6', 6, r % 4 === 0 ? 9 : 6];

// Pattern A: Am - F - C - G
const pA = pattern('mo_a', 'A', {
  1: { // piano melody
    0: ['A-4', 1], 2: ['C-5', 1], 4: ['E-5', 1], 6: ['C-5', 1],
    8: ['F-4', 1], 10: ['A-4', 1], 12: ['C-5', 1], 14: ['A-4', 1],
    16: ['G-4', 1], 18: ['C-5', 1], 20: ['E-5', 1], 22: ['C-5', 1],
    24: ['G-4', 1], 26: ['B-4', 1], 28: ['D-5', 1], 30: ['B-4', 1],
  },
  2: { // flute pads
    0: ['E-5', 2, 10], 8: ['C-5', 2, 10], 16: ['E-5', 2, 10], 24: ['D-5', 2, 10],
  },
  3: { // bass
    0: ['A-1', 3], 4: ['E-2', 3], 8: ['F-1', 3], 12: ['C-2', 3],
    16: ['C-2', 3], 20: ['G-2', 3], 24: ['G-1', 3], 28: ['D-2', 3],
  },
  4: drums4,
  5: drums5,
});

// Pattern B: Am - F - E - Am (cadence)
const pB = pattern('mo_b', 'B', {
  1: {
    0: ['A-4', 1], 2: ['C-5', 1], 4: ['E-5', 1], 6: ['A-5', 1],
    8: ['F-5', 1], 10: ['C-5', 1], 12: ['A-4', 1], 14: ['F-4', 1],
    16: ['E-4', 1], 18: ['G#4', 1], 20: ['B-4', 1], 22: ['E-5', 1],
    24: ['A-4', 1], 26: ['C-5', 1], 28: ['E-5', 1], 30: ['A-5', 1],
  },
  2: {
    0: ['C-5', 2, 10], 8: ['A-4', 2, 10], 16: ['B-4', 2, 10], 24: ['C-5', 2, 11],
  },
  3: {
    0: ['A-1', 3], 4: ['E-2', 3], 8: ['F-1', 3], 12: ['C-2', 3],
    16: ['E-1', 3], 20: ['B-1', 3], 24: ['A-1', 3], 28: ['E-2', 3],
  },
  4: drums4,
  5: drums5,
});

const song = {
  id: 'scc_minisong_overworld',
  name: 'Mideas Overworld',
  soundChip: 'SCC',
  title: 'Mideas Overworld',
  author: 'Mideas',
  bpm: 150,
  speed: 5, // rowFrames = 150*5/150 = 5 -> 12 rows/s
  globalVolume: 15,
  patterns: [pA, pB],
  order: [0, 0, 1, 1],
  lengthInPatterns: 4,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments: SCC_INSTRUMENT_PRESETS,
  ornaments: [],
};

// 1. Standalone test ROM (same harness as scc_track_test).
const { asm, warnings, waveformCount } = generateSccTestRom([song]);
fs.writeFileSync(path.join(ROOT, 'test', 'scc', 'minisong.asm'), asm);

// 2. Full-game fixture: fixture_base + track asset + Music node before WorldLink.
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-destroy', 'fixture_base.json'), 'utf8'));
const trackAssetId = 'track_scc_minisong';
base.assets = (base.assets || []).filter((asset) => asset.id !== trackAssetId);
base.assets.push({ id: trackAssetId, name: song.name, type: 'track', data: song });

const flowAsset = base.assets.find((asset) => asset.type === 'msx2gameflow');
if (!flowAsset?.data?.startNodeId) throw new Error('fixture_base needs an msx2gameflow with startNodeId');
const flow = flowAsset.data;
const startId = flow.startNodeId;
const outgoing = flow.connections.find((connection) => connection.from?.nodeId === startId && !connection.from?.sourceId);
if (!outgoing) throw new Error('start node has no outgoing connection');
const musicId = 'minisong_music_node';
flow.nodes = flow.nodes.filter((node) => node.id !== musicId);
flow.nodes.push({ id: musicId, type: 'Music', position: { x: 180, y: 20 }, trackAssetId, loop: true, autoPlay: true });
const previousTarget = outgoing.to.nodeId;
outgoing.to = { nodeId: musicId };
flow.connections = flow.connections.filter((connection) => connection.id !== 'minisong_music_edge');
flow.connections.push({ id: 'minisong_music_edge', from: { nodeId: musicId }, to: { nodeId: previousTarget } });

const outDir = path.join(ROOT, 'test', 'scc', 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'minisong_game.json'), JSON.stringify(base, null, 2));

console.log(JSON.stringify({ warnings, waveformCount, patterns: song.patterns.length, order: song.order }, null, 2));
