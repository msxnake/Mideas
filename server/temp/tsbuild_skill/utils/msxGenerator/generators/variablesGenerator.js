"use strict";
/**
 * @fileoverview Variables Generator - RAM variable definitions
 * Generates variables.asm with dynamic variable allocation using EQU addresses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVariablesFile = generateVariablesFile;
/**
 * Generate RAM variables with EQU addresses (variables.asm)
 *
 * @param analysis - Project analysis with detected assets and entities
 * @returns ASM code string with variable definitions
 */
function generateVariablesFile(analysis) {
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
            const variableType = String(variable.type || '').toLowerCase();
            const isWord = variableType === '16bit' || variableType === 'word';
            const size = isWord ? 2 : 1;
            const sizeComment = isWord ? ' (16-bit)' : ' (8-bit)';
            const description = variable.description || variable.name;
            code += `${variable.asmName.padEnd(20)} EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; ${description}${sizeComment}\n`;
            currentAddress += size;
        });
    }
    else {
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
    code += `mapper_bank_p1_current EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper current bank for page/window 1\n`;
    currentAddress++;
    code += `mapper_bank_p2_current EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper current bank for page/window 2\n`;
    currentAddress++;
    code += `mapper_bank_p3_current EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper current bank for page/window 3\n`;
    currentAddress++;
    code += `mapper_bank_p4_current EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper current bank for page/window 4\n`;
    currentAddress++;
    code += `mapper_saved_bank    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Saved mapper bank for push/pop helpers\n`;
    currentAddress++;
    code += `mapper_saved_bank_p1 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Saved mapper bank for page/window 1 helpers\n`;
    currentAddress++;
    code += `mapper_saved_bank_p3 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Saved mapper bank for page/window 3 helpers\n`;
    currentAddress++;
    code += `mapper_saved_bank_p4 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Saved mapper bank for page/window 4 helpers\n`;
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
    code += `current_screen_layout_bank EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper bank for current screen layout data\n`;
    currentAddress++;
    code += `current_behavior_map    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Pointer to current behavior map data (16-bit)\n`;
    currentAddress += 2;
    code += `current_behavior_map_bank EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper bank for current behavior map data\n`;
    currentAddress++;
    code += `behavior_cache_row     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached behavior row (255=invalid)\n`;
    currentAddress++;
    code += `behavior_cache_map_l   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached behavior map pointer low byte\n`;
    currentAddress++;
    code += `behavior_cache_map_h   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached behavior map pointer high byte\n`;
    currentAddress++;
    code += `behavior_cache_row_base EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached row base address in behavior map (16-bit)\n`;
    currentAddress += 2;
    code += `RUNTIME_SCREEN_MAP_SIZE EQU 768\n`;
    code += `runtime_screen_layout  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current screen layout (32x24)\n`;
    currentAddress += 768;
    code += `runtime_behavior_map   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current behavior map (32x24)\n`;
    currentAddress += 768;
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
    code += `anim_tile_transform_flags EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime flags for transform-mode tile animation (byte0=flags, byte1=opcode scratch)\r\n`;
    currentAddress += 2;
    code += `anim_tile_row_buffer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temp buffer (8 bytes) for row transforms\n`;
    currentAddress += 8;
    // Particle system variables
    code += `
; ==================================================================
; PARTICLE SYSTEM VARIABLES
; ==================================================================
`;
    code += `particle_pool       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Particle pool (8 particles * 8 bytes = 64 bytes)\n`;
    currentAddress += 64; // 8 particles * 8 bytes each
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
    code += `entity_job_period   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)\n`;
    currentAddress += 32;
    code += `entity_job_entry    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity job entry slot within period window (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_job_scheduler_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when any entity uses non-default job cadence\n`;
    currentAddress++;
    code += `entity_dir_mask     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity direction mask (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_input_speed  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity input/cursor speed (32 bytes)\n`;
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
    code += `entity_template_token EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity template token (32 bytes, 0=unknown)\n`;
    currentAddress += 32;
    code += `entity_facing_dir   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)\n`;
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
    code += `sprite_layer_colors EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)\n`;
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
        code += `gem_count           EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Collectible tile counter (8-bit)\n`;
        currentAddress++;
        code += `last_gem_char       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Char code of last collected gem tile (for SM VARIABLE_COMPARE)\n`;
        currentAddress++;
        code += `\n; Persistent collectibles list (survives screen re-entry)\n`;
        code += `MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records\n`;
        code += `collected_count      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of collected tiles recorded (8-bit)\n`;
        currentAddress++;
        code += `collected_world      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)\n`;
        currentAddress += 64;
        code += `collected_screen     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)\n`;
        currentAddress += 64;
        code += `collected_idx_l      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)\n`;
        currentAddress += 64;
        code += `collected_idx_h      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)\n`;
        currentAddress += 64;
        code += `\n; Timed bonus tile respawn slots (bonus gem regeneration)\n`;
        code += `MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn\n`;
        code += `bonus_respawn_world  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)\n`;
        currentAddress += 16;
        code += `bonus_respawn_screen EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)\n`;
        currentAddress += 16;
        code += `bonus_respawn_idx_l  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)\n`;
        currentAddress += 16;
        code += `bonus_respawn_idx_h  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)\n`;
        currentAddress += 16;
        code += `bonus_respawn_secs   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)\n`;
        currentAddress += 16;
        code += `bonus_respawn_frames EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)\n`;
        currentAddress += 16;
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
    // Sound system variables
    code += `
; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
`;
    code += `sfx_active          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=no SFX active, 1=playing\n`;
    currentAddress++;
    code += `sfx_timer           EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames remaining for current SFX\n`;
    currentAddress++;
    code += `sfx_fadeout         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Reserved fadeout flag/state\n`;
    currentAddress++;
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
    code += `temp_byte_25        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
    currentAddress += 32;
    code += `temp_word_3         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage (64 bytes)\n`;
    currentAddress += 64;
    code += `temp_word_4         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 16-bit storage (64 bytes)\n`;
    currentAddress += 64;
    code += `temp_byte_26        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
    currentAddress += 32;
    code += `temp_byte_27        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
    currentAddress += 32;
    // Wall collision scratch variables
    code += `\n; Wall collision temporary variables\n`;
    code += `wall_temp_x         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached entity X for wall checks\n`;
    currentAddress++;
    code += `wall_temp_y         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached entity Y for wall checks\n`;
    currentAddress++;
    code += `wall_hit_left       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Hitbox left edge cache\n`;
    currentAddress++;
    code += `wall_hit_top        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Hitbox top edge cache\n`;
    currentAddress++;
    code += `wall_hit_right      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Hitbox right edge cache\n`;
    currentAddress++;
    code += `wall_hit_bottom     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Hitbox bottom edge cache\n`;
    currentAddress++;
    code += `wall_hit_w          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Hitbox width cache (min 1)\n`;
    currentAddress++;
    code += `wall_hit_h          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Hitbox height cache (min 1)\n`;
    currentAddress++;
    code += `wall_probe_left     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; X probe near hitbox left (adaptive inset)\n`;
    currentAddress++;
    code += `wall_probe_right    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; X probe near hitbox right (adaptive inset)\n`;
    currentAddress++;
    code += `wall_probe_top      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Y probe near hitbox top (adaptive inset)\n`;
    currentAddress++;
    code += `wall_probe_bottom   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Y probe near hitbox bottom (adaptive inset)\n`;
    currentAddress++;
    // Frame-local compact entity list (non-zero component masks)
    code += `\n; Unified update helpers\n`;
    code += `active_entity_list  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)\n`;
    currentAddress += 32;
    code += `active_entity_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in active_entity_list\n`;
    currentAddress++;
    code += `active_entity_list_dirty EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=rebuild active_entity_list required\n`;
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
    currentAddress += 16; // 8 slots x 2 bytes
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
    code += `
; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
`;
    code += `sm_sound_active       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=idle, 1=playing state-machine sound asset\n`;
    currentAddress++;
    code += `sm_sound_frames_left  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames left for current state-machine sound asset\n`;
    currentAddress++;
    code += `sm_sound_ptr_l        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Next sound frame pointer low byte\n`;
    currentAddress++;
    code += `sm_sound_ptr_h        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Next sound frame pointer high byte\n`;
    currentAddress++;
    code += `
; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
`;
    code += `music_active         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=stopped, 1=track active\n`;
    currentAddress++;
    code += `music_muted          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=audible, 1=muted/pause\n`;
    currentAddress++;
    code += `music_loop           EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=no loop, 1=loop enabled\n`;
    currentAddress++;
    code += `music_track_index    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current ROM track index\n`;
    currentAddress++;
    code += `music_row_frames     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames per tracker row\n`;
    currentAddress++;
    code += `music_row_countdown  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Countdown to next row\n`;
    currentAddress++;
    code += `music_order_pos      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current order position\n`;
    currentAddress++;
    code += `music_pattern_index  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current pattern index\n`;
    currentAddress++;
    code += `music_pattern_row    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current row inside pattern\n`;
    currentAddress++;
    code += `music_pattern_rows   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached rows in current pattern\n`;
    currentAddress++;
    code += `music_track_ptr_l    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current track pointer low byte\n`;
    currentAddress++;
    code += `music_track_ptr_h    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current track pointer high byte\n`;
    currentAddress++;
    code += `music_pattern_ptr_l  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current pattern rows pointer low byte\n`;
    currentAddress++;
    code += `music_pattern_ptr_h  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current pattern rows pointer high byte\n`;
    currentAddress++;
    code += `music_mixer_shadow   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; PSG mixer shadow for music runtime\n`;
    currentAddress++;
    const musicArrayDefs = [
        { base: 'music_ch_note_base', prefix: 'music_ch', suffix: 'note', comment: 'Current note index (255=silent)' },
        { base: 'music_ch_instrument_base', prefix: 'music_ch', suffix: 'instrument', comment: 'Current instrument id (0=none)' },
        { base: 'music_ch_ornament_base', prefix: 'music_ch', suffix: 'ornament', comment: 'Current ornament id (0=none)' },
        { base: 'music_ch_volume_base', prefix: 'music_ch', suffix: 'volume', comment: 'Current base volume (0-15)' },
        { base: 'music_ch_vol_step_base', prefix: 'music_ch', suffix: 'vol_step', comment: 'Reserved software volume envelope step' },
        { base: 'music_ch_tone_step_base', prefix: 'music_ch', suffix: 'tone_step', comment: 'Reserved software tone envelope step' },
        { base: 'music_ch_noise_step_base', prefix: 'music_ch', suffix: 'noise_step', comment: 'Reserved software noise envelope step' },
        { base: 'music_ch_orn_step_base', prefix: 'music_ch', suffix: 'orn_step', comment: 'Reserved ornament step' },
    ];
    const musicChannelNames = ['a', 'b', 'c'];
    for (const def of musicArrayDefs) {
        const baseAddress = currentAddress;
        code += `${def.base} EQU #${baseAddress.toString(16).toUpperCase().padStart(4, '0')}   ; ${def.comment} (3 bytes)\n`;
        musicChannelNames.forEach((channelName, index) => {
            code += `${def.prefix}_${channelName}_${def.suffix} EQU #${(baseAddress + index).toString(16).toUpperCase().padStart(4, '0')}   ; Channel ${channelName.toUpperCase()}\n`;
        });
        currentAddress += 3;
    }
    // PT3 workspace (if any track uses external PT3 backend)
    const hasPT3 = Array.isArray(analysis.tracks) &&
        analysis.tracks.some((t) => t?.playbackBackend === 'external-pt3');
    if (hasPT3) {
        const pt3Base = currentAddress;
        const hex = (offset) => (pt3Base + offset).toString(16).toUpperCase().padStart(4, '0');
        code += `
; ==================================================================
; PT3 REPLAYER WORKSPACE (~448 bytes)
; Layout matches PT3-ROM-alltables-glass.asm expected labels
; ==================================================================
PT3_SETUP       EQU #${hex(0x00)}   ; PT3 state flags (bit0=loop, bit7=song_ended)
PT3_MODADDR     EQU #${hex(0x01)}   ; Module address pointer (2 bytes)
PT3_CrPsPtr     EQU #${hex(0x03)}   ; Current position pointer
PT3_SAMPTRS     EQU #${hex(0x05)}   ; Sample pointers base
PT3_OrnPtrs     EQU #${hex(0x07)}   ; Ornament pointers base
PT3_PDSP        EQU #${hex(0x09)}   ; Pattern data start pointer
PT3_CSP         EQU #${hex(0x0B)}   ; Saved SP (CHREGS SP trick)
PT3_PSP         EQU #${hex(0x0D)}   ; PT3 stack pointer save
PT3_PrNote      EQU #${hex(0x0F)}   ; Previous note
PT3_PrSlide     EQU #${hex(0x10)}   ; Previous slide (2 bytes)
PT3_AdInPtA     EQU #${hex(0x12)}   ; Channel A inline pointer
PT3_AdInPtB     EQU #${hex(0x14)}   ; Channel B inline pointer
PT3_AdInPtC     EQU #${hex(0x16)}   ; Channel C inline pointer
PT3_LPosPtr     EQU #${hex(0x18)}   ; Loop position pointer
PT3_PatsPtr     EQU #${hex(0x1A)}   ; Patterns table pointer
PT3_Delay       EQU #${hex(0x1C)}   ; Song speed/delay
PT3_AddToEn     EQU #${hex(0x1D)}   ; Add to envelope
PT3_Env_Del     EQU #${hex(0x1E)}   ; Envelope delay
PT3_ESldAdd     EQU #${hex(0x1F)}   ; Envelope slide add (2 bytes)
PT3_NTL3        EQU #${hex(0x21)}   ; Note table link 3
VARS            EQU #${hex(0x23)}   ; Channel vars base
ChanA           EQU #${hex(0x23)}   ; Channel A data (29 bytes)
ChanB           EQU #${hex(0x40)}   ; Channel B data (29 bytes)
ChanC           EQU #${hex(0x5D)}   ; Channel C data (29 bytes)
DelyCnt         EQU #${hex(0x7A)}   ; Delay counter
CurESld         EQU #${hex(0x7B)}   ; Current envelope slide (2 bytes)
CurEDel         EQU #${hex(0x7D)}   ; Current envelope delay
Ns_Base_AddToNs EQU #${hex(0x7E)}   ; Noise base + add to noise (combined)
Ns_Base         EQU #${hex(0x7E)}   ; Noise base
AddToNs         EQU #${hex(0x7F)}   ; Add to noise
NT_             EQU #${hex(0x80)}   ; Note table (192 bytes)
AYREGS          EQU #${hex(0x140)}  ; AY registers mirror (14 bytes)
VT_             EQU #${hex(0x140)}  ; Volume table base (alias for AYREGS)
EnvBase         EQU #${hex(0x14E)}  ; Envelope base
VAR0END         EQU #${hex(0x150)}  ; End of fixed workspace
T1_             EQU #${hex(0x150)}  ; Tone tables start (unpacked by PT3_INIT)
T_NEW_1         EQU #${hex(0x150)}  ; Tone table new 1
T_OLD_1         EQU #${hex(0x150)}  ; Tone table old 1
T_OLD_2         EQU #${hex(0x168)}  ; Tone table old 2
T_NEW_3         EQU #${hex(0x180)}  ; Tone table new 3
T_OLD_3         EQU #${hex(0x180)}  ; Tone table old 3
T_OLD_0         EQU #${hex(0x182)}  ; Tone table old 0
T_NEW_0         EQU #${hex(0x182)}  ; Tone table new 0
T_NEW_2         EQU #${hex(0x19A)}  ; Tone table new 2 (last, ends at +0x1B2)
`;
        currentAddress = pt3Base + 0x240; // Reserve 576 bytes for PT3 workspace (RAM LENGTH per replayer spec)
    }
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
