/**
 * @fileoverview SCC Sound Generator — Konami SCC (K051649) music backend.
 *
 * Fase 2 of docs/msx/MAPPER_KONAMI_SCC_2MB.md: converts Mideas tracker songs
 * with soundChip 'SCC' into compact ROM data plus a Z80 runtime built on the
 * driver primitives validated by test/scc/scc_probe.asm and the VGM player
 * (real Konami music). The public Mideas music API is emitted by
 * buildSccIntegratedMusicBlock() for SCC-only projects.
 *
 * Study rules honoured:
 *  - runtime-mutable state in RAM via EQU, data tables in ROM
 *  - SCC registers written only on change (per-channel shadows)
 *  - waveforms deduplicated, loaded only on instrument change
 *  - note periods precomputed in ROM, no musical math on the Z80
 *  - every routine carries a Destroys/Preserves contract header
 */

import type { TrackerSongData, SCCInstrument, TrackerCell, PT3Instrument } from '../../../types';

const SCC_TRACK_CHANNELS = ['1', '2', '3', '4', '5'] as const;
const ASM_NOTE_KEEP = 0xff;
const ASM_NOTE_CUT = 0xfe;
const SCC_NOTE_COUNT = 96;

/** Minimal structural view of ProjectAnalysis to keep this module isolated. */
export interface SccAnalysisLike {
  tracks?: TrackerSongData[];
}

export interface SccMusicBuildResult {
  asm: string;
  trackCount: number;
  waveformCount: number;
  warnings: string[];
}

export interface SccIntegratedMusicResult extends SccMusicBuildResult {
  /** Driver + row players + public music_* API. MUST stay in the resident
   *  #4000-#7FFF window (it runs while data banks are mapped at #8000). */
  runtimeAsm: string;
  /** Note/wave tables + serialized songs. Read by music_update, which can run
   *  with a data bank mapped in the #8000-#9FFF window (transition keep-alive)
   *  and with #3F (SCC) mapped there during register access — so this block
   *  must live OUTSIDE #8000-#9FFF: either below #8000 or in the #A000-#BFFF
   *  boot-image region (bank 3, never remapped during music reads). */
  dataAsm: string;
  /** Multi-bank mode (dataBankEquateName set): dataAsm split into <=8KB
   *  chunks, one per MegaROM music bank. Chunk i must be assembled at
   *  org #A000 in the bank the caller publishes as `${dataBankEquateName}_${i}`.
   *  Every chunk begins with an identical shared-table header, so the driver's
   *  bank-0 labels resolve correctly whichever music bank is mapped. */
  dataBankChunks?: Array<{ asm: string; usedBytes: number }>;
}

// ---------------------------------------------------------------------------
// helpers (local on purpose: this module stays dependency-free until the SCC
// backend is wired into the main generator)
// ---------------------------------------------------------------------------

function clampByte(value: number, min = 0, max = 255): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function scaleSccVolume(value: number, globalVolume: number): number {
  return clampByte((clampByte(value, 0, 15) * clampByte(globalVolume, 0, 15)) / 15, 0, 15);
}

