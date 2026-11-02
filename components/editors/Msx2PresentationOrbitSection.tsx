import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Msx2GameFlowScreen5PresentationNode, Msx2OrbitTetrahedronConfig, ProjectAsset } from '../../types';
import {
  defaultOrbitTetrahedronConfig,
  orbitSpriteCandidates,
  orbitTetrahedronForNode,
  paletteEntryCss,
} from '../../utils/msx2OrbitTetrahedronEditorUtils';
import { createOrbitPreview, ORBIT_PREVIEW_HEIGHT, ORBIT_PREVIEW_WIDTH } from '../../utils/msx2OrbitTetrahedronPreview';

/**
 * "Figura orbital" section of a Screen5Presentation node in the SCREEN 5 GameFlow editor: a tetrahedron of four sprite dots
 * that spins and orbits the picture of the node (SCREEN 5 bitmap-room backend, boot only). It picks the dot sprites,
 * exposes the tuning, shows what the export will do (palette entries, data size, every validation message) and plays the
 * same tables the ROM will stream, with the dots cut by the picture where they go behind it.
 */

interface Props {
  node: Msx2GameFlowScreen5PresentationNode;
  allAssets: ProjectAsset[];
  /** True when the flow compiles through the SCREEN 5 bitmap-room backend (the only one that plays the figure). */
  bitmapBackend: boolean;
  onChange: (config: Msx2OrbitTetrahedronConfig | undefined) => void;
}

type NumericKey = 'cycleFrames' | 'frameDelay' | 'edge' | 'dotDiameter' | 'orbitRadius' | 'orbitTilt' | 'spinX' | 'spinZ';

const NUMERIC_FIELDS: Array<{ key: NumericKey; label: string; placeholder: string; min: number; max: number; step: number }> = [
  { key: 'cycleFrames', label: 'Fotogramas por órbita', placeholder: '240', min: 8, max: 255, step: 1 },
  { key: 'frameDelay', label: 'Vblanks por fotograma', placeholder: '1', min: 1, max: 255, step: 1 },
  { key: 'edge', label: 'Arista (px, en el plano de la imagen)', placeholder: '32', min: 4, max: 120, step: 1 },
  { key: 'dotDiameter', label: 'Diámetro del punto (px)', placeholder: '12', min: 2, max: 16, step: 1 },
  { key: 'orbitRadius', label: 'Radio de la órbita (px)', placeholder: 'auto', min: 8, max: 200, step: 1 },
  { key: 'orbitTilt', label: 'Inclinación de la órbita (rad)', placeholder: '0.35', min: 0, max: 1.4, step: 0.05 },
  { key: 'spinX', label: 'Vueltas sobre X por órbita', placeholder: '2', min: -8, max: 8, step: 1 },
  { key: 'spinZ', label: 'Vueltas sobre Z por órbita', placeholder: '1', min: -8, max: 8, step: 1 },
];

