import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PaletteAsset, Msx2Screen4Tile, Screen5PaletteSlot } from '../../types';
import { Button } from '../common/Button';
import {
  computeContentCropRect,
  defaultReplaceableMsx2SpriteSlots,
} from '../../utils/msx2ExternalSpriteImport';
import {
  importExternalPngAsMsx2Tiles,
  isMsx2TileEmpty,
  Msx2ExternalTileImportOptions,
} from '../../utils/msx2ExternalTileImport';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

interface Msx2ExternalTileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Adds the quantized tiles (and the palette they map to) to the library. */
  onAddTiles: (
    tiles: Msx2Screen4Tile[],
    palette: Screen5PaletteSlot[],
    outputMode: 'screen4' | 'screen5',
    layout?: { columns: number; rows: number; baseName: string },
  ) => void;
  /**
   * Preselects the "Tipo de tile" output. SCREEN 5 hosts (bitmap rooms) pass
   * 'screen5' so an imported PNG lands directly in the active atlas instead of
   * defaulting to the SCREEN 4 color-clash library. Defaults to 'screen4'.
   */
  defaultOutputMode?: 'screen4' | 'screen5';
  /** Active screen/world palette used by SCREEN 5 rooms. */
  destPalette?: Screen5PaletteSlot[] | null;
  /** Project palette assets that can be activated as the import palette. */
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
  /** Existing global library names. Used to prevent accidental overwrite/collision. */
  existingLibraryNames?: string[];
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const isImmutableSlot = (hex: string | undefined): boolean => {
  const normalized = normalizeHex(hex);
  return normalized === normalizeHex(TRANSPARENT_HEX) || normalized === '#000000' || normalized === '#FFFFFF';
};

/** Renders a slot-indexed tile using the supplied palette. */
const TilePreview: React.FC<{
  tile: Msx2Screen4Tile;
  palette: Screen5PaletteSlot[];
  zoom?: number;
  /** Draws a thin white/black separator outline so tiles read as a grid. */
  gridLine?: boolean;
}> = ({ tile, palette, zoom = 6, gridLine = false }) => {
  const width = tile.width ?? 16;
  const height = tile.height ?? 16;
  return (
    <div
      className="grid bg-black"
      style={{
        width: width * zoom,
        height: height * zoom,
        gridTemplateColumns: `repeat(${width}, ${zoom}px)`,
        gridTemplateRows: `repeat(${height}, ${zoom}px)`,
        imageRendering: 'pixelated',
        outline: gridLine ? '1px solid #ffffff' : 'none',
        outlineOffset: '-1px',
      }}
    >
      {Array.from({ length: height }).map((_, y) =>
        Array.from({ length: width }).map((__, x) => {
          const slot = tile.pixels?.[y]?.[x] ?? 0;
          const hex = palette[slot]?.hex || '#000000';
          return (
            <div
              key={`${x}-${y}`}
              style={{
                width: zoom,
                height: zoom,
                backgroundColor: slot === 0 || normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX) ? 'transparent' : hex,
              }}
            />
          );
        })
      )}
    </div>
  );
};

