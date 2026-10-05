import React, { useState } from 'react';
import type {
  Msx2TransitionAsset,
  Msx2TransitionClip,
  Msx2TransitionClipSound,
  Msx2TransitionFxDirection,
  Msx2TransitionFxEasing,
  Msx2TransitionFxEffect,
  Msx2TransitionStep,
} from '../../types';
import {
  FX_COLOR_SLOTS,
  FX_FRAME_US,
  FX_MAX_BLOCK_BYTES,
  FX_MAX_CLIP_FRAMES,
  FX_SCREEN_TARGET,
  type FxPalettePlan,
  type FxRgb,
  type FxSourceImage,
} from '../../utils/msx2TransitionFx';
import {
  createClip,
  createStep,
  describePaletteGroups,
  DOUBLE_KEY_PRESS_WARNING,
  effectNeedsLayer,
  framesToSeconds,
  fxRgbToCss,
  togglePinnedColor,
  withClipEffect,
  type TimelineModel,
} from '../../utils/msx2TransitionEditorUtils';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { PlayIcon, PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';

/**
 * Side panels of the transition editor: steps and clips inspector (with sounds), palette panel,
 * timeline and cost meter. The data they show is computed by utils/msx2TransitionEditorUtils.ts and
 * the F1a module; they only draw it and report edits.
 */

export const inputCls = 'bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs text-msx-textprimary';

/** Numeric field that keeps its own text while typing and commits (clamped) on blur / Enter. */
export const NumField: React.FC<{ label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; title?: string; width?: string }> = ({ label, value, min, max, step = 1, onChange, title, width = 'w-16' }) => {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const parsed = Number(text);
    setText(null);
    if (text.trim() !== '' && Number.isFinite(parsed)) onChange(Math.max(min, Math.min(max, Math.round(parsed))));
  };
  return (
    <label className="flex items-center gap-1 text-xs text-msx-textsecondary" title={title}>
      <span>{label}</span>
      <input
        type="number"
        className={`${inputCls} ${width}`}
        value={text ?? value}
        min={min}
        max={max}
        step={step}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); }}
      />
    </label>
  );
};

// ---------------------------------------------------------------------------
// Steps and clips
// ---------------------------------------------------------------------------

export interface SoundOption {
  id: string;
  name: string;
  /** Frames the Sound Editor asset lasts at 60 Hz (0 = nothing playable). */
  frames: number;
}

const EFFECT_LABELS: Record<Msx2TransitionFxEffect, string> = {
  reveal: 'Revelar (persiana)',
  slide: 'Deslizar',
  fade: 'Fundido de paleta',
  hold: 'Espera',
};
const EASING_LABELS: Record<Msx2TransitionFxEasing, string> = { linear: 'Lineal', easeOut: 'Frenada (easeOut)', bounce: 'Rebote' };
const REVEAL_DIRECTIONS: Array<[Msx2TransitionFxDirection, string]> = [['down', 'Hacia abajo'], ['up', 'Hacia arriba'], ['right', 'Hacia la derecha'], ['left', 'Hacia la izquierda']];
const SLIDE_DIRECTIONS: Array<[Msx2TransitionFxDirection, string]> = [['down', 'Baja (entra por arriba)'], ['up', 'Sube (entra por abajo)'], ['right', 'Va a la derecha (entra por la izquierda)'], ['left', 'Va a la izquierda (entra por la derecha)']];

const EFFECT_COLORS: Record<Msx2TransitionFxEffect, string> = {
  reveal: 'bg-sky-500/70',
  slide: 'bg-emerald-500/70',
  fade: 'bg-fuchsia-500/70',
  hold: 'bg-slate-500/70',
};
export const effectBarClass = (effect: Msx2TransitionFxEffect): string => EFFECT_COLORS[effect];

interface StepsPanelProps {
  asset: Msx2TransitionAsset;
  soundOptions: SoundOption[];
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onChange: (patch: Partial<Msx2TransitionAsset>) => void;
  onPreviewSound: (soundAssetId: string) => void;
  /** A GameFlow node that uses this effect also waits for a key: a key-wait hold would need a second press. */
  keyWaitConflict?: boolean;
}