export const Msx2PresentationOrbitSection: React.FC<Props> = ({ node, allAssets, bitmapBackend, onChange }) => {
  const config = node.orbitTetrahedron;
  const enabled = !!config?.enabled;
  const candidates = useMemo(() => orbitSpriteCandidates(allAssets), [allAssets]);
  const usable = candidates.filter(candidate => candidate.ok);
  const unusable = candidates.filter(candidate => !candidate.ok);
  const selectedIds = config?.spriteAssetIds || [];
  const missingIds = selectedIds.filter(id => !candidates.some(candidate => candidate.asset.id === id));

  // Built exactly as the export builds it. Position changes of the node do not matter, so they are not dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const build = useMemo(() => orbitTetrahedronForNode(node, allAssets, bitmapBackend), [config, node.id, node.presentationAssetId, node.fxAssetId, allAssets, bitmapBackend]);
  const preview = useMemo(
    () => (build.result && build.paletteBytes && build.bitmapBytes ? createOrbitPreview(build.result, build.paletteBytes, build.bitmapBytes) : undefined),
    [build],
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const [playing, setPlaying] = useState(true);
  const [pausedFrame, setPausedFrame] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !preview) return undefined;
    const image = context.createImageData(ORBIT_PREVIEW_WIDTH, ORBIT_PREVIEW_HEIGHT);
    const paint = (frame: number) => {
      preview.draw(frame, image.data);
      context.putImageData(image, 0, 0);
    };
    if (!playing) {
      paint(pausedFrame);
      return undefined;
    }
    let handle = 0;
    const started = performance.now() - (frameRef.current * 1000 * preview.delay) / 60;
    const tick = (now: number) => {
      const frame = Math.floor(((now - started) * 60) / 1000 / preview.delay) % preview.frameCount;
      frameRef.current = frame;
      paint(frame);
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [preview, playing, pausedFrame]);

  const update = (changes: Partial<Msx2OrbitTetrahedronConfig>) => {
    const next = { ...(config || defaultOrbitTetrahedronConfig(allAssets)), ...changes } as Msx2OrbitTetrahedronConfig;
    // an empty field means "use the default": drop the key
    for (const key of Object.keys(next) as Array<keyof Msx2OrbitTetrahedronConfig>) {
      if (next[key] === undefined) delete (next as unknown as Record<string, unknown>)[key];
    }
    onChange(next);
  };
  const setNumber = (key: NumericKey, raw: string) => {
    const value = raw.trim() === '' ? undefined : Number(raw);
    update({ [key]: value !== undefined && Number.isFinite(value) ? value : undefined } as Partial<Msx2OrbitTetrahedronConfig>);
  };
  const toggleSprite = (id: string, on: boolean) => {
    const without = selectedIds.filter(item => item !== id);
    update({ spriteAssetIds: on ? [...without, id] : without });
  };
  const paletteSlots = config?.paletteSlots;
  const setPaletteSlot = (index: number, raw: string) => {
    const slots: Array<number | undefined> = [paletteSlots?.[0], paletteSlots?.[1], paletteSlots?.[2]];
    slots[index] = raw.trim() === '' ? undefined : Number(raw);
    update({ paletteSlots: slots.every(slot => slot !== undefined && Number.isFinite(slot)) ? (slots as [number, number, number]) : undefined });
  };

  const entries = build.result?.paletteEntries;
  const summary = build.result;

  return (
    <div className="space-y-1.5 border-t border-msx-border pt-2">
      <h3 className="text-sm font-semibold">Figura orbital (tetraedro)</h3>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={enabled}
          onChange={event => {
            if (event.target.checked) update({ enabled: true });
            else if (config) onChange({ ...config, enabled: false });
          }}
        />
        Mostrar un tetraedro de 4 puntos orbitando la imagen
      </label>
      {!enabled && (
        <p className="text-[10px] text-msx-textsecondary">
          Sustituye la espera de esta presentación por un tetraedro de sprites que gira sobre sí mismo y orbita la imagen, pasando por delante y por detrás
          (los puntos de detrás se recortan con la silueta de la imagen). Todo el movimiento va precalculado en tablas de la ROM.
        </p>
      )}
      {enabled && (
        <>
          <div className="text-xs">
            Bolas (assets MSX2 Sprite, una por tamaño)
            <div className="mt-1 max-h-32 overflow-y-auto border border-msx-border rounded p-1 space-y-0.5">
              {usable.length === 0 && (
                <p className="text-[10px] text-msx-textsecondary">
                  No hay sprites válidos: crea sprites MSX2 de 16x16 que usen solo los slots 1 (borde A), 2 (brillo B) y 3 (cuerpo A|B).
                </p>
              )}
              {usable.map(({ asset, diameter }) => (
                <label key={asset.id} className="flex items-center gap-2 text-[11px]">
                  <input type="checkbox" checked={selectedIds.includes(asset.id)} onChange={event => toggleSprite(asset.id, event.target.checked)} />
                  <span className="truncate">{asset.name}</span>
                  <span className="text-msx-textsecondary">{diameter}px</span>
                </label>
              ))}
              {missingIds.map(id => (
                <label key={id} className="flex items-center gap-2 text-[11px] text-red-300">
                  <input type="checkbox" checked onChange={() => toggleSprite(id, false)} />
                  <span className="truncate">{id} (no existe)</span>
                </label>
              ))}
            </div>
            {unusable.length > 0 && (
              <details className="mt-1">
                <summary className="text-[10px] text-msx-textsecondary cursor-pointer">{unusable.length} sprite(s) que no sirven como bola</summary>
                <ul className="text-[10px] text-msx-textsecondary list-disc pl-4">
                  {unusable.slice(0, 12).map(({ asset, reason }) => <li key={asset.id}>{asset.name}: {reason}</li>)}
                  {unusable.length > 12 && <li>...y {unusable.length - 12} más.</li>}
                </ul>
              </details>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {NUMERIC_FIELDS.map(field => (
              <label key={field.key} className="block text-[11px]">
                {field.label}
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={config?.[field.key] ?? ''}
                  placeholder={field.key === 'orbitRadius' && summary ? `auto (${Math.round(summary.orbitRadius)})` : field.placeholder}
                  onChange={event => setNumber(field.key, event.target.value)}
                  className="mt-0.5 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
            ))}
            <label className="block text-[11px]">
              Qué tapa a los puntos de detrás
              <select
                value={config?.maskMode || 'silhouette'}
                onChange={event => update({ maskMode: event.target.value === 'pixels' ? 'pixels' : undefined })}
                className="mt-0.5 w-full bg-msx-panelbg border border-msx-border rounded p-1"
              >
                <option value="silhouette">La silueta de la imagen</option>
                <option value="pixels">Solo los píxeles dibujados</option>
              </select>
            </label>
          </div>

          <div className="text-[11px]">
            Entradas de paleta de los puntos (borde A, brillo B, cuerpo A|B)
            <div className="mt-0.5 flex items-center gap-1">
              {[0, 1, 2].map(index => (
                <input
                  key={index}
                  type="number"
                  min={1}
                  max={15}
                  value={paletteSlots?.[index] ?? ''}
                  placeholder="auto"
                  onChange={event => setPaletteSlot(index, event.target.value)}
                  className="w-14 bg-msx-panelbg border border-msx-border rounded p-1"
                />
              ))}
              {entries && build.paletteBytes && (
                <span className="flex items-center gap-1 ml-1 text-[10px] text-msx-textsecondary">
                  usa
                  {[entries.rim, entries.highlight, entries.body].map(slot => (
                    <span key={slot} className="inline-flex items-center gap-0.5">
                      <span className="inline-block w-3 h-3 border border-msx-border" style={{ background: paletteEntryCss(build.paletteBytes!, slot) }} />
                      {slot}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>

          {preview && (
            <div className="space-y-1">
              <canvas
                ref={canvasRef}
                width={ORBIT_PREVIEW_WIDTH}
                height={ORBIT_PREVIEW_HEIGHT}
                className="w-full border border-msx-border bg-black"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="flex items-center gap-2 text-[10px] text-msx-textsecondary">
                <button
                  type="button"
                  className="px-2 py-0.5 rounded border border-msx-border bg-msx-panelbg hover:bg-msx-border"
                  onClick={() => { setPausedFrame(frameRef.current); setPlaying(!playing); }}
                >
                  {playing ? 'Pausa' : 'Reproducir'}
                </button>
                {!playing && (
                  <input
                    type="range"
                    min={0}
                    max={preview.frameCount - 1}
                    value={pausedFrame}
                    onChange={event => { frameRef.current = Number(event.target.value); setPausedFrame(Number(event.target.value)); }}
                    className="flex-1"
                  />
                )}
                <span>{playing ? `${preview.frameCount} fotogramas` : `fotograma ${pausedFrame + 1}/${preview.frameCount}`}</span>
              </div>
            </div>
          )}

          {summary && build.romBytes !== undefined && (
            <p className="text-[10px] text-msx-textsecondary">
              {summary.frameCount} fotogramas ({(summary.frameCount * summary.delay / 60).toFixed(2)} s por órbita), radio {Math.round(summary.orbitRadius)} px ·
              {' '}{build.romBytes} bytes de ROM en {summary.frameBlocks.length} bloque(s) de datos + patrones.
            </p>
          )}
          {build.errors.length > 0 && (
            <ul className="text-[10px] text-red-300 list-disc pl-4">
              {build.errors.slice(0, 6).map((message, index) => <li key={index}>{message}</li>)}
            </ul>
          )}
          {build.warnings.length > 0 && (
            <ul className="text-[10px] text-amber-300 list-disc pl-4">
              {build.warnings.slice(0, 6).map((message, index) => <li key={index}>{message}</li>)}
            </ul>
          )}
          <p className="text-[10px] text-msx-textsecondary">
            La figura sustituye la espera del nodo: gira hasta que se pulsa ESPACIO. Solo se ejecuta en el arranque, con el backend bitmap-room y en MegaROM.
            Los colores de los puntos salen de la paleta de la imagen; el walker de GameFlow y el backend estricto exportan la imagen estática.
          </p>
        </>
      )}
    </div>
  );
};
