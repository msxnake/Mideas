import type { TrackerCell, TrackerSongData } from '../../types';
import { AYRegisterSynthesizer } from './ayRegisterSynthesizer';
import { PT3AudioTransport } from './pt3AudioTransport';
import { commitTrackerTake } from './pt3Recording';
import { buildPT3RecordingTimeline } from './pt3RecordingTiming';
import { createEmptyRow } from './trackerUtils';

/** Keep the preceding PT3 commands (including shared noise/envelope state), then
 * hold the auditioned note. This never changes the user's song or its order.
 */
export function buildPT3Audition(song: TrackerSongData, patternIndex: number, row: number,
  channel: 'A' | 'B' | 'C', patch: Partial<TrackerCell>): { bytes: Uint8Array; startFrame: number } {
  const pattern = song.patterns[patternIndex];
  if (!pattern?.rows[row]) throw new Error('No hay una fila PT3 para escuchar.');
  let orderIndex = song.currentPatternIndexInOrder;
  if (song.order[orderIndex] !== patternIndex) orderIndex = song.order.indexOf(patternIndex);
  const prefix = orderIndex < 0 ? [] : song.order.slice(0, orderIndex);
  const indices = [...new Set(prefix)];
  const patterns = indices.map(index => song.patterns[index]);
  const targetIndex = patterns.length;
  // Allow a held MIDI key to sustain. Commands after the cursor must not change it.
  const rows = pattern.rows.slice(0, row + 1);
  rows[row] = { ...rows[row], [channel]: { ...rows[row][channel], ...patch } };
  for (let i = 0; i < 64; i++) rows.push(createEmptyRow(['A', 'B', 'C']));
  patterns.push({ ...pattern, rows, numRows: rows.length,
    pt3SourceRows: pattern.pt3SourceRows?.slice(0, row + 1) });
  const order = [...prefix.map(index => indices.indexOf(index)), targetIndex];
  const snapshot = { ...song, patterns, order, restartPosition: 0 };
  const startFrame = buildPT3RecordingTimeline(snapshot).find(position =>
    position.orderIndex === order.length - 1 && position.row === row)!.startFrame;
  const compiled = commitTrackerTake(snapshot, new Map());
  return { bytes: new Uint8Array(compiled.externalPt3Data!), startFrame };
}

/** Piano/keyboard/MIDI use the very same decoder, clock, DAC and worklet as Play. */
export class PT3AuditionSynthesizer extends AYRegisterSynthesizer {
  private voices: (PT3AudioTransport | null)[] = [null, null, null];
  private requests = [0, 0, 0];
  private position: { pattern: number; row: number; song: TrackerSongData } | null = null;
  private volume: number;
  private disposed = false;

  constructor(volume = 1, private readonly onError: (message: string) => void = console.error) {
    super(volume);
    this.volume = volume;
  }

  public setPreviewPosition(song: TrackerSongData, pattern: number, row: number): void {
    this.position = { song, pattern, row };
  }

  public override setSongData(song: TrackerSongData): void {
    const previous = this.getSongData();
    if (previous && (previous.id !== song.id || previous.playbackBackend !== song.playbackBackend)) this.stopAllNotes();
    super.setSongData(song);
  }

  public override async playNote(channel: 0 | 1 | 2, note: string | null, instrument: number | null,
    ornament: number | null, volume: number | null, effect: number | null = null, params: string | null = null): Promise<void> {
    const song = this.getSongData();
    if (song?.playbackBackend !== 'external-pt3') return super.playNote(channel, note, instrument, ornament, volume, effect, params);
    const request = ++this.requests[channel];
    if (note === '===') { this.voices[channel]?.stop(); return; }
    if (!note || note === '---' || this.disposed) return;
    try {
      const position = this.position ?? { song, pattern: song.order[song.currentPatternIndexInOrder] ?? 0, row: 0 };
      const audition = buildPT3Audition(position.song, position.pattern, position.row, ['A', 'B', 'C'][channel] as 'A' | 'B' | 'C', {
        note, ...(instrument !== null ? { instrument } : {}), ...(ornament !== null ? { ornament } : {}),
        ...(volume !== null ? { volume } : {}),
      });
      let player = this.voices[channel];
      const fresh = !player;
      if (!player) {
        player = new PT3AudioTransport(audition.bytes, {}, true);
        this.voices[channel] = player;
      }
      player.setPlaybackHz(song.pt3Force50Hz ? 50 : 60);
      player.setMasterVolume(this.volume);
      player.setMutedChannels(['A', 'B', 'C'].filter((_, index) => index !== channel));
      if (fresh) {
        player.seek(audition.startFrame / player.getPlaybackHz());
        await player.play();
      } else await player.playModule(audition.bytes, audition.startFrame);
      if (request !== this.requests[channel] || this.disposed) return;
    } catch (error) {
      if (request === this.requests[channel] && !this.disposed) {
        this.voices[channel]?.close(); this.voices[channel] = null;
        this.onError(error instanceof Error ? error.message : String(error));
      }
    }
  }

  public override setMasterVolume(volume: number): void {
    super.setMasterVolume(volume);
    this.volume = volume;
    this.voices.forEach(player => player?.setMasterVolume(volume));
  }

  public override stopAllNotes(): void {
    this.requests = this.requests.map(request => request + 1);
    this.voices.forEach(player => player?.stop());
    this.position = null;
    super.stopAllNotes();
  }

  public override getOscilloscopeSnapshot(): Float32Array[] {
    if (this.getSongData()?.playbackBackend !== 'external-pt3') return super.getOscilloscopeSnapshot();
    return this.voices.map((player, channel) => player?.getOscilloscopeSnapshot()[channel] ?? new Float32Array(1024));
  }

  public override async closeContext(): Promise<void> {
    this.disposed = true;
    this.voices.forEach(player => player?.close());
    this.voices = [null, null, null];
    await super.closeContext();
  }
}
