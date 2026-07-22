import React, { useMemo } from 'react';
import type { PT3SampleMacro } from '../../types';

interface Pt3SampleVisualizerProps {
  macro: PT3SampleMacro;
  className?: string;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const pathFor = (
  values: number[],
  width: number,
  height: number,
  min: number,
  max: number,
): string => {
  if (!values.length) return '';
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values.map((value, index) => {
    const x = index * step;
    const normalized = (clamp(value, min, max) - min) / Math.max(1, max - min);
    const y = height - normalized * height;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
};

/** Compact Vortex-style visual overview of an exact PT3 sample macro. */
export const Pt3SampleVisualizer: React.FC<Pt3SampleVisualizerProps> = ({ macro, className = '' }) => {
  const steps = macro.steps;
  const width = 720;
  const laneHeight = 54;
  const laneGap = 8;
  const totalHeight = laneHeight * 3 + laneGap * 2;
  const volumePath = useMemo(() => pathFor(steps.map(step => step.volume), width, laneHeight, 0, 15), [steps]);
  const tonePath = useMemo(() => pathFor(steps.map(step => step.tonePeriodOffset), width, laneHeight, -32768, 32767), [steps]);
  const globalPath = useMemo(() => pathFor(steps.map(step => step.noiseEnabled ? step.noiseOrEnvelopeOffset : step.noiseOrEnvelopeOffset), width, laneHeight, -16, 31), [steps]);
  const xFor = (index: number): number => steps.length > 1 ? (index * width) / (steps.length - 1) : 0;

  return (
    <div className={`rounded border border-msx-border bg-msx-bgcolor p-2 ${className}`}>
      <div className="mb-1 flex items-center justify-between text-[0.65rem] text-msx-textsecondary">
        <span className="font-semibold uppercase tracking-wide">PT3 macro shape</span>
        <span className="font-mono">{steps.length} ticks · loop {macro.loop}</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${totalHeight}`} className="min-w-[560px] w-full" role="img" aria-label="PT3 sample macro visualizer">
          {[0, 1, 2].map(lane => {
            const y = lane * (laneHeight + laneGap);
            return <g key={lane}>
              <rect x="0" y={y} width={width} height={laneHeight} fill="#070b10" stroke="#263241" />
              <line x1="0" y1={y + laneHeight / 2} x2={width} y2={y + laneHeight / 2} stroke="#263241" strokeDasharray="3 4" />
            </g>;
          })}
          <path d={volumePath} transform="translate(0 0)" fill="none" stroke="#34d399" strokeWidth="2" />
          <path d={tonePath} transform={`translate(0 ${laneHeight + laneGap})`} fill="none" stroke="#38bdf8" strokeWidth="2" />
          <path d={globalPath} transform={`translate(0 ${(laneHeight + laneGap) * 2})`} fill="none" stroke="#f59e0b" strokeWidth="2" />
          {steps.map((step, index) => {
            const x = xFor(index);
            const y = (laneHeight + laneGap) * 2;
            return <g key={index}>
              <line x1={x} y1={0} x2={x} y2={totalHeight} stroke={index === macro.loop ? '#a78bfa' : '#1f2937'} strokeWidth={index === macro.loop ? 2 : 1} />
              <circle cx={x} cy={y + laneHeight - clamp(step.noiseOrEnvelopeOffset, -16, 31) / 47 * laneHeight} r="2" fill={step.noiseEnabled ? '#f59e0b' : '#c084fc'} />
            </g>;
          })}
          <text x="6" y="14" fill="#34d399" fontSize="11">VOL</text>
          <text x="6" y={laneHeight + laneGap + 14} fill="#38bdf8" fontSize="11">TONE</text>
          <text x="6" y={(laneHeight + laneGap) * 2 + 14} fill="#f59e0b" fontSize="11">N / E</text>
        </svg>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.62rem] text-msx-textsecondary">
        <span className="text-emerald-300">VOL</span>
        <span className="text-sky-300">TONE Δ</span>
        <span className="text-amber-300">N/E Δ</span>
        <span className="text-violet-300">línea vertical = loop</span>
      </div>
    </div>
  );
};

