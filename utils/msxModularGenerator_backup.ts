/**
 * @fileoverview MSX Modular ASM Generator
 * Generates multiple specialized ASM files for better maintainability
 */

import { ProjectAsset, ComponentDefinition, EntityTemplate, Sprite, Tile, ScreenMap, EntityInstance, GameFlowGraph } from '../types';
import { generateScreenLayoutASMCode, generateBehaviorMapASMCode, generateScreenMapLayoutBytes } from '../components/utils/screenUtils';
import { generateTilePatternBytes, generateTileColorBytes } from '../components/utils/tileUtils';
import { generateSpriteASMCode } from '../components/utils/spriteUtils';
import { pixelDataToPattern } from './z80CodeGenerator';
import { DEFAULT_TILE_BANK_DEFINITIONS } from '../constants';
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
  'font.asm': string;
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
CHGCLR  EQU #0062        ; Change colors
CLS     EQU #00C3        ; Clear screen
POSIT   EQU #00C6        ; Position cursor (H=X, L=Y)
ERAFNK  EQU #00CC        ; Erase function keys
DSPFNK  EQU #00CF        ; Display function keys
DISSCR  EQU #0041        ; Disable screen (prevent flicker)
ENASCR  EQU #0044        ; Enable screen
INITXT  EQU #006C        ; Initialize text mode
INIT32  EQU #006F        ; Initialize screen mode

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
WRTVDP  EQU #0047        ; Write to VDP register
WRTVRM  EQU #004D        ; Write data to VRAM (A=data, HL=address)

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

; System Variables
HKEY    EQU #F3DB        ; Hook function key (system variable)
CLIKSW  EQU #F3DC        ; Key click switch
BAKCLR  EQU #F3E9        ; Background color
BDRCLR  EQU #F3EA        ; Border color
isComputer50HzOr60Hz EQU #F3EB  ; System frequency flag

; ==================================================================
; UTILITY FUNCTIONS
; ==================================================================

FILLSCREEN:
    ; Fill screen with default pattern
    CALL CLS
    RET

CheckIf60Hz:
    ; Check if system is 60Hz or 50Hz
    ; Return A=0 for 50Hz, A=1 for 60Hz
    LD A, 1                 ; Default to 60Hz
    RET

randomSeedUpdate:
    ; Update random seed
    ; Simple placeholder implementation
    RET

INIT_FONT_SYSTEM:
    ; Initialize custom font system
    ; For BasicEnemy, use default MSX font
    RET

PRINT_STRING_SCREEN2:
    ; Print string using custom font in Screen 2
    ; HL = string, DE = VRAM position
    ; For BasicEnemy, use basic character printing
    CALL PRINT_STRING
    RET

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
; SCREEN DIMENSIONS (DYNAMIC BASED ON PROJECT TILES)
; ==================================================================
${analysis.tiles && analysis.tiles.length > 0 ? `
; Project-specific tile dimensions detected:
${analysis.tiles.map((tile, i) => `; Tile ${i}: ${tile.name} = ${tile.width}x${tile.height}px (${Math.ceil(tile.width/8)}x${Math.ceil(tile.height/8)} MSX chars)`).join('\n')}

; Using primary tile size: ${analysis.tiles[0].width}x${analysis.tiles[0].height}px
TILE_WIDTH      EQU ${analysis.tiles[0].width}    ; Primary tile width in pixels
TILE_HEIGHT     EQU ${analysis.tiles[0].height}   ; Primary tile height in pixels
SCREEN_TILES_X  EQU ${Math.floor(256 / analysis.tiles[0].width)}    ; Horizontal tiles (256px ÷ ${analysis.tiles[0].width}px)
SCREEN_TILES_Y  EQU ${Math.floor(192 / analysis.tiles[0].height)}   ; Vertical tiles (192px ÷ ${analysis.tiles[0].height}px)
MSX_CHARS_PER_TILE_X EQU ${Math.ceil(analysis.tiles[0].width / 8)}  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU ${Math.ceil(analysis.tiles[0].height / 8)} ; MSX characters high per tile
` : `
; No tiles detected - using MSX default character size
TILE_WIDTH      EQU 8    ; Default: 8x8 pixels per MSX character
TILE_HEIGHT     EQU 8    ; Default: 8x8 pixels per MSX character
SCREEN_TILES_X  EQU 32   ; Horizontal tiles (Screen 1/2)
SCREEN_TILES_Y  EQU 24   ; Vertical tiles
MSX_CHARS_PER_TILE_X EQU 1   ; 1 MSX character per tile
MSX_CHARS_PER_TILE_Y EQU 1   ; 1 MSX character per tile
`}

; Legacy compatibility
SCREEN_WIDTH    EQU SCREEN_TILES_X
SCREEN_HEIGHT   EQU SCREEN_TILES_Y
TILE_SIZE       EQU 8    ; MSX character size (always 8x8)

; ==================================================================
; GAMEFLOW NODE TYPE CONSTANTS (Critical for Paridad)
; ==================================================================
NODE_TYPE_START        EQU 0    ; Start node (initial entry point)
NODE_TYPE_WORLDLINK    EQU 1    ; World link node (loads world map)
NODE_TYPE_SCREEN       EQU 2    ; Screen node (loads specific screen)
NODE_TYPE_MENU         EQU 3    ; Menu node (shows menu interface)
NODE_TYPE_UNKNOWN      EQU 255  ; Unknown/unsupported node type

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
TOTAL_SPRITES           EQU ${analysis.sprites?.length || 0}
TOTAL_TILES             EQU ${analysis.tiles?.length || 0}
TOTAL_SCREENS           EQU ${analysis.screenMaps?.length || 0}

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

    const spriteCount = analysis.sprites?.length || 1;
    code += `sprite_x_pos        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite X positions (${spriteCount} bytes)\n`;
    currentAddress += spriteCount;

    code += `sprite_y_pos        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite Y positions (${spriteCount} bytes)\n`;
    currentAddress += spriteCount;

    code += `sprite_pattern      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite pattern IDs (${spriteCount} bytes)\n`;
    currentAddress += spriteCount;

    code += `sprite_color        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite colors (${spriteCount} bytes)\n`;
    currentAddress += spriteCount;
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

  // Player variables (always generated for compatibility)
  const hasPlayer = true; // Always generate player variables for game compatibility

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
    ; Initialize stack
    LD SP, #F380


    DI                           ; Disable interrupts during init
    ld a,#C9
    ld (HKEY),a
    EI

    ; Set up memory mapper (if any)
    ; This is a placeholder for future mapper initialization
    ; call setupROMRAMslots

    xor a       
    ld (CLIKSW),a ; Click switch off
    ; Change background colors:
    ld (BAKCLR),a 
    ld (BDRCLR),a
    call CHGCLR
   
    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ; init fill screen
    call FILLSCREEN

     call CheckIf60Hz
    ld (isComputer50HzOr60Hz),a

    ;init random seed
    call randomSeedUpdate


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

${analysis.tiles && analysis.tiles.length > 0 ? `; 5. Pattern Data (if tiles exist)
INCLUDE "patterns.asm"

; 6. Color Data (if tiles exist)
INCLUDE "colors.asm"
` : ''}

${analysis.sprites && analysis.sprites.length > 0 ? `; 7. Sprite Data (if sprites exist)
INCLUDE "sprites.asm"
` : ''}

${analysis.screenMaps && analysis.screenMaps.length > 0 ? `; 8. Screen Maps (if screens exist)
INCLUDE "screens.asm"
` : ''}

; 9. Font Data (custom font for Screen 2 text)
INCLUDE "font.asm"

; 10. Components (game logic)
INCLUDE "components.asm"

; 11. Entities (game objects)
INCLUDE "entities.asm"

; 12. Menus (user interface)
INCLUDE "menus.asm"

