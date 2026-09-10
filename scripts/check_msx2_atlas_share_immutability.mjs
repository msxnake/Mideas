#!/usr/bin/env node
/**
 * Sharing ONE atlas object across a world's rooms must change nothing observable.
 *
 * `applySharedAtlasToWorldRooms` now points every room of the active world at a
 * single atlas object instead of deep-cloning it per room (4.6 M numbers copied
 * per edit on a 13-room project). That is only safe while two things hold:
 *
 *   1. The saved project is byte-identical to what per-room clones produced.
 *      JSON has no references, so `JSON.stringify` must emit the same text.
 *   2. Nobody mutates an atlas in place. With a shared reference an in-place
 *      write would corrupt every room of the world at once.
 *
 * This imports the REAL fan-out and the REAL atlas utilities, and checks both
 * against the previous per-room-clone implementation kept here as the oracle.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const bundle = async (relPath, name) => {
  const out = join(mkdtempSync(join(tmpdir(), `mideas-${name}-`)), `${name}.mjs`);
  await build({
    entryPoints: [join(repoRoot, ...relPath)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
  });
  return import(pathToFileURL(out).href);
};

const { applySharedAtlasToWorldRooms, cloneBitmapAtlas } =
  await bundle(['utils', 'msx2BitmapAtlasFanout.ts'], 'fanout');
const { importTilesIntoAtlas } =
  await bundle(['utils', 'msx2BitmapAtlasImport.ts'], 'atlasimport');

const checks = [];
const expect = (name, passed, detail = '') => checks.push([name, passed, detail]);

// ---------------------------------------------------------------------------
// The oracle: the implementation this replaces, cloning the atlas per room.
// ---------------------------------------------------------------------------
const oracleFanout = (assets, { activeRoomId, worldRoomIds, patch, sharedAtlas }) => {
  const cloneAtlas = atlas => ({
    width: atlas.width,
    height: atlas.height,
    offscreenBaseY: atlas.offscreenBaseY,
    pixels: (atlas.pixels || []).map(row => [...row]),
    entries: (atlas.entries || []).map(entry => ({ ...entry })),
  });
  const remap = (grid, oldAtlas, nextAtlas) => {
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
  const rebuild = (grid, atlas, sourceCommands = []) => {
    const nonCopy = (sourceCommands || []).filter(command => command.op !== 'copy');
    const entries = atlas.entries || [];
    const tileCommands = (grid || []).flatMap((row, y) => (row || []).flatMap((value, x) => {
      const index = Math.max(0, Math.trunc(Number(value) || 0)) - 1;
      const entry = index >= 0 ? entries[index] : undefined;
      return entry
        ? [{ id: `tile_${x}_${y}`, op: 'copy', atlasEntryId: entry.id, dx: x * 16, dy: y * 16, w: entry.w || 16, h: entry.h || 16 }]
        : [];
    }));
    return { source: 'authored', commands: [...nonCopy, ...tileCommands] };
  };

  return assets.map(asset => {
    if (asset.type !== 'msx2bitmaproom' || !worldRoomIds.has(asset.id)) return asset;
    const roomData = asset.data;
    const roomPatch = asset.id === activeRoomId ? patch : { atlas: sharedAtlas };
    const nextAtlas = cloneAtlas(sharedAtlas);
    const patchHasTileGrid = Object.prototype.hasOwnProperty.call(roomPatch, 'tileGrid');
    const nextTileGrid = patchHasTileGrid
      ? roomPatch.tileGrid
      : remap(roomData.tileGrid, roomData.atlas, nextAtlas);
    const patchHasComposition = Object.prototype.hasOwnProperty.call(roomPatch, 'composition');
    const shouldRebuild = !patchHasComposition && Array.isArray(nextTileGrid);
    return {
      ...asset,
      data: {
        ...roomData,
        ...roomPatch,
        atlas: nextAtlas,
        ...(Array.isArray(nextTileGrid) ? { tileGrid: nextTileGrid } : {}),
        ...(shouldRebuild ? { composition: rebuild(nextTileGrid, nextAtlas, roomData.composition?.commands || []) } : {}),
      },
    };
  });
};

// ---------------------------------------------------------------------------
// Real project data
// ---------------------------------------------------------------------------
const FIXTURE = process.env.ATLAS_FIXTURE
  || join(repoRoot, 'test', 'msx2-destroy', 'fixture_base.json');

let assets = null;
try {
  assets = JSON.parse(readFileSync(FIXTURE, 'utf8')).assets || [];
} catch (error) {
  console.log(`SKIP: fixture unreadable (${error.message})`);
  process.exit(0);
}

const rooms = assets.filter(a => a.type === 'msx2bitmaproom');
const world = assets.find(a => a.type === 'worldmap');
const worldRoomIds = new Set(
  (world?.data?.nodes || []).map(node => node.screenAssetId).filter(Boolean)
);
const worldRooms = rooms.filter(room => worldRoomIds.has(room.id));

if (worldRooms.length < 2) {
  console.log(`SKIP: fixture needs >=2 rooms in one world (has ${worldRooms.length})`);
  process.exit(0);
}

console.log(`  Fixture: ${rooms.length} rooms, ${worldRooms.length} in the active world`);

const activeRoom = worldRooms[0];
const baseAtlas = activeRoom.data.atlas;

/** One pixel flipped, entries untouched: the plain "paint in the atlas" edit. */
const pixelEditedAtlas = {
  ...baseAtlas,
  pixels: baseAtlas.pixels.map((row, y) => (
    y === baseAtlas.pixels.length - 1 ? row.map((v, x) => (x === row.length - 1 ? (v + 1) & 0x0f : v)) : row
  )),
};

