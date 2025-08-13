
// components/utils/noteFrequencies.ts

// Standard Western chromatic scale note frequencies (A4 = 440 Hz)
export const NOTE_FREQUENCIES: { [note: string]: number } = {
  'C-0': 16.35,  'C#0': 17.32,  'D-0': 18.35,  'D#0': 19.45,  'E-0': 20.60,  'F-0': 21.83,  'F#0': 23.12,  'G-0': 24.50,  'G#0': 25.96,  'A-0': 27.50,  'A#0': 29.14,  'B-0': 30.87,
  'C-1': 32.70,  'C#1': 34.65,  'D-1': 36.71,  'D#1': 38.89,  'E-1': 41.20,  'F-1': 43.65,  'F#1': 46.25,  'G-1': 49.00,  'G#1': 51.91,  'A-1': 55.00,  'A#1': 58.27,  'B-1': 61.74,
  'C-2': 65.41,  'C#2': 69.30,  'D-2': 73.42,  'D#2': 77.78,  'E-2': 82.41,  'F-2': 87.31,  'F#2': 92.50,  'G-2': 98.00,  'G#2': 103.83, 'A-2': 110.00, 'A#2': 116.54, 'B-2': 123.47,
  'C-3': 130.81, 'C#3': 138.59, 'D-3': 146.83, 'D#3': 155.56, 'E-3': 164.81, 'F-3': 174.61, 'F#3': 185.00, 'G-3': 196.00, 'G#3': 207.65, 'A-3': 220.00, 'A#3': 233.08, 'B-3': 246.94,
  'C-4': 261.63, 'C#4': 277.18, 'D-4': 293.66, 'D#4': 311.13, 'E-4': 329.63, 'F-4': 349.23, 'F#4': 369.99, 'G-4': 392.00, 'G#4': 415.30, 'A-4': 440.00, 'A#4': 466.16, 'B-4': 493.88,
  'C-5': 523.25, 'C#5': 554.37, 'D-5': 587.33, 'D#5': 622.25, 'E-5': 659.25, 'F-5': 698.46, 'F#5': 739.99, 'G-5': 783.99, 'G#5': 830.61, 'A-5': 880.00, 'A#5': 932.33, 'B-5': 987.77,
  'C-6': 1046.50,'C#6': 1108.73,'D-6': 1174.66,'D#6': 1244.51,'E-6': 1318.51,'F-6': 1396.91,'F#6': 1479.98,'G-6': 1567.98,'G#6': 1661.22,'A-6': 1760.00,'A#6': 1864.66,'B-6': 1975.53,
  'C-7': 2093.00,'C#7': 2217.46,'D-7': 2349.32,'D#7': 2489.02,'E-7': 2637.02,'F-7': 2793.83,'F#7': 2959.96,'G-7': 3135.96,'G#7': 3322.44,'A-7': 3520.00,'A#7': 3729.31,'B-7': 3951.07,
  'C-8': 4186.01,'C#8': 4434.92,'D-8': 4698.63,'D#8': 4978.03,'E-8': 5274.04,'F-8': 5587.65,'F#8': 5919.91,'G-8': 6271.93,'G#8': 6644.88,'A-8': 7040.00,'A#8': 7458.62,'B-8': 7902.13,
};

/**
 * Parses a tracker note string (e.g., "C-4", "A#5") and returns its frequency.
 * @param noteString The note string to parse.
 * @returns The frequency in Hertz, or null if the note string is invalid.
 */
export function getFrequencyForNoteString(noteString: string | null): number | null {
  if (noteString === null || noteString === "---" || noteString === "===") {
    return null;
  }

  // Regex to capture note name (C, C#, D, D#, E, F, F#, G, G#, A, A#, B),
  // an optional '-' separator (common in trackers), and the octave number (0-8).
  // It's case-insensitive.
  const match = noteString.toUpperCase().match(/^([A-G](?:#|B)?)(-?)([0-8])$/);

  if (!match) {
    // Try to match notes without octave, assume octave 4
    const basicNoteMatch = noteString.toUpperCase().match(/^([A-G](?:#|B)?)$/);
    if(basicNoteMatch) {
      const noteNamePart = basicNoteMatch[1].endsWith('B') ? basicNoteMatch[1].replace('B', '-') : basicNoteMatch[1];
      const fullNoteKey = `${noteNamePart}4`; // Assume octave 4
      return NOTE_FREQUENCIES[fullNoteKey] || null;
    }
    return null;
  }

  let noteNamePart = match[1]; // e.g., "C", "C#", "DB"
  const octave = parseInt(match[3], 10);

  // Standardize note names: "Db" -> "C#", "Eb" -> "D#", etc.
  // PT3 typically uses sharps or "-", e.g. "C-", "C#". We'll match based on common tracker input format.
  // Our NOTE_FREQUENCIES uses "C-", "C#".
  if (noteNamePart.endsWith('B') && noteNamePart.length === 2) { // e.g. DB, EB, GB, AB, BB
      const charCode = noteNamePart.charCodeAt(0);
      if (noteNamePart === "CB") noteNamePart = "B-"; // Cb is B
      else if (noteNamePart === "FB") noteNamePart = "E-"; // Fb is E
      else { // Db -> C#, Eb -> D#, Gb -> F#, Ab -> G#, Bb -> A#
        const prevCharCode = charCode === 65 ? 71 : charCode -1; // A becomes G, others C becomes B etc.
        noteNamePart = String.fromCharCode(prevCharCode) + "#";
      }
  } else if (noteNamePart.length === 1 && match[2] === '-') { // "C-4" style
    noteNamePart += "-";
  } else if (noteNamePart.length === 1 && match[2] !== '-' && !noteNamePart.includes('#')) { // "C4" implies "C-4"
    noteNamePart += "-";
  }
  // if it's "C#4" noteNamePart will be "C#" which is fine.

  const fullNoteKey = `${noteNamePart}${octave}`; // e.g., "C-4", "C#4", "A#5"
  
  return NOTE_FREQUENCIES[fullNoteKey] || null;
}
