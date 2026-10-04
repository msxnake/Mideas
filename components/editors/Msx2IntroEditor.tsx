import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Msx2IntroAsset,
  Msx2IntroImage,
  Msx2IntroRect,
  Msx2IntroSlide,
  Msx2IntroStep,
  Msx2IntroTextZone,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../../types';
import { MSX_SCREEN5_MASTER_PALETTE } from '../../constants';
import { assignMasterColorToSlot, ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import {
  clampInt,
  composeIntroSlide,
  createIntroImage,
  createIntroSlide,
  createIntroStep,
  createIntroTextZone,
  drawIntroBuffer,
  createWaitMarkerSave,
  defaultIntroMono,
  introImageRomBytes,
  paintWaitMarker,
  restoreWaitMarker,
  type WaitMarkerSave,
  drawZoneText,
  fillRect,
  INTRO_MAX_LINE_SPACING,
  INTRO_MIN_LINE_SPACING,
  INTRO_SCREEN_H,
  INTRO_SCREEN_W,
  initialIntroPlayerState,
  layoutZoneText,
  newIntroId,
  normalizeCropRect,
  normalizeScreenRect,
  resolveIntroFont,
  resolveIntroImageSource,
  scaleSlotsBrightness,
  type IntroFont,
  stepIntroPlayer,
  validateIntroMusic,
  validateIntroSlide,
  type IntroPlayerState,
} from '../../utils/msx2IntroUtils';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PencilIcon, PlayIcon, PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';

/**
 * Editor for 'msx2intro' assets: illustrated SCREEN 5 slides. Every slide is a
 * 256x192 canvas with a background colour, images (crop of a presentation
 * scaled into a screen rectangle) and text zones, plus an ordered list of
 * typewriter steps. Rectangles are dragged/resized on the canvas or typed in
 * the side panel; "Play" runs the same state machine the Z80 runtime will use.
 */

interface Msx2IntroEditorProps {
  intro: Msx2IntroAsset;
  onUpdate: (data: Partial<Msx2IntroAsset>) => void;
  allAssets: ProjectAsset[];
  setStatusBarMessage?: (message: string) => void;
}

type Selection = { kind: 'image' | 'zone'; id: string } | null;
type HandleMode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface DragState {
  kind: 'image' | 'zone';
  id: string;
  mode: HandleMode;
  startX: number;
  startY: number;
  orig: Msx2IntroRect;
  current: Msx2IntroRect;
}

const HANDLES: Array<{ mode: HandleMode; style: React.CSSProperties; cursor: string }> = [
  { mode: 'nw', style: { left: -4, top: -4 }, cursor: 'nwse-resize' },
  { mode: 'n', style: { left: '50%', top: -4, marginLeft: -4 }, cursor: 'ns-resize' },
  { mode: 'ne', style: { right: -4, top: -4 }, cursor: 'nesw-resize' },
  { mode: 'e', style: { right: -4, top: '50%', marginTop: -4 }, cursor: 'ew-resize' },
  { mode: 'se', style: { right: -4, bottom: -4 }, cursor: 'nwse-resize' },
  { mode: 's', style: { left: '50%', bottom: -4, marginLeft: -4 }, cursor: 'ns-resize' },
  { mode: 'sw', style: { left: -4, bottom: -4 }, cursor: 'nesw-resize' },
  { mode: 'w', style: { left: -4, top: '50%', marginTop: -4 }, cursor: 'ew-resize' },
];

const inputCls = 'bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs text-msx-textprimary';

const applyDrag = (orig: Msx2IntroRect, mode: HandleMode, dx: number, dy: number, snap: number, minW = 2, minH = 1): Msx2IntroRect => {
  const s = (v: number) => Math.round(v / snap) * snap;
  let left = orig.x;
  let top = orig.y;
  let right = orig.x + orig.w;
  let bottom = orig.y + orig.h;
  if (mode === 'move') {
    const nx = s(orig.x + dx);
    const ny = s(orig.y + dy);
    return normalizeScreenRect({ x: nx, y: ny, w: orig.w, h: orig.h });
  }
  if (mode.includes('w')) left = s(orig.x + dx);
  if (mode.includes('e')) right = s(orig.x + orig.w + dx);
  if (mode.includes('n')) top = s(orig.y + dy);
  if (mode.includes('s')) bottom = s(orig.y + orig.h + dy);
  // Clamp the moving edges to the screen first so dragging past a border
  // resizes against it instead of shifting the whole rectangle.
  left = Math.max(0, Math.min(INTRO_SCREEN_W, left));
  right = Math.max(0, Math.min(INTRO_SCREEN_W, right));
  top = Math.max(0, Math.min(INTRO_SCREEN_H, top));
  bottom = Math.max(0, Math.min(INTRO_SCREEN_H, bottom));
  if (mode.includes('w')) left = Math.min(left, right - minW);
  else right = Math.max(right, left + minW);
  if (mode.includes('n')) top = Math.min(top, bottom - minH);
  else bottom = Math.max(bottom, top + minH);
  return normalizeScreenRect({ x: left, y: top, w: right - left, h: bottom - top }, minW, minH);
};

/** Numeric field that keeps its own text while typing and commits (clamped) on blur / Enter. */
const NumField: React.FC<{ label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, onChange }) => {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const parsed = Number(text);
    setText(null);
    if (text.trim() !== '' && Number.isFinite(parsed)) onChange(clampInt(parsed, min, max, value));
  };
  return (
    <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
      <span className="w-8">{label}</span>
      <input
        type="number"
        className={`${inputCls} w-16`}
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

const SlotSelect: React.FC<{ label: string; value: number; palette: Screen5PaletteSlot[]; onChange: (v: number) => void }> = ({ label, value, palette, onChange }) => (
  <div className="flex items-center gap-1 text-xs text-msx-textsecondary">
    <span className="w-14">{label}</span>
    <div className="flex flex-wrap gap-0.5">
      {palette.map((slot, i) => (
        <button
          key={i}
          type="button"
          title={`Slot ${i}`}
          onClick={() => onChange(i)}
          className={`w-4 h-4 border ${value === i ? 'border-msx-accent ring-1 ring-msx-accent' : 'border-msx-border'}`}
          style={{ background: slot.hex === 'rgba(0,0,0,0)' ? 'repeating-conic-gradient(#666 0% 25%, #222 0% 50%) 50%/8px 8px' : slot.hex }}
        />
      ))}
    </div>
  </div>
);

export const Msx2IntroEditor: React.FC<Msx2IntroEditorProps> = ({ intro, onUpdate, allAssets, setStatusBarMessage }) => {
  const slides = useMemo(() => (Array.isArray(intro.slides) && intro.slides.length ? intro.slides : [createIntroSlide('Slide 1')]), [intro.slides]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selection, setSelection] = useState<Selection>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [scale, setScale] = useState(3);
  const [snap, setSnap] = useState(2);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [paletteSlot, setPaletteSlot] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const slide: Msx2IntroSlide = slides[Math.min(slideIndex, slides.length - 1)];
  const palette = useMemo(() => ensureScreen5PaletteSlots(slide.palette).slots, [slide.palette]);
  const presentations = useMemo(() => allAssets.filter(a => a.type === 'msx2presentation'), [allAssets]);

  // ---- data mutation ------------------------------------------------------
  const commitSlides = useCallback((next: Msx2IntroSlide[]) => onUpdate({ slides: next }), [onUpdate]);

  const updateSlide = useCallback((patch: Partial<Msx2IntroSlide>) => {
    commitSlides(slides.map(s => (s.id === slide.id ? { ...s, ...patch } : s)));
  }, [commitSlides, slides, slide.id]);

  const updateImage = (id: string, patch: Partial<Msx2IntroImage>) =>
    updateSlide({ images: slide.images.map(i => (i.id === id ? { ...i, ...patch } : i)) });
  const updateZone = (id: string, patch: Partial<Msx2IntroTextZone>) =>
    updateSlide({ textZones: slide.textZones.map(z => (z.id === id ? { ...z, ...patch } : z)) });
  const updateStep = (id: string, patch: Partial<Msx2IntroStep>) =>
    updateSlide({ steps: slide.steps.map(s => (s.id === id ? { ...s, ...patch } : s)) });

  const moveItem = <T,>(list: T[], index: number, delta: number): T[] => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    const copy = list.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  };

  // ---- slides -------------------------------------------------------------
  const addSlide = () => {
    commitSlides([...slides, createIntroSlide(`Slide ${slides.length + 1}`)]);
    setSlideIndex(slides.length);
    setSelection(null);
  };
  const duplicateSlide = () => {
    const idMap = new Map<string, string>();
    const zones = slide.textZones.map(z => { const id = newIntroId('zone'); idMap.set(z.id, id); return { ...z, id, rect: { ...z.rect } }; });
    const copy: Msx2IntroSlide = {
      ...slide,
      id: newIntroId('slide'),
      name: `${slide.name} copy`,
      palette: slide.palette.map(p => ({ ...p })),
      images: slide.images.map(i => ({ ...i, id: newIntroId('img'), crop: { ...i.crop }, dest: { ...i.dest } })),
      textZones: zones,
      steps: slide.steps.map(s => ({ ...s, id: newIntroId('step'), zoneId: idMap.get(s.zoneId) ?? s.zoneId })),
    };
    const next = slides.slice();
    next.splice(slideIndex + 1, 0, copy);
    commitSlides(next);
    setSlideIndex(slideIndex + 1);
    setSelection(null);
  };
  const deleteSlide = () => {
    if (slides.length <= 1) { setStatusBarMessage?.('An intro needs at least one slide.'); return; }
    commitSlides(slides.filter(s => s.id !== slide.id));
    setSlideIndex(Math.max(0, slideIndex - 1));
    setSelection(null);
  };

  // ---- composed preview (edit mode) --------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const editBuffer = useMemo(() => {
    const buf = composeIntroSlide(slide, allAssets);
    slide.textZones.forEach(zone => {
      fillRect(buf, zone.rect, zone.bg);
      const step = slide.steps.find(s => s.id === selectedStepId && s.zoneId === zone.id)
        ?? slide.steps.find(s => s.zoneId === zone.id);
      if (step) {
        const font = resolveIntroFont(allAssets, zone.fontAssetId, intro.fontAssetId).font;
        const layout = layoutZoneText(zone, step.text, font);
        drawZoneText(buf, zone, layout, layout.totalChars, font);
      }
    });
    return buf;
  }, [slide, allAssets, selectedStepId, intro.fontAssetId]);

  useEffect(() => {
    if (playing || !canvasRef.current) return;
    drawIntroBuffer(canvasRef.current, editBuffer, palette, scale);
  }, [editBuffer, palette, scale, playing]);

  // ---- drag ---------------------------------------------------------------
  const rectOf = (kind: 'image' | 'zone', id: string): Msx2IntroRect | null => {
    if (kind === 'image') return slide.images.find(i => i.id === id)?.dest ?? null;
    return slide.textZones.find(z => z.id === id)?.rect ?? null;
  };

  const beginDrag = (e: React.PointerEvent, kind: 'image' | 'zone', id: string, mode: HandleMode) => {
    const orig = rectOf(kind, id);
    if (!orig) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    stageRef.current?.focus({ preventScroll: true }); // arrow keys / Delete act on the selection
    setSelection({ kind, id });
    setDrag({ kind, id, mode, startX: e.clientX, startY: e.clientY, orig, current: orig });
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = Math.round((e.clientX - drag.startX) / scale);
    const dy = Math.round((e.clientY - drag.startY) / scale);
    setDrag({ ...drag, current: drag.kind === 'zone' ? applyDrag(drag.orig, drag.mode, dx, dy, snap, 6, 8) : applyDrag(drag.orig, drag.mode, dx, dy, snap) });
  };

  const endDrag = () => {
    if (!drag) return;
    const { kind, id, current, orig } = drag;
    setDrag(null);
    if (current.x === orig.x && current.y === orig.y && current.w === orig.w && current.h === orig.h) return;
    if (kind === 'image') updateImage(id, { dest: current });
    else updateZone(id, { rect: current });
  };

  const shownRect = (kind: 'image' | 'zone', id: string, fallback: Msx2IntroRect): Msx2IntroRect =>
    drag && drag.kind === kind && drag.id === id ? drag.current : fallback;

  // ---- keyboard: nudge / delete the selected element ---------------------------
  // Arrows move by the snap step (Shift = 4 steps), Delete removes the element, Escape deselects.
  const onStageKey = (e: React.KeyboardEvent) => {
    if (playing || !selection) return;
    const stepPx = e.shiftKey ? snap * 4 : snap;
    const nudge = (dx: number, dy: number) => {
      const r = rectOf(selection.kind, selection.id);
      if (!r) return;
      const next = normalizeScreenRect({ ...r, x: r.x + dx, y: r.y + dy }, 2, 1);
      if (selection.kind === 'image') updateImage(selection.id, { dest: next });
      else updateZone(selection.id, { rect: next });
      e.preventDefault();
    };
    if (e.key === 'ArrowLeft') nudge(-stepPx, 0);
    else if (e.key === 'ArrowRight') nudge(stepPx, 0);
    else if (e.key === 'ArrowUp') nudge(0, -stepPx);
    else if (e.key === 'ArrowDown') nudge(0, stepPx);
    else if (e.key === 'Delete') {
      e.preventDefault();
      if (selection.kind === 'image') deleteImage(selection.id);
      else deleteZone(selection.id);
    } else if (e.key === 'Escape') setSelection(null);
  };

  // ---- play ---------------------------------------------------------------
  const playBufRef = useRef<Uint8Array | null>(null);
  const playStateRef = useRef<IntroPlayerState>(initialIntroPlayerState());
  const pressedRef = useRef(false);
  const playSlideRef = useRef(0);
  const frameRef = useRef(0);

  const fontFor = useCallback(
    (zone: Msx2IntroTextZone) => resolveIntroFont(allAssets, zone.fontAssetId, intro.fontAssetId).font,
    [allAssets, intro.fontAssetId],
  );
  const fontForRef = useRef(fontFor);
  fontForRef.current = fontFor;
  const playSlidesRef = useRef<Msx2IntroSlide[]>([]);
  const markerRef = useRef<WaitMarkerSave>(createWaitMarkerSave());
  /** Palette fade of the play session: 7 steps of 2 frames, like the ROM (in: levels 1..7, out: 6..0). */
  const fadeRef = useRef<{ phase: 'in' | 'out'; frame: number } | null>(null);

  /** Fresh screen for slide `index` of the play session; step 0 starts already painted like any other step. */
  const beginPlaySlide = (index: number) => {
    const target = playSlidesRef.current[index];
    playSlideRef.current = index;
    playBufRef.current = composeIntroSlide(target, allAssets);
    playStateRef.current = initialIntroPlayerState();
    markerRef.current = createWaitMarkerSave();
    fadeRef.current = target.transitionIn === 'fade' ? { phase: 'in', frame: 0 } : null;
    const first = target.steps[0];
    const firstZone = first && target.textZones.find(z => z.id === first.zoneId);
    if (first && firstZone && first.clearBefore) fillRect(playBufRef.current, firstZone.rect, firstZone.bg);
  };

  const startPlay = () => {
    playSlidesRef.current = slides; // snapshot: edits made while playing do not disturb the run
    pressedRef.current = false;
    frameRef.current = 0;
    beginPlaySlide(Math.min(slideIndex, slides.length - 1));
    setSelection(null);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.code === 'Escape') { setPlaying(false); return; }
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.code === 'Space') { if (!e.repeat) pressedRef.current = true; e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    const timer = window.setInterval(() => {
      const current = playSlidesRef.current[playSlideRef.current];
      const buf = playBufRef.current;
      if (!current || !buf || !canvasRef.current) return;
      const pressed = pressedRef.current;
      pressedRef.current = false;
      frameRef.current++;
      const fade = fadeRef.current;
      if (fade) {
        // Nothing else runs during a fade (the ROM ignores presses too).
        fade.frame++;
        const level = fade.phase === 'in' ? Math.min(7, 1 + ((fade.frame - 1) >> 1)) : Math.max(0, 6 - ((fade.frame - 1) >> 1));
        drawIntroBuffer(canvasRef.current, buf, scaleSlotsBrightness(ensureScreen5PaletteSlots(current.palette).slots, level), scale);
        if (fade.frame >= 14) {
          fadeRef.current = null;
          if (fade.phase === 'out' && playSlideRef.current + 1 < playSlidesRef.current.length) beginPlaySlide(playSlideRef.current + 1);
        }
        return;
      }
      const prev = playStateRef.current;
      // Last slide finished: hold the final picture until the next press ends the preview.
      if (prev.phase === 'done') { if (pressed) setPlaying(false); return; }
      const fontFor = fontForRef.current;
      const state = stepIntroPlayer(prev, current, pressed, fontFor);
      playStateRef.current = state;
      if (state.phase === 'done') {
        // Slide finished: leave it (the marker is removed) and move on straight away.
        restoreWaitMarker(buf, markerRef.current);
        if (current.transitionOut === 'fade') {
          fadeRef.current = { phase: 'out', frame: 0 }; // the next slide (if any) starts when the fade ends
          return;
        }
        if (playSlideRef.current + 1 < playSlidesRef.current.length) beginPlaySlide(playSlideRef.current + 1);
      } else {
        const step = current.steps[state.step];
        const zone = step && current.textZones.find(z => z.id === step.zoneId);
        if (state.step !== prev.step) restoreWaitMarker(buf, markerRef.current);
        if (step && zone) {
          if (state.stepStarted && step.clearBefore) fillRect(buf, zone.rect, zone.bg);
          const font = fontFor(zone);
          const layout = layoutZoneText(zone, step.text, font);
          drawZoneText(buf, zone, layout, state.typed, font);
          paintWaitMarker(buf, zone, state.phase === 'waiting' && (state.frames >> 4) % 2 === 0, markerRef.current);   // same blink phase as the ROM: on when the wait starts
        }
      }
      const shown = playSlidesRef.current[playSlideRef.current];
      drawIntroBuffer(canvasRef.current, playBufRef.current!, ensureScreen5PaletteSlots(shown.palette).slots, scale);
    }, 1000 / 60);
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', onKey); };
  }, [playing, scale]);

  // ---- palette editing ----------------------------------------------------
  const setSlotMaster = (slot: number, masterIndex: number) =>
    updateSlide({ palette: assignMasterColorToSlot(palette, slot, masterIndex) });

  const paletteFromImage = (image: Msx2IntroImage) => {
    const src = resolveIntroImageSource(allAssets, image.sourceAssetId);
    if (!src) { setStatusBarMessage?.('That image has no source presentation.'); return; }
    updateSlide({ palette: src.palette.map(p => ({ ...p })) });
    setStatusBarMessage?.(`Slide palette copied from "${image.name}".`);
  };

  // ---- selection helpers --------------------------------------------------
  const selImage = selection?.kind === 'image' ? slide.images.find(i => i.id === selection.id) : undefined;
  const selZone = selection?.kind === 'zone' ? slide.textZones.find(z => z.id === selection.id) : undefined;
  const warnings = useMemo(() => validateIntroSlide(slide, allAssets, intro.fontAssetId), [slide, allAssets, intro.fontAssetId]);
  const fontAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2hudfont'), [allAssets]);
  const trackAssets = useMemo(() => allAssets.filter(a => a.type === 'track'), [allAssets]);
  const musicWarnings = useMemo(() => validateIntroMusic(intro, allAssets), [intro, allAssets]);

  /** Copies the palette asset linked to a SCREEN 5 bitmap font into the slide palette. */
  const paletteFromFont = (font: IntroFont) => {
    const asset = font.paletteAssetId ? allAssets.find(a => a.id === font.paletteAssetId && a.type === 'palette') : undefined;
    const slots = (asset?.data as { slots?: Screen5PaletteSlot[] } | undefined)?.slots;
    if (!slots || slots.length !== 16) { setStatusBarMessage?.('That font has no linked 16-colour palette.'); return; }
    updateSlide({ palette: ensureScreen5PaletteSlots(slots).slots.map(p => ({ ...p })) });
    setStatusBarMessage?.(`Slide palette copied from font "${font.name}".`);
  };

  const addImage = () => {
    const first = presentations[0];
    const src = first ? resolveIntroImageSource(allAssets, first.id) : null;
    const image = createIntroImage(first?.id, src?.width, src?.height);
    updateSlide({ images: [...slide.images, { ...image, name: `Image ${slide.images.length + 1}` }] });
    setSelection({ kind: 'image', id: image.id });
  };
  const addZone = () => {
    const zone = createIntroTextZone(`Text ${slide.textZones.length + 1}`);
    zone.rect = normalizeScreenRect({ x: 8, y: 8 + 4 * slide.textZones.length, w: 240, h: 32 });
    updateSlide({ textZones: [...slide.textZones, zone] });
    setSelection({ kind: 'zone', id: zone.id });
  };
  const deleteImage = (id: string) => { updateSlide({ images: slide.images.filter(i => i.id !== id) }); setSelection(null); };
  const deleteZone = (id: string) => {
    updateSlide({ textZones: slide.textZones.filter(z => z.id !== id), steps: slide.steps.filter(s => s.zoneId !== id) });
    setSelection(null);
  };
  const addStep = () => {
    const zoneId = selZone?.id ?? slide.textZones[0]?.id;
    if (!zoneId) { setStatusBarMessage?.('Add a text zone before adding steps.'); return; }
    const step = createIntroStep(zoneId);
    updateSlide({ steps: [...slide.steps, step] });
    setSelectedStepId(step.id);
  };

  // ---- render -------------------------------------------------------------
  const W = INTRO_SCREEN_W * scale;
  const H = INTRO_SCREEN_H * scale;
  const rectStyle = (r: Msx2IntroRect): React.CSSProperties => ({ left: r.x * scale, top: r.y * scale, width: r.w * scale, height: r.h * scale });

  return (
    <div className="flex h-full gap-2 p-2 overflow-auto text-msx-textprimary">
      {/* Slides */}
      <div className="flex flex-col gap-2 w-40 shrink-0">
        <Panel title={`Slides (${slides.length})`} icon={<PencilIcon className="w-4 h-4" />}>
          <div className="flex flex-col gap-1 p-1">
            {slides.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-1 border rounded px-1 py-0.5 text-xs cursor-pointer ${i === slideIndex ? 'border-msx-accent bg-msx-accent/20' : 'border-msx-border'}`} onClick={() => { setSlideIndex(i); setSelection(null); setPlaying(false); }}>
                <span className="w-4 text-msx-textsecondary">{i + 1}</span>
                <span className="truncate flex-1">{s.name}</span>
                <button title="Up" className="hover:text-msx-accent" onClick={e => { e.stopPropagation(); if (i > 0) { commitSlides(moveItem(slides, i, -1)); setSlideIndex(i - 1); } }}>▲</button>
                <button title="Down" className="hover:text-msx-accent" onClick={e => { e.stopPropagation(); if (i < slides.length - 1) { commitSlides(moveItem(slides, i, 1)); setSlideIndex(i + 1); } }}>▼</button>
              </div>
            ))}
            <Button size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4" />} onClick={addSlide}>Add</Button>
            <Button size="sm" variant="ghost" onClick={duplicateSlide}>Duplicate</Button>
            <Button size="sm" variant="danger" icon={<TrashIcon className="w-4 h-4" />} onClick={deleteSlide}>Delete</Button>
          </div>
        </Panel>
      </div>

      {/* Canvas */}
      <div className="flex flex-col gap-2 shrink-0">
        <Panel
          title={`${slide.name} — 256x192`}
          headerButtons={(
            <div className="flex items-center gap-1">
              {playing
                ? <Button size="sm" variant="danger" onClick={() => setPlaying(false)}>Stop (Esc)</Button>
                : <Button size="sm" variant="secondary" icon={<PlayIcon className="w-4 h-4" />} onClick={startPlay}>Play</Button>}
            </div>
          )}
        >
          <div className="p-1 flex flex-col gap-1">
            <div className="flex items-center gap-3 text-xs text-msx-textsecondary">
              <label className="flex items-center gap-1">Zoom
                <select className={inputCls} value={scale} onChange={e => setScale(Number(e.target.value))}>
                  {[2, 3, 4].map(v => <option key={v} value={v}>{v}x</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1">Snap
                <select className={inputCls} value={snap} onChange={e => setSnap(Number(e.target.value))}>
                  {[2, 4, 8, 16].map(v => <option key={v} value={v}>{v}px</option>)}
                </select>
              </label>
              {playing && <span>SPACE: complete the text, then advance</span>}
            </div>
            <div ref={stageRef} tabIndex={0} onKeyDown={onStageKey} className="relative select-none outline-none" style={{ width: W, height: H }} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
              onPointerDown={() => { if (!playing) setSelection(null); }}>
              <canvas ref={canvasRef} width={W} height={H} style={{ width: W, height: H, imageRendering: 'pixelated' }} className="border border-msx-border" />
              {playing && <div className="absolute inset-0" onPointerDown={e => { e.stopPropagation(); pressedRef.current = true; }} />}
              {!playing && slide.images.map(img => {
                const r = shownRect('image', img.id, img.dest);
                const sel = selection?.kind === 'image' && selection.id === img.id;
                return (
                  <div key={img.id} className={`absolute border ${sel ? 'border-sky-300' : 'border-sky-500/60 border-dashed'}`} style={{ ...rectStyle(r), cursor: 'move' }}
                    onPointerDown={e => beginDrag(e, 'image', img.id, 'move')}>
                    <span className="absolute left-0 top-0 bg-sky-600/80 text-[9px] px-0.5 leading-tight pointer-events-none">{img.name}</span>
                    {sel && HANDLES.map(h => (
                      <div key={h.mode} className="absolute w-2 h-2 bg-sky-300 border border-black" style={{ ...h.style, cursor: h.cursor }} onPointerDown={e => beginDrag(e, 'image', img.id, h.mode)} />
                    ))}
                  </div>
                );
              })}
              {!playing && slide.textZones.map(zone => {
                const r = shownRect('zone', zone.id, zone.rect);
                const sel = selection?.kind === 'zone' && selection.id === zone.id;
                return (
                  <div key={zone.id} className={`absolute border ${sel ? 'border-amber-300' : 'border-amber-500/60 border-dashed'}`} style={{ ...rectStyle(r), cursor: 'move' }}
                    onPointerDown={e => beginDrag(e, 'zone', zone.id, 'move')}>
                    <span className="absolute right-0 top-0 bg-amber-600/80 text-[9px] px-0.5 leading-tight pointer-events-none">{zone.name}</span>
                    {sel && HANDLES.map(h => (
                      <div key={h.mode} className="absolute w-2 h-2 bg-amber-300 border border-black" style={{ ...h.style, cursor: h.cursor }} onPointerDown={e => beginDrag(e, 'zone', zone.id, h.mode)} />
                    ))}
                  </div>
                );
              })}
            </div>
            {drag && <div className="text-xs text-msx-textsecondary">x {drag.current.x}  y {drag.current.y}  w {drag.current.w}  h {drag.current.h}</div>}
          </div>
        </Panel>
        {warnings.length > 0 && (
          <Panel title={`Warnings (${warnings.length})`}>
            <ul className="p-1 text-xs text-amber-300 list-disc pl-5">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </Panel>
        )}
      </div>

      {/* Properties */}
      <div className="flex flex-col gap-2 min-w-[360px] flex-1">
        <Panel title="Intro">
          <div className="flex flex-col gap-1.5 p-1">
            <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Font</span>
              <select className={`${inputCls} flex-1`} value={intro.fontAssetId ?? ''} onChange={e => onUpdate({ fontAssetId: e.target.value || undefined })}>
                <option value="">Built-in 6x8 (A-Z, digits, punctuation)</option>
                {fontAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            {intro.fontAssetId && !fontAssets.some(a => a.id === intro.fontAssetId) && (
              <div className="text-xs text-amber-300">The selected font asset no longer exists; the built-in font is used.</div>
            )}
            {fontAssets.length === 0 && <div className="text-[10px] text-msx-textsecondary">Create an MSX2 Font asset to use your own glyphs (8x8). Zones can override this font.</div>}
            <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Music</span>
              <select className={`${inputCls} flex-1`} value={intro.musicTrackAssetId ?? ''} onChange={e => onUpdate({ musicTrackAssetId: e.target.value || undefined })}>
                <option value="">Keep whatever is playing</option>
                <option value="__none">Silence</option>
                {trackAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            {musicWarnings.map((w, i) => <div key={i} className="text-xs text-amber-300">{w}</div>)}
            <div className="text-[10px] text-msx-textsecondary">The track starts (looped) when the intro begins and keeps playing after it. Leaving a zone silences the music, so pick a track here for an intermission.</div>
          </div>
        </Panel>

        <Panel title="Slide">
          <div className="flex flex-col gap-1.5 p-1">
            <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Name</span>
              <input className={`${inputCls} flex-1`} value={slide.name} onChange={e => updateSlide({ name: e.target.value })} />
            </label>
            <SlotSelect label="Background" value={slide.backgroundColor} palette={palette} onChange={v => updateSlide({ backgroundColor: v })} />
            <div className="flex gap-3 text-xs text-msx-textsecondary">
              {(['transitionIn', 'transitionOut'] as const).map(key => (
                <label key={key} className="flex items-center gap-1">{key === 'transitionIn' ? 'In' : 'Out'}
                  <select className={inputCls} value={slide[key]} onChange={e => updateSlide({ [key]: e.target.value } as Partial<Msx2IntroSlide>)}>
                    <option value="cut">cut</option>
                    <option value="fade">fade (palette, 14 frames)</option>
                  </select>
                </label>
              ))}
            </div>
            <div className="text-xs text-msx-textsecondary">Palette (click a slot, then a colour; slot 0 is fixed)</div>
            <div className="flex flex-wrap gap-0.5">
              {palette.map((slot, i) => (
                <button key={i} type="button" onClick={() => setPaletteSlot(paletteSlot === i ? null : i)}
                  className={`w-6 h-6 border ${paletteSlot === i ? 'border-msx-accent ring-1 ring-msx-accent' : 'border-msx-border'}`}
                  style={{ background: slot.hex === 'rgba(0,0,0,0)' ? 'repeating-conic-gradient(#666 0% 25%, #222 0% 50%) 50%/8px 8px' : slot.hex }} title={`Slot ${i}`} />
              ))}
            </div>
            {paletteSlot !== null && paletteSlot > 0 && (
              <div className="flex flex-wrap gap-px max-h-32 overflow-y-auto border border-msx-border p-0.5">
                {MSX_SCREEN5_MASTER_PALETTE.map((c, idx) => (
                  <button key={idx} type="button" className={`w-3 h-3 ${palette[paletteSlot]?.masterIndex === idx ? 'ring-1 ring-white' : ''}`} style={{ background: c.hex }} onClick={() => setSlotMaster(paletteSlot, idx)} />
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title={`Elements (${slide.images.length} images, ${slide.textZones.length} texts)`}
          headerButtons={<div className="flex gap-1"><Button size="sm" variant="ghost" onClick={addImage}>+ Image</Button><Button size="sm" variant="ghost" onClick={addZone}>+ Text zone</Button></div>}>
          <div className="flex flex-col gap-1 p-1">
            {slide.images.map(i => (
              <button key={i.id} className={`text-left text-xs px-1 py-0.5 border rounded ${selection?.id === i.id ? 'border-sky-300' : 'border-msx-border'}`} onClick={() => setSelection({ kind: 'image', id: i.id })}>▣ {i.name}</button>
            ))}
            {slide.textZones.map(z => (
              <button key={z.id} className={`text-left text-xs px-1 py-0.5 border rounded ${selection?.id === z.id ? 'border-amber-300' : 'border-msx-border'}`} onClick={() => setSelection({ kind: 'zone', id: z.id })}>T {z.name}</button>
            ))}
          </div>
        </Panel>

        {selImage && (() => {
          const src = resolveIntroImageSource(allAssets, selImage.sourceAssetId);
          const srcW = src?.width ?? INTRO_SCREEN_W;
          const srcH = src?.height ?? INTRO_SCREEN_H;
          const setDest = (p: Partial<Msx2IntroRect>) => updateImage(selImage.id, { dest: normalizeScreenRect({ ...selImage.dest, ...p }) });
          const setCrop = (p: Partial<Msx2IntroRect>) => updateImage(selImage.id, { crop: normalizeCropRect({ ...selImage.crop, ...p }, srcW, srcH) });
          return (
            <Panel title={`Image: ${selImage.name}`} headerButtons={<button className="text-msx-danger" onClick={() => deleteImage(selImage.id)}><TrashIcon className="w-4 h-4" /></button>}>
              <div className="flex flex-col gap-1.5 p-1">
                <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Name</span>
                  <input className={`${inputCls} flex-1`} value={selImage.name} onChange={e => updateImage(selImage.id, { name: e.target.value })} />
                </label>
                <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Source</span>
                  <select className={`${inputCls} flex-1`} value={selImage.sourceAssetId ?? ''} onChange={e => {
                    const s = resolveIntroImageSource(allAssets, e.target.value);
                    updateImage(selImage.id, { sourceAssetId: e.target.value || undefined, crop: { x: 0, y: 0, w: s?.width ?? INTRO_SCREEN_W, h: s?.height ?? INTRO_SCREEN_H } });
                  }}>
                    <option value="">(none)</option>
                    {presentations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                {!src && <div className="text-xs text-amber-300">Create a SCREEN 5 Presentation and import a picture in it first.</div>}
                <div className="text-xs text-msx-textsecondary">Screen rectangle (x, w even)</div>
                <div className="flex flex-wrap gap-2">
                  <NumField label="x" value={selImage.dest.x} min={0} max={254} step={2} onChange={v => setDest({ x: v })} />
                  <NumField label="y" value={selImage.dest.y} min={0} max={191} onChange={v => setDest({ y: v })} />
                  <NumField label="w" value={selImage.dest.w} min={2} max={256} step={2} onChange={v => setDest({ w: v })} />
                  <NumField label="h" value={selImage.dest.h} min={1} max={192} onChange={v => setDest({ h: v })} />
                </div>
                <div className="text-xs text-msx-textsecondary">Crop of the source ({srcW}x{srcH})</div>
                <div className="flex flex-wrap gap-2">
                  <NumField label="x" value={selImage.crop.x} min={0} max={srcW - 1} onChange={v => setCrop({ x: v })} />
                  <NumField label="y" value={selImage.crop.y} min={0} max={srcH - 1} onChange={v => setCrop({ y: v })} />
                  <NumField label="w" value={selImage.crop.w} min={1} max={srcW} onChange={v => setCrop({ w: v })} />
                  <NumField label="h" value={selImage.crop.h} min={1} max={srcH} onChange={v => setCrop({ h: v })} />
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setCrop({ x: 0, y: 0, w: srcW, h: srcH })}>Crop = whole source</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDest({ h: Math.max(1, Math.round(selImage.dest.w * selImage.crop.h / selImage.crop.w)) })}>Keep aspect (set h)</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDest({ w: Math.max(2, Math.round(selImage.dest.h * selImage.crop.w / selImage.crop.h)) })}>Keep aspect (set w)</Button>
                  <Button size="sm" variant="ghost" onClick={() => paletteFromImage(selImage)}>Slide palette = this image</Button>
                </div>
                <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                  <input type="checkbox" checked={Boolean(selImage.mono)} onChange={e => updateImage(selImage.id, { mono: e.target.checked ? defaultIntroMono(palette) : undefined })} />
                  <span>1-bit image (two colours, 1/4 of the ROM)</span>
                </label>
                {selImage.mono && (
                  <>
                    <SlotSelect label="Ink" value={selImage.mono.ink} palette={palette} onChange={v => updateImage(selImage.id, { mono: { ...selImage.mono!, ink: v } })} />
                    <SlotSelect label="Paper" value={selImage.mono.paper} palette={palette} onChange={v => updateImage(selImage.id, { mono: { ...selImage.mono!, paper: v } })} />
                  </>
                )}
                <div className="text-[10px] text-msx-textsecondary">
                  ROM: {introImageRomBytes(selImage)} bytes{selImage.mono ? ` (${introImageRomBytes({ ...selImage, mono: undefined })} in colour). Each pixel takes the closer of Ink / Paper.` : ` (${introImageRomBytes({ ...selImage, mono: { ink: 15, paper: 1 } })} as 1-bit).`}
                </div>
              </div>
            </Panel>
          );
        })()}

        {selZone && (() => {
          const setRect = (p: Partial<Msx2IntroRect>) => updateZone(selZone.id, { rect: normalizeScreenRect({ ...selZone.rect, ...p }, INTRO_MIN_LINE_SPACING - 2, 8) });
          const zoneFont = fontFor(selZone);
          const cols = Math.floor(selZone.rect.w / zoneFont.cellW);
          return (
            <Panel title={`Text zone: ${selZone.name}`} headerButtons={<button className="text-msx-danger" onClick={() => deleteZone(selZone.id)}><TrashIcon className="w-4 h-4" /></button>}>
              <div className="flex flex-col gap-1.5 p-1">
                <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Name</span>
                  <input className={`${inputCls} flex-1`} value={selZone.name} onChange={e => updateZone(selZone.id, { name: e.target.value })} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <NumField label="x" value={selZone.rect.x} min={0} max={254} step={2} onChange={v => setRect({ x: v })} />
                  <NumField label="y" value={selZone.rect.y} min={0} max={191} onChange={v => setRect({ y: v })} />
                  <NumField label="w" value={selZone.rect.w} min={6} max={256} step={2} onChange={v => setRect({ w: v })} />
                  <NumField label="h" value={selZone.rect.h} min={8} max={192} onChange={v => setRect({ h: v })} />
                </div>
                <SlotSelect label="Text" value={selZone.fg} palette={palette} onChange={v => updateZone(selZone.id, { fg: v })} />
                <SlotSelect label="Box" value={selZone.bg} palette={palette} onChange={v => updateZone(selZone.id, { bg: v })} />
                <div className="flex flex-wrap gap-2">
                  <NumField label="Line" value={selZone.lineSpacing} min={INTRO_MIN_LINE_SPACING} max={INTRO_MAX_LINE_SPACING} onChange={v => updateZone(selZone.id, { lineSpacing: v })} />
                  <NumField label="Delay" value={selZone.charDelayFrames} min={1} max={60} onChange={v => updateZone(selZone.id, { charDelayFrames: v })} />
                </div>
                <label className="flex items-center gap-1 text-xs text-msx-textsecondary"><span className="w-14">Font</span>
                  <select className={`${inputCls} flex-1`} value={selZone.fontAssetId ?? ''} onChange={e => updateZone(selZone.id, { fontAssetId: e.target.value || undefined })}>
                    <option value="">(intro font: {resolveIntroFont(allAssets, undefined, intro.fontAssetId).font.name})</option>
                    {fontAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                {zoneFont.bitmap && (
                  <div className="flex items-center gap-2 text-[10px] text-msx-textsecondary">
                    <span>Bitmap font: its glyph colours are slots of the slide palette.</span>
                    <Button size="sm" variant="ghost" onClick={() => paletteFromFont(zoneFont)}>Slide palette = font palette</Button>
                  </div>
                )}
                <div className="text-[10px] text-msx-textsecondary">{zoneFont.name} ({zoneFont.cellW}x{zoneFont.cellH}): {cols} chars/line x {layoutZoneText(selZone, '', zoneFont).rows} lines. Delay = frames between characters. Characters missing in the font become spaces.</div>
              </div>
            </Panel>
          );
        })()}

        <Panel title={`Steps (${slide.steps.length})`} headerButtons={<Button size="sm" variant="ghost" onClick={addStep}>+ Step</Button>}>
          <div className="flex flex-col gap-1.5 p-1">
            {slide.steps.map((step, i) => {
              const zone = slide.textZones.find(z => z.id === step.zoneId);
              const overflow = zone ? layoutZoneText(zone, step.text, fontFor(zone)).overflow : false;
              return (
                <div key={step.id} className={`border rounded p-1 flex flex-col gap-1 bg-msx-panelbg/60 ${selectedStepId === step.id ? 'border-msx-accent' : 'border-msx-border'}`} onClick={() => setSelectedStepId(step.id)}>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="w-4 text-msx-textsecondary">{i + 1}</span>
                    <select className={inputCls} value={step.zoneId} onChange={e => updateStep(step.id, { zoneId: e.target.value })}>
                      {slide.textZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-[10px] text-msx-textsecondary" title="Fill the zone with its background before typing">
                      <input type="checkbox" checked={step.clearBefore} onChange={e => updateStep(step.id, { clearBefore: e.target.checked })} />clear
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-msx-textsecondary" title="0 = wait for SPACE; N = advance by itself N frames after typing">
                      auto
                      <input type="number" min={0} max={255} className={`${inputCls} w-12`} value={step.autoAdvanceFrames} onChange={e => updateStep(step.id, { autoAdvanceFrames: clampInt(e.target.value, 0, 255, 0) })} />
                    </label>
                    <div className="ml-auto flex gap-0.5">
                      <button className="px-1 hover:text-msx-accent" onClick={() => updateSlide({ steps: moveItem(slide.steps, i, -1) })}>▲</button>
                      <button className="px-1 hover:text-msx-accent" onClick={() => updateSlide({ steps: moveItem(slide.steps, i, 1) })}>▼</button>
                      <button className="px-1 text-msx-danger" onClick={() => updateSlide({ steps: slide.steps.filter(s => s.id !== step.id) })}><TrashIcon className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <textarea className={`${inputCls} font-mono resize-y min-h-[40px] ${overflow ? 'border-amber-400' : ''}`} value={step.text} onChange={e => updateStep(step.id, { text: e.target.value })} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
};
