"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_DOCS_SYSTEM_ASSET_ID = exports.EFFECT_ZONE_FLAGS = exports.DEFAULT_MAIN_MENU_CONFIG = exports.DEFAULT_TILE_BANK_DEFINITIONS = exports.DEFAULT_PSG_INSTRUMENTS = exports.PT3_KEYBOARD_OCTAVE_MIN_MAX = exports.PT3_PIANO_KEY_LAYOUT = exports.PT3_INSTRUMENT_DATA_SIZE = exports.PT3_ORNAMENT_LENGTH = exports.PT3_DEFAULT_VIBRATO_TABLE = exports.PT3_NOTE_NAMES = exports.SCC_CHANNELS = exports.PT3_CHANNELS = exports.PT3_MAX_ORNAMENTS = exports.PT3_MAX_INSTRUMENTS = exports.PT3_MAX_PATTERNS = exports.DEFAULT_PT3_SPEED = exports.DEFAULT_PT3_BPM = exports.DEFAULT_PT3_ROWS_PER_PATTERN = exports.MSX1_DEFAULT_COLOR = exports.MSX1_PALETTE_IDX_MAP = exports.MSX1_PALETTE_MAP = exports.DEFAULT_SCREEN2_BG_COLOR = exports.DEFAULT_SCREEN2_FG_COLOR = exports.DEFAULT_SCREEN2_BG_COLOR_INDEX = exports.DEFAULT_SCREEN2_FG_COLOR_INDEX = exports.SCREEN2_PIXELS_PER_COLOR_SEGMENT = exports.Z80_BEHAVIOR_SNIPPETS = exports.Z80_SNIPPETS = exports.Z80_DIRECTIVES = exports.Z80_CONDITIONS = exports.Z80_REGISTERS = exports.Z80_MNEMONICS = exports.DEFAULT_SCREEN_MODE = exports.SCREEN_MODES = exports.EMPTY_CELL_CHAR_CODE = exports.EDITOR_BASE_TILE_DIM_S2 = exports.DEFAULT_SCREEN_HEIGHT_TILES = exports.DEFAULT_SCREEN_WIDTH_TILES = exports.DEFAULT_SPRITE_SIZE = exports.DEFAULT_TILE_HEIGHT = exports.DEFAULT_TILE_WIDTH = exports.EDITABLE_TILE_DIMENSIONS = exports.DEFAULT_SCREEN5_CUSTOM_PALETTE = exports.snapHexToScreen5MasterColor = exports.MSX_SCREEN5_MASTER_PALETTE = exports.MSX2_COLOR_LEVELS = exports.MSX1_PALETTE = exports.MSX_SCREEN5_PALETTE = exports.APP_VERSION = void 0;
exports.MIDEAS_GLOBAL_VARIABLES = exports.MAX_HISTORY_LENGTH = exports.DEFAULT_HELP_DOCS_DATA = void 0;
exports.getMideasVariableValues = getMideasVariableValues;
exports.getMideasVariable = getMideasVariable;
const types_1 = require("./types");
/** The current version of the application. */
exports.APP_VERSION = "0.267";
/**
 * The 16-color palette for MSX SCREEN 5.
 * Used for sprite colors and general UI.
 */
