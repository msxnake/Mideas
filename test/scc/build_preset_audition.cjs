// Audition ROM for the SCC instrument library: plays every preset in
// sequence on channel 1 (8 rows each) so the whole library can be heard in
// one WAV recording. Uses the standalone Fase 1 test-ROM harness.
// Usage: node test/scc/build_preset_audition.cjs
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const { generateSccTestRom } = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'msxGenerator', 'generators', 'sccSoundGenerator.js'));
const { SCC_INSTRUMENT_PRESET_GROUPS } = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'audio', 'sccInstrumentPresets.js'));

// Audition note per family: basses low, bells high, drums pick their colour.
const noteForPreset = (groupName, preset) => {
  if (preset.noiseMode) {
    return { Bombo: 'C-2', Tom: 'C-3', Caja: 'C-5', 'Hi-Hat': 'B-6', Platillo: 'A-6' }[preset.name] || 'C-5';
  }
  if (groupName === 'Bajos') return 'C-2';
  if (groupName === 'Campanas') return 'C-5';
  return 'C-4';
};

const auditions = [];
const instruments = [];
let nextId = 1;
for (const group of SCC_INSTRUMENT_PRESET_GROUPS) {
  for (const preset of group.presets) {
    const id = nextId++;
    instruments.push({ ...preset, id });
    auditions.push({ id, note: noteForPreset(group.name, preset), name: preset.name });
  }
}
if (instruments.length > 31) throw new Error(`too many presets for SCC instrument ids: ${instruments.length}`);

// 8 rows per instrument: note-on at row 0, note-cut at row 6.
const cell = (note = null, instrument = null, volume = null, ornament = null) => ({ note, instrument, ornament, volume });
const emptyRow = () => ({ 1: cell(), 2: cell(), 3: cell(), 4: cell(), 5: cell() });
const ROWS_PER_AUDITION = 8;
const AUDITIONS_PER_PATTERN = 8;

const patterns = [];
for (let p = 0; p * AUDITIONS_PER_PATTERN < auditions.length; p++) {
  const slice = auditions.slice(p * AUDITIONS_PER_PATTERN, (p + 1) * AUDITIONS_PER_PATTERN);
  const rows = [];
  for (const audition of slice) {
    for (let r = 0; r < ROWS_PER_AUDITION; r++) {
      const row = emptyRow();
      if (r === 0) row['1'] = cell(audition.note, audition.id, 15);
      if (r === 6) row['1'] = cell('===');
      rows.push(row);
    }
  }
  while (rows.length < AUDITIONS_PER_PATTERN * ROWS_PER_AUDITION) rows.push(emptyRow());
  patterns.push({ id: `aud_${p}`, name: `Audition ${p}`, numRows: rows.length, rows });
}

const song = {
  id: 'scc_preset_audition',
  name: 'SCC preset audition',
  soundChip: 'SCC',
  bpm: 150,
  speed: 6, // 6 frames/row -> 0.8s per instrument
  globalVolume: 15,
  patterns,
  order: patterns.map((_p, index) => index),
  lengthInPatterns: patterns.length,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments,
  ornaments: [],
};

const { asm, warnings, waveformCount } = generateSccTestRom([song]);
const outDir = path.join(ROOT, 'test', 'scc', 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'preset_audition.asm'), asm);
const secondsTotal = (auditions.length * ROWS_PER_AUDITION * 6) / 60;
console.log(JSON.stringify({
  presets: auditions.map((a) => `${a.name}@${a.note}`),
  count: auditions.length,
  waveformCount,
  seconds: secondsTotal,
  warnings,
}, null, 2));
