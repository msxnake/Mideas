import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import {
  PT3_VOLUME_TABLE,
  createPT3SampleChannelState,
  decodePT3SampleStep,
  stepPT3SampleMacro,
} from '../../components/utils/pt3SampleEngine';
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