function toAsmByte(value: number): string {
  return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function toAsmWord(value: number): string {
  return `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

function sanitizeLabel(value: string): string {
  const clean = (value || '').replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').toLowerCase();
  return clean.length > 0 ? clean : 'track';
}

function buildDbLines(label: string, values: number[]): string {
  const lines: string[] = [`${label}:`];
  if (values.length === 0) {
    lines.push('    DB #00');
    return lines.join('\n');
  }
  for (let index = 0; index < values.length; index += 16) {
    lines.push(`    DB ${values.slice(index, index + 16).map((v) => toAsmByte(v)).join(',')}`);
  }
  return lines.join('\n');
}

function computeRowFrames(song: TrackerSongData): number {
  const bpm = clampByte(song.bpm || 125, 1, 255);
  const speed = clampByte(song.speed || 6, 1, 31);
  return Math.max(1, Math.round((150 * speed) / bpm));
}

function getNoteIndex(note: string | null): number {
  if (note === null || note === '---') return ASM_NOTE_KEEP;
  if (note === '===') return ASM_NOTE_CUT;
  const match = note.toUpperCase().match(/^([A-G](?:#|-)?)([0-7])$/);
  if (!match) return ASM_NOTE_KEEP;
  const noteName = match[1].length === 1 ? `${match[1]}-` : match[1];
  const octave = parseInt(match[2], 10);
  const noteOffsets: Record<string, number> = {
    'C-': 0, 'C#': 1, 'D-': 2, 'D#': 3, 'E-': 4, 'F-': 5,
    'F#': 6, 'G-': 7, 'G#': 8, 'A-': 9, 'A#': 10, 'B-': 11,
  };
  const noteOffset = noteOffsets[noteName];
  if (noteOffset === undefined) return ASM_NOTE_KEEP;
  return clampByte(octave * 12 + noteOffset, 0, SCC_NOTE_COUNT - 1);
}

/** True only for a sounding note. Persisted tracker cells use '---' for an
 * empty/keep cell and '===' for note cut; neither one claims a chip channel. */
function isSoundingTrackerNote(note: string | null | undefined): boolean {
  return typeof note === 'string' && note !== '---' && note !== '===';
}

function isSccInstrument(value: unknown): value is SCCInstrument {
  return !!value && Array.isArray((value as SCCInstrument).waveform);
}

function getCellValue(row: Record<string, TrackerCell> | undefined, channelId: string): TrackerCell {
  const cell = row?.[channelId];
  return {
    note: cell?.note ?? null,
    instrument: cell?.instrument ?? null,
    ornament: cell?.ornament ?? null,
    volume: cell?.volume ?? null,
  };
}

/** Normalize a UI/import waveform sample to the canonical signed -128..127. */
function normalizeWaveSample(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  // Adapters may hand us unsigned 0..255; fold it once, explicitly.
  if (rounded > 127) return clampByte(rounded, 128, 255) - 256;
  return Math.min(127, Math.max(-128, rounded));
}

function normalizeWaveform(samples: number[] | undefined): number[] {
  const wave = new Array<number>(32).fill(0);
  if (Array.isArray(samples)) {
    for (let i = 0; i < 32; i++) wave[i] = normalizeWaveSample(samples[i] ?? 0);
  }
  return wave;
}

// ---------------------------------------------------------------------------
// track collection / validation
// ---------------------------------------------------------------------------

export function collectSccTracks(analysis: SccAnalysisLike): TrackerSongData[] {
  const projectTracks = Array.isArray(analysis.tracks) ? analysis.tracks : [];
  return projectTracks.filter(
    (track) => track?.soundChip === 'SCC' && track?.playbackBackend !== 'external-pt3'
  );
}

/** Dual-chip 'PSG+SCC' songs (Fase 3): the SCC half plays through the SCC
 *  player, the PSG half through the psg_music_* runtime emitted alongside. */
export function collectDualChipTracks(analysis: SccAnalysisLike): TrackerSongData[] {
  const projectTracks = Array.isArray(analysis.tracks) ? analysis.tracks : [];
  return projectTracks.filter(
    (track) => track?.soundChip === 'PSG+SCC' && track?.playbackBackend !== 'external-pt3'
  );
}

/** Plain 'PSG' songs, played through the dual-chip pipeline as a dual track
 *  whose SCC half is empty (channels 1-5 absent -> silent lockstep player).
 *  This is what lets classic PSG tracker songs sound in the bitmap route. */
export function collectPsgOnlyTracks(analysis: SccAnalysisLike): TrackerSongData[] {
  const projectTracks = Array.isArray(analysis.tracks) ? analysis.tracks : [];
  return projectTracks.filter(
    (track) => (track?.soundChip || 'PSG') === 'PSG' && track?.playbackBackend !== 'external-pt3'
  );
}

export function validateSccTrack(song: TrackerSongData): string[] {
  const warnings: string[] = [];
  const instruments = (song.instruments || []).filter(isSccInstrument);
  // Plain PSG songs ride the dual pipeline with an intentionally empty SCC
  // half: no SCC instruments is the expected shape, not a warning.
  if (instruments.length === 0 && song.soundChip !== 'PSG') {
    warnings.push(`${song.name}: SCC track has no SCC instruments (waveform arrays)`);
  }
  for (const instrument of instruments) {
    if (instrument.waveform.length !== 32) {
      warnings.push(`${song.name}: instrument ${instrument.id} waveform has ${instrument.waveform.length} samples, expected 32 (padded/truncated)`);
    }
  }
  // SCC original: channels 4 and 5 share one waveform buffer (#9860).
  const ch4Instruments = new Set<number>();
  const ch5Instruments = new Set<number>();
  for (const pattern of song.patterns || []) {
    for (const row of pattern.rows || []) {
      const c4 = row?.['4']?.instrument;
      const c5 = row?.['5']?.instrument;
      if (typeof c4 === 'number' && c4 > 0) ch4Instruments.add(c4);
      if (typeof c5 === 'number' && c5 > 0) ch5Instruments.add(c5);
    }
  }
  if (ch4Instruments.size > 0 && ch5Instruments.size > 0) {
    const overlap = [...ch4Instruments].some((id) => ch5Instruments.has(id));
    if (!overlap || ch4Instruments.size > 1 || ch5Instruments.size > 1) {
      warnings.push(`${song.name}: channels 4 and 5 share one waveform on SCC original; the last loaded instrument wins the timbre for both`);
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// note period table
// ---------------------------------------------------------------------------

/**
 * SCC period formula (validated on OpenMSX by test/scc/scc_probe.asm):
 * f_tone = 3579545 / (32 * (period + 1))  ->  period = clock/(32*f) - 1.
 * Note index 0 = C0 (same layout as the PSG table for model parity).
 */
export function buildSccNotePeriodTable(): string {
  const clock = 3579545;
  const c0Frequency = 16.351597831287414;
  const periods: number[] = [];
  for (let noteIndex = 0; noteIndex < SCC_NOTE_COUNT; noteIndex++) {
    const frequency = c0Frequency * Math.pow(2, noteIndex / 12);
    const period = Math.round(clock / (32 * frequency)) - 1;
    periods.push(Math.min(4095, Math.max(0, period)));
  }
  const lines: string[] = ['scc_note_period_table:'];
  for (let index = 0; index < periods.length; index += 8) {
    lines.push(`    DW ${periods.slice(index, index + 8).map((v) => toAsmWord(v)).join(',')}`);
  }
  return lines.join('\n');
}

/**
 * 64-entry signed sine LFO for vibrato, peak amplitude ~31 period units.
 * The driver indexes it with (phase >> 2) & 63 and scales by an arithmetic
 * right shift, so shift=5 gives the full +-31 (~2 semitones at A4) and shift=1
 * a subtle +-1. Emitted as two's-complement bytes.
 */
export function buildSccVibratoTable(): string {
  const values: number[] = [];
  for (let i = 0; i < 64; i++) {
    values.push(Math.round(31 * Math.sin((2 * Math.PI * i) / 64)) & 0xff);
  }
  return buildDbLines('scc_vib_table', values);
}

/**
 * 287-byte pseudo-random table for noise instruments (manual cap. 7: real
 * white noise = rewrite the 32-byte waveform every frame). 256 addressable
 * offsets + 31 spill bytes so any 8-bit offset yields 32 contiguous bytes.
 * Deterministic LCG so builds are reproducible.
 */
export function buildSccNoiseTable(): string {
  const values: number[] = [];
  let seed = 0x2a3c;
  for (let i = 0; i < 287; i++) {
    seed = (seed * 0x6d + 0x3039) & 0xffff;
    values.push((seed >> 8) & 0xff);
  }
  return buildDbLines('scc_noise_table', values);
}

// ---------------------------------------------------------------------------
// track data serialization
// ---------------------------------------------------------------------------

interface SccSerializedTrack {
  labelBase: string;
  dataLabel: string;
  asm: string;
  metadataAsm: string;
  patternAsms: string[];
}

function buildSccTrackData(
  song: TrackerSongData,
  trackIndex: number,
  waveKeyToIndex: Map<string, number>,
  waveTable: number[][],
  warnings: string[]
): SccSerializedTrack {
  const labelBase = `scc_track_${trackIndex}_${sanitizeLabel(song.name || `track_${trackIndex}`)}`;
  const dataLabel = `${labelBase}_data`;
  const order = Array.isArray(song.order) && song.order.length > 0 ? song.order : [0];
  const restartPosition = clampByte(song.restartPosition ?? 0, 0, Math.max(0, order.length - 1));
  const patterns = Array.isArray(song.patterns) && song.patterns.length > 0
    ? song.patterns
    : [{ id: `${labelBase}_fallback`, name: 'Fallback', numRows: 1, rows: [] }];
  const globalVolume = clampByte(song.globalVolume ?? 15, 0, 15);

  const instrumentMap = new Map<number, SCCInstrument>();
  for (const instrument of song.instruments || []) {
    if (!isSccInstrument(instrument)) continue;
    if (typeof instrument.id !== 'number') continue;
    instrumentMap.set(clampByte(instrument.id, 1, 31), instrument);
  }

  // Ornaments drive arpeggio: each is a signed semitone-offset sequence added
  // to the base note every frame (PT3/TriloTracker chord model). Ids 1..15.
  const ornamentMap = new Map<number, { data: number[]; loop: number }>();
  for (const ornament of song.ornaments || []) {
    if (!ornament || typeof ornament.id !== 'number') continue;
    const data = Array.isArray(ornament.data)
      ? ornament.data.slice(0, 64).map((v) => clampByte(v, -128, 127) & 0xff)
      : [];
    if (data.length === 0) continue;
    const loop = typeof ornament.loopPosition === 'number' && ornament.loopPosition >= 0 && ornament.loopPosition < data.length
      ? ornament.loopPosition
      : 0; // default: loop the whole ornament (classic arpeggio)
    ornamentMap.set(clampByte(ornament.id, 1, 15), { data, loop });
  }

  const waveIndexForSamples = (samples: number[] | undefined): number => {
    const wave = normalizeWaveform(samples);
    const key = wave.join(',');
    if (!waveKeyToIndex.has(key)) {
      waveKeyToIndex.set(key, waveTable.length);
      waveTable.push(wave);
    }
    return waveKeyToIndex.get(key)!;
  };
  const waveIndexFor = (instrument: SCCInstrument): number => waveIndexForSamples(instrument.waveform);

  const lines: string[] = [];
  lines.push(`; ------------------------------------------------------------------`);
  lines.push(`; SCC Song ${trackIndex}: ${song.name}`);
  lines.push(`; ------------------------------------------------------------------`);
  lines.push(`${dataLabel}:`);
  lines.push(`    DB ${toAsmByte(computeRowFrames(song))}          ; +0 frames per row`);
  lines.push(`    DB ${toAsmByte(order.length)}          ; +1 order length`);
  lines.push(`    DB ${toAsmByte(restartPosition)}          ; +2 restart position`);
  lines.push(`    DB ${toAsmByte(patterns.length)}          ; +3 pattern count`);
  lines.push(`    DW ${labelBase}_order_table          ; +4`);
  lines.push(`    DW ${labelBase}_pattern_table          ; +6`);
  lines.push(`    DW ${labelBase}_instrument_ptr_table  ; +8`);
  lines.push(`    DW ${labelBase}_ornament_ptr_table    ; +10`);
  lines.push('');
  lines.push(buildDbLines(`${labelBase}_order_table`, order.map((v) => clampByte(v, 0, Math.max(0, patterns.length - 1)))));
  lines.push('');
  lines.push(`${labelBase}_pattern_table:`);
  patterns.forEach((pattern, patternIndex) => {
    lines.push(`    DW ${labelBase}_pattern_${patternIndex}_rows`);
    lines.push(`    DB ${toAsmByte(clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255))}`);
  });
  lines.push('');
  lines.push(`${labelBase}_instrument_ptr_table:`);
  for (let instrumentId = 0; instrumentId <= 31; instrumentId++) {
    lines.push(`    DW ${instrumentId > 0 && instrumentMap.has(instrumentId) ? `${labelBase}_inst_${instrumentId}` : '0'}`);
  }
  lines.push('');
  // Ornament pointer table: ids 0..15 (0 = none). Each record: DB len, DB loop,
  // then `len` signed semitone offsets.
  lines.push(`${labelBase}_ornament_ptr_table:`);
  for (let ornamentId = 0; ornamentId <= 15; ornamentId++) {
    lines.push(`    DW ${ornamentId > 0 && ornamentMap.has(ornamentId) ? `${labelBase}_orn_${ornamentId}` : '0'}`);
  }
  lines.push('');
  Array.from(ornamentMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([ornamentId, ornament]) => {
    lines.push(`${labelBase}_orn_${ornamentId}:`);
    lines.push(`    DB ${toAsmByte(ornament.data.length)}          ; length`);
    lines.push(`    DB ${toAsmByte(ornament.loop)}          ; loop index`);
    lines.push(buildDbLines(`${labelBase}_orn_${ornamentId}_data`, ornament.data));
    lines.push('');
  });

  const patternStartLines: number[] = [];
  patterns.forEach((pattern, patternIndex) => {
    patternStartLines.push(lines.length);
    const rowCount = clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255);
    lines.push(`${labelBase}_pattern_${patternIndex}_rows:`);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const row = pattern?.rows?.[rowIndex] as Record<string, TrackerCell> | undefined;
      const rowBytes: number[] = [];
      SCC_TRACK_CHANNELS.forEach((channelId) => {
        const cell = getCellValue(row, channelId);
        const context = `${song.name}/pattern${patternIndex}/row${rowIndex}/ch${channelId}`;
        rowBytes.push(getNoteIndex(cell.note));
        let instrumentField = 0xff;
        if (cell.instrument !== null && cell.instrument !== undefined && cell.instrument !== 0) {
          const clamped = clampByte(cell.instrument, 1, 31);
          if (!instrumentMap.has(clamped)) {
            warnings.push(`${context}: SCC instrument ${clamped} not found, ignored`);
          } else {
            instrumentField = clamped;
          }
        }
        rowBytes.push(instrumentField);
        // ornament field: #FF keep, 0 clear, 1..15 select
        let ornamentField = 0xff;
        if (cell.ornament === 0) {
          ornamentField = 0;
        } else if (cell.ornament !== null && cell.ornament !== undefined) {
          const clamped = clampByte(cell.ornament, 1, 15);
          if (!ornamentMap.has(clamped)) {
            warnings.push(`${context}: SCC ornament ${clamped} not found, ignored`);
          } else {
            ornamentField = clamped;
          }
        }
        rowBytes.push(ornamentField);
        rowBytes.push(cell.volume === null || cell.volume === undefined
          ? 0xff
          : scaleSccVolume(cell.volume, globalVolume));
      });
      lines.push(`    DB ${rowBytes.map((v) => toAsmByte(v)).join(',')}`);
    }
    lines.push('');
  });

  const instrumentStartLine = lines.length;
  Array.from(instrumentMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([instrumentId, instrument]) => {
    const waveIndex = waveIndexFor(instrument);
    const volumeEnvelope = (instrument.volumeEnvelope || []).map((v) => scaleSccVolume(v, globalVolume));
    const volumeLoop = volumeEnvelope.length > 0 && typeof instrument.volumeLoop === 'number' && instrument.volumeLoop !== 0xff
      ? clampByte(instrument.volumeLoop, 0, volumeEnvelope.length - 1)
      : 0xff;
    const defaultVolume = scaleSccVolume(
      instrument.volume ?? (instrument.volumeEnvelope?.[0] ?? 15),
      globalVolume
    );
    const vibratoDepth = clampByte(instrument.vibratoDepth ?? 0, 0, 5);
    const vibratoSpeed = clampByte(instrument.vibratoSpeed ?? 16, 0, 255);
    const vibratoDelay = clampByte(instrument.vibratoDelay ?? 0, 0, 255);
    // Fase 4 (manual cap. 7): noise + waveform morphing per instrument.
    const morphValid = Array.isArray(instrument.morphToWaveform)
      && instrument.morphToWaveform.length > 0
      && (instrument.morphSpeed ?? 0) >= 1;
    const flags = (instrument.noiseMode ? 0x01 : 0) | (morphValid ? 0x02 : 0);
    const morphWaveIndex = morphValid ? waveIndexForSamples(instrument.morphToWaveform) : 0;
    const morphSpeed = morphValid ? clampByte(instrument.morphSpeed ?? 4, 1, 255) : 1;
    lines.push(`${labelBase}_inst_${instrumentId}:`);
    lines.push(`    DB ${toAsmByte(waveIndex)}          ; +0 waveform table index`);
    lines.push(`    DB ${toAsmByte(defaultVolume)}          ; +1 default volume`);
    lines.push(`    DW ${volumeEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_vol_env` : '0'}          ; +2 volume envelope ptr`);
    lines.push(`    DB ${toAsmByte(volumeEnvelope.length)}          ; +4 envelope length`);
    lines.push(`    DB ${toAsmByte(volumeLoop)}          ; +5 envelope loop (#FF = hold last)`);
    lines.push(`    DB ${toAsmByte(vibratoDepth)}          ; +6 vibrato depth (0=off..5)`);
    lines.push(`    DB ${toAsmByte(vibratoSpeed)}          ; +7 vibrato speed (phase inc/frame)`);
    lines.push(`    DB ${toAsmByte(vibratoDelay)}          ; +8 vibrato delay frames`);
    lines.push(`    DB ${toAsmByte(flags)}          ; +9 flags (bit0 noise, bit1 morph)`);
    lines.push(`    DB ${toAsmByte(morphWaveIndex)}          ; +10 morph target waveform index`);
    lines.push(`    DB ${toAsmByte(morphSpeed)}          ; +11 morph frames per step`);
    if (volumeEnvelope.length > 0) {
      lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_vol_env`, volumeEnvelope));
    }
    lines.push('');
  });

  const firstPatternLine = patternStartLines[0] ?? instrumentStartLine;
  const metadataAsm = [...lines.slice(0, firstPatternLine), ...lines.slice(instrumentStartLine)].join('\n');
  const patternAsms = patternStartLines.map((start, index) =>
    lines.slice(start, patternStartLines[index + 1] ?? instrumentStartLine).join('\n'));
  return { labelBase, dataLabel, asm: lines.join('\n'), metadataAsm, patternAsms };
}

// ---------------------------------------------------------------------------
// RAM layout
// ---------------------------------------------------------------------------

/**
 * Emit the SCC music runtime RAM as EQU chained from `baseAddress`.
 * Layout: 17 song/global bytes, then 21 per-channel arrays (5 bytes each) for
 * note/wave/volume/envelope + the arpeggio, vibrato and pitch-shadow engines,
 * then the loop-enabled flag. ~130 bytes total.
 */
export function buildSccMusicRam(baseAddress: number): { asm: string; bytesUsed: number; nextFree: number } {
  const vars: Array<[string, number]> = [
    ['scc_music_active', 1],
    ['scc_music_muted', 1],
    ['scc_music_loop_count', 1],
    ['scc_music_row_frames', 1],
    ['scc_music_row_countdown', 1],
    ['scc_music_order_pos', 1],
    ['scc_music_order_len', 1],
    ['scc_music_restart_pos', 1],
    ['scc_music_pattern_row', 1],
    ['scc_music_pattern_rows', 1],
    ['scc_music_track_ptr', 2],
    ['scc_music_order_ptr', 2],
    ['scc_music_pattern_table_ptr', 2],
    ['scc_music_inst_table_ptr', 2],
    ['scc_music_orn_table_ptr', 2],
    ['scc_music_row_ptr', 2],
    ['scc_music_mixer_shadow', 1],
    // per-channel arrays, 5 bytes each, indexed by channel 0..4
    ['scc_ch_note', 5],       // base note as authored (#FF = silent, #FE handled at cut)
    ['scc_ch_wave', 5],
    ['scc_ch_volbase', 5],
    ['scc_ch_envlo', 5],
    ['scc_ch_envhi', 5],
    ['scc_ch_envlen', 5],
    ['scc_ch_envloop', 5],
    ['scc_ch_envstep', 5],
    ['scc_ch_volout', 5],
    // --- arpeggio (ornament) engine, per channel ---
    ['scc_ch_arp_lo', 5],     // ornament data pointer low (0 = no ornament)
    ['scc_ch_arp_hi', 5],     // ornament data pointer high
    ['scc_ch_arp_len', 5],    // ornament length (0 = inactive)
    ['scc_ch_arp_loop', 5],   // ornament loop index (#FF = hold last)
    ['scc_ch_arp_step', 5],   // current ornament step
    // --- vibrato engine (per-instrument), per channel ---
    ['scc_ch_vib_shift', 5],  // amplitude shift 0=off..5=strong (delta = tri >> (5-shift))
    ['scc_ch_vib_speed', 5],  // phase increment per frame
    ['scc_ch_vib_delay', 5],  // frames to hold before vibrato starts
    ['scc_ch_vib_ctr', 5],    // remaining delay frames
    ['scc_ch_vib_phase', 5],  // triangle LFO phase 0..255
    // --- pitch shadow (period written only on change) ---
    ['scc_ch_period_lo', 5],
    ['scc_ch_period_hi', 5],
    // --- noise + morph engines (Fase 4, manual cap. 7) ---
    ['scc_ch_flags', 5],       // bit0 = noise mode, bit1 = morph on note-on
    ['scc_ch_morph_wave', 5],  // morph target waveform table index
    ['scc_ch_morph_speed', 5], // frames per morph step (>=1)
    ['scc_noise_phase', 1],    // rotating offset into scc_noise_table
    ['scc_morph_chan', 1],     // #FF = inactive, else channel 0..4
    ['scc_morph_step', 1],     // remaining steps (16 -> 0)
    ['scc_morph_timer', 1],    // frames until next step
    ['scc_morph_speed_cur', 1],
    ['scc_morph_tgt_idx', 1],  // target wave index (for the cache at the end)
    ['scc_morph_tgt_lo', 1],   // target waveform ROM pointer
    ['scc_morph_tgt_hi', 1],
    ['scc_morph_buf', 32],     // current morphing waveform (uploaded per step)
    ['scc_morph_delta', 32],   // per-sample step delta ((target-start) asr 4)
    ['scc_music_loop_enabled', 1],
    // MegaROM multi-bank music: bank number currently holding the playing
    // track's data; music_update maps it into P3 before running the players.
    ['music_data_bank_cur', 1],
  ];
  const lines: string[] = ['; ---- SCC music runtime RAM (EQU chain) ----'];
  let address = baseAddress;
  for (const [name, size] of vars) {
    lines.push(`${name.padEnd(28)} EQU ${toAsmWord(address)}`);
    address += size;
  }
  return { asm: lines.join('\n'), bytesUsed: address - baseAddress, nextFree: address };
}

// ---------------------------------------------------------------------------
// runtime (driver primitives + row player)
// ---------------------------------------------------------------------------

/** SCC driver primitives, byte-for-byte the routines validated by the probe
 * ROM and the VGM player smoke (test/scc/scc_driver.inc). */
export function buildSccDriverPrimitives(): string {
  return `; ---- SCC original register map (mirror of utils/audio/sccConstants.js) ------
SCC_ENABLE_ADDR EQU #9000   ; write #3F here to expose SCC at #9800-#9FFF
SCC_ENABLE_VAL  EQU #3F
SCC_WAVE_CH1    EQU #9800   ; 32 bytes per channel, ch4/ch5 share #9860
SCC_PERIOD_BASE EQU #9880   ; 2 bytes per channel, low byte first, 12 bits
SCC_VOLUME_BASE EQU #988A   ; 1 byte per channel, low nibble 0..15
SCC_MIXER       EQU #988F   ; bits 0..4 enable channels 1..5
SCC_MIXER_MASK  EQU #1F

; -----------------------------------------------------------------------------
; SCC_Init
; What:   Enable SCC register access (Konami SCC cartridge) + silence channels.
; Inputs: Page 2 already mapped to the cartridge slot.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_Init:
    ld a, SCC_ENABLE_VAL
    ld (SCC_ENABLE_ADDR), a
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_Stop
; What:   Silence every SCC channel (volumes 0 + mixer 0).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_Stop:
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld b, 5
SCC_Stop_loop:
    ld (hl), a
    inc hl
    djnz SCC_Stop_loop
    ret

; -----------------------------------------------------------------------------
; SCC_SetMixer
; What:   (#988F) = A & #1F. bit0 ch1 .. bit4 ch5.
; Destroys: AF   Preserves: BC, DE, HL, IX, IY
; -----------------------------------------------------------------------------
SCC_SetMixer:
    and SCC_MIXER_MASK
    ld (SCC_MIXER), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetVolume
; What:   Volume for one channel. A = channel 0..4, E = volume (low nibble).
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_SetVolume:
    ld hl, SCC_VOLUME_BASE
    add a, l                ; #8A + 0..4 never carries
    ld l, a
    ld a, e
    and #0F
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetPeriod
; What:   12-bit divider. A = channel 0..4, DE = period (low 12 bits).
;         f = 3579545 / (32 * (period + 1)). Low byte first.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_SetPeriod:
    add a, a
    ld hl, SCC_PERIOD_BASE
    add a, l                ; #80 + 0..8 never carries
    ld l, a
    ld (hl), e
    inc hl
    ld a, d
    and #0F
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_LoadWaveform32
; What:   Copy 32-byte waveform to a channel. A = channel 0..4, HL = source.
;         Channel index 4 clamps to #9860 (shared ch4/ch5 on SCC original).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; Cost:   32-byte LDIR. Only call on instrument change, never per frame.
; -----------------------------------------------------------------------------
SCC_LoadWaveform32:
    cp 4
    jp c, SCC_LoadWaveform32_ch
    ld a, 3
SCC_LoadWaveform32_ch:
    rlca
    rlca
    rlca
    rlca
    rlca                    ; A = channel * 32 (max 96, no wrap)
    ld e, a
    ld d, #98
    ld bc, 32
    ldir
    ret`;
}

/**
 * SCC music player runtime. Public API mirrors the tracker music block with
 * an scc_ prefix so the future music_update dispatcher can call into it:
 *   scc_music_init_system / scc_music_play_track (A=track, B=loop) /
 *   scc_music_stop / scc_music_mute / scc_music_resume / scc_music_update
 */
export function buildSccMusicRuntime(trackDataLabels: string[]): string {
  const trackTable = trackDataLabels.length > 0
    ? `scc_music_track_ptr_table:\n${trackDataLabels.map((label) => `    DW ${label}`).join('\n')}`
    : 'scc_music_track_ptr_table:\n    DW 0';

  return `; ==================================================================
; SCC MUSIC RUNTIME (Fase 1)
; Row player over the validated SCC driver primitives. All SCC register
; traffic goes through shadows: nothing is rewritten unless it changed.
; ==================================================================

SCC_MUSIC_TRACK_COUNT EQU ${trackDataLabels.length}

${trackTable}

; ------------------------------------------------------------------
; scc_music_init_system
; What:   Reset SCC music RAM, expose the SCC and silence the chip.
; Inputs: Page 2 already mapped to the cartridge slot (ENASLT done).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; ------------------------------------------------------------------
scc_music_init_system:
    xor a
    ld (scc_music_active), a
    ld (scc_music_muted), a
    ld (scc_music_loop_count), a
    ld (scc_music_loop_enabled), a
    ld (scc_music_mixer_shadow), a
    call scc_music_reset_channels
    ; The SCC shares the P2 bank register. Keep the caller's mapper bank on
    ; the CPU stack so nested resource loads cannot corrupt a global save slot.
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Init           ; #3F -> #9000 + mixer/volumes to 0
    pop af
    call mapper_set_bank_p2
    ret

; ------------------------------------------------------------------
; scc_music_reset_channels
; What:   Reset per-channel player state (note off, no waveform cached,
;         full volume base, no envelope, force volume rewrite).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; ------------------------------------------------------------------
scc_music_reset_channels:
    ld hl, scc_ch_note
    ld b, 5
scc_music_reset_note_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_reset_note_loop
    ld hl, scc_ch_wave
    ld b, 5
scc_music_reset_wave_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_reset_wave_loop
    ld hl, scc_ch_volbase
    ld b, 5
scc_music_reset_volbase_loop:
    ld (hl), #0F
    inc hl
    djnz scc_music_reset_volbase_loop
    xor a
    ld hl, scc_ch_envlen
    ld b, 5
scc_music_reset_envlen_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_envlen_loop
    ld hl, scc_ch_envstep
    ld b, 5
scc_music_reset_envstep_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_envstep_loop
    ld hl, scc_ch_volout
    ld b, 5
scc_music_reset_volout_loop:
    ld (hl), #FF            ; sentinel: force first real write
    inc hl
    djnz scc_music_reset_volout_loop
    ; arpeggio + vibrato disabled, period shadow forced to rewrite
    xor a
    ld hl, scc_ch_arp_len
    ld b, 5
scc_music_reset_arplen_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_arplen_loop
    ld hl, scc_ch_vib_shift
    ld b, 5
scc_music_reset_vibshift_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_vibshift_loop
    ld hl, scc_ch_vib_phase
    ld b, 5
scc_music_reset_vibphase_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_vibphase_loop
    ld hl, scc_ch_period_hi
    ld b, 5
scc_music_reset_period_loop:
    ld (hl), #FF           ; sentinel: force first period write
    inc hl
    djnz scc_music_reset_period_loop
    ; noise/morph engines idle
    xor a
    ld hl, scc_ch_flags
    ld b, 5
scc_music_reset_flags_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_flags_loop
    ld a, #FF
    ld (scc_morph_chan), a  ; morph engine inactive
    ret

; ------------------------------------------------------------------
; scc_music_play_track
; What:   Start SCC song A (0-based). B bit 0 = loop flag.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_play_track:
    push bc
    ld c, a
    ld a, b
    and 1
    ld (scc_music_loop_enabled), a
    ld a, c
    cp SCC_MUSIC_TRACK_COUNT
    jp c, scc_music_play_track_valid
    pop bc
    jp scc_music_stop
scc_music_play_track_valid:
    add a, a
    ld e, a
    ld d, 0
    ld hl, scc_music_track_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (scc_music_track_ptr), de
    ; parse header
    ex de, hl               ; HL = track data
    ld a, (hl)              ; +0 row frames
    ld (scc_music_row_frames), a
    inc hl
    ld a, (hl)              ; +1 order length
    ld (scc_music_order_len), a
    inc hl
    ld a, (hl)              ; +2 restart position
    ld (scc_music_restart_pos), a
    inc hl
    inc hl                  ; +3 pattern count (implicit via tables)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_order_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_pattern_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_inst_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (scc_music_orn_table_ptr), de
    call scc_music_reset_channels
    xor a
    ld (scc_music_muted), a
    ld (scc_music_mixer_shadow), a
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Stop
    pop af
    call mapper_set_bank_p2
    xor a
    call scc_music_set_order_pos
    ld a, 1
    ld (scc_music_row_countdown), a   ; first update plays row 0
    ld (scc_music_active), a
    pop bc
    ret

; ------------------------------------------------------------------
; scc_music_set_order_pos
; What:   Position the player at order entry A: resolve pattern index,
;         set row pointer and row count, reset row counter.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
scc_music_set_order_pos:
    ld (scc_music_order_pos), a
    ld e, a
    ld d, 0
    ld hl, (scc_music_order_ptr)
    add hl, de
    ld a, (hl)              ; pattern index
    ld e, a
    ld d, 0
    ld hl, (scc_music_pattern_table_ptr)
    add hl, de
    add hl, de
    add hl, de              ; entries are 3 bytes: DW rows, DB numRows
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)
    ld (scc_music_pattern_rows), a
    ld (scc_music_row_ptr), de
    xor a
    ld (scc_music_pattern_row), a
    ret

; ------------------------------------------------------------------
; scc_music_stop / scc_music_mute / scc_music_resume
; Same contracts as the PSG tracker block equivalents.
; ------------------------------------------------------------------
scc_music_stop:
    push af
    push bc
    push hl
    call scc_music_init_system
    pop hl
    pop bc
    pop af
    ret

scc_music_mute:
    ld a, (scc_music_active)
    or a
    ret z
    ld a, 1
    ld (scc_music_muted), a
    push bc
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Stop
    pop af
    call mapper_set_bank_p2
    pop bc
    ret

scc_music_resume:
    ld a, (scc_music_active)
    or a
    ret z
    xor a
    ld (scc_music_muted), a
    ; volumes rewrite themselves on the next update via #FF shadows
    push bc
    ld hl, scc_ch_volout
    ld b, 5
scc_music_resume_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_resume_loop
    xor a
    ld (scc_music_mixer_shadow), a
    pop bc
    ret

; ------------------------------------------------------------------
; scc_music_update
; What:   Advance SCC music by one video frame: row timing, note/
;         instrument/volume events, per-frame volume envelopes, mixer.
;         Writes SCC registers only when shadow state changed.
; Inputs: Runtime RAM initialized (scc_music_play_track).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; Cost:   Cheap on hold frames; note-on with waveform change costs one
;         32-byte LDIR per changed channel. Call once per frame from
;         the main loop, never from H.TIMI.
; ------------------------------------------------------------------
scc_music_update:
    ld a, (scc_music_active)
    or a
    ret z
    ld a, (scc_music_muted)
    or a
    ret nz
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    ld hl, scc_music_row_countdown
    dec (hl)
    jp nz, scc_music_update_effects
    ld a, (scc_music_row_frames)
    ld (hl), a
    call scc_music_advance_row
    ld a, (scc_music_active)
    or a
    jp z, scc_music_update_restore_bank
scc_music_update_effects:
    call scc_music_update_pitch
    call scc_music_update_morph
    call scc_music_update_noise
    call scc_music_update_envelopes
    call scc_music_apply_mixer
scc_music_update_restore_bank:
    pop af
    jp mapper_set_bank_p2

; ------------------------------------------------------------------
; scc_music_advance_row
; What:   Decode the current row (5 channels x 4 bytes: note,
;         instrument, ornament, volume) and fire channel events, then
;         advance row/order position with restart wrap.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_advance_row:
    ld hl, (scc_music_row_ptr)
    ld c, 0                 ; channel index
scc_music_row_ch_loop:
    ld b, (hl)              ; note field
    inc hl
    ld d, (hl)              ; instrument field
    inc hl
    ld e, (hl)              ; ornament field
    inc hl
    push hl
    push bc                 ; save note (B) + channel (C)
    push de                 ; save instrument (D)
    ld a, e                 ; ornament field -> arp arrays for this channel
    call scc_music_apply_ornament
    pop de                  ; D = instrument field
    pop bc                  ; B = note, C = channel
    pop hl
    ld e, (hl)              ; volume field
    inc hl
    push hl
    push bc
    call scc_music_apply_cell
    pop bc
    pop hl
    inc c
    ld a, c
    cp 5
    jp c, scc_music_row_ch_loop
    ld (scc_music_row_ptr), hl
    ld hl, scc_music_pattern_row
    inc (hl)
    ld a, (scc_music_pattern_rows)
    cp (hl)
    ret nz
    ; end of pattern: next order entry (wrap to restart position)
    ld a, (scc_music_order_pos)
    inc a
    ld e, a
    ld a, (scc_music_order_len)
    cp e
    jp nz, scc_music_advance_order_set
    ld hl, scc_music_loop_count
    inc (hl)
    ld a, (scc_music_loop_enabled)
    or a
    jp z, scc_music_stop
    ld a, (scc_music_restart_pos)
    ld e, a
scc_music_advance_order_set:
    ld a, e
    jp scc_music_set_order_pos

; ------------------------------------------------------------------
; scc_music_apply_cell
; What:   Apply one row cell to one channel.
; Inputs: C = channel 0..4, B = note field, D = instrument field,
;         E = volume field.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_apply_cell:
    ; ---- instrument field first (note-on may use its volume/wave) ----
    ld a, d
    cp #FF
    jp z, scc_music_cell_volume
    or a
    jp z, scc_music_cell_volume
    push bc                 ; keep note (B) + channel (C)
    push de                 ; keep volume field (E)
    add a, a
    ld e, a
    ld d, 0
    ld hl, (scc_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, scc_music_cell_inst_done   ; null instrument pointer
    ex de, hl               ; HL = instrument record
    ; +0 waveform index -> load only when the channel timbre changes
    ld e, (hl)              ; E = new waveform index
    push hl
    ld hl, scc_ch_wave
    call scc_wave_cache_ptr
    ld a, (hl)
    cp e
    jp z, scc_music_cell_wave_same
    ld (hl), e
    ld l, e                 ; HL = scc_wave_table + E*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld a, c
    push bc
    call SCC_LoadWaveform32
    pop bc
    ; a fresh waveform load cancels a running morph on this channel
    ld a, (scc_morph_chan)
    cp c
    jp nz, scc_music_cell_wave_same
    ld a, #FF
    ld (scc_morph_chan), a
scc_music_cell_wave_same:
    pop hl                  ; instrument record +0
    inc hl                  ; +1 default volume
    ld e, (hl)
    push hl
    ld hl, scc_ch_volbase
    call scc_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +2 envelope ptr low
    ld e, (hl)
    inc hl                  ; +3 envelope ptr high
    ld d, (hl)
    inc hl                  ; +4 envelope length
    ld b, (hl)              ; note field already saved on stack
    inc hl                  ; +5 envelope loop
    ld a, (hl)              ; A = envelope loop
    inc hl                  ; HL = instrument record +6 (vibrato block)
    push hl                 ; save record+6 for the vibrato read below
    push af                 ; save envelope loop
    push de
    ld hl, scc_ch_envlo
    call scc_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, scc_ch_envhi
    call scc_ch_ptr
    pop de
    ld (hl), d
    ld hl, scc_ch_envlen
    call scc_ch_ptr
    ld (hl), b
    pop af                  ; envelope loop
    ld e, a
    ld hl, scc_ch_envloop
    call scc_ch_ptr
    ld (hl), e
    ; ---- cache per-instrument vibrato (depth/speed/delay) for this channel ----
    pop hl                  ; HL = instrument record +6
    ld e, (hl)              ; +6 vibrato depth/shift
    inc hl
    ld b, (hl)              ; +7 vibrato speed
    inc hl
    ld d, (hl)              ; +8 vibrato delay
    inc hl
    push hl                 ; save record +9 for the noise/morph block
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_vib_speed
    call scc_ch_ptr
    ld (hl), b
    ld hl, scc_ch_vib_delay
    call scc_ch_ptr
    ld (hl), d
    ; ---- cache noise/morph config (+9 flags, +10 morph wave, +11 speed) ----
    pop hl                  ; HL = instrument record +9
    ld e, (hl)              ; flags: bit0 noise, bit1 morph
    inc hl
    ld b, (hl)              ; morph target waveform index
    inc hl
    ld d, (hl)              ; morph frames per step
    ld hl, scc_ch_flags
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_morph_wave
    call scc_ch_ptr
    ld (hl), b
    ld hl, scc_ch_morph_speed
    call scc_ch_ptr
    ld (hl), d
scc_music_cell_inst_done:
    pop de
    pop bc
scc_music_cell_volume:
    ; ---- volume field: overrides the channel volume base ----
    ld a, e
    cp #FF
    jp z, scc_music_cell_note
    and #0F
    ld e, a
    ld hl, scc_ch_volbase
    call scc_ch_ptr
    ld (hl), e
scc_music_cell_note:
    ; ---- note field ----
    ld a, b
    cp #FF
    ret z                   ; keep playing
    cp #FE
    jp z, scc_music_cell_note_cut
    ; note on: store the base note; the per-frame pitch engine computes the
    ; effective period (base note + arpeggio + vibrato) and writes it this
    ; same frame. Restart envelope, arpeggio and vibrato phase.
    ld e, a
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_envstep
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_vib_phase
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_vib_delay
    call scc_ch_ptr
    ld e, (hl)
    ld hl, scc_ch_vib_ctr
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    ld (hl), #FF            ; force the pitch engine to write the period
    ; morph trigger (instrument flag bit1); a note-on without the flag
    ; cancels any morph still running on this channel.
    ld hl, scc_ch_flags
    call scc_ch_ptr
    bit 1, (hl)
    jp nz, scc_morph_start  ; C = channel; tail call
    ld a, (scc_morph_chan)
    cp c
    ret nz
    ld a, #FF
    ld (scc_morph_chan), a
    ret
scc_music_cell_note_cut:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), #FF
    ; stop arpeggio so a silenced channel does not keep stepping
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), 0
    ; force volume 0 now and refresh shadow
    ld hl, scc_ch_volout
    call scc_ch_ptr
    ld (hl), 0
    ld e, 0
    ld a, c
    push bc
    call SCC_SetVolume
    pop bc
    ret

; ------------------------------------------------------------------
; scc_ch_ptr
; What:   HL = HL + C (channel index 0..4) with carry into H.
; Destroys: AF   Preserves: BC, DE, IX, IY
; ------------------------------------------------------------------
scc_ch_ptr:
    ld a, c
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; scc_wave_cache_ptr
; What:   HL = HL + min(C, 3). SCC original channels 4/5 share both
;         hardware waveform RAM and one cache entry.
; Destroys: AF   Preserves: BC, DE, IX, IY
; ------------------------------------------------------------------
scc_wave_cache_ptr:
    ld a, c
    cp 4
    jp c, scc_wave_cache_ptr_add
    ld a, 3
scc_wave_cache_ptr_add:
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; scc_morph_start
; What:   Arm the global morph engine for channel C (TriloTracker-style,
;         one morph at a time): copy the channel's current ROM waveform
;         into scc_morph_buf and precompute 16-step per-sample deltas
;         towards the instrument's morph target waveform.
; Inputs: C = channel 0..4; scc_ch_wave / scc_ch_morph_wave / _speed caches.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_morph_start:
    ld hl, scc_ch_wave
    call scc_wave_cache_ptr
    ld a, (hl)
    cp #FF
    ret z                   ; no waveform loaded yet: nothing to morph
    ld b, a                 ; B = source waveform index
    ld hl, scc_ch_morph_wave
    call scc_ch_ptr
    ld a, (hl)
    cp b
    ret z                   ; source == target: nothing to do
    ld (scc_morph_tgt_idx), a
    push bc                 ; keep B = source idx, C = channel
    ld l, a                 ; target ROM ptr = scc_wave_table + idx*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld a, l
    ld (scc_morph_tgt_lo), a
    ld a, h
    ld (scc_morph_tgt_hi), a
    pop bc
    ld l, b                 ; source ROM ptr = scc_wave_table + idx*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld de, scc_morph_buf
    push bc
    ld bc, 32
    ldir                    ; working buffer = source waveform
    pop bc
    ; deltas: (target[i] - buf[i]) asr 4 (16 steps; final step is exact)
    push bc                 ; C = channel, restored after the loop
    ld hl, (scc_morph_tgt_lo)
    ld de, scc_morph_buf
    ld b, 32
scc_morph_delta_loop:
    ld a, (de)
    ld c, a                 ; C = current sample (channel saved on stack)
    ld a, (hl)
    sub c                   ; target - current, signed
    sra a
    sra a
    sra a
    sra a                   ; /16 keeping the sign
    push hl
    ld hl, scc_morph_delta - scc_morph_buf
    add hl, de              ; matching slot in the delta array
    ld (hl), a
    pop hl
    inc hl
    inc de
    djnz scc_morph_delta_loop
    pop bc
    ; arm the engine
    ld hl, scc_ch_morph_speed
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp nz, scc_morph_speed_ok
    inc a                   ; speed 0 would never tick: clamp to 1
scc_morph_speed_ok:
    ld (scc_morph_speed_cur), a
    ld (scc_morph_timer), a
    ld a, 16
    ld (scc_morph_step), a
    ld a, c
    ld (scc_morph_chan), a  ; set LAST: engine now live
    ret

; ------------------------------------------------------------------
; scc_music_update_morph
; What:   Advance the global waveform morph: every speed_cur frames add
;         the per-sample deltas to the working buffer and upload it to
;         the morphing channel; the FINAL step uploads the exact target
;         (kills rounding drift) and updates the channel wave cache.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_morph:
    ld a, (scc_morph_chan)
    cp #FF
    ret z
    ld hl, scc_morph_timer
    dec (hl)
    ret nz
    ld a, (scc_morph_speed_cur)
    ld (hl), a
    ld hl, scc_morph_step
    dec (hl)
    jp z, scc_morph_finish
    ld hl, scc_morph_buf
    ld de, scc_morph_delta
    ld b, 32
scc_morph_add_loop:
    ld a, (de)
    add a, (hl)
    ld (hl), a
    inc hl
    inc de
    djnz scc_morph_add_loop
    ld hl, scc_morph_buf
    ld a, (scc_morph_chan)
    jp SCC_LoadWaveform32   ; A = channel, HL = source
scc_morph_finish:
    ld hl, (scc_morph_tgt_lo)
    ld a, (scc_morph_chan)
    push af
    call SCC_LoadWaveform32
    pop af
    ld c, a
    ld hl, scc_ch_wave      ; cache = target idx: same-instrument reloads skip
    call scc_wave_cache_ptr
    ld a, (scc_morph_tgt_idx)
    ld (hl), a
    ld a, #FF
    ld (scc_morph_chan), a
    ret

; ------------------------------------------------------------------
; scc_music_update_noise
; What:   Real white noise (manual cap. 7): for every live channel with
;         the noise flag, upload 32 fresh pseudo-random bytes from
;         scc_noise_table. The offset advances by a prime (37) so
;         consecutive frames never repeat the same slice.
; Cost:   One 32-byte LDIR per noise channel per frame.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_noise:
    ld c, 0
scc_noise_ch_loop:
    ld hl, scc_ch_flags
    call scc_ch_ptr
    bit 0, (hl)
    jp z, scc_noise_next
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, scc_noise_next    ; silent channel: skip the upload
    ld a, (scc_noise_phase)
    add a, 37
    ld (scc_noise_phase), a
    ld l, a
    ld h, 0
    ld de, scc_noise_table
    add hl, de
    ld a, c
    push bc
    call SCC_LoadWaveform32
    pop bc
scc_noise_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_noise_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_apply_ornament
; What:   Bind an ornament (arpeggio) to a channel from a row cell.
; Inputs: A = ornament field (#FF keep, 0 clear, 1..15 select),
;         C = channel 0..4. Ornament pointer table = scc_music_orn_table_ptr.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
scc_music_apply_ornament:
    cp #FF
    ret z                    ; keep current ornament
    or a
    jp z, scc_music_orn_clear
    ; look up ornament ptr table[A] (2 bytes/entry)
    add a, a
    ld e, a
    ld d, 0
    ld hl, (scc_music_orn_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)               ; DE = ornament record pointer (0 = none)
    ld a, e
    or d
    jp z, scc_music_orn_clear
    ex de, hl                ; HL = ornament record (+0 len, +1 loop, +2 data)
    ld a, (hl)               ; len
    inc hl                   ; -> loop
    ld d, (hl)               ; D = loop
    inc hl                   ; HL = data pointer
    ld e, a                  ; E = len
    push hl                  ; save data pointer
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), e               ; arp_len = len
    ld hl, scc_ch_arp_loop
    call scc_ch_ptr
    ld (hl), d               ; arp_loop = loop
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld (hl), 0               ; restart the arpeggio
    pop de                   ; DE = data pointer
    ld hl, scc_ch_arp_lo
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_arp_hi
    call scc_ch_ptr
    ld (hl), d
    ret
scc_music_orn_clear:
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), 0               ; inactive
    ret

