import { MSX1_PALETTE, DEFAULT_PRESENTATION_SCREEN_CONFIG } from '../../constants';
import {
  PresentationScreenBankIndex,
  PresentationScreenCellCoordinate,
  PresentationScreenCellInfo,
  PresentationScreenConfig,
  PresentationScreenData,
  PresentationScreenEditMode,
  PresentationScreenEditableTile,
  PresentationScreenPreview,
} from '../../types';

export const SCREEN2_WIDTH = 256;
export const SCREEN2_HEIGHT = 192;
export const TILE_SIZE = 8;
export const TILES_X = SCREEN2_WIDTH / TILE_SIZE;
export const TILES_Y = SCREEN2_HEIGHT / TILE_SIZE;
export const ROW_BANK_HEIGHT = 8;

type QuantizedPixelRow = number[];

interface QuantizedImage {
  width: number;
  height: number;
  pixels: number[][];
}

const paletteRgb = MSX1_PALETTE.map((entry) => ({
  index: entry.index,
  hex: entry.hex,
  r: parseInt(entry.hex.slice(1, 3), 16),
  g: parseInt(entry.hex.slice(3, 5), 16),
  b: parseInt(entry.hex.slice(5, 7), 16),
}));

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value))) & 0xff;
}

function colorDistance(r: number, g: number, b: number, paletteEntry: { r: number; g: number; b: number }): number {
  const dr = r - paletteEntry.r;
  const dg = g - paletteEntry.g;
  const db = b - paletteEntry.b;
  return (dr * dr) + (dg * dg) + (db * db);
}

function findNearestPaletteIndex(r: number, g: number, b: number): number {
  let nearestIndex = paletteRgb[0].index;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const paletteEntry of paletteRgb) {
    const distance = colorDistance(r, g, b, paletteEntry);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = paletteEntry.index;
    }
  }

  return nearestIndex;
}

function resizeToScreen2(imageData: ImageData): ImageData {
  if (imageData.width === SCREEN2_WIDTH && imageData.height === SCREEN2_HEIGHT) {
    return imageData;
  }

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('No se pudo preparar el canvas fuente para la conversion.');
  }
  sourceCtx.putImageData(imageData, 0, 0);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = SCREEN2_WIDTH;
  targetCanvas.height = SCREEN2_HEIGHT;
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) {
    throw new Error('No se pudo preparar el canvas destino para SCREEN 2.');
  }

  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(sourceCanvas, 0, 0, SCREEN2_WIDTH, SCREEN2_HEIGHT);
  return targetCtx.getImageData(0, 0, SCREEN2_WIDTH, SCREEN2_HEIGHT);
}

function quantizeImage(imageData: ImageData): QuantizedImage {
  const pixels: number[][] = [];
  for (let y = 0; y < imageData.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < imageData.width; x++) {
      const offset = ((y * imageData.width) + x) * 4;
      const alpha = imageData.data[offset + 3];
      if (alpha < 64) {
        row.push(0);
        continue;
      }
      row.push(
        findNearestPaletteIndex(
          imageData.data[offset],
          imageData.data[offset + 1],
          imageData.data[offset + 2]
        )
      );
    }
    pixels.push(row);
  }
  return {
    width: imageData.width,
    height: imageData.height,
    pixels,
  };
}

function buildRowPattern(row: QuantizedPixelRow, backgroundColorIndex: number): { pattern: number; color: number } {
  const counts = new Map<number, number>();
  row.forEach((colorIndex) => {
    counts.set(colorIndex, (counts.get(colorIndex) || 0) + 1);
  });

  const ranked = Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] - b[0];
    })
    .map(([colorIndex]) => colorIndex);

  let bg = ranked[0] ?? backgroundColorIndex;
  let fg = ranked[1] ?? ranked[0] ?? backgroundColorIndex;

  if (bg === fg) {
    fg = bg;
  }

  let pattern = 0;
  for (let i = 0; i < row.length; i++) {
    const colorIndex = row[i];
    const useFg = colorIndex === fg;
    if (useFg) {
      pattern |= (0x80 >> i);
    }
  }

  return {
    pattern: clampByte(pattern),
    color: clampByte((fg << 4) | bg),
  };
}

