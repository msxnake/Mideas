import { BitmapTileScreen5, BitmapTileStampScreen5, Msx2Screen4Tile, Screen5PaletteSlot } from '../types';
import { downloadTextFile } from './downloadUtils';
import { ensureScreen5PaletteSlots } from './msx2PaletteUtils';

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

/**
 * Pure builder: constructs a stamp entry WITHOUT touching localStorage. Used both to
 * create per-project stamp assets and (via `addStampToMsx2BitmapStampLibrary`) the global
 * library. Pass `existingNames` to de-duplicate the display name against taken names.
 */
export function buildMsx2BitmapStampEntry(
  tiles: Msx2Screen4Tile[],
  palette: Screen5PaletteSlot[],
  columns: number,
  rows: number,
  name?: string,
  existingNames?: Set<string>,
): Msx2BitmapStampLibraryEntry {
  const safeColumns = Math.max(1, Math.trunc(Number(columns) || 1));
  const safeRows = Math.max(1, Math.trunc(Number(rows) || Math.ceil(tiles.length / safeColumns)));
  const baseName = (name || tiles[0]?.name?.replace(/_r\d+_c\d+$/i, '') || 'Bitmap Stamp').trim() || 'Bitmap Stamp';
  const takenNames = existingNames ?? new Set<string>();
  let uniqueName = baseName;
  let suffix = 2;
  while (takenNames.has(uniqueName)) uniqueName = `${baseName} ${suffix++}`;
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
  return {
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
}

export function addStampToMsx2BitmapStampLibrary(
  tiles: Msx2Screen4Tile[],
  palette: Screen5PaletteSlot[],
  columns: number,
  rows: number,
  name?: string,
): Msx2BitmapStampLibraryEntry {
  const entries = loadMsx2BitmapStampLibrary();
  const existingNames = new Set(entries.map(entry => entry.name));
  const entry = buildMsx2BitmapStampEntry(tiles, palette, columns, rows, name, existingNames);
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

/** Parses an exported stamp-library JSON (array or `{version, entries}`) and returns valid entries. */
export function parseMsx2BitmapStampLibraryFile(json: string): Msx2BitmapStampLibraryEntry[] {
  const parsed = JSON.parse(json);
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray((parsed as Msx2BitmapStampLibraryFile).entries))
      ? (parsed as Msx2BitmapStampLibraryFile).entries
      : [];
  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error('No valid MSX2 bitmap stamp entries found in the file.');
  }
  return valid;
}

/**
 * Merges incoming stamps into the global library (de-duping id/name) and persists.
 * Also used to "promote" a per-project stamp asset to the global library.
 */
export function mergeMsx2BitmapStampLibraryEntries(
  incoming: Msx2BitmapStampLibraryEntry[],
): Msx2BitmapStampLibraryEntry[] {
  const entries = loadMsx2BitmapStampLibrary();
  const existingIds = new Set(entries.map(entry => entry.id));
  const existingNames = new Set(entries.map(entry => entry.name));
  const merged = [...entries];
  for (const candidate of incoming) {
    let name = candidate.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${candidate.name} ${suffix++}`;
    let id = candidate.id;
    if (existingIds.has(id)) id = `${slugify(name)}_${Date.now()}_${suffix}`;
    const entry: Msx2BitmapStampLibraryEntry = { ...candidate, id, name };
    merged.push(entry);
    existingIds.add(id);
    existingNames.add(name);
  }
  saveMsx2BitmapStampLibrary(merged);
  return merged;
}

// --- Palette adaptation (Convert/Adapt) -----------------------------------
// Remap a stamp authored against one SCREEN 5 palette onto another (the current
// screen palette) WITHOUT touching either palette: each pixel's slot index is
// rewritten to the slot of the target palette whose colour is perceptually
// closest. Slot 0 (transparent) is always preserved.

const hexToRgb = (hex: string): [number, number, number] => {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '').trim());
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
};

// Weighted ("redmean") RGB distance — approximates perceived colour difference
// better than plain Euclidean, so the nearest slot also matches tonally.
const colorDistanceSq = (a: [number, number, number], b: [number, number, number]): number => {
  const rmean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db;
};

/**
 * Builds a 16-entry table mapping each slot index of `sourceSlots` to the index
 * of the closest colour in `targetSlots`. Slot 0 always maps to 0 (transparent).
 */
export function buildScreen5PaletteRemap(
  sourceSlots: Screen5PaletteSlot[] | undefined,
  targetSlots: Screen5PaletteSlot[] | undefined,
): number[] {
  const source = ensureScreen5PaletteSlots(sourceSlots).slots;
  const target = ensureScreen5PaletteSlots(targetSlots).slots;
  const remap = new Array<number>(16).fill(0);
  for (let s = 1; s < source.length; s++) {
    const sourceRgb = hexToRgb(source[s].hex);
    let bestIndex = s < target.length ? s : 0;
    let bestDistance = Infinity;
    for (let t = 1; t < target.length; t++) {
      const distance = colorDistanceSq(sourceRgb, hexToRgb(target[t].hex));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = t;
      }
    }
    remap[s] = bestIndex;
  }
  return remap;
}

/**
 * Returns a copy of `entry` whose tile pixels are remapped onto `targetSlots`
 * (nearest colour per slot) and whose palette is set to `targetSlots`. The
 * original entry, its palette and the target palette are left untouched.
 */
export function adaptStampEntryToPalette(
  entry: Msx2BitmapStampLibraryEntry,
  targetSlots: Screen5PaletteSlot[] | undefined,
): Msx2BitmapStampLibraryEntry {
  const palette = ensureScreen5PaletteSlots(targetSlots).slots;
  const remap = buildScreen5PaletteRemap(entry.palette, palette);
  const now = new Date().toISOString();
  const tiles = entry.stamp.tiles.map(tile => ({
    ...tile,
    pixelData: tile.pixelData.map(value => {
      const index = clampSlot(value);
      return remap[index] ?? index;
    }),
    updatedAt: now,
  }));
  return {
    ...entry,
    stamp: { ...entry.stamp, tiles, updatedAt: now },
    palette: palette.map(slot => ({ ...slot })),
  };
}

