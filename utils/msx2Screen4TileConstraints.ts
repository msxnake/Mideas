import { SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../constants';
import type { Msx2Screen4LineAttribute } from '../types';

export const SCREEN4_PIXELS_PER_COLOR_SEGMENT = SCREEN2_PIXELS_PER_COLOR_SEGMENT;

export const DEFAULT_SCREEN4_FG_SLOT = 1;
export const DEFAULT_SCREEN4_BG_SLOT = 0;

export type Msx2Screen4TilePaintTool = 'pencil' | 'erase' | 'fill' | 'pick';

export interface Msx2Screen4ColorLimitDiagnostic {
  row: number;
  segment: number;
  colors: number[];
}

const clampSlot = (value: unknown): number => Math.max(0, Math.min(15, Number(value) || 0));

export const chooseScreen4RowColors = (row: number[]): { fg: number; bg: number } => {
  const counts = new Map<number, number>();
  row.forEach(value => {
    const slot = clampSlot(value);
    counts.set(slot, (counts.get(slot) || 0) + 1);
  });
  const sorted = Array.from(counts.entries()).sort((a, b) =>
    b[1] - a[1] || a[0] - b[0]
  );
  const bg = sorted[0]?.[0] ?? DEFAULT_SCREEN4_BG_SLOT;
  const fg = sorted.find(([slot]) => slot !== bg)?.[0] ?? bg;
  return { fg, bg };
};

export const createDefaultLineAttributes = (
  tileWidth: number,
  tileHeight: number,
  fg = DEFAULT_SCREEN4_FG_SLOT,
  bg = DEFAULT_SCREEN4_BG_SLOT
): Msx2Screen4LineAttribute[][] => {
  const numSegmentsPerRow = Math.max(1, tileWidth / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  return Array.from({ length: tileHeight }, () =>
    Array.from({ length: numSegmentsPerRow }, () => ({ fg: clampSlot(fg), bg: clampSlot(bg) }))
  );
};

export const cloneLineAttributes = (lineAttributes: Msx2Screen4LineAttribute[][] | undefined): Msx2Screen4LineAttribute[][] | undefined =>
  lineAttributes?.map(row => row.map(segment => ({ ...segment })));

export const inferLineAttributesFromPixels = (pixels: number[][]): Msx2Screen4LineAttribute[][] => {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const numSegmentsPerRow = Math.max(1, width / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: numSegmentsPerRow }, (_, segment) => {
      const startX = segment * SCREEN4_PIXELS_PER_COLOR_SEGMENT;
      const row = Array.from({ length: SCREEN4_PIXELS_PER_COLOR_SEGMENT }, (_unused, offset) =>
        clampSlot(pixels[y]?.[startX + offset])
      );
      return chooseScreen4RowColors(row);
    })
  );
};

export const ensureLineAttributes = (
  pixels: number[][],
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined,
  width: number,
  height: number
): Msx2Screen4LineAttribute[][] => {
  const expectedSegments = Math.max(1, width / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  if (
    lineAttributes
    && lineAttributes.length === height
    && lineAttributes.every(row => row.length === expectedSegments)
  ) {
    return lineAttributes.map(row => row.map(segment => ({ fg: clampSlot(segment.fg), bg: clampSlot(segment.bg) })));
  }
  return inferLineAttributesFromPixels(pixels);
};

export const getSegmentIndex = (x: number): number =>
  Math.floor(x / SCREEN4_PIXELS_PER_COLOR_SEGMENT);

export const getSegmentAttribute = (
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined,
  y: number,
  x: number
): Msx2Screen4LineAttribute | undefined =>
  lineAttributes?.[y]?.[getSegmentIndex(x)];

export const isValidPixelSlot = (
  x: number,
  y: number,
  slot: number,
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined
): boolean => {
  const attributes = getSegmentAttribute(lineAttributes, y, x);
  if (!attributes) return true;
  const normalized = clampSlot(slot);
  return normalized === attributes.fg || normalized === attributes.bg;
};

export const resolvePaintSlot = (
  x: number,
  y: number,
  button: number,
  tool: Msx2Screen4TilePaintTool,
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined,
  _activeSlot: number
): number => {
  const attributes = getSegmentAttribute(lineAttributes, y, x);
  if (!attributes) return clampSlot(_activeSlot);
  if (tool === 'erase' || button === 2) return attributes.bg;
  return attributes.fg;
};

export const analyzeTileColorLimits = (pixels: number[][]): Msx2Screen4ColorLimitDiagnostic[] => {
  const diagnostics: Msx2Screen4ColorLimitDiagnostic[] = [];
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const numSegmentsPerRow = Math.max(1, width / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  for (let y = 0; y < height; y++) {
    for (let segment = 0; segment < numSegmentsPerRow; segment++) {
      const colors = new Set<number>();
      const startX = segment * SCREEN4_PIXELS_PER_COLOR_SEGMENT;
      for (let x = startX; x < startX + SCREEN4_PIXELS_PER_COLOR_SEGMENT && x < width; x++) {
        colors.add(clampSlot(pixels[y]?.[x]));
      }
      if (colors.size > 2) {
        diagnostics.push({ row: y, segment, colors: [...colors].sort((a, b) => a - b) });
      }
    }
  }
  return diagnostics;
};

export const fixInvalidTilePixels = (
  pixels: number[][],
  lineAttributes: Msx2Screen4LineAttribute[][]
): number[][] => {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const slot = clampSlot(pixels[y]?.[x]);
      const attributes = getSegmentAttribute(lineAttributes, y, x);
      if (!attributes) return slot;
      if (slot === attributes.fg || slot === attributes.bg) return slot;
      return attributes.bg;
    })
  );
};

