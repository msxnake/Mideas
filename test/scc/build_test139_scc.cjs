// Diagnose/fix "test139.json has no music": the project only had PSG and
// PSG+SCC tracks (the bitmap route only plays soundChip:'SCC' today) and its
// Music node had stop:true + autoPlay:false, which compiles to music_stop.
// This script:
//   1. Converts the PSG song "C Major Chiptune Loop" to an SCC track
//      (channels A/B/C -> 1/2/3, instruments mapped to the SCC presets).
//   2. Fixes the Music node (play the SCC track, loop, autoplay).
//   3. Writes the patched project to Downloads/test139_scc.json (original
//      test139.json untouched) and generates the MegaROM ASM from it.
// Usage: node test/scc/build_test139_scc.cjs [scc|psg|dual|mbank|mbank_psg]
//   scc  (default) Music node -> converted SCC track  -> out/test139_scc.asm
//   psg            Music node -> original PSG track   -> out/test139_psg.asm
//   dual           Music node -> PSG+SCC dual track   -> out/test139_dual.asm
//   mbank          all 3 tracks + SCC channels merged into the dual track
//                  (~10KB of song data -> spills into a SECOND music bank);
//                  Music node -> dual track (bank 0). Writes the merged
//                  project to Downloads/test139_scc.json.
//   mbank_psg      same project, Music node -> plain PSG track, whose data
//                  lives in music bank 1: exercises the bank switch.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..', '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'msxGenerator', 'index.js'));
const presets = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'audio', 'sccInstrumentPresets.js'));

const projectPath = path.join(os.homedir(), 'Downloads', 'test139.json');
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const assets = project.assets;

const psgTrack = assets.find((a) => a.type === 'track' && a.data?.soundChip === 'PSG');
if (!psgTrack) throw new Error('expected the PSG track "C Major Chiptune Loop"');
const song = psgTrack.data;

// Their PSG instruments -> SCC presets, keeping the cell-referenced ids.
const presetByInstrumentId = {
  1: presets.SCC_PRESET_PIANO,   // Happy Chiptune Piano
  2: presets.SCC_PRESET_BASS,    // Round Bass
  5: presets.SCC_PRESET_KICK,    // Soft Kick
  6: presets.SCC_PRESET_SNARE,   // Arcade Snare
  7: presets.SCC_PRESET_HIHAT,   // Tiny Hat
};
const usedInstrumentIds = new Set();
for (const pattern of song.patterns) {
  for (const row of pattern.rows) {
    for (const cell of Object.values(row)) {
      if (cell && cell.instrument) usedInstrumentIds.add(cell.instrument);
    }
  }
}
for (const id of usedInstrumentIds) {
  if (!presetByInstrumentId[id]) throw new Error(`no SCC preset mapped for instrument id ${id}`);
}

const sccInstruments = [...usedInstrumentIds].sort((a, b) => a - b).map((id) => ({
  ...JSON.parse(JSON.stringify(presetByInstrumentId[id])),
  id,
  name: `${(song.instruments.find((i) => i.id === id) || {}).name || 'Instrument'} (SCC)`,
}));

const emptyCell = () => ({ note: null, instrument: null, ornament: null, volume: null });
const toSccCell = (cell) => cell
  ? { note: cell.note ?? null, instrument: cell.instrument ?? null, ornament: null, volume: cell.volume ?? null }
  : emptyCell();

const sccPatterns = song.patterns.map((pattern) => ({
  id: `${pattern.id}_scc`,
  name: pattern.name,
  numRows: pattern.numRows,
  rows: pattern.rows.map((row) => ({
    1: toSccCell(row.A),
    2: toSccCell(row.B),
    3: toSccCell(row.C),
    4: emptyCell(),
    5: emptyCell(),
  })),
}));

const sccTrackId = 'track_scc_test139';
const sccSong = {
  id: sccTrackId,
  name: `${song.name} (SCC)`,
  playbackBackend: 'native',
  soundChip: 'SCC',
  title: song.title || song.name,
  author: song.author || '',
  bpm: song.bpm,
  speed: song.speed,
  globalVolume: song.globalVolume,
  patterns: sccPatterns,
  order: [...song.order],
  lengthInPatterns: song.lengthInPatterns,
  restartPosition: song.restartPosition,
  instruments: sccInstruments,
  ornaments: [],
  currentPatternIndexInOrder: 0,
};

