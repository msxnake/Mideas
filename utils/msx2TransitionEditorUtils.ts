import type {
  Msx2GameFlowConnection,
  Msx2GameFlowNode,
  Msx2GameFlowScreen5PresentationNode,
  Msx2TransitionAsset,
  Msx2TransitionClip,
  Msx2TransitionFxEffect,
  Msx2TransitionLayer,
  Msx2TransitionRect,
  Msx2TransitionStep,
  ProjectAsset,
} from '../types';
import { MSX2_COLOR_LEVELS } from '../constants';
import {
  FX_FRAME_US,
  FX_SCREEN_H,
  FX_SCREEN_TARGET,
  FX_SCREEN_W,
  compileTransitionDetailed,
  createFxDecoder,
  createPsgOneShotSequencer,
  normalizeTransitionAsset,
  readFxSourceImage,
  resolveTimeline,
  soundsFromAssets,
  stepFxFrame,
  validateTransitionAsset,
  type FxCompileResult,
  type FxDecoder,
  type FxDerivedImage,
  type FxPalettePlan,
  type FxPsgWrite,
  type FxRgb,
  type FxSourceImage,
} from './msx2TransitionFx';
import { SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE } from './msx2TransitionPatterns';
import { resolveMsx2Screen5Emitter } from './msx2GameFlowPurpose';

/**
 * Pure logic of the `msx2transition` editor (components/editors/Msx2TransitionEditor.tsx) and of the
 * GameFlow "entry effect" selector: rectangle editing, defaults for new layers / steps / clips,
 * rendering of images and of the decoder's VRAM into RGBA, the timeline model, the wall-clock
 * player and the validation of a presentation node's `fxAssetId`.
 *
 * Nothing here knows React or the DOM. The effect itself (compile / decode / palette plan) is the
 * F1a module `msx2TransitionFx.ts`; this file only wraps it, it does not duplicate it.
 */

type Rect = Msx2TransitionRect;

// ---------------------------------------------------------------------------
// Rectangles
// ---------------------------------------------------------------------------

export type RectHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const evenFloor = (v: number): number => v - (((v % 2) + 2) % 2);
const evenCeil = (v: number): number => v + (((v % 2) + 2) % 2);

/** Snap step of the editor: at least 2 and always even, so x and the width stay even. */
export const normalizeSnap = (snap: number): number => {
  const s = Math.round(Number(snap)) || 2;
  return Math.max(2, evenCeil(s));
};

/**
 * A rectangle inside 256x212 with x and w even (SCREEN 5 stores 2 px per byte), at least 2x1.
 * Even inputs inside the screen come back unchanged, which is also what
 * `normalizeTransitionAsset` does with them.
 */
