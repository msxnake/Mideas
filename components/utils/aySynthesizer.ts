// components/utils/aySynthesizer.ts
import { getFrequencyForNoteString } from './noteFrequencies';
import { PT3Instrument, PT3Ornament, TrackerSongData } from '../../types';
import { PT3_NOTE_NAMES } from '../../constants';

const AY_CLOCK_FREQUENCY = 3579545 / 2; // Approx 1.7897725 MHz for MSX

interface HardwareEnvelopeState {
    shape: number;
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

interface SoftwareVolumeEnvelopeState {
    envelope: number[];
    loopPosition?: number;
    currentStep: number;
}

interface OrnamentState {
    ornament: PT3Ornament;
    currentStep: number;
    tickCounter: number;
}


export class AYSynthesizer {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    
    private toneOscillators: (OscillatorNode | null)[] = [null, null, null];
    private channelMainGains: (GainNode | null)[] = [null, null, null];
    
    private noiseBuffer: AudioBuffer | null = null;
    private noiseSources: (AudioBufferSourceNode | null)[] = [null, null, null];

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
    private channelOrnamentState: (OrnamentState | null)[] = [null, null, null];
    
    private channelBaseVolumeForEffects: number[] = [15, 15, 15]; // Default full volume
    private channelActiveInstrument: (PT3Instrument | null)[] = [null, null, null]; // Tracks the last set instrument


    constructor(initialMasterVolume: number = 0.5) {
        this.currentMasterVolume = Math.max(0, Math.min(initialMasterVolume, 1.0));
    }

    public setSongData(songData: TrackerSongData): void {
        this.songDataRef = songData;
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

    public async ensureAudioContext(): Promise<boolean> {
        if (!this.isInitialized) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
                this.masterGain.connect(this.audioContext.destination);

                const bufferSize = this.audioContext.sampleRate * 0.5; 
                this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const output = this.noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
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
            try { this.toneOscillators[channel]!.stop(); } catch (e) {}
            this.toneOscillators[channel]!.disconnect();
            this.toneOscillators[channel] = null;
        }
    }
    
