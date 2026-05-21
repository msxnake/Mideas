; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap backend
; Project: mideas_msx2_puck_maze_clone
; Screen mode: SCREEN 5 (Graphics III)
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
SCREEN5_BITMAP_VRAM EQU #0000
SCREEN5_BITMAP_SIZE EQU 27136
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
msx2_effects_runtime_buffers EQU #C020
msx2_effects_runtime_scratch EQU #C200
msx2_enemy_runtime_x EQU #C2E0
msx2_enemy_runtime_y EQU #C2E4
msx2_enemy_runtime_dx EQU #C2E8
msx2_enemy_runtime_dy EQU #C2EC
msx2_enemy_runtime_mode EQU #C2F0
msx2_enemy_runtime_speed EQU #C2F4
msx2_enemy_runtime_tick EQU #C2F8
msx2_runtime_ram_end EQU #C2FC
msx2_runtime_ram_limit EQU #F300
msx2_layer_size EQU 224
msx2_required_collectibles EQU 48

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
    ld a, 5
    call CHGMOD

    ; Enable 212-line display on V9938/V9958.
    ld bc, #8009
    call WRTVDP

    call load_screen5_palette
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_PUCK_MAZE_01_bitmap
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites

    call ENASCR
    ei

    ; MSX2 minimal GameFlow: Start/Text(background)/Transition(cls)/End.
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_PUCK_MAZE_01_bitmap
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites
    jp .main_loop

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
    ; Raw SCREEN 5 backgrounds are larger than 16 KB, so LDIRVM may read data above #8000.
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

clear_screen5_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
    ret