export function snapLayerRect(rect: Rect): Rect {
  const left = clamp(evenFloor(Math.round(rect.x)), 0, FX_SCREEN_W - 2);
  const right = clamp(evenCeil(Math.round(rect.x + rect.w)), left + 2, FX_SCREEN_W);
  const top = clamp(Math.round(rect.y), 0, FX_SCREEN_H - 1);
  const bottom = clamp(Math.round(rect.y + rect.h), top + 1, FX_SCREEN_H);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * New rectangle after dragging a handle by (dx, dy) image pixels. Edges snap to multiples of
 * `snap`; moving keeps the size and slides against the borders, resizing clamps the moving edge
 * to the picture and keeps at least 2x1.
 */
export function applyLayerDrag(orig: Rect, mode: RectHandle, dx: number, dy: number, snap = 2): Rect {
  const step = normalizeSnap(snap);
  const s = (v: number) => Math.round(v / step) * step;
  if (mode === 'move') {
    return snapLayerRect({
      x: clamp(s(orig.x + dx), 0, FX_SCREEN_W - orig.w),
      y: clamp(s(orig.y + dy), 0, FX_SCREEN_H - orig.h),
      w: orig.w,
      h: orig.h,
    });
  }
  let left = orig.x;
  let top = orig.y;
  let right = orig.x + orig.w;
  let bottom = orig.y + orig.h;
  if (mode.includes('w')) left = clamp(s(orig.x + dx), 0, FX_SCREEN_W);
  if (mode.includes('e')) right = clamp(s(orig.x + orig.w + dx), 0, FX_SCREEN_W);
  if (mode.includes('n')) top = clamp(s(orig.y + dy), 0, FX_SCREEN_H);
  if (mode.includes('s')) bottom = clamp(s(orig.y + orig.h + dy), 0, FX_SCREEN_H);
  if (mode.includes('w')) left = Math.min(left, right - 2);
  else if (mode.includes('e')) right = Math.max(right, left + 2);
  if (mode.includes('n')) top = Math.min(top, bottom - 1);
  else if (mode.includes('s')) bottom = Math.max(bottom, top + 1);
  return snapLayerRect({ x: left, y: top, w: right - left, h: bottom - top });
}

/**
 * Rubber-band selection (two corners in image pixels, any order, fractions allowed) as a layer
 * rectangle: the left edge rounds DOWN to even and the right edge UP, so the selection is never
 * cut. Null when it ends up smaller than 2x1 or entirely outside the picture.
 */
export function rectFromCorners(ax: number, ay: number, bx: number, by: number): Rect | null {
  const x0 = clamp(evenFloor(Math.floor(Math.min(ax, bx))), 0, FX_SCREEN_W);
  const x1 = clamp(evenCeil(Math.ceil(Math.max(ax, bx))), 0, FX_SCREEN_W);
  const y0 = clamp(Math.floor(Math.min(ay, by)), 0, FX_SCREEN_H);
  const y1 = clamp(Math.ceil(Math.max(ay, by)), 0, FX_SCREEN_H);
  if (x1 - x0 < 2 || y1 - y0 < 1) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const isBlackRgb = (c: FxRgb | undefined): boolean => !c || (c[0] === 0 && c[1] === 0 && c[2] === 0);

/**
 * Smallest even-aligned rectangle inside `rect` that holds every non-black pixel of the picture
 * ("fit to content" for a selection). Null when the area is all black.
 */
export function shrinkRectToContent(image: Pick<FxSourceImage, 'pixels' | 'palette'>, rect: Rect): Rect | null {
  const r = snapLayerRect(rect);
  let x0 = Infinity; let y0 = Infinity; let x1 = -1; let y1 = -1;
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (isBlackRgb(image.palette[image.pixels[y][x] & 15])) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  const left = evenFloor(x0);
  const right = Math.min(r.x + r.w, evenCeil(x1 + 1));
  return { x: left, y: y0, w: right - left, h: y1 - y0 + 1 };
}

const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Ids of the layers that overlap another layer (the validation rejects overlaps). */
export function overlappingLayerIds(layers: Msx2TransitionLayer[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < layers.length; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      if (intersects(layers[i].rect, layers[j].rect)) { ids.add(layers[i].id); ids.add(layers[j].id); }
    }
  }
  return ids;
}

/** True when `rect` would overlap a layer other than `exceptId`. */
export const rectOverlapsLayers = (rect: Rect, layers: Msx2TransitionLayer[], exceptId?: string): boolean =>
  layers.some(l => l.id !== exceptId && intersects(rect, l.rect));

/** Layers that stick out of the picture (only hand-edited data can: the editor snaps inside). */
export const layerOutsidePicture = (layer: Msx2TransitionLayer): boolean => {
  const r = layer.rect;
  return r.x < 0 || r.y < 0 || r.x + r.w > FX_SCREEN_W || r.y + r.h > FX_SCREEN_H;
};

// ---------------------------------------------------------------------------
// Ids and defaults
// ---------------------------------------------------------------------------

/** `${prefix}_${n}` with the smallest n >= 1 not used yet. */
export function newTransitionId(prefix: string, existing: Iterable<string>): string {
  const used = new Set(existing);
  let n = 1;
  while (used.has(`${prefix}_${n}`)) n++;
  return `${prefix}_${n}`;
}

export const allStepIds = (asset: Msx2TransitionAsset): string[] => asset.steps.map(s => s.id);
export const allClipIds = (asset: Msx2TransitionAsset): string[] => asset.steps.flatMap(s => s.clips.map(c => c.id));

/** First free 64x32 spot (8 px grid) for a new layer; falls back to the top-left corner. */
export function defaultLayerRect(layers: Msx2TransitionLayer[]): Rect {
  const w = 64; const h = 32;
  for (let y = 8; y + h <= FX_SCREEN_H; y += 8) {
    for (let x = 8; x + w <= FX_SCREEN_W; x += 16) {
      const candidate = { x, y, w, h };
      if (!rectOverlapsLayers(candidate, layers)) return candidate;
    }
  }
  return { x: 8, y: 8, w, h };
}

export function createLayer(layers: Msx2TransitionLayer[], rect?: Rect): Msx2TransitionLayer {
  const id = newTransitionId('layer', layers.map(l => l.id));
  const n = Number(id.split('_')[1]) || layers.length + 1;
  return { id, name: `Capa ${n}`, rect: snapLayerRect(rect ?? defaultLayerRect(layers)) };
}

/**
 * Clip as the normalizer would leave it: params of the other effects dropped, ranges clamped.
 * `normalizeClip` is private to the F1a module, so the clip goes through a throwaway asset.
 */
export function normalizeClipDraft(draft: Msx2TransitionClip): Msx2TransitionClip {
  const asset = normalizeTransitionAsset({ steps: [{ id: 'draft', clips: [draft] }] });
  return asset.steps[0].clips[0];
}

const EFFECT_DEFAULTS: Record<Msx2TransitionFxEffect, Pick<Msx2TransitionClip, 'durationFrames' | 'easing' | 'params'>> = {
  reveal: { durationFrames: 30, easing: 'linear', params: { direction: 'down', stripSize: 2, slats: 1 } },
  slide: { durationFrames: 40, easing: 'easeOut', params: { direction: 'down' } },
  fade: { durationFrames: 30, easing: 'linear', params: { fade: { direction: 'in' } } },
  hold: { durationFrames: 30, easing: 'linear', params: {} },
};

/** Reveal and slide act on a rectangle: they cannot target the whole picture. */
export const effectNeedsLayer = (effect: Msx2TransitionFxEffect): boolean => effect === 'reveal' || effect === 'slide';

export function createClip(asset: Msx2TransitionAsset, effect: Msx2TransitionFxEffect, target?: string): Msx2TransitionClip {
  const wantsLayer = effectNeedsLayer(effect);
  const resolvedTarget = target ?? (wantsLayer ? (asset.layers[0]?.id ?? FX_SCREEN_TARGET) : FX_SCREEN_TARGET);
  const base = EFFECT_DEFAULTS[effect];
  return normalizeClipDraft({
    id: newTransitionId('clip', allClipIds(asset)),
    target: resolvedTarget,
    effect,
    delayFrames: 0,
    durationFrames: base.durationFrames,
    easing: base.easing,
    params: JSON.parse(JSON.stringify(base.params)),
  });
}

/**
 * The same clip with another effect: keeps id, target (moved to a layer when the new effect needs
 * one), delay, duration, easing and sounds, and gives it the default params of the new effect.
 */
export function withClipEffect(clip: Msx2TransitionClip, effect: Msx2TransitionFxEffect, layers: Msx2TransitionLayer[]): Msx2TransitionClip {
  const base = EFFECT_DEFAULTS[effect];
  let target = clip.target;
  if (effectNeedsLayer(effect) && !layers.some(l => l.id === target)) target = layers[0]?.id ?? FX_SCREEN_TARGET;
  return normalizeClipDraft({
    ...clip,
    effect,
    target,
    durationFrames: Math.max(1, clip.durationFrames),
    easing: clip.easing,
    params: JSON.parse(JSON.stringify(base.params)),
  });
}

export function createStep(asset: Msx2TransitionAsset): Msx2TransitionStep {
  const id = newTransitionId('step', allStepIds(asset));
  const n = Number(id.split('_')[1]) || asset.steps.length + 1;
  return { id, name: `Paso ${n}`, clips: [] };
}

/** Removes a layer and the clips that targeted it; says how many clips went with it. */
export function removeLayerFromAsset(asset: Msx2TransitionAsset, layerId: string): { layers: Msx2TransitionLayer[]; steps: Msx2TransitionStep[]; removedClips: number } {
  let removedClips = 0;
  const steps = asset.steps.map(step => ({
    ...step,
    clips: step.clips.filter(clip => {
      const drop = clip.target === layerId;
      if (drop) removedClips++;
      return !drop;
    }),
  }));
  return { layers: asset.layers.filter(l => l.id !== layerId), steps, removedClips };
}

export const framesToSeconds = (frames: number): string => `${(frames / 60).toFixed(2)} s`;

// ---------------------------------------------------------------------------
// Palette plan helpers
// ---------------------------------------------------------------------------

/** `palettePlan` patch that adds / removes a pinned colour (`undefined` when nothing stays pinned). */
export function togglePinnedColor(asset: Msx2TransitionAsset, color: number, pinned: boolean): { palettePlan: Msx2TransitionAsset['palettePlan'] } {
  const set = new Set(asset.palettePlan?.pinnedColors ?? []);
  if (pinned) set.add(color); else set.delete(color);
  const list = Array.from(set).filter(v => v >= 0 && v <= 15).sort((a, b) => a - b);
  return { palettePlan: list.length ? { pinnedColors: list } : undefined };
}

export const fxRgbToCss = (rgb: FxRgb | undefined): string => {
  if (!rgb || rgb[0] < 0) return 'rgb(0,0,0)';
  return `rgb(${MSX2_COLOR_LEVELS[rgb[0] & 7]},${MSX2_COLOR_LEVELS[rgb[1] & 7]},${MSX2_COLOR_LEVELS[rgb[2] & 7]})`;
};

/** 1 where the final (derived) colour of a pixel differs from the one in the presentation. */
export function computeAlteredMask(image: Pick<FxSourceImage, 'pixels' | 'palette'>, derived: Pick<FxDerivedImage, 'pixels' | 'palette'>): Uint8Array {
  const mask = new Uint8Array(FX_SCREEN_W * FX_SCREEN_H);
  for (let y = 0; y < FX_SCREEN_H; y++) {
    for (let x = 0; x < FX_SCREEN_W; x++) {
      const a = image.palette[image.pixels[y][x] & 15];
      const b = derived.palette[derived.pixels[y][x] & 15];
      if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) mask[y * FX_SCREEN_W + x] = 1;
    }
  }
  return mask;
}

