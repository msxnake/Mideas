import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Msx2TransitionAsset, Msx2TransitionRect, ProjectAsset, PSGSoundData } from '../../types';
import {
  FX_SCREEN_H,
  FX_SCREEN_W,
  createLogoDropPreset,
  deriveFxImage,
  normalizeTransitionAsset,
  planPaletteGroups,
  type FxDerivedImage,
  type FxPalettePlan,
} from '../../utils/msx2TransitionFx';
import {
  FX_TICK_MS,
  analyzeTransition,
  applyLayerDrag,
  backdropCss,
  buildTimelineModel,
  computeAlteredMask,
  createFxPlayer,
  createLayer,
  DOUBLE_KEY_PRESS_WARNING,
  findKeyWaitConflicts,
  layerOutsidePicture,
  overlappingLayerIds,
  rectFromCorners,
  rectOverlapsLayers,
  removeLayerFromAsset,
  renderDecoderRgba,
  renderDiffRgba,
  renderIndexedRgba,
  shrinkRectToContent,
  snapLayerRect,
  soundPreviewSchedule,
  stripTrailingKeyWait,
  type FxPlayer,
  type RectHandle,
} from '../../utils/msx2TransitionEditorUtils';
import { compilePsgOneShotRecords } from '../../utils/msxGenerator/generators/msx2/msx2PsgOneShot';
import { AYRegisterSynthesizer } from '../utils/ayRegisterSynthesizer';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ArrowPathIcon, PlayIcon, PlusCircleIcon, StopIcon, TrashIcon } from '../icons/MsxIcons';
import {
  NumField,
  TransitionCostMeter,
  TransitionPalettePanel,
  TransitionStepsPanel,
  TransitionTimeline,
  inputCls,
  playheadLeft,
  type SoundOption,
} from './Msx2TransitionPanels';

/**
 * Editor for 'msx2transition' assets: the entry effect of a SCREEN 5 presentation (design:
 * docs/msx/MSX2_TRANSITION_FX_DESIGN.md). The user cuts rectangular layers out of the presentation
 * bitmap, applies reveal / slide / palette-fade / hold clips to them, in steps, and attaches Sound
 * Editor assets to the clips.
 *
 * Play compiles the asset with the F1a compiler and replays THAT block on the JS model of the VDP at
 * 60 Hz of wall clock (utils/msx2TransitionEditorUtils.ts createFxPlayer), so what you see is what
 * the ROM interpreter will run. The PSG writes the decoder emits go to the synthesizer through
 * AYRegisterSynthesizer.pokeRegisters in the same tick.
 */

interface Msx2TransitionEditorProps {
  /** Id of the asset being edited: lets the editor find the GameFlow nodes that use it (key-wait warning). */
  assetId?: string;
  transition: Msx2TransitionAsset;
  onUpdate: (data: Partial<Msx2TransitionAsset>) => void;
  allAssets: ProjectAsset[];
  setStatusBarMessage?: (message: string) => void;
}

interface DragState {
  layerId: string;
  mode: RectHandle;
  startX: number;
  startY: number;
  orig: Msx2TransitionRect;
  current: Msx2TransitionRect;
}

interface BandState { x0: number; y0: number; x1: number; y1: number }

type View = 'original' | 'derived' | 'diff';
type PlayPhase = 'idle' | 'running' | 'done';

const HANDLES: Array<{ mode: RectHandle; style: React.CSSProperties; cursor: string }> = [
  { mode: 'nw', style: { left: -4, top: -4 }, cursor: 'nwse-resize' },
  { mode: 'n', style: { left: '50%', top: -4, marginLeft: -4 }, cursor: 'ns-resize' },
  { mode: 'ne', style: { right: -4, top: -4 }, cursor: 'nesw-resize' },
  { mode: 'e', style: { right: -4, top: '50%', marginTop: -4 }, cursor: 'ew-resize' },
  { mode: 'se', style: { right: -4, bottom: -4 }, cursor: 'nwse-resize' },
  { mode: 's', style: { left: '50%', bottom: -4, marginLeft: -4 }, cursor: 'ns-resize' },
  { mode: 'sw', style: { left: -4, bottom: -4 }, cursor: 'nesw-resize' },
  { mode: 'w', style: { left: -4, top: '50%', marginTop: -4 }, cursor: 'ew-resize' },
];

const LAYER_COLORS = ['#38bdf8', '#f59e0b', '#a3e635', '#e879f9', '#f87171', '#2dd4bf'];

