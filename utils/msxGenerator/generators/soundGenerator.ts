/**
 * @fileoverview Sound Generator - PSG (AY-3-8910) sound system
 * Generates sound.asm with PSG control functions and sound effects
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { PT3Instrument, PT3Ornament, TrackerCell, TrackerSongData } from '../../../types';
import type { ExecutionPlan } from '../types/executionTypes';
import { buildResourceIdLabelFromAsmLabel } from '../utils/megaromResourceArtifacts';
import { buildSccIntegratedMusicBlock, collectSccTracks } from './sccSoundGenerator';
import type { MapperFormat } from './mapperGenerator';

const ASM_NOTE_KEEP = 0xFF;
const ASM_NOTE_CUT = 0xFE;
const TRACK_CHANNELS = ['A', 'B', 'C'] as const;

interface SerializedTrackBuildOptions {
  relativePointers?: boolean;
}

function countAsmDataBytes(asm: string): number {
  const lines = asm.split(/\r?\n/);
  let total = 0;
  for (const line of lines) {
    const clean = line.split(';')[0].trim();
    if (!clean) continue;
    const dbMatch = clean.match(/^db\s+(.+)$/i);
    if (dbMatch) {
      total += dbMatch[1]
        .split(',')
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .length;
      continue;
    }
    const dwMatch = clean.match(/^dw\s+(.+)$/i);
    if (dwMatch) {
      total += dwMatch[1]
        .split(',')
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .length * 2;
    }
  }
  return total;
}

/**
 * Generate sound file with PSG functions and effects (sound.asm)
 *
 * @param analysis - Project analysis (future: could include sound effect definitions)
 * @returns ASM code string with PSG sound system
 */
