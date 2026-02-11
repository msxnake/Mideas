// components/utils/aySynthesizer.ts
import { getFrequencyForNoteString } from './noteFrequencies';
import { PT3Instrument, PT3Ornament, TrackerSongData } from '../../types';
import { PT3_NOTE_NAMES } from '../../constants';

const AY_CLOCK_FREQUENCY = 3579545 / 2; // Approx 1.7897725 MHz for MSX

/**
 * AY-3-8910 logarithmic DAC volume table.
 * Maps the 16 volume levels (0-15) to normalized amplitude values (0.0-1.0).
 * Based on measurements of the actual chip's resistor ladder DAC.
 * The logarithmic curve creates the characteristic "thin" MSX sound.
 */
const AY_DAC_TABLE: readonly number[] = [
    0.0000,  // 0 - silent
    0.0137,  // 1
    0.0205,  // 2
    0.0291,  // 3
    0.0423,  // 4
    0.0618,  // 5
    0.0847,  // 6
    0.1369,  // 7
    0.1691,  // 8
    0.2647,  // 9
    0.3527,  // 10
    0.4499,  // 11
    0.5765,  // 12
    0.6873,  // 13
    0.8482,  // 14
    1.0000   // 15
];

/**
 * Represents the state of a hardware envelope for a channel.
 */
interface HardwareEnvelopeState {
    /** The envelope shape (0-15). */
    shape: number;
    /** The envelope period setting. */
    periodSetting: number;
    periodCounter: number;
    stepCounter: number;
    currentLevel: number;
    attack: boolean;
    hold: boolean;
    alternate: boolean;
    repeat: boolean;
    finished: boolean;
    peakVolumeRatio: number;
}

/**
 * Represents the state of a software volume envelope for a channel.
 */
interface SoftwareVolumeEnvelopeState {
    /** The volume envelope data points. */
    envelope: number[];
    /** The loop position in the envelope. */
    loopPosition?: number;
    /** The current step in the envelope. */
    currentStep: number;
}

/**
 * Represents the state of an ornament for a channel.
 */
interface OrnamentState {
    /** The ornament data. */
    ornament: PT3Ornament;
    /** The current step in the ornament. */
    currentStep: number;
    /** The tick counter for ornament speed. */
    tickCounter: number;
}

/**
 * Represents the state of a software tone (pitch) envelope for a channel.
 */
interface SoftwareToneEnvelopeState {
    /** The tone envelope data points (pitch offsets in semitones). */
    envelope: number[];
    /** The loop position in the envelope. */
    loopPosition?: number;
    /** The current step in the envelope. */
    currentStep: number;
}


/**
 * Emulates the AY-3-8910 sound chip to play tracker music in the browser.
 * This class manages audio context, oscillators, noise generation, and envelopes
 * to synthesize sound based on tracker data.
 */
export class AYSynthesizer {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    private toneOscillators: (OscillatorNode | null)[] = [null, null, null];
    private channelMainGains: (GainNode | null)[] = [null, null, null];

    private noiseBuffer: AudioBuffer | null = null;
    private noiseSources: (AudioBufferSourceNode | null)[] = [null, null, null];
    private noiseFilters: (BiquadFilterNode | null)[] = [null, null, null];

    private isInitialized = false;
    private currentMasterVolume = 0.5;
    private songDataRef: TrackerSongData | null = null;
    private effectsUpdateIntervalMs = 30;
    private effectsUpdateIntervalId: number | null = null;

    // Persistent state per channel
    private channelBasePeriod: (number | null)[] = [null, null, null];
    private channelCurrentPeriod: (number | null)[] = [null, null, null];

    private channelHardwareEnvelopeState: (HardwareEnvelopeState | null)[] = [null, null, null];
    private channelSoftwareVolumeEnvelopeState: (SoftwareVolumeEnvelopeState | null)[] = [null, null, null];
    private channelSoftwareToneEnvelopeState: (SoftwareToneEnvelopeState | null)[] = [null, null, null];
    private channelOrnamentState: (OrnamentState | null)[] = [null, null, null];

