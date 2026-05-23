; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: msx2_screen4_pacman_player_only
; Screen mode: SCREEN 4 (Graphics II)
; ROM mode requested: simple32k
; Mapper requested: konami
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
FILVRM  EQU #0056
WRTVRM  EQU #004D
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
CHGET   EQU #009F
GTSTCK  EQU #00D5
SNSMAT  EQU #0141
HKEY    EQU #F3DB
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
VDP_DATA_PORT EQU #98
VDP_CTRL_PORT EQU #99
SCREEN4_PATTERN_VRAM EQU #0000
SCREEN4_NAME_VRAM EQU #1800
SCREEN4_COLOR_VRAM EQU #2000
SCREEN4_PATTERN_SIZE EQU 6144
SCREEN4_COLOR_SIZE EQU 6144
SCREEN4_NAME_SIZE EQU 768
msx2_player_sprite_x EQU #C000
msx2_player_sprite_y EQU #C001
msx2_player_sprite_dx EQU #C002
msx2_player_sprite_frame EQU #C003
msx2_current_collision_ptr EQU #C004
msx2_current_effects_ptr EQU #C006
msx2_player_jump_frames EQU #C008
msx2_player_on_ground EQU #C009
msx2_player_jump_lock EQU #C00A
msx2_current_screen_index EQU #C00B
msx2_player_dead_flag EQU #C00C
msx2_exit_reached_flag EQU #C00D
msx2_collectible_count EQU #C00E
msx2_collectible_latch EQU #C00F
msx2_exit_blocked_flag EQU #C010
msx2_lives EQU #C011
msx2_game_over_flag EQU #C012
msx2_game_over_restart_lock EQU #C013
msx2_level_complete_flag EQU #C014
msx2_level_continue_lock EQU #C015
msx2_enemy_hit_flag EQU #C016
msx2_enemy_damage_cooldown EQU #C017
msx2_air_value EQU #C018
msx2_air_frame_counter EQU #C019
msx2_current_behavior_ptr EQU #C01A
msx2_snake_growth_pending EQU #C01C
msx2_player_anim_counter EQU #C01D
msx2_player_anim_frame EQU #C01E
msx2_player_bullet_active EQU #C01F
msx2_player_bullet_x EQU #C020
msx2_player_bullet_y EQU #C021
msx2_player_bullet_cooldown EQU #C022
msx2_score_lo EQU #C023
msx2_score_hi EQU #C024
msx2_score_digit_vram EQU #C025
msx2_runtime_frame_counter EQU #C026
msx2_enemy_bullet_active EQU #C027
msx2_enemy_bullet_x EQU #C028
msx2_enemy_bullet_y EQU #C029
msx2_enemy_bullet_cooldown EQU #C02A
msx2_score_work_lo EQU #C02B
msx2_score_work_hi EQU #C02C
msx2_player_bullet_1_active EQU #C02D
msx2_player_bullet_1_x EQU #C02E
msx2_player_bullet_1_y EQU #C02F
msx2_effects_runtime_buffers EQU #C030
msx2_effects_runtime_scratch EQU #C200
msx2_enemy_runtime_x EQU #C2C0
msx2_enemy_runtime_y EQU #C2CC
msx2_enemy_runtime_dx EQU #C2D8
msx2_enemy_runtime_dy EQU #C2E4
msx2_enemy_runtime_mode EQU #C2F0
msx2_enemy_runtime_speed EQU #C2FC
msx2_enemy_runtime_tick EQU #C308
msx2_runtime_ram_end EQU #C314
msx2_runtime_ram_limit EQU #F300
msx2_layer_size EQU 192
msx2_required_collectibles EQU 0

    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    im 1
    ld sp, #F380
    call map_page2_to_cart_primary

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    call DISSCR
    ld a, 4
    call CHGMOD
    ld bc, #0602
    call WRTVDP
    ld bc, #FF03
    call WRTVDP
    ld bc, #0304
    call WRTVDP
    ld bc, #000A
    call WRTVDP

    call load_screen4_palette
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites

    call ENASCR
    ei

    ld a, 0
    ld (msx2_current_screen_index), a
    call load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites

.main_loop:
    call update_hardware_sprite_input

    call update_msx2_air_timer

    call wait_frame_busy
    jr .main_loop

wait_frame_busy:
    ; Simple ROM backend delay. Avoid HALT here so C-BIOS/OpenMSX smoke tests
    ; keep advancing even when no VBlank hook is installed by the minimal backend.
    ld bc, #0800
.wait_loop:
    dec bc
    ld a, b
    or c
    jp nz, .wait_loop
    ret

map_page2_to_cart_primary:
    ; Keep #8000-#BFFF on the same primary slot as the cart page at #4000.
    ; Kept for compatibility with the previous MSX2 backend and larger inline data.
    in a, (#A8)
    ld b, a
    and #0C
    add a, a
    add a, a
    ld c, a
    ld a, b
    and #CF
    or c
    out (#A8), a
    ret

wait_key:
    call CHGET
    ret

clear_screen4_names:
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    ret

init_hardware_sprites:
    ; SCREEN 4 hardware sprite runtime. Clobbers AF/BC/DE/HL.
    ; Preserve the SCREEN 4 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (#F3E0)
    or #02
    and #FE
    ld (#F3E0), a
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

    ld hl, msx2_hw_sprite_patterns
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

    ld a, 112
    ld (msx2_player_sprite_x), a
    ld a, 160
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_sprite_frame), a

    xor a

    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
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
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
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
    ; HL=RAM/ROM source, DE=absolute VRAM destination, BC=length. Clobbers AF/BC/DE/HL.
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
    ret

write_vram_byte_ext:
    ; A=data, HL=absolute VRAM destination. Clobbers AF/B.
    ld b, a
    ld a, h
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
    ld a, l
    out (VDP_CTRL_PORT), a
    ld a, h
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld a, b
    out (VDP_DATA_PORT), a
    xor a
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret

clear_screen4_name_cell_16:
    ; HL=top-left SCREEN 4 name-table cell for a 16x16 block. Clobbers AF/BC/HL.
    xor a
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    ld bc, 31
    add hl, bc
    xor a
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    ret


draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
    ; Inline status HUD disabled for SCREEN 4 until it is tile/name-table based. Clobbers none.
    ret

draw_msx2_game_over_banner:
    ; SCREEN 4 banners must use name/pattern data, not bitmap writes.
    ret

draw_msx2_level_complete_banner:
    ; SCREEN 4 banners must use name/pattern data, not bitmap writes.
    ret

update_msx2_air_timer:
    ; Decrements the SCREEN 4 air/time resource on a coarse frame divider. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_air_value)
    or a
    ret z
    ld a, (msx2_air_frame_counter)
    inc a
    cp 48
    jp nc, .air_tick
    ld (msx2_air_frame_counter), a
    ret
.air_tick:
    xor a
    ld (msx2_air_frame_counter), a
    ld a, (msx2_air_value)
    or a
    jp z, .air_empty
    dec a
    ld (msx2_air_value), a
    call draw_msx2_air_hud
    ld a, (msx2_air_value)
    or a
    ret nz
.air_empty:
    ld a, 1
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret


update_hardware_sprite_input_maze:
    ; Four-direction maze movement: no gravity, no jump. Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 1
    jp z, maze_latch_up
    cp 2
    jp z, maze_latch_up
    cp 8
    jp z, maze_latch_up
    cp 5
    jp z, maze_latch_down
    cp 4
    jp z, maze_latch_down
    cp 6
    jp z, maze_latch_down
    cp 3
    jp z, maze_latch_right
    cp 7
    jp z, maze_latch_left
    jp maze_try_latched_direction

maze_latch_up:
    ld a, 2
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_latch_down:
    ld a, 3
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_latch_right:
    ld a, 1
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_latch_left:
    xor a
    ld (msx2_player_sprite_frame), a
    jp maze_try_latched_direction

maze_try_latched_direction:
    ld a, (msx2_player_sprite_frame)
    cp 2
    jp z, maze_request_up
    cp 3
    jp z, maze_request_down
    or a
    jp z, maze_request_left
    jp maze_request_right

maze_can_change_direction_16:
    ld a, (msx2_player_sprite_x)
    and #0F
    ret nz
    ld a, (msx2_player_sprite_y)
    and #0F
    ret

maze_request_up:
    ld a, (msx2_player_sprite_dx)
    cp 2
    jp z, maze_move_up
    call maze_can_change_direction_16
    jp z, maze_move_up
    jp maze_continue_current_direction

maze_request_down:
    ld a, (msx2_player_sprite_dx)
    cp 3
    jp z, maze_move_down
    call maze_can_change_direction_16
    jp z, maze_move_down
    jp maze_continue_current_direction

maze_request_right:
    ld a, (msx2_player_sprite_dx)
    cp 1
    jp z, maze_move_right
    call maze_can_change_direction_16
    jp z, maze_move_right
    jp maze_continue_current_direction

maze_request_left:
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, maze_move_left
    call maze_can_change_direction_16
    jp z, maze_move_left
    jp maze_continue_current_direction

maze_continue_current_direction:
    ld a, (msx2_player_sprite_dx)
    cp 2
    jp z, maze_continue_up
    cp 3
    jp z, maze_continue_down
    or a
    jp z, maze_continue_left
    jp maze_continue_right

maze_move_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, maze_continue_current_direction
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    ld a, 2
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, maze_continue_current_direction
    inc a
    add a, 15
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_y)
    inc a
    ld (msx2_player_sprite_y), a
    ld a, 3
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_right:
    ld a, (msx2_player_sprite_x)
    cp 239
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_left:
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, maze_continue_current_direction
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_continue_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs

maze_continue_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    add a, 15
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_y)
    inc a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs

maze_continue_right:
    ld a, (msx2_player_sprite_x)
    cp 239
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    jp upload_hardware_sprite_attrs

maze_continue_left:
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    jp upload_hardware_sprite_attrs

update_hardware_sprite_input_shooter_horizontal:
    ; Galaxian-style horizontal player control: left/right only, no jump/gravity.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 2
    jp z, move_hardware_sprite_right_flat
    cp 3
    jp z, move_hardware_sprite_right_flat
    cp 4
    jp z, move_hardware_sprite_right_flat
    cp 6
    jp z, move_hardware_sprite_left_flat
    cp 7
    jp z, move_hardware_sprite_left_flat
    cp 8
    jp z, move_hardware_sprite_left_flat
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right_flat:
    ld a, (msx2_player_sprite_x)
    cp 239
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_left_flat:
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, upload_hardware_sprite_attrs
    jp c, upload_hardware_sprite_attrs
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

update_msx2_player_bullet:
    ; Two-slot player bullet pool for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_cooldown)
    or a
    jp z, .bullet_cooldown_done
    dec a
    ld (msx2_player_bullet_cooldown), a
.bullet_cooldown_done:
    call update_msx2_player_bullet_slot_0
    call update_msx2_player_bullet_slot_1
    jp .bullet_try_fire

update_msx2_player_bullet_slot_0:
    ld a, (msx2_player_bullet_active)
    or a
    ret z
    ld a, (msx2_player_bullet_y)
    cp 8
    jp c, .bullet_deactivate_0
    sub 6
    ld (msx2_player_bullet_y), a
    call msx2_player_bullet_check_enemy_collision
    ret
.bullet_deactivate_0:
    xor a
    ld (msx2_player_bullet_active), a
    ret

update_msx2_player_bullet_slot_1:
    ld a, (msx2_player_bullet_1_active)
    or a
    ret z
    ld a, (msx2_player_bullet_1_y)
    cp 8
    jp c, .bullet_deactivate_1
    sub 6
    ld (msx2_player_bullet_1_y), a
    call msx2_player_bullet_1_check_enemy_collision
    ret
.bullet_deactivate_1:
    xor a
    ld (msx2_player_bullet_1_active), a
    ret

.bullet_try_fire:
    ld a, (msx2_player_bullet_cooldown)
    or a
    ret nz
    ld a, 8
    call SNSMAT
    bit 0, a
    ret nz
    ld a, (msx2_player_bullet_active)
    or a
    jp z, .bullet_spawn_slot_0
    ld a, (msx2_player_bullet_1_active)
    or a
    ret nz
    jp .bullet_spawn_slot_1
.bullet_spawn_slot_0:
    ld a, (msx2_player_sprite_x)
    add a, 6
    ld (msx2_player_bullet_x), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_spawn_top
    sub 8
    jp .bullet_spawn_store_y
.bullet_spawn_top:
    xor a
.bullet_spawn_store_y:
    ld (msx2_player_bullet_y), a
    ld a, 1
    ld (msx2_player_bullet_active), a
    ld a, 8
    ld (msx2_player_bullet_cooldown), a
    ret
.bullet_spawn_slot_1:
    ld a, (msx2_player_sprite_x)
    add a, 6
    ld (msx2_player_bullet_1_x), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_1_spawn_top
    sub 8
    jp .bullet_1_spawn_store_y
