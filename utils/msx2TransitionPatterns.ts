/**
 * SCREEN 5 GameFlow transitions: vocabulary, dissolve patterns and the
 * "fill plan" builder shared by the editor (labels, pattern previews,
 * validation) and the ASM generators (utils/msxGenerator/generators/msx2/
 * screen5TransitionEngine.ts).
 *
 * A fill plan describes a block transition as a tile repeated across the
 * 256x212 visible page plus, for every animation step, the list of rectangles
 * (tile-local pixels) painted in that step. Every SCREEN 5 runtime plays the
 * same plan with the V9938 HMMV command, so a wipe, a venetian blind and a
 * Bayer dissolve all share one Z80 routine.
 *
 * Pure TypeScript, no React / generator imports: safe to use from both sides.
 */

import type {
  Msx2GameFlowTransitionNode,
  Msx2TransitionCustomPattern,
  Msx2TransitionDirection,
  Msx2TransitionIrisShape,
  Msx2TransitionPatternId,
  Msx2TransitionRgb,
} from '../types';

export const SCREEN5_TFX_WIDTH = 256;
export const SCREEN5_TFX_HEIGHT = 212;

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export type Screen5AdvancedTransitionEffect =
  | 'screen5_wipe'
  | 'screen5_blinds'
  | 'screen5_pattern'
  | 'screen5_iris'
  | 'palette_fade_out'
  | 'palette_fade_in'
  | 'palette_fade_out_in'
  | 'palette_crossfade'
  | 'palette_flash';

export const SCREEN5_FILL_TRANSITION_EFFECTS: ReadonlySet<string> = new Set([
  'screen5_wipe',
  'screen5_blinds',
  'screen5_pattern',
  'screen5_iris',
]);

export const SCREEN5_PALETTE_TRANSITION_EFFECTS: ReadonlySet<string> = new Set([
  'palette_fade_out',
  'palette_fade_in',
  'palette_fade_out_in',
  'palette_crossfade',
  'palette_flash',
]);

export const SCREEN5_ADVANCED_TRANSITION_EFFECTS: ReadonlySet<string> = new Set([
  ...SCREEN5_FILL_TRANSITION_EFFECTS,
  ...SCREEN5_PALETTE_TRANSITION_EFFECTS,
]);

/** Effects whose runtime needs the NEXT node to be a Screen5Presentation. */
export const SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE: ReadonlySet<string> = new Set([
  'palette_fade_in',
  'palette_fade_out_in',
  'palette_crossfade',
]);

export const SCREEN5_ADVANCED_TRANSITION_OPTIONS: Array<{ value: Screen5AdvancedTransitionEffect; label: string; group: 'block' | 'palette' }> = [
  { value: 'screen5_wipe', label: 'Wipe (direction)', group: 'block' },
  { value: 'screen5_blinds', label: 'Blinds / persianas', group: 'block' },
  { value: 'screen5_pattern', label: 'Pattern dissolve', group: 'block' },
  { value: 'screen5_iris', label: 'Iris (circle / diamond / box)', group: 'block' },
  { value: 'palette_fade_out', label: 'Palette fade out (to colour)', group: 'palette' },
  { value: 'palette_fade_in', label: 'Palette fade in (next scene)', group: 'palette' },
  { value: 'palette_fade_out_in', label: 'Palette fade out + in (next scene)', group: 'palette' },
  { value: 'palette_crossfade', label: 'Palette crossfade (to next scene palette)', group: 'palette' },
  { value: 'palette_flash', label: 'Palette flash', group: 'palette' },
];

export const SCREEN5_TRANSITION_DIRECTION_OPTIONS: Array<{ value: Msx2TransitionDirection; label: string }> = [
  { value: 'left_to_right', label: 'Left -> right' },
  { value: 'right_to_left', label: 'Right -> left' },
  { value: 'top_to_bottom', label: 'Top -> bottom' },
  { value: 'bottom_to_top', label: 'Bottom -> top' },
  { value: 'center_out_h', label: 'Centre -> sides (horizontal)' },
  { value: 'edges_in_h', label: 'Sides -> centre (horizontal)' },
  { value: 'center_out_v', label: 'Centre -> top/bottom (vertical)' },
  { value: 'edges_in_v', label: 'Top/bottom -> centre (vertical)' },
  { value: 'diagonal_tl', label: 'Diagonal from top-left' },
  { value: 'diagonal_tr', label: 'Diagonal from top-right' },
  { value: 'diagonal_bl', label: 'Diagonal from bottom-left' },
  { value: 'diagonal_br', label: 'Diagonal from bottom-right' },
];

