import { getFrequencyForNoteString } from './noteFrequencies';
import { SCCInstrument, TrackerSongData } from '../../types';

const SCC_CLOCK_FREQUENCY = 3579545; // 3.58 MHz

export class SCCSynthesizer {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private channelGains: (GainNode | null)[] = [null, null, null, null, null];
    private channelSources: (AudioBufferSourceNode | null)[] = [null, null, null, null, null];

    private isInitialized = false;
    private currentMasterVolume = 0.5;
    private songDataRef: TrackerSongData | null = null;

    private channelSoftwareVolumeEnvelopeState: ({ envelope: number[], loopPosition?: number, currentStep: number } | null)[] = [null, null, null, null, null];
    private effectsUpdateIntervalId: number | null = null;
    private channelBaseVolumeForEffects: number[] = [15, 15, 15, 15, 15];
    private channelActiveInstrument: (SCCInstrument | null)[] = [null, null, null, null, null];
    private channelCurrentPeriod: (number | null)[] = [null, null, null, null, null];

    constructor(initialMasterVolume: number = 0.5) {
        this.currentMasterVolume = Math.max(0, Math.min(initialMasterVolume, 1.0));
        this.startEffectsLoop();
    }

    public setSongData(songData: TrackerSongData): void {
        this.songDataRef = songData;
    }

    public async ensureAudioContext(): Promise<boolean> {
        if (!this.isInitialized) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
                this.masterGain.connect(this.audioContext.destination);
                this.isInitialized = true;
                this.startEffectsLoop();
            } catch (e) {
                console.error("Error initializing AudioContext:", e);
                this.isInitialized = false;
                return false;
            }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Ensure effects loop is running (it might have been stopped by stopAllNotes)
        if (!this.effectsUpdateIntervalId) {
            this.startEffectsLoop();
        }

