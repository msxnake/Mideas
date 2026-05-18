import { PT3Instrument, TrackerPattern, TrackerRow, TrackerSongData } from '../types';

const emptyCell = () => ({
  note: '---',
  instrument: null,
  ornament: null,
  volume: null,
});

const createEmptySampleRows = (): TrackerRow[] => (
  Array.from({ length: 64 }, () => ({
    A: emptyCell(),
    B: emptyCell(),
    C: emptyCell(),
  }))
);

const placeNote = (
  rows: TrackerRow[],
  channel: 'A' | 'B' | 'C',
  row: number,
  note: string,
  instrument: number,
  volume: number = 15
) => {
  rows[row][channel] = {
    note,
    instrument,
    ornament: null,
    volume,
  };
};

const placeSequence = (
  rows: TrackerRow[],
  channel: 'A' | 'B' | 'C',
  notes: string[],
  instrument: number,
  step: number,
  volume: number = 15
) => {
  notes.forEach((note, index) => {
    if (note !== '---') {
      placeNote(rows, channel, index * step, note, instrument, volume);
    }
  });
};

const placeChiptuneRhythm = (rows: TrackerRow[]) => {
  [0, 8, 16, 24, 32, 40, 48, 56].forEach(row => placeNote(rows, 'C', row, 'C-2', 5, 15));
  [12, 28, 44, 60].forEach(row => placeNote(rows, 'C', row, 'D-2', 6, 14));
  [4, 10, 14, 20, 26, 34, 38, 42, 50, 54, 58, 62].forEach(row => placeNote(rows, 'C', row, 'F#2', 7, 10));
};

const createCmajorPatterns = (): TrackerPattern[] => {
  const mainLoopRows = createEmptySampleRows();
  const brightTurnRows = createEmptySampleRows();

  placeSequence(mainLoopRows, 'A', [
    'C-5', 'G-4', 'E-4', 'C-4',
    'F-4', 'A-4', 'C-5', 'B-4',
    'G-4', 'B-4', 'D-5', 'C-5',
    'E-5', 'D-5', 'C-5', 'G-4',
    'A-4', 'C-5', 'G-4', '---',
    'F-4', 'E-4', 'D-4', 'C-4',
  ], 1, 2, 15);

  placeSequence(brightTurnRows, 'A', [
    'C-5', 'E-5', 'G-5', 'E-5',
    'F-5', 'E-5', 'C-5', 'A-4',
    'G-4', 'B-4', 'D-5', 'G-5',
    'E-5', 'D-5', 'C-5', 'G-4',
    'A-4', 'C-5', 'E-5', 'G-5',
    'F-5', 'E-5', 'D-5', 'C-5',
  ], 1, 2, 15);

  placeSequence(mainLoopRows, 'B', [
    'C-2', 'C-2', 'G-1', 'C-2',
    'F-2', 'F-2', 'C-2', 'F-2',
    'G-2', 'G-2', 'D-2', 'G-2',
    'C-2', 'G-1', 'C-2', 'G-1',
  ], 2, 4, 15);

  placeSequence(brightTurnRows, 'B', [
    'C-2', 'E-2', 'G-2', 'C-2',
    'F-2', 'A-2', 'C-2', 'F-2',
    'G-2', 'B-1', 'D-2', 'G-2',
    'C-2', 'G-1', 'C-2', 'C-2',
  ], 2, 4, 15);

  placeChiptuneRhythm(mainLoopRows);
  placeChiptuneRhythm(brightTurnRows);

  return [
    {
      id: `sample_cmaj_loop_a_${Date.now()}`,
      name: 'Main Loop',
      numRows: 64,
      rows: mainLoopRows,
    },
    {
      id: `sample_cmaj_loop_b_${Date.now()}`,
      name: 'Bright Turn',
      numRows: 64,
      rows: brightTurnRows,
    },
  ];
};

const createCmajorInstruments = (): PT3Instrument[] => [
  {
    id: 1,
    name: 'Happy Chiptune Piano',
    volumeEnvelope: [15, 15, 14, 13, 11, 9, 7, 5, 3, 1, 0],
    toneEnvelope: [0],
    noiseEnvelope: [],
    volumeLoop: 255,
    toneLoop: 255,
    noiseLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
  },
  {
    id: 2,
    name: 'Round Bass',
    volumeEnvelope: [15, 14, 13, 12, 10, 8, 5, 2, 0],
    toneEnvelope: [0, -1, 0],
    noiseEnvelope: [],
    volumeLoop: 255,
    toneLoop: 255,
    noiseLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
  },
  {
    id: 5,
    name: 'Soft Kick',
    volumeEnvelope: [15, 13, 10, 6, 2, 0],
    toneEnvelope: [-28, -16, -7, 0],
    noiseEnvelope: [2, 4, 8, 14],
    volumeLoop: 255,
    toneLoop: 255,
    noiseLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: true,
    noiseBaseFrequency: 2,
  },
  {
    id: 6,
    name: 'Arcade Snare',
    volumeEnvelope: [14, 11, 8, 4, 1, 0],
    toneEnvelope: [0],
    noiseEnvelope: [8, 12, 18, 24],
    volumeLoop: 255,
    toneLoop: 255,
    noiseLoop: 255,
    ayToneEnabled: false,
    ayNoiseEnabled: true,
    noiseBaseFrequency: 8,
  },
  {
    id: 7,
    name: 'Tiny Hat',
    volumeEnvelope: [9, 7, 4, 1, 0],
    toneEnvelope: [0],
    noiseEnvelope: [2, 3, 4, 6],
    volumeLoop: 255,
    toneLoop: 255,
    noiseLoop: 255,
    ayToneEnabled: false,
    ayNoiseEnabled: true,
    noiseBaseFrequency: 2,
  },
];

export const createCmajorChiptuneSampleSong = (
  id: string = `sample_c_major_chiptune_loop_${Date.now()}`
): TrackerSongData => {
  const patterns = createCmajorPatterns();
  const order = [0, 1];

  return {
    id,
    name: 'C Major Chiptune Loop',
    soundChip: 'PSG',
    title: 'C Major Chiptune Loop',
    author: 'Codex',
    bpm: 150,
    speed: 5,
    globalVolume: 15,
    patterns,
    order,
    lengthInPatterns: order.length,
    restartPosition: 0,
    instruments: createCmajorInstruments(),
    ornaments: [],
    currentPatternIndexInOrder: 0,
    currentPatternId: patterns[0].id,
    ayHardwareEnvelopePeriod: 1,
    ayNoisePeriod: 12,
    playbackBackend: 'native',
    externalPt3Data: undefined,
    externalPt3HasHeader: undefined,
  };
};
