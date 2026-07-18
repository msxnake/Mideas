import { TrackerSongData } from '../../types';
import { AYRegisterSynthesizer } from './ayRegisterSynthesizer';
import { SCCSynthesizer } from './sccSynthesizer';
import { isSccInstrument } from './trackerUtils';

/** Channel count of the PSG block (columns A-C) in a dual-chip song. */
export const DUAL_PSG_CHANNEL_COUNT = 3;
/** Channel count of the SCC block (columns 1-5) in a dual-chip song. */
export const DUAL_SCC_CHANNEL_COUNT = 5;

/**
 * PC-preview synthesizer for 'PSG+SCC' dual-chip songs. Mirrors the tracker
 * composer's synthesizer interface and routes channel indices 0-2 to the AY
 * synthesizer and 3-7 to the SCC synthesizer, exactly like the MSX runtime
 * splits the song across both chips.
 *
 * Instrument ids live in per-chip namespaces (a dual song may have PSG
 * instrument 1 AND SCC instrument 1): each sub-synth receives a song view
 * containing only its own chip's instruments, so id lookups cannot cross.
 */
export class DualChipSynthesizer {
  private psg: AYRegisterSynthesizer;
  private scc: SCCSynthesizer;
  private sccEnabled: boolean = true;

  constructor(initialMasterVolume: number = 0.5) {
    this.psg = new AYRegisterSynthesizer(initialMasterVolume);
    this.scc = new SCCSynthesizer(initialMasterVolume);
  }

  public setSongData(songData: TrackerSongData): void {
    this.sccEnabled = songData.sccEnabled !== false;
    this.psg.setSongData({
      ...songData,
      soundChip: 'PSG',
      instruments: songData.instruments.filter((inst) => !isSccInstrument(inst)),
    });
    this.scc.setSongData({
      ...songData,
      soundChip: 'SCC',
      instruments: songData.instruments.filter((inst) => isSccInstrument(inst)),
    });
  }

  public async ensureAudioContext(): Promise<boolean> {
    const psgReady = await this.psg.ensureAudioContext();
    const sccReady = await this.scc.ensureAudioContext();
    return psgReady || sccReady;
  }

  /** The tracker composer gates playback on `synthesizer['audioContext'].state`;
   *  surface a sub-synth context (PSG first) so dual-chip songs pass that gate. */
  public get audioContext(): AudioContext | null {
    return (this.psg as any).audioContext ?? (this.scc as any).audioContext ?? null;
  }

  public async playNote(
    channel: number,
    noteStringFromCell: string | null,
    instrumentIdFromCell: number | null,
    ornamentIdFromCell: number | null,
    volumeFromCell: number | null
  ): Promise<void> {
    if (channel < DUAL_PSG_CHANNEL_COUNT) {
      await this.psg.playNote(
        channel as 0 | 1 | 2,
        noteStringFromCell, instrumentIdFromCell, ornamentIdFromCell, volumeFromCell
      );
      return;
    }
    const sccChannel = channel - DUAL_PSG_CHANNEL_COUNT;
    if (sccChannel >= DUAL_SCC_CHANNEL_COUNT) return;
    if (!this.sccEnabled) return;
    await this.scc.playNote(
      sccChannel as 0 | 1 | 2 | 3 | 4,
      noteStringFromCell, instrumentIdFromCell, ornamentIdFromCell, volumeFromCell
    );
  }

  public setMasterVolume(volumeLevel: number): void {
    this.psg.setMasterVolume(volumeLevel);
    this.scc.setMasterVolume(volumeLevel);
  }

  public stopAllNotes(): void {
    this.psg.stopAllNotes();
    this.scc.stopAllNotes();
  }

  /** PSG scope traces for columns A-C; the SCC synth has no scope taps yet,
   *  so columns 1-5 render as flat lines. */
  public getOscilloscopeSnapshot(): Float32Array[] {
    const psgSnapshot = this.psg.getOscilloscopeSnapshot();
    const sccPlaceholder = Array.from(
      { length: DUAL_SCC_CHANNEL_COUNT },
      () => new Float32Array(0)
    );
    return [...psgSnapshot, ...sccPlaceholder];
  }

  public closeContext(): void {
    this.psg.closeContext();
    this.scc.closeContext();
  }
}