; ------------------------------------------------------------------
; scc_music_update_pitch
; What:   Per-frame pitch for every live channel: effective note =
;         base note + arpeggio step offset, converted to a period, then
;         a triangle-LFO vibrato offset is added. The SCC period is
;         written only when it differs from the per-channel shadow.
; Inputs: scc_ch_note / arp / vib arrays, scc_note_period_table, scc_vib_table.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_pitch:
    ld c, 0                  ; channel index
scc_pitch_ch_loop:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, scc_pitch_next     ; silent channel: nothing to pitch
    ld b, a                  ; B = effective note (base to start)
    ; ---- arpeggio ----
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_no_arp
    ld d, a                  ; D = len (>=1)
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld a, (hl)               ; step
    cp d
    jp c, scc_pitch_arp_step_ok
    ; step past end: wrap to loop, or hold the last entry
    ld hl, scc_ch_arp_loop
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp nz, scc_pitch_arp_step_ok
    ld a, d
    dec a                    ; hold last (len-1)
scc_pitch_arp_step_ok:
    ld e, a                  ; E = effective step (0..len-1)
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld a, e
    inc a
    ld (hl), a               ; store step+1 for next frame
    ld hl, scc_ch_arp_lo
    call scc_ch_ptr
    ld a, (hl)
    ld hl, scc_ch_arp_hi
    call scc_ch_ptr
    ld h, (hl)
    ld l, a                  ; HL = ornament data base
    ld d, 0                  ; DE = step (E)
    add hl, de
    ld a, (hl)               ; signed semitone offset
    add a, b
    ld b, a                  ; effective note += offset