// The edits that actually exercise the tile-grid remap. A tile grid stores
// 1-BASED INDEXES into `entries`, so any change to the entry ORDER shifts every
// later index; the remap has to re-resolve through the entry id. A pixel-only
// edit leaves the remap as the identity and proves nothing about it.
const removedFirstEntry = {
  ...baseAtlas,
  entries: baseAtlas.entries.slice(1),
};
const reorderedEntries = {
  ...baseAtlas,
  entries: [...baseAtlas.entries].reverse(),
};
const prependedEntry = {
  ...baseAtlas,
  entries: [
    { ...baseAtlas.entries[0], id: 'atlas_probe_prepended', name: 'probe' },
    ...baseAtlas.entries,
  ],
};

const scenarios = [
  ['pixel edit, entries untouched', pixelEditedAtlas],
  ['first atlas entry removed (indexes shift down)', removedFirstEntry],
  ['atlas entries reversed (indexes fully remapped)', reorderedEntries],
  ['entry prepended (indexes shift up)', prependedEntry],
];

const runBoth = editedAtlas => {
  const options = { activeRoomId: activeRoom.id, worldRoomIds, patch: { atlas: editedAtlas } };
  return {
    next: applySharedAtlasToWorldRooms(assets, { ...options, sharedAtlas: cloneBitmapAtlas(editedAtlas) }),
    oracle: oracleFanout(assets, { ...options, sharedAtlas: cloneBitmapAtlas(editedAtlas) }),
  };
};

// 1. The acceptance criterion, across every edit shape: byte-identical output.
for (const [label, editedAtlas] of scenarios) {
  const result = runBoth(editedAtlas);
  expect(`saved JSON is byte-identical to per-room clones -- ${label}`,
    JSON.stringify(result.next) === JSON.stringify(result.oracle));

  // And the remap must have DONE something when the entry order changed,
  // otherwise the byte-identity above is comparing two no-ops.
  if (editedAtlas !== pixelEditedAtlas) {
    const roomWithGrid = worldRooms.find(room => Array.isArray(room.data.tileGrid)
      && room.data.tileGrid.some(row => (row || []).some(v => Number(v) > 0)));
    if (roomWithGrid) {
      const before = JSON.stringify(roomWithGrid.data.tileGrid);
      const after = JSON.stringify(result.next[assets.indexOf(roomWithGrid)].data.tileGrid);
      expect(`the tile grid was actually remapped -- ${label}`, before !== after,
        'the grid came out unchanged, so this scenario does not exercise the remap');
    } else {
      console.log(`  SKIP: no room has a populated tileGrid, remap not exercised (${label})`);
    }
  }
}

const editedAtlas = pixelEditedAtlas;
const { next, oracle } = runBoth(editedAtlas);