    private channelBaseVolumeForEffects: number[] = [15, 15, 15]; // Default full volume
    private channelActiveInstrument: (PT3Instrument | null)[] = [null, null, null]; // Tracks the last set instrument
    private envelopeTickCounters: number[] = [0, 0, 0]; // Tick-based counters for envelope speed

    /**
     * Creates an instance of the AYSynthesizer.
     * @param initialMasterVolume The initial master volume, a value between 0.0 and 1.0.
     */
    constructor(initialMasterVolume: number = 0.5) {
        this.currentMasterVolume = Math.max(0, Math.min(initialMasterVolume, 1.0));
    }

    /**
     * Sets the tracker song data to be used by the synthesizer.
     * @param songData The tracker song data.
     */
    public setSongData(songData: TrackerSongData): void {
        this.songDataRef = songData;
        for (let i = 0; i < 3; i++) {
            const ch = i as 0 | 1 | 2;
            if (this.channelActiveInstrument[ch]) {
                const activeId = this.channelActiveInstrument[ch]!.id;
                const newInstrument = this.songDataRef.instruments.find(instr => instr.id === activeId);
                this.channelActiveInstrument[ch] = newInstrument || null;
            }
        }
    }

    private getNotePeriod(noteString: string | null): number | null {
        const freq = getFrequencyForNoteString(noteString);
        if (freq === null || freq <= 0) return null;
        return Math.round(AY_CLOCK_FREQUENCY / (16 * freq));
    }

    private getFrequencyFromPeriod(period: number | null): number | null {
        if (period === null || period <= 0) return 0;
        return AY_CLOCK_FREQUENCY / (16 * period);
    }

    private getFrequencyFromNoisePeriod(noisePeriod: number): number {
        const effectiveNP = (noisePeriod === 0) ? 1 : noisePeriod & 0x1F; // Ensure 5-bit, treat 0 as 1
        return AY_CLOCK_FREQUENCY / (32 * effectiveNP);
    }

