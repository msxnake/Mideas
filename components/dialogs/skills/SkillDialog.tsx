import React from 'react';
import type { SkillParameterDef } from '../../utils/msxGenerator/skills/types';

const inputClass = 'w-full rounded border border-slate-600 bg-[#111821] px-2 py-1 text-xs text-slate-200 focus:border-sky-600 focus:outline-none';
const selectClass = 'w-full rounded border border-slate-600 bg-[#111821] px-2 py-1 text-xs text-slate-200 focus:border-sky-600 focus:outline-none';

interface SkillDialogProps {
  skillId: string;
  skillLabel: string;
  description: string;
  icon: string;
  category: string;
  parameters: SkillParameterDef[];
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const SkillDialog: React.FC<SkillDialogProps> = ({
  skillId,
  skillLabel,
  description,
  icon,
  category,
  parameters,
  values,
  onPatch,
  onClose,
}) => {
  const categoryColors: Record<string, string> = {
    movement: 'text-emerald-400',
    attack: 'text-red-400',
    defense: 'text-blue-400',
    utility: 'text-yellow-400',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${skillLabel} parameters`}
    >
      <div className="flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#151a23] shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{skillLabel}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium ${categoryColors[category] || 'text-slate-400'}`}>
                  {category.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-400">{description}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {parameters.map((param: SkillParameterDef) => {
              const raw = values[param.key];
              const fallback = param.default;
              if (param.type === 'boolean') {
                const checked = raw === undefined ? Boolean(fallback) : Boolean(raw);
                return (
                  <label
                    key={param.key}
                    className="col-span-2 flex items-start gap-3 rounded border border-slate-700 bg-[#111821] px-3 py-2.5 text-xs text-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={event => onPatch(param.key, event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-sky-500"
                    />
                    <span className="space-y-0.5">
                      <span className="block font-medium">{param.label}</span>
                      {param.help && <span className="block text-[10px] leading-relaxed text-slate-400">{param.help}</span>}
                    </span>
                  </label>
                );
              }
              const numValue = Number(raw);
              const safeValue = Number.isFinite(numValue) ? numValue : Number(fallback) || 0;
              return (
                <div key={param.key} className="space-y-1.5 text-xs text-slate-200">
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">{param.label}</span>
                    <span className="min-w-[40px] rounded bg-slate-800 px-1.5 py-0.5 text-center text-[10px] text-sky-400">
                      {safeValue}
                    </span>
                  </label>
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step ?? 1}
                    className={inputClass}
                    value={safeValue}
                    onChange={event => {
                      let next = Number(event.target.value);
                      if (!Number.isFinite(next)) next = Number(fallback) || 0;
                      if (typeof param.min === 'number') next = Math.max(param.min, next);
                      if (typeof param.max === 'number') next = Math.min(param.max, next);
                      onPatch(param.key, next);
                    }}
                  />
                  {param.help && <p className="text-[10px] leading-relaxed text-slate-400">{param.help}</p>}
                </div>
              );
            })}
          </div>
          {parameters.length === 0 && (
            <div className="py-8 text-center text-[11px] text-slate-400">
              This skill has no editable parameters yet.
            </div>
          )}
        </div>
        <div className="border-t border-slate-700 px-4 py-2">
          <p className="text-[10px] text-slate-500">Changes apply immediately · Skill ID: {skillId}</p>
        </div>
      </div>
    </div>
  );
};

export default SkillDialog;
