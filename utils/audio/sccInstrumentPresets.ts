/**
 * @fileoverview Curated SCC instrument library.
 *
 * Ready-to-use instruments so composers do not have to hand-draw waveforms
 * every time. All waveforms are original synthesis recipes (32 signed
 * samples, -128..127): additive harmonic blends for acoustic-ish timbres and
 * raw pulse/saw/triangle shapes for the classic chip voices. Envelopes use
 * the native 0-15 volume range; drums use noiseMode (the driver rewrites the
 * waveform with pseudo-random bytes every frame, so the note period sets the
 * noise colour: low = rumble, high = hiss); "Coro" shows off the waveform
 * morphing engine (note-on morphs base -> target in 16 steps).
 *
 * The ids here are DEFAULT ids only — the editor reassigns a free id when a
 * preset is inserted into a song.
 */

import type { SCCInstrument } from '../../types';

const TWO_PI = Math.PI * 2;

/** Additive blend of sine harmonics, normalized to a -127..127 peak. */
function harmonics(partials: Array<[number, number]>): number[] {
  const wave = new Array<number>(32).fill(0);
  for (let i = 0; i < 32; i++) {
    let value = 0;
    for (const [harmonic, amplitude] of partials) {
      value += amplitude * Math.sin((TWO_PI * harmonic * i) / 32);
    }
    wave[i] = value;
  }
  const peak = Math.max(...wave.map(Math.abs)) || 1;
  return wave.map((v) => Math.max(-128, Math.min(127, Math.round((v * 127) / peak))));
}

/** Raw pulse wave (classic chip voice). duty = high fraction (0..1). */
function pulse(duty: number): number[] {
  const highSamples = Math.max(1, Math.min(31, Math.round(duty * 32)));
  return Array.from({ length: 32 }, (_v, i) => (i < highSamples ? 127 : -128));
}

/** Raw rising sawtooth. */
function sawtooth(): number[] {
  return Array.from({ length: 32 }, (_v, i) => Math.round(-128 + (i * 255) / 31));
}

/** Raw triangle. */
function triangle(): number[] {
  return Array.from({ length: 32 }, (_v, i) => {
    const phase = i / 32;
    const value = phase < 0.5 ? -1 + 4 * phase : 3 - 4 * phase;
    return Math.max(-128, Math.min(127, Math.round(value * 127)));
  });
}

// ---------------------------------------------------------------------------
// Teclas
// ---------------------------------------------------------------------------

/**
 * Piano: bright attack rich in harmonics with a percussive volume decay.
 * The 2nd/3rd partials give the hammer "ping"; the hold value 2 keeps a
 * soft tail instead of an organ-like infinite sustain.
 */
export const SCC_PRESET_PIANO: SCCInstrument = {
  id: 1,
  name: 'Piano',
  waveform: harmonics([[1, 100], [2, 55], [3, 28], [4, 14], [5, 7]]),
  volume: 15,
  volumeEnvelope: [15, 14, 12, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2],
  volumeLoop: 0xff, // hold the tail
};

/** E-Piano: sine body + bell partial, mellow decay to a warm tail. */
export const SCC_PRESET_EPIANO: SCCInstrument = {
  id: 2,
  name: 'Piano Eléctrico',
  waveform: harmonics([[1, 127], [2, 18], [4, 40], [8, 10]]),
  volume: 15,
  volumeEnvelope: [15, 13, 12, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5],
  volumeLoop: 0xff,
};

/** Organ: drawbar-style even/odd mix, instant full sustain, zero decay. */
export const SCC_PRESET_ORGAN: SCCInstrument = {
  id: 3,
  name: 'Órgano',
  waveform: harmonics([[1, 110], [2, 80], [3, 50], [4, 60], [6, 30], [8, 45]]),
  volume: 14,
  volumeEnvelope: [12, 14, 14],
  volumeLoop: 2,
};

/** Harpsichord: bright wiry pluck with a fast, thin decay. */
export const SCC_PRESET_HARPSICHORD: SCCInstrument = {
  id: 4,
  name: 'Clavecín',
  waveform: harmonics([[1, 100], [2, 70], [3, 60], [4, 45], [5, 30], [6, 20]]),
  volume: 15,
  volumeEnvelope: [15, 12, 9, 7, 5, 4, 3, 2, 2, 1, 1],
  volumeLoop: 0xff,
};

