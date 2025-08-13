
import React from 'react';
import { PT3Instrument } from '../../types';
import { Button } from '../common/Button';
import { PT3_MAX_INSTRUMENTS, PT3_DEFAULT_VIBRATO_TABLE } from '../../constants';

// This mirrors the InstrumentModalBuffer type definition from TrackerComposer
interface InstrumentModalBuffer extends Omit<Partial<PT3Instrument>, 'volumeEnvelope' | 'toneEnvelope'> {
    volumeEnvelope?: string;
    toneEnvelope?: string;
}

interface InstrumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInstrument: PT3Instrument | null;
  instrumentModalBuffer: InstrumentModalBuffer;
  onInstrumentModalBufferChange: (field: keyof InstrumentModalBuffer, value: any) => void;
  onSubmit: () => void;
}

type PredefinedInstrumentType = "Custom" | "Piano" | "Soft Piano" | "Banjo" | "Violin" | "Synth Lead" | "Bass" | "Random";

const PREDEFINED_INSTRUMENTS: Record<PredefinedInstrumentType, Partial<InstrumentModalBuffer>> = {
    "Custom": {}, // Placeholder for manual editing
    "Piano": {
        volumeEnvelope: "127,90,60,0",
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: 0, // Changed from 8 to 0 (Fall, Off - more piano-like decay)
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Soft Piano": {
        volumeEnvelope: "0,60,100,127,100,60,0",
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: 0, // Fall, off (or use 1 for hold)
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Banjo": {
        volumeEnvelope: "127,30,0",
        toneEnvelope: "0,5,0,-5", // Quick arpeggio
        toneLoop: 0,
        ayEnvelopeShape: 8, // Fall, continue (could also be 0 for single pluck)
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Violin": {
        volumeEnvelope: "0,60,100,127,120,110",
        volumeLoop: 2, // Loop at sustain part
        toneEnvelope: PT3_DEFAULT_VIBRATO_TABLE.slice(0,16).join(','), // Vibrato
        toneLoop: 0,
        ayEnvelopeShape: 13, // Cont, Rise, Hold (or software env controls)
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Synth Lead": {
        volumeEnvelope: "127,100,80,60,80,100,127",
        volumeLoop: 0,
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: 8, // \\\\ (Continuous Fall)
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Bass": {
        volumeEnvelope: "127,60,30,0",
        toneEnvelope: "0,0,0,-3", // Slight detune down
        ayEnvelopeShape: 8, // \\\\ (Continuous Fall, or 0 for pluck)
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Random": {} // Handled by a special function
};


const generateRandomInstrumentData = (): Partial<InstrumentModalBuffer> => {
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = (probabilityTrue = 0.5) => Math.random() < probabilityTrue;

    // Volume Envelope
    const volEnvLen = randomInt(3, 10);
    const volEnv: number[] = [];
    for (let i = 0; i < volEnvLen; i++) {
        volEnv.push(i === 0 ? randomInt(64, 127) : randomInt(-30, 100 - (i * 10)));
    }
    const volLoop = randomBool(0.3) && volEnvLen > 1 ? randomInt(0, volEnvLen - 1) : undefined;

    // Tone Envelope
    const toneEnvLen = randomInt(0, 8); // Often no tone envelope
    const toneEnv: number[] = [];
    for (let i = 0; i < toneEnvLen; i++) {
        toneEnv.push(randomInt(-12, 12));
    }
    const toneLoop = randomBool(0.2) && toneEnvLen > 1 ? randomInt(0, toneEnvLen - 1) : undefined;

    return {
        volumeEnvelope: volEnv.join(','),
        volumeLoop: volLoop,
        toneEnvelope: toneEnv.join(','),
        toneLoop: toneLoop,
        ayEnvelopeShape: randomInt(0, 15),
        ayToneEnabled: randomBool(0.9), // Usually true
        ayNoiseEnabled: randomBool(0.2),
    };
};


export const InstrumentEditorModal: React.FC<InstrumentEditorModalProps> = ({
  isOpen,
  onClose,
  editingInstrument,
  instrumentModalBuffer,
  onInstrumentModalBufferChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  const handleFieldChange = (field: keyof InstrumentModalBuffer, value: string | number | boolean | undefined) => {
    onInstrumentModalBufferChange(field, value);
  };
  
  const handleNumberFieldChange = (field: keyof InstrumentModalBuffer, value: string) => {
    const num = parseInt(value, 10);
    onInstrumentModalBufferChange(field, isNaN(num) ? undefined : num);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as PredefinedInstrumentType;
    let presetData: Partial<InstrumentModalBuffer>;

    if (selectedType === "Random") {
        presetData = generateRandomInstrumentData();
    } else {
        presetData = PREDEFINED_INSTRUMENTS[selectedType] || {};
    }

    // Apply preset data, keeping ID and Name if they were already set (e.g. for a new instrument)
    Object.keys(presetData).forEach(key => {
        const fieldKey = key as keyof InstrumentModalBuffer;
        onInstrumentModalBufferChange(fieldKey, presetData[fieldKey]);
    });
  };


  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="instrumentModalTitle"
    >
        <div 
            className="bg-msx-panelbg p-4 rounded-lg shadow-xl max-w-lg w-full animate-slideIn pixel-font" 
            onClick={e => e.stopPropagation()}
        >
            <h3 id="instrumentModalTitle" className="text-lg text-msx-highlight mb-3">
                {editingInstrument ? `Edit Instrument ${editingInstrument.id}` : `Add Instrument ${instrumentModalBuffer.id || ''}`}
            </h3>
            
            {!editingInstrument && (
                 <div className="mb-3 text-xs">
                    <label htmlFor="instrumentPreset" className="block text-msx-textsecondary mb-0.5">Load Template:</label>
                    <select
                        id="instrumentPreset"
                        onChange={handlePresetChange}
                        defaultValue="Custom"
                        className="w-full p-1.5 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                    >
                        {(Object.keys(PREDEFINED_INSTRUMENTS) as PredefinedInstrumentType[]).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="space-y-2 text-xs max-h-[60vh] overflow-y-auto pr-1">
                <div>
                    ID: 
                    <input 
                        type="number" 
                        value={instrumentModalBuffer.id || ""} 
                        onChange={e => handleNumberFieldChange('id', e.target.value)} 
                        min="1" 
                        max={PT3_MAX_INSTRUMENTS} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-16 ml-1"
                        disabled={!!editingInstrument} // Disable ID editing for existing instruments
                    />
                </div>
                <div>
                    Name: 
                    <input 
                        type="text" 
                        value={instrumentModalBuffer.name || ""} 
                        onChange={e => handleFieldChange('name', e.target.value)} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full"
                    />
                </div>
                <div>
                    Vol Env (csv): 
                    <input 
                        type="text" 
                        value={instrumentModalBuffer.volumeEnvelope || ""} 
                        onChange={e => handleFieldChange('volumeEnvelope', e.target.value)} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full" 
                        placeholder="e.g. 0,1,-2,0"
                    />
                </div>
                <div>
                    Tone Env (csv): 
                    <input 
                        type="text" 
                        value={instrumentModalBuffer.toneEnvelope || ""} 
                        onChange={e => handleFieldChange('toneEnvelope', e.target.value)} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full" 
                        placeholder="e.g. 0,12,0,-12"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        Vol Loop (0-31, 255=off): 
                        <input 
                            type="number" 
                            value={instrumentModalBuffer.volumeLoop ?? ""} 
                            onChange={e => handleNumberFieldChange('volumeLoop', e.target.value)} 
                            min="0" max="255" 
                            className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full"
                        />
                    </div>
                    <div>
                        Tone Loop (0-31, 255=off): 
                        <input 
                            type="number" 
                            value={instrumentModalBuffer.toneLoop ?? ""} 
                            onChange={e => handleNumberFieldChange('toneLoop', e.target.value)} 
                            min="0" max="255" 
                            className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full"
                        />
                    </div>
                    <div>
                        AY Env Shape (0-15): 
                        <input 
                            type="number" 
                            value={instrumentModalBuffer.ayEnvelopeShape ?? ""} 
                            onChange={e => handleNumberFieldChange('ayEnvelopeShape', e.target.value)} 
                            min="0" max="15" 
                            className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full"
                        />
                    </div>
                    <div className="flex items-center space-x-4 pt-2">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={instrumentModalBuffer.ayToneEnabled === undefined ? true : instrumentModalBuffer.ayToneEnabled} 
                                onChange={e => handleFieldChange('ayToneEnabled', e.target.checked)}
                                className="form-checkbox mr-1 bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                            /> Tone
                        </label>
                        <label>
                            <input 
                                type="checkbox" 
                                checked={!!instrumentModalBuffer.ayNoiseEnabled} 
                                onChange={e => handleFieldChange('ayNoiseEnabled', e.target.checked)}
                                className="form-checkbox mr-1 bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                            /> Noise
                        </label>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={onClose} variant="ghost">Cancel</Button>
                <Button onClick={onSubmit} variant="primary">Save</Button>
            </div>
        </div>
    </div>
  );
};
