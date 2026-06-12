/**
 * Global MSX2 enemy library.
 *
 * Browser-local (localStorage) store of reusable enemy definitions that
 * survives across projects — the sibling of `msx2EntityLibrary.ts` and
 * `msx2SpriteLibrary.ts`, for `EnemyDefinition` payloads authored in the
 * Enemy Library editor.
 *
 * Pure IDE authoring data: an enemy only contributes to a ROM when actually
 * referenced by a placed entity / screen spawn in the current project.
 *
 * Persistence: localStorage (live store) + JSON file export/import for backup
 * and sharing between machines.
 */

import { EnemyDefinition } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2EnemyLibrary_v1';

/** A single saved enemy in the global library. */
export interface Msx2EnemyLibraryEntry {
  /** Stable entry id (timestamp + slug); distinct from the enemy id. */
  id: string;
  /** Display name (defaults to the enemy name). */
  name: string;
  /** Epoch ms when the entry was saved. */
  savedAt: number;
  /** The enemy definition payload. */
  enemy: EnemyDefinition;
}

/** On-disk JSON file shape for export/import. */
export interface Msx2EnemyLibraryFile {
  version: 1;
  entries: Msx2EnemyLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'enemy';

/**
 * Type guard for a single entry. Accepts only entries whose enemy has an
 * `enemyId` and a `behavior`, so unrelated JSON never enters the store.
 */
function isValidEntry(value: unknown): value is Msx2EnemyLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const enemy = entry.enemy as EnemyDefinition | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && enemy
    && typeof enemy.enemyId === 'string'
    && enemy.behavior
    && typeof enemy.behavior === 'object',
  );
}

/** Reads the library from localStorage. Returns [] on any error. */
export function loadMsx2EnemyLibrary(): Msx2EnemyLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 enemy library:', error);
    return [];
  }
}

/** Persists the library to localStorage. Returns false if storage failed. */
export function saveMsx2EnemyLibrary(entries: Msx2EnemyLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 enemy library:', error);
    return false;
  }
}

/**
 * Adds an enemy to the library (load → append → save) and returns the new
 * entry. The name is deduplicated against existing entries with a numeric
 * suffix so repeated exports do not collide.
 */
export function addEntryToMsx2EnemyLibrary(
  enemy: EnemyDefinition,
  name?: string,
): Msx2EnemyLibraryEntry {
  const entries = loadMsx2EnemyLibrary();
  const baseName = (name || enemy.name || 'Enemy').trim() || 'Enemy';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const entry: Msx2EnemyLibraryEntry = {
    id: `${slugify(uniqueName)}_${Date.now()}`,
    name: uniqueName,
    savedAt: Date.now(),
    enemy: { ...enemy, name: uniqueName },
  };
  saveMsx2EnemyLibrary([...entries, entry]);
  return entry;
}

/** Removes one entry by id (load → filter → save) and returns the new list. */
export function removeMsx2EnemyLibraryEntry(id: string): Msx2EnemyLibraryEntry[] {
  const entries = loadMsx2EnemyLibrary().filter(entry => entry.id !== id);
  saveMsx2EnemyLibrary(entries);
  return entries;
}

/** Downloads the whole library as a versioned JSON file. */
export function exportMsx2EnemyLibraryFile(): void {
  const file: Msx2EnemyLibraryFile = { version: 1, entries: loadMsx2EnemyLibrary() };
  downloadTextFile('mideas_msx2_enemy_library.json', JSON.stringify(file, null, 2), 'application/json');
}

/** Downloads a single entry as a JSON file (one-entry library file). */
export function exportMsx2EnemyLibraryEntryFile(entry: Msx2EnemyLibraryEntry): void {
  const file: Msx2EnemyLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2enemy.json`, JSON.stringify(file, null, 2), 'application/json');
}

/**
 * Parses a JSON string into validated library entries. Accepts the
 * `{ version, entries }` file shape, a bare array of entries, or a bare
 * array/object of `EnemyDefinition` (so plain enemy `.json` exports can be
 * imported too). Throws on malformed JSON or when nothing valid is found.
 */
export function parseMsx2EnemyLibraryFile(json: string): Msx2EnemyLibraryEntry[] {
  const parsed = JSON.parse(json);
  const asArray = Array.isArray(parsed) ? parsed : [parsed];
  // Prefer the library file shape; otherwise treat items as raw EnemyDefinitions.
  const fileEntries = (parsed && !Array.isArray(parsed) && Array.isArray((parsed as Msx2EnemyLibraryFile).entries))
    ? (parsed as Msx2EnemyLibraryFile).entries
    : null;
  let candidates: Msx2EnemyLibraryEntry[];
  if (fileEntries) {
    candidates = fileEntries;
  } else {
    candidates = asArray
      .filter((raw): raw is EnemyDefinition => Boolean(raw && typeof raw === 'object' && typeof (raw as EnemyDefinition).enemyId === 'string' && (raw as EnemyDefinition).behavior))
      .map(enemy => ({
        id: `${slugify(enemy.name || enemy.enemyId)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: enemy.name || enemy.enemyId,
        savedAt: Date.now(),
        enemy,
      }));
  }
  const valid = candidates.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid enemy entries found in the file.');
  }
  return valid;
}

/**
 * Merges incoming entries into the stored library (dedup by id, re-id and
 * re-name collisions). Returns the merged list.
 */
export function mergeMsx2EnemyLibraryEntries(
  incoming: Msx2EnemyLibraryEntry[],
): Msx2EnemyLibraryEntry[] {
  const entries = loadMsx2EnemyLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2EnemyLibraryEntry = {
      ...candidate,
      id,
      name,
      enemy: { ...candidate.enemy, name },
    };
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2EnemyLibrary(entries);
  return entries;
}
