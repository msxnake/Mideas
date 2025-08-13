
import { TrackerSongData, TrackerPattern, TrackerRow, TrackerCell, PT3Instrument, PT3Ornament } from '../../types';
import { DEFAULT_PT3_ROWS_PER_PATTERN, PT3_MAX_INSTRUMENTS, PT3_MAX_ORNAMENTS, DEFAULT_PT3_SPEED, DEFAULT_PT3_BPM } from '../../constants';

const createEmptyCell = (): TrackerCell => ({
  note: null,
  instrument: null,
  ornament: null,
  volume: null,
  // effectCmd: null, // Removed
  // effectVal: null, // Removed
});

const createEmptyRow = (): TrackerRow => ({
  A: createEmptyCell(),
  B: createEmptyCell(),
  C: createEmptyCell(),
});

const createPlaceholderPattern = (index: number): TrackerPattern => ({
  id: `imported_pattern_${index}`,
  name: `Pattern ${String(index).padStart(2, '0')}`,
  numRows: DEFAULT_PT3_ROWS_PER_PATTERN,
  rows: Array(DEFAULT_PT3_ROWS_PER_PATTERN).fill(null).map(() => createEmptyRow()),
});

export const parsePT3File = (arrayBuffer: ArrayBuffer): Partial<TrackerSongData> => {
  const view = new DataView(arrayBuffer);
  const textDecoder = new TextDecoder('ascii');

  if (arrayBuffer.byteLength < 100 + 4) { // Header + at least one order entry (simplified)
    throw new Error('File is too small to be a valid PT3 file.');
  }

  // Header (100 bytes)
  const title = textDecoder.decode(arrayBuffer.slice(0, 16)).replace(/\0/g, '').trim();
  // const pt2Tempo = view.getUint8(0x10); // Ignored in PT3
  const numberOfPatterns = view.getUint8(0x11);
  const songLengthOrderSteps = view.getUint8(0x12);
  // const patternTableSize = view.getUint8(0x13); // Always 128

  // Pointers (simplified for now - we'll use counts or direct creation)
  // const patternPointers = [];
  // for (let i = 0; i < 4; i++) { // 4 channels A, B, C, D
  //   patternPointers.push(view.getUint16(0x14 + i * 2, true));
  // }
  // const ornamentTablePointer = view.getUint16(0x1C, true);
  // const sampleTablePointer = view.getUint16(0x1E, true);

  const actualTempoSpeed = view.getUint8(0x1F); // This is the actual speed/tempo for PT3
  // const vibratoTable = arrayBuffer.slice(0x20, 0x40); // 32 bytes
  const loopPosition = view.getUint8(0x5F);

  // Pattern Order Table (starts at 0x64, 128 entries * 4 bytes/entry = 512 bytes)
  const order: number[] = [];
  const patternOrderTableOffset = 0x64;
  for (let i = 0; i < songLengthOrderSteps; i++) {
    // For simplicity, PT3 often uses the same pattern index for channels A,B,C in a given step.
    // We'll take the pattern index from Channel A. Channel D is usually for noise or unused.
    const patternIndexForStep = view.getUint8(patternOrderTableOffset + i * 4);
    order.push(patternIndexForStep);
  }

  // Placeholder Patterns
  const patterns: TrackerPattern[] = [];
  for (let i = 0; i < numberOfPatterns; i++) {
    patterns.push(createPlaceholderPattern(i));
  }
  if (patterns.length === 0 && order.length > 0) { // Ensure at least one pattern if order has entries
     patterns.push(createPlaceholderPattern(0));
  }


  // Placeholder Instruments (PT3 can have up to 31)
  const instruments: PT3Instrument[] = [];
  // A more robust PT3 parser would count from the sample table.
  // For now, we'll create a fixed number or make it configurable later.
  // Let's assume up to 16 based on common usage, or respect PT3_MAX_INSTRUMENTS
  const numInstrumentsToCreate = Math.min(PT3_MAX_INSTRUMENTS, 16); // Example: Create up to 16 placeholders
  for (let i = 1; i <= numInstrumentsToCreate; i++) {
    instruments.push({
      id: i,
      name: `Imp.Ins ${String(i).padStart(2, '0')}`,
      ayToneEnabled: true,
      volumeEnvelope: [],
      toneEnvelope: [],
    });
  }

  // Placeholder Ornaments (PT3 can have up to 15)
  const ornaments: PT3Ornament[] = [];
  // Similar to instruments, a real parser would analyze the ornament table.
  const numOrnamentsToCreate = Math.min(PT3_MAX_ORNAMENTS, 8); // Example: Create up to 8 placeholders
  for (let i = 1; i <= numOrnamentsToCreate; i++) {
    ornaments.push({
      id: i,
      name: `Imp.Orn ${String(i).padStart(2, '0')}`,
      data: [0], // Minimal valid ornament data
    });
  }

  return {
    title: title || 'Imported PT3 Song',
    author: "PT3 Import", // PT3 doesn't have a dedicated author field in header
    speed: actualTempoSpeed > 0 && actualTempoSpeed <=31 ? actualTempoSpeed : DEFAULT_PT3_SPEED,
    bpm: DEFAULT_PT3_BPM, // PT3 speed is more direct; BPM is for editor convenience
    globalVolume: 15, // Default full volume
    patterns,
    order: order.length > 0 ? order : [0], // Ensure order has at least one entry if patterns exist
    lengthInPatterns: songLengthOrderSteps || (order.length > 0 ? order.length : 1),
    restartPosition: loopPosition < songLengthOrderSteps ? loopPosition : 0,
    instruments,
    ornaments,
  };
};
