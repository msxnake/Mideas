
import React from 'react';
import { PT3Ornament } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, PencilIcon } from '../icons/MsxIcons';

interface OrnamentsPanelProps {
  ornaments: PT3Ornament[];
  activeOrnamentId: number | null; // New prop
  onSetActiveOrnamentId: (id: number | null) => void; // New prop
  onOpenOrnamentModal: (ornament: PT3Ornament | null) => void;
}

export const OrnamentsPanel: React.FC<OrnamentsPanelProps> = ({
  ornaments, activeOrnamentId, onSetActiveOrnamentId, onOpenOrnamentModal
}) => {
  return (
    <Panel title="Ornaments" icon={<PencilIcon/>}>
        <div className="max-h-20 overflow-y-auto space-y-0.5 pr-1 text-xs">
            {ornaments.map(orn => (
                <div 
                    key={orn.id} 
                    className={`p-0.5 rounded border text-[0.65rem] flex justify-between items-center cursor-pointer
                                 ${orn.id === activeOrnamentId
                                    ? 'bg-msx-accent text-white border-msx-accent'
                                    : 'bg-msx-bgcolor border-msx-border hover:bg-msx-border/70'}`}
                    onClick={() => onSetActiveOrnamentId(orn.id === activeOrnamentId ? null : orn.id)} // Toggle active ornament
                    onDoubleClick={() => onOpenOrnamentModal(orn)}
                    title={`Select: ${orn.name}. Double-click to edit.`}
                >
                    <span>{String(orn.id).padStart(2,'0')}: {orn.name}</span>
                    <Button onClick={(e) => { e.stopPropagation(); onOpenOrnamentModal(orn);}} size="sm" variant="ghost" className="!p-0">Edit</Button>
                </div>
            ))}
            {ornaments.length === 0 && <p className="text-msx-textsecondary italic text-center">No ornaments.</p>}
        </div>
        <Button onClick={() => onOpenOrnamentModal(null)} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-1 w-full text-[0.65rem]">Add New</Button>
    </Panel>
  );
};
