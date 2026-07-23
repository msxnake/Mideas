import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../modals/Modal';
import { Button } from '../common/Button';
import { SCCInstrument } from '../../types';
import { SCCSynthesizer } from '../utils/sccSynthesizer';
import { SCC_INSTRUMENT_PRESET_GROUPS } from '../../utils/audio/sccInstrumentPresets';

// Waveform presets
const PRESETS = {
  "Sine": (i: number) => Math.round(127 * Math.sin(i * 2 * Math.PI / 32)),
  "Triangle": (i: number) => Math.round(127 * (2 * Math.abs(2 * (i / 32) - 1) - 1)),
  "Sawtooth": (i: number) => Math.round(127 * (2 * (i / 32) - 1)),
  "Square": (i: number) => i < 16 ? 127 : -128,
  "Pulse 25%": (i: number) => i < 8 ? 127 : -128,
  "Noise": () => Math.floor(Math.random() * 256) - 128
};

const WaveformGraphEditor = ({ waveform, onWaveformChange }: { waveform: number[], onWaveformChange: (newWaveform: number[]) => void }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Handle both mouse and touch events
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Map x to index 0-31
    const index = Math.max(0, Math.min(31, Math.floor((x / rect.width) * 32)));

    // Map y to value -128 to 127
    // Top (0) -> 127
    // Bottom (height) -> -128
    const relativeY = Math.max(0, Math.min(1, y / rect.height));
    // 0 -> 127, 1 -> -128. Range is 255.
    // value = 127 - (relativeY * 255)
    const value = Math.round(127 - (relativeY * 255));
    const clampedValue = Math.max(-128, Math.min(127, value));

    const newWaveform = [...waveform];
    newWaveform[index] = clampedValue;
    onWaveformChange(newWaveform);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    handleDraw(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      handleDraw(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-48 bg-msx-bgcolor-dark border border-msx-border cursor-crosshair select-none touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => { setIsDrawing(true); handleDraw(e); }}
      onTouchMove={handleDraw}
    // onTouchEnd handled by window listener
    >
      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-msx-textsecondary"></div>
        {[0, 4, 8, 12, 16, 20, 24, 28].map(i => (
          <div key={i} className="absolute top-0 bottom-0 w-px bg-msx-textsecondary" style={{ left: `${(i / 32) * 100}%` }}></div>
        ))}
      </div>

      {/* Bars */}
      <div className="absolute inset-0 flex items-end justify-between pointer-events-none px-px">
        {waveform.map((value, index) => (
          <div key={index} className="relative flex flex-col items-center w-full h-full mx-px group">
            <div
              className={`w-full transition-all duration-75 ${value >= 0 ? 'bg-msx-highlight' : 'bg-msx-accent'}`}
              style={{
                position: 'absolute',
                bottom: value >= 0 ? '50%' : undefined,
                top: value < 0 ? '50%' : undefined,
                height: `${(Math.abs(value) / 256) * 100}%`
              }}
            ></div>
            {/* Tooltip value on hover */}
            <div className="hidden group-hover:block absolute -top-6 bg-black text-white text-[10px] px-1 rounded z-10 whitespace-nowrap">
              {index}: {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


interface WaveformEditorModalProps {
  instrument: SCCInstrument | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (instrument: SCCInstrument) => void;
}

export const WaveformEditorModal: React.FC<WaveformEditorModalProps> = ({
  instrument,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [waveform, setWaveform] = useState<number[]>([]);
  const [volume, setVolume] = useState<number>(15);
  const [volumeEnvelope, setVolumeEnvelope] = useState('');
  const [volumeLoop, setVolumeLoop] = useState<number | ''>('');
  const [envelopeValues, setEnvelopeValues] = useState<number[]>([]);
  const [vibratoDepth, setVibratoDepth] = useState<number>(0);
  const [vibratoSpeed, setVibratoSpeed] = useState<number>(16);
  const [vibratoDelay, setVibratoDelay] = useState<number>(0);
  const [noiseMode, setNoiseMode] = useState<boolean>(false);
  const [morphEnabled, setMorphEnabled] = useState<boolean>(false);
  const [morphWaveform, setMorphWaveform] = useState<number[]>(Array(32).fill(0));
  const [morphSpeed, setMorphSpeed] = useState<number>(4);
  const synthRef = useRef<SCCSynthesizer | null>(null);

  const clampVibDepth = (value: number) => Math.max(0, Math.min(5, Math.round(value)));
  const clampVibSpeed = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const clampVibDelay = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const clampMorphSpeed = (value: number) => Math.max(1, Math.min(255, Math.round(value)));

  const clampWaveValue = (value: number) => Math.max(-128, Math.min(127, Math.round(value)));
  const clampBaseVolume = (value: number) => Math.max(0, Math.min(15, Math.round(value)));
  const clampEnvelopeValue = (value: number) => Math.max(0, Math.min(127, Math.round(value)));

  const parseVolumeEnvelopeString = (raw: string): number[] => {
    return raw.trim()
      .split(/\s+/)
      .map(v => parseInt(v, 10))
      .filter(n => !isNaN(n))
      .map(clampEnvelopeValue)
      .slice(0, 32);
  };

  useEffect(() => {
    if (instrument) {
      setName(instrument.name);
      // Ensure waveform is 32 bytes long
      const validWaveform = Array.isArray(instrument.waveform) ? instrument.waveform : [];
      const paddedWaveform = [...validWaveform, ...Array(32 - validWaveform.length).fill(0)].slice(0, 32);
      setWaveform(paddedWaveform);
      setVolume(clampBaseVolume(instrument.volume ?? 15));
      const envStr = instrument.volumeEnvelope ? instrument.volumeEnvelope.join(' ') : '';
      setVolumeEnvelope(envStr);
      setEnvelopeValues(instrument.volumeEnvelope ? instrument.volumeEnvelope.map(clampEnvelopeValue).slice(0, 32) : []);
      setVolumeLoop(instrument.volumeLoop !== undefined ? instrument.volumeLoop : '');
      setVibratoDepth(clampVibDepth(instrument.vibratoDepth ?? 0));
      setVibratoSpeed(clampVibSpeed(instrument.vibratoSpeed ?? 16));
      setVibratoDelay(clampVibDelay(instrument.vibratoDelay ?? 0));
      setNoiseMode(instrument.noiseMode === true);
      const morphValid = Array.isArray(instrument.morphToWaveform) && instrument.morphToWaveform.length > 0;
      setMorphEnabled(morphValid);
      setMorphWaveform(morphValid
        ? [...instrument.morphToWaveform!, ...Array(32).fill(0)].slice(0, 32).map(clampWaveValue)
        : Array(32).fill(0));
      setMorphSpeed(clampMorphSpeed(instrument.morphSpeed ?? 4));
    } else {
      // Default for new instrument
      setName('New Waveform');
      setWaveform(Array(32).fill(0));
      setVolume(15);
      setVolumeEnvelope('');
      setEnvelopeValues([]);
      setVolumeLoop('');
      setVibratoDepth(0);
      setVibratoSpeed(16);
      setVibratoDelay(0);
      setNoiseMode(false);
      setMorphEnabled(false);
      setMorphWaveform(Array(32).fill(0));
      setMorphSpeed(4);
    }
  }, [instrument]);

  useEffect(() => {
    return () => {
      synthRef.current?.stopAllNotes();
      synthRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      synthRef.current?.stopAllNotes();
    }
  }, [isOpen]);

  const waveformStats = useMemo(() => {
    const padded = [...waveform, ...Array(32 - waveform.length).fill(0)].slice(0, 32).map(clampWaveValue);
    const min = Math.min(...padded);
    const max = Math.max(...padded);
    const dcOffset = padded.reduce((acc, v) => acc + v, 0) / padded.length;
    const peak = Math.max(Math.abs(min), Math.abs(max));
    const rms = Math.sqrt(padded.reduce((acc, v) => acc + v * v, 0) / padded.length) / 127;
    return {
      min,
      max,
      dcOffset: Number(dcOffset.toFixed(2)),
      peak,
      rms: Number(rms.toFixed(3)),
      asString: padded.join(' ')
    };
  }, [waveform]);

  const handleCenterDc = () => {
    setWaveform(prev => {
      const offset = waveformStats.dcOffset || 0;
      return prev.map(v => clampWaveValue(v - offset));
    });
  };

  const handleNormalize = () => {
    const peak = waveformStats.peak || 0;
    if (peak <= 0) return;
    const factor = 127 / peak;
    setWaveform(prev => prev.map(v => clampWaveValue(v * factor)));
  };

  const handleFadeEdges = () => {
    const fade = 2;
    setWaveform(prev => prev.map((val, idx) => {
      if (idx < fade) {
        const scale = (idx + 1) / (fade + 1);
        return clampWaveValue(val * scale);
      }
      if (idx >= 32 - fade) {
        const scale = (32 - idx) / (fade + 1);
        return clampWaveValue(val * scale);
      }
      return clampWaveValue(val);
    }));
  };

  const getSanitizedInstrument = (): SCCInstrument => {
    const id = instrument ? instrument.id : Math.floor(Math.random() * 1000) + 100;
    const parsedLoop = volumeLoop === '' ? undefined : Number(volumeLoop);
    const sanitizedWave = Array(32).fill(0).map((_, idx) => clampWaveValue(waveform[idx] ?? 0));
    const sanitizedEnvelope = envelopeValues.length > 0 ? envelopeValues.map(clampEnvelopeValue) : undefined;

    return {
      id,
      name,
      waveform: sanitizedWave,
      volume: clampBaseVolume(volume),
      volumeEnvelope: sanitizedEnvelope,
      volumeLoop: parsedLoop,
      vibratoDepth: clampVibDepth(vibratoDepth),
      vibratoSpeed: clampVibSpeed(vibratoSpeed),
      vibratoDelay: clampVibDelay(vibratoDelay),
      noiseMode: noiseMode || undefined,
      morphToWaveform: morphEnabled
        ? Array(32).fill(0).map((_, idx) => clampWaveValue(morphWaveform[idx] ?? 0))
        : undefined,
      morphSpeed: morphEnabled ? clampMorphSpeed(morphSpeed) : undefined,
    };
  };

  const handleSave = () => {
    const payload = getSanitizedInstrument();
    onSave(payload);
    onClose();
  };

  const handlePreview = async () => {
    const payload = getSanitizedInstrument();
    const synth = synthRef.current ?? new SCCSynthesizer(0.3);
    synthRef.current = synth;
    await synth.previewInstrument(payload, 'C-4');
  };

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    const generator = PRESETS[presetName];
    const newWaveform = Array(32).fill(0).map((_, i) => generator(i));
    setWaveform(newWaveform);
  };

  /** Load a full curated instrument (waveform + envelope + vibrato + noise). */
  const applyInstrumentPreset = (preset: SCCInstrument) => {
    setName(preset.name);
    setWaveform([...preset.waveform]);
    setVolume(clampBaseVolume(preset.volume ?? 15));
    const env = preset.volumeEnvelope || [];
    setEnvelopeValues(env.map(clampEnvelopeValue));
    setVolumeEnvelope(env.join(' '));
    setVolumeLoop(preset.volumeLoop !== undefined && preset.volumeLoop !== 0xff ? preset.volumeLoop : '');
    setVibratoDepth(clampVibDepth(preset.vibratoDepth ?? 0));
    setVibratoSpeed(clampVibSpeed(preset.vibratoSpeed ?? 16));
    setVibratoDelay(clampVibDelay(preset.vibratoDelay ?? 0));
    setNoiseMode(preset.noiseMode === true);
    const presetMorph = Array.isArray(preset.morphToWaveform) && preset.morphToWaveform.length > 0;
    setMorphEnabled(presetMorph);
    setMorphWaveform(presetMorph
      ? [...preset.morphToWaveform!, ...Array(32).fill(0)].slice(0, 32)
      : Array(32).fill(0));
    setMorphSpeed(clampMorphSpeed(preset.morphSpeed ?? 4));
  };

  const handleEnvValueChange = (idx: number, newVal: number) => {
    setEnvelopeValues(prev => {
      const next = [...(prev.length ? prev : Array(16).fill(15))];
      next[idx] = clampEnvelopeValue(newVal);
      setVolumeEnvelope(next.join(' '));
      return next;
    });
  };

  const handleEnvBarClick = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const rel = 1 - (e.clientY - rect.top) / rect.height;
    const newVal = clampEnvelopeValue(Math.round(rel * 127));
    handleEnvValueChange(idx, newVal);
  };

  const handleAddEnvStep = () => {
    setEnvelopeValues(prev => {
      const next = [...prev, 15].slice(0, 32);
      setVolumeEnvelope(next.join(' '));
      return next;
    });
  };

  const handleClearEnv = () => {
    setEnvelopeValues([]);
    setVolumeEnvelope('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal title="SCC Waveform Editor" isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4 p-4 pr-3 w-[960px] max-w-[92vw] max-h-[82vh] overflow-y-auto">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-msx-textprimary mb-1">Instrument Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-msx-textprimary mb-1">ID</label>
            <input
              type="text"
              value={instrument?.id || "New"}
              disabled
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textsecondary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-msx-textprimary mb-1">Librería de instrumentos</label>
          <div className="space-y-1 mb-2">
            {SCC_INSTRUMENT_PRESET_GROUPS.map(group => (
              <div key={`grp-${group.name}`} className="flex items-start gap-2">
                <span className="text-[10px] text-msx-textsecondary w-16 pt-1 shrink-0 text-right">{group.name}</span>
                <div className="flex flex-wrap items-center gap-1">
                  {group.presets.map(preset => (
                    <button
                      key={`inst-${preset.name}`}
                      onClick={() => applyInstrumentPreset(preset)}
                      className="text-[10px] px-2 py-1 bg-msx-accent/20 border border-msx-accent rounded hover:bg-msx-accent hover:text-black transition-colors"
                      title="Carga waveform + envolvente + vibrato/ruido/morph del preset"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-msx-textsecondary mb-2">La percusión usa ruido real: la nota elige el color (Bombo grave, Tom media, Caja C-5, Hi-Hat/Platillo agudas). "Coro" usa morphing de waveform.</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-msx-textprimary">Waveform (32 bytes)</label>
            <div className="flex flex-wrap items-center gap-1">
              {Object.keys(PRESETS).map(preset => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset as keyof typeof PRESETS)}
                  className="text-[10px] px-2 py-1 bg-msx-bgcolor border border-msx-border rounded hover:bg-msx-highlight hover:text-black transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <WaveformGraphEditor waveform={waveform} onWaveformChange={setWaveform} />

          <div className="flex flex-wrap justify-between gap-2 mt-2 text-xs text-msx-textsecondary">
            <span>Click and drag to draw. Range: -128 to 127.</span>
            <span>Length: 32 samples</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <Button size="sm" variant="secondary" onClick={handleCenterDc}>Centrar DC</Button>
            <Button size="sm" variant="secondary" onClick={handleNormalize}>Normalizar a 127</Button>
            <Button size="sm" variant="secondary" onClick={handleFadeEdges}>Atenuar bordes</Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-msx-textprimary mb-1">Valores (pega lista)</label>
              <textarea
                className="w-full h-16 p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-[11px]"
                value={waveformStats.asString}
                onChange={(e) => {
                  const parts = e.target.value.split(/[\s,]+/).filter(Boolean).map(v => parseInt(v, 10));
                  const next = Array(32).fill(0).map((_, idx) => clampWaveValue(parts[idx] ?? 0));
                  setWaveform(next);
                }}
              />
              <p className="text-[10px] text-msx-textsecondary mt-1">Acepta espacios o comas. Solo primeros 32 valores.</p>
            </div>
            <div className="bg-msx-bgcolor border border-msx-border rounded p-2 flex flex-col justify-center space-y-1">
              <div className="flex justify-between"><span className="text-msx-textsecondary">DC offset</span><span className="font-mono">{waveformStats.dcOffset}</span></div>
              <div className="flex justify-between"><span className="text-msx-textsecondary">Pico</span><span className="font-mono">{waveformStats.peak}</span></div>
              <div className="flex justify-between"><span className="text-msx-textsecondary">Min/Max</span><span className="font-mono">{waveformStats.min} / {waveformStats.max}</span></div>
              <div className="flex justify-between"><span className="text-msx-textsecondary">RMS (norm.)</span><span className="font-mono">{waveformStats.rms}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-msx-textprimary mb-1">Volumen base (0-15)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={0}
                max={15}
                value={volume}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setVolume(Number.isNaN(val) ? 0 : val);
                }}
                className="flex-1"
              />
              <input
                type="number"
                min={0}
                max={15}
                value={volume}
                onChange={(e) => {
                  const val = parseInt(e.target.value || '0', 10);
                  setVolume(Number.isNaN(val) ? 0 : val);
                }}
                className="w-16 p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-sm"
              />
            </div>
            <p className="text-[10px] text-msx-textsecondary mt-1">Curva logaritmica SCC real.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-msx-textprimary mb-1">Volume Envelope (0-127)</label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-end space-x-1 h-24 bg-msx-bgcolor border border-msx-border rounded p-2 overflow-x-auto">
                {(envelopeValues.length ? envelopeValues : Array(16).fill(15)).map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center" style={{ minWidth: '38px' }}>
                    <div
                      className="w-full bg-msx-border relative cursor-crosshair rounded-sm overflow-hidden"
                      style={{ height: '100%' }}
                      onClick={(e) => handleEnvBarClick(idx, e)}
                      title={`Paso ${idx + 1}: ${val}`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-msx-highlight/80"
                        style={{ height: `${(clampEnvelopeValue(val) / 127) * 100}%` }}
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={127}
                      value={val}
                      onChange={(e) => handleEnvValueChange(idx, parseInt(e.target.value || '0', 10))}
                      className="w-12 mt-1 p-1 bg-msx-bgcolor border border-msx-border rounded text-center text-[10px]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-msx-textsecondary">
                <Button size="sm" variant="secondary" onClick={handleAddEnvStep}>Anadir paso</Button>
                <Button size="sm" variant="secondary" onClick={handleClearEnv}>Limpiar</Button>
                <span className="ml-auto">Click en barra para ajustar (0-127).</span>
              </div>
              <input
                type="text"
                placeholder="e.g. 15 12 8 4 0"
                value={volumeEnvelope}
                onChange={(e) => {
                  setVolumeEnvelope(e.target.value);
                  const parsed = parseVolumeEnvelopeString(e.target.value);
                  setEnvelopeValues(parsed);
                }}
                className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent text-sm"
              />
              <p className="text-[10px] text-msx-textsecondary">Puedes editar visualmente o pegar valores separados por espacios.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-msx-textprimary mb-1">Envelope Loop Point</label>
            <input
              type="number"
              placeholder="Index to loop to (optional)"
              value={volumeLoop}
              onChange={(e) => setVolumeLoop(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-msx-textprimary mb-1">Vibrato (LFO de tono por instrumento)</label>
          <div className="grid grid-cols-3 gap-4 bg-msx-bgcolor border border-msx-border rounded p-3">
            <div>
              <label className="block text-[11px] text-msx-textsecondary mb-1">Profundidad (0=off..5)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range" min={0} max={5} value={vibratoDepth}
                  onChange={(e) => setVibratoDepth(clampVibDepth(parseInt(e.target.value, 10)))}
                  className="flex-1"
                />
                <input
                  type="number" min={0} max={5} value={vibratoDepth}
                  onChange={(e) => setVibratoDepth(clampVibDepth(parseInt(e.target.value || '0', 10)))}
                  className="w-14 p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-msx-textsecondary mb-1">Velocidad (fase/frame)</label>
              <input
                type="number" min={0} max={255} value={vibratoSpeed}
                onChange={(e) => setVibratoSpeed(clampVibSpeed(parseInt(e.target.value || '0', 10)))}
                className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-msx-textsecondary mb-1">Retardo (frames)</label>
              <input
                type="number" min={0} max={255} value={vibratoDelay}
                onChange={(e) => setVibratoDelay(clampVibDelay(parseInt(e.target.value || '0', 10)))}
                className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-sm"
              />
            </div>
          </div>
          <p className="text-[10px] text-msx-textsecondary mt-1">Depth 0 desactiva el vibrato. Velocidad tipica 8-32; el retardo espera N frames tras cada nota.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-msx-bgcolor border border-msx-border rounded p-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-msx-textprimary">
              <input
                type="checkbox"
                checked={noiseMode}
                onChange={(e) => setNoiseMode(e.target.checked)}
              />
              <span>Ruido real (percusion/hi-hat)</span>
            </label>
            <p className="text-[10px] text-msx-textsecondary mt-1">
              El driver reescribe la waveform del canal con bytes aleatorios en
              cada frame (ruido blanco autentico). El periodo de la nota sigue
              controlando el color del ruido.
            </p>
          </div>
          <div className="bg-msx-bgcolor border border-msx-border rounded p-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-msx-textprimary">
              <input
                type="checkbox"
                checked={morphEnabled}
                onChange={(e) => setMorphEnabled(e.target.checked)}
              />
              <span>Morphing de waveform</span>
            </label>
            <p className="text-[10px] text-msx-textsecondary mt-1">
              En cada nota, el timbre evoluciona de la waveform base a la
              destino en 16 pasos (estilo TriloTracker).
            </p>
            {morphEnabled && (
              <div className="mt-2 flex items-center space-x-2 text-[11px]">
                <span className="text-msx-textsecondary">Frames por paso</span>
                <input
                  type="number" min={1} max={255} value={morphSpeed}
                  onChange={(e) => setMorphSpeed(clampMorphSpeed(parseInt(e.target.value || '1', 10)))}
                  className="w-16 p-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
                <span className="text-msx-textsecondary">(total = 16 x N frames)</span>
              </div>
            )}
          </div>
        </div>

        {morphEnabled && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-msx-textprimary">Waveform destino del morph</label>
              <div className="flex flex-wrap items-center gap-1">
                {Object.keys(PRESETS).map(preset => (
                  <button
                    key={`morph-${preset}`}
                    onClick={() => setMorphWaveform(Array(32).fill(0).map((_, i) => PRESETS[preset as keyof typeof PRESETS](i)))}
                    className="text-[10px] px-2 py-1 bg-msx-bgcolor border border-msx-border rounded hover:bg-msx-highlight hover:text-black transition-colors"
                  >
                    {preset}
                  </button>
                ))}
                <button
                  onClick={() => setMorphWaveform([...waveform])}
                  className="text-[10px] px-2 py-1 bg-msx-bgcolor border border-msx-border rounded hover:bg-msx-highlight hover:text-black transition-colors"
                >
                  Copiar base
                </button>
              </div>
            </div>
            <WaveformGraphEditor waveform={morphWaveform} onWaveformChange={setMorphWaveform} />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2 border-t border-msx-border">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handlePreview} variant="secondary">
            Play
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
