
import { TrackerCell, TrackerRow, TrackerPattern, TrackerSongData, PT3Instrument, PT3Ornament, TrackerChannelId } from '../../types';
import { DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED, PT3_CHANNELS, PT3_NOTE_NAMES } from '../../constants';

/**
 * Creates an empty tracker cell with all fields initialized to null.
 * @returns A new TrackerCell object.
 */
export const createEmptyCell = (): TrackerCell => ({
  note: null,
  instrument: null,
  ornament: null,
  volume: null,
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
/** Tailwind CSS class for centering text in cells. */
export const CELL_TEXT_ALIGN = "text-center";

/** Regex for validating note input. */
export const NOTE_REGEX = /^([A-G](?:#|-)?(?:[0-7])|---|===)$/i;
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
    if (field === 'note' || field === 'volume') {
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
        default: 
            const _exhaustiveCheck: never = field;
            return 10;
    }
};

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
