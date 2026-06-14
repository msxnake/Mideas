import { snapHexToScreen5MasterColor } from '../constants';
import { MSXColorValue, PixelData, Screen5PaletteSlot } from '../types';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)' as MSXColorValue;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface RawPixel extends Rgb {
  visible: boolean;
}

export interface Msx2ExternalSpriteImportOptions {
  targetWidth: number;
  targetHeight: number;
  finalColorCount: number;
  replaceableSlots: number[];
  orBaseSlot?: number;
  orOverlaySlot?: number;
  orResultSlot?: number;
  preserveAspect: boolean;
  cropToVisible: boolean;
  backgroundTolerance: number;
  useOrColor: boolean;
}

export interface Msx2ExternalSpriteImportResult {
  palette: Screen5PaletteSlot[];
  pixelData: PixelData;
  detectedOpaqueColors: number;
  crop: { x: number; y: number; width: number; height: number };
  generatedSlots: Screen5PaletteSlot[];
  warnings: string[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const isTransparentHex = (value: string | undefined): boolean =>
  normalizeHex(value) === normalizeHex(TRANSPARENT_HEX);

const isBlackOrWhite = (value: string | undefined): boolean => {
  const normalized = normalizeHex(value);
  return normalized === '#000000' || normalized === '#FFFFFF';
};

const hexToRgb = (hex: string | undefined): Rgb | null => {
  const normalized = normalizeHex(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${clamp(Math.round(r), 0, 255).toString(16).padStart(2, '0')}${clamp(Math.round(g), 0, 255).toString(16).padStart(2, '0')}${clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0')}`.toUpperCase();

const colorDistance = (a: Rgb, b: Rgb): number => {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return (dr * dr * 0.30) + (dg * dg * 0.59) + (db * db * 0.11);
};

const imagePixel = (imageData: ImageData, x: number, y: number): Rgb & { a: number } => {
  const offset = ((y * imageData.width) + x) * 4;
  return {
    r: imageData.data[offset],
    g: imageData.data[offset + 1],
    b: imageData.data[offset + 2],
    a: imageData.data[offset + 3],
  };
};

const quantizedKey = (pixel: Rgb): string =>
  `${pixel.r >> 3},${pixel.g >> 3},${pixel.b >> 3}`;

function detectBorderBackground(imageData: ImageData): Rgb {
  const counts = new Map<string, { rgb: Rgb; count: number }>();
  const add = (x: number, y: number) => {
    const pixel = imagePixel(imageData, x, y);
    if (pixel.a < 128) return;
    const rgb = { r: pixel.r, g: pixel.g, b: pixel.b };
    const key = quantizedKey(rgb);
    const current = counts.get(key);
    if (current) {
      current.count += 1;
    } else {
      counts.set(key, { rgb, count: 1 });
    }
  };

  for (let x = 0; x < imageData.width; x++) {
    add(x, 0);
    add(x, imageData.height - 1);
  }
  for (let y = 0; y < imageData.height; y++) {
    add(0, y);
    add(imageData.width - 1, y);
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count)[0]?.rgb || { r: 0, g: 0, b: 0 };
}

function isVisibleSourcePixel(pixel: Rgb & { a: number }, background: Rgb, tolerance: number): boolean {
  if (pixel.a < 128) return false;
  return colorDistance(pixel, background) > tolerance * tolerance;
}

function computeVisibleCrop(imageData: ImageData, background: Rgb, tolerance: number): { x: number; y: number; width: number; height: number } {
  let minX = imageData.width;
  let minY = imageData.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      if (!isVisibleSourcePixel(imagePixel(imageData, x, y), background, tolerance)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: imageData.width, height: imageData.height };
  }

  const padding = 2;
  const x = clamp(minX - padding, 0, imageData.width - 1);
  const y = clamp(minY - padding, 0, imageData.height - 1);
  const right = clamp(maxX + padding, 0, imageData.width - 1);
  const bottom = clamp(maxY + padding, 0, imageData.height - 1);
  return { x, y, width: right - x + 1, height: bottom - y + 1 };
}

function downscaleToTarget(
  imageData: ImageData,
  crop: { x: number; y: number; width: number; height: number },
  background: Rgb,
  options: Msx2ExternalSpriteImportOptions,
): RawPixel[][] {
  const target = Array.from({ length: options.targetHeight }, () =>
    Array.from({ length: options.targetWidth }, () => ({ r: 0, g: 0, b: 0, visible: false }))
  );

  const scale = options.preserveAspect
    ? Math.min(options.targetWidth / crop.width, options.targetHeight / crop.height)
    : 0;
  const fittedWidth = options.preserveAspect ? Math.max(1, crop.width * scale) : options.targetWidth;
  const fittedHeight = options.preserveAspect ? Math.max(1, crop.height * scale) : options.targetHeight;
  const xPad = (options.targetWidth - fittedWidth) / 2;
  const yPad = (options.targetHeight - fittedHeight) / 2;

  for (let y = 0; y < options.targetHeight; y++) {
    for (let x = 0; x < options.targetWidth; x++) {
      if (x < xPad || y < yPad || x >= xPad + fittedWidth || y >= yPad + fittedHeight) continue;

      const localX0 = options.preserveAspect ? (x - xPad) / fittedWidth : x / options.targetWidth;
      const localX1 = options.preserveAspect ? (x + 1 - xPad) / fittedWidth : (x + 1) / options.targetWidth;
      const localY0 = options.preserveAspect ? (y - yPad) / fittedHeight : y / options.targetHeight;
      const localY1 = options.preserveAspect ? (y + 1 - yPad) / fittedHeight : (y + 1) / options.targetHeight;

      const srcX0 = clamp(Math.floor(crop.x + localX0 * crop.width), 0, imageData.width - 1);
      const srcX1 = clamp(Math.ceil(crop.x + localX1 * crop.width), srcX0 + 1, imageData.width);
      const srcY0 = clamp(Math.floor(crop.y + localY0 * crop.height), 0, imageData.height - 1);
      const srcY1 = clamp(Math.ceil(crop.y + localY1 * crop.height), srcY0 + 1, imageData.height);

      let visibleCount = 0;
      let totalCount = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = srcY0; sy < srcY1; sy++) {
        for (let sx = srcX0; sx < srcX1; sx++) {
          totalCount += 1;
          const pixel = imagePixel(imageData, sx, sy);
          if (!isVisibleSourcePixel(pixel, background, options.backgroundTolerance)) continue;
          visibleCount += 1;
          r += pixel.r;
          g += pixel.g;
          b += pixel.b;
        }
      }

      if (visibleCount > 0 && visibleCount / Math.max(1, totalCount) >= 0.16) {
        target[y][x] = {
          r: r / visibleCount,
          g: g / visibleCount,
          b: b / visibleCount,
          visible: true,
        };
      }
    }
  }

  return target;
}

function findImmutableSlots(palette: Screen5PaletteSlot[]): Set<number> {
  const immutable = new Set<number>([0]);
  palette.forEach(slot => {
    const normalized = normalizeHex(slot.hex);
    if (normalized === '#000000' || normalized === '#FFFFFF' || isTransparentHex(slot.hex)) {
      immutable.add(slot.slotIndex);
    }
  });
  return immutable;
}

function nearestSlotColor(pixel: Rgb, slots: Screen5PaletteSlot[]): Screen5PaletteSlot | undefined {
  let best: { slot: Screen5PaletteSlot; distance: number } | undefined;
  slots.forEach(slot => {
    if (slot.slotIndex === 0 || isTransparentHex(slot.hex)) return;
    const rgb = hexToRgb(slot.hex);
    if (!rgb) return;
    const distance = colorDistance(pixel, rgb);
    if (!best || distance < best.distance) best = { slot, distance };
  });
  return best?.slot;
}

function pickSeedSamples(samples: Rgb[], count: number): Rgb[] {
  if (samples.length === 0) return [];
  const seeds: Rgb[] = [samples[Math.floor(samples.length / 2)]];
  while (seeds.length < count) {
    let bestSample = samples[0];
    let bestDistance = -1;
    samples.forEach(sample => {
      const distance = Math.min(...seeds.map(seed => colorDistance(sample, seed)));
      if (distance > bestDistance) {
        bestDistance = distance;
        bestSample = sample;
      }
    });
    seeds.push(bestSample);
  }
  return seeds;
}

function quantizeSamples(samples: Rgb[], count: number): Rgb[] {
  const unique = Array.from(new Map(samples.map(sample => [quantizedKey(sample), sample])).values());
  const k = clamp(count, 1, Math.max(1, unique.length));
  let centers = pickSeedSamples(unique, k);

  for (let iteration = 0; iteration < 10; iteration++) {
    const groups = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    unique.forEach(sample => {
      let bestIndex = 0;
      let bestDistance = Infinity;
      centers.forEach((center, index) => {
        const distance = colorDistance(sample, center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      groups[bestIndex].r += sample.r;
      groups[bestIndex].g += sample.g;
      groups[bestIndex].b += sample.b;
      groups[bestIndex].count += 1;
    });
    centers = centers.map((center, index) => {
      const group = groups[index];
      if (!group.count) return center;
      return { r: group.r / group.count, g: group.g / group.count, b: group.b / group.count };
    });
  }

  return centers;
}

export function importExternalPngAsMsx2Sprite(
  imageData: ImageData,
  currentPalette: Screen5PaletteSlot[],
  currentBackgroundColor: MSXColorValue,
  options: Msx2ExternalSpriteImportOptions,
): Msx2ExternalSpriteImportResult {
  const warnings: string[] = [];
  const targetWidth = clamp(Math.floor(options.targetWidth), 8, 128);
  const targetHeight = clamp(Math.floor(options.targetHeight), 8, 128);
  const normalizedOptions = { ...options, targetWidth, targetHeight };
  const background = detectBorderBackground(imageData);
  const crop = options.cropToVisible
    ? computeVisibleCrop(imageData, background, options.backgroundTolerance)
    : { x: 0, y: 0, width: imageData.width, height: imageData.height };
  const rawPixels = downscaleToTarget(imageData, crop, background, normalizedOptions);
  const visibleSamples = rawPixels.flat().filter(pixel => pixel.visible);
  const detectedOpaqueColors = new Set(visibleSamples.map(quantizedKey)).size;

  const immutableSlots = findImmutableSlots(currentPalette);
  const replaceableSlots = options.replaceableSlots
    .filter(slot => slot > 0 && slot < 16 && !immutableSlots.has(slot))
    .filter((slot, index, all) => all.indexOf(slot) === index);
  const immutableVisibleSlots = currentPalette.filter(slot =>
    immutableSlots.has(slot.slotIndex) && slot.slotIndex !== 0 && isBlackOrWhite(slot.hex)
  );
  const requestedTotalColors = clamp(Math.floor(options.finalColorCount), 1, 15);
  const mutableColorTarget = Math.max(0, requestedTotalColors - immutableVisibleSlots.length);
  const customColorCount = replaceableSlots.length
    ? Math.min(mutableColorTarget, replaceableSlots.length)
    : 0;

  if (replaceableSlots.length === 0) {
    warnings.push('No hay slots sustituibles seleccionados; se usara la paleta actual.');
  }
  if (mutableColorTarget > replaceableSlots.length) {
    warnings.push('Hay menos slots sustituibles que colores finales solicitados.');
  }

  const immutablePaletteCandidates = currentPalette.filter(slot => immutableSlots.has(slot.slotIndex) && slot.slotIndex !== 0);
  const nonImmutableSamples = visibleSamples.filter(sample => {
    const nearestImmutable = nearestSlotColor(sample, immutablePaletteCandidates);
    if (!nearestImmutable) return true;
    const immutableRgb = hexToRgb(nearestImmutable.hex);
    return !immutableRgb || colorDistance(sample, immutableRgb) > 26 * 26;
  });
  const samplesForCustom = nonImmutableSamples.length ? nonImmutableSamples : visibleSamples;
  const generatedColors = replaceableSlots.length && customColorCount > 0
    ? quantizeSamples(samplesForCustom, Math.min(customColorCount, replaceableSlots.length))
    : [];

  const nextPalette = currentPalette.map(slot => ({ ...slot }));
  const generatedSlots: Screen5PaletteSlot[] = [];
  const preferredOrSlots = options.useOrColor && options.orOverlaySlot && options.orResultSlot && options.orBaseSlot
    && ((options.orBaseSlot | options.orOverlaySlot) === options.orResultSlot)
    ? [options.orOverlaySlot, options.orResultSlot]
    : [];
  const orderedReplaceableSlots = [
    ...preferredOrSlots.filter(slot => replaceableSlots.includes(slot)),
    ...replaceableSlots.filter(slot => !preferredOrSlots.includes(slot)),
  ];
  generatedColors.forEach((color, index) => {
    const slotIndex = orderedReplaceableSlots[index];
    if (!slotIndex) return;
    const snapped = snapHexToScreen5MasterColor(rgbToHex(color));
    const slot = { slotIndex, masterIndex: snapped.masterIndex, hex: snapped.hex };
    nextPalette[slotIndex] = slot;
    generatedSlots.push(slot);
  });

  const candidateSlots = [
    ...immutablePaletteCandidates,
    ...generatedSlots,
  ].filter(slot => slot.slotIndex > 0 && !isTransparentHex(slot.hex));
  if (candidateSlots.length === 0) {
    const fallback = nextPalette.find(slot => slot.slotIndex > 0 && !isTransparentHex(slot.hex));
    if (fallback) candidateSlots.push(fallback);
  }

  const backgroundColor = (nextPalette[0]?.hex || currentBackgroundColor || TRANSPARENT_HEX) as MSXColorValue;
  const pixelData: PixelData = rawPixels.map(row => row.map(pixel => {
    if (!pixel.visible) return backgroundColor;
    const slot = nearestSlotColor(pixel, candidateSlots);
    return (slot?.hex || backgroundColor) as MSXColorValue;
  }));

  if (targetWidth % 16 !== 0 || targetHeight % 16 !== 0) {
    warnings.push('La resolucion destino no es multiplo de 16; Mideas creara celdas hardware 16x16 parciales.');
  }
  if (targetWidth > 32 || targetHeight > 64) {
    warnings.push('Sprite grande: revisa el limite de 8 sprites hardware por scanline.');
  }

  return {
    palette: nextPalette,
    pixelData,
    detectedOpaqueColors,
    crop,
    generatedSlots,
    warnings,
  };
}

export function defaultReplaceableMsx2SpriteSlots(palette: Screen5PaletteSlot[]): number[] {
  const immutable = findImmutableSlots(palette);
  return palette
    .map(slot => slot.slotIndex)
    .filter(slot => slot > 0 && slot < 16 && !immutable.has(slot));
}
