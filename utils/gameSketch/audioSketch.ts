/**
 * Audio part of the AI Game Sketch: tracker songs, PSG sound effects and
 * instrument definitions, rewritten in an engine-neutral, documented form.
 */
import type { PSGSoundData, PT3Instrument, PT3Ornament, SCCInstrument, TrackerSongData } from '../../types';
import { getFrequencyForNoteString } from '../../components/utils/noteFrequencies';

export const AY_CLOCK_HZ = 3579545 / 2;

/** Approximate normalised output amplitude of the AY-3-8910 for volume 0..15. */
export const AY_VOLUME_TABLE = [0, 0.0137, 0.0205, 0.0291, 0.0423, 0.0618, 0.0847, 0.1369, 0.1691, 0.2647, 0.3527, 0.4499, 0.5704, 0.6873, 0.8482, 1.0];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function ayToneFrequencyHz(period: number): number | null {
  if (!Number.isFinite(period) || period <= 0) return null;
  return round2(AY_CLOCK_HZ / (16 * period));
}

export function ayNoiseFrequencyHz(period: number): number {
  const p = period <= 0 ? 1 : period & 0x1f;
  return round2(AY_CLOCK_HZ / (32 * p));
}

export function rowDurationMs(song: Pick<TrackerSongData, 'bpm' | 'speed'>): number {
  const bpm = Math.max(1, Number(song.bpm) || 125);
  const speed = Math.max(1, Number(song.speed) || 6);
  return round2((2500 * speed) / bpm);
}

function describeEnvelope(values: number[] | undefined, loop: number | undefined, label: string): string | null {
  if (!values || values.length === 0) return null;
  const first = values[0];
  const last = values[values.length - 1];
  const shape = values.length === 1 ? 'constant' : last < first ? 'decaying' : last > first ? 'rising' : 'varying';
  const loopTxt = loop !== undefined && loop >= 0 && loop < values.length ? `, loops from step ${loop}` : ', holds the last value';
  return `${label}: ${values.length} steps (one per tick), ${shape} from ${first} to ${last}${loopTxt}`;
}

function isScc(inst: PT3Instrument | SCCInstrument): inst is SCCInstrument {
  return Array.isArray((inst as SCCInstrument).waveform);
}

export function describeInstrument(inst: PT3Instrument | SCCInstrument): string {
  if (isScc(inst)) {
    const parts = [`SCC wavetable instrument (32-sample waveform, signed -128..127)`];
    const env = describeEnvelope(inst.volumeEnvelope, inst.volumeLoop, 'Volume envelope (0-15)');
    if (env) parts.push(env);
    else if (inst.volume !== undefined) parts.push(`Fixed volume ${inst.volume}`);
    if (inst.vibratoDepth) parts.push(`Vibrato depth ${inst.vibratoDepth}, speed ${inst.vibratoSpeed ?? '?'}, delay ${inst.vibratoDelay ?? 0} frames`);
    if (inst.noiseMode) parts.push('Noise mode: waveform is replaced by random bytes every frame (percussion)');
    if (inst.morphToWaveform) parts.push(`Morphs to a second waveform in 16 steps every ${inst.morphSpeed ?? 1} frames`);
    return parts.join('. ') + '.';
  }
  const parts: string[] = [];
  const tone = inst.ayToneEnabled === undefined ? true : inst.ayToneEnabled;
  const noise = !!inst.ayNoiseEnabled;
  parts.push(`PSG (AY-3-8910) instrument: ${tone && noise ? 'square tone + noise' : noise ? 'noise only (percussion)' : 'square tone'}`);
  if (inst.instrumentMode === 'pt3-sample' && inst.pt3Sample) {
    parts.push(`Exact PT3 sample program with ${inst.pt3Sample.steps.length} tick steps, loop at ${inst.pt3Sample.loop} (see pt3Sample.steps: volume, tone offset, noise/envelope flags per tick)`);
  } else {
    const v = describeEnvelope(inst.volumeEnvelope, inst.volumeLoop, 'Volume envelope (0-15)');
    const t = describeEnvelope(inst.toneEnvelope, inst.toneLoop, 'Pitch envelope (semitone offsets)');
    const n = describeEnvelope(inst.noiseEnvelope, inst.noiseLoop, 'Noise period envelope (0-31)');
    [v, t, n].forEach(x => x && parts.push(x));
  }
  if (inst.ayEnvelopeShape !== undefined && inst.ayEnvelopeShape > 0) {
    parts.push(`Uses the AY hardware envelope, shape ${inst.ayEnvelopeShape}${inst.hardwareEnvelopePeriod ? `, period ${inst.hardwareEnvelopePeriod}` : ''}${inst.hardwareEnvelopeRatio ? `, period follows the note pitch (ratio ${inst.hardwareEnvelopeRatio})` : ''}`);
  }
  if (inst.noiseBaseFrequency !== undefined) parts.push(`Base noise period ${inst.noiseBaseFrequency}`);
  return parts.join('. ') + '.';
}