exports.MSX_SCREEN5_PALETTE = [
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
exports.MSX1_PALETTE = [
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
exports.MSX2_COLOR_LEVELS = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
/** Complete 512-color master palette for SCREEN 5 (MSX2). */
exports.MSX_SCREEN5_MASTER_PALETTE = (() => {
    const palette = [];
    for (let r = 0; r < exports.MSX2_COLOR_LEVELS.length; r++) {
        for (let g = 0; g < exports.MSX2_COLOR_LEVELS.length; g++) {
            for (let b = 0; b < exports.MSX2_COLOR_LEVELS.length; b++) {
                const index = (r << 6) | (g << 3) | b;
                palette.push({
                    index,
                    hex: `#${toHex(exports.MSX2_COLOR_LEVELS[r])}${toHex(exports.MSX2_COLOR_LEVELS[g])}${toHex(exports.MSX2_COLOR_LEVELS[b])}`,
                    rLevel: r,
                    gLevel: g,
                    bLevel: b,
                });
            }
        }
    }
    return palette;
})();
const findClosestLevelIndex = (channelValue) => {
    let closestIndex = 0;
    let closestDiff = Infinity;
    exports.MSX2_COLOR_LEVELS.forEach((level, levelIndex) => {
        const diff = Math.abs(level - channelValue);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = levelIndex;
        }
    });
    return closestIndex;
};
const normalizeHexColor = (hex) => {
    if (!hex || !hex.startsWith('#') || (hex.length !== 7)) {
        return '#000000';
    }
    return hex.toUpperCase();
};
/**
 * Snaps an arbitrary RGB hex color to the closest entry in the SCREEN 5 master palette.
 * Returns both the snapped color and the hardware palette index (0-511).
 */
const snapHexToScreen5MasterColor = (hex) => {
    const normalized = normalizeHexColor(hex);
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const rIdx = findClosestLevelIndex(r);
    const gIdx = findClosestLevelIndex(g);
    const bIdx = findClosestLevelIndex(b);
    const snappedHex = `#${toHex(exports.MSX2_COLOR_LEVELS[rIdx])}${toHex(exports.MSX2_COLOR_LEVELS[gIdx])}${toHex(exports.MSX2_COLOR_LEVELS[bIdx])}`;
    const masterIndex = (rIdx << 6) | (gIdx << 3) | bIdx;
    return { hex: snappedHex, masterIndex };
};
exports.snapHexToScreen5MasterColor = snapHexToScreen5MasterColor;
/** Default 16-color configuration (slot 0 kept as transparent) for SCREEN 5 tiles. */
exports.DEFAULT_SCREEN5_CUSTOM_PALETTE = exports.MSX_SCREEN5_PALETTE.map((color, idx) => {
    if (idx === 0) {
        return { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' };
    }
    const snapped = (0, exports.snapHexToScreen5MasterColor)(color.hex);
    return { slotIndex: idx, masterIndex: snapped.masterIndex, hex: snapped.hex };
});
/** An array of allowed tile dimensions (width/height) in the tile editor. */
exports.EDITABLE_TILE_DIMENSIONS = [8, 16, 24, 32];
/** The default width of a new tile. */
exports.DEFAULT_TILE_WIDTH = 16;
/** The default height of a new tile. */
exports.DEFAULT_TILE_HEIGHT = 16;
/** The default size (width and height) of a new sprite. */
exports.DEFAULT_SPRITE_SIZE = 16;
/** The default width of a new screen map, in tiles. */
exports.DEFAULT_SCREEN_WIDTH_TILES = 32;
/** The default height of a new screen map, in tiles. */
exports.DEFAULT_SCREEN_HEIGHT_TILES = 24;
/** The base dimension (8x8) of a character block in SCREEN 2 mode. */
exports.EDITOR_BASE_TILE_DIM_S2 = 8;
/** The character code used to represent an empty tile cell in exported data. */
exports.EMPTY_CELL_CHAR_CODE = 255;
/** A list of available MSX screen modes. */
exports.SCREEN_MODES = ["SCREEN 0 (Text 40)", "SCREEN 1 (Text 32)", "SCREEN 2 (Graphics I)", "SCREEN 3 (Multicolor)", "SCREEN 4 (Graphics II)", "SCREEN 5 (Graphics III)", "SCREEN 6 (Graphics IV)", "SCREEN 7 (Graphics V)", "SCREEN 8 (Graphics VI)"];
/** The default screen mode for a new project. */
exports.DEFAULT_SCREEN_MODE = "SCREEN 2 (Graphics I)";
/** A list of Z80 assembly mnemonics for syntax highlighting. */
exports.Z80_MNEMONICS = [
    "ADC", "ADD", "AND", "BIT", "CALL", "CCF", "CP", "CPD", "CPDR", "CPI", "CPIR",
    "CPL", "DAA", "DEC", "DI", "DJNZ", "EI", "EX", "EXX", "HALT", "IM", "IN", "INC",
    "IND", "INDR", "INI", "INIR", "JP", "JR", "LD", "LDD", "LDDR", "LDI", "LDIR",
    "NEG", "NOP", "OR", "OTDR", "OTIR", "OUT", "OUTD", "OUTI", "POP", "PUSH", "RES",
    "RET", "RETI", "RETN", "RL", "RLA", "RLC", "RLCA", "RLD", "RR", "RRA", "RRC",
    "RRCA", "RRD", "RST", "SBC", "SCF", "SET", "SLA", "SLL", "SRA", "SRL", "SUB", "XOR"
];
/** A list of Z80 registers for syntax highlighting. */
exports.Z80_REGISTERS = [
    "A", "F", "B", "C", "D", "E", "H", "L", "AF", "BC", "DE", "HL",
    "IXH", "IXL", "IYH", "IYL", "IX", "IY", "SP", "PC", "I", "R", "AF'"
];
/** A list of Z80 condition codes for syntax highlighting. */
exports.Z80_CONDITIONS = [
    "NZ", "Z", "NC", "C", "PO", "PE", "P", "M"
];
/** A list of Z80 assembler directives for syntax highlighting. */
exports.Z80_DIRECTIVES = [
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
exports.Z80_SNIPPETS = [
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
exports.Z80_BEHAVIOR_SNIPPETS = [];
/** The width of a color segment in SCREEN 2 mode, in pixels. */
exports.SCREEN2_PIXELS_PER_COLOR_SEGMENT = 8;
/** The default foreground color index for SCREEN 2. */
exports.DEFAULT_SCREEN2_FG_COLOR_INDEX = 15; // White
/** The default background color index for SCREEN 2. */
exports.DEFAULT_SCREEN2_BG_COLOR_INDEX = 1; // Black
/** The default foreground color hex value for SCREEN 2. */
exports.DEFAULT_SCREEN2_FG_COLOR = exports.MSX1_PALETTE.find(c => c.index === exports.DEFAULT_SCREEN2_FG_COLOR_INDEX)?.hex || exports.MSX1_PALETTE[15].hex;
/** The default background color hex value for SCREEN 2. */
exports.DEFAULT_SCREEN2_BG_COLOR = exports.MSX1_PALETTE.find(c => c.index === exports.DEFAULT_SCREEN2_BG_COLOR_INDEX)?.hex || exports.MSX1_PALETTE[1].hex;
/** A Map from MSX1 color hex values to their MSX1Color object. */
exports.MSX1_PALETTE_MAP = new Map(exports.MSX1_PALETTE.map(c => [c.hex, c]));
/** A Map from MSX1 color indices to their MSX1Color object. */
exports.MSX1_PALETTE_IDX_MAP = new Map(exports.MSX1_PALETTE.map(c => [c.index, c]));
/** The default MSX1 color object (black). */
exports.MSX1_DEFAULT_COLOR = exports.MSX1_PALETTE[1]; // Default to black if lookup fails
// --- PT3 Tracker Constants ---
/** The default number of rows for a new tracker pattern. */
exports.DEFAULT_PT3_ROWS_PER_PATTERN = 32;
/** The default beats per minute for a new song. */
exports.DEFAULT_PT3_BPM = 125;
/** The default speed (ticks per row) for a new song. */
exports.DEFAULT_PT3_SPEED = 6;
/** The maximum number of patterns allowed in a song. */
exports.PT3_MAX_PATTERNS = 100;
/** The maximum number of instruments allowed in a song. */
exports.PT3_MAX_INSTRUMENTS = 31;
/** The maximum number of ornaments allowed in a song. */
exports.PT3_MAX_ORNAMENTS = 15;
/** The PSG channel identifiers. */
exports.PT3_CHANNELS = ['A', 'B', 'C'];
/** The SCC channel identifiers. */
exports.SCC_CHANNELS = ['1', '2', '3', '4', '5'];
/** The names of notes in an octave for display. */
exports.PT3_NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
/** A default vibrato table for instruments. */
exports.PT3_DEFAULT_VIBRATO_TABLE = [
    0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7,
    7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0
];
/** The fixed length of an ornament's data array. */
exports.PT3_ORNAMENT_LENGTH = 32;
/** The size in bytes of a single instrument's data block in the PT3 format. */
exports.PT3_INSTRUMENT_DATA_SIZE = 68;
/**
 * Defines the mapping of keyboard keys to musical notes for the tracker's piano input.
 */
exports.PT3_PIANO_KEY_LAYOUT = {
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
    '7': { noteNameIndex: 10, baseOctave: 5 }, // A#5 (from num row)
};
/** The minimum and maximum allowed octave offset for the tracker keyboard. */
exports.PT3_KEYBOARD_OCTAVE_MIN_MAX = { min: -2, max: 2 };
/**
 * Default PSG instruments for new tracker songs.
 * Based on MSX1 Yamaha AY-3-8910 chip capabilities.
 * Each instrument includes volume/tone envelopes, loop positions, and AY envelope shapes.
 */
exports.DEFAULT_PSG_INSTRUMENTS = [
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
exports.DEFAULT_TILE_BANK_DEFINITIONS = [
    {
        id: 'bank_0',
        name: 'Bank 0 - HUD/Fonts',
        enabled: true,
        vramPatternStart: 0x0000,
        vramColorStart: 0x2000,
        screenZone: { x: 0, y: 0, width: exports.DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
        charsetRangeStart: 0, // Full range for fonts (0-127) and HUD tiles (128-255)
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
        screenZone: { x: 0, y: 8, width: exports.DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
        charsetRangeStart: 0, // Full range for fonts (0-127) and Game tiles (128-255)
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
        screenZone: { x: 0, y: 16, width: exports.DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
        charsetRangeStart: 0, // Full range for fonts (0-127) and Background tiles (128-255)
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
exports.DEFAULT_MAIN_MENU_CONFIG = {
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
        text: exports.MSX1_PALETTE[15].hex, // White
        background: exports.MSX1_PALETTE[4].hex, // Dark Blue
        highlightText: exports.MSX1_PALETTE[11].hex, // Light Yellow
        highlightBackground: exports.MSX1_PALETTE[5].hex, // Light Blue
        border: exports.MSX1_PALETTE[15].hex, // White
    },
};
// --- End Main Menu Constants ---
// --- Effect Zone Constants ---
/** Re-export of EFFECT_ZONE_FLAGS from `types.ts` for convenient access. */
exports.EFFECT_ZONE_FLAGS = types_1.EFFECT_ZONE_FLAGS;
// --- End Effect Zone Constants ---
// --- Help & Documentation Constants ---
/** System asset ID for the Help & Docs viewer. */
exports.HELP_DOCS_SYSTEM_ASSET_ID = "HELP_DOCS_SYSTEM_ASSET";
/** The default content for the Help & Documentation viewer. */
exports.DEFAULT_HELP_DOCS_DATA = [
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
    {
        id: "gameflow",
        title: "GameFlow System",
        articles: [
            {
                id: "gameflow_intro",
                title: "Introduction to GameFlow",
                content: `
          <h2>GameFlow System</h2>
          <p><strong>GameFlow</strong> is the game flow control system in Mideas MSX. It allows you to create your game's logic using a visual system based on <strong>nodes</strong> and <strong>connections</strong>, without writing ASM code.</p>

          <h3>What can you do with GameFlow?</h3>
          <ul>
            <li>Create main and in-game menus</li>
            <li>Add victory, defeat, and credits screens</li>
            <li>Implement conditional logic (if/then/else)</li>
            <li>Display text and dialogues</li>
            <li>Apply visual transition effects</li>
            <li>Control music and sounds</li>
            <li>Manage levels and worlds</li>
            <li>Implement pause and wait systems</li>
          </ul>

          <h3>How does it work?</h3>
          <p>The game starts at the <strong>Start</strong> node and flows from node to node following the <strong>connections</strong> you define. Each node executes a specific action and then proceeds to the next connected node.</p>
          <pre>Start → Menu → WorldLink (Game Loop) → End</pre>

          <h3>Basic Concepts</h3>
          <h4>Nodes</h4>
          <p>A <strong>node</strong> is a unit of game logic. Each node has:</p>
          <ul>
            <li><strong>Type</strong>: Defines what the node does (menu, text, game, etc.)</li>
            <li><strong>Data</strong>: Node-specific configuration</li>
            <li><strong>Connections</strong>: Links to other nodes</li>
          </ul>

          <h4>Connections</h4>
          <p>Connections determine the game flow:</p>
          <ul>
            <li><strong>DEFAULT</strong>: Linear connection (next node)</li>
            <li><strong>THEN/ELSE</strong>: Conditional connections</li>
            <li><strong>OPTION_0 to OPTION_5</strong>: Menu options</li>
          </ul>

          <h4>Global Variables</h4>
          <p>You can use variables to control flow:</p>
          <ul>
            <li><code>score</code>: Player score</li>
            <li><code>lives</code>: Remaining lives</li>
            <li><code>level</code>: Current level</li>
            <li>Custom variables</li>
          </ul>
        `,
                tags: ["gameflow", "introduction", "nodes"],
            },
            {
                id: "gameflow_nodes_basic",
                title: "Basic Node Types",
                content: `
          <h2>Basic Node Types</h2>

          <h3>1. Start (Beginning)</h3>
          <p><strong>Description</strong>: Initial game node. Must always be the first node.</p>
          <p><strong>Properties</strong>: No data, only DEFAULT connection</p>
          <pre>Start → (next node)</pre>

          <h3>2. End (Finish)</h3>
          <p><strong>Description</strong>: Shows an end screen and waits for player input.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>endType</code>: Screen type (0-3)
              <ul>
                <li>0: Victory (VICTORY!)</li>
                <li>1: Defeat (GAME OVER)</li>
                <li>2: Credits (CREDITS)</li>
                <li>3: Custom message</li>
              </ul>
            </li>
            <li><code>message</code>: Custom message (only if endType=3)</li>
          </ul>
          <p><strong>Behavior</strong>: Displays screen, waits for FIRE or ESC, game ends</p>

          <h3>3. Restart</h3>
          <p><strong>Description</strong>: Restarts the game from the beginning.</p>
          <p><strong>Properties</strong>: No data, no connections (restarts directly)</p>
          <p><strong>Behavior</strong>: Jumps to init_rom (complete reset)</p>

          <h3>4. WorldLink (World/Level)</h3>
          <p><strong>Description</strong>: Starts main gameplay. Executes the world's game loop.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>worldId</code>: ID of the world to load</li>
            <li><code>screenId</code>: Initial screen ID</li>
            <li>DEFAULT connection (executed when world ends)</li>
          </ul>
          <p><strong>Behavior</strong>:</p>
          <ul>
            <li>Loads world and entities</li>
            <li>Executes game loop (ECS + State Machines)</li>
            <li>Infinite loop until <code>gameflow_exit_requested = 1</code></li>
            <li>When finished, continues to DEFAULT connection</li>
          </ul>
          <p><strong>How to exit</strong>: Use a component/behavior that sets <code>gameflow_exit_requested = 1</code></p>

          <h3>5. SubMenu (Menu)</h3>
          <p><strong>Description</strong>: Shows an interactive menu with options.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>title</code>: Menu title</li>
            <li><code>options</code>: Array of strings (menu options)</li>
            <li>OPTION_0 to OPTION_N connections (one per option)</li>
          </ul>
          <p><strong>Controls</strong>:</p>
          <ul>
            <li><strong>UP</strong>: Previous option</li>
            <li><strong>DOWN</strong>: Next option</li>
            <li><strong>FIRE</strong>: Select option</li>
          </ul>
          <p><strong>Behavior</strong>: Shows menu, player navigates, continues to node based on selected option</p>

          <h3>6. Text</h3>
          <p><strong>Description</strong>: Shows text in the bottom area of the screen.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>text</code>: Text to display</li>
            <li><code>duration</code>: Duration in frames (60 frames = 1 second)
              <ul>
                <li>If 0: Waits for player input</li>
                <li>If >0: Waits N frames</li>
              </ul>
            </li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Clears text area, shows centered text, waits duration OR input, continues to next node</p>
        `,
                tags: ["gameflow", "nodes", "basic"],
            },
            {
                id: "gameflow_nodes_advanced",
                title: "Advanced Node Types",
                content: `
          <h2>Advanced Node Types</h2>

          <h3>7. IfThenElse (Conditional)</h3>
          <p><strong>Description</strong>: Evaluates a condition and chooses between two paths.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>variable</code>: Variable to evaluate (e.g., "score", "lives")</li>
            <li><code>value</code>: Value to compare</li>
            <li><code>operator</code>: Comparison operator
              <ul>
                <li>"equals": Variable == Value</li>
                <li>"greater": Variable > Value</li>
                <li>"less": Variable < Value</li>
                <li>"greaterOrEqual": Variable >= Value</li>
                <li>"lessOrEqual": Variable <= Value</li>
              </ul>
            </li>
            <li>THEN and ELSE connections</li>
          </ul>
          <p><strong>Behavior</strong>:</p>
          <ul>
            <li>Reads global variable</li>
            <li>Compares with value using operator</li>
            <li>If TRUE: Continues via THEN</li>
            <li>If FALSE: Continues via ELSE</li>
          </ul>

          <h3>8. Transition</h3>
          <p><strong>Description</strong>: Applies a visual transition effect.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>effectType</code>: Effect type (0-4)
              <ul>
                <li>0: Fade Out (~1.3s)</li>
                <li>1: Fade In (~1.3s)</li>
                <li>2: Flash (~0.5s)</li>
                <li>3: Wipe Down (~0.8s)</li>
                <li>4: Wipe Up (~0.8s)</li>
              </ul>
            </li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Executes visual effect, automatically continues to next node</p>

          <h3>9. Music</h3>
          <p><strong>Description</strong>: Controls music playback.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>command</code>: Music command (0-3)
              <ul>
                <li>0: Stop</li>
                <li>1: Play</li>
                <li>2: Pause</li>
                <li>3: Resume</li>
              </ul>
            </li>
            <li><code>trackId</code>: Track ID (only for Play)</li>
            <li><code>loop</code>: Loop playback (only for Play)</li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Executes music command (PSG AY-3-8910), continues immediately, music plays in background</p>

          <h3>10. Group (Nested Flow)</h3>
          <p><strong>Description</strong>: Executes a nested GameFlow sub-flow.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>subFlowStartNode</code>: Start node ID of sub-flow</li>
            <li>DEFAULT connection (next node after sub-flow)</li>
          </ul>
          <p><strong>Behavior</strong>: Saves current state on stack, executes complete sub-flow, restores state and continues</p>
          <p><strong>Use cases</strong>: Cutscenes, complex sub-menus, dialogue sequences, mini-games</p>

          <h3>11. Waypoint (Marker)</h3>
          <p><strong>Description</strong>: Invisible node serving as a reference point.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>name</code>: Waypoint name</li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Does nothing visible, continues immediately to next node</p>
          <p><strong>Use cases</strong>: Organize flow visually, return/save points, debugging</p>

          <h3>12. Globals (Global Variables)</h3>
          <p><strong>Description</strong>: Modifies global variables.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>variable</code>: Variable name</li>
            <li><code>value</code>: Value to assign</li>
            <li><code>operation</code>: Operation to perform
              <ul>
                <li>"set": Variable = Value</li>
                <li>"add": Variable += Value</li>
                <li>"subtract": Variable -= Value</li>
              </ul>
            </li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Modifies global variable, continues immediately to next node</p>
        `,
                tags: ["gameflow", "nodes", "advanced", "conditional"],
            },
            {
                id: "gameflow_examples",
                title: "Practical Examples",
                content: `
          <h2>Practical Examples</h2>

          <h3>Example 1: Simple Game</h3>
          <pre>
Start
  ↓
SubMenu (Main Menu)
  ├─ OPTION_0 (New Game) → Fade Out → WorldLink (Level 1) → Victory
  ├─ OPTION_1 (Continue) → WorldLink (Level 1)
  └─ OPTION_2 (Quit) → End (Thanks)
          </pre>

          <h3>Example 2: Lives System</h3>
          <pre>
WorldLink (Game)
  ↓ (on death)
IfThenElse (lives == 0?)
  ├─ THEN → Game Over
  └─ ELSE → Globals (lives -= 1) → Flash → Restart Level
          </pre>

          <h3>Example 3: Progressive Levels</h3>
          <pre>
Start
  ↓
Text ("LEVEL 1")
  ↓
WorldLink (Level 1)
  ↓
IfThenElse (score >= 500?)
  ├─ THEN → Text ("LEVEL 2") → WorldLink (Level 2) → Victory
  └─ ELSE → Game Over
          </pre>

          <h3>Example 4: Menu with Music</h3>
          <pre>
Start
  ↓
Music (Play menu theme)
  ↓
SubMenu (Main Menu)
  ├─ New Game → Music (Stop) → Music (Play game theme) → WorldLink
  ├─ Settings → Group (Settings Flow) → Main Menu
  └─ Quit → Music (Stop) → End
          </pre>

          <h3>Tips</h3>
          <ul>
            <li><strong>Clear Flow</strong>: Keep your flow linear and understandable</li>
            <li><strong>Smooth Transitions</strong>: Use transition effects between scenes</li>
            <li><strong>Initialize Variables</strong>: Set initial values at the start</li>
            <li><strong>Complete Connections</strong>: Always define both THEN and ELSE branches</li>
            <li><strong>Music Management</strong>: Stop music before changing tracks</li>
          </ul>
        `,
                tags: ["gameflow", "examples", "tutorial"],
            },
            {
                id: "gameflow_troubleshooting",
                title: "Troubleshooting",
                content: `
          <h2>Common Problems and Solutions</h2>

          <h3>Problem 1: Menu doesn't respond</h3>
          <p><strong>Symptoms</strong>: Menu shows but I can't navigate</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>No connections defined for options</li>
            <li>Joystick not connected correctly</li>
          </ul>
          <p><strong>Solution</strong>: Ensure all OPTION_N connections are defined in your SubMenu node</p>

          <h3>Problem 2: WorldLink never ends</h3>
          <p><strong>Symptoms</strong>: Game stuck in infinite loop</p>
          <p><strong>Possible causes</strong>: <code>gameflow_exit_requested</code> is not set to 1</p>
          <p><strong>Solution</strong>: Ensure your code/behavior sets the exit flag when level completes</p>

          <h3>Problem 3: Transitions don't show</h3>
          <p><strong>Symptoms</strong>: Transition effects don't appear</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Incorrect effectType (must be 0-4)</li>
            <li>ASM code not compiled correctly</li>
          </ul>
          <p><strong>Solution</strong>: Verify effectType is within valid range (0-4)</p>

          <h3>Problem 4: Music doesn't play</h3>
          <p><strong>Symptoms</strong>: Music command produces no sound</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Incorrect trackId (track doesn't exist)</li>
            <li>Stop command called before</li>
          </ul>
          <p><strong>Solution</strong>: Verify track exists and Play command is used correctly</p>

          <h3>Problem 5: Variables don't update</h3>
          <p><strong>Symptoms</strong>: Globals doesn't change variable values</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Incorrect variable name</li>
            <li>Wrong operation</li>
          </ul>
          <p><strong>Solution</strong>: Use exact variable name and correct operation ("set", "add", or "subtract")</p>

          <h3>Problem 6: IfThenElse always goes ELSE</h3>
          <p><strong>Symptoms</strong>: Condition never met</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Wrong operator</li>
            <li>Variable not initialized</li>
            <li>Incorrect comparison value</li>
          </ul>
          <p><strong>Solution</strong>: Verify operator and variable initialization</p>
          <p><strong>Valid operators</strong>: "equals", "greater", "less", "greaterOrEqual", "lessOrEqual"</p>

          <h3>Problem 7: Text appears cut off</h3>
          <p><strong>Symptoms</strong>: Text doesn't show completely</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Text too long (max ~30 characters)</li>
            <li>Unsupported characters</li>
          </ul>
          <p><strong>Solution</strong>: Limit text to 30 characters max, use only standard ASCII (A-Z, 0-9, basic punctuation)</p>

          <h3>Problem 8: ROM doesn't compile</h3>
          <p><strong>Symptoms</strong>: glass.jar compilation error</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Nodes without required connections</li>
            <li>Duplicate node IDs</li>
            <li>References to non-existent nodes</li>
          </ul>
          <p><strong>Solution</strong>:</p>
          <ul>
            <li>Verify all nodes have required connections</li>
            <li>Ensure unique IDs for each node</li>
            <li>Verify targets exist in node list</li>
          </ul>
        `,
                tags: ["gameflow", "troubleshooting", "problems"],
            },
        ],
    },
];
// --- End Help & Documentation Constants ---
/** The maximum number of actions to store in the undo/redo history. */
exports.MAX_HISTORY_LENGTH = 50;
exports.MIDEAS_GLOBAL_VARIABLES = [
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
function getMideasVariableValues(variableName) {
    const variable = exports.MIDEAS_GLOBAL_VARIABLES.find(v => v.name === variableName);
    return variable?.values || [];
}
/**
 * Get variable by name
 */
function getMideasVariable(variableName) {
    return exports.MIDEAS_GLOBAL_VARIABLES.find(v => v.name === variableName);
}
// --- End Mideas Global Variables Dictionary ---
