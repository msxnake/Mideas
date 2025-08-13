
import React from 'react';
import { TrackerPattern, TrackerRow, TrackerCell, PT3ChannelId } from '../../types';
import { PT3_CHANNELS } from '../../constants';
import { CellInput } from '../common/CellInput';
import { 
    formatCellForDisplay, getCellPlaceholder, getCellTransform, getCellAllowedCharsPattern, getCellMaxLength,
    CELL_WIDTH_NOTE, CELL_WIDTH_INSTR, CELL_WIDTH_ORN, CELL_WIDTH_VOL, CELL_TEXT_ALIGN,
    createEmptyCell
} from '../utils/trackerUtils'; 

interface PatternEditorGridProps {
  currentPattern: TrackerPattern;
  focusedCell: { rowIndex: number; channelId: PT3ChannelId; field: keyof TrackerCell } | null;
  isPlaying: boolean;
  playbackRow: number;
  onCellChange: (rowIndex: number, channelId: PT3ChannelId, field: keyof TrackerCell, inputValue: string | number | null) => void;
  onCellFocus: (rowIndex: number, channelId: PT3ChannelId, field: keyof TrackerCell) => void;
  onGridKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  patternEditorRef: React.RefObject<HTMLDivElement>;
}

export const PatternEditorGrid: React.FC<PatternEditorGridProps> = React.memo(({
  currentPattern,
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
        className="flex-grow p-1 overflow-auto font-mono text-xs" 
        onKeyDown={onGridKeyDown} 
        tabIndex={0} 
        role="grid"
        aria-label="Pattern Editor"
    >
      <div className="flex sticky top-0 bg-msx-panelbg z-10 pb-1 border-b border-msx-border" aria-hidden="true">
        <div className="w-8 text-center text-msx-textsecondary">Row</div>
        {PT3_CHANNELS.map(chId => (
          <div key={`header-${chId}`} className="flex border-l border-msx-border pl-1">
            <div className={`${CELL_WIDTH_NOTE} ${CELL_TEXT_ALIGN} text-msx-highlight`}>Ch {chId} Note</div>
            <div className={`${CELL_WIDTH_INSTR} ${CELL_TEXT_ALIGN} text-msx-highlight`}>Ins</div>
            <div className={`${CELL_WIDTH_ORN} ${CELL_TEXT_ALIGN} text-msx-highlight`}>Orn</div>
            <div className={`${CELL_WIDTH_VOL} ${CELL_TEXT_ALIGN} text-msx-highlight`}>Vol</div>
          </div>
        ))}
      </div>
      {rowNumbers.map(rIdx => {
        const rowData = currentPattern.rows[rIdx];
        const isCurrentPlaybackRow = isPlaying && rIdx === playbackRow;
        const rowBgClass = isCurrentPlaybackRow ? 'bg-msx-textprimary text-msx-bgcolor' : (rIdx % 16 === 0 ? 'bg-msx-border/30' : (rIdx % 4 === 0 ? 'bg-msx-panelbg/60' : ''));
        const rowNumColorClass = isCurrentPlaybackRow ? 'text-msx-bgcolor' : (rIdx % 16 === 0 ? 'text-msx-highlight' : 'text-msx-textsecondary');

        return (
          <div key={`row-${rIdx}`} className={`flex items-center ${rowBgClass}`} role="row">
            <div className={`w-8 text-center ${rowNumColorClass} select-none`} role="rowheader">
                {String(rIdx).padStart(2, '0')}
            </div>
            {PT3_CHANNELS.map(chId => {
              const cellData = rowData ? rowData[chId] : createEmptyCell();
              const cellTextColor = isCurrentPlaybackRow ? 'text-msx-bgcolor' : 'text-msx-textprimary';
              return (
                <div key={`${chId}-${rIdx}`} className={`flex border-l border-msx-border pl-1 ${cellTextColor}`} role="gridcell">
                  {fieldsOrder.map(field => {
                    let fieldWidthClass = '';
                    switch(field) {
                        case 'note': fieldWidthClass = CELL_WIDTH_NOTE; break;
                        case 'instrument': fieldWidthClass = CELL_WIDTH_INSTR; break;
                        case 'ornament': fieldWidthClass = CELL_WIDTH_ORN; break;
                        case 'volume': fieldWidthClass = CELL_WIDTH_VOL; break;
                        default: const _exhaustiveCheck: never = field; fieldWidthClass = CELL_WIDTH_NOTE; // Should not happen
                    }
                    return (
                        <CellInput
                            key={`${chId}-${rIdx}-${field}`}
                            id={`cell-${rIdx}-${chId}-${field}`}
                            value={formatCellForDisplay(field, cellData[field])}
                            placeholder={getCellPlaceholder(field)}
                            maxLength={getCellMaxLength(field)}
                            transformInput={getCellTransform(field)}
                            allowedCharsPattern={getCellAllowedCharsPattern(field)}
                            onChange={(val) => onCellChange(rIdx, chId, field, val)}
                            onFocus={() => onCellFocus(rIdx, chId, field)}
                            className={`${CELL_TEXT_ALIGN} ${isCurrentPlaybackRow ? 'placeholder:text-msx-bgcolor/70' : 'placeholder:text-msx-textsecondary/70'} ${fieldWidthClass}`}
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
