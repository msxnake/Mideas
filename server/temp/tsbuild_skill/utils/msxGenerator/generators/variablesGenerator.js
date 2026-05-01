"use strict";
/**
 * @fileoverview Variables Generator - RAM variable definitions
 * Generates variables.asm with dynamic variable allocation using EQU addresses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVariablesFile = generateVariablesFile;
const spriteUtils_1 = require("../../../components/utils/spriteUtils");
const soundGenerator_1 = require("./soundGenerator");
const romModeUtils_1 = require("./romModeUtils");
const RAM_BASE = 0xC000;
const MSX_SYSTEM_RAM_START = 0xF380;
const ZX0_SHARED_SCRATCH_SIZE = 1488;
const EFFECT_ZONE_ENTRY_SIZE = 8;
const MAX_EFFECT_ZONE_ENTRIES = 64;
function formatHexWord(value) {
    return `#${value.toString(16).toUpperCase().padStart(4, '0')}`;
}
function formatZx0ScratchOverflowMessage(args) {
    const overBy = Math.max(0, args.scratchEnd - MSX_SYSTEM_RAM_START);
    const freeBeforeAlignedScratch = Math.max(0, MSX_SYSTEM_RAM_START - args.scratchBase);
    const projectRamBytes = Math.max(0, args.currentAddress - RAM_BASE);
    const screenMapBytes = (args.romMode === 'megarom' ? 8 : 7) * 768;
    const entityBytesApprox = 32 * 40;
    const assetCounts = [
        `sprites=${args.analysis.sprites?.length || 0}`,
        `expandedSprites=${args.expandedSpriteCount}`,
        `maxSpriteLayers=${args.maxSpriteLayerCount}`,
        `tiles=${args.analysis.tiles?.length || 0}`,
        `screens=${(args.analysis.screens || args.analysis.screenMaps || []).length || 0}`,
        `entities=${args.analysis.entities?.length || 0}`,
        `tracks=${args.analysis.tracks?.length || 0}`,
        `stateMachines=${args.analysis.stateMachines?.length || 0}`,
    ].join(', ');
    return [
        `ZX0 scratch RAM overflow: need up to ${formatHexWord(args.scratchEnd)}, limit is ${formatHexWord(MSX_SYSTEM_RAM_START)} (over by ${overBy} bytes).`,
        `RAM variables end at ${formatHexWord(args.currentAddress)} (${projectRamBytes} bytes from ${formatHexWord(RAM_BASE)}); scratch base aligns to ${formatHexWord(args.scratchBase)}.`,
        `Required shared ZX0 scratch is ${args.scratchSize} bytes; free before MSX system variables after alignment is ${freeBeforeAlignedScratch} bytes.`,
        `ROM mode "${args.romMode}" does not change MSX1 RAM. Mapper/MegaROM builds must fit the same ${formatHexWord(MSX_SYSTEM_RAM_START)} ceiling.`,
        `Project asset counts: ${assetCounts}.`,
        `Large fixed RAM consumers include runtime screen/effects maps (~${screenMapBytes} bytes), entity arrays (~${entityBytesApprox}+ bytes), and tracker buffer (${args.serializedTrackerMusicBufferSize} bytes when banked tracker data is cached).`,
    ].join(' ');
}
function countDrawableSpriteLayers(sprite) {
    const palette = sprite?.spritePalette || [];
    const bg = sprite?.backgroundColor;
    const frames = sprite?.frames || [];
    if (!palette.length || !frames.length)
        return 1;
    let count = 0;
    for (let layerIdx = 0; layerIdx < palette.length; layerIdx++) {
        const layerColor = palette[layerIdx];
        if (!layerColor || layerColor === bg)
            continue;
        let hasPixels = false;
        for (const frame of frames) {
            if (frame?.msx1LayerData?.[layerIdx]?.some((row) => row.some(Boolean))) {
                hasPixels = true;
                break;
            }
            if (!frame?.data)
                continue;
            for (let y = 0; y < frame.data.length && !hasPixels; y++) {
                for (let x = 0; x < (frame.data[y]?.length || 0); x++) {
                    if (frame.data[y][x] === layerColor) {
                        hasPixels = true;
                        break;
                    }
                }
            }
            if (hasPixels)
                break;
        }
        if (hasPixels)
            count++;
    }
    return Math.max(1, count);
}
function getScreenList(analysis) {
    return analysis.screens || analysis.screenMaps || [];
}
function getMaxRuntimeEffectZones(analysis) {
    const screens = getScreenList(analysis);
    return Math.min(MAX_EFFECT_ZONE_ENTRIES, Math.max(0, ...screens.map((screen) => (screen?.effectZones || []).length)));
}
/**
 * Generate RAM variables with EQU addresses (variables.asm)
 *
 * @param analysis - Project analysis with detected assets and entities
 * @returns ASM code string with variable definitions
 */
