import { getFrequencyForNoteString } from './noteFrequencies';
import { SCCInstrument, TrackerSongData } from '../../types';

const SCC_CLOCK_FREQUENCY = 3579545; // 3.58 MHz
const SCC_WAVE_SIZE = 32;

// Approximate SCC (K051649) 4-bit volume curve, normalized to 1.0 peak.
const SCC_VOLUME_TABLE = [
    0.0, 0.0079, 0.0112, 0.0158,
    0.0224, 0.0316, 0.0447, 0.0631,
    0.0891, 0.1258, 0.1778, 0.2512,
    0.3548, 0.5012, 0.7079, 1.0
] as const;

export class SCCSynthesizer {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private channelGains: (GainNode | null)[] = [null, null, null, null, null];
    private channelPanners: (StereoPannerNode | null)[] = [null, null, null, null, null];
    private channelSources: (AudioBufferSourceNode | null)[] = [null, null, null, null, null];

    private isInitialized = false;
    private currentMasterVolume = 0.3;
    private songDataRef: TrackerSongData | null = null;

    // Scale down the master volume to prevent clipping when multiple channels are active
    private readonly MASTER_VOLUME_SCALE = 0.25;

    private channelSoftwareVolumeEnvelopeState: ({ envelope: number[], loopPosition?: number, currentStep: number } | null)[] = [null, null, null, null, null];
    private effectsUpdateIntervalId: number | null = null;
    private channelBaseVolumeForEffects: number[] = [15, 15, 15, 15, 15];
    private channelActiveInstrument: (SCCInstrument | null)[] = [null, null, null, null, null];
    private channelCurrentPeriod: (number | null)[] = [null, null, null, null, null];
    private channelSilentTickCounter: number[] = [0, 0, 0, 0, 0];
    // Pitch effects (mirror the ROM driver): arpeggio via ornament semitone
    // offsets, and a per-instrument triangle-LFO vibrato. Re-applied to the
    // source playbackRate every effects tick so the preview matches the ROM.
    private channelOrnamentState: ({ data: number[], loop: number, step: number } | null)[] = [null, null, null, null, null];
    private channelVibrato: ({ depth: number, speed: number, delay: number, phase: number, ctr: number } | null)[] = [null, null, null, null, null];
    private channelBaseFrequency: (number | null)[] = [null, null, null, null, null];
    // SCC original has one physical waveform RAM shared by logical channels 4/5.
    private sharedOriginalWaveform: number[] | null = null;

    // Default stereo panning positions for the 5 channels to create a wide field
    // Ch 1: Left-Mid (-0.5), Ch 2: Right-Mid (0.5), Ch 3: Center (0), Ch 4: Left (-0.8), Ch 5: Right (0.8)
    private readonly CHANNEL_PANNING = [-0.5, 0.5, 0, -0.8, 0.8];

    constructor(initialMasterVolume: number = 0.3) {
        this.currentMasterVolume = Math.max(0, Math.min(initialMasterVolume, 1.0)) * this.MASTER_VOLUME_SCALE;
        this.startEffectsLoop();
    }

    public setSongData(songData: TrackerSongData): void {
        this.songDataRef = songData;
    }

    public getSongData(): TrackerSongData | null {
        return this.songDataRef;
    }

