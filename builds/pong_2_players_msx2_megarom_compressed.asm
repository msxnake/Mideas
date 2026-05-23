; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: pong_2_players_msx2
; Screen mode: SCREEN 4 (Graphics II)
; ROM Mode: megarom
; Mapper Target: konami
; Auto MegaROM: No
; MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility
; ROM mode requested: megarom
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
GTTRIG  EQU #00D8
SNSMAT  EQU #0141
RSLREG  EQU #0138
ENASLT  EQU #0024
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
msx2_snake_head_x EQU #C030
msx2_snake_head_y EQU #C031
msx2_snake_food_x EQU #C032
msx2_snake_food_y EQU #C033
msx2_snake_dir EQU #C034
msx2_snake_frame_counter EQU #C035
msx2_snake_speed_frames EQU #C036
msx2_snake_draw_char EQU #C037
msx2_snake_body_length EQU #C038
msx2_snake_growth_flag EQU #C039
msx2_music_tick EQU #C03A
msx2_music_step EQU #C03B
msx2_attack_timer EQU #C03C
msx2_attack_seed EQU #C03D
msx2_attack_cursor EQU #C03E
msx2_attack_pending EQU #C03F
MSX2_SCREEN4_DATA_BANK EQU 4
msx2_snake_body_cells EQU #C040
msx2_effects_runtime_buffers EQU #C080
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
    call init_konami8k_fixed_bank0_banks

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a

    call DISSCR
    ld a, 4
    call CHGMOD
    ld bc, #0007
    call WRTVDP
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
    call load_PONG_2P_COURT_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites



    call ENASCR
    ei

    ld a, 0
    ld (msx2_current_screen_index), a
    call load_PONG_2P_COURT_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites

.main_loop:
    call update_hardware_sprite_input

    call update_msx2_air_timer



    call wait_frame_busy
    jr .main_loop

wait_frame_busy:
    ; VBlank-paced frame wait. On 60 Hz machines this locks gameplay to 60 frames/second.
    ei
    halt
    ret

map_page2_to_cart_primary:
    ; Keep #8000-#BFFF on the same slot as the cart page at #4000,
    ; including expanded-slot cartridges.
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jr z, .slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
.slot_ready:
    or c
    ret

init_konami8k_fixed_bank0_banks:
    ; Konami without SCC: #4000-#5FFF is fixed segment 0.
    ; Runtime explicitly initializes the switchable #6000/#8000/#A000
    ; windows because their power-on contents are not guaranteed.
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ret

