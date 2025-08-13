
import React from 'react';
import { PT3Instrument } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, PencilIcon } from '../icons/MsxIcons';

interface InstrumentsPanelProps {
  instruments: PT3Instrument[];
  activeInstrumentId: number | null;
  onSetActiveInstrumentId: (id: number | null) => void;
  onOpenInstrumentModal: (instrument: PT3Instrument | null) => void;
}

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
