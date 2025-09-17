/**
 * @fileoverview MSX Modular ASM Generator
 * Generates multiple specialized ASM files for better maintainability
 */

import { ProjectAsset, ComponentDefinition, EntityTemplate, Sprite, Tile, ScreenMap, EntityInstance, GameFlowGraph } from '../types';
import { generateScreenLayoutASMCode, generateBehaviorMapASMCode, generateScreenMapLayoutBytes } from '../components/utils/screenUtils';
import { generateTilePatternBytes, generateTileColorBytes } from '../components/utils/tileUtils';
import { generateSpriteASMCode } from '../components/utils/spriteUtils';
import { pixelDataToPattern } from './z80CodeGenerator';
import { DEFAULT_TILE_BANKS_CONFIG } from '../constants';
import { TileBank } from '../types';
import { analyzeProject, ProjectAnalysis } from './asmTemplateGenerator';

/**
 * MSX Modular configuration
 */
export interface MSXModularConfig {
  projectName: string;
  targetMSX: 'MSX1' | 'MSX2' | 'MSX2+';
  generateUnified: boolean;
  outputDir: string;
}

/**
 * Generated ASM files structure
 */
export interface GeneratedASMFiles {
  'bios.asm': string;
  'constants.asm': string;
  'variables.asm': string;
  'header.asm': string;
  'components.asm': string;
  'entities.asm': string;
  'screens.asm': string;
  'patterns.asm': string;
  'colors.asm': string;
  'sprites.asm': string;
  'menus.asm': string;
  'main.asm': string;
  'unitedFiles.asm'?: string; // Optional unified file
}

/**
 * Generate BIOS functions and addresses (bios.asm)
 */
function generateBIOSFile(): string {
  return `; ==================================================================
; MSX BIOS FUNCTIONS AND ADDRESSES
; File: bios.asm
; Description: Standard MSX BIOS function definitions
; ==================================================================

; ==================================================================
; MAIN BIOS FUNCTIONS
; ==================================================================

; Screen and Display
CHGMOD  EQU #005F        ; Change screen mode (A=mode)
CLS     EQU #00C3        ; Clear screen
POSIT   EQU #00C6        ; Position cursor (H=X, L=Y)
ERAFNK  EQU #00CC        ; Erase function keys
DSPFNK  EQU #00CF        ; Display function keys

; Character I/O
CHPUT   EQU #00A2        ; Character output (A=char)
CHGET   EQU #009F        ; Character input
CHSNS   EQU #009C        ; Character sense (check key)
BREAKX  EQU #00B7        ; Check CTRL+STOP
ISCNTC  EQU #00BA        ; Check CTRL+C

; String I/O
OUTDO   EQU #005A        ; String output (HL=string)

; Input Devices
GTSTCK  EQU #00D5        ; Get joystick status (A=port)
GTTRIG  EQU #00D8        ; Get trigger status (A=port)
GTPAD   EQU #00DB        ; Get paddle (A=port)
GTPDL   EQU #00DE        ; Get paddle value
SNSMAT  EQU #0141        ; Sense matrix (A=row)
KILBUF  EQU #0156        ; Kill keyboard buffer

; Sound
GICINI  EQU #0090        ; Initialize PSG
WRTPSG  EQU #0093        ; Write PSG register (A=reg, E=value)
RDPSG   EQU #0096        ; Read PSG register (A=reg)

; Graphics VDP
GRPPRT  EQU #0089        ; Print in graphic mode
SETGRP  EQU #007E        ; Set graphic mode

; Memory Transfer
LDIRVM  EQU #005C        ; Block transfer from CPU to VRAM
LDIRMV  EQU #0059        ; Block transfer from VRAM to CPU
WRTVRM  EQU #0047        ; Write data to VRAM (A=data, HL=address)

; File I/O (Disk BIOS)
DSKIO   EQU #004A        ; Disk I/O
DSKCHF  EQU #004D        ; Disk change flag

; Math
GETYPR  EQU #0053        ; Get type of variable

; ==================================================================
; VDP PORTS AND REGISTERS
; ==================================================================

; VDP Data/Status Ports
VDPDR   EQU #0098        ; VDP Data Register (Port 0)
VDPSR   EQU #0099        ; VDP Status Register (Port 1)

; VDP Registers (use with VDPSR)
VDP_R0  EQU 0            ; Mode register 0
VDP_R1  EQU 1            ; Mode register 1
VDP_R2  EQU 2            ; Name table base address
VDP_R3  EQU 3            ; Color table base address
VDP_R4  EQU 4            ; Pattern table base address
VDP_R5  EQU 5            ; Sprite attribute table
VDP_R6  EQU 6            ; Sprite pattern table
VDP_R7  EQU 7            ; Text/border color

; ==================================================================
; END OF BIOS DEFINITIONS
; ==================================================================
`;
}

/**
 * Generate MSX constants (constants.asm)
 */
