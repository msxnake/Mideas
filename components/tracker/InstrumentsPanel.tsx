
import React from 'react';
import { PT3Instrument, SCCInstrument } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, PencilIcon, WaveformIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link InstrumentsPanel} component.
 * @category Tracker
 */
interface InstrumentsPanelProps {
  /** The list of instruments in the song. */
  instruments: (PT3Instrument | SCCInstrument)[];
  /** The sound chip being used. */
  soundChip: 'PSG' | 'SCC';
  /** The ID of the currently active instrument. */
  activeInstrumentId: number | null;
  /** Callback function to set the active instrument. */
  onSetActiveInstrumentId: (id: number | null) => void;
  /** Callback function to open the PT3 instrument editor modal. */
  onOpenInstrumentModal: (instrument: PT3Instrument | null) => void;
  /** Callback function to open the SCC waveform editor modal. */
  onOpenWaveformModal: (instrument: SCCInstrument | null) => void;
}

/**
 * A panel that displays the list of instruments in a tracker song.
 * It adapts its behavior based on the selected sound chip (PSG or SCC).
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const InstrumentsPanel: React.FC<InstrumentsPanelProps> = ({
  instruments,
  soundChip,
  activeInstrumentId,
  onSetActiveInstrumentId,
  onOpenInstrumentModal,
  onOpenWaveformModal
}) => {

  const formatSubtitle = (instr: PT3Instrument | SCCInstrument) => {
    if (soundChip === 'SCC') {
      const vol = (instr as SCCInstrument).volume ?? 15;
      const wave = (instr as SCCInstrument).waveform || [];
      const dc = wave.length ? (wave.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / Math.max(1, wave.length)) : 0;
      return `vol ${vol} | dc ${dc >= 0 ? '+' : ''}${dc.toFixed(1)}`;
    }
    return '';
  };

  const handleAddNew = () => {
    if (soundChip === 'SCC') {
      onOpenWaveformModal(null);
    } else {
      onOpenInstrumentModal(null);
    }
  };

  const handleEdit = (instr: PT3Instrument | SCCInstrument) => {
    if (soundChip === 'SCC') {
      onOpenWaveformModal(instr as SCCInstrument);
    } else {
      onOpenInstrumentModal(instr as PT3Instrument);
    }
  };

  const panelTitle = soundChip === 'SCC' ? "SCC Waves" : "PSG Instruments";
  const panelIcon = soundChip === 'SCC' ? <WaveformIcon /> : <PencilIcon />;

  return (
    <Panel title={panelTitle} icon={panelIcon}>
         <div className="max-h-20 overflow-y-auto space-y-0.5 pr-1 text-xs">
             {instruments.map(instr => (
                <div key={instr.id}
                     className={`p-0.5 rounded border text-[0.65rem] flex justify-between items-center cursor-pointer
                                 ${instr.id === activeInstrumentId
                                    ? 'bg-msx-accent text-white border-msx-accent'
                                    : 'bg-msx-bgcolor border-msx-border hover:bg-msx-border/70'}`}
                     onClick={() => onSetActiveInstrumentId(instr.id)}
                     onDoubleClick={() => handleEdit(instr)}
                     title={`Select: ${instr.name}. Double-click to edit.`}
                >
                    <span>
                      {String(instr.id).padStart(2, '0')}: {instr.name}
                      {soundChip === 'SCC' && <span className="text-msx-textsecondary ml-1">({formatSubtitle(instr)})</span>}
                    </span>
                    <Button onClick={(e) => { e.stopPropagation(); handleEdit(instr);}} size="sm" variant="ghost" className="!p-0">Edit</Button>
                </div>
             ))}
             {instruments.length === 0 && <p className="text-msx-textsecondary italic text-center">No instruments.</p>}
         </div>
         <Button onClick={handleAddNew} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-1 w-full text-[0.65rem]">Add New</Button>
    </Panel>
  );
};
