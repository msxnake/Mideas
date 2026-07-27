
import React from 'react';
import { TrackerPattern, TrackerRow, TrackerCell, TrackerChannelId } from '../../types';
import { CellInput } from '../common/CellInput';
import { 
    formatCellForDisplay, getCellPlaceholder, getCellTransform, getCellAllowedCharsPattern, getCellMaxLength,
    CELL_WIDTH_NOTE, CELL_WIDTH_INSTR, CELL_WIDTH_ORN, CELL_WIDTH_VOL,
    CELL_WIDTH_EFFECT, CELL_WIDTH_EFFECT_PARAMS, CELL_TEXT_ALIGN,
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
  effectCommand: 'text-fuchsia-300 placeholder:text-fuchsia-900/70',
  effectParams: 'text-fuchsia-200 placeholder:text-fuchsia-900/70',
};

const HEADER_FIELD_CLASSES: Record<keyof TrackerCell, string> = {
  note: 'text-msx-highlight',
  instrument: 'text-emerald-300',
  ornament: 'text-sky-300',
  volume: 'text-amber-200',
  effectCommand: 'text-fuchsia-300',
  effectParams: 'text-fuchsia-200',
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
  /** Show a decoded source module without allowing edits that cannot be written back byte-exactly. */
  readOnly?: boolean;
  /** Original PT3 stream: note terminators can be patched in-place and Vortex commands are shown. */
  sourcePT3Mode?: boolean;
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
  patternEditorRef,
  readOnly = false,
  sourcePT3Mode = false,
}) => {
  const numRows = currentPattern.numRows;
  const rowNumbers = Array.from({ length: numRows }, (_, i) => i);

  const fieldsOrder: (keyof TrackerCell)[] = sourcePT3Mode
    ? ['note', 'instrument', 'ornament', 'volume']
    : ['note', 'instrument', 'ornament', 'volume', 'effectCommand', 'effectParams'];


  return (
    <div 
        ref={patternEditorRef} 
        className="min-h-0 flex-grow overflow-auto bg-[#070b10] font-mono text-xs outline-none shadow-inner focus:ring-1 focus:ring-msx-highlight/40"
        onKeyDown={readOnly ? undefined : onGridKeyDown}
        tabIndex={0} 
        role="grid"
        aria-label="Pattern Editor"
    >
      <div className="sticky top-0 z-20 flex border-b border-msx-border bg-msx-panelbg shadow-[0_8px_18px_rgba(0,0,0,0.35)]" aria-hidden="true">
        <div className="flex h-8 w-12 flex-shrink-0 items-center justify-center border-r border-msx-border/80 bg-black/20 text-[0.62rem] uppercase tracking-wider text-msx-textsecondary">Row</div>
        {channels.map((chId, chIndex) => (
          <div
            key={`header-${chId}`}
            className={`flex h-8 items-center border-l-4 ${CHANNEL_ACCENTS[chIndex % CHANNEL_ACCENTS.length]} bg-msx-bgcolor/50 px-1`}
          >
            <div className={`${CELL_WIDTH_NOTE} ${CELL_TEXT_ALIGN} ${HEADER_FIELD_CLASSES.note} text-[0.68rem] font-bold`} title={`Channel ${chId} note`}>CH {chId}</div>
            <div className={`${CELL_WIDTH_INSTR} ${CELL_TEXT_ALIGN} ${HEADER_FIELD_CLASSES.instrument} text-[0.58rem]`} title="Instrument">INS</div>
            <div className={`${CELL_WIDTH_ORN} ${CELL_TEXT_ALIGN} ${HEADER_FIELD_CLASSES.ornament} text-[0.58rem]`} title="Ornament">ORN</div>
            <div className={`${CELL_WIDTH_VOL} ${CELL_TEXT_ALIGN} ${HEADER_FIELD_CLASSES.volume} text-[0.58rem]`} title="Volume">VOL</div>
            {!sourcePT3Mode && <div className={`${CELL_WIDTH_EFFECT} ${CELL_TEXT_ALIGN} ${HEADER_FIELD_CLASSES.effectCommand} text-[0.58rem]`} title="Vortex effect command 0-F">FX</div>}
            {!sourcePT3Mode && <div className={`${CELL_WIDTH_EFFECT_PARAMS} ${CELL_TEXT_ALIGN} ${HEADER_FIELD_CLASSES.effectParams} text-[0.58rem]`} title="Raw Vortex command parameter bytes in hexadecimal">CMD</div>}
            {sourcePT3Mode && <div className="w-32 px-1 text-left text-[0.58rem] text-fuchsia-300" title="Vortex/PT3 row commands">FX / CMD</div>}
          </div>
        ))}
      </div>
      {rowNumbers.map(rIdx => {
        const rowData = currentPattern.rows[rIdx];
        const isCurrentPlaybackRow = isPlaying && rIdx === playbackRow;
        const isPhraseStart = rIdx % 16 === 0;
        const isBeatStart = rIdx % 4 === 0;
        const rowBgClass = isCurrentPlaybackRow
          ? 'bg-msx-highlight/95 text-msx-bgcolor shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]'
          : (isPhraseStart ? 'bg-slate-800/70' : (isBeatStart ? 'bg-slate-900/80' : 'bg-[#070b10] hover:bg-slate-800/45'));
        const rowNumColorClass = isCurrentPlaybackRow
          ? 'text-msx-bgcolor font-bold'
          : (isPhraseStart ? 'text-msx-highlight font-bold' : (isBeatStart ? 'text-msx-textprimary' : 'text-msx-textsecondary/80'));
        const rowHex = rIdx.toString(16).toUpperCase().padStart(2, '0');

        return (
          <div key={`row-${rIdx}`} className={`group flex min-h-[24px] items-center border-b border-black/25 ${rowBgClass}`} role="row">
            <div className={`flex w-12 flex-shrink-0 items-center justify-center border-r border-msx-border/45 ${rowNumColorClass} select-none`} role="rowheader" title={`Row ${rIdx}`}>
                {rowHex}
            </div>
            {channels.map((chId, chIndex) => {
              const cellData = rowData ? rowData[chId] : createEmptyCell();
              const sourceCell = sourcePT3Mode && (chId === 'A' || chId === 'B' || chId === 'C')
                ? currentPattern.pt3SourceRows?.[rIdx]?.[chId]
                : undefined;
              const cellTextColor = isCurrentPlaybackRow ? 'text-msx-bgcolor' : 'text-msx-textprimary';
              return (
                <div
                  key={`${chId}-${rIdx}`}
                  className={`flex border-l-4 ${CHANNEL_ACCENTS[chIndex % CHANNEL_ACCENTS.length]} px-1 ${cellTextColor}`}
                  role="gridcell"
                >
                  {fieldsOrder.map(field => {
                    let fieldWidthClass = '';
                    switch(field) {
                        case 'note': fieldWidthClass = CELL_WIDTH_NOTE; break;
                        case 'instrument': fieldWidthClass = CELL_WIDTH_INSTR; break;
                        case 'ornament': fieldWidthClass = CELL_WIDTH_ORN; break;
                        case 'volume': fieldWidthClass = CELL_WIDTH_VOL; break;
                        case 'effectCommand': fieldWidthClass = CELL_WIDTH_EFFECT; break;
                        case 'effectParams': fieldWidthClass = CELL_WIDTH_EFFECT_PARAMS; break;
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
                            className={`${CELL_TEXT_ALIGN} ${isCurrentPlaybackRow ? 'placeholder:text-msx-bgcolor/70' : FIELD_TEXT_CLASSES[field]} ${fieldWidthClass} rounded-sm transition-colors ${isFocused ? 'ring-1 ring-msx-highlight/80 bg-msx-highlight/20' : 'group-hover:bg-white/5'}`}
                            ariaLabel={`${chId} ${field} at row ${rIdx}`}
                            isNoteField={field === 'note'}
                            readOnly={readOnly}
                        />
                    );
                  })}
                  {sourcePT3Mode && (
                    <div
                      className={`w-32 flex-shrink-0 truncate px-1 font-mono text-[0.58rem] ${isCurrentPlaybackRow ? 'text-msx-bgcolor' : 'text-fuchsia-300/90'}`}
                      title={sourceCell?.events?.length
                        ? sourceCell.events.join(' | ')
                        : sourceCell?.decoded === false
                          ? `Held row (note skip ${sourceCell.noteSkip})`
                          : 'No PT3 command'}
                    >
                      {sourceCell?.events?.join(' ') || (sourceCell?.decoded === false ? `·${sourceCell.noteSkip}` : '...')}
                    </div>
                  )}
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