        return this.isInitialized && this.audioContext !== null;
    }

    private startEffectsLoop() {
        if (this.effectsUpdateIntervalId) clearInterval(this.effectsUpdateIntervalId);
        this.effectsUpdateIntervalId = window.setInterval(() => {
            this.updateEffects();
        }, 1000 / 50); // 50Hz update rate
    }

    private updateEffects() {
        if (!this.audioContext || !this.masterGain) return;

        for (let ch = 0; ch < 5; ch++) {
            const channel = ch as 0 | 1 | 2 | 3 | 4;
            let currentVolume = this.channelBaseVolumeForEffects[channel];
            let shouldStop = false;

            // Process Software Envelope
            const envState = this.channelSoftwareVolumeEnvelopeState[channel];
            if (envState) {
                if (envState.currentStep < envState.envelope.length) {
                    currentVolume = envState.envelope[envState.currentStep];
                    envState.currentStep++;
                } else if (envState.loopPosition !== undefined && envState.loopPosition >= 0 && envState.loopPosition < envState.envelope.length) {
                    envState.currentStep = envState.loopPosition;
                    currentVolume = envState.envelope[envState.currentStep];
                    envState.currentStep++;
                } else {
                    currentVolume = 0;
                    shouldStop = true; // Envelope finished and no loop, stop the sound
                }
            }

            // Apply volume
            if (this.channelGains[channel]) {
                if (!Number.isFinite(currentVolume)) currentVolume = 0;
                currentVolume = Math.max(0, Math.min(15, currentVolume));

                try {
                    this.channelGains[channel]!.gain.cancelScheduledValues(this.audioContext.currentTime);
                    this.channelGains[channel]!.gain.setValueAtTime(currentVolume / 15.0, this.audioContext.currentTime);
                } catch (e) {
                    // Ignore errors if context is closed/invalid
                }
            }

            if (shouldStop) {
                this.stopChannel(channel);
            }
        }
    }

    private getFrequencyFromPeriod(period: number | null): number | null {
        if (period === null || period < 0) return 0;
        // SCC Frequency formula: F = Clock / (32 * (Period + 1))
        return SCC_CLOCK_FREQUENCY / (32 * (period + 1));
    }

    private getNotePeriod(noteString: string | null): number | null {
        const freq = getFrequencyForNoteString(noteString);
        if (freq === null || freq <= 0) return null;
        // Period = (Clock / (32 * Freq)) - 1
        return Math.round((SCC_CLOCK_FREQUENCY / (32 * freq)) - 1);
    }

    private createWaveformBuffer(waveform: number[]): AudioBuffer | null {
        if (!this.audioContext) return null;

        const buffer = this.audioContext.createBuffer(1, 32, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < 32; i++) {
            const val = waveform[i] !== undefined ? waveform[i] : 0;
            data[i] = val / 8.0;
        }

        return buffer;
    }

    private stopChannel(channel: number) {
        if (this.channelSources[channel]) {
            try { this.channelSources[channel]!.stop(); } catch (e) { }
            this.channelSources[channel]!.disconnect();
            this.channelSources[channel] = null;
        }
        if (this.channelGains[channel]) {
            this.channelGains[channel]!.disconnect();
            this.channelGains[channel] = null;
        }
        this.channelSoftwareVolumeEnvelopeState[channel] = null;
    }

    public async playNote(
        channel: 0 | 1 | 2 | 3 | 4,
        noteStringFromCell: string | null,
        instrumentIdFromCell: number | null,
        ornamentIdFromCell: number | null,
        volumeFromCell: number | null
    ): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext || !this.masterGain) return;

        const isNoteCut = noteStringFromCell === "===";
        const isKeepNote = noteStringFromCell === "---" || noteStringFromCell === null;
        const isNewActualNote = !isNoteCut && !isKeepNote;

        if (isNoteCut) {
            this.stopChannel(channel);
            // Do not clear active instrument, so subsequent "---" or notes without instr use the last one.
            return;
        }

        // Update Instrument or Refresh Reference
        if (this.songDataRef) {
            let instrumentId = instrumentIdFromCell;

            // If no explicit instrument in cell, try to use the current one's ID to refresh it (to get latest edits)
            if ((instrumentId === null || instrumentId === 0) && this.channelActiveInstrument[channel]) {
                instrumentId = this.channelActiveInstrument[channel]!.id;
            }

            if (instrumentId !== null && instrumentId > 0) {
                const newInstrument = this.songDataRef.instruments.find(i => i.id === instrumentId) as SCCInstrument;
                if (newInstrument) {
                    this.channelActiveInstrument[channel] = newInstrument;
                }
            }
        }

        // Determine Base Volume
        let volume = 15;
        if (volumeFromCell !== null && volumeFromCell !== undefined) {
            volume = volumeFromCell;
        } else if (this.channelActiveInstrument[channel]?.volume !== undefined) {
            volume = this.channelActiveInstrument[channel]!.volume!;
        }
        if (!Number.isFinite(volume)) volume = 15;
        this.channelBaseVolumeForEffects[channel] = volume;

        // Initialize Envelope if new note
        if (isNewActualNote) {
            const instrument = this.channelActiveInstrument[channel];
            if (instrument && instrument.volumeEnvelope && instrument.volumeEnvelope.length > 0) {
                this.channelSoftwareVolumeEnvelopeState[channel] = {
                    envelope: instrument.volumeEnvelope,
                    loopPosition: instrument.volumeLoop,
                    currentStep: 0
                };
            } else {
                this.channelSoftwareVolumeEnvelopeState[channel] = null;
            }
        }

        // Apply volume (initial)
        if (!this.channelGains[channel]) {
            this.channelGains[channel] = this.audioContext.createGain();
            this.channelGains[channel]!.connect(this.masterGain);
        }
        // Immediate volume set is handled by updateEffects loop, but we can set initial here to avoid lag
        // Actually, let's let the loop handle it or set it once here.
        // If we have an envelope, the first value should be applied.
        let initialVol = volume;
        if (this.channelSoftwareVolumeEnvelopeState[channel]) {
            initialVol = this.channelSoftwareVolumeEnvelopeState[channel]!.envelope[0];
        }
        this.channelGains[channel]!.gain.setValueAtTime(initialVol / 15.0, this.audioContext.currentTime);


        // Play Note
        if (isNewActualNote || (isKeepNote && this.channelActiveInstrument[channel] && !this.channelSources[channel])) {
            const period = this.getNotePeriod(noteStringFromCell);
            if (period !== null) {
                this.channelCurrentPeriod[channel] = period;

                const instrument = this.channelActiveInstrument[channel];
                if (instrument) {
                    // Stop previous source if any
                    if (this.channelSources[channel]) {
                        try { this.channelSources[channel]!.stop(); } catch (e) { }
                        this.channelSources[channel]!.disconnect();
                        this.channelSources[channel] = null;
                    }

                    // Recreate Gain if needed (it shouldn't be null here but safe check)
                    if (!this.channelGains[channel]) {
                        this.channelGains[channel] = this.audioContext.createGain();
                        this.channelGains[channel]!.connect(this.masterGain);
                        this.channelGains[channel]!.gain.setValueAtTime(initialVol / 15.0, this.audioContext.currentTime);
                    }

                    const buffer = this.createWaveformBuffer(instrument.waveform);
                    if (buffer) {
                        const source = this.audioContext.createBufferSource();
                        source.buffer = buffer;
                        source.loop = true;

                        const freq = this.getFrequencyFromPeriod(period);
                        if (freq) {
                            const baseFreq = this.audioContext.sampleRate / 32;
                            source.playbackRate.value = freq / baseFreq;
                        }

                        source.connect(this.channelGains[channel]!);
                        source.start();
                        this.channelSources[channel] = source;
                    }
                }
            }
        } else if (isKeepNote && this.channelSources[channel] && this.channelCurrentPeriod[channel]) {
            // Just updating volume (handled by loop)
        }
    }

    public stopAllNotes(): void {
        for (let i = 0; i < 5; i++) {
            this.stopChannel(i);
        }
        if (this.effectsUpdateIntervalId) {
            clearInterval(this.effectsUpdateIntervalId);
            this.effectsUpdateIntervalId = null;
        }
    }

    public setMasterVolume(volume: number): void {
        this.currentMasterVolume = volume;
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    public closeContext(): void {
        this.stopAllNotes();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
