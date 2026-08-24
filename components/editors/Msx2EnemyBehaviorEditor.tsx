import React, { useMemo, useState } from 'react';
import {
  MSX2_ENEMY_ACT_INFO,
  MSX2_ENEMY_BEHAVIOR_MAX_RULES,
  MSX2_ENEMY_BEHAVIOR_MAX_STATES,
  MSX2_ENEMY_BEHAVIOR_PRESETS,
  MSX2_ENEMY_COND_INFO,
  Msx2EnemyBehaviorActionName,
  Msx2EnemyBehaviorAsset,
  Msx2EnemyBehaviorConditionName,
  Msx2EnemyBehaviorRule,
  Msx2EnemyBehaviorState,
  bakeEnemyBehavior,
} from '../../utils/msx2EnemyBehavior';

/**
 * MSX2 SCREEN 5 simple-enemy behaviour editor.
 *
 * A behaviour is a reusable movement recipe for ordinary enemies — not bosses.
 * It is a handful of STATES; each state is an ORDERED list of rules evaluated
 * top-down once per logic tick, and the FIRST rule whose condition holds wins.
 * That ordering is the whole model, which is why the rules are a numbered list
 * you move up and down rather than a free-form graph.
 *
 * The panel on the right shows the BAKED bytes, not a description of them: what
 * you read there is exactly what the Z80 interpreter walks. Errors collapse the
 * whole program to a standing enemy, so they are shown as loudly as the bytes.
 *
 * Opcode labels, argument units and ranges all come from msx2EnemyBehavior.ts.
 * Restating them here would let the UI offer a value the baker silently clamps.
 */

interface Msx2EnemyBehaviorEditorProps {
  behavior: Msx2EnemyBehaviorAsset;
  onUpdate: (behavior: Msx2EnemyBehaviorAsset) => void;
  setStatusBarMessage?: (message: string) => void;
}

const card = 'bg-msx-panel border border-msx-border rounded p-3 mb-3';
const label = 'block text-xs text-msx-textsecondary mb-1';
const input = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary';
const btn = 'px-2 py-1 text-xs rounded border border-msx-border hover:bg-msx-hover disabled:opacity-40 disabled:hover:bg-transparent';

const CONDITION_NAMES = Object.keys(MSX2_ENEMY_COND_INFO) as Msx2EnemyBehaviorConditionName[];
const ACTION_NAMES = Object.keys(MSX2_ENEMY_ACT_INFO) as Msx2EnemyBehaviorActionName[];

const hex = (value: number) => value.toString(16).toUpperCase().padStart(2, '0');
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

const newRule = (): Msx2EnemyBehaviorRule => ({ id: uid('rule'), condition: 'ALWAYS', action: 'WALK' });

const newState = (index: number): Msx2EnemyBehaviorState => ({
  id: uid('state'),
  name: `State ${index + 1}`,
  rules: [newRule()],
});