    private stopNoiseSource(channel: 0 | 1 | 2) {
        if (this.noiseSources[channel]) {
            try { this.noiseSources[channel]!.stop(); } catch (e) {}
            this.noiseSources[channel]!.disconnect();
            this.noiseSources[channel] = null;
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
    
        const useHardwareEnv = instrument.ayEnvelopeShape !== undefined && instrument.ayEnvelopeShape >= 0 && instrument.ayEnvelopeShape <= 15;
        const useSoftwareEnv = instrument.volumeEnvelope && instrument.volumeEnvelope.length > 0;
    
        if (useHardwareEnv && this.songDataRef) {
            const shape = instrument.ayEnvelopeShape!;
            // Peak volume for HW env is based on the channel's current base volume
            const peakVolRatioForHwEnv = this.channelBaseVolumeForEffects[channel] / 15.0;
            this.channelHardwareEnvelopeState[channel] = {
                shape, periodSetting: this.songDataRef.ayHardwareEnvelopePeriod || 1,
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

    private setupNoiseSource(channel: 0 | 1 | 2) {
        if (!this.audioContext || !this.noiseBuffer || !this.channelMainGains[channel]) return;
        this.stopNoiseSource(channel);
        const noiseSourceNode = this.audioContext.createBufferSource();
        noiseSourceNode.buffer = this.noiseBuffer;
        noiseSourceNode.loop = true;
        noiseSourceNode.connect(this.channelMainGains[channel]!);
        try { noiseSourceNode.start(); } catch (e) { console.error("Error starting noise source:", e); }
        this.noiseSources[channel] = noiseSourceNode;
    }


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
            this.channelOrnamentState[channel] = null;
            this.channelBaseVolumeForEffects[channel] = 0;
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
            this.channelOrnamentState[channel] = null;
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
                    this.setupNoiseSource(channel);
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

        if (this.channelOrnamentState[channel] && baseFundamentalPeriod !== null) {
            const ornState = this.channelOrnamentState[channel]!;
            ornState.tickCounter++;
            const ornamentSpeedFactor = Math.max(1, Math.floor((this.songDataRef?.speed || 6) / 2)); 
            if (ornState.tickCounter >= ornamentSpeedFactor) {
                ornState.tickCounter = 0;
                
                const ornamentData = ornState.ornament.data;
                const pitchOffsetHalfSteps = ornamentData[ornState.currentStep];

                const baseFreq = this.getFrequencyFromPeriod(baseFundamentalPeriod);
                if (baseFreq && baseFreq > 0) {
                    const ornamentedFreq = baseFreq * Math.pow(2, pitchOffsetHalfSteps / 12.0);
                    periodForFrequencyUpdate = Math.max(1, Math.min(4095, Math.round(AY_CLOCK_FREQUENCY / (16 * ornamentedFreq))));
                } else {
                     periodForFrequencyUpdate = baseFundamentalPeriod;
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
        } else if (baseFundamentalPeriod !== null) {
            periodForFrequencyUpdate = baseFundamentalPeriod;
        }
        
        if (periodForFrequencyUpdate !== this.channelCurrentPeriod[channel]) {
            this.channelCurrentPeriod[channel] = periodForFrequencyUpdate;
        }
        
        if (this.toneOscillators[channel] && this.channelCurrentPeriod[channel] !== null) {
            const freqToPlay = this.getFrequencyFromPeriod(this.channelCurrentPeriod[channel]);
            if (freqToPlay && freqToPlay > 0) {
                this.toneOscillators[channel]!.frequency.setTargetAtTime(Math.min(freqToPlay, this.audioContext.sampleRate / 2), this.audioContext.currentTime, 0.001); 
            } else {
                this.stopToneOscillator(channel);
            }
        }

        let finalVolume15: number;
        if (this.channelHardwareEnvelopeState[channel]) {
            const hwEnv = this.channelHardwareEnvelopeState[channel]!;
            if (!hwEnv.finished) {
                hwEnv.periodCounter--;
                const ticksPerEnvelopeStep = Math.max(1, Math.round( ((16 * (this.songDataRef?.ayHardwareEnvelopePeriod || 1)) / AY_CLOCK_FREQUENCY) / (this.effectsUpdateIntervalMs / 1000.0) ));

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
                finalVolume15 = swEnvState.envelope[swEnvState.currentStep];
                swEnvState.currentStep++;
                if (swEnvState.currentStep >= swEnvState.envelope.length) { 
                    if (swEnvState.loopPosition !== undefined && swEnvState.loopPosition < swEnvState.envelope.length) {
                        swEnvState.currentStep = swEnvState.loopPosition; 
                    }
                }
            } else if (swEnvState.envelope.length > 0) {
                finalVolume15 = swEnvState.envelope[swEnvState.envelope.length - 1];
            } else {
                finalVolume15 = 0;
            }
        } else {
            finalVolume15 = this.channelBaseVolumeForEffects[channel]; 
        }

        finalVolume15 = Math.max(0, Math.min(15, Math.round(finalVolume15)));
        const finalGainRatio = finalVolume15 / 15.0;
        this.channelMainGains[channel]!.gain.setTargetAtTime(Math.max(0, Math.min(finalGainRatio, 1.0)), this.audioContext.currentTime, 0.005); 
    }

    public setMasterVolume(volumeLevel: number): void {
        this.currentMasterVolume = Math.max(0, Math.min(volumeLevel, 1.0));
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.audioContext.currentTime);
        }
    }

    public stopAllNotes(): void {
        for (let i = 0; i < 3; i++) {
            const ch = i as 0 | 1 | 2;
            this.stopChannelSound(ch, true);
            this.channelBasePeriod[ch] = null;
            this.channelCurrentPeriod[ch] = null;
            this.channelActiveInstrument[ch] = null;
            this.channelHardwareEnvelopeState[ch] = null;
            this.channelSoftwareVolumeEnvelopeState[ch] = null;
            this.channelOrnamentState[ch] = null;
            this.channelBaseVolumeForEffects[ch] = 15;
             if (this.channelMainGains[ch] && this.audioContext) {
                this.channelMainGains[ch]!.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.channelMainGains[ch]!.gain.setValueAtTime(0, this.audioContext.currentTime);
                this.channelMainGains[ch]!.disconnect();
                this.channelMainGains[ch] = null;
            }
        }
    }

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
