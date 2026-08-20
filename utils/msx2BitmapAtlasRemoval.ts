/**
 * Removing atlas tiles from a SCREEN 5 bitmap room.
 *
 * A room's tile-map (`tileGrid`) stores each cell as "index into `atlas.entries` + 1", so an
 * entry can never be dropped on its own: every cell painted with it must be cleared and every
 * cell above it in the list re-indexed, in lock-step with the derived `copy` commands. This
 * module owns that surgery so the atlas panel (delete a tile by hand) and the asset panel
 * (delete a bitmap stamp, which takes its imported copies with it) cannot drift apart.
 *
 * It also cuts the references that would otherwise dangle: autotile mappings, grass-sway
 * partners, bitmap animation frames, foreground overlay tiles and the `*AtlasEntryId` params
 * of placed entities.
 */

import {
  Msx2BitmapRoomAtlasEntry,
  Msx2BitmapRoomCommand,
  Msx2Screen4EntityInstance,
  Msx2Screen5BitmapRoom,
} from '../types';
import { pruneTerrainsForEntries } from './msx2Autotile';

const SCREEN_W = 256;
const SCREEN_H = 192;
const GRID = 16;

/** Tile-map dimensions of a room: always 16 columns, 12 rows at 192px and 13 at 212px. */
export const bitmapRoomGridSize = (room: Msx2Screen5BitmapRoom): { cols: number; rows: number } => ({
  cols: Math.floor(SCREEN_W / GRID),
  rows: Math.floor((Number(room?.height) || SCREEN_H) / GRID),
});

/**
 * Builds the 16 x rows tile-map grid (atlas-entry index + 1 per cell; 0 = empty) for the visible
 * page. Prefers the persisted `room.tileGrid`; otherwise reconstructs it from the `copy` commands
 * (later commands overwrite the same cell, matching the render's "last wins").
 */
export const buildTileGrid = (room: Msx2Screen5BitmapRoom, cols: number, rows: number): number[][] => {
  const entries = room.atlas?.entries || [];
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  if (Array.isArray(room.tileGrid)) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = room.tileGrid[y]?.[x] ?? 0;
        grid[y][x] = v > 0 && v - 1 < entries.length ? v : 0;
      }
    }
    return grid;
  }
  const idToIndex = new Map(entries.map((entry, index) => [entry.id, index]));
  for (const command of room.composition?.commands || []) {
    if (command.op !== 'copy') continue;
    const index = idToIndex.get(command.atlasEntryId);
    if (index === undefined) continue;
    const cx = Math.floor(command.dx / GRID);
    const cy = Math.floor(command.dy / GRID);
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) grid[cy][cx] = index + 1;
  }
  return grid;
};

/** One `copy` command per occupied cell, in reading order (the room's render program). */
export const buildCopyCommandsFromGrid = (
  grid: number[][],
  entries: Msx2BitmapRoomAtlasEntry[],
): Msx2BitmapRoomCommand[] => {
  const commands: Msx2BitmapRoomCommand[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const value = grid[y][x];
      if (!value) continue;
      const entry = entries[value - 1];
      if (!entry) continue;
      commands.push({
        id: `tile_${x}_${y}`,
        op: 'copy',
        atlasEntryId: entry.id,
        dx: x * GRID,
        dy: y * GRID,
        w: entry.w || GRID,
        h: entry.h || GRID,
      });
    }
  }
  return commands;
};

/** Copy of a layer grid, grown (zero-filled) so at least cols x rows exists. Never mutates input. */
const cloneLayer = (grid: number[][] | undefined, cols: number, rows: number): number[][] => {
  const height = Math.max(rows, grid?.length || 0);
  const width = Math.max(cols, ...(grid || []).map(row => row.length), 0);
  const next: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) row.push(grid?.[y]?.[x] ?? 0);
    next.push(row);
  }
  return next;
};

/** True for entity param keys that hold an atlas entry id (`atlasEntryId`, `healAtlasEntryId`, ...). */
const isAtlasEntryParamKey = (key: string): boolean => key === 'atlasEntryId' || key.endsWith('AtlasEntryId');

