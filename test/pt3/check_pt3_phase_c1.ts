import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  reducePT3SampleTicksToAyFrame,
  type AyFrameSongState,
  type PT3FrameChannels,
} from '../../components/utils/ayFrameReducer';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import {
  createPT3SampleChannelState,
  decodePT3SampleStep,
  stepPT3SampleMacro,
  type PT3SampleTickOutput,
} from '../../components/utils/pt3SampleEngine';
import type { PT3SampleMacro } from '../../types';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sameBytes = (actual: readonly number[], expected: readonly number[], label: string): void => {
  assert(actual.length === expected.length, `${label}: register count mismatch.`);
  assert(actual.every((value, index) => value === expected[index]), `${label}: ${actual.join(',')} !== ${expected.join(',')}`);
};

const tick = (overrides: Partial<PT3SampleTickOutput> = {}): PT3SampleTickOutput => ({
  position: 0,
  volume: 15,
  amplitude: 15,
  tonePeriodDelta: 0,
  noiseOrEnvelopeDelta: 0,
  globalTarget: 'noise',
  toneEnabled: true,
  noiseEnabled: true,
  hardwareEnvelopeEnabled: false,
  ...overrides,
});

const song = (overrides: Partial<AyFrameSongState> = {}): AyFrameSongState => ({
  tonePeriods: [0x0100, 0x0200, 0x0300],
  noiseBase: 0x20,
  envelopePeriodBase: 0x1000,
  envelopeShape: 0x0b,
  retriggerEnvelopeShape: false,
  envelopeSlideMode: 'pt3-legacy-8bit',
  ...overrides,
});

// Noise is a byte-exact, last-wins AY-global request in A -> B -> C order.
const noiseRace = reducePT3SampleTicksToAyFrame([
  tick({ noiseOrEnvelopeDelta: 7 }),
  null,
  tick({ noiseOrEnvelopeDelta: 0x35 }),
], song({ noiseBase: 0xf0 }));
assert(noiseRace.registers[6] === 0x25, `Channel C must win the noise race with byte wrap: ${noiseRace.registers[6]}`);

// AddToNs persists across frames (PT3_PLAY only clears AddToEn, never AddToNs):
// a frame with no noise-path channel must keep the previous frame's R6 addend.
const staleFrame1 = reducePT3SampleTicksToAyFrame([
  tick({ noiseOrEnvelopeDelta: 5 }),
  null,
  null,
], song({ noiseBase: 0x10 }));
assert(staleFrame1.registers[6] === 0x15 && staleFrame1.noiseAddState === 5, 'Frame 1 must expose its AddToNs state.');
const staleFrame2 = reducePT3SampleTicksToAyFrame([
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: 0 }),
  null,
  null,
], song({ noiseBase: 0x10, noiseAddState: staleFrame1.noiseAddState }));
assert(staleFrame2.registers[6] === 0x15, `Stale AddToNs must survive noise-less frames: ${staleFrame2.registers[6]}`);
const staleFrame3 = reducePT3SampleTicksToAyFrame([
  null,
  tick({ noiseOrEnvelopeDelta: 2 }),
  null,
], song({ noiseBase: 0x10, noiseAddState: staleFrame2.noiseAddState }));
assert(staleFrame3.registers[6] === 0x12 && staleFrame3.noiseAddState === 2, 'A fresh noise request must overwrite the stale AddToNs.');

// Envelope requests sum; imported PT3 behavior wraps AddToEn after every channel.
const envelopeSum = reducePT3SampleTicksToAyFrame([
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: 100 }),
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: 60 }),
  null,
], song({ envelopePeriodBase: 0x0100 }));
assert(envelopeSum.registers[11] === 0xa0 && envelopeSum.registers[12] === 0x00, 'Legacy envelope sum must wrap to signed -96 before 16-bit base addition.');

const correctedEnvelopeSum = reducePT3SampleTicksToAyFrame([
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: 200 }),
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: 100 }),
  null,
], song({ envelopePeriodBase: 0, envelopeSlideMode: 'corrected-16bit' }));
assert(correctedEnvelopeSum.registers[11] === 0x2c && correctedEnvelopeSum.registers[12] === 0x01, 'Corrected envelope sum must preserve the 16-bit result 300.');

