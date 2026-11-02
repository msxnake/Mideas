/**
 * Offline WAV rendering for the AI Game Sketch.
 *
 * Uses the same AY-3-8910 emulation as the Mideas editor/Play mode
 * (AYRegisterSynthesizer in offline mode), so the WAVs sound like the game.
 * Output: 16-bit PCM mono. Songs carry a RIFF "smpl" chunk with the loop
 * region (order[restartPosition] .. end), which Godot 4 picks up automatically
 * with the default import option "Loop Mode: Detect From WAV".
 */
import type { PSGSoundData, TrackerCell, TrackerSongData } from '../../types';
import { AYRegisterSynthesizer } from '../../components/utils/ayRegisterSynthesizer';
import { resolveNativeTrackerRowSpeed } from '../../components/utils/trackerEffects';
import { parsePT3File } from '../../components/utils/pt3Parser';

export const WAV_SAMPLE_RATE = 44100;
/** Hard cap so a broken song (e.g. 0 bpm) can never hang the export. */
const MAX_RENDER_SECONDS = 600;
const PSG_CHANNELS = ['A', 'B', 'C'] as const;

export interface WavRenderResult {
  wav: Uint8Array;
  sampleRate: number;
  durationMs: number;
  /** Sample index where the loop starts (songs only). */
  loopStartSample: number | null;
  loopEndSample: number | null;
  peak: number;
  notes: string[];
}

// ---------------------------------------------------------------------------
// WAV encoding
// ---------------------------------------------------------------------------

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeWav16(samples: Float32Array, sampleRate: number, loop?: { start: number; end: number } | null): Uint8Array {
  const dataBytes = samples.length * 2;
  const smplBytes = loop ? 8 + 36 + 24 : 0;
  const total = 12 + (8 + 16) + (8 + dataBytes) + smplBytes;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  let o = 0;
  writeAscii(view, o, 'RIFF'); o += 4;
  view.setUint32(o, total - 8, true); o += 4;
  writeAscii(view, o, 'WAVE'); o += 4;

  writeAscii(view, o, 'fmt '); o += 4;
  view.setUint32(o, 16, true); o += 4;
  view.setUint16(o, 1, true); o += 2; // PCM
  view.setUint16(o, 1, true); o += 2; // mono
  view.setUint32(o, sampleRate, true); o += 4;
  view.setUint32(o, sampleRate * 2, true); o += 4;
  view.setUint16(o, 2, true); o += 2;
  view.setUint16(o, 16, true); o += 2;

  writeAscii(view, o, 'data'); o += 4;
  view.setUint32(o, dataBytes, true); o += 4;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(o, s < 0 ? Math.round(s * 32768) : Math.round(s * 32767), true);
    o += 2;
  }

  if (loop) {
    writeAscii(view, o, 'smpl'); o += 4;
    view.setUint32(o, 36 + 24, true); o += 4;
    view.setUint32(o, 0, true); o += 4; // manufacturer
    view.setUint32(o, 0, true); o += 4; // product
    view.setUint32(o, Math.round(1e9 / sampleRate), true); o += 4; // sample period (ns)
    view.setUint32(o, 60, true); o += 4; // MIDI unity note
    view.setUint32(o, 0, true); o += 4; // pitch fraction
    view.setUint32(o, 0, true); o += 4; // SMPTE format
    view.setUint32(o, 0, true); o += 4; // SMPTE offset
    view.setUint32(o, 1, true); o += 4; // loop count
    view.setUint32(o, 0, true); o += 4; // sampler data
    view.setUint32(o, 0, true); o += 4; // cue point id
    view.setUint32(o, 0, true); o += 4; // type: forward
    view.setUint32(o, loop.start, true); o += 4;
    view.setUint32(o, Math.max(loop.start, loop.end - 1), true); o += 4; // inclusive end
    view.setUint32(o, 0, true); o += 4; // fraction
    view.setUint32(o, 0, true); o += 4; // play count: infinite
  }
  return new Uint8Array(buf);
}

