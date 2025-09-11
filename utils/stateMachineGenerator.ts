/**
 * @fileoverview State Machine Generator for MSX Projects
 * Generates project-specific state machine assembly code based on current project assets
 */

import { ProjectAsset, EntityInstance, ComponentDefinition, EntityTemplate } from '../types';
import { generateAsmFileHeader, getFormattedDate } from './projectUtils';
import { CodeGenerationOptions, DEFAULT_CODE_OPTIONS } from './z80CodeGenerator';

export interface StateMachineConfig {
  /** Custom states for the specific project */
  customStates: string[];
  /** Whether to integrate with ECS system */
  useECS: boolean;
  /** Whether to include menu system */
  includeMenu: boolean;
  /** Whether to include loading screens */
  includeLoading: boolean;
  /** Project-specific memory addresses */
  memoryLayout: {
    stateVariable: number;
    timerVariable: number;
    inputVariable: number;
  };
}

export const DEFAULT_STATE_MACHINE_CONFIG: StateMachineConfig = {
  customStates: [],
  useECS: false,
  includeMenu: true,
  includeLoading: true,
  memoryLayout: {
    stateVariable: 0xC000,
    timerVariable: 0xC001,
    inputVariable: 0xC003
  }
};

/**
 * Analyzes project assets to determine optimal state machine configuration
 */
export function analyzeProjectForStateMachine(assets: ProjectAsset[]): StateMachineConfig {
  const config = { ...DEFAULT_STATE_MACHINE_CONFIG };
  
  // Check if project uses ECS
  const hasComponents = assets.some(asset => asset.type === 'componentdefinition');
  const hasEntities = assets.some(asset => asset.type === 'entitytemplate');
  config.useECS = hasComponents && hasEntities;
  
  // Detect custom states based on project content
  const screenMaps = assets.filter(asset => asset.type === 'screenmap');
  const customStates: string[] = [];
  
  // Add states for multiple levels/screens
  if (screenMaps.length > 1) {
    customStates.push('STATE_LEVEL_TRANSITION');
  }
  
  // Check for special screens
  const hasMenuScreen = screenMaps.some(screen => 
    screen.name.toLowerCase().includes('menu') || 
    screen.name.toLowerCase().includes('title')
  );
  if (hasMenuScreen) {
    config.includeMenu = true;
  }
  
  // Check for boss or special areas
  const hasBossScreen = screenMaps.some(screen => 
    screen.name.toLowerCase().includes('boss') || 
    screen.name.toLowerCase().includes('final')
  );
  if (hasBossScreen) {
    customStates.push('STATE_BOSS_BATTLE');
  }
  
  // Check for cutscenes or story elements
  const hasCutsceneElements = assets.some(asset => 
    asset.name.toLowerCase().includes('cutscene') ||
    asset.name.toLowerCase().includes('story') ||
    asset.name.toLowerCase().includes('intro')
  );
  if (hasCutsceneElements) {
    customStates.push('STATE_CUTSCENE');
  }
  
  config.customStates = customStates;
  return config;
}

/**
 * Generates complete state machine assembly code for a specific project
 */
