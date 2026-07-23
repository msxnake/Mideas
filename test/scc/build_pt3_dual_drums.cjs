// PT3 noise verification ROM (dual PSG+SCC route):
//   channel A = "Mideas Dry Snare" (factory kit, 10 steps, loop 9 = silent, 9 noise steps)
//   channel B = KUVO "Forgotten puppet" S04 (REAL parsePT3Module+mergePT3Assets import,
//               18 steps, 16 noise steps) -> item 4 of the checklist
//   channel C = notes + instrument on every 4th row: MUST be ignored (SFX-only channel)
// Usage: node test/scc/build_pt3_dual_drums.cjs   (rebuild test/ts_build_full first)
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'msxGenerator', 'index.js'));

const factoryKit = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'temp', 'pt3-tests', 'factory_kit.json'), 'utf8'));
const kuvo = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'temp', 'pt3-tests', 'kuvo_imported_instruments.json'), 'utf8'));

const drySnare = factoryKit.find((i) => i.name === 'Mideas Dry Snare');
const kuvoS04 = kuvo.instruments.find((i) => i.name.startsWith('S04'));
const kuvoS01 = kuvo.instruments.find((i) => i.name.startsWith('S01'));
if (!drySnare?.pt3Sample || !kuvoS04?.pt3Sample || !kuvoS01?.pt3Sample) {
  throw new Error('missing PT3 source instruments (run the extract/dump scripts first)');
}

const instruments = [
  { ...drySnare, id: 1, chip: 'PSG' },
  { ...kuvoS04, id: 2, chip: 'PSG' },
  { ...kuvoS01, id: 3, chip: 'PSG' },
];

const cell = (note = null, instrument = null, volume = null, ornament = null) => ({ note, instrument, ornament, volume });
const emptyRow = () => ({ A: cell(), B: cell(), C: cell(), 1: cell(), 2: cell(), 3: cell(), 4: cell(), 5: cell() });
const rows = [];
for (let r = 0; r < 32; r++) {
  const row = emptyRow();
  if (r % 16 === 0) row.A = cell('C-5', 1, 15);          // Dry Snare: 10-step trace target
  if (r % 16 === 8) row.B = cell('C-3', 2, 15);          // KUVO S04: real imported noise sample
  if (r % 4 === 2) row.C = cell('C-4', 3, 15);           // MUST stay silent (SFX-only channel)
  rows.push(row);
}

const trackAssetId = 'track_pt3_dual_drums';
const song = {
  id: trackAssetId,
  name: 'PT3 dual drums probe',
  playbackBackend: 'native',
  soundChip: 'PSG+SCC',
  sccEnabled: true,
  bpm: 150,
  speed: 6,
  globalVolume: 15,
  patterns: [{ id: 'pd0', name: 'PT3Drums', numRows: rows.length, rows }],
  order: [0],
  lengthInPatterns: 1,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments,
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
const musicId = 'pt3_dual_music_node';
flow.nodes = flow.nodes.filter((node) => node.id !== musicId);
flow.nodes.push({ id: musicId, type: 'Music', position: { x: 180, y: 20 }, trackAssetId, loop: true, autoPlay: true });
const previousTarget = outgoing.to.nodeId;
outgoing.to = { nodeId: musicId };
flow.connections = flow.connections.filter((connection) => connection.id !== 'pt3_dual_music_edge');
flow.connections.push({ id: 'pt3_dual_music_edge', from: { nodeId: musicId }, to: { nodeId: previousTarget } });

const files = generator.generateModularASM('pt3_dual_drums', base.assets, {
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
fs.writeFileSync(path.join(outDir, 'pt3_dual_drums.asm'), asm);
for (const marker of [
  'music_update_one_pt3_channel',
  'psg_music_reset_pt3_channel',
  'music_pt3_volume_table',
  '_pt3_steps',
  'psg_music_update_pt3_channels',
]) {
  if (!asm.includes(marker)) throw new Error(`marker missing in ASM: ${marker}`);
}
const resetBlock = asm.split('psg_music_reset_pt3_channel:')[1]?.slice(0, 400) || '';
if (!resetBlock.includes('ld (hl), 0')) throw new Error('reset fix (ld (hl), 0) missing in generated ASM');
console.log('ASM ok:', path.join(outDir, 'pt3_dual_drums.asm'), `${(asm.length / 1024).toFixed(0)}KB`);
console.log('instruments:', instruments.map((i) => `${i.id}=${i.name} (${i.pt3Sample.steps.length} steps)`).join(' | '));
