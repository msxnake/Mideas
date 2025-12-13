/**
 * @fileoverview MSX Main.asm Generator
 * Generates main.asm file with proper includes and project structure
 */

import { ProjectAsset, ComponentDefinition, EntityTemplate, Sprite, Tile, ScreenMap, TileBank, DataFormat } from '../types';
import { analyzeProject, ProjectAnalysis } from './asmTemplateGenerator';
import * as ECSGen from './msxECSGenerators';
import { generateScreenMapLayoutBytes, generateScreenLayoutASMCode, generateBehaviorMapData, generateBehaviorMapASMCode } from '../components/utils/screenUtils';
import { generateTilePatternBytes, generateTileColorBytes } from '../components/utils/tileUtils';
import { generateSpriteASMCode } from '../components/utils/spriteUtils';
import { generateInterruptSystemASM } from './interruptSystemGenerator';

/**
 * MSX Project configuration
 */
export interface MSXProjectConfig {
  projectName: string;
  targetMSX: 'MSX1' | 'MSX2' | 'MSX2+';
  baseAddress: number;
  cartridgeType: 'ROM' | 'MEGAROM' | 'DISK';
  includeStateSystem: boolean;
  includeBIOS: boolean;
  generateBinaryFiles: boolean;
}

/**
 * Default MSX project configuration
 */
export const DEFAULT_MSX_CONFIG: MSXProjectConfig = {
  projectName: 'MSX_Game',
  targetMSX: 'MSX1',
  baseAddress: 0x8000,
  cartridgeType: 'ROM',
  includeStateSystem: true,
  includeBIOS: true,
  generateBinaryFiles: true
};

/**
 * Generate dynamic variable definitions based on project analysis
 */
function generateDynamicVariables(analysis: ProjectAnalysis): string {
  let code = `; ------------------------------------------------------------------
; PROJECT VARIABLES - DYNAMIC GENERATION BASED ON PROJECT ANALYSIS
; ------------------------------------------------------------------
`;

  let currentAddress = 0xC000;

  // Core variables (always needed)
  code += `
; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
input_state         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current joystick/keyboard state\n`;
  currentAddress++;

  code += `prev_input_state    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous input state\n`;
  currentAddress++;

  // Game Flow variables (always needed since it's required)
  code += `current_flow_state  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current game flow state\n`;
  currentAddress++;

  code += `prev_flow_state     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous game flow state\n`;
  currentAddress++;

  // Sprite system variables (only if sprites exist)
  if (analysis.sprites.length > 0) {
    code += `
; Sprite System Variables (${analysis.sprites.length} sprites detected)
active_sprite_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of sprites currently active\n`;
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
; Screen System Variables (${analysis.screenMaps.length} screens detected)
current_screen_id   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Currently displayed screen ID\n`;
    currentAddress++;

    code += `screen_dirty_flag   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Screen needs redraw flag\n`;
    currentAddress++;
  }

  // Player variables (detect if there's a player entity)
  const hasPlayer = analysis.sprites.some(s => s.name.toLowerCase().includes('player'));

  if (hasPlayer) {
    code += `
; Player System Variables (player entity detected)
player_x            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player X position (16-bit)\n`;
    currentAddress += 2;

    code += `player_y            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player Y position (16-bit)\n`;
    currentAddress += 2;

    code += `player_health       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player health points\n`;
    currentAddress++;

    code += `player_score        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player score (16-bit)\n`;
    currentAddress += 2;
  }

  // Frame counter (always useful)
  code += `
; Frame System Variables
frame_counter       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame counter (16-bit)\n`;
  currentAddress += 2;

  // Temporary variables (always needed)
  code += `
; Temporary Variables (always needed)
temp_word_1         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage\n`;
  currentAddress += 2;

  code += `temp_word_2         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage\n`;
  currentAddress += 2;

  code += `temp_byte_1         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage\n`;
  currentAddress++;

  code += `temp_byte_2         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage\n`;
  currentAddress++;

  // End marker
  code += `
; End of dynamic variables
RAM_USAGE_END       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; End of project variables (${currentAddress - 0xC000} bytes used)\n`;

  return code;
}

/**
 * Post-process ASM code to fix common issues
 */
function postProcessASM(code: string): string {
  console.log('🔧 Starting ASM post-processing - Second pass...');

  const lines = code.split('\n');
  const definedSymbols = new Set<string>();
  const usedSymbols = new Set<string>();
  const duplicates = new Set<string>();
  const processedLines: string[] = [];

  console.log('📋 Pass 1: Detecting duplicate symbols...');

  // Pass 1: Detect duplicates and collect defined symbols
  for (const line of lines) {
    const trimmed = line.trim();

    // Check for EQU definitions
    const equMatch = trimmed.match(/^(\w+)\s+EQU\s+/);
    if (equMatch) {
      const symbol = equMatch[1];
      if (definedSymbols.has(symbol)) {
        duplicates.add(symbol);
        console.log(`⚠️  Duplicate symbol detected: ${symbol}`);
        continue; // Skip duplicate definitions
      }
      definedSymbols.add(symbol);
    }

    // Check for used symbols (LD, CALL, JP, etc.)
    const usageMatches = trimmed.match(/\b([A-Z_][A-Z0-9_]*)\b/g);
    if (usageMatches) {
      for (const match of usageMatches) {
        if (!match.match(/^(LD|CALL|JP|JR|CP|OR|AND|XOR|ADD|SUB|INC|DEC|PUSH|POP|RET|HALT|NOP|EQU|DB|DW|DS|ORG|END)$/)) {
          usedSymbols.add(match);
        }
      }
    }

    processedLines.push(line);
  }

  console.log(`✅ Found ${definedSymbols.size} defined symbols, ${duplicates.size} duplicates removed`);

  // Pass 2: Check for undefined symbols and add missing ones
  console.log('📋 Pass 2: Checking for undefined symbols...');

  const missingSymbols = new Set<string>();
  for (const symbol of usedSymbols) {
    if (!definedSymbols.has(symbol)) {
      missingSymbols.add(symbol);
    }
  }

  console.log(`⚠️  Found ${missingSymbols.size} undefined symbols`);

  // Add missing symbols with default values
  const missingDefinitions: string[] = [];
  for (const symbol of missingSymbols) {
    console.log(`🔧 Adding missing symbol: ${symbol}`);

    // Add reasonable defaults based on symbol name
    if (symbol.includes('FLOW_STATE')) {
      const stateValue = Array.from(missingSymbols).filter(s => s.includes('FLOW_STATE')).indexOf(symbol);
      missingDefinitions.push(`${symbol.padEnd(20)} EQU ${stateValue}        ; Auto-generated game flow state`);
    } else if (symbol.includes('TILE_') && symbol.includes('_BANK')) {
      missingDefinitions.push(`${symbol.padEnd(20)} EQU TILE_PATTERN_BANK0   ; Auto-generated tile bank reference`);
    } else if (symbol.includes('_TBL') || symbol.includes('TBL')) {
      missingDefinitions.push(`${symbol.padEnd(20)} EQU #1800               ; Auto-generated VRAM table address`);
    } else if (symbol.includes('COLOR') && symbol.includes('BANK')) {
      missingDefinitions.push(`${symbol.padEnd(20)} EQU TILE_COLOR_BANK0    ; Auto-generated color bank reference`);
    } else {
      missingDefinitions.push(`${symbol.padEnd(20)} EQU 0                   ; Auto-generated symbol`);
    }
  }

  // Insert missing definitions after the constants section
  const finalLines: string[] = [];
  let constantsInserted = false;

  for (const line of processedLines) {
    finalLines.push(line);

    // Insert missing definitions after BIOS constants section
    if (!constantsInserted && line.trim().includes('Game Flow States')) {
      finalLines.push('');
      finalLines.push('; ==================================================================');
      finalLines.push('; AUTO-GENERATED SYMBOLS (Post-processing)');
      finalLines.push('; ==================================================================');
      finalLines.push(...missingDefinitions);
      finalLines.push('');
      constantsInserted = true;
    }
  }

  console.log('✅ ASM post-processing completed!');
  console.log(`📊 Summary: ${definedSymbols.size} symbols defined, ${duplicates.size} duplicates removed, ${missingSymbols.size} missing symbols added`);

  return finalLines.join('\n');
}

/**
 * Generate unitedFiles.asm - All-in-one Konami cartridge ROM file
 */
