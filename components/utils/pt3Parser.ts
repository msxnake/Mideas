import { TrackerSongData, TrackerPattern, TrackerRow, TrackerCell, PT3Instrument, PT3Ornament, PT3SampleMacro } from '../../types';
import { DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM } from '../../constants';
import { decodePT3SampleStep } from './pt3SampleEngine';

export const PT3_HEADER_SIZE = 201;
export const PT3_TONE_TABLE_OFFSET = 99;
export const PT3_SPEED_OFFSET = 100;
export const PT3_POSITION_COUNT_OFFSET = 101;
export const PT3_LOOP_POSITION_OFFSET = 102;
export const PT3_PATTERN_POINTER_OFFSET = 103;
export const PT3_SAMPLE_POINTERS_OFFSET = 105;
export const PT3_ORNAMENT_POINTERS_OFFSET = 169;
export const PT3_POSITION_LIST_OFFSET = 201;

export interface ParsedPT3Module {
  title: string;
  author: string;
  speed: number;
  toneTable: number;
  positionCount: number;
  loopPosition: number;
  patternTablePointer: number;
  order: number[];
  instruments: PT3Instrument[];
  ornaments: PT3Ornament[];
  warnings: string[];
}

const createEmptyCell = (): TrackerCell => ({
  note: null,
  instrument: null,
  ornament: null,
  volume: null,
});

const createEmptyRow = (): TrackerRow => ({ A: createEmptyCell(), B: createEmptyCell(), C: createEmptyCell() });

const createPlaceholderPattern = (index: number): TrackerPattern => ({
  id: `imported_pattern_${index}`,
  name: `Pattern ${String(index).padStart(2, '0')}`,
  numRows: DEFAULT_PT3_ROWS_PER_PATTERN,
  rows: Array.from({ length: DEFAULT_PT3_ROWS_PER_PATTERN }, createEmptyRow),
});

const readAscii = (bytes: Uint8Array, start: number, end: number): string => {
  const decoded = new TextDecoder('ascii').decode(bytes.slice(start, end));
  return decoded.replace(/\0/g, '').trim();
};

const readUint16LE = (bytes: Uint8Array, offset: number): number => bytes[offset] | (bytes[offset + 1] << 8);
const readInt8 = (value: number): number => value >= 0x80 ? value - 0x100 : value;

export const hasFullPT3Header = (bytes: Uint8Array): boolean => {
  if (bytes.length < PT3_HEADER_SIZE) return false;
  const signature = readAscii(bytes, 0, 30);
  return signature.startsWith('Vortex Tracker') || signature.startsWith('ProTracker 3');
};

const parseSampleMacro = (
  bytes: Uint8Array,
  sampleId: number,
  pointer: number,
  warnings: string[],
): PT3SampleMacro | null => {
  if (pointer <= 0 || pointer + 2 > bytes.length) {
    warnings.push(`Sample ${sampleId}: pointer ${pointer} is outside the module.`);
    return null;
  }
  const loop = bytes[pointer];
  const length = bytes[pointer + 1];
  if (length === 0) {
    warnings.push(`Sample ${sampleId}: zero-length sample ignored.`);
    return null;
  }
  const end = pointer + 2 + length * 4;
  if (end > bytes.length) {
    warnings.push(`Sample ${sampleId}: ${length} steps exceed module bounds.`);
    return null;
  }
  if (loop >= length) {
    warnings.push(`Sample ${sampleId}: loop ${loop} is outside length ${length}; clamped to ${length - 1}.`);
  }

  const steps = Array.from({ length }, (_, index) => {
    const offset = pointer + 2 + index * 4;
    return decodePT3SampleStep(bytes.slice(offset, offset + 4));
  });

  return {
    loop: Math.min(loop, length - 1),
    steps,
    envelopeSlideMode: 'pt3-legacy-8bit',
    sourceSampleId: sampleId,
    sourcePointer: pointer,
  };
};

const parseOrnament = (
  bytes: Uint8Array,
  ornamentId: number,
  pointer: number,
  warnings: string[],
): PT3Ornament | null => {
  if (pointer <= 0 || pointer + 2 > bytes.length) {
    warnings.push(`Ornament ${ornamentId}: pointer ${pointer} is outside the module.`);
    return null;
  }
  const loop = bytes[pointer];
  const length = bytes[pointer + 1];
  if (length === 0 || pointer + 2 + length > bytes.length) {
    warnings.push(`Ornament ${ornamentId}: invalid length ${length}.`);
    return null;
  }
  const data = Array.from(bytes.slice(pointer + 2, pointer + 2 + length), readInt8);
  return {
    id: ornamentId,
    name: `PT3 Ornament ${String(ornamentId).padStart(2, '0')}`,
    data,
    loopPosition: Math.min(loop, length - 1),
  };
};

