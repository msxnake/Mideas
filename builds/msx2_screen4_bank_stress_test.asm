; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: msx2_screen4_bank_stress_test
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
    call load_MSX2_SCREEN_4_BANK_STRESS_TEST_screen4

    call ENASCR
    ei

    ld a, 0
    ld (msx2_current_screen_index), a
    call load_MSX2_SCREEN_4_BANK_STRESS_TEST_screen4

.main_loop:


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


upload_hardware_sprite_attrs:
write_hardware_sprite_attrs:
update_hardware_sprite_input:
update_msx2_air_timer:
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
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_EFFECTS
    ld de, #C030
    ld bc, msx2_layer_size
    ldir
    ret

load_MSX2_SCREEN_4_BANK_STRESS_TEST_screen4:
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
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 40
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_0_COLORS
    ld de, #2000
    ld bc, 40
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 16
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_1_COLORS
    ld de, #2800
    ld bc, 16
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 40
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_2_COLORS
    ld de, #3000
    ld bc, 40
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, MSX2_SCREEN_4_BANK_STRESS_TEST_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C030
    ld (msx2_current_effects_ptr), hl
    call apply_MSX2_SCREEN_4_BANK_STRESS_TEST_collected_visuals
    ret

apply_MSX2_SCREEN_4_BANK_STRESS_TEST_collected_visuals:
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
    DB #60

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #90

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #00

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #FF

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


; MSX2 SCREEN 4 Bank Stress Test collision layer, 16x14 bytes
MSX2_SCREEN_4_BANK_STRESS_TEST_COLLISION:
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

; MSX2 SCREEN 4 Bank Stress Test effects layer, 16x14 bytes
MSX2_SCREEN_4_BANK_STRESS_TEST_EFFECTS:
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

; MSX2 SCREEN 4 Bank Stress Test behavior layer, 16x14 bytes
MSX2_SCREEN_4_BANK_STRESS_TEST_BEHAVIOR:
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

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 name table, 32x24 chars
MSX2_SCREEN_4_BANK_STRESS_TEST_NAMES:
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00,#01,#01,#00,#00
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00,#01,#02,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00
    DB #03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00,#03,#04,#00,#00

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 bank 0 compact patterns
MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_0_PATTERNS:
    DB #F0,#F0,#F0,#F0,#0F,#0F,#0F,#0F,#00,#00,#C0,#C0,#C0,#C0,#03,#03
    DB #00,#00,#03,#03,#03,#03,#C0,#C0,#03,#03,#C0,#C0,#C0,#C0,#00,#00
    DB #C0,#C0,#03,#03,#03,#03,#00,#00

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 bank 0 compact colors
MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_0_COLORS:
    DB #54,#54,#54,#54,#54,#54,#54,#54,#FF,#FF,#F8,#F8,#F8,#F8,#18,#18
    DB #FF,#FF,#F8,#F8,#F8,#F8,#18,#18,#18,#18,#F8,#F8,#F8,#F8,#FF,#FF
    DB #18,#18,#F8,#F8,#F8,#F8,#FF,#FF

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 bank 1 compact patterns
MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_1_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#0F,#1E,#3C,#78,#F0,#E1,#C3,#87

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 bank 1 compact colors
MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_1_COLORS:
    DB #22,#22,#33,#33,#22,#22,#33,#33,#BA,#BA,#BA,#BA,#BA,#BA,#BA,#BA

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 bank 2 compact patterns
MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_2_PATTERNS:
    DB #CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#00,#00,#C0,#C0,#C0,#C0,#03,#03
    DB #00,#00,#03,#03,#03,#03,#C0,#C0,#03,#03,#C0,#C0,#C0,#C0,#00,#00
    DB #C0,#C0,#03,#03,#03,#03,#00,#00

; MSX2 SCREEN 4 Bank Stress Test SCREEN 4 bank 2 compact colors
MSX2_SCREEN_4_BANK_STRESS_TEST_BANK_2_COLORS:
    DB #75,#75,#75,#75,#75,#75,#75,#75,#FF,#FF,#FD,#FD,#FD,#FD,#1D,#1D
    DB #FF,#FF,#FD,#FD,#FD,#FD,#1D,#1D,#1D,#1D,#FD,#FD,#FD,#FD,#FF,#FF
    DB #1D,#1D,#FD,#FD,#FD,#FD,#FF,#FF

    ds #C000 - $, #FF
    end
