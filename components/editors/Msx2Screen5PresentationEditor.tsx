import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Msx2Screen5PresentationConfig as BaseMsx2Screen5PresentationConfig, Screen5PaletteSlot } from '../../types';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { FolderOpenIcon, ImageIcon, RefreshCwIcon } from '../icons/MsxIcons';
import {
  convertImageDataToMsx2Screen5Presentation,
  drawMsx2Screen5PresentationPreview,
  getScreen5PresentationStats,
  normalizeScreen5PresentationPixels,
  packScreen5PresentationPixels,
  SCREEN5_PRESENTATION_WIDTH,
  type Msx2Screen5PresentationCompressionConfig,
  type Msx2Screen5PresentationFitMode,
  type Msx2Screen5PresentationHeight,
  type Msx2Screen5PresentationRuntimeConfig,
} from '../utils/msx2Screen5PresentationUtils';

type ExistingScreen5PresentationData = {
  width?: number;
  height?: number;
  palette?: Screen5PaletteSlot[];
  packedPixels?: number[];
  pixels?: number[][];
  packedBitmap?: number[];
};

export type Msx2Screen5PresentationEditorConfig = Partial<BaseMsx2Screen5PresentationConfig> & {
  name: string;
  sourceFileName: string | null;
  sourceImageWidth: number;
  sourceImageHeight: number;
  width: typeof SCREEN5_PRESENTATION_WIDTH;
  height: Msx2Screen5PresentationHeight;
  fitMode: Msx2Screen5PresentationFitMode;
  palette: Screen5PaletteSlot[];
  pixels: number[][];
  packedBitmap: number[];
  compression: Msx2Screen5PresentationCompressionConfig;
  runtime: Msx2Screen5PresentationRuntimeConfig;
  updatedAt: number | null;
  lastImportError: string | null;
  data?: ExistingScreen5PresentationData;
};

interface Msx2Screen5PresentationEditorProps {
  config: BaseMsx2Screen5PresentationConfig | Msx2Screen5PresentationEditorConfig;
  onUpdate: (config: Msx2Screen5PresentationEditorConfig) => void;
}

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp';

const DEFAULT_COMPRESSION: Msx2Screen5PresentationCompressionConfig = {
  codec: 'ZX0',
  enabled: true,
  chunkLines: 32,
};

const DEFAULT_RUNTIME: Msx2Screen5PresentationRuntimeConfig = {
  showAtBoot: false,
  clearSpritesBeforeShow: true,
  waitForKey: true,
  waitForFrames: 0,
  vramPage: 0,
  romDataGroup: 'auto',
};

function isScreen5Height(value: unknown): value is Msx2Screen5PresentationHeight {
  return value === 192 || value === 212;
}

function isFitMode(value: unknown): value is Msx2Screen5PresentationFitMode {
  return value === 'cover' || value === 'contain' || value === 'stretch';
}

function loadImageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo no es una imagen PNG, JPG o WebP valida.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo preparar el canvas para importar la imagen.'));
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function normalizeConfig(
  config: BaseMsx2Screen5PresentationConfig | Msx2Screen5PresentationEditorConfig
): Msx2Screen5PresentationEditorConfig {
  const flat = config as Partial<Msx2Screen5PresentationEditorConfig>;
  const data = flat.data as ExistingScreen5PresentationData | undefined;
  const height = isScreen5Height(flat.height) ? flat.height : (isScreen5Height(data?.height) ? data.height : 212);
  const { slots } = ensureScreen5PaletteSlots(flat.palette ?? data?.palette);
  const pixels = normalizeScreen5PresentationPixels(flat.pixels ?? data?.pixels, height);
  const packedBitmap = flat.packedBitmap ?? data?.packedBitmap ?? data?.packedPixels ?? packScreen5PresentationPixels(pixels);

  return {
    ...flat,
    enabled: flat.enabled ?? true,
    name: flat.name || 'MSX2 SCREEN 5 Presentation',
    target: 'MSX2',
    screenMode: 'SCREEN 5',
    sourceFileName: flat.sourceFileName ?? null,
    sourceImageWidth: flat.sourceImageWidth ?? 0,
    sourceImageHeight: flat.sourceImageHeight ?? 0,
    width: SCREEN5_PRESENTATION_WIDTH,
    height,
    fitMode: isFitMode(flat.fitMode) ? flat.fitMode : 'cover',
    palette: slots,
    pixels,
    packedBitmap,
    compression: { ...DEFAULT_COMPRESSION, ...flat.compression },
    runtime: { ...DEFAULT_RUNTIME, ...flat.runtime },
    updatedAt: flat.updatedAt ?? null,
    lastImportError: flat.lastImportError ?? null,
    data: {
      width: SCREEN5_PRESENTATION_WIDTH,
      height,
      palette: slots,
      packedPixels: packedBitmap,
      pixels,
      packedBitmap,
    },
  };
}