function generateConstantsFile(analysis: ProjectAnalysis): string {
  return `; ==================================================================
; MSX SYSTEM CONSTANTS
; File: constants.asm
; Description: MSX hardware constants and project-specific definitions
; ==================================================================

; ==================================================================
; VRAM LAYOUT - SCREEN 2 MODE
; ==================================================================

; Pattern Generator Table (PGT) - 3 Banks
CHRTBL2 EQU #0000        ; Pattern table base address (Bank 0)
; Bank 1: CHRTBL2 + #800   (#0800)
; Bank 2: CHRTBL2 + #1000  (#1000)

; Color Attribute Table (CAT) - 3 Banks
CLRTBL2 EQU #2000        ; Color table base address (Bank 0)
; Bank 1: CLRTBL2 + #800   (#2800)
; Bank 2: CLRTBL2 + #1000  (#3000)

; Other VRAM Areas
NAMETBL EQU #1800        ; Name table base address
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table

; ==================================================================
; SCREEN MODES
; ==================================================================
SCREEN0     EQU 0        ; 40x24 text
SCREEN1     EQU 1        ; 32x24 text/graphics
SCREEN2     EQU 2        ; 256x192 graphics
SCREEN3     EQU 3        ; 64x48 multicolor

; ==================================================================
; SCREEN DIMENSIONS
; ==================================================================
SCREEN_WIDTH    EQU 32   ; Tiles horizontales (Screen 1/2)
SCREEN_HEIGHT   EQU 24   ; Tiles verticales
TILE_SIZE       EQU 8    ; 8x8 pixels por tile

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
MAX_SPRITES     EQU 32   ; Máximo sprites por pantalla
SPRITE_SIZE     EQU 8    ; 8x8 o 16x16 (según modo)
SPRITE_INVISIBLE EQU #D1 ; Y=209 (sprite fuera de pantalla)

; ==================================================================
; MSX COLORS
; ==================================================================
TRANSPARENT EQU 0
BLACK       EQU 1
MEDIUM_GREEN EQU 2
LIGHT_GREEN EQU 3
DARK_BLUE   EQU 4
LIGHT_BLUE  EQU 5
DARK_RED    EQU 6
CYAN        EQU 7
MEDIUM_RED  EQU 8
LIGHT_RED   EQU 9
DARK_YELLOW EQU 10
LIGHT_YELLOW EQU 11
DARK_GREEN  EQU 12
MAGENTA     EQU 13
GRAY        EQU 14
WHITE       EQU 15

; ==================================================================
; INPUT CONSTANTS
; ==================================================================

; Joystick Directions
STICK_UP    EQU 1
STICK_UPRIGHT EQU 2
STICK_RIGHT EQU 3
STICK_DOWNRIGHT EQU 4
STICK_DOWN  EQU 5
STICK_DOWNLEFT EQU 6
STICK_LEFT  EQU 7
STICK_UPLEFT EQU 8
STICK_CENTER EQU 0

; Trigger Constants
TRIG_A      EQU #10      ; Trigger A (Fire)
TRIG_B      EQU #20      ; Trigger B (MSX2+)

; ==================================================================
; GAME FLOW STATES (PROJECT-SPECIFIC)
; ==================================================================

; Basic Game Flow States (always available)
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4
${analysis.gameFlow ? `
; Additional Game Flow States detected in project
; (Custom states would be added here if needed)
` : `
; Using default game flow system
`}

; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU ${analysis.sprites.length}
TOTAL_TILES             EQU ${analysis.tiles.length}
TOTAL_SCREENS           EQU ${analysis.screenMaps.length}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`;
}

/**
 * Generate RAM variables with EQU addresses (variables.asm)
 */
function generateVariablesFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`;

  let currentAddress = 0xC000;

  // Core variables (always needed)
  code += `input_state         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current joystick/keyboard state\n`;
  currentAddress++;

  code += `prev_input_state    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous input state\n`;
  currentAddress++;

  code += `current_flow_state  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current game flow state\n`;
  currentAddress++;

  code += `prev_flow_state     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous game flow state\n`;
  currentAddress++;

  // Frame counter (always useful)
  code += `frame_counter       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame counter (16-bit)\n`;
  currentAddress += 2;

  // Sprite system variables (only if sprites exist)
  if (analysis.sprites.length > 0) {
    code += `
; ==================================================================
; SPRITE SYSTEM VARIABLES (${analysis.sprites.length} sprites detected)
; ==================================================================
`;
    code += `active_sprite_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of sprites currently active\n`;
    currentAddress++;

    code += `sprite_x_pos        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite X positions (32 bytes)\n`;
    currentAddress += 32;

    code += `sprite_y_pos        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite Y positions (32 bytes)\n`;
    currentAddress += 32;

    code += `sprite_pattern      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite pattern IDs (32 bytes)\n`;
    currentAddress += 32;

    code += `sprite_color        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite colors (32 bytes)\n`;
    currentAddress += 32;
  }

  // Screen system variables (only if screens exist)
  if (analysis.screenMaps.length > 0) {
    code += `
; ==================================================================
; SCREEN SYSTEM VARIABLES (${analysis.screenMaps.length} screens detected)
; ==================================================================
`;
    code += `current_screen_id   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Currently displayed screen ID\n`;
    currentAddress++;

    code += `screen_dirty_flag   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Screen needs redraw flag\n`;
    currentAddress++;
  }

  // Player variables (detect if there's a player entity)
  const hasPlayer = analysis.sprites.some(s => s.name.toLowerCase().includes('player'));

  if (hasPlayer) {
    code += `
; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
`;
    code += `player_x            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player X position (16-bit)\n`;
    currentAddress += 2;

    code += `player_y            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player Y position (16-bit)\n`;
    currentAddress += 2;

    code += `player_health       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player health points\n`;
    currentAddress++;

    code += `player_score        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player score (16-bit)\n`;
    currentAddress += 2;
  }

  // Temporary variables (always needed)
  code += `
; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
`;
  code += `temp_word_1         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage\n`;
  currentAddress += 2;

  code += `temp_word_2         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage\n`;
  currentAddress += 2;

  code += `temp_byte_1         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage\n`;
  currentAddress++;

  code += `temp_byte_2         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage\n`;
  currentAddress++;

  // End marker
  code += `
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; End of project variables (${currentAddress - 0xC000} bytes used)

; ==================================================================
; MEMORY SAFETY CHECK
; ==================================================================
; RAM Layout:
;   #C000-#${currentAddress.toString(16).toUpperCase().padStart(4, '0')}: Project variables (${currentAddress - 0xC000} bytes)
;   #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}-#F37F: Free RAM (~${0xF380 - currentAddress} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
; ==================================================================
`;

  return code;
}

/**
 * Generate ROM header with "AB" signature (header.asm)
 */
function generateHeaderFile(projectName: string): string {
  return `; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization
; ==================================================================

    ORG #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    DB "AB"             ; MSX cartridge signature
    DW INIT_ROM         ; Initialization address
    DW 0                ; Statement handler (not used)
    DW 0                ; Device handler (not used)
    DW 0                ; Text handler (not used)
    DW 0                ; Reserved
    DW 0                ; Reserved
    DW 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
