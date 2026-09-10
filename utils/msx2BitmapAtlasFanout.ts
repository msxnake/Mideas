/**
 * @fileoverview Propagating one atlas edit to every room of a SCREEN 5 world.
 *
 * Rooms in a world SHARE one atlas, but each room persists its own copy of it
 * (see the project JSON). So editing a single atlas pixel is genuinely a change
 * to every room, and the whole world has to be rewritten.
 *
 * This used to deep-clone the atlas once PER ROOM: on a 13-room world with a
 * 356,352-pixel atlas that is 4.6 million numbers copied per edit. Since every
 * consumer treats the atlas as immutable — every writer builds a fresh array
 * (`normalizePixels`, the atlas-removal pass) or spreads (`{...room.atlas, entries}`)
 * — the rooms can all point at ONE atlas object instead.
 *
 * ## The invariant this relies on
 *
 * **Nobody mutates `room.atlas` (or its `pixels` rows / `entries`) in place.**
 * With a shared reference, an in-place write would silently corrupt every room
 * of the world at once instead of just one. `scripts/check_msx2_atlas_share_immutability.mjs`
 * pins this down for the real atlas utilities.
 *
 * Sharing changes nothing in the saved project or the generated ROM: JSON has no
 * references, so `JSON.stringify` still emits the atlas in full under each room.
 * That byte-identity is asserted by the same check script.
 */
import { Msx2Screen5BitmapRoom, ProjectAsset } from '../types';

type BitmapAtlas = Msx2Screen5BitmapRoom['atlas'];
type BitmapTileGrid = Msx2Screen5BitmapRoom['tileGrid'];
type BitmapComposition = Msx2Screen5BitmapRoom['composition'];

/** Defensive copy of an atlas patch handed over by an editor. */
export const cloneBitmapAtlas = (atlas: BitmapAtlas): BitmapAtlas => ({
  width: atlas.width,
  height: atlas.height,
  offscreenBaseY: atlas.offscreenBaseY,
  pixels: (atlas.pixels || []).map(row => [...row]),
  entries: (atlas.entries || []).map(entry => ({ ...entry })),
});

/**
 * Re-points a room's tile grid at the new atlas by entry id.
 *
 * A tile grid stores 1-based indexes into `atlas.entries`, so reordering or
 * removing entries shifts every later index. Resolving through the id keeps a
 * room painted with the tile the author chose.
 */
const remapTileGridToAtlas = (
  grid: BitmapTileGrid,
  oldAtlas: BitmapAtlas | undefined,
  nextAtlas: BitmapAtlas,
): BitmapTileGrid => {
  if (!Array.isArray(grid)) return grid;
  const nextIndexById = new Map((nextAtlas.entries || []).map((entry, index) => [entry.id, index + 1]));
  const oldEntries = oldAtlas?.entries || [];
  return grid.map(row => (row || []).map(value => {
    const oldValue = Math.max(0, Math.trunc(Number(value) || 0));
    if (oldValue <= 0) return 0;
    const oldEntry = oldEntries[oldValue - 1];
    if (!oldEntry) return 0;
    return nextIndexById.get(oldEntry.id) || 0;
  }));
};

/** Rebuilds the `copy` commands from a tile grid, preserving authored fills/lines. */
const rebuildCopyCommandsForGrid = (
  grid: BitmapTileGrid,
  atlas: BitmapAtlas,
  sourceCommands: BitmapComposition['commands'] = [],
): BitmapComposition => {
  const nonCopy = (sourceCommands || []).filter(command => command.op !== 'copy');
  const entries = atlas.entries || [];
  const tileCommands = (grid || []).flatMap((row, y) => (row || []).flatMap((value, x) => {
    const index = Math.max(0, Math.trunc(Number(value) || 0)) - 1;
    const entry = index >= 0 ? entries[index] : undefined;
    return entry
      ? [{ id: `tile_${x}_${y}`, op: 'copy' as const, atlasEntryId: entry.id, dx: x * 16, dy: y * 16, w: entry.w || 16, h: entry.h || 16 }]
      : [];
  }));
  return { source: 'authored', commands: [...nonCopy, ...tileCommands] };
};

export interface AtlasFanoutOptions {
  /** The room the author is actually editing; it receives the full patch. */
  activeRoomId: string;
  /** Rooms of the active world. Rooms outside it are returned untouched. */
  worldRoomIds: Set<string>;
  /** The patch the editor produced for the active room. */
  patch: Partial<Msx2Screen5BitmapRoom>;
  /**
   * The atlas every room of the world will point at. Must already be a copy the
   * caller owns (see {@link cloneBitmapAtlas}) — it is shared, not cloned again.
   */
  sharedAtlas: BitmapAtlas;
}

/**
 * Applies `sharedAtlas` to every room of the world, giving the active room the
 * full patch and the others an atlas-only update.
 *
 * Assets that are not bitmap rooms of the active world keep their identity, so
 * the history comparator can skip them.
 */
export const applySharedAtlasToWorldRooms = (
  assets: ProjectAsset[],
  { activeRoomId, worldRoomIds, patch, sharedAtlas }: AtlasFanoutOptions,
): ProjectAsset[] => assets.map(asset => {
  if (asset.type !== 'msx2bitmaproom' || !worldRoomIds.has(asset.id)) return asset;

  const roomData = asset.data as Msx2Screen5BitmapRoom;
  const roomPatch = asset.id === activeRoomId ? patch : { atlas: sharedAtlas };
  const patchHasTileGrid = Object.prototype.hasOwnProperty.call(roomPatch, 'tileGrid');
  const nextTileGrid = patchHasTileGrid
    ? (roomPatch as Msx2Screen5BitmapRoom).tileGrid
    : remapTileGridToAtlas(roomData.tileGrid, roomData.atlas, sharedAtlas);
  const patchHasComposition = Object.prototype.hasOwnProperty.call(roomPatch, 'composition');
  const shouldRebuildComposition = !patchHasComposition && Array.isArray(nextTileGrid);

  return {
    ...asset,
    data: {
      ...roomData,
      ...roomPatch,
      // One object for the whole world: see the invariant in this file's header.
      atlas: sharedAtlas,
      ...(Array.isArray(nextTileGrid) ? { tileGrid: nextTileGrid } : {}),
      ...(shouldRebuildComposition
        ? { composition: rebuildCopyCommandsForGrid(nextTileGrid, sharedAtlas, roomData.composition?.commands || []) }
        : {}),
    },
  };
});
