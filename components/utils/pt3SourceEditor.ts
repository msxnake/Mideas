import type { PT3Ornament, PT3SampleMacro, TrackerCell, TrackerPattern } from '../../types';
import { encodePT3SourceNoteCommand, PT3_POSITION_LIST_OFFSET } from './pt3Parser';

export interface PT3SourceNoteEntry {
  patterns: TrackerPattern[];
  patternIndex: number;
  order: number[];
  orderIndex: number;
  rowIndex: number;
  channel: 'A' | 'B' | 'C';
  note: string | null;
  activeInstrumentId: number | null;
}

const isPT3InstrumentId = (value: number | null | undefined): value is number =>
  Number.isInteger(value) && value! >= 1 && value! <= 31;

const findPreviousPT3Instrument = ({
  patterns,
  patternIndex,
  order,
  orderIndex,
  rowIndex,
  channel,
}: Omit<PT3SourceNoteEntry, 'note' | 'activeInstrumentId'>): number | null => {
  const targetPattern = patterns[patternIndex];
  if (!targetPattern) return null;

  // A selector on the same row applies before its note, so it also counts as
  // an existing instrument and must never be replaced by the active picker.
  for (let scanRow = Math.min(rowIndex, targetPattern.numRows - 1); scanRow >= 0; scanRow -= 1) {
    const instrument = targetPattern.rows[scanRow]?.[channel]?.instrument;
    if (isPT3InstrumentId(instrument)) return instrument;
  }

  // PT3 channel state survives pattern boundaries. Respect the actual order
  // occurrence currently being edited instead of needlessly repeating INS at
  // the first row of every pattern.
  if (orderIndex < 0 || orderIndex >= order.length || order[orderIndex] !== patternIndex) return null;
  for (let scanOrder = orderIndex - 1; scanOrder >= 0; scanOrder -= 1) {
    const previousPattern = patterns[order[scanOrder]];
    if (!previousPattern) continue;
    for (let scanRow = previousPattern.numRows - 1; scanRow >= 0; scanRow -= 1) {
      const instrument = previousPattern.rows[scanRow]?.[channel]?.instrument;
      if (isPT3InstrumentId(instrument)) return instrument;
    }
  }

  return null;
};

/**
 * Enter one note using Vortex's compact selector semantics. The active
 * instrument is written on the row when the channel has none to inherit or
 * when the user selected a different instrument. Re-selecting the inherited
 * instrument keeps INS blank.
 */
export const applyPT3SourceNoteEntry = ({
  patterns,
  patternIndex,
  order,
  orderIndex,
  rowIndex,
  channel,
  note,
  activeInstrumentId,
}: PT3SourceNoteEntry): TrackerPattern[] => {
  const targetPattern = patterns[patternIndex];
  if (!targetPattern || rowIndex < 0 || rowIndex >= targetPattern.numRows) return patterns;

  const isPlayableNote = note !== null && note !== '---' && note !== '===';
  const previousInstrumentId = findPreviousPT3Instrument({
      patterns,
      patternIndex,
      order,
      orderIndex,
      rowIndex,
      channel,
    });
  const shouldWriteInstrument = isPlayableNote
    && isPT3InstrumentId(activeInstrumentId)
    && previousInstrumentId !== activeInstrumentId;

  return patterns.map((pattern, currentPatternIndex) => {
    if (currentPatternIndex !== patternIndex) return pattern;
    const rows = pattern.rows.map((row, currentRowIndex) => {
      if (currentRowIndex !== rowIndex) return row;
      return {
        ...row,
        [channel]: {
          ...row[channel],
          note,
          ...(shouldWriteInstrument ? { instrument: activeInstrumentId } : {}),
        },
      };
    });
    return { ...pattern, rows };
  });
};

const readUint16LE = (bytes: Uint8Array, offset: number): number =>
  bytes[offset] | (bytes[offset + 1] << 8);

const writeUint16LE = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
};

interface PT3RelocatableBody {
  oldPointer: number;
  bytes: Uint8Array;
}

