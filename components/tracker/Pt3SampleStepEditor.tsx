import React, { useCallback } from 'react';
import { PT3SampleMacro, PT3SampleStep } from '../../types';
import { Button } from '../common/Button';
import {
    buildPT3SampleStep,
    toPT3SampleLogicalStep,
    type PT3SampleLogicalStep,
} from '../utils/pt3SampleEngine';

/**
 * Props for the {@link Pt3SampleStepEditor} component.
 * @category Tracker
 */
interface Pt3SampleStepEditorProps {
    /** The draft macro being edited. Never mutated: every edit emits a new macro. */
    macro: PT3SampleMacro;
    /** Called with a fresh macro object on every edit. */
    onChange: (macro: PT3SampleMacro) => void;
}

const MAX_STEPS = 64;

const clampInt = (value: number, min: number, max: number): number => {
    if (Number.isNaN(value)) return min;
    return Math.max(min, Math.min(max, Math.trunc(value)));
};

const DEFAULT_LOGICAL_STEP: PT3SampleLogicalStep = {
    volume: 15,
    amplitudeSlide: 0,
    tonePeriodOffset: 0,
    accumulateTone: false,
    toneEnabled: true,
    noiseEnabled: false,
    hardwareEnvelopeEnabled: false,
    noiseOrEnvelopeBase: 0,
    accumulateNoiseOrEnvelope: false,
};

const GATE_STYLES: Record<'on' | 'off', string> = {
    on: 'bg-emerald-500/30 border-emerald-400 text-emerald-200',
    off: 'bg-black/20 border-msx-border text-msx-textsecondary/60',
};

const GateToggle: React.FC<{
    label: string;
    active: boolean;
    title: string;
    onToggle: () => void;
}> = ({ label, active, title, onToggle }) => (
    <button
        type="button"
        title={title}
        onClick={onToggle}
        className={`h-6 w-7 rounded border font-mono text-[0.65rem] font-bold transition-colors ${GATE_STYLES[active ? 'on' : 'off']}`}
    >
        {label}
    </button>
);

const AccumToggle: React.FC<{
    active: boolean;
    title: string;
    onToggle: () => void;
}> = ({ active, title, onToggle }) => (
    <button
        type="button"
        title={title}
        onClick={onToggle}
        className={`h-6 w-6 rounded border font-mono text-[0.7rem] font-bold transition-colors ${active
            ? 'bg-sky-500/30 border-sky-400 text-sky-200'
            : 'bg-black/20 border-msx-border text-msx-textsecondary/60'}`}
    >
        ^
    </button>
);

/**
 * Vortex-style visual editor for an exact PT3 sample macro. Edits volume,
 * amplitude slide, tone offset with accumulation, tone/noise/envelope gates,
 * the global noise/envelope delta and the loop point. Every change re-encodes
 * the step's four native bytes so raw provenance stays consistent.
 *
 * @category Tracker
 */