scc_pitch_no_arp:
    ; ---- base period lookup (clamp note to 0..95) ----
    ld a, b
    cp 96
    jp c, scc_pitch_note_ok
    ld a, 95
scc_pitch_note_ok:
    add a, a
    ld l, a
    ld h, 0
    ld de, scc_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)               ; DE = base period
    ; ---- vibrato (triangle LFO scaled by shift) ----
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_write    ; vibrato disabled
    ld hl, scc_ch_vib_ctr
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_vib_active
    dec (hl)                 ; delay still counting down
    jp scc_pitch_write
scc_pitch_vib_active:
    push de                  ; save base period across the delta math
    ld hl, scc_ch_vib_speed
    call scc_ch_ptr
    ld a, (hl)
    ld hl, scc_ch_vib_phase
    call scc_ch_ptr
    add a, (hl)
    ld (hl), a               ; phase += speed
    rrca
    rrca
    and #3F                  ; idx = (phase >> 2) & 63
    ld l, a
    ld h, 0
    ld de, scc_vib_table
    add hl, de
    ld a, (hl)               ; signed triangle value
    ld e, a                  ; E = value
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld a, 5
    sub (hl)                 ; N = 5 - shift (0..4)
    ld b, a
    ld a, e                  ; A = triangle value
    inc b
    jr scc_pitch_vib_sra_test
scc_pitch_vib_sra:
    sra a                    ; arithmetic (sign-preserving) shift right
scc_pitch_vib_sra_test:
    dec b
    jr nz, scc_pitch_vib_sra
    pop de                   ; DE = base period
    ld l, a
    ld h, 0
    bit 7, a
    jr z, scc_pitch_vib_pos
    ld h, #FF                ; sign-extend a negative delta
scc_pitch_vib_pos:
    add hl, de
    ex de, hl                ; DE = period + vibrato delta
scc_pitch_write:
    ; write DE to the SCC only when it differs from the channel shadow
    ld hl, scc_ch_period_lo
    call scc_ch_ptr
    ld a, e
    cp (hl)
    jp nz, scc_pitch_do_write
    ld a, d
    and #0F
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    cp (hl)
    jp z, scc_pitch_next
scc_pitch_do_write:
    ld hl, scc_ch_period_lo
    call scc_ch_ptr
    ld (hl), e
    ld a, d
    and #0F
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    ld (hl), a
    ld a, c
    push bc
    call SCC_SetPeriod
    pop bc
scc_pitch_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_pitch_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_update_envelopes
; What:   Per-frame volume for each active channel: envelope value
;         (attenuated by the channel volume base) or the base itself.
;         Writes SCC volume only when it differs from the shadow.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_envelopes:
    ld c, 0
scc_music_env_ch_loop:
    ; skip silent channels (note == #FF)
    ld hl, scc_ch_note
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, scc_music_env_next
    ; envelope length
    ld hl, scc_ch_envlen
    add hl, de
    ld a, (hl)
    or a
    jp z, scc_music_env_use_base
    ld b, a                 ; B = length
    ; step with hold/loop
    ld hl, scc_ch_envstep
    add hl, de
    ld a, (hl)
    cp b
    jp c, scc_music_env_step_ok
    ; past the end: loop or hold last
    push hl
    ld hl, scc_ch_envloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, scc_music_env_step_ok
    ld a, b
    dec a                   ; hold last value
scc_music_env_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch envelope[A]
    push de
    ld hl, scc_ch_envlo
    add hl, de
    ld e, (hl)
    ld hl, scc_ch_envhi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    ; attenuate by volume base: vol = min(env, volbase)
    ld hl, scc_ch_volbase
    add hl, de
    cp (hl)
    jp c, scc_music_env_apply
    ld a, (hl)
    jp scc_music_env_apply
scc_music_env_use_base:
    ld hl, scc_ch_volbase
    add hl, de
    ld a, (hl)
scc_music_env_apply:
    ; write only on change
    ld hl, scc_ch_volout
    add hl, de
    cp (hl)
    jp z, scc_music_env_next
    ld (hl), a
    ld e, a
    ld a, c
    push bc
    call SCC_SetVolume
    pop bc
scc_music_env_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_music_env_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_apply_mixer
; What:   Rebuild the channel-enable mask from scc_ch_note (bit set
;         when the channel holds a live note) and write it through
;         the shadow.
; Destroys: AF, BC, HL   Preserves: DE, IX, IY
; ------------------------------------------------------------------
scc_music_apply_mixer:
    ld hl, scc_ch_note
    ld b, 5
    ld c, 0                 ; mask accumulator
scc_music_mixer_loop:
    ld a, (hl)
    inc hl
    cp #FF
    jp z, scc_music_mixer_bit_done
    scf
scc_music_mixer_bit_done:
    rr c                    ; carry -> bit 7; after 5 rounds bits 3..7
    djnz scc_music_mixer_loop
    ld a, c
    rrca
    rrca
    rrca                    ; bits 3..7 -> bits 0..4
    and SCC_MIXER_MASK
    ld hl, scc_music_mixer_shadow
    cp (hl)
    ret z
    ld (hl), a
    jp SCC_SetMixer`;
}

// ---------------------------------------------------------------------------
// PSG half of dual-chip 'PSG+SCC' songs (Fase 3)
// ---------------------------------------------------------------------------

const PSG_TRACK_CHANNELS = ['A', 'B', 'C'] as const;

function hasNativePT3Sample(instrument: PT3Instrument): boolean {
  return instrument.instrumentMode === 'pt3-sample' && !!instrument.pt3Sample?.steps.length;
}

function serializeNativePT3SampleSteps(instrument: PT3Instrument): number[] {
  if (!hasNativePT3Sample(instrument) || !instrument.pt3Sample) return [];
  return instrument.pt3Sample.steps.flatMap((step) => {
    const amplitudeCode = step.amplitudeSlide < 0 ? 1 : step.amplitudeSlide > 0 ? 2 : 0;
    const flags =
      ((step.accumulateTone ? 1 : 0) << 0) |
      ((step.toneEnabled ? 1 : 0) << 1) |
      ((step.noiseEnabled ? 1 : 0) << 2) |
      ((step.hardwareEnvelopeEnabled ? 1 : 0) << 3) |
      ((step.accumulateNoiseOrEnvelope ? 1 : 0) << 4);
    const toneOffset = step.tonePeriodOffset & 0xffff;
    return [
      (step.volume & 0x0f) | ((amplitudeCode & 0x03) << 4),
      flags,
      toneOffset & 0xff,
      (toneOffset >>> 8) & 0xff,
      step.noiseOrEnvelopeOffset & 0xff,
    ];
  });
}

function buildNativePT3VolumeTable(): string {
  const table = Array<number>(256).fill(0);
  let base = 0x0011;
  let delta = 0;
  let index = 16;
  for (let channelVolume = 1; channelVolume <= 15; channelVolume += 1) {
    delta = (delta + base) & 0xffff;
    let accumulator = 0;
    for (let sampleVolume = 0; sampleVolume < 16; sampleVolume += 1) {
      table[index++] = ((accumulator + 0x80) >>> 8) & 0xff;
      accumulator = (accumulator + delta) & 0xffff;
    }
    if ((delta & 0xff) === 0x77) delta = (delta + 1) & 0xffff;
  }
  return buildDbLines('music_pt3_volume_table', table);
}

/**
 * AY-3-8910 note period table (96 notes, C0..B7). MSX PSG clock 1.7897725 MHz:
 * period = clock / (16 * f). Same note indexing as the SCC table.
 */
export function buildPsgNotePeriodTable(): string {
  const clock = 1789772.5;
  const c0Frequency = 16.351597831287414;
  const periods: number[] = [];
  for (let noteIndex = 0; noteIndex < SCC_NOTE_COUNT; noteIndex++) {
    const frequency = c0Frequency * Math.pow(2, noteIndex / 12);
    const period = Math.round(clock / (16 * frequency));
    periods.push(Math.min(4095, Math.max(1, period)));
  }
  const lines: string[] = ['psg_note_period_table:'];
  for (let index = 0; index < periods.length; index += 8) {
    lines.push(`    DW ${periods.slice(index, index + 8).map((v) => toAsmWord(v)).join(',')}`);
  }
  return lines.join('\n');
}

interface PsgSerializedTrack {
  labelBase: string;
  dataLabel: string;
  asm: string;
  /** Descriptor/tables/instruments without pattern row bodies. This prefix is
   * duplicated at the same P3-window address when a song spans banks. */
  metadataAsm: string;
  /** One independently bankable block per pattern, labels included. */
  patternAsms: string[];
}

/**
 * Serialize the PSG half (columns A/B/C + PSG instruments) of a dual-chip
 * song. Same header/pattern-table/row layout as the SCC serializer (4 bytes
 * per cell, ornament byte reserved) so both players advance in lockstep.
 * PSG v1 supports: note/cut, instrument default volume + volume envelope,
 * tone/noise enables + noise period, per-cell volume. Ornaments, tone
 * envelopes and AY hardware envelopes are ignored with a warning.
 */
function buildPsgTrackData(
  song: TrackerSongData,
  trackIndex: number,
  warnings: string[]
): PsgSerializedTrack {
  const labelBase = `psg_track_${trackIndex}_${sanitizeLabel(song.name || `track_${trackIndex}`)}`;
  const dataLabel = `${labelBase}_data`;
  const order = Array.isArray(song.order) && song.order.length > 0 ? song.order : [0];
  const restartPosition = clampByte(song.restartPosition ?? 0, 0, Math.max(0, order.length - 1));
  const patterns = Array.isArray(song.patterns) && song.patterns.length > 0
    ? song.patterns
    : [{ id: `${labelBase}_fallback`, name: 'Fallback', numRows: 1, rows: [] }];
  const globalVolume = clampByte(song.globalVolume ?? 15, 0, 15);

  const instrumentMap = new Map<number, any>();
  for (const instrument of song.instruments || []) {
    if (isSccInstrument(instrument)) continue;
    if (typeof instrument.id !== 'number') continue;
    instrumentMap.set(clampByte(instrument.id, 1, 31), instrument);
  }
  const songUsesPT3Samples = Array.from(instrumentMap.values()).some(hasNativePT3Sample);
  const ornamentMap = new Map<number, { data: number[]; loop: number }>();
  for (const ornament of song.ornaments || []) {
    if (!ornament || typeof ornament.id !== 'number') continue;
    const data = Array.isArray(ornament.data)
      ? ornament.data.slice(0, 64).map((value) => clampByte(value, -128, 127) & 0xff)
      : [];
    if (data.length === 0) continue;
    const loop = typeof ornament.loopPosition === 'number' && ornament.loopPosition >= 0 && ornament.loopPosition < data.length
      ? ornament.loopPosition
      : 0;
    ornamentMap.set(clampByte(ornament.id, 1, 15), { data, loop });
  }
  const lines: string[] = [];
  lines.push(`; ------------------------------------------------------------------`);
  lines.push(`; PSG half of dual song ${trackIndex}: ${song.name}`);
  lines.push(`; ------------------------------------------------------------------`);
  lines.push(`${dataLabel}:`);
  lines.push(`    DB ${toAsmByte(computeRowFrames(song))}          ; +0 frames per row`);
  lines.push(`    DB ${toAsmByte(order.length)}          ; +1 order length`);
  lines.push(`    DB ${toAsmByte(restartPosition)}          ; +2 restart position`);
  lines.push(`    DB ${toAsmByte(patterns.length)}          ; +3 pattern count`);
  lines.push(`    DW ${labelBase}_order_table          ; +4`);
  lines.push(`    DW ${labelBase}_pattern_table          ; +6`);
  lines.push(`    DW ${labelBase}_instrument_ptr_table  ; +8`);
  // PT3/Vortex songs own all three AY voices. SFX may interrupt a voice
  // transiently, but channel C is no longer removed from the music stream.
  lines.push(`    DB #01          ; +10 bit0: music drives PSG channel C`);
  lines.push(`    DB 0          ; +11 reserved`);
  lines.push(`    DW ${toAsmWord(songUsesPT3Samples
    ? Math.max(1, Math.min(0xffff, Math.round(song.ayHardwareEnvelopePeriod ?? 1)))
    : (song.ayHardwareEnvelopePeriod ?? 1))}          ; +12 PT3 envelope period base`);
  lines.push(`    DB ${toAsmByte(clampByte(song.ayNoisePeriod ?? 16, 0, 31))}          ; +14 PT3 noise base`);
  lines.push(`    DW ${labelBase}_pattern_bank_table          ; +15 pattern -> MegaROM bank`);
  lines.push(`    DW ${labelBase}_ornament_ptr_table          ; +17 ornament pointer table`);
  lines.push('');
  lines.push(buildDbLines(`${labelBase}_order_table`, order.map((v) => clampByte(v, 0, Math.max(0, patterns.length - 1)))));
  lines.push('');
  lines.push(`${labelBase}_pattern_table:`);
  patterns.forEach((pattern, patternIndex) => {
    lines.push(`    DW ${labelBase}_pattern_${patternIndex}_rows`);
    lines.push(`    DB ${toAsmByte(clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255))}`);
  });
  lines.push(`${labelBase}_pattern_bank_table:`);
  patterns.forEach((_, patternIndex) => {
    lines.push(`    DB #00          ; @mideas:pattern-bank ${patternIndex}`);
  });
  lines.push('');
  lines.push(`${labelBase}_ornament_ptr_table:`);
  for (let ornamentId = 0; ornamentId <= 15; ornamentId += 1) {
    lines.push(`    DW ${ornamentId > 0 && ornamentMap.has(ornamentId) ? `${labelBase}_orn_${ornamentId}` : '0'}`);
  }
  lines.push('');
  Array.from(ornamentMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([ornamentId, ornament]) => {
    lines.push(`${labelBase}_orn_${ornamentId}:`);
    lines.push(`    DB ${toAsmByte(ornament.data.length)}          ; length`);
    lines.push(`    DB ${toAsmByte(ornament.loop)}          ; loop index`);
    lines.push(buildDbLines(`${labelBase}_orn_${ornamentId}_data`, ornament.data));
    lines.push('');
  });
  lines.push(`${labelBase}_instrument_ptr_table:`);
  for (let instrumentId = 0; instrumentId <= 31; instrumentId++) {
    lines.push(`    DW ${instrumentId > 0 && instrumentMap.has(instrumentId) ? `${labelBase}_inst_${instrumentId}` : '0'}`);
  }
  lines.push('');

  const patternStartLines: number[] = [];
  patterns.forEach((pattern, patternIndex) => {
    patternStartLines.push(lines.length);
    const rowCount = clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255);
    lines.push(`${labelBase}_pattern_${patternIndex}_rows:`);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const row = pattern?.rows?.[rowIndex] as Record<string, TrackerCell> | undefined;
      const rowBytes: number[] = [];
      PSG_TRACK_CHANNELS.forEach((channelId) => {
        const cell = getCellValue(row, channelId);
        const context = `${song.name}/pattern${patternIndex}/row${rowIndex}/ch${channelId}`;
        rowBytes.push(getNoteIndex(cell.note));
        let instrumentField = 0xff;
        if (cell.instrument !== null && cell.instrument !== undefined && cell.instrument !== 0) {
          const clamped = clampByte(cell.instrument, 1, 31);
          if (!instrumentMap.has(clamped)) {
            warnings.push(`${context}: PSG instrument ${clamped} not found, ignored`);
          } else {
            instrumentField = clamped;
          }
        }
        rowBytes.push(instrumentField);
        let ornamentField = 0xff;
        if (cell.ornament === 0) {
          ornamentField = 0;
        } else if (cell.ornament !== null && cell.ornament !== undefined) {
          const clamped = clampByte(cell.ornament, 1, 15);
          if (!ornamentMap.has(clamped)) {
            warnings.push(`${context}: PSG ornament ${clamped} not found, ignored`);
          } else {
            ornamentField = clamped;
          }
        }
        rowBytes.push(ornamentField);
        rowBytes.push(cell.volume === null || cell.volume === undefined
          ? 0xff
          : scaleSccVolume(cell.volume, globalVolume));
      });
      lines.push(`    DB ${rowBytes.map((v) => toAsmByte(v)).join(',')}`);
    }
    lines.push('');
  });

  const instrumentStartLine = lines.length;
  Array.from(instrumentMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([instrumentId, instrument]) => {
    // AY preview parity: envelopes with any value > 15 are authored on the
    // 0-127 scale (ayRegisterSynthesizer's uses127Scale) — normalize to 0-15
    // BEFORE scaling, else clampByte flattens the whole decay to max volume.
    const rawVolumeEnvelope = (instrument.volumeEnvelope || []).map((v: number) => Math.max(0, Math.round(Number(v) || 0)));
    const uses127Scale = rawVolumeEnvelope.some((v: number) => v > 15);
    const normalizedVolumeEnvelope = uses127Scale
      ? rawVolumeEnvelope.map((v: number) => Math.round((Math.min(127, v) / 127) * 15))
      : rawVolumeEnvelope;
    const volumeEnvelope = normalizedVolumeEnvelope.map((v: number) => scaleSccVolume(v, globalVolume));
    const volumeLoop = volumeEnvelope.length > 0 && typeof instrument.volumeLoop === 'number' && instrument.volumeLoop !== 0xff
      ? clampByte(instrument.volumeLoop, 0, volumeEnvelope.length - 1)
      : 0xff;
    const defaultVolume = scaleSccVolume(volumeEnvelope.length > 0 ? (normalizedVolumeEnvelope[0] ?? 15) : 15, globalVolume);
    const toneEnabled = instrument.ayToneEnabled !== false;
    const noiseEnabled = instrument.ayNoiseEnabled === true;
    const flags = (toneEnabled ? 0x01 : 0) |
      (noiseEnabled ? 0x02 : 0) |
      (instrument.instrumentMode === 'pt3-sample' && typeof instrument.ayEnvelopeShape === 'number' ? 0x04 : 0);
    const noisePeriod = clampByte(instrument.noiseBaseFrequency ?? (song as any).ayNoisePeriod ?? 15, 0, 31);
    // Tone envelope: semitone offsets per frame (parity with the PC preview
    // ayRegisterSynthesizer: step 0 on the note-on frame, advance once per
    // frame, hold the last step unless toneLoop points inside the envelope).
    const toneEnvelope = Array.isArray(instrument.toneEnvelope)
      ? instrument.toneEnvelope
          .map((v: number) => Math.max(-48, Math.min(48, Math.round(Number(v) || 0))))
          .slice(0, 255)
      : [];
    const toneLoop = toneEnvelope.length > 0 && typeof instrument.toneLoop === 'number' && instrument.toneLoop !== 0xff
      ? clampByte(instrument.toneLoop, 0, toneEnvelope.length - 1)
      : 0xff;
    // Noise envelope: per-frame R6 periods (0-31), same step semantics.
    const noiseEnvelopeData = Array.isArray(instrument.noiseEnvelope)
      ? instrument.noiseEnvelope
          .map((v: number) => clampByte(Math.round(Number(v) || 0), 0, 31))
          .slice(0, 255)
      : [];
    const noiseLoop = noiseEnvelopeData.length > 0 && typeof instrument.noiseLoop === 'number' && instrument.noiseLoop !== 0xff
      ? clampByte(instrument.noiseLoop, 0, noiseEnvelopeData.length - 1)
      : 0xff;
    const pt3Steps = serializeNativePT3SampleSteps(instrument as PT3Instrument);
    const pt3Macro = pt3Steps.length > 0 ? (instrument as PT3Instrument).pt3Sample : undefined;
    if (!pt3Macro && (typeof instrument.ayEnvelopeShape === 'number' || typeof instrument.hardwareEnvelopePeriod === 'number')) {
      warnings.push(`${song.name}: PSG instrument ${instrumentId} AY hardware envelope not supported yet (ignored)`);
    }
    lines.push(`${labelBase}_inst_${instrumentId}:`);
    lines.push(`    DB ${toAsmByte(flags)}          ; +0 flags (bit0 tone, bit1 noise)`);
    lines.push(`    DB ${toAsmByte(defaultVolume)}          ; +1 default volume`);
    lines.push(`    DW ${volumeEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_vol_env` : '0'}          ; +2 volume envelope ptr`);
    lines.push(`    DB ${toAsmByte(volumeEnvelope.length)}          ; +4 envelope length`);
    lines.push(`    DB ${toAsmByte(volumeLoop)}          ; +5 envelope loop (#FF = hold last)`);
    lines.push(`    DB ${toAsmByte(noisePeriod)}          ; +6 AY noise period (R6)`);
    lines.push(`    DW ${toneEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_tone_env` : '0'}          ; +7 tone envelope ptr (signed semitones)`);
    lines.push(`    DB ${toAsmByte(toneEnvelope.length)}          ; +9 tone envelope length`);
    lines.push(`    DB ${toAsmByte(toneLoop)}          ; +10 tone envelope loop (#FF = hold last)`);
    lines.push(`    DW ${noiseEnvelopeData.length > 0 ? `${labelBase}_inst_${instrumentId}_noise_env` : '0'}          ; +11 noise envelope ptr (R6 periods 0-31)`);
    lines.push(`    DB ${toAsmByte(noiseEnvelopeData.length)}          ; +13 noise envelope length`);
    lines.push(`    DB ${toAsmByte(noiseLoop)}          ; +14 noise envelope loop (#FF = hold last)`);
    // Bytes +15..+20 extend the dual PSG descriptor with the same normalized
    // five-byte PT3 step ABI used by the standalone PSG runtime.
    lines.push(`    DB ${toAsmByte(pt3Macro ? 1 : 0)}          ; +15 PT3 mode`);
    lines.push(`    DB ${toAsmByte(pt3Macro?.steps.length ?? 0)}          ; +16 PT3 sample length`);
    lines.push(`    DB ${toAsmByte(pt3Macro ? clampByte(pt3Macro.loop, 0, pt3Macro.steps.length - 1) : 0)}          ; +17 PT3 loop`);
    lines.push(`    DB ${toAsmByte(pt3Macro?.envelopeSlideMode === 'corrected-16bit' ? 1 : 0)}          ; +18 PT3 envelope slide mode`);
    lines.push(`    DW ${pt3Macro ? `${labelBase}_inst_${instrumentId}_pt3_steps` : '0'}          ; +19 PT3 step pointer`);
    lines.push(`    DB ${toAsmByte(clampByte(instrument.ayEnvelopeShape ?? 0, 0, 15))}          ; +21 PT3 envelope shape`);
    if (volumeEnvelope.length > 0) {
      lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_vol_env`, volumeEnvelope));
    }
    if (toneEnvelope.length > 0) {
      lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_tone_env`, toneEnvelope.map((v: number) => v & 0xff)));
    }
    if (noiseEnvelopeData.length > 0) {
      lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_noise_env`, noiseEnvelopeData));
    }
    if (pt3Steps.length > 0) {
      lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_pt3_steps`, pt3Steps));
    }
    lines.push('');
  });

  const firstPatternLine = patternStartLines[0] ?? instrumentStartLine;
  const metadataAsm = [...lines.slice(0, firstPatternLine), ...lines.slice(instrumentStartLine)].join('\n');
  const patternAsms = patternStartLines.map((start, index) =>
    lines.slice(start, patternStartLines[index + 1] ?? instrumentStartLine).join('\n'));
  return { labelBase, dataLabel, asm: lines.join('\n'), metadataAsm, patternAsms };
}