INIT_ROM:
    ; Disable interrupts during initialization
    DI

    ; Initialize stack for cartridge
    LD SP, #F380

    ; Initialize project RAM variables area (SAFE - only project variables)
    ; Clear ONLY project variables zone, NOT system variables (#F380+)
    LD HL, input_state           ; First project variable
    LD DE, input_state+1         ; Next byte
    LD BC, RAM_USAGE_END - input_state - 1  ; Only to end of project vars
    LD (HL), 0
    LDIR

    ; Initialize VDP for Screen 2
    LD A, 2
    CALL CHGMOD         ; Set Screen 2 mode

    ; Clear screen
    CALL CLS

    ; Enable interrupts
    EI

    ; Jump to main program
    JP MAIN_PROGRAM

; ==================================================================
; END OF HEADER
; ==================================================================
`;
}

/**
 * Generate main.asm with ordered imports
 */
function generateMainFile(projectName: string, analysis: ProjectAnalysis): string {
  return `; ==================================================================
; ${projectName.toUpperCase()} - MAIN ASSEMBLY FILE
; File: main.asm
; Description: Main file with ordered imports for MSX cartridge
; Generated by Mideas MSX Generator
; ==================================================================

; ==================================================================
; ORDERED INCLUDES - RIGOROUS ORDER MATTERS!
; ==================================================================

; 1. BIOS Functions (must be first)
INCLUDE "bios.asm"

; 2. Constants (depends on BIOS)
INCLUDE "constants.asm"

; 3. Variables (depends on constants)
INCLUDE "variables.asm"

; 4. ROM Header (depends on variables)
INCLUDE "header.asm"

${analysis.tiles.length > 0 ? `; 5. Pattern Data (if tiles exist)
INCLUDE "patterns.asm"

; 6. Color Data (if tiles exist)
INCLUDE "colors.asm"
` : ''}

${analysis.sprites.length > 0 ? `; 7. Sprite Data (if sprites exist)
INCLUDE "sprites.asm"
` : ''}

${analysis.screenMaps.length > 0 ? `; 8. Screen Maps (if screens exist)
INCLUDE "screens.asm"
` : ''}

; 9. Components (game logic)
INCLUDE "components.asm"

; 10. Entities (game objects)
INCLUDE "entities.asm"

; 11. Menus (user interface)
INCLUDE "menus.asm"

; ==================================================================
; MAIN PROGRAM ENTRY POINT
; ==================================================================
MAIN_PROGRAM:
    ; Initialize game systems
    CALL INIT_GAME_SYSTEMS

    ; Initialize Game Flow system
    XOR A
    LD (current_flow_state), A
    LD (prev_flow_state), A

    ; Start with main menu
    LD A, FLOW_STATE_MAIN_MENU
    LD (current_flow_state), A

    ; Main game loop
MAIN_LOOP:
    HALT                 ; Wait for V-Blank

    ; Update current game state
    CALL UPDATE_CURRENT_STATE

    ; Render current frame
    CALL RENDER_FRAME

    ; Loop forever
    JP MAIN_LOOP

; ==================================================================
; GAME SYSTEM FUNCTIONS (implemented in components.asm)
; ==================================================================
INIT_GAME_SYSTEMS:
    ; Initialize all game systems
    ; This function is implemented in the unified assembly
    ; and calls component initialization functions
    CALL INIT_COMPONENTS
    CALL INIT_SPRITES
    RET

UPDATE_CURRENT_STATE:
    ; Update game logic based on current state
    ; This function is implemented in the unified assembly
    ; and updates all component systems
    CALL UPDATE_INPUT_COMPONENT
    CALL UPDATE_POSITION_COMPONENT
    CALL UPDATE_MOVEMENT_COMPONENT
    CALL UPDATE_COLLISION_COMPONENT
    CALL UPDATE_SPRITE_COMPONENT
    RET

RENDER_FRAME:
    ; Render current frame
    ; This function is implemented in the unified assembly
    ; Game rendering is handled by component systems
    RET

; ==================================================================
; END OF MAIN PROGRAM
; ==================================================================
    END                 ; End of assembly
`;
}

/**
 * Generate pattern data file (patterns.asm)
 */
function generatePatternsFile(analysis: ProjectAnalysis): string {
  if (analysis.tiles.length === 0) {
    return `; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
  }

  return `; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${analysis.tiles.length} tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
TILE_PATTERN_BANK0:
${analysis.tiles.map((tile, index) => {
  // Generate actual pattern bytes using the same function as MSX Main Generator
  const patternBytes = generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)');
  const bytesHex = Array.from(patternBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);

  return `    ; Tile ${index}: ${tile.name} (${tile.width}x${tile.height}px)
    DB ${bytesHex.join(', ')}
`;
}).join('')}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
LOAD_PATTERN_BANK0:
    ; Load pattern bank 0 to VRAM (base patterns)
    LD HL, TILE_PATTERN_BANK0
    LD DE, CHRTBL2                ; VRAM pattern table bank 0
    LD BC, ${analysis.tiles.length} * 8    ; ${analysis.tiles.length} patterns × 8 bytes
    CALL LDIRVM                   ; Use BIOS function
    RET

LOAD_PATTERN_BANK1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0
    LD DE, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)
    LD BC, ${analysis.tiles.length} * 8    ; ${analysis.tiles.length} patterns × 8 bytes
    CALL LDIRVM                   ; Use BIOS function
    RET

LOAD_PATTERN_BANK2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0
    LD DE, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)
    LD BC, ${analysis.tiles.length} * 8    ; ${analysis.tiles.length} patterns × 8 bytes
    CALL LDIRVM                   ; Use BIOS function
    RET

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`;
}

/**
 * Generate color data file (colors.asm)
 */
