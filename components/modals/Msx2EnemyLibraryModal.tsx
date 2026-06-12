import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EnemyCategory, EnemyDefinition } from '../../types';
import { Button } from '../common/Button';
import { LoadIcon, SaveIcon, TrashIcon, DocumentDuplicateIcon } from '../icons/MsxIcons';
import {
  Msx2EnemyLibraryEntry,
  exportMsx2EnemyLibraryEntryFile,
  exportMsx2EnemyLibraryFile,
  loadMsx2EnemyLibrary,
  mergeMsx2EnemyLibraryEntries,
  parseMsx2EnemyLibraryFile,
  removeMsx2EnemyLibraryEntry,
} from '../../utils/msx2EnemyLibrary';

/**
 * Props for {@link Msx2EnemyLibraryModal}.
 * @category Modal
 */
interface Msx2EnemyLibraryModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Imports the chosen enemy into the current project's enemy definitions. */
  onImportEnemy: (enemy: EnemyDefinition) => void;
  /** Optional status reporter. */
  setStatusBarMessage?: (message: string) => void;
}

/** Display order for the category-grouped sections. */
const CATEGORY_ORDER: EnemyCategory[] = ['simpleEnemy', 'boss', 'hazard', 'projectileLike'];
const CATEGORY_LABELS: Record<EnemyCategory, string> = {
  simpleEnemy: 'Simple Enemies',
  boss: 'Bosses',
  hazard: 'Hazards',
  projectileLike: 'Projectile-like',
};

const resolveCategory = (value: EnemyCategory | undefined): EnemyCategory =>
  value && CATEGORY_ORDER.includes(value) ? value : 'simpleEnemy';

/**
 * Popup dialog for the global MSX2 enemy library (localStorage-backed).
 * Enemies are grouped by category, searchable, and can be imported into the
 * current project, deleted, or exported. The whole library can be
 * exported/imported as a JSON file for backup and sharing.
 */
export const Msx2EnemyLibraryModal: React.FC<Msx2EnemyLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportEnemy,
  setStatusBarMessage,
}) => {
  const [entries, setEntries] = useState<Msx2EnemyLibraryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<EnemyCategory, boolean>>>({});
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadMsx2EnemyLibrary());
      setSearch('');
    }
  }, [isOpen]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? entries.filter(entry => entry.name.toLowerCase().includes(query))
      : entries;
    const byCategory = new Map<EnemyCategory, Msx2EnemyLibraryEntry[]>();
    for (const entry of filtered) {
      const category = resolveCategory(entry.enemy.category);
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push(entry);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return CATEGORY_ORDER
      .filter(category => byCategory.has(category))
      .map(category => ({ category, items: byCategory.get(category)! }));
  }, [entries, search]);

  if (!isOpen) return null;

  const handleDelete = (entry: Msx2EnemyLibraryEntry) => {
    if (!confirm(`Delete "${entry.name}" from the global enemy library?`)) return;
    setEntries(removeMsx2EnemyLibraryEntry(entry.id));
    setStatusBarMessage?.(`Deleted "${entry.name}" from the enemy library.`);
  };

  const handleImport = (entry: Msx2EnemyLibraryEntry) => {
    onImportEnemy(entry.enemy);
    setStatusBarMessage?.(`Imported "${entry.name}" into the current project.`);
  };

  const handleImportFileClick = () => importFileRef.current?.click();

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const incoming = parseMsx2EnemyLibraryFile(String(loadEvent.target?.result || ''));
        setEntries(mergeMsx2EnemyLibraryEntries(incoming));
        setStatusBarMessage?.(`Merged ${incoming.length} enem${incoming.length === 1 ? 'y' : 'ies'} into the library.`);
      } catch (error) {
        alert(`Could not import enemy library file: ${error instanceof Error ? error.message : 'invalid file'}.`);
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
            MSX2 Enemies Library <span className="text-msx-textsecondary text-sm">({totalCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleImportFileClick} variant="secondary" size="sm" icon={<LoadIcon />} title="Merge a .json library (or plain enemy .json) into this library">
              Import .json
            </Button>
            <Button onClick={exportMsx2EnemyLibraryFile} variant="secondary" size="sm" icon={<SaveIcon />} disabled={totalCount === 0} title="Export the whole library to a .json file">
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
            placeholder="Search enemies by name..."
            className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent"
            aria-label="Search enemy library"
          />
        </div>

        {/* Scrollable grouped body */}
        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {totalCount === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">
              The library is empty. Use "Export to Library" on a selected enemy, or import a .json file.
            </p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-msx-textsecondary italic py-8 text-center">No enemies match "{search}".</p>
          ) : (
            groups.map(({ category, items }) => {
              const isCollapsed = !!collapsed[category];
              return (
                <section key={category}>
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
                    className="w-full flex items-center gap-2 text-sm font-semibold text-msx-textprimary border-b border-msx-border pb-1 mb-2"
                  >
                    <span className="text-msx-textsecondary">{isCollapsed ? '▶' : '▼'}</span>
                    {CATEGORY_LABELS[category]}
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
                            <p className="text-xs text-msx-textsecondary truncate">
                              {entry.enemy.behavior?.type || 'None'} · {entry.enemy.attack?.type || 'None'} · world: {entry.enemy.world || 'common'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button onClick={() => handleImport(entry)} variant="primary" size="sm" title="Import into the current project">
                              Import
                            </Button>
                            <Button onClick={() => exportMsx2EnemyLibraryEntryFile(entry)} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} title="Export this enemy to a .json file" />
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

export default Msx2EnemyLibraryModal;
