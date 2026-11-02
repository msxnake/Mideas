/**
 * PT3 songs -> PCM through the real ZXPT3 Z80 player + Cowbell AYChip
 * (public/audio/pt3-render-worker.js), the same engine the tracker uses to
 * play external PT3 modules. Browser only (uses a Worker); the result is
 * handed to buildGameSketch() as `prerenderedSongs`.
 */
import type { ProjectAsset, TrackerSongData } from '../../types';
import { buildPT3RecordingTimeline } from '../../components/utils/pt3RecordingTiming';
import { WAV_SAMPLE_RATE, normalizePeak, resolvePlayableSong, type PrerenderedSong } from './audioRender';

export const PT3_PLAYBACK_HZ = 50;

/** True when the song carries a full PT3 module that the real player can run. */
export function hasRenderablePt3Module(song: TrackerSongData | undefined): boolean {
  return !!song && song.playbackBackend === 'external-pt3' && !!song.externalPt3Data?.length && song.externalPt3HasHeader !== false;
}

/** First frame of order[restartPosition], from the decoded PT3 timeline (speed effects included). */
export function computePt3LoopFrame(song: TrackerSongData): { loopStartFrame: number | null; timelineFrames: number } {
  const playable = resolvePlayableSong(song).song;
  if (!playable.order?.length || !playable.patterns?.length) return { loopStartFrame: null, timelineFrames: 0 };
  const timeline = buildPT3RecordingTimeline(playable);
  const restart = Math.max(0, Math.min(playable.order.length - 1, playable.restartPosition ?? 0));
  const loopRow = timeline.find(row => row.orderIndex === restart);
  const timelineFrames = timeline.length ? timeline[timeline.length - 1].endFrame : 0;
  return { loopStartFrame: loopRow ? loopRow.startFrame : null, timelineFrames };
}

function renderInWorker(worker: Worker, id: number, bytes: Uint8Array, sampleRate: number): Promise<{ samples: Float32Array; frameCount: number; complete: boolean }> {
  return new Promise((resolve, reject) => {
    const onMessage = ({ data }: MessageEvent) => {
      if (data?.id !== id) return;
      worker.removeEventListener('message', onMessage);
      if (data.error) reject(new Error(data.error));
      else resolve({ samples: new Float32Array(data.samples), frameCount: data.frameCount, complete: data.complete });
    };
    worker.addEventListener('message', onMessage);
    const copy = bytes.slice();
    worker.postMessage({ id, bytes: copy.buffer, sampleRate, playbackHz: PT3_PLAYBACK_HZ }, [copy.buffer]);
  });
}

/** Renders every external PT3 song of the project. Failures become warnings, never exceptions. */
export async function prerenderPt3Songs(assets: ProjectAsset[], sampleRate = WAV_SAMPLE_RATE): Promise<Record<string, PrerenderedSong>> {
  const songs = assets.filter(a => a.type === 'track' && hasRenderablePt3Module(a.data as TrackerSongData));
  const out: Record<string, PrerenderedSong> = {};
  if (!songs.length || typeof Worker === 'undefined') return out;
  const worker = new Worker('/audio/pt3-render-worker.js');
  try {
    let id = 0;
    for (const asset of songs) {
      const song = asset.data as TrackerSongData;
      try {
        const rendered = await renderInWorker(worker, ++id, Uint8Array.from(song.externalPt3Data!), sampleRate);
        const { loopStartFrame, timelineFrames } = computePt3LoopFrame(song);
        const notes: string[] = [];
        if (!rendered.complete) notes.push('The PT3 player did not report the end of the song; rendering was capped.');
        if (timelineFrames && Math.abs(timelineFrames - rendered.frameCount) > 1) {
          notes.push(`Loop point is approximate: PT3 timeline has ${timelineFrames} frames, player produced ${rendered.frameCount}.`);
        }
        const samplesPerFrame = sampleRate / PT3_PLAYBACK_HZ;
        const loopStartSample = loopStartFrame !== null && loopStartFrame < rendered.frameCount ? Math.round(loopStartFrame * samplesPerFrame) : null;
        out[asset.id] = {
          samples: normalizePeak(rendered.samples),
          sampleRate,
          loopStartSample,
          engine: `ZXPT3 Z80 player + Cowbell AYChip (AY 1.7734 MHz, ${PT3_PLAYBACK_HZ} Hz frames), same as the Mideas tracker PT3 playback`,
          notes,
        };
      } catch (err) {
        out[asset.id] = { error: `PT3 player render failed (${(err as Error)?.message ?? err}); used the Mideas synthesizer instead.` } as PrerenderedSong;
      }
    }
  } finally {
    worker.terminate();
  }
  return out;
}