function encodeTile(
  quantized: QuantizedImage,
  tileX: number,
  tileY: number,
  backgroundColorIndex: number
): { patternBytes: number[]; colorBytes: number[] } {
  const patternBytes: number[] = [];
  const colorBytes: number[] = [];

  for (let row = 0; row < TILE_SIZE; row++) {
    const absoluteY = (tileY * TILE_SIZE) + row;
    const pixelRow = quantized.pixels[absoluteY].slice(tileX * TILE_SIZE, (tileX + 1) * TILE_SIZE);
    const encoded = buildRowPattern(pixelRow, backgroundColorIndex);
    patternBytes.push(encoded.pattern);
    colorBytes.push(encoded.color);
  }

  return { patternBytes, colorBytes };
}

function createEmptyData(): PresentationScreenData {
  return JSON.parse(JSON.stringify(DEFAULT_PRESENTATION_SCREEN_CONFIG.data)) as PresentationScreenData;
}

function createEmptyPreview(): PresentationScreenPreview {
  return JSON.parse(JSON.stringify(DEFAULT_PRESENTATION_SCREEN_CONFIG.preview)) as PresentationScreenPreview;
}

function getBankArrays(data: PresentationScreenData, bank: PresentationScreenBankIndex): { patterns: number[]; colors: number[] } {
  switch (bank) {
    case 0:
      return { patterns: data.patternBank0, colors: data.colorBank0 };
    case 1:
      return { patterns: data.patternBank1, colors: data.colorBank1 };
    case 2:
      return { patterns: data.patternBank2, colors: data.colorBank2 };
  }
}

function getPatternCount(data: PresentationScreenData, bank: PresentationScreenBankIndex): number {
  switch (bank) {
    case 0:
      return data.patternCountBank0;
    case 1:
      return data.patternCountBank1;
    case 2:
      return data.patternCountBank2;
  }
}

function setPatternCount(data: PresentationScreenData, bank: PresentationScreenBankIndex, value: number): void {
  switch (bank) {
    case 0:
      data.patternCountBank0 = value;
      break;
    case 1:
      data.patternCountBank1 = value;
      break;
    case 2:
      data.patternCountBank2 = value;
      break;
  }
}

function isValidCell(x: number, y: number): boolean {
  return x >= 0 && x < TILES_X && y >= 0 && y < TILES_Y;
}

function getBankFromTileY(tileY: number): PresentationScreenBankIndex {
  return Math.floor(tileY / ROW_BANK_HEIGHT) as PresentationScreenBankIndex;
}

function getNameTableIndex(x: number, y: number): number {
  return (y * TILES_X) + x;
}

function normalizeByteArray(bytes: number[]): number[] {
  return bytes.slice(0, TILE_SIZE).map(clampByte);
}

function getTileSignature(patternBytes: number[], colorBytes: number[]): string {
  return `${patternBytes.join(',')}|${colorBytes.join(',')}`;
}

function ensureCharCapacity(bytes: number[], charCode: number): void {
  const requiredLength = (charCode + 1) * TILE_SIZE;
  while (bytes.length < requiredLength) {
    bytes.push(0);
  }
}

function writeCharBytes(target: number[], charCode: number, source: number[]): void {
  ensureCharCapacity(target, charCode);
  const base = charCode * TILE_SIZE;
  for (let i = 0; i < TILE_SIZE; i++) {
    target[base + i] = clampByte(source[i] ?? 0);
  }
}

function findMatchingCharCode(data: PresentationScreenData, bank: PresentationScreenBankIndex, patternBytes: number[], colorBytes: number[]): number | null {
  const { patterns, colors } = getBankArrays(data, bank);
  const count = getPatternCount(data, bank);
  const targetSignature = getTileSignature(patternBytes, colorBytes);

  for (let charCode = 0; charCode < count; charCode++) {
    const base = charCode * TILE_SIZE;
    const signature = getTileSignature(
      patterns.slice(base, base + TILE_SIZE),
      colors.slice(base, base + TILE_SIZE),
    );
    if (signature === targetSignature) {
      return charCode;
    }
  }

  return null;
}