/** Rectangles of the "Back to Mars" presentation (F0 data): the logo that falls and the alien that fades in. */
const BACK_TO_MARS_LOGO: Msx2TransitionRect = { x: 4, y: 12, w: 250, h: 53 };
const BACK_TO_MARS_ALIEN: Msx2TransitionRect = { x: 68, y: 65, w: 104, h: 136 };

const pickSoundByName = (sounds: SoundOption[], pattern: RegExp, fallbackIndex: number): string => {
  const named = sounds.find(s => pattern.test(s.name));
  return (named ?? sounds[Math.min(fallbackIndex, sounds.length - 1)])?.id ?? '';
};

export const Msx2TransitionEditor: React.FC<Msx2TransitionEditorProps> = ({ assetId, transition, onUpdate, allAssets, setStatusBarMessage }) => {
  const asset = useMemo(() => normalizeTransitionAsset(transition), [transition]);
  const presentations = useMemo(() => allAssets.filter(a => a.type === 'msx2presentation'), [allAssets]);
  const soundAssets = useMemo(() => allAssets.filter(a => a.type === 'sound'), [allAssets]);
  const soundOptions: SoundOption[] = useMemo(() => soundAssets.map(a => ({
    id: a.id,
    name: a.name,
    frames: (compilePsgOneShotRecords(a.data as PSGSoundData)?.records ?? []).reduce((sum, rec) => sum + rec[0], 0),
  })), [soundAssets]);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [scale, setScale] = useState(2);
  const [snap, setSnap] = useState(2);
  const [view, setView] = useState<View>('original');
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [fitContent, setFitContent] = useState(false);
  const [band, setBand] = useState<BandState | null>(null);
  const [whooshId, setWhooshId] = useState('');
  const [thudId, setThudId] = useState('');
  /** Presets end with a key wait only when asked: a Screen5Presentation node already waits for a key after the effect. */
  const [presetKeyWait, setPresetKeyWait] = useState(false);
  const [phase, setPhase] = useState<PlayPhase>('idle');
  const [audioNote, setAudioNote] = useState('');
  const [soundLog, setSoundLog] = useState<Array<{ tick: number; name: string; r10: number | null }>>([]);
  const playing = phase !== 'idle';

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const commit = useCallback((patch: Partial<Msx2TransitionAsset>) => onUpdateRef.current(patch), []);

  // ---- analysis (compile + report) -------------------------------------------------------------
  const analysis = useMemo(() => analyzeTransition(asset, allAssets), [asset, allAssets]);
  const image = analysis.image;
  const result = analysis.result;
  const plan: FxPalettePlan | null = useMemo(() => {
    if (!image) return null;
    try { return planPaletteGroups(image, asset); } catch { return null; }
  }, [image, asset]);
  const derived: FxDerivedImage | null = useMemo(() => {
    if (!image || !plan) return null;
    try { return deriveFxImage(image, asset, plan); } catch { return null; }
  }, [image, asset, plan]);
  const timelineModel = useMemo(() => (result && !result.errors.length ? buildTimelineModel(asset, result) : null), [asset, result]);
  const overlapIds = useMemo(() => overlappingLayerIds(asset.layers), [asset.layers]);
  const keyWaitConflicts = useMemo(() => (assetId ? findKeyWaitConflicts(assetId, asset, allAssets) : []), [assetId, asset, allAssets]);
  const keyWaitWarning = keyWaitConflicts.length
    ? `${DOUBLE_KEY_PRESS_WARNING} (Nodo${keyWaitConflicts.length > 1 ? 's' : ''}: ${keyWaitConflicts.map(c => `${c.flowName} / ${c.nodeId}`).join(', ')}.)`
    : '';
  const errors = [...(analysis.sourceError ? [analysis.sourceError] : []), ...(result?.errors ?? [])];
  const warnings = [...(keyWaitWarning ? [keyWaitWarning] : []), ...(result?.warnings ?? [])];
  const canPlay = !!result && result.errors.length === 0 && !!result.derived;

  useEffect(() => {
    // Default sounds of the "logo falls" preset: a whoosh-ish name first, else the first / second asset.
    setWhooshId(prev => (soundOptions.some(s => s.id === prev) ? prev : pickSoundByName(soundOptions, /whoosh|swoosh|woosh|viento|wind/i, 0)));
    setThudId(prev => (soundOptions.some(s => s.id === prev) ? prev : pickSoundByName(soundOptions, /thud|golpe|hit|impact|boom|bump|slam/i, 1)));
  }, [soundOptions]);

  // ---- canvas (edit mode) ----------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameBufRef = useRef<Uint8ClampedArray>(new Uint8ClampedArray(FX_SCREEN_W * FX_SCREEN_H * 4));

  const paintRgba = (rgba: Uint8ClampedArray) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), FX_SCREEN_W, FX_SCREEN_H), 0, 0);
  };

  const baseRgba = useMemo(() => {
    if (!image) return null;
    if (view === 'derived' && derived) return renderIndexedRgba(derived.pixels, derived.palette);
    if (view === 'diff' && derived) return renderDiffRgba(image, computeAlteredMask(image, derived));
    return renderIndexedRgba(image.pixels, image.palette);
  }, [image, derived, view]);

  useEffect(() => {
    if (playing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (baseRgba) paintRgba(baseRgba);
    else { ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, FX_SCREEN_W, FX_SCREEN_H); }
  }, [baseRgba, playing]);

  // ---- layers ------------------------------------------------------------------------------------
  const selectedLayer = asset.layers.find(l => l.id === selectedLayerId) ?? null;
  const setLayerRect = (id: string, rect: Msx2TransitionRect) => commit({ layers: asset.layers.map(l => (l.id === id ? { ...l, rect } : l)) });
  const renameLayer = (id: string, name: string) => commit({ layers: asset.layers.map(l => (l.id === id ? { ...l, name } : l)) });
  const addLayer = (rect?: Msx2TransitionRect) => {
    const layer = createLayer(asset.layers, rect);
    commit({ layers: [...asset.layers, layer] });
    setSelectedLayerId(layer.id);
    return layer;
  };
  const deleteLayer = (id: string) => {
    const out = removeLayerFromAsset(asset, id);
    commit({ layers: out.layers, steps: out.steps });
    setSelectedLayerId(null);
    if (out.removedClips) setStatusBarMessage?.(`Capa borrada junto con ${out.removedClips} clip(s) que la usaban.`);
  };

  const toImage = (e: React.PointerEvent): { x: number; y: number } => {
    const box = stageRef.current!.getBoundingClientRect();
    return { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale };
  };

  const beginDrag = (e: React.PointerEvent, layerId: string, mode: RectHandle) => {
    const layer = asset.layers.find(l => l.id === layerId);
    if (!layer || selectMode) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    stageRef.current?.focus({ preventScroll: true });
    setSelectedLayerId(layerId);
    setDrag({ layerId, mode, startX: e.clientX, startY: e.clientY, orig: layer.rect, current: layer.rect });
  };
  const onStagePointerDown = (e: React.PointerEvent) => {
    if (playing) return;
    if (selectMode) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const p = toImage(e);
      setBand({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    } else {
      setSelectedLayerId(null);
    }
  };
  const onStagePointerMove = (e: React.PointerEvent) => {
    if (band) { const p = toImage(e); setBand({ ...band, x1: p.x, y1: p.y }); return; }
    if (!drag) return;
    const dx = Math.round((e.clientX - drag.startX) / scale);
    const dy = Math.round((e.clientY - drag.startY) / scale);
    setDrag({ ...drag, current: applyLayerDrag(drag.orig, drag.mode, dx, dy, snap) });
  };
  const onStagePointerUp = () => {
    if (band) {
      const raw = rectFromCorners(band.x0, band.y0, band.x1, band.y1);
      setBand(null);
      setSelectMode(false);
      if (!raw) { setStatusBarMessage?.('Selección demasiado pequeña: arrastra un rectángulo de al menos 2x1 píxeles.'); return; }
      let rect = raw;
      if (fitContent && image) {
        const tight = shrinkRectToContent(image, raw);
        if (!tight) { setStatusBarMessage?.('La selección solo contiene negro: no se crea la capa.'); return; }
        rect = tight;
      }
      const layer = addLayer(rect);
      setStatusBarMessage?.(`Capa «${layer.name}» creada: x${rect.x} y${rect.y} ${rect.w}x${rect.h}.`);
      return;
    }
    if (!drag) return;
    const { layerId, current, orig } = drag;
    setDrag(null);
    if (current.x === orig.x && current.y === orig.y && current.w === orig.w && current.h === orig.h) return;
    setLayerRect(layerId, current);
  };
  const onStageKey = (e: React.KeyboardEvent) => {
    if (playing) return;
    if (e.key === 'Escape') { setSelectMode(false); setBand(null); setSelectedLayerId(null); return; }
    if (!selectedLayer) return;
    const stepPx = e.shiftKey ? snap * 4 : snap;
    const nudge = (dx: number, dy: number) => { setLayerRect(selectedLayer.id, applyLayerDrag(selectedLayer.rect, 'move', dx, dy, 2)); e.preventDefault(); };
    if (e.key === 'ArrowLeft') nudge(-stepPx, 0);
    else if (e.key === 'ArrowRight') nudge(stepPx, 0);
    else if (e.key === 'ArrowUp') nudge(0, -stepPx);
    else if (e.key === 'ArrowDown') nudge(0, stepPx);
    else if (e.key === 'Delete') { e.preventDefault(); deleteLayer(selectedLayer.id); }
  };
  const shownRect = (layerId: string, fallback: Msx2TransitionRect) => (drag && drag.layerId === layerId ? drag.current : fallback);

  // ---- presets -------------------------------------------------------------------------------------
  const sourceId = asset.sourcePresentationAssetId;
  const applyBackToMars = () => {
    if (!image) { setStatusBarMessage?.('Elige primero la presentación.'); return; }
    const preset = createLogoDropPreset({
      sourcePresentationAssetId: sourceId,
      logo: BACK_TO_MARS_LOGO,
      alien: BACK_TO_MARS_ALIEN,
      whooshSoundId: whooshId || undefined,
      thudSoundId: thudId || undefined,
    });
    commit({ layers: preset.layers, steps: presetKeyWait ? preset.steps : stripTrailingKeyWait(preset.steps), skippable: preset.skippable });
    setSelectedLayerId(null);
    setSelectedClipId(null);
    setStatusBarMessage?.(`Preset aplicado: el alien aparece con un fundido y el logo cae con rebote${presetKeyWait ? ' y después se espera una tecla' : '; la espera de tecla la hace el nodo del GameFlow'}. Ctrl+Z lo deshace.`);
  };
  const applyLogoDropToSelection = () => {
    const layer = selectedLayer ?? asset.layers[0];
    if (!layer) { setStatusBarMessage?.('Crea o selecciona una capa: es la que caerá.'); return; }
    const preset = createLogoDropPreset({ sourcePresentationAssetId: sourceId, logo: layer.rect, whooshSoundId: whooshId || undefined, thudSoundId: thudId || undefined });
    const steps = (presetKeyWait ? preset.steps : stripTrailingKeyWait(preset.steps)).map(step => ({ ...step, clips: step.clips.map(c => (c.target === 'layer_logo' ? { ...c, target: layer.id } : c)) }));
    commit({ steps });
    setSelectedClipId(null);
    setStatusBarMessage?.(`«${layer.name}» cae con rebote${whooshId || thudId ? ' con sonido' : ''}${presetKeyWait ? ', y después se espera una tecla' : ''}. Los pasos anteriores se han sustituido (Ctrl+Z los recupera).`);
  };

  // ---- audio -----------------------------------------------------------------------------------------
  const synthRef = useRef<AYRegisterSynthesizer | null>(null);
  const audioOkRef = useRef(false);
  const ensureSynth = async (): Promise<AYRegisterSynthesizer | null> => {
    if (typeof window === 'undefined' || !(window.AudioContext || (window as any).webkitAudioContext)) {
      setAudioNote('Sin audio: este navegador no ofrece AudioContext; el Play se ve pero no suena.');
      return null;
    }
    if (!synthRef.current) synthRef.current = new AYRegisterSynthesizer(0.5);
    try {
      audioOkRef.current = await synthRef.current.ensureAudioContext();
    } catch {
      audioOkRef.current = false;
    }
    setAudioNote(audioOkRef.current ? '' : 'Sin audio: no se pudo abrir el AudioContext; el Play se ve pero no suena.');
    return audioOkRef.current ? synthRef.current : null;
  };
  const silence = () => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.pokeRegisters([{ reg: 10, value: 0 }]);
    synth.stopAllNotes();
  };

  const soundTimerRef = useRef<number | null>(null);
  const previewSound = async (soundAssetId: string) => {
    const sound = soundAssets.find(a => a.id === soundAssetId);
    const compiled = sound ? compilePsgOneShotRecords(sound.data as PSGSoundData) : undefined;
    if (!sound || !compiled) { setStatusBarMessage?.('Ese sonido no existe o no tiene pasos reproducibles.'); return; }
    if (soundTimerRef.current !== null) { window.clearInterval(soundTimerRef.current); soundTimerRef.current = null; }
    const synth = await ensureSynth();
    if (!synth) return;
    const schedule = soundPreviewSchedule(compiled.records);
    const t0 = performance.now();
    let next = 0;
    soundTimerRef.current = window.setInterval(() => {
      const due = Math.floor((performance.now() - t0) / FX_TICK_MS);
      while (next <= due && next < schedule.length) { synth.pokeRegisters(schedule[next]); next++; }
      if (next >= schedule.length && soundTimerRef.current !== null) { window.clearInterval(soundTimerRef.current); soundTimerRef.current = null; }
    }, 4);
  };

  // ---- play --------------------------------------------------------------------------------------------
  const playerRef = useRef<FxPlayer | null>(null);
  const keyHeldRef = useRef(false);
  const keyLatchRef = useRef(false);
  const playheadRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const waitRef = useRef<HTMLDivElement>(null);
  const totalTicks = timelineModel?.totalTicks ?? 0;

  const stopPlay = useCallback(() => {
    playerRef.current = null;
    keyHeldRef.current = false;
    keyLatchRef.current = false;
    if (playheadRef.current) playheadRef.current.style.display = 'none';
    if (readoutRef.current) readoutRef.current.textContent = '';
    if (borderRef.current) borderRef.current.style.background = 'transparent';
    setPhase('idle');
    silence();
  }, []);

  const startPlay = async () => {
    if (!result || result.errors.length || !result.derived) return;
    stopPlay();
    if (soundTimerRef.current !== null) { window.clearInterval(soundTimerRef.current); soundTimerRef.current = null; }
    if (result.soundEvents.length) await ensureSynth();
    silence();
    setSoundLog([]);
    setSelectedLayerId(null);
    playerRef.current = createFxPlayer(result.bytes, result.derived.pixels, performance.now());
    if (playheadRef.current) playheadRef.current.style.display = 'block';
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') return;
    const nameOfTable = new Map(result?.soundEvents.map(e => [e.tableIndex, soundOptions.find(o => o.id === e.soundAssetId)?.name ?? e.soundAssetId]) ?? []);
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.code === 'Escape') { stopPlay(); return; }
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') { if (!e.repeat) { keyHeldRef.current = true; keyLatchRef.current = true; } e.preventDefault(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      keyHeldRef.current = false;
      // A focused button (Play / Stop) must not be "clicked" by the Space that skips the animation.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      const canvas = canvasRef.current;
      if (!player || !canvas) return;
      const adv = player.advance(performance.now(), keyHeldRef.current || keyLatchRef.current);
      if (adv.steps.length) keyLatchRef.current = false;
      const synth = audioOkRef.current ? synthRef.current : null;
      for (const step of adv.steps) {
        if (step.psgWrites.length) synth?.pokeRegisters(step.psgWrites);
        if (step.sfxIds.length) {
          const r10 = synth ? synth.getRegister(10) : null;
          setSoundLog(log => [...log, ...step.sfxIds.map(id => ({ tick: step.tick, name: nameOfTable.get(id) ?? `#${id}`, r10 }))]);
        }
      }
      if (adv.steps.length || adv.done) {
        const dec = player.dec;
        paintRgba(renderDecoderRgba(dec, frameBufRef.current));
        if (borderRef.current) borderRef.current.style.background = backdropCss(dec);
        if (playheadRef.current && totalTicks) playheadRef.current.style.left = playheadLeft(dec.tick, totalTicks);
        if (readoutRef.current) readoutRef.current.textContent = `tick ${dec.tick} · ${(dec.tick / 60).toFixed(2)} s${dec.skipped ? ' · saltado' : ''}`;
        if (waitRef.current) waitRef.current.style.display = dec.waitKeyPhase >= 0 && !dec.done ? 'block' : 'none';
      }
      if (adv.done) { window.clearInterval(timer); setPhase('done'); }
    }, 4);
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [phase, result, soundOptions, stopPlay, totalTicks]);

  useEffect(() => () => {
    if (soundTimerRef.current !== null) window.clearInterval(soundTimerRef.current);
    const synth = synthRef.current;
    synthRef.current = null;
    void synth?.closeContext();
  }, []);

  // Leaving Play on any structural edit keeps the monitor honest.
  useEffect(() => { if (phase !== 'idle') stopPlay(); }, [asset]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- render --------------------------------------------------------------------------------------------
  const W = FX_SCREEN_W * scale;
  const H = FX_SCREEN_H * scale;
  const rectStyle = (r: Msx2TransitionRect): React.CSSProperties => ({ left: r.x * scale, top: r.y * scale, width: r.w * scale, height: r.h * scale });
  const sourceMissing = !!asset.sourcePresentationAssetId && !presentations.some(p => p.id === asset.sourcePresentationAssetId);
  const bandRect = band ? rectFromCorners(band.x0, band.y0, band.x1, band.y1) : null;

  return (
    <div className="flex h-full gap-2 p-2 overflow-auto text-msx-textprimary">
      {/* Source, layers, presets */}
      <div className="flex flex-col gap-2 w-56 shrink-0">
        <Panel title="Presentación">
          <div className="flex flex-col gap-1.5 p-1">
            <select className={inputCls} value={asset.sourcePresentationAssetId} onChange={e => commit({ sourcePresentationAssetId: e.target.value })} title="Imagen sobre la que actúa el efecto">
              <option value="">(elige una)</option>
              {sourceMissing && <option value={asset.sourcePresentationAssetId}>{asset.sourcePresentationAssetId} (no existe)</option>}
              {presentations.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {presentations.length === 0 && <div className="text-xs text-amber-300">No hay presentaciones. Crea una «SCREEN 5 Presentation» e importa la imagen.</div>}
            <label className="flex items-center gap-1 text-xs text-msx-textsecondary" title="Con SPACE / disparo la animación salta al estado final">
              <input type="checkbox" checked={asset.skippable} onChange={e => commit({ skippable: e.target.checked })} />saltable con tecla
            </label>
          </div>
        </Panel>

        <Panel
          title={`Capas (${asset.layers.length})`}
          headerButtons={<Button size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4" />} onClick={() => addLayer()} title="Capa nueva en un hueco libre">Capa</Button>}
        >
          <div className="flex flex-col gap-1 p-1">
            {asset.layers.map((layer, i) => (
              <div key={layer.id} className={`flex items-center gap-1 border rounded px-1 py-0.5 text-xs cursor-pointer ${selectedLayerId === layer.id ? 'border-msx-accent bg-msx-accent/20' : 'border-msx-border'}`} onClick={() => setSelectedLayerId(layer.id)}>
                <span className="inline-block w-2 h-3" style={{ background: LAYER_COLORS[i % LAYER_COLORS.length] }} />
                <span className="truncate flex-1">{layer.name}</span>
                {overlapIds.has(layer.id) && <span title="Se solapa con otra capa (deben ser disjuntas)" className="text-red-400">⚠</span>}
                {layerOutsidePicture(layer) && <span title="Se sale de la imagen" className="text-red-400">⚠</span>}
              </div>
            ))}
            {asset.layers.length === 0 && <div className="text-[10px] text-msx-textsecondary">Sin capas. Usa «Desde selección» y arrastra sobre la imagen, o «+ Capa».</div>}
            <div className="flex items-center gap-1 flex-wrap">
              <Button size="sm" variant={selectMode ? 'secondary' : 'ghost'} onClick={() => { setSelectMode(m => !m); setBand(null); }} title="Arrastra un rectángulo sobre la imagen para crear una capa (x y anchura se ajustan a pares)">
                {selectMode ? 'Arrastra sobre la imagen…' : 'Desde selección'}
              </Button>
              <label className="flex items-center gap-1 text-[10px] text-msx-textsecondary" title="Recorta la selección al contenido no negro">
                <input type="checkbox" checked={fitContent} onChange={e => setFitContent(e.target.checked)} />ajustar al contenido
              </label>
            </div>
          </div>
        </Panel>

        {selectedLayer && (
          <Panel title={`Capa: ${selectedLayer.name}`} headerButtons={<button className="text-msx-danger" title="Borrar capa (y sus clips)" onClick={() => deleteLayer(selectedLayer.id)}><TrashIcon className="w-4 h-4" /></button>}>
            <div className="flex flex-col gap-1.5 p-1">
              <input className={inputCls} value={selectedLayer.name} onChange={e => renameLayer(selectedLayer.id, e.target.value)} title="Nombre de la capa" />
              <div className="grid grid-cols-2 gap-1">
                <NumField label="x" value={selectedLayer.rect.x} min={0} max={254} step={2} onChange={v => setLayerRect(selectedLayer.id, snapLayerRect({ ...selectedLayer.rect, x: v }))} title="x par (SCREEN 5 guarda 2 px por byte)" />
                <NumField label="y" value={selectedLayer.rect.y} min={0} max={211} onChange={v => setLayerRect(selectedLayer.id, snapLayerRect({ ...selectedLayer.rect, y: v }))} />
                <NumField label="w" value={selectedLayer.rect.w} min={2} max={256} step={2} onChange={v => setLayerRect(selectedLayer.id, snapLayerRect({ ...selectedLayer.rect, w: v }))} title="Anchura par" />
                <NumField label="h" value={selectedLayer.rect.h} min={1} max={212} onChange={v => setLayerRect(selectedLayer.id, snapLayerRect({ ...selectedLayer.rect, h: v }))} />
              </div>
              <Button size="sm" variant="ghost" disabled={!image} onClick={() => {
                const tight = image ? shrinkRectToContent(image, selectedLayer.rect) : null;
                if (!tight) { setStatusBarMessage?.('La capa solo contiene negro: no hay nada que ajustar.'); return; }
                setLayerRect(selectedLayer.id, tight);
              }}>Ajustar al contenido</Button>
              <div className="text-[10px] text-msx-textsecondary">x y anchura se mantienen pares. Flechas: mover (Mayús = ×4). Supr: borrar.</div>
            </div>
          </Panel>
        )}

        <Panel title="Presets">
          <div className="flex flex-col gap-1.5 p-1">
            {soundOptions.length === 0
              ? <div className="text-[10px] text-msx-textsecondary">No hay sonidos en el proyecto: el preset se aplica sin sonido. Crea uno en Sound Editor.</div>
              : (
                <>
                  <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Whoosh</span>
                    <select className={`${inputCls} flex-1 min-w-0`} value={whooshId} onChange={e => setWhooshId(e.target.value)}>
                      <option value="">(sin sonido)</option>
                      {soundOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Golpe</span>
                    <select className={`${inputCls} flex-1 min-w-0`} value={thudId} onChange={e => setThudId(e.target.value)}>
                      <option value="">(sin sonido)</option>
                      {soundOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </label>
                </>
              )}
            <label className="flex items-center gap-1 text-[10px] text-msx-textsecondary" title="El nodo Screen5Presentation del GameFlow ya espera una tecla tras el efecto: con las dos esperas se piden dos pulsaciones.">
              <input type="checkbox" checked={presetKeyWait} onChange={e => setPresetKeyWait(e.target.checked)} />terminar con espera de tecla (el nodo ya espera una)
            </label>
            <Button size="sm" variant="secondary" disabled={!image} onClick={applyBackToMars} title="Alien con fundido (32 fr) + logo que cae con rebote (40 fr) con whoosh y golpe (+ espera de tecla si lo marcas). Capas: logo 4,12 250x53 y alien 68,65 104x136 (Back to Mars).">Preset Back to Mars</Button>
            <Button size="sm" variant="ghost" onClick={applyLogoDropToSelection} title="La capa seleccionada cae desde arriba con rebote, whoosh al empezar y golpe al aterrizar (+ espera de tecla si lo marcas). Sustituye los pasos.">Logo cae (capa seleccionada)</Button>
          </div>
        </Panel>
      </div>

      {/* Canvas, timeline, cost */}
      <div className="flex flex-col gap-2 shrink-0" style={{ minWidth: W + 18 }}>
        <Panel
          title="Imagen 256x212"
          headerButtons={(
            <div className="flex items-center gap-1">
              {playing
                ? <Button size="sm" variant="danger" icon={<StopIcon className="w-4 h-4" />} onClick={stopPlay} title="Esc">Stop</Button>
                : <Button size="sm" variant="secondary" icon={<PlayIcon className="w-4 h-4" />} onClick={() => { void startPlay(); }} disabled={!canPlay} title={canPlay ? 'Compila y reproduce el bloque en el modelo del VDP a 60 Hz' : 'Corrige los errores para poder reproducir'}>Play</Button>}
              <Button size="sm" variant="ghost" icon={<ArrowPathIcon className="w-4 h-4" />} onClick={() => { void startPlay(); }} disabled={!canPlay || !playing} title="Vuelve a empezar">Reiniciar</Button>
            </div>
          )}
        >
          <div className="p-1 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3 text-xs text-msx-textsecondary">
              <label className="flex items-center gap-1">Zoom
                <select className={inputCls} value={scale} onChange={e => setScale(Number(e.target.value))}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}x</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1">Snap
                <select className={inputCls} value={snap} onChange={e => setSnap(Number(e.target.value))}>
                  {[2, 4, 8, 16].map(v => <option key={v} value={v}>{v}px</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1">Vista
                <select className={inputCls} value={view} onChange={e => setView(e.target.value as View)} disabled={playing}>
                  <option value="original">Original</option>
                  <option value="derived">Imagen derivada (final)</option>
                  <option value="diff">Diferencias (px alterados)</option>
                </select>
              </label>
              {phase === 'running' && <span>Espacio / clic: saltar o avanzar · Esc: parar</span>}
              {phase === 'done' && <span className="text-emerald-300">Terminado: es la imagen final del ROM</span>}
            </div>
            <div ref={borderRef} className="p-2 self-start" style={{ background: 'transparent' }}>
              <div
                ref={stageRef}
                tabIndex={0}
                onKeyDown={onStageKey}
                className="relative select-none outline-none"
                style={{ width: W, height: H, cursor: selectMode ? 'crosshair' : 'default' }}
                onPointerDown={onStagePointerDown}
                onPointerMove={onStagePointerMove}
                onPointerUp={onStagePointerUp}
                onPointerCancel={onStagePointerUp}
              >
                <canvas ref={canvasRef} width={FX_SCREEN_W} height={FX_SCREEN_H} style={{ width: W, height: H, imageRendering: 'pixelated' }} className="border border-msx-border" />
                {playing && (
                  <div
                    className="absolute inset-0"
                    onPointerDown={e => { e.stopPropagation(); keyHeldRef.current = true; keyLatchRef.current = true; }}
                    onPointerUp={() => { keyHeldRef.current = false; }}
                    onPointerLeave={() => { keyHeldRef.current = false; }}
                  >
                    <div ref={waitRef} className="absolute left-1 bottom-1 bg-black/70 text-amber-300 text-[10px] px-1 rounded" style={{ display: 'none' }}>Esperando tecla (Espacio / clic)</div>
                  </div>
                )}
                {!playing && asset.layers.map((layer, i) => {
                  const r = shownRect(layer.id, layer.rect);
                  const sel = selectedLayerId === layer.id;
                  const bad = overlapIds.has(layer.id) || layerOutsidePicture(layer) || (drag?.layerId === layer.id && rectOverlapsLayers(r, asset.layers, layer.id));
                  const color = bad ? '#ef4444' : LAYER_COLORS[i % LAYER_COLORS.length];
                  return (
                    <div
                      key={layer.id}
                      className="absolute"
                      style={{ ...rectStyle(r), border: `${sel ? 2 : 1}px ${sel ? 'solid' : 'dashed'} ${color}`, cursor: selectMode ? 'crosshair' : 'move', pointerEvents: selectMode ? 'none' : 'auto', boxSizing: 'border-box' }}
                      onPointerDown={e => beginDrag(e, layer.id, 'move')}
                    >
                      <span className="absolute left-0 top-0 text-[9px] px-0.5 leading-tight pointer-events-none text-black" style={{ background: color }}>{layer.name}</span>
                      {sel && HANDLES.map(h => (
                        <div key={h.mode} className="absolute w-2 h-2 border border-black" style={{ ...h.style, background: color, cursor: h.cursor }} onPointerDown={e => beginDrag(e, layer.id, h.mode)} />
                      ))}
                    </div>
                  );
                })}
                {!playing && bandRect && <div className="absolute pointer-events-none" style={{ ...rectStyle(bandRect), border: '1px dashed #fff', background: 'rgba(255,255,255,0.15)' }} />}
              </div>
            </div>
            {drag && <div className="text-xs text-msx-textsecondary">x {drag.current.x}  y {drag.current.y}  w {drag.current.w}  h {drag.current.h}</div>}
            {audioNote && <div className="text-xs text-amber-300">{audioNote}</div>}
            {soundLog.length > 0 && (
              <div className="text-[10px] text-msx-textsecondary" data-testid="fx-sound-log">
                {soundLog.map((s, i) => <span key={i} className="mr-3">♪ tick {s.tick} ({(s.tick / 60).toFixed(2)} s) {s.name}{s.r10 !== null ? ` · R10=${s.r10}` : ''}</span>)}
              </div>
            )}
          </div>
        </Panel>

        {(errors.length > 0 || warnings.length > 0) && (
          <Panel title={`Avisos y errores (${errors.length} / ${warnings.length})`}>
            <ul className="p-1 text-xs list-disc pl-5">
              {errors.map((m, i) => <li key={`e${i}`} className="text-red-300">{m}</li>)}
              {warnings.map((m, i) => <li key={`w${i}`} className="text-amber-300">{m}</li>)}
            </ul>
          </Panel>
        )}
        <TransitionTimeline model={timelineModel} selectedClipId={selectedClipId} onSelectClip={setSelectedClipId} playheadRef={playheadRef} readoutRef={readoutRef} />
        <TransitionCostMeter model={timelineModel} />
      </div>

      {/* Steps, clips and palette */}
      <div className="flex flex-col gap-2 min-w-[380px] flex-1">
        <TransitionStepsPanel
          asset={asset}
          soundOptions={soundOptions}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onChange={commit}
          onPreviewSound={id => { void previewSound(id); }}
          keyWaitConflict={keyWaitConflicts.length > 0}
        />
        <TransitionPalettePanel image={image} plan={plan} asset={asset} view={view} onView={setView} onChange={commit} />
      </div>
    </div>
  );
};
