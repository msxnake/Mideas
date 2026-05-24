import type { Screen5PaletteSlot } from '../../types';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

export const SCREEN5_PRESENTATION_WIDTH = 256;
export const SCREEN5_PRESENTATION_HEIGHTS = [192, 212] as const;
export const SCREEN5_PRESENTATION_CHUNK_LINES = 32;

export type Msx2Screen5PresentationHeight = typeof SCREEN5_PRESENTATION_HEIGHTS[number];
export type Msx2Screen5PresentationFitMode = 'cover' | 'contain' | 'stretch';

export interface Msx2Screen5PresentationCompressionConfig {
  codec: 'ZX0';
  enabled: boolean;
  chunkLines: number;
}

export interface Msx2Screen5PresentationRuntimeConfig {
  showAtBoot: boolean;
  clearSpritesBeforeShow: boolean;
  waitForKey: boolean;
  waitForFrames: number;
  vramPage: 0 | 1;
  romDataGroup: 'auto' | 'default' | 'page0';
}

export interface Msx2Screen5PresentationConversionResult {
  name: string;
  sourceFileName: string | null;
  sourceImageWidth: number;
  sourceImageHeight: number;
  width: typeof SCREEN5_PRESENTATION_WIDTH;
  height: Msx2Screen5PresentationHeight;
  fitMode: Msx2Screen5PresentationFitMode;
  palette: Screen5PaletteSlot[];
  pixels: number[][];
  packedBitmap: number[];
  compression: Msx2Screen5PresentationCompressionConfig;
  runtime: Msx2Screen5PresentationRuntimeConfig;
  updatedAt: number;
  lastImportError: string | null;
}

export interface ConvertImageDataToScreen5PresentationOptions {
  name?: string;
  sourceFileName?: string | null;
  height?: Msx2Screen5PresentationHeight;
  fitMode?: Msx2Screen5PresentationFitMode;
  palette?: Screen5PaletteSlot[];
  compression?: Partial<Msx2Screen5PresentationCompressionConfig>;
  runtime?: Partial<Msx2Screen5PresentationRuntimeConfig>;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const DEFAULT_COMPRESSION: Msx2Screen5PresentationCompressionConfig = {
  codec: 'ZX0',
  enabled: true,
  chunkLines: SCREEN5_PRESENTATION_CHUNK_LINES,
};

const DEFAULT_RUNTIME: Msx2Screen5PresentationRuntimeConfig = {
  showAtBoot: false,
  clearSpritesBeforeShow: true,
  waitForKey: true,
  waitForFrames: 0,
  vramPage: 0,
  romDataGroup: 'auto',
};

const clampSlot = (value: number): number =>
  Math.max(0, Math.min(15, Number.isFinite(value) ? Math.round(value) : 0));

const isScreen5Height = (value: number | undefined): value is Msx2Screen5PresentationHeight =>
  value === 192 || value === 212;

const normalizeHeight = (height?: number): Msx2Screen5PresentationHeight =>
  isScreen5Height(height) ? height : 192;

const normalizeFitMode = (fitMode?: string): Msx2Screen5PresentationFitMode =>
  fitMode === 'cover' || fitMode === 'contain' || fitMode === 'stretch' ? fitMode : 'cover';

const parseHexColor = (hex: string): RgbColor | null => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

const createEmptyPixels = (height: Msx2Screen5PresentationHeight): number[][] =>
  Array.from({ length: height }, () => Array.from({ length: SCREEN5_PRESENTATION_WIDTH }, () => 0));

export const normalizeScreen5PresentationPixels = (
  pixels: number[][] | undefined,
  height: Msx2Screen5PresentationHeight
): number[][] => {
  if (!pixels || pixels.length !== height || pixels.some(row => row.length !== SCREEN5_PRESENTATION_WIDTH)) {
    return createEmptyPixels(height);
  }
  return pixels.map(row => row.map(clampSlot));
};

export const packScreen5PresentationPixels = (pixels: number[][]): number[] => {
  const packed: number[] = [];
  for (const row of pixels) {
    for (let x = 0; x < SCREEN5_PRESENTATION_WIDTH; x += 2) {
      const left = clampSlot(row[x] ?? 0);
      const right = clampSlot(row[x + 1] ?? 0);
      packed.push(((left & 0x0f) << 4) | (right & 0x0f));
    }
  }
  return packed;
};

export const unpackScreen5PresentationPixels = (
  packedBitmap: number[] | undefined,
  height: Msx2Screen5PresentationHeight
): number[][] => {
  if (!packedBitmap || packedBitmap.length < (SCREEN5_PRESENTATION_WIDTH * height) / 2) {
    return createEmptyPixels(height);
  }

  const pixels = createEmptyPixels(height);
  let packedOffset = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < SCREEN5_PRESENTATION_WIDTH; x += 2) {
      const byte = packedBitmap[packedOffset++] ?? 0;
      pixels[y][x] = (byte >> 4) & 0x0f;
      pixels[y][x + 1] = byte & 0x0f;
    }
  }
  return pixels;
};

const getResizeRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fitMode: Msx2Screen5PresentationFitMode
): { dx: number; dy: number; dw: number; dh: number } => {
  if (fitMode === 'stretch') {
    return { dx: 0, dy: 0, dw: targetWidth, dh: targetHeight };
  }

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;
  const scale = fitMode === 'cover'
    ? (sourceAspect > targetAspect ? targetHeight / sourceHeight : targetWidth / sourceWidth)
    : (sourceAspect > targetAspect ? targetWidth / sourceWidth : targetHeight / sourceHeight);
  const dw = Math.max(1, Math.round(sourceWidth * scale));
  const dh = Math.max(1, Math.round(sourceHeight * scale));
  return {
    dx: Math.floor((targetWidth - dw) / 2),
    dy: Math.floor((targetHeight - dh) / 2),
    dw,
    dh,
  };
};

export const resizeImageDataToScreen5Presentation = (
  sourceImageData: ImageData,
  height: Msx2Screen5PresentationHeight,
  fitMode: Msx2Screen5PresentationFitMode
): ImageData => {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = sourceImageData.width;
  sourceCanvas.height = sourceImageData.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('No se pudo preparar el canvas fuente para SCREEN 5.');
  }
  sourceCtx.putImageData(sourceImageData, 0, 0);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = SCREEN5_PRESENTATION_WIDTH;
  targetCanvas.height = height;
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) {
    throw new Error('No se pudo preparar el canvas destino para SCREEN 5.');
  }

  targetCtx.clearRect(0, 0, SCREEN5_PRESENTATION_WIDTH, height);
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';
  const rect = getResizeRect(
    sourceImageData.width,
    sourceImageData.height,
    SCREEN5_PRESENTATION_WIDTH,
    height,
    fitMode
  );
  targetCtx.drawImage(sourceCanvas, rect.dx, rect.dy, rect.dw, rect.dh);
  return targetCtx.getImageData(0, 0, SCREEN5_PRESENTATION_WIDTH, height);
};

const buildPaletteRgb = (palette: Screen5PaletteSlot[]): Array<RgbColor | null> =>
  palette.map(slot => slot.hex === TRANSPARENT_HEX ? null : parseHexColor(slot.hex));

const findNearestPaletteSlot = (r: number, g: number, b: number, paletteRgb: Array<RgbColor | null>): number => {
  let nearestSlot = 1;
  let nearestDistance = Number.POSITIVE_INFINITY;

  paletteRgb.forEach((color, slotIndex) => {
    if (!color || slotIndex === 0) return;
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const distance = (dr * dr) + (dg * dg) + (db * db);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSlot = slotIndex;
    }
  });

  return nearestSlot;
};