export function generateSoundFile(
  analysis: ProjectAnalysis,
  executionPlan?: ExecutionPlan,
  romMode: string = 'simple32k',
  targetFormat: MapperFormat = 'konami'
): string {
  const sccExternalTracks = (analysis.tracks || []).filter(
    (track: any) => track?.soundChip === 'SCC' && track?.playbackBackend === 'external-pt3'
  );
  if (sccExternalTracks.length > 0) {
    throw new Error('SCC export does not support playbackBackend="external-pt3"; use the native SCC tracker backend.');
  }
  const dualChipTracks = (analysis.tracks || []).filter(
    (track: any) => track?.soundChip === 'PSG+SCC'
  );
  const bitmapRouteHandlesMusic = ((analysis as any).msx2BitmapRooms || []).length > 0;
  if (dualChipTracks.length > 0 && !bitmapRouteHandlesMusic) {
    // Fail loudly: silently dropping tracks is exactly the "why is my ROM
    // mute" failure mode the dual-chip work is meant to kill. The SCREEN 5
    // bitmap-room backend is the exception: it emits its own dual PSG+SCC
    // runtime inside unitedFiles.asm and never includes this sound.asm.
    throw new Error('PSG+SCC dual-chip songs are not exportable yet on this backend (dual runtime available in the SCREEN 5 bitmap route). Keep the song as PSG or SCC for this export.');
  }

  const sccTracks = collectSccTracks(analysis);
  const pt3Tracks = collectPT3Tracks(analysis);
  const tracks = pt3Tracks.length > 0 ? [] : collectPsgTracks(analysis);
  if (sccTracks.length > 0 && (pt3Tracks.length > 0 || tracks.length > 0)) {
    throw new Error('A ROM cannot currently mix SCC music tracks with PSG/PT3 music tracks. Keep PSG sound effects, but choose one music backend.');
  }
  if (sccTracks.length > 0 && targetFormat !== 'konami') {
    throw new Error(`SCC music requires the Konami SCC mapper; received targetFormat="${targetFormat}".`);
  }

  const bankedTrackData = false;
  const musicBlock = sccTracks.length > 0
    ? buildSccIntegratedMusicBlock(sccTracks).asm
    : pt3Tracks.length > 0
      ? buildPT3MusicBlock(pt3Tracks)
      : tracks.length > 0
        ? buildTrackerMusicBlock(tracks, bankedTrackData)
        : buildNoMusicBlock();
  const usesInterruptAudio = executionPlan?.tasks.some((task) => task.responsibility === 'audio') ?? false;
  return `; ==================================================================
; ${sccTracks.length > 0 ? 'KONAMI SCC MUSIC + PSG SOUND EFFECTS' : 'PSG SOUND SYSTEM'}
; File: sound.asm
; Description: ${sccTracks.length > 0 ? `Native SCC tracker backend (${romMode}) with AY-3-8910 sound effects` : 'AY-3-8910 PSG control and sound effects'}
; Engine Audio Tick: ${usesInterruptAudio ? 'IRQ task_manager' : 'GameFlow/game loop'}
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

; @mideas:block id=runtime.sound.init kind=routine owner=sound roots=init_sound_system
init_sound_system:
    ; Avoid BIOS PSG init from banked overlays; direct PSG writes below leave
    ; the chip in a deterministic silent state without crossing ROM slots.

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
; @mideas:endblock id=runtime.sound.init

; ------------------------------------------------------------------
; task_audio_tick
; Shared audio tick wrapper for IRQ task_manager or HALT game loops.
; Preserves caller-visible registers on every exit path.
; ------------------------------------------------------------------
; @mideas:block id=runtime.sound.tick kind=routine owner=sound roots=task_audio_tick
task_audio_tick:
    push af
    push bc
    push de
    push hl

    call music_update
${analysis.stateMachines && analysis.stateMachines.length > 0 ? `    call SM_UpdateSound
` : ``}

    pop hl
    pop de
    pop bc
    pop af
    ret
; @mideas:endblock id=runtime.sound.tick

; ==================================================================
; PSG LOW-LEVEL CONTROL FUNCTIONS
; ==================================================================
; @mideas:block id=runtime.sound.psg_lowlevel kind=routine owner=sound roots=psg_write,psg_set_tone,psg_set_volume,psg_set_noise,psg_set_mixer,psg_set_envelope

; ------------------------------------------------------------------
; psg_write
; Write to PSG register via BIOS
; Input:  A = Register number (0-13)
;         E = Value to write
; Destroys: AF, E
; ------------------------------------------------------------------
psg_write:
    out (#A0), a
    ld a, e
    out (#A1), a
    ret

; ------------------------------------------------------------------
; psg_set_tone
; Set tone period for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         HL = Tone period (clamped to PSG 12-bit range 1..#0FFF)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
psg_set_tone:
    ld b, a                      ; Preserve channel while clamping period
    ld a, h
    and #F0
    jr z, .tone_period_in_range
    ld hl, #0FFF                 ; AY tone period is 12-bit; saturate overflow
.tone_period_in_range:
    ld a, h
    or l
    jr nz, .tone_period_nonzero
    inc l                        ; Avoid period 0, which is unstable on PSG
.tone_period_nonzero:
    ld a, b
    ; Calculate register numbers (A*2 for low, A*2+1 for high)
    add a, a                     ; A = channel * 2
    ld c, a                      ; C = low register number
    inc a
    ld b, a                      ; B = high register number

    ; Write low byte
    ld a, c
    ld e, l
    call psg_write

    ; Write high byte (only lower 4 bits)
    ld a, b
    ld e, h
    ld a, e
    and #0F
    ld e, a
    ld a, b
    call psg_write

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
    call psg_write
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
    call psg_write
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
    call psg_write
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
    call psg_write
    ld a, PSG_ENV_HI
    ld e, h
    call psg_write
    ld a, b
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call psg_write
    ret
; @mideas:endblock id=runtime.sound.psg_lowlevel

; ==================================================================
; HIGH-LEVEL SOUND EFFECTS
; ==================================================================

; ------------------------------------------------------------------
; sfx_silence_all
; Silence all PSG channels
; ------------------------------------------------------------------
; @mideas:block id=runtime.sound.sfx_silence kind=routine owner=sound
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
; @mideas:endblock id=runtime.sound.sfx_silence

; ------------------------------------------------------------------
; sfx_beep
; Simple beep sound
; ------------------------------------------------------------------
; @mideas:block id=runtime.sound.sfx_builtin_effects kind=routine owner=sound
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
; @mideas:endblock id=runtime.sound.sfx_builtin_effects

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
; @mideas:block id=runtime.sound.sfx_playback kind=routine owner=sound
play_sound_effect:
    ld b, a
    ld a, (music_active)
    or a
    ret nz
    ld a, b
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
; @mideas:endblock id=runtime.sound.sfx_playback

${musicBlock}

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

  return clampByte((octave * 12) + noteOffset, 0, 95);
}

function isPT3Instrument(value: PT3Instrument | any): value is PT3Instrument {
  return !!value && !Array.isArray(value.waveform);
}

function collectPsgTracks(analysis: ProjectAnalysis): TrackerSongData[] {
  const projectTracks = Array.isArray(analysis.tracks) ? analysis.tracks : [];
  return projectTracks
    .filter((track) => (track?.soundChip || 'PSG') === 'PSG' && track?.playbackBackend !== 'external-pt3')
    .map((track) => ({
      ...track,
      soundChip: track?.soundChip || 'PSG'
    }));
}

function collectPT3Tracks(analysis: ProjectAnalysis): TrackerSongData[] {
  const projectTracks = Array.isArray(analysis.tracks) ? analysis.tracks : [];
  return projectTracks.filter((track) => track?.playbackBackend === 'external-pt3');
}

export function getSerializedTrackerMusicBufferSize(_analysis: ProjectAnalysis): number {
  // Serialized tracker songs are emitted in ROM with the sound runtime, so the
  // player does not need a full-song RAM cache.
  return 0;
}

export function getSoundBank4Data(_analysis: ProjectAnalysis): string {
  // Tracker music data is kept inline in sound.asm. Keeping this empty avoids
  // duplicate MegaROM resources and the old music_track_buffer RAM copy path.
  return '';
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
  const usesLegacy127Scale = values.some((value) => clampByte(value, 0, 127) > 15);

  return values.map((value) => {
    const clamped = clampByte(value, 0, 127);
    if (!usesLegacy127Scale) {
      return clampByte(clamped, 0, 15);
    }
    const scaled = clampByte(Math.round((clamped / 127) * 15), 0, 15);
    if (clamped > 0 && scaled === 0) {
      return 1;
    }
    return scaled;
  });
}

function normalizeNoiseEnvelopeData(values: number[]): number[] {
  return values.map((value) => clampByte(value, 0, 31));
}

function buildPT3VolumeTableData(): number[] {
  const table = Array(256).fill(0);
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

  return table;
}

function hasPT3SampleMacro(instrument: PT3Instrument): boolean {
  return instrument.instrumentMode === 'pt3-sample' && !!instrument.pt3Sample?.steps.length;
}

function serializePT3SampleSteps(instrument: PT3Instrument): number[] {
  if (!hasPT3SampleMacro(instrument) || !instrument.pt3Sample) return [];

  return instrument.pt3Sample.steps.flatMap((step) => {
    const amplitudeCode = step.amplitudeSlide < 0 ? 1 : step.amplitudeSlide > 0 ? 2 : 0;
    const packedVolume = (step.volume & 0x0f) | ((amplitudeCode & 0x03) << 4);
    const flags =
      ((step.accumulateTone ? 1 : 0) << 0) |
      ((step.toneEnabled ? 1 : 0) << 1) |
      ((step.noiseEnabled ? 1 : 0) << 2) |
      ((step.hardwareEnvelopeEnabled ? 1 : 0) << 3) |
      ((step.accumulateNoiseOrEnvelope ? 1 : 0) << 4);
    const toneOffset = step.tonePeriodOffset & 0xffff;
    return [
      packedVolume,
      flags,
      toneOffset & 0xff,
      (toneOffset >>> 8) & 0xff,
      step.noiseOrEnvelopeOffset & 0xff,
    ];
  });
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

function buildTrackData(
  song: TrackerSongData,
  trackIndex: number,
  options: SerializedTrackBuildOptions = {}
): { labelBase: string; dataLabel: string; asm: string; byteSize: number } {
  const labelBase = `music_track_${trackIndex}_${sanitizeLabel(song.name || `track_${trackIndex}`)}`;
  const dataLabel = `${labelBase}_data`;
  const useRelativePointers = options.relativePointers === true;
  const orderTableLabel = useRelativePointers ? '.order_table' : `${labelBase}_order_table`;
  const patternTableLabel = useRelativePointers ? '.pattern_table' : `${labelBase}_pattern_table`;
  const instrumentPtrTableLabel = useRelativePointers ? '.instrument_ptr_table' : `${labelBase}_instrument_ptr_table`;
  const ornamentPtrTableLabel = useRelativePointers ? '.ornament_ptr_table' : `${labelBase}_ornament_ptr_table`;
  const patternRowsLabel = (patternIndex: number) => useRelativePointers ? `.pattern_${patternIndex}_rows` : `${labelBase}_pattern_${patternIndex}_rows`;
  const instrumentLabel = (instrumentId: number) => useRelativePointers ? `.inst_${instrumentId}` : `${labelBase}_inst_${instrumentId}`;
  const instrumentVolEnvLabel = (instrumentId: number) => useRelativePointers ? `.inst_${instrumentId}_vol_env` : `${labelBase}_inst_${instrumentId}_vol_env`;
  const instrumentToneEnvLabel = (instrumentId: number) => useRelativePointers ? `.inst_${instrumentId}_tone_env` : `${labelBase}_inst_${instrumentId}_tone_env`;
  const instrumentNoiseEnvLabel = (instrumentId: number) => useRelativePointers ? `.inst_${instrumentId}_noise_env` : `${labelBase}_inst_${instrumentId}_noise_env`;
  const instrumentPT3StepsLabel = (instrumentId: number) => useRelativePointers ? `.inst_${instrumentId}_pt3_steps` : `${labelBase}_inst_${instrumentId}_pt3_steps`;
  const ornamentLabel = (ornamentId: number) => useRelativePointers ? `.orn_${ornamentId}` : `${labelBase}_orn_${ornamentId}`;
  const ornamentDataLabel = (ornamentId: number) => useRelativePointers ? `.orn_${ornamentId}_data` : `${labelBase}_orn_${ornamentId}_data`;
  const instrumentMap = getInstrumentMap(song);
  const ornamentMap = getOrnamentMap(song);
  const songUsesPT3Samples = Array.from(instrumentMap.values()).some(hasPT3SampleMacro);
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
  lines.push(`${dataLabel}:`);
  lines.push(`    DB ${toAsmByte(computeRowFrames(song))}`);
  lines.push(`    DB ${toAsmByte(order.length)}`);
  lines.push(`    DB ${toAsmByte(restartPosition)}`);
  lines.push(`    DB #01`);
  lines.push(`    DB ${toAsmByte(patterns.length)}`);
  lines.push(`    DW ${useRelativePointers ? `${orderTableLabel} - ${dataLabel}` : orderTableLabel}`);
  lines.push(`    DW ${useRelativePointers ? `${patternTableLabel} - ${dataLabel}` : patternTableLabel}`);
  lines.push(`    DW ${useRelativePointers ? `${instrumentPtrTableLabel} - ${dataLabel}` : instrumentPtrTableLabel}`);
  lines.push(`    DW ${useRelativePointers ? `${ornamentPtrTableLabel} - ${dataLabel}` : ornamentPtrTableLabel}`);
  lines.push(`    DW ${toAsmWord(songUsesPT3Samples
    ? clampWord(song.ayHardwareEnvelopePeriod ?? 1, 1, 0xffff)
    : toAyHardwareEnvelopePeriod(song.ayHardwareEnvelopePeriod))}`);
  lines.push(`    DB ${toAsmByte(clampByte(song.ayNoisePeriod ?? 16, 0, 31))}`);
  lines.push('');
  lines.push(buildDbLines(orderTableLabel, order.map((value) => clampByte(value, 0, Math.max(0, patterns.length - 1)))));
  lines.push('');
  lines.push(`${patternTableLabel}:`);
  patterns.forEach((pattern, patternIndex) => {
    const rowsLabel = patternRowsLabel(patternIndex);
    lines.push(`    DW ${useRelativePointers ? `${rowsLabel} - ${dataLabel}` : rowsLabel}`);
    lines.push(`    DB ${toAsmByte(clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255))}`);
  });
  lines.push('');
  lines.push(`${instrumentPtrTableLabel}:`);
  for (let instrumentId = 0; instrumentId <= 31; instrumentId++) {
    lines.push(`    DW ${instrumentId > 0 && instrumentMap.has(instrumentId)
      ? (useRelativePointers ? `${instrumentLabel(instrumentId)} - ${dataLabel}` : instrumentLabel(instrumentId))
      : '0'}`);
  }
  lines.push('');
  lines.push(`${ornamentPtrTableLabel}:`);
  for (let ornamentId = 0; ornamentId <= 15; ornamentId++) {
    lines.push(`    DW ${ornamentId > 0 && ornamentMap.has(ornamentId)
      ? (useRelativePointers ? `${ornamentLabel(ornamentId)} - ${dataLabel}` : ornamentLabel(ornamentId))
      : '0'}`);
  }
  lines.push('');

  patterns.forEach((pattern, patternIndex) => {
    const rowCount = clampByte(pattern?.numRows || pattern?.rows?.length || 1, 1, 255);
    lines.push(`${patternRowsLabel(patternIndex)}:`);
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
    const pt3Steps = serializePT3SampleSteps(instrument);
    const pt3Macro = pt3Steps.length > 0 ? instrument.pt3Sample : undefined;

    lines.push(`${instrumentLabel(instrumentId)}:`);
    lines.push(`    DB ${toAsmByte(flags)}`);
    lines.push(`    DB ${toAsmByte(defaultVolume)}`);
    lines.push(`    DB ${toAsmByte(clampByte(instrument.ayEnvelopeShape ?? 0, 0, 15))}`);
    lines.push(`    DB ${toAsmByte(clampByte(instrument.noiseBaseFrequency ?? song.ayNoisePeriod ?? 16, 0, 31))}`);
    lines.push(`    DW ${toAsmWord(toAyHardwareEnvelopePeriod(instrument.hardwareEnvelopePeriod ?? song.ayHardwareEnvelopePeriod))}`);
    lines.push(`    DW ${volumeEnvelope.length > 0
      ? (useRelativePointers ? `${instrumentVolEnvLabel(instrumentId)} - ${dataLabel}` : instrumentVolEnvLabel(instrumentId))
      : '0'}`);
    lines.push(`    DB ${toAsmByte(volumeEnvelope.length)}`);
    lines.push(`    DB ${toAsmByte(volumeLoop)}`);
    lines.push(`    DW ${toneEnvelope.length > 0
      ? (useRelativePointers ? `${instrumentToneEnvLabel(instrumentId)} - ${dataLabel}` : instrumentToneEnvLabel(instrumentId))
      : '0'}`);
    lines.push(`    DB ${toAsmByte(toneEnvelope.length)}`);
    lines.push(`    DB ${toAsmByte(toneLoop)}`);
    lines.push(`    DW ${noiseEnvelope.length > 0
      ? (useRelativePointers ? `${instrumentNoiseEnvLabel(instrumentId)} - ${dataLabel}` : instrumentNoiseEnvLabel(instrumentId))
      : '0'}`);
    lines.push(`    DB ${toAsmByte(noiseEnvelope.length)}`);
    lines.push(`    DB ${toAsmByte(noiseLoop)}`);
    // Bytes 0..17 keep the legacy descriptor ABI. The PT3 extension starts at
    // byte 18 so old instruments and their runtime path remain bit-compatible.
    lines.push(`    DB ${toAsmByte(pt3Macro ? 1 : 0)}`);
    lines.push(`    DB ${toAsmByte(pt3Macro?.steps.length ?? 0)}`);
    lines.push(`    DB ${toAsmByte(pt3Macro ? clampByte(pt3Macro.loop, 0, pt3Macro.steps.length - 1) : 0)}`);
    lines.push(`    DB ${toAsmByte(pt3Macro?.envelopeSlideMode === 'corrected-16bit' ? 1 : 0)}`);
    lines.push(`    DW ${pt3Macro
      ? (useRelativePointers ? `${instrumentPT3StepsLabel(instrumentId)} - ${dataLabel}` : instrumentPT3StepsLabel(instrumentId))
      : '0'}`);
    if (volumeEnvelope.length > 0) lines.push(buildDbLines(instrumentVolEnvLabel(instrumentId), volumeEnvelope));
    if (toneEnvelope.length > 0) lines.push(buildDbLines(instrumentToneEnvLabel(instrumentId), toneEnvelope));
    if (noiseEnvelope.length > 0) lines.push(buildDbLines(instrumentNoiseEnvLabel(instrumentId), noiseEnvelope));
    if (pt3Steps.length > 0) lines.push(buildDbLines(instrumentPT3StepsLabel(instrumentId), pt3Steps));
    lines.push('');
  });

  Array.from(ornamentMap.entries()).sort((left, right) => left[0] - right[0]).forEach(([ornamentId, ornament]) => {
    const ornamentData = serializeSignedByteArray(ornament.data || []);
    const loopPosition = ornamentData.length > 0 && typeof ornament.loopPosition === 'number'
      ? clampByte(ornament.loopPosition, 0, ornamentData.length - 1)
      : 0xff;

    lines.push(`${ornamentLabel(ornamentId)}:`);
    lines.push(`    DW ${ornamentData.length > 0
      ? (useRelativePointers ? `${ornamentDataLabel(ornamentId)} - ${dataLabel}` : ornamentDataLabel(ornamentId))
      : '0'}`);
    lines.push(`    DB ${toAsmByte(ornamentData.length)}`);
    lines.push(`    DB ${toAsmByte(loopPosition)}`);
    if (ornamentData.length > 0) lines.push(buildDbLines(ornamentDataLabel(ornamentId), ornamentData));
    lines.push('');
  });

  if (warnings.length > 0) {
    lines.splice(3, 0, ...warnings.map((warning) => `; WARNING: ${warning}`));
  }

  const asm = lines.join('\n');
  return {
    labelBase,
    dataLabel,
    asm,
    byteSize: countAsmDataBytes(asm),
  };
}

