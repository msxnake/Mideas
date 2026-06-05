import { SpriteLayout } from '../types';
import { Msx2PlatformPhysicsConfig } from '../types';
import { V2Options } from '../types';
import { buildSatPatternIndexAsm } from '../satPatternCalc';

export function generateSatWrites(analysis: any, layout: SpriteLayout, physics: Msx2PlatformPhysicsConfig, options: V2Options): string {
  const singleAttr = buildSingleAttrWrites(layout);
  const idleAttr = layout.hasPlayerAnimRoles && layout.idle ? buildRoleAttrWrites(layout, 'idle') : '';
  const walkAttr = layout.hasPlayerAnimRoles && layout.walk ? buildRoleAttrWrites(layout, 'walk') : '';
  const animUpdate = layout.frameCount > 1 || layout.hasPlayerAnimRoles
    ? buildAnimationUpdate(layout)
    : '';

  return `
write_hardware_sprite_attrs:
    ; Writes player and enemy sprite attributes to the SCREEN 4 SAT. Clobbers AF/BC/DE/HL.
${layout.hasPlayerAnimRoles ? `    ld a, (msx2_player_walking_flag)
    or a
    jp nz, .write_walk_player
${idleAttr}    jp .write_common_player
.write_walk_player:
${walkAttr}
.write_common_player:` : singleAttr}
    ld a, 208
    ld hl, #1EF8
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:
${animUpdate ? '    call update_msx2_player_sprite_animation\n' : ''}    call update_msx2_effect_state
    call update_msx2_enemy_positions
    call update_msx2_enemy_state
    call write_hardware_sprite_attrs
    ret

msx2_game_over_idle:
    ld a, (msx2_game_over_restart_lock)
    or a
    jp z, .restart_action_check
    call msx2_control_action_pressed
    or a
    jp nz, .draw_game_over
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .draw_game_over
    xor a
    ld (msx2_game_over_restart_lock), a
    jp .draw_game_over
.restart_action_check:
    call msx2_control_action_pressed
    or a
    jp nz, msx2_restart_game
.restart_space_check:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .draw_game_over
    ld a, 1
    ld (msx2_game_over_restart_lock), a
.draw_game_over:
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

msx2_level_complete_idle:
    call msx2_control_action_pressed
    or a
    jp z, .continue_space_released
    ld a, (msx2_level_continue_lock)
    or a
    jp z, msx2_continue_after_level_complete
    jp .draw_level_complete
.continue_space_released:
    xor a
    ld (msx2_level_continue_lock), a
.draw_level_complete:
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

msx2_continue_after_level_complete:
    call msx2_advance_to_next_wave_screen
    call init_msx2_effect_buffers
    call load_current_msx2_screen4
    call reset_msx2_status_border
    call draw_msx2_stage_banner
    call wait_msx2_stage_banner
    call load_current_msx2_screen4
    xor a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_player_dead_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, #02
    ld (msx2_player_flags), a
    call write_hardware_sprite_attrs
    ret

msx2_advance_to_next_wave_screen:
    ld a, (msx2_current_screen_index)
    inc a
    cp 255
    jp c, .store_next_wave_screen
    xor a
.store_next_wave_screen:
    ld (msx2_current_screen_index), a
    ret

msx2_restart_game:
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_current_msx2_screen4
    call reset_msx2_status_border
    xor a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, #02
    ld (msx2_player_flags), a
    call write_hardware_sprite_attrs
    ret

auto_patrol_hardware_sprite:
    ld a, (msx2_player_sprite_frame)
    inc a
    and 3
    ld (msx2_player_sprite_frame), a
    jp nz, msx2_update_hardware_sprite_vertical
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, move_hardware_sprite_left
    jp move_hardware_sprite_right
`;
}

function buildSingleAttrWrites(layout: SpriteLayout): string {
  return layout.layers.map((layer, layerIndex) => {
    const attrAddr = 0x1E00 + (layerIndex * 4);
    const visible = layout.playerHardwareVisible;
    return `    ; Sprite layer ${layerIndex}: x+${layer.xOffset}, y+${layer.yOffset}
${visible
  ? `    ld a, (msx2_player_sprite_y)
    add a, ${layer.yOffset}`
  : '    ld a, 208'}    ld hl, #${attrAddr.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    add a, ${layer.xOffset}    ld hl, #${(attrAddr + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${buildSatPatternIndexAsm({
  basePatternIndex: layout.basePatternIndex,
  layerCount: layout.layers.length,
  frameCount: layout.frameCount,
  layerIndex,
  mirrorPatternOffset: layout.mirrorPatternOffset,
  authoredFacing: layout.horizontalFacing ? 'right' : undefined,
  labelSuffix: String(layerIndex),
})}
    ld hl, #${(attrAddr + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddr + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
`;
  }).join('\n');
}

function buildRoleAttrWrites(layout: SpriteLayout, role: 'idle' | 'walk'): string {
  const r = role === 'idle' ? layout.idle : layout.walk;
  if (!r) return '';

  return r.layers.map((layer, layerIndex) => {
    const attrAddr = 0x1E00 + (layerIndex * 4);
    const visible = layout.playerHardwareVisible;
    return `    ; Sprite layer ${layerIndex} (${role}): x+${layer.xOffset}, y+${layer.yOffset}
${visible
  ? `    ld a, (msx2_player_sprite_y)
    add a, ${layer.yOffset}`
  : '    ld a, 208'}    ld hl, #${attrAddr.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    add a, ${layer.xOffset}    ld hl, #${(attrAddr + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
${buildSatPatternIndexAsm({
  basePatternIndex: r.basePatternIndex,
  layerCount: r.layers.length,
  frameCount: r.frameCount,
  layerIndex,
  mirrorPatternOffset: r.mirrorPatternOffset,
  authoredFacing: r.facingDirection,
  labelSuffix: `${role}_${layerIndex}`,
  frameMapLabel: r.frameMapLabel,
})}
    ld hl, #${(attrAddr + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddr + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
`;
  }).join('\n');
}

