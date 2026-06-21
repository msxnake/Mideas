import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BitmapTileScreen5,
  EditorType,
  PaletteAsset,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Modal } from '../modals/Modal';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  EraserIcon,
  FolderOpenIcon,
  GridIcon,
  LoadIcon,
  PencilIcon,
  PaintBrushIcon,
  SaveIcon,
  SwapHorizIcon,
  TilesetIcon,
  TrashIcon,
  ViewfinderCircleIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../icons/MsxIcons';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import {
  Msx2BitmapTileLibraryEntry,
  addEntryToMsx2BitmapTileLibrary,
  exportMsx2BitmapTileLibraryEntryFile,
  exportMsx2BitmapTileLibraryFile,
  loadMsx2BitmapTileLibrary,
  mergeMsx2BitmapTileLibraryEntries,
  parseMsx2BitmapTileLibraryFile,
  removeMsx2BitmapTileLibraryEntry,
} from '../../utils/msx2BitmapTileLibrary';
import { createScreen5PaletteAssetForTile } from '../../utils/msx2Screen5BitmapTileLibrary';

type TileTool = 'brush' | 'erase' | 'fill' | 'picker';
type BrushSize = 1 | 2 | 'dither';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';
const DEFAULT_TILE_W = 16;
const DEFAULT_TILE_H = 16;
const ZOOM_OPTIONS = [8, 16, 24, 32];
const DITHER_PATTERN: Array<[number, number]> = [[0, 0], [1, 1]];

interface Msx2BitmapTileEditorProps {
  tileAsset: ProjectAsset;
  allAssets: ProjectAsset[];
  onUpdate: (data: BitmapTileScreen5, newAssets?: ProjectAsset[]) => void;
  onSelectAsset: (assetId: string, editorType?: EditorType) => void;
  setStatusBarMessage?: (message: string) => void;
}

const cloneGrid = (grid: number[][]): number[][] => grid.map(row => [...row]);

const flatToGrid = (flat: number[], w: number, h: number): number[][] => {
  const out: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) row.push(Math.max(0, Math.min(15, Number(flat[y * w + x]) || 0)));
    out.push(row);
  }
  return out;
};

const gridToFlat = (grid: number[][]): number[] => {
  const out: number[] = [];
  for (const row of grid) for (const value of row) out.push(value);
  return out;
};

const resolveSlotHexForRender = (slots: Screen5PaletteSlot[], slot: number): string => {
  const hex = slots[slot]?.hex;
  return !hex || hex === TRANSPARENT_HEX ? '#05070b' : hex;
};

