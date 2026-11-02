import type {
  Msx2TransitionAsset,
  Msx2TransitionClip,
  Msx2TransitionClipSound,
  Msx2TransitionFxDirection,
  Msx2TransitionFxEasing,
  Msx2TransitionFxEffect,
  Msx2TransitionLayer,
  Msx2TransitionRect,
  Msx2TransitionStep,
  PSGSoundData,
  Screen5PaletteSlot,
} from '../types';
import { compilePsgOneShotRecords } from './msxGenerator/generators/msx2/msx2PsgOneShot';
import { resolveScreen5PaletteSlot } from './msxGenerator/generators/msx2/screen5PresentationData';

/**
 * SCREEN 5 transition FX (entry effect of a presentation): the PURE half.
 *
 * Design: docs/msx/MSX2_TRANSITION_FX_DESIGN.md. Everything the editor (Play,
 * validation, palette report) and, later, the ROM generator need lives here and
 * nothing touches React or the DOM:
 *
 *   asset ──normalize/validate──▶ timeline ──▶ palette plan ──▶ derived image
 *                                    │                              │
 *                                    └──────▶ compileTransition ◀───┘
 *                                                   │  byte block
 *                       createFxDecoder / stepFxFrame ◀┘  (JS model of the VDP)
 *
 * The compiler turns the authored effect into a flat stream of VDP commands,
 * frame by frame, with easing and bounces already evaluated. The editor's Play
 * decodes THAT block on a JS model of the VDP, and the Z80 interpreter will do
 * nothing but replay it, so both sides run the same bytes.
 *
 * Conventions
 *  - Time is in 60 Hz frames; the ROM forces 60 Hz (R#9). A "logical frame" is
 *    one step of the animation; a "tick" is one vblank. When the commands of a
 *    logical frame do not fit in 1/60 s the compiler gives it several ticks
 *    (`SYNC n`) and says so, so sound and fades keep their real-time pace.
 *  - The source picture is the DERIVED image (`deriveFxImage`) on VRAM page 1
 *    rows 0..211; the effect composes it onto page 0 with HMMM. Pages start
 *    zeroed (black); the initial palette is written in full by the stream.
 *  - Easing, with p = (frame inside the clip + 1) / durationFrames, so the last
 *    frame of a clip always lands exactly on p = 1:
 *      linear  e(p) = p
 *      easeOut e(p) = 1 - (1 - p)^3
 *      bounce  easeOutBounce (n1 = 7.5625, d1 = 2.75; Penner)
 *  - Palette colours are 3-bit components (0..7). A faded entry is
 *    round(c * groupLevel * globalLevel) per component.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FX_SCREEN_W = 256;
export const FX_SCREEN_H = 212;
export const FX_ROW_BYTES = FX_SCREEN_W / 2;
/** `Msx2TransitionClip.target` value that means "the whole picture". */
export const FX_SCREEN_TARGET = '__screen';

/** The ROM forces 60 Hz, so a tick lasts this long. */
export const FX_FRAME_US = 1_000_000 / 60;
/**
 * Command costs, measured in OpenMSX (design doc section 9b; sprites off, with 9 sprites HMMM is 5.83 us/B).
 * The VDP part scales with the bytes copied (the fixed VDP cost per command is ~0); the 0.35 ms per
 * command is Z80 time (OTIR of the command registers + overhead), NOT VDP time, so the two are kept
 * apart. The Z80 issues a command only when the previous one has finished, so a frame lasts
 * the SUM of both (conservative: nothing overlaps).
 */
export const FX_HMMM_US_PER_BYTE = 4.51;
export const FX_HMMV_US_PER_BYTE = 2.88;
export const FX_ORDER_CPU_US = 350;
/** Writing one palette entry (2 OUTs + loop) and starting a sound step: Z80 time, small but not zero. */
export const FX_PAL_ENTRY_US = 8;
export const FX_SFX_US = 40;
/**
 * VRAM page 1 rows 0..231 are safe for the source image during the boot effect (rows 232..255 hold the
 * sprite tables, rewritten after `init_rom`). The compiler itself stays inside rows 0..211.
 */
export const FX_SAFE_SOURCE_ROWS = 232;

export const FX_FORMAT_VERSION = 1;
export const FX_HEADER_BYTES = 12;
export const FX_FLAG_SKIPPABLE = 0x01;
/** Provisional ceiling for one block (the interpreter bank is 8 KB, minus its code); F0/F2 will confirm it. */
export const FX_MAX_BLOCK_BYTES = 6144;
export const FX_MAX_TOTAL_TICKS = 0xffff;
export const FX_MAX_CLIP_FRAMES = 3600;
export const FX_MAX_SOUNDS = 127;
/** Palette slots usable by colours once black owns slot 0. */
export const FX_COLOR_SLOTS = 15;

export const FX_OP = {
  END: 0x00,
  SYNC: 0x01,
  HMMM: 0x02,
  HMMV: 0x03,
  LMMM: 0x04,
  PAL: 0x05,
  PALRUN: 0x06,
  FLIP: 0x07,
  SFX: 0x08,
  SFXOFF: 0x09,
  WAITKEY: 0x0a,
  BACKDROP: 0x0b,
} as const;

const SOUND_RECORD_BYTES = 10;
const PSG_IDLE_R7_C_SHADOW = 0x24;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export type FxRgb = [number, number, number];
type Rect = Msx2TransitionRect;

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const isRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const EFFECTS: readonly Msx2TransitionFxEffect[] = ['reveal', 'slide', 'fade', 'hold'];
const EASINGS: readonly Msx2TransitionFxEasing[] = ['linear', 'easeOut', 'bounce'];
const DIRECTIONS: readonly Msx2TransitionFxDirection[] = ['down', 'up', 'left', 'right'];

const rectRight = (r: Rect) => r.x + r.w;
const rectBottom = (r: Rect) => r.y + r.h;
const rectsEqual = (a: Rect | null, b: Rect | null): boolean =>
  !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

function intersectRect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const r = Math.min(rectRight(a), rectRight(b));
  const bt = Math.min(rectBottom(a), rectBottom(b));
  return r > x && bt > y ? { x, y, w: r - x, h: bt - y } : null;
}

/** `rect` minus `hole`, as up to four disjoint rectangles (top, bottom, then left and right of the middle band). */
function subtractRect(rect: Rect, hole: Rect): Rect[] {
  const inter = intersectRect(rect, hole);
  if (!inter) return [rect];
  const out: Rect[] = [];
  if (inter.y > rect.y) out.push({ x: rect.x, y: rect.y, w: rect.w, h: inter.y - rect.y });
  if (rectBottom(inter) < rectBottom(rect)) out.push({ x: rect.x, y: rectBottom(inter), w: rect.w, h: rectBottom(rect) - rectBottom(inter) });
  if (inter.x > rect.x) out.push({ x: rect.x, y: inter.y, w: inter.x - rect.x, h: inter.h });
  if (rectRight(inter) < rectRight(rect)) out.push({ x: rectRight(inter), y: inter.y, w: rectRight(rect) - rectRight(inter), h: inter.h });
  return out;
}

