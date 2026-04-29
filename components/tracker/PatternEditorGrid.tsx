
import React from 'react';
import { TrackerPattern, TrackerRow, TrackerCell, TrackerChannelId } from '../../types';
import { CellInput } from '../common/CellInput';
import { 
    formatCellForDisplay, getCellPlaceholder, getCellTransform, getCellAllowedCharsPattern, getCellMaxLength,
    CELL_WIDTH_NOTE, CELL_WIDTH_INSTR, CELL_WIDTH_ORN, CELL_WIDTH_VOL, CELL_TEXT_ALIGN,
    createEmptyCell
} from '../utils/trackerUtils'; 

const CHANNEL_ACCENTS = [
  'border-l-emerald-400/80',
  'border-l-sky-400/80',
  'border-l-amber-300/80',
  'border-l-fuchsia-400/80',
  'border-l-rose-400/80',
] as const;

const FIELD_TEXT_CLASSES: Record<keyof TrackerCell, string> = {
  note: 'text-msx-highlight placeholder:text-msx-textsecondary/60 font-semibold',
  instrument: 'text-emerald-300 placeholder:text-emerald-900/70',
  ornament: 'text-sky-300 placeholder:text-sky-900/70',
  volume: 'text-amber-200 placeholder:text-amber-900/70',
};

/**
 * Props for the {@link PatternEditorGrid} component.
 * @category Tracker
 */
interface PatternEditorGridProps {
  /** The pattern data to display and edit. */
  currentPattern: TrackerPattern;
  /** The channels to display. */
  channels: readonly TrackerChannelId[];
  /** The currently focused cell's coordinates, or null. */
  focusedCell: { rowIndex: number; channelId: TrackerChannelId; field: keyof TrackerCell } | null;
  /** Whether the song is currently playing. */
  isPlaying: boolean;
  /** The current row being highlighted during playback. */
  playbackRow: number;
  /** Callback function when a cell's value changes. */
  onCellChange: (rowIndex: number, channelId: TrackerChannelId, field: keyof TrackerCell, inputValue: string | number | null) => void;
  /** Callback function when a cell receives focus. */
  onCellFocus: (rowIndex: number, channelId: TrackerChannelId, field: keyof TrackerCell) => void;
  /** Callback for keydown events on the grid. */
  onGridKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** A ref to the main grid container for focusing. */
  patternEditorRef: React.RefObject<HTMLDivElement>;
}

