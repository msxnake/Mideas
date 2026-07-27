import { PT3_NOTE_NAMES } from '../../constants';
import type { PT3EnvelopeSlideMode, PT3Instrument, PT3Ornament } from '../../types';
import type { AyFrameOutput, PT3FrameChannels } from './ayFrameReducer';
import { reducePT3SampleTicksToAyFrame } from './ayFrameReducer';
import { getFrequencyForNoteString } from './noteFrequencies';
import {
  createPT3SampleChannelState,
  stepPT3SampleMacro,
  type PT3SampleChannelState,
  type PT3SampleTickOutput,
} from './pt3SampleEngine';

const AY_CLOCK_FREQUENCY = 3579545 / 2;
const CHANNEL_COUNT = 3;

export const MIDEAS_AY_NOTE_PERIODS: readonly number[] = Array.from({ length: 96 }, (_, noteIndex) => {
  const noteName = `${PT3_NOTE_NAMES[noteIndex % 12]}${Math.floor(noteIndex / 12)}`;
  const frequency = getFrequencyForNoteString(noteName);
  if (frequency === null || frequency <= 0) throw new Error(`Missing Mideas frequency for ${noteName}.`);
  return Math.max(1, Math.min(0x0fff, Math.round(AY_CLOCK_FREQUENCY / (16 * frequency))));
});

export interface PT3PreviewChannelCommand {
  /** A real note is note-on; null/undefined/'---' keeps state; '===' cuts. */
  note?: string | null;
  /** null/undefined keeps the current sample, 0 clears it. */
  instrumentId?: number | null;
  /** null/undefined keeps the current ornament, 0 clears it. */
  ornamentId?: number | null;
  /** null/undefined keeps the current volume. */
  volume?: number | null;
  /** Vortex C_SMPOS: set the next PT3 sample macro line. */
  samplePosition?: number | null;
  /** Vortex C_ORPOS: set the next ornament line. */
  ornamentPosition?: number | null;
}

export type PT3PreviewFrameCommands = readonly [
  PT3PreviewChannelCommand | undefined,
  PT3PreviewChannelCommand | undefined,
  PT3PreviewChannelCommand | undefined,
];

export interface PT3PreviewFrameInput {
  channels?: PT3PreviewFrameCommands;
  /** Pattern-level SETENV equivalent when available. */
  retriggerEnvelopeShape?: boolean;
  envelopeShape?: number;
}

export interface PT3PreviewDriverConfig {
  instruments: readonly PT3Instrument[];
  ornaments?: readonly PT3Ornament[];
  noiseBase?: number;
  envelopePeriodBase?: number;
  envelopeShape?: number;
  envelopeSlideMode?: PT3EnvelopeSlideMode;
}

export interface PT3PreviewChannelState {
  instrumentId: number | null;
  baseNote: number | null;
  volume: number;
  ornamentId: number | null;
  ornamentPosition: number;
  sampleState: PT3SampleChannelState | null;
  keyOn: boolean;
  /** Source sample line consumed in the most recent frame. */
  lastSamplePosition: number | null;
}

export interface PT3PreviewDriverState {
  channels: [PT3PreviewChannelState, PT3PreviewChannelState, PT3PreviewChannelState];
  /** Persistent PT3 AddToNs byte/signed-byte representation. */
  noiseAddState: number;
}

export interface PT3PreviewStepResult {
  state: PT3PreviewDriverState;
  frame: AyFrameOutput;
  channelTicks: PT3FrameChannels;
}

export interface RenderPT3ChannelFramesOptions extends PT3PreviewDriverConfig {
  frameCount: number;
  frameInputs?: readonly PT3PreviewFrameInput[];
  /** Phase-E trace hook. It observes exactly the frame returned in frames[index]. */
  onFrame?: (frame: AyFrameOutput, index: number) => void;
}

export interface RenderPT3ChannelFramesResult {
  frames: AyFrameOutput[];
  channelPositions: [number | null, number | null, number | null][];
  finalState: PT3PreviewDriverState;
}