function generateColorsFile(analysis: ProjectAnalysis): string {
  if (analysis.tiles.length === 0) {
    return `; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
  }

  return `; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${analysis.tiles.length} tiles detected
; ==================================================================

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
TILE_COLOR_BANK0:
${analysis.tiles.map((tile, index) => {
  // Generate actual color bytes using the same function as MSX Main Generator
  const colorBytes = generateTileColorBytes(tile);
  const bytesHex = colorBytes ?
    Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
    ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0']; // Default white/black if no color data

  return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)
    DB ${bytesHex.join(', ')}
`;
}).join('')}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
LOAD_COLOR_BANK0:
    ; Load color bank 0 to VRAM (base colors)
    LD HL, TILE_COLOR_BANK0
    LD DE, CLRTBL2                ; VRAM color table bank 0
    LD BC, ${analysis.tiles.length} * 8     ; ${analysis.tiles.length} patterns × 8 bytes
    CALL LDIRVM                   ; Use BIOS function
    RET

LOAD_COLOR_BANK1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0
    LD DE, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)
    LD BC, ${analysis.tiles.length} * 8     ; ${analysis.tiles.length} patterns × 8 bytes
    CALL LDIRVM                   ; Use BIOS function
    RET

LOAD_COLOR_BANK2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0
    LD DE, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)
    LD BC, ${analysis.tiles.length} * 8     ; ${analysis.tiles.length} patterns × 8 bytes
    CALL LDIRVM                   ; Use BIOS function
    RET

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`;
}

/**
 * Generate unified file (unitedFiles.asm) - optional
 */
function generateUnifiedFile(files: GeneratedASMFiles, projectName: string): string {
  return `; ==================================================================
; ${projectName.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
; ==================================================================

${files['header.asm']}

${files['bios.asm']}

${files['constants.asm']}

${files['variables.asm']}

${files['patterns.asm']}

${files['colors.asm']}

${files['sprites.asm']}

${files['screens.asm']}

${files['components.asm']}

${files['entities.asm']}

${files['menus.asm']}

; ==================================================================
; MAIN PROGRAM (from main.asm - excluding includes)
; ==================================================================
MAIN_PROGRAM:
    ; Initialize game systems
    CALL INIT_GAME_SYSTEMS

    ; Initialize Game Flow system
    XOR A
    LD (current_flow_state), A
    LD (prev_flow_state), A

    ; Start with main menu
    LD A, FLOW_STATE_MAIN_MENU
    LD (current_flow_state), A

    ; Main game loop
MAIN_LOOP:
    HALT                 ; Wait for V-Blank
    CALL UPDATE_CURRENT_STATE
    CALL RENDER_FRAME
    JP MAIN_LOOP

; ==================================================================
; GAME SYSTEM FUNCTIONS (implemented)
; ==================================================================

INIT_GAME_SYSTEMS:
    ; Initialize MSX hardware and game systems
    LD A, SCREEN2
    CALL CHGMOD               ; Set Screen 2 mode
    CALL ERAFNK               ; Remove function keys

    ; Initialize component systems
    CALL INIT_COMPONENTS

    ; Initialize sprite system if available
    CALL INIT_SPRITES

    ; Initialize sound system
    CALL GICINI               ; Initialize PSG

    ; Clear screen
    CALL CLS

    ; Show initial startup message
    LD H, 1                    ; Row 1
    LD L, 1                    ; Column 1
    CALL POSIT

    LD HL, txt_system_init
    CALL OUTDO

    RET

UPDATE_CURRENT_STATE:
    ; Update game logic based on current flow state
    LD A, (current_flow_state)
    CP FLOW_STATE_MAIN_MENU
    JP Z, UPDATE_MAIN_MENU_STATE
    CP FLOW_STATE_GAME
    JP Z, UPDATE_GAME_STATE
    CP FLOW_STATE_PAUSE
    JP Z, UPDATE_PAUSE_STATE
    CP FLOW_STATE_GAME_OVER
    JP Z, UPDATE_GAME_OVER_STATE
    CP FLOW_STATE_CREDITS
    JP Z, UPDATE_CREDITS_STATE
    RET

UPDATE_MAIN_MENU_STATE:
    ; Handle main menu input and logic
    CALL UPDATE_INPUT_COMPONENT

    ; Menu navigation logic would go here
    RET

UPDATE_GAME_STATE:
    ; Main gameplay logic - update all component systems
    CALL UPDATE_POSITION_COMPONENT
    CALL UPDATE_MOVEMENT_COMPONENT
    CALL UPDATE_COLLISION_COMPONENT
    CALL UPDATE_SPRITE_COMPONENT
    RET

UPDATE_PAUSE_STATE:
    ; Handle pause state
    CALL UPDATE_INPUT_COMPONENT

    ; Check for unpause input
    RET

UPDATE_GAME_OVER_STATE:
    ; Handle game over state
    CALL UPDATE_INPUT_COMPONENT

    ; Check for restart/menu input
    RET

UPDATE_CREDITS_STATE:
    ; Handle credits state
    ; Auto-advance credits or return to menu
    RET

RENDER_FRAME:
    ; Render current frame based on flow state
    ; Debug: Show frame indicator
    LD H, 23                   ; Bottom row
    LD L, 30                   ; Right side
    CALL POSIT
    LD A, '*'                  ; Frame indicator
    CALL CHPUT

    ; Check current flow state and render appropriately
    LD A, (current_flow_state)
    CP FLOW_STATE_MAIN_MENU
    JP Z, RENDER_MAIN_MENU
    CP FLOW_STATE_GAME
    JP Z, RENDER_GAME
    CP FLOW_STATE_PAUSE
    JP Z, RENDER_PAUSE
    CP FLOW_STATE_GAME_OVER
    JP Z, RENDER_GAME_OVER
    CP FLOW_STATE_CREDITS
    JP Z, RENDER_CREDITS

    ; Default: show unknown state debug info
    LD H, 2
    LD L, 1
    CALL POSIT
    LD HL, txt_debug_state
    CALL OUTDO
    RET

RENDER_MAIN_MENU:
    ; Render main menu interface
    CALL CLS                   ; Clear screen first

    ; Position cursor for title
    LD H, 8                    ; Row 8
    LD L, 10                   ; Column 10
    CALL POSIT

    ; Display title
    LD HL, txt_main_title
    CALL OUTDO

    ; Position cursor for menu option 1
    LD H, 12                   ; Row 12
    LD L, 12                   ; Column 12
    CALL POSIT

    LD HL, txt_start_game
    CALL OUTDO

    ; Position cursor for menu option 2
    LD H, 14                   ; Row 14
    LD L, 12                   ; Column 12
    CALL POSIT

    LD HL, txt_exit_game
    CALL OUTDO
    RET

RENDER_GAME:
    ; Render game frame - draw basic game screen
    ; Fill screen with pattern to show it's working
    LD HL, NAMETBL
    LD BC, 768                 ; 32x24 screen
    LD A, 46                   ; '.' character

FILL_GAME_SCREEN:
    LD (HL), A
    INC HL
    DEC BC
    LD A, B
    OR C
    JR NZ, FILL_GAME_SCREEN_CONTINUE
    JR GAME_SCREEN_DONE

FILL_GAME_SCREEN_CONTINUE:
    LD A, 46                   ; Restore character
    JP FILL_GAME_SCREEN

GAME_SCREEN_DONE:
    ; Display game status at top
    LD H, 1                    ; Row 1
    LD L, 1                    ; Column 1
    CALL POSIT

    LD HL, txt_game_mode
    CALL OUTDO
    RET

RENDER_PAUSE:
    ; Render pause overlay
    ; Position cursor in center
    LD H, 12                   ; Row 12 (center)
    LD L, 14                   ; Column 14 (center)
    CALL POSIT

    LD HL, txt_paused
    CALL OUTDO
    RET

RENDER_GAME_OVER:
    ; Render game over screen
    CALL CLS                   ; Clear screen

    ; Position cursor for game over message
    LD H, 10                   ; Row 10
    LD L, 12                   ; Column 12
    CALL POSIT

    LD HL, txt_game_over
    CALL OUTDO

    ; Position cursor for instruction
    LD H, 14                   ; Row 14
    LD L, 8                    ; Column 8
    CALL POSIT

    LD HL, txt_press_any_key
    CALL OUTDO
    RET

RENDER_CREDITS:
    ; Render credits screen
    CALL CLS                   ; Clear screen

    ; Position cursor for credits
    LD H, 8                    ; Row 8
    LD L, 8                    ; Column 8
    CALL POSIT

    LD HL, txt_credits
    CALL OUTDO
    RET

; Text strings for display
txt_system_init:    DB "MSX SYSTEM READY", 0
txt_debug_state:    DB "UNKNOWN STATE", 0
txt_main_title:     DB "MSX GAME ENGINE", 0
txt_start_game:     DB "1. START GAME", 0
txt_exit_game:      DB "2. EXIT", 0
txt_game_mode:      DB "GAME MODE", 0
txt_paused:         DB "PAUSED", 0
txt_game_over:      DB "GAME OVER", 0
txt_press_any_key:  DB "PRESS ANY KEY", 0
txt_credits:        DB "CREDITS: MIDEAS MSX", 0

    END                 ; End of assembly
`;
}

/**
 * Generate sprite data file (sprites.asm)
 */
function generateSpritesFile(analysis: ProjectAnalysis): string {
  if (analysis.sprites.length === 0) {
    return `; ==================================================================
; SPRITE DATA (EMPTY - NO SPRITES DETECTED)
; File: sprites.asm
; ==================================================================

; No sprites detected in project - file generated as placeholder

; ==================================================================
; SPRITE UTILITY FUNCTIONS (Available for future use)
; ==================================================================

; Clear all sprites (make them invisible)
CLEAR_ALL_SPRITES:
    LD HL, sprite_y_pos
    LD DE, sprite_y_pos+1
    LD BC, 31                     ; 32 sprites - 1
    LD (HL), SPRITE_INVISIBLE     ; Y=209 (invisible)
    LDIR
    RET

; Hide specific sprite (A = sprite number)
HIDE_SPRITE:
    LD HL, sprite_y_pos
    LD E, A
    LD D, 0
    ADD HL, DE                    ; HL points to sprite Y position
    LD (HL), SPRITE_INVISIBLE     ; Make invisible
    RET

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`;
  }

  let code = `; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; ${analysis.sprites.length} sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;

  // Generate sprite patterns using the EXACT same function as Sprite Editor "Download ASM"
  analysis.sprites.forEach((sprite, index) => {
    const safeSpriteName = sprite.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    const spriteASM = generateSpriteASMCode(sprite, 'hex');

    // Find the first layer that was actually generated by scanning the ASM output
    let firstLayerFound = -1;
    for (let layerIndex = 0; layerIndex < 4; layerIndex++) {
      const layerLabel = `${safeSpriteName}_F0_LAYER${layerIndex}:`;
      if (spriteASM.includes(layerLabel)) {
        firstLayerFound = layerIndex;
        break;
      }
    }

    code += `
; Sprite ${index}: ${sprite.name}
${spriteASM}`;

    if (firstLayerFound >= 0) {
      code += `
; Unified pattern label for sprite ${index} (for easy reference in loading code)
SPRITE_${index}_PATTERN EQU ${safeSpriteName}_F0_LAYER${firstLayerFound}
`;
    } else {
      code += `
; WARNING: No valid pattern layers found for sprite ${index}: ${sprite.name}
; Creating placeholder pattern label
SPRITE_${index}_PATTERN:
    DB 0, 0, 0, 0, 0, 0, 0, 0  ; 8 bytes of empty pattern data
`;
    }
  });

  code += `
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

INIT_SPRITES:
    ; Initialize sprite system
    CALL CLEAR_ALL_SPRITES

    ; Load sprite patterns to VRAM
    CALL LOAD_SPRITE_PATTERNS

    ; Initialize sprite positions (all invisible by default)
    XOR A
    LD (active_sprite_count), A

    RET

LOAD_SPRITE_PATTERNS:
    ; Load all sprite patterns to VRAM sprite pattern table
`;

  // Generate pattern loading for each sprite
  analysis.sprites.forEach((sprite, index) => {
    code += `
    ; Load sprite ${index}: ${sprite.name}
    LD HL, SPRITE_${index}_PATTERN
    LD DE, SPRPAT + (${index} * 8)  ; Each sprite pattern is 8 bytes
    LD BC, 8
    CALL LDIRVM
`;
  });

  code += `    RET

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; Show sprite (A = sprite number, B = X, C = Y, D = pattern, E = color)
SHOW_SPRITE:
    PUSH AF

    ; Set X position
    LD HL, sprite_x_pos
    LD A, E                       ; E was sprite number (from stack)
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), B                    ; Set X position

    ; Set Y position
    LD HL, sprite_y_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), C                    ; Set Y position

    ; Set pattern
    LD HL, sprite_pattern
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), D                    ; Set pattern number

    ; Set color
    LD HL, sprite_color
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), E                    ; Set color

    POP AF
    RET

