import type { TrackerCell } from '../../../types';
import {
  getTrackerEffectParameterByteCount,
  parseTrackerEffectParams,
} from '../../../components/utils/trackerEffects';

export const TRACKER_EFFECT_RECORD_SIZE = 6;

export interface TrackerEffectCellSource {
  cell: Pick<TrackerCell, 'effectCommand' | 'effectParams'>;
  context: string;
}

export interface SerializedTrackerEffectTable {
  records: number[][];
  indexForCell: (cell: Pick<TrackerCell, 'effectCommand' | 'effectParams'>) => number;
}

const serializeEffectRecord = (
  cell: Pick<TrackerCell, 'effectCommand' | 'effectParams'>,
  warnings?: string[],
  context?: string,
): number[] => {
  if (cell.effectCommand === null || cell.effectCommand === undefined) {
    return [0, 0, 0, 0, 0, 0];
  }

  const command = cell.effectCommand & 0x0f;
  const params = parseTrackerEffectParams(cell.effectParams);
  const expected = getTrackerEffectParameterByteCount(command);
  if (expected > 0 && params.length !== expected && warnings) {
    warnings.push(
      `${context || 'tracker cell'}: FX ${command.toString(16).toUpperCase()} expects ${expected} parameter bytes; ` +
      `received ${params.length}, missing bytes are zero-filled`,
    );
  }
  return [
    command,
    params[0] ?? 0,
    params[1] ?? 0,
    params[2] ?? 0,
    params[3] ?? 0,
    params[4] ?? 0,
  ];
};

const recordKey = (record: readonly number[]): string =>
  record.map(value => (value & 0xff).toString(16).padStart(2, '0')).join('');

/**
 * Build one compact per-track Vortex FX dictionary. Pattern cells store a
 * single byte index; index 0 is the all-zero NOP record. This keeps native
 * tracker rows small while retaining the complete five-byte PT3 payload.
 */
export const buildSerializedTrackerEffectTable = (
  sources: readonly TrackerEffectCellSource[],
  warnings: string[] = [],
): SerializedTrackerEffectTable => {
  const records: number[][] = [[0, 0, 0, 0, 0, 0]];
  const indexByKey = new Map<string, number>([[recordKey(records[0]), 0]]);

  for (const source of sources) {
    const record = serializeEffectRecord(source.cell, warnings, source.context);
    const key = recordKey(record);
    if (indexByKey.has(key)) continue;
    if (records.length >= 256) {
      throw new Error('Tracker song uses more than 255 distinct FX/CMD records; split the song or reuse commands.');
    }
    indexByKey.set(key, records.length);
    records.push(record);
  }

  return {
    records,
    indexForCell: cell => {
      const key = recordKey(serializeEffectRecord(cell));
      return indexByKey.get(key) ?? 0;
    },
  };
};

export const flattenSerializedTrackerEffectTable = (
  table: SerializedTrackerEffectTable,
): number[] => table.records.flatMap(record =>
  record.slice(0, TRACKER_EFFECT_RECORD_SIZE).map(value => value & 0xff),
);
