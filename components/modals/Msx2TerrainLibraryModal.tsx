import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { DocumentDuplicateIcon, LoadIcon, SaveIcon, TrashIcon } from '../icons/MsxIcons';
import {
  Msx2BitmapTerrainLibraryEntry,
  exportMsx2BitmapTerrainLibraryEntryFile,
  exportMsx2BitmapTerrainLibraryFile,
  loadMsx2BitmapTerrainLibrary,
  mergeMsx2BitmapTerrainLibraryEntries,
  parseMsx2BitmapTerrainLibraryFile,
  removeMsx2BitmapTerrainLibraryEntry,
} from '../../utils/msx2BitmapTerrainLibrary';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';
const normalizeHex = (value?: string): string => String(value || '').trim().toUpperCase();

const TerrainPreview: React.FC<{ entry: Msx2BitmapTerrainLibraryEntry }> = ({ entry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cols = 4;
    const rows = Math.max(1, Math.ceil(Math.min(entry.tiles.length, 16) / cols));
    canvas.width = cols * 16;
    canvas.height = rows * 16;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    entry.tiles.slice(0, 16).forEach((tile, index) => {
      const ox = (index % cols) * 16;
      const oy = Math.floor(index / cols) * 16;
      const width = Math.max(1, tile.width || 16);
      const height = Math.max(1, tile.height || 16);
      for (let y = 0; y < Math.min(height, 16); y++) {
        for (let x = 0; x < Math.min(width, 16); x++) {
          const slot = tile.pixels?.[y]?.[x] ?? 0;
          if (slot === 0) continue;
          const hex = entry.palette?.[slot]?.hex || '#000000';
          if (normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX)) continue;
          ctx.fillStyle = hex;
          ctx.fillRect(ox + x, oy + y, 1, 1);
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

interface Msx2TerrainLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTerrainAsset?: (entry: Msx2BitmapTerrainLibraryEntry) => void;
  setStatusBarMessage?: (message: string) => void;
}

export const Msx2TerrainLibraryModal: React.FC<Msx2TerrainLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportTerrainAsset,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2BitmapTerrainLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2BitmapTerrainLibrary());
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const query = search.trim().toLowerCase();
  const filtered = query ? entries.filter(entry => entry.name.toLowerCase().includes(query)) : entries;

  const handleDelete = (entry: Msx2BitmapTerrainLibraryEntry) => {
    if (!confirm(`Eliminar "${entry.name}" de la biblioteca global de terrains?`)) return;
    setEntries(removeMsx2BitmapTerrainLibraryEntry(entry.id));
    setStatusBarMessage?.(`Eliminado "${entry.name}" de la biblioteca global de terrains.`);
  };

  const handleImportToProject = (entry: Msx2BitmapTerrainLibraryEntry) => {
    if (!onImportTerrainAsset) {
      setStatusBarMessage?.('Abre o crea un proyecto SCREEN 5 para importar el terrain.');
      return;
    }
    onImportTerrainAsset(entry);
    setStatusBarMessage?.(`Importado terrain "${entry.name}" al proyecto.`);
  };

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const incoming = parseMsx2BitmapTerrainLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2BitmapTerrainLibraryEntries(incoming));
        setStatusBarMessage?.(`Fusionados ${incoming.length} terrain(s) en la biblioteca global.`);
      } catch (error) {
        alert(`No se pudo importar el archivo: ${error instanceof Error ? error.message : 'archivo invalido'}.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-msx-panelbg rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[88vh] animate-slideIn" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-msx-border">
          <h2 className="text-lg text-msx-highlight pixel-font">
            MSX2 Terrains Library <span className="text-msx-textsecondary text-sm">({entries.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => importFileRef.current?.click()} variant="secondary" size="sm" icon={<LoadIcon />} title="Fusionar un archivo .json en esta biblioteca">
              Import .json
            </Button>
            <Button onClick={() => exportMsx2BitmapTerrainLibraryFile()} variant="secondary" size="sm" icon={<SaveIcon />} disabled={entries.length === 0} title="Exportar toda la biblioteca a un .json">
              Export .json
            </Button>
            <input type="file" accept=".json,application/json" ref={importFileRef} onChange={handleImportFileSelected} className="hidden" />
          </div>
        </div>

        <div className="px-4 py-2 border-b border-msx-border">
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar terrains por nombre..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Buscar en la biblioteca de terrains"
          />
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
          {entries.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              La biblioteca global esta vacia. En el editor SCREEN 5, usa "Exportar terrain_asset" sobre un terrain para guardarlo aqui.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">Ningun terrain coincide con "{search}".</p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map(entry => (
                <li key={entry.id} className="flex items-center justify-between gap-3 bg-msx-bgcolor border border-msx-border rounded px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <TerrainPreview entry={entry} />
                    <div className="min-w-0">
                      <p className="text-sm text-msx-textprimary font-medium truncate" title={entry.name}>{entry.name}</p>
                      <p className="text-xs text-msx-textsecondary">
                        {entry.terrain.template} - {entry.tiles.length} tiles - SCREEN 5 terrain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button onClick={() => handleImportToProject(entry)} variant="primary" size="sm" disabled={!onImportTerrainAsset} title="Importar este terrain al proyecto activo">
                      Import
                    </Button>
                    <Button onClick={() => exportMsx2BitmapTerrainLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Exportar este terrain a un .json" />
                    <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Eliminar de la biblioteca global" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t border-msx-border flex justify-end">
          <Button onClick={onClose} variant="ghost" size="md">Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2TerrainLibraryModal;