.bullet_1_spawn_top:
    xor a
.bullet_1_spawn_store_y:
    ld (msx2_player_bullet_1_y), a
    ld a, 1
    ld (msx2_player_bullet_1_active), a
    ld a, 8
    ld (msx2_player_bullet_cooldown), a
    ret

msx2_player_bullet_check_enemy_collision:
    ; Hides the hit enemy slot and increments the internal score. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .bullet_no_enemy_slot_0_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_0
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_0
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_0
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_0:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .bullet_no_enemy_slot_0_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_1
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_1
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_1
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_1:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .bullet_no_enemy_slot_0_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_2
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_2
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_2
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_2:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .bullet_no_enemy_slot_0_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_3
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_3
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_3
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_3:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .bullet_no_enemy_slot_0_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_4
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_4
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_4
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_4:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .bullet_no_enemy_slot_0_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_5
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_5
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_5
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_5:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .bullet_no_enemy_slot_0_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_6
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_6
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_6
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_6:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .bullet_no_enemy_slot_0_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_7
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_7
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_7
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_7:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .bullet_no_enemy_slot_0_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_8
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_8
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_8
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_8:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .bullet_no_enemy_slot_0_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_9
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_9
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_9
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_9:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .bullet_no_enemy_slot_0_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_10
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_10
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_10
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_10:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .bullet_no_enemy_slot_0_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_11
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_11
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_11
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_11:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_0_11:
    ret

msx2_player_bullet_1_check_enemy_collision:
    ; Hides the hit enemy slot and increments the internal score. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .bullet_no_enemy_slot_1_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_0
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_0
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_0
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_0:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .bullet_no_enemy_slot_1_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_1
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_1
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_1
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_1:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .bullet_no_enemy_slot_1_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_2
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_2
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_2
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_2:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .bullet_no_enemy_slot_1_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_3
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_3
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_3
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_3:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .bullet_no_enemy_slot_1_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_4
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_4
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_4
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_4:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .bullet_no_enemy_slot_1_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_5
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_5
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_5
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_5:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .bullet_no_enemy_slot_1_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_6
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_6
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_6
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_6:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .bullet_no_enemy_slot_1_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_7
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_7
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_7
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_7:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .bullet_no_enemy_slot_1_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_8
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_8
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_8
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_8:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .bullet_no_enemy_slot_1_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_9
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_9
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_9
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_9:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .bullet_no_enemy_slot_1_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_10
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_10
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_10
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_10:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .bullet_no_enemy_slot_1_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_11
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_11
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_11
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_11:
    call draw_msx2_score_hud
    call msx2_check_enemy_wave_complete
    ret
.bullet_no_enemy_slot_1_11:
    ret

msx2_check_enemy_wave_complete:
    ; Completes Galaxian-style screens when every active enemy slot is hidden. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    or a
    ret z
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .wave_slot_0_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    ret c
.wave_slot_0_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .wave_slot_1_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_1_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .wave_slot_2_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_2_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .wave_slot_3_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_3_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .wave_slot_4_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_4_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .wave_slot_5_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_5_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .wave_slot_6_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_6_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .wave_slot_7_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_7_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .wave_slot_8_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_8_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .wave_slot_9_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_9_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .wave_slot_10_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_10_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .wave_slot_11_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_11_not_active:
    ld a, 1
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_enemy_bullet_active), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

update_msx2_enemy_bullet:
    ; Single enemy projectile for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_enemy_bullet_cooldown)
    or a
    jp z, .enemy_bullet_cooldown_done
    dec a
    ld (msx2_enemy_bullet_cooldown), a
.enemy_bullet_cooldown_done:
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_try_spawn
    ld a, (msx2_enemy_bullet_y)
    cp 204
    jp nc, .enemy_bullet_deactivate
    add a, 2
    ld (msx2_enemy_bullet_y), a
    call msx2_enemy_bullet_check_player_collision
    ret
.enemy_bullet_deactivate:
    xor a
    ld (msx2_enemy_bullet_active), a
    ret
.enemy_bullet_try_spawn:
    ld a, (msx2_enemy_bullet_cooldown)
    or a
    ret nz
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .enemy_bullet_no_spawn_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_0
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .enemy_bullet_no_spawn_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_1
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .enemy_bullet_no_spawn_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_2
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .enemy_bullet_no_spawn_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_3
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .enemy_bullet_no_spawn_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_4
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .enemy_bullet_no_spawn_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_5
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .enemy_bullet_no_spawn_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_6
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .enemy_bullet_no_spawn_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_7
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .enemy_bullet_no_spawn_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_8
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .enemy_bullet_no_spawn_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_9
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .enemy_bullet_no_spawn_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_10
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .enemy_bullet_no_spawn_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_11
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_11:
    ret

msx2_enemy_bullet_check_player_collision:
    ; Collides enemy projectile with player 16x16 body. Clobbers AF/BC/DE/HL.
    ld a, (msx2_enemy_bullet_y)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_y)
    ld b, a
    ld a, c
    cp b
    ret c
    ld a, b
    add a, 15
    cp c
    ret c
    ld a, (msx2_enemy_bullet_x)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, c
    cp b
    ret c
    ld a, b
    add a, 15
    cp c
    ret c
    xor a
    ld (msx2_enemy_bullet_active), a
    ld a, 80
    ld (msx2_enemy_bullet_cooldown), a
    call msx2_apply_damage_respawn
    ret

update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right plus jump/gravity.
    ; Clobbers AF/BC/DE/HL.
    jp update_hardware_sprite_input_maze


    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 1
    jp z, try_msx2_ladder_up
    cp 2
    jp z, try_msx2_ladder_up_or_right
    cp 8
    jp z, try_msx2_ladder_up_or_left
    cp 5
    jp z, try_msx2_ladder_down
    cp 4
    jp z, try_msx2_ladder_down_or_right
    cp 6
    jp z, try_msx2_ladder_down_or_left
    cp 2
    jp z, move_hardware_sprite_right
    cp 3
    jp z, move_hardware_sprite_right
    cp 4
    jp z, move_hardware_sprite_right
    cp 6
    jp z, move_hardware_sprite_left
    cp 7
    jp z, move_hardware_sprite_left
    cp 8
    jp z, move_hardware_sprite_left
    jp update_hardware_sprite_vertical

try_msx2_ladder_up:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp update_hardware_sprite_vertical

try_msx2_ladder_up_or_right:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp move_hardware_sprite_right

try_msx2_ladder_up_or_left:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp move_hardware_sprite_left

try_msx2_ladder_down:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp update_hardware_sprite_vertical

try_msx2_ladder_down_or_right:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp move_hardware_sprite_right

try_msx2_ladder_down_or_left:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp move_hardware_sprite_left

move_msx2_ladder_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

move_msx2_ladder_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right:
    ld a, (msx2_player_sprite_x)
    cp 239
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .right_blocked
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp update_hardware_sprite_vertical
.right_blocked:
    xor a
    ld (msx2_player_sprite_dx), a
    jp update_hardware_sprite_vertical

move_hardware_sprite_left:
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .left_blocked
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp update_hardware_sprite_vertical
.left_blocked:
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp update_hardware_sprite_vertical

msx2_game_over_idle:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .restart_space_released
    ld a, (msx2_game_over_restart_lock)
    or a
    jp z, msx2_restart_game
    jp .draw_game_over
.restart_space_released:
    xor a
    ld (msx2_game_over_restart_lock), a
.draw_game_over:
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

msx2_level_complete_idle:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .continue_space_released
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
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4
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
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    call write_hardware_sprite_attrs
    ret

msx2_restart_game:
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4
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
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    call write_hardware_sprite_attrs
    ret

auto_patrol_hardware_sprite:
    ; Move every 4 frames so the sprite visibly patrols without racing.
    ld a, (msx2_player_sprite_frame)
    inc a
    and 3
    ld (msx2_player_sprite_frame), a
    jp nz, update_hardware_sprite_vertical
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, move_hardware_sprite_left
    jp move_hardware_sprite_right

update_hardware_sprite_vertical:
    ; Jump uses SPACE on keyboard matrix row 8, bit 0. Gravity is 1 px/frame.
    ; Clobbers AF/BC/DE/HL.
    ; Maze/Pac-Man mode has no platform vertical physics.
    jp upload_hardware_sprite_attrs

    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .space_released
    ld a, (msx2_player_jump_lock)
    or a
    jp nz, .after_jump_input
    ld a, (msx2_player_on_ground)
    or a
    jp z, .after_jump_input
    ld a, 22
    ld (msx2_player_jump_frames), a
    xor a
    ld (msx2_player_on_ground), a
    ld a, 1
    ld (msx2_player_jump_lock), a
    jp .after_jump_input
.space_released:
    xor a
    ld (msx2_player_jump_lock), a
.after_jump_input:
    ld a, (msx2_player_jump_frames)
    or a
    jp z, apply_hardware_sprite_gravity
    ld a, (msx2_player_sprite_y)
    or a
    jp z, .cancel_jump
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, .cancel_jump
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    ld a, (msx2_player_jump_frames)
    dec a
    ld (msx2_player_jump_frames), a
    jp upload_hardware_sprite_attrs
.cancel_jump:
    xor a
    ld (msx2_player_jump_frames), a
    jp upload_hardware_sprite_attrs

apply_hardware_sprite_gravity:
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .grounded
    xor a
    ld (msx2_player_on_ground), a
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs
.grounded:
    ld a, 1
    ld (msx2_player_on_ground), a
    call apply_msx2_conveyor
    jp upload_hardware_sprite_attrs

apply_msx2_conveyor:
    ; Behavior code 2 pushes right, code 3 pushes left. Clobbers AF/BC/DE/HL.
    call msx2_behavior_below_player_center
    cp 2
    jp z, .conveyor_right
    cp 3
    jp z, .conveyor_left
    ret
.conveyor_right:
    ld a, (msx2_player_sprite_x)
    cp 239
    ret nc
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ret
.conveyor_left:
    ld a, (msx2_player_sprite_x)
    cp 1
    ret z
    ret c
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    ret

write_hardware_sprite_attrs:
    ; Writes player and enemy sprite attributes to the SCREEN 4 SAT. Clobbers AF/BC/DE/HL.
    ; Sprite layer 0: x+0, y+0
    ld a, (msx2_player_sprite_y)
    ld hl, #1E00
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    ld hl, #1E01
    call write_vram_byte_ext
    ld a, 0
    ld hl, #1E02
    call write_vram_byte_ext
    xor a
    ld hl, #1E03
    call write_vram_byte_ext

    ; Sprite layer 1: x+0, y+0
    ld a, (msx2_player_sprite_y)
    ld hl, #1E04
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    ld hl, #1E05
    call write_vram_byte_ext
    ld a, 4
    ld hl, #1E06
    call write_vram_byte_ext
    xor a
    ld hl, #1E07
    call write_vram_byte_ext

    ; Enemy/hazard sprite slot 0.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp nc, .enemy_sprite_0_visible
    ld a, 208
    ld hl, #1E08
    call write_vram_byte_ext
    jp .enemy_sprite_0_done
.enemy_sprite_0_visible:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    ld hl, #1E08
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    ld hl, #1E09
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E0A
    call write_vram_byte_ext
    xor a
    ld hl, #1E0B
    call write_vram_byte_ext
.enemy_sprite_0_done:

    ; Enemy/hazard sprite slot 1.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, .enemy_sprite_1_visible
    ld a, 208
    ld hl, #1E0C
    call write_vram_byte_ext
    jp .enemy_sprite_1_done
.enemy_sprite_1_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E0C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E0D
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E0E
    call write_vram_byte_ext
    xor a
    ld hl, #1E0F
    call write_vram_byte_ext
.enemy_sprite_1_done:

    ; Enemy/hazard sprite slot 2.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp nc, .enemy_sprite_2_visible
    ld a, 208
    ld hl, #1E10
    call write_vram_byte_ext
    jp .enemy_sprite_2_done
.enemy_sprite_2_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #1E10
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #1E11
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E12
    call write_vram_byte_ext
    xor a
    ld hl, #1E13
    call write_vram_byte_ext
.enemy_sprite_2_done:

    ; Enemy/hazard sprite slot 3.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp nc, .enemy_sprite_3_visible
    ld a, 208
    ld hl, #1E14
    call write_vram_byte_ext
    jp .enemy_sprite_3_done
.enemy_sprite_3_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #1E14
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #1E15
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E16
    call write_vram_byte_ext
    xor a
    ld hl, #1E17
    call write_vram_byte_ext
.enemy_sprite_3_done:

    ; Enemy/hazard sprite slot 4.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp nc, .enemy_sprite_4_visible
    ld a, 208
    ld hl, #1E18
    call write_vram_byte_ext
    jp .enemy_sprite_4_done