/** Directions each block effect understands (the editor filters its dropdown with this). */
export const SCREEN5_TRANSITION_DIRECTIONS_BY_EFFECT: Record<string, Msx2TransitionDirection[]> = {
  screen5_wipe: SCREEN5_TRANSITION_DIRECTION_OPTIONS.map(option => option.value),
  screen5_blinds: ['left_to_right', 'right_to_left', 'top_to_bottom', 'bottom_to_top', 'center_out_h', 'edges_in_h', 'center_out_v', 'edges_in_v'],
  screen5_iris: ['center_out_h', 'edges_in_h'],
  screen5_pattern: [],
};

export const SCREEN5_TRANSITION_PATTERN_OPTIONS: Array<{ value: Msx2TransitionPatternId; label: string }> = [
  { value: 'checker', label: 'Checkerboard (2 steps)' },
  { value: 'bayer4', label: 'Bayer dither 4x4 (16 steps)' },
  { value: 'bayer8', label: 'Bayer dither 8x8 (64 steps)' },
  { value: 'lines_h', label: 'Interlaced lines (horizontal)' },
  { value: 'lines_v', label: 'Interlaced lines (vertical)' },
  { value: 'diamond', label: 'Diamonds' },
  { value: 'circle', label: 'Circles' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'random', label: 'Random' },
  { value: 'custom', label: 'Custom mask' },
];

export const SCREEN5_TRANSITION_IRIS_OPTIONS: Array<{ value: Msx2TransitionIrisShape; label: string }> = [
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'box', label: 'Box' },
];

/** Block sizes each effect accepts (the first one is the default). */
export const SCREEN5_TRANSITION_BLOCK_SIZES: Record<string, number[]> = {
  screen5_wipe: [8, 2, 4, 16, 32],
  screen5_blinds: [16, 8, 32, 64],
  screen5_pattern: [4, 8, 16],
  screen5_iris: [8, 4, 16],
  // Legacy wipes, when a parameter override routes them through the engine.
  screen5_vertical_pixel_wipe: [4, 2, 8, 16, 32],
  screen5_horizontal_pixel_wipe: [4, 2, 8, 16, 32],
  screen5_mirror_pixel_wipe: [4, 2, 8, 16, 32],
  screen5_diagonal_pixel_wipe: [16, 8, 32],
};

export const DEFAULT_SCREEN5_FADE_COLOR: Msx2TransitionRgb = { r: 0, g: 0, b: 0 };
export const DEFAULT_SCREEN5_FLASH_COLOR: Msx2TransitionRgb = { r: 7, g: 7, b: 7 };

// ---------------------------------------------------------------------------
// Dissolve patterns (order maps, row-major, 0-based step per cell)
// ---------------------------------------------------------------------------

export interface Screen5OrderMap {
  size: number;
  order: number[];
}

const BAYER4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

function bayer8(): number[] {
  const out: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const base = BAYER4[(y % 4) * 4 + (x % 4)];
      const quadrant = [0, 2, 3, 1][((y >> 2) << 1) | (x >> 2)];
      out.push(base * 4 + quadrant);
    }
  }
  return out;
}

function spiral8(): number[] {
  const size = 8;
  const out = new Array(size * size).fill(0);
  let top = 0;
  let left = 0;
  let bottom = size - 1;
  let right = size - 1;
  let step = 0;
  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) out[top * size + x] = step++;
    top++;
    for (let y = top; y <= bottom; y++) out[y * size + right] = step++;
    right--;
    if (top <= bottom) {
      for (let x = right; x >= left; x--) out[bottom * size + x] = step++;
      bottom--;
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) out[y * size + left] = step++;
      left++;
    }
  }
  // 64 single cells is slow on hardware: pair them into 32 steps.
  return out.map(value => value >> 1);
}

