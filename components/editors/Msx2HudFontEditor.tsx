import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DataFormat, Msx2HudFontAsset, PaletteAsset, Point, ProjectAsset, Screen5PaletteSlot } from '../../types';
import { createDefaultScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { CodeIcon, FolderOpenIcon, LoadIcon, PencilIcon, SaveFloppyIcon } from '../icons/MsxIcons';

const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 8;
const SUPPORTED_CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const ZX_ASCII_FIRST = 0x20;
const ZX_ASCII_GLYPH_COUNT = 96;
const ZX_ASCII_CHARS = Array.from({ length: ZX_ASCII_GLYPH_COUNT }, (_unused, index) =>
  String.fromCharCode(ZX_ASCII_FIRST + index)
).join('');
const MSX2_DEFAULT_PALETTE_HEX = [
  '#000000', '#000000', '#24DB24', '#6DFF6D',
  '#2424FF', '#496DFF', '#B62424', '#49DBFF',
  '#FF2424', '#FF6D6D', '#DBDB24', '#DBDB92',
  '#249224', '#DB49B6', '#B6B6B6', '#FFFFFF',
];
const GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
type ExtendTarget = 'digits' | 'letters' | 'punctuation' | 'all';

const EXTEND_TARGET_LABELS: Record<ExtendTarget, string> = {
  digits: 'Digits',
  letters: 'Letters',
  punctuation: 'Punctuation',
  all: 'All',
};

interface Msx2HudFontEditorProps {
  font: Msx2HudFontAsset;
  onUpdate: (data: Partial<Msx2HudFontAsset>) => void;
  dataOutputFormat: DataFormat;
  allAssets?: ProjectAsset[];
}

const normalizePattern = (pattern: unknown): number[] => {
  if (!Array.isArray(pattern)) return Array(8).fill(0);
  return Array.from({ length: 8 }, (_unused, index) =>
    Math.max(0, Math.min(255, Number(pattern[index]) || 0))
  );
};

const clampPaletteSlot = (value: unknown, fallback = 0): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(15, n)) : fallback;
};

const bitmapFromPattern = (pattern: number[], fg: number, bg = 0): number[][] =>
  Array.from({ length: 8 }, (_unused, y) =>
    Array.from({ length: 8 }, (_unused2, x) =>
      ((pattern[y] || 0) & (0x80 >> x)) ? (fg & 0x0f) : (bg & 0x0f)
    )
  );

const patternFromBitmap = (bitmap: number[][], backgroundSlot = 0): number[] =>
  Array.from({ length: 8 }, (_unused, y) => {
    let byte = 0;
    for (let x = 0; x < 8; x++) {
      if (clampPaletteSlot(bitmap[y]?.[x], backgroundSlot) !== backgroundSlot) byte |= (0x80 >> x);
    }
    return byte;
  });

const normalizeBitmapPattern = (bitmap: unknown, fallbackPattern: number[], fg: number, bg: number): number[][] => {
  if (!Array.isArray(bitmap)) return bitmapFromPattern(fallbackPattern, fg, bg);
  return Array.from({ length: 8 }, (_unused, y) =>
    Array.from({ length: 8 }, (_unused2, x) => clampPaletteSlot((bitmap[y] as unknown[])?.[x], 0))
  );
};

const buildGradientBitmap = (
  bitmap: number[][],
  backgroundSlot: number,
  angleDeg: number,
  stops: number[],
): number[][] => {
  const safeStops = stops.map(stop => stop & 0x0f).filter(stop => Number.isFinite(stop));
  if (safeStops.length === 0) return bitmap.map(row => [...row]);
  const radians = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const corners = [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 0, y: 7 },
    { x: 7, y: 7 },
  ].map(point => (point.x * dx) + (point.y * dy));
  const minProjection = Math.min(...corners);
  const maxProjection = Math.max(...corners);
  const range = Math.max(0.0001, maxProjection - minProjection);

  return Array.from({ length: 8 }, (_unused, y) =>
    Array.from({ length: 8 }, (_unused2, x) => {
      const active = clampPaletteSlot(bitmap[y]?.[x], backgroundSlot) !== backgroundSlot;
      if (!active) return backgroundSlot;
      const t = (((x * dx) + (y * dy)) - minProjection) / range;
      const stopIndex = Math.max(0, Math.min(safeStops.length - 1, Math.round(t * (safeStops.length - 1))));
      return safeStops[stopIndex];
    })
  );
};

const formatByte = (value: number, dataOutputFormat: DataFormat): string => (
  dataOutputFormat === 'hex'
    ? `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`
    : String(value & 0xff)
);

const msx2PaletteHex = (slot: number): string => MSX2_DEFAULT_PALETTE_HEX[slot & 0x0f] || '#000000';

const paletteHex = (slots: Screen5PaletteSlot[], slot: number): string => {
  const hex = slots[slot & 0x0f]?.hex || msx2PaletteHex(slot);
  return hex === 'rgba(0,0,0,0)' ? '#000000' : hex;
};

