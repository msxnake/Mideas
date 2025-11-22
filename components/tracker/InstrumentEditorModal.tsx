
import React, { useState, useCallback, useMemo } from 'react';
import { PT3Instrument } from '../../types';
import { Button } from '../common/Button';
import { PT3_MAX_INSTRUMENTS, PT3_DEFAULT_VIBRATO_TABLE } from '../../constants';
import { EnvelopeEditor } from './EnvelopeEditor';
import { AYEnvelopeVisualizer } from './AYEnvelopeVisualizer';

/**
 * A buffer type for the instrument editor modal. It mirrors the PT3Instrument type
 * but keeps envelope data as strings for easier editing in text inputs.
 * @internal
 */
interface InstrumentModalBuffer extends Omit<Partial<PT3Instrument>, 'volumeEnvelope' | 'toneEnvelope'> {
    /** The volume envelope as a comma-separated string. */
    volumeEnvelope?: string;
    /** The tone envelope as a comma-separated string. */
    toneEnvelope?: string;
}

/**
 * Props for the {@link InstrumentEditorModal} component.
 * @category Tracker
 */
interface InstrumentEditorModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** The instrument being edited, or null if creating a new one. */
    editingInstrument: PT3Instrument | null;
    /** The buffer holding the current state of the instrument being edited. */
    instrumentModalBuffer: InstrumentModalBuffer;
    /** Callback to update the instrument buffer. */
    onInstrumentModalBufferChange: (field: keyof InstrumentModalBuffer, value: any) => void;
    /** Callback to submit the changes. */
    onSubmit: () => void;
    /** Optional synthesizer for audio preview. */
    synthesizer?: any;
}

/**
 * The types of predefined instruments available as templates.
 * @internal
 */
type PredefinedInstrumentType = "Custom" | "Piano" | "Soft Piano" | "Banjo" | "Violin" | "Synth Lead" | "Bass" | "Random";

/**
 * A record of predefined instrument templates.
 * @constant
 */
const PREDEFINED_INSTRUMENTS: Record<PredefinedInstrumentType, Partial<InstrumentModalBuffer>> = {
    "Custom": {},
    "Piano": {
        volumeEnvelope: "127,90,60,0",
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Soft Piano": {
        volumeEnvelope: "0,60,100,127,100,60,0",
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Banjo": {
        volumeEnvelope: "127,30,0",
        toneEnvelope: "0,5,0,-5",
        toneLoop: 0,
        ayEnvelopeShape: 8,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Violin": {
        volumeEnvelope: "0,60,100,127,120,110",
        volumeLoop: 2,
        toneEnvelope: PT3_DEFAULT_VIBRATO_TABLE.slice(0, 16).join(','),
        toneLoop: 0,
        ayEnvelopeShape: 13,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Synth Lead": {
        volumeEnvelope: "127,100,80,60,80,100,127",
        volumeLoop: 0,
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: 8,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Bass": {
        volumeEnvelope: "127,60,30,0",
        toneEnvelope: "0,0,0,-3",
        ayEnvelopeShape: 8,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Random": {}
};

/**
 * Generates a set of random properties for a PT3 instrument.
 * @returns A partial instrument buffer with randomized values.
 * @internal
 */
const generateRandomInstrumentData = (): Partial<InstrumentModalBuffer> => {
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = (probabilityTrue = 0.5) => Math.random() < probabilityTrue;

    const volEnvLen = randomInt(3, 10);
    const volEnv: number[] = [];
    for (let i = 0; i < volEnvLen; i++) {
        volEnv.push(i === 0 ? randomInt(64, 127) : randomInt(-30, 100 - (i * 10)));
    }
    const volLoop = randomBool(0.3) && volEnvLen > 1 ? randomInt(0, volEnvLen - 1) : undefined;

    const toneEnvLen = randomInt(0, 8);
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
        ayToneEnabled: randomBool(0.9),
        ayNoiseEnabled: randomBool(0.2),
    };
};

/**
 * Parse CSV envelope string to number array.
 * @internal
 */
