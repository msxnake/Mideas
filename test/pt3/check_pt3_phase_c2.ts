import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import {
  renderPT3ChannelFrames,
  type PT3PreviewFrameInput,
} from '../../components/utils/pt3PreviewDriver';
import type { PT3Ornament } from '../../types';
import { createSeparatedCowbellAYChip } from '../../components/utils/cowbellPt3Player';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fixturePath = resolve(process.cwd(), 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3');
const fixture = readFileSync(fixturePath);
const parsed = parsePT3Module(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer);
const kick = parsed.instruments.find(instrument => instrument.id === 4);
assert(kick?.pt3Sample, 'KUVO percussion sample 4 is missing.');

const kickStart: PT3PreviewFrameInput = {
  channels: [{ note: 'C-4', instrumentId: 4, volume: 15 }, undefined, undefined],
};
const captured: number[][] = [];
const kickStream = renderPT3ChannelFrames({
  instruments: [kick],
  ornaments: parsed.ornaments,
  noiseBase: 10,
  envelopePeriodBase: 0x1234,
  envelopeShape: 0x0b,
  frameCount: 4,
  frameInputs: [kickStart],
  onFrame: frame => captured.push([...frame.registers]),
});

assert(kickStream.channelPositions.map(position => position[0]).join(',') === '0,1,2,3', `KUVO sample positions mismatch: ${kickStream.channelPositions}`);
assert(kickStream.frames.map(frame => frame.registers[6]).join(',') === '13,13,16,17', 'KUVO R6 sequence mismatch.');
assert(kickStream.frames.map(frame => frame.registers[7]).join(',') === '182,190,182,182', 'KUVO R7 mixer sequence mismatch.');
assert(captured.length === 4 && captured.every((registers, index) => registers.join(',') === kickStream.frames[index].registers.join(',')), 'Capture hook must observe the exact output stream.');

// Frame 1 takes the envelope path. AddToNs=3 from frame 0 must remain visible in R6.
assert(kickStream.frames[0].noiseAddState === 3 && kickStream.frames[1].noiseAddState === 3, 'noiseAddState must persist through a frame without a noise request.');

// A fresh render is PT3_INIT/restart: AddToNs and all channel-local sample state reset.
const restarted = renderPT3ChannelFrames({
  instruments: [kick],
  ornaments: parsed.ornaments,
  noiseBase: 10,
  envelopePeriodBase: 0x1234,
  envelopeShape: 0x0b,
  frameCount: 2,
  frameInputs: [kickStart],
});
assert(restarted.channelPositions.map(position => position[0]).join(',') === '0,1', 'Restart must begin the sample at position 0.');
assert(restarted.frames[0].registers.join(',') === kickStream.frames[0].registers.join(','), 'Restart must reproduce a clean first AY frame.');

// A new note-on while the sample is running resets every channel-local accumulator.
const retriggered = renderPT3ChannelFrames({
  instruments: [kick],
  noiseBase: 10,
  frameCount: 3,
  frameInputs: [kickStart, {}, kickStart],
});
assert(retriggered.channelPositions.map(position => position[0]).join(',') === '0,1,0', 'Note-on must cut and restart the in-flight sample.');
assert(retriggered.frames[0].registers.join(',') === retriggered.frames[2].registers.join(','), 'Retriggered frame must match the original note-on frame byte-for-byte.');

// Ornament offsets are relative to the base note and clamp before table lookup.
const clampOrnament: PT3Ornament = { id: 15, name: 'Clamp probe', data: [-99, 99], loopPosition: 0 };
const toneOnly = parsed.instruments.find(instrument => instrument.id === 5);
assert(toneOnly?.pt3Sample, 'KUVO tone-only sample 5 is missing.');
const ornamentStream = renderPT3ChannelFrames({
  instruments: [toneOnly],
  ornaments: [clampOrnament],
  frameCount: 2,
  frameInputs: [{ channels: [{ note: 'C-4', instrumentId: 5, ornamentId: 15 }, undefined, undefined] }],
});
assert(ornamentStream.frames[0].registers[0] === 0xff && ornamentStream.frames[0].registers[1] === 0x0f, 'Low ornament clamp must select note 0 / period 0x0fff.');
assert(ornamentStream.frames[1].registers[0] === 28 && ornamentStream.frames[1].registers[1] === 0, 'High ornament clamp must select note 95 / Mideas period 28.');

// Cowbell source-faithful playback must preserve independent AY voices and
// exclude muted voices from the final stereo mix.
class FakeAYChip {
  private readonly registers = new Uint8Array(14);
  public setRegister(register: number, value: number): void {
    this.registers[register] = value;
  }
  public generate(buffer: AudioBuffer, offset: number, length: number): void {
    const signal = this.registers[8] + this.registers[9] + this.registers[10];
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let index = offset; index < offset + length; index += 1) {
      left[index] = signal;
      right[index] = signal * 10;
    }
  }
}
const mutedCowbellChannels = new Set<number>();
const capturedCowbellChannels = [0, 0, 0];
const separatedChip = createSeparatedCowbellAYChip(
  FakeAYChip,
  {},
  channelIndex => mutedCowbellChannels.has(channelIndex),
  (channelIndex, left, _right, offset) => { capturedCowbellChannels[channelIndex] = left[offset]; },
);
separatedChip.setRegister(8, 1);
separatedChip.setRegister(9, 2);
separatedChip.setRegister(10, 3);
const makeFakeAudioBuffer = (): AudioBuffer => {
  const channels = [new Float32Array(4), new Float32Array(4)];
  return {
    length: 4,
    numberOfChannels: 2,
    getChannelData: channelIndex => channels[channelIndex],
  } as AudioBuffer;
};
const completeCowbellMix = makeFakeAudioBuffer();
separatedChip.generate(completeCowbellMix, 0, 4);
assert(capturedCowbellChannels.join(',') === '1,2,3', `Cowbell channel capture must be independent: ${capturedCowbellChannels}`);
assert(completeCowbellMix.getChannelData(0)[0] === 6, 'Cowbell unmuted mix must contain A+B+C.');
mutedCowbellChannels.add(1);
const mutedCowbellMix = makeFakeAudioBuffer();
separatedChip.generate(mutedCowbellMix, 0, 4);
assert(mutedCowbellMix.getChannelData(0)[0] === 4, 'Cowbell mute must remove only channel B from the mix.');
mutedCowbellChannels.add(0);
mutedCowbellChannels.add(2);
const silentCowbellMix = makeFakeAudioBuffer();
separatedChip.generate(silentCowbellMix, 0, 4);
assert(silentCowbellMix.getChannelData(0)[0] === 0 && silentCowbellMix.getChannelData(1)[0] === 0, 'Muting A+B+C must silence Cowbell output.');

console.log('PT3 phase C2 headless preview driver checks passed.');