    /**
     * Ensures the AudioContext is initialized and ready to play sound.
     * This method should be called before any sound can be played.
     * @returns A promise that resolves to true if the audio context is ready, false otherwise.
     */
    public async ensureAudioContext(): Promise<boolean> {
        if (!this.isInitialized) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
                this.masterGain.connect(this.audioContext.destination);

                // Generate AY-3-8910 authentic LFSR noise buffer
                // The real chip uses a 17-bit LFSR with polynomial: new_bit = bit0 XOR bit3
                const bufferSize = Math.floor(this.audioContext.sampleRate * 2);
                this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const output = this.noiseBuffer.getChannelData(0);
                let lfsr = 1; // Initial seed (must be non-zero)
                // The AY noise generator runs at AY_CLOCK / 16
                const ayNoiseClockRate = AY_CLOCK_FREQUENCY / 16;
                const samplesPerNoiseClockTick = this.audioContext.sampleRate / ayNoiseClockRate;
                let clockAccumulator = 0;
                let currentOutputBit = 1;

                for (let i = 0; i < bufferSize; i++) {
                    clockAccumulator += 1;
                    if (clockAccumulator >= samplesPerNoiseClockTick) {
                        clockAccumulator -= samplesPerNoiseClockTick;
                        // AY-3-8910 LFSR: feedback = bit0 XOR bit3
                        const feedback = ((lfsr >> 0) ^ (lfsr >> 3)) & 1;
                        lfsr = (lfsr >> 1) | (feedback << 16);
                        currentOutputBit = lfsr & 1;
                    }
                    output[i] = currentOutputBit ? 1.0 : -1.0;
                }
                this.isInitialized = true;

                if (this.effectsUpdateIntervalId === null) {
                    this.effectsUpdateIntervalId = window.setInterval(this.updateAllChannelEffects.bind(this), this.effectsUpdateIntervalMs);
                }
            } catch (e) {
                console.error("Error initializing AudioContext:", e);
                this.isInitialized = false;
                return false;
            }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.error("Error resuming AudioContext:", e);
                return false;
            }
        }
        return this.isInitialized && this.audioContext !== null;
    }

    private stopToneOscillator(channel: 0 | 1 | 2) {
        if (this.toneOscillators[channel]) {
            try { this.toneOscillators[channel]!.stop(); } catch (e) { }
            this.toneOscillators[channel]!.disconnect();
            this.toneOscillators[channel] = null;
        }
    }

    private stopNoiseSource(channel: 0 | 1 | 2) {
        if (this.noiseSources[channel]) {
            try { this.noiseSources[channel]!.stop(); } catch (e) { }
            this.noiseSources[channel]!.disconnect();
            this.noiseSources[channel] = null;
        }
        if (this.noiseFilters[channel]) {
            this.noiseFilters[channel]!.disconnect();
            this.noiseFilters[channel] = null;
        }
    }

    private stopChannelSound(channel: 0 | 1 | 2, immediateStop: boolean) {
        if (!this.audioContext) return;
        this.stopToneOscillator(channel);
        this.stopNoiseSource(channel);

        if (this.channelMainGains[channel]) {
            this.channelMainGains[channel]!.gain.cancelScheduledValues(this.audioContext.currentTime);
            if (immediateStop) {
                this.channelMainGains[channel]!.gain.setValueAtTime(0, this.audioContext.currentTime);
            } else {
                this.channelMainGains[channel]!.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.005);
            }
        }
    }

    private initializeEnvelopesForInstrument(channel: 0 | 1 | 2, instrument: PT3Instrument) {
        this.channelHardwareEnvelopeState[channel] = null;
        this.channelSoftwareVolumeEnvelopeState[channel] = null;
        this.channelSoftwareToneEnvelopeState[channel] = null;
        this.envelopeTickCounters[channel] = 0;

        const useHardwareEnv = instrument.ayEnvelopeShape !== undefined && instrument.ayEnvelopeShape >= 0 && instrument.ayEnvelopeShape <= 15;
        const useSoftwareEnv = instrument.volumeEnvelope && instrument.volumeEnvelope.length > 0;
        const useToneEnv = instrument.toneEnvelope && instrument.toneEnvelope.length > 0;

        if (useHardwareEnv && this.songDataRef) {
            const shape = instrument.ayEnvelopeShape!;
            // Peak volume for HW env is based on the channel's current base volume
            const peakVolRatioForHwEnv = this.channelBaseVolumeForEffects[channel] / 15.0;
            const periodSetting = instrument.hardwareEnvelopePeriod ?? this.songDataRef.ayHardwareEnvelopePeriod ?? 1;
            this.channelHardwareEnvelopeState[channel] = {
                shape, periodSetting: periodSetting,
                periodCounter: 0, stepCounter: 0,
                currentLevel: (shape & 0b0100) ? 0 : 15, // Initial level: 0 if attack, 15 if decay
                attack: (shape & 0b0100) !== 0, hold: (shape & 0b0001) !== 0,
                alternate: (shape & 0b0010) !== 0, repeat: (shape & 0b1000) !== 0,
                finished: false, peakVolumeRatio: peakVolRatioForHwEnv,
            };
        } else if (useSoftwareEnv) {
            const volLoop = instrument.volumeLoop;
            this.channelSoftwareVolumeEnvelopeState[channel] = {
                envelope: instrument.volumeEnvelope!,
                loopPosition: (volLoop !== undefined && volLoop >= 0 && volLoop < instrument.volumeEnvelope!.length) ? volLoop : undefined,
                currentStep: 0,
            };
        }

        // Initialize tone envelope (pitch modulation)
        if (useToneEnv) {
            const toneLoop = instrument.toneLoop;
            this.channelSoftwareToneEnvelopeState[channel] = {
                envelope: instrument.toneEnvelope!,
                loopPosition: (toneLoop !== undefined && toneLoop >= 0 && toneLoop < instrument.toneEnvelope!.length) ? toneLoop : undefined,
                currentStep: 0,
            };
        }
    }

    private configureAudioNodeMixer(channel: 0 | 1 | 2) {
        if (!this.audioContext || !this.masterGain) return;

        if (this.channelMainGains[channel]) {
            this.channelMainGains[channel]!.disconnect();
        }
        const mainChannelGain = this.audioContext.createGain();
        mainChannelGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        mainChannelGain.connect(this.masterGain);
        this.channelMainGains[channel] = mainChannelGain;
    }

    private setupToneOscillator(channel: 0 | 1 | 2, period: number) {
        if (!this.audioContext || !this.channelMainGains[channel]) return;
        this.stopToneOscillator(channel);
        const freqToPlay = this.getFrequencyFromPeriod(period);
        if (freqToPlay && freqToPlay > 0) {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(Math.min(freqToPlay, this.audioContext.sampleRate / 2), this.audioContext.currentTime);
            oscillator.connect(this.channelMainGains[channel]!);
            try { oscillator.start(); } catch (e) { console.error("Error starting tone oscillator:", e); }
            this.toneOscillators[channel] = oscillator;
        }
    }

    private setupNoiseSource(channel: 0 | 1 | 2, noteFrequency?: number | null) {
        if (!this.audioContext || !this.noiseBuffer || !this.channelMainGains[channel]) return;
        this.stopNoiseSource(channel);

        // Create noise source using AY LFSR buffer
        const noiseSourceNode = this.audioContext.createBufferSource();
        noiseSourceNode.buffer = this.noiseBuffer;
        noiseSourceNode.loop = true;

        // Adjust playback rate based on noise period to simulate AY noise frequency control
        const currentInstrument = this.channelActiveInstrument[channel];
        const noisePeriod = currentInstrument?.noiseBaseFrequency ?? this.songDataRef?.ayNoisePeriod ?? 16;
        // The AY noise period divides the noise clock further. Period 1 = fastest, 31 = slowest.
        // We baked the base noise clock into the buffer, so adjust playback rate by the period.
        const effectivePeriod = Math.max(1, noisePeriod & 0x1F);
        noiseSourceNode.playbackRate.setValueAtTime(1.0 / effectivePeriod, this.audioContext.currentTime);

        // Connect directly to channel gain (no bandpass filter - preserves AY digital noise character)
        noiseSourceNode.connect(this.channelMainGains[channel]!);

        try { noiseSourceNode.start(); } catch (e) { console.error("Error starting noise source:", e); }
        this.noiseSources[channel] = noiseSourceNode;
        this.noiseFilters[channel] = null; // No filter used
    }

    /**
     * Plays a note on a specific channel with the given parameters.
     * This is the main method for triggering sounds in the synthesizer.
     * @param channel The channel to play the note on (0, 1, or 2).
     * @param noteStringFromCell The note to play (e.g., "C-4", "---" for keep, "===" for cut).
     * @param instrumentIdFromCell The ID of the instrument to use.
     * @param ornamentIdFromCell The ID of the ornament to use.
     * @param volumeFromCell The volume to set (0-15).
     * @returns A promise that resolves when the note has been processed.
     */
    public async playNote(
        channel: 0 | 1 | 2,
        noteStringFromCell: string | null,
        instrumentIdFromCell: number | null,
        ornamentIdFromCell: number | null,
        volumeFromCell: number | null
    ): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext || !this.masterGain) {
            console.warn("AudioContext not available. Cannot play note.");
            return;
        }

        const isNoteCut = noteStringFromCell === "===";
        const isKeepNote = noteStringFromCell === "---" || noteStringFromCell === null;
        const isNewActualNote = !isNoteCut && !isKeepNote;

        // 1. Handle Note Cut
        if (isNoteCut) {
            this.stopChannelSound(channel, true);
            this.channelBasePeriod[channel] = null;
            this.channelCurrentPeriod[channel] = null;
            this.channelActiveInstrument[channel] = null;
            this.channelHardwareEnvelopeState[channel] = null;
            this.channelSoftwareVolumeEnvelopeState[channel] = null;
            this.channelSoftwareToneEnvelopeState[channel] = null;
            this.channelOrnamentState[channel] = null;
            this.channelBaseVolumeForEffects[channel] = 0;
            this.envelopeTickCounters[channel] = 0;
            if (this.channelMainGains[channel]) {
                this.channelMainGains[channel]!.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.channelMainGains[channel]!.gain.setValueAtTime(0, this.audioContext.currentTime);
            }
            return;
        }

        let activeInstrumentChanged = false;
        // 2. Determine Instrument for this step
        if (instrumentIdFromCell !== null && instrumentIdFromCell > 0 && this.songDataRef) {
            const newInstrument = this.songDataRef.instruments.find(i => i.id === instrumentIdFromCell);
            if (newInstrument && this.channelActiveInstrument[channel]?.id !== newInstrument.id) {
                this.channelActiveInstrument[channel] = newInstrument;
                activeInstrumentChanged = true;
            }
        } else if (instrumentIdFromCell === 0 && isNewActualNote) { // Instrument 0 on new note means stop/no instrument
            this.channelActiveInstrument[channel] = null;
            activeInstrumentChanged = true; // Considered a change if it was previously set
        }
        // If instrumentIdFromCell is null, channelActiveInstrument[channel] persists.

        // 3. Handle State Resets & Pitch for New Notes
        if (isNewActualNote) {
            this.stopChannelSound(channel, false); // Graceful stop for new note
            this.channelBasePeriod[channel] = this.getNotePeriod(noteStringFromCell);
            this.channelCurrentPeriod[channel] = this.channelBasePeriod[channel];
            // Envelopes and ornament state reset for new note, will be re-initialized if applicable
            this.channelHardwareEnvelopeState[channel] = null;
            this.channelSoftwareVolumeEnvelopeState[channel] = null;
            this.channelSoftwareToneEnvelopeState[channel] = null;
            this.channelOrnamentState[channel] = null;
            this.envelopeTickCounters[channel] = 0;
        }

        // 4. Update Base Volume (if specified in cell or new note with active instrument)
        if (volumeFromCell !== null) {
            this.channelBaseVolumeForEffects[channel] = volumeFromCell;
        } else if (isNewActualNote && this.channelActiveInstrument[channel]) {
            // If new note and no volume, use instrument's default "loudness" (assumed 15 for simplicity here)
            // Real PT3 might use instrument's first vol envelope point or default if no env.
            this.channelBaseVolumeForEffects[channel] = 15;
        }
        // If "keep note" and volumeFromCell is null, channelBaseVolumeForEffects is unchanged.

        // 5. Setup/Update Ornament State
        if (ornamentIdFromCell !== null) { // 0 means turn off ornament
            if (ornamentIdFromCell > 0 && this.songDataRef) {
                const ornamentAsset = this.songDataRef.ornaments.find(o => o.id === ornamentIdFromCell);
                if (ornamentAsset && ornamentAsset.data.length > 0) {
                    this.channelOrnamentState[channel] = { ornament: ornamentAsset, currentStep: 0, tickCounter: 0 };
                } else {
                    this.channelOrnamentState[channel] = null; // Invalid ornament ID
                }
            } else { // ornamentIdFromCell is 0 or invalid
                this.channelOrnamentState[channel] = null;
            }
        }
        // If ornamentIdFromCell is null on a "keep note", existing ornament continues.
        // If it's a new note and ornamentIdFromCell is null, ornament state was already cleared.

        // 6. Setup/Update Envelope States (if instrument changed or new note with active instrument)
        if (this.channelActiveInstrument[channel] && (activeInstrumentChanged || isNewActualNote)) {
            this.initializeEnvelopesForInstrument(channel, this.channelActiveInstrument[channel]!);
        }
        // If "keep note" and instrument didn't change, existing envelopes continue.

        // 7. Audio Node Setup
        const currentInstrument = this.channelActiveInstrument[channel];
        if (currentInstrument) {
            const useTone = currentInstrument.ayToneEnabled === undefined ? true : currentInstrument.ayToneEnabled;
            const useNoise = !!currentInstrument.ayNoiseEnabled;

            // Ensure main gain node exists
            if (!this.channelMainGains[channel]) {
                this.configureAudioNodeMixer(channel);
            }

            // Tone Oscillator
            if (useTone && this.channelCurrentPeriod[channel] !== null && this.channelCurrentPeriod[channel]! > 0) {
                if (!this.toneOscillators[channel] || isNewActualNote || activeInstrumentChanged) {
                    this.setupToneOscillator(channel, this.channelCurrentPeriod[channel]!);
                }
            } else if (!useTone || this.channelCurrentPeriod[channel] === null || this.channelCurrentPeriod[channel]! <= 0) {
                this.stopToneOscillator(channel);
            }

            // Noise Source
            if (useNoise && this.noiseBuffer) {
                if (!this.noiseSources[channel] || isNewActualNote || activeInstrumentChanged) {
                    // Pass the note frequency to create tonal noise when tone is also enabled
                    const noteFreq = useTone ? this.getFrequencyFromPeriod(this.channelCurrentPeriod[channel]) : null;
                    this.setupNoiseSource(channel, noteFreq);
                }
            } else if (!useNoise) {
                this.stopNoiseSource(channel);
            }
        } else if (isNewActualNote) { // New note but no instrument is active or specified as 0
            this.stopChannelSound(channel, true); // Ensure silence
            return;
        }
        // If "keep note" and no instrument change, audio nodes continue as is.

        // 8. Initial update of effects for volume/pitch based on current states
        this.updateChannelEffects(channel);
    }

    private updateAllChannelEffects() {
        if (!this.audioContext) return;
        for (let ch = 0; ch < 3; ch++) {
            this.updateChannelEffects(ch as 0 | 1 | 2);
        }
    }

    private updateChannelEffects(channel: 0 | 1 | 2) {
        if (!this.audioContext || !this.channelMainGains[channel]) return;

        let periodForFrequencyUpdate = this.channelCurrentPeriod[channel];
        const baseFundamentalPeriod = this.channelBasePeriod[channel];

        // Calculate tick-based envelope advancement rate
        // This ties envelope speed to the song's speed/BPM rather than a fixed 30ms interval
        const songSpeed = this.songDataRef?.speed || 6;
        const bpm = this.songDataRef?.bpm || 125;
        const msPerTick = (60000 / bpm) / songSpeed;
        const ticksPerUpdate = this.effectsUpdateIntervalMs / msPerTick;
        this.envelopeTickCounters[channel] += ticksPerUpdate;
        const shouldAdvanceEnvelope = this.envelopeTickCounters[channel] >= 1.0;
        if (shouldAdvanceEnvelope) {
            this.envelopeTickCounters[channel] -= 1.0;
        }

        // Process tone envelope (pitch modulation from instrument) — BEFORE ornament
        if (this.channelSoftwareToneEnvelopeState[channel] && baseFundamentalPeriod !== null && shouldAdvanceEnvelope) {
            const toneEnvState = this.channelSoftwareToneEnvelopeState[channel]!;
            if (toneEnvState.currentStep < toneEnvState.envelope.length) {
                const pitchOffset = toneEnvState.envelope[toneEnvState.currentStep];
                if (pitchOffset !== 0) {
                    const baseFreq = this.getFrequencyFromPeriod(baseFundamentalPeriod);
                    if (baseFreq && baseFreq > 0) {
                        const modulatedFreq = baseFreq * Math.pow(2, pitchOffset / 12.0);
                        periodForFrequencyUpdate = Math.max(1, Math.min(4095,
                            Math.round(AY_CLOCK_FREQUENCY / (16 * modulatedFreq))));
                    }
                } else {
                    periodForFrequencyUpdate = baseFundamentalPeriod;
                }
                toneEnvState.currentStep++;
                if (toneEnvState.currentStep >= toneEnvState.envelope.length) {
                    if (toneEnvState.loopPosition !== undefined && toneEnvState.loopPosition >= 0 && toneEnvState.loopPosition < toneEnvState.envelope.length) {
                        toneEnvState.currentStep = toneEnvState.loopPosition;
                    }
                    // else: stays finished, no more pitch modulation
                }
            }
        }

        // Process ornament (pitch offset table)
        if (this.channelOrnamentState[channel] && baseFundamentalPeriod !== null) {
            const ornState = this.channelOrnamentState[channel]!;
            ornState.tickCounter++;
            const ornamentSpeedFactor = Math.max(1, Math.floor((this.songDataRef?.speed || 6) / 2));
            if (ornState.tickCounter >= ornamentSpeedFactor) {
                ornState.tickCounter = 0;

                const ornamentData = ornState.ornament.data;
                const pitchOffsetHalfSteps = ornamentData[ornState.currentStep];

                // Use periodForFrequencyUpdate as base (may already have tone envelope applied)
                const effectiveBasePeriod = periodForFrequencyUpdate ?? baseFundamentalPeriod;
                const baseFreq = this.getFrequencyFromPeriod(effectiveBasePeriod);
                if (baseFreq && baseFreq > 0) {
                    const ornamentedFreq = baseFreq * Math.pow(2, pitchOffsetHalfSteps / 12.0);
                    periodForFrequencyUpdate = Math.max(1, Math.min(4095, Math.round(AY_CLOCK_FREQUENCY / (16 * ornamentedFreq))));
                } else {
                    periodForFrequencyUpdate = effectiveBasePeriod;
                }

                ornState.currentStep++;
                if (ornState.currentStep >= ornamentData.length) {
                    if (ornState.ornament.loopPosition !== undefined && ornState.ornament.loopPosition < ornamentData.length) {
                        ornState.currentStep = ornState.ornament.loopPosition;
                    } else {
                        this.channelOrnamentState[channel] = null;
                        periodForFrequencyUpdate = baseFundamentalPeriod;
                    }
                }
            } else {
                periodForFrequencyUpdate = this.channelCurrentPeriod[channel]; // Use last calculated period if ornament not ticking
            }
        } else if (baseFundamentalPeriod !== null && !this.channelSoftwareToneEnvelopeState[channel]) {
            periodForFrequencyUpdate = baseFundamentalPeriod;
        }

        if (periodForFrequencyUpdate !== this.channelCurrentPeriod[channel]) {
            this.channelCurrentPeriod[channel] = periodForFrequencyUpdate;
        }

        // Update tone oscillator frequency
        if (this.toneOscillators[channel] && this.channelCurrentPeriod[channel] !== null) {
            const freqToPlay = this.getFrequencyFromPeriod(this.channelCurrentPeriod[channel]);
            if (freqToPlay && freqToPlay > 0) {
                this.toneOscillators[channel]!.frequency.setTargetAtTime(Math.min(freqToPlay, this.audioContext.sampleRate / 2), this.audioContext.currentTime, 0.001);
            } else {
                this.stopToneOscillator(channel);
            }
        }

        // Update noise playback rate based on noise period (no filter, period controls rate)
        if (this.noiseSources[channel] && this.channelCurrentPeriod[channel] !== null) {
            // Noise playback rate is already set based on instrument noise period.
            // No filter frequency tracking needed with the LFSR approach.
        }

        // --- Volume processing ---
        let finalVolume15: number;
        if (this.channelHardwareEnvelopeState[channel]) {
            const hwEnv = this.channelHardwareEnvelopeState[channel]!;
            if (!hwEnv.finished) {
                // Update period if tracking ratio is set
                const currentInstrument = this.channelActiveInstrument[channel];
                if (currentInstrument?.hardwareEnvelopeRatio !== undefined && this.channelCurrentPeriod[channel] !== null && currentInstrument.hardwareEnvelopeRatio > 0) {
                    // Formula: EP = TP / (16 * Ratio)
                    hwEnv.periodSetting = Math.max(1, Math.round(this.channelCurrentPeriod[channel]! / (16 * currentInstrument.hardwareEnvelopeRatio)));
                }

                hwEnv.periodCounter--;
                // MSX PSG envelope generator changes every 256 * EP clock cycles
                const ticksPerEnvelopeStep = Math.max(1, Math.round(((256 * hwEnv.periodSetting) / AY_CLOCK_FREQUENCY) / (this.effectsUpdateIntervalMs / 1000.0)));

                if (hwEnv.periodCounter <= 0) {
                    hwEnv.periodCounter = ticksPerEnvelopeStep;
                    if (hwEnv.attack) { hwEnv.currentLevel = Math.min(15, hwEnv.stepCounter); }
                    else { hwEnv.currentLevel = Math.max(0, 15 - hwEnv.stepCounter); }
                    hwEnv.stepCounter++;

                    if (hwEnv.stepCounter >= 16) {
                        if (hwEnv.repeat) {
                            hwEnv.stepCounter = 0;
                            if (hwEnv.alternate) { hwEnv.attack = !hwEnv.attack; }
                            else { hwEnv.attack = (hwEnv.shape & 0b0100) !== 0; }
                            hwEnv.currentLevel = hwEnv.attack ? 0 : 15;
                        } else {
                            hwEnv.currentLevel = hwEnv.hold ? hwEnv.currentLevel : 0;
                            hwEnv.finished = true;
                        }
                    }
                }
            }
            finalVolume15 = Math.round(hwEnv.currentLevel * hwEnv.peakVolumeRatio);
        } else if (this.channelSoftwareVolumeEnvelopeState[channel]) {
            const swEnvState = this.channelSoftwareVolumeEnvelopeState[channel]!;
            if (swEnvState.currentStep < swEnvState.envelope.length) {
                if (shouldAdvanceEnvelope) {
                    // Normalize 0-127 range to 0-15 (AY hardware volume range)
                    const rawEnvValue = swEnvState.envelope[swEnvState.currentStep];
                    finalVolume15 = Math.round((Math.max(0, rawEnvValue) / 127) * 15);
                    swEnvState.currentStep++;
                    if (swEnvState.currentStep >= swEnvState.envelope.length) {
                        if (swEnvState.loopPosition !== undefined && swEnvState.loopPosition >= 0 && swEnvState.loopPosition < swEnvState.envelope.length) {
                            swEnvState.currentStep = swEnvState.loopPosition;
                        }
                        // If no loop, envelope will finish and volume will go to 0 on next update
                    }
                } else {
                    // Not time to advance yet, use current step's value
                    const rawEnvValue = swEnvState.envelope[Math.max(0, swEnvState.currentStep - 1)];
                    finalVolume15 = Math.round((Math.max(0, rawEnvValue) / 127) * 15);
                }
            } else {
                // Envelope has finished and there's no loop (or loop is invalid)
                finalVolume15 = 0;
            }
        } else {
            finalVolume15 = this.channelBaseVolumeForEffects[channel];
        }

        finalVolume15 = Math.max(0, Math.min(15, Math.round(finalVolume15)));
        // Use AY-3-8910 logarithmic DAC table for authentic volume curve
        const finalGainRatio = AY_DAC_TABLE[finalVolume15];
        this.channelMainGains[channel]!.gain.setTargetAtTime(Math.max(0, Math.min(finalGainRatio, 1.0)), this.audioContext.currentTime, 0.005);
    }

    /**
     * Sets the master volume for the synthesizer.
     * @param volumeLevel The volume level, a value between 0.0 and 1.0.
     */
    public setMasterVolume(volumeLevel: number): void {
        this.currentMasterVolume = Math.max(0, Math.min(volumeLevel, 1.0));
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
        }
    }

    /**
     * Stops all currently playing notes on all channels.
     */
    public stopAllNotes(): void {
        for (let i = 0; i < 3; i++) {
            const ch = i as 0 | 1 | 2;
            this.stopChannelSound(ch, true);
            this.channelBasePeriod[ch] = null;
            this.channelCurrentPeriod[ch] = null;
            this.channelActiveInstrument[ch] = null;
            this.channelHardwareEnvelopeState[ch] = null;
            this.channelSoftwareVolumeEnvelopeState[ch] = null;
            this.channelSoftwareToneEnvelopeState[ch] = null;
            this.channelOrnamentState[ch] = null;
            this.channelBaseVolumeForEffects[ch] = 15;
            this.envelopeTickCounters[ch] = 0;
            if (this.channelMainGains[ch] && this.audioContext) {
                this.channelMainGains[ch]!.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.channelMainGains[ch]!.gain.setValueAtTime(0, this.audioContext.currentTime);
                this.channelMainGains[ch]!.disconnect();
                this.channelMainGains[ch] = null;
            }
        }
    }

    /**
     * Closes the audio context and releases all resources.
     */
    public async closeContext(): Promise<void> {
        this.stopAllNotes();
        if (this.effectsUpdateIntervalId !== null) {
            clearInterval(this.effectsUpdateIntervalId);
            this.effectsUpdateIntervalId = null;
        }
        if (this.audioContext) {
            try {
                await this.audioContext.close();
            } catch (e) {
                console.error("Error closing AudioContext:", e);
            } finally {
                this.audioContext = null;
                this.masterGain = null;
                this.noiseBuffer = null;
                this.isInitialized = false;
            }
        }
    }
}
