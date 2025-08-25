import { MSXColor, MSX1Color, MSX1ColorValue, TileBank, PianoKeyLayoutEntry, HelpDocSection, Snippet, EFFECT_ZONE_FLAGS as EFFECT_ZONE_FLAGS_TYPE, MainMenuConfig } from './types';

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


export const EDITABLE_TILE_DIMENSIONS: number[] = [8, 16, 24, 32]; 
export const DEFAULT_TILE_WIDTH = 16;
export const DEFAULT_TILE_HEIGHT = 16;

export const DEFAULT_SPRITE_SIZE = 16; 
export const DEFAULT_SCREEN_WIDTH_TILES = 32; 
export const DEFAULT_SCREEN_HEIGHT_TILES = 24;
export const EDITOR_BASE_TILE_DIM_S2 = 8; // Added for Screen 2 character block size
export const EMPTY_CELL_CHAR_CODE = 255; // Added this constant

export const SCREEN_MODES = ["SCREEN 0 (Text 40)", "SCREEN 1 (Text 32)", "SCREEN 2 (Graphics I)", "SCREEN 3 (Multicolor)", "SCREEN 4 (Graphics II)", "SCREEN 5 (Graphics III)", "SCREEN 6 (Graphics IV)", "SCREEN 7 (Graphics V)", "SCREEN 8 (Graphics VI)"];
export const DEFAULT_SCREEN_MODE = "SCREEN 2 (Graphics I)"; 

export const Z80_MNEMONICS = [
  "ADC", "ADD", "AND", "BIT", "CALL", "CCF", "CP", "CPD", "CPDR", "CPI", "CPIR",
  "CPL", "DAA", "DEC", "DI", "DJNZ", "EI", "EX", "EXX", "HALT", "IM", "IN", "INC",
  "IND", "INDR", "INI", "INIR", "JP", "JR", "LD", "LDD", "LDDR", "LDI", "LDIR",
  "NEG", "NOP", "OR", "OTDR", "OTIR", "OUT", "OUTD", "OUTI", "POP", "PUSH", "RES",
  "RET", "RETI", "RETN", "RL", "RLA", "RLC", "RLCA", "RLD", "RR", "RRA", "RRC",
  "RRCA", "RRD", "RST", "SBC", "SCF", "SET", "SLA", "SLL", "SRA", "SRL", "SUB", "XOR"
];
export const Z80_REGISTERS = [
  "A", "F", "B", "C", "D", "E", "H", "L", "AF", "BC", "DE", "HL",
  "IXH", "IXL", "IYH", "IYL", "IX", "IY", "SP", "PC", "I", "R", "AF'"
];
export const Z80_CONDITIONS = [
  "NZ", "Z", "NC", "C", "PO", "PE", "P", "M"
];
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

// The Z80 snippets are now located in the src/asm/snippets directory.
// In a real application, you would likely have a build step or a dynamic loading
// mechanism to populate these arrays from the file system.
export const Z80_SNIPPETS: Snippet[] = [];
export const Z80_BEHAVIOR_SNIPPETS: Snippet[] = [];


export const SCREEN2_PIXELS_PER_COLOR_SEGMENT = 8;
export const DEFAULT_SCREEN2_FG_COLOR_INDEX = 15; // White
export const DEFAULT_SCREEN2_BG_COLOR_INDEX = 1;  // Black
export const DEFAULT_SCREEN2_FG_COLOR = MSX1_PALETTE.find(c => c.index === DEFAULT_SCREEN2_FG_COLOR_INDEX)?.hex || MSX1_PALETTE[15].hex;
export const DEFAULT_SCREEN2_BG_COLOR = MSX1_PALETTE.find(c => c.index === DEFAULT_SCREEN2_BG_COLOR_INDEX)?.hex || MSX1_PALETTE[1].hex;


export const MSX1_PALETTE_MAP: Map<MSX1ColorValue, MSX1Color> = new Map(MSX1_PALETTE.map(c => [c.hex, c]));
export const MSX1_PALETTE_IDX_MAP: Map<number, MSX1Color> = new Map(MSX1_PALETTE.map(c => [c.index, c]));
export const MSX1_DEFAULT_COLOR: MSX1Color = MSX1_PALETTE[1]; // Default to black if lookup fails

// --- PT3 Tracker Constants ---
export const DEFAULT_PT3_ROWS_PER_PATTERN = 32; // Changed from 64 to 32
export const DEFAULT_PT3_BPM = 125;
export const DEFAULT_PT3_SPEED = 6; // Ticks per row
export const PT3_MAX_PATTERNS = 100; // PT3 standard max patterns
export const PT3_MAX_INSTRUMENTS = 31;
export const PT3_MAX_ORNAMENTS = 15;
export const PT3_CHANNELS = ['A', 'B', 'C'] as const;

export const PT3_NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
export const PT3_DEFAULT_VIBRATO_TABLE: number[] = [
  0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 
  7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0
];
export const PT3_ORNAMENT_LENGTH = 32; // Bytes per ornament data block
export const PT3_INSTRUMENT_DATA_SIZE = 68; // Bytes per instrument data block