const collectUniqueBodies = (
  source: Uint8Array,
  pointerOffset: number,
  pointerCount: number,
  bytesPerStep: number,
  kind: string,
): { bodies: PT3RelocatableBody[]; slotPointers: number[] } => {
  const bodies: PT3RelocatableBody[] = [];
  const seen = new Set<number>();
  const slotPointers: number[] = [];
  for (let slot = 0; slot < pointerCount; slot += 1) {
    const oldPointer = readUint16LE(source, pointerOffset + slot * 2);
    slotPointers.push(oldPointer);
    if (oldPointer === 0 || seen.has(oldPointer)) continue;
    if (oldPointer < 0 || oldPointer + 2 > source.length) {
      throw new Error(`${kind} ${slot} points outside the PT3 module.`);
    }
    const length = source[oldPointer + 1];
    const bodyEnd = oldPointer + 2 + length * bytesPerStep;
    if (length === 0 || bodyEnd > source.length) {
      throw new Error(`${kind} ${slot} has an invalid source body.`);
    }
    seen.add(oldPointer);
    bodies.push({ oldPointer, bytes: source.slice(oldPointer, bodyEnd) });
  }
  return { bodies, slotPointers };
};

/** Remove the original selector commands while retaining every non-selector
 * PT3 command, then append the editable Vortex INS/ORN/VOL fields. */
const rewritePT3RowSelectors = (prefix: number[], cell: TrackerCell): number[] => {
  const instrument = cell.instrument;
  const ornament = cell.ornament;
  const volume = cell.volume;
  if (instrument !== null && (!Number.isInteger(instrument) || instrument < 1 || instrument > 31)) {
    throw new Error(`PT3 instruments must be 1..31 or blank; received ${instrument}.`);
  }
  if (ornament !== null && (!Number.isInteger(ornament) || ornament < 0 || ornament > 15)) {
    throw new Error(`PT3 ornaments must be 0..15 or blank; received ${ornament}.`);
  }
  if (volume !== null && (!Number.isInteger(volume) || volume < 1 || volume > 15)) {
    throw new Error(`PT3 row volume must be 1..15 (1..F) or blank; received ${volume}.`);
  }

  const output: number[] = [];
  let offset = 0;
  let sampleEmbeddedByEnvelopeShape1 = false;
  while (offset < prefix.length) {
    const command = prefix[offset++] & 0xff;
    if (command >= 0xf0) {
      // F0..FF combines envelope-off + ornament + encoded sample.
      if (offset >= prefix.length) throw new Error('Truncated PT3 ornament/sample selector.');
      offset += 1;
      output.push(0xb0); // retain envelope-off; selectors are appended below.
    } else if (command >= 0xd1) {
      // Standalone sample selector; replaced below.
    } else if (command >= 0xc1) {
      // Standalone volume selector; replaced below.
    } else if (command >= 0xb2) {
      if (offset + 2 > prefix.length) throw new Error('Truncated PT3 envelope selector.');
      output.push(command, prefix[offset++] & 0xff, prefix[offset++] & 0xff);
    } else if (command === 0xb1) {
      if (offset >= prefix.length) throw new Error('Truncated PT3 note-skip command.');
      offset += 1; // cadence is regenerated by buildCompressedChannelStream.
    } else if (command === 0xb0) {
      output.push(command);
    } else if (command >= 0x50) {
      throw new Error('Unexpected terminal note inside a PT3 row prefix.');
    } else if (command >= 0x40) {
      // Standalone ornament selector; replaced below.
    } else if (command >= 0x20) {
      output.push(command); // noise base
    } else if (command >= 0x10) {
      const envelopeBytes = command === 0x10 ? 0 : 2;
      if (offset + envelopeBytes >= prefix.length) throw new Error('Truncated PT3 envelope/sample selector.');
      const period = Array.from(prefix.slice(offset, offset + envelopeBytes), value => value & 0xff);
      offset += envelopeBytes;
      const originalEncodedSample = prefix[offset++] & 0xff;
      if (command === 0x10) {
        output.push(0xb0);
      } else if (command === 0x11) {
        // B1 is reserved for note-skip, so AY shape 1 has no envelope-only
        // spelling. Keep the combined command and replace its sample in place.
        const encodedSample = instrument === null ? originalEncodedSample : instrument * 2;
        output.push(command, ...period, encodedSample & 0xff);
        sampleEmbeddedByEnvelopeShape1 = true;
      } else {
        output.push(command + 0xa0, ...period); // 12..1F -> B2..BF
      }
    } else {
      output.push(command); // deferred effect command; payload follows terminal
    }
  }

  if (instrument !== null && !sampleEmbeddedByEnvelopeShape1) output.push(0xd0 + instrument);
  if (ornament !== null) output.push(0x40 | ornament);
  if (volume !== null) output.push(0xc0 | volume);
  return output;
};