/**
 * PSG music runtime RAM as an EQU chain from `baseAddress` (chain it after
 * buildSccMusicRam().nextFree). ~55 bytes.
 */
export function buildPsgMusicRam(baseAddress: number): { asm: string; bytesUsed: number; nextFree: number } {
  const vars: Array<[string, number]> = [
    ['psg_music_active', 1],
    ['psg_music_muted', 1],
    ['psg_music_loop_enabled', 1],
    ['psg_music_row_frames', 1],
    ['psg_music_row_countdown', 1],
    ['psg_music_order_pos', 1],
    ['psg_music_order_len', 1],
    ['psg_music_restart_pos', 1],
    ['psg_music_pattern_row', 1],
    ['psg_music_pattern_rows', 1],
    ['psg_music_order_ptr', 2],
    ['psg_music_pattern_table_ptr', 2],
    ['psg_music_pattern_bank_ptr', 2],
    ['psg_music_orn_table_ptr', 2],
    ['psg_music_inst_table_ptr', 2],
    ['psg_music_row_ptr', 2],
    ['psg_music_track_ptr', 2],
    ['psg_music_noise_period', 1],
    ['psg_music_use_ch_c', 1],   // header flag bit0: song drives channel C
    // per-channel arrays, 3 bytes each (channels A/B/C = 0..2)
    ['psg_ch_note', 3],
    ['psg_ch_effective_note', 3],
    ['psg_ch_flags', 3],      // bit0 tone enabled, bit1 noise enabled
    ['psg_ch_noiseper', 3],
    ['psg_ch_volbase', 3],
    ['psg_ch_envlo', 3],
    ['psg_ch_envhi', 3],
    ['psg_ch_envlen', 3],
    ['psg_ch_envloop', 3],
    ['psg_ch_envstep', 3],
    ['psg_ch_volout', 3],
    ['psg_ch_period_lo', 3],
    ['psg_ch_period_hi', 3],
    // tone + noise macro state — contiguous with the zero-reset run
    ['psg_ch_tonelo', 3],
    ['psg_ch_tonehi', 3],
    ['psg_ch_tonelen', 3],
    ['psg_ch_toneloop', 3],
    ['psg_ch_tonestep', 3],
    ['psg_ch_noiselo', 3],
    ['psg_ch_noisehi', 3],
    ['psg_ch_noiselen', 3],
    ['psg_ch_noiseloop', 3],
    ['psg_ch_noisestep', 3],
    ['psg_ch_instrument', 3],
    ['psg_ch_arp_lo', 3],
    ['psg_ch_arp_hi', 3],
    ['psg_ch_arp_len', 3],
    ['psg_ch_arp_loop', 3],
    ['psg_ch_arp_step', 3],
    ['psg_ch_pt3mode', 3],
    // Native PT3 sample reducer state. Names intentionally match the shared
    // standalone PSG runtime so both backends execute the same Z80 code.
    ['music_mixer_shadow', 1],
    ['music_pitch_step_work', 1],
    ['music_pt3_frame_active', 1],
    ['music_pt3_used_noise', 1],
    ['music_pt3_used_env', 1],
    ['music_pt3_noise_add', 1],
    ['music_pt3_env_add_lo', 1],
    ['music_pt3_env_add_hi', 1],
    ['music_pt3_env_mode', 1],
    ['music_pt3_r13_pending', 1],
    ['music_pt3_r13_value', 1],
    ['music_pt3_channel_work', 1],
    ['music_pt3_step_packed', 1],
    ['music_pt3_step_flags', 1],
    ['music_pt3_step_global', 1],
    ['music_pt3_sample_len_work', 1],
    ['music_pt3_sample_loop_work', 1],
    ['music_pt3_sample_mode_work', 1],
    ['music_pt3_period_lo_work', 1],
    ['music_pt3_period_hi_work', 1],
    ['music_pt3_tone_delta_lo_work', 1],
    ['music_pt3_tone_delta_hi_work', 1],
    ['music_pt3_instrument_ptr_l', 1],
    ['music_pt3_instrument_ptr_h', 1],
    ['music_pt3_step_ptr_l', 1],
    ['music_pt3_step_ptr_h', 1],
    ['music_pt3_amplitude_work', 1],
    ['music_pt3_sample_pos_base', 3],
    ['music_pt3_tone_acc_lo_base', 3],
    ['music_pt3_tone_acc_hi_base', 3],
    ['music_pt3_amp_slide_base', 3],
    ['music_pt3_noise_acc_base', 3],
    ['music_pt3_env_acc_lo_base', 3],
    ['music_pt3_env_acc_hi_base', 3],
  ];
  const lines: string[] = ['; ---- PSG music runtime RAM (dual-chip Fase 3, EQU chain) ----'];
  let address = baseAddress;
  for (const [name, size] of vars) {
    lines.push(`${name.padEnd(28)} EQU ${toAsmWord(address)}`);
    address += size;
  }
  lines.push('music_ch_note_base           EQU psg_ch_effective_note');
  lines.push('music_ch_volume_base         EQU psg_ch_volbase');
  lines.push(`psg_music_pt3_ram_end        EQU ${toAsmWord(address)}`);
  return { asm: lines.join('\n'), bytesUsed: address - baseAddress, nextFree: address };
}

/**
 * PSG half runtime: psg_music_init_system / psg_music_play_ptr (HL=data,
 * B bit0=loop) / psg_music_stop / psg_music_mute / psg_music_resume /
 * psg_music_update. Registers R0..R10 are re-asserted EVERY frame
 * (write-through, no shadows): fire-and-forget PSG sound effects (gem blip,
 * dialogue typewriter) can stomp AY registers freely and the music heals on
 * the next frame. DI assumed (the bitmap engine never enables IRQs).
 */
