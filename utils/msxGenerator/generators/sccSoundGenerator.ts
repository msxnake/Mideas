/**
 * @fileoverview SCC Sound Generator — Konami SCC (K051649) music backend.
 *
 * Fase 1 of docs/MIDEAS_SCC_KONAMI_STUDY.md: converts Mideas tracker songs
 * with soundChip 'SCC' into compact ROM data plus a Z80 runtime built on the
 * driver primitives validated by test/scc/scc_probe.asm and the VGM player
 * (real Konami music). Not yet wired into generateSoundFile: the engine
 * integration (music_update dispatch + Konami SCC mapper) is the next phase.
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

  const instrumentMap = new Map<number, SCCInstrument>();
  for (const instrument of song.instruments || []) {
    if (!isSccInstrument(instrument)) continue;
    if (typeof instrument.id !== 'number') continue;
    instrumentMap.set(clampByte(instrument.id, 1, 31), instrument);
  }

  const waveIndexFor = (instrument: SCCInstrument): number => {
    const wave = normalizeWaveform(instrument.waveform);
    const key = wave.join(',');
    if (!waveKeyToIndex.has(key)) {
      waveKeyToIndex.set(key, waveTable.length);
      waveTable.push(wave);
    }
    return waveKeyToIndex.get(key)!;
  };

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
        rowBytes.push(cell.volume === null || cell.volume === undefined ? 0xff : clampByte(cell.volume, 0, 15));
      });
      lines.push(`    DB ${rowBytes.map((v) => toAsmByte(v)).join(',')}`);
    }
    lines.push('');
  });

  Array.from(instrumentMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([instrumentId, instrument]) => {
    const waveIndex = waveIndexFor(instrument);
    const volumeEnvelope = (instrument.volumeEnvelope || []).map((v) => clampByte(v, 0, 15));
    const volumeLoop = volumeEnvelope.length > 0 && typeof instrument.volumeLoop === 'number' && instrument.volumeLoop !== 0xff
      ? clampByte(instrument.volumeLoop, 0, volumeEnvelope.length - 1)
      : 0xff;
    const defaultVolume = clampByte(instrument.volume ?? (volumeEnvelope.length > 0 ? volumeEnvelope[0] : 15), 0, 15);
    lines.push(`${labelBase}_inst_${instrumentId}:`);
    lines.push(`    DB ${toAsmByte(waveIndex)}          ; +0 waveform table index`);
    lines.push(`    DB ${toAsmByte(defaultVolume)}          ; +1 default volume`);
    lines.push(`    DW ${volumeEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_vol_env` : '0'}          ; +2 volume envelope ptr`);
    lines.push(`    DB ${toAsmByte(volumeEnvelope.length)}          ; +4 envelope length`);
    lines.push(`    DB ${toAsmByte(volumeLoop)}          ; +5 envelope loop (#FF = hold last)`);
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
 * 21 scalar bytes + 9 arrays of 5 = 66 bytes total.
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
    ['scc_music_row_ptr', 2],
    ['scc_music_mixer_shadow', 1],
    // per-channel arrays, 5 bytes each, indexed by channel 0..4
    ['scc_ch_note', 5],
    ['scc_ch_wave', 5],
    ['scc_ch_volbase', 5],
    ['scc_ch_envlo', 5],
    ['scc_ch_envhi', 5],
    ['scc_ch_envlen', 5],
    ['scc_ch_envloop', 5],
    ['scc_ch_envstep', 5],
    ['scc_ch_volout', 5],
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
    ld (scc_music_mixer_shadow), a
    call scc_music_reset_channels
    call SCC_Init           ; #3F -> #9000 + mixer/volumes to 0
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
    ret

; ------------------------------------------------------------------
; scc_music_play_track
; What:   Start SCC song A (0-based). B = loop flag (stored; Fase 1
;         always loops at the song restart position).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_play_track:
    push bc
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
    ld (scc_music_inst_table_ptr), de
    call scc_music_reset_channels
    xor a
    ld (scc_music_muted), a
    ld (scc_music_mixer_shadow), a
    call SCC_Stop
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
    call SCC_Stop
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
    ld hl, scc_music_row_countdown
    dec (hl)
    jp nz, scc_music_update_effects
    ld a, (scc_music_row_frames)
    ld (hl), a
    call scc_music_advance_row
scc_music_update_effects:
    call scc_music_update_envelopes
    call scc_music_apply_mixer
    ret

; ------------------------------------------------------------------
; scc_music_advance_row
; What:   Decode the current row (5 channels x 3 bytes: note,
;         instrument, volume) and fire channel events, then advance
;         row/order position with restart wrap.
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
    call scc_ch_ptr
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
    ld a, (hl)
    push af                 ; save loop position
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
    pop af                  ; loop position
    ld e, a
    ld hl, scc_ch_envloop
    call scc_ch_ptr
    ld (hl), e
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
    ; note on: store note, set period, restart envelope
    ld e, a
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), e
    ld a, e                 ; period lookup (note max 95: *2 never carries)
    add a, a
    ld l, a
    ld h, 0
    ld de, scc_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, c
    push bc
    call SCC_SetPeriod
    pop bc
    ld hl, scc_ch_envstep
    call scc_ch_ptr
    ld (hl), 0
    ret
scc_music_cell_note_cut:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), #FF
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