function buildPT3MusicBlock(tracks: TrackerSongData[]): string {
  const lines: string[] = [
    '; ==================================================================',
    '; PT3 MUSIC BACKEND',
    '; Uses the PT3 replayer for AY-3-8910 music playback.',
    '; PT3_SETUP, ChanA, AYREGS, etc. are defined in variables.asm.',
    '; ==================================================================',
    '',
    '; ------------------------------------------------------------------',
    '; music_init_system',
    '; Reset PT3 music state. Call once at startup.',
    '; Destroys: AF',
    '; ------------------------------------------------------------------',
    'music_init_system:',
    '    xor a',
    '    ld (music_active), a',
    '    ld (music_muted), a',
    '    ld (music_loop), a',
    '    ld (music_track_index), a',
    '    ld (PT3_SETUP), a',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_silence_channels',
    '; Silence all AY channels via direct PSG port writes.',
    '; Destroys: AF, E',
    '; ------------------------------------------------------------------',
    'music_silence_channels:',
    '    xor a',
    '    ld b, a',
    '    call psg_set_volume     ; Channel A vol=0',
    '    ld a, 1',
    '    ld b, 0',
    '    call psg_set_volume     ; Channel B vol=0',
    '    ld a, 2',
    '    ld b, 0',
    '    call psg_set_volume     ; Channel C vol=0',
    '    ld a, PSG_MIXER',
    '    ld e, #3F',
    '    call psg_write          ; All tones+noise off',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_stop',
    '; Stop music and silence channels.',
    '; Destroys: AF',
    '; ------------------------------------------------------------------',
    'music_stop:',
    '    push af',
    '    xor a',
    '    ld (music_active), a',
    '    ld (PT3_SETUP), a',
    '    call music_silence_channels',
    '    pop af',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_mute',
    '; Mute music (keep track position).',
    '; Destroys: AF',
    '; ------------------------------------------------------------------',
    'music_mute:',
    '    ld a, (music_active)',
    '    or a',
    '    ret z',
    '    ld a, 1',
    '    ld (music_muted), a',
    '    call music_silence_channels',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_resume',
    '; Resume muted music.',
    '; Destroys: AF',
    '; ------------------------------------------------------------------',
    'music_resume:',
    '    ld a, (music_active)',
    '    or a',
    '    ret z',
    '    xor a',
    '    ld (music_muted), a',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_execute_command',
    '; Dispatch a music command from Game Flow nodes.',
    '; Input:  DE -> [command, trackIndex, loopFlag]',
    ';         0=stop, 1=play, 2=mute, 3=resume, #FF=no-op',
    '; Destroys: AF, BC (play path), DE (play path), HL',
    '; ------------------------------------------------------------------',
    'music_execute_command:',
    '    ld a, (de)',
    '    cp #FF',
    '    ret z',
    '    or a',
    '    jp z, music_stop',
    '    cp 1',
    '    jp z, .pt3_exec_play',
    '    cp 2',
    '    jp z, music_mute',
    '    cp 3',
    '    jp z, music_resume',
    '    ret',
    '.pt3_exec_play:',
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
    '; ------------------------------------------------------------------',
    '; music_play_track',
    '; Start playing a PT3 track.',
    '; Input:  A = track index (0-based)',
    ';         B = loop flag (0=no loop, 1=loop)',
    '; Destroys: AF, BC, DE, HL, IX, IY',
    '; ------------------------------------------------------------------',
    'music_play_track:',
    '    ld (music_track_index), a',
    '    ld a, b',
    '    and 1',
    '    ld (music_loop), a',
    '    ld a, (music_track_index)',
    '    add a, a               ; *2 (DW entries)',
    '    ld e, a',
    '    ld d, 0',
    '    ld hl, music_pt3_track_table',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    ld h, d',
    '    ld l, e                ; HL = adjusted module address',
    '    xor a',
    '    ld (music_muted), a',
    '    ld (PT3_SETUP), a      ; Clear end-of-song flag',
    '    di                     ; Disable interrupts while initialising PT3',
    '    push ix',
    '    push iy',
    '    call PT3_INIT',
    '    pop iy',
    '    pop ix',
    '    ld a, 1',
    '    ld (music_active), a   ; Enable playback AFTER PT3 is fully initialised',
    '    ei',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_update',
    '; Update PT3 playback. Called every frame from the main loop or ISR.',
    '; Checks end-of-song flag, handles loop/stop, runs PT3_PLAY+PT3_ROUT.',
    '; Destroys: AF, HL, DE (saves/restores IX/IY around PT3 calls)',
    '; ------------------------------------------------------------------',
    'music_update:',
    '    ld a, (music_active)',
    '    or a',
    '    ret z',
    '    ld a, (music_muted)',
    '    or a',
    '    ret nz',             // return only when muted (non-zero); playing = muted is 0
    '    ; Check if song ended (CHECKLP sets bit7 of PT3_SETUP)',
    '    ld a, (PT3_SETUP)',
    '    bit 7, a',
    '    jr z, .pt3_upd_play',
    '    ; Song ended - loop or stop?',
    '    ld a, (music_loop)',
    '    or a',
    '    jr z, .pt3_upd_stop',
    '    ; Loop: reinitialise from same track',
    '    ld a, (music_track_index)',
    '    add a, a',
    '    ld e, a',
    '    ld d, 0',
    '    ld hl, music_pt3_track_table',
    '    add hl, de',
    '    ld e, (hl)',
    '    inc hl',
    '    ld d, (hl)',
    '    ld h, d',
    '    ld l, e',
    '    push ix',
    '    push iy',
    '    call PT3_INIT',
    '    pop iy',
    '    pop ix',
    '    ret',
    '.pt3_upd_stop:',
    '    xor a',
    '    ld (music_active), a',
    '    ret',
    '.pt3_upd_play:',
    '    push ix',
    '    push iy',
    '    call PT3_PLAY',
    '    call PT3_ROUT',
    '    pop iy',
    '    pop ix',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; PT3 REPLAYER',
    '; Uses a bare include so exported ASM can compile outside server/temp',
    '; when Glass receives the project server/ directory in its include path.',
    '; ------------------------------------------------------------------',
    '    include "PT3-ROM-alltables-glass.asm"',
    '',
    '; ------------------------------------------------------------------',
    '; PT3 TRACK TABLE',
    '; ------------------------------------------------------------------',
    'music_pt3_track_count:',
    `    DB ${toAsmByte(tracks.length)}`,
    '',
    'music_pt3_track_table:',
  ];

  if (tracks.length === 0) {
    lines.push('    DW 0  ; no tracks');
  } else {
    tracks.forEach((track, index) => {
      const label = `pt3_track_${index}_data`;
      const name = track.name || `track ${index}`;
      if (track.externalPt3HasHeader) {
        // Full file: PT3_MODADDR must point to original byte 0 so PT3_INIT +100 lands on speed byte.
        lines.push(`    DW ${label}         ; ${name} (full file)`);
      } else {
        // 99 bytes stripped: data[0] = original byte 99, data[1] = PT3 speed.
        // PT3_INIT adds 100, so this reconstructs the original module base.
        lines.push(`    DW ${label} - 99    ; ${name} (.99 stripped)`);
      }
    });
  }

  if (tracks.length > 0) {
    lines.push('');
    tracks.forEach((track, index) => {
      const label = `pt3_track_${index}_data`;
      const name = track.name || `Track ${index}`;
      lines.push(`; --- PT3 Track ${index}: ${name} ---`);
      lines.push(`${label}:`);
      const bytes = track.externalPt3Data || [];
      if (bytes.length === 0) {
        lines.push('    DB 0  ; empty track');
      } else {
        for (let i = 0; i < bytes.length; i += 16) {
          const chunk = bytes.slice(i, i + 16);
          lines.push(`    DB ${chunk.map((b) => toAsmByte(b)).join(',')}`);
        }
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

function buildNativePT3SampleRuntimeAsm(): string {
  return `; ------------------------------------------------------------------
; music_channel_is_pt3_sample
; Check whether the current channel instrument uses the native PT3 step ABI.
; Input: C = channel index
; Output: A = 1 for pt3-sample, otherwise 0
; Destroys: AF, DE, HL
; Preserves: BC, IX, IY
; ------------------------------------------------------------------
music_channel_is_pt3_sample:
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    jr z, .not_pt3
    ld de, MUSIC_INSTRUMENT_PT3_MODE
    add hl, de
    ld a, (hl)
    cp 1
    jr nz, .not_pt3
    ld a, 1
    ret
.not_pt3:
    xor a
    ret

; ------------------------------------------------------------------
; music_pt3_begin_frame
; Clear per-frame reducer state. AddToNs deliberately remains persistent.
; Input: None
; Output: AddToEn=0, reducer mode defaults to corrected 16-bit
; Destroys: AF
; Preserves: BC, DE, HL, IX, IY
; ------------------------------------------------------------------
music_pt3_begin_frame:
    xor a
    ld (music_pt3_frame_active), a
    ld (music_pt3_env_add_lo), a
    ld (music_pt3_env_add_hi), a
    ld a, 1
    ld (music_pt3_env_mode), a
    ret

; ------------------------------------------------------------------
; music_pt3_apply_mixer_bits
; Merge one PT3 step's tone/noise gates into the common mixer shadow.
; Input: C = channel index, D = tone enabled, E = noise enabled
; Output: music_mixer_shadow updated for that channel
; Destroys: AF, B
; Preserves: C, DE, HL, IX, IY
; ------------------------------------------------------------------
music_pt3_apply_mixer_bits:
    ld a, (music_mixer_shadow)
    ld b, a
    ld a, c
    cp 1
    jp z, .pt3_enable_b
    cp 2
    jp z, .pt3_enable_c
    ld a, b
    bit 0, d
    jr z, .pt3_a_tone_off
    and #3E
    jr .pt3_a_noise_gate
.pt3_a_tone_off:
    or #01
.pt3_a_noise_gate:
    bit 0, e
    jr z, .pt3_a_noise_off
    and #37
    jr .pt3_store_mixer
.pt3_a_noise_off:
    or #08
    jr .pt3_store_mixer
.pt3_enable_b:
    ld a, b
    bit 0, d
    jr z, .pt3_b_tone_off
    and #3D
    jr .pt3_b_noise_gate
.pt3_b_tone_off:
    or #02
.pt3_b_noise_gate:
    bit 0, e
    jr z, .pt3_b_noise_off
    and #2F
    jr .pt3_store_mixer
.pt3_b_noise_off:
    or #10
    jr .pt3_store_mixer
.pt3_enable_c:
    ld a, b
    bit 0, d
    jr z, .pt3_c_tone_off
    and #3B
    jr .pt3_c_noise_gate
.pt3_c_tone_off:
    or #04
.pt3_c_noise_gate:
    bit 0, e
    jr z, .pt3_c_noise_off
    and #1F
    jr .pt3_store_mixer
.pt3_c_noise_off:
    or #20
.pt3_store_mixer:
    ld (music_mixer_shadow), a
    ret

; ------------------------------------------------------------------
; music_update_one_pt3_channel
; Execute one normalized five-byte PT3 sample step and emit channel-local AY.
; Global R6/R11-R13 writes are deferred to music_pt3_finalize_frame.
; Input: C = channel index (0=A, 1=B, 2=C)
; Output: Tone/volume and mixer shadow updated; reducer state accumulated
; Destroys: AF, BC, DE, HL
; Preserves: IX, IY; stack balanced on every exit
; ------------------------------------------------------------------
music_update_one_pt3_channel:
    ld a, c
    ld (music_pt3_channel_work), a
    ld a, 1
    ld (music_pt3_frame_active), a
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    jp z, .pt3_silent
    ld a, l
    ld (music_pt3_instrument_ptr_l), a
    ld a, h
    ld (music_pt3_instrument_ptr_h), a
    ld de, MUSIC_INSTRUMENT_PT3_MODE
    add hl, de
    ld a, (hl)
    cp 1
    jp nz, .pt3_silent
    inc hl
    ld a, (hl)
    or a
    jp z, .pt3_silent
    ld (music_pt3_sample_len_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_sample_loop_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_sample_mode_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_ptr_l), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_ptr_h), a

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_ch_note_base
    call music_load_channel_byte
    cp #FF
    jp z, .pt3_silent
    ld b, a
    ld a, (music_pt3_sample_mode_work)
    or a
    jr nz, .pt3_mode_ready
    ld (music_pt3_env_mode), a
.pt3_mode_ready:
    call music_apply_channel_ornament_macro
    ld a, b
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_note_period_table
    add hl, de
    ld a, (hl)
    ld (music_pt3_period_lo_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_period_hi_work), a

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_sample_pos_base
    call music_load_channel_byte
    ld (music_pitch_step_work), a
    ld b, a
    ld a, (music_pt3_sample_len_work)
    cp b
    jr z, .pt3_clamp_position
    jr nc, .pt3_position_ready
.pt3_clamp_position:
    dec a
    ld (music_pitch_step_work), a
.pt3_position_ready:
    ld a, (music_pitch_step_work)
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, de
    ld a, (music_pt3_step_ptr_l)
    ld e, a
    ld a, (music_pt3_step_ptr_h)
    ld d, a
    add hl, de
    ld a, (hl)
    ld (music_pt3_step_packed), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_flags), a
    inc hl
    ld a, (hl)
    ld (music_pt3_tone_delta_lo_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_tone_delta_hi_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_global), a

    ld a, (music_pitch_step_work)
    inc a
    ld b, a
    ld a, (music_pt3_sample_len_work)
    cp b
    jr z, .pt3_position_loop
    jr c, .pt3_position_loop
    ld a, b
    jr .pt3_store_position
.pt3_position_loop:
    ld a, (music_pt3_sample_loop_work)
.pt3_store_position:
    push af
    ld a, (music_pt3_channel_work)
    ld c, a
    pop af
    ld hl, music_pt3_sample_pos_base
    call music_store_channel_byte

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_amp_slide_base
    call music_load_channel_byte
    ld e, a
    ld a, (music_pt3_step_packed)
    and #30
    cp #10
    jr z, .pt3_amp_decrement
    cp #20
    jr z, .pt3_amp_increment
    ld a, e
    jr .pt3_amp_ready
.pt3_amp_decrement:
    ld a, e
    cp #F1
    jr z, .pt3_amp_ready
    dec a
    jr .pt3_store_amp_slide
.pt3_amp_increment:
    ld a, e
    cp #0F
    jr z, .pt3_amp_ready
    inc a
.pt3_store_amp_slide:
    push af
    ld hl, music_pt3_amp_slide_base
    call music_store_channel_byte
    pop af
.pt3_amp_ready:
    ld e, a
    ld a, (music_pt3_step_packed)
    and #0F
    ld b, a
    ld a, e
    bit 7, a
    jr z, .pt3_amp_positive
    cpl
    inc a
    ld e, a
    ld a, b
    cp e
    jr c, .pt3_amp_zero
    sub e
    jr .pt3_sample_volume_ready
.pt3_amp_zero:
    xor a
    jr .pt3_sample_volume_ready
.pt3_amp_positive:
    add a, b
    cp 16
    jr c, .pt3_sample_volume_ready
    ld a, 15
.pt3_sample_volume_ready:
    ld (music_pt3_amplitude_work), a
    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_ch_volume_base
    call music_load_channel_byte
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, (music_pt3_amplitude_work)
    add a, e
    ld e, a
    ld d, 0
    ld hl, music_pt3_volume_table
    add hl, de
    ld a, (hl)
    ld (music_pt3_amplitude_work), a

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_tone_acc_lo_base
    call music_load_channel_byte
    ld e, a
    ld hl, music_pt3_tone_acc_hi_base
    call music_load_channel_byte
    ld d, a
    ld l, e
    ld h, d
    ld a, (music_pt3_tone_delta_lo_work)
    ld e, a
    ld a, (music_pt3_tone_delta_hi_work)
    ld d, a
    add hl, de
    ld a, l
    ld (music_pt3_tone_delta_lo_work), a
    ld a, h
    ld (music_pt3_tone_delta_hi_work), a
    ld a, (music_pt3_step_flags)
    bit 0, a
    jr z, .pt3_tone_acc_ready
    ld a, (music_pt3_channel_work)
    ld c, a
    ld a, (music_pt3_tone_delta_lo_work)
    ld hl, music_pt3_tone_acc_lo_base
    call music_store_channel_byte
    ld a, (music_pt3_tone_delta_hi_work)
    ld hl, music_pt3_tone_acc_hi_base
    call music_store_channel_byte
.pt3_tone_acc_ready:
    ld a, (music_pt3_period_lo_work)
    ld l, a
    ld a, (music_pt3_period_hi_work)
    ld h, a
    ld a, (music_pt3_tone_delta_lo_work)
    ld e, a
    ld a, (music_pt3_tone_delta_hi_work)
    ld d, a
    add hl, de
    ld a, l
    ld (music_pt3_period_lo_work), a
    ld a, h
    ld (music_pt3_period_hi_work), a
    ld a, (music_pt3_period_lo_work)
    ld l, a
    ld a, (music_pt3_period_hi_work)
    ld h, a
    ld a, (music_pt3_channel_work)
    call psg_set_tone

    ld a, (music_pt3_step_flags)
    bit 2, a
    jp z, .pt3_envelope_target
    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_noise_acc_base
    call music_load_channel_byte
    ld e, a
    ld a, (music_pt3_step_global)
    add a, e
    ld (music_pt3_step_global), a
    ld b, a
    ld a, (music_pt3_step_flags)
    bit 4, a
    jr z, .pt3_noise_output_ready
    ld a, b
    ld hl, music_pt3_noise_acc_base
    call music_store_channel_byte
.pt3_noise_output_ready:
    ld a, b
    ld (music_pt3_noise_add), a
    jp .pt3_global_done

.pt3_envelope_target:
    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_env_acc_lo_base
    call music_load_channel_byte
    ld e, a
    ld hl, music_pt3_env_acc_hi_base
    call music_load_channel_byte
    ld d, a
    ld l, e
    ld h, d
    ld a, (music_pt3_step_global)
    ld e, a
    ld d, 0
    bit 7, e
    jr z, .pt3_env_offset_ready
    dec d
.pt3_env_offset_ready:
    add hl, de
    ld a, (music_pt3_sample_mode_work)
    or a
    jr nz, .pt3_env_width_ready
    ld a, l
    ld h, 0
    bit 7, a
    jr z, .pt3_env_width_ready
    dec h
.pt3_env_width_ready:
    ld a, l
    ld (music_pt3_tone_delta_lo_work), a
    ld a, h
    ld (music_pt3_tone_delta_hi_work), a
    ld a, (music_pt3_step_flags)
    bit 4, a
    jr z, .pt3_env_acc_ready
    ld a, (music_pt3_channel_work)
    ld c, a
    ld a, (music_pt3_tone_delta_lo_work)
    ld hl, music_pt3_env_acc_lo_base
    call music_store_channel_byte
    ld a, (music_pt3_tone_delta_hi_work)
    ld hl, music_pt3_env_acc_hi_base
    call music_store_channel_byte
.pt3_env_acc_ready:
    ld a, (music_pt3_tone_delta_lo_work)
    ld l, a
    ld a, (music_pt3_tone_delta_hi_work)
    ld h, a
    ld a, (music_pt3_env_add_lo)
    ld e, a
    ld a, (music_pt3_env_add_hi)
    ld d, a
    add hl, de
    ld a, l
    ld (music_pt3_env_add_lo), a
    ld a, h
    ld (music_pt3_env_add_hi), a

.pt3_global_done:
    ld a, (music_pt3_amplitude_work)
    ld b, a
    ld a, (music_pt3_step_flags)
    bit 3, a
    jr z, .pt3_volume_ready
    ld a, b
    or #10
    ld b, a
.pt3_volume_ready:
    ld a, (music_pt3_channel_work)
    call psg_set_volume
    ld d, 0
    ld e, 0
    ld a, (music_pt3_step_flags)
    bit 1, a
    jr z, .pt3_tone_gate_ready
    inc d
.pt3_tone_gate_ready:
    bit 2, a
    jr z, .pt3_noise_gate_ready
    inc e
.pt3_noise_gate_ready:
    ld a, (music_pt3_channel_work)
    ld c, a
    call music_pt3_apply_mixer_bits
    ret

.pt3_silent:
    ld b, 0
    ld a, (music_pt3_channel_work)
    call psg_set_volume
    ld d, 0
    ld e, 0
    ld a, (music_pt3_channel_work)
    ld c, a
    call music_pt3_apply_mixer_bits
    ret

; ------------------------------------------------------------------
; music_pt3_finalize_frame
; Apply reducer-global PT3 noise/envelope registers after channels A->B->C.
; Input: Per-frame reducer state and persistent AddToNs in RAM
; Output: R6/R11/R12 written; R13 written only when retrigger is pending
; Destroys: AF, DE, HL
; Preserves: BC, IX, IY
; ------------------------------------------------------------------
music_pt3_finalize_frame:
    ld a, (music_pt3_frame_active)
    or a
    ret z
    ld a, MUSIC_TRACK_NOISE_DEFAULT
    call music_read_track_byte
    ld e, a
    ld a, (music_pt3_noise_add)
    add a, e
    call psg_set_noise

    ld a, MUSIC_TRACK_ENV_BASE
    call music_get_track_header_ptr
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, (music_pt3_env_add_lo)
    ld l, a
    ld a, (music_pt3_env_add_hi)
    ld h, a
    ld a, (music_pt3_env_mode)
    or a
    jr nz, .pt3_env_sum_ready
    ld a, l
    ld h, 0
    bit 7, a
    jr z, .pt3_env_sum_ready
    dec h
.pt3_env_sum_ready:
    add hl, de
    ld a, PSG_ENV_LO
    ld e, l
    call psg_write
    ld a, PSG_ENV_HI
    ld e, h
    call psg_write
    ld a, (music_pt3_r13_pending)
    or a
    ret z
    ld a, (music_pt3_r13_value)
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call psg_write
    xor a
    ld (music_pt3_r13_pending), a
    ret`;
}

function buildTrackerMusicBlock(tracks: TrackerSongData[], bankedTrackData: boolean = false): string {
  const serializedTracks = tracks.map((track, index) => buildTrackData(track, index, { relativePointers: bankedTrackData }));
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
    'MUSIC_TRACK_ORNAMENT_TABLE  EQU 11',
    'MUSIC_TRACK_ENV_BASE        EQU 13',
    'MUSIC_TRACK_NOISE_DEFAULT   EQU 15',
    'MUSIC_INSTRUMENT_PT3_MODE   EQU 18',
    'MUSIC_PT3_STEP_SIZE         EQU 5',
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
    ...(bankedTrackData ? [
      '    ld a, #FF',
      '    ld (music_loaded_track_index), a',
    ] : []),
    '    ld a, #3F',
    '    ld (music_mixer_shadow), a',
    '    call music_reset_channel_state',
    '    call music_reset_pt3_state',
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
    '    ld (music_ch_a_hw_env_step), a',
    '    ld (music_ch_b_hw_env_step), a',
    '    ld (music_ch_c_hw_env_step), a',
    '    ld a, #0F',
    '    ld (music_ch_a_volume), a',
    '    ld (music_ch_b_volume), a',
    '    ld (music_ch_c_volume), a',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_reset_pt3_state',
    '; Reset every native pt3-sample accumulator and the persistent AddToNs.',
    '; Input: None',
    '; Output: PT3 sample runtime returned to PT3_INIT state',
    '; Destroys: AF',
    '; Preserves: BC, DE, HL, IX, IY',
    '; ------------------------------------------------------------------',
    'music_reset_pt3_state:',
    '    xor a',
    '    ld (music_pt3_frame_active), a',
    '    ld (music_pt3_noise_add), a',
    '    ld (music_pt3_env_add_lo), a',
    '    ld (music_pt3_env_add_hi), a',
    '    ld (music_pt3_r13_pending), a',
    '    ld (music_pt3_r13_value), a',
    '    ld (music_pt3_ch_a_sample_pos), a',
    '    ld (music_pt3_ch_b_sample_pos), a',
    '    ld (music_pt3_ch_c_sample_pos), a',
    '    ld (music_pt3_ch_a_tone_acc_lo), a',
    '    ld (music_pt3_ch_b_tone_acc_lo), a',
    '    ld (music_pt3_ch_c_tone_acc_lo), a',
    '    ld (music_pt3_ch_a_tone_acc_hi), a',
    '    ld (music_pt3_ch_b_tone_acc_hi), a',
    '    ld (music_pt3_ch_c_tone_acc_hi), a',
    '    ld (music_pt3_ch_a_amp_slide), a',
    '    ld (music_pt3_ch_b_amp_slide), a',
    '    ld (music_pt3_ch_c_amp_slide), a',
    '    ld (music_pt3_ch_a_noise_acc), a',
    '    ld (music_pt3_ch_b_noise_acc), a',
    '    ld (music_pt3_ch_c_noise_acc), a',
    '    ld (music_pt3_ch_a_env_acc_lo), a',
    '    ld (music_pt3_ch_b_env_acc_lo), a',
    '    ld (music_pt3_ch_c_env_acc_lo), a',
    '    ld (music_pt3_ch_a_env_acc_hi), a',
    '    ld (music_pt3_ch_b_env_acc_hi), a',
    '    ld (music_pt3_ch_c_env_acc_hi), a',
    '    ld a, 1',
    '    ld (music_pt3_env_mode), a',
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
    ...(bankedTrackData ? [
      '    push bc',
      '    ld e, a',
      '    ld d, 0',
      '    ld a, (music_loaded_track_index)',
      '    cp e',
      '    jr z, .track_ready',
      '    ld hl, music_track_resource_id_table',
      '    add hl, de',
      '    ld a, (hl)',
      '    ld de, music_track_buffer',
      '    call resource_load_to_ram_by_id',
      '    jr c, .load_fail',
      '    ld a, (music_track_index)',
      '    ld (music_loaded_track_index), a',
      '.track_ready:',
      '    ld hl, music_track_buffer',
      '    ld a, l',
      '    ld (music_track_ptr_l), a',
      '    ld a, h',
      '    ld (music_track_ptr_h), a',
      '    pop bc',
      '    or a',
      '    ret',
      '.load_fail:',
      '    xor a',
      '    ld (music_track_ptr_l), a',
      '    ld (music_track_ptr_h), a',
      '    ld a, #FF',
      '    ld (music_loaded_track_index), a',
      '    pop bc',
      '    scf',
      '    ret',
    ] : [
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
      '    or a',
      '    ret',
    ]),
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
    ...(bankedTrackData ? [
      'music_resolve_track_relative_ptr_at_hl:',
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
      '    ld a, d',
      '    or e',
      '    jr z, .null_ptr',
      '    push de',
      '    call music_get_track_ptr',
      '    pop de',
      '    add hl, de',
      '    ret',
      '.null_ptr:',
      '    ld hl, 0',
      '    ret',
      '',
      'music_read_track_word:',
      '    call music_get_track_header_ptr',
      '    jp music_resolve_track_relative_ptr_at_hl',
    ] : [
      'music_read_track_word:',
      '    call music_get_track_header_ptr',
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
      '    ld h, d',
      '    ld l, e',
      '    ret',
    ]),
    '',
    'music_get_instrument_ptr:',
    '    or a',
    '    jr z, .no_instrument',
    '    add a, a',
    '    ld e, a',
    '    ld d, 0',
    '    push de',
    '    ld a, MUSIC_TRACK_INSTRUMENT_TABLE',
    '    call music_read_track_word',
    '    pop de',
    '    add hl, de',
    ...(bankedTrackData ? [
      '    jp music_resolve_track_relative_ptr_at_hl',
    ] : [
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
      '    ld h, d',
      '    ld l, e',
      '    ret',
    ]),
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
    '; music_get_channel_ornament_ptr',
    '; Resolve current channel ornament pointer from the cached ornament id.',
    '; Input:  C = channel index (0=A, 1=B, 2=C)',
    '; Output: HL = ornament descriptor or 0 when none is active',
    '; Destroys: AF, DE, HL',
    '; ------------------------------------------------------------------',
    'music_get_channel_ornament_ptr:',
    '    ld hl, music_ch_ornament_base',
    '    call music_load_channel_byte',
    '    or a',
    '    jr z, .no_ornament',
    '    add a, a',
    '    ld e, a',
    '    ld d, 0',
    '    push de',
    '    ld a, MUSIC_TRACK_ORNAMENT_TABLE',
    '    call music_read_track_word',
    '    pop de',
    '    add hl, de',
    ...(bankedTrackData ? [
      '    jp music_resolve_track_relative_ptr_at_hl',
    ] : [
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
      '    ld h, d',
      '    ld l, e',
      '    ret',
    ]),
    '.no_ornament:',
    '    ld hl, 0',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_apply_signed_offset_to_note_work',
    '; Apply signed semitone offset in A to music_pitch_note_work, clamped 0..95.',
    '; ------------------------------------------------------------------',
    'music_apply_signed_offset_to_note_work:',
    '    bit 7, a',
    '    jr z, .positive_offset',
    '    cpl',
    '    inc a',
    '    ld e, a',
    '    ld a, (music_pitch_note_work)',
    '    cp e',
    '    jr nc, .subtract_ok',
    '    xor a',
    '    ld (music_pitch_note_work), a',
    '    ret',
    '.subtract_ok:',
    '    sub e',
    '    ld (music_pitch_note_work), a',
    '    ret',
    '.positive_offset:',
    '    ld e, a',
    '    ld a, (music_pitch_note_work)',
    '    add a, e',
    '    jr c, .clamp_high',
    '    cp 96',
    '    jr c, .store_positive',
    '.clamp_high:',
    '    ld a, 95',
    '.store_positive:',
    '    ld (music_pitch_note_work), a',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_apply_channel_tone_macro',
    '; Apply active instrument toneEnvelope as relative semitone offsets.',
    '; Input:  C = channel index, B = current note index',
    '; Output: B = adjusted note index',
    '; Destroys: AF, DE, HL',
    '; ------------------------------------------------------------------',
    'music_apply_channel_tone_macro:',
    '    ld a, b',
    '    ld (music_pitch_note_work), a',
    '    call music_get_channel_instrument_ptr',
    '    ld a, h',
    '    or l',
    '    jp z, .tone_done',
    '    push hl',
    '    ld de, 12',
    '    add hl, de',
    '    ld a, (hl)',
    '    pop hl',
    '    or a',
    '    jp z, .tone_done',
    '    ld (music_pitch_len_work), a',
    '    push hl',
    '    ld hl, music_ch_tone_step_base',
    '    call music_load_channel_byte',
    '    pop hl',
    '    ld e, a',
    '    ld d, e',
    '    ld a, (music_pitch_len_work)',
    '    cp d',
    '    jr z, .tone_step_clamp',
    '    jr nc, .tone_step_in_range',
    '.tone_step_clamp:',
    '    dec a',
    '    ld e, a',
    '.tone_step_in_range:',
    '    ld a, e',
    '    ld (music_pitch_step_work), a',
    '    inc a',
    '    ld e, a',
    '    ld d, e',
    '    ld a, (music_pitch_len_work)',
    '    cp d',
    '    jr z, .tone_use_loop',
    '    jr nc, .tone_store_next',
    '.tone_use_loop:',
    '    push hl',
    '    ld de, 13',
    '    add hl, de',
    '    ld e, (hl)',
    '    pop hl',
    '    ld d, e',
    '    ld a, (music_pitch_len_work)',
    '    cp d',
    '    jr z, .tone_loop_clamp',
    '    jr nc, .tone_store_next',
    '.tone_loop_clamp:',
    '    dec a',
    '    ld e, a',
    '.tone_store_next:',
    '    ld a, e',
    '    push hl',
    '    ld hl, music_ch_tone_step_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '    push hl',
    '    ld de, 10',
    '    add hl, de',
    ...(bankedTrackData ? [
      '    call music_resolve_track_relative_ptr_at_hl',
    ] : [
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
      '    ld h, d',
      '    ld l, e',
    ]),
    '    ld a, (music_pitch_step_work)',
    '    ld e, a',
    '    ld d, 0',
    '    add hl, de',
    '    ld a, (hl)',
    '    call music_apply_signed_offset_to_note_work',
    '    pop hl',
    '.tone_done:',
    '    ld a, (music_pitch_note_work)',
    '    ld b, a',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_apply_channel_ornament_macro',
    '; Apply active ornament as relative semitone offsets without pitch drift.',
    '; Input:  C = channel index, B = current note index',
    '; Output: B = adjusted note index',
    '; Destroys: AF, DE, HL',
    '; ------------------------------------------------------------------',
    'music_apply_channel_ornament_macro:',
    '    ld a, b',
    '    ld (music_pitch_note_work), a',
    '    call music_get_channel_ornament_ptr',
    '    ld a, h',
    '    or l',
    '    jp z, .orn_done',
    '    push hl',
    '    inc hl',
    '    inc hl',
    '    ld a, (hl)',
    '    pop hl',
    '    or a',
    '    jp z, .orn_done',
    '    ld (music_pitch_len_work), a',
    '    push hl',
    '    ld hl, music_ch_orn_step_base',
    '    call music_load_channel_byte',
    '    pop hl',
    '    ld e, a',
    '    ld d, e',
    '    ld a, (music_pitch_len_work)',
    '    cp d',
    '    jr z, .orn_step_clamp',
    '    jr nc, .orn_step_in_range',
    '.orn_step_clamp:',
    '    dec a',
    '    ld e, a',
    '.orn_step_in_range:',
    '    ld a, e',
    '    ld (music_pitch_step_work), a',
    '    inc a',
    '    ld e, a',
    '    ld d, e',
    '    ld a, (music_pitch_len_work)',
    '    cp d',
    '    jr z, .orn_use_loop',
    '    jr nc, .orn_store_next',
    '.orn_use_loop:',
    '    push hl',
    '    ld de, 3',
    '    add hl, de',
    '    ld e, (hl)',
    '    pop hl',
    '    ld d, e',
    '    ld a, (music_pitch_len_work)',
    '    cp d',
    '    jr z, .orn_loop_clamp',
    '    jr nc, .orn_store_next',
    '.orn_loop_clamp:',
    '    dec a',
    '    ld e, a',
    '.orn_store_next:',
    '    ld a, e',
    '    push hl',
    '    ld hl, music_ch_orn_step_base',
    '    call music_store_channel_byte',
    '    pop hl',
    ...(bankedTrackData ? [
      '    call music_resolve_track_relative_ptr_at_hl',
    ] : [
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
      '    ld h, d',
      '    ld l, e',
    ]),
    '    ld a, (music_pitch_step_work)',
    '    ld e, a',
    '    ld d, 0',
    '    add hl, de',
    '    ld a, (hl)',
    '    call music_apply_signed_offset_to_note_work',
    '.orn_done:',
    '    ld a, (music_pitch_note_work)',
    '    ld b, a',
    '    ret',
    '',
    '; ------------------------------------------------------------------',
    '; music_resolve_channel_note_index',
    '; Combine base note + tone macro + ornament into final note index.',
    '; Input:  C = channel index',
    '; Output: A = final note index or #FF when silent',
    '; Destroys: AF, B, DE, HL',
    '; ------------------------------------------------------------------',
    'music_resolve_channel_note_index:',
    '    ld hl, music_ch_note_base',
    '    call music_load_channel_byte',
    '    cp #FF',
    '    ret z',
    '    ld b, a',
    '    call music_apply_channel_tone_macro',
    '    call music_apply_channel_ornament_macro',
    '    ld a, b',
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
    ...(bankedTrackData ? [
      '    call music_resolve_track_relative_ptr_at_hl',
      '    ld e, l',
      '    ld d, h',
    ] : [
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
    ]),
    '    pop hl',
    '    push hl',
    '    ld hl, music_ch_vol_step_base',
    '    call music_load_channel_byte',
    '    cp b',
    '    jr c, .step_ok_restore',
    '    pop hl',
    '    push de',
    '    push hl',
    '    ld de, 9',
    '    add hl, de',
    '    ld a, (hl)',
    '    pop hl',
    '    pop de',
    '    cp b',
    '    jr c, .step_ok',
    '    ld a, b',
    '    push af',
    '    ld hl, music_ch_vol_step_base',
    '    call music_store_channel_byte',
    '    pop af',
    '    ld hl, music_ch_note_base',
    '    ld a, #FF',
    '    call music_store_channel_byte',
    '    xor a',
    '    ld b, a',
    '    jp .mrcv_done',
    '.step_ok_restore:',
    '    pop hl',
    '.step_ok:',
    '    push af',
    '    inc a',
    '    cp b',
    '    jr c, .next_step_ok',
    '    push de',
    '    push hl',
    '    ld de, 9',
    '    add hl, de',
    '    ld a, (hl)',
    '    pop hl',
    '    pop de',
    '    cp b',
    '    jr c, .next_step_ok',
    '    ld a, b',
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
    '    ld hl, music_ch_hw_env_step_base',
    '    call music_load_channel_byte',
    '    inc a',
    '    cp 2',
    '    jr c, .hw_store_counter',
    '    xor a',
    '    push af',
    '    ld hl, music_ch_hw_env_step_base',
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
    '    ld hl, music_ch_hw_env_step_base',
    '    call music_store_channel_byte',
    '    pop af',
    '    ld hl, music_ch_vol_step_base',
    '    call music_load_channel_byte',
    '.hw_phase_ready:',
    '    push af',           // save phase (A=0..15) before call destroys AF/DE/HL
    '    call music_get_channel_instrument_ptr', // HL = instrument ptr (or 0)
    '    ld a, h',
    '    or l',
    '    pop af',            // restore A = phase
    '    jr z, .hw_decay',  // no instrument → decay
    '    push af',           // save phase again while reading instrument byte
    '    inc hl',
    '    inc hl',            // HL = &instrument[2] = ayEnvelopeShape
    '    ld a, (hl)',
    '    and #04',           // bit 2 of ayEnvelopeShape: 1=attack, 0=decay
    '    pop af',            // restore A = phase
    '    jr z, .hw_decay',
    '    ld b, a',           // attack: B = phase (0→15 = volume increases)
    '    jp .mrcv_done',
    '.hw_decay:',
    '    ld e, a',           // E = phase
    '    ld a, 15',
    '    sub e',
    '    ld b, a',           // decay: B = 15-phase (15→0 = volume decreases)
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
    ...(bankedTrackData ? [
      '    call music_resolve_track_relative_ptr_at_hl',
      '    ld e, l',
      '    ld d, h',
    ] : [
      '    ld e, (hl)',
      '    inc hl',
      '    ld d, (hl)',
    ]),
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
    ...buildNativePT3SampleRuntimeAsm().split('\n'),
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
    '    jp nc, .mpt_done',
    '    ld (music_track_index), a',
    '    call music_load_track_pointer_from_index',
    '    jp c, .mpt_done',
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
    '    call music_reset_pt3_state',
    '    call music_apply_row',
    '.mpt_done:',
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
    '; ------------------------------------------------------------------',
    '; music_reset_pt3_channel_state',
    '; Reset the CHNPRM-equivalent PT3 sample state for one note-on/cut.',
    '; Input: C = channel index (0=A, 1=B, 2=C)',
    '; Output: Channel sample position and all accumulators are zero',
    '; Destroys: AF, HL',
    '; Preserves: BC, DE, IX, IY',
    '; ------------------------------------------------------------------',
    'music_reset_pt3_channel_state:',
    '    xor a',
    '    ld hl, music_pt3_sample_pos_base',
    '    call music_store_channel_byte',
    '    ld hl, music_pt3_tone_acc_lo_base',
    '    call music_store_channel_byte',
    '    ld hl, music_pt3_tone_acc_hi_base',
    '    call music_store_channel_byte',
    '    ld hl, music_pt3_amp_slide_base',
    '    call music_store_channel_byte',
    '    ld hl, music_pt3_noise_acc_base',
    '    call music_store_channel_byte',
    '    ld hl, music_pt3_env_acc_lo_base',
    '    call music_store_channel_byte',
    '    ld hl, music_pt3_env_acc_hi_base',
    '    call music_store_channel_byte',
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
    '    ld hl, music_ch_hw_env_step_base',
    '    call music_store_channel_byte',
    '    call music_reset_pt3_channel_state',
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
    '    jr nz, .store_explicit_volume',
    '    ld a, d',
    '    or a',
    '    jr z, .maybe_trigger_attack',
    '    push de',
    '    push hl',
    '    call music_channel_is_pt3_sample',
    '    or a',
    '    pop hl',
    '    pop de',
    '    jr z, .maybe_trigger_attack',
    '    ld a, 15',
    '    push hl',
    '    ld hl, music_ch_volume_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '    jr .maybe_trigger_attack',
    '.store_explicit_volume:',
    '    push hl',
    '    ld hl, music_ch_volume_base',
    '    call music_store_channel_byte',
    '    pop hl',
    '.maybe_trigger_attack:',
    '    ld a, d',
    '    or a',
    '    ret z',
    '    push hl',
    '    call music_channel_is_pt3_sample',
    '    or a',
    '    jr z, .legacy_trigger_attack',
    '    call music_get_channel_instrument_ptr',
    '    ld a, (hl)',
    '    and #04',
    '    jr z, .pt3_trigger_done',
    '    inc hl',
    '    inc hl',
    '    ld a, (hl)',
    '    and #0F',
    '    ld (music_pt3_r13_value), a',
    '    ld a, 1',
    '    ld (music_pt3_r13_pending), a',
    '.pt3_trigger_done:',
    '    pop hl',
    '    ret',
    '.legacy_trigger_attack:',
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
    ...(bankedTrackData ? [
      '    push hl',
      '    call music_resolve_track_relative_ptr_at_hl',
      '    ld a, l',
      '    ld (music_pattern_ptr_l), a',
      '    ld a, h',
      '    ld (music_pattern_ptr_h), a',
      '    pop hl',
      '    inc hl',
      '    inc hl',
      '    ld a, (hl)',
      '    ld (music_pattern_rows), a',
      '    ld a, (music_pattern_ptr_h)',
      '    ld h, a',
      '    ld a, (music_pattern_ptr_l)',
      '    ld l, a',
    ] : [
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
    ]),
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
    '    ld a, (music_row_countdown)',
    '    or a',
    '    jp z, music_apply_row',
    '    dec a',
    '    ld (music_row_countdown), a',
    '    jp z, music_apply_row',
    '    call music_update_channel_effects',
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
    '    call music_pt3_begin_frame',
    '    ld c, 0',
    '    call music_update_one_channel',
    '    ld c, 1',
    '    call music_update_one_channel',
    '    ld c, 2',
    '    call music_update_one_channel',
    '    call music_pt3_finalize_frame',
    '    ld a, (music_mixer_shadow)',
    '    ld b, a',
    '    ld a, (music_pt3_frame_active)',
    '    or a',
    '    ld a, b',
    '    jr z, .mixer_value_ready',
    '    or #80',
    '.mixer_value_ready:',
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
    '    call music_channel_is_pt3_sample',
    '    or a',
    '    jr z, .legacy_channel',
    '    call music_update_one_pt3_channel',
    '    jp .channel_done',
    '.legacy_channel:',
    '    call music_resolve_channel_note_index',
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
    '.channel_done:',
    '    pop hl',
    '    pop de',
    '    pop bc',
    '    ret',
    '',
    buildNotePeriodTable(),
    '',
    buildDbLines('music_pt3_volume_table', buildPT3VolumeTableData()),
    '',
    'music_track_count:',
    `    DB ${toAsmByte(serializedTracks.length)}`,
    '',
    ...(bankedTrackData ? [
      'music_track_resource_id_table:',
    ] : [
      'music_track_ptr_table:',
    ]),
  ];

  if (serializedTracks.length === 0) {
    trackTableLines.push(bankedTrackData ? '    DB RESOURCE_ID_INVALID' : '    DW 0');
  } else {
    serializedTracks.forEach((track) => {
      if (bankedTrackData) {
        trackTableLines.push(`    DB ${buildResourceIdLabelFromAsmLabel(track.dataLabel)}`);
      } else {
        trackTableLines.push(`    DW ${track.dataLabel}`);
      }
    });
  }

  if (!bankedTrackData && serializedTracks.length > 0) {
    trackTableLines.push('');
    serializedTracks.forEach((track) => {
      trackTableLines.push(track.asm);
    });
  }

  return trackTableLines.join('\n');
}

function buildNoMusicBlock(): string {
  return [
    '; ==================================================================',
    '; TRACKER MUSIC RUNTIME',
    '; No exportable music tracks are referenced by this project.',
    '; Public labels are kept as no-op stubs so GameFlow/audio wrappers',
    '; remain link-compatible without carrying the tracker interpreter.',
    '; ==================================================================',
    '',
    '; @mideas:block id=runtime.sound.music_noop_runtime kind=routine owner=sound',
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
    '    ret',
    '',
    '; @mideas:block id=runtime.sound.music_reset_noop kind=routine owner=sound',
    'music_reset_channel_state:',
    '    ret',
    '; @mideas:endblock id=runtime.sound.music_reset_noop',
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
    '    call music_init_system',
    '    call music_silence_channels',
    '    ret',
    '',
    'music_mute:',
    'music_resume:',
    'music_update:',
    'music_update_channel_effects:',
    'music_play_track:',
    '    ret',
    '',
    'music_execute_command:',
    '    ld a, (de)',
    '    cp #FF',
    '    ret z',
    '    or a',
    '    jp z, music_stop',
    '    ret',
    '',
    'music_track_count:',
    '    DB #00',
    '',
    'music_track_ptr_table:',
    '    DW 0',
    '; @mideas:endblock id=runtime.sound.music_noop_runtime',
  ].join('\n');
}
