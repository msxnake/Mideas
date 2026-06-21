import { BitmapTileScreen5, BitmapTileStampScreen5, Msx2Screen4Tile, Screen5PaletteSlot } from '../types';
import { downloadTextFile } from './downloadUtils';

const LS_KEY = 'msxIdeMsx2BitmapStampLibrary_v1';

export interface Msx2BitmapStampLibraryEntry {
  id: string;
  name: string;
  savedAt: number;
  stamp: BitmapTileStampScreen5;
  palette: Screen5PaletteSlot[];
}

export interface Msx2BitmapStampLibraryFile {
  version: 1;
  entries: Msx2BitmapStampLibraryEntry[];
}

const slugify = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'bitmap_stamp';

const clampSlot = (value: number): number =>
  Math.max(0, Math.min(15, Math.trunc(Number(value) || 0)));

function isValidEntry(value: unknown): value is Msx2BitmapStampLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const stamp = entry.stamp as BitmapTileStampScreen5 | undefined;
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && stamp
    && stamp.mode === 'SCREEN5_BITMAP_STAMP'
    && Number.isFinite(stamp.columns)
    && Number.isFinite(stamp.rows)
    && Array.isArray(stamp.tiles)
    && stamp.tiles.every(tile => tile?.mode === 'SCREEN5_BITMAP' && Array.isArray(tile.pixelData))
    && Array.isArray(entry.palette),
  );
}

export function loadMsx2BitmapStampLibrary(): Msx2BitmapStampLibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error('Failed to load MSX2 bitmap stamp library:', error);
    return [];
  }
}

export function saveMsx2BitmapStampLibrary(entries: Msx2BitmapStampLibraryEntry[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save MSX2 bitmap stamp library:', error);
    return false;
  }
}

export function makeBitmapTileFromScreen5Tile(
  tile: Msx2Screen4Tile,
  paletteId: string,
): BitmapTileScreen5 {
  const width = Math.max(1, tile.width || tile.pixels?.[0]?.length || 16);
  const height = Math.max(1, tile.height || tile.pixels?.length || 16);
  const now = new Date().toISOString();
  const pixelData: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixelData.push(clampSlot(tile.pixels?.[y]?.[x] ?? 0));
    }
  }
  return {
    id: `bitmap_tile_import_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: tile.name || 'Bitmap Tile',
    mode: 'SCREEN5_BITMAP',
    width,
    height,
    sourceType: 'png-import',
    paletteId,
    pixelData,
    createdAt: now,
    updatedAt: now,
  };
}

export function addStampToMsx2BitmapStampLibrary(
  tiles: Msx2Screen4Tile[],
  palette: Screen5PaletteSlot[],
  columns: number,
  rows: number,
  name?: string,
): Msx2BitmapStampLibraryEntry {
  const entries = loadMsx2BitmapStampLibrary();
  const safeColumns = Math.max(1, Math.trunc(Number(columns) || 1));
  const safeRows = Math.max(1, Math.trunc(Number(rows) || Math.ceil(tiles.length / safeColumns)));
  const baseName = (name || tiles[0]?.name?.replace(/_r\d+_c\d+$/i, '') || 'Bitmap Stamp').trim() || 'Bitmap Stamp';
  const existingNames = new Set(entries.map(entry => entry.name));
  let uniqueName = baseName;
  let suffix = 2;
  while (existingNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
  const now = Date.now();
  const stampId = `${slugify(uniqueName)}_${now}`;
  const paletteId = `${stampId}_palette`;
  const stampTiles = tiles.map((tile, index) => {
    const bitmapTile = makeBitmapTileFromScreen5Tile(tile, paletteId);
    return {
      ...bitmapTile,
      id: `${stampId}_tile_${index}`,
      name: tile.name || `${uniqueName}_${index + 1}`,
    };
  });
  const entry: Msx2BitmapStampLibraryEntry = {
    id: stampId,
    name: uniqueName,
    savedAt: now,
    stamp: {
      id: stampId,
      name: uniqueName,
      mode: 'SCREEN5_BITMAP_STAMP',
      columns: safeColumns,
      rows: safeRows,
      tileWidth: 16,
      tileHeight: 16,
      sourceType: 'png-import',
      paletteId,
      tiles: stampTiles,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    },
    palette: palette.map(slot => ({ ...slot })),
  };
  saveMsx2BitmapStampLibrary([...entries, entry]);
  return entry;
}

export function removeMsx2BitmapStampLibraryEntry(id: string): Msx2BitmapStampLibraryEntry[] {
  const entries = loadMsx2BitmapStampLibrary().filter(entry => entry.id !== id);
  saveMsx2BitmapStampLibrary(entries);
  return entries;
}

export function exportMsx2BitmapStampLibraryFile(): void {
  const file: Msx2BitmapStampLibraryFile = { version: 1, entries: loadMsx2BitmapStampLibrary() };
  downloadTextFile('mideas_msx2_bitmap_stamp_library.json', JSON.stringify(file, null, 2), 'application/json');
}

export function exportMsx2BitmapStampLibraryEntryFile(entry: Msx2BitmapStampLibraryEntry): void {
  const file: Msx2BitmapStampLibraryFile = { version: 1, entries: [entry] };
  downloadTextFile(`${slugify(entry.name)}.msx2bitmapstamp.json`, JSON.stringify(file, null, 2), 'application/json');
}

