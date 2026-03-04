/**
 * @fileoverview Sound Generator - PSG (AY-3-8910) sound system
 * Generates sound.asm with PSG control functions and sound effects
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { PT3Instrument, PT3Ornament, TrackerCell, TrackerSongData } from '../../../types';

const ASM_NOTE_KEEP = 0xFF;
const ASM_NOTE_CUT = 0xFE;
const TRACK_CHANNELS = ['A', 'B', 'C'] as const;

/**
 * Generate sound file with PSG functions and effects (sound.asm)
 *
 * @param analysis - Project analysis (future: could include sound effect definitions)
 * @returns ASM code string with PSG sound system
 */
export function generateSoundFile(analysis: ProjectAnalysis): string {
  const tracks = collectPsgTracks(analysis);
  return `; ==================================================================
; PSG SOUND SYSTEM
; File: sound.asm
; Description: AY-3-8910 PSG control and sound effects
; ==================================================================

; ==================================================================
; PSG REGISTER ADDRESSES
; ==================================================================

; Tone Generators (Channels A, B, C)
PSG_TONE_A_LO       EQU 0        ; Channel A period low byte
PSG_TONE_A_HI       EQU 1        ; Channel A period high byte (4 bits)
PSG_TONE_B_LO       EQU 2        ; Channel B period low byte
PSG_TONE_B_HI       EQU 3        ; Channel B period high byte (4 bits)
PSG_TONE_C_LO       EQU 4        ; Channel C period low byte
PSG_TONE_C_HI       EQU 5        ; Channel C period high byte (4 bits)

; Noise Generator
PSG_NOISE_PERIOD    EQU 6        ; Noise period (5 bits)

; Mixer Control
PSG_MIXER           EQU 7        ; Mixer/Enable register
; Bit 0: Channel A tone enable (0=on, 1=off)
; Bit 1: Channel B tone enable
; Bit 2: Channel C tone enable
; Bit 3: Channel A noise enable (0=on, 1=off)
; Bit 4: Channel B noise enable
; Bit 5: Channel C noise enable

; Volume Control
PSG_VOL_A           EQU 8        ; Channel A volume (4 bits) + envelope flag (bit 4)
PSG_VOL_B           EQU 9        ; Channel B volume
PSG_VOL_C           EQU 10       ; Channel C volume

; Envelope Generator
PSG_ENV_LO          EQU 11       ; Envelope period low byte
PSG_ENV_HI          EQU 12       ; Envelope period high byte
PSG_ENV_SHAPE       EQU 13       ; Envelope shape (4 bits)

; ==================================================================
; PSG TONE PERIODS (Musical notes, octave 4, 3.579545 MHz clock)
; ==================================================================

; Note frequencies for octave 4 (middle C = C4)
NOTE_C4         EQU 477      ; C  - 261.63 Hz
NOTE_CS4        EQU 450      ; C# - 277.18 Hz
NOTE_D4         EQU 425      ; D  - 293.66 Hz
NOTE_DS4        EQU 401      ; D# - 311.13 Hz
NOTE_E4         EQU 379      ; E  - 329.63 Hz
NOTE_F4         EQU 357      ; F  - 349.23 Hz
NOTE_FS4        EQU 337      ; F# - 369.99 Hz
NOTE_G4         EQU 318      ; G  - 392.00 Hz
NOTE_GS4        EQU 300      ; G# - 415.30 Hz
NOTE_A4         EQU 284      ; A  - 440.00 Hz
NOTE_AS4        EQU 268      ; A# - 466.16 Hz
NOTE_B4         EQU 253      ; B  - 493.88 Hz
NOTE_C5         EQU 238      ; C5 - 523.25 Hz

; Octave multipliers: Divide period by 2 for +1 octave, multiply by 2 for -1 octave

; ==================================================================
; SOUND EFFECT DURATIONS (in frames, 60Hz)
; ==================================================================

SFX_SHORT           EQU 5        ; ~83ms
SFX_MEDIUM          EQU 15       ; ~250ms
SFX_LONG            EQU 30       ; ~500ms

; ==================================================================
; SOUND SYSTEM INITIALIZATION
; ==================================================================

init_sound_system:
    ; Initialize PSG via BIOS
    call GICINI

    ; Clear runtime sound state so power-on RAM garbage cannot make
    ; sfx_update / SM_UpdateSound drive the PSG for a few random frames.
    xor a
    ld (sfx_active), a
    ld (sfx_timer), a
    ld (sfx_fadeout), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ld (sm_sound_ptr_l), a
    ld (sm_sound_ptr_h), a
    call music_init_system

    ; Silence all channels
    call sfx_silence_all

    ret

; ==================================================================
; PSG LOW-LEVEL CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; psg_write
; Write to PSG register via BIOS
; Input:  A = Register number (0-13)
;         E = Value to write
; Destroys: AF, E
; ------------------------------------------------------------------
psg_write:
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_tone
; Set tone period for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         HL = Tone period (12-bit value)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
psg_set_tone:
    ; Calculate register numbers (A*2 for low, A*2+1 for high)
    add a, a                     ; A = channel * 2
    ld c, a                      ; C = low register number
    inc a
    ld b, a                      ; B = high register number

    ; Write low byte
    ld a, c
    ld e, l
    call WRTPSG

    ; Write high byte (only lower 4 bits)
    ld a, b
    ld e, h
    ld a, e
    and #0F
    ld e, a
    ld a, b
    call WRTPSG

    ret

; ------------------------------------------------------------------
; psg_set_volume
; Set volume for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         B = Volume (0-15) or #10 to enable PSG hardware envelope
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_volume:
    add a, PSG_VOL_A             ; A = PSG_VOL_x register
    ld e, b                      ; E = volume value
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_noise
; Set noise generator period
; Input:  A = Noise period (0-31)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_noise:
    ld e, a
    ld a, PSG_NOISE_PERIOD
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_mixer
; Set mixer control (enable/disable tone and noise)
; Input:  A = Mixer value
;         Bits 0-2: Tone off (0=on, 1=off) for channels A,B,C
;         Bits 3-5: Noise off (0=on, 1=off) for channels A,B,C
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_mixer:
    ld e, a
    ld a, PSG_MIXER
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_envelope
; Program the global PSG hardware envelope generator
; Input:  HL = Envelope period
;         B = Envelope shape (0-15)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_envelope:
    ld a, PSG_ENV_LO
    ld e, l
    call WRTPSG
    ld a, PSG_ENV_HI
    ld e, h
    call WRTPSG
    ld a, b
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call WRTPSG
    ret

; ==================================================================
; HIGH-LEVEL SOUND EFFECTS
; ==================================================================

; ------------------------------------------------------------------
; sfx_silence_all
; Silence all PSG channels
; ------------------------------------------------------------------
sfx_silence_all:
    ; Set all volumes to 0
    xor a                        ; A = channel A
    ld b, 0                      ; B = volume 0
    call psg_set_volume

    ld a, 1                      ; A = channel B
    ld b, 0
    call psg_set_volume

    ld a, 2                      ; A = channel C
    ld b, 0
    call psg_set_volume

    ; Disable all tone and noise
    ld a, #3F                    ; All tone and noise off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_beep
; Simple beep sound
; ------------------------------------------------------------------
sfx_beep:
    ; Channel A: 440Hz (A4)
    xor a                        ; A = channel A
    ld hl, NOTE_A4
    call psg_set_tone

    ; Volume 12
    xor a
    ld b, 12
    call psg_set_volume

    ; Enable tone A only
    ld a, #3E                    ; Tone A on, others off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_jump
; Jump sound effect (rising pitch)
; ------------------------------------------------------------------
sfx_jump:
    ; Channel A: Start at C4, quick rise
    xor a
    ld hl, NOTE_C4
    call psg_set_tone

    ; Volume 10
    xor a
    ld b, 10
    call psg_set_volume

    ; Enable tone A
    ld a, #3E
    call psg_set_mixer

    ; TODO: Add pitch sweep for realistic jump sound
    ret

; ------------------------------------------------------------------
; sfx_shoot
; Shooting sound (noise + low tone)
; ------------------------------------------------------------------
sfx_shoot:
    ; Channel A: Low tone
    xor a
    ld hl, 100                   ; Low period = high pitch
    call psg_set_tone

    ; Volume 8
    xor a
    ld b, 8
    call psg_set_volume

    ; Noise generator at period 5
    ld a, 5
    call psg_set_noise

    ; Enable tone A + noise A
    ld a, #36                    ; Tone A + Noise A on
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_explosion
; Explosion sound (noise-heavy)
; ------------------------------------------------------------------
sfx_explosion:
    ; Noise generator at period 10
    ld a, 10
    call psg_set_noise

    ; Channel A: Volume 15 (max) with noise
    xor a
    ld b, 15
    call psg_set_volume

    ; Enable noise A only (no tone)
    ld a, #39                    ; Noise A on, tone off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_coin
; Coin/pickup sound (quick ascending notes)
; ------------------------------------------------------------------
sfx_coin:
    ; Channel B: E4 note
    ld a, 1                      ; Channel B
    ld hl, NOTE_E4
    call psg_set_tone

    ; Volume 10
    ld a, 1
    ld b, 10
    call psg_set_volume

    ; Enable tone B
    ld a, #3D                    ; Tone B on, others off
    call psg_set_mixer

    ; TODO: Quick ascend to G4 for classic coin sound
    ret

; ------------------------------------------------------------------
; sfx_damage
; Damage/hit sound (harsh noise)
; ------------------------------------------------------------------
sfx_damage:
    ; Short noise burst
    ld a, 3                      ; Harsh noise period
    call psg_set_noise

    ; Channel C: Volume 12
    ld a, 2                      ; Channel C
    ld b, 12
    call psg_set_volume

    ; Enable noise C only
    ld a, #1F                    ; Noise C on
    call psg_set_mixer

    ret

; ==================================================================
; SOUND EFFECT PLAYBACK SYSTEM
; ==================================================================
; This section provides a simple sound effect manager that can
; play effects with automatic duration and fadeout

; Runtime state lives in variables.asm:
;   sfx_active, sfx_timer, sfx_fadeout

; ------------------------------------------------------------------
; play_sound_effect
; Play one of the built-in sound effects by ID
; Input:  A = sound ID
;         0=beep, 1=jump, 2=shoot, 3=explosion, 4=coin, 5=damage
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
play_sound_effect:
    ld a, (music_active)
    or a
    ret nz
    cp 1
    jp z, play_sound_effect_jump
    cp 2
    jp z, play_sound_effect_shoot
    cp 3
    jp z, play_sound_effect_explosion
    cp 4
    jp z, play_sound_effect_coin
    cp 5
    jp z, play_sound_effect_damage

play_sound_effect_beep:
    ld hl, sfx_beep
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_jump:
    ld hl, sfx_jump
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_shoot:
    ld hl, sfx_shoot
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_explosion:
    ld hl, sfx_explosion
    ld b, SFX_MEDIUM
    call sfx_play
    ret

play_sound_effect_coin:
    ld hl, sfx_coin
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_damage:
    ld hl, sfx_damage
    ld b, SFX_SHORT
    call sfx_play
    ret

; ------------------------------------------------------------------
; sfx_play
; Play a sound effect with duration
; Input:  HL = Sound effect function address
;         B = Duration in frames
; ------------------------------------------------------------------
sfx_play:
    ld a, (music_active)
    or a
    ret nz
    ; Call the sound effect function
    push bc
    push hl
    ld de, .return_address
    push de
    jp (hl)                      ; Indirect call
.return_address:
    pop hl
    pop bc

    ; Set timer
    ld a, b
    ld (sfx_timer), a

    ; Mark as active
    ld a, 1
    ld (sfx_active), a

    ret

; ------------------------------------------------------------------
; sfx_update
; Update sound effect system (call every frame)
; Handles automatic fadeout and silence
; ------------------------------------------------------------------
sfx_update:
    ld a, (music_active)
    or a
    ret nz
    ; Check if sound is active
    ld a, (sfx_active)
    or a
    ret z                        ; No active sound

    ; Decrement timer
    ld a, (sfx_timer)
    or a
    jr z, .silence_now

    dec a
    ld (sfx_timer), a

    ; Check if entering fadeout zone (last 5 frames)
    cp 5
    ret nc                       ; Still in main sound

    ; TODO: Implement volume fadeout here
    ret

.silence_now:
    call sfx_silence_all
    xor a
    ld (sfx_active), a
    ret

${buildTrackerMusicBlock(tracks)}

; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================
`;
}

