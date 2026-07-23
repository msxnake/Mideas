import { TrackerSongData } from '../types';

export interface MideasMusicJsonPackage {
  format: 'mideas.music';
  version: 1;
  exportedAt: string;
  track: TrackerSongData;
}

const isRecord = (value: unknown): value is Record<string, any> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const sanitizeMusicFilename = (value: string): string => {
  const sanitized = value.trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');
  return sanitized || 'music_track';
};

export const createMusicJsonPackage = (song: TrackerSongData): MideasMusicJsonPackage => ({
  format: 'mideas.music',
  version: 1,
  exportedAt: new Date().toISOString(),
  track: cloneJson(song),
});

const extractTrackData = (parsed: unknown): unknown => {
  if (!isRecord(parsed)) return null;
  if (parsed.format === 'mideas.music' && isRecord(parsed.track)) return parsed.track;
  if (parsed.type === 'track' && isRecord(parsed.data)) return parsed.data;
  if (Array.isArray(parsed.assets)) {
    const trackAsset = parsed.assets.find(asset => isRecord(asset) && asset.type === 'track' && isRecord(asset.data));
    if (isRecord(trackAsset) && isRecord(trackAsset.data)) return trackAsset.data;
  }
  return parsed;
};

export const normalizeImportedMusic = (
  parsed: unknown,
  currentSong: Pick<TrackerSongData, 'id' | 'name'>
): TrackerSongData => {
  const candidate = extractTrackData(parsed);
  if (!isRecord(candidate)) {
    throw new Error('The JSON does not contain a Mideas music track.');
  }

  if (typeof candidate.name !== 'string' || !candidate.name.trim()) {
    throw new Error('The music track is missing a valid name.');
  }
  if (!['PSG', 'SCC', 'PSG+SCC'].includes(candidate.soundChip)) {
    throw new Error('The music track has an unsupported soundChip value.');
  }
  if (!Number.isFinite(candidate.bpm) || !Number.isFinite(candidate.speed)) {
    throw new Error('The music track is missing valid BPM or speed values.');
  }
  if (!Array.isArray(candidate.patterns) || !Array.isArray(candidate.order)
    || !Array.isArray(candidate.instruments) || !Array.isArray(candidate.ornaments)) {
    throw new Error('The music track is missing patterns, order, instruments, or ornaments arrays.');
  }

  const playbackBackend = candidate.playbackBackend === 'external-pt3' ? 'external-pt3' : 'native';
  if (playbackBackend === 'native' && candidate.patterns.length === 0) {
    throw new Error('A native music track must contain at least one pattern.');
  }

  candidate.patterns.forEach((pattern, patternIndex) => {
    if (!isRecord(pattern) || typeof pattern.id !== 'string' || typeof pattern.name !== 'string'
      || !Number.isInteger(pattern.numRows) || pattern.numRows < 1 || !Array.isArray(pattern.rows)) {
      throw new Error(`Pattern ${patternIndex} is invalid.`);
    }
    if (pattern.rows.length !== pattern.numRows) {
      throw new Error(`Pattern ${patternIndex} row count does not match numRows.`);
    }
  });

  candidate.order.forEach((patternIndex, orderIndex) => {
    if (!Number.isInteger(patternIndex) || patternIndex < 0 || patternIndex >= candidate.patterns.length) {
      throw new Error(`Pattern order entry ${orderIndex} is invalid.`);
    }
  });

  if (playbackBackend === 'external-pt3' && !Array.isArray(candidate.externalPt3Data)) {
    throw new Error('The external PT3 music track is missing its PT3 data.');
  }

  const imported = cloneJson(candidate) as TrackerSongData;
  const currentPatternIndexInOrder = imported.order.length > 0
    ? Math.min(Math.max(Number(imported.currentPatternIndexInOrder) || 0, 0), imported.order.length - 1)
    : 0;
  const activePatternIndex = imported.order[currentPatternIndexInOrder] ?? 0;

  return {
    ...imported,
    id: currentSong.id,
    name: currentSong.name,
    playbackBackend,
    title: typeof imported.title === 'string' ? imported.title : '',
    author: typeof imported.author === 'string' ? imported.author : '',
    sccEnabled: imported.soundChip === 'PSG+SCC' ? imported.sccEnabled !== false : undefined,
    currentPatternIndexInOrder,
    currentPatternId: imported.patterns[activePatternIndex]?.id,
    lengthInPatterns: imported.order.length,
    restartPosition: imported.order.length > 0
      ? Math.min(Math.max(Number(imported.restartPosition) || 0, 0), imported.order.length - 1)
      : 0,
    externalPt3Data: playbackBackend === 'external-pt3' ? imported.externalPt3Data : undefined,
    externalPt3HasHeader: playbackBackend === 'external-pt3' ? imported.externalPt3HasHeader : undefined,
    externalPt3PlayerId: playbackBackend === 'external-pt3' ? imported.externalPt3PlayerId : undefined,
  };
};