export function buildInstrumentsSketch(song: TrackerSongData) {
  return {
    schema: 'mideas.sketch.instruments.v1',
    songId: song.id,
    songName: song.name,
    soundChip: song.soundChip,
    tickDurationMs: round2(rowDurationMs(song) / Math.max(1, Number(song.speed) || 6)),
    instruments: (song.instruments || []).map(inst => ({
      id: inst.id,
      name: inst.name,
      chip: inst.chip ?? (isScc(inst) ? 'SCC' : 'PSG'),
      description: describeInstrument(inst),
      definition: inst,
    })),
    ornaments: (song.ornaments || []).map((o: PT3Ornament) => ({
      id: o.id,
      name: o.name,
      description: `Arpeggio/pitch table: semitone offset added to the note on each tick (${o.data.length} steps${o.loopPosition !== undefined ? `, loops from ${o.loopPosition}` : ''}).`,
      semitoneOffsets: o.data,
      loopPosition: o.loopPosition ?? null,
    })),
  };
}

export function buildSongSketch(song: TrackerSongData, assetId: string, assetName: string) {
  const channels = Array.from(new Set((song.patterns || []).flatMap(p => (p.rows || []).flatMap(r => Object.keys(r || {}))))).sort();
  const patterns = (song.patterns || []).map((pattern, index) => {
    const events: any[] = [];
    (pattern.rows || []).forEach((row, rowIndex) => {
      for (const ch of channels) {
        const cell = row?.[ch];
        if (!cell) continue;
        const hasData = cell.note || cell.instrument !== null && cell.instrument !== undefined || cell.volume !== null && cell.volume !== undefined ||
          cell.ornament !== null && cell.ornament !== undefined || (cell.effectCommand ?? null) !== null || cell.pt3Envelope;
        if (!hasData) continue;
        const ev: Record<string, any> = { row: rowIndex, channel: ch };
        if (cell.note && cell.note !== '---') {
          ev.note = cell.note;
          if (cell.note === '===') ev.noteOff = true;
          else {
            const f = getFrequencyForNoteString(cell.note);
            if (f) ev.frequencyHz = f;
          }
        }
        if (cell.instrument !== null && cell.instrument !== undefined) ev.instrument = cell.instrument;
        if (cell.ornament !== null && cell.ornament !== undefined) ev.ornament = cell.ornament;
        if (cell.volume !== null && cell.volume !== undefined) ev.volume = cell.volume;
        if (cell.effectCommand !== null && cell.effectCommand !== undefined) ev.effect = { command: cell.effectCommand, params: cell.effectParams ?? null };
        if (cell.pt3Envelope) ev.hardwareEnvelope = cell.pt3Envelope;
        events.push(ev);
      }
    });
    return { index, id: pattern.id, name: pattern.name, numRows: pattern.numRows, events };
  });

  const order = song.order || [];
  const rowMs = rowDurationMs(song);
  const totalRows = order.reduce((sum, pi) => sum + (song.patterns?.[pi]?.numRows ?? 0), 0);

  return {
    schema: 'mideas.sketch.song.v1',
    assetId,
    name: assetName,
    title: song.title ?? null,
    author: song.author ?? null,
    soundChip: song.soundChip,
    channels,
    playbackBackend: song.playbackBackend ?? 'native',
    timing: {
      bpm: song.bpm,
      speedTicksPerRow: song.speed,
      rowDurationMs: rowMs,
      tickDurationMs: round2(rowMs / Math.max(1, Number(song.speed) || 6)),
      formula: 'rowDurationMs = 2500 * speed / bpm ; tickDurationMs = rowDurationMs / speed',
      approxSongDurationSeconds: round2((totalRows * rowMs) / 1000),
    },
    globalVolume: song.globalVolume,
    order,
    restartPosition: song.restartPosition ?? 0,
    loopDescription: `Play patterns in "order"; after the last entry jump back to order[${song.restartPosition ?? 0}] and repeat forever (if the game loops the music).`,
    instrumentsFile: null as string | null,
    patterns,
    notes: [
      'Events are sparse: a channel keeps playing its last note until a new note or a note-off ("===") arrives.',
      'instrument/ornament/volume values persist on the channel until changed.',
      'frequencyHz uses A-4 = 440 Hz. On the AY chip: period = round(1789772.5 / (16 * frequencyHz)).',
      ...(song.playbackBackend === 'external-pt3' ? ['This song was imported from a PT3 file; the patterns are the decoded view of that file.'] : []),
    ],
  };
}