// 2. The optimisation actually happened.
const worldResults = next.filter(a => a.type === 'msx2bitmaproom' && worldRoomIds.has(a.id));
const atlasRefs = new Set(worldResults.map(a => a.data.atlas));
expect(`all ${worldResults.length} world rooms share ONE atlas object`,
  atlasRefs.size === 1, `${atlasRefs.size} distinct atlas objects`);

const oracleRefs = new Set(
  oracle.filter(a => a.type === 'msx2bitmaproom' && worldRoomIds.has(a.id)).map(a => a.data.atlas)
);
expect('the oracle really did clone per room (so the check is meaningful)',
  oracleRefs.size === worldResults.length,
  `oracle produced ${oracleRefs.size} atlas objects for ${worldResults.length} rooms`);

// 3. Assets outside the world keep their identity, so history can skip them.
const outside = assets.filter(a => !(a.type === 'msx2bitmaproom' && worldRoomIds.has(a.id)));
expect('assets outside the active world keep their reference',
  outside.every(asset => next[assets.indexOf(asset)] === asset));

// 4. Every world room did change reference (its atlas content differs now).
expect('every world room got a new asset object',
  worldRooms.every(room => next[assets.indexOf(room)] !== room));

// 5. The active room received the full patch, not just the atlas.
const activeResult = next[assets.indexOf(activeRoom)];
expect('the active room carries the edited atlas',
  JSON.stringify(activeResult.data.atlas.pixels) === JSON.stringify(editedAtlas.pixels));

// 6. The shared atlas is a copy the caller owns, not the editor's patch object.
expect('the shared atlas is not the patch object handed in by the editor',
  activeResult.data.atlas !== editedAtlas);
expect('the shared atlas does not alias the patch pixel rows',
  activeResult.data.atlas.pixels.every((row, y) => row !== editedAtlas.pixels[y]));

// 7. The fan-out did not mutate the input assets.
const inputSnapshot = JSON.stringify(assets.map(a => (
  a.type === 'msx2bitmaproom' ? { id: a.id, atlas: a.data.atlas, tileGrid: a.data.tileGrid } : a.id
)));
runBoth(pixelEditedAtlas);
expect('running the fan-out does not mutate the input assets',
  JSON.stringify(assets.map(a => (
    a.type === 'msx2bitmaproom' ? { id: a.id, atlas: a.data.atlas, tileGrid: a.data.tileGrid } : a.id
  ))) === inputSnapshot);

// ---------------------------------------------------------------------------
// The invariant: the real atlas utilities must not write into their input.
// This is what makes the shared reference safe.
// ---------------------------------------------------------------------------
const sourceAtlas = cloneBitmapAtlas(activeRoom.data.atlas);
const atlasBefore = JSON.stringify(sourceAtlas);
const importResult = importTilesIntoAtlas(
  {
    width: sourceAtlas.width,
    height: sourceAtlas.height,
    offscreenBaseY: sourceAtlas.offscreenBaseY || 320,
    pixels: sourceAtlas.pixels,
    entries: sourceAtlas.entries,
  },
  [{ name: 'probe_tile', width: 16, height: 16, pixels: Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => 7)) }],
);

expect('importTilesIntoAtlas does not mutate the atlas it was given',
  JSON.stringify(sourceAtlas) === atlasBefore);
expect('importTilesIntoAtlas returns fresh pixel rows (no aliasing of the input)',
  importResult.atlas.pixels.every((row, y) => row !== sourceAtlas.pixels[y]));
expect('importTilesIntoAtlas actually added the probe tile (so the check ran)',
  (importResult.addedEntries || []).length === 1);

// Writing into the RESULT must not reach back into the source atlas: that is
// exactly the corruption a shared reference would expose.
if (importResult.atlas.pixels.length && importResult.atlas.pixels[0].length) {
  const originalValue = sourceAtlas.pixels[0][0];
  importResult.atlas.pixels[0][0] = (originalValue + 5) & 0x0f;
  expect('writing into the imported atlas does not reach the source atlas',
    sourceAtlas.pixels[0][0] === originalValue);
}

let failed = 0;
for (const [name, passed, detail] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}${!passed && detail ? ` -- ${detail}` : ''}`);
  if (!passed) failed += 1;
}

if (failed) {
  throw new Error(`Atlas sharing checks failed: ${failed}`);
}
console.log(`\nAtlas sharing checks passed (${checks.length}).`);
