import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2PaletteZones, Msx2Screen4Tile, Msx2Screen4TileBehaviorKind, PaletteAsset, Screen5PaletteSlot } from '../../types';
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
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2TileLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<Msx2Screen4TileBehaviorKind, boolean>>>({});
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [reconcileEntry, setReconcileEntry] = useState<Msx2TileLibraryEntry | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2TileLibrary());
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

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2TileLibraryEntry) => {
    if (!confirm(`¿Eliminar "${entry.name}" de la biblioteca de tiles?`)) return;
    setEntries(removeMsx2TileLibraryEntry(entry.id));
    setStatusBarMessage?.(`Eliminado "${entry.name}" de la biblioteca de tiles.`);
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

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
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

  const handleAddTilesFromPng = (tiles: Msx2Screen4Tile[], palette: Screen5PaletteSlot[]) => {
    tiles.forEach(tile => addEntryToMsx2TileLibrary(tile, palette, tile.name));
    setEntries(loadMsx2TileLibrary());
    setStatusBarMessage?.(`Añadidos ${tiles.length} tile(s) a la biblioteca.`);
    setIsImportOpen(false);
  };

  const totalCount = entries.length;

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
            <Button onClick={exportMsx2TileLibraryFile} variant="secondary" size="sm" icon={<SaveIcon />} disabled={totalCount === 0} title="Exportar toda la biblioteca a un .json">
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
        </div>

        {/* Scrollable grouped body */}
        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {totalCount === 0 ? (
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