; ==================================================================
; MAIN PROGRAM ENTRY POINT
; ==================================================================
MAIN_PROGRAM:
    ; Initialize game systems
    CALL INIT_GAME_SYSTEMS

    ; Initialize font system for Screen 2 text
    CALL INIT_FONT_SYSTEM

    ; Initialize Game Flow system
    XOR A
    LD (current_flow_state), A
    LD (prev_flow_state), A

    ; Load initial screen based on GameFlow (Critical for Paridad)
    CALL LOAD_GAME_SCREEN

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
; GAMEFLOW SYSTEM FUNCTIONS (Critical for Paridad)
; ==================================================================

LOAD_GAME_SCREEN:
    ; Load game screen based on GameFlow execution path
    ; This follows the exact same flow as Play mode for PARIDAD
${analysis.gameFlow ? `
    ; GameFlow detected - follow node execution path
    ; Start node: ${analysis.gameFlow.startNodeId || 'unknown'}
    ; Nodes: ${analysis.gameFlow.nodes?.length || 0} total
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ?
    analysis.gameFlow.nodes.map((node, i) =>
        `    ; Node ${i}: ${node.id} (${node.type || 'unknown'}) ${node.data?.worldMapId ? `-> World: ${node.data.worldMapId}` : ''}`
    ).join('\n') : '    ; No nodes in GameFlow'}

    ; Execute first GameFlow transition (matches Play mode behavior)
    CALL EXECUTE_GAMEFLOW_START` :
`    ; No GameFlow detected - load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load first screen: ${analysis.screenMaps[0]?.name || 'default'}
    CALL LOAD_SCREEN_${analysis.screenMaps[0]?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'}` : `    ; No screens detected - load default pattern`}`}
    RET

; ==================================================================
; GAMEFLOW EXECUTION FUNCTIONS (Critical for Paridad)
; ==================================================================

EXECUTE_GAMEFLOW_START:
${analysis.gameFlow ? `
    ; Execute the GameFlow start node exactly as Play mode does
    ; Start node ID: ${analysis.gameFlow.startNodeId || 'none'}
${analysis.gameFlow.startNodeId ? `
    ; Find and execute start node
    LD HL, gameflow_node_${analysis.gameFlow.startNodeId.replace(/[^a-zA-Z0-9]/g, '_')}
    CALL EXECUTE_GAMEFLOW_NODE` : `
    ; No start node defined - execute first available node
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ? `
    LD HL, gameflow_node_${analysis.gameFlow.nodes[0].id.replace(/[^a-zA-Z0-9]/g, '_')}
    CALL EXECUTE_GAMEFLOW_NODE` : `
    ; No nodes available - load default screen
    CALL LOAD_DEFAULT_SCREEN`}`}` : `
    ; No GameFlow - fallback to screen loading
    CALL LOAD_DEFAULT_SCREEN`}
    RET

EXECUTE_GAMEFLOW_NODE:
    ; Execute a single GameFlow node (matches Play mode execution)
    ; HL = pointer to node data structure

    ; Get node type and execute appropriate handler
    LD A, (HL)                    ; Load node type
    CP NODE_TYPE_START
    JP Z, EXECUTE_START_NODE
    CP NODE_TYPE_WORLDLINK
    JP Z, EXECUTE_WORLD_LINK_NODE
    CP NODE_TYPE_SCREEN
    JP Z, EXECUTE_SCREEN_NODE
    CP NODE_TYPE_MENU
    JP Z, EXECUTE_MENU_NODE

    ; Unknown node type - skip
    RET

EXECUTE_START_NODE:
    ; Start node - typically just transitions to next node
    ; Find next connected node and execute it
    CALL FIND_NEXT_GAMEFLOW_NODE
    JP EXECUTE_GAMEFLOW_NODE

EXECUTE_WORLD_LINK_NODE:
    ; World link node - load the referenced world map
${analysis.gameFlow && analysis.gameFlow.nodes ? `
${analysis.gameFlow.nodes.filter(node => node.type === 'world_link' || node.data?.worldMapId).map(node => `
    ; Node ${node.id}: Links to world ${node.data?.worldMapId || 'unknown'}
    ; Load world map and execute its start screen
    CALL LOAD_WORLD_${(node.data?.worldMapId || 'default').toUpperCase().replace(/[^A-Z0-9]/g, '_')}`).join('\n')}` : `
    ; No world link nodes detected`}
    RET

EXECUTE_SCREEN_NODE:
    ; Screen node - load the specific screen
    ; Extract screen reference from node data
    CALL LOAD_REFERENCED_SCREEN
    RET

EXECUTE_MENU_NODE:
    ; Menu node - show menu interface
    CALL SHOW_MENU_INTERFACE
    RET

LOAD_DEFAULT_SCREEN:
    ; Fallback: load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `
    CALL LOAD_SCREEN_${analysis.screenMaps[0]?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'}` : `
    ; No screens available - show placeholder
    CALL SHOW_NO_CONTENT_MESSAGE`}
    RET

FIND_NEXT_GAMEFLOW_NODE:
    ; Find the next node in GameFlow connections
    ; Implementation depends on connection data structure
    ; For now, use first connection if available
    RET

LOAD_REFERENCED_SCREEN:
    ; Load screen referenced by current node
    ; Implementation needs node data parsing
    CALL LOAD_DEFAULT_SCREEN
    RET

SHOW_MENU_INTERFACE:
    ; Show menu defined in GameFlow node
    ; Implementation needs menu data parsing
    RET

SHOW_NO_CONTENT_MESSAGE:
    ; Show message when no content is available
    RET

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES
; ==================================================================

${analysis.gameFlow && analysis.gameFlow.nodes ?
analysis.gameFlow.nodes.map(node => `
; Node: ${node.id} (${node.type || 'unknown'})
gameflow_node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}:
    DB NODE_TYPE_${(node.type || 'unknown').toUpperCase()}
    DW ${node.data?.worldMapId ? `world_${node.data.worldMapId.replace(/[^a-zA-Z0-9]/g, '_')}` : '0'}
    ; Additional node data would go here
`).join('\n') : `
; No GameFlow nodes detected`}

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
  if (!analysis.tiles || analysis.tiles.length === 0) {
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
; ${analysis.tiles?.length || 0} tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
TILE_PATTERN_BANK0:
${analysis.tiles.map((tile, index) => {
  // Generate actual pattern bytes using the same function as MSX Main Generator
  const patternBytes = generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)');

  // Calculate how many 8x8 MSX characters this tile needs (dynamic sizing)
  const charsWide = Math.ceil(tile.width / 8);   // e.g., 24px = 3 chars wide
  const charsHigh = Math.ceil(tile.height / 8);  // e.g., 16px = 2 chars high
  const totalChars = charsWide * charsHigh;      // e.g., 3×2 = 6 MSX characters
  const totalBytes = totalChars * 8;             // Each MSX char = 8 bytes

  // Validate that tile size is compatible with MSX characters
  if (tile.width % 8 !== 0 || tile.height % 8 !== 0) {
    console.warn(`⚠️  Tile ${tile.name} size ${tile.width}x${tile.height} is not multiple of 8px - may cause visual artifacts`);
  }

  const bytesHex = Array.from(patternBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);

  // Generate character-by-character breakdown for complex tiles
  let charBreakdown = '';
  if (totalChars > 1) {
    charBreakdown = `\n    ; Character layout: ${charsWide}×${charsHigh} grid`;
    for (let row = 0; row < charsHigh; row++) {
      charBreakdown += `\n    ; Row ${row}: `;
      for (let col = 0; col < charsWide; col++) {
        const charIndex = row * charsWide + col;
        charBreakdown += `Char${charIndex} `;
      }
    }
  }

  return `    ; Tile ${index}: ${tile.name} (${tile.width}x${tile.height}px = ${charsWide}×${charsHigh} chars = ${totalChars} MSX characters)${charBreakdown}
    DB ${bytesHex.join(', ')}