.enemy_sprite_4_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de
    ld a, (hl)
    ld hl, #1E18
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de
    ld a, (hl)
    ld hl, #1E19
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E1A
    call write_vram_byte_ext
    xor a
    ld hl, #1E1B
    call write_vram_byte_ext
.enemy_sprite_4_done:

    ; Enemy/hazard sprite slot 5.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp nc, .enemy_sprite_5_visible
    ld a, 208
    ld hl, #1E1C
    call write_vram_byte_ext
    jp .enemy_sprite_5_done
.enemy_sprite_5_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de
    ld a, (hl)
    ld hl, #1E1C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de
    ld a, (hl)
    ld hl, #1E1D
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E1E
    call write_vram_byte_ext
    xor a
    ld hl, #1E1F
    call write_vram_byte_ext
.enemy_sprite_5_done:

    ; Enemy/hazard sprite slot 6.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp nc, .enemy_sprite_6_visible
    ld a, 208
    ld hl, #1E20
    call write_vram_byte_ext
    jp .enemy_sprite_6_done
.enemy_sprite_6_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de
    ld a, (hl)
    ld hl, #1E20
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de
    ld a, (hl)
    ld hl, #1E21
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E22
    call write_vram_byte_ext
    xor a
    ld hl, #1E23
    call write_vram_byte_ext
.enemy_sprite_6_done:

    ; Enemy/hazard sprite slot 7.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp nc, .enemy_sprite_7_visible
    ld a, 208
    ld hl, #1E24
    call write_vram_byte_ext
    jp .enemy_sprite_7_done
.enemy_sprite_7_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de
    ld a, (hl)
    ld hl, #1E24
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de
    ld a, (hl)
    ld hl, #1E25
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E26
    call write_vram_byte_ext
    xor a
    ld hl, #1E27
    call write_vram_byte_ext
.enemy_sprite_7_done:

    ; Enemy/hazard sprite slot 8.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp nc, .enemy_sprite_8_visible
    ld a, 208
    ld hl, #1E28
    call write_vram_byte_ext
    jp .enemy_sprite_8_done
.enemy_sprite_8_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de
    ld a, (hl)
    ld hl, #1E28
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de
    ld a, (hl)
    ld hl, #1E29
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E2A
    call write_vram_byte_ext
    xor a
    ld hl, #1E2B
    call write_vram_byte_ext
.enemy_sprite_8_done:

    ; Enemy/hazard sprite slot 9.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp nc, .enemy_sprite_9_visible
    ld a, 208
    ld hl, #1E2C
    call write_vram_byte_ext
    jp .enemy_sprite_9_done
.enemy_sprite_9_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de
    ld a, (hl)
    ld hl, #1E2C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de
    ld a, (hl)
    ld hl, #1E2D
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E2E
    call write_vram_byte_ext
    xor a
    ld hl, #1E2F
    call write_vram_byte_ext
.enemy_sprite_9_done:

    ; Enemy/hazard sprite slot 10.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp nc, .enemy_sprite_10_visible
    ld a, 208
    ld hl, #1E30
    call write_vram_byte_ext
    jp .enemy_sprite_10_done
.enemy_sprite_10_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de
    ld a, (hl)
    ld hl, #1E30
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de
    ld a, (hl)
    ld hl, #1E31
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E32
    call write_vram_byte_ext
    xor a
    ld hl, #1E33
    call write_vram_byte_ext
.enemy_sprite_10_done:

    ; Enemy/hazard sprite slot 11.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp nc, .enemy_sprite_11_visible
    ld a, 208
    ld hl, #1E34
    call write_vram_byte_ext
    jp .enemy_sprite_11_done
.enemy_sprite_11_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de
    ld a, (hl)
    ld hl, #1E34
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de
    ld a, (hl)
    ld hl, #1E35
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E36
    call write_vram_byte_ext
    xor a
    ld hl, #1E37
    call write_vram_byte_ext
.enemy_sprite_11_done:
    ; Player bullet hardware sprite slot 0.
    ld a, (msx2_player_bullet_active)
    or a
    jp nz, .player_bullet_sprite_visible
    ld a, 208
    ld hl, #1E38
    call write_vram_byte_ext
    jp .player_bullet_sprite_done
.player_bullet_sprite_visible:
    ld a, (msx2_player_bullet_y)
    ld hl, #1E38
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_x)
    ld hl, #1E39
    call write_vram_byte_ext
    ld a, 12
    ld hl, #1E3A
    call write_vram_byte_ext
    xor a
    ld hl, #1E3B
    call write_vram_byte_ext
.player_bullet_sprite_done:
    ; Player bullet hardware sprite slot 1.
    ld a, (msx2_player_bullet_1_active)
    or a
    jp nz, .player_bullet_1_sprite_visible
    ld a, 208
    ld hl, #1E3C
    call write_vram_byte_ext
    jp .player_bullet_1_sprite_done
.player_bullet_1_sprite_visible:
    ld a, (msx2_player_bullet_1_y)
    ld hl, #1E3C
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_1_x)
    ld hl, #1E3D
    call write_vram_byte_ext
    ld a, 12
    ld hl, #1E3E
    call write_vram_byte_ext
    xor a
    ld hl, #1E3F
    call write_vram_byte_ext
.player_bullet_1_sprite_done:
    ; Enemy bullet hardware sprite slot.
    ld a, (msx2_enemy_bullet_active)
    or a
    jp nz, .enemy_bullet_sprite_visible
    ld a, 208
    ld hl, #1E40
    call write_vram_byte_ext
    jp .enemy_bullet_sprite_done
.enemy_bullet_sprite_visible:
    ld a, (msx2_enemy_bullet_y)
    ld hl, #1E40
    call write_vram_byte_ext
    ld a, (msx2_enemy_bullet_x)
    ld hl, #1E41
    call write_vram_byte_ext
    ld a, 16
    ld hl, #1E42
    call write_vram_byte_ext
    xor a
    ld hl, #1E43
    call write_vram_byte_ext
.enemy_bullet_sprite_done:
    ld a, 208
    ld hl, #1E44
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:

    call update_msx2_effect_state
    call update_msx2_enemy_positions
    call update_msx2_enemy_state
    call write_hardware_sprite_attrs
    ret

msx2_reset_enemy_runtime_for_current_screen:
    ; Copy static enemy slots for current screen into mutable runtime RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld de, msx2_enemy_runtime_x
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld de, msx2_enemy_runtime_y
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_dx
    add hl, de
    ld de, msx2_enemy_runtime_dx
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_dy
    add hl, de
    ld de, msx2_enemy_runtime_dy
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_mode
    add hl, de
    ld de, msx2_enemy_runtime_mode
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_speed
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_tick
    ld bc, 12
    ldir
    ret

update_msx2_enemy_positions:
    ; Move active enemy/hazard runtime slots before collision checks.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    call update_msx2_enemy_position_slot_0
    call update_msx2_enemy_position_slot_1
    call update_msx2_enemy_position_slot_2
    call update_msx2_enemy_position_slot_3
    call update_msx2_enemy_position_slot_4
    call update_msx2_enemy_position_slot_5
    call update_msx2_enemy_position_slot_6
    call update_msx2_enemy_position_slot_7
    call update_msx2_enemy_position_slot_8
    call update_msx2_enemy_position_slot_9
    call update_msx2_enemy_position_slot_10
    call update_msx2_enemy_position_slot_11
    ret

update_msx2_enemy_position_slot_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    ret c
    ld hl, msx2_enemy_runtime_mode

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_0_dive
    cp 2
    jp z, .enemy_slot_0_ghost_maze
    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_check_y
    cp #FF
    jp z, .enemy_slot_0_left
.enemy_slot_0_right:
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_0_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    ret
.enemy_slot_0_turn_left:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), #FF
.enemy_slot_0_left:
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_0_turn_right
    jp z, .enemy_slot_0_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    ret
.enemy_slot_0_turn_right:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 1
    ret
.enemy_slot_0_check_y:
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_0_up
.enemy_slot_0_down:
    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_0_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    ret
.enemy_slot_0_turn_up:
    ld hl, msx2_enemy_runtime_dy

    ld (hl), #FF
.enemy_slot_0_up:
    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_0_turn_down
    jp z, .enemy_slot_0_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    ret
.enemy_slot_0_turn_down:
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 1
    ret

.enemy_slot_0_dive:
    ld hl, msx2_enemy_runtime_tick

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_0_dive_active:
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_0_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_0_dive_left
    jp z, .enemy_slot_0_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_0_dive_left:
    dec b
    ld (hl), b
.enemy_slot_0_dive_done:
    ret
.enemy_slot_0_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick

    ld (hl), a
    ret

.enemy_slot_0_ghost_maze:
    ld hl, msx2_enemy_runtime_tick

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_0_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed

    ld a, (hl)
    or a
    jp nz, .enemy_slot_0_ghost_store_tick
    ld a, 2
.enemy_slot_0_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick

    ld (hl), a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_0_ghost_forward
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_0_ghost_forward
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_0_ghost_prefer_left
.enemy_slot_0_ghost_prefer_right:
    jp .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_prefer_left:
    jp .enemy_slot_0_ghost_try_left_first
.enemy_slot_0_ghost_try_right_first:
    call .enemy_slot_0_ghost_can_right
    jp z, .enemy_slot_0_ghost_set_right
    jp .enemy_slot_0_ghost_try_vertical
.enemy_slot_0_ghost_try_left_first:
    call .enemy_slot_0_ghost_can_left
    jp z, .enemy_slot_0_ghost_set_left
.enemy_slot_0_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_0_ghost_try_up_first
    call .enemy_slot_0_ghost_can_down
    jp z, .enemy_slot_0_ghost_set_down
    call .enemy_slot_0_ghost_can_up
    jp z, .enemy_slot_0_ghost_set_up
    jp .enemy_slot_0_ghost_try_reverse
.enemy_slot_0_ghost_try_up_first:
    call .enemy_slot_0_ghost_can_up
    jp z, .enemy_slot_0_ghost_set_up
    call .enemy_slot_0_ghost_can_down
    jp z, .enemy_slot_0_ghost_set_down
.enemy_slot_0_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_set_left
    cp #FF
    jp z, .enemy_slot_0_ghost_set_right
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_set_up
    cp #FF
    jp z, .enemy_slot_0_ghost_set_down
    ret
.enemy_slot_0_ghost_forward:
    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_0_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_0_ghost_move_up_checked
    jp .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 0
    jp .enemy_slot_0_ghost_move_right
.enemy_slot_0_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 0
    jp .enemy_slot_0_ghost_move_left
.enemy_slot_0_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 1
    jp .enemy_slot_0_ghost_move_down
.enemy_slot_0_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy

    ld (hl), #FF
    jp .enemy_slot_0_ghost_move_up
.enemy_slot_0_ghost_move_right_checked:
    call .enemy_slot_0_ghost_can_right
    jp nz, .enemy_slot_0_ghost_try_vertical
.enemy_slot_0_ghost_move_right:
    ld hl, msx2_enemy_runtime_x

    inc (hl)
    ret
.enemy_slot_0_ghost_move_left_checked:
    call .enemy_slot_0_ghost_can_left
    jp nz, .enemy_slot_0_ghost_try_vertical
.enemy_slot_0_ghost_move_left:
    ld hl, msx2_enemy_runtime_x

    dec (hl)
    ret
.enemy_slot_0_ghost_move_down_checked:
    call .enemy_slot_0_ghost_can_down
    jp nz, .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_move_down:
    ld hl, msx2_enemy_runtime_y

    inc (hl)
    ret
.enemy_slot_0_ghost_move_up_checked:
    call .enemy_slot_0_ghost_can_up
    jp nz, .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_move_up:
    ld hl, msx2_enemy_runtime_y

    dec (hl)
    ret
.enemy_slot_0_ghost_can_right:
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_0_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_can_left:
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_blocked
    jp c, .enemy_slot_0_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_can_down:
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_0_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_can_up:
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_1_dive
    cp 2
    jp z, .enemy_slot_1_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_check_y
    cp #FF
    jp z, .enemy_slot_1_left
.enemy_slot_1_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_1_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), #FF
.enemy_slot_1_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_1_turn_right
    jp z, .enemy_slot_1_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_1_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_1_up
.enemy_slot_1_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_1_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), #FF
.enemy_slot_1_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_1_turn_down
    jp z, .enemy_slot_1_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_1_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_1_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_1_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_1_dive_left
    jp z, .enemy_slot_1_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_1_dive_left:
    dec b
    ld (hl), b
.enemy_slot_1_dive_done:
    ret
.enemy_slot_1_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld (hl), a
    ret

.enemy_slot_1_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_1_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_1_ghost_store_tick
    ld a, 2
.enemy_slot_1_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_1_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_1_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_1_ghost_prefer_left
.enemy_slot_1_ghost_prefer_right:
    jp .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_prefer_left:
    jp .enemy_slot_1_ghost_try_left_first