export function generateProjectStateMachine(
  projectName: string,
  assets: ProjectAsset[],
  config: StateMachineConfig = DEFAULT_STATE_MACHINE_CONFIG,
  options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS
): string {
  const formattedDate = getFormattedDate();
  const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_state_machine.asm`;
  
  let code = generateAsmFileHeader(projectName, formattedDate, filename);
  
  // Include necessary dependencies
  code += generateIncludes(config);
  
  // Generate state definitions
  code += generateStateDefinitions(config);
  
  // Generate memory layout
  code += generateMemoryLayout(config);
  
  // Generate core state machine system
  code += generateStateMachineCore(config, assets);
  
  // Generate jump table
  code += generateJumpTable(config);
  
  // Generate state logic routines
  code += generateStateLogicRoutines(config, assets, options);
  
  // Generate project-specific helper functions
  code += generateProjectHelpers(config, assets);
  
  // Generate data section
  code += generateDataSection(config);
  
  return code;
}

function generateIncludes(config: StateMachineConfig): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; INCLUDES\n';
  code += '; ==================================================\n\n';
  
  code += 'INCLUDE "constants.asm"\n';
  
  if (config.useECS) {
    code += 'INCLUDE "ecs_memory_manager.asm"\n';
    code += 'INCLUDE "ecs_entity_system.asm"\n';
    code += 'INCLUDE "ecs_component_registry.asm"\n';
    code += 'INCLUDE "ecs_systems.asm"\n';
  }
  
  code += '\n';
  return code;
}

function generateStateDefinitions(config: StateMachineConfig): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; STATE DEFINITIONS\n';
  code += '; ==================================================\n\n';
  
  // Core states
  const coreStates = [
    'STATE_PLAYING',
    'STATE_DYING', 
    'STATE_PAUSED'
  ];
  
  const optionalStates = [];
  if (config.includeMenu) {
    optionalStates.push('STATE_MENU');
    optionalStates.push('STATE_GAMEOVER');
  }
  if (config.includeLoading) {
    optionalStates.push('STATE_LOADING');
  }
  
  const allStates = [...coreStates, ...optionalStates, ...config.customStates];
  
  allStates.forEach((state, index) => {
    code += `${state.padEnd(25)} EQU ${index}\n`;
  });
  
  code += `MAX_STATES${' '.repeat(17)} EQU ${allStates.length}\n\n`;
  
  return code;
}

function generateMemoryLayout(config: StateMachineConfig): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; MEMORY LAYOUT\n';
  code += '; ==================================================\n\n';
  
  code += `current_game_state      EQU #${config.memoryLayout.stateVariable.toString(16).toUpperCase()}\n`;
  code += `state_timer            EQU #${config.memoryLayout.timerVariable.toString(16).toUpperCase()}\n`;
  code += `input_state            EQU #${config.memoryLayout.inputVariable.toString(16).toUpperCase()}\n`;
  code += `prev_input_state       EQU #${(config.memoryLayout.inputVariable + 1).toString(16).toUpperCase()}\n`;
  code += `player_lives          EQU #${(config.memoryLayout.inputVariable + 2).toString(16).toUpperCase()}\n`;
  code += `original_vblank       EQU #${(config.memoryLayout.inputVariable + 3).toString(16).toUpperCase()}\n\n`;
  
  return code;
}

function generateStateMachineCore(config: StateMachineConfig, assets: ProjectAsset[]): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; STATE MACHINE CORE SYSTEM\n';
  code += '; ==================================================\n\n';
  
  // Initialize state machine
  code += 'INIT_STATE_MACHINE:\n';
  code += '    DI\n';
  code += '    \n';
  code += '    ; Save original V-Blank routine\n';
  code += '    LD HL, (TIMI)\n';
  code += '    LD (original_vblank), HL\n';
  code += '    \n';
  code += '    ; Set initial game state\n';
  if (config.includeMenu) {
    code += '    LD A, STATE_MENU\n';
  } else {
    code += '    LD A, STATE_PLAYING\n';
  }
  code += '    LD (current_game_state), A\n';
  code += '    \n';
  code += '    ; Initialize timers\n';
  code += '    XOR A\n';
  code += '    LD (state_timer), A\n';
  code += '    LD (state_timer+1), A\n';
  code += '    \n';
  code += '    ; Install V-Blank handler\n';
  code += '    LD HL, vblank_isr\n';
  code += '    LD (TIMI), HL\n';
  code += '    \n';
  code += '    EI\n';
  code += '    RET\n\n';
  
  // V-Blank ISR
  code += 'vblank_isr:\n';
  code += '    PUSH AF\n';
  code += '    PUSH BC\n';
  code += '    PUSH DE\n';
  code += '    PUSH HL\n';
  code += '    PUSH IX\n';
  code += '    PUSH IY\n';
  code += '    \n';
  code += '    CALL GAME_LOGIC_DISPATCHER\n';
  code += '    \n';
  code += '    ; Increment state timer\n';
  code += '    LD HL, state_timer\n';
  code += '    INC (HL)\n';
  code += '    JR NZ, vblank_skip_high\n';
  code += '    INC HL\n';
  code += '    INC (HL)\n';
  code += 'vblank_skip_high:\n';
  code += '    \n';
  code += '    POP IY\n';
  code += '    POP IX\n';
  code += '    POP HL\n';
  code += '    POP DE\n';
  code += '    POP BC\n';
  code += '    POP AF\n';
  code += '    \n';
  code += '    EI\n';
  code += '    RETI\n\n';
  
  // Dispatcher
  code += 'GAME_LOGIC_DISPATCHER:\n';
  code += '    LD A, (current_game_state)\n';
  code += '    CP MAX_STATES\n';
  code += '    JR NC, dispatch_error\n';
  code += '    \n';
  code += '    ; Calculate jump table index\n';
  code += '    LD L, A\n';
  code += '    LD H, 0\n';
  code += '    ADD HL, HL\n';
  code += '    \n';
  code += '    ; Add jump table base\n';
  code += '    LD DE, jump_table\n';
  code += '    ADD HL, DE\n';
  code += '    \n';
  code += '    ; Jump to state routine\n';
  code += '    LD E, (HL)\n';
  code += '    INC HL\n';
  code += '    LD D, (HL)\n';
  code += '    PUSH DE\n';
  code += '    RET\n';
  code += '\n';
  code += 'dispatch_error:\n';
  if (config.includeMenu) {
    code += '    LD A, STATE_MENU\n';
  } else {
    code += '    LD A, STATE_PLAYING\n';
  }
  code += '    LD (current_game_state), A\n';
  code += '    RET\n\n';
  
  return code;
}

