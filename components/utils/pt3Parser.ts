import { TrackerSongData, TrackerPattern, TrackerRow, TrackerCell, PT3Instrument, PT3Ornament, PT3SampleMacro, PT3PatternCellSource, PT3PatternEffectCommand } from '../../types';
import { DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM } from '../../constants';
import { decodePT3SampleStep } from './pt3SampleEngine';
import { sourceEffectToNativeFields } from './trackerEffects';

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
  patterns: TrackerPattern[];
  instruments: PT3Instrument[];
  ornaments: PT3Ornament[];
  warnings: string[];
}

const createEmptyCell = (): TrackerCell => ({
  note: null,
  instrument: null,
  ornament: null,
  volume: null,
  effectCommand: null,
  effectParams: null,
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
    sourcePointer: pointer,
  };
};

const pt3NoteName = (value: number): string => {
  const index = Math.max(0, Math.min(95, value - 0x50));
  return `${['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'][index % 12]}${Math.floor(index / 12) + 1}`;
};

/** Convert a Mideas/Vortex note label to the single command byte that ends a
 * PT3 channel row. Replacing this byte never moves deferred effect payloads. */
export const encodePT3SourceNoteCommand = (note: string | number | null): number | null => {
  if (note === null || note === '' || String(note).toUpperCase() === '---') return 0xd0;
  const normalized = String(note).toUpperCase();
  if (normalized === '===') return 0xc0;
  const match = /^([A-G])([#-]?)([1-8])$/.exec(normalized);
  if (!match) return null;
  const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let semitone = semitones[match[1]];
  if (match[2] === '#') semitone += 1;
  const index = (Number(match[3]) - 1) * 12 + semitone;
  return index >= 0 && index < 96 ? 0x50 + index : null;
};

export interface PT3PlaybackCursor {
  orderIndex: number;
  patternIndex: number;
  row: number;
  frameInRow: number;
  speed: number;
}

/** Resolve a 50 Hz PT3 frame to the visible Vortex pattern row. C_DELAY/SPD
 * commands execute with the same channel order (A, B, C) and per-channel LIFO
 * order as PTDECOD, so the cursor remains aligned when a module changes speed. */
export const locatePT3PlaybackFrame = (
  song: Pick<TrackerSongData, 'patterns' | 'order' | 'speed'>,
  frameNumber: number,
): PT3PlaybackCursor | null => {
  if (!song.patterns.length || !song.order.length) return null;
  let remaining = Math.max(0, Math.floor(frameNumber));
  let speed = song.speed > 0 ? song.speed : 256;
  let last: PT3PlaybackCursor | null = null;

  for (let orderIndex = 0; orderIndex < song.order.length; orderIndex += 1) {
    const patternIndex = song.order[orderIndex];
    const pattern = song.patterns[patternIndex];
    if (!pattern) continue;
    for (let row = 0; row < pattern.numRows; row += 1) {
      const sourceRow = pattern.pt3SourceRows?.[row];
      for (const channel of ['A', 'B', 'C'] as const) {
        const effects = sourceRow?.[channel]?.effects ?? [];
        // Deferred handlers are pushed while decoding and execute last-in-first-out.
        for (let index = effects.length - 1; index >= 0; index -= 1) {
          const effect = effects[index];
          if (effect.code === 9) speed = (effect.params[0] ?? 0) || 256;
        }
      }
      const rowFrames = Math.max(1, speed);
      last = { orderIndex, patternIndex, row, frameInRow: Math.min(remaining, rowFrames - 1), speed };
      if (remaining < rowFrames) return last;
      remaining -= rowFrames;
    }
  }
  return last;
};

const PT3_EFFECT_PARAMETER_BYTES = [0, 3, 5, 1, 1, 2, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0] as const;

const readInt16LE = (lo: number, hi: number): number => {
  const value = (lo & 0xff) | ((hi & 0xff) << 8);
  return value >= 0x8000 ? value - 0x10000 : value;
};

const formatHex = (value: number, width = 2): string =>
  (value & (width === 4 ? 0xffff : 0xff)).toString(16).toUpperCase().padStart(width, '0');

const makeEffectCommand = (code: number, params: number[]): PT3PatternEffectCommand => {
  switch (code) {
    case 1: {
      const step = readInt16LE(params[1] ?? 0, params[2] ?? 0);
      return { code, name: 'GLISS', params, display: `GLS ${formatHex(params[0] ?? 0)} ${step >= 0 ? '+' : ''}${step}` };
    }
    case 2: {
      const step = readInt16LE(params[3] ?? 0, params[4] ?? 0);
      return { code, name: 'PORTA', params, display: `PRT ${formatHex(params[0] ?? 0)} ${step >= 0 ? '+' : ''}${step}` };
    }
    case 3:
      return { code, name: 'SAMPLE_POS', params, display: `SMP ${formatHex(params[0] ?? 0)}` };
    case 4:
      return { code, name: 'ORNAMENT_POS', params, display: `ORN ${formatHex(params[0] ?? 0)}` };
    case 5:
      return { code, name: 'VIBRATO', params, display: `VIB ${formatHex(params[0] ?? 0)}/${formatHex(params[1] ?? 0)}` };
    case 8: {
      const step = readInt16LE(params[1] ?? 0, params[2] ?? 0);
      return { code, name: 'ENV_SLIDE', params, display: `ENV ${formatHex(params[0] ?? 0)} ${step >= 0 ? '+' : ''}${step}` };
    }
    case 9:
      return { code, name: 'DELAY', params, display: `SPD ${formatHex(params[0] ?? 0)}` };
    default:
      return { code, name: 'NOP', params, display: code === 0 ? '' : `FX${code.toString(16).toUpperCase()}` };
  }
};

/**
 * Decode one PT3 channel stream at tracker-row cadence. B1 does not emit rows:
 * it sets NNtSkp, so the channel is decoded again after that many rows. The
 * zero pattern terminator is checked only for channel A, before PTDECOD; inside
 * PTDECOD command 0 is C_NOP and B/C must keep decoding until A ends.
 */
const decodePT3Channel = (
  bytes: Uint8Array,
  pointer: number,
  warnings: string[],
  maxRows: number,
  stopAtPatternTerminator: boolean,
): { cells: TrackerCell[]; sourceRows: PT3PatternCellSource[] } => {
  const cells: TrackerCell[] = [];
  const sourceRows: PT3PatternCellSource[] = [];
  if (pointer <= 0 || pointer >= bytes.length || maxRows <= 0) return { cells, sourceRows };

  const state = { sample: 1, ornament: 0, volume: 15, noteSkip: 1 };
  let offset = pointer;
  let nextDecodeRow = 0;
  let truncated = false;

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    if (rowIndex !== nextDecodeRow) {
      cells.push(createEmptyCell());
      sourceRows.push({
        decoded: false,
        noteSkip: state.noteSkip || 256,
        effects: [],
        events: [],
        prefixBytes: [],
        deferredPayloadBytes: [],
      });
      continue;
    }
    if (offset >= bytes.length) {
      truncated = true;
      break;
    }
    if (stopAtPatternTerminator && bytes[offset] === 0) break;

    let note: string | null = null;
    let finished = false;
    const pendingEffects: Array<{ code: number; params: number[] }> = [];
    const events: string[] = [];
    const prefixBytes: number[] = [];
    let commandOffset: number | undefined;
    let sampleSelected = false;
    let ornamentSelected = false;
    let volumeChanged = false;
    let guard = 0;
    while (offset < bytes.length && !finished && guard++ < 128) {
      const commandStart = offset;
      const command = bytes[offset++];
      if (command >= 0xf0) {
        state.ornament = command & 0x0f;
        ornamentSelected = true;
        if (offset >= bytes.length) { truncated = true; break; }
        state.sample = Math.max(1, bytes[offset++] >> 1);
        sampleSelected = true;
      } else if (command >= 0xd1) {
        state.sample = command - 0xd0;
        sampleSelected = true;
      } else if (command === 0xd0) {
        commandOffset = offset - 1;
        finished = true;
      } else if (command >= 0xc1) {
        state.volume = command & 0x0f;
        volumeChanged = true;
      } else if (command === 0xc0) {
        note = '===';
        commandOffset = offset - 1;
        finished = true;
      } else if (command === 0xb0) {
        // Envelope off resets the ornament position, not the selected ornament.
        events.push('ENV OFF');
      } else if (command === 0xb1) {
        if (offset >= bytes.length) { truncated = true; break; }
        state.noteSkip = bytes[offset++];
        // B1/01 is the canonical per-row cadence emitted by Mideas. It is a
        // stream detail, not a useful musical command to repeat in every FX cell.
        if (state.noteSkip !== 1) events.push(`SKP ${formatHex(state.noteSkip)}`);
      } else if (command >= 0xb2) {
        if (offset + 2 > bytes.length) { truncated = true; break; }
        const periodHi = bytes[offset++];
        const periodLo = bytes[offset++];
        events.push(`ENV ${(command & 0x0f).toString(16).toUpperCase()}:${formatHex((periodHi << 8) | periodLo, 4)}`);
      } else if (command >= 0x50) {
        note = pt3NoteName(command);
        commandOffset = offset - 1;
        finished = true; // PD_NOTE returns through PD_FIN immediately.
      } else if (command >= 0x40) {
        state.ornament = command & 0x0f;
        ornamentSelected = true;
      } else if (command >= 0x20) {
        events.push(`N${formatHex(command & 0x1f)}`);
      } else if (command >= 0x10) {
        if (command !== 0x10) {
          if (offset + 2 > bytes.length) { truncated = true; break; }
          const periodHi = bytes[offset++];
          const periodLo = bytes[offset++];
          events.push(`ENV ${(command & 0x0f).toString(16).toUpperCase()}:${formatHex((periodHi << 8) | periodLo, 4)}`);
        } else {
          events.push('ENV OFF');
        }
        if (offset >= bytes.length) { truncated = true; break; }
        state.sample = Math.max(1, bytes[offset++] >> 1);
        sampleSelected = true;
      } else {
        // SPCCOMS handlers are pushed on the Z80 stack. Their payload is NOT
        // inline here: PTDECOD continues until note/release/D0, then executes
        // the pending handlers (LIFO), consuming bytes after that terminator.
        pendingEffects.push({ code: command, params: [] });
      }
      // Keep every original row command except B1 (we canonicalize cadence)
      // and the terminal note/release/D0 (the editable field). Inline payload
      // bytes are included because offset already advanced over them.
      if (command !== 0xb1 && !finished) {
        prefixBytes.push(...bytes.slice(commandStart, offset));
      }
      if (offset > bytes.length) truncated = true;
    }

    if (guard >= 128) {
      warnings.push(`Pattern channel pointer ${pointer} exceeded the PT3 command guard at row ${rowIndex}.`);
      break;
    }
    const deferredPayloadStart = offset;
    for (let effectIndex = pendingEffects.length - 1; effectIndex >= 0; effectIndex -= 1) {
      const effect = pendingEffects[effectIndex];
      const parameterCount = PT3_EFFECT_PARAMETER_BYTES[effect.code] ?? 0;
      effect.params = Array.from(bytes.slice(offset, offset + parameterCount));
      offset += parameterCount;
    }
    const deferredPayloadBytes = Array.from(bytes.slice(deferredPayloadStart, Math.min(offset, bytes.length)));
    if (offset > bytes.length) truncated = true;
    const decodedEffects = pendingEffects.map(effect => makeEffectCommand(effect.code, effect.params));
    events.push(...decodedEffects.map(effect => effect.display).filter(Boolean));
    cells.push({
      note,
      // Vortex cells show selector commands, not the channel's inherited
      // state. A blank INS/ORN/VOL therefore keeps the previous value.
      instrument: sampleSelected ? (state.sample || null) : null,
      ornament: ornamentSelected ? state.ornament : null,
      volume: volumeChanged ? state.volume : null,
      // Surface the row's SPCCOM in the editable FX/CMD fields. Code 0 is the
      // replayer's NOP and is deliberately left blank: it carries no payload,
      // and a 0x00 byte at the start of a channel-A row is what marks the end
      // of a pattern, so it must never be authored back into the stream.
      ...sourceEffectToNativeFields(decodedEffects.find(effect => effect.code !== 0)),
    });
    sourceRows.push({
      decoded: true,
      commandOffset,
      noteSkip: state.noteSkip || 256,
      effects: decodedEffects,
      events,
      prefixBytes,
      deferredPayloadBytes,
    });
    // Z80 counter semantics: 0 underflows and means 256 rows.
    nextDecodeRow = rowIndex + (state.noteSkip || 256);
    if (truncated) break;
  }

  if (truncated) warnings.push(`Pattern channel pointer ${pointer} was truncated at module bounds.`);
  return { cells, sourceRows };
};

const parsePatterns = (bytes: Uint8Array, patternTablePointer: number, patternCount: number, warnings: string[]): TrackerPattern[] => {
  const patterns: TrackerPattern[] = [];
  for (let index = 0; index < patternCount; index += 1) {
    const table = patternTablePointer + index * 6;
    if (table + 6 > bytes.length) break;
    const pointers = [readUint16LE(bytes, table), readUint16LE(bytes, table + 2), readUint16LE(bytes, table + 4)];
    // The real player checks the zero terminator only at channel A's decode
    // boundary. Its length therefore defines the whole pattern; B and C are
    // decoded/padded to exactly the same number of tracker rows.
    const channelA = decodePT3Channel(bytes, pointers[0], warnings, 256, true);
    const rowCount = Math.max(1, channelA.cells.length);
    const channels = [
      channelA,
      decodePT3Channel(bytes, pointers[1], warnings, rowCount, false),
      decodePT3Channel(bytes, pointers[2], warnings, rowCount, false),
    ];
    const rows = Array.from({ length: rowCount }, (_, row) => ({
      A: channels[0].cells[row] ?? createEmptyCell(),
      B: channels[1].cells[row] ?? createEmptyCell(),
      C: channels[2].cells[row] ?? createEmptyCell(),
    }));
    const pt3SourceRows = Array.from({ length: rowCount }, (_, row) => ({
      A: channels[0].sourceRows[row],
      B: channels[1].sourceRows[row],
      C: channels[2].sourceRows[row],
    }));
    patterns.push({ id: `imported_pattern_${index}`, name: `Pattern ${String(index).padStart(2, '0')}`, numRows: rowCount, rows, pt3SourceRows });
  }
  return patterns;
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

  const patternCount = Math.max(1, (order.length ? Math.max(...order) + 1 : 1));
  const patterns = parsePatterns(bytes, readUint16LE(bytes, PT3_PATTERN_POINTER_OFFSET), patternCount, warnings);

  return {
    title: readAscii(bytes, 30, 62) || 'Imported PT3 Song',
    author: readAscii(bytes, 66, 98) || 'PT3 Import',
    speed: Math.max(1, speed),
    toneTable: bytes[PT3_TONE_TABLE_OFFSET],
    positionCount,
    loopPosition: Math.min(bytes[PT3_LOOP_POSITION_OFFSET], Math.max(0, positionCount - 1)),
    patternTablePointer: readUint16LE(bytes, PT3_PATTERN_POINTER_OFFSET),
    order,
    patterns,
    instruments,
    ornaments,
    warnings,
  };
};

/** Compatibility adapter for callers that expect editable TrackerSongData fields. */
export const parsePT3File = (arrayBuffer: ArrayBuffer): Partial<TrackerSongData> => {
  const parsed = parsePT3Module(arrayBuffer);
  const highestPattern = parsed.order.length > 0 ? Math.max(...parsed.order) : -1;
  const patterns = parsed.patterns.length > 0
    ? parsed.patterns
    : Array.from({ length: highestPattern + 1 }, (_, index) => createPlaceholderPattern(index));
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