mapper_set_bank_p1:
    ; input: A=8KB physical segment for #6000-#7FFF. Clobbers no other registers.
    ld (#6000), a
    ret

mapper_set_bank_p2:
    ; input: A=8KB physical segment for #8000-#9FFF. Clobbers no other registers.
    ld (#8000), a
    ret

mapper_set_bank_p3:
    ; input: A=8KB physical segment for #A000-#BFFF. Clobbers no other registers.
    ld (#A000), a
    ret

msx2_screen4_data_bank_enter:
    ; Maps cold SCREEN 4 data to P2/#8000 while resident code runs from P0/P1.
    ; Clobbers AF. MSX2 SCREEN 4 runtime keeps normal P2 on bank 2.
    ld a, MSX2_SCREEN4_DATA_BANK
    jp mapper_set_bank_p2

msx2_screen4_data_bank_leave:
    ; Restores normal P2 bank 2 after cold data copies.
    ; Clobbers AF.
    ld a, 2
    jp mapper_set_bank_p2

wait_key:
    call CHGET
    ret

clear_screen4_names:
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
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

    call msx2_screen4_data_bank_enter

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
    call msx2_screen4_data_bank_leave


    ld a, 16
    ld (msx2_player_sprite_x), a
    ld a, 80
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a

    xor a
    ld (msx2_player_sprite_frame), a

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


draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
    ; Inline status HUD disabled for SCREEN 4 until it is tile/name-table based. Clobbers none.
    ret

draw_msx2_game_over_banner:
    ; Final-state feedback: red backdrop. Normal screen reload restores black.
    ; Clobbers BC.
    ld bc, #0607
    call WRTVDP
    ret

draw_msx2_level_complete_banner:
    ; Final-state feedback: green backdrop. Normal screen reload restores black.
    ; Clobbers BC.
    ld bc, #0307
    call WRTVDP
    ret

load_msx2_stage_font:
    ; Loads the tiny STAGE 1/2 font into unused SCREEN 4 char slots. Clobbers AF/BC/DE/HL.
    ld hl, msx2_stage_font_patterns
    ld de, #0780
    ld bc, 56
    call LDIRVM
    ld hl, msx2_stage_font_patterns
    ld de, #0F80
    ld bc, 56
    call LDIRVM
    ld hl, msx2_stage_font_patterns
    ld de, #1780
    ld bc, 56
    call LDIRVM
    ld a, #51
    ld hl, #2780
    ld bc, 56
    call FILVRM
    ld a, #51
    ld hl, #2F80
    ld bc, 56
    call FILVRM
    ld a, #51
    ld hl, #3780
    ld bc, 56
    jp FILVRM

draw_msx2_stage_banner:
    ; Draws STAGE 1/2 centered in the SCREEN 4 name table. Clobbers AF/BC/DE/HL.
    call load_msx2_stage_font
    ld hl, #1970
    ld a, #F0
    call WRTVRM
    inc hl
    ld a, #F1
    call WRTVRM
    inc hl
    ld a, #F2
    call WRTVRM
    inc hl
    ld a, #F3
    call WRTVRM
    inc hl
    ld a, #F4
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    inc hl
    ld a, (msx2_current_screen_index)
    or a
    jp z, .stage_one_digit
    ld a, #F6
    jp .stage_write_digit
.stage_one_digit:
    ld a, #F5
.stage_write_digit:
    jp WRTVRM

wait_msx2_stage_banner:
    ; Keeps the centered stage banner visible for about one second at 60 Hz.
    ; Clobbers AF/B.
    ld b, 60
.stage_wait_loop:
    call wait_frame_busy
    djnz .stage_wait_loop
    ret

reset_msx2_status_border:
    ; Clear final-state border feedback after restart/continue. Clobbers BC.
    ld bc, #0007
    call WRTVDP
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



update_hardware_sprite_input_control_2_players:
    ; Two-player Pong control. Player 1 uses cursor keys, player 2 uses joystick port 1.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    call control_2_players_update_p1_cursor
    call control_2_players_update_p2_joystick
    jp upload_hardware_sprite_attrs

control_2_players_update_p1_cursor:
    xor a
    call GTSTCK
    cp 1
    jp z, control_2_players_p1_up
    cp 2
    jp z, control_2_players_p1_up
    cp 8
    jp z, control_2_players_p1_up
    cp 4
    jp z, control_2_players_p1_down
    cp 5
    jp z, control_2_players_p1_down
    cp 6
    jp z, control_2_players_p1_down
    ret
control_2_players_p1_up:
    ld a, (msx2_player_sprite_y)
    cp 16
    ret z
    ret c
    sub 3
    jp nc, .control_2_players_p1_up_check_min
    ld a, 16
    jp .control_2_players_p1_store_y
.control_2_players_p1_up_check_min:
    cp 16
    jp nc, .control_2_players_p1_store_y
    ld a, 16
.control_2_players_p1_store_y:
    ld (msx2_player_sprite_y), a
    ret
control_2_players_p1_down:
    ld a, (msx2_player_sprite_y)
    cp 160
    ret nc
    add a, 3
    cp 160
    jp c, .control_2_players_p1_down_store
    ld a, 160
.control_2_players_p1_down_store:
    ld (msx2_player_sprite_y), a
    ret

control_2_players_update_p2_joystick:
    ld a, 1
    call GTSTCK
    cp 1
    jp z, control_2_players_p2_up
    cp 2
    jp z, control_2_players_p2_up
    cp 8
    jp z, control_2_players_p2_up
    cp 4
    jp z, control_2_players_p2_down
    cp 5
    jp z, control_2_players_p2_down
    cp 6
    jp z, control_2_players_p2_down
    ret
control_2_players_p2_up:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    cp 16
    ret z
    ret c
    sub 3
    jp nc, .control_2_players_p2_up_check_min
    ld a, 16
    jp .control_2_players_p2_store_y
.control_2_players_p2_up_check_min:
    cp 16
    jp nc, .control_2_players_p2_store_y
    ld a, 16
.control_2_players_p2_store_y:
    ld (hl), a
    ret
control_2_players_p2_down:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    cp 160
    ret nc
    add a, 3
    cp 160
    jp c, .control_2_players_p2_down_store
    ld a, 160
.control_2_players_p2_down_store:
    ld (hl), a
    ret

update_hardware_sprite_input_paddle_horizontal:
    ; Pong/Arkanoid paddle control: left/right only, no jump/gravity and no bullet engine.
    ; Clobbers AF/BC/DE/HL.
    jp update_hardware_sprite_input_shooter_horizontal

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
    ; Player bullet pool for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
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
    call msx2_player_bullet_check_effect_collision
    ld a, (msx2_player_bullet_active)
    or a
    ret z
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
    call msx2_player_bullet_1_check_effect_collision
    ld a, (msx2_player_bullet_1_active)
    or a
    ret z
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
    jp z, .bullet_fire_pressed
    xor a
    call GTTRIG
    or a
    jp nz, .bullet_fire_pressed
    ld a, 1
    call GTTRIG
    or a
    ret z
.bullet_fire_pressed:
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
    call msx2_sfx_fire
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
    call msx2_sfx_fire
    ret


msx2_play_psg_sfx:
    ; HL=register/value table, B=pair count. Clobbers AF/B/HL.
.sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .sfx_loop
    ret

msx2_sfx_fire:
    ld hl, msx2_sfx_fire_data
    ld b, 6
    jp msx2_play_psg_sfx

msx2_sfx_hit:
    ld hl, msx2_sfx_hit_data
    ld b, 6
    jp msx2_play_psg_sfx

msx2_sfx_fire_data:
    db 7,#3E,0,#38,1,#00,11,#30,8,#10,13,#09
msx2_sfx_hit_data:
    db 7,#37,6,#12,11,#70,12,#00,8,#10,13,#00

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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_11:
    ret

msx2_player_bullet_check_effect_collision:
    ; Clears a destructible effect cell hit by the player projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .player_bullet_effect_hit
    pop bc
    ret
.player_bullet_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_player_bullet_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
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
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_11:
    ret

msx2_player_bullet_1_check_effect_collision:
    ; Clears a destructible effect cell hit by the second player projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .player_bullet_1_effect_hit
    pop bc
    ret
.player_bullet_1_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_player_bullet_1_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
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
    call msx2_enemy_bullet_check_effect_collision
    ld a, (msx2_enemy_bullet_active)
    or a
    ret z
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
    call msx2_sfx_hit
    call msx2_apply_damage_respawn
    ret

msx2_enemy_bullet_check_effect_collision:
    ; Clears a destructible effect cell hit by an enemy projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_enemy_bullet_x)
    add a, 4
    ld b, a
    ld a, (msx2_enemy_bullet_y)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_bullet_effect_hit
    pop bc
    ret
.enemy_bullet_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_enemy_bullet_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret

update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right plus jump/gravity.
    ; Clobbers AF/BC/DE/HL.

    jp update_hardware_sprite_input_control_2_players



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
    ld a, (msx2_game_over_restart_lock)
    or a
    jp z, .restart_space_check
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .draw_game_over
    xor a
    ld (msx2_game_over_restart_lock), a
    jp .draw_game_over
.restart_space_check:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, msx2_restart_game
    xor a
    call GTTRIG
    or a
    jp nz, msx2_restart_game
    ld a, 1
    call GTTRIG
    or a
    jp nz, msx2_restart_game
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
    ld (msx2_player_jump_lock), a
    call write_hardware_sprite_attrs
    ret

msx2_advance_to_next_wave_screen:
    ; Advances to the next referenced SCREEN 4 sector, wrapping after the final wave. Clobbers AF.
    ld a, (msx2_current_screen_index)
    inc a
    cp 1
    jp c, .store_next_wave_screen
    xor a
.store_next_wave_screen:
    ld (msx2_current_screen_index), a
    ret

msx2_restart_game:
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_PONG_2P_COURT_screen4
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
    ld (msx2_player_jump_lock), a
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

    ; Two-player Pong right paddle sprite slot 0.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp nc, .control_2_players_sprite_0_visible
    ld a, 208
    ld hl, #1E04
    call write_vram_byte_ext
    jp .control_2_players_sprite_0_done
.control_2_players_sprite_0_visible:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    ld hl, #1E04
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    ld hl, #1E05
    call write_vram_byte_ext
    ld a, 0
    ld hl, #1E06
    call write_vram_byte_ext
    xor a
    ld hl, #1E07
    call write_vram_byte_ext
.control_2_players_sprite_0_done:

    ; Two-player Pong ball sprite slot 1.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, .control_2_players_sprite_1_visible
    ld a, 208
    ld hl, #1E08
    call write_vram_byte_ext
    jp .control_2_players_sprite_1_done
.control_2_players_sprite_1_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E08
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E09
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E0A
    call write_vram_byte_ext
    xor a
    ld hl, #1E0B
    call write_vram_byte_ext
.control_2_players_sprite_1_done:

    ; Unused two-player Pong enemy/hazard sprite slot 2.
    ld a, 208
    ld hl, #1E0C
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 3.
    ld a, 208
    ld hl, #1E10
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 4.
    ld a, 208
    ld hl, #1E14
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 5.
    ld a, 208
    ld hl, #1E18
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 6.
    ld a, 208
    ld hl, #1E1C
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 7.
    ld a, 208
    ld hl, #1E20
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 8.
    ld a, 208
    ld hl, #1E24
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 9.
    ld a, 208
    ld hl, #1E28
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 10.
    ld a, 208
    ld hl, #1E2C
    call write_vram_byte_ext

    ; Unused two-player Pong enemy/hazard sprite slot 11.
    ld a, 208
    ld hl, #1E30
    call write_vram_byte_ext
    ; Player bullet hardware sprite slot 0.
    ld a, (msx2_player_bullet_active)
    or a
    jp nz, .player_bullet_sprite_visible
    ld a, 208
    ld hl, #1E34
    call write_vram_byte_ext
    jp .player_bullet_sprite_done
.player_bullet_sprite_visible:
    ld a, (msx2_player_bullet_y)
    ld hl, #1E34
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_x)
    ld hl, #1E35
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E36
    call write_vram_byte_ext
    xor a
    ld hl, #1E37
    call write_vram_byte_ext
.player_bullet_sprite_done:

    ; Player bullet hardware sprite slot 1.
    ld a, (msx2_player_bullet_1_active)
    or a
    jp nz, .player_bullet_1_sprite_visible
    ld a, 208
    ld hl, #1E38
    call write_vram_byte_ext
    jp .player_bullet_1_sprite_done
.player_bullet_1_sprite_visible:
    ld a, (msx2_player_bullet_1_y)
    ld hl, #1E38
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_1_x)
    ld hl, #1E39
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E3A
    call write_vram_byte_ext
    xor a
    ld hl, #1E3B
    call write_vram_byte_ext
