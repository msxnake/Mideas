import { SpriteLayout } from '../types';
import { ProjectAnalysis } from '../../../../../asmTemplateGenerator';
import { V2Options } from '../types';
import {
  getHardwareSpriteSource, getHardwareSpriteRuntimeSettings,
  getPlayerRuntimeSource, getPrimaryRuntimeTileScreen,
  formatBytes,
} from '../../msx2Screen4Generator';

export function generateInit(analysis: ProjectAnalysis, layout: SpriteLayout, options: V2Options): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';

  const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
  const enterDB = options.useKonamiDataBank ? '    call msx2_screen4_data_bank_enter\n' : '';
  const leaveDB = options.useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : '';

  return `
init_hardware_sprites:
    ; SCREEN 4 hardware sprite runtime v2. Clobbers AF/BC/DE/HL.
    ; Preserve SCREEN 4 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (RG1SAV)
    or #02
    and #FE
    ld (RG1SAV), a
    ld b, a
    ld c, #01
    call WRTVDP

    ; Sprite attribute/color/pattern tables use the SCREEN 4 V9938 layout.
    ; In sprite mode 2, R#5 selects the combined color+attribute table:
    ; color table #7400, SAT #7600. Bits 0-2 must be 1.
    ld bc, #3F05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0706
    call WRTVDP

${enterDB}    ld hl, msx2_hw_sprite_patterns
    ld de, #3800
    ld bc, msx2_hw_sprite_patterns_end - msx2_hw_sprite_patterns
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_colors
    ld de, #1C00
    ld bc, msx2_hw_sprite_colors_end - msx2_hw_sprite_colors
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_attrs
    ld de, #1E00
    ld bc, 128
    call copy_to_vram_ext
${leaveDB}
    ld a, ${layout.initX}
    ld (msx2_player_sprite_x), a
    ld a, ${layout.initY}
    ld (msx2_player_sprite_y), a
    ld a, ${layout.initialFacingDx}
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
    ld a, ${layout.initialFrame}
    ld (msx2_player_sprite_frame), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_score_lo), a
    ld (msx2_score_hi), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_score_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call upload_hardware_sprite_attrs

    xor a
    ld bc, #000E
    call WRTVDP
    ret

copy_to_vram_ext:
    ; HL=RAM/ROM source, DE=absolute VRAM destination, BC=length.
    ; Disables IRQ while R#14/VRAM address are being changed through direct VDP ports.
    ; Clobbers AF/BC/DE/HL. Preserves IX/IY. RAM impact: none.
    di
    ld a, d
    and #C0
    rlca
    rlca
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    in a, (VDP_CTRL_PORT)
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.copy_loop:
    ld a, (hl)
    out (VDP_DATA_PORT), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .copy_loop
    xor a
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ei
    ret
`;
}
