import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Sprite, MSXColorValue, PaletteAsset } from '../../types';
import { Button } from '../common/Button';
import {
  computeContentCropRect,
  defaultReplaceableMsx2SpriteSlots,
  importExternalPngAsMsx2Sprite,
  Msx2ExternalSpriteImportOptions,
  Msx2ExternalSpriteImportResult,
} from '../../utils/msx2ExternalSpriteImport';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

interface Msx2ExternalSpriteImportModalProps {
  isOpen: boolean;
  sprite: Msx2Sprite;
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
  onClose: () => void;
  onApply: (result: Msx2ExternalSpriteImportResult, options: Msx2ExternalSpriteImportOptions) => void;
  onSavePaletteAsset?: (result: Msx2ExternalSpriteImportResult, options: Msx2ExternalSpriteImportOptions) => void;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const isImmutableSlot = (hex: string | undefined): boolean => {
  const normalized = normalizeHex(hex);
  return normalized === normalizeHex(TRANSPARENT_HEX) || normalized === '#000000' || normalized === '#FFFFFF';
};

const sanitizeImportPalette = (incoming?: PaletteAsset['slots']) => {
  const defaults = createDefaultScreen5PaletteSlots();
  const { slots } = ensureScreen5PaletteSlots(incoming);
  return slots.map((slot, index) => {
    if (index === 0 || index === 1 || index === 15) {
      return { ...defaults[index] };
    }
    return { ...slot };
  });
};

const PixelPreview: React.FC<{
  data: MSXColorValue[][];
  backgroundColor: MSXColorValue;
}> = ({ data, backgroundColor }) => {
  const height = data.length;
  const width = data[0]?.length || 0;
  const zoom = Math.max(4, Math.min(10, Math.floor(280 / Math.max(width, height, 1))));
  return (
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
      {data.map((row, y) => row.map((color, x) => (
        <div
          key={`${x}-${y}`}
          style={{
            width: zoom,
            height: zoom,
            backgroundColor: normalizeHex(color) === normalizeHex(backgroundColor) || normalizeHex(color) === normalizeHex(TRANSPARENT_HEX)
              ? 'transparent'
              : color,
          }}
        />
      )))}
    </div>
  );
};

export const Msx2ExternalSpriteImportModal: React.FC<Msx2ExternalSpriteImportModalProps> = ({
  isOpen,
  sprite,
  paletteAssets = [],
  onClose,
  onApply,
  onSavePaletteAsset,
}) => {
  const usablePaletteAssets = useMemo(() => paletteAssets.filter(asset => (
    asset.data?.mode === 'SCREEN4' || asset.data?.mode === 'SCREEN5'
  )), [paletteAssets]);
  const [selectedPaletteSource, setSelectedPaletteSource] = useState('default');
  const palette = useMemo(() => {
    if (selectedPaletteSource === 'default') return sanitizeImportPalette(sprite.palette);
    const asset = usablePaletteAssets.find(candidate => candidate.id === selectedPaletteSource);
    return sanitizeImportPalette(asset?.data?.slots);
  }, [selectedPaletteSource, sprite.palette, usablePaletteAssets]);
  const blackSlot = palette.find(slot => normalizeHex(slot.hex) === '#000000')?.slotIndex ?? 1;
  const isUsefulOrPair = (slots: typeof palette, base: number, overlay: number, excludedSlot: number): boolean => {
    const result = base | overlay;
    return base > 0
      && overlay > 0
      && result > 0
      && result < 16
      && base !== overlay
      && result !== base
      && result !== overlay
      && base !== excludedSlot
      && overlay !== excludedSlot
      && result !== excludedSlot
      && !isImmutableSlot(slots[base]?.hex)
      && !isImmutableSlot(slots[overlay]?.hex)
      && !isImmutableSlot(slots[result]?.hex);
  };

  const findDefaultOrPair = (slots: typeof palette, excludedSlot = blackSlot): { base: number; overlay: number } => {
    const replaceable = defaultReplaceableMsx2SpriteSlots(slots).filter(slot => slot !== excludedSlot);
    for (const base of replaceable) {
      for (const overlay of replaceable) {
        if (isUsefulOrPair(slots, base, overlay, excludedSlot) && replaceable.includes(base | overlay)) {
          return { base, overlay };
        }
      }
    }
    return { base: replaceable[0] || 2, overlay: replaceable[1] || replaceable[0] || 4 };
  };
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState('');
  const [targetWidth, setTargetWidth] = useState(sprite.size.width);
  const [targetHeight, setTargetHeight] = useState(sprite.size.height);
  const [finalColorCount, setFinalColorCount] = useState(3);
  const [backgroundSlot, setBackgroundSlot] = useState(blackSlot);
  const [backgroundTolerance, setBackgroundTolerance] = useState(22);
  const [preserveAspect, setPreserveAspect] = useState(true);
  const [cropToVisible, setCropToVisible] = useState(true);
  const [useOrColor, setUseOrColor] = useState(sprite.hardware?.useOrColor !== false);
  const [syncProjectPalette, setSyncProjectPalette] = useState(true);
  const [replaceableSlots, setReplaceableSlots] = useState<number[]>(() => defaultReplaceableMsx2SpriteSlots(palette));
  // When on, Ancho and Alto stay equal (square): editing one mirrors the other.
  const [lockDimensions, setLockDimensions] = useState(false);
  // Re-roll counter for the color quantizer (see "Recuantizar" button).
  const [quantizeSeed, setQuantizeSeed] = useState(0);
  // When on, the import only reuses colors already in the chosen palette (no new slots).
  const [adaptToExistingPalette, setAdaptToExistingPalette] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Interactive crop: draw a rectangle over the source image and discard the rest.
  const [cropMode, setCropMode] = useState(false);
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const defaultOrPair = useMemo(() => findDefaultOrPair(palette), [palette, blackSlot]);
  const [orBaseSlot, setOrBaseSlot] = useState(defaultOrPair.base);
  const [orOverlaySlot, setOrOverlaySlot] = useState(defaultOrPair.overlay);
  const orResultSlot = orBaseSlot | orOverlaySlot;
  const backgroundColor = (palette[backgroundSlot]?.hex || '#000000') as MSXColorValue;
  const selectableOrSlots = useMemo(() => palette.filter(slot => (
    slot.slotIndex > 0
    && !isImmutableSlot(slot.hex)
    && slot.slotIndex !== backgroundSlot
  )), [backgroundSlot, palette]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedPaletteSource !== 'default' && !usablePaletteAssets.some(asset => asset.id === selectedPaletteSource)) {
      setSelectedPaletteSource('default');
      return;
    }
    setTargetWidth(sprite.size.width);
    setTargetHeight(sprite.size.height);
    setUseOrColor(sprite.hardware?.useOrColor !== false);
    setBackgroundSlot(blackSlot);
    const pair = findDefaultOrPair(palette, blackSlot);
    setOrBaseSlot(pair.base);
    setOrOverlaySlot(pair.overlay);
    const defaults = defaultReplaceableMsx2SpriteSlots(palette);
    const preferred = [pair.base, pair.overlay, pair.base | pair.overlay].filter(slot => defaults.includes(slot));
    setReplaceableSlots([...preferred, ...defaults.filter(slot => !preferred.includes(slot))]);
  }, [blackSlot, isOpen, palette, selectedPaletteSource, sprite.hardware?.useOrColor, sprite.size.height, sprite.size.width, usablePaletteAssets]);

  // Reset the newly-added controls (crop, re-roll, lock, adapt) on each open.
  useEffect(() => {
    if (!isOpen) return;
    setLockDimensions(false);
    setQuantizeSeed(0);
    setAdaptToExistingPalette(false);
    setIsDragging(false);
    resetCropState();
  }, [isOpen]);

  const options = useMemo<Msx2ExternalSpriteImportOptions>(() => ({
    targetWidth,
    targetHeight,
    finalColorCount,
    replaceableSlots,
    backgroundSlot,
    backgroundColor,
    orBaseSlot,
    orOverlaySlot,
    orResultSlot,
    syncProjectPalette,
    preserveAspect,
    cropToVisible,
    backgroundTolerance,
    useOrColor,
    quantizeSeed,
    adaptToExistingPalette,
  }), [adaptToExistingPalette, backgroundColor, backgroundSlot, backgroundTolerance, cropToVisible, finalColorCount, orBaseSlot, orOverlaySlot, orResultSlot, preserveAspect, quantizeSeed, replaceableSlots, syncProjectPalette, targetHeight, targetWidth, useOrColor]);

  const result = useMemo(() => {
    if (!imageData) return null;
    return importExternalPngAsMsx2Sprite(imageData, palette, sprite.backgroundColor, options);
  }, [imageData, options, palette, sprite.backgroundColor]);

  useEffect(() => {
    if (!imageData || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  const resetCropState = () => {
    setCropMode(false);
    setCropSelection(null);
    setIsSelecting(false);
    dragStartRef.current = null;
  };

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
      setQuantizeSeed(0);
      resetCropState();
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

  const chooseBackgroundSlot = (slot: number) => {
    setBackgroundSlot(slot);
    setReplaceableSlots(current => current.filter(value => value !== slot));
    if (!isUsefulOrPair(palette, orBaseSlot, orOverlaySlot, slot)) {
      const pair = findDefaultOrPair(palette, slot);
      setOrBaseSlot(pair.base);
      setOrOverlaySlot(pair.overlay);
      includeOrSlots(pair.base, pair.overlay);
    }
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

  const includeOrSlots = (baseSlot: number, overlaySlot: number) => {
    const resultSlot = baseSlot | overlaySlot;
    setReplaceableSlots(current => {
      const next = new Set(current);
      if (!isImmutableSlot(palette[baseSlot]?.hex)) next.add(baseSlot);
      if (!isImmutableSlot(palette[overlaySlot]?.hex)) next.add(overlaySlot);
      if (!isImmutableSlot(palette[resultSlot]?.hex)) next.add(resultSlot);
      return Array.from(next).sort((a, b) => a - b);
    });
  };

  const chooseBaseSlot = (slot: number) => {
    setOrBaseSlot(slot);
    includeOrSlots(slot, orOverlaySlot);
  };

  const chooseOverlaySlot = (slot: number) => {
    setOrOverlaySlot(slot);
    includeOrSlots(orBaseSlot, slot);
  };

  // --- Interactive crop selection -------------------------------------------
  // Minimum/step in source pixels. Sprites are not tiled, so the rectangle is
  // free-form (no 16px grid snap) with an 8px minimum and 8px keyboard nudge.
  const CROP_MIN = 8;
  const CROP_STEP = 8;
  // The sprite's output aspect ratio (e.g. 16x32 -> 0.5). When "Mantener
  // proporción" is on, the crop rectangle is locked to this so the selected
  // region fills the WHOLE sprite (width AND height) without distortion.
  const targetAspect = targetWidth / Math.max(1, targetHeight);

  // Grows a {w,h} pair to the target aspect ratio so it CONTAINS the dragged
  // extent (the longer side wins, the other is enlarged to match).
  const growToAspect = (w: number, h: number) => {
    if (w / Math.max(1, h) > targetAspect) return { w, h: w / targetAspect };
    return { w: h * targetAspect, h };
  };
  // Shrinks a {w,h} pair to the target aspect ratio so it FITS inside given
  // bounds (the longer side is reduced).
  const shrinkToAspect = (w: number, h: number) => {
    if (w / Math.max(1, h) > targetAspect) return { w: h * targetAspect, h };
    return { w, h: w / targetAspect };
  };

  // Expands a content rect to the target aspect (centered) and clamps to bounds,
  // so an auto-crop also fills the full sprite instead of letterboxing.
  const expandRectToAspect = (rect: { x: number; y: number; width: number; height: number }) => {
    if (!imageData) return rect;
    const grown = growToAspect(rect.width, rect.height);
    let w = Math.min(Math.round(grown.w), imageData.width);
    let h = Math.min(Math.round(grown.h), imageData.height);
    // Re-fit after the bound clamp so the aspect survives at the image edges.
    const fitted = shrinkToAspect(w, h);
    w = Math.max(CROP_MIN, Math.round(fitted.w));
    h = Math.max(CROP_MIN, Math.round(fitted.h));
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const x = Math.max(0, Math.min(Math.round(cx - w / 2), imageData.width - w));
    const y = Math.max(0, Math.min(Math.round(cy - h / 2), imageData.height - h));
    return { x, y, width: w, height: h };
  };

  // Replaces the loaded ImageData with `rect` and turns off auto-trim so the
  // explicit crop is honored by the importer (cropToVisible would re-trim it).
  const cropImageDataTo = (rect: { x: number; y: number; width: number; height: number }) => {
    if (!imageData) return;
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
    // A manual/auto crop is authoritative: stop re-cropping to visible content,
    // which would otherwise discard the user's framing and reintroduce padding.
    setCropToVisible(false);
  };

  // Crops the in-memory source image to its drawing (border-background bounding
  // box) and reprocesses. With "Mantener proporción" on, the box is expanded to
  // the sprite's aspect so it fills the whole sprite. Destructive on the loaded
  // ImageData only — re-pick the file to recover the original.
  const handleCropToContent = () => {
    if (!imageData) return;
    const content = computeContentCropRect(imageData, backgroundTolerance);
    const rect = preserveAspect ? expandRectToAspect(content) : content;
    if (rect.width >= imageData.width && rect.height >= imageData.height) return; // nothing to trim
    cropImageDataTo(rect);
  };

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

  // Clamps a raw rectangle to the image bounds keeping the minimum size.
  const clampCropSelection = (sel: { x: number; y: number; w: number; h: number }) => {
    if (!imageData) return null;
    const x = Math.max(0, Math.min(Math.round(sel.x), imageData.width - CROP_MIN));
    const y = Math.max(0, Math.min(Math.round(sel.y), imageData.height - CROP_MIN));
    const w = Math.min(Math.max(CROP_MIN, Math.round(sel.w)), imageData.width - x);
    const h = Math.min(Math.max(CROP_MIN, Math.round(sel.h)), imageData.height - y);
    return { x, y, w, h };
  };

  // Builds a rectangle anchored at `a`, growing toward `b`. When `square` is set
  // (Shift held), the side is the smaller of the two extents.
  const buildCropSelection = (a: { x: number; y: number }, b: { x: number; y: number }, square = false) => {
    if (!imageData) return null;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    if (square) {
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      dx = (dx < 0 ? -1 : 1) * side;
      dy = (dy < 0 ? -1 : 1) * side;
    }
    const x0 = Math.max(0, Math.min(Math.round(Math.min(a.x, a.x + dx)), imageData.width));
    const y0 = Math.max(0, Math.min(Math.round(Math.min(a.y, a.y + dy)), imageData.height));
    const x1 = Math.max(0, Math.min(Math.round(Math.max(a.x, a.x + dx)), imageData.width));
    const y1 = Math.max(0, Math.min(Math.round(Math.max(a.y, a.y + dy)), imageData.height));
    let w = Math.min(Math.max(CROP_MIN, x1 - x0), imageData.width - x0);
    let h = Math.min(Math.max(CROP_MIN, y1 - y0), imageData.height - y0);
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

  // Crops the loaded ImageData to the user-drawn selection and reprocesses.
  // Destructive on the in-memory image only — re-pick the file to recover it.
  const applyCropSelection = () => {
    if (!imageData || !cropSelection) return;
    const { x, y, w, h } = cropSelection;
    if (w < CROP_MIN || h < CROP_MIN) return;
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
    exitCropMode();
  };

  // Release the drag even if the mouse is lifted outside the canvas.
  useEffect(() => {
    if (!isSelecting) return;
    const onUp = () => finishCropSelection();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [isSelecting]);

  // Keyboard nudging while in crop mode: arrows resize the selection, Shift+arrows
  // move it, Enter applies and Escape cancels.
  useEffect(() => {
    if (!cropMode) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'Escape') { event.preventDefault(); exitCropMode(); return; }
      if (event.key === 'Enter') { event.preventDefault(); applyCropSelection(); return; }
      if (!cropSelection) return;
      const step = CROP_STEP;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
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
          <h2 className="text-base font-semibold text-msx-highlight">Importar Sprite Exterior</h2>
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
              <label className="col-span-2">Paleta base
                <select
                  value={selectedPaletteSource}
                  onChange={event => setSelectedPaletteSource(event.target.value)}
                  className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
                >
                  <option value="default">MSX2 por defecto</option>
                  {usablePaletteAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              {usablePaletteAssets.length === 0 && (
                <div className="col-span-2 text-msx-textsecondary">
                  No hay assets de paleta; se usa la paleta MSX2 por defecto.
                </div>
              )}
              <div className="col-span-2">
                <div className="mb-1 text-msx-textsecondary">Colores de la paleta</div>
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
              </div>
              <label className="col-span-2 flex items-center justify-between gap-2" title="Recuantiza usando solo los colores de la paleta elegida; no se generan colores nuevos.">
                Adaptar a paleta existente
                <input
                  type="checkbox"
                  checked={adaptToExistingPalette}
                  onChange={event => setAdaptToExistingPalette(event.target.checked)}
                />
              </label>
              {adaptToExistingPalette && (
                <div className="col-span-2 text-[11px] text-msx-highlight">
                  Adaptación fija activa: no se crean colores nuevos.
                </div>
              )}
              <label>Ancho
                <input type="number" min={8} max={128} step={8} value={targetWidth} onChange={event => {
                  const value = Number(event.target.value) || 16;
                  setTargetWidth(value);
                  if (lockDimensions) setTargetHeight(value);
                }} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label>Alto
                <input type="number" min={8} max={128} step={8} value={targetHeight} onChange={event => {
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
                    if (checked) setTargetHeight(targetWidth);
                  }}
                />
              </label>
              <label>Colores custom
                <input type="number" min={1} max={15} value={finalColorCount} onChange={event => setFinalColorCount(Number(event.target.value) || 3)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
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
              <div className="col-span-2 text-msx-textsecondary">
                El fondo rellena transparencia y no cuenta como color custom.
              </div>
              <label className="col-span-2 flex items-center justify-between gap-2">
                Mantener proporcion
                <input type="checkbox" checked={preserveAspect} onChange={event => setPreserveAspect(event.target.checked)} />
              </label>
              <label className="col-span-2 flex items-center justify-between gap-2">
                Recortar fondo automaticamente
                <input type="checkbox" checked={cropToVisible} onChange={event => setCropToVisible(event.target.checked)} />
              </label>
              <label className="col-span-2 flex items-center justify-between gap-2">
                Sincronizar paleta del proyecto
                <input type="checkbox" checked={syncProjectPalette} onChange={event => setSyncProjectPalette(event.target.checked)} />
              </label>
            </div>

            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-msx-textsecondary">OR color MSX2</span>
                <input type="checkbox" checked={useOrColor} onChange={event => setUseOrColor(event.target.checked)} />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <label className="rounded border border-msx-border p-2">Base
                  <select value={orBaseSlot} onChange={event => chooseBaseSlot(Number(event.target.value))} className="mt-1 w-full bg-msx-panelbg">
                    {selectableOrSlots.filter(slot => (
                      (slot.slotIndex | orOverlaySlot) < 16
                      && (slot.slotIndex | orOverlaySlot) !== slot.slotIndex
                      && (slot.slotIndex | orOverlaySlot) !== orOverlaySlot
                      && !isImmutableSlot(palette[slot.slotIndex | orOverlaySlot]?.hex)
                    )).map(slot => (
                      <option key={slot.slotIndex} value={slot.slotIndex}>Slot {slot.slotIndex}</option>
                    ))}
                  </select>
                </label>
                <div className="text-center text-msx-highlight">|</div>
                <label className="rounded border border-msx-border p-2">Overlay
                  <select value={orOverlaySlot} onChange={event => chooseOverlaySlot(Number(event.target.value))} className="mt-1 w-full bg-msx-panelbg">
                    {selectableOrSlots.filter(slot => (
                      (orBaseSlot | slot.slotIndex) < 16
                      && (orBaseSlot | slot.slotIndex) !== orBaseSlot
                      && (orBaseSlot | slot.slotIndex) !== slot.slotIndex
                      && !isImmutableSlot(palette[orBaseSlot | slot.slotIndex]?.hex)
                    )).map(slot => (
                      <option key={slot.slotIndex} value={slot.slotIndex}>Slot {slot.slotIndex}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-2 text-msx-textsecondary">
                Resultado OR: slot {orBaseSlot} | slot {orOverlaySlot} = slot {orResultSlot}
              </div>
            </div>

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
                      title="Arrastra para seleccionar. Shift = cuadrado. Flechas = ±8px, Shift+Flechas = mover. Enter = aplicar, Esc = cancelar."
                    >
                      {cropSelection ? `${cropSelection.w}x${cropSelection.h}px` : 'Arrastra (Shift=cuadrado)'}
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
                      title="Dibuja un rectángulo y descarta el resto"
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
                <span>Resultado MSX2</span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!result || adaptToExistingPalette}
                  onClick={() => setQuantizeSeed(seed => seed + 1)}
                  title={adaptToExistingPalette
                    ? 'La adaptación a paleta fija no genera colores nuevos'
                    : 'Vuelve a repartir los colores (re-ejecuta la cuantización con otra semilla)'}
                >
                  Recuantizar
                </Button>
              </div>
              <div className="flex min-h-[280px] items-center justify-center overflow-auto">
                {result ? (
                  <PixelPreview data={result.pixelData} backgroundColor={result.backgroundColor} />
                ) : (
                  <div className="text-sm text-msx-textsecondary">Sin preview.</div>
                )}
              </div>
              {result && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="text-msx-textsecondary">
                    Crop x{result.crop.x}, y{result.crop.y}, {result.crop.width}x{result.crop.height}. Colores detectados: {result.detectedOpaqueColors}.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.generatedSlots.map(slot => (
                      <div key={slot.slotIndex} className="flex items-center gap-1 rounded border border-msx-border px-2 py-1">
                        <span className="h-4 w-4 border border-msx-border" style={{ backgroundColor: slot.hex }} />
                        <span>S{slot.slotIndex} {slot.hex}</span>
                      </div>
                    ))}
                  </div>
                  {result.warnings.map(warning => (
                    <div key={warning} className="text-msx-warning">{warning}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-msx-border px-4 py-3">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
          {onSavePaletteAsset && (
            <Button size="sm" variant="secondary" disabled={!result} onClick={() => result && onSavePaletteAsset(result, options)}>
              Guardar paleta como asset
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={!result} onClick={() => result && onApply(result, options)}>
            Aplicar al Sprite
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2ExternalSpriteImportModal;