export function generateUnitedFilesASM(
  projectName: string,
  assets: ProjectAsset[],
  config: MSXProjectConfig = DEFAULT_MSX_CONFIG,
  projectData?: any // Full project data including tileBanks
): string {
  // PASO 1: VERIFICACIÓN DE ASSETS REQUERIDOS
  console.log('🔍 Checking assets for Game Flow...');
  console.log('Available asset types:', assets.map(a => a.type));

  const gameFlowAssets = assets.filter(a => a.type === 'gameflow');
  console.log('Game Flow assets found:', gameFlowAssets.length);

  if (gameFlowAssets.length === 0) {
    throw new Error(`❌ ERROR: No se puede crear ROM sin Game Flow.

Razón: El menú principal es obligatorio para el flujo del juego.

Para solucionarlo:
1. Crea un Game Flow en el editor
2. Agrega al menos un nodo de menú principal
3. Conecta el flujo del juego
4. Vuelve a exportar`);
  }

  // PASO 2: VERIFICACIÓN DE MÚLTIPLES GAME FLOW ASSETS
  if (gameFlowAssets.length > 1) {
    console.log('Multiple Game Flow assets found:', gameFlowAssets.map(a => a.name));

    // Buscar el Game Flow principal llamado "Start"
    const startGameFlow = gameFlowAssets.find(a => a.name === 'Start');

    if (!startGameFlow) {
      const gameFlowNames = gameFlowAssets.map(a => a.name).join(', ');
      throw new Error(`❌ ERROR: Múltiples Game Flow detectados pero ninguno se llama "Start".

Game Flow encontrados: ${gameFlowNames}

Para solucionarlo:
1. Renombra el Game Flow principal a "Start"
2. O elimina los Game Flow que no necesites
3. El Game Flow "Start" debe contener el menú principal

Nota: Solo se puede usar un Game Flow por ROM`);
    }

    console.log('✅ Found main Game Flow: "Start"');
  }

  const analysis = analyzeProject(projectName, assets);
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  let code = '';

  // Header
  code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  code += `;; ${projectName.toUpperCase()} - UNITED FILES ASM (ALL-IN-ONE)\n`;
  code += `;; Generated by MSX Retro Game IDE\n`;
  code += `;; Konami Cartridge ROM Format\n`;
  code += `;; Target: ${config.targetMSX}\n`;
  code += `;; Base Address: #4000 (Konami Standard)\n`;
  code += `;; Generated: ${new Date().toISOString()}\n`;
  code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n\n`;

  // STEP 1: Memory organization MUST BE FIRST
  code += `; Memory Organization\n`;
  code += `    ORG #4000                ; Konami cartridge standard address\n\n`;

  // STEP 2: Konami ROM Header (immediately after ORG)
  code += generateKonamiROMHeader(projectName, analysis);

  // STEP 3: System constants and addresses (before any code)
  code += generateInlineSystemConstants();

  // STEP 4: RAM Variable addresses (before code that uses them)
  code += generateInlineRAMVariables();

  // STEP 4.5: Interrupt system (NUEVO - Konami-style task system)
  code += generateInterruptSystemASM(analysis);

  // STEP 5: Main program entry point (before any subroutines)
  code += generateKonamiMainProgram(analysis, config);

  // STEP 6: Game Flow integration (after main program)
  code += generateGameFlowIntegration(assets, analysis);

  // STEP 7: All game systems and subroutines
  code += generateInlineGameSystems(analysis, assets);

  // STEP 8: Asset data at the END (pattern tables, graphics, etc.)
  code += generateInlineAssets(assets, analysis, config, projectData);

  // STEP 9: Final assembly END statement
  code += `; ==================================================================\n`;
  code += `; END OF PROGRAM - MSX KONAMI CARTRIDGE\n`;
  code += `; ==================================================================\n`;
  code += `; Memory Layout Summary:\n`;
  code += `;   #4000-#BFFF : ROM Code & Data (32KB)\n`;
  code += `;   #C000-#FFFF : RAM Variables & Buffers (16KB)\n`;
  code += `;   Variables are defined with EQU addresses, not stored in ROM\n`;
  code += `; ==================================================================\n\n`;

  code += `    END                 ; End of assembly\n\n`;

  return code;
}

/**
 * Generate main.asm file with proper includes
 */
export function generateMainASM(
  projectName: string,
  assets: ProjectAsset[],
  config: MSXProjectConfig = DEFAULT_MSX_CONFIG
): string {
  const analysis = analyzeProject(projectName, assets);
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  let code = '';
  
  // Header
  code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  code += `;; ${projectName.toUpperCase()} - MSX GAME MAIN FILE\n`;
  code += `;; Generated by MSX Retro Game IDE\n`;
  code += `;; Target: ${config.targetMSX}\n`;
  code += `;; Base Address: #${config.baseAddress.toString(16).toUpperCase()}\n`;
  code += `;; Generated: ${new Date().toISOString()}\n`;
  code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n\n`;
  
  // Memory organization
  code += `; Memory Organization\n`;
  code += `    ORG #${config.baseAddress.toString(16).toUpperCase()}\n\n`;
  
  // ROM Header (if cartridge)
  if (config.cartridgeType === 'ROM' || config.cartridgeType === 'MEGAROM') {
    code += generateROMHeader(projectName, config);
  }
  
  // Include system files
  code += `; ==================================================================\n`;
  code += `; SYSTEM INCLUDES\n`;
  code += `; ==================================================================\n`;
  code += `INCLUDE "system/constants.asm"     ; MSX system constants\n`;
  
  if (config.includeBIOS) {
    code += `INCLUDE "system/bios.asm"          ; BIOS function definitions\n`;
  }
  
  if (config.includeStateSystem) {
    code += `INCLUDE "system/state_machine.asm" ; Game state management\n`;
  }
  
  code += `INCLUDE "system/utils.asm"         ; Utility functions\n\n`;
  
  // Include asset files based on project content
  code += generateAssetIncludes(analysis);
  
  // Include game logic files
  code += generateGameLogicIncludes(analysis, sanitizedName);
  
  // Main program entry point
  code += generateMainProgram(analysis, config);
  
  // Asset data sections
  code += generateAssetDataSections(analysis);
  
  // Game initialization
  code += generateInitializationCode(analysis, config);
  
  // Main game loop
  code += generateMainLoop(analysis, config);
  
  // Footer
  code += `; ==================================================================\n`;
  code += `; END OF ${projectName.toUpperCase()}\n`;
  code += `; ==================================================================\n`;
  
  return code;
}

/**
 * Generate ROM header for cartridge games
 */
function generateROMHeader(projectName: string, config: MSXProjectConfig): string {
  return `; ==================================================================
; ROM HEADER
; ==================================================================
    DB "AB"              ; ROM signature
    DW INIT_GAME         ; Init address
    DW 0,0,0,0,0         ; Statement, Device, Text, Reserved

INIT_GAME:
    ; ROM cartridge initialization
    DI                   ; Disable interrupts during init
    
    ; Initialize stack
    LD SP, #F380
    
    ; Initialize project RAM variables area (SAFE - only project variables)
    ; Clear ONLY project variables zone, NOT system variables (#F380+)
    LD HL, input_state           ; #C000 - first project variable
    LD DE, input_state+1         ; #C001 - next byte
    LD BC, RAM_USAGE_END - input_state - 1       ; Only to #C100
    LD (HL), 0
    LDIR
    
    ; Jump to main program
    JP MAIN_PROGRAM

`;
}

/**
 * Generate asset include statements
 */
function generateAssetIncludes(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================\n`;
  code += `; ASSET INCLUDES\n`;
  code += `; ==================================================================\n`;
  
  if (analysis.tiles.length > 0) {
    code += `INCLUDE "assets/tiles.asm"         ; Tile pattern and color data\n`;
  }
  
  if (analysis.sprites.length > 0) {
    code += `INCLUDE "assets/sprites.asm"       ; Sprite pattern data\n`;
  }
  
  if (analysis.screenMaps.length > 0) {
    code += `INCLUDE "assets/screens.asm"       ; Screen map layouts\n`;
  }
  
  if (analysis.hasECS) {
    code += `INCLUDE "assets/entities.asm"      ; Entity and component data\n`;
  }
  
  code += `INCLUDE "assets/palettes.asm"      ; Color palette data\n\n`;
  
  return code;
}

/**
 * Generate game logic include statements
 */
function generateGameLogicIncludes(analysis: ProjectAnalysis, projectName: string): string {
  let code = `; ==================================================================\n`;
  code += `; HOOK SYSTEM INCLUDES\n`;
  code += `; ==================================================================\n`;
  
  // Core Hook system - MUST be included first
  code += `INCLUDE "hook/hook_core.asm"       ; Hook system dispatcher\n`;
  code += `INCLUDE "hook/hook_systems.asm"    ; Hook system implementations\n`;
  
  code += `; ==================================================================\n`;
  code += `; GAME LOGIC INCLUDES\n`;
  code += `; ==================================================================\n`;
  
  code += `INCLUDE "game/input.asm"           ; Input handling\n`;
  code += `INCLUDE "game/graphics.asm"        ; Graphics routines\n`;
  
  if (analysis.hasCollisions) {
    code += `INCLUDE "game/collision.asm"       ; Collision detection\n`;
  }
  
  if (analysis.hasSprites) {
    code += `INCLUDE "game/sprites.asm"         ; Sprite management\n`;
  }
  
  if (analysis.hasECS) {
    code += `INCLUDE "game/ecs.asm"             ; Entity Component System\n`;
  }
  
  if (analysis.hasMenuSystem) {
    code += `INCLUDE "game/menu.asm"            ; Menu system (Hook-compatible)\n`;
  }
  
  if (analysis.customStates.length > 0) {
    code += `INCLUDE "game/custom_states.asm"   ; Custom game states\n`;
  }
  
  code += `INCLUDE "game/${projectName}_logic.asm" ; Project-specific logic\n\n`;
  
  return code;
}

/**
 * Generate main program structure
 */
function generateMainProgram(analysis: ProjectAnalysis, config: MSXProjectConfig): string {
  return `; ==================================================================
; MAIN PROGRAM ENTRY POINT - HOOK SYSTEM ARCHITECTURE
; ==================================================================

MAIN_PROGRAM:
    di                          ; Disable interrupts
    
    ; Initialize stack
    ld sp, #F380
    
    ; Initialize project variables in RAM
    ; Clear writable RAM area #C000-#FFFF
    ld hl, #C000
    ld de, #C001
    ld bc, #3FFF
    ld (hl), 0
    ldir
    
    ; Initialize Hook system first
    call INIT_HOOK_SYSTEM
    
    ; System initialization through Hook calls
    call HOOK_INIT_MSX_HARDWARE
    call HOOK_INIT_MEMORY
    call HOOK_LOAD_ASSETS
    
    ; Start with initial system based on project
    ld a, ${analysis.hasMenuSystem ? 'HOOK_MENU_SYSTEM' : 'HOOK_GAME_SYSTEM'}
    call HOOK_ACTIVATE_SYSTEM
    
    ; Enable interrupts and start Hook main loop
    ei
    jp HOOK_MAIN_LOOP

`;
}

/**
 * Generate asset data sections references
 */
function generateAssetDataSections(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================\n`;
  code += `; ASSET DATA REFERENCES\n`;
  code += `; ==================================================================\n`;
  
  if (analysis.tiles.length > 0) {
    code += `; Tile data will be included from tiles.asm\n`;
    code += `; - TILE_PATTERNS: Pattern data for ${analysis.tiles.length} tiles\n`;
    code += `; - TILE_COLORS: Color attribute data\n`;
  }
  
  if (analysis.sprites.length > 0) {
    code += `; Sprite data will be included from sprites.asm\n`;
    code += `; - SPRITE_PATTERNS: Pattern data for ${analysis.sprites.length} sprites\n`;
    if (analysis.hasAnimations) {
      code += `; - SPRITE_ANIMATIONS: Animation frame data\n`;
    }
  }
  
  if (analysis.screenMaps.length > 0) {
    code += `; Screen map data will be included from screens.asm\n`;
    code += `; - SCREEN_LAYOUTS: Layout data for ${analysis.screenMaps.length} screens\n`;
  }
  
  code += `\n`;
  return code;
}