function subtractAll(rect: Rect, holes: Rect[]): Rect[] {
  let pieces: Rect[] = [rect];
  for (const hole of holes) pieces = pieces.flatMap(piece => subtractRect(piece, hole));
  return pieces;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/** See the module header for the three formulas. `p` is clamped to 0..1 and p = 1 returns exactly 1. */
export function fxEase(easing: Msx2TransitionFxEasing, p: number): number {
  const t = Math.max(0, Math.min(1, p));
  if (t >= 1) return 1;
  if (easing === 'easeOut') return 1 - Math.pow(1 - t, 3);
  if (easing === 'bounce') {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { const u = t - 1.5 / d1; return n1 * u * u + 0.75; }
    if (t < 2.5 / d1) { const u = t - 2.25 / d1; return n1 * u * u + 0.9375; }
    const u = t - 2.625 / d1;
    return n1 * u * u + 0.984375;
  }
  return t;
}

// ---------------------------------------------------------------------------
// Source image
// ---------------------------------------------------------------------------

/** The indexed bitmap of an `msx2presentation` asset, padded to 256x212. */
export interface FxSourceImage {
  width: 256;
  height: 212;
  /** `pixels[y][x]`, palette slot 0..15. */
  pixels: number[][];
  /** 16 entries, 3-bit RGB; slot 0 ("transparent" in the editor) is black on the VDP. */
  palette: FxRgb[];
}

/**
 * Reads an `msx2presentation` asset (wrapped in a ProjectAsset or not; pixels or
 * only the packed 4 bpp bitmap) into an `FxSourceImage`. Rows beyond the stored
 * height are black; a missing image throws.
 */
export function readFxSourceImage(assetOrConfig: unknown): FxSourceImage {
  const asset = isRecord(assetOrConfig) ? assetOrConfig : {};
  const cfg: Record<string, any> = isRecord(asset.data) && ('pixels' in asset.data || 'palette' in asset.data || 'packedBitmap' in asset.data) ? asset.data : asset;
  let rows: unknown = Array.isArray(cfg.pixels) && cfg.pixels.length ? cfg.pixels : cfg.data?.pixels;
  if (!Array.isArray(rows) || !rows.length) {
    const packed = (Array.isArray(cfg.packedBitmap) && cfg.packedBitmap.length ? cfg.packedBitmap : cfg.data?.packedBitmap) as number[] | undefined;
    if (!Array.isArray(packed) || packed.length < FX_ROW_BYTES || packed.length % FX_ROW_BYTES !== 0) {
      throw new Error('La presentación no tiene píxeles indexados ni bitmap empaquetado.');
    }
    rows = Array.from({ length: packed.length / FX_ROW_BYTES }, (_u, y) =>
      Array.from({ length: FX_SCREEN_W }, (_v, x) => {
        const byte = packed[y * FX_ROW_BYTES + (x >> 1)] ?? 0;
        return (x & 1 ? byte : byte >> 4) & 15;
      }));
  }
  const src = rows as number[][];
  const pixels = Array.from({ length: FX_SCREEN_H }, (_u, y) =>
    Array.from({ length: FX_SCREEN_W }, (_v, x) => (Number(src[y]?.[x]) || 0) & 15));
  // The nested `data` of an asset that was not imported from a PNG holds only the pixels: the palette is then the one of the
  // asset itself (without this fallback the picture reads with an all-black palette).
  const slots: Screen5PaletteSlot[] = Array.isArray(cfg.palette)
    ? cfg.palette
    : Array.isArray((asset as Record<string, any>).palette)
      ? (asset as Record<string, any>).palette
      : [];
  const palette: FxRgb[] = Array.from({ length: 16 }, (_u, i) =>
    resolveScreen5PaletteSlot(slots.find(s => s?.slotIndex === i) || slots[i]));
  return { width: 256, height: 212, pixels, palette };
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/** Snaps a layer rectangle inside 256x212 with x and w even. */
function normalizeRect(rect: unknown): Rect {
  const r = isRecord(rect) ? rect : {};
  let w = clampInt(r.w, 2, FX_SCREEN_W, 32);
  w -= w % 2;
  w = Math.max(2, w);
  let x = clampInt(r.x, 0, FX_SCREEN_W - w, 0);
  x -= x % 2;
  const h = clampInt(r.h, 1, FX_SCREEN_H, 16);
  const y = clampInt(r.y, 0, FX_SCREEN_H - h, 0);
  return { x, y, w, h };
}

function normalizeSounds(raw: unknown): Msx2TransitionClipSound[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Msx2TransitionClipSound[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.soundAssetId !== 'string' || !item.soundAssetId) continue;
    out.push({
      soundAssetId: item.soundAssetId,
      at: item.at === 'end' ? 'end' : 'start',
      offsetFrames: clampInt(item.offsetFrames, -60, 60, 0),
    });
    if (out.length === 2) break;
  }
  return out.length ? out : undefined;
}

function normalizeClip(raw: unknown, stepIndex: number, clipIndex: number): Msx2TransitionClip {
  const c = isRecord(raw) ? raw : {};
  const effect: Msx2TransitionFxEffect = EFFECTS.includes(c.effect) ? c.effect : 'hold';
  const p = isRecord(c.params) ? c.params : {};
  const waitForKey = effect === 'hold' && p.waitForKey === true;
  const params: Msx2TransitionClip['params'] = {};
  if (effect === 'reveal' || effect === 'slide') {
    params.direction = DIRECTIONS.includes(p.direction) ? p.direction : 'down';
  }
  if (effect === 'reveal') {
    params.stripSize = clampInt(p.stripSize, 1, 64, 2);
    params.slats = clampInt(p.slats, 1, 32, 1);
  }
  if (effect === 'slide' && p.distance !== undefined && Number.isFinite(Number(p.distance))) {
    params.distance = clampInt(p.distance, 0, 1024, 0);
  }
  if (effect === 'fade') params.fade = { direction: isRecord(p.fade) && p.fade.direction === 'out' ? 'out' : 'in' };
  if (waitForKey) params.waitForKey = true;
  const clip: Msx2TransitionClip = {
    id: typeof c.id === 'string' && c.id ? c.id : `clip_${stepIndex + 1}_${clipIndex + 1}`,
    target: typeof c.target === 'string' && c.target ? c.target : FX_SCREEN_TARGET,
    effect,
    // Only a hold that waits for a key may last 0 frames.
    durationFrames: clampInt(c.durationFrames, waitForKey ? 0 : 1, FX_MAX_CLIP_FRAMES, effect === 'hold' ? 0 : 30),
    delayFrames: clampInt(c.delayFrames, 0, FX_MAX_CLIP_FRAMES, 0),
    easing: EASINGS.includes(c.easing) ? c.easing : 'linear',
    params,
  };
  const sounds = normalizeSounds(c.sounds);
  if (sounds) clip.sounds = sounds;
  return clip;
}

/**
 * Returns a clean, defaulted COPY of a possibly partial or hand-edited asset:
 * version 1, rectangles snapped to even x/w inside 256x212, enumerations
 * defaulted, numbers clamped, at most 2 sounds per clip. Idempotent; never
 * touches its input. Semantic problems (overlaps, unknown targets...) are
 * `validateTransitionAsset`'s business, not fixed here.
 */
export function normalizeTransitionAsset(raw: unknown): Msx2TransitionAsset {
  const src = isRecord(raw) ? raw : {};
  const layers: Msx2TransitionLayer[] = (Array.isArray(src.layers) ? src.layers : []).map((l: unknown, i: number) => {
    const layer = isRecord(l) ? l : {};
    return {
      id: typeof layer.id === 'string' && layer.id ? layer.id : `layer_${i + 1}`,
      name: typeof layer.name === 'string' && layer.name ? layer.name : `Capa ${i + 1}`,
      rect: normalizeRect(layer.rect),
    };
  });
  const steps: Msx2TransitionStep[] = (Array.isArray(src.steps) ? src.steps : []).map((s: unknown, i: number) => {
    const step = isRecord(s) ? s : {};
    return {
      id: typeof step.id === 'string' && step.id ? step.id : `step_${i + 1}`,
      name: typeof step.name === 'string' && step.name ? step.name : `Paso ${i + 1}`,
      clips: (Array.isArray(step.clips) ? step.clips : []).map((c: unknown, j: number) => normalizeClip(c, i, j)),
    };
  });
  const asset: Msx2TransitionAsset = {
    version: 1,
    sourcePresentationAssetId: typeof src.sourcePresentationAssetId === 'string' ? src.sourcePresentationAssetId : '',
    layers,
    steps,
    skippable: src.skippable !== false,
  };
  const pinned = isRecord(src.palettePlan) && Array.isArray(src.palettePlan.pinnedColors)
    ? Array.from(new Set((src.palettePlan.pinnedColors as unknown[]).map(v => clampInt(v, 0, 15, -1)).filter(v => v >= 0))).sort((a, b) => a - b)
    : [];
  if (pinned.length) asset.palettePlan = { pinnedColors: pinned };
  if (src.exactFinal === true) asset.exactFinal = true;
  return asset;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** An asset with no layers and no steps: the picture appears at once. */
export function createDefaultTransitionAsset(sourcePresentationAssetId = ''): Msx2TransitionAsset {
  return { version: 1, sourcePresentationAssetId, layers: [], steps: [], skippable: true };
}

export interface FxLogoDropPresetOptions {
  sourcePresentationAssetId: string;
  /** Rectangle of the logo (the layer that falls). */
  logo: Rect;
  /** Optional rectangle of the picture that fades in first. */
  alien?: Rect;
  /** Sound Editor asset played when the logo starts to fall (whoosh) and when it lands (thud). */
  whooshSoundId?: string;
  thudSoundId?: string;
  alienFadeFrames?: number;
  dropFrames?: number;
}

/**
 * The default preset over "Back to Mars": 1) the alien fades in, 2) the logo
 * falls from above with a bounce, whoosh at the start and thud on landing,
 * 3) wait for a key.
 */
export function createLogoDropPreset(options: FxLogoDropPresetOptions): Msx2TransitionAsset {
  const layers: Msx2TransitionLayer[] = [{ id: 'layer_logo', name: 'Logo', rect: { ...options.logo } }];
  const steps: Msx2TransitionStep[] = [];
  if (options.alien) {
    layers.push({ id: 'layer_alien', name: 'Alien', rect: { ...options.alien } });
    steps.push({
      id: 'step_alien', name: 'Alien',
      clips: [{
        id: 'clip_alien_fade', target: 'layer_alien', effect: 'fade',
        durationFrames: options.alienFadeFrames ?? 32, delayFrames: 0, easing: 'linear', params: { fade: { direction: 'in' } },
      }],
    });
  }
  const sounds: Msx2TransitionClipSound[] = [];
  if (options.whooshSoundId) sounds.push({ soundAssetId: options.whooshSoundId, at: 'start' });
  if (options.thudSoundId) sounds.push({ soundAssetId: options.thudSoundId, at: 'end' });
  steps.push({
    id: 'step_logo', name: 'Logo',
    clips: [{
      id: 'clip_logo_drop', target: 'layer_logo', effect: 'slide',
      durationFrames: options.dropFrames ?? 40, delayFrames: 0, easing: 'bounce', params: { direction: 'down' },
      ...(sounds.length ? { sounds } : {}),
    }],
  });
  steps.push({
    id: 'step_wait', name: 'Esperar tecla',
    clips: [{ id: 'clip_wait', target: FX_SCREEN_TARGET, effect: 'hold', durationFrames: 0, delayFrames: 0, easing: 'linear', params: { waitForKey: true } }],
  });
  return { version: 1, sourcePresentationAssetId: options.sourcePresentationAssetId, layers, steps, skippable: true };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface FxResolvedClip {
  clip: Msx2TransitionClip;
  stepIndex: number;
  clipIndex: number;
  /** First logical frame of the clip (step start + delay). */
  start: number;
  /** One past the last frame (start + durationFrames). */
  end: number;
  layer?: Msx2TransitionLayer;
}

export interface FxTimeline {
  clips: FxResolvedClip[];
  stepStarts: number[];
  stepEnds: number[];
  /** Logical frames until the last clip ends (sounds placed later extend the compiled stream, not this). */
  totalFrames: number;
}

/**
 * Lays the steps end to end: the clips of a step start together (plus their own
 * delay) and the next step starts when the longest one ends.
 */
export function resolveTimeline(asset: Msx2TransitionAsset): FxTimeline {
  const clips: FxResolvedClip[] = [];
  const stepStarts: number[] = [];
  const stepEnds: number[] = [];
  let cursor = 0;
  asset.steps.forEach((step, stepIndex) => {
    stepStarts.push(cursor);
    let stepEnd = cursor;
    step.clips.forEach((clip, clipIndex) => {
      const start = cursor + Math.max(0, Math.floor(Number(clip.delayFrames) || 0));
      const end = start + Math.max(0, Math.floor(Number(clip.durationFrames) || 0));
      clips.push({ clip, stepIndex, clipIndex, start, end, layer: asset.layers.find(l => l.id === clip.target) });
      stepEnd = Math.max(stepEnd, end);
    });
    stepEnds.push(stepEnd);
    cursor = stepEnd;
  });
  return { clips, stepStarts, stepEnds, totalFrames: cursor };
}

// ---------------------------------------------------------------------------
// Palette plan
// ---------------------------------------------------------------------------

export interface FxPaletteGroup {
  /** 'rest' or the layer id. */
  id: string;
  /** Layer that owns the group; null = the rest of the picture (and the shared background). */
  layerId: string | null;
  /** First slot of the group's CONTIGUOUS range. */
  first: number;
  count: number;
  /** Original palette index -> slot in the derived palette (black maps to 0 in grouped mode). */
  colorMap: Record<number, number>;
}

export interface FxPaletteMerge {
  groupId: string;
  /** Original palette indices: `from` is absorbed by `to`. A chain (6 -> 8 -> 10) appears as two merges. */
  from: number;
  to: number;
  /** Pixels `from` carried when it was merged (including colours merged into it earlier). */
  pixels: number;
  /** Euclidean distance between the two colours, in 3-bit units. */
  distance: number;
}

export interface FxPalettePlan {
  /** 'identity' = nothing derived (no per-layer fade): same indices, same palette. */
  mode: 'identity' | 'grouped';
  groups: FxPaletteGroup[];
  /** The derived palette, 16 entries of 3-bit RGB. */
  palette: FxRgb[];
  /** Slots in use, black included (16 = the palette is full). */
  slotsUsed: number;
  merges: FxPaletteMerge[];
  /** Pixels whose final colour differs from the original one. */
  alteredPixels: number;
  alteredByGroup: Record<string, number>;
  /** Largest per-component difference (0..7) of any altered pixel. */
  maxDelta: number;
  /** Non-black pixels per group. */
  pixelsByGroup: Record<string, number>;
  /** Image slots that were pinned and could not be honoured. */
  pinnedIgnored: number[];
  warnings: string[];
  errors: string[];
}

const isBlack = (rgb: FxRgb) => rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0;
const rgbKey = (rgb: FxRgb) => `${rgb[0]},${rgb[1]},${rgb[2]}`;
const rgbDistance = (a: FxRgb, b: FxRgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const rgbChebyshev = (a: FxRgb, b: FxRgb) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

/** Layers that own a palette group: those with at least one fade clip. */
function fadedLayerIds(asset: Msx2TransitionAsset): string[] {
  const ids = new Set<string>();
  for (const step of asset.steps) {
    for (const clip of step.clips) {
      if (clip.effect === 'fade' && clip.target !== FX_SCREEN_TARGET && asset.layers.some(l => l.id === clip.target)) ids.add(clip.target);
    }
  }
  return asset.layers.filter(l => ids.has(l.id)).map(l => l.id);
}

/**
 * Splits the 16-colour palette between the groups that fade independently.
 *
 * With no per-layer fade nothing is derived ('identity'). Otherwise every layer
 * with a fade clip gets an isolated palette range, the rest of the picture is
 * the group 'rest' (slots first), and black is shared by all and pinned to slot
 * 0, so the backdrop (R#7 = 0) is black while the effect runs. Colours that do
 * not fit in the 15 remaining slots are merged greedily: at every step the
 * merge of the smallest added error (pixels x Euclidean distance between 3-bit
 * colours) is applied, never merging away a colour listed in
 * `palettePlan.pinnedColors` unless that makes the plan impossible.
 */
export function planPaletteGroups(image: FxSourceImage, asset: Msx2TransitionAsset): FxPalettePlan {
  const warnings: string[] = [];
  const errors: string[] = [];
  const layerIds = fadedLayerIds(asset);
  const pixelsByGroup: Record<string, number> = {};

  if (layerIds.length === 0) {
    const used = new Set<number>();
    for (const row of image.pixels) for (const v of row) used.add(v & 15);
    const colorMap: Record<number, number> = {};
    for (let i = 0; i < 16; i++) colorMap[i] = i;
    return {
      mode: 'identity',
      groups: [{ id: 'rest', layerId: null, first: 0, count: 16, colorMap }],
      palette: image.palette.map(c => [...c] as FxRgb),
      slotsUsed: used.size,
      merges: [], alteredPixels: 0, alteredByGroup: { rest: 0 }, maxDelta: 0, pixelsByGroup: { rest: 0 },
      pinnedIgnored: [], warnings, errors,
    };
  }

  // group order: rest first, then the faded layers in layer order
  const groupIds = ['rest', ...layerIds];
  const groupOfPixel = (x: number, y: number): number => {
    for (let i = 0; i < layerIds.length; i++) {
      const r = asset.layers.find(l => l.id === layerIds[i])!.rect;
      if (x >= r.x && x < rectRight(r) && y >= r.y && y < rectBottom(r)) return i + 1;
    }
    return 0;
  };

  // colour histograms per group, black excluded (it is shared and fixed)
  const counts: Array<Map<number, number>> = groupIds.map(() => new Map());
  for (let y = 0; y < FX_SCREEN_H; y++) {
    for (let x = 0; x < FX_SCREEN_W; x++) {
      const c = image.pixels[y][x] & 15;
      if (isBlack(image.palette[c])) continue;
      const g = groupOfPixel(x, y);
      counts[g].set(c, (counts[g].get(c) ?? 0) + 1);
    }
  }
  groupIds.forEach((id, g) => { pixelsByGroup[id] = Array.from(counts[g].values()).reduce((a, b) => a + b, 0); });

  interface Rep { color: number; members: Array<{ c: number; n: number }> }
  const buildReps = (): Rep[][] => counts.map(map => Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([c, n]) => ({ color: c, members: [{ c, n }] })));
  const total = (reps: Rep[][]) => reps.reduce((sum, list) => sum + list.length, 0);
  const merges: FxPaletteMerge[] = [];

  const pinned = new Set(asset.palettePlan?.pinnedColors ?? []);
  const runGreedy = (honourPins: boolean): { reps: Rep[][]; merges: FxPaletteMerge[]; ok: boolean } => {
    const reps = buildReps();
    const log: FxPaletteMerge[] = [];
    while (total(reps) > FX_COLOR_SLOTS) {
      let best: { g: number; a: Rep; b: Rep; cost: number; distance: number } | null = null;
      for (let g = 0; g < reps.length; g++) {
        for (const a of reps[g]) {
          if (honourPins && pinned.has(a.color)) continue;
          for (const b of reps[g]) {
            if (a === b) continue;
            // added error = sum over the pixels of `a` of (distance to `b`) - (distance they already carry to `a`)
            let cost = 0;
            for (const m of a.members) cost += m.n * (rgbDistance(image.palette[m.c], image.palette[b.color]) - rgbDistance(image.palette[m.c], image.palette[a.color]));
            if (!best || cost < best.cost - 1e-9) best = { g, a, b, cost, distance: rgbDistance(image.palette[a.color], image.palette[b.color]) };
          }
        }
      }
      if (!best) return { reps, merges: log, ok: false };
      const pixels = best.a.members.reduce((s, m) => s + m.n, 0);
      best.b.members.push(...best.a.members);
      reps[best.g] = reps[best.g].filter(r => r !== best!.a);
      log.push({ groupId: groupIds[best.g], from: best.a.color, to: best.b.color, pixels, distance: best.distance });
    }
    return { reps, merges: log, ok: true };
  };

  let result = runGreedy(true);
  const pinnedIgnored: number[] = [];
  if (!result.ok && pinned.size) {
    result = runGreedy(false);
    pinnedIgnored.push(...Array.from(pinned).sort((a, b) => a - b));
    if (result.ok) warnings.push('Los colores fijados no caben en la paleta: se han fusionado de todos modos para poder repartirla.');
  }
  if (!result.ok) {
    errors.push(`Hay más capas con fundido propio o colores distintos de los que caben en la paleta (${FX_COLOR_SLOTS} colores aparte del negro): no se puede repartir.`);
  }
  merges.push(...result.merges);

  // slots: black = 0, then each group's contiguous range (rest first)
  const palette: FxRgb[] = Array.from({ length: 16 }, () => [0, 0, 0] as FxRgb);
  const groups: FxPaletteGroup[] = [];
  let next = 1;
  const finalColor: Array<Record<number, number>> = []; // per group: original colour -> representative colour
  result.reps.forEach((list, g) => {
    const colorMap: Record<number, number> = {};
    const toFinal: Record<number, number> = {};
    const first = next;
    for (const rep of list) {
      if (next > 15) break; // only reachable when errors is set
      palette[next] = [...image.palette[rep.color]] as FxRgb;
      for (const m of rep.members) { colorMap[m.c] = next; toFinal[m.c] = rep.color; }
      next++;
    }
    for (let i = 0; i < 16; i++) if (isBlack(image.palette[i])) colorMap[i] = 0;
    groups.push({ id: groupIds[g], layerId: g === 0 ? null : groupIds[g], first, count: next - first, colorMap });
    finalColor.push(toFinal);
  });

  // altered pixels: final colour != original colour
  let alteredPixels = 0;
  let maxDelta = 0;
  const alteredByGroup: Record<string, number> = {};
  groupIds.forEach((id, g) => {
    let altered = 0;
    for (const [c, n] of counts[g]) {
      const finalIndex = finalColor[g][c];
      if (finalIndex === undefined) continue;
      if (rgbKey(image.palette[c]) !== rgbKey(image.palette[finalIndex])) {
        altered += n;
        maxDelta = Math.max(maxDelta, rgbChebyshev(image.palette[c], image.palette[finalIndex]));
      }
    }
    alteredByGroup[id] = altered;
    alteredPixels += altered;
  });
  const nameOf = (id: string) => (id === 'rest' ? 'el resto de la imagen' : `la capa «${asset.layers.find(l => l.id === id)?.name ?? id}»`);
  groupIds.forEach(id => {
    const pixels = pixelsByGroup[id] || 0;
    if (alteredByGroup[id] > 0 && (alteredByGroup[id] > pixels * 0.01)) {
      warnings.push(`Se altera más del 1 % de ${nameOf(id)} (${alteredByGroup[id]} px de ${pixels}) al repartir la paleta.`);
    }
  });
  if (maxDelta > 3) warnings.push(`La fusión de colores cambia algún píxel en ${maxDelta} niveles de 7 (Δ > 3): revisa los colores fijados.`);

  return {
    mode: 'grouped', groups, palette, slotsUsed: next, merges,
    alteredPixels, alteredByGroup, maxDelta, pixelsByGroup, pinnedIgnored, warnings, errors,
  };
}

// ---------------------------------------------------------------------------
// Derived image
// ---------------------------------------------------------------------------

export interface FxDerivedImage {
  /** `pixels[y][x]`, slot in the DERIVED palette. */
  pixels: number[][];
  /** 4 bpp, 128 bytes per row, left pixel in the high nibble: what the ROM stores. */
  packed: Uint8Array;
  palette: FxRgb[];
  plan: FxPalettePlan;
}

/**
 * The picture the effect ends on, remapped to the planned palette. Does not
 * touch the source image (a new bitmap is built). With no per-layer fade the
 * result is the source itself (same indices and palette).
 */
export function deriveFxImage(image: FxSourceImage, asset: Msx2TransitionAsset, plan: FxPalettePlan = planPaletteGroups(image, asset)): FxDerivedImage {
  const layerIds = plan.groups.filter(g => g.layerId).map(g => g.id);
  const rects = layerIds.map(id => asset.layers.find(l => l.id === id)!.rect);
  const pixels: number[][] = Array.from({ length: FX_SCREEN_H }, (_u, y) => {
    const row = new Array<number>(FX_SCREEN_W);
    for (let x = 0; x < FX_SCREEN_W; x++) {
      const c = image.pixels[y][x] & 15;
      if (plan.mode === 'identity') { row[x] = c; continue; }
      let g = 0;
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (x >= r.x && x < rectRight(r) && y >= r.y && y < rectBottom(r)) { g = i + 1; break; }
      }
      const slot = plan.groups[g].colorMap[c];
      row[x] = slot === undefined ? 0 : slot;
    }
    return row;
  });
  const packed = new Uint8Array(FX_ROW_BYTES * FX_SCREEN_H);
  for (let y = 0; y < FX_SCREEN_H; y++) {
    for (let x = 0; x < FX_ROW_BYTES; x++) packed[y * FX_ROW_BYTES + x] = (pixels[y][x * 2] << 4) | pixels[y][x * 2 + 1];
  }
  return { pixels, packed, palette: plan.palette.map(c => [...c] as FxRgb), plan };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type FxSoundLookup = Record<string, PSGSoundData | undefined> | ((id: string) => PSGSoundData | undefined);

export interface FxValidationContext {
  /** When given, the palette plan is checked too. */
  image?: FxSourceImage;
  /** When given, sound references are checked. */
  sounds?: FxSoundLookup;
}

export interface FxValidationResult {
  errors: string[];
  warnings: string[];
}

function lookupSound(lookup: FxSoundLookup | undefined, id: string): PSGSoundData | undefined {
  if (!lookup) return undefined;
  return typeof lookup === 'function' ? lookup(id) : lookup[id];
}

/** Builds a sound lookup from the project's assets (`type: 'sound'`, data = PSGSoundData). */
export function soundsFromAssets(assets: Array<{ id: string; type: string; data?: unknown }> | undefined): Record<string, PSGSoundData> {
  const out: Record<string, PSGSoundData> = {};
  for (const a of assets ?? []) if (a?.type === 'sound' && isRecord(a.data)) out[a.id] = a.data as unknown as PSGSoundData;
  return out;
}

/** Layers a slide could cover while it moves, as the bounding box of all its positions. */
function slideSweepRect(layer: Rect, clip: Msx2TransitionClip): Rect {
  const dir = clip.params.direction ?? 'down';
  const dist = slideDistance(layer, clip);
  const vertical = dir === 'down' || dir === 'up';
  const x0 = vertical ? layer.x : (dir === 'right' ? layer.x - dist : layer.x);
  const x1 = vertical ? rectRight(layer) : (dir === 'right' ? rectRight(layer) : rectRight(layer) + dist);
  const y0 = vertical ? (dir === 'down' ? layer.y - dist : layer.y) : layer.y;
  const y1 = vertical ? (dir === 'down' ? rectBottom(layer) : rectBottom(layer) + dist) : rectBottom(layer);
  return intersectRect({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, { x: 0, y: 0, w: FX_SCREEN_W, h: FX_SCREEN_H }) ?? layer;
}

function slideDistance(layer: Rect, clip: Msx2TransitionClip): number {
  const dir = clip.params.direction ?? 'down';
  const given = clip.params.distance;
  if (given !== undefined && Number.isFinite(Number(given)) && Number(given) >= 0) return Math.round(Number(given));
  if (dir === 'down') return layer.y + layer.h;
  if (dir === 'up') return FX_SCREEN_H - layer.y;
  if (dir === 'right') return layer.x + layer.w;
  return FX_SCREEN_W - layer.x;
}

/**
 * Checks an asset (raw or normalized) and returns user-facing Spanish messages:
 * `errors` stop the compilation, `warnings` do not. With a context it also
 * checks the palette plan and the sound references.
 */
export function validateTransitionAsset(asset: Msx2TransitionAsset, ctx: FxValidationContext = {}): FxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const layers = Array.isArray(asset?.layers) ? asset.layers : [];
  const steps = Array.isArray(asset?.steps) ? asset.steps : [];

  if (asset?.version !== FX_FORMAT_VERSION) errors.push(`La versión del efecto (${String(asset?.version)}) no está soportada; se esperaba ${FX_FORMAT_VERSION}.`);

  // layers
  const layerIds = new Set<string>();
  const layerName = (id: string) => layers.find(l => l.id === id)?.name || id;
  for (const layer of layers) {
    const name = layer?.name || layer?.id || '(sin nombre)';
    if (!layer?.id) errors.push(`La capa «${name}» no tiene id.`);
    else if (layerIds.has(layer.id)) errors.push(`Hay dos capas con el mismo id «${layer.id}».`);
    layerIds.add(layer?.id);
    const r = layer?.rect;
    if (!r || ![r.x, r.y, r.w, r.h].every(v => Number.isInteger(v))) {
      errors.push(`La capa «${name}» tiene un rectángulo no válido (x, y, ancho y alto deben ser enteros).`);
      continue;
    }
    if (r.x % 2 !== 0 || r.w % 2 !== 0) errors.push(`La capa «${name}» tiene x o anchura impares: SCREEN 5 guarda 2 píxeles por byte, usa valores pares.`);
    if (r.w < 2 || r.h < 1) errors.push(`La capa «${name}» es demasiado pequeña (mínimo 2x1 píxeles).`);
    if (r.x < 0 || r.y < 0 || rectRight(r) > FX_SCREEN_W || rectBottom(r) > FX_SCREEN_H) errors.push(`La capa «${name}» se sale de la imagen de ${FX_SCREEN_W}x${FX_SCREEN_H}.`);
  }
  for (let i = 0; i < layers.length; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      if (layers[i]?.rect && layers[j]?.rect && intersectRect(layers[i].rect, layers[j].rect)) {
        errors.push(`Las capas «${layers[i].name || layers[i].id}» y «${layers[j].name || layers[j].id}» se solapan; deben ser disjuntas.`);
      }
    }
  }

  // clips
  const clipIds = new Set<string>();
  const geometryByLayer = new Map<string, number>();
  const clipLabel = (clip: Msx2TransitionClip) => `«${clip.effect}${clip.target && clip.target !== FX_SCREEN_TARGET ? ` en ${layerName(clip.target)}` : ''}»`;
  steps.forEach(step => {
    for (const clip of Array.isArray(step?.clips) ? step.clips : []) {
      if (!clip?.id) errors.push(`Un clip del paso «${step.name || step.id}» no tiene id.`);
      else if (clipIds.has(clip.id)) errors.push(`Hay dos clips con el mismo id «${clip.id}».`);
      clipIds.add(clip?.id);
      const label = clipLabel(clip);
      if (!EFFECTS.includes(clip.effect)) { errors.push(`El clip ${label} tiene un efecto desconocido.`); continue; }
      if (!EASINGS.includes(clip.easing)) errors.push(`El clip ${label} tiene una curva (easing) desconocida.`);
      const waitHold = clip.effect === 'hold' && clip.params?.waitForKey === true;
      if (!Number.isInteger(clip.durationFrames) || clip.durationFrames < (waitHold ? 0 : 1) || clip.durationFrames > FX_MAX_CLIP_FRAMES) {
        errors.push(`La duración del clip ${label} debe ser un entero de ${waitHold ? 0 : 1} a ${FX_MAX_CLIP_FRAMES} frames.`);
      }
      if (!Number.isInteger(clip.delayFrames) || clip.delayFrames < 0 || clip.delayFrames > FX_MAX_CLIP_FRAMES) {
        errors.push(`El retardo del clip ${label} debe ser un entero de 0 a ${FX_MAX_CLIP_FRAMES} frames.`);
      }
      const isScreen = clip.target === FX_SCREEN_TARGET;
      if (clip.effect === 'reveal' || clip.effect === 'slide') {
        if (isScreen) errors.push(`El efecto «${clip.effect}» necesita una capa: crea una capa que cubra la zona (o toda la imagen).`);
        else if (!layerIds.has(clip.target)) errors.push(`El clip ${label} apunta a una capa que no existe («${clip.target}»).`);
        else geometryByLayer.set(clip.target, (geometryByLayer.get(clip.target) ?? 0) + 1);
        const dir = clip.params?.direction;
        if (dir !== undefined && !DIRECTIONS.includes(dir)) errors.push(`El clip ${label} tiene una dirección desconocida («${String(dir)}»).`);
      } else if (clip.effect === 'fade' && !isScreen && !layerIds.has(clip.target)) {
        errors.push(`El clip ${label} apunta a una capa que no existe («${clip.target}»).`);
      }
      const clipSounds = Array.isArray(clip.sounds) ? clip.sounds : [];
      if (clipSounds.length > 2) errors.push(`El clip ${label} tiene más de 2 sonidos (máximo 2).`);
      for (const snd of clipSounds) {
        if (!snd?.soundAssetId) { errors.push(`El clip ${label} tiene un sonido sin asset.`); continue; }
        const off = snd.offsetFrames ?? 0;
        if (!Number.isInteger(off) || off < -60 || off > 60) errors.push(`El desplazamiento del sonido «${snd.soundAssetId}» en el clip ${label} debe estar entre -60 y 60 frames.`);
        if (snd.at !== 'start' && snd.at !== 'end') errors.push(`El sonido «${snd.soundAssetId}» del clip ${label} debe empezar en «start» o «end».`);
        if (ctx.sounds) {
          const sound = lookupSound(ctx.sounds, snd.soundAssetId);
          if (!sound) warnings.push(`El sonido «${snd.soundAssetId}» del clip ${label} no existe: se omite.`);
          else if (!compilePsgOneShotRecords(sound)) warnings.push(`El sonido «${sound.name || snd.soundAssetId}» no tiene pasos reproducibles: se omite.`);
        }
      }
    }
  });
  for (const [id, n] of geometryByLayer) {
    if (n > 1) errors.push(`La capa «${layerName(id)}» tiene ${n} clips de revelado/deslizamiento; solo se admite uno por capa.`);
  }
  if (steps.length === 0) warnings.push('El efecto no tiene pasos: la imagen aparece de golpe.');

  // timeline-based checks (only meaningful when the structure is sound)
  if (errors.length === 0) {
    const timeline = resolveTimeline(asset);
    if (timeline.totalFrames > FX_MAX_TOTAL_TICKS) errors.push(`El efecto dura ${timeline.totalFrames} frames; el máximo es ${FX_MAX_TOTAL_TICKS}.`);
    const fadeTargets = new Map<string, FxResolvedClip[]>();
    for (const rc of timeline.clips) {
      if (rc.clip.effect !== 'fade' || rc.clip.durationFrames === 0) continue;
      const list = fadeTargets.get(rc.clip.target) ?? [];
      list.push(rc);
      fadeTargets.set(rc.clip.target, list);
    }
    for (const [target, list] of fadeTargets) {
      const sorted = [...list].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) errors.push(`Los fundidos de ${target === FX_SCREEN_TARGET ? 'la pantalla' : `«${layerName(target)}»`} se solapan en el tiempo.`);
      }
    }
    // a slide that sweeps over ANOTHER layer that also animates hides it (HMMM is opaque)
    const dynamic = new Set(timeline.clips.filter(rc => rc.clip.effect === 'reveal' || rc.clip.effect === 'slide').map(rc => rc.clip.target));
    for (const rc of timeline.clips) {
      if (rc.clip.effect !== 'slide' || !rc.layer) continue;
      const sweep = slideSweepRect(rc.layer.rect, rc.clip);
      for (const other of layers) {
        if (other.id === rc.layer.id || !dynamic.has(other.id)) continue;
        if (intersectRect(sweep, other.rect)) warnings.push(`La capa «${rc.layer.name}» pasa por encima de «${other.name}» al deslizarse y la tapará (el copiado es opaco).`);
      }
    }
    if (ctx.image) {
      const plan = planPaletteGroups(ctx.image, normalizeTransitionAsset(asset));
      errors.push(...plan.errors);
      warnings.push(...plan.warnings);
      for (const id of fadedLayerIds(asset)) {
        if ((plan.pixelsByGroup[id] ?? 0) === 0) warnings.push(`La capa «${layerName(id)}» solo contiene negro: su fundido no se verá.`);
      }
    }
  }
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Byte stream: ops, encoder, decoder
// ---------------------------------------------------------------------------

export type FxOp =
  | { op: 'END' }
  | { op: 'SYNC'; n: number }
  /** Pixel units; x and w even. Source page `srcPage`, destination page `dstPage`. */
  | { op: 'HMMM'; sx: number; sy: number; dx: number; dy: number; w: number; h: number; srcPage: number; dstPage: number }
  /** `color` is the byte with both nibbles (an even x gets the high one). */
  | { op: 'HMMV'; dx: number; dy: number; w: number; h: number; page: number; color: number }
  /** Reserved for F4 (the MVP never emits it): per-pixel copy, `timp` skips colour 0. */
  | { op: 'LMMM'; sx: number; sy: number; dx: number; dy: number; w: number; h: number; srcPage: number; dstPage: number; timp: boolean }
  | { op: 'PAL'; index: number; rgb: FxRgb }
  | { op: 'PALRUN'; first: number; colors: FxRgb[] }
  | { op: 'FLIP'; page: number }
  | { op: 'SFX'; id: number }
  | { op: 'SFXOFF' }
  | { op: 'WAITKEY' }
  | { op: 'BACKDROP'; color: number };

function failEncode(message: string): never {
  throw new Error(`Flujo de transición no válido: ${message}`);
}

const rbByte = (rgb: FxRgb) => ((rgb[0] & 7) << 4) | (rgb[2] & 7);

/** Serialises ops with the layout of the design document (operands in the table order). */
export function encodeFxOps(ops: FxOp[]): number[] {
  const out: number[] = [];
  const byteRange = (value: number, what: string, min = 0, max = 255) => {
    if (!Number.isInteger(value) || value < min || value > max) failEncode(`${what} = ${value} fuera de ${min}..${max}`);
    return value;
  };
  for (const op of ops) {
    switch (op.op) {
      case 'END': out.push(FX_OP.END); break;
      case 'SYNC': out.push(FX_OP.SYNC, byteRange(op.n, 'SYNC n', 1, 255)); break;
      case 'HMMM': {
        if (op.sx % 2 || op.dx % 2 || op.w % 2) failEncode('HMMM con x o anchura impares');
        out.push(FX_OP.HMMM, byteRange(op.sx / 2, 'sx/2', 0, 127), byteRange(op.sy, 'sy'), byteRange(op.dx / 2, 'dx/2', 0, 127), byteRange(op.dy, 'dy'),
          byteRange(op.w / 2, 'w/2', 1, 128), byteRange(op.h, 'h', 1, 255),
          byteRange(op.srcPage, 'página origen', 0, 3) | (byteRange(op.dstPage, 'página destino', 0, 3) << 2));
        break;
      }
      case 'HMMV': {
        if (op.dx % 2 || op.w % 2) failEncode('HMMV con x o anchura impares');
        out.push(FX_OP.HMMV, byteRange(op.dx / 2, 'dx/2', 0, 127), byteRange(op.dy, 'dy'), byteRange(op.w / 2, 'w/2', 1, 128), byteRange(op.h, 'h', 1, 255),
          byteRange(op.page, 'página', 0, 3), byteRange(op.color, 'color'));
        break;
      }
      case 'LMMM':
        out.push(FX_OP.LMMM, byteRange(op.sx, 'sx'), byteRange(op.sy, 'sy'), byteRange(op.dx, 'dx'), byteRange(op.dy, 'dy'),
          byteRange(op.w - 1, 'w-1'), byteRange(op.h, 'h', 1, 255),
          byteRange(op.srcPage, 'página origen', 0, 3) | (byteRange(op.dstPage, 'página destino', 0, 3) << 2) | (op.timp ? 0x10 : 0));
        break;
      case 'PAL':
        out.push(FX_OP.PAL, byteRange(op.index, 'índice de paleta', 0, 15), rbByte(op.rgb), op.rgb[1] & 7);
        break;
      case 'PALRUN': {
        byteRange(op.first, 'primera ranura', 0, 15);
        if (op.colors.length < 1 || op.first + op.colors.length > 16) failEncode('PALRUN fuera de las 16 ranuras');
        out.push(FX_OP.PALRUN, op.first, op.colors.length);
        for (const c of op.colors) out.push(rbByte(c), c[1] & 7);
        break;
      }
      case 'FLIP': out.push(FX_OP.FLIP, byteRange(op.page, 'página', 0, 3)); break;
      case 'SFX': out.push(FX_OP.SFX, byteRange(op.id, 'id de sonido', 0, 127)); break;
      case 'SFXOFF': out.push(FX_OP.SFXOFF); break;
      case 'WAITKEY': out.push(FX_OP.WAITKEY); break;
      case 'BACKDROP': out.push(FX_OP.BACKDROP, byteRange(op.color, 'color de fondo', 0, 15)); break;
      default: failEncode(`opcode desconocido ${(op as { op: string }).op}`);
    }
  }
  return out;
}

/** Decodes the op at `pc`. Throws on an invalid opcode, a truncated operand or reserved bits set. */
export function decodeFxOp(bytes: Uint8Array | number[], pc: number): { op: FxOp; length: number } {
  const need = (n: number) => {
    if (pc + n > bytes.length) throw new Error(`Flujo de transición truncado en el desplazamiento ${pc} (faltan operandos).`);
  };
  need(1);
  const code = bytes[pc];
  switch (code) {
    case FX_OP.END: return { op: { op: 'END' }, length: 1 };
    case FX_OP.SYNC: { need(2); const n = bytes[pc + 1]; if (n < 1) throw new Error(`SYNC con n = 0 en el desplazamiento ${pc}.`); return { op: { op: 'SYNC', n }, length: 2 }; }
    case FX_OP.HMMM: {
      need(8);
      const b = (i: number) => bytes[pc + i];
      return { op: { op: 'HMMM', sx: b(1) * 2, sy: b(2), dx: b(3) * 2, dy: b(4), w: b(5) * 2, h: b(6), srcPage: b(7) & 3, dstPage: (b(7) >> 2) & 3 }, length: 8 };
    }
    case FX_OP.HMMV: {
      need(7);
      const b = (i: number) => bytes[pc + i];
      return { op: { op: 'HMMV', dx: b(1) * 2, dy: b(2), w: b(3) * 2, h: b(4), page: b(5) & 3, color: b(6) }, length: 7 };
    }
    case FX_OP.LMMM: {
      need(8);
      const b = (i: number) => bytes[pc + i];
      return { op: { op: 'LMMM', sx: b(1), sy: b(2), dx: b(3), dy: b(4), w: b(5) + 1, h: b(6), srcPage: b(7) & 3, dstPage: (b(7) >> 2) & 3, timp: (b(7) & 0x10) !== 0 }, length: 8 };
    }
    case FX_OP.PAL: {
      need(4);
      const rb = bytes[pc + 2];
      const g = bytes[pc + 3];
      if ((rb & 0x88) !== 0 || g > 7) throw new Error(`PAL con bits reservados en el desplazamiento ${pc}.`);
      return { op: { op: 'PAL', index: bytes[pc + 1], rgb: [(rb >> 4) & 7, g & 7, rb & 7] }, length: 4 };
    }
    case FX_OP.PALRUN: {
      need(3);
      const first = bytes[pc + 1];
      const n = bytes[pc + 2];
      if (n < 1 || first + n > 16) throw new Error(`PALRUN fuera de las 16 ranuras en el desplazamiento ${pc}.`);
      need(3 + 2 * n);
      const colors: FxRgb[] = [];
      for (let i = 0; i < n; i++) {
        const rb = bytes[pc + 3 + 2 * i];
        const g = bytes[pc + 4 + 2 * i];
        if ((rb & 0x88) !== 0 || g > 7) throw new Error(`PALRUN con bits reservados en el desplazamiento ${pc}.`);
        colors.push([(rb >> 4) & 7, g & 7, rb & 7]);
      }
      return { op: { op: 'PALRUN', first, colors }, length: 3 + 2 * n };
    }
    case FX_OP.FLIP: need(2); return { op: { op: 'FLIP', page: bytes[pc + 1] & 3 }, length: 2 };
    case FX_OP.SFX: { need(2); const id = bytes[pc + 1]; if (id & 0x80) throw new Error(`SFX con el bit 7 activo en el desplazamiento ${pc}.`); return { op: { op: 'SFX', id }, length: 2 }; }
    case FX_OP.SFXOFF: return { op: { op: 'SFXOFF' }, length: 1 };
    case FX_OP.WAITKEY: return { op: { op: 'WAITKEY' }, length: 1 };
    case FX_OP.BACKDROP: need(2); return { op: { op: 'BACKDROP', color: bytes[pc + 1] & 15 }, length: 2 };
    default:
      throw new Error(`Opcode inválido 0x${code.toString(16).toUpperCase().padStart(2, '0')} en el desplazamiento ${pc}.`);
  }
}

/** Decodes a stream from `start` up to and including its END (or to `end`). */
export function decodeFxOps(bytes: Uint8Array | number[], start: number, end = bytes.length): FxOp[] {
  const ops: FxOp[] = [];
  let pc = start;
  while (pc < end) {
    const { op, length } = decodeFxOp(bytes, pc);
    ops.push(op);
    pc += length;
    if (op.op === 'END') return ops;
  }
  throw new Error('Flujo de transición sin END.');
}

// -- block layout ------------------------------------------------------------

export interface FxHeader {
  version: number;
  flags: number;
  skippable: boolean;
  /** R#7 at the start. */
  backdrop: number;
  offStream: number;
  offFinal: number;
  offSounds: number;
  totalFrames: number;
}

export interface FxBlockParts {
  skippable: boolean;
  backdrop: number;
  mainOps: FxOp[];
  /** Skip sequence; ignored unless skippable. */
  finalOps?: FxOp[];
  /** Record streams of the sound table (records only, no terminator). */
  sounds: number[][][];
  totalFrames: number;
}

const u16 = (value: number) => [value & 0xff, (value >> 8) & 0xff];

/**
 * Lays out header | main stream | final stream | sound table | sound records
 * (little-endian, offsets relative to the block). The inverse of `decodeFxBlock`.
 */
export function assembleFxBlock(parts: FxBlockParts): Uint8Array {
  const main = encodeFxOps(parts.mainOps);
  const final = parts.skippable && parts.finalOps ? encodeFxOps(parts.finalOps) : [];
  if (parts.sounds.length > FX_MAX_SOUNDS) failEncode(`demasiados sonidos (${parts.sounds.length}, máximo ${FX_MAX_SOUNDS})`);
  if (parts.totalFrames < 0 || parts.totalFrames > FX_MAX_TOTAL_TICKS) failEncode(`totalFrames = ${parts.totalFrames} fuera de 0..${FX_MAX_TOTAL_TICKS}`);
  const offStream = FX_HEADER_BYTES;
  const offFinal = final.length ? offStream + main.length : 0;
  const offSounds = offStream + main.length + final.length;
  const soundData: number[][] = parts.sounds.map(records => {
    const bytes: number[] = [];
    for (const rec of records) {
      if (rec.length !== SOUND_RECORD_BYTES || rec[0] < 1) failEncode('registro de sonido mal formado');
      bytes.push(...rec.map(v => v & 0xff));
    }
    bytes.push(0);
    return bytes;
  });
  const tableBytes = 1 + 2 * parts.sounds.length;
  const offsets: number[] = [];
  let cursor = offSounds + tableBytes;
  for (const data of soundData) { offsets.push(cursor); cursor += data.length; }
  if (cursor > 0xffff) failEncode('el bloque no cabe en 64 KB');
  const block: number[] = [
    FX_FORMAT_VERSION, parts.skippable ? FX_FLAG_SKIPPABLE : 0, parts.backdrop & 15, 0,
    ...u16(offStream), ...u16(offFinal), ...u16(offSounds), ...u16(parts.totalFrames),
    ...main, ...final,
    parts.sounds.length, ...offsets.flatMap(u16), ...soundData.flat(),
  ];
  return Uint8Array.from(block);
}

export interface FxDecodedBlock {
  header: FxHeader;
  mainOps: FxOp[];
  finalOps: FxOp[];
  sounds: number[][][];
}

export function readFxHeader(block: Uint8Array | number[]): FxHeader {
  if (block.length < FX_HEADER_BYTES) throw new Error('Bloque de transición demasiado corto para su cabecera.');
  const word = (i: number) => block[i] | (block[i + 1] << 8);
  const header: FxHeader = {
    version: block[0], flags: block[1], skippable: (block[1] & FX_FLAG_SKIPPABLE) !== 0, backdrop: block[2] & 15,
    offStream: word(4), offFinal: word(6), offSounds: word(8), totalFrames: word(10),
  };
  if (header.version !== FX_FORMAT_VERSION) throw new Error(`Versión de bloque ${header.version} no soportada.`);
  if (block[3] !== 0) throw new Error('Cabecera de transición con el byte reservado distinto de 0.');
  if (header.offStream < FX_HEADER_BYTES || header.offStream >= block.length) throw new Error('offStream fuera del bloque.');
  if (header.offFinal !== 0 && (header.offFinal < FX_HEADER_BYTES || header.offFinal >= block.length)) throw new Error('offFinal fuera del bloque.');
  if (header.skippable && header.offFinal === 0) throw new Error('El bloque es saltable pero no tiene secuencia final (offFinal = 0).');
  if (header.offSounds >= block.length) throw new Error('offSounds fuera del bloque.');
  return header;
}

function readSoundTable(block: Uint8Array | number[], offSounds: number): number[][][] {
  const n = block[offSounds];
  if (offSounds + 1 + 2 * n > block.length) throw new Error('Tabla de sonidos truncada.');
  const sounds: number[][][] = [];
  for (let i = 0; i < n; i++) {
    let pos = block[offSounds + 1 + 2 * i] | (block[offSounds + 2 + 2 * i] << 8);
    const records: number[][] = [];
    for (;;) {
      if (pos >= block.length) throw new Error('Flujo de sonido sin terminador.');
      if (block[pos] === 0) break;
      if (pos + SOUND_RECORD_BYTES > block.length) throw new Error('Registro de sonido truncado.');
      records.push(Array.from(block.slice(pos, pos + SOUND_RECORD_BYTES)));
      pos += SOUND_RECORD_BYTES;
    }
    sounds.push(records);
  }
  return sounds;
}

/** Parses a whole block: header, both streams and the sound table. */
export function decodeFxBlock(block: Uint8Array | number[]): FxDecodedBlock {
  const header = readFxHeader(block);
  return {
    header,
    mainOps: decodeFxOps(block, header.offStream),
    finalOps: header.offFinal ? decodeFxOps(block, header.offFinal) : [],
    sounds: readSoundTable(block, header.offSounds),
  };
}

// ---------------------------------------------------------------------------
// PSG one-shot sequencer (TS port of msx2PsgOneShot.ts: _start / _tick / _load_step / _stop)
// ---------------------------------------------------------------------------

export interface FxPsgWrite {
  reg: number;
  value: number;
}

export interface PsgOneShotSequencer {
  /** The `<prefix>_active` byte. */
  readonly active: boolean;
  /** The `<prefix>_timer` byte (frames left in the current record). */
  readonly timer: number;
  /** `psg_sfx_r7_c_bits`: the channel-C mixer shadow the music driver merges. */
  readonly shadowR7C: number;
  /** `_start`: restart from the first record and apply it. */
  start(records: number[][]): FxPsgWrite[];
  /** `_tick`: call once per 60 Hz frame; applies the next record when the timer runs out. */
  tick(): FxPsgWrite[];
  /** `_stop`: R#10 = 0, shadow = #24, release the sequencer. */
  stop(): FxPsgWrite[];
}

/**
 * The sequencer the ROM runs, as a pure state machine that returns the PSG
 * register writes of each call (in the Z80's order: R4, R5, R6, R10, R11, R12,
 * R13, R7). Each record is `duration, R4, R5, R6, R10, R11, R12, R13, R7,
 * shadow`; a record array ending (the stream's zero duration) stops it.
 */
export function createPsgOneShotSequencer(): PsgOneShotSequencer {
  let active = false;
  let timer = 0;
  let shadow = PSG_IDLE_R7_C_SHADOW;
  let ptr = 0;
  let stream: number[][] = [];

  const stop = (): FxPsgWrite[] => {
    active = false;
    shadow = PSG_IDLE_R7_C_SHADOW;
    return [{ reg: 10, value: 0 }];
  };
  const loadStep = (): FxPsgWrite[] => {
    const rec = stream[ptr];
    if (!rec) return stop(); // zero duration terminates the stream
    timer = rec[0] & 0xff;
    ptr++;
    shadow = rec[9] & 0xff;
    return [
      { reg: 4, value: rec[1] & 0xff }, { reg: 5, value: rec[2] & 0xff }, { reg: 6, value: rec[3] & 0xff },
      { reg: 10, value: rec[4] & 0xff }, { reg: 11, value: rec[5] & 0xff }, { reg: 12, value: rec[6] & 0xff },
      { reg: 13, value: rec[7] & 0xff }, { reg: 7, value: rec[8] & 0xff },
    ];
  };
  return {
    get active() { return active; },
    get timer() { return timer; },
    get shadowR7C() { return shadow; },
    start(records) { stream = records; ptr = 0; active = true; return loadStep(); },
    tick() {
      if (!active) return [];
      timer = (timer - 1) & 0xff;
      return timer !== 0 ? [] : loadStep();
    },
    stop,
  };
}

// ---------------------------------------------------------------------------
// Decoder: a JS model of the VDP running the block
// ---------------------------------------------------------------------------

export interface FxRectLogEntry {
  tick: number;
  op: 'HMMM' | 'HMMV' | 'LMMM';
  srcPage: number;
  sx: number;
  sy: number;
  dstPage: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
}

export interface FxPsgLogEntry {
  tick: number;
  reg: number;
  value: number;
}

export interface FxDecoder {
  readonly block: Uint8Array;
  readonly header: FxHeader;
  /** Per sound-table entry, its records. */
  readonly soundRecords: number[][][];
  /** Byte offset of the next op. */
  pc: number;
  /** 4 pages of 256x256 pixels, one byte per pixel (slot 0..15): page * 65536 + y * 256 + x. */
  vram: Uint8Array;
  /** Palette registers; entries never written are [-1, -1, -1]. */
  palette: FxRgb[];
  visiblePage: number;
  /** R#7. */
  backdrop: number;
  /** Vblanks elapsed. */
  tick: number;
  done: boolean;
  /** The final sequence was entered through a key press. */
  skipped: boolean;
  inFinal: boolean;
  /** Ticks left in the current SYNC. */
  syncRemaining: number;
  /** WAITKEY state: -1 not waiting, 0 waiting for release, 1 for press, 2 for release. */
  waitKeyPhase: number;
  prevKey: boolean;
  /** A draw op ran since the last tick: palette ops are no longer allowed. */
  frameDrew: boolean;
  psgRegs: number[];
  psgShadowR7C: number;
  psgLog: FxPsgLogEntry[];
  sfxLog: Array<{ tick: number; id: number }>;
  rectLog: FxRectLogEntry[];
  sequencer: PsgOneShotSequencer;
}

export interface FxDecoderOptions {
  /** Contents of VRAM page 1 rows 0..211: the derived image (`FxDerivedImage.pixels`). */
  page1?: number[][];
}

export function createFxDecoder(block: Uint8Array, options: FxDecoderOptions = {}): FxDecoder {
  const header = readFxHeader(block);
  const soundRecords = readSoundTable(block, header.offSounds);
  const vram = new Uint8Array(4 * 256 * 256);
  if (options.page1) {
    for (let y = 0; y < Math.min(FX_SCREEN_H, options.page1.length); y++) {
      for (let x = 0; x < FX_SCREEN_W; x++) vram[65536 + y * 256 + x] = options.page1[y][x] & 15;
    }
  }
  return {
    block, header, soundRecords, pc: header.offStream, vram,
    palette: Array.from({ length: 16 }, () => [-1, -1, -1] as FxRgb),
    visiblePage: 0, backdrop: header.backdrop, tick: 0, done: false, skipped: false, inFinal: false,
    syncRemaining: 0, waitKeyPhase: -1, prevKey: false, frameDrew: false,
    psgRegs: new Array(16).fill(0), psgShadowR7C: PSG_IDLE_R7_C_SHADOW, psgLog: [], sfxLog: [], rectLog: [],
    sequencer: createPsgOneShotSequencer(),
  };
}

function applyPsg(dec: FxDecoder, writes: FxPsgWrite[]): void {
  for (const w of writes) {
    dec.psgRegs[w.reg] = w.value;
    dec.psgLog.push({ tick: dec.tick, reg: w.reg, value: w.value });
  }
  dec.psgShadowR7C = dec.sequencer.shadowR7C;
}

function doTick(dec: FxDecoder): void {
  applyPsg(dec, dec.sequencer.tick());
  dec.tick++;
  dec.frameDrew = false;
}

function checkRect(what: string, page: number, x: number, y: number, w: number, h: number): void {
  if (x < 0 || w < 1 || x + w > FX_SCREEN_W || y < 0 || h < 1 || y + h > FX_SCREEN_H) {
    throw new Error(`${what}: el rectángulo (${x},${y} ${w}x${h}) de la página ${page} no cabe en ${FX_SCREEN_W}x${FX_SCREEN_H}.`);
  }
}

function execOp(dec: FxDecoder, op: FxOp): void {
  const needBeforeDraw = (name: string) => {
    if (dec.frameDrew) throw new Error(`${name} después de un HMMM/HMMV dentro del mismo fotograma: la paleta debe escribirse justo tras el SYNC.`);
  };
  switch (op.op) {
    case 'HMMM':
    case 'LMMM': {
      checkRect(`${op.op} (origen)`, op.srcPage, op.sx, op.sy, op.w, op.h);
      checkRect(`${op.op} (destino)`, op.dstPage, op.dx, op.dy, op.w, op.h);
      const timp = op.op === 'LMMM' && op.timp;
      // Sequential, top-left to bottom-right, like the VDP with DIX = DIY = 0.
      for (let y = 0; y < op.h; y++) {
        const s = op.srcPage * 65536 + (op.sy + y) * 256 + op.sx;
        const d = op.dstPage * 65536 + (op.dy + y) * 256 + op.dx;
        for (let x = 0; x < op.w; x++) {
          const c = dec.vram[s + x];
          if (timp && c === 0) continue;
          dec.vram[d + x] = c;
        }
      }
      dec.frameDrew = true;
      dec.rectLog.push({ tick: dec.tick, op: op.op, srcPage: op.srcPage, sx: op.sx, sy: op.sy, dstPage: op.dstPage, dx: op.dx, dy: op.dy, w: op.w, h: op.h });
      break;
    }
    case 'HMMV': {
      checkRect('HMMV', op.page, op.dx, op.dy, op.w, op.h);
      for (let y = 0; y < op.h; y++) {
        const d = op.page * 65536 + (op.dy + y) * 256 + op.dx;
        for (let x = 0; x < op.w; x++) dec.vram[d + x] = (op.dx + x) % 2 === 0 ? (op.color >> 4) & 15 : op.color & 15;
      }
      dec.frameDrew = true;
      dec.rectLog.push({ tick: dec.tick, op: 'HMMV', srcPage: -1, sx: 0, sy: 0, dstPage: op.page, dx: op.dx, dy: op.dy, w: op.w, h: op.h });
      break;
    }
    case 'PAL': needBeforeDraw('PAL'); dec.palette[op.index] = [...op.rgb] as FxRgb; break;
    case 'PALRUN': needBeforeDraw('PALRUN'); op.colors.forEach((c, i) => { dec.palette[op.first + i] = [...c] as FxRgb; }); break;
    case 'FLIP': needBeforeDraw('FLIP'); dec.visiblePage = op.page; break;
    case 'BACKDROP': needBeforeDraw('BACKDROP'); dec.backdrop = op.color; break;
    case 'SFX': {
      const records = dec.soundRecords[op.id];
      if (!records) throw new Error(`SFX con un id de sonido inexistente (${op.id}).`);
      dec.sfxLog.push({ tick: dec.tick, id: op.id });
      applyPsg(dec, dec.sequencer.start(records));
      break;
    }
    case 'SFXOFF': applyPsg(dec, dec.sequencer.stop()); break;
    default: throw new Error(`Opcode ${op.op} no ejecutable aquí.`);
  }
}

/**
 * Advances the model by exactly ONE vblank tick (or finishes). Runs the ops up
 * to the next tick-consuming one (SYNC / WAITKEY) and consumes one tick of it.
 * `keyDown` is the state of SPACE / fire during this tick. Returns true when
 * the stream has reached END.
 *
 * Skipping: inside a SYNC of a skippable block, a NEW press (key down now, up
 * on the previous tick) jumps to the final sequence. WAITKEY polls once per
 * tick: waits for release, then press, then release.
 */
export function stepFxFrame(dec: FxDecoder, keyDown = false): boolean {
  if (dec.done) return true;
  const press = keyDown && !dec.prevKey;
  dec.prevKey = keyDown;
  for (let guard = 0; guard < 1_000_000; guard++) {
    if (dec.waitKeyPhase >= 0) {
      doTick(dec);
      if (dec.waitKeyPhase === 0) { if (!keyDown) dec.waitKeyPhase = 1; }
      else if (dec.waitKeyPhase === 1) { if (keyDown) dec.waitKeyPhase = 2; }
      else if (!keyDown) dec.waitKeyPhase = -1;
      return false;
    }
    if (dec.syncRemaining > 0) {
      doTick(dec);
      dec.syncRemaining--;
      if (dec.header.skippable && press && !dec.inFinal) {
        dec.pc = dec.header.offFinal;
        dec.syncRemaining = 0;
        dec.skipped = true;
        dec.inFinal = true;
      }
      return false;
    }
    const { op, length } = decodeFxOp(dec.block, dec.pc);
    dec.pc += length;
    if (op.op === 'END') {
      applyPsg(dec, dec.sequencer.stop());
      dec.done = true;
      return true;
    }
    if (op.op === 'SYNC') { dec.syncRemaining = op.n; continue; }
    if (op.op === 'WAITKEY') { dec.waitKeyPhase = 0; continue; }
    execOp(dec, op);
  }
  throw new Error('El flujo de transición no llega a ningún SYNC ni END (¿bucle?).');
}

export interface FxRunOptions {
  /** Key state per tick (default: never pressed). */
  keyAtTick?: (tick: number) => boolean;
  maxTicks?: number;
  /** Called after every tick. */
  onTick?: (dec: FxDecoder) => void;
}

/** Steps until END; throws if it does not end within `maxTicks` (default 20000). */
export function runFxToEnd(dec: FxDecoder, options: FxRunOptions = {}): FxDecoder {
  const max = options.maxTicks ?? 20000;
  while (!dec.done) {
    if (dec.tick > max) throw new Error(`La transición no termina en ${max} ticks.`);
    stepFxFrame(dec, options.keyAtTick ? options.keyAtTick(dec.tick) : false);
    options.onTick?.(dec);
  }
  return dec;
}

/** One page of the model as `rows` rows of 256 palette indices. */
export function fxPageRows(dec: FxDecoder, page: number, rows = FX_SCREEN_H): number[][] {
  return Array.from({ length: rows }, (_u, y) => Array.from(dec.vram.subarray(page * 65536 + y * 256, page * 65536 + y * 256 + 256)));
}

// ---------------------------------------------------------------------------
// Compiler
// ---------------------------------------------------------------------------

export interface FxFrameInfo {
  /** Logical frame index (-1 = the preparation group before frame 0). */
  frame: number;
  /** Ticks elapsed when this group starts. */
  tickStart: number;
  /** Ticks the group occupies (its SYNC). */
  ticks: number;
  /** Estimated Z80 time (command set-up, palette and sound writes), µs. */
  cpuUs: number;
  /** Estimated VDP time (bytes copied or filled), µs. */
  vdpUs: number;
  /** cpuUs + vdpUs: the commands run one after another. */
  costUs: number;
  opCount: number;
}

export interface FxSoundEvent {
  clipId: string;
  soundAssetId: string;
  /** Index in the block's sound table (the SFX operand). */
  tableIndex: number;
  /** Logical frame whose group carries the SFX op. */
  frame: number;
  /** Tick at which the sound starts / ends. */
  tick: number;
  endTick: number;
  durationFrames: number;
}

export interface FxCompileOptions {
  sounds?: FxSoundLookup;
}

export interface FxCompileResult {
  /** The block; empty when `errors` is not. */
  bytes: Uint8Array;
  errors: string[];
  warnings: string[];
  derived?: FxDerivedImage;
  timeline?: FxTimeline;
  /** Per logical frame, preceded by the preparation group (frame -1). */
  frames: FxFrameInfo[];
  soundEvents: FxSoundEvent[];
  /** Header `totalFrames`: ticks of the whole stream (waits for keys not included). */
  totalTicks: number;
  mainOps: FxOp[];
  finalOps: FxOp[];
}

const hasContent = (pixels: number[][], r: Rect): boolean => {
  for (let y = r.y; y < rectBottom(r); y++) for (let x = r.x; x < rectRight(r); x++) if (pixels[y][x] !== 0) return true;
  return false;
};

/** Smallest even-aligned rectangle inside `r` holding every non-zero pixel; null when it is all zero. */
function contentBounds(pixels: number[][], r: Rect): Rect | null {
  let x0 = Infinity; let y0 = Infinity; let x1 = -1; let y1 = -1;
  for (let y = r.y; y < rectBottom(r); y++) {
    for (let x = r.x; x < rectRight(r); x++) {
      if (pixels[y][x] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  x0 -= x0 % 2;
  const right = Math.min(rectRight(r), x1 + 1 + ((x1 + 1) % 2));
  return { x: x0, y: y0, w: right - x0, h: y1 - y0 + 1 };
}

/** Z80 and VDP time of one op, µs (see the constants above). */
const opCostUs = (op: FxOp): { cpu: number; vdp: number } => {
  switch (op.op) {
    case 'HMMM': case 'LMMM': return { cpu: FX_ORDER_CPU_US, vdp: (op.w / 2) * op.h * FX_HMMM_US_PER_BYTE };
    case 'HMMV': return { cpu: FX_ORDER_CPU_US, vdp: (op.w / 2) * op.h * FX_HMMV_US_PER_BYTE };
    case 'PAL': return { cpu: FX_PAL_ENTRY_US, vdp: 0 };
    case 'PALRUN': return { cpu: FX_PAL_ENTRY_US * op.colors.length, vdp: 0 };
    case 'SFX': return { cpu: FX_SFX_US, vdp: 0 };
    default: return { cpu: 0, vdp: 0 };
  }
};

const scaleRgb = (rgb: FxRgb, groupLevel: number, globalLevel: number): FxRgb => [
  Math.round(rgb[0] * groupLevel * globalLevel),
  Math.round(rgb[1] * groupLevel * globalLevel),
  Math.round(rgb[2] * groupLevel * globalLevel),
];

/**
 * Fade level (0..1) of one target at logical frame `frame` (-1 = before
 * anything). Before its first clip the target sits at the START value of that
 * clip (invisible for a fade-in); between clips it holds the last end value.
 */
function fadeLevelAt(clips: FxResolvedClip[], frame: number): number {
  if (!clips.length) return 1;
  const sorted = [...clips].sort((a, b) => a.start - b.start);
  let level = sorted[0].clip.params.fade?.direction === 'out' ? 1 : 0;
  for (const rc of sorted) {
    const isIn = (rc.clip.params.fade?.direction ?? 'in') !== 'out';
    if (frame < rc.start) return level;
    if (frame < rc.end) {
      const e = fxEase(rc.clip.easing, (frame - rc.start + 1) / rc.clip.durationFrames);
      return isIn ? e : 1 - e;
    }
    level = isIn ? 1 : 0;
  }
  return level;
}

function describeClip(clip: Msx2TransitionClip, layers: Msx2TransitionLayer[]): string {
  const layer = layers.find(l => l.id === clip.target);
  return `«${layer ? layer.name : 'pantalla'}» (${clip.effect})`;
}

function soundFrames(records: number[][]): number {
  return records.reduce((sum, rec) => sum + rec[0], 0);
}

/** Compiles and reports; `compileTransition` is the throwing wrapper that returns only the bytes. */
export function compileTransitionDetailed(rawAsset: unknown, image: FxSourceImage, options: FxCompileOptions = {}): FxCompileResult {
  const asset = normalizeTransitionAsset(rawAsset);
  const failed = (errors: string[], warnings: string[]): FxCompileResult => ({
    bytes: new Uint8Array(0), errors, warnings, frames: [], soundEvents: [], totalTicks: 0, mainOps: [], finalOps: [],
  });

  const validation = validateTransitionAsset(asset, { image, sounds: options.sounds });
  const warnings = [...validation.warnings];
  if (validation.errors.length) return failed(validation.errors, warnings);

  const derived = deriveFxImage(image, asset);
  const plan = derived.plan;
  const timeline = resolveTimeline(asset);
  const px = derived.pixels;
  const screen: Rect = { x: 0, y: 0, w: FX_SCREEN_W, h: FX_SCREEN_H };

  // -- dynamic layers: the ones a reveal or slide builds up -------------------
  const geometry = timeline.clips.filter(rc => (rc.clip.effect === 'reveal' || rc.clip.effect === 'slide') && rc.layer);
  const dynRects = geometry.map(rc => rc.layer!.rect);

  const hmmm = (src: Rect, dx: number, dy: number): FxOp => ({ op: 'HMMM', sx: src.x, sy: src.y, dx, dy, w: src.w, h: src.h, srcPage: 1, dstPage: 0 });
  const hmmvZero = (r: Rect): FxOp => ({ op: 'HMMV', dx: r.x, dy: r.y, w: r.w, h: r.h, page: 0, color: 0 });
  /** Ops that make `r` on page 0 equal to the CLEAN background: the picture outside the dynamic layers, black inside them. */
  const paintBackground = (r: Rect): FxOp[] => {
    const outside = subtractAll(r, dynRects);
    if (!outside.some(piece => hasContent(px, piece))) return [hmmvZero(r)];
    const ops: FxOp[] = outside.map(piece => (hasContent(px, piece) ? hmmm(piece, piece.x, piece.y) : hmmvZero(piece)));
    for (const d of dynRects) {
      const inter = intersectRect(r, d);
      if (inter) ops.push(hmmvZero(inter));
    }
    return ops;
  };

  // -- per frame draw work ------------------------------------------------------
  interface FrameBuild { draw: FxOp[]; sfx: number[]; clips: string[] }
  const frames: FrameBuild[] = [];
  const frameAt = (f: number): FrameBuild => {
    while (frames.length <= f) frames.push({ draw: [], sfx: [], clips: [] });
    return frames[f];
  };
  const touched: Rect[] = [];
  const draw = (f: number, clipId: string, op: FxOp) => {
    const fb = frameAt(f);
    fb.draw.push(op);
    if (!fb.clips.includes(clipId)) fb.clips.push(clipId);
    if (op.op === 'HMMM' || op.op === 'HMMV') touched.push({ x: op.dx, y: op.dy, w: op.w, h: op.h });
  };

  for (const rc of geometry) {
    const { clip, layer } = rc;
    const rect = layer!.rect;
    const dir = clip.params.direction ?? 'down';
    const D = clip.durationFrames;
    if (clip.effect === 'reveal') {
      const vertical = dir === 'down' || dir === 'up';
      const extent = vertical ? rect.h : rect.w;
      let q = clampInt(clip.params.stripSize, 1, 64, 2);
      if (!vertical) q = Math.max(2, q - (q % 2));
      const slats = clampInt(clip.params.slats, 1, 32, 1);
      let band = Math.ceil(extent / slats);
      if (!vertical && band % 2) band++;
      const bands: Array<[number, number]> = [];
      for (let s = 0; s < extent; s += band) bands.push([s, Math.min(extent, s + band)]);
      const done = bands.map(() => 0);
      for (let j = 0; j < D; j++) {
        const e = fxEase(clip.easing, (j + 1) / D);
        bands.forEach(([a, b], i) => {
          const size = b - a;
          let cur = j === D - 1 ? size : Math.min(size, Math.round(e * size / q) * q);
          cur = Math.max(cur, done[i]); // a reveal never un-reveals, even with a bouncing curve
          if (cur > done[i]) {
            const prev = done[i];
            let piece: Rect;
            if (dir === 'down') piece = { x: rect.x, y: rect.y + a + prev, w: rect.w, h: cur - prev };
            else if (dir === 'up') piece = { x: rect.x, y: rect.y + b - cur, w: rect.w, h: cur - prev };
            else if (dir === 'right') piece = { x: rect.x + a + prev, y: rect.y, w: cur - prev, h: rect.h };
            else piece = { x: rect.x + b - cur, y: rect.y, w: cur - prev, h: rect.h };
            draw(rc.start + j, clip.id, hmmm(piece, piece.x, piece.y));
          }
          done[i] = cur;
        });
      }
    } else {
      const vertical = dir === 'down' || dir === 'up';
      const dist = slideDistance(rect, clip);
      let prevSrc: Rect | null = null;
      let prevDst: Rect | null = null;
      for (let j = 0; j < D; j++) {
        const e = fxEase(clip.easing, (j + 1) / D);
        let off = j === D - 1 ? 0 : (1 - e) * dist;
        off = vertical ? Math.round(off) : 2 * Math.round(off / 2); // horizontal positions stay even
        const pos = {
          x: dir === 'right' ? rect.x - off : dir === 'left' ? rect.x + off : rect.x,
          y: dir === 'down' ? rect.y - off : dir === 'up' ? rect.y + off : rect.y,
        };
        const dst = intersectRect({ x: pos.x, y: pos.y, w: rect.w, h: rect.h }, screen);
        const src: Rect | null = dst ? { x: rect.x + (dst.x - pos.x), y: rect.y + (dst.y - pos.y), w: dst.w, h: dst.h } : null;
        const f = rc.start + j;
        if (dst && src && !(rectsEqual(src, prevSrc) && rectsEqual(dst, prevDst))) draw(f, clip.id, hmmm(src, dst.x, dst.y));
        // wipe the trail: what the layer covered last frame and no longer covers
        const trail = prevDst ? (dst ? subtractRect(prevDst, dst) : [prevDst]) : [];
        for (const t of trail) for (const op of paintBackground(t)) draw(f, clip.id, op);
        prevSrc = src;
        prevDst = dst;
      }
    }
  }

  // -- static picture, drawn before frame 0 ----------------------------------------
  const prelude: FxOp[] = [];
  for (const piece of subtractAll(screen, dynRects)) {
    const bounds = contentBounds(px, piece);
    if (bounds) prelude.push(hmmm(bounds, bounds.x, bounds.y));
  }

  // -- palette ------------------------------------------------------------------------
  const fadeClips = (target: string) => timeline.clips.filter(rc => rc.clip.effect === 'fade' && rc.clip.target === target);
  const globalFade = fadeClips(FX_SCREEN_TARGET);
  const groupFade = plan.groups.map(g => (g.layerId ? fadeClips(g.layerId) : []));
  const paletteAt = (frame: number): FxRgb[] => {
    const globalLevel = fadeLevelAt(globalFade, frame);
    const pal: FxRgb[] = Array.from({ length: 16 }, () => [0, 0, 0] as FxRgb);
    plan.groups.forEach((g, gi) => {
      const level = fadeLevelAt(groupFade[gi], frame);
      for (let s = g.first; s < g.first + g.count; s++) pal[s] = scaleRgb(plan.palette[s], level, globalLevel);
    });
    return pal;
  };
  const sameRgb = (a: FxRgb, b: FxRgb) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

  // -- sounds ---------------------------------------------------------------------------
  const tableIds: string[] = [];
  const tableRecords: number[][][] = [];
  interface PendingSound { clipId: string; soundAssetId: string; tableIndex: number; frame: number; label: string }
  const pendingSounds: PendingSound[] = [];
  for (const rc of timeline.clips) {
    for (const snd of rc.clip.sounds ?? []) {
      const sound = lookupSound(options.sounds, snd.soundAssetId);
      const compiled = sound ? compilePsgOneShotRecords(sound) : undefined;
      if (!sound || !compiled) continue; // already warned by the validation
      let tableIndex = tableIds.indexOf(snd.soundAssetId);
      if (tableIndex < 0) { tableIndex = tableIds.length; tableIds.push(snd.soundAssetId); tableRecords.push(compiled.records); }
      const anchor = snd.at === 'end' ? Math.max(rc.start, rc.end - 1) : rc.start;
      let frame = anchor + (snd.offsetFrames ?? 0);
      if (frame < 0) {
        warnings.push(`El sonido «${sound.name || snd.soundAssetId}» de ${describeClip(rc.clip, asset.layers)} empezaría antes del frame 0: se adelanta al frame 0.`);
        frame = 0;
      }
      pendingSounds.push({ clipId: rc.clip.id, soundAssetId: snd.soundAssetId, tableIndex, frame, label: sound.name || snd.soundAssetId });
      frameAt(frame).sfx.push(tableIndex);
    }
  }
  const logicalFrames = Math.max(timeline.totalFrames, frames.length);
  frameAt(logicalFrames - 1 >= 0 ? logicalFrames - 1 : 0);
  while (frames.length < logicalFrames) frames.push({ draw: [], sfx: [], clips: [] });

  // -- WAITKEY positions: before the group of frame `f` (f = logicalFrames: after the last one) ------------
  const waitBefore = new Map<number, number>();
  for (const rc of timeline.clips) {
    if (rc.clip.effect === 'hold' && rc.clip.params.waitForKey) waitBefore.set(rc.end, (waitBefore.get(rc.end) ?? 0) + 1);
  }

  // -- assemble the main stream, group by group ---------------------------------------------------------
  const mainOps: FxOp[] = [];
  const frameInfo: FxFrameInfo[] = [];
  const stretched = new Map<string, { label: string; maxCostUs: number; maxTicks: number }>();
  let tickCursor = 0;
  const groupTicks = (ops: FxOp[]) => {
    let cpu = 0; let vdp = 0;
    for (const op of ops) { const c = opCostUs(op); cpu += c.cpu; vdp += c.vdp; }
    const cost = cpu + vdp;
    return { cpu, vdp, cost, ticks: Math.max(1, Math.ceil(cost / FX_FRAME_US - 1e-9)) };
  };

  let prevPalette: FxRgb[] | null = null;
  const emitPalette = (pal: FxRgb[]): FxOp[] => {
    if (!prevPalette) {
      prevPalette = pal.map(c => [...c] as FxRgb);
      return [{ op: 'PALRUN', first: 0, colors: pal.map(c => [...c] as FxRgb) }];
    }
    const ops: FxOp[] = [];
    for (const g of plan.groups) {
      let lo = -1; let hi = -1;
      for (let s = g.first; s < g.first + g.count; s++) {
        if (!sameRgb(pal[s], prevPalette[s])) { if (lo < 0) lo = s; hi = s; }
      }
      if (lo < 0) continue;
      ops.push(lo === hi ? { op: 'PAL', index: lo, rgb: [...pal[lo]] as FxRgb } : { op: 'PALRUN', first: lo, colors: pal.slice(lo, hi + 1).map(c => [...c] as FxRgb) });
    }
    prevPalette = pal.map(c => [...c] as FxRgb);
    return ops;
  };

  // preparation group: the whole initial palette and the static picture
  {
    const ops = [...emitPalette(paletteAt(-1)), ...prelude];
    const { cpu, vdp, cost, ticks } = groupTicks(ops);
    mainOps.push(...ops, { op: 'SYNC', n: ticks });
    frameInfo.push({ frame: -1, tickStart: tickCursor, ticks, cpuUs: cpu, vdpUs: vdp, costUs: cost, opCount: ops.length });
    if (ticks > 1) warnings.push(`La preparación de la imagen estática tarda ${ticks} ticks (~${(cost / 1000).toFixed(0)} ms) antes de que empiece el primer frame.`);
    tickCursor += ticks;
  }
  const frameTick: number[] = [];
  for (let f = 0; f < logicalFrames; f++) {
    for (let k = waitBefore.get(f) ?? 0; k > 0; k--) mainOps.push({ op: 'WAITKEY' });
    const fb = frames[f];
    const ops: FxOp[] = [...emitPalette(paletteAt(f)), ...fb.sfx.map(id => ({ op: 'SFX', id }) as FxOp), ...fb.draw];
    const { cpu, vdp, cost, ticks } = groupTicks(ops);
    mainOps.push(...ops, { op: 'SYNC', n: ticks });
    frameInfo.push({ frame: f, tickStart: tickCursor, ticks, cpuUs: cpu, vdpUs: vdp, costUs: cost, opCount: ops.length });
    frameTick[f] = tickCursor;
    if (ticks > 1) {
      for (const clipId of fb.clips) {
        const rc = timeline.clips.find(c => c.clip.id === clipId)!;
        const prev = stretched.get(clipId);
        stretched.set(clipId, { label: describeClip(rc.clip, asset.layers), maxCostUs: Math.max(prev?.maxCostUs ?? 0, cost), maxTicks: Math.max(prev?.maxTicks ?? 0, ticks) });
      }
    }
    tickCursor += ticks;
  }
  for (const s of stretched.values()) {
    warnings.push(`El clip ${s.label} no cabe en 1/60 s: ~${(s.maxCostUs / 1000).toFixed(1)} ms por fotograma, así que cada fotograma dura hasta ${s.maxTicks} ticks (~${Math.floor(60 / s.maxTicks)} fps).`);
  }

  // -- sound events (real ticks) and collisions ---------------------------------------------------------------------
  const soundEvents: FxSoundEvent[] = pendingSounds.map(p => {
    const tick = frameTick[p.frame] ?? tickCursor;
    const durationFrames = soundFrames(tableRecords[p.tableIndex]);
    return { clipId: p.clipId, soundAssetId: p.soundAssetId, tableIndex: p.tableIndex, frame: p.frame, tick, endTick: tick + durationFrames, durationFrames };
  }).sort((a, b) => a.tick - b.tick);
  const labelOf = new Map(pendingSounds.map(p => [`${p.clipId}|${p.frame}|${p.tableIndex}`, p.label]));
  for (let i = 1; i < soundEvents.length; i++) {
    const prev = soundEvents[i - 1]; const cur = soundEvents[i];
    if (cur.tick < prev.endTick) {
      const a = labelOf.get(`${prev.clipId}|${prev.frame}|${prev.tableIndex}`);
      const b = labelOf.get(`${cur.clipId}|${cur.frame}|${cur.tableIndex}`);
      warnings.push(`El sonido «${b}» corta a «${a}» en el frame ${cur.frame} (el efecto solo tiene una voz, el canal C).`);
    }
  }
  // let a sound still ringing at the end finish before the trailing waits / END
  const lastEnd = soundEvents.reduce((m, e) => Math.max(m, e.endTick), 0);
  let tail = Math.max(0, lastEnd - tickCursor);
  const tailSyncs: FxOp[] = [];
  while (tail > 0) { const n = Math.min(255, tail); tailSyncs.push({ op: 'SYNC', n }); tail -= n; tickCursor += n; }
  mainOps.push(...tailSyncs);
  for (let k = waitBefore.get(logicalFrames) ?? 0; k > 0; k--) mainOps.push({ op: 'WAITKEY' });
  mainOps.push({ op: 'END' });

  // -- skip sequence: reach the final state from wherever the animation was ---------------------------------------------
  const finalOps: FxOp[] = [];
  if (asset.skippable) {
    finalOps.push({ op: 'PALRUN', first: 0, colors: paletteAt(Number.MAX_SAFE_INTEGER).map(c => [...c] as FxRgb) });
    // everything the animation touched after the preparation, minus the dynamic layers (which are redrawn whole)
    const covered: Rect[] = [];
    for (const t of touched) {
      for (const piece of subtractAll(t, [...dynRects, ...covered])) covered.push(piece);
    }
    for (const piece of covered) finalOps.push(...paintBackground(piece));
    for (const d of dynRects) finalOps.push(hasContent(px, d) ? hmmm(d, d.x, d.y) : hmmvZero(d));
    finalOps.push({ op: 'END' });
  }

  // -- the block ---------------------------------------------------------------------------------------------------------------
  if (tickCursor > FX_MAX_TOTAL_TICKS) return failed([`El efecto dura ${tickCursor} ticks; el máximo es ${FX_MAX_TOTAL_TICKS}.`], warnings);
  const bytes = assembleFxBlock({
    skippable: asset.skippable, backdrop: 0, mainOps, finalOps, sounds: tableRecords, totalFrames: tickCursor,
  });
  if (bytes.length > FX_MAX_BLOCK_BYTES) {
    return failed([`El flujo de la transición ocupa ${bytes.length} bytes y no cabe en el banco del intérprete (máximo ${FX_MAX_BLOCK_BYTES}).`], warnings);
  }
  return { bytes, errors: [], warnings, derived, timeline, frames: frameInfo, soundEvents, totalTicks: tickCursor, mainOps, finalOps };
}

/**
 * Compiles the effect into the byte block the editor's Play decodes and the ROM
 * replays. `image` is the SOURCE presentation (`readFxSourceImage`); the derived
 * image comes from `deriveFxImage`. Throws with every error message when the
 * asset is invalid; warnings are available through `compileTransitionDetailed`.
 */
export function compileTransition(asset: unknown, image: FxSourceImage, options: FxCompileOptions = {}): Uint8Array {
  const result = compileTransitionDetailed(asset, image, options);
  if (result.errors.length) throw new Error(`No se puede compilar la transición:\n- ${result.errors.join('\n- ')}`);
  return result.bytes;
}
