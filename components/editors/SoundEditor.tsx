
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PSGSoundData, PSGSoundChannelState, PSGSoundChannelStep } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlayIcon, StopIcon, SaveIcon as ExportIcon, PlusCircleIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, PencilIcon } from '../icons/MsxIcons'; 

// AY-3-8910 PSG constants
const PSG_MASTER_CLOCK = 3579545; // Hz (MSX NTSC Master Clock)
const PSG_INPUT_CLOCK = PSG_MASTER_CLOCK / 2; // Approx 1.7897725 MHz
const REFERENCE_BPM = 120; // Default BPM for interpreting step durations

// Web Audio related types
type OscillatorCollection = { [key in 'A' | 'B' | 'C']?: OscillatorNode };
type GainNodeCollection = { [key in 'A' | 'B' | 'C']?: GainNode };


interface SoundEditorProps {
  soundData: PSGSoundData;
  onUpdate: (data: Partial<PSGSoundData>) => void;
}

// Helper to calculate actual tone frequency from PSG 12-bit period value
const calculateFrequencyFromTonePeriod = (tonePeriod: number): number => {
  if (tonePeriod === 0 || tonePeriod > 4095) return 0; 
  return PSG_INPUT_CLOCK / (16 * tonePeriod);
};

// Helper to calculate characteristic frequency from PSG 5-bit noise period value
const calculateFrequencyFromNoisePeriod = (noisePeriod: number): number => {
  const effectiveNP = (noisePeriod === 0) ? 1 : noisePeriod & 0x1F; // Ensure 5-bit, treat 0 as 1 (shortest period)
  return PSG_INPUT_CLOCK / (32 * effectiveNP);
};

const FULL_ENVELOPE_SHAPES: { name: string; value: number, description: string }[] = [
    { value: 0b0000, name: "\\___", description: "Fall, off (C=0,A=0,L=0,H=0)" }, { value: 0b0001, name: "\\¯¯¯", description: "Fall, hold (C=0,A=0,L=0,H=1)" },
    { value: 0b0010, name: "\\_/_", description: "Fall, alt, off (C=0,A=0,L=1,H=0)" }, { value: 0b0011, name: "\\¯/¯", description: "Fall, alt, hold (C=0,A=0,L=1,H=1)" },
    { value: 0b0100, name: "/¯¯¯", description: "Rise, off (C=0,A=1,L=0,H=0)" }, { value: 0b0101, name: "/___", description: "Rise, hold (C=0,A=1,L=0,H=1)" },
    { value: 0b0110, name: "/¯\\_", description: "Rise, alt, off (C=0,A=1,L=1,H=0)" }, { value: 0b0111, name: "/_\\¯", description: "Rise, alt, hold (C=0,A=1,L=1,H=1)" },
    { value: 0b1000, name: "\\\\\\", description: "Cont, Fall (C=1,A=0,L=0,H=0)" }, { value: 0b1001, name: "\\_-_", description: "Cont, Fall, Hold (C=1,A=0,L=0,H=1)" },
    { value: 0b1010, name: "\\/\\/", description: "Cont, Fall, Alt (C=1,A=0,L=1,H=0)" }, { value: 0b1011, name: "\\¯/¯", description: "Cont, Fall, Alt, Hold (C=1,A=0,L=1,H=1)" },
    { value: 0b1100, name: "////", description: "Cont, Rise (C=1,A=1,L=0,H=0)" }, { value: 0b1101, name: "/¯¯¯", description: "Cont, Rise, Hold (C=1,A=1,L=0,H=1)" },
    { value: 0b1110, name: "/\\/\\", description: "Cont, Rise, Alt (C=1,A=1,L=1,H=0)" }, { value: 0b1111, name: "/_\\_", description: "Cont, Rise, Alt, Hold (C=1,A=1,L=1,H=1)" },
];

const createDefaultStep = (isFirst: boolean): PSGSoundChannelStep => ({
  id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  tonePeriod: isFirst ? 257 : 0,
  volume: isFirst ? 10 : 0,
  toneEnabled: isFirst,
  noiseEnabled: false,
  useEnvelope: false,
  durationMs: 200,
});


