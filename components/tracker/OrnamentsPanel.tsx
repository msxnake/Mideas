
import React from 'react';
import { PT3Ornament } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, PencilIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link OrnamentsPanel} component.
 * @category Tracker
 */
interface OrnamentsPanelProps {
  /** The list of ornaments in the song. */
  ornaments: PT3Ornament[];
  /** The ID of the currently active ornament. */
  activeOrnamentId: number | null;
  /** Callback function to set the active ornament. */
  onSetActiveOrnamentId: (id: number | null) => void;
  /** Callback function to open the ornament editor modal. */
  onOpenOrnamentModal: (ornament: PT3Ornament | null) => void;
}

/**
 * A panel that displays the list of ornaments in a tracker song.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const OrnamentsPanel: React.FC<OrnamentsPanelProps> = ({
  ornaments, activeOrnamentId, onSetActiveOrnamentId, onOpenOrnamentModal
}) => {
  return (
    <Panel title="Ornaments" icon={<PencilIcon/>} bodyClassName="p-2">
        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
            {ornaments.map(orn => (
                <div 
                    key={orn.id} 
                    className={`p-1 rounded border text-[0.65rem] cursor-pointer
                                 ${orn.id === activeOrnamentId
                                    ? 'bg-msx-accent/90 text-white border-msx-accent shadow-[inset_3px_0_0_rgba(255,255,255,0.45)]'
                                    : 'bg-msx-bgcolor border-msx-border hover:border-msx-highlight/70 hover:bg-msx-border/50'}`}
                    onClick={() => onSetActiveOrnamentId(orn.id === activeOrnamentId ? null : orn.id)} // Toggle active ornament
                    onDoubleClick={() => onOpenOrnamentModal(orn)}
                    title={`Select: ${orn.name}. Double-click to edit.`}
                >
                    <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="font-mono text-msx-highlight bg-black/25 px-1 rounded">{String(orn.id).padStart(2,'0')}</span>
                                <span className="truncate">{orn.name}</span>
                            </div>
                            <div className={`mt-0.5 font-mono ${orn.id === activeOrnamentId ? 'text-white/80' : 'text-msx-textsecondary'}`}>
                                {orn.data.length} steps{orn.loopPosition !== undefined && orn.loopPosition !== 255 ? ` | loop ${orn.loopPosition}` : ''}
                            </div>
                        </div>
                        <Button onClick={(e) => { e.stopPropagation(); onOpenOrnamentModal(orn);}} size="sm" variant="ghost" className="!px-1 !py-0">Edit</Button>
                    </div>
                </div>
            ))}
            {ornaments.length === 0 && <p className="text-msx-textsecondary italic text-center">No ornaments.</p>}
        </div>
        <Button onClick={() => onOpenOrnamentModal(null)} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-1 w-full text-[0.65rem]">Add New</Button>
    </Panel>
  );
};
