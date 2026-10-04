import type {
  Msx2IntroAsset,
  Msx2IntroImage,
  Msx2IntroRect,
  Msx2IntroSlide,
  Msx2IntroStep,
  Msx2HudFontAsset,
  Msx2IntroTextZone,
  Msx2Screen5PresentationConfig,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../types';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots } from './msx2PaletteUtils';
import {
  buildScreen5FlowFontBytes,
  SCREEN5_FLOW_CHAR_HEIGHT,
  SCREEN5_FLOW_FONT_FIRST_CHAR,
  sanitizeScreen5FlowText,
  wrapScreen5FlowText,
} from './msxGenerator/generators/msx2/msx2Screen5FlowFont';

/**
 * Pure helpers shared by the Intro editor (layout, preview, validation) and,
 * later, by the ASM exporter. Nothing here touches the DOM except
 * `drawIntroBuffer`, so the typewriter timing in `stepIntroPlayer` can be
 * unit-tested and mirrored 1:1 by the Z80 runtime.
 */

export const INTRO_SCREEN_W = 256;
export const INTRO_SCREEN_H = 192;
/** Glyph cell: 6 px wide (3 bytes), 8 px tall — the GameFlow font. */
export const INTRO_CHAR_W = 6;
export const INTRO_CHAR_H = SCREEN5_FLOW_CHAR_HEIGHT;
export const INTRO_MIN_LINE_SPACING = 8;
export const INTRO_MAX_LINE_SPACING = 16;

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

export const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

let uidCounter = 0;
export const newIntroId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

// --------------------------------------------------------------------------
// Rectangles
// --------------------------------------------------------------------------

/**
 * Clamps a screen rectangle inside 256x192 and forces x and w to be even
 * (SCREEN 5 stores two pixels per byte, so blits are byte-aligned).
 */
export function normalizeScreenRect(rect: Partial<Msx2IntroRect> | undefined, minW = 2, minH = 1): Msx2IntroRect {
  let w = clampInt(rect?.w, minW, INTRO_SCREEN_W, 32);
  w -= w % 2;
  w = Math.max(2, w);
  let x = clampInt(rect?.x, 0, INTRO_SCREEN_W - w, 0);
  x -= x % 2;
  const h = clampInt(rect?.h, minH, INTRO_SCREEN_H, 16);
  const y = clampInt(rect?.y, 0, INTRO_SCREEN_H - h, 0);
  return { x, y, w, h };
}

export function normalizeCropRect(rect: Partial<Msx2IntroRect> | undefined, srcW: number, srcH: number): Msx2IntroRect {
  const w = clampInt(rect?.w, 1, srcW, srcW);
  const h = clampInt(rect?.h, 1, srcH, srcH);
  return {
    x: clampInt(rect?.x, 0, srcW - w, 0),
    y: clampInt(rect?.y, 0, srcH - h, 0),
    w,
    h,
  };
}

// --------------------------------------------------------------------------
// Defaults
// --------------------------------------------------------------------------

export function createIntroTextZone(name = 'Text'): Msx2IntroTextZone {
  return {
    id: newIntroId('zone'),
    name,
    rect: { x: 8, y: 152, w: 240, h: 32 },
    fg: 15,
    bg: 1,
    lineSpacing: 10,
    charDelayFrames: 3,
  };
}

export function createIntroImage(sourceAssetId?: string, srcW = INTRO_SCREEN_W, srcH = INTRO_SCREEN_H): Msx2IntroImage {
  return {
    id: newIntroId('img'),
    name: 'Image',
    sourceAssetId,
    crop: { x: 0, y: 0, w: srcW, h: srcH },
    dest: normalizeScreenRect({ x: 0, y: 0, w: Math.min(INTRO_SCREEN_W, srcW), h: Math.min(144, srcH) }),
  };
}

export function createIntroStep(zoneId: string): Msx2IntroStep {
  return { id: newIntroId('step'), zoneId, text: 'HELLO', clearBefore: true, autoAdvanceFrames: 0 };
}

export function createIntroSlide(name = 'Slide'): Msx2IntroSlide {
  const zone = createIntroTextZone();
  return {
    id: newIntroId('slide'),
    name,
    backgroundColor: 1,
    palette: createDefaultScreen5PaletteSlots(),
    images: [],
    textZones: [zone],
    steps: [createIntroStep(zone.id)],
    transitionIn: 'cut',
    transitionOut: 'cut',
  };
}

export function createDefaultMsx2Intro(id: string, name: string): Msx2IntroAsset {
  return { id, name, target: 'MSX2', slides: [createIntroSlide('Slide 1')] };
}

// --------------------------------------------------------------------------
// Sources
// --------------------------------------------------------------------------

export interface IntroImageSource {
  width: number;
  height: number;
  pixels: number[][];
  palette: Screen5PaletteSlot[];
}

/** Reads the indexed pixels of an `msx2presentation` asset (tolerates the `data` wrapper). */
export function resolveIntroImageSource(assets: ProjectAsset[], assetId?: string): IntroImageSource | null {
  if (!assetId) return null;
  const asset = assets.find(a => a.id === assetId && a.type === 'msx2presentation');
  const cfg = asset?.data as Msx2Screen5PresentationConfig | undefined;
  if (!cfg) return null;
  let pixels = (cfg.pixels?.length ? cfg.pixels : cfg.data?.pixels) as number[][] | undefined;
  if (!pixels || !pixels.length || !pixels[0]?.length) {
    // Some presentations only carry the packed 4bpp bitmap (128 bytes per 256px row, left pixel in the high nibble).
    const packed = (cfg.packedBitmap?.length ? cfg.packedBitmap : cfg.data?.packedBitmap) as number[] | undefined;
    if (!packed || packed.length < 128 || packed.length % 128 !== 0) return null;
    pixels = Array.from({ length: packed.length / 128 }, (_u, y) =>
      Array.from({ length: 256 }, (_v, x) => {
        const byte = packed[y * 128 + (x >> 1)] ?? 0;
        return (x & 1 ? byte : byte >> 4) & 15;
      }));
  }
  return {
    width: pixels[0].length,
    height: pixels.length,
    pixels,
    palette: ensureScreen5PaletteSlots(cfg.palette).slots,
  };
}

// --------------------------------------------------------------------------
// Colour helpers
// --------------------------------------------------------------------------

export type Rgb = { r: number; g: number; b: number };

export function slotToRgb(slot: Screen5PaletteSlot | undefined): Rgb {
  const hex = slot?.hex;
  if (!hex || hex === TRANSPARENT_HEX || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

/** Maps every source slot to the closest slot of the slide palette (slot 0 excluded as a target). */
export function buildSlotRemap(source: Screen5PaletteSlot[], target: Screen5PaletteSlot[], transparentTo: number): number[] {
  const targetRgb = target.map(slotToRgb);
  return source.map(slot => {
    if (slot.hex === TRANSPARENT_HEX) return transparentTo;
    const c = slotToRgb(slot);
    let best = 1;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 1; i < targetRgb.length; i++) {
      if (target[i]?.hex === TRANSPARENT_HEX) continue;
      const dr = c.r - targetRgb[i].r;
      const dg = c.g - targetRgb[i].g;
      const db = c.b - targetRgb[i].b;
      const d = dr * dr + dg * dg + db * db;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return bestDist === Number.POSITIVE_INFINITY ? transparentTo : best;
  });
}

/** 1 bpp images: every source slot becomes `ink` or `paper`, whichever is closer (transparent = paper). */
export function buildMonoRemap(source: Screen5PaletteSlot[], target: Screen5PaletteSlot[], mono: { ink: number; paper: number }): number[] {
  const ink = mono.ink & 15;
  const paper = mono.paper & 15;
  const inkRgb = slotToRgb(target[ink]);
  const paperRgb = slotToRgb(target[paper]);
  const dist = (a: Rgb, b: Rgb) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
  return source.map(slot => {
    if (slot.hex === TRANSPARENT_HEX) return paper;
    const c = slotToRgb(slot);
    return dist(c, inkRgb) < dist(c, paperRgb) ? ink : paper;
  });
}

/** Default ink/paper when an image is switched to 1 bpp: white-ish on black-ish slots of the slide palette. */
export function defaultIntroMono(palette: Screen5PaletteSlot[]): { ink: number; paper: number } {
  const lum = (i: number) => { const c = slotToRgb(palette[i]); return c.r * 3 + c.g * 6 + c.b; };
  let ink = 15;
  let paper = 1;
  for (let i = 1; i < 16; i++) {
    if (palette[i]?.hex === TRANSPARENT_HEX) continue;
    if (lum(i) > lum(ink)) ink = i;
    if (lum(i) < lum(paper)) paper = i;
  }
  return { ink, paper };
}

/** ROM bytes of an image's pixel data: 4 bpp = w/2 per row, 1 bpp = ceil(w/8) per row. */
export function introImageRomBytes(image: Msx2IntroImage): number {
  const dest = normalizeScreenRect(image.dest);
  return (image.mono ? Math.ceil(dest.w / 8) : dest.w >> 1) * dest.h;
}

// --------------------------------------------------------------------------
// Composition (base layer: background + images)
// --------------------------------------------------------------------------

export const createIntroBuffer = (): Uint8Array => new Uint8Array(INTRO_SCREEN_W * INTRO_SCREEN_H);

export function fillRect(buf: Uint8Array, rect: Msx2IntroRect, color: number): void {
  const x1 = Math.min(INTRO_SCREEN_W, rect.x + rect.w);
  const y1 = Math.min(INTRO_SCREEN_H, rect.y + rect.h);
  for (let y = Math.max(0, rect.y); y < y1; y++) {
    buf.fill(color & 15, y * INTRO_SCREEN_W + Math.max(0, rect.x), y * INTRO_SCREEN_W + x1);
  }
}

/**
 * Palette-index pixels of one image after crop, nearest-neighbour scaling and
 * remapping to the slide palette. Shared by the editor preview and the ROM
 * exporter so both draw exactly the same pixels. Null when the source is gone.
 */
export function renderIntroImagePixels(
  slide: Msx2IntroSlide,
  image: Msx2IntroImage,
  assets: ProjectAsset[],
): { dest: Msx2IntroRect; pixels: Uint8Array } | null {
  const src = resolveIntroImageSource(assets, image.sourceAssetId);
  if (!src) return null;
  const palette = ensureScreen5PaletteSlots(slide.palette).slots;
  const remap = image.mono ? buildMonoRemap(src.palette, palette, image.mono) : buildSlotRemap(src.palette, palette, slide.backgroundColor);
  const crop = normalizeCropRect(image.crop, src.width, src.height);
  const dest = normalizeScreenRect(image.dest);
  const pixels = new Uint8Array(dest.w * dest.h);
  for (let dy = 0; dy < dest.h; dy++) {
    const sy = crop.y + Math.min(crop.h - 1, Math.floor((dy * crop.h) / dest.h));
    const srcRow = src.pixels[sy];
    for (let dx = 0; dx < dest.w; dx++) {
      const sx = crop.x + Math.min(crop.w - 1, Math.floor((dx * crop.w) / dest.w));
      pixels[dy * dest.w + dx] = remap[(srcRow?.[sx] ?? 0) & 15] ?? 0;
    }
  }
  return { dest, pixels };
}

/** Background colour + every image (crop scaled nearest-neighbour into dest). */
export function composeIntroSlide(slide: Msx2IntroSlide, assets: ProjectAsset[]): Uint8Array {
  const buf = createIntroBuffer();
  buf.fill(slide.backgroundColor & 15);
  for (const image of slide.images) {
    const rendered = renderIntroImagePixels(slide, image, assets);
    if (!rendered) continue;
    const { dest, pixels } = rendered;
    for (let dy = 0; dy < dest.h; dy++) {
      buf.set(pixels.subarray(dy * dest.w, (dy + 1) * dest.w), (dest.y + dy) * INTRO_SCREEN_W + dest.x);
    }
  }
  return buf;
}

// --------------------------------------------------------------------------
// Fonts
// --------------------------------------------------------------------------

/**
 * A font as the Intro sees it: fixed cell size, a text sanitiser (what the ROM
 * will actually print) and a glyph blitter. `custom` fonts come from an
 * `msx2hudfont` asset (8x8 cells); the built-in one is the 6x8 GameFlow font.
 */
export interface IntroFont {
  id: string | null;
  name: string;
  custom: boolean;
  cellW: number;
  cellH: number;
  /** True for SCREEN 5 bitmap glyphs, which carry their own palette slots. */
  bitmap: boolean;
  paletteAssetId?: string;
  /** Upper-cases / folds text and replaces what the font cannot draw with spaces. */
  sanitize(text: string): string;
  draw(buf: Uint8Array, x: number, y: number, ch: string, fg: number, bg: number): void;
}

let fontCache: number[] | null = null;
const fontBytes = (): number[] => (fontCache ??= buildScreen5FlowFontBytes());

const putCell = (buf: Uint8Array, x: number, y: number, px: number, py: number, value: number) => {
  const gx = x + px;
  const gy = y + py;
  if (gx >= 0 && gx < INTRO_SCREEN_W && gy >= 0 && gy < INTRO_SCREEN_H) buf[gy * INTRO_SCREEN_W + gx] = value & 15;
};

export const BUILTIN_INTRO_FONT: IntroFont = {
  id: null,
  name: 'Built-in 6x8',
  custom: false,
  cellW: INTRO_CHAR_W,
  cellH: INTRO_CHAR_H,
  bitmap: false,
  sanitize: text => text.replace(/\r/g, '').split('\n').map(line => sanitizeScreen5FlowText(line, 4096)).join('\n'),
  draw(buf, x, y, ch, fg, bg) {
    const font = fontBytes();
    const code = ch.charCodeAt(0) - SCREEN5_FLOW_FONT_FIRST_CHAR;
    const base = (code >= 0 && code * 8 + 7 < font.length ? code : 0) * 8;
    for (let row = 0; row < INTRO_CHAR_H; row++) {
      const bits = font[base + row] ?? 0;
      for (let col = 0; col < INTRO_CHAR_W; col++) putCell(buf, x, y, col, row, (bits & (0x80 >> col)) ? fg : bg);
    }
  },
};

const foldAccents = (ch: string): string =>
  ch.toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A').replace(/[ÉÈËÊ]/g, 'E').replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O').replace(/[ÚÙÜÛ]/g, 'U').replace(/Ñ/g, 'N').replace(/Ç/g, 'C');

/** Builds an IntroFont from an `msx2hudfont` asset (8x8 glyphs). */
export function buildIntroFontFromAsset(assetId: string, name: string, font: Msx2HudFontAsset): IntroFont {
  const chars = new Set(Array.from(font.characters ?? ''));
  const pick = (ch: string): string => {
    if (ch === ' ' || chars.has(ch)) return ch;
    const folded = foldAccents(ch);
    return chars.has(folded) ? folded : ' ';
  };
  return {
    id: assetId,
    name,
    custom: true,
    cellW: 8,
    cellH: 8,
    // Every font carries a 1bpp `patterns` mask, also SCREEN 5 colour fonts. The Intro always uses
    // that mask in the zone's text colour, so preview and ROM agree and no bg slot has to be guessed.
    bitmap: false,
    paletteAssetId: font.paletteAssetId,
    sanitize: text => Array.from(text.replace(/\r/g, '')).map(ch => (ch === '\n' ? ch : pick(ch))).join(''),
    draw(buf, x, y, ch, fg, bg) {
      // A space is always blank: HUD fonts may store it as a solid box (their "off" colour).
      const pattern = ch === ' ' ? undefined : font.patterns?.[ch];
      for (let row = 0; row < 8; row++) {
        const bits = Number(pattern?.[row]) || 0;
        for (let col = 0; col < 8; col++) putCell(buf, x, y, col, row, (bits & (0x80 >> col)) ? fg : bg);
      }
    },
  };
}

/**
 * Resolves the font of a zone: zone override, then the intro default, then the
 * built-in one. `missing` is true when an id is set but the asset is gone.
 */
export function resolveIntroFont(assets: ProjectAsset[], zoneFontId?: string, introFontId?: string): { font: IntroFont; missing: boolean } {
  const id = zoneFontId || introFontId;
  if (!id) return { font: BUILTIN_INTRO_FONT, missing: false };
  const asset = assets.find(a => a.id === id && a.type === 'msx2hudfont');
  if (!asset?.data) return { font: BUILTIN_INTRO_FONT, missing: true };
  return { font: buildIntroFontFromAsset(id, asset.name, asset.data as Msx2HudFontAsset), missing: false };
}

// --------------------------------------------------------------------------
// Text
// --------------------------------------------------------------------------

export interface ZoneLayout {
  cols: number;
  rows: number;
  lines: string[];
  /** True when the wrapped text needs more lines than the zone holds. */
  overflow: boolean;
  totalChars: number;
}

/** Word-wrap of already-sanitised text (same algorithm as the walker's wrapScreen5FlowText). */
function wrapPlain(text: string, maxColumns: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(''); continue; }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxColumns && current) {
        lines.push(current);
        current = word.slice(0, maxColumns);
      } else {
        current = candidate.slice(0, maxColumns);
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export function layoutZoneText(zone: Msx2IntroTextZone, text: string, font: IntroFont = BUILTIN_INTRO_FONT): ZoneLayout {
  const cols = Math.max(1, Math.floor(zone.rect.w / font.cellW));
  const spacing = clampInt(zone.lineSpacing, INTRO_MIN_LINE_SPACING, INTRO_MAX_LINE_SPACING, 10);
  const rows = Math.max(1, Math.floor((zone.rect.h - font.cellH) / spacing) + 1);
  const all = font.custom ? wrapPlain(font.sanitize(text), cols) : wrapScreen5FlowText(text, cols, 4096);
  const lines = all.slice(0, rows);
  return {
    cols,
    rows,
    lines,
    overflow: all.length > rows,
    totalChars: lines.reduce((n, l) => n + l.length, 0),
  };
}

/** Paints the first `visibleChars` characters of the laid-out text into the zone. */
export function drawZoneText(buf: Uint8Array, zone: Msx2IntroTextZone, layout: ZoneLayout, visibleChars: number, font: IntroFont = BUILTIN_INTRO_FONT): void {
  const spacing = clampInt(zone.lineSpacing, INTRO_MIN_LINE_SPACING, INTRO_MAX_LINE_SPACING, 10);
  let remaining = visibleChars;
  for (let line = 0; line < layout.lines.length && remaining > 0; line++) {
    const text = layout.lines[line];
    const count = Math.min(remaining, text.length);
    for (let i = 0; i < count; i++) {
      font.draw(buf, zone.rect.x + i * font.cellW, zone.rect.y + line * spacing, text[i], zone.fg & 15, zone.bg & 15);
    }
    remaining -= count;
  }
}

// --------------------------------------------------------------------------
// Player (typewriter state machine — the contract the Z80 runtime mirrors)
// --------------------------------------------------------------------------

export type IntroPhase = 'typing' | 'waiting' | 'done';

export interface IntroPlayerState {
  step: number;
  phase: IntroPhase;
  typed: number;
  /** Frames since the last typed character (typing) or since the text completed (waiting). */
  frames: number;
  /** True only on the frame a step starts (the zone must be cleared/painted). */
  stepStarted: boolean;
}

export const initialIntroPlayerState = (): IntroPlayerState =>
  ({ step: 0, phase: 'typing', typed: 0, frames: 0, stepStarted: true });

/**
 * Advances the preview by one 60 Hz frame. `pressed` is a fresh key edge
 * (SPACE / fire): while typing it completes the text, when waiting it advances.
 * The same press never does both.
 */
export function stepIntroPlayer(
  state: IntroPlayerState,
  slide: Msx2IntroSlide,
  pressed: boolean,
  fontFor: (zone: Msx2IntroTextZone) => IntroFont = () => BUILTIN_INTRO_FONT,
): IntroPlayerState {
  if (state.phase === 'done') return state;
  const step = slide.steps[state.step];
  if (!step) return { ...state, phase: 'done', stepStarted: false };
  const zone = slide.textZones.find(z => z.id === step.zoneId);
  const total = zone ? layoutZoneText(zone, step.text, fontFor(zone)).totalChars : 0;
  const rawDelay = Number(zone?.charDelayFrames);
  const delay = Math.max(1, Number.isFinite(rawDelay) ? rawDelay : 3);
  const base = { ...state, stepStarted: false };

  const advance = (): IntroPlayerState => {
    const next = state.step + 1;
    return next >= slide.steps.length
      ? { ...base, phase: 'done', frames: 0 }
      : { step: next, phase: 'typing', typed: 0, frames: 0, stepStarted: true };
  };

  if (state.phase === 'typing') {
    // Nothing to type: go straight to waiting without spending the key press.
    if (total === 0) return { ...base, typed: 0, phase: 'waiting', frames: 0 };
    if (pressed) return { ...base, typed: total, phase: 'waiting', frames: 0 };
    const frames = state.frames + 1;
    if (frames >= delay) {
      const typed = Math.min(total, state.typed + 1);
      return { ...base, typed, frames: 0, phase: typed >= total ? 'waiting' : 'typing' };
    }
    return { ...base, frames };
  }
  // waiting
  if (pressed) return advance();
  const frames = state.frames + 1;
  if (step.autoAdvanceFrames > 0 && frames >= step.autoAdvanceFrames) return advance();
  return { ...base, frames };
}

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

const overlaps = (a: Msx2IntroRect, b: Msx2IntroRect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * The palette at fade level 0..7 (7 = as authored, 0 = black). Scales every colour channel the way the
 * ROM does: round(component * level / 7).
 */
export function scaleSlotsBrightness(slots: Screen5PaletteSlot[], level: number): Screen5PaletteSlot[] {
  if (level >= 7) return slots;
  const lv = Math.max(0, level);
  // The V9938 palette has 3 bits per channel (8-bit value = round(c * 255 / 7)); the ROM scales those 3-bit
  // components, so the preview does too instead of scaling the 8-bit colour (which would differ by a few steps).
  const to = (v8: number) => {
    const scaled = Math.round((Math.round((v8 * 7) / 255) * lv) / 7);
    return Math.round((scaled * 255) / 7).toString(16).padStart(2, '0');
  };
  return slots.map(slot => {
    const { r, g, b } = slotToRgb(slot);
    return slot.hex === TRANSPARENT_HEX ? slot : { ...slot, hex: `#${to(r)}${to(g)}${to(b)}` };
  });
}

/** Problems with the intro-level music option (a track that no longer exists). */
export function validateIntroMusic(intro: Msx2IntroAsset | undefined, assets: ProjectAsset[]): string[] {
  const id = intro?.musicTrackAssetId;
  if (!id || id === '__none') return [];
  return assets.some(a => a.id === id && a.type === 'track')
    ? []
    : [`Intro music: the selected track no longer exists (track 0 will be used); pick a track, Silence or Keep.`];
}

export function validateIntroSlide(slide: Msx2IntroSlide, assets: ProjectAsset[], introFontId?: string): string[] {
  const out: string[] = [];
  const inScreen = (r: Msx2IntroRect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= INTRO_SCREEN_W && r.y + r.h <= INTRO_SCREEN_H;
  slide.images.forEach(img => {
    if (!resolveIntroImageSource(assets, img.sourceAssetId)) out.push(`Image "${img.name}": missing or empty source presentation.`);
    if (!inScreen(img.dest)) out.push(`Image "${img.name}": outside the 256x192 screen.`);
    if (img.dest.x % 2 || img.dest.w % 2) out.push(`Image "${img.name}": x and width must be even.`);
    if (img.mono && (img.mono.ink & 15) === (img.mono.paper & 15)) out.push(`Image "${img.name}": 1-bit ink and paper are the same slot (the image is a solid box).`);
  });
  slide.textZones.forEach(zone => {
    if (!inScreen(zone.rect)) out.push(`Text zone "${zone.name}": outside the 256x192 screen.`);
    if (zone.rect.x % 2 || zone.rect.w % 2) out.push(`Text zone "${zone.name}": x and width must be even.`);
    const { font, missing } = resolveIntroFont(assets, zone.fontAssetId, introFontId);
    if (missing) out.push(`Text zone "${zone.name}": its font asset no longer exists (built-in font used).`);
    if (zone.rect.w < font.cellW || zone.rect.h < font.cellH) out.push(`Text zone "${zone.name}": too small for one ${font.cellW}x${font.cellH} character.`);
    if (zone.fg === zone.bg) out.push(`Text zone "${zone.name}": text and background colour are the same slot.`);
  });
  slide.steps.forEach((step, i) => {
    const zone = slide.textZones.find(z => z.id === step.zoneId);
    if (!zone) { out.push(`Step ${i + 1}: its text zone no longer exists.`); return; }
    const { font } = resolveIntroFont(assets, zone.fontAssetId, introFontId);
    if (layoutZoneText(zone, step.text, font).overflow) out.push(`Step ${i + 1}: text does not fit in "${zone.name}" and will be cut.`);
    const raw = step.text.replace(/\r/g, '');
    const clean = font.sanitize(raw);
    if (Array.from(raw).some((ch, k) => ch !== ' ' && ch !== '\n' && Array.from(clean)[k] === ' ')) {
      out.push(`Step ${i + 1}: some characters are not in the font "${font.name}" and become spaces.`);
    }
  });
  for (let i = 0; i < slide.textZones.length; i++) {
    for (let j = i + 1; j < slide.textZones.length; j++) {
      if (overlaps(slide.textZones[i].rect, slide.textZones[j].rect)) {
        out.push(`Text zones "${slide.textZones[i].name}" and "${slide.textZones[j].name}" overlap.`);
      }
    }
  }
  if (slide.steps.length === 0) out.push('Slide has no steps: it would show no text.');
  return out;
}

// --------------------------------------------------------------------------
// Canvas drawing (only DOM-touching helper)
// --------------------------------------------------------------------------

/**
 * `palette` must already be normalised (ensureScreen5PaletteSlots): it is used as given, because
 * re-normalising would rebuild every colour from its master index and undo a fade.
 */
export function drawIntroBuffer(canvas: HTMLCanvasElement, buf: Uint8Array, palette: Screen5PaletteSlot[], scale: number): void {
  const slots = palette.length === 16 ? palette : ensureScreen5PaletteSlots(palette).slots;
  const rgb = slots.map(slotToRgb);
  const off = document.createElement('canvas');
  off.width = INTRO_SCREEN_W;
  off.height = INTRO_SCREEN_H;
  const octx = off.getContext('2d');
  const ctx = canvas.getContext('2d');
  if (!octx || !ctx) return;
  const img = octx.createImageData(INTRO_SCREEN_W, INTRO_SCREEN_H);
  for (let i = 0; i < buf.length; i++) {
    const c = rgb[buf[i] & 15];
    img.data[i * 4] = c.r;
    img.data[i * 4 + 1] = c.g;
    img.data[i * 4 + 2] = c.b;
    img.data[i * 4 + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  canvas.width = INTRO_SCREEN_W * scale;
  canvas.height = INTRO_SCREEN_H * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
}

/** Pixels of the 5x3 "more" triangle that lie inside its shape. */
const MARKER_W = 5;
const MARKER_H = 3;

export interface WaitMarkerSave {
  x: number;
  y: number;
  /** Pixels that were under the marker; null while the marker is not drawn. */
  px: number[] | null;
}

export const createWaitMarkerSave = (): WaitMarkerSave => ({ x: 0, y: 0, px: null });

/** Puts back the pixels that the marker covered (no-op when it is not drawn). */
export function restoreWaitMarker(buf: Uint8Array, save: WaitMarkerSave): void {
  if (!save.px) return;
  let k = 0;
  for (let row = 0; row < MARKER_H; row++) {
    for (let col = 0; col < MARKER_W; col++, k++) {
      const px = save.x + col;
      const py = save.y + row;
      if (px < 0 || px >= INTRO_SCREEN_W || py < 0 || py >= INTRO_SCREEN_H) continue;
      buf[py * INTRO_SCREEN_W + px] = save.px[k];
    }
  }
  save.px = null;
}

/**
 * Shows/hides the blinking "more" triangle at the bottom-right corner of a
 * zone. Only the triangle's own pixels are touched and the pixels beneath are
 * saved, so hiding it never damages the text.
 */
export function paintWaitMarker(buf: Uint8Array, zone: Msx2IntroTextZone, on: boolean, save: WaitMarkerSave): void {
  const x0 = zone.rect.x + zone.rect.w - 8;
  const y0 = zone.rect.y + zone.rect.h - 4;
  if (!on) { restoreWaitMarker(buf, save); return; }
  if (save.px && (save.x !== x0 || save.y !== y0)) restoreWaitMarker(buf, save);
  if (!save.px) {
    save.x = x0;
    save.y = y0;
    save.px = [];
    for (let row = 0; row < MARKER_H; row++) {
      for (let col = 0; col < MARKER_W; col++) {
        const px = x0 + col;
        const py = y0 + row;
        save.px.push(px < 0 || px >= INTRO_SCREEN_W || py < 0 || py >= INTRO_SCREEN_H ? 0 : buf[py * INTRO_SCREEN_W + px]);
      }
    }
  }
  for (let row = 0; row < MARKER_H; row++) {
    for (let col = 0; col < MARKER_W; col++) {
      const px = x0 + col;
      const py = y0 + row;
      if (px < 0 || px >= INTRO_SCREEN_W || py < 0 || py >= INTRO_SCREEN_H) continue;
      if (col >= row && col <= MARKER_W - 1 - row) buf[py * INTRO_SCREEN_W + px] = zone.fg & 15;
    }
  }
}
