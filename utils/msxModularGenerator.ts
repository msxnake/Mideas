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
 * ASM Naming Convention Helpers
 * - UPPERCASE: Constants (EQU values, sprite IDs, screen IDs, etc.)
 * - lowercase: Routine labels, variables, jump targets
 */

/** Convert routine name to lowercase (for labels, CALL, JP, JR targets) */
function toRoutineLabel(name: string): string {
  return name.toLowerCase();
}

/** Keep constant name in UPPERCASE (for EQU definitions) */
function toConstantName(name: string): string {
  return name.toUpperCase();
}

/** Sanitize and convert asset ID to routine label */
function toAssetRoutineLabel(id: string, prefix: string = ''): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return toRoutineLabel(prefix + sanitized);
}

/** Sanitize and convert asset ID to constant name */
function toAssetConstant(id: string, prefix: string = ''): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return toConstantName(prefix + sanitized);
}

/**
 * Project Summary interfaces (extracted from summary system)
 */
export interface ProjectSummary {
  schema: string;
  projectInfo: {
    name: string;
    extractedFrom: string;
    extractionDate: string;
    mideasVersion: string;
    summaryVersion: string;
  };
  execution: {
    mainGameFlow: {
      id: string;
      name: string;
      startNodeId: string;
      nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        worldAssetId?: string;
      }>;
      connections: Array<{
        id: string;
        fromNodeId: string;
        toNodeId: string;
      }>;
    };
    startBehavior: string;
    initialState: string;
    hasMenus: boolean;
  };
  assets: {
    worldMaps: Array<{
      id: string;
      name: string;
      startScreenId: string;
      screens: any[];
      connections: any[];
    }>;
    screens: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      layers: any;
      tileBank: any;
      entityInstances: any[];
    }>;
    tiles: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      data: any;
    }>;
    sprites: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      frames: number;
      msxSize: string;
      data: any;
    }>;
    entities: Array<{
      templateId: string;
      name: string;
      components: any[];
      usedInScreens: string[];
    }>;
    components: Array<{
      id: string;
      name: string;
      type: string;
      properties: any[];
    }>;
    fonts: any[];
    stateMachines: any[];
  };
  metadata: {
    extraction: {
      totalOriginalAssets: number;
      totalUsedAssets: number;
      compressionRatio: string;
      brokenReferences: string[];
    };
    validation: {
      gameFlowValid: boolean;
      allReferencesValid: boolean;
      msxCompatible: boolean;
      warnings: string[];
    };
  };
}

/**
 * Convert Project Summary to Analysis format
 */
function convertSummaryToAnalysis(summary: ProjectSummary): ProjectAnalysis {
  console.log('🔄 Converting summary to analysis format...');

  // Convert sprites from summary format to analysis format
  const sprites: Sprite[] = summary.assets.sprites.map(sprite => ({
    id: sprite.id,
    name: sprite.name,
    size: {
      width: sprite.width,
      height: sprite.height
    },
    spritePalette: sprite.data?.spritePalette || ['#000000', '#FFFFFF', '#FF0000', '#00FF00'],
    backgroundColor: sprite.data?.backgroundColor || '#000000',
    frames: Array.isArray(sprite.data?.frames) ? sprite.data.frames :
            typeof sprite.frames === 'number' ? new Array(sprite.frames).fill({}).map((_, i) => ({
              id: `frame_${i}`,
              data: sprite.data?.pixelData || []
            })) :
            [{ id: 'frame_0', data: sprite.data?.pixelData || [] }],
    currentFrameIndex: 0,
    attributes: sprite.data || {}
  }));

  // Convert tiles (if any)
  const tiles: Tile[] = summary.assets.tiles.map(tile => ({
    id: tile.id,
    name: tile.name,
    width: tile.width,
    height: tile.height,
    data: tile.data?.pixelData || [],
    logicalProperties: tile.data?.logicalProperties || {
      mapId: 0,
      familyId: 0,
      instanceId: 0,
      isSolid: false,
      isBreakable: false
    }
  }));

  // Convert screens
  const screenMaps: ScreenMap[] = summary.assets.screens.map(screen => ({
    id: screen.id,
    name: screen.name,
    width: screen.width,
    height: screen.height,
    layers: {
      background: screen.layers?.background || [],
      collision: screen.layers?.collision || [],
      effects: screen.layers?.effects || [],
      entities: screen.entityInstances || []
    }
  }));

  // Convert entities (entity instances from summary)
  const entities: EntityInstance[] = [];

  // Extract entity instances from screens
  summary.assets.screens.forEach(screen => {
    if (screen.entityInstances) {
      screen.entityInstances.forEach(instance => {
        entities.push({
          id: instance.id || `instance_${entities.length}`,
          name: instance.name || `Entity_${entities.length}`,
          entityTemplateId: instance.templateId || '',
          componentOverrides: instance.components || {},
          position: instance.position || { x: 0, y: 0 }
        });
      });
    }
  });

  // Create GameFlow from summary
  const gameFlow: GameFlowGraph | null = summary.execution.mainGameFlow ? {
    id: summary.execution.mainGameFlow.id,
    name: summary.execution.mainGameFlow.name,
    startNodeId: summary.execution.mainGameFlow.startNodeId,
    nodes: summary.execution.mainGameFlow.nodes as any[], // Type casting needed due to simplified summary format
    connections: summary.execution.mainGameFlow.connections as any[], // Type casting needed
    panOffset: { x: 0, y: 0 },
    zoomLevel: 1.0
  } : null;

  console.log(`✅ Converted summary: ${sprites.length} sprites, ${tiles.length} tiles, ${screenMaps.length} screens, ${entities.length} entities`);

  return {
    projectName: summary.projectInfo.name,
    components: summary.assets.components.map(comp => ({
      id: comp.id,
      name: comp.name,
      type: comp.type as any,
      properties: comp.properties || []
    })),
    templates: summary.assets.entities.map(entity => ({
      id: entity.templateId,
      name: entity.name,
      icon: '',
      description: '',
      components: entity.components || []
    })),
    sprites,
    tiles,
    screenMaps,
    entities,
    gameFlow,
    hasECS: summary.assets.components.length > 0,
    hasMultipleScreens: summary.assets.screens.length > 1,
    hasSprites: sprites.length > 0,
    hasAnimations: sprites.some(s => s.frames.length > 1),
    hasCollisions: false, // Will be determined by component analysis
    hasMenuSystem: summary.execution.hasMenus || false,
    customStates: [] // Will be populated from state machines if needed
  };
}

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

fillscreen:
    ; Fill screen with default pattern
    call CLS
    ret

check_if_60hz:
    ; Check if system is 60Hz or 50Hz
    ; Return A=0 for 50Hz, A=1 for 60Hz
    ld a, 1                 ; Default to 60Hz
    ret

random_seed_update:
    ; Update random seed
    ; Simple placeholder implementation
    ret

init_font_system:
    ; Initialize custom font system
    ; For BasicEnemy, use default MSX font
    ret

print_string_screen2:
    ; Print string using custom font in Screen 2
    ; HL = string, DE = VRAM position
    ; Stub function - text rendering handled by font.asm if needed
    ret

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
 * Generate initialization code for a specific GameFlow node
 * This determines what happens after INIT_ROM based on GameFlow structure
 */
function generateInitCodeForNode(
  node: any | undefined,
  analysis: ProjectAnalysis
): string {
  if (!node) {
    return `
    ; No connected node - fallback to generic main program
    jp main_program`;
  }

  switch (node.type) {
    case 'WorldLink':
      const worldAssetId = node.worldAssetId;
      const worldMap = analysis.screenMaps?.find(s => s.id === worldAssetId);
      return `
    ; GameFlow: Start → WorldLink (${worldMap?.name || 'World'})
    ; Initialize game world directly from GameFlow
    call init_sprites
    call init_components
    call init_entities
    call ${toRoutineLabel('load_world_' + worldAssetId)}
    jp game_loop  ; Jump to main game loop`;

    case 'SubMenu':
      const menuNode = node;
      return `
    ; GameFlow: Start → SubMenu ("${menuNode.title || 'Menu'}")
    ; Show main menu from GameFlow
    call init_font_system
    call ${toRoutineLabel('show_menu_' + menuNode.id)}
    jp menu_loop  ; Jump to menu loop`;

    case 'Text':
      const textNode = node;
      return `
    ; GameFlow: Start → Text ("${textNode.title || 'Text'}")
    ; Show intro text from GameFlow
    call init_font_system
    call ${toRoutineLabel('show_text_' + textNode.id)}
    jp main_program`;

    case 'Transition':
      return `
    ; GameFlow: Start → Transition (${node.effect || 'default'})
    ; Show transition effect from GameFlow
    call init_sprites
    call ${toRoutineLabel('transition_effect_' + node.id)}
    jp main_program`;

    case 'Group':
      return `
    ; GameFlow: Start → Group (nested GameFlow)
    ; Load nested GameFlow: ${node.gameFlowAssetId || 'Unknown'}
    call ${toRoutineLabel('init_gameflow_' + (node.gameFlowAssetId || 'default'))}
    jp main_program`;

    default:
      return `
    ; GameFlow: Start → ${node.type} (not yet supported in ASM generator)
    ; Fallback to generic main program
    jp main_program`;
  }
}