function generateJumpTable(config: StateMachineConfig): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; JUMP TABLE\n';
  code += '; ==================================================\n\n';
  
  code += 'jump_table:\n';
  
  const coreStates = [
    { name: 'STATE_PLAYING', routine: 'logic_playing' },
    { name: 'STATE_DYING', routine: 'logic_dying' },
    { name: 'STATE_PAUSED', routine: 'logic_paused' }
  ];
  
  const optionalStates = [];
  if (config.includeMenu) {
    optionalStates.push(
      { name: 'STATE_MENU', routine: 'logic_menu' },
      { name: 'STATE_GAMEOVER', routine: 'logic_gameover' }
    );
  }
  if (config.includeLoading) {
    optionalStates.push({ name: 'STATE_LOADING', routine: 'logic_loading' });
  }
  
  // Add custom states
  const customStateRoutines = config.customStates.map(state => ({
    name: state,
    routine: `logic_${state.toLowerCase().replace('state_', '')}`
  }));
  
  const allStates = [...coreStates, ...optionalStates, ...customStateRoutines];
  
  allStates.forEach(state => {
    code += `    DEFW ${state.routine.padEnd(20)} ; ${state.name}\n`;
  });
  
  code += '\n';
  return code;
}

function generateStateLogicRoutines(config: StateMachineConfig, assets: ProjectAsset[], options: CodeGenerationOptions): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; STATE LOGIC ROUTINES\n';
  code += '; ==================================================\n\n';
  
  // Generate core state routines
  code += generatePlayingStateLogic(config, assets);
  code += generateDyingStateLogic(config);
  code += generatePausedStateLogic(config);
  
  if (config.includeMenu) {
    code += generateMenuStateLogic(config);
    code += generateGameOverStateLogic(config);
  }
  
  if (config.includeLoading) {
    code += generateLoadingStateLogic(config, assets);
  }
  
  // Generate custom state routines
  config.customStates.forEach(state => {
    const routineName = `logic_${state.toLowerCase().replace('state_', '')}`;
    code += generateCustomStateLogic(state, routineName, config, assets);
  });
  
  return code;
}

function generatePlayingStateLogic(config: StateMachineConfig, assets: ProjectAsset[]): string {
  let code = '';
  
  code += 'logic_playing:\n';
  code += '    ; Read input\n';
  code += '    CALL READ_INPUT_STATE\n';
  code += '    \n';
  
  if (config.useECS) {
    code += '    ; Update ECS systems\n';
    code += '    CALL UPDATE_ALL_SYSTEMS\n';
    code += '    \n';
  } else {
    code += '    ; Update game entities\n';
    code += '    CALL UPDATE_GAME_ENTITIES\n';
    code += '    \n';
  }
  
  code += '    ; Update sprites and graphics\n';
  code += '    CALL UPDATE_SPRITES\n';
  code += '    \n';
  code += '    ; Check for pause input\n';
  code += '    LD A, (input_state)\n';
  code += '    BIT 6, A                    ; Pause key\n';
  code += '    JR Z, playing_no_pause\n';
  code += '    \n';
  code += '    LD A, (prev_input_state)\n';
  code += '    BIT 6, A\n';
  code += '    JR NZ, playing_no_pause\n';
  code += '    \n';
  code += '    LD A, STATE_PAUSED\n';
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    RET\n';
  code += '\n';
  code += 'playing_no_pause:\n';
  code += '    ; Check player status\n';
  code += '    CALL CHECK_PLAYER_STATUS\n';
  code += '    RET\n\n';
  
  return code;
}