/** Blanks the `*AtlasEntryId` params pointing at a removed entry; returns the same array if untouched. */
const clearEntityAtlasRefs = (
  entities: Msx2Screen4EntityInstance[] | undefined,
  removedIds: Set<string>,
): Msx2Screen4EntityInstance[] | undefined => {
  if (!entities?.length) return entities;
  let dirty = false;
  const next = entities.map(entity => {
    const params = entity?.params as Record<string, any> | undefined;
    if (!params) return entity;
    const staleKeys = Object.keys(params)
      .filter(key => isAtlasEntryParamKey(key) && typeof params[key] === 'string' && removedIds.has(params[key]));
    if (staleKeys.length === 0) return entity;
    dirty = true;
    const nextParams = { ...params };
    staleKeys.forEach(key => { nextParams[key] = ''; });
    return { ...entity, params: nextParams };
  });
  return dirty ? next : entities;
};

export interface AtlasEntryRemovalResult {
  /** Room fields to persist. Empty fields are never included, so unrelated data stays untouched. */
  patch: Partial<Msx2Screen5BitmapRoom>;
  /** The entries that were actually present and got removed, in atlas order. */
  removedEntries: Msx2BitmapRoomAtlasEntry[];
  /** Tile-map cells that were painted with one of them and are now empty. */
  clearedCells: number;
}

/**
 * Removes `entryIdsToRemove` from the room atlas: their pixels are wiped, the cells painted
 * with them are emptied (collision/behavior/sub-cell shape included), the surviving entries
 * are re-indexed across `tileGrid` and the `copy` commands, and dead references are dropped.
 *
 * Pure: the room is not mutated. Returns `null` when none of the ids is in this room's atlas.
 */
export function removeAtlasEntriesFromRoom(
  room: Msx2Screen5BitmapRoom,
  entryIdsToRemove: Iterable<string>,
): AtlasEntryRemovalResult | null {
  const removeIds = new Set(entryIdsToRemove);
  const entries = room?.atlas?.entries || [];
  const removedEntries = entries.filter(entry => removeIds.has(entry.id));
  if (removedEntries.length === 0) return null;

  // Surviving entries, minus sway/animation partners that pointed at a removed tile.
  const nextEntries = entries
    .filter(entry => !removeIds.has(entry.id))
    .map(entry => {
      const dropLeft = !!entry.swayLeftAtlasEntryId && removeIds.has(entry.swayLeftAtlasEntryId);
      const dropRight = !!entry.swayRightAtlasEntryId && removeIds.has(entry.swayRightAtlasEntryId);
      const animationIds = entry.animation?.frameEntryIds || [];
      const nextAnimationIds = animationIds.filter(id => !removeIds.has(id));
      const animationChanged = nextAnimationIds.length !== animationIds.length;
      if (!dropLeft && !dropRight && !animationChanged) return entry;
      const next = { ...entry };
      if (dropLeft) delete next.swayLeftAtlasEntryId;
      if (dropRight) delete next.swayRightAtlasEntryId;
      if (animationChanged && next.animation) {
        // Frame zero is normalized by the editor/generator. If all variants were
        // removed, drop the flag rather than leaving a misleading one-frame loop.
        if (nextAnimationIds.length < 2) delete next.animation;
        else next.animation = { ...next.animation, frameEntryIds: nextAnimationIds };
      }
      return next;
    });

  const { cols, rows } = bitmapRoomGridSize(room);
  const grid = buildTileGrid(room, cols, rows);
  const nextValueByEntryId = new Map(nextEntries.map((entry, index) => [entry.id, index + 1]));

  const nextCollision = cloneLayer(room.collision, cols, rows);
  const nextBehavior = cloneLayer(room.behavior, cols, rows);
  const nextCollisionShape = room.collisionShape ? cloneLayer(room.collisionShape, cols, rows) : null;

  let clearedCells = 0;
  const nextGrid = grid.map((row, y) => row.map((value, x) => {
    const oldEntry = value > 0 ? entries[value - 1] : null;
    if (!oldEntry) return 0;
    if (!removeIds.has(oldEntry.id)) return nextValueByEntryId.get(oldEntry.id) || 0;
    clearedCells += 1;
    nextCollision[y][x] = 0;
    nextBehavior[y][x] = 0;
    if (nextCollisionShape) nextCollisionShape[y][x] = 0;
    return 0;
  }));

  // Wipe the removed art so the freed atlas area does not show through the picker.
  const atlasWidth = Math.max(1, Number(room.atlas?.width) || 256);
  const atlasHeight = Math.max(1, Number(room.atlas?.height) || 128);
  const nextPixels: number[][] = [];
  for (let y = 0; y < atlasHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < atlasWidth; x++) row.push(room.atlas?.pixels?.[y]?.[x] ?? 0);
    nextPixels.push(row);
  }
  for (const entry of removedEntries) {
    const sx = Math.max(0, Math.trunc(entry.sx || 0));
    const sy = Math.max(0, Math.trunc(entry.sy || 0));
    const w = Math.max(1, Math.trunc(entry.w || GRID));
    const h = Math.max(1, Math.trunc(entry.h || GRID));
    for (let y = sy; y < Math.min(atlasHeight, sy + h); y++) {
      for (let x = sx; x < Math.min(atlasWidth, sx + w); x++) nextPixels[y][x] = 0;
    }
  }

  const nonCopy = (room.composition?.commands || []).filter(command => command.op !== 'copy');
  const nextTerrains = pruneTerrainsForEntries(room.autoTerrains, nextEntries);
  const nextForeground = (room.foregroundTiles || []).filter(tile => !removeIds.has(tile.atlasEntryId));
  const nextEntities = clearEntityAtlasRefs(room.entities, removeIds);

  const patch: Partial<Msx2Screen5BitmapRoom> = {
    atlas: {
      width: atlasWidth,
      height: atlasHeight,
      offscreenBaseY: room.atlas?.offscreenBaseY || 320,
      pixels: nextPixels,
      entries: nextEntries,
    },
    tileGrid: nextGrid,
    collision: nextCollision,
    behavior: nextBehavior,
    composition: {
      source: room.composition?.source || 'authored',
      commands: [...nonCopy, ...buildCopyCommandsFromGrid(nextGrid, nextEntries)],
    },
    ...(nextCollisionShape ? { collisionShape: nextCollisionShape } : {}),
    ...(nextTerrains !== room.autoTerrains ? { autoTerrains: nextTerrains || [] } : {}),
    ...(nextForeground.length !== (room.foregroundTiles || []).length ? { foregroundTiles: nextForeground } : {}),
    ...(nextEntities !== room.entities ? { entities: nextEntities || [] } : {}),
  };

  return { patch, removedEntries, clearedCells };
}