export function buildSfxSketch(sfx: PSGSoundData, assetId: string, assetName: string) {
  const channels = (sfx.channels || []).map(ch => {
    let t = 0;
    const steps = (ch.steps || []).map(st => {
      const out = {
        startMs: t,
        durationMs: st.durationMs,
        toneEnabled: st.toneEnabled,
        tonePeriod: st.tonePeriod,
        toneFrequencyHz: st.toneEnabled ? ayToneFrequencyHz(st.tonePeriod) : null,
        noiseEnabled: st.noiseEnabled,
        volume: st.volume,
        useHardwareEnvelope: st.useEnvelope,
        ...(st.useEnvelope ? { envelopeShape: st.envelopeShape ?? sfx.envelopeShape } : {}),
      };
      t += Number(st.durationMs) || 0;
      return out;
    });
    return { channel: ch.id, loop: ch.loop, totalMs: t, steps };
  }).filter(c => c.steps.length > 0);

  return {
    schema: 'mideas.sketch.sfx.v1',
    assetId,
    name: assetName,
    chip: 'PSG (AY-3-8910)',
    noisePeriod: sfx.noisePeriod,
    noiseFrequencyHz: ayNoiseFrequencyHz(sfx.noisePeriod),
    hardwareEnvelope: { period: sfx.envelopePeriod, shape: sfx.envelopeShape, frequencyHz: sfx.envelopePeriod > 0 ? round2(AY_CLOCK_HZ / (256 * sfx.envelopePeriod)) : null },
    masterVolume: sfx.masterVolume,
    durationMs: Math.max(0, ...channels.map(c => c.totalMs)),
    channels,
    howToPlay: 'Each step is a square wave (tone) and/or white noise held for durationMs at the given volume (0-15, logarithmic, see AUDIO_SPEC.md). Steps of different channels play simultaneously.',
  };
}