// ---------------------------------------------------------------------------
// Leads (chip clásico)
// ---------------------------------------------------------------------------

/** Square lead: the classic hollow chip voice, full sustain. */
export const SCC_PRESET_SQUARE: SCCInstrument = {
  id: 5,
  name: 'Cuadrada',
  waveform: pulse(0.5),
  volume: 13,
  volumeEnvelope: [13, 13],
  volumeLoop: 1,
};

/** 25% pulse lead: thinner and brighter than the square. */
export const SCC_PRESET_PULSE25: SCCInstrument = {
  id: 6,
  name: 'Pulso 25%',
  waveform: pulse(0.25),
  volume: 13,
  volumeEnvelope: [13, 13],
  volumeLoop: 1,
};

/** Saw lead: buzzy and full, the trusty melody workhorse. */
export const SCC_PRESET_SAW: SCCInstrument = {
  id: 7,
  name: 'Sierra',
  waveform: sawtooth(),
  volume: 13,
  volumeEnvelope: [13, 13],
  volumeLoop: 1,
};

/** Soft lead: triangle with a slow singing vibrato for calm melodies. */
export const SCC_PRESET_SOFTLEAD: SCCInstrument = {
  id: 8,
  name: 'Lead Suave',
  waveform: triangle(),
  volume: 14,
  volumeEnvelope: [12, 14, 14],
  volumeLoop: 2,
  vibratoDepth: 1,
  vibratoSpeed: 18,
  vibratoDelay: 20,
};

// ---------------------------------------------------------------------------
// Viento
// ---------------------------------------------------------------------------

/**
 * Flute: near-sine with a whisper of 3rd harmonic, soft attack and full
 * sustain (envelope loops on the last step), plus the classic delayed
 * vibrato that makes held notes sing.
 */
export const SCC_PRESET_FLUTE: SCCInstrument = {
  id: 9,
  name: 'Flauta',
  waveform: harmonics([[1, 120], [2, 10], [3, 16]]),
  volume: 14,
  volumeEnvelope: [8, 11, 13, 14, 14],
  volumeLoop: 4, // sustain at full level
  vibratoDepth: 2,
  vibratoSpeed: 14,
  vibratoDelay: 25,
};

/** Clarinet: hollow odd-harmonic tube, gentle attack. */
export const SCC_PRESET_CLARINET: SCCInstrument = {
  id: 10,
  name: 'Clarinete',
  waveform: harmonics([[1, 127], [3, 50], [5, 22], [7, 10]]),
  volume: 14,
  volumeEnvelope: [7, 11, 13, 13],
  volumeLoop: 3,
  vibratoDepth: 1,
  vibratoSpeed: 12,
  vibratoDelay: 30,
};

/** Oboe: nasal reed, the 2nd harmonic dominates the fundamental. */
export const SCC_PRESET_OBOE: SCCInstrument = {
  id: 11,
  name: 'Oboe',
  waveform: harmonics([[1, 80], [2, 105], [3, 45], [4, 30], [5, 18]]),
  volume: 14,
  volumeEnvelope: [9, 12, 13, 13],
  volumeLoop: 3,
};

/** Brass: bright saw-like stack with the slow bloom of a horn section. */
export const SCC_PRESET_BRASS: SCCInstrument = {
  id: 12,
  name: 'Metal',
  waveform: harmonics([[1, 127], [2, 60], [3, 45], [4, 35], [5, 28], [6, 22], [7, 18]]),
  volume: 15,
  volumeEnvelope: [6, 9, 12, 14, 14],
  volumeLoop: 4,
  vibratoDepth: 1,
  vibratoSpeed: 10,
  vibratoDelay: 28,
};

// ---------------------------------------------------------------------------
// Cuerdas / Pads
// ---------------------------------------------------------------------------

/** Strings: soft-saw ensemble, slow swell + wide delayed vibrato. */
export const SCC_PRESET_STRINGS: SCCInstrument = {
  id: 13,
  name: 'Cuerdas',
  waveform: harmonics([[1, 120], [2, 55], [3, 40], [4, 30], [5, 22], [6, 16]]),
  volume: 14,
  volumeEnvelope: [4, 7, 10, 12, 13, 13],
  volumeLoop: 5,
  vibratoDepth: 2,
  vibratoSpeed: 12,
  vibratoDelay: 20,
};

