import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FacingDirection, Msx2Sprite, Msx2SpriteFrame, Msx2SuperSpriteLayout, Msx2SuperSpritePart, MSXColorValue, PaletteAsset, PixelData, Point, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { addEntryToMsx2SpriteLibrary } from '../../utils/msx2SpriteLibrary';
import { Msx2ExternalSpriteImportModal } from '../modals/Msx2ExternalSpriteImportModal';
import { Msx2ExternalSpriteImportOptions, Msx2ExternalSpriteImportResult } from '../../utils/msx2ExternalSpriteImport';
import { mirrorPixelDataHorizontally, mirrorPixelDataVertically } from '../utils/spriteUtils';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CopyIcon,
  DocumentDuplicateIcon,
  EraserIcon,
  FolderOpenIcon,
  PasteIcon,
  PencilIcon,
  PlayIcon,
  PlusCircleIcon,
  RotateCcwIcon,
  SaveIcon,
  SphereIcon,
  StopIcon,
  SwapHorizIcon,
  TrashIcon,
} from '../icons/MsxIcons';

type Msx2SpriteToolMode = 'draw' | 'erase' | 'sphere';
type TransformAction = 'shiftUp' | 'shiftDown' | 'shiftLeft' | 'shiftRight' | 'rotate' | 'flipHorizontal' | 'flipVertical';

interface Msx2SpriteEditorProps {
  sprite: Msx2Sprite;
  onUpdate: (data: Partial<Msx2Sprite>) => void;
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
  onSyncPaletteSlots?: (slots: Screen5PaletteSlot[]) => void;
  onSavePaletteAsset?: (result: Msx2ExternalSpriteImportResult, options: Msx2ExternalSpriteImportOptions) => void;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const clonePixels = (data: PixelData): PixelData => data.map(row => [...row]);

const createPixels = (width: number, height: number, color: MSXColorValue): PixelData =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => color));

interface MetaSpritePreset {
  id: Exclude<Msx2SuperSpriteLayout, 'custom'>;
  label: string;
  size: { width: number; height: number };
  parts: Msx2SuperSpritePart[];
}

const MSX2_METASPRITE_PRESETS: MetaSpritePreset[] = [
  {
    id: 'single16',
    label: '1x1',
    size: { width: 16, height: 16 },
    parts: [{ id: 'part_a', label: 'A', offsetX: 0, offsetY: 0, width: 16, height: 16 }],
  },
  {
    id: 'stackVertical',
    label: '1x2',
    size: { width: 16, height: 32 },
    parts: [
      { id: 'part_a', label: 'A', offsetX: 0, offsetY: 0, width: 16, height: 16 },
      { id: 'part_b', label: 'B', offsetX: 0, offsetY: 16, width: 16, height: 16 },
    ],
  },
  {
    id: 'stackHorizontal',
    label: '2x1',
    size: { width: 32, height: 16 },
    parts: [
      { id: 'part_a', label: 'A', offsetX: 0, offsetY: 0, width: 16, height: 16 },
      { id: 'part_b', label: 'B', offsetX: 16, offsetY: 0, width: 16, height: 16 },
    ],
  },
  {
    id: 'block2x2',
    label: '2x2',
    size: { width: 32, height: 32 },
    parts: [
      { id: 'part_a', label: 'A', offsetX: 0, offsetY: 0, width: 16, height: 16 },
      { id: 'part_b', label: 'B', offsetX: 16, offsetY: 0, width: 16, height: 16 },
      { id: 'part_c', label: 'C', offsetX: 0, offsetY: 16, width: 16, height: 16 },
      { id: 'part_d', label: 'D', offsetX: 16, offsetY: 16, width: 16, height: 16 },
    ],
  },
];

const inferMetaSpriteLayout = (width: number, height: number): Msx2SuperSpriteLayout => {
  const preset = MSX2_METASPRITE_PRESETS.find(candidate => candidate.size.width === width && candidate.size.height === height);
  return preset?.id || 'custom';
};

const buildMetaSpriteParts = (layout: Msx2SuperSpriteLayout, width: number, height: number): Msx2SuperSpritePart[] => {
  const preset = MSX2_METASPRITE_PRESETS.find(candidate => candidate.id === layout);
  if (preset) return preset.parts.map(part => ({ ...part }));
  const columns = Math.max(1, Math.ceil(width / 16));
  const rows = Math.max(1, Math.ceil(height / 16));
  return Array.from({ length: rows }, (_rowUnused, row) =>
    Array.from({ length: columns }, (_columnUnused, column) => ({
      id: `part_${column}_${row}`,
      label: `${String.fromCharCode(65 + row * columns + column)}`,
      offsetX: column * 16,
      offsetY: row * 16,
      width: 16 as const,
      height: 16 as const,
    }))
  ).flat();
};

const resizePixels = (
  data: PixelData,
  width: number,
  height: number,
  nextWidth: number,
  nextHeight: number,
  backgroundColor: MSXColorValue
): PixelData => Array.from({ length: nextHeight }, (_, y) =>
  Array.from({ length: nextWidth }, (_, x) => (x < width && y < height ? data[y]?.[x] || backgroundColor : backgroundColor))
);

const resizeFramesForMetaSprite = (
  frames: Msx2SpriteFrame[],
  width: number,
  height: number,
  nextWidth: number,
  nextHeight: number,
  backgroundColor: MSXColorValue
): Msx2SpriteFrame[] => {
  const sourceFrames = frames.length ? frames : [{ id: `frame_${Date.now()}`, data: createPixels(width, height, backgroundColor) }];
  return sourceFrames.map(frame => ({
    ...frame,
    data: resizePixels(frame.data, width, height, nextWidth, nextHeight, backgroundColor),
  }));
};

const normalizeFrame = (sprite: Msx2Sprite): PixelData => {
  const frame = sprite.frames[sprite.currentFrameIndex] || sprite.frames[0];
  if (frame?.data?.length) return frame.data;
  return createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor);
};

const normalizeColor = (value: string): string => value.trim().toUpperCase();

const parseHexRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

const nearestPaletteColor = (
  r: number,
  g: number,
  b: number,
  palette: { hex: string }[],
  backgroundColor: MSXColorValue
): MSXColorValue => {
  let best = backgroundColor;
  let bestDistance = Infinity;
  palette.forEach(slot => {
    if (slot.hex === TRANSPARENT_HEX) return;
    const rgb = parseHexRgb(slot.hex);
    if (!rgb) return;
    const distance = ((rgb.r - r) ** 2) + ((rgb.g - g) ** 2) + ((rgb.b - b) ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = slot.hex as MSXColorValue;
    }
  });
  return best;
};

const visibleRowColors = (row: MSXColorValue[] | undefined, backgroundColor: MSXColorValue): string[] => {
  const bg = normalizeColor(backgroundColor);
  const colors = new Set<string>();
  (row || []).forEach(color => {
    const normalized = normalizeColor(String(color || ''));
    if (!normalized || normalized === bg || normalized === normalizeColor(TRANSPARENT_HEX)) return;
    colors.add(normalized);
  });
  return Array.from(colors);
};

const paletteSlotForColor = (color: string, palette: { slotIndex: number; hex: string }[]): number | undefined =>
  palette.find(slot => normalizeColor(slot.hex) === normalizeColor(color))?.slotIndex;

const paletteSlotForSpritePixel = (color: string, palette: { slotIndex: number; hex: string }[]): number | undefined => {
  const normalized = normalizeColor(color);
  if (!normalized) return undefined;
  if (normalized === normalizeColor(TRANSPARENT_HEX)) return 0;
  return paletteSlotForColor(normalized, palette);
};

interface HardwareOrColorPair {
  base: number;
  overlay: number;
  result: number;
}

interface HardwareOrColorPalettePair extends HardwareOrColorPair {
  baseHex: string;
  overlayHex: string;
  resultHex: string;
}

interface SeparatedHardwareLayerPreview {
  index: number;
  cellX: number;
  cellY: number;
  xOffset: number;
  yOffset: number;
  usesOrColor: boolean;
  slots: number[];
  forcedByRows: string[];
  pixels: PixelData;
}