function recalculatePreviewFromData(data: PresentationScreenData, previousPreview?: PresentationScreenPreview): PresentationScreenPreview {
  const preview = createEmptyPreview();
  preview.uniqueCharsPerBank = [
    data.patternCountBank0,
    data.patternCountBank1,
    data.patternCountBank2,
  ];
  preview.totalUniqueChars = data.patternCountBank0 + data.patternCountBank1 + data.patternCountBank2;

  const usedColors = new Set<number>();

  for (let tileY = 0; tileY < TILES_Y; tileY++) {
    const bank = getBankFromTileY(tileY);
    const { colors } = getBankArrays(data, bank);
    for (let tileX = 0; tileX < TILES_X; tileX++) {
      const charCode = data.nameTable[getNameTableIndex(tileX, tileY)] ?? 0;
      const base = charCode * TILE_SIZE;
      for (let row = 0; row < TILE_SIZE; row++) {
        const colorByte = colors[base + row] ?? 0;
        usedColors.add((colorByte >> 4) & 0x0f);
        usedColors.add(colorByte & 0x0f);
      }
    }
  }

  preview.paletteIndices = Array.from(usedColors.values()).sort((a, b) => a - b);
  preview.warning = preview.totalUniqueChars > 700
    ? 'La imagen usa muchos caracteres unicos; la compresion ZX0 sera importante.'
    : (previousPreview?.warning && previousPreview.warning.includes('La imagen usa muchos caracteres unicos')
      ? null
      : previousPreview?.warning ?? null);

  return preview;
}

export function convertImageDataToPresentationScreen(
  sourceImageData: ImageData,
  baseConfig: PresentationScreenConfig
): Pick<PresentationScreenConfig, 'sourceImageWidth' | 'sourceImageHeight' | 'data' | 'preview' | 'lastImportError' | 'updatedAt'> {
  const imageData = resizeToScreen2(sourceImageData);
  const quantized = quantizeImage(imageData);
  const data = createEmptyData();
  const preview = createEmptyPreview();
  const warnings: string[] = [];

  const banks = [
    { patterns: data.patternBank0, colors: data.colorBank0 },
    { patterns: data.patternBank1, colors: data.colorBank1 },
    { patterns: data.patternBank2, colors: data.colorBank2 },
  ];
  const bankMaps = [new Map<string, number>(), new Map<string, number>(), new Map<string, number>()];

  for (let tileY = 0; tileY < TILES_Y; tileY++) {
    const bankIndex = Math.floor(tileY / ROW_BANK_HEIGHT);
    const tileRowInBank = tileY % ROW_BANK_HEIGHT;
    const currentBank = banks[bankIndex];
    const currentMap = bankMaps[bankIndex];

    for (let tileX = 0; tileX < TILES_X; tileX++) {
      const encodedTile = encodeTile(
        quantized,
        tileX,
        tileY,
        baseConfig.conversion.backgroundColorIndex
      );
      const signature = `${encodedTile.patternBytes.join(',')}|${encodedTile.colorBytes.join(',')}`;

      let charCode = currentMap.get(signature);
      if (charCode === undefined) {
        charCode = currentMap.size;
        currentMap.set(signature, charCode);
        currentBank.patterns.push(...encodedTile.patternBytes);
        currentBank.colors.push(...encodedTile.colorBytes);
      }

      if (charCode > 255) {
        throw new Error(`La imagen supera el limite de 256 caracteres unicos en el banco ${bankIndex}.`);
      }

      data.nameTable[(tileRowInBank + (bankIndex * ROW_BANK_HEIGHT)) * TILES_X + tileX] = charCode;
    }
  }

  data.patternCountBank0 = bankMaps[0].size;
  data.patternCountBank1 = bankMaps[1].size;
  data.patternCountBank2 = bankMaps[2].size;

  preview.uniqueCharsPerBank = [
    data.patternCountBank0,
    data.patternCountBank1,
    data.patternCountBank2,
  ];
  preview.totalUniqueChars =
    data.patternCountBank0 +
    data.patternCountBank1 +
    data.patternCountBank2;

  const usedColors = new Set<number>();
  quantized.pixels.forEach((row) => row.forEach((color) => usedColors.add(color)));
  preview.paletteIndices = Array.from(usedColors.values()).sort((a, b) => a - b);

  if (preview.totalUniqueChars > 700) {
    warnings.push('La imagen usa muchos caracteres unicos; la compresion ZX0 sera importante.');
  }

  preview.warning = warnings.length > 0 ? warnings.join(' ') : null;

  return {
    sourceImageWidth: sourceImageData.width,
    sourceImageHeight: sourceImageData.height,
    data,
    preview,
    lastImportError: null,
    updatedAt: Date.now(),
  };
}

