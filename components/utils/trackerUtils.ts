
import { TrackerCell, TrackerRow, TrackerPattern, TrackerSongData, PT3Instrument, SCCInstrument, PT3Ornament, TrackerChannelId, PT3PatternCellSource } from '../../types';
import { DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED, PT3_CHANNELS, SCC_CHANNELS, PSG_SCC_CHANNELS, PT3_NOTE_NAMES } from '../../constants';
import { sourceEffectToNativeFields } from './trackerEffects';

/**
 * Chip a tracker channel belongs to: PSG letters (A-C) vs SCC digits (1-5).
 */
export const channelChip = (channelId: TrackerChannelId): 'PSG' | 'SCC' =>
  (PT3_CHANNELS as readonly string[]).includes(channelId) ? 'PSG' : 'SCC';

/**
 * Type guard: SCC wavetable instrument vs PSG (PT3) instrument.
 * Explicit chip tag wins; legacy instruments fall back to waveform presence.
 */
export const isSccInstrument = (
  instrument: PT3Instrument | SCCInstrument
): instrument is SCCInstrument => {
  if (instrument.chip) return instrument.chip === 'SCC';
  return Array.isArray((instrument as SCCInstrument).waveform);
};

/**
 * Channel columns for a song. Dual-chip songs expose the PSG trio plus the
 * SCC block; with the SCC switch off only the PSG trio remains active.
 * @param includeDisabled Keep SCC columns of a dual-chip song even when the
 *                        SCC switch is off (the editor renders them grayed).
 */
export const getSongChannels = (
  song: Pick<TrackerSongData, 'soundChip' | 'sccEnabled'>,
  includeDisabled: boolean = false
): readonly TrackerChannelId[] => {
  switch (song.soundChip) {
    case 'SCC': return SCC_CHANNELS;
    case 'PSG+SCC':
      return (song.sccEnabled !== false || includeDisabled) ? PSG_SCC_CHANNELS : PT3_CHANNELS;
    default: return PT3_CHANNELS;
  }
};

/**
 * Migrates a PSG-only or SCC-only song into a dual-chip 'PSG+SCC' song.
 * Non-destructive: returns a new object; existing rows keep their channel
 * keys (PSG rows already use A-C, SCC rows 1-5 — no collision) and every row
 * gains empty cells for the channels it lacks. Instruments get chip tags so
 * each channel group only offers its own. Already-dual songs are returned
 * normalized the same way (safe to call on load).
 */
export const toNativeTrackerSong = (song: TrackerSongData): TrackerSongData => ({
  ...song,
  playbackBackend: 'native',
  externalPt3Data: undefined,
  externalPt3HasHeader: undefined,
  externalPt3PlayerId: undefined,
  patterns: song.patterns.map(pattern => ({
    ...pattern,
    rows: pattern.rows.map((row, rowIndex) => {
      const nextRow: TrackerRow = { ...row };
      for (const channelId of PT3_CHANNELS) {
        const cell = row[channelId] ?? createEmptyCell();
        const sourceEffect = pattern.pt3SourceRows?.[rowIndex]?.[channelId]?.effects?.[0];
        const nativeEffect = sourceEffectToNativeFields(sourceEffect);
        nextRow[channelId] = {
          ...cell,
          effectCommand: cell.effectCommand ?? nativeEffect.effectCommand ?? null,
          effectParams: cell.effectParams ?? nativeEffect.effectParams ?? null,
        };
      }
      return nextRow;
    }),
  })),
});

export const toDualChipSong = (sourceSong: TrackerSongData): TrackerSongData => {
  const song = toNativeTrackerSong(sourceSong);
  const legacyChip: 'PSG' | 'SCC' = song.soundChip === 'SCC' ? 'SCC' : 'PSG';
  return {
    ...song,
    // A dual-chip arrangement must run through Mideas' native tick engine.
    // Cowbell replays the original PT3 byte stream and therefore has no way
    // to see or mix the five SCC columns added below.
    playbackBackend: 'native',
    externalPt3Data: undefined,
    externalPt3HasHeader: undefined,
    externalPt3PlayerId: undefined,
    soundChip: 'PSG+SCC',
    sccEnabled: song.sccEnabled !== false,
    instruments: song.instruments.map((inst) => (
      inst.chip ? inst : {
        ...inst,
        chip: song.soundChip === 'PSG+SCC'
          ? (isSccInstrument(inst) ? 'SCC' : 'PSG')
          : legacyChip,
      }
    )),
    patterns: song.patterns.map((pattern) => ({
      ...pattern,
      rows: pattern.rows.map((row) => {
        const fullRow: TrackerRow = {};
        for (const chId of PSG_SCC_CHANNELS) {
          fullRow[chId] = row[chId] ?? createEmptyCell();
        }
        return fullRow;
      }),
    })),
  };
};