; Clear all sprites (make them invisible)
CLEAR_ALL_SPRITES:
    LD HL, sprite_y_pos
    LD DE, sprite_y_pos+1
    LD BC, 31                     ; 32 sprites - 1
    LD (HL), SPRITE_INVISIBLE     ; Y=209 (invisible)
    LDIR
    RET

; Hide specific sprite (A = sprite number)
HIDE_SPRITE:
    LD HL, sprite_y_pos
    LD E, A
    LD D, 0
    ADD HL, DE                    ; HL points to sprite Y position
    LD (HL), SPRITE_INVISIBLE     ; Make invisible
    RET

; Update sprite positions to VRAM
UPDATE_SPRITES_TO_VRAM:
    ; Copy sprite attributes from RAM to VRAM
    LD HL, sprite_y_pos
    LD DE, SPRATR
    LD BC, 128                    ; 32 sprites * 4 bytes each
    CALL LDIRVM
    RET

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
`;

  // Generate sprite ID constants
  analysis.sprites.forEach((sprite, index) => {
    const spriteName = sprite.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    code += `SPRITE_ID_${spriteName}    EQU ${index}      ; Sprite: ${sprite.name}\n`;
  });

  code += `
; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`;

  return code;
}

/**
 * Generate components file with game component systems
 */
function generateComponentsFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; GAME COMPONENTS
; File: components.asm
; Description: Game component systems and logic
; ==================================================================

`;

  // Generate component types based on project analysis
  if (analysis.entities && analysis.entities.length > 0) {
    code += `; ==================================================================
; COMPONENT TYPES
; ==================================================================

`;

    // Generate component constants
    const componentTypes = new Set<string>();
    analysis.entities.forEach(entity => {
      if (entity.componentOverrides) {
        Object.keys(entity.componentOverrides).forEach(comp => componentTypes.add(comp));
      }
    });

    Array.from(componentTypes).forEach((comp, index) => {
      code += `COMP_${comp.toUpperCase().replace(/[^A-Z0-9]/g, '_')} EQU ${index}
`;
    });

    code += `
; ==================================================================
; COMPONENT SYSTEM FUNCTIONS
; ==================================================================

INIT_COMPONENTS:
    ; Initialize component system
    RET

`;

    // Generate component update functions
    Array.from(componentTypes).forEach(comp => {
      const compName = comp.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `UPDATE_${compName}_COMPONENT:
    ; Update ${comp} component logic
    ; TODO: Implement ${comp} component behavior
    RET

`;
    });
  } else {
    // Default component system for basic games
    code += `; ==================================================================
; DEFAULT COMPONENT SYSTEM
; ==================================================================

; Basic component types
COMP_POSITION   EQU 0
COMP_SPRITE     EQU 1
COMP_MOVEMENT   EQU 2
COMP_COLLISION  EQU 3

INIT_COMPONENTS:
    ; Initialize basic component system
    RET

UPDATE_POSITION_COMPONENT:
    ; Update position components
    RET

UPDATE_SPRITE_COMPONENT:
    ; Update sprite components
    RET

UPDATE_MOVEMENT_COMPONENT:
    ; Update movement components
    RET

UPDATE_COLLISION_COMPONENT:
    ; Update collision components
    RET

UPDATE_INPUT_COMPONENT:
    ; Update input handling
    LD A, 0                    ; Joystick port 0
    CALL GTSTCK                ; Get joystick status
    LD (input_state), A        ; Store current input state
    RET

`;
  }

  code += `; ==================================================================
; END OF COMPONENTS
; ==================================================================
`;

  return code;
}

