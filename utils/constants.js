"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIDEAS_GLOBAL_VARIABLES = exports.MAX_HISTORY_LENGTH = exports.DEFAULT_HELP_DOCS_DATA = exports.HELP_DOCS_SYSTEM_ASSET_ID = exports.EFFECT_ZONE_FLAGS = exports.DEFAULT_MAIN_MENU_CONFIG = exports.DEFAULT_TILE_BANK_DEFINITIONS = exports.PT3_KEYBOARD_OCTAVE_MIN_MAX = exports.PT3_PIANO_KEY_LAYOUT = exports.PT3_INSTRUMENT_DATA_SIZE = exports.PT3_ORNAMENT_LENGTH = exports.PT3_DEFAULT_VIBRATO_TABLE = exports.PT3_NOTE_NAMES = exports.PT3_CHANNELS = exports.PT3_MAX_ORNAMENTS = exports.PT3_MAX_INSTRUMENTS = exports.PT3_MAX_PATTERNS = exports.DEFAULT_PT3_SPEED = exports.DEFAULT_PT3_BPM = exports.DEFAULT_PT3_ROWS_PER_PATTERN = exports.MSX1_DEFAULT_COLOR = exports.MSX1_PALETTE_IDX_MAP = exports.MSX1_PALETTE_MAP = exports.DEFAULT_SCREEN2_BG_COLOR = exports.DEFAULT_SCREEN2_FG_COLOR = exports.DEFAULT_SCREEN2_BG_COLOR_INDEX = exports.DEFAULT_SCREEN2_FG_COLOR_INDEX = exports.SCREEN2_PIXELS_PER_COLOR_SEGMENT = exports.Z80_BEHAVIOR_SNIPPETS = exports.Z80_SNIPPETS = exports.Z80_DIRECTIVES = exports.Z80_CONDITIONS = exports.Z80_REGISTERS = exports.Z80_MNEMONICS = exports.DEFAULT_SCREEN_MODE = exports.SCREEN_MODES = exports.EMPTY_CELL_CHAR_CODE = exports.EDITOR_BASE_TILE_DIM_S2 = exports.DEFAULT_SCREEN_HEIGHT_TILES = exports.DEFAULT_SCREEN_WIDTH_TILES = exports.DEFAULT_SPRITE_SIZE = exports.DEFAULT_TILE_HEIGHT = exports.DEFAULT_TILE_WIDTH = exports.EDITABLE_TILE_DIMENSIONS = exports.MSX1_PALETTE = exports.MSX_SCREEN5_PALETTE = exports.APP_VERSION = void 0;
exports.getMideasVariableValues = getMideasVariableValues;
exports.getMideasVariable = getMideasVariable;
var types_1 = require("./types");
/** The current version of the application. */
exports.APP_VERSION = "0.256";
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
/** A list of available MSX screen modes for new/editable projects. SCREEN 5 is accepted only when loading legacy projects. */
exports.SCREEN_MODES = ["SCREEN 0 (Text 40)", "SCREEN 1 (Text 32)", "SCREEN 2 (Graphics I)", "SCREEN 3 (Multicolor)", "SCREEN 4 (Graphics II)", "SCREEN 6 (Graphics IV)", "SCREEN 7 (Graphics V)", "SCREEN 8 (Graphics VI)"];
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
        code: "; Pac-Man Style Tile Collection System for MSX\n; Optimized for MSX hardware limitations\n; Uses: DE = Player position, HL = Screen map address\n\nCOLLECT_TILES:\n    ; Input: DE = Player X,Y position (D=X, E=Y)\n    ; Input: HL = Screen map base address\n    ; Output: A = Number of items collected\n    ; Destroys: BC, DE, HL\n    \n    push bc\n    push de\n    push hl\n    \n    ld a, 0                    ; Initialize collection counter\n    ld (COLLECTION_COUNT), a\n    \n    ; Convert pixel position to tile coordinates\n    ld a, d                    ; Player X\n    srl a                      ; Divide by 2\n    srl a                      ; Divide by 4\n    srl a                      ; Divide by 8 (assuming 8x8 tiles)\n    ld d, a                    ; D = Tile X\n    \n    ld a, e                    ; Player Y  \n    srl a                      ; Divide by 2\n    srl a                      ; Divide by 4\n    srl a                      ; Divide by 8\n    ld e, a                    ; E = Tile Y\n    \n    ; Calculate tile address: HL + (Y * MAP_WIDTH) + X\n    ld a, e                    ; Y coordinate\n    ld b, 0\n    ld c, 32                   ; MAP_WIDTH (assuming 32 tiles wide)\n    call MULTIPLY_AC           ; A = Y * MAP_WIDTH\n    \n    add a, d                   ; A = (Y * MAP_WIDTH) + X\n    ld c, a\n    ld b, 0\n    add hl, bc                 ; HL points to tile at player position\n    \n    ; Check if current tile is collectible\n    ld a, (hl)                 ; Load tile ID\n    cp DOT_TILE_ID             ; Compare with dot tile\n    jr z, COLLECT_DOT\n    cp POWERUP_TILE_ID         ; Compare with power-up tile\n    jr z, COLLECT_POWERUP\n    cp FRUIT_TILE_ID           ; Compare with fruit tile\n    jr z, COLLECT_FRUIT\n    jr END_COLLECTION          ; Nothing to collect\n    \nCOLLECT_DOT:\n    ld a, EMPTY_TILE_ID        ; Replace with empty tile\n    ld (hl), a\n    ld a, (SCORE)              ; Load current score\n    add a, 10                  ; Add 10 points for dot\n    ld (SCORE), a\n    ld a, (DOT_COUNT)          ; Increment dot counter\n    inc a\n    ld (DOT_COUNT), a\n    call PLAY_DOT_SOUND        ; Play collection sound\n    jr INCREMENT_COLLECTION\n\nCOLLECT_POWERUP:\n    ld a, EMPTY_TILE_ID\n    ld (hl), a\n    ld a, (SCORE)\n    add a, 50                  ; Add 50 points for power-up\n    ld (SCORE), a\n    ld a, 1\n    ld (POWER_MODE), a         ; Activate power mode\n    call PLAY_POWERUP_SOUND\n    jr INCREMENT_COLLECTION\n\nCOLLECT_FRUIT:\n    ld a, EMPTY_TILE_ID\n    ld (hl), a\n    ld a, (SCORE)\n    add a, 100                 ; Add 100 points for fruit\n    ld (SCORE), a\n    ld a, (FRUIT_COUNT)\n    inc a\n    ld (FRUIT_COUNT), a\n    call PLAY_FRUIT_SOUND\n    jr INCREMENT_COLLECTION\n\nINCREMENT_COLLECTION:\n    ld a, (COLLECTION_COUNT)\n    inc a\n    ld (COLLECTION_COUNT), a\n\nEND_COLLECTION:\n    ld a, (COLLECTION_COUNT)   ; Return collection count in A\n    \n    pop hl\n    pop de\n    pop bc\n    ret\n\n; Helper routine: Multiply A * C, result in A\nMULTIPLY_AC:\n    ld b, 0\n    ld h, b\n    ld l, a\n    ld d, h\n    ld e, l\n    add hl, hl                 ; HL = A * 2\n    jr nc, MUL_NO_CARRY1\n    inc de\nMUL_NO_CARRY1:\n    add hl, hl                 ; HL = A * 4\n    jr nc, MUL_NO_CARRY2\n    inc de\nMUL_NO_CARRY2:\n    add hl, hl                 ; HL = A * 8\n    jr nc, MUL_NO_CARRY3\n    inc de\nMUL_NO_CARRY3:\n    add hl, hl                 ; HL = A * 16\n    jr nc, MUL_NO_CARRY4\n    inc de\nMUL_NO_CARRY4:\n    add hl, hl                 ; HL = A * 32\n    ld a, l\n    ret\n\n; Sound effect stubs (implement based on your sound system)\nPLAY_DOT_SOUND:\n    ; Play dot collection sound\n    ret\n    \nPLAY_POWERUP_SOUND:\n    ; Play power-up sound\n    ret\n    \nPLAY_FRUIT_SOUND:\n    ; Play fruit collection sound\n    ret\n\n; Data section\nDOT_TILE_ID:        EQU 1      ; Tile ID for collectible dots\nPOWERUP_TILE_ID:    EQU 2      ; Tile ID for power-ups\nFRUIT_TILE_ID:      EQU 3      ; Tile ID for bonus fruits\nEMPTY_TILE_ID:      EQU 0      ; Tile ID for empty space\n\n; Memory variables\nCOLLECTION_COUNT:   DB 0       ; Items collected this frame\nSCORE:              DW 0       ; Player score\nDOT_COUNT:          DB 0       ; Total dots collected\nFRUIT_COUNT:        DB 0       ; Total fruits collected\nPOWER_MODE:         DB 0       ; Power-up mode active flag"
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
exports.DEFAULT_SCREEN2_FG_COLOR = ((_a = exports.MSX1_PALETTE.find(function (c) { return c.index === exports.DEFAULT_SCREEN2_FG_COLOR_INDEX; })) === null || _a === void 0 ? void 0 : _a.hex) || exports.MSX1_PALETTE[15].hex;
/** The default background color hex value for SCREEN 2. */
exports.DEFAULT_SCREEN2_BG_COLOR = ((_b = exports.MSX1_PALETTE.find(function (c) { return c.index === exports.DEFAULT_SCREEN2_BG_COLOR_INDEX; })) === null || _b === void 0 ? void 0 : _b.hex) || exports.MSX1_PALETTE[1].hex;
/** A Map from MSX1 color hex values to their MSX1Color object. */
exports.MSX1_PALETTE_MAP = new Map(exports.MSX1_PALETTE.map(function (c) { return [c.hex, c]; }));
/** A Map from MSX1 color indices to their MSX1Color object. */
exports.MSX1_PALETTE_IDX_MAP = new Map(exports.MSX1_PALETTE.map(function (c) { return [c.index, c]; }));
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
// --- End PT3 Tracker Constants ---
// --- Tile Bank Constants ---
/**
 * The default configuration for tile banks in a new project.
 * Divides the screen into HUD, main game area, and status bar.
 * Characters 254 and 255 are reserved runtime sentinels and are not assignable.
 */
