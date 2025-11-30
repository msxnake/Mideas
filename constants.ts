import { MSXColor, MSX1Color, MSX1ColorValue, Screen5PaletteSlot, TileBank, TileBankDefinition, PianoKeyLayoutEntry, HelpDocSection, Snippet, EFFECT_ZONE_FLAGS as EFFECT_ZONE_FLAGS_TYPE, MainMenuConfig } from './types';

/** The current version of the application. */
export const APP_VERSION = "0.266";

/**
 * The 16-color palette for MSX SCREEN 5.
 * Used for sprite colors and general UI.
 */
export const MSX_SCREEN5_PALETTE: MSXColor[] = [
  { name: 'Transparent', hex: 'rgba(0,0,0,0)' },
  { name: 'Black', hex: '#000000' },
  { name: 'Medium Green', hex: '#3EB847' },
  { name: 'Light Green', hex: '#74D07D' },
  { name: 'Dark Blue', hex: '#2F2FC1' },
  { name: 'Light Blue', hex: '#5858FC' },
  { name: 'Dark Red', hex: '#B63125' },
  { name: 'Cyan', hex: '#68D2DA' },
  { name: 'Medium Red', hex: '#FC584A' },
  { name: 'Light Red', hex: '#FF8E81' },
  { name: 'Dark Yellow', hex: '#C0BF3B' },
  { name: 'Light Yellow', hex: '#E7E474' },
  { name: 'Dark Green', hex: '#309337' },
  { name: 'Magenta', hex: '#B640C8' },
  { name: 'Gray', hex: '#999999' },
  { name: 'White', hex: '#FFFFFF' },
];

/**
 * The 16-color palette for MSX1 (SCREEN 2).
 * Each color has an associated index from 0 to 15.
 */
export const MSX1_PALETTE: MSX1Color[] = [
  { name: 'Transparent (Backdrop)', hex: 'rgba(0,0,0,0)', index: 0 },
  { name: 'Black', hex: '#000000', index: 1 },
  { name: 'Medium Green', hex: '#21C842', index: 2 },
  { name: 'Light Green', hex: '#5EDC78', index: 3 },
  { name: 'Dark Blue', hex: '#5455ED', index: 4 },
  { name: 'Light Blue', hex: '#7D76FC', index: 5 },
  { name: 'Dark Red', hex: '#D4524D', index: 6 },
  { name: 'Cyan', hex: '#42EBF5', index: 7 },
  { name: 'Medium Red', hex: '#FC5554', index: 8 },
  { name: 'Light Red', hex: '#FF7978', index: 9 },
  { name: 'Dark Yellow', hex: '#D4C154', index: 10 }, // Matched user description
  { name: 'Light Yellow', hex: '#E6CE80', index: 11 },
  { name: 'Dark Green', hex: '#21B03B', index: 12 },
  { name: 'Magenta', hex: '#C95BBA', index: 13 },
  { name: 'Gray', hex: '#CCCCCC', index: 14 },
  { name: 'White', hex: '#FFFFFF', index: 15 },
];

/** Intensity levels available for each RGB component on MSX2 SCREEN 5. */
export const MSX2_COLOR_LEVELS = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF] as const;

export interface Screen5MasterColor {
  index: number;
  hex: string;
  rLevel: number;
  gLevel: number;
  bLevel: number;
}

const toHex = (value: number) => value.toString(16).padStart(2, '0').toUpperCase();

/** Complete 512-color master palette for SCREEN 5 (MSX2). */
export const MSX_SCREEN5_MASTER_PALETTE: Screen5MasterColor[] = (() => {
  const palette: Screen5MasterColor[] = [];
  for (let r = 0; r < MSX2_COLOR_LEVELS.length; r++) {
    for (let g = 0; g < MSX2_COLOR_LEVELS.length; g++) {
      for (let b = 0; b < MSX2_COLOR_LEVELS.length; b++) {
        const index = (r << 6) | (g << 3) | b;
        palette.push({
          index,
          hex: `#${toHex(MSX2_COLOR_LEVELS[r])}${toHex(MSX2_COLOR_LEVELS[g])}${toHex(MSX2_COLOR_LEVELS[b])}`,
          rLevel: r,
          gLevel: g,
          bLevel: b,
        });
      }
    }
  }
  return palette;
})();

const findClosestLevelIndex = (channelValue: number): number => {
  let closestIndex = 0;
  let closestDiff = Infinity;
  MSX2_COLOR_LEVELS.forEach((level, levelIndex) => {
    const diff = Math.abs(level - channelValue);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = levelIndex;
    }
  });
  return closestIndex;
};

const normalizeHexColor = (hex: string): string => {
  if (!hex || !hex.startsWith('#') || (hex.length !== 7)) {
    return '#000000';
  }
  return hex.toUpperCase();
};

/**
 * Snaps an arbitrary RGB hex color to the closest entry in the SCREEN 5 master palette.
 * Returns both the snapped color and the hardware palette index (0-511).
 */