function randomMap(): number[] {
  // Deterministic shuffle (same ROM every build), 64 cells in 16 steps.
  const cells = Array.from({ length: 64 }, (_, index) => index);
  let seed = 0x5a17;
  for (let i = cells.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const out = new Array(64).fill(0);
  cells.forEach((cell, rank) => { out[cell] = rank >> 2; });
  return out;
}

function radialMap(metric: 'diamond' | 'circle'): number[] {
  const out: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const dx = Math.abs(x - 3.5);
      const dy = Math.abs(y - 3.5);
      out.push(metric === 'diamond'
        ? Math.floor(dx + dy)
        : Math.floor(Math.sqrt(dx * dx + dy * dy) * 1.4));
    }
  }
  return out;
}

export function getScreen5PatternOrderMap(patternId: Msx2TransitionPatternId | undefined, custom?: Msx2TransitionCustomPattern): Screen5OrderMap {
  switch (patternId) {
    case 'checker':
      return { size: 2, order: [0, 1, 1, 0] };
    case 'bayer8':
      return { size: 8, order: bayer8() };
    case 'lines_h':
      return { size: 4, order: [0, 0, 0, 0, 2, 2, 2, 2, 1, 1, 1, 1, 3, 3, 3, 3] };
    case 'lines_v':
      return { size: 4, order: [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3] };
    case 'diamond':
      return { size: 8, order: radialMap('diamond') };
    case 'circle':
      return { size: 8, order: radialMap('circle') };
    case 'spiral':
      return { size: 8, order: spiral8() };
    case 'random':
      return { size: 8, order: randomMap() };
    case 'custom': {
      const normalized = normalizeCustomPattern(custom);
      // Custom masks store 1-based steps (0 = never painted).
      return { size: normalized.size, order: normalized.order.map(value => (value > 0 ? value - 1 : -1)) };
    }
    case 'bayer4':
    default:
      return { size: 4, order: [...BAYER4] };
  }
}

export function normalizeCustomPattern(custom: Msx2TransitionCustomPattern | undefined): Msx2TransitionCustomPattern {
  const size: 4 | 8 = custom?.size === 8 ? 8 : 4;
  const source = Array.isArray(custom?.order) ? custom!.order : [];
  const order = Array.from({ length: size * size }, (_, index) => {
    const value = Math.trunc(Number(source[index]));
    return Number.isFinite(value) ? Math.max(0, Math.min(64, value)) : 0;
  });
  if (order.every(value => value === 0)) {
    // Empty mask: fall back to a readable default (Bayer 4x4, 1-based).
    return size === 4
      ? { size, order: BAYER4.map(value => value + 1) }
      : { size, order: bayer8().map(value => (value >> 2) + 1) };
  }
  return { size, order };
}

/** A built-in pattern expressed as a 1-based custom mask (used by "Edit as custom"). */
export function patternToCustomMask(patternId: Msx2TransitionPatternId): Msx2TransitionCustomPattern {
  const map = getScreen5PatternOrderMap(patternId === 'custom' ? 'bayer4' : patternId);
  if (map.size === 2) {
    // Expand the 2x2 checkerboard to 4x4.
    const order: number[] = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) order.push(map.order[(y % 2) * 2 + (x % 2)] + 1);
    return { size: 4, order };
  }
  return { size: map.size === 8 ? 8 : 4, order: map.order.map(value => value + 1) };
}

// ---------------------------------------------------------------------------
// Parameter normalisation
// ---------------------------------------------------------------------------

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Math.trunc(Number(value));
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
};

export function normalizeScreen5Rgb(value: Partial<Msx2TransitionRgb> | undefined, fallback: Msx2TransitionRgb): Msx2TransitionRgb {
  if (!value || typeof value !== 'object') return { ...fallback };
  return {
    r: clampInt(value.r, 0, 7, fallback.r),
    g: clampInt(value.g, 0, 7, fallback.g),
    b: clampInt(value.b, 0, 7, fallback.b),
  };
}