// Noise and envelope globals are independent when requested by different channels.
const mixedGlobals = reducePT3SampleTicksToAyFrame([
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: -5 }),
  tick({ globalTarget: 'noise', noiseOrEnvelopeDelta: 9 }),
  tick({ globalTarget: 'envelope', noiseEnabled: false, noiseOrEnvelopeDelta: 2 }),
], song({ noiseBase: 4, envelopePeriodBase: 0x0200 }));
assert(mixedGlobals.registers[6] === 13, `Mixed frame noise mismatch: ${mixedGlobals.registers[6]}`);
assert(mixedGlobals.registers[11] === 0xfd && mixedGlobals.registers[12] === 0x01, 'Mixed frame envelope sum must be -3.');

// The decoder's deliberately polluted seven-bit noise offset must survive into R6.
const pollutedMacro: PT3SampleMacro = {
  loop: 0,
  envelopeSlideMode: 'pt3-legacy-8bit',
  steps: [decodePT3SampleStep([0xc1, 0x0e, 0x00, 0x00])],
};
const pollutedTick = stepPT3SampleMacro(pollutedMacro, createPT3SampleChannelState(), 15);
const pollutedFrame = reducePT3SampleTicksToAyFrame([pollutedTick, null, null], song({ noiseBase: 0x12 }));
assert(pollutedFrame.registers[6] === 0x72, `R6 must retain the full 0x60 offset: ${pollutedFrame.registers[6]}`);

// R13 always carries the shape value, but only an explicit trigger authorizes a write.
const noRetrigger = reducePT3SampleTicksToAyFrame([null, null, null], song({ envelopeShape: 0x0d }));
const retrigger = reducePT3SampleTicksToAyFrame([null, null, null], song({ envelopeShape: 0x0d, retriggerEnvelopeShape: true }));
assert(noRetrigger.registers[13] === 0x0d && !noRetrigger.writeRegister13, 'R13 must be skipped without a retrigger.');
assert(retrigger.registers[13] === 0x0d && retrigger.writeRegister13, 'R13 must be written on retrigger.');

// Mixer bits and amplitude-envelope bit are reconstructed solely from channel outputs.
const mixerFrame = reducePT3SampleTicksToAyFrame([
  tick({ toneEnabled: true, noiseEnabled: false, hardwareEnvelopeEnabled: true, amplitude: 6, globalTarget: 'envelope' }),
  tick({ toneEnabled: false, noiseEnabled: true, amplitude: 9 }),
  null,
], song());
assert(mixerFrame.registers[7] === 0xae, `R7 mixer mismatch: ${mixerFrame.registers[7].toString(16)}`);
assert(mixerFrame.registers[8] === 0x16 && mixerFrame.registers[9] === 9 && mixerFrame.registers[10] === 0, 'Amplitude/envelope-bit reduction mismatch.');

// A fixed three-channel frame from the real KUVO fixture guards the complete mapping.
const fixturePath = resolve(process.cwd(), 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3');
const fixture = readFileSync(fixturePath);
const parsed = parsePT3Module(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer);
const sampleIds = [1, 2, 4] as const;
const fixtureTicks = sampleIds.map(sampleId => {
  const macro = parsed.instruments.find(instrument => instrument.id === sampleId)?.pt3Sample;
  assert(macro, `KUVO sample ${sampleId} is missing.`);
  return stepPT3SampleMacro(macro, createPT3SampleChannelState(), 15);
});
const fixtureChannels: PT3FrameChannels = [fixtureTicks[0], fixtureTicks[1], fixtureTicks[2]];
const kuvoFrame = reducePT3SampleTicksToAyFrame(fixtureChannels, song({
  tonePeriods: [1000, 500, 250],
  noiseBase: 10,
  envelopePeriodBase: 0x1234,
}));
sameBytes(
  kuvoFrame.registers,
  [0xe8, 0x03, 0xf4, 0x01, 0x3a, 0x01, 0x0d, 0x98, 15, 15, 15, 0x34, 0x12, 0x0b],
  'KUVO three-channel frame',
);
assert(!kuvoFrame.writeRegister13, 'KUVO frame must not retrigger R13 without a pattern command.');

console.log('PT3 phase C1 AY frame reducer checks passed.');
