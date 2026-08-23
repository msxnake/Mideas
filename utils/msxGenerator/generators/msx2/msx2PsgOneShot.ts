import type { PSGSoundData } from '../../../../types';

/**
 * A Sound Editor asset played once on the gameplay PSG channel.
 *
 * The SCREEN 5 bitmap runtime reserves **PSG channel C** for sound effects by
 * convention: the music driver leaves it alone and merges whatever the shadow
 * byte `psg_sfx_r7_c_bits` says about the mixer. Most effects in the runtime are
 * fire-and-forget register blasts (the gem blip, the heal chime, the pick thud),
 * which is why they need no sequencer at all.
 *
 * An AUTHORED asset does need one: it is a list of steps with their own volume,
 * envelope and duration, so something has to advance it once per frame. This
 * module owns that: the compiler that turns the asset into a byte stream, and
 * the four little routines that play it back.
 *
 * The torch skill grew the original version of this and still emits its own
 * copy of the playback routines; only the compiler is shared so far. Anything
 * new should take both from here rather than adding a third copy.
 */

export interface CompiledPsgOneShot {
  /** The ASM data block, labelled with whatever the caller asked for. */
  dataAsm: string;
  /** Which authored channel was remapped onto C. */
  sourceChannel: 'A' | 'B' | 'C';
  /** Records in the stream, i.e. how many times the sequencer reloads. */
  stepCount: number;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

const hex2 = (value: number) => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

/**
 * Compiles a Sound Editor asset into the ten-byte records the sequencer walks.
 *
 * An asset may author A, B and C; the first channel with steps wins, preferring
 * C, and is remapped onto C. Each record is
 * `duration, R4, R5, R6, R10, R11, R12, R13, R7, mixer-shadow`, terminated by a
 * zero duration.
 *
 * Returns undefined when there is nothing to play, which is the caller's cue to
 * fall back to its built-in blip.
 */
export function compilePsgOneShot(
  sound: PSGSoundData | undefined,
  dataLabel: string,
  /** Comment placed above the rows; the default names the remapped channel. */
  describe?: (channel: 'A' | 'B' | 'C') => string,
): CompiledPsgOneShot | undefined {
  const channels = Array.isArray(sound?.channels) ? sound.channels : [];
  const channel = [...channels].sort((a, b) => (a.id === 'C' ? -1 : b.id === 'C' ? 1 : 0))
    .find(item => Array.isArray(item?.steps) && item.steps.length > 0);
  if (!channel) return undefined;

  const masterVolume = Number.isFinite(Number(sound?.masterVolume))
    ? Math.max(0, Math.min(1, Number(sound?.masterVolume)))
    : 1;
  const noisePeriod = clampInt(sound?.noisePeriod, 0, 31, 0);
  const envelopePeriod = clampInt(sound?.envelopePeriod, 0, 0xffff, 0);
  const globalEnvelopeShape = clampInt(sound?.envelopeShape, 0, 15, 0);
  const records: number[][] = [];

  for (const step of channel.steps) {
    const tonePeriod = clampInt(step?.tonePeriod, 0, 0x0fff, 0);
    const volume = step?.useEnvelope
      ? 0x10
      : Math.round(clampInt(step?.volume, 0, 15, 0) * masterVolume);
    const toneEnabled = step?.toneEnabled === true;
    const noiseEnabled = step?.noiseEnabled === true;
    const mixer = 0x3f
      & (toneEnabled ? ~0x04 : 0xff)
      & (noiseEnabled ? ~0x20 : 0xff);
    const mixerShadow = mixer & 0x24;
    const envelopeShape = clampInt(step?.envelopeShape, 0, 15, globalEnvelopeShape);
    // The duration byte is frames, so a long step becomes several records
    // rather than an overflow.
    let frames = Math.max(1, Math.round(clampInt(step?.durationMs, 1, 60_000, 100) * 60 / 1000));
    while (frames > 0) {
      const duration = Math.min(255, frames);
      records.push([
        duration,
        tonePeriod & 0xff,
        (tonePeriod >> 8) & 0x0f,
        noisePeriod,
        volume,
        envelopePeriod & 0xff,
        (envelopePeriod >> 8) & 0xff,
        envelopeShape,
        mixer,
        mixerShadow,
      ]);
      frames -= duration;
    }
  }
  if (!records.length) return undefined;

  const rows = records.map(record => `    DB ${record.map(hex2).join(',')}`).join('\n');
  const comment = describe
    ? describe(channel.id)
    : `    ; Sound Editor channel ${channel.id} remapped to gameplay SFX channel C.`;
  return {
    sourceChannel: channel.id,
    stepCount: records.length,
    dataAsm: `${dataLabel}:
${comment}
    ; frames, R4, R5, R6, R10, R11, R12, R13, R7, C mixer shadow
${rows}
    DB #00
`,
  };
}

/** RAM the sequencer needs: playing flag, frame countdown and the read cursor. */
export const PSG_ONE_SHOT_RAM_BYTES = 4;

/**
 * The four playback routines, named `<prefix>_start / _tick / _load_step / _stop`.
 *
 * The caller owns the RAM and emits `<prefix>_active`, `<prefix>_timer` and
 * `<prefix>_ptr` (a word) itself, because only it knows its own RAM cursor.
 * `_tick` must be called once per game frame; it returns immediately when
 * nothing is playing, so an idle effect costs a load and a branch.
 */
export function buildPsgOneShotAsm(prefix: string, dataLabel: string): string {
  return `
; ------------------------------------------------------------
; FUNCTION: ${prefix}_start
; ------------------------------------------------------------
; PURPOSE: Start the authored one-shot on gameplay PSG channel C, from the top.
;   Restarting while it is still playing is deliberate: a repeated action should
;   sound again rather than be swallowed.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
; ------------------------------------------------------------
${prefix}_start:
    ld hl, ${dataLabel}
    ld (${prefix}_ptr), hl
    ld a, 1
    ld (${prefix}_active), a
    jp ${prefix}_load_step

; ------------------------------------------------------------
; FUNCTION: ${prefix}_tick
; ------------------------------------------------------------
; PURPOSE: Advance the one-shot once per 60 Hz game frame.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
; ------------------------------------------------------------
${prefix}_tick:
    ld a, (${prefix}_active)
    or a
    ret z
    ld a, (${prefix}_timer)
    dec a
    ld (${prefix}_timer), a
    ret nz
    jp ${prefix}_load_step

; ------------------------------------------------------------
; FUNCTION: ${prefix}_load_step
; ------------------------------------------------------------
; PURPOSE: Apply one ten-byte compiled record. The asset's chosen channel was
;   remapped onto PSG C (tone R4/R5, volume R10) by compilePsgOneShot().
; INPUT: ${prefix}_ptr. OUTPUT: none.
; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
; ------------------------------------------------------------
${prefix}_load_step:
    ld hl, (${prefix}_ptr)
    ld a, (hl)                ; duration in frames; zero terminates the stream
    or a
    jp z, ${prefix}_stop
    ld (${prefix}_timer), a
    inc hl
    ld a, 4
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 5
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 6
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 10
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 11
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 12
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 13
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 7
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, (hl)
    ld (psg_sfx_r7_c_bits), a
    inc hl
    ld (${prefix}_ptr), hl
    ret

; ------------------------------------------------------------
; FUNCTION: ${prefix}_stop
; ------------------------------------------------------------
; PURPOSE: Silence PSG channel C and release the sequencer.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
${prefix}_stop:
    xor a
    ld (${prefix}_active), a
    ld a, 10
    out (#A0), a
    xor a
    out (#A1), a
    ld a, #24                 ; tone C off, noise C off
    ld (psg_sfx_r7_c_bits), a
    ret
`;
}