/**
 * Creates an empty tracker cell with all fields initialized to null.
 * @returns A new TrackerCell object.
 */
export const createEmptyCell = (): TrackerCell => ({
  note: null,
  instrument: null,
  ornament: null,
  volume: null,
  effectCommand: null,
  effectParams: null,
});

/**
 * Creates an empty tracker row with empty cells for the given channels.
 * @param channels An array of channel IDs to create cells for. Defaults to PT3 channels.
 * @returns A new TrackerRow object.
 */
export const createEmptyRow = (channels: readonly TrackerChannelId[] = PT3_CHANNELS): TrackerRow => {
  const row: TrackerRow = {};
  for (const chId of channels) {
    row[chId] = createEmptyCell();
  }
  return row;
};

/**
 * Creates a default tracker pattern with a specified number of empty rows.
 * @param idSuffix A suffix to append to the pattern's ID.
 * @param numRows The number of rows for the pattern. Defaults to DEFAULT_PT3_ROWS_PER_PATTERN.
 * @param channels The channels to use for creating empty rows.
 * @returns A new TrackerPattern object.
 */
export const createDefaultTrackerPattern = (
  idSuffix: string, 
  numRows: number = DEFAULT_PT3_ROWS_PER_PATTERN,
  channels: readonly TrackerChannelId[] = PT3_CHANNELS
): TrackerPattern => ({
  id: `pattern_${idSuffix}`,
  name: `Pattern ${idSuffix.split('_').pop()?.padStart(2,'0') || '00'}`,
  numRows,
  rows: Array(numRows).fill(null).map(() => createEmptyRow(channels)),
});

/** Tailwind CSS class for the width of the note cell. */
export const CELL_WIDTH_NOTE = "w-10";
/** Tailwind CSS class for the width of the instrument cell. */
export const CELL_WIDTH_INSTR = "w-7";
/** Tailwind CSS class for the width of the ornament cell. */
export const CELL_WIDTH_ORN = "w-7";
/** Tailwind CSS class for the width of the volume cell. */
export const CELL_WIDTH_VOL = "w-7";
/** Tailwind CSS class for the Vortex effect command cell. */
export const CELL_WIDTH_EFFECT = "w-6";
/** Tailwind CSS class for the raw Vortex effect parameter bytes. */
export const CELL_WIDTH_EFFECT_PARAMS = "w-20";
/** Tailwind CSS class for centering text in cells. */
export const CELL_TEXT_ALIGN = "text-center";

