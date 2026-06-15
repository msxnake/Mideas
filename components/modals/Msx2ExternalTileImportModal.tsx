import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Screen4Tile, Screen5PaletteSlot } from '../../types';
import { Button } from '../common/Button';
import {
  defaultReplaceableMsx2SpriteSlots,
} from '../../utils/msx2ExternalSpriteImport';
import {
  importExternalPngAsMsx2Tiles,
  Msx2ExternalTileImportOptions,
} from '../../utils/msx2ExternalTileImport';
import { createDefaultScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

interface Msx2ExternalTileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Adds the quantized tiles (and the palette they map to) to the library. */
  onAddTiles: (tiles: Msx2Screen4Tile[], palette: Screen5PaletteSlot[]) => void;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

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
}) => {
  const palette = useMemo(() => createDefaultScreen5PaletteSlots(), []);
  const blackSlot = palette.find(slot => normalizeHex(slot.hex) === '#000000')?.slotIndex ?? 1;

  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState('');
  const [baseName, setBaseName] = useState('tile');
  const [targetWidth, setTargetWidth] = useState(16);
  const [targetHeight, setTargetHeight] = useState(16);
  const [finalColorCount, setFinalColorCount] = useState(3);
  const [backgroundSlot, setBackgroundSlot] = useState(blackSlot);
  const [backgroundTolerance, setBackgroundTolerance] = useState(22);
  const [preserveAspect, setPreserveAspect] = useState(false);
  const [cropToVisible, setCropToVisible] = useState(false);
  const [replaceableSlots, setReplaceableSlots] = useState<number[]>(() => defaultReplaceableMsx2SpriteSlots(palette));
  const [showResultGrid, setShowResultGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const backgroundColor = (palette[backgroundSlot]?.hex || '#000000');

  useEffect(() => {
    if (!isOpen) return;
    setImageData(null);
    setFileName('');
    setBaseName('tile');
    setTargetWidth(16);
    setTargetHeight(16);
    setBackgroundSlot(blackSlot);
    setReplaceableSlots(defaultReplaceableMsx2SpriteSlots(palette));
  }, [isOpen, blackSlot, palette]);

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
  }), [backgroundColor, backgroundSlot, backgroundTolerance, baseName, cropToVisible, finalColorCount, preserveAspect, replaceableSlots, targetHeight, targetWidth]);

  const result = useMemo(() => {
    if (!imageData) return null;
    return importExternalPngAsMsx2Tiles(imageData, palette, backgroundColor, options);
  }, [imageData, options, palette, backgroundColor]);

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
              <label className="col-span-2">Nombre base
                <input type="text" value={baseName} onChange={event => setBaseName(event.target.value)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label>Ancho (x16)
                <input type="number" min={16} max={128} step={16} value={targetWidth} onChange={event => setTargetWidth(Number(event.target.value) || 16)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label>Alto (x16)
                <input type="number" min={16} max={128} step={16} value={targetHeight} onChange={event => setTargetHeight(Number(event.target.value) || 16)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
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
              <div className="mb-2 text-xs text-msx-textsecondary">Original</div>
              <div className="flex max-h-[430px] items-center justify-center overflow-auto">
                {imageData ? (
                  <canvas ref={originalCanvasRef} className="max-h-[420px] max-w-full border border-msx-border" />
                ) : (
                  <div className="text-sm text-msx-textsecondary">Selecciona un PNG.</div>
                )}
              </div>
            </div>

            <div className="min-h-0 rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-msx-textsecondary">
                <span>Resultado MSX2 {result ? `— ${result.columns}x${result.rows} tiles` : ''}</span>
                <label className="flex items-center gap-1" title="Mostrar/ocultar la rejilla separadora">
                  <input type="checkbox" checked={showResultGrid} onChange={event => setShowResultGrid(event.target.checked)} />
                  Rejilla
                </label>
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
              {result && result.warnings.length > 0 && (
                <div className="mt-3 space-y-1 text-xs">
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
          <Button
            size="sm"
            variant="primary"
            disabled={!result || result.tiles.length === 0}
            onClick={() => {
              if (!result) return;
              onAddTiles(result.tiles, result.palette);
            }}
          >
            Añadir a la biblioteca ({result?.tiles.length ?? 0})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2ExternalTileImportModal;
