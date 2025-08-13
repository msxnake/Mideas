
import React from 'react';
import { TrackerPattern } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CaretDownIcon } from '../icons/MsxIcons';

interface PatternsPanelProps {
  patterns: TrackerPattern[];
  activePatternId: string | null;
  onSetActivePatternId: (id: string) => void;
  onAddPattern: () => void;
  onDeleteCurrentPattern: () => void;
}

export const PatternsPanel: React.FC<PatternsPanelProps> = ({
  patterns, activePatternId, onSetActivePatternId, onAddPattern, onDeleteCurrentPattern
}) => {
  return (
    <Panel title="Patterns" icon={<CaretDownIcon/>}>
        <div className="max-h-24 overflow-y-auto space-y-0.5 pr-1 text-xs">
            {patterns.map((p, idx) => (
                <button
                    key={p.id}
                    onClick={() => onSetActivePatternId(p.id)}
                    className={`w-full text-left p-1 rounded text-xs truncate ${activePatternId === p.id ? 'bg-msx-accent text-white' : 'bg-msx-bgcolor hover:bg-msx-border'}`}
                >
                    {String(idx).padStart(2,'0')}: {p.name} ({p.numRows} rows)
                </button>
            ))}
        </div>
         <div className="flex space-x-1 mt-1.5">
            <Button onClick={onAddPattern} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="flex-1 text-[0.65rem]">New</Button>
            <Button onClick={onDeleteCurrentPattern} size="sm" variant="danger" icon={<TrashIcon className="w-2.5 h-2.5"/>} className="flex-1 text-[0.65rem]" disabled={patterns.length <=1}>Del Current</Button>
         </div>
    </Panel>
  );
};