.enemy_slot_1_ghost_try_right_first:
    call .enemy_slot_1_ghost_can_right
    jp z, .enemy_slot_1_ghost_set_right
    jp .enemy_slot_1_ghost_try_vertical
.enemy_slot_1_ghost_try_left_first:
    call .enemy_slot_1_ghost_can_left
    jp z, .enemy_slot_1_ghost_set_left
.enemy_slot_1_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_1_ghost_try_up_first
    call .enemy_slot_1_ghost_can_down
    jp z, .enemy_slot_1_ghost_set_down
    call .enemy_slot_1_ghost_can_up
    jp z, .enemy_slot_1_ghost_set_up
    jp .enemy_slot_1_ghost_try_reverse
.enemy_slot_1_ghost_try_up_first:
    call .enemy_slot_1_ghost_can_up
    jp z, .enemy_slot_1_ghost_set_up
    call .enemy_slot_1_ghost_can_down
    jp z, .enemy_slot_1_ghost_set_down
.enemy_slot_1_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_set_left
    cp #FF
    jp z, .enemy_slot_1_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_set_up
    cp #FF
    jp z, .enemy_slot_1_ghost_set_down
    ret
.enemy_slot_1_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_1_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_1_ghost_move_up_checked
    jp .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 0
    jp .enemy_slot_1_ghost_move_right
.enemy_slot_1_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 0
    jp .enemy_slot_1_ghost_move_left
.enemy_slot_1_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 1
    jp .enemy_slot_1_ghost_move_down
.enemy_slot_1_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_1_ghost_move_up
.enemy_slot_1_ghost_move_right_checked:
    call .enemy_slot_1_ghost_can_right
    jp nz, .enemy_slot_1_ghost_try_vertical
.enemy_slot_1_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    inc (hl)
    ret
.enemy_slot_1_ghost_move_left_checked:
    call .enemy_slot_1_ghost_can_left
    jp nz, .enemy_slot_1_ghost_try_vertical
.enemy_slot_1_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    dec (hl)
    ret
.enemy_slot_1_ghost_move_down_checked:
    call .enemy_slot_1_ghost_can_down
    jp nz, .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    inc (hl)
    ret
.enemy_slot_1_ghost_move_up_checked:
    call .enemy_slot_1_ghost_can_up
    jp nz, .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    dec (hl)
    ret
.enemy_slot_1_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_1_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_blocked
    jp c, .enemy_slot_1_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_1_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_2_dive
    cp 2
    jp z, .enemy_slot_2_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_check_y
    cp #FF
    jp z, .enemy_slot_2_left
.enemy_slot_2_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_2_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), #FF
.enemy_slot_2_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_2_turn_right
    jp z, .enemy_slot_2_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_2_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_2_up
.enemy_slot_2_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_2_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), #FF
.enemy_slot_2_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_2_turn_down
    jp z, .enemy_slot_2_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_2_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_2_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_2_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_2_dive_left
    jp z, .enemy_slot_2_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_2_dive_left:
    dec b
    ld (hl), b
.enemy_slot_2_dive_done:
    ret
.enemy_slot_2_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld (hl), a
    ret

.enemy_slot_2_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_2_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_2_ghost_store_tick
    ld a, 2
.enemy_slot_2_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_2_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_2_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_2_ghost_prefer_left
.enemy_slot_2_ghost_prefer_right:
    jp .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_prefer_left:
    jp .enemy_slot_2_ghost_try_left_first
.enemy_slot_2_ghost_try_right_first:
    call .enemy_slot_2_ghost_can_right
    jp z, .enemy_slot_2_ghost_set_right
    jp .enemy_slot_2_ghost_try_vertical
.enemy_slot_2_ghost_try_left_first:
    call .enemy_slot_2_ghost_can_left
    jp z, .enemy_slot_2_ghost_set_left
.enemy_slot_2_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_2_ghost_try_up_first
    call .enemy_slot_2_ghost_can_down
    jp z, .enemy_slot_2_ghost_set_down
    call .enemy_slot_2_ghost_can_up
    jp z, .enemy_slot_2_ghost_set_up
    jp .enemy_slot_2_ghost_try_reverse
.enemy_slot_2_ghost_try_up_first:
    call .enemy_slot_2_ghost_can_up
    jp z, .enemy_slot_2_ghost_set_up
    call .enemy_slot_2_ghost_can_down
    jp z, .enemy_slot_2_ghost_set_down
.enemy_slot_2_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_set_left
    cp #FF
    jp z, .enemy_slot_2_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_set_up
    cp #FF
    jp z, .enemy_slot_2_ghost_set_down
    ret
.enemy_slot_2_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_2_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_2_ghost_move_up_checked
    jp .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 0
    jp .enemy_slot_2_ghost_move_right
.enemy_slot_2_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 0
    jp .enemy_slot_2_ghost_move_left
.enemy_slot_2_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 1
    jp .enemy_slot_2_ghost_move_down
.enemy_slot_2_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_2_ghost_move_up
.enemy_slot_2_ghost_move_right_checked:
    call .enemy_slot_2_ghost_can_right
    jp nz, .enemy_slot_2_ghost_try_vertical
.enemy_slot_2_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    inc (hl)
    ret
.enemy_slot_2_ghost_move_left_checked:
    call .enemy_slot_2_ghost_can_left
    jp nz, .enemy_slot_2_ghost_try_vertical
.enemy_slot_2_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    dec (hl)
    ret
.enemy_slot_2_ghost_move_down_checked:
    call .enemy_slot_2_ghost_can_down
    jp nz, .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    inc (hl)
    ret
.enemy_slot_2_ghost_move_up_checked:
    call .enemy_slot_2_ghost_can_up
    jp nz, .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    dec (hl)
    ret
.enemy_slot_2_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_2_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_blocked
    jp c, .enemy_slot_2_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_2_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_3_dive
    cp 2
    jp z, .enemy_slot_3_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_check_y
    cp #FF
    jp z, .enemy_slot_3_left
.enemy_slot_3_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_3_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), #FF
.enemy_slot_3_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_3_turn_right
    jp z, .enemy_slot_3_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_3_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_3_up
.enemy_slot_3_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_3_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), #FF
.enemy_slot_3_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_3_turn_down
    jp z, .enemy_slot_3_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_3_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_3_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_3_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_3_dive_left
    jp z, .enemy_slot_3_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_3_dive_left:
    dec b
    ld (hl), b
.enemy_slot_3_dive_done:
    ret
.enemy_slot_3_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld (hl), a
    ret

.enemy_slot_3_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_3_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_3_ghost_store_tick
    ld a, 2
.enemy_slot_3_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_3_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_3_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_3_ghost_prefer_left
.enemy_slot_3_ghost_prefer_right:
    jp .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_prefer_left:
    jp .enemy_slot_3_ghost_try_left_first
.enemy_slot_3_ghost_try_right_first:
    call .enemy_slot_3_ghost_can_right
    jp z, .enemy_slot_3_ghost_set_right
    jp .enemy_slot_3_ghost_try_vertical
.enemy_slot_3_ghost_try_left_first:
    call .enemy_slot_3_ghost_can_left
    jp z, .enemy_slot_3_ghost_set_left
.enemy_slot_3_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_3_ghost_try_up_first
    call .enemy_slot_3_ghost_can_down
    jp z, .enemy_slot_3_ghost_set_down
    call .enemy_slot_3_ghost_can_up
    jp z, .enemy_slot_3_ghost_set_up
    jp .enemy_slot_3_ghost_try_reverse
.enemy_slot_3_ghost_try_up_first:
    call .enemy_slot_3_ghost_can_up
    jp z, .enemy_slot_3_ghost_set_up
    call .enemy_slot_3_ghost_can_down
    jp z, .enemy_slot_3_ghost_set_down
.enemy_slot_3_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_set_left
    cp #FF
    jp z, .enemy_slot_3_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_set_up
    cp #FF
    jp z, .enemy_slot_3_ghost_set_down
    ret
.enemy_slot_3_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_3_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_3_ghost_move_up_checked
    jp .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 0
    jp .enemy_slot_3_ghost_move_right
.enemy_slot_3_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 0
    jp .enemy_slot_3_ghost_move_left
.enemy_slot_3_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 1
    jp .enemy_slot_3_ghost_move_down
.enemy_slot_3_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_3_ghost_move_up
.enemy_slot_3_ghost_move_right_checked:
    call .enemy_slot_3_ghost_can_right
    jp nz, .enemy_slot_3_ghost_try_vertical
.enemy_slot_3_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    inc (hl)
    ret
.enemy_slot_3_ghost_move_left_checked:
    call .enemy_slot_3_ghost_can_left
    jp nz, .enemy_slot_3_ghost_try_vertical
.enemy_slot_3_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    dec (hl)
    ret
.enemy_slot_3_ghost_move_down_checked:
    call .enemy_slot_3_ghost_can_down
    jp nz, .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    inc (hl)
    ret
.enemy_slot_3_ghost_move_up_checked:
    call .enemy_slot_3_ghost_can_up
    jp nz, .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    dec (hl)
    ret
.enemy_slot_3_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_3_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_blocked
    jp c, .enemy_slot_3_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_3_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_4_dive
    cp 2
    jp z, .enemy_slot_4_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_check_y
    cp #FF
    jp z, .enemy_slot_4_left
.enemy_slot_4_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_4_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), #FF
.enemy_slot_4_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_4_turn_right
    jp z, .enemy_slot_4_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_4_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_4_up
.enemy_slot_4_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_4_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), #FF
.enemy_slot_4_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_4_turn_down
    jp z, .enemy_slot_4_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_4_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_4_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_4_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_4_dive_left
    jp z, .enemy_slot_4_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_4_dive_left:
    dec b
    ld (hl), b
.enemy_slot_4_dive_done:
    ret
.enemy_slot_4_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld (hl), a
    ret

.enemy_slot_4_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_4_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_4_ghost_store_tick
    ld a, 2
.enemy_slot_4_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_4_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_4_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_4_ghost_prefer_left
.enemy_slot_4_ghost_prefer_right:
    jp .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_prefer_left:
    jp .enemy_slot_4_ghost_try_left_first
.enemy_slot_4_ghost_try_right_first:
    call .enemy_slot_4_ghost_can_right
    jp z, .enemy_slot_4_ghost_set_right
    jp .enemy_slot_4_ghost_try_vertical
.enemy_slot_4_ghost_try_left_first:
    call .enemy_slot_4_ghost_can_left
    jp z, .enemy_slot_4_ghost_set_left
.enemy_slot_4_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_4_ghost_try_up_first
    call .enemy_slot_4_ghost_can_down
    jp z, .enemy_slot_4_ghost_set_down
    call .enemy_slot_4_ghost_can_up
    jp z, .enemy_slot_4_ghost_set_up
    jp .enemy_slot_4_ghost_try_reverse
.enemy_slot_4_ghost_try_up_first:
    call .enemy_slot_4_ghost_can_up
    jp z, .enemy_slot_4_ghost_set_up
    call .enemy_slot_4_ghost_can_down
    jp z, .enemy_slot_4_ghost_set_down
.enemy_slot_4_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_set_left
    cp #FF
    jp z, .enemy_slot_4_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_set_up
    cp #FF
    jp z, .enemy_slot_4_ghost_set_down
    ret
.enemy_slot_4_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_4_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_4_ghost_move_up_checked
    jp .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 0
    jp .enemy_slot_4_ghost_move_right
.enemy_slot_4_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 0
    jp .enemy_slot_4_ghost_move_left
.enemy_slot_4_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 1
    jp .enemy_slot_4_ghost_move_down
.enemy_slot_4_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_4_ghost_move_up
.enemy_slot_4_ghost_move_right_checked:
    call .enemy_slot_4_ghost_can_right
    jp nz, .enemy_slot_4_ghost_try_vertical
.enemy_slot_4_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    inc (hl)
    ret
.enemy_slot_4_ghost_move_left_checked:
    call .enemy_slot_4_ghost_can_left
    jp nz, .enemy_slot_4_ghost_try_vertical
.enemy_slot_4_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    dec (hl)
    ret
.enemy_slot_4_ghost_move_down_checked:
    call .enemy_slot_4_ghost_can_down
    jp nz, .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    inc (hl)
    ret
.enemy_slot_4_ghost_move_up_checked:
    call .enemy_slot_4_ghost_can_up
    jp nz, .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    dec (hl)
    ret
.enemy_slot_4_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_4_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_blocked
    jp c, .enemy_slot_4_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_4_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_5_dive
    cp 2
    jp z, .enemy_slot_5_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_check_y
    cp #FF
    jp z, .enemy_slot_5_left
.enemy_slot_5_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_5_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), #FF
.enemy_slot_5_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_5_turn_right
    jp z, .enemy_slot_5_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_5_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_5_up