function clampByte(value: number, min = 0, max = 255): number {
  const safeValue = Number.isFinite(value) ? Math.round(value) : min;
  return Math.max(min, Math.min(max, safeValue));
}

function clampWord(value: number, min = 0, max = 0xffff): number {
  const safeValue = Number.isFinite(value) ? Math.round(value) : min;
  return Math.max(min, Math.min(max, safeValue));
}

function toAsmByte(value: number): string {
  return `#${clampByte(value).toString(16).toUpperCase().padStart(2, '0')}`;
}

function toAsmWord(value: number): string {
  return `#${clampWord(value).toString(16).toUpperCase().padStart(4, '0')}`;
}

function toAyHardwareEnvelopePeriod(value: number | undefined | null): number {
  const logicalPeriod = clampWord(value ?? 1, 1, 0xffff);
  // The browser preview advances AY "hardware" envelopes on a coarse ~30ms software tick,
  // while the real PSG runs the envelope generator continuously.
  // Scale the editor value so ROM playback stays close to preview timing.
  return clampWord(Math.round(logicalPeriod * 210), 1, 0xffff);
}

function sanitizeLabel(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
  return cleaned.length > 0 ? cleaned : 'track';
}

function computeRowFrames(song: TrackerSongData): number {
  const bpm = clampWord(song.bpm || 125, 1, 999);
  const speed = clampByte(song.speed || 6, 1, 31);
  return Math.max(1, Math.round((150 * speed) / bpm));
}