export const Msx2Screen5PresentationEditor: React.FC<Msx2Screen5PresentationEditorProps> = ({ config, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastImageDataRef = useRef<ImageData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const current = useMemo(() => normalizeConfig(config), [config]);
  const stats = useMemo(
    () => getScreen5PresentationStats(current.height, current.packedBitmap.length),
    [current.height, current.packedBitmap.length]
  );

  useEffect(() => {
    if (previewCanvasRef.current) {
      drawMsx2Screen5PresentationPreview(previewCanvasRef.current, current.pixels, current.palette, 2);
    }
  }, [current.pixels, current.palette]);

  const emitUpdate = (next: Msx2Screen5PresentationEditorConfig) => {
    const normalized = normalizeConfig({
      ...next,
      data: {
        width: SCREEN5_PRESENTATION_WIDTH,
        height: next.height,
        palette: next.palette,
        packedPixels: next.packedBitmap,
        pixels: next.pixels,
        packedBitmap: next.packedBitmap,
      },
    });
    onUpdate(normalized);
  };

  const rebuildFromImageData = (
    imageData: ImageData,
    sourceFileName: string | null,
    height: Msx2Screen5PresentationHeight,
    fitMode: Msx2Screen5PresentationFitMode
  ) => {
    const converted = convertImageDataToMsx2Screen5Presentation(imageData, {
      name: current.name,
      sourceFileName,
      height,
      fitMode,
      palette: current.palette,
      compression: current.compression,
      runtime: current.runtime,
    });
    emitUpdate({
      ...current,
      ...converted,
      enabled: true,
      target: 'MSX2',
      screenMode: 'SCREEN 5',
    });
  };

  const updateName = (name: string) => {
    emitUpdate({ ...current, name, updatedAt: Date.now() });
  };

  const updateHeight = (height: Msx2Screen5PresentationHeight) => {
    if (lastImageDataRef.current) {
      rebuildFromImageData(lastImageDataRef.current, current.sourceFileName, height, current.fitMode);
      return;
    }
    const pixels = normalizeScreen5PresentationPixels(current.pixels, height);
    const packedBitmap = packScreen5PresentationPixels(pixels);
    emitUpdate({ ...current, height, pixels, packedBitmap, updatedAt: Date.now() });
  };

  const updateFitMode = (fitMode: Msx2Screen5PresentationFitMode) => {
    if (lastImageDataRef.current) {
      rebuildFromImageData(lastImageDataRef.current, current.sourceFileName, current.height, fitMode);
      return;
    }
    emitUpdate({ ...current, fitMode, updatedAt: Date.now() });
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const imageData = await loadImageDataFromFile(file);
      lastImageDataRef.current = imageData;
      rebuildFromImageData(imageData, file.name, current.height, current.fitMode);
    } catch (error) {
      emitUpdate({
        ...current,
        lastImportError: error instanceof Error ? error.message : String(error),
        updatedAt: Date.now(),
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImporting(false);
    }
  };

  return (
    <div className="h-full min-h-0 grid grid-cols-[260px_1fr_280px] gap-2 p-2 bg-msx-bgcolor overflow-hidden">
      <div className="min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-2">
        <Panel title="SCREEN 5 Import" icon={<ImageIcon />}>
          <div className="space-y-3 text-xs">
            <label className="block space-y-1">
              <span className="text-msx-textsecondary">Name</span>
              <input
                value={current.name}
                onChange={event => updateName(event.target.value)}
                className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded text-sm"
              />
            </label>

            <Button
              size="sm"
              variant="secondary"
              icon={<FolderOpenIcon />}
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import PNG/JPG/WebP'}
            </Button>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} className="hidden" onChange={handleFileSelected} />

            <div className="space-y-1">
              <span className="block text-msx-textsecondary">Height</span>
              <div className="grid grid-cols-2 gap-1">
                {[192, 212].map(height => (
                  <Button
                    key={height}
                    size="sm"
                    variant={current.height === height ? 'primary' : 'ghost'}
                    onClick={() => updateHeight(height as Msx2Screen5PresentationHeight)}
                  >
                    {height}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-msx-textsecondary">Fit</span>
              <div className="grid grid-cols-3 gap-1">
                {(['cover', 'contain', 'stretch'] as Msx2Screen5PresentationFitMode[]).map(mode => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={current.fitMode === mode ? 'primary' : 'ghost'}
                    onClick={() => updateFitMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {lastImageDataRef.current && (
              <Button
                size="sm"
                variant="ghost"
                icon={<RefreshCwIcon />}
                className="w-full"
                onClick={() => rebuildFromImageData(lastImageDataRef.current!, current.sourceFileName, current.height, current.fitMode)}
              >
                Rebuild
              </Button>
            )}
          </div>
        </Panel>

        <Panel title="Palette Slots">
          <div className="grid grid-cols-4 gap-2">
            {current.palette.map(slot => (
              <div
                key={slot.slotIndex}
                className="h-8 rounded border border-msx-border flex items-center justify-center text-[0.65rem] text-white"
                style={{ backgroundColor: slot.hex === 'rgba(0,0,0,0)' ? '#05070b' : slot.hex }}
                title={`Slot ${slot.slotIndex}: ${slot.hex}`}
              >
                <span className="bg-black/50 px-1 rounded">{slot.slotIndex}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="text-sm text-msx-textprimary">
            {current.width} x {current.height} SCREEN 5 4bpp
          </div>
          <div className="text-xs text-msx-textsecondary">
            Preview renders from quantized pixels and palette
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-black/30 border border-msx-border flex items-start justify-center p-3">
          <canvas ref={previewCanvasRef} className="block border border-msx-border bg-black" />
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
        <Panel title="Stats">
          <div className="space-y-2 text-xs text-msx-textsecondary">
            <div>Source: {current.sourceFileName || 'none'}</div>
            <div>Original: {current.sourceImageWidth} x {current.sourceImageHeight}</div>
            <div>Target: {current.width} x {current.height}</div>
            <div>Fit: {current.fitMode}</div>
            <div>Raw bytes: {stats.rawBytes}</div>
            <div>Packed length: {stats.packedLength}</div>
            <div>Chunks: {stats.chunks} x {stats.chunkLines} lines</div>
            <div>Full chunk bytes: {stats.bytesPerFullChunk}</div>
            <div>Compression: {current.compression.enabled ? current.compression.codec : 'none'}</div>
            {current.updatedAt && <div>Updated: {new Date(current.updatedAt).toLocaleString()}</div>}
          </div>
        </Panel>

        <Panel title="Runtime">
          <div className="space-y-2 text-xs text-msx-textsecondary">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={current.runtime.showAtBoot}
                onChange={event => emitUpdate({
                  ...current,
                  runtime: { ...current.runtime, showAtBoot: event.target.checked },
                  updatedAt: Date.now(),
                })}
              />
              Show at boot
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={current.runtime.waitForKey}
                onChange={event => emitUpdate({
                  ...current,
                  runtime: { ...current.runtime, waitForKey: event.target.checked },
                  updatedAt: Date.now(),
                })}
              />
              Wait for key
            </label>
            <label className="block space-y-1">
              <span>Wait frames</span>
              <input
                type="number"
                min={0}
                max={65535}
                value={current.runtime.waitForFrames}
                onChange={event => emitUpdate({
                  ...current,
                  runtime: { ...current.runtime, waitForFrames: Math.max(0, Number(event.target.value) || 0) },
                  updatedAt: Date.now(),
                })}
                className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded"
              />
            </label>
          </div>
        </Panel>

        {current.lastImportError && (
          <Panel title="Import Error">
            <div className="text-xs text-msx-danger whitespace-pre-wrap">{current.lastImportError}</div>
          </Panel>
        )}
      </div>
    </div>
  );
};