export const resizeLineAttributes = (
  oldAttributes: Msx2Screen4LineAttribute[][] | undefined,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  defaultFg = DEFAULT_SCREEN4_FG_SLOT,
  defaultBg = DEFAULT_SCREEN4_BG_SLOT
): Msx2Screen4LineAttribute[][] => {
  const newNumSegmentsPerRow = Math.max(1, newWidth / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  const oldNumSegmentsPerRow = Math.max(1, oldWidth / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  const newAttrs: Msx2Screen4LineAttribute[][] = [];
  for (let y = 0; y < newHeight; y++) {
    const newRowAttrs: Msx2Screen4LineAttribute[] = [];
    for (let s = 0; s < newNumSegmentsPerRow; s++) {
      if (oldAttributes && y < oldHeight && s < oldNumSegmentsPerRow && oldAttributes[y]?.[s]) {
        newRowAttrs.push({ ...oldAttributes[y][s] });
      } else {
        newRowAttrs.push({ fg: clampSlot(defaultFg), bg: clampSlot(defaultBg) });
      }
    }
    newAttrs.push(newRowAttrs);
  }
  return newAttrs;
};

export const mirrorLineAttributesHorizontal = (
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined,
  width: number
): Msx2Screen4LineAttribute[][] | undefined => {
  if (!lineAttributes) return undefined;
  const numSegmentsPerRow = Math.max(1, width / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  return lineAttributes.map(row => {
    const mirrored: Msx2Screen4LineAttribute[] = [];
    for (let s = 0; s < numSegmentsPerRow; s++) {
      mirrored.push({ ...row[numSegmentsPerRow - 1 - s] });
    }
    return mirrored;
  });
};

export const mirrorLineAttributesVertical = (
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined
): Msx2Screen4LineAttribute[][] | undefined =>
  lineAttributes ? [...lineAttributes].reverse().map(row => row.map(segment => ({ ...segment }))) : undefined;

export const shiftLineAttributes = (
  lineAttributes: Msx2Screen4LineAttribute[][] | undefined,
  dx: number,
  dy: number,
  width: number,
  height: number,
  defaultFg = DEFAULT_SCREEN4_FG_SLOT,
  defaultBg = DEFAULT_SCREEN4_BG_SLOT
): Msx2Screen4LineAttribute[][] => {
  const numSegmentsPerRow = Math.max(1, width / SCREEN4_PIXELS_PER_COLOR_SEGMENT);
  const source = lineAttributes ?? createDefaultLineAttributes(width, height, defaultFg, defaultBg);
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: numSegmentsPerRow }, (_, segment) => {
      const sourceY = y - dy;
      const sourceSegment = segment - dx;
      if (sourceY < 0 || sourceY >= height || sourceSegment < 0 || sourceSegment >= numSegmentsPerRow) {
        return { fg: clampSlot(defaultFg), bg: clampSlot(defaultBg) };
      }
      return { ...source[sourceY][sourceSegment] };
    })
  );
};

export const remapSegmentPixels = (
  pixels: number[][],
  rowIndex: number,
  segmentIndex: number,
  oldAttribute: Msx2Screen4LineAttribute,
  newAttribute: Msx2Screen4LineAttribute
): number[][] => {
  const nextPixels = pixels.map(row => [...row]);
  const startX = segmentIndex * SCREEN4_PIXELS_PER_COLOR_SEGMENT;
  const endX = startX + SCREEN4_PIXELS_PER_COLOR_SEGMENT;
  const row = nextPixels[rowIndex];
  if (!row) return nextPixels;
  for (let x = startX; x < endX && x < row.length; x++) {
    const currentSlot = clampSlot(row[x]);
    if (currentSlot === oldAttribute.fg) {
      row[x] = newAttribute.fg;
    } else if (currentSlot === oldAttribute.bg) {
      row[x] = newAttribute.bg;
    } else {
      row[x] = newAttribute.fg;
    }
  }
  return nextPixels;
};

export const fillAllLineAttributeSlots = (
  lineAttributes: Msx2Screen4LineAttribute[][],
  slot: number,
  type: 'fg' | 'bg'
): Msx2Screen4LineAttribute[][] => {
  const normalized = clampSlot(slot);
  return lineAttributes.map(row =>
    row.map(segment => ({ ...segment, [type]: normalized }))
  );
};