export function buildPsgMusicRuntime(pt3SampleRuntimeAsm: string = '', dataBankEquateName?: string): string {
  const pt3Enabled = pt3SampleRuntimeAsm.trim().length > 0;
  const pt3FrameCalls = pt3Enabled ? `    call music_pt3_begin_frame
    ld a, #BF
    ld (music_mixer_shadow), a
` : '';
  const pt3FrameFinish = pt3Enabled ? `    call psg_music_update_pt3_channels
    call music_pt3_finalize_frame
` : '';
  return `; ==================================================================
; PSG MUSIC RUNTIME (dual-chip Fase 3)
; Plays the PSG half (columns A-C) of a 'PSG+SCC' song in lockstep with
; the SCC player: same header layout, same frames-per-row cadence.
; ==================================================================

PSG_REG_PORT EQU #A0
PSG_VAL_PORT EQU #A1
PSG_ENV_LO EQU 11
PSG_ENV_HI EQU 12
PSG_ENV_SHAPE EQU 13
MUSIC_TRACK_ENV_BASE EQU 12
MUSIC_TRACK_NOISE_DEFAULT EQU 14
MUSIC_INSTRUMENT_PT3_MODE EQU 15
MUSIC_PT3_STEP_SIZE EQU 5
music_note_period_table EQU psg_note_period_table

; psg_reg_write: A = register 0..13, E = value.
; Destroys: AF   Preserves: BC, DE, HL, IX, IY
psg_reg_write:
    out (PSG_REG_PORT), a
    ld a, e
    out (PSG_VAL_PORT), a
    ret

; psg_ch_ptr: HL = array base, C = channel 0..2 -> HL += C.
; Destroys: AF   Preserves: BC, DE, IX, IY
psg_ch_ptr:
    ld a, c
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; psg_music_init_system
; What:   Reset the PSG music RAM and silence the AY (R7=#BF, vols 0).
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_init_system:
    xor a
    ld (psg_music_active), a
    ld (psg_music_muted), a
    ld (psg_music_loop_enabled), a
    xor a
    ld (psg_music_use_ch_c), a   ; no song descriptor is active yet
    call psg_music_reset_channels
    call psg_music_reset_pt3_state
    jp psg_music_silence
; psg_music_silence: R7 all off (#BF keeps MSX I/O port directions), vols 0.
; Destroys: AF, E   Preserves: BC, D, HL, IX, IY
psg_music_silence:
    ld e, #BF
    ld a, 7
    call psg_reg_write
    ld e, 0
    ld a, 8
    call psg_reg_write
    ld e, 0
    ld a, 9
    call psg_reg_write
    ld e, 0
    ld a, 10
    jp psg_reg_write

; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
psg_music_reset_channels:
    ld hl, psg_ch_note
    ld a, #FF
    ld b, 6                 ; base + effective notes for A/B/C
psg_music_reset_note_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_note_loop
    ld hl, psg_ch_flags
    ld a, #01               ; tone enabled by default
    ld b, 3
psg_music_reset_flags_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_flags_loop
    ld hl, psg_ch_volbase
    ld a, #0F
    ld b, 3
psg_music_reset_volbase_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_volbase_loop
    ; envelope + tone/noise-macro state, volout and cached periods all to 0
    xor a
    ld hl, psg_ch_envlen
    ld b, 3 * 16            ; envlen..period_hi + tone* (5) + noise* (5) arrays
psg_music_reset_zero_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_zero_loop
    ld (psg_music_noise_period), a
    ld hl, psg_ch_noiseper
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    ret

; Reset dual-PSG PT3 state on init/restart only. AddToNs must remain persistent
; between ordinary frames, exactly like the PT3 replayer.
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
psg_music_reset_pt3_state:
    xor a
    ld hl, psg_ch_instrument
    ld b, psg_music_pt3_ram_end - psg_ch_instrument
psg_music_reset_pt3_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_pt3_loop
    ld a, #BF
    ld (music_mixer_shadow), a
    ld a, 1
    ld (music_pt3_env_mode), a
    ret

; ------------------------------------------------------------------
; psg_music_play_ptr
; What:   Start the PSG half. HL = psg track data, B bit0 = loop flag.
;         Header layout shared with the SCC serializer.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_play_ptr:
    ld (psg_music_track_ptr), hl
    ld a, b
    and 1
    ld (psg_music_loop_enabled), a
    ld a, (hl)              ; +0 frames per row
    ld (psg_music_row_frames), a
    inc hl
    ld a, (hl)              ; +1 order length
    ld (psg_music_order_len), a
    inc hl
    ld a, (hl)              ; +2 restart position
    ld (psg_music_restart_pos), a
    inc hl
    inc hl                  ; +3 pattern count (implicit via tables)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (psg_music_order_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (psg_music_pattern_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (psg_music_inst_table_ptr), de
    inc hl                  ; -> +10 channel ownership flags
    ld a, (hl)
    and 1
    ld (psg_music_use_ch_c), a   ; PT3/Vortex music normally owns A/B/C
    ld de, 5
    add hl, de               ; +15 pattern bank table pointer
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (psg_music_pattern_bank_ptr), de
    inc hl                  ; +17 ornament pointer table
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (psg_music_orn_table_ptr), de
    push bc
    call psg_music_reset_channels
    call psg_music_reset_pt3_state
    pop bc
    call psg_music_silence
    xor a
    ld (psg_music_muted), a
    call psg_music_set_order_pos
    ld a, 1
    ld (psg_music_row_countdown), a   ; first update plays row 0
    ld (psg_music_active), a
    ret

; Destroys: AF, DE, HL   Preserves: BC, IX, IY
psg_music_set_order_pos:
    ld (psg_music_order_pos), a
    ld e, a
    ld d, 0
    ld hl, (psg_music_order_ptr)
    add hl, de
    ld a, (hl)              ; pattern index
    ld e, a
    ld d, 0
${dataBankEquateName ? `    push de
    ld hl, (psg_music_pattern_bank_ptr)
    add hl, de
    ld a, (hl)
    ld (music_data_bank_cur), a
    ld (#B000), a           ; map the pattern body and its metadata clone
    pop de
` : ''}    ld hl, (psg_music_pattern_table_ptr)
    add hl, de
    add hl, de
    add hl, de              ; entries are 3 bytes: DW rows, DB numRows
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)
    ld (psg_music_pattern_rows), a
    ld (psg_music_row_ptr), de
    xor a
    ld (psg_music_pattern_row), a
    ret

; Destroys: nothing (all registers preserved)
psg_music_stop:
    push af
    push bc
    push de
    push hl
    xor a
    ld (psg_music_active), a
    ld (psg_music_muted), a
    call psg_music_silence
    pop hl
    pop de
    pop bc
    pop af
    ret

; Destroys: AF, E   Preserves: BC, D, HL, IX, IY
psg_music_mute:
    ld a, (psg_music_active)
    or a
    ret z
    ld a, 1
    ld (psg_music_muted), a
    jp psg_music_silence

; Destroys: AF   Preserves: BC, DE, HL, IX, IY
psg_music_resume:
    ld a, (psg_music_active)
    or a
    ret z
    xor a
    ld (psg_music_muted), a  ; write-through re-asserts registers next frame
    ret

; ------------------------------------------------------------------
; psg_music_update
; What:   Advance the PSG half one frame: row timing + cell events,
;         volume envelopes, then re-assert R0..R10.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update:
    ld a, (psg_music_active)
    or a
    ret z
    ld a, (psg_music_muted)
    or a
    ret nz
    ld hl, psg_music_row_countdown
    dec (hl)
    jp nz, psg_music_apply_frame
    ld a, (psg_music_row_frames)
    ld (hl), a
    call psg_music_advance_row
    ld a, (psg_music_active)
    or a
    ret z
psg_music_apply_frame:
    call psg_music_update_ornaments
${pt3FrameCalls}    call psg_music_update_pitch
    call psg_music_update_noise_macro
    call psg_music_update_envelopes
${pt3FrameFinish}    jp psg_music_apply_registers

${pt3Enabled ? `
; Run the shared PT3 step decoder only for descriptors marked pt3-sample.
; Input: none   Output: PT3 channel/reducer state advanced once
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
psg_music_update_pt3_channels:
    ld c, 0
psg_music_pt3_ch_loop:
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    jr z, psg_music_pt3_ch_next
    push bc
    call music_update_one_pt3_channel
    pop bc
psg_music_pt3_ch_next:
    inc c
    ld a, c
    cp 3
    jr c, psg_music_pt3_ch_loop
    ret
` : ''}

; ------------------------------------------------------------------
; psg_music_update_noise_macro
; What:   Per-frame noise-envelope engine: channels with an active
;         noise macro rewrite psg_music_noise_period (R6 is global on
;         the AY; ascending channel order means C wins, matching the
;         PC preview). Same step semantics as the other macros.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_noise_macro:
    ld c, 0
psg_noisem_ch_loop:
    ld e, c
    ld d, 0
    ld hl, psg_ch_pt3mode
    add hl, de
    ld a, (hl)
    or a
    jp nz, psg_noisem_next
    ld hl, psg_ch_note
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, psg_noisem_next   ; silent channel
    ld hl, psg_ch_flags
    add hl, de
    bit 1, (hl)
    jp z, psg_noisem_next   ; noise disabled for this instrument
    ; Decayed notes must release R6: a held drum whose volume envelope hit 0
    ; would otherwise rewrite the noise period forever and stomp SFX noise.
    ld hl, psg_ch_volout
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_noisem_next
    ld hl, psg_ch_noiselen
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_noisem_next   ; no macro: note-on R6 latch stays
    ld b, a                 ; B = macro length
    ld hl, psg_ch_noisestep
    add hl, de
    ld a, (hl)
    cp b
    jp c, psg_noisem_step_ok
    push hl
    ld hl, psg_ch_noiseloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, psg_noisem_step_ok
    ld a, b
    dec a                   ; hold last value
psg_noisem_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch period = noise_env[A] (base+C addressing, E consumed by read)
    push de
    ld hl, psg_ch_noiselo
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_noisehi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    and #1F
    ld (psg_music_noise_period), a
psg_noisem_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_noisem_ch_loop
    ret

; ------------------------------------------------------------------
; psg_music_update_pitch
; What:   Per-frame tone-envelope engine (pitch macros): for each live
;         channel with a tone envelope, effective note = base note +
;         signed semitone offset -> psg_note_period_table -> period
;         shadows. Channels without a tone envelope keep the period
;         cached at note-on. Step semantics mirror the PC preview:
;         step 0 plays on the note-on frame, then +1 per frame, holding
;         the last step unless the loop index points inside the macro.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_pitch:
    ld c, 0
psg_pitchm_ch_loop:
    ld e, c
    ld d, 0
    ld hl, psg_ch_pt3mode
    add hl, de
    ld a, (hl)
    or a
    jp nz, psg_pitchm_next
    ld hl, psg_ch_effective_note
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, psg_pitchm_next   ; silent channel
    ld b, a                 ; B = base note index
    ld hl, psg_ch_tonelen
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_pitchm_next   ; no tone macro: note-on period stays
    push bc                 ; save base note + channel
    ld b, a                 ; B = macro length
    ld hl, psg_ch_tonestep
    add hl, de
    ld a, (hl)
    cp b
    jp c, psg_pitchm_step_ok
    push hl
    ld hl, psg_ch_toneloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, psg_pitchm_step_ok
    ld a, b
    dec a                   ; hold last value
psg_pitchm_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch signed offset = tone_env[A] (same base+C addressing as the
    ; volume envelope fetch: E is consumed by the low-byte read)
    push de
    ld hl, psg_ch_tonelo
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_tonehi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)              ; A = signed semitone offset
    pop de
    pop bc                  ; B = base note, C = channel
    add a, b                ; effective note (mod 256)
    ; clamp to the 96-entry table: 96..159 = overflow high, >=160 = wrapped low
    cp 96
    jp c, psg_pitchm_note_ok
    cp 160
    ld a, 95
    jp c, psg_pitchm_note_ok
    xor a
psg_pitchm_note_ok:
    ld l, a
    ld h, 0
    add hl, hl
    ld de, psg_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = AY period
    ld b, e                 ; base note no longer needed: B = period low
    ld a, d                 ; A = period high
    ld e, c
    ld d, 0
    ld hl, psg_ch_period_lo
    add hl, de
    ld (hl), b
    ld hl, psg_ch_period_hi
    add hl, de
    ld (hl), a
psg_pitchm_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_pitchm_ch_loop
    ret

; Destroys: AF, BC, DE, HL   Preserves: IX, IY
psg_music_advance_row:
    ld hl, (psg_music_row_ptr)
    ld c, 0                 ; channel index
psg_music_row_ch_loop:
    ld b, (hl)              ; note field
    inc hl
    ld d, (hl)              ; instrument field
    inc hl
    ld a, (hl)              ; ornament field
    inc hl
    ld e, (hl)              ; volume field
    inc hl
    push hl
    push bc
    push de
    call psg_music_apply_ornament
    pop de
    call psg_music_apply_cell
    pop bc
    pop hl
    inc c
    ld a, c
    cp 3
    jp c, psg_music_row_ch_loop
    ld (psg_music_row_ptr), hl
    ld hl, psg_music_pattern_row
    inc (hl)
    ld a, (psg_music_pattern_rows)
    cp (hl)
    ret nz
    ; end of pattern: next order entry (wrap to restart position)
    ld a, (psg_music_order_pos)
    inc a
    ld e, a
    ld a, (psg_music_order_len)
    cp e
    jp nz, psg_music_advance_order_set
    ld a, (psg_music_loop_enabled)
    or a
    jp z, psg_music_stop
    ld a, (psg_music_restart_pos)
    ld e, a
psg_music_advance_order_set:
    ld a, e
    jp psg_music_set_order_pos

; ------------------------------------------------------------------
; psg_music_apply_ornament
; What:   Bind/clear a PT3 ornament for one PSG music channel.
; Inputs: A = #FF keep, 0 clear, 1..15 select; C = channel 0..2.
; Output: Per-channel arpeggio pointer/length/loop/step updated.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_apply_ornament:
    cp #FF
    ret z
    or a
    jp z, psg_music_orn_clear
    add a, a
    ld e, a
    ld d, 0
    ld hl, (psg_music_orn_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, psg_music_orn_clear
    ex de, hl
    ld a, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, a
    push hl
    ld hl, psg_ch_arp_len
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_arp_loop
    call psg_ch_ptr
    ld (hl), d
    ld hl, psg_ch_arp_step
    call psg_ch_ptr
    ld (hl), 0
    pop de
    ld hl, psg_ch_arp_lo
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_arp_hi
    call psg_ch_ptr
    ld (hl), d
    ret
psg_music_orn_clear:
    ld hl, psg_ch_arp_len
    call psg_ch_ptr
    ld (hl), 0
    ret

; ------------------------------------------------------------------
; psg_music_update_ornaments
; What:   effective note = base note + signed ornament step, clamp 0..95.
;         Legacy voices get their base period here; native PT3 voices consume
;         psg_ch_effective_note through music_ch_note_base later this frame.
; Inputs: PSG note/arpeggio state. Output: effective notes + tone shadows.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_ornaments:
    ld c, 0
psg_orn_update_loop:
    ld hl, psg_ch_note
    call psg_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, psg_orn_store_effective
    ld b, a
    ld hl, psg_ch_arp_len
    call psg_ch_ptr
    ld a, (hl)
    or a
    jp z, psg_orn_use_base
    ld d, a
    ld hl, psg_ch_arp_step
    call psg_ch_ptr
    ld a, (hl)
    cp d
    jp c, psg_orn_step_ready
    ld hl, psg_ch_arp_loop
    call psg_ch_ptr
    ld a, (hl)
psg_orn_step_ready:
    ld e, a
    inc a
    ld hl, psg_ch_arp_step
    call psg_ch_ptr
    ld (hl), a
    ld hl, psg_ch_arp_lo
    call psg_ch_ptr
    ld a, (hl)
    ld hl, psg_ch_arp_hi
    call psg_ch_ptr
    ld h, (hl)
    ld l, a
    ld d, 0
    add hl, de
    ld a, (hl)
    add a, b
    cp 96
    jp c, psg_orn_store_effective
    cp 160
    ld a, 95
    jp c, psg_orn_store_effective
    xor a
    jp psg_orn_store_effective
psg_orn_use_base:
    ld a, b
psg_orn_store_effective:
    push af
    ld hl, psg_ch_note
    call psg_ch_ptr
    pop af
    ld (hl), a
    cp #FF
    jp z, psg_orn_next
    ld b, a
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    jp nz, psg_orn_next
    ld a, b
    add a, a
    ld l, a
    ld h, 0
    ld de, psg_note_period_table
    add hl, de
    ld b, (hl)
    inc hl
    ld a, (hl)
    ld e, c
    ld d, 0
    ld hl, psg_ch_period_lo
    add hl, de
    ld (hl), b
    ld hl, psg_ch_period_hi
    add hl, de
    ld (hl), a
psg_orn_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_orn_update_loop
    ret

; ------------------------------------------------------------------
; psg_music_apply_cell
; Inputs: C = channel 0..2, B = note field, D = instrument field,
;         E = volume field.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_apply_cell:
    ; ---- instrument field first (note-on may use its volume/flags) ----
    ld a, d
    cp #FF
    jp z, psg_music_cell_volume
    or a
    jp z, psg_music_cell_volume
    push bc                 ; keep note (B) + channel (C)
    push de                 ; keep volume field (E)
    ld e, a
    ld hl, psg_ch_instrument
    call psg_ch_ptr
    ld (hl), e
    ld a, e
    add a, a
    ld e, a
    ld d, 0
    ld hl, (psg_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, psg_music_cell_inst_done   ; null instrument pointer
    ex de, hl               ; HL = instrument record
    push hl
    ld de, MUSIC_INSTRUMENT_PT3_MODE
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld (hl), e
    pop hl
    ld e, (hl)              ; +0 flags
    push hl
    ld hl, psg_ch_flags
    call psg_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +1 default volume
    ld e, (hl)
    push hl
    ld hl, psg_ch_volbase
    call psg_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +2 envelope ptr low
    ld e, (hl)
    inc hl                  ; +3 envelope ptr high
    ld d, (hl)
    inc hl                  ; +4 envelope length
    ld b, (hl)
    inc hl                  ; +5 envelope loop
    ld a, (hl)
    inc hl                  ; +6 noise period
    push hl
    push af                 ; save envelope loop
    push de
    ld hl, psg_ch_envlo
    call psg_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, psg_ch_envhi
    call psg_ch_ptr
    pop de
    ld (hl), d
    ld hl, psg_ch_envlen
    call psg_ch_ptr
    ld (hl), b
    pop af                  ; envelope loop
    ld e, a
    ld hl, psg_ch_envloop
    call psg_ch_ptr
    ld (hl), e
    pop hl                  ; instrument record +6
    ld e, (hl)              ; noise period
    inc hl                  ; -> +7 tone envelope ptr
    push hl
    ld hl, psg_ch_noiseper
    call psg_ch_ptr
    ld (hl), e
    pop hl
    ; ---- tone envelope fields (+7 ptr, +9 length, +10 loop) ----
    ld e, (hl)              ; +7 tone ptr low
    inc hl
    ld d, (hl)              ; +8 tone ptr high
    inc hl
    ld b, (hl)              ; +9 tone length
    inc hl
    ld a, (hl)              ; +10 tone loop
    inc hl                  ; -> +11 noise envelope ptr
    push hl                 ; keep record ptr for the noise fields
    push af
    push de
    ld hl, psg_ch_tonelo
    call psg_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, psg_ch_tonehi
    call psg_ch_ptr
    pop de
    ld (hl), d
    ld hl, psg_ch_tonelen
    call psg_ch_ptr
    ld (hl), b
    pop af
    ld e, a
    ld hl, psg_ch_toneloop
    call psg_ch_ptr
    ld (hl), e
    pop hl                  ; record ptr at +11
    ; ---- noise envelope fields (+11 ptr, +13 length, +14 loop) ----
    ld e, (hl)              ; +11 noise ptr low
    inc hl
    ld d, (hl)              ; +12 noise ptr high
    inc hl
    ld b, (hl)              ; +13 noise length
    inc hl
    ld a, (hl)              ; +14 noise loop
    push af
    push de
    ld hl, psg_ch_noiselo
    call psg_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, psg_ch_noisehi
    call psg_ch_ptr
    pop de
    ld (hl), d
    ld hl, psg_ch_noiselen
    call psg_ch_ptr
    ld (hl), b
    pop af
    ld e, a
    ld hl, psg_ch_noiseloop
    call psg_ch_ptr
    ld (hl), e
psg_music_cell_inst_done:
    pop de
    pop bc
psg_music_cell_volume:
    ; ---- volume field: overrides the channel volume base ----
    ld a, e
    cp #FF
    jp z, psg_music_cell_note
    and #0F
    ld e, a
    ld hl, psg_ch_volbase
    call psg_ch_ptr
    ld (hl), e
psg_music_cell_note:
    ; ---- note field ----
    ld a, b
    cp #FF
    ret z                   ; keep playing
    cp #FE
    jp z, psg_music_cell_note_cut
    ; note on: store note, restart envelope, cache the AY period, arm noise
    ld e, a
    ld hl, psg_ch_effective_note
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    jr z, psg_music_note_pt3_reset_done
    call psg_music_reset_pt3_channel
    call psg_music_arm_pt3_envelope
psg_music_note_pt3_reset_done:
    ld hl, psg_ch_envstep
    call psg_ch_ptr
    ld (hl), 0
    ld hl, psg_ch_tonestep
    call psg_ch_ptr
    ld (hl), 0              ; tone macro restarts on every note-on
    ld hl, psg_ch_noisestep
    call psg_ch_ptr
    ld (hl), 0              ; noise macro restarts on every note-on
    ld a, b                  ; B still holds the note; PT3 envelope arming may clobber DE
    ld l, a
    ld h, 0
    add hl, hl
    ld de, psg_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld hl, psg_ch_period_lo
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_period_hi
    call psg_ch_ptr
    ld (hl), d
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    ret nz                  ; PT3 step owns gates, volume and global R6
    ; noise-capable instrument: latch R6 (single global noise register)
    ld hl, psg_ch_flags
    call psg_ch_ptr
    bit 1, (hl)
    ret z
    ld hl, psg_ch_noiseper
    call psg_ch_ptr
    ld a, (hl)
    ld (psg_music_noise_period), a
    ret
psg_music_cell_note_cut:
    ld hl, psg_ch_note
    call psg_ch_ptr
    ld (hl), #FF            ; envelope engine outputs volume 0 for silent notes
    ret

; Reset the per-channel PT3 state group on note-on (CHNPRM reset semantics).
; Input: C = channel 0..2
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
psg_music_reset_pt3_channel:
    ld hl, music_pt3_sample_pos_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_tone_acc_lo_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_tone_acc_hi_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_amp_slide_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_noise_acc_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_env_acc_lo_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_env_acc_hi_base
    call psg_ch_ptr
    ld (hl), 0
    ret

; Arm R13 only on PT3 note-on, and only when the descriptor explicitly has a
; hardware-envelope shape. music_pt3_finalize_frame performs the single write.
; Input: C = channel 0..2
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
psg_music_arm_pt3_envelope:
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    ret z
    ld a, (hl)              ; +0 flags, bit2 = hardware envelope configured
    and #04
    ret z
    ld de, 21
    add hl, de
    ld a, (hl)
    and #0F
    ld (music_pt3_r13_value), a
    ld a, 1
    ld (music_pt3_r13_pending), a
    ret

; ------------------------------------------------------------------
; psg_music_update_envelopes
; What:   Per-frame volume per channel into psg_ch_volout (no port
;         writes here; psg_music_apply_registers flushes everything).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_envelopes:
    ld c, 0
psg_music_env_ch_loop:
    ld hl, psg_ch_note
    ld e, c
    ld d, 0
    ld hl, psg_ch_pt3mode
    add hl, de
    ld a, (hl)
    or a
    jp nz, psg_music_env_next
    ld hl, psg_ch_note
    add hl, de
    ld a, (hl)
    cp #FF
    jp nz, psg_music_env_live
    xor a                   ; silent channel -> volume 0
    jp psg_music_env_store
psg_music_env_live:
    ld hl, psg_ch_envlen
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_music_env_use_base
    ld b, a                 ; B = length
    ld hl, psg_ch_envstep
    add hl, de
    ld a, (hl)
    cp b
    jp c, psg_music_env_step_ok
    push hl
    ld hl, psg_ch_envloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, psg_music_env_step_ok
    ld a, b
    dec a                   ; hold last value
psg_music_env_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    push de
    ld hl, psg_ch_envlo
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_envhi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    ; attenuate by volume base: vol = min(env, volbase)
    ld hl, psg_ch_volbase
    add hl, de
    cp (hl)
    jp c, psg_music_env_store
    ld a, (hl)
    jp psg_music_env_store
psg_music_env_use_base:
    ld hl, psg_ch_volbase
    add hl, de
    ld a, (hl)
psg_music_env_store:
    ld hl, psg_ch_volout
    add hl, de
    ld (hl), a
psg_music_env_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_music_env_ch_loop
    ret

${pt3Enabled ? `; ------------------------------------------------------------------
; Shared PT3 runtime adapters for the dual PSG state layout.
; ------------------------------------------------------------------
; Input: C = channel. Output: HL = active instrument descriptor or zero.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
music_get_channel_instrument_ptr:
    ld hl, psg_ch_instrument
    call psg_ch_ptr
    ld a, (hl)
    or a
    jr z, music_get_channel_instrument_none
    add a, a
    ld e, a
    ld d, 0
    ld hl, (psg_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ret
music_get_channel_instrument_none:
    ld hl, 0
    ret

; Input: HL=array base, C=channel. Output: A=value.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
music_load_channel_byte:
    call psg_ch_ptr
    ld a, (hl)
    ret

; Input: HL=array base, C=channel, A=value.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
music_store_channel_byte:
    push af
    call psg_ch_ptr
    pop af
    ld (hl), a
    ret

; Dual runtime currently stores no ornament macro in its row ABI. Keep the
; already-clamped base note in B; sample-step tone deltas remain exact.
; Input/output: B=note   Destroys: none
music_apply_channel_ornament_macro:
    ret

; Input: A=track-header offset. Output: HL=address.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
music_get_track_header_ptr:
    ld e, a
    ld d, 0
    ld hl, (psg_music_track_ptr)
    add hl, de
    ret
music_read_track_byte:
    call music_get_track_header_ptr
    ld a, (hl)
    ret

; PT3 channel-local AY adapters write the existing dual shadows. The common
; psg_music_apply_registers routine flushes them after the reducer finishes.
; Input: A=channel, HL=period.
psg_set_tone:
    ld c, a
    ld e, l
    ld d, h
    ld hl, psg_ch_period_lo
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_period_hi
    call psg_ch_ptr
    ld (hl), d
    ret

; Input: A=channel, B=volume.
psg_set_volume:
    ld c, a
    ld e, b
    ld hl, psg_ch_volout
    call psg_ch_ptr
    ld (hl), e
    ret

; Input: A=noise period byte.
psg_set_noise:
    ld (psg_music_noise_period), a
    ret

; Input: A=PSG register, E=value.
psg_write:
    jp psg_reg_write

${pt3SampleRuntimeAsm}
` : ''}
; ------------------------------------------------------------------
; psg_music_apply_registers
; What:   Re-assert R0..R10 from cached state (write-through: heals any
;         register a fire-and-forget SFX blip may have stomped).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_apply_registers:
    ld c, 0
psg_music_apply_ch_loop:
    ; Channel C belongs to gameplay SFX when the song leaves it free: skip
    ; its period + volume writes entirely so fire-and-forget SFX survive.
    ld a, c
    cp 2
    jp nz, psg_music_apply_ch_drive
    ld a, (psg_music_use_ch_c)
    or a
    jp z, psg_music_apply_ch_skip
psg_music_apply_ch_drive:
    ld e, c
    ld d, 0
    ld hl, psg_ch_period_lo
    add hl, de
    ld b, (hl)              ; B = period low
    ld hl, psg_ch_period_hi
    add hl, de
    ld d, (hl)              ; D = period high (E still = channel)
    ld a, c
    add a, a                ; register 2*c
    push de
    ld e, b
    call psg_reg_write      ; R(2c) = period low
    pop de
    ld a, c
    add a, a
    inc a
    ld e, d
    call psg_reg_write      ; R(2c+1) = period high
    ld e, c
    ld d, 0
    ld hl, psg_ch_volout
    add hl, de
    ld e, (hl)
    ld a, 8
    add a, c
    call psg_reg_write      ; R(8+c) = volume (0 when silent)
psg_music_apply_ch_skip:
    inc c
    ld a, c
    cp 3
    jp c, psg_music_apply_ch_loop
    ; R6 noise period
    ld a, (psg_music_noise_period)
    and #1F
    ld e, a
    ld a, 6
    call psg_reg_write
    ; R7 mixer from live notes + per-channel flags. #BF base keeps the MSX
    ; AY I/O port directions (bit7=1, bit6=0); tone bits 0-2, noise bits 3-5.
    ld d, #BF
    ld a, (psg_ch_note)
    cp #FF
    jp z, psg_music_mixer_chB
    ld a, (psg_ch_flags)
    bit 0, a
    jp z, psg_music_mixer_chA_noise
    res 0, d
psg_music_mixer_chA_noise:
    bit 1, a
    jp z, psg_music_mixer_chB
    res 3, d
psg_music_mixer_chB:
    ld a, (psg_ch_note + 1)
    cp #FF
    jp z, psg_music_mixer_chC
    ld a, (psg_ch_flags + 1)
    bit 0, a
    jp z, psg_music_mixer_chB_noise
    res 1, d
psg_music_mixer_chB_noise:
    bit 1, a
    jp z, psg_music_mixer_chC
    res 4, d
psg_music_mixer_chC:
    ; Song leaves C to gameplay SFX: take C's mixer bits (2 tone, 5 noise)
    ; from the SFX shadow so the per-frame R7 heal cannot cut a live blip.
    ld a, (psg_music_use_ch_c)
    or a
    jp nz, psg_music_mixer_chC_song
    ld a, d
    and #DB                 ; clear bits 2+5
    ld d, a
    ld a, (psg_sfx_r7_c_bits)
    and #24                 ; keep only C's tone/noise bits
    or d
    ld d, a
    jp psg_music_mixer_write
psg_music_mixer_chC_song:
    ld a, (psg_ch_note + 2)
    cp #FF
    jp z, psg_music_mixer_write
    ld a, (psg_ch_flags + 2)
    bit 0, a
    jp z, psg_music_mixer_chC_noise
    res 2, d
psg_music_mixer_chC_noise:
    bit 1, a
    jp z, psg_music_mixer_write
    res 5, d
psg_music_mixer_write:
${pt3Enabled ? `    ; Replace the static legacy flags with each PT3 step's live gates.
    ld a, (psg_ch_pt3mode)
    or a
    jr z, psg_music_mixer_pt3_b
    ld a, d
    and #F6                 ; clear A tone/noise bits 0+3
    ld d, a
    ld a, (music_mixer_shadow)
    and #09
    or d
    ld d, a
psg_music_mixer_pt3_b:
    ld a, (psg_ch_pt3mode + 1)
    or a
    jr z, psg_music_mixer_pt3_c
    ld a, d
    and #ED                 ; clear B tone/noise bits 1+4
    ld d, a
    ld a, (music_mixer_shadow)
    and #12
    or d
    ld d, a
psg_music_mixer_pt3_c:
    ld a, (psg_ch_pt3mode + 2)
    or a
    jr z, psg_music_mixer_pt3_done
    ld a, d
    and #DB                 ; clear C tone/noise bits 2+5
    ld d, a
    ld a, (music_mixer_shadow)
    and #24
    or d
    ld d, a
psg_music_mixer_pt3_done:
` : ''}    ld e, d
    ld a, 7
    jp psg_reg_write`;
}

// ---------------------------------------------------------------------------
// standalone test ROM (Fase 1 proof: Mideas model -> ROM -> OpenMSX)
// ---------------------------------------------------------------------------

interface SccMusicPieces {
  serialized: SccSerializedTrack[];
  warnings: string[];
  waveTable: number[][];
  /** Shared note/vibrato/noise/wave tables, ending with a blank separator. */
  tablesAsm: string;
}

function serializeSccMusicPieces(tracks: TrackerSongData[]): SccMusicPieces {
  const warnings: string[] = [];
  const waveKeyToIndex = new Map<string, number>();
  const waveTable: number[][] = [];
  const serialized = tracks.map((track, index) => {
    warnings.push(...validateSccTrack(track));
    return buildSccTrackData(track, index, waveKeyToIndex, waveTable, warnings);
  });
  const waveBytes: number[] = [];
  for (const wave of waveTable) for (const sample of wave) waveBytes.push(sample & 0xff);
  const tablesAsm = [
    buildSccNotePeriodTable(),
    '',
    buildSccVibratoTable(),
    '',
    buildSccNoiseTable(),
    '',
    `; ${waveTable.length} unique waveform(s), 32 bytes each (signed two's complement)`,
    buildDbLines('scc_wave_table', waveBytes),
    '',
  ].join('\n');
  return { serialized, warnings, waveTable, tablesAsm };
}

export function buildSccMusicData(tracks: TrackerSongData[]): SccMusicBuildResult & { trackDataLabels: string[] } {
  const pieces = serializeSccMusicPieces(tracks);
  return {
    asm: [pieces.tablesAsm, ...pieces.serialized.map((t) => t.asm)].join('\n'),
    trackCount: tracks.length,
    waveformCount: pieces.waveTable.length,
    warnings: pieces.warnings,
    trackDataLabels: pieces.serialized.map((t) => t.dataLabel),
  };
}

/**
 * Count the bytes a data-only ASM fragment assembles to. The music serializers
 * emit ONLY labels, comments and DB/DW lines (no strings, no DS), so counting
 * comma-separated items is exact: 1 byte per DB item, 2 per DW item.
 */
function countAsmDataBytes(asm: string): number {
  let total = 0;
  for (const rawLine of asm.split('\n')) {
    const line = rawLine.split(';')[0].trim();
    const match = line.match(/^(DB|DW)\s+(.+)$/i);
    if (!match) continue;
    total += match[2].split(',').length * (match[1].toUpperCase() === 'DW' ? 2 : 1);
  }
  return total;
}

/**
 * Clone an ASM fragment renaming every label it DEFINES (and their in-fragment
 * references) with a suffix. Used to duplicate the shared-table header in each
 * extra music bank: same bytes at the same #A000-window addresses, but without
 * colliding with the canonical bank-0 labels the driver references.
 */
function cloneAsmWithSuffixedLabels(asm: string, suffix: string): string {
  const labels = new Set<string>();
  for (const line of asm.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):/);
    if (match) labels.add(match[1]);
  }
  let out = asm;
  for (const label of labels) {
    out = out.replace(new RegExp(`\\b${label}\\b`, 'g'), `${label}${suffix}`);
  }
  return out;
}

