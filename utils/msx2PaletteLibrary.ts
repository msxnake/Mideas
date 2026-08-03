/**
 * Global MSX2 palette library.
 *
 * The store is browser-local and intentionally contains palette payloads only.
 * Project palette assets are copied into the library and copied back into a
 * project on import, so library entries never retain project asset references.
 */

import { PaletteAsset } from '../types';
import { downloadTextFile } from './downloadUtils';
import { ensureScreen5PaletteSlots } from './msx2PaletteUtils';

const LS_KEY = 'msxIdeMsx2PaletteLibrary_v1';

export interface Msx2PaletteLibraryEntry {
  id: string;
  name: string;
  savedAt: number;
  palette: PaletteAsset;
}

export interface Msx2PaletteLibraryFile {
  version: 1;
  entries: Msx2PaletteLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'palette';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const isPalettePayload = (value: unknown): value is PaletteAsset => {
  if (!isRecord(value)) return false;
  return (
    (value.mode === 'SCREEN4' || value.mode === 'SCREEN5')
    && Array.isArray(value.slots)
  );
};

const clonePalette = (palette: PaletteAsset): PaletteAsset => {
  const { slots } = ensureScreen5PaletteSlots(palette.slots);
  return {
    mode: palette.mode === 'SCREEN5' ? 'SCREEN5' : 'SCREEN4',
    slots: slots.map(slot => ({ ...slot })),
    notes: palette.notes,
  };
};

function isValidEntry(value: unknown): value is Msx2PaletteLibraryEntry {
  if (!isRecord(value)) return false;
  return Boolean(
    typeof value.id === 'string'
    && typeof value.name === 'string'
    && isPalettePayload(value.palette),
  );
}

const normalizeEntry = (entry: Msx2PaletteLibraryEntry): Msx2PaletteLibraryEntry => ({
  ...entry,
  savedAt: Number.isFinite(entry.savedAt) ? entry.savedAt : Date.now(),
  palette: clonePalette(entry.palette),
});

const entryFromCandidate = (
  value: unknown,
  fallbackName: string,
  importedAt: number,
  index: number,
): Msx2PaletteLibraryEntry | null => {
  if (!isRecord(value)) return null;
  if (isValidEntry(value)) return normalizeEntry(value);

  const projectAssetPalette = value.type === 'palette' && isPalettePayload(value.data)
    ? value.data
    : null;
  const wrappedPalette = isPalettePayload(value.palette) ? value.palette : null;
  const rawPalette = isPalettePayload(value) ? value : null;
  const palette = projectAssetPalette || wrappedPalette || rawPalette;
  if (!palette) return null;

  const paletteRecord = palette as PaletteAsset & { id?: unknown; name?: unknown };
  const name = (
    typeof value.name === 'string' && value.name.trim()
      ? value.name.trim()
      : typeof paletteRecord.name === 'string' && paletteRecord.name.trim()
        ? paletteRecord.name.trim()
        : fallbackName
  );
  const sourceId = typeof value.id === 'string' && value.id.trim()
    ? value.id.trim()
    : typeof paletteRecord.id === 'string' && paletteRecord.id.trim()
      ? paletteRecord.id.trim()
      : '';

  return normalizeEntry({
    id: sourceId || `${slugify(name)}_${importedAt}_${index + 1}`,
    name,
    savedAt: typeof value.savedAt === 'number' ? value.savedAt : importedAt,
    palette,
  });
};

export function loadMsx2PaletteLibrary(): Msx2PaletteLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidEntry).map(normalizeEntry) : [];
  } catch (error) {
    console.error('Failed to load MSX2 palette library:', error);
    return [];
  }
}

export function saveMsx2PaletteLibrary(entries: Msx2PaletteLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries.map(normalizeEntry)));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 palette library:', error);
    return false;
  }
}

export function addEntryToMsx2PaletteLibrary(
  palette: PaletteAsset,
  name?: string,
): Msx2PaletteLibraryEntry {
  const entries = loadMsx2PaletteLibrary();
  const baseName = String(name || 'Palette').trim() || 'Palette';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const savedAt = Date.now();
  const entry: Msx2PaletteLibraryEntry = {
    id: `${slugify(uniqueName)}_${savedAt}`,
    name: uniqueName,
    savedAt,
    palette: clonePalette(palette),
  };
  saveMsx2PaletteLibrary([...entries, entry]);
  return entry;
}

export function removeMsx2PaletteLibraryEntry(id: string): Msx2PaletteLibraryEntry[] {
  const entries = loadMsx2PaletteLibrary().filter(entry => entry.id !== id);
  saveMsx2PaletteLibrary(entries);
  return entries;
}

export function exportMsx2PaletteLibraryFile(): void {
  const file: Msx2PaletteLibraryFile = { version: 1, entries: loadMsx2PaletteLibrary() };
  downloadTextFile('mideas_msx2_palette_library.json', JSON.stringify(file, null, 2), 'application/json');
}

export function exportMsx2PaletteLibraryEntryFile(entry: Msx2PaletteLibraryEntry): void {
  const file: Msx2PaletteLibraryFile = { version: 1, entries: [normalizeEntry(entry)] };
  downloadTextFile(`${slugify(entry.name)}.msx2palette.json`, JSON.stringify(file, null, 2), 'application/json');
}

export function parseMsx2PaletteLibraryFile(
  json: string,
  fallbackName = 'Imported Palette',
): Msx2PaletteLibraryEntry[] {
  const parsed = JSON.parse(json);
  const importedAt = Date.now();
  const parsedRecord = isRecord(parsed) ? parsed : null;
  const nestedProject = parsedRecord && isRecord(parsedRecord.project) ? parsedRecord.project : null;
  const rawCandidates = Array.isArray(parsed)
    ? parsed
    : parsedRecord && Array.isArray(parsedRecord.entries)
      ? parsedRecord.entries
      : parsedRecord && Array.isArray(parsedRecord.assets)
        ? parsedRecord.assets
        : nestedProject && Array.isArray(nestedProject.assets)
          ? nestedProject.assets
          : [parsed];

  const valid = rawCandidates
    .map((candidate, index) => entryFromCandidate(candidate, fallbackName, importedAt, index))
    .filter((entry): entry is Msx2PaletteLibraryEntry => Boolean(entry));

  if (!valid.length) {
    throw new Error('No MSX2 palettes found. Expected a palette asset, a Mideas project, or a palette-library JSON file.');
  }
  return valid;
}

export function mergeMsx2PaletteLibraryEntries(
  incoming: Msx2PaletteLibraryEntry[],
): Msx2PaletteLibraryEntry[] {
  const entries = loadMsx2PaletteLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  incoming.forEach(candidate => {
    const baseName = candidate.name.trim() || 'Palette';
    let name = baseName;
    let suffix = 2;
    while (existingNames.has(name)) name = `${baseName} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry = normalizeEntry({ ...candidate, id, name });
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  });
  saveMsx2PaletteLibrary(entries);
  return entries;
}
