import type { PT3EnvelopeSlideMode } from '../../types';
import type { PT3SampleTickOutput } from './pt3SampleEngine';

export type PT3FrameChannelOutput = PT3SampleTickOutput | null;

/** Channel order is significant: PT3 resolves AY-global requests A -> B -> C. */
export type PT3FrameChannels = readonly [
  PT3FrameChannelOutput,
  PT3FrameChannelOutput,
  PT3FrameChannelOutput,
];

export interface AyFrameSongState {
  /** Base AY tone periods for channels A, B and C. */
  tonePeriods: readonly [number, number, number];
  noiseBase: number;
  envelopePeriodBase: number;
  envelopeShape: number;
  /** Writing R13 retriggers the hardware envelope, so value and policy are separate. */
  retriggerEnvelopeShape: boolean;
  /** Imported PT3 modules use the original replayer's 8-bit AddToEn behavior. */
  envelopeSlideMode?: PT3EnvelopeSlideMode;
  /** AddToNs persisted from the previous frame. Unlike AddToEn (cleared every
   *  PT3_PLAY), the replayer never resets it, so frames where no channel takes
   *  the noise path keep contributing the stale value to R6. */
  noiseAddState?: number;
}

export type AyRegisterFrame = [
  number, number, number, number, number, number, number,
  number, number, number, number, number, number, number,
];

export interface AyFrameOutput {
  /** Byte-exact values for AY registers R0 through R13. */
  registers: AyRegisterFrame;
  /** False means R13 must be skipped even though registers[13] carries its value. */
  writeRegister13: boolean;
  /** AddToNs after this frame; feed it back as song.noiseAddState next frame. */
  noiseAddState: number;
}

const toByte = (value: number): number => value & 0xff;

const wrapSigned8 = (value: number): number => {
  const wrapped = value & 0xff;
  return wrapped >= 0x80 ? wrapped - 0x100 : wrapped;
};

const wrapSigned16 = (value: number): number => {
  const wrapped = value & 0xffff;
  return wrapped >= 0x8000 ? wrapped - 0x10000 : wrapped;
};

const addEnvelopeDelta = (
  accumulated: number,
  delta: number,
  mode: PT3EnvelopeSlideMode,
): number => mode === 'pt3-legacy-8bit'
  ? wrapSigned8(accumulated + delta)
  : wrapSigned16(accumulated + delta);

/**
 * Reduce three channel-local PT3 sample ticks into one AY register frame.
 *
 * This module intentionally has no playback, Preview or ASM dependencies. It
 * mirrors the reference replayer's global-resource rules: noise is last-wins,
 * envelope deltas add together, and R13 is only written on an explicit trigger.
 */
export const reducePT3SampleTicksToAyFrame = (
  channels: PT3FrameChannels,
  song: AyFrameSongState,
): AyFrameOutput => {
  const mode = song.envelopeSlideMode ?? 'pt3-legacy-8bit';
  let noiseDelta = song.noiseAddState ?? 0;
  let envelopeDelta = 0;

  // The loop order is the arbitration rule. A later noise request overwrites an
  // earlier one; envelope requests instead accumulate in the same A -> B -> C order.
  for (const channel of channels) {
    if (!channel) continue;
    if (channel.globalTarget === 'noise') {
      noiseDelta = channel.noiseOrEnvelopeDelta;
    } else {
      envelopeDelta = addEnvelopeDelta(envelopeDelta, channel.noiseOrEnvelopeDelta, mode);
    }
  }

  const tonePeriods = channels.map((channel, index) => (
    song.tonePeriods[index] + (channel?.tonePeriodDelta ?? 0)
  ) & 0xffff);
  const envelopePeriod = (song.envelopePeriodBase + envelopeDelta) & 0xffff;

  // The reference MSX output routine forces R7 bit 7 on and bit 6 off before
  // flushing AYREGS. Bits 0..5 are rebuilt from the three channel outputs.
  let mixer = 0x80;
  channels.forEach((channel, index) => {
    if (!channel?.toneEnabled) mixer |= 1 << index;
    if (!channel?.noiseEnabled) mixer |= 1 << (index + 3);
  });

  const amplitudes = channels.map(channel => {
    if (!channel) return 0;
    return (channel.amplitude & 0x0f) | (channel.hardwareEnvelopeEnabled ? 0x10 : 0);
  });

  return {
    registers: [
      toByte(tonePeriods[0]), toByte(tonePeriods[0] >>> 8),
      toByte(tonePeriods[1]), toByte(tonePeriods[1] >>> 8),
      toByte(tonePeriods[2]), toByte(tonePeriods[2] >>> 8),
      toByte(song.noiseBase + noiseDelta),
      mixer,
      amplitudes[0], amplitudes[1], amplitudes[2],
      toByte(envelopePeriod), toByte(envelopePeriod >>> 8),
      toByte(song.envelopeShape),
    ],
    writeRegister13: song.retriggerEnvelopeShape,
    noiseAddState: noiseDelta,
  };
};