.player_bullet_1_sprite_done:

    ; Enemy bullet hardware sprite slot.
    ld a, (msx2_enemy_bullet_active)
    or a
    jp nz, .enemy_bullet_sprite_visible
    ld a, 208
    ld hl, #1E3C
    call write_vram_byte_ext
    jp .enemy_bullet_sprite_done
.enemy_bullet_sprite_visible:
    ld a, (msx2_enemy_bullet_y)
    ld hl, #1E3C
    call write_vram_byte_ext
    ld a, (msx2_enemy_bullet_x)
    ld hl, #1E3D
    call write_vram_byte_ext
    ld a, 12
    ld hl, #1E3E
    call write_vram_byte_ext
    xor a
    ld hl, #1E3F
    call write_vram_byte_ext
.enemy_bullet_sprite_done:
    ld a, 208
    ld hl, #1E40
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


update_control_2_players_ball:
    ; Ball for control_2_players Pong. Slot 0 is right paddle, slot 1 is the ball.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_dx + 1
    ld a, (hl)
    bit 7, a
    jp nz, control_2_players_ball_left
control_2_players_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x + 1
    ld a, (hl)
    add a, c
    ld b, a
    cp 244
    jp nc, control_2_players_ball_reset_left
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    sub 8
    ld e, a
    ld a, b
    cp e
    jp c, control_2_players_ball_store_x
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    sub 4
    cp c
    jp nc, control_2_players_ball_store_x
    ld a, (hl)
    add a, 20
    cp c
    jp c, control_2_players_ball_store_x
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    sub 8
    ld b, a
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), b
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), #FE
    call control_2_players_ball_angle_from_right_paddle
    call msx2_sfx_hit
    jp control_2_players_ball_y

