/**
 * Global MSX2 entity library.
 *
 * A browser-local (localStorage) store of reusable MSX2 entity presets that
 * survives across projects — analogous to the Sound Presets store
 * (SoundEditor.tsx) but for `EntityTemplate` assets with target MSX2.
 *
 * The library is pure IDE authoring data: it is NEVER compiled into the ROM.
 * The MSX2 SCREEN 4 generator is instance-driven (reads `screen.layers.entities`),
 * so library entries and imported presets add 0 bytes to the ROM until an
 * instance is actually placed on a screen.
 *
 * Persistence: localStorage (live store) + JSON file export/import for backup
 * and sharing between machines (patterns reused from EnemyLibraryView).
 */

import { EntityTemplate, Msx2EntityKind } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2EntityLibrary_v1';

/** A single saved entity in the global library. */
export interface Msx2EntityLibraryEntry {
  /** Stable entry id (timestamp + slug); distinct from the template id. */
  id: string;
  /** Display name (defaults to the template name). */
  name: string;
  /** Entity kind, used as the dialog grouping key. */
  kind: Msx2EntityKind;
  /** Epoch ms when the entry was saved. */
  savedAt: number;
  /** The MSX2 entity template (components + msx2Kind/msx2Params). */
  template: EntityTemplate;
}

/** On-disk JSON file shape for export/import. */
export interface Msx2EntityLibraryFile {
  version: 1;
  entries: Msx2EntityLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'entity';

/**
 * Type guard for a single library entry. Accepts only MSX2-targeted templates
 * with a components array, so legacy MSX1 ECS templates never enter the store.
 */
function isValidEntry(value: unknown): value is Msx2EntityLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const template = entry.template as EntityTemplate | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && template
    && template.target === 'MSX2'
    && Array.isArray(template.components),
  );
}

/** Reads the library from localStorage. Returns [] on any error. */
export function loadMsx2EntityLibrary(): Msx2EntityLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 entity library:', error);
    return [];
  }
}

/** Persists the library to localStorage. Returns false if storage failed. */
export function saveMsx2EntityLibrary(entries: Msx2EntityLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 entity library:', error);
    return false;
  }
}

/**
 * Adds a template to the library (load → append → save) and returns the new
 * entry. The name is deduplicated against existing entries with a numeric
 * suffix so repeated exports do not collide.
 */
export function addEntryToMsx2EntityLibrary(
  template: EntityTemplate,
  name?: string,
): Msx2EntityLibraryEntry {
  const entries = loadMsx2EntityLibrary();
  const baseName = (name || template.name || 'Entity').trim() || 'Entity';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const entry: Msx2EntityLibraryEntry = {
    id: `${slugify(uniqueName)}_${Date.now()}`,
    name: uniqueName,
    kind: template.msx2Kind || 'custom',
    savedAt: Date.now(),
    template: { ...template, name: uniqueName },
  };
  saveMsx2EntityLibrary([...entries, entry]);
  return entry;
}

/** Removes one entry by id (load → filter → save) and returns the new list. */
export function removeMsx2EntityLibraryEntry(id: string): Msx2EntityLibraryEntry[] {
  const entries = loadMsx2EntityLibrary().filter(entry => entry.id !== id);
  saveMsx2EntityLibrary(entries);
  return entries;
}

/** Downloads the whole library as a versioned JSON file. */
export function exportMsx2EntityLibraryFile(): void {
  const file: Msx2EntityLibraryFile = { version: 1, entries: loadMsx2EntityLibrary() };
  downloadTextFile('mideas_msx2_entity_library.json', JSON.stringify(file, null, 2), 'application/json');
}

/** Downloads a single entry as a JSON file (one-entry library file). */
export function exportMsx2EntityLibraryEntryFile(entry: Msx2EntityLibraryEntry): void {
  const file: Msx2EntityLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2entity.json`, JSON.stringify(file, null, 2), 'application/json');
}

/**
 * Parses a JSON string into validated library entries. Accepts either the
 * `{ version, entries }` file shape or a bare array of entries. Throws on
 * malformed JSON or when no valid MSX2 entry is found.
 */
export function parseMsx2EntityLibraryFile(json: string): Msx2EntityLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2EntityLibraryFile).entries))
      ? (parsed as Msx2EntityLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 entity entries found in the file.');
  }
  return valid;
}

/**
 * Merges incoming entries into the stored library (dedup by id, re-id and
 * re-name collisions by content). Returns the merged list.
 */
export function mergeMsx2EntityLibraryEntries(
  incoming: Msx2EntityLibraryEntry[],
): Msx2EntityLibraryEntry[] {
  const entries = loadMsx2EntityLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2EntityLibraryEntry = {
      ...candidate,
      id,
      name,
      template: { ...candidate.template, name },
    };
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2EntityLibrary(entries);
  return entries;
}
