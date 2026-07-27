; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap room backend (V9938 Graphic 4 command engine)
; Project: fixture_boss
; Room: pan2
; Screen mode: SCREEN 5 (VDP Graphic 4, CHGMOD 5)
; Backend: msx2-screen4-bitmap-room (legacy internal id)
; ROM Mode: megarom
; Mapper Target: konami
; Auto MegaROM: No
; NOTE: Bitmap-room SCREEN 5 RLE sources are read through Konami P2/#8000 data banks.
; Visible page: VRAM #0000, 128 bytes/row, 212 lines
; Bitmap room HUD height: 20 px
; Bitmap room HUD widgets: 4
; Bitmap room game area: 256x192 at visual Y=20
; Bitmap room game band VRAM base: #0A00
; World rooms: 13; start room index: 1
; Shared tileset bytes: 22528 at VRAM #10000
; MSX2_GAMEFLOW_INTRO_SCENES: 1
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
ENASLT  EQU #0024
GTSTCK  EQU #00DC
RSLREG  EQU #0138
SNSMAT  EQU #0141
PPI_A EQU #A8
PPI_B EQU #A9
PPI_C EQU #AA
VDP_CTRL_PORT EQU #99
VDP_DATA_PORT EQU #98
VDP_CMD_PORT EQU #9B
VDP_PALETTE_PORT EQU #9A
bitmap_room_hud_seed_p0_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_hud_seed_p1_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_tileset_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_tileset_rle_chunk_1_DATA_BANK EQU 5
bitmap_room_tileset_rle_chunk_2_DATA_BANK EQU 5
bitmap_room_hud_linked_0_rle_chunk_0_DATA_BANK EQU 5
bitmap_room_hud_linked_1_rle_chunk_0_DATA_BANK EQU 5
bitmap_room_hud_linked_2_rle_chunk_0_DATA_BANK EQU 5
bitmap_room_hud_linked_3_rle_chunk_0_DATA_BANK EQU 6
bitmap_room_render_0_p0_DATA_BANK EQU 6
bitmap_room_render_0_p1_DATA_BANK EQU 6
bitmap_room_collision_0_DATA_BANK EQU 6
bitmap_room_behavior_0_DATA_BANK EQU 6
bitmap_room_render_1_p0_DATA_BANK EQU 6
bitmap_room_render_1_p1_DATA_BANK EQU 6
bitmap_room_collision_1_DATA_BANK EQU 6
bitmap_room_behavior_1_DATA_BANK EQU 6
bitmap_room_render_2_p0_DATA_BANK EQU 6
bitmap_room_render_2_p1_DATA_BANK EQU 6
bitmap_room_collision_2_DATA_BANK EQU 6
bitmap_room_behavior_2_DATA_BANK EQU 6
bitmap_room_render_3_p0_DATA_BANK EQU 6
bitmap_room_render_3_p1_DATA_BANK EQU 7
bitmap_room_collision_3_DATA_BANK EQU 7
bitmap_room_behavior_3_DATA_BANK EQU 7
bitmap_room_render_4_p0_DATA_BANK EQU 7
bitmap_room_render_4_p1_DATA_BANK EQU 7
bitmap_room_collision_4_DATA_BANK EQU 7
bitmap_room_behavior_4_DATA_BANK EQU 7
bitmap_room_render_5_p0_DATA_BANK EQU 7
bitmap_room_render_5_p1_DATA_BANK EQU 7
bitmap_room_collision_5_DATA_BANK EQU 7
bitmap_room_behavior_5_DATA_BANK EQU 7
bitmap_room_render_6_p0_DATA_BANK EQU 7
bitmap_room_render_6_p1_DATA_BANK EQU 7
bitmap_room_collision_6_DATA_BANK EQU 7
bitmap_room_behavior_6_DATA_BANK EQU 7
bitmap_room_render_7_p0_DATA_BANK EQU 8
bitmap_room_render_7_p1_DATA_BANK EQU 8
bitmap_room_collision_7_DATA_BANK EQU 8
bitmap_room_behavior_7_DATA_BANK EQU 8
bitmap_room_render_8_p0_DATA_BANK EQU 8
bitmap_room_render_8_p1_DATA_BANK EQU 8
bitmap_room_collision_8_DATA_BANK EQU 8
bitmap_room_behavior_8_DATA_BANK EQU 8
bitmap_room_render_9_p0_DATA_BANK EQU 8
bitmap_room_render_9_p1_DATA_BANK EQU 8
bitmap_room_collision_9_DATA_BANK EQU 8
bitmap_room_behavior_9_DATA_BANK EQU 8
bitmap_room_render_10_p0_DATA_BANK EQU 9
bitmap_room_render_10_p1_DATA_BANK EQU 9
bitmap_room_collision_10_DATA_BANK EQU 9
bitmap_room_behavior_10_DATA_BANK EQU 9
bitmap_room_render_11_p0_DATA_BANK EQU 9
bitmap_room_render_11_p1_DATA_BANK EQU 9
bitmap_room_collision_11_DATA_BANK EQU 9
bitmap_room_behavior_11_DATA_BANK EQU 9
bitmap_room_render_12_p0_DATA_BANK EQU 9
bitmap_room_render_12_p1_DATA_BANK EQU 9
bitmap_room_collision_12_DATA_BANK EQU 9
bitmap_room_behavior_12_DATA_BANK EQU 9
bitmap_intro_scene0_rle_chunk_0_DATA_BANK EQU 10
bitmap_intro_scene0_rle_chunk_1_DATA_BANK EQU 11
bitmap_intro_scene0_rle_chunk_2_DATA_BANK EQU 12
bitmap_intro_scene0_rle_chunk_3_DATA_BANK EQU 12
bitmap_dlg_gfx_rle_chunk_0_DATA_BANK EQU 13
bitmap_dlg_gfx_rle_chunk_1_DATA_BANK EQU 14


; Player SAT image in RAM (kept contiguous so the 4 bytes copy straight to the
; sprite 0 SAT slot at VRAM #F600): Y, X, pattern number, early-clock byte.
player_y   EQU #C000
player_x   EQU #C001
player_pat EQU #C002
player_ec  EQU #C003
player_anim_counter EQU #C004
player_anim_frame   EQU #C005
player_vy           EQU #C006
player_flags        EQU #C007
player_facing       EQU #C008
player_jump_lock    EQU #C009
player_moving       EQU #C00A
; World engine runtime state.
current_screen_index EQU #C00B
; Frame whose player sprite colours are currently in VRAM (#F400). Drives the
; on-change per-frame OR/CC colour re-upload (bitmap_upload_player_frame_colors).
player_colors_loaded EQU #C00C
; Per-state animation runtime (separate sprite per animation state). Fixed block
; above the skill RAM chain and below the behavior map (#C200). player_anim_state
; is reset to 0 each frame in update_player_movement and asserted by skills.
player_anim_state      EQU #C1F0
player_anim_state_prev EQU #C1F1
player_anim_clip_base  EQU #C1F2
player_anim_clip_count EQU #C1F3
player_anim_clip_delay EQU #C1F4
player_anim_abs_frame  EQU #C1F5
; Active room collision map copied here by load_room (16x12 = 192 bytes).
bitmap_room_collision_map EQU #C010
; Double-buffer room-transition state. Collision map ends at #C0CF.
bitmap_displayed_page             EQU #C0D0
bitmap_composition_state          EQU #C0D1
bitmap_pending_room               EQU #C0D2
bitmap_transition_dir             EQU #C0D3
bitmap_composition_block_ptr      EQU #C0D4
bitmap_composition_blocks_left    EQU #C0D6
bitmap_pending_display_page       EQU #C0D8
bitmap_composition_block_bank     EQU #C1F6
; Horizontal impulse velocity for wall-jumper springs (SCREEN 5 bitmap). Signed
; byte: 0 = normal pad-driven movement (the default); nonzero = the player is
; being launched horizontally and the movement hook applies it with per-frame
; friction while gravity bends the trajectory. Always emitted (harmless zero in
; projects without wall-jumpers); lives in the safe gap between the composition
; block bank and blink_phase.
player_vx                         EQU #C1F7
; Game-over request flag (Game Flow integration). Set to nonzero by the deadly/enemy
; damage system when player_lives reaches 0. The gameplay loop (bitmap_enter_game_loop)
; checks it each frame: when set, it returns to the Game Flow dispatcher so the graph
; follows the WorldLink's connection (typically to an End:GameOver node). When no Game
; Flow graph exists (standalone bitmap project), lives==0 triggers a soft restart instead.
; Always emitted (harmless zero); lives in the last free safe-gap byte before blink_phase.
bitmap_game_over_flag             EQU #C1F8
; Sub-pixel gravity accumulator (low byte of the 8.8 gravityStrength from the Player
; Config). Added to player_vy_frac every frame; player_vy only rises by 1 when this
; carries, so the fall/jump arc accelerates gradually like SCREEN 4 (default 0.25
; px/frame^2) instead of the old fixed 1 px/frame^2 nudge.
player_vy_frac                    EQU #C0D9





; --- SHOOT skill runtime state (14 bytes) ---
bitmap_bullet_pool     EQU #C0DA
bitmap_shoot_cooldown  EQU #C0E6
bitmap_shoot_lock      EQU #C0E7









; Active room behavior map copied here by load_room (16x12 = 192 bytes).
; Used by surface skills such as ice_slide. Kept away from the compact player
; state/skill chain so future optional skills do not overlap it.
bitmap_room_behavior_map EQU #C200
; Deadly-tile damage + blink i-frames system (SCREEN 5 bitmap). Fixed bytes in
; the safe gap between player_anim_state (#C1F0-#C1F5) and bitmap_room_behavior_map (#C200).
blink_phase   EQU #C1F9
blink_ended   EQU #C1FA
blink_hide    EQU #C1FB
player_health EQU #C1FD
player_lives  EQU #C1FE
player_invuln EQU #C1FF
blink_timer   EQU player_invuln   ; alias: i-frame countdown == blink countdown. in_blink = (blink_timer != 0)
; Linked MSX2 HUD asset dynamic widgets: shared 15-byte V9938 command scratch + shared decimal conversion buffer(s).
hud_cmd_block EQU #C2C0
hud_dec3_buffer EQU #C0ED
; Linked HUD icon row #0 (hud_el_1783004114045_6h49y), bound to "playerEnergy".
hud_linked_0_drawn EQU #C0E8
; Linked HUD counter #1 (hud_el_1783009772122_go9ku), bound to "collectibles" [8-bit, 2 digits].
hud_linked_1_drawn EQU #C0E9
hud_linked_1_value EQU #C0EA
; Linked HUD icon toggle #2 (hud_el_1783454311897_7p2ha), bound to "keyItem".
hud_linked_2_drawn EQU #C0EB
; Linked HUD counter #3 (hud_el_1783527996153_k7cbd), bound to "keyItem" [8-bit, 2 digits].
hud_linked_3_drawn EQU #C0EC
; Key/items + locked doors system (SCREEN 5 bitmap). RAM follows skills/HUD chain.
bitmap_key_inventory       EQU #C0F0
bitmap_key_pending_entry_x EQU #C0F1
bitmap_key_pending_entry_y EQU #C0F2
bitmap_key_work_mask       EQU #C0F3
bitmap_key_work_offset     EQU #C0F4
bitmap_key_target_page     EQU #C0F5
bitmap_key_probe_x         EQU #C0F6
bitmap_key_probe_y         EQU #C0F7
bitmap_key_count           EQU #C0F8
bitmap_key_pickup_flags    EQU #C0F9
bitmap_key_door_open_flags EQU #C0FB
bitmap_key_cmd_block       EQU #C2C0
; collector_gems skill (SCREEN 5 bitmap): 11 gem(s). RAM follows key-door/dialogue chain.
bitmap_gem_work_offset EQU #C0FE
bitmap_gem_target_page EQU #C0FF
bitmap_gem_flags       EQU #C100
bitmap_gem_cmd_block   EQU #C2C0
; Jumper springs (SCREEN 5 bitmap): 1 spring(s). RAM follows key-door/gem chain.
bitmap_jumper_timer       EQU #C10B
bitmap_jumper_target_page EQU #C10C
bitmap_jumper_active      EQU #C10D
bitmap_jumper_space_pressed EQU #C10F
bitmap_jumper_cmd_block   EQU #C2C0
; Wall-jumper springs (SCREEN 5 bitmap): 1 wall-spring(s). RAM follows the jumper-spring chain.
bitmap_walljumper_timer       EQU #C110
bitmap_walljumper_target_page EQU #C111
bitmap_walljumper_active      EQU #C112
bitmap_walljumper_cmd_block   EQU #C2C0
; SCREEN 5 bitmap NPC dialogue system. Config mirror (20B, LDIR'd on open) + state.
bitmap_dlg_cfg             EQU #C114
bitmap_dlg_cfg_box_x       EQU #C114
bitmap_dlg_cfg_box_y       EQU #C115
bitmap_dlg_cfg_box_w       EQU #C116
bitmap_dlg_cfg_box_h       EQU #C117
bitmap_dlg_cfg_border_clr  EQU #C118
bitmap_dlg_cfg_bg_clr      EQU #C119
bitmap_dlg_cfg_delay       EQU #C11A
bitmap_dlg_cfg_mouth_int   EQU #C11B
bitmap_dlg_cfg_text_x      EQU #C11C
bitmap_dlg_cfg_text_y      EQU #C11D
bitmap_dlg_cfg_text_w      EQU #C11E
bitmap_dlg_cfg_text_h      EQU #C11F
bitmap_dlg_cfg_strip_sy    EQU #C120
bitmap_dlg_cfg_por_x       EQU #C122
bitmap_dlg_cfg_por_y       EQU #C123
bitmap_dlg_cfg_por_max_w   EQU #C124
bitmap_dlg_cfg_por_max_h   EQU #C125
bitmap_dlg_cfg_line_base   EQU #C126
bitmap_dlg_cfg_line_count  EQU #C127
bitmap_dlg_state           EQU #C128
bitmap_dlg_lock            EQU #C129
bitmap_dlg_line            EQU #C12A
bitmap_dlg_lines_left      EQU #C12B
bitmap_dlg_text_ptr        EQU #C12C
bitmap_dlg_delay           EQU #C12E
bitmap_dlg_mouth_count     EQU #C12F
bitmap_dlg_mouth_state     EQU #C130
bitmap_dlg_portrait        EQU #C131
bitmap_dlg_cursor_x        EQU #C132
bitmap_dlg_cursor_y        EQU #C133
bitmap_dlg_key_mask        EQU #C134
bitmap_dlg_wait_flags      EQU #C135
bitmap_dlg_scratch_idx     EQU #C136
bitmap_dlg_sfx_seed        EQU #C137
bitmap_dlg_cmd_block       EQU #C2C0
; --- ENEMY runtime state (49 bytes): count + 2 slot(s) x 23 + update lane
; (x,y,dx,dy,minX,maxX,minY,maxY,animTick,animFrame,frameCount,animDelay,colorOff,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane) ---
bitmap_enemy_count EQU #C138
bitmap_enemy_pool  EQU #C139
bitmap_enemy_update_lane EQU #C167
; --- MOVING PLATFORM runtime state (13 bytes): count + rider + 1 slot(s) x 11
; (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,movedX,movedY) ---
bitmap_platform_count EQU #C169
bitmap_platform_rider EQU #C16A
bitmap_platform_pool  EQU #C16B

; ---- bitmap BOSS runtime state (66 bytes) ----
boss_active     EQU #C176   ; 0 none, 1 alive
boss_x          EQU #C177
boss_y          EQU #C178
boss_old_x      EQU #C179
boss_old_y      EQU #C17A
boss_dx         EQU #C17B
boss_dy         EQU #C17C
boss_hp         EQU #C17D
boss_anim_tick  EQU #C17E
boss_anim_frame EQU #C17F
boss_int_tick   EQU #C180
boss_sx         EQU #C181  ; word: current frame atlas SX
boss_cmd_buf    EQU #C183  ; 15-byte V9938 command block
boss_defeated   EQU #C192  ; 13 bytes, 1 = killed (persistent)
boss_flags      EQU #C19F  ; 1 bytes, onDefeated setFlag targets (persistent)
boss_barrier_draw EQU #C1A0  ; 1 = drawing/sealing, 0 = clearing/unsealing
boss_barrier_sx EQU #C1A1  ; word: chain tile atlas SX
boss_barrier_sy EQU #C1A3  ; word: chain tile atlas SY (512-based)
boss_proj_active EQU #C1A5  ; 1 = a bitmap projectile is in flight
boss_proj_x     EQU #C1A6
boss_proj_y     EQU #C1A7
boss_proj_ox    EQU #C1A8  ; previous position (page-1 restore)
boss_proj_oy    EQU #C1A9
boss_proj_dx    EQU #C1AA  ; signed px/frame
boss_proj_dy    EQU #C1AB
boss_proj_cd    EQU #C1AC  ; frames until next shot
boss_phase_speed EQU #C1AD  ; projectile speed of the active attack phase
boss_sbul_pool  EQU #C1AE  ; 2 x 5 bytes: active, x, y, dx, dy

; Mideas channel-C convention: gameplay SFX own PSG channel C. Every
; fire-and-forget SFX stores its R7 bits for C here (bit2 tone, bit5 noise);
; the music mixer merges them so its per-frame R7 heal never cuts a blip.
psg_sfx_r7_c_bits EQU #C3FE
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
    call map_page2_to_cart_primary
    call init_konami8k_fixed_bank0_banks
    call init_screen5_bitmap_vdp
    call run_bitmap_intro
    call load_screen5_bitmap_palette
    call init_bitmap_hud_band
    call upload_tileset_atlas
    call init_hardware_sprite_tables
    call upload_bitmap_dialogue_gfx
    ; Upload bullet sprite pattern (32 bytes) to VRAM #FC00
    ld hl, bitmap_bullet_pattern_data
    ld de, #FC00
    ld bc, bitmap_bullet_pattern_data_end - bitmap_bullet_pattern_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 4 (VRAM #F470)
    ld hl, bitmap_bullet_color_data
    ld de, #F470
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 5 (VRAM #F480)
    ld hl, bitmap_bullet_color_data
    ld de, #F480
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 6 (VRAM #F490)
    ld hl, bitmap_bullet_color_data
    ld de, #F490
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
    ld a, #24                 ; SFX channel-C mixer shadow: start muted
    ld (psg_sfx_r7_c_bits), a
    ; Game Flow graph present: the dispatcher (bitmap_gf_entry) runs the shared
    ; boot-init sequence (bitmapBootInitAsm) inside its WorldLink node, so the
    ; inline copy below is skipped. Both paths use the SAME init string, which
    ; resets bitmap_composition_state + the composition vars, loads enemies/
    ; platforms, restores R#15=S#0 and clears the skill state. (Skipping the init
    ; here previously left those uninitialised: a garbage composition state armed
    ; a bogus room transition every few frames -> periodic player reposition, and
    ; made the deadly/enemy damage systems ret-early -> spikes cost no hearts.)
    jp bitmap_gf_entry
; ---- Game Flow dispatcher (compile-time, bitmap backend) ----
bitmap_gf_entry:
    jp bitmap_gf_node_0
bitmap_gf_node_0:
    jp bitmap_gf_node_1
bitmap_gf_node_1:
    jp bitmap_gf_node_2
bitmap_gf_node_2:
    call bitmap_intro_wipe_vertical
    jp bitmap_gf_node_3
bitmap_gf_node_3:
    ; Render the start room from the shared tileset already in VRAM.
    xor a
    ld (bitmap_displayed_page), a
    ld a, 1
    call load_room
    ; Re-seed the top HUD band on BOTH pages. A Game Flow intro Transition effect
    ; (vertical/horizontal wipe, CLS or fade) clears the WHOLE visible page 0,
    ; including the HUD band (fill starts at DY=0, NY=212), which erases the static
    ; HUD seed art (e.g. a collectibles/gem icon). Only the dynamic HUD widgets
    ; redraw themselves afterwards, so without this re-seed the static icons would
    ; be missing on page 0 and appear only on the never-wiped page 1 ("gem icon on
    ; alternate rooms"). Harmless on the plain boot path (idempotent re-upload).
    call init_bitmap_hud_band
    call bitmap_apply_key_pickup_visuals_visible    ; draw key pickup metatiles on current page
    call bitmap_apply_door_state_visible    ; draw closed/open door metatiles on current page
    call bitmap_apply_gems_visible    ; draw uncollected gems on current page
    call bitmap_apply_jumpers_visible    ; draw idle spring metatiles on current page
    call bitmap_apply_walljumpers_visible    ; draw idle wall-spring metatiles on current page

    call bitmap_load_enemies
    call bitmap_load_platforms
    call bitmap_boss_load
    ; Place the player at the room spawn point.
    ld a, 146
    ld (player_y), a
    ld a, 147
    ld (player_x), a
    xor a
    ld (player_pat), a
    ld (player_ec), a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld (bitmap_game_over_flag), a
    ld (player_flags), a
    ld (player_jump_lock), a
    ld (player_moving), a
    ld (bitmap_displayed_page), a
    ld (bitmap_composition_state), a
    ld (bitmap_pending_room), a
    ld (bitmap_transition_dir), a
    ld (bitmap_composition_blocks_left), a
    ld (bitmap_composition_blocks_left + 1), a
    ld (bitmap_pending_display_page), a
    ld hl, 0
    ld (bitmap_composition_block_ptr), hl
    inc a
    ld (player_facing), a
    ; Initialise player vitals from the Player Config (health.maxHealth / lives)
    ; and clear blink state (blink_timer/player_invuln is cleared below).
    ld a, #05
    ld (player_health), a
    ld a, #01
    ld (player_lives), a
    xor a
    ld (player_invuln), a
    ld (blink_phase), a
    ld (blink_ended), a
    ld (blink_hide), a
    call upload_hud_linked_0
    ld a, #FF
    ld (hud_linked_0_drawn), a
    call upload_hud_linked_1
    ld a, #FF
    ld (hud_linked_1_drawn), a
    ld a, #00
    ld (hud_linked_1_value), a
    call upload_hud_linked_2
    ld a, #FF
    ld (hud_linked_2_drawn), a
    call upload_hud_linked_3
    ld a, #FF
    ld (hud_linked_3_drawn), a
    ; Clear key inventory and per-pickup/per-door one-shot flags.
    xor a
    ld (bitmap_key_inventory), a
    ld (bitmap_key_count), a
    ld (bitmap_key_pending_entry_x), a
    ld (bitmap_key_pending_entry_y), a
    ld (bitmap_key_work_mask), a
    ld (bitmap_key_work_offset), a
    ld (bitmap_key_target_page), a
    ld (bitmap_key_probe_x), a
    ld (bitmap_key_probe_y), a
    ld (bitmap_key_pickup_flags + 0), a
    ld (bitmap_key_pickup_flags + 1), a
    ld (bitmap_key_door_open_flags + 0), a
    ld (bitmap_key_door_open_flags + 1), a
    ld (bitmap_key_door_open_flags + 2), a
    ; collector_gems: clear per-gem collected flags.
    xor a
    ld (bitmap_gem_work_offset), a
    ld (bitmap_gem_target_page), a
    ld (bitmap_gem_flags + 0), a
    ld (bitmap_gem_flags + 1), a
    ld (bitmap_gem_flags + 2), a
    ld (bitmap_gem_flags + 3), a
    ld (bitmap_gem_flags + 4), a
    ld (bitmap_gem_flags + 5), a
    ld (bitmap_gem_flags + 6), a
    ld (bitmap_gem_flags + 7), a
    ld (bitmap_gem_flags + 8), a
    ld (bitmap_gem_flags + 9), a
    ld (bitmap_gem_flags + 10), a
    ; jumper springs: clear revert timer, active pointer + input latch.
    xor a
    ld (bitmap_jumper_timer), a
    ld (bitmap_jumper_target_page), a
    ld (bitmap_jumper_active), a
    ld (bitmap_jumper_active + 1), a
    ld (bitmap_jumper_space_pressed), a
    ; wall-jumper springs: clear revert timer + active record pointer.
    xor a
    ld (bitmap_walljumper_timer), a
    ld (bitmap_walljumper_target_page), a
    ld (bitmap_walljumper_active), a
    ld (bitmap_walljumper_active + 1), a
    ld (player_vx), a           ; clear any horizontal impulse carried from a previous room
    ; NPC dialogue system: start idle with the talk key unlatched.
    xor a
    ld (bitmap_dlg_state), a
    ld (bitmap_dlg_lock), a
    ld (bitmap_dlg_mouth_state), a
    ld (bitmap_dlg_mouth_count), a
    ld a, #5A
    ld (bitmap_dlg_sfx_seed), a
    ; Boss persistent state (defeated flags + defeat action flags).
    xor a
    ld (boss_defeated + 0), a
    ld (boss_defeated + 1), a
    ld (boss_defeated + 2), a
    ld (boss_defeated + 3), a
    ld (boss_defeated + 4), a
    ld (boss_defeated + 5), a
    ld (boss_defeated + 6), a
    ld (boss_defeated + 7), a
    ld (boss_defeated + 8), a
    ld (boss_defeated + 9), a
    ld (boss_defeated + 10), a
    ld (boss_defeated + 11), a
    ld (boss_defeated + 12), a
    ld (boss_flags + 0), a
    ; Re-select page 0 after all room/HUD uploads. This is defensive against
    ; BIOS/VDP state left by CHGMOD or command-engine setup.
    ld a, #02
    ld e, #1F
    call vdp_write_register
    call ENASCR
    ; ENASCR is another BIOS boundary that may return with IRQs enabled. Keep
    ; the bitmap runtime on its documented polling-only interrupt contract.
    di
    ; ENASCR reloads R#1 from the BIOS shadow, whose SCREEN 5 value is #60
    ; (8x8 sprites), undoing the #62 selected in init_screen5_bitmap_vdp.
    ; Restore SI after the BIOS call so 16x16 player/object patterns are whole.
    ld a, #01
    ld e, #62
    call vdp_write_register
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so interrupts stay disabled and the BIOS cannot
    ; consume S#0 before the main loop sees it.
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (player_anim_state), a
    ld (player_anim_abs_frame), a
    dec a
    ld (player_anim_state_prev), a    ; #FF forces a clean clip reset on frame 1
    ; Clear SHOOT pool (14 bytes at bitmap_bullet_pool)
    ld hl, bitmap_bullet_pool
    ld b, #0E
    xor a
.shoot_clear_loop:
    ld (hl), a
    inc hl
    djnz .shoot_clear_loop

    call bitmap_enter_game_loop
    jp bitmap_gf_node_4
bitmap_gf_node_4:
    ld hl, bitmap_gf_node_4_DATA
    call draw_bitmap_end_screen
    call bitmap_end_wait_key
    ; End node terminates the flow.
    jp .bitmap_main_loop
bitmap_gf_node_4_DATA:
    DB #03,#0F,#18,#0E
bitmap_enter_game_loop:
    ; Game Flow exit gate: when the deadly/enemy damage system arms
    ; bitmap_game_over_flag (last life spent), leave the gameplay loop. With a
    ; Game Flow graph, ret returns to the dispatcher (which follows the WorldLink
    ; connection, e.g. to an End:GameOver node). Without a graph, soft-restart.
    ld a, (bitmap_game_over_flag)
    or a
    ret nz    ; WorldLink exit -> back to Game Flow dispatcher
.bitmap_main_loop:
    call bitmap_wait_vblank
    ; ---- VRAM phase: runs inside the blanking window ----
    ; Sprite pattern/colour uploads and every SAT write go FIRST, right after
    ; the S#0 frame flag, so the raster never races them (mid-display SAT and
    ; pattern writes glitched the top third of the frame on jump/move). They
    ; consume last frame's game state: a uniform 1-frame latency at 60Hz.
    call bitmap_update_player_sprite_animation
    call bitmap_upload_player_frame_colors
    call bitmap_update_sprite_sat
    call bitmap_update_enemy_sat
    call bitmap_boss_sbul_sat    ; boss bullets over the free enemy SAT slots
    call bitmap_update_platform_sat
    call bitmap_update_bullet_sat
    ; ---- logic phase: safe during active display ----
    call step_room_composition
    jp c, .skip_player_movement
    call bitmap_update_platforms
    call bitmap_boss_update
    call bitmap_dialogue_frame      ; NPC talk: open/advance dialogue; carry = player paused
    jp c, .skip_player_movement
    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
    call bitmap_try_spawn_bullet
    call bitmap_step_bullets
    call bitmap_platform_ride_detect
.skip_player_movement:
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_linked_0    ; redraw linked HUD icon row #0 (hud_el_1783004114045_6h49y)
    call update_hud_linked_1    ; redraw linked HUD counter #1 (hud_el_1783009772122_go9ku)
    call update_hud_linked_2    ; redraw linked HUD icon #2 (hud_el_1783454311897_7p2ha)
    call update_hud_linked_3    ; redraw linked HUD counter #3 (hud_el_1783527996153_k7cbd)
    call bitmap_update_key_doors    ; key pickups + locked-door transitions
    call bitmap_update_gems    ; collector_gems: pickup scan + cell erase
    call bitmap_update_jumpers    ; jumper springs: stand-on detect + launch + tile swap
    call bitmap_update_walljumpers    ; wall-jumper springs: side-contact detect + horizontal launch + tile swap
    call bitmap_update_enemies
    call bitmap_check_enemy_touch
    jp .bitmap_main_loop

; ------------------------------------------------------------
; FUNCTION: run_bitmap_intro
; ------------------------------------------------------------
; PURPOSE:
;   Play the GameFlow intro (Screen5Presentation -> Transition chain) before the
;   game boot continues. Scenes render on the visible page 0 that the game boot
;   repaints right after (HUD seed + start room), so nothing needs restoring.
;
; INPUT:
;   None. Called once from init_rom right after init_screen5_bitmap_vdp.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; SIDE EFFECTS:
;   Hides hardware sprites during the intro (SAT is still uninitialized) and
;   restores R#8 = #08 (sprites enabled) before returning. In MegaROM mode the
;   scene uploads select P2 data banks and restore the resident banks.
; ------------------------------------------------------------
run_bitmap_intro:
    ; Hide sprites while the SAT/pattern tables still hold garbage
    ; (init_hardware_sprite_tables runs later). R#8 base value #08 matches the
    ; MSX2 BIOS default written by CHGMOD; bit 1 = SPD (sprite disable).
    ld a, #08
    ld e, #0A
    call vdp_write_register
    ; Blank the visible page before the first scene shows.
    call bitmap_intro_cls
    ; Intro scene 0: New MSX2 SCREEN 5 Presentation
    ld hl, bitmap_intro_scene0_palette
    call bitmap_intro_load_palette
    call bitmap_intro_upload_scene0
    call bitmap_intro_wait_space
    call bitmap_intro_wipe_vertical
    ld b, 30
    call bitmap_intro_wait_frames
    ; Re-enable sprites for gameplay.
    ld a, #08
    ld e, #08
    call vdp_write_register
    ret

bitmap_intro_load_palette:
    ; HL = 32-byte palette block (byte1=(R<<4)|B, byte2=G). Clobbers AF, BC, HL.
    ld b, 16
    xor a
.pal_loop:
    push af
    push bc
    push hl
    ld e, a
    ld a, 16
    call vdp_write_register
    pop hl
    ld a, (hl)
    out (#9A), a
    inc hl
    ld a, (hl)
    out (#9A), a
    inc hl
    pop bc
    pop af
    inc a
    djnz .pal_loop
    ret

bitmap_intro_fill_rect:
    ; HMMV fill with colour 0 on the visible page: HL = DX (even px), DE = DY,
    ; BC = NX (even px), A = NY (1..212). Waits for the command engine, then
    ; streams R#36..R#46 through the indirect port. Preserves HL, DE, BC.
    ; Leaves R#15 = S#2 (bitmap_intro_frame_wait restores S#0).
    push af
    call vdp_wait_cmd_ready
    push de
    ld e, #24                 ; indirect register pointer -> R#36 (DX low)
    ld a, #11
    call vdp_write_register
    pop de
    ld a, l
    out (#9B), a  ; DX low
    ld a, h
    out (#9B), a  ; DX high
    ld a, e
    out (#9B), a  ; DY low
    ld a, d
    out (#9B), a  ; DY high
    ld a, c
    out (#9B), a  ; NX low
    ld a, b
    out (#9B), a  ; NX high
    pop af
    out (#9B), a  ; NY low
    xor a
    out (#9B), a  ; NY high
    out (#9B), a  ; COL = 0 (backdrop)
    out (#9B), a  ; ARG = 0
    ld a, #C0                 ; HMMV
    out (#9B), a
    ret

bitmap_intro_cls:
    ; Clear the full visible page (256x212) with one HMMV. Clobbers AF, BC, DE, HL.
    ld hl, 0
    ld de, 0
    ld bc, #0100
    ld a, 212
    jp bitmap_intro_fill_rect

bitmap_intro_frame_wait:
    ; One 60Hz tick: restore R#15 = S#0 (fills leave S#2 selected), then poll the
    ; frame flag. Preserves DE, HL. Clobbers AF, BC.
    push de
    push hl
    ld a, #0F
    ld e, #00
    call vdp_write_register
    call bitmap_wait_vblank
    pop hl
    pop de
    ret

bitmap_intro_wait_frames:
    ; B = frame count (1..255). Clobbers AF, BC.
.wf_loop:
    push bc
    call bitmap_intro_frame_wait
    pop bc
    djnz .wf_loop
    ret

bitmap_intro_wait_space:
    ; Wait for a SPACE press on PPI keyboard row 8 (bit 0), requiring
    ; release -> press -> release so a held key cannot leak into gameplay
    ; as an instant jump. Clobbers AF, BC.
.ws_release0:
    call bitmap_intro_read_row8
    bit 0, a
    jp nz, .ws_release0
.ws_press:
    call bitmap_intro_read_row8
    bit 0, a
    jp z, .ws_press
.ws_release1:
    call bitmap_intro_read_row8
    bit 0, a
    jp nz, .ws_release1
    ret

bitmap_intro_read_row8:
    ; A = pressed-bit mask of keyboard row 8 (bit0 = SPACE). Direct PPI read,
    ; same technique as update_player_movement (no BIOS under DI). Clobbers AF.
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret

bitmap_intro_fill_col2:
    ; Fill one 2x212 column at DX = HL, then HL += 2. Clobbers AF, BC, DE.
    ld de, 0
    ld bc, 2
    ld a, 212
    call bitmap_intro_fill_rect
    inc hl
    inc hl
    ret

bitmap_intro_wipe_vertical:
    ; Wipe the visible page with 2px columns, left -> right, 2 columns/frame.
    ld hl, 0
.vw_loop:
    call bitmap_intro_fill_col2
    call bitmap_intro_fill_col2
    call bitmap_intro_frame_wait
    ld a, h
    or a
    jp z, .vw_loop
    ret

bitmap_intro_upload_scene0:
    ld a, bitmap_intro_scene0_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_intro_scene0_rle_chunk_0
    ld a, 0
    ld de, #0000
    ld bc, bitmap_intro_scene0_rle_chunk_0_end - bitmap_intro_scene0_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_intro_scene0_rle_chunk_1_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_intro_scene0_rle_chunk_1
    ld a, 0
    ld de, #2935
    ld bc, bitmap_intro_scene0_rle_chunk_1_end - bitmap_intro_scene0_rle_chunk_1
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_intro_scene0_rle_chunk_2_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_intro_scene0_rle_chunk_2
    ld a, 1
    ld de, #0000
    ld bc, bitmap_intro_scene0_rle_chunk_2_end - bitmap_intro_scene0_rle_chunk_2
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_intro_scene0_rle_chunk_3_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_intro_scene0_rle_chunk_3
    ld a, 1
    ld de, #2489
    ld bc, bitmap_intro_scene0_rle_chunk_3_end - bitmap_intro_scene0_rle_chunk_3
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret


; --- V9938 SCREEN 5 bitmap runtime (VDP Graphic 4, Vampire Killer style) ---

; ------------------------------------------------------------
; FUNCTION: init_plain32k_page2_slot
; ------------------------------------------------------------
; PURPOSE:
;   Mirror the cartridge primary slot from page 1 (#4000-#7FFF) into page 2
;   (#8000-#BFFF) so plain 32KB ROM data can be read linearly.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC
;
; PRESERVES:
;   DE, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Updates the primary slot select register at PPI port #A8 for page 2.
;
; NOTES:
;   Bitmap rooms can place RLE source data above #8000 once tile variety grows.
;   Without this setup the second ROM page may still point at RAM/BIOS, causing
;   the decoder to feed #FF bytes into VRAM after the first visible render.
; ------------------------------------------------------------
init_plain32k_page2_slot:
    in a, (PPI_A)
    ld b, a
    and #0C                  ; keep page 1 primary slot bits
    rlca
    rlca                     ; move page 1 bits into page 2 position
    ld c, a
    ld a, b
    and #CF                  ; clear page 2 primary slot bits
    or c
    out (PPI_A), a
    ret

; ------------------------------------------------------------
; FUNCTION: map_page2_to_cart_primary
; ------------------------------------------------------------
; PURPOSE:
;   Map #8000-#BFFF to the same cartridge slot currently used by #4000-#7FFF.
;
; INPUT:
;   Current ROM is executing from the cartridge slot in page 1 (#4000).
;
; OUTPUT:
;   Page 2 (#8000-#BFFF) is switched to the cartridge slot.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
;
; CALLS:
;   RSLREG, get_cart_slot_value, ENASLT.
;
; SIDE EFFECTS:
;   Changes the active slot for #8000-#BFFF.
;
; NOTES:
;   Required before Konami SCC mapper writes. Without this, ld (#9000),A writes
;   RAM instead of the cartridge mapper register on machines where page 2 still
;   points to RAM after boot. Stack use is only the BIOS CALL/RET nesting.
; ------------------------------------------------------------
map_page2_to_cart_primary:
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

; ------------------------------------------------------------
; FUNCTION: get_cart_slot_value
; ------------------------------------------------------------
; PURPOSE:
;   Convert primary slot bits into the ENASLT slot descriptor, including
;   expanded-slot secondary bits when the cartridge slot is expanded.
;
; INPUT:
;   A bits 0-1 = primary slot id for the cartridge page.
;
; OUTPUT:
;   A = ENASLT slot descriptor for the same slot.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Reads BIOS expanded slot table at #FCC1.
;
; NOTES:
;   Mirrors the SCREEN 4 MegaROM slot setup. PUSH/POP are not used.
; ------------------------------------------------------------
get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jp z, .slot_ready
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

; ------------------------------------------------------------
; FUNCTION: init_konami8k_fixed_bank0_banks
; ------------------------------------------------------------
; PURPOSE:
;   Initialize a Konami SCC 8KB MegaROM: bank 0 at #4000 and the
;   resident startup banks mapped in #6000/#8000/#A000.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3.
;
; SIDE EFFECTS:
;   Writes Konami SCC mapper registers #5000, #7000, #9000 and #B000.
;
; NOTES:
;   Stack is not used here. Unlike Konami4, the Konami SCC mapper does NOT
;   fix bank 0: the #4000 window has its own register at #5000. The reset
;   state is 0/1/2/3 on emulators, but flash carts may leave garbage, so
;   bank 0 is selected explicitly. This runs from the #4000 page itself,
;   which is only safe because the boot code is reachable in bank 0.
; ------------------------------------------------------------
init_konami8k_fixed_bank0_banks:
    xor a
    ld (#5000), a
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    jp mapper_set_bank_p3

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p1
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #6000-#7FFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami SCC mapper register #7000.
;
; NOTES:
;   No PUSH/POP. LD (nn),A does not modify flags.
; ------------------------------------------------------------
mapper_set_bank_p1:
    ld (#7000), a
    ret

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p2
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #8000-#9FFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami SCC mapper register #9000.
;
; NOTES:
;   P2 is the bitmap-room data read window for banked RLE sources.
;   Selecting a bank whose low 6 bits are #3F would expose the SCC at
;   #9800-#9FFF instead of ROM; the data-bank packer never allocates
;   those bank numbers (see packBitmapRoomDataBanks).
; ------------------------------------------------------------
mapper_set_bank_p2:
    ld (#9000), a
    ret

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p3
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #A000-#BFFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami SCC mapper register #B000.
;
; NOTES:
;   Present for symmetry with the fixed-bank0 SCREEN 4 MegaROM runtime.
; ------------------------------------------------------------
mapper_set_bank_p3:
    ld (#B000), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_room_select_data_bank_a
; ------------------------------------------------------------
; PURPOSE:
;   Map one bitmap-room data bank into the P2 #8000 read window.
;
; INPUT:
;   A = physical data bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p2.
;
; SIDE EFFECTS:
;   Changes which ROM bank is readable at #8000-#9FFF.
;
; NOTES:
;   Call this before loading HL with a banked data label. Stack is not used.
; ------------------------------------------------------------
bitmap_room_select_data_bank_a:
    jp mapper_set_bank_p2

; ------------------------------------------------------------
; FUNCTION: bitmap_room_restore_resident_banks
; ------------------------------------------------------------
; PURPOSE:
;   Restore the resident physical banks after banked resource uploads.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p2, mapper_set_bank_p3.
;
; SIDE EFFECTS:
;   Restores P2=#8000 to physical bank 2 and P3=#A000 to physical bank 3.
;
; NOTES:
;   Keeps gameplay reads from resident tables deterministic after loading
;   large SCREEN 5 bitmap RLE resources. Stack is not used.
; ------------------------------------------------------------
bitmap_room_restore_resident_banks:
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    jp mapper_set_bank_p3

vdp_write_register:
    ; A=register, E=value. Preserves BC, clobbers AF.
    push bc
    ld b, a
    ld a, e
    out (#99), a
    ld a, b
    or #80
    out (#99), a
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: copy_to_vram_ext
; ------------------------------------------------------------
; PURPOSE:
;   Copy one contiguous CPU memory block to an absolute V9938 VRAM address.
;
; INPUT:
;   HL = ROM/RAM source pointer.
;   DE = absolute VRAM destination address.
;   BC = byte count. Must not be zero.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes VRAM through VDP ports #99/#98 and leaves R#14 reset to zero.
;
; NOTES:
;   The V9938 data-port auto-increment is only trusted inside the current
;   16KB VRAM bank. Callers that copy more than one bank must split the copy.
; ------------------------------------------------------------
copy_to_vram_ext:
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (#99), a
    ld a, d
    and #3F
    or #40
    out (#99), a
.copy_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    dec bc
    ld a, b
    or c
    jp nz, .copy_loop
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret

; ------------------------------------------------------------
; FUNCTION: decompress_bitmap_rle_to_vram
; ------------------------------------------------------------
; PURPOSE:
;   Expand count/value RLE bytes from ROM to one absolute V9938 VRAM bank.
;
; INPUT:
;   HL = RLE source pointer. Format is repeated count,value pairs.
;   A  = 16KB VRAM bank number (VRAM address >> 14).
;   DE = VRAM destination address inside that bank (address & #3FFF).
;   BC = encoded byte count. Must be even and non-zero.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes expanded bytes to VRAM through VDP ports #99/#98.
;
; NOTES:
;   Each call must target data that stays inside one 16KB VRAM bank. The
;   generator splits data on bank boundaries. Passing A separately allows
;   uploading the page-2 atlas at VRAM #10000, which cannot fit in a Z80
;   16-bit DE register.
; ------------------------------------------------------------
decompress_bitmap_rle_to_vram:
    push de
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (#99), a
    ld a, d
    and #3F
    or #40
    out (#99), a
.rle_loop:
    ld a, b
    or c
    jp z, .rle_done
    ld a, (hl)
    inc hl
    dec bc
    ld d, a
    ld a, (hl)
    inc hl
    dec bc
.emit_loop:
    out (#98), a
    dec d
    jp nz, .emit_loop
    jp .rle_loop
.rle_done:
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret

vdp_reinit_cmd_pointer:
    ; Point indirect writes at R#32 with auto-increment. Clobbers AF.
    ld a, #20
    ld e, a
    ld a, #11
    jp vdp_write_register

read_vdp_status_2:
    ; Returns S#2 in A. Clobbers AF.
    ld a, #02
    out (#99), a
    ld a, #8F
    out (#99), a
    in a, (#99)
    ret

vdp_wait_cmd_ready:
    ; Wait while CE (bit 0) is set. Clobbers AF.
.wait_loop:
    call read_vdp_status_2
    bit 0, a
    jp nz, .wait_loop
    ret

init_screen5_bitmap_vdp:
    ; This backend composes 4bpp bitmap pages with V9938 commands (128 bytes per
    ; 256px row), so the actual VDP mode must be SCREEN 5/Graphic 4. The
    ; persisted backend route still uses its legacy bitmap-room id.
    ; CHGMOD may leave the display disabled while changing mode. Keep the mode
    ; switch blanked, then explicitly re-enable the display after boot uploads.
    call DISSCR
    ld a, #05
    call CHGMOD
    ; CHGMOD is a BIOS routine and may return with IRQs enabled. This runtime
    ; polls VBlank directly and command helpers temporarily select VDP S#2;
    ; allowing the BIOS ISR here causes an interrupt storm before the intro RLE
    ; upload can finish. Reassert the init_rom DI contract immediately.
    di
    ; Enable 16x16 hardware sprites (R#1 bit1 = SI). CHGMOD 5 leaves R#1=#60 (8x8),
    ; which would render only the top-left 8x8 quadrant of the 16x16 player pattern.
    ld a, #01
    ld e, #62
    call vdp_write_register
    ; Start on SCREEN 5 page 0. Transitions compose on the hidden page and flip
    ; this register in commit_room_flip.
    ld a, #02
    ld e, #1F
    call vdp_write_register
    ; Sprite mode 2 tables at F400/F600/F800 (physical layout used by VK).
    ld a, #05
    ld e, #EF
    call vdp_write_register
    ld a, #06
    ld e, #1F
    call vdp_write_register
    ld a, #0B
    ld e, #01
    call vdp_write_register
    ; 212-line display (R#9 LN=1) so the 20px HUD + 192px game band fill the screen
    ; with no leftover scanlines at the bottom.
    ld a, #09
    ld e, #80
    call vdp_write_register
    ; Point indirect writes at command register R#32.
    ld a, #11
    ld e, #20
    call vdp_write_register
    ; Backdrop color (R#7) = background color. In SCREEN 5 this paints the outer "franjas"
    ; AND every color-0 (transparent) bitmap pixel, so background/transparency/border match.
    ld a, #07
    ld e, #00
    call vdp_write_register
    ret

load_screen5_bitmap_palette:
    ld hl, screen5_bitmap_palette_data
    ld b, 16
    xor a
.palette_loop:
    push af
    push bc
    push hl
    ld e, a
    ld a, 16
    call vdp_write_register
    pop hl
    ld a, (hl)
    out (#9A), a
    inc hl
    ld a, (hl)
    out (#9A), a
    inc hl
    pop bc
    pop af
    inc a
    djnz .palette_loop
    ret

; ------------------------------------------------------------
; FUNCTION: init_bitmap_hud_band
; ------------------------------------------------------------
; PURPOSE:
;   Initialize the persistent top HUD band on both double-buffer pages after
;   entering SCREEN 5.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   decompress_bitmap_rle_to_vram
;
; SIDE EFFECTS:
;   Writes the top 20 scanlines at VRAM #00000 and #08000.
;
; NOTES:
;   The HUD band is uploaded once to page 0 and page 1. Room composition only
;   repaints the game band below it, so page flips do not expose an empty HUD.
; ------------------------------------------------------------
init_bitmap_hud_band:
    ld a, bitmap_room_hud_seed_p0_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_hud_seed_p0_rle_chunk_0
    ld a, 0
    ld de, #0000
    ld bc, bitmap_room_hud_seed_p0_rle_chunk_0_end - bitmap_room_hud_seed_p0_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_room_hud_seed_p1_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_hud_seed_p1_rle_chunk_0
    ld a, 2
    ld de, #0000
    ld bc, bitmap_room_hud_seed_p1_rle_chunk_0_end - bitmap_room_hud_seed_p1_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret

; ------------------------------------------------------------
; FUNCTION: upload_tileset_atlas
; ------------------------------------------------------------
; PURPOSE:
;   Upload the shared world tileset (atlas, packed 4bpp RLE) once to page 2
;   offscreen VRAM. load_room/step_room_composition build each room by copying
;   16x16 tiles from here.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   decompress_bitmap_rle_to_vram
;
; SIDE EFFECTS:
;   Writes the offscreen tileset VRAM starting at #10000.
;
; NOTES:
;   Reads compact RLE data from the resident ROM window (or P2 data banks), then
;   re-arms R#14 per 16KB VRAM bank so rows beyond physical VRAM #3FFF are
;   written correctly. Uploaded once at boot; rooms reference it by VRAM source.
; ------------------------------------------------------------
upload_tileset_atlas:
    ld a, bitmap_room_tileset_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_tileset_rle_chunk_0
    ld a, 4
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_0_end - bitmap_room_tileset_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_room_tileset_rle_chunk_1_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_tileset_rle_chunk_1
    ld a, 4
    ld de, #1C05
    ld bc, bitmap_room_tileset_rle_chunk_1_end - bitmap_room_tileset_rle_chunk_1
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_room_tileset_rle_chunk_2_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_tileset_rle_chunk_2
    ld a, 5
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_2_end - bitmap_room_tileset_rle_chunk_2
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret

; ------------------------------------------------------------
; FUNCTION: replay_room_commands
; ------------------------------------------------------------
; PURPOSE:
;   Feed a room render program (a list of 15-byte V9938 command
;   blocks) to the VDP command engine, waiting for each command to finish.
;
; INPUT:
;   HL = pointer to the command blocks. BC = number of blocks.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL  (vdp_reinit_cmd_pointer overwrites E)
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer.
;
; SIDE EFFECTS:
;   Issues LMMV/LMMM/LINE commands that paint the visible game band.
;
; NOTES:
;   Each block is SX,SY,DX,DY,NX,NY (16-bit LE), CLR, ARG, CMR. Indirect register
;   writes auto-increment from R#32, so the pointer is re-armed per block.
; ------------------------------------------------------------
replay_room_commands:
    ld a, b
    or c
    ret z
.next_block:
    push bc
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld b, 15
.write_block:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .write_block
    pop bc
    dec bc
    ld a, b
    or c
    jp nz, .next_block
    ret

; ------------------------------------------------------------
; FUNCTION: load_room
; ------------------------------------------------------------
; PURPOSE:
;   Render one room's visible game band from the shared tileset and reload its
;   collision map into RAM.
;
; INPUT:
;   A = room/screen index (0-based).
;
; OUTPUT:
;   current_screen_index updated; collision/behavior RAM refreshed.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   replay_room_commands.
;
; SIDE EFFECTS:
;   Repaints the game band via the VDP command engine; LDIR over room RAM maps.
;
; NOTES:
;   Pointer tables are word-indexed (DW), the block-count table is byte-indexed.
;   replay_room_commands clobbers DE (vdp_reinit_cmd_pointer writes E), so the
;   collision/behavior lookup re-derives the index from current_screen_index in RAM.
;   Boot always renders to display page 0. Room transitions use
;   start_room_transition + step_room_composition instead of this synchronous path.
; ------------------------------------------------------------
load_room:
    ld (current_screen_index), a
    ld e, a
    ld d, 0
    ld hl, bitmap_room_render_ptr_table_p0
    ld bc, bitmap_room_render_bank_table_p0

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room render blocks
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl

    push hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld c, (hl)
    inc hl
    ld b, (hl)              ; BC = block count
    pop hl
    call replay_room_commands
    ; DE was clobbered by the command engine; re-derive the room index.
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_ptr_table
    ld bc, bitmap_room_collision_bank_table

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room collision source
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl

    ld de, bitmap_room_collision_map
    ld bc, 192
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table
    ld bc, bitmap_room_behavior_bank_table

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room behavior source
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl

    ld de, bitmap_room_behavior_map
    ld bc, 192
    ldir
    ; The command-engine status polls above left R#15 pointing at S#2. Restore S#0
    ; selection so the main loop's bitmap_wait_vblank (which assumes R#15=0) syncs
    ; correctly; otherwise post-transition rooms run on the bounded-delay fallback
    ; every frame (severe lag).
    call bitmap_room_restore_resident_banks
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: start_room_transition
; ------------------------------------------------------------
; PURPOSE:
;   Queue a transition to the neighbour room across one screen edge. The target
;   room is composed later, a few VDP command blocks per frame, on the hidden page.
;
; INPUT:
;   A = direction (0=west, 1=east, 2=north, 3=south).
;
; OUTPUT:
;   On a valid neighbour: transition state is initialized and carry is SET.
;   With no neighbour for that edge: carry is CLEAR and nothing changes.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes bitmap_composition_state, bitmap_pending_room, bitmap_transition_dir,
;   bitmap_pending_display_page, bitmap_composition_block_ptr and
;   bitmap_composition_blocks_left in RAM.
;
; NOTES:
;   Table layout is 4 bytes per room (west, east, north, south); #FF = no rail.
;   If a composition is already active, carry is SET and the request is ignored
;   so input cannot restart the transition mid-composition.
; ------------------------------------------------------------
start_room_transition:
    ld c, a                 ; C = direction
    ld a, (bitmap_composition_state)
    or a
    jp nz, .already_composing
    ld a, (current_screen_index)
    add a, a
    add a, a                ; A = index * 4
    add a, c
    ld e, a
    ld d, 0
    ld hl, bitmap_room_transition_table
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .no_rail
    ld (bitmap_pending_room), a
    ld a, c
    ld (bitmap_transition_dir), a
    ld a, (bitmap_displayed_page)
    or a
    jp z, .compose_page1
    xor a
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p0
    ld bc, bitmap_room_render_bank_table_p0
    jp .select_render_program
.compose_page1:
    ld a, 1
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p1
    ld bc, bitmap_room_render_bank_table_p1
.select_render_program:
    ld a, (bitmap_pending_room)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_block_bank), a
    call bitmap_room_select_data_bank_a
    pop hl
    ld (bitmap_composition_block_ptr), hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_blocks_left), a
    inc hl
    ld a, (hl)
    ld (bitmap_composition_blocks_left + 1), a
    ld a, 1
    ld (bitmap_composition_state), a
    call bitmap_room_restore_resident_banks

.already_composing:
    scf
    ret
.no_rail:
    or a                    ; clear carry: caller keeps the player on this screen
    ret

; ------------------------------------------------------------
; FUNCTION: step_room_composition
; ------------------------------------------------------------
; PURPOSE:
;   Continue composing a pending room on the hidden SCREEN 5 page. The visible
;   page is flipped only after all command blocks have completed.
;
; INPUT:
;   bitmap_composition_state = 1 when a transition is active.
;   bitmap_composition_block_ptr = next VDP command block to replay.
;   bitmap_composition_blocks_left = remaining command blocks (16-bit).
;
; OUTPUT:
;   Carry SET when a transition is active this frame; carry CLEAR when idle.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, commit_room_flip.
;
; SIDE EFFECTS:
;   Issues up to 24 V9938 command blocks per call. Each block waits for the
;   previous command before submitting another block, avoiding a long synchronous
;   wait over the whole room. Restores R#15=0 before returning to the main loop.
;
; NOTES:
;   The routine keeps the old page visible while commands run. Stack balance:
;   one PUSH BC per command block, matched by one POP BC before the block count
;   is decremented.
; ------------------------------------------------------------
step_room_composition:
    ld a, (bitmap_composition_state)
    or a
    jp z, .composition_idle
    ld hl, (bitmap_composition_blocks_left)
    ld a, h
    or l
    jp z, commit_room_flip
    ld a, 24
    ld c, a                 ; C = blocks to process this frame
    ld a, h
    or a
    jp nz, .budget_ready
    ld a, l
    cp 24
    jp nc, .budget_ready
    ld c, a                 ; Final frame: process only remaining blocks.
.budget_ready:
    ld a, (bitmap_composition_block_bank)
    call bitmap_room_select_data_bank_a
    ld hl, (bitmap_composition_block_ptr)
.process_block:
    push bc
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld b, 15
.write_step_block:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .write_step_block
    pop bc
    push hl
    ld hl, (bitmap_composition_blocks_left)
    dec hl
    ld (bitmap_composition_blocks_left), hl
    pop hl
    dec c
    jp nz, .process_block
    ld (bitmap_composition_block_ptr), hl
    ld hl, (bitmap_composition_blocks_left)
    ld a, h
    or l
    jp z, commit_room_flip
    call bitmap_room_restore_resident_banks
    ld a, #0F
    ld e, #00
    call vdp_write_register
    scf
    ret
.composition_idle:
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: commit_room_flip
; ------------------------------------------------------------
; PURPOSE:
;   Atomically publish a fully-composed hidden page as the visible room.
;
; INPUT:
;   bitmap_pending_room = target room index.
;   bitmap_pending_display_page = page to display (0 or 1).
;   bitmap_transition_dir = direction that triggered the transition.
;
; OUTPUT:
;   current_screen_index, bitmap_displayed_page, collision and behavior RAM updated.
;   player_x/player_y repositioned to the opposite edge; carry SET.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_write_register.
;
; SIDE EFFECTS:
;   Copies the target collision/behavior grids to RAM, flips VDP R#2, restores R#15=0,
;   and clears bitmap_composition_state. North transitions preserve vertical
;   jump velocity so the player can keep rising into the room above; other
;   transitions reset vertical velocity. HUD dirty flags are NOT invalidated:
;   dynamic HUD widgets are mirrored to both pages when their values change, so
;   transitions only rewrite the game band.
;
; NOTES:
;   R#2 values are SCREEN 5 page bases: #1F for page 0, #3F for page 1.
;   The display register is written after collision/player state is ready, so
;   the player is not shown on the new page at an old edge for one frame.
; ------------------------------------------------------------
commit_room_flip:
    call vdp_wait_cmd_ready
    ld a, (bitmap_pending_room)
    ld (current_screen_index), a
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_ptr_table
    ld bc, bitmap_room_collision_bank_table

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl

    ld de, bitmap_room_collision_map
    ld bc, 192
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table
    ld bc, bitmap_room_behavior_bank_table

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl

    ld de, bitmap_room_behavior_map
    ld bc, 192
    ldir
    call bitmap_room_restore_resident_banks

    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, (bitmap_transition_dir)
    or a
    jp z, .commit_enter_right
    cp 1
    jp z, .commit_enter_left
    cp 2
    jp z, .commit_enter_bottom
    cp 4
    jp z, .commit_enter_key_door
.commit_enter_top:
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld (bitmap_game_over_flag), a
    ld a, 2
    ld (player_y), a
    jp .commit_flip_page
.commit_enter_bottom:
    ; Keep player_vy/player_vy_frac from the jump that crossed the north edge:
    ; otherwise the player appears at the bottom of the upper room with the jump
    ; cancelled and immediately falls back through the south rail.
    ld a, 158
    ld (player_y), a
    jp .commit_flip_page
.commit_enter_right:
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld (bitmap_game_over_flag), a
    ld a, 238
    ld (player_x), a
    jp .commit_flip_page
.commit_enter_left:
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld (bitmap_game_over_flag), a
    ld a, 2
    ld (player_x), a
    jp .commit_flip_page
.commit_enter_key_door:
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld (bitmap_game_over_flag), a
    ld a, (bitmap_key_pending_entry_y)
    ld (player_y), a
    ld a, (bitmap_key_pending_entry_x)
    ld (player_x), a
.commit_flip_page:
    call bitmap_apply_key_pickup_visuals_pending_page    ; draw key pickup metatiles on hidden page
    call bitmap_apply_door_state_pending_page    ; overlay open/closed door metatiles on hidden page before flip
    call bitmap_apply_gems_pending_page    ; draw uncollected gems on hidden page before flip
    call bitmap_apply_jumpers_pending_page    ; draw idle spring metatiles on hidden page before flip
    call bitmap_apply_walljumpers_pending_page    ; draw idle wall-spring metatiles on hidden page before flip

    ld a, (bitmap_pending_display_page)
    ld (bitmap_displayed_page), a
    or a
    jp z, .flip_to_page0
    ld e, #3F
    jp .write_display_page
.flip_to_page0:
    ld e, #1F
.write_display_page:
    ld a, #02
    call vdp_write_register
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (bitmap_composition_state), a
    ld (bitmap_composition_blocks_left), a
    ld (bitmap_composition_blocks_left + 1), a
    call bitmap_load_enemies
    call bitmap_load_platforms
    call bitmap_boss_load
    scf
    ret

init_hardware_sprite_tables:
    ; Sprite mode 2 tables at F400/F600/F800 (physical layout used by VK).
    ; Colours: upload ONLY frame 0's table here; the rest is per-frame and the
    ; main loop re-uploads on frame change (bitmap_upload_player_frame_colors).
    ld hl, bitmap_room_sprite_colors
    ld de, #F400
    ld bc, 64
    call copy_to_vram_ext
    xor a                   ; frame 0 colours are now in VRAM
    ld (player_colors_loaded), a
    ld hl, bitmap_room_sprite_attrs
    ld de, #F600
    ld bc, bitmap_room_sprite_attrs_end - bitmap_room_sprite_attrs
    call copy_to_vram_ext
    ld hl, bitmap_room_sprite_patterns
    ld de, #F800
    ld bc, bitmap_room_sprite_patterns_end - bitmap_room_sprite_patterns
    jp copy_to_vram_ext

bitmap_wait_vblank:
    ; Poll VDP status S#0 until the frame flag (bit 7) is set: a 60 Hz tick that
    ; does NOT depend on BIOS frame interrupts (the VK-style VDP init does not
    ; enable a BIOS-compatible vblank IRQ). Assumes R#15 = 0. Clobbers AF/BC.
    ; If the host BIOS/VDP state never raises S#0 bit 7, return after a bounded
    ; delay so gameplay cannot hang on the first rendered frame.
    ld bc, #4000
.wv_loop:
    in a, (VDP_CTRL_PORT)
    bit 7, a
    ret nz
    dec bc
    ld a, b
    or c
    jp nz, .wv_loop
    ret

update_player_movement:
    ; Platform movement with 16x16-cell foreground collision. Reads keyboard row 8
    ; directly via PPI (pressed bit = 1 after CPL): bit7=right, bit5=up,
    ; bit4=left, bit0=SPACE. Clobbers AF/BC/DE/HL.
    ; Read keyboard row 8 (cursor keys) DIRECTLY via the PPI, not via BIOS SNSMAT.
    ; SNSMAT (a BIOS call) stalled the DI cartridge loop far below 60Hz (PC parked in
    ; BIOS) AND let the BIOS reset the VDP (R#1 back to 8x8 sprites) every frame.
    in a, (PPI_C)
    and #F0                 ; preserve CAPS LED / cassette / key-click bits
    or 8                    ; select keyboard row 8 in the low nibble
    out (PPI_C), a
    in a, (PPI_B)           ; row 8 data (0 = key pressed)
    cpl                     ; now a set bit means that key is pressed
    ld c, a                 ; C = pressed mask for keyboard row 8
    xor a
    ld (player_moving), a
    ld (player_anim_state), a    ; default animation state each frame; skills assert theirs

    ; Wall-jumper impulse: when player_vx != 0 the player is mid-launch. Apply the
    ; impulse velocity (ignoring the pad), decay it by 1px/frame toward 0, then
    ; skip to the jump/gravity blocks so gravity bends the trajectory. The cell
    ; solidity is still respected by bitmap_try_move_x, so the player stops at a
    ; wall while the impulse keeps decaying (it never gets "stuck"). When player_vx
    ; is 0 this falls through to the normal pad-driven bitmap_stick_dx block.
.wall_impulse_check:
    ld a, (player_vx)
    or a
    jp z, .wall_impulse_done
    call bitmap_try_move_x      ; A = signed player_vx (still loaded)
    ; Friction: move player_vx one step toward 0.
    ld a, (player_vx)
    or a
    jp p, .wall_impulse_pos
    inc a                       ; negative vx -> toward 0
    ld (player_vx), a
    jp .check_jump              ; airborne-or-grounded jump/gravity still runs
.wall_impulse_pos:
    dec a                       ; positive vx -> toward 0
    ld (player_vx), a
    jp .check_jump
.wall_impulse_done:

bitmap_stick_dx:
    bit 7, c
    jp z, .not_right
    ld a, 1
    ld (player_facing), a
    ld (player_moving), a
    ld a, 2                 ; player speed: 2px/frame (was 1 -> felt sluggish)
    push bc
    call bitmap_try_move_x
    pop bc
    ; East edge: if a neighbour room exists, walk into it.
    ld a, (player_x)
    cp 238
    jp c, .check_jump
    ld a, 1                 ; direction east
    push bc
    call start_room_transition
    pop bc
    ret c                   ; transitioned -> done this frame
    jp .check_jump
.not_right:
    bit 4, c
    jp z, .check_jump
    xor a
    ld (player_facing), a
    inc a
    ld (player_moving), a
    ld a, #FE              ; -2px/frame (left)
    push bc
    call bitmap_try_move_x
    pop bc
    ; West edge: if a neighbour room exists, walk into it.
    ld a, (player_x)
    cp 3
    jp nc, .check_jump
    xor a                   ; direction west
    push bc
    call start_room_transition
    pop bc
    ret c
.check_horizontal_edges:
    ld a, (player_x)
    cp 238
    jp c, .check_west_edge
    ld a, 1                 ; direction east
    push bc                 ; start_room_transition clobbers BC; C (keyboard row 8 mask) must survive for .check_jump
    call start_room_transition
    pop bc
    ret c
    jp .check_jump
.check_west_edge:
    ld a, (player_x)
    cp 3
    jp nc, .check_jump
    xor a                   ; direction west
    push bc
    call start_room_transition
    pop bc
    ret c
.check_jump:
    bit 0, c     ; jump key SPC
    jp nz, .jump_pressed
    jp .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .apply_gravity
    ld a, #F8              ; -8 px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a
.apply_gravity:
    ; Sub-pixel gravity: accumulate the fractional strength (Player Config
    ; gravityStrength88 low byte, default 64 = 0.25 px/frame^2) and only nudge
    ; player_vy by 1 px when it carries. Matches SCREEN 4's gradual arc instead
    ; of the old fixed 1 px/frame^2 integer nudge. Clobbers AF.
    ld a, (player_vy)
    cp 6              ; terminal fall speed px/frame (Player Config maxFallSpeed)
    jp z, .after_gravity_tick                   ; already terminal: keep frac frozen
    ld a, (player_vy_frac)
    add a, 128              ; gravityStrength88 low byte (0.25 px/frame^2 default)
    ld (player_vy_frac), a
    jp nc, .after_gravity_tick                  ; fraction did not carry -> vy unchanged this frame
    ld a, (player_vy)                           ; carry: nudge vy 1 px towards terminal
    inc a
    ld (player_vy), a
.after_gravity_tick:

.apply_vertical_velocity:
    ld a, (player_vy)
    or a
    jp z, .movement_done
    bit 7, a
    jp z, .falling
    neg
    ld b, a
    ld c, #FF
    jp .vertical_step_loop
.falling:
    ld a, (player_flags)
    and #FE
    ld (player_flags), a

    ld a, (player_vy)
    ld b, a
    ld c, #01
.vertical_step_loop:
    ld a, c
    push bc
    call bitmap_try_move_y
    pop bc
    jp c, .vertical_blocked
    djnz .vertical_step_loop
    jp .movement_done
.vertical_blocked:
    xor a
    ld (player_vy), a
    bit 7, c
    jp nz, .movement_done
    ld a, (player_flags)
    or #01
    ld (player_flags), a

.movement_done:
    ; North/South edge: walk (or fall) into a vertical neighbour room if one exists.
    ld a, (player_y)
    cp 192
    jp nc, .check_north_edge
    ld a, (player_y)
    cp 2
    jp nc, .check_south_edge
.check_north_edge:
    ld a, 2                 ; direction north
    call start_room_transition
    ret
.check_south_edge:
    ld a, (player_y)
    cp 159
    ret c                   ; not at the bottom edge
    ld a, 3                 ; direction south
    call start_room_transition
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_update_player_sprite_animation
; ------------------------------------------------------------
; PURPOSE:
;   Advance the SCREEN 5 bitmap-room player hardware sprite frame and update
;   the SAT pattern index used by bitmap_update_sprite_sat.
;
; INPUT:
;   player_anim_counter = frame-delay counter.
;   player_anim_frame   = current logical animation frame.
;   player_moving       = 1 when horizontal input moved the player this frame.
;
; OUTPUT:
;   player_pat updated to the V9938 16x16 pattern group for the current frame.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Reads player_moving and writes player_anim_counter, player_anim_frame and
;   player_pat in RAM.
;
; NOTES:
;   V9938 16x16 sprites consume four 8x8 patterns per hardware layer, so the
;   SAT base pattern advances by frame * 16. Stack is
;   used only when the generated stride helper must preserve BC.
; ------------------------------------------------------------
bitmap_update_player_sprite_animation:
    ; State-driven: player_anim_state selects a clip (frameBase,count,delay) from
    ; bitmap_player_anim_clip_table. State 0 = base idle/walk (pins to frame 0 when
    ; idle); every other state cycles its own clip. Clobbers AF/BC/DE/HL.
    ld a, (player_anim_state)
    ld b, a
    ld a, (player_anim_state_prev)
    cp b
    jp z, .anim_same_state
    ld a, b
    ld (player_anim_state_prev), a
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
.anim_same_state:
    ld hl, bitmap_player_anim_clip_table
    ld a, b
    add a, a
    add a, b                 ; A = state * 3
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    ld (player_anim_clip_base), a
    inc hl
    ld a, (hl)
    ld (player_anim_clip_count), a
    inc hl
    ld a, (hl)
    ld (player_anim_clip_delay), a
    ld a, b
    or a                     ; base state (0) pins to idle frame 0 while not moving
    jp nz, .anim_cycle
    ld a, (player_moving)
    or a
    jp nz, .anim_cycle
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    jp .anim_set_abs
.anim_cycle:
    ld a, (player_anim_clip_delay)
    ld b, a
    ld a, (player_anim_counter)
    inc a
    cp b
    jp nc, .anim_advance
    ld (player_anim_counter), a
    jp .anim_set_abs
.anim_advance:
    xor a
    ld (player_anim_counter), a
    ld a, (player_anim_clip_count)
    ld b, a
    ld a, (player_anim_frame)
    inc a
    cp b
    jp nc, .anim_wrap
    ld (player_anim_frame), a
    jp .anim_set_abs
.anim_wrap:
    xor a
    ld (player_anim_frame), a
.anim_set_abs:
    ld a, (player_anim_clip_base)
    ld b, a
    ld a, (player_anim_frame)
    add a, b
    ld (player_anim_abs_frame), a
.refresh_player_pattern:
    ld a, (player_anim_abs_frame)
    push bc
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    pop bc

    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp nz, .store_player_pattern
    add a, 64
.store_player_pattern:
    ld (player_pat), a
    ret


; ------------------------------------------------------------
; FUNCTION: fast_copy_to_vram_ext
; ------------------------------------------------------------
; PURPOSE:
;   Fast RAM->VRAM block copy of up to 256 bytes with OTIR (~21 cyc/byte vs the
;   ~48 cyc/byte of copy_to_vram_ext's byte loop). For per-frame VRAM work the
;   main loop does right after bitmap_wait_vblank, when VRAM is idle (no display
;   fetch), so the faster write rate is safe and leaves CPU budget for PT3/enemies.
;
; INPUT:
;   HL = source RAM pointer.
;   DE = destination VRAM address (full 16-bit).
;   B  = byte count (1..256; 0 means 256).
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   vdp_write_register.
;
; SIDE EFFECTS:
;   Writes B bytes to VRAM, restores R#14 = 0 (bitmap_wait_vblank reads S#0).
;   Does not select a status register (R#15 untouched).
; ------------------------------------------------------------
fast_copy_to_vram_ext:
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (#99), a
    ld a, d
    and #3F
    or #40
    out (#99), a
    ld c, #98
    otir
    xor a
    ld e, a
    ld a, #0E
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_upload_player_frame_colors
; ------------------------------------------------------------
; PURPOSE:
;   Re-upload the player's per-line sprite colour table for the CURRENT
;   animation frame to the V9938 sprite colour table (#F400), but ONLY when the
;   frame changed. Each frame has its own colour table because CC/OR multi-colour
;   rows differ between frames; the SAT only swaps the pattern index, so without
;   this, frames > 0 render with frame 0's colours (white/garbage lines).
;
; INPUT:
;   player_anim_frame    = current logical frame (0..1).
;   player_colors_loaded = frame whose colours are currently in VRAM.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF (always); BC, DE, HL only when a frame change triggers the upload.
;
; PRESERVES:
;   IX, IY. Returns after touching only AF when the frame is unchanged, so the
;   common case (most frames) costs ~7 instructions, not a VRAM copy.
;
; CALLS:
;   fast_copy_to_vram_ext (only on a frame change).
;
; SIDE EFFECTS:
;   On a frame change: writes 64 bytes (4 layer(s) x 16 lines)
;   to VRAM #F400 and updates player_colors_loaded.
;
; NOTES:
;   Source = bitmap_room_sprite_colors + player_anim_frame * 64.
;   Mirror frames reuse the same colours (a horizontal flip keeps line colours),
;   so the logical frame indexes the table directly. Self-correcting: any stale
;   player_colors_loaded just forces one upload on the first differing frame.
; ------------------------------------------------------------
bitmap_upload_player_frame_colors:
    ld a, (player_anim_abs_frame)
    ld c, a
    ld a, (player_colors_loaded)
    cp c
    ret z
    ld a, c
    ld (player_colors_loaded), a
    ld hl, bitmap_room_sprite_colors
    or a
    jp z, .upload_frame_colors
    ld de, 64
.add_frame_color_offset:
    add hl, de
    dec a
    jp nz, .add_frame_color_offset
.upload_frame_colors:
    ld de, #F400
    ld b, 64
    jp fast_copy_to_vram_ext

bitmap_try_move_x:
    ; A = signed dx. Commits player_x when the leading edge of the configured body
    ; collision box is not solid. Hitbox: x=3, y=3,
    ; w=9, h=29. Probes Y rows 3/19/31
    ; (every <=16px so a tall body cannot tunnel a cell). Large ice-slide dx is
    ; clamped at the room edges before probing so unsigned player_x never wraps
    ; from x=2 to x=250 (or past the east edge) during room transitions.
    ; While player_y is wrapped above the top edge (#FF..#C0, jumping over the
    ; HUD with no north rail) probe rows that fall outside the visible band are
    ; skipped so the arc can travel horizontally; rows that wrap back into the
    ; visible band still block, and the bottom-edge guard (player_y < 192 with
    ; an offscreen probe row) keeps returning solid. Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_x)
    bit 7, b
    jp z, .check_right_bounds
    add a, b                ; negative dx: carry means no unsigned underflow
    jp c, .x_check_left_min
.x_clamp_left:
    ld a, 2
    jp .x_candidate_ready
.x_check_left_min:
    cp 2
    jp c, .x_clamp_left
    jp .x_candidate_ready
.check_right_bounds:
    add a, b                ; A = candidate X (sprite top-left)
.x_check_right_max:
    cp 238
    jp c, .x_candidate_ready
    ld a, 238
.x_candidate_ready:
    push af                 ; save candidate across the probes
    bit 7, b
    jp nz, .x_left_edge
    add a, 11
    jp .x_have_edge
.x_left_edge:
    add a, 3
.x_have_edge:
    ld b, a                 ; B = probe X (hitbox leading edge; preserved by probe_solid)
    ld a, (player_y)
    add a, 3
    ld c, a                 ; C = probe Y (+3)
    cp 192
    jp c, .x_probe_0_visible
    ld a, (player_y)
    cp 192
    jp nc, .x_probe_0_skip   ; player wrapped above the top edge: offscreen row passes
.x_probe_0_visible:
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_0_skip:
    ld a, (player_y)
    add a, 19
    ld c, a                 ; C = probe Y (+19)
    cp 192
    jp c, .x_probe_1_visible
    ld a, (player_y)
    cp 192
    jp nc, .x_probe_1_skip   ; player wrapped above the top edge: offscreen row passes
.x_probe_1_visible:
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_1_skip:
    ld a, (player_y)
    add a, 31
    ld c, a                 ; C = probe Y (+31)
    cp 192
    jp c, .x_probe_2_visible
    ld a, (player_y)
    cp 192
    jp nc, .x_probe_2_skip   ; player wrapped above the top edge: offscreen row passes
.x_probe_2_visible:
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_2_skip:
    pop af                  ; A = candidate X
    ld (player_x), a
    ret
.x_blocked:
    pop af
    ret

bitmap_try_move_y:
    ; A = signed single-pixel dy (#01 down, #FF up). Commits player_y when the
    ; leading edge of the configured body collision box is not solid. Carry set on
    ; blocked. Probes X cols 3/11. Clobbers AF/BC/DE/HL.
    ; Up moves at the top edge are allowed to wrap into #FF..#C0: that represents
    ; a logical negative Y so jumps can leave the screen above the HUD when there
    ; is no north rail. Probes whose Y is outside the visible band are skipped
    ; only while the candidate itself is in that top-offscreen range; bottom-edge
    ; probes still block through bitmap_probe_solid.
    ld b, a
    ld a, (player_y)
    add a, b                ; A = candidate Y (sprite top-left)
    push af
    bit 7, b
    jp nz, .y_up_edge
    add a, 31
    jp .y_have_edge
.y_up_edge:
    add a, 3
.y_have_edge:
    ld c, a                 ; C = probe Y (hitbox leading edge; preserved by probe_solid)
    ld a, c
    cp 192
    jp c, .y_probe_0_visible
    pop af
    push af
    cp 192
    jp nc, .y_probe_0_skip
.y_probe_0_visible:
    ld a, (player_x)
    add a, 3
    ld b, a                 ; B = probe X (+3)
    call bitmap_probe_solid
    jp nz, .y_blocked
.y_probe_0_skip:
    ld a, c
    cp 192
    jp c, .y_probe_1_visible
    pop af
    push af
    cp 192
    jp nc, .y_probe_1_skip
.y_probe_1_visible:
    ld a, (player_x)
    add a, 11
    ld b, a                 ; B = probe X (+11)
    call bitmap_probe_solid
    jp nz, .y_blocked
.y_probe_1_skip:
    pop af                  ; A = candidate Y
    ld (player_y), a
    or a                    ; clear carry
    ret
.y_blocked:
    pop af
    scf
    ret

bitmap_probe_solid:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when passable (cell empty OR deadly-only). Index = (Y & #F0) + (X >> 4)
    ; into the 16x12 grid. Because a cell is 16 px, (Y >> 4) * 16 == (Y & #F0).
    ; The Deadly bit (0x40) is masked out so a deadly-only tile (e.g. floor
    ; spikes) does NOT block movement; Solid+Deadly (0x50) still blocks because
    ; the Solid bit (0x10) survives the mask. Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .probe_y_visible
    ld a, 1                 ; outside visible Y range is solid
    or a
    ret
.probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)              ; A = cell value (returned intact to honour the contract)
    ld e, a                 ; E = copy of cell value
    and #BF                 ; mask out Deadly bit (#BF = ~#40); Z when empty or deadly-only
    jp nz, .probe_return_map_solid
    push de
    call bitmap_probe_locked_door_solid
    jp z, .probe_no_door_block
    pop de
    ret
.probe_no_door_block:
    pop de
    ld a, e                 ; restore A = original cell value
    cp e                    ; keep Z set: empty/deadly-only map cells are passable
    ret
.probe_return_map_solid:
    ld a, e                 ; restore A = original solid cell value
    or a
    ret

bitmap_probe_deadly:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when the cell does NOT have the Deadly bit (0x40), NZ when it does.
    ; Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .deadly_probe_y_visible
    xor a
    ret
.deadly_probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)              ; A = cell value (returned intact)
    bit 6, a                ; test Deadly bit without altering A
    ret

bitmap_probe_behavior:
    ; B = pixel X, C = pixel Y. Returns A = behavior cell value with Z set
    ; when empty. behavior=3 is the ice surface; behavior=4 is exit_enemy.
    ; Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .behavior_probe_y_visible
    xor a
    ret
.behavior_probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_map
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_sprite_sat
; ------------------------------------------------------------
; PURPOSE:
;   Write player SAT bytes, converting logical game Y to visual SCREEN 5 Y.
;
; INPUT:
;   player_y = logical game Y coordinate, 0..191.
;   player_x = visual/logical X coordinate.
;   player_pat = base hardware sprite pattern index for the current frame.
;   player_ec = early-clock byte.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, DE
;
; PRESERVES:
;   BC, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes 4 player SAT entries plus a terminator to
;   VRAM #F600 through VDP ports #99/#98.
;
; NOTES:
;   Background pixels are shifted down by 20px to
;   reserve the top HUD band, but collision/movement keep logical coordinates.
;   Multi-color sprites are exported as overlapped V9938 mode-2 sprite layers.
; ------------------------------------------------------------
bitmap_update_sprite_sat:
    ld de, #F600
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (#99), a
    ld a, d
    and #3F
    or #40
    out (#99), a
    ; Blink i-frames feedback: while invulnerable (player_invuln != 0), hide the
    ; player every other phase so hits/respawns read as a flicker. blink_hide is
    ; computed here (SAT upload always runs, even mid-transition) and read by
    ; each layer's Y write below. 8-frame cycle: visible phases 0..3, hidden 4..7.
    ld a, (player_invuln)
    or a
    jr z, .blink_hide_off
    ld a, (blink_phase)
    inc a
    and #07
    ld (blink_phase), a
    cp #04
    jr c, .blink_hide_off
    ld a, 1
    ld (blink_hide), a
    jr .blink_hide_done
.blink_hide_off:
    xor a
    ld (blink_hide), a
.blink_hide_done:
    ld a, (blink_hide)
    or a
    jp nz, .ply_slot_0_hide_y
    ld a, (player_y)
    add a, 20
    ; Natural 8-bit wrap: player_y in #C0..#FF (above the top edge) lands this
    ; layer over the HUD band or partially clipped by the display top, so the
    ; jump arc stays visible over the HUD instead of pinning below it.
    cp #D8                         ; V9938 SAT terminator Y would hide this and later layers
    jp nz, .ply_slot_0_y_safe
    inc a                          ; nudge 1px: 216->217 stays offscreen but keeps the SAT alive
.ply_slot_0_y_safe:
    out (#98), a
    jp .ply_slot_0_after_y
.ply_slot_0_hide_y:
    ld a, #D4                      ; off-screen but NOT the #D8 SAT terminator:
    out (#98), a      ; enemy/platform/bullet sprites after the player must stay visible
.ply_slot_0_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (blink_hide)
    or a
    jp nz, .ply_slot_1_hide_y
    ld a, (player_y)
    add a, 20
    ; Natural 8-bit wrap: player_y in #C0..#FF (above the top edge) lands this
    ; layer over the HUD band or partially clipped by the display top, so the
    ; jump arc stays visible over the HUD instead of pinning below it.
    cp #D8                         ; V9938 SAT terminator Y would hide this and later layers
    jp nz, .ply_slot_1_y_safe
    inc a                          ; nudge 1px: 216->217 stays offscreen but keeps the SAT alive
.ply_slot_1_y_safe:
    out (#98), a
    jp .ply_slot_1_after_y
.ply_slot_1_hide_y:
    ld a, #D4                      ; off-screen but NOT the #D8 SAT terminator:
    out (#98), a      ; enemy/platform/bullet sprites after the player must stay visible
.ply_slot_1_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    add a, 4
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (blink_hide)
    or a
    jp nz, .ply_slot_2_hide_y
    ld a, (player_y)
    add a, 20
    add a, 16                   ; cell row +16px
    ; Natural 8-bit wrap: player_y in #C0..#FF (above the top edge) lands this
    ; layer over the HUD band or partially clipped by the display top, so the
    ; jump arc stays visible over the HUD instead of pinning below it.
    cp #D8                         ; V9938 SAT terminator Y would hide this and later layers
    jp nz, .ply_slot_2_y_safe
    inc a                          ; nudge 1px: 216->217 stays offscreen but keeps the SAT alive
.ply_slot_2_y_safe:
    out (#98), a
    jp .ply_slot_2_after_y
.ply_slot_2_hide_y:
    ld a, #D4                      ; off-screen but NOT the #D8 SAT terminator:
    out (#98), a      ; enemy/platform/bullet sprites after the player must stay visible
.ply_slot_2_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    add a, 8
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (blink_hide)
    or a
    jp nz, .ply_slot_3_hide_y
    ld a, (player_y)
    add a, 20
    add a, 16                   ; cell row +16px
    ; Natural 8-bit wrap: player_y in #C0..#FF (above the top edge) lands this
    ; layer over the HUD band or partially clipped by the display top, so the
    ; jump arc stays visible over the HUD instead of pinning below it.
    cp #D8                         ; V9938 SAT terminator Y would hide this and later layers
    jp nz, .ply_slot_3_y_safe
    inc a                          ; nudge 1px: 216->217 stays offscreen but keeps the SAT alive
.ply_slot_3_y_safe:
    out (#98), a
    jp .ply_slot_3_after_y
.ply_slot_3_hide_y:
    ld a, #D4                      ; off-screen but NOT the #D8 SAT terminator:
    out (#98), a      ; enemy/platform/bullet sprites after the player must stay visible
.ply_slot_3_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    add a, 12
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, #D8
    out (#98), a
    xor a
    out (#98), a
    out (#98), a
    out (#98), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret







; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the shoot key ('N', keyboard matrix row 4 bit 3) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 4 on PPI_C.
; ------------------------------------------------------------
bitmap_shoot_pressed:
    in a, (PPI_C)
    and #F0
    or 4
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #08
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_shoot_cooldown
; ------------------------------------------------------------
bitmap_tick_shoot_cooldown:
    ld a, (bitmap_shoot_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_shoot_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_release_lock
; ------------------------------------------------------------
bitmap_shoot_release_lock:
    call bitmap_shoot_pressed
    or a
    ret nz
    xor a
    ld (bitmap_shoot_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_spawn_bullet
; ------------------------------------------------------------
; PURPOSE: Ticks cooldown, checks fire key + lock, and spawns one bullet in
;   the first free pool slot at the player's position with current facing.
;   No-op when pool is full.
; INPUT: none. OUTPUT: a bullet slot activated when conditions met.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; NOTES: IX walks the pool with a 4-byte stride (active, x, y, dir).
;   Spawn position: x = player_x +/- 14 (facing edge), y = player_y + 6.
; ------------------------------------------------------------
bitmap_try_spawn_bullet:
    call bitmap_tick_shoot_cooldown
    call bitmap_shoot_release_lock
    call bitmap_shoot_pressed
    or a
    jp z, .spawn_done
    ld a, (bitmap_shoot_cooldown)
    or a
    jp nz, .spawn_done
    ld a, (bitmap_shoot_lock)
    or a
    jp nz, .spawn_done
    ld ix, bitmap_bullet_pool
    ld b, #03
.find_free:
    ld a, (ix+0)
    or a
    jp z, .found
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .find_free
    jp .spawn_done
.found:
    ld (ix+0), 1
    ld a, (player_facing)
    ld (ix+3), a
    or a
    jp z, .spawn_left
    ld a, (player_x)
    add a, 14
    ld (ix+1), a
    jp .spawn_y
.spawn_left:
    ld a, (player_x)
    add a, 2
    ld (ix+1), a
.spawn_y:
    ld a, (player_y)
    add a, 6
    ld (ix+2), a
    ld a, #0A
    ld (bitmap_shoot_cooldown), a
    ld a, 1
    ld (bitmap_shoot_lock), a
.spawn_done:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_bullets
; ------------------------------------------------------------
; PURPOSE: Advances each active bullet by bulletSpeed px in its latched
;   direction, then checks wall collision (bitmap_probe_solid) and screen
;   bounds. Deactivates bullets that hit a wall or leave the screen.
; INPUT: none. OUTPUT: pool positions updated; slots may be deactivated.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; CALLS: bitmap_probe_solid, bitmap_bullet_check_enemy_collision.
; NOTES: IX walks the pool (4-byte stride). The djnz counter B is
;   saved across the probe call with push/pop bc because B/C carry the
;   probe X/Y arguments.
; ------------------------------------------------------------
bitmap_step_bullets:
    ld ix, bitmap_bullet_pool
    ld b, #03
.step_loop:
    ld a, (ix+0)
    or a
    jp z, .step_next
    ld a, (ix+3)
    or a
    jp z, .step_left
    ld a, (ix+1)
    add a, #04
    jp c, .deactivate
    ld (ix+1), a
    jp .step_wall
.step_left:
    ld a, (ix+1)
    sub #04
    jp c, .deactivate
    ld (ix+1), a
.step_wall:
    push bc
    ld b, (ix+1)
    ld c, (ix+2)
    call bitmap_probe_solid
    pop bc
    jp nz, .deactivate
    call bitmap_bullet_check_enemy_collision
.step_next:
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .step_loop
    ret
.deactivate:
    xor a
    ld (ix+0), a
    jp .step_next

; ------------------------------------------------------------
; FUNCTION: bitmap_update_bullet_sat
; ------------------------------------------------------------
; PURPOSE: Appends active bullet SAT entries after the player layers, then
;   writes the #D8 terminator. Called right after bitmap_update_sprite_sat.
; INPUT: none. OUTPUT: SAT entries at VRAM #F61C onwards.
; DESTROYS: AF, DE, HL, IX. PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_update_bullet_sat:
    ld de, #F61C
    push bc
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld ix, bitmap_bullet_pool
    ld b, #03
.sat_loop:
    ld a, (ix+0)
    or a
    jp z, .sat_next
    ld a, (ix+2)
    add a, #14
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, #80
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
.sat_next:
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .sat_loop
    ld a, #D8
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_check_enemy_collision
; ------------------------------------------------------------
; PURPOSE: Bullet-vs-target dispatch. Jumps to bitmap_boss_bullet_hit (bitmap boss hit check).
; INPUT: IX -> current bullet slot (active, x, y, dir).
; OUTPUT: target HP/despawn on hit. DESTROYS: AF (target may use more).
; PRESERVES: BC, IX (bullet loop counter + slot pointer contract).
; ------------------------------------------------------------
bitmap_bullet_check_enemy_collision:
    jp bitmap_boss_bullet_hit












; ------------------------------------------------------------
; FUNCTION: bitmap_check_deadly_contact
; ------------------------------------------------------------
; PURPOSE:
;   Apply deadly-tile damage + blink i-frames for the bitmap room backend.
;   Each frame (after movement) the body's lower band is probed for the Deadly
;   bit (0x40). On contact ALWAYS: -1 player_health + arm blink. The hearts HUD
;   follows player_health so every touch drops a heart. deadlyInstantRespawn
;   only decides whether the player is also repositioned to the spawn (true) or
;   stays (false). At 0 health -> -1 life + full respawn (health reset + blink).
;   While blinking (blink_timer/player_invuln != 0) the player is immune to all
;   damage. blink_ended pulses 1 the exact frame blink finishes (1 -> 0).
;
; INPUT:
;   RAM state: player_x, player_y, player_health, player_lives, player_invuln,
;              blink_phase, blink_ended, bitmap_composition_state,
;              current_screen_index.
;
; OUTPUT:
;   player_health / player_lives / player_invuln / blink_ended updated; on
;   respawn/reposition also player_x, player_y, player_vy, player_vy_frac.
;
; DESTROYS:
;   AF, DE, HL
;
; PRESERVES:
;   BC (so the main loop can call it next to skills without register spills)
;
; CALLS:
;   bitmap_probe_deadly
;
; SIDE EFFECTS:
;   Reads bitmap_room_collision_map (probe) and bitmap_room_spawn_x/y_table
;   (respawn/reposition). Never fires while bitmap_composition_state != 0.
; ------------------------------------------------------------
bitmap_check_deadly_contact:
    ld a, (bitmap_composition_state)
    or a
    ret nz                     ; skip during room transition/composition

    ; --- blink i-frames countdown ---
    xor a
    ld (blink_ended), a        ; default: blink not ending this frame
    ld a, (player_invuln)
    or a
    jr z, .deadly_invuln_done  ; already 0: not blinking
    dec a
    ld (player_invuln), a      ; count down blink/i-frames
    or a
    jr nz, .deadly_invuln_done ; still blinking
    ld a, 1
    ld (blink_ended), a        ; just reached 0 -> blink ended this frame
.deadly_invuln_done:
    ld a, (player_invuln)
    or a
    ret nz                     ; in_blink -> immune to all damage this frame

    ; Probe the body's lower band (left / center / right) for a deadly cell.
    ld a, (player_y)
    add a, 31
    ld c, a                    ; C = probe Y (lower body edge); bitmap_probe_deadly keeps BC

    ld a, (player_x)
    add a, 3
    ld b, a
    call bitmap_probe_deadly
    jp nz, .deadly_take_damage
    ld a, (player_x)
    add a, 7
    ld b, a
    call bitmap_probe_deadly
    jp nz, .deadly_take_damage
    ld a, (player_x)
    add a, 11
    ld b, a
    call bitmap_probe_deadly
    jp z, .deadly_no_contact   ; no deadly contact in any sample -> exit
    ; Action mode (health.deadlyInstantRespawn = false): each deadly touch
    ; costs 1 health + blink; the player stays in place. Full respawn at 0 hp.
.deadly_take_damage:
    ld hl, player_health
    dec (hl)
    ld a, (hl)
    or a
    jr z, .deadly_dead
    ld a, #3C
    ld (player_invuln), a       ; arm blink i-frames, stay in place
    ret
.deadly_dead:
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .deadly_game_over     ; lives 0 -> request Game Flow exit
    jp .deadly_respawn          ; lives remain -> -1 life + full respawn
.deadly_game_over:
    ; Last life spent: request a Game Flow exit. The gameplay loop checks this
    ; flag next frame and returns to the Game Flow dispatcher (which follows the
    ; WorldLink's connection, e.g. to an End:GameOver node). Fall through to the
    ; respawn so the player is repositioned while the flag is detected.
    ld a, 1
    ld (bitmap_game_over_flag), a
.deadly_respawn:
    ; FULL respawn (health reached 0): reset health, arm blink, zero velocity.
    ld a, #05
    ld (player_health), a
    ld a, #3C
    ld (player_invuln), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ; fall through to .deadly_reposition (move player to the room spawn)
.deadly_reposition:
    ; Move the player to the current room's spawn point (no health reset).
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
    ret
.deadly_no_contact:
    ret


; ------------------------------------------------------------
; FUNCTION: hud_linked_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launches the 15-byte V9938 command currently in hud_cmd_block. Shared by
;   every linked HUD dynamic widget (they run sequentially from the main loop,
;   never concurrently, so the scratch block is safe to reuse).
; DESTROYS: AF, HL
; PRESERVES: BC
; ------------------------------------------------------------
hud_linked_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    push bc
    ld hl, hud_cmd_block
    ld b, 15
.hud_linked_launch_write:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .hud_linked_launch_write
    pop bc
    ret
; ------------------------------------------------------------
; FUNCTION: hud_byte_to_dec3
; ------------------------------------------------------------
; PURPOSE:
;   Converts A (0-255) to 3 ASCII decimal digits in hud_dec3_buffer (hundreds,
;   tens, units), shared by every linked HUD counter/iconCounter widget.
; DESTROYS: AF, BC
; ------------------------------------------------------------
hud_byte_to_dec3:
    ld c, a
    ld b, 0
.hud_dec3_hundreds:
    ld a, c
    cp 100
    jr c, .hud_dec3_tens_start
    sub 100
    ld c, a
    inc b
    jr .hud_dec3_hundreds
.hud_dec3_tens_start:
    ld a, b
    add a, '0'
    ld (hud_dec3_buffer), a
    ld b, 0
.hud_dec3_tens:
    ld a, c
    cp 10
    jr c, .hud_dec3_units_start
    sub 10
    ld c, a
    inc b
    jr .hud_dec3_tens
.hud_dec3_units_start:
    ld a, b
    add a, '0'
    ld (hud_dec3_buffer + 1), a
    ld a, c
    add a, '0'
    ld (hud_dec3_buffer + 2), a
    ret
; ------------------------------------------------------------
; FUNCTION: upload_hud_linked_0 / update_hud_linked_0
; ------------------------------------------------------------
; PURPOSE:
;   Generalized icon-row/icon-toggle widget for linked HUD element "hud_el_1783004114045_6h49y".
;   Same dirty-flag + HMMM pattern as update_hud_hearts: redraws 5
;   slot(s) at x=1..+16, y=4 on BOTH display pages only when
;   player_health changes. Keeping page 0 and page 1 identical prevents HUD
;   redraw/flicker during room transitions; only the game band is page-flipped.
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
upload_hud_linked_0:
    ld a, bitmap_room_hud_linked_0_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_hud_linked_0_rle_chunk_0
    ld a, 1
    ld de, #2A00
    ld bc, bitmap_room_hud_linked_0_rle_chunk_0_end - bitmap_room_hud_linked_0_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret
update_hud_linked_0:
    ld a, (player_health)
    ld hl, hud_linked_0_drawn
    cp (hl)
    ret z
    ld (hl), a

    ld hl, hud_linked_0_cmd_template
    ld de, hud_cmd_block
    ld bc, 15
    ldir
    ld a, 4
    ld (hud_cmd_block + 6), a
    xor a
    ld (hud_cmd_block + 7), a
    call .hud_linked_0_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a
    call .hud_linked_0_draw_page

    call bitmap_restore_hud_separator
    ret

.hud_linked_0_draw_page:
    ld b, 5
    ld c, 0
.hud_linked_0_loop:
    ld a, c
    push hl
    ld hl, player_health
    cp (hl)
    pop hl
    jr c, .hud_linked_0_full
    ld a, 16
    jr .hud_linked_0_set_sx
.hud_linked_0_full:
    xor a
.hud_linked_0_set_sx:
    ld (hud_cmd_block + 0), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, 1
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    inc c
    djnz .hud_linked_0_loop
    ret

hud_linked_0_cmd_template:
    ; SY is a full 10-bit word: tile sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, #D4,#00, 0,0, 0,0, #10,0, #10,0, 0,0, #D0
; ------------------------------------------------------------
; FUNCTION: upload_hud_linked_1 / update_hud_linked_1
; ------------------------------------------------------------
; PURPOSE:
;   Numeric counter widget for linked HUD element "hud_el_1783009772122_go9ku": 2
;   zero-padded decimal digit(s) at x=168, y=2, redrawn only when
;   hud_linked_1_value changes (dirty-flag). 8-bit value via hud_byte_to_dec3.
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_byte_to_dec3, hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
upload_hud_linked_1:
    ld a, bitmap_room_hud_linked_1_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_hud_linked_1_rle_chunk_0
    ld a, 1
    ld de, #3200
    ld bc, bitmap_room_hud_linked_1_rle_chunk_0_end - bitmap_room_hud_linked_1_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret
update_hud_linked_1:
    ld a, (hud_linked_1_value)
    ld hl, hud_linked_1_drawn
    cp (hl)
    ret z
    ld (hl), a
    call hud_byte_to_dec3

    ld hl, hud_linked_1_cmd_template
    ld de, hud_cmd_block
    ld bc, 15
    ldir
    ld a, 2
    ld (hud_cmd_block + 6), a
    xor a
    ld (hud_cmd_block + 7), a
    call .hud_linked_1_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a
    call .hud_linked_1_draw_page

    call bitmap_restore_hud_separator
    ret

.hud_linked_1_draw_page:
    ld b, 2
    ld c, 0
.hud_linked_1_digit_loop:
    push bc
    ld a, c
    ld e, a
    ld d, 0
    ld hl, hud_dec3_buffer + 1
    add hl, de
    ld a, (hl)
    sub '0'
    add a, a
    add a, a
    add a, a
    ld (hud_cmd_block + 0), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, 168
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz .hud_linked_1_digit_loop
    ret

hud_linked_1_cmd_template:
    ; SY is a full 10-bit word: glyph sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, #E4,#00, 0,0, 0,0, 8,0, 8,0, 0,0, #D0
; ------------------------------------------------------------
; FUNCTION: upload_hud_linked_2 / update_hud_linked_2
; ------------------------------------------------------------
; PURPOSE:
;   Generalized icon-row/icon-toggle widget for linked HUD element "hud_el_1783454311897_7p2ha".
;   Same dirty-flag + HMMM pattern as update_hud_hearts: redraws 1
;   slot(s) at x=108..+16, y=1 on BOTH display pages only when
;   bitmap_key_count changes. Keeping page 0 and page 1 identical prevents HUD
;   redraw/flicker during room transitions; only the game band is page-flipped.
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
upload_hud_linked_2:
    ld a, bitmap_room_hud_linked_2_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_hud_linked_2_rle_chunk_0
    ld a, 3
    ld de, #2A00
    ld bc, bitmap_room_hud_linked_2_rle_chunk_0_end - bitmap_room_hud_linked_2_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret
update_hud_linked_2:
    ld a, (bitmap_key_count)
    ld hl, hud_linked_2_drawn
    cp (hl)
    ret z
    ld (hl), a

    ld hl, hud_linked_2_cmd_template
    ld de, hud_cmd_block
    ld bc, 15
    ldir
    ld a, 1
    ld (hud_cmd_block + 6), a
    xor a
    ld (hud_cmd_block + 7), a
    call .hud_linked_2_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a
    call .hud_linked_2_draw_page

    call bitmap_restore_hud_separator
    ret

.hud_linked_2_draw_page:
    ld b, 1
    ld c, 0
.hud_linked_2_loop:
    ; Key item icon toggle: draw the "full" half (SX=0) when the player
    ; holds at least one key (bitmap_key_count > 0), else the "empty" half
    ; (SX=16). Requires an icon tile with both halves authored, like
    ; an iconRow slot; the HUD icon editor's emptyAtlasEntryId fills it.
    ld a, (bitmap_key_count)
    or a
    jr nz, .hud_linked_2_full
    ld a, 16
    jr .hud_linked_2_set_sx
.hud_linked_2_full:
    xor a
.hud_linked_2_set_sx:
    ld (hud_cmd_block + 0), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, 108
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    inc c
    djnz .hud_linked_2_loop
    ret

hud_linked_2_cmd_template:
    ; SY is a full 10-bit word: tile sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, #D4,#01, 0,0, 0,0, #10,0, #10,0, 0,0, #D0
; ------------------------------------------------------------
; FUNCTION: upload_hud_linked_3 / update_hud_linked_3
; ------------------------------------------------------------
; PURPOSE:
;   Numeric counter widget for linked HUD element "hud_el_1783527996153_k7cbd": 2
;   zero-padded decimal digit(s) at x=127, y=2, redrawn only when
;   bitmap_key_count changes (dirty-flag). 8-bit value via hud_byte_to_dec3.
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_byte_to_dec3, hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
upload_hud_linked_3:
    ld a, bitmap_room_hud_linked_3_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_hud_linked_3_rle_chunk_0
    ld a, 5
    ld de, #1800
    ld bc, bitmap_room_hud_linked_3_rle_chunk_0_end - bitmap_room_hud_linked_3_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret
update_hud_linked_3:
    ld a, (bitmap_key_count)
    ld hl, hud_linked_3_drawn
    cp (hl)
    ret z
    ld (hl), a
    call hud_byte_to_dec3

    ld hl, hud_linked_3_cmd_template
    ld de, hud_cmd_block
    ld bc, 15
    ldir
    ld a, 2
    ld (hud_cmd_block + 6), a
    xor a
    ld (hud_cmd_block + 7), a
    call .hud_linked_3_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a
    call .hud_linked_3_draw_page

    call bitmap_restore_hud_separator
    ret

.hud_linked_3_draw_page:
    ld b, 2
    ld c, 0
.hud_linked_3_digit_loop:
    push bc
    ld a, c
    ld e, a
    ld d, 0
    ld hl, hud_dec3_buffer + 1
    add hl, de
    ld a, (hl)
    sub '0'
    add a, a
    add a, a
    add a, a
    ld (hud_cmd_block + 0), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, 127
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz .hud_linked_3_digit_loop
    ret

hud_linked_3_cmd_template:
    ; SY is a full 10-bit word: glyph sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, #B0,#02, 0,0, 0,0, 8,0, 8,0, 0,0, #D0

; ------------------------------------------------------------
; FUNCTION: bitmap_player_overlaps_16
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 entity box.
;
; INPUT:
;   D = entity X in pixels, E = entity Y in pixels.
;
; OUTPUT:
;   A = 1 and NZ when overlapping; A = 0 and Z when separated.
;
; DESTROYS:
;   AF, B
;
; PRESERVES:
;   C, DE, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   None.
; ------------------------------------------------------------
bitmap_player_overlaps_16:
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .key_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
    add a, 3
    cp b
    jp z, .key_overlap_x_ok
    jp nc, .key_overlap_no
.key_overlap_x_ok:
    ld a, (player_y)
    add a, 31
    cp e
    jp c, .key_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
    add a, 3
    cp b
    jp z, .key_overlap_yes
    jp nc, .key_overlap_no
.key_overlap_yes:
    ld a, 1
    or a
    ret
.key_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_actor_overlaps_16
; ------------------------------------------------------------
; PURPOSE:
;   Generic 16x16 AABB overlap used by pressure buttons for non-player actors.
;
; INPUT:
;   B = actor X, C = actor Y, D = button X, E = button Y.
;
; OUTPUT:
;   A = 1 and NZ when overlapping; A = 0 and Z when separated.
;
; DESTROYS:
;   AF
;
; PRESERVES:
;   BC, DE, HL, IX, IY
; ------------------------------------------------------------
bitmap_actor_overlaps_16:
    ld a, b
    add a, 15
    cp d
    jp c, .actor_overlap_no
    ld a, d
    add a, 15
    cp b
    jp c, .actor_overlap_no
    ld a, c
    add a, 15
    cp e
    jp c, .actor_overlap_no
    ld a, e
    add a, 15
    cp c
    jp c, .actor_overlap_no
    ld a, 1
    or a
    ret
.actor_overlap_no:
    xor a
    ret



; ------------------------------------------------------------
; FUNCTION: bitmap_update_key_doors
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame key/item entity system. Collectible entities with keyPickupId set a
;   bit in bitmap_key_inventory once. Door entities with lockedDoor metadata test
;   the required bit, optionally consume it, optionally remember that the door was
;   opened once, and queue a SCREEN 5 room transition to the configured target
;   room/player entry.
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state, player_x/player_y,
;              bitmap_key_inventory and per-entity flag bytes.
;
; OUTPUT:
;   Inventory/flags updated; door contact may set bitmap_pending_room and start a
;   room composition transition. Carry is not a public result.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_check_key_pickups, bitmap_check_locked_doors.
;
; SIDE EFFECTS:
;   Writes bitmap_key_* RAM and may queue a page-flipped room transition.
; ------------------------------------------------------------
bitmap_update_key_doors:
    ld a, (bitmap_composition_state)
    or a
    ret nz
    call bitmap_check_key_pickups
    jp bitmap_check_locked_doors

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_key_pickup_visuals_visible
; ------------------------------------------------------------
; PURPOSE:
;   Draw uncollected key-pickup metatiles for the current room onto the
;   currently visible SCREEN 5 page. Used after the synchronous boot load_room
;   and after a dialogue-close repaint, so the key reappears over the room
;   background unless it was already collected (flag set).
;
; INPUT:
;   current_screen_index, bitmap_displayed_page, bitmap_key_pickup_flags.
;
; OUTPUT:
;   Key-pickup draw HMMM commands applied to VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_copy_key_door_command_to_block, bitmap_launch_key_door_cmd.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_apply_key_pickup_visuals_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_key_target_page), a
    jp bitmap_apply_key_pickup_visuals_for_current_room

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_key_pickup_visuals_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw uncollected key-pickup metatiles for the current room onto the pending
;   hidden page before commit_room_flip publishes it.
;
; INPUT:
;   current_screen_index, bitmap_pending_display_page, bitmap_key_pickup_flags.
;
; OUTPUT:
;   Key-pickup draw HMMM commands applied to the hidden page.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_copy_key_door_command_to_block, bitmap_launch_key_door_cmd.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_apply_key_pickup_visuals_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_key_target_page), a
    jp bitmap_apply_key_pickup_visuals_for_current_room

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_key_pickup_visuals_for_current_room
; ------------------------------------------------------------
; PURPOSE:
;   Scan the current room's key-pickup visual records and draw the atlas
;   metatile of every UNCOLLECTED pickup onto the selected page. Collected
;   pickups (flag set) are skipped so they stay erased.
;
; INPUT:
;   current_screen_index, bitmap_key_target_page, bitmap_key_pickup_flags.
;
; OUTPUT:
;   Key-pickup draw HMMM commands applied to VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_copy_key_door_command_to_block, bitmap_launch_key_door_cmd,
;   vdp_write_register.
;
; SIDE EFFECTS:
;   Uses bitmap_key_cmd_block scratch (#C2C0) and restores VDP R#15 to S#0 at
;   the end of each launched command.
; ------------------------------------------------------------
bitmap_apply_key_pickup_visuals_for_current_room:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_visual_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_visual_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_pickup_visual_loop:
    push bc
    ld a, (hl)                     ; flagOffset
    inc hl
    push hl                        ; HL = drawCommand template
    ld l, a
    ld h, 0
    ld bc, bitmap_key_pickup_flags
    add hl, bc
    ld a, (hl)
    or a
    jp nz, .key_pickup_visual_skip
    pop hl
    push hl
    call bitmap_copy_key_door_command_to_block
    call bitmap_launch_key_door_cmd
.key_pickup_visual_skip:
    pop hl
    ld de, 30                      ; next record: skip remaining 15 draw + 15 erase bytes
    add hl, de
    pop bc
    djnz .key_pickup_visual_loop
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_apply_door_state_visible
; ------------------------------------------------------------
; PURPOSE:
;   Draw authored door metatiles (closed/open) for the current room onto the
;   currently visible SCREEN 5 page. Used after the synchronous boot load_room.
;
; INPUT:
;   current_screen_index, bitmap_displayed_page, bitmap_key_door_open_flags.
;
; OUTPUT:
;   Door visual HMMM commands applied to VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_apply_door_state_for_current_room.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_apply_door_state_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_key_target_page), a
    jp bitmap_apply_door_state_for_current_room

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_door_state_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw authored door metatiles (closed/open) for the current room onto the
;   pending hidden page before commit_room_flip publishes it.
;
; INPUT:
;   current_screen_index, bitmap_pending_display_page, bitmap_key_door_open_flags.
;
; OUTPUT:
;   Door visual HMMM commands applied to the hidden page.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_apply_door_state_for_current_room.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_apply_door_state_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_key_target_page), a
    jp bitmap_apply_door_state_for_current_room


; ------------------------------------------------------------
; FUNCTION: bitmap_apply_door_state_for_current_room
; ------------------------------------------------------------
; PURPOSE:
;   Scan the current room's visual-door records and copy either the closed or
;   open metatile from the shared atlas to the selected page. If a door has no
;   selected metatile for its current state, it is left as rendered by the room.
;
; INPUT:
;   current_screen_index, bitmap_key_target_page, bitmap_key_door_open_flags.
;
; OUTPUT:
;   Door metatile HMMM commands applied to VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_copy_key_door_command_to_block, bitmap_launch_key_door_cmd,
;   vdp_write_register.
;
; SIDE EFFECTS:
;   Uses bitmap_key_cmd_block scratch (#C2C0) and restores VDP R#15 to S#0 at
;   the end of each launched command.
; ------------------------------------------------------------
bitmap_apply_door_state_for_current_room:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_visual_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_visual_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_door_visual_loop:
    push bc
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a       ; visual flags: bit0 closed, bit1 open
    push hl                            ; recordStart = closed command template
    xor a
    ld (bitmap_key_work_mask), a       ; selection: 0 none, 1 closed, 2 open
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld a, (hl)
    or a
    jp z, .key_door_visual_choose_closed
    pop hl
    push hl
    dec hl
    ld a, (hl)                         ; original visual flags byte
    bit 1, a
    jp z, .key_door_visual_have_selection
    ld a, 2
    ld (bitmap_key_work_mask), a
    jp .key_door_visual_have_selection
.key_door_visual_choose_closed:
    pop hl
    push hl
    dec hl
    ld a, (hl)                         ; original visual flags byte
    bit 0, a
    jp z, .key_door_visual_have_selection
    ld a, 1
    ld (bitmap_key_work_mask), a
.key_door_visual_have_selection:
    ld a, (bitmap_key_work_mask)
    pop de                             ; DE = recordStart
    push de
    or a
    jp z, .key_door_visual_advance
    ld h, d
    ld l, e
    cp 2
    jp nz, .key_door_visual_copy
    ld de, 15
    add hl, de                         ; open command template
.key_door_visual_copy:
    call bitmap_copy_key_door_command_to_block
    call bitmap_launch_key_door_cmd
.key_door_visual_advance:
    pop hl                             ; HL = recordStart
    ld de, 30
    add hl, de                         ; next visual record
    pop bc
    djnz .key_door_visual_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_copy_key_door_command_to_block
; ------------------------------------------------------------
; PURPOSE:
;   Copy one 15-byte HMMM template to bitmap_key_cmd_block and patch DY high byte
;   for page 0/page 1.
;
; INPUT:
;   HL = pointer to 15-byte command template. bitmap_key_target_page = 0 or 1.
;
; OUTPUT:
;   bitmap_key_cmd_block contains the patched command.
;
; DESTROYS:
;   AF, B, DE, HL
;
; PRESERVES:
;   C, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes bitmap_key_cmd_block.
; ------------------------------------------------------------
bitmap_copy_key_door_command_to_block:
    ld de, bitmap_key_cmd_block
    ld b, 15
.key_copy_cmd_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .key_copy_cmd_loop
    ld a, (bitmap_key_target_page)
    or a
    ret z
    ld a, 1
    ld (bitmap_key_cmd_block + 7), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_launch_key_door_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launch the 15-byte V9938 command currently stored in bitmap_key_cmd_block.
;
; INPUT:
;   bitmap_key_cmd_block = complete HMMM command.
;
; OUTPUT:
;   Command submitted to the V9938.
;
; DESTROYS:
;   AF, B, E, HL
;
; PRESERVES:
;   C, D, IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, vdp_write_register.
;
; SIDE EFFECTS:
;   Writes VDP command registers through #9B. Restores R#15 to S#0 before return
;   because vdp_wait_cmd_ready leaves it selecting S#2.
; ------------------------------------------------------------
bitmap_launch_key_door_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_key_cmd_block
    ld b, 15
.key_launch_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .key_launch_cmd_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_probe_locked_door_solid
; ------------------------------------------------------------
; PURPOSE:
;   Dynamic collision overlay for locked SCREEN 5 doors. A closed door blocks
;   movement only when the player probe point is inside its visual rectangle,
;   the door has a required key mask, the matching inventory bit is missing,
;   and its open-once flag has not already been set.
;
; INPUT:
;   B = pixel X, C = pixel Y from bitmap_probe_solid.
;
; OUTPUT:
;   A = 1 and NZ when a closed locked door blocks this probe; A = 0 and Z when
;   no door blocks it.
;
; DESTROYS:
;   AF, DE, HL
;
; PRESERVES:
;   BC, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Uses bitmap_key_probe_x/y and bitmap_key_work_mask/offset scratch bytes.
; ------------------------------------------------------------
bitmap_probe_locked_door_solid:
    push bc
    ld a, b
    ld (bitmap_key_probe_x), a
    ld a, c
    ld (bitmap_key_probe_y), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    jp z, .door_probe_none
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.door_probe_loop:
    ld a, (hl)
    inc hl
    ld d, a                    ; door x
    ld a, (hl)
    inc hl
    ld e, a                    ; door y
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a ; door width
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a ; door height
    ld a, (bitmap_key_probe_x)
    cp d
    jp c, .door_probe_skip_rest
    ld c, d
    ld a, (bitmap_key_work_mask)
    add a, c
    ld c, a
    ld a, (bitmap_key_probe_x)
    cp c
    jp nc, .door_probe_skip_rest
    ld a, (bitmap_key_probe_y)
    cp e
    jp c, .door_probe_skip_rest
    ld c, e
    ld a, (bitmap_key_work_offset)
    add a, c
    ld c, a
    ld a, (bitmap_key_probe_y)
    cp c
    jp nc, .door_probe_skip_rest
    ; Inside the visual rectangle: parse the remaining fields.
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a ; required key mask
    inc hl                     ; target room
    inc hl                     ; target x
    inc hl                     ; target y
    ld a, (hl)
    inc hl
    ld d, a                    ; flags
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a ; door open flag offset
    bit 2, d
    jp nz, .door_probe_check_open_flag
    bit 1, d
    jp z, .door_probe_check_key
.door_probe_check_open_flag:
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld a, (hl)
    pop hl
    or a
    jp nz, .door_probe_not_blocked
    bit 2, d
    jp nz, .door_probe_blocked
.door_probe_check_key:
    ld a, (bitmap_key_work_mask)
    or a
    jp z, .door_probe_not_blocked
    ld d, a
    ld a, (bitmap_key_inventory)
    and d
    jp nz, .door_probe_not_blocked
.door_probe_blocked:
    pop bc
    ld a, 1
    or a
    ret
.door_probe_not_blocked:
    dec b
    jp nz, .door_probe_loop
    jp .door_probe_none
.door_probe_skip_rest:
    ld de, 6
    add hl, de
    dec b
    jp nz, .door_probe_loop
.door_probe_none:
    pop bc
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_check_key_pickups
; ------------------------------------------------------------
; PURPOSE:
;   Scan active-room key pickup records and set their inventory bit on overlap.
;
; INPUT:
;   current_screen_index, player_x/player_y, bitmap_key_pickup_* tables.
;
; OUTPUT:
;   bitmap_key_inventory and bitmap_key_pickup_flags updated.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_player_overlaps_16, bitmap_erase_key_pickup_visual.
;
; SIDE EFFECTS:
;   One byte per pickup is set to 1 after collection; pickups with an assigned
;   atlas metatile are erased on the displayed page (background restored).
; ------------------------------------------------------------
bitmap_check_key_pickups:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_pickup_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a
    ld a, (hl)
    inc hl
    ld e, a
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld bc, bitmap_key_pickup_flags
    add hl, bc
    ld a, (hl)
    or a
    jp nz, .key_pickup_next
    call bitmap_player_overlaps_16
    or a
    jp z, .key_pickup_next
    ld a, (bitmap_key_inventory)
    ld b, a
    ld a, (bitmap_key_work_mask)
    or b
    ld (bitmap_key_inventory), a
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld bc, bitmap_key_pickup_flags
    add hl, bc
    ld (hl), 1
    ; +1 on the HUD key counter (bitmap_key_count, 8-bit, saturating at 255).
    ld a, (bitmap_key_count)
    inc a
    jr z, .key_pickup_count_done   ; 255->0 wrap: stay clamped at 255
    ld (bitmap_key_count), a
.key_pickup_count_done:
    call bitmap_erase_key_pickup_visual
.key_pickup_next:
    pop hl
    pop bc
    djnz .key_pickup_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_erase_key_pickup_visual
; ------------------------------------------------------------
; PURPOSE:
;   Erase the just-collected key pickup's metatile on the displayed page by
;   restoring its background cell. The target visual record is found by matching
;   bitmap_key_work_offset (the collected pickup's flagOffset) against the
;   current room's pickup-visual table. No-op when the room has no pickups with
;   a metatile, or when the collected pickup has none.
;
; INPUT:
;   current_screen_index, bitmap_displayed_page, bitmap_key_work_offset = the
;   flagOffset of the pickup that was just collected.
;
; OUTPUT:
;   Erase HMMM/HMMV command applied to the displayed page VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_copy_key_door_command_to_block, bitmap_launch_key_door_cmd.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_erase_key_pickup_visual:
    ld a, (bitmap_displayed_page)
    ld (bitmap_key_target_page), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_visual_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_visual_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_pickup_erase_loop:
    ld a, (hl)                     ; visual record flagOffset
    ld c, a
    ld a, (bitmap_key_work_offset)
    cp c
    jp z, .key_pickup_erase_found
    ld de, 31
    add hl, de
    dec b
    jp nz, .key_pickup_erase_loop
    ret
.key_pickup_erase_found:
    inc hl                         ; skip flagOffset -> eraseCommand template
    ld de, 15
    add hl, de
    call bitmap_copy_key_door_command_to_block
    jp bitmap_launch_key_door_cmd


; ------------------------------------------------------------
; FUNCTION: bitmap_check_locked_doors
; ------------------------------------------------------------
; PURPOSE:
;   Scan active-room door records and queue a direct room transition on overlap
;   when the required key bit is present or the open-once flag was already set.
;
; INPUT:
;   current_screen_index, player_x/player_y, bitmap_key_door_* tables.
;
; OUTPUT:
;   May update bitmap_key_inventory, bitmap_key_door_open_flags,
;   bitmap_pending_room, bitmap_key_pending_entry_x/y and composition state.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_player_overlaps_16, start_key_door_transition.
;
; SIDE EFFECTS:
;   Starts asynchronous SCREEN 5 room composition; if consumeKey is set the key
;   bit is cleared before transition.
; ------------------------------------------------------------
bitmap_check_locked_doors:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_door_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a
    ld a, (hl)
    inc hl
    ld e, a
    inc hl                         ; skip door visual width
    inc hl                         ; skip door visual height
    call bitmap_player_overlaps_16
    or a
    jp z, .key_door_skip_rest
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a
    ld a, (hl)
    inc hl
    ld (bitmap_pending_room), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_pending_entry_x), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_pending_entry_y), a
    ld a, (hl)
    inc hl
    ld c, a                    ; C = flags
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a
    bit 1, c
    jp z, .key_door_check_key
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld a, (hl)
    pop hl
    or a
    jp nz, .key_door_open
.key_door_check_key:
    ld a, (bitmap_key_work_mask)
    or a
    jp z, .key_door_open
    ld b, a
    ld a, (bitmap_key_inventory)
    and b
    jp z, .key_door_done
    bit 0, c
    jp z, .key_door_mark_open
    ld a, b
    cpl
    ld b, a
    ld a, (bitmap_key_inventory)
    and b
    ld (bitmap_key_inventory), a
    ; Consuming the key also decrements the HUD key counter (floored at 0).
    ld a, (bitmap_key_count)
    or a
    jr z, .key_door_mark_open
    dec a
    ld (bitmap_key_count), a
.key_door_mark_open:
    bit 1, c
    jp z, .key_door_open
    push bc                        ; bitmap_apply_door_state_visible destroys BC;
                                   ; preserve C (door flags) for the bit 2 test below.
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld (hl), 1
    call bitmap_apply_door_state_visible    ; redraw the just-opened door on the visible page
    pop hl
    pop bc                         ; restore C = door flags
.key_door_open:
    bit 2, c
    jp nz, .key_door_done
    call start_key_door_transition
    pop bc
    ret
.key_door_skip_rest:
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
.key_door_done:
    pop bc
    dec b
    jp nz, .key_door_loop
    ret

; ------------------------------------------------------------
; FUNCTION: start_key_door_transition
; ------------------------------------------------------------
; PURPOSE:
;   Queue a direct transition to bitmap_pending_room using the target entry pixel
;   already stored in bitmap_key_pending_entry_x/y.
;
; INPUT:
;   bitmap_pending_room = destination room index.
;   bitmap_key_pending_entry_x/y = destination player coordinates.
;
; OUTPUT:
;   Carry SET when the transition is queued or already composing.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes bitmap_composition_state, bitmap_transition_dir,
;   bitmap_pending_display_page, bitmap_composition_block_ptr and
;   bitmap_composition_blocks_left. Direction #04 tells commit_room_flip to use
;   bitmap_key_pending_entry_x/y instead of an edge spawn.
; ------------------------------------------------------------
start_key_door_transition:
    ld a, (bitmap_composition_state)
    or a
    jp nz, .key_door_already_composing
    ld a, 4
    ld (bitmap_transition_dir), a
    ld a, (bitmap_displayed_page)
    or a
    jp z, .key_door_compose_page1
    xor a
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p0
    ld bc, bitmap_room_render_bank_table_p0
    jp .key_door_select_render_program
.key_door_compose_page1:
    ld a, 1
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p1
    ld bc, bitmap_room_render_bank_table_p1
.key_door_select_render_program:
    ld a, (bitmap_pending_room)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_block_bank), a
    call bitmap_room_select_data_bank_a
    pop hl
    ld (bitmap_composition_block_ptr), hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_blocks_left), a
    inc hl
    ld a, (hl)
    ld (bitmap_composition_blocks_left + 1), a
    ld a, 1
    ld (bitmap_composition_state), a
    call bitmap_room_restore_resident_banks

.key_door_already_composing:
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_gem_player_overlaps_16
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 gem cell.
;   (Gem-owned copy so the system does not depend on key/doors being
;   enabled.)
;
; INPUT:
;   D = gem X in pixels, E = gem Y in pixels.
;
; OUTPUT:
;   A = 1 and NZ when overlapping; A = 0 and Z when separated.
;
; DESTROYS: AF, B.  PRESERVES: C, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_gem_player_overlaps_16:
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .gem_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
    add a, 3
    cp b
    jp z, .gem_overlap_x_ok
    jp nc, .gem_overlap_no
.gem_overlap_x_ok:
    ld a, (player_y)
    add a, 31
    cp e
    jp c, .gem_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
    add a, 3
    cp b
    jp z, .gem_overlap_yes
    jp nc, .gem_overlap_no
.gem_overlap_yes:
    ld a, 1
    or a
    ret
.gem_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_gem_copy_cmd_to_block
; ------------------------------------------------------------
; PURPOSE:
;   Copy one 15-byte command template to bitmap_gem_cmd_block (#C2C0, the
;   scratch shared with HUD/key-door launches — all sequential in the main
;   loop) and patch the DY high byte for the target page.
;
; INPUT:
;   HL = pointer to 15-byte command template. bitmap_gem_target_page = 0/1.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_gem_copy_cmd_to_block:
    ld de, bitmap_gem_cmd_block
    ld b, 15
.gem_copy_cmd_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .gem_copy_cmd_loop
    ld a, (bitmap_gem_target_page)
    or a
    ret z
    ld a, 1
    ld (bitmap_gem_cmd_block + 7), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_gem_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launch the 15-byte V9938 command stored in bitmap_gem_cmd_block.
;   Restores R#15 to S#0 (vdp_wait_cmd_ready leaves it at S#2).
;
; DESTROYS: AF, B, E, HL.  PRESERVES: C, D, IX, IY.
; ------------------------------------------------------------
bitmap_gem_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_gem_cmd_block
    ld b, 15
.gem_launch_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .gem_launch_cmd_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_gem_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's gem record table.
;
; OUTPUT:
;   HL = first gem record, B = record count. Z set (and B=0) when empty.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_gem_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_gem_count_table
    add hl, de
    ld b, (hl)
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_gem_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, b
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_gems
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame collector_gems scan: on player overlap with an uncollected
;   gem, mark it collected, restore the background cell on the visible
;   page, bump the collectibles HUD counter and play the pickup blip.
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state,
;   player_x/player_y, bitmap_gem_flags.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_update_gems:
    ld a, (bitmap_composition_state)
    or a
    ret nz
    call bitmap_gem_room_table
    ret z
.gem_scan_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a
    ld a, (hl)
    inc hl
    ld e, a
    ld a, (hl)
    inc hl
    ld (bitmap_gem_work_offset), a
    push hl
    ld l, a
    ld h, 0
    ld bc, bitmap_gem_flags
    add hl, bc
    ld a, (hl)
    or a
    jp nz, .gem_scan_next
    call bitmap_gem_player_overlaps_16
    or a
    jp z, .gem_scan_next
    ; Collect: latch the flag so the gem never re-triggers.
    ld a, (bitmap_gem_work_offset)
    ld l, a
    ld h, 0
    ld bc, bitmap_gem_flags
    add hl, bc
    ld (hl), 1
    ; Erase the gem cell on the currently displayed page.
    pop hl
    push hl
    ld de, 15
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_gem_target_page), a
    call bitmap_gem_copy_cmd_to_block
    call bitmap_gem_launch_cmd
    ; +1 gem on the 'collectibles'-bound HUD counter (8-bit, saturating).
    ld a, (hud_linked_1_value)
    inc a
    jp z, .gem_counter_done
    ld (hud_linked_1_value), a
.gem_counter_done:
    call bitmap_sfx_gem
.gem_scan_next:
    pop hl
    ld de, 30
    add hl, de
    pop bc
    djnz .gem_scan_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_gems_visible / bitmap_apply_gems_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw every UNCOLLECTED gem of the current room onto the visible page
;   (boot load_room / dialogue-close repaint) or onto the pending hidden
;   page before commit_room_flip publishes it.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_apply_gems_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_gem_target_page), a
    jp bitmap_apply_gems_for_current_room

bitmap_apply_gems_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_gem_target_page), a
bitmap_apply_gems_for_current_room:
    call bitmap_gem_room_table
    ret z
.gem_draw_loop:
    push bc
    inc hl
    inc hl
    ld a, (hl)
    inc hl
    push hl
    ld l, a
    ld h, 0
    ld bc, bitmap_gem_flags
    add hl, bc
    ld a, (hl)
    pop hl
    or a
    jp nz, .gem_draw_skip
    push hl
    call bitmap_gem_copy_cmd_to_block
    call bitmap_gem_launch_cmd
    pop hl
.gem_draw_skip:
    ld de, 30
    add hl, de
    pop bc
    djnz .gem_draw_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sfx_gem
; ------------------------------------------------------------
; PURPOSE:
;   Gem pickup PSG blip (fire-and-forget register writes, no per-frame
;   engine). Same table as the SCREEN 4 collector_gems blip: high square
;   tone on channel A with a fast envelope decay; sets BOTH envelope
;   period bytes so repeated blips always sound identical.
;
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; SIDE EFFECTS: Writes PSG registers through ports #A0/#A1.
; ------------------------------------------------------------
bitmap_sfx_gem:
    ld hl, bitmap_sfx_gem_data
    ld b, 7
.gem_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .gem_sfx_loop
    ld a, #20               ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_sfx_gem_data:
    db 7,#3B,4,#1C,5,#00,11,#28,12,#00,10,#10,13,#09

; ------------------------------------------------------------
; FUNCTION: bitmap_jumper_copy_cmd_to_block
; ------------------------------------------------------------
; PURPOSE:
;   Copy one 15-byte command template to bitmap_jumper_cmd_block (#C2C0,
;   the scratch shared with HUD/key-door/gem launches — all sequential in
;   the main loop) and patch the DY high byte for the target page.
;
; INPUT:
;   HL = pointer to 15-byte command template. bitmap_jumper_target_page = 0/1.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_jumper_copy_cmd_to_block:
    ld de, bitmap_jumper_cmd_block
    ld b, 15
.jumper_copy_cmd_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .jumper_copy_cmd_loop
    ld a, (bitmap_jumper_target_page)
    or a
    ret z
    ld a, 1
    ld (bitmap_jumper_cmd_block + 7), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_jumper_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launch the 15-byte V9938 command stored in bitmap_jumper_cmd_block.
;   Restores R#15 to S#0 (vdp_wait_cmd_ready leaves it at S#2).
;
; DESTROYS: AF, B, E, HL.  PRESERVES: C, D, IX, IY.
; ------------------------------------------------------------
bitmap_jumper_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_jumper_cmd_block
    ld b, 15
.jumper_launch_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .jumper_launch_cmd_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_jumper_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's jumper record table.
;
; OUTPUT:
;   HL = first jumper record, B = record count. Z set (and B=0) when empty.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_jumper_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_jumper_count_table
    add hl, de
    ld b, (hl)
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_jumper_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, b
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_jumper_restore_active_idle
; ------------------------------------------------------------
; PURPOSE:
;   Redraw the idle frame of the last-fired spring on the displayed page and
;   clear the revert timer. No-op when no spring has fired yet.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_jumper_restore_active_idle:
    xor a
    ld (bitmap_jumper_timer), a
    ld hl, (bitmap_jumper_active)
    ld a, h
    or l
    ret z
    ld de, 3                    ; record+3 = idle command
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_jumper_target_page), a
    call bitmap_jumper_copy_cmd_to_block
    jp bitmap_jumper_launch_cmd

; ------------------------------------------------------------
; FUNCTION: bitmap_update_jumpers
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame spring runtime: count down the triggered-frame revert timer,
;   and when the grounded player's feet rest on a spring cell, launch the
;   player upward (record impulse -> player_vy), swap the cell to the
;   triggered metatile and arm the revert timer.
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state,
;   player_x/player_y/player_flags, bitmap_jumper_timer/active.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_update_jumpers:
    ld a, (bitmap_composition_state)
    or a
    ret nz
    ; The game A button is SPACE (keyboard row 8, bit 0). Read it here,
    ; immediately before the stand-on test, so the boost applies only when
    ; the player collides with the floor jumper on this frame.
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    ld (bitmap_jumper_space_pressed), a
    ; Revert timer: when it expires, restore the idle frame of the spring
    ; that fired (the player is usually airborne while this counts down).
    ld a, (bitmap_jumper_timer)
    or a
    jp z, .jumper_timer_done
    dec a
    ld (bitmap_jumper_timer), a
    jp nz, .jumper_timer_done
    call bitmap_jumper_restore_active_idle
.jumper_timer_done:
    ; Only a grounded player can stand on a spring.
    ld a, (player_flags)
    and #01
    ret z
    call bitmap_jumper_room_table
    ret z
.jumper_scan_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a                     ; D = spring X (cell-aligned)
    ld a, (hl)
    inc hl
    ld e, a                     ; E = spring Y (cell-aligned)
    ; Feet row: the pixel row right below the body box must fall inside the
    ; spring's 16 px cell row.
    ld a, (player_y)
    add a, 32
    and #F0
    cp e
    jp nz, .jumper_scan_next
    ; Horizontal overlap between the body box and the spring cell.
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .jumper_scan_next
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
    add a, 3
    cp b
    jp z, .jumper_fire
    jp nc, .jumper_scan_next
.jumper_fire:
    dec hl
    dec hl                      ; HL = record start
    ; Another spring still showing its triggered frame? Restore it first so
    ; it does not stay compressed forever.
    ld a, (bitmap_jumper_timer)
    or a
    jp z, .jumper_no_pending
    push hl
    call bitmap_jumper_restore_active_idle
    pop hl
.jumper_no_pending:
    ld (bitmap_jumper_active), hl
    ; Launch: same contract as the jump block (integer vy + clean fraction).
    ; SPACE/A boosts the configured impulse to 150% (8 -> 12). The record
    ; stores the negative base impulse, so calculate the positive magnitude,
    ; add half of it, then convert it back to a signed negative byte.
    inc hl
    inc hl
    ld a, (bitmap_jumper_space_pressed)
    or a
    jp z, .jumper_store_base_impulse
    ld a, (hl)                  ; impulse byte = -(impulsePx)
    cpl
    inc a                       ; A = impulsePx
    ld e, a
    srl a                       ; A = floor(impulsePx / 2)
    add a, e                    ; A = floor(impulsePx * 1.5)
    cpl
    inc a                       ; A = -floor(impulsePx * 1.5)
    jp .jumper_store_impulse
.jumper_store_base_impulse:
    ld a, (hl)                  ; impulse byte = -(impulsePx)
.jumper_store_impulse:
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a
    ld a, (player_flags)
    and #FE                     ; the player leaves the ground
    ld (player_flags), a
    ; Show the triggered frame on the displayed page and arm the revert timer.
    ld hl, (bitmap_jumper_active)
    ld de, 18                   ; record+3+15 = triggered command
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_jumper_target_page), a
    call bitmap_jumper_copy_cmd_to_block
    call bitmap_jumper_launch_cmd
    ld a, 12
    ld (bitmap_jumper_timer), a
    pop bc
    ret                         ; airborne now: at most one spring fires per frame
.jumper_scan_next:
    inc hl                      ; skip impulse byte
    ld de, 30
    add hl, de                  ; skip idle+triggered commands
    pop bc
    ; The scan body is too large for DJNZ's +/-126-byte relative range.
    dec b
    jp nz, .jumper_scan_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_jumpers_visible / bitmap_apply_jumpers_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw every spring of the current room in its IDLE frame onto the visible
;   page (boot load_room / dialogue-close repaint) or onto the pending hidden
;   page before commit_room_flip publishes it. Entering or repainting a room
;   also resets the revert timer + active pointer, so a spring fired in the
;   previous room can never redraw its command over the new room's bitmap.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_apply_jumpers_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_jumper_target_page), a
    jp bitmap_apply_jumpers_for_current_room

bitmap_apply_jumpers_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_jumper_target_page), a
bitmap_apply_jumpers_for_current_room:
    xor a
    ld (bitmap_jumper_timer), a
    ld (bitmap_jumper_active), a
    ld (bitmap_jumper_active + 1), a
    call bitmap_jumper_room_table
    ret z
.jumper_draw_loop:
    push bc
    push hl
    ld de, 3                    ; record+3 = idle command
    add hl, de
    call bitmap_jumper_copy_cmd_to_block
    call bitmap_jumper_launch_cmd
    pop hl
    ld de, 33
    add hl, de
    pop bc
    djnz .jumper_draw_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_walljumper_copy_cmd_to_block
; ------------------------------------------------------------
; PURPOSE:
;   Copy one 15-byte command template to bitmap_walljumper_cmd_block (#C2C0,
;   scratch shared with HUD/key-door/gem/jumper launches — all sequential in
;   the main loop) and patch the DY high byte for the target page.
;
; INPUT:
;   HL = pointer to 15-byte command template. bitmap_walljumper_target_page = 0/1.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_walljumper_copy_cmd_to_block:
    ld de, bitmap_walljumper_cmd_block
    ld b, 15
.walljumper_copy_cmd_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .walljumper_copy_cmd_loop
    ld a, (bitmap_walljumper_target_page)
    or a
    ret z
    ld a, 1
    ld (bitmap_walljumper_cmd_block + 7), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_walljumper_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launch the 15-byte V9938 command stored in bitmap_walljumper_cmd_block.
;   Restores R#15 to S#0 (vdp_wait_cmd_ready leaves it at S#2).
;
; DESTROYS: AF, B, E, HL.  PRESERVES: C, D, IX, IY.
; ------------------------------------------------------------
bitmap_walljumper_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_walljumper_cmd_block
    ld b, 15
.walljumper_launch_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .walljumper_launch_cmd_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_walljumper_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's wall-jumper record table.
;
; OUTPUT:
;   HL = first wall-jumper record, B = record count. Z set (and B=0) when empty.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_walljumper_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_walljumper_count_table
    add hl, de
    ld b, (hl)
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_walljumper_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, b
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_walljumper_restore_active_idle
; ------------------------------------------------------------
; PURPOSE:
;   Redraw the idle frame of the last-fired wall-spring on the displayed page
;   and clear the revert timer. No-op when none has fired yet.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_walljumper_restore_active_idle:
    xor a
    ld (bitmap_walljumper_timer), a
    ld hl, (bitmap_walljumper_active)
    ld a, h
    or l
    ret z
    ld de, 4                    ; record+4 = idle command (x,y,impulseByte,directionByte)
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_walljumper_target_page), a
    call bitmap_walljumper_copy_cmd_to_block
    jp bitmap_walljumper_launch_cmd

; ------------------------------------------------------------
; FUNCTION: bitmap_update_walljumpers
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame wall-spring runtime: count down the triggered-frame revert timer,
;   and when the player's body box touches a wall-spring's open side, launch the
;   player horizontally (record impulse -> player_vx) and swap the cell to the
;   triggered metatile for BITMAP_JUMPER_TRIGGERED_FRAMES.
;
;   No grounded gate: a wall-spring fires on side contact (the player walks/jumps
;   into it). Direction 'right' (directionByte=1) fires when the player's right
;   edge touches the spring's left column; 'left' (directionByte=0) fires when
;   the player's left edge touches the spring's right column. In both cases the
;   body box must overlap the spring's 16px row band vertically.
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state,
;   player_x/player_y/player_vx, bitmap_walljumper_timer/active.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_update_walljumpers:
    ld a, (bitmap_composition_state)
    or a
    ret nz
    ; Revert timer: when it expires, restore the idle frame of the wall-spring
    ; that fired (the player is usually away while this counts down).
    ld a, (bitmap_walljumper_timer)
    or a
    jp z, .walljumper_timer_done
    dec a
    ld (bitmap_walljumper_timer), a
    jp nz, .walljumper_timer_done
    call bitmap_walljumper_restore_active_idle
.walljumper_timer_done:
    call bitmap_walljumper_room_table
    ret z
.walljumper_scan_loop:
    push bc                     ; B = remaining record count
    ; HL = record start. Read the 4-byte header WITHOUT advancing HL so the
    ; restore/draw offsets (record+4 idle, record+19 triggered) stay valid and
    ; the next-record skip is a single constant.
    ld d, (hl)                  ; D = spring X (cell-aligned)
    inc hl
    ld e, (hl)                  ; E = spring Y (cell-aligned)
    inc hl
    ld b, (hl)                  ; B = impulse byte (signed, direction baked in)
    inc hl
    ld a, (hl)                  ; direction byte (0=left, 1=right)
    inc hl                      ; HL now points at record+4 (idle command)
    or a
    jp z, .walljumper_probe_left
.walljumper_probe_right:
    ; direction 'right': the spring THROWS the player RIGHT, so the player must be
    ; touching the spring's RIGHT face (the spring is solid, so the player is
    ; stopped just outside the cell on its right side, having approached from the
    ; open space on the right). Probe the body's LEFT edge in [springX+15, springX+16]:
    ; that is where bitmap_try_move_x parks the player when walking left into the cell.
    ld a, d
    add a, 15
    ld c, a                     ; C = springX + 15 (inclusive lower bound)
    ld a, (player_x)
    add a, 3
    cp c
    jp c, .walljumper_scan_next          ; player left edge left of springX+15 -> not touching right face
    ld a, d
    add a, 17
    ld c, a                     ; C = springX + 17 (exclusive upper bound: contact if < springX+17, i.e. <= springX+16)
    ld a, (player_x)
    add a, 3
    cp c
    jp nc, .walljumper_scan_next         ; player left edge beyond springX+16 -> passed through
    jp .walljumper_check_vertical
.walljumper_probe_left:
    ; direction 'left': the spring THROWS the player LEFT, so the player must be
    ; touching the spring's LEFT face (approached from the open space on the left).
    ; Probe the body's RIGHT edge in [springX-1, springX]: where bitmap_try_move_x
    ; parks the player when walking right into the cell.
    ld a, d
    dec a
    ld c, a                     ; C = springX - 1 (inclusive lower bound)
    ld a, (player_x)
    add a, 11
    cp c
    jp c, .walljumper_scan_next          ; player right edge left of springX-1 -> not touching left face
    ld a, d
    inc a
    ld c, a                     ; C = springX + 1 (exclusive upper bound: contact if < springX+1, i.e. <= springX)
    ld a, (player_x)
    add a, 11
    cp c
    jp nc, .walljumper_scan_next         ; player right edge past springX -> passed through
.walljumper_check_vertical:
    ; Vertical overlap: body top must be < springY+16 and body bottom >= springY.
    ld a, e
    add a, 16
    ld c, a                     ; C = springY + 16 (exclusive upper bound)
    ld a, (player_y)
    add a, 3
    cp c
    jp nc, .walljumper_scan_next         ; body top at/ below springY+16 -> no vertical overlap
    ld a, e
    ld c, a                     ; C = springY (inclusive lower bound)
    ld a, (player_y)
    add a, 31
    cp c
    jp c, .walljumper_scan_next          ; body bottom above springY -> no vertical overlap
.walljumper_fire:
    ; HL points at record+4 (idle command). Rewind to record start so the active
    ; pointer and the restore/draw offsets all line up.
    dec hl                      ; record+3 (direction byte)
    dec hl                      ; record+2 (impulse byte)
    dec hl                      ; record+1 (y)
    dec hl                      ; record+0 (x) = record start
    ; Another wall-spring still showing its triggered frame? Restore it first.
    ld a, (bitmap_walljumper_timer)
    or a
    jp z, .walljumper_no_pending
    push hl
    push bc
    call bitmap_walljumper_restore_active_idle
    pop bc
    pop hl
.walljumper_no_pending:
    ld (bitmap_walljumper_active), hl
    ; Launch horizontally: write the signed impulse byte to player_vx. Gravity
    ; (applied unconditionally in update_player_movement) bends the launch into
    ; an arc; no grounded/vy changes are needed.
    ld a, b                     ; B = saved impulse byte
    ld (player_vx), a
    ; Show the triggered frame on the displayed page and arm the revert timer.
    ld hl, (bitmap_walljumper_active)
    ld de, 19                   ; record+4+15 = triggered command
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_walljumper_target_page), a
    call bitmap_walljumper_copy_cmd_to_block
    call bitmap_walljumper_launch_cmd
    ld a, 12
    ld (bitmap_walljumper_timer), a
    pop bc
    ret                         ; at most one wall-spring fires per frame
.walljumper_scan_next:
    ; HL points at record+4. Skip the idle+triggered commands (30 bytes) to reach
    ; the next record. (dec/jp nz instead of djnz: the scan body is >126 bytes,
    ; out of djnz's short branch range.)
    ld de, 30
    add hl, de
    pop bc
    dec b
    jp nz, .walljumper_scan_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_walljumpers_visible / bitmap_apply_walljumpers_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw every wall-spring of the current room in its IDLE frame onto the visible
;   page (boot load_room / dialogue-close repaint) or onto the pending hidden
;   page before commit_room_flip publishes it. Entering or repainting a room also
;   resets the revert timer + active pointer + player_vx, so a wall-spring fired
;   in the previous room can never redraw its command over the new room's bitmap
;   and no horizontal impulse carries across rooms.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_apply_walljumpers_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_walljumper_target_page), a
    jp bitmap_apply_walljumpers_for_current_room

bitmap_apply_walljumpers_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_walljumper_target_page), a
bitmap_apply_walljumpers_for_current_room:
    xor a
    ld (bitmap_walljumper_timer), a
    ld (bitmap_walljumper_active), a
    ld (bitmap_walljumper_active + 1), a
    ld (player_vx), a           ; no horizontal impulse carried into a room
    call bitmap_walljumper_room_table
    ret z
.walljumper_draw_loop:
    push bc
    push hl
    ld de, 4                    ; record+4 = idle command
    add hl, de
    call bitmap_walljumper_copy_cmd_to_block
    call bitmap_walljumper_launch_cmd
    pop hl
    ld de, 34
    add hl, de
    pop bc
    djnz .walljumper_draw_loop
    ret


; ------------------------------------------------------------
; FUNCTION: upload_bitmap_dialogue_gfx
; ------------------------------------------------------------
; PURPOSE:
;   Upload the dialogue glyph strips + portrait frame pairs (packed 4bpp RLE)
;   to offscreen VRAM rows 864..1015, once at boot after the atlas.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
upload_bitmap_dialogue_gfx:
    ld a, bitmap_dlg_gfx_rle_chunk_0_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_dlg_gfx_rle_chunk_0
    ld a, 6
    ld de, #3000
    ld bc, bitmap_dlg_gfx_rle_chunk_0_end - bitmap_dlg_gfx_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_dlg_gfx_rle_chunk_1_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_dlg_gfx_rle_chunk_1
    ld a, 7
    ld de, #0000
    ld bc, bitmap_dlg_gfx_rle_chunk_1_end - bitmap_dlg_gfx_rle_chunk_1
    call decompress_bitmap_rle_to_vram
    call bitmap_room_restore_resident_banks
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dialogue_frame
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame NPC dialogue driver, called before update_player_movement.
;   Idle: scans the current room's NPC records; player-overlap + talk key
;   opens the dialogue. Active: runs the typewriter (state 1) or the
;   line-advance wait (state 2). All VDP work targets the DISPLAYED page.
;
; OUTPUT:
;   Carry SET while a dialogue owns the frame (player update paused);
;   carry CLEAR when the game runs normally.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; SIDE EFFECTS:
;   Uses bitmap_dlg_cmd_block scratch (#C2C0, shared serialized scratch) and
;   restores VDP R#15 to S#0 before returning from any active state.
; ------------------------------------------------------------
bitmap_dialogue_frame:
    call bitmap_dlg_read_keys
    ld c, a
    ; Release the talk latch only when BOTH talk keys (UP + SPACE) are up, so
    ; a held key cannot re-trigger, skip a line or leak a jump on close.
    ld a, (bitmap_dlg_lock)
    or a
    jp z, .dlg_lock_ok
    ld a, c
    and #21
    jp nz, .dlg_lock_ok
    xor a
    ld (bitmap_dlg_lock), a
.dlg_lock_ok:
    ld a, (bitmap_dlg_state)
    or a
    jp z, .dlg_idle
    cp 1
    jp z, .dlg_typing
    jp .dlg_wait_advance

.dlg_idle:
    ld a, (bitmap_dlg_lock)
    or a
    jp nz, .dlg_idle_no
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_dlg_npc_count_table
    add hl, de
    ld a, (hl)
    or a
    jp z, .dlg_idle_no
    ld b, a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_dlg_npc_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.dlg_scan_loop:
    push bc
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl
    ld a, (hl)
    inc hl
    ld (bitmap_dlg_scratch_idx), a
    ld a, (hl)
    inc hl
    ld (bitmap_dlg_key_mask), a
    and c
    jp z, .dlg_scan_next
    push hl
    call bitmap_dlg_overlaps
    pop hl
    or a
    jp z, .dlg_scan_next
    pop bc
    ld a, 1
    ld (bitmap_dlg_lock), a
    ld a, (bitmap_dlg_scratch_idx)
    call bitmap_dlg_open
    jp .dlg_consume
.dlg_scan_next:
    pop bc
    djnz .dlg_scan_loop
.dlg_idle_no:
    or a
    ret

.dlg_typing:
    ; Fast-forward: a fresh talk-key press while typing completes the line now.
    ld a, (bitmap_dlg_lock)
    or a
    jp nz, .dlg_no_ff
    ld a, (bitmap_dlg_key_mask)
    and c
    jp z, .dlg_no_ff
    ld a, 1
    ld (bitmap_dlg_lock), a
.dlg_ff_loop:
    call bitmap_dlg_emit_char
    jp nc, .dlg_ff_loop
    jp .dlg_line_finished
.dlg_no_ff:
    ld a, (bitmap_dlg_delay)
    or a
    jp z, .dlg_tick
    dec a
    ld (bitmap_dlg_delay), a
    jp .dlg_consume
.dlg_tick:
    call bitmap_dlg_emit_char
    jp c, .dlg_line_finished
    ld a, (bitmap_dlg_cfg_delay)
    ld (bitmap_dlg_delay), a
    jp .dlg_consume
.dlg_line_finished:
    ; Always finish a line with the mouth closed.
    ld a, (bitmap_dlg_mouth_state)
    or a
    jp z, .dlg_mouth_closed
    xor a
    ld (bitmap_dlg_mouth_state), a
    call bitmap_dlg_draw_portrait_frame
.dlg_mouth_closed:
    ld a, 2
    ld (bitmap_dlg_state), a
    jp .dlg_consume

.dlg_wait_advance:
    ld a, (bitmap_dlg_wait_flags)
    bit 0, a
    jp z, .dlg_do_advance       ; waitForInput=false: auto-advance
    ld a, (bitmap_dlg_lock)
    or a
    jp nz, .dlg_consume
    ld a, (bitmap_dlg_key_mask)
    and c
    jp z, .dlg_consume
    ld a, 1
    ld (bitmap_dlg_lock), a
.dlg_do_advance:
    ld a, (bitmap_dlg_lines_left)
    dec a
    ld (bitmap_dlg_lines_left), a
    or a
    jp z, .dlg_close
    ld a, (bitmap_dlg_line)
    inc a
    call bitmap_dlg_start_line
    jp .dlg_consume
.dlg_close:
    call bitmap_dlg_close_box
.dlg_consume:
    ; Command-engine polls left R#15 at S#2; the main loop's vblank wait
    ; assumes S#0 (same contract as load_room).
    ld a, #0F
    ld e, #00
    call vdp_write_register
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_read_keys
; ------------------------------------------------------------
; PURPOSE: Read PPI keyboard row 8. A = pressed mask (UP=#20, SPACE=#01).
; DESTROYS: AF
; ------------------------------------------------------------
bitmap_dlg_read_keys:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_overlaps
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 NPC cell.
;   Self-contained copy of the key/door overlap test (that routine is only
;   emitted when pickups/doors exist).
; INPUT:  D = NPC X in pixels, E = NPC Y in pixels.
; OUTPUT: A = 1 and NZ when overlapping; A = 0 and Z when separated.
; DESTROYS: AF, B
; PRESERVES: C, DE, HL, IX, IY
; ------------------------------------------------------------
bitmap_dlg_overlaps:
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .dlg_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
    add a, 3
    cp b
    jp z, .dlg_overlap_x_ok
    jp nc, .dlg_overlap_no
.dlg_overlap_x_ok:
    ld a, (player_y)
    add a, 31
    cp e
    jp c, .dlg_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
    add a, 3
    cp b
    jp z, .dlg_overlap_yes
    jp nc, .dlg_overlap_no
.dlg_overlap_yes:
    ld a, 1
    or a
    ret
.dlg_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_open
; ------------------------------------------------------------
; PURPOSE:
;   Open dialogue A: LDIR its 20-byte config record into RAM, draw the box
;   (border + interior HMMV fills) and start its first line.
; INPUT: A = dialogue index.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_open:
    ld l, a
    ld h, 0
    add hl, hl
    ld de, bitmap_dlg_cfg_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_dlg_cfg
    ld bc, 20
    ldir
    call bitmap_dlg_draw_box
    ld a, (bitmap_dlg_cfg_line_count)
    ld (bitmap_dlg_lines_left), a
    ld a, (bitmap_dlg_cfg_line_base)
    jp bitmap_dlg_start_line

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_start_line
; ------------------------------------------------------------
; PURPOSE:
;   Begin global line A: load its record (text pointer, flags, portrait),
;   clear the text area, redraw the portrait mouth-closed, reset the cursor
;   and switch to the typing state.
; INPUT: A = global line index.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_start_line:
    ld (bitmap_dlg_line), a
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, bitmap_dlg_line_records
    add hl, de
    ld a, (hl)
    ld (bitmap_dlg_text_ptr), a
    inc hl
    ld a, (hl)
    ld (bitmap_dlg_text_ptr + 1), a
    inc hl
    ld a, (hl)
    ld (bitmap_dlg_wait_flags), a
    inc hl
    ld a, (hl)
    ld (bitmap_dlg_portrait), a
    ; Clear the text area to the box background.
    ld a, (bitmap_dlg_cfg_text_x)
    ld d, a
    ld a, (bitmap_dlg_cfg_text_y)
    ld e, a
    ld a, (bitmap_dlg_cfg_text_w)
    ld c, a
    ld a, (bitmap_dlg_cfg_text_h)
    ld b, a
    ld a, (bitmap_dlg_cfg_bg_clr)
    call bitmap_dlg_fill_rect
    ; Portrait: clear its max area, then draw this line's closed frame.
    ld a, (bitmap_dlg_portrait)
    cp #FF
    jp z, .dlg_start_no_portrait
    ld a, (bitmap_dlg_cfg_por_max_w)
    or a
    jp z, .dlg_start_no_portrait
    ld c, a
    ld a, (bitmap_dlg_cfg_por_max_h)
    ld b, a
    ld a, (bitmap_dlg_cfg_por_x)
    ld d, a
    ld a, (bitmap_dlg_cfg_por_y)
    ld e, a
    ld a, (bitmap_dlg_cfg_bg_clr)
    call bitmap_dlg_fill_rect
    xor a
    ld (bitmap_dlg_mouth_state), a
    call bitmap_dlg_draw_portrait_frame
.dlg_start_no_portrait:
    ld a, (bitmap_dlg_cfg_text_x)
    ld (bitmap_dlg_cursor_x), a
    ld a, (bitmap_dlg_cfg_text_y)
    ld (bitmap_dlg_cursor_y), a
    xor a
    ld (bitmap_dlg_mouth_count), a
    ld (bitmap_dlg_delay), a
    ld a, 1
    ld (bitmap_dlg_state), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_emit_char
; ------------------------------------------------------------
; PURPOSE:
;   Typewriter step: read the next text byte. Glyph -> one 8x8 HMMM from the
;   glyph strip to the cursor (+ mouth cadence); #FE -> newline; #FF -> end.
; OUTPUT: carry SET when the line just ended, carry CLEAR otherwise.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_emit_char:
    ld hl, (bitmap_dlg_text_ptr)
    ld a, (hl)
    cp 255
    jp z, .dlg_char_end
    inc hl
    ld (bitmap_dlg_text_ptr), hl
    cp 254
    jp z, .dlg_char_newline
    ld c, a                       ; C = glyph index
    ; SX = (idx & 31) * 8
    and #1F
    add a, a
    add a, a
    add a, a
    ld (bitmap_dlg_cmd_block + 0), a
    xor a
    ld (bitmap_dlg_cmd_block + 1), a
    ; SY = strip base + ((idx >> 5) * 8) = strip base + ((idx & #E0) >> 2)
    ld a, c
    and #E0
    rrca
    rrca
    ld e, a
    ld d, 0
    ld hl, (bitmap_dlg_cfg_strip_sy)
    add hl, de
    ld a, l
    ld (bitmap_dlg_cmd_block + 2), a
    ld a, h
    ld (bitmap_dlg_cmd_block + 3), a
    ld a, (bitmap_dlg_cursor_x)
    ld (bitmap_dlg_cmd_block + 4), a
    xor a
    ld (bitmap_dlg_cmd_block + 5), a
    ld a, (bitmap_dlg_cursor_y)
    ld (bitmap_dlg_cmd_block + 6), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_dlg_cmd_block + 7), a
    ld a, 8
    ld (bitmap_dlg_cmd_block + 8), a
    ld (bitmap_dlg_cmd_block + 10), a
    xor a
    ld (bitmap_dlg_cmd_block + 9), a
    ld (bitmap_dlg_cmd_block + 11), a
    ld (bitmap_dlg_cmd_block + 12), a
    ld (bitmap_dlg_cmd_block + 13), a
    ld a, #D0                     ; HMMM
    ld (bitmap_dlg_cmd_block + 14), a
    call bitmap_dlg_launch_cmd
    ld a, (bitmap_dlg_cursor_x)
    add a, 8
    ld (bitmap_dlg_cursor_x), a
    ; Mouth cadence: toggle every cfg_mouth_int typed characters.
    ld a, (bitmap_dlg_cfg_mouth_int)
    or a
    jp z, .dlg_char_done
    ld a, (bitmap_dlg_mouth_count)
    inc a
    ld (bitmap_dlg_mouth_count), a
    ld hl, bitmap_dlg_cfg_mouth_int
    cp (hl)
    jp c, .dlg_char_done
    xor a
    ld (bitmap_dlg_mouth_count), a
    ld a, (bitmap_dlg_portrait)
    cp #FF
    jp z, .dlg_char_done
    ld a, (bitmap_dlg_mouth_state)
    xor 1
    ld (bitmap_dlg_mouth_state), a
    or a
    jp z, .dlg_mouth_closed_sfx
    call bitmap_dlg_sfx_open
    jp .dlg_mouth_sfx_done
.dlg_mouth_closed_sfx:
    call bitmap_dlg_sfx_close
.dlg_mouth_sfx_done:
    call bitmap_dlg_draw_portrait_frame
.dlg_char_done:
    or a
    ret
.dlg_char_newline:
    ld a, (bitmap_dlg_cfg_text_x)
    ld (bitmap_dlg_cursor_x), a
    ld a, (bitmap_dlg_cursor_y)
    add a, 8
    ld (bitmap_dlg_cursor_y), a
    or a
    ret
.dlg_char_end:
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_sfx_open
; ------------------------------------------------------------
; PURPOSE:
;   Pick one of four mouth-open PSG talking blips using a tiny local pseudo-RNG.
;
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; SIDE EFFECTS: Updates bitmap_dlg_sfx_seed and writes PSG ports #A0/#A1.
; ------------------------------------------------------------
bitmap_dlg_sfx_open:
    call bitmap_dlg_random_byte
    and #03
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_dlg_sfx_open_ptrs
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    jp bitmap_dlg_sfx_write

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_sfx_close
; ------------------------------------------------------------
; PURPOSE:
;   Play the mouth-closed PSG talking blip, lower and shorter than open blips.
;
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; SIDE EFFECTS: Writes PSG registers through ports #A0/#A1.
; ------------------------------------------------------------
bitmap_dlg_sfx_close:
    ld hl, bitmap_dlg_sfx_close_data
    jp bitmap_dlg_sfx_write

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_random_byte
; ------------------------------------------------------------
; PURPOSE:
;   Advance the dialogue-local pseudo-RNG used for talk blip variation.
;
; INPUT: bitmap_dlg_sfx_seed.
; OUTPUT: A = pseudo-random byte.
; DESTROYS: AF, HL.  PRESERVES: BC, DE, IX, IY.
; SIDE EFFECTS: Updates bitmap_dlg_sfx_seed.
; ------------------------------------------------------------
bitmap_dlg_random_byte:
    ld hl, bitmap_dlg_sfx_seed
    ld a, (hl)
    add a, 37
    xor #A7
    ld (hl), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_sfx_write
; ------------------------------------------------------------
; PURPOSE:
;   Fire-and-forget PSG register table writer for dialogue blips.
;
; INPUT: HL = register/value pair table with 7 pairs.
; OUTPUT: None.
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; SIDE EFFECTS: Writes PSG registers through ports #A0/#A1.
; ------------------------------------------------------------
bitmap_dlg_sfx_write:
    ld b, 7
.dlg_sfx_write_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .dlg_sfx_write_loop
    ld a, #20               ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_dlg_sfx_open_ptrs:
    DW bitmap_dlg_sfx_open_0, bitmap_dlg_sfx_open_1, bitmap_dlg_sfx_open_2, bitmap_dlg_sfx_open_3
bitmap_dlg_sfx_open_0:
    db 7,#3B,4,#FE,5,#00,10,#10,11,#80,12,#01,13,#09
bitmap_dlg_sfx_open_1:
    db 7,#3B,4,#E2,5,#00,10,#10,11,#70,12,#01,13,#09
bitmap_dlg_sfx_open_2:
    db 7,#3B,4,#D6,5,#00,10,#10,11,#60,12,#01,13,#09
bitmap_dlg_sfx_open_3:
    db 7,#3B,4,#BE,5,#00,10,#10,11,#50,12,#01,13,#09
bitmap_dlg_sfx_close_data:
    db 7,#3B,4,#1D,5,#01,10,#10,11,#30,12,#01,13,#09

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_draw_portrait_frame
; ------------------------------------------------------------
; PURPOSE:
;   HMMM the current portrait's frame (bitmap_dlg_mouth_state: 0 = closed at
;   SX=0, 1 = open at SX=width) to the box's portrait slot on the displayed page.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_draw_portrait_frame:
    ld a, (bitmap_dlg_portrait)
    cp #FF
    ret z
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, bitmap_dlg_portrait_records
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld c, (hl)                    ; C = width
    inc hl
    ld b, (hl)                    ; B = height
    ld a, (bitmap_dlg_mouth_state)
    or a
    jp z, .dlg_por_closed
    ld a, c                       ; open frame lives at SX = width
    jp .dlg_por_have_sx
.dlg_por_closed:
    xor a
.dlg_por_have_sx:
    ld (bitmap_dlg_cmd_block + 0), a
    xor a
    ld (bitmap_dlg_cmd_block + 1), a
    ld a, e
    ld (bitmap_dlg_cmd_block + 2), a
    ld a, d
    ld (bitmap_dlg_cmd_block + 3), a
    ld a, (bitmap_dlg_cfg_por_x)
    ld (bitmap_dlg_cmd_block + 4), a
    xor a
    ld (bitmap_dlg_cmd_block + 5), a
    ld a, (bitmap_dlg_cfg_por_y)
    ld (bitmap_dlg_cmd_block + 6), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_dlg_cmd_block + 7), a
    ld a, c
    ld (bitmap_dlg_cmd_block + 8), a
    xor a
    ld (bitmap_dlg_cmd_block + 9), a
    ld a, b
    ld (bitmap_dlg_cmd_block + 10), a
    xor a
    ld (bitmap_dlg_cmd_block + 11), a
    ld (bitmap_dlg_cmd_block + 12), a
    ld (bitmap_dlg_cmd_block + 13), a
    ld a, #D0                     ; HMMM
    ld (bitmap_dlg_cmd_block + 14), a
    jp bitmap_dlg_launch_cmd

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_fill_rect
; ------------------------------------------------------------
; PURPOSE: HMMV fill on the displayed page.
; INPUT: D = x, E = y (page-local), C = width, B = height, A = colour byte.
; DESTROYS: AF, HL (BC/DE preserved)
; ------------------------------------------------------------
bitmap_dlg_fill_rect:
    ld (bitmap_dlg_cmd_block + 12), a
    xor a
    ld (bitmap_dlg_cmd_block + 0), a
    ld (bitmap_dlg_cmd_block + 1), a
    ld (bitmap_dlg_cmd_block + 2), a
    ld (bitmap_dlg_cmd_block + 3), a
    ld a, d
    ld (bitmap_dlg_cmd_block + 4), a
    xor a
    ld (bitmap_dlg_cmd_block + 5), a
    ld a, e
    ld (bitmap_dlg_cmd_block + 6), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_dlg_cmd_block + 7), a
    ld a, c
    ld (bitmap_dlg_cmd_block + 8), a
    xor a
    ld (bitmap_dlg_cmd_block + 9), a
    ld a, b
    ld (bitmap_dlg_cmd_block + 10), a
    xor a
    ld (bitmap_dlg_cmd_block + 11), a
    ld (bitmap_dlg_cmd_block + 13), a
    ld a, #C0                     ; HMMV
    ld (bitmap_dlg_cmd_block + 14), a
    jp bitmap_dlg_launch_cmd

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_draw_box
; ------------------------------------------------------------
; PURPOSE: Border fill + interior fill (2px frame) from the config mirror.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_draw_box:
    ld a, (bitmap_dlg_cfg_box_x)
    ld d, a
    ld a, (bitmap_dlg_cfg_box_y)
    ld e, a
    ld a, (bitmap_dlg_cfg_box_w)
    ld c, a
    ld a, (bitmap_dlg_cfg_box_h)
    ld b, a
    ld a, (bitmap_dlg_cfg_border_clr)
    call bitmap_dlg_fill_rect
    ld a, (bitmap_dlg_cfg_box_x)
    add a, 2
    ld d, a
    ld a, (bitmap_dlg_cfg_box_y)
    add a, 2
    ld e, a
    ld a, (bitmap_dlg_cfg_box_w)
    sub 4
    ld c, a
    ld a, (bitmap_dlg_cfg_box_h)
    sub 4
    ld b, a
    ld a, (bitmap_dlg_cfg_bg_clr)
    jp bitmap_dlg_fill_rect

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_close_box
; ------------------------------------------------------------
; PURPOSE:
;   Close the dialogue: replay the current room's render program on the
;   DISPLAYED page (same blocks load_room uses), restoring the background
;   under the box and re-applying door state visuals. The talk latch stays set so the
;   held key must be released before it can jump or reopen the dialogue.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_close_box:
    xor a
    ld (bitmap_dlg_state), a
    ld a, (bitmap_displayed_page)
    or a
    jp z, .dlg_close_p0
    ld hl, bitmap_room_render_ptr_table_p1
    ld bc, bitmap_room_render_bank_table_p1
    jp .dlg_close_have_table
.dlg_close_p0:
    ld hl, bitmap_room_render_ptr_table_p0
    ld bc, bitmap_room_render_bank_table_p0

.dlg_close_have_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl

    push hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld c, (hl)
    inc hl
    ld b, (hl)
    pop hl
    call replay_room_commands
    call bitmap_room_restore_resident_banks
    call bitmap_apply_key_pickup_visuals_visible    ; draw key pickup metatiles on current page
    call bitmap_apply_door_state_visible    ; draw closed/open door metatiles on current page
    call bitmap_apply_gems_visible    ; draw uncollected gems on current page
    call bitmap_apply_jumpers_visible    ; draw idle spring metatiles on current page
    call bitmap_apply_walljumpers_visible    ; draw idle wall-spring metatiles on current page
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Submit the 15-byte V9938 command in bitmap_dlg_cmd_block: wait for the
;   previous command, point indirect writes at R#32 and stream the block.
; DESTROYS: AF, (uses HL' none) - preserves BC, DE, HL via push/pop.
; ------------------------------------------------------------
bitmap_dlg_launch_cmd:
    push bc
    push de
    push hl
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_dlg_cmd_block
    ld b, 15
.dlg_launch_write:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .dlg_launch_write
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_restore_hud_separator
; ------------------------------------------------------------
; PURPOSE:
;   Repaints the last HUD row (y=19) after a dynamic HUD
;   widgets. SCREEN 5 HMMM/HMMV widgets are opaque 4bpp copies/fills; if a
;   heart/bar/counter touches the separator row, it can overwrite the white line
;   seeded by init_bitmap_hud_band. This tiny HMMV restores visual parity with
;   the editor preview, where the separator is drawn last.
;
; INPUT:
;   hud_cmd_block scratch.
;
; OUTPUT:
;   A 256x1 color-15 separator is restored on BOTH page 0 and page 1. This keeps
;   the HUD band page-flip safe; transitions do not need to redraw or invalidate it.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, vdp_write_register
;
; SIDE EFFECTS:
;   V9938 command engine runs one HMMV fill. R#15 is restored to S#0 before return.
; ------------------------------------------------------------
bitmap_restore_hud_separator:
    ld hl, bitmap_hud_separator_cmd_template
    ld de, hud_cmd_block
    ld bc, 15
    ldir
    xor a
    ld (hud_cmd_block + 7), a   ; page 0
    call .hud_separator_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a   ; page 1
.hud_separator_draw_page:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, hud_cmd_block
    ld b, 15
.hud_separator_write_block:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .hud_separator_write_block
    xor a
    ld e, a
    ld a, #0F
    call vdp_write_register
    ret

bitmap_hud_separator_cmd_template:
    DB 0,0, 0,0, 0,0, #13,0, 0,1, 1,0, #0F,0, #C0



; ------------------------------------------------------------
; FUNCTION: bitmap_load_enemies
; ------------------------------------------------------------
; PURPOSE: Loads the enemy slots of the ACTIVE room: copies the per-room ROM
;   table into the mutable RAM pool, seeds the per-slot animation state and
;   uploads each used slot's sprite pattern/colour tables to its reserved
;   VRAM groups. Called after load_room at init and on every room-transition
;   commit (same sites as the foreground sprite loader).
; INPUT: current_screen_index.
; OUTPUT: bitmap_enemy_count/pool + VRAM pattern groups reserved by the
; compact per-slot enemy allocation.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY (IX saved/restored).
; CALLS: copy_to_vram_ext, bitmap_enemy_patterns_offset, bitmap_enemy_colors_offset.
; ------------------------------------------------------------
bitmap_load_enemies:
    push ix
    ld hl, bitmap_room_enemy_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (hl)                ; count byte
    ld (bitmap_enemy_count), a
    ld a, #FF                 ; first gameplay frame selects update lane 0
    ld (bitmap_enemy_update_lane), a
    inc hl
    push hl
    pop ix                    ; IX -> slot 0 (22 bytes/slot)
.benemy_slot_0:
    ld a, (bitmap_enemy_count)
    cp 1
    jp c, .benemy_slot_0_done      ; slot unused in this room
    push ix
    pop hl
    ld de, bitmap_enemy_pool + 0
    ld bc, 8
    ldir                      ; movement bytes (x..maxY)
    ld a, (ix+11)             ; animDelay
    ld (bitmap_enemy_pool + 0 + 8), a   ; animTick = delay
    ld (bitmap_enemy_pool + 0 + 11), a  ; animDelay
    xor a
    ld (bitmap_enemy_pool + 0 + 9), a   ; animFrame = 0
    ld a, (ix+10)             ; frameCount
    ld (bitmap_enemy_pool + 0 + 10), a
    ld a, (ix+9)              ; colorOff base, in 16-byte blocks
    ld (bitmap_enemy_pool + 0 + 12), a
    ld a, (ix+12)             ; movement mode
    ld (bitmap_enemy_pool + 0 + 13), a
    ld a, (ix+13)             ; visual X offset from logical enemy origin
    ld (bitmap_enemy_pool + 0 + 14), a
    ld a, (ix+14)             ; visual Y offset from logical enemy origin
    ld (bitmap_enemy_pool + 0 + 15), a
    ld a, (ix+15)             ; DamageOnTouch damage (0 = harmless)
    ld (bitmap_enemy_pool + 0 + 16), a
    ld a, (ix+16)             ; damage hitbox X offset from logical origin
    ld (bitmap_enemy_pool + 0 + 17), a
    ld a, (ix+17)             ; damage hitbox Y offset from logical origin
    ld (bitmap_enemy_pool + 0 + 18), a
    ld a, (ix+18)             ; damage hitbox width
    ld (bitmap_enemy_pool + 0 + 19), a
    ld a, (ix+19)             ; damage hitbox height
    ld (bitmap_enemy_pool + 0 + 20), a
    ld a, (ix+20)             ; authored movement speed in px/update
    ld (bitmap_enemy_pool + 0 + 21), a
    ld a, (ix+21)             ; logical enemy update lane (0 or 1)
    ld (bitmap_enemy_pool + 0 + 22), a
    ; --- upload frameCount*2 pattern groups -> VRAM #FC20 (group 33+) ---
    ld a, (ix+8)
    call bitmap_enemy_patterns_offset
    ld a, (ix+10)             ; frameCount
    add a, a                  ; *2 variants
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32 bytes/group
    ld b, h
    ld c, l
    pop hl
    ld de, #FC20
    call copy_to_vram_ext
    ; --- upload 16-byte colour table -> VRAM #F440 (slot 0) ---
    ld a, (ix+9)
    call bitmap_enemy_colors_offset
    ld de, #F440
    ld bc, 16
    call copy_to_vram_ext
.benemy_slot_0_done:
    ld de, 22
    add ix, de
.benemy_slot_1:
    ld a, (bitmap_enemy_count)
    cp 2
    jp c, .benemy_slot_1_done      ; slot unused in this room
    push ix
    pop hl
    ld de, bitmap_enemy_pool + 23
    ld bc, 8
    ldir                      ; movement bytes (x..maxY)
    ld a, (ix+11)             ; animDelay
    ld (bitmap_enemy_pool + 23 + 8), a   ; animTick = delay
    ld (bitmap_enemy_pool + 23 + 11), a  ; animDelay
    xor a
    ld (bitmap_enemy_pool + 23 + 9), a   ; animFrame = 0
    ld a, (ix+10)             ; frameCount
    ld (bitmap_enemy_pool + 23 + 10), a
    ld a, (ix+9)              ; colorOff base, in 16-byte blocks
    ld (bitmap_enemy_pool + 23 + 12), a
    ld a, (ix+12)             ; movement mode
    ld (bitmap_enemy_pool + 23 + 13), a
    ld a, (ix+13)             ; visual X offset from logical enemy origin
    ld (bitmap_enemy_pool + 23 + 14), a
    ld a, (ix+14)             ; visual Y offset from logical enemy origin
    ld (bitmap_enemy_pool + 23 + 15), a
    ld a, (ix+15)             ; DamageOnTouch damage (0 = harmless)
    ld (bitmap_enemy_pool + 23 + 16), a
    ld a, (ix+16)             ; damage hitbox X offset from logical origin
    ld (bitmap_enemy_pool + 23 + 17), a
    ld a, (ix+17)             ; damage hitbox Y offset from logical origin
    ld (bitmap_enemy_pool + 23 + 18), a
    ld a, (ix+18)             ; damage hitbox width
    ld (bitmap_enemy_pool + 23 + 19), a
    ld a, (ix+19)             ; damage hitbox height
    ld (bitmap_enemy_pool + 23 + 20), a
    ld a, (ix+20)             ; authored movement speed in px/update
    ld (bitmap_enemy_pool + 23 + 21), a
    ld a, (ix+21)             ; logical enemy update lane (0 or 1)
    ld (bitmap_enemy_pool + 23 + 22), a
    ; --- upload frameCount*2 pattern groups -> VRAM #FCA0 (group 37+) ---
    ld a, (ix+8)
    call bitmap_enemy_patterns_offset
    ld a, (ix+10)             ; frameCount
    add a, a                  ; *2 variants
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32 bytes/group
    ld b, h
    ld c, l
    pop hl
    ld de, #FCA0
    call copy_to_vram_ext
    ; --- upload 16-byte colour table -> VRAM #F450 (slot 1) ---
    ld a, (ix+9)
    call bitmap_enemy_colors_offset
    ld de, #F450
    ld bc, 16
    call copy_to_vram_ext
.benemy_slot_1_done:
    ld de, 22
    add ix, de
    pop ix
    ret

; HL = bitmap_enemy_sprite_patterns + A*32 (A = pattern group offset).
bitmap_enemy_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32
    ld de, bitmap_enemy_sprite_patterns
    add hl, de
    ret

; HL = bitmap_enemy_sprite_colors + A*16 (A = color block offset).
bitmap_enemy_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16
    ld de, bitmap_enemy_sprite_colors
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemies
; ------------------------------------------------------------
; PURPOSE: Ticks animation for every active slot, but moves only one logical
;   enemy lane per video frame. Lanes 0/1 alternate, so authored speed N means
;   N pixels every two frames (N/2 pixels per video frame on average). Every
;   hardware layer belonging to one logical enemy shares the same lane.
;   Paused entirely (movement + animation) while a pause gate holds, e.g.
;   an open NPC dialogue; the SAT writer keeps drawing the frozen sprites.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool, bitmap_enemy_update_lane.
; OUTPUT: pool x/y/dx/dy/anim state updated in RAM.
; DESTROYS: AF, DE, IX. PRESERVES: BC, HL, IY.
; ------------------------------------------------------------
bitmap_update_enemies:
    ld a, (bitmap_dlg_state)   ; NPC dialogue open: freeze all enemies
    or a
    ret nz
    ld a, (bitmap_enemy_count)
    or a
    ret z
    push bc
    ld a, (bitmap_enemy_update_lane)
    xor 1
    and 1
    ld (bitmap_enemy_update_lane), a
    ld a, (bitmap_enemy_count)
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_step_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_step_next
.enemy_step_lane_gate:
    ld a, (bitmap_enemy_update_lane)
    cp (ix+22)                ; other lane: animate, but defer movement
    jp nz, .enemy_anim
    ld a, (ix+13)             ; movement mode
    cp 9
    jp z, .enemy_step_patrol_chase_x
    cp 10
    jp z, .enemy_step_walker_gravity
    ; --- X axis ---
.enemy_step_patrol:
    ld a, (ix+2)              ; dx
    or a
    jp z, .enemy_step_y
    ld d, (ix+21)             ; authored pixels per alternating update
.enemy_step_x_px:
    ld a, (ix+2)
    bit 7, a
    jp nz, .enemy_step_left
    ld a, (ix+0)
    cp (ix+5)                 ; x vs maxX
    jp nc, .enemy_turn_left
    inc (ix+0)
    dec d
    jp nz, .enemy_step_x_px
    jp .enemy_step_y
.enemy_turn_left:
    ld (ix+2), #FF
    jp .enemy_step_y
.enemy_step_left:
    ld a, (ix+0)
    cp (ix+4)                 ; x vs minX
    jp z, .enemy_turn_right
    jp c, .enemy_turn_right
    dec (ix+0)
    dec d
    jp nz, .enemy_step_x_px
    jp .enemy_step_y
.enemy_turn_right:
    ld (ix+2), #01
.enemy_step_y:
    ; --- Y axis ---
    ld a, (ix+3)              ; dy
    or a
    jp z, .enemy_anim
    ld d, (ix+21)
.enemy_step_y_px:
    ld a, (ix+3)
    bit 7, a
    jp nz, .enemy_step_up
    ld a, (ix+1)
    cp (ix+7)                 ; y vs maxY
    jp nc, .enemy_turn_up
    inc (ix+1)
    dec d
    jp nz, .enemy_step_y_px
    jp .enemy_anim
.enemy_turn_up:
    ld (ix+3), #FF
    jp .enemy_anim
.enemy_step_up:
    ld a, (ix+1)
    cp (ix+6)                 ; y vs minY
    jp z, .enemy_turn_down
    jp c, .enemy_turn_down
    dec (ix+1)
    dec d
    jp nz, .enemy_step_y_px
    jp .enemy_anim
.enemy_turn_down:
    ld (ix+3), #01
    jp .enemy_anim
.enemy_step_patrol_chase_x:
    ; Detects player only inside this slot's patrol span. Outside that active
    ; zone it behaves like normal patrol; inside it uses authored speed.
    ld a, (player_x)
    cp (ix+4)                 ; player_x < minX -> patrol
    jp c, .enemy_step_patrol
    ld c, a                   ; C = player_x
    ld a, (ix+5)              ; maxX
    cp c
    jp c, .enemy_step_patrol  ; maxX < player_x -> patrol
    ld a, c
    cp (ix+0)                 ; player_x vs enemy_x
    jp z, .enemy_anim
    jp c, .enemy_chase_left
.enemy_chase_right:
    ld (ix+2), #01
    ld d, (ix+21)
.enemy_chase_right_px:
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .enemy_anim
    cp c
    jp nc, .enemy_anim
    inc (ix+0)
    dec d
    jp nz, .enemy_chase_right_px
    jp .enemy_anim
.enemy_chase_left:
    ld (ix+2), #FF
    ld d, (ix+21)
.enemy_chase_left_px:
    ld a, (ix+0)
    cp (ix+4)
    jp z, .enemy_anim
    jp c, .enemy_anim
    cp c
    jp c, .enemy_anim
    dec (ix+0)
    dec d
    jp nz, .enemy_chase_left_px
    jp .enemy_anim
.enemy_step_walker_gravity:
    ; Logical origin = SAT x/y minus the visual cell offset. This keeps multi-cell
    ; hardware sprites moving as one physics body.
    ; Gravity probes every traversed pixel at the authored speed.
    ld d, (ix+21)
.walker_fall_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    cp 176
    jp nc, .walker_on_ground
    push bc                    ; preserve enemy loop counter in B
    push de                    ; preserve remaining speed pixels in D
    add a, 16                  ; probe one pixel row under 16px body
    ld c, a
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 8                   ; probe bottom centre
    ld b, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_on_ground
    inc (ix+1)
    dec d
    jp nz, .walker_fall_px
    jp .enemy_anim
.walker_on_ground:
    ld d, (ix+21)
    ld a, (ix+2)
    or a
    jp z, .walker_set_right
    bit 7, a
    jp nz, .walker_left
.walker_right:
    ; Wall probe at logical x+16, y+8. Solid or max bound -> reverse.
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .walker_turn_left
    push bc                    ; preserve enemy loop counter in B
    push de
    ld e, (ix+14)
    sub e
    add a, 16
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_turn_left
    inc (ix+0)
    dec d
    jp nz, .walker_right
    jp .enemy_anim
.walker_turn_left:
    ld (ix+2), #FF
    jp .enemy_anim
.walker_set_right:
    ld (ix+2), #01
    jp .walker_right
.walker_left:
    ; Wall probe at logical x-1, y+8. Solid or min bound -> reverse.
    ld a, (ix+0)
    cp (ix+4)
    jp z, .walker_turn_right
    jp c, .walker_turn_right
    push bc                    ; preserve enemy loop counter in B
    push de
    ld e, (ix+14)
    sub e
    dec a
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_turn_right
    dec (ix+0)
    dec d
    jp nz, .walker_left
    jp .enemy_anim
.walker_turn_right:
    ld (ix+2), #01
.enemy_anim:
    ; --- frame animation: every animDelay frames, frame = (frame+1) % frameCount ---
    ld a, (ix+10)             ; frameCount
    cp 2
    jp c, .enemy_step_next    ; 0/1 frames = static
    dec (ix+8)                ; animTick
    jp nz, .enemy_step_next
    ld a, (ix+11)             ; animDelay
    ld (ix+8), a
    ld a, (ix+9)              ; animFrame
    inc a
    cp (ix+10)
    jp c, .enemy_anim_store
    xor a
.enemy_anim_store:
    ld (ix+9), a
.enemy_step_next:
    ld de, 23
    add ix, de
    dec b                     ; loop body exceeds djnz's -128 range
    jp nz, .enemy_step_loop
    pop bc
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_check_enemy_touch
; ------------------------------------------------------------
; PURPOSE:
;   Apply DamageOnTouch for active bitmap-room enemy slots. Each damaging
;   enemy compares its configured damage hitbox against the Player Config body
;   hitbox, subtracts its damage from player_health, and arms player_invuln.
;
; INPUT:
;   RAM state: bitmap_enemy_count, bitmap_enemy_pool, player_x, player_y,
;              player_health, player_invuln.
;
; OUTPUT:
;   player_health and player_invuln updated on the first active overlap.
;
; DESTROYS:
;   AF, BC, DE, IX
;
; PRESERVES:
;   HL, IY
;
; CALLS:
;   None
;
; SIDE EFFECTS:
;   Reads enemy slot contact bytes at +16..+20. Damage byte 0 disables contact.
;   Does not respawn or decrement lives; it only applies contact damage + i-frames.
; ------------------------------------------------------------
bitmap_check_enemy_touch:
    ld a, (bitmap_dlg_state)   ; NPC dialogue open: freeze all enemies
    or a
    ret nz
    ld a, (bitmap_enemy_count)
    or a
    ret z
    ld a, (player_invuln)
    or a
    ret nz                     ; already blinking -> immune this frame
    ld a, (bitmap_enemy_count)
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_touch_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_touch_next
    ld a, (ix+16)              ; damage
    or a
    jp z, .enemy_touch_next

    ; X overlap: enemyRight > playerLeft && playerRight > enemyLeft.
    ld a, (ix+0)
    sub (ix+14)                ; logical enemy X = visual X - visualXOff
    add a, (ix+17)             ; + damage hitbox X
    ld d, a                    ; D = enemyLeft
    ld e, a
    ld a, (ix+19)              ; hitW
    add a, e
    ld e, a                    ; E = enemyRight exclusive
    ld a, (player_x)
    add a, 3
    ld c, a                    ; C = playerLeft
    ld a, e
    cp c
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next
    ld a, (player_x)
    add a, 12
    cp d                       ; playerRight <= enemyLeft -> separated
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next

    ; Y overlap: enemyBottom > playerTop && playerBottom > enemyTop.
    ld a, (ix+1)
    sub (ix+15)                ; logical enemy Y = visual Y - visualYOff
    add a, (ix+18)             ; + damage hitbox Y
    ld d, a                    ; D = enemyTop
    ld e, a
    ld a, (ix+20)              ; hitH
    add a, e
    ld e, a                    ; E = enemyBottom exclusive
    ld a, (player_y)
    add a, 3
    ld c, a                    ; C = playerTop
    ld a, e
    cp c
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next
    ld a, (player_y)
    add a, 32
    cp d                       ; playerBottom <= enemyTop -> separated
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next

    ; Apply contact damage, saturating at zero to avoid byte underflow.
    ld a, (player_health)
    ld e, (ix+16)
    sub e
    jp z, .enemy_touch_zero
    jp c, .enemy_touch_zero
    ld (player_health), a
    jp .enemy_touch_arm_iframes
.enemy_touch_zero:
    xor a
    ld (player_health), a

    ; Last heart drained by enemy contact: spend a life, like the deadly system.
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .enemy_touch_game_over     ; lives 0 -> request Game Flow exit
    jp .enemy_touch_respawn
.enemy_touch_game_over:
    ld a, 1
    ld (bitmap_game_over_flag), a
.enemy_touch_respawn:
    ; Full respawn: reset health, arm blink, zero velocity, reposition to spawn.
    ld a, #05
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
.enemy_touch_arm_iframes:
    ld a, #3C
    ld (player_invuln), a
    ret
.enemy_touch_next:
    ld de, 23
    add ix, de
    dec b
    jp nz, .enemy_touch_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemy_sat
; ------------------------------------------------------------
; PURPOSE: Writes the 2 fixed enemy SAT slot(s) at VRAM #F610
;   (right after the player layers, overwriting the player writer's
;   terminator), then appends a #D8 terminator. Unused slots get an
;   off-screen Y=#D4 sprite so the VDP keeps scanning. When the shoot
;   skill is active its bullet writer runs AFTER this and overwrites our
;   terminator in turn. Also refreshes each active slot's line-colour table for
;   its current animation frame before opening the SAT write stream.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool.
; OUTPUT: SAT entries at VRAM #F610..#F61B.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
; ------------------------------------------------------------
bitmap_update_enemy_sat:
    push bc
    push hl
.color_slot_0:
    ld a, (bitmap_enemy_count)
    cp 1
    jp c, .color_slot_0_done
    ld a, (bitmap_enemy_pool + 0 + 12)  ; colorOff base, in 16-byte blocks
    ld e, a
    ld a, (bitmap_enemy_pool + 0 + 9)   ; animFrame
    add a, e
    call bitmap_enemy_colors_offset
    ld de, #F440
    ld bc, 16
    call copy_to_vram_ext
.color_slot_0_done:
.color_slot_1:
    ld a, (bitmap_enemy_count)
    cp 2
    jp c, .color_slot_1_done
    ld a, (bitmap_enemy_pool + 23 + 12)  ; colorOff base, in 16-byte blocks
    ld e, a
    ld a, (bitmap_enemy_pool + 23 + 9)   ; animFrame
    add a, e
    call bitmap_enemy_colors_offset
    ld de, #F450
    ld bc, 16
    call copy_to_vram_ext
.color_slot_1_done:
    ld de, #F610
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.sat_slot_0:
    ld a, (bitmap_enemy_count)
    cp 1
    jp c, .sat_slot_0_hidden
    ld a, (bitmap_enemy_pool + 0 + 13)  ; killed enemy stays in the pool but is invisible
    cp #FF
    jp z, .sat_slot_0_hidden
    ld a, (bitmap_enemy_pool + 0 + 1)
    add a, 20
    out (VDP_DATA_PORT), a    ; Y
    ld a, (bitmap_enemy_pool + 0)
    out (VDP_DATA_PORT), a    ; X
    ld a, (bitmap_enemy_pool + 0 + 9)   ; animFrame
    add a, a
    add a, a
    add a, a                  ; frame * 8 (2 variants x 4 pattern numbers)
    ld e, a
    ld a, (bitmap_enemy_pool + 0 + 2)   ; dx: bit7 set = moving left = mirrored variant
    and #80
    jp z, .sat_slot_0_right
    ld a, 4
    jp .sat_slot_0_pat
.sat_slot_0_right:
    xor a
.sat_slot_0_pat:
    add a, e
    add a, #84
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_0_end
.sat_slot_0_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_0_end:
.sat_slot_1:
    ld a, (bitmap_enemy_count)
    cp 2
    jp c, .sat_slot_1_hidden
    ld a, (bitmap_enemy_pool + 23 + 13)  ; killed enemy stays in the pool but is invisible
    cp #FF
    jp z, .sat_slot_1_hidden
    ld a, (bitmap_enemy_pool + 23 + 1)
    add a, 20
    out (VDP_DATA_PORT), a    ; Y
    ld a, (bitmap_enemy_pool + 23)
    out (VDP_DATA_PORT), a    ; X
    ld a, (bitmap_enemy_pool + 23 + 9)   ; animFrame
    add a, a
    add a, a
    add a, a                  ; frame * 8 (2 variants x 4 pattern numbers)
    ld e, a
    ld a, (bitmap_enemy_pool + 23 + 2)   ; dx: bit7 set = moving left = mirrored variant
    and #80
    jp z, .sat_slot_1_right
    ld a, 4
    jp .sat_slot_1_pat
.sat_slot_1_right:
    xor a
.sat_slot_1_pat:
    add a, e
    add a, #94
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_1_end
.sat_slot_1_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_1_end:
    ld a, #D8
    out (VDP_DATA_PORT), a    ; terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop hl
    pop bc
    ret



; ------------------------------------------------------------
; FUNCTION: bitmap_load_platforms
; ------------------------------------------------------------
; PURPOSE: Loads the platform slots of the ACTIVE room: copies the per-room
;   ROM table into the mutable RAM pool, releases the rider and uploads each
;   used slot's cell pattern/colour tables to its reserved VRAM groups.
;   Called after load_room at init and on every room-transition commit.
; INPUT: current_screen_index.
; OUTPUT: bitmap_platform_count/rider/pool + VRAM pattern groups 33..33.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY (IX saved/restored).
; CALLS: copy_to_vram_ext, bitmap_platform_patterns_offset, bitmap_platform_colors_offset.
; ------------------------------------------------------------
bitmap_load_platforms:
    push ix
    ld a, #FF
    ld (bitmap_platform_rider), a
    ld hl, bitmap_room_platform_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (hl)                ; count byte
    ld (bitmap_platform_count), a
    inc hl
    push hl
    pop ix                    ; IX -> slot 0 (11 bytes/slot)
.bplat_slot_0:
    ld a, (bitmap_platform_count)
    cp 1
    jp c, .bplat_slot_0_done      ; slot unused in this room
    push ix
    pop hl
    ld de, bitmap_platform_pool + 0
    ld bc, 9
    ldir                      ; x..widthCells
    xor a
    ld (bitmap_platform_pool + 0 + 9), a   ; movedX = 0
    ld (bitmap_platform_pool + 0 + 10), a  ; movedY = 0
    ; --- upload widthCells pattern groups -> VRAM #FC20 (group 33+) ---
    ld a, (ix+9)              ; patOff, in 32-byte groups
    call bitmap_platform_patterns_offset
    ld a, (ix+8)              ; widthCells
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32 bytes/group
    ld b, h
    ld c, l
    pop hl
    ld de, #FC20
    call copy_to_vram_ext
    ; --- upload widthCells 16-byte colour tables -> VRAM #F460 ---
    ld a, (ix+10)             ; colorOff, in 16-byte blocks
    call bitmap_platform_colors_offset
    ld a, (ix+8)              ; widthCells
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16 bytes/block
    ld b, h
    ld c, l
    pop hl
    ld de, #F460
    call copy_to_vram_ext
.bplat_slot_0_done:
    ld de, 11
    add ix, de
    pop ix
    ret

; HL = bitmap_platform_sprite_patterns + A*32 (A = pattern group offset).
bitmap_platform_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32
    ld de, bitmap_platform_sprite_patterns
    add hl, de
    ret

; HL = bitmap_platform_sprite_colors + A*16 (A = color block offset).
bitmap_platform_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16
    ld de, bitmap_platform_sprite_colors
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_platform_player_on_slot
; ------------------------------------------------------------
; PURPOSE: Tests whether the player currently stands on the platform slot at
;   IX: horizontal body overlap with the platform span (widthCells*16 px) AND
;   feet line within the one-way stand window over the platform top
;   (delta = feet - top accepted in [-2..8]).
; INPUT: IX -> pool slot, player_x/player_y.
; OUTPUT: A=1 and NZ when standing, A=0 and Z otherwise.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
; ------------------------------------------------------------
bitmap_platform_player_on_slot:
    ; platRight (exclusive, clamped to 255) = platX + widthCells*16
    ld a, (ix+8)
    add a, a
    add a, a
    add a, a
    add a, a                  ; widthCells * 16
    ld e, a
    ld a, (ix+0)
    ld d, a                   ; D = platLeft
    add a, e
    jp nc, .plat_right_ok
    ld a, 255
.plat_right_ok:
    ld e, a                   ; E = platRight (exclusive)
    ; playerLeft < platRight ?
    ld a, (player_x)
    add a, 3
    cp e
    jp nc, .not_standing      ; playerLeft >= platRight -> separated
    ; playerRight (inclusive) >= platLeft ?
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .not_standing       ; playerRight < platLeft -> separated
    ; feet delta: A = player_y + 32 - platTop, accepted in [-2..8]
    ld a, (player_y)
    add a, 32
    sub (ix+1)
    add a, 2
    cp 11
    jp nc, .not_standing
    ld a, 1
    or a
    ret
.not_standing:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_platforms
; ------------------------------------------------------------
; PURPOSE: Steps every active platform slot with the PATROL rules (1 px/frame,
;   turn at the bounds without moving) recording the applied per-frame delta
;   in movedX/movedY, then carries the riding player: horizontal carry goes
;   through bitmap_try_move_x (walls still block), vertical follow re-snaps
;   player_y to the platform top. Runs BEFORE update_player_movement so the
;   player input/gravity acts on the carried position. Paused entirely while
;   a pause gate holds (e.g. an open NPC dialogue).
; INPUT: bitmap_platform_count/pool/rider, player_x/player_y.
; OUTPUT: pool x/y/dx/dy/movedX/movedY updated; rider carried or dropped.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_update_platforms:
    ld a, (bitmap_dlg_state)   ; NPC dialogue open: freeze all platforms
    or a
    ret nz
    ld a, (bitmap_platform_count)
    or a
    ret z
    ld b, a
    ld ix, bitmap_platform_pool
.plat_step_loop:
    xor a
    ld (ix+9), a              ; movedX = 0
    ld (ix+10), a             ; movedY = 0
    ; --- X axis ---
    ld a, (ix+2)              ; dx
    or a
    jp z, .plat_step_y
    bit 7, a
    jp nz, .plat_step_left
    ld a, (ix+0)
    cp (ix+5)                 ; x vs maxX
    jp nc, .plat_turn_left
    inc (ix+0)
    ld (ix+9), #01
    jp .plat_step_y
.plat_turn_left:
    ld (ix+2), #FF
    jp .plat_step_y
.plat_step_left:
    ld a, (ix+0)
    cp (ix+4)                 ; x vs minX
    jp z, .plat_turn_right
    jp c, .plat_turn_right
    dec (ix+0)
    ld (ix+9), #FF
    jp .plat_step_y
.plat_turn_right:
    ld (ix+2), #01
.plat_step_y:
    ; --- Y axis ---
    ld a, (ix+3)              ; dy
    or a
    jp z, .plat_step_next
    bit 7, a
    jp nz, .plat_step_up
    ld a, (ix+1)
    cp (ix+7)                 ; y vs maxY
    jp nc, .plat_turn_up
    inc (ix+1)
    ld (ix+10), #01
    jp .plat_step_next
.plat_turn_up:
    ld (ix+3), #FF
    jp .plat_step_next
.plat_step_up:
    ld a, (ix+1)
    cp (ix+6)                 ; y vs minY
    jp z, .plat_turn_down
    jp c, .plat_turn_down
    dec (ix+1)
    ld (ix+10), #FF
    jp .plat_step_next
.plat_turn_down:
    ld (ix+3), #01
.plat_step_next:
    ld de, 11
    add ix, de
    dec b
    jp nz, .plat_step_loop
    ; --- carry the rider (if any) with the platform it stands on ---
    ld a, (bitmap_platform_rider)
    cp #FF
    ret z
    call bitmap_platform_slot_ptr
    ; re-validate: a respawn/teleport since the last detect must not snap the
    ; player back onto the platform from anywhere on the screen.
    call bitmap_platform_player_on_slot
    jp nz, .plat_carry_valid
    ld a, #FF
    ld (bitmap_platform_rider), a
    ret
.plat_carry_valid:
    ld a, (ix+9)              ; movedX
    or a
    jp z, .plat_carry_vertical
    push ix
    call bitmap_try_move_x    ; A = signed 1px dx; walls still block the rider
    pop ix
.plat_carry_vertical:
    ; vertical follow: keep the feet exactly on the platform top
    ld a, (ix+1)
    sub 32
    ld (player_y), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld a, (player_flags)
    or #01                    ; riding counts as grounded (jump works)
    ld (player_flags), a
    ret

; HL/IX = bitmap_platform_pool + A * 11 (A = slot index).
bitmap_platform_slot_ptr:
    ld l, a
    ld h, 0
    ld e, l
    ld d, h
    add hl, hl                ; 2x
    ld c, l
    ld b, h
    add hl, hl                ; 4x
    add hl, hl                ; 8x
    add hl, bc                ; 10x
    add hl, de                ; 11x
    ld de, bitmap_platform_pool
    add hl, de
    push hl
    pop ix
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_platform_ride_detect
; ------------------------------------------------------------
; PURPOSE: Runs right AFTER update_player_movement. While the player moves up
;   (jump) the rider is released so one-way pass-through works. Otherwise the
;   first platform whose stand window contains the player's feet becomes the
;   rider: the player snaps onto the top, vertical velocity clears and the
;   grounded flag is asserted. No platform under the feet clears the rider.
; INPUT: bitmap_platform_count/pool, player_x/player_y/player_vy.
; OUTPUT: bitmap_platform_rider, player_y/player_vy/player_vy_frac/player_flags.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_platform_ride_detect:
    ld a, (bitmap_dlg_state)   ; NPC dialogue open: freeze all platforms
    or a
    ret nz
    ld a, (player_vy)
    bit 7, a
    jp nz, .detect_clear      ; moving up: never grab a platform
    ld a, (player_y)
    cp 192
    jp nc, .detect_clear      ; wrapped above the top edge: ignore platforms
    ld a, (bitmap_platform_count)
    or a
    jp z, .detect_clear
    ld b, a
    ld c, 0                   ; C = slot index
    ld ix, bitmap_platform_pool
.detect_loop:
    call bitmap_platform_player_on_slot
    jp nz, .detect_stand
    inc c
    ld de, 11
    add ix, de
    dec b
    jp nz, .detect_loop
.detect_clear:
    ld a, #FF
    ld (bitmap_platform_rider), a
    ret
.detect_stand:
    ld a, (ix+1)
    sub 32
    ld (player_y), a          ; snap the feet onto the platform top
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld a, (player_flags)
    or #01
    ld (player_flags), a
    ld a, c
    ld (bitmap_platform_rider), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_platform_sat
; ------------------------------------------------------------
; PURPOSE: Writes the 1 fixed platform SAT slot(s) at VRAM #F618
;   (right after the enemy block, overwriting the previous writer's
;   terminator), then appends a #D8 terminator. Unused slots/cells get an
;   off-screen Y=#D4 sprite so the VDP keeps scanning. The bullet
;   writer (when the shoot skill is active) runs AFTER this and overwrites our
;   terminator in turn. Platform colours are static, uploaded at room load.
; INPUT: bitmap_platform_count, bitmap_platform_pool.
; OUTPUT: SAT entries at VRAM #F618..#F61F.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_update_platform_sat:
    push de
    ld de, #F618
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.sat_slot_0_0:
    ld a, (bitmap_platform_count)
    cp 1
    jp c, .sat_slot_0_0_hidden
    ld a, (bitmap_platform_pool + 0 + 1)
    add a, 20
    out (VDP_DATA_PORT), a    ; Y
    ld a, (bitmap_platform_pool + 0)
    out (VDP_DATA_PORT), a    ; X (cell 0)
    ld a, #84
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_0_0_end
.sat_slot_0_0_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_0_0_end:
    ld a, #D8
    out (VDP_DATA_PORT), a    ; terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_boss_load
; ------------------------------------------------------------
; PURPOSE: Arm the boss for the freshly loaded room. Reads the per-room
;   table; a defeated boss (persistent flag) or an absent one leaves the
;   system idle. The first draw happens on the first update tick.
; INPUT: current_screen_index. OUTPUT: boss state RAM.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_load:
    xor a
    ld (boss_active), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, (hl)
    or a
    ret nz                     ; already killed in this run
    ld a, (current_screen_index)
    add a, a                   ; word table index
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> room boss table
    ld a, (hl)
    or a
    ret z                      ; no boss in this room
    push hl
    pop ix
    ld a, 1
    ld (boss_active), a
    ld a, (ix+1)
    ld (boss_x), a
    ld (boss_old_x), a
    ld a, (ix+2)
    ld (boss_y), a
    ld (boss_old_y), a
    ld a, (ix+3)
    ld (boss_dx), a
    ld a, (ix+4)
    ld (boss_dy), a
    ld a, (ix+17)
    ld (boss_hp), a
    ld a, (ix+16)
    ld (boss_anim_tick), a
    xor a
    ld (boss_anim_frame), a
    ld (boss_int_tick), a
    ld l, (ix+9)
    ld h, (ix+10)
    ld (boss_sx), hl           ; frame 0 source X
    call bitmap_boss_barrier_apply   ; Phase B: raise the chain around the room
    call bitmap_boss_proj_config_ix
    xor a
    ld (boss_proj_active), a   ; Phase D: no projectile in flight yet
    ld a, (ix+8)
    ld (boss_phase_speed), a   ; base speed until the first phase resolve
    ld a, (ix+7)
    ld (boss_proj_cd), a       ; first shot after one full interval
    ld a, (ix+10)
    or a
    call nz, bitmap_boss_sbul_load   ; upload bullet pattern/colours, clear pool
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_update
; ------------------------------------------------------------
; PURPOSE: Per-frame boss brain: cadence gate, patrol move with bounce,
;   animation step, VDP redraw (strip restore + HMMM body), player
;   contact damage. The blit budget is the one verified by the
;   feasibility benchmark; at interval 2 the VDP finishes 96x96 with
;   a full frame to spare.
; INPUT: boss state RAM, current room table via bitmap_boss_ptr_table.
; OUTPUT: VRAM page 0 updated; player_health/player_invuln on contact.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_boss_update:
    ld a, (bitmap_dlg_state)   ; NPC dialogue open: freeze the boss
    or a
    ret nz
    ld a, (boss_active)
    or a
    ret z
    call bitmap_boss_table_ix  ; IX -> room table (preserves state regs)
    ; VDP load balancing (enemy-style): the body only moves/redraws every
    ; (ix+19) frames (default 3); the projectile blits run on the OTHER frames,
    ; so a single frame never pays for both the big body HMMM and a bullet.
    ld a, (boss_int_tick)
    inc a
    ld (boss_int_tick), a
    cp (ix+19)
    jp c, bitmap_boss_off_frame   ; off-frame: bullets + contact damage
    xor a
    ld (boss_int_tick), a

    ; remember previous position for strip restore
    ld a, (boss_x)
    ld (boss_old_x), a
    ld a, (boss_y)
    ld (boss_old_y), a

    ; ---- X patrol with bounce ----
    ld a, (boss_dx)
    or a
    jr z, .no_x
    ld b, a
    ld a, (boss_x)
    add a, b
    ld (boss_x), a
    cp (ix+5)                  ; minX
    jr c, .bounce_x
    cp (ix+6)                  ; maxX
    jr z, .no_x
    jr c, .no_x
.bounce_x:
    ld a, b
    neg
    ld (boss_dx), a
    ld a, (boss_old_x)
    ld (boss_x), a             ; stay in bounds this frame
.no_x:
    ; ---- Y patrol with bounce ----
    ld a, (boss_dy)
    or a
    jr z, .no_y
    ld b, a
    ld a, (boss_y)
    add a, b
    ld (boss_y), a
    cp (ix+7)                  ; minY
    jr c, .bounce_y
    cp (ix+8)                  ; maxY
    jr z, .no_y
    jr c, .no_y
.bounce_y:
    ld a, b
    neg
    ld (boss_dy), a
    ld a, (boss_old_y)
    ld (boss_y), a
.no_y:

    ; ---- animation step: boss_sx = frame SX (base + frame*W) ----
    ld a, (ix+15)              ; frame count
    cp 2
    jr c, .anim_done
    ld a, (boss_anim_tick)
    dec a
    ld (boss_anim_tick), a
    jr nz, .anim_done
    ld a, (ix+16)
    ld (boss_anim_tick), a
    ld a, (boss_anim_frame)
    inc a
    cp (ix+15)
    jr c, .anim_keep
    xor a
.anim_keep:
    ld (boss_anim_frame), a
    ld l, (ix+9)               ; base SX
    ld h, (ix+10)
    or a
    jr z, .anim_sx_done
    ld b, a
    ld e, (ix+13)              ; width
    ld d, 0
.anim_sx_mul:
    add hl, de
    djnz .anim_sx_mul
.anim_sx_done:
    ld (boss_sx), hl
.anim_done:

    ; ---- VDP phase: uncovered-edge strips from page 1, then body HMMM ----
    call bitmap_boss_restore_strips
    call bitmap_boss_draw
    jp bitmap_boss_touch

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_off_frame
; ------------------------------------------------------------
; PURPOSE: Frames on which the body does NOT redraw. The projectile blits live
;   here so the VDP work is spread across the cadence cycle instead of piling
;   onto the body frame. Contact damage still runs every frame.
; INPUT: IX -> room table. DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_boss_off_frame:
    push ix
    call bitmap_boss_shoot_update   ; Phase D bullets on the body's off-frames
    pop ix
    jp bitmap_boss_touch

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_table_ix
; ------------------------------------------------------------
; PURPOSE: IX = current room's boss table entry.
; DESTROYS: AF, DE, HL (IX result).
; ------------------------------------------------------------
bitmap_boss_table_ix:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    pop ix
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_restore_strips
; ------------------------------------------------------------
; PURPOSE: Repair the background the body uncovered this tick: one 4px
;   vertical strip (movement X) and one 4px horizontal strip (movement Y),
;   copied page1 -> page0 at the OLD position edges. 4px covers |d| <= 2.
; INPUT: boss_old_x/y, boss_x/y, IX -> table. DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_restore_strips:
    ; X strip: moved right -> left edge uncovered (at old_x);
    ;          moved left  -> right edge (old_x + W - 4).
    ld a, (boss_x)
    ld b, a
    ld a, (boss_old_x)
    cp b
    jr z, .strip_y             ; no X move
    jr c, .strip_left          ; old < new: uncovered at old left edge
    add a, (ix+13)             ; old > new: right edge
    sub 4
.strip_left:
    and #FE
    ld (boss_cmd_buf + 0), a   ; SX low (page 1 source, same X)
    ld (boss_cmd_buf + 4), a   ; DX low
    xor a
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_old_y)
    add a, #14
    ld l, a
    ld h, 0
    ld (boss_cmd_buf + 6), hl  ; DY = page 0
    inc h                      ; +256 = page 1
    ld (boss_cmd_buf + 2), hl  ; SY
    ld hl, 4
    ld (boss_cmd_buf + 8), hl  ; NX = 4 px
    ld l, (ix+14)
    ld h, 0
    ld (boss_cmd_buf + 10), hl ; NY = boss height
    call bitmap_boss_finish_hmmm
.strip_y:
    ; Y strip: moved down -> top edge uncovered (at old_y); up -> bottom.
    ld a, (boss_y)
    ld b, a
    ld a, (boss_old_y)
    cp b
    ret z
    jr c, .strip_top
    add a, (ix+14)
    sub 4
.strip_top:
    add a, #14
    ld l, a
    ld h, 0
    ld (boss_cmd_buf + 6), hl  ; DY page 0
    inc h
    ld (boss_cmd_buf + 2), hl  ; SY page 1
    ld a, (boss_old_x)
    and #FE
    ld (boss_cmd_buf + 0), a
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 5), a
    ld l, (ix+13)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = boss width
    ld hl, 4
    ld (boss_cmd_buf + 10), hl ; NY = 4 px
    jp bitmap_boss_finish_hmmm

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_draw
; ------------------------------------------------------------
; PURPOSE: Blit the current animation frame (atlas rows 512+) to the
;   visible page at (boss_x, boss_y + HUD offset) with one opaque HMMM.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_draw:
    ld hl, (boss_sx)
    ld (boss_cmd_buf + 0), hl  ; SX
    ld l, (ix+11)
    ld h, (ix+12)
    ld (boss_cmd_buf + 2), hl  ; SY (already 512-based)
    ld a, (boss_x)
    and #FE
    ld (boss_cmd_buf + 4), a   ; DX
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
    add a, #14
    ld l, a
    ld h, 0
    ld (boss_cmd_buf + 6), hl  ; DY page 0
    ld l, (ix+13)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = width
    ld l, (ix+14)
    ld (boss_cmd_buf + 10), hl ; NY = height
bitmap_boss_finish_hmmm:
    xor a
    ld (boss_cmd_buf + 12), a  ; CLR unused
    ld (boss_cmd_buf + 13), a  ; ARG = 0
    ld a, #D0
    ld (boss_cmd_buf + 14), a  ; HMMM
; fall through
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_launch_cmd
; ------------------------------------------------------------
; PURPOSE: Wait for a free command unit and stream boss_cmd_buf to
;   R#32-46 through the R#17 auto-increment port. Restores R#15 = S#0.
; DESTROYS: AF, BC, HL.
; ------------------------------------------------------------
bitmap_boss_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, boss_cmd_buf
    ld bc, #0F9B
    otir
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_touch
; ------------------------------------------------------------
; PURPOSE: AABB player-vs-boss contact damage with the same saturating
;   health / i-frames / respawn contract as the enemy runtime.
; DESTROYS: AF, BC, DE, HL (IX preserved: table already loaded).
; ------------------------------------------------------------
bitmap_boss_touch:
    ld a, (ix+18)              ; contact damage (0 = harmless boss)
    or a
    ret z
    ld a, (player_invuln)
    or a
    ret nz
    ; X overlap: playerLeft < bossRight && bossLeft < playerRight
    ld a, (player_x)
    add a, #03
    ld b, a                    ; B = playerLeft
    ld a, (boss_x)
    add a, (ix+13)
    jr c, .x_right_ok          ; boss right edge past 255 -> no right limit
    dec a
    cp b
    ret c                      ; bossRight-1 < playerLeft -> apart
.x_right_ok:
    ld a, b
    add a, #08
    ld c, a                    ; C = playerRight-1
    ld a, (boss_x)
    cp c
    ret z
    ret nc                     ; bossLeft >= playerRight -> apart (eq = touch edge)
    ; Y overlap
    ld a, (player_y)
    add a, #03
    ld b, a                    ; B = playerTop
    ld a, (boss_y)
    add a, (ix+14)
    dec a
    cp b
    ret c                      ; bossBottom-1 < playerTop
    ld a, b
    add a, #1C
    ld c, a                    ; C = playerBottom-1
    ld a, (boss_y)
    cp c
    ret z
    ret nc
    ; contact: subtract damage, saturate, arm i-frames, respawn on death
    ld a, (player_health)
    sub (ix+18)
    jr z, .boss_touch_zero
    jr c, .boss_touch_zero
    ld (player_health), a
    jr .boss_touch_arm
.boss_touch_zero:
    xor a
    ld (player_health), a
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .boss_touch_game_over
    jr .boss_touch_respawn
.boss_touch_game_over:
    ld a, 1
    ld (bitmap_game_over_flag), a
    jr .boss_touch_arm
.boss_touch_respawn:
    ld a, #05
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
.boss_touch_arm:
    ld a, #3C
    ld (player_invuln), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_bullet_hit
; ------------------------------------------------------------
; PURPOSE: Player-bullet vs boss body. Wired as the body of the shoot
;   skill's bitmap_bullet_check_enemy_collision stub. On hit: 1 damage,
;   despawn the bullet, and at 0 HP run the death sequence (full-rect
;   page1 restore + persistent defeated flag).
; INPUT: IX -> bullet slot (active, x, y, dir).
; OUTPUT: boss_hp / boss state; VRAM on death.
; PRESERVES: BC, DE, HL, IX (contract of the stub call site).
; ------------------------------------------------------------
bitmap_boss_bullet_hit:
    ld a, (boss_active)
    or a
    ret z
    push bc
    ; bullet point (center-ish: +8,+8 of its 16x16 sprite) inside boss rect?
    ld a, (ix+1)               ; bullet x
    add a, 8
    ld b, a
    ld a, (boss_x)
    cp b
    jr z, .bullet_x_in
    jr nc, .bullet_miss        ; bossLeft > point -> out
.bullet_x_in:
    push de
    push hl
    call bitmap_boss_table_ix_shadow
    ld a, (boss_x)
    add a, (hl)                ; + width  (HL -> width byte)
    jr c, .bullet_x2_in        ; wrapped past 255: point is inside on the right
    cp b
    jr c, .bullet_miss_dehl    ; bossRight < point -> out
.bullet_x2_in:
    ld a, (ix+2)               ; bullet y
    add a, 8
    ld b, a
    ld a, (boss_y)
    cp b
    jr z, .bullet_y_in
    jr nc, .bullet_miss_dehl
.bullet_y_in:
    inc hl                     ; HL -> height byte
    ld a, (boss_y)
    add a, (hl)
    cp b
    jr c, .bullet_miss_dehl
    ; HIT: despawn the bullet, then apply damage for the zone it landed on.
    xor a
    ld (ix+0), a
    call bitmap_boss_zone_damage   ; A = hits (0 = armour, no damage)
    or a
    jr z, .zone_no_damage
    ld b, a
    ld a, (boss_hp)
    sub b
    jr c, .boss_die            ; overkill
    ld (boss_hp), a
    jr z, .boss_die
    pop hl
    pop de
    pop bc
    ret
.zone_no_damage:
    pop hl
    pop de
    pop bc
    ret
.boss_die:
    call bitmap_boss_kill
    pop hl
    pop de
    pop bc
    ret
.bullet_miss_dehl:
    pop hl
    pop de
.bullet_miss:
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_zone_damage
; ------------------------------------------------------------
; PURPOSE: Phase E. Work out how much damage the bullet that just landed does,
;   from the boss's damage zones. Zones are boss-local rectangles tested in
;   authoring order, first match wins: an "invulnerable" zone (armour) returns
;   0 hits, a weak point returns its damageMultiplier. A bullet that lands
;   outside every zone does the default 1 damage.
; INPUT: IX -> bullet slot (x at ix+1, y at ix+2), boss_x/boss_y.
; OUTPUT: A = damage in hit points (0 = no damage).
; DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_zone_damage:
    ; local coords: D = bulletCentreX - boss_x, E = bulletCentreY - boss_y
    ld a, (ix+1)
    add a, 8
    ld b, a
    ld a, (boss_x)
    ld c, a
    ld a, b
    sub c
    ld d, a
    ld a, (ix+2)
    add a, 8
    ld b, a
    ld a, (boss_y)
    ld c, a
    ld a, b
    sub c
    ld e, a
    ld a, (current_screen_index)
    add a, a
    ld l, a
    ld h, 0
    ld bc, bitmap_boss_zone_ptr_table
    add hl, bc
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> zone table
    ld a, (hl)
    or a
    jr z, .zone_default        ; no zones authored
    ld b, a                    ; B = zone count
    inc hl
.zone_scan:
    ; x range: zx <= dx < zx + zw
    ld a, d
    sub (hl)                   ; dx - zx
    jr c, .zone_next           ; left of the zone
    inc hl
    inc hl                     ; HL -> w  (skip y)
    cp (hl)
    dec hl
    dec hl                     ; HL back to x
    jr nc, .zone_next          ; right of the zone
    ; y range: zy <= dy < zy + zh
    inc hl                     ; HL -> y
    ld a, e
    sub (hl)
    jr c, .zone_next_y
    inc hl
    inc hl                     ; HL -> h
    cp (hl)
    dec hl
    dec hl                     ; HL -> y
    jr nc, .zone_next_y
    ; inside: read kind + multiplier
    inc hl
    inc hl
    inc hl                     ; HL -> kind
    ld a, (hl)
    or a
    jr z, .zone_armour
    inc hl                     ; HL -> multiplier
    ld a, (hl)
    ret                        ; weak point: damageMultiplier hits
.zone_armour:
    xor a
    ret                        ; armour: bullet dies, no damage
.zone_next_y:
    dec hl                     ; HL back to x
.zone_next:
    ld a, 6
    add a, l
    ld l, a
    jr nc, .zone_skip_hi
    inc h
.zone_skip_hi:
    djnz .zone_scan
.zone_default:
    ld a, 1                    ; outside every zone: plain 1 damage
    ret

; Shadow table lookup that leaves HL -> width byte (offset 13) without
; touching IX (the bullet slot pointer must survive).
bitmap_boss_table_ix_shadow:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, 13
    add hl, de                 ; HL -> width
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_kill
; ------------------------------------------------------------
; PURPOSE: Death sequence: erase the body with one full-rect page1 -> page0
;   HMMM at the current position and set the persistent defeated flag.
; DESTROYS: AF, DE, HL (BC preserved by callers that need it).
; ------------------------------------------------------------
bitmap_boss_kill:
    ; Retire any bullet still in flight and push the hidden SAT entries out NOW:
    ; once boss_active is 0 the SAT writer stops running, so a live bullet would
    ; stay frozen on screen forever.
    xor a
    ld (boss_sbul_pool + 0), a
    ld (boss_sbul_pool + 5), a
    push ix
    call bitmap_boss_sbul_sat
    pop ix
    xor a
    ld (boss_active), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, 1
    ld (hl), a
    call bitmap_boss_run_defeat_actions   ; Phase A onDefeated bytecode
    call bitmap_boss_barrier_remove   ; Phase B: drop the chain (collision + graphics)
    ; full-rect restore from page 1
    call bitmap_boss_table_ix_shadow   ; HL -> width
    ld a, (boss_x)
    and #FE
    ld (boss_cmd_buf + 0), a
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
    add a, #14
    ld e, a
    ld d, 0
    ld (boss_cmd_buf + 6), de  ; DY page 0
    inc d
    ld (boss_cmd_buf + 2), de  ; SY page 1
    ld a, (hl)                 ; width
    ld e, a
    ld d, 0
    ld (boss_cmd_buf + 8), de
    inc hl
    ld a, (hl)                 ; height
    ld e, a
    ld (boss_cmd_buf + 10), de
    jp bitmap_boss_finish_hmmm

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_run_defeat_actions
; ------------------------------------------------------------
; PURPOSE: Interpret the current room's Boss Defeat Actions bytecode when the
;   boss dies. Phase A opcodes: END (#00), SET_FLAG (#01, arg=flag index ->
;   boss_flags[index]=1). Unknown/future opcodes stop the stream cleanly.
; INPUT: current_screen_index. OUTPUT: boss_flags. DESTROYS: AF, DE, HL.
;   Preserves BC and IX (bitmap_boss_kill runs inside the bullet-hit contract).
; ------------------------------------------------------------
bitmap_boss_run_defeat_actions:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_defeat_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> room defeat stream
.next_op:
    ld a, (hl)
    inc hl
    or a
    ret z                      ; END
    cp #01
    jr z, .op_set_flag
    cp #02
    jr z, .op_give_key
    ret                        ; unknown opcode: stop cleanly
.op_set_flag:
    ld a, (hl)                 ; arg = flag index
    inc hl
    ld e, a
    ld d, 0
    push hl
    ld hl, boss_flags
    add hl, de
    ld a, 1
    ld (hl), a
    pop hl
    jr .next_op
.op_give_key:
    ld a, (hl)                 ; arg = how many keys
    inc hl
    ld e, a
    ld a, (bitmap_key_count)
    add a, e
    jr nc, .give_key_store
    ld a, #FF                  ; saturate instead of wrapping to zero
.give_key_store:
    ld (bitmap_key_count), a
    jr .next_op


; ------------------------------------------------------------
; FUNCTION: bitmap_boss_barrier_apply / bitmap_boss_barrier_remove
; ------------------------------------------------------------
; PURPOSE: Raise (apply) or drop (remove) the chain barrier around the whole
;   room perimeter (row 0, row 11, col 0, col 15). apply paints the chain tile
;   and marks the cells solid; remove restores the clean room from page 1 and
;   clears the collision. A room with no barrier tile is a no-op (present=0).
; INPUT: current_screen_index. OUTPUT: bitmap_room_collision_map + VRAM page 0.
; DESTROYS: AF, BC, DE, HL. Preserves IX (runs inside the boss_kill contract).
; ------------------------------------------------------------
bitmap_boss_barrier_apply:
    ld a, 1
    ld (boss_barrier_draw), a
    jr bitmap_boss_barrier_walk
bitmap_boss_barrier_remove:
    xor a
    ld (boss_barrier_draw), a
bitmap_boss_barrier_walk:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_barrier_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> barrier table (present, sxLo, sxHi, syLo, syHi)
    ld a, (hl)
    or a
    ret z                      ; no chain barrier in this room
    inc hl
    ld a, (hl)
    ld (boss_barrier_sx), a
    inc hl
    ld a, (hl)
    ld (boss_barrier_sx + 1), a
    inc hl
    ld a, (hl)
    ld (boss_barrier_sy), a
    inc hl
    ld a, (hl)
    ld (boss_barrier_sy + 1), a
    ld c, 0                    ; top row
    call bitmap_boss_barrier_row
    ld c, 11                   ; bottom row
    call bitmap_boss_barrier_row
    ld b, 0                    ; left column
    call bitmap_boss_barrier_col
    ld b, 15                   ; right column
    jp bitmap_boss_barrier_col

; Iterate one horizontal edge (C = fixed row, cols 0..15).
bitmap_boss_barrier_row:
    ld b, 0
.row_loop:
    push bc
    call bitmap_boss_barrier_cell
    pop bc
    inc b
    ld a, b
    cp 16
    jr c, .row_loop
    ret

; Iterate one vertical edge (B = fixed col, rows 1..10; corners done by rows).
bitmap_boss_barrier_col:
    ld c, 1
.col_loop:
    push bc
    call bitmap_boss_barrier_cell
    pop bc
    inc c
    ld a, c
    cp 11
    jr c, .col_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_barrier_cell
; ------------------------------------------------------------
; PURPOSE: Apply/clear one 16x16 perimeter cell (B = col 0..15, C = row 0..11):
;   write the collision map and blit the chain tile (apply) or restore the
;   clean room from page 1 (clear). Mode = boss_barrier_draw.
; DESTROYS: AF, DE, HL (BC preserved for the caller loop). Preserves IX.
; ------------------------------------------------------------
bitmap_boss_barrier_cell:
    ; ---- collision: index = C*16 + B ----
    ; Tile-by-tile: only EMPTY perimeter cells get the block tile, so existing
    ; tiles (walls/floor/ceiling) are never overwritten in collision OR graphics.
    ; Marker #80 = "sealed opening" (solid, not deadly, above the room's own
    ; collision value range). apply seals empty cells and draws the block tile;
    ; remove clears only #80 cells and restores their graphics. Non-applicable
    ; cells return immediately (no draw), so nothing is clobbered. No save buffer.
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a                   ; A = C*16 (row pixel base, <=176)
    add a, b                   ; + col -> collision index (B < 16)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de                 ; HL -> collision cell
    ld a, (boss_barrier_draw)
    or a
    jr z, .cell_unseal
    ld a, (hl)                 ; apply: act only on empty cells
    and #BF                    ; drop Deadly bit; Z => passable (empty)
    ret nz                     ; occupied cell -> leave tile fully untouched
    ld a, #80
    ld (hl), a                 ; mark as sealed opening
    jr .cell_vdp
.cell_unseal:
    ld a, (hl)                 ; remove: act only on our own markers
    cp #80
    ret nz                     ; not a block tile we placed -> leave untouched
    xor a
    ld (hl), a                 ; reopen the passage
.cell_vdp:
    ; ---- build the 16x16 HMMM command for this cell ----
    ld a, (boss_barrier_draw)
    or a
    jr z, .cell_clear_src
    ld hl, (boss_barrier_sx)   ; apply: source = chain atlas tile
    ld (boss_cmd_buf + 0), hl
    ld hl, (boss_barrier_sy)
    ld (boss_cmd_buf + 2), hl
    jr .cell_dest
.cell_clear_src:
    ld a, b                    ; clear: source = clean room, page 1, same cell
    add a, a
    add a, a
    add a, a
    add a, a                   ; B*16 = colPix
    ld (boss_cmd_buf + 0), a
    xor a
    ld (boss_cmd_buf + 1), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a                   ; C*16 = rowPix
    add a, #14
    ld l, a
    ld h, 1                    ; page 1
    ld (boss_cmd_buf + 2), hl
.cell_dest:
    ld a, b                    ; DX = colPix
    add a, a
    add a, a
    add a, a
    add a, a
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, c                    ; DY = rowPix + gameY, page 0
    add a, a
    add a, a
    add a, a
    add a, a
    add a, #14
    ld l, a
    ld h, 0
    ld (boss_cmd_buf + 6), hl
    ld hl, 16                  ; NX = NY = 16
    ld (boss_cmd_buf + 8), hl
    ld (boss_cmd_buf + 10), hl
    push bc
    call bitmap_boss_finish_hmmm
    pop bc
    ret

; ------------------------------------------------------------
; PHASE D: boss bitmap projectile (single bullet, no hardware sprites)
; Config table [present,sxLo,sxHi,syLo,syHi,w,h,interval,speed,damage] via
; bitmap_boss_projectile_ptr_table. Rendered with the same HMMM machinery as the
; body: restore old cell from page 1, draw the atlas tile on page 0.
; ------------------------------------------------------------
bitmap_boss_proj_config_ix:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_projectile_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    pop ix                     ; IX -> projectile config
    ret

; Called every frame while the boss is alive. Advances a live projectile and,
; when the cooldown elapses and none is in flight, fires a new one at the player.
bitmap_boss_shoot_update:
    call bitmap_boss_proj_config_ix
    ld a, (ix+0)
    or a
    ret z                      ; this room's boss does not shoot
    ld a, (ix+10)
    or a
    jp nz, bitmap_boss_sbul_update   ; hardware-sprite bullets
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_phase_resolve
; ------------------------------------------------------------
; PURPOSE: Pick the attack phase matching the boss's current HP and apply it.
;   Table: [count, (hpAtOrBelow, interval, projSpeed) * count], most damaged
;   first; the first entry with hpAtOrBelow >= boss_hp wins. With no table (or
;   no match) the base cadence from the projectile config is used.
; INPUT: IX -> projectile config, boss_hp. OUTPUT: A = fire interval,
;   boss_phase_speed = projectile speed for this phase.
; DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_phase_resolve:
    ld a, (ix+8)
    ld (boss_phase_speed), a   ; default: base projectile speed
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_phase_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> phase table
    ld a, (hl)
    or a
    jr z, .no_phases           ; count 0 -> base cadence
    ld b, a                    ; B = phase count
    inc hl
.scan:
    ld a, (boss_hp)
    cp (hl)                    ; boss_hp <= hpAtOrBelow ?
    jr z, .match
    jr c, .match
    inc hl                     ; skip this entry (3 bytes)
    inc hl
    inc hl
    djnz .scan
.no_phases:
    ld a, (ix+7)               ; base interval
    ret
.match:
    inc hl                     ; HL -> interval
    ld c, (hl)                 ; C = interval
    inc hl
    ld a, (hl)                 ; A = projectile speed
    ld (boss_phase_speed), a
    ld a, c                    ; A = interval (return value)
    ret

; Spawn at the boss centre, aimed 8-directionally at the player.
; IX -> projectile config. Uses bitmap_boss_table_ix_shadow for the boss size.
bitmap_boss_proj_spawn:
    call bitmap_boss_table_ix_shadow   ; HL -> boss width byte (IX preserved)
    ld a, (hl)                 ; boss width
    srl a
    ld b, a
    ld a, (boss_x)
    add a, b                   ; boss centre X
    ld b, (ix+5)               ; projectile width
    srl b
    sub b
    ld (boss_proj_x), a
    ld (boss_proj_ox), a
    inc hl                     ; HL -> boss height
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_y)
    add a, b                   ; boss centre Y
    ld b, (ix+6)
    srl b
    sub b
    ld (boss_proj_y), a
    ld (boss_proj_oy), a
    ; dx = sign(player_x - proj_x) * speed
    ld a, (player_x)
    ld b, a
    ld a, (boss_proj_x)
    cp b
    jr z, .dx_zero
    jr c, .dx_pos
    ld a, (boss_phase_speed)
    neg
    jr .dx_store
.dx_pos:
    ld a, (boss_phase_speed)
    jr .dx_store
.dx_zero:
    xor a
.dx_store:
    ld (boss_proj_dx), a
    ; dy = sign(player_y - proj_y) * speed
    ld a, (player_y)
    ld b, a
    ld a, (boss_proj_y)
    cp b
    jr z, .dy_zero
    jr c, .dy_pos
    ld a, (boss_phase_speed)
    neg
    jr .dy_store
.dy_pos:
    ld a, (boss_phase_speed)
    jr .dy_store
.dy_zero:
    xor a
.dy_store:
    ld (boss_proj_dy), a
    ld a, (boss_proj_dx)        ; player exactly on boss -> drop straight down
    or a
    jr nz, .arm
    ld a, (boss_proj_dy)
    or a
    jr nz, .arm
    ld a, (boss_phase_speed)
    ld (boss_proj_dy), a
.arm:
    ld a, 1
    ld (boss_proj_active), a
    call bitmap_boss_proj_save   ; save under the spawn cell before first draw
    jp bitmap_boss_proj_draw

; Advance the live projectile one frame: erase old, move, bounds, draw, hit-test.
bitmap_boss_proj_step:
    ld a, (boss_proj_x)
    ld (boss_proj_ox), a
    ld a, (boss_proj_y)
    ld (boss_proj_oy), a
    call bitmap_boss_proj_restore
    ld a, (boss_proj_x)
    ld b, a
    ld a, (boss_proj_dx)
    add a, b
    ld (boss_proj_x), a
    ld a, (boss_proj_y)
    ld b, a
    ld a, (boss_proj_dy)
    add a, b
    ld (boss_proj_y), a
    ld a, (boss_proj_x)
    cp 250
    jr nc, .off
    cp 4
    jr c, .off
    ld a, (boss_proj_y)
    cp 180
    jr nc, .off
    cp 2
    jr c, .off
    ; Hit a solid tile? Bullets must not fly through walls/chain: despawn on
    ; contact (the old cell was already restored above, so nothing is left).
    call bitmap_boss_proj_tile_solid
    jr nz, .off
    call bitmap_boss_proj_save   ; keep what is underneath the new position
    call bitmap_boss_proj_draw
    jp bitmap_boss_proj_hit_check
.off:
    xor a
    ld (boss_proj_active), a
    ret

; Z = passable, NZ = solid, at the projectile centre. Same indexing as
; bitmap_probe_solid: index = (y & #F0) + (x >> 4).
bitmap_boss_proj_tile_solid:
    ld a, (ix+6)
    srl a
    ld b, a
    ld a, (boss_proj_y)
    add a, b                   ; centre Y
    and #F0
    ld l, a
    ld a, (ix+5)
    srl a
    ld b, a
    ld a, (boss_proj_x)
    add a, b                   ; centre X
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)
    and #BF                    ; ignore the Deadly bit; Z = passable
    ret

; Put back the pixels that were underneath the OLD projectile position, from
; the VRAM scratch rect. NOT a page-1 restore: the boss body, chain barrier and
; other overlays only exist on the visible page, so a background restore would
; erase them wherever the projectile flew over.
bitmap_boss_proj_restore:
    ld hl, #02C0
    ld (boss_cmd_buf + 2), hl  ; SY = scratch row
    xor a
    ld (boss_cmd_buf + 0), a   ; SX = 0
    ld (boss_cmd_buf + 1), a
    ld a, (boss_proj_ox)
    and #FE
    ld (boss_cmd_buf + 4), a   ; DX = old X
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_proj_oy)
    add a, #14
    ld l, a
    ld h, 0                    ; page 0 dest
    ld (boss_cmd_buf + 6), hl
    ld l, (ix+5)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = w
    ld l, (ix+6)
    ld (boss_cmd_buf + 10), hl ; NY = h
    jp bitmap_boss_finish_hmmm

; Save the pixels currently at the projectile position into the scratch rect,
; so the next frame can put them back untouched.
bitmap_boss_proj_save:
    ld a, (boss_proj_x)
    and #FE
    ld (boss_cmd_buf + 0), a   ; SX = current X
    xor a
    ld (boss_cmd_buf + 1), a
    ld a, (boss_proj_y)
    add a, #14
    ld l, a
    ld h, 0                    ; page 0 source
    ld (boss_cmd_buf + 2), hl
    xor a
    ld (boss_cmd_buf + 4), a   ; DX = 0
    ld (boss_cmd_buf + 5), a
    ld hl, #02C0
    ld (boss_cmd_buf + 6), hl  ; DY = scratch row
    ld l, (ix+5)
    ld h, 0
    ld (boss_cmd_buf + 8), hl
    ld l, (ix+6)
    ld (boss_cmd_buf + 10), hl
    jp bitmap_boss_finish_hmmm

; Draw the projectile atlas tile at the current position on page 0.
bitmap_boss_proj_draw:
    ld l, (ix+1)
    ld h, (ix+2)
    ld (boss_cmd_buf + 0), hl  ; SX
    ld l, (ix+3)
    ld h, (ix+4)
    ld (boss_cmd_buf + 2), hl  ; SY (512-based atlas)
    ld a, (boss_proj_x)
    and #FE
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_proj_y)
    add a, #14
    ld l, a
    ld h, 0
    ld (boss_cmd_buf + 6), hl
    ld l, (ix+5)
    ld h, 0
    ld (boss_cmd_buf + 8), hl
    ld l, (ix+6)
    ld (boss_cmd_buf + 10), hl
    jp bitmap_boss_finish_hmmm

; Projectile-vs-player AABB. On hit: erase, despawn, hurt the player.
bitmap_boss_proj_hit_check:
    ld a, (player_invuln)
    or a
    ret nz
    ld a, (player_x)
    add a, #03
    ld b, a                    ; playerLeft
    ld a, (boss_proj_x)
    add a, (ix+5)              ; projRight = x + w
    dec a
    cp b
    ret c                      ; projRight-1 < playerLeft
    ld a, b
    add a, #08
    ld c, a                    ; playerRight-1
    ld a, (boss_proj_x)
    cp c
    ret z
    ret nc                     ; projLeft >= playerRight
    ld a, (player_y)
    add a, #03
    ld b, a                    ; playerTop
    ld a, (boss_proj_y)
    add a, (ix+6)
    dec a
    cp b
    ret c
    ld a, b
    add a, #1C
    ld c, a
    ld a, (boss_proj_y)
    cp c
    ret z
    ret nc
    ; HIT -> erase at current position, despawn, damage
    ld a, (boss_proj_x)
    ld (boss_proj_ox), a
    ld a, (boss_proj_y)
    ld (boss_proj_oy), a
    call bitmap_boss_proj_restore
    xor a
    ld (boss_proj_active), a
    ld a, (ix+9)               ; projectile damage
    ; fall through to bitmap_boss_hurt_player

; Apply A hearts of damage to the player (saturating health, i-frames, respawn).
; Mirrors the boss contact-damage contract. DESTROYS AF, BC, DE, HL.
bitmap_boss_hurt_player:
    ld b, a
    ld a, (player_health)
    sub b
    jr z, .hp_zero
    jr c, .hp_zero
    ld (player_health), a
    jr .hp_arm
.hp_zero:
    xor a
    ld (player_health), a
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .hp_gameover
    ld a, #05
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
    jr .hp_arm
.hp_gameover:
    ld a, 1
    ld (bitmap_game_over_flag), a
.hp_arm:
    ld a, #3C
    ld (player_invuln), a
    ret

; ------------------------------------------------------------
; PHASE D: boss HARDWARE-SPRITE bullets (2 simultaneous)
; ------------------------------------------------------------
; These reuse the ENEMY sprite range: during a boss fight the room has no
; regular enemies, so their SAT slots / pattern group / colour block are free.
; The shared allocation chain therefore does NOT grow. The SAT writer runs after
; the enemy one and only overwrites the first 2 slot(s) -- it must NOT emit a
; terminator, or the sprites of every later system would stop being scanned.
;
; Pool entry (5 bytes): active, x, y, dx, dy.  Pattern: 16x16 with an 8x8 blob
; centred, so the bullet looks small without touching R#1 or any VRAM config.
; ------------------------------------------------------------
bitmap_boss_sbul_update:
    ; advance every live bullet, then fire a new one when the cooldown elapses
    ld iy, boss_sbul_pool
    ld b, 2
.sb_slot_loop:
    push bc
    ld a, (iy+0)
    or a
    call nz, bitmap_boss_sbul_step
    pop bc
    push bc
    ld bc, 5
    add iy, bc
    pop bc
    djnz .sb_slot_loop
    ld a, (boss_proj_cd)
    or a
    jr z, .sb_fire
    dec a
    ld (boss_proj_cd), a
    ret
.sb_fire:
    call bitmap_boss_phase_resolve   ; A = interval for the current HP phase
    ld (boss_proj_cd), a
    jp bitmap_boss_sbul_spawn

; Move one bullet (IY -> slot). Despawns off-screen or on a solid tile.
bitmap_boss_sbul_step:
    ld a, (iy+1)
    add a, (iy+3)
    ld (iy+1), a
    cp 248
    jr nc, .sb_kill
    cp 4
    jr c, .sb_kill
    ld a, (iy+2)
    add a, (iy+4)
    ld (iy+2), a
    cp 180
    jr nc, .sb_kill
    cp 2
    jr c, .sb_kill
    ; solid tile? index = (y & #F0) + (x >> 4), same as bitmap_probe_solid
    ld a, (iy+2)
    add a, 8                   ; sprite centre (8x8 blob inside 16x16)
    and #F0
    ld l, a
    ld a, (iy+1)
    add a, 8
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)
    and #BF
    jr nz, .sb_kill
    jp bitmap_boss_sbul_hit
.sb_kill:
    xor a
    ld (iy+0), a
    ret

; Player-vs-bullet AABB (IY -> slot). The visible blob is the centred 8x8.
bitmap_boss_sbul_hit:
    ld a, (player_invuln)
    or a
    ret nz
    ld a, (player_x)
    add a, #03
    ld b, a                    ; playerLeft
    ld a, (iy+1)
    add a, 12                  ; blob right edge (4 + 8)
    cp b
    ret c
    ld a, b
    add a, #08
    ld c, a                    ; playerRight-1
    ld a, (iy+1)
    add a, 4                   ; blob left edge
    cp c
    ret nc
    ld a, (player_y)
    add a, #03
    ld b, a                    ; playerTop
    ld a, (iy+2)
    add a, 12
    cp b
    ret c
    ld a, b
    add a, #1C
    ld c, a
    ld a, (iy+2)
    add a, 4
    cp c
    ret nc
    xor a
    ld (iy+0), a               ; consume the bullet
    ld a, (ix+9)               ; damage
    jp bitmap_boss_hurt_player

; Fire one bullet from the boss centre toward the player, into the first free
; slot. IX -> projectile config.
bitmap_boss_sbul_spawn:
    ld iy, boss_sbul_pool
    ld b, 2
.sb_find:
    ld a, (iy+0)
    or a
    jr z, .sb_found
    push bc
    ld bc, 5
    add iy, bc
    pop bc
    djnz .sb_find
    ret                        ; pool full: skip this shot
.sb_found:
    call bitmap_boss_table_ix_shadow   ; HL -> boss width (IX/IY preserved)
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_x)
    add a, b
    sub 8                      ; centre the 16x16 sprite
    ld (iy+1), a
    inc hl
    ld a, (hl)                 ; boss height
    srl a
    ld b, a
    ld a, (boss_y)
    add a, b
    sub 8
    ld (iy+2), a
    ; dx = sign(player_x - x) * phase speed
    ld a, (player_x)
    ld b, a
    ld a, (iy+1)
    cp b
    jr z, .sb_dx0
    jr c, .sb_dxp
    ld a, (boss_phase_speed)
    neg
    jr .sb_dxs
.sb_dxp:
    ld a, (boss_phase_speed)
    jr .sb_dxs
.sb_dx0:
    xor a
.sb_dxs:
    ld (iy+3), a
    ; dy = sign(player_y - y) * phase speed
    ld a, (player_y)
    ld b, a
    ld a, (iy+2)
    cp b
    jr z, .sb_dy0
    jr c, .sb_dyp
    ld a, (boss_phase_speed)
    neg
    jr .sb_dys
.sb_dyp:
    ld a, (boss_phase_speed)
    jr .sb_dys
.sb_dy0:
    xor a
.sb_dys:
    ld (iy+4), a
    ld a, (iy+3)               ; player exactly on the boss -> drop downwards
    or a
    jr nz, .sb_arm
    ld a, (iy+4)
    or a
    jr nz, .sb_arm
    ld a, (boss_phase_speed)
    ld (iy+4), a
.sb_arm:
    ld a, 1
    ld (iy+0), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_sbul_sat
; ------------------------------------------------------------
; PURPOSE: Stream the bullet SAT entries over the (unused) enemy slots. Runs
;   AFTER bitmap_update_enemy_sat. Writes exactly 2 slot(s) and NO terminator,
;   so every system allocated after the enemies keeps rendering.
; DESTROYS: AF, BC, DE, HL, IY.
; ------------------------------------------------------------
bitmap_boss_sbul_sat:
    ld a, (boss_active)
    or a
    ret z
    ld de, #F610
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld iy, boss_sbul_pool
    ld b, 2
.sb_sat_slot:
    ld a, (iy+0)
    or a
    jr z, .sb_sat_hidden
    ld a, (iy+2)
    add a, #14
    dec a                      ; SCREEN 5 sprite Y is one line early
    out (VDP_DATA_PORT), a
    ld a, (iy+1)
    out (VDP_DATA_PORT), a
    ld a, #88
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jr .sb_sat_next
.sb_sat_hidden:
    ld a, #D4                  ; park unused bullets off-screen, NOT #D8:
    out (VDP_DATA_PORT), a     ; Y=216 is the sprite-mode-2 SAT terminator and
                               ; would hide the platform/player-bullet slots
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sb_sat_next:
    push bc
    ld bc, 5
    add iy, bc
    pop bc
    djnz .sb_sat_slot
    xor a
    ld e, a
    ld a, #0E
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_sbul_load
; ------------------------------------------------------------
; PURPOSE: Upload the bullet pattern + line colours and clear the pool. Called
;   from bitmap_boss_load once the boss is armed.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_sbul_load:
    xor a
    ld (boss_sbul_pool + 0), a
    ld (boss_sbul_pool + 5), a
    ld hl, bitmap_boss_sbul_pattern
    ld de, #FC40
    ld bc, 32
    call copy_to_vram_ext
    ld hl, bitmap_boss_sbul_colors
    ld de, #F440
    ld bc, 32
    jp copy_to_vram_ext


; ------------------------------------------------------------
; FUNCTION: draw_bitmap_end_screen
; ------------------------------------------------------------
; PURPOSE:
;   Draw the End-node message (GAME OVER / VICTORY / custom) centered on the
;   visible page. Clears the page to black first, then stamps each glyph scaled
;   2x (each lit font pixel -> a 2x2 HMMV block) so the text is legible. Runs
;   once at game end.
;
; INPUT:
;   HL = pointer to message data (DB charCount, charCount index bytes).
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
draw_bitmap_end_screen:
    ; 1. Clear the visible page (Y 0..191) to colour 1 (black).
    ld a, (bitmap_displayed_page)
    ld (bitmap_end_target_page), a
    ld hl, bitmap_end_fill_cmd
    ld a, (bitmap_end_target_page)
    or a
    jr z, .end_fill_page0
    ld a, 1
    ld (bitmap_end_fill_cmd + 7), a
.end_fill_page0:
    call bitmap_end_launch_cmd
    ; 2. Read the message and stamp each glyph.
    ld b, (hl)               ; B = char count
    inc hl
    ; Center X: text is charCount*16 px wide; center = 128 - charCount*8.
    ld a, b
    add a, a                 ; *2
    add a, a                 ; *4
    add a, a                 ; *8  -> A = charCount*8
    ld c, a
    ld a, 128
    sub c                    ; A = 128 - charCount*8 = centered start X
    ld (bitmap_end_cursor_x), a
    xor a
    ld (bitmap_end_cursor_char), a
.end_char_loop:
    ld a, b
    or a
    ret z                    ; all chars drawn
    push bc
    push hl
    ld a, (hl)               ; A = glyph index
    ; DE = font base + glyphIndex*8
    ld d, 0
    ld e, a
    ld hl, bitmap_end_font
    add hl, de
    add hl, de
    add hl, de               ; *3... no, need *8
    add hl, de
    add hl, de
    add hl, de
    add hl, de
    add hl, de               ; HL = font + glyphIndex*8 (8 rows)
    ld (bitmap_end_glyph_ptr), hl
    ld a, (bitmap_end_cursor_x)
    ld (bitmap_end_gx), a
    ld b, 8                  ; 8 font rows
.end_row_loop:
    push bc
    ld hl, (bitmap_end_glyph_ptr)
    ld c, (hl)               ; C = current row bitmask
    inc hl
    ld (bitmap_end_glyph_ptr), hl
    ld a, 8                  ; row index 0..7
    sub b
    ld e, a                  ; E = row index
    ; Compute Y = centerY + rowIndex*2. centerY = 80 (approx middle).
    add a, a                 ; rowIndex*2
    add a, 80
    ld (bitmap_end_gy), a
    ld b, 8                  ; 8 columns
    ld d, #80                ; bit mask start (leftmost pixel)
.end_col_loop:
    ld a, c
    and d
    jp z, .end_col_skip      ; pixel off -> skip
    ; Draw a 2x2 block at (gx + (8-b)*2, gy). HMMV fill 2x2 colour 15 (white).
    push bc
    push de
    ld a, 8
    sub b
    add a, a                 ; col offset *2
    ld d, a
    ld a, (bitmap_end_gx)
    add a, d
    ld (bitmap_end_block_cmd + 4), a    ; DX low
    xor a
    ld (bitmap_end_block_cmd + 5), a    ; DX high
    ld a, (bitmap_end_gy)
    ld (bitmap_end_block_cmd + 6), a    ; DY low
    ld a, (bitmap_end_target_page)
    or a
    jr z, .end_block_page0
    ld a, 1
    jr .end_block_page_set
.end_block_page0:
    xor a
.end_block_page_set:
    ld (bitmap_end_block_cmd + 7), a    ; DY high (page)
    ld hl, bitmap_end_block_cmd
    call bitmap_end_launch_cmd
    pop de
    pop bc
.end_col_skip:
    ld a, d
    rrca                    ; advance bit mask right
    ld d, a
    djnz .end_col_loop
    pop bc
    djnz .end_row_loop
    ; Advance cursor X by 16 px (2x glyph width).
    ld a, (bitmap_end_cursor_x)
    add a, 16
    ld (bitmap_end_cursor_x), a
    pop hl
    pop bc
    inc hl
    dec b
    jp .end_char_loop

; Launch a 15-byte V9938 command at HL. Restores R#15 to S#0.
bitmap_end_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld b, 15
.end_launch_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .end_launch_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_end_wait_key
; ------------------------------------------------------------
; PURPOSE: poll PPI keyboard row 8 until SPACE (bit 0) is pressed.
; ------------------------------------------------------------
bitmap_end_wait_key:
    call bitmap_wait_vblank
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    bit 0, a
    jp z, bitmap_end_wait_key
    ret

bitmap_end_target_page:   DB 0
bitmap_end_cursor_x:      DB 0
bitmap_end_cursor_char:   DB 0
bitmap_end_glyph_ptr:     DW 0
bitmap_end_gx:            DB 0
bitmap_end_gy:            DB 0
; Full-page clear to colour 1 (black): DX/DY 0, NX=256, NY=192, HMMV colour 1.
bitmap_end_fill_cmd:      DB 0,0, 0,0, 0,0, 0,0, 0,0, #C0,0, 1,0, #C0
; 2x2 white block HMMV: NX=2, NY=2, colour 15. DX/DY patched at runtime.
bitmap_end_block_cmd:     DB 0,0, 0,0, 0,0, 0,0, 2,0, 2,0, 15,0, #C0

; VDP palette bytes: byte1=(R<<4)|B, byte2=G
screen5_bitmap_palette_data:
    DB #00,#00,#00,#00,#70,#01,#16,#04,#21,#03,#03,#02,#30,#02,#20,#01
    DB #46,#05,#74,#04,#52,#05,#63,#06,#12,#04,#50,#06,#44,#04,#77,#07

; GameFlow intro scene 0 palette: byte1=(R<<4)|B, byte2=G
bitmap_intro_scene0_palette:
    DB #00,#00,#00,#00,#22,#05,#33,#06,#15,#01,#27,#02,#51,#01,#36,#06
    DB #72,#02,#74,#04,#52,#05,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07
; GameFlow intro scene bitmap RLE is emitted in Konami MegaROM data banks below.
bitmap_room_hud_seed_data:
; Persistent 256x20 HUD seed for page 0/1 is emitted in Konami MegaROM data banks below.

bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
; Shared world tileset RLE is emitted in Konami MegaROM data banks below.

bitmap_room_tileset_data_end:

bitmap_room_hud_heart_data:
; Classic hearts HUD disabled: linked MSX2 HUD asset owns the HUD band.

bitmap_room_hud_heart_data_end:

bitmap_room_hud_linked_data:
; Linked HUD dynamic widget tile/glyph RLE is emitted in Konami MegaROM data banks below.

bitmap_room_hud_linked_data_end:

; World engine dispatch tables (indexed by room/screen index).
bitmap_room_render_ptr_table_p0:
    DW bitmap_room_render_0_p0
    DW bitmap_room_render_1_p0
    DW bitmap_room_render_2_p0
    DW bitmap_room_render_3_p0
    DW bitmap_room_render_4_p0
    DW bitmap_room_render_5_p0
    DW bitmap_room_render_6_p0
    DW bitmap_room_render_7_p0
    DW bitmap_room_render_8_p0
    DW bitmap_room_render_9_p0
    DW bitmap_room_render_10_p0
    DW bitmap_room_render_11_p0
    DW bitmap_room_render_12_p0
bitmap_room_render_ptr_table_p1:
    DW bitmap_room_render_0_p1
    DW bitmap_room_render_1_p1
    DW bitmap_room_render_2_p1
    DW bitmap_room_render_3_p1
    DW bitmap_room_render_4_p1
    DW bitmap_room_render_5_p1
    DW bitmap_room_render_6_p1
    DW bitmap_room_render_7_p1
    DW bitmap_room_render_8_p1
    DW bitmap_room_render_9_p1
    DW bitmap_room_render_10_p1
    DW bitmap_room_render_11_p1
    DW bitmap_room_render_12_p1

; Konami data bank for each page 0 room render program
bitmap_room_render_bank_table_p0:
    DB bitmap_room_render_0_p0_DATA_BANK,bitmap_room_render_1_p0_DATA_BANK,bitmap_room_render_2_p0_DATA_BANK,bitmap_room_render_3_p0_DATA_BANK,bitmap_room_render_4_p0_DATA_BANK,bitmap_room_render_5_p0_DATA_BANK,bitmap_room_render_6_p0_DATA_BANK,bitmap_room_render_7_p0_DATA_BANK,bitmap_room_render_8_p0_DATA_BANK,bitmap_room_render_9_p0_DATA_BANK,bitmap_room_render_10_p0_DATA_BANK,bitmap_room_render_11_p0_DATA_BANK,bitmap_room_render_12_p0_DATA_BANK
; Konami data bank for each page 1 room render program
bitmap_room_render_bank_table_p1:
    DB bitmap_room_render_0_p1_DATA_BANK,bitmap_room_render_1_p1_DATA_BANK,bitmap_room_render_2_p1_DATA_BANK,bitmap_room_render_3_p1_DATA_BANK,bitmap_room_render_4_p1_DATA_BANK,bitmap_room_render_5_p1_DATA_BANK,bitmap_room_render_6_p1_DATA_BANK,bitmap_room_render_7_p1_DATA_BANK,bitmap_room_render_8_p1_DATA_BANK,bitmap_room_render_9_p1_DATA_BANK,bitmap_room_render_10_p1_DATA_BANK,bitmap_room_render_11_p1_DATA_BANK,bitmap_room_render_12_p1_DATA_BANK

bitmap_room_blockcount_table:
    DW 88
    DW 44
    DW 49
    DW 60
    DW 63
    DW 47
    DW 62
    DW 90
    DW 60
    DW 58
    DW 56
    DW 60
    DW 54

bitmap_room_collision_ptr_table:
    DW bitmap_room_collision_0
    DW bitmap_room_collision_1
    DW bitmap_room_collision_2
    DW bitmap_room_collision_3
    DW bitmap_room_collision_4
    DW bitmap_room_collision_5
    DW bitmap_room_collision_6
    DW bitmap_room_collision_7
    DW bitmap_room_collision_8
    DW bitmap_room_collision_9
    DW bitmap_room_collision_10
    DW bitmap_room_collision_11
    DW bitmap_room_collision_12

; Konami data bank for each room collision grid
bitmap_room_collision_bank_table:
    DB bitmap_room_collision_0_DATA_BANK,bitmap_room_collision_1_DATA_BANK,bitmap_room_collision_2_DATA_BANK,bitmap_room_collision_3_DATA_BANK,bitmap_room_collision_4_DATA_BANK,bitmap_room_collision_5_DATA_BANK,bitmap_room_collision_6_DATA_BANK,bitmap_room_collision_7_DATA_BANK,bitmap_room_collision_8_DATA_BANK,bitmap_room_collision_9_DATA_BANK,bitmap_room_collision_10_DATA_BANK,bitmap_room_collision_11_DATA_BANK,bitmap_room_collision_12_DATA_BANK

bitmap_room_behavior_ptr_table:
    DW bitmap_room_behavior_0
    DW bitmap_room_behavior_1
    DW bitmap_room_behavior_2
    DW bitmap_room_behavior_3
    DW bitmap_room_behavior_4
    DW bitmap_room_behavior_5
    DW bitmap_room_behavior_6
    DW bitmap_room_behavior_7
    DW bitmap_room_behavior_8
    DW bitmap_room_behavior_9
    DW bitmap_room_behavior_10
    DW bitmap_room_behavior_11
    DW bitmap_room_behavior_12

; Konami data bank for each room behavior grid
bitmap_room_behavior_bank_table:
    DB bitmap_room_behavior_0_DATA_BANK,bitmap_room_behavior_1_DATA_BANK,bitmap_room_behavior_2_DATA_BANK,bitmap_room_behavior_3_DATA_BANK,bitmap_room_behavior_4_DATA_BANK,bitmap_room_behavior_5_DATA_BANK,bitmap_room_behavior_6_DATA_BANK,bitmap_room_behavior_7_DATA_BANK,bitmap_room_behavior_8_DATA_BANK,bitmap_room_behavior_9_DATA_BANK,bitmap_room_behavior_10_DATA_BANK,bitmap_room_behavior_11_DATA_BANK,bitmap_room_behavior_12_DATA_BANK

; Edge rails per room: west,east,north,south (#FF = none)
bitmap_room_transition_table:
    DB #FF,#01,#FF,#05,#00,#02,#FF,#06,#01,#03,#FF,#07,#02,#08,#FF,#04
    DB #07,#0A,#03,#FF,#FF,#06,#00,#FF,#05,#07,#01,#FF,#06,#04,#02,#FF
    DB #03,#09,#FF,#FF,#08,#0B,#FF,#FF,#04,#FF,#FF,#FF,#09,#0C,#FF,#FF
    DB #0B,#FF,#FF,#FF

bitmap_room_spawn_x_table:
    DB 32,147,0,0,0,0,0,0,0,0,0,0,0
bitmap_room_spawn_y_table:
    DB 128,146,216,216,216,216,216,216,216,216,216,216,216

; Room 0 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_0:
    DB #20,#60,#01,#00
; Room 1 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_1:
; Room 2 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_2:
; Room 3 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_3:
; Room 4 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_4:
; Room 5 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_5:
; Room 6 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_6:
; Room 7 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_7:
; Room 8 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_8:
    DB #40,#10,#01,#01
; Room 9 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_9:
; Room 10 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_10:
; Room 11 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_11:
; Room 12 key pickup records: x,y,keyMask,pickupFlagOffset
bitmap_key_pickups_room_12:
; Room 0 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_0:
    DB #00,#80,#00,#40,#02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#00,#20,#00,#74,#00,#10,#00,#10,#00,#11,#00,#C0
; Room 1 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_1:
; Room 2 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_2:
; Room 3 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_3:
; Room 4 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_4:
; Room 5 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_5:
; Room 6 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_6:
; Room 7 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_7:
; Room 8 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_8:
    DB #01,#80,#00,#40,#02,#40,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#00,#40,#00,#24,#00,#10,#00,#10,#00,#00,#00,#C0
; Room 9 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_9:
; Room 10 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_10:
; Room 11 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_11:
; Room 12 key pickup visual records: pickupFlagOffset,drawCmd(15),eraseCmd(15)
bitmap_key_pickup_visuals_room_12:
; Room 0 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_0:
; Room 1 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_1:
; Room 2 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_2:
    DB #80,#80,#10,#20,#01,#02,#80,#80,#07,#00
; Room 3 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_3:
; Room 4 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_4:
; Room 5 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_5:
; Room 6 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_6:
    DB #90,#10,#10,#10,#01,#09,#00,#D8,#03,#01
; Room 7 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_7:
; Room 8 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_8:
; Room 9 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_9:
; Room 10 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_10:
; Room 11 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_11:
    DB #C0,#30,#10,#20,#01,#0B,#C0,#30,#07,#02
; Room 12 locked door records: x,y,w,h,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset
bitmap_key_doors_room_12:
; Room 0 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_0:
; Room 1 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_1:
; Room 2 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_2:
    DB #00,#03,#60,#00,#40,#02,#80,#00,#94,#00,#10,#00,#20,#00,#00,#00
    DB #D0,#70,#00,#40,#02,#80,#00,#94,#00,#10,#00,#20,#00,#00,#00,#D0
; Room 3 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_3:
; Room 4 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_4:
; Room 5 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_5:
; Room 6 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_6:
; Room 7 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_7:
; Room 8 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_8:
; Room 9 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_9:
; Room 10 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_10:
; Room 11 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_11:
    DB #02,#03,#60,#00,#40,#02,#C0,#00,#44,#00,#10,#00,#20,#00,#00,#00
    DB #D0,#70,#00,#40,#02,#C0,#00,#44,#00,#10,#00,#20,#00,#00,#00,#D0
; Room 12 door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)
bitmap_key_door_visuals_room_12:
; Room 0 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_0:
; Room 1 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_1:
; Room 2 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_2:
; Room 3 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_3:
; Room 4 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_4:
; Room 5 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_5:
; Room 6 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_6:
; Room 7 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_7:
; Room 8 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_8:
; Room 9 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_9:
; Room 10 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_10:
; Room 11 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_11:
; Room 12 pressure button records: x,y,targetDoorOpenOffset,flags
bitmap_pressure_buttons_room_12:
; Room 0 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_0:
; Room 1 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_1:
; Room 2 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_2:
; Room 3 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_3:
; Room 4 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_4:
; Room 5 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_5:
; Room 6 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_6:
; Room 7 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_7:
; Room 8 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_8:
; Room 9 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_9:
; Room 10 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_10:
; Room 11 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_11:
; Room 12 pressure button visual records: targetDoorOpenOffset,flags,releasedHMMM(15),pressedHMMM(15)
bitmap_pressure_button_visuals_room_12:
bitmap_key_pickup_ptr_table:
    DW bitmap_key_pickups_room_0
    DW bitmap_key_pickups_room_1
    DW bitmap_key_pickups_room_2
    DW bitmap_key_pickups_room_3
    DW bitmap_key_pickups_room_4
    DW bitmap_key_pickups_room_5
    DW bitmap_key_pickups_room_6
    DW bitmap_key_pickups_room_7
    DW bitmap_key_pickups_room_8
    DW bitmap_key_pickups_room_9
    DW bitmap_key_pickups_room_10
    DW bitmap_key_pickups_room_11
    DW bitmap_key_pickups_room_12
bitmap_key_pickup_count_table:
    DB 1,0,0,0,0,0,0,0,1,0,0,0,0
bitmap_key_pickup_visual_ptr_table:
    DW bitmap_key_pickup_visuals_room_0
    DW bitmap_key_pickup_visuals_room_1
    DW bitmap_key_pickup_visuals_room_2
    DW bitmap_key_pickup_visuals_room_3
    DW bitmap_key_pickup_visuals_room_4
    DW bitmap_key_pickup_visuals_room_5
    DW bitmap_key_pickup_visuals_room_6
    DW bitmap_key_pickup_visuals_room_7
    DW bitmap_key_pickup_visuals_room_8
    DW bitmap_key_pickup_visuals_room_9
    DW bitmap_key_pickup_visuals_room_10
    DW bitmap_key_pickup_visuals_room_11
    DW bitmap_key_pickup_visuals_room_12
bitmap_key_pickup_visual_count_table:
    DB 1,0,0,0,0,0,0,0,1,0,0,0,0
bitmap_key_door_ptr_table:
    DW bitmap_key_doors_room_0
    DW bitmap_key_doors_room_1
    DW bitmap_key_doors_room_2
    DW bitmap_key_doors_room_3
    DW bitmap_key_doors_room_4
    DW bitmap_key_doors_room_5
    DW bitmap_key_doors_room_6
    DW bitmap_key_doors_room_7
    DW bitmap_key_doors_room_8
    DW bitmap_key_doors_room_9
    DW bitmap_key_doors_room_10
    DW bitmap_key_doors_room_11
    DW bitmap_key_doors_room_12
bitmap_key_door_count_table:
    DB 0,0,1,0,0,0,1,0,0,0,0,1,0
bitmap_key_door_visual_ptr_table:
    DW bitmap_key_door_visuals_room_0
    DW bitmap_key_door_visuals_room_1
    DW bitmap_key_door_visuals_room_2
    DW bitmap_key_door_visuals_room_3
    DW bitmap_key_door_visuals_room_4
    DW bitmap_key_door_visuals_room_5
    DW bitmap_key_door_visuals_room_6
    DW bitmap_key_door_visuals_room_7
    DW bitmap_key_door_visuals_room_8
    DW bitmap_key_door_visuals_room_9
    DW bitmap_key_door_visuals_room_10
    DW bitmap_key_door_visuals_room_11
    DW bitmap_key_door_visuals_room_12
bitmap_key_door_visual_count_table:
    DB 0,0,1,0,0,0,0,0,0,0,0,1,0
bitmap_pressure_button_ptr_table:
    DW bitmap_pressure_buttons_room_0
    DW bitmap_pressure_buttons_room_1
    DW bitmap_pressure_buttons_room_2
    DW bitmap_pressure_buttons_room_3
    DW bitmap_pressure_buttons_room_4
    DW bitmap_pressure_buttons_room_5
    DW bitmap_pressure_buttons_room_6
    DW bitmap_pressure_buttons_room_7
    DW bitmap_pressure_buttons_room_8
    DW bitmap_pressure_buttons_room_9
    DW bitmap_pressure_buttons_room_10
    DW bitmap_pressure_buttons_room_11
    DW bitmap_pressure_buttons_room_12
bitmap_pressure_button_count_table:
    DB 0,0,0,0,0,0,0,0,0,0,0,0,0
bitmap_pressure_button_visual_ptr_table:
    DW bitmap_pressure_button_visuals_room_0
    DW bitmap_pressure_button_visuals_room_1
    DW bitmap_pressure_button_visuals_room_2
    DW bitmap_pressure_button_visuals_room_3
    DW bitmap_pressure_button_visuals_room_4
    DW bitmap_pressure_button_visuals_room_5
    DW bitmap_pressure_button_visuals_room_6
    DW bitmap_pressure_button_visuals_room_7
    DW bitmap_pressure_button_visuals_room_8
    DW bitmap_pressure_button_visuals_room_9
    DW bitmap_pressure_button_visuals_room_10
    DW bitmap_pressure_button_visuals_room_11
    DW bitmap_pressure_button_visuals_room_12
bitmap_pressure_button_visual_count_table:
    DB 0,0,0,0,0,0,0,0,0,0,0,0,0

; Room 0 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_0:
    DB #A0,#10,#00,#50,#00,#40,#02,#A0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#00,#A0,#00,#24,#00,#10,#00,#10,#00,#11,#00
    DB #C0
; Room 1 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_1:
    DB #90,#10,#01,#50,#00,#40,#02,#90,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#00,#90,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #C0,#40,#A0,#02,#50,#00,#40,#02,#40,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#00,#40,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#C0
; Room 2 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_2:
    DB #40,#60,#03,#50,#00,#40,#02,#40,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#00,#40,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #C0,#D0,#40,#04,#50,#00,#40,#02,#D0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#00,#D0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#C0,#90,#10,#05,#50,#00,#40,#02,#90,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#00,#90,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#C0
; Room 3 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_3:
; Room 4 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_4:
; Room 5 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_5:
; Room 6 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_6:
; Room 7 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_7:
; Room 8 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_8:
; Room 9 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_9:
; Room 10 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_10:
    DB #20,#30,#06,#50,#00,#40,#02,#20,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#00,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #C0,#70,#40,#07,#50,#00,#40,#02,#70,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#00,#70,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#C0,#B0,#60,#08,#50,#00,#40,#02,#B0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#00,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#C0,#20,#20,#09,#50,#00,#40,#02,#20,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#00,#20,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#C0,#20,#10,#0A,#50,#00,#40,#02,#20,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#00,#20,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#C0
; Room 11 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_11:
; Room 12 gem records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_gems_room_12:
bitmap_gem_ptr_table:
    DW bitmap_gems_room_0
    DW bitmap_gems_room_1
    DW bitmap_gems_room_2
    DW bitmap_gems_room_3
    DW bitmap_gems_room_4
    DW bitmap_gems_room_5
    DW bitmap_gems_room_6
    DW bitmap_gems_room_7
    DW bitmap_gems_room_8
    DW bitmap_gems_room_9
    DW bitmap_gems_room_10
    DW bitmap_gems_room_11
    DW bitmap_gems_room_12
bitmap_gem_count_table:
    DB 1,2,3,0,0,0,0,0,0,0,5,0,0


; Room 0 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_0:
; Room 1 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_1:
; Room 2 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_2:
; Room 3 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_3:
    DB #30,#90,#F8,#90,#00,#40,#02,#30,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#40,#02,#30,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0
; Room 4 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_4:
; Room 5 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_5:
; Room 6 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_6:
; Room 7 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_7:
; Room 8 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_8:
; Room 9 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_9:
; Room 10 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_10:
; Room 11 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_11:
; Room 12 jumper records: x,y,impulseByte,idleCmd(15),triggeredCmd(15)
bitmap_jumpers_room_12:
bitmap_jumper_ptr_table:
    DW bitmap_jumpers_room_0
    DW bitmap_jumpers_room_1
    DW bitmap_jumpers_room_2
    DW bitmap_jumpers_room_3
    DW bitmap_jumpers_room_4
    DW bitmap_jumpers_room_5
    DW bitmap_jumpers_room_6
    DW bitmap_jumpers_room_7
    DW bitmap_jumpers_room_8
    DW bitmap_jumpers_room_9
    DW bitmap_jumpers_room_10
    DW bitmap_jumpers_room_11
    DW bitmap_jumpers_room_12
bitmap_jumper_count_table:
    DB 0,0,0,1,0,0,0,0,0,0,0,0,0

; Room 0 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_0:
; Room 1 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_1:
; Room 2 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_2:
    DB #70,#60,#F8,#00,#C0,#00,#40,#02,#70,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#40,#02,#70,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0
; Room 3 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_3:
; Room 4 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_4:
; Room 5 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_5:
; Room 6 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_6:
; Room 7 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_7:
; Room 8 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_8:
; Room 9 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_9:
; Room 10 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_10:
; Room 11 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_11:
; Room 12 wall-jumper records: x,y,impulseByte,directionByte,idleCmd(15),triggeredCmd(15)
bitmap_walljumpers_room_12:
bitmap_walljumper_ptr_table:
    DW bitmap_walljumpers_room_0
    DW bitmap_walljumpers_room_1
    DW bitmap_walljumpers_room_2
    DW bitmap_walljumpers_room_3
    DW bitmap_walljumpers_room_4
    DW bitmap_walljumpers_room_5
    DW bitmap_walljumpers_room_6
    DW bitmap_walljumpers_room_7
    DW bitmap_walljumpers_room_8
    DW bitmap_walljumpers_room_9
    DW bitmap_walljumpers_room_10
    DW bitmap_walljumpers_room_11
    DW bitmap_walljumpers_room_12
bitmap_walljumper_count_table:
    DB 0,0,1,0,0,0,0,0,0,0,0,0,0

bitmap_dlg_npcs_room_0:
; Room 1 NPC records: x,y,dialogueIndex,talkKeyMask
bitmap_dlg_npcs_room_1:
    DB #C0,#A0,#00,#20
bitmap_dlg_npcs_room_2:
bitmap_dlg_npcs_room_3:
bitmap_dlg_npcs_room_4:
bitmap_dlg_npcs_room_5:
bitmap_dlg_npcs_room_6:
bitmap_dlg_npcs_room_7:
bitmap_dlg_npcs_room_8:
bitmap_dlg_npcs_room_9:
bitmap_dlg_npcs_room_10:
bitmap_dlg_npcs_room_11:
bitmap_dlg_npcs_room_12:
bitmap_dlg_npc_ptr_table:
    DW bitmap_dlg_npcs_room_0
    DW bitmap_dlg_npcs_room_1
    DW bitmap_dlg_npcs_room_2
    DW bitmap_dlg_npcs_room_3
    DW bitmap_dlg_npcs_room_4
    DW bitmap_dlg_npcs_room_5
    DW bitmap_dlg_npcs_room_6
    DW bitmap_dlg_npcs_room_7
    DW bitmap_dlg_npcs_room_8
    DW bitmap_dlg_npcs_room_9
    DW bitmap_dlg_npcs_room_10
    DW bitmap_dlg_npcs_room_11
    DW bitmap_dlg_npcs_room_12
bitmap_dlg_npc_count_table:
    DB 0,1,0,0,0,0,0,0,0,0,0,0,0
bitmap_dlg_cfg_ptr_table:
    DW bitmap_dlg_cfg_0
; Dialogue config: boxX,boxY,boxW,boxH,borderClr,bgClr,delay,mouthInt,textX,textY,textW,textH,stripSY(w),porX,porY,porMaxW,porMaxH,lineBase,lineCount
bitmap_dlg_cfg_0:
    DB #08,#1C,#F0,#38,#33,#11,#03,#04,#42,#22,#B0,#28,#60,#03,#0E,#22
    DB #30,#30,#00,#04
; 4 bytes/line: text ptr (word), flags (bit0 = waitForInput), portrait index (#FF none)
bitmap_dlg_line_records:
    DW bitmap_dlg_text_0
    DB 1, #02
    DW bitmap_dlg_text_1
    DB 1, #00
    DW bitmap_dlg_text_2
    DB 1, #01
    DW bitmap_dlg_text_3
    DB 1, #00
; Dialogue line 0 glyph indices (#FE newline, #FF end)
bitmap_dlg_text_0:
    DB #01,#02,#03,#04,#05,#02,#06,#00,#07,#05,#00,#08,#02,#00,#09,#0A
    DB #0B,#FE,#0C,#0A,#07,#04,#0D,#07,#00,#0B,#07,#00,#0A,#03,#00,#0E
    DB #02,#0F,#02,#10,#00,#11,#0B,#FE,#12,#13,#01,#0B,#10,#14,#01,#10
    DB #02,#01,#0A,#08,#07,#05,#02,#03,#00,#04,#02,#03,#FE,#0E,#0D,#07
    DB #00,#11,#0B,#00,#15,#16,#16,#00,#0E,#0B,#17,#0D,#0F,#02,#03,#0B
    DB #07,#FE,#11,#0B,#00,#0B,#0E,#01,#0A,#18,#0B,#00,#0F,#0B,#00,#0D
    DB #13,#0A,#11,#02,#FF
; Dialogue line 1 glyph indices (#FE newline, #FF end)
bitmap_dlg_text_1:
    DB #17,#0A,#07,#06,#00,#0B,#07,#0F,#0D,#0C,#0D,#00,#0C,#0A,#07,#04
    DB #0D,#03,#11,#02,#08,#0B,#FE,#01,#10,#02,#19,#0B,#07,#02,#10,#00
    DB #0E,#05,#00,#03,#0D,#1A,#0B,#00,#0B,#07,#0F,#0D,#FE,#11,#0B,#07
    DB #0F,#10,#02,#1B,#0D,#11,#0D,#FF
; Dialogue line 2 glyph indices (#FE newline, #FF end)
bitmap_dlg_text_2:
    DB #0E,#0D,#1C,#06,#00,#0C,#10,#02,#00,#04,#02,#10,#0F,#0D,#00,#13
    DB #0D,#00,#07,#05,#FE,#0E,#0B,#00,#0F,#10,#0D,#0B,#07,#00,#1D,#16
    DB #16,#00,#17,#0B,#0E,#0D,#07,#00,#0F,#0B,#FE,#04,#0B,#11,#02,#00
    DB #0A,#03,#00,#0E,#02,#0F,#02,#10,#FF
; Dialogue line 3 glyph indices (#FE newline, #FF end)
bitmap_dlg_text_3:
    DB #17,#0A,#07,#06,#00,#0B,#07,#02,#00,#0B,#07,#00,#0E,#0A,#04,#12
    DB #0D,#FE,#01,#0D,#07,#0F,#0D,#00,#04,#12,#0D,#1A,#0D,#08,#FF
; Portrait records: frameSY(word), width, height (closed at SX=0, open at SX=width)
bitmap_dlg_portrait_records:
    DB #68,#03,#30,#30,#98,#03,#30,#30,#C8,#03,#30,#30
; NPC dialogue glyph/portrait RLE is emitted in Konami MegaROM data banks below.

; End-node font (1bpp, 8 rows/glyph, 38 glyphs) for the bitmap GAME OVER text.
bitmap_end_font:
; 1bpp glyph rows in char-order: space,0-9,A-Z,:,-,/ (8 bytes each)

    DB #00,#00,#00,#00,#00,#00,#00,#00,#3C,#66,#6E,#76,#66,#66,#3C,#00
    DB #18,#38,#18,#18,#18,#18,#7E,#00,#3C,#66,#06,#1C,#30,#60,#7E,#00
    DB #3C,#66,#06,#1C,#06,#66,#3C,#00,#0C,#1C,#3C,#6C,#7E,#0C,#0C,#00
    DB #7E,#60,#7C,#06,#06,#66,#3C,#00,#1C,#30,#60,#7C,#66,#66,#3C,#00
    DB #7E,#06,#0C,#18,#30,#30,#30,#00,#3C,#66,#66,#3C,#66,#66,#3C,#00
    DB #3C,#66,#66,#3E,#06,#0C,#38,#00,#18,#3C,#66,#66,#7E,#66,#66,#00
    DB #7C,#66,#66,#7C,#66,#66,#7C,#00,#3C,#66,#60,#60,#60,#66,#3C,#00
    DB #78,#6C,#66,#66,#66,#6C,#78,#00,#7E,#60,#60,#7C,#60,#60,#7E,#00
    DB #7E,#60,#60,#7C,#60,#60,#60,#00,#3C,#66,#60,#6E,#66,#66,#3C,#00
    DB #66,#66,#66,#7E,#66,#66,#66,#00,#7E,#18,#18,#18,#18,#18,#7E,#00
    DB #1E,#0C,#0C,#0C,#0C,#6C,#38,#00,#66,#6C,#78,#70,#78,#6C,#66,#00
    DB #60,#60,#60,#60,#60,#60,#7E,#00,#63,#77,#7F,#6B,#63,#63,#63,#00
    DB #66,#76,#7E,#7E,#6E,#66,#66,#00,#3C,#66,#66,#66,#66,#66,#3C,#00
    DB #7C,#66,#66,#7C,#60,#60,#60,#00,#3C,#66,#66,#66,#6A,#6C,#36,#00
    DB #7C,#66,#66,#7C,#78,#6C,#66,#00,#3C,#66,#60,#3C,#06,#66,#3C,#00
    DB #7E,#18,#18,#18,#18,#18,#18,#00,#66,#66,#66,#66,#66,#66,#3C,#00
    DB #66,#66,#66,#66,#66,#3C,#18,#00,#63,#63,#63,#6B,#7F,#77,#63,#00
    DB #66,#66,#3C,#18,#3C,#66,#66,#00,#66,#66,#66,#3C,#18,#18,#18,#00
    DB #7E,#06,#0C,#18,#30,#60,#7E,#00,#00,#18,#18,#00,#00,#18,#18,#00
    DB #00,#00,#00,#7E,#00,#00,#00,#00,#06,#0C,#0C,#18,#30,#30,#60,#00

; Per-room render programs, collision maps and behavior maps.
; Per-room render programs, collision maps and behavior maps are emitted in Konami MegaROM data banks below.


; Room 0 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 1 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 2 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_2:
    DB #02,#30,#A0,#01,#00,#30,#64,#A0,#A0,#00,#00,#02,#08,#00,#00,#00
    DB #01,#01,#01,#0E,#0E,#02,#00,#30,#A0,#01,#00,#30,#64,#A0,#A0,#04
    DB #02,#02,#08,#00,#00,#00,#01,#01,#01,#0E,#0E,#02,#00
; Room 3 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 4 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_4:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 5 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_5:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 6 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_6:
    DB #02,#50,#20,#01,#00,#00,#F0,#20,#20,#00,#00,#02,#08,#00,#00,#00
    DB #01,#01,#01,#0E,#0E,#02,#00,#50,#20,#01,#00,#00,#F0,#20,#20,#04
    DB #02,#02,#08,#00,#00,#00,#01,#01,#01,#0E,#0E,#02,#00
; Room 7 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_7:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 8 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_8:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 9 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_9:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 10 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_10:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 11 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_11:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
; Room 12 enemies: count + 2 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_12:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#10,#10,#01,#00
bitmap_room_enemy_ptr_table:
    DW bitmap_room_enemy_table_0
    DW bitmap_room_enemy_table_1
    DW bitmap_room_enemy_table_2
    DW bitmap_room_enemy_table_3
    DW bitmap_room_enemy_table_4
    DW bitmap_room_enemy_table_5
    DW bitmap_room_enemy_table_6
    DW bitmap_room_enemy_table_7
    DW bitmap_room_enemy_table_8
    DW bitmap_room_enemy_table_9
    DW bitmap_room_enemy_table_10
    DW bitmap_room_enemy_table_11
    DW bitmap_room_enemy_table_12
; Enemy sprites: 8 pattern group(s), [right, left] variant pair per frame (mode 2 quadrants)
bitmap_enemy_sprite_patterns:
    DB #1F,#3F,#30,#27,#0E,#00,#0E,#07,#07,#03,#00,#00,#06,#07,#03,#07
    DB #80,#FC,#00,#C0,#C0,#40,#60,#A0,#C0,#80,#00,#00,#00,#00,#C0,#C0
    DB #01,#3F,#00,#03,#03,#02,#06,#05,#03,#01,#00,#00,#00,#00,#03,#03
    DB #F8,#FC,#0C,#E4,#70,#00,#70,#E0,#E0,#C0,#00,#00,#60,#E0,#C0,#E0
    DB #00,#1F,#3F,#30,#27,#0E,#00,#0E,#07,#06,#03,#12,#5C,#40,#18,#18
    DB #00,#80,#FC,#00,#C0,#C0,#40,#60,#A0,#40,#80,#00,#80,#E0,#E0,#E0
    DB #00,#01,#3F,#00,#03,#03,#02,#06,#05,#02,#01,#00,#01,#07,#07,#07
    DB #00,#F8,#FC,#0C,#E4,#70,#00,#70,#E0,#60,#C0,#48,#3A,#02,#18,#18
    DB #00,#00,#07,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#04,#00
    DB #00,#00,#C0,#00,#80,#80,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#E0,#00,#08,#08,#00,#00,#00,#00,#00,#00,#00,#00,#20,#00
    DB #00,#00,#00,#07,#00,#10,#10,#00,#00,#00,#00,#00,#60,#70,#20,#00
    DB #00,#00,#00,#C0,#00,#80,#80,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#03,#00,#01,#01,#00,#00,#00,#00,#00,#00,#08,#08,#00
    DB #00,#00,#00,#E0,#00,#08,#08,#00,#00,#00,#00,#00,#06,#0E,#04,#00
; Enemy sprites: 16-byte line colour tables per unique sprite layer frame
bitmap_enemy_sprite_colors:
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#0F,#0F,#02,#02,#0D,#0F
    DB #0F,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#0D,#0F
    DB #0F,#0F,#0D,#0F,#4D,#0D,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0F,#0F,#0F,#0D,#0F,#4D,#0D,#0F,#0F,#0F,#0F,#0F,#4D,#4D,#0F,#0F


; Room 0 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 1 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_1:
    DB #01,#C0,#50,#00,#01,#C0,#C0,#37,#78,#01,#00,#00
; Room 2 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_2:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 3 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 4 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_4:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 5 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_5:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 6 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_6:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 7 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_7:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 8 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_8:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 9 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_9:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 10 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_10:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 11 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_11:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
; Room 12 platforms: count + 1 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_12:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00
bitmap_room_platform_ptr_table:
    DW bitmap_room_platform_table_0
    DW bitmap_room_platform_table_1
    DW bitmap_room_platform_table_2
    DW bitmap_room_platform_table_3
    DW bitmap_room_platform_table_4
    DW bitmap_room_platform_table_5
    DW bitmap_room_platform_table_6
    DW bitmap_room_platform_table_7
    DW bitmap_room_platform_table_8
    DW bitmap_room_platform_table_9
    DW bitmap_room_platform_table_10
    DW bitmap_room_platform_table_11
    DW bitmap_room_platform_table_12
; Platform sprites: 1 pattern group(s) (mode 2 quadrants, frame 0 only)
bitmap_platform_sprite_patterns:
    DB #FF,#FF,#92,#FF,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #FF,#FF,#49,#FF,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Platform sprites: 16-byte line colour tables per cell (frame 0 only)
bitmap_platform_sprite_colors:
    DB #09,#09,#09,#09,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F


; ---- bitmap BOSS per-room tables (stride 20) ----
; present, x0, y0, dx, dy, minX, maxX, minY, maxY, sxLo, sxHi, syLo, syHi,
; width, height, frames, animDelay, hp, damage, interval
bitmap_boss_room_0:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_1:
    db #01, #40, #20, #01, #00, #10, #A0, #20, #20, #00, #00, #70, #02, #40, #40, #01, #0C, #03, #01, #03
bitmap_boss_room_2:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_3:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_4:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_5:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_6:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_7:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_8:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_9:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_10:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_11:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_room_12:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_ptr_table:
    dw bitmap_boss_room_0
    dw bitmap_boss_room_1
    dw bitmap_boss_room_2
    dw bitmap_boss_room_3
    dw bitmap_boss_room_4
    dw bitmap_boss_room_5
    dw bitmap_boss_room_6
    dw bitmap_boss_room_7
    dw bitmap_boss_room_8
    dw bitmap_boss_room_9
    dw bitmap_boss_room_10
    dw bitmap_boss_room_11
    dw bitmap_boss_room_12

; ---- boss defeat action bytecode per room (END=#00, SET_FLAG=#01,idx) ----
bitmap_boss_defeat_room_0:
    db #00
bitmap_boss_defeat_room_1:
    db #01, #00, #02, #01, #00
bitmap_boss_defeat_room_2:
    db #00
bitmap_boss_defeat_room_3:
    db #00
bitmap_boss_defeat_room_4:
    db #00
bitmap_boss_defeat_room_5:
    db #00
bitmap_boss_defeat_room_6:
    db #00
bitmap_boss_defeat_room_7:
    db #00
bitmap_boss_defeat_room_8:
    db #00
bitmap_boss_defeat_room_9:
    db #00
bitmap_boss_defeat_room_10:
    db #00
bitmap_boss_defeat_room_11:
    db #00
bitmap_boss_defeat_room_12:
    db #00
bitmap_boss_defeat_ptr_table:
    dw bitmap_boss_defeat_room_0
    dw bitmap_boss_defeat_room_1
    dw bitmap_boss_defeat_room_2
    dw bitmap_boss_defeat_room_3
    dw bitmap_boss_defeat_room_4
    dw bitmap_boss_defeat_room_5
    dw bitmap_boss_defeat_room_6
    dw bitmap_boss_defeat_room_7
    dw bitmap_boss_defeat_room_8
    dw bitmap_boss_defeat_room_9
    dw bitmap_boss_defeat_room_10
    dw bitmap_boss_defeat_room_11
    dw bitmap_boss_defeat_room_12

; ---- boss chain-barrier per-room table (present, sxLo, sxHi, syLo, syHi) ----
bitmap_boss_barrier_room_0:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_1:
    db #01, #40, #00, #70, #02
bitmap_boss_barrier_room_2:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_3:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_4:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_5:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_6:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_7:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_8:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_9:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_10:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_11:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_room_12:
    db #00, #00, #00, #00, #00
bitmap_boss_barrier_ptr_table:
    dw bitmap_boss_barrier_room_0
    dw bitmap_boss_barrier_room_1
    dw bitmap_boss_barrier_room_2
    dw bitmap_boss_barrier_room_3
    dw bitmap_boss_barrier_room_4
    dw bitmap_boss_barrier_room_5
    dw bitmap_boss_barrier_room_6
    dw bitmap_boss_barrier_room_7
    dw bitmap_boss_barrier_room_8
    dw bitmap_boss_barrier_room_9
    dw bitmap_boss_barrier_room_10
    dw bitmap_boss_barrier_room_11
    dw bitmap_boss_barrier_room_12

; ---- boss projectile config per room ----
; present, sxLo, sxHi, syLo, syHi, w, h, interval, speed, damage
bitmap_boss_projectile_room_0:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_1:
    db #01, #00, #00, #00, #00, #10, #10, #28, #03, #01, #01
bitmap_boss_projectile_room_2:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_3:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_4:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_5:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_6:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_7:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_8:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_9:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_10:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_11:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_room_12:
    db #00, #00, #00, #00, #00, #00, #00, #00, #00, #00, #00
bitmap_boss_projectile_ptr_table:
    dw bitmap_boss_projectile_room_0
    dw bitmap_boss_projectile_room_1
    dw bitmap_boss_projectile_room_2
    dw bitmap_boss_projectile_room_3
    dw bitmap_boss_projectile_room_4
    dw bitmap_boss_projectile_room_5
    dw bitmap_boss_projectile_room_6
    dw bitmap_boss_projectile_room_7
    dw bitmap_boss_projectile_room_8
    dw bitmap_boss_projectile_room_9
    dw bitmap_boss_projectile_room_10
    dw bitmap_boss_projectile_room_11
    dw bitmap_boss_projectile_room_12

; ---- boss attack phases per room: count, (hpAtOrBelow, interval, speed)* ----
bitmap_boss_phase_room_0:
    db #00
bitmap_boss_phase_room_1:
    db #03, #01, #0F, #04, #02, #19, #03, #03, #28, #03
bitmap_boss_phase_room_2:
    db #00
bitmap_boss_phase_room_3:
    db #00
bitmap_boss_phase_room_4:
    db #00
bitmap_boss_phase_room_5:
    db #00
bitmap_boss_phase_room_6:
    db #00
bitmap_boss_phase_room_7:
    db #00
bitmap_boss_phase_room_8:
    db #00
bitmap_boss_phase_room_9:
    db #00
bitmap_boss_phase_room_10:
    db #00
bitmap_boss_phase_room_11:
    db #00
bitmap_boss_phase_room_12:
    db #00
bitmap_boss_phase_ptr_table:
    dw bitmap_boss_phase_room_0
    dw bitmap_boss_phase_room_1
    dw bitmap_boss_phase_room_2
    dw bitmap_boss_phase_room_3
    dw bitmap_boss_phase_room_4
    dw bitmap_boss_phase_room_5
    dw bitmap_boss_phase_room_6
    dw bitmap_boss_phase_room_7
    dw bitmap_boss_phase_room_8
    dw bitmap_boss_phase_room_9
    dw bitmap_boss_phase_room_10
    dw bitmap_boss_phase_room_11
    dw bitmap_boss_phase_room_12

; ---- boss damage zones per room: count, (x, y, w, h, kind, multiplier)* ----
; kind 0 = invulnerable armour (bullet dies, no damage), 1 = weak point.
bitmap_boss_zone_room_0:
    db #00
bitmap_boss_zone_room_1:
    db #03, #11, #14, #0A, #08, #01, #02, #25, #14, #0A, #08, #01, #02, #00, #00, #40, #40, #00, #01
bitmap_boss_zone_room_2:
    db #00
bitmap_boss_zone_room_3:
    db #00
bitmap_boss_zone_room_4:
    db #00
bitmap_boss_zone_room_5:
    db #00
bitmap_boss_zone_room_6:
    db #00
bitmap_boss_zone_room_7:
    db #00
bitmap_boss_zone_room_8:
    db #00
bitmap_boss_zone_room_9:
    db #00
bitmap_boss_zone_room_10:
    db #00
bitmap_boss_zone_room_11:
    db #00
bitmap_boss_zone_room_12:
    db #00
bitmap_boss_zone_ptr_table:
    dw bitmap_boss_zone_room_0
    dw bitmap_boss_zone_room_1
    dw bitmap_boss_zone_room_2
    dw bitmap_boss_zone_room_3
    dw bitmap_boss_zone_room_4
    dw bitmap_boss_zone_room_5
    dw bitmap_boss_zone_room_6
    dw bitmap_boss_zone_room_7
    dw bitmap_boss_zone_room_8
    dw bitmap_boss_zone_room_9
    dw bitmap_boss_zone_room_10
    dw bitmap_boss_zone_room_11
    dw bitmap_boss_zone_room_12

; ---- boss sprite-bullet pattern: 16x16 sprite with an 8x8 blob CENTRED ----
; Rows 4..11, columns 4..11 are set; everything else transparent. This keeps the
; bullet visually small WITHOUT changing R#1 or any VRAM sprite-size config.
; V9938 16x16 layout: quadrants TL(8) BL(8) TR(8) BR(8), 8 rows each.
bitmap_boss_sbul_pattern:
    db #00, #00, #00, #00, #0F, #0F, #0F, #0F   ; TL: rows 0-7, cols 0-7
    db #0F, #0F, #0F, #0F, #00, #00, #00, #00   ; BL: rows 8-15, cols 0-7
    db #00, #00, #00, #00, #F0, #F0, #F0, #F0   ; TR: rows 0-7, cols 8-15
    db #F0, #F0, #F0, #F0, #00, #00, #00, #00   ; BR: rows 8-15, cols 8-15
; Sprite-mode-2 line colours: one 16-byte block per bullet slot.
bitmap_boss_sbul_colors:
    db #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A
    db #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A, #0A

; Sprite 0 line color table (mode 2): configured player sprite "demon_destroy" + 1 state clip(s)
bitmap_room_sprite_colors:
    DB #0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0B
    DB #4D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#0D,#0D,#0D,#0F,#0F,#0F,#0F
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0D,#0B
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0F
    DB #0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0B
    DB #4D,#4D,#4D,#0D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0D,#0B
    DB #4D,#4D,#4D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0F

bitmap_room_sprite_colors_end:

; SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing
bitmap_room_sprite_attrs:
    DB #60,#80,#00,#00,#60,#80,#04,#00,#70,#80,#08,#00,#70,#80,#0C,#00
    DB #D8,#00,#00,#00

bitmap_room_sprite_attrs_end:

; Sprite 0 pattern (16x16, mode 2 quadrants): configured player sprite "demon_destroy" + 1 state clip(s)
bitmap_room_sprite_patterns:
    DB #00,#02,#02,#02,#00,#01,#3E,#01,#C6,#0A,#12,#22,#24,#01,#00,#40
    DB #00,#02,#04,#04,#80,#4E,#84,#00,#02,#62,#72,#3E,#2E,#28,#20,#0C
    DB #00,#00,#01,#01,#01,#00,#00,#00,#01,#01,#01,#00,#01,#00,#40,#C0
    DB #00,#00,#02,#02,#04,#B0,#78,#FC,#FC,#1C,#0C,#D0,#E8,#EC,#CC,#F0
    DB #C1,#80,#01,#02,#02,#06,#06,#02,#0D,#00,#06,#04,#04,#04,#07,#07
    DB #94,#88,#20,#40,#40,#20,#06,#A1,#59,#90,#10,#00,#20,#20,#38,#38
    DB #40,#41,#40,#41,#41,#41,#21,#1E,#01,#03,#01,#03,#00,#00,#00,#00
    DB #60,#30,#C0,#A0,#A0,#C0,#E0,#B6,#44,#20,#A0,#20,#00,#00,#00,#00
    DB #01,#01,#01,#00,#00,#0F,#10,#23,#45,#49,#09,#0A,#08,#00,#40,#E0
    DB #01,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#E0,#40
    DB #00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30
    DB #A0,#01,#02,#02,#06,#06,#1C,#0C,#00,#00,#00,#01,#01,#01,#01,#01
    DB #44,#20,#40,#46,#21,#19,#00,#00,#80,#80,#80,#00,#00,#00,#C0,#C0
    DB #40,#40,#41,#41,#41,#21,#02,#01,#03,#01,#01,#00,#00,#00,#00,#00
    DB #98,#C0,#A0,#A0,#D6,#E4,#A0,#40,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#01,#01,#01,#00,#00,#1F,#20,#C3,#05,#09,#01,#18,#3C,#7E,#66
    DB #00,#01,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#18,#3C,#7E,#7E
    DB #00,#00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78
    DB #66,#1C,#19,#02,#02,#06,#06,#1C,#0C,#00,#06,#04,#04,#04,#07,#07
    DB #CA,#44,#20,#40,#46,#21,#19,#00,#00,#90,#10,#00,#20,#20,#38,#38
    DB #7E,#3C,#58,#41,#41,#41,#21,#02,#01,#03,#01,#03,#00,#00,#00,#00
    DB #30,#98,#C0,#A0,#A0,#D6,#E4,#A0,#40,#20,#A0,#20,#00,#00,#00,#00
    DB #01,#01,#01,#00,#00,#0F,#10,#23,#45,#49,#09,#0A,#08,#00,#10,#38
    DB #01,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#38
    DB #00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30
    DB #28,#39,#12,#02,#06,#06,#1C,#0C,#00,#00,#00,#01,#01,#01,#01,#01
    DB #44,#20,#40,#46,#21,#19,#00,#00,#80,#80,#80,#00,#00,#00,#C0,#C0
    DB #28,#78,#51,#41,#41,#21,#02,#01,#03,#01,#01,#00,#00,#00,#00,#00
    DB #98,#C0,#A0,#A0,#D6,#E4,#A0,#40,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#40,#20,#20,#01,#72,#21,#00,#40,#46,#4E,#7C,#74,#14,#04,#30
    DB #00,#40,#40,#40,#00,#80,#7C,#80,#63,#50,#48,#44,#24,#80,#00,#02
    DB #00,#00,#40,#40,#20,#0D,#1E,#3F,#3F,#38,#30,#0B,#17,#37,#33,#0F
    DB #00,#00,#80,#80,#80,#00,#00,#00,#80,#80,#80,#00,#80,#00,#02,#03
    DB #29,#11,#04,#02,#02,#04,#60,#85,#9A,#09,#08,#00,#04,#04,#1C,#1C
    DB #83,#01,#80,#40,#40,#60,#60,#40,#B0,#00,#60,#20,#20,#20,#E0,#E0
    DB #06,#0C,#03,#05,#05,#03,#07,#6D,#22,#04,#05,#04,#00,#00,#00,#00
    DB #02,#82,#02,#82,#82,#82,#84,#78,#80,#C0,#80,#C0,#00,#00,#00,#00
    DB #80,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53
    DB #80,#80,#80,#00,#00,#F0,#08,#C4,#A2,#92,#90,#50,#10,#00,#02,#07
    DB #00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#07,#02
    DB #22,#04,#02,#62,#84,#98,#00,#00,#01,#01,#01,#00,#00,#00,#03,#03
    DB #05,#80,#40,#40,#60,#60,#38,#30,#00,#00,#00,#80,#80,#80,#80,#80
    DB #19,#03,#05,#05,#6B,#27,#05,#02,#00,#00,#00,#00,#00,#00,#00,#00
    DB #02,#02,#82,#82,#82,#84,#40,#80,#C0,#80,#80,#00,#00,#00,#00,#00
    DB #00,#80,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60
    DB #00,#80,#80,#80,#00,#00,#F8,#04,#C3,#A0,#90,#80,#18,#3C,#7E,#66
    DB #00,#00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#18,#3C,#7E,#7E
    DB #53,#22,#04,#02,#62,#84,#98,#00,#00,#09,#08,#00,#04,#04,#1C,#1C
    DB #66,#38,#98,#40,#40,#60,#60,#38,#30,#00,#60,#20,#20,#20,#E0,#E0
    DB #0C,#19,#03,#05,#05,#6B,#27,#05,#02,#04,#05,#04,#00,#00,#00,#00
    DB #7E,#3C,#1A,#82,#82,#82,#84,#40,#80,#C0,#80,#C0,#00,#00,#00,#00
    DB #80,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53
    DB #80,#80,#80,#00,#00,#F0,#08,#C4,#A2,#92,#90,#50,#10,#00,#08,#1C
    DB #00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#08,#1C
    DB #22,#04,#02,#62,#84,#98,#00,#00,#01,#01,#01,#00,#00,#00,#03,#03
    DB #14,#9C,#48,#40,#60,#60,#38,#30,#00,#00,#00,#80,#80,#80,#80,#80
    DB #19,#03,#05,#05,#6B,#27,#05,#02,#00,#00,#00,#00,#00,#00,#00,#00
    DB #14,#1E,#8A,#82,#82,#84,#40,#80,#C0,#80,#80,#00,#00,#00,#00,#00

bitmap_room_sprite_patterns_end:

; Player animation clip table: id 0 = base idle/walk, ids 1..1 = state
; clips. 3 bytes/entry: frameBase, frameCount, delayFrames. Indexed by player_anim_state.
; 1=perceiving(base 2,2f)
bitmap_player_anim_clip_table:
    DB #00,#02,#08,#02,#02,#08


; Shoot skill: 16x16 bullet sprite pattern (mode 2 quadrants)
bitmap_bullet_pattern_data:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
bitmap_bullet_pattern_data_end:
; Shoot skill: 16-byte line colour table for the bullet sprite
bitmap_bullet_color_data:
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
bitmap_bullet_color_data_end:
    ds #C000 - $, #FF
; --- SCREEN 5 bitmap-room Konami SCC MegaROM data banks ---
BITMAP_ROOM_DATA_BANK_4_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_4_ROM_START:
; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE; VRAM #00000, raw 2560 bytes, RLE 66 bytes
bitmap_room_hud_seed_p0_rle_chunk_0:
    DB #FF,#11,#4E,#11,#01,#BB,#7E,#11,#01,#1B,#01,#BB,#01,#B1,#7D,#11
    DB #02,#BB,#01,#FB,#7D,#11,#01,#BB,#01,#BD,#01,#DF,#7D,#11,#02,#BB
    DB #01,#DD,#7D,#11,#03,#BB,#7D,#11,#03,#BB,#7D,#11,#01,#1B,#01,#BB
    DB #01,#B1,#7E,#11,#01,#BB,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#36,#11
    DB #80,#FF
bitmap_room_hud_seed_p0_rle_chunk_0_end:

; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE; VRAM #08000, raw 2560 bytes, RLE 66 bytes
bitmap_room_hud_seed_p1_rle_chunk_0:
    DB #FF,#11,#4E,#11,#01,#BB,#7E,#11,#01,#1B,#01,#BB,#01,#B1,#7D,#11
    DB #02,#BB,#01,#FB,#7D,#11,#01,#BB,#01,#BD,#01,#DF,#7D,#11,#02,#BB
    DB #01,#DD,#7D,#11,#03,#BB,#7D,#11,#03,#BB,#7D,#11,#01,#1B,#01,#BB
    DB #01,#B1,#7E,#11,#01,#BB,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#36,#11
    DB #80,#FF
bitmap_room_hud_seed_p1_rle_chunk_0_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #10000, raw 7173 bytes, RLE 7936 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #01,#06,#06,#66,#01,#60,#03,#00,#01,#90,#01,#04,#01,#90,#05,#00
    DB #01,#E0,#01,#04,#01,#E0,#02,#00,#03,#66,#01,#76,#04,#66,#01,#6E
    DB #05,#EE,#01,#6E,#01,#EE,#01,#00,#01,#05,#01,#33,#01,#35,#01,#88
    DB #01,#35,#01,#55,#01,#53,#01,#35,#01,#53,#01,#33,#01,#55,#01,#35
    DB #01,#55,#01,#33,#09,#00,#01,#06,#01,#66,#01,#60,#01,#06,#01,#66
    DB #01,#60,#01,#00,#02,#06,#01,#66,#01,#60,#01,#06,#01,#66,#01,#60
    DB #01,#00,#01,#06,#21,#00,#0A,#33,#01,#83,#03,#33,#01,#30,#01,#60
    DB #05,#00,#01,#07,#01,#77,#02,#00,#01,#04,#02,#44,#01,#40,#04,#00
    DB #01,#04,#02,#44,#01,#40,#02,#00,#03,#66,#01,#7E,#01,#77,#01,#76
    DB #02,#66,#01,#EE,#07,#77,#01,#08,#01,#85,#02,#00,#01,#88,#01,#80
    DB #01,#0F,#02,#00,#01,#08,#01,#80,#03,#00,#01,#38,#01,#80,#01,#66
    DB #05,#EE,#01,#E6,#01,#EE,#01,#06,#01,#6E,#03,#66,#01,#E6,#02,#66
    DB #01,#06,#05,#EE,#02,#66,#20,#00,#01,#03,#0D,#00,#01,#08,#01,#33
    DB #01,#60,#06,#00,#01,#77,#02,#00,#01,#04,#01,#47,#01,#77,#01,#40
    DB #04,#00,#01,#04,#01,#46,#01,#66,#01,#40,#02,#00,#03,#66,#01,#11
    DB #05,#66,#01,#77,#02,#66,#01,#67,#01,#76,#02,#66,#01,#53,#05,#00
    DB #01,#0F,#04,#00,#01,#F0,#02,#00,#01,#88,#01,#35,#01,#6E,#06,#66
    DB #01,#E6,#01,#06,#01,#E4,#01,#E6,#03,#66,#01,#6E,#01,#46,#01,#06
    DB #02,#EE,#01,#AE,#02,#EE,#01,#6E,#01,#E6,#20,#00,#01,#38,#01,#00
    DB #01,#80,#02,#00,#01,#08,#01,#00,#01,#08,#01,#00,#01,#08,#01,#00
    DB #01,#80,#02,#00,#01,#88,#01,#35,#01,#60,#06,#00,#01,#77,#02,#00
    DB #02,#44,#01,#47,#01,#77,#01,#90,#03,#00,#02,#44,#01,#46,#01,#66
    DB #01,#E0,#01,#00,#03,#66,#01,#11,#04,#66,#01,#E6,#01,#66,#01,#E6
    DB #02,#66,#01,#6E,#02,#66,#01,#53,#01,#8F,#03,#88,#01,#F0,#01,#F8
    DB #03,#88,#01,#0F,#02,#88,#01,#F8,#01,#88,#01,#55,#08,#66,#01,#06
    DB #02,#66,#01,#6E,#01,#66,#01,#E6,#01,#76,#01,#66,#01,#06,#02,#66
    DB #01,#6E,#02,#E6,#01,#76,#01,#66,#20,#00,#01,#58,#01,#83,#01,#38
    DB #02,#88,#01,#83,#01,#88,#01,#83,#01,#88,#01,#83,#03,#88,#01,#38
    DB #01,#33,#01,#35,#01,#60,#06,#00,#01,#77,#01,#00,#01,#09,#01,#74
    DB #02,#44,#01,#77,#01,#40,#02,#00,#01,#0E,#01,#64,#02,#44,#01,#66
    DB #01,#40,#01,#00,#02,#66,#01,#16,#01,#E6,#05,#66,#01,#76,#06,#66
    DB #01,#53,#01,#88,#01,#33,#01,#88,#01,#35,#01,#38,#01,#83,#01,#53
    DB #01,#35,#01,#53,#01,#88,#01,#33,#01,#83,#01,#88,#01,#35,#01,#53
    DB #01,#76,#08,#66,#01,#06,#01,#67,#01,#66,#01,#67,#01,#66,#01,#47
    DB #02,#66,#02,#77,#01,#66,#01,#67,#01,#66,#01,#77,#01,#66,#20,#00
    DB #01,#33,#01,#35,#01,#55,#01,#83,#01,#58,#01,#35,#01,#53,#01,#55
    DB #01,#38,#01,#35,#03,#33,#01,#53,#02,#55,#01,#60,#06,#00,#01,#77
    DB #01,#00,#01,#04,#03,#44,#01,#77,#01,#70,#02,#00,#01,#04,#03,#44
    DB #01,#66,#01,#60,#01,#00,#02,#66,#01,#11,#05,#66,#01,#67,#07,#66
    DB #01,#05,#01,#83,#01,#53,#01,#33,#01,#53,#01,#33,#01,#85,#01,#33
    DB #01,#53,#01,#33,#01,#88,#01,#55,#01,#35,#01,#33,#01,#55,#01,#50
    DB #01,#76,#08,#66,#01,#60,#01,#67,#01,#66,#01,#76,#02,#66,#01,#76
    DB #01,#B6,#01,#77,#01,#67,#01,#76,#03,#77,#01,#76,#0D,#00,#01,#0B
    DB #02,#BB,#01,#B0,#0F,#00,#02,#35,#01,#33,#01,#35,#01,#33,#01,#53
    DB #01,#33,#01,#53,#01,#33,#01,#53,#03,#33,#01,#53,#01,#35,#01,#55
    DB #01,#60,#06,#00,#01,#77,#01,#04,#04,#44,#01,#77,#01,#74,#01,#00
    DB #01,#04,#04,#44,#01,#66,#01,#64,#01,#00,#02,#66,#01,#11,#03,#66
    DB #01,#6E,#01,#66,#01,#67,#01,#76,#06,#66,#01,#05,#01,#83,#07,#33
    DB #01,#88,#03,#33,#01,#35,#01,#53,#01,#50,#0B,#66,#01,#06,#01,#66
    DB #01,#76,#01,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#77,#02,#76
    DB #01,#67,#01,#76,#0C,#00,#01,#0A,#01,#AE,#04,#AA,#01,#A0,#0D,#00
    DB #07,#33,#01,#38,#06,#33,#01,#35,#01,#53,#01,#60,#06,#00,#01,#77
    DB #01,#44,#01,#47,#01,#77,#01,#44,#01,#74,#01,#77,#01,#70,#01,#00
    DB #01,#44,#01,#46,#01,#66,#01,#44,#01,#64,#01,#66,#01,#60,#01,#00
    DB #09,#66,#01,#76,#06,#66,#01,#05,#04,#33,#01,#38,#02,#33,#01,#88
    DB #01,#83,#02,#33,#01,#38,#01,#83,#01,#53,#01,#50,#01,#76,#07,#66
    DB #01,#60,#02,#66,#01,#00,#01,#66,#01,#70,#01,#66,#01,#46,#01,#67
    DB #01,#76,#01,#66,#01,#76,#01,#66,#01,#76,#01,#77,#01,#76,#0C,#00
    DB #06,#AA,#01,#AB,#01,#B0,#0C,#00,#0F,#33,#01,#53,#01,#60,#06,#00
    DB #01,#77,#01,#44,#01,#74,#01,#77,#01,#74,#02,#77,#01,#74,#01,#00
    DB #01,#44,#01,#64,#01,#66,#01,#64,#02,#66,#01,#64,#01,#00,#02,#66
    DB #01,#06,#06,#66,#01,#76,#06,#66,#01,#05,#06,#33,#02,#88,#02,#33
    DB #01,#38,#01,#33,#01,#38,#01,#55,#01,#50,#01,#76,#01,#77,#01,#67
    DB #01,#76,#05,#66,#01,#60,#01,#66,#01,#00,#01,#66,#01,#60,#01,#07
    DB #02,#66,#01,#77,#01,#67,#01,#76,#01,#66,#01,#76,#01,#77,#01,#76
    DB #08,#00,#01,#FA,#01,#EA,#01,#AE,#01,#A4,#01,#EA,#07,#AA,#0C,#00
    DB #01,#33,#01,#83,#0D,#33,#01,#55,#01,#60,#06,#00,#01,#77,#01,#07
    DB #02,#44,#01,#47,#01,#77,#01,#44,#01,#77,#01,#40,#01,#06,#02,#44
    DB #01,#46,#01,#66,#01,#44,#01,#66,#01,#40,#02,#66,#01,#77,#01,#76
    DB #05,#66,#01,#76,#05,#66,#01,#E6,#01,#05,#01,#38,#01,#33,#01,#38
    DB #02,#33,#01,#58,#01,#83,#06,#33,#01,#55,#01,#30,#02,#66,#01,#77
    DB #01,#76,#02,#66,#01,#67,#01,#66,#01,#67,#01,#66,#01,#67,#02,#66
    DB #01,#60,#01,#00,#01,#66,#02,#67,#01,#77,#03,#66,#01,#77,#01,#76
    DB #07,#00,#01,#0B,#02,#EA,#01,#AA,#01,#A4,#01,#44,#04,#AA,#01,#AE
    DB #01,#AA,#01,#AE,#0C,#00,#01,#33,#01,#83,#03,#33,#01,#38,#01,#83
    DB #08,#33,#01,#55,#01,#60,#06,#00,#02,#77,#01,#44,#02,#47,#01,#74
    DB #01,#44,#01,#47,#01,#74,#01,#66,#01,#44,#02,#46,#01,#64,#01,#44
    DB #01,#46,#01,#64,#01,#66,#02,#77,#01,#76,#01,#67,#04,#66,#01,#76
    DB #06,#66,#01,#03,#01,#38,#01,#33,#01,#88,#04,#33,#01,#38,#05,#33
    DB #01,#55,#01,#30,#02,#76,#01,#67,#01,#77,#01,#76,#01,#66,#01,#77
    DB #03,#66,#01,#46,#01,#66,#01,#67,#01,#66,#01,#60,#02,#66,#01,#67
    DB #01,#77,#01,#66,#01,#67,#02,#77,#01,#66,#07,#00,#01,#BE,#04,#AA
    DB #01,#AE,#01,#A4,#03,#EE,#01,#E4,#01,#44,#01,#EB,#01,#00,#02,#AA
    DB #01,#AE,#01,#B0,#07,#00,#0E,#33,#01,#35,#01,#58,#01,#60,#06,#00
    DB #01,#77,#01,#07,#01,#44,#01,#47,#01,#77,#01,#74,#01,#44,#01,#47
    DB #01,#77,#01,#06,#01,#44,#01,#46,#01,#66,#01,#64,#01,#44,#01,#46
    DB #01,#66,#02,#77,#01,#66,#01,#67,#01,#77,#01,#76,#02,#66,#01,#76
    DB #02,#77,#02,#66,#02,#77,#01,#67,#01,#05,#01,#88,#03,#33,#01,#38
    DB #01,#33,#01,#35,#06,#33,#01,#53,#01,#50,#01,#07,#07,#77,#01,#60
    DB #01,#00,#01,#66,#01,#67,#01,#66,#01,#6E,#01,#66,#01,#07,#01,#66
    DB #01,#77,#01,#66,#01,#67,#01,#77,#01,#76,#01,#67,#01,#77,#07,#00
    DB #01,#E4,#01,#EE,#03,#AA,#02,#AE,#02,#EA,#01,#AA,#01,#44,#01,#64
    DB #01,#4E,#01,#BA,#04,#AA,#01,#A0,#06,#00,#01,#33,#01,#83,#06,#33
    DB #01,#38,#05,#33,#01,#35,#01,#50,#01,#60,#06,#00,#01,#77,#03,#47
    DB #01,#77,#01,#74,#01,#44,#01,#77,#01,#79,#03,#46,#01,#66,#01,#64
    DB #01,#44,#01,#66,#01,#6E,#02,#77,#02,#66,#01,#76,#01,#67,#02,#77
    DB #08,#66,#01,#05,#01,#88,#01,#33,#01,#35,#01,#33,#01,#38,#01,#83
    DB #05,#33,#02,#38,#01,#53,#01,#50,#01,#00,#05,#66,#01,#60,#01,#06
    DB #01,#67,#01,#00,#01,#06,#01,#46,#01,#66,#01,#77,#01,#00,#01,#06
    DB #01,#67,#01,#77,#01,#76,#01,#77,#01,#66,#02,#77,#01,#76,#05,#00
    DB #01,#0B,#01,#B0,#01,#EE,#02,#44,#01,#4E,#01,#EA,#01,#AA,#01,#EE
    DB #01,#AA,#01,#EA,#01,#AA,#03,#EE,#01,#A4,#05,#AA,#06,#00,#01,#33
    DB #01,#83,#01,#33,#01,#38,#04,#33,#01,#38,#05,#33,#01,#35,#01,#50
    DB #01,#60,#06,#00,#01,#77,#01,#04,#03,#77,#01,#07,#02,#77,#01,#40
    DB #01,#04,#03,#66,#01,#06,#02,#66,#01,#40,#08,#77,#01,#66,#03,#EE
    DB #01,#E6,#02,#EE,#01,#E6,#01,#05,#01,#83,#01,#33,#01,#53,#01,#88
    DB #01,#83,#02,#33,#01,#35,#04,#33,#01,#38,#01,#33,#01,#50,#01,#0E
    DB #03,#EE,#02,#E6,#01,#EE,#01,#6E,#01,#66,#01,#76,#01,#66,#01,#67
    DB #02,#77,#01,#67,#02,#66,#05,#77,#01,#67,#01,#66,#04,#00,#01,#0E
    DB #01,#EB,#01,#AE,#01,#AA,#01,#E4,#02,#44,#01,#4A,#01,#AA,#01,#E4
    DB #02,#44,#01,#E4,#01,#4A,#02,#AA,#01,#AE,#01,#44,#03,#AA,#01,#EA
    DB #01,#B0,#05,#00,#01,#33,#01,#83,#01,#35,#0B,#33,#01,#35,#01,#50
    DB #08,#77,#01,#04,#06,#77,#01,#44,#01,#04,#06,#66,#01,#44,#01,#70
    DB #03,#77,#01,#70,#03,#77,#01,#66,#06,#77,#01,#7E,#01,#03,#02,#33
    DB #01,#53,#01,#33,#01,#35,#01,#53,#01,#55,#01,#35,#01,#53,#01,#33
    DB #01,#55,#02,#33,#01,#53,#01,#30,#01,#6E,#01,#E6,#02,#66,#01,#67
    DB #01,#66,#01,#77,#01,#66,#01,#67,#01,#77,#01,#67,#01,#77,#01,#76
    DB #02,#77,#01,#76,#01,#67,#01,#77,#01,#67,#01,#77,#01,#76,#02,#77
    DB #01,#76,#03,#00,#01,#BA,#02,#AA,#01,#EE,#01,#E4,#01,#EA,#01,#EE
    DB #02,#AA,#01,#A4,#01,#46,#02,#66,#01,#46,#01,#4E,#02,#EA,#01,#AA
    DB #01,#4E,#01,#4A,#01,#4E,#01,#4A,#01,#64,#01,#EB,#05,#00,#02,#33
    DB #01,#35,#06,#33,#01,#35,#02,#33,#01,#53,#01,#33,#01,#35,#01,#50
    DB #01,#07,#06,#77,#01,#70,#01,#09,#01,#44,#01,#77,#02,#44,#01,#77
    DB #01,#44,#01,#40,#01,#0E,#01,#44,#01,#66,#02,#44,#01,#66,#01,#44
    DB #01,#40,#08,#00,#01,#66,#01,#77,#02,#66,#01,#76,#01,#66,#01,#77
    DB #01,#66,#01,#00,#01,#85,#01,#35,#01,#88,#01,#35,#01,#53,#01,#38
    DB #03,#88,#01,#55,#01,#58,#01,#85,#01,#55,#01,#58,#01,#00,#01,#6E
    DB #05,#66,#01,#67,#01,#66,#01,#06,#01,#66,#01,#6E,#05,#66,#01,#06
    DB #01,#66,#01,#6E,#01,#E6,#01,#66,#01,#EE,#02,#66,#03,#00,#01,#EA
    DB #02,#AA,#01,#A4,#01,#46,#01,#AA,#01,#EA,#01,#AA,#01,#4E,#01,#44
    DB #01,#66,#01,#76,#01,#A4,#01,#66,#01,#64,#02,#44,#01,#AA,#01,#E4
    DB #01,#44,#01,#46,#02,#66,#01,#E0,#05,#00,#01,#03,#01,#55,#01,#58
    DB #07,#55,#01,#53,#04,#55,#01,#30,#15,#00,#01,#70,#0C,#00,#01,#67
    DB #01,#AD,#01,#DB,#01,#A4,#03,#DD,#01,#DB,#01,#AB,#01,#E4,#01,#DA
    DB #01,#77,#01,#70,#02,#00,#01,#07,#01,#0A,#01,#A7,#01,#70,#04,#00
    DB #01,#4D,#01,#DD,#01,#DA,#01,#AD,#02,#DD,#01,#D4,#03,#00,#01,#07
    DB #01,#00,#01,#0D,#01,#D4,#08,#00,#01,#77,#01,#70,#02,#00,#01,#77
    DB #01,#70,#0D,#00,#01,#77,#01,#22,#01,#27,#02,#22,#01,#07,#01,#70
    DB #01,#07,#01,#77,#01,#07,#01,#77,#01,#67,#01,#76,#03,#67,#01,#77
    DB #02,#00,#02,#77,#01,#70,#01,#00,#01,#06,#01,#66,#01,#77,#01,#69
    DB #02,#99,#07,#00,#01,#06,#01,#00,#01,#07,#0A,#00,#01,#77,#01,#BD
    DB #01,#77,#06,#00,#01,#EA,#02,#AA,#01,#00,#01,#07,#02,#00,#01,#AD
    DB #01,#DB,#01,#BD,#04,#DD,#01,#BB,#01,#DA,#01,#D7,#01,#E0,#05,#00
    DB #01,#07,#04,#00,#01,#EA,#01,#DA,#01,#AA,#01,#74,#03,#DD,#01,#D4
    DB #03,#00,#01,#07,#01,#00,#01,#0D,#01,#D4,#08,#00,#01,#07,#01,#27
    DB #02,#00,#01,#07,#01,#70,#0E,#00,#01,#72,#01,#22,#01,#72,#01,#77
    DB #01,#07,#01,#70,#01,#77,#01,#67,#01,#69,#07,#66,#01,#77,#02,#07
    DB #01,#77,#01,#70,#01,#00,#01,#66,#01,#99,#01,#66,#03,#99,#01,#90
    DB #06,#00,#01,#60,#01,#BB,#01,#77,#0A,#00,#01,#07,#01,#BD,#01,#77
    DB #03,#00,#01,#70,#01,#7A,#01,#AA,#03,#BB,#01,#AA,#01,#A4,#01,#76
    DB #01,#74,#01,#7A,#01,#DD,#01,#BD,#06,#DD,#01,#DA,#01,#77,#09,#00
    DB #01,#AA,#01,#DD,#01,#47,#01,#77,#01,#44,#03,#DD,#01,#D4,#05,#00
    DB #01,#0D,#01,#D4,#08,#00,#01,#07,#01,#22,#01,#70,#01,#00,#01,#07
    DB #01,#22,#01,#70,#0D,#00,#01,#07,#01,#72,#01,#27,#01,#77,#01,#00
    DB #01,#76,#01,#66,#04,#99,#01,#96,#04,#66,#01,#67,#01,#70,#01,#07
    DB #01,#77,#02,#00,#01,#79,#01,#96,#05,#99,#06,#00,#01,#60,#01,#DD
    DB #01,#B4,#01,#70,#08,#00,#01,#70,#01,#07,#01,#BD,#01,#77,#02,#00
    DB #01,#70,#01,#4E,#01,#AB,#01,#BA,#03,#44,#01,#AD,#01,#BA,#01,#47
    DB #02,#4A,#09,#DD,#01,#A7,#01,#70,#06,#00,#01,#07,#01,#7A,#01,#BD
    DB #01,#47,#01,#74,#01,#44,#01,#AA,#03,#DD,#01,#D4,#01,#40,#04,#00
    DB #01,#4D,#01,#D4,#08,#00,#01,#07,#01,#22,#01,#27,#01,#70,#01,#07
    DB #01,#22,#01,#27,#01,#70,#01,#07,#01,#77,#0A,#00,#02,#77,#01,#20
    DB #01,#70,#01,#76,#01,#69,#07,#99,#01,#96,#03,#66,#01,#67,#01,#00
    DB #02,#70,#01,#07,#01,#69,#01,#96,#01,#69,#04,#99,#06,#00,#01,#60
    DB #01,#DD,#01,#B4,#09,#00,#01,#04,#01,#47,#01,#BA,#01,#77,#02,#00
    DB #01,#04,#01,#AB,#01,#BD,#01,#44,#01,#70,#01,#00,#01,#07,#01,#44
    DB #01,#4E,#01,#A4,#01,#4A,#0A,#DD,#01,#BE,#01,#67,#06,#00,#01,#76
    DB #01,#AB,#01,#D4,#02,#77,#02,#AA,#04,#DD,#01,#47,#04,#00,#01,#4D
    DB #01,#47,#01,#70,#02,#00,#01,#07,#03,#77,#01,#70,#01,#07,#01,#72
    DB #01,#22,#01,#77,#01,#07,#02,#22,#01,#77,#01,#07,#01,#27,#09,#00
    DB #01,#07,#01,#79,#01,#97,#02,#77,#09,#99,#05,#66,#01,#70,#01,#07
    DB #01,#77,#01,#07,#01,#69,#01,#99,#01,#96,#01,#66,#03,#99,#06,#00
    DB #01,#60,#01,#DD,#01,#B4,#09,#00,#01,#0A,#01,#AA,#01,#BA,#01,#47
    DB #01,#70,#01,#00,#01,#0A,#01,#DA,#01,#44,#02,#70,#03,#00,#01,#07
    DB #01,#44,#01,#4D,#0A,#DD,#01,#DB,#01,#40,#06,#00,#01,#06,#01,#BD
    DB #01,#47,#01,#00,#01,#07,#01,#7A,#01,#AA,#04,#DD,#01,#A7,#04,#00
    DB #01,#AB,#01,#40,#04,#00,#01,#77,#02,#22,#01,#70,#01,#77,#01,#72
    DB #02,#22,#01,#77,#01,#72,#01,#22,#01,#27,#01,#07,#01,#22,#01,#70
    DB #08,#00,#01,#07,#01,#99,#01,#96,#01,#76,#01,#69,#0A,#99,#01,#96
    DB #03,#66,#01,#77,#01,#00,#01,#70,#01,#07,#01,#69,#06,#99,#06,#00
    DB #01,#60,#01,#DD,#01,#DA,#01,#47,#08,#00,#01,#0A,#01,#BD,#01,#DA
    DB #01,#A7,#01,#70,#01,#00,#01,#74,#01,#44,#01,#07,#06,#00,#01,#74
    DB #0C,#DD,#01,#A6,#01,#70,#05,#00,#01,#77,#01,#DD,#01,#07,#02,#00
    DB #01,#74,#01,#AA,#01,#AD,#03,#DD,#01,#DE,#01,#70,#02,#00,#01,#70
    DB #01,#AB,#01,#40,#05,#00,#01,#72,#02,#22,#01,#70,#01,#07,#02,#22
    DB #01,#20,#01,#72,#02,#22,#01,#77,#01,#22,#01,#76,#01,#70,#07,#00
    DB #01,#76,#02,#99,#01,#69,#0A,#99,#01,#96,#04,#66,#01,#67,#01,#77
    DB #01,#70,#01,#07,#01,#69,#06,#99,#06,#00,#01,#60,#01,#AD,#01,#DB
    DB #01,#E0,#08,#00,#01,#0A,#01,#BD,#01,#DA,#01,#A7,#01,#70,#01,#00
    DB #01,#07,#07,#00,#01,#70,#01,#7A,#0C,#DD,#01,#BE,#06,#00,#01,#07
    DB #01,#DA,#01,#07,#02,#00,#01,#07,#01,#44,#01,#AA,#04,#DD,#01,#44
    DB #02,#00,#01,#0A,#01,#DB,#01,#40,#01,#00,#01,#07,#02,#00,#01,#70
    DB #01,#77,#03,#22,#01,#70,#03,#22,#01,#02,#02,#22,#01,#77,#01,#22
    DB #01,#70,#01,#77,#01,#07,#01,#70,#05,#00,#01,#69,#0E,#99,#01,#69
    DB #04,#66,#01,#70,#01,#76,#01,#00,#01,#69,#05,#99,#01,#66,#06,#00
    DB #01,#07,#01,#4D,#01,#DB,#01,#A4,#01,#70,#07,#00,#01,#0A,#01,#BD
    DB #01,#DA,#01,#A7,#01,#70,#05,#00,#01,#77,#03,#44,#01,#77,#01,#4A
    DB #0C,#DD,#01,#BE,#01,#67,#05,#00,#01,#07,#01,#44,#01,#70,#03,#00
    DB #01,#74,#01,#4A,#04,#DD,#01,#DA,#01,#44,#01,#4E,#01,#DD,#01,#DE
    DB #01,#67,#01,#00,#01,#72,#02,#22,#01,#27,#01,#70,#03,#22,#01,#27
    DB #01,#72,#02,#22,#01,#72,#04,#22,#02,#20,#01,#07,#01,#70,#04,#00
    DB #01,#07,#01,#69,#06,#99,#01,#67,#01,#77,#01,#69,#04,#99,#01,#96
    DB #04,#66,#01,#67,#01,#77,#01,#07,#01,#00,#01,#76,#02,#99,#02,#66
    DB #01,#69,#01,#99,#07,#00,#01,#0A,#01,#DD,#01,#BA,#01,#67,#07,#00
    DB #01,#0A,#01,#BD,#01,#DA,#01,#47,#01,#70,#05,#00,#01,#67,#01,#EB
    DB #01,#BA,#01,#AA,#01,#44,#01,#AA,#02,#DD,#01,#A4,#01,#AD,#08,#DD
    DB #01,#DB,#01,#A0,#06,#00,#01,#07,#05,#00,#01,#4A,#01,#AD,#07,#DD
    DB #01,#D7,#02,#00,#01,#07,#01,#77,#01,#22,#01,#92,#01,#22,#01,#72
    DB #03,#22,#01,#72,#07,#22,#01,#27,#01,#20,#01,#72,#01,#70,#04,#00
    DB #01,#07,#01,#66,#05,#99,#01,#67,#01,#76,#02,#66,#05,#99,#01,#96
    DB #04,#66,#01,#77,#01,#70,#01,#00,#01,#07,#06,#99,#07,#00,#01,#04
    DB #01,#AD,#01,#DB,#01,#B6,#01,#70,#06,#00,#01,#0A,#01,#BD,#01,#A4
    DB #01,#77,#05,#00,#01,#07,#01,#EB,#01,#DA,#01,#A0,#01,#00,#01,#44
    DB #01,#AA,#02,#DD,#01,#40,#01,#7D,#03,#DD,#01,#AA,#01,#AD,#03,#DD
    DB #01,#DB,#01,#A0,#0B,#00,#01,#07,#01,#44,#01,#AA,#07,#DD,#01,#47
    DB #03,#00,#01,#06,#01,#72,#02,#22,#01,#27,#05,#22,#01,#72,#06,#22
    DB #01,#70,#01,#22,#01,#76,#01,#70,#03,#00,#01,#07,#01,#77,#01,#69
    DB #03,#99,#01,#97,#01,#76,#08,#99,#01,#96,#03,#66,#01,#67,#01,#77
    DB #01,#70,#02,#00,#01,#76,#05,#99,#07,#00,#01,#07,#01,#4A,#01,#DD
    DB #01,#DB,#01,#77,#06,#00,#01,#0A,#01,#BD,#01,#A0,#06,#00,#01,#0A
    DB #01,#BD,#01,#40,#02,#00,#01,#44,#01,#4A,#02,#DD,#01,#40,#01,#4D
    DB #02,#DD,#01,#DA,#01,#00,#01,#04,#01,#AD,#02,#DD,#01,#DB,#01,#A0
    DB #0C,#00,#01,#77,#01,#4A,#01,#AD,#02,#DD,#01,#DA,#01,#AA,#01,#AD
    DB #01,#DD,#01,#07,#04,#00,#01,#77,#01,#72,#07,#22,#01,#72,#04,#22
    DB #01,#72,#01,#22,#01,#77,#01,#22,#01,#77,#01,#70,#03,#00,#01,#07
    DB #01,#99,#01,#79,#03,#99,#01,#77,#09,#99,#01,#96,#04,#66,#01,#77
    DB #03,#00,#01,#07,#01,#69,#04,#99,#08,#00,#01,#04,#01,#AD,#01,#DD
    DB #01,#B7,#01,#70,#05,#00,#01,#0A,#01,#BD,#01,#A0,#01,#77,#04,#00
    DB #01,#07,#01,#7B,#01,#D4,#01,#70,#02,#00,#01,#4A,#01,#AA,#02,#DD
    DB #01,#40,#01,#4D,#02,#DD,#01,#47,#01,#00,#01,#07,#01,#04,#02,#DD
    DB #01,#DB,#01,#A0,#0C,#00,#01,#07,#01,#74,#01,#4A,#02,#DD,#01,#D4
    DB #01,#44,#01,#4D,#01,#D4,#01,#77,#04,#00,#01,#77,#01,#07,#04,#22
    DB #01,#72,#02,#22,#01,#77,#01,#22,#01,#27,#01,#22,#01,#27,#01,#72
    DB #01,#27,#01,#72,#01,#27,#01,#72,#01,#70,#03,#00,#01,#07,#01,#69
    DB #01,#96,#01,#99,#01,#96,#01,#60,#01,#69,#09,#99,#05,#66,#01,#77
    DB #01,#70,#03,#00,#01,#76,#04,#99,#09,#00,#01,#4A,#01,#DD,#01,#DB
    DB #01,#47,#01,#07,#02,#00,#01,#07,#01,#00,#01,#0A,#01,#BD,#01,#A0
    DB #01,#00,#01,#70,#03,#00,#01,#70,#01,#BB,#01,#40,#03,#00,#01,#4A
    DB #01,#AA,#01,#AD,#01,#DD,#01,#40,#01,#4D,#01,#DD,#01,#D4,#03,#00
    DB #01,#07,#01,#7D,#01,#DD,#01,#DB,#01,#A0,#0E,#00,#01,#04,#01,#AA
    DB #03,#DD,#01,#AA,#01,#40,#03,#00,#03,#77,#01,#70,#04,#22,#01,#77
    DB #02,#22,#01,#77,#01,#22,#01,#77,#01,#22,#01,#70,#01,#72,#01,#70
    DB #01,#22,#01,#77,#01,#27,#02,#77,#03,#00,#01,#76,#01,#67,#02,#99
    DB #01,#66,#01,#96,#01,#69,#01,#99,#01,#66,#06,#99,#01,#66,#01,#76
    DB #01,#99,#01,#67,#01,#66,#01,#77,#04,#00,#01,#07,#01,#76,#03,#99
    DB #09,#00,#01,#77,#01,#AD,#01,#DD,#01,#B4,#03,#00,#01,#07,#01,#00
    DB #01,#0A,#01,#BD,#01,#40,#01,#DD,#01,#40,#03,#00,#01,#67,#01,#DD
    DB #01,#47,#02,#00,#01,#07,#01,#4A,#01,#AA,#01,#A4,#01,#DD,#01,#D4
    DB #01,#4D,#01,#DD,#01,#D4,#05,#00,#01,#AD,#01,#DD,#01,#A0,#0F,#00
    DB #01,#04,#03,#AA,#01,#40,#01,#70,#03,#00,#01,#77,#01,#72,#01,#22
    DB #01,#27,#01,#72,#03,#22,#01,#70,#01,#22,#01,#27,#01,#70,#01,#77
    DB #01,#00,#01,#77,#01,#00,#01,#77,#01,#07,#01,#77,#01,#07,#01,#70
    DB #01,#72,#01,#77,#03,#00,#01,#70,#01,#96,#01,#69,#01,#99,#01,#96
    DB #01,#76,#01,#90,#01,#07,#02,#79,#04,#99,#01,#96,#01,#66,#03,#99
    DB #01,#77,#02,#70,#04,#00,#01,#07,#01,#76,#01,#69,#01,#99,#09,#00
    DB #01,#07,#01,#7A,#01,#DD,#01,#BE,#01,#4D,#02,#DD,#01,#DB,#01,#B0
    DB #01,#00,#01,#4D,#02,#DD,#01,#40,#02,#00,#01,#07,#01,#0A,#01,#D7
    DB #01,#70,#03,#00,#01,#07,#01,#40,#01,#00,#01,#0A,#03,#DD,#01,#D4
    DB #03,#00,#01,#70,#01,#00,#01,#0D,#01,#DD,#01,#40,#0F,#00,#01,#07
    DB #09,#00,#01,#07,#02,#22,#01,#77,#02,#22,#01,#72,#01,#20,#01,#77
    DB #01,#70,#01,#00,#01,#70,#01,#07,#01,#70,#02,#07,#03,#00,#02,#77
    DB #04,#00,#02,#77,#01,#69,#01,#99,#01,#97,#01,#60,#01,#00,#01,#77
    DB #01,#00,#01,#79,#04,#99,#01,#96,#01,#69,#01,#96,#01,#77,#01,#99
    DB #01,#67,#01,#70,#06,#00,#01,#07,#01,#76,#01,#77,#01,#00,#01,#70
    DB #01,#00,#01,#79,#06,#99,#02,#66,#01,#69,#01,#97,#01,#77,#0B,#00
    DB #01,#76,#01,#60,#0D,#00,#01,#07,#01,#70,#01,#06,#01,#EE,#01,#FF
    DB #01,#FE,#01,#66,#01,#69,#01,#9E,#01,#EE,#02,#9F,#01,#F9,#01,#99
    DB #01,#9E,#01,#EF,#02,#FF,#01,#EE,#01,#6E,#01,#E6,#02,#00,#01,#77
    DB #01,#70,#01,#06,#01,#E7,#02,#66,#01,#6E,#01,#EE,#01,#E6,#01,#69
    DB #01,#99,#01,#66,#02,#EE,#01,#9E,#01,#69,#01,#99,#01,#6E,#01,#69
    DB #01,#66,#01,#6E,#01,#77,#01,#E7,#1B,#00,#01,#06,#01,#00,#01,#6E
    DB #01,#FE,#01,#EE,#01,#E6,#01,#E9,#01,#99,#01,#F9,#02,#99,#01,#9F
    DB #01,#99,#01,#9E,#01,#09,#01,#67,#01,#66,#06,#99,#01,#96,#01,#79
    DB #02,#99,#01,#97,#01,#07,#0B,#00,#01,#66,#01,#EE,#01,#70,#02,#00
    DB #01,#70,#09,#00,#01,#07,#01,#00,#01,#76,#01,#EF,#02,#FE,#01,#66
    DB #02,#99,#01,#9F,#04,#99,#01,#9E,#01,#EE,#03,#FF,#01,#FE,#01,#EE
    DB #01,#60,#03,#00,#01,#06,#01,#67,#01,#76,#01,#67,#01,#6E,#01,#FE
    DB #01,#E6,#01,#E9,#01,#99,#02,#6E,#01,#EF,#01,#E6,#01,#E9,#01,#9E
    DB #01,#69,#01,#9E,#01,#66,#01,#E6,#01,#00,#01,#E7,#0B,#00,#01,#76
    DB #01,#E6,#0E,#00,#01,#66,#01,#06,#03,#EE,#01,#66,#01,#E9,#03,#99
    DB #01,#9F,#01,#E6,#01,#6E,#01,#9E,#09,#99,#01,#97,#01,#66,#02,#99
    DB #01,#97,#01,#70,#0B,#00,#01,#70,#01,#6E,#01,#E0,#01,#00,#02,#77
    DB #09,#00,#01,#77,#01,#07,#01,#6E,#02,#EE,#01,#FE,#01,#6E,#04,#99
    DB #01,#9F,#01,#FE,#01,#E9,#01,#99,#01,#EE,#01,#EF,#02,#EE,#01,#E6
    DB #01,#76,#01,#E7,#03,#00,#01,#06,#01,#60,#01,#06,#01,#66,#01,#6E
    DB #01,#F9,#01,#E6,#03,#99,#02,#66,#01,#6E,#01,#99,#01,#96,#03,#66
    DB #01,#E7,#01,#07,#01,#67,#0B,#00,#01,#77,#01,#6E,#01,#60,#01,#00
    DB #01,#06,#01,#60,#09,#00,#01,#66,#01,#60,#01,#0E,#02,#EE,#01,#66
    DB #01,#6E,#04,#99,#01,#9E,#02,#66,#01,#E9,#09,#99,#01,#96,#01,#66
    DB #01,#69,#01,#99,#01,#67,#01,#60,#08,#00,#01,#77,#01,#70,#02,#00
    DB #01,#7E,#01,#E7,#01,#00,#01,#70,#01,#07,#08,#00,#02,#70,#01,#0E
    DB #03,#EE,#01,#E6,#01,#6E,#02,#99,#01,#F9,#02,#99,#02,#EE,#01,#99
    DB #01,#EE,#01,#EF,#01,#FE,#01,#EE,#01,#E7,#01,#00,#01,#67,#03,#00
    DB #01,#07,#01,#67,#01,#07,#02,#76,#02,#66,#02,#99,#01,#96,#01,#69
    DB #01,#9E,#01,#66,#01,#99,#01,#E6,#01,#67,#02,#66,#01,#67,#01,#76
    DB #01,#70,#0C,#00,#01,#0E,#01,#E7,#01,#00,#01,#60,#01,#06,#09,#00
    DB #01,#06,#01,#00,#01,#06,#01,#EE,#01,#FE,#01,#E7,#01,#6E,#01,#EE
    DB #03,#99,#01,#F6,#01,#66,#01,#EE,#01,#69,#01,#99,#01,#96,#07,#99
    DB #01,#96,#01,#66,#02,#99,#01,#77,#08,#00,#01,#07,#02,#70,#02,#00
    DB #01,#7E,#01,#E7,#01,#07,#01,#70,#01,#00,#01,#07,#01,#77,#01,#70
    DB #05,#00,#01,#77,#01,#00,#01,#0E,#01,#EE,#01,#EF,#01,#E6,#01,#76
    DB #01,#9F,#04,#99,#01,#FE,#01,#E6,#01,#76,#01,#E9,#01,#EE,#01,#EF
    DB #01,#FF,#01,#FE,#01,#EE,#01,#60,#05,#00,#01,#76,#01,#00,#01,#07
    DB #01,#76,#01,#99,#01,#66,#02,#99,#01,#66,#01,#99,#01,#F9,#01,#E7
    DB #01,#99,#01,#96,#01,#77,#02,#66,#01,#00,#01,#77,#09,#00,#02,#66
    DB #02,#00,#01,#06,#01,#E6,#01,#00,#01,#60,#0C,#00,#01,#06,#01,#EE
    DB #01,#FE,#03,#66,#01,#EF,#01,#99,#01,#9F,#01,#E6,#01,#6E,#01,#9F
    DB #02,#99,#01,#66,#01,#69,#09,#99,#01,#96,#01,#70,#0A,#00,#01,#77
    DB #01,#6E,#01,#67,#01,#EE,#01,#E7,#01,#67,#01,#00,#01,#07,#01,#6F
    DB #01,#FE,#01,#60,#08,#00,#01,#EE,#01,#FE,#01,#E6,#01,#7E,#01,#66
    DB #01,#EF,#02,#9E,#01,#9F,#01,#EE,#01,#66,#01,#99,#01,#69,#02,#EE
    DB #02,#FF,#01,#FE,#01,#60,#01,#77,#04,#00,#01,#76,#01,#00,#01,#06
    DB #01,#77,#02,#66,#01,#69,#01,#96,#01,#69,#01,#FF,#01,#99,#01,#6E
    DB #01,#99,#01,#97,#01,#76,#01,#66,#01,#E6,#01,#00,#01,#77,#01,#70
    DB #09,#00,#02,#06,#01,#67,#01,#6E,#01,#E7,#01,#66,#01,#70,#01,#07
    DB #01,#EE,#01,#E6,#01,#70,#07,#00,#01,#07,#01,#6E,#01,#EF,#01,#EE
    DB #01,#E7,#01,#6E,#01,#66,#01,#6E,#01,#99,#01,#EE,#01,#67,#01,#66
    DB #01,#69,#01,#F9,#01,#96,#08,#99,#01,#96,#02,#99,#01,#67,#07,#00
    DB #01,#07,#01,#77,#01,#66,#01,#00,#01,#6E,#01,#FF,#01,#FE,#01,#EF
    DB #02,#66,#01,#E6,#01,#76,#01,#FF,#01,#E7,#01,#70,#07,#00,#01,#07
    DB #01,#EE,#01,#FE,#01,#E6,#01,#66,#01,#76,#01,#EE,#01,#F9,#01,#99
    DB #01,#FF,#01,#66,#01,#6E,#01,#9F,#01,#99,#01,#EE,#01,#FF,#01,#EE
    DB #02,#FF,#01,#E6,#01,#07,#01,#70,#02,#00,#01,#07,#01,#77,#01,#00
    DB #01,#76,#02,#06,#03,#66,#01,#E9,#01,#F9,#01,#E6,#02,#99,#01,#E7
    DB #01,#76,#01,#E6,#01,#60,#02,#00,#01,#70,#06,#00,#01,#06,#01,#07
    DB #01,#67,#01,#06,#01,#EF,#01,#FE,#01,#6F,#01,#E7,#02,#66,#01,#7E
    DB #01,#FE,#01,#67,#08,#00,#01,#6E,#01,#EF,#01,#FE,#01,#EE,#01,#66
    DB #01,#E9,#01,#E6,#01,#76,#01,#99,#01,#E6,#01,#76,#02,#66,#0A,#99
    DB #01,#66,#01,#69,#01,#67,#01,#70,#07,#00,#01,#77,#01,#7E,#01,#FF
    DB #01,#EE,#03,#FF,#01,#EE,#01,#6E,#02,#EE,#01,#EF,#01,#EE,#08,#00
    DB #01,#07,#01,#6E,#01,#EE,#01,#FE,#01,#E6,#01,#66,#01,#9E,#01,#66
    DB #01,#E9,#01,#99,#01,#EE,#01,#67,#01,#66,#01,#69,#01,#99,#01,#EE
    DB #01,#EF,#01,#FF,#01,#EF,#01,#FF,#01,#EE,#01,#70,#03,#00,#01,#70
    DB #02,#00,#01,#70,#01,#07,#01,#06,#01,#96,#01,#66,#01,#69,#01,#99
    DB #01,#E6,#01,#69,#02,#99,#01,#67,#01,#76,#01,#67,#01,#66,#01,#00
    DB #01,#07,#01,#70,#06,#00,#01,#67,#01,#EF,#01,#FE,#01,#EF,#02,#FF
    DB #01,#EE,#01,#6E,#01,#EE,#01,#6E,#01,#EE,#01,#E6,#08,#00,#01,#07
    DB #04,#EE,#01,#67,#01,#EE,#02,#66,#01,#9F,#01,#9E,#01,#66,#01,#EF
    DB #01,#E7,#01,#69,#08,#99,#01,#67,#01,#76,#02,#77,#08,#00,#01,#70
    DB #01,#7E,#01,#EF,#04,#FF,#01,#EE,#01,#6E,#01,#EE,#01,#EF,#01,#FE
    DB #01,#E7,#01,#76,#07,#00,#01,#6E,#01,#EF,#01,#FF,#01,#EE,#01,#E6
    DB #01,#69,#01,#99,#01,#67,#01,#6E,#01,#99,#01,#66,#01,#76,#02,#66
    DB #01,#99,#01,#E6,#01,#EE,#01,#FF,#01,#FE,#02,#EE,#01,#E7,#03,#00
    DB #01,#70,#02,#00,#01,#77,#02,#00,#04,#66,#01,#69,#01,#9F,#01,#99
    DB #01,#96,#01,#76,#01,#77,#01,#00,#01,#76,#01,#60,#09,#00,#01,#6E
    DB #01,#EF,#03,#FF,#01,#EE,#01,#6E,#01,#EE,#01,#FF,#01,#FE,#01,#E7
    DB #01,#67,#07,#00,#01,#07,#01,#E6,#01,#07,#01,#6E,#01,#EE,#01,#E7
    DB #01,#66,#01,#6E,#01,#66,#01,#69,#01,#9E,#01,#6F,#01,#FF,#01,#FE
    DB #01,#6E,#08,#99,#01,#67,#01,#09,#01,#66,#01,#67,#09,#00,#01,#06
    DB #01,#EE,#03,#FF,#01,#FE,#01,#EE,#01,#6E,#01,#EF,#01,#FF,#03,#EE
    DB #01,#70,#05,#00,#01,#07,#04,#EE,#01,#E6,#01,#69,#01,#96,#01,#66
    DB #01,#7E,#01,#99,#01,#96,#01,#66,#01,#EF,#01,#E7,#01,#69,#01,#96
    DB #02,#EE,#01,#EF,#01,#FE,#01,#6E,#01,#EE,#01,#70,#05,#00,#01,#07
    DB #01,#70,#01,#00,#01,#7E,#01,#EE,#01,#6E,#02,#99,#01,#FF,#01,#99
    DB #01,#E7,#01,#00,#01,#77,#01,#00,#01,#07,#01,#70,#09,#00,#01,#0E
    DB #01,#FE,#03,#FF,#01,#EE,#01,#6E,#01,#EF,#01,#FE,#02,#EE,#01,#E6
    DB #07,#00,#01,#07,#01,#60,#01,#07,#01,#EF,#01,#EE,#01,#66,#01,#67
    DB #01,#FF,#01,#FE,#01,#69,#01,#9E,#01,#6F,#01,#E7,#01,#EE,#01,#6E
    DB #07,#99,#01,#96,#02,#77,#01,#66,#01,#70,#09,#00,#01,#76,#01,#EE
    DB #01,#EF,#03,#FF,#01,#E6,#01,#EE,#01,#FF,#04,#EE,#01,#67,#01,#00
    DB #01,#6E,#01,#60,#02,#00,#01,#06,#01,#E6,#01,#76,#01,#6E,#01,#FE
    DB #01,#EE,#01,#69,#03,#66,#01,#99,#01,#96,#01,#6F,#01,#FF,#01,#FE
    DB #01,#69,#01,#96,#01,#6E,#01,#EE,#01,#66,#01,#EE,#01,#66,#01,#EE
    DB #01,#E7,#05,#00,#01,#07,#01,#70,#01,#00,#01,#06,#01,#69,#02,#EE
    DB #01,#99,#01,#F9,#01,#99,#01,#70,#03,#00,#01,#77,#01,#70,#08,#00
    DB #01,#07,#01,#6E,#01,#EF,#02,#FF,#01,#FE,#01,#E6,#01,#EE,#01,#FF
    DB #01,#E6,#03,#EE,#01,#67,#01,#7E,#01,#E6,#01,#70,#04,#00,#01,#70
    DB #01,#07,#01,#FE,#01,#E6,#01,#E7,#01,#76,#01,#FF,#01,#EE,#01,#6E
    DB #01,#9E,#01,#6E,#01,#EE,#01,#66,#01,#E6,#07,#99,#01,#66,#01,#70
    DB #01,#07,#01,#77,#0A,#00,#01,#6E,#01,#EE,#01,#FE,#02,#FF,#01,#FE
    DB #01,#E6,#01,#EE,#01,#FE,#01,#EE,#01,#EF,#01,#FE,#02,#EE,#01,#76
    DB #01,#E6,#01,#66,#02,#00,#01,#07,#01,#E7,#01,#00,#01,#6F,#01,#FE
    DB #01,#E6,#01,#66,#01,#7E,#01,#FF,#01,#66,#01,#E9,#01,#96,#01,#EF
    DB #01,#FE,#01,#FF,#01,#7E,#01,#96,#03,#66,#01,#6E,#01,#E7,#01,#77
    DB #01,#70,#05,#00,#01,#77,#02,#00,#01,#07,#01,#69,#02,#99,#01,#9F
    DB #01,#99,#01,#E7,#04,#00,#01,#70,#09,#00,#01,#07,#01,#EE,#01,#FF
    DB #01,#EE,#01,#FF,#01,#FE,#01,#E6,#01,#EE,#01,#FE,#01,#6E,#01,#FF
    DB #01,#FE,#01,#E6,#01,#67,#01,#EE,#01,#77,#01,#70,#04,#00,#01,#66
    DB #01,#06,#01,#EE,#03,#66,#01,#6E,#01,#EE,#02,#66,#01,#6E,#01,#FE
    DB #01,#E6,#01,#66,#06,#99,#01,#66,#01,#70,#0B,#00,#01,#66,#01,#00
    DB #01,#EE,#01,#EF,#02,#EE,#01,#FF,#01,#FE,#01,#EE,#01,#EF,#02,#EE
    DB #01,#EF,#01,#FF,#01,#EE,#01,#E6,#01,#6E,#01,#67,#01,#07,#01,#70
    DB #01,#00,#01,#07,#01,#70,#01,#00,#02,#EE,#01,#66,#01,#76,#01,#7F
    DB #01,#FF,#01,#F6,#01,#69,#01,#96,#01,#EE,#01,#E7,#01,#EE,#01,#6E
    DB #01,#66,#01,#6E,#02,#66,#01,#6E,#01,#E6,#01,#77,#0A,#00,#01,#69
    DB #02,#FF,#01,#F9,#01,#E6,#05,#00,#01,#77,#07,#00,#01,#7E,#01,#EE
    DB #01,#66,#01,#EF,#01,#FE,#01,#EE,#01,#EF,#01,#FE,#01,#EE,#01,#EF
    DB #03,#EE,#02,#FF,#01,#EE,#01,#E7,#06,#00,#01,#60,#01,#00,#01,#E6
    DB #01,#67,#01,#76,#01,#6E,#01,#EF,#01,#66,#01,#6E,#01,#66,#01,#6E
    DB #01,#EE,#01,#E6,#01,#6E,#05,#99,#01,#67,#01,#70,#0B,#00,#01,#6E
    DB #01,#FF,#01,#E6,#01,#EE,#01,#FE,#01,#E6,#01,#EE,#01,#EF,#01,#FE
    DB #05,#EE,#01,#EF,#02,#FF,#01,#FE,#01,#70,#04,#00,#01,#77,#01,#00
    DB #01,#EE,#02,#E6,#01,#76,#01,#6F,#01,#FE,#02,#6E,#01,#E6,#01,#6E
    DB #01,#EF,#01,#E6,#02,#66,#01,#E6,#03,#66,#01,#E6,#01,#77,#01,#70
    DB #09,#00,#01,#69,#02,#FF,#01,#F9,#01,#60,#0C,#00,#01,#07,#02,#EE
    DB #01,#FE,#01,#EF,#01,#E6,#01,#66,#01,#6E,#01,#FE,#01,#6E,#04,#EE
    DB #01,#EF,#01,#FF,#01,#FE,#01,#66,#05,#00,#01,#66,#01,#60,#01,#0E
    DB #01,#E0,#02,#66,#02,#EE,#01,#66,#01,#99,#01,#96,#01,#6E,#01,#EE
    DB #01,#E6,#01,#E9,#03,#99,#01,#66,#01,#67,#01,#70,#0B,#00,#01,#07
    DB #02,#EE,#01,#FF,#01,#EE,#01,#FE,#02,#66,#01,#EF,#07,#EE,#01,#FF
    DB #01,#FE,#01,#E6,#01,#67,#04,#00,#01,#77,#01,#07,#01,#EE,#04,#66
    DB #01,#EE,#01,#E6,#02,#66,#01,#6E,#01,#EE,#01,#E6,#01,#66,#01,#EE
    DB #02,#66,#01,#E6,#01,#66,#01,#EE,#01,#60,#01,#77,#09,#00,#01,#76
    DB #02,#99,#01,#E6,#01,#70,#0C,#00,#01,#0E,#01,#60,#01,#6E,#01,#EE
    DB #01,#EF,#01,#E6,#02,#66,#02,#EE,#02,#F9,#01,#9E,#01,#EE,#01,#EF
    DB #01,#FF,#01,#E6,#01,#66,#01,#77,#06,#00,#01,#0E,#01,#70,#02,#66
    DB #01,#EF,#01,#EE,#01,#69,#02,#99,#01,#66,#01,#EF,#01,#E6,#01,#99
    DB #02,#76,#02,#77,#01,#70,#0C,#00,#01,#0E,#01,#60,#01,#6E,#02,#EE
    DB #01,#FE,#02,#66,#01,#6E,#02,#EE,#01,#9F,#02,#99,#01,#EE,#01,#EF
    DB #01,#FF,#01,#FE,#01,#66,#01,#67,#04,#00,#01,#70,#01,#00,#01,#E6
    DB #01,#66,#01,#77,#01,#66,#01,#EE,#01,#FE,#01,#66,#01,#EE,#01,#66
    DB #02,#EE,#01,#E6,#01,#66,#01,#99,#02,#6E,#01,#96,#01,#66,#01,#6E
    DB #01,#E7,#01,#77,#09,#00,#01,#07,#01,#67,#01,#66,#01,#70,#0D,#00
    DB #01,#07,#01,#00,#01,#06,#01,#EF,#01,#FF,#01,#E6,#01,#6E,#01,#99
    DB #01,#EE,#01,#EF,#01,#9F,#01,#F9,#01,#99,#01,#9E,#01,#EF,#02,#FF
    DB #01,#EE,#01,#FE,#01,#60,#05,#00,#01,#06,#01,#60,#01,#06,#01,#67
    DB #01,#6E,#01,#E6,#01,#69,#02,#99,#04,#66,#01,#EE,#01,#FE,#01,#EF
    DB #01,#FE,#02,#E6,#06,#00,#01,#66,#01,#07,#01,#77,#01,#6E,#01,#66
    DB #01,#69,#01,#99,#01,#96,#01,#69,#01,#F9,#01,#67,#01,#69,#01,#96
    DB #02,#76,#01,#67,#01,#06,#01,#70,#07,#00,#02,#D0,#02,#00,#01,#0D
    DB #06,#00,#02,#0D,#10,#00,#03,#44,#06,#66,#01,#4C,#06,#66,#01,#64
    DB #02,#44,#01,#C4,#01,#40,#02,#00,#01,#04,#01,#44,#02,#66,#01,#44
    DB #01,#40,#02,#00,#01,#04,#02,#44,#01,#46,#0E,#66,#01,#64,#02,#44
    DB #01,#40,#01,#B0,#01,#00,#01,#0C,#01,#44,#01,#46,#01,#66,#01,#44
    DB #01,#40,#01,#00,#01,#EE,#01,#FE,#02,#EE,#01,#70,#01,#66,#06,#00
    DB #01,#66,#01,#00,#01,#76,#01,#7E,#01,#E6,#01,#69,#01,#99,#01,#66
    DB #01,#9F,#01,#96,#01,#77,#01,#69,#01,#97,#02,#76,#01,#60,#01,#06
    DB #01,#60,#04,#00,#01,#0D,#01,#00,#01,#0D,#01,#0C,#01,#D0,#01,#0D
    DB #02,#00,#01,#D0,#01,#0D,#01,#D0,#04,#00,#01,#D0,#0F,#00,#01,#04
    DB #01,#40,#01,#C0,#01,#44,#0E,#66,#01,#64,#02,#44,#01,#40,#02,#00
    DB #01,#0C,#01,#A4,#02,#66,#01,#D4,#01,#40,#02,#00,#01,#04,#01,#C4
    DB #01,#44,#01,#46,#01,#B4,#01,#66,#01,#46,#03,#66,#01,#B6,#05,#66
    DB #01,#6B,#01,#66,#01,#64,#01,#44,#01,#C4,#01,#4B,#01,#9B,#01,#00
    DB #01,#04,#01,#D4,#01,#46,#01,#66,#01,#44,#01,#C0,#01,#00,#01,#EE
    DB #01,#FF,#01,#FE,#01,#EE,#01,#67,#01,#07,#05,#00,#01,#06,#01,#60
    DB #01,#07,#01,#67,#01,#77,#03,#66,#01,#69,#01,#96,#01,#0E,#01,#76
    DB #01,#99,#01,#67,#01,#69,#01,#66,#01,#70,#01,#00,#01,#66,#04,#00
    DB #01,#0D,#01,#00,#01,#CD,#01,#4C,#01,#D0,#01,#0C,#02,#00,#02,#D0
    DB #01,#0C,#02,#00,#01,#0D,#01,#00,#01,#D0,#01,#00,#01,#0D,#07,#00
    DB #01,#4D,#01,#04,#04,#00,#01,#04,#02,#0C,#01,#44,#02,#66,#01,#46
    DB #09,#66,#01,#64,#01,#66,#01,#64,#01,#44,#01,#4C,#03,#00,#01,#04
    DB #02,#66,#01,#64,#01,#44,#01,#40,#02,#00,#01,#0D,#02,#44,#01,#46
    DB #0E,#66,#01,#64,#02,#44,#01,#40,#01,#B0,#01,#00,#01,#04,#01,#0C
    DB #02,#66,#01,#44,#01,#40,#01,#00,#01,#EE,#01,#EF,#01,#FF,#01,#FE
    DB #01,#E6,#01,#76,#05,#00,#01,#60,#01,#00,#01,#07,#02,#70,#01,#6E
    DB #01,#60,#01,#76,#01,#77,#01,#7F,#01,#00,#01,#79,#01,#99,#01,#77
    DB #01,#76,#01,#66,#01,#60,#01,#00,#01,#66,#03,#00,#01,#0D,#01,#1D
    DB #01,#C1,#01,#D4,#01,#4C,#01,#D4,#01,#4C,#01,#04,#01,#44,#01,#DD
    DB #02,#44,#01,#04,#01,#4C,#01,#0D,#03,#44,#01,#CD,#01,#00,#01,#A0
    DB #04,#00,#01,#0C,#02,#44,#01,#C0,#03,#00,#01,#04,#01,#D4,#01,#4C
    DB #01,#46,#04,#66,#01,#64,#01,#66,#01,#C6,#03,#66,#01,#C6,#03,#66
    DB #01,#46,#02,#44,#01,#40,#02,#00,#01,#04,#02,#66,#01,#64,#01,#44
    DB #01,#C0,#01,#00,#01,#0D,#01,#DD,#02,#44,#01,#46,#01,#C6,#02,#66
    DB #01,#6C,#04,#66,#01,#46,#01,#66,#01,#6C,#03,#66,#03,#44,#01,#40
    DB #02,#00,#01,#04,#01,#44,#02,#66,#01,#64,#01,#40,#01,#00,#02,#EE
    DB #01,#EF,#01,#FF,#01,#FE,#01,#76,#01,#60,#04,#00,#01,#60,#01,#00
    DB #01,#07,#01,#70,#01,#00,#01,#76,#01,#66,#01,#06,#01,#70,#01,#76
    DB #01,#77,#01,#E9,#01,#9E,#01,#77,#01,#70,#01,#07,#01,#66,#05,#00
    DB #01,#0C,#01,#11,#01,#DC,#01,#D4,#02,#44,#01,#4C,#02,#44,#01,#D4
    DB #02,#44,#01,#4C,#01,#44,#01,#D4,#01,#4C,#02,#44,#01,#C4,#01,#D4
    DB #05,#00,#04,#44,#03,#00,#01,#04,#02,#44,#01,#46,#0F,#66,#02,#44
    DB #01,#40,#02,#00,#01,#04,#02,#66,#01,#64,#01,#44,#01,#40,#01,#00
    DB #01,#DD,#01,#04,#03,#44,#01,#46,#01,#66,#01,#46,#01,#C0,#01,#46
    DB #01,#66,#01,#46,#01,#C6,#02,#66,#01,#40,#01,#6B,#02,#66,#01,#44
    DB #01,#C4,#01,#44,#01,#D0,#02,#00,#01,#04,#01,#44,#02,#66,#01,#44
    DB #01,#40,#01,#00,#01,#EE,#01,#FF,#01,#FE,#01,#EF,#01,#EE,#01,#E7
    DB #08,#00,#01,#77,#01,#00,#01,#07,#01,#E6,#01,#70,#01,#77,#01,#76
    DB #01,#E6,#01,#99,#01,#96,#03,#00,#01,#77,#05,#00,#01,#01,#01,#C4
    DB #01,#4C,#01,#C4,#03,#44,#01,#4C,#04,#44,#01,#4D,#01,#44,#01,#DC
    DB #03,#44,#01,#C4,#01,#D4,#01,#44,#01,#4C,#01,#A0,#02,#00,#02,#44
    DB #01,#4C,#01,#44,#01,#40,#03,#00,#02,#44,#02,#46,#03,#66,#01,#46
    DB #04,#66,#01,#76,#03,#66,#01,#C6,#01,#46,#01,#64,#01,#44,#01,#D0
    DB #02,#00,#01,#04,#01,#46,#03,#66,#01,#40,#01,#00,#01,#B0,#01,#0D
    DB #01,#C4,#02,#44,#01,#66,#01,#46,#01,#66,#01,#64,#02,#66,#01,#64
    DB #02,#66,#01,#B6,#01,#64,#02,#66,#01,#64,#03,#44,#01,#4D,#02,#00
    DB #01,#04,#01,#44,#02,#66,#01,#44,#01,#40,#01,#00,#01,#6E,#01,#EF
    DB #01,#FF,#01,#FE,#01,#EE,#01,#E6,#01,#70,#07,#00,#01,#77,#02,#00
    DB #01,#66,#01,#67,#02,#66,#01,#E9,#01,#99,#01,#67,#02,#00,#01,#06
    DB #01,#60,#04,#00,#01,#0D,#01,#11,#01,#C4,#01,#44,#01,#4C,#08,#44
    DB #01,#4D,#01,#44,#01,#D4,#03,#44,#01,#C4,#01,#4D,#01,#44,#03,#00
    DB #01,#0C,#01,#44,#01,#C4,#02,#44,#01,#D0,#03,#00,#01,#04,#01,#44
    DB #01,#46,#04,#66,#01,#6C,#07,#66,#01,#46,#02,#66,#01,#64,#01,#44
    DB #01,#40,#02,#00,#01,#04,#01,#46,#01,#66,#01,#A6,#01,#66,#01,#4B
    DB #01,#00,#01,#2B,#01,#00,#03,#44,#02,#66,#01,#6C,#03,#66,#01,#C6
    DB #01,#46,#01,#66,#01,#46,#02,#66,#01,#64,#01,#44,#02,#4C,#01,#B4
    DB #01,#40,#01,#D0,#01,#00,#01,#0C,#01,#D4,#02,#66,#01,#44,#01,#40
    DB #01,#00,#04,#EE,#01,#E6,#01,#EE,#01,#E7,#07,#00,#01,#70,#02,#00
    DB #01,#76,#01,#99,#01,#E9,#01,#99,#01,#F9,#01,#9E,#01,#70,#02,#00
    DB #01,#06,#01,#60,#05,#00,#01,#DC,#02,#44,#01,#46,#01,#66,#01,#6D
    DB #01,#66,#01,#44,#01,#46,#01,#66,#05,#44,#01,#04,#05,#44,#01,#00
    DB #01,#DD,#01,#00,#01,#04,#04,#44,#01,#40,#03,#00,#01,#C4,#01,#44
    DB #01,#46,#01,#66,#01,#46,#07,#66,#01,#C6,#05,#66,#02,#44,#03,#00
    DB #01,#04,#01,#44,#03,#66,#01,#40,#01,#00,#01,#B0,#01,#00,#01,#44
    DB #01,#D4,#01,#44,#01,#46,#01,#66,#01,#B6,#02,#44,#03,#66,#01,#6C
    DB #01,#0C,#07,#44,#01,#40,#01,#30,#01,#00,#01,#04,#01,#44,#02,#66
    DB #01,#44,#01,#40,#01,#20,#01,#96,#01,#6E,#01,#E6,#01,#66,#01,#E6
bitmap_room_tileset_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_4_USED_END:
    ds 124, #FF
    org BITMAP_ROOM_DATA_BANK_4_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_5_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_5_ROM_START:
; Shared world tileset (atlas), packed 4bpp RLE; VRAM #11C05, raw 9211 bytes, RLE 6160 bytes
bitmap_room_tileset_rle_chunk_1:
    DB #01,#66,#01,#67,#0A,#00,#01,#06,#02,#99,#01,#9F,#01,#9E,#01,#E7
    DB #0A,#00,#01,#1D,#02,#44,#01,#46,#01,#44,#01,#66,#01,#6C,#01,#46
    DB #01,#66,#01,#44,#01,#66,#01,#64,#01,#66,#03,#44,#01,#04,#04,#44
    DB #01,#0D,#02,#00,#01,#04,#01,#44,#02,#66,#01,#44,#01,#4C,#02,#00
    DB #01,#04,#02,#44,#09,#66,#01,#64,#05,#66,#01,#64,#01,#C4,#01,#44
    DB #01,#4D,#02,#00,#01,#04,#01,#44,#02,#66,#01,#44,#01,#40,#03,#00
    DB #01,#4D,#03,#44,#01,#66,#01,#64,#0C,#44,#01,#D4,#01,#44,#01,#03
    DB #01,#23,#01,#00,#01,#04,#02,#44,#01,#66,#01,#44,#01,#CD,#01,#00
    DB #04,#66,#01,#E6,#01,#70,#0B,#00,#01,#06,#01,#9F,#02,#FF,#01,#96
    DB #0B,#00,#01,#0D,#02,#44,#03,#66,#01,#44,#01,#46,#02,#64,#01,#66
    DB #01,#64,#01,#66,#01,#64,#01,#46,#02,#44,#01,#40,#01,#44,#01,#4C
    DB #01,#CC,#01,#D0,#02,#00,#01,#04,#01,#46,#01,#64,#01,#66,#01,#64
    DB #01,#40,#02,#00,#01,#04,#02,#44,#01,#66,#01,#46,#05,#66,#01,#67
    DB #06,#66,#02,#64,#03,#44,#02,#00,#01,#0D,#01,#44,#02,#66,#01,#4C
    DB #01,#40,#03,#00,#01,#DC,#01,#44,#01,#B4,#0D,#44,#01,#DC,#01,#44
    DB #01,#D4,#01,#44,#01,#00,#01,#30,#01,#00,#01,#04,#04,#44,#01,#40
    DB #01,#00,#04,#66,#01,#EE,#01,#66,#01,#60,#0A,#00,#01,#06,#01,#9F
    DB #01,#FF,#01,#F9,#01,#60,#0A,#00,#01,#0D,#01,#04,#01,#44,#01,#46
    DB #02,#64,#02,#66,#01,#64,#04,#66,#01,#64,#04,#66,#01,#64,#01,#66
    DB #02,#CD,#01,#40,#02,#00,#01,#04,#01,#46,#02,#66,#01,#64,#01,#40
    DB #02,#00,#01,#0D,#02,#44,#01,#66,#01,#6C,#01,#66,#01,#46,#01,#66
    DB #01,#64,#09,#66,#01,#64,#02,#44,#01,#4C,#02,#00,#01,#0C,#01,#44
    DB #01,#46,#01,#66,#01,#44,#01,#40,#02,#00,#02,#0D,#01,#4B,#01,#44
    DB #01,#C4,#0B,#44,#01,#C4,#01,#4D,#01,#44,#01,#4D,#01,#40,#03,#00
    DB #01,#0D,#01,#40,#03,#44,#01,#40,#01,#00,#02,#E6,#01,#6E,#01,#66
    DB #01,#6E,#01,#E7,#01,#66,#0A,#00,#01,#07,#03,#66,#0C,#00,#01,#D4
    DB #01,#44,#01,#46,#01,#66,#01,#D6,#06,#66,#03,#64,#03,#66,#02,#64
    DB #01,#44,#01,#CC,#01,#C0,#02,#00,#01,#04,#02,#46,#01,#66,#01,#64
    DB #01,#C0,#02,#00,#01,#04,#02,#44,#01,#46,#04,#66,#01,#6C,#0A,#66
    DB #01,#C4,#01,#44,#01,#40,#02,#00,#01,#04,#01,#44,#03,#66,#01,#40
    DB #02,#00,#01,#0D,#01,#00,#01,#B4,#01,#44,#01,#CD,#01,#44,#01,#4C
    DB #05,#44,#01,#04,#04,#44,#01,#4D,#01,#44,#01,#0D,#05,#00,#01,#4C
    DB #03,#44,#02,#00,#01,#9E,#01,#66,#01,#69,#02,#66,#01,#E6,#01,#06
    DB #0C,#00,#01,#77,#01,#70,#0C,#00,#01,#0D,#01,#D4,#01,#44,#01,#64
    DB #01,#6C,#03,#66,#01,#64,#01,#66,#01,#46,#01,#66,#01,#64,#05,#66
    DB #01,#64,#02,#44,#01,#4D,#01,#DC,#01,#00,#01,#C4,#01,#46,#02,#66
    DB #01,#64,#01,#40,#03,#00,#02,#44,#08,#66,#01,#6C,#02,#66,#01,#6C
    DB #04,#66,#02,#44,#03,#00,#01,#04,#01,#46,#03,#66,#01,#C0,#04,#00
    DB #01,#B4,#02,#4D,#01,#D4,#02,#44,#01,#4B,#01,#04,#02,#44,#01,#00
    DB #01,#04,#03,#44,#01,#40,#01,#D0,#01,#0D,#05,#00,#01,#04,#01,#4D
    DB #01,#4C,#03,#00,#01,#96,#01,#E6,#01,#96,#01,#66,#01,#60,#01,#6E
    DB #1A,#00,#01,#0D,#01,#D4,#02,#44,#01,#46,#02,#66,#01,#6D,#03,#66
    DB #01,#46,#02,#66,#01,#64,#02,#66,#01,#64,#02,#66,#02,#44,#01,#40
    DB #02,#00,#01,#04,#01,#46,#02,#66,#01,#44,#01,#40,#03,#00,#01,#44
    DB #01,#C4,#01,#66,#01,#46,#01,#64,#06,#66,#01,#44,#05,#66,#01,#46
    DB #02,#44,#03,#00,#01,#04,#01,#46,#02,#66,#01,#A6,#01,#40,#04,#00
    DB #01,#B0,#02,#00,#01,#D0,#02,#00,#01,#0B,#0B,#00,#01,#D0,#0A,#00
    DB #01,#E6,#01,#9E,#01,#E6,#01,#6E,#01,#70,#01,#66,#1B,#00,#01,#04
    DB #02,#44,#01,#66,#01,#46,#03,#66,#01,#46,#03,#66,#02,#64,#03,#66
    DB #01,#46,#01,#66,#02,#44,#01,#40,#02,#00,#01,#04,#01,#46,#02,#66
    DB #01,#64,#01,#40,#03,#00,#02,#44,#01,#46,#02,#66,#01,#64,#02,#66
    DB #01,#6C,#07,#66,#01,#46,#01,#66,#01,#44,#01,#C4,#01,#40,#02,#00
    DB #01,#0A,#01,#C6,#02,#66,#01,#64,#01,#40,#03,#00,#01,#0B,#01,#2B
    DB #02,#00,#01,#D0,#02,#00,#01,#A2,#01,#A0,#15,#00,#01,#E6,#01,#6E
    DB #01,#66,#01,#6E,#01,#07,#01,#67,#1B,#00,#01,#04,#02,#44,#01,#46
    DB #01,#66,#01,#46,#01,#66,#01,#46,#01,#66,#02,#64,#01,#46,#02,#66
    DB #01,#46,#03,#66,#01,#46,#01,#64,#01,#44,#01,#40,#02,#00,#01,#04
    DB #01,#46,#01,#66,#02,#64,#01,#40,#02,#00,#01,#04,#01,#4D,#02,#44
    DB #03,#66,#01,#4C,#05,#66,#01,#6C,#03,#66,#02,#64,#02,#44,#01,#C0
    DB #02,#00,#01,#04,#01,#46,#02,#66,#01,#64,#01,#40,#04,#00,#01,#B0
    DB #01,#00,#02,#0D,#02,#00,#01,#0A,#2E,#00,#04,#66,#01,#76,#01,#64
    DB #05,#66,#01,#46,#04,#66,#0A,#00,#01,#07,#01,#7A,#01,#A7,#01,#70
    DB #1A,#00,#01,#FE,#06,#EE,#01,#EF,#01,#00,#01,#0C,#01,#40,#01,#44
    DB #01,#CD,#01,#0C,#01,#C0,#06,#00,#01,#FF,#01,#00,#01,#10,#01,#FF
    DB #01,#00,#01,#10,#08,#00,#03,#77,#02,#00,#01,#7E,#01,#E6,#01,#6E
    DB #02,#EE,#01,#67,#01,#6E,#01,#EE,#09,#00,#01,#0D,#03,#00,#01,#30
    DB #01,#00,#01,#04,#08,#00,#03,#66,#01,#67,#0C,#66,#03,#00,#01,#0F
    DB #01,#B0,#05,#00,#01,#07,#01,#7A,#01,#AA,#01,#70,#1A,#00,#08,#FF
    DB #01,#00,#01,#CC,#02,#44,#01,#D2,#01,#D0,#01,#4C,#06,#00,#01,#EF
    DB #01,#00,#01,#10,#01,#EF,#01,#00,#01,#10,#07,#00,#01,#07,#01,#E8
    DB #01,#EE,#01,#67,#02,#00,#01,#6E,#01,#E6,#03,#EE,#01,#E6,#01,#AE
    DB #01,#EE,#04,#00,#01,#D0,#02,#00,#01,#02,#01,#00,#01,#0D,#02,#00
    DB #01,#03,#02,#00,#01,#04,#03,#00,#01,#A0,#04,#00,#01,#46,#0F,#66
    DB #03,#00,#01,#FB,#01,#BB,#05,#00,#01,#07,#01,#7A,#01,#AA,#01,#70
    DB #1C,#00,#01,#0F,#06,#00,#02,#C4,#01,#4C,#01,#CD,#01,#00,#01,#4C
    DB #01,#40,#05,#00,#01,#EF,#02,#00,#01,#EF,#09,#00,#01,#0E,#01,#BB
    DB #01,#88,#01,#EE,#01,#77,#01,#00,#01,#6E,#01,#EE,#01,#6E,#02,#EE
    DB #01,#E6,#02,#EE,#03,#00,#03,#44,#01,#4C,#02,#44,#01,#4C,#01,#D0
    DB #01,#00,#01,#0D,#01,#00,#01,#04,#01,#C4,#02,#44,#01,#C4,#01,#44
    DB #01,#4C,#03,#00,#01,#66,#01,#64,#01,#66,#01,#47,#01,#64,#01,#44
    DB #01,#4B,#06,#66,#01,#6A,#01,#66,#01,#C6,#02,#00,#01,#0F,#02,#BB
    DB #01,#B0,#04,#00,#01,#07,#01,#7A,#01,#A7,#01,#70,#0F,#00,#01,#0E
    DB #01,#B0,#0C,#00,#02,#FF,#01,#E0,#02,#00,#01,#04,#01,#44,#01,#C4
    DB #01,#4C,#01,#44,#01,#04,#01,#4C,#01,#40,#05,#00,#01,#EF,#02,#00
    DB #01,#EF,#08,#00,#01,#07,#01,#6B,#02,#8E,#01,#EE,#01,#67,#01,#00
    DB #01,#76,#01,#66,#03,#77,#01,#70,#02,#77,#02,#00,#09,#44,#01,#00
    DB #01,#0D,#01,#00,#08,#44,#02,#00,#01,#66,#02,#64,#01,#76,#02,#44
    DB #01,#B6,#09,#66,#02,#00,#01,#0B,#02,#BB,#01,#EA,#04,#00,#01,#07
    DB #01,#AA,#01,#A7,#01,#70,#0F,#00,#01,#AB,#01,#BB,#0E,#00,#01,#F0
    DB #02,#00,#03,#44,#01,#CC,#01,#44,#01,#CC,#02,#44,#05,#00,#01,#EF
    DB #02,#00,#01,#EF,#08,#00,#01,#76,#01,#8E,#01,#88,#01,#8E,#01,#EE
    DB #01,#66,#01,#00,#01,#6E,#01,#E6,#01,#70,#01,#77,#01,#70,#01,#77
    DB #01,#70,#01,#77,#01,#00,#01,#04,#01,#C4,#01,#66,#01,#6C,#01,#46
    DB #01,#64,#05,#44,#01,#4D,#01,#A4,#02,#44,#03,#66,#03,#44,#01,#D0
    DB #01,#00,#01,#66,#01,#64,#01,#44,#01,#47,#01,#44,#04,#66,#01,#6A
    DB #06,#66,#02,#00,#01,#AE,#01,#BB,#01,#BE,#01,#AA,#04,#00,#01,#07
    DB #01,#7A,#01,#77,#01,#70,#0E,#00,#01,#0A,#01,#BB,#0C,#00,#01,#0E
    DB #02,#FF,#03,#00,#02,#4C,#01,#44,#01,#C4,#03,#44,#01,#4C,#05,#00
    DB #01,#EF,#02,#00,#01,#EF,#08,#00,#01,#EB,#01,#EE,#01,#8E,#01,#EE
    DB #01,#E6,#01,#66,#01,#70,#01,#6E,#01,#E6,#01,#77,#01,#66,#01,#77
    DB #01,#66,#01,#67,#01,#66,#01,#00,#01,#04,#01,#44,#05,#66,#05,#44
    DB #01,#DA,#02,#44,#03,#66,#03,#44,#01,#40,#01,#00,#01,#66,#01,#64
    DB #01,#06,#01,#64,#01,#74,#01,#44,#0A,#66,#02,#00,#01,#AA,#01,#EB
    DB #01,#EA,#01,#AA,#04,#00,#01,#07,#01,#7A,#01,#77,#01,#A0,#01,#07
    DB #01,#70,#0C,#00,#01,#AB,#02,#B0,#0B,#00,#01,#0F,#05,#00,#08,#44
    DB #05,#00,#01,#EF,#02,#00,#01,#EF,#07,#00,#01,#76,#01,#8E,#02,#EE
    DB #01,#E6,#01,#EE,#01,#66,#01,#67,#01,#6E,#01,#E6,#01,#77,#03,#66
    DB #01,#67,#01,#66,#01,#00,#01,#04,#01,#46,#05,#66,#01,#6A,#03,#66
    DB #01,#6A,#03,#66,#01,#6A,#03,#66,#02,#44,#01,#40,#01,#00,#02,#66
    DB #01,#64,#01,#44,#01,#40,#01,#04,#01,#46,#09,#66,#02,#00,#01,#AA
    DB #01,#AE,#01,#AA,#01,#AB,#04,#00,#01,#07,#01,#7A,#01,#A7,#01,#A0
    DB #01,#07,#01,#70,#0B,#00,#01,#0A,#01,#BB,#03,#00,#01,#FE,#06,#EE
    DB #01,#EF,#03,#00,#02,#FF,#01,#E0,#02,#00,#01,#44,#01,#46,#01,#66
    DB #02,#44,#01,#4C,#02,#44,#05,#00,#01,#EF,#01,#FF,#01,#0F,#01,#EF
    DB #01,#FF,#01,#0F,#01,#FF,#01,#0F,#01,#FF,#01,#0F,#01,#FF,#01,#7E
    DB #01,#8E,#03,#EE,#01,#E6,#01,#6E,#01,#67,#01,#6E,#01,#E6,#01,#77
    DB #03,#66,#01,#67,#01,#66,#01,#00,#01,#04,#01,#D4,#03,#66,#01,#6B
    DB #0C,#66,#01,#A6,#01,#44,#01,#C4,#01,#40,#01,#00,#02,#66,#01,#44
    DB #01,#D4,#01,#44,#01,#74,#01,#76,#06,#66,#01,#64,#02,#66,#02,#00
    DB #01,#AA,#01,#EF,#01,#EA,#01,#AA,#04,#00,#01,#07,#01,#7A,#01,#77
    DB #01,#70,#0D,#00,#01,#AB,#01,#E0,#01,#B0,#02,#00,#08,#FF,#05,#00
    DB #01,#F0,#02,#00,#01,#46,#01,#66,#01,#44,#01,#66,#01,#64,#01,#66
    DB #02,#44,#05,#00,#01,#EF,#02,#0F,#01,#EF,#07,#0F,#01,#68,#04,#EE
    DB #01,#67,#01,#66,#01,#67,#01,#76,#01,#66,#01,#07,#01,#77,#03,#67
    DB #01,#66,#01,#00,#01,#04,#01,#44,#01,#46,#05,#66,#01,#64,#01,#46
    DB #04,#66,#01,#B6,#04,#66,#02,#44,#01,#40,#01,#00,#02,#64,#01,#CD
    DB #01,#2D,#01,#46,#01,#67,#01,#47,#04,#66,#01,#6D,#04,#66,#02,#00
    DB #01,#AE,#01,#FB,#01,#BE,#01,#AA,#04,#00,#01,#07,#01,#7A,#01,#A7
    DB #01,#70,#0C,#00,#01,#0A,#01,#BE,#06,#00,#01,#0F,#07,#00,#01,#0E
    DB #02,#FF,#03,#00,#01,#46,#02,#64,#01,#66,#01,#64,#01,#66,#01,#64
    DB #01,#46,#05,#00,#01,#EF,#01,#0F,#01,#FF,#01,#EF,#01,#0F,#01,#FF
    DB #01,#0F,#01,#FF,#01,#0F,#01,#FF,#01,#0F,#01,#7E,#04,#EE,#01,#67
    DB #01,#66,#01,#77,#01,#6E,#01,#E6,#01,#70,#05,#77,#02,#00,#02,#44
    DB #01,#46,#02,#66,#09,#44,#02,#66,#04,#44,#01,#C0,#01,#00,#01,#66
    DB #01,#64,#01,#44,#01,#D4,#02,#64,#01,#7F,#09,#66,#02,#00,#01,#0F
    DB #02,#BB,#01,#EA,#04,#00,#01,#07,#01,#7A,#01,#A7,#01,#70,#0B,#00
    DB #01,#EA,#01,#AA,#01,#E0,#07,#00,#02,#FF,#01,#E0,#04,#00,#01,#0F
    DB #05,#00,#01,#64,#04,#66,#01,#64,#02,#66,#05,#00,#01,#EF,#02,#00
    DB #01,#EF,#07,#00,#01,#7E,#01,#EE,#01,#E6,#01,#EE,#02,#66,#01,#67
    DB #01,#70,#01,#6E,#01,#E6,#02,#70,#01,#77,#01,#70,#01,#77,#01,#70
    DB #02,#00,#01,#04,#08,#44,#01,#04,#09,#44,#01,#D4,#02,#00,#01,#66
    DB #01,#64,#02,#44,#01,#66,#01,#44,#01,#F6,#03,#66,#01,#62,#05,#66
    DB #02,#00,#01,#0B,#02,#BB,#01,#B0,#04,#00,#01,#07,#01,#77,#01,#A7
    DB #01,#70,#0A,#00,#01,#0E,#01,#B0,#01,#0B,#01,#E0,#09,#00,#01,#F0
    DB #05,#00,#02,#FF,#01,#E0,#02,#00,#04,#66,#03,#64,#01,#66,#05,#00
    DB #01,#EF,#02,#00,#01,#EF,#07,#00,#01,#76,#01,#EE,#01,#66,#01,#E6
    DB #02,#66,#01,#67,#01,#70,#01,#6E,#01,#E6,#01,#77,#01,#76,#01,#67
    DB #01,#66,#01,#67,#01,#66,#03,#00,#01,#C4,#02,#44,#01,#4C,#01,#44
    DB #01,#4C,#01,#44,#01,#40,#01,#00,#01,#4D,#01,#44,#01,#D0,#01,#C4
    DB #03,#44,#01,#C4,#01,#44,#03,#00,#01,#66,#01,#64,#01,#B4,#01,#44
    DB #01,#46,#01,#4C,#01,#46,#09,#66,#03,#00,#02,#BB,#05,#00,#01,#07
    DB #01,#77,#01,#A7,#01,#70,#0A,#00,#01,#0B,#01,#B0,#01,#AB,#01,#E0
    DB #06,#00,#01,#0E,#02,#FF,#08,#00,#01,#F0,#02,#00,#01,#66,#01,#64
    DB #01,#66,#01,#46,#01,#66,#01,#64,#02,#66,#05,#00,#01,#EF,#02,#00
    DB #01,#EF,#07,#00,#01,#77,#01,#66,#01,#76,#03,#66,#01,#70,#01,#00
    DB #01,#6E,#01,#E6,#01,#77,#03,#66,#01,#67,#01,#66,#0C,#00,#01,#0D
    DB #06,#00,#01,#20,#04,#00,#02,#66,#01,#6B,#0A,#66,#01,#44,#02,#66
    DB #03,#00,#01,#0B,#01,#B0,#05,#00,#01,#07,#01,#77,#01,#AA,#01,#70
    DB #0B,#00,#01,#BA,#01,#BE,#07,#00,#01,#0F,#07,#00,#01,#0E,#02,#FF
    DB #03,#00,#03,#66,#01,#46,#02,#66,#01,#64,#01,#66,#05,#00,#01,#EF
    DB #02,#00,#01,#EF,#08,#00,#01,#77,#01,#76,#01,#67,#01,#66,#01,#77
    DB #01,#70,#01,#00,#01,#76,#01,#67,#01,#07,#01,#66,#01,#67,#01,#66
    DB #01,#67,#01,#66,#0C,#00,#01,#D2,#01,#D0,#0A,#00,#01,#64,#01,#46
    DB #01,#66,#01,#64,#03,#66,#01,#46,#08,#66,#0A,#00,#01,#07,#01,#77
    DB #01,#A7,#01,#70,#0B,#00,#01,#0B,#01,#E0,#08,#00,#02,#FF,#01,#F0
    DB #04,#00,#01,#0F,#05,#00,#01,#66,#01,#46,#03,#66,#02,#64,#01,#66
    DB #05,#00,#01,#EF,#02,#00,#01,#EF,#09,#00,#03,#77,#03,#00,#01,#6E
    DB #01,#E6,#01,#77,#01,#66,#01,#67,#01,#66,#01,#67,#01,#66,#0C,#00
    DB #01,#0D,#0B,#00,#10,#66,#0A,#00,#01,#07,#01,#7A,#01,#A7,#01,#70
    DB #15,#00,#02,#FF,#01,#F0,#05,#00,#02,#FF,#01,#F0,#02,#00,#01,#46
    DB #01,#66,#02,#64,#01,#46,#02,#66,#01,#46,#05,#00,#01,#FF,#02,#00
    DB #01,#FF,#09,#00,#01,#07,#01,#00,#01,#07,#03,#00,#01,#6E,#01,#E6
    DB #01,#77,#03,#66,#01,#67,#01,#66,#32,#00,#01,#07,#01,#7A,#01,#A7
    DB #01,#70,#7C,#00,#01,#07,#01,#7A,#01,#AA,#01,#70,#7C,#00,#01,#07
    DB #01,#7A,#01,#AA,#01,#70,#7C,#00,#01,#07,#01,#7A,#01,#A7,#01,#70
    DB #7C,#00,#01,#07,#01,#AA,#01,#A7,#01,#70,#7C,#00,#01,#07,#01,#7A
    DB #01,#77,#01,#70,#7C,#00,#01,#07,#01,#7A,#01,#77,#01,#A0,#01,#07
    DB #01,#70,#7A,#00,#01,#07,#01,#7A,#01,#A7,#01,#A0,#01,#07,#01,#70
    DB #7A,#00,#01,#07,#01,#7A,#01,#77,#01,#70,#7C,#00,#01,#07,#01,#7A
    DB #01,#A7,#01,#70,#7C,#00,#01,#07,#01,#7A,#01,#A7,#01,#70,#7C,#00
    DB #01,#07,#01,#77,#01,#A7,#01,#70,#7C,#00,#01,#07,#01,#77,#01,#A7
    DB #01,#70,#7C,#00,#01,#07,#01,#77,#01,#AA,#01,#70,#7C,#00,#01,#07
    DB #01,#77,#01,#A7,#01,#70,#7C,#00,#01,#07,#01,#7A,#01,#A7,#01,#70
    DB #52,#00,#01,#6E,#01,#E6,#01,#77,#03,#66,#01,#67,#04,#66,#01,#77
    DB #01,#B7,#01,#07,#01,#EE,#01,#E6,#02,#EE,#01,#76,#02,#EE,#01,#E6
    DB #01,#6E,#01,#67,#01,#6E,#01,#E6,#01,#77,#03,#66,#01,#67,#01,#66
    DB #01,#76,#04,#66,#01,#06,#09,#66,#02,#67,#02,#66,#01,#76,#02,#66
    DB #01,#76,#01,#66,#05,#77,#01,#0A,#01,#A0,#02,#76,#04,#66,#01,#06
    DB #04,#66,#01,#60,#01,#06,#03,#66,#01,#67,#01,#07,#0C,#77,#01,#0A
    DB #01,#A0,#01,#70,#03,#00,#01,#07,#01,#77,#03,#00,#01,#22,#01,#44
    DB #01,#77,#01,#4D,#01,#AC,#01,#57,#01,#44,#01,#22,#02,#66,#01,#60
    DB #01,#66,#01,#64,#01,#C6,#02,#66,#08,#00,#01,#6E,#01,#E6,#01,#77
    DB #01,#66,#01,#67,#01,#66,#01,#67,#02,#66,#01,#76,#01,#66,#01,#77
    DB #01,#A7,#01,#77,#01,#6E,#01,#E6,#02,#EE,#01,#6E,#02,#EE,#01,#E6
    DB #01,#6E,#01,#E6,#01,#6E,#01,#E6,#01,#77,#01,#66,#01,#67,#01,#66
    DB #01,#67,#01,#66,#01,#67,#08,#77,#01,#70,#02,#77,#01,#70,#02,#77
    DB #01,#76,#01,#07,#01,#76,#01,#66,#01,#76,#05,#66,#01,#67,#02,#66
    DB #01,#67,#01,#0A,#01,#A0,#01,#76,#01,#67,#08,#77,#01,#70,#02,#77
    DB #01,#70,#02,#77,#01,#70,#01,#67,#01,#76,#01,#66,#01,#76,#01,#67
    DB #01,#66,#01,#77,#02,#66,#01,#67,#02,#66,#01,#67,#01,#0A,#01,#06
    DB #01,#70,#03,#00,#01,#77,#01,#27,#03,#00,#02,#44,#01,#E0,#01,#7D
    DB #01,#A4,#01,#74,#01,#BA,#01,#77,#03,#66,#01,#06,#04,#66,#02,#EE
    DB #01,#6E,#02,#EE,#01,#E6,#01,#EE,#01,#E6,#01,#76,#01,#66,#01,#07
    DB #08,#66,#01,#76,#01,#67,#01,#00,#01,#66,#01,#67,#02,#EE,#01,#6E
    DB #02,#EE,#01,#E6,#01,#EE,#01,#E6,#01,#76,#01,#66,#01,#07,#05,#66
    DB #01,#07,#01,#76,#01,#67,#01,#76,#02,#66,#01,#76,#01,#66,#01,#76
    DB #01,#67,#01,#66,#01,#76,#03,#67,#01,#76,#01,#67,#01,#76,#01,#66
    DB #01,#76,#06,#66,#01,#76,#01,#66,#01,#77,#01,#0A,#01,#A0,#01,#76
    DB #01,#67,#01,#76,#01,#67,#01,#76,#02,#66,#01,#76,#01,#66,#01,#76
    DB #01,#67,#01,#66,#01,#76,#02,#67,#01,#66,#01,#70,#01,#67,#01,#76
    DB #01,#66,#01,#76,#01,#67,#01,#66,#01,#77,#02,#66,#01,#67,#02,#66
    DB #01,#60,#01,#A0,#01,#66,#01,#70,#02,#00,#01,#07,#01,#7A,#01,#AE
    DB #01,#70,#02,#00,#01,#47,#01,#7A,#01,#A4,#01,#7D,#01,#A4,#01,#74
    DB #01,#A7,#01,#70,#03,#66,#01,#00,#04,#66,#01,#77,#01,#67,#01,#07
    DB #03,#77,#01,#66,#01,#60,#01,#6E,#01,#E6,#01,#77,#03,#66,#01,#67
    DB #04,#66,#01,#76,#01,#66,#01,#07,#01,#6E,#01,#E6,#01,#77,#01,#67
    DB #01,#07,#03,#77,#01,#66,#01,#60,#01,#6E,#01,#E6,#01,#77,#03,#66
    DB #01,#67,#01,#66,#01,#07,#01,#7A,#01,#AA,#01,#7A,#01,#AA,#01,#A6
    DB #01,#AA,#01,#A6,#01,#6A,#01,#AA,#01,#A6,#01,#6A,#01,#AA,#01,#A6
    DB #01,#67,#01,#76,#01,#67,#02,#66,#01,#76,#02,#66,#01,#76,#03,#66
    DB #01,#76,#01,#67,#01,#70,#01,#A0,#01,#0A,#01,#76,#01,#67,#02,#66
    DB #01,#76,#05,#66,#01,#67,#02,#66,#01,#67,#02,#66,#01,#70,#01,#67
    DB #01,#76,#01,#67,#01,#76,#01,#67,#01,#66,#01,#76,#02,#66,#01,#67
    DB #02,#66,#01,#67,#01,#06,#01,#66,#01,#70,#02,#00,#01,#06,#01,#70
    DB #01,#BE,#01,#70,#03,#00,#01,#77,#01,#40,#01,#7D,#01,#A4,#01,#07
    DB #01,#77,#01,#00,#01,#66,#01,#46,#01,#66,#01,#46,#01,#0C,#02,#66
    DB #01,#C0,#01,#77,#01,#07,#01,#77,#01,#07,#01,#77,#01,#07,#01,#6E
    DB #01,#E7,#01,#6E,#01,#E6,#01,#77,#01,#66,#01,#67,#01,#66,#01,#67
    DB #04,#66,#01,#76,#02,#77,#01,#6E,#01,#E6,#01,#77,#01,#07,#01,#77
    DB #01,#07,#01,#77,#01,#07,#01,#6E,#01,#E7,#01,#6E,#01,#E6,#01,#77
    DB #01,#66,#01,#67,#01,#66,#01,#67,#01,#66,#01,#07,#01,#A0,#01,#00
    DB #01,#A0,#01,#00,#01,#0A,#01,#00,#01,#0A,#01,#A0,#01,#00,#01,#0A
    DB #01,#A0,#01,#00,#01,#0A,#01,#67,#01,#76,#01,#67,#02,#66,#01,#76
    DB #02,#66,#01,#76,#02,#66,#01,#67,#02,#66,#01,#77,#01,#0A,#01,#A0
    DB #01,#76,#01,#67,#01,#76,#01,#66,#01,#76,#08,#66,#01,#67,#02,#66
    DB #01,#70,#01,#67,#01,#76,#01,#66,#01,#76,#01,#66,#02,#76,#02,#66
    DB #01,#67,#02,#66,#02,#67,#01,#77,#01,#70,#02,#00,#01,#76,#01,#4B
    DB #01,#BA,#01,#47,#04,#00,#01,#77,#01,#4D,#01,#C4,#01,#70,#02,#00
    DB #01,#66,#01,#6C,#02,#66,#01,#40,#02,#66,#01,#06,#01,#66,#01,#76
    DB #01,#66,#01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6,#01,#6E,#01,#E6
    DB #01,#77,#01,#66,#01,#67,#01,#66,#01,#67,#02,#66,#01,#76,#01,#66
    DB #01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6,#01,#66,#01,#76,#01,#66
    DB #01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6,#01,#6E,#01,#E6,#01,#77
    DB #01,#66,#01,#67,#01,#66,#01,#67,#01,#66,#01,#77,#01,#00,#01,#66
    DB #01,#06,#01,#00,#01,#60,#01,#76,#01,#00,#01,#60,#01,#06,#01,#00
    DB #01,#60,#01,#06,#02,#67,#01,#76,#01,#67,#02,#66,#01,#76,#02,#66
    DB #01,#76,#02,#66,#01,#67,#02,#66,#01,#67,#01,#70,#01,#07,#01,#76
    DB #01,#77,#01,#76,#01,#66,#02,#76,#01,#66,#01,#77,#01,#66,#01,#67
    DB #01,#77,#02,#67,#01,#77,#02,#67,#01,#70,#01,#67,#01,#76,#01,#66
    DB #01,#76,#02,#66,#01,#76,#02,#66,#01,#67,#02,#66,#01,#67,#02,#66
    DB #01,#70,#02,#00,#01,#77,#01,#4A,#01,#44,#01,#07,#04,#00,#01,#77
    DB #01,#DD,#01,#C4,#01,#77,#01,#70,#01,#00,#04,#66,#01,#40,#02,#00
    DB #02,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6
    DB #01,#76,#01,#66,#03,#77,#01,#66,#03,#67,#01,#77,#01,#67,#01,#76
    DB #02,#77,#01,#6E,#01,#67,#01,#66,#01,#76,#01,#66,#01,#76,#01,#66
    DB #01,#77,#01,#6E,#01,#E6,#01,#76,#01,#66,#03,#77,#01,#66,#03,#67
    DB #01,#00,#02,#66,#01,#00,#01,#60,#01,#66,#01,#00,#01,#60,#01,#06
    DB #01,#00,#01,#60,#01,#06,#01,#66,#01,#67,#01,#76,#01,#67,#02,#77
    DB #01,#76,#01,#77,#01,#76,#02,#77,#01,#67,#01,#77,#01,#76,#04,#77
    DB #01,#76,#01,#67,#0E,#66,#01,#70,#01,#67,#07,#77,#01,#67,#01,#77
    DB #01,#76,#02,#77,#01,#67,#01,#77,#01,#70,#02,#00,#01,#77,#01,#47
    DB #01,#77,#02,#70,#03,#00,#01,#74,#01,#DA,#01,#45,#01,#70,#02,#00
    DB #03,#66,#01,#64,#01,#40,#01,#00,#01,#76,#02,#66,#01,#76,#01,#66
    DB #01,#76,#01,#66,#01,#77,#01,#6E,#01,#E7,#01,#6E,#01,#E6,#01,#70
    DB #01,#76,#01,#77,#01,#76,#01,#77,#01,#76,#04,#77,#01,#67,#01,#07
    DB #01,#6E,#01,#E7,#01,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#77
    DB #01,#6E,#01,#E7,#01,#6E,#01,#E6,#01,#70,#01,#76,#01,#77,#01,#76
    DB #01,#77,#01,#76,#01,#67,#01,#77,#01,#00,#01,#77,#01,#00,#01,#70
    DB #01,#77,#01,#00,#01,#70,#01,#00,#01,#07,#01,#70,#01,#00,#01,#07
    DB #01,#77,#01,#76,#01,#07,#0D,#66,#01,#67,#01,#76,#01,#60,#01,#77
    DB #01,#67,#01,#77,#01,#76,#01,#67,#01,#77,#01,#76,#02,#77,#01,#7E
    DB #02,#77,#01,#76,#01,#77,#01,#70,#01,#67,#01,#76,#0D,#66,#01,#70
    DB #02,#00,#01,#77,#01,#A4,#01,#47,#01,#70,#03,#00,#01,#07,#01,#7D
    DB #01,#A4,#01,#57,#01,#77,#02,#00,#03,#66,#01,#40,#02,#00,#01,#76
    DB #01,#66,#01,#67,#02,#77,#01,#76,#01,#77,#01,#70,#01,#66,#01,#67
    DB #01,#6E,#01,#E6,#02,#70,#01,#77,#01,#70,#01,#77,#01,#70,#01,#77
    DB #01,#70,#01,#07,#01,#77,#02,#07,#01,#6E,#01,#E6,#01,#67,#02,#77
    DB #01,#76,#01,#77,#01,#70,#01,#66,#01,#67,#01,#6E,#01,#E6,#02,#70
    DB #01,#77,#01,#70,#01,#77,#01,#70,#01,#67,#02,#77,#01,#07,#01,#00
    DB #01,#70,#01,#77,#01,#00,#01,#70,#01,#07,#02,#70,#01,#07,#02,#77
    DB #01,#76,#01,#67,#01,#77,#01,#67,#01,#77,#01,#76,#01,#67,#01,#77
    DB #01,#76,#07,#77,#01,#76,#01,#60,#0E,#77,#01,#70,#01,#67,#09,#77
    DB #01,#76,#02,#77,#01,#76,#01,#77,#01,#70,#02,#00,#01,#74,#01,#DA
    DB #01,#47,#01,#77,#01,#44,#01,#20,#02,#00,#01,#4D,#01,#C4,#01,#77
    DB #02,#44,#01,#22,#03,#66,#01,#40,#02,#00,#01,#76,#01,#66,#05,#77
    DB #01,#07,#01,#6E,#01,#E6,#01,#6E,#01,#E6,#0B,#77,#01,#07,#01,#6E
    DB #01,#E6,#05,#77,#01,#07,#01,#6E,#01,#E6,#01,#6E,#01,#E6,#06,#77
    DB #01,#67,#01,#06,#01,#60,#01,#06,#01,#00,#01,#60,#01,#06,#01,#00
    DB #01,#60,#01,#06,#02,#60,#01,#06,#02,#67,#01,#76,#01,#60,#07,#77
    DB #01,#70,#05,#77,#01,#70,#01,#76,#01,#67,#01,#77,#01,#66,#01,#76
    DB #01,#66,#01,#76,#02,#66,#01,#67,#01,#77,#02,#66,#02,#67,#01,#66
    DB #01,#70,#01,#67,#02,#77,#01,#06,#03,#77,#01,#67,#07,#77,#01,#70
    DB #01,#24,#01,#44,#01,#7D,#01,#DC,#01,#77,#01,#4E,#01,#E2,#01,#40
    DB #01,#22,#01,#40,#01,#4D,#01,#C5,#01,#76,#02,#A4,#01,#70,#03,#66
    DB #01,#40,#01,#00,#01,#07,#02,#66,#01,#77,#01,#70,#01,#07,#01,#77
    DB #02,#07,#01,#6E,#01,#E6,#01,#7E,#01,#E6,#01,#77,#01,#66,#01,#67
    DB #01,#66,#01,#67,#02,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#77
    DB #01,#6E,#01,#E7,#01,#77,#01,#70,#01,#07,#01,#77,#02,#07,#01,#6E
    DB #01,#E6,#01,#7E,#01,#E6,#01,#77,#01,#66,#01,#67,#01,#66,#01,#67
    DB #01,#66,#01,#67,#01,#A0,#01,#00,#01,#AA,#01,#00,#01,#AA,#01,#00
    DB #01,#0A,#01,#A0,#01,#06,#01,#60,#01,#A0,#01,#00,#01,#0A,#01,#67
    DB #01,#76,#01,#67,#01,#77,#01,#67,#01,#76,#01,#66,#01,#67,#01,#76
    DB #01,#67,#01,#66,#01,#76,#02,#66,#01,#67,#01,#77,#01,#60,#01,#76
    DB #01,#67,#02,#66,#01,#76,#05,#66,#01,#67,#02,#66,#01,#67,#02,#66
    DB #01,#70,#01,#07,#01,#70,#03,#66,#01,#76,#01,#66,#01,#67,#01,#66
    DB #01,#76,#02,#66,#03,#67,#01,#70,#01,#42,#01,#A4,#01,#4A,#01,#C4
    DB #01,#77,#01,#AA,#01,#66,#01,#00,#01,#44,#01,#EA,#01,#A4,#01,#44
    DB #01,#74,#01,#A4,#01,#77,#01,#00,#01,#66,#01,#46,#01,#64,#02,#00
    DB #01,#07,#03,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#77,#01,#6E
    DB #01,#E6,#01,#76,#01,#E6,#01,#07,#01,#66,#01,#67,#01,#66,#01,#67
    DB #02,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#70,#01,#6E,#01,#67
    DB #01,#66,#01,#76,#01,#66,#01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6
    DB #01,#76,#01,#E6,#01,#07,#01,#66,#01,#67,#01,#66,#01,#67,#01,#66
    DB #01,#67,#01,#7A,#01,#AA,#01,#66,#01,#AA,#01,#66,#01,#AA,#01,#A6
    DB #01,#6A,#02,#AA,#01,#6A,#01,#AA,#01,#A6,#01,#67,#01,#76,#01,#67
    DB #01,#76,#0C,#66,#01,#60,#01,#76,#01,#67,#05,#66,#01,#76,#02,#66
    DB #01,#67,#02,#66,#01,#67,#02,#66,#01,#70,#01,#07,#01,#70,#0D,#66
    DB #01,#70,#01,#00,#01,#74,#01,#BA,#01,#44,#01,#77,#01,#74,#01,#70
    DB #01,#00,#01,#07,#01,#4B,#01,#B7,#01,#44,#01,#57,#01,#70,#02,#00
    DB #01,#66,#01,#C6,#01,#64,#01,#00,#01,#0C,#01,#76,#01,#06,#01,#6C
    DB #03,#66,#01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6,#01,#6E,#01,#E6
    DB #01,#77,#01,#76,#01,#77,#01,#66,#01,#67,#02,#66,#01,#76,#01,#66
    DB #01,#77,#01,#67,#01,#77,#01,#6E,#01,#E6,#03,#66,#01,#76,#01,#66
    DB #01,#77,#01,#6E,#01,#E6,#01,#6E,#01,#E6,#01,#77,#01,#76,#01,#77
    DB #01,#66,#01,#67,#01,#66,#01,#67,#01,#70,#01,#66,#01,#76,#02,#66
    DB #01,#76,#05,#66,#01,#67,#01,#70,#01,#07,#01,#76,#01,#07,#01,#76
    DB #0C,#66,#01,#60,#01,#76,#01,#07,#02,#66,#01,#76,#02,#66,#01,#76
    DB #05,#66,#01,#67,#02,#66,#01,#70,#01,#07,#01,#70,#0D,#66,#01,#70
    DB #01,#00,#01,#07,#01,#44,#01,#74,#01,#57,#04,#00,#01,#77,#01,#47
    DB #01,#44,#01,#57,#03,#00,#02,#66,#01,#70,#02,#66,#01,#44,#01,#60
    DB #04,#66,#01,#76,#01,#66,#01,#70,#01,#66,#01,#67,#01,#76,#01,#66
    DB #01,#70,#08,#77,#01,#07,#01,#77,#01,#07,#01,#66,#01,#67,#03,#66
    DB #01,#76,#01,#66,#01,#70,#01,#66,#01,#67,#01,#76,#01,#66,#01,#70
    DB #05,#77,#01,#67,#01,#70,#01,#66,#01,#76,#02,#66,#01,#76,#02,#66
    DB #01,#67,#02,#66,#01,#77,#01,#0A,#01,#A0,#01,#76,#01,#67,#01,#76
    DB #01,#66,#01,#76,#01,#66,#01,#76,#01,#77,#01,#66,#01,#67,#01,#77
    DB #02,#66,#01,#77,#01,#66,#01,#60,#01,#76,#01,#67,#02,#66,#01,#76
    DB #02,#66,#01,#76,#02,#66,#01,#67,#02,#66,#01,#67,#01,#6A,#01,#A6
    DB #01,#70,#01,#67,#01,#70,#01,#66,#01,#76,#01,#66,#01,#76,#01,#67
    DB #02,#66,#01,#77,#02,#66,#01,#77,#02,#66,#01,#70,#02,#00,#01,#07
    DB #01,#4A,#01,#45,#01,#77,#03,#00,#02,#07,#01,#4C,#01,#47,#03,#00
    DB #02,#66,#01,#06,#04,#66,#01,#06,#03,#66,#01,#76,#01,#66,#01,#77
    DB #01,#6E,#01,#E6,#01,#7E,#01,#E6,#01,#74,#01,#60,#01,#04,#01,#6E
    DB #02,#46,#01,#EE,#01,#E0,#01,#EE,#01,#E6,#01,#6E,#01,#07,#01,#6E
    DB #01,#E7,#03,#66,#01,#76,#01,#66,#01,#77,#01,#6E,#01,#E6,#01,#7E
    DB #01,#E6,#01,#74,#01,#6E,#01,#E4,#01,#6E,#02,#46,#01,#07,#01,#70
    DB #01,#66,#01,#76,#02,#66,#01,#67,#02,#66,#01,#67,#01,#66,#01,#67
    DB #01,#70,#02,#AA,#01,#76,#01,#67,#01,#76,#01,#67,#01,#76,#01,#67
    DB #02,#76,#01,#67,#07,#77,#01,#76,#01,#67,#02,#66,#01,#76,#02,#66
    DB #01,#67,#02,#66,#01,#67,#03,#66,#01,#A6,#01,#AA,#01,#70,#01,#67
    DB #07,#77,#02,#76,#01,#66,#01,#76,#01,#70,#01,#76,#01,#67,#01,#70
    DB #02,#00,#01,#77,#01,#DD,#01,#C4,#02,#70,#03,#00,#01,#07,#01,#AA
    DB #01,#44,#02,#70,#01,#00,#01,#66,#01,#00,#01,#6C,#03,#66,#01,#6C
    DB #04,#66,#01,#7E,#01,#66,#01,#07,#01,#6E,#01,#A6,#10,#00,#03,#66
    DB #01,#7E,#01,#66,#01,#07,#01,#6E,#01,#A6,#02,#77,#01,#07,#05,#77
    DB #01,#07,#01,#76,#01,#66,#01,#76,#02,#66,#01,#77,#02,#66,#01,#67
    DB #01,#66,#01,#67,#01,#70,#01,#A0,#01,#0A,#02,#76,#0E,#66,#02,#67
    DB #02,#66,#01,#76,#02,#66,#01,#77,#02,#66,#01,#67,#02,#66,#01,#67
    DB #01,#AB,#01,#B6,#01,#70,#01,#76,#0F,#66,#02,#00,#01,#77,#01,#CD
    DB #01,#A4,#01,#70,#01,#74,#01,#44,#02,#00,#01,#04,#01,#44,#01,#77
    DB #02,#70,#01,#00,#01,#4C,#07,#66,#02,#00,#05,#AA,#12,#00,#05,#AA
    DB #64,#00,#04,#AA,#01,#A0,#12,#00,#01,#0A,#04,#AA,#04,#00,#01,#0E
    DB #03,#EE,#03,#00,#02,#99,#57,#00,#04,#AA,#14,#00,#04,#AA,#04,#00
    DB #01,#EE,#02,#FF,#01,#FE,#01,#E0,#01,#00,#01,#09,#01,#9A,#01,#A9
    DB #01,#90,#56,#00,#03,#AA,#01,#A0,#14,#00,#01,#0A,#03,#AA,#03,#00
    DB #01,#0E,#01,#EF,#03,#FF,#01,#EE,#01,#00,#01,#09,#02,#AA,#01,#90
    DB #56,#00,#03,#AA,#16,#00,#03,#AA,#03,#00,#01,#EE,#01,#FF,#01,#FE
    DB #01,#EE,#01,#FF,#01,#FE,#01,#E0,#01,#09,#02,#AA,#01,#90,#56,#00
    DB #02,#AA,#01,#A0,#16,#00,#01,#0A,#02,#AA,#02,#00,#01,#0E,#01,#EF
    DB #01,#FE,#01,#E0,#01,#00,#01,#EE,#01,#FF,#01,#EE,#01,#09,#01,#9A
    DB #01,#A9,#01,#90,#56,#00,#02,#AA,#18,#00,#02,#AA,#02,#00,#01,#0E
    DB #01,#FF,#01,#FE,#02,#00,#01,#0E,#01,#FF,#01,#FE,#01,#00,#02,#99
    DB #57,#00,#01,#AA,#01,#A0,#18,#00,#01,#0A,#01,#AA,#02,#00,#01,#0E
    DB #01,#FF,#01,#E0,#03,#00,#01,#EF,#01,#FE,#5A,#00,#01,#AA,#02,#00
    DB #16,#66,#02,#00,#01,#AA,#02,#00,#01,#0E,#01,#FF,#01,#E0,#03,#00
    DB #01,#EF,#01,#FE,#5A,#00,#01,#A0,#02,#00,#01,#68,#14,#88,#01,#86
    DB #02,#00,#01,#0A,#02,#00,#01,#0E,#01,#FF,#01,#E0,#03,#00,#01,#EF
    DB #01,#FE,#5D,#00,#01,#68,#14,#88,#01,#86,#05,#00,#01,#0E,#01,#FF
    DB #01,#FE,#02,#00,#01,#0E,#01,#FF,#01,#FE,#5D,#00,#01,#68,#14,#88
    DB #01,#86,#05,#00,#01,#0E,#01,#EF,#01,#FE,#01,#E0,#01,#00,#01,#EE
    DB #01,#FF,#01,#EE,#5D,#00,#01,#68,#14,#88,#01,#86,#06,#00,#01,#EE
    DB #01,#FF,#01,#FE,#01,#EE,#01,#FF,#01,#FE,#01,#E0,#5D,#00,#01,#68
    DB #14,#88,#01,#86,#06,#00,#01,#0E,#01,#EF,#03,#FF,#01,#EE,#5E,#00
    DB #01,#68,#14,#88,#01,#86,#07,#00,#01,#EE,#02,#FF,#01,#FE,#01,#E0
    DB #5E,#00,#01,#68,#14,#88,#01,#86,#07,#00,#01,#0E,#03,#EE,#5A,#00
bitmap_room_tileset_rle_chunk_1_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #14000, raw 6144 bytes, RLE 570 bytes
bitmap_room_tileset_rle_chunk_2:
    DB #05,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#02,#88,#01,#8A,#04,#AA,#01,#A8,#04,#88,#01,#8A
    DB #04,#AA,#01,#A8,#02,#88,#01,#86,#6A,#00,#01,#68,#02,#88,#01,#8A
    DB #04,#AA,#01,#A8,#04,#88,#01,#8A,#04,#AA,#01,#A8,#02,#88,#01,#86
    DB #6A,#00,#01,#68,#02,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8
    DB #04,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8,#02,#88,#01,#86
    DB #6A,#00,#01,#68,#02,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8
    DB #04,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8,#02,#88,#01,#86
    DB #6A,#00,#01,#68,#02,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8
    DB #04,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8,#02,#88,#01,#86
    DB #6A,#00,#01,#68,#02,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8
    DB #04,#88,#01,#8A,#01,#AA,#02,#11,#01,#AA,#01,#A8,#02,#88,#01,#86
    DB #6A,#00,#01,#68,#02,#88,#01,#8A,#04,#AA,#01,#A8,#04,#88,#01,#8A
    DB #04,#AA,#01,#A8,#02,#88,#01,#86,#6A,#00,#01,#68,#02,#88,#01,#8A
    DB #04,#AA,#01,#A8,#04,#88,#01,#8A,#04,#AA,#01,#A8,#02,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#04,#88,#01,#FF,#02,#88,#01,#FF,#02,#88,#01,#FF
    DB #02,#88,#01,#FF,#02,#88,#01,#FF,#03,#88,#01,#86,#6A,#00,#01,#68
    DB #04,#88,#01,#FF,#02,#88,#01,#FF,#02,#88,#01,#FF,#02,#88,#01,#FF
    DB #02,#88,#01,#FF,#03,#88,#01,#86,#6A,#00,#01,#68,#04,#88,#01,#FF
    DB #02,#88,#01,#FF,#02,#88,#01,#FF,#02,#88,#01,#FF,#02,#88,#01,#FF
    DB #03,#88,#01,#86,#6A,#00,#01,#68,#04,#88,#01,#FF,#05,#88,#01,#FF
    DB #05,#88,#01,#FF,#03,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#01,#68,#14,#88,#01,#86,#6A,#00,#01,#68,#14,#88,#01,#86
    DB #6A,#00,#16,#66,#6C,#00,#12,#88,#6E,#00,#12,#88,#6E,#00,#12,#88
    DB #6E,#00,#12,#88,#FF,#00,#FF,#00,#69,#00
bitmap_room_tileset_rle_chunk_2_end:

; Linked HUD dynamic widget #0 (iconRow) tile/glyph data, packed 4bpp RLE; VRAM #06A00, raw 2048 bytes, RLE 298 bytes
bitmap_room_hud_linked_0_rle_chunk_0:
    DB #01,#10,#01,#99,#02,#11,#01,#99,#03,#11,#01,#10,#01,#99,#02,#11
    DB #01,#99,#03,#11,#70,#00,#01,#09,#01,#FF,#01,#91,#01,#19,#01,#FF
    DB #01,#91,#02,#11,#01,#09,#01,#FF,#01,#91,#01,#19,#01,#FF,#01,#91
    DB #02,#11,#70,#00,#01,#9F,#01,#22,#01,#F9,#01,#9F,#01,#22,#01,#F9
    DB #02,#11,#01,#9F,#01,#11,#01,#F9,#01,#9F,#01,#11,#01,#F9,#02,#11
    DB #70,#00,#01,#F2,#01,#22,#01,#F9,#01,#9F,#01,#29,#01,#2F,#02,#11
    DB #01,#F1,#01,#11,#01,#F9,#01,#9F,#01,#11,#01,#1F,#02,#11,#70,#00
    DB #01,#F2,#01,#22,#01,#2F,#01,#F2,#02,#2F,#02,#11,#01,#F1,#01,#11
    DB #01,#1F,#01,#F1,#01,#11,#01,#1F,#02,#11,#70,#00,#01,#F2,#04,#22
    DB #01,#2F,#02,#11,#01,#F1,#04,#11,#01,#1F,#02,#11,#70,#00,#01,#9F
    DB #04,#22,#01,#2F,#02,#11,#01,#9F,#04,#11,#01,#1F,#02,#11,#70,#00
    DB #01,#19,#01,#F2,#03,#22,#01,#F9,#02,#11,#01,#19,#01,#F1,#03,#11
    DB #01,#F9,#02,#11,#70,#00,#01,#11,#01,#9F,#02,#22,#01,#2F,#01,#91
    DB #03,#11,#01,#9F,#02,#11,#01,#1F,#01,#91,#02,#11,#70,#00,#01,#11
    DB #01,#19,#01,#F2,#01,#22,#01,#F9,#04,#11,#01,#19,#01,#F1,#01,#11
    DB #01,#F9,#03,#11,#70,#00,#02,#11,#01,#9F,#01,#FF,#01,#91,#05,#11
    DB #01,#9F,#01,#FF,#01,#91,#03,#11,#70,#00,#02,#11,#01,#19,#01,#F9
    DB #06,#11,#01,#19,#01,#F9,#04,#11,#70,#00,#10,#11,#70,#00,#10,#11
    DB #70,#00,#10,#11,#70,#00,#10,#11,#70,#00
bitmap_room_hud_linked_0_rle_chunk_0_end:

; Linked HUD dynamic widget #1 (counter) tile/glyph data, packed 4bpp RLE; VRAM #07200, raw 1024 bytes, RLE 452 bytes
bitmap_room_hud_linked_1_rle_chunk_0:
    DB #01,#11,#02,#22,#02,#11,#01,#12,#01,#21,#02,#11,#02,#22,#02,#11
    DB #02,#22,#03,#11,#01,#22,#01,#11,#01,#12,#02,#22,#01,#21,#01,#11
    DB #01,#12,#01,#22,#01,#11,#01,#12,#02,#22,#01,#21,#01,#11,#02,#22
    DB #02,#11,#02,#22,#01,#11,#58,#00,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #01,#11,#01,#22,#01,#21,#01,#11,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#22,#01,#11
    DB #01,#1F,#01,#21,#03,#11,#01,#22,#04,#11,#01,#12,#01,#F1,#01,#1F
    DB #01,#21,#01,#12,#01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1,#58,#00
    DB #01,#1F,#01,#21,#01,#22,#01,#F1,#01,#11,#01,#12,#01,#21,#03,#11
    DB #01,#12,#01,#F1,#02,#11,#01,#12,#01,#F1,#01,#11,#02,#22,#01,#11
    DB #01,#1F,#02,#22,#01,#11,#01,#1F,#01,#21,#04,#11,#01,#22,#01,#11
    DB #01,#1F,#01,#21,#01,#12,#01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #58,#00,#01,#1F,#01,#22,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#21
    DB #02,#11,#01,#12,#01,#22,#02,#11,#01,#12,#01,#22,#01,#11,#01,#1F
    DB #01,#21,#01,#22,#03,#11,#01,#12,#01,#F1,#01,#1F,#02,#22,#02,#11
    DB #01,#12,#01,#21,#02,#11,#02,#22,#02,#11,#02,#22,#01,#F1,#58,#00
    DB #01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#21,#02,#11
    DB #01,#22,#04,#11,#01,#12,#01,#F1,#01,#1F,#02,#22,#01,#F1,#02,#11
    DB #01,#12,#01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#22
    DB #02,#11,#01,#1F,#01,#21,#01,#12,#01,#F1,#02,#11,#01,#12,#01,#F1
    DB #58,#00,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#21
    DB #01,#11,#01,#1F,#01,#21,#02,#11,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #02,#11,#01,#22,#01,#11,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#1F
    DB #01,#21,#01,#12,#01,#F1,#01,#11,#01,#22,#02,#11,#01,#1F,#01,#21
    DB #01,#12,#01,#F1,#02,#11,#01,#22,#01,#11,#58,#00,#01,#11,#02,#22
    DB #01,#11,#01,#1F,#02,#22,#01,#F1,#01,#1F,#02,#22,#01,#F1,#01,#11
    DB #02,#22,#03,#11,#01,#22,#02,#11,#02,#22,#02,#11,#02,#22,#02,#11
    DB #01,#22,#03,#11,#02,#22,#02,#11,#01,#22,#01,#21,#01,#11,#58,#00
    DB #28,#11,#58,#00
bitmap_room_hud_linked_1_rle_chunk_0_end:

; Linked HUD dynamic widget #2 (iconRow) tile/glyph data, packed 4bpp RLE; VRAM #0EA00, raw 2048 bytes, RLE 360 bytes
bitmap_room_hud_linked_2_rle_chunk_0:
    DB #01,#EE,#01,#11,#01,#E1,#01,#1E,#01,#11,#01,#E1,#01,#11,#02,#EE
    DB #01,#1E,#01,#11,#01,#E1,#02,#1E,#01,#11,#01,#EE,#70,#00,#01,#E1
    DB #06,#11,#01,#1E,#01,#E1,#05,#11,#01,#FF,#01,#1E,#70,#00,#05,#11
    DB #01,#10,#02,#11,#01,#E1,#04,#11,#01,#1F,#01,#00,#01,#F0,#70,#00
    DB #01,#E1,#04,#11,#01,#1D,#01,#B1,#06,#11,#01,#F0,#01,#00,#01,#0F
    DB #70,#00,#05,#11,#01,#DB,#01,#BB,#01,#1E,#04,#11,#01,#1F,#01,#00
    DB #01,#0F,#01,#F1,#70,#00,#04,#11,#01,#1D,#01,#BB,#02,#11,#01,#E1
    DB #03,#11,#01,#F0,#01,#00,#01,#F0,#01,#FE,#70,#00,#04,#11,#01,#FB
    DB #02,#B1,#04,#11,#01,#1F,#01,#00,#01,#0F,#01,#1F,#01,#11,#70,#00
    DB #01,#E1,#02,#11,#01,#1F,#01,#BB,#02,#11,#01,#1E,#03,#11,#01,#F0
    DB #01,#00,#01,#F0,#01,#F1,#01,#11,#70,#00,#03,#11,#01,#AB,#01,#01
    DB #01,#B1,#02,#11,#01,#E1,#01,#1F,#01,#FF,#01,#00,#01,#0F,#01,#1F
    DB #01,#11,#01,#1E,#70,#00,#02,#11,#01,#1A,#01,#B0,#05,#11,#01,#F0
    DB #02,#00,#01,#F1,#03,#11,#70,#00,#01,#E1,#01,#0A,#01,#AA,#01,#01
    DB #03,#11,#01,#1E,#01,#1F,#01,#00,#01,#FF,#01,#00,#01,#F1,#03,#11
    DB #70,#00,#01,#10,#01,#B1,#01,#1B,#01,#01,#04,#11,#01,#1F,#01,#00
    DB #01,#F0,#01,#00,#01,#F1,#03,#11,#70,#00,#01,#1B,#01,#B1,#01,#AB
    DB #01,#01,#04,#11,#01,#E1,#01,#F0,#01,#00,#01,#0F,#03,#11,#01,#1E
    DB #70,#00,#01,#11,#01,#BA,#01,#B0,#06,#11,#01,#1F,#01,#00,#01,#F1
    DB #04,#11,#70,#00,#01,#E1,#01,#1B,#01,#01,#04,#11,#01,#1E,#01,#E1
    DB #01,#11,#01,#FF,#04,#11,#01,#1E,#70,#00,#01,#EE,#01,#11,#01,#E1
    DB #01,#1E,#01,#11,#01,#EE,#01,#11,#02,#EE,#02,#E1,#01,#1E,#01,#11
    DB #01,#E1,#01,#1E,#01,#EE,#70,#00
bitmap_room_hud_linked_2_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_5_USED_END:
    ds 352, #FF
    org BITMAP_ROOM_DATA_BANK_5_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_6_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_6_ROM_START:
; Linked HUD dynamic widget #3 (counter) tile/glyph data, packed 4bpp RLE; VRAM #15800, raw 1024 bytes, RLE 452 bytes
bitmap_room_hud_linked_3_rle_chunk_0:
    DB #01,#11,#02,#22,#02,#11,#01,#12,#01,#21,#02,#11,#02,#22,#02,#11
    DB #02,#22,#03,#11,#01,#22,#01,#11,#01,#12,#02,#22,#01,#21,#01,#11
    DB #01,#12,#01,#22,#01,#11,#01,#12,#02,#22,#01,#21,#01,#11,#02,#22
    DB #02,#11,#02,#22,#01,#11,#58,#00,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #01,#11,#01,#22,#01,#21,#01,#11,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#22,#01,#11
    DB #01,#1F,#01,#21,#03,#11,#01,#22,#04,#11,#01,#12,#01,#F1,#01,#1F
    DB #01,#21,#01,#12,#01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1,#58,#00
    DB #01,#1F,#01,#21,#01,#22,#01,#F1,#01,#11,#01,#12,#01,#21,#03,#11
    DB #01,#12,#01,#F1,#02,#11,#01,#12,#01,#F1,#01,#11,#02,#22,#01,#11
    DB #01,#1F,#02,#22,#01,#11,#01,#1F,#01,#21,#04,#11,#01,#22,#01,#11
    DB #01,#1F,#01,#21,#01,#12,#01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #58,#00,#01,#1F,#01,#22,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#21
    DB #02,#11,#01,#12,#01,#22,#02,#11,#01,#12,#01,#22,#01,#11,#01,#1F
    DB #01,#21,#01,#22,#03,#11,#01,#12,#01,#F1,#01,#1F,#02,#22,#02,#11
    DB #01,#12,#01,#21,#02,#11,#02,#22,#02,#11,#02,#22,#01,#F1,#58,#00
    DB #01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#21,#02,#11
    DB #01,#22,#04,#11,#01,#12,#01,#F1,#01,#1F,#02,#22,#01,#F1,#02,#11
    DB #01,#12,#01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#22
    DB #02,#11,#01,#1F,#01,#21,#01,#12,#01,#F1,#02,#11,#01,#12,#01,#F1
    DB #58,#00,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#11,#01,#12,#01,#21
    DB #01,#11,#01,#1F,#01,#21,#02,#11,#01,#1F,#01,#21,#01,#12,#01,#F1
    DB #02,#11,#01,#22,#01,#11,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#1F
    DB #01,#21,#01,#12,#01,#F1,#01,#11,#01,#22,#02,#11,#01,#1F,#01,#21
    DB #01,#12,#01,#F1,#02,#11,#01,#22,#01,#11,#58,#00,#01,#11,#02,#22
    DB #01,#11,#01,#1F,#02,#22,#01,#F1,#01,#1F,#02,#22,#01,#F1,#01,#11
    DB #02,#22,#03,#11,#01,#22,#02,#11,#02,#22,#02,#11,#02,#22,#02,#11
    DB #01,#22,#03,#11,#02,#22,#02,#11,#01,#22,#01,#21,#01,#11,#58,#00
    DB #28,#11,#58,#00
bitmap_room_hud_linked_3_rle_chunk_0_end:

; Room 0 page 0 render program: 88 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#90
    DB #00,#30,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#F0,#00,#60,#02,#10,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#A0,#00,#30,#02,#20,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#30,#02,#50,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#30,#02,#60,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#70,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#30,#02,#80,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#60,#02,#90,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#70
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#80,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02,#90,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#A0,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#00,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#10,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#20,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#60,#00,#30,#02,#30,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#30,#02,#70,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#40,#02,#80,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#90,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #E0,#00,#30,#02,#A0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#60,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #60,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#80
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02,#90,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#60,#02,#00,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#60,#02,#10,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#60,#02,#00,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#60,#02,#10,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#60,#02,#00,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#60,#02,#10,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#20,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#60,#00,#30,#02,#30,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #30,#02,#30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30
    DB #02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#10
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#20,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#30,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#40,#02,#80,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#D0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#30,#02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#60,#02,#50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00
    DB #60,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30
    DB #02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02
    DB #80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#90
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#30,#02,#A0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#D0,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#E0,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#F0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#10,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#20,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#D0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#E0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_0_p0_end:

; Room 0 page 1 render program: 88 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#90
    DB #00,#30,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#F0,#00,#60,#02,#10,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#A0,#00,#30,#02,#20,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#30,#02,#50,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#30,#02,#60,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#70,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#30,#02,#80,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#60,#02,#90,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#70
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#80,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02,#90,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#A0,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#00,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#10,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#20,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#60,#00,#30,#02,#30,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#30,#02,#70,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#40,#02,#80,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#90,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #E0,#00,#30,#02,#A0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#60,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #60,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#80
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02,#90,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#60,#02,#00,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#60,#02,#10,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#60,#02,#00,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#60,#02,#10,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#60,#02,#00,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#60,#02,#10,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#20,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#60,#00,#30,#02,#30,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #30,#02,#30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30
    DB #02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#10
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#20,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#30,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#40,#02,#80,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#D0,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#30,#02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#60,#02,#50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00
    DB #60,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30
    DB #02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02
    DB #80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#90
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#30,#02,#A0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#D0,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#E0,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#F0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#10,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#20,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#D0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#E0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_0_p1_end:

; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#00,#00,#10,#10,#10,#10,#40,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10
    DB #10,#10,#10,#10,#10,#40,#40,#10,#10,#40,#10,#00,#00,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#10
bitmap_room_collision_0_end:

; Room 0 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_0:
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
bitmap_room_behavior_0_end:

; Room 1 page 0 render program: 44 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#40,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #30,#02,#40,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#50,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #60,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#70
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#80,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#90,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#A0,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#40,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#50,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#D0,#00,#30,#02,#60,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#30,#02,#70,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#30,#02,#80,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#30,#02,#90,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#E0,#00,#30,#02,#A0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#30,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#40,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#10
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#40,#02,#20,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#30,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#D0,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02,#E0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#F0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#40,#02,#00,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#40,#02,#10,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#30,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02
    DB #90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#A0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#B0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#40,#02,#D0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#E0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#F0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_1_p0_end:

; Room 1 page 1 render program: 44 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#40,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #30,#02,#40,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#50,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #60,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#70
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#80,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#90,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#A0,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#40,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#50,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#D0,#00,#30,#02,#60,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#30,#02,#70,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#30,#02,#80,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#30,#02,#90,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#E0,#00,#30,#02,#A0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#30,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#40,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#10
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#40,#02,#20,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#30,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#D0,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02,#E0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#F0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#40,#02,#00,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#40,#02,#10,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#30,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02
    DB #90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#A0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#B0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#40,#02,#D0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#E0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#F0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_1_p1_end:

; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_1_end:

; Room 1 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_1:
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
bitmap_room_behavior_1_end:

; Room 2 page 0 render program: 49 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#80
    DB #00,#30,#02,#70,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #30,#02,#80,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30
    DB #02,#70,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #80,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#70
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#70,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#30,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#30,#02,#80,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#30,#02,#80,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#F0,#00,#30,#02,#80,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#30,#02,#B0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#60,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#30,#02,#B0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#E0
    DB #00,#60,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#30
    DB #02,#B0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#60,#02
    DB #C0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#D0
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#00,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#10,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02,#20,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#70,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#30,#02,#80,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#90,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#A0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#B0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#40,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#40,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #40,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#40
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#40,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_2_p0_end:

; Room 2 page 1 render program: 49 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#80
    DB #00,#30,#02,#70,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #30,#02,#80,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30
    DB #02,#70,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #80,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#70
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#70,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#30,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#30,#02,#80,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#30,#02,#80,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#F0,#00,#30,#02,#80,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#30,#02,#B0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#60,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#30,#02,#B0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#E0
    DB #00,#60,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#30
    DB #02,#B0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#60,#02
    DB #C0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#D0
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#00,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#10,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40,#02,#20,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#70,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#30,#02,#80,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#90,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#A0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#B0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#40,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#40,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #40,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#40
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#40,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_2_p1_end:

; Room 2 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_2:
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#10,#40,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#40,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#40,#00,#00,#00
    DB #10,#10,#10,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_2_end:

; Room 2 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_2:
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
bitmap_room_behavior_2_end:

; Room 3 page 0 render program: 60 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#40,#02,#B0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #40,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#40
    DB #02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#40,#02
    DB #E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#50
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#60,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#70,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#40,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#50,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#60,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#30,#02,#70,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#E0,#00,#60,#02,#40,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#30,#02,#50,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#60,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#70,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#30,#02,#80,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#E0
    DB #00,#60,#02,#40,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#50,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#60,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #70,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#60,#02,#40,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#50,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#60,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#70,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#E0,#00,#60,#02,#40,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#30,#02,#50,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#60,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#70,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#30,#02,#80,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#30,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40
    DB #02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#50
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#60,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#B0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#40,#02,#D0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#30,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#C0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#D0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#E0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_3_p0_end:

BITMAP_ROOM_DATA_BANK_6_USED_END:
    ds 258, #FF
    org BITMAP_ROOM_DATA_BANK_6_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_7_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_7_ROM_START:
; Room 3 page 1 render program: 60 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#40,#02,#B0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #40,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#40
    DB #02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#40,#02
    DB #E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#50
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#60,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#70,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#40,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#50,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#60,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#30,#02,#70,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#E0,#00,#60,#02,#40,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#30,#02,#50,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#60,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#70,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#30,#02,#80,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#E0
    DB #00,#60,#02,#40,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#50,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#60,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #70,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#60,#02,#40,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#50,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#60,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#70,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#E0,#00,#60,#02,#40,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#30,#02,#50,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#60,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#70,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#30,#02,#80,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#30,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#40
    DB #02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#50
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#60,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#B0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#40,#02,#D0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#30,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#70
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#60,#02,#C0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#D0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#E0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_3_p1_end:

; Room 3 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#40,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#40,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#40,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#40,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#50,#40,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#10,#10,#10
bitmap_room_collision_3_end:

; Room 3 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_3:
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
bitmap_room_behavior_3_end:

; Room 4 page 0 render program: 63 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#80
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#80,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#80,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#40,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #50,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#70,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#00,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#80,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#80,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#70,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #80,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#00,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#10,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#20,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#30
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#40,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0
bitmap_room_render_4_p0_end:

; Room 4 page 1 render program: 63 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#80
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#80,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#80,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#40,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #50,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#70,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#00,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#80,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#80,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#70,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #80,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#00,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#10,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#20,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#30
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#40,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0
bitmap_room_render_4_p1_end:

; Room 4 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_4:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#10,#00,#00,#00
    DB #10,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00,#00,#10,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#10,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#00,#00,#00
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10
bitmap_room_collision_4_end:

; Room 4 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_4:
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
bitmap_room_behavior_4_end:

; Room 5 page 0 render program: 47 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_5_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#30
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#60
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#70,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#80,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0
bitmap_room_render_5_p0_end:

; Room 5 page 1 render program: 47 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_5_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#30
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#60
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#70,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#80,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0
bitmap_room_render_5_p1_end:

; Room 5 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_5:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#40,#40,#40,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_5_end:

; Room 5 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_5:
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
bitmap_room_behavior_5_end:

; Room 6 page 0 render program: 62 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#90
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#70
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#10
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#20,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#30,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#40,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#70,#00,#00,#02,#80,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#90,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#A0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#70,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#80,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#90,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#A0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#B0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0
bitmap_room_render_6_p0_end:

; Room 6 page 1 render program: 62 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#90
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#70
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#10
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#20,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#30,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#40,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#70,#00,#00,#02,#80,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#90,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#A0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#70,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#80,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#90,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#A0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#B0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#70
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#A0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#C0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0
bitmap_room_render_6_p1_end:

; Room 6 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_6:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_6_end:

; Room 6 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_6:
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
bitmap_room_behavior_6_end:

BITMAP_ROOM_DATA_BANK_7_USED_END:
    ds 596, #FF
    org BITMAP_ROOM_DATA_BANK_7_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_8_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_8_ROM_START:
; Room 7 page 0 render program: 90 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_7_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#70,#00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#40,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70
    DB #00,#00,#02,#50,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00
    DB #00,#02,#60,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#70,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #80,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#90
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#A0,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#B0,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#40,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#70,#00,#00,#02,#50,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#60,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#70,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#80,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#90,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#A0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00
    DB #00,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #40,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#50
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#70,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#40,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#50,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#70,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#70,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#40,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#50,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#90
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#B0,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#00,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#10,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#00,#02,#20,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00
    DB #02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02
    DB #A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#B0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#E0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0
bitmap_room_render_7_p0_end:

; Room 7 page 1 render program: 90 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_7_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#70,#00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#40,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70
    DB #00,#00,#02,#50,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00
    DB #00,#02,#60,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#70,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #80,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#90
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#A0,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#B0,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#40,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#70,#00,#00,#02,#50,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#60,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#70,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#80,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #70,#00,#00,#02,#90,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#A0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00
    DB #00,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #40,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#50
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#60,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#70,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#40,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#50,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#70,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#70,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#40,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#50,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02
    DB #80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#90
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#B0,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#D0,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#00,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#10,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#00,#02,#20,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00
    DB #02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02
    DB #A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#B0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#C0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#E0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0
bitmap_room_render_7_p1_end:

; Room 7 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_7:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_7_end:

; Room 7 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_7:
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
bitmap_room_behavior_7_end:

; Room 8 page 0 render program: 60 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_8_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#40,#02,#30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #40,#02,#40,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#40
    DB #02,#50,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#40,#02
    DB #90,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#40,#02,#A0
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#40,#02,#B0,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#F0,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#E0,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#30,#02,#90,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#A0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#B0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#30,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#40,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #30,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#90
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#A0,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#B0,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#C0,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#D0,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#E0,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#D0,#00,#30,#02,#F0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#30,#02,#60,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#70,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#30,#02,#80,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#D0,#00,#30,#02,#90,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#A0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0
    DB #00,#30,#02,#B0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#30
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#40,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#50,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#60,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#70,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#A0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#30,#02,#B0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#40,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #F0,#00,#60,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #40,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#90
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#A0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#B0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#C0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#D0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#E0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#F0,#00,#40,#02,#F0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_8_p0_end:

; Room 8 page 1 render program: 60 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_8_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#40,#02,#30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #40,#02,#40,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#40
    DB #02,#50,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#40,#02
    DB #90,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#40,#02,#A0
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#40,#02,#B0,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#F0,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#E0,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#30,#02,#90,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#A0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#30,#02,#B0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#30,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#40,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #30,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#90
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#A0,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#B0,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#C0,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#D0,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#E0,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#D0,#00,#30,#02,#F0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#30,#02,#60,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#70,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#30,#02,#80,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#D0,#00,#30,#02,#90,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#A0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0
    DB #00,#30,#02,#B0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#30
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#40,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#50,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#60,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#70,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#A0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#30,#02,#B0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#40,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #F0,#00,#60,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #40,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#90
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#A0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#B0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#C0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#D0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#E0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#F0,#00,#40,#02,#F0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_8_p1_end:

; Room 8 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_8:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#10,#10,#10,#00,#00,#00,#10,#10,#10,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#90,#90,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#90,#90,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_8_end:

; Room 8 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_8:
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
bitmap_room_behavior_8_end:

; Room 9 page 0 render program: 58 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_9_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#50
    DB #00,#30,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#60
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#70,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#80,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#B0,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#D0,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#10,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#20,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#30,#02,#30,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#30,#02,#60,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#40,#02,#70,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#A0
    DB #00,#30,#02,#80,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#B0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#C0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #D0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#10,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#20,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#30,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#60,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#70,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#30,#02,#80,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#30,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#30,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#E0,#00,#30,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #30,#02,#30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02
    DB #10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#20
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02,#30,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#50,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#80,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#B0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#00,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#F0,#00,#40,#02,#10,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#60,#02,#20,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#60,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#60,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#E0,#00,#60,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#60,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#60,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00
    DB #60,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60
    DB #02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02
    DB #A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#60,#02,#B0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#C0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#D0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#E0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#F0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0
bitmap_room_render_9_p0_end:

; Room 9 page 1 render program: 58 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_9_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#50
    DB #00,#30,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#60
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#70,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#80,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#B0,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#D0,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#10,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#20,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#30,#02,#30,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#30,#02,#60,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#40,#02,#70,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#A0
    DB #00,#30,#02,#80,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#B0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#C0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02
    DB #D0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#10,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#20,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#30,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#60,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#70,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#30,#02,#80,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#30,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#30,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#E0,#00,#30,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #30,#02,#30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02
    DB #10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#20
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02,#30,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#50,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#80,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#B0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#F0,#00,#40,#02,#00,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#F0,#00,#40,#02,#10,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#60,#02,#20,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#60,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#60,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#E0,#00,#60,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#60,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#60,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00
    DB #60,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60
    DB #02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02
    DB #A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#60,#02,#B0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#C0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#D0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#E0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#60,#02,#F0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0
bitmap_room_render_9_p1_end:

; Room 9 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_9:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#10,#10,#10,#00,#00,#10,#10,#10,#00,#00
    DB #10,#10,#10,#10,#00,#00,#10,#10,#10,#00,#00,#10,#10,#10,#00,#00
    DB #10,#10,#10,#10,#00,#00,#10,#10,#10,#00,#00,#10,#10,#10,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#40,#00,#00,#40,#00,#00,#40,#00,#00,#00,#00
    DB #10,#10,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40
bitmap_room_collision_9_end:

; Room 9 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_9:
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
bitmap_room_behavior_9_end:

BITMAP_ROOM_DATA_BANK_8_USED_END:
    ds 800, #FF
    org BITMAP_ROOM_DATA_BANK_8_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_9_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_9_ROM_START:
; Room 10 page 0 render program: 56 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_10_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#30
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#20
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#30,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#80,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#B0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#20
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#30,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#00,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#10,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#20,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#30,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#40,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#E0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#F0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_10_p0_end:

; Room 10 page 1 render program: 56 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_10_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#30
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#20
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#30,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#60,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#80,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#B0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#20
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#30,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#F0,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02,#00,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#10,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#20,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#30,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#40,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#E0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#F0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_10_p1_end:

; Room 10 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_10:
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#10,#10,#10,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_10_end:

; Room 10 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_10:
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
bitmap_room_behavior_10_end:

; Room 11 page 0 render program: 60 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_11_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#C0
    DB #00,#30,#02,#B0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#C0,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#D0,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#E0,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#40,#02,#40,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#30,#02,#50,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#60,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#60,#00,#30,#02,#70,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#30,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#D0,#00,#30,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#30,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#30,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #30,#02,#50,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#60,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02
    DB #70,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#C0
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#B0,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#C0,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#C0,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#70,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#30,#02,#80,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#A0,#00,#30,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#30,#02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#A0,#00,#30,#02,#80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#30,#02,#B0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#A0
    DB #00,#30,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#70,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30
    DB #02,#80,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02
    DB #B0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#C0
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#F0,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#70,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#C0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#60,#02,#00,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#60,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#60,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#D0,#00,#60,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#60,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#30,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#90
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#A0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#B0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#C0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#D0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_11_p0_end:

; Room 11 page 1 render program: 60 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_11_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#C0
    DB #00,#30,#02,#B0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#C0,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#D0,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#40,#02,#E0,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#40,#02,#40,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#30,#02,#50,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#30,#02,#60,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#60,#00,#30,#02,#70,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#30,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#D0,#00,#30,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#30,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#D0
    DB #00,#30,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #30,#02,#50,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#60,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02
    DB #70,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#C0
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#B0,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#C0,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#C0,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#70,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#30,#02,#80,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#A0,#00,#30,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#30,#02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#A0,#00,#30,#02,#80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#30,#02,#B0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#A0
    DB #00,#30,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#70,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30
    DB #02,#80,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02
    DB #B0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#C0
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#30,#02,#F0,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#70,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#80,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#B0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#C0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#60,#02,#00,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#60,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#D0,#00,#60,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#D0,#00,#60,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#60,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#30,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30
    DB #02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02
    DB #80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#90
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#A0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#B0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#C0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#D0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0
bitmap_room_render_11_p1_end:

; Room 11 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_11:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#10,#10,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#10,#10,#00,#00,#10
    DB #40,#40,#40,#40,#40,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
bitmap_room_collision_11_end:

; Room 11 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_11:
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
bitmap_room_behavior_11_end:

; Room 12 page 0 render program: 54 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_12_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#90
    DB #00,#30,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#B0
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#C0,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#D0,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#E0,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#30,#02,#10,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#30,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#E0,#00,#30,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#30,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#30,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#30,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30
    DB #02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02
    DB #F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#00,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#10,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#20,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#D0,#00,#30,#02,#10,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#30,#02,#20,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#40,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#30,#02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#30,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#90,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #A0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#B0
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#40,#02,#D0,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#00,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#30,#02,#40,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#50,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30
    DB #02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02
    DB #E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_12_p0_end:

; Room 12 page 1 render program: 54 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_12_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#90
    DB #00,#30,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#30,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#30,#02,#B0
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#C0,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#D0,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#30,#02,#E0,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#30,#02,#10,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#D0,#00,#30,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#E0,#00,#30,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#30,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#30,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#30,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #30,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30
    DB #02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02
    DB #F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#00,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#10,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#30,#02,#20,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02,#F0,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#00,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#D0,#00,#30,#02,#10,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#D0,#00,#30,#02,#20,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#40,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#30,#02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#30,#02,#50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#30,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#30,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #30,#02,#80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30
    DB #02,#90,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02
    DB #A0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#B0
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#C0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#40,#02,#D0,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#30,#02,#E0,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#30,#02,#00,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#30,#02,#40,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#90,#00,#30,#02,#50,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#30,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#30,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#90,#00,#30,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #90,#00,#30,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90
    DB #00,#30,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00
    DB #30,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#30
    DB #02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#30,#02
    DB #E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#30,#02,#F0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_12_p1_end:

; Room 12 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_12:
    DB #00,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10,#10
bitmap_room_collision_12_end:

; Room 12 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_12:
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
bitmap_room_behavior_12_end:

BITMAP_ROOM_DATA_BANK_9_USED_END:
    ds 1940, #FF
    org BITMAP_ROOM_DATA_BANK_9_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_10_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_10_ROM_START:
; GameFlow intro scene #0 SCREEN 5 bitmap, packed 4bpp RLE; VRAM #00000, raw 10549 bytes, RLE 7936 bytes
bitmap_intro_scene0_rle_chunk_0:
    DB #0B,#11,#01,#14,#07,#11,#01,#14,#06,#11,#01,#14,#01,#11,#01,#14
    DB #01,#11,#01,#14,#01,#11,#01,#14,#42,#11,#01,#14,#05,#11,#01,#14
    DB #01,#41,#05,#11,#01,#14,#01,#71,#0B,#11,#02,#55,#01,#41,#0B,#11
    DB #01,#14,#0B,#11,#01,#14,#01,#41,#01,#44,#01,#41,#03,#11,#01,#41
    DB #01,#14,#3E,#11,#01,#E1,#03,#11,#01,#14,#06,#11,#01,#44,#05,#11
    DB #01,#14,#01,#F7,#0B,#11,#01,#55,#01,#5D,#01,#41,#0B,#11,#01,#41
    DB #0C,#11,#03,#44,#03,#11,#01,#44,#02,#14,#02,#44,#01,#14,#01,#44
    DB #01,#1D,#02,#11,#01,#14,#01,#E4,#07,#11,#01,#41,#0B,#11,#01,#1E
    DB #15,#11,#01,#CC,#0E,#11,#01,#14,#01,#41,#05,#11,#01,#15,#05,#11
    DB #01,#14,#01,#FF,#01,#41,#09,#11,#01,#14,#01,#45,#01,#55,#0D,#11
    DB #01,#44,#05,#11,#01,#14,#01,#44,#01,#41,#02,#11,#01,#14,#01,#11
    DB #01,#41,#01,#44,#02,#41,#01,#11,#01,#14,#04,#44,#03,#11,#01,#14
    DB #3C,#11,#01,#14,#05,#11,#01,#44,#06,#11,#01,#4F,#01,#51,#0A,#11
    DB #01,#45,#01,#55,#08,#11,#01,#14,#0B,#11,#01,#14,#01,#F4,#04,#11
    DB #03,#44,#01,#14,#06,#44,#01,#41,#0A,#11,#01,#44,#34,#11,#01,#14
    DB #06,#11,#01,#41,#05,#11,#01,#1E,#01,#41,#0A,#11,#01,#15,#01,#55
    DB #0D,#11,#01,#14,#01,#41,#01,#14,#01,#41,#05,#11,#02,#41,#02,#11
    DB #01,#44,#01,#54,#01,#44,#01,#41,#03,#44,#01,#DF,#01,#44,#01,#D4
    DB #01,#44,#02,#41,#06,#11,#01,#41,#06,#11,#01,#41,#09,#11,#01,#C1
    DB #1D,#11,#01,#C1,#07,#11,#01,#14,#01,#41,#02,#11,#01,#E1,#02,#11
    DB #01,#41,#06,#11,#01,#71,#0A,#11,#01,#15,#01,#D5,#0D,#11,#01,#14
    DB #01,#47,#01,#74,#09,#11,#02,#44,#01,#14,#08,#44,#01,#11,#01,#1D
    DB #02,#44,#3D,#11,#01,#44,#05,#11,#01,#14,#06,#11,#01,#41,#0A,#11
    DB #01,#14,#01,#55,#01,#41,#09,#11,#01,#1F,#04,#11,#01,#44,#01,#41
    DB #05,#11,#01,#14,#03,#11,#01,#44,#01,#14,#01,#54,#04,#44,#01,#4F
    DB #02,#44,#01,#41,#01,#11,#01,#44,#01,#41,#01,#14,#3E,#11,#01,#E1
    DB #0A,#11,#01,#14,#0A,#11,#01,#44,#01,#FD,#01,#41,#0E,#11,#01,#14
    DB #01,#44,#01,#41,#02,#11,#01,#14,#02,#11,#01,#44,#04,#11,#09,#44
    DB #01,#41,#04,#11,#01,#14,#08,#11,#01,#14,#17,#11,#01,#1E,#20,#11
    DB #01,#41,#05,#11,#01,#14,#0A,#11,#01,#45,#01,#FF,#01,#51,#0E,#11
    DB #01,#44,#01,#14,#02,#41,#04,#11,#01,#14,#04,#11,#0B,#44,#0C,#11
    DB #01,#14,#18,#11,#01,#14,#08,#11,#01,#1C,#0B,#11,#01,#71,#04,#11
    DB #01,#41,#16,#11,#01,#45,#01,#FF,#01,#F4,#0F,#11,#01,#41,#01,#14
    DB #02,#41,#03,#11,#01,#1D,#03,#11,#01,#41,#01,#11,#01,#44,#01,#D4
    DB #06,#44,#03,#41,#01,#11,#01,#14,#0F,#11,#02,#CC,#1A,#11,#01,#FF
    DB #01,#BB,#01,#1C,#0A,#11,#01,#41,#10,#11,#01,#41,#09,#11,#01,#14
    DB #01,#FF,#01,#F5,#01,#41,#0E,#11,#01,#14,#01,#44,#01,#41,#05,#11
    DB #01,#14,#03,#11,#01,#14,#02,#44,#01,#4D,#01,#D4,#06,#44,#01,#4D
    DB #01,#41,#06,#11,#01,#1E,#02,#11,#01,#41,#06,#11,#01,#C1,#01,#CF
    DB #01,#FC,#18,#11,#01,#1C,#01,#1F,#01,#FF,#01,#BA,#01,#AB,#0D,#11
    DB #01,#E1,#01,#41,#15,#11,#01,#14,#01,#4F,#01,#F4,#01,#41,#0F,#11
    DB #01,#14,#01,#41,#09,#11,#01,#41,#04,#44,#01,#D4,#07,#44,#08,#11
    DB #01,#14,#01,#44,#01,#54,#01,#44,#04,#11,#01,#1C,#01,#1F,#02,#FF
    DB #01,#FC,#0E,#11,#01,#E1,#09,#11,#01,#BB,#03,#AA,#01,#2C,#23,#11
    DB #01,#4F,#01,#E4,#12,#11,#01,#14,#01,#41,#04,#11,#01,#1D,#02,#11
    DB #01,#41,#01,#11,#01,#44,#02,#4D,#01,#44,#01,#DD,#01,#44,#01,#D4
    DB #03,#44,#01,#41,#09,#11,#01,#14,#01,#5F,#01,#F7,#01,#44,#04,#11
    DB #01,#C1,#01,#FA,#02,#AA,#01,#BF,#01,#1C,#0D,#11,#01,#41,#09,#11
    DB #01,#BB,#03,#AA,#01,#FC,#22,#11,#01,#17,#01,#71,#13,#11,#01,#44
    DB #08,#11,#01,#41,#01,#44,#02,#DD,#01,#D4,#01,#DD,#01,#D4,#01,#4D
    DB #01,#DD,#01,#44,#01,#41,#01,#11,#02,#14,#08,#11,#01,#14,#01,#5F
    DB #01,#F7,#01,#44,#04,#11,#01,#C1,#01,#FA,#02,#AA,#01,#AB,#01,#F1
    DB #03,#11,#01,#1C,#13,#11,#01,#BB,#01,#AB,#02,#AA,#01,#F1,#09,#11
    DB #01,#14,#01,#EF,#01,#41,#12,#11,#01,#41,#02,#11,#01,#14,#01,#71
    DB #13,#11,#02,#44,#03,#11,#01,#D1,#01,#11,#01,#14,#01,#11,#01,#14
    DB #02,#44,#01,#DD,#01,#44,#06,#DD,#01,#41,#01,#11,#01,#41,#02,#11
    DB #01,#41,#01,#14,#01,#E4,#04,#11,#02,#44,#01,#74,#01,#44,#04,#11
    DB #01,#C1,#01,#FA,#03,#AA,#01,#FC,#01,#C1,#14,#11,#01,#1C,#01,#C1
    DB #02,#BB,#02,#AA,#01,#B1,#01,#C1,#08,#11,#02,#14,#06,#11,#01,#1C
    DB #0E,#11,#01,#14,#01,#E1,#0E,#11,#01,#47,#05,#11,#02,#44,#03,#11
    DB #01,#D1,#01,#11,#01,#14,#01,#4D,#02,#44,#01,#D4,#06,#DD,#01,#4D
    DB #01,#DD,#01,#D1,#01,#44,#01,#14,#06,#11,#01,#41,#01,#11,#01,#41
    DB #02,#11,#01,#41,#06,#11,#01,#FA,#03,#AA,#01,#FF,#01,#1C,#13,#11
    DB #01,#1C,#01,#11,#03,#BB,#02,#AA,#01,#B1,#01,#C1,#01,#11,#01,#1C
    DB #08,#11,#01,#41,#02,#11,#01,#41,#11,#11,#01,#41,#0E,#11,#01,#47
    DB #01,#FF,#05,#11,#02,#44,#01,#41,#04,#11,#02,#44,#01,#D4,#01,#4D
    DB #01,#44,#04,#DD,#01,#4D,#02,#DD,#01,#4D,#01,#D4,#01,#44,#01,#41
    DB #01,#1E,#02,#11,#01,#41,#07,#11,#01,#41,#01,#11,#01,#14,#04,#11
    DB #01,#FA,#03,#AA,#01,#BF,#01,#CC,#13,#11,#01,#1E,#01,#FB,#03,#BB
    DB #02,#AA,#01,#A1,#01,#C1,#04,#11,#01,#41,#04,#11,#01,#14,#03,#11
    DB #01,#44,#10,#11,#01,#41,#0E,#11,#01,#14,#01,#7F,#01,#F4,#05,#11
    DB #02,#44,#01,#D1,#03,#11,#01,#14,#02,#44,#01,#4D,#06,#DD,#01,#44
    DB #01,#4D,#02,#D4,#01,#D1,#01,#14,#04,#11,#01,#14,#01,#11,#02,#14
    DB #02,#11,#01,#14,#01,#11,#01,#41,#05,#11,#01,#1C,#01,#1B,#03,#AA
    DB #01,#AF,#01,#F1,#01,#C1,#11,#11,#01,#1C,#01,#1F,#04,#BB,#02,#AA
    DB #01,#AC,#01,#C1,#07,#11,#01,#14,#04,#11,#01,#44,#01,#F5,#01,#41
    DB #1E,#11,#01,#4F,#01,#41,#06,#11,#01,#44,#01,#4D,#01,#41,#01,#14
    DB #02,#11,#01,#44,#01,#4D,#08,#DD,#01,#44,#01,#4D,#01,#D4,#01,#44
    DB #01,#11,#01,#41,#01,#11,#01,#44,#01,#41,#0F,#11,#01,#1C,#01,#1F
    DB #03,#AA,#01,#AF,#01,#FC,#01,#C1,#11,#11,#01,#1C,#01,#1F,#04,#BB
    DB #02,#AA,#01,#A2,#01,#C1,#05,#11,#01,#C1,#01,#11,#01,#41,#02,#11
    DB #01,#14,#01,#44,#01,#EF,#01,#FF,#01,#E4,#01,#41,#0A,#11,#01,#1E
    DB #05,#FF,#01,#E1,#0B,#11,#01,#47,#08,#11,#01,#14,#01,#DF,#01,#44
    DB #01,#41,#02,#11,#01,#41,#01,#44,#01,#D1,#04,#DD,#01,#DF,#01,#9F
    DB #01,#DD,#01,#D4,#01,#4D,#01,#DD,#01,#41,#02,#11,#01,#14,#01,#41
    DB #03,#11,#01,#41,#03,#11,#01,#E1,#09,#11,#01,#1F,#03,#AA,#01,#AB
    DB #01,#FF,#01,#1C,#03,#11,#01,#E1,#08,#11,#01,#41,#04,#11,#01,#1C
    DB #01,#1B,#04,#BB,#02,#AA,#01,#AE,#01,#C1,#0C,#11,#01,#44,#01,#F4
    DB #01,#41,#09,#11,#01,#1F,#01,#FF,#01,#EE,#01,#11,#01,#C1,#04,#11
    DB #01,#4F,#01,#F1,#08,#11,#01,#1F,#0A,#11,#02,#4D,#01,#41,#01,#1D
    DB #01,#11,#01,#14,#01,#4D,#01,#D4,#02,#DD,#02,#D9,#01,#9D,#01,#99
    DB #02,#DD,#01,#4D,#01,#D4,#01,#41,#01,#14,#01,#E1,#01,#15,#01,#41
    DB #02,#11,#01,#14,#01,#41,#0D,#11,#01,#CC,#01,#BA,#03,#AA,#01,#FF
    DB #01,#C1,#02,#11,#01,#C1,#0E,#11,#01,#1C,#01,#1B,#04,#BB,#02,#AA
    DB #01,#AB,#01,#C1,#0D,#11,#01,#41,#09,#11,#02,#EF,#02,#FF,#01,#EC
    DB #05,#11,#01,#14,#01,#11,#01,#7E,#06,#11,#01,#14,#08,#11,#01,#41
    DB #02,#11,#01,#14,#01,#44,#01,#41,#01,#D4,#01,#41,#01,#11,#01,#1D
    DB #03,#DD,#04,#99,#01,#D9,#01,#DD,#01,#4D,#01,#54,#01,#44,#02,#11
    DB #01,#14,#01,#41,#01,#11,#01,#1E,#01,#41,#0E,#11,#01,#C1,#01,#FA
    DB #03,#AA,#01,#BF,#01,#FA,#01,#1C,#10,#11,#01,#1C,#01,#1B,#04,#BB
    DB #02,#AA,#01,#AF,#0B,#11,#01,#14,#0B,#11,#01,#FF,#01,#CE,#02,#FF
    DB #09,#11,#01,#44,#01,#7C,#04,#11,#01,#14,#0B,#11,#01,#41,#01,#14
    DB #01,#4D,#01,#DD,#03,#44,#01,#4D,#03,#DD,#02,#FF,#01,#F9,#01,#DD
    DB #01,#99,#01,#D4,#01,#44,#01,#55,#01,#44,#02,#11,#01,#44,#01,#41
    DB #06,#11,#01,#C1,#0A,#11,#01,#C1,#01,#FA,#03,#AA,#01,#BF,#01,#FB
    DB #01,#F1,#01,#C1,#0F,#11,#01,#1C,#01,#CB,#04,#BB,#02,#AA,#01,#AF
    DB #16,#11,#01,#CF,#01,#CC,#01,#EE,#01,#FF,#01,#C1,#0A,#11,#01,#44
    DB #01,#F1,#10,#11,#01,#41,#01,#44,#01,#DD,#01,#44,#01,#4D,#01,#44
    DB #01,#9D,#01,#DD,#01,#D9,#01,#9F,#02,#FF,#01,#F9,#01,#DD,#01,#9D
    DB #01,#44,#01,#45,#01,#44,#01,#41,#03,#11,#01,#41,#11,#11,#01,#1C
    DB #01,#1B,#03,#AA,#01,#AB,#01,#BF,#01,#FF,#01,#B1,#01,#C1,#0E,#11
    DB #01,#1C,#01,#EB,#03,#BB,#01,#BA,#02,#AA,#01,#BF,#15,#11,#01,#1F
    DB #01,#F4,#01,#CC,#01,#EE,#01,#C1,#02,#11,#01,#1C,#07,#11,#01,#15
    DB #01,#14,#01,#57,#10,#11,#01,#14,#01,#4D,#02,#DD,#02,#D4,#01,#4D
    DB #01,#D4,#01,#D9,#02,#9F,#01,#FF,#01,#FD,#01,#DD,#01,#D4,#02,#44
    DB #01,#45,#01,#94,#01,#44,#01,#11,#01,#14,#08,#11,#01,#41,#03,#11
    DB #01,#14,#05,#11,#01,#1C,#01,#1F,#03,#AA,#01,#AB,#02,#BB,#01,#FF
    DB #01,#1C,#01,#C1,#0D,#11,#01,#1C,#01,#EB,#03,#BB,#01,#BA,#01,#AA
    DB #01,#AB,#01,#11,#01,#C1,#0D,#11,#01,#14,#06,#11,#01,#FE,#01,#11
    DB #01,#1C,#02,#EE,#01,#1E,#01,#EF,#01,#FF,#01,#EE,#06,#11,#02,#44
    DB #01,#55,#01,#7C,#0B,#11,#01,#14,#03,#11,#01,#14,#01,#D4,#01,#44
    DB #01,#DD,#01,#D4,#04,#DD,#01,#D9,#01,#9F,#01,#FF,#02,#DD,#02,#44
    DB #01,#11,#02,#44,#01,#41,#01,#11,#01,#44,#01,#41,#12,#11,#01,#1E
    DB #01,#BA,#03,#AA,#02,#BB,#01,#BF,#01,#FC,#01,#CC,#0D,#11,#01,#1C
    DB #04,#BB,#01,#BA,#01,#11,#01,#1C,#01,#C1,#13,#11,#01,#1E,#01,#FE
    DB #03,#EE,#01,#11,#03,#CC,#01,#C1,#01,#CC,#04,#11,#01,#41,#02,#11
    DB #01,#14,#01,#55,#01,#57,#0A,#11,#01,#41,#01,#44,#04,#11,#01,#41
    DB #01,#14,#05,#DD,#01,#99,#01,#9F,#01,#FF,#01,#FD,#01,#DF,#01,#D4
    DB #01,#44,#01,#11,#01,#14,#01,#44,#03,#11,#01,#41,#13,#11,#01,#C1
    DB #01,#FA,#03,#AA,#03,#BB,#01,#BF,#01,#CC,#0D,#11,#01,#1C,#01,#FB
    DB #03,#BB,#01,#B1,#01,#CC,#13,#11,#01,#EF,#02,#FF,#01,#9E,#01,#EE
    DB #01,#EC,#01,#CE,#01,#EE,#01,#EC,#02,#CC,#09,#11,#01,#41,#01,#11
    DB #01,#47,#01,#F1,#0A,#11,#01,#41,#05,#11,#02,#4D,#02,#DD,#01,#D9
    DB #01,#FF,#01,#9F,#01,#FF,#01,#9D,#01,#DD,#01,#D5,#01,#44,#01,#14
    DB #01,#11,#01,#D4,#01,#54,#02,#11,#02,#44,#12,#11,#01,#41,#01,#C1
    DB #01,#FA,#03,#AA,#04,#BB,#01,#BC,#01,#CC,#0C,#11,#01,#1C,#01,#FB
    DB #03,#BB,#01,#B1,#01,#C1,#11,#11,#01,#1E,#01,#E6,#02,#FF,#01,#9E
    DB #02,#EE,#02,#CC,#01,#CE,#01,#EC,#01,#C1,#09,#11,#01,#1C,#02,#11
    DB #01,#44,#01,#1C,#09,#11,#01,#14,#06,#11,#02,#44,#02,#DD,#01,#D9
    DB #01,#99,#01,#9F,#02,#DD,#02,#D4,#01,#44,#01,#14,#01,#41,#01,#44
    DB #01,#41,#02,#11,#01,#41,#01,#44,#12,#11,#01,#14,#01,#4C,#01,#1B
    DB #02,#AA,#01,#AB,#01,#BB,#01,#BA,#03,#BB,#02,#CC,#04,#11,#01,#C1
    DB #06,#11,#01,#CC,#01,#FB,#03,#BB,#01,#B1,#01,#C1,#0B,#11,#01,#14
    DB #04,#11,#01,#1F,#01,#EE,#01,#FF,#01,#EF,#01,#FF,#01,#FE,#0B,#11
    DB #02,#CC,#08,#11,#01,#E1,#09,#11,#01,#14,#01,#44,#01,#41,#01,#44
    DB #01,#41,#01,#14,#01,#4D,#01,#44,#01,#4D,#01,#DD,#01,#D5,#02,#DD
    DB #01,#55,#01,#DD,#01,#44,#01,#54,#01,#44,#01,#11,#01,#44,#01,#41
    DB #02,#11,#01,#14,#01,#41,#13,#11,#01,#14,#01,#44,#01,#C1,#01,#1B
    DB #01,#AA,#01,#AB,#05,#BB,#01,#BC,#01,#CC,#01,#C1,#0A,#11,#01,#CC
    DB #01,#FB,#03,#BB,#01,#AC,#01,#C1,#01,#11,#01,#CC,#01,#11,#01,#1C
    DB #0B,#11,#01,#1F,#01,#EE,#01,#FF,#01,#C1,#0B,#11,#02,#CC,#0A,#11
    DB #01,#41,#01,#14,#01,#57,#08,#11,#01,#14,#01,#44,#01,#41,#01,#14
    DB #01,#11,#03,#44,#01,#4D,#01,#D5,#01,#5D,#01,#9D,#01,#54,#01,#5D
    DB #01,#D5,#01,#44,#02,#41,#01,#11,#01,#47,#01,#41,#02,#11,#01,#14
    DB #13,#11,#01,#14,#01,#41,#02,#11,#01,#C1,#01,#FA,#01,#AB,#06,#BB
    DB #01,#EC,#01,#C1,#02,#11,#01,#1C,#04,#CC,#01,#11,#01,#1C,#01,#C1
    DB #01,#CC,#01,#FB,#03,#BB,#01,#BA,#01,#CC,#01,#11,#01,#2B,#01,#AA
    DB #01,#F1,#0A,#11,#01,#1E,#01,#FE,#0D,#11,#01,#C1,#02,#CC,#01,#C1
    DB #05,#11,#01,#1C,#01,#11,#01,#44,#01,#11,#01,#14,#01,#11,#01,#15
    DB #01,#57,#08,#11,#01,#41,#03,#44,#01,#4D,#02,#44,#01,#DD,#02,#55
    DB #01,#54,#01,#45,#01,#D4,#02,#44,#02,#11,#01,#44,#01,#14,#01,#41
    DB #02,#11,#01,#41,#14,#11,#01,#44,#02,#11,#02,#1C,#01,#FB,#06,#BB
    DB #01,#BE,#03,#CC,#01,#C2,#04,#22,#02,#CC,#01,#C2,#01,#C1,#01,#FB
    DB #01,#FF,#02,#BB,#01,#BA,#01,#CB,#03,#AA,#01,#B1,#0A,#11,#01,#F1
    DB #0C,#11,#01,#CC,#01,#11,#01,#22,#01,#21,#02,#CC,#05,#11,#01,#CC
    DB #03,#11,#01,#14,#01,#41,#01,#11,#01,#55,#01,#57,#06,#11,#01,#14
    DB #01,#44,#01,#41,#02,#44,#02,#4D,#01,#D4,#02,#44,#01,#55,#01,#44
    DB #01,#54,#02,#44,#01,#41,#01,#11,#01,#14,#01,#51,#02,#11,#01,#41
    DB #11,#11,#01,#14,#01,#44,#01,#41,#06,#11,#01,#CC,#01,#1F,#02,#BB
    DB #01,#AB,#04,#BB,#01,#CC,#01,#22,#02,#11,#01,#EF,#02,#FF,#01,#FB
    DB #01,#C1,#01,#11,#01,#C2,#01,#21,#02,#FF,#02,#BB,#01,#BA,#04,#AA
    DB #01,#B1,#09,#11,#01,#1C,#07,#11,#01,#CC,#01,#C1,#04,#11,#01,#CC
    DB #01,#AB,#01,#BF,#01,#BB,#02,#CC,#01,#C1,#04,#11,#01,#C1,#06,#11
    DB #01,#44,#01,#51,#01,#41,#04,#11,#01,#14,#01,#44,#01,#41,#01,#14
    DB #0C,#44,#01,#11,#01,#41,#02,#44,#01,#41,#13,#11,#01,#14,#01,#5F
    DB #01,#44,#06,#11,#01,#CC,#01,#21,#01,#EF,#01,#BB,#01,#BA,#04,#BB
    DB #01,#BE,#01,#1F,#09,#FF,#01,#11,#01,#CF,#01,#FF,#03,#BB,#01,#AB
    DB #03,#AA,#01,#B1,#09,#11,#01,#1C,#06,#11,#01,#CA,#01,#BB,#01,#FB
    DB #01,#AC,#02,#11,#01,#1C,#01,#CC,#01,#22,#01,#AA,#01,#A2,#02,#22
    DB #01,#2C,#01,#CC,#01,#1A,#01,#CB,#01,#BB,#01,#A1,#07,#11,#01,#54
    DB #01,#14,#01,#E1,#04,#11,#01,#14,#01,#D4,#06,#44,#01,#41,#01,#11
    DB #01,#44,#01,#4D,#04,#44,#01,#14,#02,#44,#0D,#11,#01,#14,#06,#11
    DB #01,#14,#01,#57,#01,#41,#07,#11,#01,#1C,#01,#21,#01,#FB,#01,#BA
    DB #01,#AB,#04,#BB,#01,#EE,#01,#FF,#01,#FB,#01,#BF,#02,#FF,#01,#FB
    DB #02,#BB,#01,#BF,#01,#FF,#01,#FB,#01,#1A,#03,#BB,#02,#AA,#01,#AB
    DB #01,#B1,#01,#1C,#04,#11,#01,#E1,#08,#11,#01,#1C,#0A,#11,#01,#CC
    DB #01,#C1,#03,#11,#01,#1C,#01,#CC,#01,#C1,#01,#CB,#01,#BB,#01,#B2
    DB #08,#11,#01,#45,#01,#CE,#03,#11,#01,#14,#02,#11,#01,#41,#01,#11
    DB #01,#44,#03,#11,#01,#44,#01,#D5,#01,#54,#01,#4D,#02,#44,#01,#41
    DB #01,#44,#17,#11,#01,#44,#02,#14,#08,#11,#01,#CC,#01,#11,#03,#AA
    DB #06,#BB,#01,#BF,#02,#FF,#01,#FB,#05,#BB,#01,#FF,#01,#B1,#02,#BB
    DB #01,#A1,#01,#11,#02,#CC,#0B,#11,#01,#3C,#01,#CC,#01,#1C,#06,#11
    DB #01,#1C,#04,#11,#01,#CC,#01,#2A,#02,#AA,#01,#A2,#01,#CC,#01,#C1
    DB #01,#11,#01,#1C,#01,#C1,#0A,#11,#01,#44,#02,#11,#01,#44,#02,#41
    DB #03,#11,#01,#14,#01,#41,#02,#11,#01,#44,#01,#4D,#01,#D4,#04,#44
    DB #01,#41,#16,#11,#03,#14,#01,#11,#01,#41,#04,#11,#01,#14,#02,#11
    DB #01,#1C,#01,#CC,#01,#11,#02,#AA,#03,#BB,#01,#AA,#06,#BB,#01,#FB
    DB #06,#BB,#01,#BA,#01,#BB,#01,#A1,#01,#CC,#01,#C1,#0C,#11,#01,#1B
    DB #02,#CC,#01,#AA,#01,#BB,#01,#A1,#02,#11,#01,#1C,#04,#11,#01,#CC
    DB #01,#22,#01,#AA,#01,#AB,#01,#BA,#01,#A2,#01,#22,#01,#CC,#01,#C1
    DB #06,#11,#01,#CC,#01,#C1,#02,#11,#01,#44,#02,#11,#01,#71,#01,#11
    DB #01,#44,#01,#11,#01,#44,#01,#41,#05,#11,#02,#44,#01,#5F,#01,#D4
    DB #02,#44,#02,#41,#17,#11,#01,#14,#01,#11,#01,#44,#01,#41,#01,#44
    DB #01,#41,#06,#11,#02,#1C,#01,#C1,#02,#AA,#02,#AB,#01,#BB,#01,#AA
    DB #01,#AB,#07,#BB,#01,#BA,#01,#BB,#01,#AB,#02,#BB,#01,#AB,#01,#BB
    DB #01,#A2,#01,#CC,#01,#C1,#0D,#11,#01,#13,#02,#22,#02,#11,#01,#1C
    DB #01,#CC,#01,#BC,#02,#11,#01,#A1,#01,#CB,#01,#BB,#01,#BF,#04,#FF
    DB #01,#AC,#01,#2C,#05,#11,#01,#1C,#01,#1B,#01,#BF,#01,#BA,#01,#11
    DB #01,#14,#03,#44,#01,#41,#01,#11,#01,#44,#01,#41,#02,#44,#04,#11
    DB #01,#14,#02,#44,#01,#5D,#03,#44,#01,#14,#01,#41,#02,#11,#01,#4E
    DB #0E,#11,#01,#14,#03,#11,#01,#C4,#01,#EC,#08,#CC,#04,#11,#01,#CC
    DB #01,#C1,#01,#12,#01,#CA,#02,#AA,#01,#BB,#01,#B2,#01,#AA,#01,#AB
    DB #01,#BB,#01,#AB,#01,#AA,#01,#BB,#01,#AA,#01,#BB,#01,#AA,#03,#BB
    DB #01,#AA,#03,#AB,#01,#BA,#01,#1C,#01,#C1,#0E,#11,#01,#1E,#05,#11
    DB #01,#1E,#01,#1C,#01,#CA,#01,#1A,#01,#BB,#02,#BF,#04,#FF,#01,#FB
    DB #01,#BB,#01,#A1,#01,#C1,#01,#11,#01,#1C,#01,#C1,#01,#44,#01,#4C
    DB #01,#CC,#01,#11,#05,#44,#01,#C1,#01,#11,#05,#44,#01,#14,#02,#44
    DB #01,#45,#01,#DF,#02,#54,#02,#44,#01,#11,#01,#44,#01,#14,#01,#11
    DB #01,#4E,#01,#FF,#01,#F4,#0E,#11,#01,#1C,#01,#CC,#01,#C1,#01,#11
    DB #01,#CE,#05,#FF,#01,#FE,#01,#21,#01,#1C,#03,#CC,#01,#11,#01,#C2
    DB #01,#1F,#01,#22,#01,#1B,#08,#AA,#01,#AB,#03,#AA,#02,#AB,#02,#AA
    DB #01,#BA,#03,#AA,#01,#AB,#01,#A1,#01,#1C,#02,#11,#01,#C1,#0D,#11
    DB #01,#E1,#01,#11,#01,#1C,#01,#11,#01,#1C,#01,#1E,#01,#CC,#01,#2B
    DB #03,#BB,#01,#BF,#03,#FF,#03,#BB,#01,#21,#01,#2C,#01,#CC,#01,#1C
    DB #01,#14,#03,#44,#01,#41,#03,#44,#01,#47,#02,#11,#01,#44,#01,#14
    DB #06,#44,#01,#45,#01,#5D,#02,#44,#01,#14,#01,#41,#05,#11,#01,#1E
    DB #0E,#11,#01,#CC,#01,#11,#01,#CF,#01,#FF,#02,#BB,#01,#BF,#01,#FF
    DB #01,#FB,#04,#BB,#01,#BF,#01,#FB,#01,#11,#02,#CC,#01,#C1,#01,#FF
    DB #02,#22,#16,#AA,#01,#B1,#01,#CC,#01,#11,#01,#C1,#0E,#11,#01,#12
    DB #01,#3C,#01,#BB,#01,#BC,#01,#CC,#01,#C1,#01,#3B,#02,#BB,#01,#FB
    DB #01,#BF,#01,#FF,#01,#FB,#03,#BB,#01,#FB,#01,#C2,#01,#2C,#01,#CC
    DB #01,#C1,#02,#44,#01,#4C,#01,#2A,#01,#1C,#01,#E5,#01,#55,#01,#54
    DB #01,#E1,#03,#11,#01,#14,#07,#44,#01,#4E,#01,#44,#05,#11,#01,#14
    DB #0F,#11,#01,#CC,#01,#C1,#01,#1F,#01,#FB,#0E,#BB,#01,#BF,#01,#11
    DB #01,#1F,#01,#F2,#01,#22,#17,#AA,#01,#AB,#01,#1C,#01,#C1,#11,#11
    DB #01,#1E,#01,#31,#01,#11,#01,#CC,#02,#BB,#01,#3B,#07,#BB,#01,#B2
    DB #01,#2E,#01,#EE,#01,#E1,#02,#11,#01,#4C,#02,#CC,#03,#77,#01,#C1
    DB #03,#11,#07,#44,#01,#14,#01,#44,#01,#14,#01,#41,#04,#11,#01,#1E
    DB #01,#41,#04,#11,#01,#14,#08,#11,#01,#C1,#02,#11,#01,#FB,#06,#BB
    DB #01,#BF,#01,#FB,#0A,#BB,#01,#F1,#01,#12,#19,#AA,#01,#F1,#01,#CE
    DB #02,#C1,#06,#11,#02,#41,#0A,#11,#01,#EB,#01,#BB,#02,#B3,#03,#BB
    DB #01,#B3,#01,#A3,#01,#3B,#01,#33,#01,#B1,#04,#CC,#03,#11,#01,#4C
    DB #01,#C1,#01,#71,#05,#11,#03,#44,#01,#45,#02,#44,#01,#14,#02,#44
    DB #01,#41,#03,#11,#02,#14,#01,#41,#0D,#11,#01,#C1,#01,#EF,#01,#BA
    DB #02,#AB,#03,#BB,#01,#BA,#02,#11,#05,#CC,#01,#C1,#01,#11,#01,#2B
    DB #06,#BB,#01,#1A,#16,#AA,#01,#AB,#01,#AA,#01,#AF,#01,#1C,#01,#CC
    DB #04,#11,#01,#41,#0D,#11,#01,#CC,#01,#C3,#02,#33,#08,#BB,#01,#B1
    DB #01,#1C,#01,#CA,#01,#BB,#01,#B3,#01,#C1,#02,#44,#08,#11,#03,#44
    DB #01,#54,#01,#44,#01,#41,#01,#11,#01,#14,#14,#11,#01,#1C,#01,#1F
    DB #01,#BB,#01,#FA,#02,#AA,#01,#BB,#01,#BA,#01,#11,#01,#CC,#01,#C4
    DB #01,#44,#01,#41,#03,#11,#02,#14,#01,#1C,#01,#CC,#01,#11,#01,#CB
    DB #03,#BB,#1B,#AA,#01,#F1,#01,#CC,#06,#11,#01,#14,#01,#C1,#0A,#11
    DB #01,#CC,#08,#33,#01,#B3,#02,#BB,#01,#B3,#01,#EE,#01,#EC,#01,#C1
    DB #0C,#11,#01,#54,#05,#44,#01,#41,#15,#11,#01,#C1,#01,#FA,#03,#AA
    DB #01,#AC,#01,#21,#01,#CC,#01,#C4,#04,#44,#02,#11,#01,#44,#03,#11
    DB #01,#1C,#02,#CC,#01,#11,#1D,#AA,#01,#BF,#01,#1C,#01,#C1,#10,#11
    DB #01,#1C,#01,#C3,#02,#33,#01,#22,#04,#33,#01,#3B,#01,#32,#02,#33
    DB #01,#3C,#0F,#11,#06,#44,#01,#41,#02,#11,#01,#71,#12,#11,#01,#C1
    DB #04,#AA,#01,#B1,#01,#C1,#01,#11,#01,#14,#02,#44,#01,#11,#01,#44
    DB #01,#14,#03,#11,#01,#41,#01,#1C,#02,#CC,#01,#C1,#01,#FF,#01,#21
    DB #01,#2A,#1B,#AA,#01,#AF,#01,#F1,#01,#CC,#01,#41,#0E,#11,#01,#1C
    DB #01,#CC,#01,#23,#01,#22,#01,#32,#01,#22,#04,#33,#01,#3B,#02,#32
    DB #01,#33,#01,#CC,#0F,#11,#05,#44,#17,#11,#01,#C1,#03,#AA,#01,#AF
    DB #01,#1C,#02,#11,#02,#14,#02,#44,#01,#41,#01,#11,#01,#41,#02,#11
    DB #01,#4C,#02,#CC,#01,#C1,#01,#1E,#01,#FA,#01,#21,#01,#11,#01,#22
    DB #1B,#AA,#01,#FF,#01,#1C,#01,#44,#01,#11,#01,#14,#01,#44,#09,#11
    DB #01,#41,#02,#11,#01,#1C,#01,#33,#01,#23,#01,#22,#01,#23,#05,#33
    DB #01,#22,#01,#32,#01,#33,#01,#C1,#0F,#11,#01,#54,#02,#44,#19,#11
    DB #01,#CC,#01,#1F,#01,#AA,#01,#AF,#01,#E1,#01,#C1,#01,#11,#01,#14
    DB #01,#41,#01,#11,#02,#44,#01,#14,#02,#11,#01,#44,#01,#CC,#01,#C1
    DB #01,#1E,#01,#BB,#01,#AA,#01,#1F,#01,#A2,#01,#2C,#01,#1C,#1C,#AA
    DB #01,#FF,#01,#CC,#01,#C4,#02,#11,#01,#41,#0C,#11,#01,#C2,#07,#22
    DB #01,#23,#01,#33,#01,#C2,#01,#22,#01,#23,#01,#C1,#0E,#11,#01,#14
    DB #01,#75,#01,#54,#01,#44,#01,#41,#01,#11,#01,#1F,#0D,#11,#01,#1E
    DB #09,#11,#01,#C1,#02,#11,#01,#C4,#01,#41,#02,#14,#01,#41,#01,#11
    DB #01,#14,#01,#44,#01,#41,#01,#44,#01,#4C,#01,#CC,#01,#1E,#01,#FB
    DB #03,#AA,#01,#BA,#01,#22,#01,#2C,#01,#2A,#1C,#AA,#01,#BF,#01,#F1
    DB #01,#C4,#01,#11,#01,#44,#08,#11,#01,#14,#01,#41,#02,#11,#01,#1C
    DB #02,#22,#01,#2C,#01,#CC,#01,#32,#03,#22,#01,#23,#01,#32,#01,#C2
    DB #01,#22,#01,#23,#01,#C1,#0D,#11,#02,#14,#01,#FF,#01,#75,#02,#44
    DB #15,#11,#01,#14,#04,#11,#01,#14,#01,#11,#02,#44,#01,#14,#01,#44
    DB #01,#41,#02,#11,#01,#14,#01,#44,#01,#CC,#01,#C1,#01,#FB,#01,#BB
    DB #03,#AA,#01,#A1,#01,#AA,#01,#22,#1E,#AA,#01,#AF,#01,#FC,#01,#CC
    DB #02,#44,#0C,#11,#01,#CC,#02,#22,#01,#CC,#01,#C3,#05,#22,#01,#3C
    DB #01,#C2,#01,#22,#01,#23,#04,#11,#01,#14,#08,#11,#02,#14,#01,#11
    DB #01,#FF,#01,#F7,#01,#74,#01,#44,#01,#41,#13,#11,#01,#41,#04,#11
    DB #01,#14,#01,#11,#01,#14,#02,#11,#01,#44,#01,#41,#02,#11,#02,#14
    DB #01,#CC,#01,#2B,#01,#FB,#01,#BB,#04,#AA,#01,#CA,#02,#22,#01,#2A
    DB #1D,#AA,#01,#AB,#01,#FF,#01,#1C,#03,#44,#05,#11,#01,#71,#04,#11
    DB #01,#4C,#01,#CC,#01,#C2,#01,#CC,#02,#C2,#01,#CC,#01,#C2,#03,#22
    DB #01,#2C,#01,#C2,#01,#22,#01,#23,#0D,#11,#01,#41,#02,#11,#01,#5F
    DB #01,#FF,#01,#F5,#02,#44,#18,#11,#01,#41,#01,#11,#01,#14,#01,#11
    DB #01,#14,#04,#11,#01,#14,#01,#CC,#01,#1F,#02,#BB,#01,#BA,#01,#AA
    DB #01,#A1,#01,#11,#01,#CC,#01,#12,#02,#22,#06,#AA,#01,#A1,#02,#11
    DB #01,#AA,#01,#BA,#05,#BB,#0C,#AA,#01,#AB,#01,#BB,#01,#AB,#01,#FF
    DB #01,#1C,#03,#44,#05,#11,#01,#14,#04,#11,#02,#CC,#01,#2C,#02,#CC
    DB #01,#3C,#04,#CC,#01,#22,#04,#CC,#0C,#11,#01,#41,#03,#11,#01,#44
    DB #01,#57,#01,#FF,#01,#74,#01,#44,#01,#41,#01,#11,#01,#14,#01,#41
    DB #01,#11,#01,#14,#0F,#11,#01,#14,#01,#11,#01,#14,#01,#44,#01,#41
    DB #01,#11,#01,#14,#04,#11,#01,#14,#01,#CC,#01,#1F,#01,#FB,#02,#BB
    DB #01,#AA,#01,#11,#03,#CC,#01,#1B,#02,#22,#06,#AA,#01,#A1,#02,#11
    DB #01,#AA,#01,#AB,#06,#BB,#0C,#AA,#02,#BB,#01,#FF,#01,#BC,#01,#CC
    DB #01,#44,#01,#41,#0A,#11,#04,#CC,#01,#2C,#05,#CC,#01,#C3,#04,#CC
    DB #0B,#11,#01,#44,#04,#11,#02,#44,#01,#47,#01,#FF,#01,#54,#01,#44
    DB #13,#11,#01,#14,#04,#44,#01,#41,#01,#11,#01,#44,#04,#11,#01,#1C
    DB #01,#CB,#01,#FB,#02,#BB,#01,#B1,#01,#1C,#01,#C1,#01,#C4,#01,#CC
    DB #01,#C1,#01,#EB,#01,#22,#01,#2A,#06,#AA,#01,#A1,#02,#11,#02,#AA
    DB #07,#BB,#01,#BA,#09,#AA,#01,#AB,#02,#BB,#01,#FF,#01,#F1,#01,#CC
    DB #01,#C4,#01,#41,#07,#11,#01,#41,#01,#11,#01,#14,#0A,#CC,#01,#C2
    DB #04,#CC,#0A,#11,#01,#44,#05,#11,#03,#44,#01,#45,#01,#FF,#02,#44
    DB #12,#11,#02,#44,#01,#ED,#01,#DE,#01,#44,#03,#11,#01,#14,#03,#11
    DB #01,#C1,#01,#FB,#02,#BB,#01,#B1,#01,#CC,#02,#11,#01,#14,#01,#4C
    DB #01,#C1,#01,#FF,#01,#22,#01,#2A,#06,#AA,#01,#A1,#02,#11,#02,#AA
    DB #01,#AB,#07,#BB,#01,#BA,#07,#AA,#01,#AB,#03,#BB,#01,#BF,#01,#F1
    DB #01,#2C,#01,#C4,#01,#41,#01,#14,#02,#11,#02,#14,#04,#11,#01,#4C
    DB #04,#CC,#01,#3C,#0A,#CC,#0F,#11,#02,#14,#01,#41,#02,#44,#01,#47
    DB #01,#77,#01,#44,#02,#41,#08,#11,#01,#41,#04,#11,#01,#41,#02,#11
    DB #01,#4E,#01,#EE,#02,#FF,#01,#EE,#01,#44,#01,#41,#04,#11,#01,#CC
    DB #01,#1F,#02,#BB,#01,#B1,#01,#CC,#03,#11,#01,#1C,#01,#CC,#01,#C1
    DB #01,#FF,#01,#A2,#07,#AA,#01,#AC,#02,#11,#02,#AA,#01,#BB,#01,#AB
    DB #07,#BB,#01,#BA,#06,#AA,#01,#AB,#01,#AA,#02,#BB,#01,#BF,#01,#FC
    DB #01,#2C,#01,#C4,#01,#41,#02,#44,#06,#11,#01,#14,#04,#CC,#01,#C3
    DB #06,#CC,#01,#2C,#03,#CC,#01,#C1,#0E,#11,#01,#14,#02,#44,#01,#41
    DB #01,#11,#01,#14,#01,#44,#01,#47,#01,#74,#01,#44,#05,#11,#01,#E1
    DB #03,#11,#01,#E1,#08,#11,#01,#14,#02,#E7,#01,#44,#05,#11,#01,#1C
    DB #01,#CE,#02,#BB,#01,#BA,#01,#1C,#01,#44,#03,#11,#01,#4C,#01,#CC
    DB #01,#21,#01,#FF,#01,#BF,#01,#B2,#07,#AA,#02,#11,#02,#AA,#0A,#BB
    DB #01,#BA,#01,#BB,#01,#AB,#02,#AA,#02,#AB,#03,#BB,#01,#BF,#01,#FE
    DB #01,#2C,#02,#44,#01,#41,#02,#44,#05,#11,#01,#44,#0B,#CC,#01,#2C
    DB #03,#CC,#01,#C4,#0C,#11,#02,#14,#01,#44,#01,#11,#01,#44,#01,#45
    DB #01,#41,#02,#11,#01,#44,#01,#47,#01,#F4,#01,#41,#0F,#11,#01,#14
    DB #01,#11,#01,#E1,#03,#44,#05,#11,#01,#CC,#01,#EB,#02,#BB,#01,#12
    DB #01,#C4,#01,#44,#01,#11,#01,#41,#01,#11,#01,#44,#01,#CC,#01,#21
    DB #02,#FF,#01,#FA,#01,#BA,#06,#AA,#02,#11,#02,#AA,#06,#BB,#01,#1C
    DB #01,#BB,#01,#BE,#01,#11,#05,#BB,#01,#AA,#04,#BB,#01,#BF,#01,#FB
    DB #01,#2C,#05,#44,#02,#41,#02,#11,#01,#44,#01,#4C,#0B,#CC,#01,#3C
    DB #03,#CC,#01,#C4,#01,#44,#05,#11,#01,#14,#05,#11,#01,#14,#01,#44
    DB #02,#11,#01,#14,#01,#41,#02,#11,#01,#14,#01,#11,#01,#44,#01,#47
    DB #01,#54,#01,#41,#0B,#11,#01,#14,#09,#11,#01,#41,#02,#11,#01,#1C
    DB #01,#CE,#02,#BB,#01,#B1,#01,#C1,#05,#44,#01,#14,#01,#CC,#01,#C1
    DB #02,#FF,#01,#FB,#07,#AA,#02,#11,#03,#AA,#02,#BB,#01,#BA,#01,#BB
    DB #01,#CB,#01,#BF,#03,#FF,#01,#BB,#01,#1B,#06,#BB,#01,#FB,#01,#BF
    DB #01,#FF,#01,#FB,#01,#CC,#03,#44,#01,#14,#02,#44,#02,#11,#02,#44
    DB #01,#4C,#03,#CC,#01,#C3,#0B,#CC,#01,#C4,#03,#44,#01,#EE,#01,#E4
    DB #01,#11,#01,#44,#01,#41,#03,#11,#01,#14,#01,#44,#03,#11,#01,#41
    DB #02,#11,#01,#41,#03,#11,#01,#14,#01,#47,#01,#44,#17,#11,#01,#1C
    DB #01,#CC,#01,#FB,#01,#BA,#01,#BB,#01,#1C,#02,#44,#01,#CC,#02,#44
    DB #01,#41,#01,#44,#01,#CC,#01,#C1,#01,#BF,#01,#FF,#01,#BB,#01,#AA
    DB #01,#A2,#05,#AA,#02,#11,#03,#AA,#03,#BB,#01,#BA,#06,#FF,#01,#FB
    DB #01,#1B,#05,#BB,#01,#FB,#02,#FF,#01,#FB,#01,#CC,#05,#44,#02,#11
    DB #01,#14,#02,#44,#04,#CC,#01,#2C,#0A,#CC,#01,#EF,#02,#FF,#01,#F7
    DB #02,#77,#01,#75,#02,#55,#01,#7F,#01,#E4,#03,#44,#05,#11,#01,#4D
    DB #02,#11,#02,#41,#03,#11,#02,#44,#0B,#11,#01,#41,#08,#11,#01,#14
    DB #01,#11,#01,#C1,#01,#FB,#01,#FA,#01,#AA,#01,#B1,#01,#C4,#02,#44
    DB #02,#C4,#03,#44,#01,#4C,#01,#CC,#01,#1F,#01,#FF,#01,#AB,#02,#A2
    DB #01,#11,#01,#1A,#08,#AA,#01,#AB,#02,#BB,#01,#1F,#07,#FF,#01,#FB
    DB #01,#1B,#05,#BB,#02,#FF,#01,#FE,#01,#2C,#06,#44,#01,#41,#01,#14
    DB #01,#44,#01,#4C,#0C,#CC,#01,#44,#01,#EF,#01,#FF,#01,#7F,#01,#75
    DB #01,#55,#01,#54,#01,#44,#01,#D5,#05,#44,#01,#55,#01,#F4,#05,#11
    DB #01,#14,#01,#44,#01,#91,#07,#11,#01,#44,#01,#41,#08,#11,#01,#41
    DB #02,#11,#01,#41,#09,#11,#01,#CE,#01,#BA,#02,#AA,#01,#A1,#01,#C4
    DB #03,#44,#01,#CC,#03,#44,#01,#4C,#01,#CC,#01,#1F,#01,#FF,#01,#AB
    DB #02,#AA,#03,#11,#07,#AA,#01,#BA,#01,#BB,#01,#BA,#09,#FF,#01,#FB
    DB #01,#CB,#04,#BB,#02,#FF,#01,#FE,#01,#2C,#09,#44,#01,#4C,#02,#CC
    DB #02,#4C,#07,#CC,#01,#CE,#01,#FF,#02,#F7,#01,#77,#01,#4D,#01,#D4
    DB #0A,#44,#01,#45,#01,#41,#03,#11,#01,#41,#0A,#11,#02,#44,#07,#11
    DB #01,#1E,#0B,#11,#01,#1C,#01,#1F,#03,#AA,#01,#B1,#01,#C4,#01,#41
    DB #02,#44,#01,#CC,#01,#C4,#02,#44,#02,#CC,#01,#CE,#01,#FF,#01,#AA
    DB #01,#B2,#01,#11,#01,#CB,#01,#BA,#01,#A2,#01,#1A,#06,#AA,#02,#BB
    DB #01,#BC,#0A,#FF,#01,#B1,#04,#BB,#02,#FF,#01,#F1,#01,#2C,#06,#44
    DB #01,#41,#01,#14,#01,#44,#03,#CC,#01,#C4,#01,#4C,#05,#CC,#01,#C4
    DB #01,#4F,#02,#FF,#01,#75,#01,#77,#01,#7E,#01,#DD,#01,#44,#01,#45
    DB #01,#44,#01,#54,#01,#44,#01,#41,#01,#11,#06,#44,#01,#51,#0E,#11
    DB #01,#CE,#01,#EE,#01,#E1,#08,#11,#01,#41,#08,#11,#01,#1C,#01,#1B
    DB #03,#AA,#01,#F1,#01,#C4,#01,#11,#01,#14,#01,#44,#01,#4C,#02,#44
    DB #02,#CC,#01,#C2,#01,#21,#01,#F1,#01,#CF,#01,#BB,#01,#BA,#0A,#AA
    DB #01,#AB,#01,#BB,#01,#BF,#0B,#FF,#01,#CA,#04,#BB,#01,#BF,#01,#F1
    DB #01,#2C,#09,#44,#02,#CC,#01,#4C,#01,#44,#01,#4C,#03,#CC,#01,#4C
    DB #01,#44,#01,#4F,#02,#FF,#01,#F7,#01,#E7,#01,#EE,#01,#ED,#01,#D4
    DB #01,#44,#02,#11,#04,#44,#01,#41,#01,#14,#04,#44,#01,#45,#01,#51
    DB #05,#11,#02,#41,#04,#11,#01,#CF,#01,#EE,#01,#FF,#01,#EC,#02,#11
    DB #01,#F1,#10,#11,#01,#1F,#02,#AA,#01,#AB,#01,#1C,#02,#11,#02,#44
    DB #01,#4C,#01,#CC,#01,#44,#02,#CC,#01,#C2,#01,#1B,#01,#FB,#02,#BB
    DB #0B,#AA,#02,#BB,#01,#BF,#05,#FF,#01,#CE,#05,#FF,#01,#F1,#01,#1B
    DB #03,#BB,#01,#BF,#01,#F1,#01,#CC,#0B,#44,#01,#CC,#02,#44,#01,#4C
    DB #01,#C4,#02,#44,#01,#4F,#02,#FF,#01,#77,#01,#4E,#02,#EE,#04,#44
    DB #01,#41,#02,#44,#02,#11,#02,#14,#01,#44,#01,#54,#03,#44,#01,#45
    DB #01,#41,#04,#11,#01,#14,#01,#D1,#03,#11,#01,#CC,#02,#11,#01,#CC
    DB #01,#C1,#02,#11,#01,#C1,#01,#E1,#08,#11,#01,#14,#06,#11,#01,#C1
    DB #01,#FB,#01,#AF,#01,#F1,#01,#C4,#02,#11,#03,#44,#03,#CC,#01,#C2
    DB #01,#1F,#01,#FB,#03,#BB,#01,#BA,#01,#AA,#01,#A2,#01,#22,#01,#CA
    DB #06,#AA,#01,#AB,#01,#BB,#01,#BF,#04,#FF,#01,#F1,#02,#11,#01,#1F
    DB #04,#FF,#01,#11,#01,#BB,#01,#BC,#01,#BB,#01,#BF,#01,#12,#01,#CC
    DB #0A,#44,#01,#4C,#06,#44,#01,#4F,#01,#F7,#01,#FF,#01,#7F,#01,#55
    DB #01,#44,#01,#DE,#01,#EE,#04,#44,#01,#41,#01,#44,#01,#41,#03,#11
    DB #01,#17,#01,#E4,#01,#14,#04,#44,#01,#55,#04,#11,#01,#14,#02,#11
    DB #01,#14,#01,#1F,#05,#11,#01,#1E,#01,#EC,#01,#CC,#01,#CE,#01,#EF
    DB #01,#FC,#01,#11,#01,#EC,#0B,#11,#01,#1C,#01,#CC,#01,#1C,#01,#CC
    DB #02,#11,#01,#14,#03,#44,#03,#CC,#01,#CF,#01,#FB,#02,#BB,#01,#BA
    DB #01,#A1,#01,#11,#01,#1C,#02,#11,#07,#AA,#01,#AB,#01,#BB,#01,#BF
    DB #04,#FF,#01,#F1,#03,#11,#01,#1F,#03,#FF,#01,#1B,#01,#AB,#02,#BB
    DB #01,#A1,#01,#1C,#01,#C4,#0A,#44,#01,#4C,#06,#44,#01,#FF,#01,#F7
    DB #01,#77,#01,#44,#01,#4D,#06,#44,#01,#41,#01,#11,#01,#41,#07,#11
    DB #04,#44,#01,#45,#06,#11,#01,#14,#01,#41,#01,#FF,#03,#11,#01,#EC
    DB #01,#CC,#01,#CE,#01,#EE,#01,#EC,#01,#EE,#01,#E1,#03,#11,#01,#1F
    DB #11,#11,#03,#44,#01,#4C,#01,#CC,#01,#CF,#01,#FB,#02,#BB,#01,#BA
    DB #01,#1E,#01,#FC,#02,#CC,#01,#C1,#01,#12,#08,#AA,#01,#BB,#01,#BF
    DB #04,#FF,#01,#F1,#02,#11,#01,#1F,#01,#EE,#03,#FF,#01,#CB,#02,#BB
    DB #01,#CB,#01,#BA,#01,#CC,#01,#C4,#0A,#44,#01,#C4,#05,#44,#01,#5F
    DB #01,#7F,#01,#F7,#01,#F4,#01,#DD,#01,#D4,#04,#44,#01,#41,#02,#11
    DB #01,#44,#07,#11,#01,#44,#01,#14,#04,#44,#07,#11,#01,#1F,#01,#54
    DB #01,#41,#02,#11,#01,#1C,#01,#CC,#01,#CE,#08,#11,#01,#C1,#0E,#11
    DB #02,#14,#03,#44,#01,#4C,#01,#CC,#01,#FB,#02,#BB,#01,#B1,#01,#12
    DB #01,#1E,#01,#FC,#03,#CC,#01,#CA,#08,#AA,#01,#AB,#01,#BF,#04,#FF
    DB #01,#F1,#02,#11,#01,#1F,#01,#F1,#03,#FF,#01,#CB,#03,#BB,#01,#E1
    DB #01,#2C,#0A,#44,#01,#4C,#05,#44,#01,#47,#02,#F7,#01,#7F,#02,#DD
    DB #01,#D4,#04,#44,#0A,#11,#01,#41,#06,#44,#07,#11,#01,#15,#01,#41
    DB #03,#11,#02,#1C,#01,#CC,#06,#11,#02,#1C,#01,#C1,#0F,#11,#01,#14
    DB #03,#44,#01,#CC,#01,#1F,#02,#BB,#01,#BA,#01,#12,#01,#CC,#01,#21
    DB #01,#B2,#01,#BF,#01,#CC,#02,#22,#08,#AA,#01,#AB,#01,#BE,#04,#FF
    DB #01,#F1,#02,#11,#01,#1F,#01,#F1,#03,#FF,#01,#EB,#02,#BB,#01,#FF
    DB #01,#2B,#01,#2C,#0A,#44,#01,#C4,#05,#44,#01,#7F,#01,#F5,#01,#FF
    DB #01,#5D,#02,#DD,#05,#44,#0A,#11,#01,#14,#02,#11,#01,#41,#03,#44
    DB #07,#11,#01,#EC,#04,#11,#01,#1C,#02,#CC,#01,#C1,#01,#1C,#01,#B2
    DB #01,#11,#01,#CB,#01,#A1,#01,#1C,#01,#CC,#11,#11,#02,#44,#01,#CC
    DB #01,#1F,#01,#FB,#01,#AA,#01,#BB,#01,#12,#02,#CC,#01,#C2,#01,#1B
    DB #01,#FF,#01,#AB,#02,#22,#08,#AA,#01,#AB,#01,#BC,#04,#FF,#01,#F1
    DB #04,#11,#03,#FF,#01,#EB,#02,#BB,#01,#FF,#01,#C1,#01,#CC,#09,#44
    DB #01,#4C,#05,#44,#01,#47,#02,#FF,#01,#F5,#01,#5D,#01,#DD,#01,#54
    DB #05,#44,#07,#11,#01,#14,#04,#11,#01,#41,#01,#11,#03,#44,#06,#11
    DB #01,#1E,#01,#41,#04,#11,#01,#C2,#01,#FB,#01,#2C,#01,#CC,#03,#11
    DB #01,#C1,#01,#1A,#01,#CE,#01,#C1,#0F,#11,#01,#14,#01,#11,#01,#44
    DB #01,#4C,#01,#C1,#02,#FB,#01,#AA,#01,#A1,#04,#CC,#01,#21,#01,#FF
    DB #01,#FB,#01,#BA,#02,#2A,#07,#AA,#01,#AB,#01,#BB,#05,#FF,#01,#F1
    DB #03,#11,#03,#FF,#01,#CB,#02,#BB,#01,#FF,#01,#12,#01,#CC,#09,#44
    DB #01,#C4,#05,#44,#01,#7F,#01,#FF,#01,#55,#01,#44,#01,#DD,#08,#44
    DB #01,#14,#01,#41,#05,#11,#01,#14,#04,#11,#01,#14,#01,#41,#01,#44
    DB #01,#45,#06,#11,#01,#F4,#04,#11,#02,#CC,#01,#C1,#01,#22,#01,#2C
    DB #01,#C1,#01,#11,#01,#1E,#01,#CC,#01,#1C,#01,#C1,#11,#11,#01,#14
    DB #01,#44,#01,#4C,#01,#2E,#01,#BA,#02,#AA,#01,#A1,#01,#2C,#03,#CC
    DB #01,#C2,#01,#1F,#01,#FF,#01,#BB,#01,#BA,#01,#CA,#08,#AA,#01,#BB
    DB #01,#CF,#04,#FF,#01,#F1,#03,#11,#03,#FF,#01,#CB,#02,#BB,#01,#FF
    DB #01,#12,#01,#CC,#08,#44,#01,#4C,#06,#44,#01,#FF,#01,#47,#01,#44
    DB #01,#54,#01,#44,#01,#14,#04,#44,#01,#14,#02,#44,#01,#41,#06,#11
    DB #01,#14,#03,#11,#01,#14,#01,#41,#01,#11,#02,#44,#05,#11,#01,#CF
    DB #01,#44,#03,#11,#01,#CC,#01,#11,#01,#12,#01,#2A,#03,#BB,#01,#CC
    DB #01,#C1,#02,#CC,#06,#11,#01,#1C,#08,#11,#01,#14,#02,#11,#02,#44
    DB #01,#4C,#01,#1F,#03,#AA,#01,#A1,#01,#2C,#04,#CC,#01,#31,#01,#EF
    DB #01,#FB,#01,#BB,#01,#AC,#08,#AA,#01,#BA,#01,#BF,#03,#FF,#01,#F1
    DB #04,#11,#03,#FF,#01,#AB,#02,#BB,#01,#FE,#01,#12,#01,#CC,#0E,#44
    DB #01,#4F,#01,#F5,#01,#E4,#01,#45,#06,#44,#01,#14,#04,#44,#0B,#11
    DB #01,#14,#08,#11,#01,#14,#03,#11,#01,#BB,#01,#C1,#01,#11,#01,#C2
    DB #02,#FF,#01,#FB,#01,#BB,#01,#2C,#02,#CC,#08,#11,#01,#C1,#08,#11
    DB #01,#44,#01,#11,#02,#44,#01,#4C,#01,#1F,#03,#AA,#01,#B1,#05,#CC
    DB #01,#C3,#01,#2C,#01,#FF,#01,#BB,#01,#B2,#08,#AA,#01,#AB,#01,#BC
    DB #03,#FF,#01,#F1,#03,#11,#01,#1C,#03,#FF,#03,#BB,#01,#F1,#01,#2C
    DB #01,#C4,#0E,#44,#01,#FF,#01,#14,#01,#D4,#01,#45,#05,#44,#01,#11
    DB #01,#41,#04,#44,#01,#41,#03,#11,#01,#14,#04,#11,#02,#44,#08,#11
    DB #01,#1E,#07,#11,#01,#BB,#01,#FB,#01,#FF,#01,#BB,#01,#3B,#01,#3C
    DB #01,#21,#0A,#11,#01,#C1,#07,#11,#04,#44,#01,#4C,#01,#CE,#03,#AA
    DB #01,#12,#05,#CC,#01,#CE,#01,#3A,#01,#12,#01,#FF,#01,#BA,#01,#2A
    DB #08,#AA,#01,#BB,#01,#EF,#02,#FF,#01,#F1,#03,#11,#01,#1E,#03,#FF
    DB #03,#BB,#01,#F1,#01,#3C,#01,#C4,#07,#44,#01,#4C,#03,#44,#01,#41
    DB #02,#44,#01,#F4,#01,#FD,#01,#5D,#01,#D4,#01,#11,#02,#44,#01,#41
    DB #01,#11,#02,#14,#02,#44,#02,#41,#08,#11,#01,#14,#01,#44,#01,#11
    DB #01,#41,#02,#44,#01,#41,#07,#11,#01,#CB,#01,#C1,#02,#1C,#01,#12
    DB #04,#BB,#02,#33,#01,#CC,#09,#11,#01,#1E,#01,#1C,#01,#C1,#05,#11
    DB #01,#44,#01,#14,#03,#44,#01,#4C,#01,#C1,#01,#CF,#01,#BB,#01,#F1
    DB #01,#2C,#06,#CC,#01,#E3,#01,#A1,#01,#11,#01,#EF,#01,#2A,#08,#AA
    DB #01,#AB,#01,#AE,#02,#FF,#01,#F1,#01,#1C,#01,#CC,#01,#C1,#01,#1F
    DB #02,#FF,#01,#FC,#03,#BB,#01,#F1,#01,#CC,#01,#C4,#0B,#44,#01,#41
    DB #01,#44,#01,#4F,#01,#FF,#01,#71,#01,#1D,#01,#54,#01,#14,#01,#44
    DB #01,#41,#02,#11,#03,#44,#0B,#11,#01,#41,#01,#11,#04,#44,#08,#11
    DB #01,#1C,#01,#C1,#01,#11,#01,#1C,#01,#CC,#01,#B3,#01,#33,#01,#BB
    DB #01,#33,#01,#32,#01,#33,#01,#3C,#0B,#11,#01,#1C,#06,#11,#01,#14
    DB #04,#44,#01,#CC,#01,#2C,#01,#1C,#01,#2C,#07,#CC,#01,#E3,#01,#33
    DB #03,#11,#08,#AA,#02,#AB,#01,#1F,#01,#FF,#01,#FC,#02,#CC,#01,#C1
    DB #01,#1F,#02,#FF,#01,#FB,#03,#BB,#01,#E2,#01,#CC,#01,#C4,#07,#44
    DB #01,#11,#05,#44,#02,#11,#01,#AA,#01,#14,#02,#44,#01,#41,#02,#11
    DB #01,#14,#02,#44,#01,#11,#01,#44,#0B,#11,#03,#44,#01,#41,#07,#11
    DB #01,#4C,#01,#E2,#01,#31,#01,#1C,#01,#CC,#01,#B2,#01,#CC,#05,#33
    DB #02,#22,#06,#11,#01,#CC,#05,#11,#01,#CC,#06,#11,#05,#44,#01,#4C
    DB #01,#C4,#01,#CC,#01,#4C,#06,#CC,#01,#C3,#01,#33,#01,#31,#02,#11
    DB #09,#AA,#01,#AB,#01,#BB,#01,#AF,#01,#FF,#01,#1C,#01,#CC,#01,#C1
    DB #01,#BF,#02,#FF,#01,#EB,#02,#BB,#01,#BF,#01,#13,#01,#CC,#01,#C4
    DB #07,#44,#01,#41,#01,#11,#03,#44,#01,#41,#01,#AA,#01,#1C,#01,#AA
    DB #01,#11,#01,#44,#15,#11,#01,#41,#03,#11,#01,#41,#0C,#11,#01,#C3
    DB #01,#32,#03,#22,#01,#3C,#01,#2C,#01,#21,#04,#11,#02,#CC,#01,#C1
    DB #03,#11,#01,#14,#01,#11,#01,#C1,#04,#11,#09,#44,#01,#C4,#06,#CC
    DB #01,#CE,#01,#33,#01,#32,#02,#11,#01,#1A,#09,#AA,#01,#AB,#01,#BB
    DB #01,#AA,#01,#E1,#01,#CC,#01,#1C,#03,#FF,#01,#AB,#02,#BB,#01,#BF
    DB #01,#1C,#02,#CC,#01,#C4,#07,#44,#02,#11,#01,#1A,#01,#1F,#01,#F1
    DB #01,#AA,#01,#C1,#01,#AA,#02,#11,#07,#AA,#01,#A1,#0B,#11,#01,#12
    DB #05,#11,#01,#41,#0C,#11,#01,#13,#04,#22,#01,#2C,#02,#CC,#01,#11
    DB #01,#14,#01,#11,#01,#14,#01,#11,#02,#CC,#01,#C1,#04,#11,#01,#1C
    DB #01,#14,#01,#41,#01,#11,#01,#14,#09,#44,#01,#C4,#01,#4C,#05,#CC
bitmap_intro_scene0_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_10_USED_END:
    ds 256, #FF
    org BITMAP_ROOM_DATA_BANK_10_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_11_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_11_ROM_START:
; GameFlow intro scene #0 SCREEN 5 bitmap, packed 4bpp RLE; VRAM #02935, raw 5835 bytes, RLE 4856 bytes
bitmap_intro_scene0_rle_chunk_1:
    DB #01,#C2,#01,#33,#01,#32,#01,#2C,#01,#11,#01,#1A,#0E,#AA,#01,#BF
    DB #02,#FF,#01,#FB,#03,#BB,#01,#BE,#01,#2C,#01,#CC,#01,#C4,#08,#44
    DB #01,#1A,#02,#AA,#01,#1F,#01,#71,#01,#AA,#04,#11,#07,#AA,#01,#21
    DB #08,#11,#01,#1A,#03,#AA,#03,#11,#01,#14,#0E,#11,#01,#1C,#01,#22
    DB #06,#CC,#01,#C1,#04,#11,#01,#1C,#02,#CC,#01,#C1,#01,#11,#01,#41
    DB #02,#11,#01,#CC,#01,#44,#01,#41,#01,#11,#09,#44,#02,#4C,#01,#CC
    DB #01,#EC,#04,#CC,#02,#33,#01,#C2,#01,#2C,#01,#CB,#0E,#AA,#01,#AB
    DB #06,#BB,#01,#F1,#01,#3C,#01,#CC,#09,#44,#01,#1A,#02,#AA,#01,#11
    DB #01,#1C,#01,#11,#01,#A1,#01,#C7,#01,#41,#01,#1A,#07,#AA,#06,#11
    DB #01,#2A,#06,#AA,#02,#11,#01,#14,#01,#44,#01,#11,#01,#41,#0D,#11
    DB #01,#22,#01,#CC,#01,#2C,#05,#CC,#05,#11,#01,#1C,#02,#CC,#01,#41
    DB #02,#11,#01,#44,#01,#41,#01,#C4,#0B,#44,#01,#CC,#01,#4C,#02,#CC
    DB #01,#EE,#03,#CC,#01,#E3,#01,#33,#01,#CE,#01,#2A,#01,#EF,#01,#FA
    DB #0F,#AA,#03,#BB,#01,#AA,#01,#FF,#01,#F1,#01,#3C,#01,#CC,#07,#44
    DB #01,#41,#01,#11,#01,#1A,#05,#AA,#01,#A1,#01,#E1,#0C,#11,#0A,#AA
    DB #02,#11,#01,#41,#01,#11,#01,#14,#01,#44,#0D,#11,#08,#CC,#01,#C1
    DB #05,#11,#03,#CC,#04,#44,#01,#4C,#01,#C4,#08,#44,#01,#E4,#01,#44
    DB #02,#CC,#01,#4C,#02,#CC,#01,#EC,#02,#CC,#01,#CE,#01,#3E,#01,#EE
    DB #01,#CC,#01,#31,#01,#FF,#0A,#AA,#01,#11,#08,#AA,#01,#BF,#01,#FC
    DB #01,#2C,#01,#CC,#03,#44,#01,#14,#01,#44,#01,#41,#02,#11,#07,#AA
    DB #01,#A1,#0C,#11,#01,#CA,#08,#AA,#05,#11,#01,#14,#02,#44,#0D,#11
    DB #09,#CC,#06,#11,#03,#CC,#01,#44,#01,#C4,#02,#44,#01,#4C,#0B,#44
    DB #01,#4C,#06,#CC,#01,#CE,#01,#33,#01,#3E,#01,#EC,#01,#E3,#01,#1F
    DB #01,#FA,#09,#AA,#01,#A1,#01,#FE,#07,#AA,#01,#BF,#01,#E3,#01,#CC
    DB #01,#C4,#04,#44,#01,#11,#01,#41,#07,#AA,#01,#A1,#05,#11,#06,#AA
    DB #01,#A1,#02,#11,#05,#AA,#01,#AC,#08,#11,#02,#41,#09,#11,#01,#E1
    DB #04,#11,#01,#1C,#08,#CC,#01,#C1,#05,#11,#01,#4C,#02,#CC,#01,#C4
    DB #01,#44,#01,#C4,#02,#44,#01,#CC,#07,#44,#01,#4E,#03,#44,#01,#C4
    DB #02,#CC,#01,#CE,#02,#CC,#01,#EE,#01,#33,#01,#3E,#02,#EE,#01,#3A
    DB #01,#CF,#09,#AA,#01,#A1,#01,#61,#01,#9F,#01,#FE,#01,#CA,#04,#AA
    DB #01,#AF,#01,#12,#01,#CC,#01,#C4,#05,#44,#01,#11,#05,#AA,#01,#A1
    DB #06,#11,#01,#1A,#06,#AA,#03,#11,#02,#AA,#01,#A1,#09,#11,#01,#14
    DB #03,#11,#01,#44,#0D,#11,#01,#1C,#08,#CC,#01,#C4,#01,#41,#04,#11
    DB #01,#14,#01,#4C,#05,#CC,#01,#C4,#01,#4C,#01,#C4,#09,#44,#01,#C4
    DB #02,#4C,#04,#CC,#01,#EE,#01,#B3,#01,#33,#02,#EE,#01,#33,#01,#BC
    DB #01,#CB,#08,#AA,#01,#A1,#01,#88,#01,#86,#01,#61,#01,#11,#01,#12
    DB #03,#AA,#01,#F1,#01,#AC,#01,#CC,#04,#44,#01,#14,#01,#44,#01,#1C
    DB #01,#AA,#01,#AB,#01,#A1,#02,#AA,#01,#A1,#01,#11,#01,#1A,#01,#AA
    DB #01,#A1,#02,#11,#01,#2A,#06,#AA,#0E,#11,#01,#41,#03,#11,#01,#14
    DB #01,#44,#01,#14,#0B,#11,#01,#41,#01,#11,#08,#CC,#01,#C4,#05,#11
    DB #01,#14,#01,#44,#06,#CC,#01,#44,#01,#4C,#01,#C4,#09,#44,#02,#CC
    DB #01,#CE,#02,#EC,#01,#CE,#01,#EE,#01,#E3,#01,#33,#02,#EE,#01,#E3
    DB #01,#33,#01,#A1,#01,#A2,#08,#AA,#01,#69,#01,#99,#01,#81,#01,#11
    DB #03,#AA,#01,#B2,#01,#13,#01,#CC,#01,#C4,#06,#44,#04,#11,#06,#AA
    DB #01,#A1,#1A,#11,#01,#14,#03,#44,#01,#14,#0C,#11,#07,#CC,#02,#44
    DB #01,#41,#03,#11,#02,#41,#01,#44,#06,#CC,#01,#C4,#01,#44,#01,#CC
    DB #06,#44,#01,#4C,#02,#44,#03,#CC,#02,#CE,#02,#EE,#01,#E3,#01,#3B
    DB #02,#EE,#02,#E3,#01,#AA,#01,#CC,#01,#CA,#08,#AA,#01,#99,#01,#91
    DB #03,#AA,#01,#B1,#01,#13,#02,#CC,#02,#44,#01,#E4,#03,#44,#04,#11
    DB #01,#1A,#06,#AA,#01,#A1,#19,#11,#01,#14,#02,#44,#01,#41,#01,#11
    DB #02,#14,#0B,#11,#01,#4C,#04,#CC,#05,#44,#04,#11,#01,#41,#02,#44
    DB #09,#CC,#08,#44,#04,#CC,#04,#EE,#01,#BB,#01,#BE,#02,#EE,#01,#33
    DB #01,#1B,#01,#AC,#01,#CC,#01,#11,#0B,#AA,#01,#A1,#01,#A3,#02,#CC
    DB #01,#C4,#03,#44,#01,#41,#03,#11,#01,#1C,#08,#AA,#03,#11,#01,#1A
    DB #08,#AA,#12,#11,#01,#44,#02,#11,#02,#14,#08,#11,#01,#14,#01,#11
    DB #01,#1C,#01,#CC,#01,#C4,#01,#CC,#06,#44,#01,#41,#03,#11,#01,#14
    DB #02,#44,#03,#CC,#01,#CE,#01,#EC,#05,#CC,#01,#C4,#01,#44,#01,#4C
    DB #04,#44,#03,#CC,#05,#EE,#01,#BB,#01,#B3,#02,#33,#01,#3B,#01,#1B
    DB #01,#AA,#01,#2C,#03,#11,#07,#AA,#01,#A1,#01,#AB,#01,#33,#01,#EC
    DB #02,#CC,#06,#44,#02,#11,#06,#AA,#01,#A1,#05,#11,#08,#AA,#01,#A1
    DB #0E,#11,#01,#14,#01,#44,#01,#14,#06,#11,#01,#41,#09,#11,#01,#14
    DB #01,#CC,#01,#44,#01,#C4,#07,#44,#01,#11,#04,#44,#01,#C4,#01,#4C
    DB #02,#CC,#01,#2E,#01,#EE,#01,#EC,#04,#CC,#01,#C4,#02,#44,#01,#C4
    DB #03,#44,#01,#4C,#02,#CC,#04,#EE,#01,#E3,#01,#BA,#01,#2A,#01,#B3
    DB #01,#33,#01,#BB,#01,#EA,#01,#AA,#01,#AC,#01,#C1,#01,#1B,#03,#BB
    DB #01,#A2,#01,#22,#01,#2A,#03,#BB,#01,#33,#02,#EE,#02,#CC,#04,#44
    DB #01,#11,#02,#44,#01,#12,#06,#AA,#01,#A1,#04,#11,#01,#1C,#08,#AA
    DB #01,#A1,#0D,#11,#01,#14,#01,#44,#09,#11,#02,#41,#03,#11,#01,#14
    DB #01,#41,#02,#11,#01,#41,#0A,#44,#06,#CC,#01,#44,#02,#CC,#01,#CE
    DB #02,#EE,#01,#EC,#04,#CC,#01,#C4,#01,#44,#01,#4C,#01,#44,#01,#C4
    DB #03,#4C,#01,#CC,#01,#CE,#01,#3E,#02,#EE,#01,#31,#03,#FF,#02,#11
    DB #01,#FA,#02,#AA,#01,#CC,#01,#1B,#03,#BB,#01,#B3,#02,#33,#03,#BB
    DB #01,#3E,#02,#EE,#01,#EC,#01,#CC,#01,#44,#01,#4C,#03,#44,#01,#41
    DB #01,#14,#01,#1A,#01,#AB,#01,#21,#02,#11,#02,#AA,#01,#B1,#04,#11
    DB #01,#1A,#01,#A2,#01,#C1,#03,#11,#01,#CA,#01,#AA,#01,#BB,#0D,#11
    DB #01,#14,#05,#11,#01,#44,#07,#11,#01,#41,#07,#11,#05,#44,#01,#41
    DB #02,#44,#01,#4C,#02,#CC,#01,#C2,#01,#22,#04,#CC,#01,#44,#02,#CC
    DB #01,#CE,#02,#EE,#05,#CC,#01,#C4,#02,#44,#01,#4C,#01,#44,#01,#4C
    DB #02,#CC,#01,#CE,#01,#EE,#02,#33,#01,#BF,#01,#FF,#01,#FB,#02,#BB
    DB #01,#FA,#01,#BA,#02,#AA,#01,#2C,#01,#1B,#04,#BB,#02,#33,#02,#BB
    DB #01,#B3,#03,#EE,#02,#CC,#01,#C2,#02,#32,#01,#CC,#03,#44,#05,#11
    DB #02,#AA,#01,#B1,#20,#11,#01,#1E,#07,#11,#01,#14,#01,#41,#08,#11
    DB #04,#44,#01,#14,#01,#4C,#01,#CC,#01,#22,#01,#2A,#01,#BF,#01,#FF
    DB #01,#BA,#01,#A2,#06,#CC,#02,#EE,#01,#E3,#01,#EC,#05,#CC,#01,#C4
    DB #01,#4E,#01,#44,#01,#4C,#02,#CC,#02,#EE,#01,#33,#01,#1F,#02,#FB
    DB #05,#BB,#01,#A1,#02,#AA,#01,#1B,#08,#BB,#01,#BE,#03,#EE,#01,#CC
    DB #01,#23,#01,#1B,#01,#BB,#01,#BF,#02,#CC,#01,#44,#01,#41,#02,#11
    DB #01,#44,#02,#11,#02,#AA,#01,#B1,#1F,#11,#01,#4F,#01,#74,#08,#11
    DB #01,#14,#01,#41,#05,#11,#01,#14,#01,#44,#01,#41,#03,#44,#01,#4C
    DB #01,#CC,#01,#2A,#01,#BF,#03,#BB,#02,#FF,#01,#BA,#01,#2C,#01,#CC
    DB #01,#C4,#01,#4C,#02,#CC,#01,#EE,#01,#33,#01,#3E,#01,#E2,#03,#CC
    DB #01,#EC,#01,#C4,#01,#44,#01,#4E,#01,#4C,#02,#CC,#02,#EE,#01,#31
    DB #01,#FB,#06,#BB,#02,#AA,#01,#AC,#01,#A2,#01,#CA,#01,#11,#01,#1C
    DB #06,#BB,#01,#BE,#03,#EE,#01,#CC,#01,#1B,#01,#AA,#01,#AB,#02,#BB
    DB #01,#12,#01,#C4,#03,#44,#02,#11,#01,#1C,#02,#AA,#01,#21,#2A,#11
    DB #02,#41,#05,#11,#02,#44,#01,#41,#01,#44,#01,#14,#01,#CC,#01,#C2
    DB #01,#FB,#01,#AB,#02,#BB,#01,#BF,#02,#FF,#01,#BF,#01,#B3,#01,#EE
    DB #01,#CC,#01,#C4,#02,#CC,#01,#CE,#02,#33,#01,#3E,#01,#EC,#02,#CC
    DB #01,#C3,#06,#CC,#01,#EE,#01,#33,#01,#1F,#04,#BB,#01,#BA,#01,#BB
    DB #05,#AA,#01,#AC,#01,#C2,#01,#22,#01,#FC,#05,#BB,#01,#3E,#02,#EE
    DB #01,#EC,#01,#C3,#01,#CA,#01,#AA,#01,#AB,#02,#BB,#01,#B1,#01,#C4
    DB #02,#44,#01,#14,#02,#44,#11,#11,#01,#EF,#01,#FF,#02,#11,#01,#CF
    DB #1A,#11,#01,#41,#04,#11,#01,#14,#01,#41,#01,#11,#01,#44,#01,#4C
    DB #01,#C2,#01,#CF,#03,#BB,#03,#FF,#02,#BB,#01,#BF,#01,#3C,#01,#CC
    DB #01,#44,#01,#EC,#02,#CC,#01,#E3,#01,#33,#01,#3B,#01,#3E,#01,#EE
    DB #02,#CC,#01,#EC,#04,#CC,#01,#EE,#01,#33,#01,#1F,#02,#BB,#01,#BA
    DB #03,#AA,#01,#BA,#06,#AA,#01,#22,#01,#2C,#01,#CC,#01,#BA,#04,#BB
    DB #01,#BE,#02,#EE,#01,#E3,#01,#33,#01,#1A,#01,#AA,#01,#A1,#01,#1A
    DB #01,#AB,#01,#B1,#01,#CC,#03,#44,#01,#41,#11,#11,#01,#1F,#01,#C1
    DB #02,#1F,#01,#E1,#01,#11,#01,#EE,#0A,#11,#01,#1A,#0B,#11,#01,#41
    DB #03,#11,#01,#14,#05,#11,#01,#41,#01,#44,#02,#CC,#01,#FA,#01,#AB
    DB #01,#BB,#05,#FF,#02,#BB,#01,#F2,#01,#CC,#02,#44,#01,#4C,#01,#CC
    DB #01,#CE,#01,#EB,#02,#BB,#01,#3E,#03,#EE,#01,#EC,#02,#CC,#01,#EE
    DB #01,#E3,#01,#1F,#02,#BB,#01,#BA,#0C,#AA,#01,#2C,#01,#CC,#01,#CF
    DB #01,#AB,#03,#BB,#01,#3E,#01,#E3,#01,#33,#01,#2C,#01,#BA,#01,#2A
    DB #01,#A2,#01,#11,#01,#AB,#02,#BB,#01,#C2,#01,#C4,#01,#44,#01,#41
    DB #0B,#11,#01,#C1,#01,#11,#01,#EE,#01,#1F,#01,#E1,#01,#CF,#01,#FF
    DB #01,#1F,#01,#11,#01,#1F,#0E,#11,#01,#1B,#02,#11,#01,#14,#01,#41
    DB #0C,#11,#01,#14,#05,#11,#01,#44,#01,#CC,#01,#2F,#01,#AA,#02,#BB
    DB #05,#FF,#01,#BB,#01,#BA,#01,#FA,#02,#2C,#01,#C4,#02,#4C,#01,#CC
    DB #01,#EE,#03,#BB,#01,#3E,#05,#EE,#01,#33,#01,#CF,#02,#BB,#01,#BA
    DB #03,#AA,#01,#1A,#0A,#AA,#01,#2A,#01,#CC,#01,#BA,#01,#BB,#01,#BF
    DB #01,#BB,#01,#BE,#01,#3B,#01,#33,#01,#EA,#01,#AA,#01,#A1,#01,#1C
    DB #01,#AB,#03,#BB,#01,#B1,#01,#2C,#01,#C4,#01,#4C,#01,#41,#07,#11
    DB #01,#1E,#01,#1C,#01,#EF,#01,#F1,#01,#E1,#01,#FF,#04,#11,#01,#1F
    DB #01,#FE,#01,#E1,#06,#11,#01,#1C,#01,#11,#01,#1C,#03,#11,#01,#AA
    DB #01,#A1,#01,#CC,#01,#11,#01,#14,#01,#11,#01,#47,#01,#74,#01,#14
    DB #01,#41,#0B,#11,#01,#41,#03,#11,#01,#4C,#01,#C2,#01,#1A,#01,#2A
    DB #02,#BB,#05,#FF,#01,#BB,#01,#BA,#01,#AF,#01,#3C,#02,#CC,#02,#44
    DB #01,#CC,#01,#CE,#01,#EE,#03,#BB,#03,#EE,#01,#E3,#01,#33,#01,#1F
    DB #02,#BB,#03,#AA,#01,#A1,#01,#1C,#01,#CC,#0B,#AA,#01,#2C,#01,#1B
    DB #01,#EF,#01,#FF,#01,#BB,#01,#BE,#01,#BB,#01,#E3,#03,#AA,#01,#1A
    DB #01,#AB,#04,#BB,#01,#3C,#01,#C4,#03,#44,#03,#11,#01,#1F,#01,#11
    DB #01,#1F,#01,#FF,#01,#11,#01,#1E,#01,#1F,#01,#11,#01,#F1,#01,#1E
    DB #0B,#11,#01,#AA,#01,#A1,#01,#11,#01,#2A,#01,#AA,#01,#C1,#01,#A1
    DB #02,#11,#01,#A1,#04,#11,#01,#17,#01,#F7,#02,#44,#0E,#11,#01,#4C
    DB #01,#C2,#01,#F2,#01,#2A,#01,#AB,#01,#BB,#01,#BF,#04,#FF,#01,#BB
    DB #01,#BA,#01,#AF,#01,#2C,#01,#C4,#01,#4C,#01,#C4,#01,#44,#01,#4C
    DB #01,#CC,#01,#EE,#01,#EB,#02,#BB,#01,#B3,#01,#3E,#01,#E3,#01,#3B
    DB #01,#CF,#01,#BB,#01,#BA,#03,#AA,#01,#A1,#01,#BB,#01,#1C,#01,#CA
    DB #0B,#AA,#01,#A1,#02,#11,#01,#FF,#02,#BB,#01,#BE,#01,#E3,#01,#1A
    DB #02,#AA,#01,#1A,#01,#AA,#03,#BB,#01,#BF,#01,#CC,#03,#44,#01,#41
    DB #02,#11,#02,#1F,#01,#FC,#01,#1C,#01,#FF,#01,#E1,#01,#FF,#01,#1F
    DB #01,#F1,#01,#FE,#07,#11,#01,#1A,#01,#1C,#01,#AA,#01,#11,#01,#A1
    DB #02,#AA,#01,#21,#01,#1A,#01,#CC,#0A,#11,#01,#44,#01,#FF,#01,#F5
    DB #01,#44,#01,#41,#0B,#11,#01,#41,#01,#4C,#01,#C2,#01,#F2,#01,#AB
    DB #03,#BB,#03,#FF,#02,#BB,#01,#BA,#01,#AB,#01,#CC,#01,#C4,#01,#44
    DB #01,#4C,#01,#E4,#02,#CC,#02,#EE,#01,#3B,#03,#BB,#01,#BA,#01,#CF
    DB #01,#BB,#01,#BA,#03,#AA,#01,#A1,#02,#BB,#01,#12,#01,#2A,#0C,#AA
    DB #01,#11,#01,#1C,#01,#BC,#02,#BB,#01,#BE,#01,#EE,#01,#B2,#01,#CA
    DB #01,#A1,#01,#1A,#01,#AA,#01,#1A,#03,#BB,#01,#12,#01,#C4,#01,#4E
    DB #01,#41,#03,#11,#01,#1F,#01,#EE,#01,#CF,#01,#EE,#01,#1E,#01,#11
    DB #01,#1E,#01,#C1,#06,#11,#01,#1A,#01,#11,#01,#AA,#03,#11,#01,#1A
    DB #01,#11,#01,#1A,#02,#11,#01,#1A,#06,#11,#01,#14,#01,#41,#03,#11
    DB #01,#14,#01,#47,#01,#FF,#01,#F7,#01,#44,#01,#41,#05,#11,#01,#41
    DB #03,#11,#02,#14,#01,#44,#01,#C3,#01,#F2,#01,#BB,#01,#AB,#07,#BB
    DB #01,#BA,#01,#2B,#01,#2C,#01,#C4,#02,#44,#01,#CE,#01,#E4,#01,#4C
    DB #01,#CC,#02,#EE,#03,#BB,#01,#2F,#02,#BB,#01,#BA,#02,#AA,#01,#C1
    DB #01,#33,#01,#EE,#01,#EB,#01,#BC,#0D,#AA,#01,#A1,#01,#1C,#01,#11
    DB #01,#CB,#01,#BB,#01,#BE,#01,#EE,#01,#31,#01,#A2,#01,#CC,#01,#C1
    DB #01,#AC,#01,#AA,#03,#BB,#01,#E3,#01,#C4,#01,#41,#04,#11,#02,#F1
    DB #08,#11,#01,#1C,#01,#AA,#01,#11,#01,#A1,#01,#11,#02,#1A,#01,#A1
    DB #01,#11,#01,#1A,#01,#A1,#01,#11,#01,#A1,#07,#11,#01,#14,#07,#11
    DB #01,#14,#01,#45,#01,#7F,#01,#F5,#01,#41,#08,#11,#01,#14,#02,#11
    DB #01,#44,#01,#C2,#0A,#BB,#01,#A2,#01,#2F,#01,#AC,#04,#44,#01,#CC
    DB #01,#E4,#01,#CC,#01,#CE,#01,#EE,#01,#E3,#01,#BB,#01,#CF,#03,#BB
    DB #02,#AA,#01,#1C,#01,#3E,#03,#EE,#01,#B1,#0E,#AA,#02,#11,#01,#CA
    DB #01,#1B,#01,#BE,#01,#E3,#01,#B1,#02,#AA,#01,#AC,#01,#1A,#01,#AA
    DB #03,#BB,#01,#B2,#01,#C1,#0C,#11,#01,#A1,#01,#11,#01,#1A,#01,#11
    DB #01,#CA,#01,#1A,#01,#AA,#02,#A1,#01,#11,#01,#AA,#01,#1A,#01,#A1
    DB #13,#11,#01,#14,#01,#44,#01,#45,#01,#F4,#03,#11,#01,#14,#01,#11
    DB #01,#14,#05,#11,#01,#44,#01,#CC,#01,#CF,#01,#AB,#07,#BB,#01,#BA
    DB #01,#22,#01,#B2,#01,#2C,#05,#44,#01,#CE,#01,#EC,#01,#CE,#01,#EE
    DB #01,#3A,#01,#1F,#04,#BB,#01,#BA,#01,#12,#01,#BE,#01,#EB,#02,#EE
    DB #01,#B3,#01,#BC,#01,#FA,#0D,#AA,#01,#B1,#02,#CC,#01,#CB,#01,#13
    DB #01,#3B,#01,#BB,#01,#1A,#01,#AA,#01,#A2,#02,#AA,#01,#A1,#01,#2C
    DB #01,#AA,#01,#C3,#01,#CC,#01,#C4,#01,#44,#07,#11,#01,#AC,#01,#A1
    DB #01,#AA,#01,#A1,#01,#21,#01,#11,#01,#AC,#01,#C1,#01,#1A,#14,#11
    DB #01,#14,#01,#41,#08,#11,#01,#44,#09,#11,#02,#44,#01,#4C,#01,#2E
    DB #01,#FB,#06,#BB,#01,#BA,#01,#22,#01,#AA,#01,#F3,#01,#C4,#05,#44
    DB #01,#4C,#01,#CE,#01,#EE,#01,#3B,#01,#1F,#01,#AB,#04,#BB,#01,#2A
    DB #01,#BE,#04,#EE,#02,#BB,#01,#EA,#0D,#AA,#01,#AB,#01,#1C,#02,#CC
    DB #01,#C2,#01,#2B,#01,#BB,#01,#B1,#02,#AA,#01,#A1,#01,#AA,#01,#21
    DB #01,#22,#01,#AB,#01,#32,#01,#E4,#01,#44,#05,#11,#01,#A1,#01,#11
    DB #01,#AA,#01,#A2,#01,#A1,#01,#C2,#01,#1A,#02,#11,#01,#A1,#01,#11
    DB #01,#1A,#14,#11,#01,#44,#0A,#11,#01,#14,#06,#11,#01,#14,#01,#41
    DB #01,#14,#02,#44,#01,#C2,#01,#FF,#02,#AA,#01,#AB,#01,#BB,#02,#AA
    DB #01,#2A,#01,#A2,#01,#BF,#01,#3C,#07,#44,#01,#CC,#01,#EB,#01,#1F
    DB #03,#AA,#01,#AB,#01,#BB,#01,#AB,#04,#BB,#01,#BE,#03,#BB,#01,#1B
    DB #01,#BB,#0D,#AA,#01,#B1,#03,#CC,#01,#21,#01,#AB,#01,#1A,#01,#C2
    DB #02,#AA,#01,#A2,#01,#22,#01,#2A,#01,#2B,#01,#EC,#01,#44,#04,#11
    DB #01,#1C,#02,#AA,#01,#A1,#01,#A2,#01,#CA,#01,#11,#01,#AA,#01,#2A
    DB #01,#A1,#01,#AA,#0E,#11,#01,#14,#01,#44,#04,#11,#01,#14,#01,#E4
    DB #01,#44,#0D,#11,#01,#41,#04,#11,#03,#14,#02,#44,#01,#4C,#01,#2A
    DB #01,#F1,#01,#11,#01,#CC,#01,#C1,#01,#1A,#02,#AA,#01,#AF,#01,#B3
    DB #01,#C4,#07,#44,#01,#CC,#01,#B1,#01,#FA,#03,#AA,#01,#1A,#01,#A1
    DB #09,#BB,#01,#1F,#01,#BB,#0D,#AA,#01,#AB,#01,#1C,#03,#CC,#01,#AB
    DB #02,#AA,#01,#1A,#03,#AA,#01,#B1,#01,#BE,#01,#EC,#01,#11,#01,#CC
    DB #01,#C1,#03,#11,#01,#1A,#01,#A1,#01,#11,#01,#A1,#02,#11,#01,#1A
    DB #01,#A1,#14,#11,#01,#14,#01,#44,#01,#41,#07,#11,#01,#E4,#08,#11
    DB #01,#14,#03,#11,#01,#44,#01,#11,#04,#44,#01,#4C,#01,#2C,#03,#CC
    DB #01,#C1,#01,#A2,#01,#BF,#01,#B3,#01,#CC,#08,#44,#01,#CC,#01,#31
    DB #01,#BA,#03,#AA,#01,#A1,#01,#AB,#09,#BB,#01,#AF,#01,#BB,#01,#BA
    DB #0D,#AA,#01,#B1,#03,#CC,#01,#2A,#02,#AA,#01,#2C,#02,#AA,#01,#11
    DB #01,#B3,#01,#EC,#01,#1C,#01,#CC,#01,#C1,#04,#11,#01,#A1,#01,#AA
    DB #01,#11,#01,#AA,#01,#A1,#0E,#11,#01,#14,#01,#44,#06,#11,#01,#14
    DB #01,#44,#01,#41,#12,#11,#03,#44,#01,#11,#01,#14,#05,#44,#01,#C2
    DB #01,#A1,#02,#11,#01,#CA,#01,#B2,#01,#23,#01,#C4,#09,#44,#01,#4C
    DB #01,#2C,#05,#AA,#01,#CB,#0B,#BB,#0F,#AA,#01,#1C,#02,#CC,#01,#22
    DB #03,#AA,#01,#2A,#01,#13,#01,#33,#01,#3E,#01,#EC,#01,#CE,#01,#E1
    DB #04,#11,#01,#AA,#12,#11,#03,#44,#02,#11,#01,#44,#02,#11,#02,#44
    DB #01,#41,#10,#11,#01,#14,#01,#D9,#01,#9E,#0A,#44,#01,#4C,#01,#A1
    DB #02,#11,#01,#23,#01,#C4,#0C,#44,#01,#C3,#01,#CA,#05,#AA,#03,#BB
    DB #01,#BF,#05,#BB,#01,#B1,#01,#BA,#01,#BB,#0E,#AA,#01,#C1,#01,#C2
    DB #01,#2C,#01,#22,#01,#2A,#02,#AA,#01,#B1,#01,#EE,#01,#E3,#01,#EC
    DB #01,#EE,#01,#E1,#14,#11,#01,#14,#01,#41,#01,#C1,#01,#44,#01,#14
    DB #02,#44,#01,#11,#01,#14,#03,#44,#01,#11,#01,#41,#01,#11,#01,#14
    DB #04,#44,#01,#57,#06,#11,#01,#14,#02,#11,#01,#44,#02,#11,#01,#1D
    DB #01,#DD,#01,#9F,#09,#44,#01,#A1,#01,#11,#01,#1B,#01,#CC,#0D,#44
    DB #01,#4C,#01,#E3,#01,#CA,#04,#AA,#01,#BC,#02,#BB,#02,#FF,#01,#FB
    DB #03,#BB,#01,#B1,#01,#FA,#01,#BA,#04,#AA,#01,#BA,#09,#AA,#01,#B1
    DB #01,#F1,#03,#22,#01,#AA,#01,#AB,#01,#2E,#01,#EE,#01,#BE,#01,#EE
    DB #01,#EC,#13,#11,#02,#14,#01,#41,#06,#44,#01,#41,#03,#44,#01,#11
    DB #01,#14,#05,#44,#01,#57,#01,#77,#01,#74,#08,#11,#01,#44,#01,#41
    DB #01,#14,#03,#11,#01,#44,#01,#FE,#08,#44,#01,#21,#01,#11,#01,#12
    DB #0C,#44,#01,#C4,#02,#44,#01,#EE,#01,#B1,#05,#AA,#01,#1B,#02,#BB
    DB #02,#FF,#01,#FB,#01,#BB,#01,#BA,#01,#1B,#01,#FA,#01,#AA,#01,#A1
    DB #03,#AA,#01,#BA,#05,#AA,#01,#AC,#01,#BA,#02,#AA,#01,#AB,#01,#1F
    DB #01,#B1,#02,#22,#01,#2A,#01,#1B,#01,#EE,#01,#7B,#01,#3E,#01,#EE
    DB #02,#11,#01,#CC,#01,#C1,#08,#11,#01,#1E,#06,#11,#02,#14,#08,#44
    DB #01,#14,#07,#44,#01,#45,#01,#57,#01,#FF,#01,#F7,#02,#44,#07,#11
    DB #01,#14,#01,#44,#04,#11,#01,#14,#01,#44,#01,#DF,#01,#F4,#07,#44
    DB #01,#C1,#01,#11,#01,#1C,#0C,#44,#01,#C4,#01,#44,#01,#CC,#01,#CE
    DB #01,#EB,#01,#1A,#04,#AA,#01,#AC,#02,#BB,#03,#FF,#01,#F1,#01,#1A
    DB #02,#BB,#02,#AA,#01,#A2,#02,#AA,#01,#FF,#01,#BA,#04,#AA,#01,#A1
    DB #01,#2A,#02,#AA,#01,#AB,#01,#F1,#01,#BB,#01,#B1,#01,#CA,#01,#1C
    DB #01,#BE,#01,#7B,#01,#BE,#01,#7E,#01,#11,#01,#EE,#01,#EC,#01,#C1
    DB #01,#1C,#01,#C1,#05,#11,#01,#1C,#01,#EC,#01,#CF,#04,#11,#01,#CC
    DB #01,#14,#01,#41,#0F,#44,#01,#45,#01,#7F,#02,#FF,#01,#F4,#02,#44
    DB #01,#41,#07,#11,#01,#44,#01,#41,#05,#11,#01,#14,#01,#44,#01,#FE
    DB #07,#44,#01,#C1,#01,#11,#01,#1C,#0E,#44,#01,#4C,#02,#EE,#01,#31
    DB #05,#AA,#01,#B1,#02,#BB,#01,#FF,#01,#FB,#01,#F1,#01,#BA,#01,#AA
    DB #01,#BA,#05,#AA,#01,#FF,#01,#BB,#05,#AA,#01,#BA,#02,#AA,#01,#AB
    DB #01,#BF,#01,#1B,#05,#BB,#01,#EB,#01,#CB,#02,#EE,#01,#C1,#02,#CC
    DB #05,#11,#01,#CC,#01,#EF,#01,#BB,#04,#11,#01,#CE,#02,#41,#0F,#44
    DB #01,#77,#03,#FF,#01,#74,#03,#44,#01,#41,#07,#11,#01,#44,#01,#41
    DB #05,#11,#01,#14,#01,#4D,#01,#9F,#07,#44,#01,#C1,#02,#1C,#0D,#44
    DB #01,#4E,#04,#EE,#01,#CA,#05,#AA,#01,#A1,#01,#BB,#01,#F1,#01,#FB
    DB #03,#AA,#01,#A2,#02,#AA,#01,#A1,#03,#AA,#01,#BB,#08,#AA,#02,#BB
    DB #01,#BC,#06,#BB,#01,#BE,#01,#EE,#01,#CE,#01,#EE,#01,#EC,#05,#11
    DB #01,#4C,#01,#BB,#01,#B1,#01,#E1,#03,#11,#01,#BC,#01,#41,#01,#C1
    DB #0E,#44,#01,#45,#01,#7F,#03,#FF,#01,#75,#04,#44,#01,#14,#06,#11
    DB #01,#14,#01,#41,#05,#11,#03,#44,#01,#DD,#07,#44,#01,#C1,#01,#11
    DB #01,#1C,#0E,#44,#04,#EE,#01,#EB,#01,#1A,#04,#AA,#01,#AB,#01,#C1
    DB #01,#EB,#02,#AA,#01,#AB,#01,#A1,#01,#1C,#02,#CC,#01,#CA,#03,#AA
    DB #01,#BB,#01,#BA,#07,#AA,#02,#BB,#01,#FC,#03,#BB,#01,#FF,#01,#BB
    DB #01,#B7,#04,#EE,#01,#C1,#02,#11,#01,#44,#01,#C1,#01,#4C,#01,#BB
    DB #01,#BE,#01,#44,#02,#11,#01,#14,#02,#44,#01,#14,#0E,#44,#01,#55
    DB #01,#7F,#02,#FF,#01,#F7,#01,#55,#06,#44,#02,#11,#01,#41,#03,#11
    DB #01,#14,#05,#11,#01,#44,#01,#41,#02,#44,#01,#49,#07,#44,#01,#21
    DB #01,#1C,#01,#12,#0E,#44,#05,#EE,#01,#B1,#05,#AA,#01,#CA,#04,#AA
    DB #01,#AC,#01,#11,#01,#12,#05,#AA,#01,#CC,#04,#11,#01,#CC,#03,#AA
    DB #02,#BB,#01,#BF,#01,#1F,#02,#FF,#01,#FB,#01,#BB,#01,#EE,#01,#E7
    DB #01,#77,#01,#EE,#01,#E1,#01,#11,#01,#14,#02,#44,#01,#4E,#01,#BB
    DB #01,#EC,#01,#44,#01,#41,#01,#11,#01,#14,#02,#44,#01,#C1,#0E,#44
    DB #01,#57,#02,#FF,#01,#77,#01,#55,#01,#54,#07,#44,#06,#11,#01,#14
    DB #05,#11,#04,#44,#01,#4D,#07,#44,#01,#31,#01,#CC,#01,#C3,#01,#44
    DB #01,#4E,#0C,#44,#05,#EE,#01,#EB,#01,#1A,#03,#AA,#01,#A2,#08,#AA
    DB #01,#C1,#01,#CF,#03,#FF,#04,#11,#01,#1E,#03,#FF,#01,#FE,#01,#A1
    DB #01,#2B,#01,#BF,#01,#B1,#01,#FF,#01,#FB,#01,#B7,#01,#77,#01,#7B
    DB #01,#BB,#01,#EE,#01,#EC,#01,#1C,#01,#44,#01,#CE,#01,#EE,#01,#CC
    DB #01,#11,#03,#44,#01,#11,#03,#44,#01,#41,#0D,#44,#01,#45,#01,#7F
    DB #01,#FF,#01,#F5,#01,#54,#0A,#44,#09,#11,#07,#44,#01,#49,#07,#44
    DB #01,#C1,#01,#CC,#01,#A2,#09,#44,#01,#E4,#02,#44,#01,#E4,#01,#44
    DB #06,#EE,#01,#BB,#01,#1A,#09,#AA,#01,#AB,#01,#AA,#01,#A1,#04,#FF
    DB #01,#C1,#04,#11,#04,#FF,#02,#11,#01,#1B,#01,#11,#01,#EB,#04,#BB
    DB #01,#E7,#01,#EE,#01,#CE,#02,#EE,#01,#4C,#01,#71,#01,#14,#03,#44
    DB #01,#11,#01,#44,#01,#4E,#0F,#44,#01,#57,#01,#FF,#01,#F7,#01,#55
    DB #0C,#44,#07,#11,#11,#44,#01,#C1,#01,#CC,#01,#C1,#01,#C4,#08,#44
    DB #01,#F4,#03,#44,#07,#EE,#01,#E3,#01,#B1,#01,#BA,#0B,#AA,#01,#AC
    DB #03,#FF,#01,#E1,#04,#11,#04,#FF,#03,#11,#01,#AF,#01,#E1,#01,#FF
    DB #02,#BB,#01,#7E,#05,#EE,#01,#E1,#01,#C4,#03,#44,#01,#E1,#01,#EE
    DB #03,#44,#01,#14,#03,#44,#01,#4E,#08,#44,#01,#57,#01,#FF,#01,#55
    DB #0E,#44,#07,#11,#0E,#44,#01,#E4,#02,#44,#01,#42,#01,#1C,#01,#CC
    DB #01,#24,#08,#44,#01,#E4,#02,#44,#01,#4E,#03,#EE,#02,#BB,#03,#EE
    DB #01,#BB,#01,#CA,#06,#AA,#02,#11,#01,#2A,#02,#AA,#01,#A1,#03,#FF
    DB #01,#E1,#04,#11,#04,#FF,#03,#11,#01,#CF,#01,#FF,#01,#CF,#01,#BB
    DB #04,#77,#02,#EE,#01,#14,#01,#CC,#01,#44,#01,#4E,#04,#EE,#0E,#44
    DB #01,#45,#01,#7F,#01,#75,#10,#44,#05,#11,#01,#14,#08,#44,#01,#4D
    DB #05,#44,#01,#4E,#01,#EE,#02,#44,#01,#4C,#01,#1C,#01,#C2,#01,#C4
    DB #0B,#44,#01,#4E,#05,#EE,#01,#EB,#04,#BB,#01,#1A,#06,#AA,#01,#C1
    DB #01,#11,#01,#2A,#01,#AA,#01,#AE,#03,#FF,#01,#E1,#04,#11,#04,#FF
    DB #03,#11,#01,#1F,#01,#FF,#01,#1B,#01,#B7,#01,#77,#01,#B7,#02,#7E
    DB #07,#EE,#10,#44,#01,#47,#01,#F7,#12,#44,#06,#11,#01,#14,#01,#11
    DB #11,#44,#01,#21,#01,#CC,#01,#C3,#0C,#44,#07,#EE,#03,#BB,#01,#F1
    DB #07,#AA,#03,#11,#01,#EF,#01,#FF,#01,#E1,#01,#11,#01,#1F,#04,#FF
    DB #02,#11,#01,#CE,#01,#FF,#01,#C1,#02,#11,#01,#1E,#01,#FF,#01,#BE
    DB #01,#BB,#03,#77,#01,#7E,#03,#EE,#01,#77,#03,#EE,#01,#E4,#0E,#44
    DB #01,#77,#01,#54,#13,#44,#05,#11,#01,#41,#02,#11,#11,#44,#01,#21
    DB #01,#1C,#01,#21,#01,#C4,#0A,#44,#01,#4E,#08,#EE,#02,#BB,#01,#BC
    DB #08,#AA,#01,#CE,#01,#E1,#01,#11,#01,#16,#02,#11,#01,#1F,#04,#FF
    DB #04,#11,#01,#1F,#01,#FF,#01,#C1,#01,#11,#01,#FF,#01,#F1,#02,#BB
    DB #02,#77,#01,#E7,#01,#7B,#01,#BB,#01,#B7,#01,#7E,#02,#EE,#01,#E4
    DB #0D,#44,#01,#47,#01,#74,#15,#44
bitmap_intro_scene0_rle_chunk_1_end:

BITMAP_ROOM_DATA_BANK_11_USED_END:
    ds 3336, #FF
    org BITMAP_ROOM_DATA_BANK_11_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_12_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_12_ROM_START:
; GameFlow intro scene #0 SCREEN 5 bitmap, packed 4bpp RLE; VRAM #04000, raw 9353 bytes, RLE 7936 bytes
bitmap_intro_scene0_rle_chunk_2:
    DB #01,#D4,#03,#11,#01,#14,#02,#11,#12,#44,#01,#42,#01,#1C,#01,#CA
    DB #01,#24,#0A,#44,#08,#EE,#04,#BB,#01,#EA,#02,#AA,#01,#A1,#01,#1A
    DB #03,#AA,#01,#A1,#01,#B1,#04,#11,#01,#1F,#04,#FF,#04,#11,#01,#1F
    DB #03,#FF,#01,#1B,#01,#FC,#07,#BB,#03,#EE,#01,#E4,#0D,#44,#01,#77
    DB #0D,#44,#01,#4E,#09,#44,#01,#41,#01,#14,#02,#DD,#01,#D1,#01,#41
    DB #02,#11,#01,#14,#10,#44,#01,#4C,#01,#1C,#02,#C2,#09,#44,#08,#EE
    DB #06,#BB,#01,#11,#01,#A2,#01,#11,#01,#E1,#01,#1A,#03,#AA,#01,#B1
    DB #04,#11,#01,#1F,#04,#FF,#04,#11,#01,#1F,#03,#FF,#01,#11,#01,#BA
    DB #01,#1B,#01,#FF,#03,#BB,#01,#7E,#04,#EE,#0C,#44,#01,#47,#01,#54
    DB #1A,#44,#01,#41,#01,#4D,#01,#DD,#01,#D4,#01,#44,#01,#14,#12,#44
    DB #01,#21,#01,#C2,#01,#A1,#01,#24,#06,#44,#01,#4E,#08,#EE,#01,#EB
    DB #06,#BB,#01,#FF,#01,#CC,#01,#EE,#01,#11,#01,#1C,#01,#CA,#01,#AA
    DB #01,#A1,#01,#F1,#04,#11,#01,#1F,#04,#FF,#04,#11,#01,#1F,#03,#FF
    DB #01,#11,#01,#AB,#01,#EF,#01,#FF,#01,#BB,#01,#77,#01,#E7,#04,#EE
    DB #03,#44,#01,#47,#08,#44,#01,#75,#1E,#44,#01,#4D,#01,#DD,#14,#44
    DB #01,#43,#01,#12,#01,#AA,#01,#13,#03,#44,#01,#45,#02,#44,#09,#EE
    DB #06,#BB,#02,#FF,#01,#1A,#01,#AC,#01,#11,#01,#1E,#02,#EE,#01,#EF
    DB #01,#F1,#04,#11,#01,#1F,#04,#FF,#04,#11,#01,#1F,#03,#FF,#01,#11
    DB #01,#1B,#03,#BB,#01,#B7,#01,#77,#04,#EE,#01,#44,#01,#E4,#08,#44
    DB #01,#47,#13,#44,#01,#45,#08,#44,#02,#DD,#02,#44,#01,#4D,#01,#DD
    DB #01,#44,#01,#41,#12,#44,#01,#4C,#01,#31,#01,#2A,#01,#A1,#01,#34
    DB #03,#44,#01,#4E,#0A,#EE,#04,#BB,#01,#BF,#02,#FF,#01,#FA,#01,#FB
    DB #01,#B1,#01,#11,#01,#1E,#01,#EE,#01,#EF,#01,#FF,#01,#B1,#03,#11
    DB #01,#1C,#04,#CC,#01,#C1,#04,#11,#01,#1F,#03,#FF,#01,#11,#01,#1B
    DB #01,#BA,#02,#BB,#01,#B7,#02,#77,#01,#7E,#04,#EE,#07,#44,#01,#54
    DB #16,#44,#01,#4E,#01,#11,#01,#14,#04,#44,#02,#DD,#01,#9F,#01,#44
    DB #01,#4D,#02,#DD,#01,#44,#01,#D9,#12,#44,#01,#C2,#01,#1A,#01,#AA
    DB #01,#13,#01,#5E,#02,#44,#07,#EE,#01,#EB,#05,#BB,#01,#BF,#04,#FF
    DB #01,#FA,#01,#FF,#01,#B1,#01,#11,#01,#1E,#01,#C1,#01,#1C,#01,#CC
    DB #01,#2A,#08,#AA,#01,#2C,#06,#CC,#01,#11,#01,#EB,#01,#11,#01,#1A
    DB #01,#BF,#02,#BB,#03,#77,#01,#7E,#01,#EE,#01,#E7,#01,#EE,#06,#44
    DB #01,#54,#0A,#44,#01,#4E,#01,#FE,#01,#E4,#0B,#44,#01,#91,#01,#11
    DB #01,#44,#01,#11,#05,#44,#01,#DD,#01,#9F,#01,#F4,#02,#DD,#01,#4D
    DB #01,#DD,#01,#D4,#05,#44,#01,#41,#0B,#44,#01,#4C,#01,#E1,#01,#AA
    DB #01,#A1,#01,#BE,#01,#44,#01,#4E,#04,#EE,#01,#7B,#06,#BB,#07,#FF
    DB #01,#1F,#01,#FF,#01,#A1,#01,#1C,#01,#22,#01,#2A,#01,#A2,#01,#2A
    DB #08,#AA,#01,#AC,#09,#CC,#02,#11,#01,#BF,#03,#BB,#01,#B7,#03,#77
    DB #02,#EE,#01,#E5,#01,#54,#0E,#44,#02,#FE,#01,#C1,#01,#11,#01,#1E
    DB #09,#44,#01,#49,#01,#D4,#01,#41,#01,#11,#01,#41,#06,#44,#01,#4D
    DB #02,#FF,#01,#FD,#02,#DD,#01,#D4,#05,#44,#01,#11,#0C,#44,#01,#43
    DB #01,#1A,#01,#AA,#01,#BC,#01,#3E,#01,#EE,#01,#4E,#06,#EE,#01,#EB
    DB #06,#BB,#04,#FF,#01,#EF,#01,#BC,#01,#11,#01,#22,#0B,#AA,#0C,#CC
    DB #01,#11,#02,#BF,#02,#BB,#04,#77,#03,#EE,#02,#E5,#0A,#44,#01,#4E
    DB #01,#FF,#01,#9E,#01,#EE,#01,#C1,#03,#11,#09,#44,#01,#4D,#01,#44
    DB #01,#D1,#02,#11,#08,#44,#01,#4E,#01,#FF,#04,#DD,#04,#44,#01,#1E
    DB #0D,#44,#01,#E1,#02,#AA,#01,#1B,#0A,#EE,#01,#EB,#06,#BB,#01,#FF
    DB #01,#F1,#01,#FA,#01,#11,#01,#1C,#0A,#AA,#01,#AC,#0D,#CC,#01,#C1
    DB #01,#EB,#01,#FF,#01,#BB,#01,#B7,#03,#77,#02,#E7,#01,#77,#01,#7E
    DB #01,#E5,#01,#55,#01,#45,#01,#55,#05,#44,#01,#45,#01,#44,#01,#EE
    DB #01,#C1,#01,#11,#01,#1C,#01,#EE,#01,#CC,#03,#11,#01,#57,#08,#44
    DB #01,#E4,#01,#44,#01,#41,#01,#11,#01,#14,#04,#44,#01,#D4,#05,#44
    DB #01,#DF,#01,#E4,#02,#DD,#01,#41,#03,#44,#01,#14,#0D,#44,#01,#4E
    DB #01,#1A,#01,#AA,#01,#AB,#01,#13,#08,#EE,#01,#EB,#06,#BB,#01,#FF
    DB #01,#FE,#01,#1E,#01,#22,#01,#11,#01,#1F,#02,#AA,#01,#BB,#06,#AA
    DB #01,#AC,#0A,#CC,#01,#C1,#01,#CC,#01,#C2,#01,#2C,#01,#C1,#01,#EA
    DB #01,#FE,#01,#FB,#01,#BB,#03,#77,#01,#7E,#03,#EE,#01,#E5,#03,#55
    DB #01,#54,#01,#44,#01,#54,#03,#44,#01,#4C,#01,#41,#04,#11,#01,#CC
    DB #01,#C1,#03,#11,#08,#44,#01,#41,#01,#14,#02,#11,#01,#14,#04,#44
    DB #01,#41,#07,#44,#03,#DD,#01,#D4,#01,#44,#01,#41,#01,#E4,#0E,#44
    DB #01,#EB,#01,#1A,#01,#AA,#02,#AB,#06,#EE,#01,#FB,#06,#BB,#01,#BF
    DB #01,#FE,#01,#1B,#01,#21,#01,#A2,#01,#2C,#01,#EB,#01,#AA,#01,#BF
    DB #01,#BA,#06,#AA,#0D,#CC,#02,#AA,#01,#AB,#01,#1A,#01,#A1,#02,#FF
    DB #01,#B7,#01,#F7,#01,#77,#04,#EE,#01,#E5,#01,#55,#01,#E5,#02,#55
    DB #01,#44,#01,#54,#04,#44,#01,#E3,#01,#A1,#03,#11,#01,#2B,#01,#2C
    DB #03,#11,#01,#14,#08,#44,#01,#D1,#02,#11,#02,#44,#01,#47,#01,#44
    DB #02,#11,#01,#14,#07,#44,#01,#4D,#02,#DD,#01,#D4,#01,#11,#01,#E4
    DB #0B,#44,#04,#EE,#01,#31,#01,#2A,#01,#AA,#01,#AB,#01,#C2,#06,#EE
    DB #05,#BB,#01,#BF,#01,#F1,#01,#1A,#02,#22,#01,#1E,#01,#21,#01,#FB
    DB #01,#BF,#01,#FF,#06,#AA,#01,#A1,#01,#1C,#02,#CC,#01,#C2,#01,#CC
    DB #01,#C2,#04,#CC,#01,#1C,#02,#CC,#01,#2A,#01,#AB,#01,#BB,#01,#F1
    DB #01,#1F,#04,#FF,#02,#77,#02,#EE,#01,#E5,#03,#55,#01,#45,#01,#55
    DB #01,#45,#01,#47,#01,#44,#01,#54,#01,#E4,#02,#44,#02,#C1,#01,#1C
    DB #01,#C2,#01,#AB,#01,#2C,#01,#1C,#01,#A1,#02,#11,#01,#4E,#0C,#44
    DB #01,#F4,#01,#44,#03,#11,#01,#14,#07,#44,#01,#14,#01,#4D,#01,#D1
    DB #01,#14,#01,#9E,#0E,#44,#01,#4E,#01,#EE,#01,#B1,#03,#AA,#01,#F1
    DB #01,#AB,#01,#BE,#02,#EE,#06,#BB,#01,#A1,#01,#FA,#01,#A2,#02,#22
    DB #01,#21,#01,#1F,#01,#BF,#01,#FF,#01,#FB,#06,#AA,#01,#1C,#01,#22
    DB #01,#C2,#05,#22,#06,#CC,#01,#CA,#02,#BB,#01,#BC,#01,#BF,#05,#FF
    DB #01,#FB,#02,#EE,#01,#E5,#01,#55,#01,#5E,#01,#54,#03,#44,#01,#75
    DB #06,#44,#01,#42,#01,#CC,#01,#BB,#01,#BF,#01,#FB,#01,#C1,#01,#11
    DB #01,#CB,#01,#C1,#01,#11,#01,#14,#0D,#44,#03,#11,#08,#44,#01,#E4
    DB #01,#44,#01,#41,#01,#14,#01,#FD,#0C,#44,#01,#4E,#02,#44,#01,#5E
    DB #01,#EE,#01,#B1,#03,#AA,#01,#AF,#01,#FB,#01,#AB,#04,#BB,#01,#B2
    DB #01,#1F,#01,#FB,#01,#AA,#01,#A2,#04,#22,#01,#1F,#01,#BF,#01,#FF
    DB #01,#FA,#05,#AA,#01,#A1,#02,#11,#01,#2A,#04,#AA,#01,#21,#01,#11
    DB #01,#1C,#05,#CC,#03,#BB,#01,#1F,#03,#FF,#01,#B7,#02,#77,#01,#FF
    DB #01,#77,#01,#E5,#03,#55,#0B,#44,#01,#43,#01,#3B,#01,#BB,#01,#3B
    DB #01,#CC,#01,#C4,#02,#CC,#0C,#44,#01,#41,#01,#14,#01,#44,#02,#11
    DB #01,#14,#06,#44,#01,#41,#01,#44,#01,#14,#01,#EE,#01,#11,#01,#41
    DB #02,#44,#01,#D4,#0D,#44,#01,#5E,#02,#EE,#01,#B1,#01,#1A,#03,#AA
    DB #01,#AB,#01,#BF,#02,#FF,#01,#FB,#01,#BA,#03,#AA,#01,#A2,#03,#22
    DB #01,#21,#01,#FB,#02,#FF,#06,#AA,#01,#11,#01,#1E,#05,#FF,#01,#FB
    DB #01,#11,#01,#1C,#06,#CC,#01,#2A,#02,#BB,#01,#FB,#03,#FF,#01,#FB
    DB #05,#77,#01,#E7,#01,#E5,#01,#55,#01,#54,#0A,#44,#01,#77,#03,#33
    DB #01,#44,#01,#C4,#0E,#44,#01,#41,#01,#14,#01,#44,#01,#11,#01,#14
    DB #06,#44,#01,#14,#02,#11,#01,#14,#03,#44,#01,#4E,#0E,#44,#01,#55
    DB #01,#5E,#03,#EE,#01,#EB,#01,#11,#0C,#AA,#01,#22,#01,#AA,#01,#11
    DB #01,#E1,#02,#FF,#01,#FB,#05,#AA,#01,#A1,#01,#BF,#08,#FF,#01,#F1
    DB #01,#12,#05,#CC,#01,#CB,#02,#BB,#01,#BA,#03,#FF,#01,#FB,#01,#B7
    DB #03,#77,#01,#7E,#01,#EE,#01,#77,#01,#E5,#01,#5E,#01,#54,#01,#74
    DB #07,#44,#01,#47,#01,#7E,#01,#77,#01,#7E,#01,#34,#0C,#44,#01,#54
    DB #0D,#44,#02,#41,#02,#11,#01,#41,#01,#11,#02,#44,#01,#4E,#0E,#44
    DB #01,#45,#04,#EE,#01,#EB,#01,#BB,#01,#BA,#01,#11,#09,#AA,#01,#A1
    DB #01,#11,#01,#BF,#01,#FF,#01,#1F,#02,#FF,#01,#FA,#05,#AA,#01,#1B
    DB #0A,#FF,#01,#F1,#06,#CC,#01,#AB,#01,#BB,#01,#BF,#01,#CB,#01,#BB
    DB #01,#BF,#01,#FF,#06,#77,#01,#55,#01,#5E,#01,#75,#02,#55,#01,#54
    DB #01,#44,#01,#45,#01,#44,#01,#45,#02,#44,#01,#5E,#02,#EE,#01,#E7
    DB #01,#E4,#07,#44,#01,#54,#01,#44,#01,#74,#01,#44,#01,#4F,#0F,#44
    DB #01,#11,#01,#BC,#01,#A1,#01,#BE,#03,#44,#01,#DD,#01,#F4,#0C,#44
    DB #01,#45,#02,#55,#03,#EE,#01,#EB,#01,#BB,#01,#BE,#01,#EB,#01,#BB
    DB #01,#AC,#05,#11,#01,#12,#03,#BB,#02,#FF,#01,#CF,#02,#FF,#05,#AA
    DB #01,#A1,#01,#BF,#01,#FF,#02,#BF,#08,#FF,#01,#C1,#01,#2C,#01,#CC
    DB #02,#C2,#01,#2C,#01,#AB,#03,#BB,#01,#B7,#02,#77,#01,#FF,#04,#77
    DB #01,#75,#01,#7E,#02,#55,#01,#75,#04,#55,#03,#44,#01,#45,#01,#55
    DB #03,#EE,#01,#E4,#08,#44,#01,#E4,#03,#44,#01,#14,#05,#44,#01,#41
    DB #04,#44,#01,#4D,#02,#44,#01,#4E,#01,#14,#01,#11,#01,#14,#01,#12
    DB #01,#BE,#01,#B4,#01,#44,#01,#49,#01,#FE,#0A,#44,#01,#19,#01,#E4
    DB #0D,#EE,#07,#BB,#02,#FF,#01,#F1,#02,#FF,#01,#FB,#05,#AA,#01,#1B
    DB #01,#FF,#01,#FB,#02,#BF,#09,#FF,#01,#12,#01,#22,#01,#CC,#01,#C2
    DB #01,#22,#01,#2B,#02,#BB,#01,#B1,#01,#F7,#03,#77,#01,#FF,#01,#F7
    DB #02,#77,#09,#55,#01,#54,#02,#44,#01,#45,#04,#55,#09,#44,#01,#E4
    DB #02,#44,#01,#41,#01,#14,#05,#44,#01,#11,#07,#44,#03,#11,#01,#44
    DB #02,#11,#01,#44,#01,#41,#01,#44,#01,#DE,#09,#44,#01,#41,#01,#11
    DB #01,#99,#01,#9E,#07,#EE,#01,#7E,#05,#EE,#01,#BE,#04,#BB,#01,#BF
    DB #02,#FF,#01,#BC,#02,#FF,#01,#FA,#04,#AA,#01,#A1,#01,#BF,#01,#FF
    DB #01,#FB,#02,#BB,#09,#FF,#01,#FC,#01,#12,#01,#22,#01,#2C,#01,#C2
    DB #01,#22,#02,#BB,#01,#BF,#01,#B7,#04,#77,#01,#7F,#01,#FE,#01,#77
    DB #01,#E5,#07,#55,#01,#54,#03,#44,#05,#55,#04,#44,#01,#45,#0D,#44
    DB #01,#9D,#01,#DD,#07,#44,#02,#11,#01,#14,#01,#41,#02,#44,#01,#41
    DB #01,#44,#01,#4A,#01,#C4,#07,#44,#01,#41,#01,#44,#01,#41,#01,#1E
    DB #01,#E9,#01,#91,#01,#EE,#01,#5E,#02,#EE,#01,#5E,#09,#EE,#03,#BB
    DB #01,#BF,#03,#FF,#01,#1F,#02,#FF,#01,#BB,#04,#AA,#01,#1B,#02,#FF
    DB #01,#BB,#01,#FB,#01,#BB,#01,#BF,#03,#FF,#01,#BF,#01,#FB,#03,#FF
    DB #01,#BB,#01,#B1,#04,#22,#03,#BB,#01,#AF,#07,#77,#01,#E7,#08,#55
    DB #01,#54,#01,#44,#01,#45,#05,#55,#03,#44,#01,#45,#05,#44,#01,#E4
    DB #07,#44,#01,#49,#01,#9D,#01,#DD,#03,#44,#01,#F4,#02,#44,#01,#41
    DB #02,#11,#01,#14,#04,#44,#01,#4E,#01,#EF,#01,#14,#03,#44,#01,#41
    DB #02,#44,#01,#41,#02,#44,#02,#11,#01,#D9,#01,#DE,#01,#19,#01,#F5
    DB #03,#55,#01,#5E,#07,#EE,#01,#E7,#02,#BB,#01,#BF,#03,#FF,#01,#FE
    DB #01,#EF,#01,#FB,#01,#FF,#01,#BA,#03,#AA,#01,#A1,#01,#AF,#01,#FF
    DB #01,#FB,#02,#BB,#02,#BF,#03,#FF,#01,#BF,#04,#FF,#01,#BF,#01,#FF
    DB #01,#12,#03,#22,#01,#AB,#02,#BB,#01,#FC,#01,#B7,#07,#77,#01,#75
    DB #08,#55,#01,#54,#05,#55,#01,#54,#09,#44,#01,#E4,#01,#45,#06,#44
    DB #01,#9D,#01,#99,#01,#1D,#01,#DD,#01,#D4,#04,#44,#03,#11,#02,#14
    DB #05,#44,#01,#F4,#08,#44,#01,#41,#02,#11,#01,#49,#01,#9D,#01,#61
    DB #01,#99,#01,#E5,#03,#55,#07,#EE,#02,#BB,#01,#BF,#02,#FF,#01,#FB
    DB #01,#BB,#01,#F1,#01,#FF,#01,#AF,#01,#FB,#01,#BB,#03,#AA,#01,#CE
    DB #02,#FF,#01,#FB,#03,#BB,#01,#BF,#03,#FF,#01,#BB,#01,#FB,#01,#BB
    DB #02,#FF,#02,#FB,#01,#BB,#01,#1A,#01,#22,#01,#2A,#01,#AA,#02,#BB
    DB #01,#BE,#01,#F7,#08,#77,#01,#7E,#0C,#55,#01,#45,#01,#54,#01,#44
    DB #01,#45,#07,#44,#01,#E1,#03,#44,#01,#45,#03,#44,#01,#D9,#01,#96
    DB #01,#11,#01,#44,#01,#41,#03,#44,#01,#14,#03,#11,#01,#44,#01,#11
    DB #04,#44,#01,#4E,#01,#49,#01,#F4,#07,#44,#03,#11,#01,#1E,#01,#DD
    DB #01,#D9,#01,#99,#01,#9E,#02,#55,#01,#E5,#01,#5E,#01,#EE,#01,#7E
    DB #02,#EE,#01,#EF,#01,#7E,#01,#EE,#01,#BF,#02,#FF,#01,#FB,#02,#BB
    DB #01,#1B,#01,#FB,#01,#AA,#01,#BA,#03,#AA,#01,#AC,#01,#1F,#02,#FF
    DB #04,#BB,#01,#BF,#03,#FF,#01,#BB,#01,#FB,#04,#FF,#01,#FB,#01,#BB
    DB #01,#F1,#02,#2A,#01,#AA,#02,#BB,#01,#BF,#01,#1B,#07,#77,#01,#75
    DB #01,#77,#01,#7E,#05,#55,#01,#5E,#05,#55,#01,#54,#0D,#44,#01,#45
    DB #01,#54,#02,#44,#01,#4D,#01,#91,#01,#D1,#01,#11,#01,#44,#01,#11
    DB #01,#45,#01,#55,#01,#44,#01,#41,#03,#11,#01,#41,#01,#2B,#01,#BA
    DB #01,#14,#01,#41,#02,#44,#01,#49,#01,#F4,#07,#44,#04,#11,#01,#9D
    DB #01,#DD,#01,#D9,#01,#99,#04,#55,#01,#EE,#01,#7E,#04,#EE,#01,#BF
    DB #02,#FF,#01,#FB,#03,#BB,#01,#1B,#01,#B1,#01,#22,#01,#2A,#03,#AA
    DB #01,#A1,#02,#FF,#01,#FB,#04,#BB,#01,#BF,#03,#FF,#01,#BB,#01,#FB
    DB #04,#FF,#01,#FB,#02,#BB,#01,#1A,#02,#AA,#01,#AB,#03,#BB,#07,#77
    DB #02,#55,#01,#EE,#01,#77,#07,#55,#03,#44,#01,#55,#01,#45,#01,#54
    DB #02,#44,#01,#4E,#04,#44,#01,#4E,#01,#D4,#02,#44,#01,#45,#01,#44
    DB #01,#45,#01,#55,#01,#C1,#03,#11,#05,#44,#01,#14,#02,#11,#01,#14
    DB #01,#44,#02,#BB,#01,#1B,#01,#B1,#01,#11,#01,#41,#01,#4D,#01,#E4
    DB #01,#44,#01,#54,#04,#44,#05,#11,#01,#1D,#02,#DD,#01,#EC,#01,#45
    DB #01,#55,#01,#5E,#01,#EE,#01,#5E,#04,#EE,#02,#BB,#01,#BF,#01,#FB
    DB #03,#BB,#01,#B1,#01,#FA,#01,#AC,#03,#22,#01,#CA,#01,#AA,#01,#1F
    DB #02,#FF,#05,#BB,#01,#BF,#03,#FF,#01,#FB,#01,#FF,#01,#BF,#01,#FB
    DB #04,#FF,#01,#BB,#01,#F1,#03,#AA,#01,#A2,#01,#22,#01,#1B,#08,#77
    DB #03,#55,#01,#77,#01,#E5,#01,#5E,#06,#55,#01,#45,#02,#55,#01,#54
    DB #04,#44,#01,#45,#01,#54,#01,#44,#01,#49,#03,#44,#01,#45,#02,#55
    DB #01,#54,#04,#11,#04,#44,#01,#41,#02,#11,#02,#14,#01,#41,#01,#1E
    DB #01,#BB,#01,#AB,#01,#BA,#01,#B4,#01,#4E,#01,#E1,#05,#44,#08,#11
    DB #01,#6D,#01,#DD,#01,#D9,#01,#F5,#01,#5E,#01,#EE,#01,#E5,#01,#5E
    DB #03,#EE,#01,#BF,#01,#BB,#01,#BF,#01,#FB,#04,#BB,#01,#1B,#01,#AA
    DB #01,#AC,#02,#22,#01,#2C,#01,#AA,#01,#A1,#04,#FF,#04,#BB,#01,#BF
    DB #03,#FF,#01,#FB,#01,#FF,#01,#BF,#01,#FB,#04,#FF,#01,#FB,#01,#B1
    DB #01,#AA,#01,#2A,#01,#2C,#01,#22,#01,#2A,#01,#1B,#06,#77,#06,#55
    DB #01,#EE,#01,#E5,#07,#55,#01,#54,#01,#55,#06,#44,#01,#45,#01,#55
    DB #01,#FD,#02,#44,#01,#45,#04,#55,#04,#11,#01,#54,#04,#44,#02,#11
    DB #01,#41,#01,#44,#01,#11,#03,#44,#01,#CB,#01,#A4,#01,#41,#01,#19
    DB #01,#44,#01,#45,#01,#55,#02,#44,#01,#41,#08,#11,#02,#1E,#01,#E4
    DB #01,#55,#01,#5E,#04,#EE,#01,#EB,#01,#BF,#01,#BB,#01,#FB,#02,#BB
    DB #01,#7B,#02,#BB,#01,#1A,#01,#AA,#01,#A2,#03,#22,#01,#AA,#01,#1F
    DB #03,#FF,#05,#BB,#03,#FF,#01,#BF,#01,#FB,#01,#FF,#01,#BB,#01,#FF
    DB #01,#BB,#03,#FF,#01,#BB,#01,#BC,#01,#A2,#03,#22,#01,#C2,#01,#F7
    DB #06,#77,#08,#55,#01,#E5,#06,#55,#01,#45,#01,#54,#04,#44,#01,#14
    DB #01,#45,#02,#55,#01,#4D,#02,#44,#01,#45,#03,#55,#01,#54,#04,#11
    DB #01,#44,#01,#41,#02,#44,#01,#41,#04,#11,#05,#44,#01,#14,#01,#4E
    DB #01,#1E,#01,#44,#01,#54,#01,#4E,#01,#E5,#02,#44,#01,#41,#09,#11
    DB #01,#19,#01,#EE,#01,#E5,#04,#EE,#03,#BB,#03,#77,#01,#F7,#01,#77
    DB #01,#B1,#01,#BA,#01,#AA,#01,#A2,#03,#22,#01,#A1,#01,#BF,#02,#FF
    DB #01,#FB,#02,#FF,#01,#FB,#02,#BB,#03,#FF,#01,#BF,#02,#FF,#01,#BB
    DB #01,#FF,#01,#BF,#04,#FF,#01,#2A,#04,#22,#01,#21,#07,#77,#01,#75
    DB #02,#55,#01,#75,#01,#55,#01,#5E,#03,#55,#01,#E5,#05,#55,#01,#54
    DB #02,#44,#01,#54,#01,#44,#01,#4E,#01,#44,#03,#55,#02,#4B,#01,#BE
    DB #01,#45,#03,#55,#01,#5D,#01,#D1,#03,#11,#01,#44,#01,#41,#01,#44
    DB #01,#41,#01,#14,#01,#44,#01,#41,#03,#11,#01,#EB,#01,#14,#01,#41
    DB #02,#44,#01,#49,#01,#14,#01,#55,#01,#54,#01,#55,#01,#E4,#02,#55
    DB #01,#41,#01,#11,#01,#14,#07,#11,#01,#1E,#01,#55,#04,#EE,#01,#7B
    DB #01,#BB,#01,#BE,#03,#77,#01,#7E,#01,#77,#01,#7B,#01,#1F,#02,#AA
    DB #01,#A2,#03,#22,#01,#AE,#06,#FF,#01,#BB,#01,#FB,#01,#BB,#08,#FF
    DB #01,#BB,#03,#FF,#01,#FB,#01,#12,#04,#22,#01,#AB,#08,#77,#09,#55
    DB #01,#5E,#03,#55,#01,#5D,#05,#55,#01,#F4,#01,#44,#01,#45,#02,#55
    DB #01,#E4,#02,#44,#01,#45,#01,#54,#02,#55,#01,#5D,#01,#41,#03,#11
    DB #02,#41,#01,#11,#01,#14,#01,#41,#04,#11,#01,#14,#01,#44,#01,#41
    DB #03,#44,#01,#DD,#01,#95,#01,#55,#01,#44,#01,#54,#01,#45,#02,#55
    DB #04,#44,#06,#11,#01,#E5,#01,#5E,#03,#EE,#01,#EB,#01,#BB,#01,#BE
    DB #01,#EE,#02,#77,#01,#F7,#01,#E7,#01,#77,#01,#7B,#01,#EA,#02,#AA
    DB #03,#22,#01,#2A,#01,#1F,#07,#FF,#01,#FB,#01,#BF,#07,#FF,#01,#BF
    DB #01,#FB,#03,#FF,#01,#FB,#05,#22,#01,#17,#08,#77,#01,#75,#0A,#55
    DB #01,#EE,#01,#ED,#05,#55,#01,#5E,#03,#44,#02,#55,#03,#44,#04,#55
    DB #01,#5D,#02,#41,#06,#11,#01,#44,#04,#11,#01,#14,#03,#44,#01,#11
    DB #01,#14,#01,#E9,#01,#D5,#06,#55,#01,#41,#01,#14,#01,#44,#01,#14
    DB #05,#11,#01,#E5,#01,#55,#03,#EE,#01,#E7,#01,#77,#01,#BE,#01,#EE
    DB #01,#E7,#05,#77,#01,#F1,#03,#AA,#01,#A2,#02,#22,#01,#21,#05,#FF
    DB #02,#FB,#01,#FF,#01,#BF,#0D,#FF,#01,#F1,#04,#22,#01,#2A,#01,#E7
    DB #08,#77,#01,#75,#06,#55,#01,#5F,#01,#55,#01,#5E,#01,#E5,#07,#55
    DB #01,#5E,#01,#B4,#02,#44,#03,#55,#02,#44,#01,#55,#01,#5D,#01,#45
    DB #01,#55,#01,#56,#01,#11,#01,#1E,#06,#11,#01,#14,#01,#44,#01,#41
    DB #02,#11,#01,#14,#05,#44,#01,#4D,#01,#DF,#02,#55,#01,#54,#03,#55
    DB #01,#54,#01,#41,#01,#44,#05,#11,#01,#1D,#01,#E5,#04,#EE,#01,#77
    DB #01,#7E,#01,#EE,#01,#E7,#01,#77,#01,#7F,#03,#77,#01,#7B,#01,#1B
    DB #06,#AA,#01,#1F,#11,#FF,#01,#F7,#04,#FF,#01,#F2,#04,#22,#01,#21
    DB #01,#F7,#08,#77,#12,#55,#01,#54,#02,#44,#01,#45,#03,#55,#01,#E4
    DB #01,#44,#01,#55,#01,#D4,#01,#14,#01,#45,#01,#55,#0D,#11,#01,#44
    DB #01,#41,#01,#44,#01,#B4,#02,#44,#01,#D4,#01,#4D,#02,#55,#01,#51
    DB #04,#55,#01,#54,#01,#11,#01,#41,#03,#11,#02,#14,#03,#EE,#01,#E4
    DB #01,#4F,#01,#FE,#01,#EE,#07,#77,#01,#7C,#01,#EA,#05,#AA,#01,#AC
    DB #01,#BF,#11,#FF,#01,#77,#04,#FF,#01,#12,#04,#22,#01,#AC,#01,#F7
    DB #09,#77,#12,#55,#02,#44,#01,#45,#03,#55,#01,#EE,#01,#44,#01,#55
    DB #01,#D4,#01,#14,#01,#45,#01,#55,#01,#51,#03,#11,#01,#14,#08,#11
    DB #01,#41,#01,#44,#01,#4C,#02,#44,#01,#14,#01,#44,#01,#41,#01,#94
    DB #01,#44,#01,#4E,#01,#F9,#04,#55,#02,#11,#01,#14,#01,#44,#01,#41
    DB #01,#11,#04,#EE,#01,#E4,#01,#44,#01,#4E,#01,#7E,#03,#77,#01,#F7
    DB #03,#77,#01,#B1,#06,#AA,#01,#AC,#07,#FF,#01,#77,#01,#7F,#09,#FF
    DB #01,#77,#01,#7F,#03,#FF,#01,#12,#04,#22,#01,#2F,#0A,#77,#01,#75
    DB #0D,#55,#01,#EE,#01,#44,#02,#55,#03,#44,#03,#55,#01,#EE,#01,#4E
    DB #01,#54,#02,#44,#01,#45,#02,#55,#02,#11,#01,#44,#09,#11,#01,#14
    DB #04,#44,#02,#4D,#01,#F4,#03,#44,#01,#4D,#01,#F9,#03,#55,#01,#51
    DB #01,#11,#01,#44,#01,#11,#01,#4E,#01,#55,#02,#EE,#01,#E7,#01,#EE
    DB #01,#E4,#01,#44,#01,#4E,#01,#E7,#06,#77,#01,#7F,#01,#1B,#06,#AA
    DB #01,#1F,#05,#FF,#01,#F7,#01,#77,#01,#7F,#01,#77,#09,#FF,#01,#F7
    DB #01,#7F,#02,#FF,#01,#F1,#01,#A2,#04,#22,#01,#1F,#0B,#77,#0C,#55
    DB #01,#FD,#02,#44,#01,#45,#01,#55,#03,#44,#01,#55,#01,#54,#01,#55
    DB #01,#E4,#01,#44,#01,#55,#02,#44,#01,#45,#01,#55,#01,#5B,#01,#ED
    DB #01,#14,#01,#EE,#04,#11,#01,#14,#04,#11,#01,#44,#01,#E4,#02,#44
    DB #02,#41,#01,#44,#01,#F4,#04,#44,#01,#4E,#01,#F5,#05,#55,#01,#5E
    DB #03,#55,#01,#EE,#01,#E7,#01,#77,#01,#E7,#01,#7E,#01,#E7,#04,#77
    DB #01,#F7,#02,#77,#01,#B1,#01,#FA,#05,#AA,#01,#A1,#06,#FF,#01,#F7
    DB #03,#77,#07,#FF,#01,#F7,#01,#FF,#01,#F7,#01,#77,#02,#FF,#01,#F1
    DB #04,#22,#01,#2B,#01,#E7,#0D,#77,#01,#57,#08,#55,#01,#5F,#01,#F4
    DB #03,#44,#01,#55,#01,#D4,#02,#44,#01,#55,#02,#54,#01,#4C,#01,#44
    DB #01,#45,#01,#54,#01,#44,#01,#45,#01,#55,#01,#5D,#01,#D4,#01,#4D
    DB #01,#44,#03,#11,#02,#14,#03,#11,#01,#14,#01,#11,#01,#41,#01,#14
    DB #02,#41,#01,#14,#01,#44,#02,#14,#01,#4C,#01,#EA,#01,#C4,#01,#44
    DB #01,#EF,#08,#55,#01,#5E,#01,#E5,#01,#DE,#01,#7E,#05,#77,#01,#7F
    DB #01,#F7,#03,#77,#01,#CE,#06,#AA,#01,#1F,#05,#FF,#02,#F7,#02,#77
    DB #01,#7F,#09,#FF,#01,#F7,#01,#77,#02,#FF,#01,#1B,#04,#22,#01,#21
    DB #01,#F7,#0C,#77,#01,#7F,#01,#77,#01,#55,#01,#5E,#01,#94,#05,#55
    DB #01,#7E,#01,#E4,#03,#44,#01,#45,#01,#D4,#02,#44,#01,#55,#01,#5F
    DB #01,#D4,#02,#44,#01,#45,#01,#54,#01,#44,#01,#45,#01,#55,#01,#D4
    DB #01,#44,#01,#4D,#01,#44,#08,#11,#01,#14,#02,#41,#03,#44,#01,#41
    DB #02,#11,#01,#CB,#01,#C1,#02,#11,#01,#C4,#01,#EF,#01,#E5,#03,#55
    DB #01,#45,#01,#DE,#01,#EE,#01,#45,#01,#EE,#02,#E7,#04,#77,#02,#7E
    DB #04,#77,#01,#7B,#01,#1B,#05,#AA,#01,#AB,#01,#CF,#06,#FF,#01,#77
    DB #01,#FF,#01,#7F,#0B,#FF,#01,#77,#01,#7F,#01,#FF,#01,#1C,#04,#22
    DB #01,#B1,#01,#FF,#0E,#77,#01,#7E,#01,#9D,#01,#D4,#01,#44,#04,#55
    DB #01,#D4,#04,#44,#01,#4E,#01,#D4,#02,#44,#01,#55,#01,#94,#01,#41
    DB #03,#44,#01,#5E,#02,#44,#01,#5D,#01,#DD,#01,#44,#01,#D4,#01,#41
    DB #04,#11,#01,#41,#01,#14,#03,#11,#01,#E4,#04,#44,#02,#11,#01,#E1
    DB #02,#11,#01,#2A,#01,#14,#01,#41,#01,#1D,#01,#D5,#04,#55,#01,#ED
    DB #03,#EE,#01,#E5,#01,#EE,#01,#E7,#03,#77,#01,#7E,#01,#E7,#04,#77
    DB #01,#F1,#01,#FA,#05,#AA,#01,#B1,#06,#FF,#02,#7F,#0D,#FF,#01,#F7
    DB #01,#7F,#01,#FC,#01,#F2,#04,#22,#01,#EF,#01,#FF,#01,#F7,#08,#77
    DB #02,#7F,#03,#77,#01,#E9,#01,#99,#02,#44,#03,#55,#01,#5F,#04,#44
    DB #01,#41,#01,#47,#01,#44,#01,#D4,#01,#44,#01,#5D,#01,#44,#01,#EE
    DB #06,#44,#01,#41,#01,#91,#01,#4D,#01,#44,#01,#11,#01,#44,#02,#11
    DB #01,#41,#02,#44,#02,#11,#01,#44,#01,#14,#03,#44,#01,#11,#02,#44
    DB #03,#11,#01,#44,#01,#9B,#01,#1C,#01,#44,#01,#45,#02,#55,#01,#54
    DB #02,#5E,#01,#7E,#02,#EE,#01,#55,#01,#44,#01,#DD,#01,#7E,#02,#F7
    DB #01,#7F,#04,#77,#01,#7F,#01,#1F,#06,#AA,#01,#1F,#17,#FF,#01,#F1
    DB #01,#A2,#03,#22,#01,#2B,#01,#1F,#01,#FF,#01,#F7,#0C,#77,#01,#7E
    DB #01,#DD,#03,#44,#03,#55,#01,#54,#01,#44,#01,#4B,#01,#44,#01,#E4
    DB #01,#44,#01,#45,#03,#44,#01,#5D,#02,#44,#01,#EE,#02,#44,#01,#45
    DB #01,#4E,#01,#99,#01,#91,#01,#11,#01,#14,#01,#D4,#01,#4D,#01,#E4
    DB #04,#11,#01,#44,#02,#11,#07,#44,#01,#41,#03,#11,#01,#44,#01,#DF
    DB #01,#11,#01,#45,#03,#55,#01,#D4,#01,#DE,#02,#EE,#01,#E5,#01,#EE
    DB #01,#55,#01,#E4,#01,#44,#01,#E7,#01,#7F,#06,#77,#01,#F1,#01,#BF
    DB #06,#AA,#01,#CF,#17,#FF,#01,#1F,#01,#C2,#03,#22,#01,#2F,#01,#CF
    DB #02,#FF,#0C,#77,#01,#7E,#03,#44,#01,#47,#02,#77,#01,#75,#01,#5E
    DB #01,#E4,#01,#EB,#02,#E4,#01,#B4,#03,#44,#01,#D4,#03,#44,#01,#D4
    DB #02,#44,#01,#41,#01,#99,#01,#9D,#01,#DD,#02,#11,#01,#1D,#02,#44
    DB #01,#D1,#02,#11,#01,#14,#01,#44,#01,#14,#01,#41,#05,#44,#01,#E4
    DB #01,#44,#01,#41,#03,#11,#01,#44,#01,#DE,#01,#45,#04,#55,#01,#54
    DB #03,#EE,#01,#4E,#03,#EE,#01,#4E,#01,#E7,#06,#77,#01,#7F,#01,#E1
    DB #01,#FA,#05,#AA,#01,#F1,#18,#FF,#01,#1F,#04,#22,#01,#BE,#03,#FF
    DB #01,#F7,#0C,#77,#03,#44,#04,#77,#01,#7E,#01,#E4,#01,#D4,#01,#E4
    DB #04,#44,#01,#D4,#02,#44,#01,#14,#03,#44,#01,#4F,#01,#4D,#02,#DD
    DB #01,#D1,#03,#11,#02,#44,#01,#D1,#02,#11,#01,#41,#01,#D1,#01,#14
    DB #08,#44,#01,#4F,#01,#11,#01,#1B,#01,#11,#01,#44,#01,#4D,#01,#4E
    DB #03,#55,#03,#44,#01,#DE,#01,#EB,#01,#9F,#01,#EE,#01,#E7,#01,#77
    DB #01,#EE,#01,#E7,#02,#77,#01,#E7,#03,#77,#01,#FF,#01,#1F,#01,#BA
    DB #04,#AA,#01,#AB,#01,#1F,#05,#FF,#01,#99,#01,#9F,#02,#FF,#01,#E6
    DB #01,#EF,#0C,#FF,#01,#FC,#01,#FA,#04,#22,#01,#F1,#05,#FF,#01,#F7
    DB #05,#77,#01,#F7,#04,#77,#01,#74,#01,#4E,#01,#E7,#01,#77,#01,#7E
    DB #02,#77,#01,#7E,#01,#DD,#05,#44,#01,#4D,#01,#DD,#01,#41,#01,#14
    DB #03,#44,#01,#4F,#01,#9D,#03,#DD,#01,#1D,#04,#11,#02,#44,#01,#11
    DB #01,#44,#01,#11,#01,#1D,#01,#DD,#09,#44,#01,#11,#01,#1C,#01,#11
    DB #01,#44,#01,#D4,#02,#DD,#01,#EE,#01,#74,#05,#44,#01,#4E,#01,#99
    DB #01,#E7,#01,#77,#01,#E4,#01,#E7,#02,#77,#01,#7E,#02,#77,#01,#7F
    DB #01,#F1,#01,#FF,#05,#AA,#01,#AB,#01,#1F,#02,#FF,#01,#E9,#01,#F9
    DB #02,#99,#01,#F9,#01,#99,#01,#F6,#01,#66,#01,#6E,#0C,#FF,#01,#BC
    DB #01,#F2,#03,#22,#01,#2B,#01,#F1,#09,#FF,#04,#77,#01,#E9,#01,#E4
    DB #04,#77,#01,#5E,#03,#77,#01,#D4,#03,#44,#01,#41,#02,#44,#01,#DD
    DB #01,#44,#01,#4C,#03,#44,#01,#4F,#01,#F9,#01,#DD,#01,#14,#03,#DD
    DB #04,#11,#01,#14,#02,#44,#01,#41,#01,#1D,#01,#14,#02,#DD,#02,#D4
    DB #05,#44,#02,#11,#01,#BE,#01,#14,#01,#44,#01,#D4,#01,#D7,#01,#77
    DB #01,#47,#01,#E4,#07,#44,#01,#E9,#01,#77,#01,#7E,#01,#E7,#04,#77
    DB #01,#7F,#01,#FF,#01,#1F,#01,#FF,#04,#AA,#01,#A2,#01,#B1,#02,#FF
    DB #01,#FE,#01,#EE,#04,#99,#03,#66,#01,#69,#01,#EF,#06,#FF,#01,#EF
    DB #01,#FE,#01,#EF,#02,#FF,#01,#1F,#01,#C2,#03,#22,#01,#1A,#01,#BB
    DB #01,#C1,#01,#FF,#01,#FC,#01,#11,#01,#CF,#03,#FF,#01,#BA,#01,#2F
    DB #03,#77,#01,#DE,#01,#44,#02,#77,#01,#75,#01,#77,#01,#7E,#01,#D4
    DB #01,#47,#01,#77,#01,#D4,#01,#DD,#01,#E4,#01,#44,#01,#41,#01,#44
    DB #01,#4D,#01,#DD,#02,#44,#01,#14,#01,#44,#01,#E9,#01,#9F,#01,#D6
    DB #02,#11,#02,#DD,#01,#D6,#05,#11,#01,#44,#01,#41,#02,#11,#01,#D1
    DB #03,#DD,#01,#D4,#05,#44,#02,#11,#01,#B1,#01,#14,#02,#44,#01,#47
    DB #01,#77,#01,#47,#01,#74,#08,#44,#01,#E7,#02,#77,#01,#E7,#02,#77
    DB #02,#FF,#01,#F1,#01,#FB,#02,#BB,#01,#AA,#01,#A2,#01,#CA,#01,#AB
    DB #01,#B1,#02,#FF,#01,#9E,#01,#EE,#01,#E6,#01,#66,#01,#6E,#01,#96
    DB #03,#66,#01,#6E,#01,#EE,#04,#FF,#01,#F9,#01,#FF,#01,#99,#02,#EE
    DB #01,#BB,#01,#F1,#01,#F2,#01,#C2,#03,#22,#01,#2C,#01,#CC,#01,#BB
    DB #01,#CE,#01,#FB,#03,#BB,#01,#BF,#02,#FF,#01,#FA,#01,#CF,#02,#77
    DB #01,#E4,#01,#47,#03,#77,#01,#7F,#01,#FD,#03,#44,#01,#D4,#01,#4E
    DB #03,#44,#01,#14,#05,#44,#01,#4E,#01,#99,#01,#D9,#01,#61,#01,#11
    DB #04,#DD,#04,#11,#02,#44,#04,#11,#01,#4D,#03,#DD,#05,#44,#02,#11
    DB #01,#41,#01,#14,#01,#44,#01,#4D,#01,#44,#01,#D4,#01,#47,#01,#E4
    DB #03,#44,#02,#4E,#01,#44,#02,#4E,#01,#E7,#03,#77,#01,#7F,#02,#FF
    DB #01,#B1,#01,#1F,#02,#FF,#01,#BA,#02,#AA,#01,#A2,#01,#2B,#01,#B1
    DB #01,#FF,#01,#AE,#01,#EE,#01,#E6,#02,#66,#02,#11,#01,#66,#01,#61
    DB #01,#66,#01,#6E,#01,#EE,#01,#E9,#02,#FF,#01,#F9,#01,#9E,#03,#EE
    DB #01,#EA,#01,#AA,#01,#1B,#01,#B2,#05,#22,#01,#C2,#01,#AB,#03,#BB
    DB #01,#AA,#01,#AB,#01,#BB,#01,#FF,#01,#FB,#01,#BF,#01,#F1,#01,#F7
    DB #04,#77,#01,#E7,#01,#77,#01,#ED,#01,#DD,#03,#44,#01,#D4,#04,#44
    DB #01,#14,#01,#4D,#01,#D4,#01,#44,#01,#E4,#01,#44,#01,#4D,#01,#9D
    DB #01,#DD,#01,#11,#02,#DD,#01,#D4,#01,#DD,#05,#11,#01,#44,#06,#11
    DB #02,#1D,#01,#DD,#01,#D4,#03,#44,#01,#41,#01,#11,#01,#4E,#01,#A1
    DB #02,#44,#01,#14,#02,#44,#01,#4D,#04,#44,#01,#4E,#01,#E4,#01,#44
    DB #01,#4E,#01,#EE,#01,#F7,#01,#EE,#01,#E7,#01,#77,#01,#EE,#01,#FF
    DB #01,#E1,#03,#FF,#01,#BB,#01,#BA,#01,#BB,#01,#A2,#01,#2A,#01,#A2
    DB #01,#B1,#02,#BB,#01,#BF,#01,#F9,#02,#16,#01,#E9,#01,#FF,#01,#FE
    DB #01,#6E,#01,#99,#01,#9F,#01,#FF,#01,#99,#03,#FF,#01,#F9,#01,#69
    DB #02,#99,#01,#FF,#01,#FB,#01,#1F,#06,#22,#01,#2A,#01,#AB,#06,#22
    DB #03,#BB,#01,#BF,#01,#1F,#01,#F7,#03,#77,#01,#E7,#01,#77,#01,#99
    DB #01,#ED,#01,#EE,#01,#44,#01,#E4,#02,#44,#01,#D4,#04,#44,#01,#EE
    DB #01,#E4,#02,#44,#01,#9D,#06,#DD,#01,#D1,#0F,#11,#01,#1D,#01,#D4
    DB #02,#44,#01,#41,#01,#14,#01,#4B,#01,#11,#02,#44,#01,#14,#01,#44
    DB #02,#DD,#06,#44,#01,#11,#06,#99,#01,#BB,#01,#B1,#03,#FF,#01,#FB
    DB #01,#BB,#01,#BA,#01,#AA,#01,#AB,#01,#A2,#01,#22,#01,#BC,#01,#BB
    DB #01,#B9,#01,#99,#01,#9E,#01,#9D,#01,#D9,#01,#99,#01,#F9,#01,#99
    DB #01,#F9,#06,#99,#01,#FE,#03,#99,#01,#9F,#01,#FB,#01,#F1,#01,#F2
    DB #0E,#22,#01,#2A,#03,#BB,#01,#F1,#01,#FF,#04,#77,#01,#FE,#01,#DE
    DB #01,#E4,#01,#44,#01,#4E,#03,#44,#01,#EE,#05,#44,#01,#4E,#01,#44
    DB #01,#4D,#06,#DD,#01,#D1,#10,#11,#01,#D1,#01,#14,#04,#44,#01,#1E
    DB #01,#11,#01,#44,#01,#1E,#01,#E4,#01,#44,#01,#4F,#01,#E4,#05,#44
    DB #01,#41,#03,#11,#02,#99,#01,#96,#01,#9B,#01,#BE,#01,#1F,#01,#FB
    DB #01,#BF,#03,#BB,#03,#BA,#01,#AA,#01,#22,#01,#A1,#01,#B9,#05,#99
    DB #01,#9F,#03,#99,#02,#D9,#08,#99,#02,#9F,#01,#F1,#01,#F2,#0B,#22
    DB #01,#2C,#01,#CC,#01,#2C,#01,#22,#01,#CB,#03,#BB,#01,#1E,#01,#EB
    DB #01,#61,#01,#EE,#01,#47,#01,#DD,#01,#DE,#01,#E4,#01,#4E,#03,#44
    DB #01,#D4,#04,#44,#01,#4E,#01,#EE,#02,#44,#01,#4D,#06,#DD,#11,#11
    DB #01,#4D,#01,#DD,#02,#44,#01,#14,#01,#41,#01,#11,#01,#DD,#01,#D4
    DB #01,#41,#01,#44,#01,#14,#01,#44,#01,#4E,#01,#E4,#01,#44,#01,#D4
    DB #02,#44,#05,#11,#01,#16,#01,#E6,#01,#E9,#01,#CC,#01,#FB,#01,#AB
    DB #02,#BB,#01,#BA,#06,#AA,#01,#21,#01,#BB,#03,#99,#01,#6D,#01,#66
    DB #01,#DD,#01,#D9,#0A,#99,#01,#9D,#03,#99,#01,#1F,#01,#B2,#0B,#22
    DB #05,#CC,#03,#BB,#01,#1F,#03,#FF,#01,#F9,#01,#EE,#01,#44,#02,#EE
    DB #01,#44,#01,#4E,#01,#44,#01,#54,#01,#D4,#01,#44,#01,#45,#05,#44
    DB #05,#DD,#01,#D1,#01,#41,#10,#11,#01,#14,#01,#1D,#01,#DD,#01,#D4
    DB #01,#44,#03,#11,#01,#44,#01,#4D,#01,#44,#01,#41,#01,#14,#01,#44
    DB #01,#4E,#03,#44,#01,#E4,#01,#41,#05,#11,#01,#16,#01,#11,#01,#AC
    DB #01,#CB,#01,#BA,#0A,#AA,#01,#2C,#01,#1B,#01,#9E,#04,#99,#01,#9E
    DB #01,#61,#01,#E9,#01,#99,#01,#91,#01,#6D,#01,#9E,#01,#99,#01,#16
    DB #01,#61,#01,#6D,#01,#DD,#01,#D6,#01,#D9,#01,#99,#01,#9B,#01,#1F
    DB #0C,#22,#05,#CC,#01,#2A,#01,#AA,#01,#AB,#01,#AA,#01,#BF,#01,#F9
    DB #01,#9E,#01,#E1,#01,#6E,#01,#9F,#01,#FF,#01,#F9,#04,#FF,#01,#EE
    DB #02,#44,#01,#D4,#03,#44,#01,#4D,#04,#DD,#01,#D1,#01,#1D,#12,#11
    DB #01,#D4,#01,#DD,#01,#D4,#01,#44,#02,#11,#01,#14,#01,#44,#01,#55
    DB #01,#4D,#01,#41,#05,#44,#01,#4E,#01,#E4,#03,#11,#01,#1E,#01,#96
    DB #01,#11,#01,#16,#01,#69,#01,#E1,#01,#BB,#0C,#AA,#01,#1B,#0B,#99
    DB #01,#9D,#07,#99,#01,#D9,#01,#9B,#01,#1B,#01,#A2,#0A,#22,#01,#2C
    DB #05,#CC,#01,#CA,#01,#AA,#01,#AB,#01,#F1,#01,#FF,#01,#99,#01,#9D
    DB #01,#D9,#08,#99,#01,#9E,#02,#11,#01,#14,#01,#D4,#02,#44,#01,#11
    DB #01,#1D,#02,#DD,#01,#D1,#01,#11,#01,#D1,#12,#11,#01,#1D,#01,#D1
    DB #01,#D4,#01,#41,#01,#11,#01,#14,#06,#44,#01,#E4,#02,#44,#01,#11
    DB #01,#6E,#02,#9D,#01,#EE,#01,#F9,#04,#DD,#01,#E9,#01,#1B,#01,#BA
    DB #0B,#AA,#01,#AB,#01,#1B,#02,#99,#01,#69,#0D,#99,#01,#D9,#01,#D6
    DB #01,#69,#01,#EE,#01,#61,#01,#11,#01,#1C,#01,#AA,#09,#22,#01,#2C
    DB #06,#CC,#01,#AA,#01,#AB,#01,#B1,#01,#FF,#05,#99,#01,#DD,#03,#99
    DB #01,#EF,#01,#FF,#03,#11,#01,#14,#03,#44,#01,#D1,#01,#14,#01,#DD
    DB #01,#D4,#01,#44,#01,#1D,#01,#D1,#05,#11,#01,#14,#06,#11,#01,#1A
    DB #07,#AA,#01,#AB,#01,#AA,#01,#14,#05,#44,#01,#5D,#01,#44,#01,#11
    DB #01,#1D,#08,#DD,#01,#D6,#01,#6D,#01,#D6,#01,#D1,#01,#EB,#0C,#AA
    DB #01,#AB,#01,#12,#01,#BB,#01,#66,#01,#E9,#02,#11,#01,#D9,#03,#99
    DB #01,#9D,#01,#D9,#02,#99,#02,#DD,#01,#DE,#01,#61,#02,#11,#01,#6D
    DB #01,#D1,#07,#11,#07,#22,#04,#CC,#01,#C2,#01,#AA,#01,#AB,#01,#B1
    DB #03,#99,#01,#FF,#01,#F9,#02,#99,#01,#F6,#01,#6D,#06,#11,#01,#14
    DB #02,#44,#01,#4D,#02,#D4,#03,#44,#02,#14,#0B,#11,#01,#1C,#0A,#11
    DB #01,#1A,#05,#44,#01,#41,#0D,#DD,#01,#D6,#01,#61,#01,#BA,#0D,#AA
    DB #01,#B1,#01,#99,#01,#ED,#06,#DD,#01,#D9,#05,#99,#01,#9D,#04,#DD
    DB #01,#66,#01,#D1,#0A,#11,#01,#1C,#03,#22,#01,#2C,#04,#CC,#01,#AA
    DB #01,#AC,#01,#11,#01,#1E,#01,#99,#01,#F9,#02,#99,#01,#9E,#01,#61
    DB #08,#11,#01,#41,#02,#44,#01,#4D,#01,#D4,#05,#44,#01,#14,#0B,#11
    DB #01,#A1,#0B,#11,#01,#C4,#01,#44,#01,#41,#01,#11,#01,#41,#01,#11
    DB #01,#4D,#05,#11,#02,#44,#02,#11,#01,#1E,#01,#6D,#02,#DD,#01,#6C
    DB #01,#BA,#0D,#AA,#01,#B1,#01,#B9,#02,#99,#07,#DD,#01,#D9,#01,#9D
    DB #01,#D9,#02,#99,#01,#9D,#01,#DD,#01,#EE,#01,#E6,#01,#66,#18,#11
    DB #01,#E9,#07,#99,#01,#D6,#07,#11,#01,#14,#01,#DD,#05,#44,#01,#41
    DB #0C,#11,#01,#A1,#05,#11,#01,#BB,#02,#11,#01,#1B,#01,#A1,#02,#11
    DB #01,#A1,#01,#ED,#01,#DD,#01,#DE,#01,#DD,#01,#D4,#01,#DD,#01,#D1
    DB #04,#11,#01,#C1,#01,#11,#01,#16,#01,#ED,#01,#DE,#02,#EE,#01,#1F
    DB #0B,#AA,#01,#A2,#01,#AA,#01,#AB,#01,#B1,#01,#9E,#01,#11,#01,#69
    DB #01,#99,#01,#9D,#01,#DD,#01,#99,#01,#DD,#01,#61,#25,#11,#04,#99
    DB #01,#9D,#03,#99,#01,#9D,#04,#11,#01,#DD,#01,#D9,#01,#99,#01,#9E
    DB #01,#11,#03,#44,#0A,#11,#01,#41,#02,#11,#01,#A1,#05,#11,#01,#BA
    DB #02,#11,#01,#1B,#01,#A1,#02,#11,#01,#1C,#0F,#11,#01,#C1,#01,#CC
    DB #01,#11,#01,#12,#0B,#AA,#02,#2A,#01,#AB,#01,#B1,#03,#11,#01,#EE
    DB #2B,#11,#03,#99,#01,#9D,#04,#DD,#01,#11,#01,#D6,#03,#DD,#01,#41
    DB #01,#49,#01,#94,#01,#C6,#01,#E9,#01,#EE,#01,#E1,#05,#11,#01,#44
    DB #01,#41,#01,#14,#01,#41,#01,#11,#01,#44,#02,#11,#01,#A1,#05,#11
    DB #01,#1B,#01,#AB,#01,#AA,#01,#BB,#01,#B1,#16,#11,#01,#1A,#0A,#AA
    DB #02,#2A,#01,#AB,#01,#C1,#2F,#11,#02,#D9,#02,#99,#01,#96,#01,#EF
    DB #02,#99,#01,#FF,#01,#99,#01,#9D,#01,#1D,#01,#DD,#01,#D4,#01,#11
    DB #01,#4D,#02,#DD,#03,#99,#01,#61,#01,#11,#01,#14,#02,#44,#01,#41
    DB #01,#44,#01,#11,#02,#44,#01,#41,#01,#11,#01,#A1,#03,#11,#02,#BB
    DB #01,#B1,#01,#BA,#01,#AA,#01,#AB,#18,#11,#0B,#AA,#01,#2A,#30,#11
    DB #01,#4D,#01,#99,#01,#D9,#01,#99,#01,#61,#01,#EF,#01,#9D,#01,#44
    DB #01,#4D,#03,#11,#01,#14,#0B,#DD,#01,#D1,#08,#44,#01,#11,#01,#A1
    DB #01,#11,#01,#CB,#01,#A1,#01,#11,#01,#1B,#01,#BA,#03,#AA,#01,#B1
    DB #04,#11,#02,#AA,#01,#1B,#01,#AA,#01,#1A,#01,#A1,#01,#2B,#01,#1A
    DB #01,#B1,#01,#CA,#01,#1A,#01,#AA,#01,#AB,#01,#2A,#01,#AA,#01,#B1
    DB #05,#11,#01,#1C,#06,#AA,#01,#A1,#30,#11,#01,#D9,#01,#9D,#01,#D9
    DB #03,#DD,#03,#11,#01,#4D,#02,#11,#01,#41,#01,#11,#01,#14,#01,#4D
    DB #06,#DD,#01,#94,#01,#D4,#04,#11,#01,#14,#04,#44,#01,#11,#01,#4D
    DB #01,#DD,#01,#A1,#04,#11,#01,#B1,#01,#BA,#01,#1B,#01,#BA,#01,#AA
    DB #01,#B1,#04,#11,#01,#A1,#01,#1A,#01,#11,#01,#A1,#01,#1A,#01,#AC
    DB #01,#AB,#01,#1A,#01,#A2,#01,#AA,#01,#1A,#01,#B1,#01,#11,#01,#2B
    DB #06,#11,#01,#12,#33,#11,#01,#66,#01,#99,#01,#9D,#02,#D9,#01,#DD
    DB #02,#61,#02,#11,#01,#61,#08,#11,#01,#14,#01,#41,#03,#DD,#01,#11
    DB #01,#14,#01,#4D,#0A,#DD,#01,#11,#01,#4D,#02,#DD,#01,#A1,#03,#11
    DB #01,#B1,#01,#11,#01,#B1,#01,#AA,#01,#BF,#01,#BB,#01,#B1,#04,#11
    DB #01,#A1,#01,#AA,#01,#11,#01,#A1,#02,#1A,#01,#1B,#01,#1A,#01,#CA
    DB #02,#1A,#01,#AA,#01,#A1,#01,#2A,#01,#AA,#01,#C1,#05,#11,#01,#C1
    DB #33,#11,#01,#1D,#03,#DD,#01,#61,#01,#11,#01,#66,#01,#11,#01,#D1
    DB #0A,#11,#01,#14,#01,#11,#01,#DD,#01,#D4,#05,#44,#09,#DD,#01,#11
    DB #01,#14,#01,#4D,#01,#B4,#03,#11,#01,#B1,#01,#1B,#01,#1A,#01,#AA
    DB #01,#F1,#01,#FB,#01,#B1,#03,#11,#01,#1C,#02,#AA,#01,#12,#01,#A2
    DB #04,#1A,#01,#CA,#02,#1A,#02,#AA,#01,#2A,#01,#AA,#01,#A1,#06,#11
    DB #01,#C1,#1D,#11,#01,#64,#17,#11,#06,#DD,#09,#11,#01,#41,#01,#11
    DB #01,#41,#02,#11,#01,#66,#02,#44,#0B,#DD,#02,#11,#01,#14,#01,#B4
    DB #02,#11,#01,#21,#03,#11,#01,#AA,#01,#B1,#01,#AA,#1B,#11,#01,#1C
    DB #18,#11,#01,#14,#03,#DD,#01,#D6,#01,#16,#01,#61,#15,#11,#06,#DD
    DB #01,#D4,#01,#11,#01,#D4,#05,#11,#01,#44,#08,#11,#01,#1D,#03,#DD
    DB #02,#44,#06,#DD,#03,#11,#01,#A1,#01,#11,#01,#CA,#01,#FA,#03,#11
    DB #02,#AA,#01,#BB,#1C,#11,#01,#1C,#14,#11,#01,#16,#01,#DE,#01,#14
    DB #01,#44,#04,#DD,#19,#11,#01,#14,#07,#DD,#09,#11,#01,#DD,#01,#D4
    DB #01,#14,#02,#DD,#01,#41,#01,#11,#01,#4D,#03,#DD,#01,#D4,#01,#DD
    DB #01,#D4,#01,#41,#04,#11,#01,#A1,#01,#11,#01,#CA,#01,#AA,#02,#11
    DB #01,#1A,#01,#B1,#01,#AA,#01,#B1,#1D,#11,#01,#C1,#06,#11,#01,#41
    DB #22,#11,#01,#14,#02,#DD,#01,#D1,#0A,#11,#01,#1D,#01,#D4,#0B,#11
    DB #01,#14,#01,#44,#01,#4D,#01,#D4,#04,#44,#01,#D1,#0B,#11,#01,#A1
    DB #01,#11,#01,#1C,#01,#A1,#02,#11,#01,#BA,#01,#AB,#06,#11,#01,#1C
    DB #01,#FF,#01,#1F,#02,#E1,#01,#FE,#02,#11,#01,#1F,#01,#FE,#01,#CF
    DB #01,#EE,#01,#FF,#01,#EC,#01,#E1,#36,#11,#03,#DD,#01,#D1,#08,#11
    DB #02,#44,#01,#14,#01,#41,#05,#11,#01,#D4,#01,#11,#01,#41,#01,#11
    DB #01,#44,#02,#D4,#08,#44,#01,#D1,#08,#11,#01,#A1,#01,#11,#01,#1C
    DB #01,#A1,#01,#11,#01,#1B,#01,#AA,#01,#BA,#01,#11,#01,#AA,#04,#11
    DB #01,#1C,#01,#FE,#02,#1F,#01,#C1,#01,#EE,#02,#11,#01,#1F,#01,#EE
    DB #01,#F1,#01,#FF,#01,#FE,#01,#EC,#01,#F1,#26,#11,#01,#16,#01,#D4
    DB #0F,#11,#01,#14,#01,#44,#01,#D4,#01,#4D,#07,#11,#01,#14,#05,#11
    DB #06,#44,#01,#4D,#0C,#44,#01,#4D,#01,#41,#06,#11,#01,#A1,#02,#11
    DB #01,#A1,#01,#11,#01,#BB,#01,#AA,#01,#AB,#01,#A1,#01,#AA,#01,#B1
    DB #03,#11,#01,#1C,#01,#11,#01,#CF,#01,#C1,#01,#E1,#01,#EE,#01,#1F
    DB #01,#E1,#01,#1F,#01,#F1,#01,#1F,#02,#1E,#02,#E1,#01,#C1,#27,#11
    DB #01,#14,#10,#11,#01,#44,#01,#41,#01,#1D,#0A,#11,#18,#44,#05,#11
    DB #01,#A1,#02,#11,#01,#1C,#01,#22,#01,#AB,#02,#CB,#01,#CC,#02,#C1
    DB #4B,#11,#01,#41,#01,#14,#01,#41,#01,#1D,#01,#41,#07,#11,#01,#14
    DB #02,#44,#01,#11,#08,#44,#01,#41,#01,#14,#01,#44,#01,#11,#02,#14
    DB #04,#44,#03,#11,#01,#14,#04,#11,#01,#A1,#03,#11,#01,#1B,#01,#B1
bitmap_intro_scene0_rle_chunk_2_end:

; GameFlow intro scene #0 SCREEN 5 bitmap, packed 4bpp RLE; VRAM #06489, raw 1399 bytes, RLE 226 bytes
bitmap_intro_scene0_rle_chunk_3:
    DB #02,#F1,#06,#11,#01,#1C,#02,#1E,#01,#CC,#01,#EE,#01,#CE,#01,#E1
    DB #01,#1C,#01,#EF,#01,#1F,#01,#C1,#02,#1F,#01,#EC,#01,#CE,#01,#CF
    DB #01,#FC,#01,#F1,#01,#FC,#36,#11,#01,#14,#01,#44,#01,#41,#0B,#11
    DB #09,#44,#01,#14,#01,#41,#03,#11,#05,#44,#04,#11,#01,#14,#03,#11
    DB #01,#A1,#04,#11,#01,#2A,#01,#AB,#01,#1A,#01,#B1,#05,#11,#01,#1C
    DB #01,#CE,#01,#1E,#01,#1C,#01,#CF,#01,#CC,#01,#E1,#01,#1E,#01,#FF
    DB #01,#1E,#01,#11,#02,#1F,#01,#E1,#01,#1E,#01,#FF,#01,#FC,#02,#F1
    DB #28,#11,#01,#14,#1D,#11,#08,#44,#0D,#11,#01,#14,#03,#11,#01,#A1
    DB #04,#11,#01,#BA,#01,#A1,#01,#1A,#61,#11,#03,#44,#01,#41,#13,#11
    DB #01,#A1,#04,#11,#01,#A1,#01,#11,#01,#1A,#55,#11,#01,#14,#01,#44
    DB #21,#11,#01,#B1,#04,#11,#01,#AA,#01,#A1,#01,#1A,#01,#AA,#77,#11
    DB #01,#A1,#04,#11,#01,#CC,#01,#C1,#01,#1C,#01,#CC,#77,#11,#01,#1A
    DB #01,#AA,#01,#BB,#01,#BA,#0A,#AA,#01,#2A,#01,#22,#01,#2C,#02,#AA
    DB #01,#AC,#01,#CC,#02,#22,#01,#CA,#10,#AA,#01,#A1,#FF,#11,#FF,#11
    DB #56,#11
bitmap_intro_scene0_rle_chunk_3_end:

BITMAP_ROOM_DATA_BANK_12_USED_END:
    ds 30, #FF
    org BITMAP_ROOM_DATA_BANK_12_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_13_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_13_ROM_START:
; NPC dialogue glyph strips + portrait frames, packed 4bpp RLE; VRAM #1B000, raw 4096 bytes, RLE 2406 bytes
bitmap_dlg_gfx_rle_chunk_0:
    DB #04,#11,#01,#1F,#02,#FF,#02,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1
    DB #05,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1,#03,#11,#02,#FF,#01,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#01,#1F
    DB #02,#FF,#02,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11
    DB #01,#FF,#01,#1F,#02,#FF,#01,#F1,#01,#1F,#02,#FF,#01,#11,#01,#1F
    DB #01,#FF,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#06,#11,#01,#22,#02,#11,#02,#22,#02,#11
    DB #02,#FF,#02,#11,#01,#1F,#01,#FF,#01,#F1,#01,#1F,#02,#FF,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#12,#01,#21,#01,#11,#08,#00
    DB #04,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#FF,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#02,#FF
    DB #01,#11,#01,#1F,#01,#FF,#01,#1F,#01,#F3,#01,#11,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#FF
    DB #01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#05,#11,#01,#12,#01,#22,#01,#11,#01,#1F,#01,#21,#01,#12
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#FF,#01,#11
    DB #01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#22
    DB #01,#21,#01,#11,#08,#00,#04,#11,#01,#13,#01,#31,#01,#13,#01,#31
    DB #01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#3F,#01,#F3,#01,#31
    DB #01,#13,#01,#31,#03,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #01,#11,#01,#13,#01,#31,#02,#11,#01,#13,#01,#31,#02,#11,#01,#13
    DB #01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13
    DB #01,#31,#02,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31
    DB #01,#13,#01,#31,#01,#13,#01,#3F,#01,#F3,#01,#33,#01,#11,#01,#1F
    DB #01,#F1,#01,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31
    DB #01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31
    DB #01,#13,#01,#31,#05,#11,#02,#22,#01,#11,#01,#1F,#01,#21,#01,#22
    DB #01,#F1,#01,#13,#01,#31,#04,#11,#01,#F3,#01,#11,#01,#13,#01,#31
    DB #02,#11,#01,#13,#01,#31,#01,#13,#01,#31,#02,#11,#01,#F3,#02,#11
    DB #01,#3F,#01,#F3,#02,#11,#01,#12,#01,#21,#01,#11,#08,#00,#04,#11
    DB #01,#13,#02,#33,#01,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13
    DB #02,#33,#01,#31,#01,#13,#01,#31,#03,#11,#01,#13,#01,#31,#06,#11
    DB #02,#33,#01,#11,#01,#13,#01,#31,#02,#11,#01,#13,#01,#31,#01,#13
    DB #01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#02,#33,#01,#11
    DB #01,#13,#02,#33,#01,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13
    DB #02,#31,#01,#33,#01,#11,#01,#13,#01,#31,#01,#11,#01,#13,#02,#33
    DB #01,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#02,#33,#01,#31
    DB #01,#11,#02,#33,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#1F,#01,#21
    DB #01,#22,#01,#11,#01,#1F,#01,#22,#01,#12,#01,#F1,#01,#13,#01,#31
    DB #01,#33,#01,#31,#02,#11,#01,#33,#01,#11,#01,#13,#02,#33,#01,#11
    DB #01,#13,#01,#31,#01,#13,#01,#31,#01,#11,#01,#13,#01,#31,#02,#11
    DB #01,#13,#01,#31,#02,#11,#01,#12,#01,#21,#01,#11,#08,#00,#04,#11
    DB #01,#13,#01,#31,#02,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13
    DB #01,#31,#01,#33,#01,#31,#01,#13,#01,#31,#03,#11,#01,#13,#01,#31
    DB #07,#11,#01,#13,#01,#31,#01,#13,#01,#31,#02,#11,#01,#13,#03,#31
    DB #01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#02,#11,#01,#13
    DB #01,#31,#01,#13,#01,#31,#01,#13,#02,#33,#01,#31,#01,#13,#01,#31
    DB #01,#11,#01,#33,#01,#11,#01,#13,#01,#31,#01,#11,#01,#13,#01,#33
    DB #01,#31,#01,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31
    DB #01,#13,#01,#31,#01,#11,#01,#13,#01,#31,#05,#11,#01,#1F,#02,#22
    DB #01,#F1,#01,#1F,#01,#21,#01,#12,#01,#F1,#01,#13,#01,#31,#01,#13
    DB #01,#31,#02,#11,#01,#33,#01,#11,#01,#13,#01,#31,#02,#11,#01,#13
    DB #01,#31,#01,#13,#01,#31,#01,#11,#01,#33,#03,#11,#02,#33,#02,#11
    DB #01,#12,#01,#21,#01,#11,#08,#00,#04,#11,#01,#13,#01,#31,#02,#11
    DB #01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31
    DB #01,#13,#01,#31,#01,#13,#01,#31,#01,#11,#01,#13,#01,#31,#02,#11
    DB #01,#1F,#01,#F1,#01,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13
    DB #01,#31,#02,#11,#01,#13,#01,#31,#01,#33,#01,#11,#01,#13,#01,#31
    DB #01,#13,#01,#31,#01,#13,#01,#31,#02,#11,#01,#13,#01,#31,#01,#13
    DB #01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13,#01,#31,#01,#11
    DB #01,#33,#01,#11,#01,#13,#01,#31,#01,#11,#01,#13,#01,#31,#01,#33
    DB #01,#11,#01,#13,#01,#31,#01,#33,#01,#11,#01,#13,#01,#31,#01,#13
    DB #01,#31,#01,#11,#01,#13,#01,#31,#07,#11,#01,#22,#01,#11,#01,#1F
    DB #01,#21,#01,#12,#01,#F1,#01,#13,#01,#31,#01,#13,#01,#31,#01,#13
    DB #01,#31,#01,#33,#01,#11,#01,#13,#01,#31,#03,#11,#02,#33,#01,#11
    DB #01,#13,#01,#31,#02,#11,#01,#13,#01,#31,#01,#13,#01,#31,#01,#11
    DB #01,#12,#01,#21,#01,#11,#08,#00,#04,#11,#01,#18,#01,#81,#03,#11
    DB #02,#88,#01,#11,#01,#18,#01,#81,#01,#18,#01,#81,#01,#11,#02,#88
    DB #01,#11,#01,#18,#02,#88,#01,#81,#01,#11,#01,#1F,#01,#F1,#02,#11
    DB #02,#88,#01,#11,#01,#18,#02,#88,#01,#81,#01,#11,#01,#88,#01,#18
    DB #01,#81,#01,#11,#02,#88,#01,#11,#01,#18,#02,#88,#01,#81,#01,#18
    DB #02,#88,#01,#11,#01,#18,#01,#81,#01,#18,#01,#81,#01,#18,#01,#81
    DB #01,#11,#01,#88,#01,#11,#01,#18,#01,#81,#01,#11,#01,#18,#01,#81
    DB #01,#18,#01,#81,#01,#18,#01,#88,#01,#81,#01,#11,#01,#18,#01,#81
    DB #01,#18,#01,#81,#01,#11,#01,#18,#01,#81,#07,#11,#01,#22,#02,#11
    DB #02,#22,#02,#11,#02,#88,#02,#11,#01,#88,#01,#81,#01,#11,#01,#18
    DB #01,#81,#03,#11,#01,#18,#01,#81,#01,#11,#01,#18,#02,#88,#01,#81
    DB #01,#18,#01,#81,#01,#18,#01,#81,#01,#1F,#02,#22,#01,#F1,#08,#00
    DB #78,#11,#1D,#00,#01,#70,#17,#00,#01,#70,#58,#00,#01,#06,#01,#00
    DB #01,#07,#0A,#00,#01,#77,#01,#BD,#01,#77,#08,#00,#01,#06,#01,#00
    DB #01,#07,#0A,#00,#01,#77,#01,#BD,#01,#77,#58,#00,#01,#60,#01,#BB
    DB #01,#77,#0A,#00,#01,#07,#01,#BD,#01,#77,#08,#00,#01,#60,#01,#BB
    DB #01,#77,#0A,#00,#01,#07,#01,#BD,#01,#77,#58,#00,#01,#60,#01,#DD
    DB #01,#B4,#01,#70,#08,#00,#01,#70,#01,#07,#01,#BD,#01,#77,#08,#00
    DB #01,#60,#01,#DD,#01,#B4,#01,#70,#08,#00,#01,#70,#01,#07,#01,#BD
    DB #01,#77,#58,#00,#01,#60,#01,#DD,#01,#B4,#09,#00,#01,#04,#01,#47
    DB #01,#BA,#01,#77,#08,#00,#01,#60,#01,#DD,#01,#B4,#09,#00,#01,#04
    DB #01,#47,#01,#BA,#01,#77,#58,#00,#01,#60,#01,#DD,#01,#B4,#09,#00
    DB #01,#0A,#01,#AA,#01,#BA,#01,#47,#01,#70,#07,#00,#01,#60,#01,#DD
    DB #01,#B4,#09,#00,#01,#0A,#01,#AA,#01,#BA,#01,#47,#01,#70,#57,#00
    DB #01,#60,#01,#DD,#01,#DA,#01,#47,#08,#00,#01,#0A,#01,#BD,#01,#DA
    DB #01,#A7,#01,#70,#07,#00,#01,#60,#01,#DD,#01,#DA,#01,#47,#08,#00
    DB #01,#0A,#01,#BD,#01,#DA,#01,#A7,#01,#70,#57,#00,#01,#60,#01,#AD
    DB #01,#DB,#01,#E0,#08,#00,#01,#0A,#01,#BD,#01,#DA,#01,#A7,#01,#70
    DB #07,#00,#01,#60,#01,#AD,#01,#DB,#01,#E0,#08,#00,#01,#0A,#01,#BD
    DB #01,#DA,#01,#A7,#01,#70,#57,#00,#01,#07,#01,#4D,#01,#DB,#01,#A4
    DB #01,#70,#07,#00,#01,#0A,#01,#BD,#01,#DA,#01,#A7,#01,#70,#07,#00
    DB #01,#07,#01,#4D,#01,#DB,#01,#A4,#01,#70,#07,#00,#01,#0A,#01,#BD
    DB #01,#DA,#01,#A7,#01,#70,#58,#00,#01,#0A,#01,#DD,#01,#BA,#01,#67
    DB #07,#00,#01,#0A,#01,#BD,#01,#DA,#01,#47,#01,#70,#08,#00,#01,#0A
    DB #01,#DD,#01,#BA,#01,#67,#07,#00,#01,#0A,#01,#BD,#01,#DA,#01,#47
    DB #01,#70,#58,#00,#01,#04,#01,#AD,#01,#DB,#01,#B6,#01,#70,#06,#00
    DB #01,#0A,#01,#BD,#01,#A4,#01,#77,#09,#00,#01,#04,#01,#AD,#01,#DB
    DB #01,#B6,#01,#70,#06,#00,#01,#0A,#01,#BD,#01,#A4,#01,#77,#59,#00
    DB #01,#07,#01,#4A,#01,#DD,#01,#DB,#01,#77,#06,#00,#01,#0A,#01,#BD
    DB #01,#A0,#0A,#00,#01,#07,#01,#4A,#01,#DD,#01,#DB,#01,#77,#06,#00
    DB #01,#0A,#01,#BD,#01,#A0,#5B,#00,#01,#04,#01,#AD,#01,#DD,#01,#B7
    DB #01,#70,#05,#00,#01,#0A,#01,#BD,#01,#A0,#01,#77,#0A,#00,#01,#04
    DB #01,#AD,#01,#DD,#01,#B7,#01,#70,#05,#00,#01,#0A,#01,#BD,#01,#A0
    DB #01,#77,#5B,#00,#01,#4A,#01,#DD,#01,#DB,#01,#47,#01,#07,#02,#00
    DB #01,#07,#01,#00,#01,#0A,#01,#BD,#01,#A0,#01,#00,#01,#70,#0A,#00
    DB #01,#4A,#01,#DD,#01,#DB,#01,#47,#01,#07,#02,#00,#01,#07,#01,#00
    DB #01,#0A,#01,#BD,#01,#A0,#01,#00,#01,#70,#5A,#00,#01,#77,#01,#AD
    DB #01,#DD,#01,#B4,#03,#00,#01,#07,#01,#00,#01,#0A,#01,#BD,#01,#40
    DB #01,#DD,#01,#40,#0A,#00,#01,#77,#01,#AD,#01,#DD,#01,#B4,#03,#00
    DB #01,#07,#01,#00,#01,#0A,#01,#BD,#01,#40,#01,#DD,#01,#40,#5A,#00
    DB #01,#07,#01,#7A,#01,#DD,#01,#BE,#01,#4D,#02,#DD,#01,#DB,#01,#B0
    DB #01,#00,#01,#4D,#02,#DD,#01,#40,#0A,#00,#01,#07,#01,#7A,#01,#DD
    DB #01,#BE,#01,#4D,#02,#DD,#01,#DB,#01,#B0,#01,#00,#01,#4D,#02,#DD
    DB #01,#40,#5B,#00,#01,#67,#01,#AD,#01,#DB,#01,#A4,#03,#DD,#01,#DB
    DB #01,#AB,#01,#E4,#01,#DA,#01,#77,#01,#70,#0B,#00,#01,#67,#01,#AD
    DB #01,#DB,#01,#A4,#03,#DD,#01,#DB,#01,#AB,#01,#E4,#01,#DA,#01,#77
    DB #01,#70,#55,#00,#01,#EA,#02,#AA,#01,#00,#01,#07,#02,#00,#01,#AD
    DB #01,#DB,#01,#BD,#04,#DD,#01,#BB,#01,#DA,#01,#D7,#01,#E0,#06,#00
    DB #01,#EA,#02,#AA,#01,#00,#01,#07,#02,#00,#01,#AD,#01,#DB,#01,#BD
    DB #04,#DD,#01,#BB,#01,#DA,#01,#D7,#01,#E0,#53,#00,#01,#70,#01,#7A
    DB #01,#AA,#03,#BB,#01,#AA,#01,#A4,#01,#76,#01,#74,#01,#7A,#01,#DD
    DB #01,#BD,#06,#DD,#01,#DA,#01,#77,#03,#00,#01,#70,#01,#7A,#01,#AA
    DB #03,#BB,#01,#AA,#01,#A4,#01,#76,#01,#74,#01,#7A,#01,#DD,#01,#BD
    DB #06,#DD,#01,#DA,#01,#77,#52,#00,#01,#70,#01,#4E,#01,#AB,#01,#BA
    DB #03,#44,#01,#AD,#01,#BA,#01,#47,#02,#4A,#09,#DD,#01,#A7,#01,#70
    DB #01,#00,#01,#70,#01,#4E,#01,#AB,#01,#BA,#03,#44,#01,#AD,#01,#BA
    DB #01,#47,#02,#4A,#09,#DD,#01,#A7,#01,#70,#51,#00,#01,#04,#01,#AB
    DB #01,#BD,#01,#44,#01,#70,#01,#00,#01,#07,#01,#44,#01,#4E,#01,#A4
    DB #01,#4A,#0A,#DD,#01,#BE,#01,#67,#01,#00,#01,#04,#01,#AB,#01,#BD
    DB #01,#44,#01,#70,#01,#00,#01,#07,#01,#44,#01,#4E,#01,#A4,#01,#4A
    DB #0A,#DD,#01,#BE,#01,#67,#51,#00,#01,#0A,#01,#DA,#01,#44,#02,#70
    DB #03,#00,#01,#07,#01,#44,#01,#4D,#0A,#DD,#01,#DB,#01,#40,#01,#00
    DB #01,#0A,#01,#DA,#01,#44,#02,#70,#03,#00,#01,#07,#01,#44,#01,#4D
    DB #0A,#DD,#01,#DB,#01,#40,#51,#00,#01,#74,#01,#44,#01,#07,#06,#00
    DB #01,#74,#0C,#DD,#01,#A6,#01,#70,#01,#74,#01,#44,#01,#07,#06,#00
    DB #01,#74,#0C,#DD,#01,#A6,#01,#70,#50,#00,#01,#07,#07,#00,#01,#70
    DB #01,#7A,#0C,#DD,#01,#BE,#01,#00,#01,#07,#07,#00,#01,#70,#01,#7A
    DB #0C,#DD,#01,#BE,#51,#00
bitmap_dlg_gfx_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_13_USED_END:
    ds 5786, #FF
    org BITMAP_ROOM_DATA_BANK_13_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_14_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_14_ROM_START:
; NPC dialogue glyph strips + portrait frames, packed 4bpp RLE; VRAM #1C000, raw 15360 bytes, RLE 6498 bytes
bitmap_dlg_gfx_rle_chunk_1:
    DB #04,#00,#01,#77,#03,#44,#01,#77,#01,#4A,#0C,#DD,#01,#BE,#01,#67
    DB #04,#00,#01,#77,#03,#44,#01,#77,#01,#4A,#0C,#DD,#01,#BE,#01,#67
    DB #54,#00,#01,#67,#01,#EB,#01,#BA,#01,#AA,#01,#44,#01,#AA,#02,#DD
    DB #01,#A4,#01,#AD,#08,#DD,#01,#DB,#01,#A0,#04,#00,#01,#67,#01,#EB
    DB #01,#BA,#01,#AA,#01,#44,#01,#AA,#02,#DD,#01,#A4,#01,#AD,#08,#DD
    DB #01,#DB,#01,#A0,#53,#00,#01,#07,#01,#EB,#01,#DA,#01,#A0,#01,#00
    DB #01,#44,#01,#AA,#02,#DD,#01,#40,#01,#7D,#03,#DD,#01,#AA,#01,#AD
    DB #03,#DD,#01,#DB,#01,#A0,#03,#00,#01,#07,#01,#EB,#01,#DA,#01,#A0
    DB #01,#00,#01,#44,#01,#AA,#02,#DD,#01,#40,#01,#7D,#03,#DD,#01,#11
    DB #01,#1D,#03,#DD,#01,#DB,#01,#A0,#53,#00,#01,#0A,#01,#BD,#01,#40
    DB #02,#00,#01,#44,#01,#4A,#02,#DD,#01,#40,#01,#4D,#02,#DD,#01,#D1
    DB #02,#11,#01,#1D,#02,#DD,#01,#DB,#01,#A0,#03,#00,#01,#0A,#01,#BD
    DB #01,#40,#02,#00,#01,#44,#01,#4A,#02,#DD,#01,#40,#01,#4D,#02,#DD
    DB #01,#D1,#01,#FF,#01,#F4,#01,#1D,#02,#DD,#01,#DB,#01,#A0,#52,#00
    DB #01,#07,#01,#7B,#01,#D4,#01,#70,#02,#00,#01,#4A,#01,#AA,#02,#DD
    DB #01,#40,#01,#4D,#02,#DD,#01,#1F,#02,#FF,#01,#F1,#02,#DD,#01,#DB
    DB #01,#A0,#02,#00,#01,#07,#01,#7B,#01,#D4,#01,#70,#02,#00,#01,#4A
    DB #01,#AA,#02,#DD,#01,#40,#01,#4D,#02,#DD,#01,#4F,#02,#FF,#01,#F4
    DB #02,#DD,#01,#DB,#01,#A0,#52,#00,#01,#70,#01,#BB,#01,#40,#03,#00
    DB #01,#4A,#01,#AA,#01,#AD,#01,#DD,#01,#40,#01,#4D,#01,#DD,#01,#D1
    DB #01,#1F,#03,#FF,#01,#7D,#01,#DD,#01,#DB,#01,#A0,#02,#00,#01,#70
    DB #01,#BB,#01,#40,#03,#00,#01,#4A,#01,#AA,#01,#AD,#01,#DD,#01,#40
    DB #01,#4D,#01,#DD,#01,#D4,#04,#FF,#01,#7D,#01,#DD,#01,#DB,#01,#A0
    DB #52,#00,#01,#67,#01,#DD,#01,#47,#02,#00,#01,#07,#01,#4A,#01,#AA
    DB #01,#A4,#01,#DD,#01,#D4,#01,#4D,#01,#DD,#01,#D1,#04,#FF,#01,#F0
    DB #01,#AD,#01,#DD,#01,#A0,#02,#00,#01,#67,#01,#DD,#01,#47,#02,#00
    DB #01,#07,#01,#4A,#01,#AA,#01,#A4,#01,#DD,#01,#D4,#01,#4D,#01,#DD
    DB #01,#D4,#04,#FF,#01,#F0,#01,#AD,#01,#DD,#01,#A0,#51,#00,#01,#07
    DB #01,#0A,#01,#D7,#01,#70,#03,#00,#01,#07,#01,#40,#01,#00,#01,#0A
    DB #03,#DD,#01,#D1,#05,#FF,#01,#0D,#01,#DD,#01,#40,#01,#00,#01,#07
    DB #01,#0A,#01,#D7,#01,#70,#03,#00,#01,#07,#01,#40,#01,#00,#01,#0A
    DB #03,#DD,#01,#D4,#05,#FF,#01,#0D,#01,#DD,#01,#40,#51,#00,#01,#07
    DB #01,#0A,#01,#A7,#01,#70,#04,#00,#01,#4D,#01,#DD,#01,#DA,#01,#AD
    DB #02,#DD,#01,#D1,#05,#FF,#01,#FD,#01,#D4,#02,#00,#01,#07,#01,#0A
    DB #01,#A7,#01,#70,#04,#00,#01,#4D,#01,#DD,#01,#DA,#01,#AD,#02,#DD
    DB #01,#D4,#05,#FF,#01,#FD,#01,#D4,#54,#00,#01,#07,#04,#00,#01,#EA
    DB #01,#DA,#01,#AA,#01,#74,#03,#DD,#01,#D1,#03,#FF,#01,#F0,#01,#FF
    DB #01,#FD,#01,#D4,#04,#00,#01,#07,#04,#00,#01,#EA,#01,#DA,#01,#AA
    DB #01,#74,#03,#DD,#01,#D4,#03,#FF,#01,#F0,#01,#FF,#01,#FD,#01,#D4
    DB #58,#00,#01,#AA,#01,#DD,#01,#47,#01,#77,#01,#44,#03,#DD,#01,#D1
    DB #03,#FF,#01,#F0,#01,#0F,#01,#0D,#01,#D4,#08,#00,#01,#AA,#01,#DD
    DB #01,#47,#01,#77,#01,#44,#03,#DD,#01,#D4,#03,#FF,#01,#F0,#01,#0F
    DB #01,#0D,#01,#D4,#56,#00,#01,#07,#01,#7A,#01,#BD,#01,#47,#01,#74
    DB #01,#44,#01,#AA,#03,#DD,#01,#D4,#01,#4F,#02,#FF,#01,#F0,#01,#0F
    DB #01,#4D,#01,#D4,#06,#00,#01,#07,#01,#7A,#01,#BD,#01,#47,#01,#74
    DB #01,#44,#01,#AA,#03,#DD,#01,#D4,#01,#4F,#02,#FF,#01,#F0,#01,#0F
    DB #01,#4D,#01,#D4,#56,#00,#01,#76,#01,#AB,#01,#D4,#02,#77,#02,#AA
    DB #04,#DD,#01,#4F,#02,#FF,#01,#F0,#01,#0F,#01,#4D,#01,#47,#01,#70
    DB #05,#00,#01,#76,#01,#AB,#01,#D4,#02,#77,#02,#AA,#04,#DD,#01,#4F
    DB #02,#FF,#01,#F0,#01,#0F,#01,#4D,#01,#47,#01,#70,#55,#00,#01,#06
    DB #01,#BD,#01,#47,#01,#00,#01,#07,#01,#7A,#01,#AA,#04,#DD,#01,#A7
    DB #02,#FF,#01,#F0,#01,#0F,#01,#AB,#01,#40,#06,#00,#01,#06,#01,#BD
    DB #01,#47,#01,#00,#01,#07,#01,#7A,#01,#AA,#04,#DD,#01,#A7,#02,#FF
    DB #01,#F0,#01,#0F,#01,#AB,#01,#40,#56,#00,#01,#77,#01,#DD,#01,#07
    DB #02,#00,#01,#74,#01,#AA,#01,#AD,#03,#DD,#01,#DE,#02,#FF,#01,#F0
    DB #01,#7F,#01,#AB,#01,#40,#06,#00,#01,#77,#01,#DD,#01,#07,#02,#00
    DB #01,#74,#01,#AA,#01,#AD,#03,#DD,#01,#DE,#02,#FF,#01,#F0,#01,#7F
    DB #01,#AB,#01,#40,#56,#00,#01,#07,#01,#DA,#01,#07,#02,#00,#01,#07
    DB #01,#44,#01,#AA,#04,#DD,#01,#44,#02,#FF,#01,#FA,#01,#DB,#01,#40
    DB #06,#00,#01,#07,#01,#DA,#01,#07,#02,#00,#01,#07,#01,#44,#01,#AA
    DB #04,#DD,#01,#44,#02,#FF,#01,#FA,#01,#DB,#01,#40,#56,#00,#01,#07
    DB #01,#44,#01,#70,#03,#00,#01,#74,#01,#4A,#04,#DD,#01,#DA,#01,#44
    DB #01,#4E,#01,#DD,#01,#DE,#01,#67,#06,#00,#01,#07,#01,#44,#01,#70
    DB #03,#00,#01,#74,#01,#4A,#04,#DD,#01,#DA,#01,#44,#01,#4E,#01,#DD
    DB #01,#DE,#01,#67,#57,#00,#01,#07,#05,#00,#01,#4A,#01,#AD,#07,#DD
    DB #01,#D7,#08,#00,#01,#07,#05,#00,#01,#4A,#01,#AD,#07,#DD,#01,#D7
    DB #5D,#00,#01,#07,#01,#44,#01,#AA,#07,#DD,#01,#47,#0D,#00,#01,#07
    DB #01,#44,#01,#AA,#03,#DD,#03,#11,#01,#DD,#01,#47,#5E,#00,#01,#77
    DB #01,#4A,#01,#AD,#02,#DD,#01,#DA,#01,#AA,#01,#AD,#01,#DD,#01,#07
    DB #0E,#00,#01,#77,#01,#4A,#01,#AD,#01,#DD,#01,#D1,#03,#11,#01,#DD
    DB #01,#07,#5E,#00,#01,#07,#01,#74,#01,#4A,#02,#DD,#01,#D1,#01,#11
    DB #01,#1D,#01,#D4,#01,#77,#0E,#00,#01,#07,#01,#74,#01,#4A,#02,#DD
    DB #01,#D1,#01,#11,#01,#1D,#01,#D4,#01,#77,#60,#00,#01,#04,#01,#AA
    DB #03,#DD,#01,#AA,#01,#40,#11,#00,#01,#04,#01,#AA,#03,#DD,#01,#AA
    DB #01,#40,#62,#00,#01,#04,#03,#AA,#01,#40,#01,#70,#12,#00,#01,#04
    DB #03,#AA,#01,#40,#01,#70,#62,#00,#01,#07,#17,#00,#01,#07,#5F,#00
    DB #01,#77,#01,#70,#02,#00,#01,#77,#01,#70,#12,#00,#01,#77,#01,#70
    DB #02,#00,#01,#77,#01,#70,#62,#00,#01,#07,#01,#27,#02,#00,#01,#07
    DB #01,#70,#12,#00,#01,#07,#01,#27,#02,#00,#01,#07,#01,#70,#62,#00
    DB #01,#07,#01,#22,#01,#70,#01,#00,#01,#07,#01,#22,#01,#70,#11,#00
    DB #01,#07,#01,#22,#01,#70,#01,#00,#01,#07,#01,#22,#01,#70,#61,#00
    DB #01,#07,#01,#22,#01,#27,#01,#70,#01,#07,#01,#22,#01,#27,#01,#70
    DB #01,#07,#01,#77,#0E,#00,#01,#07,#01,#22,#01,#27,#01,#70,#01,#07
    DB #01,#22,#01,#27,#01,#70,#01,#07,#01,#77,#59,#00,#01,#07,#03,#77
    DB #01,#70,#01,#07,#01,#72,#01,#22,#01,#77,#01,#07,#02,#22,#01,#77
    DB #01,#07,#01,#27,#09,#00,#01,#07,#03,#77,#01,#70,#01,#07,#01,#72
    DB #01,#22,#01,#77,#01,#07,#02,#22,#01,#77,#01,#07,#01,#27,#5A,#00
    DB #01,#77,#02,#22,#01,#70,#01,#77,#01,#72,#02,#22,#01,#77,#01,#72
    DB #01,#22,#01,#27,#01,#07,#01,#22,#01,#70,#09,#00,#01,#77,#02,#22
    DB #01,#70,#01,#77,#01,#72,#02,#22,#01,#77,#01,#72,#01,#22,#01,#27
    DB #01,#07,#01,#22,#01,#70,#5A,#00,#01,#72,#02,#22,#01,#70,#01,#07
    DB #02,#22,#01,#20,#01,#72,#02,#22,#01,#77,#01,#22,#01,#76,#01,#70
    DB #09,#00,#01,#72,#02,#22,#01,#70,#01,#07,#02,#22,#01,#20,#01,#72
    DB #02,#22,#01,#77,#01,#22,#01,#76,#01,#70,#55,#00,#01,#07,#02,#00
    DB #01,#70,#01,#77,#03,#22,#01,#70,#03,#22,#01,#02,#02,#22,#01,#77
    DB #01,#22,#01,#70,#01,#77,#01,#07,#01,#70,#03,#00,#01,#07,#02,#00
    DB #01,#70,#01,#77,#03,#22,#01,#70,#03,#22,#01,#02,#02,#22,#01,#77
    DB #01,#22,#01,#70,#01,#77,#01,#07,#01,#70,#53,#00,#01,#72,#02,#22
    DB #01,#27,#01,#70,#03,#22,#01,#27,#01,#72,#02,#22,#01,#72,#04,#22
    DB #02,#20,#01,#07,#01,#70,#03,#00,#01,#72,#02,#22,#01,#27,#01,#70
    DB #03,#22,#01,#27,#01,#72,#02,#22,#01,#72,#04,#22,#02,#20,#01,#07
    DB #01,#70,#53,#00,#01,#07,#01,#77,#01,#22,#01,#92,#01,#22,#01,#72
    DB #03,#22,#01,#72,#07,#22,#01,#27,#01,#20,#01,#72,#01,#70,#03,#00
    DB #01,#07,#01,#77,#01,#22,#01,#92,#01,#22,#01,#72,#03,#22,#01,#72
    DB #07,#22,#01,#27,#01,#20,#01,#72,#01,#70,#54,#00,#01,#06,#01,#72
    DB #02,#22,#01,#27,#05,#22,#01,#72,#06,#22,#01,#70,#01,#22,#01,#76
    DB #01,#70,#03,#00,#01,#06,#01,#72,#02,#22,#01,#27,#05,#22,#01,#72
    DB #06,#22,#01,#70,#01,#22,#01,#76,#01,#70,#54,#00,#01,#77,#01,#72
    DB #07,#22,#01,#72,#04,#22,#01,#72,#01,#22,#01,#77,#01,#22,#01,#77
    DB #01,#70,#04,#00,#01,#77,#01,#72,#07,#22,#01,#72,#04,#22,#01,#72
    DB #01,#22,#01,#77,#01,#22,#01,#77,#01,#70,#54,#00,#01,#77,#01,#07
    DB #04,#22,#01,#72,#02,#22,#01,#77,#01,#22,#01,#27,#01,#22,#01,#27
    DB #01,#72,#01,#27,#01,#72,#01,#27,#01,#72,#01,#70,#04,#00,#01,#77
    DB #01,#07,#04,#22,#01,#72,#02,#22,#01,#77,#01,#22,#01,#27,#01,#22
    DB #01,#27,#01,#72,#01,#27,#01,#72,#01,#27,#01,#72,#01,#70,#52,#00
    DB #03,#77,#01,#70,#04,#22,#01,#77,#02,#22,#01,#77,#01,#22,#01,#77
    DB #01,#22,#01,#70,#01,#72,#01,#70,#01,#22,#01,#77,#01,#27,#02,#77
    DB #01,#00,#03,#77,#01,#70,#04,#22,#01,#77,#02,#22,#01,#77,#01,#22
    DB #01,#77,#01,#22,#01,#70,#01,#72,#01,#70,#01,#22,#01,#77,#01,#27
    DB #02,#77,#51,#00,#01,#77,#01,#72,#01,#22,#01,#27,#01,#72,#03,#22
    DB #01,#70,#01,#22,#01,#27,#01,#70,#01,#77,#01,#00,#01,#77,#01,#00
    DB #01,#77,#01,#07,#01,#77,#01,#07,#01,#70,#01,#72,#01,#77,#01,#00
    DB #01,#77,#01,#72,#01,#22,#01,#27,#01,#72,#03,#22,#01,#70,#01,#22
    DB #01,#27,#01,#70,#01,#77,#01,#00,#01,#77,#01,#00,#01,#77,#01,#07
    DB #01,#77,#01,#07,#01,#70,#01,#72,#01,#77,#52,#00,#01,#07,#02,#22
    DB #01,#77,#02,#22,#01,#72,#01,#20,#01,#77,#01,#70,#01,#00,#01,#70
    DB #01,#07,#01,#70,#02,#07,#03,#00,#02,#77,#03,#00,#01,#07,#02,#22
    DB #01,#77,#02,#22,#01,#72,#01,#20,#01,#77,#01,#70,#01,#00,#01,#70
    DB #01,#07,#01,#70,#02,#07,#03,#00,#02,#77,#54,#00,#01,#77,#01,#22
    DB #01,#27,#02,#22,#01,#07,#01,#70,#01,#07,#01,#77,#01,#07,#01,#77
    DB #01,#67,#01,#76,#03,#67,#01,#77,#02,#00,#02,#77,#01,#70,#02,#00
    DB #01,#77,#01,#22,#01,#27,#02,#22,#01,#07,#01,#70,#01,#07,#01,#77
    DB #01,#07,#01,#77,#01,#67,#01,#76,#03,#67,#01,#77,#02,#00,#02,#77
    DB #01,#70,#53,#00,#01,#72,#01,#22,#01,#72,#01,#77,#01,#07,#01,#70
    DB #01,#77,#01,#67,#01,#69,#07,#66,#01,#77,#02,#07,#01,#77,#01,#70
    DB #03,#00,#01,#72,#01,#22,#01,#72,#01,#77,#01,#07,#01,#70,#01,#77
    DB #01,#67,#01,#69,#07,#66,#01,#77,#02,#07,#01,#77,#01,#70,#53,#00
    DB #01,#07,#01,#72,#01,#27,#01,#77,#01,#00,#01,#76,#01,#66,#04,#99
    DB #01,#96,#04,#66,#01,#67,#01,#70,#01,#07,#01,#77,#04,#00,#01,#07
    DB #01,#72,#01,#27,#01,#77,#01,#00,#01,#76,#01,#66,#04,#99,#01,#96
    DB #04,#66,#01,#67,#01,#70,#01,#07,#01,#77,#54,#00,#02,#77,#01,#20
    DB #01,#70,#01,#76,#01,#69,#07,#99,#01,#96,#03,#66,#01,#67,#01,#00
    DB #02,#70,#03,#00,#02,#77,#01,#20,#01,#70,#01,#76,#01,#69,#07,#99
    DB #01,#96,#03,#66,#01,#67,#01,#00,#02,#70,#52,#00,#01,#07,#01,#79
    DB #01,#97,#02,#77,#09,#99,#05,#66,#01,#70,#01,#07,#01,#77,#02,#00
    DB #01,#07,#01,#79,#01,#97,#02,#77,#09,#99,#05,#66,#01,#70,#01,#07
    DB #01,#77,#52,#00,#01,#07,#01,#99,#01,#96,#01,#76,#01,#69,#0A,#99
    DB #01,#96,#03,#66,#01,#77,#01,#00,#01,#70,#02,#00,#01,#07,#01,#99
    DB #01,#96,#01,#76,#01,#69,#0A,#99,#01,#96,#03,#66,#01,#77,#01,#00
    DB #01,#70,#52,#00,#01,#76,#02,#99,#01,#69,#0A,#99,#01,#96,#04,#66
    DB #01,#67,#01,#77,#01,#70,#02,#00,#01,#76,#02,#99,#01,#69,#0A,#99
    DB #01,#96,#04,#66,#01,#67,#01,#77,#01,#70,#52,#00,#01,#69,#0E,#99
    DB #01,#69,#04,#66,#01,#70,#01,#76,#02,#00,#01,#69,#0E,#99,#01,#69
    DB #04,#66,#01,#70,#01,#76,#51,#00,#01,#07,#01,#69,#06,#99,#01,#67
    DB #01,#77,#01,#69,#04,#99,#01,#96,#04,#66,#01,#67,#01,#77,#01,#07
    DB #01,#00,#01,#07,#01,#69,#06,#99,#01,#67,#01,#77,#01,#69,#04,#99
    DB #01,#96,#04,#66,#01,#67,#01,#77,#01,#07,#51,#00,#01,#07,#01,#66
    DB #05,#99,#01,#67,#01,#76,#02,#66,#05,#99,#01,#96,#04,#66,#01,#77
    DB #01,#70,#01,#00,#01,#07,#01,#66,#05,#99,#01,#67,#01,#76,#02,#66
    DB #05,#99,#01,#96,#04,#66,#01,#77,#01,#70,#51,#00,#01,#07,#01,#77
    DB #01,#69,#03,#99,#01,#97,#01,#76,#08,#99,#01,#96,#03,#66,#01,#67
    DB #01,#77,#01,#70,#01,#00,#01,#07,#01,#77,#01,#69,#03,#99,#01,#97
    DB #01,#76,#08,#99,#01,#96,#03,#66,#01,#67,#01,#77,#01,#70,#51,#00
    DB #01,#07,#01,#99,#01,#79,#03,#99,#01,#77,#09,#99,#01,#96,#04,#66
    DB #01,#77,#02,#00,#01,#07,#01,#99,#01,#79,#03,#99,#01,#77,#09,#99
    DB #01,#96,#04,#66,#01,#77,#52,#00,#01,#07,#01,#69,#01,#96,#01,#99
    DB #01,#96,#01,#60,#01,#69,#09,#99,#05,#66,#01,#77,#01,#70,#01,#00
    DB #01,#07,#01,#69,#01,#96,#01,#99,#01,#96,#01,#60,#01,#69,#09,#99
    DB #05,#66,#01,#77,#01,#70,#52,#00,#01,#76,#01,#67,#02,#99,#01,#66
    DB #01,#96,#01,#69,#01,#99,#01,#66,#06,#99,#01,#66,#01,#76,#01,#99
    DB #01,#67,#01,#66,#01,#77,#03,#00,#01,#76,#01,#67,#02,#99,#01,#66
    DB #01,#96,#01,#69,#01,#99,#01,#66,#06,#99,#01,#66,#01,#76,#01,#99
    DB #01,#67,#01,#66,#01,#77,#53,#00,#01,#70,#01,#96,#01,#69,#01,#99
    DB #01,#96,#01,#76,#01,#11,#01,#07,#01,#19,#01,#79,#04,#99,#01,#96
    DB #01,#66,#03,#99,#01,#77,#02,#70,#02,#00,#01,#70,#01,#96,#01,#69
    DB #01,#99,#01,#96,#01,#76,#01,#11,#01,#07,#01,#19,#01,#79,#04,#99
    DB #01,#96,#01,#66,#03,#99,#01,#77,#02,#70,#52,#00,#01,#77,#01,#F7
    DB #01,#69,#01,#99,#01,#97,#01,#60,#01,#F7,#01,#7F,#01,#00,#01,#79
    DB #04,#99,#01,#96,#01,#69,#01,#96,#01,#77,#01,#99,#01,#67,#01,#70
    DB #03,#00,#01,#77,#01,#F7,#01,#69,#01,#99,#01,#97,#01,#60,#01,#F7
    DB #01,#7F,#01,#00,#01,#79,#04,#99,#01,#96,#01,#69,#01,#96,#01,#77
    DB #01,#99,#01,#67,#01,#70,#52,#00,#01,#06,#01,#66,#01,#7F,#01,#69
    DB #02,#99,#01,#0F,#01,#F7,#01,#7F,#01,#F0,#01,#79,#06,#99,#02,#66
    DB #01,#69,#01,#97,#01,#77,#02,#00,#01,#06,#01,#66,#01,#7F,#01,#69
    DB #02,#99,#01,#0F,#01,#F7,#01,#7F,#01,#F0,#01,#79,#06,#99,#02,#66
    DB #01,#69,#01,#97,#01,#77,#52,#00,#01,#66,#01,#99,#01,#66,#03,#99
    DB #01,#90,#01,#09,#01,#67,#01,#66,#06,#99,#01,#96,#01,#79,#02,#99
    DB #01,#97,#01,#07,#02,#00,#01,#66,#01,#99,#01,#66,#03,#99,#01,#90
    DB #01,#09,#01,#67,#01,#66,#06,#99,#01,#96,#01,#79,#02,#99,#01,#97
    DB #01,#07,#52,#00,#01,#79,#01,#96,#0A,#99,#01,#79,#03,#99,#01,#97
    DB #01,#16,#02,#99,#01,#97,#01,#70,#02,#00,#01,#79,#01,#96,#0A,#99
    DB #01,#79,#03,#99,#01,#97,#01,#16,#02,#99,#01,#97,#01,#70,#51,#00
    DB #01,#07,#01,#69,#01,#96,#01,#69,#0A,#99,#01,#E7,#02,#99,#01,#96
    DB #01,#16,#01,#69,#01,#99,#01,#67,#01,#60,#01,#00,#01,#07,#01,#69
    DB #01,#96,#01,#69,#0A,#99,#01,#E7,#02,#99,#01,#96,#01,#16,#01,#69
    DB #01,#99,#01,#67,#01,#60,#51,#00,#01,#07,#01,#69,#01,#99,#01,#96
    DB #01,#66,#04,#99,#01,#96,#03,#99,#02,#79,#02,#99,#01,#96,#01,#66
    DB #02,#99,#01,#77,#02,#00,#01,#07,#01,#69,#01,#99,#01,#96,#01,#66
    DB #08,#99,#02,#79,#02,#99,#01,#96,#01,#66,#02,#99,#01,#77,#52,#00
    DB #01,#07,#01,#69,#07,#99,#01,#66,#01,#69,#09,#99,#01,#96,#01,#70
    DB #02,#00,#01,#07,#01,#69,#12,#99,#01,#96,#01,#70,#52,#00,#01,#07
    DB #01,#69,#06,#99,#01,#96,#08,#99,#01,#96,#02,#99,#01,#67,#03,#00
    DB #01,#07,#01,#69,#04,#99,#02,#77,#09,#99,#01,#96,#02,#99,#01,#67
    DB #54,#00,#01,#69,#05,#99,#01,#66,#09,#99,#01,#66,#01,#69,#01,#67
    DB #01,#70,#04,#00,#01,#69,#03,#99,#01,#97,#02,#77,#01,#79,#08,#99
    DB #01,#66,#01,#69,#01,#67,#01,#70,#54,#00,#01,#76,#02,#99,#02,#66
    DB #01,#69,#09,#99,#01,#67,#01,#76,#02,#77,#05,#00,#01,#76,#03,#99
    DB #01,#97,#03,#77,#07,#99,#01,#67,#01,#76,#02,#77,#55,#00,#01,#07
    DB #0E,#99,#01,#67,#01,#09,#01,#66,#01,#67,#05,#00,#01,#07,#03,#99
    DB #01,#97,#03,#77,#01,#79,#06,#99,#01,#67,#01,#09,#01,#66,#01,#67
    DB #56,#00,#01,#76,#0C,#99,#01,#96,#02,#77,#01,#66,#01,#70,#06,#00
    DB #01,#76,#03,#99,#03,#77,#01,#79,#05,#99,#01,#96,#02,#77,#01,#66
    DB #01,#70,#56,#00,#01,#07,#01,#69,#0B,#99,#01,#66,#01,#70,#01,#07
    DB #01,#77,#07,#00,#01,#07,#01,#69,#03,#99,#02,#77,#01,#79,#05,#99
    DB #01,#66,#01,#70,#01,#07,#01,#77,#58,#00,#01,#76,#0A,#99,#01,#66
    DB #01,#70,#0B,#00,#01,#76,#04,#99,#01,#77,#05,#99,#01,#66,#01,#70
    DB #5B,#00,#01,#07,#01,#76,#08,#99,#01,#67,#01,#70,#0C,#00,#01,#07
    DB #01,#76,#08,#99,#01,#67,#01,#70,#5D,#00,#01,#07,#01,#76,#01,#69
    DB #04,#99,#01,#66,#01,#67,#01,#70,#0E,#00,#01,#07,#01,#76,#01,#69
    DB #04,#99,#01,#66,#01,#67,#01,#70,#5F,#00,#01,#07,#01,#76,#01,#77
    DB #02,#76,#02,#77,#01,#70,#10,#00,#01,#07,#01,#76,#01,#77,#02,#76
    DB #02,#77,#01,#70,#65,#00,#01,#76,#01,#60,#16,#00,#01,#76,#01,#60
    DB #66,#00,#01,#66,#01,#EE,#01,#70,#02,#00,#01,#70,#12,#00,#01,#66
    DB #01,#EE,#01,#70,#02,#00,#01,#70,#62,#00,#01,#70,#01,#6E,#01,#E0
    DB #01,#00,#02,#77,#12,#00,#01,#70,#01,#6E,#01,#E0,#01,#00,#02,#77
    DB #5F,#00,#01,#77,#01,#70,#02,#00,#01,#7E,#01,#E7,#01,#00,#01,#70
    DB #01,#07,#0F,#00,#01,#77,#01,#70,#02,#00,#01,#7E,#01,#E7,#01,#00
    DB #01,#70,#01,#07,#5E,#00,#01,#07,#02,#70,#02,#00,#01,#7E,#01,#E7
    DB #01,#07,#01,#70,#01,#00,#01,#07,#01,#77,#01,#70,#0B,#00,#01,#07
    DB #02,#70,#02,#00,#01,#7E,#01,#E7,#01,#07,#01,#70,#01,#00,#01,#07
    DB #01,#77,#01,#70,#5D,#00,#01,#77,#01,#6E,#01,#67,#01,#EE,#01,#E7
    DB #01,#67,#01,#00,#01,#07,#01,#6F,#01,#FE,#01,#60,#0D,#00,#01,#77
    DB #01,#6E,#01,#67,#01,#EE,#01,#E7,#01,#67,#01,#00,#01,#07,#01,#6F
    DB #01,#FE,#01,#60,#59,#00,#01,#07,#01,#77,#01,#66,#01,#00,#01,#6E
    DB #01,#FF,#01,#FE,#01,#EF,#02,#66,#01,#E6,#01,#76,#01,#FF,#01,#E7
    DB #01,#70,#09,#00,#01,#07,#01,#77,#01,#66,#01,#00,#01,#6E,#01,#FF
    DB #01,#FE,#01,#EF,#02,#66,#01,#E6,#01,#76,#01,#FF,#01,#E7,#01,#70
    DB #59,#00,#01,#77,#01,#7E,#01,#FF,#01,#EE,#03,#FF,#01,#EE,#01,#6E
    DB #02,#EE,#01,#EF,#01,#EE,#0B,#00,#01,#77,#01,#7E,#01,#FF,#01,#EE
    DB #03,#FF,#01,#EE,#01,#6E,#02,#EE,#01,#EF,#01,#EE,#5B,#00,#01,#70
    DB #01,#7E,#01,#EF,#04,#FF,#01,#EE,#01,#6E,#01,#EE,#01,#EF,#01,#FE
    DB #01,#E7,#01,#76,#0A,#00,#01,#70,#01,#7E,#01,#EF,#04,#FF,#01,#EE
    DB #01,#6E,#01,#EE,#01,#EF,#01,#FE,#01,#E7,#01,#76,#5B,#00,#01,#06
    DB #01,#EE,#03,#FF,#01,#FE,#01,#EE,#01,#6E,#01,#EF,#01,#FF,#03,#EE
    DB #01,#70,#0A,#00,#01,#06,#01,#EE,#03,#FF,#01,#FE,#01,#EE,#01,#6E
    DB #01,#EF,#01,#FF,#03,#EE,#01,#70,#5A,#00,#01,#76,#01,#EE,#01,#EF
    DB #03,#FF,#01,#E6,#01,#EE,#01,#FF,#04,#EE,#01,#67,#01,#00,#01,#6E
    DB #01,#60,#07,#00,#01,#76,#01,#EE,#01,#EF,#03,#FF,#01,#E6,#01,#EE
    DB #01,#FF,#04,#EE,#01,#67,#01,#00,#01,#6E,#01,#60,#57,#00,#01,#6E
    DB #01,#EE,#01,#FE,#02,#FF,#01,#FE,#01,#E6,#01,#EE,#01,#FE,#01,#EE
    DB #01,#EF,#01,#FE,#02,#EE,#01,#76,#01,#E6,#01,#66,#07,#00,#01,#6E
    DB #01,#EE,#01,#FE,#02,#FF,#01,#FE,#01,#E6,#01,#EE,#01,#FE,#01,#EE
    DB #01,#EF,#01,#FE,#02,#EE,#01,#76,#01,#E6,#01,#66,#55,#00,#01,#66
    DB #01,#00,#01,#EE,#01,#EF,#02,#EE,#01,#FF,#01,#FE,#01,#EE,#01,#EF
    DB #02,#EE,#01,#EF,#01,#FF,#01,#EE,#01,#E6,#01,#6E,#01,#67,#01,#07
    DB #01,#70,#04,#00,#01,#66,#01,#00,#01,#EE,#01,#EF,#02,#EE,#01,#FF
    DB #01,#FE,#01,#EE,#01,#EF,#02,#EE,#01,#EF,#01,#FF,#01,#EE,#01,#E6
    DB #01,#6E,#01,#67,#01,#07,#01,#70,#53,#00,#01,#6E,#01,#FF,#01,#E6
    DB #01,#EE,#01,#FE,#01,#E6,#01,#EE,#01,#EF,#01,#FE,#05,#EE,#01,#EF
    DB #02,#FF,#01,#FE,#01,#70,#05,#00,#01,#6E,#01,#FF,#01,#E6,#01,#EE
    DB #01,#FE,#01,#E6,#01,#EE,#01,#EF,#01,#FE,#05,#EE,#01,#EF,#02,#FF
    DB #01,#FE,#01,#70,#54,#00,#01,#07,#02,#EE,#01,#FF,#01,#EE,#01,#FE
    DB #02,#66,#01,#EF,#07,#EE,#01,#FF,#01,#FE,#01,#E6,#01,#67,#04,#00
    DB #01,#07,#02,#EE,#01,#FF,#01,#EE,#01,#FE,#02,#66,#01,#EF,#07,#EE
    DB #01,#FF,#01,#FE,#01,#E6,#01,#67,#54,#00,#01,#0E,#01,#60,#01,#6E
    DB #02,#EE,#01,#FE,#02,#66,#01,#6E,#02,#EE,#01,#9F,#02,#99,#01,#EE
    DB #01,#EF,#01,#FF,#01,#FE,#01,#66,#01,#67,#04,#00,#01,#0E,#01,#60
    DB #01,#6E,#02,#EE,#01,#FE,#02,#66,#01,#6E,#02,#EE,#01,#9F,#02,#99
    DB #01,#EE,#01,#EF,#01,#FF,#01,#FE,#01,#66,#01,#67,#54,#00,#01,#07
    DB #01,#70,#01,#06,#01,#EE,#01,#FF,#01,#FE,#01,#66,#01,#69,#01,#9E
    DB #01,#EE,#02,#9F,#01,#F9,#01,#99,#01,#9E,#01,#EF,#02,#FF,#01,#EE
    DB #01,#6E,#01,#E6,#03,#00,#01,#07,#01,#70,#01,#06,#01,#EE,#01,#FF
    DB #01,#FE,#01,#66,#01,#69,#01,#9E,#01,#EE,#02,#9F,#01,#F9,#01,#99
    DB #01,#9E,#01,#EF,#02,#FF,#01,#EE,#01,#6E,#01,#E6,#53,#00,#01,#07
    DB #01,#00,#01,#76,#01,#EF,#02,#FE,#01,#66,#02,#99,#01,#9F,#04,#99
    DB #01,#9E,#01,#EE,#03,#FF,#01,#FE,#01,#EE,#01,#60,#02,#00,#01,#07
    DB #01,#00,#01,#76,#01,#EF,#02,#FE,#01,#66,#02,#99,#01,#9F,#04,#99
    DB #01,#9E,#01,#EE,#03,#FF,#01,#FE,#01,#EE,#01,#60,#52,#00,#01,#77
    DB #01,#07,#01,#6E,#02,#EE,#01,#FE,#01,#6E,#04,#99,#01,#9F,#01,#FE
    DB #01,#E9,#01,#99,#01,#EE,#01,#EF,#02,#EE,#01,#E6,#01,#76,#01,#E7
    DB #02,#00,#01,#77,#01,#07,#01,#6E,#02,#EE,#01,#FE,#01,#6E,#04,#99
    DB #01,#9F,#01,#FE,#01,#E9,#01,#99,#01,#EE,#01,#EF,#02,#EE,#01,#E6
    DB #01,#76,#01,#E7,#51,#00,#02,#70,#01,#0E,#03,#EE,#01,#E6,#01,#6E
    DB #02,#99,#01,#F9,#02,#99,#02,#EE,#01,#99,#01,#EE,#01,#EF,#01,#FE
    DB #01,#EE,#01,#E7,#01,#00,#01,#67,#01,#00,#02,#70,#01,#0E,#03,#EE
    DB #01,#E6,#01,#6E,#02,#99,#01,#F9,#02,#99,#02,#EE,#01,#99,#01,#EE
    DB #01,#EF,#01,#FE,#01,#EE,#01,#E7,#01,#00,#01,#67,#51,#00,#01,#77
    DB #01,#00,#01,#0E,#01,#EE,#01,#EF,#01,#E6,#01,#76,#01,#9F,#04,#99
    DB #01,#FE,#01,#E6,#01,#76,#01,#E9,#01,#EE,#01,#EF,#01,#FF,#01,#FE
    DB #01,#EE,#01,#60,#02,#00,#01,#77,#01,#00,#01,#0E,#01,#EE,#01,#EF
    DB #01,#E6,#01,#76,#01,#9F,#04,#99,#01,#FE,#01,#E6,#01,#76,#01,#E9
    DB #01,#EE,#01,#EF,#01,#FF,#01,#FE,#01,#EE,#01,#60,#55,#00,#01,#EE
    DB #01,#FE,#01,#E6,#01,#7E,#01,#66,#01,#EF,#02,#9E,#01,#9F,#01,#EE
    DB #01,#66,#01,#99,#01,#69,#02,#EE,#02,#FF,#01,#FE,#01,#60,#01,#77
    DB #04,#00,#01,#EE,#01,#FE,#01,#E6,#01,#7E,#01,#66,#01,#EF,#02,#9E
    DB #01,#9F,#01,#EE,#01,#66,#01,#99,#01,#69,#02,#EE,#02,#FF,#01,#FE
    DB #01,#60,#01,#77,#53,#00,#01,#07,#01,#EE,#01,#FE,#01,#E6,#01,#66
    DB #01,#76,#01,#EE,#01,#F9,#01,#99,#01,#FF,#01,#66,#01,#6E,#01,#9F
    DB #01,#99,#01,#EE,#01,#FF,#01,#EE,#02,#FF,#01,#E6,#01,#07,#01,#70
    DB #02,#00,#01,#07,#01,#EE,#01,#FE,#01,#E6,#01,#66,#01,#76,#01,#EE
    DB #01,#F9,#01,#99,#01,#FF,#01,#66,#01,#6E,#01,#9F,#01,#99,#01,#EE
    DB #01,#FF,#01,#EE,#02,#FF,#01,#E6,#01,#07,#01,#70,#51,#00,#01,#07
    DB #01,#6E,#01,#EE,#01,#FE,#01,#E6,#01,#66,#01,#9E,#01,#66,#01,#E9
    DB #01,#99,#01,#EE,#01,#67,#01,#66,#01,#69,#01,#99,#01,#EE,#01,#EF
    DB #01,#FF,#01,#EF,#01,#FF,#01,#EE,#01,#70,#02,#00,#01,#07,#01,#6E
    DB #01,#EE,#01,#FE,#01,#E6,#01,#66,#01,#9E,#01,#66,#01,#E9,#01,#99
    DB #01,#EE,#01,#67,#01,#66,#01,#69,#01,#99,#01,#EE,#01,#EF,#01,#FF
    DB #01,#EF,#01,#FF,#01,#EE,#01,#70,#52,#00,#01,#6E,#01,#EF,#01,#FF
    DB #01,#EE,#01,#E6,#01,#69,#01,#99,#01,#67,#01,#6E,#01,#99,#01,#66
    DB #01,#76,#02,#66,#01,#99,#01,#E6,#01,#EE,#01,#FF,#01,#FE,#02,#EE
    DB #01,#E7,#02,#00,#01,#6E,#01,#EF,#01,#FF,#01,#EE,#01,#E6,#01,#69
    DB #01,#99,#01,#67,#01,#6E,#01,#99,#01,#66,#01,#76,#02,#66,#01,#99
    DB #01,#E6,#01,#EE,#01,#FF,#01,#FE,#02,#EE,#01,#E7,#51,#00,#01,#07
    DB #04,#EE,#01,#E6,#01,#69,#01,#96,#01,#66,#01,#7E,#01,#99,#01,#96
    DB #01,#66,#01,#EF,#01,#E7,#01,#69,#01,#97,#02,#EE,#01,#EF,#01,#FE
    DB #01,#6E,#01,#EE,#01,#70,#01,#07,#04,#EE,#01,#E6,#01,#69,#01,#96
    DB #01,#66,#01,#7E,#01,#99,#01,#96,#01,#66,#01,#EF,#01,#E7,#01,#69
    DB #01,#97,#02,#EE,#01,#EF,#01,#FE,#01,#6E,#01,#EE,#01,#70,#50,#00
    DB #01,#06,#01,#E6,#01,#76,#01,#6E,#01,#FE,#01,#EE,#01,#69,#03,#66
    DB #01,#99,#01,#96,#01,#6F,#01,#FF,#01,#FE,#01,#69,#01,#97,#01,#6E
    DB #01,#EE,#01,#66,#01,#EE,#01,#66,#01,#EE,#01,#E7,#01,#06,#01,#E6
    DB #01,#76,#01,#6E,#01,#FE,#01,#EE,#01,#69,#03,#66,#01,#99,#01,#96
    DB #01,#6F,#01,#FF,#01,#FE,#01,#69,#01,#97,#01,#6E,#01,#EE,#01,#66
    DB #01,#EE,#01,#66,#01,#EE,#01,#E7,#50,#00,#01,#07,#01,#E7,#01,#00
    DB #01,#6F,#01,#FE,#01,#E6,#01,#66,#01,#7E,#01,#FF,#01,#66,#01,#E9
    DB #01,#96,#01,#EF,#01,#FE,#01,#FF,#01,#7E,#01,#76,#03,#66,#01,#6E
    DB #01,#E7,#01,#77,#01,#70,#01,#07,#01,#E7,#01,#00,#01,#6F,#01,#FE
    DB #01,#E6,#01,#66,#01,#7E,#01,#FF,#01,#66,#01,#E9,#01,#96,#01,#EF
    DB #01,#FE,#01,#FF,#01,#7E,#01,#76,#03,#66,#01,#6E,#01,#E7,#01,#77
    DB #01,#70,#50,#00,#01,#07,#01,#70,#01,#00,#02,#EE,#02,#66,#01,#7F
    DB #01,#FF,#01,#F6,#01,#69,#01,#96,#01,#EE,#01,#E7,#01,#EE,#01,#67
    DB #01,#66,#01,#6E,#02,#66,#01,#6E,#01,#E6,#01,#77,#01,#00,#01,#07
    DB #01,#70,#01,#00,#02,#EE,#02,#66,#01,#7F,#01,#FF,#01,#F6,#01,#69
    DB #01,#96,#01,#EE,#01,#E7,#01,#EE,#01,#67,#01,#66,#01,#6E,#02,#66
    DB #01,#6E,#01,#E6,#01,#77,#52,#00,#01,#77,#01,#00,#01,#EE,#02,#E6
    DB #01,#66,#01,#6F,#01,#FE,#02,#77,#01,#76,#01,#6E,#01,#EF,#01,#E6
    DB #01,#76,#01,#66,#01,#E6,#03,#66,#01,#E6,#01,#77,#01,#70,#01,#00
    DB #01,#77,#01,#00,#01,#EE,#02,#E6,#01,#66,#01,#6F,#01,#FE,#02,#77
    DB #01,#76,#01,#6E,#01,#EF,#01,#E6,#01,#76,#01,#66,#01,#E6,#03,#66
    DB #01,#E6,#01,#77,#01,#70,#51,#00,#01,#77,#01,#07,#01,#EE,#02,#66
    DB #03,#77,#01,#76,#01,#66,#04,#77,#01,#66,#01,#EE,#02,#66,#01,#E6
    DB #01,#66,#01,#EE,#01,#60,#01,#77,#01,#00,#01,#77,#01,#07,#01,#EE
    DB #02,#66,#03,#77,#01,#76,#01,#66,#04,#77,#01,#66,#01,#EE,#02,#66
    DB #01,#E6,#01,#66,#01,#EE,#01,#60,#01,#77,#51,#00,#01,#70,#01,#00
    DB #01,#E6,#01,#66,#04,#77,#01,#76,#01,#EE,#01,#67,#03,#77,#01,#66
    DB #01,#99,#02,#6E,#01,#96,#01,#66,#01,#6E,#01,#E7,#01,#77,#01,#00
    DB #01,#70,#01,#00,#01,#E6,#01,#66,#04,#77,#01,#76,#01,#EE,#01,#67
    DB #03,#77,#01,#66,#01,#99,#02,#6E,#01,#96,#01,#66,#01,#6E,#01,#E7
    DB #01,#77,#50,#00,#01,#77,#01,#70,#01,#06,#01,#E7,#01,#66,#01,#67
    DB #03,#77,#01,#79,#01,#99,#01,#67,#01,#77,#01,#7E,#01,#77,#01,#69
    DB #01,#99,#01,#6E,#01,#69,#01,#66,#01,#6E,#01,#77,#01,#E7,#01,#00
    DB #01,#77,#01,#70,#01,#06,#01,#E7,#01,#66,#01,#67,#03,#77,#01,#79
    DB #01,#99,#01,#67,#01,#77,#01,#7E,#01,#77,#01,#69,#01,#99,#01,#6E
    DB #01,#69,#01,#66,#01,#6E,#01,#77,#01,#E7,#53,#00,#01,#06,#01,#67
    DB #01,#76,#01,#67,#01,#77,#01,#F7,#01,#77,#01,#E9,#01,#99,#01,#67
    DB #01,#77,#01,#7F,#01,#77,#01,#E9,#01,#9E,#01,#69,#01,#9E,#01,#66
    DB #01,#E6,#01,#00,#01,#E7,#03,#00,#01,#06,#01,#67,#01,#76,#01,#67
    DB #01,#77,#01,#F7,#01,#77,#01,#E9,#01,#99,#01,#67,#01,#77,#01,#7F
    DB #01,#77,#01,#E9,#01,#9E,#01,#69,#01,#9E,#01,#66,#01,#E6,#01,#00
    DB #01,#E7,#53,#00,#01,#06,#01,#60,#01,#06,#01,#66,#01,#77,#01,#F9
    DB #01,#77,#03,#99,#01,#67,#01,#77,#01,#7E,#01,#99,#01,#96,#03,#66
    DB #01,#E7,#01,#07,#01,#67,#03,#00,#01,#06,#01,#60,#01,#06,#01,#66
    DB #01,#77,#01,#F9,#01,#77,#03,#99,#01,#67,#01,#77,#01,#7E,#01,#99
    DB #01,#96,#03,#66,#01,#E7,#01,#07,#01,#67,#53,#00,#01,#07,#01,#67
    DB #01,#07,#01,#76,#02,#77,#01,#76,#02,#99,#01,#96,#01,#69,#01,#9E
    DB #01,#66,#01,#99,#01,#E6,#01,#67,#02,#66,#01,#67,#01,#76,#01,#70
    DB #03,#00,#01,#07,#01,#67,#01,#07,#01,#76,#02,#77,#01,#76,#02,#99
    DB #01,#96,#01,#69,#01,#9E,#01,#66,#01,#99,#01,#E6,#01,#67,#02,#66
    DB #01,#67,#01,#76,#01,#70,#54,#00,#01,#76,#01,#00,#01,#07,#01,#76
    DB #01,#99,#01,#66,#02,#99,#01,#66,#01,#99,#01,#F9,#01,#E7,#01,#99
    DB #01,#96,#01,#77,#02,#66,#01,#00,#01,#77,#05,#00,#01,#76,#01,#00
    DB #01,#07,#01,#76,#01,#99,#01,#66,#02,#99,#01,#66,#02,#99,#01,#E7
    DB #01,#99,#01,#96,#01,#77,#02,#66,#01,#00,#01,#77,#55,#00,#01,#76
    DB #01,#00,#01,#06,#01,#77,#02,#66,#01,#69,#01,#96,#01,#69,#01,#FF
    DB #01,#99,#01,#6E,#01,#99,#01,#97,#01,#76,#01,#66,#01,#E6,#01,#00
    DB #01,#77,#01,#70,#04,#00,#01,#76,#01,#00,#01,#06,#01,#77,#02,#66
    DB #01,#69,#01,#96,#01,#69,#01,#99,#01,#11,#01,#1E,#01,#99,#01,#97
    DB #01,#76,#01,#66,#01,#E6,#01,#00,#01,#77,#01,#70,#53,#00,#01,#07
    DB #01,#77,#01,#00,#01,#76,#02,#06,#03,#66,#01,#E9,#01,#F9,#01,#E6
    DB #02,#99,#01,#E7,#01,#76,#01,#E6,#01,#60,#02,#00,#01,#70,#03,#00
    DB #01,#07,#01,#77,#01,#00,#01,#76,#02,#06,#03,#66,#01,#E9,#02,#11
    DB #01,#19,#01,#99,#01,#E7,#01,#76,#01,#E6,#01,#60,#02,#00,#01,#70
    DB #53,#00,#01,#70,#02,#00,#01,#70,#01,#07,#01,#06,#01,#96,#01,#66
    DB #01,#69,#01,#99,#01,#E6,#01,#69,#02,#99,#01,#67,#01,#76,#01,#67
    DB #01,#66,#01,#00,#01,#07,#01,#70,#03,#00,#01,#70,#02,#00,#01,#70
    DB #01,#07,#01,#06,#01,#96,#01,#66,#01,#69,#01,#91,#02,#11,#01,#19
    DB #01,#99,#01,#67,#01,#76,#01,#67,#01,#66,#01,#00,#01,#07,#01,#70
    DB #53,#00,#01,#70,#02,#00,#01,#77,#02,#00,#04,#66,#01,#69,#01,#9F
    DB #01,#99,#01,#96,#01,#76,#01,#77,#01,#00,#01,#76,#01,#60,#05,#00
    DB #01,#70,#02,#00,#01,#77,#02,#00,#02,#66,#01,#61,#03,#11,#01,#99
    DB #01,#96,#01,#76,#01,#77,#01,#00,#01,#76,#01,#60,#58,#00,#01,#07
    DB #01,#70,#01,#00,#01,#7E,#01,#EE,#01,#6E,#02,#99,#01,#FF,#01,#99
    DB #01,#E7,#01,#00,#01,#77,#01,#00,#01,#07,#01,#70,#08,#00,#01,#07
    DB #01,#70,#01,#00,#01,#7E,#01,#EE,#01,#61,#03,#11,#01,#99,#01,#E7
    DB #01,#00,#01,#77,#01,#00,#01,#07,#01,#70,#58,#00,#01,#07,#01,#70
    DB #01,#00,#01,#06,#01,#69,#02,#EE,#01,#99,#01,#F9,#01,#99,#01,#70
    DB #03,#00,#01,#77,#01,#70,#08,#00,#01,#07,#01,#70,#01,#00,#01,#06
    DB #01,#69,#01,#E9,#02,#11,#02,#99,#01,#70,#03,#00,#01,#77,#01,#70
    DB #58,#00,#01,#77,#02,#00,#01,#07,#01,#69,#02,#99,#01,#9F,#01,#99
    DB #01,#E7,#04,#00,#01,#70,#09,#00,#01,#77,#02,#00,#01,#07,#01,#69
    DB #04,#99,#01,#E7,#04,#00,#01,#70,#5D,#00,#01,#69,#02,#FF,#01,#F9
    DB #01,#E6,#05,#00,#01,#77,#0D,#00,#01,#69,#03,#99,#01,#E6,#05,#00
    DB #01,#77,#5D,#00,#01,#69,#02,#FF,#01,#F9,#01,#60,#13,#00,#01,#69
    DB #01,#99,#01,#FF,#01,#99,#01,#60,#63,#00,#01,#76,#02,#99,#01,#E6
    DB #01,#70,#13,#00,#01,#76,#02,#99,#01,#E6,#01,#70,#63,#00,#01,#07
    DB #01,#67,#01,#66,#01,#70,#14,#00,#01,#07,#01,#67,#01,#66,#01,#70
    DB #5B,#00
bitmap_dlg_gfx_rle_chunk_1_end:

BITMAP_ROOM_DATA_BANK_14_USED_END:
    ds 1694, #FF
    org BITMAP_ROOM_DATA_BANK_14_PHYS_START + #2000
    end
