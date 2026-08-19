#!/usr/bin/env node
/**
 * Deleting a bitmap stamp takes its Tile Atlas copies with it.
 *
 * Placing a stamp COPIES its tiles into the atlas of the room it is placed in, so the stamp
 * asset and the atlas tiles are two different things: deleting the asset used to leave the
 * copies behind in every room. These checks drive the real matching + removal functions.
 *
 * The removal is the delicate half: `tileGrid` addresses atlas entries by INDEX + 1, so
 * dropping an entry has to clear the cells painted with it AND shift every cell that pointed
 * past it, in lock-step with the derived `copy` commands. A room left with the indices it had
 * before is a room whose walls silently turn into other tiles.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-stamp-atlas-')), 'removal.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2BitmapAtlasRemoval.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { buildStampAtlasIdentity, findStampAtlasEntries, removeAtlasEntriesFromRoom } =
  await import(pathToFileURL(out).href);

const STAMP_ASSET_ID = 'stamp_lib_import_1700000000000';
const stampAsset = {
  id: STAMP_ASSET_ID,
  name: 'Puerta',
  stamp: { columns: 2, rows: 1, tiles: [{ name: 'puerta_izq' }, { name: '' }] },
};

const entry = (id, name, sy, extra = {}) => ({ id, name, sx: 0, sy, w: 16, h: 16, ...extra });

/** Two stamp tiles (indices 1 and 2 of the atlas) between two hand-drawn ones. */
const makeRoom = (stampMarker) => ({
  id: 'room_1',
  name: 'Sala 1',
  height: 192,
  atlas: {
    width: 256,
    height: 64,
    offscreenBaseY: 320,
    pixels: Array.from({ length: 64 }, (_row, y) => Array.from({ length: 256 }, () => (y < 16 ? 1 : 7))),
    entries: [
      entry('atlas_suelo', 'suelo', 0),
      entry('atlas_puerta_izq', 'puerta_izq', 16, stampMarker(0)),
      entry('atlas_puerta_der', 'Puerta_2', 32, stampMarker(1)),
      entry('atlas_techo', 'techo', 48, { collisionFlags: 1 }),
    ],
  },
  composition: {
    source: 'authored',
    commands: [
      { id: 'bg', op: 'fill', x: 0, y: 0, w: 256, h: 192, color: 4 },
      { id: 'tile_0_0', op: 'copy', atlasEntryId: 'atlas_suelo', dx: 0, dy: 0, w: 16, h: 16 },
      { id: 'tile_1_0', op: 'copy', atlasEntryId: 'atlas_puerta_izq', dx: 16, dy: 0, w: 16, h: 16 },
      { id: 'tile_2_0', op: 'copy', atlasEntryId: 'atlas_puerta_der', dx: 32, dy: 0, w: 16, h: 16 },
      { id: 'tile_3_0', op: 'copy', atlasEntryId: 'atlas_techo', dx: 48, dy: 0, w: 16, h: 16 },
    ],
  },
  //           suelo, puerta_izq, puerta_der, techo
  tileGrid: [[1, 2, 3, 4], ...Array.from({ length: 11 }, () => [0, 0, 0, 0])],
  collision: [[0, 0, 0, 1], ...Array.from({ length: 11 }, () => [0, 0, 0, 0])],
  effects: Array.from({ length: 12 }, () => [0, 0, 0, 0]),
  behavior: [[0, 3, 3, 0], ...Array.from({ length: 11 }, () => [0, 0, 0, 0])],
  collisionShape: [[0, 12, 12, 0], ...Array.from({ length: 11 }, () => [0, 0, 0, 0])],
  autoTerrains: [{
    id: 'terrain_1',
    name: 'Muro',
    template: 'blob16',
    mapping: { 0: 'atlas_puerta_izq', 1: 'atlas_techo' },
    variants: { 1: [{ entryId: 'atlas_puerta_der', percent: 30 }] },
  }],
  foregroundTiles: [
    { cellX: 1, cellY: 0, atlasEntryId: 'atlas_puerta_der' },
    { cellX: 3, cellY: 0, atlasEntryId: 'atlas_techo' },
  ],
  entities: [{
    id: 'door_1',
    name: 'Puerta',
    kind: 'door',
    position: { x: 1, y: 0 },
    params: { closedAtlasEntryId: 'atlas_puerta_izq', openAtlasEntryId: 'atlas_techo', keyPickupId: 'k1' },
  }],
  palette: [],
});

const withProvenance = index => ({ sourceStampId: STAMP_ASSET_ID, sourceStampTileIndex: index });
const withoutProvenance = () => ({});

const identity = buildStampAtlasIdentity(STAMP_ASSET_ID, stampAsset);
const checks = [];
const ids = entries => entries.map(item => item.id);

// --- 1. Matching -----------------------------------------------------------------------

{
  const room = makeRoom(withProvenance);
  checks.push(['Stamp copies are found by recorded provenance',
    JSON.stringify(ids(findStampAtlasEntries(room, identity))) === JSON.stringify(['atlas_puerta_izq', 'atlas_puerta_der'])]);
}

{
  // Rooms authored before provenance existed: the tile names are all there is to go on.
  // The second tile has no name of its own, so the editor named it "<stamp>_2".
  const room = makeRoom(withoutProvenance);
  checks.push(['Older rooms are matched by the tile names the editor writes',
    JSON.stringify(ids(findStampAtlasEntries(room, identity))) === JSON.stringify(['atlas_puerta_izq', 'atlas_puerta_der'])]);
}

