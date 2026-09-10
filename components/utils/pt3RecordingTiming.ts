import type { TrackerSongData } from '../../types';

export type PT3QuantizeRows = 0 | 1 | 2 | 4;
export interface PT3RecordingRow {
  patternIndex: number; orderIndex: number; row: number; startFrame: number; endFrame: number;
}
export interface PT3RecordingPosition extends PT3RecordingRow { cycleOffset: number }

/** Source SPD effects are applied before timing that row, in PT3 channel order. */
export function buildPT3RecordingTimeline(song: Pick<TrackerSongData, 'patterns' | 'order' | 'speed'>): PT3RecordingRow[] {
  const rows: PT3RecordingRow[] = [];
  let frame = 0, speed = song.speed || 256;
  song.order.forEach((patternIndex, orderIndex) => {
    const pattern = song.patterns[patternIndex];
    if (!pattern) return;
    for (let row = 0; row < pattern.numRows; row++) {
      for (const channel of ['A', 'B', 'C'] as const) {
        const effects = pattern.pt3SourceRows?.[row]?.[channel]?.effects ?? [];
        for (let effect = effects.length - 1; effect >= 0; effect--) {
          if (effects[effect].code === 9) speed = effects[effect].params[0] || 256;
        }
      }
      rows.push({ patternIndex, orderIndex, row, startFrame: frame, endFrame: frame + speed });
      frame += speed;
    }
  });
  return rows;
}

/** Nearest musical grid in frame time, including the next loop's first row. */
export function quantizePT3Position(
  timeline: readonly PT3RecordingRow[], frame: number, grid: PT3QuantizeRows,
  loopOrderIndex: number | null = null,
): PT3RecordingPosition | null {
  const rows = loopOrderIndex === null ? timeline : timeline.filter(row => row.orderIndex === loopOrderIndex);
  if (!rows.length || !Number.isFinite(frame)) return null;
  if (grid === 0) {
    let low = 0, high = rows.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (rows[middle].startFrame <= frame) low = middle; else high = middle - 1;
    }
    return { ...rows[low], cycleOffset: 0 };
  }
  let closest = rows[0], distance = Math.abs(frame - closest.startFrame);
  for (const row of rows) {
    if (row.row % grid !== 0) continue;
    const candidateDistance = Math.abs(frame - row.startFrame);
    // Halfway lands on the later grid line.
    if (candidateDistance <= distance) { closest = row; distance = candidateDistance; }
  }
  if (loopOrderIndex !== null && Math.abs(frame - rows[rows.length - 1].endFrame) <= distance) {
    return { ...rows[0], cycleOffset: 1 };
  }
  return { ...closest, cycleOffset: 0 };
}

/** A quick tap must not replace its own note with a cut on the same row. */
export function resolvePT3NoteOffPosition(
  timeline: readonly PT3RecordingRow[], start: PT3RecordingPosition, release: PT3RecordingPosition,
  grid: PT3QuantizeRows, startIteration: number, releaseIteration: number, loopOrderIndex: number | null,
): PT3RecordingPosition | null {
  const sameCycle = releaseIteration + release.cycleOffset <= startIteration + start.cycleOffset;
  if (!sameCycle || release.startFrame > start.startFrame) return release;
  const next = timeline.find(row => row.startFrame > start.startFrame
    && (loopOrderIndex === null || row.orderIndex === loopOrderIndex) && row.row % Math.max(1, grid) === 0);
  if (next) return { ...next, cycleOffset: start.cycleOffset };
  if (loopOrderIndex !== null) {
    const first = timeline.find(row => row.orderIndex === loopOrderIndex);
    if (first && first.startFrame !== start.startFrame) return { ...first, cycleOffset: start.cycleOffset + 1 };
  }
  return null;
}