const LEGACY_ENGINE_MAPPING: Record<string, { effect: 'screen5_wipe'; direction: Msx2TransitionDirection }> = {
  screen5_vertical_pixel_wipe: { effect: 'screen5_wipe', direction: 'left_to_right' },
  screen5_horizontal_pixel_wipe: { effect: 'screen5_wipe', direction: 'top_to_bottom' },
  screen5_mirror_pixel_wipe: { effect: 'screen5_wipe', direction: 'edges_in_h' },
  screen5_diagonal_pixel_wipe: { effect: 'screen5_wipe', direction: 'diagonal_tl' },
};

const hasNumber = (value: unknown): boolean => value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value));

/**
 * True when a legacy SCREEN 5 effect (cls, fade_to_black, the four pixel wipes)
 * carries one of the new parameters and therefore has to be played by the
 * engine instead of its original, byte-identical routine.
 */
export function legacyTransitionHasOverrides(node: Partial<Msx2GameFlowTransitionNode>): boolean {
  const effect = String(node.effect || '');
  if (effect === 'cls') return hasNumber(node.fillColorIndex) && Number(node.fillColorIndex) !== 0;
  if (effect === 'fade_to_black') return hasNumber(node.framesPerStep) || Boolean(node.fadeColor);
  if (LEGACY_ENGINE_MAPPING[effect]) {
    return (hasNumber(node.fillColorIndex) && Number(node.fillColorIndex) !== 0)
      || hasNumber(node.blockSize)
      || hasNumber(node.framesPerStep)
      || node.reverse === true;
  }
  return false;
}

/** True when this Transition node needs the shared SCREEN 5 transition engine. */
export function screen5TransitionUsesEngine(node: Partial<Msx2GameFlowTransitionNode> | undefined): boolean {
  if (!node) return false;
  const effect = String(node.effect || '');
  return SCREEN5_ADVANCED_TRANSITION_EFFECTS.has(effect) || legacyTransitionHasOverrides(node);
}

export type Screen5TransitionSpec =
  | {
      kind: 'fill';
      effect: string;
      direction: Msx2TransitionDirection;
      blockSize: number;
      fillColorIndex: number;
      framesPerStep: number;
      reverse: boolean;
      patternId: Msx2TransitionPatternId;
      customPattern?: Msx2TransitionCustomPattern;
      irisShape: Msx2TransitionIrisShape;
    }
  | {
      kind: 'palette';
      effect: 'palette_fade_out' | 'palette_fade_in' | 'palette_fade_out_in' | 'palette_crossfade' | 'palette_flash';
      color: Msx2TransitionRgb;
      framesPerStep: number;
      flashCount: number;
    };

function pickBlockSize(effect: string, value: unknown): number {
  const allowed = SCREEN5_TRANSITION_BLOCK_SIZES[effect] || [8];
  const numeric = Math.trunc(Number(value));
  return allowed.includes(numeric) ? numeric : allowed[0];
}

/**
 * Resolve an engine transition node into a normalised spec. Callers must check
 * `screen5TransitionUsesEngine(node)` first; legacy nodes without overrides
 * keep their original routines.
 */