control_2_players_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x + 1
    ld a, (hl)
    sub c
    jp c, control_2_players_ball_reset_right
    ld b, a
    ld a, (msx2_player_sprite_x)
    add a, 16
    ld e, a
    ld a, b
    cp e
    jp nc, control_2_players_ball_store_x
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_y)
    sub 4
    cp c
    jp nc, control_2_players_ball_store_x
    ld a, (msx2_player_sprite_y)
    add a, 20
    cp c
    jp c, control_2_players_ball_store_x
    ld a, (msx2_player_sprite_x)
    add a, 16
    ld b, a
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), b
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), 2
    call control_2_players_ball_angle_from_left_paddle
    call msx2_sfx_hit
    jp control_2_players_ball_y

control_2_players_ball_store_x:
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), b
    jp control_2_players_ball_y

control_2_players_ball_reset_left:
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), 120
    ld hl, msx2_enemy_runtime_y + 1
    ld (hl), 88
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), #FE
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), 2
    call msx2_sfx_fire
    ret

control_2_players_ball_reset_right:
    ld hl, msx2_enemy_runtime_x + 1
    ld (hl), 120
    ld hl, msx2_enemy_runtime_y + 1
    ld (hl), 88
    ld hl, msx2_enemy_runtime_dx + 1
    ld (hl), 2
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), #FE
    call msx2_sfx_fire
    ret

