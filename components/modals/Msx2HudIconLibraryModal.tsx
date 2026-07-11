import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2HudIconEntry } from '../../types';
import { Button } from '../common/Button';
import { LoadIcon, SaveIcon, TrashIcon, DocumentDuplicateIcon } from '../icons/MsxIcons';
import {
  Msx2HudIconLibraryEntry,
  exportMsx2HudIconLibraryEntryFile,
  exportMsx2HudIconLibraryFile,
  loadMsx2HudIconLibrary,
  mergeMsx2HudIconLibraryEntries,
  parseMsx2HudIconLibraryFile,
  removeMsx2HudIconLibraryEntry,
} from '../../utils/msx2HudIconLibrary';

/**
 * Props for {@link Msx2HudIconLibraryModal}.
 * @category Modal
 */
interface Msx2HudIconLibraryModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /**
   * Imports the chosen icon into the current project's active HUD asset.
   * Undefined when no HUD asset is open (Import stays disabled).
   */
  onImportIcon?: (icon: Msx2HudIconEntry) => void;
  /** Optional status reporter. */
  setStatusBarMessage?: (message: string) => void;
}

/** Canvas preview of a slot-indexed HUD icon using its stored palette. */
const IconEntryPreview: React.FC<{ entry: Msx2HudIconLibraryEntry }> = ({ entry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = Math.max(1, entry.icon.width);
  const height = Math.max(1, entry.icon.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = entry.icon.pixels[y]?.[x];
        if (slot === undefined || slot < 0) continue;
        const hex = entry.palette[slot]?.hex;
        if (!hex || hex === 'rgba(0,0,0,0)') continue;
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
 * Popup dialog for the global MSX2 HUD icon library (localStorage-backed).
 * Icons are shown as a searchable thumbnail list and can be imported into the
 * currently open HUD asset, deleted, or exported. The whole library can be
 * exported/imported as a JSON file for backup and sharing.
 */
export const Msx2HudIconLibraryModal: React.FC<Msx2HudIconLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportIcon,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2HudIconLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2HudIconLibrary());
      setSearch('');
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query ? entries.filter(entry => entry.name.toLowerCase().includes(query)) : entries;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, search]);

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2HudIconLibraryEntry) => {
    if (!confirm(`Delete "${entry.name}" from the global HUD icon library?`)) return;
    setEntries(removeMsx2HudIconLibraryEntry(entry.id));
    setStatusBarMessage?.(`Deleted "${entry.name}" from the HUD icon library.`);
  };

  const handleImport = (entry: Msx2HudIconLibraryEntry) => {
    if (!onImportIcon) return;
    onImportIcon(entry.icon);
    setStatusBarMessage?.(`Imported "${entry.name}" into the current HUD asset.`);
  };

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const incoming = parseMsx2HudIconLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2HudIconLibraryEntries(incoming));
        setStatusBarMessage?.(`Merged ${incoming.length} icon${incoming.length === 1 ? '' : 's'} into the library.`);
      } catch (error) {
        alert(`Could not import HUD icon library file: ${error instanceof Error ? error.message : 'invalid file'}.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const totalCount = entries.length;
  const importTitle = onImportIcon ? 'Import into the current HUD asset' : 'Open a HUD asset to import icons into it';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div
        className="bg-msx-panelbg rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[88vh] animate-slideIn"
        onClick={event => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-msx-border">
          <h2 className="text-lg text-msx-highlight pixel-font">
            MSX2 HUD Icons Library <span className="text-msx-textsecondary text-sm">({totalCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleImportFileClick} variant="secondary" size="sm" icon={<LoadIcon />} title="Merge a .json library file into this library">
              Import .json
            </Button>
            <Button onClick={exportMsx2HudIconLibraryFile} variant="secondary" size="sm" icon={<SaveIcon />} disabled={totalCount === 0} title="Export the whole library to a .json file">
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
            placeholder="Search icons by name..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Search HUD icon library"
          />
          {!onImportIcon && (
            <p className="text-[0.65rem] text-msx-textsecondary mt-1">Open a HUD asset to enable importing icons into it.</p>
          )}
        </div>

        {/* Scrollable list */}
        <div className="flex-grow overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
          {totalCount === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              The library is empty. Use "Export to Library" in the HUD Editor's Assets tab, or import a .json library file.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">No icons match "{search}".</p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map(entry => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 bg-msx-bgcolor border border-msx-border rounded px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconEntryPreview entry={entry} />
                    <div className="min-w-0">
                      <p className="text-sm text-msx-textprimary font-medium truncate" title={entry.name}>{entry.name}</p>
                      <p className="text-xs text-msx-textsecondary">{entry.icon.width}x{entry.icon.height}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button onClick={() => handleImport(entry)} variant="primary" size="sm" disabled={!onImportIcon} title={importTitle}>Import</Button>
                    <Button onClick={() => exportMsx2HudIconLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Export this icon to a .json file" />
                    <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Delete from library" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-msx-border flex justify-end">
          <Button onClick={onClose} variant="ghost" size="md">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default Msx2HudIconLibraryModal;