exports.DEFAULT_TILE_BANK_DEFINITIONS = [
    {
        id: 'bank_0',
        name: 'Bank 0 - HUD/Fonts',
        enabled: true,
        vramPatternStart: 0x0000,
        vramColorStart: 0x2000,
        screenZone: { x: 0, y: 0, width: exports.DEFAULT_SCREEN_WIDTH_TILES, height: 8 },
        charsetRangeStart: 0,
        charsetRangeEnd: 253,
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
        charsetRangeStart: 0,
        charsetRangeEnd: 253,
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
        charsetRangeStart: 0,
        charsetRangeEnd: 253,
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
                content: "\n          <h2>Welcome!</h2>\n          <p>This IDE is designed to help you create games for the MSX (MSX1/MSX2) platform.</p>\n          <p>Key features include:</p>\n          <ul>\n            <li>Visual Tile Editor</li>\n            <li>Sprite Editor with animation support</li>\n            <li>Screen Map Editor with Effect Zones</li>\n            <li>Integrated Z80 Code Editor with snippets</li>\n            <li>PT3 Music Tracker</li>\n            <li>Font Editor</li>\n            <li>And more!</li>\n          </ul>\n          <p>Use the <strong>File Explorer</strong> on the left to manage your assets. Create new assets using the <strong>Toolbar</strong> at the top.</p>\n          <p>Select an asset to open its dedicated editor. Properties for the selected asset or element will appear in the <strong>Properties Panel</strong> on the right.</p>\n        ",
                tags: ["introduction", "overview"],
            },
            {
                id: "toolbar_overview",
                title: "Toolbar Overview",
                content: "\n          <h2>Toolbar Guide</h2>\n          <p>The main toolbar provides quick access to common actions:</p>\n          <ul>\n            <li><strong>New Project</strong>: Clears current work and sets up a new project structure (main.asm, etc.).</li>\n            <li><strong>Load/Save/Save As</strong>: Standard project file operations (saves as .json).</li>\n            <li><strong>New Asset</strong>: Dropdown to create Tiles, Sprites, Screen Maps, Code files, etc.</li>\n            <li><strong>Undo/Redo</strong>: Reverts or reapplies recent changes.</li>\n            <li><strong>Tile Banks/Font Editor</strong>: Opens specialized editors for Screen 2 graphics management and MSX1 font editing.</li>\n            <li><strong>Compile (Mock)</strong>: Placeholder for future compilation integration.</li>\n            <li><strong>Debug/Run (Mock)</strong>: Placeholders for debugging and emulator launching.</li>\n            <li><strong>Configure</strong>: Dropdown for IDE settings (Data Output, Autosave, Theme, etc.).</li>\n            <li><strong>Tutorials</strong>: Opens this Help & Documentation viewer.</li>\n          </ul>\n        ",
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
                content: "\n          <h2>Sprite Editor Basics</h2>\n          <p>The Sprite Editor allows you to create and animate game characters and objects.</p>\n          <h3>Key Areas:</h3>\n          <ul>\n            <li><strong>Left Panel (Tools & Palette)</strong>:\n                <ul>\n                    <li><strong>Tools</strong>: Switch between Draw and Erase (uses background color).</li>\n                    <li><strong>Active Brush</strong>: Select one of the 4 sprite palette colors to draw with.</li>\n                    <li><strong>Define Sprite Colors</strong>: Assign MSX colors to the 4 sprite palette slots and the sprite's background color. Click a slot, then pick from the main MSX Palette Panel.</li>\n                </ul>\n            </li>\n            <li><strong>Center Panel (Pixel Grid)</strong>: The main drawing canvas for the current frame.</li>\n            <li><strong>Right Panel (Frame Management & Preview)</strong>:\n                <ul>\n                    <li><strong>Animation Preview</strong>: Shows a small preview of the current frame.</li>\n                    <li><strong>Frame Control</strong>: Add, duplicate, delete, or navigate between animation frames.</li>\n                    <li><strong>Transform Frame</strong>: Tools to shift, rotate (square sprites), clear, or contract the current frame.</li>\n                    <li><strong>Generate Explosion</strong>: A utility to create animated explosion sprite sequences.</li>\n                </ul>\n            </li>\n          </ul>\n          <h3>Tips:</h3>\n          <ul>\n            <li>Sprites use a 4-color palette + 1 background color for transparency/erasing.</li>\n            <li>MSX sprites have hardware limitations (e.g., max sprites per line). Keep this in mind for your game design.</li>\n            <li>Use the \"Export ASM\" button to get Z80 assembly data for your sprite.</li>\n          </ul>\n        ",
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
                content: "\n          <h2>Screen Editor Basics</h2>\n          <p>The Screen Editor is used to design game levels and layouts by placing tiles.</p>\n          <h3>Layers:</h3>\n          <p>The editor supports multiple layers:</p>\n          <ul>\n            <li><strong>Background</strong>: The main visual layer for your map.</li>\n            <li><strong>Collision</strong>: Defines areas where the player/entities cannot pass. Tiles placed here act as collision markers.</li>\n            <li><strong>Effects</strong>: Used to define rectangular zones for gameplay effects (e.g., water, ice, custom gravity, sprite concealment). Edit properties of these zones in the Properties Panel.</li>\n            <li><strong>Entities</strong>: Place game entities like player start, enemies, items.</li>\n          </ul>\n          <h3>Tools & Panels:</h3>\n          <ul>\n            <li><strong>Tileset Panel (Left)</strong>: Shows available tiles. Click a tile to select it for drawing on Background/Collision layers. Hidden when 'Effects' layer is active.</li>\n            <li><strong>Entity Types Panel (Right, when Entity layer active)</strong>: Lists mock entity types. Select one to place instances on the map.</li>\n            <li><strong>Properties Panel (Right)</strong>: Shows properties of the selected map, entity instance, or effect zone.</li>\n            <li><strong>Active Area</strong>: Defines the playable portion of the screen map. Areas outside can be used for HUD elements. Editable via input fields in the toolbar.</li>\n            <li><strong>Toolbar (Screen Editor)</strong>: Contains layer selectors, zoom, active area inputs, HUD editor button, and export options. When 'Effects' layer is active, an \"Add Effect Zone\" button appears.</li>\n          </ul>\n          <h3>Effect Zones:</h3>\n          <p>On the 'Effects' layer, you can add rectangular zones. Each zone has:</p>\n          <ul>\n            <li>A name.</li>\n            <li>Position (x,y) and Size (width, height) in grid cells.</li>\n            <li>An <strong>Effect Mask</strong>: A byte value where each bit represents a different effect (e.g., bit 0 for water, bit 1 for ice). You can toggle these effects using checkboxes in the Properties Panel.</li>\n          </ul>\n          <h3>SCREEN 2 Specifics:</h3>\n          <p>When in SCREEN 2 mode:</p>\n          <ul>\n            <li>Tiles are typically 8x8 character blocks.</li>\n            <li><strong>Tile Banks</strong> become crucial for managing character codes and colors. Assign your 8x8 tiles to banks. The Screen Editor will use these bank assignments to resolve tile placements into character codes for export.</li>\n            <li>The editor's base cell dimension is 8x8.</li>\n          </ul>\n        ",
                tags: ["screenmap", "level design", "tiles", "effect zones"],
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
    var variable = exports.MIDEAS_GLOBAL_VARIABLES.find(function (v) { return v.name === variableName; });
    return (variable === null || variable === void 0 ? void 0 : variable.values) || [];
}
/**
 * Get variable by name
 */
function getMideasVariable(variableName) {
    return exports.MIDEAS_GLOBAL_VARIABLES.find(function (v) { return v.name === variableName; });
}
// --- End Mideas Global Variables Dictionary ---
