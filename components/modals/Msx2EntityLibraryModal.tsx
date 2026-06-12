import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EntityTemplate, Msx2EntityKind } from '../../types';
import { Button } from '../common/Button';
import { LoadIcon, SaveIcon, TrashIcon, DocumentDuplicateIcon } from '../icons/MsxIcons';
import {
  Msx2EntityLibraryEntry,
  exportMsx2EntityLibraryEntryFile,
  exportMsx2EntityLibraryFile,
  loadMsx2EntityLibrary,
  mergeMsx2EntityLibraryEntries,
  parseMsx2EntityLibraryFile,
  removeMsx2EntityLibraryEntry,
} from '../../utils/msx2EntityLibrary';

/**
 * Props for {@link Msx2EntityLibraryModal}.
 * @category Modal
 */
interface Msx2EntityLibraryModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Imports the chosen template into the current project (creates an entitytemplate asset). */
  onImportEntity: (template: EntityTemplate) => void;
  /** Optional status reporter. */
  setStatusBarMessage?: (message: string) => void;
}

/** Display order for the kind-grouped sections. */
const KIND_ORDER: Msx2EntityKind[] = ['player', 'enemy', 'collectible', 'hazard', 'door', 'custom'];
const KIND_LABELS: Record<Msx2EntityKind, string> = {
  player: 'Players',
  enemy: 'Enemies',
  collectible: 'Collectibles',
  hazard: 'Hazards',
  door: 'Doors',
  custom: 'Custom',
};

const summarizeComponents = (template: EntityTemplate): string =>
  (template.components || [])
    .map(component => component.definitionId.replace(/^msx2_/, ''))
    .slice(0, 6)
    .join(', ');

/**
 * Popup dialog for the global MSX2 entity library (localStorage-backed).
 * Entries are grouped by kind, searchable, and can be imported into the
 * current project, deleted, or exported. The whole library can be
 * exported/imported as a JSON file for backup and sharing.
 */
export const Msx2EntityLibraryModal: React.FC<Msx2EntityLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportEntity,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2EntityLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<Msx2EntityKind, boolean>>>({});
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2EntityLibrary());
      setSearch('');
    }
  }, [isOpen]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? entries.filter(entry => entry.name.toLowerCase().includes(query))
      : entries;
    const byKind = new Map<Msx2EntityKind, Msx2EntityLibraryEntry[]>();
    for (const entry of filtered) {
      const kind = KIND_ORDER.includes(entry.kind) ? entry.kind : 'custom';
      if (!byKind.has(kind)) byKind.set(kind, []);
      byKind.get(kind)!.push(entry);
    }
    for (const list of byKind.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return KIND_ORDER
      .filter(kind => byKind.has(kind))
      .map(kind => ({ kind, items: byKind.get(kind)! }));
  }, [entries, search]);

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2EntityLibraryEntry) => {
    if (!confirm(`Delete "${entry.name}" from the global entity library?`)) return;
    setEntries(removeMsx2EntityLibraryEntry(entry.id));
    setStatusBarMessage?.(`Deleted "${entry.name}" from the entity library.`);
  };

  const handleImport = (entry: Msx2EntityLibraryEntry) => {
    onImportEntity(entry.template);
    setStatusBarMessage?.(`Imported "${entry.name}" into the current project.`);
  };

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const incoming = parseMsx2EntityLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2EntityLibraryEntries(incoming));
        setStatusBarMessage?.(`Merged ${incoming.length} entit${incoming.length === 1 ? 'y' : 'ies'} into the library.`);
      } catch (error) {
        alert(`Could not import entity library file: ${error instanceof Error ? error.message : 'invalid file'}.`);
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
            MSX2 Entities Library <span className="text-msx-textsecondary text-sm">({totalCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleImportFileClick} variant="secondary" size="sm" icon={<LoadIcon />} title="Merge a .json library file into this library">
              Import .json
            </Button>
            <Button onClick={exportMsx2EntityLibraryFile} variant="secondary" size="sm" icon={<SaveIcon />} disabled={totalCount === 0} title="Export the whole library to a .json file">
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
            placeholder="Search entities by name..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Search entity library"
          />
        </div>

        {/* Scrollable grouped body */}
        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {totalCount === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              The library is empty. Use "Export to Library" on an MSX2 entity, or import a .json library file.
            </p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">No entities match "{search}".</p>
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
                    {KIND_LABELS[kind]}
                    <span className="text-msx-textsecondary font-normal">({items.length})</span>
                  </button>
                  {!isCollapsed && (
                    <ul className="space-y-1.5">
                      {items.map(entry => (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-3 bg-msx-bgcolor border border-msx-border rounded px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-msx-textprimary font-medium truncate" title={entry.name}>{entry.name}</p>
                            <p className="text-xs text-msx-textsecondary truncate" title={summarizeComponents(entry.template)}>
                              {summarizeComponents(entry.template) || 'no components'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button onClick={() => handleImport(entry)} variant="primary" size="sm" title="Import into the current project">
                              Import
                            </Button>
                            <Button onClick={() => exportMsx2EntityLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Export this entity to a .json file" />
                            <Button onClick={() => handleDelete(entry)} variant="ghost" size="sm" icon={<TrashIcon />} title="Delete from library" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
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

export default Msx2EntityLibraryModal;
