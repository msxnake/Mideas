/**
 * Contract: a newly entered note always carries a playable instrument.
 *
 * Both ways of entering a note -- typing into the grid and capturing live from a
 * MIDI keyboard with REC armed -- resolve the INS and ORN columns through
 * resolveNoteEntryAutoFields. They used to disagree: the live path only stamped
 * an instrument the user had explicitly clicked, so recording onto a fresh
 * channel produced notes with an empty INS column, and a note with no instrument
 * is silent on playback.
 *
 * Run: node scripts/check_tracker_note_entry_instrument.mjs
 */
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'server', 'temp', '_tracker_note_entry');
mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = join(OUT_DIR, 'trackerUtils.cjs');

buildSync({
  entryPoints: [join(ROOT, 'components', 'utils', 'trackerUtils.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: OUT_FILE,
  logLevel: 'silent',
});

const require = createRequire(import.meta.url);
const { resolveNoteEntryAutoFields, createEmptyRow } = require(OUT_FILE);

let failures = 0;
const check = (condition, label) => {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
};

/** A song with two PSG instruments and one SCC instrument, all rows empty. */
const makeSong = () => ({
  patterns: [{
    id: 'p0',
    name: 'P0',
    numRows: 8,
    rows: Array.from({ length: 8 }, () => createEmptyRow(['A', 'B', 'C', '1', '2', '3', '4', '5'])),
  }],
  order: [0],
  currentPatternIndexInOrder: 0,
  instruments: [
    { id: 7, name: 'psg-first', chip: 'PSG', volumeEnvelope: [15] },
    { id: 9, name: 'psg-second', chip: 'PSG', volumeEnvelope: [15] },
    { id: 20, name: 'scc-one', chip: 'SCC', waveform: new Array(32).fill(0) },
  ],
  ornaments: [],
});

// --- The regression: nothing selected by hand ------------------------------
// This is the state a user is in right after opening a song and arming REC.
{
  const song = makeSong();
  const fields = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, null, null, null, null);
  check(
    fields.instrument === 7,
    'no instrument picked by hand: falls back to the song\'s first PSG instrument',
  );
  check(fields.ornament === undefined, 'no ornament is invented when none is active');
}

// --- An explicitly selected instrument wins --------------------------------
{
  const song = makeSong();
  const fields = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, null, 9, null, 9);
  check(fields.instrument === 9, 'an explicitly selected instrument is the one written');
}

// --- Chip compatibility ----------------------------------------------------
{
  const song = makeSong();
  // A PSG instrument selected while entering on an SCC channel must not be used.
  const fields = resolveNoteEntryAutoFields(song, 0, 0, '1', null, null, 9, null, 9);
  check(fields.instrument === 20, 'a PSG instrument is never written onto an SCC channel');

  const psgFields = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, null, 20, null, 20);
  check(psgFields.instrument === 7, 'an SCC instrument is never written onto a PSG channel');
}

// --- Inheritance: an instrument already on the channel is not restated -----
{
  const song = makeSong();
  song.patterns[0].rows[0].A = { ...song.patterns[0].rows[0].A, note: 'C-4', instrument: 7 };
  const fields = resolveNoteEntryAutoFields(song, 0, 3, 'A', null, null, null, null, null);
  check(
    fields.instrument === undefined,
    'an instrument already inherited from an earlier row is left blank, not restated',
  );
}

// --- INS 0 is "none", not an instrument to inherit -------------------------
// Songs built by the generators and imported modules carry a literal 0 in the
// instrument column rather than null, which is what the grid renders as "00".
{
  const song = makeSong();
  song.patterns[0].rows[0].A = { ...song.patterns[0].rows[0].A, note: 'C-4', instrument: 0 };
  const fields = resolveNoteEntryAutoFields(song, 0, 3, 'A', null, null, null, null, null);
  check(
    fields.instrument === 7,
    'INS 0 on an earlier row counts as none, so a real instrument is still written',
  );
}

// --- The first note of a take states the instrument even if inherited ------
// Strict Vortex semantics leave it blank, which meant a performer who picked an
// instrument and recorded never saw it appear anywhere in the take.
{
  const song = makeSong();
  song.patterns[0].rows[0].A = { ...song.patterns[0].rows[0].A, note: 'C-4', instrument: 7 };
  const inherited = resolveNoteEntryAutoFields(song, 0, 3, 'A', null, null, null, null, null, false);
  check(inherited.instrument === undefined, 'without the flag an inherited instrument stays blank');

  const stamped = resolveNoteEntryAutoFields(song, 0, 3, 'A', null, null, null, null, null, true);
  check(stamped.instrument === 7, 'the take\'s first note on a channel states the inherited instrument');
}

// --- A cell holding INS 0 is cleared to null, not left as 0 ----------------
// The AY engine only inherits the channel's instrument when the cell is null.
// A literal 0 is read as "this row names instrument 0", resolves to nothing and
// plays silence -- so a row that should inherit must be blanked, not skipped.
{
  const song = makeSong();
  song.patterns[0].rows[0].A = { ...song.patterns[0].rows[0].A, note: 'C-4', instrument: 7 };
  song.patterns[0].rows[3].A = { ...song.patterns[0].rows[3].A, instrument: 0 };
  const fields = resolveNoteEntryAutoFields(song, 0, 3, 'A', 0, null, null, null, null);
  check(
    fields.instrument === null,
    'a cell holding INS 0 that should inherit is cleared to null, not left at 0',
  );

  // A cell that is already blank needs no change at all.
  const blank = resolveNoteEntryAutoFields(song, 0, 3, 'A', null, null, null, null, null);
  check(blank.instrument === undefined, 'an already blank INS column is left untouched');
}

// --- Ornament -------------------------------------------------------------
{
  const song = makeSong();
  const fields = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, null, null, 1, null);
  check(fields.ornament === 1, 'the active ornament is applied to an empty ORN column');

  const kept = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, 4, null, 1, null);
  check(kept.ornament === undefined, 'an ornament already on the cell is not overwritten');

  const zeroed = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, 0, null, 1, null);
  check(zeroed.ornament === 1, 'ORN 0 counts as empty and takes the active ornament');
}

// --- A song with no instruments at all ------------------------------------
{
  const song = makeSong();
  song.instruments = [];
  const fields = resolveNoteEntryAutoFields(song, 0, 0, 'A', null, null, null, null, null);
  check(
    fields.instrument === undefined,
    'a song with no instruments writes no instrument rather than inventing an id',
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nTracker note entry instrument contract passed.');
