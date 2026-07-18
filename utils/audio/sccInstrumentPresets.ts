/**
 * @fileoverview Curated SCC instrument presets (Fase 5).
 *
 * Ready-to-use instruments so composers do not have to hand-draw waveforms
 * every time. Waveforms are additive-synthesis blends (32 signed samples,
 * -128..127) tuned against the K051649 volume curve; envelopes use the
 * native 0-15 volume range; drums use the Fase 4 noiseMode (the driver
 * rewrites the waveform with pseudo-random bytes every frame, so the note
 * period sets the noise colour: low = rumble, high = hiss).
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

/**
 * Flute: near-sine with a whisper of 3rd harmonic, soft attack and full
 * sustain (envelope loops on the last step), plus the classic delayed
 * vibrato that makes held notes sing.
 */
export const SCC_PRESET_FLUTE: SCCInstrument = {
  id: 2,
  name: 'Flauta',
  waveform: harmonics([[1, 120], [2, 10], [3, 16]]),
  volume: 14,
  volumeEnvelope: [8, 11, 13, 14, 14],
  volumeLoop: 4, // sustain at full level
  vibratoDepth: 2,
  vibratoSpeed: 14,
  vibratoDelay: 25,
};

/** Bass: deep triangle-ish fundamental with a touch of 2nd harmonic. */
export const SCC_PRESET_BASS: SCCInstrument = {
  id: 3,
  name: 'Bajo',
  waveform: harmonics([[1, 127], [2, 30], [3, 12]]),
  volume: 15,
  volumeEnvelope: [15, 15, 14, 13, 12, 11, 10, 10],
  volumeLoop: 0xff,
};

/** Kick drum: dark noise thump — play it on a LOW note (C2 area). */
export const SCC_PRESET_KICK: SCCInstrument = {
  id: 4,
  name: 'Bombo',
  waveform: harmonics([[1, 127]]), // placeholder timbre; noiseMode rewrites it
  volume: 15,
  volumeEnvelope: [15, 12, 7, 3, 1, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

/** Snare: mid noise burst — play around C5. */
export const SCC_PRESET_SNARE: SCCInstrument = {
  id: 5,
  name: 'Caja',
  waveform: harmonics([[1, 127]]),
  volume: 14,
  volumeEnvelope: [14, 11, 7, 4, 2, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

/** Closed hi-hat: short bright tick — play on a HIGH note (B6 area). */
export const SCC_PRESET_HIHAT: SCCInstrument = {
  id: 6,
  name: 'Hi-Hat',
  waveform: harmonics([[1, 127]]),
  volume: 11,
  volumeEnvelope: [10, 5, 2, 0],
  volumeLoop: 0xff,
  noiseMode: true,
};

export const SCC_INSTRUMENT_PRESETS: SCCInstrument[] = [
  SCC_PRESET_PIANO,
  SCC_PRESET_FLUTE,
  SCC_PRESET_BASS,
  SCC_PRESET_KICK,
  SCC_PRESET_SNARE,
  SCC_PRESET_HIHAT,
];