export function resolveScreen5TransitionSpec(node: Partial<Msx2GameFlowTransitionNode>): Screen5TransitionSpec {
  const effect = String(node.effect || 'cls');
  if (effect === 'fade_to_black') {
    return {
      kind: 'palette',
      effect: 'palette_fade_out',
      color: normalizeScreen5Rgb(node.fadeColor, DEFAULT_SCREEN5_FADE_COLOR),
      framesPerStep: clampInt(node.framesPerStep, 1, 30, 2),
      flashCount: 1,
    };
  }
  if (SCREEN5_PALETTE_TRANSITION_EFFECTS.has(effect)) {
    const isFlash = effect === 'palette_flash';
    return {
      kind: 'palette',
      effect: effect as any,
      color: normalizeScreen5Rgb(node.fadeColor, isFlash ? DEFAULT_SCREEN5_FLASH_COLOR : DEFAULT_SCREEN5_FADE_COLOR),
      framesPerStep: clampInt(node.framesPerStep, 1, 30, isFlash ? 1 : 2),
      flashCount: clampInt(node.flashCount, 1, 4, 1),
    };
  }
  const legacy = LEGACY_ENGINE_MAPPING[effect];
  const engineEffect = effect === 'cls' ? 'cls' : legacy ? legacy.effect : effect;
  const directions = SCREEN5_TRANSITION_DIRECTIONS_BY_EFFECT[engineEffect] || [];
  const requestedDirection = legacy ? legacy.direction : node.direction;
  const direction = requestedDirection && (directions.length === 0 || directions.includes(requestedDirection))
    ? requestedDirection
    : (directions[0] || 'left_to_right');
  return {
    kind: 'fill',
    effect: engineEffect,
    direction,
    blockSize: pickBlockSize(effect === 'cls' ? 'screen5_wipe' : effect, node.blockSize),
    fillColorIndex: clampInt(node.fillColorIndex, 0, 15, 0),
    framesPerStep: clampInt(node.framesPerStep, 1, 30, 1),
    reverse: node.reverse === true,
    patternId: (node.patternId || 'bayer4') as Msx2TransitionPatternId,
    customPattern: node.customPattern,
    irisShape: (node.irisShape === 'diamond' || node.irisShape === 'box') ? node.irisShape : 'circle',
  };
}

// ---------------------------------------------------------------------------
// Fill plans
// ---------------------------------------------------------------------------

export interface Screen5FillRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Screen5FillPlan {
  tileW: number;
  tileH: number;
  tilesX: number;
  tilesY: number;
  steps: Screen5FillRect[][];
}

interface OrderedCell {
  col: number;
  row: number;
  order: number;
}

/**
 * Turn ordered cells into per-step rectangles: horizontal runs in each row are
 * merged, then identical runs on consecutive rows are merged vertically. Keeps
 * a straight wipe to one HMMV per step and a circle to two per row.
 */
function cellsToSteps(cells: OrderedCell[], cellW: number, cellH: number, clipW: number, clipH: number, reverse: boolean): Screen5FillRect[][] {
  const orders = Array.from(new Set(cells.filter(cell => cell.order >= 0).map(cell => cell.order))).sort((a, b) => a - b);
  if (reverse) orders.reverse();
  return orders.map(order => {
    const stepCells = cells.filter(cell => cell.order === order);
    const byRow = new Map<number, number[]>();
    for (const cell of stepCells) {
      const list = byRow.get(cell.row) || [];
      list.push(cell.col);
      byRow.set(cell.row, list);
    }
    const runs: Screen5FillRect[] = [];
    Array.from(byRow.keys()).sort((a, b) => a - b).forEach(row => {
      const cols = byRow.get(row)!.sort((a, b) => a - b);
      let start = cols[0];
      let previous = cols[0];
      const flush = () => {
        const x = start * cellW;
        const y = row * cellH;
        if (x >= clipW || y >= clipH) return;
        runs.push({ x, y, w: Math.min((previous - start + 1) * cellW, clipW - x), h: Math.min(cellH, clipH - y) });
      };
      for (let i = 1; i < cols.length; i++) {
        if (cols[i] === previous + 1) { previous = cols[i]; continue; }
        flush();
        start = cols[i];
        previous = cols[i];
      }
      flush();
    });
    // Vertical merge of identical runs on touching rows.
    const merged: Screen5FillRect[] = [];
    for (const run of runs) {
      const target = merged.find(rect => rect.x === run.x && rect.w === run.w && rect.y + rect.h === run.y && rect.h + run.h <= 212);
      if (target) target.h += run.h;
      else merged.push({ ...run });
    }
    return merged;
  });
}

function globalGridCells(block: number, orderOf: (col: number, row: number, cols: number, rows: number) => number): { cells: OrderedCell[] } {
  const cols = Math.ceil(SCREEN5_TFX_WIDTH / block);
  const rows = Math.ceil(SCREEN5_TFX_HEIGHT / block);
  const cells: OrderedCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) cells.push({ col, row, order: orderOf(col, row, cols, rows) });
  }
  return { cells };
}

const centerDistance = (index: number, count: number): number => {
  const center = (count - 1) / 2;
  return Math.floor(Math.abs(index - center));
};

