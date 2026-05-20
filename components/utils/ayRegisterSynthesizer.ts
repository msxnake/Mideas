import { getFrequencyForNoteString } from './noteFrequencies';
import { PT3Instrument, PT3Ornament, TrackerSongData } from '../../types';

const AY_CLOCK_FREQUENCY = 3579545 / 2;
const DEFAULT_TRACKER_TICK_MS = 20;
const CHANNELS = 3;
const OSCILLOSCOPE_BUFFER_SIZE = 1024;
const DC_BLOCKER_R = 0.995;
const ANALOG_LOW_PASS_CUTOFF_HZ = 12000;

const YM2149_DAC_TABLE: readonly number[] = [
  0, 369 / 196605, 438 / 196605, 521 / 196605,
  619 / 196605, 735 / 196605, 874 / 196605, 1039 / 196605,
  1234 / 196605, 1467 / 196605, 1744 / 196605, 2072 / 196605,
  2463 / 196605, 2927 / 196605, 3479 / 196605, 4135 / 196605,
  4914 / 196605, 5841 / 196605, 6942 / 196605, 8250 / 196605,
  9806 / 196605, 11654 / 196605, 13851 / 196605, 16462 / 196605,
  19565 / 196605, 23253 / 196605, 27636 / 196605, 32845 / 196605,
  39037 / 196605, 46395 / 196605, 55141 / 196605, 65535 / 196605,
];

interface ChannelState {
  basePeriod: number | null;
  currentPeriod: number | null;
  baseVolume: number;
  instrument: PT3Instrument | null;
  ornament: PT3Ornament | null;
  volumeStep: number;
  toneStep: number;
  noiseStep: number;
  ornamentStep: number;
  toneOffset: number;
  ornamentOffset: number;
  envelopeRestartPending: boolean;
  keyOn: boolean;
}

const createChannelState = (): ChannelState => ({
  basePeriod: null,
  currentPeriod: null,
  baseVolume: 15,
  instrument: null,
  ornament: null,
  volumeStep: 0,
  toneStep: 0,
  noiseStep: 0,
  ornamentStep: 0,
  toneOffset: 0,
  ornamentOffset: 0,
  envelopeRestartPending: false,
  keyOn: false,
});

/**
 * AY/YM register based synthesizer for native Mideas tracker playback.
 *
 * Unlike AYSynthesizer, this class renders from PSG registers R0-R13 into one
 * continuous WebAudio stream. That keeps tone, noise, mixer and logarithmic
 * volume behavior much closer to the MSX PSG than per-note OscillatorNodes.
 */