/** Violin: brighter and faster than the ensemble, expressive vibrato. */
export const SCC_PRESET_VIOLIN: SCCInstrument = {
  id: 14,
  name: 'Violín',
  waveform: harmonics([[1, 110], [2, 65], [3, 50], [4, 38], [5, 28], [6, 20], [7, 14]]),
  volume: 14,
  volumeEnvelope: [6, 10, 13, 13],
  volumeLoop: 3,
  vibratoDepth: 3,
  vibratoSpeed: 16,
  vibratoDelay: 15,
};

/** Choir pad: pure sine blooming into a soft saw via the morph engine. */
export const SCC_PRESET_CHOIR: SCCInstrument = {
  id: 15,
  name: 'Coro',
  waveform: harmonics([[1, 127], [2, 8]]),
  volume: 14,
  volumeEnvelope: [3, 6, 9, 11, 12, 12],
  volumeLoop: 5,
  vibratoDepth: 1,
  vibratoSpeed: 8,
  vibratoDelay: 40,
  morphToWaveform: harmonics([[1, 127], [2, 50], [3, 30], [4, 20]]),
  morphSpeed: 6,
};

// ---------------------------------------------------------------------------
// Bajos
// ---------------------------------------------------------------------------

/** Bass: deep triangle-ish fundamental with a touch of 2nd harmonic. */
export const SCC_PRESET_BASS: SCCInstrument = {
  id: 16,
  name: 'Bajo',
  waveform: harmonics([[1, 127], [2, 30], [3, 12]]),
  volume: 15,
  volumeEnvelope: [15, 15, 14, 13, 12, 11, 10, 10],
  volumeLoop: 0xff,
};

/** Sub bass: almost pure sine, steady sustain — the low-end foundation. */
export const SCC_PRESET_SUBBASS: SCCInstrument = {
  id: 17,
  name: 'Bajo Sub',
  waveform: harmonics([[1, 127], [2, 10]]),
  volume: 15,
  volumeEnvelope: [15, 15, 14, 14, 13, 13],
  volumeLoop: 0xff,
};

/** Acid bass: raw saw with a snappy bite settling into a mid sustain. */
export const SCC_PRESET_ACIDBASS: SCCInstrument = {
  id: 18,
  name: 'Bajo Ácido',
  waveform: sawtooth(),
  volume: 15,
  volumeEnvelope: [15, 12, 10, 9, 9],
  volumeLoop: 4,
};

/** Pulse bass: thin 25% pulse — punchy, leaves room for the melody. */
export const SCC_PRESET_PULSEBASS: SCCInstrument = {
  id: 19,
  name: 'Bajo Pulso',
  waveform: pulse(0.25),
  volume: 15,
  volumeEnvelope: [15, 13, 11, 10, 10],
  volumeLoop: 4,
};

// ---------------------------------------------------------------------------
// Campanas / Percusión melódica
// ---------------------------------------------------------------------------

/** Bell: stretched partials (1,4,7,10) ring with a long metallic decay. */
export const SCC_PRESET_BELL: SCCInstrument = {
  id: 20,
  name: 'Campana',
  waveform: harmonics([[1, 90], [4, 75], [7, 50], [10, 32]]),
  volume: 15,
  volumeEnvelope: [15, 13, 11, 10, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1],
  volumeLoop: 0xff,
};

/** Vibraphone: sine + 4th partial with the motor tremolo as vibrato. */
export const SCC_PRESET_VIBRAPHONE: SCCInstrument = {
  id: 21,
  name: 'Vibráfono',
  waveform: harmonics([[1, 127], [4, 25]]),
  volume: 14,
  volumeEnvelope: [14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1],
  volumeLoop: 0xff,
  vibratoDepth: 2,
  vibratoSpeed: 10,
  vibratoDelay: 8,
};

/** Marimba: woody thunk, gone in a blink. */
export const SCC_PRESET_MARIMBA: SCCInstrument = {
  id: 22,
  name: 'Marimba',
  waveform: harmonics([[1, 127], [4, 55]]),
  volume: 15,
  volumeEnvelope: [15, 11, 7, 4, 2, 1, 0],
  volumeLoop: 0xff,
};

