
import { TrackerCell, TrackerRow, TrackerPattern, TrackerSongData, PT3Instrument, PT3Ornament } from '../../types';
import { DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED, PT3_NOTE_NAMES } from '../../constants';

// Cell Creation Helpers
export const createEmptyCell = (): TrackerCell => ({
  note: null,
  instrument: null,
  ornament: null,
  volume: null,
  // effectCmd and effectVal removed
});

export const createEmptyRow = (): TrackerRow => ({
  A: createEmptyCell(),
  B: createEmptyCell(),
  C: createEmptyCell(),
});

export const createDefaultTrackerPattern = (idSuffix: string, numRows: number = DEFAULT_PT3_ROWS_PER_PATTERN): TrackerPattern => ({
  id: `pattern_${idSuffix}`,
  name: `Pattern ${idSuffix.split('_').pop()?.padStart(2,'0') || '00'}`,
  numRows,
  rows: Array(numRows).fill(null).map(() => createEmptyRow()),
});

// Cell Width Constants (Tailwind class names)
export const CELL_WIDTH_NOTE = "w-10";
export const CELL_WIDTH_INSTR = "w-7";
export const CELL_WIDTH_ORN = "w-7";
export const CELL_WIDTH_VOL = "w-7";
// FX and FX_VAL widths removed
export const CELL_TEXT_ALIGN = "text-center";

// Input Validation Regex
export const NOTE_REGEX = /^([A-G](?:#|-)?(?:[0-7])|---|===)$/i;
export const INSTRUMENT_REGEX = /^([0-9]|[1-2][0-9]|3[0-1])$/;
export const ORNAMENT_REGEX = /^(0|[1-9]|1[0-5])$/;
export const VOLUME_REGEX = /^[0-9A-F]$/i;
// FX_CMD_REGEX and FX_VAL_REGEX removed

// Cell Display and Input Helpers
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
  
export const getCellTransform = (field: keyof TrackerCell): ((input:string)=>string) | undefined => {
    if (field === 'note' || field === 'volume') {
        return (input: string) => input.toUpperCase();
    }
    return undefined;
};

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

export const normalizeImportedPT3Data = (parsedData: Partial<TrackerSongData>, fileName: string): TrackerSongData => {
  const baseSong: TrackerSongData = {
    id: `song_imported_${Date.now()}`,
    name: parsedData.title || fileName.replace(/\.[^/.]+$/, "") || "Imported Song",
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
