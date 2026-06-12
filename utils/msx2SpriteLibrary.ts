/**
 * Global MSX2 sprite library.
 *
 * Browser-local (localStorage) store of reusable MSX2 sprites that survives
 * across projects — the visual sibling of `msx2EntityLibrary.ts`. Pure IDE
 * authoring data: sprites only contribute to a ROM when actually referenced
 * by a placed entity / hardware sprite in the current project.
 *
 * Persistence: localStorage (live store) + JSON file export/import for backup
 * and sharing between machines.
 */

import { Msx2Sprite } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2SpriteLibrary_v1';

/** A single saved sprite in the global library. */
export interface Msx2SpriteLibraryEntry {
  /** Stable entry id (timestamp + slug); distinct from the sprite id. */
  id: string;
  /** Display name (defaults to the sprite name). */
  name: string;
  /** Epoch ms when the entry was saved. */
  savedAt: number;
  /** The MSX2 sprite payload (frames, palette, hardware settings...). */
  sprite: Msx2Sprite;
}

/** On-disk JSON file shape for export/import. */
export interface Msx2SpriteLibraryFile {
  version: 1;
  entries: Msx2SpriteLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sprite';

/**
 * Type guard for a single entry. Accepts only MSX2-targeted sprites with a
 * frames array, so non-MSX2 assets never enter the store.
 */
function isValidEntry(value: unknown): value is Msx2SpriteLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const sprite = entry.sprite as Msx2Sprite | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && sprite
    && sprite.target === 'MSX2'
    && Array.isArray(sprite.frames),
  );
}

/** Reads the library from localStorage. Returns [] on any error. */
export function loadMsx2SpriteLibrary(): Msx2SpriteLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 sprite library:', error);
    return [];
  }
}

/** Persists the library to localStorage. Returns false if storage failed. */
export function saveMsx2SpriteLibrary(entries: Msx2SpriteLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 sprite library:', error);
    return false;
  }
}

/**
 * Adds a sprite to the library (load → append → save) and returns the new
 * entry. The name is deduplicated against existing entries with a numeric
 * suffix so repeated exports do not collide.
 */
export function addEntryToMsx2SpriteLibrary(
  sprite: Msx2Sprite,
  name?: string,
): Msx2SpriteLibraryEntry {
  const entries = loadMsx2SpriteLibrary();
  const baseName = (name || sprite.name || 'Sprite').trim() || 'Sprite';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const entry: Msx2SpriteLibraryEntry = {
    id: `${slugify(uniqueName)}_${Date.now()}`,
    name: uniqueName,
    savedAt: Date.now(),
    sprite: { ...sprite, name: uniqueName },
  };
  saveMsx2SpriteLibrary([...entries, entry]);
  return entry;
}

/** Removes one entry by id (load → filter → save) and returns the new list. */
export function removeMsx2SpriteLibraryEntry(id: string): Msx2SpriteLibraryEntry[] {
  const entries = loadMsx2SpriteLibrary().filter(entry => entry.id !== id);
  saveMsx2SpriteLibrary(entries);
  return entries;
}

/** Downloads the whole library as a versioned JSON file. */
export function exportMsx2SpriteLibraryFile(): void {
  const file: Msx2SpriteLibraryFile = { version: 1, entries: loadMsx2SpriteLibrary() };
  downloadTextFile('mideas_msx2_sprite_library.json', JSON.stringify(file, null, 2), 'application/json');
}

/** Downloads a single entry as a JSON file (one-entry library file). */
export function exportMsx2SpriteLibraryEntryFile(entry: Msx2SpriteLibraryEntry): void {
  const file: Msx2SpriteLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2sprite.json`, JSON.stringify(file, null, 2), 'application/json');
}

/**
 * Parses a JSON string into validated library entries. Accepts either the
 * `{ version, entries }` file shape or a bare array of entries. Throws on
 * malformed JSON or when no valid MSX2 sprite entry is found.
 */
export function parseMsx2SpriteLibraryFile(json: string): Msx2SpriteLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2SpriteLibraryFile).entries))
      ? (parsed as Msx2SpriteLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 sprite entries found in the file.');
  }
  return valid;
}

/**
 * Merges incoming entries into the stored library (dedup by id, re-id and
 * re-name collisions). Returns the merged list.
 */
export function mergeMsx2SpriteLibraryEntries(
  incoming: Msx2SpriteLibraryEntry[],
): Msx2SpriteLibraryEntry[] {
  const entries = loadMsx2SpriteLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2SpriteLibraryEntry = {
      ...candidate,
      id,
      name,
      sprite: { ...candidate.sprite, name },
    };
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2SpriteLibrary(entries);
  return entries;
}