export const Msx2ExternalTileImportModal: React.FC<Msx2ExternalTileImportModalProps> = ({
  isOpen,
  onClose,
  onAddTiles,
  defaultOutputMode = 'screen4',
  destPalette,
  paletteAssets = [],
  existingLibraryNames = [],
}) => {
  const defaultPalette = useMemo(() => createDefaultScreen5PaletteSlots(), []);
  const initialPalette = useMemo(
    () => ensureScreen5PaletteSlots(destPalette || defaultPalette).slots,
    [defaultPalette, destPalette],
  );
  const [activePaletteSourceId, setActivePaletteSourceId] = useState('__screen__');
  const palette = useMemo(() => {
    if (activePaletteSourceId === '__screen__') return initialPalette;
    if (activePaletteSourceId === '__default__') return defaultPalette;
    const asset = paletteAssets.find(candidate => candidate.id === activePaletteSourceId);
    return ensureScreen5PaletteSlots(asset?.data?.slots || initialPalette).slots;
  }, [activePaletteSourceId, defaultPalette, initialPalette, paletteAssets]);
  const blackSlot = palette.find(slot => normalizeHex(slot.hex) === '#000000')?.slotIndex ?? 1;

  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState('');
  const [baseName, setBaseName] = useState('tile');
  const [targetWidth, setTargetWidth] = useState(16);
  const [targetHeight, setTargetHeight] = useState(16);
  const [outputMode, setOutputMode] = useState<'screen4' | 'screen5'>(defaultOutputMode);
  // When on, Ancho and Alto stay equal (square): editing one mirrors the other.
  const [lockDimensions, setLockDimensions] = useState(false);
  const [finalColorCount, setFinalColorCount] = useState(3);
  const [backgroundSlot, setBackgroundSlot] = useState(blackSlot);
  const [backgroundTolerance, setBackgroundTolerance] = useState(22);
  const [preserveAspect, setPreserveAspect] = useState(false);
  const [cropToVisible, setCropToVisible] = useState(false);
  const [replaceableSlots, setReplaceableSlots] = useState<number[]>(() => defaultReplaceableMsx2SpriteSlots(palette));
  const [showResultGrid, setShowResultGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [adaptToExistingPalette, setAdaptToExistingPalette] = useState(false);
  // Re-roll counter for the color quantizer (see "Recuantizar" button).
  const [quantizeSeed, setQuantizeSeed] = useState(0);
  const [autoColorCountFromImage, setAutoColorCountFromImage] = useState(true);
  const [isSaveNameOpen, setIsSaveNameOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveNameError, setSaveNameError] = useState('');
  // Interactive crop: draw a rectangle (snapped to 16px) over the source image
  // and discard everything outside it before reprocessing.
  const [cropMode, setCropMode] = useState(false);
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const backgroundColor = (palette[backgroundSlot]?.hex || '#000000');
  const selectedPaletteName = activePaletteSourceId === '__screen__'
    ? 'Paleta existente de la pantalla'
    : activePaletteSourceId === '__default__'
    ? 'Paleta MSX2 por defecto'
    : (paletteAssets.find(asset => asset.id === activePaletteSourceId)?.name || 'Paleta del proyecto');

  const activatePaletteSource = (sourceId: string, adaptExisting = adaptToExistingPalette) => {
    setActivePaletteSourceId(sourceId);
    setAdaptToExistingPalette(adaptExisting);
    const nextPalette = sourceId === '__screen__'
      ? initialPalette
      : sourceId === '__default__'
      ? defaultPalette
      : ensureScreen5PaletteSlots(paletteAssets.find(asset => asset.id === sourceId)?.data?.slots || initialPalette).slots;
    const nextBlackSlot = nextPalette.find(slot => normalizeHex(slot.hex) === '#000000')?.slotIndex ?? 1;
    setBackgroundSlot(nextBlackSlot);
    setReplaceableSlots(defaultReplaceableMsx2SpriteSlots(nextPalette));
    setQuantizeSeed(seed => seed + 1);
  };

  useEffect(() => {
    if (!isOpen) return;
    const resetPalette = destPalette ? initialPalette : defaultPalette;
    const resetBlackSlot = resetPalette.find(slot => normalizeHex(slot.hex) === '#000000')?.slotIndex ?? 1;
    setImageData(null);
    setFileName('');
    setBaseName('tile');
    setTargetWidth(16);
    setTargetHeight(16);
    setLockDimensions(false);
    setBackgroundSlot(resetBlackSlot);
    setReplaceableSlots(defaultReplaceableMsx2SpriteSlots(resetPalette));
    setFinalColorCount(3);
    setAdaptToExistingPalette(defaultOutputMode === 'screen5' && Boolean(destPalette));
    setQuantizeSeed(0);
    setAutoColorCountFromImage(true);
    setOutputMode(defaultOutputMode);
    setActivePaletteSourceId(destPalette ? '__screen__' : '__default__');
    setCropMode(false);
    setCropSelection(null);
    setIsSelecting(false);
    setIsSaveNameOpen(false);
    setSaveName('');
    setSaveNameError('');
    dragStartRef.current = null;
  }, [isOpen, defaultOutputMode, destPalette, defaultPalette, initialPalette]);

  const options = useMemo<Msx2ExternalTileImportOptions>(() => ({
    targetWidth,
    targetHeight,
    finalColorCount,
    replaceableSlots,
    backgroundSlot,
    backgroundColor,
    syncProjectPalette: false,
    preserveAspect,
    cropToVisible,
    backgroundTolerance,
    useOrColor: false,
    baseName,
    quantizeSeed,
    outputMode,
    adaptToExistingPalette: outputMode === 'screen5' && adaptToExistingPalette,
  }), [adaptToExistingPalette, backgroundColor, backgroundSlot, backgroundTolerance, baseName, cropToVisible, finalColorCount, outputMode, preserveAspect, quantizeSeed, replaceableSlots, targetHeight, targetWidth]);

  const result = useMemo(() => {
    if (!imageData) return null;
    return importExternalPngAsMsx2Tiles(imageData, palette, backgroundColor, options);
  }, [imageData, options, palette, backgroundColor]);
  const maxColorCountForImport = outputMode === 'screen5' && result?.sourceColorCount
    ? Math.max(1, Math.min(15, result.sourceColorCount))
    : 15;

  useEffect(() => {
    if (!autoColorCountFromImage || outputMode !== 'screen5' || !result) return;
    if (result.sourceColorCount <= 0) {
      setAutoColorCountFromImage(false);
      return;
    }
    const maxColors = Math.max(1, Math.min(15, result.sourceColorCount));
    if (finalColorCount !== maxColors) setFinalColorCount(maxColors);
    setAutoColorCountFromImage(false);
  }, [autoColorCountFromImage, finalColorCount, outputMode, result?.sourceColorCount]);
  useEffect(() => {
    if (outputMode !== 'screen5' || !result?.sourceColorCount) return;
    if (finalColorCount > maxColorCountForImport) setFinalColorCount(maxColorCountForImport);
  }, [finalColorCount, maxColorCountForImport, outputMode, result?.sourceColorCount]);

  // Empty (all-background) cells are previewed but skipped when adding to the
  // library, so a sparse sheet doesn't flood it with blank tiles.
  const nonEmptyTiles = useMemo(
    () => (result?.tiles ?? []).filter(tile => !isMsx2TileEmpty(tile)),
    [result],
  );
  const emptyTileCount = (result?.tiles.length ?? 0) - nonEmptyTiles.length;
  const existingLibraryNameSet = useMemo(
    () => new Set(existingLibraryNames.map(name => name.trim().toLowerCase()).filter(Boolean)),
    [existingLibraryNames],
  );

  const buildTilesWithSaveName = (name: string): Msx2Screen4Tile[] => {
    if (!result) return [];
    const safeName = name.trim() || baseName.trim() || 'tile';
    const multi = result.columns > 1 || result.rows > 1;
    return result.tiles.map((tile, index) => {
      const row = Math.floor(index / result.columns);
      const col = index % result.columns;
      return {
        ...tile,
        name: multi ? `${safeName}_r${row}_c${col}` : safeName,
      };
    });
  };

  const openSaveNameDialog = () => {
    setSaveName((baseName || fileName.replace(/\.[a-z0-9]+$/i, '') || 'tile').trim());
    setSaveNameError('');
    setIsSaveNameOpen(true);
  };

  const confirmSaveToLibrary = () => {
    if (!result || nonEmptyTiles.length === 0) return;
    const trimmedName = saveName.trim();
    if (!trimmedName) {
      setSaveNameError('Escribe un nombre para guardarlo en la biblioteca.');
      return;
    }
    const namedTiles = buildTilesWithSaveName(trimmedName);
    const duplicatedName = [trimmedName, ...namedTiles.map(tile => tile.name)]
      .find(name => existingLibraryNameSet.has(name.trim().toLowerCase()));
    if (duplicatedName) {
      setSaveNameError(`Ya existe "${duplicatedName}". Cambia el nombre para no sobreescribirlo.`);
      return;
    }
    const tilesToAdd = outputMode === 'screen5' && namedTiles.length > 1
      ? namedTiles
      : namedTiles.filter(tile => !isMsx2TileEmpty(tile));
    onAddTiles(tilesToAdd, result.palette, outputMode, { columns: result.columns, rows: result.rows, baseName: trimmedName });
    setIsSaveNameOpen(false);
  };

  useEffect(() => {
    if (!imageData || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  const loadBlob = (blob: Blob, name = 'imagen.png') => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(image, 0, 0);
      setImageData(ctx.getImageData(0, 0, image.width, image.height));
      setFileName(name);
      setBaseName(name.replace(/\.[a-z0-9]+$/i, '') || 'tile');
      setFinalColorCount(outputMode === 'screen5' ? 15 : 3);
      setAutoColorCountFromImage(true);
      setQuantizeSeed(0);
      setCropMode(false);
      setCropSelection(null);
      setIsSelecting(false);
      dragStartRef.current = null;
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  };

  const loadFile = (file: File) => loadBlob(file, file.name);

  // Paste an image from the clipboard (Ctrl/Cmd+V) while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            event.preventDefault();
            loadBlob(blob, 'portapapeles.png');
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const dt = event.dataTransfer;
    const file = Array.from(dt.files).find(candidate => candidate.type.startsWith('image/'));
    if (file) {
      loadFile(file);
      return;
    }
    const item = Array.from(dt.items).find(candidate => candidate.kind === 'file' && candidate.type.startsWith('image/'));
    const blob = item?.getAsFile();
    if (blob) loadBlob(blob, 'arrastrado.png');
  };

  const toggleReplaceableSlot = (slot: number) => {
    if (slot === backgroundSlot) return;
    if (isImmutableSlot(palette[slot]?.hex)) return;
    setReplaceableSlots(current =>
      current.includes(slot)
        ? current.filter(value => value !== slot)
        : [...current, slot].sort((a, b) => a - b)
    );
  };

  const chooseBackgroundSlot = (slot: number) => {
    setBackgroundSlot(slot);
    setReplaceableSlots(current => current.filter(value => value !== slot));
  };

  // Crops the in-memory source image to its drawing (border-background bounding
  // box) and reprocesses. Destructive on the loaded ImageData only — re-pick the
  // file to recover the original. Trims most empty cells and uses resolution better.
  const handleCropToContent = () => {
    if (!imageData) return;
    const rect = computeContentCropRect(imageData, backgroundTolerance);
    if (rect.width >= imageData.width && rect.height >= imageData.height) return; // nothing to trim
    const source = document.createElement('canvas');
    source.width = imageData.width;
    source.height = imageData.height;
    source.getContext('2d')?.putImageData(imageData, 0, 0);
    const cropped = document.createElement('canvas');
    cropped.width = rect.width;
    cropped.height = rect.height;
    const ctx = cropped.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    setImageData(ctx.getImageData(0, 0, rect.width, rect.height));
    setFinalColorCount(outputMode === 'screen5' ? 15 : 3);
    setAutoColorCountFromImage(true);
  };

  // --- Interactive crop selection (snapped to 16px, the tile cell size) ------
  const snapTo16 = (value: number) => Math.round(value / 16) * 16;

  // Maps a pointer position (client px) onto the source image's pixel space,
  // accounting for the canvas being CSS-scaled to fit the panel.
  const toImagePoint = (clientX: number, clientY: number) => {
    const canvas = originalCanvasRef.current;
    if (!canvas || !imageData) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const px = (clientX - rect.left) * (imageData.width / rect.width);
    const py = (clientY - rect.top) * (imageData.height / rect.height);
    return {
      x: Math.max(0, Math.min(imageData.width, px)),
      y: Math.max(0, Math.min(imageData.height, py)),
    };
  };

  // Clamps a raw rectangle to the image bounds keeping a 16px minimum.
  const clampCropSelection = (sel: { x: number; y: number; w: number; h: number }) => {
    if (!imageData) return null;
    const x = Math.max(0, Math.min(snapTo16(sel.x), imageData.width - 16));
    const y = Math.max(0, Math.min(snapTo16(sel.y), imageData.height - 16));
    const w = Math.min(Math.max(16, snapTo16(sel.w)), imageData.width - x);
    const h = Math.min(Math.max(16, snapTo16(sel.h)), imageData.height - y);
    return { x, y, w, h };
  };

  // Builds a 16px-aligned rectangle anchored at `a`, growing toward `b`. When
  // `square` is set (Shift held), the side is the larger of the two extents.
  const buildCropSelection = (a: { x: number; y: number }, b: { x: number; y: number }, square = false) => {
    if (!imageData) return null;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    if (square) {
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      dx = (dx < 0 ? -1 : 1) * side;
      dy = (dy < 0 ? -1 : 1) * side;
    }
    const x0 = Math.max(0, Math.min(snapTo16(Math.min(a.x, a.x + dx)), imageData.width));
    const y0 = Math.max(0, Math.min(snapTo16(Math.min(a.y, a.y + dy)), imageData.height));
    const x1 = Math.max(0, Math.min(snapTo16(Math.max(a.x, a.x + dx)), imageData.width));
    const y1 = Math.max(0, Math.min(snapTo16(Math.max(a.y, a.y + dy)), imageData.height));
    let w = Math.min(Math.max(16, x1 - x0), imageData.width - x0);
    let h = Math.min(Math.max(16, y1 - y0), imageData.height - y0);
    if (square) {
      const side = Math.min(w, h);
      w = side;
      h = side;
    }
    return { x: x0, y: y0, w, h };
  };

  const handleCropPointerDown = (event: React.MouseEvent) => {
    if (!cropMode || !imageData) return;
    event.preventDefault();
    const pt = toImagePoint(event.clientX, event.clientY);
    if (!pt) return;
    dragStartRef.current = pt;
    setIsSelecting(true);
    setCropSelection(buildCropSelection(pt, pt, event.shiftKey));
  };

  const handleCropPointerMove = (event: React.MouseEvent) => {
    if (!cropMode || !isSelecting || !dragStartRef.current) return;
    const pt = toImagePoint(event.clientX, event.clientY);
    if (!pt) return;
    setCropSelection(buildCropSelection(dragStartRef.current, pt, event.shiftKey));
  };

  const finishCropSelection = () => {
    dragStartRef.current = null;
    setIsSelecting(false);
  };

  const exitCropMode = () => {
    setCropMode(false);
    setCropSelection(null);
    setIsSelecting(false);
    dragStartRef.current = null;
  };

  // Crops the loaded ImageData to the user-drawn selection (multiples of 16px)
  // and reprocesses. Discards everything outside the rectangle. Destructive on
  // the in-memory image only — re-pick the file to recover the original.
  const applyCropSelection = () => {
    if (!imageData || !cropSelection) return;
    const { x, y, w, h } = cropSelection;
    if (w < 16 || h < 16) return;
    const source = document.createElement('canvas');
    source.width = imageData.width;
    source.height = imageData.height;
    source.getContext('2d')?.putImageData(imageData, 0, 0);
    const cropped = document.createElement('canvas');
    cropped.width = w;
    cropped.height = h;
    const ctx = cropped.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    setImageData(ctx.getImageData(0, 0, w, h));
    setFinalColorCount(outputMode === 'screen5' ? 15 : 3);
    setAutoColorCountFromImage(true);
    exitCropMode();
  };

  // Release the drag even if the mouse is lifted outside the canvas.
  useEffect(() => {
    if (!isSelecting) return;
    const onUp = () => finishCropSelection();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [isSelecting]);

  // Keyboard nudging while in crop mode: arrows resize the selection one tile
  // (16px) at a time, Shift+arrows move it, Enter applies and Escape cancels.
  useEffect(() => {
    if (!cropMode) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'Escape') { event.preventDefault(); exitCropMode(); return; }
      if (event.key === 'Enter') { event.preventDefault(); applyCropSelection(); return; }
      if (!cropSelection) return;
      const step = 16;
      const move = event.shiftKey;
      const next = { ...cropSelection };
      switch (event.key) {
        case 'ArrowRight': move ? (next.x += step) : (next.w += step); break;
        case 'ArrowLeft': move ? (next.x -= step) : (next.w -= step); break;
        case 'ArrowDown': move ? (next.y += step) : (next.h += step); break;
        case 'ArrowUp': move ? (next.y -= step) : (next.h -= step); break;
        default: return;
      }
      event.preventDefault();
      const clamped = clampCropSelection(next);
      if (clamped) setCropSelection(clamped);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cropMode, cropSelection, imageData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded border border-msx-border bg-msx-panelbg shadow-xl"
        onDragEnter={event => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={event => { if (event.currentTarget === event.target) setIsDragging(false); }}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded border-2 border-dashed border-msx-highlight bg-black/60 text-sm font-semibold text-msx-highlight">
            Suelta la imagen aquí
          </div>
        )}
        <div className="flex items-center justify-between border-b border-msx-border px-4 py-3">
          <h2 className="text-base font-semibold text-msx-highlight">Importar Tiles desde PNG</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-[330px_1fr]">
          <div className="space-y-4 text-xs">
            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <label className="block">
                <span className="mb-2 block text-msx-textsecondary">PNG fuente</span>
                <input
                  type="file"
                  accept="image/png"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) loadFile(file);
                  }}
                  className="block w-full text-xs"
                />
              </label>
              <div className="mt-2 text-[11px] text-msx-textsecondary">
                …o arrastra una imagen a la ventana, o pégala con Ctrl/Cmd+V.
              </div>
              {fileName && <div className="mt-2 text-msx-textsecondary">{fileName}</div>}
              {imageData && <div className="mt-1 text-msx-textsecondary">{imageData.width}x{imageData.height}px</div>}
            </div>

            <div className="grid grid-cols-2 gap-2 rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="col-span-2">
                <div className="mb-1 text-msx-textsecondary">Tipo de tile</div>
                <div className="grid grid-cols-2 gap-1 rounded border border-msx-border bg-msx-panelbg p-1">
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${outputMode === 'screen4' ? 'bg-msx-highlight text-black' : 'text-msx-textsecondary hover:text-msx-highlight'}`}
                    onClick={() => setOutputMode('screen4')}
                    title="Aplica las restricciones de color por segmento de tiles SCREEN 4"
                  >
                    SCREEN 4 color clash
                  </button>
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${outputMode === 'screen5' ? 'bg-msx-highlight text-black' : 'text-msx-textsecondary hover:text-msx-highlight'}`}
                    onClick={() => {
                      setOutputMode('screen5');
                      setFinalColorCount(15);
                      setAutoColorCountFromImage(true);
                    }}
                    title="Conserva colores por pixel para tiles bitmap SCREEN 5"
                  >
                    SCREEN 5 bitmap
                  </button>
                </div>
              </div>
              <label className="col-span-2">Nombre base
                <input type="text" value={baseName} onChange={event => setBaseName(event.target.value)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label>Ancho (x16)
                <input type="number" min={16} max={128} step={16} value={targetWidth} onChange={event => {
                  const value = Number(event.target.value) || 16;
                  setTargetWidth(value);
                  if (lockDimensions) setTargetHeight(value);
                }} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label>Alto (x16)
                <input type="number" min={16} max={128} step={16} value={targetHeight} onChange={event => {
                  const value = Number(event.target.value) || 16;
                  setTargetHeight(value);
                  if (lockDimensions) setTargetWidth(value);
                }} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label className="col-span-2 flex items-center justify-between gap-2">
                Vincular Ancho/Alto (cuadrado)
                <input
                  type="checkbox"
                  checked={lockDimensions}
                  onChange={event => {
                    const checked = event.target.checked;
                    setLockDimensions(checked);
                    // Snap to a square immediately so the preview matches the lock.
                    if (checked) setTargetHeight(targetWidth);
                  }}
                />
              </label>
              <label>Colores custom
                <input
                  type="number"
                  min={1}
                  max={maxColorCountForImport}
                  step={1}
                  value={finalColorCount}
                  onChange={event => {
                    const next = clamp(Number(event.target.value) || 1, 1, maxColorCountForImport);
                    setFinalColorCount(next);
                    setAutoColorCountFromImage(false);
                  }}
                  className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
                />
                {outputMode === 'screen5' && result?.sourceColorCount ? (
                  <span className="mt-1 block text-[10px] text-msx-textsecondary">
                    Usados {result.sourceColorCount}; activos {result.activeColorCount}.
                  </span>
                ) : null}
              </label>
              <label>Fondo
                <select value={backgroundSlot} onChange={event => chooseBackgroundSlot(Number(event.target.value))} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1">
                  {palette.filter(slot => slot.slotIndex > 0).map(slot => (
                    <option key={slot.slotIndex} value={slot.slotIndex}>S{slot.slotIndex} {slot.hex}</option>
                  ))}
                </select>
              </label>
              <label>Fondo tol.
                <input type="number" min={0} max={96} value={backgroundTolerance} onChange={event => setBackgroundTolerance(Number(event.target.value) || 0)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label className="col-span-2 flex items-center justify-between gap-2">
                Mantener proporción
                <input type="checkbox" checked={preserveAspect} onChange={event => setPreserveAspect(event.target.checked)} />
              </label>
              <label className="col-span-2 flex items-center justify-between gap-2">
                Recortar fondo automáticamente
                <input type="checkbox" checked={cropToVisible} onChange={event => setCropToVisible(event.target.checked)} />
              </label>
              <div className="col-span-2 text-msx-textsecondary">
                La imagen se trocea en celdas de 16x16; cada celda es un tile.
              </div>
            </div>

            {outputMode === 'screen5' && (
              <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-msx-textsecondary">Paleta SCREEN 5 activa</div>
                    <div className="mt-1 truncate text-[11px] text-msx-textprimary" title={selectedPaletteName}>
                      {selectedPaletteName}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={adaptToExistingPalette ? 'primary' : 'secondary'}
                    disabled={!destPalette}
                    onClick={() => {
                      activatePaletteSource('__screen__', true);
                      setOutputMode('screen5');
                    }}
                    title="Recuantiza el PNG usando la paleta ya activa en la pantalla o mundo"
                  >
                    Adaptar a paleta existente
                  </Button>
                </div>
                <label className="mb-2 flex items-center justify-between gap-2 text-[11px] text-msx-textsecondary">
                  Usar solo colores de esta paleta
                  <input
                    type="checkbox"
                    checked={adaptToExistingPalette}
                    onChange={event => setAdaptToExistingPalette(event.target.checked)}
                  />
                </label>
                <select
                  value={activePaletteSourceId}
                  onChange={event => activatePaletteSource(event.target.value, true)}
                  className="mb-2 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1 text-xs text-msx-textprimary"
                  title="Selecciona la paleta que se usara para adaptar/recuantizar el PNG"
                >
                  {destPalette && <option value="__screen__">Paleta existente de la pantalla</option>}
                  <option value="__default__">Paleta MSX2 por defecto</option>
                  {paletteAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-8 gap-1">
                  {palette.map(slot => (
                    <div
                      key={`active-palette-${slot.slotIndex}`}
                      className="h-5 rounded border border-msx-border"
                      style={{ backgroundColor: slot.hex }}
                      title={`S${slot.slotIndex} ${slot.hex}`}
                    />
                  ))}
                </div>
                {adaptToExistingPalette && (
                  <div className="mt-2 text-[11px] text-msx-highlight">
                    Adaptacion fija activa: no se crean colores nuevos.
                  </div>
                )}
                {result && result.colorUsage.length > 0 && (
                  <div className="mt-3 rounded border border-msx-border bg-msx-panelbg/70 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-msx-textsecondary">
                      <span>Colores usados</span>
                      <span>{result.activeColorCount}/{result.sourceColorCount}</span>
                    </div>
                    <div className="max-h-32 space-y-1 overflow-auto pr-1">
                      {result.colorUsage.map(entry => (
                        <div
                          key={`import-color-${entry.slotIndex}`}
                          className={`grid grid-cols-[18px_34px_1fr_auto] items-center gap-2 text-[10px] ${entry.kept ? 'text-msx-textprimary' : 'text-msx-textsecondary opacity-60'}`}
                          title={entry.kept
                            ? `S${entry.slotIndex} se conserva`
                            : `S${entry.slotIndex} se sustituye por S${entry.mappedToSlot ?? 0}`}
                        >
                          <span className="h-4 w-4 rounded border border-msx-border" style={{ backgroundColor: entry.hex }} />
                          <span>S{entry.slotIndex}</span>
                          <span className="truncate">{entry.hex} · {entry.count}px · {entry.percent.toFixed(1)}%</span>
                          <span className={entry.kept ? 'text-msx-highlight' : 'text-msx-warning'}>
                            {entry.kept ? 'ON' : `S${entry.mappedToSlot ?? 0}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 text-msx-textsecondary">Slots que se pueden sustituir</div>
              <div className="grid grid-cols-5 gap-1">
                {palette.slice(1).map(slot => {
                  const immutable = isImmutableSlot(slot.hex) || slot.slotIndex === backgroundSlot;
                  return (
                    <button
                      key={slot.slotIndex}
                      type="button"
                      disabled={immutable}
                      onClick={() => toggleReplaceableSlot(slot.slotIndex)}
                      className={`min-h-10 rounded border text-[10px] ${replaceableSlots.includes(slot.slotIndex) ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'} ${immutable ? 'cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: slot.hex }}
                      title={immutable ? 'Inmutable' : `Slot ${slot.slotIndex}`}
                    >
                      <span className="text-white mix-blend-difference">S{slot.slotIndex}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-h-0 rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-msx-textsecondary">
                <span>Original</span>
                {cropMode ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-msx-highlight"
                      title="Arrastra para seleccionar. Shift = cuadrado. Flechas = ±1 tile, Shift+Flechas = mover. Enter = aplicar, Esc = cancelar."
                    >
                      {cropSelection
                        ? `${cropSelection.w}x${cropSelection.h}px (${cropSelection.w / 16}x${cropSelection.h / 16} tiles)`
                        : 'Arrastra (Shift=cuadrado)'}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!cropSelection}
                      onClick={applyCropSelection}
                      title="Recorta a la selección y descarta el resto"
                    >
                      Aplicar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exitCropMode}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!imageData}
                      onClick={() => { setCropMode(true); setCropSelection(null); }}
                      title="Dibuja un rectángulo (múltiplo de 16px) y descarta el resto"
                    >
                      Selección
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!imageData}
                      onClick={handleCropToContent}
                      title="Recorta la imagen al contenido (quita el borde de fondo) y reprocesa"
                    >
                      Auto
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex max-h-[430px] items-center justify-center overflow-auto">
                {imageData ? (
                  <div
                    className={`relative inline-block overflow-hidden ${cropMode ? 'cursor-crosshair' : ''}`}
                    onMouseDown={handleCropPointerDown}
                    onMouseMove={handleCropPointerMove}
                    onMouseUp={finishCropSelection}
                  >
                    <canvas ref={originalCanvasRef} className="block max-h-[420px] max-w-full border border-msx-border" />
                    {cropMode && cropSelection && (
                      <div
                        className="pointer-events-none absolute border-2 border-msx-highlight"
                        style={{
                          left: `${(cropSelection.x / imageData.width) * 100}%`,
                          top: `${(cropSelection.y / imageData.height) * 100}%`,
                          width: `${(cropSelection.w / imageData.width) * 100}%`,
                          height: `${(cropSelection.h / imageData.height) * 100}%`,
                          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-msx-textsecondary">Selecciona un PNG.</div>
                )}
              </div>
            </div>

            <div className="min-h-0 rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-msx-textsecondary">
                <span>Resultado MSX2 {result ? `— ${result.columns}x${result.rows} tiles` : ''}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!result || adaptToExistingPalette}
                    onClick={() => setQuantizeSeed(seed => seed + 1)}
                    title={adaptToExistingPalette
                      ? 'La adaptacion a paleta fija no genera colores nuevos'
                      : 'Vuelve a repartir los colores (re-ejecuta la cuantización con otra semilla)'}
                  >
                    Recuantizar
                  </Button>
                  <label className="flex items-center gap-1" title="Mostrar/ocultar la rejilla separadora">
                    <input type="checkbox" checked={showResultGrid} onChange={event => setShowResultGrid(event.target.checked)} />
                    Rejilla
                  </label>
                </div>
              </div>
              <div className="flex min-h-[280px] items-start justify-center overflow-auto">
                {result ? (
                  (() => {
                    // Reassemble the tiles in the same shape as the source PNG
                    // (columns x rows, row-major) separated only by a thin grid.
                    const cellZoom = Math.max(2, Math.min(8, Math.floor(360 / Math.max(1, result.columns * 16))));
                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${result.columns}, ${cellZoom * 16}px)`,
                          gap: showResultGrid ? '2px' : '0',
                          backgroundColor: showResultGrid ? '#000000' : 'transparent',
                          padding: showResultGrid ? '2px' : '0',
                        }}
                      >
                        {result.tiles.map(tile => (
                          <div key={tile.id} title={tile.name} className="leading-[0]">
                            <TilePreview tile={tile} palette={result.palette} zoom={cellZoom} gridLine={showResultGrid} />
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-sm text-msx-textsecondary">Sin preview.</div>
                )}
              </div>
              {result && (result.warnings.length > 0 || emptyTileCount > 0) && (
                <div className="mt-3 space-y-1 text-xs">
                  {result.warnings.map(warning => (
                    <div key={warning} className="text-msx-warning">{warning}</div>
                  ))}
                  {emptyTileCount > 0 && (
                    <div className="text-msx-textsecondary">
                      {emptyTileCount} celda(s) vacía(s) se omitirán al añadir a la biblioteca.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-msx-border px-4 py-3">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!result || nonEmptyTiles.length === 0}
            onClick={openSaveNameDialog}
          >
            Añadir a la biblioteca ({nonEmptyTiles.length})
          </Button>
        </div>
        {isSaveNameOpen && result && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded border border-msx-border bg-msx-panelbg p-4 shadow-xl">
              <h3 className="mb-3 text-sm font-semibold text-msx-highlight">Guardar en biblioteca</h3>
              <label className="block text-xs text-msx-textsecondary">
                Nombre
                <input
                  type="text"
                  value={saveName}
                  onChange={event => {
                    setSaveName(event.target.value);
                    setSaveNameError('');
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') confirmSaveToLibrary();
                    if (event.key === 'Escape') setIsSaveNameOpen(false);
                  }}
                  autoFocus
                  className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-sm text-msx-textprimary"
                />
              </label>
              {saveNameError && (
                <div className="mt-2 rounded border border-msx-warning/60 bg-msx-warning/10 px-2 py-1 text-xs text-msx-warning">
                  {saveNameError}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsSaveNameOpen(false)}>Cancelar</Button>
                <Button size="sm" variant="primary" onClick={confirmSaveToLibrary}>Guardar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Msx2ExternalTileImportModal;
