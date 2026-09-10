import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBlankPT3Song, commitTrackerTake, rebuildPT3Bank } from '../../components/utils/pt3Recording';
import { parsePT3File, parsePT3Module } from '../../components/utils/pt3Parser';
import { PT3_FACTORY_INSTRUMENTS } from '../../utils/audio/pt3FactoryInstruments';
import type { TrackerSongData } from '../../types';
import { buildPT3RecordingTimeline, quantizePT3Position, resolvePT3NoteOffPosition } from '../../components/utils/pt3RecordingTiming';

const song = { id: 'test', ...createBlankPT3Song() } as TrackerSongData;
const module = parsePT3Module(new Uint8Array(song.externalPt3Data!).buffer);
assert.deepEqual(module.warnings, []);
assert.equal(song.patterns[0].numRows, 64);
assert.equal(song.instruments.length, PT3_FACTORY_INSTRUMENTS.length);
assert.deepEqual(song.order, [0]);
assert(song.patterns[0].rows.every(row => ['A', 'B', 'C'].every(channel => row[channel].note === null)));
const before = JSON.stringify(song);
const take = new Map([
  ['0:4:A', { note: 'C-4', instrument: 1, volume: 12 }],
  ['0:8:A', { note: 'E-4' }],
  ['0:12:A', { note: '===' }],
]);
const patch = commitTrackerTake(song, take);
const decoded = parsePT3File(new Uint8Array(patch.externalPt3Data!).buffer);
assert.equal(decoded.patterns![0].rows[4].A.note, 'C-4');
assert.equal(decoded.patterns![0].rows[4].A.instrument, 1);
assert.equal(decoded.patterns![0].rows[8].A.instrument, null);
assert.equal(decoded.patterns![0].rows[12].A.note, '===');
assert.equal(JSON.stringify(song), before);
for (let row = 0; row < 64; row++) {
  for (const channel of ['B', 'C'] as const) {
    assert.deepEqual(decoded.patterns![0].rows[row][channel], song.patterns[0].rows[row][channel]);
  }
}
assert.deepEqual(decoded.instruments!.map(item => 'pt3Sample' in item ? item.pt3Sample?.steps.map(step => step.raw) : undefined),
  song.instruments.map(item => 'pt3Sample' in item ? item.pt3Sample?.steps.map(step => step.raw) : undefined));
const sparseBank = [{ ...PT3_FACTORY_INSTRUMENTS[0], id: 7 }];
const withBank = createBlankPT3Song(sparseBank);
assert.deepEqual(withBank.instruments!.map(item => item.id), [7]);
const bankSong = { ...song, ...patch, instruments: [...song.instruments, { ...PT3_FACTORY_INSTRUMENTS[0], id: 31 }] };
const bankPatch = rebuildPT3Bank(bankSong);
const reloaded = parsePT3File(new Uint8Array(bankPatch.externalPt3Data!).buffer);
assert(reloaded.instruments!.some(item => item.id === 31));
assert.deepEqual(reloaded.patterns!.map(pattern => pattern.rows), decoded.patterns!.map(pattern => pattern.rows));
assert.throws(() => commitTrackerTake(song, new Map([['0:0:A', { instrument: 99 }]])));
assert.throws(() => commitTrackerTake(song, new Map([['2:0:A', { note: 'C-4' }]])));
const original = parsePT3Module(new Uint8Array(readFileSync('public/samples/pt3/kuvo-forgotten-puppet.pt3')).buffer);
const fromImportedBank = createBlankPT3Song(original.instruments, original.ornaments);
assert.deepEqual(fromImportedBank.instruments!.map(item => 'pt3Sample' in item ? item.pt3Sample?.steps.map(step => step.raw) : null),
  original.instruments.map(item => item.pt3Sample?.steps.map(step => step.raw)));
assert.deepEqual(fromImportedBank.ornaments!.map(item => item.data), original.ornaments.map(item => item.data));
assert(fromImportedBank.patterns![0].rows.every(row => !row.A.note && !row.B.note && !row.C.note));
const arranged = { ...song, patterns: [song.patterns[0], { ...song.patterns[0], id: 'second' }], order: [1, 0, 1], restartPosition: 1 };
const arrangedPatch = commitTrackerTake(arranged, new Map([['1:15:B', { note: 'G-3', instrument: 1 }]]));
const arrangement = parsePT3File(new Uint8Array(arrangedPatch.externalPt3Data!).buffer);
assert.deepEqual(arrangement.order, [1, 0, 1]);
assert.equal(arrangement.restartPosition, 1);
assert.equal(arrangement.patterns![1].rows[15].B.note, 'G-3');
assert.deepEqual(arrangement.instruments!.map(item => 'pt3Sample' in item ? item.pt3Sample?.steps.map(step => step.raw) : null),
  decoded.instruments!.map(item => 'pt3Sample' in item ? item.pt3Sample?.steps.map(step => step.raw) : null));
const timeline = buildPT3RecordingTimeline(song);
assert.equal(quantizePT3Position(timeline, 5.9, 0)!.row, 0);
assert.equal(quantizePT3Position(timeline, 3, 1)!.row, 1);
assert.equal(quantizePT3Position(timeline, 8, 2)!.row, 2);
assert.equal(quantizePT3Position(timeline, 13, 4)!.row, 4);
const start = quantizePT3Position(timeline, 1, 1)!;
const earlyRelease = quantizePT3Position(timeline, 2, 1)!;
assert.equal(resolvePT3NoteOffPosition(timeline, start, earlyRelease, 1, 0, 0, null)!.row, 1);
const late = quantizePT3Position(timeline, 382, 1, 0)!;
assert.equal(late.row, 0); assert.equal(late.cycleOffset, 1);
const last = quantizePT3Position(timeline, 378, 1)!;
assert.equal(resolvePT3NoteOffPosition(timeline, last, last, 1, 0, 0, null), null);
const boundaryCut = resolvePT3NoteOffPosition(timeline, last, last, 1, 0, 0, 0)!;
assert.equal(boundaryCut.row, 0); assert.equal(boundaryCut.cycleOffset, 1);
const spedPattern = structuredClone(song.patterns[0]);
spedPattern.pt3SourceRows = [{ A: { effects: [{ code: 9, params: [3] }] } } as any];
const fast = buildPT3RecordingTimeline({ ...song, patterns: [spedPattern] });
assert.equal(fast[0].endFrame, 3); assert.equal(fast[1].startFrame, 3);
assert.equal(quantizePT3Position(fast, 2, 1)!.row, 1);
console.log('PASS: blank PT3, imported bank, MIDI take round-trip, INS inheritance, note cut, unchanged backing channels and samples, rejected invalid takes.');