/** Regex for validating note input. */
export const NOTE_REGEX = /^([A-G](?:#|-)?(?:[0-8])|---|===)$/i;
/** Regex for validating instrument number input (0-31). */
export const INSTRUMENT_REGEX = /^([0-9]|[1-2][0-9]|3[0-1])$/;
/** Regex for validating ornament number input (0-15). */
export const ORNAMENT_REGEX = /^(0|[1-9]|1[0-5])$/;
/** Regex for validating volume input (0-F). */
export const VOLUME_REGEX = /^[0-9A-F]$/i;

/**
 * Formats a tracker cell's value for display in the UI.
 * @param field The field of the cell to format (e.g., 'note', 'instrument').
 * @param value The value of the field.
 * @returns A formatted string for display.
 */
export const formatCellForDisplay = (field: keyof TrackerCell, value: string | number | null): string => {
    if (value === null || value === undefined) return "";
    switch (field) {
        case 'note':
            return String(value).toUpperCase();
        case 'instrument':
        case 'ornament':
            return String(value).padStart(2, '0');
        case 'volume':
            return Number(value).toString(16).toUpperCase();
        case 'effectCommand':
            return Number(value).toString(16).toUpperCase();
        case 'effectParams':
            return String(value).toUpperCase();
        case 'pt3Envelope':
            return String(value).toUpperCase();
        default:
            // This should not be reached if types are correct after removing effectCmd/Val
            const _exhaustiveCheck: never = field;
            return String(value);
    }
};

/**
 * Gets the placeholder text for a given tracker cell field.
 * @param field The field of the cell.
 * @returns The placeholder string for the input field.
 */
export const getCellPlaceholder = (field: keyof TrackerCell): string => {
    switch(field) {
        case 'note': return "---";
        case 'instrument': return "00";
        case 'ornament': return "00";
        case 'volume': return "-";
        case 'effectCommand': return ".";
        case 'effectParams': return "..........";
        case 'pt3Envelope': return "-:----";
        default: 
            // This should not be reached
            const _exhaustiveCheck: never = field;
            return "";
    }
};
  
/**
 * Gets a function to transform the input value for a given cell field.
 * For example, to convert note input to uppercase.
 * @param field The field of the cell.
 * @returns A transformation function, or undefined if no transformation is needed.
 */
export const getCellTransform = (field: keyof TrackerCell): ((input:string)=>string) | undefined => {
    if (field === 'note' || field === 'volume' || field === 'effectParams' || field === 'pt3Envelope') {
        return (input: string) => input.toUpperCase();
    }
    return undefined;
};

/**
 * Gets a regex pattern for allowed characters in a given cell field.
 * @param field The field of the cell.
 * @returns A RegExp object for allowed characters, or undefined.
 */
export const getCellAllowedCharsPattern = (field: keyof TrackerCell): RegExp | undefined => {
    switch(field) {
        case 'note': return /^[A-G#\-=0-7]$/i;
        case 'instrument': return /^[0-9]$/;
        case 'ornament': return /^[0-9]$/;
        case 'volume': return /^[0-9A-F]$/i;
        case 'effectCommand': return /^[0-9A-F]$/i;
        case 'effectParams': return /^[0-9A-F]$/i;
        // Shape digit and period digits, the ':' separator, and the letters of OFF.
        case 'pt3Envelope': return /^[0-9A-FO:]$/i;
        default: 
            const _exhaustiveCheck: never = field;
            return undefined;
    }
};

/**
 * Gets the maximum input length for a given cell field.
 * @param field The field of the cell.
 * @returns The maximum number of characters allowed.
 */
export const getCellMaxLength = (field: keyof TrackerCell): number => {
    switch(field) {
        case 'note': return 3;
        case 'instrument': return 2;
        case 'ornament': return 2;
        case 'volume': return 1;
        case 'effectCommand': return 1;
        case 'effectParams': return 10;
        case 'pt3Envelope': return 6;   // "S:PPPP"
        default: 
            const _exhaustiveCheck: never = field;
            return 10;
    }
};

const clonePT3PatternCellSource = (source?: PT3PatternCellSource): PT3PatternCellSource | undefined => source
  ? {
    ...source,
    effects: source.effects.map(effect => ({ ...effect, params: [...effect.params] })),
    events: [...source.events],
    prefixBytes: [...source.prefixBytes],
    deferredPayloadBytes: [...source.deferredPayloadBytes],
  }
  : undefined;

/**
 * Normalizes partially parsed PT3 song data into a complete TrackerSongData object.
 * It fills in missing fields with defaults and ensures data consistency.
 * @param parsedData The partial song data parsed from a PT3 file.
 * @param fileName The name of the original file, used as a fallback for the song name.
 * @returns A complete and consistent TrackerSongData object.
 */
export const normalizeImportedPT3Data = (parsedData: Partial<TrackerSongData>, fileName: string): TrackerSongData => {
  const baseSong: TrackerSongData = {
    id: `song_imported_${Date.now()}`,
    name: parsedData.title || fileName.replace(/\.[^/.]+$/, "") || "Imported Song",
    playbackBackend: parsedData.playbackBackend || 'native',
    soundChip: parsedData.soundChip || 'PSG',
    title: parsedData.title || fileName.replace(/\.[^/.]+$/, "") || "Imported Song",
    author: parsedData.author || "Unknown Author",
    bpm: parsedData.bpm || DEFAULT_PT3_BPM,
    speed: parsedData.speed || DEFAULT_PT3_SPEED,
    globalVolume: parsedData.globalVolume !== undefined ? parsedData.globalVolume : 15,
    patterns: [],
    order: [],
    lengthInPatterns: 0,
    restartPosition: 0,
    instruments: parsedData.instruments || [],
    ornaments: parsedData.ornaments || [],
    ayHardwareEnvelopePeriod: parsedData.ayHardwareEnvelopePeriod,
    currentPatternIndexInOrder: 0,
    currentPatternId: undefined,
    externalPt3Data: parsedData.externalPt3Data,
    externalPt3HasHeader: parsedData.externalPt3HasHeader,
    externalPt3PlayerId: parsedData.externalPt3PlayerId,
  };

  // Normalize patterns
  if (parsedData.patterns && parsedData.patterns.length > 0) {
    baseSong.patterns = parsedData.patterns.map((p, idx) => {
      const patternId = p.id || `imported_pattern_${idx}`;
      const numRows = p.numRows > 0 && p.numRows <= 256 ? p.numRows : DEFAULT_PT3_ROWS_PER_PATTERN;
      const rows: TrackerRow[] = [];
      for (let r = 0; r < numRows; r++) {
        const existingRow = p.rows?.[r];
        // Remove effectCmd and effectVal from imported cell data
        const cleanCell = (cell?: Partial<TrackerCell>): TrackerCell => ({
            note: cell?.note ?? null,
            instrument: cell?.instrument ?? null,
              ornament: cell?.ornament ?? null,
              volume: cell?.volume ?? null,
              effectCommand: cell?.effectCommand ?? null,
              effectParams: cell?.effectParams ?? null,
        });
        rows.push({
          A: cleanCell(existingRow?.A),
          B: cleanCell(existingRow?.B),
          C: cleanCell(existingRow?.C),
        });
      }
      return {
        id: patternId,
        name: p.name || `Pattern ${String(idx).padStart(2, '0')}`,
        numRows: numRows,
        rows: rows,
        // Source-faithful PT3 editing needs the exact command/payload map.
        // Dropping it here made the grid look editable but stripped Vortex
        // effects the first time a note was saved.
        pt3SourceRows: p.pt3SourceRows?.slice(0, numRows).map(sourceRow => ({
          A: clonePT3PatternCellSource(sourceRow.A),
          B: clonePT3PatternCellSource(sourceRow.B),
          C: clonePT3PatternCellSource(sourceRow.C),
        })),
      };
    });
  } else {
    const defaultPattern = createDefaultTrackerPattern(`default_${Date.now()}`);
    baseSong.patterns = [defaultPattern];
  }

  if (parsedData.order && parsedData.order.length > 0) {
    baseSong.order = parsedData.order.filter(orderIdx => orderIdx >= 0 && orderIdx < baseSong.patterns.length);
    if (baseSong.order.length === 0 && baseSong.patterns.length > 0) {
      baseSong.order = [0]; 
    }
  } else if (baseSong.patterns.length > 0) {
    baseSong.order = [0]; 
  }

  baseSong.lengthInPatterns = parsedData.lengthInPatterns !== undefined && parsedData.lengthInPatterns > 0 && parsedData.lengthInPatterns <= baseSong.order.length 
    ? parsedData.lengthInPatterns 
    : baseSong.order.length;
  
  baseSong.restartPosition = parsedData.restartPosition !== undefined && parsedData.restartPosition < baseSong.lengthInPatterns
    ? parsedData.restartPosition
    : 0;

  if (baseSong.patterns.length > 0 && baseSong.order.length > 0) {
    const firstPatternIndexInOrder = baseSong.order[0];
    if (firstPatternIndexInOrder < baseSong.patterns.length) {
        baseSong.currentPatternId = baseSong.patterns[firstPatternIndexInOrder].id;
    } else { 
        baseSong.currentPatternId = baseSong.patterns[0].id;
        baseSong.order[0] = 0; 
    }
  } else if (baseSong.patterns.length > 0) { 
    baseSong.order = [0];
    baseSong.lengthInPatterns = 1;
    baseSong.restartPosition = 0;
    baseSong.currentPatternId = baseSong.patterns[0].id;
  }
   if (baseSong.currentPatternIndexInOrder >= baseSong.order.length) {
     baseSong.currentPatternIndexInOrder = Math.max(0, baseSong.order.length -1);
   }
   if (baseSong.order[baseSong.currentPatternIndexInOrder] !== undefined && baseSong.patterns[baseSong.order[baseSong.currentPatternIndexInOrder]]) {
     baseSong.currentPatternId = baseSong.patterns[baseSong.order[baseSong.currentPatternIndexInOrder]].id;
   } else if (baseSong.patterns.length > 0) {
     baseSong.currentPatternIndexInOrder = 0;
     baseSong.currentPatternId = baseSong.patterns[0].id;
   }

  return baseSong;
};