function generateDyingStateLogic(config: StateMachineConfig): string {
  let code = '';
  
  code += 'logic_dying:\n';
  code += '    ; Update death animation\n';
  code += '    CALL UPDATE_DEATH_ANIMATION\n';
  code += '    \n';
  code += '    ; Check death timer\n';
  code += '    LD A, (state_timer)\n';
  code += '    CP 180                      ; 3 seconds\n';
  code += '    JR C, dying_continue\n';
  code += '    \n';
  code += '    ; Check remaining lives\n';
  code += '    LD A, (player_lives)\n';
  code += '    OR A\n';
  code += '    JR Z, dying_game_over\n';
  code += '    \n';
  code += '    ; Respawn player\n';
  code += '    DEC A\n';
  code += '    LD (player_lives), A\n';
  code += '    LD A, STATE_PLAYING\n';
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    CALL RESPAWN_PLAYER\n';
  code += '    RET\n';
  code += '\n';
  code += 'dying_game_over:\n';
  if (config.includeMenu) {
    code += '    LD A, STATE_GAMEOVER\n';
  } else {
    code += '    LD A, STATE_MENU\n';
  }
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    RET\n';
  code += '\n';
  code += 'dying_continue:\n';
  code += '    RET\n\n';
  
  return code;
}

function generatePausedStateLogic(config: StateMachineConfig): string {
  let code = '';
  
  code += 'logic_paused:\n';
  code += '    CALL DISPLAY_PAUSE_MESSAGE\n';
  code += '    \n';
  code += '    CALL READ_INPUT_STATE\n';
  code += '    LD A, (input_state)\n';
  code += '    BIT 6, A                    ; Pause key\n';
  code += '    JR Z, paused_continue\n';
  code += '    \n';
  code += '    LD A, (prev_input_state)\n';
  code += '    BIT 6, A\n';
  code += '    JR NZ, paused_continue\n';
  code += '    \n';
  code += '    LD A, STATE_PLAYING\n';
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    CALL CLEAR_PAUSE_MESSAGE\n';
  code += '    \n';
  code += 'paused_continue:\n';
  code += '    RET\n\n';
  
  return code;
}

function generateMenuStateLogic(config: StateMachineConfig): string {
  let code = '';
  
  code += 'logic_menu:\n';
  code += '    CALL UPDATE_MENU_GRAPHICS\n';
  code += '    CALL READ_INPUT_STATE\n';
  code += '    \n';
  code += '    ; Check for start game\n';
  code += '    LD A, (input_state)\n';
  code += '    BIT 4, A                    ; Fire button\n';
  code += '    JR Z, menu_no_start\n';
  code += '    \n';
  code += '    LD A, (prev_input_state)\n';
  code += '    BIT 4, A\n';
  code += '    JR NZ, menu_no_start\n';
  code += '    \n';
  if (config.includeLoading) {
    code += '    LD A, STATE_LOADING\n';
  } else {
    code += '    LD A, STATE_PLAYING\n';
  }
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    RET\n';
  code += '\n';
  code += 'menu_no_start:\n';
  code += '    RET\n\n';
  
  return code;
}

function generateGameOverStateLogic(config: StateMachineConfig): string {
  let code = '';
  
  code += 'logic_gameover:\n';
  code += '    CALL UPDATE_GAMEOVER_SCREEN\n';
  code += '    \n';
  code += '    CALL READ_INPUT_STATE\n';
  code += '    LD A, (input_state)\n';
  code += '    BIT 4, A                    ; Fire button\n';
  code += '    JR Z, gameover_continue\n';
  code += '    \n';
  code += '    LD A, (prev_input_state)\n';
  code += '    BIT 4, A\n';
  code += '    JR NZ, gameover_continue\n';
  code += '    \n';
  code += '    LD A, STATE_MENU\n';
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    CALL RESET_GAME_DATA\n';
  code += '    \n';
  code += 'gameover_continue:\n';
  code += '    RET\n\n';
  
  return code;
}

