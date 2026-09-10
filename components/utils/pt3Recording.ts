import type { PT3Instrument, PT3Ornament, TrackerCell, TrackerChannelId, TrackerPattern, TrackerSongData } from '../../types';
import { parsePT3File } from './pt3Parser';
import { rewritePT3PatternNoteStreams } from './pt3SourceEditor';
import { createEmptyRow } from './trackerUtils';
import { PT3_FACTORY_INSTRUMENTS } from '../../utils/audio/pt3FactoryInstruments';

export type TrackerTake = ReadonlyMap<string, Partial<TrackerCell>>;

/** Apply a take without mutating either the source song or the pending notes. */
export function overlayTrackerTake(patterns: TrackerPattern[], take: TrackerTake): TrackerPattern[] {
  const result = [...patterns];
  const copied = new Set<number>();
  for (const [key, patch] of take) {
    const [patternText, rowText, channelText] = key.split(':');
    const index = Number(patternText), rowIndex = Number(rowText);
    const channel = channelText as TrackerChannelId;
    const pattern = result[index];
    if (!pattern?.rows[rowIndex]?.[channel]) throw new Error(`Destino de toma inválido: ${key}`);
    if (!copied.has(index)) {
      result[index] = { ...pattern, rows: [...pattern.rows] };
      copied.add(index);
    }
    const row = result[index].rows[rowIndex];
    result[index].rows[rowIndex] = { ...row, [channel]: { ...row[channel], ...patch } };
  }
  return result;
}

/** The binary consumed by Preview/ROM and its editable rows commit together. */
export function commitTrackerTake(song: TrackerSongData, take: TrackerTake): Partial<TrackerSongData> {
  const patterns = overlayTrackerTake(song.patterns, take);
  if (song.playbackBackend !== 'external-pt3') return { patterns };
  if (!song.externalPt3HasHeader || !song.externalPt3Data?.length) {
    throw new Error('La grabación requiere un PT3 completo con cabecera.');
  }
  const source = new Uint8Array(song.externalPt3Data);
  if (!song.order.length || song.order.length > 255 || song.order.some(index => !patterns[index] || index > 84 || index < 0)) {
    throw new Error('PT3 admite 1..255 posiciones y patrones 0..84.');
  }
  // Rebase sample/ornament pointers when the position list grows or shrinks.
  // The pattern writer replaces all old pattern streams and their pointers.
  const headerSize = 202 + song.order.length;
  if (source.length + headerSize > 65535) throw new Error('El módulo excede el espacio de direcciones PT3.');
  const relocated = new Uint8Array(headerSize + source.length);
  relocated.set(source.subarray(0, 201));
  relocated.set(source, headerSize);
  relocated[100] = song.speed;
  relocated[101] = song.order.length;
  relocated[102] = Math.max(0, Math.min(song.order.length - 1, song.restartPosition));
  relocated.set(song.order.map(index => index * 3), 201);
  relocated[201 + song.order.length] = 255;
  for (const [base, count] of [[105, 32], [169, 16]]) {
    for (let slot = 0; slot < count; slot++) {
      const offset = base + slot * 2;
      const old = source[offset] | (source[offset + 1] << 8);
      if (!old) continue;
      const pointer = old + headerSize;
      relocated[offset] = pointer & 255; relocated[offset + 1] = pointer >> 8;
    }
  }
  const bytes = rewritePT3PatternNoteStreams(relocated, patterns);
  const decoded = parsePT3File(bytes.buffer as ArrayBuffer);
  return {
    patterns: patterns.map((pattern, index) => decoded.patterns![index]
      ? { ...decoded.patterns![index], id: pattern.id, name: pattern.name } : pattern),
    externalPt3Data: Array.from(bytes),
    instruments: decoded.instruments!.map(instrument => ({
      ...instrument, name: song.instruments.find(item => item.id === instrument.id)?.name ?? instrument.name,
    })),
    ornaments: decoded.ornaments!.map(ornament => ({
      ...ornament, name: song.ornaments.find(item => item.id === ornament.id)?.name ?? ornament.name,
    })),
  };
}

