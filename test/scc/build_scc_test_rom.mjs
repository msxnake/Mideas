// Build the Fase 1 SCC music test ROM from a Mideas-model fixture song.
// Usage: node test/scc/build_scc_test_rom.mjs
// Compiles utils/msxGenerator/generators/sccSoundGenerator.ts first via:
//   npx tsc utils/msxGenerator/generators/sccSoundGenerator.ts --outDir test/ts_build_scc \
//       --target es2020 --module es2020 --moduleResolution node --skipLibCheck
import fs from 'fs';
import {
  generateSccTestRom,
  collectSccTracks,
  buildSccNotePeriodTable,
} from '../ts_build_scc/utils/msxGenerator/generators/sccSoundGenerator.js';

// ---- sanity checks on the period table (must match the validated probe) ----
const periodTable = buildSccNotePeriodTable();
if (!periodTable.includes('#00FD')) {
  throw new Error('A4 period expected #00FD (253, probe-validated) somewhere in the table');
}

// ---- fixture: two patterns, three channels, two SCC instruments ------------
const triangle = [];
for (let i = 0; i < 32; i++) {
  const t = i < 16 ? i : 31 - i; // 0..15..0 symmetric ramp
  triangle.push(Math.round((t - 7.5) * 16.9));
}
const square = [];
for (let i = 0; i < 32; i++) square.push(i < 16 ? 112 : -112);

const cell = (note = null, instrument = null, volume = null) => ({ note, instrument, ornament: null, volume });
const emptyRow = () => ({ 1: cell(), 2: cell(), 3: cell(), 4: cell(), 5: cell() });

function makePattern(id, name, notes1, notes2, notes3) {
  const rows = [];
  for (let r = 0; r < 16; r++) {
    const row = emptyRow();
    if (notes1[r]) row['1'] = cell(notes1[r], 1, null);
    if (notes2[r]) row['2'] = cell(notes2[r], 2, null);
    if (notes3[r]) row['3'] = cell(notes3[r], 1, 10);
    rows.push(row);
  }
  return { id, name, numRows: 16, rows };
}

const melodyA = ['C-4', null, 'E-4', null, 'G-4', null, 'C-5', null, 'B-4', null, 'G-4', null, 'E-4', null, 'C-4', '==='];
const bassA = ['C-2', null, null, null, 'G-2', null, null, null, 'C-2', null, null, null, 'G-2', null, null, null];
const arpA = [null, 'E-5', null, 'G-5', null, 'C-6', null, null, null, 'E-5', null, 'G-5', null, 'C-6', null, null];

const melodyB = ['A-4', null, 'C-5', null, 'E-5', null, 'A-5', null, 'G-5', null, 'E-5', null, 'C-5', null, 'A-4', '==='];
const bassB = ['A-1', null, null, null, 'E-2', null, null, null, 'A-1', null, null, null, 'E-2', null, null, null];
const arpB = [null, 'A-5', null, 'C-6', null, 'E-6', null, null, null, 'A-5', null, 'C-6', null, 'E-6', null, null];

const song = {
  id: 'scc_fixture',
  name: 'scc fixture',
  soundChip: 'SCC',
  bpm: 150,
  speed: 6, // rowFrames = 150*6/150 = 6
  globalVolume: 15,
  patterns: [
    makePattern('p0', 'A', melodyA, bassA, arpA),
    makePattern('p1', 'B', melodyB, bassB, arpB),
  ],
  order: [0, 1],
  lengthInPatterns: 2,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments: [
    { id: 1, name: 'triangle', waveform: triangle, volume: 15, volumeEnvelope: [15, 14, 12, 10, 8, 7, 6, 5, 4, 4, 3, 3], volumeLoop: 0xff },
    { id: 2, name: 'square', waveform: square, volume: 13, volumeEnvelope: [13, 13, 12, 11, 10, 9], volumeLoop: 4 },
  ],
  ornaments: [],
};

// collectSccTracks must pick it up exactly like the future analysis path
const tracks = collectSccTracks({ tracks: [song, { ...song, id: 'psg', name: 'psg decoy', soundChip: 'PSG' }] });
if (tracks.length !== 1) throw new Error(`collectSccTracks expected 1 SCC track, got ${tracks.length}`);

const { asm, warnings, waveformCount } = generateSccTestRom(tracks);
fs.writeFileSync(new URL('./scc_track_test.asm', import.meta.url), asm);
console.log(JSON.stringify({ warnings, waveformCount, asmBytes: asm.length }, null, 2));