.enemy_slot_5_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_5_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), #FF
.enemy_slot_5_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_5_turn_down
    jp z, .enemy_slot_5_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_5_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_5_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_5_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_5_dive_left
    jp z, .enemy_slot_5_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_5_dive_left:
    dec b
    ld (hl), b
.enemy_slot_5_dive_done:
    ret
.enemy_slot_5_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld (hl), a
    ret

.enemy_slot_5_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_5_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_5_ghost_store_tick
    ld a, 2
.enemy_slot_5_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_5_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_5_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_5_ghost_prefer_left
.enemy_slot_5_ghost_prefer_right:
    jp .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_prefer_left:
    jp .enemy_slot_5_ghost_try_left_first
.enemy_slot_5_ghost_try_right_first:
    call .enemy_slot_5_ghost_can_right
    jp z, .enemy_slot_5_ghost_set_right
    jp .enemy_slot_5_ghost_try_vertical
.enemy_slot_5_ghost_try_left_first:
    call .enemy_slot_5_ghost_can_left
    jp z, .enemy_slot_5_ghost_set_left
.enemy_slot_5_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_5_ghost_try_up_first
    call .enemy_slot_5_ghost_can_down
    jp z, .enemy_slot_5_ghost_set_down
    call .enemy_slot_5_ghost_can_up
    jp z, .enemy_slot_5_ghost_set_up
    jp .enemy_slot_5_ghost_try_reverse
.enemy_slot_5_ghost_try_up_first:
    call .enemy_slot_5_ghost_can_up
    jp z, .enemy_slot_5_ghost_set_up
    call .enemy_slot_5_ghost_can_down
    jp z, .enemy_slot_5_ghost_set_down
.enemy_slot_5_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_set_left
    cp #FF
    jp z, .enemy_slot_5_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_set_up
    cp #FF
    jp z, .enemy_slot_5_ghost_set_down
    ret
.enemy_slot_5_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_5_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_5_ghost_move_up_checked
    jp .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 0
    jp .enemy_slot_5_ghost_move_right
.enemy_slot_5_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 0
    jp .enemy_slot_5_ghost_move_left
.enemy_slot_5_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 1
    jp .enemy_slot_5_ghost_move_down
.enemy_slot_5_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_5_ghost_move_up
.enemy_slot_5_ghost_move_right_checked:
    call .enemy_slot_5_ghost_can_right
    jp nz, .enemy_slot_5_ghost_try_vertical
.enemy_slot_5_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    inc (hl)
    ret
.enemy_slot_5_ghost_move_left_checked:
    call .enemy_slot_5_ghost_can_left
    jp nz, .enemy_slot_5_ghost_try_vertical
.enemy_slot_5_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    dec (hl)
    ret
.enemy_slot_5_ghost_move_down_checked:
    call .enemy_slot_5_ghost_can_down
    jp nz, .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    inc (hl)
    ret
.enemy_slot_5_ghost_move_up_checked:
    call .enemy_slot_5_ghost_can_up
    jp nz, .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    dec (hl)
    ret
.enemy_slot_5_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_5_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_blocked
    jp c, .enemy_slot_5_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_5_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_6_dive
    cp 2
    jp z, .enemy_slot_6_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_check_y
    cp #FF
    jp z, .enemy_slot_6_left
.enemy_slot_6_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_6_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), #FF
.enemy_slot_6_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_6_turn_right
    jp z, .enemy_slot_6_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_6_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_6_up
.enemy_slot_6_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_6_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), #FF
.enemy_slot_6_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_6_turn_down
    jp z, .enemy_slot_6_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_6_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_6_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_6_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_6_dive_left
    jp z, .enemy_slot_6_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_6_dive_left:
    dec b
    ld (hl), b
.enemy_slot_6_dive_done:
    ret
.enemy_slot_6_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld (hl), a
    ret

.enemy_slot_6_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_6_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_6_ghost_store_tick
    ld a, 2
.enemy_slot_6_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_6_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_6_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_6_ghost_prefer_left
.enemy_slot_6_ghost_prefer_right:
    jp .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_prefer_left:
    jp .enemy_slot_6_ghost_try_left_first
.enemy_slot_6_ghost_try_right_first:
    call .enemy_slot_6_ghost_can_right
    jp z, .enemy_slot_6_ghost_set_right
    jp .enemy_slot_6_ghost_try_vertical
.enemy_slot_6_ghost_try_left_first:
    call .enemy_slot_6_ghost_can_left
    jp z, .enemy_slot_6_ghost_set_left
.enemy_slot_6_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_6_ghost_try_up_first
    call .enemy_slot_6_ghost_can_down
    jp z, .enemy_slot_6_ghost_set_down
    call .enemy_slot_6_ghost_can_up
    jp z, .enemy_slot_6_ghost_set_up
    jp .enemy_slot_6_ghost_try_reverse
.enemy_slot_6_ghost_try_up_first:
    call .enemy_slot_6_ghost_can_up
    jp z, .enemy_slot_6_ghost_set_up
    call .enemy_slot_6_ghost_can_down
    jp z, .enemy_slot_6_ghost_set_down
.enemy_slot_6_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_set_left
    cp #FF
    jp z, .enemy_slot_6_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_set_up
    cp #FF
    jp z, .enemy_slot_6_ghost_set_down
    ret
.enemy_slot_6_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_6_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_6_ghost_move_up_checked
    jp .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 0
    jp .enemy_slot_6_ghost_move_right
.enemy_slot_6_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 0
    jp .enemy_slot_6_ghost_move_left
.enemy_slot_6_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 1
    jp .enemy_slot_6_ghost_move_down
.enemy_slot_6_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_6_ghost_move_up
.enemy_slot_6_ghost_move_right_checked:
    call .enemy_slot_6_ghost_can_right
    jp nz, .enemy_slot_6_ghost_try_vertical
.enemy_slot_6_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    inc (hl)
    ret
.enemy_slot_6_ghost_move_left_checked:
    call .enemy_slot_6_ghost_can_left
    jp nz, .enemy_slot_6_ghost_try_vertical
.enemy_slot_6_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    dec (hl)
    ret
.enemy_slot_6_ghost_move_down_checked:
    call .enemy_slot_6_ghost_can_down
    jp nz, .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    inc (hl)
    ret
.enemy_slot_6_ghost_move_up_checked:
    call .enemy_slot_6_ghost_can_up
    jp nz, .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    dec (hl)
    ret
.enemy_slot_6_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_6_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_blocked
    jp c, .enemy_slot_6_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_6_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_7_dive
    cp 2
    jp z, .enemy_slot_7_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_check_y
    cp #FF
    jp z, .enemy_slot_7_left
.enemy_slot_7_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_7_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), #FF
.enemy_slot_7_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_7_turn_right
    jp z, .enemy_slot_7_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_7_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_7_up
.enemy_slot_7_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_7_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), #FF
.enemy_slot_7_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_7_turn_down
    jp z, .enemy_slot_7_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_7_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_7_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_7_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_7_dive_left
    jp z, .enemy_slot_7_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_7_dive_left:
    dec b
    ld (hl), b
.enemy_slot_7_dive_done:
    ret
.enemy_slot_7_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld (hl), a
    ret

.enemy_slot_7_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_7_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_7_ghost_store_tick
    ld a, 2
.enemy_slot_7_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_7_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_7_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_7_ghost_prefer_left
.enemy_slot_7_ghost_prefer_right:
    jp .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_prefer_left:
    jp .enemy_slot_7_ghost_try_left_first
.enemy_slot_7_ghost_try_right_first:
    call .enemy_slot_7_ghost_can_right
    jp z, .enemy_slot_7_ghost_set_right
    jp .enemy_slot_7_ghost_try_vertical
.enemy_slot_7_ghost_try_left_first:
    call .enemy_slot_7_ghost_can_left
    jp z, .enemy_slot_7_ghost_set_left
.enemy_slot_7_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_7_ghost_try_up_first
    call .enemy_slot_7_ghost_can_down
    jp z, .enemy_slot_7_ghost_set_down
    call .enemy_slot_7_ghost_can_up
    jp z, .enemy_slot_7_ghost_set_up
    jp .enemy_slot_7_ghost_try_reverse
.enemy_slot_7_ghost_try_up_first:
    call .enemy_slot_7_ghost_can_up
    jp z, .enemy_slot_7_ghost_set_up
    call .enemy_slot_7_ghost_can_down
    jp z, .enemy_slot_7_ghost_set_down
.enemy_slot_7_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_set_left
    cp #FF
    jp z, .enemy_slot_7_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_set_up
    cp #FF
    jp z, .enemy_slot_7_ghost_set_down
    ret
.enemy_slot_7_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_7_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_7_ghost_move_up_checked
    jp .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 0
    jp .enemy_slot_7_ghost_move_right
.enemy_slot_7_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 0
    jp .enemy_slot_7_ghost_move_left
.enemy_slot_7_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 1
    jp .enemy_slot_7_ghost_move_down
.enemy_slot_7_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_7_ghost_move_up
.enemy_slot_7_ghost_move_right_checked:
    call .enemy_slot_7_ghost_can_right
    jp nz, .enemy_slot_7_ghost_try_vertical
.enemy_slot_7_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    inc (hl)
    ret
.enemy_slot_7_ghost_move_left_checked:
    call .enemy_slot_7_ghost_can_left
    jp nz, .enemy_slot_7_ghost_try_vertical
.enemy_slot_7_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    dec (hl)
    ret
.enemy_slot_7_ghost_move_down_checked:
    call .enemy_slot_7_ghost_can_down
    jp nz, .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    inc (hl)
    ret
.enemy_slot_7_ghost_move_up_checked:
    call .enemy_slot_7_ghost_can_up
    jp nz, .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    dec (hl)
    ret
.enemy_slot_7_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_7_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_blocked
    jp c, .enemy_slot_7_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_7_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_8_dive
    cp 2
    jp z, .enemy_slot_8_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_check_y
    cp #FF
    jp z, .enemy_slot_8_left
.enemy_slot_8_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_8_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), #FF
.enemy_slot_8_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_8_turn_right
    jp z, .enemy_slot_8_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_8_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_8_up
.enemy_slot_8_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_8_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), #FF
.enemy_slot_8_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_8_turn_down
    jp z, .enemy_slot_8_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_8_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_8_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_8_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_8_dive_left
    jp z, .enemy_slot_8_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_8_dive_left:
    dec b
    ld (hl), b
.enemy_slot_8_dive_done:
    ret
.enemy_slot_8_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld (hl), a
    ret

.enemy_slot_8_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_8_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_8_ghost_store_tick
    ld a, 2
.enemy_slot_8_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_8_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_8_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_8_ghost_prefer_left
.enemy_slot_8_ghost_prefer_right:
    jp .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_prefer_left:
    jp .enemy_slot_8_ghost_try_left_first
.enemy_slot_8_ghost_try_right_first:
    call .enemy_slot_8_ghost_can_right
    jp z, .enemy_slot_8_ghost_set_right
    jp .enemy_slot_8_ghost_try_vertical
.enemy_slot_8_ghost_try_left_first:
    call .enemy_slot_8_ghost_can_left
    jp z, .enemy_slot_8_ghost_set_left
.enemy_slot_8_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_8_ghost_try_up_first
    call .enemy_slot_8_ghost_can_down
    jp z, .enemy_slot_8_ghost_set_down
    call .enemy_slot_8_ghost_can_up
    jp z, .enemy_slot_8_ghost_set_up
    jp .enemy_slot_8_ghost_try_reverse
.enemy_slot_8_ghost_try_up_first:
    call .enemy_slot_8_ghost_can_up
    jp z, .enemy_slot_8_ghost_set_up
    call .enemy_slot_8_ghost_can_down
    jp z, .enemy_slot_8_ghost_set_down
.enemy_slot_8_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_set_left
    cp #FF
    jp z, .enemy_slot_8_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_set_up
    cp #FF
    jp z, .enemy_slot_8_ghost_set_down
    ret
.enemy_slot_8_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_8_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_8_ghost_move_up_checked
    jp .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 0
    jp .enemy_slot_8_ghost_move_right
.enemy_slot_8_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 0
    jp .enemy_slot_8_ghost_move_left
.enemy_slot_8_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 1
    jp .enemy_slot_8_ghost_move_down
.enemy_slot_8_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_8_ghost_move_up
.enemy_slot_8_ghost_move_right_checked:
    call .enemy_slot_8_ghost_can_right
    jp nz, .enemy_slot_8_ghost_try_vertical
.enemy_slot_8_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    inc (hl)
    ret
.enemy_slot_8_ghost_move_left_checked:
    call .enemy_slot_8_ghost_can_left
    jp nz, .enemy_slot_8_ghost_try_vertical
.enemy_slot_8_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    dec (hl)
    ret
.enemy_slot_8_ghost_move_down_checked:
    call .enemy_slot_8_ghost_can_down
    jp nz, .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    inc (hl)
    ret
.enemy_slot_8_ghost_move_up_checked:
    call .enemy_slot_8_ghost_can_up
    jp nz, .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    dec (hl)
    ret