/**
 * Generate initialization code
 */
function generateInitializationCode(analysis: ProjectAnalysis, config: MSXProjectConfig): string {
  return `; ==================================================================
; INITIALIZATION ROUTINES
; ==================================================================

INIT_MSX_SYSTEM:
    ; Set screen mode based on target
    LD A, ${config.targetMSX === 'MSX1' ? '2' : '4'}
    CALL CHGMOD          ; Change to screen mode
    RET

INIT_GRAPHICS_MODE:
    ; Initialize graphics for game
    CALL CLS             ; Clear screen
    RET

INIT_INTERRUPTS:
    ; Setup interrupt handling
    DI
    ; Interrupt setup code here
    EI
    RET

INIT_INPUT_SYSTEM:
    ; Initialize input handling
    XOR A
    LD (input_state), A
    LD (prev_input_state), A
    RET

${analysis.hasCollisions ? `INIT_COLLISION_SYSTEM:
    ; Initialize collision detection system
    ; Setup collision maps and detection routines
    RET

` : ''}START_GAME:
    ; Game-specific startup sequence
${config.includeStateSystem ? '    LD A, STATE_MENU\n    CALL CHANGE_GAME_STATE\n' : '    CALL INIT_GAME_STATE\n'}    RET

`;
}

/**
 * Generate main game loop (if not using state machine)
 */
function generateMainLoop(analysis: ProjectAnalysis, config: MSXProjectConfig): string {
  return `; ==================================================================
; HOOK MAIN LOOP - Dynamic System Execution
; ==================================================================

HOOK_MAIN_LOOP:
    halt                        ; Wait for V-Blank interrupt
    
    ; Execute current active system through Hook dispatcher
    call HOOK_EXECUTE_CURRENT_SYSTEM
    
    ; Check for system transitions
    call HOOK_CHECK_SYSTEM_CHANGE
    
    ; Loop forever - Hook system handles everything
    jp HOOK_MAIN_LOOP

; ==================================================================
; HOOK SYSTEM CONSTANTS
; ==================================================================

; System IDs for Hook dispatcher
HOOK_MENU_SYSTEM     equ 0      ; Menu system
HOOK_GAME_SYSTEM     equ 1      ; Main game system
HOOK_PAUSE_SYSTEM    equ 2      ; Pause overlay system
HOOK_TRANSITION_SYS  equ 3      ; Screen transition system

; Hook system state
current_hook_system: db HOOK_MENU_SYSTEM

`;
}

/**
 * Generate asset loading stub functions
 */