function getNoteIndex(note: string | null): number {
  if (note === null || note === '---') return ASM_NOTE_KEEP;
  if (note === '===') return ASM_NOTE_CUT;

  const match = note.toUpperCase().match(/^([A-G](?:#|-))([0-7])$/);
  if (!match) return ASM_NOTE_KEEP;

  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  const noteOffsets: Record<string, number> = {
    'C-': 0, 'C#': 1, 'D-': 2, 'D#': 3, 'E-': 4, 'F-': 5,
    'F#': 6, 'G-': 7, 'G#': 8, 'A-': 9, 'A#': 10, 'B-': 11,
  };
  const noteOffset = noteOffsets[noteName];
  if (noteOffset === undefined) return ASM_NOTE_KEEP;

  return clampByte((octave * 12) + noteOffset, 0, 95);
}

function isPT3Instrument(value: PT3Instrument | any): value is PT3Instrument {
  return !!value && !Array.isArray(value.waveform);
}

function collectPsgTracks(analysis: ProjectAnalysis): TrackerSongData[] {
  const projectTracks = Array.isArray(analysis.tracks) ? analysis.tracks : [];
  return projectTracks
    .filter((track) => (track?.soundChip || 'PSG') === 'PSG')
    .map((track) => ({
      ...track,
      soundChip: track?.soundChip || 'PSG'
    }));
}

function getInstrumentMap(song: TrackerSongData): Map<number, PT3Instrument> {
  const instrumentMap = new Map<number, PT3Instrument>();
  for (const instrument of song.instruments || []) {
    if (!isPT3Instrument(instrument)) continue;
    if (typeof instrument.id !== 'number') continue;
    instrumentMap.set(clampByte(instrument.id, 1, 31), instrument);
  }
  return instrumentMap;
}

function getOrnamentMap(song: TrackerSongData): Map<number, PT3Ornament> {
  const ornamentMap = new Map<number, PT3Ornament>();
  for (const ornament of song.ornaments || []) {
    if (!ornament || typeof ornament.id !== 'number') continue;
    ornamentMap.set(clampByte(ornament.id, 1, 15), ornament);
  }
  return ornamentMap;
}

function getCellValue(row: any, channelId: typeof TRACK_CHANNELS[number]): TrackerCell {
  const cell = row?.[channelId];
  return {
    note: cell?.note ?? null,
    instrument: cell?.instrument ?? null,
    ornament: cell?.ornament ?? null,
    volume: cell?.volume ?? null,
  };
}

function encodeInstrumentField(
  value: number | null,
  instrumentMap: Map<number, PT3Instrument>,
  warnings: string[],
  context: string
): number {
  if (value === null || value === undefined) return 0xff;
  if (value === 0) return 0;

  const clampedId = clampByte(value, 1, 31);
  if (clampedId !== value) {
    warnings.push(`${context}: instrument ${value} clamped to ${clampedId}`);
  }
  if (!instrumentMap.has(clampedId)) {
    warnings.push(`${context}: instrument ${clampedId} not found`);
  }
  return clampedId;
}

function encodeOrnamentField(
  value: number | null,
  ornamentMap: Map<number, PT3Ornament>,
  warnings: string[],
  context: string
): number {
  if (value === null || value === undefined) return 0xff;
  if (value === 0) return 0;

  const clampedId = clampByte(value, 1, 15);
  if (clampedId !== value) {
    warnings.push(`${context}: ornament ${value} clamped to ${clampedId}`);
  }
  if (!ornamentMap.has(clampedId)) {
    warnings.push(`${context}: ornament ${clampedId} not found`);
  }
  return clampedId;
}

function encodeVolumeField(value: number | null, warnings: string[], context: string): number {
  if (value === null || value === undefined) return 0xff;
  const clamped = clampByte(value, 0, 15);
  if (clamped !== value) {
    warnings.push(`${context}: volume ${value} clamped to ${clamped}`);
  }
  return clamped;
}

function buildDbLines(label: string, values: number[]): string {
  const lines: string[] = [`${label}:`];
  if (values.length === 0) {
    lines.push('    DB #00');
    return lines.join('\n');
  }

  for (let index = 0; index < values.length; index += 16) {
    lines.push(`    DB ${values.slice(index, index + 16).map((value) => toAsmByte(value)).join(',')}`);
  }
  return lines.join('\n');
}

function buildDwLines(label: string, values: number[]): string {
  const lines: string[] = [`${label}:`];
  if (values.length === 0) {
    lines.push('    DW #0000');
    return lines.join('\n');
  }

  for (let index = 0; index < values.length; index += 8) {
    lines.push(`    DW ${values.slice(index, index + 8).map((value) => toAsmWord(value)).join(',')}`);
  }
  return lines.join('\n');
}

function serializeSignedByteArray(values: number[]): number[] {
  return values.map((value) => clampByte(value & 0xff));
}

function normalizeVolumeEnvelopeData(values: number[]): number[] {
  return values.map((value) => {
    const clamped = clampByte(value, 0, 127);
    if (clamped <= 15) {
      return clamped;
    }
    return clampByte(Math.round((clamped / 127) * 15), 0, 15);
  });
}

function normalizeNoiseEnvelopeData(values: number[]): number[] {
  return values.map((value) => clampByte(value, 0, 31));
}

function buildNotePeriodTable(): string {
  const ayClock = 3579545 / 2;
  const c0Frequency = 16.351597831287414;
  const periods: number[] = [];

  for (let noteIndex = 0; noteIndex < 96; noteIndex++) {
    const frequency = c0Frequency * Math.pow(2, noteIndex / 12);
    periods.push(Math.max(1, Math.round(ayClock / (16 * frequency))));
  }

  return buildDwLines('music_note_period_table', periods);
}

function buildTrackData(song: TrackerSongData, trackIndex: number): { labelBase: string; asm: string } {
  const labelBase = `music_track_${trackIndex}_${sanitizeLabel(song.name || `track_${trackIndex}`)}`;
  const instrumentMap = getInstrumentMap(song);
  const ornamentMap = getOrnamentMap(song);
  const warnings: string[] = [];
  const order = Array.isArray(song.order) && song.order.length > 0 ? song.order : [0];
  const restartPosition = clampByte(song.restartPosition ?? 0, 0, Math.max(0, order.length - 1));
  const patterns = Array.isArray(song.patterns) && song.patterns.length > 0
    ? song.patterns
    : [{ id: `${labelBase}_fallback`, name: 'Fallback', numRows: 1, rows: [] }];
  const lines: string[] = [];

  lines.push(`; ------------------------------------------------------------------`);
  lines.push(`; Tracker Song ${trackIndex}: ${song.name}`);
  lines.push(`; ------------------------------------------------------------------`);
  lines.push(`${labelBase}_data:`);
  lines.push(`    DB ${toAsmByte(computeRowFrames(song))}`);
  lines.push(`    DB ${toAsmByte(order.length)}`);
  lines.push(`    DB ${toAsmByte(restartPosition)}`);
  lines.push(`    DB #01`);
  lines.push(`    DB ${toAsmByte(patterns.length)}`);
  lines.push(`    DW ${labelBase}_order_table`);
  lines.push(`    DW ${labelBase}_pattern_table`);
  lines.push(`    DW ${labelBase}_instrument_ptr_table`);
  lines.push(`    DW ${labelBase}_ornament_ptr_table`);
  lines.push(`    DW ${toAsmWord(toAyHardwareEnvelopePeriod(song.ayHardwareEnvelopePeriod))}`);
  lines.push(`    DB ${toAsmByte(clampByte(song.ayNoisePeriod ?? 16, 0, 31))}`);
  lines.push('');
  lines.push(buildDbLines(`${labelBase}_order_table`, order.map((value) => clampByte(value, 0, Math.max(0, patterns.length - 1)))));
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
  lines.push(`${labelBase}_ornament_ptr_table:`);
  for (let ornamentId = 0; ornamentId <= 15; ornamentId++) {
    lines.push(`    DW ${ornamentId > 0 && ornamentMap.has(ornamentId) ? `${labelBase}_orn_${ornamentId}` : '0'}`);
  }
  lines.push('');

  patterns.forEach((pattern, patternIndex) => {
    const rowCount = clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255);
    lines.push(`${labelBase}_pattern_${patternIndex}_rows:`);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const row = pattern?.rows?.[rowIndex] || {};
      const rowBytes: number[] = [];

      TRACK_CHANNELS.forEach((channelId) => {
        const cell = getCellValue(row, channelId);
        const context = `${song.name}/pattern${patternIndex}/row${rowIndex}/${channelId}`;
        rowBytes.push(getNoteIndex(cell.note));
        rowBytes.push(encodeInstrumentField(cell.instrument, instrumentMap, warnings, context));
        rowBytes.push(encodeOrnamentField(cell.ornament, ornamentMap, warnings, context));
        rowBytes.push(encodeVolumeField(cell.volume, warnings, context));
      });

      lines.push(`    DB ${rowBytes.map((value) => toAsmByte(value)).join(',')}`);
    }
    lines.push('');
  });

  Array.from(instrumentMap.entries()).sort((left, right) => left[0] - right[0]).forEach(([instrumentId, instrument]) => {
    const volumeEnvelope = normalizeVolumeEnvelopeData(instrument.volumeEnvelope || []);
    const toneEnvelope = serializeSignedByteArray(instrument.toneEnvelope || []);
    const noiseEnvelope = normalizeNoiseEnvelopeData(instrument.noiseEnvelope || []);
    const flags =
      ((instrument.ayToneEnabled === false ? 0 : 1) << 0) |
      ((instrument.ayNoiseEnabled ? 1 : 0) << 1) |
      ((typeof instrument.ayEnvelopeShape === 'number' ? 1 : 0) << 2);
    const volumeLoop = volumeEnvelope.length > 0 && typeof instrument.volumeLoop === 'number'
      ? (instrument.volumeLoop === 0xff ? 0xff : clampByte(instrument.volumeLoop, 0, volumeEnvelope.length - 1))
      : 0xff;
    const toneLoop = toneEnvelope.length > 0 && typeof instrument.toneLoop === 'number'
      ? (instrument.toneLoop === 0xff ? 0xff : clampByte(instrument.toneLoop, 0, toneEnvelope.length - 1))
      : 0xff;
    const noiseLoop = noiseEnvelope.length > 0 && typeof instrument.noiseLoop === 'number'
      ? (instrument.noiseLoop === 0xff ? 0xff : clampByte(instrument.noiseLoop, 0, noiseEnvelope.length - 1))
      : 0xff;
    const defaultVolume = volumeEnvelope.length > 0
      ? volumeEnvelope[0]
      : 15;

    lines.push(`${labelBase}_inst_${instrumentId}:`);
    lines.push(`    DB ${toAsmByte(flags)}`);
    lines.push(`    DB ${toAsmByte(defaultVolume)}`);
    lines.push(`    DB ${toAsmByte(clampByte(instrument.ayEnvelopeShape ?? 0, 0, 15))}`);
    lines.push(`    DB ${toAsmByte(clampByte(instrument.noiseBaseFrequency ?? song.ayNoisePeriod ?? 16, 0, 31))}`);
    lines.push(`    DW ${toAsmWord(toAyHardwareEnvelopePeriod(instrument.hardwareEnvelopePeriod ?? song.ayHardwareEnvelopePeriod))}`);
    lines.push(`    DW ${volumeEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_vol_env` : '0'}`);
    lines.push(`    DB ${toAsmByte(volumeEnvelope.length)}`);
    lines.push(`    DB ${toAsmByte(volumeLoop)}`);
    lines.push(`    DW ${toneEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_tone_env` : '0'}`);
    lines.push(`    DB ${toAsmByte(toneEnvelope.length)}`);
    lines.push(`    DB ${toAsmByte(toneLoop)}`);
    lines.push(`    DW ${noiseEnvelope.length > 0 ? `${labelBase}_inst_${instrumentId}_noise_env` : '0'}`);
    lines.push(`    DB ${toAsmByte(noiseEnvelope.length)}`);
    lines.push(`    DB ${toAsmByte(noiseLoop)}`);
    if (volumeEnvelope.length > 0) lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_vol_env`, volumeEnvelope));
    if (toneEnvelope.length > 0) lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_tone_env`, toneEnvelope));
    if (noiseEnvelope.length > 0) lines.push(buildDbLines(`${labelBase}_inst_${instrumentId}_noise_env`, noiseEnvelope));
    lines.push('');
  });

  Array.from(ornamentMap.entries()).sort((left, right) => left[0] - right[0]).forEach(([ornamentId, ornament]) => {
    const ornamentData = serializeSignedByteArray(ornament.data || []);
    const loopPosition = ornamentData.length > 0 && typeof ornament.loopPosition === 'number'
      ? clampByte(ornament.loopPosition, 0, ornamentData.length - 1)
      : 0xff;

    lines.push(`${labelBase}_orn_${ornamentId}:`);
    lines.push(`    DW ${ornamentData.length > 0 ? `${labelBase}_orn_${ornamentId}_data` : '0'}`);
    lines.push(`    DB ${toAsmByte(ornamentData.length)}`);
    lines.push(`    DB ${toAsmByte(loopPosition)}`);
    if (ornamentData.length > 0) lines.push(buildDbLines(`${labelBase}_orn_${ornamentId}_data`, ornamentData));
    lines.push('');
  });

  if (warnings.length > 0) {
    lines.splice(3, 0, ...warnings.map((warning) => `; WARNING: ${warning}`));
  }

  return { labelBase, asm: lines.join('\n') };
}

