import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2BitmapAutoTerrain, Msx2Screen4Tile, Screen5PaletteSlot } from '../../types';
import { Button } from '../common/Button';
import { importExternalPngAsMsx2Tiles } from '../../utils/msx2ExternalTileImport';
import { AUTOTILE_BIT, AutotileTemplateSpec, autotileTemplateSpec } from '../../utils/msx2Autotile';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

/**
 * Imports an autotile template PNG into a SCREEN 5 bitmap room:
 *   - blob16: 4x4 cells (64x64 px), cardinal-only masks.
 *   - wang47: 8x6 cells (128x96 px), masks in ascending canonical order, last cell unused.
 * Colors are adapted to the CURRENT screen/world palette (no palette change), reusing the
 * mature PNG→tiles pipeline. The caller receives the sliced tiles with their parallel mask
 * list and builds the terrain mapping + atlas entries. A guide PNG (borders/corner notches
 * drawn per cell) can be downloaded for each template so artists paint over exact positions.
 */
interface Msx2AutotileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current screen/world palette the template is adapted to. */
  slots: Screen5PaletteSlot[];
  onImport: (params: {
    name: string;
    template: Msx2BitmapAutoTerrain['template'];
    /** Sliced template tiles with masks[i] = canonical neighbour mask of tiles[i]. */
    tiles: Msx2Screen4Tile[];
    masks: number[];
    markSolid: boolean;
  }) => void;
}

const GUIDE_GREEN = '#22AA22';
const GUIDE_DARK = '#146E14';
const GUIDE_BROWN = '#664422';

/** Draws one 16x16 guide cell for `mask`: fill + exposed borders + exposed corner notches. */
const drawGuideCell = (ctx: CanvasRenderingContext2D, cx: number, cy: number, mask: number | null) => {
  if (mask === null) {
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx, cy, 16, 16);
    return;
  }
  ctx.fillStyle = GUIDE_GREEN;
  ctx.fillRect(cx, cy, 16, 16);
  ctx.fillStyle = GUIDE_DARK;
  for (let y = 2; y < 16; y += 4) {
    for (let x = 2; x < 16; x += 4) ctx.fillRect(cx + x, cy + y, 1, 1);
  }
  ctx.fillStyle = GUIDE_BROWN;
  if (!(mask & AUTOTILE_BIT.n)) ctx.fillRect(cx, cy, 16, 3);
  if (!(mask & AUTOTILE_BIT.e)) ctx.fillRect(cx + 13, cy, 3, 16);
  if (!(mask & AUTOTILE_BIT.s)) ctx.fillRect(cx, cy + 13, 16, 3);
  if (!(mask & AUTOTILE_BIT.w)) ctx.fillRect(cx, cy, 3, 16);
  // Inner-corner notches: diagonal exposed while both adjacent cardinals are terrain.
  const notch = (bit: number, a: number, b: number, nx: number, ny: number) => {
    if ((mask & a) && (mask & b) && !(mask & bit)) ctx.fillRect(cx + nx, cy + ny, 3, 3);
  };
  notch(AUTOTILE_BIT.ne, AUTOTILE_BIT.n, AUTOTILE_BIT.e, 13, 0);
  notch(AUTOTILE_BIT.se, AUTOTILE_BIT.s, AUTOTILE_BIT.e, 13, 13);
  notch(AUTOTILE_BIT.sw, AUTOTILE_BIT.s, AUTOTILE_BIT.w, 0, 13);
  notch(AUTOTILE_BIT.nw, AUTOTILE_BIT.n, AUTOTILE_BIT.w, 0, 0);
};

const buildGuideCanvas = (spec: AutotileTemplateSpec): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d')!;
  spec.masks.forEach((mask, index) => {
    drawGuideCell(ctx, (index % spec.columns) * 16, Math.floor(index / spec.columns) * 16, mask);
  });
  return canvas;
};

