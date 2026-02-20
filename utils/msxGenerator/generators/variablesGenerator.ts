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
  code += `input_state         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current direction state (0-8)\n`;
  currentAddress++;

  code += `prev_input_state    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous direction state (0-8)\n`;
  currentAddress++;

  code += `input_btn_curr      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current input buttons bitmask (bit0=fire)\n`;
  currentAddress++;

  code += `input_btn_prev      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous input buttons bitmask (bit0=fire)\n`;
  currentAddress++;

  code += `input_fire          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Fire button state (0=released, 1=pressed)\n`;
  currentAddress++;

  code += `current_flow_state  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current game flow state\n`;
  currentAddress++;

  code += `prev_flow_state     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous game flow state\n`;
  currentAddress++;

  // GameFlow runtime variables (must live in RAM)
  code += `gameflow_exit_requested EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Exit flag for WorldLink loop\n`;
  currentAddress++;
  code += `gameflow_menu_selection EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current/last submenu selection\n`;
  currentAddress++;
  code += `gameflow_submenu_data_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Pointer to active submenu data (16-bit)\n`;
  currentAddress += 2;
  code += `gameflow_submenu_option_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached submenu option count\n`;
  currentAddress++;
  code += `gameflow_submenu_cursor_enabled EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when submenu uses sprite cursor\n`;
  currentAddress++;
  code += `gameflow_submenu_cursor_layer_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cursor sprite layer count (1..4)\n`;
  currentAddress++;
  code += `gameflow_condition_result EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Result of last condition evaluation\n`;
  currentAddress++;
  code += `transition_delay_var    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames per step for active transition effect\n`;
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

  // System variables
  code += `
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`;
  code += `ROM_slot            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; ROM slot number (for SETPAGES32K)\n`;
  currentAddress++;

  code += `frame_counter       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame counter (16-bit)\n`;
  currentAddress += 2;

  // Screen map pointers
  code += `
; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
`;
  code += `current_screen_layout   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Pointer to current screen layout data (16-bit)\n`;
  currentAddress += 2;
  code += `current_behavior_map    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Pointer to current behavior map data (16-bit)\n`;
  currentAddress += 2;
  code += `behavior_cache_row     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached behavior row (255=invalid)\n`;
  currentAddress++;
  code += `behavior_cache_map_l   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached behavior map pointer low byte\n`;
  currentAddress++;
  code += `behavior_cache_map_h   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached behavior map pointer high byte\n`;
  currentAddress++;
  code += `behavior_cache_row_base EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached row base address in behavior map (16-bit)\n`;
  currentAddress += 2;

  // Viewport/Camera variables (for scroll system)
  code += `
; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
`;
  code += `camera_x            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Camera X position in pixels (16-bit)\n`;
  currentAddress += 2;
  code += `camera_y            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Camera Y position in pixels (16-bit)\n`;
  currentAddress += 2;
  code += `camera_tile_x       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Camera tile X (column)\n`;
  currentAddress++;
  code += `camera_tile_y       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Camera tile Y (row)\n`;
  currentAddress++;
  code += `world_width_tiles   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; World width in tiles\n`;
  currentAddress++;
  code += `world_height_tiles  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; World height in tiles\n`;
  currentAddress++;
  code += `scroll_dirty_flag   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=viewport changed, needs redraw\n`;
  currentAddress++;

  code += `hud_dirty_flag      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=HUD needs redraw, 0=clean\n`;
  currentAddress++;

  // Animated tiles variables
  code += `
; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
`;
  code += `anim_tile_timer     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Animation frame timer\n`;
  currentAddress++;
  code += `anim_tile_frame     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current animation frame (0-3)\n`;
  currentAddress++;
  code += `anim_tile_speed     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames between animation updates\n`;
  currentAddress++;

  // Particle system variables
  code += `
; ==================================================================
; PARTICLE SYSTEM VARIABLES
; ==================================================================
`;
  code += `particle_pool       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Particle pool (8 particles * 8 bytes = 64 bytes)\n`;
  currentAddress += 64;  // 8 particles * 8 bytes each

  // Entity system variables (MAX_ENTITIES = 32)
  code += `
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`;

  code += `entity_active       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity active flags (32 bytes, 0=inactive, 1=active)\n`;
  currentAddress += 32;

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

  code += `entity_comp_masks_hi EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity component masks high byte (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_screen_id    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity screen ID (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_dir_mask     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity direction mask (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_health       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity health (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_anim_frame   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity animation frame (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_anim_tick    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity animation tick counter (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_anim_speed   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity animation speed (ticks per frame) (32 bytes)\n`;
  currentAddress += 32;

  code += `entity_anim_flags   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity animation flags (32 bytes)\n`;
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

  code += `entity_lifetime     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)\n`;
  currentAddress += 32;

  code += `entity_carried_by   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity carrier ID (32 bytes, 255=not carried)\n`;
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
  // entity_sprite_asset_index must be in RAM (writable) for CHANGE_SPRITE action
  code += `entity_sprite_asset_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity sprite asset index - RAM copy (32 bytes)\n`;
  currentAddress += 32;

  code += `active_sprite_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of sprites currently active\n`;
  currentAddress++;

  code += `sprites_dirty      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=sprite_attributes changed, needs VRAM sync\n`;
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

    code += `screen_transition_cooldown EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cooldown frames after screen transition\n`;
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

  code += `temp_byte_8         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_9         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_10        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_11        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_12        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_13        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_14        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_15        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_16        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_17        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_18        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_19        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_20        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_21        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_22        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_23        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_byte_24        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
  currentAddress += 32;

  code += `temp_word_3         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage (64 bytes)\n`;
  currentAddress += 64;

  code += `temp_word_4         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage (64 bytes)\n`;
  currentAddress += 64;

  // Wall collision scratch variables
  code += `\n; Wall collision temporary variables\n`;
  code += `wall_temp_x         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached entity X for wall checks\n`;
  currentAddress++;
  code += `wall_temp_y         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached entity Y for wall checks\n`;
  currentAddress++;

  // Frame-local compact entity list (non-zero component masks)
  code += `\n; Unified update helpers\n`;
  code += `active_entity_list  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)\n`;
  currentAddress += 32;
  code += `active_entity_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in active_entity_list\n`;
  currentAddress++;

  // Entity-entity collision optimized system variables
  code += `\n; Entity-entity collision optimized variables\n`;
  code += `coll_list           EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active collidable entity indices (MAX_ENTITIES bytes)\n`;
  currentAddress += 32;
  code += `coll_list_count     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entities in coll_list\n`;
  currentAddress++;
  code += `coll_src_left       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Source AABB left edge (scratch)\n`;
  currentAddress++;
  code += `coll_src_right      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Source AABB right edge (scratch)\n`;
  currentAddress++;
  code += `coll_src_top        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Source AABB top edge (scratch)\n`;
  currentAddress++;
  code += `coll_src_bottom     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Source AABB bottom edge (scratch)\n`;
  currentAddress++;

  // Interrupt system variables (dynamically allocated to avoid RAM overlap)
  code += `
; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
`;
  code += `task_table              EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Task table base (8 slots x 2 bytes = 16 bytes)\n`;
  // Also define individual slots as aliases
  for (let i = 0; i < 8; i++) {
    code += `task_${i}_ptr              EQU #${(currentAddress + i * 2).toString(16).toUpperCase().padStart(4, '0')}   ; Slot ${i} pointer (2 bytes)\n`;
  }
  currentAddress += 16;  // 8 slots x 2 bytes

  code += `interrupt_system_enabled EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=disabled, 1=enabled (1 byte)\n`;
  currentAddress++;

  code += `old_htimi_hook          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Original H.TIMI hook (5 bytes)\n`;
  currentAddress += 5;

  code += `interrupt_counter       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame counter (16-bit)\n`;
  currentAddress += 2;

  code += `task_exec_time          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cycles used by tasks (16-bit, debug)\n`;
  currentAddress += 2;

  code += `vblank_flag             EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Set to 1 on each VBlank (1 byte)\n`;
  currentAddress++;

  code += `RAM_INTERRUPT_END       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; End of interrupt system\n`;

  // End marker
  code += `
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; End of project variables (${currentAddress - 0xC000} bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#${currentAddress.toString(16).toUpperCase().padStart(4, '0')}: Project variables (${currentAddress - 0xC000} bytes)
;   #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}-#F37F: Free RAM (~${0xF380 - currentAddress} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================
`;

  return code;
}
