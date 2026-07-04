import { Msx2BitmapTerrainAsset } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2BitmapTerrainLibrary_v1';

export type Msx2BitmapTerrainLibraryEntry = Msx2BitmapTerrainAsset;

export interface Msx2BitmapTerrainLibraryFile {
  version: 1;
  entries: Msx2BitmapTerrainLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'bitmap_terrain';

const cloneEntry = (entry: Msx2BitmapTerrainLibraryEntry): Msx2BitmapTerrainLibraryEntry =>
  JSON.parse(JSON.stringify(entry)) as Msx2BitmapTerrainLibraryEntry;

function isValidEntry(value: unknown): value is Msx2BitmapTerrainLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const terrain = entry.terrain as Record<string, unknown> | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && Number.isFinite(entry.savedAt)
    && terrain
    && (terrain.template === 'blob16' || terrain.template === 'wang47')
    && terrain.mapping
    && typeof terrain.mapping === 'object'
    && Array.isArray(entry.tiles)
    && entry.tiles.every(tile => {
      const candidate = tile as Record<string, unknown>;
      return typeof candidate.id === 'string'
        && typeof candidate.name === 'string'
        && Number.isFinite(candidate.width)
        && Number.isFinite(candidate.height)
        && Array.isArray(candidate.pixels);
    })
    && Array.isArray(entry.palette),
  );
}

export function loadMsx2BitmapTerrainLibrary(): Msx2BitmapTerrainLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 bitmap terrain library:', error);
    return [];
  }
}

export function saveMsx2BitmapTerrainLibrary(entries: Msx2BitmapTerrainLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 bitmap terrain library:', error);
    return false;
  }
}

export function addTerrainToMsx2BitmapTerrainLibrary(
  asset: Msx2BitmapTerrainAsset,
): Msx2BitmapTerrainLibraryEntry {
  const entries = loadMsx2BitmapTerrainLibrary();
  const existingNames = new Set(entries.map(entry => entry.name));
  const baseName = (asset.name || asset.terrain?.name || 'Bitmap Terrain').trim() || 'Bitmap Terrain';
  let name = baseName;
  let suffix = 2;
  while (existingNames.has(name)) name = `${baseName} ${suffix++}`;
  const now = Date.now();
  const entry: Msx2BitmapTerrainLibraryEntry = {
    ...cloneEntry(asset),
    id: `${slugify(name)}_${now}`,
    name,
    savedAt: now,
  };
  saveMsx2BitmapTerrainLibrary([...entries, entry]);
  return entry;
}

export function removeMsx2BitmapTerrainLibraryEntry(id: string): Msx2BitmapTerrainLibraryEntry[] {
  const entries = loadMsx2BitmapTerrainLibrary().filter(entry => entry.id !== id);
  saveMsx2BitmapTerrainLibrary(entries);
  return entries;
}

export function exportMsx2BitmapTerrainLibraryFile(): void {
  const file: Msx2BitmapTerrainLibraryFile = { version: 1, entries: loadMsx2BitmapTerrainLibrary() };
  downloadTextFile('mideas_msx2_bitmap_terrain_library.json', JSON.stringify(file, null, 2), 'application/json');
}

export function exportMsx2BitmapTerrainLibraryEntryFile(entry: Msx2BitmapTerrainLibraryEntry): void {
  const file: Msx2BitmapTerrainLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2bitmapterrain.json`, JSON.stringify(file, null, 2), 'application/json');
}

export function parseMsx2BitmapTerrainLibraryFile(json: string): Msx2BitmapTerrainLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2BitmapTerrainLibraryFile).entries))
      ? (parsed as Msx2BitmapTerrainLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 bitmap terrain entries found in the file.');
  }
  return valid.map(cloneEntry);
}

export function mergeMsx2BitmapTerrainLibraryEntries(
  incoming: Msx2BitmapTerrainLibraryEntry[],
): Msx2BitmapTerrainLibraryEntry[] {
  const entries = loadMsx2BitmapTerrainLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  const merged = [...entries];
  for (const candidate of incoming) {
    const baseName = (candidate.name || candidate.terrain?.name || 'Bitmap Terrain').trim() || 'Bitmap Terrain';
    let name = baseName;
    let suffix = 2;
    while (existingNames.has(name)) name = `${baseName} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2BitmapTerrainLibraryEntry = {
      ...cloneEntry(candidate),
      id,
      name,
      savedAt: Number.isFinite(candidate.savedAt) ? candidate.savedAt : Date.now(),
    };
    merged.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2BitmapTerrainLibrary(merged);
  return merged;
}