export function hasPresentationScreenData(config: PresentationScreenConfig | null | undefined): boolean {
  if (!config) return false;
  return config.data.nameTable.length === 768 &&
    (config.data.patternBank0.length > 0 || config.data.patternBank1.length > 0 || config.data.patternBank2.length > 0);
}

export function findCellsUsingSameChar(
  config: PresentationScreenConfig,
  bank: PresentationScreenBankIndex,
  charCode: number,
): PresentationScreenCellCoordinate[] {
  if (!hasPresentationScreenData(config)) {
    return [];
  }

  const startRow = bank * ROW_BANK_HEIGHT;
  const endRow = startRow + ROW_BANK_HEIGHT;
  const cells: PresentationScreenCellCoordinate[] = [];

  for (let y = startRow; y < endRow; y++) {
    for (let x = 0; x < TILES_X; x++) {
      if ((config.data.nameTable[getNameTableIndex(x, y)] ?? 0) === charCode) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export function getPresentationScreenCellInfo(
  config: PresentationScreenConfig,
  x: number,
  y: number,
): PresentationScreenCellInfo | null {
  if (!hasPresentationScreenData(config) || !isValidCell(x, y)) {
    return null;
  }

  const bank = getBankFromTileY(y);
  const charCode = config.data.nameTable[getNameTableIndex(x, y)] ?? 0;
  const sharedCells = findCellsUsingSameChar(config, bank, charCode);

  return {
    x,
    y,
    bank,
    charCode,
    charUsageCount: sharedCells.length,
    sharedCells,
  };
}

export function decodePresentationCharToEditableTile(
  config: PresentationScreenConfig,
  x: number,
  y: number,
): PresentationScreenEditableTile | null {
  const cellInfo = getPresentationScreenCellInfo(config, x, y);
  if (!cellInfo) {
    return null;
  }

  const { patterns, colors } = getBankArrays(config.data, cellInfo.bank);
  const base = cellInfo.charCode * TILE_SIZE;

  return {
    cell: { x, y },
    bank: cellInfo.bank,
    charCode: cellInfo.charCode,
    charUsageCount: cellInfo.charUsageCount,
    patternBytes: patterns.slice(base, base + TILE_SIZE),
    colorBytes: colors.slice(base, base + TILE_SIZE),
  };
}

export function applyEditedPresentationTile(
  config: PresentationScreenConfig,
  params: {
    tileX: number;
    tileY: number;
    patternBytes: number[];
    colorBytes: number[];
    mode: PresentationScreenEditMode;
  },
): PresentationScreenConfig {
  if (!hasPresentationScreenData(config)) {
    throw new Error('No hay una pantalla de presentacion cargada.');
  }
  if (!isValidCell(params.tileX, params.tileY)) {
    throw new Error('La celda seleccionada esta fuera del rango SCREEN 2.');
  }

  const normalizedPatternBytes = normalizeByteArray(params.patternBytes);
  const normalizedColorBytes = normalizeByteArray(params.colorBytes);

  if (normalizedPatternBytes.length !== TILE_SIZE || normalizedColorBytes.length !== TILE_SIZE) {
    throw new Error('El tile editado debe tener exactamente 8 bytes de patron y 8 de color.');
  }

  const nextConfig: PresentationScreenConfig = {
    ...config,
    data: {
      ...config.data,
      nameTable: [...config.data.nameTable],
      patternBank0: [...config.data.patternBank0],
      patternBank1: [...config.data.patternBank1],
      patternBank2: [...config.data.patternBank2],
      colorBank0: [...config.data.colorBank0],
      colorBank1: [...config.data.colorBank1],
      colorBank2: [...config.data.colorBank2],
    },
  };

  const bank = getBankFromTileY(params.tileY);
  const { patterns, colors } = getBankArrays(nextConfig.data, bank);
  const cellIndex = getNameTableIndex(params.tileX, params.tileY);
  const currentCharCode = nextConfig.data.nameTable[cellIndex] ?? 0;
  const sharedCells = findCellsUsingSameChar(config, bank, currentCharCode);

  let targetCharCode = currentCharCode;

  if (params.mode === 'shared' || sharedCells.length <= 1) {
    writeCharBytes(patterns, currentCharCode, normalizedPatternBytes);
    writeCharBytes(colors, currentCharCode, normalizedColorBytes);
  } else {
    const existingCharCode = findMatchingCharCode(nextConfig.data, bank, normalizedPatternBytes, normalizedColorBytes);
    if (existingCharCode !== null && existingCharCode !== currentCharCode) {
      targetCharCode = existingCharCode;
    } else {
      const currentPatternCount = getPatternCount(nextConfig.data, bank);
      if (currentPatternCount >= 256) {
        throw new Error(`El banco ${bank} ya usa 256 caracteres; no se puede clonar otro tile.`);
      }
      targetCharCode = currentPatternCount;
      writeCharBytes(patterns, targetCharCode, normalizedPatternBytes);
      writeCharBytes(colors, targetCharCode, normalizedColorBytes);
      setPatternCount(nextConfig.data, bank, currentPatternCount + 1);
    }

    nextConfig.data.nameTable[cellIndex] = targetCharCode;
  }

  if (params.mode === 'shared' || sharedCells.length <= 1) {
    const currentCount = getPatternCount(nextConfig.data, bank);
    if (currentCount <= currentCharCode) {
      setPatternCount(nextConfig.data, bank, currentCharCode + 1);
    }
  }

  nextConfig.preview = recalculatePreviewFromData(nextConfig.data, config.preview);
  nextConfig.updatedAt = Date.now();
  nextConfig.lastImportError = null;

  return nextConfig;
}

export function drawPresentationScreenPreview(
  canvas: HTMLCanvasElement,
  config: PresentationScreenConfig
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = SCREEN2_WIDTH;
  canvas.height = SCREEN2_HEIGHT;
  ctx.clearRect(0, 0, SCREEN2_WIDTH, SCREEN2_HEIGHT);

  if (!hasPresentationScreenData(config)) {
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, SCREEN2_WIDTH, SCREEN2_HEIGHT);
    ctx.fillStyle = '#d0d0d0';
    ctx.font = '12px monospace';
    ctx.fillText('No presentation screen imported.', 16, 24);
    return;
  }

  const image = ctx.createImageData(SCREEN2_WIDTH, SCREEN2_HEIGHT);
  const banks = [
    { patterns: config.data.patternBank0, colors: config.data.colorBank0 },
    { patterns: config.data.patternBank1, colors: config.data.colorBank1 },
    { patterns: config.data.patternBank2, colors: config.data.colorBank2 },
  ];

  for (let tileY = 0; tileY < TILES_Y; tileY++) {
    const bankIndex = Math.floor(tileY / ROW_BANK_HEIGHT);
    const bank = banks[bankIndex];

    for (let tileX = 0; tileX < TILES_X; tileX++) {
      const charCode = config.data.nameTable[(tileY * TILES_X) + tileX] || 0;
      const patternBase = charCode * TILE_SIZE;
      const colorBase = charCode * TILE_SIZE;

      for (let row = 0; row < TILE_SIZE; row++) {
        const patternByte = bank.patterns[patternBase + row] ?? 0;
        const colorByte = bank.colors[colorBase + row] ?? 0;
        const fg = paletteRgb.find((entry) => entry.index === ((colorByte >> 4) & 0x0f)) || paletteRgb[15];
        const bg = paletteRgb.find((entry) => entry.index === (colorByte & 0x0f)) || paletteRgb[0];

        for (let bit = 0; bit < TILE_SIZE; bit++) {
          const useFg = (patternByte & (0x80 >> bit)) !== 0;
          const targetX = (tileX * TILE_SIZE) + bit;
          const targetY = (tileY * TILE_SIZE) + row;
          const offset = ((targetY * SCREEN2_WIDTH) + targetX) * 4;
          const color = useFg ? fg : bg;
          image.data[offset] = color.r;
          image.data[offset + 1] = color.g;
          image.data[offset + 2] = color.b;
          image.data[offset + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0);
}