const resolveExtendTargetCharacters = (characters: string[], target: ExtendTarget): string[] => {
  if (target === 'all') return characters;
  return characters.filter(char => {
    if (target === 'digits') return /^[0-9]$/.test(char);
    if (target === 'letters') return /^[A-Z]$/i.test(char);
    return char.trim().length > 0 && !/^[0-9A-Z]$/i.test(char);
  });
};

const nearestActiveSourceColor = (sourceBitmap: number[][], backgroundSlot: number, x: number, y: number, fallback: number): number => {
  let bestColor = fallback & 0x0f;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let sy = 0; sy < 8; sy++) {
    for (let sx = 0; sx < 8; sx++) {
      const color = clampPaletteSlot(sourceBitmap[sy]?.[sx], backgroundSlot);
      if (color === backgroundSlot) continue;
      const distance = ((sx - x) * (sx - x)) + ((sy - y) * (sy - y));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestColor = color;
      }
    }
  }
  return bestColor;
};

const applySourceColorsToTargetMask = (
  sourceBitmap: number[][],
  targetMaskPattern: number[],
  backgroundSlot: number,
  fallbackColor: number,
): number[][] => Array.from({ length: 8 }, (_unused, y) =>
  Array.from({ length: 8 }, (_unused2, x) => {
    const active = Boolean((targetMaskPattern[y] || 0) & (0x80 >> x));
    if (!active) return backgroundSlot;
    const sourceColor = clampPaletteSlot(sourceBitmap[y]?.[x], backgroundSlot);
    return sourceColor === backgroundSlot
      ? nearestActiveSourceColor(sourceBitmap, backgroundSlot, x, y, fallbackColor)
      : sourceColor;
  })
);

const SingleCharPreview: React.FC<{
  pattern: number[];
  bitmapPattern?: number[][];
  scale: number;
  colorByte: number;
  vdpMode: 'SCREEN4' | 'SCREEN5';
  paletteSlots: Screen5PaletteSlot[];
  isSelected?: boolean;
}> = ({
  pattern,
  bitmapPattern,
  scale,
  colorByte,
  vdpMode,
  paletteSlots,
  isSelected,
}) => {
  const fg = msx2PaletteHex((colorByte >> 4) & 0x0f);
  const bg = msx2PaletteHex(colorByte & 0x0f);
  const bitmap = bitmapPattern || bitmapFromPattern(pattern, (colorByte >> 4) & 0x0f, colorByte & 0x0f);

  return (
    <div
      className={`grid border ${isSelected ? 'border-msx-danger' : 'border-msx-border'}`}
      style={{
        gridTemplateColumns: `repeat(8, ${scale}px)`,
        gridTemplateRows: `repeat(8, ${scale}px)`,
        width: CHAR_WIDTH * scale,
        height: CHAR_HEIGHT * scale,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: 64 }, (_unused, index) => {
        const y = Math.floor(index / 8);
        const x = index % 8;
        const lit = Boolean((pattern[y] || 0) & (0x80 >> x));
        const color = vdpMode === 'SCREEN5'
          ? paletteHex(paletteSlots, bitmap[y]?.[x] ?? 0)
          : (lit ? fg : bg);
        return <div key={index} style={{ backgroundColor: color }} />;
      })}
    </div>
  );
};

const FontPixelGrid: React.FC<{
  pattern: number[];
  bitmapPattern: number[][];
  onPixelClick: (point: Point) => void;
  pixelSize: number;
  colorByte: number;
  vdpMode: 'SCREEN4' | 'SCREEN5';
  paletteSlots: Screen5PaletteSlot[];
}> = ({ pattern, bitmapPattern, onPixelClick, pixelSize, colorByte, vdpMode, paletteSlots }) => {
  const fg = msx2PaletteHex((colorByte >> 4) & 0x0f);
  const bg = msx2PaletteHex(colorByte & 0x0f);

  return (
    <div
      className="grid border border-msx-border shadow-inner"
      style={{
        gridTemplateColumns: `repeat(8, ${pixelSize}px)`,
        gridTemplateRows: `repeat(8, ${pixelSize}px)`,
        width: CHAR_WIDTH * pixelSize,
        height: CHAR_HEIGHT * pixelSize,
        imageRendering: 'pixelated',
        cursor: 'pointer',
      }}
    >
      {Array.from({ length: 64 }, (_unused, index) => {
        const y = Math.floor(index / 8);
        const x = index % 8;
        const lit = Boolean((pattern[y] || 0) & (0x80 >> x));
        const color = vdpMode === 'SCREEN5'
          ? paletteHex(paletteSlots, bitmapPattern[y]?.[x] ?? 0)
          : (lit ? fg : bg);
        return (
          <button
            key={index}
            type="button"
            className="hover:outline hover:outline-1 hover:outline-msx-highlight"
            style={{ backgroundColor: color, width: pixelSize, height: pixelSize }}
            onClick={() => onPixelClick({ x, y })}
            aria-label={`MSX2 HUD font pixel ${x},${y}`}
          />
        );
      })}
    </div>
  );
};

