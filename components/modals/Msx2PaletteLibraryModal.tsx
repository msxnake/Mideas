import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PaletteAsset } from '../../types';
import { Button } from '../common/Button';
import { DocumentDuplicateIcon, LoadIcon, PlusCircleIcon, SaveIcon, TrashIcon } from '../icons/MsxIcons';
import {
  Msx2PaletteLibraryEntry,
  exportMsx2PaletteLibraryEntryFile,
  exportMsx2PaletteLibraryFile,
  loadMsx2PaletteLibrary,
  mergeMsx2PaletteLibraryEntries,
  parseMsx2PaletteLibraryFile,
  removeMsx2PaletteLibraryEntry,
} from '../../utils/msx2PaletteLibrary';

interface Msx2PaletteLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPalette?: (palette: PaletteAsset, name: string) => void;
  onNewPalette?: () => void;
  setStatusBarMessage?: (message: string) => void;
}

const isTransparent = (hex: string | undefined): boolean =>
  String(hex || '').trim().toUpperCase() === 'RGBA(0,0,0,0)';

const PalettePreview: React.FC<{ palette: PaletteAsset }> = ({ palette }) => (
  <div className="grid grid-cols-8 overflow-hidden rounded border border-msx-border bg-black">
    {palette.slots.slice(0, 16).map((slot, index) => (
      <div
        key={`${slot.slotIndex}-${index}`}
        className="aspect-square min-w-5 border-[0.5px] border-black/30"
        title={`S${index}: ${isTransparent(slot.hex) ? 'transparent' : slot.hex} · M${slot.masterIndex}`}
        style={isTransparent(slot.hex)
          ? { background: 'repeating-conic-gradient(#64748b 0 25%, #1e293b 0 50%) 50% / 8px 8px' }
          : { backgroundColor: slot.hex }}
      />
    ))}
  </div>
);

export const Msx2PaletteLibraryModal: React.FC<Msx2PaletteLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportPalette,
  onNewPalette,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2PaletteLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEntries(loadMsx2PaletteLibrary());
    setSearch('');
  }, [isOpen]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = query
      ? entries.filter(entry =>
          entry.name.toLowerCase().includes(query)
          || entry.palette.mode.toLowerCase().includes(query)
          || String(entry.palette.notes || '').toLowerCase().includes(query))
      : entries;
    return [...matches].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, search]);

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2PaletteLibraryEntry) => {
    if (!confirm(`Delete "${entry.name}" from the global palette library?`)) return;
    setEntries(removeMsx2PaletteLibraryEntry(entry.id));
    setStatusBarMessage?.(`Deleted "${entry.name}" from the palette library.`);
  };

  const handleImport = (entry: Msx2PaletteLibraryEntry) => {
    if (!onImportPalette) return;
    onImportPalette(entry.palette, entry.name);
    setStatusBarMessage?.(`Imported palette "${entry.name}" into the current project.`);
  };

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const fallbackName = file.name
          .replace(/\.msx2palette\.json$/i, '')
          .replace(/\.json$/i, '')
          .trim() || 'Imported Palette';
        const incoming = parseMsx2PaletteLibraryFile(
          String(loadEvent.target?.result || ''),
          fallbackName,
        );
        setEntries(mergeMsx2PaletteLibraryEntries(incoming));
        setStatusBarMessage?.(`Merged ${incoming.length} palette${incoming.length === 1 ? '' : 's'} into the global library.`);
      } catch (error) {
        alert(`Could not import palette library file: ${error instanceof Error ? error.message : 'invalid file'}.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-lg bg-msx-panelbg shadow-xl animate-slideIn" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-msx-border px-4 py-3">
          <div>
            <h2 className="text-lg text-msx-highlight pixel-font">
              MSX2 Palettes Library <span className="text-sm text-msx-textsecondary">({entries.length})</span>
            </h2>
            <p className="mt-1 text-xs text-msx-textsecondary">Global palette-only library, shared by every Mideas project in this browser.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onNewPalette && (
              <Button onClick={onNewPalette} variant="secondary" size="sm" icon={<PlusCircleIcon />}>New Palette</Button>
            )}
            <Button onClick={() => importFileRef.current?.click()} variant="secondary" size="sm" icon={<LoadIcon />}>Import .json</Button>
            <Button onClick={exportMsx2PaletteLibraryFile} variant="secondary" size="sm" icon={<SaveIcon />} disabled={!entries.length}>Export .json</Button>
            <input ref={importFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFileSelected} />
          </div>
        </div>

        <div className="border-b border-msx-border px-4 py-2">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search palettes by name, mode or notes..."
            className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-sm text-msx-textprimary focus:border-msx-accent focus:outline-none"
            aria-label="Search palette library"
          />
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
          {!entries.length ? (
            <p className="py-10 text-center text-sm italic text-msx-textsecondary">
              The library is empty. Open a Palette asset and use "Export to Library", or import a palette-library JSON file.
            </p>
          ) : !filtered.length ? (
            <p className="py-10 text-center text-sm italic text-msx-textsecondary">No palettes match "{search}".</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(entry => (
                <article key={entry.id} className="flex flex-col gap-2 rounded border border-msx-border bg-msx-bgcolor p-3">
                  <PalettePreview palette={entry.palette} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-msx-textprimary" title={entry.name}>{entry.name}</div>
                    <div className="text-[11px] text-msx-textsecondary">{entry.palette.mode} · 16 slots</div>
                    {entry.palette.notes && <div className="mt-1 line-clamp-2 text-[10px] text-msx-textsecondary">{entry.palette.notes}</div>}
                  </div>
                  <div className="mt-auto flex items-center gap-1">
                    <Button onClick={() => handleImport(entry)} variant="primary" size="sm" className="flex-1" disabled={!onImportPalette}>Import</Button>
                    <Button onClick={() => exportMsx2PaletteLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Export this palette" />
                    <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Delete from library" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-msx-border px-4 py-3">
          <Button onClick={onClose} variant="ghost" size="md">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2PaletteLibraryModal;