function directionOrder(direction: Msx2TransitionDirection): (col: number, row: number, cols: number, rows: number) => number {
  switch (direction) {
    case 'right_to_left': return (c, _r, cols) => cols - 1 - c;
    case 'top_to_bottom': return (_c, r) => r;
    case 'bottom_to_top': return (_c, r, _cols, rows) => rows - 1 - r;
    case 'center_out_h': return (c, _r, cols) => centerDistance(c, cols);
    case 'edges_in_h': return (c, _r, cols) => Math.floor((cols - 1) / 2) - centerDistance(c, cols);
    case 'center_out_v': return (_c, r, _cols, rows) => centerDistance(r, rows);
    case 'edges_in_v': return (_c, r, _cols, rows) => Math.floor((rows - 1) / 2) - centerDistance(r, rows);
    case 'diagonal_tl': return (c, r) => c + r;
    case 'diagonal_tr': return (c, r, cols) => (cols - 1 - c) + r;
    case 'diagonal_bl': return (c, r, _cols, rows) => c + (rows - 1 - r);
    case 'diagonal_br': return (c, r, cols, rows) => (cols - 1 - c) + (rows - 1 - r);
    case 'left_to_right':
    default:
      return c => c;
  }
}

const IRIS_STEPS = 28;

export function buildScreen5FillPlan(spec: Extract<Screen5TransitionSpec, { kind: 'fill' }>): Screen5FillPlan {
  const W = SCREEN5_TFX_WIDTH;
  const H = SCREEN5_TFX_HEIGHT;

  if (spec.effect === 'cls') {
    return { tileW: W, tileH: H, tilesX: 1, tilesY: 1, steps: [[{ x: 0, y: 0, w: W, h: H }]] };
  }

  if (spec.effect === 'screen5_wipe') {
    const block = spec.blockSize;
    const { cells } = globalGridCells(block, directionOrder(spec.direction));
    return { tileW: W, tileH: H, tilesX: 1, tilesY: 1, steps: cellsToSteps(cells, block, block, W, H, spec.reverse) };
  }

  if (spec.effect === 'screen5_iris') {
    const block = spec.blockSize;
    const cx = W / 2;
    const cy = H / 2;
    const metric = (x: number, y: number): number => {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      if (spec.irisShape === 'diamond') return dx + dy;
      if (spec.irisShape === 'box') return Math.max(dx, dy * (W / H));
      return Math.sqrt(dx * dx + dy * dy);
    };
    const maxDistance = Math.max(metric(0, 0), metric(W, 0), metric(0, H), metric(W, H));
    const closing = spec.direction === 'edges_in_h';
    const { cells } = globalGridCells(block, (col, row) => {
      const d = metric(col * block + block / 2, row * block + block / 2);
      const step = Math.min(IRIS_STEPS - 1, Math.floor((d / maxDistance) * IRIS_STEPS));
      return closing ? IRIS_STEPS - 1 - step : step;
    });
    return { tileW: W, tileH: H, tilesX: 1, tilesY: 1, steps: cellsToSteps(cells, block, block, W, H, spec.reverse) };
  }

  if (spec.effect === 'screen5_blinds') {
    const slat = spec.blockSize;
    const vertical = ['left_to_right', 'right_to_left', 'center_out_h', 'edges_in_h'].includes(spec.direction);
    if (vertical) {
      // Slats are columns `slat` px wide; each step paints one 2px column in every slat.
      const columns = slat / 2;
      const cells: OrderedCell[] = [];
      for (let col = 0; col < columns; col++) {
        const order = spec.direction === 'right_to_left' ? columns - 1 - col
          : spec.direction === 'center_out_h' ? centerDistance(col, columns)
            : spec.direction === 'edges_in_h' ? Math.floor((columns - 1) / 2) - centerDistance(col, columns)
              : col;
        cells.push({ col, row: 0, order });
      }
      return {
        tileW: slat,
        tileH: H,
        tilesX: W / slat,
        tilesY: 1,
        steps: cellsToSteps(cells, 2, H, slat, H, spec.reverse),
      };
    }
    // Horizontal slats: rows `slat` lines tall, one line per step in every slat.
    const cells: OrderedCell[] = [];
    for (let row = 0; row < slat; row++) {
      const order = spec.direction === 'bottom_to_top' ? slat - 1 - row
        : spec.direction === 'center_out_v' ? centerDistance(row, slat)
          : spec.direction === 'edges_in_v' ? Math.floor((slat - 1) / 2) - centerDistance(row, slat)
            : row;
      cells.push({ col: 0, row, order });
    }
    return {
      tileW: W,
      tileH: slat,
      tilesX: 1,
      tilesY: Math.ceil(H / slat),
      steps: cellsToSteps(cells, W, 1, W, slat, spec.reverse),
    };
  }

  // screen5_pattern
  const map = getScreen5PatternOrderMap(spec.patternId, spec.customPattern);
  const cell = spec.blockSize;
  const tile = map.size * cell;
  const cells: OrderedCell[] = [];
  for (let row = 0; row < map.size; row++) {
    for (let col = 0; col < map.size; col++) cells.push({ col, row, order: map.order[row * map.size + col] });
  }
  return {
    tileW: tile,
    tileH: tile,
    tilesX: Math.max(1, Math.floor(W / tile)),
    tilesY: Math.ceil(H / tile),
    steps: cellsToSteps(cells, cell, cell, tile, tile, spec.reverse),
  };
}

