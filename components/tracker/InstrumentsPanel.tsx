
import React from 'react';
import { PT3Instrument } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, PencilIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link InstrumentsPanel} component.
 * @category Tracker
 */
interface InstrumentsPanelProps {
  /** The list of instruments in the song. */
  instruments: PT3Instrument[];
  /** The ID of the currently active instrument. */
  activeInstrumentId: number | null;
  /** Callback function to set the active instrument. */
  onSetActiveInstrumentId: (id: number | null) => void;
  /** Callback function to open the instrument editor modal. */
  onOpenInstrumentModal: (instrument: PT3Instrument | null) => void;
}

/**
 * A panel that displays the list of instruments in a tracker song.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const InstrumentsPanel: React.FC<InstrumentsPanelProps> = ({
  instruments, activeInstrumentId, onSetActiveInstrumentId, onOpenInstrumentModal
}) => {
  return (
    <Panel title="Instruments" icon={<PencilIcon/>}>
         <div className="max-h-20 overflow-y-auto space-y-0.5 pr-1 text-xs">
             {instruments.map(instr => (
                <div key={instr.id}
                     className={`p-0.5 rounded border text-[0.65rem] flex justify-between items-center cursor-pointer
                                 ${instr.id === activeInstrumentId
                                    ? 'bg-msx-accent text-white border-msx-accent'
                                    : 'bg-msx-bgcolor border-msx-border hover:bg-msx-border/70'}`}
                     onClick={() => onSetActiveInstrumentId(instr.id)}
                     onDoubleClick={() => onOpenInstrumentModal(instr)}
                     title={`Select: ${instr.name}. Double-click to edit.`}
                >
                    <span>{String(instr.id).padStart(2, '0')}: {instr.name}</span>
                    <Button onClick={(e) => { e.stopPropagation(); onOpenInstrumentModal(instr);}} size="sm" variant="ghost" className="!p-0">Edit</Button>
                </div>
             ))}
             {instruments.length === 0 && <p className="text-msx-textsecondary italic text-center">No instruments.</p>}
         </div>
         <Button onClick={() => onOpenInstrumentModal(null)} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-1 w-full text-[0.65rem]">Add New</Button>
    </Panel>
  );
};