/**
 * A grid component for editing a single pattern in the tracker.
 * It displays rows of note, instrument, ornament, and volume data for each channel.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const PatternEditorGrid: React.FC<PatternEditorGridProps> = React.memo(({
  currentPattern,
  channels,
  focusedCell,
  isPlaying,
  playbackRow,
  onCellChange,
  onCellFocus,
  onGridKeyDown,
  patternEditorRef
}) => {
  const numRows = currentPattern.numRows;
  const rowNumbers = Array.from({ length: numRows }, (_, i) => i);

  const fieldsOrder: (keyof TrackerCell)[] = ['note', 'instrument', 'ornament', 'volume'];


  return (
    <div 
        ref={patternEditorRef} 
        className="flex-grow p-2 overflow-auto font-mono text-xs bg-msx-bgcolor" 
        onKeyDown={onGridKeyDown} 
        tabIndex={0} 
        role="grid"
        aria-label="Pattern Editor"
    >
      <div className="flex sticky top-0 bg-msx-panelbg z-10 pb-1 border-b border-msx-border shadow-md" aria-hidden="true">
        <div className="w-10 text-center text-msx-textsecondary tracking-wide">ROW</div>
        {channels.map((chId, chIndex) => (
          <div
            key={`header-${chId}`}
            className={`flex border-l-4 ${CHANNEL_ACCENTS[chIndex % CHANNEL_ACCENTS.length]} pl-1 pr-1 bg-msx-bgcolor/40`}
          >
            <div className={`${CELL_WIDTH_NOTE} ${CELL_TEXT_ALIGN} text-msx-highlight`}>CH {chId}</div>
            <div className={`${CELL_WIDTH_INSTR} ${CELL_TEXT_ALIGN} text-emerald-300`}>IN</div>
            <div className={`${CELL_WIDTH_ORN} ${CELL_TEXT_ALIGN} text-sky-300`}>OR</div>
            <div className={`${CELL_WIDTH_VOL} ${CELL_TEXT_ALIGN} text-amber-200`}>V</div>
          </div>
        ))}
      </div>
      {rowNumbers.map(rIdx => {
        const rowData = currentPattern.rows[rIdx];
        const isCurrentPlaybackRow = isPlaying && rIdx === playbackRow;
        const isPhraseStart = rIdx % 16 === 0;
        const isBeatStart = rIdx % 4 === 0;
        const rowBgClass = isCurrentPlaybackRow
          ? 'bg-msx-highlight/90 text-msx-bgcolor shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
          : (isPhraseStart ? 'bg-msx-border/35' : (isBeatStart ? 'bg-msx-panelbg/70' : 'hover:bg-msx-panelbg/35'));
        const rowNumColorClass = isCurrentPlaybackRow
          ? 'text-msx-bgcolor font-bold'
          : (isPhraseStart ? 'text-msx-highlight font-bold' : (isBeatStart ? 'text-msx-textprimary' : 'text-msx-textsecondary'));
        const rowHex = rIdx.toString(16).toUpperCase().padStart(2, '0');

        return (
          <div key={`row-${rIdx}`} className={`flex items-center min-h-6 ${rowBgClass}`} role="row">
            <div className={`w-10 text-center ${rowNumColorClass} select-none`} role="rowheader" title={`Row ${rIdx}`}>
                {rowHex}
            </div>
            {channels.map((chId, chIndex) => {
              const cellData = rowData ? rowData[chId] : createEmptyCell();
              const cellTextColor = isCurrentPlaybackRow ? 'text-msx-bgcolor' : 'text-msx-textprimary';
              return (
                <div
                  key={`${chId}-${rIdx}`}
                  className={`flex border-l-4 ${CHANNEL_ACCENTS[chIndex % CHANNEL_ACCENTS.length]} pl-1 pr-1 ${cellTextColor}`}
                  role="gridcell"
                >
                  {fieldsOrder.map(field => {
                    let fieldWidthClass = '';
                    switch(field) {
                        case 'note': fieldWidthClass = CELL_WIDTH_NOTE; break;
                        case 'instrument': fieldWidthClass = CELL_WIDTH_INSTR; break;
                        case 'ornament': fieldWidthClass = CELL_WIDTH_ORN; break;
                        case 'volume': fieldWidthClass = CELL_WIDTH_VOL; break;
                        default: const _exhaustiveCheck: never = field; fieldWidthClass = CELL_WIDTH_NOTE; // Should not happen
                    }
                    const isFocused = focusedCell?.rowIndex === rIdx && focusedCell.channelId === chId && focusedCell.field === field;
                    return (
                        <CellInput
                            key={`${chId}-${rIdx}-${field}`}
                            id={`cell-${rIdx}-${chId}-${field}`}
                            value={formatCellForDisplay(field, cellData?.[field])}
                            placeholder={getCellPlaceholder(field)}
                            maxLength={getCellMaxLength(field)}
                            transformInput={getCellTransform(field)}
                            allowedCharsPattern={getCellAllowedCharsPattern(field)}
                            onChange={(val) => onCellChange(rIdx, chId, field, val)}
                            onFocus={() => onCellFocus(rIdx, chId, field)}
                            className={`${CELL_TEXT_ALIGN} ${isCurrentPlaybackRow ? 'placeholder:text-msx-bgcolor/70' : FIELD_TEXT_CLASSES[field]} ${fieldWidthClass} ${isFocused ? 'ring-1 ring-msx-highlight/80 bg-msx-highlight/20' : ''}`}
                            ariaLabel={`${chId} ${field} at row ${rIdx}`}
                            isNoteField={field === 'note'}
                        />
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});
PatternEditorGrid.displayName = 'PatternEditorGrid';
