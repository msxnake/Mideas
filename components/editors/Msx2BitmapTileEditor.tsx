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
import { Tooltip } from '../common/Tooltip';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BlendIcon,
  CopyIcon,
  DropletIcon,
  EllipseShapeIcon,
  EraserIcon,
  EyeIcon,
  EyeOffIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  FolderOpenIcon,
  GridIcon,
  LineToolIcon,
  LoadIcon,
  PasteIcon,
  PencilIcon,
  PaintBrushIcon,
  RectShapeIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SaveIcon,
  ScissorsIcon,
  SelectionIcon,
  SprayIcon,
  StampIcon,
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

type TileTool =
  | 'brush'
  | 'erase'
  | 'fill'
  | 'gradient'
  | 'picker'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'spray'
  | 'select'
  | 'clone'
  | 'smudge'
  | 'zoom';
type BrushSize = 1 | 2 | 'dither';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';
const DEFAULT_TILE_W = 16;
const DEFAULT_TILE_H = 16;
const ZOOM_OPTIONS = [8, 16, 24, 32];
const DITHER_PATTERN: Array<[number, number]> = [[0, 0], [1, 1]];
const HISTORY_LIMIT = 60;
const SPRAY_RADIUS = 3;
const SPRAY_DOTS = 4;

interface Msx2BitmapTileEditorProps {
  tileAsset: ProjectAsset;
  allAssets: ProjectAsset[];
  worldPaletteAsset?: ProjectAsset;
  worldName?: string;
  onUpdate: (data: BitmapTileScreen5, newAssets?: ProjectAsset[]) => void;
  onSelectAsset: (assetId: string, editorType?: EditorType) => void;
  setStatusBarMessage?: (message: string) => void;
}

interface SelectionRect { x: number; y: number; w: number; h: number; }
interface FloatingSelection { pixels: number[][]; w: number; h: number; x: number; y: number; }
interface HistorySnapshot { pixelData: number[]; width: number; height: number; }
interface ShapePreview { x0: number; y0: number; x1: number; y1: number; }
type DragMode = 'paint' | 'shape' | 'marquee' | 'float' | 'clone' | 'smudge';
interface DragState {
  mode: DragMode;
  button: number;
  start: { x: number; y: number };
  last: { x: number; y: number };
  grabDX?: number;
  grabDY?: number;
  cloneDX?: number;
  cloneDY?: number;
  sourceGrid?: number[][];
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

const normalizeRect = (x0: number, y0: number, x1: number, y1: number): SelectionRect => ({
  x: Math.min(x0, x1),
  y: Math.min(y0, y1),
  w: Math.abs(x1 - x0) + 1,
  h: Math.abs(y1 - y0) + 1,
});

const pointInRect = (x: number, y: number, r: SelectionRect): boolean =>
  x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

const linePoints = (x0: number, y0: number, x1: number, y1: number): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return points;
};

const rectCells = (r: SelectionRect, filled: boolean): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (filled || y === r.y || y === r.y + r.h - 1 || x === r.x || x === r.x + r.w - 1) out.push([x, y]);
    }
  }
  return out;
};

const ellipseCells = (r: SelectionRect, filled: boolean): Array<[number, number]> => {
  const cx = r.x + (r.w - 1) / 2;
  const cy = r.y + (r.h - 1) / 2;
  const rx = Math.max(0.5, r.w / 2);
  const ry = Math.max(0.5, r.h / 2);
  const inside = (x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0000001;
  const out: Array<[number, number]> = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (!inside(x, y)) continue;
      if (filled || !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1)) out.push([x, y]);
    }
  }
  return out;
};

const shapeCells = (
  kind: 'line' | 'rect' | 'ellipse',
  preview: ShapePreview,
  filled: boolean,
): Array<[number, number]> => {
  if (kind === 'line') return linePoints(preview.x0, preview.y0, preview.x1, preview.y1);
  const r = normalizeRect(preview.x0, preview.y0, preview.x1, preview.y1);
  return kind === 'rect' ? rectCells(r, filled) : ellipseCells(r, filled);
};

interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, isOpen, onToggle, children, className = '' }) => (
  <section className={`rounded border border-msx-border bg-msx-panelbg ${className}`}>
    <div className="flex items-center justify-between gap-2 border-b border-msx-border px-2 py-1.5">
      <h4 className="text-sm pixel-font text-msx-highlight truncate">{title}</h4>
      <button
        type="button"
        className="text-msx-textsecondary hover:text-msx-highlight"
        onClick={onToggle}
        title={isOpen ? `Hide ${title}` : `Show ${title}`}
        aria-label={isOpen ? `Hide ${title}` : `Show ${title}`}
      >
        {isOpen ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
    {isOpen && <div className="p-2">{children}</div>}
  </section>
);

export const Msx2BitmapTileEditor: React.FC<Msx2BitmapTileEditorProps> = ({
  tileAsset,
  allAssets,
  worldPaletteAsset,
  worldName,
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
  const [bgSlot, setBgSlot] = useState(0);
  const [shapeFilled, setShapeFilled] = useState(false);
  const [zoom, setZoom] = useState<number>(16);
  const [showGrid, setShowGrid] = useState(true);
  const [cursor, setCursor] = useState<{ x: number; y: number; slot: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [swapState, setSwapState] = useState<{ active: boolean; firstSlot: number | null }>({
    active: false,
    firstSlot: null,
  });
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [floating, setFloating] = useState<FloatingSelection | null>(null);
  const [shapePreview, setShapePreview] = useState<ShapePreview | null>(null);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
  // Bumped whenever the undo/redo stacks (refs) change, so buttons re-render.
  const [, setHistVersion] = useState(0);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showCreatePaletteDialog, setShowCreatePaletteDialog] = useState(false);
  const [libraryEntries, setLibraryEntries] = useState<Msx2BitmapTileLibraryEntry[]>([]);
  const [palettePickerForSlot, setPalettePickerForSlot] = useState<number | null>(null);

  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);
  const clipboardRef = useRef<{ pixels: number[][]; w: number; h: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [openTools, setOpenTools] = useState(true);
  const [openEdit, setOpenEdit] = useState(true);
  const [openBrush, setOpenBrush] = useState(true);
  const [openSwap, setOpenSwap] = useState(false);
  const [openLibrary, setOpenLibrary] = useState(false);
  const [openPalette, setOpenPalette] = useState(true);
  const [openLibraryFile, setOpenLibraryFile] = useState(false);
  const [openTileInfo, setOpenTileInfo] = useState(true);

  const paletteAsset = useMemo(() => {
    if (!tile.paletteId) return undefined;
    return allAssets.find(asset => asset.id === tile.paletteId && asset.type === 'palette');
  }, [allAssets, tile.paletteId]);

  const paletteAssets = useMemo(
    () => allAssets.filter(asset => {
      if (asset.type !== 'palette') return false;
      const palette = asset.data as PaletteAsset | undefined;
      return palette?.mode === 'SCREEN4' || palette?.mode === 'SCREEN5';
    }),
    [allAssets],
  );

  const { slots } = useMemo(
    () => ensureScreen5PaletteSlots((paletteAsset?.data as PaletteAsset | undefined)?.slots),
    [paletteAsset],
  );

  const pixelsGrid = useMemo(
    () => flatToGrid(tile.pixelData, width, height),
    [tile.pixelData, width, height],
  );

  // Reset the per-tile editing session when another asset is opened.
  useEffect(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    dragRef.current = null;
    setSelection(null);
    setFloating(null);
    setShapePreview(null);
    setCloneSource(null);
    setIsDrawing(false);
    setHistVersion(v => v + 1);
  }, [tileAsset.id]);

  // --- History (undo/redo) ---
  const takeSnapshot = (): HistorySnapshot => ({ pixelData: [...tile.pixelData], width, height });

  const beginHistoryEntry = () => {
    undoStackRef.current.push(takeSnapshot());
    if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistVersion(v => v + 1);
  };

  const restoreSnapshot = (snap: HistorySnapshot) => {
    onUpdate({
      ...tile,
      width: snap.width,
      height: snap.height,
      pixelData: [...snap.pixelData],
      updatedAt: new Date().toISOString(),
    });
  };

  const undo = () => {
    const snap = undoStackRef.current.pop();
    if (!snap) return;
    redoStackRef.current.push(takeSnapshot());
    restoreSnapshot(snap);
    setSelection(null);
    setFloating(null);
    setShapePreview(null);
    setHistVersion(v => v + 1);
  };

  const redo = () => {
    const snap = redoStackRef.current.pop();
    if (!snap) return;
    undoStackRef.current.push(takeSnapshot());
    restoreSnapshot(snap);
    setSelection(null);
    setFloating(null);
    setShapePreview(null);
    setHistVersion(v => v + 1);
  };

  const commitGrid = (nextGrid: number[][], nextWidth = width, nextHeight = height) => {
    onUpdate({
      ...tile,
      width: nextWidth,
      height: nextHeight,
      pixelData: gridToFlat(nextGrid),
      updatedAt: new Date().toISOString(),
    });
  };

  // --- Brush footprint (shared by pencil, eraser, clone, smudge and line) ---
  const brushCells = (x: number, y: number): Array<[number, number]> => {
    const cells: Array<[number, number]> = [];
    const push = (cx: number, cy: number) => {
      if (cx >= 0 && cy >= 0 && cx < width && cy < height) cells.push([cx, cy]);
    };
    if (brushSize === 1) push(x, y);
    else if (brushSize === 2) {
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) push(x + dx, y + dy);
    } else {
      for (const [dx, dy] of DITHER_PATTERN) push(x + dx, y + dy);
    }
    return cells;
  };

  const applyBrushStroke = (x: number, y: number, rightClick: boolean) => {
    const value = tool === 'erase' ? 0 : rightClick ? bgSlot : activeSlot;
    const next = cloneGrid(pixelsGrid);
    for (const [bx, by] of brushCells(x, y)) next[by][bx] = value;
    commitGrid(next);
  };

  const applySprayAt = (x: number, y: number, rightClick: boolean) => {
    const value = rightClick ? bgSlot : activeSlot;
    const next = cloneGrid(pixelsGrid);
    for (let i = 0; i < SPRAY_DOTS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * SPRAY_RADIUS;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(y + Math.sin(angle) * radius);
      if (px >= 0 && py >= 0 && px < width && py < height) next[py][px] = value;
    }
    commitGrid(next);
  };

  const applyCloneAt = (x: number, y: number) => {
    const drag = dragRef.current;
    if (!drag || drag.cloneDX === undefined || drag.cloneDY === undefined || !drag.sourceGrid) return;
    const next = cloneGrid(pixelsGrid);
    for (const [px, py] of brushCells(x, y)) {
      const sx = px + drag.cloneDX;
      const sy = py + drag.cloneDY;
      if (sx >= 0 && sy >= 0 && sy < drag.sourceGrid.length && sx < (drag.sourceGrid[0]?.length || 0)) {
        next[py][px] = drag.sourceGrid[sy][sx];
      }
    }
    commitGrid(next);
  };

  // Indexed-palette "smudge": pull the neighbour colour along the drag direction,
  // but only on checkerboard cells, so edges blend as a dither instead of smearing.
  const applySmudgeAt = (x: number, y: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = Math.sign(x - drag.last.x);
    const dy = Math.sign(y - drag.last.y);
    if (dx === 0 && dy === 0) return;
    const next = cloneGrid(pixelsGrid);
    for (const [px, py] of brushCells(x, y)) {
      if (((px + py) & 1) !== 0) continue;
      const sx = px - dx;
      const sy = py - dy;
      if (sx >= 0 && sy >= 0 && sy < height && sx < width) next[py][px] = pixelsGrid[sy][sx];
    }
    commitGrid(next);
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

  // Flood-fills the clicked region with an FG/BG checkerboard (classic dither gradient).
  const applyGradientFill = (x: number, y: number, rightClick: boolean) => {
    const fg = rightClick ? bgSlot : activeSlot;
    const bg = rightClick ? activeSlot : bgSlot;
    const target = pixelsGrid[y][x];
    const next = cloneGrid(pixelsGrid);
    const visited = new Set<number>();
    const stack: Array<[number, number]> = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const key = cy * width + cx;
      if (visited.has(key) || pixelsGrid[cy][cx] !== target) continue;
      visited.add(key);
      next[cy][cx] = ((cx + cy) & 1) === 0 ? fg : bg;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    beginHistoryEntry();
    commitGrid(next);
  };

  // --- Selection helpers ---
  const extractRect = (r: SelectionRect): number[][] =>
    Array.from({ length: r.h }, (_row, y) => Array.from({ length: r.w }, (_col, x) => pixelsGrid[r.y + y][r.x + x]));

  const blitFloating = (base: number[][], float: FloatingSelection): number[][] => {
    for (let y = 0; y < float.h; y++) {
      for (let x = 0; x < float.w; x++) {
        const py = float.y + y;
        const px = float.x + x;
        if (py >= 0 && px >= 0 && py < height && px < width) base[py][px] = float.pixels[y][x];
      }
    }
    return base;
  };

  const stampFloating = () => {
    if (!floating) return;
    beginHistoryEntry();
    commitGrid(blitFloating(cloneGrid(pixelsGrid), floating));
    setFloating(null);
    setStatusBarMessage?.('Selección fijada en el tile.');
  };

  const copySelection = () => {
    if (floating) {
      clipboardRef.current = { pixels: floating.pixels.map(row => [...row]), w: floating.w, h: floating.h };
      setStatusBarMessage?.(`Copiado ${floating.w}x${floating.h} al portapapeles.`);
      return;
    }
    if (!selection) {
      setStatusBarMessage?.('No hay selección que copiar (herramienta Select).');
      return;
    }
    clipboardRef.current = { pixels: extractRect(selection), w: selection.w, h: selection.h };
    setStatusBarMessage?.(`Copiado ${selection.w}x${selection.h} al portapapeles.`);
  };

  const fillSelectionWith = (r: SelectionRect, value: number) => {
    beginHistoryEntry();
    const next = cloneGrid(pixelsGrid);
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) next[y][x] = value;
    commitGrid(next);
  };

  const cutSelection = () => {
    if (!selection) {
      setStatusBarMessage?.('No hay selección que cortar (herramienta Select).');
      return;
    }
    clipboardRef.current = { pixels: extractRect(selection), w: selection.w, h: selection.h };
    fillSelectionWith(selection, bgSlot);
    setSelection(null);
    setStatusBarMessage?.('Selección cortada al portapapeles.');
  };

  const deleteSelection = () => {
    if (!selection) {
      setStatusBarMessage?.('No hay selección que borrar (herramienta Select).');
      return;
    }
    fillSelectionWith(selection, bgSlot);
    setSelection(null);
  };

  const pasteClipboard = () => {
    const clip = clipboardRef.current;
    if (!clip) {
      setStatusBarMessage?.('Portapapeles vacío: copia una selección primero.');
      return;
    }
    if (floating) stampFloating();
    setSelection(null);
    setFloating({ pixels: clip.pixels.map(row => [...row]), w: clip.w, h: clip.h, x: 0, y: 0 });
    setTool('select');
    setStatusBarMessage?.('Pegado: arrastra la selección y haz clic fuera para fijarla.');
  };

  const swapFgBg = () => {
    setActiveSlot(bgSlot);
    setBgSlot(activeSlot);
  };

  const pointFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.floor((event.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (height / rect.height));
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return { x, y };
  };

  const handleSwapClick = (x: number, y: number) => {
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
      beginHistoryEntry();
      const next = pixelsGrid.map(row => row.map(value => (value === a ? b : value === b ? a : value)));
      commitGrid(next);
      setStatusBarMessage?.(`Swapped slots ${a} <-> ${b} in this tile (palette untouched).`);
      setSwapState({ active: false, firstSlot: null });
    }
  };

  const handleSelectMouseDown = (x: number, y: number, rightClick: boolean) => {
    if (rightClick) {
      if (floating) stampFloating();
      setSelection(null);
      return;
    }
    if (floating) {
      if (pointInRect(x, y, { x: floating.x, y: floating.y, w: floating.w, h: floating.h })) {
        dragRef.current = { mode: 'float', button: 0, start: { x, y }, last: { x, y }, grabDX: x - floating.x, grabDY: y - floating.y };
        setIsDrawing(true);
        return;
      }
      stampFloating();
    }
    if (selection && pointInRect(x, y, selection)) {
      // Lift the selection into a floating buffer (source hole = BG slot) and start moving it.
      beginHistoryEntry();
      const lifted = extractRect(selection);
      const next = cloneGrid(pixelsGrid);
      for (let sy = selection.y; sy < selection.y + selection.h; sy++) {
        for (let sx = selection.x; sx < selection.x + selection.w; sx++) next[sy][sx] = bgSlot;
      }
      commitGrid(next);
      setFloating({ pixels: lifted, w: selection.w, h: selection.h, x: selection.x, y: selection.y });
      dragRef.current = { mode: 'float', button: 0, start: { x, y }, last: { x, y }, grabDX: x - selection.x, grabDY: y - selection.y };
      setSelection(null);
      setIsDrawing(true);
      return;
    }
    dragRef.current = { mode: 'marquee', button: 0, start: { x, y }, last: { x, y } };
    setSelection({ x, y, w: 1, h: 1 });
    setIsDrawing(true);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.button !== 2) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    const rightClick = event.button === 2;
    setCursor({ ...point, slot: pixelsGrid[point.y][point.x] });

    if (swapState.active) {
      handleSwapClick(point.x, point.y);
      return;
    }

    switch (tool) {
      case 'picker':
        if (rightClick) setBgSlot(pixelsGrid[point.y][point.x] || 0);
        else setActiveSlot(pixelsGrid[point.y][point.x] || 0);
        return;
      case 'zoom':
        changeZoom(rightClick ? -1 : 1);
        return;
      case 'fill':
        beginHistoryEntry();
        commitGrid(floodFill(pixelsGrid, point.x, point.y, rightClick ? bgSlot : activeSlot));
        return;
      case 'gradient':
        applyGradientFill(point.x, point.y, rightClick);
        return;
      case 'line':
      case 'rect':
      case 'ellipse':
        dragRef.current = { mode: 'shape', button: event.button, start: point, last: point };
        setShapePreview({ x0: point.x, y0: point.y, x1: point.x, y1: point.y });
        setIsDrawing(true);
        return;
      case 'select':
        handleSelectMouseDown(point.x, point.y, rightClick);
        return;
      case 'clone':
        if (event.altKey) {
          setCloneSource(point);
          setStatusBarMessage?.(`Clone: origen fijado en (${point.x},${point.y}). Pinta para copiar desde ahí.`);
          return;
        }
        if (!cloneSource) {
          setStatusBarMessage?.('Clone: Alt+clic para fijar el origen primero.');
          return;
        }
        beginHistoryEntry();
        dragRef.current = {
          mode: 'clone',
          button: event.button,
          start: point,
          last: point,
          cloneDX: cloneSource.x - point.x,
          cloneDY: cloneSource.y - point.y,
          sourceGrid: cloneGrid(pixelsGrid),
        };
        applyCloneAt(point.x, point.y);
        setIsDrawing(true);
        return;
      case 'smudge':
        beginHistoryEntry();
        dragRef.current = { mode: 'smudge', button: event.button, start: point, last: point };
        setIsDrawing(true);
        return;
      case 'spray':
        beginHistoryEntry();
        dragRef.current = { mode: 'paint', button: event.button, start: point, last: point };
        applySprayAt(point.x, point.y, rightClick);
        setIsDrawing(true);
        return;
      default:
        beginHistoryEntry();
        dragRef.current = { mode: 'paint', button: event.button, start: point, last: point };
        applyBrushStroke(point.x, point.y, rightClick);
        setIsDrawing(true);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;
    setCursor({ ...point, slot: pixelsGrid[point.y][point.x] });
    const drag = dragRef.current;
    if (!isDrawing || !drag) return;
    switch (drag.mode) {
      case 'paint':
        if (tool === 'spray') applySprayAt(point.x, point.y, drag.button === 2);
        else applyBrushStroke(point.x, point.y, drag.button === 2);
        drag.last = point;
        break;
      case 'shape':
        setShapePreview({ x0: drag.start.x, y0: drag.start.y, x1: point.x, y1: point.y });
        drag.last = point;
        break;
      case 'marquee':
        setSelection(normalizeRect(drag.start.x, drag.start.y, point.x, point.y));
        drag.last = point;
        break;
      case 'float':
        setFloating(current => current && ({ ...current, x: point.x - (drag.grabDX || 0), y: point.y - (drag.grabDY || 0) }));
        drag.last = point;
        break;
      case 'clone':
        applyCloneAt(point.x, point.y);
        drag.last = point;
        break;
      case 'smudge':
        applySmudgeAt(point.x, point.y);
        drag.last = point;
        break;
    }
  };

  const commitShapeFromDrag = (drag: DragState, preview: ShapePreview) => {
    if (tool !== 'line' && tool !== 'rect' && tool !== 'ellipse') return;
    const value = drag.button === 2 ? bgSlot : activeSlot;
    const cells = shapeCells(tool, preview, shapeFilled);
    beginHistoryEntry();
    const next = cloneGrid(pixelsGrid);
    if (tool === 'line') {
      for (const [x, y] of cells) for (const [bx, by] of brushCells(x, y)) next[by][bx] = value;
    } else {
      for (const [x, y] of cells) {
        if (x >= 0 && y >= 0 && x < width && y < height) next[y][x] = value;
      }
    }
    commitGrid(next);
    setShapePreview(null);
  };

  // Global mouseup finishes strokes/drags. Registered every render so the handler
  // always sees fresh state (shape commits need the current preview and grid).
  useEffect(() => {
    const stop = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      setIsDrawing(false);
      if (drag?.mode === 'shape' && shapePreview) commitShapeFromDrag(drag, shapePreview);
    };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  });

  // Keyboard shortcuts: Ctrl+Z/Y undo-redo, Ctrl+C/X/V clipboard, Supr delete, X swap FG/BG.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      const ctrl = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (ctrl && key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
      else if ((ctrl && key === 'y') || (ctrl && event.shiftKey && key === 'z')) { event.preventDefault(); redo(); }
      else if (ctrl && key === 'c') { if (selection || floating) { event.preventDefault(); copySelection(); } }
      else if (ctrl && key === 'x') { if (selection) { event.preventDefault(); cutSelection(); } }
      else if (ctrl && key === 'v') { event.preventDefault(); pasteClipboard(); }
      else if (event.key === 'Delete' && selection) { event.preventDefault(); deleteSelection(); }
      else if (event.key === 'Escape') {
        if (floating) setStatusBarMessage?.('Selección flotante descartada (Ctrl+Z para recuperar el hueco).');
        setFloating(null);
        setSelection(null);
        setShapePreview(null);
      } else if (!ctrl && key === 'x') { swapFgBg(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Canvas rendering (base pixels + overlays) ---
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
    if (floating) {
      for (let y = 0; y < floating.h; y++) {
        for (let x = 0; x < floating.w; x++) {
          ctx.fillStyle = resolveSlotHexForRender(slots, floating.pixels[y][x] & 0x0f);
          ctx.fillRect((floating.x + x) * zoom, (floating.y + y) * zoom, zoom, zoom);
        }
      }
    }
    if (shapePreview && (tool === 'line' || tool === 'rect' || tool === 'ellipse')) {
      const value = dragRef.current?.button === 2 ? bgSlot : activeSlot;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = resolveSlotHexForRender(slots, value);
      for (const [x, y] of shapeCells(tool, shapePreview, shapeFilled)) {
        if (tool === 'line') {
          for (const [bx, by] of brushCells(x, y)) ctx.fillRect(bx * zoom, by * zoom, zoom, zoom);
        } else if (x >= 0 && y >= 0 && x < width && y < height) {
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
      ctx.globalAlpha = 1;
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
    const drawAnts = (x: number, y: number, w: number, h: number) => {
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(x * zoom + 0.5, y * zoom + 0.5, w * zoom - 1, h * zoom - 1);
      ctx.lineDashOffset = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x * zoom + 0.5, y * zoom + 0.5, w * zoom - 1, h * zoom - 1);
      ctx.lineDashOffset = 0;
      ctx.setLineDash([]);
    };
    if (selection) drawAnts(selection.x, selection.y, selection.w, selection.h);
    if (floating) drawAnts(floating.x, floating.y, floating.w, floating.h);
    if (tool === 'clone' && cloneSource) {
      const cx = (cloneSource.x + 0.5) * zoom;
      const cy = (cloneSource.y + 0.5) * zoom;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - zoom * 0.4, cy);
      ctx.lineTo(cx + zoom * 0.4, cy);
      ctx.moveTo(cx, cy - zoom * 0.4);
      ctx.lineTo(cx, cy + zoom * 0.4);
      ctx.stroke();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(cloneSource.x * zoom + 0.5, cloneSource.y * zoom + 0.5, zoom - 1, zoom - 1);
    }
  }, [pixelsGrid, slots, zoom, showGrid, width, height, floating, selection, shapePreview, cloneSource, tool, activeSlot, bgSlot, shapeFilled, brushSize]);

  const shift = (direction: 'up' | 'down' | 'left' | 'right') => {
    beginHistoryEntry();
    const source = floating ? blitFloating(cloneGrid(pixelsGrid), floating) : pixelsGrid;
    setFloating(null);
    setSelection(null);
    const next = cloneGrid(source);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sx = x;
        let sy = y;
        if (direction === 'up') sy = (y + 1) % height;
        else if (direction === 'down') sy = (y - 1 + height) % height;
        else if (direction === 'left') sx = (x + 1) % width;
        else if (direction === 'right') sx = (x - 1 + width) % width;
        next[y][x] = source[sy][sx];
      }
    }
    commitGrid(next);
  };

  const rotate = (direction: 'clockwise' | 'counterclockwise') => {
    beginHistoryEntry();
    const source = floating ? blitFloating(cloneGrid(pixelsGrid), floating) : pixelsGrid;
    setFloating(null);
    setSelection(null);
    const nextWidth = height;
    const nextHeight = width;
    const next = Array.from({ length: nextHeight }, (_, y) =>
      Array.from({ length: nextWidth }, (_, x) => (
        direction === 'clockwise'
          ? source[height - 1 - x][y]
          : source[x][width - 1 - y]
      )),
    );
    commitGrid(next, nextWidth, nextHeight);
    setStatusBarMessage?.(`Rotated tile 90° ${direction === 'clockwise' ? 'right' : 'left'}.`);
  };

  const mirror = (direction: 'horizontal' | 'vertical') => {
    beginHistoryEntry();
    const source = floating ? blitFloating(cloneGrid(pixelsGrid), floating) : pixelsGrid;
    setFloating(null);
    setSelection(null);
    const next = direction === 'horizontal'
      ? source.map(row => [...row].reverse())
      : [...source].reverse().map(row => [...row]);
    commitGrid(next);
    setStatusBarMessage?.(`Mirrored tile ${direction === 'horizontal' ? 'horizontally' : 'vertically'}.`);
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

  const activatePalette = (paletteId: string) => {
    const nextPalette = allAssets.find(asset => asset.id === paletteId && asset.type === 'palette');
    if (!nextPalette) {
      setStatusBarMessage?.('Palette asset not found.');
      return;
    }
    onUpdate({ ...tile, paletteId, updatedAt: new Date().toISOString() });
    setStatusBarMessage?.(`Activated palette "${nextPalette.name}" for tile "${tile.name}".`);
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

  const openLibraryModal = () => {
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
    beginHistoryEntry();
    setFloating(null);
    setSelection(null);
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

  const toolHints: Partial<Record<TileTool, string>> = {
    gradient: 'Relleno con trama FG/BG (clic en una zona).',
    line: 'Arrastra para trazar una línea recta.',
    rect: 'Arrastra para dibujar un rectángulo.',
    ellipse: 'Arrastra para dibujar una elipse.',
    spray: 'Mantén pulsado para rociar píxeles aleatorios.',
    select: 'Arrastra para seleccionar; arrastra dentro para mover. Ctrl+C/X/V, Supr.',
    clone: 'Alt+clic fija el origen; luego pinta para clonar.',
    smudge: 'Arrastra sobre un borde para difuminarlo con trama.',
    zoom: 'Clic = acercar, clic derecho = alejar.',
  };

  const selectTool = (id: TileTool) => {
    setTool(id);
    setSwapState({ active: false, firstSlot: null });
    setShapePreview(null);
    if (id !== 'select' && floating) stampFloating();
    if (toolHints[id]) setStatusBarMessage?.(toolHints[id]!);
  };

  const tools: Array<{ id: TileTool; label: string; icon: React.ReactNode; title?: string }> = [
    { id: 'brush', label: 'Pencil', icon: <PencilIcon /> },
    { id: 'erase', label: 'Eraser', icon: <EraserIcon /> },
    { id: 'fill', label: 'Fill', icon: <PaintBrushIcon /> },
    { id: 'gradient', label: 'Dither fill', icon: <BlendIcon />, title: 'Relleno degradado con trama FG/BG' },
    { id: 'line', label: 'Line', icon: <LineToolIcon /> },
    { id: 'rect', label: 'Rect', icon: <RectShapeIcon /> },
    { id: 'ellipse', label: 'Ellipse', icon: <EllipseShapeIcon /> },
    { id: 'spray', label: 'Spray', icon: <SprayIcon /> },
    { id: 'select', label: 'Select', icon: <SelectionIcon />, title: 'Selección rectangular: mover, copiar, pegar' },
    { id: 'clone', label: 'Clone', icon: <StampIcon />, title: 'Tampón de clonar (Alt+clic = origen)' },
    { id: 'smudge', label: 'Smudge', icon: <DropletIcon />, title: 'Difuminar bordes con trama' },
    { id: 'picker', label: 'Picker', icon: <ViewfinderCircleIcon />, title: 'Clic = FG, clic derecho = BG' },
    { id: 'zoom', label: 'Zoom', icon: <ZoomInIcon />, title: 'Clic = acercar, clic derecho = alejar' },
  ];

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  return (
    <Panel
      title="MSX2 SCREEN 5 Bitmap Tile Editor"
      icon={<TilesetIcon />}
      className="h-full min-h-0 flex flex-col bg-msx-bgcolor"
      bodyClassName="flex-grow flex flex-col min-h-0 overflow-hidden p-0"
    >
      {/* select-none: dragging on the canvas must never start a browser text selection
          (Chrome shows its Gemini popup over selected text, hijacking the drawing). */}
      <div className="flex flex-grow min-h-0 overflow-hidden select-none">
        <aside className="w-56 border-r border-msx-border p-2 overflow-y-auto space-y-2 flex-shrink-0">
          <CollapsiblePanel title="Tools" isOpen={openTools} onToggle={() => setOpenTools(v => !v)}>
            <div className="p-1 grid grid-cols-2 gap-1">
              {tools.map(entry => (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={tool === entry.id && !swapState.active ? 'primary' : 'ghost'}
                  icon={entry.icon}
                  className="w-full"
                  justify="start"
                  title={entry.title || entry.label}
                  onClick={() => selectTool(entry.id)}
                >
                  <span className="truncate text-[0.65rem]">{entry.label}</span>
                </Button>
              ))}
            </div>
            {(tool === 'rect' || tool === 'ellipse') && (
              <div className="grid grid-cols-2 gap-1 px-1 pt-1">
                <Button size="sm" variant={!shapeFilled ? 'primary' : 'ghost'} onClick={() => setShapeFilled(false)}>Contorno</Button>
                <Button size="sm" variant={shapeFilled ? 'primary' : 'ghost'} onClick={() => setShapeFilled(true)}>Relleno</Button>
              </div>
            )}
            {tool === 'clone' && (
              <div className="px-1 pt-1 text-[0.6rem] text-msx-textsecondary">
                {cloneSource ? `Origen: (${cloneSource.x},${cloneSource.y})` : 'Alt+clic para fijar el origen.'}
              </div>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="Edición" isOpen={openEdit} onToggle={() => setOpenEdit(v => !v)}>
            <div className="p-1 space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="secondary" icon={<ArrowUturnLeftIcon />} disabled={!canUndo} onClick={undo} title="Deshacer (Ctrl+Z)">Undo</Button>
                <Button size="sm" variant="secondary" icon={<ArrowUturnRightIcon />} disabled={!canRedo} onClick={redo} title="Rehacer (Ctrl+Y)">Redo</Button>
                <Button size="sm" variant="ghost" icon={<CopyIcon />} disabled={!selection && !floating} onClick={copySelection} title="Copiar selección (Ctrl+C)">Copy</Button>
                <Button size="sm" variant="ghost" icon={<ScissorsIcon />} disabled={!selection} onClick={cutSelection} title="Cortar selección (Ctrl+X)">Cut</Button>
                <Button size="sm" variant="ghost" icon={<PasteIcon />} onClick={pasteClipboard} title="Pegar (Ctrl+V)">Paste</Button>
                <Button size="sm" variant="ghost" icon={<TrashIcon />} disabled={!selection} onClick={deleteSelection} title="Borrar selección (Supr)">Del</Button>
              </div>
              <div className="text-[0.6rem] text-msx-textsecondary">
                Ctrl+Z/Y deshacer/rehacer · Ctrl+C/X/V · Supr borra · Esc descarta · X intercambia FG/BG.
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Brush size" isOpen={openBrush} onToggle={() => setOpenBrush(v => !v)}>
            <div className="p-2 space-y-1">
              <Button size="sm" variant={brushSize === 1 ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setBrushSize(1)}>1 pixel</Button>
              <Button size="sm" variant={brushSize === 2 ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setBrushSize(2)}>2x2 pixels</Button>
              <Button size="sm" variant={brushSize === 'dither' ? 'primary' : 'ghost'} className="w-full" justify="start" onClick={() => setBrushSize('dither')}>Dither 2x2 (10/01)</Button>
              <div className="text-[0.65rem] text-msx-textsecondary pt-1">Applies to Pencil, Line, Clone and Smudge. Right-click paints with BG color.</div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Color swap (this tile)" isOpen={openSwap} onToggle={() => setOpenSwap(v => !v)}>
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
          </CollapsiblePanel>

          <CollapsiblePanel title="Library" isOpen={openLibrary} onToggle={() => setOpenLibrary(v => !v)}>
            <div className="p-2 space-y-1">
              <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} className="w-full" justify="start" onClick={openLibraryModal}>Import from library</Button>
              <Button size="sm" variant="secondary" icon={<SaveIcon />} className="w-full" justify="start" onClick={exportToLibrary}>Export to library</Button>
            </div>
          </CollapsiblePanel>
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
            <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-xs flex items-center gap-1">
              FG
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-msx-border align-middle" style={{ backgroundColor: resolveSlotHexForRender(slots, activeSlot) }} />
              {activeSlot}
              · BG
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-msx-border align-middle" style={{ backgroundColor: resolveSlotHexForRender(slots, bgSlot) }} />
              {bgSlot}
            </span>
            {cursor && (
              <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-xs">({cursor.x},{cursor.y}) = {cursor.slot}</span>
            )}
            {swapState.active && (
              <span className="px-2 py-1 bg-amber-700 border border-amber-500 rounded text-xs text-amber-100">
                Swap mode{swapState.firstSlot !== null ? `: slot ${swapState.firstSlot} -> ?` : ''}
              </span>
            )}
            <div className="flex-grow" />
            <Button size="sm" variant="ghost" icon={<ArrowUturnLeftIcon />} disabled={!canUndo} onClick={undo} aria-label="Undo" title="Deshacer (Ctrl+Z)" />
            <Button size="sm" variant="ghost" icon={<ArrowUturnRightIcon />} disabled={!canRedo} onClick={redo} aria-label="Redo" title="Rehacer (Ctrl+Y)" />
            <Button size="sm" variant="ghost" icon={<ZoomOutIcon />} onClick={() => changeZoom(-1)} aria-label="Zoom out" />
            <span className="w-12 text-center text-xs">{zoom}px</span>
            <Button size="sm" variant="ghost" icon={<ZoomInIcon />} onClick={() => changeZoom(1)} aria-label="Zoom in" />
            <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
              <GridIcon /> Grid
              <input type="checkbox" checked={showGrid} onChange={event => setShowGrid(event.target.checked)} />
            </label>
          </div>

          {/* --- Transforms toolbar: rotate / mirror / shift (icon-only, tooltip) --- */}
          <div className="flex items-center gap-3 px-2 py-1 border-b border-msx-border bg-msx-panelbg/50">
            <span className="text-[0.65rem] uppercase tracking-wide text-msx-textsecondary select-none pr-1">Transforms</span>

            {/* Rotate */}
            <div className="flex items-center gap-1">
              <Tooltip text="Rotar 90° a l'esquerra" position="bottom">
                <button
                  type="button"
                  onClick={() => rotate('counterclockwise')}
                  aria-label="Rotar 90° a l'esquerra"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <RotateCcwIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text="Rotar 90° a la dreta" position="bottom">
                <button
                  type="button"
                  onClick={() => rotate('clockwise')}
                  aria-label="Rotar 90° a la dreta"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <RotateCwIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div className="h-5 w-px bg-msx-border" />

            {/* Mirror / Flip */}
            <div className="flex items-center gap-1">
              <Tooltip text="Espill horitzontal (Flip H)" position="bottom">
                <button
                  type="button"
                  onClick={() => mirror('horizontal')}
                  aria-label="Espill horitzontal"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <FlipHorizontalIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text="Espill vertical (Flip V)" position="bottom">
                <button
                  type="button"
                  onClick={() => mirror('vertical')}
                  aria-label="Espill vertical"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <FlipVerticalIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div className="h-5 w-px bg-msx-border" />

            {/* Shift (toroidal) */}
            <div className="flex items-center gap-1">
              <Tooltip text="Desplaçar patró amunt (cíclic)" position="bottom">
                <button
                  type="button"
                  onClick={() => shift('up')}
                  aria-label="Desplaçar amunt"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text="Desplaçar patró avall (cíclic)" position="bottom">
                <button
                  type="button"
                  onClick={() => shift('down')}
                  aria-label="Desplaçar avall"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <ArrowDownIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text="Desplaçar patró a l'esquerra (cíclic)" position="bottom">
                <button
                  type="button"
                  onClick={() => shift('left')}
                  aria-label="Desplaçar a l'esquerra"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text="Desplaçar patró a la dreta (cíclic)" position="bottom">
                <button
                  type="button"
                  onClick={() => shift('right')}
                  aria-label="Desplaçar a la dreta"
                  className="flex h-8 w-8 items-center justify-center rounded text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary transition-colors duration-150"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <span className="text-[0.65rem] text-msx-textsecondary select-none">Desplaçament cíclic (toroïdal)</span>
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
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
            />
          </div>
        </main>

        <aside className="w-64 border-l border-msx-border p-2 overflow-y-auto space-y-2 flex-shrink-0">
          <CollapsiblePanel title="Palette" isOpen={openPalette} onToggle={() => setOpenPalette(v => !v)}>
            <div className="p-2 space-y-2">
              <div className="space-y-1 text-xs text-msx-textsecondary">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-msx-highlight">Active palette</span>
                  {paletteAsset && (
                    <button
                      type="button"
                      className="underline text-msx-accent"
                      onClick={() => onSelectAsset(paletteAsset.id, EditorType.Palette)}
                    >
                      Open
                    </button>
                  )}
                </div>
                <select
                  value={paletteAsset ? tile.paletteId : ''}
                  onChange={event => activatePalette(event.target.value)}
                  className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-xs text-msx-textprimary"
                  title="Palette asset used to render and import this bitmap tile"
                >
                  {!paletteAsset && <option value="">Missing palette: choose one</option>}
                  {paletteAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}{worldPaletteAsset?.id === asset.id ? ' (current world)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-msx-textsecondary break-words">
                World:{' '}
                {worldPaletteAsset ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="underline text-msx-accent"
                      onClick={() => onSelectAsset(worldPaletteAsset.id, EditorType.Palette)}
                      title={`Open world palette${worldName ? ` for ${worldName}` : ''}`}
                    >
                      {worldPaletteAsset.name}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-msx-highlight px-2 py-0.5 text-[0.65rem] text-msx-highlight hover:bg-msx-highlight/20 disabled:opacity-40"
                      onClick={() => activatePalette(worldPaletteAsset.id)}
                      disabled={tile.paletteId === worldPaletteAsset.id}
                      title="Use current world's palette for this tile"
                    >
                      Use
                    </button>
                  </span>
                ) : (
                  <span className="text-amber-300">
                    {worldName ? `${worldName} has no palette asset linked.` : 'No current world palette linked.'}
                  </span>
                )}
              </div>
              {worldPaletteAsset && tile.paletteId !== worldPaletteAsset.id && (
                <div className="rounded border border-amber-500/60 bg-amber-950/30 px-2 py-1 text-[0.65rem] text-amber-200">
                  This tile uses another palette; choose the current world palette to keep colors identical when placed.
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-14 flex-shrink-0" title={`FG slot ${activeSlot} · BG slot ${bgSlot}`}>
                  <span
                    className="absolute right-0 bottom-0 h-7 w-7 rounded border border-msx-border"
                    style={{ backgroundColor: resolveSlotHexForRender(slots, bgSlot) }}
                  />
                  <span
                    className="absolute left-0 top-0 h-8 w-8 rounded border-2 border-white shadow"
                    style={{ backgroundColor: resolveSlotHexForRender(slots, activeSlot) }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight"
                  onClick={swapFgBg}
                  title="Intercambia FG y BG (tecla X)"
                >
                  <SwapHorizIcon />
                </button>
                <div className="text-[0.6rem] text-msx-textsecondary">FG {activeSlot} · BG {bgSlot}</div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {slots.map(slot => (
                  <button
                    key={slot.slotIndex}
                    type="button"
                    className={`relative h-9 rounded border text-[0.65rem] ${activeSlot === slot.slotIndex ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'} ${palettePickerForSlot === slot.slotIndex ? 'outline outline-1 outline-msx-accent' : ''}`}
                    style={{ backgroundColor: slot.hex === TRANSPARENT_HEX ? '#111827' : slot.hex }}
                    onClick={() => setActiveSlot(slot.slotIndex)}
                    onContextMenu={event => {
                      event.preventDefault();
                      setBgSlot(slot.slotIndex);
                    }}
                    onDoubleClick={() => handleSlotDoubleClick(slot.slotIndex)}
                    title={`Slot ${slot.slotIndex}: ${slot.hex}. Clic = FG, clic derecho = BG. Double-click to ${paletteAsset ? 'open palette asset' : 'create a palette asset'}.`}
                  >
                    <span className="bg-black/40 px-1 rounded text-white">{slot.slotIndex}</span>
                    {bgSlot === slot.slotIndex && (
                      <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-0.5 text-[0.5rem] leading-tight text-white">BG</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="text-[0.65rem] text-msx-textsecondary">
                Click = FG color. Right-click = BG color. Double-click = open (or create) palette asset.
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Library file" isOpen={openLibraryFile} onToggle={() => setOpenLibraryFile(v => !v)}>
            <div className="p-2 space-y-1">
              <Button size="sm" variant="ghost" className="w-full" justify="start" icon={<SaveIcon />} onClick={exportLibraryFile}>Export library JSON</Button>
              <Button size="sm" variant="ghost" className="w-full" justify="start" icon={<LoadIcon />} onClick={() => libraryFileInputRef.current?.click()}>Import library JSON</Button>
              <input type="file" accept="application/json" ref={libraryFileInputRef} onChange={importLibraryFile} className="hidden" />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Tile info" isOpen={openTileInfo} onToggle={() => setOpenTileInfo(v => !v)}>
            <div className="p-3 text-xs space-y-1 text-msx-textsecondary">
              <div>Source: {tile.sourceType}</div>
              <div>Mode: {tile.mode}</div>
              <div>Pixel count: {tile.pixelData.length}</div>
              {tile.sourceFileName && <div>Source file: {tile.sourceFileName}</div>}
              {tile.updatedAt && <div>Updated: {new Date(tile.updatedAt).toLocaleString()}</div>}
            </div>
          </CollapsiblePanel>
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