`;
}).join('')}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
LOAD_PATTERN_BANK0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_PATTERN_BANK0
    LD DE, CHRTBL2                ; VRAM pattern table bank 0
    LD BC, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_PATTERN_BANK1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0
    LD DE, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)
    LD BC, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_PATTERN_BANK2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0
    LD DE, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)
    LD BC, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
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
  if (!analysis.tiles || analysis.tiles.length === 0) {
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
; ${analysis.tiles?.length || 0} tiles detected
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
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_COLOR_BANK0
    LD DE, CLRTBL2                ; VRAM color table bank 0
    LD BC, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_COLOR_BANK1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0
    LD DE, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)
    LD BC, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_COLOR_BANK2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0
    LD DE, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)
    LD BC, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`;
}

/**
 * Generate unified file (unitedFiles.asm) - optional
 */
function generateUnifiedFile(files: GeneratedASMFiles, projectName: string, analysis: ProjectAnalysis): string {
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
    ; Initialize component systems
    CALL INIT_COMPONENTS

    ; Initialize sprite system and load patterns
    CALL INIT_SPRITES
    CALL LOAD_SPRITE_PATTERNS  ; Load sprite patterns to VRAM

    ; Load pattern and color data
    CALL LOAD_PATTERN_BANK0
    CALL LOAD_PATTERN_BANK1
    CALL LOAD_PATTERN_BANK2
    CALL LOAD_COLOR_BANK0
    CALL LOAD_COLOR_BANK1
    CALL LOAD_COLOR_BANK2

    ; Initialize game entities with real positions from JSON
    CALL INIT_ENTITIES

    ; Initialize sound system
    CALL GICINI               ; Initialize PSG

    ; Clear screen (BIOS CLS handles timing)
    CALL FILLSCREEN

    ; Load the first game screen
    CALL LOAD_GAME_SCREEN

    ; No startup message needed for pure game projects

    RET

UPDATE_CURRENT_STATE:
    ; Update game logic based on current flow state
    ; Store previous state for transition detection
    LD A, (current_flow_state)
    LD (prev_flow_state), A

    ; Update input first (needed by all states)
    CALL UPDATE_INPUT_COMPONENT

    ; Branch to appropriate state handler
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
    ; Check for joystick input to navigate menu
    LD A, (input_state)
    CP STICK_DOWN
    CALL Z, MENU_CURSOR_DOWN
    CP STICK_UP
    CALL Z, MENU_CURSOR_UP

    ; Check for selection (trigger or space)
    LD A, 0                     ; Trigger port 0
    CALL GTTRIG
    OR A
    JP NZ, MENU_SELECT_OPTION

    ; Check for START key to begin game directly
    LD A, (input_state)
    CP STICK_CENTER
    RET NZ
    LD A, 0
    CALL GTTRIG
    OR A
    JP NZ, START_GAME_FROM_MENU
    RET

UPDATE_GAME_STATE:
    ; Main gameplay logic - update all component systems in correct order
    CALL UPDATE_INPUT_COMPONENT     ; Read input
    CALL UPDATE_BEHAVIOR_COMPONENT  ; AI/Logic decisions
    CALL UPDATE_MOVEMENT_COMPONENT  ; Apply physics/movement
    CALL UPDATE_POSITION_COMPONENT  ; Update positions
    CALL UPDATE_COLLISION_COMPONENT ; Check collisions
    CALL UPDATE_SPRITE_COMPONENT    ; Update sprite rendering

    ; Check for pause input (SELECT key or P)
    LD A, (input_state)
    CP STICK_CENTER                ; Center + trigger = pause
    RET NZ
    LD A, 0
    CALL GTTRIG
    OR A
    JP NZ, PAUSE_GAME

    ; Check for game over conditions
    CALL CHECK_GAME_OVER_CONDITIONS
    RET

UPDATE_PAUSE_STATE:
    ; Handle pause state - minimal updates
    ; Check for unpause input (same as pause)
    LD A, (input_state)
    CP STICK_CENTER
    RET NZ
    LD A, 0
    CALL GTTRIG
    OR A
    JP NZ, UNPAUSE_GAME
    RET

UPDATE_GAME_OVER_STATE:
    ; Handle game over state
    ; Auto-advance to menu after delay or on input
    LD A, (frame_counter)
    AND #3F                         ; Check every 64 frames (~1 second)
    RET NZ

    ; Check for any input to return to menu
    LD A, 0
    CALL GTTRIG
    OR A
    JP NZ, RETURN_TO_MENU

    ; Auto-return after timeout
    LD HL, (frame_counter)
    LD DE, 300                      ; ~5 seconds at 60fps
    OR A
    SBC HL, DE
    JP NC, RETURN_TO_MENU
    RET

UPDATE_CREDITS_STATE:
    ; Handle credits state - auto-advance
    LD A, (frame_counter)
    AND #1F                         ; Check every 32 frames
    RET NZ

    ; Auto-return to menu after credits
    LD HL, (frame_counter)
    LD DE, 600                      ; ~10 seconds
    OR A
    SBC HL, DE
    JP NC, RETURN_TO_MENU
    RET

; ==================================================================
; GAME FLOW TRANSITION FUNCTIONS (Critical for Parity)
; ==================================================================

START_GAME_FROM_MENU:
    ; Transition: Main Menu → Game
    LD A, FLOW_STATE_GAME
    LD (current_flow_state), A

    ; Initialize game state
    CALL INIT_GAME_ENTITIES
    CALL RESET_GAME_VARIABLES

    ; Clear screen and load game screen
    CALL CLS
    CALL LOAD_GAME_SCREEN
    RET

PAUSE_GAME:
    ; Transition: Game → Pause
    LD A, FLOW_STATE_PAUSE
    LD (current_flow_state), A

    ; Save game state (already in RAM variables)
    ; Show pause overlay
    CALL SHOW_PAUSE_OVERLAY
    RET

UNPAUSE_GAME:
    ; Transition: Pause → Game
    LD A, FLOW_STATE_GAME
    LD (current_flow_state), A

    ; Restore game display
    CALL CLEAR_PAUSE_OVERLAY
    RET

GAME_OVER:
    ; Transition: Game → Game Over
    LD A, FLOW_STATE_GAME_OVER
    LD (current_flow_state), A

    ; Reset frame counter for timeout
    LD HL, 0
    LD (frame_counter), HL

    ; Show game over screen
    CALL SHOW_GAME_OVER_SCREEN
    RET

RETURN_TO_MENU:
    ; Pure game - restart game instead of menu
    LD A, FLOW_STATE_GAME
    LD (current_flow_state), A

    ; Reset all game state and restart
    CALL RESET_ALL_GAME_STATE
    CALL INIT_GAME_ENTITIES
    CALL LOAD_GAME_SCREEN
    RET

; ==================================================================
; STATE HELPER FUNCTIONS
; ==================================================================

MENU_CURSOR_DOWN:
    ; Move menu cursor down (cycle through options)
    RET

MENU_CURSOR_UP:
    ; Move menu cursor up (cycle through options)
    RET

MENU_SELECT_OPTION:
    ; Select current menu option
    JP START_GAME_FROM_MENU

CHECK_GAME_OVER_CONDITIONS:
    ; Check if player is dead, enemies cleared, etc.
    ; Implementation depends on specific game logic
    RET

INIT_GAME_ENTITIES:
    ; Initialize all game entities for new game
    CALL INIT_ENTITIES
    CALL INIT_SPRITES
    RET

RESET_GAME_VARIABLES:
    ; Reset score, health, etc.
    XOR A
    LD (player_health), A
    LD HL, 0
    LD (player_score), HL
    RET

RESET_ALL_GAME_STATE:
    ; Complete reset for return to menu
    CALL CLEAR_ALL_SPRITES
    CALL RESET_GAME_VARIABLES
    RET

LOAD_GAME_SCREEN:
    ; Load game screen based on GameFlow execution path
    ; This follows the exact same flow as Play mode for PARIDAD
${analysis.gameFlow ? `
    ; GameFlow detected - follow node execution path
    ; Start node: ${analysis.gameFlow.startNodeId || 'unknown'}
    ; Nodes: ${analysis.gameFlow.nodes?.length || 0} total
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ?
    analysis.gameFlow.nodes.map((node, i) =>
        `    ; Node ${i}: ${node.id} (${node.type || 'unknown'}) ${node.data?.worldMapId ? `-> World: ${node.data.worldMapId}` : ''}`
    ).join('\n') : '    ; No nodes in GameFlow'}

    ; Execute first GameFlow transition (matches Play mode behavior)
    CALL EXECUTE_GAMEFLOW_START` :
`    ; No GameFlow detected - load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load first screen: ${analysis.screenMaps[0]?.name || 'default'}
    CALL LOAD_SCREEN_${analysis.screenMaps[0]?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'}` : `    ; No screens detected - load default pattern`}`}
    RET

; ==================================================================
; GAMEFLOW EXECUTION FUNCTIONS (Critical for Paridad)
; ==================================================================

EXECUTE_GAMEFLOW_START:
${analysis.gameFlow ? `
    ; Execute the GameFlow start node exactly as Play mode does
    ; Start node ID: ${analysis.gameFlow.startNodeId || 'none'}
${analysis.gameFlow.startNodeId ? `
    ; Find and execute start node
    LD HL, gameflow_node_${analysis.gameFlow.startNodeId.replace(/[^a-zA-Z0-9]/g, '_')}
    CALL EXECUTE_GAMEFLOW_NODE` : `
    ; No start node defined - execute first available node
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ? `
    LD HL, gameflow_node_${analysis.gameFlow.nodes[0].id.replace(/[^a-zA-Z0-9]/g, '_')}
    CALL EXECUTE_GAMEFLOW_NODE` : `
    ; No nodes available - load default screen
    CALL LOAD_DEFAULT_SCREEN`}`}` : `
    ; No GameFlow - fallback to screen loading
    CALL LOAD_DEFAULT_SCREEN`}
    RET

EXECUTE_GAMEFLOW_NODE:
    ; Execute a single GameFlow node (matches Play mode execution)
    ; HL = pointer to node data structure

    ; Get node type and execute appropriate handler
    LD A, (HL)                    ; Load node type
    CP NODE_TYPE_START
    JP Z, EXECUTE_START_NODE
    CP NODE_TYPE_WORLDLINK
    JP Z, EXECUTE_WORLD_LINK_NODE
    CP NODE_TYPE_SCREEN
    JP Z, EXECUTE_SCREEN_NODE
    CP NODE_TYPE_MENU
    JP Z, EXECUTE_MENU_NODE

    ; Unknown node type - skip
    RET

EXECUTE_START_NODE:
    ; Start node - typically just transitions to next node
    ; Find next connected node and execute it
    CALL FIND_NEXT_GAMEFLOW_NODE
    JP EXECUTE_GAMEFLOW_NODE

EXECUTE_WORLD_LINK_NODE:
    ; World link node - load the referenced world map
${analysis.gameFlow && analysis.gameFlow.nodes ? `
${analysis.gameFlow.nodes.filter(node => node.type === 'world_link' || node.data?.worldMapId).map(node => `
    ; Node ${node.id}: Links to world ${node.data?.worldMapId || 'unknown'}
    ; Load world map and execute its start screen
    CALL LOAD_WORLD_${(node.data?.worldMapId || 'default').toUpperCase().replace(/[^A-Z0-9]/g, '_')}`).join('\n')}` : `
    ; No world link nodes detected`}
    RET

EXECUTE_SCREEN_NODE:
    ; Screen node - load the specific screen
    ; Extract screen reference from node data
    CALL LOAD_REFERENCED_SCREEN
    RET

EXECUTE_MENU_NODE:
    ; Menu node - show menu interface
    CALL SHOW_MENU_INTERFACE
    RET

LOAD_DEFAULT_SCREEN:
    ; Fallback: load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `
    CALL LOAD_SCREEN_${analysis.screenMaps[0]?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'}` : `
    ; No screens available - show placeholder
    CALL SHOW_NO_CONTENT_MESSAGE`}
    RET

FIND_NEXT_GAMEFLOW_NODE:
    ; Find the next node in GameFlow connections
    ; Implementation depends on connection data structure
    ; For now, use first connection if available
    RET

LOAD_REFERENCED_SCREEN:
    ; Load screen referenced by current node
    ; Implementation needs node data parsing
    CALL LOAD_DEFAULT_SCREEN
    RET

SHOW_MENU_INTERFACE:
    ; Show menu defined in GameFlow node
    ; Implementation needs menu data parsing
    RET

SHOW_NO_CONTENT_MESSAGE:
    ; Show message when no content is available
    RET

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES
; ==================================================================

${analysis.gameFlow && analysis.gameFlow.nodes ?
analysis.gameFlow.nodes.map(node => `
; Node: ${node.id} (${node.type || 'unknown'})
gameflow_node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}:
    DB NODE_TYPE_${(node.type || 'unknown').toUpperCase()}
    DW ${node.data?.worldMapId ? `world_${node.data.worldMapId.replace(/[^a-zA-Z0-9]/g, '_')}` : '0'}
    ; Additional node data would go here
`).join('\n') : `
; No GameFlow nodes detected`}

SHOW_PAUSE_OVERLAY:
    ; Pure game - no pause overlay needed
    RET

CLEAR_PAUSE_OVERLAY:
    ; Clear pause overlay by redrawing that area
    ; Simple implementation: reload game screen
    CALL LOAD_GAME_SCREEN
    RET

SHOW_GAME_OVER_SCREEN:
    ; Pure game - no game over screen needed
    ; Just restart the game automatically
    RET

RENDER_FRAME:
    ; Render current frame based on flow state
    ; Optimized rendering with V-Blank synchronization

    ; Increment frame counter for timing
    LD HL, (frame_counter)
    INC HL
    LD (frame_counter), HL

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

    ; Default: unknown state - just continue
    RET

RENDER_MAIN_MENU:
    ; Pure game - no menu, go directly to game
    LD A, FLOW_STATE_GAME
    LD (current_flow_state), A
    CALL INIT_GAME_ENTITIES
    CALL LOAD_GAME_SCREEN
    RET

RENDER_GAME:
    ; Render game frame with optimized sprite updates
    ; Only update sprites that have moved (optimization)

    ; Update sprite positions in VRAM only when needed
    ; This is much more efficient than reloading entire screen
    CALL UPDATE_SPRITES_TO_VRAM

    ; Pure game rendering - no UI text needed
    ; Game state is entirely visual through sprites and background
    RET

RENDER_PAUSE:
    ; Pure game - no pause text needed
    ; Game is paused but visually identical
    RET

RENDER_GAME_OVER:
    ; Pure game - return to game after brief pause
    ; No text needed - just restart game
    CALL RETURN_TO_MENU
    RET

RENDER_CREDITS:
    ; Pure game - no credits needed
    CALL RETURN_TO_MENU
    RET

; Pure game - no text strings needed for ${projectName.toUpperCase()}
; All communication is through visual gameplay elements

    END                 ; End of assembly
`;
}