export const quantizeImageDataToScreen5Slots = (
  imageData: ImageData,
  palette: Screen5PaletteSlot[]
): number[][] => {
  const paletteRgb = buildPaletteRgb(palette);
  const pixels: number[][] = [];

  for (let y = 0; y < imageData.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < imageData.width; x++) {
      const offset = ((y * imageData.width) + x) * 4;
      const alpha = imageData.data[offset + 3] ?? 255;
      row.push(alpha < 64
        ? 0
        : findNearestPaletteSlot(
          imageData.data[offset] ?? 0,
          imageData.data[offset + 1] ?? 0,
          imageData.data[offset + 2] ?? 0,
          paletteRgb
        ));
    }
    pixels.push(row);
  }

  return pixels;
};

export const convertImageDataToMsx2Screen5Presentation = (
  sourceImageData: ImageData,
  options: ConvertImageDataToScreen5PresentationOptions = {}
): Msx2Screen5PresentationConversionResult => {
  const height = normalizeHeight(options.height);
  const fitMode = normalizeFitMode(options.fitMode);
  const { slots } = ensureScreen5PaletteSlots(options.palette);
  const resized = resizeImageDataToScreen5Presentation(sourceImageData, height, fitMode);
  const pixels = quantizeImageDataToScreen5Slots(resized, slots);
  const packedBitmap = packScreen5PresentationPixels(pixels);

  return {
    name: options.name || 'MSX2 SCREEN 5 Presentation',
    sourceFileName: options.sourceFileName ?? null,
    sourceImageWidth: sourceImageData.width,
    sourceImageHeight: sourceImageData.height,
    width: SCREEN5_PRESENTATION_WIDTH,
    height,
    fitMode,
    palette: slots.map(slot => ({ ...slot })),
    pixels,
    packedBitmap,
    compression: { ...DEFAULT_COMPRESSION, ...options.compression },
    runtime: { ...DEFAULT_RUNTIME, ...options.runtime },
    updatedAt: Date.now(),
    lastImportError: null,
  };
};

export const drawMsx2Screen5PresentationPreview = (
  canvas: HTMLCanvasElement,
  pixels: number[][],
  palette: Screen5PaletteSlot[],
  scale = 2
): void => {
  const height = normalizeHeight(pixels.length);
  const normalizedPixels = normalizeScreen5PresentationPixels(pixels, height);
  const { slots } = ensureScreen5PaletteSlots(palette);
  const paletteRgb = buildPaletteRgb(slots);
  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = SCREEN5_PRESENTATION_WIDTH;
  renderCanvas.height = height;
  const renderCtx = renderCanvas.getContext('2d');
  const targetCtx = canvas.getContext('2d');
  if (!renderCtx || !targetCtx) return;

  const imageData = renderCtx.createImageData(SCREEN5_PRESENTATION_WIDTH, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < SCREEN5_PRESENTATION_WIDTH; x++) {
      const slot = normalizedPixels[y][x] & 0x0f;
      const color = paletteRgb[slot] ?? { r: 0, g: 0, b: 0 };
      const offset = ((y * SCREEN5_PRESENTATION_WIDTH) + x) * 4;
      imageData.data[offset] = color.r;
      imageData.data[offset + 1] = color.g;
      imageData.data[offset + 2] = color.b;
      imageData.data[offset + 3] = slot === 0 ? 255 : 255;
    }
  }

  renderCtx.putImageData(imageData, 0, 0);
  canvas.width = SCREEN5_PRESENTATION_WIDTH * scale;
  canvas.height = height * scale;
  targetCtx.imageSmoothingEnabled = false;
  targetCtx.clearRect(0, 0, canvas.width, canvas.height);
  targetCtx.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
};

export const getScreen5PresentationStats = (
  height: Msx2Screen5PresentationHeight,
  packedBitmapLength: number
): { rawBytes: number; packedLength: number; chunkLines: number; chunks: number; bytesPerFullChunk: number } => ({
  rawBytes: (SCREEN5_PRESENTATION_WIDTH * height) / 2,
  packedLength: packedBitmapLength,
  chunkLines: SCREEN5_PRESENTATION_CHUNK_LINES,
  chunks: Math.ceil(height / SCREEN5_PRESENTATION_CHUNK_LINES),
  bytesPerFullChunk: (SCREEN5_PRESENTATION_WIDTH * SCREEN5_PRESENTATION_CHUNK_LINES) / 2,
});