function generateVariablesFile(analysis, romMode = 'simple32k') {
    const usesMapper = (0, romModeUtils_1.usesMapperBanking)(romMode);
    const useResourceManager = romMode === 'megarom';
    const expandedSprites = (0, spriteUtils_1.buildMSXDirectionalSpriteCatalog)(analysis.sprites || []).sprites;
    const expandedSpriteCount = Math.max(1, expandedSprites.length);
    const maxSpriteLayerCount = Math.max(1, ...expandedSprites.map(countDrawableSpriteLayers));
    const maxRuntimeEffectZones = getMaxRuntimeEffectZones(analysis);
    const runtimeEffectZoneTableBytes = maxRuntimeEffectZones * EFFECT_ZONE_ENTRY_SIZE;
    const serializedTrackerMusicBufferSize = useResourceManager
        ? (0, soundGenerator_1.getSerializedTrackerMusicBufferSize)(analysis)
        : 0;
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
    let currentAddress = RAM_BASE;
    // Core variables (always needed)
    code += `input_state         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current direction state (0-8)\n`;
    currentAddress++;
    code += `prev_input_state    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous direction state (0-8)\n`;
    currentAddress++;
    code += `input_btn_curr      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current input buttons bitmask (bit0=fire, bit1=grab)\n`;
    currentAddress++;
    code += `input_btn_prev      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous input buttons bitmask (bit0=fire, bit1=grab)\n`;
    currentAddress++;
    code += `input_fire          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Fire button state (0=released, 1=pressed)\n`;
    currentAddress++;
    code += `boss_runtime_tick   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss runtime frame counter\n`;
    currentAddress++;
    code += `current_screen_boss_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss placements assigned to current screen\n`;
    currentAddress++;
    code += `current_screen_boss_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Pointer to current screen boss placement table (16-bit)\n`;
    currentAddress += 2;
    code += `current_screen_boss_table_bank EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mapper bank for current screen boss placement table\n`;
    currentAddress++;
    code += `current_screen_boss_entry EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First current-screen boss placement copied to RAM (11 bytes)\n`;
    currentAddress += 11;
    code += `boss_active         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when a screen boss is active\n`;
    currentAddress++;
    code += `boss_health_lo      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss health low byte\n`;
    currentAddress++;
    code += `boss_health_hi      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss health high byte\n`;
    currentAddress++;
    code += `boss_hit_cooldown   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames until boss can receive dash damage again\n`;
    currentAddress++;
    code += `boss_phase_table_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss phase table pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_attack_table_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss attack table pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_phase_ptr      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss phase record pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_tile_matrix_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss tile matrix pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_x_char         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss X in screen chars\n`;
    currentAddress++;
    code += `boss_y_char         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss Y in screen chars\n`;
    currentAddress++;
    code += `boss_prev_x_char    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous boss X in screen chars for redraw restore\n`;
    currentAddress++;
    code += `boss_prev_y_char    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Previous boss Y in screen chars for redraw restore\n`;
    currentAddress++;
    code += `boss_initial_phase_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss initial phase index\n`;
    currentAddress++;
    code += `boss_width          EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss width in chars\n`;
    currentAddress++;
    code += `boss_height         EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss height in chars\n`;
    currentAddress++;
    code += `boss_behavior_table_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss behavior table pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_form_table_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss visual form table pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_weak_matrix_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss weak-point matrix pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_behavior_action_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior action pointer (16-bit)\n`;
    currentAddress += 2;
    code += `boss_behavior_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active boss behavior action count\n`;
    currentAddress++;
    code += `boss_behavior_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior action index\n`;
    currentAddress++;
    code += `boss_behavior_timer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames remaining in current boss behavior action\n`;
    currentAddress++;
    code += `boss_behavior_duration EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior action duration\n`;
    currentAddress++;
    code += `boss_behavior_step_interval EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames between tile movement steps\n`;
    currentAddress++;
    code += `boss_behavior_step_timer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Countdown until next tile movement step\n`;
    currentAddress++;
    code += `boss_update_interval EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames between ASM boss updates (1=every frame)\n`;
    currentAddress++;
    code += `boss_update_timer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Countdown until next ASM boss update\n`;
    currentAddress++;
    code += `boss_behavior_action_type EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior action type\n`;
    currentAddress++;
    code += `boss_behavior_target_type EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior target type\n`;
    currentAddress++;
    code += `boss_behavior_target_x EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior target X char\n`;
    currentAddress++;
    code += `boss_behavior_target_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior target Y char\n`;
    currentAddress++;
    code += `boss_behavior_aux0 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior auxiliary byte 0\n`;
    currentAddress++;
    code += `boss_behavior_aux1 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior auxiliary byte 1\n`;
    currentAddress++;
    code += `boss_behavior_aux2 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boss behavior auxiliary byte 2\n`;
    currentAddress++;
    code += `boss_visual_dirty   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Non-zero when boss tile matrix/form changed and needs redraw\n`;
    currentAddress++;
    code += `boss_draw_row       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss tile draw row scratch\n`;
    currentAddress++;
    code += `boss_draw_col       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss tile draw column scratch\n`;
    currentAddress++;
    code += `boss_restore_row    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss previous footprint restore row scratch\n`;
    currentAddress++;
    code += `boss_restore_col    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss previous footprint restore column scratch\n`;
    currentAddress++;
    code += `boss_draw_char      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss tile draw char scratch\n`;
    currentAddress++;
    code += `boss_draw_screen_x  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss tile draw screen X scratch\n`;
    currentAddress++;
    code += `boss_draw_screen_y  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss tile draw screen Y scratch\n`;
    currentAddress++;
    code += `boss_projectile_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when the simple boss projectile is active\n`;
    currentAddress++;
    code += `boss_projectile_x   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile X in pixels\n`;
    currentAddress++;
    code += `boss_projectile_y   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile Y in pixels\n`;
    currentAddress++;
    code += `boss_projectile_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite slot for simple boss projectile\n`;
    currentAddress++;
    code += `boss_projectile_color EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile sprite color\n`;
    currentAddress++;
    code += `boss_projectile_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile base pattern\n`;
    currentAddress++;
    code += `boss_projectile_speed EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile speed\n`;
    currentAddress++;
    code += `boss_projectile_range EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile max travel distance\n`;
    currentAddress++;
    code += `boss_projectile_distance EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile current travelled distance\n`;
    currentAddress++;
    code += `boss_projectile_direction EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Simple boss projectile direction\n`;
    currentAddress++;
    code += `boss_slam_rocks_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 while SlamRocks sequence is active\n`;
    currentAddress++;
    code += `boss_slam_rocks_age EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks local frame age\n`;
    currentAddress++;
    code += `boss_slam_rocks_origin_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss Y before SlamRocks starts\n`;
    currentAddress++;
    code += `boss_slam_rocks_rise_chars EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Chars boss rises before impact\n`;
    currentAddress++;
    code += `boss_slam_rocks_windup EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Raised frames before impact\n`;
    currentAddress++;
    code += `boss_slam_rocks_slam EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Drop frames before rocks begin\n`;
    currentAddress++;
    code += `boss_slam_rocks_hold EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Ground hold frames before rocks begin\n`;
    currentAddress++;
    code += `boss_slam_rocks_duration EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Total SlamRocks active frames\n`;
    currentAddress++;
    code += `boss_slam_rocks_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Falling rock count\n`;
    currentAddress++;
    code += `boss_slam_rocks_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current falling rock lane index\n`;
    currentAddress++;
    code += `boss_slam_rocks_rng  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Local SlamRocks random seed\n`;
    currentAddress++;
    code += `boss_slam_rocks_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First HW sprite slot for SlamRocks rocks\n`;
    currentAddress++;
    code += `boss_slam_rocks_color EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks rock sprite color\n`;
    currentAddress++;
    code += `boss_slam_rocks_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks rock base pattern\n`;
    currentAddress++;
    code += `boss_slam_rocks_speed EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks rock fall speed\n`;
    currentAddress++;
    code += `boss_slam_rocks_range EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks rock fall range\n`;
    currentAddress++;
    code += `boss_slam_rock_x0    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks lane 0 X\n`;
    currentAddress++;
    code += `boss_slam_rock_x1    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks lane 1 X\n`;
    currentAddress++;
    code += `boss_slam_rock_x2    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks lane 2 X\n`;
    currentAddress++;
    code += `boss_slam_rock_x3    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; SlamRocks lane 3 X\n`;
    currentAddress++;
    code += `boss_falling_blocks_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 while FallingBlocks sequence is active\n`;
    currentAddress++;
    code += `boss_falling_blocks_age EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FallingBlocks local frame age\n`;
    currentAddress++;
    code += `boss_falling_blocks_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Falling block count\n`;
    currentAddress++;
    code += `boss_falling_blocks_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current falling block lane index\n`;
    currentAddress++;
    code += `boss_falling_blocks_landed_flags EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bitmask of lanes already converted to chars\n`;
    currentAddress++;
    code += `boss_falling_blocks_rng EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Local FallingBlocks random seed\n`;
    currentAddress++;
    code += `boss_falling_blocks_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First HW sprite slot for falling blocks\n`;
    currentAddress++;
    code += `boss_falling_blocks_color EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Falling block sprite color\n`;
    currentAddress++;
    code += `boss_falling_blocks_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Falling block base pattern\n`;
    currentAddress++;
    code += `boss_falling_blocks_speed EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Falling block speed\n`;
    currentAddress++;
    code += `boss_falling_blocks_duration EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FallingBlocks max active frames\n`;
    currentAddress++;
    code += `boss_falling_blocks_tile_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Char written when a falling block lands\n`;
    currentAddress++;
    code += `boss_falling_blocks_landing_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Landing row in chars\n`;
    currentAddress++;
    code += `boss_falling_blocks_behavior EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Behavior byte written when a block lands\n`;
    currentAddress++;
    code += `boss_falling_blocks_tile_x EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Landing X char scratch\n`;
    currentAddress++;
    code += `boss_falling_blocks_x0 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FallingBlocks lane 0 X\n`;
    currentAddress++;
    code += `boss_falling_blocks_x1 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FallingBlocks lane 1 X\n`;
    currentAddress++;
    code += `boss_falling_blocks_x2 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FallingBlocks lane 2 X\n`;
    currentAddress++;
    code += `boss_falling_blocks_x3 EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FallingBlocks lane 3 X\n`;
    currentAddress++;
    code += `boss_meteor_age     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss meteor cycle age\n`;
    currentAddress++;
    code += `boss_meteor_count   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active meteor lanes\n`;
    currentAddress++;
    code += `boss_meteor_index   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current meteor lane index\n`;
    currentAddress++;
    code += `boss_meteor_base_x  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First meteor lane X\n`;
    currentAddress++;
    code += `boss_meteor_base_y  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor spawn Y\n`;
    currentAddress++;
    code += `boss_meteor_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First HW sprite slot for meteors\n`;
    currentAddress++;
    code += `boss_meteor_color   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor sprite color\n`;
    currentAddress++;
    code += `boss_meteor_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor base pattern\n`;
    currentAddress++;
    code += `boss_meteor_speed   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor fall speed\n`;
    currentAddress++;
    code += `boss_meteor_range   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor fall range\n`;
    currentAddress++;
    code += `boss_meteor_spread  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor lane spacing\n`;
    currentAddress++;
    code += `boss_meteor_warn    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Meteor warning frames\n`;
    currentAddress++;
    code += `boss_bomb_age       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss bomb cycle age\n`;
    currentAddress++;
    code += `boss_bomb_count     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active bomb lanes\n`;
    currentAddress++;
    code += `boss_bomb_index     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current bomb lane index\n`;
    currentAddress++;
    code += `boss_bomb_base_x    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First bomb lane X\n`;
    currentAddress++;
    code += `boss_bomb_base_y    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb spawn Y\n`;
    currentAddress++;
    code += `boss_bomb_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First HW sprite slot for bombs\n`;
    currentAddress++;
    code += `boss_bomb_color     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb sprite color\n`;
    currentAddress++;
    code += `boss_bomb_pattern   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb base pattern\n`;
    currentAddress++;
    code += `boss_bomb_explosion_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb explosion pattern\n`;
    currentAddress++;
    code += `boss_bomb_spread    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb lane spacing\n`;
    currentAddress++;
    code += `boss_bomb_fuse      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb fuse frames\n`;
    currentAddress++;
    code += `boss_bomb_radius    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb explosion radius\n`;
    currentAddress++;
    code += `boss_bomb_duration  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Bomb explosion active frames\n`;
    currentAddress++;
    code += `boss_boomerang_age  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss boomerang cycle age\n`;
    currentAddress++;
    code += `boss_boomerang_base_x EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang origin X\n`;
    currentAddress++;
    code += `boss_boomerang_base_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang origin Y\n`;
    currentAddress++;
    code += `boss_boomerang_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite slot for boomerang\n`;
    currentAddress++;
    code += `boss_boomerang_color EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang sprite color\n`;
    currentAddress++;
    code += `boss_boomerang_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang base pattern\n`;
    currentAddress++;
    code += `boss_boomerang_speed EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang speed\n`;
    currentAddress++;
    code += `boss_boomerang_range EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang max distance\n`;
    currentAddress++;
    code += `boss_boomerang_distance EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current boomerang distance from origin\n`;
    currentAddress++;
    code += `boss_boomerang_direction EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boomerang direction\n`;
    currentAddress++;
    code += `boss_rock_age       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss rock cycle age\n`;
    currentAddress++;
    code += `boss_rock_base_x    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock origin X\n`;
    currentAddress++;
    code += `boss_rock_base_y    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock origin Y\n`;
    currentAddress++;
    code += `boss_rock_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite slot for rock\n`;
    currentAddress++;
    code += `boss_rock_color     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock sprite color\n`;
    currentAddress++;
    code += `boss_rock_pattern   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock base pattern\n`;
    currentAddress++;
    code += `boss_rock_speed     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock speed\n`;
    currentAddress++;
    code += `boss_rock_range     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock max travel distance\n`;
    currentAddress++;
    code += `boss_rock_distance  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current rock distance from origin\n`;
    currentAddress++;
    code += `boss_rock_direction EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock direction\n`;
    currentAddress++;
    code += `boss_rock_arc_height EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Rock parabolic arc height\n`;
    currentAddress++;
    code += `boss_rock_arc_offset EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current rock arc offset\n`;
    currentAddress++;
    code += `boss_laser_age      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss laser cycle age\n`;
    currentAddress++;
    code += `boss_laser_base_x   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser origin X in pixels\n`;
    currentAddress++;
    code += `boss_laser_base_y   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser origin Y in pixels\n`;
    currentAddress++;
    code += `boss_laser_tile_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser beam char code\n`;
    currentAddress++;
    code += `boss_laser_length   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser length in chars\n`;
    currentAddress++;
    code += `boss_laser_duration EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser active frames\n`;
    currentAddress++;
    code += `boss_laser_direction EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser direction\n`;
    currentAddress++;
    code += `boss_laser_index    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current laser char index\n`;
    currentAddress++;
    code += `boss_laser_origin_tile_x EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser origin tile X\n`;
    currentAddress++;
    code += `boss_laser_origin_tile_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Laser origin tile Y\n`;
    currentAddress++;
    code += `boss_laser_tile_x   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current laser tile X\n`;
    currentAddress++;
    code += `boss_laser_tile_y   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current laser tile Y\n`;
    currentAddress++;
    code += `boss_laser_write_mode EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 0=draw laser, 1=restore map\n`;
    currentAddress++;
    code += `boss_wave_age       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss sine-wave projectile cycle age\n`;
    currentAddress++;
    code += `boss_wave_base_x    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile origin X\n`;
    currentAddress++;
    code += `boss_wave_base_y    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile origin Y\n`;
    currentAddress++;
    code += `boss_wave_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite slot for sine-wave projectile\n`;
    currentAddress++;
    code += `boss_wave_color     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile sprite color\n`;
    currentAddress++;
    code += `boss_wave_pattern   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile base pattern\n`;
    currentAddress++;
    code += `boss_wave_speed     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile speed\n`;
    currentAddress++;
    code += `boss_wave_range     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile max travel distance\n`;
    currentAddress++;
    code += `boss_wave_distance  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current sine-wave projectile distance\n`;
    currentAddress++;
    code += `boss_wave_direction EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave projectile direction\n`;
    currentAddress++;
    code += `boss_wave_amplitude EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sine-wave perpendicular amplitude\n`;
    currentAddress++;
    code += `boss_wave_frequency EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames per sine-wave phase step\n`;
    currentAddress++;
    code += `boss_wave_phase     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current sine-wave phase index\n`;
    currentAddress++;
    code += `boss_wave_offset    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Signed sine-wave perpendicular offset\n`;
    currentAddress++;
    code += `boss_homing_age     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Boss homing missile cycle age\n`;
    currentAddress++;
    code += `boss_homing_base_x  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile origin X\n`;
    currentAddress++;
    code += `boss_homing_base_y  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile origin Y\n`;
    currentAddress++;
    code += `boss_homing_sprite_slot EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite slot for homing missile\n`;
    currentAddress++;
    code += `boss_homing_color   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile sprite color\n`;
    currentAddress++;
    code += `boss_homing_pattern EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile base pattern\n`;
    currentAddress++;
    code += `boss_homing_speed   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile speed\n`;
    currentAddress++;
    code += `boss_homing_range   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile max travel distance\n`;
    currentAddress++;
    code += `boss_homing_distance EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current homing missile distance\n`;
    currentAddress++;
    code += `boss_homing_direction EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile launch direction\n`;
    currentAddress++;
    code += `boss_homing_turn_step EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile steering strength\n`;
    currentAddress++;
    code += `boss_homing_turn_distance EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Homing missile steering distance\n`;
    currentAddress++;
    code += `autocontrol_screen_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Screen id bound to current FakePlayer script\n`;
    currentAddress++;
    code += `autocontrol_entity_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active FakePlayer entity index (#FF=none)\n`;
    currentAddress++;
    code += `autocontrol_script_ptr_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current FakePlayer script pointer low byte\n`;
    currentAddress++;
    code += `autocontrol_script_ptr_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current FakePlayer script pointer high byte\n`;
    currentAddress++;
    code += `autocontrol_script_start_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FakePlayer script start pointer low byte\n`;
    currentAddress++;
    code += `autocontrol_script_start_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FakePlayer script start pointer high byte\n`;
    currentAddress++;
    code += `autocontrol_wait_frames EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; FakePlayer wait countdown in frames\n`;
    currentAddress++;
    code += `autocontrol_move_opcode EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active FakePlayer movement opcode\n`;
    currentAddress++;
    code += `autocontrol_move_remaining EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Remaining FakePlayer movement pixels\n`;
    currentAddress++;
    code += `autocontrol_loop_flag EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=loop FakePlayer script on END\n`;
    currentAddress++;
    code += `autocontrol_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=FakePlayer script active\n`;
    currentAddress++;
    code += `autoev_screen_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Screen id bound to compact FakePlayer event script\n`;
    currentAddress++;
    code += `autoev_entity_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active compact FakePlayer entity index (#FF=none)\n`;
    currentAddress++;
    code += `autoev_script_ptr_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact FakePlayer event pointer low byte\n`;
    currentAddress++;
    code += `autoev_script_ptr_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact FakePlayer event pointer high byte\n`;
    currentAddress++;
    code += `autoev_script_start_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact FakePlayer event start pointer low byte\n`;
    currentAddress++;
    code += `autoev_script_start_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact FakePlayer event start pointer high byte\n`;
    currentAddress++;
    code += `autoev_wait_frames EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact FakePlayer wait countdown in frames\n`;
    currentAddress++;
    code += `autoev_move_axis EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact move axis (1=x,2=y)\n`;
    currentAddress++;
    code += `autoev_move_step EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Compact move step (1 or #FF)\n`;
    currentAddress++;
    code += `autoev_move_remaining EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Remaining compact FakePlayer movement pixels\n`;
    currentAddress++;
    code += `autoev_loop_flag EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=loop compact FakePlayer event script\n`;
    currentAddress++;
    code += `autoev_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=compact FakePlayer event script active\n`;
    currentAddress++;
    code += `autoev_wait_mode EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=wait SPC, 2=wait typewriter\n`;
    currentAddress++;
    code += `autoev_number_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Parsed compact event number low byte\n`;
    currentAddress++;
    code += `autoev_number_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Parsed compact event number high byte\n`;
    currentAddress++;
    code += `dialogue_active    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=dialogue box is open\n`;
    currentAddress++;
    code += `dialogue_current_box EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current dialogue box config index\n`;
    currentAddress++;
    code += `dialogue_text_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=typewriter is writing text\n`;
    currentAddress++;
    code += `dialogue_text_ptr_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue typewriter text pointer low byte\n`;
    currentAddress++;
    code += `dialogue_text_ptr_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue typewriter text pointer high byte\n`;
    currentAddress++;
    code += `dialogue_vram_ptr_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue typewriter VRAM pointer low byte\n`;
    currentAddress++;
    code += `dialogue_vram_ptr_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue typewriter VRAM pointer high byte\n`;
    currentAddress++;
    code += `dialogue_row_start_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current dialogue row start VRAM low byte\n`;
    currentAddress++;
    code += `dialogue_row_start_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current dialogue row start VRAM high byte\n`;
    currentAddress++;
    code += `dialogue_char_delay EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue character delay countdown\n`;
    currentAddress++;
    code += `dialogue_char_delay_reload EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue character delay reload value\n`;
    currentAddress++;
    code += `dialogue_box_vram_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue box VRAM start low byte\n`;
    currentAddress++;
    code += `dialogue_box_vram_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue box VRAM start high byte\n`;
    currentAddress++;
    code += `dialogue_box_width EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue box width in chars\n`;
    currentAddress++;
    code += `dialogue_box_height EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue box height in chars\n`;
    currentAddress++;
    code += `dialogue_box_tl_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue top-left border char\n`;
    currentAddress++;
    code += `dialogue_box_tr_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue top-right border char\n`;
    currentAddress++;
    code += `dialogue_box_bl_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue bottom-left border char\n`;
    currentAddress++;
    code += `dialogue_box_br_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue bottom-right border char\n`;
    currentAddress++;
    code += `dialogue_box_h_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue horizontal border char\n`;
    currentAddress++;
    code += `dialogue_box_v_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue vertical border char\n`;
    currentAddress++;
    code += `dialogue_graphic_enabled EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=dialogue tile graphic is visible\n`;
    currentAddress++;
    code += `dialogue_graphic_vram_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue graphic VRAM start low byte\n`;
    currentAddress++;
    code += `dialogue_graphic_vram_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue graphic VRAM start high byte\n`;
    currentAddress++;
    code += `dialogue_graphic_ptr_l EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue graphic tile data pointer low byte\n`;
    currentAddress++;
    code += `dialogue_graphic_ptr_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue graphic tile data pointer high byte\n`;
    currentAddress++;
    code += `dialogue_graphic_width EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue graphic width in chars\n`;
    currentAddress++;
    code += `dialogue_graphic_height EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dialogue graphic height in chars\n`;
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
    code += `ROM_slot            EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Expanded slot for normal page 1 ROM access\n`;
    currentAddress++;
    code += `slot_primary_normal EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Primary slot register snapshot for BIOS-ROM-ROM-RAM layout\n`;
    currentAddress++;
    code += `page0_bios_slot     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Expanded slot for normal BIOS page 0\n`;
    currentAddress++;
    code += `page2_normal_slot   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Expanded slot for normal page 2 layout\n`;
    currentAddress++;
    code += `page3_normal_slot   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Expanded slot for normal RAM page 3\n`;
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
    code += `resource_descriptor_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Pointer to cached resource descriptor entry (16-bit)\n`;
    currentAddress += 2;
    code += `resource_descriptor_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource id\n`;
    currentAddress++;
    code += `resource_descriptor_type EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource type\n`;
    currentAddress++;
    code += `resource_descriptor_group EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource group\n`;
    currentAddress++;
    code += `resource_descriptor_bank EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource bank\n`;
    currentAddress++;
    code += `resource_descriptor_addr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource visible address (16-bit)\n`;
    currentAddress += 2;
    code += `resource_descriptor_size EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource size (16-bit)\n`;
    currentAddress += 2;
    code += `vram_cache_tile_patterns_ready EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when shared gameplay tile patterns are already resident in VRAM\n`;
    currentAddress++;
    code += `vram_cache_tile_colors_ready EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when shared gameplay tile colors are already resident in VRAM\n`;
    currentAddress++;
    code += `vram_cache_font_ready EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when shared font patterns/colors are already resident in VRAM\n`;
    currentAddress++;
    if (useResourceManager) {
        code += `resource_ram_cache_screen_layout_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource id for runtime_background_layout source\n`;
        currentAddress++;
        code += `resource_ram_cache_effects_layout_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource id for runtime_effects_layout source\n`;
        currentAddress++;
        code += `resource_ram_cache_effect_zone_table_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached resource id for runtime_effect_zone_table source\n`;
        currentAddress++;
    }
    code += `current_screen2_tilebank_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current SCREEN 2 shared tilebank loaded in VRAM (#FF=none/unknown)\n`;
    currentAddress++;
    code += `frame_counter       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frame counter (16-bit)\n`;
    currentAddress += 2;
    code += `\n; Profiling counters (16-bit, cumulative)\n`;
    code += `prof_update_all_entities_calls EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to update_all_entities\n`;
    currentAddress += 2;
    code += `prof_execute_sm_calls EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to execute_all_state_machines\n`;
    currentAddress += 2;
    code += `prof_sm_update_calls  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to SM_Update\n`;
    currentAddress += 2;
    code += `prof_collision_calls  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to update_collision_component\n`;
    currentAddress += 2;
    code += `prof_wall_calls       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to update_wallcollision_component\n`;
    currentAddress += 2;
    code += `prof_deadly_calls     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to update_deadly_tiles_component\n`;
    currentAddress += 2;
    code += `prof_tile_interaction_calls EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to check_tile_interaction\n`;
    currentAddress += 2;
    code += `prof_animation_calls  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to update_animation_component\n`;
    currentAddress += 2;
    code += `prof_sprite_calls     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to update_sprite_component\n`;
    currentAddress += 2;
    code += `prof_music_task_calls EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Calls to task_update_music\n`;
    currentAddress += 2;
    code += `prof_deadly_behavior_reads EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Deadly helper behavior-map reads\n`;
    currentAddress += 2;
    code += `; page0_transfer_buffer shares the ZX0 scratch area declared near RAM_USAGE_END.\n`;
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
    code += `MAX_RUNTIME_EFFECT_ZONES EQU ${maxRuntimeEffectZones}\n`;
    code += `runtime_background_layout EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Immutable copy of current background layout (32x24)\n`;
    currentAddress += 768;
    code += `runtime_screen_layout  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current screen layout (32x24)\n`;
    currentAddress += 768;
    code += `runtime_behavior_map   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current behavior map (32x24)\n`;
    currentAddress += 768;
    code += `runtime_interaction_type_map EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current interaction type map (32x24)\n`;
    currentAddress += 768;
    code += `runtime_interaction_value_map EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current interaction value map (32x24)\n`;
    currentAddress += 768;
    code += `runtime_interaction_target_map EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Mutable copy of current interaction target map (32x24)\n`;
    currentAddress += 768;
    code += `runtime_char_behavior_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current screen char -> behavior lookup table (256 bytes)\n`;
    currentAddress += 256;
    code += `runtime_effects_layout EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Alternate effects layout copy for secret zones (32x24)\n`;
    currentAddress += 768;
    code += `screen_block_catalog_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Scratch pointer to current screen block catalog during layout expansion\n`;
    currentAddress += 2;
    code += `screen_block_map_ptr EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Scratch pointer to current screen block index map during layout expansion\n`;
    currentAddress += 2;
    code += `runtime_effect_zone_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current screen effect zone table (${runtimeEffectZoneTableBytes} bytes)\n`;
    currentAddress += runtimeEffectZoneTableBytes;
    code += `current_effect_zone_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of effect zones copied into runtime_effect_zone_table\n`;
    currentAddress++;
    code += `secret_zone_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 if hero is currently inside an active secret zone\n`;
    currentAddress++;
    code += `secret_zone_rect_x EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active secret zone rect X in cells\n`;
    currentAddress++;
    code += `secret_zone_rect_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active secret zone rect Y in cells\n`;
    currentAddress++;
    code += `secret_zone_rect_w EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active secret zone rect width in cells\n`;
    currentAddress++;
    code += `secret_zone_rect_h EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active secret zone rect height in cells\n`;
    currentAddress++;
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
    code += `time_second_frame_counter EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; VBlank frames remaining until the next TimeRemaining decrement\n`;
    currentAddress++;
    code += `time_last_interrupt_counter EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Last interrupt_counter snapshot used by TimeRemaining sync (16-bit)\n`;
    currentAddress += 2;
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
    // Entity system variables (MAX_ENTITIES = 32)
    code += `
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`;
    code += `entity_active       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity active flags (32 bytes, 0=inactive, 1=active)\n`;
    currentAddress += 32;
    code += `entity_is_player    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)\n`;
    currentAddress += 32;
    code += `entity_button_contact_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 while entity stays on the same button tile (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_button_contact_x EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Button tile X currently latched per entity (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_button_contact_y EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Button tile Y currently latched per entity (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_on_ladder   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 while entity is centered on a ladder tile (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_gate_current_step EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Current applied retract step (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_gate_step_timer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Countdown until next retract step (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_walljump_lock EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Remaining horizontal lock frames after wall jump (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_walljump_locked_vx EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Horizontal velocity preserved while wall jump lock is active (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_wallgrab_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 if entity is currently grabbing a wall (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_wallgrab_grace EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames to keep wall grab during transient wall flag gaps (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_wallgrab_timer EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Remaining wall-grab frames until grounded reset (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_wallgrab_lockout EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Wall grab disabled until grounded after timer is spent (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_walljump_anim_active EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Wall jump one-shot animation is waiting to restore base sprite (32 bytes)\n`;
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
    code += `entity_sm_sprite_control EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when the assigned state machine explicitly drives sprite changes (32 bytes)\n`;
    currentAddress += 32;
    code += `entity_lifetime     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)\n`;
    currentAddress += 32;
    code += `entity_collectible_enabled EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when entity has Collectible component (32 bytes)\n`;
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
    if (usesMapper) {
        code += `entity_sprite_config EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity sprite config RAM copy (base HW sprite + layer count, 64 bytes)\n`;
        currentAddress += 64;
        code += `sprite_asset_frame_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite asset frame counts RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `sprite_asset_layer_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite asset layer counts RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `sprite_loop_flags EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite loop flags RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `sprite_dir_left_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Directional sprite lookup RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `sprite_dir_right_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Directional sprite lookup RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `sprite_dir_up_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Directional sprite lookup RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `sprite_dir_down_table EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Directional sprite lookup RAM copy (${expandedSpriteCount} bytes)\n`;
        currentAddress += expandedSpriteCount;
        code += `SM_SpriteLayerColorTable EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime SM sprite layer colors (${expandedSpriteCount}*${maxSpriteLayerCount} bytes)\n`;
        currentAddress += expandedSpriteCount * maxSpriteLayerCount;
        code += `SM_SpriteLayerYOffsetTable EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime SM sprite layer Y offsets (${expandedSpriteCount}*${maxSpriteLayerCount} bytes)\n`;
        currentAddress += expandedSpriteCount * maxSpriteLayerCount;
    }
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
    code += `sprite_layer_y_offsets EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; HW sprite layer signed Y offsets - RAM copy (32 bytes, indexed by HW sprite index)\n`;
    currentAddress += 32;
    code += `sprite_asset_base_pattern_slot_runtime EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime base 16x16 slot per sprite asset (${expandedSpriteCount} bytes)\n`;
    currentAddress += expandedSpriteCount;
    code += `sprite_placeholder_base_pattern_num EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime placeholder pattern number (base slot * 4)\n`;
    currentAddress++;
    code += `current_sprite_pattern_pack_id EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active runtime sprite pattern pack id (#FF=none loaded)\n`;
    currentAddress++;
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
        code += `current_screen_engine EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime engine: 0=Player, 1=FakePlayer\n`;
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
        code += `current_screen_anim_group_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Animated tile groups visible in current screen\n`;
        currentAddress++;
        code += `current_screen_entity_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity instances assigned to current screen\n`;
        currentAddress++;
        code += `current_screen_sprite_pattern_slots EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Sprite pattern slots needed by current screen\n`;
        currentAddress++;
        code += `current_screen_summary_flags EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Runtime screen summary flags (music/hud/effects/anim)\n`;
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
        code += `player_runtime_enabled EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=player fast runtime bound to hero entity\n`;
        currentAddress++;
        code += `player_entity_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity index used by player fast runtime (#FF=none)\n`;
        currentAddress++;
        code += `player_vx_runtime   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached player X velocity (signed 8-bit)\n`;
        currentAddress++;
        code += `player_vy_runtime   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached player Y velocity (signed 8-bit)\n`;
        currentAddress++;
        code += `player_dash_timer   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames remaining in current Player dash\n`;
        currentAddress++;
        code += `player_dash_cooldown EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Frames until Player can dash again\n`;
        currentAddress++;
        code += `player_dash_dir     EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player dash direction (1=left,2=right,3=up,4=down)\n`;
        currentAddress++;
        code += `player_dash_tile_x  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dash front probe tile X scratch\n`;
        currentAddress++;
        code += `player_dash_tile_y  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Dash front probe tile Y scratch\n`;
        currentAddress++;
        code += `player_health       EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player health points\n`;
        currentAddress++;
        code += `player_score        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Player score (16-bit)\n`;
        currentAddress += 2;
        code += `gem_count           EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Collectible tile counter (8-bit)\n`;
        currentAddress++;
        code += `last_interaction_char EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Char code of last interacted tile (for SM VARIABLE_COMPARE)\n`;
        currentAddress++;
        code += `last_gem_char       EQU last_interaction_char   ; Backwards-compatible alias for collectible SM checks\n`;
        code += `last_interaction_pending EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 when a new tile interaction is pending for State Machine logic\n`;
        currentAddress++;
        code += `last_interaction_type EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Interaction type id of last interacted tile\n`;
        currentAddress++;
        code += `last_interaction_value EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Interaction value byte of last interacted tile\n`;
        currentAddress++;
        code += `last_interaction_target EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Interaction target id of last interacted tile\n`;
        currentAddress++;
        code += `last_interaction_x  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Tile X coordinate of last interaction\n`;
        currentAddress++;
        code += `last_interaction_y  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Tile Y coordinate of last interaction\n`;
        currentAddress++;
        code += `last_interaction_entity EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Entity index that triggered the last interaction\n`;
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
    code += `temp_byte_28        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Temporary 8-bit storage (32 bytes)\n`;
    currentAddress += 32;
    code += `tileDead_dbg        EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Debug byte: current hero deadly contact\n`;
    currentAddress++;
    code += `tileDead_latched_dbg EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Debug byte: latched hero deadly contact\n`;
    currentAddress++;
    code += `tileDead_x_dbg      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Debug byte: last sampled deadly tile X\n`;
    currentAddress++;
    code += `tileDead_y_dbg      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Debug byte: last sampled deadly tile Y\n`;
    currentAddress++;
    code += `tileDead_value_dbg  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Debug byte: last raw deadly behavior value\n`;
    currentAddress++;
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
    code += `hero_entity_id      EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; First current-screen entity flagged as player (#FF = none)\n`;
    currentAddress++;
    code += `active_entity_list_dirty EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1=rebuild active_entity_list required\n`;
    currentAddress++;
    code += `input_entity_list   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)\n`;
    currentAddress += 32;
    code += `input_entity_count  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in input_entity_list\n`;
    currentAddress++;
    code += `render_entity_list  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)\n`;
    currentAddress += 32;
    code += `render_entity_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in render_entity_list\n`;
    currentAddress++;
    code += `collision_entity_list EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)\n`;
    currentAddress += 32;
    code += `collision_entity_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in collision_entity_list\n`;
    currentAddress++;
    code += `ground_entity_list  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)\n`;
    currentAddress += 32;
    code += `ground_entity_count EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in ground_entity_list\n`;
    currentAddress++;
    code += `anim_entity_list    EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)\n`;
    currentAddress += 32;
    code += `anim_entity_count   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Number of entries in anim_entity_list\n`;
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
    code += `interrupt_in_progress   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; 1 while the H.TIMI dispatcher is running\n`;
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
    if (serializedTrackerMusicBufferSize > 0) {
        code += `music_loaded_track_index EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Cached tracker track index loaded in RAM (#FF=none)\n`;
        currentAddress++;
    }
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
    code += `music_pitch_note_work EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Scratch note index while resolving tone/ornament macros\n`;
    currentAddress++;
    code += `music_pitch_step_work EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Scratch macro step while resolving tone/ornament macros\n`;
    currentAddress++;
    code += `music_pitch_len_work  EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Scratch macro length while resolving tone/ornament macros\n`;
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
        { base: 'music_ch_hw_env_step_base', prefix: 'music_ch', suffix: 'hw_env_step', comment: 'Software hardware-envelope divider step' },
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
    if (serializedTrackerMusicBufferSize > 0) {
        code += `music_track_buffer   EQU #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}   ; Serialized tracker song buffer (${serializedTrackerMusicBufferSize} bytes)\n`;
        currentAddress += serializedTrackerMusicBufferSize;
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
    const align256 = (value) => (value + 0xFF) & 0xFF00;
    const zx0LargeScratchBase = align256(currentAddress);
    const zx0ScratchEnd = zx0LargeScratchBase + ZX0_SHARED_SCRATCH_SIZE;
    if (zx0ScratchEnd > MSX_SYSTEM_RAM_START) {
        throw new Error(formatZx0ScratchOverflowMessage({
            currentAddress,
            scratchBase: zx0LargeScratchBase,
            scratchEnd: zx0ScratchEnd,
            scratchSize: ZX0_SHARED_SCRATCH_SIZE,
            romMode,
            expandedSpriteCount,
            maxSpriteLayerCount,
            serializedTrackerMusicBufferSize,
            analysis,
        }));
    }
    code += `
; ==================================================================
; ZX0 TEMPORARY RAM BUFFERS
; ==================================================================
; Compact scratch layout placed strictly after RAM_USAGE_END.
; Screen/behavior/tile buffers share the same large work area because they
; are decompressed and consumed sequentially, never concurrently.
; Font and sprite frame buffers are injected later by the ZX0 post-processor
; only when compression selects those blocks; they share scratch there too.
ZX0_SCREEN_BUFFER       EQU #${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}   ; Screen/layout scratch (shares ${ZX0_SHARED_SCRATCH_SIZE}-byte area)
ZX0_BEHAVIOR_BUFFER     EQU #${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}   ; Behavior map scratch (shares ${ZX0_SHARED_SCRATCH_SIZE}-byte area)
ZX0_TILE_PATTERN_BUFFER EQU #${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}   ; Tile pattern scratch (shares ${ZX0_SHARED_SCRATCH_SIZE}-byte area)
ZX0_TILE_COLOR_BUFFER   EQU #${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}   ; Tile color scratch (shares ${ZX0_SHARED_SCRATCH_SIZE}-byte area)
page0_transfer_buffer   EQU #${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}   ; Page-0 copy staging buffer (shares scratch area)
ZX0_SCRATCH_END         EQU #${zx0ScratchEnd.toString(16).toUpperCase().padStart(4, '0')}   ; First byte after shared ZX0 scratch area
`;
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
;   #${currentAddress.toString(16).toUpperCase().padStart(4, '0')}-#${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}: Alignment padding/free RAM (${Math.max(0, zx0LargeScratchBase - currentAddress)} bytes)
;   #${zx0LargeScratchBase.toString(16).toUpperCase().padStart(4, '0')}-#${(zx0ScratchEnd - 1).toString(16).toUpperCase().padStart(4, '0')}: Shared ZX0 scratch (${ZX0_SHARED_SCRATCH_SIZE} bytes, do not use for persistent vars)
;   #${zx0ScratchEnd.toString(16).toUpperCase().padStart(4, '0')}-#F37F: Free RAM after scratch (~${MSX_SYSTEM_RAM_START - zx0ScratchEnd} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================
`;
    return code;
}