project.assets = assets.filter((a) => a.id !== sccTrackId);
project.assets.push({ id: sccTrackId, name: sccSong.name, type: 'track', data: sccSong });

// Fix the Music node: it had stop:true + autoPlay:false -> compiled to music_stop.
const flowAsset = project.assets.find((a) => a.type === 'msx2gameflow');
if (!flowAsset) throw new Error('project has no msx2gameflow');
const musicNodes = flowAsset.data.nodes.filter((n) => n.type === 'Music');
if (musicNodes.length === 0) throw new Error('gameflow has no Music node');
for (const node of musicNodes) {
  delete node.stop;
  node.autoPlay = true;
  node.loop = true;
  node.trackAssetId = sccTrackId;
}

const variant = (process.argv[2] || 'scc').toLowerCase();
if (variant !== 'scc') {
  const dualAsset = assets.find((a) => a.type === 'track' && a.data?.soundChip === 'PSG+SCC');
  const wanted = variant === 'psg' || variant === 'mbank_psg' ? psgTrack.id : (dualAsset || {}).id;
  if (!wanted) throw new Error(`no track found for variant "${variant}"`);
  for (const node of musicNodes) node.trackAssetId = wanted;
  if ((variant === 'mbank' || variant === 'mbank_psg') && dualAsset) {
    // Multi-bank fixture: keep ALL tracks and give the dual track a real SCC
    // half (same merge as dual8). Serialized song data then exceeds one 8KB
    // music bank and must spill into a second one.
    const dual = dualAsset.data;
    dual.sccEnabled = true;
    dual.instruments = [
      ...dual.instruments.filter((inst) => !Array.isArray(inst.waveform)),
      ...sccInstruments,
    ];
    dual.patterns.forEach((pattern, patternIndex) => {
      const sccPattern = sccPatterns[patternIndex];
      if (!sccPattern) return;
      pattern.rows.forEach((row, rowIndex) => {
        const sccRow = sccPattern.rows[rowIndex] || {};
        for (const ch of ['1', '2', '3', '4', '5']) row[ch] = sccRow[ch] || emptyCell();
      });
    });
  }
  if (variant === 'dual8' && dualAsset) {
    // Keep ONLY the merged dual track: three copies of the same song (~10KB
    // of halves) overflow the single 8KB music data bank; a real project
    // ships distinct songs, this fixture only needs the 8-channel one.
    project.assets = project.assets.filter((a) => a.type !== 'track' || a.id === dualAsset.id);
    // Merge the converted SCC channels into the dual track so BOTH chips play
    // at once (PSG A-C + SCC 1-3): the real 8-channel Konami-style test.
    const dual = dualAsset.data;
    dual.sccEnabled = true;
    dual.instruments = [
      ...dual.instruments.filter((inst) => !Array.isArray(inst.waveform)),
      ...sccInstruments,
    ];
    dual.patterns.forEach((pattern, patternIndex) => {
      const sccPattern = sccPatterns[patternIndex];
      if (!sccPattern) return;
      pattern.rows.forEach((row, rowIndex) => {
        const sccRow = sccPattern.rows[rowIndex] || {};
        for (const ch of ['1', '2', '3', '4', '5']) row[ch] = sccRow[ch] || emptyCell();
      });
    });
  }
}

const patchedPath = path.join(os.homedir(), 'Downloads', 'test139_scc.json');
if (variant === 'scc' || variant === 'mbank') {
  fs.writeFileSync(patchedPath, JSON.stringify(project, null, 2));
  console.log('patched project written:', patchedPath);
}

const files = generator.generateModularASM(`test139_${variant}`, project.assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: project.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-bitmap-room',
});
const asm = files['unitedFiles.asm'] || files['main.asm'] || '';
if (!asm) throw new Error('no unified ASM. files=' + Object.keys(files).join(','));

const outDir = path.join(ROOT, 'test', 'scc', 'out');
fs.mkdirSync(outDir, { recursive: true });
const asmPath = path.join(outDir, `test139_${variant}.asm`);
fs.writeFileSync(asmPath, asm);
console.log('asm written:', asmPath, `${(asm.length / 1024).toFixed(0)}KB`);

for (const marker of ['music_play_track', 'scc_music_update', 'music_init_system']) {
  if (!asm.includes(marker)) throw new Error(`marker missing in ASM: ${marker}`);
}
console.log('music runtime markers present');