const findHardwareOrColorPair = (slots: number[]): HardwareOrColorPair | undefined => {
  const counts = new Map<number, number>();
  slots.forEach(slot => counts.set(slot, (counts.get(slot) || 0) + 1));
  const uniqueSlots = Array.from(counts.keys()).sort((a, b) => a - b);
  let best: { pair: HardwareOrColorPair; score: number } | undefined;
  uniqueSlots.forEach(base => {
    uniqueSlots.forEach(overlay => {
      if (base === overlay) return;
      const result = base | overlay;
      if (result === base || result === overlay || !uniqueSlots.includes(result)) return;
      const score = ((counts.get(result) || 0) * 4) + (counts.get(base) || 0) + (counts.get(overlay) || 0);
      if (!best || score > best.score || (score === best.score && result < best.pair.result)) {
        best = { pair: { base, overlay, result }, score };
      }
    });
  });
  return best?.pair;
};

const hardwareRowLayerCount = (slots: number[], useOrColor: boolean): { layerCount: number; usesOrColor: boolean } => {
  const uniqueSlots = Array.from(new Set(slots)).filter(slot => slot > 0);
  const orPair = useOrColor ? findHardwareOrColorPair(slots) : undefined;
  if (!orPair) return { layerCount: uniqueSlots.length, usesOrColor: false };
  const remaining = uniqueSlots.filter(slot => slot !== orPair.base && slot !== orPair.overlay && slot !== orPair.result);
  return { layerCount: 2 + remaining.length, usesOrColor: true };
};

const buildSeparatedHardwareLayerPreviews = (
  frame: PixelData,
  width: number,
  height: number,
  palette: { slotIndex: number; hex: string }[],
  backgroundColor: MSXColorValue,
  useOrColor: boolean
): SeparatedHardwareLayerPreview[] => {
  const slotByIndex = new Map(palette.map(slot => [slot.slotIndex, slot.hex as MSXColorValue]));
  const bg = normalizeColor(backgroundColor);
  const cellColumns = Math.max(1, Math.ceil(width / 16));
  const cellRows = Math.max(1, Math.ceil(height / 16));
  const previews: SeparatedHardwareLayerPreview[] = [];
  for (let cellY = 0; cellY < cellRows; cellY++) {
    for (let cellX = 0; cellX < cellColumns; cellX++) {
      const xOffset = cellX * 16;
      const yOffset = cellY * 16;
      const layers: SeparatedHardwareLayerPreview[] = [];
      const ensureLayer = (index: number): SeparatedHardwareLayerPreview => {
        if (!layers[index]) {
          layers[index] = {
            index,
            cellX,
            cellY,
            xOffset,
            yOffset,
            usesOrColor: false,
            slots: [],
            forcedByRows: [],
            pixels: createPixels(16, 16, backgroundColor),
          };
        }
        return layers[index];
      };
      for (let y = 0; y < 16; y++) {
        const sourceY = yOffset + y;
        const rowSlots = Array.from({ length: 16 }, (_unused, x) => {
          const sourceX = xOffset + x;
          if (sourceX >= width || sourceY >= height) return 0;
          const color = String(frame[sourceY]?.[sourceX] || '');
          const normalized = normalizeColor(color);
          if (!normalized || normalized === bg || normalized === normalizeColor(TRANSPARENT_HEX)) return 0;
          return paletteSlotForColor(normalized, palette) || 0;
        });
        const uniqueSlots = Array.from(new Set(rowSlots)).filter(slot => slot > 0).sort((a, b) => a - b);
        const orPair = useOrColor ? findHardwareOrColorPair(rowSlots) : undefined;
        const handled = new Set<number>();
        if (orPair) {
          const baseLayer = ensureLayer(0);
          const overlayLayer = ensureLayer(1);
          overlayLayer.usesOrColor = true;
          [orPair.base, orPair.overlay, orPair.result].forEach(slot => handled.add(slot));
          if (!baseLayer.slots.includes(orPair.base)) baseLayer.slots.push(orPair.base);
          if (!overlayLayer.slots.includes(orPair.overlay)) overlayLayer.slots.push(orPair.overlay);
          rowSlots.forEach((slot, x) => {
            if (slot === orPair.base || slot === orPair.result) baseLayer.pixels[y][x] = slotByIndex.get(orPair.base) || backgroundColor;
            if (slot === orPair.overlay || slot === orPair.result) overlayLayer.pixels[y][x] = slotByIndex.get(orPair.overlay) || backgroundColor;
          });
        }
        uniqueSlots.filter(slot => !handled.has(slot)).forEach((slot, layerOffset) => {
          const layer = ensureLayer((orPair ? 2 : 0) + layerOffset);
          if (!layer.slots.includes(slot)) layer.slots.push(slot);
          const reason = `local y${y} slot ${slot}${orPair ? ` outside ${orPair.base}|${orPair.overlay}=${orPair.result}` : ''}`;
          if (!layer.forcedByRows.includes(reason)) layer.forcedByRows.push(reason);
          rowSlots.forEach((rowSlot, x) => {
            if (rowSlot === slot) layer.pixels[y][x] = slotByIndex.get(slot) || backgroundColor;
          });
        });
      }
      previews.push(...layers.filter(Boolean));
    }
  }
  return previews.map(layer => ({
    ...layer,
    slots: layer.slots.sort((a, b) => a - b),
    forcedByRows: layer.forcedByRows.slice(0, 8),
  }));
};

const LayerPreviewGrid: React.FC<{
  pixels: PixelData;
  width: number;
  height: number;
  backgroundColor: MSXColorValue;
  zoom: number;
}> = ({ pixels, width, height, backgroundColor, zoom }) => (
  <div
    className="grid border border-msx-border bg-black"
    style={{
      width: width * zoom,
      height: height * zoom,
      gridTemplateColumns: `repeat(${width}, ${zoom}px)`,
      gridTemplateRows: `repeat(${height}, ${zoom}px)`,
      imageRendering: 'pixelated',
    }}
  >
    {pixels.map((row, y) => row.map((color, x) => (
      <div
        key={`${x}-${y}`}
        style={{
          width: zoom,
          height: zoom,
          backgroundColor: color === backgroundColor || normalizeColor(String(color)) === normalizeColor(TRANSPARENT_HEX) ? 'transparent' : color,
        }}
      />
    )))}
  </div>
);

const toAsmBytes = (sprite: Msx2Sprite): string => {
  const frame = normalizeFrame(sprite);
  const bytes: number[] = [];
  const bg = normalizeColor(sprite.backgroundColor);
  const byteFor = (x0: number, y: number) => {
    let value = 0;
    for (let bit = 0; bit < 8; bit++) {
      const color = normalizeColor(String(frame[y]?.[x0 + bit] || ''));
      if (color && color !== bg) value |= 0x80 >> bit;
    }
    return value;
  };
  for (let y = 0; y < 8; y++) bytes.push(byteFor(0, y));
  for (let y = 0; y < 8; y++) bytes.push(byteFor(8, y));
  for (let y = 8; y < 16; y++) bytes.push(byteFor(0, y));
  for (let y = 8; y < 16; y++) bytes.push(byteFor(8, y));
  return bytes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',');
};

