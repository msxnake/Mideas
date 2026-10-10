import type { PT3PatternCellSource, TrackerCell, TrackerChannelId, TrackerPattern, TrackerSongData } from '../../types';

export interface TrackerSoundPreset {
  cell: Partial<TrackerCell>;
  source?: PT3PatternCellSource;
}

/** Copy selectors in force at the cursor, including inheritance across orders.
 * Notes are intentionally excluded: the performer supplies the next pitch.
 */
export function captureTrackerSound(song: TrackerSongData, patternIndex: number, rowIndex: number,
  channel: TrackerChannelId): TrackerSoundPreset {
  const cell: Partial<TrackerCell> = { instrument: null, ornament: 0, volume: 15,
    pt3Envelope: 'OFF', effectCommand: null, effectParams: null };
  let orderIndex = song.currentPatternIndexInOrder;
  if (song.order[orderIndex] !== patternIndex) orderIndex = song.order.indexOf(patternIndex);
  const preceding = orderIndex < 0 ? [] : song.order.slice(0, orderIndex);
  let noise: number | null = null;
  let globalEnvelope: string | null = null;
  let effectSource: PT3PatternCellSource | undefined;
  for (const [position, index] of [...preceding, patternIndex].entries()) {
    const pattern = song.patterns[index];
    const end = position === preceding.length ? rowIndex : pattern.numRows - 1;
    for (let row = 0; row <= end; row++) {
      const value = pattern.rows[row]?.[channel];
      if (!value) continue;
      for (const field of ['instrument', 'ornament', 'volume', 'pt3Envelope'] as const) {
        if (value[field] !== null && value[field] !== undefined && !(field === 'instrument' && value[field] === 0)) {
          (cell as any)[field] = value[field];
        }
      }
      if (value.note && value.note !== '---') {
        cell.effectCommand = null; cell.effectParams = null; effectSource = undefined;
      }
      if (value.effectCommand !== null && value.effectCommand !== undefined) {
        cell.effectCommand = value.effectCommand; cell.effectParams = value.effectParams ?? null;
        effectSource = pattern.pt3SourceRows?.[row]?.[channel as 'A' | 'B' | 'C'];
      }
      for (const id of ['A', 'B', 'C'] as const) {
        const envelope = pattern.rows[row]?.[id]?.pt3Envelope;
        if (envelope && envelope !== 'OFF') globalEnvelope = envelope;
        for (const event of pattern.pt3SourceRows?.[row]?.[id]?.events ?? []) {
          const match = /^N([0-9A-F]{2})$/i.exec(event);
          if (match) noise = parseInt(match[1], 16);
        }
      }
    }
  }
  const current = song.patterns[patternIndex].pt3SourceRows?.[rowIndex]?.[channel as 'A' | 'B' | 'C'];
  const source = effectSource ?? current;
  if (cell.pt3Envelope && cell.pt3Envelope !== 'OFF' && globalEnvelope) cell.pt3Envelope = globalEnvelope;
  return { cell, source: {
    decoded: true, noteSkip: 1,
    effects: structuredClone(source?.effects ?? []),
    events: [...(source?.events ?? [])],
    prefixBytes: [...(source?.prefixBytes ?? []), ...(noise !== null ? [0x20 + noise] : [])],
    deferredPayloadBytes: [...(source?.deferredPayloadBytes ?? [])],
  } };
}

export function applyTrackerSoundPreset(patterns: TrackerPattern[], index: number, row: number,
  channel: TrackerChannelId, preset: TrackerSoundPreset): TrackerPattern[] {
  return patterns.map((pattern, i) => {
    if (i !== index) return pattern;
    const rows = [...pattern.rows];
    rows[row] = { ...rows[row], [channel]: { ...rows[row][channel], ...preset.cell } };
    const pt3SourceRows = [...(pattern.pt3SourceRows ?? [])];
    pt3SourceRows[row] = { ...pt3SourceRows[row], [channel]: preset.source ? structuredClone(preset.source) : undefined };
    return { ...pattern, rows, pt3SourceRows };
  });
}