{
  // A name coincidence must never take a tile another stamp has claimed.
  const room = makeRoom(withoutProvenance);
  room.atlas.entries[1].sourceStampId = 'stamp_otro';
  checks.push(['A tile claimed by another stamp is left alone',
    JSON.stringify(ids(findStampAtlasEntries(room, identity))) === JSON.stringify(['atlas_puerta_der'])]);
}

{
  const room = makeRoom(withProvenance);
  const other = buildStampAtlasIdentity('stamp_desconocido', { id: 'stamp_desconocido', name: 'Otro', stamp: { tiles: [] } });
  checks.push(['An unrelated stamp matches nothing', findStampAtlasEntries(room, other).length === 0]);
}

// --- 2. Removal ------------------------------------------------------------------------

{
  const room = makeRoom(withProvenance);
  const before = JSON.stringify(room);
  const removal = removeAtlasEntriesFromRoom(room, ids(findStampAtlasEntries(room, identity)));
  const patch = removal.patch;

  checks.push(['The room passed in is not mutated', JSON.stringify(room) === before]);
  checks.push(['Both stamp tiles are reported removed', removal.removedEntries.length === 2]);
  checks.push(['The cells painted with them are counted', removal.clearedCells === 2]);
  checks.push(['Only the hand-drawn tiles survive',
    JSON.stringify(patch.atlas.entries.map(item => item.id)) === JSON.stringify(['atlas_suelo', 'atlas_techo'])]);

  // THE re-index: `techo` was entry 4 and is now entry 2, so its cell must read 2.
  // Rows come back at the room's real width (16 cells); only the painted ones matter.
  checks.push(['Surviving cells follow their tile to its new index',
    JSON.stringify(patch.tileGrid[0].slice(0, 4)) === JSON.stringify([1, 0, 0, 2])]);
  checks.push(['The tile map keeps the room shape', patch.tileGrid.length === 12 && patch.tileGrid[0].length === 16]);
  checks.push(['Copy commands are rebuilt against the new indices',
    JSON.stringify(patch.composition.commands.filter(cmd => cmd.op === 'copy').map(cmd => cmd.atlasEntryId))
      === JSON.stringify(['atlas_suelo', 'atlas_techo'])]);
  checks.push(['Fills and lines are kept',
    patch.composition.commands.filter(cmd => cmd.op === 'fill').length === 1]);

  checks.push(['Collision of cleared cells is zeroed', JSON.stringify(patch.collision[0].slice(0, 4)) === JSON.stringify([0, 0, 0, 1])]);
  checks.push(['Behavior of cleared cells is zeroed', JSON.stringify(patch.behavior[0].slice(0, 4)) === JSON.stringify([0, 0, 0, 0])]);
  checks.push(['Sub-cell shapes of cleared cells are zeroed', JSON.stringify(patch.collisionShape[0].slice(0, 4)) === JSON.stringify([0, 0, 0, 0])]);

  // The removed tiles occupy x 0..15 of atlas rows 16..47; nothing else may change.
  const wiped = patch.atlas.pixels.slice(16, 48).every(row => row.slice(0, 16).every(value => value === 0));
  const keptRight = patch.atlas.pixels.slice(16, 48).every(row => row.slice(16).every(value => value === 7));
  const keptRows = patch.atlas.pixels[0].every(value => value === 1) && patch.atlas.pixels[48].every(value => value === 7);
  checks.push(['The freed atlas area is wiped', wiped]);
  checks.push(['The surviving atlas art is untouched', keptRight && keptRows]);

  checks.push(['Autotile mappings pointing at removed tiles are dropped',
    JSON.stringify(patch.autoTerrains[0].mapping) === JSON.stringify({ 1: 'atlas_techo' })]);
  checks.push(['Autotile variants pointing at removed tiles are dropped', !patch.autoTerrains[0].variants]);
  checks.push(['Foreground overlays of removed tiles are dropped',
    JSON.stringify(patch.foregroundTiles.map(tile => tile.atlasEntryId)) === JSON.stringify(['atlas_techo'])]);
  checks.push(['Entity params pointing at a removed tile are blanked',
    patch.entities[0].params.closedAtlasEntryId === '']);
  checks.push(['Entity params pointing at a surviving tile are kept',
    patch.entities[0].params.openAtlasEntryId === 'atlas_techo' && patch.entities[0].params.keyPickupId === 'k1']);
}

{
  const room = makeRoom(withProvenance);
  checks.push(['Removing nothing is a no-op', removeAtlasEntriesFromRoom(room, []) === null]);
  checks.push(['Removing an unknown tile is a no-op', removeAtlasEntriesFromRoom(room, ['atlas_no_existe']) === null]);
}

{
  // A room that never persisted `tileGrid`: the grid comes from the copy commands.
  const room = makeRoom(withProvenance);
  delete room.tileGrid;
  const removal = removeAtlasEntriesFromRoom(room, ['atlas_puerta_izq', 'atlas_puerta_der']);
  checks.push(['Rooms without a stored tileGrid are re-indexed from their commands',
    JSON.stringify(removal.patch.tileGrid[0].slice(0, 4)) === JSON.stringify([1, 0, 0, 2]) && removal.clearedCells === 2]);
}

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
console.log('');
if (failed) {
  console.error(`MSX2 stamp/atlas cleanup checks FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
console.log(`MSX2 stamp/atlas cleanup checks passed (${checks.length}).`);
