/**
 * Global MSX2 HUD icon library.
 *
 * Browser-local (localStorage) store of reusable HUD icons (Msx2HudIconEntry,
 * authored in the Assets tab of Msx2HudEditor) that survives across projects —
 * the icon sibling of `msx2SpriteLibrary.ts` and `msx2TileLibrary.ts`. Pure IDE
 * authoring data: an icon only contributes to a ROM once it is referenced by a
 * HUD widget layer (`atlasEntryId`) inside a project's `Msx2HudAsset`.
 *
 * Each entry stores the icon together with the palette it was authored against,
 * because `Msx2HudIconEntry.pixels` are palette slot indices (not hex colors)
 * and the library preview needs that palette to resolve colors. Import copies
 * the icon's indices as-is (no reconciliation) — same simplicity as sprites.
 *
 * Persistence: localStorage (live store) + JSON file export/import for backup
 * and sharing between machines.
 */

import { Msx2HudIconEntry, Screen5PaletteSlot } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2HudIconLibrary_v1';

/** A single saved icon in the global library. */
export interface Msx2HudIconLibraryEntry {
  /** Stable entry id (slug + timestamp); distinct from the icon id. */
  id: string;
  /** Display name (defaults to the icon name). */
  name: string;
  /** Epoch ms when the entry was saved. */
  savedAt: number;
  /** The HUD icon payload (slot-indexed pixels). */
  icon: Msx2HudIconEntry;
  /** Palette the icon was authored against; needed to resolve slot indices. */
  palette: Screen5PaletteSlot[];
}

/** On-disk JSON file shape for export/import. */
export interface Msx2HudIconLibraryFile {
  version: 1;
  entries: Msx2HudIconLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'icon';

/**
 * Type guard for a single entry. Accepts only entries carrying an icon with a
 * `pixels` matrix and a palette array, so unrelated assets never enter the store.
 */
function isValidEntry(value: unknown): value is Msx2HudIconLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const icon = entry.icon as Msx2HudIconEntry | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && icon
    && typeof icon.width === 'number'
    && typeof icon.height === 'number'
    && Array.isArray(icon.pixels)
    && Array.isArray(entry.palette),
  );
}

/** Reads the library from localStorage. Returns [] on any error. */
export function loadMsx2HudIconLibrary(): Msx2HudIconLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 HUD icon library:', error);
    return [];
  }
}

/** Persists the library to localStorage. Returns false if storage failed. */
export function saveMsx2HudIconLibrary(entries: Msx2HudIconLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 HUD icon library:', error);
    return false;
  }
}

/**
 * Adds an icon to the library (load → append → save) and returns the new
 * entry. The name is deduplicated against existing entries with a numeric
 * suffix so repeated exports do not collide.
 */
export function addEntryToMsx2HudIconLibrary(
  icon: Msx2HudIconEntry,
  palette: Screen5PaletteSlot[],
  name?: string,
): Msx2HudIconLibraryEntry {
  const entries = loadMsx2HudIconLibrary();
  const baseName = (name || icon.name || 'Icon').trim() || 'Icon';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const entry: Msx2HudIconLibraryEntry = {
    id: `${slugify(uniqueName)}_${Date.now()}`,
    name: uniqueName,
    savedAt: Date.now(),
    icon: { ...icon, name: uniqueName, pixels: icon.pixels.map(row => [...row]) },
    palette: palette.map(slot => ({ ...slot })),
  };
  saveMsx2HudIconLibrary([...entries, entry]);
  return entry;
}

/** Removes one entry by id (load → filter → save) and returns the new list. */
export function removeMsx2HudIconLibraryEntry(id: string): Msx2HudIconLibraryEntry[] {
  const entries = loadMsx2HudIconLibrary().filter(entry => entry.id !== id);
  saveMsx2HudIconLibrary(entries);
  return entries;
}

/** Downloads the whole library as a versioned JSON file. */
export function exportMsx2HudIconLibraryFile(): void {
  const file: Msx2HudIconLibraryFile = { version: 1, entries: loadMsx2HudIconLibrary() };
  downloadTextFile('mideas_msx2_hud_icon_library.json', JSON.stringify(file, null, 2), 'application/json');
}

/** Downloads a single entry as a JSON file (one-entry library file). */
export function exportMsx2HudIconLibraryEntryFile(entry: Msx2HudIconLibraryEntry): void {
  const file: Msx2HudIconLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2hudicon.json`, JSON.stringify(file, null, 2), 'application/json');
}

/**
 * Parses a JSON string into validated library entries. Accepts either the
 * `{ version, entries }` file shape or a bare array of entries. Throws on
 * malformed JSON or when no valid HUD icon entry is found.
 */
export function parseMsx2HudIconLibraryFile(json: string): Msx2HudIconLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2HudIconLibraryFile).entries))
      ? (parsed as Msx2HudIconLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 HUD icon entries found in the file.');
  }
  return valid;
}

/**
 * Merges incoming entries into the stored library (dedup by id, re-id and
 * re-name collisions). Returns the merged list.
 */
export function mergeMsx2HudIconLibraryEntries(
  incoming: Msx2HudIconLibraryEntry[],
): Msx2HudIconLibraryEntry[] {
  const entries = loadMsx2HudIconLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2HudIconLibraryEntry = {
      ...candidate,
      id,
      name,
      icon: { ...candidate.icon, name },
    };
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2HudIconLibrary(entries);
  return entries;
}