export class AYRegisterSynthesizer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isInitialized = false;
  private currentMasterVolume = 0.5;
  private songDataRef: TrackerSongData | null = null;
  private frameIntervalId: number | null = null;

  private registers = new Uint8Array(14);
  private channelStates: ChannelState[] = [createChannelState(), createChannelState(), createChannelState()];

  private toneCounters = [8, 8, 8];
  private toneOutputs = [0, 0, 0];
  private noiseCounter = 16;
  private noiseOutput = 0;
  private noiseLfsr = 1;
  private envelopeCounter = 0;
  private envelopeStep = 31;
  private envelopeFirstCycle = true;
  private envelopeAlternateMask = 0;
  private envelopeHoldMask = 0;
  private envelopeAlternateBit = 0;
  private envelopeAttackBit = 0;
  private envelopeContinueBit = 0;
  private lastEnvelopeShape = 0;
  private dcBlockerInput = 0;
  private dcBlockerOutput = 0;
  private analogLowPassOutput = 0;
  private oscilloscopeBuffers: Float32Array[] = [
    new Float32Array(OSCILLOSCOPE_BUFFER_SIZE),
    new Float32Array(OSCILLOSCOPE_BUFFER_SIZE),
    new Float32Array(OSCILLOSCOPE_BUFFER_SIZE),
  ];
  private oscilloscopeWriteIndex = 0;

  constructor(initialMasterVolume: number = 0.5) {
    this.currentMasterVolume = Math.max(0, Math.min(initialMasterVolume, 1.0));
    this.registers[7] = 0x3f;
  }

  public setSongData(songData: TrackerSongData): void {
    this.songDataRef = songData;
    this.channelStates.forEach(channel => {
      if (!channel.instrument) return;
      const replacement = songData.instruments.find(instrument => instrument.id === channel.instrument?.id) as PT3Instrument | undefined;
      channel.instrument = replacement ?? null;
    });
    this.restartTrackerFrameTimer();
  }

  public getSongData(): TrackerSongData | null {
    return this.songDataRef;
  }

  public async ensureAudioContext(): Promise<boolean> {
    if (!this.isInitialized) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
        this.masterGain.connect(this.audioContext.destination);

        this.processor = this.audioContext.createScriptProcessor(1024, 0, 1);
        this.processor.onaudioprocess = this.renderAudio;
        this.processor.connect(this.masterGain);

        this.restartTrackerFrameTimer();
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing AY register synthesizer:', error);
        this.isInitialized = false;
        return false;
      }
    }

    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Error resuming AY register synthesizer:', error);
        return false;
      }
    }

    return this.isInitialized && this.audioContext !== null;
  }

  public async playNote(
    channel: 0 | 1 | 2,
    noteStringFromCell: string | null,
    instrumentIdFromCell: number | null,
    ornamentIdFromCell: number | null,
    volumeFromCell: number | null
  ): Promise<void> {
    if (!await this.ensureAudioContext()) return;

    const state = this.channelStates[channel];
    const isCut = noteStringFromCell === '===';
    const isKeep = noteStringFromCell === '---' || noteStringFromCell === null;
    const isNewNote = !isCut && !isKeep;

    if (isCut) {
      this.resetChannel(channel);
      this.writeChannelRegisters(channel);
      return;
    }

    if (instrumentIdFromCell !== null && this.songDataRef) {
      state.instrument = instrumentIdFromCell > 0
        ? (this.songDataRef.instruments.find(instrument => instrument.id === instrumentIdFromCell) as PT3Instrument | undefined) ?? null
        : null;
      this.resetChannelProgress(state);
      state.envelopeRestartPending = true;
    }

    if (ornamentIdFromCell !== null && this.songDataRef) {
      state.ornament = ornamentIdFromCell > 0
        ? this.songDataRef.ornaments.find(ornament => ornament.id === ornamentIdFromCell) ?? null
        : null;
      state.ornamentStep = 0;
      state.ornamentOffset = 0;
    }

    if (volumeFromCell !== null) {
      state.baseVolume = Math.max(0, Math.min(15, volumeFromCell));
    } else if (isNewNote) {
      state.baseVolume = 15;
    }

    if (isNewNote) {
      state.basePeriod = this.getNotePeriod(noteStringFromCell);
      state.currentPeriod = state.basePeriod;
      state.keyOn = state.basePeriod !== null && state.instrument !== null;
      this.resetChannelProgress(state);
      state.envelopeRestartPending = true;
    }

    this.writeChannelRegisters(channel);
  }

  public setMasterVolume(volumeLevel: number): void {
    this.currentMasterVolume = Math.max(0, Math.min(volumeLevel, 1.0));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
    }
  }

  public stopAllNotes(): void {
    for (let channel = 0; channel < CHANNELS; channel++) {
      this.resetChannel(channel as 0 | 1 | 2);
    }
    this.registers[7] = 0x3f;
    this.registers[8] = 0;
    this.registers[9] = 0;
    this.registers[10] = 0;
  }

  public getOscilloscopeSnapshot(): Float32Array[] {
    return this.oscilloscopeBuffers.map(buffer => {
      const snapshot = new Float32Array(OSCILLOSCOPE_BUFFER_SIZE);
      const tailLength = OSCILLOSCOPE_BUFFER_SIZE - this.oscilloscopeWriteIndex;
      snapshot.set(buffer.subarray(this.oscilloscopeWriteIndex), 0);
      snapshot.set(buffer.subarray(0, this.oscilloscopeWriteIndex), tailLength);
      return snapshot;
    });
  }

  public async closeContext(): Promise<void> {
    this.stopAllNotes();
    if (this.frameIntervalId !== null) {
      clearInterval(this.frameIntervalId);
      this.frameIntervalId = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Error closing AY register synthesizer:', error);
      }
    }
    this.audioContext = null;
    this.isInitialized = false;
  }

  private renderAudio = (event: AudioProcessingEvent): void => {
    if (!this.audioContext) return;

    const output = event.outputBuffer.getChannelData(0);
    const sampleRate = this.audioContext.sampleRate;
    const chipTicksPerSample = AY_CLOCK_FREQUENCY / sampleRate;
    const lowPassCoefficient = this.getLowPassCoefficient(sampleRate);
    for (let i = 0; i < output.length; i++) {
      let mixed = 0;
      const envelopeLevel = this.advanceEnvelope(chipTicksPerSample);

      this.advanceNoise(chipTicksPerSample);

      for (let channel = 0; channel < CHANNELS; channel++) {
        this.advanceTone(channel, chipTicksPerSample);
        const toneDisabled = (this.registers[7] & (1 << channel)) !== 0;
        const noiseDisabled = (this.registers[7] & (1 << (channel + 3))) !== 0;
        const toneMask = toneDisabled ? 31 : this.toneOutputs[channel];
        const noiseMask = noiseDisabled ? 31 : this.noiseOutput;
        const volumeRegister = this.registers[8 + channel];
        const volumeIndex = (volumeRegister & 0x10) !== 0 ? envelopeLevel : ((volumeRegister & 0x0f) << 1);
        const channelSample = YM2149_DAC_TABLE[volumeIndex & toneMask & noiseMask];
        this.oscilloscopeBuffers[channel][this.oscilloscopeWriteIndex] = channelSample;
        mixed += channelSample;
      }
      this.oscilloscopeWriteIndex = (this.oscilloscopeWriteIndex + 1) % OSCILLOSCOPE_BUFFER_SIZE;

      const rawSample = (mixed / CHANNELS) * 0.95;
      const dcBlocked = rawSample - this.dcBlockerInput + (DC_BLOCKER_R * this.dcBlockerOutput);
      this.dcBlockerInput = rawSample;
      this.dcBlockerOutput = dcBlocked;
      this.analogLowPassOutput += lowPassCoefficient * (dcBlocked - this.analogLowPassOutput);
      output[i] = this.analogLowPassOutput;
    }
  };

  private advanceTone(channel: number, chipTicksPerSample: number): void {
    const tonePeriodTicks = Math.max(8, 8 * this.getTonePeriodFromRegisters(channel));
    this.toneCounters[channel] -= chipTicksPerSample;
    while (this.toneCounters[channel] < 0) {
      this.toneCounters[channel] += tonePeriodTicks;
      this.toneOutputs[channel] ^= 31;
    }
  }

  private advanceNoise(chipTicksPerSample: number): void {
    const noisePeriodTicks = Math.max(16, 16 * (this.registers[6] & 0x1f));
    this.noiseCounter -= chipTicksPerSample;
    while (this.noiseCounter < 0) {
      this.noiseCounter += noisePeriodTicks;
      if (((this.noiseLfsr + 1) & 0x02) !== 0) {
        this.noiseOutput ^= 31;
      }
      if ((this.noiseLfsr & 0x01) !== 0) {
        this.noiseLfsr ^= 0x24000;
      }
      this.noiseLfsr >>= 1;
    }
  }

  private advanceEnvelope(chipTicksPerSample: number): number {
    const envelopePeriodTicks = Math.max(16, 16 * (this.registers[11] | (this.registers[12] << 8)));
    this.envelopeCounter -= 2 * chipTicksPerSample;
    while (this.envelopeCounter < 0) {
      this.envelopeCounter += envelopePeriodTicks;
      this.envelopeStep--;
      if (this.envelopeStep < 0) {
        this.envelopeStep = 31;
        this.envelopeFirstCycle = false;
        this.envelopeAlternateMask ^= 31;
      }
    }

    let level = this.envelopeStep ^ (this.envelopeAlternateMask && this.envelopeAlternateBit);
    if (!this.envelopeFirstCycle) level |= this.envelopeHoldMask;
    level ^= this.envelopeAttackBit;
    if (!this.envelopeFirstCycle) level &= this.envelopeContinueBit;
    return level & 31;
  }

  private advanceTrackerFrame(): void {
    for (let channel = 0; channel < CHANNELS; channel++) {
      const state = this.channelStates[channel];
      if (!state.keyOn || !state.instrument) continue;
      this.advanceChannelState(state);
      this.writeChannelRegisters(channel as 0 | 1 | 2);
    }
  }

  private restartTrackerFrameTimer(): void {
    const nextTickMs = this.getTrackerTickMs();
    if (this.frameIntervalId !== null) {
      clearInterval(this.frameIntervalId);
      this.frameIntervalId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.frameIntervalId = window.setInterval(() => this.advanceTrackerFrame(), nextTickMs);
    }
  }

  private getTrackerTickMs(): number {
    const bpm = this.songDataRef?.bpm ?? 125;
    if (!Number.isFinite(bpm) || bpm <= 0) return DEFAULT_TRACKER_TICK_MS;
    return Math.max(5, 2500 / bpm);
  }

  private getLowPassCoefficient(sampleRate: number): number {
    const rc = 1 / (2 * Math.PI * ANALOG_LOW_PASS_CUTOFF_HZ);
    const dt = 1 / sampleRate;
    return dt / (rc + dt);
  }

  private advanceChannelState(state: ChannelState): void {
    const instrument = state.instrument;
    if (!instrument) return;

    if (instrument.toneEnvelope?.length) {
      state.toneOffset = instrument.toneEnvelope[state.toneStep] ?? 0;
      state.toneStep = this.nextEnvelopeStep(state.toneStep, instrument.toneEnvelope.length, instrument.toneLoop);
    } else {
      state.toneOffset = 0;
    }

    if (state.ornament?.data.length) {
      state.ornamentOffset = state.ornament.data[state.ornamentStep] ?? 0;
      state.ornamentStep = this.nextEnvelopeStep(state.ornamentStep, state.ornament.data.length, state.ornament.loopPosition);
    } else {
      state.ornamentOffset = 0;
    }

    if (state.basePeriod !== null) {
      state.currentPeriod = this.getPeriodWithSemitoneOffset(state.basePeriod, state.toneOffset + state.ornamentOffset);
    }
  }

  private writeChannelRegisters(channel: 0 | 1 | 2): void {
    const state = this.channelStates[channel];
    const instrument = state.instrument;
    const period = state.keyOn && state.currentPeriod !== null ? state.currentPeriod : 0;

    this.registers[channel * 2] = period & 0xff;
    this.registers[channel * 2 + 1] = (period >> 8) & 0x0f;

    const useTone = state.keyOn && instrument ? (instrument.ayToneEnabled === undefined ? true : instrument.ayToneEnabled) : false;
    const useNoise = state.keyOn && instrument ? !!instrument.ayNoiseEnabled : false;

    this.setMixerBit(channel, !useTone);
    this.setMixerBit(channel + 3, !useNoise);

    if (useNoise) {
      this.registers[6] = this.resolveNoisePeriod(state) & 0x1f;
    }

    if (instrument?.ayEnvelopeShape !== undefined) {
      this.registers[8 + channel] = 0x10;
      const envelopePeriod = this.resolveHardwareEnvelopePeriod(state);
      this.registers[11] = envelopePeriod & 0xff;
      this.registers[12] = (envelopePeriod >> 8) & 0xff;
      this.writeEnvelopeShape(instrument.ayEnvelopeShape, state.envelopeRestartPending);
      state.envelopeRestartPending = false;
    } else {
      this.registers[8 + channel] = this.resolveVolume(state) & 0x0f;
    }
  }

  private setMixerBit(bit: number, disabled: boolean): void {
    if (disabled) this.registers[7] |= (1 << bit);
    else this.registers[7] &= ~(1 << bit);
    this.registers[7] &= 0x3f;
  }

  private writeEnvelopeShape(shape: number, forceRestart = false): void {
    const normalizedShape = shape & 0x0f;
    if (!forceRestart && this.lastEnvelopeShape === normalizedShape) return;
    this.registers[13] = normalizedShape;
    this.lastEnvelopeShape = normalizedShape;
    this.envelopeCounter = 0;
    this.envelopeStep = 32;
    this.envelopeFirstCycle = true;
    this.envelopeAlternateMask = 0;
    this.envelopeHoldMask = (normalizedShape & 0x01) !== 0 ? 31 : 0;
    this.envelopeAlternateBit = (normalizedShape & 0x02) !== 0 ? 31 : 0;
    this.envelopeAttackBit = (normalizedShape & 0x04) !== 0 ? 31 : 0;
    this.envelopeContinueBit = (normalizedShape & 0x08) !== 0 ? 31 : 0;
  }

  private resolveVolume(state: ChannelState): number {
    const envelope = state.instrument?.volumeEnvelope;
    if (!envelope?.length) return Math.max(0, Math.min(15, state.baseVolume));

    const raw = envelope[Math.min(state.volumeStep, envelope.length - 1)] ?? state.baseVolume;
    state.volumeStep = this.nextEnvelopeStep(state.volumeStep, envelope.length, state.instrument?.volumeLoop);
    const uses127Scale = envelope.some(value => value > 15);
    return uses127Scale
      ? Math.max(0, Math.min(15, Math.round((Math.max(0, Math.min(127, raw)) / 127) * 15)))
      : Math.max(0, Math.min(15, Math.round(raw)));
  }

  private resolveNoisePeriod(state: ChannelState): number {
    const envelope = state.instrument?.noiseEnvelope;
    if (!envelope?.length) {
      return Math.max(0, Math.min(31, state.instrument?.noiseBaseFrequency ?? this.songDataRef?.ayNoisePeriod ?? 16));
    }
    const value = envelope[Math.min(state.noiseStep, envelope.length - 1)] ?? 16;
    state.noiseStep = this.nextEnvelopeStep(state.noiseStep, envelope.length, state.instrument?.noiseLoop);
    return Math.max(0, Math.min(31, value));
  }

  private resolveHardwareEnvelopePeriod(state: ChannelState): number {
    const instrument = state.instrument;
    if (!instrument) return 1;
    if (instrument.hardwareEnvelopeRatio !== undefined && state.currentPeriod !== null && instrument.hardwareEnvelopeRatio > 0) {
      return Math.max(1, Math.min(65535, Math.round(state.currentPeriod / (16 * instrument.hardwareEnvelopeRatio))));
    }
    return Math.max(1, Math.min(65535, instrument.hardwareEnvelopePeriod ?? this.songDataRef?.ayHardwareEnvelopePeriod ?? 100));
  }

  private nextEnvelopeStep(current: number, length: number, loopPosition?: number): number {
    const next = current + 1;
    if (next < length) return next;
    if (loopPosition !== undefined && loopPosition >= 0 && loopPosition < length) return loopPosition;
    return Math.max(0, length - 1);
  }

  private resetChannel(channel: 0 | 1 | 2): void {
    this.channelStates[channel] = createChannelState();
    this.registers[channel * 2] = 0;
    this.registers[channel * 2 + 1] = 0;
    this.registers[8 + channel] = 0;
    this.setMixerBit(channel, true);
    this.setMixerBit(channel + 3, true);
  }

  private resetChannelProgress(state: ChannelState): void {
    state.volumeStep = 0;
    state.toneStep = 0;
    state.noiseStep = 0;
    state.ornamentStep = 0;
    state.toneOffset = 0;
    state.ornamentOffset = 0;
  }

  private getNotePeriod(noteString: string | null): number | null {
    const frequency = getFrequencyForNoteString(noteString);
    if (frequency === null || frequency <= 0) return null;
    return Math.max(1, Math.min(0x0fff, Math.round(AY_CLOCK_FREQUENCY / (16 * frequency))));
  }

  private getTonePeriodFromRegisters(channel: number): number {
    return this.registers[channel * 2] | ((this.registers[channel * 2 + 1] & 0x0f) << 8);
  }

  private getPeriodWithSemitoneOffset(basePeriod: number, semitoneOffset: number): number {
    const baseFrequency = AY_CLOCK_FREQUENCY / (16 * basePeriod);
    const shiftedFrequency = baseFrequency * Math.pow(2, semitoneOffset / 12);
    return Math.max(1, Math.min(0x0fff, Math.round(AY_CLOCK_FREQUENCY / (16 * shiftedFrequency))));
  }
}
