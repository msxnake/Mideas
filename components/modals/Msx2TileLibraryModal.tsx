import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2PaletteZones, Msx2Screen4Tile, Msx2Screen4TileBehaviorKind, PaletteAsset, ProjectAsset, Screen5PaletteSlot } from '../../types';
import { Button } from '../common/Button';
import { LoadIcon, SaveIcon, TrashIcon, DocumentDuplicateIcon, PlusCircleIcon } from '../icons/MsxIcons';
import {
  MSX2_TILE_BEHAVIOR_KINDS,
  MSX2_TILE_BEHAVIOR_LABELS,
  getMsx2TileBehaviorKind,
} from '../../utils/msx2Screen4TileBehavior';
import {
  Msx2TileLibraryEntry,
  addEntryToMsx2TileLibrary,
  exportMsx2TileLibraryEntryFile,
  exportMsx2TileLibraryFile,
  loadMsx2TileLibrary,
  mergeMsx2TileLibraryEntries,
  parseMsx2TileLibraryFile,
  removeMsx2TileLibraryEntry,
} from '../../utils/msx2TileLibrary';
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
import {
  buildScreen5BitmapTileAsset,
  createScreen5PaletteAssetForTile,
  findMatchingScreen5PaletteAsset,
} from '../../utils/msx2Screen5BitmapTileLibrary';
import {
  addStampToMsx2BitmapStampLibrary,
  loadMsx2BitmapStampLibrary,
  makeBitmapTileFromScreen5Tile,
} from '../../utils/msx2BitmapStampLibrary';
import { isMsx2TileEmpty } from '../../utils/msx2ExternalTileImport';
import { Msx2ExternalTileImportModal } from './Msx2ExternalTileImportModal';
import { Msx2TilePaletteReconcileModal } from './Msx2TilePaletteReconcileModal';

interface Msx2TileLibraryModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /**
   * Imports a reconciled tile into the current project (active SCREEN4 screen).
   * `palette` is the final screen palette; `paletteChanged` is true only when
   * the user chose to overwrite screen slots (replace mode).
   */
  onImportTiles: (tiles: Msx2Screen4Tile[], palette: Screen5PaletteSlot[], paletteChanged: boolean, paletteSourceId?: string) => void;
  /** Active SCREEN4 screen palette (null when no MSX2 screen is open). */
  destPalette?: Screen5PaletteSlot[] | null;
  /** Active SCREEN4 screen name, for context in the reconcile dialog. */
  destScreenName?: string;
  /** Project palette assets, selectable as the base palette during import. */
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
  /** Palette slots reserved by sprites/player (shared SCREEN 4 palette). */
  protectedSlots?: number[];
  /** User-defined functional zoning of the active screen's shared palette. */
  paletteZones?: Msx2PaletteZones;
  /** Persists edited zoning back onto the active screen. */
  onPaletteZonesChange?: (zones: Msx2PaletteZones) => void;
  /** Active target decides whether bitmap SCREEN 5 tiles can be imported. */
  activeTargetMode?: 'screen4' | 'screen5' | 'none';
  /** Project assets, used to create palette + msx2bitmaptile assets from the bitmap library. */
  allAssets?: ProjectAsset[];
  /** Creates bitmap tile project assets when importing from the bitmap folder. */
  onImportBitmapTileAssets?: (assets: ProjectAsset[]) => void;
  /** Optional status reporter. */
  setStatusBarMessage?: (message: string) => void;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

