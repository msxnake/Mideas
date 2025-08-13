
import React from 'react';
import { TrackerPattern } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CaretRightIcon } from '../icons/MsxIcons';

interface PatternOrderPanelProps {
  order: number[];
  patterns: TrackerPattern[];
  currentPatternIndexInOrder: number;
  onOrderListChange: (orderIndex: number, newPatternArrayIndex: number) => void;
  onCurrentPatternIndexInOrderChange: (newIndex: number) => void;
  onAddPatternToOrder: () => void;
  onRemovePatternFromOrder: (orderIndex: number) => void;
  lengthInPatterns: number;
  onLengthInPatternsChange: (value: number | string) => void;
  restartPosition: number;
  onRestartPositionChange: (value: number | string) => void;
}

export const PatternOrderPanel: React.FC<PatternOrderPanelProps> = ({
  order, patterns, currentPatternIndexInOrder,
  onOrderListChange, onCurrentPatternIndexInOrderChange,
  onAddPatternToOrder, onRemovePatternFromOrder,
  lengthInPatterns, onLengthInPatternsChange,
  restartPosition, onRestartPositionChange
}) => {
  return (
    <Panel title="Pattern Order" icon={<CaretRightIcon/>}>
        <div className="max-h-28 overflow-y-auto space-y-0.5 pr-1 text-xs">
        {order.map((patternIndexInStorage, orderIdx) => (
            <div key={`order-${orderIdx}`} className="flex items-center space-x-1">
                <span 
                    className={`text-msx-textsecondary w-6 text-right cursor-pointer hover:text-msx-highlight ${orderIdx === currentPatternIndexInOrder ? 'text-msx-accent font-bold' : ''}`}
                    onClick={() => onCurrentPatternIndexInOrderChange(orderIdx)}
                    title={`Go to order step ${orderIdx}`}
                >
                    {String(orderIdx).padStart(2, '0')}:
                </span>
                <select
                    value={patternIndexInStorage}
                    onChange={(e) => onOrderListChange(orderIdx, parseInt(e.target.value))}
                    className={`p-0.5 flex-grow bg-msx-bgcolor border border-msx-border rounded ${orderIdx === currentPatternIndexInOrder ? 'ring-1 ring-msx-accent' : ''}`}
                    aria-label={`Pattern for order step ${orderIdx}`}
                >
                   {patterns.map((p, pArrIdx) => <option key={p.id} value={pArrIdx}>{String(pArrIdx).padStart(2,'0')} - {p.name}</option>)}
                </select>
                <Button onClick={() => onRemovePatternFromOrder(orderIdx)} size="sm" variant="danger" className="!p-0.5" icon={<TrashIcon className="w-2.5 h-2.5"/>} disabled={order.length <= 1} title={`Remove step ${orderIdx} from order`}>{null}</Button>
            </div>
        ))}
        </div>
        <Button onClick={onAddPatternToOrder} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-1.5 w-full text-[0.65rem]">Add to Order</Button>
         <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
            <div>
                <label htmlFor="songLengthPatterns" className="block text-msx-textsecondary text-[0.6rem]">Song Length:</label>
                <input 
                    id="songLengthPatterns"
                    type="number" 
                    value={lengthInPatterns} 
                    min="1" 
                    max={order.length} 
                    onChange={e => onLengthInPatternsChange(e.target.value)} 
                    className="p-0.5 bg-msx-bgcolor border border-msx-border rounded w-full"
                    title="Total number of patterns in the song's playback sequence."
                    aria-label="Song length in patterns"
                />
            </div>
            <div>
                <label htmlFor="loopStartPattern" className="block text-msx-textsecondary text-[0.6rem]">Loop Start:</label>
                <input 
                    id="loopStartPattern"
                    type="number" 
                    value={restartPosition} 
                    min="0" 
                    max={order.length -1} 
                    onChange={e => onRestartPositionChange(e.target.value)} 
                    className="p-0.5 bg-msx-bgcolor border border-msx-border rounded w-full"
                    title="Order index (0-based) where the song will loop back to after reaching 'Song Length'."
                    aria-label="Loop start position in pattern order"
                />
            </div>
        </div>
    </Panel>
  );
};
