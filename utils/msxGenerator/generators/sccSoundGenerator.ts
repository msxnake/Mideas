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

import type { TrackerSongData, SCCInstrument, TrackerCell } from '../../../types';

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

export function validateSccTrack(song: TrackerSongData): string[] {
  const warnings: string[] = [];
  const instruments = (song.instruments || []).filter(isSccInstrument);
  if (instruments.length === 0) {
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

  patterns.forEach((pattern, patternIndex) => {
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

  return { labelBase, dataLabel, asm: lines.join('\n') };
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

  let ornamentWarned = false;
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
  lines.push(`    DW 0          ; +10 ornament table (unused on the PSG half, v1)`);
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

  patterns.forEach((pattern, patternIndex) => {
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
        if (!ornamentWarned && cell.ornament !== null && cell.ornament !== undefined && cell.ornament !== 0) {
          warnings.push(`${song.name}: ornaments on PSG columns A-C are not supported yet (ignored)`);
          ornamentWarned = true;
        }
        rowBytes.push(0xff);   // ornament byte reserved (stride parity with SCC cells)
        rowBytes.push(cell.volume === null || cell.volume === undefined
          ? 0xff
          : scaleSccVolume(cell.volume, globalVolume));
      });
      lines.push(`    DB ${rowBytes.map((v) => toAsmByte(v)).join(',')}`);
    }
    lines.push('');
  });

  Array.from(instrumentMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([instrumentId, instrument]) => {
    const volumeEnvelope = (instrument.volumeEnvelope || []).map((v: number) => scaleSccVolume(v, globalVolume));
    const volumeLoop = volumeEnvelope.length > 0 && typeof instrument.volumeLoop === 'number' && instrument.volumeLoop !== 0xff
      ? clampByte(instrument.volumeLoop, 0, volumeEnvelope.length - 1)
      : 0xff;
    const defaultVolume = scaleSccVolume(volumeEnvelope.length > 0 ? (instrument.volumeEnvelope?.[0] ?? 15) : 15, globalVolume);
    const toneEnabled = instrument.ayToneEnabled !== false;
    const noiseEnabled = instrument.ayNoiseEnabled === true;
    const flags = (toneEnabled ? 0x01 : 0) | (noiseEnabled ? 0x02 : 0);
    const noisePeriod = clampByte(instrument.noiseBaseFrequency ?? (song as any).ayNoisePeriod ?? 15, 0, 31);
    if (Array.isArray(instrument.toneEnvelope) && instrument.toneEnvelope.length > 0) {
      warnings.push(`${song.name}: PSG instrument ${instrumentId} tone envelope not supported yet (ignored)`);
    }
    if (typeof instrument.ayEnvelopeShape === 'number' || typeof instrument.hardwareEnvelopePeriod === 'number') {
      warnings.push(`${song.name}: PSG instrument ${instrumentId} AY hardware envelope not supported yet (ignored)`);
    }
    lines.push(`${labelBase}_inst_${instrumentId}:`);
    lines.push(`    DB ${toAsmByte(flags)}          ; +0 flags (bit0 tone, bit1 noise)`);
    lines.push(`    DB ${toAsmByte(defaultVolume)}          ; +1 default volume`);
    lines.push(`    DW ${volumeEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_vol_env` : '0'}          ; +2 volume envelope ptr`);
    lines.push(`    DB ${toAsmByte(volumeEnvelope.length)}          ; +4 envelope length`);
    lines.push(`    DB ${toAsmByte(volumeLoop)}          ; +5 envelope loop (#FF = hold last)`);
    lines.push(`    DB ${toAsmByte(noisePeriod)}          ; +6 AY noise period (R6)`);
    if (volumeEnvelope.length > 0) {
      lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_vol_env`, volumeEnvelope));
    }
    lines.push('');
  });

  return { labelBase, dataLabel, asm: lines.join('\n') };
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
    ['psg_music_inst_table_ptr', 2],
    ['psg_music_row_ptr', 2],
    ['psg_music_noise_period', 1],
    // per-channel arrays, 3 bytes each (channels A/B/C = 0..2)
    ['psg_ch_note', 3],
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
  ];
  const lines: string[] = ['; ---- PSG music runtime RAM (dual-chip Fase 3, EQU chain) ----'];
  let address = baseAddress;
  for (const [name, size] of vars) {
    lines.push(`${name.padEnd(28)} EQU ${toAsmWord(address)}`);
    address += size;
  }
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
export function buildPsgMusicRuntime(): string {
  return `; ==================================================================
; PSG MUSIC RUNTIME (dual-chip Fase 3)
; Plays the PSG half (columns A-C) of a 'PSG+SCC' song in lockstep with
; the SCC player: same header layout, same frames-per-row cadence.
; ==================================================================

PSG_REG_PORT EQU #A0
PSG_VAL_PORT EQU #A1

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
    call psg_music_reset_channels
    ; fall through to silence
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
    ld b, 3
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
    ; envelope state, volout and cached periods all to 0
    xor a
    ld hl, psg_ch_envlen
    ld b, 3 * 6             ; envlen,envloop,envstep,volout,period_lo,period_hi
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

; ------------------------------------------------------------------
; psg_music_play_ptr
; What:   Start the PSG half. HL = psg track data, B bit0 = loop flag.
;         Header layout shared with the SCC serializer.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_play_ptr:
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
    push bc
    call psg_music_reset_channels
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
    ld hl, (psg_music_pattern_table_ptr)
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
    call psg_music_update_envelopes
    jp psg_music_apply_registers

; Destroys: AF, BC, DE, HL   Preserves: IX, IY
psg_music_advance_row:
    ld hl, (psg_music_row_ptr)
    ld c, 0                 ; channel index
psg_music_row_ch_loop:
    ld b, (hl)              ; note field
    inc hl
    ld d, (hl)              ; instrument field
    inc hl
    inc hl                  ; ornament byte: reserved, ignored in v1
    ld e, (hl)              ; volume field
    inc hl
    push hl
    push bc
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
    ld hl, psg_ch_noiseper
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
    ld hl, psg_ch_note
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_envstep
    call psg_ch_ptr
    ld (hl), 0
    ld l, e
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
    inc c
    ld a, c
    cp 3
    jp c, psg_music_env_ch_loop
    ret

; ------------------------------------------------------------------
; psg_music_apply_registers
; What:   Re-assert R0..R10 from cached state (write-through: heals any
;         register a fire-and-forget SFX blip may have stomped).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_apply_registers:
    ld c, 0
psg_music_apply_ch_loop:
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
    ld e, d
    ld a, 7
    jp psg_reg_write`;
}

// ---------------------------------------------------------------------------
// standalone test ROM (Fase 1 proof: Mideas model -> ROM -> OpenMSX)
// ---------------------------------------------------------------------------

export function buildSccMusicData(tracks: TrackerSongData[]): SccMusicBuildResult & { trackDataLabels: string[] } {
  const warnings: string[] = [];
  const waveKeyToIndex = new Map<string, number>();
  const waveTable: number[][] = [];
  const serialized = tracks.map((track, index) => {
    warnings.push(...validateSccTrack(track));
    return buildSccTrackData(track, index, waveKeyToIndex, waveTable, warnings);
  });
  const waveBytes: number[] = [];
  for (const wave of waveTable) for (const sample of wave) waveBytes.push(sample & 0xff);
  const parts: string[] = [];
  parts.push(buildSccNotePeriodTable());
  parts.push('');
  parts.push(buildSccVibratoTable());
  parts.push('');
  parts.push(buildSccNoiseTable());
  parts.push('');
  parts.push(`; ${waveTable.length} unique waveform(s), 32 bytes each (signed two's complement)`);
  parts.push(buildDbLines('scc_wave_table', waveBytes));
  parts.push('');
  for (const track of serialized) parts.push(track.asm);
  return {
    asm: parts.join('\n'),
    trackCount: tracks.length,
    waveformCount: waveTable.length,
    warnings,
    trackDataLabels: serialized.map((t) => t.dataLabel),
  };
}

/**
 * Emit the SCC backend behind the stable Mideas music_* API. Projects mixing
 * PSG/PT3 music and SCC music are rejected by soundGenerator.ts; PSG sound
 * effects remain available because they use the separate sfx_* API.
 */
export function buildSccIntegratedMusicBlock(
  tracks: TrackerSongData[],
  dualTracks: TrackerSongData[] = []
): SccMusicBuildResult {
  // Combined track index space: SCC-only tracks first, then dual-chip tracks.
  // The SCC serializer reads channels '1'..'5' + SCC instruments, so it works
  // unchanged on dual songs (their SCC half); the PSG half gets its own data.
  const combined = [...tracks, ...dualTracks];
  const hasDual = dualTracks.length > 0;
  const data = buildSccMusicData(combined);
  const psgSerialized = dualTracks.map((track, index) =>
    buildPsgTrackData(track, tracks.length + index, data.warnings)
  );
  const psgPtrTable = hasDual
    ? `; PSG half pointer per combined track index (0 = SCC-only track)
music_psg_ptr_table:
${combined.map((_, index) => `    DW ${index >= tracks.length ? psgSerialized[index - tracks.length].dataLabel : '0'}`).join('\n')}`
    : '';
  const warningComments = data.warnings.length > 0
    ? data.warnings.map((warning) => `; WARNING SCC: ${warning.replace(/[\r\n]+/g, ' ')}`).join('\n')
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
    ret

; Inputs: A = track index, B bit 0 = loop. Destroys: AF, BC, DE, HL.
music_play_track:
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
music_update:
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
; @mideas:endblock id=runtime.sound.music_scc_public`;

  const parts = [
    warningComments,
    buildSccDriverPrimitives(),
    buildSccMusicRuntime(data.trackDataLabels),
  ];
  if (hasDual) {
    parts.push(buildPsgMusicRuntime());
  }
  parts.push(publicApi);
  if (hasDual) {
    parts.push(psgPtrTable);
  }
  parts.push(
    '; ==================================================================',
    '; SCC MUSIC DATA',
    '; ==================================================================',
    data.asm,
  );
  if (hasDual) {
    parts.push(
      '; ==================================================================',
      '; PSG MUSIC DATA (dual-chip halves)',
      '; ==================================================================',
      buildPsgNotePeriodTable(),
      ...psgSerialized.map((track) => track.asm),
    );
  }
  return {
    asm: parts.join('\n\n'),
    trackCount: data.trackCount,
    waveformCount: data.waveformCount,
    warnings: data.warnings,
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