control_2_players_ball_angle_from_right_paddle:
    ; Sets Pong ball DY from impact point on the right paddle. Clobbers AF/BC/HL.
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld a, b
    cp (hl)
    jp c, control_2_players_ball_angle_steep_up
    sub (hl)
    jp control_2_players_ball_store_angle

control_2_players_ball_angle_from_left_paddle:
    ; Sets Pong ball DY from impact point on the left paddle. Clobbers AF/BC/HL.
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    ld c, a
    ld a, b
    cp c
    jp c, control_2_players_ball_angle_steep_up
    sub c
    jp control_2_players_ball_store_angle

control_2_players_ball_store_angle:
    ; A=ball center relative to paddle top. Produces six vertical angles.
    cp 4
    jp c, .steep_up
    cp 8
    jp c, .up
    cp 13
    jp c, .soft_up
    cp 17
    jp c, .soft_down
    cp 19
    jp c, .down
    ld a, 3
    jp .store
control_2_players_ball_angle_steep_up:
.steep_up:
    ld a, #FD
    jp .store
.up:
    ld a, #FE
    jp .store
.soft_up:
    ld a, #FF
    jp .store
.soft_down:
    ld a, 1
    jp .store
.down:
    ld a, 2
.store:
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), a
    ret

control_2_players_ball_y:
    ld hl, msx2_enemy_runtime_dy + 1
    ld a, (hl)
    bit 7, a
    jp nz, control_2_players_ball_up
control_2_players_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, c
    cp 160
    jp nc, control_2_players_ball_turn_up
    ld (hl), a
    jp control_2_players_ball_check_item
control_2_players_ball_turn_up:
    ld (hl), 160
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), #FE
    call msx2_sfx_hit
    jp control_2_players_ball_check_item
control_2_players_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    sub c
    jp c, control_2_players_ball_turn_down
    cp 16
    jp c, control_2_players_ball_turn_down
    ld (hl), a
    jp control_2_players_ball_check_item
control_2_players_ball_turn_down:
    ld (hl), 16
    ld hl, msx2_enemy_runtime_dy + 1
    ld (hl), 2
    call msx2_sfx_hit
    jp control_2_players_ball_check_item

control_2_players_ball_check_item:
    ; Pong-specific ball/item collision. Effect 3 marks the shoot item target.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x + 1
    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y + 1
    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, control_2_players_ball_collect_item
    pop bc
    ret