/**
 * Generate entities file with game entity definitions
 */
function generateEntitiesFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================

`;

  if (analysis.entities && analysis.entities.length > 0) {
    code += `; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`;

    analysis.entities.forEach((entity, index) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `; Entity: ${entity.name}
ENTITY_${entityName}_ID EQU ${index}
`;

      if (entity.entityTemplateId) {
        code += `ENTITY_${entityName}_TEMPLATE EQU \"${entity.entityTemplateId}\"
`;
      }

      if (entity.position) {
        code += `ENTITY_${entityName}_X EQU ${entity.position.x}
ENTITY_${entityName}_Y EQU ${entity.position.y}
`;
      }

      code += `
`;
    });

    code += `; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

INIT_ENTITIES:
    ; Initialize all game entities
`;

    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach((entity) => {
        const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `    CALL INIT_${entityName}
`;
      });
    } else {
      code += `    ; No entities to initialize
`;
    }

    code += `    RET

UPDATE_ENTITIES:
    ; Update all entities
`;

    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach((entity) => {
        const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `    CALL UPDATE_${entityName}
`;
      });
    } else {
      code += `    ; No entities to update
`;
    }

    code += `    RET

`;

    // Generate individual entity functions
    analysis.entities.forEach((entity) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `INIT_${entityName}:
    ; Initialize ${entity.name}
    ; TODO: Set initial position, sprite, and state
    RET

UPDATE_${entityName}:
    ; Update ${entity.name} logic
    ; TODO: Implement entity behavior
    RET

`;
    });
  } else {
    code += `; ==================================================================
; DEFAULT ENTITY SYSTEM
; ==================================================================

; Basic entity structure
ENTITY_PLAYER_ID EQU 0
ENTITY_ENEMY_ID  EQU 1

INIT_ENTITIES:
    ; Initialize default entities
    CALL INIT_PLAYER
    RET

UPDATE_ENTITIES:
    ; Update all entities
    CALL UPDATE_PLAYER
    RET

INIT_PLAYER:
    ; Initialize player entity
    RET

UPDATE_PLAYER:
    ; Update player logic
    RET

`;
  }

  code += `; ==================================================================
; END OF ENTITIES
; ==================================================================
`;

  return code;
}

/**
 * Generate screens file with screen layout and map data
 */
function generateScreensFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;

  if (analysis.screenMaps && analysis.screenMaps.length > 0) {
    code += `; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`;

    analysis.screenMaps.forEach((screen, index) => {
      const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `SCREEN_${screenName}_${index}_ID EQU ${index}