const buildCompressedChannelStream = (
  pattern: TrackerPattern,
  channel: 'A' | 'B' | 'C',
): number[] => {
  const meaningfulRows: number[] = [];
  const canonicalPrefixes: number[][] = [];
  for (let row = 0; row < pattern.numRows; row += 1) {
    const sourceCell = pattern.pt3SourceRows?.[row]?.[channel];
    const cell = pattern.rows[row]?.[channel];
    if (!cell) throw new Error(`Pattern ${pattern.name}, row ${row}, channel ${channel} is missing.`);
    const canonicalPrefix = rewritePT3RowSelectors(sourceCell?.prefixBytes ?? [], cell);
    canonicalPrefixes[row] = canonicalPrefix;
    const note = pattern.rows[row]?.[channel]?.note ?? null;
    if (note !== null || canonicalPrefix.length > 0 || (sourceCell?.deferredPayloadBytes.length ?? 0) > 0) {
      meaningfulRows.push(row);
    }
  }
  // PTDECOD always runs on row zero after a pattern switch. A synthetic D0
  // establishes the first skip when the first musical event occurs later.
  if (meaningfulRows[0] !== 0) meaningfulRows.unshift(0);

  const stream: number[] = [];
  let activeSkip: number | null = null;
  meaningfulRows.forEach((row, index) => {
    const sourceCell = pattern.pt3SourceRows?.[row]?.[channel];
    const nextRow = meaningfulRows[index + 1] ?? pattern.numRows;
    const skip = Math.max(1, Math.min(256, nextRow - row));
    const noteCommand = encodePT3SourceNoteCommand(pattern.rows[row]?.[channel]?.note ?? null);
    if (noteCommand === null) {
      throw new Error(`Pattern ${pattern.name}, row ${row}, channel ${channel} contains an invalid PT3 note.`);
    }
    // NNtSkp persists after every decoded row. Emit B1 only when the cadence
    // changes (and always on row zero to isolate reused patterns from the
    // previous pattern's channel state), matching Vortex's compact streams.
    if (activeSkip !== skip) {
      stream.push(0xb1, skip & 0xff);
      activeSkip = skip;
    }
    stream.push(...canonicalPrefixes[row]);
    stream.push(noteCommand);
    stream.push(...(sourceCell?.deferredPayloadBytes ?? []).map(value => value & 0xff));
  });
  if (channel === 'A') stream.push(0x00);
  return stream;
};

/**
 * Repack a canonical PT3 module with editable pattern streams. Header fields,
 * position order, samples, ornaments and every preserved row command remain
 * byte-exact; all absolute pointers are relocated to the compact output.
 *
 * Streams use B1 note-skip runs like Vortex rather than expanding every hold
 * row. This lets Mideas insert notes into compressed holds while keeping ROM
 * modules small and makes every subsequent rewrite stable in size.
 */