control_2_players_ball_collect_item:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy + 1
    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 50
    ld (msx2_score_lo), a
    jp nc, .score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
    call msx2_sfx_fire
    ret


update_msx2_enemy_position_slot_0:
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
    cp 4
    jp z, update_control_2_players_ball
    ret
update_msx2_enemy_position_slot_2:
    ret
update_msx2_enemy_position_slot_3:
    ret
update_msx2_enemy_position_slot_4:
    ret
update_msx2_enemy_position_slot_5:
    ret
update_msx2_enemy_position_slot_6:
    ret
update_msx2_enemy_position_slot_7:
    ret
update_msx2_enemy_position_slot_8:
    ret
update_msx2_enemy_position_slot_9:
    ret
update_msx2_enemy_position_slot_10:
    ret
update_msx2_enemy_position_slot_11:
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
    jp .enemy_no_slot_0


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
    jp .enemy_no_slot_1


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
    jp .enemy_no_slot_2


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
    jp .enemy_no_slot_3


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
    jp .enemy_no_slot_4


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
    jp .enemy_no_slot_5


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
    jp .enemy_no_slot_6


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
    jp .enemy_no_slot_7


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
    jp .enemy_no_slot_8


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
    jp .enemy_no_slot_9


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
    jp .enemy_no_slot_10


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
    jp .enemy_no_slot_11


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

clear_msx2_effect_visual_at_pixel:
    ; B=x pixel, C=y pixel. Clears the containing 16x16 SCREEN 4 name-table cell.
    ; Clobbers AF/BC/DE/HL.
    call screen4_name_cell_from_bc
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

screen4_name_cell_from_bc:
    ; B=x pixel, C=y pixel. Returns HL=top-left name-table address for the containing 16x16 cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
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
    ld a, b
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
    call msx2_screen4_data_bank_enter

    ld bc, #0010
    call WRTVDP
    ld hl, screen4_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    call msx2_screen4_data_bank_leave

    ret

init_msx2_effect_buffers:
    ; Restores each msx2screen mutable effect layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, PONG_2P_COURT_EFFECTS
    ld de, #C080
    ld bc, msx2_layer_size
    ldir
    ret

load_current_msx2_screen4:
    ; Dispatches the active SCREEN 4 room by msx2_current_screen_index. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, load_PONG_2P_COURT_screen4
    jp load_PONG_2P_COURT_screen4

load_PONG_2P_COURT_screen4:
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
    call msx2_screen4_data_bank_enter

    ld hl, PONG_2P_COURT_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 56
    call LDIRVM
    ld hl, PONG_2P_COURT_BANK_0_COLORS
    ld de, #2000
    ld bc, 56
    call LDIRVM
    ld hl, PONG_2P_COURT_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 72
    call LDIRVM
    ld hl, PONG_2P_COURT_BANK_1_COLORS
    ld de, #2800
    ld bc, 72
    call LDIRVM
    ld hl, PONG_2P_COURT_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 56
    call LDIRVM
    ld hl, PONG_2P_COURT_BANK_2_COLORS
    ld de, #3000
    ld bc, 56
    call LDIRVM

    ld hl, PONG_2P_COURT_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
    call msx2_screen4_data_bank_leave

    ld hl, PONG_2P_COURT_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, PONG_2P_COURT_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C080
    ld (msx2_current_effects_ptr), hl
    call apply_PONG_2P_COURT_collected_visuals
    ret

apply_PONG_2P_COURT_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, #C0DA
    ld a, (hl)
    cp 3
    jp z, keep_PONG_2P_COURT_collectible_0
    ld hl, #1954
    call clear_screen4_name_cell_16
keep_PONG_2P_COURT_collectible_0:
    ret


; Per-msx2screen respawn X coordinates
msx2_screen_spawn_x:
    DB #10

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #50

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #00

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #00

; Per-msx2screen Galaxian Attack Wave interval in frames
msx2_screen_attack_interval:
    DB #B4

; Per-msx2screen Galaxian Attack Wave minimum attackers
msx2_screen_attack_min:
    DB #01

; Per-msx2screen Galaxian Attack Wave maximum attackers
msx2_screen_attack_max:
    DB #03

