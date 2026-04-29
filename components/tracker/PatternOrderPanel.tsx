
import React from 'react';
import { TrackerPattern } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CaretRightIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link PatternOrderPanel} component.
 * @category Tracker
 */
interface PatternOrderPanelProps {
  /** The list of pattern indices that defines the song's order. */
  order: number[];
  /** The list of all available patterns. */
  patterns: TrackerPattern[];
  /** The index of the currently active step in the order list. */
  currentPatternIndexInOrder: number;
  /** Callback function when a pattern in the order list is changed. */
  onOrderListChange: (orderIndex: number, newPatternArrayIndex: number) => void;
  /** Callback function to change the currently active step in the order list. */
  onCurrentPatternIndexInOrderChange: (newIndex: number) => void;
  /** Callback function to add a new step to the order list. */
  onAddPatternToOrder: () => void;
  /** Callback function to remove a step from the order list. */
  onRemovePatternFromOrder: (orderIndex: number) => void;
  /** The total length of the song in patterns. */
  lengthInPatterns: number;
  /** Callback function to change the song length. */
  onLengthInPatternsChange: (value: number | string) => void;
  /** The position in the order list where the song will loop back to. */
  restartPosition: number;
  /** Callback function to change the restart position. */
  onRestartPositionChange: (value: number | string) => void;
}

/**
 * A panel that displays and allows editing of the song's pattern order.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const PatternOrderPanel: React.FC<PatternOrderPanelProps> = ({
  order, patterns, currentPatternIndexInOrder,
  onOrderListChange, onCurrentPatternIndexInOrderChange,
  onAddPatternToOrder, onRemovePatternFromOrder,
  lengthInPatterns, onLengthInPatternsChange,
  restartPosition, onRestartPositionChange
}) => {
  return (
    <Panel title="Pattern Order" icon={<CaretRightIcon/>} bodyClassName="p-2">
        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
        {order.map((patternIndexInStorage, orderIdx) => (
            <div key={`order-${orderIdx}`} className={`flex items-center gap-1 rounded border px-1 py-0.5 ${orderIdx === currentPatternIndexInOrder ? 'border-msx-highlight/70 bg-msx-highlight/15' : 'border-msx-border/70 bg-msx-bgcolor/70 hover:border-msx-highlight/50'}`}>
                <span 
                    className={`w-7 cursor-pointer text-right font-mono hover:text-msx-highlight ${orderIdx === currentPatternIndexInOrder ? 'text-msx-highlight font-bold' : 'text-msx-textsecondary'}`}
                    onClick={() => onCurrentPatternIndexInOrderChange(orderIdx)}
                    title={`Go to order step ${orderIdx}`}
                >
                    {String(orderIdx).padStart(2, '0')}:
                </span>
                <select
                    value={patternIndexInStorage}
                    onChange={(e) => onOrderListChange(orderIdx, parseInt(e.target.value))}
                    className={`min-w-0 flex-grow rounded border border-msx-border bg-black/20 p-1 text-msx-textprimary outline-none focus:border-msx-highlight ${orderIdx === currentPatternIndexInOrder ? 'ring-1 ring-msx-highlight/80' : ''}`}
                    aria-label={`Pattern for order step ${orderIdx}`}
                >
                   {patterns.map((p, pArrIdx) => <option key={p.id} value={pArrIdx}>{String(pArrIdx).padStart(2,'0')} - {p.name}</option>)}
                </select>
                <Button onClick={() => onRemovePatternFromOrder(orderIdx)} size="sm" variant="danger" className="!p-0.5" icon={<TrashIcon className="w-2.5 h-2.5"/>} disabled={order.length <= 1} title={`Remove step ${orderIdx} from order`}>{null}</Button>
            </div>
        ))}
        </div>
        <Button onClick={onAddPatternToOrder} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-2 w-full text-[0.65rem]">Add to Order</Button>
         <div className="mt-2 grid grid-cols-2 gap-2 border-t border-msx-border/70 pt-2 text-xs">
            <div>
                <label htmlFor="songLengthPatterns" className="block text-msx-textsecondary text-[0.6rem] uppercase tracking-wider">Length</label>
                <input 
                    id="songLengthPatterns"
                    type="number" 
                    value={lengthInPatterns} 
                    min="1" 
                    max={order.length} 
                    onChange={e => onLengthInPatternsChange(e.target.value)} 
                    className="w-full rounded border border-msx-border bg-msx-bgcolor p-1 font-mono outline-none focus:border-msx-highlight"
                    title="Total number of patterns in the song's playback sequence."
                    aria-label="Song length in patterns"
                />
            </div>
            <div>
                <label htmlFor="loopStartPattern" className="block text-msx-textsecondary text-[0.6rem] uppercase tracking-wider">Loop</label>
                <input 
                    id="loopStartPattern"
                    type="number" 
                    value={restartPosition} 
                    min="0" 
                    max={order.length -1} 
                    onChange={e => onRestartPositionChange(e.target.value)} 
                    className="w-full rounded border border-msx-border bg-msx-bgcolor p-1 font-mono outline-none focus:border-msx-highlight"
                    title="Order index (0-based) where the song will loop back to after reaching 'Song Length'."
                    aria-label="Loop start position in pattern order"
                />
            </div>
        </div>
    </Panel>
  );
};