const createChannelState = (): PT3PreviewChannelState => ({
  instrumentId: null,
  baseNote: null,
  volume: 15,
  ornamentId: null,
  ornamentPosition: 0,
  sampleState: null,
  keyOn: false,
  lastSamplePosition: null,
});

export const createPT3PreviewDriverState = (): PT3PreviewDriverState => ({
  channels: [createChannelState(), createChannelState(), createChannelState()],
  noiseAddState: 0,
});

const cloneDriverState = (state: PT3PreviewDriverState): PT3PreviewDriverState => ({
  channels: state.channels.map(channel => ({
    ...channel,
    sampleState: channel.sampleState ? { ...channel.sampleState } : null,
  })) as PT3PreviewDriverState['channels'],
  noiseAddState: state.noiseAddState,
});

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const getMideasNoteIndex = (note: string): number | null => {
  const match = note.trim().toUpperCase().match(/^([A-G])([#-]?)([0-7])$/);
  if (!match) return null;
  const name = `${match[1]}${match[2] === '#' ? '#' : '-'}`;
  const noteInOctave = PT3_NOTE_NAMES.indexOf(name);
  if (noteInOctave < 0) return null;
  return (Number(match[3]) * 12) + noteInOctave;
};

const nextOrnamentPosition = (ornament: PT3Ornament, position: number): number => {
  const next = position + 1;
  if (next < ornament.data.length) return next;
  if (ornament.loopPosition !== undefined && ornament.loopPosition >= 0 && ornament.loopPosition < ornament.data.length) {
    return ornament.loopPosition;
  }
  return Math.max(0, ornament.data.length - 1);
};

const resolveEnvelopeMode = (
  config: PT3PreviewDriverConfig,
  activeInstruments: readonly PT3Instrument[],
): PT3EnvelopeSlideMode => {
  if (config.envelopeSlideMode) return config.envelopeSlideMode;
  return activeInstruments.some(instrument => instrument.pt3Sample?.envelopeSlideMode === 'pt3-legacy-8bit')
    ? 'pt3-legacy-8bit'
    : 'corrected-16bit';
};

export const stepPT3PreviewFrame = (
  previousState: PT3PreviewDriverState,
  config: PT3PreviewDriverConfig,
  input: PT3PreviewFrameInput = {},
): PT3PreviewStepResult => {
  const state = cloneDriverState(previousState);
  const instrumentById = new Map(config.instruments.map(instrument => [instrument.id, instrument]));
  const ornamentById = new Map((config.ornaments ?? []).map(ornament => [ornament.id, ornament]));
  const commands = input.channels ?? [undefined, undefined, undefined];
  let envelopeShape = input.envelopeShape ?? config.envelopeShape ?? 0;
  let retriggerEnvelopeShape = input.retriggerEnvelopeShape ?? false;

  for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex++) {
    const channel = state.channels[channelIndex];
    const command = commands[channelIndex];
    if (!command) continue;

    if (command.instrumentId !== null && command.instrumentId !== undefined) {
      channel.instrumentId = command.instrumentId > 0 ? command.instrumentId : null;
      if (channel.instrumentId === null) {
        channel.keyOn = false;
        channel.sampleState = null;
      }
    }
    if (command.ornamentId !== null && command.ornamentId !== undefined) {
      channel.ornamentId = command.ornamentId > 0 ? command.ornamentId : null;
      channel.ornamentPosition = 0;
    }
    if (command.volume !== null && command.volume !== undefined) {
      channel.volume = clamp(Math.trunc(command.volume), 0, 15);
    }

    if (command.note === '===') {
      channel.keyOn = false;
      channel.baseNote = null;
      channel.sampleState = null;
      channel.lastSamplePosition = null;
      continue;
    }

    if (command.note && command.note !== '---') {
      const noteIndex = getMideasNoteIndex(command.note);
      if (noteIndex === null) throw new Error(`Invalid Mideas tracker note: ${command.note}`);
      const instrument = channel.instrumentId !== null ? instrumentById.get(channel.instrumentId) : undefined;
      channel.baseNote = noteIndex;
      channel.ornamentPosition = 0;
      channel.sampleState = createPT3SampleChannelState();
      channel.keyOn = !!instrument?.pt3Sample && instrument.instrumentMode === 'pt3-sample';
      channel.lastSamplePosition = null;
      if (command.volume === null || command.volume === undefined) channel.volume = 15;
      if (instrument?.ayEnvelopeShape !== undefined) {
        envelopeShape = instrument.ayEnvelopeShape;
        retriggerEnvelopeShape = true;
      }
    }

    // Deferred Vortex commands execute after note-on reset (PD_RES).
    if (command.samplePosition !== null && command.samplePosition !== undefined && channel.sampleState) {
      channel.sampleState.position = Math.max(0, Math.trunc(command.samplePosition));
    }
    if (command.ornamentPosition !== null && command.ornamentPosition !== undefined) {
      channel.ornamentPosition = Math.max(0, Math.trunc(command.ornamentPosition));
    }
  }

  const tonePeriods: [number, number, number] = [0, 0, 0];
  const channelTicks: [PT3SampleTickOutput | null, PT3SampleTickOutput | null, PT3SampleTickOutput | null] = [null, null, null];
  const activeInstruments: PT3Instrument[] = [];

  for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex++) {
    const channel = state.channels[channelIndex];
    const instrument = channel.instrumentId !== null ? instrumentById.get(channel.instrumentId) : undefined;
    const macro = instrument?.instrumentMode === 'pt3-sample' ? instrument.pt3Sample : undefined;
    if (!channel.keyOn || channel.baseNote === null || !macro || !channel.sampleState) {
      channel.lastSamplePosition = null;
      continue;
    }

    const ornament = channel.ornamentId !== null ? ornamentById.get(channel.ornamentId) : undefined;
    const ornamentOffset = ornament?.data.length
      ? (ornament.data[clamp(channel.ornamentPosition, 0, ornament.data.length - 1)] ?? 0)
      : 0;
    const effectiveNote = clamp(channel.baseNote + ornamentOffset, 0, 95);
    tonePeriods[channelIndex] = MIDEAS_AY_NOTE_PERIODS[effectiveNote];
    const tick = stepPT3SampleMacro(macro, channel.sampleState, channel.volume);
    channelTicks[channelIndex] = tick;
    channel.lastSamplePosition = tick.position;
    activeInstruments.push(instrument);

    if (ornament?.data.length) {
      channel.ornamentPosition = nextOrnamentPosition(ornament, channel.ornamentPosition);
    }
  }

  const frame = reducePT3SampleTicksToAyFrame(channelTicks, {
    tonePeriods,
    noiseBase: config.noiseBase ?? 0,
    envelopePeriodBase: config.envelopePeriodBase ?? 1,
    envelopeShape,
    retriggerEnvelopeShape,
    envelopeSlideMode: resolveEnvelopeMode(config, activeInstruments),
    noiseAddState: state.noiseAddState,
  });
  state.noiseAddState = frame.noiseAddState;

  return { state, frame, channelTicks };
};

export const renderPT3ChannelFrames = (
  options: RenderPT3ChannelFramesOptions,
): RenderPT3ChannelFramesResult => {
  const frameCount = Math.max(0, Math.trunc(options.frameCount));
  let state = createPT3PreviewDriverState();
  const frames: AyFrameOutput[] = [];
  const channelPositions: RenderPT3ChannelFramesResult['channelPositions'] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const result = stepPT3PreviewFrame(state, options, options.frameInputs?.[frameIndex]);
    state = result.state;
    frames.push(result.frame);
    channelPositions.push(state.channels.map(channel => channel.lastSamplePosition) as [number | null, number | null, number | null]);
    options.onFrame?.(result.frame, frameIndex);
  }

  return { frames, channelPositions, finalState: state };
};