/** Number of HMMV fills the plan issues (used for the editor's speed hint). */
export function countScreen5FillPlanRects(plan: Screen5FillPlan): number {
  const perTile = plan.steps.reduce((sum, step) => sum + step.length, 0);
  return perTile * plan.tilesX * plan.tilesY;
}

/** Approximate Z80 cost of one tiled HMMV fill issued by the engine (T-states). */
export const SCREEN5_TFX_TSTATES_PER_FILL = 900;
const TSTATES_PER_FRAME = 59736;

/**
 * Rough on-screen duration (60 Hz frames) of a fill plan: every step lasts
 * max(framesPerStep, time spent issuing its fills).
 */
export function estimateScreen5FillPlanFrames(plan: Screen5FillPlan, framesPerStep: number): number {
  const tiles = plan.tilesX * plan.tilesY;
  return plan.steps.reduce((sum, step) => {
    const cpuFrames = Math.ceil((step.length * tiles * SCREEN5_TFX_TSTATES_PER_FILL) / TSTATES_PER_FRAME);
    return sum + Math.max(framesPerStep, cpuFrames);
  }, 0);
}

/**
 * Encode a plan into the table format played by `<prefix>_play`:
 *   DB tileW/2, tileH, tilesX, tilesY, framesPerStep, fillByte
 *   per step: DB x/2, y, w/2, h ... then DB #FF
 *   end:      DB #FE
 */
export function encodeScreen5FillPlan(plan: Screen5FillPlan, fillColorIndex: number, framesPerStep: number): number[] {
  const color = fillColorIndex & 0x0f;
  const bytes: number[] = [
    (plan.tileW >> 1) & 0xff,
    plan.tileH & 0xff,
    plan.tilesX & 0xff,
    plan.tilesY & 0xff,
    Math.max(1, Math.min(255, framesPerStep)),
    (color << 4) | color,
  ];
  for (const step of plan.steps) {
    for (const rect of step) {
      if (rect.w <= 0 || rect.h <= 0) continue;
      bytes.push((rect.x >> 1) & 0x7f, rect.y & 0xff, (rect.w >> 1) & 0xff, rect.h & 0xff);
    }
    bytes.push(0xff);
  }
  bytes.push(0xfe);
  return bytes;
}

/** 32-byte V9938 palette (byte0 = R<<4 | B, byte1 = G) with all 16 slots set to one colour. */
export function buildSolidScreen5PaletteBytes(color: Msx2TransitionRgb): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) bytes.push(((color.r & 7) << 4) | (color.b & 7), color.g & 7);
  return bytes;
}

/** Stable short key for a spec (used to share one data table between identical nodes). */
export function screen5TransitionSpecKey(spec: Screen5TransitionSpec): string {
  return JSON.stringify(spec);
}
