
import React from 'react';
import { TrackerPattern } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CaretDownIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link PatternsPanel} component.
 * @category Tracker
 */
interface PatternsPanelProps {
  /** The list of all patterns in the song. */
  patterns: TrackerPattern[];
  /** The ID of the currently active pattern. */
  activePatternId: string | null;
  /** Callback function to set the active pattern. */
  onSetActivePatternId: (id: string) => void;
  /** Callback function to add a new pattern. */
  onAddPattern: () => void;
  /** Callback function to delete the currently active pattern. */
  onDeleteCurrentPattern: () => void;
}

/**
 * A panel that displays the list of all patterns in a tracker song.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const PatternsPanel: React.FC<PatternsPanelProps> = ({
  patterns, activePatternId, onSetActivePatternId, onAddPattern, onDeleteCurrentPattern
}) => {
  return (
    <Panel title="Patterns" icon={<CaretDownIcon/>} bodyClassName="p-2">
        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
            {patterns.map((p, idx) => (
                <button
                    key={p.id}
                    onClick={() => onSetActivePatternId(p.id)}
                    className={`flex w-full items-center gap-2 rounded border px-2 py-1 text-left text-xs transition-colors ${activePatternId === p.id ? 'border-msx-highlight bg-msx-highlight/20 text-msx-highlight' : 'border-msx-border bg-msx-bgcolor hover:border-msx-highlight/60 hover:bg-msx-border/45'}`}
                >
                    <span className="font-mono text-[0.68rem] text-msx-textsecondary">{String(idx).padStart(2,'0')}</span>
                    <span className="min-w-0 flex-grow truncate">{p.name}</span>
                    <span className="font-mono text-[0.62rem] text-msx-textsecondary">{p.numRows}</span>
                </button>
            ))}
        </div>
         <div className="mt-2 flex gap-1">
            <Button onClick={onAddPattern} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="flex-1 text-[0.65rem]">New</Button>
            <Button onClick={onDeleteCurrentPattern} size="sm" variant="danger" icon={<TrashIcon className="w-2.5 h-2.5"/>} className="flex-1 text-[0.65rem]" disabled={patterns.length <=1}>Del Current</Button>
         </div>
    </Panel>
  );
};
