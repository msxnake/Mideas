import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2PaletteZones, Msx2Screen4Tile, PaletteAsset, Screen5PaletteSlot } from '../../types';
import { Button } from '../common/Button';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import {
  createDefaultPaletteZones,
  getSpriteZoneSlots,
  getTileZoneSlots,
  normalizePaletteZones,
} from '../../utils/msx2PaletteZones';
import { Msx2PaletteZoneBar } from './Msx2PaletteZoneBar';
import {
  Msx2TilePaletteReconcileMode,
  buildAdaptMap,
  buildSmartReconcile,
  classifyTileColors,
  getTileUsedColors,
  reconcileTile,
} from '../../utils/msx2TilePaletteReconcile';

/** Colors within this % of an existing palette color are flagged as "near". */
const NEAR_MARGIN_PCT = 5;

interface Msx2TilePaletteReconcileModalProps {
  isOpen: boolean;
  /** Tile being imported (library entry). */
  tile: Msx2Screen4Tile;
  /** Palette the tile was authored against. */
  sourcePalette: Screen5PaletteSlot[];
  /** Destination screen palette (current). */
  destPalette: Screen5PaletteSlot[];
  /** Destination screen display name, for context. */
  destScreenName?: string;
  /** Project palette assets, selectable as the base palette to use. */
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
  /** Palette slots reserved by sprites/player (shared SCREEN 4 palette). */
  protectedSlots?: number[];
  /** User-defined functional zoning of the shared palette (sprites vs tiles). */
  zones?: Msx2PaletteZones;
  /** Emitted when the user edits the zoning so the host can persist it. */
  onZonesChange?: (zones: Msx2PaletteZones) => void;
  onCancel: () => void;
  /**
   * @param paletteSourceId 'screen' when the screen's own palette was the base,
   * otherwise the id of the selected palette asset (so the host can write the
   * modified palette back to that asset, not only to the screen).
   */
  onApply: (tile: Msx2Screen4Tile, palette: Screen5PaletteSlot[], paletteChanged: boolean, paletteSourceId: string) => void;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const palettesEqual = (a: Screen5PaletteSlot[], b: Screen5PaletteSlot[]): boolean =>
  a.length === b.length
  && a.every((slot, index) => normalizeHex(slot.hex) === normalizeHex(b[index]?.hex) && slot.masterIndex === b[index]?.masterIndex);

/** Canvas preview of a slot-indexed tile using a given palette. */
const ReconcileTilePreview: React.FC<{
  tile: Msx2Screen4Tile;
  palette: Screen5PaletteSlot[];
  zoom?: number;
}> = ({ tile, palette, zoom = 8 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = tile.width ?? tile.pixels?.[0]?.length ?? 16;
  const height = tile.height ?? tile.pixels?.length ?? 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width * zoom;
    canvas.height = height * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = tile.pixels?.[y]?.[x] ?? 0;
        if (slot === 0) continue;
        const hex = palette[slot]?.hex || '#000000';
        if (normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX)) continue;
        ctx.fillStyle = hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
  }, [tile, palette, width, height, zoom]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded border border-msx-border bg-black"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};

export const Msx2TilePaletteReconcileModal: React.FC<Msx2TilePaletteReconcileModalProps> = ({
  isOpen,
  tile,
  sourcePalette,
  destPalette,
  destScreenName,
  paletteAssets = [],
  protectedSlots = [],
  zones,
  onZonesChange,
  onCancel,
  onApply,
}) => {
  const usablePaletteAssets = useMemo(
    () => paletteAssets.filter(asset => asset.data?.mode === 'SCREEN4' || asset.data?.mode === 'SCREEN5'),
    [paletteAssets],
  );
  const originalScreen = useMemo(() => ensureScreen5PaletteSlots(destPalette).slots, [destPalette]);
  const usedColors = useMemo(() => getTileUsedColors(tile, sourcePalette), [tile, sourcePalette]);

  // Effective zoning: normalized against the screen palette, defaulting when the
  // host has not stored any zones yet.
  const effectiveZones = useMemo(
    () => (zones ? normalizePaletteZones(zones, originalScreen) : createDefaultPaletteZones(originalScreen)),
    [zones, originalScreen],
  );

  // Sprite-zone slots are explicitly protected (user-controlled), unioned with
  // the slots actually used by existing sprites/player (auto-detected).
  const protectedSet = useMemo(() => {
    const set = new Set<number>(protectedSlots);
    getSpriteZoneSlots(effectiveZones, originalScreen).forEach(slot => set.add(slot));
    return set;
  }, [protectedSlots, effectiveZones, originalScreen]);

  // Which palette to reconcile against: the screen's current palette, or any
  // project palette asset selected by the user.
  const [selectedSource, setSelectedSource] = useState<string>('screen');
  // 'replace' is the smart "enrich" mode (reuse existing, ask on near, add new).
  const [mode, setMode] = useState<Msx2TilePaletteReconcileMode>('replace');
  // Adapt-mode per-color override (source slot -> destination slot).
  const [assignment, setAssignment] = useState<Record<number, number>>({});
  // Enrich-mode: source slots whose 'near' match the user chose to add as new.
  const [forceNew, setForceNew] = useState<Record<number, boolean>>({});

  const workingDest = useMemo(() => {
    if (selectedSource === 'screen') return originalScreen;
    const asset = usablePaletteAssets.find(candidate => candidate.id === selectedSource);
    return asset?.data ? ensureScreen5PaletteSlots(asset.data.slots).slots : originalScreen;
  }, [selectedSource, usablePaletteAssets, originalScreen]);

  useEffect(() => {
    if (isOpen) setSelectedSource('screen');
  }, [isOpen]);

  // Adapt defaults to the nearest existing slot per color (editable below);
  // reset near-match choices whenever the inputs change.
  useEffect(() => {
    if (!isOpen) return;
    setAssignment(Object.fromEntries(buildAdaptMap(usedColors, workingDest)));
    setForceNew({});
  }, [isOpen, usedColors, workingDest]);

  // Classify each tile color vs the working palette: exact (reuse), near (<=5%,
  // ask), or new (allocate). Avoids saturating the palette with duplicates.
  const colorMatches = useMemo(
    () => classifyTileColors(usedColors, workingDest, NEAR_MARGIN_PCT),
    [usedColors, workingDest],
  );

  const forceNewSet = useMemo(() => {
    const set = new Set<number>();
    Object.entries(forceNew).forEach(([slot, value]) => { if (value) set.add(Number(slot)); });
    return set;
  }, [forceNew]);

  const adaptMap = useMemo(() => {
    const map = new Map<number, number>([[0, 0]]);
    usedColors.forEach(usage => map.set(usage.slot, assignment[usage.slot] ?? usage.slot));
    return map;
  }, [assignment, usedColors]);

  const smart = useMemo(
    () => buildSmartReconcile(tile, sourcePalette, workingDest, colorMatches, forceNewSet, protectedSet),
    [tile, sourcePalette, workingDest, colorMatches, forceNewSet, protectedSet],
  );

  const result = useMemo(() => {
    if (mode === 'adapt') {
      const adapted = reconcileTile(tile, sourcePalette, workingDest, 'adapt', adaptMap);
      return { tile: adapted.tile, palette: adapted.palette };
    }
    return { tile: smart.tile, palette: smart.palette };
  }, [mode, tile, sourcePalette, workingDest, adaptMap, smart]);

  if (!isOpen) return null;

  const setDestSlot = (sourceSlot: number, destSlot: number) =>
    setAssignment(current => ({ ...current, [sourceSlot]: destSlot }));

  const selectableSlots = workingDest.filter(slot => slot.slotIndex >= 1 && slot.slotIndex <= 15);
  const paletteChanged = !palettesEqual(result.palette, originalScreen);
  // Enrich mode: 'new' colors that had to land on a sprite/used slot → warn.
  const conflictSlots = mode === 'replace'
    ? Array.from(new Set(Array.from(smart.allocation.values())
        .filter(info => info.mode === 'new' && protectedSet.has(info.dest))
        .map(info => info.dest)))
      .sort((a, b) => a - b)
    : [];
  const handleApply = () => onApply(result.tile, result.palette, paletteChanged, selectedSource);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded border border-msx-border bg-msx-panelbg shadow-xl">
        <div className="flex items-center justify-between border-b border-msx-border px-4 py-3">
          <h2 className="text-base font-semibold text-msx-highlight">
            Conciliar paleta del tile{destScreenName ? ` → ${destScreenName}` : ''}
          </h2>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cerrar</Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_220px] gap-4 overflow-auto p-4 text-xs">
          <div className="space-y-4">
            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3 space-y-2">
              <label className="block">
                <span className="mb-1 block text-msx-textsecondary">Paleta a usar</span>
                <select
                  value={selectedSource}
                  onChange={event => setSelectedSource(event.target.value)}
                  className="w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
                >
                  <option value="screen">Paleta de la pantalla{destScreenName ? ` (${destScreenName})` : ''}</option>
                  {usablePaletteAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.data?.mode})</option>
                  ))}
                </select>
              </label>
              {usablePaletteAssets.length === 0 && (
                <div className="text-[10px] text-msx-textsecondary">
                  No hay assets de paleta SCREEN4/SCREEN5 en el proyecto; se usa la de la pantalla.
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {workingDest.map(slot => {
                  const reserved = protectedSet.has(slot.slotIndex);
                  return (
                    <span
                      key={slot.slotIndex}
                      title={`S${slot.slotIndex} ${slot.hex}${reserved ? ' — usado por sprite/player' : ''}`}
                      className={`h-4 w-4 rounded border ${reserved ? 'border-msx-danger ring-1 ring-msx-danger' : 'border-msx-border'}`}
                      style={{ backgroundColor: slot.slotIndex === 0 ? 'transparent' : slot.hex }}
                    />
                  );
                })}
              </div>
              {protectedSet.size > 0 && (
                <div className="text-[10px] text-msx-textsecondary">
                  <span className="text-msx-danger">⚠</span> = slot usado por sprites/player (no conviene sobrescribirlo).
                </div>
              )}
              {selectedSource !== 'screen' && paletteChanged && (
                <div className="text-[10px] text-msx-highlight">
                  Se guardarán los cambios en el asset de paleta «{usablePaletteAssets.find(asset => asset.id === selectedSource)?.name || selectedSource}» y la pantalla lo adoptará.
                </div>
              )}
            </div>

            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <Msx2PaletteZoneBar
                palette={originalScreen}
                zones={effectiveZones}
                onChange={onZonesChange}
                readOnly={!onZonesChange}
              />
              <div className="mt-2 text-[10px] text-msx-textsecondary">
                Los tiles importados (modo reemplazar) ocupan la zona de Tiles; la zona de Sprites
                queda protegida. Arrastra las flechas para mover el límite.
              </div>
            </div>

            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3 space-y-2">
              <label className="flex items-start gap-2">
                <input type="radio" name="reconcile-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-0.5" />
                <span>
                  <span className="font-semibold text-msx-textprimary">Enriquecer paleta (recomendado)</span>
                  <span className="block text-msx-textsecondary">
                    Reusa los colores que ya existen, avisa de los muy parecidos (≤{NEAR_MARGIN_PCT}%) para que elijas, y
                    añade los nuevos en slots libres. No duplica colores.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="reconcile-mode" checked={mode === 'adapt'} onChange={() => setMode('adapt')} className="mt-0.5" />
                <span>
                  <span className="font-semibold text-msx-textprimary">Adaptar a la paleta existente</span>
                  <span className="block text-msx-textsecondary">
                    No modifica la paleta. Cada color del tile se asigna al slot existente más parecido.
                  </span>
                </span>
              </label>
            </div>

            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 text-msx-textsecondary">
                Colores del tile ({usedColors.length})
              </div>
              {usedColors.length === 0 ? (
                <div className="text-msx-textsecondary">El tile no usa colores (vacío).</div>
              ) : mode === 'adapt' ? (
                <ul className="space-y-2">
                  {usedColors.map(usage => {
                    const destSlot = assignment[usage.slot] ?? usage.slot;
                    const destHex = workingDest[destSlot]?.hex || '#000000';
                    return (
                      <li key={usage.slot} className="flex items-center gap-2">
                        <span className="h-6 w-6 flex-none rounded border border-msx-border" style={{ backgroundColor: usage.hex }} title={`Origen S${usage.slot} ${usage.hex}`} />
                        <span className="text-msx-textsecondary">S{usage.slot}</span>
                        <span className="text-msx-textsecondary">→</span>
                        <select
                          value={destSlot}
                          onChange={event => setDestSlot(usage.slot, Number(event.target.value))}
                          className="rounded border border-msx-border bg-msx-panelbg px-2 py-1"
                        >
                          {selectableSlots.map(slot => (
                            <option key={slot.slotIndex} value={slot.slotIndex}>
                              S{slot.slotIndex} {slot.hex}{protectedSet.has(slot.slotIndex) ? ' ⚠ sprite' : ''}
                            </option>
                          ))}
                        </select>
                        <span className="h-6 w-6 flex-none rounded border border-msx-border" style={{ backgroundColor: destHex }} title={`Destino S${destSlot}`} />
                        <span className="flex-1 text-right text-[10px] text-msx-textsecondary">{usage.count}px</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="space-y-2">
                  {colorMatches.map(match => {
                    const alloc = smart.allocation.get(match.slot);
                    const dest = alloc?.dest ?? match.slot;
                    const isNew = alloc?.mode === 'new';
                    return (
                      <li key={match.slot} className="flex items-center gap-2">
                        <span className="h-6 w-6 flex-none rounded border border-msx-border" style={{ backgroundColor: match.hex }} title={`Tile S${match.slot} ${match.hex}`} />
                        <span className="min-w-0 flex-1">
                          {match.status === 'exact' && (
                            <span className="text-green-400">= ya existe en S{match.matchSlot}</span>
                          )}
                          {match.status === 'near' && (
                            <span className="text-yellow-300">≈ parecido a S{match.matchSlot} ({match.percentDiff.toFixed(1)}%)</span>
                          )}
                          {match.status === 'new' && (
                            <span className="text-msx-highlight">+ color nuevo → S{dest}{protectedSet.has(dest) ? ' ⚠' : ''}</span>
                          )}
                        </span>
                        {match.status === 'near' && (
                          <div className="flex flex-none items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setForceNew(current => ({ ...current, [match.slot]: false }))}
                              className={`rounded border px-1.5 py-0.5 ${!forceNewSet.has(match.slot) ? 'border-msx-highlight text-msx-highlight' : 'border-msx-border text-msx-textsecondary'}`}
                            >Usar existente</button>
                            <button
                              type="button"
                              onClick={() => setForceNew(current => ({ ...current, [match.slot]: true }))}
                              className={`rounded border px-1.5 py-0.5 ${forceNewSet.has(match.slot) ? 'border-msx-highlight text-msx-highlight' : 'border-msx-border text-msx-textsecondary'}`}
                            >Crear nuevo</button>
                          </div>
                        )}
                        <span
                          className="h-6 w-6 flex-none rounded border border-msx-border"
                          style={{ backgroundColor: isNew ? match.hex : (workingDest[dest]?.hex || '#000000') }}
                          title={`Destino S${dest}`}
                        />
                        <span className="w-10 flex-none text-right text-[10px] text-msx-textsecondary">{match.count}px</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {mode === 'replace' && (
                <div className="mt-2 text-[10px] text-msx-textsecondary">
                  <span className="text-green-400">=</span> reusa existente · <span className="text-yellow-300">≈</span> parecido (elige) · <span className="text-msx-highlight">+</span> color nuevo en slot libre.
                </div>
              )}
              {mode === 'replace' && conflictSlots.length > 0 && (
                <div className="mt-1 text-[10px] text-msx-danger">
                  ⚠ No quedan slots libres: los colores nuevos se escribirán en {conflictSlots.map(slot => `S${slot}`).join(', ')},
                  usados por sprites/player. Reusa colores parecidos o libera slots.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded border border-msx-border bg-msx-bgcolor/50 p-3">
              <div className="mb-2 text-msx-textsecondary">Resultado en la pantalla</div>
              <div className="flex items-center justify-center">
                <ReconcileTilePreview tile={result.tile} palette={result.palette} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-msx-border px-4 py-3">
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" variant="primary" onClick={handleApply}>
            Importar a la pantalla
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2TilePaletteReconcileModal;
