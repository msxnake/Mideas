import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { encodePT3SourceNoteCommand, locatePT3PlaybackFrame, parsePT3File, parsePT3Module } from '../../components/utils/pt3Parser';
import {
  PT3_VOLUME_TABLE,
  createPT3SampleChannelState,
  decodePT3SampleStep,
  stepPT3SampleMacro,
} from '../../components/utils/pt3SampleEngine';
import { applyPT3SourceNoteEntry, patchPT3SourceOrnamentBytes, patchPT3SourceSampleBytes, rewritePT3PatternNoteStreams } from '../../components/utils/pt3SourceEditor';
import { normalizeImportedPT3Data } from '../../components/utils/trackerUtils';
import type { PT3SampleMacro } from '../../types';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fixturePath = resolve(process.cwd(), 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3');
const fixture = readFileSync(fixturePath);
const fixtureBuffer = fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer;
const parsed = parsePT3Module(fixtureBuffer);

assert(parsed.title === 'Forgotten puppet', `Unexpected title: ${parsed.title}`);
assert(parsed.author === 'KUVO', `Unexpected author: ${parsed.author}`);
assert(parsed.toneTable === 2, `Tone table must come from byte 99, received ${parsed.toneTable}`);
assert(parsed.speed === 8, `Speed must come from byte 100, received ${parsed.speed}`);
assert(parsed.positionCount === 19 && parsed.loopPosition === 0, 'Position metadata mismatch.');
assert(parsed.patternTablePointer === 0x00dd, `Pattern pointer mismatch: ${parsed.patternTablePointer}`);
assert(parsed.instruments.length === 12, `Expected 12 real samples, received ${parsed.instruments.length}`);
assert(parsed.ornaments.length === 4, `Expected 4 real ornaments, received ${parsed.ornaments.length}`);

const sample1 = parsed.instruments.find(instrument => instrument.id === 1)?.pt3Sample;
assert(sample1, 'Sample 1 was not extracted.');
assert(sample1.loop === 0 && sample1.steps.length === 8, 'Sample 1 loop/length mismatch.');
assert(sample1.steps[0].raw.join(',') === '1,143,0,0', `Sample 1 raw step mismatch: ${sample1.steps[0].raw}`);
assert(sample1.steps[0].volume === 15, 'Sample volume decode mismatch.');
assert(sample1.steps[0].toneEnabled && !sample1.steps[0].noiseEnabled, 'Sample mixer decode mismatch.');

const sample4 = parsed.instruments.find(instrument => instrument.id === 4)?.pt3Sample;
assert(sample4?.loop === 17 && sample4.steps.length === 18, 'Last-line loop must be preserved.');
assert(sample4.steps[0].tonePeriodOffset === 64, 'Raw tone-period offset mismatch.');
assert(sample4.steps[0].noiseOrEnvelopeOffset === 3, 'Noise offset mismatch.');

const ornament1 = parsed.ornaments.find(ornament => ornament.id === 1);
assert(ornament1?.loopPosition === 2 && ornament1.data.join(',') === '-2,1,0', `Signed ornament mismatch: ${ornament1?.data}`);
assert(ornament1.sourcePointer !== undefined, 'Source ornament must retain its absolute PT3 pointer.');

const editedSampleMacro: PT3SampleMacro = {
  ...sample1,
  loop: 1,
  steps: sample1.steps.map((step, index) => index === 0
    ? decodePT3SampleStep([step.raw[0], (step.raw[1] & 0xf0) | 0x07, step.raw[2], step.raw[3]])
    : step),
};
const samplePatchedBytes = patchPT3SourceSampleBytes(new Uint8Array(fixtureBuffer), editedSampleMacro);
const samplePatched = parsePT3Module(samplePatchedBytes.buffer).instruments.find(instrument => instrument.id === 1)?.pt3Sample;
assert(samplePatched?.loop === 1 && samplePatched.steps[0].volume === 7, 'Saving a source PT3 sample must update the exact loop and raw step bytes.');
assert(samplePatchedBytes.length === fixture.length, 'Source sample editing must not change PT3 module size.');

const ornamentPatchedBytes = patchPT3SourceOrnamentBytes(new Uint8Array(fixtureBuffer), {
  ...ornament1,
  loopPosition: 0,
  data: [-3, 2, 1],
});
const ornamentPatched = parsePT3Module(ornamentPatchedBytes.buffer).ornaments.find(ornament => ornament.id === 1);
assert(ornamentPatched?.loopPosition === 0 && ornamentPatched.data.join(',') === '-3,2,1', 'Saving a source PT3 ornament must update signed steps and loop in the original bytes.');

const volumeHash = createHash('sha256').update(PT3_VOLUME_TABLE).digest('hex');
assert(volumeHash === 'a860d75271e1dafaf2d12aae6b769117a173316729858033ea9b1826bf0ed3d0', `PT3 VT_ table mismatch: ${volumeHash}`);
assert(Array.from(PT3_VOLUME_TABLE.slice(240)).join(',') === '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15', 'Full-volume VT_ row mismatch.');

const accumulatingStep = decodePT3SampleStep([0x01, 0x4f, 0x34, 0x12]);
assert(accumulatingStep.tonePeriodOffset === 0x1234 && accumulatingStep.accumulateTone, '16-bit tone accumulator flags mismatch.');

// Selector noise/envelope = bit 7 of B (noise mask), NOT bit 0 of C (per-tick
// envelope enable). These two vectors sit in the quadrants where the bits
// disagree, mirroring BIT 7,B / JR Z,LOCAL_NO_ENSL in the reference replayer.
const envSlideWithEnvOff = decodePT3SampleStep([0x0b, 0x90, 0x00, 0x00]);
assert(!envSlideWithEnvOff.hardwareEnvelopeEnabled && !envSlideWithEnvOff.noiseEnabled, 'Quadrant vector flags mismatch.');
assert(envSlideWithEnvOff.noiseOrEnvelopeOffset === 5, `Envelope slide must be signed 5-bit even with envelope masked: ${envSlideWithEnvOff.noiseOrEnvelopeOffset}`);
const envSlideMacro: PT3SampleMacro = { loop: 0, envelopeSlideMode: 'pt3-legacy-8bit', steps: [envSlideWithEnvOff] };
const envSlideState = createPT3SampleChannelState();
const envSlideTick = stepPT3SampleMacro(envSlideMacro, envSlideState, 15);
assert(envSlideTick.globalTarget === 'envelope', 'Noise-masked step must route its offset to the envelope accumulator.');

const noiseWithEnvOn = decodePT3SampleStep([0x06, 0x2f, 0x00, 0x00]);
assert(noiseWithEnvOn.hardwareEnvelopeEnabled && noiseWithEnvOn.noiseEnabled, 'Quadrant vector flags mismatch.');
assert(noiseWithEnvOn.noiseOrEnvelopeOffset === 3, `Noise offset mismatch with envelope enabled: ${noiseWithEnvOn.noiseOrEnvelopeOffset}`);
const noiseMacro: PT3SampleMacro = { loop: 0, envelopeSlideMode: 'pt3-legacy-8bit', steps: [noiseWithEnvOn] };
const noiseState = createPT3SampleChannelState();
const noiseTick = stepPT3SampleMacro(noiseMacro, noiseState, 15);
assert(noiseTick.globalTarget === 'noise', 'Noise-enabled step must route its offset to the noise accumulator.');
assert(noiseState.noiseAccumulator === 3, `Noise accumulate flag (bit 5 of B) must update the noise accumulator: ${noiseState.noiseAccumulator}`);
assert(noiseState.envelopeAccumulator === 0, 'Envelope accumulator must stay untouched on a noise step.');

// Noise offset keeps the full 7 bits of C>>1 (unmasked RRA in the replayer):
// amplitude-slide flags leak into the value exactly like on real hardware traces.
const pollutedNoise = decodePT3SampleStep([0xc1, 0x0e, 0x00, 0x00]);
assert(pollutedNoise.noiseOrEnvelopeOffset === 0x60, `7-bit noise offset must keep amplitude-slide bits: ${pollutedNoise.noiseOrEnvelopeOffset}`);

const loopMacro: PT3SampleMacro = {
  loop: 1,
  envelopeSlideMode: 'pt3-legacy-8bit',
  steps: [
    decodePT3SampleStep([0x01, 0x0f, 0x00, 0x00]),
    decodePT3SampleStep([0xc1, 0x0e, 0x00, 0x00]),
    decodePT3SampleStep([0x81, 0x0d, 0x00, 0x00]),
  ],
};
const loopState = createPT3SampleChannelState();
const loopPositions = Array.from({ length: 6 }, () => stepPT3SampleMacro(loopMacro, loopState, 15).position);
assert(loopPositions.join(',') === '0,1,2,1,2,1', `Sample loop stepping mismatch: ${loopPositions}`);
assert(loopState.amplitudeSlide === 1, `Amplitude slide accumulator mismatch: ${loopState.amplitudeSlide}`);

const legacyEnvelopeMacro: PT3SampleMacro = {
  loop: 0,
  envelopeSlideMode: 'pt3-legacy-8bit',
  steps: [decodePT3SampleStep([0x02, 0xaf, 0x00, 0x00])],
};
const correctedEnvelopeMacro: PT3SampleMacro = { ...legacyEnvelopeMacro, envelopeSlideMode: 'corrected-16bit' };
const legacyState = createPT3SampleChannelState();
const correctedState = createPT3SampleChannelState();
legacyState.envelopeAccumulator = 127;
correctedState.envelopeAccumulator = 127;
const legacyEnvelope = stepPT3SampleMacro(legacyEnvelopeMacro, legacyState, 15);
const correctedEnvelope = stepPT3SampleMacro(correctedEnvelopeMacro, correctedState, 15);
assert(legacyEnvelope.noiseOrEnvelopeDelta === -128, `Legacy 8-bit envelope wrap mismatch: ${legacyEnvelope.noiseOrEnvelopeDelta}`);
assert(correctedEnvelope.noiseOrEnvelopeDelta === 128, `Corrected 16-bit envelope result mismatch: ${correctedEnvelope.noiseOrEnvelopeDelta}`);

// Aliased sample pointers: both IDs must survive, sharing the same decoded body.
const aliasedFixture = Uint8Array.from(fixture);
aliasedFixture[109] = aliasedFixture[107];
aliasedFixture[110] = aliasedFixture[108];
const aliasedParsed = parsePT3Module(aliasedFixture.buffer);
const aliasedSample1 = aliasedParsed.instruments.find(instrument => instrument.id === 1)?.pt3Sample;
const aliasedSample2 = aliasedParsed.instruments.find(instrument => instrument.id === 2)?.pt3Sample;
assert(aliasedSample1 && aliasedSample2, 'Aliased sample pointers must keep every instrument ID.');
assert(aliasedSample2.sourceSampleId === 2, 'Aliased sample must keep its own source ID.');
assert(
  aliasedSample1.steps.length === aliasedSample2.steps.length
    && aliasedSample1.steps[0].raw.join(',') === aliasedSample2.steps[0].raw.join(','),
  'Aliased samples must decode to the same body.',
);

// Synthetic compressed pattern: fixes the command-boundary semantics that
// previously inflated real songs (notably Karbofos' Classified) to thousands
// of bogus rows. A owns the terminator, B treats command 0 as C_NOP, notes end
// PTDECOD immediately, B1 schedules the next decode, and 0x11 consumes exactly
// two envelope bytes plus one encoded sample byte.
const patternFixture = new Uint8Array(fixture.length + 96);
patternFixture.set(fixture);
patternFixture[101] = 1; // one position
patternFixture[102] = 0;
patternFixture[201] = 0; // pattern 0
const patternTable = fixture.length;
patternFixture[103] = patternTable & 0xff;
patternFixture[104] = patternTable >> 8;
const streamA = patternTable + 6;
const streamB = streamA + 12;
const streamC = streamB + 8;
const writeWord = (offset: number, value: number) => {
  patternFixture[offset] = value & 0xff;
  patternFixture[offset + 1] = value >> 8;
};
writeWord(patternTable, streamA);
writeWord(patternTable + 2, streamB);
writeWord(patternTable + 4, streamC);
patternFixture.set([0xb1, 0x03, 0xf1, 0x04, 0xc5, 0x50, 0x01, 0xd0, 0xaa, 0xbb, 0xcc, 0x00], streamA);
patternFixture.set([0xb1, 0x01, 0x50, 0x00, 0xc0, 0xd0, 0xd0, 0xd0], streamB);
patternFixture.set([0xb1, 0x01, 0x11, 0x12, 0x34, 0x06, 0x51, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0], streamC);
const patternParsed = parsePT3Module(patternFixture.buffer);
const decodedPattern = patternParsed.patterns[0];
const normalizedPatternSong = normalizeImportedPT3Data(parsePT3File(patternFixture.buffer), 'pattern-fixture.pt3');
assert(
  normalizedPatternSong.patterns[0].pt3SourceRows?.[3]?.A?.effects[0]?.params.join(',') === '170,187,204',
  'PT3 import normalization must preserve the exact Vortex source map used by note editing.',
);
assert(decodedPattern.numRows === 6, `Channel A/B1 must define a six-row pattern, received ${decodedPattern.numRows}.`);
assert(decodedPattern.rows[0].A.note === 'C-1' && decodedPattern.rows[0].A.instrument === 2 && decodedPattern.rows[0].A.volume === 5, 'A note/sample/volume command decode mismatch.');
assert(decodedPattern.rows[0].B.note === 'C-1' && decodedPattern.rows[0].B.instrument === null && decodedPattern.rows[0].B.volume === null, 'Inherited PT3 selectors must remain blank in a Vortex-style cell.');
assert(decodedPattern.rows[1].A.note === null && decodedPattern.rows[2].A.note === null, 'B1 skipped A rows must remain empty.');
assert(decodedPattern.rows[1].B.note === '===', 'Command 0 inside channel B PTDECOD must be C_NOP, not a pattern terminator.');
assert(decodedPattern.rows[0].C.note === 'C#1' && decodedPattern.rows[0].C.instrument === 3, '0x11 envelope+sample payload alignment mismatch.');
assert(decodedPattern.rows[3].A.note === null, 'Special effect payload after D0 must stay aligned with the next pattern terminator.');
assert(decodedPattern.rows[3].A.instrument === null && decodedPattern.rows[3].A.volume === null, 'A D0-only row must keep channel state without rearming sample or volume.');
const sourceRow0A = decodedPattern.pt3SourceRows?.[0]?.A;
const sourceRow3A = decodedPattern.pt3SourceRows?.[3]?.A;
assert(sourceRow0A?.commandOffset === streamA + 5, `PT3 note source offset mismatch: ${sourceRow0A?.commandOffset}.`);
assert(sourceRow3A?.commandOffset === streamA + 7, `PT3 D0 source offset mismatch: ${sourceRow3A?.commandOffset}.`);
assert(sourceRow3A.effects[0]?.name === 'GLISS', 'Deferred effect command must be exposed to the Vortex-style grid.');
assert(sourceRow3A.effects[0]?.params.join(',') === '170,187,204', `Deferred GLISS payload alignment mismatch: ${sourceRow3A.effects[0]?.params}.`);
assert(sourceRow3A.events.some(event => event.startsWith('GLS ')), 'Decoded row must expose a compact GLISS display command.');
assert(encodePT3SourceNoteCommand('C#4') === 0x75, 'Vortex note encoder mismatch for C#4.');
const noteEditedFixture = Uint8Array.from(patternFixture);
noteEditedFixture[sourceRow3A.commandOffset] = encodePT3SourceNoteCommand('G-2')!;
const noteEdited = parsePT3Module(noteEditedFixture.buffer).patterns[0];
assert(noteEdited.rows[3].A.note === 'G-2', 'In-place source note replacement must reparse as the edited note.');
assert(noteEdited.pt3SourceRows?.[3]?.A?.effects[0]?.params.join(',') === '170,187,204', 'In-place note editing must preserve deferred Vortex effect bytes.');

const semanticPattern = (pattern: typeof decodedPattern) => pattern.rows.map((row, rowIndex) =>
  (['A', 'B', 'C'] as const).map(channel => ({
    note: row[channel].note,
    instrument: row[channel].instrument,
    ornament: row[channel].ornament,
    volume: row[channel].volume,
    effects: pattern.pt3SourceRows?.[rowIndex]?.[channel]?.effects.map(effect => ({
      code: effect.code,
      params: effect.params,
    })) ?? [],
  })),
);
const canonicalBytes = rewritePT3PatternNoteStreams(patternFixture, [decodedPattern]);
const canonicalPattern = parsePT3Module(canonicalBytes.buffer).patterns[0];
assert(
  JSON.stringify(semanticPattern(canonicalPattern)) === JSON.stringify(semanticPattern(decodedPattern)),
  'Canonical PT3 stream rewrite must preserve notes, selections, volume and deferred effects.',
);
const selectorEditedPatterns = [{
  ...canonicalPattern,
  rows: canonicalPattern.rows.map((row, index) => index === 0
    ? {
      ...row,
      A: { ...row.A, instrument: 5, ornament: 2, volume: 9 },
      C: { ...row.C, instrument: 7 },
    }
    : row),
}];
const selectorEditedBytes = rewritePT3PatternNoteStreams(canonicalBytes, selectorEditedPatterns);
const selectorEdited = parsePT3Module(selectorEditedBytes.buffer).patterns[0];
assert(
  selectorEdited.rows[0].A.instrument === 5 && selectorEdited.rows[0].A.ornament === 2 && selectorEdited.rows[0].A.volume === 9,
  'Editable PT3 INS/ORN/VOL fields must be re-encoded as source commands.',
);
assert(selectorEdited.rows[0].C.instrument === 7, 'Instrument editing must replace the sample embedded in an envelope+sample command.');
assert(selectorEdited.pt3SourceRows?.[0]?.C?.events.some(event => event === 'ENV 1:1234'), 'Instrument editing must preserve the combined row envelope command.');
const selectorClearedPatterns = [{
  ...selectorEdited,
  rows: selectorEdited.rows.map((row, index) => index === 0
    ? { ...row, A: { ...row.A, instrument: null, ornament: null, volume: null } }
    : row),
}];
const selectorCleared = parsePT3Module(rewritePT3PatternNoteStreams(selectorEditedBytes, selectorClearedPatterns).buffer).patterns[0];
assert(
  selectorCleared.rows[0].A.instrument === null && selectorCleared.rows[0].A.ornament === null && selectorCleared.rows[0].A.volume === null,
  'Blank PT3 INS/ORN/VOL fields must remove their explicit selector commands and inherit channel state.',
);
const instrumentSeedBase = [{
  ...canonicalPattern,
  rows: canonicalPattern.rows.map((row, index) => index < 3
    ? { ...row, A: { ...row.A, note: null, instrument: null } }
    : row),
}];
const instrumentSeeded = applyPT3SourceNoteEntry({
  patterns: instrumentSeedBase,
  patternIndex: 0,
  order: [0],
  orderIndex: 0,
  rowIndex: 0,
  channel: 'A',
  note: 'D-2',
  activeInstrumentId: 5,
});
assert(
  instrumentSeeded[0].rows[0].A.note === 'D-2' && instrumentSeeded[0].rows[0].A.instrument === 5,
  'A PT3 note with no previous channel instrument must write the active instrument.',
);
const instrumentInherited = applyPT3SourceNoteEntry({
  patterns: instrumentSeeded,
  patternIndex: 0,
  order: [0],
  orderIndex: 0,
  rowIndex: 1,
  channel: 'A',
  note: 'E-2',
  activeInstrumentId: 5,
});
assert(
  instrumentInherited[0].rows[1].A.note === 'E-2' && instrumentInherited[0].rows[1].A.instrument === null,
  'A PT3 note using the inherited channel instrument must keep INS blank.',
);
const instrumentChanged = applyPT3SourceNoteEntry({
  patterns: instrumentSeeded,
  patternIndex: 0,
  order: [0],
  orderIndex: 0,
  rowIndex: 1,
  channel: 'A',
  note: 'E-2',
  activeInstrumentId: 7,
});
assert(
  instrumentChanged[0].rows[1].A.instrument === 7,
  'Selecting a different PT3 instrument must write the new INS on the note row.',
);
const previousOrderPattern = {
  ...instrumentSeeded[0],
  id: 'previous-order-pattern',
  rows: instrumentSeeded[0].rows.map((row, index) => index === instrumentSeeded[0].numRows - 1
    ? { ...row, B: { ...row.B, instrument: 6 } }
    : row),
};
const nextOrderPattern = {
  ...instrumentSeedBase[0],
  id: 'next-order-pattern',
};
const inheritedAcrossOrder = applyPT3SourceNoteEntry({
  patterns: [previousOrderPattern, nextOrderPattern],
  patternIndex: 1,
  order: [0, 1],
  orderIndex: 1,
  rowIndex: 0,
  channel: 'B',
  note: 'F-2',
  activeInstrumentId: 6,
});
assert(
  inheritedAcrossOrder[1].rows[0].B.instrument === null,
  'PT3 note entry must inherit an instrument from the previous ordered pattern.',
);
const changedAcrossOrder = applyPT3SourceNoteEntry({
  patterns: [previousOrderPattern, nextOrderPattern],
  patternIndex: 1,
  order: [0, 1],
  orderIndex: 1,
  rowIndex: 0,
  channel: 'B',
  note: 'F-2',
  activeInstrumentId: 8,
});
assert(
  changedAcrossOrder[1].rows[0].B.instrument === 8,
  'A newly selected PT3 instrument must override the instrument inherited from the previous pattern.',
);
const cutWithoutInstrument = applyPT3SourceNoteEntry({
  patterns: instrumentSeedBase,
  patternIndex: 0,
  order: [0],
  orderIndex: 0,
  rowIndex: 0,
  channel: 'A',
  note: '===',
  activeInstrumentId: 5,
});
assert(cutWithoutInstrument[0].rows[0].A.instrument === null, 'A PT3 note cut must not seed an instrument.');
const heldRowEditedPatterns = [{
  ...canonicalPattern,
  rows: canonicalPattern.rows.map((row, index) => index === 1
    ? { ...row, A: { ...row.A, note: 'D-2' } }
    : row),
}];
const heldRowEditedBytes = rewritePT3PatternNoteStreams(canonicalBytes, heldRowEditedPatterns);
const heldRowEdited = parsePT3Module(heldRowEditedBytes.buffer).patterns[0];
assert(heldRowEdited.rows[1].A.note === 'D-2', 'A note inserted into a compressed hold row must survive the PT3 rewrite.');
const stableHeldRowBytes = rewritePT3PatternNoteStreams(heldRowEditedBytes, [heldRowEdited]);
assert(stableHeldRowBytes.length === heldRowEditedBytes.length, 'Rewriting unchanged edited streams must keep an exactly stable module size.');
const secondEditPatterns = [{
  ...heldRowEdited,
  rows: heldRowEdited.rows.map((row, index) => index === 2
    ? { ...row, C: { ...row.C, note: 'A#3' } }
    : row),
}];
const secondEditBytes = rewritePT3PatternNoteStreams(stableHeldRowBytes, secondEditPatterns);
assert(secondEditBytes.length <= stableHeldRowBytes.length + 3, 'Adding one note must only add its compact PT3 row command, not duplicate the module.');
assert(parsePT3Module(secondEditBytes.buffer).patterns[0].rows[2].C.note === 'A#3', 'A second source-note edit must survive a stable-size rewrite.');
const stableSecondEditBytes = rewritePT3PatternNoteStreams(secondEditBytes, parsePT3Module(secondEditBytes.buffer).patterns);
assert(stableSecondEditBytes.length === secondEditBytes.length, 'A second canonical rewrite must also remain stable in size.');

const realCanonicalBytes = rewritePT3PatternNoteStreams(new Uint8Array(fixtureBuffer), parsed.patterns);
const realCanonical = parsePT3Module(realCanonicalBytes.buffer);
assert(realCanonicalBytes.length <= 0xffff, 'A real canonicalized PT3 must remain addressable by 16-bit source pointers.');
assert(realCanonical.order.join(',') === parsed.order.join(','), 'Real PT3 order list changed during canonical rewrite.');
assert(
  JSON.stringify(realCanonical.patterns.map(semanticPattern)) === JSON.stringify(parsed.patterns.map(semanticPattern)),
  'Real KUVO pattern notes, selections, volume or effects changed during canonical rewrite.',
);
assert(
  realCanonical.instruments.map(instrument => instrument.pt3Sample?.steps.map(step => step.raw.join(',')).join('|')).join('/')
    === parsed.instruments.map(instrument => instrument.pt3Sample?.steps.map(step => step.raw.join(',')).join('|')).join('/'),
  'Canonical pattern rewriting must not alter any real PT3 sample body.',
);
const timedPattern = {
  ...decodedPattern,
  pt3SourceRows: decodedPattern.pt3SourceRows?.map((row, index) => index === 0
    ? {
      ...row,
      A: {
        ...row.A!,
        effects: [{ code: 9, name: 'DELAY' as const, params: [3], display: 'SPD 03' }, ...(row.A?.effects ?? [])],
      },
    }
    : row),
};
const timedSong = { patterns: [timedPattern], order: [0], speed: 8 };
assert(locatePT3PlaybackFrame(timedSong, 2)?.row === 0, 'SPD 03 must keep frame 2 on row 0.');
const cursorAfterSpeedRow = locatePT3PlaybackFrame(timedSong, 3);
assert(cursorAfterSpeedRow?.row === 1 && cursorAfterSpeedRow.speed === 3, 'Playback cursor must follow in-pattern Vortex speed changes at 50 Hz.');

const corruptFixture = Uint8Array.from(fixture);
corruptFixture[107] = 0xff;
corruptFixture[108] = 0xff;
const corruptParsed = parsePT3Module(corruptFixture.buffer);
assert(corruptParsed.warnings.some(warning => warning.includes('Sample 1') && warning.includes('outside')), 'Out-of-range sample pointer was not reported.');

let rejectedShortFile = false;
try {
  parsePT3Module(new Uint8Array(64).buffer);
} catch {
  rejectedShortFile = true;
}
assert(rejectedShortFile, 'Headerless/short input must be rejected.');

console.log('PT3 phase A+B parser/decoder checks passed.');