export function generateAssetLoadingStubs(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================\n`;
  code += `; ASSET LOADING STUB FUNCTIONS\n`;
  code += `; These will be replaced with actual binary loading code\n`;
  code += `; ==================================================================\n\n`;
  
  code += `LOAD_PALETTES:\n`;
  code += `    ; Load color palettes from binary files\n`;
  code += `    RET\n\n`;
  
  if (analysis.tiles.length > 0) {
    code += `LOAD_TILES:\n`;
    code += `    ; Load tile patterns from bin/tiles/\n`;
    code += `    ; CALL LOAD_BINARY_FILE("tiles.bin", TILE_PATTERNS)\n`;
    code += `    RET\n\n`;
  }
  
  if (analysis.sprites.length > 0) {
    code += `LOAD_SPRITES:\n`;
    code += `    ; Load sprite patterns from bin/sprites/\n`;
    code += `    ; CALL LOAD_BINARY_FILE("sprites.bin", SPRITE_PATTERNS)\n`;
    code += `    RET\n\n`;
  }
  
  if (analysis.screenMaps.length > 0) {
    code += `LOAD_SCREEN_MAPS:\n`;
    code += `    ; Load screen layouts from bin/screens/\n`;
    code += `    ; CALL LOAD_BINARY_FILE("screens.bin", SCREEN_LAYOUTS)\n`;
    code += `    RET\n\n`;
  }
  
  return code;
}

/**
 * Generate professional ECS MSX project structure
 */
export function generateMSXProjectFiles(
  projectName: string,
  assets: ProjectAsset[],
  config: MSXProjectConfig = DEFAULT_MSX_CONFIG
): { [filename: string]: string } {
  const analysis = analyzeProject(projectName, assets);
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  const files: { [filename: string]: string } = {};
  
  // Source files
  files['src/main.asm'] = ECSGen.generateProfessionalMainASM(projectName, analysis, config);
  files['src/constants.asm'] = generateConstantsFile(config);
  files['src/macros.asm'] = ECSGen.generateMacrosFile(analysis);
  
  // HOOK SYSTEM FILES - Core dynamic system dispatcher
  files['src/hook/hook_core.asm'] = ECSGen.generateHookCore();
  files['src/hook/hook_systems.asm'] = ECSGen.generateHookSystems(analysis);
  
  // ECS System files (if ECS detected)
  if (analysis.hasECS) {
    files['src/ecs/entity_manager.asm'] = ECSGen.generateEntityManagerASM(analysis);
    files['src/ecs/component_types.asm'] = ECSGen.generateComponentTypesASM(analysis);
    files['src/ecs/system_renderer.asm'] = ECSGen.generateRendererSystemASM(analysis);
    files['src/ecs/system_input.asm'] = ECSGen.generateInputSystemASM(analysis);
    files['src/ecs/system_physics.asm'] = ECSGen.generatePhysicsSystemASM(analysis);
    files['src/ecs/system_collision.asm'] = ECSGen.generateCollisionSystemASM(analysis);
  }
  
  // Core system files
  files['src/core/memory.asm'] = ECSGen.generateMemoryManagerASM(analysis);
  files['src/core/scheduler.asm'] = ECSGen.generateSchedulerASM(analysis);
  
  // Screen files
  files['src/screens/screen_game.asm'] = ECSGen.generateGameScreenASM(analysis);
  files['src/screens/screen_menu.asm'] = ECSGen.generateMenuScreenASM(analysis);
  
  // Asset definition files
  if (analysis.screenMaps.length > 0) {
    files['assets/maps/level1_entities.csv'] = ECSGen.generateEntitiesCSV(analysis);
  }
  
  // Include files
  files['include/glass_helpers.inc'] = ECSGen.generateGlassHelpersInc();
  
  // Tools
  files['tools/png2msx.py'] = ECSGen.generatePNG2MSXTool();
  files['tools/csv_entities_parser.py'] = ECSGen.generateCSVParserTool();
  
  // Documentation
  files['docs/ecs_design.md'] = ECSGen.generateECSDesignDoc(analysis);
  files['docs/memory_layout.txt'] = ECSGen.generateMemoryLayoutDoc(analysis);
  
  // Build system
  files['glass.cfg'] = ECSGen.generateGlassConfig(sanitizedName);
  files['Makefile'] = ECSGen.generateProfessionalMakefile(sanitizedName, analysis);
  files['README.md'] = ECSGen.generateREADME(projectName, analysis);
  
  return files;
}

/**
 * Generate constants file (FOR SEPARATE FILES ONLY - not used in all-in-one)
 */
function generateConstantsFile(config: MSXProjectConfig): string {
  // This function generates constants for separate file exports only
  // For all-in-one exports, use generateInlineSystemConstants() instead
  return `; MSX System Constants (Separate Files Mode)
; Generated for ${config.targetMSX} target
; NOTE: For all-in-one export, constants are generated inline
; IMPORTANT: Constants removed to prevent conflicts with all-in-one export

; All constants are now defined in generateInlineSystemConstants()
; This file is only used for separate file exports

`;
}

/**
 * Generate build script
 */
function generateBuildScript(projectName: string): string {
  return `@echo off
echo Building ${projectName.toUpperCase()} for MSX...

REM Assemble main file
sjasm main.asm ${projectName}.rom

if exist ${projectName}.rom (
    echo Build successful: ${projectName}.rom created
) else (
    echo Build failed!
)

pause
`;
}

/**
 * Generate Makefile
 */
function generateMakefile(projectName: string): string {
  return `# Makefile for ${projectName.toUpperCase()}
# Generated by MSX Retro Game IDE

ASM = sjasm
TARGET = ${projectName}.rom
MAIN_SRC = main.asm

all: $(TARGET)

$(TARGET): $(MAIN_SRC)
	$(ASM) $(MAIN_SRC) $(TARGET)

clean:
	rm -f $(TARGET) *.sym *.map

.PHONY: all clean
`;
}

// ====================================================================
// UNITED FILES ASM - AUXILIARY FUNCTIONS
// ====================================================================

// Removed custom generateScreenLayoutASM function - now using generateScreenLayoutASMCode from screenUtils

/**
 * Generate Konami ROM Header
 */
function generateKonamiROMHeader(projectName: string, analysis: ProjectAnalysis): string {
  return `; ==================================================================
; KONAMI CARTRIDGE ROM HEADER
; ==================================================================
    DB "AB"              ; ROM signature
    DW INIT_KONAMI       ; Init address
    DW 0,0,0,0,0         ; Statement, Device, Text, Reserved

INIT_KONAMI:
    ; Konami cartridge initialization
    DI                   ; Disable interrupts during init

    ; Initialize stack for Konami cartridge
    LD SP, #F380

    ; Initialize RAM variables area (SAFE - only project variables)
    ; Clear ONLY project variables zone, NOT system variables (#F380+)
    LD HL, input_state           ; #C000 - first project variable
    LD DE, input_state+1         ; #C001 - next byte
    LD BC, RAM_USAGE_END - input_state - 1       ; Only to #C100
    LD (HL), 0
    LDIR

    ; Jump to main game (init functions are defined later)
    JP MAIN_GAME_START

; VDP initialization for Konami cartridge
INIT_VDP_KONAMI:
    ; Initialize VDP for Konami cartridge
    ; Setup screen mode 2
    RET

; Sound initialization for Konami cartridge
INIT_SOUND_KONAMI:
    ; Initialize sound system
    RET

`;
}

/**
 * Generate inline system constants
 */
function generateInlineSystemConstants(): string {
  return `; ==================================================================
; MSX SYSTEM CONSTANTS (INLINE)
; ==================================================================

; BIOS Addresses
CHGMOD  EQU #005F        ; Change screen mode
CLS     EQU #00C3        ; Clear screen
CHPUT   EQU #00A2        ; Character output
GTSTCK  EQU #00D5        ; Get joystick status
GTTRIG  EQU #00D8        ; Get trigger status
KILBUF  EQU #0156        ; Kill keyboard buffer
LDIRVM  EQU #005C        ; Block transfer from CPU to VRAM

; VDP Addresses
VDPDR   EQU #0098        ; VDP Data Register
VDPSR   EQU #0099        ; VDP Status Register

; VRAM Layout (Screen 2)
CHRTBL2 EQU #0000        ; Pattern table base address (Screen 2)
CLRTBL2 EQU #2000        ; Color table base address (Screen 2)
NAMETBL EQU #1800        ; Name table base address
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table


; Game Constants
MAX_SPRITES     EQU 32
SCREEN_WIDTH    EQU 32
SCREEN_HEIGHT   EQU 24
TILE_SIZE       EQU 8

; Game Flow States
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3

`;
}

/**
 * Generate inline RAM variables for all-in-one compilation
 */
function generateInlineRAMVariables(): string {
  return `
; ####################################################################
; #                                                                  #
; #                    RAM VARIABLES SECTION                        #
; #                                                                  #
; ####################################################################
; # IMPORTANT: This section defines VARIABLE ADDRESSES ONLY         #
; #            No actual data is stored in ROM                       #
; #            All variables are in MSX RAM area #C000-#FFFF         #
; ####################################################################

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
input_state         EQU #C000   ; Current joystick/keyboard state
prev_input_state    EQU #C001   ; Previous input state
current_flow_state  EQU #C002   ; Current game flow state
prev_flow_state     EQU #C003   ; Previous game flow state
frame_counter       EQU #C004   ; Frame counter (16-bit)

; ==================================================================
; SPRITE SYSTEM VARIABLES (ALWAYS PRESENT FOR COMPATIBILITY)
; ==================================================================
active_sprite_count EQU #C006   ; Number of sprites currently active
sprite_x_pos        EQU #C007   ; Sprite X positions (32 bytes: #C007-#C026)
sprite_y_pos        EQU #C027   ; Sprite Y positions (32 bytes: #C027-#C046)
sprite_pattern      EQU #C047   ; Sprite pattern IDs (32 bytes: #C047-#C066)
sprite_color        EQU #C067   ; Sprite colors (32 bytes: #C067-#C086)

; ==================================================================
; SCREEN SYSTEM VARIABLES (ALWAYS PRESENT FOR COMPATIBILITY)
; ==================================================================
current_screen_id   EQU #C087   ; Currently displayed screen ID
screen_dirty_flag   EQU #C088   ; Screen needs redraw flag

; ==================================================================
; TEMPORARY VARIABLES
; ==================================================================
temp_word_1         EQU #C089   ; Temporary 16-bit storage
temp_word_2         EQU #C08B   ; Temporary 16-bit storage
temp_byte_1         EQU #C08D   ; Temporary 8-bit storage
temp_byte_2         EQU #C08E   ; Temporary 8-bit storage
RAM_USAGE_END       EQU #C08F   ; End of project variables

`;

  // TODO: Re-enable dynamic variables generation when fixed
  // Insert dynamic variables based on project analysis
  console.log('🔧 Generating dynamic variables for:', {
    sprites: analysis.sprites.length,
    screens: analysis.screenMaps.length,
    tiles: analysis.tiles.length
  });
  // const dynamicVars = generateDynamicVariables(analysis);
  // console.log('📝 Generated variables:', dynamicVars.substring(0, 200) + '...');
  // code += dynamicVars;

  code += `

`;
}

/**
 * Generate inline assets data - DYNAMIC VERSION
 */
function generateInlineAssets(assets: ProjectAsset[], analysis: ProjectAnalysis, config?: MSXProjectConfig, projectData?: any): string {
  let code = '';

  // Solo agregar header si hay assets
  if (analysis.tiles.length > 0 || analysis.sprites.length > 0 ||
      analysis.screenMaps.length > 0 || analysis.fonts.length > 0 ||
      analysis.worlds.length > 0) {

    code += `; ==================================================================\n`;
    code += `; ASSET DATA (DYNAMIC GENERATION)\n`;
    code += `; Generated only for assets that exist in project\n`;
    code += `; ==================================================================\n\n`;
  }

  // Generate SCREEN data (if exists) - USING REAL SCREEN EDITOR DATA
  if (analysis.screenMaps.length > 0) {
    code += `; ================================================================\n`;
    code += `; SCREEN LAYOUT DATA (MSX Screen 2 Compatible)\n`;
    code += `; ================================================================\n`;
    code += `; IMPORTANT: MSX Screen 2 uses 3 banks of 256 patterns each:\n`;
    code += `;   - Lines 0-7:   Use patterns from BANK0 (VRAM #0000/#2000)\n`;
    code += `;   - Lines 8-15:  Use patterns from BANK1 (VRAM #0800/#2800)\n`;
    code += `;   - Lines 16-23: Use patterns from BANK2 (VRAM #1000/#3000)\n`;
    code += `;\n`;
    code += `; The same pattern index (e.g., #05) can display different\n`;
    code += `; graphics depending on which screen line it appears on.\n`;
    code += `; ================================================================\n\n`;
    code += `SCREEN_COUNT    EQU ${analysis.screenMaps.length}\n\n`;

    // Get all tiles for processing
    const allTiles = assets.filter(a => a.type === 'tile') as ProjectAsset[];

    analysis.screenMaps.forEach((screen, index) => {
      try {
        // Find the actual screen asset
        const screenMapAsset = assets.find(a => a.type === 'screenmap' && (a.data as ScreenMap)?.name === screen.name);

        if (screenMapAsset) {
          const screenMapData = screenMapAsset.data as ScreenMap;
          const tiles = allTiles.map(asset => asset.data as Tile);
          const tileBanks = projectData?.tileBanks as TileBank[] | undefined;

          // USE THE EXACT SAME FUNCTIONS AS SCREEN EDITOR'S "DOWNLOAD ASM" BUTTON
          const layoutBytes = generateScreenMapLayoutBytes(
            screenMapData,
            tiles,
            tileBanks,
            'SCREEN 2 (Graphics I)'
          );

          const screenASM = generateScreenLayoutASMCode(
            screen.name,
            screenMapData.activeAreaWidth ?? screenMapData.width,
            screenMapData.activeAreaHeight ?? screenMapData.height,
            Array.from(layoutBytes),
            [], // referenceComments
            'hex'
          );

          code += screenASM;

          // Debug info
          const nonFFCount = Array.from(layoutBytes).filter(b => b !== 255).length;
          console.log(`✅ Screen ${screen.name}: ${nonFFCount}/${layoutBytes.length} non-FF bytes (${((nonFFCount/layoutBytes.length)*100).toFixed(1)}%)`);

        } else {
          console.warn(`❌ Screen asset not found: ${screen.name}`);
          // Simple fallback
          code += `; Screen ${screen.name} - NOT FOUND\n`;
          code += `SCREEN_${screen.name.replace(/[^A-Z0-9_]/g, '_').toUpperCase()}_WIDTH     EQU 32\n`;
          code += `SCREEN_${screen.name.replace(/[^A-Z0-9_]/g, '_').toUpperCase()}_HEIGHT    EQU 24\n`;
          code += `SCREEN_${screen.name.replace(/[^A-Z0-9_]/g, '_').toUpperCase()}_LAYOUT:\n`;
          code += `    DB 0    ; Asset not found\n\n`;
        }

      } catch (error) {
        console.error(`❌ Error processing screen ${screen.name}:`, error);
      }
    });

    // Screen lookup table
    code += `SCREEN_TABLE:\n`;
    analysis.screenMaps.forEach((screen) => {
      const safeScreenName = screen.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
      code += `    DW SCREEN_${safeScreenName}_LAYOUT\n`;
    });
    code += `\n`;

    // Generate BEHAVIOR/COLLISION data (if collision layers exist) - USING REAL SCREEN EDITOR DATA
    const screensWithCollision = analysis.screenMaps.filter(screen => {
      const screenMapAsset = assets.find(a => a.type === 'screenmap' && (a.data as ScreenMap)?.name === screen.name);
      if (screenMapAsset) {
        const screenMapData = screenMapAsset.data as ScreenMap;
        // Check if collision layer has any non-empty tiles
        const collisionLayer = screenMapData.layers?.collision;
        if (collisionLayer) {
          return collisionLayer.some(row => row.some(cell => cell && cell.tileId));
        }
      }
      return false;
    });

    if (screensWithCollision.length > 0) {
      code += `; Behavior/Collision Data from Screen Editor (using Behavior ASM functionality)\n`;
      code += `BEHAVIOR_SCREEN_COUNT    EQU ${screensWithCollision.length}\n\n`;

      // Get all tiles for processing
      const allTiles = assets.filter(a => a.type === 'tile') as ProjectAsset[];

      screensWithCollision.forEach((screen) => {
        try {
          // Find the actual screen asset
          const screenMapAsset = assets.find(a => a.type === 'screenmap' && (a.data as ScreenMap)?.name === screen.name);

          if (screenMapAsset) {
            const screenMapData = screenMapAsset.data as ScreenMap;
            const tiles = allTiles.map(asset => asset.data as Tile);

            // USE THE EXACT SAME FUNCTIONS AS SCREEN EDITOR'S "DOWNLOAD ASM" BUTTON FOR BEHAVIOR
            const behaviorMapData = generateBehaviorMapData(screenMapData, tiles);

            const behaviorASM = generateBehaviorMapASMCode(
              screen.name,
              screenMapData.activeAreaWidth ?? screenMapData.width,
              screenMapData.activeAreaHeight ?? screenMapData.height,
              behaviorMapData,
              'hex'
            );

            code += behaviorASM;

            // Debug info
            const nonZeroCount = behaviorMapData.filter(b => b !== 0).length;
            console.log(`✅ Behavior ${screen.name}: ${nonZeroCount}/${behaviorMapData.length} non-zero behavior IDs (${((nonZeroCount/behaviorMapData.length)*100).toFixed(1)}%)`);

          } else {
            console.warn(`❌ Screen asset not found for behavior: ${screen.name}`);
          }

        } catch (error) {
          console.error(`❌ Error processing behavior for screen ${screen.name}:`, error);
        }
      });

      // Behavior lookup table
      code += `BEHAVIOR_TABLE:\n`;
      screensWithCollision.forEach((screen) => {
        const safeScreenName = screen.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
        code += `    DW BEHAVIOR_${safeScreenName}_DATA\n`;
      });
      code += `\n`;
    }
  }

  // Generate SPRITE data (if exists) - USING REAL SPRITE EDITOR DATA
  if (analysis.sprites.length > 0) {
    code += `; Sprite Data from Sprite Editor (using Sprite ASM functionality)\n`;
    code += `SPRITE_COUNT    EQU ${analysis.sprites.length}\n\n`;

    // Get all sprite assets for processing
    const allSpriteAssets = assets.filter(a => a.type === 'sprite') as ProjectAsset[];

    analysis.sprites.forEach((sprite, index) => {
      code += `; Sprite ${index}: ${sprite.name}\n`;
      code += `SPRITE_${sprite.name.toUpperCase()}_ID    EQU ${index}\n`;
    });
    code += `\n`;

    // Generate sprite data using real Sprite Editor functions
    allSpriteAssets.forEach((spriteAsset) => {
      try {
        const sprite = spriteAsset.data as Sprite;

        // USE THE EXACT SAME FUNCTION AS SPRITE EDITOR'S "DOWNLOAD ASM" BUTTON
        const spriteASM = generateSpriteASMCode(sprite, 'hex');

        code += spriteASM;

        // Debug info
        let totalLayers = 0;
        let totalBytes = 0;
        sprite.frames.forEach(frame => {
          sprite.spritePalette.forEach(color => {
            if (color !== sprite.backgroundColor) {
              const colorUsed = frame.data.some(row => row.some(pixel => pixel === color));
              if (colorUsed) {
                totalLayers++;
                // Calculate bytes per layer (width/8 * height)
                const bytesPerLayer = Math.ceil(sprite.size.width / 8) * sprite.size.height;
                totalBytes += bytesPerLayer;
              }
            }
          });
        });

        console.log(`✅ Sprite ${sprite.name}: ${sprite.frames.length} frames, ${totalLayers} layers, ${totalBytes} bytes total`);

      } catch (error) {
        console.error(`❌ Error processing sprite ${spriteAsset.name}:`, error);
        // Fallback
        code += `; Sprite ${spriteAsset.name} - ERROR\n`;
        code += `SPRITE_${spriteAsset.name.toUpperCase()}_ERROR:\n`;
        code += `    DB #00    ; ${spriteAsset.name} - ERROR\n\n`;
      }
    });

    // Sprite lookup table (simplified for MSX generator)
    code += `; Sprite Pattern References\n`;
    allSpriteAssets.forEach((spriteAsset) => {
      const sprite = spriteAsset.data as Sprite;
      const safeSpriteName = sprite.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
      code += `; ${sprite.name}: SPRITE_${safeSpriteName}_* (see individual frame/layer labels above)\n`;
    });
    code += `\n`;
  }

  // Generate TILE data (if exists) - MSX SCREEN 2 BANK SYSTEM
  if (analysis.tiles.length > 0) {
    code += `; ================================================================\n`;
    code += `; MSX SCREEN 2 TILE BANK SYSTEM (3 banks of 256 patterns each)\n`;
    code += `; Bank 0: Lines 0-7   (VRAM Pattern: #0000, Color: #2000)\n`;
    code += `; Bank 1: Lines 8-15  (VRAM Pattern: #0800, Color: #2800)\n`;
    code += `; Bank 2: Lines 16-23 (VRAM Pattern: #1000, Color: #3000)\n`;
    code += `; ================================================================\n\n`;

    code += `TILE_COUNT      EQU ${analysis.tiles.length}\n`;
    code += `TILE_BYTES      EQU 8    ; Bytes per character block (TILE_SIZE already defined)\n\n`;

    // Get all tile assets and tileBanks for processing
    const allTileAssets = assets.filter(a => a.type === 'tile') as ProjectAsset[];
    const tileBanks = projectData?.tileBanks as TileBank[] | undefined;

    // Organize tiles into 3 MSX Screen 2 banks
    const msxBanks = [
      { name: 'BANK0', tiles: [] as ProjectAsset[], vramPattern: 0x0000, vramColor: 0x2000, lines: '0-7' },
      { name: 'BANK1', tiles: [] as ProjectAsset[], vramPattern: 0x0800, vramColor: 0x2800, lines: '8-15' },
      { name: 'BANK2', tiles: [] as ProjectAsset[], vramPattern: 0x1000, vramColor: 0x3000, lines: '16-23' }
    ];

    // Distribute tiles among banks based on TileBank assignments or round-robin
    allTileAssets.forEach((tileAsset, index) => {
      let bankIndex = 0; // Default to bank 0

      if (tileBanks) {
        // Try to find which TileBank this tile belongs to based on screen zones
        const tile = tileAsset.data as Tile;
        // For now, use a simple mapping: TileBank ID to MSX Bank
        // This can be made more sophisticated based on actual usage
        bankIndex = index % 3; // Round-robin distribution for now
      } else {
        bankIndex = index % 3; // Round-robin if no TileBanks defined
      }

      // Ensure we don't exceed 256 tiles per bank
      if (msxBanks[bankIndex].tiles.length < 256) {
        msxBanks[bankIndex].tiles.push(tileAsset);
      } else {
        // Find next available bank
        for (let i = 0; i < 3; i++) {
          if (msxBanks[i].tiles.length < 256) {
            msxBanks[i].tiles.push(tileAsset);
            break;
          }
        }
      }
    });

    // Generate tile ID constants
    analysis.tiles.forEach((tile, index) => {
      code += `TILE_${tile.name.toUpperCase()}_ID    EQU ${index}\n`;
    });
    code += `\n`;

    // Generate pattern tables for each bank
    msxBanks.forEach((bank, bankIndex) => {
      code += `; ================================================================\n`;
      code += `; PATTERN DATA - ${bank.name} (Lines ${bank.lines})\n`;
      code += `; VRAM Address: #${bank.vramPattern.toString(16).toUpperCase().padStart(4, '0')}\n`;
      code += `; Tiles in this bank: ${bank.tiles.length}/256\n`;
      code += `; ================================================================\n`;
      code += `TILE_PATTERN_${bank.name}:\n`;

      if (bank.tiles.length > 0) {
        bank.tiles.forEach((tileAsset) => {
          try {
            const tile = tileAsset.data as Tile;
            const safeTileName = tile.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

            // USE THE EXACT SAME FUNCTION AS TILE EDITOR'S "DOWNLOAD ASM" BUTTON
            const patternBytes = generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)');

            code += `    ; Pattern data for ${safeTileName} (${bank.name})\n`;
            for (let i = 0; i < patternBytes.length; i += 16) {
              const chunk = Array.from(patternBytes.slice(i, i + 16));
              const formattedChunk = chunk.map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
              code += `    DB ${formattedChunk.join(',')}\n`;
            }

          } catch (error) {
            console.error(`❌ Error processing tile pattern ${tileAsset.name} in ${bank.name}:`, error);
            // Fallback
            code += `    ; Tile ${tileAsset.name} - ERROR\n`;
            for (let row = 0; row < 8; row++) {
              code += `    DB #00    ; ${tileAsset.name} row ${row} - ERROR\n`;
            }
          }
        });
      } else {
        // Empty bank - add a single zero byte so the label exists
        code += `    ; ${bank.name} is empty - pattern reuse from Bank 0\n`;
        code += `    DB #00    ; Empty bank marker\n`;
      }
      code += `\n`;
    });

    // Generate color tables for each bank
    msxBanks.forEach((bank, bankIndex) => {
      code += `; ================================================================\n`;
      code += `; COLOR DATA - ${bank.name} (Lines ${bank.lines})\n`;
      code += `; VRAM Address: #${bank.vramColor.toString(16).toUpperCase().padStart(4, '0')}\n`;
      code += `; Tiles in this bank: ${bank.tiles.length}/256\n`;
      code += `; ================================================================\n`;
      code += `TILE_COLOR_${bank.name}:\n`;

      if (bank.tiles.length > 0) {
        bank.tiles.forEach((tileAsset) => {
          try {
            const tile = tileAsset.data as Tile;
            const safeTileName = tile.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

            // USE THE EXACT SAME FUNCTION AS TILE EDITOR'S "DOWNLOAD ASM" BUTTON
            const colorBytes = generateTileColorBytes(tile);

            if (colorBytes) {
              code += `    ; Color data for ${safeTileName} (${bank.name})\n`;
              for (let i = 0; i < colorBytes.length; i += 16) {
                const chunk = Array.from(colorBytes.slice(i, i + 16));
                const formattedChunk = chunk.map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
                code += `    DB ${formattedChunk.join(',')}\n`;
              }
            } else {
              code += `    ; Tile ${safeTileName} - No color data (not SCREEN 2 compatible)\n`;
              code += `    DB #0F    ; Default white on transparent\n`;
            }

          } catch (error) {
            console.error(`❌ Error processing tile color ${tileAsset.name} in ${bank.name}:`, error);
            // Fallback
            code += `    ; Tile ${tileAsset.name} - ERROR\n`;
            code += `    DB #0F    ; Default white on transparent\n`;
          }
        });
      } else {
        // Empty bank - different colors can be used even with Bank 0 patterns
        code += `    ; ${bank.name} colors - can be different from Bank 0 even with same patterns\n`;
        code += `    DB #0F    ; Empty bank marker (white on transparent)\n`;
      }
      code += `\n`;
    });

    // Generate bank loading constants
    code += `; MSX Screen 2 Bank Loading Constants\n`;
    msxBanks.forEach((bank) => {
      code += `VRAM_PATTERN_${bank.name}    EQU #${bank.vramPattern.toString(16).toUpperCase().padStart(4, '0')}\n`;
      code += `VRAM_COLOR_${bank.name}      EQU #${bank.vramColor.toString(16).toUpperCase().padStart(4, '0')}\n`;
    });
    code += `\n`;

    // Debug info
    msxBanks.forEach((bank, bankIndex) => {
      console.log(`✅ MSX Screen 2 ${bank.name}: ${bank.tiles.length}/256 tiles (Lines ${bank.lines})`);
    });
  }

  // Generate FONT data (if exists)
  const fontAssets = assets.filter(a => a.type === 'font');
  if (fontAssets.length > 0) {
    code += `; Font Data from Font Editor\n`;
    fontAssets.forEach((font, fontIndex) => {
      code += `; Font ${fontIndex}: ${font.name}\n`;
      code += `FONT_${font.name.toUpperCase()}_CHAR_COUNT    EQU ${(font.data as any)?.characters?.length || 96}\n`;
      code += `FONT_${font.name.toUpperCase()}_PATTERNS:\n`;

      // Generate character patterns (placeholder)
      for (let charIndex = 0; charIndex < ((font.data as any)?.characters?.length || 96); charIndex++) {
        code += `    ; Character ${charIndex + 32} (ASCII)\n`;
        for (let row = 0; row < 8; row++) {
          code += `    DB #00    ; Pattern row ${row}\n`;
        }
      }
      code += `\n`;
    });
  }

  // Generate WORLD data (if exists)
  const worldAssets = assets.filter(a => a.type === 'world');
  if (worldAssets.length > 0) {
    code += `; World Data from World Editor\n`;
    code += `WORLD_COUNT     EQU ${worldAssets.length}\n\n`;

    worldAssets.forEach((world, worldIndex) => {
      code += `; World ${worldIndex}: ${world.name}\n`;
      const worldData = world.data as any;
      const worldWidth = worldData?.width || 32;
      const worldHeight = worldData?.height || 24;

      code += `WORLD_${world.name.toUpperCase()}_WIDTH     EQU ${worldWidth}\n`;
      code += `WORLD_${world.name.toUpperCase()}_HEIGHT    EQU ${worldHeight}\n`;
      code += `WORLD_${world.name.toUpperCase()}_MAP:\n`;

      // Generate world map data
      for (let y = 0; y < worldHeight; y++) {
        code += `    DB `;
        for (let x = 0; x < worldWidth; x++) {
          const tileId = (worldData?.mapData && worldData.mapData[y * worldWidth + x]) || 0;
          code += `${tileId}${x < worldWidth - 1 ? ',' : ''}`;
        }
        code += `    ; Row ${y}\n`;
      }
      code += `\n`;

      // Generate spawn points if available
      if (worldData?.playerSpawn) {
        code += `WORLD_${world.name.toUpperCase()}_SPAWN_X    EQU ${worldData.playerSpawn.x || 0}\n`;
        code += `WORLD_${world.name.toUpperCase()}_SPAWN_Y    EQU ${worldData.playerSpawn.y || 0}\n\n`;
      }
    });

    // World lookup table
    code += `WORLD_TABLE:\n`;
    worldAssets.forEach((world) => {
      code += `    DW WORLD_${world.name.toUpperCase()}_MAP\n`;
    });
    code += `\n`;
  }

  return code;
}

