import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../modals/Modal';
import { Button } from '../common/Button';
import { SCCInstrument } from '../../types';

// Waveform presets
const PRESETS = {
  "Sine": (i: number) => Math.round(7 * Math.sin(i * 2 * Math.PI / 32)),
  "Triangle": (i: number) => Math.round(7 * (2 * Math.abs(2 * (i / 32) - 1) - 1)),
  "Sawtooth": (i: number) => Math.round(7 * (2 * (i / 32) - 1)),
  "Square": (i: number) => i < 16 ? 7 : -8,
  "Pulse 25%": (i: number) => i < 8 ? 7 : -8,
  "Noise": () => Math.floor(Math.random() * 16) - 8
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

    // Map y to value -8 to 7
    // Top (0) -> 7
    // Bottom (height) -> -8
    const relativeY = Math.max(0, Math.min(1, y / rect.height));
    // 0 -> 7, 1 -> -8. Range is 15.
    // value = 7 - (relativeY * 15)
    const value = Math.round(7 - (relativeY * 15));
    const clampedValue = Math.max(-8, Math.min(7, value));

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
                height: `${(Math.abs(value) / 16) * 100}%`
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
  const [volumeEnvelope, setVolumeEnvelope] = useState('');
  const [volumeLoop, setVolumeLoop] = useState<number | ''>('');

  useEffect(() => {
    if (instrument) {
      setName(instrument.name);
      // Ensure waveform is 32 bytes long
      const validWaveform = Array.isArray(instrument.waveform) ? instrument.waveform : [];
      const paddedWaveform = [...validWaveform, ...Array(32 - validWaveform.length).fill(0)].slice(0, 32);
      setWaveform(paddedWaveform);
      setVolumeEnvelope(instrument.volumeEnvelope ? instrument.volumeEnvelope.join(' ') : '');
      setVolumeLoop(instrument.volumeLoop !== undefined ? instrument.volumeLoop : '');
    } else {
      // Default for new instrument
      setName('New Waveform');
      setWaveform(Array(32).fill(0));
      setVolumeEnvelope('');
      setVolumeLoop('');
    }
  }, [instrument]);

  const handleSave = () => {
    // If creating new, generate a random ID (in real app, parent should handle ID generation)
    const id = instrument ? instrument.id : Math.floor(Math.random() * 1000) + 100;

    const parsedEnvelope = volumeEnvelope.trim().split(/\s+/).map(v => parseInt(v, 10)).filter(n => !isNaN(n));
    const parsedLoop = volumeLoop === '' ? undefined : Number(volumeLoop);

    onSave({
      id,
      name,
      waveform,
      volume: instrument?.volume ?? 15,
      volumeEnvelope: parsedEnvelope.length > 0 ? parsedEnvelope : undefined,
      volumeLoop: parsedLoop
    });
    onClose();
  };

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    const generator = PRESETS[presetName];
    const newWaveform = Array(32).fill(0).map((_, i) => generator(i));
    setWaveform(newWaveform);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal title="SCC Waveform Editor" isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4 p-4 w-[600px] max-w-full">
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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-msx-textprimary">Waveform (32 bytes)</label>
            <div className="space-x-1">
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

          <div className="flex justify-between mt-1 text-xs text-msx-textsecondary">
            <span>Click and drag to draw. Range: -8 to 7.</span>
            <span>Length: 32 samples</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-msx-textprimary mb-1">Volume Envelope (0-15)</label>
            <input
              type="text"
              placeholder="e.g. 15 12 8 4 0"
              value={volumeEnvelope}
              onChange={(e) => setVolumeEnvelope(e.target.value)}
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent text-sm"
            />
            <p className="text-[10px] text-msx-textsecondary mt-1">Space-separated values.</p>
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

        <div className="flex justify-end space-x-2 pt-2 border-t border-msx-border">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