    public async ensureAudioContext(): Promise<boolean> {
        if (!this.isInitialized) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                // Create Compressor to prevent clipping
                this.compressor = this.audioContext.createDynamicsCompressor();
                this.compressor.threshold.setValueAtTime(-10, this.audioContext.currentTime);
                this.compressor.knee.setValueAtTime(40, this.audioContext.currentTime);
                this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
                this.compressor.attack.setValueAtTime(0, this.audioContext.currentTime);
                this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
                this.compressor.connect(this.audioContext.destination);

                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
                this.masterGain.connect(this.compressor);

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
                } else if (envState.envelope.length > 0) {
                    // Native ROM export holds the last envelope value when
                    // volumeLoop is absent/#FF; mirror that hardware behavior.
                    currentVolume = envState.envelope[envState.envelope.length - 1];
                    envState.currentStep = envState.envelope.length;
                }
            }

            // Apply volume
            if (this.channelGains[channel]) {
                if (!Number.isFinite(currentVolume)) currentVolume = 0;
                currentVolume = Math.max(0, Math.min(15, currentVolume));

                try {
                    // Use setTargetAtTime for smoother volume transitions (avoids clicks)
                    this.channelGains[channel]!.gain.setTargetAtTime(this.getVolumeFactor(currentVolume), this.audioContext.currentTime, 0.005);
                } catch (e) {
                    // Ignore errors if context is closed/invalid
                }
            }

            // Apply pitch effects (arpeggio + vibrato) — mirrors the ROM's
            // per-frame pitch engine so the preview matches the exported song.
            this.applyPitchEffects(channel);

            if (!envState) {
                if (currentVolume <= 0) {
                    this.channelSilentTickCounter[channel] = Math.min(this.channelSilentTickCounter[channel] + 1, 10);
                } else {
                    this.channelSilentTickCounter[channel] = 0;
                }
            } else {
                this.channelSilentTickCounter[channel] = 0;
            }

            if (this.channelSilentTickCounter[channel] >= 2 && this.channelSources[channel]) {
                this.stopChannel(channel);
            }
        }
    }

    private getVolumeFactor(volume: number): number {
        const clamped = Math.max(0, Math.min(15, Math.round(volume)));
        return SCC_VOLUME_TABLE[clamped] ?? 0;
    }

    // Triangle LFO for vibrato: phase 0..255 -> -1..+1.
    private triangleLfo(phase: number): number {
        const p = (phase & 0xff) / 255;
        return p < 0.5 ? (p * 4 - 1) : (3 - p * 4);
    }

    // Re-derives a channel's playback rate from its base note plus the current
    // arpeggio (ornament) semitone offset and vibrato, matching the ROM's
    // per-frame pitch engine. Runs at the 50Hz effects rate.
    private applyPitchEffects(channel: number): void {
        const source = this.channelSources[channel];
        const base = this.channelBaseFrequency[channel];
        if (!source || base === null || !this.audioContext) return;

        let semitoneOffset = 0;
        const orn = this.channelOrnamentState[channel];
        if (orn && orn.data.length > 0) {
            let step = orn.step;
            if (step >= orn.data.length) {
                step = (orn.loop >= 0 && orn.loop < orn.data.length) ? orn.loop : orn.data.length - 1;
            }
            semitoneOffset += orn.data[step] || 0;
            orn.step = step + 1;
        }

        let vibratoCents = 0;
        const vib = this.channelVibrato[channel];
        if (vib && vib.depth > 0) {
            if (vib.ctr > 0) {
                vib.ctr--;
            } else {
                vib.phase = (vib.phase + vib.speed) & 0xff;
                // depth 1..5 -> ~+-8..+-40 cents peak (subtle to strong)
                vibratoCents = this.triangleLfo(vib.phase) * vib.depth * 8;
            }
        }

        const freq = base * Math.pow(2, semitoneOffset / 12) * Math.pow(2, vibratoCents / 1200);
        try {
            source.playbackRate.setTargetAtTime(
                freq / (this.audioContext.sampleRate / SCC_WAVE_SIZE),
                this.audioContext.currentTime,
                0.003
            );
        } catch (e) {
            // Ignore if context is closed/invalid
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

    private sanitizeWaveform(waveform: number[]): number[] {
        const padded = [...waveform, ...Array(SCC_WAVE_SIZE - waveform.length).fill(0)].slice(0, SCC_WAVE_SIZE);
        const clamped = padded.map(v => {
            if (!Number.isFinite(v)) return 0;
            return Math.max(-128, Math.min(127, Math.round(v)));
        });
        return clamped;
    }

    private createWaveformBuffer(waveform: number[]): AudioBuffer | null {
        if (!this.audioContext) return null;

        const sanitized = this.sanitizeWaveform(waveform);
        const buffer = this.audioContext.createBuffer(1, SCC_WAVE_SIZE, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < SCC_WAVE_SIZE; i++) {
            const val = sanitized[i] !== undefined ? sanitized[i] : 0;
            // Divide by 128.0 for 8-bit range (-128 to 127)
            data[i] = val / 128.0;
        }

        return buffer;
    }

    private restartChannelSourceWithWaveform(channel: number, waveform: number[]): void {
        if (!this.audioContext || !this.channelGains[channel]) return;
        const period = this.channelCurrentPeriod[channel];
        if (period === null) return;

        if (this.channelSources[channel]) {
            try { this.channelSources[channel]!.stop(); } catch (e) { }
            this.channelSources[channel]!.disconnect();
            this.channelSources[channel] = null;
        }

        const buffer = this.createWaveformBuffer(waveform);
        if (!buffer) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const frequency = this.getFrequencyFromPeriod(period);
        if (frequency) {
            source.playbackRate.value = frequency / (this.audioContext.sampleRate / SCC_WAVE_SIZE);
        }
        source.connect(this.channelGains[channel]!);
        source.start();
        this.channelSources[channel] = source;
    }

    private stopChannel(channel: number) {
        if (this.channelSources[channel]) {
            try { this.channelSources[channel]!.stop(); } catch (e) { }
            this.channelSources[channel]!.disconnect();
            this.channelSources[channel] = null;
        }
        if (this.channelGains[channel]) {
            try { this.channelGains[channel]!.gain.cancelScheduledValues(0); } catch (e) { }
            this.channelGains[channel]!.disconnect();
            this.channelGains[channel] = null;
        }
        if (this.channelPanners[channel]) {
            this.channelPanners[channel]!.disconnect();
            this.channelPanners[channel] = null;
        }
        this.channelSoftwareVolumeEnvelopeState[channel] = null;
        this.channelCurrentPeriod[channel] = null;
        this.channelBaseVolumeForEffects[channel] = 0;
        this.channelSilentTickCounter[channel] = 0;
        this.channelOrnamentState[channel] = null;
        this.channelVibrato[channel] = null;
        this.channelBaseFrequency[channel] = null;
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
        let loadedExplicitInstrument = false;
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
                    loadedExplicitInstrument = instrumentIdFromCell !== null && instrumentIdFromCell > 0;
                }
            }
        }

        if (loadedExplicitInstrument && channel >= 3 && this.channelActiveInstrument[channel]) {
            this.sharedOriginalWaveform = this.sanitizeWaveform(this.channelActiveInstrument[channel]!.waveform);
            const peer = channel === 3 ? 4 : 3;
            if (this.channelSources[peer]) {
                this.restartChannelSourceWithWaveform(peer, this.sharedOriginalWaveform);
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

            // Vibrato from the active instrument (restarts on every note).
            if (instrument && (instrument.vibratoDepth ?? 0) > 0) {
                this.channelVibrato[channel] = {
                    depth: instrument.vibratoDepth ?? 0,
                    speed: instrument.vibratoSpeed ?? 16,
                    delay: instrument.vibratoDelay ?? 0,
                    phase: 0,
                    ctr: instrument.vibratoDelay ?? 0,
                };
            } else {
                this.channelVibrato[channel] = null;
            }
        }

        // Arpeggio ornament: 0 clears, an id selects, null keeps but restarts.
        if (ornamentIdFromCell === 0) {
            this.channelOrnamentState[channel] = null;
        } else if (ornamentIdFromCell !== null && ornamentIdFromCell !== undefined && this.songDataRef) {
            const orn = (this.songDataRef.ornaments || []).find(o => o.id === ornamentIdFromCell);
            if (orn && Array.isArray(orn.data) && orn.data.length > 0) {
                this.channelOrnamentState[channel] = {
                    data: orn.data.slice(),
                    loop: typeof orn.loopPosition === 'number' && orn.loopPosition >= 0 ? orn.loopPosition : 0,
                    step: 0,
                };
            }
        } else if (isNewActualNote && this.channelOrnamentState[channel]) {
            this.channelOrnamentState[channel]!.step = 0;
        }

        // Apply volume (initial)
        if (!this.channelGains[channel]) {
            this.channelGains[channel] = this.audioContext.createGain();
            // Connect Gain -> Panner -> Master
            if (!this.channelPanners[channel]) {
                this.channelPanners[channel] = this.audioContext.createStereoPanner();
                this.channelPanners[channel]!.pan.setValueAtTime(this.CHANNEL_PANNING[channel], this.audioContext.currentTime);
                this.channelPanners[channel]!.connect(this.masterGain);
            }
            this.channelGains[channel]!.connect(this.channelPanners[channel]!);
        }

        let initialVol = volume;
        if (this.channelSoftwareVolumeEnvelopeState[channel]) {
            initialVol = this.channelSoftwareVolumeEnvelopeState[channel]!.envelope[0];
        }
        // Use setTargetAtTime for initial volume as well to be consistent, though setValueAtTime is ok here for immediate start
        this.channelGains[channel]!.gain.setValueAtTime(this.getVolumeFactor(initialVol), this.audioContext.currentTime);


        // Play Note
        if (isNewActualNote || (isKeepNote && this.channelActiveInstrument[channel] && !this.channelSources[channel])) {
            const period = this.getNotePeriod(noteStringFromCell);
            if (period !== null) {
                this.channelCurrentPeriod[channel] = period;
                // Base frequency for the pitch engine (arpeggio/vibrato modulate this).
                this.channelBaseFrequency[channel] = this.getFrequencyFromPeriod(period);

                const instrument = this.channelActiveInstrument[channel];
                if (instrument) {
                    // Stop previous source if any
                    if (this.channelSources[channel]) {
                        try { this.channelSources[channel]!.stop(); } catch (e) { }
                        this.channelSources[channel]!.disconnect();
                        this.channelSources[channel] = null;
                    }

                    // Recreate Gain/Panner if needed
                    if (!this.channelGains[channel]) {
                        this.channelGains[channel] = this.audioContext.createGain();
                        if (!this.channelPanners[channel]) {
                            this.channelPanners[channel] = this.audioContext.createStereoPanner();
                            this.channelPanners[channel]!.pan.setValueAtTime(this.CHANNEL_PANNING[channel], this.audioContext.currentTime);
                            this.channelPanners[channel]!.connect(this.masterGain);
                        }
                        this.channelGains[channel]!.connect(this.channelPanners[channel]!);
                        this.channelGains[channel]!.gain.setValueAtTime(this.getVolumeFactor(initialVol), this.audioContext.currentTime);
                    }

                    const effectiveWaveform = channel >= 3
                        ? (this.sharedOriginalWaveform ?? instrument.waveform)
                        : instrument.waveform;
                    this.restartChannelSourceWithWaveform(channel, effectiveWaveform);
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
        this.sharedOriginalWaveform = null;
    }

    public async previewInstrument(instrument: SCCInstrument, noteString: string = 'C-4'): Promise<void> {
        if (!instrument) return;
        if (!await this.ensureAudioContext()) return;

        // Ensure we only keep one preview voice active
        this.stopChannel(0);

        this.channelActiveInstrument[0] = instrument;
        this.channelBaseVolumeForEffects[0] = instrument.volume ?? 15;

        await this.playNote(0, noteString, instrument.id ?? null, null, instrument.volume ?? null);
    }

    public setMasterVolume(volume: number): void {
        this.currentMasterVolume = Math.max(0, Math.min(volume, 1.0)) * this.MASTER_VOLUME_SCALE;
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
        }
    }

    public closeContext(): void {
        this.stopAllNotes();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.masterGain = null;
            this.compressor = null;
        }
    }
}