/** A genuine blank Vortex module using only Mideas' original factory samples. */
export function createBlankPT3Song(
  bank: readonly PT3Instrument[] = PT3_FACTORY_INSTRUMENTS.map((instrument, index) => ({ ...instrument, id: index + 1 })),
  ornaments: readonly PT3Ornament[] = [],
): Partial<TrackerSongData> {
  const seed = new Uint8Array(65536);
  seed.fill(32, 0, 99);
  seed.set(new TextEncoder().encode('ProTracker 3.7 compilation of '), 0);
  seed.set(new TextEncoder().encode('Mideas MIDI'), 30);
  seed[99] = 0; seed[100] = 6; seed[101] = 1; seed[102] = 0;
  seed[201] = 0; seed[202] = 255;
  const pointer = (offset: number, value: number) => { seed[offset] = value & 255; seed[offset + 1] = value >> 8; };
  let end = 203;
  pointer(169, end);
  seed.set([0, 1, 0], end); end += 3;
  bank.filter(instrument => instrument.pt3Sample && instrument.id >= 1 && instrument.id <= 31).forEach(instrument => {
    const sample = instrument.pt3Sample!;
    pointer(105 + instrument.id * 2, end);
    seed[end++] = sample.loop;
    seed[end++] = sample.steps.length;
    sample.steps.forEach(step => { seed.set(step.raw, end); end += 4; });
  });
  ornaments.filter(ornament => ornament.id >= 0 && ornament.id <= 15).forEach(ornament => {
    pointer(169 + ornament.id * 2, end);
    seed[end++] = ornament.loopPosition ?? 0;
    seed[end++] = ornament.data.length;
    seed.set(ornament.data.map(value => value & 255), end); end += ornament.data.length;
  });
  const pattern: TrackerPattern = {
    id: 'pt3_pattern_0', name: 'Pattern 00', numRows: 64,
    rows: Array.from({ length: 64 }, () => createEmptyRow(['A', 'B', 'C'])),
  };
  const bytes = rewritePT3PatternNoteStreams(seed.slice(0, end), [pattern]);
  const decoded = parsePT3File(bytes.buffer as ArrayBuffer);
  return {
    ...decoded, name: 'Mideas MIDI', title: 'Mideas MIDI', author: '',
    soundChip: 'PSG', playbackBackend: 'external-pt3',
    externalPt3Data: Array.from(bytes), externalPt3HasHeader: true, externalPt3PlayerId: 'custom',
    currentPatternIndexInOrder: 0, currentPatternId: decoded.patterns![0].id,
    instruments: decoded.instruments!.map(instrument => ({
      ...instrument, name: bank.find(item => item.id === instrument.id)?.name ?? instrument.name,
    })),
  };
}

/** Install an imported bank in the module as well as in the instrument panel. */
export function rebuildPT3Bank(song: TrackerSongData): Partial<TrackerSongData> {
  if (!song.externalPt3Data?.length) throw new Error('No hay módulo PT3 de destino.');
  const bank = createBlankPT3Song(song.instruments.filter((item): item is PT3Instrument => 'pt3Sample' in item), song.ornaments);
  const source = new Uint8Array(song.externalPt3Data);
  const bankBytes = new Uint8Array(bank.externalPt3Data!);
  if (source.length + bankBytes.length > 65535) throw new Error('El banco supera el espacio de direcciones PT3.');
  const joined = new Uint8Array(source.length + bankBytes.length);
  joined.set(source); joined.set(bankBytes, source.length);
  for (const [base, count] of [[105, 32], [169, 16]]) {
    for (let slot = 0; slot < count; slot++) {
      const offset = base + slot * 2;
      const pointer = bankBytes[offset] | (bankBytes[offset + 1] << 8);
      // Preserve implicit source sample/ornament zero and any unexposed slots.
      if (!pointer || slot === 0) continue;
      const relocated = source.length + pointer;
      joined[offset] = relocated & 255; joined[offset + 1] = relocated >> 8;
    }
  }
  const bytes = rewritePT3PatternNoteStreams(joined, song.patterns);
  return commitTrackerTake({ ...song, externalPt3Data: Array.from(bytes) }, new Map());
}