.enemy_slot_8_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_8_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_blocked
    jp c, .enemy_slot_8_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_8_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_9_dive
    cp 2
    jp z, .enemy_slot_9_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_check_y
    cp #FF
    jp z, .enemy_slot_9_left
.enemy_slot_9_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_9_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), #FF
.enemy_slot_9_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_9_turn_right
    jp z, .enemy_slot_9_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_9_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_9_up
.enemy_slot_9_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_9_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), #FF
.enemy_slot_9_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_9_turn_down
    jp z, .enemy_slot_9_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_9_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_9_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_9_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_9_dive_left
    jp z, .enemy_slot_9_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_9_dive_left:
    dec b
    ld (hl), b
.enemy_slot_9_dive_done:
    ret
.enemy_slot_9_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld (hl), a
    ret

.enemy_slot_9_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_9_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_9_ghost_store_tick
    ld a, 2
.enemy_slot_9_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_9_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_9_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_9_ghost_prefer_left
.enemy_slot_9_ghost_prefer_right:
    jp .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_prefer_left:
    jp .enemy_slot_9_ghost_try_left_first
.enemy_slot_9_ghost_try_right_first:
    call .enemy_slot_9_ghost_can_right
    jp z, .enemy_slot_9_ghost_set_right
    jp .enemy_slot_9_ghost_try_vertical
.enemy_slot_9_ghost_try_left_first:
    call .enemy_slot_9_ghost_can_left
    jp z, .enemy_slot_9_ghost_set_left
.enemy_slot_9_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_9_ghost_try_up_first
    call .enemy_slot_9_ghost_can_down
    jp z, .enemy_slot_9_ghost_set_down
    call .enemy_slot_9_ghost_can_up
    jp z, .enemy_slot_9_ghost_set_up
    jp .enemy_slot_9_ghost_try_reverse
.enemy_slot_9_ghost_try_up_first:
    call .enemy_slot_9_ghost_can_up
    jp z, .enemy_slot_9_ghost_set_up
    call .enemy_slot_9_ghost_can_down
    jp z, .enemy_slot_9_ghost_set_down
.enemy_slot_9_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_set_left
    cp #FF
    jp z, .enemy_slot_9_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_set_up
    cp #FF
    jp z, .enemy_slot_9_ghost_set_down
    ret
.enemy_slot_9_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_9_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_9_ghost_move_up_checked
    jp .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 0
    jp .enemy_slot_9_ghost_move_right
.enemy_slot_9_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 0
    jp .enemy_slot_9_ghost_move_left
.enemy_slot_9_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 1
    jp .enemy_slot_9_ghost_move_down
.enemy_slot_9_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_9_ghost_move_up
.enemy_slot_9_ghost_move_right_checked:
    call .enemy_slot_9_ghost_can_right
    jp nz, .enemy_slot_9_ghost_try_vertical
.enemy_slot_9_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    inc (hl)
    ret
.enemy_slot_9_ghost_move_left_checked:
    call .enemy_slot_9_ghost_can_left
    jp nz, .enemy_slot_9_ghost_try_vertical
.enemy_slot_9_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    dec (hl)
    ret
.enemy_slot_9_ghost_move_down_checked:
    call .enemy_slot_9_ghost_can_down
    jp nz, .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    inc (hl)
    ret
.enemy_slot_9_ghost_move_up_checked:
    call .enemy_slot_9_ghost_can_up
    jp nz, .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    dec (hl)
    ret
.enemy_slot_9_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_9_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_blocked
    jp c, .enemy_slot_9_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_9_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_10_dive
    cp 2
    jp z, .enemy_slot_10_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_check_y
    cp #FF
    jp z, .enemy_slot_10_left
.enemy_slot_10_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_10_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), #FF
.enemy_slot_10_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_10_turn_right
    jp z, .enemy_slot_10_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_10_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_10_up
.enemy_slot_10_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_10_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), #FF
.enemy_slot_10_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_10_turn_down
    jp z, .enemy_slot_10_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_10_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_10_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_10_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_10_dive_left
    jp z, .enemy_slot_10_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_10_dive_left:
    dec b
    ld (hl), b
.enemy_slot_10_dive_done:
    ret
.enemy_slot_10_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld (hl), a
    ret

.enemy_slot_10_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_10_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_10_ghost_store_tick
    ld a, 2
.enemy_slot_10_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_10_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_10_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_10_ghost_prefer_left
.enemy_slot_10_ghost_prefer_right:
    jp .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_prefer_left:
    jp .enemy_slot_10_ghost_try_left_first
.enemy_slot_10_ghost_try_right_first:
    call .enemy_slot_10_ghost_can_right
    jp z, .enemy_slot_10_ghost_set_right
    jp .enemy_slot_10_ghost_try_vertical
.enemy_slot_10_ghost_try_left_first:
    call .enemy_slot_10_ghost_can_left
    jp z, .enemy_slot_10_ghost_set_left
.enemy_slot_10_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_10_ghost_try_up_first
    call .enemy_slot_10_ghost_can_down
    jp z, .enemy_slot_10_ghost_set_down
    call .enemy_slot_10_ghost_can_up
    jp z, .enemy_slot_10_ghost_set_up
    jp .enemy_slot_10_ghost_try_reverse
.enemy_slot_10_ghost_try_up_first:
    call .enemy_slot_10_ghost_can_up
    jp z, .enemy_slot_10_ghost_set_up
    call .enemy_slot_10_ghost_can_down
    jp z, .enemy_slot_10_ghost_set_down
.enemy_slot_10_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_set_left
    cp #FF
    jp z, .enemy_slot_10_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_set_up
    cp #FF
    jp z, .enemy_slot_10_ghost_set_down
    ret
.enemy_slot_10_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_10_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_10_ghost_move_up_checked
    jp .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 0
    jp .enemy_slot_10_ghost_move_right
.enemy_slot_10_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 0
    jp .enemy_slot_10_ghost_move_left
.enemy_slot_10_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 1
    jp .enemy_slot_10_ghost_move_down
.enemy_slot_10_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_10_ghost_move_up
.enemy_slot_10_ghost_move_right_checked:
    call .enemy_slot_10_ghost_can_right
    jp nz, .enemy_slot_10_ghost_try_vertical
.enemy_slot_10_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    inc (hl)
    ret
.enemy_slot_10_ghost_move_left_checked:
    call .enemy_slot_10_ghost_can_left
    jp nz, .enemy_slot_10_ghost_try_vertical
.enemy_slot_10_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    dec (hl)
    ret
.enemy_slot_10_ghost_move_down_checked:
    call .enemy_slot_10_ghost_can_down
    jp nz, .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    inc (hl)
    ret
.enemy_slot_10_ghost_move_up_checked:
    call .enemy_slot_10_ghost_can_up
    jp nz, .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    dec (hl)
    ret
.enemy_slot_10_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_10_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_blocked
    jp c, .enemy_slot_10_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_10_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_11:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 3
    jp z, .enemy_slot_11_dive
    cp 2
    jp z, .enemy_slot_11_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_check_y
    cp #FF
    jp z, .enemy_slot_11_left
.enemy_slot_11_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_11_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), #FF
.enemy_slot_11_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_11_turn_right
    jp z, .enemy_slot_11_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_11_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_11_up
.enemy_slot_11_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_11_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), #FF
.enemy_slot_11_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, b
    cp (hl)
    jp c, .enemy_slot_11_turn_down
    jp z, .enemy_slot_11_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_11_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_dive_active
    dec a
    ld (hl), a
    ret
.enemy_slot_11_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_11_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_11_dive_left
    jp z, .enemy_slot_11_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_11_dive_left:
    dec b
    ld (hl), b
.enemy_slot_11_dive_done:
    ret
.enemy_slot_11_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld (hl), a
    ret

.enemy_slot_11_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_11_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_11_ghost_store_tick
    ld a, 2
.enemy_slot_11_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_11_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_11_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_11_ghost_prefer_left
.enemy_slot_11_ghost_prefer_right:
    jp .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_prefer_left:
    jp .enemy_slot_11_ghost_try_left_first
.enemy_slot_11_ghost_try_right_first:
    call .enemy_slot_11_ghost_can_right
    jp z, .enemy_slot_11_ghost_set_right
    jp .enemy_slot_11_ghost_try_vertical
.enemy_slot_11_ghost_try_left_first:
    call .enemy_slot_11_ghost_can_left
    jp z, .enemy_slot_11_ghost_set_left
.enemy_slot_11_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_11_ghost_try_up_first
    call .enemy_slot_11_ghost_can_down
    jp z, .enemy_slot_11_ghost_set_down
    call .enemy_slot_11_ghost_can_up
    jp z, .enemy_slot_11_ghost_set_up
    jp .enemy_slot_11_ghost_try_reverse
.enemy_slot_11_ghost_try_up_first:
    call .enemy_slot_11_ghost_can_up
    jp z, .enemy_slot_11_ghost_set_up
    call .enemy_slot_11_ghost_can_down
    jp z, .enemy_slot_11_ghost_set_down
.enemy_slot_11_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_set_left
    cp #FF
    jp z, .enemy_slot_11_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_set_up
    cp #FF
    jp z, .enemy_slot_11_ghost_set_down
    ret
.enemy_slot_11_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_11_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_11_ghost_move_up_checked
    jp .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 0
    jp .enemy_slot_11_ghost_move_right
.enemy_slot_11_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 0
    jp .enemy_slot_11_ghost_move_left
.enemy_slot_11_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 1
    jp .enemy_slot_11_ghost_move_down
.enemy_slot_11_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_11_ghost_move_up
.enemy_slot_11_ghost_move_right_checked:
    call .enemy_slot_11_ghost_can_right
    jp nz, .enemy_slot_11_ghost_try_vertical
.enemy_slot_11_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    inc (hl)
    ret
.enemy_slot_11_ghost_move_left_checked:
    call .enemy_slot_11_ghost_can_left
    jp nz, .enemy_slot_11_ghost_try_vertical
.enemy_slot_11_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    dec (hl)
    ret
.enemy_slot_11_ghost_move_down_checked:
    call .enemy_slot_11_ghost_can_down
    jp nz, .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    inc (hl)
    ret
.enemy_slot_11_ghost_move_up_checked:
    call .enemy_slot_11_ghost_can_up
    jp nz, .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    dec (hl)
    ret
.enemy_slot_11_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_11_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_blocked
    jp c, .enemy_slot_11_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_11_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_blocked:
    or 1
    ret



msx2_apply_damage_respawn:
    ; Shared damage path for effect hazards and entity enemies.
    ; Clobbers AF/DE/HL.
    ld a, 1
    ld (msx2_player_dead_flag), a
    ld a, (msx2_lives)
    or a
    jp z, .damage_game_over
    dec a
    ld (msx2_lives), a
    jp nz, .damage_after_lives
.damage_game_over:
    ld a, 1
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
.damage_after_lives:
    call draw_msx2_lives_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, (msx2_game_over_flag)
    or a
    ret z
    call draw_msx2_game_over_banner
    ret

update_msx2_enemy_state:
    ; Uses enemy/hazard entities for the active screen as tile-sized damage bodies.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_enemy_damage_cooldown)
    or a
    jp z, .enemy_cooldown_ready
    dec a
    ld (msx2_enemy_damage_cooldown), a
    ret
.enemy_cooldown_ready:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .enemy_no_slot_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_0
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_0
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_0
    jp .enemy_damage
.enemy_no_slot_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .enemy_no_slot_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_1
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_1
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_1
    jp .enemy_damage
.enemy_no_slot_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .enemy_no_slot_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_2
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_2
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_2
    jp .enemy_damage
.enemy_no_slot_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .enemy_no_slot_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_3
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_3
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_3
    jp .enemy_damage
.enemy_no_slot_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .enemy_no_slot_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_4
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_4
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_4
    jp .enemy_damage
.enemy_no_slot_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .enemy_no_slot_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_5
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_5
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_5
    jp .enemy_damage
.enemy_no_slot_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .enemy_no_slot_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_6
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_6
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_6
    jp .enemy_damage
.enemy_no_slot_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .enemy_no_slot_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_7
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_7
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_7
    jp .enemy_damage
.enemy_no_slot_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .enemy_no_slot_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_8
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_8
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_8
    jp .enemy_damage
.enemy_no_slot_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .enemy_no_slot_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_9
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_9
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_9
    jp .enemy_damage
.enemy_no_slot_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .enemy_no_slot_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_10
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_10
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_10
    jp .enemy_damage
.enemy_no_slot_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .enemy_no_slot_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_11
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_11
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_11
    jp .enemy_damage
.enemy_no_slot_11:
    ret
.enemy_damage:
    ld a, 1
    ld (msx2_enemy_hit_flag), a
    ld a, 255
    ld (msx2_enemy_damage_cooldown), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret

update_msx2_effect_state:
    ; Effect layer contract: 1=hazard, 2=exit, 3=collectible.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_effect_at_pixel
    or a
    jp z, .no_effect
    cp 1
    jp z, .hazard
    cp 2
    jp z, .exit
    cp 3
    jp z, .collectible
    ret
.no_effect:
    xor a
    ld (msx2_collectible_latch), a
    ret
.hazard:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.exit:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    jp c, .exit_locked
    ld a, 1
    ld (msx2_exit_reached_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_exit_blocked_flag), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret
.exit_locked:
    ld a, 1
    ld (msx2_exit_blocked_flag), a
    ret
.collectible:
    ld a, (msx2_collectible_latch)
    or a
    ret nz
    xor a
    ld (hl), a
    call clear_msx2_collectible_visual
    ld a, 1
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    ret nc
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
    call draw_msx2_collectible_hud
    ret


msx2_compare_collectibles_required:
    ; Compares current collected count with the active screen requirement.
    ; Carry set means collected < required. Clobbers AF/HL, preserves BC/DE.
    ld a, (msx2_current_screen_index)
    ld hl, msx2_screen_required_collectibles
    add a, l
    ld l, a
    ld a, h
    adc a, 0
    ld h, a
    ld a, (msx2_collectible_count)
    cp (hl)
    ret

msx2_load_current_screen_air:
    ; Loads the active screen initial air value. Clobbers AF/HL, preserves BC/DE.
    xor a
    ld (msx2_air_frame_counter), a
    ld a, (msx2_current_screen_index)
    ld hl, msx2_screen_initial_air
    add a, l
    ld l, a
    ld a, h
    adc a, 0
    ld h, a
    ld a, (hl)
    ld (msx2_air_value), a
    ret

msx2_reset_screen_transition_flags:
    ; Clears transient per-screen event flags on WorldMap entry. Clobbers AF only.
    xor a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_latch), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ret

clear_msx2_collectible_visual:
    ; Clears the 16x16 visual tile under the active collectible cell.
    ; Clobbers AF/BC/DE/HL.
    call screen4_name_cell_from_player
    call clear_screen4_name_cell_16
    ret

screen4_name_cell_from_player:
    ; Returns HL=top-left name-table address for the player's 16x16 cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_y)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (msx2_player_sprite_x)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    ret

msx2_collision_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=collision byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_collision_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_effect_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=effect byte with Z set when empty.
    ; HL points at the effect cell so callers may clear mutable RAM effects.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_effects_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_behavior_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=behavior byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_behavior_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_ladder_at_player_center:
    ; Returns Z when the player center is on behavior code 1 (ladder). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_behavior_at_pixel
    cp 1
    ret

msx2_ladder_below_player_center:
    ; Returns Z when the lower center is on behavior code 1 (ladder). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 10
    ld c, a
    call msx2_behavior_at_pixel
    cp 1
    ret

msx2_behavior_below_player_center:
    ; Returns the behavior byte under the player feet. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_behavior_at_pixel
    ret

msx2_respawn_current_screen:
    ; Respawn at the player entity for the active msx2screen.
    ; Clobbers AF/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_spawn_x
    add hl, de
    ld a, (hl)
    ld (msx2_player_sprite_x), a
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_spawn_y
    add hl, de
    ld a, (hl)
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    inc a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_sprite_frame), a

    ret


msx2_try_world_edge_transition_left:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .left_screen_0
    jp upload_hardware_sprite_attrs
.left_screen_0:
    jp upload_hardware_sprite_attrs

msx2_try_world_edge_transition_right:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .right_screen_0
    jp upload_hardware_sprite_attrs
.right_screen_0:
    jp upload_hardware_sprite_attrs

load_screen4_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
    ld bc, #0010
    call WRTVDP
    ld hl, screen4_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

init_msx2_effect_buffers:
    ; Restores each msx2screen mutable effect layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_EFFECTS
    ld de, #C030
    ld bc, msx2_layer_size
    ldir
    ret

load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4:
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_PATTERN_VRAM
    ld bc, SCREEN4_PATTERN_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_COLOR_VRAM
    ld bc, SCREEN4_COLOR_SIZE
    call FILVRM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 192
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_0_COLORS
    ld de, #2000
    ld bc, 192
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 216
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_1_COLORS
    ld de, #2800
    ld bc, 216
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 216
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_2_COLORS
    ld de, #3000
    ld bc, 216
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C030
    ld (msx2_current_effects_ptr), hl
    call apply_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_collected_visuals
    ret

apply_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ; No collectible cells on this screen.
    ret

; Palette bytes: byte1=(R<<4)|B, byte2=G
screen4_palette_data:
    DB #00,#00,#00,#00,#11,#06,#33,#07,#17,#01,#27,#03,#51,#01,#27,#06
    DB #71,#01,#73,#03,#61,#06,#64,#06,#11,#04,#65,#02,#55,#05,#77,#07

; Per-msx2screen respawn X coordinates
msx2_screen_spawn_x:
    DB #70

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #A0

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #00

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #00

; Per-msx2screen active enemy/hazard entity count, capped at 12
msx2_screen_enemy_count:
    DB #00

; Per-msx2screen enemy/hazard entity X coordinates, 12 slots per screen
msx2_screen_enemy_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard entity Y coordinates, 12 slots per screen
msx2_screen_enemy_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum X, 12 slots per screen
msx2_screen_enemy_min_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum X, 12 slots per screen
msx2_screen_enemy_max_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum Y, 12 slots per screen
msx2_screen_enemy_min_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum Y, 12 slots per screen
msx2_screen_enemy_max_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial movement direction, 12 slots per screen
msx2_screen_enemy_dx:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial vertical movement direction, 12 slots per screen
msx2_screen_enemy_dy:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component mode, 12 slots per screen
msx2_screen_enemy_mode:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component frame delay, 12 slots per screen
msx2_screen_enemy_speed:
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02

; Per-msx2screen enemy/hazard score value, 12 slots per screen
msx2_screen_enemy_score:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Default empty MSX2 SCREEN 4 collision layer, 16x12 cells
screen4_empty_collision_layer:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 SCREEN 4 effects layer, 16x12 cells
screen4_empty_effects_layer:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 SCREEN 4 behavior layer, 16x12 cells
screen4_empty_behavior_layer:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


msx2_hw_sprite_patterns:
; Hardware metasprite frame 0 part 0: x+0, y+0
msx2_hw_sprite_frame_0_pattern_0:
    DB #00,#05,#1B,#37,#10,#5F,#BF,#7C,#FC,#FB,#77,#6F,#1F,#1F,#06,#00
    DB #00,#C0,#F0,#E8,#A0,#B0,#00,#00,#00,#80,#E0,#D8,#B8,#70,#C0,#00
; Hardware metasprite frame 0 part 1: x+0, y+0
msx2_hw_sprite_frame_0_pattern_1:
    DB #00,#02,#04,#08,#7F,#20,#40,#80,#00,#04,#08,#10,#20,#00,#01,#00
    DB #00,#00,#00,#10,#78,#40,#80,#00,#00,#00,#10,#20,#40,#80,#00,#00
; Shared 16x16 enemy/hazard hardware sprite pattern
msx2_hw_enemy_sprite_pattern:
    DB #07,#1F,#3F,#7F,#67,#E7,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#EE,#C6,#80
    DB #E0,#F8,#FC,#FE,#9E,#9F,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#EF,#31,#01
; Shared 16x16 player bullet hardware sprite pattern
msx2_hw_player_bullet_pattern:
    DB #18,#18,#18,#18,#18,#18,#18,#18,#18,#18,#18,#18,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Shared 16x16 enemy bullet hardware sprite pattern
msx2_hw_enemy_bullet_pattern:
    DB #00,#00,#18,#18,#3C,#3C,#18,#18,#18,#18,#3C,#3C,#18,#18,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
; Line colors for hardware sprite layer 0
msx2_hw_sprite_colors_0:
    DB #05,#0A,#0A,#0A,#01,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#05
; Line colors for hardware sprite layer 1
msx2_hw_sprite_colors_1:
    DB #05,#0B,#0B,#0B,#4A,#0B,#0B,#0B,#05,#0B,#0B,#0B,#0B,#0B,#0B,#05
; Line colors for enemy/hazard hardware sprite slot 0
msx2_hw_enemy_sprite_colors_0:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 1
msx2_hw_enemy_sprite_colors_1:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 2
msx2_hw_enemy_sprite_colors_2:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 3
msx2_hw_enemy_sprite_colors_3:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 4
msx2_hw_enemy_sprite_colors_4:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 5
msx2_hw_enemy_sprite_colors_5:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 6
msx2_hw_enemy_sprite_colors_6:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 7
msx2_hw_enemy_sprite_colors_7:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 8
msx2_hw_enemy_sprite_colors_8:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 9
msx2_hw_enemy_sprite_colors_9:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 10
msx2_hw_enemy_sprite_colors_10:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 11
msx2_hw_enemy_sprite_colors_11:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for player bullet hardware sprite slot
msx2_hw_player_bullet_colors:
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06
; Line colors for enemy bullet hardware sprite slot
msx2_hw_enemy_bullet_colors:
    DB #08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08
msx2_hw_sprite_colors_end:

; 2 player hardware sprite(s), 12 enemy/hazard sprite slots, 2 player bullet slot, 1 enemy bullet slot; next Y=208 terminates the SAT
msx2_hw_sprite_attrs:
    DB #A0,#70,#00,#00,#A0,#70,#04,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#0C,#00,#D0,#00,#0C,#00
    DB #D0,#00,#10,#00,#D0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