export const Pt3SampleStepEditor: React.FC<Pt3SampleStepEditorProps> = ({ macro, onChange }) => {
    const updateStep = useCallback((index: number, changes: Partial<PT3SampleLogicalStep>) => {
        const steps = macro.steps.map((step, stepIndex) => {
            if (stepIndex !== index) return step;
            return buildPT3SampleStep({ ...toPT3SampleLogicalStep(step), ...changes });
        });
        onChange({ ...macro, steps });
    }, [macro, onChange]);

    const insertStep = useCallback((index: number) => {
        if (macro.steps.length >= MAX_STEPS) return;
        const source = macro.steps[index];
        const newStep: PT3SampleStep = source
            ? buildPT3SampleStep(toPT3SampleLogicalStep(source))
            : buildPT3SampleStep(DEFAULT_LOGICAL_STEP);
        const steps = [...macro.steps.slice(0, index + 1), newStep, ...macro.steps.slice(index + 1)];
        const loop = macro.loop > index ? macro.loop + 1 : macro.loop;
        onChange({ ...macro, steps, loop });
    }, [macro, onChange]);

    const deleteStep = useCallback((index: number) => {
        if (macro.steps.length <= 1) return;
        const steps = macro.steps.filter((_, stepIndex) => stepIndex !== index);
        let loop = macro.loop;
        if (loop > index) loop -= 1;
        loop = clampInt(loop, 0, steps.length - 1);
        onChange({ ...macro, steps, loop });
    }, [macro, onChange]);

    const appendStep = useCallback(() => {
        insertStep(macro.steps.length - 1);
    }, [insertStep, macro.steps.length]);

    const setLoop = useCallback((index: number) => {
        onChange({ ...macro, loop: clampInt(index, 0, macro.steps.length - 1) });
    }, [macro, onChange]);

    const setEnvelopeSlideMode = useCallback((mode: PT3SampleMacro['envelopeSlideMode']) => {
        onChange({ ...macro, envelopeSlideMode: mode });
    }, [macro, onChange]);

    if (macro.steps.length === 0) {
        return (
            <div className="rounded border border-msx-border bg-msx-bgcolor p-4 text-sm text-msx-textsecondary">
                This PT3 macro has no steps.
                <Button onClick={() => onChange({
                    ...macro,
                    loop: 0,
                    steps: [buildPT3SampleStep(DEFAULT_LOGICAL_STEP)],
                })} variant="secondary" size="sm" className="ml-3">
                    Add first step
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded border border-msx-border bg-msx-bgcolor p-3 text-xs">
                <div className="font-mono text-msx-textprimary">
                    {macro.steps.length} steps · loop {macro.loop}
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-msx-textsecondary font-semibold">Loop</label>
                    <input
                        type="number"
                        value={macro.loop}
                        min={0}
                        max={macro.steps.length - 1}
                        onChange={e => setLoop(parseInt(e.target.value, 10) || 0)}
                        className="w-16 p-1 bg-msx-panelbg border border-msx-border rounded font-mono text-sm focus:ring-2 focus:ring-msx-accent"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-msx-textsecondary font-semibold">Env slide</label>
                    <select
                        value={macro.envelopeSlideMode}
                        onChange={e => setEnvelopeSlideMode(e.target.value as PT3SampleMacro['envelopeSlideMode'])}
                        className="p-1 bg-msx-panelbg border border-msx-border rounded text-sm focus:ring-2 focus:ring-msx-accent"
                    >
                        <option value="pt3-legacy-8bit">PT3 legacy (8-bit)</option>
                        <option value="corrected-16bit">Corrected (16-bit)</option>
                    </select>
                </div>
                <Button onClick={appendStep} variant="secondary" size="sm" disabled={macro.steps.length >= MAX_STEPS}>
                    + Add step
                </Button>
            </div>

            <div className="overflow-x-auto rounded border border-msx-border">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-msx-bgcolor text-[0.62rem] uppercase tracking-wider text-msx-textsecondary">
                            <th className="px-2 py-1.5 text-left" title="Step index. Click the arrow to set the loop point.">#</th>
                            <th className="px-1 py-1.5" title="Tone / Noise / Hardware envelope gates">T N E</th>
                            <th className="px-2 py-1.5 text-right" title="Signed AY tone-period delta (raw units, not semitones)">Tone Δ</th>
                            <th className="px-1 py-1.5" title="Accumulate tone delta across ticks">^</th>
                            <th className="px-2 py-1.5 text-right" title="Global delta: noise period offset (0-31) when N is on, envelope slide (-16..15) when N is off; E only controls the amplitude envelope gate">N/E Δ</th>
                            <th className="px-1 py-1.5" title="Accumulate noise/envelope delta across ticks">^</th>
                            <th className="px-2 py-1.5 text-left" title="Sample volume 0-15 with amplitude slide (+ up / - down)">Vol</th>
                            <th className="px-1 py-1.5" title="Amplitude slide per tick">Slide</th>
                            <th className="px-1 py-1.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {macro.steps.map((step, index) => {
                            const logical = toPT3SampleLogicalStep(step);
                            const isLoop = index === macro.loop;
                            const envelopeValueMode = !logical.noiseEnabled;
                            return (
                                <tr
                                    key={index}
                                    className={`border-t border-msx-border/60 font-mono ${isLoop ? 'bg-msx-accent/10' : index % 2 === 0 ? 'bg-black/10' : ''}`}
                                >
                                    <td className="px-2 py-1 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => setLoop(index)}
                                            title={isLoop ? 'Loop point' : 'Set loop point here'}
                                            className={`mr-1 ${isLoop ? 'text-msx-accent' : 'text-msx-textsecondary/50 hover:text-msx-accent'}`}
                                        >
                                            {isLoop ? '▶' : '·'}
                                        </button>
                                        <span className="text-msx-textprimary">{String(index).padStart(2, '0')}</span>
                                    </td>
                                    <td className="px-1 py-1">
                                        <div className="flex justify-center gap-1">
                                            <GateToggle
                                                label="T"
                                                active={logical.toneEnabled}
                                                title="Tone gate"
                                                onToggle={() => updateStep(index, { toneEnabled: !logical.toneEnabled })}
                                            />
                                            <GateToggle
                                                label="N"
                                                active={logical.noiseEnabled}
                                                title="Noise gate (also selects noise vs envelope for the N/E delta)"
                                                onToggle={() => updateStep(index, { noiseEnabled: !logical.noiseEnabled, noiseOrEnvelopeBase: 0 })}
                                            />
                                            <GateToggle
                                                label="E"
                                                active={logical.hardwareEnvelopeEnabled}
                                                title="Hardware envelope gate"
                                                onToggle={() => updateStep(index, { hardwareEnvelopeEnabled: !logical.hardwareEnvelopeEnabled })}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                        <input
                                            type="number"
                                            value={logical.tonePeriodOffset}
                                            min={-32768}
                                            max={32767}
                                            onChange={e => updateStep(index, {
                                                tonePeriodOffset: clampInt(parseInt(e.target.value, 10), -32768, 32767),
                                            })}
                                            className="w-20 p-1 bg-msx-panelbg border border-msx-border rounded text-right text-sm focus:ring-2 focus:ring-msx-accent"
                                        />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <AccumToggle
                                            active={logical.accumulateTone}
                                            title="Accumulate tone delta"
                                            onToggle={() => updateStep(index, { accumulateTone: !logical.accumulateTone })}
                                        />
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                        <input
                                            type="number"
                                            value={logical.noiseOrEnvelopeBase}
                                            min={envelopeValueMode ? -16 : 0}
                                            max={envelopeValueMode ? 15 : 31}
                                            title={envelopeValueMode ? 'Envelope slide (-16..15)' : 'Noise period offset (0-31)'}
                                            onChange={e => updateStep(index, {
                                                noiseOrEnvelopeBase: clampInt(
                                                    parseInt(e.target.value, 10),
                                                    envelopeValueMode ? -16 : 0,
                                                    envelopeValueMode ? 15 : 31,
                                                ),
                                            })}
                                            className="w-16 p-1 bg-msx-panelbg border border-msx-border rounded text-right text-sm focus:ring-2 focus:ring-msx-accent"
                                        />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <AccumToggle
                                            active={logical.accumulateNoiseOrEnvelope}
                                            title="Accumulate noise/envelope delta"
                                            onToggle={() => updateStep(index, { accumulateNoiseOrEnvelope: !logical.accumulateNoiseOrEnvelope })}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={logical.volume}
                                                min={0}
                                                max={15}
                                                onChange={e => updateStep(index, { volume: clampInt(parseInt(e.target.value, 10), 0, 15) })}
                                                className="w-14 p-1 bg-msx-panelbg border border-msx-border rounded text-right text-sm focus:ring-2 focus:ring-msx-accent"
                                            />
                                            <div className="h-2 w-16 overflow-hidden rounded-sm bg-black/40" title={`Volume ${logical.volume}/15`}>
                                                <div
                                                    className="h-full bg-emerald-400/80"
                                                    style={{ width: `${(logical.volume / 15) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <select
                                            value={logical.amplitudeSlide}
                                            title="Amplitude slide: accumulated ±1 volume per tick"
                                            onChange={e => updateStep(index, {
                                                amplitudeSlide: clampInt(parseInt(e.target.value, 10), -1, 1) as -1 | 0 | 1,
                                            })}
                                            className="p-1 bg-msx-panelbg border border-msx-border rounded text-sm focus:ring-2 focus:ring-msx-accent"
                                        >
                                            <option value={0}>·</option>
                                            <option value={1}>+</option>
                                            <option value={-1}>-</option>
                                        </select>
                                    </td>
                                    <td className="px-1 py-1 whitespace-nowrap text-center">
                                        <button
                                            type="button"
                                            title="Duplicate this step below"
                                            onClick={() => insertStep(index)}
                                            disabled={macro.steps.length >= MAX_STEPS}
                                            className="px-1 text-msx-textsecondary hover:text-msx-accent disabled:opacity-30"
                                        >
                                            ⧉
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete this step"
                                            onClick={() => deleteStep(index)}
                                            disabled={macro.steps.length <= 1}
                                            className="px-1 text-msx-textsecondary hover:text-msx-danger disabled:opacity-30"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="text-[10px] text-msx-textsecondary">
                Tone Δ is a raw AY period delta (positive lowers pitch). The N/E delta targets the shared
                noise (N on) or hardware envelope (N off) resource, exactly like the PT3 replayer. Changes
                only reach the song when you press Save Instrument; Preview always plays this draft.
            </p>
        </div>
    );
};