export const snapHexToScreen5MasterColor = (hex: string): { hex: string; masterIndex: number } => {
  const normalized = normalizeHexColor(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  const rIdx = findClosestLevelIndex(r);
  const gIdx = findClosestLevelIndex(g);
  const bIdx = findClosestLevelIndex(b);

  const snappedHex = `#${toHex(MSX2_COLOR_LEVELS[rIdx])}${toHex(MSX2_COLOR_LEVELS[gIdx])}${toHex(MSX2_COLOR_LEVELS[bIdx])}`;
  const masterIndex = (rIdx << 6) | (gIdx << 3) | bIdx;
  return { hex: snappedHex, masterIndex };
};

/** Default 16-color configuration (slot 0 kept as transparent) for SCREEN 5 tiles. */
export const DEFAULT_SCREEN5_CUSTOM_PALETTE: Screen5PaletteSlot[] = MSX_SCREEN5_PALETTE.map((color, idx) => {
  if (idx === 0) {
    return { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' };
  }
  const snapped = snapHexToScreen5MasterColor(color.hex);
  return { slotIndex: idx, masterIndex: snapped.masterIndex, hex: snapped.hex };
});


/** An array of allowed tile dimensions (width/height) in the tile editor. */
export const EDITABLE_TILE_DIMENSIONS: number[] = [8, 16, 24, 32];
/** The default width of a new tile. */
export const DEFAULT_TILE_WIDTH = 16;
/** The default height of a new tile. */
export const DEFAULT_TILE_HEIGHT = 16;

/** The default size (width and height) of a new sprite. */
export const DEFAULT_SPRITE_SIZE = 16;
/** The default width of a new screen map, in tiles. */
export const DEFAULT_SCREEN_WIDTH_TILES = 32;
/** The default height of a new screen map, in tiles. */
export const DEFAULT_SCREEN_HEIGHT_TILES = 24;
/** The base dimension (8x8) of a character block in SCREEN 2 mode. */
export const EDITOR_BASE_TILE_DIM_S2 = 8;
/** The character code used to represent an empty tile cell in exported data. */
export const EMPTY_CELL_CHAR_CODE = 255;

/** A list of available MSX screen modes. */
export const SCREEN_MODES = ["SCREEN 0 (Text 40)", "SCREEN 1 (Text 32)", "SCREEN 2 (Graphics I)", "SCREEN 3 (Multicolor)", "SCREEN 4 (Graphics II)", "SCREEN 5 (Graphics III)", "SCREEN 6 (Graphics IV)", "SCREEN 7 (Graphics V)", "SCREEN 8 (Graphics VI)"];
/** The default screen mode for a new project. */
export const DEFAULT_SCREEN_MODE = "SCREEN 2 (Graphics I)";

/** A list of Z80 assembly mnemonics for syntax highlighting. */
export const Z80_MNEMONICS = [
  "ADC", "ADD", "AND", "BIT", "CALL", "CCF", "CP", "CPD", "CPDR", "CPI", "CPIR",
  "CPL", "DAA", "DEC", "DI", "DJNZ", "EI", "EX", "EXX", "HALT", "IM", "IN", "INC",
  "IND", "INDR", "INI", "INIR", "JP", "JR", "LD", "LDD", "LDDR", "LDI", "LDIR",
  "NEG", "NOP", "OR", "OTDR", "OTIR", "OUT", "OUTD", "OUTI", "POP", "PUSH", "RES",
  "RET", "RETI", "RETN", "RL", "RLA", "RLC", "RLCA", "RLD", "RR", "RRA", "RRC",
  "RRCA", "RRD", "RST", "SBC", "SCF", "SET", "SLA", "SLL", "SRA", "SRL", "SUB", "XOR"
];
/** A list of Z80 registers for syntax highlighting. */
export const Z80_REGISTERS = [
  "A", "F", "B", "C", "D", "E", "H", "L", "AF", "BC", "DE", "HL",
  "IXH", "IXL", "IYH", "IYL", "IX", "IY", "SP", "PC", "I", "R", "AF'"
];
/** A list of Z80 condition codes for syntax highlighting. */
export const Z80_CONDITIONS = [
  "NZ", "Z", "NC", "C", "PO", "PE", "P", "M"
];
/** A list of Z80 assembler directives for syntax highlighting. */
export const Z80_DIRECTIVES = [
  ".ORG", "ORG", "END", ".END", // Added variations for directives
  ".EQU", "EQU",
  ".DB", "DB", ".BYTE", "BYTE", "DEFB",
  ".DW", "DW", ".WORD", "WORD", "DEFW",
  ".DS", "DS", ".BLOCK", "BLOCK", "DEFS",
  ".DEFINE", "DEFINE",
  ".MACRO", "MACRO", ".ENDM", "ENDM",
  ".IF", "IF", ".ENDIF", "ENDIF", ".ELSE", "ELSE",
  ".INCLUDE", "INCLUDE",
  ".DEFM", "DEFM",
  ".ZILOG", // Added asMSX specific directive
  ".PHASE", ".REPT", ".ENDR", ".SEARCH", ".RANDOM", // Added more asMSX directives
  ".ROM", ".MEGAROM", ".BASIC", ".CAS", ".WAV", ".MSXDOS" // Added asMSX output directives
];

/** Default general-purpose Z80 snippets. This is populated dynamically. */
export const Z80_SNIPPETS: Snippet[] = [
  {
    id: "pac_man_collection",
    name: "Pac-Man Tile Collection",
    code: `; Pac-Man Style Tile Collection System for MSX
; Optimized for MSX hardware limitations
; Uses: DE = Player position, HL = Screen map address

COLLECT_TILES:
    ; Input: DE = Player X,Y position (D=X, E=Y)
    ; Input: HL = Screen map base address
    ; Output: A = Number of items collected
    ; Destroys: BC, DE, HL
    
    push bc
    push de
    push hl
    
    ld a, 0                    ; Initialize collection counter
    ld (COLLECTION_COUNT), a
    
    ; Convert pixel position to tile coordinates
    ld a, d                    ; Player X
    srl a                      ; Divide by 2
    srl a                      ; Divide by 4
    srl a                      ; Divide by 8 (assuming 8x8 tiles)
    ld d, a                    ; D = Tile X
    
    ld a, e                    ; Player Y  
    srl a                      ; Divide by 2
    srl a                      ; Divide by 4
    srl a                      ; Divide by 8
    ld e, a                    ; E = Tile Y
    
    ; Calculate tile address: HL + (Y * MAP_WIDTH) + X
    ld a, e                    ; Y coordinate
    ld b, 0
    ld c, 32                   ; MAP_WIDTH (assuming 32 tiles wide)
    call MULTIPLY_AC           ; A = Y * MAP_WIDTH
    
    add a, d                   ; A = (Y * MAP_WIDTH) + X
    ld c, a
    ld b, 0
    add hl, bc                 ; HL points to tile at player position
    
    ; Check if current tile is collectible
    ld a, (hl)                 ; Load tile ID
    cp DOT_TILE_ID             ; Compare with dot tile
    jr z, COLLECT_DOT
    cp POWERUP_TILE_ID         ; Compare with power-up tile
    jr z, COLLECT_POWERUP
    cp FRUIT_TILE_ID           ; Compare with fruit tile
    jr z, COLLECT_FRUIT
    jr END_COLLECTION          ; Nothing to collect
    
COLLECT_DOT:
    ld a, EMPTY_TILE_ID        ; Replace with empty tile
    ld (hl), a
    ld a, (SCORE)              ; Load current score
    add a, 10                  ; Add 10 points for dot
    ld (SCORE), a
    ld a, (DOT_COUNT)          ; Increment dot counter
    inc a
    ld (DOT_COUNT), a
    call PLAY_DOT_SOUND        ; Play collection sound
    jr INCREMENT_COLLECTION

COLLECT_POWERUP:
    ld a, EMPTY_TILE_ID
    ld (hl), a
    ld a, (SCORE)
    add a, 50                  ; Add 50 points for power-up
    ld (SCORE), a
    ld a, 1
    ld (POWER_MODE), a         ; Activate power mode
    call PLAY_POWERUP_SOUND
    jr INCREMENT_COLLECTION

COLLECT_FRUIT:
    ld a, EMPTY_TILE_ID
    ld (hl), a
    ld a, (SCORE)
    add a, 100                 ; Add 100 points for fruit
    ld (SCORE), a
    ld a, (FRUIT_COUNT)
    inc a
    ld (FRUIT_COUNT), a
    call PLAY_FRUIT_SOUND
    jr INCREMENT_COLLECTION

INCREMENT_COLLECTION:
    ld a, (COLLECTION_COUNT)
    inc a
    ld (COLLECTION_COUNT), a

END_COLLECTION:
    ld a, (COLLECTION_COUNT)   ; Return collection count in A
    
    pop hl
    pop de
    pop bc
    ret

; Helper routine: Multiply A * C, result in A
MULTIPLY_AC:
    ld b, 0
    ld h, b
    ld l, a
    ld d, h
    ld e, l
    add hl, hl                 ; HL = A * 2
    jr nc, MUL_NO_CARRY1
    inc de
MUL_NO_CARRY1:
    add hl, hl                 ; HL = A * 4
    jr nc, MUL_NO_CARRY2
    inc de
MUL_NO_CARRY2:
    add hl, hl                 ; HL = A * 8
    jr nc, MUL_NO_CARRY3
    inc de
MUL_NO_CARRY3:
    add hl, hl                 ; HL = A * 16
    jr nc, MUL_NO_CARRY4
    inc de
MUL_NO_CARRY4:
    add hl, hl                 ; HL = A * 32
    ld a, l
    ret

; Sound effect stubs (implement based on your sound system)
PLAY_DOT_SOUND:
    ; Play dot collection sound
    ret
    
PLAY_POWERUP_SOUND:
    ; Play power-up sound
    ret
    
PLAY_FRUIT_SOUND:
    ; Play fruit collection sound
    ret

; Data section
DOT_TILE_ID:        EQU 1      ; Tile ID for collectible dots
POWERUP_TILE_ID:    EQU 2      ; Tile ID for power-ups
FRUIT_TILE_ID:      EQU 3      ; Tile ID for bonus fruits
EMPTY_TILE_ID:      EQU 0      ; Tile ID for empty space

; Memory variables
COLLECTION_COUNT:   DB 0       ; Items collected this frame
SCORE:              DW 0       ; Player score
DOT_COUNT:          DB 0       ; Total dots collected
FRUIT_COUNT:        DB 0       ; Total fruits collected
POWER_MODE:         DB 0       ; Power-up mode active flag`
  }
];
/** Default behavior-specific Z80 snippets. This is populated dynamically. */
export const Z80_BEHAVIOR_SNIPPETS: Snippet[] = [];


/** The width of a color segment in SCREEN 2 mode, in pixels. */
export const SCREEN2_PIXELS_PER_COLOR_SEGMENT = 8;
/** The default foreground color index for SCREEN 2. */
export const DEFAULT_SCREEN2_FG_COLOR_INDEX = 15; // White
/** The default background color index for SCREEN 2. */
export const DEFAULT_SCREEN2_BG_COLOR_INDEX = 1;  // Black
/** The default foreground color hex value for SCREEN 2. */
export const DEFAULT_SCREEN2_FG_COLOR = MSX1_PALETTE.find(c => c.index === DEFAULT_SCREEN2_FG_COLOR_INDEX)?.hex || MSX1_PALETTE[15].hex;
/** The default background color hex value for SCREEN 2. */
export const DEFAULT_SCREEN2_BG_COLOR = MSX1_PALETTE.find(c => c.index === DEFAULT_SCREEN2_BG_COLOR_INDEX)?.hex || MSX1_PALETTE[1].hex;

/** A Map from MSX1 color hex values to their MSX1Color object. */
export const MSX1_PALETTE_MAP: Map<MSX1ColorValue, MSX1Color> = new Map(MSX1_PALETTE.map(c => [c.hex, c]));
/** A Map from MSX1 color indices to their MSX1Color object. */
export const MSX1_PALETTE_IDX_MAP: Map<number, MSX1Color> = new Map(MSX1_PALETTE.map(c => [c.index, c]));
/** The default MSX1 color object (black). */
export const MSX1_DEFAULT_COLOR: MSX1Color = MSX1_PALETTE[1]; // Default to black if lookup fails

// --- PT3 Tracker Constants ---
/** The default number of rows for a new tracker pattern. */
export const DEFAULT_PT3_ROWS_PER_PATTERN = 32;
/** The default beats per minute for a new song. */
export const DEFAULT_PT3_BPM = 125;
/** The default speed (ticks per row) for a new song. */
export const DEFAULT_PT3_SPEED = 6;
/** The maximum number of patterns allowed in a song. */
export const PT3_MAX_PATTERNS = 100;
/** The maximum number of instruments allowed in a song. */
export const PT3_MAX_INSTRUMENTS = 31;
/** The maximum number of ornaments allowed in a song. */
export const PT3_MAX_ORNAMENTS = 15;
/** The PSG channel identifiers. */
export const PT3_CHANNELS = ['A', 'B', 'C'] as const;
/** The SCC channel identifiers. */
export const SCC_CHANNELS = ['1', '2', '3', '4', '5'] as const;

/** The names of notes in an octave for display. */
export const PT3_NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
/** A default vibrato table for instruments. */
export const PT3_DEFAULT_VIBRATO_TABLE: number[] = [
  0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7,
  7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0
];
/** The fixed length of an ornament's data array. */
export const PT3_ORNAMENT_LENGTH = 32;
/** The size in bytes of a single instrument's data block in the PT3 format. */
export const PT3_INSTRUMENT_DATA_SIZE = 68;

/**
 * Defines the mapping of keyboard keys to musical notes for the tracker's piano input.
 */
export const PT3_PIANO_KEY_LAYOUT: Record<string, PianoKeyLayoutEntry> = {
  // Octave 5 (Q to P, then [, ])
  'q': { noteNameIndex: 0, baseOctave: 5 }, 'w': { noteNameIndex: 1, baseOctave: 5 },
  'e': { noteNameIndex: 2, baseOctave: 5 }, 'r': { noteNameIndex: 3, baseOctave: 5 },
  't': { noteNameIndex: 4, baseOctave: 5 }, 'y': { noteNameIndex: 5, baseOctave: 5 },
  'u': { noteNameIndex: 6, baseOctave: 5 }, 'i': { noteNameIndex: 7, baseOctave: 5 },
  'o': { noteNameIndex: 8, baseOctave: 5 }, 'p': { noteNameIndex: 9, baseOctave: 5 },
  '[': { noteNameIndex: 10, baseOctave: 5 }, ']': { noteNameIndex: 11, baseOctave: 5 },

  // Octave 4 (A to Ñ/;, then ')
  'a': { noteNameIndex: 0, baseOctave: 4 }, 's': { noteNameIndex: 1, baseOctave: 4 },
  'd': { noteNameIndex: 2, baseOctave: 4 }, 'f': { noteNameIndex: 3, baseOctave: 4 },
  'g': { noteNameIndex: 4, baseOctave: 4 }, 'h': { noteNameIndex: 5, baseOctave: 4 },
  'j': { noteNameIndex: 6, baseOctave: 4 }, 'k': { noteNameIndex: 7, baseOctave: 4 },
  'l': { noteNameIndex: 8, baseOctave: 4 },
  'ñ': { noteNameIndex: 9, baseOctave: 4 }, // For Spanish keyboard
  ';': { noteNameIndex: 9, baseOctave: 4 }, // For US layout (A4). If 'ñ' is typed, 'ñ' mapping takes precedence if key event differs.
  "'": { noteNameIndex: 10, baseOctave: 4 }, // US layout (A#4)

  // Octave 3 (Z to .)
  'z': { noteNameIndex: 0, baseOctave: 3 }, 'x': { noteNameIndex: 1, baseOctave: 3 },
  'c': { noteNameIndex: 2, baseOctave: 3 }, 'v': { noteNameIndex: 3, baseOctave: 3 },
  'b': { noteNameIndex: 4, baseOctave: 3 }, 'n': { noteNameIndex: 5, baseOctave: 3 },
  'm': { noteNameIndex: 6, baseOctave: 3 },
  ',': { noteNameIndex: 7, baseOctave: 3 },
  '.': { noteNameIndex: 8, baseOctave: 3 },
  // Keys from earlier definitions that don't conflict with the above final block
  '2': { noteNameIndex: 1, baseOctave: 5 }, // C#5 (from num row)
  '3': { noteNameIndex: 3, baseOctave: 5 }, // D#5 (from num row)
  '5': { noteNameIndex: 6, baseOctave: 5 }, // F#5 (from num row)
  '6': { noteNameIndex: 8, baseOctave: 5 }, // G#5 (from num row)
  '7': { noteNameIndex: 10, baseOctave: 5 },// A#5 (from num row)
};


/** The minimum and maximum allowed octave offset for the tracker keyboard. */
export const PT3_KEYBOARD_OCTAVE_MIN_MAX = { min: -2, max: 2 };

/**
 * Default PSG instruments for new tracker songs.
 * Based on MSX1 Yamaha AY-3-8910 chip capabilities.
 * Each instrument includes volume/tone envelopes, loop positions, and AY envelope shapes.
 */
export const DEFAULT_PSG_INSTRUMENTS = [
  {
    id: 1,
    name: "Piano",
    volumeEnvelope: [15, 14, 13, 11, 9, 7, 5, 3, 2, 1, 0],
    toneEnvelope: [0],
    volumeLoop: 255, // No loop (one-shot)
    toneLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 0, // Decay
  },
  {
    id: 2,
    name: "Electric Bass",
    volumeEnvelope: [15, 14, 13, 12, 11, 10, 9, 8],
    toneEnvelope: [0],
    volumeLoop: 3, // Sustain at mid-level
    toneLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 12, // Sawtooth ascending
  },
  {
    id: 3,
    name: "Lead Vibrato",
    volumeEnvelope: [0, 5, 10, 15, 15, 15, 14, 13, 12],
    toneEnvelope: [0, 1, 2, 1, 0, -1, -2, -1], // Vibrato effect
    volumeLoop: 4, // Sustain at max volume
    toneLoop: 0, // Loop vibrato
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 13, // Attack-hold
  },
  {
    id: 4,
    name: "Strings Pad",
    volumeEnvelope: [0, 2, 4, 6, 8, 10, 12, 14, 15, 15, 15],
    toneEnvelope: [0, 0, 1, 1, 0, 0, -1, -1],
    volumeLoop: 8, // Sustain
    toneLoop: 0, // Soft modulation
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 13, // Attack-hold
  },
  {
    id: 5,
    name: "Kick Drum",
    volumeEnvelope: [15, 13, 10, 7, 4, 2, 0],
    toneEnvelope: [12, 10, 8, 6, 4, 2, 0], // Pitch sweep down
    volumeLoop: 255, // One-shot
    toneLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 0, // Decay
  },
  {
    id: 6,
    name: "Snare Drum",
    volumeEnvelope: [15, 12, 9, 6, 3, 1, 0],
    toneEnvelope: [0],
    volumeLoop: 255, // One-shot
    toneLoop: 255,
    ayToneEnabled: false,
    ayNoiseEnabled: true,
    ayEnvelopeShape: 0, // Decay
  },
  {
    id: 7,
    name: "Hi-Hat",
    volumeEnvelope: [12, 10, 8, 6, 4, 2, 0],
    toneEnvelope: [0],
    volumeLoop: 255, // One-shot
    toneLoop: 255,
    ayToneEnabled: false,
    ayNoiseEnabled: true,
    ayEnvelopeShape: 0, // Decay
  },
  {
    id: 8,
    name: "Arpeggio",
    volumeEnvelope: [15, 15, 14, 14, 13, 13, 12, 12],
    toneEnvelope: [0, 4, 7, 12, 7, 4, 0], // Major chord arpeggio
    volumeLoop: 0, // Loop entire envelope
    toneLoop: 0, // Loop arpeggio
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 10, // Triangle alternating
  },
  {
    id: 9,
    name: "Organ",
    volumeEnvelope: [15, 15, 15, 15, 15],
    toneEnvelope: [0],
    volumeLoop: 0, // Constant sustain
    toneLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 13, // Attack-hold
  },
  {
    id: 10,
    name: "Bell",
    volumeEnvelope: [15, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0],
    toneEnvelope: [0, 12, 0], // Harmonic
    volumeLoop: 255, // One-shot
    toneLoop: 255,
    ayToneEnabled: true,
    ayNoiseEnabled: false,
    ayEnvelopeShape: 0, // Decay
  },
];
// --- End PT3 Tracker Constants ---


// --- Tile Bank Constants ---
/**
 * The default configuration for tile banks in a new project.
 * Divides the screen into HUD, main game area, and status bar.
 * Character 0 is reserved for empty cells.
 * Bank 0 uses full range (0-255): Characters 0-127 for fonts/text, 128-255 for HUD tiles.
 * Banks 1-2 use range 128-255 for game tiles only.
 */
export const DEFAULT_TILE_BANK_DEFINITIONS: TileBankDefinition[] = [
  {
    id: 'bank_0',
    name: 'Bank 0 - HUD/Fonts',
    enabled: true,
    vramPatternStart: 0x0000,
    vramColorStart: 0x2000,
    screenZone: { x: 0, y: 0, width: DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
    charsetRangeStart: 0,    // Full range for fonts (0-127) and HUD tiles (128-255)
    charsetRangeEnd: 255,
    defaultFgColorIndex: 15,
    defaultBgColorIndex: 4,
    isLocked: false,
    assignedTiles: {},
  },
  {
    id: 'bank_1',
    name: 'Bank 1 - Game Tileset',
    enabled: true,
    vramPatternStart: 0x0800,
    vramColorStart: 0x2800,
    screenZone: { x: 0, y: 8, width: DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
    charsetRangeStart: 0,    // Full range for fonts (0-127) and Game tiles (128-255)
    charsetRangeEnd: 255,
    defaultFgColorIndex: 2,
    defaultBgColorIndex: 1,
    isLocked: false,
    assignedTiles: {},
  },
  {
    id: 'bank_2',
    name: 'Bank 2 - Background/Status',
    enabled: true,
    vramPatternStart: 0x1000,
    vramColorStart: 0x3000,
    screenZone: { x: 0, y: 16, width: DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
    charsetRangeStart: 0,    // Full range for fonts (0-127) and Background tiles (128-255)
    charsetRangeEnd: 255,
    defaultFgColorIndex: 11,
    defaultBgColorIndex: 6,
    isLocked: false,
    assignedTiles: {},
  },
];
// --- End Tile Bank Constants ---

// --- Main Menu Constants ---
/** The default configuration for the main menu editor. */
export const DEFAULT_MAIN_MENU_CONFIG: MainMenuConfig = {
  isEnabled: true,
  options: [
    { id: "start", label: "INICIAR PARTIDA", enabled: true },
    { id: "continue", label: "CONTINUAR", enabled: true },
    { id: "settings", label: "AJUSTES", enabled: true },
    { id: "help", label: "AYUDA", enabled: false },
  ],
  keyMapping: {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    fire1: " ", // Space
    fire2: "m",
  },
  settings: {
    volume: 12,
  },
  continueScreen: {
    title: "CONTINUAR PARTIDA",
    prompt: "INTRODUCE TU CODIGO",
  },
  introScreen: {
    text: "EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...\n\nSOLO UN HEROE PUEDE DETENERLOS.",
    backgroundAssetId: null,
  },
  menuScreenAssetId: null,
  cursorSpriteAssetId: null,
  menuColors: {
    text: MSX1_PALETTE[15].hex, // White
    background: MSX1_PALETTE[4].hex, // Dark Blue
    highlightText: MSX1_PALETTE[11].hex, // Light Yellow
    highlightBackground: MSX1_PALETTE[5].hex, // Light Blue
    border: MSX1_PALETTE[15].hex, // White
  },
};
// --- End Main Menu Constants ---

// --- Effect Zone Constants ---
/** Re-export of EFFECT_ZONE_FLAGS from `types.ts` for convenient access. */
export const EFFECT_ZONE_FLAGS = EFFECT_ZONE_FLAGS_TYPE;
// --- End Effect Zone Constants ---


// --- Help & Documentation Constants ---
/** System asset ID for the Help & Docs viewer. */
export const HELP_DOCS_SYSTEM_ASSET_ID = "HELP_DOCS_SYSTEM_ASSET";

/** The default content for the Help & Documentation viewer. */
export const DEFAULT_HELP_DOCS_DATA: HelpDocSection[] = [
  {
    id: "getting_started",
    title: "Getting Started",
    articles: [
      {
        id: "welcome",
        title: "Welcome to MSX Retro IDE",
        content: `
          <h2>Welcome!</h2>
          <p>This IDE is designed to help you create games for the MSX (MSX1/MSX2) platform.</p>
          <p>Key features include:</p>
          <ul>
            <li>Visual Tile Editor</li>
            <li>Sprite Editor with animation support</li>
            <li>Screen Map Editor with Effect Zones</li>
            <li>Integrated Z80 Code Editor with snippets</li>
            <li>PT3 Music Tracker</li>
            <li>Font Editor</li>
            <li>And more!</li>
          </ul>
          <p>Use the <strong>File Explorer</strong> on the left to manage your assets. Create new assets using the <strong>Toolbar</strong> at the top.</p>
          <p>Select an asset to open its dedicated editor. Properties for the selected asset or element will appear in the <strong>Properties Panel</strong> on the right.</p>
        `,
        tags: ["introduction", "overview"],
      },
      {
        id: "toolbar_overview",
        title: "Toolbar Overview",
        content: `
          <h2>Toolbar Guide</h2>
          <p>The main toolbar provides quick access to common actions:</p>
          <ul>
            <li><strong>New Project</strong>: Clears current work and sets up a new project structure (main.asm, etc.).</li>
            <li><strong>Load/Save/Save As</strong>: Standard project file operations (saves as .json).</li>
            <li><strong>New Asset</strong>: Dropdown to create Tiles, Sprites, Screen Maps, Code files, etc.</li>
            <li><strong>Undo/Redo</strong>: Reverts or reapplies recent changes.</li>
            <li><strong>Tile Banks/Font Editor</strong>: Opens specialized editors for Screen 2 graphics management and MSX1 font editing.</li>
            <li><strong>Compile (Mock)</strong>: Placeholder for future compilation integration.</li>
            <li><strong>Debug/Run (Mock)</strong>: Placeholders for debugging and emulator launching.</li>
            <li><strong>Configure</strong>: Dropdown for IDE settings (Data Output, Autosave, Theme, etc.).</li>
            <li><strong>Tutorials</strong>: Opens this Help & Documentation viewer.</li>
          </ul>
        `,
        tags: ["toolbar", "ide", "ui"],
      },
    ],
  },
  {
    id: "sprite_editor",
    title: "Sprite Editor",
    articles: [
      {
        id: "sprite_basics",
        title: "Sprite Editor Basics",
        content: `
          <h2>Sprite Editor Basics</h2>
          <p>The Sprite Editor allows you to create and animate game characters and objects.</p>
          <h3>Key Areas:</h3>
          <ul>
            <li><strong>Left Panel (Tools & Palette)</strong>:
                <ul>
                    <li><strong>Tools</strong>: Switch between Draw and Erase (uses background color).</li>
                    <li><strong>Active Brush</strong>: Select one of the 4 sprite palette colors to draw with.</li>
                    <li><strong>Define Sprite Colors</strong>: Assign MSX colors to the 4 sprite palette slots and the sprite's background color. Click a slot, then pick from the main MSX Palette Panel.</li>
                </ul>
            </li>
            <li><strong>Center Panel (Pixel Grid)</strong>: The main drawing canvas for the current frame.</li>
            <li><strong>Right Panel (Frame Management & Preview)</strong>:
                <ul>
                    <li><strong>Animation Preview</strong>: Shows a small preview of the current frame.</li>
                    <li><strong>Frame Control</strong>: Add, duplicate, delete, or navigate between animation frames.</li>
                    <li><strong>Transform Frame</strong>: Tools to shift, rotate (square sprites), clear, or contract the current frame.</li>
                    <li><strong>Generate Explosion</strong>: A utility to create animated explosion sprite sequences.</li>
                </ul>
            </li>
          </ul>
          <h3>Tips:</h3>
          <ul>
            <li>Sprites use a 4-color palette + 1 background color for transparency/erasing.</li>
            <li>MSX sprites have hardware limitations (e.g., max sprites per line). Keep this in mind for your game design.</li>
            <li>Use the "Export ASM" button to get Z80 assembly data for your sprite.</li>
          </ul>
        `,
        tags: ["sprite", "animation", "graphics"],
      },
    ],
  },
  {
    id: "screen_editor",
    title: "Screen Editor",
    articles: [
      {
        id: "screen_basics",
        title: "Screen Editor Basics",
        content: `
          <h2>Screen Editor Basics</h2>
          <p>The Screen Editor is used to design game levels and layouts by placing tiles.</p>
          <h3>Layers:</h3>
          <p>The editor supports multiple layers:</p>
          <ul>
            <li><strong>Background</strong>: The main visual layer for your map.</li>
            <li><strong>Collision</strong>: Defines areas where the player/entities cannot pass. Tiles placed here act as collision markers.</li>
            <li><strong>Effects</strong>: Used to define rectangular zones for gameplay effects (e.g., water, ice, custom gravity, sprite concealment). Edit properties of these zones in the Properties Panel.</li>
            <li><strong>Entities</strong>: Place game entities like player start, enemies, items.</li>
          </ul>
          <h3>Tools & Panels:</h3>
          <ul>
            <li><strong>Tileset Panel (Left)</strong>: Shows available tiles. Click a tile to select it for drawing on Background/Collision layers. Hidden when 'Effects' layer is active.</li>
            <li><strong>Entity Types Panel (Right, when Entity layer active)</strong>: Lists mock entity types. Select one to place instances on the map.</li>
            <li><strong>Properties Panel (Right)</strong>: Shows properties of the selected map, entity instance, or effect zone.</li>
            <li><strong>Active Area</strong>: Defines the playable portion of the screen map. Areas outside can be used for HUD elements. Editable via input fields in the toolbar.</li>
            <li><strong>Toolbar (Screen Editor)</strong>: Contains layer selectors, zoom, active area inputs, HUD editor button, and export options. When 'Effects' layer is active, an "Add Effect Zone" button appears.</li>
          </ul>
          <h3>Effect Zones:</h3>
          <p>On the 'Effects' layer, you can add rectangular zones. Each zone has:</p>
          <ul>
            <li>A name.</li>
            <li>Position (x,y) and Size (width, height) in grid cells.</li>
            <li>An <strong>Effect Mask</strong>: A byte value where each bit represents a different effect (e.g., bit 0 for water, bit 1 for ice). You can toggle these effects using checkboxes in the Properties Panel.</li>
          </ul>
          <h3>SCREEN 2 Specifics:</h3>
          <p>When in SCREEN 2 mode:</p>
          <ul>
            <li>Tiles are typically 8x8 character blocks.</li>
            <li><strong>Tile Banks</strong> become crucial for managing character codes and colors. Assign your 8x8 tiles to banks. The Screen Editor will use these bank assignments to resolve tile placements into character codes for export.</li>
            <li>The editor's base cell dimension is 8x8.</li>
          </ul>
        `,
        tags: ["screenmap", "level design", "tiles", "effect zones"],
      },
    ],
  },
];
// --- End Help & Documentation Constants ---

/** The maximum number of actions to store in the undo/redo history. */
export const MAX_HISTORY_LENGTH = 50;

// --- Mideas Global Variables Dictionary ---
/**
 * Global variables dictionary for Mideas language
 * Used in GameFlow IfThenElse nodes for conditional logic
 */
export interface MideasGlobalVariable {
  /** Variable name (e.g., "Goal", "Lives") */
  name: string;
  /** ASM variable name (e.g., "global_var_goal") */
  asmName: string;
  /** ASM constant prefix (e.g., "GOAL_") */
  constantPrefix: string;
  /** Data type: boolean, byte (8-bit), word (16-bit), or string */
  type: 'boolean' | 'byte' | 'word' | 'string' | '8bit' | '16bit';
  /** Description of what this variable represents */
  description: string;
  /** Possible values for this variable */
  values: { label: string; value: number | string; asmConstant?: string }[];
  /** Category for organization */
  category: 'objective' | 'score' | 'player' | 'inventory' | 'progress' | 'time' | 'difficulty' | 'special';
}

export const MIDEAS_GLOBAL_VARIABLES: MideasGlobalVariable[] = [
  // === OBJECTIVE / PROGRESS ===
  {
    name: 'Goal',
    asmName: 'global_var_goal',
    constantPrefix: 'GOAL_',
    type: 'byte',
    description: 'Current objective status',
    category: 'objective',
    values: [
      { label: 'Failure', value: 0, asmConstant: 'GOAL_FAILURE' },
      { label: 'Completed', value: 1, asmConstant: 'GOAL_COMPLETED' },
      { label: 'Partial', value: 2, asmConstant: 'GOAL_PARTIAL' },
    ]
  },
  {
    name: 'MissionStatus',
    asmName: 'global_var_mission_status',
    constantPrefix: 'MISSION_',
    type: 'byte',
    description: 'Current mission state',
    category: 'objective',
    values: [
      { label: 'NotStarted', value: 0, asmConstant: 'MISSION_NOT_STARTED' },
      { label: 'Active', value: 1, asmConstant: 'MISSION_ACTIVE' },
      { label: 'Completed', value: 2, asmConstant: 'MISSION_COMPLETED' },
      { label: 'Failed', value: 3, asmConstant: 'MISSION_FAILED' },
    ]
  },
  {
    name: 'LevelCompleted',
    asmName: 'global_var_level_completed',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Level completion flag',
    category: 'objective',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'BossDefeated',
    asmName: 'global_var_boss_defeated',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Boss defeated flag',
    category: 'objective',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'AllItemsCollected',
    asmName: 'global_var_all_items_collected',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'All items collected flag',
    category: 'objective',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },

  // === SCORE / POINTS ===
  {
    name: 'Score',
    asmName: 'global_var_score',
    constantPrefix: 'SCORE_',
    type: 'word',
    description: 'Current player score (0-65535)',
    category: 'score',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'HiScore',
    asmName: 'global_var_hi_score',
    constantPrefix: 'HISCORE_',
    type: 'word',
    description: 'High score record (0-65535)',
    category: 'score',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'ComboMultiplier',
    asmName: 'global_var_combo_multiplier',
    constantPrefix: 'COMBO_',
    type: 'byte',
    description: 'Combo multiplier (1x, 2x, 3x...)',
    category: 'score',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'Coins',
    asmName: 'global_var_coins',
    constantPrefix: 'COINS_',
    type: 'byte',
    description: 'Coins collected (0-255)',
    category: 'score',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'Gems',
    asmName: 'global_var_gems',
    constantPrefix: 'GEMS_',
    type: 'byte',
    description: 'Gems collected (0-255)',
    category: 'score',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },

  // === PLAYER STATE ===
  {
    name: 'Lives',
    asmName: 'global_var_lives',
    constantPrefix: 'LIVES_',
    type: 'byte',
    description: 'Remaining lives (0-255)',
    category: 'player',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'Health',
    asmName: 'global_var_health',
    constantPrefix: 'HEALTH_',
    type: 'byte',
    description: 'Current health (0-255)',
    category: 'player',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'Energy',
    asmName: 'global_var_energy',
    constantPrefix: 'ENERGY_',
    type: 'byte',
    description: 'Current energy/mana (0-255)',
    category: 'player',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'Shield',
    asmName: 'global_var_shield',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Shield active flag',
    category: 'player',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },

  // === INVENTORY / ITEMS ===
  {
    name: 'HasKey',
    asmName: 'global_var_has_key',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Has key item',
    category: 'inventory',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'HasSword',
    asmName: 'global_var_has_sword',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Has sword item',
    category: 'inventory',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'HasMap',
    asmName: 'global_var_has_map',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Has map item',
    category: 'inventory',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'ItemCount',
    asmName: 'global_var_item_count',
    constantPrefix: 'ITEMS_',
    type: 'byte',
    description: 'Special items collected (0-255)',
    category: 'inventory',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'PowerUpActive',
    asmName: 'global_var_powerup_active',
    constantPrefix: 'POWERUP_',
    type: 'byte',
    description: 'Active power-up type',
    category: 'inventory',
    values: [
      { label: 'None', value: 0, asmConstant: 'POWERUP_NONE' },
      { label: 'Speed', value: 1, asmConstant: 'POWERUP_SPEED' },
      { label: 'Jump', value: 2, asmConstant: 'POWERUP_JUMP' },
      { label: 'Invincible', value: 3, asmConstant: 'POWERUP_INVINCIBLE' },
    ]
  },

  // === PROGRESS / WORLD ===
  {
    name: 'CurrentWorld',
    asmName: 'global_var_current_world',
    constantPrefix: 'WORLD_',
    type: 'byte',
    description: 'Current world number (1-8)',
    category: 'progress',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'CurrentLevel',
    asmName: 'global_var_current_level',
    constantPrefix: 'LEVEL_',
    type: 'byte',
    description: 'Current level number (0-255)',
    category: 'progress',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'CheckpointReached',
    asmName: 'global_var_checkpoint',
    constantPrefix: 'CHECKPOINT_',
    type: 'byte',
    description: 'Checkpoint reached (0-255)',
    category: 'progress',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'SecretFound',
    asmName: 'global_var_secret_found',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Secret area found flag',
    category: 'progress',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'DoorsUnlocked',
    asmName: 'global_var_doors_unlocked',
    constantPrefix: 'DOORS_',
    type: 'byte',
    description: 'Doors unlocked bitmask (0-255)',
    category: 'progress',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },

  // === TIME ===
  {
    name: 'TimeRemaining',
    asmName: 'global_var_time_remaining',
    constantPrefix: 'TIME_',
    type: 'word',
    description: 'Time remaining in seconds (0-65535)',
    category: 'time',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'TimeLimitActive',
    asmName: 'global_var_time_limit_active',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Time limit active flag',
    category: 'time',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
  {
    name: 'DayNightCycle',
    asmName: 'global_var_day_night_cycle',
    constantPrefix: 'TIME_',
    type: 'byte',
    description: 'Day/night cycle state (0-23)',
    category: 'time',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },

  // === DIFFICULTY ===
  {
    name: 'DifficultyLevel',
    asmName: 'global_var_difficulty',
    constantPrefix: 'DIFFICULTY_',
    type: 'byte',
    description: 'Game difficulty level',
    category: 'difficulty',
    values: [
      { label: 'Easy', value: 0, asmConstant: 'DIFFICULTY_EASY' },
      { label: 'Normal', value: 1, asmConstant: 'DIFFICULTY_NORMAL' },
      { label: 'Hard', value: 2, asmConstant: 'DIFFICULTY_HARD' },
      { label: 'Expert', value: 3, asmConstant: 'DIFFICULTY_EXPERT' },
    ]
  },

  // === SPECIAL CONDITIONS ===
  {
    name: 'EnemiesDefeated',
    asmName: 'global_var_enemies_defeated',
    constantPrefix: 'ENEMIES_',
    type: 'word',
    description: 'Enemies defeated count (0-65535)',
    category: 'special',
    values: [
      { label: 'Custom Value', value: 'number' },
    ]
  },
  {
    name: 'PerfectRun',
    asmName: 'global_var_perfect_run',
    constantPrefix: 'BOOL_',
    type: 'byte',
    description: 'Perfect run (no damage) flag',
    category: 'special',
    values: [
      { label: 'False', value: 0, asmConstant: 'BOOL_FALSE' },
      { label: 'True', value: 1, asmConstant: 'BOOL_TRUE' },
    ]
  },
];

/**
 * Get available values/constants for a given global variable
 */
export function getMideasVariableValues(variableName: string): { label: string; value: number | string; asmConstant?: string }[] {
  const variable = MIDEAS_GLOBAL_VARIABLES.find(v => v.name === variableName);
  return variable?.values || [];
}

/**
 * Get variable by name
 */
export function getMideasVariable(variableName: string): MideasGlobalVariable | undefined {
  return MIDEAS_GLOBAL_VARIABLES.find(v => v.name === variableName);
}
// --- End Mideas Global Variables Dictionary ---