function buildTrackerMusicBlock(tracks: TrackerSongData[]): string {
  const serializedTracks = tracks.map((track, index) => buildTrackData(track, index));
  const trackTableLines: string[] = [
    '; ==================================================================',
    '; TRACKER MUSIC RUNTIME (Phase 1)',
    '; Phase 1 plays row data and loop state in ROM; descriptor tables are',
    '; serialized now for compatibility and future expansion.',
    '; ==================================================================',
    '',
    'MUSIC_TRACK_ORDER_TABLE     EQU 5',
    'MUSIC_TRACK_PATTERN_TABLE   EQU 7',
    'MUSIC_TRACK_INSTRUMENT_TABLE EQU 9',
    'MUSIC_TRACK_NOISE_DEFAULT   EQU 15',
    '',
    '; ------------------------------------------------------------------',
    '; music_init_system',
    '; Reset tracker runtime RAM and default PSG mixer shadow.',
    '; Input:  None',
    '; Output: music_active=0, music_muted=0, music_mixer_shadow=#3F',
    '; Destroys: AF',
    '; ------------------------------------------------------------------',
    'music_init_system:',
    '    xor a',
    '    ld (music_active), a',
    '    ld (music_muted), a',
    '    ld (music_loop), a',
    '    ld (music_track_index), a',
    '    ld (music_row_frames), a',
    '    ld (music_row_countdown), a',
    '    ld (music_order_pos), a',
    '    ld (music_pattern_index), a',
    '    ld (music_pattern_row), a',
    '    ld (music_pattern_rows), a',
    '    ld (music_track_ptr_l), a',
    '    ld (music_track_ptr_h), a',
    '    ld (music_pattern_ptr_l), a',
    '    ld (music_pattern_ptr_h), a',
    '    ld a, #3F',
    '    ld (music_mixer_shadow), a',
    '    call music_reset_channel_state',
    '    ret',
    '',
    'music_reset_channel_state:',
    '    ld a, #FF',
    '    ld (music_ch_a_note), a',
    '    ld (music_ch_b_note), a',
    '    ld (music_ch_c_note), a',
    '    xor a',
    '    ld (music_ch_a_instrument), a',
    '    ld (music_ch_b_instrument), a',
    '    ld (music_ch_c_instrument), a',
    '    ld (music_ch_a_ornament), a',
    '    ld (music_ch_b_ornament), a',
    '    ld (music_ch_c_ornament), a',
    '    ld (music_ch_a_vol_step), a',
    '    ld (music_ch_b_vol_step), a',
    '    ld (music_ch_c_vol_step), a',
    '    ld (music_ch_a_tone_step), a',
    '    ld (music_ch_b_tone_step), a',
    '    ld (music_ch_c_tone_step), a',
    '    ld (music_ch_a_noise_step), a',
    '    ld (music_ch_b_noise_step), a',
    '    ld (music_ch_c_noise_step), a',
    '    ld (music_ch_a_orn_step), a',
    '    ld (music_ch_b_orn_step), a',
    '    ld (music_ch_c_orn_step), a',
    '    ld a, #0F',
    '    ld (music_ch_a_volume), a',
    '    ld (music_ch_b_volume), a',
    '    ld (music_ch_c_volume), a',
    '    ret',
    '',
    'music_silence_channels:',
    '    xor a',
    '    ld b, 0',
    '    call psg_set_volume',
    '    ld a, 1',
    '    ld b, 0',
    '    call psg_set_volume',
    '    ld a, 2',
    '    ld b, 0',
    '    call psg_set_volume',
    '    ld a, #3F',
    '    call psg_set_mixer',
    '    ret',
    '',
    'music_stop:',
    '    push af',
    '    call music_init_system',
    '    call music_silence_channels',
    '    pop af',
    '    ret',
    '',
    'music_mute:',
    '    ld a, (music_active)',
    '    or a',
    '    ret z',
    '    ld a, 1',
    '    ld (music_muted), a',
    '    call music_silence_channels',
    '    ret',
    '',
    'music_resume:',
    '    ld a, (music_active)',
    '    or a',
    '    ret z',
    '    xor a',
    '    ld (music_muted), a',
    '    call music_update_channel_effects',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_execute_command',
    '; Dispatch a compact music command stream used by Game Flow nodes.',
    '; Input:  DE -> [command, trackIndex, loopFlag]',
    ';         command: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op',
    '; Output: Selected command executed, DE may advance while parsing',
    '; Destroys: AF, BC (play path), DE (play path), HL (via callees)',
    '; ------------------------------------------------------------------',
    'music_execute_command:',
    '    ld a, (de)',
    '    cp #FF',
    '    ret z',
    '    or a',
    '    jp z, music_stop',
    '    cp 1',
    '    jp z, .play_track',
    '    cp 2',
    '    jp z, music_mute',
    '    cp 3',
    '    jp z, music_resume',
    '    ret',
    '.play_track:',
    '    inc de',
    '    ld a, (de)',
    '    ld c, a',
    '    inc de',
    '    ld a, (de)',
    '    ld b, a',
    '    ld a, c',
    '    call music_play_track',
    '    ret',
    '',
    'music_load_track_pointer_from_index:',
    '    add a, a',
    '    ld e, a',
    '    ld d, 0',
    '    ld hl, music_track_ptr_table',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    ld a, e',
    '    ld (music_track_ptr_l), a',
    '    ld a, d',
    '    ld (music_track_ptr_h), a',
    '    ret',
    '',
    'music_get_track_ptr:',
    '    ld a, (music_track_ptr_l)',
    '    ld l, a',
    '    ld a, (music_track_ptr_h)',
    '    ld h, a',
    '    ret',
    '',
    'music_get_track_header_ptr:',
    '    ld e, a',
    '    ld d, 0',
    '    call music_get_track_ptr',
    '    add hl, de',
    '    ret',
    '',
    'music_read_track_byte:',
    '    call music_get_track_header_ptr',
    '    ld a, (hl)',
    '    ret',
    '',
    'music_read_track_word:',
    '    call music_get_track_header_ptr',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    ld h, d',
    '    ld l, e',
    '    ret',
    '',
    'music_get_instrument_ptr:',
    '    or a',
    '    jr z, .no_instrument',
    '    add a, a',
    '    ld e, a',
    '    ld d, 0',
    '    ld a, MUSIC_TRACK_INSTRUMENT_TABLE',
    '    call music_read_track_word',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    ld h, d',
    '    ld l, e',
    '    ret',
    '.no_instrument:',
    '    ld hl, 0',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_get_channel_instrument_ptr',
    '; Resolve current channel instrument pointer from the cached channel id.',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: HL = instrument descriptor or 0 when none is active',
    '; Destroys: AF, DE, HL',
    '; ------------------------------------------------------------------',
    'music_get_channel_instrument_ptr:',
    '    ld hl, music_ch_instrument_base',
    '    call music_load_channel_byte',
    '    call music_get_instrument_ptr',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_channel_uses_hardware_env',
    '; Check if the active instrument routes channel volume through PSG ENV.',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: A = 1 when PSG hardware envelope is enabled, else 0',
    '; Destroys: AF, DE, HL',
    '; ------------------------------------------------------------------',
    'music_channel_uses_hardware_env:',
    '    push hl',
    '    call music_get_channel_instrument_ptr',
    '    ld a, h',
    '    or l',
    '    jr z, music_channel_uses_hardware_env_no_hw_env',
    '    ld a, (hl)',
    '    and #04',
    '    jr z, music_channel_uses_hardware_env_no_hw_env',
    '    ld a, 1',
    '    pop hl',
    '    ret',
    'music_channel_uses_hardware_env_no_hw_env:',
    '    xor a',
    '    pop hl',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_trigger_channel_attack',
    '; Hook kept for compatibility. The preview-style hardware envelope is',
    '; emulated in software per channel, so new-note state is already reset',
    '; by music_apply_channel_cell before this helper is called.',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: None',
    '; Destroys: None',
    '; ------------------------------------------------------------------',
    'music_trigger_channel_attack:',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_resolve_channel_volume',
    '; Resolve per-frame channel volume.',
    '; Current Phase 1 behavior:',
    '; - emulates AY hardware envelope shapes in software when ayEnvelopeShape is set',
    '; - falls back to music_ch_volume_base when no envelope data exists',
    '; - applies a simple software volumeEnvelope when present',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: B = PSG volume 0-15',
    '; Destroys: AF, DE, HL',
    '; ------------------------------------------------------------------',
    'music_resolve_channel_volume:',
    '    push af',
    '    push de',
    '    push hl',
    '    ld hl, music_ch_instrument_base',
    '    call music_load_channel_byte',
    '    or a',
    '    jp z, .fallback_base',
    '    call music_get_instrument_ptr',
    '    ld a, h',
    '    or l',
    '    jp z, .fallback_base',
    '    ld a, (hl)',
    '    and #04',
    '    jp nz, .hardware_env',
    '.check_software_env:',
    '    push hl',
    '    ld de, 8',
    '    add hl, de',
    '    ld b, (hl)',
    '    pop hl',
    '    ld a, b',
    '    or a',
    '    jp z, .fallback_base',
    '    push hl',
    '    ld de, 6',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    pop hl',
    '    ld hl, music_ch_vol_step_base',
    '    call music_load_channel_byte',
    '    cp b',
    '    jr c, .step_ok',
    '    ld a, b',
    '    dec a',
    '.step_ok:',
    '    push af',
    '    inc a',
    '    cp b',
    '    jr c, .next_step_ok',
    '    ld a, b',
    '    dec a',
    '.next_step_ok:',
    '    push de',
    '    ld hl, music_ch_vol_step_base',
    '    call music_store_channel_byte',
    '    pop de',
    '    pop af',
    '    ld l, a',
    '    ld h, 0',
    '    add hl, de',
    '    ld a, (hl)',
    '    cp 16',
    '    jr c, .env_volume_ok',
    '    ld a, 15',
    '.env_volume_ok:',
    '    ld b, a',
    '    jp .mrcv_done',
    '.hardware_env:',
    '    ld hl, music_ch_tone_step_base',
    '    call music_load_channel_byte',
    '    inc a',
    '    cp 2',
    '    jr c, .hw_store_counter',
    '    xor a',
    '    push af',
    '    ld hl, music_ch_tone_step_base',
    '    call music_store_channel_byte',
    '    pop af',
    '    ld hl, music_ch_vol_step_base',
    '    call music_load_channel_byte',
    '    cp 15',
    '    jr nc, .hw_phase_ready',
    '    inc a',
    '    push af',
    '    ld hl, music_ch_vol_step_base',
    '    call music_store_channel_byte',
    '    pop af',
    '    jr .hw_phase_ready',
    '.hw_store_counter:',
    '    push af',
    '    ld hl, music_ch_tone_step_base',
    '    call music_store_channel_byte',
    '    pop af',
    '    ld hl, music_ch_vol_step_base',
    '    call music_load_channel_byte',
    '.hw_phase_ready:',
    '    ld e, a',
    '    push hl',
    '    inc hl',
    '    inc hl',
    '    ld a, (hl)',
    '    and #04',
    '    pop hl',
    '    jr z, .hw_decay',
    '    ld b, e',
    '    jp .mrcv_done',
    '.hw_decay:',
    '    ld a, 15',
    '    sub e',
    '    ld b, a',
    '    jp .mrcv_done',
    '.fallback_base:',
    '    ld hl, music_ch_volume_base',
    '    call music_load_channel_byte',
    '    ld b, a',
    '.mrcv_done:',
    '    pop hl',
    '    pop de',
    '    pop af',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_resolve_channel_noise',
    '; Resolve per-frame channel noise period, including the PT3-inspired',
    '; software noise macro appended to the instrument descriptor.',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: A = PSG noise period 0-31',
    '; Destroys: AF, DE, HL',
    '; Preserves: Stack balance restored before return',
    '; ------------------------------------------------------------------',
    'music_resolve_channel_noise:',
    '    push de',
    '    push hl',
    '    ld hl, music_ch_instrument_base',
    '    call music_load_channel_byte',
    '    or a',
    '    jp z, .mrcn_track_default',
    '    call music_get_instrument_ptr',
    '    ld a, h',
    '    or l',
    '    jp z, .mrcn_track_default',
    '    push hl',
    '    ld de, 16',
    '    add hl, de',
    '    ld b, (hl)',
    '    pop hl',
    '    ld a, b',
    '    or a',
    '    jp z, .mrcn_static_noise',
    '    push hl',
    '    ld hl, music_ch_noise_step_base',
    '    call music_load_channel_byte',
    '    cp b',
    '    jr c, .mrcn_step_ok',
    '    ld a, b',
    '    dec a',
    '.mrcn_step_ok:',
    '    push af',
    '    pop af',
    '    pop hl',
    '    push af',
    '    inc a',
    '    cp b',
    '    jr c, .mrcn_store_next',
    '    push de',
    '    ld de, 17',
    '    add hl, de',
    '    ld a, (hl)',
    '    pop de',
    '    cp b',
    '    jr c, .mrcn_store_next',
    '    ld a, b',
    '    dec a',
    '.mrcn_store_next:',
    '    push hl',
    '    push af',
    '    ld hl, music_ch_noise_step_base',
    '    call music_store_channel_byte',
    '    pop af',
    '    pop hl',
    '    ld de, 14',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    pop af',
    '    ld l, a',
    '    ld h, 0',
    '    add hl, de',
    '    ld a, (hl)',
    '    and #1F',
    '    jp .mrcn_done',
    '.mrcn_static_noise:',
    '    push de',
    '    ld de, 3',
    '    add hl, de',
    '    ld a, (hl)',
    '    pop de',
    '    and #1F',
    '    jp .mrcn_done',
    '.mrcn_track_default:',
    '    ld a, MUSIC_TRACK_NOISE_DEFAULT',
    '    call music_read_track_byte',
    '    and #1F',
    '.mrcn_done:',
    '    pop hl',
    '    pop de',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_play_track',
    '; Start a serialized PSG tracker song from ROM.',
    '; Input:  A = track index in music_track_ptr_table',
    ';         B bit 0 = loop enabled flag',
    '; Output: music_active=1 and first row applied immediately',
    '; Destroys: AF, BC, DE, HL',
    '; Preserves: Stack balance restored on all exits',
    '; ------------------------------------------------------------------',
    'music_play_track:',
    '    push bc',
    '    push de',
    '    push hl',
    '    ld hl, music_track_count',
    '    cp (hl)',
    '    jp nc, .done',
    '    ld (music_track_index), a',
    '    call music_load_track_pointer_from_index',
    '    ld a, b',
    '    and 1',
    '    ld (music_loop), a',
    '    xor a',
    '    ld (music_muted), a',
    '    ld (music_order_pos), a',
    '    ld (music_pattern_index), a',
    '    ld (music_pattern_row), a',
    '    ld a, 1',
    '    ld (music_active), a',
    '    call music_reset_channel_state',
    '    call music_apply_row',
    '.done:',
    '    pop hl',
    '    pop de',
    '    pop bc',
    '    ret',
    '',
    'music_store_channel_byte:',
    '    push de',
    '    ld e, c',
    '    ld d, 0',
    '    add hl, de',
    '    ld (hl), a',
    '    pop de',
    '    ret',
    '',
    'music_load_channel_byte:',
    '    push de',
    '    ld e, c',
    '    ld d, 0',
    '    add hl, de',
    '    ld a, (hl)',
    '    pop de',
    '    ret',
    '',
    'music_apply_channel_cell:',
    '    ld c, a',
    '    ld d, 0',
    '    ld a, (hl)',
    '    inc hl',
    '    cp #FF',
    '    jp z, .note_done',
    '    cp #FE',
    '    jp nz, .store_note',
    '    ld a, #FF',
    '    jr .store_note',
    '.store_note:',
    '    cp #FF',
    '    jr z, .store_note_value',
    '    ld d, 1',
    '.store_note_value:',
    '    push hl',
    '    ld hl, music_ch_note_base',
    '    call music_store_channel_byte',
    '    xor a',
    '    ld hl, music_ch_vol_step_base',
    '    call music_store_channel_byte',
    '    ld hl, music_ch_tone_step_base',
    '    call music_store_channel_byte',
    '    ld hl, music_ch_noise_step_base',
    '    call music_store_channel_byte',
    '    ld hl, music_ch_orn_step_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '.note_done:',
    '    ld a, (hl)',
    '    inc hl',
    '    cp #FF',
    '    jp z, .instrument_done',
    '    push hl',
    '    ld hl, music_ch_instrument_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '.instrument_done:',
    '    ld a, (hl)',
    '    inc hl',
    '    cp #FF',
    '    jp z, .ornament_done',
    '    push hl',
    '    ld hl, music_ch_ornament_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '.ornament_done:',
    '    ld a, (hl)',
    '    inc hl',
    '    cp #FF',
    '    jr z, .maybe_trigger_attack',
    '    push hl',
    '    ld hl, music_ch_volume_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '.maybe_trigger_attack:',
    '    ld a, d',
    '    or a',
    '    ret z',
    '    push hl',
    '    call music_trigger_channel_attack',
    '    pop hl',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_apply_row',
    '; Decode current order/pattern row and cache channel state for A/B/C.',
    '; Input:  Runtime variables select track/order/pattern position',
    '; Output: Channel note/instrument/volume caches updated',
    ';         Row countdown reloaded and PSG refreshed once',
    '; Destroys: AF, BC, DE, HL',
    '; ------------------------------------------------------------------',
    'music_apply_row:',
    '    ld a, MUSIC_TRACK_ORDER_TABLE',
    '    call music_read_track_word',
    '    ld a, (music_order_pos)',
    '    ld e, a',
    '    ld d, 0',
    '    add hl, de',
    '    ld a, (hl)',
    '    ld (music_pattern_index), a',
    '    ld a, MUSIC_TRACK_PATTERN_TABLE',
    '    call music_read_track_word',
    '    ld a, (music_pattern_index)',
    '    ld e, a',
    '    ld d, 0',
    '    add hl, de',
    '    add hl, de',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    inc hl',
    '    ld a, (hl)',
    '    ld (music_pattern_rows), a',
    '    ld a, e',
    '    ld (music_pattern_ptr_l), a',
    '    ld a, d',
    '    ld (music_pattern_ptr_h), a',
    '    ld h, d',
    '    ld l, e',
    '    ld a, (music_pattern_row)',
    '    or a',
    '    jp z, .row_ptr_ready',
    '    ld b, a',
    '.row_offset_loop:',
    '    ld de, 12',
    '    add hl, de',
    '    djnz .row_offset_loop',
    '.row_ptr_ready:',
    '    xor a',
    '    call music_apply_channel_cell',
    '    ld a, 1',
    '    call music_apply_channel_cell',
    '    ld a, 2',
    '    call music_apply_channel_cell',
    '    ld a, (music_pattern_row)',
    '    inc a',
    '    ld d, a',
    '    ld a, (music_pattern_rows)',
    '    cp d',
    '    jp z, .advance_order',
    '    jp c, .advance_order',
    '    ld a, d',
    '    ld (music_pattern_row), a',
    '    jp .row_done',
    '.advance_order:',
    '    xor a',
    '    ld (music_pattern_row), a',
    '    ld a, (music_order_pos)',
    '    inc a',
    '    ld d, a',
    '    ld a, 1',
    '    call music_read_track_byte',
    '    cp d',
    '    jp z, .end_of_order',
    '    jp c, .end_of_order',
    '    ld a, d',
    '    ld (music_order_pos), a',
    '    jp .row_done',
    '.end_of_order:',
    '    ld a, (music_loop)',
    '    or a',
    '    jp z, music_stop',
    '    ld a, 2',
    '    call music_read_track_byte',
    '    ld (music_order_pos), a',
    '.row_done:',
    '    xor a',
    '    call music_read_track_byte',
    '    ld (music_row_frames), a',
    '    ld (music_row_countdown), a',
    '    call music_update_channel_effects',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_update',
    '; Advance the tracker once per game frame.',
    '; Input:  None',
    '; Output: Current channel PSG state refreshed; next row applied when due',
    '; Destroys: AF, BC, DE, HL',
    '; ------------------------------------------------------------------',
    'music_update:',
    '    ld a, (music_active)',
    '    or a',
    '    ret z',
    '    ld a, (music_muted)',
    '    or a',
    '    ret nz',
    '    call music_update_channel_effects',
    '    ld a, (music_row_countdown)',
    '    or a',
    '    jp z, music_apply_row',
    '    dec a',
    '    ld (music_row_countdown), a',
    '    ret nz',
    '    call music_apply_row',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_update_channel_effects',
    '; Rebuild mixer bits and push current cached channel state to PSG.',
    '; Input:  music_ch_* caches already populated',
    '; Output: PSG tone/volume registers updated for channels A/B/C',
    ';         music_mixer_shadow rewritten with current enable bits',
    '; Destroys: AF, BC, DE, HL',
    '; ------------------------------------------------------------------',
    'music_update_channel_effects:',
    '    ld a, #3F',
    '    ld (music_mixer_shadow), a',
    '    ld c, 0',
    '    call music_update_one_channel',
    '    ld c, 1',
    '    call music_update_one_channel',
    '    ld c, 2',
    '    call music_update_one_channel',
    '    ld a, (music_mixer_shadow)',
    '    call psg_set_mixer',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_update_one_channel',
    '; Apply one cached channel to PSG and update the mixer shadow bits.',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: Channel PSG tone/volume updated or silenced',
    ';         music_mixer_shadow updated for that channel',
    '; Destroys: AF, BC, DE, HL',
    '; Preserves: Stack balance restored before return',
    '; ------------------------------------------------------------------',
    'music_update_one_channel:',
    '    push bc',
    '    push de',
    '    push hl',
    '    ld hl, music_ch_note_base',
    '    call music_load_channel_byte',
    '    cp #FF',
    '    jp z, .silent_channel',
    '    add a, a',
    '    ld e, a',
    '    ld d, 0',
    '    ld hl, music_note_period_table',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    ld h, d',
    '    ld l, e',
    '    ld a, c',
    '    push bc',
    '    call psg_set_tone',
    '    pop bc',
    '    call music_resolve_channel_volume',
    '    ld a, c',
    '    push bc',
    '    call psg_set_volume',
    '    pop bc',
    '    ld d, 1',
    '    ld e, 0',
    '    call music_get_channel_instrument_ptr',
    '    ld a, h',
    '    or l',
    '    jr z, .apply_mixer_bits',
    '    ld a, (hl)',
    '    and #01',
    '    ld d, a',
    '    ld a, (hl)',
    '    and #02',
    '    srl a',
    '    ld e, a',
    '    ld a, e',
    '    or a',
    '    jr z, .apply_mixer_bits',
    '    push de',
    '    call music_resolve_channel_noise',
    '    call psg_set_noise',
    '    pop de',
    '.apply_mixer_bits:',
    '    ld a, (music_mixer_shadow)',
    '    ld b, a',
    '    ld a, c',
    '    cp 1',
    '    jp z, .enable_b',
    '    cp 2',
    '    jp z, .enable_c',
    '    ld a, b',
    '    bit 0, d',
    '    jr z, .a_tone_off',
    '    and #3E',
    '    jr .a_noise_gate',
    '.a_tone_off:',
    '    or #01',
    '.a_noise_gate:',
    '    bit 0, e',
    '    jr z, .a_noise_off',
    '    and #37',
    '    jp .store_mixer',
    '.a_noise_off:',
    '    or #08',
    '    jp .store_mixer',
    '.enable_b:',
    '    ld a, b',
    '    bit 0, d',
    '    jr z, .b_tone_off',
    '    and #3D',
    '    jr .b_noise_gate',
    '.b_tone_off:',
    '    or #02',
    '.b_noise_gate:',
    '    bit 0, e',
    '    jr z, .b_noise_off',
    '    and #2F',
    '    jp .store_mixer',
    '.b_noise_off:',
    '    or #10',
    '    jp .store_mixer',
    '.enable_c:',
    '    ld a, b',
    '    bit 0, d',
    '    jr z, .c_tone_off',
    '    and #3B',
    '    jr .c_noise_gate',
    '.c_tone_off:',
    '    or #04',
    '.c_noise_gate:',
    '    bit 0, e',
    '    jr z, .c_noise_off',
    '    and #1F',
    '    jp .store_mixer',
    '.c_noise_off:',
    '    or #20',
    '    jp .store_mixer',
    '.silent_channel:',
    '    ld b, 0',
    '    ld a, c',
    '    push bc',
    '    call psg_set_volume',
    '    pop bc',
    '    ld a, (music_mixer_shadow)',
    '    ld b, a',
    '    ld a, c',
    '    cp 1',
    '    jp z, .disable_b',
    '    cp 2',
    '    jp z, .disable_c',
    '    ld a, b',
    '    or #09',
    '    jp .store_mixer',
    '.disable_b:',
    '    ld a, b',
    '    or #12',
    '    jp .store_mixer',
    '.disable_c:',
    '    ld a, b',
    '    or #24',
    '.store_mixer:',
    '    ld (music_mixer_shadow), a',
    '    pop hl',
    '    pop de',
    '    pop bc',
    '    ret',
    '',
    buildNotePeriodTable(),
    '',
    'music_track_count:',
    `    DB ${toAsmByte(serializedTracks.length)}`,
    '',
    'music_track_ptr_table:',
  ];

  if (serializedTracks.length === 0) {
    trackTableLines.push('    DW 0');
  } else {
    serializedTracks.forEach((track) => {
      trackTableLines.push(`    DW ${track.labelBase}_data`);
    });
  }

  if (serializedTracks.length > 0) {
    trackTableLines.push('');
    serializedTracks.forEach((track) => {
      trackTableLines.push(track.asm);
    });
  }

  return trackTableLines.join('\n');
}
