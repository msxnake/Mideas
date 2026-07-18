
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
  soundChip: 'PSG' | 'SCC' | 'PSG+SCC';
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

  const isPT3Instrument = (instr: PT3Instrument | SCCInstrument): instr is PT3Instrument => {
    if (instr.chip) return instr.chip === 'PSG';
    return !Array.isArray((instr as SCCInstrument).waveform);
  };

  const formatSubtitle = (instr: PT3Instrument | SCCInstrument) => {
    if (!isPT3Instrument(instr)) {
      const vol = (instr as SCCInstrument).volume ?? 15;
      const wave = (instr as SCCInstrument).waveform || [];
      const dc = wave.length ? (wave.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / Math.max(1, wave.length)) : 0;
      return `vol ${vol} | dc ${dc >= 0 ? '+' : ''}${dc.toFixed(1)}`;
    }
    const parts = [
      `Vol ${instr.volumeEnvelope?.length ?? 0}`,
      `Tone ${instr.toneEnvelope?.length ?? 0}`,
    ];
    if (instr.noiseEnvelope?.length || instr.ayNoiseEnabled) parts.push(`Noise ${instr.noiseEnvelope?.length ?? 0}`);
    if (typeof instr.ayEnvelopeShape === 'number') parts.push(`Env #${instr.ayEnvelopeShape.toString(16).toUpperCase()}`);
    return parts.join(' / ');
  };

  const getInstrumentFlags = (instr: PT3Instrument | SCCInstrument) => {
    if (!isPT3Instrument(instr)) return [];
    return [
      instr.ayToneEnabled === false ? null : 'Tone',
      instr.ayNoiseEnabled ? 'Noise' : null,
      instr.toneEnvelope?.some(value => value !== 0) ? 'Vib' : null,
      typeof instr.ayEnvelopeShape === 'number' ? 'Env' : null,
    ].filter(Boolean) as string[];
  };

  const handleAddNew = () => {
    if (soundChip === 'SCC') {
      onOpenWaveformModal(null);
    } else {
      onOpenInstrumentModal(null);
    }
  };

  const handleEdit = (instr: PT3Instrument | SCCInstrument) => {
    // Dual songs mix both instrument kinds: pick the editor per instrument.
    if (isPT3Instrument(instr)) {
      onOpenInstrumentModal(instr as PT3Instrument);
    } else {
      onOpenWaveformModal(instr as SCCInstrument);
    }
  };

  const isDual = soundChip === 'PSG+SCC';
  const panelTitle = isDual ? "Instruments (PSG+SCC)" : soundChip === 'SCC' ? "SCC Waves" : "PSG Instruments";
  const panelIcon = soundChip === 'SCC' ? <WaveformIcon /> : <PencilIcon />;

  return (
    <Panel title={panelTitle} icon={panelIcon} bodyClassName="p-2">
         <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
             {instruments.map(instr => (
                <div key={instr.id}
                     className={`p-1 rounded border text-[0.65rem] cursor-pointer
                                 ${instr.id === activeInstrumentId
                                    ? 'bg-msx-accent/90 text-white border-msx-accent shadow-[inset_3px_0_0_rgba(255,255,255,0.45)]'
                                    : 'bg-msx-bgcolor border-msx-border hover:border-msx-highlight/70 hover:bg-msx-border/50'}`}
                     onClick={() => onSetActiveInstrumentId(instr.id)}
                     onDoubleClick={() => handleEdit(instr)}
                     title={`Select: ${instr.name}. Double-click to edit.`}
                >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-mono text-msx-highlight bg-black/25 px-1 rounded">{String(instr.id).padStart(2, '0')}</span>
                          {isDual && (
                            <span className={`px-1 rounded border text-[0.55rem] font-bold ${isPT3Instrument(instr) ? 'border-msx-border text-msx-textsecondary' : 'border-msx-highlight/60 text-msx-highlight'}`}>
                              {isPT3Instrument(instr) ? 'PSG' : 'SCC'}
                            </span>
                          )}
                          <span className="truncate">{instr.name}</span>
                          {instr.id === activeInstrumentId && (
                            <span className="rounded border border-white/40 px-1 text-[0.55rem] uppercase tracking-wider text-white/85">Active</span>
                          )}
                        </div>
                        <div className={`mt-0.5 font-mono ${instr.id === activeInstrumentId ? 'text-white/80' : 'text-msx-textsecondary'}`}>
                          {formatSubtitle(instr)}
                        </div>
                        {getInstrumentFlags(instr).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getInstrumentFlags(instr).map(flag => (
                              <span key={flag} className="px-1 border border-msx-border/70 rounded bg-black/20 text-[0.58rem] leading-3">
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button onClick={(e) => { e.stopPropagation(); handleEdit(instr);}} size="sm" variant="ghost" className="!px-1 !py-0">Edit</Button>
                    </div>
                </div>
             ))}
             {instruments.length === 0 && <p className="text-msx-textsecondary italic text-center">No instruments.</p>}
         </div>
         {isDual ? (
           <div className="mt-1 flex gap-1">
             <Button onClick={() => onOpenInstrumentModal(null)} size="sm" variant="secondary" icon={<PencilIcon/>} className="w-1/2 text-[0.65rem]" title="Add a PSG (AY) instrument">Add PSG</Button>
             <Button onClick={() => onOpenWaveformModal(null)} size="sm" variant="secondary" icon={<WaveformIcon/>} className="w-1/2 text-[0.65rem]" title="Add an SCC wavetable instrument">Add SCC</Button>
           </div>
         ) : (
           <Button onClick={handleAddNew} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="mt-1 w-full text-[0.65rem]">Add New</Button>
         )}
    </Panel>
  );
};