export const Msx2EnemyBehaviorEditor: React.FC<Msx2EnemyBehaviorEditorProps> = ({
  behavior, onUpdate, setStatusBarMessage,
}) => {
  const states = behavior.states || [];
  const [selected, setSelected] = useState(0);
  const [presetKey, setPresetKey] = useState(MSX2_ENEMY_BEHAVIOR_PRESETS[0].key);
  const stateIndex = Math.min(selected, Math.max(0, states.length - 1));
  const state: Msx2EnemyBehaviorState | undefined = states[stateIndex];

  const baked = useMemo(() => bakeEnemyBehavior(behavior), [behavior]);

  const patch = (changes: Partial<Msx2EnemyBehaviorAsset>) => onUpdate({ ...behavior, ...changes });

  const patchStates = (next: Msx2EnemyBehaviorState[]) => patch({ states: next });

  const patchState = (index: number, changes: Partial<Msx2EnemyBehaviorState>) =>
    patchStates(states.map((s, i) => (i === index ? { ...s, ...changes } : s)));

  const patchRule = (ruleIndex: number, changes: Partial<Msx2EnemyBehaviorRule>) => {
    if (!state) return;
    patchState(stateIndex, {
      rules: state.rules.map((r, i) => (i === ruleIndex ? { ...r, ...changes } : r)),
    });
  };

  /**
   * Replacing the whole behaviour is the one destructive control on this screen,
   * so it asks first. Losing an authored state machine to a stray click is far
   * more expensive than one confirmation.
   */
  const loadPreset = () => {
    const preset = MSX2_ENEMY_BEHAVIOR_PRESETS.find(entry => entry.key === presetKey);
    if (!preset) return;
    const confirmed = typeof window === 'undefined' || window.confirm(
      `Replace this behaviour with "${preset.label}"?\n\nEvery state and rule you have authored here is discarded.`
    );
    if (!confirmed) return;
    onUpdate({ ...behavior, ...preset.build() });
    setSelected(0);
    setStatusBarMessage?.(`Loaded the "${preset.label}" preset.`);
  };

  const addState = () => {
    if (states.length >= MSX2_ENEMY_BEHAVIOR_MAX_STATES) {
      setStatusBarMessage?.(`A behaviour holds at most ${MSX2_ENEMY_BEHAVIOR_MAX_STATES} states.`);
      return;
    }
    patchStates([...states, newState(states.length)]);
    setSelected(states.length);
  };

  /**
   * Deleting a state renumbers every state after it, so any rule pointing past
   * the gap has to be rewritten. Left alone, those rules would silently jump to
   * whatever state slid into the index — which is a behaviour change the author
   * never asked for and would have to debug on hardware.
   */
  const deleteState = (index: number) => {
    if (states.length <= 1) {
      setStatusBarMessage?.('A behaviour needs at least one state.');
      return;
    }
    const remapped = states
      .filter((_s, i) => i !== index)
      .map(s => ({
        ...s,
        rules: s.rules.map(rule => {
          const target = rule.nextState;
          if (target === undefined || target < 0) return rule;
          if (target === index) return { ...rule, nextState: undefined };   // pointed at the deleted state
          return target > index ? { ...rule, nextState: target - 1 } : rule;
        }),
      }));
    const initial = behavior.initialState ?? 0;
    const nextInitial = initial === index ? 0 : initial > index ? initial - 1 : initial;
    patch({ states: remapped, initialState: nextInitial });
    setSelected(Math.max(0, Math.min(index, remapped.length - 1)));
  };

  const addRule = () => {
    if (!state) return;
    if (state.rules.length >= MSX2_ENEMY_BEHAVIOR_MAX_RULES) {
      setStatusBarMessage?.(`A state holds at most ${MSX2_ENEMY_BEHAVIOR_MAX_RULES} rules.`);
      return;
    }
    // New rules land ABOVE the catch-all: appending after it would make them
    // unreachable, since evaluation stops at the first rule that holds.
    const rules = [...state.rules];
    const lastIsCatchAll = rules.length > 0 && rules[rules.length - 1].condition === 'ALWAYS';
    rules.splice(lastIsCatchAll ? rules.length - 1 : rules.length, 0, newRule());
    patchState(stateIndex, { rules });
  };

  const moveRule = (index: number, delta: number) => {
    if (!state) return;
    const target = index + delta;
    if (target < 0 || target >= state.rules.length) return;
    const rules = [...state.rules];
    [rules[index], rules[target]] = [rules[target], rules[index]];
    patchState(stateIndex, { rules });
  };

  const deleteRule = (index: number) => {
    if (!state) return;
    if (state.rules.length <= 1) {
      setStatusBarMessage?.('A state needs at least one rule.');
      return;
    }
    patchState(stateIndex, { rules: state.rules.filter((_r, i) => i !== index) });
  };

  const numberField = (
    value: number | undefined, spec: { min: number; max: number }, onChange: (next: number) => void,
  ) => (
    <input
      type="number" className={`${input} w-20`} min={spec.min} max={spec.max}
      value={value ?? spec.min}
      onChange={event => onChange(Math.max(spec.min, Math.min(spec.max, Number(event.target.value) || spec.min)))}
    />
  );

  return (
    <div className="p-3 h-full overflow-auto text-msx-textprimary">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
        <div>
          {/* ---- asset-level settings ---- */}
          <div className={card}>
            <h3 className="text-sm font-semibold mb-2">Behaviour</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label}>Start in state</label>
                <select
                  className={input} value={behavior.initialState ?? 0}
                  onChange={event => patch({ initialState: Number(event.target.value) })}
                >
                  {states.map((s, i) => <option key={s.id} value={i}>{i}: {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Speed (px/tick)</label>
                {numberField(behavior.speedPxPerTick, { min: 1, max: 8 }, v => patch({ speedPxPerTick: v }))}
              </div>
              <div>
                <label className={label}>Logic every (frames)</label>
                {numberField(behavior.logicIntervalFrames, { min: 1, max: 255 }, v => patch({ logicIntervalFrames: v }))}
              </div>
            </div>
            <p className="text-[11px] text-msx-textsecondary mt-2">
              Enemy logic runs once every N video frames, never once per frame. Raising this is the
              cheapest way to buy back CPU when a room is busy.
            </p>

            <div className="mt-3 pt-3 border-t border-msx-border">
              <label className={label}>Start from a preset</label>
              <div className="flex gap-2 items-start">
                <select className={input} value={presetKey} onChange={event => setPresetKey(event.target.value)}>
                  {MSX2_ENEMY_BEHAVIOR_PRESETS.map(preset => (
                    <option key={preset.key} value={preset.key}>{preset.label}</option>
                  ))}
                </select>
                <button className={btn} onClick={loadPreset}>Replace</button>
              </div>
              <p className="text-[11px] text-msx-textsecondary mt-1">
                {MSX2_ENEMY_BEHAVIOR_PRESETS.find(preset => preset.key === presetKey)?.summary}
              </p>
            </div>
          </div>

          {/* ---- states ---- */}
          <div className={card}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">States ({states.length}/{MSX2_ENEMY_BEHAVIOR_MAX_STATES})</h3>
              <button className={btn} onClick={addState} disabled={states.length >= MSX2_ENEMY_BEHAVIOR_MAX_STATES}>+ State</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {states.map((s, i) => (
                <button
                  key={s.id}
                  className={`px-2 py-1 text-xs rounded border ${i === stateIndex ? 'border-msx-accent text-msx-accent' : 'border-msx-border'}`}
                  onClick={() => setSelected(i)}
                >
                  {i}: {s.name}{(behavior.initialState ?? 0) === i ? ' ★' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* ---- rules of the selected state ---- */}
          {state && (
            <div className={card}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <input
                  className={`${input} max-w-[16rem]`} value={state.name}
                  onChange={event => patchState(stateIndex, { name: event.target.value })}
                />
                <div className="flex gap-1">
                  <button className={btn} onClick={addRule} disabled={state.rules.length >= MSX2_ENEMY_BEHAVIOR_MAX_RULES}>+ Rule</button>
                  <button className={btn} onClick={() => deleteState(stateIndex)} disabled={states.length <= 1}>Delete state</button>
                </div>
              </div>
              <p className="text-[11px] text-msx-textsecondary mb-2">
                Evaluated top to bottom; the first rule that holds wins and nothing else runs this tick.
              </p>

              <div className="space-y-2">
                {state.rules.map((rule, i) => {
                  const condInfo = MSX2_ENEMY_COND_INFO[rule.condition];
                  const actInfo = MSX2_ENEMY_ACT_INFO[rule.action];
                  const isLast = i === state.rules.length - 1;
                  const unreachable = !isLast && rule.condition === 'ALWAYS';
                  return (
                    <div key={rule.id} className={`border rounded p-2 ${unreachable ? 'border-msx-warning' : 'border-msx-border'}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-msx-textsecondary w-5">{i + 1}</span>
                        <span className="text-xs text-msx-textsecondary">If</span>
                        <select
                          className={`${input} max-w-[12rem]`} value={rule.condition}
                          onChange={event => patchRule(i, { condition: event.target.value as Msx2EnemyBehaviorConditionName })}
                        >
                          {CONDITION_NAMES.map(name => <option key={name} value={name}>{MSX2_ENEMY_COND_INFO[name].label}</option>)}
                        </select>
                        {condInfo.arg && numberField(rule.conditionArg, condInfo.arg, v => patchRule(i, { conditionArg: v }))}
                        {condInfo.arg && <span className="text-[11px] text-msx-textsecondary">{condInfo.arg.unit}</span>}

                        <span className="text-xs text-msx-textsecondary">then</span>
                        <select
                          className={`${input} max-w-[12rem]`} value={rule.action}
                          onChange={event => patchRule(i, { action: event.target.value as Msx2EnemyBehaviorActionName })}
                        >
                          {ACTION_NAMES.map(name => <option key={name} value={name}>{MSX2_ENEMY_ACT_INFO[name].label}</option>)}
                        </select>
                        {actInfo.arg && numberField(rule.actionArg, actInfo.arg, v => patchRule(i, { actionArg: v }))}
                        {actInfo.arg && <span className="text-[11px] text-msx-textsecondary">{actInfo.arg.unit}</span>}

                        <span className="text-xs text-msx-textsecondary">go to</span>
                        <select
                          className={`${input} max-w-[10rem]`}
                          value={rule.nextState === undefined || rule.nextState < 0 ? '' : String(rule.nextState)}
                          onChange={event => patchRule(i, { nextState: event.target.value === '' ? undefined : Number(event.target.value) })}
                        >
                          <option value="">(stay)</option>
                          {states.map((s, si) => <option key={s.id} value={si}>{si}: {s.name}</option>)}
                        </select>

                        <div className="ml-auto flex gap-1">
                          <button className={btn} onClick={() => moveRule(i, -1)} disabled={i === 0}>&uarr;</button>
                          <button className={btn} onClick={() => moveRule(i, 1)} disabled={isLast}>&darr;</button>
                          <button className={btn} onClick={() => deleteRule(i)} disabled={state.rules.length <= 1}>&times;</button>
                        </div>
                      </div>
                      <p className="text-[11px] text-msx-textsecondary mt-1">
                        {condInfo.help} {actInfo.help}
                      </p>
                      {unreachable && (
                        <p className="text-[11px] text-msx-warning mt-1">
                          "Always" holds every tick, so no rule below this one can ever run. Move it to the bottom.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ---- what the MSX actually gets ---- */}
        <div>
          <div className={card}>
            <h3 className="text-sm font-semibold mb-2">Baked program</h3>
            <p className="text-[11px] text-msx-textsecondary mb-2">
              {baked.bytes.length} bytes, {baked.bytes[0]} state(s), starting in state {baked.initialState}.
              This is the byte stream the Z80 interpreter walks, not a description of it.
            </p>
            <pre className="text-[11px] leading-4 bg-msx-bgcolor border border-msx-border rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {baked.bytes.map(hex).join(' ')}
            </pre>
          </div>

          {baked.errors.length > 0 && (
            <div className={`${card} border-msx-danger`}>
              <h3 className="text-sm font-semibold mb-2 text-msx-danger">Errors</h3>
              <p className="text-[11px] text-msx-textsecondary mb-2">
                The whole behaviour falls back to a standing enemy until these are fixed. The ROM still
                builds: one motionless enemy tells you where to look, a failed build does not.
              </p>
              <ul className="text-[11px] space-y-1 list-disc pl-4">
                {baked.errors.map((message, i) => <li key={i}>{message}</li>)}
              </ul>
            </div>
          )}

          {baked.warnings.length > 0 && (
            <div className={card}>
              <h3 className="text-sm font-semibold mb-2 text-msx-warning">Warnings</h3>
              <ul className="text-[11px] space-y-1 list-disc pl-4">
                {baked.warnings.map((message, i) => <li key={i}>{message}</li>)}
              </ul>
            </div>
          )}

          <div className={card}>
            <h3 className="text-sm font-semibold mb-2">How it runs</h3>
            <ul className="text-[11px] text-msx-textsecondary space-y-1 list-disc pl-4">
              <li>One rule fires per logic tick. A rule can act AND switch state in the same tick.</li>
              <li>Every state ends in an "Always" rule; the baker appends one if you leave it out.</li>
              <li>Probes treat the room edge as a wall, and above the room as a ceiling.</li>
              <li>The interpreter is shared: a new behaviour costs data, not code.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