const parseEnvelope = (csv: string | undefined): number[] => {
    if (!csv || csv.trim() === '') return [];
    return csv.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
};

/**
 * A modal dialog for editing a PT3 instrument's properties with visual editors.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const InstrumentEditorModal: React.FC<InstrumentEditorModalProps> = ({
    isOpen,
    onClose,
    editingInstrument,
    instrumentModalBuffer,
    onInstrumentModalBufferChange,
    onSubmit,
    synthesizer
}) => {
    // All hooks must be called before any conditional returns
    const [activeTab, setActiveTab] = useState<'basic' | 'volume' | 'tone' | 'hardware'>('basic');
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewNote, setPreviewNote] = useState('C-4');

    // Parse envelopes for visual editors
    const volumeEnvelopeArray = useMemo(() => parseEnvelope(instrumentModalBuffer.volumeEnvelope), [instrumentModalBuffer.volumeEnvelope]);
    const toneEnvelopeArray = useMemo(() => parseEnvelope(instrumentModalBuffer.toneEnvelope), [instrumentModalBuffer.toneEnvelope]);

    // Handle field changes
    const handleFieldChange = useCallback((field: keyof InstrumentModalBuffer, value: string | number | boolean | undefined) => {
        onInstrumentModalBufferChange(field, value);
    }, [onInstrumentModalBufferChange]);

    const handleNumberFieldChange = useCallback((field: keyof InstrumentModalBuffer, value: string) => {
        const num = parseInt(value, 10);
        onInstrumentModalBufferChange(field, isNaN(num) ? undefined : num);
    }, [onInstrumentModalBufferChange]);

    const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedType = e.target.value as PredefinedInstrumentType;
        let presetData: Partial<InstrumentModalBuffer>;

        if (selectedType === "Random") {
            presetData = generateRandomInstrumentData();
        } else {
            presetData = PREDEFINED_INSTRUMENTS[selectedType] || {};
        }

        Object.keys(presetData).forEach(key => {
            const fieldKey = key as keyof InstrumentModalBuffer;
            onInstrumentModalBufferChange(fieldKey, presetData[fieldKey]);
        });
    }, [onInstrumentModalBufferChange]);

    // Handle envelope changes from visual editor
    const handleVolumeEnvelopeChange = useCallback((values: number[]) => {
        onInstrumentModalBufferChange('volumeEnvelope', values.join(','));
    }, [onInstrumentModalBufferChange]);

    const handleToneEnvelopeChange = useCallback((values: number[]) => {
        onInstrumentModalBufferChange('toneEnvelope', values.join(','));
    }, [onInstrumentModalBufferChange]);

    // Audio preview
    const handlePreview = useCallback(async () => {
        if (!synthesizer || isPreviewing) return;

        setIsPreviewing(true);

        // Create temporary instrument for preview
        const tempInstrument: PT3Instrument = {
            id: instrumentModalBuffer.id || 1,
            name: instrumentModalBuffer.name || 'Preview',
            volumeEnvelope: volumeEnvelopeArray,
            toneEnvelope: toneEnvelopeArray,
            volumeLoop: instrumentModalBuffer.volumeLoop,
            toneLoop: instrumentModalBuffer.toneLoop,
            ayEnvelopeShape: instrumentModalBuffer.ayEnvelopeShape,
            ayToneEnabled: instrumentModalBuffer.ayToneEnabled ?? true,
            ayNoiseEnabled: instrumentModalBuffer.ayNoiseEnabled ?? false,
            noiseBaseFrequency: instrumentModalBuffer.noiseBaseFrequency,
            hardwareEnvelopePeriod: instrumentModalBuffer.hardwareEnvelopePeriod,
            hardwareEnvelopeRatio: instrumentModalBuffer.hardwareEnvelopeRatio,
        };

        try {
            await synthesizer.ensureAudioContext();

            // Temporarily add instrument to synthesizer
            const originalInstruments = synthesizer.songData?.instruments || [];
            synthesizer.setSongData({
                ...synthesizer.songData,
                instruments: [...originalInstruments, tempInstrument]
            });

            // Play preview note
            synthesizer.playNote(0, previewNote, tempInstrument.id, null, 15);

            // Stop after 1 second
            setTimeout(() => {
                synthesizer.playNote(0, '===', null, null, null);
                setIsPreviewing(false);

                // Restore original instruments
                synthesizer.setSongData({
                    ...synthesizer.songData,
                    instruments: originalInstruments
                });
            }, 1000);
        } catch (error) {
            console.error('Preview error:', error);
            setIsPreviewing(false);
        }
    }, [synthesizer, isPreviewing, instrumentModalBuffer, volumeEnvelopeArray, toneEnvelopeArray, previewNote]);

    // Conditional return AFTER all hooks
    if (!isOpen) return null;


    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="instrumentModalTitle"
        >
            <div
                className="bg-msx-panelbg p-5 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideIn pixel-font flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <h3 id="instrumentModalTitle" className="text-xl text-msx-highlight mb-4 font-bold">
                    {editingInstrument ? `Edit Instrument #${editingInstrument.id}` : `New Instrument #${instrumentModalBuffer.id || '?'}`}
                </h3>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 border-b border-msx-border">
                    {(['basic', 'volume', 'tone', 'hardware'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab
                                ? 'text-msx-accent border-b-2 border-msx-accent'
                                : 'text-msx-textsecondary hover:text-msx-textprimary'
                                }`}
                        >
                            {tab === 'basic' && '📋 Basic'}
                            {tab === 'volume' && '📊 Volume'}
                            {tab === 'tone' && '🎵 Tone'}
                            {tab === 'hardware' && '⚙️ Hardware'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {activeTab === 'basic' && (
                        <div className="space-y-3">
                            {!editingInstrument && (
                                <div>
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        Load Template
                                    </label>
                                    <select
                                        onChange={handlePresetChange}
                                        defaultValue="Custom"
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-2 focus:ring-msx-accent"
                                    >
                                        {(Object.keys(PREDEFINED_INSTRUMENTS) as PredefinedInstrumentType[]).map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        ID (1-{PT3_MAX_INSTRUMENTS})
                                    </label>
                                    <input
                                        type="number"
                                        value={instrumentModalBuffer.id || ""}
                                        onChange={e => handleNumberFieldChange('id', e.target.value)}
                                        min="1"
                                        max={PT3_MAX_INSTRUMENTS}
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded focus:ring-2 focus:ring-msx-accent"
                                        disabled={!!editingInstrument}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={instrumentModalBuffer.name || ""}
                                        onChange={e => handleFieldChange('name', e.target.value)}
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded focus:ring-2 focus:ring-msx-accent"
                                        placeholder="Instrument name"
                                    />
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="bg-msx-bgcolor border border-msx-border rounded p-3">
                                <label className="block text-xs text-msx-textsecondary mb-2 font-semibold">
                                    🔊 Audio Preview
                                </label>
                                <div className="flex gap-2 items-center">
                                    <select
                                        value={previewNote}
                                        onChange={e => setPreviewNote(e.target.value)}
                                        className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm"
                                    >
                                        {['C-3', 'C-4', 'C-5', 'A-4'].map(note => (
                                            <option key={note} value={note}>{note}</option>
                                        ))}
                                    </select>
                                    <Button
                                        onClick={handlePreview}
                                        disabled={isPreviewing || !synthesizer}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isPreviewing ? '🔊 Playing...' : '▶️ Play Preview'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'volume' && (
                        <div className="space-y-3">
                            <EnvelopeEditor
                                type="volume"
                                values={volumeEnvelopeArray}
                                loopPoint={instrumentModalBuffer.volumeLoop}
                                onChange={handleVolumeEnvelopeChange}
                                onLoopChange={(loop) => handleFieldChange('volumeLoop', loop)}
                                label="Volume Envelope (0-127)"
                            />

                            <div>
                                <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                    CSV Format (for manual editing)
                                </label>
                                <input
                                    type="text"
                                    value={instrumentModalBuffer.volumeEnvelope || ""}
                                    onChange={e => handleFieldChange('volumeEnvelope', e.target.value)}
                                    className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded font-mono text-sm focus:ring-2 focus:ring-msx-accent"
                                    placeholder="e.g. 127,90,60,0"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'tone' && (
                        <div className="space-y-3">
                            <EnvelopeEditor
                                type="tone"
                                values={toneEnvelopeArray}
                                loopPoint={instrumentModalBuffer.toneLoop}
                                onChange={handleToneEnvelopeChange}
                                onLoopChange={(loop) => handleFieldChange('toneLoop', loop)}
                                label="Tone Envelope (-128 to +127 semitones)"
                            />

                            <div>
                                <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                    CSV Format (for manual editing)
                                </label>
                                <input
                                    type="text"
                                    value={instrumentModalBuffer.toneEnvelope || ""}
                                    onChange={e => handleFieldChange('toneEnvelope', e.target.value)}
                                    className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded font-mono text-sm focus:ring-2 focus:ring-msx-accent"
                                    placeholder="e.g. 0,12,0,-12"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'hardware' && (
                        <div className="space-y-4">
                            <AYEnvelopeVisualizer
                                selectedShape={instrumentModalBuffer.ayEnvelopeShape ?? 0}
                                onShapeChange={(shape) => handleFieldChange('ayEnvelopeShape', shape)}
                            />

                            <div className="bg-msx-bgcolor border border-msx-border rounded p-3">
                                <label className="block text-xs text-msx-textsecondary mb-2 font-semibold">
                                    Channel Enables
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={instrumentModalBuffer.ayToneEnabled ?? true}
                                            onChange={e => handleFieldChange('ayToneEnabled', e.target.checked)}
                                            className="form-checkbox bg-msx-panelbg border-msx-border text-msx-accent focus:ring-msx-accent"
                                        />
                                        <span className="text-sm">🎵 Tone</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!instrumentModalBuffer.ayNoiseEnabled}
                                            onChange={e => handleFieldChange('ayNoiseEnabled', e.target.checked)}
                                            className="form-checkbox bg-msx-panelbg border-msx-border text-msx-accent focus:ring-msx-accent"
                                        />
                                        <span className="text-sm">📻 Noise</span>
                                    </label>
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        Noise Freq (0-31)
                                    </label>
                                    <input
                                        type="number"
                                        value={instrumentModalBuffer.noiseBaseFrequency ?? ""}
                                        onChange={e => handleNumberFieldChange('noiseBaseFrequency', e.target.value)}
                                        min="0"
                                        max="31"
                                        placeholder="Global"
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded focus:ring-2 focus:ring-msx-accent"
                                    />
                                    <p className="text-[10px] text-msx-textsecondary mt-1">Leave empty to use global song setting.</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        HW Env Period (Fixed)
                                    </label>
                                    <input
                                        type="number"
                                        value={instrumentModalBuffer.hardwareEnvelopePeriod ?? ""}
                                        onChange={e => handleNumberFieldChange('hardwareEnvelopePeriod', e.target.value)}
                                        min="0"
                                        max="65535"
                                        placeholder="Global"
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded focus:ring-2 focus:ring-msx-accent"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        HW Env Pitch Tracking Ratio
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={instrumentModalBuffer.hardwareEnvelopeRatio ?? ""}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            onInstrumentModalBufferChange('hardwareEnvelopeRatio', isNaN(val) ? undefined : val);
                                        }}
                                        placeholder="e.g. 1.0 for unison, 0.5 for octave down"
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded focus:ring-2 focus:ring-msx-accent"
                                    />
                                    <p className="text-[10px] text-msx-textsecondary mt-1">Overrides fixed period. Env period = Note Period * Ratio.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-msx-border">
                    <Button onClick={onClose} variant="ghost">Cancel</Button>
                    <Button onClick={onSubmit} variant="primary">💾 Save Instrument</Button>
                </div>
            </div>
        </div >
    );
};
