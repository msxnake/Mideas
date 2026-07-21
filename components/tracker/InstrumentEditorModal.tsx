
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PT3Instrument, PT3SampleMacro } from '../../types';
import { Button } from '../common/Button';
import { PT3_MAX_INSTRUMENTS, PT3_DEFAULT_VIBRATO_TABLE } from '../../constants';
import { EnvelopeEditor } from './EnvelopeEditor';
import { AYEnvelopeVisualizer } from './AYEnvelopeVisualizer';
import { Pt3SampleStepEditor } from './Pt3SampleStepEditor';

/**
 * A buffer type for the instrument editor modal. It mirrors the PT3Instrument type
 * but keeps envelope data as strings for easier editing in text inputs.
 * @internal
 */
interface InstrumentModalBuffer extends Omit<Partial<PT3Instrument>, 'volumeEnvelope' | 'toneEnvelope' | 'noiseEnvelope'> {
    /** The volume envelope as a comma-separated string. */
    volumeEnvelope?: string;
    /** The tone envelope as a comma-separated string. */
    toneEnvelope?: string;
    /** The noise envelope as a comma-separated string. */
    noiseEnvelope?: string;
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
type PredefinedInstrumentType =
    | "Custom"
    | "Piano"
    | "Soft Piano"
    | "Flute"
    | "Banjo"
    | "Violin"
    | "Strings"
    | "Synth Lead"
    | "Bass"
    | "VT Buzz Lead"
    | "VT Plucked Bass"
    | "VT Arp Bell"
    | "VT Noise Snare"
    | "VT Metal Hat"
    | "VT Hollow Tom"
    | "Kick"
    | "Snare"
    | "Hi-Hat"
    | "Snare Seca"
    | "Snare Gorda"
    | "Kick Techno"
    | "Closed Hat"
    | "Open Hat"
    | "Drum"
    | "Hihat"
    | "Random";

/**
 * A record of predefined instrument templates.
 * Volume envelope values are in 0-127 range (normalized to 0-15 by the synthesizer).
 * Tone envelope values are pitch offsets in semitones.
 * @constant
 */
const PREDEFINED_INSTRUMENTS: Record<PredefinedInstrumentType, Partial<InstrumentModalBuffer>> = {
    "Custom": {},
    "Piano": {
        volumeEnvelope: "15,15,14,13,12,10,8,7,5,4,3,2,1,0",
        toneEnvelope: "0,0,0,0",
        volumeLoop: 255,
        toneLoop: 255,
        ayEnvelopeShape: undefined,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Soft Piano": {
        volumeEnvelope: "0,30,60,100,127,110,90,65,40,15,0",
        toneEnvelope: "0,0,0",
        ayEnvelopeShape: undefined,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Flute": {
        volumeEnvelope: "0,2,5,8,11,13,14,13,12,13,14,13",
        toneEnvelope: "0,0,1,0,0,-1",
        volumeLoop: 6,
        toneLoop: 0,
        ayEnvelopeShape: undefined,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Banjo": {
        volumeEnvelope: "127,50,15,0",
        toneEnvelope: "0,12,0,-12",
        toneLoop: 0,
        ayEnvelopeShape: 8,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Violin": {
        // MSX "buzz" technique: hardware envelope tracks tone frequency
        // Shape 14 = continuous sawtooth-triangle (attack, alternate, repeat)
        // Ratio 1.0 = envelope period = tone period / 16, creating rich harmonics
        // This is how PT3 trackers create the classic MSX violin/bowed string sound
        volumeEnvelope: "",
        toneEnvelope: "0,0,1,1,1,0,-1,-1,-1,0",
        toneLoop: 0,
        ayEnvelopeShape: 14,
        hardwareEnvelopeRatio: 1.0,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Strings": {
        volumeEnvelope: "0,1,2,4,6,8,10,12,13,14,15,14,13,14",
        toneEnvelope: "0,0,1,1,0,0,-1,-1",
        volumeLoop: 9,
        toneLoop: 0,
        ayEnvelopeShape: undefined,
        hardwareEnvelopeRatio: undefined,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Synth Lead": {
        volumeEnvelope: "127,127,110,90,100,120,127",
        volumeLoop: 0,
        toneEnvelope: "0,0,1,0,0,-1",
        toneLoop: 0,
        ayEnvelopeShape: 8,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "Bass": {
        volumeEnvelope: "127,95,60,30,10,0",
        toneEnvelope: "0,0,0,-12",
        ayEnvelopeShape: 8,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "VT Buzz Lead": {
        volumeEnvelope: "",
        volumeLoop: 255,
        toneEnvelope: "0,0,1,0,0,-1,0,0",
        toneLoop: 0,
        ayEnvelopeShape: 14,
        hardwareEnvelopeRatio: 1.0,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "VT Plucked Bass": {
        volumeEnvelope: "15,15,13,10,7,5,3,2,1,0",
        volumeLoop: 255,
        toneEnvelope: "-12,-9,-7,-5,-3,-1,0,0",
        toneLoop: 255,
        ayEnvelopeShape: undefined,
        hardwareEnvelopeRatio: undefined,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "VT Arp Bell": {
        volumeEnvelope: "15,13,11,9,7,5,4,3,2,1,0",
        volumeLoop: 255,
        toneEnvelope: "0,12,7,19,12,7",
        toneLoop: 255,
        ayEnvelopeShape: 10,
        hardwareEnvelopeRatio: 2.0,
        ayToneEnabled: true, ayNoiseEnabled: false,
    },
    "VT Noise Snare": {
        volumeEnvelope: "15,14,12,9,7,5,3,2,1,0",
        volumeLoop: 255,
        toneEnvelope: "12,7,3,0,-2",
        toneLoop: 255,
        noiseEnvelope: "2,3,5,7,10,14,20,28,31",
        noiseLoop: 255,
        ayEnvelopeShape: undefined,
        hardwareEnvelopeRatio: undefined,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 4,
    },
    "VT Metal Hat": {
        volumeEnvelope: "13,10,7,4,2,0",
        volumeLoop: 255,
        toneEnvelope: "0,12,0,19,0,12",
        toneLoop: 0,
        noiseEnvelope: "1,1,2,3,5,8,13,21,31",
        noiseLoop: 255,
        ayEnvelopeShape: undefined,
        hardwareEnvelopeRatio: undefined,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 1,
    },
    "VT Hollow Tom": {
        volumeEnvelope: "15,14,12,10,8,6,4,2,1,0",
        volumeLoop: 255,
        toneEnvelope: "-19,-15,-12,-9,-7,-5,-3,-2,-1,0",
        toneLoop: 255,
        noiseEnvelope: "6,7,9,12,16,22,31",
        noiseLoop: 255,
        ayEnvelopeShape: undefined,
        hardwareEnvelopeRatio: undefined,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 6,
    },
    "Kick": {
        volumeEnvelope: "127,118,100,78,56,32,12,0",
        volumeLoop: 255,
        toneEnvelope: "-24,-18,-14,-10,-7,-4,-2,0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 2,
        noiseEnvelope: "2,4,7,12,20,31",
        noiseLoop: 255,
    },
    "Snare": {
        volumeEnvelope: "15,13,10,8,6,4,2,0",
        volumeLoop: 255,
        toneEnvelope: "7,4,2,0",
        toneLoop: 255,
        ayEnvelopeShape: undefined,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 8,
        noiseEnvelope: "3,5,8,12,18,24,31",
        noiseLoop: 255,
    },
    "Hi-Hat": {
        volumeEnvelope: "120,84,48,20,0",
        volumeLoop: 255,
        toneEnvelope: "0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: false, ayNoiseEnabled: true,
        noiseBaseFrequency: 1,
        noiseEnvelope: "1,1,2,4,8,16,31",
        noiseLoop: 255,
    },
    "Snare Seca": {
        volumeEnvelope: "127,110,84,56,30,10,0",
        volumeLoop: 255,
        toneEnvelope: "5,2,0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 4,
        noiseEnvelope: "4,6,9,14,22,31",
        noiseLoop: 255,
    },
    "Snare Gorda": {
        volumeEnvelope: "127,124,116,102,84,60,38,18,0",
        volumeLoop: 255,
        toneEnvelope: "10,7,5,3,1,0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 2,
        noiseEnvelope: "2,3,5,8,12,18,26,31",
        noiseLoop: 255,
    },
    "Kick Techno": {
        volumeEnvelope: "127,127,120,108,90,68,42,20,0",
        volumeLoop: 255,
        toneEnvelope: "-30,-24,-18,-13,-9,-6,-3,0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 1,
        noiseEnvelope: "1,2,3,6,12,24,31",
        noiseLoop: 255,
    },
    "Closed Hat": {
        volumeEnvelope: "120,92,60,28,0",
        volumeLoop: 255,
        toneEnvelope: "0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: false, ayNoiseEnabled: true,
        noiseBaseFrequency: 1,
        noiseEnvelope: "1,1,2,3,6,12,24,31",
        noiseLoop: 255,
    },
    "Open Hat": {
        volumeEnvelope: "118,108,96,82,68,54,40,28,18,10,0",
        volumeLoop: 255,
        toneEnvelope: "0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: false, ayNoiseEnabled: true,
        noiseBaseFrequency: 1,
        noiseEnvelope: "1,1,1,2,2,4,6,9,14,22,31",
        noiseLoop: 255,
    },
    "Drum": {
        volumeEnvelope: "127,118,100,78,56,32,12,0",
        volumeLoop: 255,
        toneEnvelope: "-24,-18,-14,-10,-7,-4,-2,0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: true, ayNoiseEnabled: true,
        noiseBaseFrequency: 2,
        noiseEnvelope: "2,4,7,12,20,31",
        noiseLoop: 255,
    },
    "Hihat": {
        volumeEnvelope: "120,84,48,20,0",
        volumeLoop: 255,
        toneEnvelope: "0",
        toneLoop: 255,
        ayEnvelopeShape: 0,
        ayToneEnabled: false, ayNoiseEnabled: true,
        noiseBaseFrequency: 1,
        noiseEnvelope: "1,1,2,4,8,16,31",
        noiseLoop: 255,
    },
    "Random": {}
};

const ARCHITECTURE_PRESETS: Array<{
    type: PredefinedInstrumentType;
    title: string;
    subtitle: string;
    tags: string[];
    previewNote: string;
}> = [
    {
        type: "Piano",
        title: "Piano",
        subtitle: "Percussive tone, software decay",
        tags: ["Tone", "Decay", "No loop"],
        previewNote: "C-4",
    },
    {
        type: "Strings",
        title: "Strings",
        subtitle: "Slow attack, looped pad, soft vibrato",
        tags: ["Tone", "Sustain", "Vibrato"],
        previewNote: "C-4",
    },
    {
        type: "Flute",
        title: "Flute",
        subtitle: "Breathy attack and light pitch movement",
        tags: ["Tone", "Sustain", "Vibrato"],
        previewNote: "A-4",
    },
    {
        type: "Snare",
        title: "Snare",
        subtitle: "Short tone body plus noise macro",
        tags: ["Tone", "Noise", "One-shot"],
        previewNote: "C-3",
    },
    {
        type: "VT Buzz Lead",
        title: "VT Buzz Lead",
        subtitle: "Hardware envelope locked to pitch",
        tags: ["Tone", "HW Env", "Vibrato"],
        previewNote: "C-4",
    },
    {
        type: "VT Plucked Bass",
        title: "VT Plucked Bass",
        subtitle: "Fast pitch fall with dry volume decay",
        tags: ["Tone", "Pitch", "Decay"],
        previewNote: "C-3",
    },
    {
        type: "VT Noise Snare",
        title: "VT Noise Snare",
        subtitle: "Tone hit plus rising noise period",
        tags: ["Tone", "Noise", "One-shot"],
        previewNote: "C-3",
    },
    {
        type: "VT Metal Hat",
        title: "VT Metal Hat",
        subtitle: "Looped clang tone mixed with fast noise",
        tags: ["Tone", "Noise", "Loop"],
        previewNote: "C-5",
    },
];

const TAB_LABELS: Record<'architecture' | 'basic' | 'volume' | 'tone' | 'hardware' | 'pt3steps', string> = {
    architecture: 'Architecture',
    basic: 'Basic',
    volume: 'Volume',
    tone: 'Tone',
    hardware: 'Noise / AY',
    pt3steps: 'PT3 Steps',
};

const TONE_MACRO_PRESETS: Array<{ label: string; values: number[]; loop: number }> = [
    { label: 'Soft vib', values: [0, 0, 1, 0, 0, -1], loop: 0 },
    { label: 'Deep vib', values: [0, 1, 2, 1, 0, -1, -2, -1], loop: 0 },
    { label: 'PT3 vib', values: PT3_DEFAULT_VIBRATO_TABLE.map(value => value - 3), loop: 0 },
    { label: 'Minor arp', values: [0, 3, 7, 3], loop: 0 },
    { label: 'Major arp', values: [0, 4, 7, 4], loop: 0 },
    { label: 'Octave hit', values: [12, 7, 3, 0], loop: 255 },
];


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

const buildMiniEnvelopePoints = (values: number[], min: number, max: number, width: number, height: number): string => {
    if (values.length === 0) return '';
    const range = Math.max(1, max - min);
    return values.map((value, index) => {
        const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
        const clamped = Math.max(min, Math.min(max, value));
        const y = height - (((clamped - min) / range) * height);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
};

const MiniEnvelope: React.FC<{
    label: string;
    values: number[];
    min: number;
    max: number;
    stroke: string;
}> = ({ label, values, min, max, stroke }) => {
    const points = buildMiniEnvelopePoints(values, min, max, 86, 28);

    return (
        <div className="rounded border border-msx-border/70 bg-black/20 px-2 py-1">
            <div className="mb-1 text-[0.55rem] uppercase tracking-wider text-msx-textsecondary">{label}</div>
            {points ? (
                <svg width="86" height="28" viewBox="0 0 86 28" className="block">
                    <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                <div className="flex h-7 items-center font-mono text-[0.6rem] text-msx-textsecondary">off</div>
            )}
        </div>
    );
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
    const [activeTab, setActiveTab] = useState<'architecture' | 'basic' | 'volume' | 'tone' | 'hardware' | 'pt3steps'>('architecture');
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewNote, setPreviewNote] = useState('C-4');

    const hasPt3Sample = instrumentModalBuffer.instrumentMode === 'pt3-sample' && !!instrumentModalBuffer.pt3Sample;

    // Land on the step editor when opening an exact PT3 sample; leave it when the
    // instrument has none (the tab is hidden then).
    useEffect(() => {
        if (!isOpen) return;
        setActiveTab(prev => {
            if (hasPt3Sample) return 'pt3steps';
            return prev === 'pt3steps' ? 'architecture' : prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handlePt3SampleChange = useCallback((macro: PT3SampleMacro) => {
        onInstrumentModalBufferChange('pt3Sample', macro);
    }, [onInstrumentModalBufferChange]);

    // Parse envelopes for visual editors
    const volumeEnvelopeArray = useMemo(() => parseEnvelope(instrumentModalBuffer.volumeEnvelope), [instrumentModalBuffer.volumeEnvelope]);
    const toneEnvelopeArray = useMemo(() => parseEnvelope(instrumentModalBuffer.toneEnvelope), [instrumentModalBuffer.toneEnvelope]);
    const noiseEnvelopeArray = useMemo(() => parseEnvelope(instrumentModalBuffer.noiseEnvelope), [instrumentModalBuffer.noiseEnvelope]);

    // Handle field changes
    const handleFieldChange = useCallback((field: keyof InstrumentModalBuffer, value: string | number | boolean | undefined) => {
        onInstrumentModalBufferChange(field, value);
    }, [onInstrumentModalBufferChange]);

    const handleNumberFieldChange = useCallback((field: keyof InstrumentModalBuffer, value: string) => {
        const num = parseInt(value, 10);
        onInstrumentModalBufferChange(field, isNaN(num) ? undefined : num);
    }, [onInstrumentModalBufferChange]);

    const applyPresetData = useCallback((presetData: Partial<InstrumentModalBuffer>) => {
        Object.keys(presetData).forEach(key => {
            const fieldKey = key as keyof InstrumentModalBuffer;
            onInstrumentModalBufferChange(fieldKey, presetData[fieldKey]);
        });
    }, [onInstrumentModalBufferChange]);

    const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedType = e.target.value as PredefinedInstrumentType;
        let presetData: Partial<InstrumentModalBuffer>;

        if (selectedType === "Random") {
            presetData = generateRandomInstrumentData();
        } else {
            presetData = PREDEFINED_INSTRUMENTS[selectedType] || {};
        }

        applyPresetData(presetData);
    }, [applyPresetData]);

    const handleArchitecturePreset = useCallback((preset: typeof ARCHITECTURE_PRESETS[number]) => {
        applyPresetData(PREDEFINED_INSTRUMENTS[preset.type] || {});
        onInstrumentModalBufferChange('name', preset.title);
        setPreviewNote(preset.previewNote);
    }, [applyPresetData, onInstrumentModalBufferChange]);

    // Handle envelope changes from visual editor
    const handleVolumeEnvelopeChange = useCallback((values: number[]) => {
        onInstrumentModalBufferChange('volumeEnvelope', values.join(','));
    }, [onInstrumentModalBufferChange]);

    const handleToneEnvelopeChange = useCallback((values: number[]) => {
        onInstrumentModalBufferChange('toneEnvelope', values.join(','));
    }, [onInstrumentModalBufferChange]);

    const handleToneMacroPreset = useCallback((values: number[], loop: number) => {
        onInstrumentModalBufferChange('toneEnvelope', values.join(','));
        onInstrumentModalBufferChange('toneLoop', loop);
    }, [onInstrumentModalBufferChange]);

    const handleNoiseEnvelopeChange = useCallback((values: number[]) => {
        onInstrumentModalBufferChange('noiseEnvelope', values.join(','));
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
            noiseEnvelope: noiseEnvelopeArray,
            volumeLoop: instrumentModalBuffer.volumeLoop,
            toneLoop: instrumentModalBuffer.toneLoop,
            noiseLoop: instrumentModalBuffer.noiseLoop,
            ayEnvelopeShape: instrumentModalBuffer.ayEnvelopeShape,
            ayToneEnabled: instrumentModalBuffer.ayToneEnabled ?? true,
            ayNoiseEnabled: instrumentModalBuffer.ayNoiseEnabled ?? false,
            noiseBaseFrequency: instrumentModalBuffer.noiseBaseFrequency,
            hardwareEnvelopePeriod: instrumentModalBuffer.hardwareEnvelopePeriod,
            hardwareEnvelopeRatio: instrumentModalBuffer.hardwareEnvelopeRatio,
            instrumentMode: instrumentModalBuffer.instrumentMode,
            pt3Sample: instrumentModalBuffer.pt3Sample,
        };

        try {
            await synthesizer.ensureAudioContext();

            const originalSongData = typeof synthesizer.getSongData === 'function'
                ? synthesizer.getSongData()
                : null;
            if (!originalSongData) {
                setIsPreviewing(false);
                return;
            }

            // Temporarily replace the instrument in the synth while preserving the full tracker state.
            const originalInstruments = originalSongData.instruments || [];
            const previewInstruments = [
                ...originalInstruments.filter(instrument => instrument.id !== tempInstrument.id),
                tempInstrument
            ].sort((a, b) => a.id - b.id);

            synthesizer.setSongData({
                ...originalSongData,
                instruments: previewInstruments
            });

            // Play preview note
            synthesizer.playNote(0, previewNote, tempInstrument.id, null, 15);

            // Stop after 1 second
            setTimeout(() => {
                synthesizer.playNote(0, '===', null, null, null);
                setIsPreviewing(false);

                // Restore original instruments
                synthesizer.setSongData({
                    ...originalSongData,
                    instruments: originalInstruments
                });
            }, 1000);
        } catch (error) {
            console.error('Preview error:', error);
            setIsPreviewing(false);
        }
    }, [synthesizer, isPreviewing, instrumentModalBuffer, volumeEnvelopeArray, toneEnvelopeArray, noiseEnvelopeArray, previewNote]);

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
                className="bg-msx-panelbg border border-msx-border p-5 rounded-lg shadow-xl max-w-6xl w-[92vw] max-h-[90vh] overflow-hidden animate-slideIn pixel-font flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 id="instrumentModalTitle" className="text-xl text-msx-highlight font-bold">
                            {editingInstrument ? `Edit Instrument #${editingInstrument.id}` : `New Instrument #${instrumentModalBuffer.id || '?'}`}
                        </h3>
                        <div className="mt-1 text-xs text-msx-textsecondary font-mono">
                            Vol {volumeEnvelopeArray.length} | Tone {toneEnvelopeArray.length} | Noise {noiseEnvelopeArray.length}
                            {typeof instrumentModalBuffer.ayEnvelopeShape === 'number' ? ` | HW env ${instrumentModalBuffer.ayEnvelopeShape.toString(16).toUpperCase()}` : ''}
                        </div>
                    </div>
                    <Button onClick={handlePreview} disabled={isPreviewing || !synthesizer} variant="secondary" className="min-w-28">
                        {isPreviewing ? 'Playing' : 'Preview'}
                    </Button>
                </div>

                {hasPt3Sample && instrumentModalBuffer.pt3Sample && (
                    <div className="mb-4 rounded border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                        <div className="font-bold text-emerald-300">
                            Exact PT3 sample · {instrumentModalBuffer.pt3Sample.steps.length} tick steps · loop {instrumentModalBuffer.pt3Sample.loop}
                        </div>
                        <div className="mt-1 text-emerald-100/80">
                            Preview and ROM use the native per-tick engine. Edit the macro in the PT3 Steps tab; nothing touches the song until you press Save Instrument.
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-msx-border">
                    {(hasPt3Sample
                        ? (['pt3steps', 'architecture', 'basic', 'volume', 'tone', 'hardware'] as const)
                        : (['architecture', 'basic', 'volume', 'tone', 'hardware'] as const)
                    ).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors border border-b-0 rounded-t ${activeTab === tab
                                ? 'text-msx-accent border-msx-accent bg-msx-bgcolor'
                                : 'text-msx-textsecondary border-msx-border bg-msx-panelbg hover:text-msx-textprimary hover:border-msx-highlight/70'
                                }`}
                        >
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {activeTab === 'pt3steps' && hasPt3Sample && instrumentModalBuffer.pt3Sample && (
                        <Pt3SampleStepEditor
                            macro={instrumentModalBuffer.pt3Sample}
                            onChange={handlePt3SampleChange}
                        />
                    )}

                    {activeTab === 'architecture' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {ARCHITECTURE_PRESETS.map(preset => {
                                    const presetData = PREDEFINED_INSTRUMENTS[preset.type] || {};
                                    const presetVolume = parseEnvelope(presetData.volumeEnvelope);
                                    const presetTone = parseEnvelope(presetData.toneEnvelope);
                                    const presetNoise = parseEnvelope(presetData.noiseEnvelope);

                                    return (
                                    <button
                                        key={preset.type}
                                        type="button"
                                        onClick={() => handleArchitecturePreset(preset)}
                                        className="rounded border border-msx-border bg-msx-bgcolor p-3 text-left transition-colors hover:border-msx-highlight hover:bg-msx-border/30 focus:border-msx-highlight focus:outline-none focus:ring-1 focus:ring-msx-highlight/60"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="text-base font-bold text-msx-highlight">{preset.title}</div>
                                                <div className="mt-1 text-xs text-msx-textsecondary">{preset.subtitle}</div>
                                            </div>
                                            <span className="rounded border border-msx-border bg-black/20 px-2 py-1 font-mono text-[0.62rem] text-msx-textprimary">
                                                {preset.previewNote}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {preset.tags.map(tag => (
                                                <span key={tag} className="rounded border border-msx-border/80 bg-black/20 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-wider text-msx-textsecondary">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            <MiniEnvelope label="Vol" values={presetVolume} min={0} max={15} stroke="#10b981" />
                                            <MiniEnvelope label="Tone" values={presetTone} min={-12} max={12} stroke="#38bdf8" />
                                            <MiniEnvelope label="Noise" values={presetNoise} min={0} max={31} stroke="#f59e0b" />
                                        </div>
                                    </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded border border-msx-border bg-msx-bgcolor p-3 text-xs">
                                <div>
                                    <div className="text-msx-textsecondary uppercase tracking-wider text-[0.62rem]">Volume</div>
                                    <div className="mt-1 font-mono text-msx-highlight">{volumeEnvelopeArray.length} steps</div>
                                </div>
                                <div>
                                    <div className="text-msx-textsecondary uppercase tracking-wider text-[0.62rem]">Tone</div>
                                    <div className="mt-1 font-mono text-sky-300">{toneEnvelopeArray.length} steps</div>
                                </div>
                                <div>
                                    <div className="text-msx-textsecondary uppercase tracking-wider text-[0.62rem]">Noise</div>
                                    <div className="mt-1 font-mono text-amber-300">{instrumentModalBuffer.ayNoiseEnabled ? `${noiseEnvelopeArray.length} steps` : 'off'}</div>
                                </div>
                                <div>
                                    <div className="text-msx-textsecondary uppercase tracking-wider text-[0.62rem]">AY Env</div>
                                    <div className="mt-1 font-mono text-msx-textprimary">{typeof instrumentModalBuffer.ayEnvelopeShape === 'number' ? `#${instrumentModalBuffer.ayEnvelopeShape}` : 'off'}</div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    Audio Preview
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
                                        {isPreviewing ? 'Playing...' : 'Play Preview'}
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
                            <div className="bg-msx-bgcolor border border-msx-border rounded p-3">
                                <label className="block text-xs text-msx-textsecondary mb-2 font-semibold">
                                    Tone Macro Presets
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {TONE_MACRO_PRESETS.map(preset => (
                                        <Button
                                            key={preset.label}
                                            onClick={() => handleToneMacroPreset(preset.values, preset.loop)}
                                            size="sm"
                                            variant="ghost"
                                            className="justify-center border border-msx-border"
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

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
                                selectedShape={instrumentModalBuffer.ayEnvelopeShape}
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
                                        <span className="text-sm">Tone</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!instrumentModalBuffer.ayNoiseEnabled}
                                            onChange={e => handleFieldChange('ayNoiseEnabled', e.target.checked)}
                                            className="form-checkbox bg-msx-panelbg border-msx-border text-msx-accent focus:ring-msx-accent"
                                        />
                                        <span className="text-sm">Noise</span>
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

                            <div className="border-t border-msx-border pt-4 space-y-3">
                                <EnvelopeEditor
                                    type="noise"
                                    values={noiseEnvelopeArray}
                                    loopPoint={instrumentModalBuffer.noiseLoop}
                                    onChange={handleNoiseEnvelopeChange}
                                    onLoopChange={(loop) => handleFieldChange('noiseLoop', loop)}
                                    label="Noise Macro (0-31 PSG noise period)"
                                />

                                <div>
                                    <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                                        Noise Macro CSV
                                    </label>
                                    <input
                                        type="text"
                                        value={instrumentModalBuffer.noiseEnvelope || ""}
                                        onChange={e => handleFieldChange('noiseEnvelope', e.target.value)}
                                        className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded font-mono text-sm focus:ring-2 focus:ring-msx-accent"
                                        placeholder="e.g. 2,4,8,16,31"
                                    />
                                    <p className="text-[10px] text-msx-textsecondary mt-1">PT3-inspired per-tick noise period macro for snares, hats and textured drums.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-msx-border">
                    <Button onClick={onClose} variant="ghost">Cancel</Button>
                    <Button onClick={onSubmit} variant="primary">Save Instrument</Button>
                </div>
            </div>
        </div >
    );
};