/** Music box: delicate high pluck, tuned for the upper octaves. */
export const SCC_PRESET_MUSICBOX: SCCInstrument = {
  id: 23,
  name: 'Caja de Música',
  waveform: harmonics([[1, 120], [4, 45], [8, 25]]),
  volume: 13,
  volumeEnvelope: [14, 12, 10, 8, 6, 5, 4, 3, 2, 2, 1, 1],
  volumeLoop: 0xff,
};

// ---------------------------------------------------------------------------
// Percusión (noiseMode: la nota elige el color del ruido)
// ---------------------------------------------------------------------------

/** Kick drum: dark noise thump — play it on a LOW note (C2 area). */
export const SCC_PRESET_KICK: SCCInstrument = {
  id: 24,
  name: 'Bombo',
  waveform: harmonics([[1, 127]]), // placeholder timbre; noiseMode rewrites it
  volume: 15,
  volumeEnvelope: [15, 12, 7, 3, 1, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

/** Tom: rounder noise hit between kick and snare — play around C3/C4. */
export const SCC_PRESET_TOM: SCCInstrument = {
  id: 25,
  name: 'Tom',
  waveform: harmonics([[1, 127]]),
  volume: 15,
  volumeEnvelope: [15, 10, 6, 3, 1, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

/** Snare: mid noise burst — play around C5. */
export const SCC_PRESET_SNARE: SCCInstrument = {
  id: 26,
  name: 'Caja',
  waveform: harmonics([[1, 127]]),
  volume: 14,
  volumeEnvelope: [14, 11, 7, 4, 2, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

/** Closed hi-hat: short bright tick — play on a HIGH note (B6 area). */
export const SCC_PRESET_HIHAT: SCCInstrument = {
  id: 27,
  name: 'Hi-Hat',
  waveform: harmonics([[1, 127]]),
  volume: 11,
  volumeEnvelope: [10, 5, 2, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

/** Cymbal: long bright noise wash — play on a HIGH note. */
export const SCC_PRESET_CYMBAL: SCCInstrument = {
  id: 28,
  name: 'Platillo',
  waveform: harmonics([[1, 127]]),
  volume: 13,
  volumeEnvelope: [13, 11, 9, 8, 6, 5, 4, 3, 2, 2, 1, 1, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

export interface SccInstrumentPresetGroup {
  name: string;
  presets: SCCInstrument[];
}

export const SCC_INSTRUMENT_PRESET_GROUPS: SccInstrumentPresetGroup[] = [
  { name: 'Teclas', presets: [SCC_PRESET_PIANO, SCC_PRESET_EPIANO, SCC_PRESET_ORGAN, SCC_PRESET_HARPSICHORD] },
  { name: 'Leads', presets: [SCC_PRESET_SQUARE, SCC_PRESET_PULSE25, SCC_PRESET_SAW, SCC_PRESET_SOFTLEAD] },
  { name: 'Viento', presets: [SCC_PRESET_FLUTE, SCC_PRESET_CLARINET, SCC_PRESET_OBOE, SCC_PRESET_BRASS] },
  { name: 'Cuerdas', presets: [SCC_PRESET_STRINGS, SCC_PRESET_VIOLIN, SCC_PRESET_CHOIR] },
  { name: 'Bajos', presets: [SCC_PRESET_BASS, SCC_PRESET_SUBBASS, SCC_PRESET_ACIDBASS, SCC_PRESET_PULSEBASS] },
  { name: 'Campanas', presets: [SCC_PRESET_BELL, SCC_PRESET_VIBRAPHONE, SCC_PRESET_MARIMBA, SCC_PRESET_MUSICBOX] },
  { name: 'Percusión', presets: [SCC_PRESET_KICK, SCC_PRESET_TOM, SCC_PRESET_SNARE, SCC_PRESET_HIHAT, SCC_PRESET_CYMBAL] },
];

/** Flat list (kept for existing imports and fixture scripts). */
export const SCC_INSTRUMENT_PRESETS: SCCInstrument[] =
  SCC_INSTRUMENT_PRESET_GROUPS.flatMap((group) => group.presets);
