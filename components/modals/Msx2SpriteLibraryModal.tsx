import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Sprite } from '../../types';
import { Button } from '../common/Button';
import { LoadIcon, SaveIcon, TrashIcon, DocumentDuplicateIcon, PlusCircleIcon } from '../icons/MsxIcons';
import { createSpriteDataURL } from '../utils/screenUtils';
import {
  Msx2SpriteLibraryEntry,
  exportMsx2SpriteLibraryEntryFile,
  exportMsx2SpriteLibraryFile,
  loadMsx2SpriteLibrary,
  mergeMsx2SpriteLibraryEntries,
  parseMsx2SpriteLibraryFile,
  removeMsx2SpriteLibraryEntry,
} from '../../utils/msx2SpriteLibrary';

/**
 * Props for {@link Msx2SpriteLibraryModal}.
 * @category Modal
 */
interface Msx2SpriteLibraryModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Imports the chosen sprite into the current project (creates an msx2sprite asset). */
  onImportSprite: (sprite: Msx2Sprite) => void;
  /** Optional: create a brand new blank MSX2 sprite asset. */
  onNewSprite?: () => void;
  /** Optional status reporter. */
  setStatusBarMessage?: (message: string) => void;
}

/** Renders a single library sprite's first frame as a pixelated thumbnail. */
const SpriteThumbnail: React.FC<{ sprite: Msx2Sprite }> = ({ sprite }) => {
  const dataUrl = useMemo(() => {
    const frame = sprite.frames?.[0];
    if (!frame) return '';
    return createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
  }, [sprite]);
  if (!dataUrl) {
    return <div className="w-16 h-16 bg-msx-panelbg border border-dashed border-msx-border" />;
  }
  return (
    <img
      src={dataUrl}
      alt={sprite.name}
      className="w-16 h-16 object-contain border border-msx-border bg-msx-panelbg"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

/**
 * Popup dialog for the global MSX2 sprite library (localStorage-backed).
 * Sprites are shown as a searchable thumbnail grid and can be imported into
 * the current project, deleted, or exported. The whole library can be
 * exported/imported as a JSON file for backup and sharing.
 */
export const Msx2SpriteLibraryModal: React.FC<Msx2SpriteLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportSprite,
  onNewSprite,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2SpriteLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2SpriteLibrary());
      setSearch('');
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query ? entries.filter(entry => entry.name.toLowerCase().includes(query)) : entries;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, search]);

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2SpriteLibraryEntry) => {
    if (!confirm(`Delete "${entry.name}" from the global sprite library?`)) return;
    setEntries(removeMsx2SpriteLibraryEntry(entry.id));
    setStatusBarMessage?.(`Deleted "${entry.name}" from the sprite library.`);
  };

  const handleImport = (entry: Msx2SpriteLibraryEntry) => {
    onImportSprite(entry.sprite);
    setStatusBarMessage?.(`Imported "${entry.name}" into the current project.`);
  };

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const incoming = parseMsx2SpriteLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2SpriteLibraryEntries(incoming));
        setStatusBarMessage?.(`Merged ${incoming.length} sprite${incoming.length === 1 ? '' : 's'} into the library.`);
      } catch (error) {
        alert(`Could not import sprite library file: ${error instanceof Error ? error.message : 'invalid file'}.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
            MSX2 Sprites Library <span className="text-msx-textsecondary text-sm">({totalCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {onNewSprite && (
              <Button onClick={onNewSprite} variant="secondary" size="sm" icon={<PlusCircleIcon />} title="Create a new blank MSX2 sprite in this project">
                New Sprite
              </Button>
            )}
            <Button onClick={handleImportFileClick} variant="secondary" size="sm" icon={<LoadIcon />} title="Merge a .json library file into this library">
              Import .json
            </Button>
            <Button onClick={exportMsx2SpriteLibraryFile} variant="secondary" size="sm" icon={<SaveIcon />} disabled={totalCount === 0} title="Export the whole library to a .json file">
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
            placeholder="Search sprites by name..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Search sprite library"
          />
        </div>

        {/* Scrollable thumbnail grid */}
        <div className="flex-grow overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
          {totalCount === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              The library is empty. Use "Export to Library" in the MSX2 Sprite editor, or import a .json library file.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">No sprites match "{search}".</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map(entry => (
                <div key={entry.id} className="flex flex-col items-center gap-1.5 bg-msx-bgcolor border border-msx-border rounded p-2">
                  <SpriteThumbnail sprite={entry.sprite} />
                  <p className="text-xs text-msx-textprimary font-medium truncate w-full text-center" title={entry.name}>{entry.name}</p>
                  <p className="text-[10px] text-msx-textsecondary">{entry.sprite.size.width}x{entry.sprite.size.height} · {entry.sprite.frames.length}f</p>
                  <div className="flex items-center gap-1 w-full">
                    <Button onClick={() => handleImport(entry)} variant="primary" size="sm" className="flex-1" title="Import into the current project">Import</Button>
                    <Button onClick={() => exportMsx2SpriteLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Export this sprite to a .json file" />
                    <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Delete from library" />
                  </div>
                </div>
              ))}
            </div>
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

export default Msx2SpriteLibraryModal;