export const TransitionStepsPanel: React.FC<StepsPanelProps> = ({ asset, soundOptions, selectedClipId, onSelectClip, onChange, onPreviewSound, keyWaitConflict = false }) => {
  const setSteps = (steps: Msx2TransitionStep[]) => onChange({ steps });
  const updateStep = (stepId: string, patch: Partial<Msx2TransitionStep>) => setSteps(asset.steps.map(s => (s.id === stepId ? { ...s, ...patch } : s)));
  const updateClip = (stepId: string, clipId: string, patch: Partial<Msx2TransitionClip>) =>
    updateStep(stepId, { clips: asset.steps.find(s => s.id === stepId)!.clips.map(c => (c.id === clipId ? { ...c, ...patch } : c)) });
  const moveStep = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= asset.steps.length) return;
    const copy = asset.steps.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setSteps(copy);
  };
  const addStep = () => {
    const step = createStep(asset);
    setSteps([...asset.steps, step]);
  };
  const addClip = (stepId: string) => {
    const clip = createClip(asset, asset.layers.length ? 'slide' : 'fade');
    updateStep(stepId, { clips: [...asset.steps.find(s => s.id === stepId)!.clips, clip] });
    onSelectClip(clip.id);
  };

  return (
    <Panel
      title={`Pasos y clips (${asset.steps.length})`}
      headerButtons={<Button size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4" />} onClick={addStep} title="Añade un paso: sus clips empiezan a la vez; el siguiente paso empieza cuando acaba el más largo.">Paso</Button>}
    >
      <div className="flex flex-col gap-2 p-1">
        {asset.steps.length === 0 && <div className="text-xs text-msx-textsecondary">Sin pasos: la imagen aparece de golpe. Añade un paso y un clip, o usa un preset.</div>}
        {asset.steps.map((step, si) => (
          <div key={step.id} className="border border-msx-border rounded p-1 flex flex-col gap-1 bg-msx-panelbg/60">
            <div className="flex items-center gap-1 text-xs">
              <span className="w-4 text-msx-textsecondary">{si + 1}</span>
              <input className={`${inputCls} flex-1 min-w-0`} value={step.name} onChange={e => updateStep(step.id, { name: e.target.value })} title="Nombre del paso" />
              <button className="px-1 hover:text-msx-accent" title="Subir" onClick={() => moveStep(si, -1)}>▲</button>
              <button className="px-1 hover:text-msx-accent" title="Bajar" onClick={() => moveStep(si, 1)}>▼</button>
              <Button size="sm" variant="ghost" onClick={() => addClip(step.id)} title="Añade un clip en paralelo a los demás de este paso">+ Clip</Button>
              <button className="px-1 text-msx-danger" title="Borrar paso" onClick={() => setSteps(asset.steps.filter(s => s.id !== step.id))}><TrashIcon className="w-3 h-3" /></button>
            </div>
            {step.clips.length === 0 && <div className="text-[10px] text-msx-textsecondary">Paso vacío.</div>}
            {step.clips.map(clip => (
              <ClipCard
                key={clip.id}
                asset={asset}
                clip={clip}
                selected={selectedClipId === clip.id}
                soundOptions={soundOptions}
                onSelect={() => onSelectClip(clip.id)}
                onPatch={patch => updateClip(step.id, clip.id, patch)}
                onReplace={next => updateStep(step.id, { clips: step.clips.map(c => (c.id === clip.id ? next : c)) })}
                onDelete={() => { updateStep(step.id, { clips: step.clips.filter(c => c.id !== clip.id) }); if (selectedClipId === clip.id) onSelectClip(null); }}
                onPreviewSound={onPreviewSound}
                keyWaitConflict={keyWaitConflict}
              />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
};

interface ClipCardProps {
  asset: Msx2TransitionAsset;
  clip: Msx2TransitionClip;
  selected: boolean;
  soundOptions: SoundOption[];
  onSelect: () => void;
  onPatch: (patch: Partial<Msx2TransitionClip>) => void;
  onReplace: (clip: Msx2TransitionClip) => void;
  onDelete: () => void;
  onPreviewSound: (soundAssetId: string) => void;
  keyWaitConflict: boolean;
}

const ClipCard: React.FC<ClipCardProps> = ({ asset, clip, selected, soundOptions, onSelect, onPatch, onReplace, onDelete, onPreviewSound, keyWaitConflict }) => {
  const waitHold = clip.effect === 'hold' && clip.params.waitForKey === true;
  const needsLayer = effectNeedsLayer(clip.effect);
  const sounds = clip.sounds ?? [];
  const setParams = (params: Partial<Msx2TransitionClip['params']>) => onPatch({ params: { ...clip.params, ...params } });
  const setSounds = (next: Msx2TransitionClipSound[]) => onPatch({ sounds: next.length ? next : undefined });
  const patchSound = (index: number, patch: Partial<Msx2TransitionClipSound>) => setSounds(sounds.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const targetMissing = clip.target !== FX_SCREEN_TARGET && !asset.layers.some(l => l.id === clip.target);

  return (
    <div className={`border rounded p-1 flex flex-col gap-1 ${selected ? 'border-msx-accent bg-msx-accent/10' : 'border-msx-border'}`} onClick={onSelect}>
      <div className="flex items-center gap-1 text-xs">
        <span className={`inline-block w-2 h-4 rounded-sm ${EFFECT_COLORS[clip.effect]}`} />
        <select className={`${inputCls} min-w-0`} value={clip.effect} onChange={e => onReplace(withClipEffect(clip, e.target.value as Msx2TransitionFxEffect, asset.layers))} title="Efecto">
          {(Object.keys(EFFECT_LABELS) as Msx2TransitionFxEffect[]).map(key => <option key={key} value={key}>{EFFECT_LABELS[key]}</option>)}
        </select>
        <span className="text-msx-textsecondary">sobre</span>
        <select className={`${inputCls} min-w-0 flex-1 ${targetMissing ? 'border-red-400' : ''}`} value={clip.target} onChange={e => onPatch({ target: e.target.value })} title="Capa o pantalla entera">
          {!needsLayer && <option value={FX_SCREEN_TARGET}>Pantalla entera</option>}
          {needsLayer && clip.target === FX_SCREEN_TARGET && <option value={FX_SCREEN_TARGET}>(elige una capa)</option>}
          {targetMissing && <option value={clip.target}>{clip.target} (no existe)</option>}
          {asset.layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <button className="px-1 text-msx-danger" title="Borrar clip" onClick={e => { e.stopPropagation(); onDelete(); }}><TrashIcon className="w-3 h-3" /></button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1">
          <NumField label="Dur." value={clip.durationFrames} min={waitHold ? 0 : 1} max={FX_MAX_CLIP_FRAMES} onChange={v => onPatch({ durationFrames: v })} title="Duración en frames a 60 Hz" />
          <span className="text-[10px] text-msx-textsecondary">fr = {framesToSeconds(clip.durationFrames)}</span>
        </div>
        <div className="flex items-center gap-1">
          <NumField label="Retardo" value={clip.delayFrames} min={0} max={FX_MAX_CLIP_FRAMES} onChange={v => onPatch({ delayFrames: v })} title="Frames desde que empieza el paso hasta que empieza este clip" />
          <span className="text-[10px] text-msx-textsecondary">fr = {framesToSeconds(clip.delayFrames)}</span>
        </div>
        {clip.effect !== 'hold' && (
          <label className="flex items-center gap-1 text-xs text-msx-textsecondary">Curva
            <select className={inputCls} value={clip.easing} onChange={e => onPatch({ easing: e.target.value as Msx2TransitionFxEasing })}>
              {(Object.keys(EASING_LABELS) as Msx2TransitionFxEasing[]).map(key => <option key={key} value={key}>{EASING_LABELS[key]}</option>)}
            </select>
          </label>
        )}
      </div>

      {clip.effect === 'reveal' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <label className="flex items-center gap-1 text-xs text-msx-textsecondary">Dirección
            <select className={inputCls} value={clip.params.direction ?? 'down'} onChange={e => setParams({ direction: e.target.value as Msx2TransitionFxDirection })}>
              {REVEAL_DIRECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <NumField label="Tira" value={clip.params.stripSize ?? 2} min={1} max={64} onChange={v => setParams({ stripSize: v })} title="Altura (ancho si es horizontal) en px de cada tira que se descubre de golpe" width="w-12" />
          <NumField label="Lamas" value={clip.params.slats ?? 1} min={1} max={32} onChange={v => setParams({ slats: v })} title="Lamas venecianas: la capa se corta en N bandas que se abren a la vez (1 = un solo barrido)" width="w-12" />
        </div>
      )}
      {clip.effect === 'slide' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <label className="flex items-center gap-1 text-xs text-msx-textsecondary">Movimiento
            <select className={inputCls} value={clip.params.direction ?? 'down'} onChange={e => setParams({ direction: e.target.value as Msx2TransitionFxDirection })}>
              {SLIDE_DIRECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1 text-xs text-msx-textsecondary" title="Automática: la capa empieza completamente fuera de la pantalla">
            <input type="checkbox" checked={clip.params.distance === undefined} onChange={e => setParams({ distance: e.target.checked ? undefined : 64 })} />distancia auto
          </label>
          {clip.params.distance !== undefined && <NumField label="Dist." value={clip.params.distance} min={0} max={1024} onChange={v => setParams({ distance: v })} title="Píxeles que recorre la capa hasta su sitio" />}
        </div>
      )}
      {clip.effect === 'fade' && (
        <label className="flex items-center gap-1 text-xs text-msx-textsecondary">Sentido
          <select className={inputCls} value={clip.params.fade?.direction ?? 'in'} onChange={e => setParams({ fade: { direction: e.target.value === 'out' ? 'out' : 'in' } })}>
            <option value="in">Aparece (fade in)</option>
            <option value="out">Desaparece (fade out)</option>
          </select>
        </label>
      )}
      {clip.effect === 'hold' && (
        <label className="flex items-center gap-1 text-xs text-msx-textsecondary" title="Tras la espera, el efecto aguarda ESPACIO / disparo (0 frames = espera ya)">
          <input type="checkbox" checked={waitHold} onChange={e => onReplace({ ...clip, durationFrames: e.target.checked ? clip.durationFrames : Math.max(1, clip.durationFrames), params: e.target.checked ? { waitForKey: true } : {} })} />
          esperar una tecla (Espacio / disparo)
        </label>
      )}
      {waitHold && (keyWaitConflict
        ? <div className="text-[10px] text-amber-300">{DOUBLE_KEY_PRESS_WARNING}</div>
        : <div className="text-[10px] text-msx-textsecondary">Un nodo Screen5Presentation con «Wait for key» ya espera una tecla tras el efecto: con las dos esperas se piden dos pulsaciones.</div>)}

      <div className="flex flex-col gap-1 border-t border-msx-border/60 pt-1">
        {sounds.map((snd, i) => {
          const option = soundOptions.find(o => o.id === snd.soundAssetId);
          return (
            <div key={i} className="flex flex-wrap items-center gap-1 text-xs">
              <span title="Sonido del Sound Editor (canal C, una sola voz)">♪</span>
              <select className={`${inputCls} min-w-0 max-w-[10rem] ${option ? '' : 'border-amber-400'}`} value={snd.soundAssetId} onChange={e => patchSound(i, { soundAssetId: e.target.value })}>
                {!option && <option value={snd.soundAssetId}>{snd.soundAssetId} (no existe)</option>}
                {soundOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select className={inputCls} value={snd.at} onChange={e => patchSound(i, { at: e.target.value === 'end' ? 'end' : 'start' })} title="Se dispara al empezar o al terminar el clip">
                <option value="start">al inicio</option>
                <option value="end">al fin</option>
              </select>
              <NumField label="±" value={snd.offsetFrames ?? 0} min={-60} max={60} onChange={v => patchSound(i, { offsetFrames: v })} title="Desplazamiento en frames (negativo = antes)" width="w-12" />
              <span className="text-[10px] text-msx-textsecondary">fr{option ? ` · dura ${option.frames} fr` : ''}</span>
              <button className="px-1 hover:text-msx-accent" title="Oír el sonido con el sintetizador" onClick={e => { e.stopPropagation(); onPreviewSound(snd.soundAssetId); }}><PlayIcon className="w-4 h-4" /></button>
              <button className="px-1 text-msx-danger" title="Quitar el sonido" onClick={e => { e.stopPropagation(); setSounds(sounds.filter((_s, j) => j !== i)); }}><TrashIcon className="w-3 h-3" /></button>
            </div>
          );
        })}
        {sounds.length < 2 && (soundOptions.length > 0
          ? <button className="self-start text-[10px] text-msx-textsecondary hover:text-msx-accent" onClick={e => { e.stopPropagation(); setSounds([...sounds, { soundAssetId: soundOptions[0].id, at: sounds.length ? 'end' : 'start', offsetFrames: 0 }]); }}>+ Sonido (máx. 2)</button>
          : <span className="text-[10px] text-msx-textsecondary">No hay sonidos en el proyecto. Crea uno en Sound Editor para sincronizarlo con este clip.</span>)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Palette panel
// ---------------------------------------------------------------------------

const GROUP_COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#e879f9', '#f87171', '#a3e635'];

interface PalettePanelProps {
  image: FxSourceImage | null;
  plan: FxPalettePlan | null;
  asset: Msx2TransitionAsset;
  view: 'original' | 'derived' | 'diff';
  onView: (view: 'original' | 'derived' | 'diff') => void;
  onChange: (patch: Partial<Msx2TransitionAsset>) => void;
}

const Swatch: React.FC<{ rgb: FxRgb | undefined; title: string; className?: string; onClick?: () => void; underline?: string }> = ({ rgb, title, className = '', onClick, underline }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-5 h-5 border border-msx-border shrink-0 ${className}`}
    style={{ background: fxRgbToCss(rgb), borderBottom: underline ? `3px solid ${underline}` : undefined, cursor: onClick ? 'pointer' : 'default' }}
  />
);

export const TransitionPalettePanel: React.FC<PalettePanelProps> = ({ image, plan, asset, view, onView, onChange }) => {
  if (!image || !plan) {
    return <Panel title="Paleta (fundido por región)"><div className="p-1 text-xs text-msx-textsecondary">Elige una presentación para ver el reparto de la paleta.</div></Panel>;
  }
  const pinned = new Set(asset.palettePlan?.pinnedColors ?? []);
  const rows = describePaletteGroups(plan, asset);
  const slotGroup = (slot: number) => plan.groups.findIndex(g => slot >= g.first && slot < g.first + g.count);
  const used = new Set<number>();
  for (const row of image.pixels) for (const v of row) used.add(v & 15);
  const colorName = (c: number) => `${c} (${image.palette[c]?.join(',')})`;
  return (
    <Panel title="Paleta (fundido por región)">
      <div className="flex flex-col gap-1.5 p-1 text-xs">
        {plan.mode === 'identity' ? (
          <div className="text-msx-textsecondary">
            Sin fundido por capa: la imagen conserva su paleta tal cual ({used.size} de 16 colores en uso). Si añades un clip «Fundido de paleta» a una capa, la paleta se reparte en grupos que se funden por separado y aquí verás cómo.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className={plan.slotsUsed >= 16 ? 'text-amber-300' : ''}>Ranuras <strong>{plan.slotsUsed}/16</strong></span>
              <span className={plan.alteredPixels > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                {plan.alteredPixels === 0 ? 'no se altera ningún píxel' : `se alteran ${plan.alteredPixels} px (Δ máx. ${plan.maxDelta} de 7)`}
              </span>
              <Button size="sm" variant={view === 'diff' ? 'secondary' : 'ghost'} onClick={() => onView(view === 'diff' ? 'original' : 'diff')} title="Resalta en magenta los píxeles cuyo color cambia">
                {view === 'diff' ? 'Ocultar diferencias' : 'Ver diferencias'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-0.5">
              {plan.palette.map((rgb, slot) => {
                const g = slotGroup(slot);
                return <Swatch key={slot} rgb={rgb} title={`Ranura ${slot}${slot === 0 ? ' (negro, fondo)' : ''}${g >= 0 ? ` · ${rows[g]?.name}` : ' · sin usar'}`} underline={g >= 0 && slot > 0 ? GROUP_COLORS[g % GROUP_COLORS.length] : undefined} className={slot >= plan.slotsUsed ? 'opacity-30' : ''} />;
              })}
            </div>
            <table className="w-full text-[10px] text-msx-textsecondary">
              <thead><tr className="text-left"><th>Grupo</th><th>Ranuras</th><th>px</th><th>alterados</th></tr></thead>
              <tbody>
                {rows.map((row, gi) => (
                  <tr key={row.id}>
                    <td><span className="inline-block w-2 h-2 mr-1" style={{ background: GROUP_COLORS[gi % GROUP_COLORS.length] }} />{row.name}</td>
                    <td>{row.slots}</td>
                    <td>{row.pixels}</td>
                    <td className={row.altered ? 'text-amber-300' : ''}>{row.altered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plan.merges.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <div className="text-msx-textsecondary">Fusiones ({plan.merges.length}): el color de la izquierda se absorbe en el de la derecha.</div>
                {plan.merges.map((m, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px]">
                    <Swatch rgb={image.palette[m.from]} title={`Color ${colorName(m.from)}`} />
                    <span>→</span>
                    <Swatch rgb={image.palette[m.to]} title={`Color ${colorName(m.to)}`} />
                    <span className="text-msx-textsecondary">{rows.find(r => r.id === m.groupId)?.name ?? m.groupId} · {m.pixels} px · Δ {m.distance.toFixed(1)}</span>
                    <button
                      className={`ml-auto px-1 border rounded ${pinned.has(m.from) ? 'border-msx-accent text-msx-accent' : 'border-msx-border hover:text-msx-accent'}`}
                      title={pinned.has(m.from) ? 'Soltar el color: vuelve a poder fusionarse' : 'Fijar el color: el reparto buscará otra fusión'}
                      onClick={() => onChange(togglePinnedColor(asset, m.from, !pinned.has(m.from)))}
                    >{pinned.has(m.from) ? 'fijado' : 'fijar color'}</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div className="text-msx-textsecondary">Colores de la presentación (clic = fijar / soltar; un color fijado no se fusiona):</div>
        <div className="flex flex-wrap gap-0.5">
          {image.palette.map((rgb, c) => (
            <Swatch
              key={c}
              rgb={rgb}
              title={`Color ${colorName(c)}${used.has(c) ? '' : ' · no se usa'}${pinned.has(c) ? ' · fijado' : ''}`}
              className={`${pinned.has(c) ? 'ring-2 ring-msx-accent' : ''} ${used.has(c) ? '' : 'opacity-30'}`}
              onClick={() => onChange(togglePinnedColor(asset, c, !pinned.has(c)))}
            />
          ))}
        </div>
        {plan.pinnedIgnored.length > 0 && <div className="text-amber-300">Colores fijados que no se han podido respetar: {plan.pinnedIgnored.join(', ')}.</div>}
        {plan.warnings.map((w, i) => <div key={i} className="text-amber-300">{w}</div>)}
        {plan.errors.map((e, i) => <div key={i} className="text-red-300">{e}</div>)}
        <div className="text-[10px] text-msx-textsecondary">La presentación original nunca se modifica: el efecto termina en una imagen derivada (paleta repartida) que solo se genera al exportar. Las ranuras útiles son {FX_COLOR_SLOTS} + el negro.</div>
      </div>
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Timeline and cost meter
// ---------------------------------------------------------------------------

interface TimelineProps {
  model: TimelineModel | null;
  selectedClipId: string | null;
  onSelectClip: (id: string) => void;
  playheadRef: React.RefObject<HTMLDivElement>;
  readoutRef: React.RefObject<HTMLSpanElement>;
}

const LABEL_W = '7.5rem';

export const TransitionTimeline: React.FC<TimelineProps> = ({ model, selectedClipId, onSelectClip, playheadRef, readoutRef }) => {
  const total = Math.max(1, model?.totalTicks ?? 1);
  const pct = (tick: number) => `${(Math.max(0, Math.min(total, tick)) / total) * 100}%`;
  const seconds: number[] = [];
  for (let s = 0; s * 60 <= total; s++) seconds.push(s);
  return (
    <Panel title="Línea de tiempo" headerButtons={<span ref={readoutRef} className="text-[10px] text-msx-textsecondary" />}>
      <div className="p-1 text-[10px] text-msx-textsecondary">
        {!model ? 'Sin datos: corrige los errores para ver la línea de tiempo.' : (
          <div className="relative flex flex-col gap-0.5">
            <div className="flex">
              <div style={{ width: LABEL_W }} className="shrink-0">{model.totalTicks} ticks = {(model.totalTicks / 60).toFixed(2)} s{model.clips.some(c => c.waitsForKey) ? ' + tecla' : ''}</div>
              <div className="relative flex-1 h-3 border-b border-msx-border">
                {seconds.map(s => <span key={s} className="absolute top-0 border-l border-msx-border pl-0.5" style={{ left: pct(s * 60) }}>{s}s</span>)}
              </div>
            </div>
            {model.clips.map(bar => (
              <div key={bar.clipId} className="flex items-center cursor-pointer" onClick={() => onSelectClip(bar.clipId)}>
                <div style={{ width: LABEL_W }} className={`shrink-0 truncate pr-1 ${selectedClipId === bar.clipId ? 'text-msx-accent' : ''}`} title={bar.label}>{bar.stepIndex + 1}. {bar.label}</div>
                <div className="relative flex-1 h-3.5 bg-black/30">
                  {bar.endTick > bar.startTick && (
                    <div className={`absolute top-0 h-full rounded-sm ${effectBarClass(bar.effect)} ${selectedClipId === bar.clipId ? 'ring-1 ring-white' : ''}`} style={{ left: pct(bar.startTick), width: pct(bar.endTick - bar.startTick), minWidth: 2 }} />
                  )}
                  {bar.waitsForKey && <span className="absolute top-0 h-full text-amber-300 leading-3.5" style={{ left: pct(bar.endTick) }} title="Espera una tecla (sin duración fija)">⌨</span>}
                </div>
              </div>
            ))}
            <div className="flex items-center">
              <div style={{ width: LABEL_W }} className="shrink-0">♪ sonidos</div>
              <div className="relative flex-1 h-3.5 bg-black/30">
                {model.sounds.map((snd, i) => (
                  <div key={i} className="absolute top-0 h-full rounded-sm bg-amber-400/80 text-black overflow-hidden whitespace-nowrap px-0.5 leading-3.5" title={`${snd.label}: tick ${snd.startTick} → ${snd.endTick} (${snd.durationFrames} fr = ${(snd.durationFrames / 60).toFixed(2)} s)`} style={{ left: pct(snd.startTick), width: pct(snd.endTick - snd.startTick), minWidth: 3 }}>♪ {snd.durationFrames}fr</div>
                ))}
              </div>
            </div>
            <div ref={playheadRef} className="absolute top-0 bottom-0 w-px bg-red-400 pointer-events-none" style={{ left: `calc(${LABEL_W} + (100% - ${LABEL_W}) * 0)`, display: 'none' }} />
          </div>
        )}
      </div>
    </Panel>
  );
};

/** Position (0..1) of the play head over the timeline tracks; written straight to the DOM during Play. */
export const playheadLeft = (tick: number, totalTicks: number): string =>
  `calc(${LABEL_W} + (100% - ${LABEL_W}) * ${Math.max(0, Math.min(1, tick / Math.max(1, totalTicks)))})`;

export const TransitionCostMeter: React.FC<{ model: TimelineModel | null }> = ({ model }) => {
  const W = 480; const H = 44; const CAP = 3;
  const bars = model?.costs ?? [];
  const bw = bars.length ? Math.max(1, Math.min(8, W / bars.length)) : 1;
  const lineY = H - (H * 1) / CAP;
  return (
    <Panel title="Coste por frame y tamaño">
      <div className="p-1 flex flex-col gap-1 text-[10px] text-msx-textsecondary">
        {!model ? 'Sin datos.' : (
          <>
            <div className="flex flex-wrap gap-x-4">
              <span className={model.blockBytes > FX_MAX_BLOCK_BYTES * 0.8 ? 'text-amber-300' : ''}>Bloque: <strong>{model.blockBytes}</strong> / {FX_MAX_BLOCK_BYTES} B</span>
              <span>Pico: <strong className={model.peakLoad > 1 ? 'text-amber-300' : ''}>{(model.peakLoad * FX_FRAME_US / 1000).toFixed(1)} ms</strong> (frame de 60 Hz = {(FX_FRAME_US / 1000).toFixed(1)} ms)</span>
              <span>Frames estirados: <strong className={model.stretchedFrames ? 'text-amber-300' : ''}>{model.stretchedFrames}</strong></span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12 bg-black/30" preserveAspectRatio="none">
              {bars.map((c, i) => {
                const h = Math.min(CAP, c.load) / CAP * H;
                return <rect key={i} x={i * bw} y={H - h} width={Math.max(0.5, bw - 0.5)} height={h} fill={c.load <= 1 ? '#22c55e' : c.load <= 2 ? '#f59e0b' : '#ef4444'}><title>{`frame ${c.frame}: ${(c.costUs / 1000).toFixed(1)} ms · ${c.ticks} tick(s)`}</title></rect>;
              })}
              <line x1={0} x2={W} y1={lineY} y2={lineY} stroke="#fca5a5" strokeDasharray="3 3" strokeWidth={0.7} />
            </svg>
            <div>La línea roja es 1/60 s. Los frames por encima duran varios ticks (el efecto va a menos fps).</div>
          </>
        )}
      </div>
    </Panel>
  );
};