export interface PaletteGroupRow {
  id: string;
  name: string;
  /** "1-6" or "-" when the group owns no slot. */
  slots: string;
  first: number;
  count: number;
  pixels: number;
  altered: number;
}

/** One row per palette group for the palette panel (identity mode: a single "toda la imagen" row). */
export function describePaletteGroups(plan: FxPalettePlan, asset: Msx2TransitionAsset): PaletteGroupRow[] {
  return plan.groups.map(group => {
    const layer = group.layerId ? asset.layers.find(l => l.id === group.layerId) : undefined;
    const name = group.layerId ? (layer?.name ?? group.id) : (plan.mode === 'identity' ? 'Toda la imagen' : 'Resto de la imagen');
    const last = group.first + group.count - 1;
    return {
      id: group.id,
      name,
      slots: group.count > 0 ? (group.count === 1 ? `${group.first}` : `${group.first}-${last}`) : '-',
      first: group.first,
      count: group.count,
      pixels: plan.pixelsByGroup[group.id] ?? 0,
      altered: plan.alteredByGroup[group.id] ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// RGBA rendering
// ---------------------------------------------------------------------------

const levelOf = (v: number): number => MSX2_COLOR_LEVELS[v & 7];

function putPixel(out: Uint8ClampedArray, offset: number, rgb: FxRgb | undefined): void {
  if (!rgb || rgb[0] < 0) { out[offset] = 0; out[offset + 1] = 0; out[offset + 2] = 0; }
  else { out[offset] = levelOf(rgb[0]); out[offset + 1] = levelOf(rgb[1]); out[offset + 2] = levelOf(rgb[2]); }
  out[offset + 3] = 255;
}

/** 256x212 RGBA of an indexed picture. */
export function renderIndexedRgba(pixels: number[][], palette: FxRgb[], out = new Uint8ClampedArray(FX_SCREEN_W * FX_SCREEN_H * 4)): Uint8ClampedArray {
  for (let y = 0; y < FX_SCREEN_H; y++) {
    for (let x = 0; x < FX_SCREEN_W; x++) putPixel(out, (y * FX_SCREEN_W + x) * 4, palette[pixels[y][x] & 15]);
  }
  return out;
}

/** The original picture dimmed, with the altered pixels in solid magenta. */
export function renderDiffRgba(image: FxSourceImage, mask: Uint8Array, out = new Uint8ClampedArray(FX_SCREEN_W * FX_SCREEN_H * 4)): Uint8ClampedArray {
  renderIndexedRgba(image.pixels, image.palette, out);
  for (let i = 0; i < mask.length; i++) {
    const o = i * 4;
    if (mask[i]) { out[o] = 255; out[o + 1] = 0; out[o + 2] = 255; }
    else { out[o] = out[o] >> 1; out[o + 1] = out[o + 1] >> 1; out[o + 2] = out[o + 2] >> 1; }
  }
  return out;
}

/** What the monitor shows right now: the visible VRAM page through the palette registers. */
export function renderDecoderRgba(dec: FxDecoder, out = new Uint8ClampedArray(FX_SCREEN_W * FX_SCREEN_H * 4)): Uint8ClampedArray {
  const base = dec.visiblePage * 65536;
  for (let y = 0; y < FX_SCREEN_H; y++) {
    for (let x = 0; x < FX_SCREEN_W; x++) putPixel(out, (y * FX_SCREEN_W + x) * 4, dec.palette[dec.vram[base + y * 256 + x] & 15]);
  }
  return out;
}

/** Border colour of the monitor: palette entry R#7 points at. */
export const backdropCss = (dec: FxDecoder): string => fxRgbToCss(dec.palette[dec.backdrop & 15]);

// ---------------------------------------------------------------------------
// Compile wrapper
// ---------------------------------------------------------------------------

export interface TransitionAnalysis {
  /** Null when the source presentation is missing or unreadable (then `sourceError` says why). */
  image: FxSourceImage | null;
  sourceError: string | null;
  result: FxCompileResult | null;
}

/** Resolves the presentation asset of an effect, compiles and reports; never throws. */
export function analyzeTransition(asset: Msx2TransitionAsset, allAssets: ProjectAsset[]): TransitionAnalysis {
  const source = allAssets.find(a => a.id === asset.sourcePresentationAssetId && a.type === 'msx2presentation');
  if (!asset.sourcePresentationAssetId) return { image: null, sourceError: 'Elige la presentación (imagen) sobre la que actúa el efecto.', result: null };
  if (!source) return { image: null, sourceError: `La presentación «${asset.sourcePresentationAssetId}» ya no existe en el proyecto: elige otra.`, result: null };
  let image: FxSourceImage;
  try { image = readFxSourceImage(source); } catch (error) {
    return { image: null, sourceError: `No se puede leer la presentación «${source.name}»: ${(error as Error).message}`, result: null };
  }
  try {
    return { image, sourceError: null, result: compileTransitionDetailed(asset, image, { sounds: soundsFromAssets(allAssets) }) };
  } catch (error) {
    return { image, sourceError: `El compilador falló: ${(error as Error).message}`, result: null };
  }
}

// ---------------------------------------------------------------------------
// Timeline model
// ---------------------------------------------------------------------------

export interface TimelineClipBar {
  clipId: string;
  stepIndex: number;
  label: string;
  effect: Msx2TransitionFxEffect;
  startTick: number;
  endTick: number;
  waitsForKey: boolean;
}

export interface TimelineSoundBar {
  clipId: string;
  label: string;
  startTick: number;
  endTick: number;
  durationFrames: number;
}

export interface TimelineFrameCost {
  frame: number;
  ticks: number;
  costUs: number;
  /** Share of one 60 Hz frame (1 = exactly fits). */
  load: number;
}

export interface TimelineModel {
  totalTicks: number;
  clips: TimelineClipBar[];
  sounds: TimelineSoundBar[];
  costs: TimelineFrameCost[];
  peakLoad: number;
  stretchedFrames: number;
  blockBytes: number;
}

/**
 * Positions on the REAL tick axis (a logical frame that does not fit in 1/60 s lasts several
 * ticks): clip bars from the tick their first frame starts to the tick after their last one,
 * sound bars with the real duration of the sound, and the cost of each frame.
 */
export function buildTimelineModel(asset: Msx2TransitionAsset, result: FxCompileResult): TimelineModel {
  const timeline = result.timeline ?? resolveTimeline(asset);
  const groups = result.frames.filter(f => f.frame >= 0);
  const lastGroup = groups[groups.length - 1];
  const bodyEnd = lastGroup ? lastGroup.tickStart + lastGroup.ticks : 0;
  const tickOf = (frame: number): number => {
    if (frame <= 0) return groups[0]?.tickStart ?? 0;
    if (frame >= groups.length) return bodyEnd;
    return groups[frame].tickStart;
  };
  const layerName = (id: string) => asset.layers.find(l => l.id === id)?.name ?? (id === FX_SCREEN_TARGET ? 'Pantalla' : id);
  const clips: TimelineClipBar[] = timeline.clips.map(rc => ({
    clipId: rc.clip.id,
    stepIndex: rc.stepIndex,
    label: `${layerName(rc.clip.target)} · ${rc.clip.effect}`,
    effect: rc.clip.effect,
    startTick: tickOf(rc.start),
    endTick: tickOf(rc.end),
    waitsForKey: rc.clip.effect === 'hold' && rc.clip.params.waitForKey === true,
  }));
  const soundLabel = (id: string) => (id.length > 18 ? `${id.slice(0, 16)}…` : id);
  const sounds: TimelineSoundBar[] = result.soundEvents.map(ev => ({
    clipId: ev.clipId, label: soundLabel(ev.soundAssetId), startTick: ev.tick, endTick: ev.endTick, durationFrames: ev.durationFrames,
  }));
  const costs: TimelineFrameCost[] = result.frames.map(f => ({ frame: f.frame, ticks: f.ticks, costUs: f.costUs, load: f.costUs / FX_FRAME_US }));
  return {
    totalTicks: result.totalTicks,
    clips,
    sounds,
    costs,
    peakLoad: costs.reduce((m, c) => Math.max(m, c.load), 0),
    stretchedFrames: result.frames.filter(f => f.ticks > 1).length,
    blockBytes: result.bytes.length,
  };
}

// ---------------------------------------------------------------------------
// Player (wall clock -> decoder ticks)
// ---------------------------------------------------------------------------

export const FX_TICK_MS = 1000 / 60;
/** Most ticks one `advance` call runs to catch up before it gives up and re-syncs the clock. */
export const FX_PLAYER_MAX_CATCHUP = 8;

export interface FxPlayerStep {
  /** The tick this step completed (0 = the first vblank). */
  tick: number;
  /** PSG register writes the ROM would have made during this tick, in order. */
  psgWrites: FxPsgWrite[];
  /** Sound-table ids started during this tick. */
  sfxIds: number[];
}

export interface FxPlayerAdvance {
  steps: FxPlayerStep[];
  /** Ticks skipped because the host fell too far behind. */
  dropped: number;
  done: boolean;
}

export interface FxPlayer {
  readonly dec: FxDecoder;
  /** Runs every tick that is due at `nowMs` (60 Hz from the start), at most FX_PLAYER_MAX_CATCHUP. */
  advance(nowMs: number, keyDown: boolean): FxPlayerAdvance;
}

/**
 * Plays a compiled block against a wall clock. One decoder tick per 1/60 s: the stretching of a
 * heavy frame is already inside the block as `SYNC n`, so max(wait, cost) per frame comes from the
 * same bytes the ROM replays. `keyDown` is the state of SPACE / fire for the ticks run now.
 */
export function createFxPlayer(block: Uint8Array, page1: number[][], startMs: number): FxPlayer {
  const dec = createFxDecoder(block, { page1 });
  let clockStart = startMs;
  let psgSeen = 0;
  let sfxSeen = 0;
  return {
    dec,
    advance(nowMs, keyDown) {
      const steps: FxPlayerStep[] = [];
      let dropped = 0;
      if (dec.done) return { steps, dropped, done: true };
      const due = Math.floor((nowMs - clockStart) / FX_TICK_MS);
      let guard = 0;
      while (dec.tick < due && !dec.done && guard < FX_PLAYER_MAX_CATCHUP) {
        const tick = dec.tick;
        stepFxFrame(dec, keyDown);
        steps.push({
          tick,
          psgWrites: dec.psgLog.slice(psgSeen).map(w => ({ reg: w.reg, value: w.value })),
          sfxIds: dec.sfxLog.slice(sfxSeen).map(s => s.id),
        });
        psgSeen = dec.psgLog.length;
        sfxSeen = dec.sfxLog.length;
        guard++;
      }
      if (!dec.done && dec.tick < due) {
        dropped = due - dec.tick;
        clockStart += dropped * FX_TICK_MS;
      }
      return { steps, dropped, done: dec.done };
    },
  };
}

/**
 * The PSG writes a sound produces, per 60 Hz tick (index = tick), exactly as the ROM's sequencer
 * would emit them: used by the "play sound" button. The stream ends with the `stop` write.
 */
export function soundPreviewSchedule(records: number[][]): FxPsgWrite[][] {
  const seq = createPsgOneShotSequencer();
  const schedule: FxPsgWrite[][] = [seq.start(records)];
  let guard = 0;
  while (seq.active && guard++ < 100_000) schedule.push(seq.tick());
  return schedule;
}

// ---------------------------------------------------------------------------
// Key waits: the effect's own and the Screen5Presentation node's
// ---------------------------------------------------------------------------

/** A `hold` that waits for a key (SPACE / fire): the way an effect can end "waiting for the player". */
export const isKeyWaitClip = (clip: Msx2TransitionClip): boolean => clip.effect === 'hold' && clip.params?.waitForKey === true;

/** True when any clip of the effect waits for a key. */
export const effectHasKeyWait = (asset: Pick<Msx2TransitionAsset, 'steps'>): boolean =>
  (asset.steps ?? []).some(step => (step.clips ?? []).some(isKeyWaitClip));

/**
 * The steps without the TRAILING key wait: the last step is dropped when every clip in it is a key-wait
 * hold. The "logo falls" preset of the F1a module ends with such a step, but a Screen5Presentation node
 * already waits for a key after the effect, so the editor creates presets without it by default
 * (two presses would be needed otherwise). Earlier steps are never touched.
 */
export function stripTrailingKeyWait(steps: Msx2TransitionStep[]): Msx2TransitionStep[] {
  const last = steps[steps.length - 1];
  if (last && last.clips.length > 0 && last.clips.every(isKeyWaitClip)) return steps.slice(0, -1);
  return steps;
}

/**
 * Whether the boot code waits for a key after showing this presentation node: the node's own flag, else
 * the presentation asset's `runtime.waitForKey` (default true). Mirrors `resolveBitmapIntroScenes` in the
 * bitmap-room generator (`node.waitForKey ?? (runtime?.waitForKey !== false)`).
 */
export function nodeWaitsForKey(node: Pick<Msx2GameFlowScreen5PresentationNode, 'waitForKey' | 'presentationAssetId'>, assets: ProjectAsset[]): boolean {
  if (typeof node.waitForKey === 'boolean') return node.waitForKey;
  const presentation = node.presentationAssetId ? assets.find(a => a.id === node.presentationAssetId && a.type === 'msx2presentation') : undefined;
  const runtime = (presentation?.data as { runtime?: { waitForKey?: boolean } } | undefined)?.runtime;
  return runtime?.waitForKey !== false;
}

/** Shown in the transition editor and in the GameFlow node panel. */
export const DOUBLE_KEY_PRESS_WARNING = 'El efecto termina esperando una tecla y la presentación también espera una: se pedirán dos pulsaciones. Quita la espera de tecla del efecto o desmarca «Wait for key» del nodo.';

export interface KeyWaitConflict {
  flowName: string;
  nodeId: string;
}

/**
 * Screen5Presentation nodes (of flows that run on the bitmap-room backend, the only one that plays the
 * effect) that use `transitionAssetId` as entry effect and wait for a key themselves. Empty when the
 * effect has no key-wait clip: then there is nothing to double.
 */
export function findKeyWaitConflicts(transitionAssetId: string, fx: Pick<Msx2TransitionAsset, 'steps'>, assets: ProjectAsset[]): KeyWaitConflict[] {
  if (!transitionAssetId || !effectHasKeyWait(fx)) return [];
  const hasBitmapRooms = assets.some(a => a.type === 'msx2bitmaproom');
  const out: KeyWaitConflict[] = [];
  for (const flow of assets) {
    if (flow.type !== 'msx2gameflow') continue;
    const graph = flow.data as { purpose?: unknown; nodes?: Msx2GameFlowNode[] } | undefined;
    if (!graph || !Array.isArray(graph.nodes)) continue;
    if (resolveMsx2Screen5Emitter(graph.purpose, hasBitmapRooms) !== 'bitmap-rooms') continue;
    for (const node of graph.nodes) {
      if (node?.type === 'Screen5Presentation' && node.fxAssetId === transitionAssetId && nodeWaitsForKey(node, assets)) {
        out.push({ flowName: flow.name, nodeId: node.id });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// GameFlow: entry effect of a Screen5Presentation node
// ---------------------------------------------------------------------------

export interface PresentationFxIssues {
  errors: string[];
  warnings: string[];
  /** Asset names are resolved for the summary line; absent when there is no effect or it is missing. */
  summary?: { assetName: string; layers: number; steps: number; durationFrames: number; blockBytes?: number; totalTicks?: number };
}

/** Node that feeds `nodeId`, skipping Music nodes (they do not touch the picture), or null. */
export function previousNonMusicNode(nodeId: string, nodes: Msx2GameFlowNode[], connections: Msx2GameFlowConnection[]): Msx2GameFlowNode | null {
  const seen = new Set<string>();
  let current = nodeId;
  while (!seen.has(current)) {
    seen.add(current);
    const incoming = connections.find(c => c.to.nodeId === current);
    const from = incoming ? nodes.find(n => n.id === incoming.from.nodeId) : undefined;
    if (!from) return null;
    if (from.type !== 'Music') return from;
    current = from.id;
  }
  return null;
}

/**
 * Checks the `fxAssetId` of a presentation node: the effect exists, was authored on this node's
 * picture, compiles, is not preceded by a palette fade-in / crossfade (the effect owns the palette,
 * design doc section 4) and the flow runs on the bitmap-room backend (the walker and the strict
 * exporter print the still image). `deep` also compiles the effect (size and real duration).
 */
export function presentationFxNodeIssues(
  node: Msx2GameFlowScreen5PresentationNode,
  nodes: Msx2GameFlowNode[],
  connections: Msx2GameFlowConnection[],
  assets: ProjectAsset[],
  bitmapBackend: boolean,
  deep = false,
): PresentationFxIssues {
  const out: PresentationFxIssues = { errors: [], warnings: [] };
  if (!node.fxAssetId) return out;
  const fxAsset = assets.find(a => a.id === node.fxAssetId && a.type === 'msx2transition');
  if (!fxAsset) {
    out.errors.push(`El efecto de entrada «${node.fxAssetId}» ya no existe: elige otro o quítalo.`);
    return out;
  }
  const fx = normalizeTransitionAsset(fxAsset.data);
  const timeline = resolveTimeline(fx);
  out.summary = { assetName: fxAsset.name, layers: fx.layers.length, steps: fx.steps.length, durationFrames: timeline.totalFrames };

  if (!bitmapBackend) {
    out.warnings.push('Solo el backend bitmap-room ejecuta el efecto: en el walker y en el backend estricto la presentación se exporta como imagen estática.');
  }
  if (!node.presentationAssetId) {
    out.errors.push('El nodo no tiene presentación: elige una imagen antes de asignar el efecto.');
  } else if (fx.sourcePresentationAssetId !== node.presentationAssetId) {
    const other = assets.find(a => a.id === fx.sourcePresentationAssetId);
    out.errors.push(`El efecto «${fxAsset.name}» se diseñó sobre otra imagen (${other ? `«${other.name}»` : `«${fx.sourcePresentationAssetId || 'ninguna'}»`}): sus capas no encajan con la imagen de este nodo.`);
  }
  if (bitmapBackend && effectHasKeyWait(fx) && nodeWaitsForKey(node, assets)) {
    out.warnings.unshift(DOUBLE_KEY_PRESS_WARNING); // first: the panels cut long lists
  }
  const prev = previousNonMusicNode(node.id, nodes, connections);
  if (prev && prev.type === 'Transition' && SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE.has(prev.effect)) {
    out.errors.push(`La transición anterior («${prev.effect}») fundiría la paleta de esta imagen y el efecto de entrada ya gestiona su propia paleta: quita la transición o el efecto.`);
  }

  const source = node.presentationAssetId ? assets.find(a => a.id === node.presentationAssetId && a.type === 'msx2presentation') : undefined;
  if (node.presentationAssetId && !source) {
    out.errors.push('La presentación del nodo no existe, así que el efecto no se puede comprobar.');
    return out;
  }
  if (source) {
    let image: FxSourceImage | null = null;
    try { image = readFxSourceImage(source); } catch (error) { out.errors.push(`No se puede leer la presentación: ${(error as Error).message}`); }
    if (image) {
      const sounds = soundsFromAssets(assets);
      if (deep) {
        const result = compileTransitionDetailed(fx, image, { sounds });
        out.errors.push(...result.errors);
        out.warnings.push(...result.warnings);
        if (!result.errors.length) { out.summary.blockBytes = result.bytes.length; out.summary.totalTicks = result.totalTicks; }
      } else {
        const v = validateTransitionAsset(fx, { image, sounds });
        out.errors.push(...v.errors);
        out.warnings.push(...v.warnings);
      }
    }
  }
  return out;
}

/** Effects that can be offered for a presentation node: made on its picture (the current one is always listed). */
export function transitionAssetsForPresentation(assets: ProjectAsset[], presentationAssetId: string | undefined, currentFxId?: string): Array<{ asset: ProjectAsset; matches: boolean }> {
  return assets
    .filter(a => a.type === 'msx2transition')
    .map(asset => ({ asset, matches: !!presentationAssetId && (asset.data as Msx2TransitionAsset | undefined)?.sourcePresentationAssetId === presentationAssetId }))
    .filter(entry => entry.matches || entry.asset.id === currentFxId);
}

// ---------------------------------------------------------------------------
// Project-level cleanup
// ---------------------------------------------------------------------------

/**
 * Assets after an `msx2transition` asset was deleted: every GameFlow node that used it as entry
 * effect (`fxAssetId`) loses the reference and goes back to showing the still image. Assets that
 * are not affected keep their identity.
 */
export function clearTransitionReferences(assets: ProjectAsset[], transitionAssetId: string): ProjectAsset[] {
  return assets.map(asset => {
    if (asset.type !== 'msx2gameflow') return asset;
    const graph = asset.data as { nodes?: Array<Record<string, unknown>> } | undefined;
    if (!graph || !Array.isArray(graph.nodes) || !graph.nodes.some(n => n && n.fxAssetId === transitionAssetId)) return asset;
    const nodes = graph.nodes.map(node => {
      if (!node || node.fxAssetId !== transitionAssetId) return node;
      const { fxAssetId: _removed, ...rest } = node;
      return rest;
    });
    return { ...asset, data: { ...graph, nodes } as unknown as ProjectAsset['data'] };
  });
}