; Per-msx2screen Galaxian Attack Wave random seed
msx2_screen_attack_seed:
    DB #49

; Per-msx2screen active enemy/hazard entity count, capped at 12
msx2_screen_enemy_count:
    DB #02

; Per-msx2screen enemy/hazard entity X coordinates, 12 slots per screen
msx2_screen_enemy_x:
    DB #E0,#70,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard entity Y coordinates, 12 slots per screen
msx2_screen_enemy_y:
    DB #50,#50,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum X, 12 slots per screen
msx2_screen_enemy_min_x:
    DB #E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum X, 12 slots per screen
msx2_screen_enemy_max_x:
    DB #E0,#F0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum Y, 12 slots per screen
msx2_screen_enemy_min_y:
    DB #50,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum Y, 12 slots per screen
msx2_screen_enemy_max_y:
    DB #50,#A0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial movement direction, 12 slots per screen
msx2_screen_enemy_dx:
    DB #00,#02,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial vertical movement direction, 12 slots per screen
msx2_screen_enemy_dy:
    DB #00,#FE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component mode, 12 slots per screen
msx2_screen_enemy_mode:
    DB #00,#04,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

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

; Tiny centered STAGE banner font patterns: S,T,A,G,E,1,2
msx2_stage_font_patterns:
    DB #3E,#60,#60,#3C,#06,#06,#7C,#00,#7E,#18,#18,#18,#18,#18,#18,#00
    DB #18,#24,#42,#7E,#42,#42,#42,#00,#3C,#42,#40,#4E,#42,#42,#3C,#00
    DB #7E,#40,#40,#7C,#40,#40,#7E,#00,#18,#38,#18,#18,#18,#18,#7E,#00
    DB #3C,#42,#02,#0C,#30,#40,#7E,#00


; Pong 2P Court collision layer, 16x14 bytes
PONG_2P_COURT_COLLISION:
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

; Pong 2P Court effects layer, 16x14 bytes
PONG_2P_COURT_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#03,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Pong 2P Court behavior layer, 16x14 bytes
PONG_2P_COURT_BEHAVIOR:
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

    ds #C000 - $, #FF

; ==================================================================
; MSX2 SCREEN 4 cold data bank.
; Mapped to P2/#8000 only while copying palette, sprite patterns, and
; screen pattern/name data into VRAM. Resident gameplay code restores P2
; before returning to normal execution.
; ==================================================================
    org #8000
MSX2_SCREEN4_DATA_BANK_ROM_START:

; Palette bytes: byte1=(R<<4)|B, byte2=G
screen4_palette_data:
    DB #00,#00,#00,#00,#01,#01,#07,#02,#07,#04,#07,#07,#70,#00,#70,#04
    DB #70,#07,#11,#01,#22,#02,#33,#03,#44,#04,#55,#05,#66,#06,#77,#07


msx2_hw_sprite_patterns:
; Hardware metasprite frame 0 part 0: x+0, y+0
msx2_hw_sprite_frame_0_pattern_0:
    DB #07,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#07
    DB #80,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#80
; Shared 16x16 enemy/hazard hardware sprite pattern from MSX2 entity sprite asset
msx2_hw_enemy_sprite_pattern:
    DB #07,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#07
    DB #80,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#80
; Shared 16x16 Pong ball hardware sprite pattern from MSX2 entity sprite asset
msx2_hw_player_bullet_pattern:
    DB #00,#00,#01,#03,#07,#07,#07,#07,#03,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#80,#C0,#E0,#E0,#E0,#E0,#C0,#80,#00,#00,#00,#00,#00,#00
; Shared 16x16 enemy bullet hardware sprite pattern
msx2_hw_enemy_bullet_pattern:
    DB #00,#00,#18,#18,#3C,#3C,#18,#18,#18,#18,#3C,#3C,#18,#18,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
; Line colors for hardware sprite layer 0
msx2_hw_sprite_colors_0:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 0 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_0:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 1 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_1:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 2 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_2:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 3 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_3:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 4 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_4:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 5 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_5:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 6 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_6:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 7 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_7:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 8 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_8:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 9 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_9:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 10 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_10:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for enemy/hazard hardware sprite slot 11 from MSX2 entity sprite asset
msx2_hw_enemy_sprite_colors_11:
    DB #0D,#0F,#05,#05,#05,#05,#0F,#05,#05,#05,#05,#0F,#05,#05,#0F,#0D