export const rewritePT3PatternNoteStreams = (
  source: Uint8Array,
  patterns: TrackerPattern[],
): Uint8Array => {
  if (source.length < PT3_POSITION_LIST_OFFSET) throw new Error('The PT3 source is too short to contain a complete header.');
  if (!patterns.length) throw new Error('The PT3 source has no decoded patterns to rewrite.');

  const positionCount = source[101];
  const headerAndPositionsLength = PT3_POSITION_LIST_OFFSET + positionCount + 1;
  if (headerAndPositionsLength > source.length) throw new Error('The PT3 position list is truncated.');

  // Include slot zero as well: ornament 0 is the default ornament used by the
  // replayer even though Mideas only exposes ornaments 1..15 in its side panel.
  const samples = collectUniqueBodies(source, 105, 32, 4, 'Sample');
  const ornaments = collectUniqueBodies(source, 169, 16, 1, 'Ornament');
  const relocatedSamplePointers = new Map<number, number>();
  const relocatedOrnamentPointers = new Map<number, number>();
  let bodyOffset = headerAndPositionsLength;
  for (const body of samples.bodies) {
    relocatedSamplePointers.set(body.oldPointer, bodyOffset);
    bodyOffset += body.bytes.length;
  }
  for (const body of ornaments.bodies) {
    relocatedOrnamentPointers.set(body.oldPointer, bodyOffset);
    bodyOffset += body.bytes.length;
  }

  const tableOffset = bodyOffset;
  const tableSize = patterns.length * 6;
  const streams: number[][][] = [];
  let outputLength = tableOffset + tableSize;

  for (const pattern of patterns) {
    const patternStreams: number[][] = [];
    for (const channel of ['A', 'B', 'C'] as const) {
      const stream = buildCompressedChannelStream(pattern, channel);
      patternStreams.push(stream);
      outputLength += stream.length;
    }
    streams.push(patternStreams);
  }

  if (outputLength > 0xffff) {
    throw new Error(`The edited PT3 would occupy ${outputLength} bytes and exceed the 64 KB PT3 pointer range.`);
  }

  const output = new Uint8Array(outputLength);
  output.set(source.slice(0, headerAndPositionsLength), 0);
  let copyOffset = headerAndPositionsLength;
  for (const body of [...samples.bodies, ...ornaments.bodies]) {
    output.set(body.bytes, copyOffset);
    copyOffset += body.bytes.length;
  }
  writeUint16LE(output, 103, tableOffset);
  samples.slotPointers.forEach((oldPointer, slot) => {
    writeUint16LE(output, 105 + slot * 2, oldPointer === 0 ? 0 : (relocatedSamplePointers.get(oldPointer) ?? 0));
  });
  ornaments.slotPointers.forEach((oldPointer, slot) => {
    writeUint16LE(output, 169 + slot * 2, oldPointer === 0 ? 0 : (relocatedOrnamentPointers.get(oldPointer) ?? 0));
  });

  let streamOffset = tableOffset + tableSize;
  streams.forEach((patternStreams, patternIndex) => {
    patternStreams.forEach((stream, channelIndex) => {
      const tableEntry = tableOffset + patternIndex * 6 + channelIndex * 2;
      writeUint16LE(output, tableEntry, streamOffset);
      output.set(stream, streamOffset);
      streamOffset += stream.length;
    });
  });

  return output;
};

/** Patch an existing PT3 sample body without changing module size or pointers. */
export const patchPT3SourceSampleBytes = (source: Uint8Array, macro: PT3SampleMacro): Uint8Array => {
  const pointer = macro.sourcePointer;
  if (pointer === undefined || pointer < 0 || pointer + 2 > source.length) {
    throw new Error('This sample has no valid pointer in the source PT3 module.');
  }
  const originalLength = source[pointer + 1];
  if (macro.steps.length !== originalLength) {
    throw new Error(`Source PT3 samples must keep their original length (${originalLength} steps). You can edit every step and the loop; inserting/deleting steps requires a full PT3 stream rewrite.`);
  }
  if (pointer + 2 + originalLength * 4 > source.length) {
    throw new Error('The PT3 sample points outside the module.');
  }
  const bytes = Uint8Array.from(source);
  bytes[pointer] = Math.max(0, Math.min(originalLength - 1, macro.loop));
  for (let index = 0; index < originalLength; index += 1) {
    bytes.set(macro.steps[index].raw.map(value => value & 0xff), pointer + 2 + index * 4);
  }
  return bytes;
};

/** Patch an existing PT3 ornament body without changing module size/pointers. */
export const patchPT3SourceOrnamentBytes = (source: Uint8Array, ornament: PT3Ornament): Uint8Array => {
  const pointer = ornament.sourcePointer;
  if (pointer === undefined || pointer < 0 || pointer + 2 > source.length) {
    throw new Error('This ornament has no valid pointer in the source PT3 module.');
  }
  const originalLength = source[pointer + 1];
  if (ornament.data.length !== originalLength) {
    throw new Error(`Source PT3 ornaments must keep their original length (${originalLength} steps).`);
  }
  if (pointer + 2 + originalLength > source.length) {
    throw new Error('The PT3 ornament points outside the module.');
  }
  const bytes = Uint8Array.from(source);
  bytes[pointer] = Math.max(0, Math.min(originalLength - 1, ornament.loopPosition ?? 0));
  ornament.data.forEach((value, index) => { bytes[pointer + 2 + index] = value & 0xff; });
  return bytes;
};
