import { BitmapTileScreen5, Screen5PaletteSlot } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2BitmapTileLibrary_v1';

export interface Msx2BitmapTileLibraryEntry {
  id: string;
  name: string;
  savedAt: number;
  tile: BitmapTileScreen5;
  palette: Screen5PaletteSlot[];
}

export interface Msx2BitmapTileLibraryFile {
  version: 1;
  entries: Msx2BitmapTileLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'bitmap_tile';

function isValidEntry(value: unknown): value is Msx2BitmapTileLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const tile = entry.tile as BitmapTileScreen5 | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && tile
    && tile.mode === 'SCREEN5_BITMAP'
    && Array.isArray(tile.pixelData)
    && Array.isArray(entry.palette),
  );
}

export function loadMsx2BitmapTileLibrary(): Msx2BitmapTileLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 bitmap tile library:', error);
    return [];
  }
}

export function saveMsx2BitmapTileLibrary(entries: Msx2BitmapTileLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 bitmap tile library:', error);
    return false;
  }
}

export function addEntryToMsx2BitmapTileLibrary(
  tile: BitmapTileScreen5,
  palette: Screen5PaletteSlot[],
  name?: string,
): Msx2BitmapTileLibraryEntry {
  const entries = loadMsx2BitmapTileLibrary();
  const baseName = (name || tile.name || 'Bitmap Tile').trim() || 'Bitmap Tile';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const now = Date.now();
  const entryId = `${slugify(uniqueName)}_${now}`;
  const entry: Msx2BitmapTileLibraryEntry = {
    id: entryId,
    name: uniqueName,
    savedAt: now,
    tile: {
      ...tile,
      id: entryId,
      name: uniqueName,
      paletteId: `${entryId}_palette`,
      updatedAt: new Date(now).toISOString(),
    },
    palette: palette.map(slot => ({ ...slot })),
  };
  saveMsx2BitmapTileLibrary([...entries, entry]);
  return entry;
}

export function removeMsx2BitmapTileLibraryEntry(id: string): Msx2BitmapTileLibraryEntry[] {
  const entries = loadMsx2BitmapTileLibrary().filter(entry => entry.id !== id);
  saveMsx2BitmapTileLibrary(entries);
  return entries;
}

export function exportMsx2BitmapTileLibraryFile(): void {
  const file: Msx2BitmapTileLibraryFile = { version: 1, entries: loadMsx2BitmapTileLibrary() };
  downloadTextFile('mideas_msx2_bitmap_tile_library.json', JSON.stringify(file, null, 2), 'application/json');
}

export function exportMsx2BitmapTileLibraryEntryFile(entry: Msx2BitmapTileLibraryEntry): void {
  const file: Msx2BitmapTileLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2bitmaptile.json`, JSON.stringify(file, null, 2), 'application/json');
}

export function parseMsx2BitmapTileLibraryFile(json: string): Msx2BitmapTileLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2BitmapTileLibraryFile).entries))
      ? (parsed as Msx2BitmapTileLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 bitmap tile entries found in the file.');
  }
  return valid;
}

export function mergeMsx2BitmapTileLibraryEntries(
  incoming: Msx2BitmapTileLibraryEntry[],
): Msx2BitmapTileLibraryEntry[] {
  const entries = loadMsx2BitmapTileLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2BitmapTileLibraryEntry = {
      ...candidate,
      id,
      name,
      tile: { ...candidate.tile, id, name },
    };
    entries.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2BitmapTileLibrary(entries);
  return entries;
}