export const AUDIO_SPEC_MD = `# Audio specification (MSX1)

This folder describes all the music and sound effects of the game in a form
that can be re-synthesised in any engine (Godot AudioStreamGenerator, WebAudio,
pygame, a DAW...) or recreated by a musician.

## Sound chips

### AY-3-8910 PSG (always present on MSX)
- 3 square-wave tone channels (A, B, C) + 1 shared white-noise generator.
- Clock: 1 789 772.5 Hz.
  - Tone frequency  = clock / (16 * tonePeriod)   (tonePeriod 1..4095)
  - Noise frequency = clock / (32 * noisePeriod)  (noisePeriod 1..31)
  - Hardware envelope frequency = clock / (256 * envelopePeriod)
- Volume 0..15 per channel, **logarithmic**. Approximate normalised amplitude:
  \`${AY_VOLUME_TABLE.join(', ')}\`
- Each channel can mix tone and/or noise.
- Hardware envelope shapes (register 13), used when "useHardwareEnvelope"/"ayEnvelopeShape" is set:
  - 0-3, 9: single decay, then silence
  - 4-7, 15: single attack, then silence
  - 8: repeated decaying sawtooth
  - 10: repeated triangle, starting downwards
  - 11: single decay, then hold maximum
  - 12: repeated rising sawtooth
  - 13: single attack, then hold maximum
  - 14: repeated triangle, starting upwards

### Konami SCC (optional cartridge chip)
- 5 wavetable channels, each with a 32-sample signed 8-bit waveform (-128..127),
  volume 0..15 (linear-ish). Frequency = 3 579 545 / (32 * (period + 1)).
- Songs with soundChip "SCC" or "PSG+SCC" use it.

## Tracker songs (audio/music/*.json)
- A song is a list of **patterns** (grids of rows x channels) and an **order** list
  saying in which sequence the patterns are played.
- Timing: \`rowDurationMs = 2500 * speed / bpm\`; each row is split in \`speed\` ticks.
  Instrument envelopes and ornaments advance one step per tick.
- Events are sparse: \`{ row, channel, note, frequencyHz, instrument, ornament, volume }\`.
  A note keeps sounding until another note or a note-off (\`"==="\`).
- Final channel volume = cell volume (0-15) combined with the instrument volume
  envelope (multiply the normalised values) and the song globalVolume.
- After the last order entry, playback jumps to \`restartPosition\`.

## Instruments (audio/instruments/*.json)
- PSG instruments: volume / pitch / noise envelopes (one value per tick, with
  loop points), tone/noise enable flags and optional hardware envelope.
  \`instrumentMode: "pt3-sample"\` means the exact ProTracker 3 sample program in
  \`pt3Sample.steps\` must be used instead of the simple envelopes.
- SCC instruments: a 32-sample waveform plus volume envelope, vibrato, noise
  mode and optional waveform morphing.
- Ornaments: per-tick semitone offsets added to the played note (arpeggios).
- Every instrument has a human/AI readable \`description\`.

## Sound effects (audio/sfx/*.json)
- Short PSG programs: per channel, a sequence of steps with tone period
  (and its frequency in Hz), noise on/off, volume and duration in ms.

## Ready-to-use WAV files
- \`audio/music/*.wav\` and \`audio/sfx/*.wav\`: PCM 16-bit mono 44100 Hz, rendered
  with the same AY-3-8910 emulation used by the Mideas editor and Play mode.
- Songs are rendered once (order[0] to the end). The loop region (from
  order[restartPosition] to the end) is embedded as a RIFF \`smpl\` chunk and
  also written in the song JSON (\`wav.loop\`). Godot 4 imports it as a looping
  AudioStreamWAV automatically (Loop Mode: "Detect From WAV").
- Only the PSG is rendered: SCC channels are not in the WAV (see the warnings).

## Recreating the audio
1. Fastest: use the WAV files. Alternatively synthesize square waves + noise
   with the formulas above (a few dozen lines in WebAudio or Godot).
2. Higher quality remake: give the JSON (notes, timing, instrument descriptions)
   to a musician or a MIDI converter; channels A/B/C map to 3 MIDI tracks.
`;
