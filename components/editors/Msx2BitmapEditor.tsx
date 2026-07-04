import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Bitmap, PaletteAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { EraserIcon, FolderOpenIcon, PaintBrushIcon, SaveIcon, ViewfinderCircleIcon } from '../icons/MsxIcons';

type BitmapTool = 'pencil' | 'erase' | 'fill' | 'picker';

interface Msx2BitmapEditorProps {
  bitmap: Msx2Bitmap;
  onUpdate: (data: Partial<Msx2Bitmap>) => void;
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
}

const WIDTH = 256;
const HEIGHT = 212;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const createPixels = (slot = 0): number[][] =>
  Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => slot));

const clonePixels = (pixels: number[][]): number[][] => pixels.map(row => [...row]);

const normalizePixels = (pixels?: number[][]): number[][] => {
  if (!pixels || pixels.length !== HEIGHT || pixels.some(row => row.length !== WIDTH)) return createPixels(0);
  return pixels.map(row => row.map(value => Math.max(0, Math.min(15, Number(value) || 0))));
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

const nearestSlot = (r: number, g: number, b: number, slots: { hex: string }[]): number => {
  let bestSlot = 0;
  let bestDistance = Infinity;
  slots.forEach((slot, index) => {
    if (slot.hex === TRANSPARENT_HEX) return;
    const rgb = hexToRgb(slot.hex);
    if (!rgb) return;
    const distance = ((rgb.r - r) ** 2) + ((rgb.g - g) ** 2) + ((rgb.b - b) ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSlot = index;
    }
  });
  return bestSlot;
};

export const Msx2BitmapEditor: React.FC<Msx2BitmapEditorProps> = ({ bitmap, onUpdate, paletteAssets = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSavedPaletteId, setSelectedSavedPaletteId] = useState('');
  const [tool, setTool] = useState<BitmapTool>('pencil');
  const [activeSlot, setActiveSlot] = useState(1);
  const [zoom, setZoom] = useState(2);
  const [showGrid, setShowGrid] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; slot: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(bitmap.palette), [bitmap.palette]);
  const pixels = useMemo(() => normalizePixels(bitmap.pixels), [bitmap.pixels]);

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    if (selectedSavedPaletteId && !paletteAssets.some(asset => asset.id === selectedSavedPaletteId)) {
      setSelectedSavedPaletteId('');
    }
  }, [paletteAssets, selectedSavedPaletteId]);

  const applySavedPaletteAsset = () => {
    if (!selectedSavedPaletteId) return;
    const paletteAsset = paletteAssets.find(asset => asset.id === selectedSavedPaletteId);
    if (!paletteAsset?.data?.slots?.length) return;
    const nextSlots = ensureScreen5PaletteSlots(paletteAsset.data.slots).slots;
    onUpdate({ palette: nextSlots.map(slot => ({ ...slot })) });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = WIDTH * zoom;
    canvas.height = HEIGHT * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const slot = pixels[y][x] & 0x0f;
        const hex = slots[slot]?.hex || TRANSPARENT_HEX;
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    if (showGrid && zoom >= 3) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom + 0.5, 0);
        ctx.lineTo(x * zoom + 0.5, HEIGHT * zoom);
        ctx.stroke();
      }
      for (let y = 0; y <= HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(WIDTH * zoom, y * zoom + 0.5);
        ctx.stroke();
      }
    }
  }, [pixels, slots, zoom, showGrid]);

  useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const pointFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / zoom);
    const y = Math.floor((event.clientY - rect.top) / zoom);
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return null;
    return { x, y };
  };

  const floodFill = (source: number[][], x: number, y: number, slot: number): number[][] => {
    const target = source[y][x];
    if (target === slot) return source;
    const next = clonePixels(source);
    const stack: Array<[number, number]> = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= WIDTH || cy >= HEIGHT || next[cy][cx] !== target) continue;
      next[cy][cx] = slot;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    return next;
  };

  const applyTool = (x: number, y: number, rightClick = false) => {
    const slot = rightClick || tool === 'erase' ? 0 : activeSlot;
    if (tool === 'picker') {
      setActiveSlot(pixels[y][x] || 0);
      return;
    }
    if (tool === 'fill') {
      onUpdate({ pixels: floodFill(pixels, x, y, slot) });
      return;
    }
    const next = clonePixels(pixels);
    next[y][x] = slot;
    onUpdate({ pixels: next });
  };

  const handleMouse = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    const point = pointFromEvent(event);
    if (!point) return;
    setCursor({ ...point, slot: pixels[point.y][point.x] });
    if (!force && (!isDrawing || tool === 'fill' || tool === 'picker')) return;
    applyTool(point.x, point.y, event.button === 2);
  };

  const exportPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    pixels.forEach((row, y) => row.forEach((slot, x) => {
      const hex = slots[slot]?.hex || TRANSPARENT_HEX;
      if (hex === TRANSPARENT_HEX) return;
      ctx.fillStyle = hex;
      ctx.fillRect(x, y, 1, 1);
    }));
    const link = document.createElement('a');
    link.download = `${bitmap.name || 'msx2-bitmap'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const importPng = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
      const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
      const next = createPixels(0);
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const offset = ((y * WIDTH) + x) * 4;
          next[y][x] = data[offset + 3] < 128 ? 0 : nearestSlot(data[offset], data[offset + 1], data[offset + 2], slots);
        }
      }
      onUpdate({ pixels: next });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    image.src = URL.createObjectURL(file);
  };

  return (
    <div className="h-full min-h-0 grid grid-cols-[220px_1fr_280px] gap-2 p-2 bg-msx-bgcolor overflow-hidden">
      <div className="min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-2">
        <Panel title="MSX2 Bitmap Tools">
          <div className="p-2 space-y-1">
            <Button size="sm" variant={tool === 'pencil' ? 'primary' : 'ghost'} icon={<PaintBrushIcon />} className="w-full" justify="start" onClick={() => setTool('pencil')}>MSX2 Pencil</Button>
            <Button size="sm" variant={tool === 'erase' ? 'primary' : 'ghost'} icon={<EraserIcon />} className="w-full" justify="start" onClick={() => setTool('erase')}>MSX2 Erase</Button>
            <Button size="sm" variant={tool === 'fill' ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setTool('fill')}>MSX2 Fill</Button>
            <Button size="sm" variant={tool === 'picker' ? 'primary' : 'ghost'} icon={<ViewfinderCircleIcon />} className="w-full" justify="start" onClick={() => setTool('picker')}>MSX2 Picker</Button>
          </div>
        </Panel>

        <Panel title="MSX2 Legacy Bitmap Palette">
          <div className="space-y-2 p-2">
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.slotIndex}
                  type="button"
                  className={`h-9 rounded border text-[0.65rem] ${activeSlot === slot.slotIndex ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'}`}
                  style={{ backgroundColor: slot.hex === TRANSPARENT_HEX ? '#111827' : slot.hex }}
                  onClick={() => setActiveSlot(slot.slotIndex)}
                  title={`Slot ${slot.slotIndex}: ${slot.hex}`}
                >
                  <span className="bg-black/40 px-1 rounded text-white">{slot.slotIndex}</span>
                </button>
              ))}
            </div>
            {paletteAssets.length > 0 ? (
              <div className="space-y-2 border-t border-msx-border pt-2 text-xs">
                <label className="block text-msx-textsecondary">
                  Paleta guardada
                  <select
                    value={selectedSavedPaletteId}
                    onChange={event => setSelectedSavedPaletteId(event.target.value)}
                    className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                  >
                    <option value="">-- Elegir --</option>
                    {paletteAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>{asset.name}</option>
                    ))}
                  </select>
                </label>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<FolderOpenIcon />}
                  className="w-full"
                  justify="center"
                  disabled={!selectedSavedPaletteId}
                  onClick={applySavedPaletteAsset}
                  title="Carga los 16 slots de la paleta seleccionada en este bitmap."
                >
                  Cargar paleta seleccionada
                </Button>
              </div>
            ) : (
              <p className="border-t border-msx-border pt-2 text-[10px] text-msx-textsecondary">
                No hay paletas guardadas. Crea una en Project Assets &gt; MSX2 Palettes.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <input
              value={bitmap.name}
              onChange={event => onUpdate({ name: event.target.value })}
              className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm"
            />
            <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm">256 x 212 legacy bitmap</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" icon={<SaveIcon />} onClick={exportPng}>MSX2 Export PNG</Button>
            <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} onClick={() => fileInputRef.current?.click()}>MSX2 Import PNG</Button>
            <input type="file" accept="image/png" ref={fileInputRef} onChange={importPng} className="hidden" />
            <Button size="sm" variant="secondary" onClick={() => setZoom(Math.max(1, zoom - 1))}>-</Button>
            <span className="w-10 text-center text-xs">{zoom}x</span>
            <Button size="sm" variant="secondary" onClick={() => setZoom(Math.min(8, zoom + 1))}>+</Button>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid</label>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-black/30 border border-msx-border">
          <canvas
            ref={canvasRef}
            className="block"
            onContextMenu={event => event.preventDefault()}
            onMouseDown={event => {
              setIsDrawing(true);
              handleMouse(event, true);
            }}
            onMouseMove={event => handleMouse(event)}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
        <Panel title="MSX2 Bitmap Data">
          <div className="p-3 text-xs space-y-2 text-msx-textsecondary">
            <div>Mode: Legacy bitmap asset</div>
            <div>VRAM: #0000</div>
            <div>Raw size: 27136 bytes</div>
            <div>Format: 2 pixels per byte</div>
            <div>Active slot: {activeSlot}</div>
            {cursor && <div>Cursor: {cursor.x},{cursor.y} slot {cursor.slot}</div>}
          </div>
        </Panel>

        <Panel title="Notes">
          <textarea
            value={bitmap.notes || ''}
            onChange={event => onUpdate({ notes: event.target.value })}
            className="m-3 w-[calc(100%-1.5rem)] min-h-28 bg-msx-bgcolor border border-msx-border rounded p-2 text-xs"
            placeholder="Bitmap usage notes..."
          />
        </Panel>
      </div>
    </div>
  );
};