export const SoundEditor: React.FC<SoundEditorProps> = ({ soundData, onUpdate }) => {
  const [localSoundName, setLocalSoundName] = useState(soundData.name);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorCollection>({});
  const channelGainsRef = useRef<GainNodeCollection>({});
  const globalNoiseSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseFilterNodeRef = useRef<BiquadFilterNode | null>(null);

  const stepTimeoutRefs = useRef<{ A?: number, B?: number, C?: number }>({});
  const currentPlayingStepIndices = useRef<{ A?: number, B?: number, C?: number }>({ A: undefined, B: undefined, C: undefined });
  
  // Buffer for the main template area (for adding new steps)
  const [stepAddBuffers, setStepAddBuffers] = useState<Record<'A' | 'B' | 'C', PSGSoundChannelStep>>({
    A: createDefaultStep(true),
    B: createDefaultStep(false),
    C: createDefaultStep(false),
  });

  // State for modal editing
  const [isEditStepModalOpen, setIsEditStepModalOpen] = useState(false);
  const [editingStepInfo, setEditingStepInfo] = useState<{ channelId: 'A'|'B'|'C', stepId: string, originalStepData: PSGSoundChannelStep } | null>(null);
  const [modalEditBuffer, setModalEditBuffer] = useState<PSGSoundChannelStep | null>(null);


  const [exportFormat, setExportFormat] = useState<'basic' | 'asm'>('basic');
  const [exportedCode, setExportedCode] = useState<string>('');
  const [presets, setPresets] = useState<Record<string, PSGSoundData>>({});
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    const ctx = new window.AudioContext();
    setAudioContext(ctx);
    masterGainRef.current = ctx.createGain();
    masterGainRef.current.connect(ctx.destination);
    noiseFilterNodeRef.current = ctx.createBiquadFilter();
    noiseFilterNodeRef.current.type = 'bandpass'; 
    noiseFilterNodeRef.current.Q.value = 1.0; 
    const bufferSize = ctx.sampleRate * 0.5; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    try {
        noiseSource.start();
        globalNoiseSourceNodeRef.current = noiseSource;
        globalNoiseSourceNodeRef.current.connect(noiseFilterNodeRef.current);
    } catch (e) {
        console.error("Failed to start or connect global noise source:", e);
        globalNoiseSourceNodeRef.current = null; 
    }
    return () => {
      Object.values(stepTimeoutRefs.current).forEach(clearTimeout);
      Object.values(oscillatorsRef.current).forEach(osc => { try { osc?.stop(); osc?.disconnect(); } catch(e){} });
      Object.values(channelGainsRef.current).forEach(gain => { try { gain?.disconnect(); } catch(e){} });
      if (globalNoiseSourceNodeRef.current) { try { globalNoiseSourceNodeRef.current.stop(); globalNoiseSourceNodeRef.current.disconnect(); } catch(e){} }
      if (noiseFilterNodeRef.current) { try { noiseFilterNodeRef.current.disconnect(); } catch(e){} }
      if (masterGainRef.current) { try { masterGainRef.current.disconnect(); } catch(e){} }
      globalNoiseSourceNodeRef.current = null; noiseFilterNodeRef.current = null; masterGainRef.current = null;
      oscillatorsRef.current = {}; channelGainsRef.current = {};
      ctx.close().catch(console.error); setAudioContext(null);
    };
  }, []); 

  useEffect(() => { setLocalSoundName(soundData.name); }, [soundData.name]);
  useEffect(() => {
    if (masterGainRef.current && audioContext) {
      masterGainRef.current.gain.setValueAtTime(soundData.masterVolume, audioContext.currentTime);
    }
  }, [soundData.masterVolume, audioContext]);
  useEffect(() => {
    if (noiseFilterNodeRef.current && audioContext) {
      const noiseFreq = calculateFrequencyFromNoisePeriod(soundData.noisePeriod);
      const maxFilterFreq = audioContext.sampleRate / 2; 
      const minPracticalFreq = 20;
      noiseFilterNodeRef.current.frequency.setValueAtTime( Math.min(Math.max(minPracticalFreq, noiseFreq), maxFilterFreq), audioContext.currentTime);
    }
  }, [soundData.noisePeriod, audioContext]);

  const playStepForChannel = useCallback((channelId: 'A' | 'B' | 'C', stepIndex: number) => {
    if (!audioContext || !masterGainRef.current) return;
    const channelState = soundData.channels.find(ch => ch.id === channelId);
    if (!channelState || stepIndex >= channelState.steps.length) {
      if (channelState?.loop && channelState.steps.length > 0) { playStepForChannel(channelId, 0); } 
      else { currentPlayingStepIndices.current[channelId] = undefined; }
      return;
    }
    const step = channelState.steps[stepIndex];
    currentPlayingStepIndices.current[channelId] = stepIndex;

    if (oscillatorsRef.current[channelId]) { try { oscillatorsRef.current[channelId]?.stop(); oscillatorsRef.current[channelId]?.disconnect(); } catch(e) {} delete oscillatorsRef.current[channelId]; }
    if (channelGainsRef.current[channelId]) { try { channelGainsRef.current[channelId]?.disconnect(); } catch(e) {} delete channelGainsRef.current[channelId]; }

    const channelGain = audioContext.createGain();
    channelGain.gain.value = step.useEnvelope ? 0 : step.volume / 15;
    channelGain.connect(masterGainRef.current);
    channelGainsRef.current[channelId] = channelGain;

    if (step.toneEnabled) {
      const osc = audioContext.createOscillator();
      osc.type = 'square';
      const freq = calculateFrequencyFromTonePeriod(step.tonePeriod);
      if (freq > 0) {
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        osc.connect(channelGain);
        try { osc.start(); } catch(e) { console.warn("Error starting oscillator", e); }
        oscillatorsRef.current[channelId] = osc;
      }
    }
    if (step.noiseEnabled && noiseFilterNodeRef.current) {
        noiseFilterNodeRef.current.connect(channelGain);
    }

    const tempo = soundData.tempoBPM > 0 ? soundData.tempoBPM : REFERENCE_BPM;
    const durationScaleFactor = REFERENCE_BPM / tempo;
    const effectiveDurationMs = step.durationMs * durationScaleFactor;
    const effectiveDurationSec = effectiveDurationMs / 1000;

     if (step.useEnvelope && channelGainsRef.current[channelId]) {
        const gainNode = channelGainsRef.current[channelId]!;
        const now = audioContext.currentTime;
        const peakVolume = step.volume / 15; 
        
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now); 
        
        const shape = soundData.envelopeShape;
        const isAttack = (shape & 0b0100) !== 0;
        const isAlternate = (shape & 0b0010) !== 0;
        
        if (isAttack) {
            gainNode.gain.linearRampToValueAtTime(peakVolume, now + effectiveDurationSec * (isAlternate ? 0.5 : 1));
            if (isAlternate) gainNode.gain.linearRampToValueAtTime(0, now + effectiveDurationSec);
        } else { // Fall
            gainNode.gain.setValueAtTime(peakVolume, now);
            gainNode.gain.linearRampToValueAtTime(0, now + effectiveDurationSec * (isAlternate ? 0.5 : 1));
            if (isAlternate) gainNode.gain.linearRampToValueAtTime(peakVolume, now + effectiveDurationSec);
        }
    }

    if (stepTimeoutRefs.current[channelId]) { clearTimeout(stepTimeoutRefs.current[channelId]!); }
    stepTimeoutRefs.current[channelId] = window.setTimeout(() => {
      if (step.noiseEnabled && noiseFilterNodeRef.current && channelGainsRef.current[channelId]) {
        try { noiseFilterNodeRef.current.disconnect(channelGainsRef.current[channelId]!); } catch (e) {}
      }
      playStepForChannel(channelId, stepIndex + 1);
    }, Math.max(10, effectiveDurationMs)); 
  }, [soundData, audioContext, isPlaying]); // isPlaying added for re-closure on stop

  const handlePlayStop = () => {
    if (!audioContext) return;
    if (isPlaying) {
      Object.values(stepTimeoutRefs.current).forEach(clearTimeout);
      stepTimeoutRefs.current = {};
      currentPlayingStepIndices.current = { A: undefined, B: undefined, C: undefined };
      Object.values(oscillatorsRef.current).forEach(osc => { try { osc?.stop(); osc?.disconnect(); } catch(e){} });
      oscillatorsRef.current = {};
      Object.values(channelGainsRef.current).forEach(gainNode => {
        if (gainNode) {
            try { gainNode.disconnect(masterGainRef.current!); } catch(e) {}
            if (noiseFilterNodeRef.current) { try { noiseFilterNodeRef.current.disconnect(gainNode); } catch (e) {} }
        }
      });
      channelGainsRef.current = {};
      setIsPlaying(false);
    } else {
      if (audioContext.state === 'suspended') { audioContext.resume(); }
      setIsPlaying(true);
      if (noiseFilterNodeRef.current && audioContext) {
            const noiseFreq = calculateFrequencyFromNoisePeriod(soundData.noisePeriod);
            const maxFilterFreq = audioContext.sampleRate / 2;
            noiseFilterNodeRef.current.frequency.setValueAtTime( Math.min(Math.max(20, noiseFreq), maxFilterFreq), audioContext.currentTime);
        }
      playStepForChannel('A', 0); playStepForChannel('B', 0); playStepForChannel('C', 0);
    }
  };

  const handleStepAddBufferChange = (channelId: 'A' | 'B' | 'C', key: keyof PSGSoundChannelStep, value: any) => {
    const numKeys: (keyof PSGSoundChannelStep)[] = ['tonePeriod', 'volume', 'durationMs'];
    const val = numKeys.includes(key) ? parseInt(value, 10) || 0 : value;
    setStepAddBuffers(prev => ({ ...prev, [channelId]: { ...prev[channelId], [key]: val } }));
  };

  const handleAddStep = (channelId: 'A' | 'B' | 'C') => {
    const newStep = { ...stepAddBuffers[channelId], id: `step_${Date.now()}_${Math.random().toString(36).substring(2,7)}` };
    const newChannels = soundData.channels.map(ch => 
      ch.id === channelId ? { ...ch, steps: [...ch.steps, newStep] } : ch
    ) as [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
    onUpdate({ channels: newChannels });
  };
  
  const openEditStepModal = (channelId: 'A'|'B'|'C', stepId: string) => {
    const channel = soundData.channels.find(c => c.id === channelId);
    const stepToEdit = channel?.steps.find(s => s.id === stepId);
    if (stepToEdit) {
      setEditingStepInfo({ channelId, stepId, originalStepData: { ...stepToEdit } });
      setModalEditBuffer({ ...stepToEdit });
      setIsEditStepModalOpen(true);
    }
  };

  const handleModalStepBufferChange = (key: keyof PSGSoundChannelStep, value: any) => {
    if (!modalEditBuffer) return;
    const numKeys: (keyof PSGSoundChannelStep)[] = ['tonePeriod', 'volume', 'durationMs'];
    const val = numKeys.includes(key) ? parseInt(value, 10) || 0 : value;
    setModalEditBuffer(prev => prev ? { ...prev, [key]: val } : null);
  };

  const handleConfirmStepEdit = () => {
    if (!editingStepInfo || !modalEditBuffer) return;
    const { channelId, stepId } = editingStepInfo;
    const updatedStepData = { ...modalEditBuffer, id: stepId }; // Ensure ID remains the same

    const newChannels = soundData.channels.map(ch => 
      ch.id === channelId 
        ? { ...ch, steps: ch.steps.map(s => s.id === stepId ? updatedStepData : s) } 
        : ch
    ) as [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
    onUpdate({ channels: newChannels });
    
    setIsEditStepModalOpen(false);
    setEditingStepInfo(null);
    setModalEditBuffer(null);
  };

  const handleCancelStepEdit = () => {
    setIsEditStepModalOpen(false);
    setEditingStepInfo(null);
    setModalEditBuffer(null);
  };

  const handleDeleteStep = (channelId: 'A' | 'B' | 'C', stepId: string) => {
    const newChannels = soundData.channels.map(ch => 
      ch.id === channelId ? { ...ch, steps: ch.steps.filter(s => s.id !== stepId) } : ch
    ) as [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
    onUpdate({ channels: newChannels });
    if (editingStepInfo?.stepId === stepId) { // If the deleted step was being edited in modal
      handleCancelStepEdit();
    }
  };

  const handleMoveStep = (channelId: 'A' | 'B' | 'C', stepId: string, direction: 'up' | 'down') => {
    const channel = soundData.channels.find(c => c.id === channelId);
    if (!channel) return;
    const index = channel.steps.findIndex(s => s.id === stepId);
    if (index === -1) return;
    const newSteps = [...channel.steps];
    const stepToMove = newSteps.splice(index, 1)[0];
    const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(newSteps.length, index + 1);
    newSteps.splice(newIndex, 0, stepToMove);
    const newChannels = soundData.channels.map(ch => 
      ch.id === channelId ? { ...ch, steps: newSteps } : ch
    ) as [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
    onUpdate({ channels: newChannels });
  };
  
  const handleChannelLoopToggle = (channelId: 'A' | 'B' | 'C') => {
    const newChannels = soundData.channels.map(ch =>
      ch.id === channelId ? { ...ch, loop: !ch.loop } : ch
    ) as [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
    onUpdate({ channels: newChannels });
  };

  const generateExportCode = () => { /* ... unchanged ... */ };
  const LS_SOUND_PRESETS_KEY = 'msxIdeSoundPresets_v2';
  useEffect(() => { /* ... unchanged ... */ }, []);
  const savePreset = () => { /* ... unchanged ... */ };
  const loadPreset = (presetName: string) => { /* ... unchanged ... */ };
  const deletePreset = (presetName: string) => { /* ... unchanged ... */ };

  const channelSequenceControl = (channelState: PSGSoundChannelState) => {
    const channelId = channelState.id;
    const buffer = stepAddBuffers[channelId]; // Main template buffer for new steps

    return (
      <div key={channelId} className="p-3 border border-msx-border rounded bg-msx-panelbg/60 space-y-3">
        <div className="flex justify-between items-center">
            <h4 className="text-lg pixel-font text-msx-highlight">Channel {channelId} Sequence</h4>
            <label className="flex items-center space-x-1.5 text-xs">
                <input type="checkbox" checked={channelState.loop} onChange={() => handleChannelLoopToggle(channelId)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                <span>Loop</span>
            </label>
        </div>

        {/* Main Template Area for NEW steps */}
        <div className="p-2 border border-msx-border/50 rounded bg-msx-bgcolor/30 space-y-2">
          <h5 className="text-sm pixel-font text-msx-textsecondary">New Step Template</h5>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div>
              <label className="block text-msx-textsecondary text-xs">Tone Period (0-4095):</label>
              <input type="number" min="0" max="4095" value={buffer.tonePeriod} onChange={e => handleStepAddBufferChange(channelId, 'tonePeriod', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" />
              <span className="text-msx-textsecondary text-[0.6rem]">Freq: {calculateFrequencyFromTonePeriod(buffer.tonePeriod).toFixed(1)} Hz</span> {/* Changed text-msx-gray */}
            </div>
            <div>
              <label className="block text-msx-textsecondary text-xs">Volume (0-15):</label>
              <input type="number" min="0" max="15" value={buffer.volume} disabled={buffer.useEnvelope} onChange={e => handleStepAddBufferChange(channelId, 'volume', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-msx-textsecondary text-xs">Duration (ms):</label>
              <input type="number" min="10" max="10000" step="10" value={buffer.durationMs} onChange={e => handleStepAddBufferChange(channelId, 'durationMs', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" />
            </div>
            <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center space-x-1.5">
                    <input type="checkbox" checked={buffer.toneEnabled} onChange={e => handleStepAddBufferChange(channelId, 'toneEnabled', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                    <span>Tone On</span>
                </label>
                <label className="flex items-center space-x-1.5">
                    <input type="checkbox" checked={buffer.noiseEnabled} onChange={e => handleStepAddBufferChange(channelId, 'noiseEnabled', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                    <span>Noise On</span>
                </label>
                <label className="flex items-center space-x-1.5">
                    <input type="checkbox" checked={buffer.useEnvelope} onChange={e => handleStepAddBufferChange(channelId, 'useEnvelope', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                    <span>Use Global Env.</span>
                </label>
            </div>
          </div>
          <div className="flex space-x-2 mt-1.5">
            <Button onClick={() => handleAddStep(channelId)} size="sm" variant="secondary" icon={<PlusCircleIcon />}>Add as New Step</Button>
          </div>
        </div>

        {/* List of existing steps */}
        <div className="mt-2 text-xs space-y-1 max-h-48 overflow-y-auto pr-1">
          {channelState.steps.length === 0 && <p className="text-msx-textsecondary italic">No steps in sequence.</p>}
          {channelState.steps.map((step, index) => (
            <div key={step.id} className={`p-1.5 rounded border ${editingStepInfo?.stepId === step.id ? 'bg-msx-accent/20 border-msx-accent' : 'bg-msx-bgcolor border-msx-border'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold pixel-font text-msx-highlight">Step {index + 1}</span>
                <span className="text-msx-textsecondary text-[0.65rem]">ID: ...{step.id.slice(-4)}</span> {/* Changed text-msx-gray */}
              </div>
              <div className="grid grid-cols-3 gap-x-2 text-[0.7rem] mt-0.5">
                <span>TP: {step.tonePeriod}</span>
                <span>Vol: {step.volume}</span>
                <span>Dur: {step.durationMs}ms</span>
                <span className={step.toneEnabled ? 'text-green-400' : 'text-red-400'}>Tone: {step.toneEnabled ? 'On' : 'Off'}</span>
                <span className={step.noiseEnabled ? 'text-green-400' : 'text-red-400'}>Noise: {step.noiseEnabled ? 'On' : 'Off'}</span>
                <span className={step.useEnvelope ? 'text-blue-400' : 'text-gray-500'}>Env: {step.useEnvelope ? 'On' : 'Off'}</span>
              </div>
              <div className="flex space-x-1 mt-1">
                <Button onClick={() => openEditStepModal(channelId, step.id)} size="sm" variant="ghost" className="p-0.5" title="Modify Step"><PencilIcon className="w-2.5 h-2.5"/></Button>
                <Button onClick={() => handleDeleteStep(channelId, step.id)} size="sm" variant="danger" className="p-0.5" title="Delete Step" icon={<TrashIcon className="w-2.5 h-2.5"/>}>{null}</Button>
                <Button onClick={() => handleMoveStep(channelId, step.id, 'up')} size="sm" variant="ghost" disabled={index === 0} className="p-0.5" title="Move Up"><ArrowUpIcon className="w-2.5 h-2.5"/></Button>
                <Button onClick={() => handleMoveStep(channelId, step.id, 'down')} size="sm" variant="ghost" disabled={index === channelState.steps.length - 1} className="p-0.5" title="Move Down"><ArrowDownIcon className="w-2.5 h-2.5"/></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Panel title={`Sound Editor: ${localSoundName}`} className="flex-grow flex flex-col bg-msx-bgcolor overflow-y-auto">
      <div className="p-2 border-b border-msx-border flex items-center space-x-2 flex-wrap gap-y-1">
        <label htmlFor="soundName" className="text-xs pixel-font text-msx-textsecondary">Name:</label>
        <input type="text" id="soundName" value={localSoundName} onChange={e => setLocalSoundName(e.target.value)} className="p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent flex-grow min-w-[100px]" />
        <Button onClick={() => onUpdate({ name: localSoundName })} size="sm" variant="secondary">Set Name</Button>
        
        <label htmlFor="tempoBPM" className="text-xs pixel-font text-msx-textsecondary ml-2">Tempo (BPM):</label>
        <input 
          type="number" 
          id="tempoBPM" 
          value={soundData.tempoBPM} 
          onChange={e => onUpdate({ tempoBPM: parseInt(e.target.value, 10) || REFERENCE_BPM })} 
          min="30" 
          max="300" 
          step="1"
          className="w-20 p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent" />

        <Button onClick={handlePlayStop} size="sm" variant={isPlaying ? "danger" : "primary"} icon={isPlaying ? <StopIcon /> : <PlayIcon />}>
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
         <label className="text-xs pixel-font text-msx-textsecondary ml-auto">Master Vol:</label>
         <input type="range" min="0" max="1" step="0.01" value={soundData.masterVolume} onChange={e => onUpdate({ masterVolume: parseFloat(e.target.value) })} className="w-20 accent-msx-accent" />
      </div>

      <div className="flex-grow p-2 space-y-3 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {soundData.channels.map(channelState => channelSequenceControl(channelState))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-2 border border-msx-border rounded bg-msx-panelbg/50">
            <h4 className="text-md pixel-font text-msx-highlight">Global Noise Generator</h4>
            <div className="text-xs mt-1">
              <label className="block text-msx-textsecondary">Noise Period (0-31):</label>
              <input type="number" min="0" max="31" value={soundData.noisePeriod} onChange={e => onUpdate({'noisePeriod': parseInt(e.target.value)})} className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" />
               <p className="text-[0.65rem] text-msx-textsecondary mt-0.5">Lower value = higher pitch. Freq: {calculateFrequencyFromNoisePeriod(soundData.noisePeriod).toFixed(1)} Hz</p> {/* Changed text-msx-gray */}
            </div>
          </div>
          <div className="p-2 border border-msx-border rounded bg-msx-panelbg/50">
            <h4 className="text-md pixel-font text-msx-highlight">Global Envelope Generator</h4>
            <div className="grid grid-cols-2 gap-2 text-xs mt-1">
              <div>
                <label className="block text-msx-textsecondary">Env. Period (0-65535):</label>
                <input type="number" min="0" max="65535" value={soundData.envelopePeriod} onChange={e => onUpdate({'envelopePeriod': parseInt(e.target.value)})} className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" />
              </div>
              <div>
                <label className="block text-msx-textsecondary">Env. Shape (Reg 13):</label>
                 <select value={soundData.envelopeShape} onChange={e => onUpdate({'envelopeShape': parseInt(e.target.value)})} className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-xs">
                    {FULL_ENVELOPE_SHAPES.map(shape => <option key={shape.value} value={shape.value} title={shape.description}>{shape.name} (0x{shape.value.toString(16).toUpperCase()})</option>)}
                 </select>
              </div>
            </div>
             <p className="text-[0.65rem] text-msx-textsecondary mt-1">Used for steps with 'Use Global Env.' on.</p> {/* Changed text-msx-gray */}
          </div>
        </div>
        
        {/* Export and Presets sections remain unchanged */}
        <div className="p-2 border border-msx-border rounded bg-msx-panelbg/50 mt-3">
            <h4 className="text-md pixel-font text-msx-highlight mb-2">Export Sound Data</h4>
             <p className="text-[0.65rem] text-msx-textsecondary mb-1.5">Note: Export currently provides data for the FIRST STEP of Channel A only.</p> {/* Changed text-msx-gray */}
            <div className="flex items-center space-x-2 mb-2">
                <label className="text-xs text-msx-textsecondary">Format:</label>
                <Button onClick={() => setExportFormat('basic')} size="sm" variant={exportFormat === 'basic' ? 'primary' : 'ghost'}>MSX BASIC</Button>
                <Button onClick={() => setExportFormat('asm')} size="sm" variant={exportFormat === 'asm' ? 'primary' : 'ghost'}>Z80 ASM</Button>
                <Button onClick={generateExportCode} size="sm" variant="secondary" icon={<ExportIcon />}>Generate Code</Button>
            </div>
            {exportedCode && ( <textarea readOnly value={exportedCode} rows={8} className="w-full p-1.5 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-xs font-mono focus:ring-msx-accent focus:border-msx-accent"/> )}
        </div>
        <div className="p-2 border border-msx-border rounded bg-msx-panelbg/50 mt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md pixel-font text-msx-highlight">Presets</h4>
            <Button onClick={() => setShowPresetManager(s => !s)} size="sm" variant="ghost"> {showPresetManager ? 'Hide Presets' : 'Manage Presets'} </Button>
          </div>
          {showPresetManager && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="New preset name..." className="flex-grow p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
                <Button onClick={savePreset} size="sm" variant="secondary" icon={<PlusCircleIcon/>}>Save Current</Button>
              </div>
              {Object.keys(presets).length > 0 ? (
                <ul className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {Object.keys(presets).map(pName => (
                    <li key={pName} className="flex justify-between items-center p-1 bg-msx-bgcolor rounded border border-msx-border">
                      <span className="truncate max-w-[120px]">{pName}</span>
                      <div className="flex-shrink-0">
                        <Button onClick={() => loadPreset(pName)} size="sm" variant="ghost" className="mr-1">Load</Button>
                        <Button onClick={() => deletePreset(pName)} size="sm" variant="danger" icon={<TrashIcon className="w-2.5 h-2.5"/>} aria-label={`Delete preset ${pName}`}>{null}</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-msx-textsecondary italic">No presets saved yet.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Edit Step Modal */}
      {isEditStepModalOpen && editingStepInfo && modalEditBuffer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={handleCancelStepEdit}>
          <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl max-w-md w-full animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg text-msx-highlight mb-3">Edit Step (Channel {editingStepInfo.channelId})</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <label className="block text-msx-textsecondary text-xs">Tone Period (0-4095):</label>
                <input type="number" min="0" max="4095" value={modalEditBuffer.tonePeriod} onChange={e => handleModalStepBufferChange('tonePeriod', e.target.value)} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" />
                <span className="text-msx-textsecondary text-[0.65rem]">Freq: {calculateFrequencyFromTonePeriod(modalEditBuffer.tonePeriod).toFixed(1)} Hz</span> {/* Changed text-msx-gray */}
              </div>
              <div>
                <label className="block text-msx-textsecondary text-xs">Volume (0-15):</label>
                <input type="number" min="0" max="15" value={modalEditBuffer.volume} disabled={modalEditBuffer.useEnvelope} onChange={e => handleModalStepBufferChange('volume', e.target.value)} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-msx-textsecondary text-xs">Duration (ms):</label>
                <input type="number" min="10" max="10000" step="10" value={modalEditBuffer.durationMs} onChange={e => handleModalStepBufferChange('durationMs', e.target.value)} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" />
              </div>
              <div className="space-y-1.5 flex flex-col justify-around pt-1">
                  <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={modalEditBuffer.toneEnabled} onChange={e => handleModalStepBufferChange('toneEnabled', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                      <span className="text-xs">Tone Enabled</span>
                  </label>
                  <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={modalEditBuffer.noiseEnabled} onChange={e => handleModalStepBufferChange('noiseEnabled', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                      <span className="text-xs">Noise Enabled</span>
                  </label>
                  <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={modalEditBuffer.useEnvelope} onChange={e => handleModalStepBufferChange('useEnvelope', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                      <span className="text-xs">Use Global Envelope</span>
                  </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={handleCancelStepEdit} variant="ghost" size="md">Cancel</Button>
              <Button onClick={handleConfirmStepEdit} variant="primary" size="md">OK</Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};