/**
 * Generate Game Flow integration
 */
function generateGameFlowIntegration(assets: ProjectAsset[], analysis: ProjectAnalysis): string {
  const gameFlowAssets = assets.filter(a => a.type === 'gameflow');

  return `; ==================================================================
; GAME FLOW SYSTEM
; ==================================================================

; Game Flow State Constants
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_GAME_OVER    EQU 2

CHANGE_FLOW_STATE:
    ; Change Game Flow state
    ; A = new state
    LD (current_flow_state), A
    RET

; Variables defined in EQU section above - no DB needed in ROM

`;
}

/**
 * Generate task registration code for interrupt system
 */
function generateTaskRegistration(analysis: ProjectAnalysis): string {
  let code = '';

  code += `    ; ==================================================================\n`;
  code += `    ; INTERRUPT SYSTEM TASK REGISTRATION\n`;
  code += `    ; Register only tasks needed by this project\n`;
  code += `    ; ==================================================================\n\n`;

  // Task 0: Input (ALWAYS registered)
  code += `    ; Task 0: Input polling (ALWAYS enabled for responsive controls)\n`;
  code += `    LD A, 0\n`;
  code += `    LD HL, task_update_input\n`;
  code += `    CALL enable_task\n\n`;

  // Task 1: Physics (if has movement/physics)
  const hasPhysics = analysis.hasPhysics || analysis.hasMovement;
  if (hasPhysics) {
    code += `    ; Task 1: Physics update (project has movement/physics)\n`;
    code += `    LD A, 1\n`;
    code += `    LD HL, task_update_physics\n`;
    code += `    CALL enable_task\n\n`;
  } else {
    code += `    ; Task 1: Physics - NOT registered (no movement detected)\n\n`;
  }

  // Task 2: Collision (if has collisions)
  if (analysis.hasCollisions) {
    code += `    ; Task 2: Collision detection (project has collision system)\n`;
    code += `    LD A, 2\n`;
    code += `    LD HL, task_update_collision\n`;
    code += `    CALL enable_task\n\n`;
  } else {
    code += `    ; Task 2: Collision - NOT registered (no collisions needed)\n\n`;
  }

  // Task 3: Sprites (if has sprites)
  // NOTE: This is heavy, so we DON'T auto-register it
  // User should enable it manually when needed
  if (analysis.hasSprites) {
    code += `    ; Task 3: Sprite rendering - NOT auto-registered (HEAVY task ~800 cycles)\n`;
    code += `    ; Enable manually when sprites are on screen:\n`;
    code += `    ;   LD A, 3\n`;
    code += `    ;   LD HL, task_update_sprites\n`;
    code += `    ;   CALL enable_task\n\n`;
  } else {
    code += `    ; Task 3: Sprites - NOT available (no sprites in project)\n\n`;
  }

  // Slots 4-7: User custom
  code += `    ; Tasks 4-7: Custom user slots (enable as needed)\n`;
  code += `    ; Example:\n`;
  code += `    ;   LD A, 4\n`;
  code += `    ;   LD HL, my_custom_routine\n`;
  code += `    ;   CALL enable_task\n\n`;

  return code;
}