function setPsgPatternBankTable(asm: string, bankPrefix: string, patternChunks: number[]): string {
  return asm.replace(/DB #00\s+; @mideas:pattern-bank (\d+)/g, (_line, rawIndex: string) => {
    const patternIndex = Number(rawIndex);
    const chunkIndex = patternChunks[patternIndex] ?? patternChunks[0] ?? 0;
    return `DB ${bankPrefix}_${chunkIndex}          ; @mideas:pattern-bank ${patternIndex}`;
  });
}

/**
 * Emit the SCC backend behind the stable Mideas music_* API. Projects mixing
 * PSG/PT3 music and SCC music are rejected by soundGenerator.ts; PSG sound
 * effects remain available because they use the separate sfx_* API.
 */
export interface SccIntegratedMusicOptions {
  /** When set, song DATA lives in its own MegaROM bank(s) mapped into the P3
   *  #A000 window only while music_play_track / music_update run. The value
   *  is the EQU name PREFIX: the caller must define `${prefix}_${i}` with the
   *  bank number of dataBankChunks[i] (e.g. BITMAP_MUSIC_DATA_BANK_0). The
   *  wrappers pick each track's bank via music_track_bank_table and restore
   *  the resident boot-image bank 3 afterwards. */
  dataBankEquateName?: string;
  /** Shared, byte-exact native PT3 sample Z80 runtime. The bitmap route passes
   * the standalone PSG implementation so dual-chip songs do not degrade PT3
   * instruments into legacy envelopes during ROM export. */
  pt3SampleRuntimeAsm?: string;
}