export const Msx2HudFontEditor: React.FC<Msx2HudFontEditorProps> = ({ font, onUpdate, dataOutputFormat, allAssets = [] }) => {
  const characters = useMemo(() => Array.from(font.characters || SUPPORTED_CHARS), [font.characters]);
  const [selectedChar, setSelectedChar] = useState(characters[0] || ' ');
  const [zoom, setZoom] = useState(20);
  const [selectedScreen5Color, setSelectedScreen5Color] = useState(15);
  const [gradientAngle, setGradientAngle] = useState<number>(90);
  const [gradientStopCount, setGradientStopCount] = useState(3);
  const [gradientStops, setGradientStops] = useState<number[]>([15, 14, 8, 10, 6, 4, 2, 1]);
  const [extendTarget, setExtendTarget] = useState<ExtendTarget>('digits');
  const [previewText, setPreviewText] = useState('ROOM 1 000');
  const [showAsm, setShowAsm] = useState(false);
  const [rasterFontSize, setRasterFontSize] = useState(8);
  const [rasterOffsetX, setRasterOffsetX] = useState(0);
  const [rasterOffsetY, setRasterOffsetY] = useState(0);
  const [rasterThreshold, setRasterThreshold] = useState(80);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const zxBinaryInputRef = useRef<HTMLInputElement>(null);

  const colorByte = Math.max(0, Math.min(255, Number(font.colorByte ?? 0xF1) || 0xF1));
  const vdpMode: 'SCREEN4' | 'SCREEN5' = font.vdpMode === 'SCREEN5' ? 'SCREEN5' : 'SCREEN4';
  const currentPattern = normalizePattern(font.patterns?.[selectedChar]);
  const fg = (colorByte >> 4) & 0x0f;
  const bg = colorByte & 0x0f;
  const screen5BackgroundSlot = clampPaletteSlot(font.screen5BackgroundSlot, bg);
  const paletteAssets = useMemo(() => allAssets.filter(asset => asset.type === 'palette'), [allAssets]);
  const selectedPaletteAsset = useMemo(
    () => paletteAssets.find(asset => asset.id === font.paletteAssetId)?.data as PaletteAsset | undefined,
    [font.paletteAssetId, paletteAssets],
  );
  const paletteSlots = useMemo(
    () => selectedPaletteAsset?.slots?.length ? selectedPaletteAsset.slots : createDefaultScreen5PaletteSlots(),
    [selectedPaletteAsset],
  );
  const currentBitmapPattern = normalizeBitmapPattern(font.bitmapPatterns?.[selectedChar], currentPattern, fg, screen5BackgroundSlot);

  const updatePattern = useCallback((char: string, pattern: number[]) => {
    onUpdate({
      patterns: {
        ...(font.patterns || {}),
        [char]: normalizePattern(pattern),
      },
    });
  }, [font.patterns, onUpdate]);

  const updateBitmapPattern = useCallback((char: string, bitmap: number[][]) => {
    const normalized = normalizeBitmapPattern(bitmap, normalizePattern(font.patterns?.[char]), fg, screen5BackgroundSlot);
    onUpdate({
      bitmapPatterns: {
        ...(font.bitmapPatterns || {}),
        [char]: normalized,
      },
      patterns: {
        ...(font.patterns || {}),
        [char]: patternFromBitmap(normalized, screen5BackgroundSlot),
      },
    });
  }, [fg, font.bitmapPatterns, font.patterns, onUpdate, screen5BackgroundSlot]);

  const handlePixelClick = useCallback((point: Point) => {
    if (vdpMode === 'SCREEN5') {
      const next = currentBitmapPattern.map(row => [...row]);
      next[point.y][point.x] = selectedScreen5Color & 0x0f;
      updateBitmapPattern(selectedChar, next);
      return;
    }
    const next = [...currentPattern];
    next[point.y] = next[point.y] ^ (1 << (7 - point.x));
    updatePattern(selectedChar, next);
  }, [currentBitmapPattern, currentPattern, selectedChar, selectedScreen5Color, updateBitmapPattern, updatePattern, vdpMode]);

  const handleClearCharacter = () => {
    if (vdpMode === 'SCREEN5') {
      updateBitmapPattern(selectedChar, Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => screen5BackgroundSlot)));
    } else {
      updatePattern(selectedChar, Array(8).fill(0));
    }
  };
  const handleInvertCharacter = () => {
    if (vdpMode === 'SCREEN5') {
      updateBitmapPattern(selectedChar, currentBitmapPattern.map(row => row.map(value => value === screen5BackgroundSlot ? selectedScreen5Color : screen5BackgroundSlot)));
    } else {
      updatePattern(selectedChar, currentPattern.map(byte => (~byte) & 0xff));
    }
  };
  const handleShift = (dx: number, dy: number) => {
    if (vdpMode === 'SCREEN5') {
      const next = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => screen5BackgroundSlot));
      for (let y = 0; y < 8; y++) {
        const sourceY = y - dy;
        if (sourceY < 0 || sourceY > 7) continue;
        for (let x = 0; x < 8; x++) {
          const sourceX = x - dx;
          if (sourceX < 0 || sourceX > 7) continue;
          next[y][x] = currentBitmapPattern[sourceY]?.[sourceX] ?? screen5BackgroundSlot;
        }
      }
      updateBitmapPattern(selectedChar, next);
      return;
    }
    const next = Array(8).fill(0);
    for (let y = 0; y < 8; y++) {
      const sourceY = y - dy;
      if (sourceY < 0 || sourceY > 7) continue;
      for (let x = 0; x < 8; x++) {
        const sourceX = x - dx;
        if (sourceX < 0 || sourceX > 7) continue;
        if ((currentPattern[sourceY] || 0) & (0x80 >> sourceX)) {
          next[y] |= (0x80 >> x);
        }
      }
    }
    updatePattern(selectedChar, next);
  };

  const handleExtendFromCurrentChar = useCallback(() => {
    const targetCharacters = resolveExtendTargetCharacters(characters, extendTarget);
    if (!targetCharacters.length) return;

    if (vdpMode === 'SCREEN5') {
      const sourceBitmap = currentBitmapPattern.map(row => [...row]);
      const nextBitmapPatterns: Record<string, number[][]> = { ...(font.bitmapPatterns || {}) };
      const nextPatterns: Record<string, number[]> = { ...(font.patterns || {}) };
      targetCharacters.forEach(char => {
        const targetBitmap = normalizeBitmapPattern(font.bitmapPatterns?.[char], normalizePattern(font.patterns?.[char]), fg, screen5BackgroundSlot);
        const targetMaskPattern = patternFromBitmap(targetBitmap, screen5BackgroundSlot);
        const nextBitmap = applySourceColorsToTargetMask(sourceBitmap, targetMaskPattern, screen5BackgroundSlot, selectedScreen5Color);
        nextBitmapPatterns[char] = nextBitmap;
        nextPatterns[char] = [...targetMaskPattern];
      });
      onUpdate({ bitmapPatterns: nextBitmapPatterns, patterns: nextPatterns });
      return;
    }

    const sourcePattern = normalizePattern(currentPattern);
    const nextPatterns: Record<string, number[]> = { ...(font.patterns || {}) };
    targetCharacters.forEach(char => {
      nextPatterns[char] = [...sourcePattern];
    });
    onUpdate({ patterns: nextPatterns });
  }, [
    characters,
    currentBitmapPattern,
    currentPattern,
    extendTarget,
    font.bitmapPatterns,
    font.patterns,
    fg,
    onUpdate,
    screen5BackgroundSlot,
    selectedScreen5Color,
    vdpMode,
  ]);

  const updateColorByte = (nextFg = fg, nextBg = bg) => {
    onUpdate({ colorByte: ((nextFg & 0x0f) << 4) | (nextBg & 0x0f) });
  };

  const updateGradientStop = (index: number, slot: number) => {
    setGradientStops(prev => prev.map((value, i) => (i === index ? (slot & 0x0f) : value)));
  };

  const applyGradientToCurrentChar = () => {
    if (vdpMode !== 'SCREEN5') return;
    const stops = gradientStops.slice(0, gradientStopCount);
    updateBitmapPattern(selectedChar, buildGradientBitmap(currentBitmapPattern, screen5BackgroundSlot, gradientAngle, stops));
  };

  const updateMode = (nextMode: 'SCREEN4' | 'SCREEN5') => {
    if (nextMode === vdpMode) return;
    if (nextMode === 'SCREEN5') {
      const nextBitmapPatterns: Record<string, number[][]> = { ...(font.bitmapPatterns || {}) };
      characters.forEach(char => {
        nextBitmapPatterns[char] = normalizeBitmapPattern(nextBitmapPatterns[char], normalizePattern(font.patterns?.[char]), fg, screen5BackgroundSlot);
      });
      onUpdate({ vdpMode: 'SCREEN5', bitmapPatterns: nextBitmapPatterns });
    } else {
      const nextPatterns: Record<string, number[]> = { ...(font.patterns || {}) };
      characters.forEach(char => {
        nextPatterns[char] = patternFromBitmap(normalizeBitmapPattern(font.bitmapPatterns?.[char], normalizePattern(font.patterns?.[char]), fg, screen5BackgroundSlot), screen5BackgroundSlot);
      });
      onUpdate({ vdpMode: 'SCREEN4', patterns: nextPatterns });
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(font, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msx2-hud-font.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const nextCharacters = String(parsed.characters || font.characters || SUPPORTED_CHARS);
        const nextColorByte = Math.max(0, Math.min(255, Number(parsed.colorByte ?? font.colorByte ?? 0xF1)));
        const nextFg = (nextColorByte >> 4) & 0x0f;
        const nextBg = nextColorByte & 0x0f;
        const nextScreen5BackgroundSlot = clampPaletteSlot(parsed.screen5BackgroundSlot, font.screen5BackgroundSlot ?? nextBg);
        const nextPatterns: Record<string, number[]> = {};
        const nextBitmapPatterns: Record<string, number[][]> = {};
        Array.from(nextCharacters).forEach(char => {
          nextPatterns[char] = normalizePattern(parsed.patterns?.[char] || font.patterns?.[char]);
          nextBitmapPatterns[char] = normalizeBitmapPattern(
            parsed.bitmapPatterns?.[char] || font.bitmapPatterns?.[char],
            nextPatterns[char],
            nextFg,
            nextScreen5BackgroundSlot,
          );
        });
        onUpdate({
          target: 'MSX2',
          vdpMode: parsed.vdpMode === 'SCREEN5' ? 'SCREEN5' : 'SCREEN4',
          baseChar: Math.max(0, Math.min(255, Number(parsed.baseChar ?? font.baseChar ?? 0xC0))),
          characters: nextCharacters,
          patterns: nextPatterns,
          bitmapPatterns: nextBitmapPatterns,
          paletteAssetId: typeof parsed.paletteAssetId === 'string' ? parsed.paletteAssetId : font.paletteAssetId,
          screen5BackgroundSlot: nextScreen5BackgroundSlot,
          colorByte: nextColorByte,
          notes: String(parsed.notes || font.notes || ''),
        });
      } catch (error) {
        alert(`Failed to load MSX2 HUD font: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const rasterizeGlyph = useCallback((ctx: CanvasRenderingContext2D, char: string, scale: number): number[] => {
    if (char === ' ') return Array(8).fill(0);
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.font = `${rasterFontSize}px "MSX2HudImportedFont", monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(char, rasterOffsetX, rasterOffsetY);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pattern = Array(8).fill(0);
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        let alphaTotal = 0;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = gx * scale + sx;
            const py = gy * scale + sy;
            alphaTotal += imageData[((py * canvas.width + px) * 4) + 3];
          }
        }
        const alphaAverage = alphaTotal / (scale * scale);
        if (alphaAverage >= rasterThreshold) {
          pattern[gy] |= (0x80 >> gx);
        }
      }
    }
    return pattern;
  }, [rasterFontSize, rasterOffsetX, rasterOffsetY, rasterThreshold]);

  const handleFontFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fontBytes = reader.result as ArrayBuffer;
        const importedFace = new FontFace('MSX2HudImportedFont', fontBytes);
        const loadedFace = await importedFace.load();
        document.fonts.add(loadedFace);
        await document.fonts.ready;

        const scale = 8;
        const canvas = document.createElement('canvas');
        canvas.width = 8 * scale;
        canvas.height = 8 * scale;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Canvas 2D context is not available.');

        const nextPatterns: Record<string, number[]> = {};
        const nextBitmapPatterns: Record<string, number[][]> = {};
        characters.forEach(char => {
          nextPatterns[char] = rasterizeGlyph(ctx, char, scale);
          nextBitmapPatterns[char] = bitmapFromPattern(nextPatterns[char], selectedScreen5Color, screen5BackgroundSlot);
        });

        onUpdate({
          patterns: nextPatterns,
          ...(vdpMode === 'SCREEN5' ? { bitmapPatterns: nextBitmapPatterns } : {}),
          notes: `Imported from ${file.name} at ${rasterFontSize}px, offset ${rasterOffsetX},${rasterOffsetY}, threshold ${rasterThreshold}.`,
        });
        setImportStatus(`Imported ${characters.length} glyphs from ${file.name}`);
        document.fonts.delete(loadedFace);
      } catch (error) {
        setImportStatus(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (fontFileInputRef.current) fontFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleZxBinarySelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        if (bytes.length < 8 || bytes.length % 8 !== 0) {
          throw new Error('ZX font binary must contain 8 bytes per glyph.');
        }
        const glyphCount = Math.min(ZX_ASCII_GLYPH_COUNT, Math.floor(bytes.length / 8));
        const nextCharacters = ZX_ASCII_CHARS.slice(0, glyphCount);
        const nextPatterns: Record<string, number[]> = {};
        const nextBitmapPatterns: Record<string, number[][]> = {};
        Array.from(nextCharacters).forEach((char, charIndex) => {
          const offset = charIndex * 8;
          nextPatterns[char] = Array.from(bytes.slice(offset, offset + 8));
          nextBitmapPatterns[char] = bitmapFromPattern(nextPatterns[char], selectedScreen5Color, screen5BackgroundSlot);
        });
        onUpdate({
          baseChar: ZX_ASCII_FIRST,
          characters: nextCharacters,
          patterns: nextPatterns,
          ...(vdpMode === 'SCREEN5' ? { bitmapPatterns: nextBitmapPatterns } : {}),
          notes: `Imported ZX bitmap font from ${file.name}: ${glyphCount} glyphs, first source glyph is ASCII #20 SPACE.`,
        });
        setSelectedChar(' ');
        setPreviewText('SCORE 000 ROOM 1');
        setImportStatus(`Imported ZX binary ${file.name}: ASCII #20-#${(ZX_ASCII_FIRST + glyphCount - 1).toString(16).toUpperCase()}`);
      } catch (error) {
        setImportStatus(`ZX import failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (zxBinaryInputRef.current) zxBinaryInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const renderPreviewGlyphs = () => Array.from(previewText.toUpperCase()).map((char, index) => {
    const fallback = font.patterns?.[' '] || [];
    return (
      <SingleCharPreview
        key={`${char}-${index}`}
        pattern={normalizePattern(font.patterns?.[char] || fallback)}
        bitmapPattern={normalizeBitmapPattern(font.bitmapPatterns?.[char], normalizePattern(font.patterns?.[char] || fallback), fg, screen5BackgroundSlot)}
        scale={3}
        colorByte={colorByte}
        vdpMode={vdpMode}
        paletteSlots={paletteSlots}
      />
    );
  });

  const asmCode = useMemo(() => {
    if (vdpMode === 'SCREEN5') {
      const bitmapBytes = characters.flatMap(char => {
        const bitmap = normalizeBitmapPattern(font.bitmapPatterns?.[char], normalizePattern(font.patterns?.[char]), fg, screen5BackgroundSlot);
        const bytes: number[] = [];
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x += 2) {
            bytes.push(((bitmap[y][x] & 0x0f) << 4) | (bitmap[y][x + 1] & 0x0f));
          }
        }
        return bytes;
      });
      return [
        '; MSX2 SCREEN 5 HUD bitmap font',
        '; 4bpp glyphs, 8x8 pixels, 32 bytes per character, high nibble = left pixel',
        `; Palette asset: ${font.paletteAssetId || 'default'}`,
        'MSX2_HUD_FONT_SCREEN5_BITMAPS:',
        `    DB ${bitmapBytes.map(value => formatByte(value, dataOutputFormat)).join(',')}`,
      ].join('\n');
    }
    const patternBytes = characters.flatMap(char => normalizePattern(font.patterns?.[char]));
    const colorBytes = Array(patternBytes.length).fill(colorByte);
    return [
      '; MSX2 SCREEN 4 HUD font',
      `; Base char: ${formatByte(font.baseChar || 0xC0, dataOutputFormat)}`,
      'MSX2_HUD_FONT_PATTERNS:',
      `    DB ${patternBytes.map(value => formatByte(value, dataOutputFormat)).join(',')}`,
      'MSX2_HUD_FONT_COLORS:',
      `    DB ${colorBytes.map(value => formatByte(value, dataOutputFormat)).join(',')}`,
    ].join('\n');
  }, [characters, colorByte, dataOutputFormat, fg, font.baseChar, font.bitmapPatterns, font.paletteAssetId, font.patterns, screen5BackgroundSlot, vdpMode]);

  return (
    <Panel title="MSX2 Font Editor" icon={<PencilIcon />} className="flex-grow flex flex-col bg-msx-bgcolor">
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} />
      <input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" ref={fontFileInputRef} onChange={handleFontFileSelected} style={{ display: 'none' }} />
      <input type="file" accept=".ch8,.bin,.fnt,.raw,application/octet-stream" ref={zxBinaryInputRef} onChange={handleZxBinarySelected} style={{ display: 'none' }} />
      <div className="p-2 border-b border-msx-border flex items-center space-x-2 flex-wrap gap-1">
        <Button onClick={exportJson} size="sm" variant="secondary" icon={<SaveFloppyIcon />}>Save Font (.json)</Button>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="secondary" icon={<FolderOpenIcon />}>Load Font (.json)</Button>
        <Button onClick={() => fontFileInputRef.current?.click()} size="sm" variant="secondary" icon={<LoadIcon />}>Import TTF</Button>
        <Button onClick={() => zxBinaryInputRef.current?.click()} size="sm" variant="secondary" icon={<LoadIcon />}>Import ZX .ch8</Button>
        <Button onClick={() => setShowAsm(value => !value)} size="sm" variant="secondary" icon={<CodeIcon />}>Export Font ASM</Button>
        <div className="flex items-center gap-2 ml-auto text-xs text-msx-textsecondary">
          <label className="flex items-center gap-1">
            <span>Mode</span>
            <select
              value={vdpMode}
              onChange={event => updateMode(event.target.value as 'SCREEN4' | 'SCREEN5')}
              className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-msx-textprimary"
            >
              <option value="SCREEN4">SCREEN 4</option>
              <option value="SCREEN5">SCREEN 5</option>
            </select>
          </label>
          <span>Base: #{(font.baseChar || 0xC0).toString(16).toUpperCase().padStart(2, '0')}</span>
          <span>Glyphs: {characters.length}</span>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
        <div className="w-48 border-r border-msx-border flex-shrink-0 flex flex-col min-h-0">
          <div className="p-2 flex-shrink-0">
            <h4 className="text-sm pixel-font text-msx-highlight mb-2">HUD Characters</h4>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
            <div className="grid grid-cols-8 gap-1">
              {characters.map(char => (
                <button
                  key={char === ' ' ? 'space' : char}
                  onClick={() => setSelectedChar(char)}
                  className={`p-0.5 border rounded text-[0.5rem] flex flex-col items-center justify-center aspect-square ${
                    selectedChar === char ? 'bg-msx-accent text-white border-msx-accent' : 'bg-msx-panelbg text-msx-textsecondary border-msx-border hover:border-msx-highlight'
                  }`}
                  title={`Edit MSX2 HUD character ${char === ' ' ? 'space' : char}`}
                >
                  <SingleCharPreview
                    pattern={normalizePattern(font.patterns?.[char])}
                    bitmapPattern={normalizeBitmapPattern(font.bitmapPatterns?.[char], normalizePattern(font.patterns?.[char]), fg, screen5BackgroundSlot)}
                    scale={1.5}
                    colorByte={colorByte}
                    vdpMode={vdpMode}
                    paletteSlots={paletteSlots}
                    isSelected={selectedChar === char}
                  />
                  <span className="mt-0.5 truncate block w-full text-center">{char === ' ' ? 'SP' : char}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-grow p-3 flex flex-col items-center justify-start overflow-y-auto">
          <div className="mb-2 flex items-center space-x-2">
            <span className="text-lg pixel-font text-msx-highlight">Editing: {selectedChar === ' ' ? 'Space' : selectedChar}</span>
            <label htmlFor="msx2HudFontZoom" className="text-xs pixel-font text-msx-textsecondary">Zoom:</label>
            <input id="msx2HudFontZoom" type="range" min="10" max="40" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24 accent-msx-accent" />
          </div>
          <FontPixelGrid
            pattern={currentPattern}
            bitmapPattern={currentBitmapPattern}
            onPixelClick={handlePixelClick}
            pixelSize={zoom}
            colorByte={colorByte}
            vdpMode={vdpMode}
            paletteSlots={paletteSlots}
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button onClick={handleClearCharacter} variant="danger" size="sm">Clear Char</Button>
            <Button onClick={handleInvertCharacter} variant="secondary" size="sm">Invert Char</Button>
            <Button onClick={() => handleShift(-1, 0)} variant="secondary" size="sm">Shift Left</Button>
            <Button onClick={() => handleShift(1, 0)} variant="secondary" size="sm">Shift Right</Button>
            <Button onClick={() => handleShift(0, -1)} variant="secondary" size="sm">Shift Up</Button>
            <Button onClick={() => handleShift(0, 1)} variant="secondary" size="sm">Shift Down</Button>
          </div>
          <div className="mt-2 flex flex-wrap justify-center items-center gap-2 text-xs">
            <label className="flex items-center gap-2 text-msx-textsecondary">
              <span>Extend to</span>
              <select
                value={extendTarget}
                onChange={event => setExtendTarget(event.target.value as ExtendTarget)}
                className="bg-msx-bgcolor border border-msx-border rounded px-1 py-1 text-msx-textprimary"
              >
                {(Object.keys(EXTEND_TARGET_LABELS) as ExtendTarget[]).map(target => (
                  <option key={target} value={target}>{EXTEND_TARGET_LABELS[target]}</option>
                ))}
              </select>
            </label>
            <Button
              onClick={handleExtendFromCurrentChar}
              variant="secondary"
              size="sm"
              title={`Apply ${selectedChar === ' ' ? 'Space' : selectedChar} colors to the selected character group masks`}
            >
              Apply Colors
            </Button>
          </div>
          {showAsm && (
            <textarea
              readOnly
              value={asmCode}
              className="mt-4 w-full max-w-3xl h-48 bg-msx-panelbg border border-msx-border rounded p-2 text-xs font-mono text-msx-textprimary"
            />
          )}
        </div>

        <div className="w-72 p-2 border-l border-msx-border flex-shrink-0 flex flex-col items-center space-y-3 overflow-y-auto">
          <h4 className="text-sm pixel-font text-msx-highlight">Character Preview</h4>
          <SingleCharPreview
            pattern={currentPattern}
            bitmapPattern={currentBitmapPattern}
            scale={8}
            colorByte={colorByte}
            vdpMode={vdpMode}
            paletteSlots={paletteSlots}
          />

          <div className={`w-full ${vdpMode === 'SCREEN4' ? '' : 'opacity-60'}`}>
            <h5 className="text-xs pixel-font text-msx-cyan mb-1 text-center">SCREEN 4 Color Byte</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                <span>FG</span>
                <input disabled={vdpMode !== 'SCREEN4'} type="number" min={0} max={15} value={fg} onChange={(event) => updateColorByte(Number(event.target.value), bg)} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>BG</span>
                <input disabled={vdpMode !== 'SCREEN4'} type="number" min={0} max={15} value={bg} onChange={(event) => updateColorByte(fg, Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50" />
              </label>
            </div>
            <div className="mt-2 text-center text-xs text-msx-textsecondary">byte {formatByte(colorByte, dataOutputFormat)}</div>
          </div>

          <div className="w-full border-t border-msx-border pt-3">
            <h5 className="text-xs pixel-font text-msx-cyan mb-2 text-center">SCREEN 5 Palette</h5>
            <select
              value={font.paletteAssetId || ''}
              onChange={event => onUpdate({ paletteAssetId: event.target.value || undefined })}
              className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-1 text-xs text-msx-textprimary"
            >
              <option value="">Default SCREEN 5 palette</option>
              {paletteAssets
                .filter(asset => {
                  const palette = asset.data as PaletteAsset | undefined;
                  return palette?.mode === 'SCREEN5' || palette?.mode === 'SCREEN4';
                })
                .map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
            <div className="grid grid-cols-8 gap-1 mt-2">
              {paletteSlots.map((slot, index) => (
                <button
                  key={slot.slotIndex}
                  type="button"
                  disabled={vdpMode !== 'SCREEN5'}
                  onClick={() => setSelectedScreen5Color(index)}
                  title={`Slot ${index}`}
                  className={`h-6 border ${selectedScreen5Color === index ? 'border-white' : 'border-msx-border'} disabled:opacity-50`}
                  style={{ backgroundColor: paletteHex(paletteSlots, index) }}
                />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                <span>Paint</span>
                <select
                  disabled={vdpMode !== 'SCREEN5'}
                  value={selectedScreen5Color}
                  onChange={event => setSelectedScreen5Color(clampPaletteSlot(event.target.value, selectedScreen5Color))}
                  className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50"
                >
                  {paletteSlots.map((_slot, slotIndex) => <option key={slotIndex} value={slotIndex}>{slotIndex}</option>)}
                </select>
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>BG</span>
                <select
                  disabled={vdpMode !== 'SCREEN5'}
                  value={screen5BackgroundSlot}
                  onChange={event => onUpdate({ screen5BackgroundSlot: clampPaletteSlot(event.target.value, bg) })}
                  className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50"
                >
                  {paletteSlots.map((_slot, slotIndex) => <option key={slotIndex} value={slotIndex}>{slotIndex}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="w-full border-t border-msx-border pt-3">
            <h5 className="text-xs pixel-font text-msx-cyan mb-2 text-center">SCREEN 5 Gradient</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                <span>Angle</span>
                <select
                  disabled={vdpMode !== 'SCREEN5'}
                  value={gradientAngle}
                  onChange={event => setGradientAngle(Number(event.target.value))}
                  className="w-20 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50"
                >
                  {GRADIENT_ANGLES.map(angle => <option key={angle} value={angle}>{angle} deg</option>)}
                </select>
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Colors</span>
                <input
                  disabled={vdpMode !== 'SCREEN5'}
                  type="number"
                  min={2}
                  max={8}
                  value={gradientStopCount}
                  onChange={event => setGradientStopCount(Math.max(2, Math.min(8, Number(event.target.value) || 2)))}
                  className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
              {gradientStops.slice(0, gradientStopCount).map((slot, index) => (
                <label key={`gradient-stop-${index}`} className="flex items-center gap-1">
                  <span className="w-4 h-4 border border-msx-border" style={{ backgroundColor: paletteHex(paletteSlots, slot) }} />
                  <span>{index + 1}</span>
                  <select
                    disabled={vdpMode !== 'SCREEN5'}
                    value={slot}
                    onChange={event => updateGradientStop(index, Number(event.target.value))}
                    className="min-w-0 flex-1 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 disabled:opacity-50"
                  >
                    {paletteSlots.map((_slot, slotIndex) => <option key={slotIndex} value={slotIndex}>{slotIndex}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <Button
              onClick={applyGradientToCurrentChar}
              disabled={vdpMode !== 'SCREEN5'}
              variant="secondary"
              size="sm"
              className="w-full mt-2"
            >
              Apply Gradient
            </Button>
          </div>

          <div className="w-full border-t border-msx-border pt-3">
            <h5 className="text-xs pixel-font text-msx-cyan mb-2 text-center">TTF Rasterizer</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                <span>Size</span>
                <input type="number" min={5} max={16} value={rasterFontSize} onChange={(event) => setRasterFontSize(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Thresh</span>
                <input type="number" min={1} max={255} value={rasterThreshold} onChange={(event) => setRasterThreshold(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>X</span>
                <input type="number" min={-8} max={8} value={rasterOffsetX} onChange={(event) => setRasterOffsetX(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Y</span>
                <input type="number" min={-8} max={8} value={rasterOffsetY} onChange={(event) => setRasterOffsetY(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
            </div>
            {importStatus && <p className="mt-2 text-[0.65rem] text-msx-textsecondary">{importStatus}</p>}
          </div>

          <h4 className="text-sm pixel-font text-msx-highlight mt-2">Text String Preview</h4>
          <input
            type="text"
            value={previewText}
            onChange={(event) => setPreviewText(event.target.value.toUpperCase())}
            className="w-full p-1.5 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            placeholder="Type to preview..."
            maxLength={20}
          />
          <div className="p-1 border border-msx-border rounded min-h-[32px] w-full flex flex-wrap gap-px justify-center bg-black">
            {renderPreviewGlyphs()}
          </div>
          {font.notes && <p className="text-[0.65rem] text-msx-textsecondary">{font.notes}</p>}
        </div>
      </div>
    </Panel>
  );
};
