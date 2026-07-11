/**
 * Global MSX2 tile library.
 *
 * Browser-local (localStorage) store of reusable MSX2 SCREEN4 tiles that
 * survives across projects — the tile sibling of `msx2SpriteLibrary.ts` and
 * `msx2EntityLibrary.ts`. Pure IDE authoring data: a tile only contributes to
 * a ROM once it is imported into a screen and actually placed on the map.
 *
 * Each entry stores the tile together with the palette it was authored against,
 * because `Msx2Screen4Tile.pixels` are palette slot indices (not hex colors) and
 * both the preview and the project import need that palette to resolve colors.
 *
 * Persistence: localStorage (live store) + JSON file export/import for backup
 * and sharing between machines.
 */

import { Msx2Screen4Tile, Screen5PaletteSlot } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2TileLibrary_v1';

/** A single saved tile in the global library. */
export interface Msx2TileLibraryEntry {
  /** Stable entry id (slug + timestamp); distinct from the tile id. */
  id: string;
  /** Display name (defaults to the tile name). */
  name: string;
  /** Epoch ms when the entry was saved. */
  savedAt: number;
  /** The MSX2 SCREEN4 tile payload (slot-indexed pixels, behavior, hitbox...). */
  tile: Msx2Screen4Tile;
  /** Palette the tile was authored against; needed to resolve slot indices. */
  palette: Screen5PaletteSlot[];
}

/** On-disk JSON file shape for export/import. */
export interface Msx2TileLibraryFile {
  version: 1;
  entries: Msx2TileLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tile';

/**
 * Type guard for a single entry. Accepts only entries carrying a tile with a
 * `pixels` matrix and a palette array, so non-tile assets never enter the store.
 */
function isValidEntry(value: unknown): value is Msx2TileLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const tile = entry.tile as Msx2Screen4Tile | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && tile
    && Array.isArray(tile.pixels)
    && Array.isArray(entry.palette),
  );
}

/** Reads the library from localStorage. Returns [] on any error. */
export function loadMsx2TileLibrary(): Msx2TileLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 tile library:', error);
    return [];
  }
}

/** Persists the library to localStorage. Returns false if storage failed. */
export function saveMsx2TileLibrary(entries: Msx2TileLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 tile library:', error);
    return false;
  }
}

/**
 * Adds a tile to the library (load → append → save) and returns the new entry.
 * The name is deduplicated against existing entries with a numeric suffix so
 * repeated imports do not collide.
 */
export function addEntryToMsx2TileLibrary(
  tile: Msx2Screen4Tile,
  palette: Screen5PaletteSlot[],
  name?: string,
): Msx2TileLibraryEntry {
  const entries = loadMsx2TileLibrary();
  const baseName = (name || tile.name || 'Tile').trim() || 'Tile';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const entry: Msx2TileLibraryEntry = {
    id: `${slugify(uniqueName)}_${Date.now()}`,
    name: uniqueName,
    savedAt: Date.now(),
    tile: { ...tile, name: uniqueName },
    palette: palette.map(slot => ({ ...slot })),
  };
  saveMsx2TileLibrary([...entries, entry]);
  return entry;
}

/** Removes one entry by id (load → filter → save) and returns the new list. */
export function removeMsx2TileLibraryEntry(id: string): Msx2TileLibraryEntry[] {
  const entries = loadMsx2TileLibrary().filter(entry => entry.id !== id);
  saveMsx2TileLibrary(entries);
  return entries;
}

/** Downloads the whole library as a versioned JSON file. */
export function exportMsx2TileLibraryFile(): void {
  const file: Msx2TileLibraryFile = { version: 1, entries: loadMsx2TileLibrary() };
  downloadTextFile('mideas_msx2_tile_library.json', JSON.stringify(file, null, 2), 'application/json');
}

/** Downloads a single entry as a JSON file (one-entry library file). */
export function exportMsx2TileLibraryEntryFile(entry: Msx2TileLibraryEntry): void {
  const file: Msx2TileLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2tile.json`, JSON.stringify(file, null, 2), 'application/json');
}

/**
 * Parses a JSON string into validated library entries. Accepts either the
 * `{ version, entries }` file shape or a bare array of entries. Throws on
 * malformed JSON or when no valid MSX2 tile entry is found.
 */
export function parseMsx2TileLibraryFile(json: string): Msx2TileLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2TileLibraryFile).entries))
      ? (parsed as Msx2TileLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 tile entries found in the file.');
  }
  return valid;
}

/**
 * Merges incoming entries into the stored library (dedup by id, re-id and
 * re-name collisions). Returns the merged list.
 */
export function mergeMsx2TileLibraryEntries(
  incoming: Msx2TileLibraryEntry[],
): Msx2TileLibraryEntry[] {
  const entries = loadMsx2TileLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2TileLibraryEntry = {
      ...candidate,
      id,
      name,
      tile: { ...candidate.tile, name },
    };
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2TileLibrary(entries);
  return entries;
}