/** Single-canvas preview of the sliced result (3x zoom + 1px separators). */
const SlicedPreview: React.FC<{
  tiles: Msx2Screen4Tile[];
  spec: AutotileTemplateSpec;
  palette: Screen5PaletteSlot[];
}> = ({ tiles, spec, palette }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoom = 3;
  const width = spec.columns * (16 * zoom + 1) + 1;
  const height = spec.rows * (16 * zoom + 1) + 1;
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, width, height);
    tiles.forEach((tile, index) => {
      const ox = (index % spec.columns) * (16 * zoom + 1) + 1;
      const oy = Math.floor(index / spec.columns) * (16 * zoom + 1) + 1;
      ctx.fillStyle = '#000000';
      ctx.fillRect(ox, oy, 16 * zoom, 16 * zoom);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const slot = tile.pixels?.[y]?.[x] ?? 0;
          if (slot === 0) continue;
          ctx.fillStyle = palette[slot]?.hex || '#000000';
          ctx.fillRect(ox + x * zoom, oy + y * zoom, zoom, zoom);
        }
      }
    });
  }, [tiles, spec, palette, width, height]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ imageRendering: 'pixelated' }} />;
};

export const Msx2AutotileImportModal: React.FC<Msx2AutotileImportModalProps> = ({ isOpen, onClose, slots, onImport }) => {
  const palette = useMemo(() => ensureScreen5PaletteSlots(slots).slots, [slots]);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState('');
  const [name, setName] = useState('terreno');
  const [template, setTemplate] = useState<Msx2BitmapAutoTerrain['template']>('blob16');
  const [markSolid, setMarkSolid] = useState(true);
  const [backgroundTolerance, setBackgroundTolerance] = useState(22);

  const spec = useMemo(() => autotileTemplateSpec(template), [template]);

  useEffect(() => {
    if (!isOpen) return;
    setImageData(null);
    setFileName('');
    setName('terreno');
    setTemplate('blob16');
    setMarkSolid(true);
    setBackgroundTolerance(22);
  }, [isOpen]);

  const loadBlob = (blob: Blob, blobName = 'plantilla.png') => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        setImageData(ctx.getImageData(0, 0, image.width, image.height));
        setFileName(blobName);
        setName(blobName.replace(/\.[a-z0-9]+$/i, '') || 'terreno');
        // Auto-detect the template from the source size (blob16 64x64 / wang47 128x96).
        const wang = autotileTemplateSpec('wang47');
        if (image.width === wang.width && image.height === wang.height) setTemplate('wang47');
        else if (image.width === 64 && image.height === 64) setTemplate('blob16');
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  };

  const downloadGuide = () => {
    const canvas = buildGuideCanvas(spec);
    const link = document.createElement('a');
    link.download = `autotile_guia_${template}_${spec.columns}x${spec.rows}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const result = useMemo(() => {
    if (!imageData) return null;
    return importExternalPngAsMsx2Tiles(imageData, palette, palette[0]?.hex || '#000000', {
      baseName: name || 'terreno',
      outputMode: 'screen5',
      targetWidth: spec.width,
      targetHeight: spec.height,
      finalColorCount: 15,
      replaceableSlots: [],
      preserveAspect: false,
      cropToVisible: false,
      backgroundTolerance,
      useOrColor: false,
      adaptToExistingPalette: true,
    });
  }, [imageData, palette, name, backgroundTolerance, spec]);

  const expectedCells = spec.columns * spec.rows;
  const isValidGrid = result?.columns === spec.columns && result?.rows === spec.rows && result.tiles.length === expectedCells;
  const sizeMismatch = Boolean(imageData && (imageData.width !== spec.width || imageData.height !== spec.height));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[38rem] max-h-[85vh] overflow-y-auto rounded border border-msx-border bg-msx-panelbg p-4 space-y-3"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm pixel-font text-msx-highlight">Importar plantilla Autotile</h4>
          <button type="button" className="text-msx-textsecondary hover:text-msx-highlight" onClick={onClose}>✕</button>
        </div>

        <div className="flex items-center gap-3 text-xs text-msx-textprimary">
          <span className="text-msx-textsecondary">Plantilla</span>
          <label className="flex items-center gap-1">
            <input type="radio" checked={template === 'blob16'} onChange={() => setTemplate('blob16')} />
            <span>16 tiles (blob, 4x4 — 64x64 px)</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={template === 'wang47'} onChange={() => setTemplate('wang47')} />
            <span>47 tiles (wang, 8x6 — 128x96 px)</span>
          </label>
        </div>

        <div className="text-xs text-msx-textsecondary space-y-1">
          {template === 'blob16' ? (
            <p>
              PNG de 64x64 px, layout estándar 4x4: fila 1 esquinas/borde superior + tapa, fila 2 bordes
              laterales + centro + tubo vertical, fila 3 esquinas/borde inferior, fila 4 tubo horizontal + aislado.
            </p>
          ) : (
            <p>
              PNG de 128x96 px, 8x6 celdas: las 47 máscaras canónicas en orden numérico ascendente (la última
              celda no se usa). Descarga la plantilla guía y pinta encima respetando posiciones: los huecos
              marrones de las esquinas son las esquinas interiores.
            </p>
          )}
          <p>Los colores se adaptan a la paleta actual de la pantalla (no se modifica la paleta). El tamaño se reescala si no coincide.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="rounded border border-msx-border px-2 py-1 text-xs text-msx-textprimary hover:border-msx-highlight cursor-pointer">
            Elegir PNG…
            <input
              type="file"
              accept="image/png,image/gif,image/bmp,image/webp"
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) loadBlob(file, file.name);
                event.target.value = '';
              }}
            />
          </label>
          <Button size="sm" variant="ghost" onClick={downloadGuide} title="Descarga un PNG guía con bordes y esquinas marcados por celda para pintar encima">
            Descargar plantilla guía
          </Button>
          <span className="text-xs text-msx-textsecondary truncate">{fileName || 'Ningún archivo seleccionado.'}</span>
        </div>

        <label className="flex items-center gap-2 text-xs text-msx-textprimary">
          <span className="w-28 text-msx-textsecondary">Nombre terreno</span>
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            className="flex-1 rounded border border-msx-border bg-msx-bgcolor px-2 py-1"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-msx-textprimary">
          <input type="checkbox" checked={markSolid} onChange={event => setMarkSolid(event.target.checked)} />
          <span>Marcar todos los tiles como sólidos (capa de colisión)</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-msx-textprimary">
          <span className="w-28 text-msx-textsecondary">Tolerancia fondo</span>
          <input
            type="range"
            min={0}
            max={80}
            value={backgroundTolerance}
            onChange={event => setBackgroundTolerance(Number(event.target.value))}
            className="flex-1"
          />
          <span className="w-8 text-right">{backgroundTolerance}</span>
        </label>

        {sizeMismatch && (
          <div className="rounded border border-yellow-600/60 bg-msx-bgcolor p-2 text-[0.65rem] text-yellow-300">
            La imagen es {imageData?.width}x{imageData?.height}; se reescalará a {spec.width}x{spec.height} y las celdas pueden desalinearse si la proporción no coincide.
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <SlicedPreview tiles={result.tiles.slice(0, expectedCells)} spec={spec} palette={palette} />
            </div>
            {result.warnings.length > 0 && (
              <ul className="text-[0.65rem] text-msx-textsecondary list-disc pl-4 space-y-0.5">
                {result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>
            )}
            {!isValidGrid && (
              <div className="rounded border border-red-500/60 bg-msx-bgcolor p-2 text-[0.65rem] text-red-300">
                El resultado no es una cuadrícula {spec.columns}x{spec.rows} de {expectedCells} tiles; revisa la imagen de origen.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!result || !isValidGrid || !name.trim()}
            onClick={() => {
              if (!result || !isValidGrid) return;
              // Drop filler cells (mask null) so they never reach the atlas.
              const tiles: Msx2Screen4Tile[] = [];
              const masks: number[] = [];
              spec.masks.forEach((mask, index) => {
                if (mask === null) return;
                const tile = result.tiles[index];
                if (!tile) return;
                tiles.push(tile);
                masks.push(mask);
              });
              onImport({ name: name.trim(), template, tiles, masks, markSolid });
            }}
          >
            Importar terreno
          </Button>
        </div>
      </div>
    </div>
  );
};