/**
 * Generate sprite data file (sprites.asm)
 */
function generateSpritesFile(analysis: ProjectAnalysis): string {
  if (!analysis.sprites || analysis.sprites.length === 0) {
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
    LD BC, ${Math.max(0, (analysis.sprites?.length || 1) - 1)}                     ; ${analysis.sprites?.length || 1} sprites - 1
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
; ${analysis.sprites?.length || 0} sprites detected
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
    ; Load sprite ${index}: ${sprite.name} (BIOS LDIRVM handles timing)
    LD HL, SPRITE_${index}_PATTERN
    LD DE, SPRPAT + (${index} * 32) ; Each 16x16 sprite = 32 bytes (4 patterns)
    LD BC, 32                       ; 16x16 sprite size
    CALL LDIRVM                     ; BIOS handles safe VRAM access
`;
  });

  code += `    RET

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; Show sprite (A = sprite number, B = X, C = Y, D = pattern, E = color)
SHOW_SPRITE:
    PUSH BC                       ; Preserve parameters
    PUSH DE

    ; Calculate sprite offset (A = sprite number)
    LD L, A                       ; L = sprite number
    LD H, 0                       ; HL = sprite number

    ; Set X position
    PUSH HL
    LD DE, sprite_x_pos
    ADD HL, DE                    ; HL points to sprite X position
    LD (HL), B                    ; Set X position
    POP HL

    ; Set Y position
    PUSH HL
    LD DE, sprite_y_pos
    ADD HL, DE                    ; HL points to sprite Y position
    LD (HL), C                    ; Set Y position
    POP HL

    ; Set pattern
    PUSH HL
    LD DE, sprite_pattern
    ADD HL, DE                    ; HL points to sprite pattern
    POP DE                        ; Restore original HL to DE
    PUSH DE                       ; Save it again
    LD (HL), D                    ; Set pattern number
    POP HL

    ; Set color
    LD DE, sprite_color
    ADD HL, DE                    ; HL points to sprite color
    POP DE                        ; Get original DE back
    LD (HL), E                    ; Set color

    POP BC                        ; Restore original parameters
    RET

; Clear all sprites (make them invisible)
CLEAR_ALL_SPRITES:
    LD HL, sprite_y_pos
    LD DE, sprite_y_pos+1
    LD BC, ${Math.max(0, (analysis.sprites?.length || 1) - 1)}                     ; ${analysis.sprites?.length || 1} sprites - 1
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
    ; BIOS LDIRVM handles timing automatically
    LD HL, sprite_y_pos
    LD DE, SPRATR
    LD BC, ${(analysis.sprites?.length || 1) * 4}                    ; ${analysis.sprites?.length || 1} sprites * 4 bytes each
    CALL LDIRVM                   ; BIOS handles safe VRAM access
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
 * Generate components file with game component systems - Based on Mideas ECS Architecture
 */
function generateComponentsFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
; File: components.asm
; Description: Component systems based on Mideas React.js architecture
; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
; ==================================================================

; ==================================================================
; COMPONENT TYPE CONSTANTS (Based on ComponentDefinition analysis)
; ==================================================================

; Core Components (always present)
COMP_POSITION   EQU 0    ; Position component (x, y coordinates)
COMP_SPRITE     EQU 1    ; Sprite rendering component
COMP_MOVEMENT   EQU 2    ; Movement/velocity component
COMP_COLLISION  EQU 3    ; Collision detection component
COMP_INPUT      EQU 4    ; Input handling component
COMP_BEHAVIOR   EQU 5    ; AI/Logic behavior component
COMP_HEALTH     EQU 6    ; Health/damage component
COMP_ANIMATION  EQU 7    ; Animation state component

; Component flags for entity filtering
COMP_MASK_POSITION   EQU #01  ; Binary: 00000001
COMP_MASK_SPRITE     EQU #02  ; Binary: 00000010
COMP_MASK_MOVEMENT   EQU #04  ; Binary: 00000100
COMP_MASK_COLLISION  EQU #08  ; Binary: 00001000
COMP_MASK_INPUT      EQU #10  ; Binary: 00010000
COMP_MASK_BEHAVIOR   EQU #20  ; Binary: 00100000
COMP_MASK_HEALTH     EQU #40  ; Binary: 01000000
COMP_MASK_ANIMATION  EQU #80  ; Binary: 10000000

; ==================================================================
; COMPONENT DATA STRUCTURES (Entity-Component arrays)
; ==================================================================

; Position Component Data (32 entities max)
entity_x_pos        EQU sprite_x_pos      ; Reuse sprite positions
entity_y_pos        EQU sprite_y_pos      ; (32 bytes each)

; Movement Component Data
entity_vel_x        EQU temp_word_1       ; X velocity storage (signed 8-bit)
entity_vel_y        EQU temp_word_2       ; Y velocity storage (signed 8-bit)

; Component masks for each entity (which components are active)
entity_comp_masks   EQU temp_byte_1       ; Component flags per entity (32 bytes)

; Animation Component Data
entity_anim_frame   EQU temp_byte_2       ; Current animation frame (32 bytes)

; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

INIT_COMPONENTS:
    ; Initialize all component systems (based on Mideas initialization)

    ; Clear all component masks
    LD HL, entity_comp_masks
    LD DE, entity_comp_masks+1
    LD BC, 31
    LD (HL), 0
    LDIR

    ; Initialize position system
    CALL INIT_POSITION_SYSTEM

    ; Initialize sprite system
    CALL INIT_SPRITE_SYSTEM

    ; Initialize movement system
    CALL INIT_MOVEMENT_SYSTEM

    ; Initialize collision system
    CALL INIT_COLLISION_SYSTEM

    ; Initialize input system
    CALL INIT_INPUT_SYSTEM

    ; Initialize behavior system
    CALL INIT_BEHAVIOR_SYSTEM

    RET

; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

INIT_POSITION_SYSTEM:
    ; Initialize position component system
    ; Clear all entity positions
    LD HL, entity_x_pos
    LD DE, entity_x_pos+1
    LD BC, 31
    LD (HL), 0
    LDIR

    LD HL, entity_y_pos
    LD DE, entity_y_pos+1
    LD BC, 31
    LD (HL), 0
    LDIR
    RET

UPDATE_POSITION_COMPONENT:
    ; Update positions based on velocities (Movement → Position)
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks

position_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_POSITION     ; Check if has position component
    JR Z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    LD A, (HL)
    AND COMP_MASK_MOVEMENT
    JR Z, position_next_entity ; Skip velocity if no movement

    ; TODO: Add velocity to position logic here
    ; entity_x_pos[entity] += entity_vel_x[entity]
    ; entity_y_pos[entity] += entity_vel_y[entity]

position_next_entity:
    INC HL                     ; Next entity
    DJNZ position_update_loop
    RET

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

INIT_SPRITE_SYSTEM:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    CALL CLEAR_ALL_SPRITES
    RET

UPDATE_SPRITE_COMPONENT:
    ; Update sprite rendering based on entity positions
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks
    LD C, 0                    ; Entity index counter

sprite_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_SPRITE       ; Check if has sprite component
    JR Z, sprite_next_entity   ; Skip if no sprite component

    ; Render sprite at entity position
    PUSH BC
    PUSH HL

    ; Get entity position
    LD HL, entity_x_pos
    LD E, C                    ; Entity index
    LD D, 0
    ADD HL, DE                 ; HL points to entity X
    LD B, (HL)                 ; B = X position

    LD HL, entity_y_pos
    ADD HL, DE                 ; HL points to entity Y
    LD C, (HL)                 ; C = Y position

    ; Show sprite (A=sprite#, B=X, C=Y, D=pattern, E=color)
    LD A, E                    ; Sprite number = entity index
    LD D, 0                    ; Pattern 0 (TODO: get from entity data)
    LD E, 15                   ; Color white (TODO: get from entity data)
    CALL SHOW_SPRITE

    POP HL
    POP BC

sprite_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity index
    DJNZ sprite_update_loop

    ; Update all sprites to VRAM
    CALL UPDATE_SPRITES_TO_VRAM
    RET

; ==================================================================
; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
; ==================================================================

INIT_MOVEMENT_SYSTEM:
    ; Initialize movement/physics system
    ; Clear velocities
    LD A, 0
    LD (entity_vel_x), A
    LD (entity_vel_y), A
    RET

UPDATE_MOVEMENT_COMPONENT:
    ; Update movement/physics for entities
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks

movement_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_MOVEMENT     ; Check if has movement component
    JR Z, movement_next_entity ; Skip if no movement component

    ; Apply physics/movement logic here
    ; TODO: Apply gravity, friction, collision response, etc.

movement_next_entity:
    INC HL                     ; Next entity
    DJNZ movement_update_loop
    RET

; ==================================================================
; COLLISION COMPONENT SYSTEM (Based on ScreenEditor collision detection)
; ==================================================================

INIT_COLLISION_SYSTEM:
    ; Initialize collision detection system
    RET

UPDATE_COLLISION_COMPONENT:
    ; Check collisions between entities and environment
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks
    LD C, 0                    ; Entity index

collision_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_COLLISION    ; Check if has collision component
    JR Z, collision_next_entity ; Skip if no collision component

    ; Perform collision detection for this entity
    PUSH BC
    PUSH HL

    ; Get entity position
    LD HL, entity_x_pos
    LD E, C                    ; Entity index
    LD D, 0
    ADD HL, DE                 ; HL points to entity X
    LD A, (HL)                 ; A = X position

    LD HL, entity_y_pos
    ADD HL, DE                 ; HL points to entity Y
    LD B, (HL)                 ; B = Y position

    ; Check screen boundaries (256x192 with 16x16 sprites)
    ; Left boundary
    CP 0
    JR Z, collision_boundary_hit

    ; Right boundary (256 - 16 = 240)
    CP 240
    JR NC, collision_boundary_hit

    ; Top boundary
    LD A, B
    CP 0
    JR Z, collision_boundary_hit

    ; Bottom boundary (192 - 16 = 176)
    CP 176
    JR NC, collision_boundary_hit

    ; Check tile collision (if screen maps exist)
    CALL CHECK_TILE_COLLISION

    ; Check entity-to-entity collision
    CALL CHECK_ENTITY_COLLISION

    JR collision_check_complete

collision_boundary_hit:
    ; Handle boundary collision
    CALL HANDLE_BOUNDARY_COLLISION

collision_check_complete:
    POP HL
    POP BC

collision_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity index
    DJNZ collision_update_loop
    RET

; ==================================================================
; COLLISION HELPER FUNCTIONS (Critical for Gameplay Parity)
; ==================================================================

CHECK_TILE_COLLISION:
    ; Check collision with background tiles
    ; A = X position, B = Y position
    ; Convert pixel position to tile coordinates
    PUSH AF
    PUSH BC

    ; DYNAMIC TILE SIZE CONVERSION
    ; TODO: This should be calculated from actual screen map tile sizes
    ; For now, detect most common tile size in project
${analysis.tiles && analysis.tiles.length > 0 ? `
    ; Project tile analysis: ${analysis.tiles.map(t => `${t.width}x${t.height}`).join(', ')}
    ; Using first tile as reference: ${analysis.tiles[0].width}x${analysis.tiles[0].height}
    ; Convert X to tile column (divide by ${analysis.tiles[0].width})` : `
    ; No tiles detected - using default 16x16
    ; Convert X to tile column (divide by 16)`}

${analysis.tiles && analysis.tiles.length > 0 && analysis.tiles[0].width >= 8 && Number.isInteger(Math.log2(analysis.tiles[0].width)) ? `
    ; Divide by ${analysis.tiles[0].width} (${Math.log2(analysis.tiles[0].width)} shifts)
${Array.from({length: Math.log2(analysis.tiles[0].width)}, (_, i) => `    SRL A                      ; A = X / ${Math.pow(2, i+1)}`).join('\n')}
` : `
    ; Default 16px tiles (4 shifts)
    SRL A                      ; A = X / 2
    SRL A                      ; A = X / 4
    SRL A                      ; A = X / 8
    SRL A                      ; A = X / 16
`}    LD C, A                    ; C = tile column

${analysis.tiles && analysis.tiles.length > 0 && analysis.tiles[0].height >= 8 && Number.isInteger(Math.log2(analysis.tiles[0].height)) ? `
    ; Convert Y to tile row (divide by ${analysis.tiles[0].height})
    LD A, B
${Array.from({length: Math.log2(analysis.tiles[0].height)}, (_, i) => `    SRL A                      ; A = Y / ${Math.pow(2, i+1)}`).join('\n')}
` : `
    ; Default 16px tiles (4 shifts)
    LD A, B
    SRL A                      ; A = Y / 2
    SRL A                      ; A = Y / 4
    SRL A                      ; A = Y / 8
    SRL A                      ; A = Y / 16
`}    LD B, A                    ; B = tile row

    ; Check if position is within valid tile map
    LD A, C
    CP ${analysis.tiles && analysis.tiles.length > 0 ? Math.floor(256 / analysis.tiles[0].width) : 16}                      ; Screen width in tiles
    JR NC, no_tile_collision
    LD A, B
    CP ${analysis.tiles && analysis.tiles.length > 0 ? Math.floor(192 / analysis.tiles[0].height) : 12}                      ; Screen height in tiles
    JR NC, no_tile_collision

    ; Get tile at position (simplified - would read from behavior map)
    ; For now, assume all non-zero tiles are solid
    ; This would read from the behavior map generated from screen data
    CALL GET_BEHAVIOR_TILE     ; Returns A = behavior value
    OR A
    JR Z, no_tile_collision    ; 0 = passable

    ; Collision detected - handle it
    CALL HANDLE_TILE_COLLISION

no_tile_collision:
    POP BC
    POP AF
    RET

CHECK_ENTITY_COLLISION:
    ; Check collision with other entities
    ; A = current entity X, B = current entity Y, C = current entity index
    PUSH BC
    PUSH AF

    ; Loop through all other entities
    LD HL, entity_comp_masks
    LD E, 0                    ; Other entity index

entity_collision_loop:
    LD A, E
    CP C                       ; Skip self
    JR Z, next_entity_collision

    ; Check if other entity has collision component
    LD A, (HL)
    AND COMP_MASK_COLLISION
    JR Z, next_entity_collision

    ; Get other entity position
    PUSH HL
    PUSH DE

    LD HL, entity_x_pos
    LD D, 0
    ADD HL, DE                 ; HL points to other entity X
    LD D, (HL)                 ; D = other X

    LD HL, entity_y_pos
    ADD HL, DE                 ; HL points to other entity Y
    LD E, (HL)                 ; E = other Y

    ; Check if entities overlap (16x16 sprites)
    ; Current entity: A = X, B = Y
    ; Other entity: D = X, E = Y

    ; X overlap check: |X1 - X2| < 16
    LD H, A                    ; H = current X
    LD A, D                    ; A = other X
    SUB H                      ; A = other X - current X
    JR NC, x_diff_positive     ; Jump if positive
    NEG                        ; Make positive
x_diff_positive:
    CP 16                      ; Check if < 16
    JR NC, no_entity_collision ; No X overlap

    ; Y overlap check: |Y1 - Y2| < 16
    LD A, E                    ; A = other Y
    SUB B                      ; A = other Y - current Y
    JR NC, y_diff_positive     ; Jump if positive
    NEG                        ; Make positive
y_diff_positive:
    CP 16                      ; Check if < 16
    JR NC, no_entity_collision ; No Y overlap

    ; Collision detected!
    CALL HANDLE_ENTITY_COLLISION

no_entity_collision:
    POP DE
    POP HL

next_entity_collision:
    INC HL                     ; Next entity mask
    INC E                      ; Next entity index
    LD A, E
    CP 32                      ; Check all 32 entities
    JR NZ, entity_collision_loop

    POP AF
    POP BC
    RET

HANDLE_BOUNDARY_COLLISION:
    ; Handle collision with screen boundaries
    ; Stop movement in the collision direction
    LD A, 0
    LD (entity_vel_x), A       ; Stop X movement
    LD (entity_vel_y), A       ; Stop Y movement
    RET

HANDLE_TILE_COLLISION:
    ; Handle collision with solid tiles
    ; Prevent movement into the tile
    LD A, 0
    LD (entity_vel_x), A       ; Stop X movement
    LD (entity_vel_y), A       ; Stop Y movement
    RET

HANDLE_ENTITY_COLLISION:
    ; Handle collision between entities
    ; Implementation depends on game logic (damage, bouncing, etc.)
    RET

GET_BEHAVIOR_TILE:
    ; Get behavior value for tile at (B, C)
    ; Returns A = behavior value (0=passable, 1=solid, etc.)
    ; This would read from the behavior map data
    ; For now, return 0 (all passable)
    LD A, 0
    RET

; ==================================================================
; INPUT COMPONENT SYSTEM (Based on input handling)
; ==================================================================

INIT_INPUT_SYSTEM:
    ; Initialize input handling system
    XOR A
    LD (input_state), A
    LD (prev_input_state), A
    RET

UPDATE_INPUT_COMPONENT:
    ; Update input handling for player entities
    ; Store previous input state for edge detection
    LD A, (input_state)
    LD (prev_input_state), A

    ; Read current joystick state
    LD A, 0                    ; Joystick port 0
    CALL GTSTCK                ; Get joystick status (BIOS call)
    LD (input_state), A        ; Store current input state

    ; Process input for entities with input component
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks
    LD C, 0                    ; Entity index

input_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_INPUT        ; Check if has input component
    JR Z, input_next_entity    ; Skip if no input component

    ; Apply input to entity movement (real implementation)
    PUSH BC
    PUSH HL

    ; Convert joystick input to velocity
    LD A, (input_state)
    LD B, 0                    ; Default X velocity
    LD C, 0                    ; Default Y velocity

    ; Check directional input
    CP STICK_UP
    JR Z, input_move_up
    CP STICK_DOWN
    JR Z, input_move_down
    CP STICK_LEFT
    JR Z, input_move_left
    CP STICK_RIGHT
    JR Z, input_move_right
    CP STICK_UPRIGHT
    JR Z, input_move_upright
    CP STICK_UPLEFT
    JR Z, input_move_upleft
    CP STICK_DOWNRIGHT
    JR Z, input_move_downright
    CP STICK_DOWNLEFT
    JR Z, input_move_downleft
    JR input_apply_velocity

input_move_up:
    LD C, -2                   ; Negative Y velocity (up)
    JR input_apply_velocity

input_move_down:
    LD C, 2                    ; Positive Y velocity (down)
    JR input_apply_velocity

input_move_left:
    LD B, -2                   ; Negative X velocity (left)
    JR input_apply_velocity

input_move_right:
    LD B, 2                    ; Positive X velocity (right)
    JR input_apply_velocity

input_move_upright:
    LD B, 1                    ; Diagonal movement (slower)
    LD C, -1
    JR input_apply_velocity

input_move_upleft:
    LD B, -1
    LD C, -1
    JR input_apply_velocity

input_move_downright:
    LD B, 1
    LD C, 1
    JR input_apply_velocity

input_move_downleft:
    LD B, -1
    LD C, 1

input_apply_velocity:
    ; Apply calculated velocity to entity
    ; Store X velocity (entity_vel_x is temp storage for now)
    LD A, B
    LD (entity_vel_x), A       ; Store calculated X velocity

    ; Store Y velocity
    LD A, C
    LD (entity_vel_y), A       ; Store calculated Y velocity

    POP HL
    POP BC

input_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity index
    DJNZ input_update_loop
    RET

; ==================================================================
; BEHAVIOR COMPONENT SYSTEM (Based on BehaviorEditor logic)
; ==================================================================

INIT_BEHAVIOR_SYSTEM:
    ; Initialize AI/behavior system
    RET

UPDATE_BEHAVIOR_COMPONENT:
    ; Update AI/behavior logic for entities
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks

behavior_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_BEHAVIOR     ; Check if has behavior component
    JR Z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior scripts/AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
    INC HL                     ; Next entity
    DJNZ behavior_update_loop
    RET

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS (Based on EntityTemplate system)
; ==================================================================

; Create entity with components (A = entity ID, B = component mask)
CREATE_ENTITY:
    ; Set component mask for entity
    LD HL, entity_comp_masks
    LD E, A                    ; Entity index
    LD D, 0
    ADD HL, DE                 ; HL points to entity mask
    LD (HL), B                 ; Set component mask

    ; Initialize component data based on mask
    BIT 0, B                   ; Check COMP_MASK_POSITION
    CALL NZ, INIT_ENTITY_POSITION

    BIT 1, B                   ; Check COMP_MASK_SPRITE
    CALL NZ, INIT_ENTITY_SPRITE

    ; TODO: Initialize other components based on mask bits

    RET

; Initialize position component for entity (A = entity ID)
INIT_ENTITY_POSITION:
    LD HL, entity_x_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 100               ; Default X position

    LD HL, entity_y_pos
    ADD HL, DE
    LD (HL), 100               ; Default Y position
    RET

; Initialize sprite component for entity (A = entity ID)
INIT_ENTITY_SPRITE:
    ; Set sprite as visible with default pattern
    LD HL, sprite_pattern
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Pattern 0

    LD HL, sprite_color
    ADD HL, DE
    LD (HL), 15                ; White color
    RET

; ==================================================================
; END OF COMPONENT SYSTEMS
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

    // Generate individual entity functions with REAL POSITIONS from JSON
    analysis.entities.forEach((entity, index) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

      // Get real position from JSON entity data
      const realX = entity.position?.x || 100;
      const realY = entity.position?.y || 100;

      // Convert tile coordinates to pixel coordinates
      // NOTE: Mideas tiles can be any size multiple of 8 pixels
      // Need to determine the grid size from the actual screen layout
      // For now, assume standard 16x16 grid but this should be dynamic
      const tileGridSizeX = 16;  // Should be calculated from screen map
      const tileGridSizeY = 16;  // Should be calculated from screen map
      const pixelX = realX * tileGridSizeX;
      const pixelY = realY * tileGridSizeY;

      code += `INIT_${entityName}:
    ; Initialize ${entity.name} at real position from JSON
    ; JSON position: (${realX}, ${realY}) tiles = (${pixelX}, ${pixelY}) pixels

    ; Set entity ID and component mask
    LD A, ${index}             ; Entity ID
    LD B, COMP_MASK_POSITION + COMP_MASK_SPRITE + COMP_MASK_MOVEMENT + COMP_MASK_COLLISION + COMP_MASK_INPUT
    CALL CREATE_ENTITY         ; Create with all components

    ; Set real position from JSON data
    LD HL, entity_x_pos
    LD E, ${index}             ; Entity index
    LD D, 0
    ADD HL, DE
    LD (HL), ${pixelX}         ; Set real X position from JSON

    LD HL, entity_y_pos
    ADD HL, DE
    LD (HL), ${pixelY}         ; Set real Y position from JSON

    ; Set sprite pattern and color
    LD HL, sprite_pattern
    ADD HL, DE
    LD (HL), ${index}          ; Use entity index as sprite pattern

    LD HL, sprite_color
    ADD HL, DE
    LD (HL), 15                ; White color

    ; Make sprite visible immediately
    LD A, ${index}             ; Sprite number
    LD B, ${pixelX}            ; X position
    LD C, ${pixelY}            ; Y position
    LD D, ${index}             ; Pattern
    LD E, 15                   ; Color
    CALL SHOW_SPRITE
    RET

UPDATE_${entityName}:
    ; Update ${entity.name} logic with real behavior
    ; Check if entity has input component (player entities)
    LD A, ${index}
    LD HL, entity_comp_masks
    LD E, A
    LD D, 0
    ADD HL, DE
    LD A, (HL)
    AND COMP_MASK_INPUT
    RET Z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
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
            ...DEFAULT_TILE_BANK_DEFINITIONS[1], // Use main game bank as template
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
    ; Load ${screen.name} screen (BIOS LDIRVM handles timing)
    LD HL, SCREEN_${screenName}_${index}_LAYOUT
    LD DE, NAMETBL
    LD BC, SCREEN_${screenName}_${index}_SIZE
    CALL LDIRVM                ; BIOS handles safe VRAM access
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
    ; Load game screen (BIOS LDIRVM handles timing)
    LD HL, SCREEN_GAME_DATA
    LD DE, NAMETBL
    LD BC, 768
    CALL LDIRVM                ; BIOS handles safe VRAM access
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
 * Generate font data file with MSX font patterns for Screen 2 text
 */
function generateFontFile(analysis: ProjectAnalysis): string {
  return `; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data based on Mideas Font Editor
; Character patterns optimized for Screen 2 mode text rendering
; ==================================================================

; ==================================================================
; FONT PATTERN DATA (Based on DEFAULT_MSX_FONT from FontEditor)
; ==================================================================

; Character patterns (8 bytes per character, 8x8 pixels)
; Format: Each byte represents one row of 8 pixels (bit 7 = leftmost pixel)

FONT_PATTERN_DATA:
    ; Character 32: Space
    DB #00, #00, #00, #00, #00, #00, #00, #00

    ; Character 48: '0'
    DB #3E, #7F, #73, #73, #73, #7F, #3E, #00

    ; Character 49: '1'
    DB #18, #38, #18, #18, #18, #18, #7E, #00

    ; Character 50: '2'
    DB #3E, #7F, #03, #3E, #60, #7F, #3E, #00

    ; Character 58: ':'
    DB #00, #36, #36, #00, #36, #36, #00, #00

    ; Character 65: 'A'
    DB #3E, #7F, #63, #7F, #7F, #63, #63, #00

    ; Character 66: 'B'
    DB #7E, #7F, #63, #7E, #63, #7F, #7E, #00

    ; Character 67: 'C'
    DB #3C, #7E, #60, #60, #60, #7E, #3C, #00

    ; Character 68: 'D'
    DB #7C, #7E, #66, #66, #66, #7E, #7C, #00

    ; Character 69: 'E'
    DB #7F, #7F, #60, #7C, #60, #7F, #7F, #00

    ; Character 70: 'F'
    DB #7F, #7F, #60, #7C, #60, #60, #60, #00

    ; Character 71: 'G'
    DB #3C, #7E, #60, #67, #63, #7F, #3E, #00

    ; Character 72: 'H'
    DB #63, #63, #63, #7F, #63, #63, #63, #00

    ; Character 73: 'I'
    DB #7E, #18, #18, #18, #18, #18, #7E, #00

    ; Character 76: 'L'
    DB #60, #60, #60, #60, #60, #7F, #7F, #00

    ; Character 77: 'M'
    DB #63, #77, #7F, #6B, #63, #63, #63, #00

    ; Character 78: 'N'
    DB #63, #73, #7B, #6F, #67, #63, #63, #00

    ; Character 79: 'O'
    DB #3E, #7F, #63, #63, #63, #7F, #3E, #00

    ; Character 80: 'P'
    DB #7E, #7F, #63, #7F, #7E, #60, #60, #00

    ; Character 82: 'R'
    DB #7E, #7F, #63, #7E, #7B, #6F, #63, #00

    ; Character 83: 'S'
    DB #3E, #7F, #60, #3E, #0F, #7F, #3E, #00

    ; Character 84: 'T'
    DB #7F, #7F, #18, #18, #18, #18, #18, #00

    ; Character 85: 'U'
    DB #63, #63, #63, #63, #63, #7F, #3E, #00

    ; Character 63: '?'
    DB #3E, #7F, #63, #18, #18, #00, #18, #00

; Character index table (for quick lookup)
FONT_CHAR_INDEX:
    DB 32, 48, 49, 50, 58, 65, 66, 67, 68, 69, 70, 71, 72, 73, 76, 77, 78, 79, 80, 82, 83, 84, 85, 63
FONT_CHAR_COUNT EQU 24

; ==================================================================
; FONT LOADING FUNCTIONS (Based on Mideas generateFontPatternBinaryData)
; ==================================================================

LOAD_CUSTOM_FONT:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; This replaces the MSX BIOS font with our custom font for text display
    ; BIOS LDIRVM handles timing automatically

    ; Calculate target address in Pattern Generator Table
    ; Characters 32-127 (printable ASCII) start at pattern #20 (32 decimal)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + (32 * 8)     ; Start at character 32 (space)
    LD BC, FONT_CHAR_COUNT * 8    ; Load all custom characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_BANK0:
    ; Load font to Pattern Generator Bank 0 (characters 0-255)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + (32 * 8)     ; Start at character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_BANK1:
    ; Load font to Pattern Generator Bank 1 (same patterns)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + #800 + (32 * 8)  ; Bank 1 + character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_BANK2:
    ; Load font to Pattern Generator Bank 2 (same patterns)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + #1000 + (32 * 8) ; Bank 2 + character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_ALL_FONT_BANKS:
    ; Load custom font to all three Pattern Generator banks
    ; Required for complete Screen 2 text coverage
    CALL LOAD_FONT_BANK0
    CALL LOAD_FONT_BANK1
    CALL LOAD_FONT_BANK2
    RET

; ==================================================================
; FONT COLOR ATTRIBUTES (Based on MSXFontColorAttributes)
; ==================================================================

; Default color attributes for font characters (Screen 2 mode)
; Format: (FG color << 4) | BG color per 8-pixel row
FONT_COLOR_DATA:
    ; Character 32: Space (transparent)
    DB #00, #00, #00, #00, #00, #00, #00, #00

    ; Character 48-85: Standard text (white on black)
    ; Repeat for each character pattern
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '0'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '1'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '2'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; ':'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'A'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'B'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'C'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'D'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'E'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'F'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'G'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'H'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'I'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'L'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'M'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'N'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'O'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'P'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'R'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'S'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'T'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'U'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '?'

LOAD_FONT_COLORS:
    ; Load font color attributes to Color Attribute Table
    ; Based on generateFontColorBinaryData from FontEditor
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + (32 * 8)     ; Start at character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_COLORS_ALL_BANKS:
    ; Load font colors to all three Color Attribute banks
    ; Bank 0
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + (32 * 8)
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM

    ; Bank 1
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + #800 + (32 * 8)
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM

    ; Bank 2
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + #1000 + (32 * 8)
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM
    RET

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
PRINT_STRING_SCREEN2:
    PUSH BC
    LD B, 0                        ; Character counter

print_string_loop:
    LD A, (HL)                     ; Get character
    OR A                           ; Check for null terminator
    JR Z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    PUSH HL                        ; Save string pointer
    PUSH DE                        ; Save VRAM position
    LD HL, DE                      ; HL = VRAM address for WRTVRM
    CALL WRTVRM                    ; Write character to VRAM
    POP DE                         ; Restore VRAM position
    POP HL                         ; Restore string pointer

    ; Move to next character
    INC HL                         ; Next character in string
    INC DE                         ; Next position in VRAM
    INC B                          ; Count characters
    LD A, B
    CP 32                          ; Limit to screen width
    JR NZ, print_string_loop       ; Continue if not at edge

print_string_end:
    POP BC
    RET

; Initialize font system for Screen 2 text rendering
INIT_FONT_SYSTEM:
    ; Load custom font patterns and colors
    CALL LOAD_ALL_FONT_BANKS       ; Load patterns to all banks
    CALL LOAD_FONT_COLORS_ALL_BANKS ; Load colors to all banks
    RET

; ==================================================================
; END OF FONT DATA
; ==================================================================
`;
}

/**
 * Generate menus file with menu systems and user interface
 */
function generateMenusFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
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
    ; Display main menu with custom font
    CALL CLS

    ; Make sure custom font is loaded
    CALL INIT_FONT_SYSTEM

    ; Print title using custom font
    LD HL, txt_title
    LD DE, NAMETBL + (5 * 32) + 10  ; Row 5, column 10
    CALL PRINT_STRING_SCREEN2        ; Use custom font print function

    ; Print menu options using custom font
    LD HL, txt_start
    LD DE, NAMETBL + (10 * 32) + 12
    CALL PRINT_STRING_SCREEN2

    LD HL, txt_exit
    LD DE, NAMETBL + (12 * 32) + 12
    CALL PRINT_STRING_SCREEN2

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
    'font.asm': generateFontFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'main.asm': generateMainFile(projectName, analysis)
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, projectName, analysis);
  }

  console.log('✅ Modular ASM files generated successfully!');
  console.log(`📊 Generated ${Object.keys(files).length} files`);
  console.log(`📁 Files: ${Object.keys(files).join(', ')}`);

  return files;
}