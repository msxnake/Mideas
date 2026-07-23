// PSG percussion audition: the InstrumentEditorModal drum recipes (Kick,
// Snares, Hi-Hats, Tom — volume 0-127 scale + tone sweeps + noise envelopes)
// played in-game through the dual-chip pipeline, drums on channel A and
// channel C left FREE for gameplay SFX (the recommended convention).
// Usage: node test/scc/build_psg_drums.cjs
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'msxGenerator', 'index.js'));

const drum = (id, name, extra) => ({ id, name, ayToneEnabled: true, ayNoiseEnabled: true, ...extra });
const drums = [
  drum(1, 'Kick', { volumeEnvelope: [127, 118, 100, 78, 56, 32, 12, 0], toneEnvelope: [-24, -18, -14, -10, -7, -4, -2, 0], noiseEnvelope: [2, 4, 7, 12, 20, 31], noiseBaseFrequency: 2, note: 'C-3' }),
  drum(2, 'Kick Techno', { volumeEnvelope: [127, 127, 120, 108, 90, 68, 42, 20, 0], toneEnvelope: [-30, -24, -18, -13, -9, -6, -3, 0], noiseEnvelope: [1, 2, 4, 8, 16, 31], noiseBaseFrequency: 1, note: 'C-3' }),
  drum(3, 'Snare', { volumeEnvelope: [15, 13, 10, 8, 6, 4, 2, 0], toneEnvelope: [7, 4, 2, 0], noiseEnvelope: [3, 5, 8, 12, 18, 24, 31], noiseBaseFrequency: 8, note: 'C-5' }),
  drum(4, 'Snare Seca', { volumeEnvelope: [127, 110, 84, 56, 30, 10, 0], toneEnvelope: [5, 2, 0], noiseEnvelope: [4, 6, 9, 14, 22, 31], noiseBaseFrequency: 4, note: 'C-5' }),
  drum(5, 'Snare Gorda', { volumeEnvelope: [127, 124, 116, 102, 84, 60, 38, 18, 0], toneEnvelope: [10, 7, 5, 3, 1, 0], noiseEnvelope: [2, 3, 5, 8, 12, 18, 26, 31], noiseBaseFrequency: 2, note: 'C-4' }),
  drum(6, 'Hi-Hat', { volumeEnvelope: [120, 84, 48, 20, 0], ayToneEnabled: false, noiseEnvelope: [1, 1, 2, 4, 8, 16, 31], noiseBaseFrequency: 1, note: 'C-6' }),
  drum(7, 'Metal Hat', { volumeEnvelope: [13, 10, 7, 4, 2, 0], toneEnvelope: [0, 12, 0, 19, 0, 12], toneLoop: 0, noiseEnvelope: [1, 1, 2, 3, 5, 8, 13, 21, 31], noiseBaseFrequency: 1, note: 'C-6' }),
  drum(8, 'Hollow Tom', { volumeEnvelope: [15, 14, 12, 10, 8, 6, 4, 2, 1, 0], toneEnvelope: [-19, -15, -12, -9, -7, -5, -3, -2, -1, 0], noiseEnvelope: [6, 7, 9, 12, 16, 22, 31], noiseBaseFrequency: 6, note: 'C-4' }),
  drum(9, 'Noise Snare', { volumeEnvelope: [15, 14, 12, 9, 7, 5, 3, 2, 1, 0], toneEnvelope: [12, 7, 3, 0, -2], noiseEnvelope: [2, 3, 5, 7, 10, 14, 20, 28, 31], noiseBaseFrequency: 4, note: 'C-5' }),
];

const cell = (note = null, instrument = null, volume = null, ornament = null) => ({ note, instrument, ornament, volume });
const emptyRow = () => ({ A: cell(), B: cell(), C: cell() });
const ROWS_PER_DRUM = 8;
const rows = [];
for (const d of drums) {
  for (let r = 0; r < ROWS_PER_DRUM; r++) {
    const row = emptyRow();
    if (r === 0 || r === 4) row.A = cell(d.note, d.id, 15);   // two hits each
    rows.push(row);
  }
}

const trackAssetId = 'track_psg_drums_audition';
const song = {
  id: trackAssetId,
  name: 'PSG drums audition',
  playbackBackend: 'native',
  soundChip: 'PSG',
  bpm: 150,
  speed: 6,
  globalVolume: 15,
  patterns: [{ id: 'pd0', name: 'Drums', numRows: rows.length, rows }],
  order: [0],
  lengthInPatterns: 1,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments: drums.map(({ note, ...instrument }) => instrument),
  ornaments: [],
};

const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-destroy', 'fixture_base.json'), 'utf8'));
base.assets = (base.assets || []).filter((asset) => asset.id !== trackAssetId && asset.type !== 'track');
base.assets.push({ id: trackAssetId, name: song.name, type: 'track', data: song });

const flowAsset = base.assets.find((asset) => asset.type === 'msx2gameflow');
if (!flowAsset?.data?.startNodeId) throw new Error('fixture_base needs an msx2gameflow with startNodeId');
const flow = flowAsset.data;
const outgoing = flow.connections.find((connection) => connection.from?.nodeId === flow.startNodeId && !connection.from?.sourceId);
if (!outgoing) throw new Error('start node has no outgoing connection');
const musicId = 'psg_drums_music_node';
flow.nodes = flow.nodes.filter((node) => node.id !== musicId);
flow.nodes.push({ id: musicId, type: 'Music', position: { x: 180, y: 20 }, trackAssetId, loop: true, autoPlay: true });
const previousTarget = outgoing.to.nodeId;
outgoing.to = { nodeId: musicId };
flow.connections = flow.connections.filter((connection) => connection.id !== 'psg_drums_music_edge');
flow.connections.push({ id: 'psg_drums_music_edge', from: { nodeId: musicId }, to: { nodeId: previousTarget } });

const files = generator.generateModularASM('psg_drums', base.assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: base.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-bitmap-room',
});
const asm = files['unitedFiles.asm'] || files['main.asm'] || '';
if (!asm) throw new Error('no unified ASM. files=' + Object.keys(files).join(','));

const outDir = path.join(ROOT, 'test', 'scc', 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'psg_drums.asm'), asm);
for (const marker of ['psg_music_update_noise_macro', 'psg_music_update_pitch', 'noise_env']) {
  if (!asm.includes(marker)) throw new Error(`marker missing in ASM: ${marker}`);
}
console.log(JSON.stringify({
  drums: drums.map((d) => `${d.name}@${d.note}`),
  seconds: (rows.length * 6) / 60,
}, null, 2));
