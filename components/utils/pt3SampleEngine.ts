import { PT3SampleMacro, PT3SampleStep } from '../../types';

export interface PT3SampleChannelState {
  position: number;
  toneAccumulator: number;
  amplitudeSlide: number;
  noiseAccumulator: number;
  envelopeAccumulator: number;
}

export interface PT3SampleTickOutput {
  position: number;
  volume: number;
  amplitude: number;
  tonePeriodDelta: number;
  noiseOrEnvelopeDelta: number;
  /** Which AY-global resource noiseOrEnvelopeDelta targets. The frame reducer
   *  must apply 'noise' as last-wins (A→B→C) and 'envelope' as a cross-channel sum. */
  globalTarget: 'noise' | 'envelope';
  toneEnabled: boolean;
  noiseEnabled: boolean;
  hardwareEnvelopeEnabled: boolean;
}

const wrapSigned8 = (value: number): number => {
  const wrapped = value & 0xff;
  return wrapped >= 0x80 ? wrapped - 0x100 : wrapped;
};

const wrapSigned16 = (value: number): number => {
  const wrapped = value & 0xffff;
  return wrapped >= 0x8000 ? wrapped - 0x10000 : wrapped;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const signed5 = (value: number): number => {
  const masked = value & 0x1f;
  return (masked & 0x10) !== 0 ? masked - 0x20 : masked;
};

/** Decode one native four-byte PT3 sample line (C, B, toneLo, toneHi). */
export const decodePT3SampleStep = (raw: ArrayLike<number>): PT3SampleStep => {
  if (raw.length !== 4) throw new Error(`PT3 sample step must contain exactly 4 bytes; received ${raw.length}.`);
  const c = raw[0] & 0xff;
  const b = raw[1] & 0xff;
  const toneWord = (raw[2] & 0xff) | ((raw[3] & 0xff) << 8);
  // The replayer selects the meaning of the 5-bit field with the noise mask
  // (BIT 7,B): noise masked off -> envelope slide, noise active -> noise offset.
  // The per-tick envelope enable (bit 0 of C) is independent of this choice.
  const noiseEnabled = (b & 0x80) === 0;

  return {
    raw: [c, b, raw[2] & 0xff, raw[3] & 0xff],
    volume: b & 0x0f,
    amplitudeSlide: (c & 0x80) === 0 ? 0 : ((c & 0x40) !== 0 ? 1 : -1),
    tonePeriodOffset: wrapSigned16(toneWord),
    accumulateTone: (b & 0x40) !== 0,
    toneEnabled: (b & 0x10) === 0,
    noiseEnabled,
    hardwareEnvelopeEnabled: (c & 0x01) === 0,
    // Noise keeps the full 7 bits of C>>1 (RRA in the replayer): bits 5-6 carry
    // the amplitude-slide flags and reach the unmasked R6 write byte-for-byte.
    noiseOrEnvelopeOffset: noiseEnabled ? ((c >> 1) & 0x7f) : signed5(c >> 1),
    accumulateNoiseOrEnvelope: (b & 0x20) !== 0,
  };
};

/** Build the exact 16x16 PT3 volume multiplication table created by the reference replayer. */
export const buildPT3VolumeTable = (): Uint8Array => {
  const table = new Uint8Array(256);
  let base = 0x0011;
  let delta = 0;
  let index = 16;

  for (let channelVolume = 1; channelVolume <= 15; channelVolume += 1) {
    delta = (delta + base) & 0xffff;
    let accumulator = 0;
    for (let sampleVolume = 0; sampleVolume < 16; sampleVolume += 1) {
      table[index++] = ((accumulator + 0x80) >>> 8) & 0xff;
      accumulator = (accumulator + delta) & 0xffff;
    }
    if ((delta & 0xff) === 0x77) delta = (delta + 1) & 0xffff;
  }

  return table;
};

export const PT3_VOLUME_TABLE = buildPT3VolumeTable();

export const createPT3SampleChannelState = (): PT3SampleChannelState => ({
  position: 0,
  toneAccumulator: 0,
  amplitudeSlide: 0,
  noiseAccumulator: 0,
  envelopeAccumulator: 0,
});

/**
 * Advance one PT3 sample tick. This is deliberately channel-local; AY-global
 * noise/envelope arbitration belongs to the frame reducer used by Preview/ASM.
 */
export const stepPT3SampleMacro = (
  macro: PT3SampleMacro,
  state: PT3SampleChannelState,
  channelVolume: number,
): PT3SampleTickOutput => {
  if (macro.steps.length === 0) throw new Error('Cannot step an empty PT3 sample macro.');
  const position = clamp(state.position, 0, macro.steps.length - 1);
  const step = macro.steps[position];

  state.amplitudeSlide = clamp(state.amplitudeSlide + step.amplitudeSlide, -15, 15);
  const sampleVolume = clamp(step.volume + state.amplitudeSlide, 0, 15);
  const normalizedChannelVolume = clamp(Math.trunc(channelVolume), 0, 15);
  const amplitude = PT3_VOLUME_TABLE[(normalizedChannelVolume << 4) | sampleVolume];

  const tonePeriodDelta = wrapSigned16(state.toneAccumulator + step.tonePeriodOffset);
  if (step.accumulateTone) state.toneAccumulator = tonePeriodDelta;

  let noiseOrEnvelopeDelta: number;
  const globalTarget: 'noise' | 'envelope' = step.noiseEnabled ? 'noise' : 'envelope';
  if (globalTarget === 'envelope') {
    const sum = state.envelopeAccumulator + step.noiseOrEnvelopeOffset;
    noiseOrEnvelopeDelta = macro.envelopeSlideMode === 'corrected-16bit' ? wrapSigned16(sum) : wrapSigned8(sum);
    if (step.accumulateNoiseOrEnvelope) state.envelopeAccumulator = noiseOrEnvelopeDelta;
  } else {
    noiseOrEnvelopeDelta = wrapSigned8(state.noiseAccumulator + step.noiseOrEnvelopeOffset);
    if (step.accumulateNoiseOrEnvelope) state.noiseAccumulator = noiseOrEnvelopeDelta;
  }

  const nextPosition = position + 1;
  state.position = nextPosition >= macro.steps.length ? clamp(macro.loop, 0, macro.steps.length - 1) : nextPosition;

  return {
    position,
    volume: sampleVolume,
    amplitude,
    tonePeriodDelta,
    noiseOrEnvelopeDelta,
    globalTarget,
    toneEnabled: step.toneEnabled,
    noiseEnabled: step.noiseEnabled,
    hardwareEnvelopeEnabled: step.hardwareEnvelopeEnabled,
  };
};