/** Accumulates rendered audio in growing chunks. */
class SampleSink {
  private chunks: Float32Array[] = [];
  length = 0;
  push(chunk: Float32Array) {
    this.chunks.push(chunk);
    this.length += chunk.length;
  }
  toArray(): Float32Array {
    const out = new Float32Array(this.length);
    let o = 0;
    for (const c of this.chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }
}

function peakOf(samples: Float32Array): number {
  let p = 0;
  for (let i = 0; i < samples.length; i++) p = Math.max(p, Math.abs(samples[i]));
  return Math.round(p * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------

/**
 * Songs imported as raw PT3 ("external-pt3") may keep only the module bytes.
 * Decode them with the Mideas PT3 parser so they can be described and rendered.
 */
export function resolvePlayableSong(song: TrackerSongData): { song: TrackerSongData; decodedFromPt3: boolean; notes: string[] } {
  const hasPatterns = (song.patterns?.length ?? 0) > 0 && (song.order?.length ?? 0) > 0;
  if (hasPatterns || !song.externalPt3Data?.length) return { song, decodedFromPt3: false, notes: [] };
  if (song.externalPt3HasHeader === false) {
    return { song, decodedFromPt3: false, notes: ['Embedded PT3 data is headerless and could not be decoded: reimport the original .pt3 file (with its ProTracker/Vortex header) in the Mideas tracker and export again.'] };
  }
  try {
    const bytes = Uint8Array.from(song.externalPt3Data);
    const decoded = parsePT3File(bytes.buffer);
    return {
      song: { ...song, ...decoded, bpm: song.bpm > 0 ? song.bpm : (decoded.bpm ?? 125), soundChip: song.soundChip ?? 'PSG' } as TrackerSongData,
      decodedFromPt3: true,
      notes: ['Decoded from the embedded PT3 module.'],
    };
  } catch (err) {
    return { song, decodedFromPt3: false, notes: [`Embedded PT3 module could not be decoded (${(err as Error)?.message ?? err}).`] };
  }
}

/**
 * Renders a tracker song once from order[0] to the end. Row stepping matches
 * the Mideas Play mode: every row sends its A/B/C cells to the synthesizer,
 * then `speed` engine ticks of 2500/bpm ms each are rendered (SPEED effects
 * change the speed like in the tracker).
 */
export function renderSongToWav(song: TrackerSongData, sampleRate = WAV_SAMPLE_RATE): WavRenderResult {
  const notes: string[] = [];
  if (song.soundChip === 'SCC') {
    notes.push('SCC-only song: WAV rendering of the SCC chip is not supported yet; recreate it from the JSON.');
  } else if (song.soundChip === 'PSG+SCC') {
    notes.push('Dual-chip song: only the PSG channels (A, B, C) are in the WAV; the SCC channels are missing.');
  }

  const synth = new AYRegisterSynthesizer(1);
  synth.setSongData(song);
  synth.setOfflineClock(true);
  synth.setRowPlaybackActive(true);
  synth.stopAllNotes();

  const bpm = Number(song.bpm) > 0 ? Number(song.bpm) : 125;
  const samplesPerTick = (sampleRate * 2.5) / bpm; // tick = 2500/bpm ms
  const maxSamples = MAX_RENDER_SECONDS * sampleRate;
  const sink = new SampleSink();
  let renderedExact = 0; // fractional sample clock to avoid drift
  let speed = Math.max(1, Math.min(31, Number(song.speed) || 6));
  let loopStartSample: number | null = null;
  const order = song.order?.length ? song.order : [];
  const restart = Math.max(0, Math.min(order.length - 1, song.restartPosition ?? 0));
  const emptyCell: TrackerCell = { note: null, instrument: null, ornament: null, volume: null };

  outer:
  for (let oi = 0; oi < order.length; oi++) {
    if (oi === restart) loopStartSample = sink.length;
    const pattern = song.patterns?.[order[oi]];
    if (!pattern) continue;
    for (let row = 0; row < pattern.numRows; row++) {
      const rowData = pattern.rows?.[row] || {};
      const cells = PSG_CHANNELS.map(ch => (rowData as any)[ch] as TrackerCell | undefined ?? emptyCell);
      speed = resolveNativeTrackerRowSpeed(cells, speed);
      cells.forEach((cell, ch) => {
        synth.playNoteOffline(
          ch as 0 | 1 | 2,
          cell.note ?? null,
          cell.instrument ?? null,
          cell.ornament ?? null,
          cell.volume ?? null,
          cell.effectCommand ?? null,
          cell.effectParams ?? null,
        );
      });
      for (let t = 0; t < speed; t++) {
        renderedExact += samplesPerTick;
        const n = Math.round(renderedExact) - sink.length;
        if (n > 0) {
          const chunk = new Float32Array(n);
          synth.renderOffline(chunk, sampleRate);
          sink.push(chunk);
        }
        synth.stepFrameOffline();
        if (sink.length >= maxSamples) {
          notes.push(`Rendering stopped at the ${MAX_RENDER_SECONDS}s safety limit.`);
          break outer;
        }
      }
    }
  }

  const samples = sink.toArray();
  const loop = loopStartSample !== null && samples.length > loopStartSample ? { start: loopStartSample, end: samples.length } : null;
  return {
    wav: encodeWav16(samples, sampleRate, loop),
    sampleRate,
    durationMs: Math.round((samples.length / sampleRate) * 1000),
    loopStartSample: loop?.start ?? null,
    loopEndSample: loop?.end ?? null,
    peak: peakOf(samples),
    notes,
  };
}

// ---------------------------------------------------------------------------
// Sound effects
// ---------------------------------------------------------------------------

/**
 * Renders a PSG sound effect by writing its step program straight into the
 * emulated chip registers (one write burst at every step boundary).
 * Channel loops are played once.
 */
export function renderSfxToWav(sfx: PSGSoundData, sampleRate = WAV_SAMPLE_RATE): WavRenderResult {
  const synth = new AYRegisterSynthesizer(1);
  synth.setOfflineClock(true);
  synth.stopAllNotes();

  type Segment = { start: number; end: number; step: PSGSoundData['channels'][number]['steps'][number] };
  const perChannel: Segment[][] = (sfx.channels || []).slice(0, 3).map(ch => {
    let t = 0;
    return (ch.steps || []).map(step => {
      const seg = { start: t, end: t + Math.max(0, Number(step.durationMs) || 0), step };
      t = seg.end;
      return seg;
    });
  });
  while (perChannel.length < 3) perChannel.push([]);
  const totalMs = Math.max(0, ...perChannel.map(segs => (segs.length ? segs[segs.length - 1].end : 0)));
  const boundaries = Array.from(new Set([0, totalMs, ...perChannel.flatMap(segs => segs.map(s => s.start))])).sort((a, b) => a - b);

  synth.pokeRegisters([
    { reg: 6, value: Math.max(0, Math.min(31, sfx.noisePeriod | 0)) },
    { reg: 11, value: (sfx.envelopePeriod | 0) & 0xff },
    { reg: 12, value: ((sfx.envelopePeriod | 0) >> 8) & 0xff },
  ]);

  const sink = new SampleSink();
  let mixer = 0x3f;
  for (let bi = 0; bi < boundaries.length - 1; bi++) {
    const t0 = boundaries[bi];
    const t1 = boundaries[bi + 1];
    const writes: Array<{ reg: number; value: number }> = [];
    let restartEnvelope: number | null = null;
    for (let ch = 0; ch < 3; ch++) {
      const seg = perChannel[ch].find(s => s.start <= t0 && t0 < s.end);
      const startsHere = perChannel[ch].find(s => s.start === t0 && s.end > s.start);
      if (!seg) {
        mixer |= (1 << ch) | (1 << (ch + 3));
        writes.push({ reg: 8 + ch, value: 0 });
        continue;
      }
      if (!startsHere) continue; // step continues unchanged
      const st = seg.step;
      writes.push({ reg: ch * 2, value: (st.tonePeriod | 0) & 0xff });
      writes.push({ reg: ch * 2 + 1, value: ((st.tonePeriod | 0) >> 8) & 0x0f });
      mixer = st.toneEnabled ? mixer & ~(1 << ch) : mixer | (1 << ch);
      mixer = st.noiseEnabled ? mixer & ~(1 << (ch + 3)) : mixer | (1 << (ch + 3));
      writes.push({ reg: 8 + ch, value: st.useEnvelope ? 0x10 : Math.max(0, Math.min(15, st.volume | 0)) });
      if (st.useEnvelope) restartEnvelope = (st.envelopeShape ?? sfx.envelopeShape ?? 0) & 0x0f;
    }
    writes.push({ reg: 7, value: mixer & 0x3f });
    if (restartEnvelope !== null) writes.push({ reg: 13, value: restartEnvelope });
    synth.pokeRegisters(writes);

    const n = Math.round((t1 * sampleRate) / 1000) - sink.length;
    if (n > 0) {
      const chunk = new Float32Array(n);
      synth.renderOffline(chunk, sampleRate);
      sink.push(chunk);
    }
  }

  const samples = sink.toArray();
  const loops = Array.from(sfx.channels ?? []).some(c => c.loop && c.steps?.length);
  return {
    wav: encodeWav16(samples, sampleRate, null),
    sampleRate,
    durationMs: Math.round((samples.length / sampleRate) * 1000),
    loopStartSample: null,
    loopEndSample: null,
    peak: peakOf(samples),
    notes: loops ? ['Some channels are marked as looping in Mideas; the WAV contains one pass. Enable looping in the engine if needed.'] : [],
  };
}