; MSX2 SCREEN 4 Pac-Man Player Only collision layer, 16x14 bytes
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_COLLISION:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #01,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#00,#01,#01,#01,#00,#01,#00,#01,#01,#01,#01,#01,#00,#00,#01
    DB #01,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#01
    DB #01,#00,#01,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#00,#00,#01
    DB #01,#00,#00,#00,#01,#00,#00,#01,#01,#00,#00,#01,#00,#00,#00,#01
    DB #01,#01,#01,#00,#01,#00,#01,#01,#01,#01,#00,#01,#00,#01,#01,#01
    DB #01,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#01
    DB #01,#00,#01,#01,#01,#00,#01,#01,#01,#01,#00,#01,#01,#00,#00,#01
    DB #01,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; MSX2 SCREEN 4 Pac-Man Player Only effects layer, 16x14 bytes
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 SCREEN 4 Pac-Man Player Only behavior layer, 16x14 bytes
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BEHAVIOR:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 name table, 32x24 chars
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_NAMES:
    DB #00,#01,#04,#01,#04,#01,#04,#01,#04,#01,#04,#01,#04,#01,#04,#01
    DB #04,#01,#04,#01,#04,#01,#04,#01,#04,#01,#04,#01,#04,#01,#04,#08
    DB #02,#03,#05,#06,#05,#06,#05,#06,#05,#06,#05,#06,#07,#03,#05,#06
    DB #05,#06,#05,#06,#05,#06,#05,#06,#05,#06,#05,#06,#05,#06,#07,#09
    DB #0A,#0B,#0D,#0E,#11,#12,#11,#12,#11,#12,#11,#12,#0A,#0B,#11,#12
    DB #11,#12,#11,#12,#11,#12,#11,#12,#11,#12,#11,#12,#0D,#0E,#0A,#0B
    DB #02,#0C,#0F,#10,#13,#14,#13,#14,#13,#14,#13,#14,#02,#0C,#13,#14
    DB #13,#14,#13,#14,#13,#14,#13,#14,#13,#14,#13,#14,#0F,#10,#02,#0C
    DB #0A,#0B,#11,#12,#00,#01,#04,#01,#04,#08,#11,#12,#0A,#0B,#11,#12
    DB #17,#01,#04,#01,#04,#01,#04,#01,#04,#08,#11,#12,#11,#12,#0A,#0B
    DB #02,#0C,#13,#14,#02,#03,#05,#06,#05,#15,#13,#14,#16,#15,#13,#14
    DB #16,#06,#05,#06,#05,#06,#05,#06,#05,#15,#13,#14,#13,#14,#02,#0C
    DB #0A,#0B,#11,#12,#0A,#0B,#11,#12,#11,#12,#11,#12,#11,#12,#11,#12
    DB #11,#12,#11,#12,#11,#12,#11,#12,#11,#12,#17,#08,#11,#12,#0A,#0B
    DB #02,#0C,#13,#14,#02,#0C,#13,#14,#13,#14,#13,#14,#13,#14,#13,#14
    DB #13,#14,#13,#14,#13,#14,#13,#14,#13,#14,#16,#15,#13,#14,#02,#0C
    DB #00,#01,#04,#05,#00,#01,#04,#05,#0A,#0B,#0D,#0E,#04,#05,#10,#0B
    DB #0D,#0E,#04,#05,#10,#0B,#0D,#0E,#04,#05,#04,#05,#04,#05,#00,#01
    DB #02,#03,#06,#07,#08,#09,#06,#07,#02,#0C,#0F,#09,#06,#07,#08,#11
    DB #0F,#09,#06,#07,#08,#11,#12,#13,#06,#07,#06,#07,#06,#07,#02,#03
    DB #00,#01,#04,#05,#04,#05,#04,#05,#00,#01,#04,#05,#04,#05,#14,#15
    DB #14,#15,#04,#05,#04,#05,#00,#01,#04,#05,#04,#05,#04,#05,#00,#01
    DB #02,#03,#06,#07,#06,#07,#06,#07,#02,#03,#06,#07,#06,#07,#16,#17
    DB #16,#17,#06,#07,#06,#07,#02,#03,#06,#07,#06,#07,#06,#07,#02,#03
    DB #18,#19,#0D,#0B,#0D,#0E,#04,#05,#00,#01,#04,#05,#10,#0B,#0D,#0B
    DB #0D,#0B,#0D,#0E,#04,#05,#00,#01,#04,#05,#10,#0B,#0D,#0B,#1A,#01
    DB #02,#0C,#0F,#11,#0F,#09,#06,#07,#02,#03,#06,#07,#08,#11,#0F,#11
    DB #0F,#11,#0F,#09,#06,#07,#02,#03,#06,#07,#08,#11,#0F,#11,#12,#13
    DB #00,#01,#04,#05,#04,#05,#04,#05,#00,#01,#04,#05,#04,#05,#04,#05
    DB #04,#05,#04,#05,#04,#05,#00,#01,#04,#05,#04,#05,#04,#05,#00,#01
    DB #02,#03,#06,#07,#06,#07,#06,#07,#02,#03,#06,#07,#06,#07,#06,#07
    DB #06,#07,#06,#07,#06,#07,#02,#03,#06,#07,#06,#07,#06,#07,#02,#03
    DB #00,#01,#04,#05,#08,#09,#0C,#09,#0E,#01,#04,#05,#10,#09,#0C,#09
    DB #0C,#09,#0C,#12,#04,#05,#14,#15,#0C,#12,#04,#05,#04,#05,#00,#01
    DB #02,#03,#06,#07,#0A,#0B,#0D,#0B,#0D,#0F,#06,#07,#02,#11,#0D,#0B
    DB #0D,#0B,#0D,#13,#06,#07,#0A,#16,#0D,#13,#06,#07,#06,#07,#02,#03
    DB #00,#01,#17,#18,#04,#05,#04,#05,#04,#05,#04,#05,#00,#01,#04,#05
    DB #04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#17,#18,#00,#01
    DB #02,#03,#19,#1A,#06,#07,#06,#07,#06,#07,#06,#07,#0A,#13,#06,#07
    DB #06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#19,#1A,#02,#03
    DB #00,#01,#04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#04,#05
    DB #04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#04,#05,#00,#01
    DB #02,#03,#06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#06,#07
    DB #06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#06,#07,#02,#03
    DB #14,#15,#0C,#09,#0C,#09,#0C,#09,#0C,#09,#0C,#09,#0C,#09,#0C,#09
    DB #0C,#09,#0C,#09,#0C,#09,#0C,#09,#0C,#09,#0C,#09,#0C,#09,#0E,#01
    DB #0A,#16,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B
    DB #0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0B,#0D,#0F

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 bank 0 compact patterns
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_0_PATTERNS:
    DB #00,#00,#00,#00,#00,#07,#04,#03,#00,#00,#00,#00,#00,#00,#20,#C0
    DB #03,#03,#07,#05,#05,#05,#05,#05,#C0,#60,#00,#A0,#A0,#A0,#A0,#A0
    DB #00,#00,#00,#00,#00,#00,#04,#03,#03,#04,#00,#00,#00,#00,#00,#00
    DB #C0,#20,#00,#00,#00,#00,#00,#00,#03,#04,#00,#05,#05,#05,#05,#05
    DB #00,#00,#00,#00,#00,#E0,#C0,#C0,#C0,#60,#E0,#A0,#A0,#A0,#A0,#A0
    DB #05,#05,#05,#05,#05,#07,#03,#03,#A0,#A0,#A0,#A0,#A0,#E0,#C0,#C0
    DB #C0,#C0,#E0,#A0,#A0,#A0,#A0,#A0,#00,#00,#00,#10,#01,#02,#04,#01
    DB #00,#00,#00,#00,#80,#40,#20,#90,#09,#04,#02,#01,#00,#00,#00,#00
    DB #80,#20,#40,#80,#08,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#01
    DB #00,#00,#00,#00,#00,#00,#00,#80,#01,#00,#00,#00,#00,#00,#00,#00
    DB #80,#00,#00,#00,#08,#00,#00,#00,#C0,#C0,#E0,#00,#00,#00,#00,#00
    DB #03,#03,#07,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#07,#03,#03

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 bank 0 compact colors
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_0_COLORS:
    DB #11,#11,#11,#11,#11,#41,#41,#51,#11,#11,#11,#11,#11,#44,#45,#54
    DB #51,#51,#41,#41,#41,#41,#41,#41,#54,#45,#44,#41,#41,#41,#41,#41
    DB #11,#11,#11,#11,#11,#44,#45,#54,#54,#45,#44,#11,#11,#11,#11,#11
    DB #54,#45,#44,#11,#11,#11,#11,#11,#54,#45,#44,#41,#41,#41,#41,#41
    DB #11,#11,#11,#11,#11,#41,#51,#51,#51,#41,#41,#41,#41,#41,#41,#41
    DB #41,#41,#41,#41,#41,#41,#51,#51,#41,#41,#41,#41,#41,#41,#51,#51
    DB #51,#51,#41,#41,#41,#41,#41,#41,#11,#11,#11,#41,#F1,#F1,#F1,#B1
    DB #11,#11,#11,#11,#F1,#F1,#F1,#F1,#F1,#F1,#F1,#F1,#11,#11,#11,#11
    DB #B1,#F1,#F1,#F1,#41,#11,#11,#11,#11,#11,#11,#41,#11,#11,#11,#B1
    DB #11,#11,#11,#11,#11,#11,#11,#A1,#A1,#11,#11,#11,#11,#11,#11,#11
    DB #B1,#11,#11,#11,#41,#11,#11,#11,#51,#51,#41,#11,#11,#11,#11,#11
    DB #51,#51,#41,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#41,#51,#51

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 bank 1 compact patterns
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_1_PATTERNS:
    DB #05,#05,#05,#05,#05,#07,#03,#03,#A0,#A0,#A0,#A0,#A0,#E0,#C0,#C0
    DB #03,#03,#07,#05,#05,#05,#05,#05,#C0,#C0,#E0,#A0,#A0,#A0,#A0,#A0
    DB #00,#00,#00,#10,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#80
    DB #01,#00,#00,#00,#00,#00,#00,#00,#80,#00,#00,#00,#08,#00,#00,#00
    DB #03,#03,#07,#00,#00,#00,#00,#00,#C0,#C0,#E0,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#07,#04,#03,#00,#00,#00,#00,#00,#00,#20,#C0
    DB #C0,#60,#00,#A0,#A0,#A0,#A0,#A0,#00,#00,#00,#00,#00,#00,#04,#03
    DB #00,#00,#00,#00,#00,#E0,#C0,#C0,#03,#04,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#07,#03,#03,#C0,#20,#00,#00,#00,#00,#00,#00
    DB #03,#04,#00,#05,#05,#05,#05,#05,#C0,#60,#E0,#A0,#A0,#A0,#A0,#A0
    DB #00,#00,#10,#20,#00,#20,#C0,#C0,#00,#00,#10,#00,#00,#04,#03,#03
    DB #C0,#20,#00,#20,#00,#00,#00,#00,#03,#04,#00,#00,#00,#00,#00,#00
    DB #05,#05,#05,#05,#05,#07,#04,#03,#A0,#A0,#A0,#A0,#A0,#00,#20,#C0
    DB #05,#05,#05,#05,#05,#00,#04,#03

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 bank 1 compact colors
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_1_COLORS:
    DB #41,#41,#41,#41,#41,#41,#51,#51,#41,#41,#41,#41,#41,#41,#51,#51
    DB #51,#51,#41,#41,#41,#41,#41,#41,#51,#51,#41,#41,#41,#41,#41,#41
    DB #11,#11,#11,#41,#11,#11,#11,#B1,#11,#11,#11,#11,#11,#11,#11,#A1
    DB #A1,#11,#11,#11,#11,#11,#11,#11,#B1,#11,#11,#11,#41,#11,#11,#11
    DB #51,#51,#41,#11,#11,#11,#11,#11,#51,#51,#41,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#41,#41,#51,#11,#11,#11,#11,#11,#44,#45,#54
    DB #54,#45,#44,#41,#41,#41,#41,#41,#11,#11,#11,#11,#11,#44,#45,#54
    DB #11,#11,#11,#11,#11,#41,#51,#51,#54,#45,#44,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#41,#51,#51,#54,#45,#44,#11,#11,#11,#11,#11
    DB #54,#45,#44,#41,#41,#41,#41,#41,#51,#41,#41,#41,#41,#41,#41,#41
    DB #11,#11,#41,#41,#11,#D1,#1D,#1B,#11,#11,#41,#11,#11,#D1,#1D,#1B
    DB #1D,#D1,#11,#41,#11,#11,#11,#11,#1D,#D1,#11,#11,#11,#11,#11,#11
    DB #41,#41,#41,#41,#41,#41,#41,#51,#41,#41,#41,#41,#41,#44,#45,#54
    DB #41,#41,#41,#41,#41,#44,#45,#54

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 bank 2 compact patterns
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_2_PATTERNS:
    DB #05,#05,#05,#05,#05,#07,#03,#03,#A0,#A0,#A0,#A0,#A0,#E0,#C0,#C0
    DB #03,#03,#07,#05,#05,#05,#05,#05,#C0,#C0,#E0,#A0,#A0,#A0,#A0,#A0
    DB #00,#00,#00,#10,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#80
    DB #01,#00,#00,#00,#00,#00,#00,#00,#80,#00,#00,#00,#08,#00,#00,#00
    DB #00,#00,#00,#00,#00,#07,#03,#03,#00,#00,#00,#00,#00,#00,#20,#C0
    DB #03,#03,#07,#00,#00,#00,#00,#00,#C0,#20,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#04,#03,#03,#04,#00,#00,#00,#00,#00,#00
    DB #05,#05,#05,#05,#05,#00,#04,#03,#C0,#60,#E0,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#07,#04,#03,#C0,#60,#00,#A0,#A0,#A0,#A0,#A0
    DB #00,#00,#00,#00,#00,#E0,#C0,#C0,#C0,#C0,#E0,#00,#00,#00,#00,#00
    DB #05,#05,#05,#05,#05,#07,#04,#03,#A0,#A0,#A0,#A0,#A0,#00,#20,#C0
    DB #C0,#60,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#01,#02,#04,#01
    DB #00,#00,#00,#00,#80,#40,#20,#90,#09,#04,#02,#01,#00,#00,#00,#00
    DB #80,#20,#40,#80,#08,#00,#00,#00

; MSX2 SCREEN 4 Pac-Man Player Only SCREEN 4 bank 2 compact colors
MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_2_COLORS:
    DB #41,#41,#41,#41,#41,#41,#51,#51,#41,#41,#41,#41,#41,#41,#51,#51
    DB #51,#51,#41,#41,#41,#41,#41,#41,#51,#51,#41,#41,#41,#41,#41,#41
    DB #11,#11,#11,#41,#11,#11,#11,#B1,#11,#11,#11,#11,#11,#11,#11,#A1
    DB #A1,#11,#11,#11,#11,#11,#11,#11,#B1,#11,#11,#11,#41,#11,#11,#11
    DB #11,#11,#11,#11,#11,#41,#51,#51,#11,#11,#11,#11,#11,#44,#45,#54
    DB #51,#51,#41,#11,#11,#11,#11,#11,#54,#45,#44,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#44,#45,#54,#54,#45,#44,#11,#11,#11,#11,#11
    DB #41,#41,#41,#41,#41,#44,#45,#54,#51,#41,#41,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#41,#41,#51,#54,#45,#44,#41,#41,#41,#41,#41
    DB #11,#11,#11,#11,#11,#41,#51,#51,#51,#51,#41,#11,#11,#11,#11,#11
    DB #41,#41,#41,#41,#41,#41,#41,#51,#41,#41,#41,#41,#41,#44,#45,#54
    DB #54,#45,#44,#11,#11,#11,#11,#11,#11,#11,#11,#41,#F1,#F1,#F1,#B1
    DB #11,#11,#11,#11,#F1,#F1,#F1,#F1,#F1,#F1,#F1,#F1,#11,#11,#11,#11
    DB #B1,#F1,#F1,#F1,#41,#11,#11,#11

    ds #C000 - $, #FF
    end