const Msx2PixelGrid: React.FC<{
  frame: PixelData;
  width: number;
  height: number;
  zoom: number;
  backgroundColor: MSXColorValue;
  onPixel: (point: Point, isRightClick: boolean) => void;
  onionSkinEnabled: boolean;
  onionSkinOpacity: number;
  prevFrame?: PixelData;
  nextFrame?: PixelData;
  metaSpriteParts?: Msx2SuperSpritePart[];
}> = ({
  frame,
  width,
  height,
  zoom,
  backgroundColor,
  onPixel,
  onionSkinEnabled,
  onionSkinOpacity,
  prevFrame,
  nextFrame,
  metaSpriteParts = [],
}) => {
  const [dragState, setDragState] = useState<{ active: boolean; right: boolean }>({ active: false, right: false });

  useEffect(() => {
    const stopDrag = () => setDragState({ active: false, right: false });
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, []);

  const renderOnion = (data: PixelData | undefined, keyPrefix: string) => {
    if (!onionSkinEnabled || !data) return null;
    return (
      <div
        className="absolute inset-0 grid pointer-events-none"
        style={{
          gridTemplateColumns: `repeat(${width}, ${zoom}px)`,
          gridTemplateRows: `repeat(${height}, ${zoom}px)`,
          opacity: onionSkinOpacity,
        }}
      >
        {data.map((row, y) => row.map((color, x) => (
          <div
            key={`${keyPrefix}-${x}-${y}`}
            style={{ width: zoom, height: zoom, backgroundColor: color === backgroundColor ? 'transparent' : color }}
          />
        )))}
      </div>
    );
  };

  return (
    <div
      className="relative border border-msx-border bg-black"
      style={{ width: width * zoom, height: height * zoom, imageRendering: 'pixelated' }}
      onContextMenu={event => event.preventDefault()}
      onMouseLeave={() => setDragState({ active: false, right: false })}
    >
      {renderOnion(prevFrame, 'prev')}
      {renderOnion(nextFrame, 'next')}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${width}, ${zoom}px)`,
          gridTemplateRows: `repeat(${height}, ${zoom}px)`,
        }}
      >
        {frame.map((row, y) => row.map((color, x) => (
          <button
            key={`${x}-${y}`}
            type="button"
            className="border-0 p-0"
            style={{
              width: zoom,
              height: zoom,
              backgroundColor: color === backgroundColor ? 'transparent' : color,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
            onMouseDown={event => {
              const right = event.button === 2;
              setDragState({ active: true, right });
              onPixel({ x, y }, right);
            }}
            onMouseEnter={() => {
              if (dragState.active) onPixel({ x, y }, dragState.right);
            }}
            title={`${x},${y}`}
          />
        )))}
      </div>
      {metaSpriteParts.map(part => (
        <div
          key={part.id}
          className="absolute border border-msx-highlight/70 pointer-events-none"
          style={{
            left: part.offsetX * zoom,
            top: part.offsetY * zoom,
            width: part.width * zoom,
            height: part.height * zoom,
          }}
        >
          <span className="absolute left-0 top-0 bg-msx-highlight px-1 text-[10px] leading-tight text-msx-bgcolor">
            {part.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export const Msx2SpriteEditor: React.FC<Msx2SpriteEditorProps> = ({ sprite, onUpdate, paletteAssets = [], onSyncPaletteSlots, onSavePaletteAsset }) => {
  const { slots: palette, changed: paletteChanged } = useMemo(() => ensureScreen5PaletteSlots(sprite.palette), [sprite.palette]);
  const frame = normalizeFrame(sprite);
  const prevFrame = sprite.frames[sprite.currentFrameIndex - 1]?.data;
  const nextFrame = sprite.frames[sprite.currentFrameIndex + 1]?.data;
  const [selectedColor, setSelectedColor] = useState<MSXColorValue>(palette[5]?.hex || palette[1]?.hex || '#FFFFFF');
  const [zoom, setZoom] = useState(18);
  const [toolMode, setToolMode] = useState<Msx2SpriteToolMode>('draw');
  const [sphereRadius, setSphereRadius] = useState(4);
  const [copiedFrameData, setCopiedFrameData] = useState<PixelData | null>(null);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [previewFrameIndex, setPreviewFrameIndex] = useState(sprite.currentFrameIndex || 0);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(true);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);
  const [showSeparatedLayers, setShowSeparatedLayers] = useState(false);
  const [isExternalImportOpen, setIsExternalImportOpen] = useState(false);
  const [replaceFromSlot, setReplaceFromSlot] = useState(1);
  const [replaceToSlot, setReplaceToSlot] = useState(0);
  const importFileRef = useRef<HTMLInputElement>(null);

  const animationSpeedMs = sprite.animationSpeedMs || 150;
  const useOrColor = sprite.hardware?.useOrColor !== false;
  const orPalettePairs = useMemo<HardwareOrColorPalettePair[]>(() => {
    const slotByIndex = new Map(palette.map(slot => [slot.slotIndex, slot]));
    const pairs: HardwareOrColorPalettePair[] = [];
    for (let base = 1; base < 16; base++) {
      for (let overlay = base + 1; overlay < 16; overlay++) {
        const result = base | overlay;
        if (result === base || result === overlay || result > 15) continue;
        const baseSlot = slotByIndex.get(base);
        const overlaySlot = slotByIndex.get(overlay);
        const resultSlot = slotByIndex.get(result);
        if (!baseSlot || !overlaySlot || !resultSlot) continue;
        pairs.push({
          base,
          overlay,
          result,
          baseHex: baseSlot.hex,
          overlayHex: overlaySlot.hex,
          resultHex: resultSlot.hex,
        });
      }
    }
    return pairs;
  }, [palette]);
  const cellColumns = Math.max(1, Math.ceil(sprite.size.width / 16));
  const cellRows = Math.max(1, Math.ceil(sprite.size.height / 16));
  const inferredSuperSpriteLayout = inferMetaSpriteLayout(sprite.size.width, sprite.size.height);
  const superSpriteLayout = sprite.superSpriteLayout || inferredSuperSpriteLayout;
  const superSpriteParts = useMemo(
    () => (sprite.superSpriteParts?.length
      ? sprite.superSpriteParts.map(part => ({ ...part }))
      : buildMetaSpriteParts(superSpriteLayout, sprite.size.width, sprite.size.height)),
    [sprite.size.height, sprite.size.width, sprite.superSpriteParts, superSpriteLayout]
  );
  const superSpriteBaseParts = superSpriteParts.length;
  const rowDiagnostics = useMemo(() => {
    return Array.from({ length: sprite.size.height }, (_, y) =>
      Array.from({ length: cellColumns }, (_, cellX) => {
        const xOffset = cellX * 16;
        const rowSlice = frame[y]?.slice(xOffset, xOffset + 16) || [];
        const colors = visibleRowColors(rowSlice, sprite.backgroundColor);
        const bg = normalizeColor(sprite.backgroundColor);
        const slots = rowSlice
          .map(color => {
            const normalized = normalizeColor(String(color || ''));
            if (!normalized || normalized === bg || normalized === normalizeColor(TRANSPARENT_HEX)) return undefined;
            return paletteSlotForColor(normalized, palette);
          })
          .filter((slot): slot is number => typeof slot === 'number' && slot > 0);
        const { layerCount, usesOrColor } = hardwareRowLayerCount(slots, useOrColor);
        return {
          y,
          cellX,
          colors,
          slots: Array.from(new Set(slots)).sort((a, b) => a - b),
          layerCount,
          usesOrColor,
          invalid: layerCount > 8,
        };
      })
    ).flat();
  }, [cellColumns, frame, palette, sprite.backgroundColor, sprite.size.height, useOrColor]);
  const spritePaletteUsage = useMemo(() => {
    const usedSlots = new Set<number>();
    const orBaseSlots = new Set<number>();
    const orOverlaySlots = new Set<number>();
    const orResultSlots = new Set<number>();

    sprite.frames.forEach(spriteFrame => {
      const data = spriteFrame.data || [];
      data.forEach(row => {
        row.forEach(color => {
          const slot = paletteSlotForSpritePixel(String(color || ''), palette);
          if (typeof slot === 'number') usedSlots.add(slot);
        });
      });

      for (let y = 0; y < sprite.size.height; y++) {
        for (let cellX = 0; cellX < cellColumns; cellX++) {
          const xOffset = cellX * 16;
          const row = data[y] || [];
          const rowSlots = row.slice(xOffset, xOffset + 16)
            .map(color => {
              return paletteSlotForSpritePixel(String(color || ''), palette) || 0;
            })
            .filter(slot => slot > 0);
          const orPair = useOrColor ? findHardwareOrColorPair(rowSlots) : undefined;
          if (!orPair) continue;
          orBaseSlots.add(orPair.base);
          orOverlaySlots.add(orPair.overlay);
          orResultSlots.add(orPair.result);
        }
      }
    });

    return { usedSlots, orBaseSlots, orOverlaySlots, orResultSlots };
  }, [cellColumns, palette, sprite.frames, sprite.size.height, useOrColor]);
  const invalidLineCount = rowDiagnostics.filter(row => row.invalid).length;
  const orColorLineCount = rowDiagnostics.filter(row => row.usesOrColor).length;
  const stackedColorLineCount = rowDiagnostics.filter(row => row.layerCount > 1).length;
  const threeColorLineCount = rowDiagnostics.filter(row => row.slots.length >= 3 || row.layerCount >= 3).length;
  const maxCellLayerCount = Math.max(0, ...rowDiagnostics.map(row => row.layerCount));
  const maxSpritesPerScanline = Math.max(
    1,
    ...Array.from({ length: sprite.size.height }, (_, y) =>
      rowDiagnostics.filter(row => row.y === y).reduce((sum, row) => sum + row.layerCount, 0)
    )
  );
  const scanlineOverflow = maxSpritesPerScanline > 8;
  const separatedHardwareLayers = useMemo(
    () => buildSeparatedHardwareLayerPreviews(frame, sprite.size.width, sprite.size.height, palette, sprite.backgroundColor, useOrColor),
    [frame, palette, sprite.backgroundColor, sprite.size.height, sprite.size.width, useOrColor]
  );
  const partLabelByOffset = useMemo(() => {
    const labels = new Map<string, string>();
    superSpriteParts.forEach(part => labels.set(`${part.offsetX},${part.offsetY}`, part.label));
    return labels;
  }, [superSpriteParts]);
  const estimatedHardwareSprites = Array.from({ length: cellRows }, (_, cellY) =>
    Array.from({ length: cellColumns }, (_, cellX) => {
      const firstY = cellY * 16;
      const lastY = Math.min(sprite.size.height, firstY + 16);
      return Math.max(
        0,
        ...rowDiagnostics
          .filter(row => row.cellX === cellX && row.y >= firstY && row.y < lastY)
          .map(row => row.layerCount)
      );
    }).reduce((sum, value) => sum + value, 0)
  ).reduce((sum, value) => sum + value, 0);
  const spriteExportContract = useMemo(() => {
    const cellLayerCounts = Array.from({ length: cellRows }, (_, cellY) =>
      Array.from({ length: cellColumns }, (_, cellX) => {
        const firstY = cellY * 16;
        const lastY = Math.min(sprite.size.height, firstY + 16);
        const rows = rowDiagnostics.filter(row => row.cellX === cellX && row.y >= firstY && row.y < lastY);
        return {
          cell: [cellX, cellY],
          xOffset: cellX * 16,
          yOffset: cellY * 16,
          hardwareLayers: Math.max(0, ...rows.map(row => row.layerCount)),
          stackedRows: rows.filter(row => row.layerCount > 1).length,
          threeColorRows: rows.filter(row => row.slots.length >= 3 || row.layerCount >= 3).length,
          usesOrColor: rows.some(row => row.usesOrColor),
        };
      })
    ).flat();
    return {
      sprite: {
        mode: 'MSX2_SCREEN4_HARDWARE_SPRITE',
        frame: sprite.currentFrameIndex || 0,
        size: [sprite.size.width, sprite.size.height],
        superSpriteLayout,
        superSpriteParts: superSpriteParts.map(part => ({
          label: part.label,
          offset: [part.offsetX, part.offsetY],
          size: [part.width, part.height],
        })),
        baseHardwareCells: superSpriteBaseParts,
        metaspriteCells: [cellColumns, cellRows],
        hardwareLayers: estimatedHardwareSprites,
        separatedLayerPreviewCount: separatedHardwareLayers.length,
        separatedLayerReasons: separatedHardwareLayers.map(layer => ({
          layer: layer.index + 1,
          cell: [layer.cellX, layer.cellY],
          offset: [layer.xOffset, layer.yOffset],
          slots: layer.slots,
          forcedByRows: layer.forcedByRows,
        })),
        maxCellLayers: maxCellLayerCount,
        worstScanlineSprites: maxSpritesPerScanline,
        scanlineLimit: 8,
        overflow: scanlineOverflow,
        colorTable: 'line_color_per_sprite_plane',
        transparentBit: 'pattern_bit_0_is_transparent',
        overlapTechnique: 'transparent_masks_plus_v9938_cc_or_color',
        orColorRule: 'base_palette_slot | overlay_palette_slot = visible_overlap_color',
        orCompatiblePairs: orPalettePairs.map(pair => [pair.base, pair.overlay, pair.result]),
        orColorRows: orColorLineCount,
        cells: cellLayerCounts,
      },
    };
  }, [
    cellColumns,
    cellRows,
    estimatedHardwareSprites,
    maxCellLayerCount,
    maxSpritesPerScanline,
    orColorLineCount,
    orPalettePairs,
    rowDiagnostics,
    scanlineOverflow,
    separatedHardwareLayers,
    sprite.currentFrameIndex,
    sprite.size.height,
    sprite.size.width,
    superSpriteBaseParts,
    superSpriteLayout,
    superSpriteParts,
  ]);

  useEffect(() => {
    if (paletteChanged) {
      onUpdate({ palette: palette.map(slot => ({ ...slot })) });
    }
  }, [paletteChanged, palette, onUpdate]);

  useEffect(() => {
    if (!palette.some(slot => slot.hex === selectedColor)) {
      setSelectedColor(palette[1]?.hex || palette[0]?.hex || '#FFFFFF');
    }
  }, [palette, selectedColor]);

  useEffect(() => {
    if (!isAnimationPlaying) {
      setPreviewFrameIndex(sprite.currentFrameIndex || 0);
      return;
    }
    const timer = window.setInterval(() => {
      setPreviewFrameIndex(index => {
        const next = index + 1;
        if (next >= sprite.frames.length) return sprite.loops === false ? index : 0;
        return next;
      });
    }, animationSpeedMs);
    return () => window.clearInterval(timer);
  }, [isAnimationPlaying, animationSpeedMs, sprite.frames.length, sprite.currentFrameIndex, sprite.loops]);

  const replaceFromPaletteSlot = palette.find(slot => slot.slotIndex === replaceFromSlot) || palette[0];
  const replaceToPaletteSlot = palette.find(slot => slot.slotIndex === replaceToSlot) || palette[0];
  const replaceSourcePixelCount = useMemo(() => {
    if (!replaceFromPaletteSlot) return 0;
    const source = normalizeColor(replaceFromPaletteSlot.hex);
    return sprite.frames.reduce((total, spriteFrame) => {
      const frameData = spriteFrame.data || [];
      return total + frameData.reduce((frameTotal, row) =>
        frameTotal + row.reduce((rowTotal, color) =>
          rowTotal + (normalizeColor(String(color || '')) === source ? 1 : 0), 0), 0);
    }, 0);
  }, [replaceFromPaletteSlot, sprite.frames]);

  const updateFrameData = (data: PixelData) => {
    const frames = sprite.frames.length > 0 ? [...sprite.frames] : [{ id: `frame_${Date.now()}`, data }];
    const frameIndex = Math.max(0, Math.min(sprite.currentFrameIndex || 0, frames.length - 1));
    frames[frameIndex] = { ...(frames[frameIndex] || { id: `frame_${Date.now()}` }), data };
    onUpdate({ frames, currentFrameIndex: frameIndex });
  };

  const paintPixel = (point: Point, color: MSXColorValue) => {
    const next = clonePixels(frame);
    if (!next[point.y]?.[point.x]) return;
    next[point.y][point.x] = color;
    updateFrameData(next);
  };

  const drawSphere = (center: Point, color: MSXColorValue) => {
    const next = clonePixels(frame);
    for (let y = 0; y < sprite.size.height; y++) {
      for (let x = 0; x < sprite.size.width; x++) {
        const distance = Math.sqrt(((x - center.x) ** 2) + ((y - center.y) ** 2));
        if (distance <= sphereRadius) next[y][x] = color;
      }
    }
    updateFrameData(next);
  };

  const replaceSpriteColor = () => {
    if (!replaceFromPaletteSlot || !replaceToPaletteSlot || replaceFromSlot === replaceToSlot) return;
    const source = normalizeColor(replaceFromPaletteSlot.hex);
    const target = replaceToPaletteSlot.hex as MSXColorValue;
    let changed = false;
    const sourceFrames = sprite.frames.length
      ? sprite.frames
      : [{ id: `frame_${Date.now()}`, data: createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor) }];
    const frames = sourceFrames.map(spriteFrame => ({
      ...spriteFrame,
      data: (spriteFrame.data || createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor)).map(row =>
        row.map(color => {
          if (normalizeColor(String(color || '')) !== source) return color;
          changed = true;
          return target;
        })
      ),
    }));
    if (!changed) return;
    onUpdate({
      frames,
      currentFrameIndex: Math.max(0, Math.min(sprite.currentFrameIndex || 0, frames.length - 1)),
    });
  };

  const handlePixel = (point: Point, isRightClick: boolean) => {
    const color = toolMode === 'erase' || isRightClick ? sprite.backgroundColor : selectedColor;
    if (toolMode === 'sphere' && !isRightClick) {
      drawSphere(point, color);
      return;
    }
    paintPixel(point, color);
  };

  const setHardware = (field: keyof Msx2Sprite['hardware'], value: number | boolean) => {
    onUpdate({ hardware: { ...sprite.hardware, [field]: value } });
  };

  const useOrBrushColor = (color: MSXColorValue) => {
    setSelectedColor(color);
    if (!useOrColor) setHardware('useOrColor', true);
    if (toolMode === 'erase') setToolMode('draw');
  };

  const applyMetaSpriteLayout = (layout: Exclude<Msx2SuperSpriteLayout, 'custom'>) => {
    const preset = MSX2_METASPRITE_PRESETS.find(candidate => candidate.id === layout);
    if (!preset) return;
    const nextWidth = preset.size.width;
    const nextHeight = preset.size.height;
    const resizedFrames = resizeFramesForMetaSprite(
      sprite.frames,
      sprite.size.width,
      sprite.size.height,
      nextWidth,
      nextHeight,
      sprite.backgroundColor
    );
    onUpdate({
      size: { width: nextWidth, height: nextHeight },
      frames: resizedFrames,
      currentFrameIndex: Math.min(sprite.currentFrameIndex || 0, resizedFrames.length - 1),
      superSpriteLayout: layout,
      superSpriteParts: preset.parts.map(part => ({ ...part })),
    });
  };

  const handleFrameManagement = (action: 'add' | 'delete' | 'duplicate' | 'prev' | 'next') => {
    let frames = [...sprite.frames];
    let currentFrameIndex = sprite.currentFrameIndex;
    switch (action) {
      case 'add':
        frames.push({ id: `frame_${Date.now()}`, data: createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor) });
        currentFrameIndex = frames.length - 1;
        break;
      case 'duplicate':
        frames.splice(currentFrameIndex + 1, 0, { id: `frame_${Date.now()}`, data: clonePixels(frame) });
        currentFrameIndex += 1;
        break;
      case 'delete':
        if (frames.length <= 1) return;
        frames.splice(currentFrameIndex, 1);
        currentFrameIndex = Math.max(0, currentFrameIndex - 1);
        break;
      case 'prev':
        currentFrameIndex = (currentFrameIndex - 1 + frames.length) % frames.length;
        break;
      case 'next':
        currentFrameIndex = (currentFrameIndex + 1) % frames.length;
        break;
    }
    onUpdate({ frames, currentFrameIndex });
  };

  const clearFrame = () => updateFrameData(createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor));

  const transformFrame = (action: TransformAction) => {
    let next = clonePixels(frame);
    const width = sprite.size.width;
    const height = sprite.size.height;
    switch (action) {
      case 'shiftUp':
        next = [...next.slice(1), Array(width).fill(sprite.backgroundColor)];
        break;
      case 'shiftDown':
        next = [Array(width).fill(sprite.backgroundColor), ...next.slice(0, -1)];
        break;
      case 'shiftLeft':
        next = next.map(row => [...row.slice(1), sprite.backgroundColor]);
        break;
      case 'shiftRight':
        next = next.map(row => [sprite.backgroundColor, ...row.slice(0, -1)]);
        break;
      case 'rotate':
        next = Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => frame[height - 1 - x]?.[y] || sprite.backgroundColor)
        );
        break;
      case 'flipHorizontal':
        next = mirrorPixelDataHorizontally(next);
        break;
      case 'flipVertical':
        next = mirrorPixelDataVertically(next);
        break;
    }
    updateFrameData(next);
  };

  const exportToLibrary = () => {
    const entry = addEntryToMsx2SpriteLibrary(sprite, sprite.name);
    alert(`Exported "${entry.name}" to the global MSX2 Sprites Library.`);
  };

  const exportPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = sprite.size.width * sprite.frames.length;
    canvas.height = sprite.size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    sprite.frames.forEach((spriteFrame, frameIndex) => {
      spriteFrame.data.forEach((row, y) => row.forEach((color, x) => {
        if (color === sprite.backgroundColor || color === TRANSPARENT_HEX) return;
        ctx.fillStyle = color;
        ctx.fillRect((frameIndex * sprite.size.width) + x, y, 1, 1);
      }));
    });
    const link = document.createElement('a');
    link.download = `${sprite.name || 'msx2-sprite'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const importPng = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const frameCount = Math.max(1, Math.floor(image.width / sprite.size.width));
      const frames = Array.from({ length: frameCount }, (_, frameIndex) => {
        const data = createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor);
        for (let y = 0; y < sprite.size.height; y++) {
          for (let x = 0; x < sprite.size.width; x++) {
            const sourceX = (frameIndex * sprite.size.width) + x;
            if (sourceX >= image.width || y >= image.height) continue;
            const offset = ((y * image.width) + sourceX) * 4;
            const alpha = imageData.data[offset + 3];
            data[y][x] = alpha < 128
              ? sprite.backgroundColor
              : nearestPaletteColor(imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2], palette, sprite.backgroundColor);
          }
        }
        return { id: `frame_${Date.now()}_${frameIndex}`, data };
      });
      onUpdate({ frames, currentFrameIndex: 0 });
      if (importFileRef.current) importFileRef.current.value = '';
    };
    image.src = URL.createObjectURL(file);
  };

  const applyExternalSpriteImport = (
    result: Msx2ExternalSpriteImportResult,
    options: Msx2ExternalSpriteImportOptions,
  ) => {
    const nextLayout = inferMetaSpriteLayout(options.targetWidth, options.targetHeight);
    const nextParts = buildMetaSpriteParts(nextLayout, options.targetWidth, options.targetHeight);
    onUpdate({
      size: { width: options.targetWidth, height: options.targetHeight },
      superSpriteLayout: nextLayout,
      superSpriteParts: nextParts,
      palette: result.palette.map(slot => ({ ...slot })),
      backgroundColor: result.backgroundColor,
      frames: [{ id: `external_import_${Date.now()}`, data: result.pixelData }],
      currentFrameIndex: 0,
      hardware: { ...sprite.hardware, useOrColor: options.useOrColor },
    });
    if (options.syncProjectPalette !== false && result.generatedSlots.length > 0) {
      onSyncPaletteSlots?.(result.generatedSlots);
    }
    setIsExternalImportOpen(false);
  };

  const previewFrame = sprite.frames[previewFrameIndex]?.data || frame;
  const mirroredPreviewFrame = useMemo(() => mirrorPixelDataHorizontally(previewFrame), [previewFrame]);
  const facingDirection = sprite.facingDirection ?? 'neutral';
  const hasHorizontalFacing = facingDirection === 'right' || facingDirection === 'left';
  const asmBytes = useMemo(() => toAsmBytes(sprite), [sprite]);
  const isFrameEmpty = frame.every(row => row.every(color => color === sprite.backgroundColor));
  const setAllPanelsCollapsed = (collapsed: boolean) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('mideas:panel-collapse-all', { detail: { collapsed } }));
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-msx-bgcolor overflow-hidden">
      <div className="flex flex-none items-center justify-between border-b border-msx-border px-3 py-2 text-xs">
        <span className="text-msx-textsecondary">MSX2 sprite editor sections</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllPanelsCollapsed(true)}
            aria-label="Collapse all MSX2 sprite editor sections"
          >
            Collapse All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllPanelsCollapsed(false)}
            aria-label="Expand all MSX2 sprite editor sections"
          >
            Expand All
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-grow grid grid-cols-[200px_1fr_360px] gap-2 p-2 overflow-hidden">
      <div className="min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-4">
        <Panel title="Tools" collapsible>
          <div className="p-2 space-y-1">
            <Button onClick={() => setToolMode('draw')} variant={toolMode === 'draw' ? 'primary' : 'ghost'} size="sm" icon={<PencilIcon />} className="w-full" justify="start">Draw</Button>
            <Button onClick={() => setToolMode('sphere')} variant={toolMode === 'sphere' ? 'primary' : 'ghost'} size="sm" icon={<SphereIcon />} className="w-full" justify="start">Sphere</Button>
            <Button onClick={() => setToolMode('erase')} variant={toolMode === 'erase' ? 'primary' : 'ghost'} size="sm" icon={<EraserIcon />} className="w-full" justify="start">Erase (BG)</Button>
            {toolMode === 'sphere' && (
              <label className="block pt-2 text-xs text-msx-textsecondary">Radius
                <input type="range" min={1} max={8} value={sphereRadius} onChange={e => setSphereRadius(Number(e.target.value))} className="w-full accent-msx-accent" />
              </label>
            )}
            <Button onClick={() => setCopiedFrameData(clonePixels(frame))} variant="ghost" size="sm" icon={<CopyIcon />} className="w-full" justify="start">Copy Frame</Button>
            <Button onClick={() => copiedFrameData && updateFrameData(clonePixels(copiedFrameData))} variant="ghost" size="sm" icon={<PasteIcon />} className="w-full" justify="start" disabled={!copiedFrameData}>Paste Frame</Button>
          </div>
        </Panel>

        <Panel title="Active Brush" collapsible>
          <div className="grid grid-cols-2 gap-2 p-2">
            {palette.map(slot => {
              const isTransparentSlot = slot.slotIndex === 0;
              const isUsed = spritePaletteUsage.usedSlots.has(slot.slotIndex);
              const isOrBase = spritePaletteUsage.orBaseSlots.has(slot.slotIndex);
              const isOrOverlay = spritePaletteUsage.orOverlaySlots.has(slot.slotIndex);
              const isOrResult = spritePaletteUsage.orResultSlots.has(slot.slotIndex);
              const usageTitle = [
                isUsed ? (isTransparentSlot ? 'transparent used' : 'used') : '',
                isOrBase ? 'OR base' : '',
                isOrOverlay ? 'OR overlay' : '',
                isOrResult ? 'OR result' : '',
              ].filter(Boolean).join(', ');
              return (
                <button
                  key={slot.slotIndex}
                  type="button"
                  className={`relative h-8 overflow-hidden rounded border ${selectedColor === slot.hex ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'} ${isOrResult ? 'ring-1 ring-amber-300' : ''}`}
                  style={{ backgroundColor: slot.hex === sprite.backgroundColor ? '#111827' : slot.hex }}
                  onClick={() => setSelectedColor(slot.hex)}
                  title={`Slot ${slot.slotIndex}: ${slot.hex}${slot.masterIndex >= 0 ? ` / master ${slot.masterIndex}` : ''}${usageTitle ? ` (${usageTitle})` : ''}`}
                  aria-label={`Slot ${slot.slotIndex}${usageTitle ? ` ${usageTitle}` : ''}`}
                >
                  {isUsed && isTransparentSlot && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1 top-0.5 rounded bg-black/70 px-1 text-[11px] font-bold leading-4 text-msx-highlight shadow"
                    >
                      T
                    </span>
                  )}
                  {isUsed && !isTransparentSlot && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1 top-1 h-2 w-2 rounded-full border border-black/70 bg-msx-highlight shadow"
                    />
                  )}
                  {isOrResult && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 rounded-tr bg-amber-300 px-1 py-0.5 text-[9px] font-bold leading-none text-black"
                    >
                      OR
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Replace Color" collapsible>
          <div className="space-y-2 p-2 text-xs text-msx-textsecondary">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label className="space-y-1">
                <span className="block">From</span>
                <select
                  value={replaceFromSlot}
                  onChange={event => setReplaceFromSlot(Number(event.target.value))}
                  className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                  aria-label="Replace source color slot"
                >
                  {palette.map(slot => (
                    <option key={slot.slotIndex} value={slot.slotIndex}>
                      {`S${slot.slotIndex}${slot.slotIndex === 0 ? ' T' : ''} ${slot.hex}`}
                    </option>
                  ))}
                </select>
              </label>
              <SwapHorizIcon className="mb-1 h-4 w-4 text-msx-highlight" />
              <label className="space-y-1">
                <span className="block">To</span>
                <select
                  value={replaceToSlot}
                  onChange={event => setReplaceToSlot(Number(event.target.value))}
                  className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                  aria-label="Replace target color slot"
                >
                  {palette.map(slot => (
                    <option key={slot.slotIndex} value={slot.slotIndex}>
                      {`S${slot.slotIndex}${slot.slotIndex === 0 ? ' T' : ''} ${slot.hex}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              onClick={replaceSpriteColor}
              variant="secondary"
              size="sm"
              icon={<SwapHorizIcon />}
              className="w-full"
              justify="center"
              disabled={replaceFromSlot === replaceToSlot || replaceSourcePixelCount === 0}
              title={`Replace ${replaceSourcePixelCount} pixels across all frames`}
            >
              Replace Color
            </Button>
            <div className="text-[11px] text-msx-textsecondary">
              {replaceSourcePixelCount} px in all frames
            </div>
          </div>
        </Panel>

        <Panel title="MSX2 Transform Frame" collapsible>
          <div className="grid grid-cols-3 gap-1 p-2">
            <span />
            <Tooltip text="Shift up"><Button onClick={() => transformFrame('shiftUp')} variant="ghost" size="sm" icon={<ArrowUpIcon />}>{null}</Button></Tooltip>
            <span />
            <Tooltip text="Shift left"><Button onClick={() => transformFrame('shiftLeft')} variant="ghost" size="sm" icon={<ArrowLeftIcon />}>{null}</Button></Tooltip>
            <Tooltip text="Rotate"><Button onClick={() => transformFrame('rotate')} variant="ghost" size="sm" icon={<RotateCcwIcon />}>{null}</Button></Tooltip>
            <Tooltip text="Shift right"><Button onClick={() => transformFrame('shiftRight')} variant="ghost" size="sm" icon={<ArrowRightIcon />}>{null}</Button></Tooltip>
            <Button onClick={() => transformFrame('flipHorizontal')} variant="ghost" size="sm">MSX2 Flip H</Button>
            <Tooltip text="Shift down"><Button onClick={() => transformFrame('shiftDown')} variant="ghost" size="sm" icon={<ArrowDownIcon />}>{null}</Button></Tooltip>
            <Button onClick={() => transformFrame('flipVertical')} variant="ghost" size="sm">MSX2 Flip V</Button>
            <Button onClick={clearFrame} variant="danger" size="sm" className="col-span-3" disabled={isFrameEmpty}>MSX2 Clear</Button>
          </div>
        </Panel>
      </div>

      <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <input
              value={sprite.name}
              onChange={event => onUpdate({ name: event.target.value })}
              className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm"
            />
            <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm">
              MSX2 {sprite.size.width} x {sprite.size.height} metasprite
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={<PlusCircleIcon />} onClick={exportToLibrary} title="Export this sprite to the global MSX2 Sprites Library (persists across projects). Reusable via Libraries > Sprites.">Export to Library</Button>
            <Button size="sm" variant="secondary" icon={<SaveIcon />} onClick={exportPng}>MSX2 Export PNG</Button>
            <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} onClick={() => importFileRef.current?.click()}>MSX2 Import PNG</Button>
            <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} onClick={() => setIsExternalImportOpen(true)}>Importar Sprite Exterior</Button>
            <Button size="sm" variant={showSeparatedLayers ? 'primary' : 'secondary'} onClick={() => setShowSeparatedLayers(value => !value)}>
              {showSeparatedLayers ? 'Hide HW Layers' : 'Separate HW Layers'}
            </Button>
            <input type="file" accept="image/png" ref={importFileRef} onChange={importPng} className="hidden" />
            <Button size="sm" variant="secondary" onClick={() => setZoom(Math.max(8, zoom - 2))}>-</Button>
            <span className="w-10 text-center text-xs">{zoom}px</span>
            <Button size="sm" variant="secondary" onClick={() => setZoom(Math.min(32, zoom + 2))}>+</Button>
          </div>
        </div>

        <div className="min-h-0 flex flex-1 items-start justify-center overflow-auto p-4">
          {showSeparatedLayers ? (
            <div className="flex w-full max-w-md flex-col gap-3">
              {separatedHardwareLayers.map(layer => (
                <div key={`${layer.cellX}-${layer.cellY}-${layer.index}`} className="space-y-1 rounded border border-msx-border/70 bg-msx-panelbg/70 p-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-msx-textprimary">
                      Part {partLabelByOffset.get(`${layer.xOffset},${layer.yOffset}`) || `${layer.cellX},${layer.cellY}`} - Layer {layer.index + 1}
                    </span>
                    <span className={layer.usesOrColor ? 'text-msx-highlight' : 'text-msx-textsecondary'}>
                      {layer.usesOrColor ? 'CC/OR' : 'mask'}
                    </span>
                  </div>
                  <div className="text-[10px] text-msx-textsecondary">offset x+{layer.xOffset}, y+{layer.yOffset}</div>
                  <LayerPreviewGrid
                    pixels={layer.pixels}
                    width={16}
                    height={16}
                    zoom={Math.max(6, Math.min(18, zoom - 4))}
                    backgroundColor={sprite.backgroundColor}
                  />
                  <div className="text-[10px] text-msx-textsecondary">slots {layer.slots.join(', ') || 'none'}</div>
                  {layer.forcedByRows.length > 0 && (
                    <div className="max-h-14 overflow-auto text-[10px] text-msx-warning">
                      {layer.forcedByRows.join(' / ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Msx2PixelGrid
              frame={frame}
              width={sprite.size.width}
              height={sprite.size.height}
              zoom={zoom}
              backgroundColor={sprite.backgroundColor}
              onPixel={handlePixel}
              onionSkinEnabled={onionSkinEnabled}
              onionSkinOpacity={onionSkinOpacity}
              prevFrame={prevFrame}
              nextFrame={nextFrame}
              metaSpriteParts={superSpriteParts}
            />
          )}
        </div>
        <div className="flex items-center justify-center gap-2 pb-2 text-xs text-msx-textsecondary">
          <span>Frame: {sprite.currentFrameIndex + 1} / {sprite.frames.length}</span>
          <span>|</span>
          <span>Grid Zoom:</span>
          {[100, 200, 400].map(percent => (
            <button key={percent} type="button" className="text-msx-highlight" onClick={() => setZoom(Math.round(16 * (percent / 100)))}>{percent}%</button>
          ))}
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
        <Panel title="Animation Tools" collapsible>
          <div className="p-3 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="space-y-1">
                  <Msx2PixelGrid
                    frame={previewFrame}
                    width={sprite.size.width}
                    height={sprite.size.height}
                    zoom={4}
                    backgroundColor={sprite.backgroundColor}
                    onPixel={() => undefined}
                    onionSkinEnabled={false}
                    onionSkinOpacity={0}
                  />
                  <div className="text-center text-[10px] text-msx-textsecondary">Base</div>
                </div>
                {hasHorizontalFacing && (
                  <div className="space-y-1">
                    <Msx2PixelGrid
                      frame={mirroredPreviewFrame}
                      width={sprite.size.width}
                      height={sprite.size.height}
                      zoom={4}
                      backgroundColor={sprite.backgroundColor}
                      onPixel={() => undefined}
                      onionSkinEnabled={false}
                      onionSkinOpacity={0}
                    />
                    <div className="text-center text-[10px] text-msx-textsecondary">Mirror</div>
                  </div>
                )}
              </div>
              <Button size="sm" variant="secondary" icon={isAnimationPlaying ? <StopIcon /> : <PlayIcon />} onClick={() => setIsAnimationPlaying(v => !v)}>
                {isAnimationPlaying ? 'Stop' : 'Play'}
              </Button>
            </div>
            <label className="flex items-center justify-between gap-2">Speed
              <input type="number" min={40} max={1000} value={animationSpeedMs} onChange={e => onUpdate({ animationSpeedMs: Number(e.target.value) || 150 })} className="w-20 bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
            </label>
            <label className="flex items-center justify-between gap-2">Loop
              <input type="checkbox" checked={sprite.loops !== false} onChange={e => onUpdate({ loops: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between gap-2">Onion Skin
              <input type="checkbox" checked={onionSkinEnabled} onChange={e => setOnionSkinEnabled(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-2">Opacity
              <input type="range" min={0.1} max={0.7} step={0.05} value={onionSkinOpacity} onChange={e => setOnionSkinOpacity(Number(e.target.value))} className="w-28 accent-msx-accent" disabled={!onionSkinEnabled} />
            </label>
          </div>
        </Panel>

        <Panel title="MSX2 Sprite Settings" collapsible>
          <div className="p-3 space-y-2 text-xs">
            <label className="flex items-center justify-between gap-2">
              <span>Facing</span>
              <select
                value={facingDirection}
                onChange={event => onUpdate({ facingDirection: event.target.value as FacingDirection })}
                className="bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-msx-textprimary"
              >
                <option value="neutral">Neutral</option>
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>
            </label>
          </div>
        </Panel>

        <Panel title="Frame Control" collapsible>
          <div className="p-3 space-y-2">
            <div className="flex gap-2">
              <Button onClick={() => handleFrameManagement('prev')} variant="ghost" size="sm" className="flex-1" disabled={sprite.frames.length <= 1}>Prev</Button>
              <Button onClick={() => handleFrameManagement('next')} variant="ghost" size="sm" className="flex-1" disabled={sprite.frames.length <= 1}>Next</Button>
            </div>
            <Button onClick={() => handleFrameManagement('add')} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="w-full" justify="start">Add Frame</Button>
            <Button onClick={() => handleFrameManagement('duplicate')} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} className="w-full" justify="start">Duplicate Frame</Button>
            <Button onClick={() => handleFrameManagement('delete')} variant="danger" size="sm" icon={<TrashIcon />} className="w-full" justify="start" disabled={sprite.frames.length <= 1}>Delete Frame</Button>
          </div>
        </Panel>

        <Panel title="MSX2 MetaSprite Layout" collapsible>
          <div className="p-3 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {MSX2_METASPRITE_PRESETS.map(preset => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant={superSpriteLayout === preset.id ? 'primary' : 'secondary'}
                  onClick={() => applyMetaSpriteLayout(preset.id)}
                  className="justify-start"
                >
                  {preset.label} {preset.size.width}x{preset.size.height}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="rounded border border-msx-border/70 bg-msx-bgcolor/50 px-2 py-1">
                <div className="text-msx-textsecondary">Parts</div>
                <div className="text-msx-textprimary">{superSpriteBaseParts}</div>
              </div>
              <div className="rounded border border-msx-border/70 bg-msx-bgcolor/50 px-2 py-1">
                <div className="text-msx-textsecondary">HW sprites</div>
                <div className={estimatedHardwareSprites > 8 ? 'text-msx-warning' : 'text-msx-textprimary'}>{estimatedHardwareSprites}</div>
              </div>
              <div className="rounded border border-msx-border/70 bg-msx-bgcolor/50 px-2 py-1">
                <div className="text-msx-textsecondary">Worst line</div>
                <div className={maxSpritesPerScanline > 8 ? 'text-msx-warning' : 'text-msx-textprimary'}>{maxSpritesPerScanline}/8</div>
              </div>
            </div>
            <div className="space-y-1">
              {superSpriteParts.map(part => (
                <div key={part.id} className="flex items-center justify-between rounded border border-msx-border/70 bg-msx-bgcolor/40 px-2 py-1">
                  <span>{part.label}</span>
                  <span className="text-msx-textsecondary">x{part.offsetX}, y{part.offsetY}, 16x16</span>
                </div>
              ))}
            </div>
            <p className="text-msx-textsecondary">Each part is a 16x16 MSX2 hardware sprite cell. Extra color planes from OR/masks multiply the hardware sprite cost per cell.</p>
          </div>
        </Panel>

        <Panel title="MSX2 HW Limits" collapsible>
          <div className="p-3 space-y-2 text-xs">
            <div className={(invalidLineCount > 0 || scanlineOverflow) ? 'text-msx-warning' : 'text-msx-textsecondary'}>
              {invalidLineCount > 0
                ? `${invalidLineCount} cell line${invalidLineCount === 1 ? '' : 's'} need more than 8 overlapped sprites. Reduce colors there.`
                : scanlineOverflow
                  ? `${maxSpritesPerScanline}/8 hardware sprites on the busiest scanline. OpenMSX will drop extras unless you multiplex/flicker.`
                : `${estimatedHardwareSprites} hardware sprite${estimatedHardwareSprites === 1 ? '' : 's'} across ${cellColumns}x${cellRows} metasprite cells.`}
            </div>
            <div className="text-msx-textsecondary">
              Worst scanline: {maxSpritesPerScanline}/8 visible hardware sprites. {orColorLineCount} line{orColorLineCount === 1 ? '' : 's'} use OR color.
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="rounded border border-msx-border/70 bg-msx-bgcolor/50 px-2 py-1">
                <div className="text-msx-textsecondary">Stacked rows</div>
                <div className="text-msx-textprimary">{stackedColorLineCount}</div>
              </div>
              <div className="rounded border border-msx-border/70 bg-msx-bgcolor/50 px-2 py-1">
                <div className="text-msx-textsecondary">3+ color rows</div>
                <div className={threeColorLineCount ? 'text-msx-highlight' : 'text-msx-textprimary'}>{threeColorLineCount}</div>
              </div>
              <div className="rounded border border-msx-border/70 bg-msx-bgcolor/50 px-2 py-1">
                <div className="text-msx-textsecondary">Max cell layers</div>
                <div className={maxCellLayerCount > 4 ? 'text-msx-warning' : 'text-msx-textprimary'}>{maxCellLayerCount}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {rowDiagnostics.map(row => (
                <div
                  key={`${row.cellX}-${row.y}`}
                  className={`rounded border px-1 py-0.5 ${row.invalid ? 'border-msx-warning text-msx-warning' : row.layerCount >= 3 ? 'border-msx-highlight text-msx-highlight' : row.layerCount > 1 ? 'border-msx-border text-msx-textprimary' : 'border-msx-border text-msx-textsecondary'}`}
                  title={row.colors.length ? `Cell ${row.cellX}, line ${row.y}: ${row.colors.join(', ')}; slots ${row.slots.join(', ') || 'none'}` : `Cell ${row.cellX}, line ${row.y}: transparent`}
                >
                  c{row.cellX} y{row.y}: {row.layerCount ? `${row.layerCount}${row.usesOrColor ? '+' : ''}` : 'T'}
                </div>
              ))}
            </div>
            <p className="text-msx-textsecondary">Transparent pixels are pattern bits set to 0. Rows are split into overlapped MSX2 sprite mode 2 masks; with the V9938 CC/OR color bit, two planes can show base color, overlay color, and a third overlap color where paletteSlotA | paletteSlotB matches the desired slot.</p>
          </div>
        </Panel>

        <Panel title="MSX2 Hardware" collapsible>
          <div className="grid grid-cols-2 gap-2 p-3 text-xs">
            <label>X<input type="number" value={sprite.hardware.x} min={0} max={255} onChange={e => setHardware('x', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
            <label>Y<input type="number" value={sprite.hardware.y} min={0} max={211} onChange={e => setHardware('y', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
            <label>Color<input type="number" value={sprite.hardware.color} min={1} max={15} onChange={e => setHardware('color', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
            <label>Pattern<input type="number" value={sprite.hardware.patternIndex} min={0} max={252} step={4} onChange={e => setHardware('patternIndex', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
            <label className="col-span-2 flex items-center justify-between gap-2">OR color<input type="checkbox" checked={useOrColor} onChange={e => setHardware('useOrColor', e.target.checked)} /></label>
          </div>
        </Panel>

        <Panel title="MSX2 OR Color Helper" collapsible>
          <div className="p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-msx-textsecondary">Transparent mask + CC/OR</span>
              <Button size="sm" variant={useOrColor ? 'primary' : 'secondary'} onClick={() => setHardware('useOrColor', !useOrColor)}>
                {useOrColor ? 'On' : 'Off'}
              </Button>
            </div>
            <div className="max-h-40 space-y-1 overflow-auto">
              {orPalettePairs.length === 0 ? (
                <div className="text-msx-textsecondary">No OR-compatible palette pairs found.</div>
              ) : (
                orPalettePairs.map(pair => (
                  <div key={`${pair.base}-${pair.overlay}-${pair.result}`} className="rounded border border-msx-border/70 bg-msx-bgcolor/40 p-1">
                    <div className="mb-1 text-msx-textsecondary">
                      slot {pair.base} | slot {pair.overlay} = slot {pair.result}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <Button size="sm" variant="ghost" className="justify-start text-[10px]" onClick={() => useOrBrushColor(pair.baseHex as MSXColorValue)}>
                        <span className="mr-1 h-3 w-3 rounded-sm border border-msx-border" style={{ backgroundColor: pair.baseHex }} />A {pair.base}
                      </Button>
                      <Button size="sm" variant="ghost" className="justify-start text-[10px]" onClick={() => useOrBrushColor(pair.overlayHex as MSXColorValue)}>
                        <span className="mr-1 h-3 w-3 rounded-sm border border-msx-border" style={{ backgroundColor: pair.overlayHex }} />B {pair.overlay}
                      </Button>
                      <Button size="sm" variant="ghost" className="justify-start text-[10px]" onClick={() => useOrBrushColor(pair.resultHex as MSXColorValue)}>
                        <span className="mr-1 h-3 w-3 rounded-sm border border-msx-border" style={{ backgroundColor: pair.resultHex }} />A|B {pair.result}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>

        <Panel title="MSX2 Sprite Export Contract" collapsible>
          <pre className="m-0 max-h-44 overflow-auto p-3 text-[10px] leading-relaxed text-msx-textsecondary whitespace-pre-wrap">
            {JSON.stringify(spriteExportContract, null, 2)}
          </pre>
        </Panel>

        <Panel title="MSX2 Pattern Bytes" collapsible>
          <pre className="m-0 max-h-28 overflow-auto p-3 text-xs text-msx-textsecondary whitespace-pre-wrap">{asmBytes}</pre>
        </Panel>
      </div>
      <Msx2ExternalSpriteImportModal
        isOpen={isExternalImportOpen}
        sprite={sprite}
        paletteAssets={paletteAssets}
        onClose={() => setIsExternalImportOpen(false)}
        onApply={applyExternalSpriteImport}
        onSavePaletteAsset={onSavePaletteAsset}
      />
      </div>
    </div>
  );
};