/** Canvas preview of a slot-indexed tile using its stored palette. */
const TileEntryPreview: React.FC<{ entry: Msx2TileLibraryEntry }> = ({ entry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = entry.tile.width ?? entry.tile.pixels?.[0]?.length ?? 16;
  const height = entry.tile.height ?? entry.tile.pixels?.length ?? 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = entry.tile.pixels?.[y]?.[x] ?? 0;
        if (slot === 0) continue;
        const hex = entry.palette[slot]?.hex || '#000000';
        if (normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX)) continue;
        ctx.fillStyle = hex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [entry, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="h-12 w-12 flex-none rounded border border-msx-border bg-black"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};

const BitmapTileEntryPreview: React.FC<{ entry: Msx2BitmapTileLibraryEntry }> = ({ entry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = Math.max(1, entry.tile.width || 16);
  const height = Math.max(1, entry.tile.height || 16);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = entry.tile.pixelData[y * width + x] ?? 0;
        if (slot === 0) continue;
        const hex = entry.palette[slot]?.hex || '#000000';
        if (normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX)) continue;
        ctx.fillStyle = hex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [entry, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="h-12 w-12 flex-none rounded border border-msx-border bg-black"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};

/**
 * Popup dialog for the global MSX2 tile library (localStorage-backed).
 * Entries are grouped by behavior kind, searchable, and can be imported into the
 * current project, deleted, or exported. New tiles are fed in via the external
 * PNG importer; the whole library can be exported/imported as a JSON file.
 */
export const Msx2TileLibraryModal: React.FC<Msx2TileLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportTiles,
  destPalette,
  destScreenName,
  paletteAssets,
  protectedSlots,
  paletteZones,
  onPaletteZonesChange,
  activeTargetMode = 'none',
  allAssets = [],
  onImportBitmapTileAssets,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2TileLibraryEntry[]>([]);
  const [bitmapEntries, setBitmapEntries] = useState<Msx2BitmapTileLibraryEntry[]>([]);
  const [bitmapStampCount, setBitmapStampCount] = useState(0);
  const [activeFolder, setActiveFolder] = useState<'screen4' | 'screen5'>('screen4');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<Msx2Screen4TileBehaviorKind, boolean>>>({});
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [reconcileEntry, setReconcileEntry] = useState<Msx2TileLibraryEntry | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2TileLibrary());
      setBitmapEntries(loadMsx2BitmapTileLibrary());
      setBitmapStampCount(loadMsx2BitmapStampLibrary().length);
      setSearch('');
    }
  }, [isOpen]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? entries.filter(entry => entry.name.toLowerCase().includes(query))
      : entries;
    const byKind = new Map<Msx2Screen4TileBehaviorKind, Msx2TileLibraryEntry[]>();
    for (const entry of filtered) {
      const kind = getMsx2TileBehaviorKind(entry.tile);
      if (!byKind.has(kind)) byKind.set(kind, []);
      byKind.get(kind)!.push(entry);
    }
    for (const list of byKind.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return MSX2_TILE_BEHAVIOR_KINDS
      .filter(kind => byKind.has(kind))
      .map(kind => ({ kind, items: byKind.get(kind)! }));
  }, [entries, search]);

  const filteredBitmapEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? bitmapEntries.filter(entry => entry.name.toLowerCase().includes(query))
      : bitmapEntries;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [bitmapEntries, search]);

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2TileLibraryEntry) => {
    if (!confirm(`¿Eliminar "${entry.name}" de la biblioteca de tiles?`)) return;
    setEntries(removeMsx2TileLibraryEntry(entry.id));
    setStatusBarMessage?.(`Eliminado "${entry.name}" de la biblioteca de tiles.`);
  };

  const handleDeleteBitmap = (entry: Msx2BitmapTileLibraryEntry) => {
    if (!confirm(`Eliminar "${entry.name}" de la biblioteca bitmap?`)) return;
    setBitmapEntries(removeMsx2BitmapTileLibraryEntry(entry.id));
    setStatusBarMessage?.(`Eliminado "${entry.name}" de la biblioteca bitmap.`);
  };

  const handleImport = (entry: Msx2TileLibraryEntry) => {
    // With an active screen we reconcile the tile palette against the screen's;
    // otherwise fall back to a direct import (the host will warn there's no
    // screen) so the action is never silently lost.
    if (destPalette && destPalette.length > 0) {
      setReconcileEntry(entry);
      return;
    }
    onImportTiles([entry.tile], entry.palette, false);
    setStatusBarMessage?.(`Importado "${entry.name}" al proyecto.`);
  };

  const handleImportBitmap = (entry: Msx2BitmapTileLibraryEntry) => {
    if (activeTargetMode === 'screen4') {
      setStatusBarMessage?.('SCREEN 4 requiere tiles color clash. Selecciona la carpeta "Color clash".');
      return;
    }
    if (!onImportBitmapTileAssets) {
      setStatusBarMessage?.('Este contexto no admite importar tiles bitmap al proyecto.');
      return;
    }
    // Reaching here means 'screen5' (a bitmap room is open) or 'none' (no screen
    // active). Both create the project asset; only the 'screen4' tile context is
    // rejected (handled above) because bitmap tiles don't belong on a color-clash
    // screen. An active room is NOT required to add a project-level bitmap tile.
    const matchingPalette = findMatchingScreen5PaletteAsset(entry.palette, allAssets);
    const paletteAsset = matchingPalette ?? createScreen5PaletteAssetForTile(entry.palette, entry.name, entry.tile.id, allAssets);
    const pixels = Array.from({ length: entry.tile.height }, (_row, y) =>
      Array.from({ length: entry.tile.width }, (_col, x) => entry.tile.pixelData[y * entry.tile.width + x] ?? 0)
    );
    const tileAsset = buildScreen5BitmapTileAsset({
      name: entry.name,
      width: entry.tile.width,
      height: entry.tile.height,
      pixels,
      paletteId: paletteAsset.id,
      existingAssets: matchingPalette ? allAssets : [...allAssets, paletteAsset],
      sourceType: 'png-import',
    });
    if (!matchingPalette) {
      (paletteAsset.data as PaletteAsset).createdFromTileId = tileAsset.id;
    }
    onImportBitmapTileAssets(matchingPalette ? [tileAsset] : [paletteAsset, tileAsset]);
    setStatusBarMessage?.(`Importado "${tileAsset.name}" como asset MSX2 Bitmap Tile.`);
  };

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        if (activeFolder === 'screen5') {
          const incoming = parseMsx2BitmapTileLibraryFile(String(loadEvent.target?.result || ''));
          setBitmapEntries(mergeMsx2BitmapTileLibraryEntries(incoming));
          setStatusBarMessage?.(`Fusionados ${incoming.length} tile(s) bitmap en la biblioteca.`);
          return;
        }
        const incoming = parseMsx2TileLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2TileLibraryEntries(incoming));
        setStatusBarMessage?.(`Fusionados ${incoming.length} tile(s) en la biblioteca.`);
      } catch (error) {
        alert(`No se pudo importar el archivo: ${error instanceof Error ? error.message : 'archivo inválido'}.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleAddTilesFromPng = (
    tiles: Msx2Screen4Tile[],
    palette: Screen5PaletteSlot[],
    outputMode: 'screen4' | 'screen5',
    layout?: { columns: number; rows: number; baseName: string },
  ) => {
    let createdProjectAssets = 0;
    if (outputMode === 'screen5') {
      if (tiles.length > 1 && layout) {
        addStampToMsx2BitmapStampLibrary(tiles, palette, layout.columns, layout.rows, layout.baseName);
      } else {
        tiles.forEach(tile => addEntryToMsx2BitmapTileLibrary(makeBitmapTileFromScreen5Tile(tile, `library_palette_${Date.now()}`), palette, tile.name));
      }
      setBitmapEntries(loadMsx2BitmapTileLibrary());
      setBitmapStampCount(loadMsx2BitmapStampLibrary().length);
      setActiveFolder('screen5');

      // Also create project assets so imported tiles land directly in the
      // "MSX2 Bitmap Tiles" folder/panel (one click away from the room atlas),
      // instead of only living in the global library. Allowed for SCREEN 5 or
      // no-screen contexts; a SCREEN 4 tile context is excluded. A single shared
      // palette asset backs the whole batch; empty cells of a multi-tile sheet are
      // skipped so the folder isn't flooded with blanks.
      if (onImportBitmapTileAssets && activeTargetMode !== 'screen4') {
        const matchingPalette = findMatchingScreen5PaletteAsset(palette, allAssets);
        const paletteAsset = matchingPalette
          ?? createScreen5PaletteAssetForTile(palette, layout?.baseName || tiles[0]?.name || 'Bitmap Tile', tiles[0]?.id || `tile_${Date.now()}`, allAssets);
        const createdTileAssets: ProjectAsset[] = [];
        for (const tile of tiles) {
          if (isMsx2TileEmpty(tile)) continue;
          createdTileAssets.push(buildScreen5BitmapTileAsset({
            name: tile.name,
            width: tile.width ?? 16,
            height: tile.height ?? 16,
            pixels: tile.pixels ?? [],
            paletteId: paletteAsset.id,
            // Feed already-built assets back in so duplicate names get suffixes.
            existingAssets: matchingPalette
              ? [...allAssets, ...createdTileAssets]
              : [...allAssets, paletteAsset, ...createdTileAssets],
            sourceType: 'png-import',
          }));
        }
        if (createdTileAssets.length > 0) {
          if (!matchingPalette) {
            (paletteAsset.data as PaletteAsset).createdFromTileId = createdTileAssets[0].id;
          }
          onImportBitmapTileAssets(matchingPalette ? createdTileAssets : [paletteAsset, ...createdTileAssets]);
          createdProjectAssets = createdTileAssets.length;
        }
      }
    } else {
      tiles.forEach(tile => addEntryToMsx2TileLibrary(tile, palette, tile.name));
      setEntries(loadMsx2TileLibrary());
      setActiveFolder('screen4');
    }
    setStatusBarMessage?.(createdProjectAssets > 0
      ? `Importados ${createdProjectAssets} tile(s) al proyecto y añadidos ${tiles.length} a la biblioteca.`
      : `Añadidos ${tiles.length} tile(s) a la biblioteca.`);
    setIsImportOpen(false);
  };

  const totalCount = entries.length + bitmapEntries.length + bitmapStampCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div
        className="bg-msx-panelbg rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[88vh] animate-slideIn"
        onClick={event => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-msx-border">
          <h2 className="text-lg text-msx-highlight pixel-font">
            MSX2 Tiles Library <span className="text-msx-textsecondary text-sm">({totalCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsImportOpen(true)} variant="primary" size="sm" icon={<PlusCircleIcon />} title="Importar tiles desde un PNG">
              Importar PNG
            </Button>
            <Button onClick={handleImportFileClick} variant="secondary" size="sm" icon={<LoadIcon />} title="Fusionar un archivo .json en esta biblioteca">
              Import .json
            </Button>
            <Button onClick={() => activeFolder === 'screen5' ? exportMsx2BitmapTileLibraryFile() : exportMsx2TileLibraryFile()} variant="secondary" size="sm" icon={<SaveIcon />} disabled={activeFolder === 'screen5' ? bitmapEntries.length === 0 : entries.length === 0} title="Exportar la carpeta activa a un .json">
              Export .json
            </Button>
            <input type="file" accept=".json,application/json" ref={importFileRef} onChange={handleImportFileSelected} className="hidden" />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-msx-border">
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar tiles por nombre..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Buscar en la biblioteca de tiles"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveFolder('screen4')}
              onDoubleClick={() => setActiveFolder('screen4')}
              className={`rounded border px-3 py-2 text-left text-xs ${activeFolder === 'screen4' ? 'border-msx-highlight bg-msx-bgcolor text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
              title="Tiles SCREEN 4 con restricciones color clash"
            >
              Carpeta: Color clash ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFolder('screen5')}
              onDoubleClick={() => setActiveFolder('screen5')}
              className={`rounded border px-3 py-2 text-left text-xs ${activeFolder === 'screen5' ? 'border-msx-highlight bg-msx-bgcolor text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
              title="Tiles bitmap SCREEN 5 sin color clash"
            >
              Carpeta: Bitmap SCREEN 5 ({bitmapEntries.length + bitmapStampCount})
            </button>
          </div>
        </div>

        {/* Scrollable grouped body */}
        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {activeFolder === 'screen5' ? (
            filteredBitmapEntries.length === 0 ? (
              <p className="text-sm text-msx-textsecondary italic py-8 text-center">No hay tiles bitmap SCREEN 5 en esta carpeta.</p>
            ) : (
              <ul className="space-y-1.5">
                {filteredBitmapEntries.map(entry => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 bg-msx-bgcolor border border-msx-border rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BitmapTileEntryPreview entry={entry} />
                      <div className="min-w-0">
                        <p className="text-sm text-msx-textprimary font-medium truncate" title={entry.name}>{entry.name}</p>
                        <p className="text-xs text-msx-textsecondary">{entry.tile.width}x{entry.tile.height} - SCREEN 5 bitmap</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button onClick={() => handleImportBitmap(entry)} variant="primary" size="sm" title="Importar al proyecto">
                        Import
                      </Button>
                      <Button onClick={() => exportMsx2BitmapTileLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Exportar este tile bitmap a un .json" />
                      <Button onClick={() => handleDeleteBitmap(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Eliminar de la biblioteca bitmap" />
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : totalCount === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              La biblioteca está vacía. Usa "Importar PNG" para crear tiles, o importa un archivo .json.
            </p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">Ningún tile coincide con "{search}".</p>
          ) : (
            groups.map(({ kind, items }) => {
              const isCollapsed = !!collapsed[kind];
              return (
                <section key={kind}>
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [kind]: !prev[kind] }))}
                    className="w-full flex items-center gap-2 text-sm font-semibold text-msx-textprimary border-b border-msx-border pb-1 mb-2"
                  >
                    <span className="text-msx-textsecondary">{isCollapsed ? '▶' : '▼'}</span>
                    {MSX2_TILE_BEHAVIOR_LABELS[kind]}
                    <span className="text-msx-textsecondary font-normal">({items.length})</span>
                  </button>
                  {!isCollapsed && (
                    <ul className="space-y-1.5">
                      {items.map(entry => {
                        const width = entry.tile.width ?? entry.tile.pixels?.[0]?.length ?? 16;
                        const height = entry.tile.height ?? entry.tile.pixels?.length ?? 16;
                        return (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between gap-3 bg-msx-bgcolor border border-msx-border rounded px-3 py-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <TileEntryPreview entry={entry} />
                              <div className="min-w-0">
                                <p className="text-sm text-msx-textprimary font-medium truncate" title={entry.name}>{entry.name}</p>
                                <p className="text-xs text-msx-textsecondary">
                                  {width}x{height} — {MSX2_TILE_BEHAVIOR_LABELS[getMsx2TileBehaviorKind(entry.tile)]}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Button onClick={() => handleImport(entry)} variant="primary" size="sm" title="Importar al proyecto">
                                Import
                              </Button>
                              <Button onClick={() => exportMsx2TileLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Exportar este tile a un .json" />
                              <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Eliminar de la biblioteca" />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-msx-border flex justify-end">
          <Button onClick={onClose} variant="ghost" size="md">Cerrar</Button>
        </div>
      </div>

      {isImportOpen && (
        <Msx2ExternalTileImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onAddTiles={handleAddTilesFromPng}
        />
      )}

      {reconcileEntry && destPalette && (
        <Msx2TilePaletteReconcileModal
          isOpen={!!reconcileEntry}
          tile={reconcileEntry.tile}
          sourcePalette={reconcileEntry.palette}
          destPalette={destPalette}
          destScreenName={destScreenName}
          paletteAssets={paletteAssets}
          protectedSlots={protectedSlots}
          zones={paletteZones}
          onZonesChange={onPaletteZonesChange}
          onCancel={() => setReconcileEntry(null)}
          onApply={(reconciledTile, palette, paletteChanged, paletteSourceId) => {
            onImportTiles([reconciledTile], palette, paletteChanged, paletteSourceId);
            setStatusBarMessage?.(`Importado "${reconcileEntry.name}" a la pantalla.`);
            setReconcileEntry(null);
          }}
        />
      )}
    </div>
  );
};

export default Msx2TileLibraryModal;
