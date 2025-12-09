/**
 * @fileoverview Variables Generator - RAM variable definitions
 * Generates variables.asm with dynamic variable allocation using EQU addresses
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Generate RAM variables with EQU addresses (variables.asm)
 *
 * @param analysis - Project analysis with detected assets and entities
 * @returns ASM code string with variable definitions
 */
export function generateVariablesFile(analysis: ProjectAnalysis): string {
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

  // Mideas Global Variables Dictionary (from project + defaults)
  code += `
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`;

  if (analysis.globalVariables && analysis.globalVariables.length > 0) {
    // Generate variables from globalVariables array
    analysis.globalVariables.forEach(variable => {
      const size = variable.type === '16bit' ? 2 : 1;
      const sizeComment = variable.type === '16bit' ? ' (16-bit)' : ' (8-bit)';
      const description = variable.description || variable.name;

      code += `${variable.asmName.padEnd(20)} EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; ${description}${sizeComment}\n`;
      currentAddress += size;
    });
  } else {
    // Fallback: Generate only the default "goal" variable
    code += `global_var_goal     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Goal status (0=Failure, 1=Completed)\n`;
    currentAddress++;
  }

  // Frame counter (always useful)
  code += `
; ==================================================================
; FRAME COUNTER
; ==================================================================
`;
  code += `frame_counter       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame counter (16-bit)\n`;
  currentAddress += 2;

  // Entity system variables (MAX_ENTITIES = 32)
  code += `
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`;
  code += `entity_x_pos        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity X positions (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_y_pos        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity Y positions (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_vel_x        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity X velocity (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_vel_y        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity Y velocity (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_comp_masks   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity component masks (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_screen_id    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity screen ID (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_dir_mask     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity direction mask (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_health       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity health (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_anim_frame   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity animation frame (32 bytes)\n`;
  currentAddress += 32;

  // State Machine variables (SoA layout)
  code += `entity_sm_ptr_l     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity State Pointer Low (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_sm_ptr_h     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity State Pointer High (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_sm_timer_l   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity State Timer Low (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_sm_timer_h   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity State Timer High (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_sm_wait_timer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity State Wait Timer (32 bytes)\n`;
  currentAddress += 32;

  // State Machine Local Variables (8 vars per entity)
  for (let i = 0; i < 8; i++) {
    code += `entity_sm_var_${i}     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity Variable ${i} (32 bytes)\n`;
    currentAddress += 32;
  }

  // Sprite system variables (mapped to entities for now, or separate)
  // For Mideas, we'll map sprite indices 1:1 with entity indices for simplicity
  code += `
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`;
  code += `active_sprite_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of sprites currently active\n`;
  currentAddress++;

  code += `sprite_pattern      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite pattern IDs (32 bytes)\n`;
  currentAddress += 32;

  code += `sprite_color        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite colors (32 bytes)\n`;
  currentAddress += 32;

  // Interleaved sprite attribute buffer (Y, X, Pattern, Color per sprite)
  code += `sprite_attributes   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Interleaved sprite attributes (32 * 4 bytes)\n`;
  currentAddress += 32 * 4;


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

    // WorldMap system variables
    code += `current_world_id    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current world ID (for multi-world support)\n`;
    currentAddress++;

    code += `current_screen_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current screen index within world\n`;
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

  // aux variables
  code += `
; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
  deterministic        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Deterministic mode flag\n`;
  currentAddress++;
  


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

  code += `temp_byte_3         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_4         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_5         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_6         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_7         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_word_3         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage (64 bytes)\n`;
  currentAddress += 64;

  code += `temp_word_4         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage (64 bytes)\n`;
  currentAddress += 64;

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