export const Msx2BitmapTileEditor: React.FC<Msx2BitmapTileEditorProps> = ({
  tileAsset,
  allAssets,
  onUpdate,
  onSelectAsset,
  setStatusBarMessage,
}) => {
  const tile = tileAsset.data as BitmapTileScreen5;
  const width = Math.max(1, Math.trunc(tile.width) || DEFAULT_TILE_W);
  const height = Math.max(1, Math.trunc(tile.height) || DEFAULT_TILE_H);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<TileTool>('brush');
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const [activeSlot, setActiveSlot] = useState(1);
  const [zoom, setZoom] = useState<number>(16);
  const [showGrid, setShowGrid] = useState(true);
  const [cursor, setCursor] = useState<{ x: number; y: number; slot: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [swapState, setSwapState] = useState<{ active: boolean; firstSlot: number | null }>({
    active: false,
    firstSlot: null,
  });
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showCreatePaletteDialog, setShowCreatePaletteDialog] = useState(false);
  const [libraryEntries, setLibraryEntries] = useState<Msx2BitmapTileLibraryEntry[]>([]);
  const [palettePickerForSlot, setPalettePickerForSlot] = useState<number | null>(null);

  const paletteAsset = useMemo(() => {
    if (!tile.paletteId) return undefined;
    return allAssets.find(asset => asset.id === tile.paletteId && asset.type === 'palette');
  }, [allAssets, tile.paletteId]);

  const { slots } = useMemo(
    () => ensureScreen5PaletteSlots((paletteAsset?.data as PaletteAsset | undefined)?.slots),
    [paletteAsset],
  );

  const pixelsGrid = useMemo(
    () => flatToGrid(tile.pixelData, width, height),
    [tile.pixelData, width, height],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width * zoom;
    canvas.height = height * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = pixelsGrid[y][x] & 0x0f;
        ctx.fillStyle = resolveSlotHexForRender(slots, slot);
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom + 0.5, 0);
        ctx.lineTo(x * zoom + 0.5, height * zoom);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(width * zoom, y * zoom + 0.5);
        ctx.stroke();
      }
    }
  }, [pixelsGrid, slots, zoom, showGrid, width, height]);

  useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const pointFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.floor((event.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (height / rect.height));
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return { x, y };
  };

  const applyBrushAt = (grid: number[][], x: number, y: number, value: number): number[][] => {
    const next = cloneGrid(grid);
    if (brushSize === 1) {
      next[y][x] = value;
      return next;
    }
    if (brushSize === 2) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) next[ny][nx] = value;
        }
      }
      return next;
    }
    for (const [dx, dy] of DITHER_PATTERN) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height) next[ny][nx] = value;
    }
    return next;
  };

  const floodFill = (source: number[][], x: number, y: number, value: number): number[][] => {
    const target = source[y][x];
    if (target === value) return source;
    const next = cloneGrid(source);
    const stack: Array<[number, number]> = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= width || cy >= height || next[cy][cx] !== target) continue;
      next[cy][cx] = value;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    return next;
  };

  const commitGrid = (nextGrid: number[][]) => {
    onUpdate({
      ...tile,
      pixelData: gridToFlat(nextGrid),
      updatedAt: new Date().toISOString(),
    });
  };

  const applyTool = (x: number, y: number, rightClick: boolean) => {
    if (swapState.active) {
      const clickedSlot = pixelsGrid[y][x];
      if (swapState.firstSlot === null) {
        setSwapState({ active: true, firstSlot: clickedSlot });
        setStatusBarMessage?.(`Color swap: first slot ${clickedSlot}. Click a pixel of another slot to swap.`);
      } else if (swapState.firstSlot === clickedSlot) {
        setStatusBarMessage?.('Color swap: same slot, cancelled.');
        setSwapState({ active: false, firstSlot: null });
      } else {
        const a = swapState.firstSlot;
        const b = clickedSlot;
        const next = pixelsGrid.map(row => row.map(value => (value === a ? b : value === b ? a : value)));
        commitGrid(next);
        setStatusBarMessage?.(`Swapped slots ${a} <-> ${b} in this tile (palette untouched).`);
        setSwapState({ active: false, firstSlot: null });
      }
      return;
    }
    const value = rightClick || tool === 'erase' ? 0 : activeSlot;
    if (tool === 'picker') {
      setActiveSlot(pixelsGrid[y][x] || 0);
      return;
    }
    if (tool === 'fill') {
      commitGrid(floodFill(pixelsGrid, x, y, value));
      return;
    }
    commitGrid(applyBrushAt(pixelsGrid, x, y, value));
  };

  const handleMouse = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    const point = pointFromEvent(event);
    if (!point) return;
    setCursor({ ...point, slot: pixelsGrid[point.y][point.x] });
    if (!force && (!isDrawing || tool === 'fill' || tool === 'picker' || swapState.active)) return;
    applyTool(point.x, point.y, event.button === 2);
  };

  const shift = (direction: 'up' | 'down' | 'left' | 'right') => {
    const next = cloneGrid(pixelsGrid);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sx = x;
        let sy = y;
        if (direction === 'up') sy = (y + 1) % height;
        else if (direction === 'down') sy = (y - 1 + height) % height;
        else if (direction === 'left') sx = (x + 1) % width;
        else if (direction === 'right') sx = (x - 1 + width) % width;
        next[y][x] = pixelsGrid[sy][sx];
      }
    }
    commitGrid(next);
  };

  const handleSlotDoubleClick = (slotIndex: number) => {
    if (slotIndex === 0) return;
    setPalettePickerForSlot(slotIndex);
    if (paletteAsset) {
      onSelectAsset(paletteAsset.id, EditorType.Palette);
      setPalettePickerForSlot(null);
    } else {
      setShowCreatePaletteDialog(true);
    }
  };

  const confirmCreatePalette = () => {
    const baseName = tile.name || 'Bitmap Tile';
    const newPalette = createScreen5PaletteAssetForTile(slots, baseName, tile.id, allAssets);
    onUpdate(
      { ...tile, paletteId: newPalette.id, updatedAt: new Date().toISOString() },
      [newPalette],
    );
    setShowCreatePaletteDialog(false);
    setPalettePickerForSlot(null);
    setStatusBarMessage?.(`Created palette asset "${newPalette.name}" linked to this tile.`);
  };

  const openLibrary = () => {
    setLibraryEntries(loadMsx2BitmapTileLibrary());
    setShowLibraryModal(true);
  };

  const exportToLibrary = () => {
    const entry = addEntryToMsx2BitmapTileLibrary(tile, slots, tile.name);
    setStatusBarMessage?.(`Saved "${entry.name}" to bitmap tile library.`);
  };

  const importFromLibrary = (entry: Msx2BitmapTileLibraryEntry) => {
    const libTile = entry.tile;
    const libW = Math.max(1, Math.trunc(libTile.width) || DEFAULT_TILE_W);
    const libH = Math.max(1, Math.trunc(libTile.height) || DEFAULT_TILE_H);
    const libGrid = flatToGrid(libTile.pixelData, libW, libH);
    if (libW !== width || libH !== height) {
      setStatusBarMessage?.(`Library tile is ${libW}x${libH}; current is ${width}x${height}. Imported with resize.`);
    }
    const next: number[][] = [];
    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) row.push(libGrid[y]?.[x] ?? 0);
      next.push(row);
    }
    commitGrid(next);
    setShowLibraryModal(false);
    setStatusBarMessage?.(`Imported "${entry.name}" from library into current tile.`);
  };

  const deleteLibraryEntry = (id: string) => {
    setLibraryEntries(removeMsx2BitmapTileLibraryEntry(id));
  };

  const exportLibraryFile = () => {
    exportMsx2BitmapTileLibraryFile();
    setStatusBarMessage?.('Exported bitmap tile library JSON.');
  };

  const importLibraryFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseMsx2BitmapTileLibraryFile(String(reader.result || ''));
        const merged = mergeMsx2BitmapTileLibraryEntries(parsed);
        setLibraryEntries(merged);
        setStatusBarMessage?.(`Merged ${parsed.length} tile(s) into library.`);
      } catch (err) {
        setStatusBarMessage?.(`Import failed: ${(err as Error).message}`);
      }
      if (libraryFileInputRef.current) libraryFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const changeZoom = (delta: number) => {
    const currentIndex = ZOOM_OPTIONS.indexOf(zoom);
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= ZOOM_OPTIONS.length) return;
    setZoom(ZOOM_OPTIONS[nextIndex]);
  };

  const tools: Array<{ id: TileTool; label: string; icon: React.ReactNode }> = [
    { id: 'brush', label: 'Pencil', icon: <PencilIcon /> },
    { id: 'erase', label: 'Eraser', icon: <EraserIcon /> },
    { id: 'fill', label: 'Fill', icon: <PaintBrushIcon /> },
    { id: 'picker', label: 'Picker', icon: <ViewfinderCircleIcon /> },
  ];

  return (
    <Panel
      title="MSX2 SCREEN 5 Bitmap Tile Editor"
      icon={<TilesetIcon />}
      className="h-full min-h-0 flex flex-col bg-msx-bgcolor"
      bodyClassName="flex-grow flex flex-col min-h-0 overflow-hidden p-0"
    >
      <div className="flex flex-grow min-h-0 overflow-hidden">
        <aside className="w-56 border-r border-msx-border p-2 overflow-y-auto space-y-2 flex-shrink-0">
          <Panel title="Tools">
            <div className="p-2 space-y-1">
              {tools.map(entry => (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={tool === entry.id && !swapState.active ? 'primary' : 'ghost'}
                  icon={entry.icon}
                  className="w-full"
                  justify="start"
                  onClick={() => {
                    setTool(entry.id);
                    setSwapState({ active: false, firstSlot: null });
                  }}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel title="Brush size">
            <div className="p-2 space-y-1">
              <Button size="sm" variant={brushSize === 1 ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setBrushSize(1)}>1 pixel</Button>
              <Button size="sm" variant={brushSize === 2 ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setBrushSize(2)}>2x2 pixels</Button>
              <Button size="sm" variant={brushSize === 'dither' ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setBrushSize('dither')}>Dither 2x2 (10/01)</Button>
              <div className="text-[0.65rem] text-msx-textsecondary pt-1">Brush size applies to Pencil only. Eraser is 1px. Right-click erases with active brush.</div>
            </div>
          </Panel>

          <Panel title="Color swap (this tile)">
            <div className="p-2 space-y-1">
              <Button
                size="sm"
                variant={swapState.active ? 'primary' : 'ghost'}
                icon={<SwapHorizIcon />}
                className="w-full"
                justify="start"
                onClick={() => setSwapState(current => ({ active: !current.active, firstSlot: null }))}
              >
                {swapState.active ? 'Cancel swap' : 'Start swap'}
              </Button>
              <div className="text-[0.65rem] text-msx-textsecondary">
                {swapState.active
                  ? swapState.firstSlot === null
                    ? 'Click a pixel (slot A)...'
                    : `Slot ${swapState.firstSlot} selected. Click slot B.`
                  : 'Swaps two slots pixel-by-pixel. Palette is untouched.'}
              </div>
            </div>
          </Panel>

          <Panel title="Move pattern (wrap)">
            <div className="p-2">
              <div className="grid grid-cols-3 gap-1 max-w-[160px] mx-auto">
                <div />
                <Button size="sm" variant="secondary" onClick={() => shift('up')} aria-label="Shift up"><ArrowUpIcon /></Button>
                <div />
                <Button size="sm" variant="secondary" onClick={() => shift('left')} aria-label="Shift left"><ArrowLeftIcon /></Button>
                <Button size="sm" variant="secondary" onClick={() => shift('right')} aria-label="Shift right"><ArrowRightIcon /></Button>
                <Button size="sm" variant="secondary" onClick={() => shift('down')} aria-label="Shift down"><ArrowDownIcon /></Button>
                <div />
              </div>
              <div className="text-[0.65rem] text-msx-textsecondary mt-2 text-center">Toroidal: outgoing edge wraps to the opposite side.</div>
            </div>
          </Panel>

          <Panel title="Library">
            <div className="p-2 space-y-1">
              <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} className="w-full" justify="start" onClick={openLibrary}>Import from library</Button>
              <Button size="sm" variant="secondary" icon={<SaveIcon />} className="w-full" justify="start" onClick={exportToLibrary}>Export to library</Button>
            </div>
          </Panel>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-2 border-b border-msx-border">
            <input
              value={tile.name}
              onChange={event => onUpdate({ ...tile, name: event.target.value, updatedAt: new Date().toISOString() })}
              className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm w-48"
              aria-label="Tile name"
            />
            <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-xs">{width} x {height}</span>
            <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-xs">Active slot: {activeSlot}</span>
            {cursor && (
              <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-xs">({cursor.x},{cursor.y}) = {cursor.slot}</span>
            )}
            {swapState.active && (
              <span className="px-2 py-1 bg-amber-700 border border-amber-500 rounded text-xs text-amber-100">
                Swap mode{swapState.firstSlot !== null ? `: slot ${swapState.firstSlot} -> ?` : ''}
              </span>
            )}
            <div className="flex-grow" />
            <Button size="sm" variant="ghost" icon={<ZoomOutIcon />} onClick={() => changeZoom(-1)} aria-label="Zoom out" />
            <span className="w-12 text-center text-xs">{zoom}px</span>
            <Button size="sm" variant="ghost" icon={<ZoomInIcon />} onClick={() => changeZoom(1)} aria-label="Zoom in" />
            <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
              <GridIcon /> Grid
              <input type="checkbox" checked={showGrid} onChange={event => setShowGrid(event.target.checked)} />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-black/30 p-2 flex items-start justify-center">
            <canvas
              ref={canvasRef}
              className="block"
              style={{
                width: width * zoom,
                height: height * zoom,
                imageRendering: 'pixelated',
                flex: '0 0 auto',
                alignSelf: 'flex-start',
              }}
              onContextMenu={event => event.preventDefault()}
              onMouseDown={event => {
                setIsDrawing(true);
                handleMouse(event, true);
              }}
              onMouseMove={event => handleMouse(event)}
            />
          </div>
        </main>

        <aside className="w-64 border-l border-msx-border p-2 overflow-y-auto space-y-2 flex-shrink-0">
          <Panel title="Palette">
            <div className="p-2 space-y-2">
              <div className="text-xs text-msx-textsecondary break-words">
                {paletteAsset ? (
                  <>
                    Linked:{' '}
                    <button
                      type="button"
                      className="underline text-msx-accent"
                      onClick={() => onSelectAsset(paletteAsset.id, EditorType.Palette)}
                    >
                      {paletteAsset.name}
                    </button>
                  </>
                ) : (
                  <span className="text-amber-300">No palette asset linked. Double-click any color to create one.</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {slots.map(slot => (
                  <button
                    key={slot.slotIndex}
                    type="button"
                    className={`h-9 rounded border text-[0.65rem] ${activeSlot === slot.slotIndex ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'} ${palettePickerForSlot === slot.slotIndex ? 'outline outline-1 outline-msx-accent' : ''}`}
                    style={{ backgroundColor: slot.hex === TRANSPARENT_HEX ? '#111827' : slot.hex }}
                    onClick={() => setActiveSlot(slot.slotIndex)}
                    onDoubleClick={() => handleSlotDoubleClick(slot.slotIndex)}
                    title={`Slot ${slot.slotIndex}: ${slot.hex}. Double-click to ${paletteAsset ? 'open palette asset' : 'create a palette asset'}.`}
                  >
                    <span className="bg-black/40 px-1 rounded text-white">{slot.slotIndex}</span>
                  </button>
                ))}
              </div>
              <div className="text-[0.65rem] text-msx-textsecondary">
                Single click = select active color. Double-click = open (or create) palette asset. Slot 0 ignored.
              </div>
            </div>
          </Panel>

          <Panel title="Library file">
            <div className="p-2 space-y-1">
              <Button size="sm" variant="ghost" className="w-full" justify="start" icon={<SaveIcon />} onClick={exportLibraryFile}>Export library JSON</Button>
              <Button size="sm" variant="ghost" className="w-full" justify="start" icon={<LoadIcon />} onClick={() => libraryFileInputRef.current?.click()}>Import library JSON</Button>
              <input type="file" accept="application/json" ref={libraryFileInputRef} onChange={importLibraryFile} className="hidden" />
            </div>
          </Panel>

          <Panel title="Tile info">
            <div className="p-3 text-xs space-y-1 text-msx-textsecondary">
              <div>Source: {tile.sourceType}</div>
              <div>Mode: {tile.mode}</div>
              <div>Pixel count: {tile.pixelData.length}</div>
              {tile.sourceFileName && <div>Source file: {tile.sourceFileName}</div>}
              {tile.updatedAt && <div>Updated: {new Date(tile.updatedAt).toLocaleString()}</div>}
            </div>
          </Panel>
        </aside>
      </div>

      {showLibraryModal && (
        <Modal isOpen title="MSX2 Bitmap Tile Library" onClose={() => setShowLibraryModal(false)}>
          <div className="w-[640px] max-h-[70vh] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{libraryEntries.length} tile(s) in library</span>
              <Button size="sm" variant="ghost" onClick={() => setLibraryEntries(loadMsx2BitmapTileLibrary())}>Refresh</Button>
            </div>
            {libraryEntries.length === 0 ? (
              <div className="text-xs text-msx-textsecondary p-4">Library is empty. Use &quot;Export to library&quot; to save the current tile.</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {libraryEntries.map(entry => (
                  <div key={entry.id} className="border border-msx-border rounded p-1 flex flex-col items-center bg-msx-bgcolor">
                    <TilePreview entry={entry} size={56} />
                    <div className="text-[0.65rem] mt-1 truncate w-full text-center" title={entry.name}>{entry.name}</div>
                    <div className="text-[0.6rem] text-msx-textsecondary">{entry.tile.width}x{entry.tile.height}</div>
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" variant="secondary" onClick={() => importFromLibrary(entry)}>Load</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLibraryEntry(entry.id)} aria-label="Delete"><TrashIcon /></Button>
                      <Button size="sm" variant="ghost" onClick={() => exportMsx2BitmapTileLibraryEntryFile(entry)} aria-label="Export"><SaveIcon /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showCreatePaletteDialog && (
        <Modal isOpen title="No palette asset linked" onClose={() => { setShowCreatePaletteDialog(false); setPalettePickerForSlot(null); }}>
          <div className="w-[420px] space-y-3 text-sm">
            <p>This tile has no <em>palette</em> asset in the project. Double-clicking a palette color needs an editable palette asset.</p>
            <p>Create a new SCREEN 5 palette asset linked to this tile? You can edit it later from the Palette editor.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => { setShowCreatePaletteDialog(false); setPalettePickerForSlot(null); }}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={confirmCreatePalette}>Create palette asset</Button>
            </div>
          </div>
        </Modal>
      )}
    </Panel>
  );
};

const TilePreview: React.FC<{ entry: Msx2BitmapTileLibraryEntry; size: number }> = ({ entry, size }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { slots } = ensureScreen5PaletteSlots(entry.palette);
  const w = Math.max(1, Math.trunc(entry.tile.width) || DEFAULT_TILE_W);
  const h = Math.max(1, Math.trunc(entry.tile.height) || DEFAULT_TILE_H);
  const px = Math.max(1, Math.floor(size / Math.max(w, h)));
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = w * px;
    canvas.height = h * px;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const slot = entry.tile.pixelData[y * w + x] & 0x0f;
        ctx.fillStyle = resolveSlotHexForRender(slots, slot);
        ctx.fillRect(x * px, y * px, px, px);
      }
    }
  }, [entry, slots, w, h, px]);
  return <canvas ref={ref} className="block" style={{ imageRendering: 'pixelated' }} />;
};