const MULTI_ROLE_ANIM_HEADER = `; ------------------------------------------------------------
; FUNCTION: update_msx2_player_sprite_animation
; ------------------------------------------------------------
; PURPOSE:
;   Advance idle/walk animation counters for multi-role MSX2 hardware sprites.
;
; INPUT:
;   msx2_player_walking_flag = 0 idle branch, nonzero walk branch
;   msx2_player_anim_counter = delay tick counter
;   msx2_player_anim_frame  = current animation frame index
;
; OUTPUT:
;   msx2_player_anim_counter and msx2_player_anim_frame updated on schedule
;
; DESTROYS:
;   AF
;
; PRESERVES:
;   BC, DE, HL, IX, IY
;
; CALLS:
;   none
;
; SIDE EFFECTS:
;   Writes RAM #C01D (msx2_player_anim_counter) and #C01E (msx2_player_anim_frame).
;
; NOTES:
;   Idle and walk use independent delay/frame limits from role layout.
;   No PUSH/POP; callers must not rely on AF after return.
; ------------------------------------------------------------`;

const SINGLE_SPRITE_ANIM_HEADER = `; ------------------------------------------------------------
; FUNCTION: update_msx2_player_sprite_animation
; ------------------------------------------------------------
; PURPOSE:
;   Advance the main hardware sprite animation frame on the configured delay.
;
; INPUT:
;   msx2_player_walking_flag = optional gate when animateOnlyWhenMoving is set
;   msx2_player_anim_counter = delay tick counter
;   msx2_player_anim_frame  = current animation frame index
;
; OUTPUT:
;   msx2_player_anim_counter and msx2_player_anim_frame updated on schedule
;
; DESTROYS:
;   AF
;
; PRESERVES:
;   BC, DE, HL, IX, IY
;
; CALLS:
;   none
;
; SIDE EFFECTS:
;   Writes RAM #C01D (msx2_player_anim_counter) and #C01E (msx2_player_anim_frame).
;
; NOTES:
;   When animateOnlyWhenMoving is enabled, idle resets both counters to zero.
;   No PUSH/POP; callers must not rely on AF after return.
; ------------------------------------------------------------`;

function buildAnimationUpdate(layout: SpriteLayout): string {
  if (layout.hasPlayerAnimRoles) {
    const idleDelay = layout.idle?.delay ?? 0;
    const idleFrameCount = layout.idle?.frameCount ?? 0;
    const walkDelay = layout.walk?.delay ?? 0;
    const walkFrameCount = layout.walk?.frameCount ?? 0;

    return `
${MULTI_ROLE_ANIM_HEADER}
update_msx2_player_sprite_animation:
    ld a, (msx2_player_walking_flag)
    or a
    jp nz, .advance_walk_frame_anim
${layout.usePlayerWalkingFlag ? `    ; Idle: freeze at frame 0
    xor a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ret
` : `    ; Idle animation cycle
    ld a, (msx2_player_anim_counter)
    inc a
    cp ${idleDelay}
    jp nc, .advance_idle_frame_anim
    ld (msx2_player_anim_counter), a
    ret
.advance_idle_frame_anim:
    xor a
    ld (msx2_player_anim_counter), a
    ld a, (msx2_player_anim_frame)
    inc a
    cp ${idleFrameCount}
    jp c, msx2_player_sprite_anim_store
    xor a
    jp msx2_player_sprite_anim_store
`}.advance_walk_frame_anim:
    ld a, (msx2_player_anim_counter)
    inc a
    cp ${walkDelay}
    jp nc, .advance_walk_frame_step
    ld (msx2_player_anim_counter), a
    ret
.advance_walk_frame_step:
    xor a
    ld (msx2_player_anim_counter), a
    ld a, (msx2_player_anim_frame)
    inc a
    cp ${walkFrameCount}
    jp c, msx2_player_sprite_anim_store
    xor a
msx2_player_sprite_anim_store:
    ld (msx2_player_anim_frame), a
    ret
`;
  }

  if (layout.frameCount <= 1) {
    return '';
  }

  return `
${SINGLE_SPRITE_ANIM_HEADER}
update_msx2_player_sprite_animation:
${layout.usePlayerWalkingFlag ? `    ld a, (msx2_player_walking_flag)
    or a
    jp z, .reset_player_sprite_frame_idle
` : ''}    ld a, (msx2_player_anim_counter)
    inc a
    cp ${layout.animationDelayFrames}
    jp nc, .advance_player_sprite_frame
    ld (msx2_player_anim_counter), a
    ret
.advance_player_sprite_frame:
    xor a
    ld (msx2_player_anim_counter), a
    ld a, (msx2_player_anim_frame)
    inc a
    cp ${layout.frameCount}
    jp c, .store_player_sprite_frame
    xor a
.store_player_sprite_frame:
    ld (msx2_player_anim_frame), a
    ret
${layout.usePlayerWalkingFlag ? `.reset_player_sprite_frame_idle:
    xor a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ret
` : ''}`;
}
