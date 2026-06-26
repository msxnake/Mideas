import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { LoadIcon, SaveIcon, TrashIcon, DocumentDuplicateIcon } from '../icons/MsxIcons';
import {
  Msx2BitmapStampLibraryEntry,
  exportMsx2BitmapStampLibraryEntryFile,
  exportMsx2BitmapStampLibraryFile,
  loadMsx2BitmapStampLibrary,
  mergeMsx2BitmapStampLibraryEntries,
  parseMsx2BitmapStampLibraryFile,
  removeMsx2BitmapStampLibraryEntry,
} from '../../utils/msx2BitmapStampLibrary';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';
const normalizeHex = (value?: string): string => String(value || '').trim().toUpperCase();

/** Canvas preview that composes a stamp's tiles (columns x rows) using its stored palette. */
const StampPreview: React.FC<{ entry: Msx2BitmapStampLibraryEntry }> = ({ entry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cols = Math.max(1, entry.stamp.columns);
    const rows = Math.max(1, entry.stamp.rows);
    canvas.width = cols * 16;
    canvas.height = rows * 16;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    entry.stamp.tiles.forEach((tile, index) => {
      const cx = (index % cols) * 16;
      const cy = Math.floor(index / cols) * 16;
      const w = Math.max(1, tile.width || 16);
      const h = Math.max(1, tile.height || 16);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const slot = tile.pixelData[y * w + x] ?? 0;
          if (slot === 0) continue;
          const hex = entry.palette[slot]?.hex || '#000000';
          if (normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX)) continue;
          ctx.fillStyle = hex;
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    });
  }, [entry]);
  return (
    <canvas
      ref={canvasRef}
      className="h-14 w-14 flex-none rounded border border-msx-border bg-black"
      style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      aria-hidden
    />
  );
};

interface Msx2StampLibraryModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /**
   * Imports a global stamp entry into the active project as a `'msx2bitmapstamp'`
   * asset. Undefined when there is no project context (button disabled).
   */
  onImportStampAsset?: (entry: Msx2BitmapStampLibraryEntry) => void;
  /** Optional status reporter. */
  setStatusBarMessage?: (message: string) => void;
}

/**
 * Global (cross-project, localStorage-backed) MSX2 bitmap STAMP library.
 * Stamps live per-project as assets; this dialog is the opt-in shared repository:
 * import a global stamp into the current project, delete, or export/import as JSON.
 * Promotion (project → global) happens from the SCREEN 5 editor's Stamps panel.
 */
export const Msx2StampLibraryModal: React.FC<Msx2StampLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportStampAsset,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2BitmapStampLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2BitmapStampLibrary());
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const query = search.trim().toLowerCase();
  const filtered = query ? entries.filter(entry => entry.name.toLowerCase().includes(query)) : entries;

  const handleDelete = (entry: Msx2BitmapStampLibraryEntry) => {
    if (!confirm(`¿Eliminar "${entry.name}" de la biblioteca global de stamps?`)) return;
    setEntries(removeMsx2BitmapStampLibraryEntry(entry.id));
    setStatusBarMessage?.(`Eliminado "${entry.name}" de la biblioteca global de stamps.`);
  };

  const handleImportToProject = (entry: Msx2BitmapStampLibraryEntry) => {
    if (!onImportStampAsset) {
      setStatusBarMessage?.('Abre un proyecto SCREEN 5 para importar el stamp.');
      return;
    }
    onImportStampAsset(entry);
    setStatusBarMessage?.(`Importado stamp "${entry.name}" al proyecto.`);
  };

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const incoming = parseMsx2BitmapStampLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2BitmapStampLibraryEntries(incoming));
        setStatusBarMessage?.(`Fusionados ${incoming.length} stamp(s) en la biblioteca global.`);
      } catch (error) {
        alert(`No se pudo importar el archivo: ${error instanceof Error ? error.message : 'archivo inválido'}.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-msx-panelbg rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[88vh] animate-slideIn" onClick={event => event.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-msx-border">
          <h2 className="text-lg text-msx-highlight pixel-font">
            MSX2 Stamps Library <span className="text-msx-textsecondary text-sm">({entries.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleImportFileClick} variant="secondary" size="sm" icon={<LoadIcon />} title="Fusionar un archivo .json en esta biblioteca">
              Import .json
            </Button>
            <Button onClick={() => exportMsx2BitmapStampLibraryFile()} variant="secondary" size="sm" icon={<SaveIcon />} disabled={entries.length === 0} title="Exportar toda la biblioteca a un .json">
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
            placeholder="Buscar stamps por nombre..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Buscar en la biblioteca de stamps"
          />
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
          {entries.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              La biblioteca global está vacía. Crea stamps importando un PNG de varios tiles en el editor
              SCREEN 5 y súbelos aquí con "↑ Global".
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">Ningún stamp coincide con "{search}".</p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map(entry => (
                <li key={entry.id} className="flex items-center justify-between gap-3 bg-msx-bgcolor border border-msx-border rounded px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <StampPreview entry={entry} />
                    <div className="min-w-0">
                      <p className="text-sm text-msx-textprimary font-medium truncate" title={entry.name}>{entry.name}</p>
                      <p className="text-xs text-msx-textsecondary">{entry.stamp.columns}x{entry.stamp.rows} tiles — SCREEN 5 stamp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button onClick={() => handleImportToProject(entry)} variant="primary" size="sm" disabled={!onImportStampAsset} title="Importar este stamp al proyecto activo">
                      Import
                    </Button>
                    <Button onClick={() => exportMsx2BitmapStampLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Exportar este stamp a un .json" />
                    <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Eliminar de la biblioteca global" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-msx-border flex justify-end">
          <Button onClick={onClose} variant="ghost" size="md">Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2StampLibraryModal;