/**
 * Generate ROM header with "AB" signature (header.asm)
 * NOW WITH GAMEFLOW INTEGRATION - generates initialization based on GameFlow Main
 */
function generateHeaderFile(projectName: string, analysis?: ProjectAnalysis): string {
  // Check if we have GameFlow data to generate from
  let gameFlowComment = '';
  let initCode = `
    ; Jump to main program
    jp main_program`;

  if (analysis?.gameFlow) {
    const gameFlow = analysis.gameFlow;
    gameFlowComment = `\n; GameFlow Integration: Using "${gameFlow.name}" as initialization flow`;

    // Find Start node
    const startNode = gameFlow.nodes.find(n => n.type === 'Start');

    if (startNode) {
      // Find first connection from Start node
      const firstConnection = gameFlow.connections.find(
        c => (c.from as any)?.nodeId === startNode.id || (typeof c.from === 'string' && c.from === startNode.id)
      );

      if (firstConnection) {
        // Find the target node
        const targetNodeId = firstConnection.to?.nodeId || firstConnection.to;
        const firstNode = gameFlow.nodes.find(n => n.id === targetNodeId);

        if (firstNode) {
          gameFlowComment += `\n; Flow: Start → ${firstNode.type} (${(firstNode as any).title || (firstNode as any).name || firstNode.id})`;
          initCode = generateInitCodeForNode(firstNode, analysis);
        }
      }
    }
  }

  return `; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${gameFlowComment}
; ==================================================================

    org #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    db "AB"             ; MSX cartridge signature
    dw init_rom         ; Initialization address
    dw 0                ; Statement handler (not used)
    dw 0                ; Device handler (not used)
    dw 0                ; Text handler (not used)
    dw 0                ; Reserved
    dw 0                ; Reserved
    dw 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
init_rom:
    ; Initialize stack
    ld sp, #F380

    di                           ; Disable interrupts during init
    ld a,#C9
    ld (HKEY),a
    ei

    ; Set up memory mapper (if any)
    ; This is a placeholder for future mapper initialization
    ; call setup_rom_ram_slots

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
    call fillscreen

     call check_if_60hz
    ld (isComputer50HzOr60Hz),a

    ;init random seed
    call random_seed_update

${initCode}

; ==================================================================
; END OF HEADER
; ==================================================================
`;
}

/**
 * Generate GameFlow State Machine from GameFlow Graph
 * Creates node handlers and state transitions matching Play mode execution
 */
