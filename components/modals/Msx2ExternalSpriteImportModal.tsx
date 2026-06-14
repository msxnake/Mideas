import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Sprite, MSXColorValue } from '../../types';
import { Button } from '../common/Button';
import {
  defaultReplaceableMsx2SpriteSlots,
  importExternalPngAsMsx2Sprite,
  Msx2ExternalSpriteImportOptions,
  Msx2ExternalSpriteImportResult,
} from '../../utils/msx2ExternalSpriteImport';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

interface Msx2ExternalSpriteImportModalProps {
  isOpen: boolean;
  sprite: Msx2Sprite;
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
  onClose,
  onApply,
  onSavePaletteAsset,
}) => {
  const { slots: palette } = useMemo(() => ensureScreen5PaletteSlots(sprite.palette), [sprite.palette]);
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
  }, [blackSlot, isOpen, palette, sprite.hardware?.useOrColor, sprite.size.height, sprite.size.width]);

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
  }), [backgroundColor, backgroundSlot, backgroundTolerance, cropToVisible, finalColorCount, orBaseSlot, orOverlaySlot, orResultSlot, preserveAspect, replaceableSlots, syncProjectPalette, targetHeight, targetWidth, useOrColor]);

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

  const loadFile = (file: File) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
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
      setFileName(file.name);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded border border-msx-border bg-msx-panelbg shadow-xl">
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
              {fileName && <div className="mt-2 text-msx-textsecondary">{fileName}</div>}
              {imageData && <div className="mt-1 text-msx-textsecondary">{imageData.width}x{imageData.height}px</div>}
            </div>

            <div className="grid grid-cols-2 gap-2 rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <label>Ancho
                <input type="number" min={8} max={128} step={8} value={targetWidth} onChange={event => setTargetWidth(Number(event.target.value) || 16)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
              </label>
              <label>Alto
                <input type="number" min={8} max={128} step={8} value={targetHeight} onChange={event => setTargetHeight(Number(event.target.value) || 16)} className="mt-1 w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1" />
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
                      className={`min-h-10 rounded border text-[10px] ${replaceableSlots.includes(slot.slotIndex) ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'} ${immutable ? 'opacity-50' : ''}`}
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
              <div className="mb-2 text-xs text-msx-textsecondary">Resultado MSX2</div>
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