/** Parse the absolute on-disk layout of a complete PT3 module. */
export const parsePT3Module = (arrayBuffer: ArrayBuffer): ParsedPT3Module => {
  const bytes = new Uint8Array(arrayBuffer);
  if (!hasFullPT3Header(bytes)) {
    throw new Error('A complete ProTracker 3/Vortex Tracker module with its header is required.');
  }

  const warnings: string[] = [];
  const speed = bytes[PT3_SPEED_OFFSET];
  if (speed === 0) warnings.push('Module speed is zero; Mideas will use 1 when creating editable song metadata.');
  const positionCount = bytes[PT3_POSITION_COUNT_OFFSET];
  const availablePositions = Math.max(0, bytes.length - PT3_POSITION_LIST_OFFSET);
  const readablePositions = Math.min(positionCount, availablePositions);
  if (readablePositions !== positionCount) {
    warnings.push(`Position list declares ${positionCount} entries but only ${availablePositions} are available.`);
  }
  const order = Array.from(bytes.slice(PT3_POSITION_LIST_OFFSET, PT3_POSITION_LIST_OFFSET + readablePositions), value => Math.floor(value / 3));

  const instruments: PT3Instrument[] = [];
  // Modules may alias one sample body from several IDs; parse each pointer once
  // but keep every ID so pattern references stay valid.
  const sampleMacroCache = new Map<number, PT3SampleMacro | null>();
  for (let sampleId = 1; sampleId < 32; sampleId += 1) {
    const pointerOffset = PT3_SAMPLE_POINTERS_OFFSET + sampleId * 2;
    const pointer = readUint16LE(bytes, pointerOffset);
    if (pointer === 0) continue;
    let cachedSample = sampleMacroCache.get(pointer);
    if (cachedSample === undefined) {
      cachedSample = parseSampleMacro(bytes, sampleId, pointer, warnings);
      sampleMacroCache.set(pointer, cachedSample);
    }
    if (!cachedSample) continue;
    instruments.push({
      id: sampleId,
      name: `PT3 Sample ${String(sampleId).padStart(2, '0')}`,
      chip: 'PSG',
      instrumentMode: 'pt3-sample',
      pt3Sample: {
        ...cachedSample,
        sourceSampleId: sampleId,
        steps: cachedSample.steps.map(step => ({ ...step, raw: [...step.raw] as [number, number, number, number] })),
      },
    });
  }

  const ornaments: PT3Ornament[] = [];
  const ornamentCache = new Map<number, PT3Ornament | null>();
  for (let ornamentId = 1; ornamentId < 16; ornamentId += 1) {
    const pointerOffset = PT3_ORNAMENT_POINTERS_OFFSET + ornamentId * 2;
    const pointer = readUint16LE(bytes, pointerOffset);
    if (pointer === 0) continue;
    let cachedOrnament = ornamentCache.get(pointer);
    if (cachedOrnament === undefined) {
      cachedOrnament = parseOrnament(bytes, ornamentId, pointer, warnings);
      ornamentCache.set(pointer, cachedOrnament);
    }
    if (!cachedOrnament) continue;
    ornaments.push({
      ...cachedOrnament,
      id: ornamentId,
      name: `PT3 Ornament ${String(ornamentId).padStart(2, '0')}`,
      data: [...cachedOrnament.data],
    });
  }

  return {
    title: readAscii(bytes, 30, 62) || 'Imported PT3 Song',
    author: readAscii(bytes, 66, 98) || 'PT3 Import',
    speed: Math.max(1, speed),
    toneTable: bytes[PT3_TONE_TABLE_OFFSET],
    positionCount,
    loopPosition: Math.min(bytes[PT3_LOOP_POSITION_OFFSET], Math.max(0, positionCount - 1)),
    patternTablePointer: readUint16LE(bytes, PT3_PATTERN_POINTER_OFFSET),
    order,
    instruments,
    ornaments,
    warnings,
  };
};

/** Compatibility adapter for callers that expect editable TrackerSongData fields. */
export const parsePT3File = (arrayBuffer: ArrayBuffer): Partial<TrackerSongData> => {
  const parsed = parsePT3Module(arrayBuffer);
  const highestPattern = parsed.order.length > 0 ? Math.max(...parsed.order) : -1;
  const patterns = Array.from({ length: highestPattern + 1 }, (_, index) => createPlaceholderPattern(index));
  return {
    title: parsed.title,
    author: parsed.author,
    speed: parsed.speed,
    bpm: DEFAULT_PT3_BPM,
    globalVolume: 15,
    patterns,
    order: parsed.order,
    lengthInPatterns: parsed.positionCount,
    restartPosition: parsed.loopPosition,
    instruments: parsed.instruments,
    ornaments: parsed.ornaments,
  };
};