export function buildSccIntegratedMusicBlock(
  tracks: TrackerSongData[],
  dualTracks: TrackerSongData[] = [],
  options: SccIntegratedMusicOptions = {}
): SccIntegratedMusicResult {
  // Combined track index space: SCC-only tracks first, then dual-chip tracks.
  // The SCC serializer reads channels '1'..'5' + SCC instruments, so it works
  // unchanged on dual songs (their SCC half); the PSG half gets its own data.
  // Dual songs with the SCC switch off keep only their PSG half: strip the
  // SCC channels so leftover notes on 1-5 cannot sound.
  const normalizedDuals = dualTracks.map((track) => {
    if (track.soundChip !== 'PSG+SCC' || track.sccEnabled !== false) return track;
    return {
      ...track,
      patterns: (track.patterns || []).map((pattern) => ({
        ...pattern,
        rows: (pattern.rows || []).map((row) => {
          const stripped: typeof row = {};
          for (const [channelId, cell] of Object.entries(row || {})) {
            if (!SCC_TRACK_CHANNELS.includes(channelId as any)) stripped[channelId] = cell;
          }
          return stripped;
        }),
      })),
    };
  });
  const combined = [...tracks, ...normalizedDuals];
  const hasDual = dualTracks.length > 0;
  const dualHasPT3Samples = dualTracks.some((track) =>
    (track.instruments || []).some((instrument) => !isSccInstrument(instrument) && hasNativePT3Sample(instrument as PT3Instrument)));
  if (dualHasPT3Samples && !options.pt3SampleRuntimeAsm?.trim()) {
    throw new Error('Dual PSG+SCC export contains pt3-sample instruments but no native PT3 sample runtime was supplied.');
  }
  // Dual/PSG tracks whose SCC half has no notes share ONE tiny silent stub
  // (1 pattern x 1 empty row) instead of serializing a full run of no-event
  // rows (~2.5KB each): music data must fit the 8KB resident #A000 bank.
  const trackHasSccNotes = (track: TrackerSongData): boolean =>
    (track.patterns || []).some((pattern) =>
      (pattern.rows || []).some((row) =>
        SCC_TRACK_CHANNELS.some((channelId) => isSoundingTrackerNote((row as any)?.[channelId]?.note))
      )
    );
  const dualNeedsScc = normalizedDuals.map(trackHasSccNotes);
  const anyStub = dualNeedsScc.some((needs) => !needs);
  const sccStubTrack: TrackerSongData = {
    id: 'scc_silent_stub',
    name: 'scc_silent_stub',
    // 'PSG' on purpose: the serializer ignores soundChip (it always reads
    // channels 1-5) and validateSccTrack skips the no-SCC-instruments
    // warning for PSG-tagged tracks — the stub is empty by design.
    soundChip: 'PSG',
    bpm: 150,
    speed: 6,
    globalVolume: 0,
    patterns: [{ id: 'stub_p0', name: 'stub', numRows: 1, rows: [{} as any] }],
    order: [0],
    lengthInPatterns: 1,
    restartPosition: 0,
    instruments: [],
    ornaments: [],
    currentPatternIndexInOrder: 0,
  };
  const serializedSccTracks = [
    ...tracks,
    ...normalizedDuals.filter((_, index) => dualNeedsScc[index]),
    ...(anyStub ? [sccStubTrack] : []),
  ];
  const pieces = serializeSccMusicPieces(serializedSccTracks);
  const warnings = pieces.warnings;
  // Per combined index -> serialized SCC track (null = shared silent stub).
  const stubSerialized = anyStub ? pieces.serialized[pieces.serialized.length - 1] : null;
  const stubLabel = stubSerialized ? stubSerialized.dataLabel : '';
  const combinedSccLabels: string[] = [];
  const combinedSccTracks: Array<SccSerializedTrack | null> = [];
  let serializedCursor = 0;
  for (let index = 0; index < combined.length; index++) {
    const isDualIndex = index >= tracks.length;
    if (!isDualIndex || dualNeedsScc[index - tracks.length]) {
      combinedSccLabels.push(pieces.serialized[serializedCursor].dataLabel);
      combinedSccTracks.push(pieces.serialized[serializedCursor]);
      serializedCursor += 1;
    } else {
      combinedSccLabels.push(stubLabel);
      combinedSccTracks.push(null);
    }
  }
  const psgSerialized = dualTracks.map((track, index) =>
    buildPsgTrackData(track, tracks.length + index, warnings)
  );
  const psgPtrTable = hasDual
    ? `; PSG half pointer per combined track index (0 = SCC-only track)
music_psg_ptr_table:
${combined.map((_, index) => `    DW ${index >= tracks.length ? psgSerialized[index - tracks.length].dataLabel : '0'}`).join('\n')}`
    : '';
  // ---- MegaROM multi-bank packing (only with dataBankEquateName) ----
  // Every music bank starts with the SAME header (SCC tables [+PSG note table]
  // [+silent SCC stub]): identical bytes at identical #A000-window offsets, so
  // the driver's canonical bank-0 labels stay valid whichever bank is mapped.
  // Ordinary tracks remain one unit. An oversized PSG or dual PSG+SCC song is
  // split by pattern: descriptor/tables/instruments are duplicated in every
  // occupied bank, while each pattern body lives once and the PSG half carries
  // the bank-table entry shared by both players. music_update runs SCC first,
  // then PSG: at an order boundary SCC resolves the next row address while the
  // old bank is mapped, PSG maps that pattern's bank, and both consume the new
  // row from the newly mapped bank on the following frame.
  const MUSIC_BANK_BYTES = 8192;
  const bankPrefix = options.dataBankEquateName;
  const headerAsm = [
    pieces.tablesAsm,
    ...(hasDual ? [buildPsgNotePeriodTable(), ''] : []),
    ...(dualHasPT3Samples ? [buildNativePT3VolumeTable(), ''] : []),
    ...(stubSerialized ? [stubSerialized.asm, ''] : []),
  ].join('\n');
  const headerBytes = countAsmDataBytes(headerAsm);
  const bankCapacity = MUSIC_BANK_BYTES - headerBytes;
  const chunkOfTrack: number[] = [];
  const chunkUnits: Array<{ units: string[]; usedBytes: number }> = [];
  if (bankPrefix) {
    combined.forEach((track, index) => {
      const psgTrack = index >= tracks.length ? psgSerialized[index - tracks.length] : null;
      const rawUnitAsm = [
        ...(combinedSccTracks[index] ? [combinedSccTracks[index]!.asm] : []),
        ...(psgTrack ? [psgTrack.asm] : []),
      ].join('\n');
      const unitBytes = countAsmDataBytes(rawUnitAsm);
      if (unitBytes > bankCapacity) {
        if (!psgTrack) {
          throw new Error(`SCC music: track "${track.name}" serializes to ${unitBytes} bytes and cannot fit one 8KB music data bank.`);
        }
        const sccTrack = combinedSccTracks[index];
        if (sccTrack && sccTrack.patternAsms.length !== psgTrack.patternAsms.length) {
          throw new Error(`Dual music: "${track.name}" has mismatched SCC/PSG pattern counts and cannot be pattern-banked safely.`);
        }
        const combinedMetadataAsm = [
          ...(sccTrack ? [sccTrack.metadataAsm] : []),
          psgTrack.metadataAsm,
        ].join('\n');
        const metadataBytes = countAsmDataBytes(combinedMetadataAsm);
        const patternGroups: number[][] = [];
        let group: number[] = [];
        let groupBytes = metadataBytes;
        psgTrack.patternAsms.forEach((patternAsm, patternIndex) => {
          const patternBytes = countAsmDataBytes(patternAsm) +
            (sccTrack ? countAsmDataBytes(sccTrack.patternAsms[patternIndex]) : 0);
          if (metadataBytes + patternBytes > bankCapacity) {
            throw new Error(`Music: pattern ${patternIndex} of "${track.name}" needs ${metadataBytes + patternBytes} bytes including metadata and cannot fit one 8KB bank.`);
          }
          if (group.length > 0 && groupBytes + patternBytes > bankCapacity) {
            patternGroups.push(group);
            group = [];
            groupBytes = metadataBytes;
          }
          group.push(patternIndex);
          groupBytes += patternBytes;
        });
        if (group.length > 0) patternGroups.push(group);

        const firstChunk = chunkUnits.length;
        const patternChunks = Array(psgTrack.patternAsms.length).fill(firstChunk);
        patternGroups.forEach((patternIndexes, groupIndex) => {
          patternIndexes.forEach((patternIndex) => { patternChunks[patternIndex] = firstChunk + groupIndex; });
        });
        patternGroups.forEach((patternIndexes, groupIndex) => {
          const chunkIndex = firstChunk + groupIndex;
          const canonicalMetadata = setPsgPatternBankTable(combinedMetadataAsm, bankPrefix, patternChunks);
          const metadata = groupIndex === 0
            ? canonicalMetadata
            : cloneAsmWithSuffixedLabels(canonicalMetadata, `_track${index}_mb${chunkIndex}`);
          const patternBodies = patternIndexes.flatMap((patternIndex) => [
            ...(sccTrack ? [sccTrack.patternAsms[patternIndex]] : []),
            psgTrack.patternAsms[patternIndex],
          ]);
          const splitUnit = [metadata, ...patternBodies].join('\n');
          chunkUnits.push({ units: [splitUnit], usedBytes: countAsmDataBytes(splitUnit) });
        });
        chunkOfTrack.push(firstChunk);
        return;
      }
      let current = chunkUnits[chunkUnits.length - 1];
      if (!current || current.usedBytes + unitBytes > bankCapacity) {
        current = { units: [], usedBytes: 0 };
        chunkUnits.push(current);
      }
      const chunkIndex = chunkUnits.length - 1;
      const unitAsm = psgTrack
        ? [
            ...(combinedSccTracks[index] ? [combinedSccTracks[index]!.asm] : []),
            setPsgPatternBankTable(psgTrack.asm, bankPrefix, Array(psgTrack.patternAsms.length).fill(chunkIndex)),
          ].join('\n')
        : rawUnitAsm;
      current.units.push(unitAsm);
      current.usedBytes += unitBytes;
      chunkOfTrack.push(chunkIndex);
    });
  }
  const dataBankChunks = chunkUnits.map((chunk, chunkIndex) => ({
    asm: [
      `; ---- music bank chunk ${chunkIndex}: shared header (${headerBytes} bytes) + ${chunk.units.length} track blob(s) ----`,
      chunkIndex === 0 ? headerAsm : cloneAsmWithSuffixedLabels(headerAsm, `_mb${chunkIndex}`),
      ...chunk.units,
    ].join('\n'),
    usedBytes: headerBytes + chunk.usedBytes,
  }));

  const warningComments = warnings.length > 0
    ? warnings.map((warning) => `; WARNING SCC: ${warning.replace(/[\r\n]+/g, ' ')}`).join('\n')
    : '; SCC validation: no warnings';

  // Dual variants drive BOTH chips behind the same public API; the SCC-only
  // variants below stay byte-identical to the pre-dual output.
  const publicApi = `; ==================================================================
; MIDEAS PUBLIC MUSIC API -> ${hasDual ? 'SCC + PSG DUAL' : 'SCC'} BACKEND
; Game Flow, State Machines and world transitions keep using music_*.
; ==================================================================
; @mideas:block id=runtime.sound.music_scc_public kind=routine owner=sound roots=music_init_system,music_play_track,music_execute_command,music_update,music_stop,music_mute,music_resume

; Inputs: none. Destroys: AF, B, HL. Preserves: C, DE, IX, IY.
music_init_system:
    call scc_music_init_system
${hasDual ? `    call psg_music_init_system
` : ''}    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ld (music_track_index), a
${bankPrefix ? `    ld a, ${bankPrefix}_0
    ld (music_data_bank_cur), a  ; sane bank for music_update before any play
` : ''}    ret

; Inputs: A = track index, B bit 0 = loop. Destroys: AF, BC, DE, HL.
${bankPrefix ? `music_play_track:
    push af                 ; A = track index (the bank lookup clobbers A)
    ld e, a
    ld d, 0
    ld hl, music_track_bank_table
    add hl, de
    ld a, (hl)
    ld (music_data_bank_cur), a
    ld (#B000), a           ; map this track's music data bank into P3 (#A000)
    pop af
    call music_play_track_impl
    ld a, 3
    ld (#B000), a           ; restore the resident boot-image bank in P3
    ret
` : ''}music_play_track${bankPrefix ? '_impl' : ''}:
    ld (music_track_index), a
    push af
    ld a, b
    and 1
    ld (music_loop), a
    pop af
${hasDual ? `    push af
    push bc
    call scc_music_play_track
    pop bc
    pop af
    ; PSG half: resolve the dual pointer for this combined index
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_psg_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, music_play_track_no_psg
    ex de, hl
    call psg_music_play_ptr    ; HL = psg data, B bit0 = loop
    jp music_play_track_done
music_play_track_no_psg:
    call psg_music_stop
music_play_track_done:
    ld a, (scc_music_active)
    ld hl, psg_music_active
    or (hl)
    ld (music_active), a
` : `    call scc_music_play_track
    ld a, (scc_music_active)
    ld (music_active), a
`}    xor a
    ld (music_muted), a
    ret

; Inputs: none. Destroys: AF, BC, HL. Preserves: DE, IX, IY.
music_stop:
    call scc_music_stop
${hasDual ? `    call psg_music_stop
` : ''}    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ret

music_mute:
    call scc_music_mute
${hasDual ? `    call psg_music_mute
` : ''}    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

music_resume:
    call scc_music_resume
${hasDual ? `    call psg_music_resume
` : ''}    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

; Inputs: none. Destroys: AF, BC, DE, HL. Call once per frame outside H.TIMI.
${bankPrefix ? `music_update:
    ld a, (music_data_bank_cur)
    ld (#B000), a           ; map the current track's music bank into P3 (#A000)
    call music_update_impl
    ld a, 3
    ld (#B000), a           ; restore the resident boot-image bank in P3
    ret
` : ''}music_update${bankPrefix ? '_impl' : ''}:
    call scc_music_update
${hasDual ? `    call psg_music_update
    ld a, (scc_music_active)
    ld hl, psg_music_active
    or (hl)
    ld (music_active), a
` : `    ld a, (scc_music_active)
    ld (music_active), a
`}    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

; Input: DE -> [command, trackIndex, loopFlag].
; Commands: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op.
; Destroys: AF, BC (play path), DE (play path), HL.
music_execute_command:
    ld a, (de)
    cp #FF
    ret z
    or a
    jp z, music_stop
    cp 1
    jp z, music_execute_scc_play
    cp 2
    jp z, music_mute
    cp 3
    jp z, music_resume
    ret
music_execute_scc_play:
    inc de
    ld a, (de)
    ld c, a
    inc de
    ld a, (de)
    ld b, a
    ld a, c
    jp music_play_track

music_track_count:
    DB ${toAsmByte(combined.length)}
${bankPrefix ? `; MegaROM bank holding each combined track's serialized data (music banks
; share a header, so any bank satisfies the driver's fixed-table labels).
music_track_bank_table:
${combined.map((_, index) => `    DB ${bankPrefix}_${chunkOfTrack[index]}`).join('\n')}
` : ''}; @mideas:endblock id=runtime.sound.music_scc_public`;

  const runtimeParts = [
    warningComments,
    buildSccDriverPrimitives(),
    buildSccMusicRuntime(combinedSccLabels),
  ];
  if (hasDual) {
    runtimeParts.push(buildPsgMusicRuntime(dualHasPT3Samples ? options.pt3SampleRuntimeAsm : '', bankPrefix));
  }
  runtimeParts.push(publicApi);
  if (hasDual) {
    runtimeParts.push(psgPtrTable);
  }
  const dataParts = [
    '; ==================================================================',
    '; SCC MUSIC DATA',
    '; ==================================================================',
  ];
  if (bankPrefix) {
    // Multi-bank: the caller emits each chunk in its own 8KB MegaROM bank
    // (org #A000 + ds guard); dataAsm keeps the joined form for inspection.
    dataParts.push(...dataBankChunks.map((chunk) => chunk.asm));
  } else {
    dataParts.push([pieces.tablesAsm, ...pieces.serialized.map((t) => t.asm)].join('\n'));
    if (hasDual) {
      dataParts.push(
        '; ==================================================================',
        '; PSG MUSIC DATA (dual-chip halves)',
        '; ==================================================================',
        buildPsgNotePeriodTable(),
        ...(dualHasPT3Samples ? [buildNativePT3VolumeTable()] : []),
        ...psgSerialized.map((track) => track.asm),
      );
    }
  }
  const runtimeAsm = runtimeParts.join('\n\n');
  const dataAsm = dataParts.join('\n\n');
  return {
    asm: `${runtimeAsm}\n\n${dataAsm}`,
    runtimeAsm,
    dataAsm,
    dataBankChunks: bankPrefix ? dataBankChunks : undefined,
    trackCount: combined.length,
    waveformCount: pieces.waveTable.length,
    warnings,
  };
}

/**
 * Build a complete standalone Konami SCC test ROM that boots, starts track 0
 * and exposes the player state as RAM markers for the OpenMSX smoke script.
 * Same marker map as test/scc/scc_vgm_play.asm.
 */
export function generateSccTestRom(tracks: TrackerSongData[]): { asm: string; warnings: string[]; waveformCount: number } {
  const data = buildSccMusicData(tracks);
  const ram = buildSccMusicRam(0xc040);
  const asm = `; =============================================================================
; SCC MUSIC TEST ROM — generated by utils/msxGenerator/generators/sccSoundGenerator.ts
; Boots as a Konami SCC cartridge, plays SCC track 0 through the Fase 1
; runtime and exposes player state as RAM markers for the OpenMSX smoke.
; =============================================================================

ENASLT          EQU #0024
RSLREG          EQU #0138
EXPTBL          EQU #FCC1

marker_boot     EQU #C000
marker_slot     EQU #C001
marker_sccinit  EQU #C002
marker_ready    EQU #C005
frame_counter   EQU #C006
marker_stopped  EQU #C008
req_stop        EQU #C010
mapper_bank_p2_current EQU ${toAsmWord(ram.nextFree)}

${ram.asm}

    org #4000
    db "AB"
    dw INIT
    ds 12, 0

INIT:
    di
    ld sp, #F380
    xor a
    ld (marker_slot), a
    ld (marker_sccinit), a
    ld (marker_ready), a
    ld (frame_counter), a
    ld (marker_stopped), a
    ld (req_stop), a
    ld a, 1
    ld (marker_boot), a

    call enable_page2_cart
    ld a, 2
    ld (marker_slot), a
    ld (mapper_bank_p2_current), a

    call scc_music_init_system
    ld a, 3
    ld (marker_sccinit), a

    xor a                   ; track 0
    ld b, 1                 ; loop flag
    call scc_music_play_track

    ld a, 5
    ld (marker_ready), a
    ei

main_loop:
    halt
    ld a, (req_stop)
    or a
    jp nz, request_stop
    call scc_music_update
    ld hl, frame_counter
    inc (hl)
    jp main_loop

request_stop:
    call scc_music_stop
    ld a, 1
    ld (marker_stopped), a
halt_loop:
    halt
    jp halt_loop

; -----------------------------------------------------------------------------
; enable_page2_cart
; What:   Map CPU page 2 to this cartridge's slot (Konami SCC access).
; Inputs: DI required. Running from page 1.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; -----------------------------------------------------------------------------
enable_page2_cart:
    call RSLREG
    rrca
    rrca
    and #03
    ld c, a
    ld b, 0
    ld hl, EXPTBL
    add hl, bc
    ld a, (hl)
    and #80
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
    or c
    ld h, #80
    call ENASLT
    ret

; Standalone-test mapper subset. Integrated Mideas ROMs use mapper.asm.
mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
    ld (#9000), a
    ret

${buildSccDriverPrimitives()}

${buildSccMusicRuntime(data.trackDataLabels)}

; ==================================================================
; MUSIC DATA
; ==================================================================
${data.asm}

; Pad to 32 KB = 4 Konami SCC banks of 8 KB.
    ds #C000 - $, #FF
`;
  return { asm, warnings: data.warnings, waveformCount: data.waveformCount };
}