function generateLoadingStateLogic(config: StateMachineConfig, assets: ProjectAsset[]): string {
  let code = '';
  
  code += 'logic_loading:\n';
  code += '    CALL UPDATE_LOADING_SCREEN\n';
  code += '    \n';
  code += '    LD A, (state_timer)\n';
  code += '    CP 120                      ; 2 seconds loading\n';
  code += '    JR C, loading_continue\n';
  code += '    \n';
  code += '    LD A, STATE_PLAYING\n';
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    CALL INIT_GAME_LEVEL\n';
  code += '    \n';
  code += 'loading_continue:\n';
  code += '    RET\n\n';
  
  return code;
}

function generateCustomStateLogic(stateName: string, routineName: string, config: StateMachineConfig, assets: ProjectAsset[]): string {
  let code = '';
  
  code += `${routineName}:\n`;
  code += `    ; Custom logic for ${stateName}\n`;
  code += '    ; TODO: Implement custom state logic here\n';
  code += '    \n';
  code += '    ; Example: Return to playing state after timer\n';
  code += '    LD A, (state_timer)\n';
  code += '    CP 120                      ; 2 seconds\n';
  code += '    JR C, custom_continue\n';
  code += '    \n';
  code += '    LD A, STATE_PLAYING\n';
  code += '    CALL CHANGE_GAME_STATE\n';
  code += '    \n';
  code += 'custom_continue:\n';
  code += '    RET\n\n';
  
  return code;
}

function generateProjectHelpers(config: StateMachineConfig, assets: ProjectAsset[]): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; HELPER FUNCTIONS\n';
  code += '; ==================================================\n\n';
  
  // Change state helper
  code += 'CHANGE_GAME_STATE:\n';
  code += '    LD (current_game_state), A\n';
  code += '    CALL RESET_STATE_TIMER\n';
  code += '    RET\n\n';
  
  // Reset timer helper
  code += 'RESET_STATE_TIMER:\n';
  code += '    XOR A\n';
  code += '    LD (state_timer), A\n';
  code += '    LD (state_timer+1), A\n';
  code += '    RET\n\n';
  
  // Get current state helper
  code += 'GET_CURRENT_STATE:\n';
  code += '    LD A, (current_game_state)\n';
  code += '    RET\n\n';
  
  // Stub functions that need to be implemented
  code += '; ==================================================\n';
  code += '; STUB FUNCTIONS - IMPLEMENT THESE FOR YOUR PROJECT\n';
  code += '; ==================================================\n\n';
  
  const stubFunctions = [
    'READ_INPUT_STATE',
    'UPDATE_GAME_ENTITIES', 
    'UPDATE_SPRITES',
    'CHECK_PLAYER_STATUS',
    'UPDATE_DEATH_ANIMATION',
    'RESPAWN_PLAYER',
    'DISPLAY_PAUSE_MESSAGE',
    'CLEAR_PAUSE_MESSAGE',
    'UPDATE_MENU_GRAPHICS',
    'UPDATE_GAMEOVER_SCREEN',
    'UPDATE_LOADING_SCREEN',
    'INIT_GAME_LEVEL',
    'RESET_GAME_DATA'
  ];
  
  if (config.useECS) {
    stubFunctions.push('UPDATE_ALL_SYSTEMS');
  }
  
  stubFunctions.forEach(funcName => {
    code += `${funcName}:\n`;
    code += '    ; TODO: Implement this function\n';
    code += '    RET\n\n';
  });
  
  return code;
}

function generateDataSection(config: StateMachineConfig): string {
  let code = '';
  
  code += '; ==================================================\n';
  code += '; DATA SECTION\n';
  code += '; ==================================================\n\n';
  
  code += '; State machine variables are defined in memory layout section\n';
  code += '; Additional game data can be added here\n\n';
  
  return code;
}