/**
 * Generate Konami main program
 */
function generateKonamiMainProgram(analysis: ProjectAnalysis, config: MSXProjectConfig): string {
  let code = `; ==================================================================
; MAIN PROGRAM (KONAMI CARTRIDGE) - INTERRUPT-BASED ARCHITECTURE
; ==================================================================

MAIN_GAME_START:
    ; Set screen mode for game
    LD A, 2              ; Screen 2 for MSX1
    CALL CHGMOD

    ; Clear screen
    CALL CLS

    ; Initialize game systems
    CALL INIT_GAME_SYSTEMS

    ; INTERRUPT SYSTEM: Initialize H.TIMI hook
    CALL init_interrupt_system

`;

  // Add task registration (dynamic based on project analysis)
  code += generateTaskRegistration(analysis);

  code += `    ; Initialize Game Flow system inline (avoid forward reference)
    XOR A
    LD (current_flow_state), A
    LD (prev_flow_state), A

    ; Start with main menu
    LD A, FLOW_STATE_MAIN_MENU
    LD (current_flow_state), A

    ; Main game loop - Now interrupt-driven
MAIN_LOOP:
    HALT                 ; Wait for V-Blank (ISR executes registered tasks)

    ; HEAVY/NON-CRITICAL logic only (tasks run in ISR):
    ; - Input is handled by task_update_input (60Hz)
    ; - Physics is handled by task_update_physics (60Hz)
    ; - Collision is handled by task_update_collision (60Hz)

    ; Update current game state (state machine logic)
    CALL UPDATE_CURRENT_STATE

    ; Update game systems (non-critical updates)
    CALL UPDATE_GAME_SYSTEMS

    ; Render frame (may be partially handled by tasks)
    CALL RENDER_FRAME

    ; Loop forever
    JP MAIN_LOOP


`;

  return code;
}