`;
    });

    code += `
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`;

    analysis.screenMaps.forEach((screen) => {
      if (screen.layers && screen.layers.background) {
        // Create automatic tile banks with assigned tiles for character mapping
        const uniqueTileIds = new Set(screen.layers.background.flat().map(tile => tile.tileId).filter(Boolean));
        const tileBanks: TileBank[] = [];

        console.log(`🔍 Screen ${screen.name}: Found ${uniqueTileIds.size} unique tiles`);
        console.log('Unique tile IDs:', Array.from(uniqueTileIds));
        console.log('Available tiles in analysis:', analysis.tiles?.map(t => `${t.name} (${t.id})`));

        if (uniqueTileIds.size > 0) {
          // Create a single tile bank with all tiles
          const mainBank: TileBank = {
            ...DEFAULT_TILE_BANKS_CONFIG[1], // Use main game bank as template
            assignedTiles: {},
            charsetRangeStart: 0,
            charsetRangeEnd: 255  // Ensure wide range
          };

          // Assign tiles to characters starting from charCode 0
          let nextCharCode = 0;
          Array.from(uniqueTileIds).forEach((tileId) => {
            if (tileId) {
              const tileAsset = analysis.tiles?.find(t => t.id === tileId);
              if (tileAsset) {
                // Calculate how many characters this tile needs (width/8 * height/8)
                const charsWide = Math.ceil(tileAsset.width / 8);
                const charsHigh = Math.ceil(tileAsset.height / 8);

                mainBank.assignedTiles[tileId] = {
                  charCode: nextCharCode,
                  assignedAt: Date.now()
                };

                console.log(`📌 Assigned tile ${tileAsset.name} (${tileId}) to charCode ${nextCharCode} (${charsWide}x${charsHigh} chars)`);
                nextCharCode += charsWide * charsHigh;
              } else {
                console.log(`❌ Tile asset not found for ID: ${tileId}`);
              }
            }
          });

          tileBanks.push(mainBank);
          console.log(`✅ Created tile bank with ${Object.keys(mainBank.assignedTiles).length} assigned tiles`);
        }

        // Use the EXACT same function as Screen Editor "Download ASM" button
        const layoutBytes = generateScreenMapLayoutBytes(
          screen,
          analysis.tiles || [],
          tileBanks.length > 0 ? tileBanks : undefined,
          'SCREEN 2 (Graphics I)' // Now we can use SCREEN 2 with proper tile banks
        );
        const mapIndices = Array.from(layoutBytes);

        // Debug the generated bytes
        const nonFFCount = mapIndices.filter(b => b !== 255).length;
        const uniqueBytes = new Set(mapIndices);
        console.log(`📊 Generated ${mapIndices.length} bytes: ${nonFFCount} non-FF (${((nonFFCount/mapIndices.length)*100).toFixed(1)}%)`);
        console.log(`🎯 Unique byte values: [${Array.from(uniqueBytes).sort((a,b) => a-b).join(', ')}]`);

        if (nonFFCount === 0) {
          console.log(`❌ All bytes are #FF - debugging tile bank assignment...`);
          console.log('Tile bank enabled:', tileBanks[0]?.enabled);
          console.log('Tile bank assigned tiles:', Object.keys(tileBanks[0]?.assignedTiles || {}));
          console.log('Charset range:', tileBanks[0]?.charsetRangeStart, '-', tileBanks[0]?.charsetRangeEnd);
        }

        // Create a mapping from byte values to tile names for comments
        const uniqueValues = new Set(mapIndices.filter(val => val !== 255 && val !== 0));
        const uniqueTiles = new Set(screen.layers.background.flat().map(tile => tile.tileId).filter(Boolean));

        // Generate reference comments based on actual byte values from Screen Editor logic
        const referenceComments: string[] = [];
        referenceComments.push(`; Generated using exact Screen Editor "Download ASM" logic`);
        referenceComments.push(`; Byte values represent actual character codes in VRAM`);

        // Create a mapping of tileIds to actual byte values used
        const tileIdToByteValue = new Map<string, number>();
        const backgroundLayer = screen.layers.background;

        for (let r = 0; r < backgroundLayer.length; r++) {
          for (let c = 0; c < backgroundLayer[r].length; c++) {
            const tile = backgroundLayer[r][c];
            if (tile?.tileId) {
              const byteIndex = r * (screen.activeAreaWidth ?? screen.width) + c;
              if (byteIndex < mapIndices.length) {
                const byteValue = mapIndices[byteIndex];
                if (byteValue !== 255 && byteValue !== 0) {
                  tileIdToByteValue.set(tile.tileId, byteValue);
                }
              }
            }
          }
        }

        // No tile constants needed - we use the actual byte values from Screen Editor

        // Use existing ASM generation logic with hex format like Screen Editor
        const screenNameWithIndex = `${screen.name}_${analysis.screenMaps.indexOf(screen)}`;
        const asmCode = generateScreenLayoutASMCode(
          screenNameWithIndex,
          screen.width,
          screen.height,
          mapIndices,
          referenceComments,
          'hex' // Use hex format #?? like Screen Editor "Download ASM"
        );

        // Add the screen layout data (no tile constants needed - using exact Screen Editor format)
        code += asmCode;

        // Also generate collision/behavior map if available
        if (screen.layers.collision && analysis.tiles) {
          const collisionLayer = screen.layers.collision;
          const behaviorMapData: number[] = [];

          collisionLayer.forEach(row => {
            row.forEach(tile => {
              if (tile.tileId) {
                // Find the tile asset to get its logical properties
                const tileAsset = analysis.tiles.find(t => t.id === tile.tileId);
                const mapId = tileAsset?.logicalProperties?.mapId || 0;
                behaviorMapData.push(mapId);
              } else {
                behaviorMapData.push(0);
              }
            });
          });

          // Generate behavior map ASM
          const behaviorASM = generateBehaviorMapASMCode(
            screenNameWithIndex,
            screen.width,
            screen.height,
            behaviorMapData,
            'hex'
          );

          code += `\n${behaviorASM}`;
        }
      } else {
        // Generate placeholder screen data
        const screenIndex = analysis.screenMaps.indexOf(screen);
        const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `SCREEN_${screenName}_${screenIndex}_LAYOUT:
    ; Screen data for ${screen.name}
    ; TODO: Add actual screen map data
    DB 0, 0, 0, 0, 0, 0, 0, 0

`;
      }

      code += `\n`;
    });

    code += `; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

LOAD_SCREEN:
    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    RET

`;

    analysis.screenMaps.forEach((screen, index) => {
      const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `LOAD_SCREEN_${screenName}:
    ; Load ${screen.name} screen
    LD HL, SCREEN_${screenName}_${index}_LAYOUT
    LD DE, NAMETBL
    LD BC, SCREEN_${screenName}_${index}_SIZE
    CALL LDIRVM
    RET

`;
    });
  } else {
    code += `; ==================================================================
; DEFAULT SCREEN SYSTEM
; ==================================================================

SCREEN_GAME_ID   EQU 0
SCREEN_TITLE_ID  EQU 1

SCREEN_GAME_DATA:
    ; Default game screen pattern
    DB 0, 1, 2, 3, 4, 5, 6, 7
    DB 8, 9, 10, 11, 12, 13, 14, 15
    ; TODO: Add more screen data

LOAD_SCREEN:
    ; Load screen (A = screen ID)
    CP SCREEN_GAME_ID
    JP Z, LOAD_SCREEN_GAME
    RET

LOAD_SCREEN_GAME:
    ; Load game screen
    LD HL, SCREEN_GAME_DATA
    LD DE, NAMETBL
    LD BC, 768
    CALL LDIRVM
    RET

`;
  }

  code += `; ==================================================================
; END OF SCREEN MAPS
; ==================================================================
`;

  return code;
}

/**
 * Generate menus file with menu systems and user interface
 */
function generateMenusFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface
; ==================================================================

