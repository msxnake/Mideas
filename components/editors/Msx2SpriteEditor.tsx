import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Sprite, MSXColorValue, PixelData, Point } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';
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
  TrashIcon,
} from '../icons/MsxIcons';

type Msx2SpriteToolMode = 'draw' | 'erase' | 'sphere';
type TransformAction = 'shiftUp' | 'shiftDown' | 'shiftLeft' | 'shiftRight' | 'rotate' | 'flipHorizontal' | 'flipVertical';

interface Msx2SpriteEditorProps {
  sprite: Msx2Sprite;
  onUpdate: (data: Partial<Msx2Sprite>) => void;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const clonePixels = (data: PixelData): PixelData => data.map(row => [...row]);

const createPixels = (width: number, height: number, color: MSXColorValue): PixelData =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => color));

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

interface HardwareOrColorPair {
  base: number;
  overlay: number;
  result: number;
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
  showHitbox: boolean;
  hitbox: { width: number; height: number; offsetX: number; offsetY: number };
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
  showHitbox,
  hitbox,
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
      {showHitbox && (
        <div
          className="absolute border border-dashed border-msx-highlight pointer-events-none"
          style={{
            left: hitbox.offsetX * zoom,
            top: hitbox.offsetY * zoom,
            width: hitbox.width * zoom,
            height: hitbox.height * zoom,
          }}
        />
      )}
    </div>
  );
};

export const Msx2SpriteEditor: React.FC<Msx2SpriteEditorProps> = ({ sprite, onUpdate }) => {
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
  const [showHitbox, setShowHitbox] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const resolvedHitbox = sprite.hitbox || { width: sprite.size.width, height: sprite.size.height, offsetX: 0, offsetY: 0 };
  const animationSpeedMs = sprite.animationSpeedMs || 150;
  const useOrColor = sprite.hardware?.useOrColor !== false;
  const cellColumns = Math.max(1, Math.ceil(sprite.size.width / 16));
  const cellRows = Math.max(1, Math.ceil(sprite.size.height / 16));
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
  const invalidLineCount = rowDiagnostics.filter(row => row.invalid).length;
  const orColorLineCount = rowDiagnostics.filter(row => row.usesOrColor).length;
  const maxSpritesPerScanline = Math.max(
    1,
    ...Array.from({ length: sprite.size.height }, (_, y) =>
      rowDiagnostics.filter(row => row.y === y).reduce((sum, row) => sum + row.layerCount, 0)
    )
  );
  const scanlineOverflow = maxSpritesPerScanline > 8;
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

  const setHitbox = (field: keyof NonNullable<Msx2Sprite['hitbox']>, value: number) => {
    onUpdate({ hitbox: { ...resolvedHitbox, [field]: value } });
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

  const previewFrame = sprite.frames[previewFrameIndex]?.data || frame;
  const asmBytes = useMemo(() => toAsmBytes(sprite), [sprite]);
  const isFrameEmpty = frame.every(row => row.every(color => color === sprite.backgroundColor));

  return (
    <div className="h-full min-h-0 grid grid-cols-[200px_1fr_360px] gap-2 p-2 bg-msx-bgcolor overflow-hidden">
      <div className="min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-4">
        <Panel title="Tools">
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

        <Panel title="Active Brush">
          <div className="grid grid-cols-2 gap-2 p-2">
            {palette.map(slot => (
              <button
                key={slot.slotIndex}
                type="button"
                className={`h-8 rounded border ${selectedColor === slot.hex ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'}`}
                style={{ backgroundColor: slot.hex === sprite.backgroundColor ? '#111827' : slot.hex }}
                onClick={() => setSelectedColor(slot.hex)}
                title={`Slot ${slot.slotIndex}: ${slot.hex}${slot.masterIndex >= 0 ? ` / master ${slot.masterIndex}` : ''}`}
              />
            ))}
          </div>
        </Panel>

        <Panel title="MSX2 Transform Frame">
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
            <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm">MSX2 16 x 16 hardware</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={<SaveIcon />} onClick={exportPng}>MSX2 Export PNG</Button>
            <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} onClick={() => importFileRef.current?.click()}>MSX2 Import PNG</Button>
            <input type="file" accept="image/png" ref={importFileRef} onChange={importPng} className="hidden" />
            <Button size="sm" variant="secondary" onClick={() => setZoom(Math.max(8, zoom - 2))}>-</Button>
            <span className="w-10 text-center text-xs">{zoom}px</span>
            <Button size="sm" variant="secondary" onClick={() => setZoom(Math.min(32, zoom + 2))}>+</Button>
          </div>
        </div>

        <div className="min-h-0 flex flex-1 items-start justify-center overflow-auto p-4">
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
            showHitbox={showHitbox}
            hitbox={resolvedHitbox}
          />
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
              <Msx2PixelGrid
                frame={previewFrame}
                width={sprite.size.width}
                height={sprite.size.height}
                zoom={4}
                backgroundColor={sprite.backgroundColor}
                onPixel={() => undefined}
                onionSkinEnabled={false}
                onionSkinOpacity={0}
                showHitbox={false}
                hitbox={resolvedHitbox}
              />
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
            <div className="grid grid-cols-4 gap-1">
              {rowDiagnostics.map(row => (
                <div
                  key={`${row.cellX}-${row.y}`}
                  className={`rounded border px-1 py-0.5 ${row.invalid ? 'border-msx-warning text-msx-warning' : 'border-msx-border text-msx-textsecondary'}`}
                  title={row.colors.length ? `Cell ${row.cellX}, line ${row.y}: ${row.colors.join(', ')}` : `Cell ${row.cellX}, line ${row.y}: transparent`}
                >
                  c{row.cellX} y{row.y}: {row.layerCount ? `${row.layerCount}${row.usesOrColor ? '+' : ''}` : 'T'}
                </div>
              ))}
            </div>
            <p className="text-msx-textsecondary">Transparent pixels are pattern bits set to 0. Rows are split into overlapped MSX2 sprite mode 2 layers; OR color uses the VDP color-table CC bit.</p>
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

        <Panel title="Hitbox Settings" collapsible>
          <div className="p-3 space-y-2 text-xs">
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ hitbox: { width: sprite.size.width, height: sprite.size.height, offsetX: 0, offsetY: 0 } })}>Fit Sprite</Button>
            <div className="grid grid-cols-2 gap-2">
              <label>Width<input type="number" min={1} max={sprite.size.width} value={resolvedHitbox.width} onChange={e => setHitbox('width', Number(e.target.value) || sprite.size.width)} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
              <label>Height<input type="number" min={1} max={sprite.size.height} value={resolvedHitbox.height} onChange={e => setHitbox('height', Number(e.target.value) || sprite.size.height)} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
              <label>Offset X<input type="number" value={resolvedHitbox.offsetX} onChange={e => setHitbox('offsetX', Number(e.target.value) || 0)} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
              <label>Offset Y<input type="number" value={resolvedHitbox.offsetY} onChange={e => setHitbox('offsetY', Number(e.target.value) || 0)} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
            </div>
            <label className="flex items-center justify-between gap-2">Show Hitbox<input type="checkbox" checked={showHitbox} onChange={e => setShowHitbox(e.target.checked)} /></label>
          </div>
        </Panel>

        <Panel title="MSX2 Pattern Bytes" collapsible>
          <pre className="m-0 max-h-28 overflow-auto p-3 text-xs text-msx-textsecondary whitespace-pre-wrap">{asmBytes}</pre>
        </Panel>
      </div>
    </div>
  );
};