; Line colors for Pong ball hardware sprite slot from MSX2 entity sprite asset
msx2_hw_player_bullet_colors:
    DB #0F,#0F,#08,#08,#08,#0F,#0F,#08,#08,#08,#0F,#0F,#0F,#0F,#0F,#0F
; Line colors for enemy bullet hardware sprite slot
msx2_hw_enemy_bullet_colors:
    DB #08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08
msx2_hw_sprite_colors_end:

; 1 player hardware sprite(s), 12 enemy/hazard sprite slots, 2 player bullet slot, 1 enemy bullet slot; next Y=208 terminates the SAT
msx2_hw_sprite_attrs:
    DB #50,#10,#00,#00,#D0,#00,#04,#00,#D0,#00,#04,#00,#D0,#00,#04,#00
    DB #D0,#00,#04,#00,#D0,#00,#04,#00,#D0,#00,#04,#00,#D0,#00,#04,#00
    DB #D0,#00,#04,#00,#D0,#00,#04,#00,#D0,#00,#04,#00,#D0,#00,#04,#00
    DB #D0,#00,#04,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#0C,#00
    DB #D0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


; Pong 2P Court SCREEN 4 name table, 32x24 chars
PONG_2P_COURT_NAMES:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#03,#04
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#05,#06
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#04
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#05,#06,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#07,#08,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#04
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#04
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#04
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06

; Pong 2P Court SCREEN 4 bank 0 compact patterns
PONG_2P_COURT_BANK_0_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#01,#01,#01,#01
    DB #00,#00,#80,#80,#80,#80,#80,#80,#01,#01,#01,#01,#01,#01,#00,#00
    DB #80,#80,#80,#80,#80,#80,#00,#00

; Pong 2P Court SCREEN 4 bank 0 compact colors
PONG_2P_COURT_BANK_0_COLORS:
    DB #CC,#CC,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#CC,#CC
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#D1,#D1,#D1,#D1,#D1,#D1
    DB #11,#11,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#11,#11
    DB #D1,#D1,#D1,#D1,#D1,#D1,#11,#11

; Pong 2P Court SCREEN 4 bank 1 compact patterns
PONG_2P_COURT_BANK_1_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#01,#01,#01,#01
    DB #00,#00,#80,#80,#80,#80,#80,#80,#01,#01,#01,#01,#01,#01,#00,#00
    DB #80,#80,#80,#80,#80,#80,#00,#00,#00,#00,#00,#00,#0F,#10,#03,#03
    DB #00,#00,#00,#00,#F0,#08,#C0,#C0,#03,#03,#10,#0F,#00,#00,#00,#00
    DB #C0,#C0,#08,#F0,#00,#00,#00,#00

; Pong 2P Court SCREEN 4 bank 1 compact colors
PONG_2P_COURT_BANK_1_COLORS:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#D1,#D1,#D1,#D1,#D1,#D1
    DB #11,#11,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#11,#11
    DB #D1,#D1,#D1,#D1,#D1,#D1,#11,#11,#11,#11,#11,#11,#51,#51,#81,#81
    DB #11,#11,#11,#11,#51,#51,#81,#81,#81,#81,#51,#51,#11,#11,#11,#11
    DB #81,#81,#51,#51,#11,#11,#11,#11

; Pong 2P Court SCREEN 4 bank 2 compact patterns
PONG_2P_COURT_BANK_2_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#01,#01,#01,#01
    DB #00,#00,#80,#80,#80,#80,#80,#80,#01,#01,#01,#01,#01,#01,#00,#00
    DB #80,#80,#80,#80,#80,#80,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Pong 2P Court SCREEN 4 bank 2 compact colors
PONG_2P_COURT_BANK_2_COLORS:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#D1,#D1,#D1,#D1,#D1,#D1
    DB #11,#11,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#D1,#11,#11
    DB #D1,#D1,#D1,#D1,#D1,#D1,#11,#11,#CC,#CC,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#CC,#CC

    ds #A000 - $, #FF
    end