/** A bitmap stamp, as far as matching its copies in a room atlas is concerned. */
export interface StampAtlasIdentity {
  /** Every id the stamp is known by: the asset id and the id inside its data (they can differ). */
  ids: string[];
  /** Names `stampToAtlasTiles` would have given its tiles, for atlases authored before `sourceStampId`. */
  tileNames: string[];
}

const normalizeName = (value: string): string => String(value || '').trim().toLowerCase();

/**
 * Builds the matching key of a stamp asset. `tileNames` mirrors what the Screen Editor writes
 * when importing a stamp (`tile.name` or `<stamp name>_<n>`), plus the `Door <stamp name>`
 * entry the door metatile picker creates.
 */
export function buildStampAtlasIdentity(
  assetId: string,
  stampData: { id?: string; name?: string; stamp?: { tiles?: Array<{ name?: string }> } } | undefined,
): StampAtlasIdentity {
  const stampName = String(stampData?.name || '').trim();
  const tiles = stampData?.stamp?.tiles || [];
  const tileNames = tiles.map((tile, index) => String(tile?.name || '').trim() || `${stampName}_${index + 1}`);
  if (stampName) tileNames.push(`Door ${stampName}`);
  return {
    ids: Array.from(new Set([assetId, String(stampData?.id || '')].filter(Boolean))),
    tileNames: tileNames.filter(Boolean),
  };
}

/**
 * Atlas entries in `room` that came from `stamp`.
 *
 * Entries imported since provenance was recorded carry `sourceStampId` and match exactly.
 * Older rooms have nothing to go on but the tile names, so those are matched by name — but
 * only when the entry claims no stamp of its own, so another stamp's copies are never taken
 * by a name coincidence. Both kinds can coexist in one room (stamp placed before and after).
 */
export function findStampAtlasEntries(
  room: Msx2Screen5BitmapRoom,
  stamp: StampAtlasIdentity,
): Msx2BitmapRoomAtlasEntry[] {
  const entries = room?.atlas?.entries || [];
  if (entries.length === 0) return [];
  const stampIds = new Set(stamp.ids);
  const names = new Set(stamp.tileNames.map(normalizeName));
  return entries.filter(entry => (
    entry.sourceStampId
      ? stampIds.has(entry.sourceStampId)
      : names.size > 0 && names.has(normalizeName(entry.name))
  ));
}