// Keyboard mapping for piano-style input
// Maps lowercase key character to { noteNameIndex (0-11 for C to B), baseOctave }
// This layout is based on the final set of definitions from the original file,
// resolving duplicate key errors by using the last specified mapping for each key.
export const PT3_PIANO_KEY_LAYOUT: Record<string, PianoKeyLayoutEntry> = {
  // Octave 5 (Q to P, then [, ])
  'q': { noteNameIndex: 0, baseOctave: 5}, 'w': {noteNameIndex: 1, baseOctave: 5}, 
  'e': { noteNameIndex: 2, baseOctave: 5}, 'r': {noteNameIndex: 3, baseOctave: 5},
  't': { noteNameIndex: 4, baseOctave: 5}, 'y': {noteNameIndex: 5, baseOctave: 5},
  'u': { noteNameIndex: 6, baseOctave: 5}, 'i': {noteNameIndex: 7, baseOctave: 5},
  'o': { noteNameIndex: 8, baseOctave: 5}, 'p': {noteNameIndex: 9, baseOctave: 5},
  '[': { noteNameIndex: 10, baseOctave: 5}, ']': {noteNameIndex: 11, baseOctave: 5},

  // Octave 4 (A to Ñ/;, then ')
  'a': { noteNameIndex: 0, baseOctave: 4}, 's': {noteNameIndex: 1, baseOctave: 4},
  'd': { noteNameIndex: 2, baseOctave: 4}, 'f': {noteNameIndex: 3, baseOctave: 4},
  'g': { noteNameIndex: 4, baseOctave: 4}, 'h': {noteNameIndex: 5, baseOctave: 4},
  'j': { noteNameIndex: 6, baseOctave: 4}, 'k': {noteNameIndex: 7, baseOctave: 4},
  'l': { noteNameIndex: 8, baseOctave: 4}, 
  'ñ': { noteNameIndex: 9, baseOctave: 4}, // For Spanish keyboard
  ';': { noteNameIndex: 9, baseOctave: 4}, // For US layout (A4). If 'ñ' is typed, 'ñ' mapping takes precedence if key event differs.
  "'": { noteNameIndex: 10, baseOctave: 4}, // US layout (A#4)

  // Octave 3 (Z to .)
  'z': { noteNameIndex: 0, baseOctave: 3}, 'x': {noteNameIndex: 1, baseOctave: 3},
  'c': { noteNameIndex: 2, baseOctave: 3}, 'v': {noteNameIndex: 3, baseOctave: 3},
  'b': { noteNameIndex: 4, baseOctave: 3}, 'n': {noteNameIndex: 5, baseOctave: 3},
  'm': { noteNameIndex: 6, baseOctave: 3}, 
  ',': { noteNameIndex: 7, baseOctave: 3}, 
  '.': { noteNameIndex: 8, baseOctave: 3},
  // Keys from earlier definitions that don't conflict with the above final block
  '2': { noteNameIndex: 1, baseOctave: 5 }, // C#5 (from num row)
  '3': { noteNameIndex: 3, baseOctave: 5 }, // D#5 (from num row)
  '5': { noteNameIndex: 6, baseOctave: 5 }, // F#5 (from num row)
  '6': { noteNameIndex: 8, baseOctave: 5 }, // G#5 (from num row)
  '7': { noteNameIndex: 10, baseOctave: 5 },// A#5 (from num row)
};


export const PT3_KEYBOARD_OCTAVE_MIN_MAX = { min: -2, max: 2 };
// --- End PT3 Tracker Constants ---


// --- Tile Bank Constants (New) ---
export const DEFAULT_TILE_BANKS_CONFIG: TileBank[] = [
  {
    id: 'bank_hud',
    name: 'HUD Elements',
    enabled: true,
    vramPatternStart: 0x0000, 
    vramColorStart: 0x2000,   
    screenZone: { x: 0, y: 0, width: DEFAULT_SCREEN_WIDTH_TILES, height: 3 }, 
    charsetRangeStart: 0,
    charsetRangeEnd: 31,
    defaultFgColorIndex: 15, 
    defaultBgColorIndex: 4,  
    isLocked: false,
    assignedTiles: {},
  },
  {
    id: 'bank_main_game',
    name: 'Main Game Area',
    enabled: true,
    vramPatternStart: 0x0100, 
    vramColorStart: 0x2100,   
    screenZone: { x: 0, y: 3, width: DEFAULT_SCREEN_WIDTH_TILES, height: DEFAULT_SCREEN_HEIGHT_TILES - 3 - 2 }, 
    charsetRangeStart: 32,
    charsetRangeEnd: 191,    
    defaultFgColorIndex: 2,  
    defaultBgColorIndex: 1,  
    isLocked: false,
    assignedTiles: {},
  },
  {
    id: 'bank_status_menu',
    name: 'Status/Menu Area',
    enabled: true,
    vramPatternStart: 0x0600, 
    vramColorStart: 0x2600,   
    screenZone: { x: 0, y: DEFAULT_SCREEN_HEIGHT_TILES - 2, width: DEFAULT_SCREEN_WIDTH_TILES, height: 2 }, 
    charsetRangeStart: 192,
    charsetRangeEnd: 255,
    defaultFgColorIndex: 11, 
    defaultBgColorIndex: 6,  
    isLocked: false,
    assignedTiles: {},
  },
];
// --- End Tile Bank Constants ---

// --- Main Menu Constants ---
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

// --- Game Flow Constants ---
export const DEFAULT_GAME_FLOW: GameFlow = {
  nodes: [
    { id: 'root', position: { x: 50, y: 50 }, link: { type: 'Unlinked' } }
  ],
  submenus: [],
  rootNodeId: 'root',
  view: {
    panOffset: { x: 0, y: 0 },
    zoomLevel: 1,
  }
};
// --- End Game Flow Constants ---

// --- Effect Zone Constants ---
// Re-export EFFECT_ZONE_FLAGS from types.ts for easier access
export const EFFECT_ZONE_FLAGS = EFFECT_ZONE_FLAGS_TYPE;
// --- End Effect Zone Constants ---


// --- Help & Documentation Constants ---
export const HELP_DOCS_SYSTEM_ASSET_ID = "HELP_DOCS_SYSTEM_ASSET";

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

export const MAX_HISTORY_LENGTH = 50;