init_hardware_sprites:
    ; SCREEN 5 hardware sprite runtime. Clobbers AF/BC/DE/HL.
    ; Preserve the SCREEN 5 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (#F3E0)
    or #02
    and #FE
    ld (#F3E0), a
    ld b, a
    ld c, #01
    call WRTVDP

    ; Sprite attribute/color/pattern tables live above the SCREEN 5 bitmap.
    ; Use the extended VRAM writer here: BIOS LDIRVM can wrap these addresses
    ; into the visible bitmap area on this backend and corrupt rows around #3800.
    ; In sprite mode 2, R#5 selects the combined color+attribute table:
    ; color table #7400, SAT #7600. Bits 0-2 must be 1.
    ld bc, #EF05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0F06
    call WRTVDP

    ld hl, msx2_hw_sprite_patterns
    ld de, #7800
    ld bc, msx2_hw_sprite_patterns_end - msx2_hw_sprite_patterns
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_colors
    ld de, #7400
    ld bc, msx2_hw_sprite_colors_end - msx2_hw_sprite_colors
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_attrs
    ld de, #7600
    ld bc, 128
    call copy_to_vram_ext

    ld a, 112
    ld (msx2_player_sprite_x), a
    ld a, 112
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    xor a
    ld (msx2_player_sprite_frame), a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    call msx2_load_current_screen_air
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
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

copy_tile_rows_to_vram:
    ; HL=packed 16x16 tile source, DE=SCREEN 5 VRAM destination, B=row count.
    ; Copies 8 packed bytes per row and advances VRAM by one SCREEN 5 scanline.
.tile_row_loop:
    push bc
    ld bc, 8
    call copy_to_vram_ext
    ex de, hl
    ld bc, 128
    add hl, bc
    ex de, hl
    pop bc
    djnz .tile_row_loop
    ret

copy_tile_rect_rows_to_vram:
    ; HL=packed tile source, DE=SCREEN 5 VRAM destination, B=row count, C=packed bytes per row.
    ; Used by MSX2 variable-size visual tiles. Widths are multiples of 8 pixels.
.tile_rect_row_loop:
    push bc
    ld b, 0
    call copy_to_vram_ext
    ex de, hl
    ld bc, 128
    add hl, bc
    ex de, hl
    pop bc
    djnz .tile_rect_row_loop
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
draw_msx2_collectible_hud:
draw_msx2_air_hud:
    ; Inline status HUD disabled for full-map maze screens. Clobbers none.
    ret

draw_msx2_game_over_banner:
    ; Simple visible game-over mark in SCREEN 5. Clobbers AF/BC/DE/HL.
    ld hl, #0828
    ld d, 12
.game_over_row:
    push hl
    ld c, 48
.game_over_col:
    ld a, #88
    call write_vram_byte_ext
    inc hl
    dec c
    jp nz, .game_over_col
    pop hl
    ld bc, 128
    add hl, bc
    dec d
    jp nz, .game_over_row
    ret

draw_msx2_level_complete_banner:
    ; Simple visible level-complete mark in SCREEN 5. Clobbers AF/BC/DE/HL.
    ld hl, #1028
    ld d, 12
.level_complete_row:
    push hl
    ld c, 48
.level_complete_col:
    ld a, #AA
    call write_vram_byte_ext
    inc hl
    dec c
    jp nz, .level_complete_col
    pop hl
    ld bc, 128
    add hl, bc
    dec d
    jp nz, .level_complete_row
    ret

update_msx2_air_timer:
    ; Decrements the SCREEN 5 air/time resource on a coarse frame divider. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
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
    jp z, maze_move_up
    cp 2
    jp z, maze_move_up
    cp 8
    jp z, maze_move_up
    cp 5
    jp z, maze_move_down
    cp 4
    jp z, maze_move_down
    cp 6
    jp z, maze_move_down
    cp 3
    jp z, maze_move_right
    cp 7
    jp z, maze_move_left
    jp upload_hardware_sprite_attrs

maze_move_up:
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

maze_move_down:
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

maze_move_right:
    ld a, (msx2_player_sprite_x)
    cp 224
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
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

maze_move_left:
    ld a, (msx2_player_sprite_x)
    cp 16
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
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

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
    cp 224
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
    cp 16
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
    call load_PUCK_MAZE_01_bitmap
    xor a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_player_dead_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
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
    call load_PUCK_MAZE_01_bitmap
    xor a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
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
    cp 224
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
    cp 16
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
    ; Writes player and enemy sprite attributes to SCREEN 5 SAT. Clobbers AF/BC/DE/HL.
    ; Sprite layer 0: x+0, y+0
    ld a, (msx2_player_sprite_y)
    ld hl, #7600
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    ld hl, #7601
    call write_vram_byte_ext
    ld a, 0
    ld hl, #7602
    call write_vram_byte_ext
    xor a
    ld hl, #7603
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
    ld a, 216
    ld hl, #7604
    call write_vram_byte_ext
    jp .enemy_sprite_0_done
.enemy_sprite_0_visible:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    ld hl, #7604
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    ld hl, #7605
    call write_vram_byte_ext
    ld a, 4
    ld hl, #7606
    call write_vram_byte_ext
    xor a
    ld hl, #7607
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
    ld a, 216
    ld hl, #7608
    call write_vram_byte_ext
    jp .enemy_sprite_1_done
.enemy_sprite_1_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #7608
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #7609
    call write_vram_byte_ext
    ld a, 4
    ld hl, #760A
    call write_vram_byte_ext
    xor a
    ld hl, #760B
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
    ld a, 216
    ld hl, #760C
    call write_vram_byte_ext
    jp .enemy_sprite_2_done
.enemy_sprite_2_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #760C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #760D
    call write_vram_byte_ext
    ld a, 4
    ld hl, #760E
    call write_vram_byte_ext
    xor a
    ld hl, #760F
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
    ld a, 216
    ld hl, #7610
    call write_vram_byte_ext
    jp .enemy_sprite_3_done
.enemy_sprite_3_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #7610
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #7611
    call write_vram_byte_ext
    ld a, 4
    ld hl, #7612
    call write_vram_byte_ext
    xor a
    ld hl, #7613
    call write_vram_byte_ext
.enemy_sprite_3_done:
    ld a, 216
    ld hl, #7614
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:
    call write_hardware_sprite_attrs
    call update_msx2_effect_state
    call update_msx2_enemy_positions
    call update_msx2_enemy_state
    ret

msx2_reset_enemy_runtime_for_current_screen:
    ; Copy static enemy slots for current screen into mutable runtime RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_x
    add hl, de
    ld de, msx2_enemy_runtime_x
    ld bc, 4
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_y
    add hl, de
    ld de, msx2_enemy_runtime_y
    ld bc, 4
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_dx
    add hl, de
    ld de, msx2_enemy_runtime_dx
    ld bc, 4
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_dy
    add hl, de
    ld de, msx2_enemy_runtime_dy
    ld bc, 4
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_mode
    add hl, de
    ld de, msx2_enemy_runtime_mode
    ld bc, 4
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_speed
    ld bc, 4
    ldir
    ld a, (msx2_current_screen_index)
    add a, a
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_tick
    ld bc, 4
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    cp 224
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
    cp 16
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    cp 224
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
    cp 16
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    cp 224
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
    cp 16
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    cp 224
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
    cp 16
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    add a, a
    add a, a
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
    ret
.enemy_damage:
    ld a, 1
    ld (msx2_enemy_hit_flag), a
    ld a, 255
    ld (msx2_enemy_damage_cooldown), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ld b, #08
    ld c, #07
    call WRTVDP
    ret

update_msx2_effect_state:
    ; Effect layer contract: 1=hazard, 2=exit, 3=collectible.
    ; Clobbers AF/BC/DE/HL.
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
    ld b, #07
    jp .write_border
.no_effect:
    xor a
    ld (msx2_collectible_latch), a
    ld b, #01
    jp .write_border
.hazard:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ld b, #08
    jp .write_border
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
    ld b, #07
    jp .write_border
.exit_locked:
    ld a, 1
    ld (msx2_exit_blocked_flag), a
    ld b, #06
    jp .write_border
.collectible:
    ld a, (msx2_collectible_latch)
    or a
    jp nz, .collectible_border
    xor a
    ld (hl), a
    call clear_msx2_collectible_visual
    ld a, 1
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    jp nc, .collectible_border
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
    call draw_msx2_collectible_hud
.collectible_border:
    ld b, #0A
.write_border:
    ld c, #07
    call WRTVDP
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
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ret

clear_msx2_collectible_visual:
    ; Clears the 16x16 visual tile under the active collectible cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_y)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    ld h, a
    ld l, 0
    ld a, (msx2_player_sprite_x)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld d, h
    ld e, l
    ld hl, screen5_blank_tile
    ld b, 16
    call copy_tile_rows_to_vram
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
    inc a
    ld (msx2_player_jump_lock), a
    ret


msx2_try_world_edge_transition_left:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .left_screen_0
    cp 1
    jp z, .left_screen_1
    jp upload_hardware_sprite_attrs
.left_screen_0:
    jp upload_hardware_sprite_attrs

.left_screen_1:
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_PUCK_MAZE_01_bitmap
    call msx2_reset_screen_transition_flags
    call msx2_reset_enemy_runtime_for_current_screen
    call msx2_load_current_screen_air
    call draw_msx2_air_hud
    ld a, 238
    ld (msx2_player_sprite_x), a
    ld a, 112
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    jp update_hardware_sprite_vertical

msx2_try_world_edge_transition_right:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .right_screen_0
    cp 1
    jp z, .right_screen_1
    jp upload_hardware_sprite_attrs
.right_screen_0:
    ld a, 1
    ld (msx2_current_screen_index), a
    call load_PUCK_BONUS_VAULT_bitmap
    call msx2_reset_screen_transition_flags
    call msx2_reset_enemy_runtime_for_current_screen
    call msx2_load_current_screen_air
    call draw_msx2_air_hud
    ld a, 2
    ld (msx2_player_sprite_x), a
    ld a, 48
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    jp update_hardware_sprite_vertical

.right_screen_1:
    jp upload_hardware_sprite_attrs

load_screen5_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_palette_data
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
    ld hl, PUCK_MAZE_01_EFFECTS
    ld de, #C020
    ld bc, msx2_layer_size
    ldir
    ld hl, PUCK_BONUS_VAULT_EFFECTS
    ld de, #C100
    ld bc, msx2_layer_size
    ldir
    ret

load_PUCK_MAZE_01_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_3
    ld de, #0808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #0868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_3
    ld de, #0870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #0878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #1870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #1878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_4
    ld de, #2838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_4
    ld de, #2840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #2870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #2878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #3870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #3878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_5
    ld de, #4838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_5
    ld de, #4840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #4870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #4878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #5870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #5878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_3
    ld de, #6008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_6
    ld de, #6038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_6
    ld de, #6040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_2
    ld de, #6068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_3
    ld de, #6070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6800
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6808
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6810
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6818
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6820
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6828
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6830
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6838
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6840
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6848
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6850
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6858
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6860
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6868
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6870
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_TILE_1
    ld de, #6878
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_MAZE_01_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, PUCK_MAZE_01_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C020
    ld (msx2_current_effects_ptr), hl
    call apply_PUCK_MAZE_01_collected_visuals
    ret

load_PUCK_BONUS_VAULT_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_3
    ld de, #0808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #0868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_3
    ld de, #0870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #0878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #1870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #1878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_4
    ld de, #2838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_4
    ld de, #2840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #2870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #2878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #3870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #3878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_5
    ld de, #4838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_5
    ld de, #4840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #4870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #4878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5800
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5808
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5810
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5818
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5820
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5828
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5830
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5838
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5840
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5848
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5850
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5858
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5860
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5868
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #5870
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #5878
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6000
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_3
    ld de, #6008
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6010
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6018
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6020
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6028
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6030
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_6
    ld de, #6038
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_6
    ld de, #6040
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6048
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6050
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6058
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6060
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_2
    ld de, #6068
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_3
    ld de, #6070
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6078
    ld b, 16
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6800
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6808
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6810
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6818
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6820
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6828
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6830
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6838
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6840
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6848
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6850
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6858
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6860
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6868
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6870
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_TILE_1
    ld de, #6878
    ld b, 4
    call copy_tile_rows_to_vram
    ld hl, PUCK_BONUS_VAULT_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, PUCK_BONUS_VAULT_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C100
    ld (msx2_current_effects_ptr), hl
    call apply_PUCK_BONUS_VAULT_collected_visuals
    ret

apply_PUCK_MAZE_01_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, #C031
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_0
    ld hl, screen5_blank_tile
    ld de, #0808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_0:
    ld hl, #C032
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_1
    ld hl, screen5_blank_tile
    ld de, #0810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_1:
    ld hl, #C033
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_2
    ld hl, screen5_blank_tile
    ld de, #0818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_2:
    ld hl, #C034
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_3
    ld hl, screen5_blank_tile
    ld de, #0820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_3:
    ld hl, #C035
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_4
    ld hl, screen5_blank_tile
    ld de, #0828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_4:
    ld hl, #C037
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_5
    ld hl, screen5_blank_tile
    ld de, #0838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_5:
    ld hl, #C038
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_6
    ld hl, screen5_blank_tile
    ld de, #0840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_6:
    ld hl, #C03A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_7
    ld hl, screen5_blank_tile
    ld de, #0850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_7:
    ld hl, #C03B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_8
    ld hl, screen5_blank_tile
    ld de, #0858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_8:
    ld hl, #C03C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_9
    ld hl, screen5_blank_tile
    ld de, #0860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_9:
    ld hl, #C03D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_10
    ld hl, screen5_blank_tile
    ld de, #0868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_10:
    ld hl, #C03E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_11
    ld hl, screen5_blank_tile
    ld de, #0870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_11:
    ld hl, #C041
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_12
    ld hl, screen5_blank_tile
    ld de, #1008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_12:
    ld hl, #C044
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_13
    ld hl, screen5_blank_tile
    ld de, #1020
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_13:
    ld hl, #C045
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_14
    ld hl, screen5_blank_tile
    ld de, #1028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_14:
    ld hl, #C047
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_15
    ld hl, screen5_blank_tile
    ld de, #1038
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_15:
    ld hl, #C048
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_16
    ld hl, screen5_blank_tile
    ld de, #1040
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_16:
    ld hl, #C04A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_17
    ld hl, screen5_blank_tile
    ld de, #1050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_17:
    ld hl, #C04B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_18
    ld hl, screen5_blank_tile
    ld de, #1058
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_18:
    ld hl, #C04E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_19
    ld hl, screen5_blank_tile
    ld de, #1070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_19:
    ld hl, #C051
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_20
    ld hl, screen5_blank_tile
    ld de, #1808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_20:
    ld hl, #C052
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_21
    ld hl, screen5_blank_tile
    ld de, #1810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_21:
    ld hl, #C053
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_22
    ld hl, screen5_blank_tile
    ld de, #1818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_22:
    ld hl, #C054
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_23
    ld hl, screen5_blank_tile
    ld de, #1820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_23:
    ld hl, #C055
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_24
    ld hl, screen5_blank_tile
    ld de, #1828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_24:
    ld hl, #C056
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_25
    ld hl, screen5_blank_tile
    ld de, #1830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_25:
    ld hl, #C057
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_26
    ld hl, screen5_blank_tile
    ld de, #1838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_26:
    ld hl, #C058
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_27
    ld hl, screen5_blank_tile
    ld de, #1840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_27:
    ld hl, #C059
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_28
    ld hl, screen5_blank_tile
    ld de, #1848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_28:
    ld hl, #C05A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_29
    ld hl, screen5_blank_tile
    ld de, #1850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_29:
    ld hl, #C05B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_30
    ld hl, screen5_blank_tile
    ld de, #1858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_30:
    ld hl, #C05C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_31
    ld hl, screen5_blank_tile
    ld de, #1860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_31:
    ld hl, #C05D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_32
    ld hl, screen5_blank_tile
    ld de, #1868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_32:
    ld hl, #C05E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_33
    ld hl, screen5_blank_tile
    ld de, #1870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_33:
    ld hl, #C063
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_34
    ld hl, screen5_blank_tile
    ld de, #2018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_34:
    ld hl, #C065
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_35
    ld hl, screen5_blank_tile
    ld de, #2028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_35:
    ld hl, #C06A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_36
    ld hl, screen5_blank_tile
    ld de, #2050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_36:
    ld hl, #C06C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_37
    ld hl, screen5_blank_tile
    ld de, #2060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_37:
    ld hl, #C071
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_38
    ld hl, screen5_blank_tile
    ld de, #2808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_38:
    ld hl, #C072
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_39
    ld hl, screen5_blank_tile
    ld de, #2810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_39:
    ld hl, #C073
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_40
    ld hl, screen5_blank_tile
    ld de, #2818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_40:
    ld hl, #C075
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_41
    ld hl, screen5_blank_tile
    ld de, #2828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_41:
    ld hl, #C076
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_42
    ld hl, screen5_blank_tile
    ld de, #2830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_42:
    ld hl, #C079
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_43
    ld hl, screen5_blank_tile
    ld de, #2848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_43:
    ld hl, #C07A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_44
    ld hl, screen5_blank_tile
    ld de, #2850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_44:
    ld hl, #C07C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_45
    ld hl, screen5_blank_tile
    ld de, #2860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_45:
    ld hl, #C07D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_46
    ld hl, screen5_blank_tile
    ld de, #2868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_46:
    ld hl, #C07E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_47
    ld hl, screen5_blank_tile
    ld de, #2870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_47:
    ld hl, #C081
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_48
    ld hl, screen5_blank_tile
    ld de, #3008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_48:
    ld hl, #C083
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_49
    ld hl, screen5_blank_tile
    ld de, #3018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_49:
    ld hl, #C086
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_50
    ld hl, screen5_blank_tile
    ld de, #3030
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_50:
    ld hl, #C089
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_51
    ld hl, screen5_blank_tile
    ld de, #3048
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_51:
    ld hl, #C08C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_52
    ld hl, screen5_blank_tile
    ld de, #3060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_52:
    ld hl, #C08E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_53
    ld hl, screen5_blank_tile
    ld de, #3070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_53:
    ld hl, #C091
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_54
    ld hl, screen5_blank_tile
    ld de, #3808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_54:
    ld hl, #C093
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_55
    ld hl, screen5_blank_tile
    ld de, #3818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_55:
    ld hl, #C094
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_56
    ld hl, screen5_blank_tile
    ld de, #3820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_56:
    ld hl, #C095
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_57
    ld hl, screen5_blank_tile
    ld de, #3828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_57:
    ld hl, #C096
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_58
    ld hl, screen5_blank_tile
    ld de, #3830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_58:
    ld hl, #C098
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_59
    ld hl, screen5_blank_tile
    ld de, #3840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_59:
    ld hl, #C099
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_60
    ld hl, screen5_blank_tile
    ld de, #3848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_60:
    ld hl, #C09A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_61
    ld hl, screen5_blank_tile
    ld de, #3850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_61:
    ld hl, #C09B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_62
    ld hl, screen5_blank_tile
    ld de, #3858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_62:
    ld hl, #C09C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_63
    ld hl, screen5_blank_tile
    ld de, #3860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_63:
    ld hl, #C09E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_64
    ld hl, screen5_blank_tile
    ld de, #3870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_64:
    ld hl, #C0A1
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_65
    ld hl, screen5_blank_tile
    ld de, #4008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_65:
    ld hl, #C0A3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_66
    ld hl, screen5_blank_tile
    ld de, #4018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_66:
    ld hl, #C0A6
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_67
    ld hl, screen5_blank_tile
    ld de, #4030
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_67:
    ld hl, #C0A9
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_68
    ld hl, screen5_blank_tile
    ld de, #4048
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_68:
    ld hl, #C0AC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_69
    ld hl, screen5_blank_tile
    ld de, #4060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_69:
    ld hl, #C0AE
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_70
    ld hl, screen5_blank_tile
    ld de, #4070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_70:
    ld hl, #C0B1
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_71
    ld hl, screen5_blank_tile
    ld de, #4808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_71:
    ld hl, #C0B2
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_72
    ld hl, screen5_blank_tile
    ld de, #4810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_72:
    ld hl, #C0B3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_73
    ld hl, screen5_blank_tile
    ld de, #4818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_73:
    ld hl, #C0B5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_74
    ld hl, screen5_blank_tile
    ld de, #4828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_74:
    ld hl, #C0B6
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_75
    ld hl, screen5_blank_tile
    ld de, #4830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_75:
    ld hl, #C0B7
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_76
    ld hl, screen5_blank_tile
    ld de, #4838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_76:
    ld hl, #C0B8
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_77
    ld hl, screen5_blank_tile
    ld de, #4840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_77:
    ld hl, #C0B9
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_78
    ld hl, screen5_blank_tile
    ld de, #4848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_78:
    ld hl, #C0BA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_79
    ld hl, screen5_blank_tile
    ld de, #4850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_79:
    ld hl, #C0BC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_80
    ld hl, screen5_blank_tile
    ld de, #4860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_80:
    ld hl, #C0BD
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_81
    ld hl, screen5_blank_tile
    ld de, #4868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_81:
    ld hl, #C0BE
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_82
    ld hl, screen5_blank_tile
    ld de, #4870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_82:
    ld hl, #C0C3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_83
    ld hl, screen5_blank_tile
    ld de, #5018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_83:
    ld hl, #C0C5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_84
    ld hl, screen5_blank_tile
    ld de, #5028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_84:
    ld hl, #C0CA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_85
    ld hl, screen5_blank_tile
    ld de, #5050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_85:
    ld hl, #C0CC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_86
    ld hl, screen5_blank_tile
    ld de, #5060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_86:
    ld hl, #C0D1
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_87
    ld hl, screen5_blank_tile
    ld de, #5808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_87:
    ld hl, #C0D2
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_88
    ld hl, screen5_blank_tile
    ld de, #5810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_88:
    ld hl, #C0D3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_89
    ld hl, screen5_blank_tile
    ld de, #5818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_89:
    ld hl, #C0D4
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_90
    ld hl, screen5_blank_tile
    ld de, #5820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_90:
    ld hl, #C0D5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_91
    ld hl, screen5_blank_tile
    ld de, #5828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_91:
    ld hl, #C0D6
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_92
    ld hl, screen5_blank_tile
    ld de, #5830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_92:
    ld hl, #C0D7
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_93
    ld hl, screen5_blank_tile
    ld de, #5838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_93:
    ld hl, #C0D8
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_94
    ld hl, screen5_blank_tile
    ld de, #5840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_94:
    ld hl, #C0D9
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_95
    ld hl, screen5_blank_tile
    ld de, #5848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_95:
    ld hl, #C0DA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_96
    ld hl, screen5_blank_tile
    ld de, #5850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_96:
    ld hl, #C0DB
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_97
    ld hl, screen5_blank_tile
    ld de, #5858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_97:
    ld hl, #C0DC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_98
    ld hl, screen5_blank_tile
    ld de, #5860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_98:
    ld hl, #C0DD
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_99
    ld hl, screen5_blank_tile
    ld de, #5868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_99:
    ld hl, #C0DE
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_100
    ld hl, screen5_blank_tile
    ld de, #5870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_100:
    ld hl, #C0E1
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_101
    ld hl, screen5_blank_tile
    ld de, #6008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_101:
    ld hl, #C0E2
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_102
    ld hl, screen5_blank_tile
    ld de, #6010
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_102:
    ld hl, #C0E3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_103
    ld hl, screen5_blank_tile
    ld de, #6018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_103:
    ld hl, #C0E4
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_104
    ld hl, screen5_blank_tile
    ld de, #6020
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_104:
    ld hl, #C0E5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_105
    ld hl, screen5_blank_tile
    ld de, #6028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_105:
    ld hl, #C0EA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_106
    ld hl, screen5_blank_tile
    ld de, #6050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_106:
    ld hl, #C0EB
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_107
    ld hl, screen5_blank_tile
    ld de, #6058
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_107:
    ld hl, #C0EC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_108
    ld hl, screen5_blank_tile
    ld de, #6060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_108:
    ld hl, #C0ED
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_109
    ld hl, screen5_blank_tile
    ld de, #6068
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_109:
    ld hl, #C0EE
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_MAZE_01_collectible_110
    ld hl, screen5_blank_tile
    ld de, #6070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_MAZE_01_collectible_110:
    ret

apply_PUCK_BONUS_VAULT_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, #C111
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_0
    ld hl, screen5_blank_tile
    ld de, #0808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_0:
    ld hl, #C112
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_1
    ld hl, screen5_blank_tile
    ld de, #0810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_1:
    ld hl, #C113
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_2
    ld hl, screen5_blank_tile
    ld de, #0818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_2:
    ld hl, #C114
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_3
    ld hl, screen5_blank_tile
    ld de, #0820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_3:
    ld hl, #C115
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_4
    ld hl, screen5_blank_tile
    ld de, #0828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_4:
    ld hl, #C117
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_5
    ld hl, screen5_blank_tile
    ld de, #0838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_5:
    ld hl, #C118
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_6
    ld hl, screen5_blank_tile
    ld de, #0840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_6:
    ld hl, #C11A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_7
    ld hl, screen5_blank_tile
    ld de, #0850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_7:
    ld hl, #C11B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_8
    ld hl, screen5_blank_tile
    ld de, #0858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_8:
    ld hl, #C11C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_9
    ld hl, screen5_blank_tile
    ld de, #0860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_9:
    ld hl, #C11D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_10
    ld hl, screen5_blank_tile
    ld de, #0868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_10:
    ld hl, #C11E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_11
    ld hl, screen5_blank_tile
    ld de, #0870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_11:
    ld hl, #C121
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_12
    ld hl, screen5_blank_tile
    ld de, #1008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_12:
    ld hl, #C124
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_13
    ld hl, screen5_blank_tile
    ld de, #1020
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_13:
    ld hl, #C125
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_14
    ld hl, screen5_blank_tile
    ld de, #1028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_14:
    ld hl, #C127
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_15
    ld hl, screen5_blank_tile
    ld de, #1038
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_15:
    ld hl, #C128
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_16
    ld hl, screen5_blank_tile
    ld de, #1040
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_16:
    ld hl, #C12A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_17
    ld hl, screen5_blank_tile
    ld de, #1050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_17:
    ld hl, #C12B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_18
    ld hl, screen5_blank_tile
    ld de, #1058
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_18:
    ld hl, #C12E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_19
    ld hl, screen5_blank_tile
    ld de, #1070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_19:
    ld hl, #C131
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_20
    ld hl, screen5_blank_tile
    ld de, #1808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_20:
    ld hl, #C132
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_21
    ld hl, screen5_blank_tile
    ld de, #1810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_21:
    ld hl, #C133
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_22
    ld hl, screen5_blank_tile
    ld de, #1818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_22:
    ld hl, #C134
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_23
    ld hl, screen5_blank_tile
    ld de, #1820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_23:
    ld hl, #C135
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_24
    ld hl, screen5_blank_tile
    ld de, #1828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_24:
    ld hl, #C136
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_25
    ld hl, screen5_blank_tile
    ld de, #1830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_25:
    ld hl, #C137
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_26
    ld hl, screen5_blank_tile
    ld de, #1838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_26:
    ld hl, #C138
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_27
    ld hl, screen5_blank_tile
    ld de, #1840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_27:
    ld hl, #C139
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_28
    ld hl, screen5_blank_tile
    ld de, #1848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_28:
    ld hl, #C13A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_29
    ld hl, screen5_blank_tile
    ld de, #1850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_29:
    ld hl, #C13B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_30
    ld hl, screen5_blank_tile
    ld de, #1858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_30:
    ld hl, #C13C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_31
    ld hl, screen5_blank_tile
    ld de, #1860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_31:
    ld hl, #C13D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_32
    ld hl, screen5_blank_tile
    ld de, #1868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_32:
    ld hl, #C13E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_33
    ld hl, screen5_blank_tile
    ld de, #1870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_33:
    ld hl, #C143
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_34
    ld hl, screen5_blank_tile
    ld de, #2018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_34:
    ld hl, #C145
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_35
    ld hl, screen5_blank_tile
    ld de, #2028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_35:
    ld hl, #C14A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_36
    ld hl, screen5_blank_tile
    ld de, #2050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_36:
    ld hl, #C14C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_37
    ld hl, screen5_blank_tile
    ld de, #2060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_37:
    ld hl, #C151
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_38
    ld hl, screen5_blank_tile
    ld de, #2808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_38:
    ld hl, #C152
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_39
    ld hl, screen5_blank_tile
    ld de, #2810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_39:
    ld hl, #C153
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_40
    ld hl, screen5_blank_tile
    ld de, #2818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_40:
    ld hl, #C155
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_41
    ld hl, screen5_blank_tile
    ld de, #2828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_41:
    ld hl, #C156
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_42
    ld hl, screen5_blank_tile
    ld de, #2830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_42:
    ld hl, #C159
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_43
    ld hl, screen5_blank_tile
    ld de, #2848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_43:
    ld hl, #C15A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_44
    ld hl, screen5_blank_tile
    ld de, #2850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_44:
    ld hl, #C15C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_45
    ld hl, screen5_blank_tile
    ld de, #2860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_45:
    ld hl, #C15D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_46
    ld hl, screen5_blank_tile
    ld de, #2868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_46:
    ld hl, #C15E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_47
    ld hl, screen5_blank_tile
    ld de, #2870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_47:
    ld hl, #C161
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_48
    ld hl, screen5_blank_tile
    ld de, #3008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_48:
    ld hl, #C163
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_49
    ld hl, screen5_blank_tile
    ld de, #3018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_49:
    ld hl, #C166
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_50
    ld hl, screen5_blank_tile
    ld de, #3030
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_50:
    ld hl, #C169
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_51
    ld hl, screen5_blank_tile
    ld de, #3048
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_51:
    ld hl, #C16C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_52
    ld hl, screen5_blank_tile
    ld de, #3060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_52:
    ld hl, #C16E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_53
    ld hl, screen5_blank_tile
    ld de, #3070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_53:
    ld hl, #C171
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_54
    ld hl, screen5_blank_tile
    ld de, #3808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_54:
    ld hl, #C173
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_55
    ld hl, screen5_blank_tile
    ld de, #3818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_55:
    ld hl, #C174
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_56
    ld hl, screen5_blank_tile
    ld de, #3820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_56:
    ld hl, #C175
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_57
    ld hl, screen5_blank_tile
    ld de, #3828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_57:
    ld hl, #C176
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_58
    ld hl, screen5_blank_tile
    ld de, #3830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_58:
    ld hl, #C178
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_59
    ld hl, screen5_blank_tile
    ld de, #3840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_59:
    ld hl, #C179
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_60
    ld hl, screen5_blank_tile
    ld de, #3848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_60:
    ld hl, #C17A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_61
    ld hl, screen5_blank_tile
    ld de, #3850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_61:
    ld hl, #C17B
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_62
    ld hl, screen5_blank_tile
    ld de, #3858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_62:
    ld hl, #C17C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_63
    ld hl, screen5_blank_tile
    ld de, #3860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_63:
    ld hl, #C17E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_64
    ld hl, screen5_blank_tile
    ld de, #3870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_64:
    ld hl, #C181
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_65
    ld hl, screen5_blank_tile
    ld de, #4008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_65:
    ld hl, #C183
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_66
    ld hl, screen5_blank_tile
    ld de, #4018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_66:
    ld hl, #C186
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_67
    ld hl, screen5_blank_tile
    ld de, #4030
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_67:
    ld hl, #C189
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_68
    ld hl, screen5_blank_tile
    ld de, #4048
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_68:
    ld hl, #C18C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_69
    ld hl, screen5_blank_tile
    ld de, #4060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_69:
    ld hl, #C18E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_70
    ld hl, screen5_blank_tile
    ld de, #4070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_70:
    ld hl, #C191
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_71
    ld hl, screen5_blank_tile
    ld de, #4808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_71:
    ld hl, #C192
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_72
    ld hl, screen5_blank_tile
    ld de, #4810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_72:
    ld hl, #C193
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_73
    ld hl, screen5_blank_tile
    ld de, #4818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_73:
    ld hl, #C195
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_74
    ld hl, screen5_blank_tile
    ld de, #4828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_74:
    ld hl, #C196
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_75
    ld hl, screen5_blank_tile
    ld de, #4830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_75:
    ld hl, #C197
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_76
    ld hl, screen5_blank_tile
    ld de, #4838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_76:
    ld hl, #C198
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_77
    ld hl, screen5_blank_tile
    ld de, #4840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_77:
    ld hl, #C199
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_78
    ld hl, screen5_blank_tile
    ld de, #4848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_78:
    ld hl, #C19A
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_79
    ld hl, screen5_blank_tile
    ld de, #4850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_79:
    ld hl, #C19C
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_80
    ld hl, screen5_blank_tile
    ld de, #4860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_80:
    ld hl, #C19D
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_81
    ld hl, screen5_blank_tile
    ld de, #4868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_81:
    ld hl, #C19E
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_82
    ld hl, screen5_blank_tile
    ld de, #4870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_82:
    ld hl, #C1A3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_83
    ld hl, screen5_blank_tile
    ld de, #5018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_83:
    ld hl, #C1A5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_84
    ld hl, screen5_blank_tile
    ld de, #5028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_84:
    ld hl, #C1AA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_85
    ld hl, screen5_blank_tile
    ld de, #5050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_85:
    ld hl, #C1AC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_86
    ld hl, screen5_blank_tile
    ld de, #5060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_86:
    ld hl, #C1B1
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_87
    ld hl, screen5_blank_tile
    ld de, #5808
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_87:
    ld hl, #C1B2
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_88
    ld hl, screen5_blank_tile
    ld de, #5810
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_88:
    ld hl, #C1B3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_89
    ld hl, screen5_blank_tile
    ld de, #5818
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_89:
    ld hl, #C1B4
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_90
    ld hl, screen5_blank_tile
    ld de, #5820
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_90:
    ld hl, #C1B5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_91
    ld hl, screen5_blank_tile
    ld de, #5828
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_91:
    ld hl, #C1B6
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_92
    ld hl, screen5_blank_tile
    ld de, #5830
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_92:
    ld hl, #C1B7
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_93
    ld hl, screen5_blank_tile
    ld de, #5838
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_93:
    ld hl, #C1B8
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_94
    ld hl, screen5_blank_tile
    ld de, #5840
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_94:
    ld hl, #C1B9
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_95
    ld hl, screen5_blank_tile
    ld de, #5848
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_95:
    ld hl, #C1BA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_96
    ld hl, screen5_blank_tile
    ld de, #5850
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_96:
    ld hl, #C1BB
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_97
    ld hl, screen5_blank_tile
    ld de, #5858
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_97:
    ld hl, #C1BC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_98
    ld hl, screen5_blank_tile
    ld de, #5860
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_98:
    ld hl, #C1BD
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_99
    ld hl, screen5_blank_tile
    ld de, #5868
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_99:
    ld hl, #C1BE
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_100
    ld hl, screen5_blank_tile
    ld de, #5870
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_100:
    ld hl, #C1C1
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_101
    ld hl, screen5_blank_tile
    ld de, #6008
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_101:
    ld hl, #C1C2
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_102
    ld hl, screen5_blank_tile
    ld de, #6010
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_102:
    ld hl, #C1C3
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_103
    ld hl, screen5_blank_tile
    ld de, #6018
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_103:
    ld hl, #C1C4
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_104
    ld hl, screen5_blank_tile
    ld de, #6020
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_104:
    ld hl, #C1C5
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_105
    ld hl, screen5_blank_tile
    ld de, #6028
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_105:
    ld hl, #C1CA
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_106
    ld hl, screen5_blank_tile
    ld de, #6050
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_106:
    ld hl, #C1CB
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_107
    ld hl, screen5_blank_tile
    ld de, #6058
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_107:
    ld hl, #C1CC
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_108
    ld hl, screen5_blank_tile
    ld de, #6060
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_108:
    ld hl, #C1CD
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_109
    ld hl, screen5_blank_tile
    ld de, #6068
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_109:
    ld hl, #C1CE
    ld a, (hl)
    cp 3
    jp z, keep_PUCK_BONUS_VAULT_collectible_110
    ld hl, screen5_blank_tile
    ld de, #6070
    ld b, 16
    call copy_tile_rows_to_vram
keep_PUCK_BONUS_VAULT_collectible_110:
    ret

; Palette bytes: byte1=(R<<4)|B, byte2=G
screen5_palette_data:
    DB #00,#00,#00,#00,#07,#02,#07,#04,#07,#07,#70,#07,#70,#04,#70,#00
    DB #75,#03,#03,#07,#77,#07,#55,#05,#37,#00,#77,#00,#00,#05,#72,#06

; Per-msx2screen respawn X coordinates
msx2_screen_spawn_x:
    DB #70,#20

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #70,#30

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #30,#0C

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #FF,#FF

; Per-msx2screen active enemy/hazard entity count, capped at 4
msx2_screen_enemy_count:
    DB #04,#01

; Per-msx2screen enemy/hazard entity X coordinates, 4 slots per screen
msx2_screen_enemy_x:
    DB #70,#A0,#40,#D0,#A0,#00,#00,#00

; Per-msx2screen enemy/hazard entity Y coordinates, 4 slots per screen
msx2_screen_enemy_y:
    DB #50,#30,#90,#90,#90,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum X, 4 slots per screen
msx2_screen_enemy_min_x:
    DB #70,#A0,#40,#D0,#A0,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum X, 4 slots per screen
msx2_screen_enemy_max_x:
    DB #70,#A0,#40,#D0,#A0,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum Y, 4 slots per screen
msx2_screen_enemy_min_y:
    DB #50,#30,#90,#90,#90,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum Y, 4 slots per screen
msx2_screen_enemy_max_y:
    DB #50,#30,#90,#90,#90,#00,#00,#00

; Per-msx2screen enemy/hazard initial movement direction, 4 slots per screen
msx2_screen_enemy_dx:
    DB #FF,#00,#FF,#00,#FF,#00,#00,#00

; Per-msx2screen enemy/hazard initial vertical movement direction, 4 slots per screen
msx2_screen_enemy_dy:
    DB #00,#01,#00,#FF,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component mode, 4 slots per screen
msx2_screen_enemy_mode:
    DB #02,#02,#02,#02,#02,#00,#00,#00

; Per-msx2screen enemy/hazard movement component frame delay, 4 slots per screen
msx2_screen_enemy_speed:
    DB #04,#05,#04,#04,#04,#02,#02,#02

; Packed blank 16x16 tile used to erase collected items
screen5_blank_tile:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 collision layer, 16x14 bytes
screen5_empty_collision_layer:
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 effects layer, 16x14 bytes
screen5_empty_effects_layer:
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 behavior layer, 16x14 bytes
screen5_empty_behavior_layer:
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


msx2_hw_sprite_patterns:
; Hardware metasprite part 0: x+0, y+0
msx2_hw_sprite_pattern_0:
    DB #00,#0F,#1F,#3F,#7F,#7F,#7F,#7F,#7F,#7F,#7F,#7F,#3F,#1F,#0F,#00
    DB #00,#F0,#F8,#FC,#F8,#E0,#C0,#00,#00,#C0,#E0,#F8,#FC,#F8,#F0,#00
; Shared 16x16 enemy/hazard hardware sprite pattern
msx2_hw_enemy_sprite_pattern:
    DB #07,#1F,#3F,#7F,#67,#E7,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#EE,#C6,#80
    DB #E0,#F8,#FC,#FE,#9E,#9F,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#EF,#31,#01
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
; Line colors for hardware sprite layer 0
msx2_hw_sprite_colors_0:
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
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
msx2_hw_sprite_colors_end:

; 1 player hardware sprite(s), 4 enemy/hazard sprite slots; next Y=216 terminates the SAT
msx2_hw_sprite_attrs:
    DB #70,#70,#00,#00,#D8,#00,#04,#00,#D8,#00,#04,#00,#D8,#00,#04,#00
    DB #D8,#00,#04,#00,#D8,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


; Puck Maze 01 collision layer, 16x14 bytes
PUCK_MAZE_01_COLLISION:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #01,#00,#00,#00,#00,#00,#01,#00,#00,#01,#00,#00,#00,#00,#00,#01
    DB #01,#00,#01,#01,#00,#00,#01,#00,#00,#01,#00,#00,#01,#01,#00,#01
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#01,#01,#00,#01,#00,#01,#01,#01,#01,#00,#01,#00,#01,#01,#01
    DB #01,#00,#00,#00,#01,#00,#00,#01,#01,#00,#00,#01,#00,#00,#00,#01
    DB #01,#00,#01,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#01,#00,#01
    DB #01,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#01
    DB #01,#00,#01,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#01,#00,#01
    DB #01,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#01
    DB #01,#01,#01,#00,#01,#00,#01,#01,#01,#01,#00,#01,#00,#01,#01,#01
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#00,#00,#00,#00,#00,#01,#00,#00,#01,#00,#00,#00,#00,#00,#01
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Puck Maze 01 effects layer, 16x14 bytes
PUCK_MAZE_01_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#03,#03,#03,#03,#03,#00,#03,#03,#00,#03,#03,#03,#03,#03,#00
    DB #00,#03,#00,#00,#03,#03,#00,#03,#03,#00,#03,#03,#00,#00,#03,#00
    DB #00,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#03,#00,#03,#00,#00,#00,#00,#03,#00,#03,#00,#00,#00
    DB #00,#03,#03,#03,#00,#03,#03,#00,#00,#03,#03,#00,#03,#03,#03,#00
    DB #00,#03,#00,#03,#00,#00,#03,#00,#00,#03,#00,#00,#03,#00,#03,#00
    DB #00,#03,#00,#03,#03,#03,#03,#00,#03,#03,#03,#03,#03,#00,#03,#00
    DB #00,#03,#00,#03,#00,#00,#03,#00,#00,#03,#00,#00,#03,#00,#03,#00
    DB #00,#03,#03,#03,#00,#03,#03,#03,#03,#03,#03,#00,#03,#03,#03,#00
    DB #00,#00,#00,#03,#00,#03,#00,#00,#00,#00,#03,#00,#03,#00,#00,#00
    DB #00,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#03,#03,#03,#03,#03,#00,#02,#02,#00,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Puck Maze 01 behavior layer, 16x14 bytes
PUCK_MAZE_01_BEHAVIOR:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#01,#01,#01,#01,#01,#00,#01,#01,#00,#01,#01,#01,#01,#01,#00
    DB #00,#01,#00,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#00,#01,#00
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00
    DB #00,#00,#00,#01,#00,#01,#00,#00,#00,#00,#01,#00,#01,#00,#00,#00
    DB #00,#01,#01,#01,#00,#01,#01,#01,#01,#01,#01,#00,#01,#01,#01,#00
    DB #00,#01,#00,#01,#00,#00,#01,#00,#00,#01,#00,#00,#01,#00,#01,#00
    DB #00,#01,#00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00,#01,#00
    DB #00,#01,#00,#01,#00,#00,#01,#00,#00,#01,#00,#00,#01,#00,#01,#00
    DB #00,#01,#01,#01,#00,#01,#01,#01,#01,#01,#01,#00,#01,#01,#01,#00
    DB #00,#00,#00,#01,#00,#01,#00,#00,#00,#00,#01,#00,#01,#00,#00,#00
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00
    DB #00,#01,#01,#01,#01,#01,#00,#01,#01,#00,#01,#01,#01,#01,#01,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Puck Bonus Vault collision layer, 16x14 bytes
PUCK_BONUS_VAULT_COLLISION:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #01,#00,#00,#00,#00,#00,#01,#00,#00,#01,#00,#00,#00,#00,#00,#01
    DB #01,#00,#01,#01,#00,#00,#01,#00,#00,#01,#00,#00,#01,#01,#00,#01
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#01,#01,#00,#01,#00,#01,#01,#01,#01,#00,#01,#00,#01,#01,#01
    DB #01,#00,#00,#00,#01,#00,#00,#01,#01,#00,#00,#01,#00,#00,#00,#01
    DB #01,#00,#01,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#01,#00,#01
    DB #01,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#01
    DB #01,#00,#01,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#01,#00,#01
    DB #01,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#01
    DB #01,#01,#01,#00,#01,#00,#01,#01,#01,#01,#00,#01,#00,#01,#01,#01
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01
    DB #01,#00,#00,#00,#00,#00,#01,#00,#00,#01,#00,#00,#00,#00,#00,#01
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Puck Bonus Vault effects layer, 16x14 bytes
PUCK_BONUS_VAULT_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#03,#03,#03,#03,#03,#00,#03,#03,#00,#03,#03,#03,#03,#03,#00
    DB #00,#03,#00,#00,#03,#03,#00,#03,#03,#00,#03,#03,#00,#00,#03,#00
    DB #00,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#03,#00,#03,#00,#00,#00,#00,#03,#00,#03,#00,#00,#00
    DB #00,#03,#03,#03,#00,#03,#03,#00,#00,#03,#03,#00,#03,#03,#03,#00
    DB #00,#03,#00,#03,#00,#00,#03,#00,#00,#03,#00,#00,#03,#00,#03,#00
    DB #00,#03,#00,#03,#03,#03,#03,#00,#03,#03,#03,#03,#03,#00,#03,#00
    DB #00,#03,#00,#03,#00,#00,#03,#00,#00,#03,#00,#00,#03,#00,#03,#00
    DB #00,#03,#03,#03,#00,#03,#03,#03,#03,#03,#03,#00,#03,#03,#03,#00
    DB #00,#00,#00,#03,#00,#03,#00,#00,#00,#00,#03,#00,#03,#00,#00,#00
    DB #00,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#03,#03,#03,#03,#03,#00,#02,#02,#00,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Puck Bonus Vault behavior layer, 16x14 bytes
PUCK_BONUS_VAULT_BEHAVIOR:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#01,#01,#01,#01,#01,#00,#01,#01,#00,#01,#01,#01,#01,#01,#00
    DB #00,#01,#00,#00,#01,#01,#00,#01,#01,#00,#01,#01,#00,#00,#01,#00
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00
    DB #00,#00,#00,#01,#00,#01,#00,#00,#00,#00,#01,#00,#01,#00,#00,#00
    DB #00,#01,#01,#01,#00,#01,#01,#01,#01,#01,#01,#00,#01,#01,#01,#00
    DB #00,#01,#00,#01,#00,#00,#01,#00,#00,#01,#00,#00,#01,#00,#01,#00
    DB #00,#01,#00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00,#01,#00
    DB #00,#01,#00,#01,#00,#00,#01,#00,#00,#01,#00,#00,#01,#00,#01,#00
    DB #00,#01,#01,#01,#00,#01,#01,#01,#01,#01,#01,#00,#01,#01,#01,#00
    DB #00,#00,#00,#01,#00,#01,#00,#00,#00,#00,#01,#00,#01,#00,#00,#00
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00
    DB #00,#01,#01,#01,#01,#01,#00,#01,#01,#00,#01,#01,#01,#01,#01,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Puck Maze 01 tile 0, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Puck Maze 01 tile 1, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_1:
    DB #44,#44,#44,#44,#44,#44,#44,#44,#43,#33,#33,#33,#33,#33,#33,#3C
    DB #43,#33,#33,#33,#33,#33,#33,#3C,#43,#32,#22,#22,#22,#22,#23,#3C
    DB #43,#32,#22,#22,#22,#22,#23,#3C,#43,#32,#2C,#CC,#CC,#C2,#23,#3C
    DB #43,#32,#2C,#CC,#CC,#C2,#23,#3C,#43,#32,#2C,#CC,#CC,#C2,#23,#3C
    DB #43,#32,#2C,#CC,#CC,#C2,#23,#3C,#43,#32,#2C,#CC,#CC,#C2,#23,#3C
    DB #43,#32,#2C,#CC,#CC,#C2,#23,#3C,#43,#32,#22,#22,#22,#22,#23,#3C
    DB #43,#32,#22,#22,#22,#22,#23,#3C,#43,#33,#33,#33,#33,#33,#33,#3C
    DB #43,#33,#33,#33,#33,#33,#33,#3C,#4C,#CC,#CC,#CC,#CC,#CC,#CC,#CC

; Puck Maze 01 tile 2, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_2:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#15,#11,#11,#11,#11
    DB #11,#11,#11,#5F,#51,#11,#11,#11,#11,#11,#15,#FF,#F5,#11,#11,#11
    DB #11,#11,#11,#5F,#51,#11,#11,#11,#11,#11,#11,#15,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Maze 01 tile 3, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_3:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#1F,#11,#11,#11,#11,#11,#11,#FF,#FF,#FF,#F1,#11,#11
    DB #11,#1F,#FF,#F5,#FF,#FF,#11,#11,#11,#1F,#F5,#55,#55,#FF,#11,#11
    DB #11,#1F,#F5,#55,#55,#FF,#11,#11,#11,#FF,#55,#55,#55,#5F,#F1,#11
    DB #11,#1F,#F5,#55,#55,#FF,#11,#11,#11,#1F,#F5,#55,#55,#FF,#11,#11
    DB #11,#1F,#FF,#F5,#FF,#FF,#11,#11,#11,#11,#FF,#FF,#FF,#F1,#11,#11
    DB #11,#11,#11,#1F,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Maze 01 tile 4, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_4:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #DD,#DD,#DD,#DD,#DD,#DD,#DD,#DD,#88,#88,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#88,#88,#88,#88,#DD,#DD,#DD,#DD,#DD,#DD,#DD,#DD
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Maze 01 tile 5, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_5:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#99,#99,#11,#11
    DB #11,#11,#11,#1E,#99,#99,#11,#11,#11,#11,#11,#7E,#E1,#81,#11,#11
    DB #11,#11,#77,#7E,#E8,#88,#81,#11,#11,#17,#77,#7E,#E8,#88,#88,#11
    DB #11,#17,#77,#78,#88,#88,#88,#11,#11,#77,#77,#88,#88,#88,#88,#81
    DB #11,#17,#77,#78,#88,#88,#88,#11,#11,#17,#77,#78,#88,#88,#88,#11
    DB #11,#11,#77,#77,#88,#88,#81,#11,#11,#11,#11,#71,#11,#81,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Maze 01 tile 6, 16x16 packed SCREEN 5
PUCK_MAZE_01_TILE_6:
    DB #EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#99,#AA,#AA,#AA,#99,#99,#EE,#EE,#99,#AA,#AA,#A9,#99,#99,#EE
    DB #EE,#99,#AA,#AA,#99,#99,#99,#EE,#EE,#99,#9A,#A9,#99,#99,#99,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE

; Puck Bonus Vault tile 0, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Puck Bonus Vault tile 1, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_1:
    DB #44,#44,#44,#44,#44,#44,#44,#44,#43,#33,#33,#33,#33,#33,#33,#3C
    DB #43,#33,#33,#33,#33,#33,#33,#3C,#43,#32,#22,#22,#22,#22,#23,#3C
    DB #43,#32,#22,#22,#22,#22,#23,#3C,#43,#32,#2C,#CC,#CC,#C2,#23,#3C
    DB #43,#32,#2C,#CC,#CC,#C2,#23,#3C,#43,#32,#2C,#CC,#CC,#C2,#23,#3C
    DB #43,#32,#2C,#CC,#CC,#C2,#23,#3C,#43,#32,#2C,#CC,#CC,#C2,#23,#3C
    DB #43,#32,#2C,#CC,#CC,#C2,#23,#3C,#43,#32,#22,#22,#22,#22,#23,#3C
    DB #43,#32,#22,#22,#22,#22,#23,#3C,#43,#33,#33,#33,#33,#33,#33,#3C
    DB #43,#33,#33,#33,#33,#33,#33,#3C,#4C,#CC,#CC,#CC,#CC,#CC,#CC,#CC

; Puck Bonus Vault tile 2, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_2:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#15,#11,#11,#11,#11
    DB #11,#11,#11,#5F,#51,#11,#11,#11,#11,#11,#15,#FF,#F5,#11,#11,#11
    DB #11,#11,#11,#5F,#51,#11,#11,#11,#11,#11,#11,#15,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Bonus Vault tile 3, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_3:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#1F,#11,#11,#11,#11,#11,#11,#FF,#FF,#FF,#F1,#11,#11
    DB #11,#1F,#FF,#F5,#FF,#FF,#11,#11,#11,#1F,#F5,#55,#55,#FF,#11,#11
    DB #11,#1F,#F5,#55,#55,#FF,#11,#11,#11,#FF,#55,#55,#55,#5F,#F1,#11
    DB #11,#1F,#F5,#55,#55,#FF,#11,#11,#11,#1F,#F5,#55,#55,#FF,#11,#11
    DB #11,#1F,#FF,#F5,#FF,#FF,#11,#11,#11,#11,#FF,#FF,#FF,#F1,#11,#11
    DB #11,#11,#11,#1F,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Bonus Vault tile 4, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_4:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #DD,#DD,#DD,#DD,#DD,#DD,#DD,#DD,#88,#88,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#88,#88,#88,#88,#DD,#DD,#DD,#DD,#DD,#DD,#DD,#DD
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Bonus Vault tile 5, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_5:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#99,#99,#11,#11
    DB #11,#11,#11,#1E,#99,#99,#11,#11,#11,#11,#11,#7E,#E1,#81,#11,#11
    DB #11,#11,#77,#7E,#E8,#88,#81,#11,#11,#17,#77,#7E,#E8,#88,#88,#11
    DB #11,#17,#77,#78,#88,#88,#88,#11,#11,#77,#77,#88,#88,#88,#88,#81
    DB #11,#17,#77,#78,#88,#88,#88,#11,#11,#17,#77,#78,#88,#88,#88,#11
    DB #11,#11,#77,#77,#88,#88,#81,#11,#11,#11,#11,#71,#11,#81,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11

; Puck Bonus Vault tile 6, 16x16 packed SCREEN 5
PUCK_BONUS_VAULT_TILE_6:
    DB #EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#99,#AA,#AA,#AA,#99,#99,#EE,#EE,#99,#AA,#AA,#A9,#99,#99,#EE
    DB #EE,#99,#AA,#AA,#99,#99,#99,#EE,#EE,#99,#9A,#A9,#99,#99,#99,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#99,#99,#99,#99,#99,#99,#EE,#EE,#99,#99,#99,#99,#99,#99,#EE
    DB #EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#EE

    ds #C000 - $, #FF
    end