`;

  // Check if there are specific menu definitions in the analysis
  const hasMenus = analysis.gameFlow && analysis.gameFlow.nodes &&
    analysis.gameFlow.nodes.some(node => node.type === 'SubMenu');

  if (hasMenus) {
    code += `; ==================================================================
; MENU CONSTANTS
; ==================================================================

`;

    const menuNodes = analysis.gameFlow.nodes.filter(node => node.type === 'SubMenu');
    menuNodes.forEach((menu: any, index) => {
      const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `MENU_${menuName}_ID EQU ${index}
`;
    });

    code += `
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`;

    const menuNodes2 = analysis.gameFlow.nodes.filter(node => node.type === 'SubMenu');
    menuNodes2.forEach((menu: any) => {
      const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `SHOW_MENU_${menuName}:
    ; Display ${menu.title || menu.id} menu
    ; TODO: Implement menu display logic
    RET

HANDLE_MENU_${menuName}:
    ; Handle ${menu.title || menu.id} menu input
    ; TODO: Implement menu input handling
    RET

`;
    });
  } else {
    code += `; ==================================================================
; DEFAULT MENU SYSTEM
; ==================================================================

; Menu constants
MENU_MAIN_ID     EQU 0
MENU_GAME_ID     EQU 1
MENU_PAUSE_ID    EQU 2

; Menu states
MENU_ITEM_START  EQU 0
MENU_ITEM_EXIT   EQU 1

; Current menu variables
current_menu     DS 1
current_item     DS 1

; ==================================================================
; MENU FUNCTIONS
; ==================================================================

INIT_MENUS:
    ; Initialize menu system
    LD A, MENU_MAIN_ID
    LD (current_menu), A
    XOR A
    LD (current_item), A
    RET

SHOW_MAIN_MENU:
    ; Display main menu
    CALL CLS

    ; Print title
    LD HL, txt_title
    LD DE, NAMETBL + (5 * 32) + 10  ; Row 5, column 10
    CALL PRINT_STRING

    ; Print menu options
    LD HL, txt_start
    LD DE, NAMETBL + (10 * 32) + 12
    CALL PRINT_STRING

    LD HL, txt_exit
    LD DE, NAMETBL + (12 * 32) + 12
    CALL PRINT_STRING

    RET

HANDLE_MAIN_MENU:
    ; Handle main menu input
    CALL GTSTCK     ; Get joystick input

    ; Check for up/down movement
    CP 1            ; Up
    JP Z, menu_up
    CP 5            ; Down
    JP Z, menu_down

    ; Check for selection (space or fire button)
    CALL GTTRIG
    OR A
    JP NZ, menu_select

    RET

menu_up:
    LD A, (current_item)
    OR A
    JP Z, menu_up_end  ; Already at top
    DEC A
    LD (current_item), A
menu_up_end:
    RET

menu_down:
    LD A, (current_item)
    CP MENU_ITEM_EXIT
    JP Z, menu_down_end  ; Already at bottom
    INC A
    LD (current_item), A
menu_down_end:
    RET

menu_select:
    LD A, (current_item)
    CP MENU_ITEM_START
    JP Z, start_game
    CP MENU_ITEM_EXIT
    JP Z, exit_game
    RET

start_game:
    ; Start the game
    LD A, MENU_GAME_ID
    LD (current_menu), A
    RET

exit_game:
    ; Exit to BASIC
    RST #00

; ==================================================================
; MENU TEXT DATA
; ==================================================================

txt_title:
    DB "GAME TITLE", 0

txt_start:
    DB "START GAME", 0

txt_exit:
    DB "EXIT", 0

; ==================================================================
; TEXT PRINTING FUNCTION
; ==================================================================

PRINT_STRING:
    ; Print null-terminated string
    ; HL = source string, DE = VRAM destination
print_loop:
    LD A, (HL)
    OR A
    RET Z           ; End of string

    ; WRTVRM expects: A = data, HL = VRAM address
    PUSH HL         ; Save string pointer
    PUSH DE         ; Save VRAM address
    POP HL          ; HL = VRAM address (for WRTVRM)
    CALL WRTVRM     ; Write character to VRAM
    POP HL          ; Restore string pointer

    INC HL          ; Next character in string
    INC DE          ; Next VRAM position
    JP print_loop

`;
  }

  code += `; ==================================================================
; END OF MENUS
; ==================================================================
`;

  return code;
}

/**
 * Generate modular ASM files
 */
export function generateModularASM(
  projectName: string,
  assets: ProjectAsset[],
  config: MSXModularConfig
): GeneratedASMFiles {
  console.log('🔧 Generating modular ASM files...');

  // Validate inputs
  if (!projectName) {
    console.error('❌ projectName is required');
    throw new Error('projectName is required');
  }

  if (!assets) {
    console.error('❌ assets is undefined or null');
    console.log('Received assets:', assets);
    console.log('Received config:', config);
    throw new Error('assets array is required');
  }

  if (!Array.isArray(assets)) {
    console.error('❌ assets is not an array');
    console.log('assets type:', typeof assets);
    console.log('assets value:', assets);
    throw new Error('assets must be an array');
  }

  console.log(`📊 Project: ${projectName}, Assets: ${assets.length}, Config:`, config);

  // Analyze project with validated assets
  let analysis;
  try {
    analysis = analyzeProject(projectName, assets);
    console.log(`🔍 Analysis complete: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles, ${analysis.screenMaps.length} screens`);
  } catch (error) {
    console.error('❌ Error analyzing project:', error);
    // Fallback to empty analysis
    analysis = {
      sprites: [],
      tiles: [],
      screenMaps: [],
      entities: [],
      gameFlow: null
    };
    console.log('🔄 Using fallback empty analysis');
  }

  // Generate individual files
  const files: GeneratedASMFiles = {
    'bios.asm': generateBIOSFile(),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'header.asm': generateHeaderFile(projectName),
    'patterns.asm': generatePatternsFile(analysis),
    'colors.asm': generateColorsFile(analysis),
    'components.asm': generateComponentsFile(analysis),
    'entities.asm': generateEntitiesFile(analysis),
    'screens.asm': generateScreensFile(analysis),
    'sprites.asm': generateSpritesFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'main.asm': generateMainFile(projectName, analysis)
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, projectName);
  }

  console.log('✅ Modular ASM files generated successfully!');
  console.log(`📊 Generated ${Object.keys(files).length} files`);
  console.log(`📁 Files: ${Object.keys(files).join(', ')}`);

  return files;
}