function generateGameFlowStateMachine(gameFlow: any, analysis: ProjectAnalysis): string {
  let code = `
; GameFlow: ${gameFlow.name || 'Unknown'}
; Nodes: ${gameFlow.nodes?.length || 0}
; Connections: ${gameFlow.connections?.length || 0}

`;

  // Generate handler routines for each node
  if (gameFlow.nodes && gameFlow.nodes.length > 0) {
    gameFlow.nodes.forEach((node: any) => {
      const nodeLabel = `gameflow_node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

      switch (node.type) {
        case 'Start':
          // Find connection from Start node
          const startConnection = gameFlow.connections?.find(
            (c: any) => c.from?.nodeId === node.id || c.from === node.id
          );

          if (startConnection) {
            const nextNodeId = startConnection.to?.nodeId || startConnection.to;
            const nextNodeLabel = `gameflow_node_${nextNodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            code += `
${nodeLabel}:
    ; Start Node - transition to first connected node
    ld hl, ${nextNodeLabel}
    jp execute_gameflow_node
`;
          } else {
            code += `
${nodeLabel}:
    ; Start Node - no connections, fallback to main program
    ret
`;
          }
          break;

        case 'WorldLink':
          const worldAssetId = node.worldAssetId;
          code += `
${nodeLabel}:
    ; WorldLink Node - Load world: ${worldAssetId || 'Unknown'}
    call init_sprites
    call init_components
    call init_entities
    call ${toRoutineLabel('load_world_' + (worldAssetId || 'default'))}
    jp game_loop
`;
          break;

        case 'SubMenu':
          code += `
${nodeLabel}:
    ; SubMenu Node - "${node.title || 'Menu'}"
    call init_font_system
    call ${toRoutineLabel('show_menu_' + node.id)}
    ; Wait for menu selection and transition to next node
    ret
`;
          break;

        case 'Text':
          code += `
${nodeLabel}:
    ; Text Node - "${node.title || 'Text'}"
    call init_font_system
    call ${toRoutineLabel('show_text_' + node.id)}
    ; Wait for user input, then transition to next node
    ret
`;
          break;

        case 'Transition':
          code += `
${nodeLabel}:
    ; Transition Node - Effect: ${node.effect || 'default'}
    call ${toRoutineLabel('transition_effect_' + node.id)}
    ret
`;
          break;

        case 'Group':
          code += `
${nodeLabel}:
    ; Group Node - Nested GameFlow
    ; Load GameFlow: ${node.gameFlowAssetId || 'Unknown'}
    call ${toRoutineLabel('init_gameflow_' + (node.gameFlowAssetId || 'default'))}
    ret
`;
          break;

        case 'End':
          code += `
${nodeLabel}:
    ; End Node - ${node.endType || 'Game Over'}
    call show_end_screen
    ; Halt or return to main menu
    ret
`;
          break;

        case 'Restart':
          code += `
${nodeLabel}:
    ; Restart Node
    jp init_rom  ; Restart entire game
`;
          break;

        case 'Waypoint':
          // Waypoint is just a routing node
          const waypointConnection = gameFlow.connections?.find(
            (c: any) => c.from?.nodeId === node.id || c.from === node.id
          );

          if (waypointConnection) {
            const nextNodeId = waypointConnection.to?.nodeId || waypointConnection.to;
            const nextNodeLabel = `gameflow_node_${nextNodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            code += `
${nodeLabel}:
    ; Waypoint - route to next node
    ld hl, ${nextNodeLabel}
    jp execute_gameflow_node
`;
          }
          break;

        default:
          code += `
${nodeLabel}:
    ; ${node.type} Node (not yet implemented)
    ; Node ID: ${node.id}
    ret
`;
      }
    });
  }

  code += `
; End of GameFlow State Machine
`;

  return code;
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
include "bios.asm"

; 2. Constants (depends on BIOS)
include "constants.asm"

; 3. Variables (depends on constants)
include "variables.asm"

; 4. ROM Header (depends on variables)
include "header.asm"

${analysis.tiles && analysis.tiles.length > 0 ? `; 5. Pattern Data (if tiles exist)
include "patterns.asm"

; 6. Color Data (if tiles exist)
include "colors.asm"
` : ''}

${analysis.sprites && analysis.sprites.length > 0 ? `; 7. Sprite Data (if sprites exist)
include "sprites.asm"
` : ''}

${analysis.screenMaps && analysis.screenMaps.length > 0 ? `; 8. Screen Maps (if screens exist)
include "screens.asm"
` : ''}

; 9. Font Data (custom font for Screen 2 text)
include "font.asm"

; 10. Components (game logic)
include "components.asm"

; 11. Entities (game objects)
include "entities.asm"

; 12. Menus (user interface)
include "menus.asm"

; ==================================================================
; MAIN PROGRAM ENTRY POINT
; ==================================================================
main_program:
    ; Initialize game systems
    call init_game_systems

    ; Initialize font system for Screen 2 text
    call init_font_system

    ; Initialize Game Flow system
    xor a
    ld (current_flow_state), a
    ld (prev_flow_state), a

    ; Load initial screen based on GameFlow (Critical for Paridad)
    call load_game_screen

    ; Main game loop
main_loop:
    halt                 ; Wait for V-Blank

    ; Update current game state
    call update_current_state

    ; Render current frame
    call render_frame

    ; Loop forever
    jp main_loop

; ==================================================================
; GAME SYSTEM FUNCTIONS (implemented in components.asm)
; ==================================================================
init_game_systems:
    ; Initialize all game systems
    ; This function is implemented in the unified assembly
    ; and calls component initialization functions
    call init_components
    call init_sprites
    ret

update_current_state:
    ; Update game logic based on current state
    ; This function is implemented in the unified assembly
    ; and updates all component systems
    call update_input_component
    call update_position_component
    call update_movement_component
    call update_collision_component
    call update_sprite_component
    ret

render_frame:
    ; Render current frame
    ; This function is implemented in the unified assembly
    ; Game rendering is handled by component systems
    ret

; ==================================================================
; GAMEFLOW SYSTEM FUNCTIONS (Critical for Paridad)
; ==================================================================

load_game_screen:
    ; Load game screen based on GameFlow execution path
    ; This follows the exact same flow as Play mode for PARIDAD
${analysis.gameFlow ? `
    ; GameFlow detected - follow node execution path
    ; Start node: ${analysis.gameFlow.startNodeId || 'unknown'}
    ; Nodes: ${analysis.gameFlow.nodes?.length || 0} total
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ?
    analysis.gameFlow.nodes.map((node, i) =>
        `    ; Node ${i}: ${node.id} (${node.type || 'unknown'}) ${(node as any).data?.worldMapId ? `-> World: ${(node as any).data.worldMapId}` : ''}`
    ).join('\n') : '    ; No nodes in GameFlow'}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start` :
`    ; No GameFlow detected - load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load first screen: ${analysis.screenMaps[0]?.name || 'default'}
    call ${toRoutineLabel('load_screen_' + (analysis.screenMaps[0]?.name?.replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'))}` : `    ; No screens detected - load default pattern`}`}
    ret

; ==================================================================
; GAMEFLOW EXECUTION FUNCTIONS (Critical for Paridad)
; ==================================================================

execute_gameflow_start:
${analysis.gameFlow ? `
    ; Execute the GameFlow start node exactly as Play mode does
    ; Start node ID: ${analysis.gameFlow.startNodeId || 'none'}
${analysis.gameFlow.startNodeId ? `
    ; Find and execute start node
    ld hl, gameflow_node_${analysis.gameFlow.startNodeId.replace(/[^a-zA-Z0-9]/g, '_')}
    call execute_gameflow_node` : `
    ; No start node defined - execute first available node
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ? `
    ld hl, gameflow_node_${analysis.gameFlow.nodes[0].id.replace(/[^a-zA-Z0-9]/g, '_')}
    call execute_gameflow_node` : `
    ; No nodes available - load default screen
    call load_default_screen`}`}` : `
    ; No GameFlow - fallback to screen loading
    call load_default_screen`}
    ret

execute_gameflow_node:
    ; Execute a single GameFlow node (matches Play mode execution)
    ; HL = pointer to node data structure

    ; Get node type and execute appropriate handler
    ld a, (hl)                    ; Load node type
    cp NODE_TYPE_START
    jp z, execute_start_node
    cp NODE_TYPE_WORLDLINK
    jp z, execute_world_link_node
    cp NODE_TYPE_SCREEN
    jp z, execute_screen_node
    cp NODE_TYPE_MENU
    jp z, execute_menu_node

    ; Unknown node type - skip
    ret

execute_start_node:
    ; Start node - typically just transitions to next node
    ; Find next connected node and execute it
    call find_next_gameflow_node
    jp execute_gameflow_node

execute_world_link_node:
    ; World link node - load the referenced world map
${analysis.gameFlow && analysis.gameFlow.nodes ? `
${analysis.gameFlow.nodes.filter(node => node.type === 'WorldLink' || (node as any).data?.worldMapId).map(node => `
    ; Node ${node.id}: Links to world ${(node as any).data?.worldMapId || 'unknown'}
    ; Load world map and execute its start screen
    call ${toRoutineLabel('load_world_' + ((node as any).data?.worldMapId || 'default').replace(/[^A-Z0-9]/g, '_'))}`).join('\n')}` : `
    ; No world link nodes detected`}
    ret

execute_screen_node:
    ; Screen node - load the specific screen
    ; Extract screen reference from node data
    call load_referenced_screen
    ret

execute_menu_node:
    ; Menu node - show menu interface
    call show_menu_interface
    ret

load_default_screen:
    ; Fallback: load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `
    call ${toRoutineLabel('load_screen_' + (analysis.screenMaps[0]?.name?.replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'))}` : `
    ; No screens available - show placeholder
    call show_no_content_message`}
    ret

find_next_gameflow_node:
    ; Find the next node in GameFlow connections
    ; Implementation depends on connection data structure
    ; For now, use first connection if available
    ret

load_referenced_screen:
    ; Load screen referenced by current node
    ; Implementation needs node data parsing
    call load_default_screen
    ret

show_menu_interface:
    ; Show menu defined in GameFlow node
    ; Implementation needs menu data parsing
    ret

show_no_content_message:
    ; Show message when no content is available
    ret

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES (Generated State Machine)
; ==================================================================

${analysis.gameFlow ? generateGameFlowStateMachine(analysis.gameFlow, analysis) : `
; No GameFlow detected - using default screen loading
`}

${analysis.gameFlow && analysis.gameFlow.nodes ?
analysis.gameFlow.nodes.map(node => `
; Node: ${node.id} (${node.type || 'unknown'})
gameflow_node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}:
    db NODE_TYPE_${(node.type || 'unknown').toUpperCase()}
    dw ${(node as any).data?.worldMapId ? `world_${(node as any).data.worldMapId.replace(/[^a-zA-Z0-9]/g, '_')}` : '0'}
    ; Additional node data would go here
`).join('\n') : `
; No GameFlow nodes detected`}

; ==================================================================
; END OF MAIN PROGRAM
; ==================================================================
    end                 ; End of assembly
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
tile_pattern_bank0:
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
    db ${bytesHex.join(', ')}
`;
}).join('')}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2                ; VRAM pattern table bank 0
    ld bc, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

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
tile_color_bank0:
${analysis.tiles.map((tile, index) => {
  // Generate actual color bytes using the same function as MSX Main Generator
  const colorBytes = generateTileColorBytes(tile);
  const bytesHex = colorBytes ?
    Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
    ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0']; // Default white/black if no color data

  return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)
    db ${bytesHex.join(', ')}
`;
}).join('')}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0
    ld de, CLRTBL2                ; VRAM color table bank 0
    ld bc, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`;
}

/**
 * Generate unified file (unitedFiles.asm) - optional
 */
function generateUnifiedFile(files: GeneratedASMFiles, projectName: string, analysis: ProjectAnalysis): string {
  // Check what features are needed
  const hasMenus = analysis.gameFlow?.nodes?.some(node => node.type === 'SubMenu');
  const hasText = analysis.screenMaps?.some(screen =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const needsFont = hasMenus || hasText;

  return `; ==================================================================
; ${projectName.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${analysis.tiles?.length || 0}
; Sprites: ${analysis.sprites?.length || 0}
; Screens: ${analysis.screenMaps?.length || 0}
; Entities: ${analysis.entities?.length || 0}
; Menus: ${hasMenus ? 'Yes' : 'No'}
; ==================================================================

${files['header.asm']}

${files['bios.asm']}

${files['constants.asm']}

${files['variables.asm']}

${analysis.tiles && analysis.tiles.length > 0 ? files['patterns.asm'] : '; [patterns.asm skipped - no tiles]\n'}

${analysis.tiles && analysis.tiles.length > 0 ? files['colors.asm'] : '; [colors.asm skipped - no tiles]\n'}

${analysis.sprites && analysis.sprites.length > 0 ? files['sprites.asm'] : '; [sprites.asm skipped - no sprites]\n'}

${analysis.screenMaps && analysis.screenMaps.length > 0 ? files['screens.asm'] : '; [screens.asm skipped - no screens]\n'}

${analysis.entities && analysis.entities.length > 0 ? files['components.asm'] : '; [components.asm skipped - no entities]\n'}

${analysis.entities && analysis.entities.length > 0 ? files['entities.asm'] : '; [entities.asm skipped - no entities]\n'}

${hasMenus ? files['menus.asm'] : '; [menus.asm skipped - no menus]\n'}

${needsFont ? files['font.asm'] : '; [font.asm skipped - no text/menus]\n'}

; ==================================================================
; MAIN PROGRAM (from main.asm - excluding includes)
; ==================================================================
main_program:
    ; Initialize game systems
    call init_game_systems

    ; Initialize Game Flow system
    xor a
    ld (current_flow_state), a
    ld (prev_flow_state), a

    ; Start with main menu
    ld a, FLOW_STATE_MAIN_MENU
    ld (current_flow_state), a

    ; Main game loop
main_loop:
    halt                 ; Wait for V-Blank
    call update_current_state
    call render_frame
    jp main_loop

; ==================================================================
; GAME SYSTEM FUNCTIONS (implemented)
; ==================================================================

init_game_systems:
${analysis.entities && analysis.entities.length > 0 ? `    ; Initialize component systems (entities detected)
    call init_components
` : `    ; No entities - skipping component system initialization
`}
${analysis.sprites && analysis.sprites.length > 0 ? `    ; Initialize sprite system and load patterns
    call init_sprites
    call load_sprite_patterns  ; Load sprite patterns to VRAM
` : `    ; No sprites detected
`}
${analysis.tiles && analysis.tiles.length > 0 ? `    ; Load pattern and color data (tiles detected)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
` : `    ; No tiles detected - skipping pattern/color loading
`}
${analysis.entities && analysis.entities.length > 0 ? `    ; Initialize game entities with real positions from JSON
    call init_entities
` : `    ; No entities to initialize
`}
    ; Initialize sound system
    call GICINI               ; Initialize PSG

    ; Clear screen (BIOS CLS handles timing)
    call fillscreen

${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load the first game screen
    call load_game_screen
` : `    ; No screens - skip screen loading
`}
${needsFont ? `    ; Initialize font system
    call init_font_system
` : `    ; No text/menus - skip font initialization
`}
    ret

update_current_state:
    ; Update game logic based on current flow state
    ; Store previous state for transition detection
    ld a, (current_flow_state)
    ld (prev_flow_state), a

${analysis.entities && analysis.entities.length > 0 ? `    ; Update input first (needed by entities)
    call update_input_component
` : `    ; No entities - skip input update
`}
    ; Branch to appropriate state handler
    ld a, (current_flow_state)
    cp FLOW_STATE_MAIN_MENU
    jp z, update_main_menu_state
    cp FLOW_STATE_GAME
    jp z, update_game_state
    cp FLOW_STATE_PAUSE
    jp z, update_pause_state
    cp FLOW_STATE_GAME_OVER
    jp z, update_game_over_state
    cp FLOW_STATE_CREDITS
    jp z, update_credits_state
    ret

update_main_menu_state:
    ; Handle main menu input and logic
    ; Check for joystick input to navigate menu
    ld a, (input_state)
    cp STICK_DOWN
    call z, menu_cursor_down
    cp STICK_UP
    call z, menu_cursor_up

    ; Check for selection (trigger or space)
    ld a, 0                     ; Trigger port 0
    call GTTRIG
    or a
    jp nz, menu_select_option

    ; Check for START key to begin game directly
    ld a, (input_state)
    cp STICK_CENTER
    ret nz
    ld a, 0
    call GTTRIG
    or a
    jp nz, start_game_from_menu
    ret

update_game_state:
    ; Main gameplay logic - update all component systems in correct order
${analysis.entities && analysis.entities.length > 0 ? `    call update_input_component     ; Read input
    call update_behavior_component  ; AI/Logic decisions
    call update_movement_component  ; Apply physics/movement
    call update_position_component  ; Update positions
    call update_collision_component ; Check collisions
    call update_sprite_component    ; Update sprite rendering

    ; Check for pause input (SELECT key or P)
    ld a, (input_state)
    cp STICK_CENTER                ; Center + trigger = pause
    ret nz
    ld a, 0
    call GTTRIG
    or a
    jp nz, pause_game

    ; Check for game over conditions
    call check_game_over_conditions` : `    ; No entities - minimal game state update
    ; Simple projects just display static sprite`}
    ret

update_pause_state:
    ; Handle pause state - minimal updates
    ; Check for unpause input (same as pause)
    ld a, (input_state)
    cp STICK_CENTER
    ret nz
    ld a, 0
    call GTTRIG
    or a
    jp nz, unpause_game
    ret

update_game_over_state:
    ; Handle game over state
    ; Auto-advance to menu after delay or on input
    ld a, (frame_counter)
    and #3F                         ; Check every 64 frames (~1 second)
    ret nz

    ; Check for any input to return to menu
    ld a, 0
    call GTTRIG
    or a
    jp nz, return_to_menu

    ; Auto-return after timeout
    ld hl, (frame_counter)
    ld de, 300                      ; ~5 seconds at 60fps
    or a
    sbc hl, de
    jp nc, return_to_menu
    ret

update_credits_state:
    ; Handle credits state - auto-advance
    ld a, (frame_counter)
    and #1F                         ; Check every 32 frames
    ret nz

    ; Auto-return to menu after credits
    ld hl, (frame_counter)
    ld de, 600                      ; ~10 seconds
    or a
    sbc hl, de
    jp nc, return_to_menu
    ret

; ==================================================================
; GAME FLOW TRANSITION FUNCTIONS (Critical for Parity)
; ==================================================================

start_game_from_menu:
    ; Transition: Main Menu → Game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Initialize game state
    call init_game_entities
    call reset_game_variables

    ; Clear screen and load game screen
    call CLS
    call load_game_screen
    ret

pause_game:
    ; Transition: Game → Pause
    ld a, FLOW_STATE_PAUSE
    ld (current_flow_state), a

    ; Save game state (already in RAM variables)
    ; Show pause overlay
    call show_pause_overlay
    ret

unpause_game:
    ; Transition: Pause → Game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Restore game display
    call clear_pause_overlay
    ret

game_over:
    ; Transition: Game → Game Over
    ld a, FLOW_STATE_GAME_OVER
    ld (current_flow_state), a

    ; Reset frame counter for timeout
    ld hl, 0
    ld (frame_counter), hl

    ; Show game over screen
    call show_game_over_screen
    ret

return_to_menu:
    ; Pure game - restart game instead of menu
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Reset all game state and restart
    call reset_all_game_state
    call init_game_entities
    call load_game_screen
    ret

; ==================================================================
; STATE HELPER FUNCTIONS
; ==================================================================

menu_cursor_down:
    ; Move menu cursor down (cycle through options)
    ret

menu_cursor_up:
    ; Move menu cursor up (cycle through options)
    ret

menu_select_option:
    ; Select current menu option
    jp start_game_from_menu

check_game_over_conditions:
    ; Check if player is dead, enemies cleared, etc.
    ; Implementation depends on specific game logic
    ret

init_game_entities:
    ; Initialize all game entities for new game
${analysis.entities && analysis.entities.length > 0 ? `    call init_entities
` : `    ; No entities to initialize
`}${analysis.sprites && analysis.sprites.length > 0 ? `    call init_sprites
` : `    ; No sprites system (using direct display)
`}    ret

reset_game_variables:
    ; Reset score, health, etc.
    xor a
    ld (player_health), a
    ld hl, 0
    ld (player_score), hl
    ret

reset_all_game_state:
    ; Complete reset for return to menu
    call clear_all_sprites
    call reset_game_variables
    ret

load_game_screen:
    ; Load game screen based on GameFlow execution path
    ; This follows the exact same flow as Play mode for PARIDAD
${analysis.gameFlow ? `
    ; GameFlow detected - follow node execution path
    ; Start node: ${analysis.gameFlow.startNodeId || 'unknown'}
    ; Nodes: ${analysis.gameFlow.nodes?.length || 0} total
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ?
    analysis.gameFlow.nodes.map((node, i) =>
        `    ; Node ${i}: ${node.id} (${node.type || 'unknown'}) ${(node as any).data?.worldMapId ? `-> World: ${(node as any).data.worldMapId}` : ''}`
    ).join('\n') : '    ; No nodes in GameFlow'}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start` :
`    ; No GameFlow detected - load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load first screen: ${analysis.screenMaps[0]?.name || 'default'}
    call ${toRoutineLabel('load_screen_' + (analysis.screenMaps[0]?.name?.replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'))}` : `    ; No screens detected - load default pattern`}`}
    ret

; ==================================================================
; GAMEFLOW EXECUTION FUNCTIONS (Critical for Paridad)
; ==================================================================

execute_gameflow_start:
${analysis.gameFlow ? `
    ; Execute the GameFlow start node exactly as Play mode does
    ; Start node ID: ${analysis.gameFlow.startNodeId || 'none'}
${analysis.gameFlow.startNodeId ? `
    ; Find and execute start node
    ld hl, gameflow_node_${analysis.gameFlow.startNodeId.replace(/[^a-zA-Z0-9]/g, '_')}
    call execute_gameflow_node` : `
    ; No start node defined - execute first available node
${analysis.gameFlow.nodes && analysis.gameFlow.nodes.length > 0 ? `
    ld hl, gameflow_node_${analysis.gameFlow.nodes[0].id.replace(/[^a-zA-Z0-9]/g, '_')}
    call execute_gameflow_node` : `
    ; No nodes available - load default screen
    call load_default_screen`}`}` : `
    ; No GameFlow - fallback to screen loading
    call load_default_screen`}
    ret

execute_gameflow_node:
    ; Execute a single GameFlow node (matches Play mode execution)
    ; HL = pointer to node data structure

    ; Get node type and execute appropriate handler
    ld a, (hl)                    ; Load node type
    cp NODE_TYPE_START
    jp z, execute_start_node
    cp NODE_TYPE_WORLDLINK
    jp z, execute_world_link_node
    cp NODE_TYPE_SCREEN
    jp z, execute_screen_node
    cp NODE_TYPE_MENU
    jp z, execute_menu_node

    ; Unknown node type - skip
    ret

execute_start_node:
    ; Start node - typically just transitions to next node
    ; Find next connected node and execute it
    call find_next_gameflow_node
    jp execute_gameflow_node

execute_world_link_node:
    ; World link node - load the referenced world map
${analysis.gameFlow && analysis.gameFlow.nodes ? `
${analysis.gameFlow.nodes.filter(node => node.type === 'WorldLink' || (node as any).data?.worldMapId).map(node => `
    ; Node ${node.id}: Links to world ${(node as any).data?.worldMapId || 'unknown'}
    ; Load world map and execute its start screen
    call ${toRoutineLabel('load_world_' + ((node as any).data?.worldMapId || 'default').replace(/[^A-Z0-9]/g, '_'))}`).join('\n')}` : `
    ; No world link nodes detected`}
    ret

execute_screen_node:
    ; Screen node - load the specific screen
    ; Extract screen reference from node data
    call load_referenced_screen
    ret

execute_menu_node:
    ; Menu node - show menu interface
    call show_menu_interface
    ret

load_default_screen:
    ; Fallback: load first available screen
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `
    call ${toRoutineLabel('load_screen_' + (analysis.screenMaps[0]?.name?.replace(/[^A-Z0-9]/g, '_') || 'DEFAULT'))}` : `
    ; No screens available - show placeholder
    call show_no_content_message`}
    ret

find_next_gameflow_node:
    ; Find the next node in GameFlow connections
    ; Implementation depends on connection data structure
    ; For now, use first connection if available
    ret

load_referenced_screen:
    ; Load screen referenced by current node
    ; Implementation needs node data parsing
    call load_default_screen
    ret

show_menu_interface:
    ; Show menu defined in GameFlow node
    ; Implementation needs menu data parsing
    ret

show_no_content_message:
    ; Show message when no content is available
    ret

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES (Generated State Machine)
; ==================================================================

${analysis.gameFlow ? generateGameFlowStateMachine(analysis.gameFlow, analysis) : `
; No GameFlow detected - using default screen loading
`}

${analysis.gameFlow && analysis.gameFlow.nodes ?
analysis.gameFlow.nodes.map(node => `
; Node: ${node.id} (${node.type || 'unknown'})
gameflow_node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}:
    db NODE_TYPE_${(node.type || 'unknown').toUpperCase()}
    dw ${(node as any).data?.worldMapId ? `world_${(node as any).data.worldMapId.replace(/[^a-zA-Z0-9]/g, '_')}` : '0'}
    ; Additional node data would go here
`).join('\n') : `
; No GameFlow nodes detected`}

show_pause_overlay:
    ; Pure game - no pause overlay needed
    ret

clear_pause_overlay:
    ; Clear pause overlay by redrawing that area
    ; Simple implementation: reload game screen
    call load_game_screen
    ret

show_game_over_screen:
    ; Pure game - no game over screen needed
    ; Just restart the game automatically
    ret

render_frame:
    ; Render current frame based on flow state
    ; Optimized rendering with V-Blank synchronization

    ; Increment frame counter for timing
    ld hl, (frame_counter)
    inc hl
    ld (frame_counter), hl

    ; Check current flow state and render appropriately
    ld a, (current_flow_state)
    cp FLOW_STATE_MAIN_MENU
    jp z, render_main_menu
    cp FLOW_STATE_GAME
    jp z, render_game
    cp FLOW_STATE_PAUSE
    jp z, render_pause
    cp FLOW_STATE_GAME_OVER
    jp z, render_game_over
    cp FLOW_STATE_CREDITS
    jp z, render_credits

    ; Default: unknown state - just continue
    ret

render_main_menu:
    ; Pure game - no menu, go directly to game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call init_game_entities
    call load_game_screen
    ret

render_game:
    ; Render game frame with optimized sprite updates
    ; Only update sprites that have moved (optimization)

    ; Update sprite positions in VRAM only when needed
    ; This is much more efficient than reloading entire screen
    call update_sprites_to_vram

    ; Pure game rendering - no UI text needed
    ; Game state is entirely visual through sprites and background
    ret

render_pause:
    ; Pure game - no pause text needed
    ; Game is paused but visually identical
    ret

render_game_over:
    ; Pure game - return to game after brief pause
    ; No text needed - just restart game
    call return_to_menu
    ret

render_credits:
    ; Pure game - no credits needed
    call return_to_menu
    ret

; Pure game - no text strings needed for ${projectName.toUpperCase()}
; All communication is through visual gameplay elements

    end                 ; End of assembly
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
clear_all_sprites:
    ld hl, sprite_y_pos
    ld de, sprite_y_pos+1
    ld bc, ${Math.max(0, (analysis.sprites?.length || 1) - 1)}                     ; ${analysis.sprites?.length || 1} sprites - 1
    ld (hl), SPRITE_INVISIBLE     ; Y=209 (invisible)
    ldir
    ret

; Hide specific sprite (A = sprite number)
hide_sprite:
    ld hl, sprite_y_pos
    ld e, a
    ld d, 0
    add hl, de                    ; HL points to sprite Y position
    ld (hl), SPRITE_INVISIBLE     ; Make invisible
    ret

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

init_sprites:
    ; Initialize sprite system
    call clear_all_sprites

    ; Load sprite patterns to VRAM
    call load_sprite_patterns

    ; Initialize sprite positions (all invisible by default)
    xor a
    ld (active_sprite_count), a

    ret

load_sprite_patterns:
    ; Load all sprite patterns to VRAM sprite pattern table
`;

  // Generate pattern loading for each sprite
  analysis.sprites.forEach((sprite, index) => {
    code += `
    ; Load sprite ${index}: ${sprite.name} (BIOS LDIRVM handles timing)
    ld hl, SPRITE_${index}_PATTERN
    ld de, SPRPAT + (${index} * 32) ; Each 16x16 sprite = 32 bytes (4 patterns)
    ld bc, 32                       ; 16x16 sprite size
    call LDIRVM                     ; BIOS handles safe VRAM access
`;
  });

  code += `    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; Show sprite (A = sprite number, B = X, C = Y, D = pattern, E = color)
show_sprite:
    push bc                       ; Preserve parameters
    push de

    ; Calculate sprite offset (A = sprite number)
    ld l, a                       ; L = sprite number
    ld h, 0                       ; HL = sprite number

    ; Set X position
    push hl
    ld de, sprite_x_pos
    add hl, de                    ; HL points to sprite X position
    ld (hl), b                    ; Set X position
    pop hl

    ; Set Y position
    push hl
    ld de, sprite_y_pos
    add hl, de                    ; HL points to sprite Y position
    ld (hl), c                    ; Set Y position
    pop hl

    ; Set pattern
    push hl
    ld de, sprite_pattern
    add hl, de                    ; HL points to sprite pattern
    pop de                        ; Restore original HL to DE
    push de                       ; Save it again
    ld (hl), d                    ; Set pattern number
    pop hl

    ; Set color
    ld de, sprite_color
    add hl, de                    ; HL points to sprite color
    pop de                        ; Get original DE back
    ld (hl), e                    ; Set color

    pop bc                        ; Restore original parameters
    ret

; Clear all sprites (make them invisible)
clear_all_sprites:
    ld hl, sprite_y_pos
    ld de, sprite_y_pos+1
    ld bc, ${Math.max(0, (analysis.sprites?.length || 1) - 1)}                     ; ${analysis.sprites?.length || 1} sprites - 1
    ld (hl), SPRITE_INVISIBLE     ; Y=209 (invisible)
    ldir
    ret

; Hide specific sprite (A = sprite number)
hide_sprite:
    ld hl, sprite_y_pos
    ld e, a
    ld d, 0
    add hl, de                    ; HL points to sprite Y position
    ld (hl), SPRITE_INVISIBLE     ; Make invisible
    ret

; Update sprite positions to VRAM
update_sprites_to_vram:
    ; Copy sprite attributes from RAM to VRAM
    ; BIOS LDIRVM handles timing automatically
    ld hl, sprite_y_pos
    ld de, SPRATR
    ld bc, ${(analysis.sprites?.length || 1) * 4}                    ; ${analysis.sprites?.length || 1} sprites * 4 bytes each
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

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
  // Skip ECS system if no entities in project
  if (!analysis.entities || analysis.entities.length === 0) {
    return `; ==================================================================
; GAME COMPONENT SYSTEMS (SKIPPED - NO ENTITIES DETECTED)
; File: components.asm
; ==================================================================

; No entities detected in project - ECS system not needed
; This saves ~650 lines of unused component management code

; Minimal stub functions for compatibility
init_components:
    ret

update_input_component:
    ret

update_position_component:
    ret

update_movement_component:
    ret

update_collision_component:
    ret

update_sprite_component:
    ret

; ==================================================================
; END OF COMPONENTS (MINIMAL VERSION)
; ==================================================================
`;
  }

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

init_components:
    ; Initialize all component systems (based on Mideas initialization)

    ; Clear all component masks
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize position system
    call init_position_system

    ; Initialize sprite system
    call init_sprite_system

    ; Initialize movement system
    call init_movement_system

    ; Initialize collision system
    call init_collision_system

    ; Initialize input system
    call init_input_system

    ; Initialize behavior system
    call init_behavior_system

    ret

; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

init_position_system:
    ; Initialize position component system
    ; Clear all entity positions
    ld hl, entity_x_pos
    ld de, entity_x_pos+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_y_pos
    ld de, entity_y_pos+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_position_component:
    ; Update positions based on velocities (Movement → Position)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, (hl)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

    ; TODO: Add velocity to position logic here
    ; entity_x_pos[entity] += entity_vel_x[entity]
    ; entity_y_pos[entity] += entity_vel_y[entity]

position_next_entity:
    inc hl                     ; Next entity
    djnz position_update_loop
    ret

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call clear_all_sprites
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index counter

sprite_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_SPRITE       ; Check if has sprite component
    jr z, sprite_next_entity   ; Skip if no sprite component

    ; Render sprite at entity position
    push bc
    push hl

    ; Get entity position
    ld hl, entity_x_pos
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Show sprite (A=sprite#, B=X, C=Y, D=pattern, E=color)
    ld a, e                    ; Sprite number = entity index
    ld d, 0                    ; Pattern 0 (TODO: get from entity data)
    ld e, 15                   ; Color white (TODO: get from entity data)
    call show_sprite

    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz sprite_update_loop

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret

; ==================================================================
; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
; ==================================================================

init_movement_system:
    ; Initialize movement/physics system
    ; Clear velocities
    ld a, 0
    ld (entity_vel_x), a
    ld (entity_vel_y), a
    ret

update_movement_component:
    ; Update movement/physics for entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

movement_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_MOVEMENT     ; Check if has movement component
    jr z, movement_next_entity ; Skip if no movement component

    ; Apply physics/movement logic here
    ; TODO: Apply gravity, friction, collision response, etc.

movement_next_entity:
    inc hl                     ; Next entity
    djnz movement_update_loop
    ret

; ==================================================================
; COLLISION COMPONENT SYSTEM (Based on ScreenEditor collision detection)
; ==================================================================

init_collision_system:
    ; Initialize collision detection system
    ret

update_collision_component:
    ; Check collisions between entities and environment
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

collision_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_COLLISION    ; Check if has collision component
    jr z, collision_next_entity ; Skip if no collision component

    ; Perform collision detection for this entity
    push bc
    push hl

    ; Get entity position
    ld hl, entity_x_pos
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity X
    ld a, (hl)                 ; A = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld b, (hl)                 ; B = Y position

    ; Check screen boundaries (256x192 with 16x16 sprites)
    ; Left boundary
    cp 0
    jr z, collision_boundary_hit

    ; Right boundary (256 - 16 = 240)
    cp 240
    jr nc, collision_boundary_hit

    ; Top boundary
    ld a, b
    cp 0
    jr z, collision_boundary_hit

    ; Bottom boundary (192 - 16 = 176)
    cp 176
    jr nc, collision_boundary_hit

    ; Check tile collision (if screen maps exist)
    call check_tile_collision

    ; Check entity-to-entity collision
    call check_entity_collision

    jr collision_check_complete

collision_boundary_hit:
    ; Handle boundary collision
    call handle_boundary_collision

collision_check_complete:
    pop hl
    pop bc

collision_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz collision_update_loop
    ret

; ==================================================================
; COLLISION HELPER FUNCTIONS (Critical for Gameplay Parity)
; ==================================================================

check_tile_collision:
    ; Check collision with background tiles
    ; A = X position, B = Y position
    ; Convert pixel position to tile coordinates
    push af
    push bc

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
${Array.from({length: Math.log2(analysis.tiles[0].width)}, (_, i) => `    srl a                      ; A = X / ${Math.pow(2, i+1)}`).join('\n')}
` : `
    ; Default 16px tiles (4 shifts)
    srl a                      ; A = X / 2
    srl a                      ; A = X / 4
    srl a                      ; A = X / 8
    srl a                      ; A = X / 16
`}    ld c, a                    ; C = tile column

${analysis.tiles && analysis.tiles.length > 0 && analysis.tiles[0].height >= 8 && Number.isInteger(Math.log2(analysis.tiles[0].height)) ? `
    ; Convert Y to tile row (divide by ${analysis.tiles[0].height})
    ld a, b
${Array.from({length: Math.log2(analysis.tiles[0].height)}, (_, i) => `    srl a                      ; A = Y / ${Math.pow(2, i+1)}`).join('\n')}
` : `
    ; Default 16px tiles (4 shifts)
    ld a, b
    srl a                      ; A = Y / 2
    srl a                      ; A = Y / 4
    srl a                      ; A = Y / 8
    srl a                      ; A = Y / 16
`}    ld b, a                    ; B = tile row

    ; Check if position is within valid tile map
    ld a, c
    cp ${analysis.tiles && analysis.tiles.length > 0 ? Math.floor(256 / analysis.tiles[0].width) : 16}                      ; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${analysis.tiles && analysis.tiles.length > 0 ? Math.floor(192 / analysis.tiles[0].height) : 12}                      ; Screen height in tiles
    jr nc, no_tile_collision

    ; Get tile at position (simplified - would read from behavior map)
    ; For now, assume all non-zero tiles are solid
    ; This would read from the behavior map generated from screen data
    call get_behavior_tile     ; Returns A = behavior value
    or a
    jr z, no_tile_collision    ; 0 = passable

    ; Collision detected - handle it
    call handle_tile_collision

no_tile_collision:
    pop bc
    pop af
    ret

check_entity_collision:
    ; Check collision with other entities
    ; A = current entity X, B = current entity Y, C = current entity index
    push bc
    push af

    ; Loop through all other entities
    ld hl, entity_comp_masks
    ld e, 0                    ; Other entity index

entity_collision_loop:
    ld a, e
    cp c                       ; Skip self
    jr z, next_entity_collision

    ; Check if other entity has collision component
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, next_entity_collision

    ; Get other entity position
    push hl
    push de

    ld hl, entity_x_pos
    ld d, 0
    add hl, de                 ; HL points to other entity X
    ld d, (hl)                 ; D = other X

    ld hl, entity_y_pos
    add hl, de                 ; HL points to other entity Y
    ld e, (hl)                 ; E = other Y

    ; Check if entities overlap (16x16 sprites)
    ; Current entity: A = X, B = Y
    ; Other entity: D = X, E = Y

    ; X overlap check: |X1 - X2| < 16
    ld h, a                    ; H = current X
    ld a, d                    ; A = other X
    sub h                      ; A = other X - current X
    jr nc, x_diff_positive     ; Jump if positive
    neg                        ; Make positive
x_diff_positive:
    cp 16                      ; Check if < 16
    jr nc, no_entity_collision ; No X overlap

    ; Y overlap check: |Y1 - Y2| < 16
    ld a, e                    ; A = other Y
    sub b                      ; A = other Y - current Y
    jr nc, y_diff_positive     ; Jump if positive
    neg                        ; Make positive
y_diff_positive:
    cp 16                      ; Check if < 16
    jr nc, no_entity_collision ; No Y overlap

    ; Collision detected!
    call handle_entity_collision

no_entity_collision:
    pop de
    pop hl

next_entity_collision:
    inc hl                     ; Next entity mask
    inc e                      ; Next entity index
    ld a, e
    cp 32                      ; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; Stop movement in the collision direction
    ld a, 0
    ld (entity_vel_x), a       ; Stop X movement
    ld (entity_vel_y), a       ; Stop Y movement
    ret

handle_tile_collision:
    ; Handle collision with solid tiles
    ; Prevent movement into the tile
    ld a, 0
    ld (entity_vel_x), a       ; Stop X movement
    ld (entity_vel_y), a       ; Stop Y movement
    ret

handle_entity_collision:
    ; Handle collision between entities
    ; Implementation depends on game logic (damage, bouncing, etc.)
    ret

get_behavior_tile:
    ; Get behavior value for tile at (B, C)
    ; Returns A = behavior value (0=passable, 1=solid, etc.)
    ; This would read from the behavior map data
    ; For now, return 0 (all passable)
    ld a, 0
    ret

; ==================================================================
; INPUT COMPONENT SYSTEM (Based on input handling)
; ==================================================================

init_input_system:
    ; Initialize input handling system
    xor a
    ld (input_state), a
    ld (prev_input_state), a
    ret

update_input_component:
    ; Update input handling for player entities
    ; Store previous input state for edge detection
    ld a, (input_state)
    ld (prev_input_state), a

    ; Read current joystick state
    ld a, 0                    ; Joystick port 0
    call GTSTCK                ; Get joystick status (BIOS call)
    ld (input_state), a        ; Store current input state

    ; Process input for entities with input component
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

input_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_INPUT        ; Check if has input component
    jr z, input_next_entity    ; Skip if no input component

    ; Apply input to entity movement (real implementation)
    push bc
    push hl

    ; Convert joystick input to velocity
    ld a, (input_state)
    ld b, 0                    ; Default X velocity
    ld c, 0                    ; Default Y velocity

    ; Check directional input
    cp STICK_UP
    jr z, input_move_up
    cp STICK_DOWN
    jr z, input_move_down
    cp STICK_LEFT
    jr z, input_move_left
    cp STICK_RIGHT
    jr z, input_move_right
    cp STICK_UPRIGHT
    jr z, input_move_upright
    cp STICK_UPLEFT
    jr z, input_move_upleft
    cp STICK_DOWNRIGHT
    jr z, input_move_downright
    cp STICK_DOWNLEFT
    jr z, input_move_downleft
    jr input_apply_velocity

input_move_up:
    ld c, -2                   ; Negative Y velocity (up)
    jr input_apply_velocity

input_move_down:
    ld c, 2                    ; Positive Y velocity (down)
    jr input_apply_velocity

input_move_left:
    ld b, -2                   ; Negative X velocity (left)
    jr input_apply_velocity

input_move_right:
    ld b, 2                    ; Positive X velocity (right)
    jr input_apply_velocity

input_move_upright:
    ld b, 1                    ; Diagonal movement (slower)
    ld c, -1
    jr input_apply_velocity

input_move_upleft:
    ld b, -1
    ld c, -1
    jr input_apply_velocity

input_move_downright:
    ld b, 1
    ld c, 1
    jr input_apply_velocity

input_move_downleft:
    ld b, -1
    ld c, 1

input_apply_velocity:
    ; Apply calculated velocity to entity
    ; Store X velocity (entity_vel_x is temp storage for now)
    ld a, b
    ld (entity_vel_x), a       ; Store calculated X velocity

    ; Store Y velocity
    ld a, c
    ld (entity_vel_y), a       ; Store calculated Y velocity

    pop hl
    pop bc

input_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz input_update_loop
    ret

; ==================================================================
; BEHAVIOR COMPONENT SYSTEM (Based on BehaviorEditor logic)
; ==================================================================

init_behavior_system:
    ; Initialize AI/behavior system
    ret

update_behavior_component:
    ; Update AI/behavior logic for entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

behavior_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_BEHAVIOR     ; Check if has behavior component
    jr z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior scripts/AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
    inc hl                     ; Next entity
    djnz behavior_update_loop
    ret

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS (Based on EntityTemplate system)
; ==================================================================

; Create entity with components (A = entity ID, B = component mask)
create_entity:
    ; Set component mask for entity
    ld hl, entity_comp_masks
    ld e, a                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity mask
    ld (hl), b                 ; Set component mask

    ; Initialize component data based on mask
    bit 0, b                   ; Check COMP_MASK_POSITION
    call nz, init_entity_position

    bit 1, b                   ; Check COMP_MASK_SPRITE
    call nz, init_entity_sprite

    ; TODO: Initialize other components based on mask bits

    ret

; Initialize position component for entity (A = entity ID)
init_entity_position:
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 100               ; Default X position

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 100               ; Default Y position
    ret

; Initialize sprite component for entity (A = entity ID)
init_entity_sprite:
    ; Set sprite as visible with default pattern
    ld hl, sprite_pattern
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Pattern 0

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color
    ret

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

init_entities:
    ; Initialize all game entities
`;

    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach((entity) => {
        const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `    call init_${entityName.toLowerCase()}
`;
      });
    } else {
      code += `    ; No entities to initialize
`;
    }

    code += `    ret

update_entities:
    ; Update all entities
`;

    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach((entity) => {
        const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `    call update_${entityName.toLowerCase()}
`;
      });
    } else {
      code += `    ; No entities to update
`;
    }

    code += `    ret

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

      code += `init_${entityName.toLowerCase()}:
    ; Initialize ${entity.name} at real position from JSON
    ; JSON position: (${realX}, ${realY}) tiles = (${pixelX}, ${pixelY}) pixels

    ; Set entity ID and component mask
    ld a, ${index}             ; Entity ID
    ld b, COMP_MASK_POSITION + COMP_MASK_SPRITE + COMP_MASK_MOVEMENT + COMP_MASK_COLLISION + COMP_MASK_INPUT
    call create_entity         ; Create with all components

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${index}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${pixelX}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${pixelY}         ; Set real Y position from JSON

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${index}          ; Use entity index as sprite pattern

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ; Make sprite visible immediately
    ld a, ${index}             ; Sprite number
    ld b, ${pixelX}            ; X position
    ld c, ${pixelY}            ; Y position
    ld d, ${index}             ; Pattern
    ld e, 15                   ; Color
    call show_sprite
    ret

update_${entityName.toLowerCase()}:
    ; Update ${entity.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${index}
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

`;
    });
  } else {
    code += `; ==================================================================
; DEFAULT ENTITY SYSTEM
; ==================================================================

; Basic entity structure
ENTITY_PLAYER_ID EQU 0
ENTITY_ENEMY_ID  EQU 1

init_entities:
    ; Initialize default entities
    call init_player
    ret

update_entities:
    ; Update all entities
    call update_player
    ret

init_player:
    ; Initialize player entity
${analysis.sprites && analysis.sprites.length > 0 ? `
    ; TEST: Show first sprite in center of screen
    ; Sprite 0, X=128, Y=96 (center), Pattern=0, Color=15 (white)
    ld a, 0           ; Sprite number 0
    ld b, 128         ; X position (center)
    ld c, 96          ; Y position (center)
    ld d, 0           ; Pattern 0 (first sprite)
    ld e, 15          ; Color 15 (white)
    call show_sprite
` : ''}
    ret

update_player:
    ; Update player logic
    ret

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
  // Skip screen system if no screens in project
  if (!analysis.screenMaps || analysis.screenMaps.length === 0) {
    return `; ==================================================================
; SCREEN MAPS (SKIPPED - NO SCREENS DETECTED)
; File: screens.asm
; ==================================================================

; No screens detected in project - screen system not needed
; This saves ~160 lines of unused screen data

; Minimal stub functions for compatibility
load_game_screen:
    ret

load_screen_default:
    ret

; ==================================================================
; END OF SCREENS (MINIMAL VERSION)
; ==================================================================
`;
  }

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

load_screen:
    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`;

    analysis.screenMaps.forEach((screen, index) => {
      const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `load_screen_${screenName.toLowerCase()}:
    ; Load ${screen.name} screen (BIOS LDIRVM handles timing)
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${screenName}_${index}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

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

load_screen:
    ; Load screen (A = screen ID)
    cp SCREEN_GAME_ID
    jp z, load_screen_game
    ret

load_screen_game:
    ; Load game screen (BIOS LDIRVM handles timing)
    ld hl, SCREEN_GAME_DATA
    ld de, NAMETBL
    ld bc, 768
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

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
  // Check if font is needed (menus or text in screens)
  const hasMenus = analysis.gameFlow?.nodes?.some(node => node.type === 'SubMenu');
  const hasText = analysis.screenMaps?.some(screen =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );

  // Skip font system if no text/menus in project
  if (!hasMenus && !hasText) {
    return `; ==================================================================
; MSX FONT DATA (SKIPPED - NO TEXT/MENUS DETECTED)
; File: font.asm
; ==================================================================

; No text or menus detected in project - font system not needed
; This saves ~250 lines of unused font data

; Minimal stub functions for compatibility
init_font_system:
    ret

load_custom_font:
    ret

print_string_screen2:
    ret

; ==================================================================
; END OF FONT (MINIMAL VERSION)
; ==================================================================
`;
  }

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

load_custom_font:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; This replaces the MSX BIOS font with our custom font for text display
    ; BIOS LDIRVM handles timing automatically

    ; Calculate target address in Pattern Generator Table
    ; Characters 32-127 (printable ASCII) start at pattern #20 (32 decimal)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + (32 * 8)     ; Start at character 32 (space)
    ld bc, FONT_CHAR_COUNT * 8    ; Load all custom characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_bank0:
    ; Load font to Pattern Generator Bank 0 (characters 0-255)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + (32 * 8)     ; Start at character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_bank1:
    ; Load font to Pattern Generator Bank 1 (same patterns)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + #800 + (32 * 8)  ; Bank 1 + character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_bank2:
    ; Load font to Pattern Generator Bank 2 (same patterns)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + #1000 + (32 * 8) ; Bank 2 + character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_all_font_banks:
    ; Load custom font to all three Pattern Generator banks
    ; Required for complete Screen 2 text coverage
    call load_font_bank0
    call load_font_bank1
    call load_font_bank2
    ret

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

load_font_colors:
    ; Load font color attributes to Color Attribute Table
    ; Based on generateFontColorBinaryData from FontEditor
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + (32 * 8)     ; Start at character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_colors_all_banks:
    ; Load font colors to all three Color Attribute banks
    ; Bank 0
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + (32 * 8)
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM

    ; Bank 1
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + #800 + (32 * 8)
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM

    ; Bank 2
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + #1000 + (32 * 8)
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM
    ret

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
print_string_screen2:
    push bc
    ld b, 0                        ; Character counter

print_string_loop:
    ld a, (hl)                     ; Get character
    or a                           ; Check for null terminator
    jr z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ld hl, de                      ; HL = VRAM address for WRTVRM
    call WRTVRM                    ; Write character to VRAM
    pop de                         ; Restore VRAM position
    pop hl                         ; Restore string pointer

    ; Move to next character
    inc hl                         ; Next character in string
    inc de                         ; Next position in VRAM
    inc b                          ; Count characters
    ld a, b
    cp 32                          ; Limit to screen width
    jr nz, print_string_loop       ; Continue if not at edge

print_string_end:
    pop bc
    ret

; Initialize font system for Screen 2 text rendering
init_font_system:
    ; Load custom font patterns and colors
    call load_all_font_banks       ; Load patterns to all banks
    call load_font_colors_all_banks ; Load colors to all banks
    ret

; ==================================================================
; END OF FONT DATA
; ==================================================================
`;
}

/**
 * Generate menus file with menu systems and user interface
 */
function generateMenusFile(analysis: ProjectAnalysis): string {
  // Check if there are specific menu definitions in the analysis
  const hasMenus = analysis.gameFlow && analysis.gameFlow.nodes &&
    analysis.gameFlow.nodes.some(node => node.type === 'SubMenu');

  // Skip menu system if no menus in project
  if (!hasMenus) {
    return `; ==================================================================
; GAME MENUS (SKIPPED - NO MENUS DETECTED)
; File: menus.asm
; ==================================================================

; No menus detected in project - menu system not needed
; This saves ~620 lines of unused menu management code

; Minimal stub functions for compatibility
init_menus:
    ret

show_main_menu:
    ret

update_menu_state:
    ret

; ==================================================================
; END OF MENUS (MINIMAL VERSION)
; ==================================================================
`;
  }

  let code = `; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

`;

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
      code += `show_menu_${menuName.toLowerCase()}:
    ; Display ${menu.title || menu.id} menu
    ; TODO: Implement menu display logic
    ret

handle_menu_${menuName.toLowerCase()}:
    ; Handle ${menu.title || menu.id} menu input
    ; TODO: Implement menu input handling
    ret

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

init_menus:
    ; Initialize menu system
    ld a, MENU_MAIN_ID
    ld (current_menu), a
    xor a
    ld (current_item), a
    ret

show_main_menu:
    ; Display main menu with custom font
    call cls

    ; Make sure custom font is loaded
    call init_font_system

    ; Print title using custom font
    ld hl, txt_title
    ld de, NAMETBL + (5 * 32) + 10  ; Row 5, column 10
    call print_string_screen2        ; Use custom font print function

    ; Print menu options using custom font
    ld hl, txt_start
    ld de, NAMETBL + (10 * 32) + 12
    call print_string_screen2

    ld hl, txt_exit
    ld de, NAMETBL + (12 * 32) + 12
    call print_string_screen2

    ret

handle_main_menu:
    ; Handle main menu input
    call GTSTCK     ; Get joystick input

    ; Check for up/down movement
    cp 1            ; Up
    jp z, menu_up
    cp 5            ; Down
    jp z, menu_down

    ; Check for selection (space or fire button)
    call GTTRIG
    or a
    jp nz, menu_select

    ret

menu_up:
    ld a, (current_item)
    or a
    jp z, menu_up_end  ; Already at top
    dec a
    ld (current_item), a
menu_up_end:
    ret

menu_down:
    ld a, (current_item)
    cp MENU_ITEM_EXIT
    jp z, menu_down_end  ; Already at bottom
    inc a
    ld (current_item), a
menu_down_end:
    ret

menu_select:
    ld a, (current_item)
    cp MENU_ITEM_START
    jp z, start_game
    cp MENU_ITEM_EXIT
    jp z, exit_game
    ret

start_game:
    ; Start the game
    ld a, MENU_GAME_ID
    ld (current_menu), a
    ret

exit_game:
    ; Exit to BASIC
    rst #00

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

print_string:
    ; Print null-terminated string
    ; HL = source string, DE = VRAM destination
print_loop:
    ld a, (hl)
    or a
    ret z           ; End of string

    ; WRTVRM expects: A = data, HL = VRAM address
    push hl         ; Save string pointer
    push de         ; Save VRAM address
    pop hl          ; HL = VRAM address (for WRTVRM)
    call WRTVRM     ; Write character to VRAM
    pop hl          ; Restore string pointer

    inc hl          ; Next character in string
    inc de          ; Next VRAM position
    jp print_loop

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
    'header.asm': generateHeaderFile(projectName, analysis),
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

/**
 * Generate MSX Modular ASM from Project Summary (NEW METHOD)
 * Uses clean summary data instead of full project assets
 */
export function generateModularASMFromSummary(
  summary: ProjectSummary,
  config: MSXModularConfig
): GeneratedASMFiles {
  console.log('🔧 Generating modular ASM files from summary...');
  console.log(`📊 Summary: ${summary.projectInfo.name}, Assets: ${summary.assets.sprites.length} sprites, ${summary.assets.screens.length} screens`);

  // Validate summary
  if (!summary.projectInfo?.name) {
    throw new Error('Summary must contain valid projectInfo.name');
  }

  if (!summary.assets) {
    throw new Error('Summary must contain assets section');
  }

  // Convert summary to analysis format (compatible with existing generators)
  let analysis: ProjectAnalysis;
  try {
    analysis = convertSummaryToAnalysis(summary);
    console.log(`🔍 Summary conversion complete: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles, ${analysis.screenMaps.length} screens`);
  } catch (error) {
    console.error('❌ Error converting summary to analysis:', error);
    throw error;
  }

  // Generate individual files using converted analysis
  const files: GeneratedASMFiles = {
    'bios.asm': generateBIOSFile(),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'header.asm': generateHeaderFile(summary.projectInfo.name, analysis),
    'patterns.asm': generatePatternsFile(analysis),
    'colors.asm': generateColorsFile(analysis),
    'components.asm': generateComponentsFile(analysis),
    'entities.asm': generateEntitiesFile(analysis),
    'screens.asm': generateScreensFile(analysis),
    'sprites.asm': generateSpritesFile(analysis),
    'font.asm': generateFontFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'main.asm': generateMainFile(summary.projectInfo.name, analysis)
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, summary.projectInfo.name, analysis);
  }

  console.log('✅ Summary-based ASM files generated successfully!');
  console.log(`📊 Generated ${Object.keys(files).length} files from summary`);
  console.log(`🎯 Project: ${summary.projectInfo.name} (${summary.metadata.extraction.compressionRatio})`);

  // Report validation status
  if (summary.metadata.validation.warnings.length > 0) {
    console.log(`⚠️  Summary warnings: ${summary.metadata.validation.warnings.length}`);
    summary.metadata.validation.warnings.forEach(warning => console.log(`     - ${warning}`));
  }

  return files;
}