/**
 * Generate inline game systems - DYNAMIC VERSION
 */
function generateInlineGameSystems(analysis: ProjectAnalysis, assets?: ProjectAsset[]): string {
  let code = '';

  code += `; ==================================================================\n`;
  code += `; GAME SYSTEMS (DYNAMIC GENERATION)\n`;
  code += `; Only systems needed for this project are included\n`;
  code += `; ==================================================================\n\n`;

  // DYNAMIC COLLISION DETECTION - Check if any screen has collision layers
  let hasCollisionLayers = false;
  if (assets) {
    hasCollisionLayers = analysis.screenMaps.some(screen => {
      const screenMapAsset = assets.find(a => a.type === 'screenmap' && (a.data as ScreenMap)?.name === screen.name);
      if (screenMapAsset) {
        const screenMapData = screenMapAsset.data as ScreenMap;
        const collisionLayer = screenMapData.layers?.collision;
        if (collisionLayer) {
          return collisionLayer.some(row => row.some(cell => cell && cell.tileId));
        }
      }
      return false;
    });
  }

  // INIT_GAME_SYSTEMS - Dynamic based on project content
  code += `INIT_GAME_SYSTEMS:\n`;
  code += `    ; Initialize systems dynamically based on project assets\n`;
  code += `    CALL INIT_INPUT_SYSTEM    ; Always needed\n`;

  if (analysis.sprites.length > 0) {
    code += `    CALL INIT_SPRITE_SYSTEM   ; Project has ${analysis.sprites.length} sprites\n`;
  }

  if (analysis.tiles.length > 0) {
    code += `    CALL INIT_TILE_SYSTEM     ; Project has ${analysis.tiles.length} tiles\n`;
  }

  if (analysis.screenMaps.length > 0) {
    code += `    CALL INIT_SCREEN_SYSTEM   ; Project has ${analysis.screenMaps.length} screens\n`;
  }

  if (hasCollisionLayers) {
    code += `    CALL INIT_COLLISION_SYSTEM ; Project has collision layers\n`;
  }

  // Check for world assets
  const hasWorlds = analysis.worlds && analysis.worlds.length > 0;
  if (hasWorlds) {
    code += `    CALL INIT_WORLD_SYSTEM    ; Project has ${analysis.worlds.length} worlds\n`;
  }

  code += `    RET\n\n`;

  // INPUT SYSTEM (Always included)
  code += `INIT_INPUT_SYSTEM:\n`;
  code += `    ; Initialize input handling\n`;
  code += `    XOR A\n`;
  code += `    LD (input_state), A\n`;
  code += `    LD (prev_input_state), A\n`;
  code += `    RET\n\n`;

  // SPRITE SYSTEM (Only if sprites exist)
  if (analysis.sprites.length > 0) {
    code += `INIT_SPRITE_SYSTEM:\n`;
    code += `    ; Initialize sprite system for ${analysis.sprites.length} sprites\n`;
    code += `    ; NOTE: Individual sprite patterns are loaded by name\n`;
    code += `    ; Use SPRITE_[NAME]_F[FRAME]_C[COLOR]_LAYER labels generated by sprite assets\n`;
    code += `    ; Clear sprite attributes table\n`;
    code += `    LD HL, SPRATR\n`;
    code += `    LD DE, SPRATR+1\n`;
    code += `    LD BC, 127      ; Clear all 32 sprites × 4 bytes = 128 bytes\n`;
    code += `    LD (HL), #D1    ; Y=209 (off-screen position)\n`;
    code += `    LDIR\n`;
    code += `    ; Initialize sprite counter\n`;
    code += `    XOR A\n`;
    code += `    LD (active_sprite_count), A\n`;
    code += `    RET\n\n`;
  }

  // TILE SYSTEM (Only if tiles exist) - MSX SCREEN 2 BANK SYSTEM
  if (analysis.tiles.length > 0) {
    code += `INIT_TILE_SYSTEM:\n`;
    code += `    ; Initialize MSX Screen 2 tile system with 3 banks\n`;
    code += `    ; Load all 3 pattern banks to their VRAM locations\n`;
    code += `    CALL LOAD_PATTERN_BANK0       ; Bank 0 (Lines 0-7)\n`;
    code += `    CALL LOAD_PATTERN_BANK1       ; Bank 1 (Lines 8-15)\n`;
    code += `    CALL LOAD_PATTERN_BANK2       ; Bank 2 (Lines 16-23)\n`;
    code += `    ; Load all 3 color banks to their VRAM locations\n`;
    code += `    CALL LOAD_COLOR_BANK0         ; Bank 0 colors\n`;
    code += `    CALL LOAD_COLOR_BANK1         ; Bank 1 colors\n`;
    code += `    CALL LOAD_COLOR_BANK2         ; Bank 2 colors\n`;
    code += `    RET\n\n`;

    // Generate individual bank loading functions
    code += `; MSX Screen 2 Bank Loading Functions\n`;
    code += `LOAD_PATTERN_BANK0:\n`;
    code += `    ; Load pattern bank 0 to VRAM (base patterns)\n`;
    code += `    LD HL, TILE_PATTERN_BANK0\n`;
    code += `    LD DE, CHRTBL2                ; VRAM pattern table bank 0 (base)\n`;
    code += `    LD BC, 256 * 8                ; Max 256 patterns × 8 bytes\n`;
    code += `    CALL LDIRVM                   ; Use BIOS function\n`;
    code += `    RET\n\n`;

    code += `LOAD_PATTERN_BANK1:\n`;
    code += `    ; Load pattern bank 1: same patterns as bank 0 (Mideas standard)\n`;
    code += `    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0\n`;
    code += `    LD DE, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)\n`;
    code += `    LD BC, 256 * 8                ; Max 256 patterns × 8 bytes\n`;
    code += `    CALL LDIRVM                   ; Use BIOS function\n`;
    code += `    RET\n\n`;

    code += `LOAD_PATTERN_BANK2:\n`;
    code += `    ; MSX Screen 2 Bank 2: Load same patterns as other banks (Mideas standard)\n`;
    code += `    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0\n`;
    code += `    LD DE, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)\n`;
    code += `    LD BC, 256 * 8                ; Max 256 patterns × 8 bytes\n`;
    code += `    CALL LDIRVM                   ; Use BIOS function like real Mideas\n`;
    code += `    RET\n\n`;

    code += `LOAD_COLOR_BANK0:\n`;
    code += `    ; Load color bank 0 to VRAM (base colors)\n`;
    code += `    LD HL, TILE_COLOR_BANK0\n`;
    code += `    LD DE, CLRTBL2                ; VRAM color table bank 0 (base)\n`;
    code += `    LD BC, 256 * 8                ; Max 256 patterns × 8 bytes\n`;
    code += `    CALL LDIRVM                   ; Use BIOS function\n`;
    code += `    RET\n\n`;

    code += `LOAD_COLOR_BANK1:\n`;
    code += `    ; Load color bank 1: same colors as bank 0 (Mideas standard)\n`;
    code += `    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0\n`;
    code += `    LD DE, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)\n`;
    code += `    LD BC, 256 * 8                ; Max 256 patterns × 8 bytes\n`;
    code += `    CALL LDIRVM                   ; Use BIOS function\n`;
    code += `    RET\n\n`;

    code += `LOAD_COLOR_BANK2:\n`;
    code += `    ; Load color bank 2: same colors as other banks (Mideas standard)\n`;
    code += `    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0\n`;
    code += `    LD DE, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)\n`;
    code += `    LD BC, 256 * 8                ; Max 256 patterns × 8 bytes\n`;
    code += `    CALL LDIRVM                   ; Use BIOS function like real Mideas\n`;
    code += `    RET\n\n`;
  }

  // SCREEN SYSTEM (Only if screens exist)
  if (analysis.screenMaps.length > 0) {
    code += `INIT_SCREEN_SYSTEM:\n`;
    code += `    ; Initialize screen system for ${analysis.screenMaps.length} screens\n`;
    code += `    ; Set current screen to first one\n`;
    code += `    XOR A\n`;
    code += `    LD (current_screen_id), A\n`;
    code += `    CALL LOAD_CURRENT_SCREEN\n`;
    code += `    RET\n\n`;
  }

  // COLLISION SYSTEM (Only if collision layers detected)
  if (hasCollisionLayers) {
    code += `INIT_COLLISION_SYSTEM:\n`;
    code += `    ; Initialize collision detection system\n`;
    code += `    ; Load behavior maps for collision detection\n`;
    code += `    ; Setup collision detection variables\n`;
    code += `    RET\n\n`;
  }

  // WORLD SYSTEM (Only if worlds exist)
  if (hasWorlds) {
    code += `INIT_WORLD_SYSTEM:\n`;
    code += `    ; Initialize world system for ${analysis.worlds.length} worlds\n`;
    code += `    ; Load first world\n`;
    code += `    XOR A\n`;
    code += `    CALL LOAD_WORLD\n`;
    code += `    RET\n\n`;
  }

  // STATE UPDATE FUNCTIONS
  code += `UPDATE_CURRENT_STATE:\n`;
  code += `    ; Update current game state\n`;
  code += `    LD A, (current_flow_state)\n`;
  code += `    CP FLOW_STATE_MAIN_MENU\n`;
  code += `    JP Z, UPDATE_MAIN_MENU\n`;
  code += `    CP FLOW_STATE_GAME\n`;
  code += `    JP Z, UPDATE_GAME\n`;
  code += `    CP FLOW_STATE_GAME_OVER\n`;
  code += `    JP Z, UPDATE_GAME_OVER\n`;
  code += `    RET\n\n`;

  code += `UPDATE_MAIN_MENU:\n`;
  code += `    ; Update main menu logic\n`;
  code += `    ; Handle menu navigation\n`;
  code += `    RET\n\n`;

  code += `UPDATE_GAME:\n`;
  code += `    ; Update game logic\n`;
  if (analysis.sprites.length > 0) {
    code += `    CALL UPDATE_SPRITES       ; Update sprite system\n`;
  }
  if (hasCollisionLayers) {
    code += `    CALL UPDATE_COLLISIONS    ; Check collisions with behavior maps\n`;
  }
  code += `    RET\n\n`;

  code += `UPDATE_GAME_OVER:\n`;
  code += `    ; Update game over logic\n`;
  code += `    ; Handle game over screen\n`;
  code += `    RET\n\n`;

  // INPUT HANDLING
  code += `HANDLE_INPUT:\n`;
  code += `    ; Handle player input\n`;
  code += `    CALL GTSTCK\n`;
  code += `    LD (input_state), A\n`;
  code += `    RET\n\n`;

  // DYNAMIC UPDATE SYSTEMS
  code += `UPDATE_GAME_SYSTEMS:\n`;
  code += `    ; Update only systems that exist in this project\n`;

  if (analysis.sprites.length > 0) {
    code += `    CALL UPDATE_SPRITES       ; Project has sprites\n`;
  }

  if (hasCollisionLayers) {
    code += `    CALL UPDATE_COLLISIONS    ; Project has collision layers\n`;
  }

  if (hasWorlds) {
    code += `    CALL UPDATE_WORLD         ; Project has worlds\n`;
  }

  code += `    RET\n\n`;

  // CONDITIONAL SYSTEM FUNCTIONS
  if (analysis.sprites.length > 0) {
    code += `UPDATE_SPRITES:\n`;
    code += `    ; Update sprite positions and animations\n`;
    code += `    ; Sprite update logic here\n`;
    code += `    RET\n\n`;
  }

  if (hasCollisionLayers) {
    code += `UPDATE_COLLISIONS:\n`;
    code += `    ; Check for collisions between sprites and behavior maps\n`;
    code += `    ; Use BEHAVIOR_TABLE to access behavior data for collision detection\n`;
    code += `    ; Collision detection logic here\n`;
    code += `    RET\n\n`;
  }

  if (hasWorlds) {
    code += `UPDATE_WORLD:\n`;
    code += `    ; Update world state (entities, triggers, etc.)\n`;
    code += `    ; World update logic here\n`;
    code += `    RET\n\n`;
  }

  if (analysis.screenMaps.length > 0) {
    code += `LOAD_CURRENT_SCREEN:\n`;
    code += `    ; Load screen based on current_screen_id\n`;
    code += `    LD A, (current_screen_id)\n`;
    code += `    CP SCREEN_COUNT\n`;
    code += `    JR NC, LOAD_DEFAULT_SCREEN   ; If invalid, load default\n`;
    code += `\n`;
    code += `    ; Use SCREEN_TABLE to get pointer to screen layout\n`;
    code += `    LD HL, SCREEN_TABLE\n`;
    code += `    LD E, A\n`;
    code += `    LD D, 0\n`;
    code += `    ADD HL, DE\n`;
    code += `    ADD HL, DE                    ; HL now points to DW screen layout\n`;
    code += `    LD E, (HL)\n`;
    code += `    INC HL\n`;
    code += `    LD D, (HL)                    ; DE = address of screen layout\n`;
    code += `\n`;
    code += `    ; Copy screen layout to VRAM Name Table at #1800\n`;
    code += `    EX DE, HL                     ; HL = screen layout address\n`;
    code += `    LD DE, #1800                  ; Destination: Name Table\n`;
    code += `    LD BC, 768                    ; 32x24 = 768 bytes\n`;
    code += `    CALL COPY_TO_VRAM             ; Reuse existing VRAM copy function\n`;
    code += `    RET\n`;
    code += `\n`;
    code += `LOAD_DEFAULT_SCREEN:\n`;
    code += `    ; Clear Name Table with zeros if screen ID is invalid\n`;
    code += `    LD DE, #1800                  ; VRAM Name Table address\n`;
    code += `    LD BC, 768                    ; 32x24 = 768 bytes\n`;
    code += `    XOR A                         ; Fill with zeros\n`;
    code += `CLEAR_NAME_TABLE_LOOP:\n`;
    code += `    ; Set VRAM write address\n`;
    code += `    LD A, E\n`;
    code += `    OUT (#99), A\n`;
    code += `    LD A, D\n`;
    code += `    OR #40\n`;
    code += `    OUT (#99), A\n`;
    code += `    ; Write zero\n`;
    code += `    XOR A\n`;
    code += `    OUT (#98), A\n`;
    code += `    ; Increment address\n`;
    code += `    INC DE\n`;
    code += `    DEC BC\n`;
    code += `    LD A, B\n`;
    code += `    OR C\n`;
    code += `    JR NZ, CLEAR_NAME_TABLE_LOOP\n`;
    code += `    RET\n\n`;
  }

  if (hasWorlds) {
    code += `LOAD_WORLD:\n`;
    code += `    ; Load world A\n`;
    code += `    ; World loading logic here\n`;
    code += `    RET\n\n`;
  }

  // UTILITY FUNCTIONS (Only if needed)
  if (analysis.sprites.length > 0 || analysis.tiles.length > 0 || hasWorlds || hasCollisionLayers) {
    code += `COPY_TO_VRAM:\n`;
    code += `    ; Copy BC bytes from HL to VRAM address DE\n`;
    code += `    ; Set VRAM write address\n`;
    code += `    LD A, E\n`;
    code += `    OUT (#99), A\n`;
    code += `    LD A, D\n`;
    code += `    OR #40\n`;
    code += `    OUT (#99), A\n`;
    code += `COPY_LOOP:\n`;
    code += `    LD A, (HL)\n`;
    code += `    OUT (#98), A\n`;
    code += `    INC HL\n`;
    code += `    DEC BC\n`;
    code += `    LD A, B\n`;
    code += `    OR C\n`;
    code += `    JR NZ, COPY_LOOP\n`;
    code += `    RET\n\n`;
  }

  code += `RENDER_FRAME:\n`;
  code += `    ; Render current frame\n`;
  code += `    ; Frame rendering logic here\n`;
  code += `    RET\n\n`;

  // Apply post-processing to fix common issues
  console.log('🔄 Applying ASM post-processing...');
  const processedCode = postProcessASM(code);

  return processedCode;
}