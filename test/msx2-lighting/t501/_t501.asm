; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap room backend (V9938 Graphic 4 command engine)
; Project: test501
; Room: caverna1
; Screen mode: SCREEN 5 (VDP Graphic 4, CHGMOD 5)
; Backend: screen5 (bitmap rooms)
; ROM Mode: megarom
; Mapper Target: konami
; Auto MegaROM: No
; NOTE: Bitmap-room SCREEN 5 RLE sources are read through Konami P2/#8000 data banks.
; Visible page: VRAM #0000, 128 bytes/row, 212 lines
; Bitmap room HUD height: 20 px
; Bitmap room HUD widgets: 4
; Bitmap room game area: 256x192 at visual Y=20
; Bitmap room game band VRAM base: #0A00
; World rooms: 7; start room index: 0
; Shared tileset bytes: 8192 at VRAM #10000
; MSX2_GAMEFLOW_INTRO_SCENES: 1
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
ENASLT  EQU #0024
GTSTCK  EQU #00DC
GTTRIG  EQU #00D8
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
bitmap_room_hud_linked_0_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_hud_linked_1_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_render_0_p0_DATA_BANK EQU 5
bitmap_room_render_0_p1_DATA_BANK EQU 5
bitmap_room_collision_0_DATA_BANK EQU 5
bitmap_room_behavior_0_DATA_BANK EQU 5
bitmap_room_render_1_p0_DATA_BANK EQU 6
bitmap_room_render_1_p1_DATA_BANK EQU 6
bitmap_room_collision_1_DATA_BANK EQU 6
bitmap_room_behavior_1_DATA_BANK EQU 6
bitmap_room_render_2_p0_DATA_BANK EQU 7
bitmap_room_render_2_p1_DATA_BANK EQU 7
bitmap_room_collision_2_DATA_BANK EQU 7
bitmap_room_behavior_2_DATA_BANK EQU 7
bitmap_room_render_3_p0_DATA_BANK EQU 8
bitmap_room_render_3_p1_DATA_BANK EQU 8
bitmap_room_collision_3_DATA_BANK EQU 8
bitmap_room_behavior_3_DATA_BANK EQU 8
bitmap_room_render_4_p0_DATA_BANK EQU 9
bitmap_room_render_4_p1_DATA_BANK EQU 9
bitmap_room_collision_4_DATA_BANK EQU 9
bitmap_room_behavior_4_DATA_BANK EQU 9
bitmap_room_render_5_p0_DATA_BANK EQU 10
bitmap_room_render_5_p1_DATA_BANK EQU 10
bitmap_room_collision_5_DATA_BANK EQU 10
bitmap_room_behavior_5_DATA_BANK EQU 10
bitmap_room_render_6_p0_DATA_BANK EQU 11
bitmap_room_render_6_p1_DATA_BANK EQU 11
bitmap_room_collision_6_DATA_BANK EQU 11
bitmap_room_behavior_6_DATA_BANK EQU 11
bitmap_intro_scene0_rle_chunk_0_DATA_BANK EQU 12
bitmap_intro_scene0_rle_chunk_1_DATA_BANK EQU 13
bitmap_room_sprite_patterns_DATA_BANK EQU 13


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
; Frame/state key whose player sprite colours are currently in VRAM (#F400).
; Bit 7 marks the intense glowing-tail palette; low bits hold the absolute frame.
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
; --- COYOTE / JUMP BUFFER timers (skillParameters.jump) ---
player_coyote_timer  EQU #C00E
player_jump_buffer_t EQU #C00F
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
; Shared GameFlow exit request. Exit World contact sets the semantic name; the deadly/
; enemy system keeps its game-over alias when player_lives reaches 0. The gameplay loop
; checks this byte every frame and returns to the GameFlow dispatcher, which follows the
; active WorldLink's default connection. Standalone bitmap projects soft-restart instead.
; Always emitted (harmless zero); lives in the last free safe-gap byte before blink_phase.
bitmap_gameflow_exit_flag         EQU #C1F8
bitmap_game_over_flag             EQU bitmap_gameflow_exit_flag
; Active-world local room index for reusable SCREEN 5 pickup/boss pools.
bitmap_room_pool_index             EQU #C1FC
; Sub-pixel gravity accumulator (low byte of the 8.8 gravityStrength from the Player
; Config). Added to player_vy_frac every frame; player_vy only rises by 1 when this
; carries, so the fall/jump arc accelerates gradually like SCREEN 4 (default 0.25
; px/frame^2) instead of the old fixed 1 px/frame^2 nudge.
player_vy_frac                    EQU #C0D9





; --- SHOOT skill runtime state (8 bytes) ---
bitmap_bullet_pool     EQU #C0DA
bitmap_shoot_cooldown  EQU #C0DF
bitmap_shoot_lock      EQU #C0E0
bitmap_bullet_borrow_group EQU #C0E1









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
hud_dec3_buffer EQU #D005
; Linked HUD icon row #0 (hud_el_1783004114045_6h49y_mina), bound to "playerEnergy".
hud_linked_0_drawn EQU #D000
; Linked HUD counter #1 (hud_el_1783009772122_go9ku_mina), bound to "collectibles" [8-bit, 2 digits].
hud_linked_1_drawn EQU #D001
hud_linked_1_value EQU #D002
; Linked HUD counter #2 (hud_el_1783527996153_k7cbd_mina), bound to "keyItem" [8-bit, 2 digits].
hud_linked_2_drawn EQU #D003
; Linked HUD counter #3 (hud_el_1786208135817_504rh_mina), bound to "ammo" [8-bit, 2 digits].
hud_linked_3_drawn EQU #D004
bitmap_key_count EQU #D008
; collector_gems skill (SCREEN 5 bitmap): 8 pickup(s), 6 of them nuts (shoot ammo). RAM follows key-door/dialogue chain.
bitmap_gem_work_offset EQU #D009
bitmap_gem_target_page EQU #D00A
; Nuts held. Read by the shoot skill's ammo gate and by a HUD counter bound to 'ammo'.
bitmap_nut_count       EQU #D00B
bitmap_gem_flags       EQU #D00C
bitmap_gem_cmd_block   EQU #C2C0
; Health pickups (SCREEN 5 bitmap): 1 pickup(s). RAM follows the gem chain.
bitmap_heal_work_offset EQU #D014
bitmap_heal_target_page EQU #D015
bitmap_heal_flags       EQU #D016
bitmap_heal_cmd_block   EQU #C2C0
; --- CRUMBLING FLOOR (Manic Miner) RAM (62 bytes at #D017) ---
; 3 crumbling cell(s). State is per-room and TEMPORARY:
; every room (re)composition wipes the pool, which is what regenerates the tiles.
bitmap_crumble_page       EQU #D017
bitmap_crumble_cell       EQU #D018
bitmap_crumble_frames     EQU #D019
bitmap_crumble_band       EQU #D01A
bitmap_crumble_pool       EQU #D01B
bitmap_crumble_debris     EQU #D04B
; Shared 15-byte command scratch (jumpers / gems / destroy_tile use it too: every
; launch in this engine is sequential inside the main loop).
bitmap_crumble_cmd_block  EQU #C2C0
; Player-linked State Machine runtime (SCREEN 5 bitmap route).
bitmap_sm_state EQU #D089
bitmap_light_x                 EQU #D08A
bitmap_light_y                 EQU #D08B
bitmap_light_tx                EQU #D08C
bitmap_light_ty                EQU #D08D
bitmap_light_active            EQU #D08E
bitmap_light_page              EQU #D08F
bitmap_light_op_clr            EQU #D090
bitmap_light_op_cmd            EQU #D091
bitmap_light_d                 EQU #D092
bitmap_light_xsign             EQU #D093
bitmap_light_xadj              EQU #D094
bitmap_light_ybias             EQU #D095
bitmap_light_rx                EQU #D096
bitmap_light_ry                EQU #D097
bitmap_light_rw                EQU #D098
bitmap_light_rh                EQU #D09A
bitmap_light_band_y            EQU #D09B
bitmap_light_band_h            EQU #D09C
bitmap_light_band_hw           EQU #D09D
bitmap_light_on                EQU #D09E
bitmap_light_stage             EQU #D09F
bitmap_light_timer             EQU #D0A0
bitmap_light_bands_ptr         EQU #D0A2
bitmap_light_sdown_ptr         EQU #D0A4
bitmap_light_sdown_n           EQU #D0A6
bitmap_light_sup_ptr           EQU #D0A7
bitmap_light_sup_n             EQU #D0A9
bitmap_light_cxmin             EQU #D0AA
bitmap_light_cxmax             EQU #D0AB
bitmap_mush_cx                 EQU #D0AC
bitmap_mush_cy                 EQU #D0AD
bitmap_light_srx               EQU #D0AE
bitmap_light_sry               EQU #D0AF
bitmap_light_srw               EQU #D0B0
bitmap_light_srh               EQU #D0B1
bitmap_light_tx0               EQU #D0B2
bitmap_light_ty0               EQU #D0B3
bitmap_light_tw                EQU #D0B4
bitmap_light_th                EQU #D0B5
bitmap_mush_ex                 EQU #D0B6
bitmap_mush_ey                 EQU #D0B7
bitmap_mush_flag               EQU #D0B8
bitmap_mush_sx                 EQU #D0B9
bitmap_mush_sy                 EQU #D0BA
bitmap_light_protect           EQU #D0BC
bitmap_mush_flags              EQU #D0BD
bitmap_bl_on                   EQU #D0BE
bitmap_bl_x                    EQU #D0BF
bitmap_bl_y                    EQU #D0C0
; --- ENEMY runtime state (26 bytes): count + 1 slot(s) x 23 + update lane
; (x,y,dx,dy,minX,maxX,minY,maxY,animTick,animFrame,frameCount,animDelay,colorOff,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane) ---
bitmap_enemy_count EQU #D055
bitmap_enemy_pool  EQU #D056
bitmap_enemy_update_lane EQU #D06D
; --- MOVING PLATFORM runtime state (26 bytes): count + rider + 2 slot(s) x 11
; (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,movedX,movedY) ---
bitmap_platform_count EQU #D06F
bitmap_platform_rider EQU #D070
bitmap_platform_pool  EQU #D071
; Per-slot colour state: 0 = authored (normal room), 1 = dim, 2 = inside halo.
bitmap_platform_light_state EQU #D087

; Mideas channel-C convention: gameplay SFX own PSG channel C. Every
; fire-and-forget SFX stores its R7 bits for C here (bit2 tone, bit5 noise);
; the music mixer merges them so its per-frame R7 heal never cuts a blip.
psg_sfx_r7_c_bits EQU #C3FE
; ---- GameFlow text/menu/scroll engine ----
bitmap_flow_fg         EQU #E000
bitmap_flow_bg         EQU #E001
bitmap_flow_width      EQU #E002
bitmap_flow_rows       EQU #E003
bitmap_flow_dest       EQU #E004   ; word: VRAM address of the text span
bitmap_flow_menu_index EQU #E006
bitmap_flow_menu_prev  EQU #E007
bitmap_flow_scroll_bg  EQU #E008
bitmap_flow_cmd        EQU #E010   ; 15 bytes mirroring VDP R#32..R#46
bitmap_flow_cmd_sx     EQU bitmap_flow_cmd + 0
bitmap_flow_cmd_sy     EQU bitmap_flow_cmd + 2
bitmap_flow_cmd_dx     EQU bitmap_flow_cmd + 4
bitmap_flow_cmd_dy     EQU bitmap_flow_cmd + 6
bitmap_flow_cmd_nx     EQU bitmap_flow_cmd + 8
bitmap_flow_cmd_ny     EQU bitmap_flow_cmd + 10
bitmap_flow_cmd_clr    EQU bitmap_flow_cmd + 12
bitmap_flow_cmd_arg    EQU bitmap_flow_cmd + 13
bitmap_flow_cmd_cmd    EQU bitmap_flow_cmd + 14
bitmap_flow_textbuf    EQU #E100

; ---- SCC music: public API status bytes + player runtime RAM (Fase 5) ----
; The bitmap engine keeps P2 on resident bank 2 whenever music_* runs (every
; banked load ends in bitmap_room_restore_resident_banks), so this mirror is
; seeded once at boot and stays truthful; the SCC driver saves it, maps #3F to
; reach the chip and restores it after every access.
mapper_bank_p2_current EQU #C3FF
music_active         EQU #C400
music_muted          EQU #C401
music_loop           EQU #C402
music_track_index    EQU #C403
BITMAP_MUSIC_DATA_BANK_0 EQU 14   ; P3 (#A000) music data bank, chunk 0
BITMAP_MUSIC_DATA_BANK_1 EQU 15   ; P3 (#A000) music data bank, chunk 1
BITMAP_MUSIC_DATA_BANK_2 EQU 16   ; P3 (#A000) music data bank, chunk 2
; ---- SCC music runtime RAM (EQU chain) ----
scc_music_active             EQU #C404
scc_music_muted              EQU #C405
scc_music_loop_count         EQU #C406
scc_music_row_frames         EQU #C407
scc_music_row_countdown      EQU #C408
scc_music_order_pos          EQU #C409
scc_music_order_len          EQU #C40A
scc_music_restart_pos        EQU #C40B
scc_music_pattern_row        EQU #C40C
scc_music_pattern_rows       EQU #C40D
scc_music_track_ptr          EQU #C40E
scc_music_order_ptr          EQU #C410
scc_music_pattern_table_ptr  EQU #C412
scc_music_inst_table_ptr     EQU #C414
scc_music_orn_table_ptr      EQU #C416
scc_music_row_ptr            EQU #C418
scc_music_mixer_shadow       EQU #C41A
scc_ch_note                  EQU #C41B
scc_ch_wave                  EQU #C420
scc_ch_volbase               EQU #C425
scc_ch_envlo                 EQU #C42A
scc_ch_envhi                 EQU #C42F
scc_ch_envlen                EQU #C434
scc_ch_envloop               EQU #C439
scc_ch_envstep               EQU #C43E
scc_ch_volout                EQU #C443
scc_ch_arp_lo                EQU #C448
scc_ch_arp_hi                EQU #C44D
scc_ch_arp_len               EQU #C452
scc_ch_arp_loop              EQU #C457
scc_ch_arp_step              EQU #C45C
scc_ch_vib_shift             EQU #C461
scc_ch_vib_speed             EQU #C466
scc_ch_vib_delay             EQU #C46B
scc_ch_vib_ctr               EQU #C470
scc_ch_vib_phase             EQU #C475
scc_ch_period_lo             EQU #C47A
scc_ch_period_hi             EQU #C47F
scc_ch_flags                 EQU #C484
scc_ch_morph_wave            EQU #C489
scc_ch_morph_speed           EQU #C48E
scc_noise_phase              EQU #C493
scc_morph_chan               EQU #C494
scc_morph_step               EQU #C495
scc_morph_timer              EQU #C496
scc_morph_speed_cur          EQU #C497
scc_morph_tgt_idx            EQU #C498
scc_morph_tgt_lo             EQU #C499
scc_morph_tgt_hi             EQU #C49A
scc_morph_buf                EQU #C49B
scc_morph_delta              EQU #C4BB
scc_music_loop_enabled       EQU #C4DB
music_data_bank_cur          EQU #C4DC
; ---- PSG music runtime RAM (dual-chip Fase 3, EQU chain) ----
psg_music_active             EQU #C4DD
psg_music_muted              EQU #C4DE
psg_music_loop_enabled       EQU #C4DF
psg_music_row_frames         EQU #C4E0
psg_music_row_countdown      EQU #C4E1
psg_music_order_pos          EQU #C4E2
psg_music_order_len          EQU #C4E3
psg_music_restart_pos        EQU #C4E4
psg_music_pattern_row        EQU #C4E5
psg_music_pattern_rows       EQU #C4E6
psg_music_order_ptr          EQU #C4E7
psg_music_pattern_table_ptr  EQU #C4E9
psg_music_pattern_bank_ptr   EQU #C4EB
psg_music_orn_table_ptr      EQU #C4ED
psg_music_inst_table_ptr     EQU #C4EF
psg_music_row_ptr            EQU #C4F1
psg_music_track_ptr          EQU #C4F3
psg_music_noise_period       EQU #C4F5
psg_music_use_ch_c           EQU #C4F6
psg_ch_note                  EQU #C4F7
psg_ch_effective_note        EQU #C4FA
psg_ch_flags                 EQU #C4FD
psg_ch_noiseper              EQU #C500
psg_ch_volbase               EQU #C503
psg_ch_envlo                 EQU #C506
psg_ch_envhi                 EQU #C509
psg_ch_envlen                EQU #C50C
psg_ch_envloop               EQU #C50F
psg_ch_envstep               EQU #C512
psg_ch_volout                EQU #C515
psg_ch_period_lo             EQU #C518
psg_ch_period_hi             EQU #C51B
psg_ch_tonelo                EQU #C51E
psg_ch_tonehi                EQU #C521
psg_ch_tonelen               EQU #C524
psg_ch_toneloop              EQU #C527
psg_ch_tonestep              EQU #C52A
psg_ch_noiselo               EQU #C52D
psg_ch_noisehi               EQU #C530
psg_ch_noiselen              EQU #C533
psg_ch_noiseloop             EQU #C536
psg_ch_noisestep             EQU #C539
psg_ch_instrument            EQU #C53C
psg_ch_arp_lo                EQU #C53F
psg_ch_arp_hi                EQU #C542
psg_ch_arp_len               EQU #C545
psg_ch_arp_loop              EQU #C548
psg_ch_arp_step              EQU #C54B
psg_ch_pt3mode               EQU #C54E
music_mixer_shadow           EQU #C551
music_pitch_step_work        EQU #C552
music_pt3_frame_active       EQU #C553
music_pt3_used_noise         EQU #C554
music_pt3_used_env           EQU #C555
music_pt3_noise_add          EQU #C556
music_pt3_env_add_lo         EQU #C557
music_pt3_env_add_hi         EQU #C558
music_pt3_env_mode           EQU #C559
music_pt3_r13_pending        EQU #C55A
music_pt3_r13_value          EQU #C55B
music_pt3_channel_work       EQU #C55C
music_pt3_step_packed        EQU #C55D
music_pt3_step_flags         EQU #C55E
music_pt3_step_global        EQU #C55F
music_pt3_sample_len_work    EQU #C560
music_pt3_sample_loop_work   EQU #C561
music_pt3_sample_mode_work   EQU #C562
music_pt3_period_lo_work     EQU #C563
music_pt3_period_hi_work     EQU #C564
music_pt3_tone_delta_lo_work EQU #C565
music_pt3_tone_delta_hi_work EQU #C566
music_pt3_instrument_ptr_l   EQU #C567
music_pt3_instrument_ptr_h   EQU #C568
music_pt3_step_ptr_l         EQU #C569
music_pt3_step_ptr_h         EQU #C56A
music_pt3_amplitude_work     EQU #C56B
music_pt3_sample_pos_base    EQU #C56C
music_pt3_tone_acc_lo_base   EQU #C56F
music_pt3_tone_acc_hi_base   EQU #C572
music_pt3_amp_slide_base     EQU #C575
music_pt3_noise_acc_base     EQU #C578
music_pt3_env_acc_lo_base    EQU #C57B
music_pt3_env_acc_hi_base    EQU #C57E
music_ch_note_base           EQU psg_ch_effective_note
music_ch_volume_base         EQU psg_ch_volbase
psg_music_pt3_ram_end        EQU #C581
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
    ; Upload bullet sprite pattern (32 bytes) to VRAM #FC60
    ld hl, bitmap_bullet_pattern_data
    ld de, #FC60
    ld bc, bitmap_bullet_pattern_data_end - bitmap_bullet_pattern_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 4 (VRAM #F490)
    ld hl, bitmap_bullet_color_data
    ld de, #F490
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
    ; crumbling floor: chip pattern (32 bytes) -> VRAM #FC40 + slot colour tables
    ld hl, bitmap_crumble_chip_pattern_data
    ld de, #FC40
    ld bc, bitmap_crumble_chip_pattern_data_end - bitmap_crumble_chip_pattern_data
    call copy_to_vram_ext
    ld hl, bitmap_crumble_chip_color_data
    ld de, #F470
    ld bc, bitmap_crumble_chip_color_data_end - bitmap_crumble_chip_color_data
    call copy_to_vram_ext
    ld hl, bitmap_crumble_chip_color_data
    ld de, #F480
    ld bc, bitmap_crumble_chip_color_data_end - bitmap_crumble_chip_color_data
    call copy_to_vram_ext
    ld a, #24                 ; SFX channel-C mixer shadow: start muted
    ld (psg_sfx_r7_c_bits), a
    ld a, 2                   ; seed the P2 mirror: resident data bank
    ld (mapper_bank_p2_current), a
    call music_init_system
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
    jp bitmap_gf_node_2
bitmap_gf_node_2:
    ld a, 0
    ld b, 1
    call music_play_track
    jp bitmap_gf_node_8
bitmap_gf_node_8:
    jp bitmap_gf_node_9
bitmap_gf_node_9:
    ; Transition "screen5_diagonal_pixel_wipe" already played by the boot intro; passthrough.
    jp bitmap_gf_node_1
bitmap_gf_node_1:
    ; Same reason as the boss scratch above: the health pickup flags MUST be
    ; cleared before the start room draws its overlays. bitmap_apply_heals_visible
    ; runs a few lines below and SKIPS any pickup whose flag is non-zero, so
    ; clearing them with the rest of the HUD/system init (further down, after
    ; load_room) left cold-boot garbage reading as "already taken": the pickup
    ; was never drawn, yet walking over it still refilled a heart.
    ; Health pickups: clear per-pickup taken flags.
    xor a
    ld (bitmap_heal_work_offset), a
    ld (bitmap_heal_target_page), a
    ld (bitmap_heal_flags + 0), a
    ; Render the start room from the shared tileset already in VRAM.
    xor a
    ld (bitmap_displayed_page), a

    ld a, 0
    call load_room
    ; Re-seed the top HUD band on BOTH pages. A Game Flow intro Transition effect
    ; (vertical/horizontal wipe, CLS or fade) clears the WHOLE visible page 0,
    ; including the HUD band (fill starts at DY=0, NY=212), which erases the static
    ; HUD seed art (e.g. a collectibles/gem icon). Only the dynamic HUD widgets
    ; redraw themselves afterwards, so without this re-seed the static icons would
    ; be missing on page 0 and appear only on the never-wiped page 1 ("gem icon on
    ; alternate rooms"). Harmless on the plain boot path (idempotent re-upload).
    call init_bitmap_hud_band
    call bitmap_apply_gems_visible    ; draw uncollected gems on current page
    call bitmap_apply_heals_visible    ; draw untaken health pickups on current page
    call bitmap_crumble_reset_visible    ; crumbling floors come back whole

    call bitmap_load_enemies
    call bitmap_load_platforms
    ; Place the player at the room spawn point.
    ld a, 143
    ld (player_y), a
    ld a, 31
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
    ; Boss load deliberately comes AFTER player placement. The Room Lock chain
    ; must see the real entry cell so it can leave that cell open until the
    ; frozen player is released and steps clear.
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
    ld a, #FF
    ld (hud_linked_2_drawn), a
    ld a, #FF
    ld (hud_linked_3_drawn), a
    xor a
    ld (bitmap_key_count), a
    ; collector_gems: clear per-gem collected flags.
    xor a
    ld (bitmap_gem_work_offset), a
    ld (bitmap_gem_target_page), a
    ld (bitmap_nut_count), a          ; start with no ammo
    ld (bitmap_gem_flags + 0), a
    ld (bitmap_gem_flags + 1), a
    ld (bitmap_gem_flags + 2), a
    ld (bitmap_gem_flags + 3), a
    ld (bitmap_gem_flags + 4), a
    ld (bitmap_gem_flags + 5), a
    ld (bitmap_gem_flags + 6), a
    ld (bitmap_gem_flags + 7), a
    ; crumbling floor: no page yet, empty pool (#FF = free slot), no chips.
    xor a
    ld (bitmap_crumble_page), a
    ld (bitmap_crumble_cell), a
    ld (bitmap_crumble_frames), a
    ld (bitmap_crumble_band), a
    ld (bitmap_crumble_debris + 0), a
    ld (bitmap_crumble_debris + 5), a
    call bitmap_crumble_clear_pool
    ld a, 0
    ld (bitmap_sm_state), a
    ld a, 1
    ld (player_anim_state), a
    xor a
    ld (bitmap_light_active), a       ; no halo painted yet
    ld (bitmap_light_protect), a
    ld (bitmap_bl_on), a              ; no bullet lantern painted
    ld (bitmap_light_stage), a
    ld a, 0
    ld (bitmap_light_on), a           ; the tail starts dark: eat a mushroom
    ld hl, 500
    ld (bitmap_light_timer), hl
    call bitmap_light_load_stage      ; stage pointers/clamps must be valid before the first paint
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
    ; run_bitmap_intro left hardware sprites hidden so the boot could not show a
    ; player built from uninitialised sprite tables. They are ready now.
    ld a, #08
    ld e, #08
    call vdp_write_register
    call bitmap_light_paint_visible    ; dim the first room and cut the halo
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
    xor a
    ld (player_coyote_timer), a
    ld (player_jump_buffer_t), a
    ; Clear SHOOT pool (8 bytes at bitmap_bullet_pool)
    call bitmap_shoot_init_clear

    call bitmap_enter_game_loop
    jp bitmap_gf_node_3
bitmap_gf_node_3:
    call bitmap_intro_wipe_diagonal
    jp bitmap_gf_node_7
bitmap_gf_node_7:
    ld a, 0
    ld b, 1
    call music_play_track
    jp bitmap_gf_node_4
bitmap_gf_node_4:
    call bitmap_flow_use_page0
    call bitmap_flow_sprites_off
    ld a, #01
    ld (bitmap_flow_scroll_bg), a
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, 0
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, 192
    ld (bitmap_flow_cmd_ny), hl
    ld a, #01
    call bitmap_flow_set_clr
    ld a, #C0
    call bitmap_flow_run_cmd
    call bitmap_flow_scroll_clear_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_9
    ld de, #0630
    ld b, 27
    call bitmap_flow_print
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_0
    ld de, #4D30
    ld b, 30
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_1
    ld de, #4D18
    ld b, 78
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_2
    ld de, #4D09
    ld b, 105
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_3
    ld de, #4D36
    ld b, 15
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_4
    ld de, #4D09
    ld b, 108
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_5
    ld de, #4D30
    ld b, 30
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_6
    ld de, #4D06
    ld b, 114
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_7
    ld de, #4D0C
    ld b, 99
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    call bitmap_flow_scroll_window
    ld a, #0F
    ld (bitmap_flow_fg), a
    ld a, #01
    ld (bitmap_flow_bg), a
    ld hl, bitmap_flow_str_8
    ld de, #4D1B
    ld b, 72
    call bitmap_flow_print
    ld b, #12
    call bitmap_flow_wait_frames
    ld b, 11
bitmap_flow_tail_msx2_gf_textscrollcolor_1785586816387:
    push bc
    call bitmap_flow_scroll_window
    ld b, #12
    call bitmap_flow_wait_frames
    pop bc
    djnz bitmap_flow_tail_msx2_gf_textscrollcolor_1785586816387
    call bitmap_flow_wait_key
    call bitmap_flow_sprites_on
    jp bitmap_gf_node_5
bitmap_gf_node_5:
    ; Same reason as the boss scratch above: the health pickup flags MUST be
    ; cleared before the start room draws its overlays. bitmap_apply_heals_visible
    ; runs a few lines below and SKIPS any pickup whose flag is non-zero, so
    ; clearing them with the rest of the HUD/system init (further down, after
    ; load_room) left cold-boot garbage reading as "already taken": the pickup
    ; was never drawn, yet walking over it still refilled a heart.
    ; Health pickups: clear per-pickup taken flags.
    xor a
    ld (bitmap_heal_work_offset), a
    ld (bitmap_heal_target_page), a
    ld (bitmap_heal_flags + 0), a
    ; Render the start room from the shared tileset already in VRAM.
    xor a
    ld (bitmap_displayed_page), a

    ld a, 0
    call load_room
    ; Re-seed the top HUD band on BOTH pages. A Game Flow intro Transition effect
    ; (vertical/horizontal wipe, CLS or fade) clears the WHOLE visible page 0,
    ; including the HUD band (fill starts at DY=0, NY=212), which erases the static
    ; HUD seed art (e.g. a collectibles/gem icon). Only the dynamic HUD widgets
    ; redraw themselves afterwards, so without this re-seed the static icons would
    ; be missing on page 0 and appear only on the never-wiped page 1 ("gem icon on
    ; alternate rooms"). Harmless on the plain boot path (idempotent re-upload).
    call init_bitmap_hud_band
    call bitmap_apply_gems_visible    ; draw uncollected gems on current page
    call bitmap_apply_heals_visible    ; draw untaken health pickups on current page
    call bitmap_crumble_reset_visible    ; crumbling floors come back whole

    call bitmap_load_enemies
    call bitmap_load_platforms
    ; Place the player at the room spawn point.
    ld a, 143
    ld (player_y), a
    ld a, 31
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
    ; Boss load deliberately comes AFTER player placement. The Room Lock chain
    ; must see the real entry cell so it can leave that cell open until the
    ; frozen player is released and steps clear.
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
    ld a, #FF
    ld (hud_linked_2_drawn), a
    ld a, #FF
    ld (hud_linked_3_drawn), a
    xor a
    ld (bitmap_key_count), a
    ; collector_gems: clear per-gem collected flags.
    xor a
    ld (bitmap_gem_work_offset), a
    ld (bitmap_gem_target_page), a
    ld (bitmap_nut_count), a          ; start with no ammo
    ld (bitmap_gem_flags + 0), a
    ld (bitmap_gem_flags + 1), a
    ld (bitmap_gem_flags + 2), a
    ld (bitmap_gem_flags + 3), a
    ld (bitmap_gem_flags + 4), a
    ld (bitmap_gem_flags + 5), a
    ld (bitmap_gem_flags + 6), a
    ld (bitmap_gem_flags + 7), a
    ; crumbling floor: no page yet, empty pool (#FF = free slot), no chips.
    xor a
    ld (bitmap_crumble_page), a
    ld (bitmap_crumble_cell), a
    ld (bitmap_crumble_frames), a
    ld (bitmap_crumble_band), a
    ld (bitmap_crumble_debris + 0), a
    ld (bitmap_crumble_debris + 5), a
    call bitmap_crumble_clear_pool
    ld a, 0
    ld (bitmap_sm_state), a
    ld a, 1
    ld (player_anim_state), a
    xor a
    ld (bitmap_light_active), a       ; no halo painted yet
    ld (bitmap_light_protect), a
    ld (bitmap_bl_on), a              ; no bullet lantern painted
    ld (bitmap_light_stage), a
    ld a, 0
    ld (bitmap_light_on), a           ; the tail starts dark: eat a mushroom
    ld hl, 500
    ld (bitmap_light_timer), hl
    call bitmap_light_load_stage      ; stage pointers/clamps must be valid before the first paint
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
    ; run_bitmap_intro left hardware sprites hidden so the boot could not show a
    ; player built from uninitialised sprite tables. They are ready now.
    ld a, #08
    ld e, #08
    call vdp_write_register
    call bitmap_light_paint_visible    ; dim the first room and cut the halo
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
    xor a
    ld (player_coyote_timer), a
    ld (player_jump_buffer_t), a
    ; Clear SHOOT pool (8 bytes at bitmap_bullet_pool)
    call bitmap_shoot_init_clear

    call bitmap_enter_game_loop
    jp bitmap_gf_node_6
bitmap_gf_node_6:
    call music_stop
    ld hl, bitmap_gf_node_6_DATA
    call draw_bitmap_end_screen
    call bitmap_end_wait_key
    ; End node terminates the flow.
    jp bitmap_gameflow_terminal_loop
bitmap_gameflow_terminal_loop:
    jp bitmap_gameflow_terminal_loop

; ============================================================
; GameFlow text engine (6x8 font, 4bpp expansion, no BIOS)
; ============================================================

; ------------------------------------------------------------
; bitmap_flow_use_page0: force the visible page to 0 before drawing.
;
; bitmap_displayed_page is only ever written by the room flip, so a text screen
; that runs BEFORE the first WorldLink (intro -> transition -> text) would read
; cartridge boot garbage and blit onto the hidden page — the screen looked
; simply never drawn. These nodes run outside the gameplay loop, so pin the
; display to page 0 and keep the shadow variable in sync.
; Clobbers AF, E.
; ------------------------------------------------------------
bitmap_flow_sprites_off:
    ; R#8 bit 1 = SPD. The room sprites (player, enemies) are still armed from
    ; the boot init and would sit on top of a full-screen text node.
    ld a, #08
    ld e, #0A
    jp vdp_write_register

bitmap_flow_sprites_on:
    ld a, #08
    ld e, #08
    jp vdp_write_register

bitmap_flow_use_page0:
    xor a
    ld (bitmap_displayed_page), a
    ld (bitmap_pending_display_page), a
    ld e, #1F
    ld a, #02
    call vdp_write_register
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; bitmap_flow_page_dy: HL = Y inside the page -> HL = Y with the displayed
; page offset applied (page 1 lives at Y 256..). Clobbers AF.
; ------------------------------------------------------------
bitmap_flow_page_dy:
    ld a, (bitmap_displayed_page)
    or a
    ret z
    inc h
    ret

; ------------------------------------------------------------
; bitmap_flow_page_addr: HL = byte offset inside the page (Y*128 + X) ->
; HL = absolute VRAM address on the displayed page. Clobbers AF.
; ------------------------------------------------------------
bitmap_flow_page_addr:
    ld a, (bitmap_displayed_page)
    or a
    ret z
    ld a, h
    add a, #80
    ld h, a
    ret

; ------------------------------------------------------------
; bitmap_flow_set_clr: A = palette index -> command colour byte (both nibbles).
; ------------------------------------------------------------
bitmap_flow_set_clr:
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (bitmap_flow_cmd_clr), a
    ret

; ------------------------------------------------------------
; bitmap_flow_run_cmd: A = command byte. Sends the 15-byte block through the
; indirect register port and waits for the engine. Clobbers AF, BC, HL.
; ------------------------------------------------------------
bitmap_flow_run_cmd:
    ld (bitmap_flow_cmd_cmd), a
    xor a
    ld (bitmap_flow_cmd_arg), a
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_flow_cmd
    ld b, 15
bitmap_flow_run_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz bitmap_flow_run_cmd_loop
    call vdp_wait_cmd_ready
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; bitmap_flow_print: draw a zero-terminated string (chars 32..90).
;   HL = string pointer
;   DE = byte offset inside the page (Y*128 + X)
;   B  = span width in bytes (3 per character cell)
; Colours come from bitmap_flow_fg / bitmap_flow_bg.
; Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_flow_print:
    push hl
    ex de, hl
    call bitmap_flow_page_addr
    ld (bitmap_flow_dest), hl
    pop hl
    ld a, b
    ld (bitmap_flow_width), a
    push hl
    call bitmap_flow_fill_textbuf
    pop hl
    ld c, 0
bitmap_flow_print_char_loop:
    ld a, (hl)
    or a
    jp z, bitmap_flow_print_blit
    inc hl
    ld e, a
    ld a, (bitmap_flow_width)
    sub c
    cp 3
    jp c, bitmap_flow_print_blit
    ld a, e
    push hl
    call bitmap_flow_draw_char
    pop hl
    ld a, c
    add a, 3
    ld c, a
    jp bitmap_flow_print_char_loop

bitmap_flow_print_blit:
    ld hl, bitmap_flow_textbuf
    ld de, (bitmap_flow_dest)
    ld a, 8
    ld (bitmap_flow_rows), a
bitmap_flow_print_blit_loop:
    push hl
    push de
    ld a, (bitmap_flow_width)
    ld c, a
    ld b, 0
    call copy_to_vram_ext
    pop de
    pop hl
    ld a, (bitmap_flow_width)
    ld c, a
    ld b, 0
    add hl, bc
    ex de, hl
    ld bc, 128
    add hl, bc
    ex de, hl
    ld a, (bitmap_flow_rows)
    dec a
    ld (bitmap_flow_rows), a
    jp nz, bitmap_flow_print_blit_loop
    ret

bitmap_flow_fill_textbuf:
    ld a, (bitmap_flow_bg)
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (bitmap_flow_textbuf), a
    ld a, (bitmap_flow_width)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    dec hl
    ld b, h
    ld c, l
    ld hl, bitmap_flow_textbuf
    ld de, bitmap_flow_textbuf + 1
    ldir
    ret

; A = character code, C = byte column inside the span.
bitmap_flow_draw_char:
    push bc
    call bitmap_flow_draw_char_inner
    pop bc
    ret

bitmap_flow_draw_char_inner:
    sub 32
    ret c
    cp 59
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_flow_font
    add hl, de
    ld e, c
    ld d, 0
    push hl
    ld hl, bitmap_flow_textbuf
    add hl, de
    ex de, hl
    pop hl
    ld b, 8
bitmap_flow_draw_char_row:
    ld a, (hl)
    inc hl
    push hl
    push bc
    call bitmap_flow_expand_row
    pop bc
    pop hl
    ld a, (bitmap_flow_width)
    sub 3
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    djnz bitmap_flow_draw_char_row
    ret

; A = glyph row bits (bit7 leftmost). Writes 3 bytes / 6 pixels at (DE).
bitmap_flow_expand_row:
    ld c, a
    ld b, 3
bitmap_flow_expand_row_loop:
    ld a, c
    rlca
    ld c, a
    call bitmap_flow_expand_pick
    rlca
    rlca
    rlca
    rlca
    ld l, a
    ld a, c
    rlca
    ld c, a
    call bitmap_flow_expand_pick
    or l
    ld (de), a
    inc de
    djnz bitmap_flow_expand_row_loop
    ret

bitmap_flow_expand_pick:
    jp nc, bitmap_flow_expand_pick_bg
    ld a, (bitmap_flow_fg)
    ret
bitmap_flow_expand_pick_bg:
    ld a, (bitmap_flow_bg)
    ret

; ------------------------------------------------------------
; bitmap_flow_wait_key / bitmap_flow_wait_frames
; PPI row 8 bit 0 = SPACE. No BIOS, no interrupts.
; ------------------------------------------------------------
bitmap_flow_wait_key:
    ; Require a release first so a key still held from the previous node does
    ; not skip this screen instantly.
    call bitmap_wait_vblank
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    jp nz, bitmap_flow_wait_key
bitmap_flow_wait_key_press:
    call bitmap_wait_vblank
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    jp z, bitmap_flow_wait_key_press
    ret

bitmap_flow_wait_frames:
    ld a, b
    or a
    ret z
bitmap_flow_wait_frames_loop:
    push bc
    call bitmap_wait_vblank
    pop bc
    djnz bitmap_flow_wait_frames_loop
    ret

; ------------------------------------------------------------
; bitmap_flow_scroll_window: HMMM the text window up one line and clear the
; freed band with bitmap_flow_scroll_bg. Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_flow_scroll_window:
    ld hl, 0
    ld (bitmap_flow_cmd_sx), hl
    ld hl, 44
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_sy), hl
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, 32
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, 120
    ld (bitmap_flow_cmd_ny), hl
    ld a, #D0                  ; HMMM
    call bitmap_flow_run_cmd
    ; Clear the band that scrolled in at the bottom.
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, 152
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, 12
    ld (bitmap_flow_cmd_ny), hl
    ld a, (bitmap_flow_scroll_bg)
    call bitmap_flow_set_clr
    ld a, #C0                  ; HMMV
    jp bitmap_flow_run_cmd

bitmap_flow_scroll_clear_window:
    ld hl, 0
    ld (bitmap_flow_cmd_dx), hl
    ld hl, 32
    call bitmap_flow_page_dy
    ld (bitmap_flow_cmd_dy), hl
    ld hl, 256
    ld (bitmap_flow_cmd_nx), hl
    ld hl, 132
    ld (bitmap_flow_cmd_ny), hl
    ld a, (bitmap_flow_scroll_bg)
    call bitmap_flow_set_clr
    ld a, #C0
    jp bitmap_flow_run_cmd

; 6x8 GameFlow font: 59 glyphs (ASCII 32..90), 8 rows each, 5 pixels
; left-aligned on bits 7..3 so bit 2 becomes the inter-character gap.
bitmap_flow_font:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#20,#20,#20,#20,#20,#00,#20,#00
    DB #50,#50,#00,#00,#00,#00,#00,#00,#50,#F8,#50,#50,#50,#F8,#50,#00
    DB #20,#78,#A0,#70,#28,#F0,#20,#00,#C0,#C8,#10,#20,#40,#98,#18,#00
    DB #40,#A0,#A0,#40,#A8,#90,#68,#00,#20,#20,#00,#00,#00,#00,#00,#00
    DB #10,#20,#40,#40,#40,#20,#10,#00,#40,#20,#10,#10,#10,#20,#40,#00
    DB #00,#A8,#70,#F8,#70,#A8,#00,#00,#00,#20,#20,#F8,#20,#20,#00,#00
    DB #00,#00,#00,#00,#60,#60,#40,#00,#00,#00,#00,#F8,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#60,#60,#00,#08,#10,#10,#20,#40,#40,#80,#00
    DB #70,#88,#98,#A8,#C8,#88,#70,#00,#20,#60,#20,#20,#20,#20,#70,#00
    DB #70,#88,#08,#10,#20,#40,#F8,#00,#F0,#08,#08,#70,#08,#08,#F0,#00
    DB #10,#30,#50,#90,#F8,#10,#10,#00,#F8,#80,#80,#F0,#08,#08,#F0,#00
    DB #70,#80,#80,#F0,#88,#88,#70,#00,#F8,#08,#10,#20,#40,#40,#40,#00
    DB #70,#88,#88,#70,#88,#88,#70,#00,#70,#88,#88,#78,#08,#08,#70,#00
    DB #00,#60,#60,#00,#60,#60,#00,#00,#00,#60,#60,#00,#60,#60,#40,#00
    DB #10,#20,#40,#80,#40,#20,#10,#00,#00,#00,#F8,#00,#F8,#00,#00,#00
    DB #40,#20,#10,#08,#10,#20,#40,#00,#70,#88,#08,#10,#20,#00,#20,#00
    DB #70,#88,#B8,#A8,#B8,#80,#70,#00,#70,#88,#88,#F8,#88,#88,#88,#00
    DB #F0,#88,#88,#F0,#88,#88,#F0,#00,#78,#80,#80,#80,#80,#80,#78,#00
    DB #F0,#88,#88,#88,#88,#88,#F0,#00,#F8,#80,#80,#F0,#80,#80,#F8,#00
    DB #F8,#80,#80,#F0,#80,#80,#80,#00,#78,#80,#80,#B8,#88,#88,#78,#00
    DB #88,#88,#88,#F8,#88,#88,#88,#00,#F8,#20,#20,#20,#20,#20,#F8,#00
    DB #38,#10,#10,#10,#90,#90,#60,#00,#88,#90,#A0,#C0,#A0,#90,#88,#00
    DB #80,#80,#80,#80,#80,#80,#F8,#00,#88,#D8,#A8,#A8,#88,#88,#88,#00
    DB #88,#C8,#A8,#98,#88,#88,#88,#00,#70,#88,#88,#88,#88,#88,#70,#00
    DB #F0,#88,#88,#F0,#80,#80,#80,#00,#70,#88,#88,#88,#A8,#90,#68,#00
    DB #F0,#88,#88,#F0,#A0,#90,#88,#00,#78,#80,#80,#70,#08,#08,#F0,#00
    DB #F8,#20,#20,#20,#20,#20,#20,#00,#88,#88,#88,#88,#88,#88,#70,#00
    DB #88,#88,#88,#88,#88,#50,#20,#00,#88,#88,#88,#A8,#A8,#A8,#50,#00
    DB #88,#88,#50,#20,#50,#88,#88,#00,#88,#88,#50,#20,#20,#20,#20,#00
    DB #F8,#08,#10,#20,#40,#80,#F8,#00
bitmap_flow_str_0:   ; ""WHO AM I?"
    DB #22,#57,#48,#4F,#20,#41,#4D,#20,#49,#3F,#00
bitmap_flow_str_1:   ; "I DON'T REMEMBER ANYTHING."
    DB #49,#20,#44,#4F,#4E,#27,#54,#20,#52,#45,#4D,#45,#4D,#42,#45,#52
    DB #20,#41,#4E,#59,#54,#48,#49,#4E,#47,#2E,#00
bitmap_flow_str_2:   ; "MY INSTINCT TELLS ME TO ESCAPE FROM"
    DB #4D,#59,#20,#49,#4E,#53,#54,#49,#4E,#43,#54,#20,#54,#45,#4C,#4C
    DB #53,#20,#4D,#45,#20,#54,#4F,#20,#45,#53,#43,#41,#50,#45,#20,#46
    DB #52,#4F,#4D,#00
bitmap_flow_str_3:   ; "HERE."
    DB #48,#45,#52,#45,#2E,#00
bitmap_flow_str_4:   ; "I DON'T RECOGNIZE THIS SETTING; IT'S"
    DB #49,#20,#44,#4F,#4E,#27,#54,#20,#52,#45,#43,#4F,#47,#4E,#49,#5A
    DB #45,#20,#54,#48,#49,#53,#20,#53,#45,#54,#54,#49,#4E,#47,#3B,#20
    DB #49,#54,#27,#53,#00
bitmap_flow_str_5:   ; "VERY DARK."
    DB #56,#45,#52,#59,#20,#44,#41,#52,#4B,#2E,#00
bitmap_flow_str_6:   ; "EVERYTHING IS VERY STRANGE. THIS PLACE"
    DB #45,#56,#45,#52,#59,#54,#48,#49,#4E,#47,#20,#49,#53,#20,#56,#45
    DB #52,#59,#20,#53,#54,#52,#41,#4E,#47,#45,#2E,#20,#54,#48,#49,#53
    DB #20,#50,#4C,#41,#43,#45,#00
bitmap_flow_str_7:   ; "SEEMS ABANDONED. PRIORITY 1: FIND"
    DB #53,#45,#45,#4D,#53,#20,#41,#42,#41,#4E,#44,#4F,#4E,#45,#44,#2E
    DB #20,#50,#52,#49,#4F,#52,#49,#54,#59,#20,#31,#3A,#20,#46,#49,#4E
    DB #44,#00
bitmap_flow_str_8:   ; "SUSTENANCE AND GET OUT.""
    DB #53,#55,#53,#54,#45,#4E,#41,#4E,#43,#45,#20,#41,#4E,#44,#20,#47
    DB #45,#54,#20,#4F,#55,#54,#2E,#22,#00
bitmap_flow_str_9:   ; "1-EVASION"
    DB #31,#2D,#45,#56,#41,#53,#49,#4F,#4E,#00
bitmap_gf_node_6_DATA:
    DB #03,#0F,#18,#0E
bitmap_enter_game_loop:
    ; GameFlow exit gate: armed by Exit World contact or by the deadly/enemy
    ; system after the last life. With a graph, RET resumes the WorldLink's
    ; default connection. Without a graph, use a deterministic soft restart.
    ld a, (bitmap_gameflow_exit_flag)
    or a
    jp nz, .bitmap_gameflow_exit    ; silence the song before leaving the loop
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
    call bitmap_update_platform_sat
    call bitmap_crumble_update_debris_sat
    call bitmap_update_bullet_sat
    ; ---- logic phase: safe during active display ----
    call step_room_composition
    jp c, .skip_player_movement
    call bitmap_update_platforms
    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
    call bitmap_update_player_state_machine
    call bitmap_update_player_air_anim
    call bitmap_try_spawn_bullet
    call bitmap_step_bullets
    call bitmap_bullet_light_update    ; drag the shot lantern
    call bitmap_platform_ride_detect
.skip_player_movement:
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_linked_0    ; redraw linked HUD icon row #0 (hud_el_1783004114045_6h49y_mina)
    call update_hud_linked_1    ; redraw linked HUD counter #1 (hud_el_1783009772122_go9ku_mina)
    call update_hud_linked_2    ; redraw linked HUD counter #2 (hud_el_1783527996153_k7cbd_mina)
    call update_hud_linked_3    ; redraw linked HUD counter #3 (hud_el_1786208135817_504rh_mina)
    call bitmap_update_gems    ; collector_gems: pickup scan + cell erase
    call bitmap_update_heals    ; health pickups: refill 1 heart + cell erase
    call bitmap_crumble_update
    call bitmap_update_enemies
    call bitmap_check_enemy_touch
    call bitmap_light_update    ; move the glowing tail halo (dark rooms only)
    call music_update
    jp bitmap_enter_game_loop
.bitmap_gameflow_exit:
    ; This loop is the ONLY thing ticking music_update. Leaving it with the song
    ; mid-note left the SCC/PSG holding whatever registers the last frame wrote,
    ; so the track froze into a drone until some later node happened to silence
    ; it (the End node does; a Transition/Text/SubMenu target does not). Silence
    ; here instead, so every exit path — death with no lives left, Exit World —
    ; is quiet the moment gameplay stops. music_stop saves/restores
    ; mapper_bank_p2_current, so returning to the resident dispatcher is safe.
    call music_stop
    ret    ; WorldLink exit -> back to Game Flow dispatcher

; __MIDEAS_BITMAP_RESIDENT_DISPATCH_START__
; World engine dispatch tables (indexed by room/screen index).
; Keep these in the resident #4000-#7FFF window. load_room remaps P2
; (#8000-#9FFF) to stream room data before it reads block counts,
; collision maps, behaviours, transitions and spawn positions. Optional
; runtimes such as shoot must therefore never be able to push these tables
; into the banked P2 window.
bitmap_room_render_ptr_table_p0:
    DW bitmap_room_render_0_p0
    DW bitmap_room_render_1_p0
    DW bitmap_room_render_2_p0
    DW bitmap_room_render_3_p0
    DW bitmap_room_render_4_p0
    DW bitmap_room_render_5_p0
    DW bitmap_room_render_6_p0
bitmap_room_render_ptr_table_p1:
    DW bitmap_room_render_0_p1
    DW bitmap_room_render_1_p1
    DW bitmap_room_render_2_p1
    DW bitmap_room_render_3_p1
    DW bitmap_room_render_4_p1
    DW bitmap_room_render_5_p1
    DW bitmap_room_render_6_p1

; Konami data bank for each page 0 room render program
bitmap_room_render_bank_table_p0:
    DB bitmap_room_render_0_p0_DATA_BANK,bitmap_room_render_1_p0_DATA_BANK,bitmap_room_render_2_p0_DATA_BANK,bitmap_room_render_3_p0_DATA_BANK,bitmap_room_render_4_p0_DATA_BANK,bitmap_room_render_5_p0_DATA_BANK,bitmap_room_render_6_p0_DATA_BANK
; Konami data bank for each page 1 room render program
bitmap_room_render_bank_table_p1:
    DB bitmap_room_render_0_p1_DATA_BANK,bitmap_room_render_1_p1_DATA_BANK,bitmap_room_render_2_p1_DATA_BANK,bitmap_room_render_3_p1_DATA_BANK,bitmap_room_render_4_p1_DATA_BANK,bitmap_room_render_5_p1_DATA_BANK,bitmap_room_render_6_p1_DATA_BANK

bitmap_room_blockcount_table:
    DW 194
    DW 189
    DW 193
    DW 193
    DW 193
    DW 193
    DW 194

bitmap_room_collision_ptr_table:
    DW bitmap_room_collision_0
    DW bitmap_room_collision_1
    DW bitmap_room_collision_2
    DW bitmap_room_collision_3
    DW bitmap_room_collision_4
    DW bitmap_room_collision_5
    DW bitmap_room_collision_6

; Konami data bank for each room collision grid
bitmap_room_collision_bank_table:
    DB bitmap_room_collision_0_DATA_BANK,bitmap_room_collision_1_DATA_BANK,bitmap_room_collision_2_DATA_BANK,bitmap_room_collision_3_DATA_BANK,bitmap_room_collision_4_DATA_BANK,bitmap_room_collision_5_DATA_BANK,bitmap_room_collision_6_DATA_BANK

bitmap_room_behavior_ptr_table:
    DW bitmap_room_behavior_0
    DW bitmap_room_behavior_1
    DW bitmap_room_behavior_2
    DW bitmap_room_behavior_3
    DW bitmap_room_behavior_4
    DW bitmap_room_behavior_5
    DW bitmap_room_behavior_6

; Konami data bank for each room behavior grid
bitmap_room_behavior_bank_table:
    DB bitmap_room_behavior_0_DATA_BANK,bitmap_room_behavior_1_DATA_BANK,bitmap_room_behavior_2_DATA_BANK,bitmap_room_behavior_3_DATA_BANK,bitmap_room_behavior_4_DATA_BANK,bitmap_room_behavior_5_DATA_BANK,bitmap_room_behavior_6_DATA_BANK

; Edge rails per room: west,east,north,south (#FF = none)
bitmap_room_transition_table:
    DB #FF,#01,#FF,#FF,#00,#FF,#02,#FF,#FF,#FF,#03,#01,#FF,#FF,#04,#02
    DB #FF,#FF,#05,#03,#FF,#06,#FF,#04,#05,#FF,#FF,#FF

bitmap_room_spawn_x_table:
    DB 31,0,32,0,0,0,0
bitmap_room_spawn_y_table:
    DB 143,216,144,216,216,216,216

; __MIDEAS_BITMAP_RESIDENT_DISPATCH_END__


; ==================================================================
; SCC MUSIC (Fase 5): driver + row players + public music_* API
; (song DATA is emitted at #A000 near the end of the boot image: the
; resident #4000-#7FFF window must keep the room tables below #8000)
; ==================================================================
; SCC validation: no warnings

; ---- SCC original register map (mirror of utils/audio/sccConstants.js) ------
SCC_ENABLE_ADDR EQU #9000   ; write #3F here to expose SCC at #9800-#9FFF
SCC_ENABLE_VAL  EQU #3F
SCC_WAVE_CH1    EQU #9800   ; 32 bytes per channel, ch4/ch5 share #9860
SCC_PERIOD_BASE EQU #9880   ; 2 bytes per channel, low byte first, 12 bits
SCC_VOLUME_BASE EQU #988A   ; 1 byte per channel, low nibble 0..15
SCC_MIXER       EQU #988F   ; bits 0..4 enable channels 1..5
SCC_MIXER_MASK  EQU #1F

; -----------------------------------------------------------------------------
; SCC_Init
; What:   Enable SCC register access (Konami SCC cartridge) + silence channels.
; Inputs: Page 2 already mapped to the cartridge slot.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_Init:
    ld a, SCC_ENABLE_VAL
    ld (SCC_ENABLE_ADDR), a
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_Stop
; What:   Silence every SCC channel (volumes 0 + mixer 0).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_Stop:
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld b, 5
SCC_Stop_loop:
    ld (hl), a
    inc hl
    djnz SCC_Stop_loop
    ret

; -----------------------------------------------------------------------------
; SCC_SetMixer
; What:   (#988F) = A & #1F. bit0 ch1 .. bit4 ch5.
; Destroys: AF   Preserves: BC, DE, HL, IX, IY
; -----------------------------------------------------------------------------
SCC_SetMixer:
    and SCC_MIXER_MASK
    ld (SCC_MIXER), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetVolume
; What:   Volume for one channel. A = channel 0..4, E = volume (low nibble).
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_SetVolume:
    ld hl, SCC_VOLUME_BASE
    add a, l                ; #8A + 0..4 never carries
    ld l, a
    ld a, e
    and #0F
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetPeriod
; What:   12-bit divider. A = channel 0..4, DE = period (low 12 bits).
;         f = 3579545 / (32 * (period + 1)). Low byte first.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_SetPeriod:
    add a, a
    ld hl, SCC_PERIOD_BASE
    add a, l                ; #80 + 0..8 never carries
    ld l, a
    ld (hl), e
    inc hl
    ld a, d
    and #0F
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_LoadWaveform32
; What:   Copy 32-byte waveform to a channel. A = channel 0..4, HL = source.
;         Channel index 4 clamps to #9860 (shared ch4/ch5 on SCC original).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; Cost:   32-byte LDIR. Only call on instrument change, never per frame.
; -----------------------------------------------------------------------------
SCC_LoadWaveform32:
    cp 4
    jp c, SCC_LoadWaveform32_ch
    ld a, 3
SCC_LoadWaveform32_ch:
    rlca
    rlca
    rlca
    rlca
    rlca                    ; A = channel * 32 (max 96, no wrap)
    ld e, a
    ld d, #98
    ld bc, 32
    ldir
    ret

; ==================================================================
; SCC MUSIC RUNTIME (Fase 1)
; Row player over the validated SCC driver primitives. All SCC register
; traffic goes through shadows: nothing is rewritten unless it changed.
; ==================================================================

SCC_MUSIC_TRACK_COUNT EQU 1

scc_music_track_ptr_table:
    DW scc_track_0_scc_silent_stub_data

; ------------------------------------------------------------------
; scc_music_init_system
; What:   Reset SCC music RAM, expose the SCC and silence the chip.
; Inputs: Page 2 already mapped to the cartridge slot (ENASLT done).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; ------------------------------------------------------------------
scc_music_init_system:
    xor a
    ld (scc_music_active), a
    ld (scc_music_muted), a
    ld (scc_music_loop_count), a
    ld (scc_music_loop_enabled), a
    ld (scc_music_mixer_shadow), a
    call scc_music_reset_channels
    ; The SCC shares the P2 bank register. Keep the caller's mapper bank on
    ; the CPU stack so nested resource loads cannot corrupt a global save slot.
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Init           ; #3F -> #9000 + mixer/volumes to 0
    pop af
    call mapper_set_bank_p2
    ret

; ------------------------------------------------------------------
; scc_music_reset_channels
; What:   Reset per-channel player state (note off, no waveform cached,
;         full volume base, no envelope, force volume rewrite).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; ------------------------------------------------------------------
scc_music_reset_channels:
    ld hl, scc_ch_note
    ld b, 5
scc_music_reset_note_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_reset_note_loop
    ld hl, scc_ch_wave
    ld b, 5
scc_music_reset_wave_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_reset_wave_loop
    ld hl, scc_ch_volbase
    ld b, 5
scc_music_reset_volbase_loop:
    ld (hl), #0F
    inc hl
    djnz scc_music_reset_volbase_loop
    xor a
    ld hl, scc_ch_envlen
    ld b, 5
scc_music_reset_envlen_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_envlen_loop
    ld hl, scc_ch_envstep
    ld b, 5
scc_music_reset_envstep_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_envstep_loop
    ld hl, scc_ch_volout
    ld b, 5
scc_music_reset_volout_loop:
    ld (hl), #FF            ; sentinel: force first real write
    inc hl
    djnz scc_music_reset_volout_loop
    ; arpeggio + vibrato disabled, period shadow forced to rewrite
    xor a
    ld hl, scc_ch_arp_len
    ld b, 5
scc_music_reset_arplen_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_arplen_loop
    ld hl, scc_ch_vib_shift
    ld b, 5
scc_music_reset_vibshift_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_vibshift_loop
    ld hl, scc_ch_vib_phase
    ld b, 5
scc_music_reset_vibphase_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_vibphase_loop
    ld hl, scc_ch_period_hi
    ld b, 5
scc_music_reset_period_loop:
    ld (hl), #FF           ; sentinel: force first period write
    inc hl
    djnz scc_music_reset_period_loop
    ; noise/morph engines idle
    xor a
    ld hl, scc_ch_flags
    ld b, 5
scc_music_reset_flags_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_flags_loop
    ld a, #FF
    ld (scc_morph_chan), a  ; morph engine inactive
    ret

; ------------------------------------------------------------------
; scc_music_play_track
; What:   Start SCC song A (0-based). B bit 0 = loop flag.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_play_track:
    push bc
    ld c, a
    ld a, b
    and 1
    ld (scc_music_loop_enabled), a
    ld a, c
    cp SCC_MUSIC_TRACK_COUNT
    jp c, scc_music_play_track_valid
    pop bc
    jp scc_music_stop
scc_music_play_track_valid:
    add a, a
    ld e, a
    ld d, 0
    ld hl, scc_music_track_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (scc_music_track_ptr), de
    ; parse header
    ex de, hl               ; HL = track data
    ld a, (hl)              ; +0 row frames
    ld (scc_music_row_frames), a
    inc hl
    ld a, (hl)              ; +1 order length
    ld (scc_music_order_len), a
    inc hl
    ld a, (hl)              ; +2 restart position
    ld (scc_music_restart_pos), a
    inc hl
    inc hl                  ; +3 pattern count (implicit via tables)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_order_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_pattern_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_inst_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (scc_music_orn_table_ptr), de
    call scc_music_reset_channels
    xor a
    ld (scc_music_muted), a
    ld (scc_music_mixer_shadow), a
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Stop
    pop af
    call mapper_set_bank_p2
    xor a
    call scc_music_set_order_pos
    ld a, 1
    ld (scc_music_row_countdown), a   ; first update plays row 0
    ld (scc_music_active), a
    pop bc
    ret

; ------------------------------------------------------------------
; scc_music_set_order_pos
; What:   Position the player at order entry A: resolve pattern index,
;         set row pointer and row count, reset row counter.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
scc_music_set_order_pos:
    ld (scc_music_order_pos), a
    ld e, a
    ld d, 0
    ld hl, (scc_music_order_ptr)
    add hl, de
    ld a, (hl)              ; pattern index
    ld e, a
    ld d, 0
    ld hl, (scc_music_pattern_table_ptr)
    add hl, de
    add hl, de
    add hl, de              ; entries are 3 bytes: DW rows, DB numRows
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)
    ld (scc_music_pattern_rows), a
    ld (scc_music_row_ptr), de
    xor a
    ld (scc_music_pattern_row), a
    ret

; ------------------------------------------------------------------
; scc_music_stop / scc_music_mute / scc_music_resume
; Same contracts as the PSG tracker block equivalents.
; ------------------------------------------------------------------
scc_music_stop:
    push af
    push bc
    push hl
    call scc_music_init_system
    pop hl
    pop bc
    pop af
    ret

scc_music_mute:
    ld a, (scc_music_active)
    or a
    ret z
    ld a, 1
    ld (scc_music_muted), a
    push bc
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Stop
    pop af
    call mapper_set_bank_p2
    pop bc
    ret

scc_music_resume:
    ld a, (scc_music_active)
    or a
    ret z
    xor a
    ld (scc_music_muted), a
    ; volumes rewrite themselves on the next update via #FF shadows
    push bc
    ld hl, scc_ch_volout
    ld b, 5
scc_music_resume_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_resume_loop
    xor a
    ld (scc_music_mixer_shadow), a
    pop bc
    ret

; ------------------------------------------------------------------
; scc_music_update
; What:   Advance SCC music by one video frame: row timing, note/
;         instrument/volume events, per-frame volume envelopes, mixer.
;         Writes SCC registers only when shadow state changed.
; Inputs: Runtime RAM initialized (scc_music_play_track).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; Cost:   Cheap on hold frames; note-on with waveform change costs one
;         32-byte LDIR per changed channel. Call once per frame from
;         the main loop, never from H.TIMI.
; ------------------------------------------------------------------
scc_music_update:
    ld a, (scc_music_active)
    or a
    ret z
    ld a, (scc_music_muted)
    or a
    ret nz
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    ld hl, scc_music_row_countdown
    dec (hl)
    jp nz, scc_music_update_effects
    ld a, (scc_music_row_frames)
    ld (hl), a
    call scc_music_advance_row
    ld a, (scc_music_active)
    or a
    jp z, scc_music_update_restore_bank
scc_music_update_effects:
    call scc_music_update_pitch
    call scc_music_update_morph
    call scc_music_update_noise
    call scc_music_update_envelopes
    call scc_music_apply_mixer
scc_music_update_restore_bank:
    pop af
    jp mapper_set_bank_p2

; ------------------------------------------------------------------
; scc_music_advance_row
; What:   Decode the current row (5 channels x 4 bytes: note,
;         instrument, ornament, volume) and fire channel events, then
;         advance row/order position with restart wrap.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_advance_row:
    ld hl, (scc_music_row_ptr)
    ld c, 0                 ; channel index
scc_music_row_ch_loop:
    ld b, (hl)              ; note field
    inc hl
    ld d, (hl)              ; instrument field
    inc hl
    ld e, (hl)              ; ornament field
    inc hl
    push hl
    push bc                 ; save note (B) + channel (C)
    push de                 ; save instrument (D)
    ld a, e                 ; ornament field -> arp arrays for this channel
    call scc_music_apply_ornament
    pop de                  ; D = instrument field
    pop bc                  ; B = note, C = channel
    pop hl
    ld e, (hl)              ; volume field
    inc hl
    push hl
    push bc
    call scc_music_apply_cell
    pop bc
    pop hl
    inc c
    ld a, c
    cp 5
    jp c, scc_music_row_ch_loop
    ld (scc_music_row_ptr), hl
    ld hl, scc_music_pattern_row
    inc (hl)
    ld a, (scc_music_pattern_rows)
    cp (hl)
    ret nz
    ; end of pattern: next order entry (wrap to restart position)
    ld a, (scc_music_order_pos)
    inc a
    ld e, a
    ld a, (scc_music_order_len)
    cp e
    jp nz, scc_music_advance_order_set
    ld hl, scc_music_loop_count
    inc (hl)
    ld a, (scc_music_loop_enabled)
    or a
    jp z, scc_music_stop
    ld a, (scc_music_restart_pos)
    ld e, a
scc_music_advance_order_set:
    ld a, e
    jp scc_music_set_order_pos

; ------------------------------------------------------------------
; scc_music_apply_cell
; What:   Apply one row cell to one channel.
; Inputs: C = channel 0..4, B = note field, D = instrument field,
;         E = volume field.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_apply_cell:
    ; ---- instrument field first (note-on may use its volume/wave) ----
    ld a, d
    cp #FF
    jp z, scc_music_cell_volume
    or a
    jp z, scc_music_cell_volume
    push bc                 ; keep note (B) + channel (C)
    push de                 ; keep volume field (E)
    add a, a
    ld e, a
    ld d, 0
    ld hl, (scc_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, scc_music_cell_inst_done   ; null instrument pointer
    ex de, hl               ; HL = instrument record
    ; +0 waveform index -> load only when the channel timbre changes
    ld e, (hl)              ; E = new waveform index
    push hl
    ld hl, scc_ch_wave
    call scc_wave_cache_ptr
    ld a, (hl)
    cp e
    jp z, scc_music_cell_wave_same
    ld (hl), e
    ld l, e                 ; HL = scc_wave_table + E*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld a, c
    push bc
    call SCC_LoadWaveform32
    pop bc
    ; a fresh waveform load cancels a running morph on this channel
    ld a, (scc_morph_chan)
    cp c
    jp nz, scc_music_cell_wave_same
    ld a, #FF
    ld (scc_morph_chan), a
scc_music_cell_wave_same:
    pop hl                  ; instrument record +0
    inc hl                  ; +1 default volume
    ld e, (hl)
    push hl
    ld hl, scc_ch_volbase
    call scc_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +2 envelope ptr low
    ld e, (hl)
    inc hl                  ; +3 envelope ptr high
    ld d, (hl)
    inc hl                  ; +4 envelope length
    ld b, (hl)              ; note field already saved on stack
    inc hl                  ; +5 envelope loop
    ld a, (hl)              ; A = envelope loop
    inc hl                  ; HL = instrument record +6 (vibrato block)
    push hl                 ; save record+6 for the vibrato read below
    push af                 ; save envelope loop
    push de
    ld hl, scc_ch_envlo
    call scc_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, scc_ch_envhi
    call scc_ch_ptr
    pop de
    ld (hl), d
    ld hl, scc_ch_envlen
    call scc_ch_ptr
    ld (hl), b
    pop af                  ; envelope loop
    ld e, a
    ld hl, scc_ch_envloop
    call scc_ch_ptr
    ld (hl), e
    ; ---- cache per-instrument vibrato (depth/speed/delay) for this channel ----
    pop hl                  ; HL = instrument record +6
    ld e, (hl)              ; +6 vibrato depth/shift
    inc hl
    ld b, (hl)              ; +7 vibrato speed
    inc hl
    ld d, (hl)              ; +8 vibrato delay
    inc hl
    push hl                 ; save record +9 for the noise/morph block
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_vib_speed
    call scc_ch_ptr
    ld (hl), b
    ld hl, scc_ch_vib_delay
    call scc_ch_ptr
    ld (hl), d
    ; ---- cache noise/morph config (+9 flags, +10 morph wave, +11 speed) ----
    pop hl                  ; HL = instrument record +9
    ld e, (hl)              ; flags: bit0 noise, bit1 morph
    inc hl
    ld b, (hl)              ; morph target waveform index
    inc hl
    ld d, (hl)              ; morph frames per step
    ld hl, scc_ch_flags
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_morph_wave
    call scc_ch_ptr
    ld (hl), b
    ld hl, scc_ch_morph_speed
    call scc_ch_ptr
    ld (hl), d
scc_music_cell_inst_done:
    pop de
    pop bc
scc_music_cell_volume:
    ; ---- volume field: overrides the channel volume base ----
    ld a, e
    cp #FF
    jp z, scc_music_cell_note
    and #0F
    ld e, a
    ld hl, scc_ch_volbase
    call scc_ch_ptr
    ld (hl), e
scc_music_cell_note:
    ; ---- note field ----
    ld a, b
    cp #FF
    ret z                   ; keep playing
    cp #FE
    jp z, scc_music_cell_note_cut
    ; note on: store the base note; the per-frame pitch engine computes the
    ; effective period (base note + arpeggio + vibrato) and writes it this
    ; same frame. Restart envelope, arpeggio and vibrato phase.
    ld e, a
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_envstep
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_vib_phase
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_vib_delay
    call scc_ch_ptr
    ld e, (hl)
    ld hl, scc_ch_vib_ctr
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    ld (hl), #FF            ; force the pitch engine to write the period
    ; morph trigger (instrument flag bit1); a note-on without the flag
    ; cancels any morph still running on this channel.
    ld hl, scc_ch_flags
    call scc_ch_ptr
    bit 1, (hl)
    jp nz, scc_morph_start  ; C = channel; tail call
    ld a, (scc_morph_chan)
    cp c
    ret nz
    ld a, #FF
    ld (scc_morph_chan), a
    ret
scc_music_cell_note_cut:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), #FF
    ; stop arpeggio so a silenced channel does not keep stepping
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), 0
    ; force volume 0 now and refresh shadow
    ld hl, scc_ch_volout
    call scc_ch_ptr
    ld (hl), 0
    ld e, 0
    ld a, c
    push bc
    call SCC_SetVolume
    pop bc
    ret

; ------------------------------------------------------------------
; scc_ch_ptr
; What:   HL = HL + C (channel index 0..4) with carry into H.
; Destroys: AF   Preserves: BC, DE, IX, IY
; ------------------------------------------------------------------
scc_ch_ptr:
    ld a, c
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; scc_wave_cache_ptr
; What:   HL = HL + min(C, 3). SCC original channels 4/5 share both
;         hardware waveform RAM and one cache entry.
; Destroys: AF   Preserves: BC, DE, IX, IY
; ------------------------------------------------------------------
scc_wave_cache_ptr:
    ld a, c
    cp 4
    jp c, scc_wave_cache_ptr_add
    ld a, 3
scc_wave_cache_ptr_add:
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; scc_morph_start
; What:   Arm the global morph engine for channel C (TriloTracker-style,
;         one morph at a time): copy the channel's current ROM waveform
;         into scc_morph_buf and precompute 16-step per-sample deltas
;         towards the instrument's morph target waveform.
; Inputs: C = channel 0..4; scc_ch_wave / scc_ch_morph_wave / _speed caches.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_morph_start:
    ld hl, scc_ch_wave
    call scc_wave_cache_ptr
    ld a, (hl)
    cp #FF
    ret z                   ; no waveform loaded yet: nothing to morph
    ld b, a                 ; B = source waveform index
    ld hl, scc_ch_morph_wave
    call scc_ch_ptr
    ld a, (hl)
    cp b
    ret z                   ; source == target: nothing to do
    ld (scc_morph_tgt_idx), a
    push bc                 ; keep B = source idx, C = channel
    ld l, a                 ; target ROM ptr = scc_wave_table + idx*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld a, l
    ld (scc_morph_tgt_lo), a
    ld a, h
    ld (scc_morph_tgt_hi), a
    pop bc
    ld l, b                 ; source ROM ptr = scc_wave_table + idx*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld de, scc_morph_buf
    push bc
    ld bc, 32
    ldir                    ; working buffer = source waveform
    pop bc
    ; deltas: (target[i] - buf[i]) asr 4 (16 steps; final step is exact)
    push bc                 ; C = channel, restored after the loop
    ld hl, (scc_morph_tgt_lo)
    ld de, scc_morph_buf
    ld b, 32
scc_morph_delta_loop:
    ld a, (de)
    ld c, a                 ; C = current sample (channel saved on stack)
    ld a, (hl)
    sub c                   ; target - current, signed
    sra a
    sra a
    sra a
    sra a                   ; /16 keeping the sign
    push hl
    ld hl, scc_morph_delta - scc_morph_buf
    add hl, de              ; matching slot in the delta array
    ld (hl), a
    pop hl
    inc hl
    inc de
    djnz scc_morph_delta_loop
    pop bc
    ; arm the engine
    ld hl, scc_ch_morph_speed
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp nz, scc_morph_speed_ok
    inc a                   ; speed 0 would never tick: clamp to 1
scc_morph_speed_ok:
    ld (scc_morph_speed_cur), a
    ld (scc_morph_timer), a
    ld a, 16
    ld (scc_morph_step), a
    ld a, c
    ld (scc_morph_chan), a  ; set LAST: engine now live
    ret

; ------------------------------------------------------------------
; scc_music_update_morph
; What:   Advance the global waveform morph: every speed_cur frames add
;         the per-sample deltas to the working buffer and upload it to
;         the morphing channel; the FINAL step uploads the exact target
;         (kills rounding drift) and updates the channel wave cache.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_morph:
    ld a, (scc_morph_chan)
    cp #FF
    ret z
    ld hl, scc_morph_timer
    dec (hl)
    ret nz
    ld a, (scc_morph_speed_cur)
    ld (hl), a
    ld hl, scc_morph_step
    dec (hl)
    jp z, scc_morph_finish
    ld hl, scc_morph_buf
    ld de, scc_morph_delta
    ld b, 32
scc_morph_add_loop:
    ld a, (de)
    add a, (hl)
    ld (hl), a
    inc hl
    inc de
    djnz scc_morph_add_loop
    ld hl, scc_morph_buf
    ld a, (scc_morph_chan)
    jp SCC_LoadWaveform32   ; A = channel, HL = source
scc_morph_finish:
    ld hl, (scc_morph_tgt_lo)
    ld a, (scc_morph_chan)
    push af
    call SCC_LoadWaveform32
    pop af
    ld c, a
    ld hl, scc_ch_wave      ; cache = target idx: same-instrument reloads skip
    call scc_wave_cache_ptr
    ld a, (scc_morph_tgt_idx)
    ld (hl), a
    ld a, #FF
    ld (scc_morph_chan), a
    ret

; ------------------------------------------------------------------
; scc_music_update_noise
; What:   Real white noise (manual cap. 7): for every live channel with
;         the noise flag, upload 32 fresh pseudo-random bytes from
;         scc_noise_table. The offset advances by a prime (37) so
;         consecutive frames never repeat the same slice.
; Cost:   One 32-byte LDIR per noise channel per frame.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_noise:
    ld c, 0
scc_noise_ch_loop:
    ld hl, scc_ch_flags
    call scc_ch_ptr
    bit 0, (hl)
    jp z, scc_noise_next
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, scc_noise_next    ; silent channel: skip the upload
    ld a, (scc_noise_phase)
    add a, 37
    ld (scc_noise_phase), a
    ld l, a
    ld h, 0
    ld de, scc_noise_table
    add hl, de
    ld a, c
    push bc
    call SCC_LoadWaveform32
    pop bc
scc_noise_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_noise_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_apply_ornament
; What:   Bind an ornament (arpeggio) to a channel from a row cell.
; Inputs: A = ornament field (#FF keep, 0 clear, 1..15 select),
;         C = channel 0..4. Ornament pointer table = scc_music_orn_table_ptr.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
scc_music_apply_ornament:
    cp #FF
    ret z                    ; keep current ornament
    or a
    jp z, scc_music_orn_clear
    ; look up ornament ptr table[A] (2 bytes/entry)
    add a, a
    ld e, a
    ld d, 0
    ld hl, (scc_music_orn_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)               ; DE = ornament record pointer (0 = none)
    ld a, e
    or d
    jp z, scc_music_orn_clear
    ex de, hl                ; HL = ornament record (+0 len, +1 loop, +2 data)
    ld a, (hl)               ; len
    inc hl                   ; -> loop
    ld d, (hl)               ; D = loop
    inc hl                   ; HL = data pointer
    ld e, a                  ; E = len
    push hl                  ; save data pointer
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), e               ; arp_len = len
    ld hl, scc_ch_arp_loop
    call scc_ch_ptr
    ld (hl), d               ; arp_loop = loop
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld (hl), 0               ; restart the arpeggio
    pop de                   ; DE = data pointer
    ld hl, scc_ch_arp_lo
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_arp_hi
    call scc_ch_ptr
    ld (hl), d
    ret
scc_music_orn_clear:
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), 0               ; inactive
    ret

; ------------------------------------------------------------------
; scc_music_update_pitch
; What:   Per-frame pitch for every live channel: effective note =
;         base note + arpeggio step offset, converted to a period, then
;         a triangle-LFO vibrato offset is added. The SCC period is
;         written only when it differs from the per-channel shadow.
; Inputs: scc_ch_note / arp / vib arrays, scc_note_period_table, scc_vib_table.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_pitch:
    ld c, 0                  ; channel index
scc_pitch_ch_loop:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, scc_pitch_next     ; silent channel: nothing to pitch
    ld b, a                  ; B = effective note (base to start)
    ; ---- arpeggio ----
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_no_arp
    ld d, a                  ; D = len (>=1)
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld a, (hl)               ; step
    cp d
    jp c, scc_pitch_arp_step_ok
    ; step past end: wrap to loop, or hold the last entry
    ld hl, scc_ch_arp_loop
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp nz, scc_pitch_arp_step_ok
    ld a, d
    dec a                    ; hold last (len-1)
scc_pitch_arp_step_ok:
    ld e, a                  ; E = effective step (0..len-1)
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld a, e
    inc a
    ld (hl), a               ; store step+1 for next frame
    ld hl, scc_ch_arp_lo
    call scc_ch_ptr
    ld a, (hl)
    ld hl, scc_ch_arp_hi
    call scc_ch_ptr
    ld h, (hl)
    ld l, a                  ; HL = ornament data base
    ld d, 0                  ; DE = step (E)
    add hl, de
    ld a, (hl)               ; signed semitone offset
    add a, b
    ld b, a                  ; effective note += offset
scc_pitch_no_arp:
    ; ---- base period lookup (clamp note to 0..95) ----
    ld a, b
    cp 96
    jp c, scc_pitch_note_ok
    ld a, 95
scc_pitch_note_ok:
    add a, a
    ld l, a
    ld h, 0
    ld de, scc_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)               ; DE = base period
    ; ---- vibrato (triangle LFO scaled by shift) ----
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_write    ; vibrato disabled
    ld hl, scc_ch_vib_ctr
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_vib_active
    dec (hl)                 ; delay still counting down
    jp scc_pitch_write
scc_pitch_vib_active:
    push de                  ; save base period across the delta math
    ld hl, scc_ch_vib_speed
    call scc_ch_ptr
    ld a, (hl)
    ld hl, scc_ch_vib_phase
    call scc_ch_ptr
    add a, (hl)
    ld (hl), a               ; phase += speed
    rrca
    rrca
    and #3F                  ; idx = (phase >> 2) & 63
    ld l, a
    ld h, 0
    ld de, scc_vib_table
    add hl, de
    ld a, (hl)               ; signed triangle value
    ld e, a                  ; E = value
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld a, 5
    sub (hl)                 ; N = 5 - shift (0..4)
    ld b, a
    ld a, e                  ; A = triangle value
    inc b
    jr scc_pitch_vib_sra_test
scc_pitch_vib_sra:
    sra a                    ; arithmetic (sign-preserving) shift right
scc_pitch_vib_sra_test:
    dec b
    jr nz, scc_pitch_vib_sra
    pop de                   ; DE = base period
    ld l, a
    ld h, 0
    bit 7, a
    jr z, scc_pitch_vib_pos
    ld h, #FF                ; sign-extend a negative delta
scc_pitch_vib_pos:
    add hl, de
    ex de, hl                ; DE = period + vibrato delta
scc_pitch_write:
    ; write DE to the SCC only when it differs from the channel shadow
    ld hl, scc_ch_period_lo
    call scc_ch_ptr
    ld a, e
    cp (hl)
    jp nz, scc_pitch_do_write
    ld a, d
    and #0F
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    cp (hl)
    jp z, scc_pitch_next
scc_pitch_do_write:
    ld hl, scc_ch_period_lo
    call scc_ch_ptr
    ld (hl), e
    ld a, d
    and #0F
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    ld (hl), a
    ld a, c
    push bc
    call SCC_SetPeriod
    pop bc
scc_pitch_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_pitch_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_update_envelopes
; What:   Per-frame volume for each active channel: envelope value
;         (attenuated by the channel volume base) or the base itself.
;         Writes SCC volume only when it differs from the shadow.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_envelopes:
    ld c, 0
scc_music_env_ch_loop:
    ; skip silent channels (note == #FF)
    ld hl, scc_ch_note
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, scc_music_env_next
    ; envelope length
    ld hl, scc_ch_envlen
    add hl, de
    ld a, (hl)
    or a
    jp z, scc_music_env_use_base
    ld b, a                 ; B = length
    ; step with hold/loop
    ld hl, scc_ch_envstep
    add hl, de
    ld a, (hl)
    cp b
    jp c, scc_music_env_step_ok
    ; past the end: loop or hold last
    push hl
    ld hl, scc_ch_envloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, scc_music_env_step_ok
    ld a, b
    dec a                   ; hold last value
scc_music_env_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch envelope[A]
    push de
    ld hl, scc_ch_envlo
    add hl, de
    ld e, (hl)
    ld hl, scc_ch_envhi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    ; attenuate by volume base: vol = min(env, volbase)
    ld hl, scc_ch_volbase
    add hl, de
    cp (hl)
    jp c, scc_music_env_apply
    ld a, (hl)
    jp scc_music_env_apply
scc_music_env_use_base:
    ld hl, scc_ch_volbase
    add hl, de
    ld a, (hl)
scc_music_env_apply:
    ; write only on change
    ld hl, scc_ch_volout
    add hl, de
    cp (hl)
    jp z, scc_music_env_next
    ld (hl), a
    ld e, a
    ld a, c
    push bc
    call SCC_SetVolume
    pop bc
scc_music_env_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_music_env_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_apply_mixer
; What:   Rebuild the channel-enable mask from scc_ch_note (bit set
;         when the channel holds a live note) and write it through
;         the shadow.
; Destroys: AF, BC, HL   Preserves: DE, IX, IY
; ------------------------------------------------------------------
scc_music_apply_mixer:
    ld hl, scc_ch_note
    ld b, 5
    ld c, 0                 ; mask accumulator
scc_music_mixer_loop:
    ld a, (hl)
    inc hl
    cp #FF
    jp z, scc_music_mixer_bit_done
    scf
scc_music_mixer_bit_done:
    rr c                    ; carry -> bit 7; after 5 rounds bits 3..7
    djnz scc_music_mixer_loop
    ld a, c
    rrca
    rrca
    rrca                    ; bits 3..7 -> bits 0..4
    and SCC_MIXER_MASK
    ld hl, scc_music_mixer_shadow
    cp (hl)
    ret z
    ld (hl), a
    jp SCC_SetMixer

; ==================================================================
; PSG MUSIC RUNTIME (dual-chip Fase 3)
; Plays the PSG half (columns A-C) of a 'PSG+SCC' song in lockstep with
; the SCC player: same header layout, same frames-per-row cadence.
; ==================================================================

PSG_REG_PORT EQU #A0
PSG_VAL_PORT EQU #A1
PSG_ENV_LO EQU 11
PSG_ENV_HI EQU 12
PSG_ENV_SHAPE EQU 13
MUSIC_TRACK_ENV_BASE EQU 12
MUSIC_TRACK_NOISE_DEFAULT EQU 14
MUSIC_INSTRUMENT_PT3_MODE EQU 15
MUSIC_PT3_STEP_SIZE EQU 5
music_note_period_table EQU psg_note_period_table

; psg_reg_write: A = register 0..13, E = value.
; Destroys: AF   Preserves: BC, DE, HL, IX, IY
psg_reg_write:
    out (PSG_REG_PORT), a
    ld a, e
    out (PSG_VAL_PORT), a
    ret

; psg_ch_ptr: HL = array base, C = channel 0..2 -> HL += C.
; Destroys: AF   Preserves: BC, DE, IX, IY
psg_ch_ptr:
    ld a, c
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; psg_music_init_system
; What:   Reset the PSG music RAM and silence the AY (R7=#BF, vols 0).
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_init_system:
    xor a
    ld (psg_music_active), a
    ld (psg_music_muted), a
    ld (psg_music_loop_enabled), a
    xor a
    ld (psg_music_use_ch_c), a   ; no song descriptor is active yet
    call psg_music_reset_channels
    call psg_music_reset_pt3_state
    jp psg_music_silence
; psg_music_silence: R7 all off (#BF keeps MSX I/O port directions), vols 0.
; Destroys: AF, E   Preserves: BC, D, HL, IX, IY
psg_music_silence:
    ld e, #BF
    ld a, 7
    call psg_reg_write
    ld e, 0
    ld a, 8
    call psg_reg_write
    ld e, 0
    ld a, 9
    call psg_reg_write
    ld e, 0
    ld a, 10
    jp psg_reg_write

; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
psg_music_reset_channels:
    ld hl, psg_ch_note
    ld a, #FF
    ld b, 6                 ; base + effective notes for A/B/C
psg_music_reset_note_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_note_loop
    ld hl, psg_ch_flags
    ld a, #01               ; tone enabled by default
    ld b, 3
psg_music_reset_flags_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_flags_loop
    ld hl, psg_ch_volbase
    ld a, #0F
    ld b, 3
psg_music_reset_volbase_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_volbase_loop
    ; envelope + tone/noise-macro state, volout and cached periods all to 0
    xor a
    ld hl, psg_ch_envlen
    ld b, 3 * 16            ; envlen..period_hi + tone* (5) + noise* (5) arrays
psg_music_reset_zero_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_zero_loop
    ld (psg_music_noise_period), a
    ld hl, psg_ch_noiseper
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    ret

; Reset dual-PSG PT3 state on init/restart only. AddToNs must remain persistent
; between ordinary frames, exactly like the PT3 replayer.
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
psg_music_reset_pt3_state:
    xor a
    ld hl, psg_ch_instrument
    ld b, psg_music_pt3_ram_end - psg_ch_instrument
psg_music_reset_pt3_loop:
    ld (hl), a
    inc hl
    djnz psg_music_reset_pt3_loop
    ld a, #BF
    ld (music_mixer_shadow), a
    ld a, 1
    ld (music_pt3_env_mode), a
    ret

; ------------------------------------------------------------------
; psg_music_play_ptr
; What:   Start the PSG half. HL = psg track data, B bit0 = loop flag.
;         Header layout shared with the SCC serializer.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_play_ptr:
    ld (psg_music_track_ptr), hl
    ld a, b
    and 1
    ld (psg_music_loop_enabled), a
    ld a, (hl)              ; +0 frames per row
    ld (psg_music_row_frames), a
    inc hl
    ld a, (hl)              ; +1 order length
    ld (psg_music_order_len), a
    inc hl
    ld a, (hl)              ; +2 restart position
    ld (psg_music_restart_pos), a
    inc hl
    inc hl                  ; +3 pattern count (implicit via tables)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (psg_music_order_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (psg_music_pattern_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (psg_music_inst_table_ptr), de
    inc hl                  ; -> +10 channel ownership flags
    ld a, (hl)
    and 1
    ld (psg_music_use_ch_c), a   ; PT3/Vortex music normally owns A/B/C
    ld de, 5
    add hl, de               ; +15 pattern bank table pointer
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (psg_music_pattern_bank_ptr), de
    inc hl                  ; +17 ornament pointer table
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (psg_music_orn_table_ptr), de
    push bc
    call psg_music_reset_channels
    call psg_music_reset_pt3_state
    pop bc
    call psg_music_silence
    xor a
    ld (psg_music_muted), a
    call psg_music_set_order_pos
    ld a, 1
    ld (psg_music_row_countdown), a   ; first update plays row 0
    ld (psg_music_active), a
    ret

; Destroys: AF, DE, HL   Preserves: BC, IX, IY
psg_music_set_order_pos:
    ld (psg_music_order_pos), a
    ld e, a
    ld d, 0
    ld hl, (psg_music_order_ptr)
    add hl, de
    ld a, (hl)              ; pattern index
    ld e, a
    ld d, 0
    push de
    ld hl, (psg_music_pattern_bank_ptr)
    add hl, de
    ld a, (hl)
    ld (music_data_bank_cur), a
    ld (#B000), a           ; map the pattern body and its metadata clone
    pop de
    ld hl, (psg_music_pattern_table_ptr)
    add hl, de
    add hl, de
    add hl, de              ; entries are 3 bytes: DW rows, DB numRows
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)
    ld (psg_music_pattern_rows), a
    ld (psg_music_row_ptr), de
    xor a
    ld (psg_music_pattern_row), a
    ret

; Destroys: nothing (all registers preserved)
psg_music_stop:
    push af
    push bc
    push de
    push hl
    xor a
    ld (psg_music_active), a
    ld (psg_music_muted), a
    call psg_music_silence
    pop hl
    pop de
    pop bc
    pop af
    ret

; Destroys: AF, E   Preserves: BC, D, HL, IX, IY
psg_music_mute:
    ld a, (psg_music_active)
    or a
    ret z
    ld a, 1
    ld (psg_music_muted), a
    jp psg_music_silence

; Destroys: AF   Preserves: BC, DE, HL, IX, IY
psg_music_resume:
    ld a, (psg_music_active)
    or a
    ret z
    xor a
    ld (psg_music_muted), a  ; write-through re-asserts registers next frame
    ret

; ------------------------------------------------------------------
; psg_music_update
; What:   Advance the PSG half one frame: row timing + cell events,
;         volume envelopes, then re-assert R0..R10.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update:
    ld a, (psg_music_active)
    or a
    ret z
    ld a, (psg_music_muted)
    or a
    ret nz
    ld hl, psg_music_row_countdown
    dec (hl)
    jp nz, psg_music_apply_frame
    ld a, (psg_music_row_frames)
    ld (hl), a
    call psg_music_advance_row
    ld a, (psg_music_active)
    or a
    ret z
psg_music_apply_frame:
    call psg_music_update_ornaments
    call music_pt3_begin_frame
    ld a, #BF
    ld (music_mixer_shadow), a
    call psg_music_update_pitch
    call psg_music_update_noise_macro
    call psg_music_update_envelopes
    call psg_music_update_pt3_channels
    call music_pt3_finalize_frame
    jp psg_music_apply_registers


; Run the shared PT3 step decoder only for descriptors marked pt3-sample.
; Input: none   Output: PT3 channel/reducer state advanced once
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
psg_music_update_pt3_channels:
    ld c, 0
psg_music_pt3_ch_loop:
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    jr z, psg_music_pt3_ch_next
    push bc
    call music_update_one_pt3_channel
    pop bc
psg_music_pt3_ch_next:
    inc c
    ld a, c
    cp 3
    jr c, psg_music_pt3_ch_loop
    ret


; ------------------------------------------------------------------
; psg_music_update_noise_macro
; What:   Per-frame noise-envelope engine: channels with an active
;         noise macro rewrite psg_music_noise_period (R6 is global on
;         the AY; ascending channel order means C wins, matching the
;         PC preview). Same step semantics as the other macros.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_noise_macro:
    ld c, 0
psg_noisem_ch_loop:
    ld e, c
    ld d, 0
    ld hl, psg_ch_pt3mode
    add hl, de
    ld a, (hl)
    or a
    jp nz, psg_noisem_next
    ld hl, psg_ch_note
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, psg_noisem_next   ; silent channel
    ld hl, psg_ch_flags
    add hl, de
    bit 1, (hl)
    jp z, psg_noisem_next   ; noise disabled for this instrument
    ; Decayed notes must release R6: a held drum whose volume envelope hit 0
    ; would otherwise rewrite the noise period forever and stomp SFX noise.
    ld hl, psg_ch_volout
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_noisem_next
    ld hl, psg_ch_noiselen
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_noisem_next   ; no macro: note-on R6 latch stays
    ld b, a                 ; B = macro length
    ld hl, psg_ch_noisestep
    add hl, de
    ld a, (hl)
    cp b
    jp c, psg_noisem_step_ok
    push hl
    ld hl, psg_ch_noiseloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, psg_noisem_step_ok
    ld a, b
    dec a                   ; hold last value
psg_noisem_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch period = noise_env[A] (base+C addressing, E consumed by read)
    push de
    ld hl, psg_ch_noiselo
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_noisehi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    and #1F
    ld (psg_music_noise_period), a
psg_noisem_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_noisem_ch_loop
    ret

; ------------------------------------------------------------------
; psg_music_update_pitch
; What:   Per-frame tone-envelope engine (pitch macros): for each live
;         channel with a tone envelope, effective note = base note +
;         signed semitone offset -> psg_note_period_table -> period
;         shadows. Channels without a tone envelope keep the period
;         cached at note-on. Step semantics mirror the PC preview:
;         step 0 plays on the note-on frame, then +1 per frame, holding
;         the last step unless the loop index points inside the macro.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_pitch:
    ld c, 0
psg_pitchm_ch_loop:
    ld e, c
    ld d, 0
    ld hl, psg_ch_pt3mode
    add hl, de
    ld a, (hl)
    or a
    jp nz, psg_pitchm_next
    ld hl, psg_ch_effective_note
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, psg_pitchm_next   ; silent channel
    ld b, a                 ; B = base note index
    ld hl, psg_ch_tonelen
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_pitchm_next   ; no tone macro: note-on period stays
    push bc                 ; save base note + channel
    ld b, a                 ; B = macro length
    ld hl, psg_ch_tonestep
    add hl, de
    ld a, (hl)
    cp b
    jp c, psg_pitchm_step_ok
    push hl
    ld hl, psg_ch_toneloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, psg_pitchm_step_ok
    ld a, b
    dec a                   ; hold last value
psg_pitchm_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch signed offset = tone_env[A] (same base+C addressing as the
    ; volume envelope fetch: E is consumed by the low-byte read)
    push de
    ld hl, psg_ch_tonelo
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_tonehi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)              ; A = signed semitone offset
    pop de
    pop bc                  ; B = base note, C = channel
    add a, b                ; effective note (mod 256)
    ; clamp to the 96-entry table: 96..159 = overflow high, >=160 = wrapped low
    cp 96
    jp c, psg_pitchm_note_ok
    cp 160
    ld a, 95
    jp c, psg_pitchm_note_ok
    xor a
psg_pitchm_note_ok:
    ld l, a
    ld h, 0
    add hl, hl
    ld de, psg_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = AY period
    ld b, e                 ; base note no longer needed: B = period low
    ld a, d                 ; A = period high
    ld e, c
    ld d, 0
    ld hl, psg_ch_period_lo
    add hl, de
    ld (hl), b
    ld hl, psg_ch_period_hi
    add hl, de
    ld (hl), a
psg_pitchm_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_pitchm_ch_loop
    ret

; Destroys: AF, BC, DE, HL   Preserves: IX, IY
psg_music_advance_row:
    ld hl, (psg_music_row_ptr)
    ld c, 0                 ; channel index
psg_music_row_ch_loop:
    ld b, (hl)              ; note field
    inc hl
    ld d, (hl)              ; instrument field
    inc hl
    ld a, (hl)              ; ornament field
    inc hl
    ld e, (hl)              ; volume field
    inc hl
    push hl
    push bc
    push de
    call psg_music_apply_ornament
    pop de
    call psg_music_apply_cell
    pop bc
    pop hl
    inc c
    ld a, c
    cp 3
    jp c, psg_music_row_ch_loop
    ld (psg_music_row_ptr), hl
    ld hl, psg_music_pattern_row
    inc (hl)
    ld a, (psg_music_pattern_rows)
    cp (hl)
    ret nz
    ; end of pattern: next order entry (wrap to restart position)
    ld a, (psg_music_order_pos)
    inc a
    ld e, a
    ld a, (psg_music_order_len)
    cp e
    jp nz, psg_music_advance_order_set
    ld a, (psg_music_loop_enabled)
    or a
    jp z, psg_music_stop
    ld a, (psg_music_restart_pos)
    ld e, a
psg_music_advance_order_set:
    ld a, e
    jp psg_music_set_order_pos

; ------------------------------------------------------------------
; psg_music_apply_ornament
; What:   Bind/clear a PT3 ornament for one PSG music channel.
; Inputs: A = #FF keep, 0 clear, 1..15 select; C = channel 0..2.
; Output: Per-channel arpeggio pointer/length/loop/step updated.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
psg_music_apply_ornament:
    cp #FF
    ret z
    or a
    jp z, psg_music_orn_clear
    add a, a
    ld e, a
    ld d, 0
    ld hl, (psg_music_orn_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, psg_music_orn_clear
    ex de, hl
    ld a, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, a
    push hl
    ld hl, psg_ch_arp_len
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_arp_loop
    call psg_ch_ptr
    ld (hl), d
    ld hl, psg_ch_arp_step
    call psg_ch_ptr
    ld (hl), 0
    pop de
    ld hl, psg_ch_arp_lo
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_arp_hi
    call psg_ch_ptr
    ld (hl), d
    ret
psg_music_orn_clear:
    ld hl, psg_ch_arp_len
    call psg_ch_ptr
    ld (hl), 0
    ret

; ------------------------------------------------------------------
; psg_music_update_ornaments
; What:   effective note = base note + signed ornament step, clamp 0..95.
;         Legacy voices get their base period here; native PT3 voices consume
;         psg_ch_effective_note through music_ch_note_base later this frame.
; Inputs: PSG note/arpeggio state. Output: effective notes + tone shadows.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_ornaments:
    ld c, 0
psg_orn_update_loop:
    ld hl, psg_ch_note
    call psg_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, psg_orn_store_effective
    ld b, a
    ld hl, psg_ch_arp_len
    call psg_ch_ptr
    ld a, (hl)
    or a
    jp z, psg_orn_use_base
    ld d, a
    ld hl, psg_ch_arp_step
    call psg_ch_ptr
    ld a, (hl)
    cp d
    jp c, psg_orn_step_ready
    ld hl, psg_ch_arp_loop
    call psg_ch_ptr
    ld a, (hl)
psg_orn_step_ready:
    ld e, a
    inc a
    ld hl, psg_ch_arp_step
    call psg_ch_ptr
    ld (hl), a
    ld hl, psg_ch_arp_lo
    call psg_ch_ptr
    ld a, (hl)
    ld hl, psg_ch_arp_hi
    call psg_ch_ptr
    ld h, (hl)
    ld l, a
    ld d, 0
    add hl, de
    ld a, (hl)
    add a, b
    cp 96
    jp c, psg_orn_store_effective
    cp 160
    ld a, 95
    jp c, psg_orn_store_effective
    xor a
    jp psg_orn_store_effective
psg_orn_use_base:
    ld a, b
psg_orn_store_effective:
    push af
    ld hl, psg_ch_note
    call psg_ch_ptr
    pop af
    ld (hl), a
    cp #FF
    jp z, psg_orn_next
    ld b, a
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    jp nz, psg_orn_next
    ld a, b
    add a, a
    ld l, a
    ld h, 0
    ld de, psg_note_period_table
    add hl, de
    ld b, (hl)
    inc hl
    ld a, (hl)
    ld e, c
    ld d, 0
    ld hl, psg_ch_period_lo
    add hl, de
    ld (hl), b
    ld hl, psg_ch_period_hi
    add hl, de
    ld (hl), a
psg_orn_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_orn_update_loop
    ret

; ------------------------------------------------------------------
; psg_music_apply_cell
; Inputs: C = channel 0..2, B = note field, D = instrument field,
;         E = volume field.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_apply_cell:
    ; ---- instrument field first (note-on may use its volume/flags) ----
    ld a, d
    cp #FF
    jp z, psg_music_cell_volume
    or a
    jp z, psg_music_cell_volume
    push bc                 ; keep note (B) + channel (C)
    push de                 ; keep volume field (E)
    ld e, a
    ld hl, psg_ch_instrument
    call psg_ch_ptr
    ld (hl), e
    ld a, e
    add a, a
    ld e, a
    ld d, 0
    ld hl, (psg_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, psg_music_cell_inst_done   ; null instrument pointer
    ex de, hl               ; HL = instrument record
    push hl
    ld de, MUSIC_INSTRUMENT_PT3_MODE
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld (hl), e
    pop hl
    ld e, (hl)              ; +0 flags
    push hl
    ld hl, psg_ch_flags
    call psg_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +1 default volume
    ld e, (hl)
    push hl
    ld hl, psg_ch_volbase
    call psg_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +2 envelope ptr low
    ld e, (hl)
    inc hl                  ; +3 envelope ptr high
    ld d, (hl)
    inc hl                  ; +4 envelope length
    ld b, (hl)
    inc hl                  ; +5 envelope loop
    ld a, (hl)
    inc hl                  ; +6 noise period
    push hl
    push af                 ; save envelope loop
    push de
    ld hl, psg_ch_envlo
    call psg_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, psg_ch_envhi
    call psg_ch_ptr
    pop de
    ld (hl), d
    ld hl, psg_ch_envlen
    call psg_ch_ptr
    ld (hl), b
    pop af                  ; envelope loop
    ld e, a
    ld hl, psg_ch_envloop
    call psg_ch_ptr
    ld (hl), e
    pop hl                  ; instrument record +6
    ld e, (hl)              ; noise period
    inc hl                  ; -> +7 tone envelope ptr
    push hl
    ld hl, psg_ch_noiseper
    call psg_ch_ptr
    ld (hl), e
    pop hl
    ; ---- tone envelope fields (+7 ptr, +9 length, +10 loop) ----
    ld e, (hl)              ; +7 tone ptr low
    inc hl
    ld d, (hl)              ; +8 tone ptr high
    inc hl
    ld b, (hl)              ; +9 tone length
    inc hl
    ld a, (hl)              ; +10 tone loop
    inc hl                  ; -> +11 noise envelope ptr
    push hl                 ; keep record ptr for the noise fields
    push af
    push de
    ld hl, psg_ch_tonelo
    call psg_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, psg_ch_tonehi
    call psg_ch_ptr
    pop de
    ld (hl), d
    ld hl, psg_ch_tonelen
    call psg_ch_ptr
    ld (hl), b
    pop af
    ld e, a
    ld hl, psg_ch_toneloop
    call psg_ch_ptr
    ld (hl), e
    pop hl                  ; record ptr at +11
    ; ---- noise envelope fields (+11 ptr, +13 length, +14 loop) ----
    ld e, (hl)              ; +11 noise ptr low
    inc hl
    ld d, (hl)              ; +12 noise ptr high
    inc hl
    ld b, (hl)              ; +13 noise length
    inc hl
    ld a, (hl)              ; +14 noise loop
    push af
    push de
    ld hl, psg_ch_noiselo
    call psg_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, psg_ch_noisehi
    call psg_ch_ptr
    pop de
    ld (hl), d
    ld hl, psg_ch_noiselen
    call psg_ch_ptr
    ld (hl), b
    pop af
    ld e, a
    ld hl, psg_ch_noiseloop
    call psg_ch_ptr
    ld (hl), e
psg_music_cell_inst_done:
    pop de
    pop bc
psg_music_cell_volume:
    ; ---- volume field: overrides the channel volume base ----
    ld a, e
    cp #FF
    jp z, psg_music_cell_note
    and #0F
    ld e, a
    ld hl, psg_ch_volbase
    call psg_ch_ptr
    ld (hl), e
psg_music_cell_note:
    ; ---- note field ----
    ld a, b
    cp #FF
    ret z                   ; keep playing
    cp #FE
    jp z, psg_music_cell_note_cut
    ; note on: store note, restart envelope, cache the AY period, arm noise
    ld e, a
    ld hl, psg_ch_effective_note
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    jr z, psg_music_note_pt3_reset_done
    call psg_music_reset_pt3_channel
    call psg_music_arm_pt3_envelope
psg_music_note_pt3_reset_done:
    ld hl, psg_ch_envstep
    call psg_ch_ptr
    ld (hl), 0
    ld hl, psg_ch_tonestep
    call psg_ch_ptr
    ld (hl), 0              ; tone macro restarts on every note-on
    ld hl, psg_ch_noisestep
    call psg_ch_ptr
    ld (hl), 0              ; noise macro restarts on every note-on
    ld a, b                  ; B still holds the note; PT3 envelope arming may clobber DE
    ld l, a
    ld h, 0
    add hl, hl
    ld de, psg_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld hl, psg_ch_period_lo
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_period_hi
    call psg_ch_ptr
    ld (hl), d
    ld hl, psg_ch_pt3mode
    call psg_ch_ptr
    ld a, (hl)
    or a
    ret nz                  ; PT3 step owns gates, volume and global R6
    ; noise-capable instrument: latch R6 (single global noise register)
    ld hl, psg_ch_flags
    call psg_ch_ptr
    bit 1, (hl)
    ret z
    ld hl, psg_ch_noiseper
    call psg_ch_ptr
    ld a, (hl)
    ld (psg_music_noise_period), a
    ret
psg_music_cell_note_cut:
    ld hl, psg_ch_note
    call psg_ch_ptr
    ld (hl), #FF            ; envelope engine outputs volume 0 for silent notes
    ret

; Reset the per-channel PT3 state group on note-on (CHNPRM reset semantics).
; Input: C = channel 0..2
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
psg_music_reset_pt3_channel:
    ld hl, music_pt3_sample_pos_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_tone_acc_lo_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_tone_acc_hi_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_amp_slide_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_noise_acc_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_env_acc_lo_base
    call psg_ch_ptr
    ld (hl), 0
    ld hl, music_pt3_env_acc_hi_base
    call psg_ch_ptr
    ld (hl), 0
    ret

; Arm R13 only on PT3 note-on, and only when the descriptor explicitly has a
; hardware-envelope shape. music_pt3_finalize_frame performs the single write.
; Input: C = channel 0..2
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
psg_music_arm_pt3_envelope:
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    ret z
    ld a, (hl)              ; +0 flags, bit2 = hardware envelope configured
    and #04
    ret z
    ld de, 21
    add hl, de
    ld a, (hl)
    and #0F
    ld (music_pt3_r13_value), a
    ld a, 1
    ld (music_pt3_r13_pending), a
    ret


; ------------------------------------------------------------------
; psg_music_update_envelopes
; What:   Per-frame volume per channel into psg_ch_volout (no port
;         writes here; psg_music_apply_registers flushes everything).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_update_envelopes:
    ld c, 0
psg_music_env_ch_loop:
    ld hl, psg_ch_note
    ld e, c
    ld d, 0
    ld hl, psg_ch_pt3mode
    add hl, de
    ld a, (hl)
    or a
    jp nz, psg_music_env_next
    ld hl, psg_ch_note
    add hl, de
    ld a, (hl)
    cp #FF
    jp nz, psg_music_env_live
    xor a                   ; silent channel -> volume 0
    jp psg_music_env_store
psg_music_env_live:
    ld hl, psg_ch_envlen
    add hl, de
    ld a, (hl)
    or a
    jp z, psg_music_env_use_base
    ld b, a                 ; B = length
    ld hl, psg_ch_envstep
    add hl, de
    ld a, (hl)
    cp b
    jp c, psg_music_env_step_ok
    push hl
    ld hl, psg_ch_envloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, psg_music_env_step_ok
    ld a, b
    dec a                   ; hold last value
psg_music_env_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    push de
    ld hl, psg_ch_envlo
    add hl, de
    ld e, (hl)
    ld hl, psg_ch_envhi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    ; attenuate by volume base: vol = min(env, volbase)
    ld hl, psg_ch_volbase
    add hl, de
    cp (hl)
    jp c, psg_music_env_store
    ld a, (hl)
    jp psg_music_env_store
psg_music_env_use_base:
    ld hl, psg_ch_volbase
    add hl, de
    ld a, (hl)
psg_music_env_store:
    ld hl, psg_ch_volout
    add hl, de
    ld (hl), a
psg_music_env_next:
    inc c
    ld a, c
    cp 3
    jp c, psg_music_env_ch_loop
    ret

; ------------------------------------------------------------------
; Shared PT3 runtime adapters for the dual PSG state layout.
; ------------------------------------------------------------------
; Input: C = channel. Output: HL = active instrument descriptor or zero.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
music_get_channel_instrument_ptr:
    ld hl, psg_ch_instrument
    call psg_ch_ptr
    ld a, (hl)
    or a
    jr z, music_get_channel_instrument_none
    add a, a
    ld e, a
    ld d, 0
    ld hl, (psg_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ret
music_get_channel_instrument_none:
    ld hl, 0
    ret

; Input: HL=array base, C=channel. Output: A=value.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
music_load_channel_byte:
    call psg_ch_ptr
    ld a, (hl)
    ret

; Input: HL=array base, C=channel, A=value.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
music_store_channel_byte:
    push af
    call psg_ch_ptr
    pop af
    ld (hl), a
    ret

; Dual runtime currently stores no ornament macro in its row ABI. Keep the
; already-clamped base note in B; sample-step tone deltas remain exact.
; Input/output: B=note   Destroys: none
music_apply_channel_ornament_macro:
    ret

; Input: A=track-header offset. Output: HL=address.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
music_get_track_header_ptr:
    ld e, a
    ld d, 0
    ld hl, (psg_music_track_ptr)
    add hl, de
    ret
music_read_track_byte:
    call music_get_track_header_ptr
    ld a, (hl)
    ret

; PT3 channel-local AY adapters write the existing dual shadows. The common
; psg_music_apply_registers routine flushes them after the reducer finishes.
; Input: A=channel, HL=period.
psg_set_tone:
    ld c, a
    ld e, l
    ld d, h
    ld hl, psg_ch_period_lo
    call psg_ch_ptr
    ld (hl), e
    ld hl, psg_ch_period_hi
    call psg_ch_ptr
    ld (hl), d
    ret

; Input: A=channel, B=volume.
psg_set_volume:
    ld c, a
    ld e, b
    ld hl, psg_ch_volout
    call psg_ch_ptr
    ld (hl), e
    ret

; Input: A=noise period byte.
psg_set_noise:
    ld (psg_music_noise_period), a
    ret

; Input: A=PSG register, E=value.
psg_write:
    jp psg_reg_write

; ------------------------------------------------------------------
; music_channel_is_pt3_sample
; Check whether the current channel instrument uses the native PT3 step ABI.
; Input: C = channel index
; Output: A = 1 for pt3-sample, otherwise 0
; Destroys: AF, DE, HL
; Preserves: BC, IX, IY
; ------------------------------------------------------------------
music_channel_is_pt3_sample:
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    jr z, .not_pt3
    ld de, MUSIC_INSTRUMENT_PT3_MODE
    add hl, de
    ld a, (hl)
    cp 1
    jr nz, .not_pt3
    ld a, 1
    ret
.not_pt3:
    xor a
    ret

; ------------------------------------------------------------------
; music_pt3_begin_frame
; Clear per-frame reducer state. AddToNs deliberately remains persistent.
; Input: None
; Output: AddToEn=0, reducer mode defaults to corrected 16-bit
; Destroys: AF
; Preserves: BC, DE, HL, IX, IY
; ------------------------------------------------------------------
music_pt3_begin_frame:
    xor a
    ld (music_pt3_frame_active), a
    ld (music_pt3_used_noise), a
    ld (music_pt3_used_env), a
    ld (music_pt3_env_add_lo), a
    ld (music_pt3_env_add_hi), a
    ld a, 1
    ld (music_pt3_env_mode), a
    ret

; ------------------------------------------------------------------
; music_pt3_apply_mixer_bits
; Merge one PT3 step's tone/noise gates into the common mixer shadow.
; Input: C = channel index, D = tone enabled, E = noise enabled
; Output: music_mixer_shadow updated for that channel
; Destroys: AF, B
; Preserves: C, DE, HL, IX, IY
; ------------------------------------------------------------------
music_pt3_apply_mixer_bits:
    ld a, (music_mixer_shadow)
    ld b, a
    ld a, c
    cp 1
    jp z, .pt3_enable_b
    cp 2
    jp z, .pt3_enable_c
    ld a, b
    bit 0, d
    jr z, .pt3_a_tone_off
    and #3E
    jr .pt3_a_noise_gate
.pt3_a_tone_off:
    or #01
.pt3_a_noise_gate:
    bit 0, e
    jr z, .pt3_a_noise_off
    and #37
    jr .pt3_store_mixer
.pt3_a_noise_off:
    or #08
    jr .pt3_store_mixer
.pt3_enable_b:
    ld a, b
    bit 0, d
    jr z, .pt3_b_tone_off
    and #3D
    jr .pt3_b_noise_gate
.pt3_b_tone_off:
    or #02
.pt3_b_noise_gate:
    bit 0, e
    jr z, .pt3_b_noise_off
    and #2F
    jr .pt3_store_mixer
.pt3_b_noise_off:
    or #10
    jr .pt3_store_mixer
.pt3_enable_c:
    ld a, b
    bit 0, d
    jr z, .pt3_c_tone_off
    and #3B
    jr .pt3_c_noise_gate
.pt3_c_tone_off:
    or #04
.pt3_c_noise_gate:
    bit 0, e
    jr z, .pt3_c_noise_off
    and #1F
    jr .pt3_store_mixer
.pt3_c_noise_off:
    or #20
.pt3_store_mixer:
    ld (music_mixer_shadow), a
    ret

; ------------------------------------------------------------------
; music_update_one_pt3_channel
; Execute one normalized five-byte PT3 sample step and emit channel-local AY.
; Global R6/R11-R13 writes are deferred to music_pt3_finalize_frame.
; Input: C = channel index (0=A, 1=B, 2=C)
; Output: Tone/volume and mixer shadow updated; reducer state accumulated
; Destroys: AF, BC, DE, HL
; Preserves: IX, IY; stack balanced on every exit
; ------------------------------------------------------------------
music_update_one_pt3_channel:
    ld a, c
    ld (music_pt3_channel_work), a
    ld a, 1
    ld (music_pt3_frame_active), a
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    jp z, .pt3_silent
    ld a, l
    ld (music_pt3_instrument_ptr_l), a
    ld a, h
    ld (music_pt3_instrument_ptr_h), a
    ld de, MUSIC_INSTRUMENT_PT3_MODE
    add hl, de
    ld a, (hl)
    cp 1
    jp nz, .pt3_silent
    inc hl
    ld a, (hl)
    or a
    jp z, .pt3_silent
    ld (music_pt3_sample_len_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_sample_loop_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_sample_mode_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_ptr_l), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_ptr_h), a

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_ch_note_base
    call music_load_channel_byte
    cp #FF
    jp z, .pt3_silent
    ld b, a
    ld a, (music_pt3_sample_mode_work)
    or a
    jr nz, .pt3_mode_ready
    ld (music_pt3_env_mode), a
.pt3_mode_ready:
    call music_apply_channel_ornament_macro
    ld a, b
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_note_period_table
    add hl, de
    ld a, (hl)
    ld (music_pt3_period_lo_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_period_hi_work), a

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_sample_pos_base
    call music_load_channel_byte
    ld (music_pitch_step_work), a
    ld b, a
    ld a, (music_pt3_sample_len_work)
    cp b
    jr z, .pt3_clamp_position
    jr nc, .pt3_position_ready
.pt3_clamp_position:
    dec a
    ld (music_pitch_step_work), a
.pt3_position_ready:
    ld a, (music_pitch_step_work)
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, de
    ld a, (music_pt3_step_ptr_l)
    ld e, a
    ld a, (music_pt3_step_ptr_h)
    ld d, a
    add hl, de
    ld a, (hl)
    ld (music_pt3_step_packed), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_flags), a
    inc hl
    ld a, (hl)
    ld (music_pt3_tone_delta_lo_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_tone_delta_hi_work), a
    inc hl
    ld a, (hl)
    ld (music_pt3_step_global), a

    ld a, (music_pitch_step_work)
    inc a
    ld b, a
    ld a, (music_pt3_sample_len_work)
    cp b
    jr z, .pt3_position_loop
    jr c, .pt3_position_loop
    ld a, b
    jr .pt3_store_position
.pt3_position_loop:
    ld a, (music_pt3_sample_loop_work)
.pt3_store_position:
    push af
    ld a, (music_pt3_channel_work)
    ld c, a
    pop af
    ld hl, music_pt3_sample_pos_base
    call music_store_channel_byte

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_amp_slide_base
    call music_load_channel_byte
    ld e, a
    ld a, (music_pt3_step_packed)
    and #30
    cp #10
    jr z, .pt3_amp_decrement
    cp #20
    jr z, .pt3_amp_increment
    ld a, e
    jr .pt3_amp_ready
.pt3_amp_decrement:
    ld a, e
    cp #F1
    jr z, .pt3_amp_ready
    dec a
    jr .pt3_store_amp_slide
.pt3_amp_increment:
    ld a, e
    cp #0F
    jr z, .pt3_amp_ready
    inc a
.pt3_store_amp_slide:
    push af
    ld hl, music_pt3_amp_slide_base
    call music_store_channel_byte
    pop af
.pt3_amp_ready:
    ld e, a
    ld a, (music_pt3_step_packed)
    and #0F
    ld b, a
    ld a, e
    bit 7, a
    jr z, .pt3_amp_positive
    cpl
    inc a
    ld e, a
    ld a, b
    cp e
    jr c, .pt3_amp_zero
    sub e
    jr .pt3_sample_volume_ready
.pt3_amp_zero:
    xor a
    jr .pt3_sample_volume_ready
.pt3_amp_positive:
    add a, b
    cp 16
    jr c, .pt3_sample_volume_ready
    ld a, 15
.pt3_sample_volume_ready:
    ld (music_pt3_amplitude_work), a
    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_ch_volume_base
    call music_load_channel_byte
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, (music_pt3_amplitude_work)
    add a, e
    ld e, a
    ld d, 0
    ld hl, music_pt3_volume_table
    add hl, de
    ld a, (hl)
    ld (music_pt3_amplitude_work), a

    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_tone_acc_lo_base
    call music_load_channel_byte
    ld e, a
    ld hl, music_pt3_tone_acc_hi_base
    call music_load_channel_byte
    ld d, a
    ld l, e
    ld h, d
    ld a, (music_pt3_tone_delta_lo_work)
    ld e, a
    ld a, (music_pt3_tone_delta_hi_work)
    ld d, a
    add hl, de
    ld a, l
    ld (music_pt3_tone_delta_lo_work), a
    ld a, h
    ld (music_pt3_tone_delta_hi_work), a
    ld a, (music_pt3_step_flags)
    bit 0, a
    jr z, .pt3_tone_acc_ready
    ld a, (music_pt3_channel_work)
    ld c, a
    ld a, (music_pt3_tone_delta_lo_work)
    ld hl, music_pt3_tone_acc_lo_base
    call music_store_channel_byte
    ld a, (music_pt3_tone_delta_hi_work)
    ld hl, music_pt3_tone_acc_hi_base
    call music_store_channel_byte
.pt3_tone_acc_ready:
    ld a, (music_pt3_period_lo_work)
    ld l, a
    ld a, (music_pt3_period_hi_work)
    ld h, a
    ld a, (music_pt3_tone_delta_lo_work)
    ld e, a
    ld a, (music_pt3_tone_delta_hi_work)
    ld d, a
    add hl, de
    ld a, l
    ld (music_pt3_period_lo_work), a
    ld a, h
    ld (music_pt3_period_hi_work), a
    ld a, (music_pt3_period_lo_work)
    ld l, a
    ld a, (music_pt3_period_hi_work)
    ld h, a
    ld a, (music_pt3_channel_work)
    ld c, a
    ld a, (music_pt3_channel_work)
    call psg_set_tone

    ld a, (music_pt3_step_flags)
    bit 2, a
    jp z, .pt3_envelope_target
    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_noise_acc_base
    call music_load_channel_byte
    ld e, a
    ld a, (music_pt3_step_global)
    add a, e
    ld (music_pt3_step_global), a
    ld b, a
    ld a, (music_pt3_step_flags)
    bit 4, a
    jr z, .pt3_noise_output_ready
    ld a, b
    ld hl, music_pt3_noise_acc_base
    call music_store_channel_byte
.pt3_noise_output_ready:
    ld a, 1
    ld (music_pt3_used_noise), a
    ld a, b
    ld (music_pt3_noise_add), a
    jp .pt3_global_done

.pt3_envelope_target:
    ld a, 1
    ld (music_pt3_used_env), a
    ld a, (music_pt3_channel_work)
    ld c, a
    ld hl, music_pt3_env_acc_lo_base
    call music_load_channel_byte
    ld e, a
    ld hl, music_pt3_env_acc_hi_base
    call music_load_channel_byte
    ld d, a
    ld l, e
    ld h, d
    ld a, (music_pt3_step_global)
    ld e, a
    ld d, 0
    bit 7, e
    jr z, .pt3_env_offset_ready
    dec d
.pt3_env_offset_ready:
    add hl, de
    ld a, (music_pt3_sample_mode_work)
    or a
    jr nz, .pt3_env_width_ready
    ld a, l
    ld h, 0
    bit 7, a
    jr z, .pt3_env_width_ready
    dec h
.pt3_env_width_ready:
    ld a, l
    ld (music_pt3_tone_delta_lo_work), a
    ld a, h
    ld (music_pt3_tone_delta_hi_work), a
    ld a, (music_pt3_step_flags)
    bit 4, a
    jr z, .pt3_env_acc_ready
    ld a, (music_pt3_channel_work)
    ld c, a
    ld a, (music_pt3_tone_delta_lo_work)
    ld hl, music_pt3_env_acc_lo_base
    call music_store_channel_byte
    ld a, (music_pt3_tone_delta_hi_work)
    ld hl, music_pt3_env_acc_hi_base
    call music_store_channel_byte
.pt3_env_acc_ready:
    ld a, (music_pt3_tone_delta_lo_work)
    ld l, a
    ld a, (music_pt3_tone_delta_hi_work)
    ld h, a
    ld a, (music_pt3_env_add_lo)
    ld e, a
    ld a, (music_pt3_env_add_hi)
    ld d, a
    add hl, de
    ld a, l
    ld (music_pt3_env_add_lo), a
    ld a, h
    ld (music_pt3_env_add_hi), a

.pt3_global_done:
    ld a, (music_pt3_amplitude_work)
    ld b, a
    ld a, (music_pt3_channel_work)
    ld c, a
    ld a, (music_pt3_step_flags)
    bit 3, a
    jr z, .pt3_volume_ready
    ld a, b
    or #10
    ld b, a
.pt3_volume_ready:
    ld a, (music_pt3_channel_work)
    call psg_set_volume
    ld d, 0
    ld e, 0
    ld a, (music_pt3_step_flags)
    bit 1, a
    jr z, .pt3_tone_gate_ready
    inc d
.pt3_tone_gate_ready:
    bit 2, a
    jr z, .pt3_noise_gate_ready
    inc e
.pt3_noise_gate_ready:
    ld a, (music_pt3_channel_work)
    ld c, a
    call music_pt3_apply_mixer_bits
    ret

.pt3_silent:
    ld b, 0
    ld a, (music_pt3_channel_work)
    call psg_set_volume
    ld d, 0
    ld e, 0
    ld a, (music_pt3_channel_work)
    ld c, a
    call music_pt3_apply_mixer_bits
    ret

; ------------------------------------------------------------------
; music_pt3_finalize_frame
; Apply reducer-global PT3 noise/envelope registers after channels A->B->C.
; Input: Per-frame reducer state and persistent AddToNs in RAM
; Output: R6/R11/R12 written; R13 written only when retrigger is pending
; Destroys: AF, DE, HL
; Preserves: BC, IX, IY
; ------------------------------------------------------------------
music_pt3_finalize_frame:
    ld a, (music_pt3_frame_active)
    or a
    ret z
    ld a, (music_pt3_used_noise)
    or a
    jp z, .pt3_skip_noise_write
    ld a, MUSIC_TRACK_NOISE_DEFAULT
    call music_read_track_byte
    ld e, a
    ld a, (music_pt3_noise_add)
    add a, e
    call psg_set_noise

.pt3_skip_noise_write:
    ; R11/R12 are part of every active PT3 frame. music_pt3_used_env only
    ; tells us whether a sample contributed AddToEn; it must not suppress the
    ; base envelope period or a pending R13 retrigger on a noise-routed step.
    ld a, MUSIC_TRACK_ENV_BASE
    call music_get_track_header_ptr
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, (music_pt3_env_add_lo)
    ld l, a
    ld a, (music_pt3_env_add_hi)
    ld h, a
    ld a, (music_pt3_env_mode)
    or a
    jr nz, .pt3_env_sum_ready
    ld a, l
    ld h, 0
    bit 7, a
    jr z, .pt3_env_sum_ready
    dec h
.pt3_env_sum_ready:
    add hl, de
    ld a, PSG_ENV_LO
    ld e, l
    call psg_write
    ld a, PSG_ENV_HI
    ld e, h
    call psg_write
    ld a, (music_pt3_r13_pending)
    or a
    ret z
    ld a, (music_pt3_r13_value)
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call psg_write
    xor a
    ld (music_pt3_r13_pending), a
.pt3_skip_env_write:
    xor a
    ld (music_pt3_r13_pending), a
    ret

; ------------------------------------------------------------------
; psg_music_apply_registers
; What:   Re-assert R0..R10 from cached state (write-through: heals any
;         register a fire-and-forget SFX blip may have stomped).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
psg_music_apply_registers:
    ld c, 0
psg_music_apply_ch_loop:
    ; Channel C belongs to gameplay SFX when the song leaves it free: skip
    ; its period + volume writes entirely so fire-and-forget SFX survive.
    ld a, c
    cp 2
    jp nz, psg_music_apply_ch_drive
    ld a, (psg_music_use_ch_c)
    or a
    jp z, psg_music_apply_ch_skip
psg_music_apply_ch_drive:
    ld e, c
    ld d, 0
    ld hl, psg_ch_period_lo
    add hl, de
    ld b, (hl)              ; B = period low
    ld hl, psg_ch_period_hi
    add hl, de
    ld d, (hl)              ; D = period high (E still = channel)
    ld a, c
    add a, a                ; register 2*c
    push de
    ld e, b
    call psg_reg_write      ; R(2c) = period low
    pop de
    ld a, c
    add a, a
    inc a
    ld e, d
    call psg_reg_write      ; R(2c+1) = period high
    ld e, c
    ld d, 0
    ld hl, psg_ch_volout
    add hl, de
    ld e, (hl)
    ld a, 8
    add a, c
    call psg_reg_write      ; R(8+c) = volume (0 when silent)
psg_music_apply_ch_skip:
    inc c
    ld a, c
    cp 3
    jp c, psg_music_apply_ch_loop
    ; R6 noise period
    ld a, (psg_music_noise_period)
    and #1F
    ld e, a
    ld a, 6
    call psg_reg_write
    ; R7 mixer from live notes + per-channel flags. #BF base keeps the MSX
    ; AY I/O port directions (bit7=1, bit6=0); tone bits 0-2, noise bits 3-5.
    ld d, #BF
    ld a, (psg_ch_note)
    cp #FF
    jp z, psg_music_mixer_chB
    ld a, (psg_ch_flags)
    bit 0, a
    jp z, psg_music_mixer_chA_noise
    res 0, d
psg_music_mixer_chA_noise:
    bit 1, a
    jp z, psg_music_mixer_chB
    res 3, d
psg_music_mixer_chB:
    ld a, (psg_ch_note + 1)
    cp #FF
    jp z, psg_music_mixer_chC
    ld a, (psg_ch_flags + 1)
    bit 0, a
    jp z, psg_music_mixer_chB_noise
    res 1, d
psg_music_mixer_chB_noise:
    bit 1, a
    jp z, psg_music_mixer_chC
    res 4, d
psg_music_mixer_chC:
    ; Song leaves C to gameplay SFX: take C's mixer bits (2 tone, 5 noise)
    ; from the SFX shadow so the per-frame R7 heal cannot cut a live blip.
    ld a, (psg_music_use_ch_c)
    or a
    jp nz, psg_music_mixer_chC_song
    ld a, d
    and #DB                 ; clear bits 2+5
    ld d, a
    ld a, (psg_sfx_r7_c_bits)
    and #24                 ; keep only C's tone/noise bits
    or d
    ld d, a
    jp psg_music_mixer_write
psg_music_mixer_chC_song:
    ld a, (psg_ch_note + 2)
    cp #FF
    jp z, psg_music_mixer_write
    ld a, (psg_ch_flags + 2)
    bit 0, a
    jp z, psg_music_mixer_chC_noise
    res 2, d
psg_music_mixer_chC_noise:
    bit 1, a
    jp z, psg_music_mixer_write
    res 5, d
psg_music_mixer_write:
    ; Replace the static legacy flags with each PT3 step's live gates.
    ld a, (psg_ch_pt3mode)
    or a
    jr z, psg_music_mixer_pt3_b
    ld a, d
    and #F6                 ; clear A tone/noise bits 0+3
    ld d, a
    ld a, (music_mixer_shadow)
    and #09
    or d
    ld d, a
psg_music_mixer_pt3_b:
    ld a, (psg_ch_pt3mode + 1)
    or a
    jr z, psg_music_mixer_pt3_c
    ld a, d
    and #ED                 ; clear B tone/noise bits 1+4
    ld d, a
    ld a, (music_mixer_shadow)
    and #12
    or d
    ld d, a
psg_music_mixer_pt3_c:
    ld a, (psg_ch_pt3mode + 2)
    or a
    jr z, psg_music_mixer_pt3_done
    ld a, d
    and #DB                 ; clear C tone/noise bits 2+5
    ld d, a
    ld a, (music_mixer_shadow)
    and #24
    or d
    ld d, a
psg_music_mixer_pt3_done:
    ld e, d
    ld a, 7
    jp psg_reg_write

; ==================================================================
; MIDEAS PUBLIC MUSIC API -> SCC + PSG DUAL BACKEND
; Game Flow, State Machines and world transitions keep using music_*.
; ==================================================================
; @mideas:block id=runtime.sound.music_scc_public kind=routine owner=sound roots=music_init_system,music_play_track,music_execute_command,music_update,music_stop,music_mute,music_resume

; Inputs: none. Destroys: AF, B, HL. Preserves: C, DE, IX, IY.
music_init_system:
    call scc_music_init_system
    call psg_music_init_system
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ld (music_track_index), a
    ld a, BITMAP_MUSIC_DATA_BANK_0
    ld (music_data_bank_cur), a  ; sane bank for music_update before any play
    ret

; Inputs: A = track index, B bit 0 = loop. Destroys: AF, BC, DE, HL.
music_play_track:
    push af                 ; A = track index (the bank lookup clobbers A)
    ld e, a
    ld d, 0
    ld hl, music_track_bank_table
    add hl, de
    ld a, (hl)
    ld (music_data_bank_cur), a
    ld (#B000), a           ; map this track's music data bank into P3 (#A000)
    pop af
    call music_play_track_impl
    ld a, 3
    ld (#B000), a           ; restore the resident boot-image bank in P3
    ret
music_play_track_impl:
    ld (music_track_index), a
    push af
    ld a, b
    and 1
    ld (music_loop), a
    pop af
    push af
    push bc
    call scc_music_play_track
    pop bc
    pop af
    ; PSG half: resolve the dual pointer for this combined index
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_psg_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, music_play_track_no_psg
    ex de, hl
    call psg_music_play_ptr    ; HL = psg data, B bit0 = loop
    jp music_play_track_done
music_play_track_no_psg:
    call psg_music_stop
music_play_track_done:
    ld a, (scc_music_active)
    ld hl, psg_music_active
    or (hl)
    ld (music_active), a
    xor a
    ld (music_muted), a
    ret

; Inputs: none. Destroys: AF, BC, HL. Preserves: DE, IX, IY.
music_stop:
    call scc_music_stop
    call psg_music_stop
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ret

music_mute:
    call scc_music_mute
    call psg_music_mute
    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

music_resume:
    call scc_music_resume
    call psg_music_resume
    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

; Inputs: none. Destroys: AF, BC, DE, HL. Call once per frame outside H.TIMI.
music_update:
    ld a, (music_data_bank_cur)
    ld (#B000), a           ; map the current track's music bank into P3 (#A000)
    call music_update_impl
    ld a, 3
    ld (#B000), a           ; restore the resident boot-image bank in P3
    ret
music_update_impl:
    call scc_music_update
    call psg_music_update
    ld a, (scc_music_active)
    ld hl, psg_music_active
    or (hl)
    ld (music_active), a
    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

; Input: DE -> [command, trackIndex, loopFlag].
; Commands: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op.
; Destroys: AF, BC (play path), DE (play path), HL.
music_execute_command:
    ld a, (de)
    cp #FF
    ret z
    or a
    jp z, music_stop
    cp 1
    jp z, music_execute_scc_play
    cp 2
    jp z, music_mute
    cp 3
    jp z, music_resume
    ret
music_execute_scc_play:
    inc de
    ld a, (de)
    ld c, a
    inc de
    ld a, (de)
    ld b, a
    ld a, c
    jp music_play_track

music_track_count:
    DB #01
; MegaROM bank holding each combined track's serialized data (music banks
; share a header, so any bank satisfies the driver's fixed-table labels).
music_track_bank_table:
    DB BITMAP_MUSIC_DATA_BANK_0
; @mideas:endblock id=runtime.sound.music_scc_public

; PSG half pointer per combined track index (0 = SCC-only track)
music_psg_ptr_table:
    DW psg_track_0_c_major_chiptune_loop_data

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
;   Hides hardware sprites (R#8 bit1 = SPD) and LEAVES THEM HIDDEN: the sprite
;   tables and the player spawn are both set up after this routine returns, so
;   the boot-init tail is what re-enables them. In MegaROM mode the scene
;   uploads select P2 data banks and restore the resident banks.
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
    call bitmap_intro_wipe_diagonal
    ld b, 30
    call bitmap_intro_wait_frames
    ; Sprites stay HIDDEN here on purpose. init_hardware_sprite_tables (SAT,
    ; colour and pattern tables) and the player spawn both run AFTER this
    ; routine, so re-enabling R#8 at this point left a sprite built from
    ; uninitialised tables on screen for the whole boot: with a mirrored player
    ; the garbage player_facing also indexed the mirror half of the pattern
    ; bank, so it showed up as a corrupted player sprite. The boot-init tail
    ; re-enables sprites once the tables are uploaded and the player is placed.
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

bitmap_intro_wipe_diagonal:
    ; Clear 8x8 blocks along anti-diagonals (32 cols x 27 rows, last row 4px),
    ; one diagonal per frame. Scratch: player_y = diagonal index, player_x = row
    ; block (both re-initialized by the boot sequence right after the intro).
    xor a
    ld (player_y), a
.dg_diag:
    xor a
    ld (player_x), a
.dg_row:
    ld a, (player_x)
    ld c, a                   ; C = row block 0..26
    ld a, (player_y)
    sub c                     ; A = column block = diagonal - row block
    jp c, .dg_next_row
    cp 32
    jp nc, .dg_next_row
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl                ; HL = DX = column block * 8
    ld a, c
    add a, a
    add a, a
    add a, a                  ; A = DY = row block * 8 (0..208)
    ld e, a
    ld d, 0
    cp 208
    ld a, 8
    jp c, .dg_fill
    ld a, 4                   ; last row block: 212 - 208 = 4 lines
.dg_fill:
    ld bc, 8
    call bitmap_intro_fill_rect
.dg_next_row:
    ld a, (player_x)
    inc a
    ld (player_x), a
    cp 27
    jp c, .dg_row
    call bitmap_intro_frame_wait
    ld a, (player_y)
    inc a
    ld (player_y), a
    cp 58
    jp c, .dg_diag
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
    ld a, 1
    ld de, #0000
    ld bc, bitmap_intro_scene0_rle_chunk_1_end - bitmap_intro_scene0_rle_chunk_1
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
    ld e, #01
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
;   With SCC music, S#0 is polled between blocks and music_update is ticked
;   once per elapsed vblank (the block budget can overrun a frame), keeping
;   the song tempo linear during transitions.
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
    ; --- SCC music keep-alive: a full block budget can overrun the 60Hz frame
    ; (LMMM with the display active), which audibly dragged the song tempo
    ; during room transitions. Poll S#0 between blocks and tick the driver once
    ; per elapsed vblank so playback stays linear; frames with no boundary in
    ; here are covered by the main loop's unconditional music_update call.
    push hl
    push bc
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a       ; R#15 = 0 -> status port reads S#0
    in a, (#99)        ; frame flag (bit 7); reading clears it
    bit 7, a
    call nz, music_update           ; destroys AF/BC/DE/HL
    ; music_update restores P2 to the resident bank (mapper_bank_p2_current);
    ; re-map the composition data bank before reading the next block.
    ld a, (bitmap_composition_block_bank)
    call bitmap_room_select_data_bank_a
    pop bc
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
; FUNCTION: commit_room_tick_music
; ------------------------------------------------------------
; PURPOSE:
;   Music keep-alive for commit_room_flip, the heaviest single-frame block of a
;   transition (two 768-byte LDIRs, the room-entry paint and every per-room
;   loader). step_room_composition ticked the driver between VDP blocks but the
;   commit had no tick at all, so the song stopped dead on every screen change.
;   Ticks once per elapsed vblank, exactly like the composition keep-alive.
;
; DESTROYS:
;   AF, BC, DE, HL (music_update). Call only where those are dead.
;
; NOTES:
;   music_update restores P2 to mapper_bank_p2_current (the resident bank), so
;   callers that need resident tables afterwards need no re-map of their own.
; ------------------------------------------------------------
commit_room_tick_music:
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a       ; R#15 = 0 -> status port reads S#0
    in a, (#99)        ; frame flag (bit 7); reading clears it
    bit 7, a
    jp nz, music_update
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
    call commit_room_tick_music     ; keep the song running across the commit

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
.commit_enter_top:
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld (bitmap_game_over_flag), a
    ld a, 2
    ld (player_y), a
    call bitmap_settle_top_entry   ; a tall body at y=2 can land inside a ledge
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
.commit_flip_page:
    call bitmap_apply_gems_pending_page    ; draw uncollected gems on hidden page before flip
    call bitmap_apply_heals_pending_page    ; draw untaken health pickups on hidden page before flip
    call bitmap_crumble_reset_pending   ; crumbling floors come back whole
    call bitmap_light_paint_pending    ; dim the hidden page and cut the halo before the flip

    ld a, (bitmap_pending_display_page)
    ld (bitmap_displayed_page), a
    or a
    jp z, .flip_to_page0
    ld e, #3F
    jp .write_display_page
.flip_to_page0:
    ld e, #1F
.write_display_page:
    ; Repair the player hardware tables before publishing the composed page, so
    ; the first visible frame of the new room cannot use a partial pattern.
    push de                    ; bitmap_restore_player_sprite_patterns clobbers DE
    call bitmap_restore_player_sprite_patterns
    pop de                     ; restore the pending R#2 page value (#1F/#3F)
    ld a, #FF
    ld (player_colors_loaded), a

    ld a, #02
    call vdp_write_register
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (bitmap_composition_state), a
    ld (bitmap_composition_blocks_left), a
    ld (bitmap_composition_blocks_left + 1), a
    call commit_room_tick_music     ; keep the song running across the commit
    call bitmap_load_enemies
    call bitmap_load_platforms
    ; Hand the main loop a resident P2. The room-load path above streams banked
    ; resources and every loader here is free to map its own bank (bitmap_boss_load
    ; even opens by restoring, precisely because the previous step leaves P2 on the
    ; last resource it read). Without this the FIRST frame back in the loop still
    ; had a data bank mapped, and the player-sprite readers live inside that very
    ; window: bitmap_player_anim_clip_table and bitmap_room_sprite_colors sit at
    ; #80xx-#83xx. bitmap_upload_player_frame_colors only re-reads them when the
    ; frame/state key changes, so a plain room change looked fine and a room change
    ; followed immediately by a hit (spike -> i-frames + hurt state) uploaded
    ; garbage clip data and garbage colour bytes: a corrupted player sprite.
    call bitmap_room_restore_resident_banks
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_restore_player_sprite_patterns
; ------------------------------------------------------------
; PURPOSE:
;   Restore the player's SCREEN 5 mode-2 pattern table after a room transition.
;   Room composition is meant to target only the hidden bitmap page, but this
;   final guard makes the sprite independent from any malformed/legacy command
;   that could have wrapped into the physical #F800 table.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   bitmap_room_select_data_bank_a (MegaROM only), copy_to_vram_ext,
;   bitmap_room_restore_resident_banks (MegaROM only).
; ------------------------------------------------------------
bitmap_restore_player_sprite_patterns:
    ld a, bitmap_room_sprite_patterns_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_sprite_patterns
    ld de, #F800
    ld bc, bitmap_room_sprite_patterns_end - bitmap_room_sprite_patterns
    call copy_to_vram_ext
    jp bitmap_room_restore_resident_banks

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
    ; The pattern bank is not resident: map it into P2 for the copy and put the
    ; resident bank back before returning. This routine itself lives below #8000.
    ld a, bitmap_room_sprite_patterns_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_sprite_patterns
    ld de, #F800
    ld bc, bitmap_room_sprite_patterns_end - bitmap_room_sprite_patterns
    call copy_to_vram_ext
    jp bitmap_room_restore_resident_banks

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
    ; per-frame coyote / jump_buffer timer decrements
    ld a, (player_coyote_timer)
    or a
    jr z, .cb_skip_coyote_dec
    dec a
    ld (player_coyote_timer), a
.cb_skip_coyote_dec:
    ld a, (player_jump_buffer_t)
    or a
    jr z, .cb_skip_buffer_dec
    dec a
    ld (player_jump_buffer_t), a
.cb_skip_buffer_dec:
    bit 0, c     ; jump key SPC
    jp nz, .jump_pressed
    jp .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .cb_airborne             ; airborne -> coyote / jump_buffer gate
    jp .jump_from_ground
.cb_airborne:
    ; COYOTE: if the timer is still active, consume it and jump as if grounded.
    ld a, (player_coyote_timer)
    or a
    jp z, .cb_coyote_expired
    xor a
    ld (player_coyote_timer), a
    jp .jump_from_ground
.cb_coyote_expired:
    ; coyote expired: record airborne jump press as buffer for next landing.
    ld a, #03
    ld (player_jump_buffer_t), a
    jp .apply_gravity
.jump_from_ground:
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
    ; Leave-ground hooks run ONLY on the ground -> air transition. This block is
    ; reached on EVERY falling frame (also mid-jump, once the arc turns), so
    ; running them unconditionally re-armed the coyote timer the very frame it
    ; expired: the window never closed and every fall granted a free extra jump.
    ld a, (player_flags)
    and #01                     ; grounded until this frame?
    jp z, .leave_ground_done    ; already airborne: nothing to leave
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ; --- COYOTE: arm timer on leave-ground (once) ---
    ld a, (player_coyote_timer)
    or a
    jr nz, .cb_leave_skip_arm
    ld a, #06
    ld (player_coyote_timer), a
.cb_leave_skip_arm:
.leave_ground_done:
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
    ; --- COYOTE / JUMP BUFFER land hook ---
    ld a, (player_jump_buffer_t)
    or a
    jp z, .cb_land_no_buffer
    xor a
    ld (player_jump_buffer_t), a
    ld a, #F8              ; fire buffered jump as the first jump
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_flags)
    and #FE                      ; clear grounded: we are jumping again
    ld (player_flags), a
    ld a, 1
    ld (player_jump_lock), a
.cb_land_no_buffer:
    xor a
    ld (player_coyote_timer), a   ; landing clears any stale coyote timer

.movement_done:
    ; North/South edge: walk (or fall) into a vertical neighbour room if one exists.
    ld a, (player_y)
    cp 192
    jp c, .check_south_edge ; still inside the room: only the south rail can fire
    ; Leaving through the ceiling means the Y actually went NEGATIVE, i.e. an up
    ; move wrapped player_y into #FF..#C0 (bitmap_try_move_y allows that on
    ; purpose). Being merely at the top of the band is not an exit: a body
    ; 29px tall standing on a ledge whose top is at y=32 sits at exactly
    ; y=0, so the old "player_y < 2 -> go north" rule fired on a player that was
    ; just standing there, and again the moment it stepped off the ledge and
    ; started to fall. Either way it was yanked back into the room above.
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
;   frame or glowing-tail state changed. Each frame has its own colour table because
;   CC/OR multi-colour rows differ between frames; the SAT only swaps the pattern
;   index, so without this, frames > 0 render with frame 0's colours.
;
; INPUT:
;   player_anim_frame    = current logical frame (0..1).
;   player_colors_loaded = frame whose colours are currently in VRAM, with bit 7
;                          set while the glowing palette is loaded.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, C (always); B, DE, HL only when a frame/state change triggers upload.
;
; PRESERVES:
;   IX, IY always; B, DE, HL when unchanged. The common case costs only the
;   state-key comparison, not a VRAM copy.
;
; CALLS:
;   fast_copy_to_vram_ext (only on a frame change).
;
; SIDE EFFECTS:
;   On a frame change: writes 64 bytes (4 layer(s) x 16 lines)
;   to VRAM #F400 and updates player_colors_loaded.
;
; NOTES:
;   Source = bitmap_room_sprite_colors[_glowing] + player_anim_frame * 64.
;   Mirror frames reuse the same colours (a horizontal flip keeps line colours),
;   so the logical frame indexes the table directly. The glowing table
;   maps dim palette slots 8..15 to their intense 0..7 twins while preserving
;   sprite mode flags in the high nibble. Self-correcting: any stale player_colors_loaded
;   just forces one upload on the first differing frame/state.
; ------------------------------------------------------------
bitmap_upload_player_frame_colors:
    ld a, (player_anim_abs_frame)
    ld c, a
    ld a, (bitmap_light_on)
    or a
    jp z, .colors_key_ready
    set 7, c                  ; loaded-key bit 7 = intense glowing palette
.colors_key_ready:
    ld a, (player_colors_loaded)
    cp c
    ret z
    ld a, c
    ld (player_colors_loaded), a
    bit 7, a
    jp z, .colors_normal_source
    res 7, a                  ; A = absolute animation frame
    ld hl, bitmap_room_sprite_colors_glowing
    jp .colors_source_ready
.colors_normal_source:
    ld hl, bitmap_room_sprite_colors
.colors_source_ready:

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
    ; w=9, h=29. Probes Y rows 3/11/19/27/31
    ; (every <=16px so a tall body cannot tunnel a cell). Large ice-slide dx is
    ; clamped at the room edges before probing so unsigned player_x never wraps
    ; from x=2 to x=250 (or past the east edge) during room transitions.
    ; A probe row outside the 0..191 band is SKIPPED: there is no cell there, so
    ; it must not veto a horizontal move. Rows that wrap back into the band still
    ; block normally. This is symmetric for both edges. Previously only the top
    ; case was skipped (and only while player_y itself was wrapped to #FF..#C0);
    ; a row past the BOTTOM edge fell through to bitmap_probe_solid, which reports
    ; "outside visible Y range is solid", so a body straddling the bottom edge
    ; froze horizontally while still inside the room. The dead band was
    ; hitboxHeight-1 px tall: 15px for a 16px body, 31px for a 32px one, right
    ; where a tall player stands on the last floor row. Keeping the player inside
    ; the room is bitmap_try_move_y's job, not this routine's.
    ; Clobbers AF/BC/DE/HL.
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
    jp nc, .x_probe_0_skip   ; row outside the room: never a horizontal blocker
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_0_skip:
    ld a, (player_y)
    add a, 11
    ld c, a                 ; C = probe Y (+11)
    cp 192
    jp nc, .x_probe_1_skip   ; row outside the room: never a horizontal blocker
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_1_skip:
    ld a, (player_y)
    add a, 19
    ld c, a                 ; C = probe Y (+19)
    cp 192
    jp nc, .x_probe_2_skip   ; row outside the room: never a horizontal blocker
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_2_skip:
    ld a, (player_y)
    add a, 27
    ld c, a                 ; C = probe Y (+27)
    cp 192
    jp nc, .x_probe_3_skip   ; row outside the room: never a horizontal blocker
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_3_skip:
    ld a, (player_y)
    add a, 31
    ld c, a                 ; C = probe Y (+31)
    cp 192
    jp nc, .x_probe_4_skip   ; row outside the room: never a horizontal blocker
    call bitmap_probe_solid
    jp nz, .x_blocked
.x_probe_4_skip:
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

bitmap_settle_top_entry:
    ; Called from commit_room_flip right after a north->south crossing placed the
    ; player at the fixed top-edge entry Y (2). That constant only fits a body
    ; that lives inside the first collision row: this player's body is
    ; 29px tall, so its bottom edge lands at 2+31=33, i.e. INSIDE cell
    ; row 2 whenever the destination room has a ledge tucked under the ceiling.
    ; The player then spawns EMBEDDED in that floor and bitmap_try_move_x probes
    ; the very cell it is stuck in on both sides, so every horizontal move is
    ; vetoed: it can still jump and shoot, but never walk. Lift the body out of
    ; the solid one pixel at a time; y=0 is both the ceiling and the hard floor of
    ; this loop, so it runs at most twice. Lifting means we are resting ON that
    ; cell, so grounded is asserted here too: player_vy is 0 on the entry frame
    ; and update_player_movement skips the vertical step that would otherwise set
    ; it, which would leave the player one frame "in the air" on top of a ledge.
    ; Reads the collision map, already refreshed for the room being published.
    ; Clobbers AF/BC/DE/HL. Preserves IX/IY.
.settle_loop:
    ld a, (player_y)
    or a
    ret z                   ; flush against the ceiling: nothing left to give
    add a, 31
    ld c, a                 ; C = probe Y (body bottom edge)
    ld a, (player_x)
    add a, 3
    ld b, a                 ; B = probe X (+3)
    call bitmap_probe_solid
    jp nz, .settle_lift
    ld a, (player_x)
    add a, 11
    ld b, a                 ; B = probe X (+11)
    call bitmap_probe_solid
    jp nz, .settle_lift
    ret                     ; body bottom is clear: plain fall from here
.settle_lift:
    ld a, (player_y)
    dec a
    ld (player_y), a
    ld a, (player_flags)
    or #01                  ; standing on the cell we just climbed out of
    ld (player_flags), a
    jp .settle_loop

bitmap_probe_solid:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when passable (cell empty OR deadly-only). Index = (Y & #F0) + (X >> 4)
    ; into the 16x12 grid. Because a cell is 16 px, (Y >> 4) * 16 == (Y & #F0).
    ; The Deadly bit (0x40) is masked out so a deadly-only tile (e.g. floor
    ; spikes) does NOT block movement; Solid+Deadly (0x50) still blocks because
    ; the Solid bit (0x10) survives the mask.
    ; HAS_SHAPE (0x01) is masked out too: it only says "this cell carries an 8x8
    ; quadrant mask", never that the cell is solid. Leaving it in made a
    ; Deadly-only cell with an authored shape (0x41) read as solid, i.e. an
    ; invisible ledge in front of ceiling spikes. Clobbers AF/DE/HL; keeps BC.
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
    and #BE                 ; mask out Deadly (#40) + HAS_SHAPE (#01); Z when nothing solid is left
    jp z, .probe_cell_passable
    bit 0, e                ; HAS_SHAPE: cell carries an 8x8 quadrant mask?
    jp z, .probe_return_map_solid
    push de                 ; keep E = cell value (the helper clobbers DE)
    call bitmap_cell_shape_hit  ; HL still points at the collision cell; keeps BC
    pop de
    jp nz, .probe_return_map_solid
.probe_cell_passable:
    ld a, e                 ; restore A = original cell value
    cp e                    ; keep Z set: empty/deadly-only map cells are passable
    ret
.probe_return_map_solid:
    ld a, e                 ; restore A = original solid cell value
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_cell_shape_hit
; ------------------------------------------------------------
; PURPOSE:
;   8x8 sub-cell solidity test. A 16x16 collision cell flagged HAS_SHAPE (0x01)
;   carries a 4-quadrant mask in the HIGH nibble of its behavior byte:
;   #10 = top-left, #20 = top-right, #40 = bottom-left, #80 = bottom-right.
;   This lets one 16x16 tile be solid only where it is actually drawn (e.g. a
;   tile painted only on its lower half is a ledge with an empty upper half).
;
; INPUT:
;   HL = address of the cell inside bitmap_room_collision_map.
;   B = pixel X, C = pixel Y (the probed point).
;
; OUTPUT:
;   NZ when the 8x8 quadrant under (B,C) is solid, Z when it is a hole.
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
; NOTES:
;   A cleared nibble means "whole cell solid" and returns NZ, so a stale
;   HAS_SHAPE bit can never open a hole in a wall.
; ------------------------------------------------------------
bitmap_cell_shape_hit:
    ld de, bitmap_room_behavior_map - bitmap_room_collision_map
    add hl, de              ; same index, shape plane
    ld a, (hl)
    and #F0
    jp z, .shape_full       ; no mask -> the whole 16x16 cell is solid
    ld d, a                 ; D = quadrant mask
    ld a, c
    and #08
    rrca
    rrca                    ; A = 2 when the lower half of the cell
    ld l, a
    ld a, b
    and #08
    rrca
    rrca
    rrca                    ; A = 1 when the right half of the cell
    or l                    ; A = quadrant index 0..3
    ld hl, bitmap_quadrant_mask_table
    add a, l
    ld l, a
    jp nc, .shape_masked
    inc h                   ; table may straddle a 256-byte page
.shape_masked:
    ld a, (hl)              ; A = #10 / #20 / #40 / #80
    and d                   ; NZ = that quadrant is solid
    ret
.shape_full:
    or 1                    ; NZ
    ret

bitmap_quadrant_mask_table:
    db #10, #20, #40, #80   ; top-left, top-right, bottom-left, bottom-right

bitmap_probe_deadly:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when the cell does NOT have the Deadly bit (0x40), NZ when it does.
    ; Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
    ; Deadly cells honour the same 8x8 quadrant mask as bitmap_probe_solid, so
    ; spikes drawn on half a cell only hurt where they are drawn.
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
    ret z                   ; not deadly
    bit 0, a                ; HAS_SHAPE: deadly only over part of the cell?
    jp nz, .deadly_shaped
    or a                    ; deadly everywhere (cell value is nonzero -> NZ)
    ret
.deadly_shaped:
    push af                 ; keep A = cell value across the quadrant test
    push de
    call bitmap_cell_shape_hit
    pop de
    jp z, .deadly_shape_hole
    pop af
    or a                    ; NZ = deadly
    ret
.deadly_shape_hole:
    pop af
    cp a                    ; Z = the probed quadrant is empty, not deadly
    ret

bitmap_probe_behavior:
    ; B = pixel X, C = pixel Y. Returns A = behavior cell value with Z set
    ; when empty. behavior=3 is the ice surface; behavior=4 is exit_enemy.
    ; Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
    ; The high nibble of the byte holds the 8x8 sub-cell solidity mask, so it is
    ; stripped here: callers only ever see the behavior code.
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
    and #0F                 ; strip the 8x8 shape nibble; Z when no behavior
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
; FUNCTION: bitmap_shoot_init_clear
; PURPOSE: Clear the reusable bullet pool and release any borrowed player group.
; INPUT: None. OUTPUT: None.
; DESTROYS: AF, B, HL. PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_shoot_init_clear:
    ld hl, bitmap_bullet_pool
    ld b, #07
    xor a
.shoot_init_clear_loop:
    ld (hl), a
    inc hl
    djnz .shoot_init_clear_loop
    dec a
    ld (bitmap_bullet_borrow_group), a ; #FF = no borrowed player group yet
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the configured shoot input (N) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 4 on PPI_C. update_player_movement
;   re-selects row 8 next frame, so the transient selection is safe.
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
; FUNCTION: bitmap_shoot_up_held
; ------------------------------------------------------------
; PURPOSE: Reads the UP cursor key (matrix row 8, mask #20) to aim the shot
;   upwards. Only the HELD state matters: the shot itself is triggered by the
;   fire edge, so the UP press is still free for doors and shops.
; INPUT: none. OUTPUT: A = 1 when held, A = 0 otherwise (Z when released).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: selects keyboard row 8 on PPI_C, which is where
;   update_player_movement leaves it anyway.
; ------------------------------------------------------------
bitmap_shoot_up_held:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #20
    ret z
    ld a, 1
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
    ld a, (bitmap_nut_count)
    or a
    jp z, .spawn_done         ; out of ammo: no shot
    ld ix, bitmap_bullet_pool
    ld b, #01
.find_free:
    ld a, (ix+0)
    or a
    jp z, .found
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .find_free
    jp .spawn_done
.found:
    ld (ix+0), 1
    ; UP held? Shoot upwards. The shot is triggered by the FIRE edge, never by
    ; the UP edge, so bitmap_key_up_lock (doors, shops) is left untouched.
    call bitmap_shoot_up_held
    or a
    jp z, .spawn_forward
    ld (ix+3), 2
    ld a, (player_x)
    add a, 6
    ld (ix+1), a
    ld a, (player_y)
    sub 2
    jp nc, .spawn_up_y_ok
    xor a                     ; clamp at the top row
.spawn_up_y_ok:
    ld (ix+2), a
    jp .spawn_life
.spawn_forward:
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
.spawn_life:
    ; The step routine spends one life BEFORE moving, so the slot needs one extra
    ; unit for the bullet to actually travel its full 96 px.
    ld (ix+4), #19     ; 24 moves = 96 px of range
    ld a, (bitmap_nut_count)
    dec a
    ld (bitmap_nut_count), a
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
    ld b, #01
.step_loop:
    ld a, (ix+0)
    or a
    jp z, .step_next
    ; Old age first: a spent bullet must not get one more free step.
    ld a, (ix+4)
    dec a
    ld (ix+4), a
    jp z, .deactivate
    ld a, (ix+3)
    cp 2
    jp z, .step_up
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
    jp .step_wall
.step_up:
    ; Upwards: Y grows downwards, so borrowing past 0 means the bullet left the
    ; top of the play area. The room is 192 px tall, no bottom case exists here.
    ld a, (ix+2)
    sub #04
    jp c, .deactivate
    ld (ix+2), a
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
; INPUT: none. OUTPUT: SAT entries at VRAM #F624 onwards.
; DESTROYS: AF, DE, HL, IX. PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_update_bullet_sat:
    ld de, #F624
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
    ld b, #01
.sat_loop:
    ld a, (ix+0)
    or a
    jp z, .sat_next
    ld a, (ix+2)
    add a, #14
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, #8C

    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
.sat_next:
    inc ix
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
; PURPOSE: Bullet-vs-target dispatch. Stub — no bullet-damageable runtime is enabled in this ROM.
; INPUT: IX -> current bullet slot (active, x, y, dir).
; OUTPUT: target HP/despawn on hit. DESTROYS: AF (target may use more).
; PRESERVES: BC, IX (bullet loop counter + slot pointer contract).
; ------------------------------------------------------------
bitmap_bullet_check_enemy_collision:
    ret












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

    ; Probe the WHOLE body for a deadly cell: 3 rows x 3 columns.
    ; Probing only the feet meant a hazard the player did not STAND on never
    ; hurt: a cave ceiling of stalactites was walked under with the player's
    ; head inside the cell, and a wall of spikes could be hugged safely.
    ld hl, bitmap_deadly_probe_offsets
    ld d, 9
.deadly_probe_loop:
    ld a, (player_x)
    add a, (hl)
    ld b, a                    ; B = probe X
    inc hl
    ld a, (player_y)
    add a, (hl)
    ld c, a                    ; C = probe Y (bitmap_probe_deadly keeps BC)
    inc hl
    push hl                    ; ...but it does clobber DE and HL
    push de
    call bitmap_probe_deadly
    pop de
    pop hl
    jp nz, .deadly_take_damage
    dec d
    jp nz, .deadly_probe_loop
    jp .deadly_no_contact      ; no deadly contact in any sample -> exit
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

; Hazard probe offsets from the player render origin: (dx, dy) pairs walked by
; the loop above, top row first so a ceiling hit registers as soon as it lands.
bitmap_deadly_probe_offsets:
    db 3, 3
    db 7, 3
    db 11, 3
    db 3, 17
    db 7, 17
    db 11, 17
    db 3, 31
    db 7, 31
    db 11, 31


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
;   Generalized icon-row/icon-toggle widget for linked HUD element "hud_el_1783004114045_6h49y_mina".
;   Same dirty-flag + HMMM pattern as update_hud_hearts: redraws 5
;   slot(s) at x=4..+16, y=4 on BOTH display pages only when
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
    add a, 4
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
;   Numeric counter widget for linked HUD element "hud_el_1783009772122_go9ku_mina": 2
;   zero-padded decimal digit(s) at x=158, y=2, redrawn only when
;   hud_linked_1_value changes (dirty-flag). 8-bit value via hud_byte_to_dec3.
;   Glyph atlas/template owner: linked HUD counter #1 (uploaded here).
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
    add a, 158
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz .hud_linked_1_digit_loop
    ret

hud_linked_1_cmd_template:
    ; SY is a full 10-bit word: tile sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, #E4,#00, 0,0, 0,0, 8,0, 8,0, 0,0, #D0

; ------------------------------------------------------------
; FUNCTION: update_hud_linked_2
; ------------------------------------------------------------
; PURPOSE:
;   Numeric counter widget for linked HUD element "hud_el_1783527996153_k7cbd_mina": 2
;   zero-padded decimal digit(s) at x=104, y=2, redrawn only when
;   bitmap_key_count changes (dirty-flag). 8-bit value via hud_byte_to_dec3.
;   Glyph atlas/template owner: linked HUD counter #1 (shared; no duplicate upload/template).
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_byte_to_dec3, hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
update_hud_linked_2:
    ld a, (bitmap_key_count)
    ld hl, hud_linked_2_drawn
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
    call .hud_linked_2_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a
    call .hud_linked_2_draw_page

    call bitmap_restore_hud_separator
    ret

.hud_linked_2_draw_page:
    ld b, 2
    ld c, 0
.hud_linked_2_digit_loop:
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
    add a, 104
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz .hud_linked_2_digit_loop
    ret


; ------------------------------------------------------------
; FUNCTION: update_hud_linked_3
; ------------------------------------------------------------
; PURPOSE:
;   Numeric counter widget for linked HUD element "hud_el_1786208135817_504rh_mina": 2
;   zero-padded decimal digit(s) at x=212, y=2, redrawn only when
;   bitmap_nut_count changes (dirty-flag). 8-bit value via hud_byte_to_dec3.
;   Glyph atlas/template owner: linked HUD counter #1 (shared; no duplicate upload/template).
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_byte_to_dec3, hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
update_hud_linked_3:
    ld a, (bitmap_nut_count)
    ld hl, hud_linked_3_drawn
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
    add a, 212
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz .hud_linked_3_digit_loop
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
    ; Erase the pickup cell on the currently displayed page.
    pop hl
    push hl
    ld de, 16
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_gem_target_page), a
    call bitmap_gem_copy_cmd_to_block
    call bitmap_gem_launch_cmd
    ; Which counter? Re-read the class byte at record offset 3. Reading it now,
    ; after the erase, avoids having to keep it in a register across two calls.
    pop hl
    push hl
    ld a, (hl)
    or a
    jp nz, .gem_scan_nut
    ; +1 gem on the 'collectibles'-bound HUD counter (8-bit, saturating).
    ld a, (hud_linked_1_value)
    inc a
    jp z, .gem_counter_done
    ld (hud_linked_1_value), a
.gem_counter_done:
    call bitmap_sfx_gem
    jp .gem_scan_next
.gem_scan_nut:
    ; +1 nut (shoot ammo), saturating at 255.
    ld a, (bitmap_nut_count)
    inc a
    jp z, .gem_scan_nut_done
    ld (bitmap_nut_count), a
.gem_scan_nut_done:

    call bitmap_sfx_gem
.gem_scan_next:
    pop hl
    ld de, 31
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
    inc hl                    ; skip the class byte: only the counter cares
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
    ld de, 30                    ; drawCmd(15) + eraseCmd(15)
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
; FUNCTION: bitmap_heal_player_overlaps_16
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 pickup cell.
;   (Own copy so the system does not depend on gems/keys being enabled.)
;
; INPUT:
;   D = pickup X in pixels, E = pickup Y in pixels.
;
; OUTPUT:
;   A = 1 and NZ when overlapping; A = 0 and Z when separated.
;
; DESTROYS: AF, B.  PRESERVES: C, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_heal_player_overlaps_16:
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .heal_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
    add a, 3
    cp b
    jp z, .heal_overlap_x_ok
    jp nc, .heal_overlap_no
.heal_overlap_x_ok:
    ld a, (player_y)
    add a, 31
    cp e
    jp c, .heal_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
    add a, 3
    cp b
    jp z, .heal_overlap_yes
    jp nc, .heal_overlap_no
.heal_overlap_yes:
    ld a, 1
    or a
    ret
.heal_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_heal_copy_cmd_to_block
; ------------------------------------------------------------
; PURPOSE:
;   Copy one 15-byte command template to bitmap_heal_cmd_block (#C2C0, the
;   scratch shared with HUD/key-door/gem launches — all sequential in the
;   main loop) and patch the DY high byte for the target page.
;
; INPUT:
;   HL = pointer to 15-byte command template. bitmap_heal_target_page = 0/1.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_heal_copy_cmd_to_block:
    ld de, bitmap_heal_cmd_block
    ld b, 15
.heal_copy_cmd_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .heal_copy_cmd_loop
    ld a, (bitmap_heal_target_page)
    or a
    ret z
    ld a, 1
    ld (bitmap_heal_cmd_block + 7), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_heal_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launch the 15-byte V9938 command stored in bitmap_heal_cmd_block.
;   Restores R#15 to S#0 (vdp_wait_cmd_ready leaves it at S#2).
;
; DESTROYS: AF, B, E, HL.  PRESERVES: C, D, IX, IY.
; ------------------------------------------------------------
bitmap_heal_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_heal_cmd_block
    ld b, 15
.heal_launch_cmd_loop:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .heal_launch_cmd_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_heal_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's health pickup record table.
;
; OUTPUT:
;   HL = first record, B = record count. Z set (and B=0) when empty.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_heal_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_heal_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld hl, bitmap_heal_ptr_table
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    ld a, b
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_heals
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame health pickup scan: on player overlap with an untaken pickup,
;   refill 1 point of health (never past 5), mark it taken, restore the
;   background cell on the visible page and play the pickup chime. At full
;   health nothing is taken, so the pickup stays on the floor for later.
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state, player_health,
;   player_x/player_y, bitmap_heal_flags.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_update_heals:
    ld a, (bitmap_composition_state)
    or a
    ret nz
    ld a, (player_health)       ; full health -> leave every pickup on the floor
    cp #05
    ret nc
    call bitmap_heal_room_table
    ret z
.heal_scan_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a
    ld a, (hl)
    inc hl
    ld e, a
    ld a, (hl)
    inc hl
    ld (bitmap_heal_work_offset), a
    push hl
    ld l, a
    ld h, 0
    ld bc, bitmap_heal_flags
    add hl, bc
    ld a, (hl)
    or a
    jp nz, .heal_scan_next
    call bitmap_heal_player_overlaps_16
    or a
    jp z, .heal_scan_next
    ; A previous pickup this same frame may have topped the player up: re-check
    ; before taking this one, so the last heart never eats a spare pickup.
    ld a, (player_health)
    cp #05
    jp nc, .heal_scan_next
    inc a
    ld (player_health), a       ; hearts HUD redraws itself (hud_hearts_drawn)
    ; Take: latch the flag so the pickup never re-triggers.
    ld a, (bitmap_heal_work_offset)
    ld l, a
    ld h, 0
    ld bc, bitmap_heal_flags
    add hl, bc
    ld (hl), 1
    ; Restore the background under the pickup on the currently displayed page.
    pop hl
    push hl
    ld de, 15
    add hl, de
    ld a, (bitmap_displayed_page)
    ld (bitmap_heal_target_page), a
    call bitmap_heal_copy_cmd_to_block
    call bitmap_heal_launch_cmd
    call bitmap_sfx_heal
.heal_scan_next:
    pop hl
    ld de, 30
    add hl, de
    pop bc
    djnz .heal_scan_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_heals_visible / bitmap_apply_heals_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw every UNTAKEN health pickup of the current room onto the visible page
;   (boot load_room / dialogue-close repaint) or onto the pending hidden page
;   before commit_room_flip publishes it.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_apply_heals_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_heal_target_page), a
    jp bitmap_apply_heals_for_current_room

bitmap_apply_heals_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_heal_target_page), a
bitmap_apply_heals_for_current_room:
    call bitmap_heal_room_table
    ret z
.heal_draw_loop:
    push bc
    inc hl
    inc hl
    ld a, (hl)
    inc hl
    push hl
    ld l, a
    ld h, 0
    ld bc, bitmap_heal_flags
    add hl, bc
    ld a, (hl)
    pop hl
    or a
    jp nz, .heal_draw_skip
    push hl
    call bitmap_heal_copy_cmd_to_block
    call bitmap_heal_launch_cmd
    pop hl
.heal_draw_skip:
    ld de, 30
    add hl, de
    pop bc
    djnz .heal_draw_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_sfx_heal
; ------------------------------------------------------------
; PURPOSE:
;   Health pickup chime (fire-and-forget register writes, no per-frame
;   engine). Same shape as the gem blip but a lower, warmer tone with a
;   slower envelope decay, so a refilled heart never sounds like a gem.
;   Sets BOTH envelope period bytes so repeated chimes sound identical.
;
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; SIDE EFFECTS: Writes PSG registers through ports #A0/#A1.
; ------------------------------------------------------------
bitmap_sfx_heal:
    ld hl, bitmap_sfx_heal_data
    ld b, 7
.heal_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .heal_sfx_loop
    ld a, #20               ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_sfx_heal_data:
    db 7,#3B,4,#7C,5,#00,11,#90,12,#00,10,#10,13,#09

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_clear_pool
; ------------------------------------------------------------
; PURPOSE:
;   Forget every partially eroded cell (slot cell = #FF, stage/tick = 0). This
;   is the regeneration: the room composition repaints the pristine tiles and
;   the runtime no longer remembers any erosion.
;
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_crumble_clear_pool:
    ld hl, bitmap_crumble_pool
    ld b, 16
.ccp_loop:
    ld (hl), #FF                ; free slot
    inc hl
    ld (hl), 0                  ; stage
    inc hl
    ld (hl), 0                  ; tick
    inc hl
    djnz .ccp_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_reset_visible / bitmap_crumble_reset_pending
; ------------------------------------------------------------
; PURPOSE:
;   Room (re)composition hook: latch the page the erosion must draw on and drop
;   all erosion state + live chips. Called at boot / room load with the visible
;   page and from commit_room_flip with the hidden page.
;
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_crumble_reset_visible:
    ld a, (bitmap_displayed_page)
    jp bitmap_crumble_reset_page
bitmap_crumble_reset_pending:
    ld a, (bitmap_pending_display_page)
bitmap_crumble_reset_page:
    ld (bitmap_crumble_page), a
    xor a
    ld (bitmap_crumble_debris + 0), a
    ld (bitmap_crumble_debris + 5), a
    jp bitmap_crumble_clear_pool

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_find_record
; ------------------------------------------------------------
; PURPOSE:
;   Look up bitmap_crumble_cell in the current room's crumbling-cell list.
;
; OUTPUT: NZ + A = frames per stage when the cell crumbles; Z when it does not.
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_crumble_find_record:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_crumble_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z                       ; no crumbling cell in this room
    ld hl, bitmap_crumble_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                     ; HL = first record of the room
    ld a, (bitmap_crumble_cell)
    ld c, a                     ; C = wanted cell
.cfr_loop:
    ld a, (hl)
    inc hl
    cp c
    jp z, .cfr_hit
    inc hl                      ; skip frames byte
    djnz .cfr_loop
    xor a                       ; not a crumbling cell (Z)
    ret
.cfr_hit:
    ld a, (hl)                  ; A = frames per stage (never 0, so NZ)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_slot_for_cell
; ------------------------------------------------------------
; PURPOSE:
;   Find the pool slot tracking cell A, claiming a free one on first contact.
;
; INPUT: A = cell index.
; OUTPUT: IX = slot (NZ). Z when the pool is full (the cell just does not erode).
; DESTROYS: AF, B, IX.  PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_crumble_slot_for_cell:
    ld ix, bitmap_crumble_pool
    ld b, 16
.csfc_find:
    cp (ix+0)
    jp z, .csfc_hit
    inc ix
    inc ix
    inc ix
    djnz .csfc_find
    push af                     ; keep the wanted cell while scanning for a free slot
    ld ix, bitmap_crumble_pool
    ld b, 16
.csfc_free:
    ld a, (ix+0)
    cp #FF
    jp z, .csfc_new
    inc ix
    inc ix
    inc ix
    djnz .csfc_free
    pop af
    xor a                       ; pool full (Z): skip this cell
    ret
.csfc_new:
    pop af
    ld (ix+0), a                ; claim the slot
    xor a
    ld (ix+1), a                ; stage 0
    ld (ix+2), a                ; tick 0
.csfc_hit:
    ld a, 1
    or a                        ; NZ
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_fill_band
; ------------------------------------------------------------
; PURPOSE:
;   Erase the 2px band a stage consumes: build + launch an HMMV filling
;   16 x 2 px at (col*16, row*16 + band) with the room background colour,
;   on page bitmap_crumble_page.
;
; INPUT: A = cell index, bitmap_crumble_band = row offset inside the cell.
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; SIDE EFFECTS: waits for the previous VDP command; restores R#15 = S#0.
; ------------------------------------------------------------
bitmap_crumble_fill_band:
    ld c, a                     ; C = cell
    ld hl, bitmap_crumble_cmd_block
    xor a
    ld b, 4                     ; SX (2) + SY (2): unused by HMMV
.cfb_zero:
    ld (hl), a
    inc hl
    djnz .cfb_zero
    ld a, c
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld (hl), a                  ; DX low = col * 16
    inc hl
    xor a
    ld (hl), a                  ; DX high
    inc hl
    ld a, (bitmap_crumble_band)
    ld b, a
    ld a, c
    and #F0                     ; row * 16
    add a, b                    ; + rows already eaten by previous stages
    add a, #14
    ld (hl), a                  ; DY low
    inc hl
    ld a, (bitmap_crumble_page)
    ld (hl), a                  ; DY high = page (0 -> Y 0..255, 1 -> Y 256..511)
    inc hl
    ld a, 16
    ld (hl), a                  ; NX = 16
    inc hl
    xor a
    ld (hl), a
    inc hl
    ld a, 2
    ld (hl), a                  ; NY = band height
    inc hl
    xor a
    ld (hl), a
    inc hl
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    push hl
    ld hl, bitmap_crumble_bg_table
    add hl, de
    ld a, (hl)
    pop hl
    ld (hl), a                  ; CLR = (bg<<4)|bg
    inc hl
    xor a
    ld (hl), a                  ; ARG
    inc hl
    ld a, #C0
    ld (hl), a                  ; CMD = HMMV
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_crumble_cmd_block
    ld b, 15
.cfb_launch:
    ld a, (hl)
    out (VDP_CMD_PORT), a
    inc hl
    djnz .cfb_launch
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_tick_cell
; ------------------------------------------------------------
; PURPOSE:
;   One frame of player contact on cell A: count it, and on a stage boundary eat
;   the next 2px band, throw a chip and crunch. On the last stage the cell
;   opens (collision + behavior cleared) so the player falls through.
;
; INPUT: A = cell index (0..191).
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_crumble_tick_cell:
    ld (bitmap_crumble_cell), a
    ; An already consumed cell must be ignored. The engine keeps the grounded flag
    ; for the coyote window (~12 frames) after the floor disappears, and without
    ; this check those frames re-claimed a pool slot for the open cell and started
    ; a second erosion cycle on it (caught by the OpenMSX smoke: stage went 8 -> 0
    ; and the slot was never released).
    ld c, a
    ld b, 0
    ld hl, bitmap_room_collision_map
    add hl, bc
    ld a, (hl)
    or a
    ret z
    call bitmap_crumble_find_record
    ret z                       ; plain floor: nothing to erode
    ld (bitmap_crumble_frames), a
    ld a, (bitmap_crumble_cell)
    call bitmap_crumble_slot_for_cell
    ret z                       ; pool full
    ld a, (ix+2)
    inc a
    ld (ix+2), a
    ld hl, bitmap_crumble_frames
    cp (hl)
    ret c                       ; still counting frames for this stage
    xor a
    ld (ix+2), a                ; stage boundary: restart the frame count
    ld a, (ix+1)
    inc a
    ld (ix+1), a                ; A = new stage (1..8)
    dec a
    add a, a                    ; A = (stage - 1) * 2
    ld (bitmap_crumble_band), a
    ; Last stage: the tile is fully consumed, so open the cell. Done BEFORE the
    ; chip/sfx calls because those clobber IX/HL.
    ld a, (ix+1)
    cp 8
    jp nz, .ctc_erode
    ld a, #FF
    ld (ix+0), a                ; release the slot: this cell is gone for good
    ld a, (bitmap_crumble_cell)
    ld c, a
    ld b, 0
    ld hl, bitmap_room_collision_map
    add hl, bc
    ld (hl), 0                  ; no longer solid -> the player drops
    ld hl, bitmap_room_behavior_map
    add hl, bc
    ld (hl), 0
.ctc_erode:
    ld a, (bitmap_crumble_cell)
    call bitmap_crumble_fill_band
    ld a, (bitmap_crumble_cell)
    ld c, a
    call bitmap_crumble_spawn_debris
    call bitmap_crumble_sfx      ; LAST: the PSG writes clobber HL
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame driver: step the falling chips and, while the player is grounded,
;   feed one contact frame to the cell(s) under its feet. A 16px-wide body can
;   straddle two cells, so both crumble (as in the original).
;
; DESTROYS: AF, BC, DE, HL, IX.  PRESERVES: IY.
; ------------------------------------------------------------
bitmap_crumble_update:
    ld a, (bitmap_composition_state)
    or a
    ret nz                      ; mid room transition: the bitmap is being rebuilt
    call bitmap_crumble_step_debris
    ld a, (player_flags)
    and #01
    ret z                       ; airborne: nothing is being stood on
    ld a, (bitmap_displayed_page)
    ld (bitmap_crumble_page), a
    ; Cell row right below the body box.
    ld a, (player_y)
    add a, 32
    and #F0
    ld d, a                     ; D = row * 16 = the cell index minus its column
    ; Left body column.
    ld a, (player_x)
    add a, 3
    rrca
    rrca
    rrca
    rrca
    and #0F
    or d
    ld b, a                     ; B = cell under the left edge
    ; Right body column.
    ld a, (player_x)
    add a, 11
    rrca
    rrca
    rrca
    rrca
    and #0F
    or d
    ld c, a                     ; C = cell under the right edge
    push bc
    ld a, b
    call bitmap_crumble_tick_cell
    pop bc
    ld a, b
    cp c
    ret z                       ; body inside a single cell: already ticked
    ld a, c
    jp bitmap_crumble_tick_cell

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_spawn_debris
; ------------------------------------------------------------
; PURPOSE:
;   Throw one chip from the eroding band of cell C (first free pool slot; when
;   both are busy the stage simply shows no chip).
;
; INPUT: C = cell index, bitmap_crumble_band = row offset inside the cell.
; DESTROYS: AF, B, DE, HL, IX.  PRESERVES: C, IY.
; ------------------------------------------------------------
bitmap_crumble_spawn_debris:
    ld a, c
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    add a, 6
    ld d, a                     ; D = chip x (cell centre-ish)
    ld a, (bitmap_crumble_band)
    ld e, a
    ld a, c
    and #F0
    add a, e
    ld e, a                     ; E = chip y (the row that just vanished)
    ld ix, bitmap_crumble_debris
    ld hl, bitmap_crumble_vel_table
    ld b, 2
.csd_loop:
    ld a, (ix+0)
    or a
    jp z, .csd_spawn
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    inc hl
    inc hl
    djnz .csd_loop
    ret                         ; both chips still in the air
.csd_spawn:
    ld a, 40
    ld (ix+0), a
    ld (ix+1), d
    ld (ix+2), e
    ld a, (hl)
    ld (ix+3), a                ; vx
    inc hl
    ld a, (hl)
    ld (ix+4), a                ; vy
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_step_debris
; ------------------------------------------------------------
; PURPOSE:
;   Advance live chips: x += vx, vy gains +1 every 4 frames (capped at +3),
;   y += vy. A chip dies on ttl 0 or when it leaves the play band.
;
; DESTROYS: AF, B, IX.  PRESERVES: C, DE, HL, IY.
; ------------------------------------------------------------
bitmap_crumble_step_debris:
    ld ix, bitmap_crumble_debris
    ld b, 2
.csdb_loop:
    ld a, (ix+0)
    or a
    jp z, .csdb_next
    dec a
    ld (ix+0), a
    jp z, .csdb_next            ; expired this frame
    ld a, (ix+1)
    add a, (ix+3)
    ld (ix+1), a
    ld a, (ix+0)
    and 3
    jp nz, .csdb_fall
    ld a, (ix+4)
    cp 3
    jp z, .csdb_fall
    inc a
    ld (ix+4), a
.csdb_fall:
    ld a, (ix+2)
    add a, (ix+4)
    ld (ix+2), a
    cp 192
    jp c, .csdb_next
    xor a                       ; left the band (or wrapped above): kill it
    ld (ix+0), a
.csdb_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .csdb_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_crumble_update_debris_sat
; ------------------------------------------------------------
; PURPOSE:
;   Write the 2 chip SAT slots (idle chips park at Y #D4, the
;   off-screen non-terminator Y the other systems use) plus a #D8 terminator;
;   when shoot is active its bullet writer runs after this one and overwrites
;   the terminator with its first slot.
;
; OUTPUT: SAT entries at VRAM #F61C onwards.
; DESTROYS: AF, DE, HL, IX.  PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_crumble_update_debris_sat:
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
    ld ix, bitmap_crumble_debris
    ld b, 2
.csat_loop:
    ld a, (ix+0)
    or a
    jp z, .csat_hidden
    ld a, (ix+2)
    add a, #14
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, #88
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .csat_next
.csat_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.csat_next:
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .csat_loop
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
; FUNCTION: bitmap_crumble_sfx
; ------------------------------------------------------------
; PURPOSE: short crunch on each erosion stage (fire-and-forget PSG writes on
;   channel C, the gameplay SFX channel, like the gem blip / pick thud).
; DESTROYS: AF, B, HL. PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_crumble_sfx:
    ld hl, bitmap_crumble_sfx_data
    ld b, 8
.csfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .csfx_loop
    ; Shadow holds the channel-C DISABLE bits of R7 (bit2 tone, bit5 noise); the
    ; music merges it after clearing those two bits. Both clear = tone + noise on.
    xor a
    ld (psg_sfx_r7_c_bits), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_player_state_machine
; ------------------------------------------------------------
; PURPOSE:
;   Apply the current state's Graphics & Render animation mapping and evaluate
;   the authored Player-linked State Machine input transitions.
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
;   Generated bitmap_sm_read_input_* helpers.
;
; SIDE EFFECTS:
;   Writes bitmap_sm_state and player_anim_state.
;
; NOTES:
;   Player Config / Controls is the input source of truth for conditions.
;   Graphics & Render is the source of truth for state animation clips.
; ------------------------------------------------------------
bitmap_update_player_state_machine:
    ld a, (bitmap_sm_state)
    cp 0
    jp z, .bitmap_sm_anim_0
    cp 1
    jp z, .bitmap_sm_anim_1
    cp 2
    jp z, .bitmap_sm_anim_2
    cp 3
    jp z, .bitmap_sm_anim_3
    xor a
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_0:
    ld a, 1
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_1:
    ld a, 2
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_2:
    ld a, 0
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_3:
    ld a, 0
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_store:
    ld (player_anim_state), a
    ; Authored transition order is priority order.
.bitmap_sm_transition_0:
    ld a, (bitmap_sm_state)
    cp 0
    jp nz, .bitmap_sm_transition_1
    call bitmap_sm_read_input_0
    or a
    jp z, .bitmap_sm_transition_1
    ld a, 1
    ld (bitmap_sm_state), a
    ld a, 2
    ld (player_anim_state), a
    ret
.bitmap_sm_transition_1:
    ld a, (bitmap_sm_state)
    cp 1
    jp nz, .bitmap_sm_transition_2
    call bitmap_sm_read_input_0
    or a
    jp nz, .bitmap_sm_transition_2
    call bitmap_sm_read_input_1
    or a
    jp nz, .bitmap_sm_transition_2
    ld a, 0
    ld (bitmap_sm_state), a
    ld a, 1
    ld (player_anim_state), a
    ret
.bitmap_sm_transition_2:
    ld a, (bitmap_sm_state)
    cp 0
    jp nz, .bitmap_sm_transition_3
    call bitmap_sm_read_input_1
    or a
    jp z, .bitmap_sm_transition_3
    ld a, 1
    ld (bitmap_sm_state), a
    ld a, 2
    ld (player_anim_state), a
    ret
.bitmap_sm_transition_3:
    ld a, (bitmap_sm_state)
    cp 1
    jp nz, .bitmap_sm_transition_4
    call bitmap_sm_read_input_0
    or a
    jp nz, .bitmap_sm_transition_4
    call bitmap_sm_read_input_1
    or a
    jp nz, .bitmap_sm_transition_4
    ld a, 0
    ld (bitmap_sm_state), a
    ld a, 1
    ld (player_anim_state), a
    ret
.bitmap_sm_transition_4:
    ret

bitmap_sm_read_input_0:
    ; LEFT, matrix row 8, mask #10.
    ; Output A=1 active, A=0 inactive. Preserves BC/DE/HL.
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    and #10
    jr nz, .bitmap_sm_read_input_0_inactive
    ld a, 1
    ret
.bitmap_sm_read_input_0_inactive:
    xor a
    ret

bitmap_sm_read_input_1:
    ; RIGHT, matrix row 8, mask #80.
    ; Output A=1 active, A=0 inactive. Preserves BC/DE/HL.
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    and #80
    jr nz, .bitmap_sm_read_input_1_inactive
    ld a, 1
    ret
.bitmap_sm_read_input_1_inactive:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_player_air_anim
; ------------------------------------------------------------
; PURPOSE:
;   Assert the authored jump animation clip while the player is off
;   the ground. Nothing else does it: crouch, dash, wall jump, dig, perception
;   and the glowing tail each assert their own state, but plain jumping and
;   falling are engine physics, so without this hook an authored jump clip could
;   only be reached through a State Machine key transition.
;
; INPUT:
;   player_flags bit0 (1 = standing on ground), player_vy (signed px/frame).
;
; OUTPUT:
;   player_anim_state.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; NOTES:
;   Grounded frames return untouched so idle/walk keep whatever the State
;   Machine or the base clip selected.
; ------------------------------------------------------------
bitmap_update_player_air_anim:
    ld a, (player_flags)
    and #01                   ; bit0 = standing on ground
    ret nz
    ld a, 3
    ld (player_anim_state), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_sprite_point_is_lit
; ------------------------------------------------------------
; PURPOSE:
;   Test a hardware-sprite point against the player's current halo. Bitmap
;   logical fills cannot affect the V9938 sprite layer, so sprite runtimes use
;   this result to select their dim or bright colour-table twin.
;
; INPUT:
;   D = absolute SCREEN 5 X, E = absolute SCREEN 5 Y.
;
; OUTPUT:
;   A = 1 and NZ when the point is inside one halo band; A = 0 and Z when the
;   room is fully lit, the tail is off, or the point lies outside the halo.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
; ------------------------------------------------------------
bitmap_light_sprite_point_is_lit:
    ld a, (bitmap_light_active)
    or a
    ret z
    ld a, (bitmap_light_on)
    or a
    ret z
    push de
    ld hl, (bitmap_light_bands_ptr)
    ld b, 5
.sprite_light_band_loop:
    ld a, (hl)                ; signed band Y offset
    inc hl
    ld c, a
    ld a, (bitmap_light_y)
    add a, c                  ; A = band top
    ld c, a
    ld a, e
    sub c                     ; A = pointY - bandTop
    jp c, .sprite_light_skip_y
    ld c, a
    ld a, (hl)                ; band height
    inc hl
    cp c
    jp c, .sprite_light_skip_hw
    jp z, .sprite_light_skip_hw
    ld c, (hl)                ; half width
    inc hl
    ld a, (bitmap_light_x)
    sub c                     ; A = band left
    ld c, a
    ld a, d
    sub c                     ; A = pointX - bandLeft
    jp c, .sprite_light_next
    dec hl
    ld c, (hl)
    inc hl
    sla c                     ; full band width
    cp c
    jp c, .sprite_light_yes
.sprite_light_next:
    djnz .sprite_light_band_loop
    pop de
    xor a
    ret
.sprite_light_skip_y:
    inc hl                    ; skip height
.sprite_light_skip_hw:
    inc hl                    ; skip half width
    jp .sprite_light_next
.sprite_light_yes:
    pop de
    ld a, 1
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_room_is_dark
; ------------------------------------------------------------
; PURPOSE:
;   Test whether the current room is lit only by the player.
;
; OUTPUT:
;   A = flag, Z set when the room is a normal (fully lit) room.
;
; DESTROYS:
;   AF, DE, HL.
; ------------------------------------------------------------
bitmap_light_room_is_dark:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_light_room_flags
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_op_dim / bitmap_light_op_lit
; ------------------------------------------------------------
; PURPOSE:
;   Select the logical fill used by the next rectangles. OR #08 sets bit 3 of
;   every pixel nibble (colour N -> its dimmed twin N+8); AND #07 clears it.
;
; DESTROYS:
;   AF.
; ------------------------------------------------------------
bitmap_light_op_dim:
    ld a, #08
    ld (bitmap_light_op_clr), a
    ld a, #82                 ; LMMV (#80) + logical OR (#02). NOT #A0: that is
                              ; LMCM, VRAM->CPU, which stalls waiting for reads.
    ld (bitmap_light_op_cmd), a
    ret

bitmap_light_op_lit:
    ld a, #07
    ld (bitmap_light_op_clr), a
    ld a, #81                 ; LMMV (#80) + logical AND (#01)
    ld (bitmap_light_op_cmd), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_rect
; ------------------------------------------------------------
; PURPOSE:
;   Run the selected logical fill over one rectangle. Coordinates are never
;   clipped here: every halo centre is clamped so each rectangle already lies
;   inside the game band.
;
; INPUT:
;   bitmap_light_rx / _ry = top-left corner, bitmap_light_rw = width (word),
;   bitmap_light_rh = height, bitmap_light_page = destination page (DY high),
;   bitmap_light_op_clr / _op_cmd = the fill selected above.
;
; DESTROYS:
;   AF, E.
;
; PRESERVES:
;   BC, D, HL, IX, IY.
;
; SIDE EFFECTS:
;   Leaves R#15 selecting S#2 (vdp_wait_cmd_ready). The caller restores S#0.
; ------------------------------------------------------------
bitmap_light_rect:
    call vdp_wait_cmd_ready
    ld a, #11
    ld e, #24                 ; R#17 = 36: indirect writes start at R#36 (DX)
    call vdp_write_register
    ld a, (bitmap_light_rx)
    out (#9B), a              ; DX low
    xor a
    out (#9B), a              ; DX high
    ld a, (bitmap_light_ry)
    out (#9B), a              ; DY low
    ld a, (bitmap_light_page)
    out (#9B), a              ; DY high = page (SCREEN 5 page N starts at y=N*256)
    ld a, (bitmap_light_rw)
    out (#9B), a              ; NX low
    ld a, (bitmap_light_rw + 1)
    out (#9B), a              ; NX high
    ld a, (bitmap_light_rh)
    out (#9B), a              ; NY low
    xor a
    out (#9B), a              ; NY high
    ld a, (bitmap_light_op_clr)
    out (#9B), a              ; CLR
    xor a
    out (#9B), a              ; ARG
    ld a, (bitmap_light_op_cmd)
    out (#9B), a              ; CMD
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_load_band
; ------------------------------------------------------------
; PURPOSE:
;   Resolve one band record against the current halo centre.
;
; INPUT:
;   HL = band record (signed dy, height, half width), bitmap_light_y = centre.
;
; OUTPUT:
;   bitmap_light_band_y / _band_h / _band_hw, HL advanced past the record.
;
; DESTROYS:
;   AF, E, HL.
; ------------------------------------------------------------
bitmap_light_load_band:
    ld a, (bitmap_light_y)
    ld e, a
    ld a, (hl)                ; signed offset; the clamped centre keeps the
    add a, e                  ; result inside the game band, so 8-bit is enough
    ld (bitmap_light_band_y), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_band_h), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_band_hw), a
    inc hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_draw_bands
; ------------------------------------------------------------
; PURPOSE:
;   Apply the selected fill to the whole halo (every band, full width).
;   Used when the halo appears or dies, not for the per-frame delta.
;
; INPUT:
;   bitmap_light_x / _y = halo centre, fill already selected.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_draw_bands:
    ld hl, (bitmap_light_bands_ptr)
    ld b, 5
.band_loop:
    push bc
    call bitmap_light_load_band
    push hl
    ld a, (bitmap_light_band_hw)
    ld c, a
    ld a, (bitmap_light_x)
    sub c
    ld (bitmap_light_rx), a
    ld a, c
    add a, a                  ; width = 2 * half width (<= 80)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (bitmap_light_band_y)
    ld (bitmap_light_ry), a
    ld a, (bitmap_light_band_h)
    ld (bitmap_light_rh), a
    call bitmap_light_submit
    pop hl
    pop bc
    djnz .band_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_target
; ------------------------------------------------------------
; PURPOSE:
;   Halo centre the player wants this frame: his own centre, clamped so the blob
;   never crosses the edges of the game band. The clamp is what lets every
;   rectangle skip clipping.
;
; OUTPUT:
;   bitmap_light_tx / bitmap_light_ty.
;
; DESTROYS:
;   AF, C.
; ------------------------------------------------------------
bitmap_light_target:
    ld a, (player_x)
    add a, 7
    jr nc, .cx_no_wrap
    ld a, 255
.cx_no_wrap:
    ld c, a
    ld a, (bitmap_light_cxmin)
    cp c
    jr nc, .cx_clamped                ; centre left of the stage minimum
    ld a, (bitmap_light_cxmax)
    cp c
    jr c, .cx_clamped                 ; centre right of the stage maximum
    ld a, c
.cx_clamped:
    ld (bitmap_light_tx), a
    ld a, (player_y)
    add a, 37
    jr nc, .cy_no_wrap
    ld a, 255
.cy_no_wrap:
    cp 52
    jr nc, .cy_min_ok
    ld a, 52
.cy_min_ok:
    cp 181
    jr c, .cy_max_ok
    ld a, 180
.cy_max_ok:
    ld (bitmap_light_ty), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_paint_full
; ------------------------------------------------------------
; PURPOSE:
;   Dim the whole game band and cut the current light sources out of it. Runs
;   once per room, on the hidden page before the flip (or on the visible page at
;   boot), never in the steady-state frame budget.
;
; INPUT:
;   bitmap_light_page = destination page.
;
; OUTPUT:
;   bitmap_light_x / _y = halo centre, bitmap_light_active = 1.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_paint_full:
    call bitmap_mush_clear_flags      ; entering the room grows every mushroom back
    call bitmap_light_op_dim
    xor a
    ld (bitmap_light_rx), a
    ld (bitmap_light_rw), a
    ld a, 20
    ld (bitmap_light_ry), a
    ld a, 1
    ld (bitmap_light_rw + 1), a       ; NX = 256, the full row
    ld a, 192
    ld (bitmap_light_rh), a
    call bitmap_light_rect            ; unrepaired on purpose: the mushrooms are
                                      ; cut out of this fill right below
    call bitmap_light_paint_mushrooms ; static glows, before the moving one
    call bitmap_light_target
    ld a, (bitmap_light_tx)
    ld (bitmap_light_x), a
    ld a, (bitmap_light_ty)
    ld (bitmap_light_y), a
    ld a, (bitmap_light_on)
    or a
    jp z, .light_full_done            ; tail dark: only the mushrooms light this room
    call bitmap_light_op_lit
    call bitmap_light_draw_bands
.light_full_done:
    ; Drain the engine before returning: the full-band dim fill above is issued
    ; fire-and-forget, and commit_room_flip publishes the page right after this
    ; call with no wait of its own. With the halo drawn the band rects served as
    ; that wait (each starts with vdp_wait_cmd_ready), but the tail-dark path
    ; skips them and the flip caught the fill mid-flight: the room appeared lit
    ; and then darkened top-down, a visible raster sweep. Once per room load,
    ; never in the steady-state frame budget.
    call bitmap_light_drain_cmd
    ld a, 1
    ld (bitmap_light_active), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_drain_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Wait for the room-entry paint to finish WITHOUT stalling the song. The
;   full-band dim fill is the longest blit of a whole transition, so draining it
;   with a bare vdp_wait_cmd_ready held the CPU for several frames and the music
;   audibly stopped on every screen change. Same keep-alive contract as
;   step_room_composition: poll S#0 and tick the driver once per elapsed vblank.
;
; OUTPUT:
;   Command engine idle, R#15 = 2 (same exit state as vdp_wait_cmd_ready, and
;   the paint entry points restore R#15 = 0 via bitmap_light_restore_status).
;
; DESTROYS:
;   AF, BC, DE, HL (music_update).
; ------------------------------------------------------------
bitmap_light_drain_cmd:
.drain_loop:
    call read_vdp_status_2
    bit 0, a                  ; CE still set -> the fill is running
    ret z
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a              ; R#15 = 0 -> status port reads S#0
    in a, (#99)               ; frame flag (bit 7); reading clears it
    bit 7, a
    call nz, music_update
    jp .drain_loop


; ------------------------------------------------------------
; FUNCTION: bitmap_light_paint_visible / bitmap_light_paint_pending
; ------------------------------------------------------------
; PURPOSE:
;   Room entry points. The pending variant paints the hidden page just before
;   commit_room_flip publishes it, so the room is never seen fully lit.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_paint_visible:
    call bitmap_light_room_is_dark
    jp z, bitmap_light_clear_state
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    call bitmap_light_paint_full
    jp bitmap_light_restore_status

bitmap_light_paint_pending:
    call bitmap_light_room_is_dark
    jp z, bitmap_light_clear_state
    ld a, (bitmap_pending_display_page)
    ld (bitmap_light_page), a
    call bitmap_light_paint_full
    jp bitmap_light_restore_status

bitmap_light_clear_state:
    xor a
    ld (bitmap_light_active), a       ; lit room: nothing painted, nothing to track
    ret

bitmap_light_restore_status:
    ; The command helpers leave R#15 on S#2; the main loop polls S#0 for vblank.
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_light_shift_x
; ------------------------------------------------------------
; PURPOSE:
;   Move the halo horizontally by repainting only the strips that change: the
;   column the halo leaves behind is dimmed, the column it reaches is lit. Bands
;   are disjoint in Y, so each band is independent and pass order is free.
;
; INPUT:
;   bitmap_light_tx = wanted centre, bitmap_light_x = current centre.
;
; OUTPUT:
;   bitmap_light_x advanced by at most 8 px.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_shift_x:
    ld a, (bitmap_light_x)
    ld c, a
    ld a, (bitmap_light_tx)
    sub c                     ; A = signed dx
    ret z
    jp m, .going_left
    cp 9
    jr c, .right_step_ok
    ld a, 8
.right_step_ok:
    ld (bitmap_light_d), a
    ; Moving right: the left edge is vacated, the right edge is gained.
    xor a
    ld (bitmap_light_xadj), a
    ld (bitmap_light_xsign), a        ; leaving strip sits at cx - hw
    call bitmap_light_op_dim
    call bitmap_light_strip_pass
    ld a, 1
    ld (bitmap_light_xsign), a        ; entering strip sits at cx + hw
    call bitmap_light_op_lit
    call bitmap_light_strip_pass
    ld a, (bitmap_light_d)
    ld c, a
    ld a, (bitmap_light_x)
    add a, c
    ld (bitmap_light_x), a
    ret
.going_left:
    neg
    cp 9
    jr c, .left_step_ok
    ld a, 8
.left_step_ok:
    ld (bitmap_light_d), a
    ; Moving left: both strips are pulled back by d, and the roles swap.
    ld (bitmap_light_xadj), a
    ld a, 1
    ld (bitmap_light_xsign), a        ; leaving strip sits at cx + hw - d
    call bitmap_light_op_dim
    call bitmap_light_strip_pass
    xor a
    ld (bitmap_light_xsign), a        ; entering strip sits at cx - hw - d
    call bitmap_light_op_lit
    call bitmap_light_strip_pass
    ld a, (bitmap_light_x)
    ld c, a
    ld a, (bitmap_light_d)
    ld b, a
    ld a, c
    sub b
    ld (bitmap_light_x), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_strip_pass
; ------------------------------------------------------------
; PURPOSE:
;   One vertical-strip pass over every band, using the fill and the edge
;   selected by the caller.
;
; INPUT:
;   bitmap_light_xsign (0 = cx - hw, 1 = cx + hw), bitmap_light_xadj (0 or d),
;   bitmap_light_d = strip width.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_strip_pass:
    ld hl, (bitmap_light_bands_ptr)
    ld b, 5
.strip_loop:
    push bc
    call bitmap_light_load_band
    push hl
    ld a, (bitmap_light_band_hw)
    ld c, a
    ld a, (bitmap_light_xsign)
    or a
    ld a, (bitmap_light_x)
    jr z, .strip_minus
    add a, c
    jr .strip_adj
.strip_minus:
    sub c
.strip_adj:
    ld c, a
    ld a, (bitmap_light_xadj)
    ld b, a
    ld a, c
    sub b
    ld (bitmap_light_rx), a
    ld a, (bitmap_light_d)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (bitmap_light_band_y)
    ld (bitmap_light_ry), a
    ld a, (bitmap_light_band_h)
    ld (bitmap_light_rh), a
    call bitmap_light_submit
    pop hl
    pop bc
    djnz .strip_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_shift_y
; ------------------------------------------------------------
; PURPOSE:
;   Move the halo vertically. Only the pixels that genuinely change owner are
;   repainted: the full-width sliver entering at the leading end, the one leaving
;   at the trailing end, and at every band boundary just the difference in half
;   width. Repainting whole bands would cost 3.5x more for the same result.
;
; INPUT:
;   bitmap_light_ty = wanted centre, bitmap_light_y = current centre,
;   bitmap_light_x = centre already updated by bitmap_light_shift_x.
;
; OUTPUT:
;   bitmap_light_y advanced by at most 8 px (never more than the
;   shortest band, or two boundary row ranges would overlap).
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_shift_y:
    ld a, (bitmap_light_y)
    ld c, a
    ld a, (bitmap_light_ty)
    sub c                     ; A = signed dy
    ret z
    jp m, .going_up
    cp 9
    jr c, .down_step_ok
    ld a, 8
.down_step_ok:
    ld (bitmap_light_d), a
    xor a
    ld (bitmap_light_ybias), a        ; down: rectangles sit at cy + yOff
    ld hl, (bitmap_light_sdown_ptr)
    ld a, (bitmap_light_sdown_n)
    ld b, a
    call bitmap_light_step_pass
    ld a, (bitmap_light_d)
    ld c, a
    ld a, (bitmap_light_y)
    add a, c
    ld (bitmap_light_y), a
    ret
.going_up:
    neg
    cp 9
    jr c, .up_step_ok
    ld a, 8
.up_step_ok:
    ld (bitmap_light_d), a
    ld (bitmap_light_ybias), a        ; up: rectangles sit at cy + yOff - d
    ld hl, (bitmap_light_sup_ptr)
    ld a, (bitmap_light_sup_n)
    ld b, a
    call bitmap_light_step_pass
    ld a, (bitmap_light_y)
    ld c, a
    ld a, (bitmap_light_d)
    ld b, a
    ld a, c
    sub b
    ld (bitmap_light_y), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_step_pass
; ------------------------------------------------------------
; PURPOSE:
;   Run one vertical-step table. Each entry is a rectangle d rows tall placed
;   relative to the halo centre, with its own fill. Entries never share a row
;   range, so they can run in any order.
;
; INPUT:
;   HL = step table, B = entry count, bitmap_light_d = step height,
;   bitmap_light_ybias = 0 (down) or d (up).
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_step_pass:
.light_step_loop:
    ld a, (bitmap_light_y)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ry), a
    ld a, (bitmap_light_ybias)
    ld e, a
    ld a, (bitmap_light_ry)
    sub e                     ; up entries hang d rows higher
    ld (bitmap_light_ry), a
    inc hl
    ld a, (bitmap_light_x)
    add a, (hl)               ; + signed column offset
    ld (bitmap_light_rx), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    inc hl
    ld a, (bitmap_light_d)
    ld (bitmap_light_rh), a
    ld a, (hl)                ; 1 = light, 0 = dim
    inc hl
    or a
    jr z, .light_step_dim
    call bitmap_light_op_lit
    jr .light_step_fire
.light_step_dim:
    call bitmap_light_op_dim
.light_step_fire:
    call bitmap_light_submit            ; preserves B and HL, so the loop needs no stack
    djnz .light_step_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's mushroom table (8 bytes each: clamped glow
;   centre, cell corner, eaten-flag index and selected atlas tile source).
;
; OUTPUT:
;   HL = first record, B = mushroom count. Z set (B = 0) when the room has none.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_mush_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_count_table
    add hl, de
    ld b, (hl)
    ld hl, bitmap_mush_ptr_table
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
; FUNCTION: bitmap_mush_clear_flags
; ------------------------------------------------------------
; PURPOSE:
;   Forget which mushrooms were eaten. Room paint still resets the local flags;
;   normal gameplay also regenerates them when the tail timer reaches zero.
;
; DESTROYS: AF, B, HL.
; ------------------------------------------------------------
bitmap_mush_clear_flags:
    ld hl, bitmap_mush_flags
    ld b, 1
    xor a
.tl_mush_clear_loop:
    ld (hl), a
    inc hl
    djnz .tl_mush_clear_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_eaten
; ------------------------------------------------------------
; PURPOSE:
;   Read the eaten flag of one mushroom.
;
; INPUT:   A = flag index.
; OUTPUT:  A = flag, Z set when the mushroom is still there.
; DESTROYS: AF, DE, HL.  PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_mush_eaten:
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_flags
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_draw_glow
; ------------------------------------------------------------
; PURPOSE:
;   Apply the selected fill to one mushroom glow (every band, full width).
;
; INPUT:
;   bitmap_mush_cx / _cy = glow centre, fill already selected.
;
; DESTROYS: AF, C, DE, HL.  PRESERVES: B, IX, IY.
; ------------------------------------------------------------
bitmap_mush_draw_glow:
    ld hl, bitmap_mush_bands
    ld c, 3
.tl_glow_loop:
    ld a, (bitmap_mush_cy)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ry), a
    inc hl
    ld a, (hl)                ; band height
    ld (bitmap_light_rh), a
    inc hl
    ld a, (bitmap_mush_cx)
    sub (hl)                  ; centre - half width
    ld (bitmap_light_rx), a
    ld a, (hl)
    add a, a                  ; width = 2 * half width
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    inc hl
    push bc
    push hl
    call bitmap_light_submit
    pop hl
    pop bc
    dec c
    jp nz, .tl_glow_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_erase_tile
; ------------------------------------------------------------
; PURPOSE:
;   Wipe the eaten mushroom's 16x16 cell to the room backdrop colour, so the
;   mushroom is really gone and not just switched off. LMMV with no logical
;   operation (#80) paints the colour straight over the cell; every other fill
;   in this file uses the OR/AND variants instead.
;
;   It runs AFTER the tail has been relit, so the cell is inside the lit halo
;   and the lit backdrop colour is the right one. The selected atlas tile is
;   copied back by bitmap_mush_regenerate_eaten when the tail burns out.
;
; INPUT:
;   bitmap_mush_ex / _ey = cell top-left in room pixels.
;
; DESTROYS: AF, DE, HL.  PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_mush_erase_tile:
    ld a, (bitmap_mush_ex)
    ld (bitmap_light_rx), a
    ld a, (bitmap_mush_ey)
    add a, 20                    ; room row -> page row
    ld (bitmap_light_ry), a
    ld a, 16
    ld (bitmap_light_rw), a
    ld (bitmap_light_rh), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_bg_table
    add hl, de
    ld a, (hl)
    ld (bitmap_light_op_clr), a       ; backdrop colour, not a light level
    ld a, #80                         ; LMMV + IMP: write the colour as it is
    ld (bitmap_light_op_cmd), a
    jp bitmap_light_rect

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_restore_tile
; ------------------------------------------------------------
; PURPOSE:
;   Copy the mushroom's selected 16x16 tile from the shared SCREEN 5 atlas back
;   to its cell on the displayed page. #FFFF means the entity has no valid tile:
;   its collision/glow still regenerate, but there is no bitmap to copy.
;
; INPUT:
;   bitmap_mush_sx / _sy = absolute atlas source X/Y.
;   bitmap_mush_ex / _ey = destination cell in room pixels.
;   bitmap_light_page = displayed SCREEN 5 page.
;
; DESTROYS: AF, E.  PRESERVES: BC, D, HL, IX, IY.
;
; SIDE EFFECTS:
;   Starts one V9938 HMMM command and leaves R#15 selecting S#2. The outer
;   bitmap_light_update path restores S#0 before returning to gameplay.
; ------------------------------------------------------------
bitmap_mush_restore_tile:
    ld a, (bitmap_mush_sy + 1)
    cp #FF
    jp nz, .tl_mush_restore_do
    ld a, (bitmap_mush_sy)
    cp #FF
    ret z
.tl_mush_restore_do:
    call vdp_wait_cmd_ready
    ld e, #20                 ; R#17 = 32: SX,SY,DX,DY,NX,NY,COL,ARG,CMD
    ld a, #11
    call vdp_write_register
    ld a, (bitmap_mush_sx)
    out (#9B), a              ; SX low
    xor a
    out (#9B), a              ; SX high
    ld a, (bitmap_mush_sy)
    out (#9B), a              ; SY low
    ld a, (bitmap_mush_sy + 1)
    out (#9B), a              ; SY high
    ld a, (bitmap_mush_ex)
    out (#9B), a              ; DX low
    xor a
    out (#9B), a              ; DX high
    ld a, (bitmap_mush_ey)
    add a, 20
    out (#9B), a              ; DY low
    ld a, (bitmap_light_page)
    out (#9B), a              ; DY high = displayed page
    ld a, 16
    out (#9B), a              ; NX low
    xor a
    out (#9B), a              ; NX high
    ld a, 16
    out (#9B), a              ; NY low
    xor a
    out (#9B), a              ; NY high
    out (#9B), a              ; COL (unused by HMMM)
    out (#9B), a              ; ARG
    ld a, #D0                 ; HMMM + IMP
    out (#9B), a              ; CMD
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_regenerate_eaten
; ------------------------------------------------------------
; PURPOSE:
;   When the configured glow time is exhausted, regenerate every mushroom eaten
;   in the current room: clear its flag, restore its selected tile and relight
;   its static glow.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_mush_regenerate_eaten:
    call bitmap_mush_room_table
    ret z
.tl_mush_regen_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_ex), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_ey), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_flag), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_sx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_sy), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_sy + 1), a
    inc hl
    push hl                   ; next 8-byte record
    ld a, (bitmap_mush_flag)
    call bitmap_mush_eaten
    jp z, .tl_mush_regen_next
    ld a, (bitmap_mush_flag)
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_flags
    add hl, de
    xor a
    ld (hl), a               ; edible again before its glow is repaired
    call bitmap_mush_restore_tile
    call bitmap_light_op_lit
    call bitmap_mush_draw_glow
.tl_mush_regen_next:
    pop hl
    pop bc
    dec b
    jp nz, .tl_mush_regen_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_paint_mushrooms
; ------------------------------------------------------------
; PURPOSE:
;   Cut every uneaten mushroom of the current room out of the darkness. Runs
;   once per room, right after the full dark fill.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_paint_mushrooms:
    call bitmap_mush_room_table
    ret z
    call bitmap_light_op_lit
.tl_paint_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    inc hl                    ; skip the eat hitbox corner
    inc hl
    ld a, (hl)                ; flag index
    inc hl
    inc hl                    ; skip atlas source X
    inc hl                    ; skip atlas source Y low/high
    inc hl
    push hl
    call bitmap_mush_eaten
    jp nz, .tl_paint_next     ; already eaten: wait for timer expiry/regeneration
    call bitmap_mush_draw_glow
.tl_paint_next:
    pop hl
    pop bc
    dec b
    jp nz, .tl_paint_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_intersect
; ------------------------------------------------------------
; PURPOSE:
;   Intersect the saved source rectangle with the target rectangle. Widths are
;   measured FORWARD from the intersection corner (w - (i - x)) instead of
;   comparing right edges, because a right edge can legitimately be 256 and
;   would wrap in 8 bits.
;
; INPUT:
;   bitmap_light_srx / _sry / _srw / _srh = source (the rectangle just dimmed),
;   bitmap_light_tx0 / _ty0 / _tw / _th   = target (a glow band or its bbox).
;
; OUTPUT:
;   Z set when the two are disjoint. Otherwise NZ and bitmap_light_rx / _ry /
;   _rw / _rh hold the intersection, ready for bitmap_light_rect.
;
; DESTROYS: AF, BC, DE.  PRESERVES: HL, IX, IY.
; ------------------------------------------------------------
bitmap_light_intersect:
    ld a, (bitmap_light_srx)
    ld b, a
    ld a, (bitmap_light_tx0)
    ld c, a
    cp b
    jr nc, .tl_ix_ok
    ld a, b                   ; A = max(srx, tx0)
.tl_ix_ok:
    ld (bitmap_light_rx), a
    sub b                     ; how far into the source rectangle
    ld e, a
    ld a, (bitmap_light_srw)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    ld d, a                   ; D = source width left of its right edge
    ld a, (bitmap_light_rx)
    sub c                     ; how far into the target rectangle
    ld e, a
    ld a, (bitmap_light_tw)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    cp d
    jr c, .tl_keep_w
    ld a, d
.tl_keep_w:
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (bitmap_light_sry)
    ld b, a
    ld a, (bitmap_light_ty0)
    ld c, a
    cp b
    jr nc, .tl_iy_ok
    ld a, b                   ; A = max(sry, ty0)
.tl_iy_ok:
    ld (bitmap_light_ry), a
    sub b
    ld e, a
    ld a, (bitmap_light_srh)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    ld d, a
    ld a, (bitmap_light_ry)
    sub c
    ld e, a
    ld a, (bitmap_light_th)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    cp d
    jr c, .tl_keep_h
    ld a, d
.tl_keep_h:
    ld (bitmap_light_rh), a
    or a                      ; height >= 1 here, so NZ = they overlap
    ret
.tl_no_overlap:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_repair
; ------------------------------------------------------------
; PURPOSE:
;   Re-light whatever the rectangle just dimmed took away from a mushroom glow.
;   Dimming is a logical OR, so without this the halo would swallow every
;   mushroom it swept over, permanently. Eaten mushrooms are skipped, which is
;   also what keeps them dark once their glow has been put out.
;
;   The bounding box of each glow is tested first, so a halo far from any
;   mushroom pays two subtractions and a compare per mushroom.
;
; INPUT:
;   bitmap_light_rx / _ry / _rw / _rh = the rectangle that was just dimmed.
;
; OUTPUT:
;   The dim fill is reselected, so the caller's pass continues unaffected.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_repair:
    ld a, (bitmap_light_rx)
    ld (bitmap_light_srx), a
    ld a, (bitmap_light_ry)
    ld (bitmap_light_sry), a
    ld a, (bitmap_light_rw)
    ld (bitmap_light_srw), a
    ld a, (bitmap_light_rh)
    ld (bitmap_light_srh), a
    call bitmap_mush_room_table
    jp z, bitmap_light_op_dim
.tl_repair_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    inc hl                    ; skip the eat hitbox corner
    inc hl
    ld a, (hl)                ; flag index
    inc hl
    inc hl                    ; skip atlas source X
    inc hl                    ; skip atlas source Y low/high
    inc hl
    push hl
    call bitmap_mush_eaten
    jp nz, .tl_repair_next    ; eaten glows have nothing left to protect
    ld a, (bitmap_mush_cx)
    sub 24
    ld (bitmap_light_tx0), a
    ld a, 48
    ld (bitmap_light_tw), a
    ld a, (bitmap_mush_cy)
    sub 16
    ld (bitmap_light_ty0), a
    ld a, 32
    ld (bitmap_light_th), a
    call bitmap_light_intersect       ; bounding box first
    jp z, .tl_repair_next
    ld hl, bitmap_mush_bands
    ld b, 3
.tl_repair_band:
    push bc
    ld a, (bitmap_mush_cy)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ty0), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_th), a
    inc hl
    ld a, (bitmap_mush_cx)
    sub (hl)
    ld (bitmap_light_tx0), a
    ld a, (hl)
    add a, a
    ld (bitmap_light_tw), a
    inc hl
    call bitmap_light_intersect
    jr z, .tl_repair_band_next
    call bitmap_light_op_lit
    call bitmap_light_rect    ; preserves BC and HL: no stack needed here
.tl_repair_band_next:
    pop bc
    djnz .tl_repair_band
.tl_repair_next:
    pop hl
    pop bc
    dec b                     ; loop body exceeds djnz's -128 range
    jp nz, .tl_repair_loop
    call bitmap_light_repair_halo
    jp bitmap_light_op_dim    ; restore the caller's fill

; ------------------------------------------------------------
; FUNCTION: bitmap_light_repair_halo
; ------------------------------------------------------------
; PURPOSE:
;   Same idea as the mushroom repair, for the player's own halo — but only
;   while bitmap_light_protect is set. It is set exactly once: when an eaten
;   mushroom's glow is put out under the player's feet, which would otherwise
;   punch a hole in the halo he is standing in. It must NOT be set during halo
;   movement: there the dimmed strip is the one the halo is leaving behind, and
;   protecting it would freeze the light in place.
;
; INPUT:
;   bitmap_light_srx / _sry / _srw / _srh = the rectangle that was just dimmed.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_repair_halo:
    ld a, (bitmap_light_protect)
    or a
    ret z
    ld hl, (bitmap_light_bands_ptr)
    ld b, 5
.tl_rhalo_band:
    push bc
    ld a, (bitmap_light_y)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ty0), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_th), a
    inc hl
    ld a, (bitmap_light_x)
    sub (hl)
    ld (bitmap_light_tx0), a
    ld a, (hl)
    add a, a
    ld (bitmap_light_tw), a
    inc hl
    call bitmap_light_intersect
    jr z, .tl_rhalo_next
    call bitmap_light_op_lit
    call bitmap_light_rect    ; preserves BC and HL: no stack needed here
.tl_rhalo_next:
    pop bc
    djnz .tl_rhalo_band
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_submit
; ------------------------------------------------------------
; PURPOSE:
;   Rectangle entry point used by every pass once mushrooms exist: submit it,
;   then repair the mushroom glows if it was a dim.
;
; DESTROYS: AF, E.  PRESERVES: BC, D, HL, IX, IY (bitmap_light_rect's contract).
; ------------------------------------------------------------
bitmap_light_submit:
    call bitmap_light_rect
    ld a, (bitmap_light_op_clr)
    cp #08                    ; #08 = OR fill, the one that puts light out
    ret nz
    push bc
    push de
    push hl
    call bitmap_light_repair
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_sfx_eat
; ------------------------------------------------------------
; PURPOSE:
;   Short PSG blip when a mushroom is eaten (fire-and-forget writes, channel C,
;   same envelope recipe as the other bitmap-room blips).
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_light_sfx_eat:
    ld hl, bitmap_light_sfx_eat_data
    ld b, 7
.tl_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .tl_sfx_loop
    ld a, #20                 ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_light_sfx_eat_data:
    db 7,#3B,4,#48,5,#00,11,#60,12,#00,10,#10,13,#09

; ------------------------------------------------------------
; FUNCTION: bitmap_light_load_stage
; ------------------------------------------------------------
; PURPOSE:
;   Cache the current decay stage's descriptor (band table, both step tables and
;   the horizontal clamp) so the halo passes read RAM instead of re-indexing ROM
;   on every rectangle.
;
; INPUT:   bitmap_light_stage.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_load_stage:
    ld a, (bitmap_light_stage)
    ld l, a
    ld h, 0
    add hl, hl                ; 10-byte records: x2
    ld d, h
    ld e, l
    add hl, hl                ; x4
    add hl, hl                ; x8
    add hl, de                ; x10
    ld de, bitmap_light_stage_table
    add hl, de
    ld de, bitmap_light_bands_ptr
    ld bc, 10
    ldir
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_ring_pass
; ------------------------------------------------------------
; PURPOSE:
;   Paint the ring between one stage and the next with the selected fill: the
;   two side strips of every band, placed against the current halo centre. Same
;   table both ways — dim it to shrink, light it to grow back after eating.
;
; INPUT:
;   A = stage index the ring belongs to (0 = between stage 0 and 1), fill
;   already selected.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_ring_pass:
    ld e, a
    ld d, 0
    ld hl, bitmap_light_ring_count_table
    add hl, de
    ld b, (hl)
    ld hl, bitmap_light_ring_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.tl_ring_loop:
    ld a, (bitmap_light_y)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ry), a
    inc hl
    ld a, (bitmap_light_x)
    add a, (hl)               ; + signed column offset
    ld (bitmap_light_rx), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_rh), a
    inc hl
    call bitmap_light_submit            ; preserves B and HL, so the loop needs no stack
    djnz .tl_ring_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_extinguish
; ------------------------------------------------------------
; PURPOSE:
;   The glow dies: dim what is left of the halo (the repair pass gives back any
;   mushroom light underneath) and leave the room to the mushrooms.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_extinguish:
    xor a
    ld (bitmap_light_on), a
    call bitmap_light_op_dim
    call bitmap_light_draw_bands
    call bitmap_mush_regenerate_eaten ; glow time ended: grow eaten mushrooms back
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_refill
; ------------------------------------------------------------
; PURPOSE:
;   A mushroom was eaten: the tail glows again at full size with a full timer.
;   When it was already glowing the halo grows back through the ring tables
;   (cheaper and steadier than repainting the whole blob).
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_refill:
    ld a, (bitmap_light_on)
    or a
    jp z, .tl_refill_cold
    ld a, (bitmap_light_stage)
    or a
    jp z, .tl_refill_timer    ; already at full size
    call bitmap_light_op_lit
.tl_refill_grow:
    ld a, (bitmap_light_stage)
    dec a
    ld (bitmap_light_stage), a
    call bitmap_light_ring_pass       ; A = the ring we shrank through
    ld a, (bitmap_light_stage)
    or a
    jp nz, .tl_refill_grow
    call bitmap_light_load_stage
    jp .tl_refill_timer
.tl_refill_cold:
    xor a
    ld (bitmap_light_stage), a
    call bitmap_light_load_stage
    ld a, 1
    ld (bitmap_light_on), a
    call bitmap_light_target
    ld a, (bitmap_light_tx)
    ld (bitmap_light_x), a
    ld a, (bitmap_light_ty)
    ld (bitmap_light_y), a
    call bitmap_light_op_lit
    call bitmap_light_draw_bands
.tl_refill_timer:
    ld hl, 500
    ld (bitmap_light_timer), hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_tick
; ------------------------------------------------------------
; PURPOSE:
;   Burn one frame of glow. When a stage runs out the halo drops to the next
;   size (one ring dimmed, ~1300 px) and, past the last one, goes out.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_tick:
    ld hl, (bitmap_light_timer)
    dec hl
    ld (bitmap_light_timer), hl
    ld a, h
    or l
    ret nz
    ld a, (bitmap_light_stage)
    cp 2
    jp nc, bitmap_light_extinguish    ; last stage burnt out: darkness
    call bitmap_light_op_dim
    ld a, (bitmap_light_stage)
    call bitmap_light_ring_pass       ; dim the ring this stage loses
    ld a, (bitmap_light_stage)
    inc a
    ld (bitmap_light_stage), a
    call bitmap_light_load_stage
    ld hl, 500
    ld (bitmap_light_timer), hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_player_overlaps
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 mushroom cell.
;
; INPUT:   D = cell X in room pixels, E = cell Y in room pixels (top-left).
; OUTPUT:  A = 1 and NZ when overlapping; A = 0 and Z when separated.
; DESTROYS: AF, B.  PRESERVES: C, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_mush_player_overlaps:
    ld a, (player_x)
    add a, 11
    cp d
    jp c, .tl_eat_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
    add a, 3
    cp b
    jp z, .tl_eat_x_ok
    jp nc, .tl_eat_no
.tl_eat_x_ok:
    ld a, (player_y)
    add a, 31
    cp e
    jp c, .tl_eat_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
    add a, 3
    cp b
    jp z, .tl_eat_yes
    jp nc, .tl_eat_no
.tl_eat_yes:
    ld a, 1
    or a
    ret
.tl_eat_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_eat_scan
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame mushroom scan: stepping on an uneaten mushroom puts its own glow
;   out (the alien ate it) and feeds the tail back to full size.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_eat_scan:
    ld a, (bitmap_composition_state)
    or a
    ret nz                    ; room transition in progress: nothing to eat
    call bitmap_mush_room_table
    ret z
.tl_eat_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    ld a, (hl)
    inc hl
    ld d, a                   ; cell X (room pixels)
    ld (bitmap_mush_ex), a
    ld a, (hl)
    inc hl
    ld e, a                   ; cell Y (room pixels)
    ld (bitmap_mush_ey), a
    ld a, (hl)                ; flag index
    inc hl
    inc hl                    ; skip atlas source X
    inc hl                    ; skip atlas source Y low/high
    inc hl
    push hl
    push de
    call bitmap_mush_eaten
    pop de
    jp nz, .tl_eat_next
    call bitmap_mush_player_overlaps
    or a
    jp z, .tl_eat_next
    ; EATEN: latch the flag first, so the repair pass below stops protecting
    ; this glow and the dim really takes it out.
    pop hl
    pop bc
    ld de, -4                 ; next record -> flag index in this 8-byte record
    add hl, de
    ld a, (hl)
    ld e, a
    ld d, 0
    push hl
    ld hl, bitmap_mush_flags
    add hl, de
    ld (hl), 1
    pop hl
    ; The player is standing in this glow: protect his halo while it goes out,
    ; or the dim would punch a hole in the light he is carrying.
    ld a, (bitmap_light_on)
    ld (bitmap_light_protect), a
    call bitmap_light_op_dim
    call bitmap_mush_draw_glow
    xor a
    ld (bitmap_light_protect), a
    call bitmap_light_refill
    call bitmap_mush_erase_tile       ; the mushroom is gone, not just dark
    call bitmap_light_sfx_eat
    ret                       ; one mushroom per frame is plenty
.tl_eat_next:
    pop hl
    pop bc
    dec b
    jp nz, .tl_eat_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame halo maintenance. Costs a handful of thin rectangles while the
;   player walks; a full repaint only happens if the halo was never painted.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; SIDE EFFECTS:
;   Writes the displayed page through the V9938 command engine and restores
;   R#15 to S#0 on the way out.
; ------------------------------------------------------------
bitmap_light_update:
    call bitmap_light_room_is_dark
    ret z
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    ld a, (bitmap_light_active)
    or a
    jp z, .repaint
    call bitmap_light_eat_scan        ; mushrooms feed the tail
    ld a, (bitmap_light_on)
    or a
    jp z, bitmap_light_restore_status  ; tail dark: nothing follows the player
    call bitmap_light_tick            ; burn a frame of glow, shrink or die out
    ld a, (bitmap_light_on)
    or a
    jp z, bitmap_light_restore_status  ; it just went out
    call bitmap_light_target
    call bitmap_light_shift_x
    call bitmap_light_shift_y
    jp bitmap_light_restore_status
.repaint:
    call bitmap_light_paint_full
    jp bitmap_light_restore_status

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_update
; ------------------------------------------------------------
; PURPOSE:
;   Drag a 32x24 halo along with the live bullet, so a shot lights the room in
;   the direction it travels. Only the two strips that actually change are
;   repainted: the leading one is lit, the trailing one is dimmed.
;
;   The dim goes through bitmap_light_submit with bitmap_light_protect set, so it
;   repairs the mushroom glows AND the player's own halo instead of punching
;   holes in them. The flag is raised and lowered inside this routine, and the
;   player halo is moved by a different call, so the two never interleave --
;   protecting during halo movement would freeze the light in place.
;
; INPUT:   bullet pool at bitmap_bullet_pool, bitmap_light_* state.
; OUTPUT:  VRAM fills; bitmap_bl_on/_x/_y track the painted footprint.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_bullet_light_update:
    call bitmap_light_room_is_dark
    jp z, .bl_forget            ; normal room: the repaint already took it away
    ld a, (bitmap_light_active)
    or a
    jp z, .bl_forget
    ld a, (bitmap_light_on)
    or a
    jp z, .bl_drop              ; tail out: take the lantern down too
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    ld ix, bitmap_bullet_pool
    ld b, 1
.bl_scan:
    ld a, (ix+0)
    or a
    jp nz, .bl_live
    inc ix
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .bl_scan
.bl_drop:
    ; No bullet left: dim the footprint we painted and forget it.
    ld a, (bitmap_bl_on)
    or a
    ret z
    xor a
    ld (bitmap_bl_on), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    ld a, (bitmap_bl_x)
    ld d, a
    ld a, (bitmap_bl_y)
    ld e, a
    call bitmap_bullet_light_dim_full
    jp bitmap_light_restore_status
.bl_forget:
    xor a
    ld (bitmap_bl_on), a
    ret
.bl_live:
    ; Centre of the bullet sprite, clamped so the rectangle stays in the band.
    ld a, (ix+1)
    add a, 8
    cp 16
    jp nc, .bl_x_lo_ok
    ld a, 16
.bl_x_lo_ok:
    cp 240
    jp c, .bl_x_hi_ok
    ld a, 239
.bl_x_hi_ok:
    ld d, a
    ld a, (ix+2)
    add a, 28
    cp 32
    jp nc, .bl_y_lo_ok
    ld a, 32
.bl_y_lo_ok:
    cp 201
    jp c, .bl_y_hi_ok
    ld a, 200
.bl_y_hi_ok:
    ld e, a
    ld a, (bitmap_bl_on)
    or a
    jp nz, .bl_shift
    ; First frame of this shot: light the whole footprint.
    ld a, 1
    ld (bitmap_bl_on), a
    ld a, d
    ld (bitmap_bl_x), a
    ld a, e
    ld (bitmap_bl_y), a
    call bitmap_bullet_light_set_rect
    call bitmap_light_op_lit
    call bitmap_light_rect
    jp bitmap_light_restore_status
.bl_shift:
    ; Exactly one axis moves (dir is latched at spawn and the clamp on the other
    ; axis is constant), so test X first and fall through to Y.
    ld a, (bitmap_bl_x)
    ld c, a
    ld a, d
    sub c                       ; A = newCX - oldCX
    jp z, .bl_shift_y
    ld a, d
    ld (bitmap_bl_x), a
    ld a, d
    sub c
    jp c, .bl_shift_left
    ld b, a                     ; B = strip width, moved right
    ; trailing column leaves at oldCX - hw
    ld a, c
    sub 16
    ld (bitmap_light_rx), a
    jp .bl_shift_x_common
.bl_shift_left:
    neg
    ld b, a                     ; B = strip width, moved left
    ; trailing column leaves at oldCX + hw - width
    ld a, c
    add a, 16
    sub b
    ld (bitmap_light_rx), a
.bl_shift_x_common:
    ld a, b
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, e
    sub 12
    ld (bitmap_light_ry), a
    ld a, 24
    ld (bitmap_light_rh), a
    push de
    push bc
    call bitmap_bullet_light_dim_submit
    pop bc
    pop de
    ; leading column arrives on the new side
    ld a, d
    sub c                       ; sign again: which side did it enter from
    jp c, .bl_lead_left
    ld a, d
    add a, 16
    sub b
    jp .bl_lead_common
.bl_lead_left:
    ld a, d
    sub 16
.bl_lead_common:
    ld (bitmap_light_rx), a
    ld a, b
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, e
    sub 12
    ld (bitmap_light_ry), a
    ld a, 24
    ld (bitmap_light_rh), a
    call bitmap_light_op_lit
    call bitmap_light_rect
    jp bitmap_light_restore_status
.bl_shift_y:
    ld a, (bitmap_bl_y)
    ld c, a
    ld a, e
    sub c                       ; A = newCY - oldCY
    ret z                       ; clamped still: nothing changed
    ld a, e
    ld (bitmap_bl_y), a
    ld a, e
    sub c
    jp c, .bl_shift_up
    ld b, a                     ; moved down
    ld a, c
    sub 12
    jp .bl_shift_y_common
.bl_shift_up:
    neg
    ld b, a                     ; moved up
    ld a, c
    add a, 12
    sub b
.bl_shift_y_common:
    ld (bitmap_light_ry), a
    ld a, b
    ld (bitmap_light_rh), a
    ld a, d
    sub 16
    ld (bitmap_light_rx), a
    ld a, 32
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    push de
    push bc
    call bitmap_bullet_light_dim_submit
    pop bc
    pop de
    ; leading row arrives on the new side
    ld a, e
    sub c
    jp c, .bl_lead_up
    ld a, e
    add a, 12
    sub b
    jp .bl_lead_y_common
.bl_lead_up:
    ld a, e
    sub 12
.bl_lead_y_common:
    ld (bitmap_light_ry), a
    ld a, b
    ld (bitmap_light_rh), a
    ld a, d
    sub 16
    ld (bitmap_light_rx), a
    ld a, 32
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    call bitmap_light_op_lit
    call bitmap_light_rect
    jp bitmap_light_restore_status

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_dim_submit
; ------------------------------------------------------------
; PURPOSE:
;   Dim the rectangle already loaded in bitmap_light_r*, repairing both the
;   mushroom glows and the player's halo. The protect flag is raised only for
;   this single fill.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_bullet_light_dim_submit:
    call bitmap_light_op_dim
    ld a, 1
    ld (bitmap_light_protect), a
    call bitmap_light_submit
    xor a
    ld (bitmap_light_protect), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_dim_full
; ------------------------------------------------------------
; PURPOSE:
;   Take the whole lantern footprint down (bullet died / tail went out).
; INPUT: D = centre X, E = centre Y.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_bullet_light_dim_full:
    call bitmap_bullet_light_set_rect
    jp bitmap_bullet_light_dim_submit

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_set_rect
; ------------------------------------------------------------
; PURPOSE: Load bitmap_light_r* with the full 32x24 lantern around D,E.
; INPUT: D = centre X, E = centre Y (both already clamped).
; DESTROYS: AF. PRESERVES: BC, DE, HL.
; ------------------------------------------------------------
bitmap_bullet_light_set_rect:
    ld a, d
    sub 16
    ld (bitmap_light_rx), a
    ld a, 32
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, e
    sub 12
    ld (bitmap_light_ry), a
    ld a, 24
    ld (bitmap_light_rh), a
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
    ; --- upload frameCount*2 pattern groups -> VRAM #FC00 (group 32+) ---
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
    ld de, #FC00
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
; PURPOSE: Writes the 1 fixed enemy SAT slot(s) at VRAM #F610
;   (right after the player layers, overwriting the player writer's
;   terminator), then appends a #D8 terminator. Unused slots get an
;   off-screen Y=#D4 sprite so the VDP keeps scanning. When the shoot
;   skill is active its bullet writer runs AFTER this and overwrites our
;   terminator in turn. Also refreshes each active slot's line-colour table for
;   its current animation frame before opening the SAT write stream.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool.
; OUTPUT: SAT entries at VRAM #F610..#F617.
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
    add a, #80
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
; OUTPUT: bitmap_platform_count/rider/pool + VRAM pattern groups 32..33.
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
    ; A dark room must already be dim on its first displayed frame: deciding this
    ; only in the per-frame refresh painted one bright frame before dimming.
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_light_room_flags
    add hl, de
    ld a, (hl)
    or a
    jp z, .bplat_slot_0_lit_room   ; A = 0 = authored palette
    ld a, 1                   ; dark room: start on the dim twin
.bplat_slot_0_lit_room:
    ld (bitmap_platform_light_state + 0), a
    ; --- upload widthCells pattern groups -> VRAM #FC00 (group 32+) ---
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
    ld de, #FC00
    call copy_to_vram_ext
    ; --- upload widthCells 16-byte colour tables -> VRAM #F450 ---
    ld a, (bitmap_platform_light_state + 0)
    or a
    ld a, (ix+10)             ; colorOff, in 16-byte blocks (LD keeps the flags)
    jp z, .bplat_slot_0_colors_authored
    call bitmap_platform_colors_dim_offset
    jp .bplat_slot_0_colors_ready
.bplat_slot_0_colors_authored:
    call bitmap_platform_colors_offset
.bplat_slot_0_colors_ready:
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
    ld de, #F450
    call copy_to_vram_ext
.bplat_slot_0_done:
    ld de, 11
    add ix, de
.bplat_slot_1:
    ld a, (bitmap_platform_count)
    cp 2
    jp c, .bplat_slot_1_done      ; slot unused in this room
    push ix
    pop hl
    ld de, bitmap_platform_pool + 11
    ld bc, 9
    ldir                      ; x..widthCells
    xor a
    ld (bitmap_platform_pool + 11 + 9), a   ; movedX = 0
    ld (bitmap_platform_pool + 11 + 10), a  ; movedY = 0
    ; A dark room must already be dim on its first displayed frame: deciding this
    ; only in the per-frame refresh painted one bright frame before dimming.
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_light_room_flags
    add hl, de
    ld a, (hl)
    or a
    jp z, .bplat_slot_1_lit_room   ; A = 0 = authored palette
    ld a, 1                   ; dark room: start on the dim twin
.bplat_slot_1_lit_room:
    ld (bitmap_platform_light_state + 1), a
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
    ld a, (bitmap_platform_light_state + 1)
    or a
    ld a, (ix+10)             ; colorOff, in 16-byte blocks (LD keeps the flags)
    jp z, .bplat_slot_1_colors_authored
    call bitmap_platform_colors_dim_offset
    jp .bplat_slot_1_colors_ready
.bplat_slot_1_colors_authored:
    call bitmap_platform_colors_offset
.bplat_slot_1_colors_ready:
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
.bplat_slot_1_done:
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
.plat_carry_ground:
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
; FUNCTION: bitmap_platform_refresh_light_colors
; ------------------------------------------------------------
; PURPOSE: Select authored colours in normal rooms, dim palette twins in a dark
;   room, and bright twins while each platform centre overlaps the player halo.
;   Uploads only slots whose cached state changed.
; INPUT: platform pool + bitmap lighting state.
; OUTPUT: changed platform colour-table blocks in VRAM.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_light_sprite_point_is_lit, bitmap_platform_colors_*_offset,
;   copy_to_vram_ext.
; SIDE EFFECTS: updates bitmap_platform_light_state.
; ------------------------------------------------------------
bitmap_platform_refresh_light_colors:
    push bc
    push de
    push hl
    push ix
    ld a, (bitmap_platform_count)
    cp 1
    jp c, .bplat_light_slot_0_done
    ld ix, bitmap_platform_pool + 0
    ld a, (bitmap_light_active)
    or a
    jp nz, .bplat_light_slot_0_halo_check
    ; Halo inactive: check if room is dark
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_light_room_flags
    add hl, de
    ld a, (hl)
    or a
    ld c, 1                   ; dark room → dim by default
    jp nz, .bplat_light_slot_0_state_ready
    ld c, 0                   ; lit room → authored palette
    jp .bplat_light_slot_0_state_ready
.bplat_light_slot_0_halo_check:
    ld a, (ix+8)              ; widthCells * 8 = horizontal centre offset
    add a, a
    add a, a
    add a, a
    add a, (ix+0)
    jp nc, .bplat_light_slot_0_center_x_ready
    ld a, #FF                 ; partially off-screen platform: clamp its centre
.bplat_light_slot_0_center_x_ready:
    ld d, a
    ld a, (ix+1)
    add a, 28
    ld e, a                   ; vertical centre in SCREEN 5 coordinates
    call bitmap_light_sprite_point_is_lit
    ld c, 1                   ; dark room, outside halo = dim twin
    jp z, .bplat_light_slot_0_state_ready
    inc c                     ; inside halo = bright twin
.bplat_light_slot_0_state_ready:
    ld a, (bitmap_platform_light_state + 0)
    cp c
    jp z, .bplat_light_slot_0_done
    ld a, c
    ld (bitmap_platform_light_state + 0), a
    or a
    jp z, .bplat_light_slot_0_source_authored
    dec a
    jp z, .bplat_light_slot_0_source_dim
    ld a, (ix+10)
    call bitmap_platform_colors_lit_offset
    jp .bplat_light_slot_0_source_ready
.bplat_light_slot_0_source_dim:
    ld a, (ix+10)
    call bitmap_platform_colors_dim_offset
    jp .bplat_light_slot_0_source_ready
.bplat_light_slot_0_source_authored:
    ld a, (ix+10)
    call bitmap_platform_colors_offset
.bplat_light_slot_0_source_ready:
    ld a, (ix+8)
    ld c, a
    ld b, 0
    sla c
    rl b
    sla c
    rl b
    sla c
    rl b
    sla c
    rl b                      ; BC = widthCells * 16
    ld de, #F450
    call copy_to_vram_ext
.bplat_light_slot_0_done:
    ld a, (bitmap_platform_count)
    cp 2
    jp c, .bplat_light_slot_1_done
    ld ix, bitmap_platform_pool + 11
    ld a, (bitmap_light_active)
    or a
    jp nz, .bplat_light_slot_1_halo_check
    ; Halo inactive: check if room is dark
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_light_room_flags
    add hl, de
    ld a, (hl)
    or a
    ld c, 1                   ; dark room → dim by default
    jp nz, .bplat_light_slot_1_state_ready
    ld c, 0                   ; lit room → authored palette
    jp .bplat_light_slot_1_state_ready
.bplat_light_slot_1_halo_check:
    ld a, (ix+8)              ; widthCells * 8 = horizontal centre offset
    add a, a
    add a, a
    add a, a
    add a, (ix+0)
    jp nc, .bplat_light_slot_1_center_x_ready
    ld a, #FF                 ; partially off-screen platform: clamp its centre
.bplat_light_slot_1_center_x_ready:
    ld d, a
    ld a, (ix+1)
    add a, 28
    ld e, a                   ; vertical centre in SCREEN 5 coordinates
    call bitmap_light_sprite_point_is_lit
    ld c, 1                   ; dark room, outside halo = dim twin
    jp z, .bplat_light_slot_1_state_ready
    inc c                     ; inside halo = bright twin
.bplat_light_slot_1_state_ready:
    ld a, (bitmap_platform_light_state + 1)
    cp c
    jp z, .bplat_light_slot_1_done
    ld a, c
    ld (bitmap_platform_light_state + 1), a
    or a
    jp z, .bplat_light_slot_1_source_authored
    dec a
    jp z, .bplat_light_slot_1_source_dim
    ld a, (ix+10)
    call bitmap_platform_colors_lit_offset
    jp .bplat_light_slot_1_source_ready
.bplat_light_slot_1_source_dim:
    ld a, (ix+10)
    call bitmap_platform_colors_dim_offset
    jp .bplat_light_slot_1_source_ready
.bplat_light_slot_1_source_authored:
    ld a, (ix+10)
    call bitmap_platform_colors_offset
.bplat_light_slot_1_source_ready:
    ld a, (ix+8)
    ld c, a
    ld b, 0
    sla c
    rl b
    sla c
    rl b
    sla c
    rl b
    sla c
    rl b                      ; BC = widthCells * 16
    ld de, #F460
    call copy_to_vram_ext
.bplat_light_slot_1_done:
    pop ix
    pop hl
    pop de
    pop bc
    ret

; HL = dim/bright platform colour table + A*16 (A = colour block offset).
bitmap_platform_colors_dim_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_platform_sprite_colors_dim
    add hl, de
    ret

bitmap_platform_colors_lit_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_platform_sprite_colors_lit
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_platform_sat
; ------------------------------------------------------------
; PURPOSE: Writes the 2 fixed platform SAT slot(s) at VRAM #F614
;   (right after the enemy block, overwriting the previous writer's
;   terminator), then appends a #D8 terminator. Unused slots/cells get an
;   off-screen Y=#D4 sprite so the VDP keeps scanning. The bullet
;   writer (when the shoot skill is active) runs AFTER this and overwrites our
;   terminator in turn. Platform colours are refreshed first when a slot crosses the halo.
; INPUT: bitmap_platform_count, bitmap_platform_pool.
; OUTPUT: SAT entries at VRAM #F614..#F61F.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_update_platform_sat:
    call bitmap_platform_refresh_light_colors
    push de
    ld de, #F614
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
    ld a, #80
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
.sat_slot_1_0:
    ld a, (bitmap_platform_count)
    cp 2
    jp c, .sat_slot_1_0_hidden
    ld a, (bitmap_platform_pool + 11 + 1)
    add a, 20
    out (VDP_DATA_PORT), a    ; Y
    ld a, (bitmap_platform_pool + 11)
    out (VDP_DATA_PORT), a    ; X (cell 0)
    ld a, #84
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_1_0_end
.sat_slot_1_0_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_1_0_end:
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
    ; Preserve the caller's message pointer: the VDP command launcher advances
    ; HL while uploading the clear command, so without this save the routine
    ; would read the message from the command buffer and leave a blank screen
    ; while bitmap_end_wait_key waits forever.
    push hl
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
    pop hl
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
    ; Do not gate the terminal input on the VDP frame flag.  Some MSX2 BIOS/VDP
    ; combinations leave S#0 without bit 7 while the command engine is idle;
    ; the End screen must still be dismissible in that state.
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    bit 0, a
    jp z, bitmap_end_wait_key
    ret

bitmap_end_wait_frames:
    ; B = frame count. Keep the same bounded VDP polling fallback used by the
    ; gameplay loop, but do not require a keyboard event when waitForKey=false.
.end_wait_frames_loop:
    push bc
    call bitmap_wait_vblank
    pop bc
    djnz .end_wait_frames_loop
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
    DB #00,#00,#00,#00,#33,#03,#55,#05,#53,#06,#50,#06,#63,#06,#77,#07
    DB #00,#00,#00,#00,#00,#00,#11,#01,#02,#03,#20,#03,#31,#03,#33,#03

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

; Room dispatch tables are emitted in the resident window above.

; Room 0 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_0:
    DB #30,#A0,#00,#01,#20,#00,#10,#02,#30,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#A0,#01,#01,#20,#00,#10,#02,#40,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#40,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#90,#02,#01,#20,#00,#10,#02,#B0,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#E0,#90,#03,#01,#20,#00,#10,#02,#E0,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#E0,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#60,#04,#01,#20,#00,#10,#02
    DB #90,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#30,#05,#01,#20,#00
    DB #10,#02,#70,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#70,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 1 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_1:
    DB #E0,#20,#06,#00,#F0,#00,#00,#02,#E0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#10,#07,#00,#10,#00,#10,#02,#20,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#20,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0
; Room 2 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_2:
; Room 3 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_3:
; Room 4 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_4:
; Room 5 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_5:
; Room 6 pickup records: x,y,flagOffset,class(0 gem/1 nut),drawCmd(15),eraseCmd(15)
bitmap_gems_room_6:
bitmap_gem_ptr_table:
    DW bitmap_gems_room_0
    DW bitmap_gems_room_1
    DW bitmap_gems_room_2
    DW bitmap_gems_room_3
    DW bitmap_gems_room_4
    DW bitmap_gems_room_5
    DW bitmap_gems_room_6
bitmap_gem_count_table:
    DB 6,2,0,0,0,0,0
; Room 0 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_0:
    DB #A0,#60,#00,#D0,#00,#00,#02,#A0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0
; Room 1 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_1:
; Room 2 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_2:
; Room 3 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_3:
; Room 4 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_4:
; Room 5 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_5:
; Room 6 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_6:
bitmap_heal_ptr_table:
    DW bitmap_heals_room_0
    DW bitmap_heals_room_1
    DW bitmap_heals_room_2
    DW bitmap_heals_room_3
    DW bitmap_heals_room_4
    DW bitmap_heals_room_5
    DW bitmap_heals_room_6
bitmap_heal_count_table:
    DB 1,0,0,0,0,0,0

bitmap_light_room_flags:
    DB 1,1,1,1,1,0,0    ; 1 = dark room (the player is the only light source)

bitmap_light_bands_0:    ; stage 0: signed Y offset, height, half width
    DB #E0, 8, 20
    DB #E8, 8, 30
    DB #F0, 32, 40
    DB #10, 8, 30
    DB #18, 8, 20

bitmap_light_step_down_0:
    ; row offset, column offset, width, 1 = light / 0 = dim; rect at cy + yOff
    DB #E0, #EC, 40, 0
    DB #E8, #E2, 10, 0
    DB #E8, #14, 10, 0
    DB #F0, #D8, 10, 0
    DB #F0, #1E, 10, 0
    DB #10, #D8, 10, 1
    DB #10, #1E, 10, 1
    DB #18, #E2, 10, 1
    DB #18, #14, 10, 1
    DB #20, #EC, 40, 1

bitmap_light_step_up_0:
    ; row offset, column offset, width, 1 = light / 0 = dim; rect at cy + yOff - d
    DB #E0, #EC, 40, 1
    DB #E8, #E2, 10, 1
    DB #E8, #14, 10, 1
    DB #F0, #D8, 10, 1
    DB #F0, #1E, 10, 1
    DB #10, #D8, 10, 0
    DB #10, #1E, 10, 0
    DB #18, #E2, 10, 0
    DB #18, #14, 10, 0
    DB #20, #EC, 40, 0

bitmap_light_bands_1:    ; stage 1: signed Y offset, height, half width
    DB #E0, 8, 12
    DB #E8, 8, 20
    DB #F0, 32, 28
    DB #10, 8, 20
    DB #18, 8, 12

bitmap_light_step_down_1:
    ; row offset, column offset, width, 1 = light / 0 = dim; rect at cy + yOff
    DB #E0, #F4, 24, 0
    DB #E8, #EC, 8, 0
    DB #E8, #0C, 8, 0
    DB #F0, #E4, 8, 0
    DB #F0, #14, 8, 0
    DB #10, #E4, 8, 1
    DB #10, #14, 8, 1
    DB #18, #EC, 8, 1
    DB #18, #0C, 8, 1
    DB #20, #F4, 24, 1

bitmap_light_step_up_1:
    ; row offset, column offset, width, 1 = light / 0 = dim; rect at cy + yOff - d
    DB #E0, #F4, 24, 1
    DB #E8, #EC, 8, 1
    DB #E8, #0C, 8, 1
    DB #F0, #E4, 8, 1
    DB #F0, #14, 8, 1
    DB #10, #E4, 8, 0
    DB #10, #14, 8, 0
    DB #18, #EC, 8, 0
    DB #18, #0C, 8, 0
    DB #20, #F4, 24, 0

bitmap_light_bands_2:    ; stage 2: signed Y offset, height, half width
    DB #E0, 8, 6
    DB #E8, 8, 10
    DB #F0, 32, 16
    DB #10, 8, 10
    DB #18, 8, 6

bitmap_light_step_down_2:
    ; row offset, column offset, width, 1 = light / 0 = dim; rect at cy + yOff
    DB #E0, #FA, 12, 0
    DB #E8, #F6, 4, 0
    DB #E8, #06, 4, 0
    DB #F0, #F0, 6, 0
    DB #F0, #0A, 6, 0
    DB #10, #F0, 6, 1
    DB #10, #0A, 6, 1
    DB #18, #F6, 4, 1
    DB #18, #06, 4, 1
    DB #20, #FA, 12, 1

bitmap_light_step_up_2:
    ; row offset, column offset, width, 1 = light / 0 = dim; rect at cy + yOff - d
    DB #E0, #FA, 12, 1
    DB #E8, #F6, 4, 1
    DB #E8, #06, 4, 1
    DB #F0, #F0, 6, 1
    DB #F0, #0A, 6, 1
    DB #10, #F0, 6, 0
    DB #10, #0A, 6, 0
    DB #18, #F6, 4, 0
    DB #18, #06, 4, 0
    DB #20, #FA, 12, 0

bitmap_light_stage_table:
    ; per stage: bands, step-down table + count, step-up table + count, cx clamp
    DW bitmap_light_bands_0
    DW bitmap_light_step_down_0
    DB 10
    DW bitmap_light_step_up_0
    DB 10
    DB 40, 216
    DW bitmap_light_bands_1
    DW bitmap_light_step_down_1
    DB 10
    DW bitmap_light_step_up_1
    DB 10
    DB 28, 228
    DW bitmap_light_bands_2
    DW bitmap_light_step_down_2
    DB 10
    DW bitmap_light_step_up_2
    DB 10
    DB 16, 240

bitmap_light_ring_0:    ; ring between stage 0 and stage 1
    ; row offset, column offset, width, height
    DB #E0, #EC, 8, 8
    DB #E0, #0C, 8, 8
    DB #E8, #E2, 10, 8
    DB #E8, #14, 10, 8
    DB #F0, #D8, 12, 32
    DB #F0, #1C, 12, 32
    DB #10, #E2, 10, 8
    DB #10, #14, 10, 8
    DB #18, #EC, 8, 8
    DB #18, #0C, 8, 8

bitmap_light_ring_1:    ; ring between stage 1 and stage 2
    ; row offset, column offset, width, height
    DB #E0, #F4, 6, 8
    DB #E0, #06, 6, 8
    DB #E8, #EC, 10, 8
    DB #E8, #0A, 10, 8
    DB #F0, #E4, 12, 32
    DB #F0, #10, 12, 32
    DB #10, #EC, 10, 8
    DB #10, #0A, 10, 8
    DB #18, #F4, 6, 8
    DB #18, #06, 6, 8

bitmap_light_ring_ptr_table:
    DW bitmap_light_ring_0
    DW bitmap_light_ring_1
bitmap_light_ring_count_table:
    DB 10,10
bitmap_mush_room_0:    ; glow X/Y, cell X/Y, flag, atlas source X/Y (8 bytes)
    DB 216, 172, 208, 144, 0, 16, 0, 2
bitmap_mush_room_1:    ; no mushrooms in this room
bitmap_mush_room_2:    ; no mushrooms in this room
bitmap_mush_room_3:    ; glow X/Y, cell X/Y, flag, atlas source X/Y (8 bytes)
    DB 232, 76, 224, 48, 0, 16, 0, 2
bitmap_mush_room_4:    ; no mushrooms in this room
bitmap_mush_room_5:    ; no mushrooms in this room
bitmap_mush_room_6:    ; no mushrooms in this room
bitmap_mush_ptr_table:
    DW bitmap_mush_room_0
    DW bitmap_mush_room_1
    DW bitmap_mush_room_2
    DW bitmap_mush_room_3
    DW bitmap_mush_room_4
    DW bitmap_mush_room_5
    DW bitmap_mush_room_6
bitmap_mush_count_table:
    DB 1,0,0,1,0,0,0

bitmap_mush_bands:
    ; signed Y offset from the mushroom centre, height, half width
    DB #F0, 8, 16
    DB #F8, 16, 24
    DB #08, 8, 16

bitmap_mush_bg_table:
    ; room backdrop colour used to wipe an eaten mushroom's tile. Forced into
    ; 0..7: in a dark room the 8..15 half of the palette is the dimmed twin, and
    ; the wiped cell is always inside the halo the player just relit.
    DB 1,0,0,0,0,0,0


; Room 0 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_0:
bitmap_crumble_room_0_end:
; Room 1 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_1:
    DB #7C,#08,#7D,#08,#7E,#08
bitmap_crumble_room_1_end:
; Room 2 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_2:
bitmap_crumble_room_2_end:
; Room 3 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_3:
bitmap_crumble_room_3_end:
; Room 4 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_4:
bitmap_crumble_room_4_end:
; Room 5 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_5:
bitmap_crumble_room_5_end:
; Room 6 crumbling cells: cell index, frames per 2px stage
bitmap_crumble_room_6:
bitmap_crumble_room_6_end:
bitmap_crumble_ptr_table:
    DW bitmap_crumble_room_0
    DW bitmap_crumble_room_1
    DW bitmap_crumble_room_2
    DW bitmap_crumble_room_3
    DW bitmap_crumble_room_4
    DW bitmap_crumble_room_5
    DW bitmap_crumble_room_6
bitmap_crumble_count_table:
    DB 0,3,0,0,0,0,0
; Per-room HMMV colour byte ((bg<<4)|bg) the erosion paints the band with.
bitmap_crumble_bg_table:
    DB #11,#00,#00,#00,#00,#00,#00
; Chip velocities per pool slot: vx, vy (signed px/frame; vy gains +1 every 4
; frames up to +3, so the chips tumble apart and rain down).
bitmap_crumble_vel_table:
    DB #FF,#FF, #01,#FF
; crumbling floor: 16x16 chip sprite pattern (mode 2 quadrants)
bitmap_crumble_chip_pattern_data:
    DB #C0,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
bitmap_crumble_chip_pattern_data_end:
; crumbling floor: 16-byte line colour table for the chip
bitmap_crumble_chip_color_data:
    DB #0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E
bitmap_crumble_chip_color_data_end:
; crumbling-floor crunch: 8 PSG register/value pairs. Mixer #1B = channel C
; tone AND noise on (A/B untouched by the music merge), noise period #10, tone
; period #0240, R10 #10 = channel C driven by the hardware envelope, shape #09 =
; one decay. Channel C is the gameplay SFX channel by convention.
bitmap_crumble_sfx_data:
    db 7,#1B, 6,#10, 4,#40, 5,#02, 11,#30, 12,#00, 10,#10, 13,#09



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


; Room 0 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00
; Room 1 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00
; Room 2 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_2:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00
; Room 3 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00
; Room 4 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_4:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00
; Room 5 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_5:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#10,#10,#01,#00
; Room 6 enemies: count + 1 slot(s) x 22 (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane)
bitmap_room_enemy_table_6:
    DB #01,#40,#10,#00,#00,#40,#40,#10,#10,#00,#00,#01,#08,#00,#00,#00
    DB #01,#00,#00,#10,#10,#02,#00
bitmap_room_enemy_ptr_table:
    DW bitmap_room_enemy_table_0
    DW bitmap_room_enemy_table_1
    DW bitmap_room_enemy_table_2
    DW bitmap_room_enemy_table_3
    DW bitmap_room_enemy_table_4
    DW bitmap_room_enemy_table_5
    DW bitmap_room_enemy_table_6
; Enemy sprites: 2 pattern group(s), [right, left] variant pair per frame (mode 2 quadrants)
bitmap_enemy_sprite_patterns:
    DB #3C,#7E,#FF,#FF,#FF,#FF,#7E,#3C,#18,#3C,#7E,#FF,#FF,#7E,#3C,#18
    DB #18,#3C,#7E,#FF,#FF,#7E,#3C,#18,#00,#00,#00,#00,#00,#00,#00,#00
    DB #18,#3C,#7E,#FF,#FF,#7E,#3C,#18,#00,#00,#00,#00,#00,#00,#00,#00
    DB #3C,#7E,#FF,#FF,#FF,#FF,#7E,#3C,#18,#3C,#7E,#FF,#FF,#7E,#3C,#18
; Enemy sprites: 16-byte line colour tables per unique sprite layer frame
bitmap_enemy_sprite_colors:
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F


; Room 0 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#00,#00
; Room 1 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#00,#00
; Room 2 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_2:
    DB #02,#D0,#B0,#FF,#00,#20,#E0,#B0,#B0,#01,#00,#00,#70,#50,#00,#01
    DB #70,#70,#50,#80,#01,#00,#00
; Room 3 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_3:
    DB #01,#E0,#B0,#FF,#00,#20,#E0,#B0,#B0,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#00,#00
; Room 4 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_4:
    DB #01,#D0,#B0,#01,#00,#70,#E0,#B0,#B0,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#00,#00
; Room 5 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_5:
    DB #02,#40,#40,#00,#01,#40,#40,#30,#B0,#01,#00,#00,#80,#90,#01,#00
    DB #50,#80,#90,#90,#01,#00,#00
; Room 6 platforms: count + 2 slot(s) x 11 (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,patOff,colorOff)
bitmap_room_platform_table_6:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#00,#00
bitmap_room_platform_ptr_table:
    DW bitmap_room_platform_table_0
    DW bitmap_room_platform_table_1
    DW bitmap_room_platform_table_2
    DW bitmap_room_platform_table_3
    DW bitmap_room_platform_table_4
    DW bitmap_room_platform_table_5
    DW bitmap_room_platform_table_6
; Platform sprites: 1 pattern group(s) (mode 2 quadrants, frame 0 only)
bitmap_platform_sprite_patterns:
    DB #FF,#FF,#92,#FF,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #FF,#FF,#49,#FF,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Platform sprites: authored 16-byte line colour tables per cell (frame 0 only)
bitmap_platform_sprite_colors:
    DB #0B,#0B,#0B,#0B,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
; Platform sprites: dim palette twins for dark rooms
bitmap_platform_sprite_colors_dim:
    DB #0B,#0B,#0B,#0B,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
; Platform sprites: bright palette twins inside the player halo
bitmap_platform_sprite_colors_lit:
    DB #03,#03,#03,#03,#07,#07,#07,#07,#07,#07,#07,#07,#07,#07,#07,#07



; Sprite 0 line color table (mode 2): configured player sprite "player_jump" + 3 state clip(s)
bitmap_room_sprite_colors:
    DB #0F,#0F,#0F,#0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0F,#0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0B,#0D
    DB #0D,#4D,#4D,#0D,#0D,#0D,#0D,#0D,#0D,#0F,#4D,#0D,#0D,#0D,#0D,#0F
    DB #0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0B,#0B
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0F,#4D,#0D,#0D,#0D,#0F,#0F,#0F,#0D,#0F
    DB #0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0B
    DB #4D,#0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0D,#0B
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0F

bitmap_room_sprite_colors_end:

; Glowing-tail player colours: dim slots 8..15 mapped to intense twins 0..7
bitmap_room_sprite_colors_glowing:
    DB #07,#07,#07,#07,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #07,#07,#07,#07,#05,#05,#05,#05,#05,#05,#05,#05,#05,#45,#45,#45
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#05,#03,#03,#03,#03,#03,#05
    DB #05,#45,#45,#05,#05,#05,#05,#05,#05,#07,#45,#05,#05,#05,#05,#07
    DB #07,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #07,#05,#05,#05,#05,#05,#05,#05,#05,#05,#45,#45,#45,#05,#45,#45
    DB #03,#03,#03,#03,#03,#03,#05,#03,#03,#03,#03,#05,#05,#05,#03,#03
    DB #05,#05,#05,#05,#05,#05,#07,#45,#05,#05,#05,#07,#07,#07,#05,#07
    DB #07,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #07,#07,#05,#05,#05,#05,#05,#05,#05,#05,#05,#45,#45,#45,#05,#45
    DB #03,#03,#03,#03,#03,#03,#03,#05,#03,#03,#03,#03,#05,#05,#05,#03
    DB #45,#05,#05,#05,#05,#05,#05,#07,#07,#05,#05,#05,#07,#07,#07,#07
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #07,#05,#05,#05,#05,#05,#05,#05,#05,#05,#45,#45,#45,#05,#45,#45
    DB #03,#03,#03,#03,#03,#03,#05,#03,#03,#03,#03,#05,#05,#05,#05,#03
    DB #05,#05,#05,#05,#05,#05,#07,#07,#05,#05,#05,#07,#07,#07,#07,#07

bitmap_room_sprite_colors_glowing_end:


; SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing
bitmap_room_sprite_attrs:
    DB #60,#80,#00,#00,#60,#80,#04,#00,#70,#80,#08,#00,#70,#80,#0C,#00
    DB #D8,#00,#00,#00

bitmap_room_sprite_attrs_end:

; Sprite 0 pattern bank lives in a Konami MegaROM data bank (see below), not in the resident 32KB.

; Player animation clip table: id 0 = base idle/walk, ids 1..3 = state
; clips. 3 bytes/entry: frameBase, frameCount, delayFrames. Indexed by player_anim_state.
; 1=IDLE(base 0,2f), 2=WALK(base 2,2f), 3=state_1786125213827(base 0,2f)
bitmap_player_anim_clip_table:
    DB #00,#02,#12,#00,#02,#12,#02,#02,#08,#00,#02,#12


; Shoot skill: 16x16 bullet sprite pattern (mode 2 quadrants)
bitmap_bullet_pattern_data:
    DB #00,#00,#00,#00,#01,#02,#05,#05,#02,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#80,#40,#A0,#A0,#40,#80,#00,#00,#00,#00,#00,#00
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
; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE; VRAM #00000, raw 2560 bytes, RLE 152 bytes
bitmap_room_hud_seed_p0_rle_chunk_0:
    DB #FF,#11,#64,#11,#01,#14,#01,#44,#63,#11,#01,#14,#01,#41,#19,#11
    DB #01,#16,#01,#61,#4B,#11,#01,#66,#01,#61,#16,#11,#01,#47,#01,#74
    DB #19,#11,#02,#66,#4A,#11,#01,#16,#01,#11,#01,#16,#15,#11,#01,#14
    DB #02,#44,#01,#41,#18,#11,#02,#EE,#4A,#11,#01,#16,#01,#11,#01,#16
    DB #15,#11,#01,#14,#01,#45,#01,#54,#01,#41,#17,#11,#01,#1E,#02,#EE
    DB #01,#E1,#4A,#11,#01,#66,#01,#61,#16,#11,#02,#44,#18,#11,#01,#1E
    DB #01,#E7,#01,#EE,#01,#E1,#4A,#11,#01,#16,#17,#11,#01,#14,#01,#41
    DB #19,#11,#02,#EE,#4B,#11,#01,#16,#32,#11,#01,#1E,#01,#E1,#4B,#11
    DB #01,#16,#7C,#11,#02,#66,#01,#67,#01,#71,#7C,#11,#01,#61,#FF,#11
    DB #FF,#11,#FF,#11,#55,#11,#80,#FF
bitmap_room_hud_seed_p0_rle_chunk_0_end:

; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE; VRAM #08000, raw 2560 bytes, RLE 152 bytes
bitmap_room_hud_seed_p1_rle_chunk_0:
    DB #FF,#11,#64,#11,#01,#14,#01,#44,#63,#11,#01,#14,#01,#41,#19,#11
    DB #01,#16,#01,#61,#4B,#11,#01,#66,#01,#61,#16,#11,#01,#47,#01,#74
    DB #19,#11,#02,#66,#4A,#11,#01,#16,#01,#11,#01,#16,#15,#11,#01,#14
    DB #02,#44,#01,#41,#18,#11,#02,#EE,#4A,#11,#01,#16,#01,#11,#01,#16
    DB #15,#11,#01,#14,#01,#45,#01,#54,#01,#41,#17,#11,#01,#1E,#02,#EE
    DB #01,#E1,#4A,#11,#01,#66,#01,#61,#16,#11,#02,#44,#18,#11,#01,#1E
    DB #01,#E7,#01,#EE,#01,#E1,#4A,#11,#01,#16,#17,#11,#01,#14,#01,#41
    DB #19,#11,#02,#EE,#4B,#11,#01,#16,#32,#11,#01,#1E,#01,#E1,#4B,#11
    DB #01,#16,#7C,#11,#02,#66,#01,#67,#01,#71,#7C,#11,#01,#61,#FF,#11
    DB #FF,#11,#FF,#11,#55,#11,#80,#FF
bitmap_room_hud_seed_p1_rle_chunk_0_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #10000, raw 8192 bytes, RLE 5646 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #01,#03,#07,#33,#02,#00,#01,#0C,#02,#CC,#01,#C0,#02,#00,#07,#33
    DB #01,#00,#07,#22,#01,#00,#01,#03,#06,#33,#01,#31,#0F,#00,#02,#22
    DB #07,#00,#08,#22,#10,#00,#01,#20,#01,#22,#01,#20,#01,#02,#01,#20
    DB #01,#02,#01,#00,#01,#02,#08,#11,#01,#00,#01,#0E,#01,#EE,#02,#00
    DB #01,#EE,#01,#30,#01,#00,#01,#01,#07,#11,#08,#00,#01,#32,#07,#22
    DB #01,#00,#01,#0C,#01,#CC,#02,#44,#01,#CC,#01,#C0,#01,#00,#07,#22
    DB #01,#30,#07,#00,#01,#20,#01,#32,#06,#22,#01,#23,#01,#02,#01,#00
    DB #01,#22,#03,#02,#02,#20,#07,#00,#02,#22,#07,#00,#08,#22,#08,#00
    DB #01,#02,#01,#00,#01,#22,#03,#02,#03,#20,#01,#22,#01,#20,#01,#02
    DB #01,#20,#01,#22,#01,#00,#01,#02,#02,#33,#01,#13,#03,#33,#01,#03
    DB #01,#33,#01,#00,#01,#EE,#01,#33,#01,#E0,#01,#0E,#01,#EE,#01,#E3
    DB #01,#00,#08,#11,#08,#00,#01,#32,#07,#22,#01,#00,#01,#CC,#01,#C4
    DB #01,#47,#01,#74,#01,#4C,#01,#CC,#01,#00,#07,#22,#01,#30,#05,#00
    DB #01,#22,#01,#00,#01,#20,#01,#32,#06,#22,#01,#23,#01,#02,#01,#00
    DB #01,#20,#03,#02,#01,#00,#01,#20,#07,#00,#02,#22,#0A,#00,#01,#02
    DB #01,#20,#0B,#00,#01,#02,#01,#00,#01,#20,#03,#02,#01,#00,#01,#20
    DB #01,#02,#02,#20,#01,#00,#01,#02,#01,#22,#01,#00,#01,#02,#01,#32
    DB #01,#22,#01,#12,#03,#22,#01,#12,#01,#22,#01,#0E,#01,#E3,#01,#3E
    DB #04,#EE,#01,#30,#08,#11,#02,#00,#01,#05,#02,#55,#03,#00,#01,#32
    DB #01,#20,#01,#02,#05,#22,#01,#0C,#01,#CC,#01,#44,#01,#47,#01,#74
    DB #01,#4C,#01,#CC,#01,#C0,#05,#22,#01,#11,#01,#22,#01,#30,#05,#00
    DB #01,#22,#01,#00,#01,#20,#01,#32,#01,#23,#01,#02,#02,#22,#01,#23
    DB #01,#02,#01,#23,#01,#02,#01,#00,#01,#22,#03,#02,#02,#20,#07,#00
    DB #02,#22,#0A,#00,#01,#02,#01,#20,#0B,#00,#01,#02,#01,#00,#01,#22
    DB #03,#02,#02,#20,#02,#02,#01,#22,#01,#00,#02,#02,#01,#20,#01,#02
    DB #01,#32,#01,#22,#01,#12,#03,#22,#01,#12,#01,#22,#01,#0E,#01,#33
    DB #05,#EE,#01,#30,#02,#11,#01,#01,#03,#11,#01,#01,#01,#11,#02,#00
    DB #03,#55,#01,#50,#02,#00,#01,#32,#01,#20,#01,#02,#05,#22,#01,#CC
    DB #01,#C4,#01,#44,#02,#77,#01,#44,#01,#CC,#01,#44,#05,#22,#01,#11
    DB #01,#22,#01,#30,#05,#00,#01,#11,#01,#00,#01,#20,#01,#32,#01,#20
    DB #01,#02,#02,#22,#01,#21,#01,#12,#01,#23,#01,#02,#01,#00,#01,#20
    DB #03,#02,#01,#00,#01,#20,#07,#00,#02,#22,#0A,#00,#01,#02,#01,#20
    DB #0B,#00,#01,#02,#01,#00,#01,#20,#03,#02,#01,#00,#01,#20,#02,#02
    DB #01,#22,#03,#02,#02,#20,#08,#11,#01,#0E,#01,#3E,#01,#E0,#01,#EE
    DB #01,#E0,#01,#0E,#01,#EE,#01,#30,#01,#11,#01,#10,#01,#01,#05,#11
    DB #01,#00,#01,#05,#04,#55,#02,#00,#01,#32,#07,#22,#01,#CC,#05,#44
    DB #01,#CC,#01,#C4,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32,#06,#22
    DB #01,#23,#01,#02,#01,#20,#01,#22,#01,#00,#01,#20,#01,#02,#01,#20
    DB #01,#22,#07,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0B,#00,#01,#02
    DB #01,#20,#01,#22,#01,#00,#01,#20,#01,#02,#01,#20,#01,#22,#01,#00
    DB #02,#22,#02,#02,#01,#22,#02,#20,#01,#30,#03,#22,#01,#02,#03,#22
    DB #01,#0E,#01,#EE,#01,#E0,#02,#EE,#01,#0E,#01,#EE,#01,#30,#08,#11
    DB #01,#00,#01,#05,#04,#55,#02,#00,#01,#32,#07,#22,#01,#4C,#01,#44
    DB #05,#CC,#01,#C4,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32,#06,#22
    DB #01,#23,#0F,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#14,#00,#01,#22
    DB #03,#02,#03,#20,#01,#30,#03,#22,#01,#02,#03,#22,#01,#0E,#01,#E0
    DB #02,#00,#01,#EE,#01,#0E,#01,#EE,#01,#30,#08,#11,#02,#00,#03,#44
    DB #01,#40,#02,#00,#01,#32,#07,#22,#02,#CC,#02,#C0,#01,#CC,#01,#0C
    DB #01,#CC,#01,#44,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32,#06,#22
    DB #01,#23,#0F,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#14,#00,#01,#20
    DB #02,#22,#01,#00,#03,#20,#01,#30,#03,#22,#01,#02,#03,#22,#01,#0E
    DB #01,#EE,#01,#E0,#02,#EE,#01,#0E,#01,#EE,#01,#30,#08,#11,#02,#00
    DB #03,#66,#01,#60,#02,#00,#01,#32,#07,#22,#01,#0C,#01,#C0,#01,#00
    DB #02,#CC,#01,#00,#01,#CC,#01,#C0,#07,#22,#01,#30,#07,#00,#01,#20
    DB #01,#32,#06,#22,#01,#23,#0F,#00,#02,#22,#0A,#00,#01,#02,#01,#20
    DB #14,#00,#01,#02,#01,#20,#01,#22,#01,#00,#01,#22,#01,#02,#01,#20
    DB #01,#30,#03,#33,#01,#03,#03,#33,#01,#00,#01,#EE,#01,#E0,#02,#EE
    DB #01,#0E,#01,#E3,#01,#00,#01,#13,#06,#33,#01,#31,#01,#00,#01,#06
    DB #01,#67,#03,#66,#02,#00,#01,#32,#07,#22,#01,#00,#01,#C0,#01,#0C
    DB #02,#CC,#01,#00,#01,#CC,#01,#00,#07,#22,#01,#30,#07,#00,#01,#20
    DB #01,#32,#06,#22,#01,#23,#02,#00,#01,#22,#01,#00,#01,#02,#01,#22
    DB #09,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0D,#00,#01,#22,#01,#00
    DB #01,#02,#04,#00,#01,#02,#01,#20,#01,#22,#01,#00,#01,#22,#01,#02
    DB #01,#20,#09,#00,#01,#0E,#04,#EE,#01,#30,#01,#00,#01,#32,#01,#24
    DB #01,#42,#02,#22,#01,#24,#01,#42,#01,#23,#01,#00,#01,#06,#01,#67
    DB #03,#66,#02,#00,#01,#32,#07,#22,#02,#00,#01,#0C,#01,#C4,#01,#CC
    DB #03,#00,#05,#22,#01,#00,#01,#22,#01,#30,#05,#00,#01,#22,#01,#00
    DB #01,#20,#01,#32,#06,#22,#01,#23,#02,#00,#01,#02,#01,#00,#01,#02
    DB #0A,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0D,#00,#01,#02,#01,#00
    DB #01,#02,#04,#00,#01,#02,#02,#20,#01,#00,#02,#02,#01,#00,#01,#33
    DB #01,#30,#04,#33,#01,#03,#01,#33,#02,#00,#03,#EE,#01,#E3,#02,#00
    DB #01,#32,#01,#20,#01,#02,#02,#22,#01,#20,#01,#02,#01,#23,#01,#00
    DB #01,#06,#04,#66,#02,#00,#01,#32,#01,#20,#01,#02,#05,#22,#02,#00
    DB #01,#0C,#01,#C4,#01,#4C,#03,#00,#05,#22,#01,#00,#01,#22,#01,#30
    DB #05,#00,#01,#22,#01,#00,#01,#20,#01,#32,#01,#23,#01,#02,#02,#22
    DB #01,#23,#01,#12,#01,#23,#02,#00,#01,#02,#01,#00,#01,#02,#01,#20
    DB #09,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0D,#00,#01,#02,#01,#00
    DB #02,#02,#04,#00,#01,#22,#01,#20,#01,#00,#01,#02,#01,#22,#01,#00
    DB #01,#22,#01,#20,#04,#22,#01,#02,#01,#23,#02,#00,#03,#EE,#01,#E3
    DB #02,#00,#01,#32,#01,#24,#01,#40,#01,#04,#01,#40,#01,#04,#01,#42
    DB #01,#23,#02,#00,#03,#66,#01,#60,#02,#00,#01,#32,#01,#20,#01,#02
    DB #05,#22,#02,#00,#01,#0C,#01,#44,#01,#4C,#03,#00,#07,#22,#01,#30
    DB #07,#00,#01,#20,#01,#32,#01,#20,#01,#02,#02,#22,#01,#21,#01,#02
    DB #01,#23,#02,#00,#01,#02,#02,#00,#01,#02,#09,#00,#02,#22,#0A,#00
    DB #01,#02,#01,#20,#0D,#00,#01,#02,#01,#00,#01,#02,#01,#22,#04,#00
    DB #01,#22,#01,#20,#01,#00,#01,#02,#01,#22,#01,#00,#01,#22,#01,#20
    DB #04,#22,#01,#02,#01,#23,#02,#00,#01,#0E,#02,#EE,#01,#30,#02,#00
    DB #01,#32,#06,#22,#01,#23,#02,#00,#03,#66,#01,#60,#02,#00,#01,#32
    DB #07,#22,#02,#00,#01,#0C,#01,#C4,#01,#CC,#03,#00,#07,#22,#01,#30
    DB #07,#00,#01,#20,#01,#32,#06,#22,#01,#23,#02,#00,#01,#02,#02,#00
    DB #01,#02,#09,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0D,#00,#01,#02
    DB #02,#00,#01,#02,#04,#00,#01,#22,#01,#20,#02,#00,#01,#20,#01,#00
    DB #08,#11,#03,#00,#01,#EE,#01,#E3,#03,#00,#01,#30,#06,#22,#01,#03
    DB #02,#00,#01,#06,#02,#66,#03,#00,#01,#03,#07,#33,#03,#00,#01,#CC
    DB #01,#C0,#03,#00,#07,#33,#01,#00,#07,#22,#01,#00,#01,#03,#06,#33
    DB #01,#31,#02,#00,#01,#02,#01,#00,#01,#02,#01,#20,#09,#00,#02,#22
    DB #0A,#00,#01,#02,#01,#20,#03,#00,#08,#22,#02,#00,#01,#02,#02,#00
    DB #01,#02,#04,#00,#01,#02,#03,#00,#01,#20,#01,#00,#01,#02,#03,#22
    DB #01,#02,#02,#22,#01,#23,#03,#00,#01,#03,#01,#30,#03,#00,#01,#33
    DB #01,#03,#04,#33,#01,#30,#01,#33,#03,#00,#01,#44,#01,#40,#0E,#00
    DB #01,#CC,#01,#C0,#2A,#00,#02,#22,#09,#00,#01,#02,#02,#22,#01,#20
    DB #02,#00,#08,#22,#0A,#00,#01,#02,#05,#00,#01,#03,#03,#33,#01,#03
    DB #03,#33,#08,#00,#01,#13,#06,#33,#01,#31,#08,#00,#08,#11,#14,#00
    DB #01,#01,#01,#20,#01,#00,#01,#02,#01,#00,#01,#0F,#02,#FF,#01,#F8
    DB #01,#EE,#01,#E0,#01,#00,#01,#FF,#01,#E0,#01,#00,#01,#0F,#04,#FF
    DB #08,#00,#04,#FF,#01,#F0,#01,#00,#01,#0E,#01,#8E,#01,#00,#02,#EE
    DB #01,#E8,#02,#FF,#01,#F0,#1C,#00,#01,#07,#01,#AA,#1B,#00,#02,#33
    DB #01,#13,#03,#33,#01,#03,#01,#33,#03,#00,#01,#07,#01,#60,#10,#00
    DB #01,#12,#01,#00,#01,#20,#04,#FF,#01,#F8,#02,#EE,#01,#E0,#01,#FF
    DB #01,#E0,#01,#EE,#01,#EB,#03,#FF,#01,#FB,#01,#BE,#05,#00,#01,#0E
    DB #01,#EB,#01,#BF,#03,#FF,#01,#8E,#01,#EE,#01,#0E,#01,#8E,#01,#0E
    DB #02,#EE,#01,#E8,#04,#FF,#12,#00,#01,#07,#01,#70,#02,#00,#01,#07
    DB #02,#77,#02,#00,#01,#0A,#01,#AA,#1B,#00,#02,#22,#01,#13,#03,#22
    DB #01,#13,#01,#22,#03,#00,#01,#76,#01,#66,#10,#00,#01,#01,#01,#22
    DB #01,#00,#01,#FF,#01,#F0,#04,#00,#01,#0E,#01,#E0,#01,#BB,#01,#E0
    DB #01,#EE,#01,#E0,#01,#0F,#01,#FF,#01,#00,#01,#0B,#01,#BE,#01,#E0
    DB #04,#00,#01,#0E,#01,#EB,#02,#00,#01,#FF,#01,#F0,#01,#8E,#01,#EE
    DB #01,#0E,#01,#8E,#01,#0E,#01,#E0,#04,#00,#01,#0F,#01,#FF,#03,#00
    DB #01,#26,#03,#00,#01,#07,#01,#77,#01,#70,#02,#00,#01,#22,#05,#00
    DB #01,#A2,#01,#70,#02,#00,#03,#77,#01,#70,#01,#07,#01,#7A,#01,#AA
    DB #1B,#00,#01,#32,#01,#22,#01,#13,#03,#22,#01,#13,#01,#22,#02,#00
    DB #01,#07,#02,#66,#01,#60,#05,#00,#01,#44,#01,#40,#08,#00,#01,#01
    DB #01,#22,#01,#00,#01,#FF,#01,#EE,#01,#E0,#03,#00,#01,#EE,#01,#E0
    DB #01,#88,#01,#E0,#05,#00,#01,#EE,#01,#8E,#05,#00,#01,#0E,#01,#8E
    DB #01,#EE,#05,#00,#01,#0E,#01,#EE,#01,#0E,#01,#EE,#03,#00,#01,#08
    DB #01,#88,#01,#FF,#03,#00,#01,#22,#01,#60,#02,#00,#01,#07,#01,#27
    DB #01,#77,#02,#00,#01,#22,#05,#00,#01,#A9,#01,#A0,#01,#70,#01,#07
    DB #01,#77,#01,#22,#01,#27,#01,#70,#01,#07,#01,#7A,#01,#77,#1B,#00
    DB #07,#11,#01,#10,#02,#00,#01,#06,#02,#66,#01,#34,#04,#00,#01,#01
    DB #01,#66,#01,#10,#08,#00,#01,#02,#01,#10,#01,#20,#01,#00,#02,#EE
    DB #01,#EB,#03,#EE,#01,#E0,#01,#EE,#01,#00,#01,#0E,#01,#EE,#01,#88
    DB #01,#8E,#02,#EE,#01,#E0,#06,#00,#01,#0E,#02,#EE,#01,#88,#01,#8E
    DB #01,#EE,#01,#E0,#01,#00,#01,#EE,#01,#0E,#02,#EE,#01,#E8,#01,#8E
    DB #01,#EE,#01,#88,#04,#00,#01,#22,#01,#60,#01,#00,#01,#07,#01,#72
    DB #01,#22,#01,#77,#01,#70,#01,#AA,#06,#00,#01,#0A,#01,#AA,#01,#77
    DB #01,#07,#01,#72,#02,#22,#01,#77,#01,#07,#01,#A7,#01,#77,#1B,#00
    DB #01,#30,#03,#33,#01,#03,#03,#33,#02,#00,#01,#43,#01,#66,#01,#63
    DB #01,#44,#04,#00,#01,#16,#01,#66,#01,#61,#08,#00,#01,#20,#01,#01
    DB #01,#02,#02,#00,#01,#EE,#01,#EB,#02,#EE,#01,#00,#01,#04,#01,#BB
    DB #01,#44,#01,#0E,#01,#EE,#02,#88,#01,#EE,#09,#00,#01,#0E,#01,#EE
    DB #02,#88,#01,#EE,#01,#E0,#01,#4E,#01,#BA,#01,#40,#01,#00,#01,#EE
    DB #01,#E8,#01,#88,#01,#EE,#03,#00,#01,#07,#01,#70,#01,#06,#01,#67
    DB #01,#70,#01,#07,#01,#29,#01,#99,#01,#27,#01,#70,#01,#AA,#06,#00
    DB #01,#07,#01,#7A,#02,#77,#01,#29,#01,#9B,#01,#92,#01,#27,#01,#02
    DB #02,#77,#1B,#00,#01,#30,#01,#32,#02,#22,#01,#03,#03,#22,#02,#00
    DB #01,#44,#01,#36,#01,#34,#01,#44,#04,#00,#01,#1E,#01,#EE,#01,#E1
    DB #03,#00,#01,#20,#03,#00,#01,#02,#0A,#00,#01,#44,#01,#BF,#01,#E4
    DB #01,#40,#06,#00,#01,#04,#01,#AF,#01,#FF,#01,#BE,#01,#E4,#07,#00
    DB #01,#04,#01,#4E,#01,#FB,#01,#44,#08,#00,#01,#06,#01,#60,#01,#07
    DB #02,#77,#01,#06,#01,#29,#01,#BA,#01,#22,#01,#77,#01,#A7,#01,#70
    DB #01,#77,#01,#70,#02,#00,#01,#77,#01,#00,#01,#7A,#01,#27,#01,#77
    DB #01,#29,#01,#BB,#01,#B9,#01,#27,#01,#22,#01,#27,#01,#77,#01,#00
    DB #01,#70,#19,#00,#01,#30,#01,#32,#02,#22,#01,#03,#03,#22,#02,#00
    DB #01,#44,#01,#43,#01,#44,#01,#46,#03,#00,#01,#01,#03,#EE,#01,#10
    DB #14,#00,#01,#0E,#06,#00,#01,#04,#01,#EB,#01,#BB,#01,#8E,#01,#E4
    DB #01,#44,#05,#00,#01,#0E,#01,#E0,#0B,#00,#01,#06,#01,#A6,#01,#77
    DB #01,#72,#01,#77,#01,#72,#01,#29,#01,#BA,#01,#27,#01,#77,#01,#67
    DB #01,#70,#01,#77,#01,#70,#02,#00,#03,#77,#02,#22,#02,#99,#01,#BB
    DB #01,#97,#01,#22,#01,#27,#01,#77,#01,#07,#01,#77,#23,#00,#01,#44
    DB #01,#37,#01,#34,#01,#44,#03,#00,#01,#01,#01,#EE,#01,#7E,#01,#EE
    DB #01,#10,#03,#00,#01,#20,#01,#00,#01,#02,#0A,#00,#01,#04,#01,#44
    DB #01,#BF,#01,#E4,#01,#40,#05,#00,#01,#04,#06,#44,#01,#40,#05,#00
    DB #01,#04,#01,#4A,#01,#FB,#01,#E4,#01,#40,#08,#00,#01,#A6,#01,#77
    DB #01,#72,#01,#22,#01,#77,#01,#22,#01,#A2,#02,#77,#01,#27,#02,#77
    DB #01,#70,#01,#00,#01,#07,#01,#72,#02,#77,#02,#22,#01,#29,#01,#22
    DB #01,#AB,#01,#22,#01,#29,#01,#22,#01,#77,#01,#07,#01,#A7,#23,#00
    DB #01,#43,#01,#76,#01,#63,#01,#44,#04,#00,#01,#1E,#01,#EE,#01,#E1
    DB #04,#00,#01,#02,#01,#00,#01,#20,#02,#00,#02,#20,#0B,#00,#01,#44
    DB #03,#00,#01,#0E,#01,#EE,#06,#00,#01,#EE,#01,#E0,#03,#00,#01,#44
    DB #0D,#00,#01,#AA,#01,#67,#01,#22,#01,#99,#01,#22,#01,#72,#01,#92
    DB #01,#66,#01,#72,#01,#22,#02,#77,#02,#00,#01,#07,#01,#22,#01,#27
    DB #01,#72,#01,#29,#01,#A2,#01,#22,#01,#29,#01,#9A,#01,#22,#01,#AA
    DB #01,#A2,#01,#27,#01,#79,#01,#A7,#08,#00,#01,#07,#01,#77,#19,#00
    DB #01,#07,#02,#66,#01,#34,#04,#00,#01,#01,#01,#EE,#01,#10,#05,#00
    DB #01,#22,#02,#00,#01,#02,#01,#00,#01,#02,#06,#00,#01,#4E,#01,#EE
    DB #01,#E0,#02,#00,#02,#44,#01,#E0,#01,#00,#01,#FE,#01,#EE,#01,#0E
    DB #01,#AB,#01,#EE,#01,#E4,#01,#44,#01,#40,#02,#EE,#01,#00,#03,#44
    DB #02,#00,#01,#0E,#01,#EE,#01,#E4,#08,#00,#01,#76,#01,#96,#01,#29
    DB #01,#BB,#01,#92,#01,#22,#02,#99,#02,#92,#01,#27,#01,#70,#02,#00
    DB #01,#07,#01,#72,#02,#22,#02,#BB,#01,#92,#01,#9B,#01,#B9,#01,#99
    DB #01,#BB,#01,#BA,#02,#22,#01,#70,#08,#00,#03,#77,#01,#70,#01,#22
    DB #16,#00,#01,#06,#02,#66,#01,#60,#05,#00,#01,#11,#06,#00,#01,#22
    DB #0A,#00,#01,#FF,#01,#BB,#01,#BE,#01,#E0,#02,#44,#01,#40,#01,#44
    DB #01,#EE,#01,#E0,#01,#FA,#01,#EE,#01,#44,#02,#EE,#03,#44,#01,#EA
    DB #01,#A4,#01,#04,#02,#44,#01,#04,#02,#44,#01,#0E,#01,#AB,#01,#BA
    DB #01,#E0,#07,#00,#01,#77,#01,#66,#01,#2A,#01,#BB,#01,#B9,#01,#A9
    DB #01,#BB,#01,#9A,#01,#99,#01,#22,#01,#27,#01,#70,#01,#06,#01,#60
    DB #01,#07,#01,#77,#01,#22,#01,#2A,#02,#BB,#01,#A9,#01,#BB,#01,#BA
    DB #01,#AB,#01,#BF,#01,#BB,#01,#99,#01,#27,#01,#70,#05,#00,#01,#22
    DB #01,#00,#01,#07,#01,#72,#01,#99,#01,#27,#01,#70,#01,#62,#17,#00
    DB #02,#66,#0C,#00,#01,#02,#01,#00,#01,#20,#01,#00,#01,#02,#01,#00
    DB #01,#02,#05,#00,#01,#AA,#01,#BF,#01,#FE,#01,#40,#01,#AA,#02,#44
    DB #01,#40,#01,#4E,#01,#E0,#01,#BA,#01,#EE,#05,#44,#01,#4E,#01,#EE
    DB #01,#AE,#01,#04,#04,#44,#01,#AA,#01,#0E,#01,#EF,#01,#FA,#01,#E0
    DB #06,#00,#01,#07,#01,#77,#01,#76,#01,#AB,#01,#B9,#01,#29,#01,#DF
    DB #01,#FB,#01,#B9,#01,#DD,#01,#D2,#01,#27,#01,#77,#01,#76,#01,#96
    DB #01,#00,#01,#77,#01,#72,#01,#2B,#01,#BF,#01,#FB,#01,#AA,#01,#BF
    DB #01,#BB,#01,#AF,#01,#FF,#01,#FB,#01,#A9,#02,#77,#05,#00,#01,#22
    DB #02,#77,#01,#29,#01,#BB,#01,#97,#01,#77,#01,#70,#0C,#00,#05,#11
    DB #06,#00,#01,#06,#01,#60,#11,#00,#02,#20,#05,#00,#01,#4E,#02,#04
    DB #01,#40,#01,#A8,#01,#AA,#01,#E4,#01,#40,#01,#44,#01,#EA,#01,#BE
    DB #01,#EA,#01,#AE,#01,#44,#01,#EE,#02,#44,#01,#AA,#01,#AE,#01,#EE
    DB #03,#44,#01,#4E,#02,#AA,#01,#04,#01,#40,#01,#44,#01,#40,#06,#00
    DB #01,#07,#01,#27,#01,#77,#01,#22,#01,#A2,#01,#99,#01,#BF,#01,#FF
    DB #01,#B9,#01,#AD,#01,#D9,#01,#27,#01,#72,#01,#A6,#01,#20,#02,#77
    DB #01,#22,#01,#29,#01,#FF,#01,#BA,#01,#BB,#01,#BF,#01,#FB,#01,#AF
    DB #01,#FB,#01,#BB,#01,#A2,#01,#72,#01,#77,#01,#70,#04,#00,#01,#B6
    DB #01,#26,#01,#77,#01,#29,#01,#99,#01,#27,#02,#77,#01,#00,#01,#70
    DB #22,#00,#01,#02,#03,#00,#01,#20,#08,#00,#01,#44,#02,#04,#01,#00
    DB #01,#44,#01,#88,#01,#E4,#01,#40,#01,#4E,#01,#EE,#01,#AE,#01,#EA
    DB #01,#AE,#01,#EA,#01,#AB,#01,#AA,#01,#E0,#01,#AA,#01,#AE,#01,#EE
    DB #02,#44,#01,#0E,#01,#48,#01,#8A,#01,#44,#01,#04,#02,#44,#01,#40
    DB #06,#00,#01,#72,#01,#22,#01,#67,#01,#22,#01,#99,#01,#DD,#02,#FF
    DB #01,#FB,#01,#99,#01,#D2,#01,#27,#01,#2A,#01,#67,#01,#00,#01,#77
    DB #01,#22,#01,#29,#01,#99,#01,#BB,#01,#9B,#01,#BF,#01,#FF,#01,#FB
    DB #01,#BB,#01,#B9,#01,#BB,#01,#92,#02,#22,#01,#77,#02,#00,#01,#02
    DB #01,#20,#01,#00,#01,#72,#01,#27,#01,#2B,#01,#BB,#02,#22,#03,#77
    DB #22,#00,#01,#20,#03,#00,#01,#02,#08,#00,#01,#44,#01,#00,#01,#04
    DB #01,#00,#03,#44,#01,#40,#01,#0E,#01,#EE,#01,#4E,#01,#EE,#01,#AE
    DB #01,#EA,#02,#BB,#01,#E4,#01,#AA,#02,#EE,#02,#44,#01,#00,#03,#44
    DB #01,#00,#01,#40,#01,#04,#01,#40,#06,#00,#01,#77,#01,#2A,#01,#92
    DB #01,#22,#01,#9B,#01,#BB,#01,#BF,#01,#FF,#01,#B9,#02,#92,#01,#2A
    DB #01,#AA,#01,#70,#01,#00,#01,#77,#01,#22,#01,#9A,#01,#A9,#02,#9B
    DB #02,#FF,#02,#FB,#01,#AA,#01,#29,#01,#A9,#01,#92,#01,#22,#01,#77
    DB #02,#00,#01,#02,#01,#27,#01,#77,#01,#76,#01,#29,#01,#BB,#01,#FB
    DB #01,#B9,#01,#92,#02,#27,#01,#70,#2F,#00,#01,#44,#02,#04,#01,#40
    DB #03,#44,#01,#04,#02,#44,#01,#4E,#01,#EE,#01,#BA,#03,#EE,#01,#E4
    DB #01,#8A,#02,#EE,#01,#44,#01,#04,#01,#40,#03,#44,#01,#04,#01,#40
    DB #01,#44,#01,#40,#06,#00,#01,#77,#01,#6D,#01,#22,#01,#92,#01,#AB
    DB #01,#FF,#01,#BF,#01,#FB,#01,#BB,#01,#99,#01,#92,#01,#29,#01,#67
    DB #02,#00,#01,#77,#01,#22,#02,#9A,#01,#BF,#01,#AB,#04,#FF,#01,#BB
    DB #01,#9A,#01,#AB,#01,#BA,#01,#22,#01,#27,#03,#00,#01,#77,#01,#62
    DB #01,#72,#01,#9B,#01,#BF,#01,#FF,#01,#BB,#01,#B6,#02,#77,#30,#00
    DB #03,#44,#01,#40,#01,#04,#01,#40,#01,#44,#01,#04,#01,#44,#01,#40
    DB #01,#0E,#01,#EA,#01,#E4,#01,#00,#01,#02,#01,#20,#01,#00,#01,#4A
    DB #01,#AE,#01,#E0,#01,#04,#01,#44,#01,#40,#02,#04,#01,#00,#01,#04
    DB #02,#44,#01,#40,#06,#00,#01,#07,#01,#62,#01,#29,#01,#DA,#01,#DB
    DB #04,#FF,#01,#B9,#01,#99,#01,#22,#01,#77,#02,#00,#01,#07,#01,#29
    DB #01,#92,#01,#9B,#01,#FF,#01,#BB,#03,#FF,#01,#FB,#01,#FF,#01,#B9
    DB #01,#BF,#01,#BA,#01,#22,#01,#27,#03,#00,#01,#07,#01,#22,#01,#B2
    DB #01,#BB,#03,#FF,#01,#B6,#01,#70,#32,#00,#01,#44,#01,#40,#04,#00
    DB #01,#04,#02,#44,#01,#EE,#01,#BA,#01,#E0,#01,#00,#02,#22,#01,#00
    DB #01,#04,#01,#BA,#01,#E0,#02,#44,#01,#40,#04,#00,#02,#44,#08,#00
    DB #01,#72,#01,#2A,#02,#BB,#04,#FF,#01,#FB,#01,#AB,#01,#92,#01,#22
    DB #01,#77,#01,#00,#01,#07,#01,#72,#01,#22,#01,#AB,#07,#FF,#01,#B9
    DB #01,#BF,#01,#B9,#01,#22,#05,#00,#01,#72,#01,#99,#01,#9B,#01,#BF
    DB #01,#FF,#01,#BB,#01,#92,#01,#22,#01,#27,#01,#70,#33,#00,#03,#44
    DB #01,#04,#01,#44,#01,#4E,#01,#AB,#01,#EE,#01,#00,#04,#22,#01,#00
    DB #01,#EE,#01,#BE,#02,#44,#01,#40,#01,#04,#02,#44,#0B,#00,#01,#07
    DB #01,#29,#01,#BF,#01,#BB,#01,#BF,#03,#FF,#01,#FB,#01,#BB,#01,#D9
    DB #01,#26,#01,#72,#02,#00,#01,#77,#01,#72,#01,#2B,#07,#FF,#01,#B9
    DB #01,#29,#01,#92,#01,#22,#05,#00,#01,#07,#01,#62,#01,#22,#01,#BB
    DB #01,#FB,#01,#B9,#02,#22,#01,#27,#01,#70,#31,#00,#01,#0E,#01,#EE
    DB #01,#8B,#01,#BE,#01,#EE,#01,#E0,#01,#44,#01,#4E,#01,#EA,#01,#EE
    DB #01,#E2,#01,#22,#01,#2A,#02,#22,#01,#2E,#01,#EE,#01,#AE,#02,#44
    DB #01,#0E,#01,#EE,#01,#EB,#01,#B8,#01,#EE,#01,#E0,#07,#00,#01,#0A
    DB #01,#66,#01,#D6,#01,#29,#01,#AB,#01,#BB,#01,#BF,#03,#FF,#01,#FB
    DB #01,#BB,#01,#B2,#02,#77,#01,#00,#01,#7A,#01,#07,#01,#72,#01,#99
    DB #01,#BB,#01,#FF,#01,#BF,#02,#FF,#01,#FB,#01,#FF,#01,#B9,#01,#92
    DB #01,#77,#01,#20,#06,#00,#01,#76,#01,#27,#01,#99,#01,#BB,#01,#22
    DB #01,#27,#01,#72,#01,#77,#31,#00,#01,#0E,#02,#EE,#01,#BF,#01,#F8
    DB #01,#EE,#01,#E0,#02,#44,#01,#4E,#01,#0E,#01,#E2,#01,#22,#01,#AF
    DB #02,#22,#01,#2E,#01,#E0,#01,#E4,#02,#44,#01,#0E,#01,#EE,#01,#8F
    DB #01,#F8,#02,#EE,#01,#E0,#06,#00,#01,#0D,#01,#62,#01,#A9,#02,#99
    DB #01,#BF,#03,#FF,#01,#BF,#01,#BD,#01,#BB,#01,#92,#01,#22,#01,#70
    DB #01,#00,#02,#AA,#02,#22,#01,#AB,#02,#BF,#02,#FF,#01,#FB,#01,#BB
    DB #01,#A9,#01,#92,#01,#27,#01,#77,#08,#00,#02,#22,#01,#27,#34,#00
    DB #01,#EE,#01,#E8,#01,#80,#01,#00,#01,#B8,#01,#0E,#01,#E0,#01,#44
    DB #01,#EE,#01,#44,#01,#0E,#01,#E2,#01,#22,#01,#AA,#01,#20,#01,#02
    DB #01,#2E,#01,#E0,#01,#44,#01,#EE,#01,#44,#01,#0E,#01,#E0,#01,#88
    DB #01,#00,#01,#08,#01,#8E,#01,#EE,#07,#00,#01,#60,#01,#77,#01,#76
    DB #01,#99,#01,#BF,#03,#FF,#01,#BB,#01,#A9,#01,#D7,#01,#77,#01,#70
    DB #01,#00,#01,#06,#01,#AA,#01,#92,#01,#77,#01,#79,#01,#A9,#01,#9B
    DB #01,#BF,#02,#FF,#01,#FB,#01,#BA,#01,#A9,#01,#92,#02,#77,#01,#70
    DB #07,#00,#01,#07,#01,#77,#35,#00,#01,#E0,#01,#8B,#01,#BB,#01,#08
    DB #01,#BB,#01,#B0,#01,#EE,#01,#0E,#01,#EA,#01,#00,#01,#0B,#01,#B2
    DB #01,#20,#01,#22,#01,#00,#01,#02,#01,#2B,#01,#B0,#01,#E0,#01,#AE
    DB #01,#40,#01,#EE,#01,#0B,#01,#BB,#01,#B0,#01,#BB,#01,#B8,#01,#EE
    DB #08,#00,#01,#07,#01,#72,#01,#2B,#01,#9B,#01,#FF,#01,#BB,#01,#FF
    DB #01,#BD,#01,#99,#01,#A2,#01,#27,#03,#00,#01,#AA,#01,#72,#01,#07
    DB #01,#7B,#01,#AB,#01,#9B,#02,#FF,#01,#FB,#01,#BF,#01,#92,#01,#A9
    DB #01,#27,#01,#77,#01,#72,#01,#20,#3E,#00,#01,#EE,#01,#80,#02,#08
    DB #01,#00,#01,#88,#01,#EE,#02,#00,#01,#EE,#01,#0E,#01,#E2,#01,#22
    DB #02,#00,#01,#22,#01,#2E,#02,#E0,#02,#00,#01,#EE,#01,#BB,#01,#08
    DB #01,#BB,#01,#B0,#01,#08,#01,#EE,#07,#00,#01,#07,#02,#77,#01,#AA
    DB #01,#99,#01,#BB,#01,#9A,#01,#BB,#01,#A2,#03,#22,#01,#70,#02,#00
    DB #02,#07,#01,#72,#01,#9B,#01,#29,#01,#AB,#01,#FF,#01,#BF,#01,#FB
    DB #01,#2F,#01,#B2,#01,#92,#01,#27,#01,#70,#01,#07,#01,#20,#3E,#00
    DB #01,#EE,#01,#E0,#01,#08,#01,#0E,#01,#00,#02,#EE,#02,#00,#01,#EE
    DB #01,#0E,#01,#E0,#01,#22,#02,#00,#01,#22,#01,#0E,#02,#E0,#02,#00
    DB #01,#EE,#01,#88,#01,#08,#01,#88,#01,#80,#01,#0E,#01,#EE,#07,#00
    DB #01,#06,#01,#A6,#01,#77,#01,#69,#01,#92,#01,#A9,#01,#2A,#01,#BB
    DB #01,#92,#03,#22,#01,#67,#03,#00,#01,#77,#01,#72,#01,#AA,#01,#72
    DB #01,#9B,#01,#FB,#01,#BF,#01,#F9,#01,#99,#01,#B2,#01,#22,#01,#27
    DB #01,#77,#40,#00,#01,#E0,#02,#EE,#01,#0E,#01,#EE,#01,#E0,#02,#EE
    DB #01,#44,#01,#0E,#01,#40,#01,#EE,#01,#02,#02,#22,#01,#20,#01,#EE
    DB #01,#0E,#01,#E0,#01,#44,#02,#EE,#01,#0E,#01,#EE,#01,#80,#02,#EE
    DB #01,#0E,#07,#00,#01,#0A,#01,#A6,#01,#70,#01,#72,#02,#22,#01,#29
    DB #01,#AA,#01,#22,#01,#AA,#01,#27,#01,#76,#01,#26,#03,#00,#01,#77
    DB #01,#72,#01,#27,#01,#72,#01,#29,#01,#9A,#01,#AB,#01,#B9,#01,#99
    DB #01,#92,#01,#72,#01,#22,#01,#77,#40,#00,#01,#0E,#01,#EE,#01,#E0
    DB #01,#00,#01,#EE,#01,#0E,#01,#E0,#01,#EE,#02,#44,#02,#EE,#01,#E0
    DB #02,#22,#01,#0E,#01,#EE,#01,#A4,#01,#04,#01,#44,#01,#E4,#01,#0E
    DB #02,#EE,#01,#00,#01,#0E,#01,#EE,#08,#00,#01,#06,#01,#20,#01,#00
    DB #01,#77,#01,#07,#01,#22,#01,#72,#02,#22,#01,#6A,#01,#27,#01,#70
    DB #01,#66,#01,#70,#02,#00,#01,#72,#01,#27,#03,#77,#01,#29,#01,#9B
    DB #01,#A2,#01,#A9,#01,#22,#01,#77,#01,#22,#01,#77,#01,#70,#3F,#00
    DB #01,#0E,#05,#EE,#01,#EB,#01,#BE,#01,#E4,#01,#40,#01,#4E,#01,#AE
    DB #01,#EA,#02,#FF,#01,#AE,#01,#0E,#01,#E4,#01,#04,#01,#4E,#01,#8B
    DB #01,#BE,#05,#EE,#09,#00,#01,#70,#02,#00,#01,#02,#01,#27,#01,#77
    DB #01,#22,#01,#77,#01,#0A,#01,#60,#01,#00,#01,#07,#03,#00,#01,#02
    DB #01,#27,#02,#00,#01,#77,#01,#22,#01,#29,#03,#22,#01,#77,#01,#22
    DB #01,#A9,#01,#70,#40,#00,#01,#0E,#04,#EE,#01,#0B,#01,#BE,#01,#E0
    DB #02,#44,#01,#EE,#01,#EA,#02,#BB,#02,#EE,#02,#44,#01,#0E,#01,#8B
    DB #01,#B0,#04,#EE,#01,#E0,#0E,#00,#01,#07,#01,#77,#0C,#00,#01,#07
    DB #01,#72,#03,#22,#01,#77,#02,#00,#01,#7A,#01,#92,#42,#00,#01,#40
    DB #01,#4E,#01,#00,#01,#0E,#01,#88,#01,#40,#02,#44,#03,#EE,#01,#E4
    DB #01,#44,#01,#EE,#01,#44,#01,#40,#01,#04,#01,#88,#01,#E0,#01,#00
    DB #01,#E4,#01,#04,#01,#40,#10,#00,#01,#77,#0D,#00,#01,#07,#01,#72
    DB #01,#20,#04,#00,#01,#72,#01,#22,#41,#00,#01,#0E,#02,#EE,#01,#E0
    DB #01,#EE,#01,#88,#01,#EE,#01,#04,#08,#44,#01,#00,#01,#EE,#01,#88
    DB #04,#EE,#01,#E0,#1F,#00,#01,#77,#05,#00,#01,#02,#01,#20,#41,#00
    DB #01,#0E,#01,#EE,#01,#E0,#02,#EE,#01,#E0,#01,#EE,#01,#04,#08,#44
    DB #01,#00,#01,#EE,#01,#04,#02,#EE,#01,#0E,#01,#EE,#01,#80,#68,#00
    DB #01,#E8,#01,#EE,#01,#E0,#02,#EE,#01,#00,#01,#EE,#01,#04,#01,#44
    DB #01,#40,#03,#44,#01,#40,#01,#04,#01,#44,#01,#00,#01,#EE,#01,#00
    DB #02,#EE,#01,#0E,#01,#EE,#01,#8E,#67,#00,#01,#0E,#01,#E8,#01,#EE
    DB #01,#E0,#01,#EE,#01,#0E,#01,#E0,#01,#40,#01,#00,#01,#44,#01,#40
    DB #03,#44,#01,#40,#01,#04,#01,#44,#01,#00,#02,#0E,#01,#E0,#01,#EE
    DB #01,#0E,#01,#EE,#01,#8E,#01,#E0,#66,#00,#01,#0E,#01,#E0,#01,#EE
    DB #01,#00,#01,#EE,#01,#00,#01,#EE,#02,#00,#01,#04,#01,#40,#04,#00
    DB #01,#04,#01,#40,#02,#00,#01,#EE,#01,#00,#01,#EE,#01,#00,#01,#EE
    DB #01,#0E,#01,#E0,#67,#00,#01,#EE,#02,#0E,#01,#E0,#03,#00,#01,#E0
    DB #01,#EE,#01,#00,#01,#E0,#02,#00,#01,#EE,#01,#00,#01,#EE,#01,#0E
    DB #03,#00,#01,#0E,#02,#E0,#01,#EE,#68,#00,#01,#EE,#01,#E0,#01,#00
    DB #01,#0E,#01,#E4,#01,#40,#01,#44,#02,#E0,#01,#0E,#01,#EE,#02,#00
    DB #01,#EE,#01,#00,#02,#0E,#01,#40,#01,#04,#01,#4E,#01,#E0,#01,#00
    DB #01,#EE,#01,#E0,#6B,#00,#04,#44,#03,#00,#01,#0E,#02,#EE,#02,#00
    DB #01,#0E,#01,#40,#02,#44,#01,#4E,#01,#EE,#6E,#00,#01,#44,#01,#4E
    DB #01,#EE,#01,#44,#01,#0E,#01,#EE,#02,#E0,#02,#EE,#02,#0E,#01,#EE
    DB #01,#E0,#01,#4E,#01,#EE,#01,#E4,#01,#EE,#6E,#00,#01,#44,#01,#4E
    DB #01,#A8,#01,#40,#01,#0E,#02,#EE,#01,#E0,#01,#EF,#01,#BE,#01,#0E
    DB #02,#EE,#01,#E0,#01,#0E,#01,#BE,#01,#E4,#01,#44,#6E,#00,#01,#E0
    DB #02,#44,#01,#40,#01,#E0,#01,#00,#01,#EE,#01,#E0,#01,#EF,#01,#BE
    DB #01,#0E,#01,#EE,#01,#00,#01,#0E,#01,#04,#02,#44,#01,#0E,#6E,#00
    DB #01,#EE,#02,#44,#01,#00,#01,#EE,#01,#0E,#02,#E0,#02,#00,#02,#0E
    DB #01,#E0,#01,#EE,#01,#00,#02,#44,#01,#EE,#6E,#00,#01,#EE,#03,#00
    DB #01,#E0,#01,#0E,#01,#E0,#01,#00,#01,#4F,#01,#B4,#01,#00,#01,#0E
    DB #01,#E0,#01,#0E,#03,#00,#01,#EE,#6E,#00,#01,#44,#03,#EE,#04,#00
    DB #01,#4B,#01,#A4,#04,#00,#03,#EE,#01,#44,#6E,#00,#01,#4E,#03,#EE
    DB #01,#E0,#03,#00,#01,#40,#01,#04,#03,#00,#01,#0E,#03,#EE,#01,#40
    DB #6E,#00,#01,#0E,#03,#EE,#01,#E0,#08,#00,#01,#0E,#03,#EE,#01,#E0
    DB #6F,#00,#02,#EE,#01,#E0,#0A,#00,#01,#0E,#02,#EE,#44,#00
bitmap_room_tileset_rle_chunk_0_end:

; Linked HUD dynamic widget #0 (iconRow) tile/glyph data, packed 4bpp RLE; VRAM #06A00, raw 2048 bytes, RLE 170 bytes
bitmap_room_hud_linked_0_rle_chunk_0:
    DB #10,#11,#70,#00,#01,#11,#01,#77,#01,#11,#01,#77,#05,#11,#01,#33
    DB #01,#11,#01,#33,#04,#11,#70,#00,#01,#17,#01,#55,#01,#77,#01,#55
    DB #01,#71,#03,#11,#01,#13,#03,#11,#01,#31,#03,#11,#70,#00,#01,#17
    DB #03,#55,#01,#71,#03,#11,#01,#13,#03,#11,#01,#31,#03,#11,#70,#00
    DB #01,#17,#01,#56,#01,#55,#01,#65,#01,#71,#03,#11,#01,#13,#03,#11
    DB #01,#31,#03,#11,#70,#00,#01,#11,#01,#75,#01,#55,#01,#57,#05,#11
    DB #01,#31,#01,#11,#01,#13,#04,#11,#70,#00,#01,#11,#01,#17,#01,#55
    DB #01,#71,#05,#11,#01,#13,#01,#11,#01,#31,#04,#11,#70,#00,#02,#11
    DB #01,#77,#07,#11,#01,#33,#05,#11,#70,#00,#10,#11,#70,#00,#10,#11
    DB #70,#00,#10,#11,#70,#00,#10,#11,#70,#00,#10,#11,#70,#00,#10,#11
    DB #70,#00,#10,#11,#70,#00,#10,#11,#70,#00
bitmap_room_hud_linked_0_rle_chunk_0_end:

; Linked HUD dynamic widget #1 (counter) tile/glyph data, packed 4bpp RLE; VRAM #07200, raw 1024 bytes, RLE 452 bytes
bitmap_room_hud_linked_1_rle_chunk_0:
    DB #01,#11,#02,#66,#02,#11,#01,#16,#01,#61,#02,#11,#02,#66,#02,#11
    DB #02,#66,#03,#11,#01,#66,#01,#11,#01,#16,#02,#66,#01,#61,#01,#11
    DB #01,#16,#01,#66,#01,#11,#01,#16,#02,#66,#01,#61,#01,#11,#02,#66
    DB #02,#11,#02,#66,#01,#11,#58,#00,#01,#17,#01,#61,#01,#16,#01,#71
    DB #01,#11,#01,#66,#01,#61,#01,#11,#01,#17,#01,#61,#01,#16,#01,#71
    DB #01,#17,#01,#61,#01,#16,#01,#71,#01,#11,#01,#16,#01,#66,#01,#11
    DB #01,#17,#01,#61,#03,#11,#01,#66,#04,#11,#01,#16,#01,#71,#01,#17
    DB #01,#61,#01,#16,#01,#71,#01,#17,#01,#61,#01,#16,#01,#71,#58,#00
    DB #01,#17,#01,#61,#01,#66,#01,#71,#01,#11,#01,#16,#01,#61,#03,#11
    DB #01,#16,#01,#71,#02,#11,#01,#16,#01,#71,#01,#11,#02,#66,#01,#11
    DB #01,#17,#02,#66,#01,#11,#01,#17,#01,#61,#04,#11,#01,#66,#01,#11
    DB #01,#17,#01,#61,#01,#16,#01,#71,#01,#17,#01,#61,#01,#16,#01,#71
    DB #58,#00,#01,#17,#01,#66,#01,#16,#01,#71,#01,#11,#01,#16,#01,#61
    DB #02,#11,#01,#16,#01,#66,#02,#11,#01,#16,#01,#66,#01,#11,#01,#17
    DB #01,#61,#01,#66,#03,#11,#01,#16,#01,#71,#01,#17,#02,#66,#02,#11
    DB #01,#16,#01,#61,#02,#11,#02,#66,#02,#11,#02,#66,#01,#71,#58,#00
    DB #01,#17,#01,#61,#01,#16,#01,#71,#01,#11,#01,#16,#01,#61,#02,#11
    DB #01,#66,#04,#11,#01,#16,#01,#71,#01,#17,#02,#66,#01,#71,#02,#11
    DB #01,#16,#01,#71,#01,#17,#01,#61,#01,#16,#01,#71,#01,#11,#01,#66
    DB #02,#11,#01,#17,#01,#61,#01,#16,#01,#71,#02,#11,#01,#16,#01,#71
    DB #58,#00,#01,#17,#01,#61,#01,#16,#01,#71,#01,#11,#01,#16,#01,#61
    DB #01,#11,#01,#17,#01,#61,#02,#11,#01,#17,#01,#61,#01,#16,#01,#71
    DB #02,#11,#01,#66,#01,#11,#01,#17,#01,#61,#01,#16,#01,#71,#01,#17
    DB #01,#61,#01,#16,#01,#71,#01,#11,#01,#66,#02,#11,#01,#17,#01,#61
    DB #01,#16,#01,#71,#02,#11,#01,#66,#01,#11,#58,#00,#01,#11,#02,#66
    DB #01,#11,#01,#17,#02,#66,#01,#71,#01,#17,#02,#66,#01,#71,#01,#11
    DB #02,#66,#03,#11,#01,#66,#02,#11,#02,#66,#02,#11,#02,#66,#02,#11
    DB #01,#66,#03,#11,#02,#66,#02,#11,#01,#66,#01,#61,#01,#11,#58,#00
    DB #28,#11,#58,#00
bitmap_room_hud_linked_1_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_4_USED_END:
    ds 1620, #FF
    org BITMAP_ROOM_DATA_BANK_4_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_5_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_5_ROM_START:
; Room 0 page 0 render program: 194 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_0_p0_end:

; Room 0 page 1 render program: 194 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_0_p1_end:

; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#40,#00,#00,#00,#00,#00,#00,#00,#00,#40,#40,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#40,#40,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#90,#90,#90,#90,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#90,#90,#90,#90,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#90,#90,#90,#90,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#90,#90,#90,#90,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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

BITMAP_ROOM_DATA_BANK_5_USED_END:
    ds 1988, #FF
    org BITMAP_ROOM_DATA_BANK_5_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_6_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_6_ROM_START:
; Room 1 page 0 render program: 189 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#10,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#00,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#40,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #50,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#00,#02,#C0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#C0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#D0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0
bitmap_room_render_1_p0_end:

; Room 1 page 1 render program: 189 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#10,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#90,#00,#00,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#40,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #50,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#00,#02,#C0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#C0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#D0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0
bitmap_room_render_1_p1_end:

; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#40,#40,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#10,#10,#10,#00,#00,#00,#00,#00,#40,#10
    DB #10,#10,#00,#00,#00,#00,#40,#40,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#11,#11,#11,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#10
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#30,#30,#30,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
bitmap_room_behavior_1_end:

BITMAP_ROOM_DATA_BANK_6_USED_END:
    ds 2138, #FF
    org BITMAP_ROOM_DATA_BANK_6_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_7_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_7_ROM_START:
; Room 2 page 0 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_2_p0_end:

; Room 2 page 1 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_2_p1_end:

; Room 2 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_2:
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#11,#11,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#40,#40,#00,#00,#00,#00,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10
    DB #10,#10,#90,#90,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#90,#90,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
bitmap_room_collision_2_end:

; Room 2 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_2:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00,#00,#00,#00,#00
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

BITMAP_ROOM_DATA_BANK_7_USED_END:
    ds 2018, #FF
    org BITMAP_ROOM_DATA_BANK_7_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_8_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_8_ROM_START:
; Room 3 page 0 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#00,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#60,#00,#00,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#00,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_3_p0_end:

; Room 3 page 1 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#00,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#60,#00,#00,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#00,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#C0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_3_p1_end:

; Room 3 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_3:
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#01,#11,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#11,#11,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#00,#00,#00,#40,#40,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
bitmap_room_collision_3_end:

; Room 3 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#C0,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
bitmap_room_behavior_3_end:

BITMAP_ROOM_DATA_BANK_8_USED_END:
    ds 2018, #FF
    org BITMAP_ROOM_DATA_BANK_8_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_9_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_9_ROM_START:
; Room 4 page 0 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00
    DB #00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#C0,#00,#00,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#C0,#00,#00,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00
    DB #00,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_4_p0_end:

; Room 4 page 1 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00
    DB #00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#C0,#00,#00,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#C0,#00,#00,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00
    DB #00,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_4_p1_end:

; Room 4 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_4:
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#11,#11,#11,#10,#10,#10,#10,#10,#10,#10
    DB #10,#11,#11,#00,#00,#00,#40,#40,#40,#10,#10,#10,#10,#10,#10,#10
    DB #10,#40,#00,#00,#00,#00,#00,#00,#00,#90,#90,#90,#90,#90,#90,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#90,#90,#90,#90,#90,#90,#10
    DB #10,#00,#00,#00,#00,#11,#11,#11,#11,#10,#10,#10,#10,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#10
    DB #10,#11,#11,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#10
bitmap_room_collision_4_end:

; Room 4 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_4:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#C0,#C0,#C0,#00,#00,#00,#00,#00,#00,#00
    DB #00,#C0,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#C0,#C0,#C0,#C0,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#C0,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
bitmap_room_behavior_4_end:

BITMAP_ROOM_DATA_BANK_9_USED_END:
    ds 2018, #FF
    org BITMAP_ROOM_DATA_BANK_9_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_10_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_10_ROM_START:
; Room 5 page 0 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_5_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#00,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#00,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#00,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_5_p0_end:

; Room 5 page 1 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_5_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#00,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#00,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#00,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #30,#00,#10,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_5_p1_end:

; Room 5 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_5:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#40,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
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

BITMAP_ROOM_DATA_BANK_10_USED_END:
    ds 2018, #FF
    org BITMAP_ROOM_DATA_BANK_10_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_11_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_11_ROM_START:
; Room 6 page 0 render program: 194 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_6_p0_end:

; Room 6 page 1 render program: 194 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#10,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00
    DB #10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#30,#00,#10,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#30,#00,#10,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#10,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#30,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#10,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_6_p1_end:

; Room 6 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_6:
    DB #10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
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

BITMAP_ROOM_DATA_BANK_11_USED_END:
    ds 1988, #FF
    org BITMAP_ROOM_DATA_BANK_11_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_12_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_12_ROM_START:
; GameFlow intro scene #0 SCREEN 5 bitmap, packed 4bpp RLE; VRAM #00000, raw 16384 bytes, RLE 7100 bytes
bitmap_intro_scene0_rle_chunk_0:
    DB #FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#37,#11,#01,#1F
    DB #7F,#11,#01,#EB,#01,#91,#26,#11,#01,#1F,#01,#F1,#56,#11,#01,#1A
    DB #1B,#11,#01,#EF,#01,#FF,#01,#F1,#08,#11,#01,#16,#01,#9F,#01,#FF
    DB #70,#11,#01,#EF,#03,#FF,#01,#F8,#01,#61,#09,#11,#01,#91,#58,#11
    DB #01,#1B,#09,#11,#01,#1F,#01,#BF,#01,#FF,#02,#AA,#01,#81,#06,#11
    DB #01,#1F,#01,#FF,#01,#F8,#01,#88,#01,#8B,#01,#FF,#01,#F8,#63,#11
    DB #01,#1A,#09,#11,#01,#1B,#02,#BB,#02,#AA,#01,#81,#06,#11,#01,#1F
    DB #01,#AA,#01,#88,#01,#11,#01,#6B,#01,#FF,#01,#F6,#63,#11,#01,#6F
    DB #01,#A1,#06,#11,#01,#1F,#01,#FF,#01,#BA,#04,#88,#01,#8A,#01,#89
    DB #01,#81,#03,#11,#01,#FB,#01,#96,#01,#61,#02,#11,#01,#1F,#01,#FF
    DB #01,#A1,#38,#11,#08,#BB,#01,#B1,#02,#11,#01,#1E,#01,#BB,#01,#BF
    DB #01,#FB,#03,#BB,#01,#B1,#03,#11,#01,#FB,#06,#BB,#01,#F1,#01,#1F
    DB #03,#BB,#02,#11,#01,#CF,#02,#BB,#01,#BF,#01,#B1,#02,#11,#01,#BF
    DB #01,#F1,#05,#11,#01,#1F,#01,#BA,#06,#88,#01,#68,#01,#86,#01,#68
    DB #01,#86,#01,#11,#01,#1B,#01,#61,#04,#11,#01,#1F,#01,#A8,#01,#61
    DB #01,#EF,#03,#BB,#01,#C1,#02,#11,#02,#FB,#01,#BB,#01,#BF,#02,#11
    DB #01,#1F,#06,#BB,#01,#B1,#02,#11,#01,#FB,#07,#BB,#03,#11,#01,#1B
    DB #06,#BB,#01,#F1,#0D,#11,#01,#1C,#08,#BB,#01,#B1,#02,#11,#01,#1B
    DB #06,#BB,#01,#B1,#03,#11,#01,#FB,#06,#BB,#01,#B1,#01,#1B,#03,#BB
    DB #02,#11,#01,#CB,#03,#BB,#01,#B1,#01,#11,#01,#BB,#02,#FF,#01,#A8
    DB #04,#11,#01,#BB,#01,#AA,#06,#88,#01,#68,#01,#86,#01,#66,#01,#86
    DB #01,#81,#05,#11,#01,#1C,#01,#FF,#01,#88,#01,#11,#01,#EB,#03,#BB
    DB #01,#C1,#02,#11,#01,#FB,#02,#BB,#01,#BF,#02,#11,#01,#1F,#06,#BB
    DB #01,#B1,#02,#11,#01,#FB,#07,#BB,#01,#B1,#02,#11,#01,#1F,#06,#BB
    DB #01,#B1,#0D,#11,#01,#1B,#08,#AA,#01,#AB,#02,#11,#01,#BA,#06,#AA
    DB #01,#AB,#02,#11,#01,#1B,#07,#AA,#01,#A1,#01,#1A,#02,#AA,#01,#AB
    DB #02,#11,#01,#BA,#03,#AA,#03,#11,#01,#AF,#01,#B1,#04,#11,#01,#BF
    DB #01,#98,#01,#88,#01,#66,#02,#88,#02,#86,#01,#88,#01,#86,#01,#68
    DB #03,#66,#05,#11,#01,#EF,#01,#B8,#01,#61,#01,#11,#04,#AA,#03,#11
    DB #01,#BA,#03,#AA,#02,#11,#01,#1B,#06,#AA,#01,#AB,#02,#11,#01,#BB
    DB #07,#AA,#01,#AB,#01,#11,#01,#1F,#01,#BA,#06,#AA,#01,#AB,#0D,#11
    DB #01,#1B,#09,#AA,#02,#11,#08,#AA,#02,#11,#08,#AA,#01,#B1,#01,#1A
    DB #02,#AA,#01,#AB,#02,#11,#01,#BA,#02,#AA,#01,#A6,#01,#14,#02,#11
    DB #01,#1F,#04,#11,#01,#FF,#01,#A9,#01,#88,#01,#61,#01,#66,#01,#88
    DB #01,#68,#01,#86,#01,#88,#01,#86,#06,#66,#03,#11,#01,#1F,#01,#FA
    DB #01,#86,#02,#11,#04,#AA,#03,#11,#04,#AA,#02,#11,#01,#1B,#07,#AA
    DB #02,#11,#01,#1A,#08,#AA,#01,#B1,#01,#1F,#07,#AA,#01,#AB,#0D,#11
    DB #01,#1B,#09,#AA,#01,#C1,#01,#11,#08,#AA,#02,#11,#08,#AA,#01,#A1
    DB #01,#1A,#02,#AA,#01,#AB,#02,#11,#03,#AA,#01,#A6,#01,#14,#02,#11
    DB #01,#1B,#04,#11,#01,#FF,#01,#AA,#01,#88,#01,#61,#01,#66,#01,#88
    DB #01,#68,#01,#86,#01,#88,#01,#86,#06,#66,#03,#11,#01,#1F,#01,#AA
    DB #01,#81,#02,#11,#04,#AA,#01,#A6,#02,#11,#04,#AA,#02,#11,#01,#1B
    DB #07,#AA,#01,#11,#01,#14,#01,#1A,#08,#AA,#01,#B1,#01,#1B,#08,#AA
    DB #0D,#11,#0A,#AA,#01,#C4,#01,#11,#08,#AA,#01,#11,#01,#1A,#08,#AA
    DB #01,#A1,#01,#1A,#03,#AA,#01,#11,#01,#1A,#03,#AA,#01,#B1,#01,#41
    DB #02,#11,#01,#18,#03,#11,#01,#1F,#01,#BB,#01,#AA,#01,#86,#01,#16
    DB #01,#8A,#01,#88,#01,#86,#01,#66,#01,#88,#01,#86,#04,#66,#03,#61
    DB #01,#11,#01,#19,#01,#FA,#01,#81,#03,#11,#04,#AA,#01,#AF,#01,#11
    DB #01,#1F,#04,#AA,#02,#11,#01,#1B,#07,#AA,#01,#B1,#01,#14,#01,#1A
    DB #08,#AA,#01,#BA,#01,#1A,#08,#AA,#01,#C1,#0C,#11,#0A,#AA,#01,#14
    DB #01,#1B,#08,#AA,#01,#11,#01,#1A,#08,#AA,#01,#11,#01,#FA,#03,#AA
    DB #01,#11,#01,#BA,#03,#AA,#01,#11,#01,#14,#06,#11,#01,#F9,#01,#AA
    DB #01,#A9,#04,#88,#01,#68,#02,#86,#07,#66,#01,#16,#01,#11,#01,#FF
    DB #01,#A8,#04,#11,#01,#2A,#03,#AA,#01,#AB,#01,#11,#01,#1B,#04,#AA
    DB #01,#A1,#01,#11,#01,#1B,#07,#AA,#01,#B1,#01,#11,#01,#1A,#09,#AA
    DB #01,#11,#07,#AA,#01,#AB,#01,#F1,#0C,#11,#0A,#AA,#01,#14,#01,#1A
    DB #08,#AA,#01,#11,#01,#1A,#08,#AA,#01,#11,#01,#BA,#03,#AA,#01,#11
    DB #01,#BA,#03,#AA,#01,#11,#01,#41,#06,#11,#01,#FB,#01,#A8,#01,#A9
    DB #04,#88,#01,#68,#02,#86,#07,#66,#01,#61,#01,#1F,#01,#BB,#01,#81
    DB #04,#11,#01,#2A,#03,#AA,#01,#AB,#01,#11,#01,#1A,#04,#AA,#01,#A1
    DB #01,#14,#01,#1B,#07,#AA,#01,#B1,#01,#14,#01,#1A,#09,#AA,#01,#11
    DB #07,#AA,#01,#AB,#01,#F1,#0D,#11,#03,#AA,#01,#A1,#01,#11,#01,#1A
    DB #03,#AA,#01,#11,#01,#CA,#03,#AA,#01,#66,#01,#6A,#03,#AA,#01,#11
    DB #01,#1A,#03,#AA,#01,#66,#01,#6A,#03,#AA,#01,#11,#03,#AA,#01,#A1
    DB #01,#16,#03,#AA,#01,#A1,#02,#14,#05,#11,#01,#1F,#01,#BB,#05,#88
    DB #01,#86,#05,#66,#01,#61,#03,#66,#01,#16,#01,#1E,#01,#BA,#01,#88
    DB #01,#61,#04,#11,#01,#6A,#04,#AA,#01,#A1,#01,#1A,#04,#AA,#01,#A1
    DB #01,#41,#01,#1A,#03,#AA,#01,#66,#01,#6A,#02,#AA,#01,#A1,#01,#11
    DB #01,#1A,#03,#AA,#01,#B1,#01,#11,#01,#1A,#03,#AA,#01,#11,#04,#AA
    DB #11,#11,#01,#41,#03,#AA,#01,#A1,#01,#41,#01,#6A,#02,#AA,#01,#A1
    DB #01,#11,#01,#6A,#02,#AA,#01,#A1,#01,#11,#01,#1A,#02,#AA,#01,#A1
    DB #01,#11,#04,#AA,#01,#11,#01,#1A,#03,#AA,#01,#11,#03,#AA,#01,#A1
    DB #01,#1A,#03,#AA,#01,#A1,#01,#41,#06,#11,#01,#F9,#01,#98,#02,#88
    DB #01,#86,#08,#66,#01,#16,#03,#66,#01,#11,#01,#BF,#01,#B8,#05,#11
    DB #01,#41,#05,#AA,#01,#A1,#05,#AA,#01,#A6,#02,#11,#03,#AA,#01,#11
    DB #01,#1A,#03,#AA,#01,#11,#01,#41,#03,#AA,#01,#A1,#01,#44,#01,#11
    DB #03,#AA,#01,#A1,#01,#1A,#03,#AA,#01,#14,#03,#44,#01,#41,#0C,#11
    DB #01,#41,#03,#AA,#01,#A1,#01,#41,#01,#6A,#02,#AA,#01,#A1,#01,#41
    DB #01,#6A,#02,#AA,#01,#A1,#01,#41,#01,#1A,#02,#AA,#01,#A1,#01,#41
    DB #04,#AA,#01,#14,#01,#1A,#03,#AA,#01,#11,#03,#AA,#01,#A1,#01,#1A
    DB #03,#AA,#01,#A1,#01,#44,#06,#11,#01,#F9,#01,#98,#02,#88,#01,#86
    DB #08,#66,#01,#16,#03,#66,#01,#1F,#01,#FA,#01,#86,#05,#11,#01,#41
    DB #05,#AA,#01,#A1,#05,#AA,#01,#A6,#01,#14,#01,#11,#03,#AA,#01,#14
    DB #01,#1A,#03,#AA,#01,#11,#01,#41,#03,#AA,#01,#A1,#01,#44,#01,#11
    DB #03,#AA,#01,#A1,#01,#1A,#03,#AA,#01,#14,#03,#44,#01,#41,#0C,#11
    DB #01,#1A,#03,#AA,#01,#14,#01,#41,#03,#AA,#01,#A1,#01,#11,#03,#AA
    DB #01,#A1,#01,#41,#03,#AA,#01,#A1,#01,#11,#03,#AA,#01,#A6,#01,#14
    DB #05,#11,#03,#AA,#01,#A1,#04,#AA,#01,#14,#03,#11,#01,#19,#02,#11
    DB #01,#1E,#01,#99,#01,#A8,#02,#88,#0C,#66,#01,#11,#01,#FF,#01,#A6
    DB #01,#61,#05,#11,#01,#41,#01,#6A,#04,#AA,#01,#A1,#05,#AA,#01,#A6
    DB #01,#11,#01,#41,#03,#AA,#01,#14,#01,#1A,#03,#AA,#01,#11,#01,#41
    DB #03,#AA,#01,#A1,#02,#41,#03,#AA,#01,#A1,#01,#1A,#03,#AA,#01,#11
    DB #01,#14,#02,#44,#0B,#11,#01,#91,#01,#11,#01,#1A,#03,#AA,#01,#14
    DB #01,#41,#03,#AA,#01,#A1,#01,#11,#03,#AA,#01,#A1,#01,#41,#03,#AA
    DB #01,#A1,#01,#11,#03,#AA,#01,#A6,#01,#14,#05,#11,#03,#AA,#01,#A1
    DB #04,#AA,#01,#14,#01,#44,#02,#11,#01,#1F,#02,#11,#01,#1B,#01,#99
    DB #03,#88,#0B,#66,#01,#61,#01,#1F,#01,#BA,#01,#81,#04,#11,#01,#1F
    DB #01,#F1,#01,#41,#01,#6A,#04,#AA,#01,#A6,#05,#AA,#01,#A6,#01,#11
    DB #01,#41,#03,#AA,#01,#14,#01,#1A,#03,#AA,#01,#11,#01,#41,#03,#AA
    DB #01,#A1,#02,#41,#03,#AA,#01,#A1,#01,#1A,#03,#AA,#01,#11,#01,#41
    DB #01,#44,#01,#41,#0D,#11,#01,#1A,#03,#AA,#01,#14,#01,#11,#03,#AA
    DB #01,#A1,#01,#11,#03,#AA,#01,#61,#01,#11,#01,#6A,#02,#AA,#01,#A1
    DB #01,#1A,#03,#AA,#01,#A1,#01,#41,#01,#14,#03,#44,#01,#11,#07,#AA
    DB #01,#A1,#04,#11,#01,#1F,#02,#11,#01,#1F,#04,#88,#0A,#66,#01,#61
    DB #01,#1B,#01,#FA,#01,#86,#05,#11,#01,#1F,#01,#FA,#01,#11,#01,#6A
    DB #0A,#AA,#01,#A6,#01,#11,#01,#41,#03,#AA,#01,#14,#01,#41,#03,#AA
    DB #01,#A1,#01,#41,#01,#6A,#03,#AA,#01,#14,#01,#41,#03,#AA,#01,#A6
    DB #01,#1A,#03,#AA,#01,#A1,#0C,#11,#01,#E1,#03,#11,#03,#AA,#01,#A1
    DB #01,#11,#01,#1A,#03,#AA,#01,#14,#01,#1A,#03,#AA,#01,#14,#01,#11
    DB #03,#AA,#01,#A1,#01,#1A,#03,#AA,#01,#A1,#01,#41,#01,#11,#01,#44
    DB #02,#41,#01,#11,#07,#AA,#01,#11,#01,#44,#06,#11,#01,#1F,#01,#8A
    DB #01,#A8,#01,#66,#07,#11,#01,#16,#08,#11,#01,#16,#06,#11,#01,#6A
    DB #0B,#AA,#02,#11,#03,#AA,#01,#A1,#01,#41,#03,#AA,#01,#A1,#01,#14
    DB #01,#1A,#03,#AA,#02,#11,#04,#AA,#01,#11,#07,#AA,#01,#A1,#08,#11
    DB #01,#91,#03,#11,#03,#AA,#01,#A1,#01,#11,#01,#1A,#03,#AA,#01,#14
    DB #01,#1A,#03,#AA,#01,#14,#01,#11,#03,#AA,#01,#A1,#01,#1A,#03,#AA
    DB #01,#A1,#01,#41,#01,#11,#03,#44,#01,#11,#07,#AA,#01,#11,#02,#41
    DB #05,#11,#01,#19,#02,#88,#01,#66,#07,#44,#01,#11,#01,#14,#04,#44
    DB #01,#41,#02,#11,#01,#16,#01,#61,#04,#11,#01,#41,#01,#6A,#0B,#AA
    DB #01,#11,#01,#41,#03,#AA,#01,#A1,#01,#41,#03,#AA,#01,#A1,#01,#44
    DB #01,#1A,#03,#AA,#02,#11,#03,#AA,#01,#A6,#01,#11,#07,#AA,#01,#A1
    DB #02,#11,#01,#FF,#01,#F1,#03,#11,#01,#16,#01,#FD,#03,#11,#09,#AA
    DB #01,#11,#01,#1A,#03,#AA,#01,#14,#01,#16,#03,#AA,#01,#A1,#01,#1A
    DB #03,#AA,#01,#A1,#02,#11,#01,#44,#02,#41,#01,#11,#07,#AA,#01,#14
    DB #07,#11,#01,#F9,#02,#88,#01,#61,#01,#EF,#06,#FF,#01,#14,#01,#7F
    DB #04,#FF,#01,#F4,#01,#11,#01,#66,#01,#61,#05,#11,#01,#41,#01,#6A
    DB #0B,#AA,#02,#11,#03,#AA,#01,#A1,#01,#41,#03,#AA,#01,#A1,#01,#14
    DB #01,#1A,#09,#AA,#01,#11,#08,#AA,#01,#A1,#01,#16,#01,#6B,#04,#11
    DB #02,#FF,#01,#F1,#02,#11,#08,#AA,#01,#61,#01,#11,#03,#AA,#01,#A1
    DB #01,#11,#01,#16,#03,#AA,#01,#11,#01,#1A,#03,#AA,#01,#A1,#01,#41
    DB #01,#11,#03,#44,#01,#11,#07,#AA,#0C,#11,#06,#FF,#01,#F7,#01,#1F
    DB #05,#FF,#01,#F9,#09,#11,#01,#6A,#0B,#AA,#01,#11,#01,#41,#03,#AA
    DB #01,#A1,#01,#14,#01,#1A,#02,#AA,#01,#A6,#01,#11,#01,#1A,#09,#AA
    DB #01,#11,#01,#1A,#08,#AA,#06,#11,#01,#1E,#01,#FF,#03,#11,#07,#AA
    DB #01,#A6,#01,#11,#01,#41,#03,#AA,#01,#A1,#01,#41,#01,#16,#03,#AA
    DB #01,#11,#01,#1A,#03,#AA,#01,#A4,#03,#11,#01,#14,#01,#41,#01,#16
    DB #07,#AA,#02,#11,#01,#16,#02,#EE,#01,#CE,#01,#DD,#01,#11,#01,#EE
    DB #01,#E6,#01,#66,#01,#11,#06,#FF,#01,#F7,#01,#1F,#05,#FF,#01,#F9
    DB #01,#11,#01,#1C,#01,#CD,#01,#6D,#01,#11,#01,#66,#01,#1C,#01,#C1
    DB #01,#11,#01,#6A,#0B,#AA,#01,#61,#01,#41,#03,#AA,#01,#A1,#01,#14
    DB #01,#1A,#02,#AA,#01,#A6,#01,#11,#01,#1A,#09,#AA,#01,#11,#01,#1A
    DB #08,#AA,#07,#11,#01,#F1,#02,#11,#01,#1A,#08,#AA,#01,#11,#01,#41
    DB #03,#AA,#01,#A1,#01,#44,#01,#1A,#03,#AA,#01,#11,#01,#1A,#03,#AA
    DB #01,#14,#01,#41,#04,#11,#01,#1A,#07,#AA,#01,#A1,#01,#47,#09,#77
    DB #01,#11,#01,#77,#01,#55,#01,#7F,#01,#FF,#01,#F4,#01,#57,#01,#74
    DB #01,#1F,#01,#FF,#01,#F4,#01,#44,#01,#5F,#01,#FF,#01,#F5,#01,#17
    DB #07,#77,#01,#71,#01,#6A,#0B,#AA,#01,#61,#01,#11,#03,#AA,#01,#A1
    DB #01,#14,#01,#1A,#03,#AA,#02,#11,#08,#AA,#01,#A1,#01,#14,#01,#1A
    DB #08,#AA,#01,#A1,#06,#11,#01,#F1,#02,#11,#01,#1A,#08,#AA,#02,#11
    DB #03,#AA,#01,#A1,#01,#41,#01,#1A,#03,#AA,#01,#11,#01,#6A,#03,#AA
    DB #01,#14,#05,#11,#01,#1A,#07,#AA,#01,#A1,#01,#45,#06,#55,#01,#77
    DB #02,#55,#01,#11,#02,#44,#01,#7F,#01,#FF,#01,#71,#02,#44,#01,#1F
    DB #01,#FF,#01,#F4,#01,#11,#01,#4F,#01,#FF,#01,#F4,#01,#17,#07,#55
    DB #01,#51,#01,#6A,#0B,#AA,#01,#A1,#01,#11,#03,#AA,#01,#A1,#01,#11
    DB #01,#1A,#03,#AA,#02,#11,#07,#AA,#01,#A8,#01,#61,#01,#14,#01,#11
    DB #08,#AA,#01,#A1,#09,#11,#01,#18,#01,#88,#01,#A8,#01,#AA,#01,#88
    DB #01,#A8,#01,#88,#01,#8A,#01,#AA,#01,#81,#01,#11,#02,#88,#01,#A8
    DB #01,#A1,#01,#11,#01,#18,#02,#88,#01,#AA,#01,#11,#02,#A8,#01,#88
    DB #01,#8A,#01,#14,#05,#11,#01,#1A,#01,#A8,#01,#88,#01,#8A,#01,#88
    DB #02,#A8,#01,#8A,#01,#A1,#01,#11,#02,#44,#01,#41,#03,#11,#02,#44
    DB #01,#41,#01,#11,#01,#44,#01,#41,#02,#FF,#01,#71,#01,#44,#01,#41
    DB #01,#1F,#01,#FF,#01,#F1,#01,#44,#01,#4F,#01,#FF,#01,#F4,#01,#14
    DB #03,#44,#01,#41,#04,#11,#01,#68,#02,#88,#01,#A8,#01,#18,#01,#A8
    DB #02,#8A,#01,#18,#01,#AA,#01,#88,#01,#A8,#01,#A1,#01,#11,#01,#A8
    DB #01,#8A,#01,#A8,#01,#A1,#01,#11,#01,#1A,#01,#A8,#01,#AA,#01,#A8
    DB #01,#A1,#01,#11,#01,#88,#03,#A8,#01,#88,#01,#AA,#01,#8A,#01,#81
    DB #02,#11,#01,#41,#01,#11,#03,#88,#01,#8A,#01,#AA,#02,#A8,#01,#A1
    DB #09,#11,#09,#88,#01,#81,#01,#18,#03,#88,#01,#8A,#01,#AA,#04,#88
    DB #01,#11,#04,#88,#01,#11,#01,#41,#04,#11,#01,#18,#07,#88,#01,#86
    DB #0D,#11,#02,#FF,#01,#E1,#02,#11,#01,#7F,#01,#FF,#01,#71,#01,#11
    DB #01,#5F,#01,#FF,#01,#F1,#09,#11,#01,#68,#03,#88,#01,#16,#03,#88
    DB #01,#18,#03,#88,#01,#81,#01,#11,#03,#88,#01,#8A,#01,#AA,#01,#A8
    DB #03,#88,#01,#A1,#01,#11,#08,#88,#01,#A1,#02,#14,#05,#11,#03,#88
    DB #01,#8A,#09,#11,#03,#88,#01,#81,#01,#11,#01,#18,#03,#88,#01,#81
    DB #01,#18,#09,#88,#01,#11,#03,#88,#01,#86,#06,#11,#01,#18,#03,#88
    DB #01,#66,#04,#88,#0C,#11,#01,#14,#02,#FF,#01,#E1,#02,#11,#01,#7F
    DB #01,#FF,#01,#51,#01,#11,#01,#7F,#01,#FF,#01,#F1,#09,#11,#01,#68
    DB #03,#88,#01,#16,#03,#88,#01,#18,#03,#88,#01,#81,#01,#11,#09,#88
    DB #01,#81,#01,#11,#03,#88,#01,#86,#01,#66,#03,#88,#01,#61,#01,#11
    DB #01,#14,#01,#41,#04,#11,#01,#68,#02,#88,#01,#8A,#09,#11,#03,#88
    DB #01,#81,#01,#44,#01,#18,#03,#88,#01,#81,#01,#18,#08,#88,#01,#86
    DB #01,#11,#03,#88,#01,#81,#01,#14,#05,#11,#01,#18,#03,#88,#01,#11
    DB #03,#88,#01,#8A,#01,#11,#0B,#77,#01,#14,#02,#FF,#01,#71,#01,#77
    DB #01,#71,#02,#FF,#01,#41,#01,#71,#01,#7F,#01,#FF,#01,#71,#01,#47
    DB #07,#77,#01,#71,#01,#68,#03,#88,#01,#11,#02,#88,#01,#86,#01,#18
    DB #03,#88,#01,#81,#01,#11,#09,#88,#01,#81,#01,#11,#01,#68,#02,#88
    DB #01,#81,#01,#11,#03,#88,#01,#86,#01,#11,#01,#44,#01,#14,#03,#44
    DB #01,#41,#01,#18,#02,#88,#01,#8A,#05,#11,#01,#1F,#02,#11,#01,#16
    DB #03,#88,#01,#61,#01,#44,#01,#18,#03,#88,#01,#11,#01,#18,#08,#88
    DB #01,#81,#01,#11,#03,#88,#01,#81,#06,#11,#04,#88,#01,#11,#01,#18
    DB #03,#88,#01,#61,#0B,#55,#01,#15,#01,#FF,#01,#F7,#01,#11,#01,#77
    DB #01,#41,#02,#FF,#02,#11,#01,#7F,#01,#FF,#01,#41,#08,#55,#01,#51
    DB #01,#68,#03,#88,#01,#11,#01,#18,#01,#88,#01,#81,#01,#18,#03,#88
    DB #01,#81,#01,#11,#0A,#88,#01,#11,#01,#68,#03,#88,#01,#11,#04,#88
    DB #01,#11,#02,#41,#02,#44,#01,#41,#01,#14,#01,#18,#03,#88,#05,#11
    DB #01,#19,#02,#11,#01,#18,#03,#88,#01,#81,#01,#44,#01,#18,#03,#88
    DB #01,#11,#01,#18,#08,#88,#01,#81,#01,#11,#03,#88,#01,#81,#06,#11
    DB #04,#88,#01,#11,#01,#18,#03,#88,#01,#61,#01,#54,#03,#44,#02,#54
    DB #05,#44,#01,#17,#01,#FF,#01,#F7,#01,#11,#01,#44,#01,#11,#02,#FF
    DB #01,#45,#01,#55,#01,#7F,#01,#FF,#01,#41,#03,#44,#01,#55,#01,#45
    DB #01,#54,#02,#44,#01,#41,#01,#68,#03,#88,#01,#11,#01,#18,#01,#88
    DB #01,#81,#01,#18,#03,#88,#01,#81,#01,#11,#0A,#88,#01,#11,#01,#68
    DB #03,#88,#01,#11,#01,#68,#03,#88,#01,#11,#01,#41,#03,#44,#01,#41
    DB #01,#14,#01,#18,#03,#88,#01,#61,#07,#11,#01,#18,#01,#88,#01,#66
    DB #01,#88,#02,#14,#01,#66,#01,#68,#01,#86,#01,#88,#01,#11,#01,#18
    DB #03,#86,#02,#66,#01,#68,#02,#86,#01,#61,#01,#11,#01,#88,#02,#68
    DB #01,#61,#01,#41,#05,#11,#01,#86,#03,#68,#01,#11,#01,#18,#02,#68
    DB #01,#88,#01,#61,#01,#41,#01,#11,#01,#41,#01,#11,#01,#44,#03,#41
    DB #01,#14,#02,#11,#01,#1F,#01,#FF,#01,#F5,#01,#11,#02,#14,#06,#FF
    DB #04,#41,#01,#44,#01,#14,#04,#41,#02,#66,#01,#88,#01,#86,#01,#11
    DB #01,#18,#01,#68,#01,#61,#01,#16,#02,#68,#01,#66,#01,#81,#01,#11
    DB #02,#68,#01,#66,#02,#86,#02,#68,#01,#88,#01,#86,#01,#88,#01,#11
    DB #01,#66,#01,#86,#01,#88,#01,#68,#01,#14,#01,#18,#01,#86,#02,#88
    DB #01,#81,#02,#14,#01,#44,#01,#41,#01,#11,#01,#44,#01,#18,#02,#68
    DB #01,#88,#01,#61,#07,#11,#01,#18,#01,#88,#01,#66,#01,#88,#01,#14
    DB #01,#11,#01,#86,#02,#88,#01,#86,#01,#11,#02,#68,#01,#88,#01,#66
    DB #01,#68,#01,#86,#02,#88,#01,#86,#01,#81,#01,#18,#01,#68,#02,#88
    DB #01,#81,#01,#41,#01,#16,#03,#66,#01,#11,#01,#88,#01,#86,#02,#88
    DB #01,#14,#01,#16,#03,#88,#01,#81,#01,#14,#01,#44,#01,#14,#06,#44
    DB #01,#14,#01,#41,#01,#1F,#01,#FF,#01,#F5,#01,#11,#01,#44,#01,#14
    DB #06,#FF,#01,#41,#08,#44,#01,#11,#01,#68,#03,#88,#02,#11,#01,#86
    DB #02,#11,#03,#88,#01,#86,#01,#11,#01,#86,#02,#88,#01,#86,#02,#88
    DB #01,#68,#01,#88,#01,#68,#01,#88,#01,#11,#01,#18,#02,#68,#01,#88
    DB #02,#11,#01,#88,#01,#68,#01,#88,#01,#86,#06,#11,#01,#16,#03,#88
    DB #01,#81,#07,#11,#01,#68,#01,#88,#01,#68,#01,#88,#01,#14,#01,#11
    DB #01,#86,#02,#88,#01,#86,#01,#11,#01,#88,#01,#66,#01,#68,#01,#86
    DB #01,#68,#01,#86,#01,#66,#01,#88,#01,#86,#01,#81,#01,#18,#01,#68
    DB #01,#88,#01,#86,#01,#81,#01,#11,#01,#18,#02,#66,#01,#88,#01,#11
    DB #04,#88,#01,#11,#01,#16,#03,#88,#01,#81,#01,#14,#07,#44,#01,#41
    DB #02,#11,#01,#1F,#01,#FF,#01,#FE,#01,#11,#01,#44,#01,#14,#01,#7F
    DB #04,#FF,#01,#F5,#01,#41,#08,#44,#01,#11,#01,#68,#02,#88,#01,#68
    DB #01,#14,#01,#11,#01,#88,#02,#11,#04,#88,#01,#11,#03,#88,#01,#66
    DB #01,#68,#01,#88,#01,#68,#03,#88,#01,#11,#01,#18,#01,#68,#02,#88
    DB #02,#11,#01,#68,#03,#88,#06,#11,#01,#16,#03,#88,#01,#81,#07,#11
    DB #03,#66,#01,#61,#02,#11,#03,#66,#01,#81,#01,#16,#01,#86,#02,#66
    DB #01,#81,#02,#11,#03,#66,#01,#61,#01,#16,#02,#66,#01,#68,#01,#61
    DB #01,#11,#01,#16,#02,#86,#01,#68,#01,#11,#04,#66,#02,#11,#04,#66
    DB #07,#11,#01,#86,#01,#61,#01,#18,#01,#81,#01,#14,#02,#44,#02,#11
    DB #02,#14,#04,#44,#01,#41,#0A,#11,#04,#66,#01,#11,#01,#41,#01,#68
    DB #01,#14,#01,#11,#04,#66,#01,#11,#03,#66,#01,#68,#02,#11,#01,#16
    DB #03,#66,#01,#61,#01,#18,#03,#66,#01,#61,#01,#41,#01,#16,#03,#66
    DB #01,#61,#01,#16,#01,#68,#01,#86,#06,#66,#01,#86,#05,#11,#01,#18
    DB #01,#88,#04,#66,#02,#68,#03,#66,#01,#81,#01,#16,#01,#86,#02,#66
    DB #01,#81,#01,#41,#01,#11,#01,#86,#02,#66,#01,#61,#01,#16,#02,#66
    DB #01,#68,#01,#66,#01,#88,#01,#86,#02,#66,#01,#88,#01,#11,#04,#66
    DB #02,#11,#04,#66,#02,#11,#01,#A8,#04,#11,#01,#61,#01,#1A,#01,#88
    DB #01,#61,#03,#11,#01,#16,#01,#66,#01,#11,#01,#41,#04,#11,#01,#14
    DB #01,#16,#01,#61,#08,#11,#04,#66,#01,#11,#01,#41,#01,#68,#01,#14
    DB #01,#11,#04,#66,#01,#11,#03,#66,#01,#68,#02,#11,#01,#16,#03,#66
    DB #01,#81,#01,#16,#03,#66,#01,#81,#01,#11,#01,#16,#03,#66,#01,#61
    DB #01,#16,#09,#66,#05,#11,#01,#18,#0A,#66,#01,#61,#01,#16,#03,#66
    DB #01,#61,#01,#44,#01,#41,#03,#66,#01,#61,#01,#16,#09,#66,#01,#11
    DB #04,#66,#01,#11,#01,#41,#04,#66,#01,#61,#01,#18,#01,#81,#04,#11
    DB #01,#1A,#01,#A8,#01,#86,#01,#11,#01,#14,#01,#44,#01,#41,#01,#16
    DB #01,#66,#01,#61,#05,#44,#01,#41,#01,#16,#09,#11,#01,#16,#03,#66
    DB #01,#11,#01,#41,#01,#66,#01,#11,#01,#41,#03,#66,#01,#68,#01,#11
    DB #04,#66,#01,#14,#01,#44,#01,#16,#03,#66,#01,#61,#01,#16,#03,#66
    DB #01,#61,#01,#11,#01,#16,#04,#66,#01,#11,#09,#66,#05,#11,#01,#16
    DB #0A,#66,#01,#61,#01,#16,#03,#66,#01,#61,#01,#14,#01,#11,#03,#66
    DB #01,#61,#01,#16,#09,#66,#01,#11,#04,#66,#01,#11,#01,#41,#04,#66
    DB #01,#81,#01,#68,#01,#61,#03,#11,#01,#1B,#01,#B8,#01,#86,#02,#11
    DB #01,#14,#01,#44,#01,#41,#01,#16,#01,#66,#01,#61,#01,#14,#02,#44
    DB #01,#41,#01,#44,#01,#11,#01,#16,#06,#11,#01,#81,#02,#11,#01,#16
    DB #03,#66,#01,#11,#01,#41,#02,#11,#01,#41,#04,#66,#01,#11,#04,#66
    DB #01,#11,#01,#41,#01,#16,#03,#66,#01,#61,#01,#11,#03,#66,#01,#61
    DB #01,#41,#01,#16,#04,#66,#01,#11,#09,#66,#05,#11,#01,#16,#09,#66
    DB #01,#68,#01,#14,#01,#16,#03,#66,#01,#14,#01,#11,#01,#16,#03,#66
    DB #01,#61,#01,#16,#08,#66,#01,#61,#01,#11,#03,#66,#01,#61,#02,#11
    DB #01,#86,#03,#66,#01,#61,#01,#18,#03,#11,#01,#AA,#01,#A8,#01,#66
    DB #06,#11,#03,#66,#06,#11,#01,#61,#09,#11,#01,#16,#03,#66,#02,#11
    DB #01,#41,#02,#11,#04,#66,#01,#11,#01,#16,#03,#66,#01,#14,#02,#11
    DB #04,#66,#01,#11,#03,#66,#01,#61,#01,#11,#01,#41,#04,#66,#01,#11
    DB #09,#66,#05,#11,#01,#16,#0A,#66,#01,#11,#01,#16,#03,#66,#01,#14
    DB #01,#11,#01,#16,#03,#66,#01,#61,#01,#11,#08,#66,#01,#61,#01,#16
    DB #03,#66,#01,#61,#02,#11,#01,#16,#03,#66,#01,#61,#02,#11,#01,#16
    DB #01,#66,#01,#88,#01,#81,#03,#11,#01,#68,#09,#66,#02,#11,#02,#61
    DB #09,#11,#04,#66,#01,#61,#02,#41,#01,#14,#01,#11,#04,#66,#01,#11
    DB #01,#16,#03,#66,#03,#11,#03,#66,#01,#68,#01,#11,#03,#66,#01,#61
    DB #02,#11,#04,#66,#01,#11,#09,#66,#05,#11,#0A,#66,#01,#61,#01,#11
    DB #04,#66,#01,#14,#01,#11,#01,#16,#03,#66,#01,#61,#01,#11,#08,#66
    DB #01,#61,#01,#18,#03,#66,#01,#61,#01,#41,#01,#11,#01,#16,#04,#66
    DB #01,#11,#01,#8A,#01,#AA,#01,#88,#01,#86,#03,#11,#01,#61,#01,#88
    DB #01,#68,#09,#66,#01,#61,#01,#11,#02,#16,#08,#11,#04,#66,#01,#61
    DB #01,#14,#01,#41,#01,#11,#01,#41,#04,#66,#01,#61,#01,#16,#03,#66
    DB #03,#11,#03,#66,#01,#68,#01,#11,#04,#66,#01,#11,#01,#41,#01,#16
    DB #03,#66,#01,#61,#01,#16,#07,#66,#01,#61,#05,#11,#09,#88,#01,#61
    DB #01,#11,#01,#41,#04,#88,#01,#11,#01,#41,#01,#18,#03,#88,#01,#61
    DB #01,#11,#01,#16,#01,#66,#06,#88,#01,#81,#01,#18,#03,#88,#01,#81
    DB #02,#11,#01,#18,#04,#88,#01,#11,#01,#AA,#01,#86,#01,#66,#04,#11
    DB #06,#66,#01,#11,#04,#66,#03,#61,#01,#11,#01,#66,#04,#11,#01,#D1
    DB #03,#11,#01,#68,#03,#88,#01,#81,#01,#14,#01,#11,#01,#14,#01,#11
    DB #04,#88,#01,#81,#01,#18,#03,#88,#01,#11,#01,#41,#01,#11,#04,#88
    DB #01,#61,#04,#88,#01,#11,#01,#14,#01,#16,#03,#88,#01,#86,#01,#18
    DB #06,#88,#01,#86,#06,#11,#09,#66,#03,#11,#04,#66,#02,#11,#01,#16
    DB #03,#66,#03,#11,#07,#66,#01,#61,#01,#16,#03,#66,#01,#61,#01,#41
    DB #01,#11,#01,#16,#04,#66,#01,#11,#01,#66,#01,#61,#01,#16,#04,#11
    DB #01,#16,#05,#66,#01,#16,#05,#66,#01,#11,#01,#66,#06,#11,#01,#91
    DB #03,#11,#01,#16,#03,#66,#01,#61,#02,#11,#01,#14,#01,#11,#04,#66
    DB #01,#61,#01,#16,#03,#66,#02,#11,#01,#41,#04,#66,#01,#11,#04,#66
    DB #01,#11,#01,#41,#01,#16,#04,#66,#01,#16,#07,#66,#0F,#11,#01,#14
    DB #01,#41,#05,#11,#01,#14,#07,#11,#01,#41,#17,#11,#01,#16,#05,#11
    DB #01,#66,#01,#61,#02,#66,#01,#61,#02,#66,#01,#16,#02,#66,#02,#16
    DB #06,#11,#01,#19,#01,#FF,#01,#91,#0A,#11,#01,#41,#0A,#11,#01,#14
    DB #0B,#11,#01,#14,#13,#11,#01,#54,#08,#44,#01,#41,#01,#14,#01,#11
    DB #04,#44,#01,#14,#01,#41,#01,#14,#02,#44,#01,#41,#01,#44,#01,#11
    DB #08,#44,#01,#41,#01,#14,#03,#44,#01,#41,#02,#11,#01,#14,#04,#44
    DB #03,#11,#01,#1F,#06,#11,#01,#16,#01,#11,#02,#66,#01,#61,#02,#16
    DB #01,#11,#02,#61,#08,#11,#01,#FF,#03,#11,#01,#14,#03,#44,#01,#41
    DB #02,#11,#01,#14,#01,#11,#04,#44,#01,#41,#01,#11,#02,#44,#01,#54
    DB #02,#11,#01,#41,#04,#44,#01,#41,#04,#44,#01,#11,#01,#41,#01,#14
    DB #04,#44,#03,#14,#03,#44,#01,#45,#01,#51,#06,#11,#01,#15,#09,#44
    DB #01,#11,#01,#41,#01,#14,#01,#44,#01,#41,#01,#44,#02,#41,#01,#11
    DB #01,#54,#01,#44,#01,#14,#01,#41,#01,#11,#01,#14,#07,#44,#01,#11
    DB #01,#14,#04,#44,#02,#11,#01,#14,#04,#44,#01,#41,#02,#11,#01,#1F
    DB #01,#D1,#08,#11,#02,#61,#01,#11,#01,#16,#0F,#11,#01,#41,#03,#44
    DB #01,#41,#03,#11,#01,#14,#04,#44,#01,#11,#03,#44,#01,#41,#01,#11
    DB #02,#14,#04,#44,#01,#14,#03,#44,#01,#41,#01,#14,#01,#11,#04,#44
    DB #03,#41,#04,#44,#01,#41,#07,#11,#01,#14,#01,#54,#06,#44,#01,#41
    DB #01,#44,#01,#14,#01,#11,#01,#14,#02,#44,#03,#41,#01,#11,#01,#54
    DB #01,#44,#02,#41,#01,#11,#01,#15,#01,#54,#04,#44,#01,#41,#02,#44
    DB #01,#14,#04,#44,#02,#11,#01,#14,#03,#44,#01,#41,#02,#11,#01,#99
    DB #02,#FF,#07,#11,#01,#66,#01,#16,#02,#11,#01,#16,#0F,#11,#01,#14
    DB #03,#44,#01,#41,#02,#11,#02,#14,#04,#44,#01,#11,#03,#44,#01,#41
    DB #01,#11,#02,#14,#03,#44,#01,#41,#01,#14,#03,#44,#01,#51,#02,#11
    DB #04,#44,#01,#41,#06,#44,#01,#41,#08,#11,#02,#45,#07,#44,#01,#41
    DB #01,#44,#01,#14,#03,#44,#01,#41,#02,#11,#03,#44,#01,#41,#01,#11
    DB #01,#14,#01,#45,#07,#44,#01,#11,#04,#44,#03,#11,#01,#54,#03,#44
    DB #01,#41,#02,#11,#01,#1F,#01,#91,#08,#11,#01,#16,#01,#61,#10,#11
    DB #01,#14,#01,#41,#03,#44,#04,#11,#01,#14,#04,#44,#01,#14,#03,#44
    DB #03,#11,#04,#44,#01,#51,#01,#14,#03,#44,#01,#11,#01,#41,#01,#14
    DB #03,#44,#01,#41,#01,#14,#05,#44,#01,#54,#09,#11,#01,#14,#01,#44
    DB #01,#54,#06,#44,#01,#14,#02,#11,#01,#14,#01,#44,#01,#41,#01,#44
    DB #02,#11,#01,#14,#02,#44,#01,#41,#02,#11,#01,#15,#06,#44,#01,#14
    DB #01,#11,#02,#44,#01,#14,#04,#11,#02,#44,#01,#14,#01,#11,#01,#41
    DB #02,#11,#01,#1F,#1C,#11,#01,#44,#01,#14,#02,#44,#04,#11,#01,#44
    DB #01,#14,#02,#44,#01,#41,#04,#44,#02,#11,#01,#14,#04,#44,#01,#14
    DB #03,#44,#01,#51,#02,#11,#04,#44,#01,#11,#02,#41,#04,#44,#0B,#11
    DB #01,#15,#08,#44,#02,#11,#01,#14,#02,#44,#01,#14,#02,#11,#01,#14
    DB #02,#44,#01,#14,#02,#11,#01,#15,#05,#44,#01,#14,#01,#44,#01,#41
    DB #01,#54,#03,#44,#03,#11,#02,#44,#01,#41,#01,#44,#01,#41,#02,#11
    DB #01,#1F,#01,#11,#01,#1C,#01,#C1,#12,#11,#01,#CC,#01,#C1,#04,#11
    DB #01,#14,#01,#41,#03,#44,#04,#11,#04,#44,#02,#41,#03,#44,#02,#11
    DB #01,#14,#04,#44,#01,#14,#03,#44,#01,#51,#02,#11,#04,#44,#01,#11
    DB #06,#44,#3B,#11,#01,#FA,#01,#AA,#01,#B1,#10,#11,#01,#1F,#01,#AA
    DB #01,#BB,#69,#11,#01,#1F,#01,#BA,#01,#AA,#01,#AF,#10,#11,#01,#EA
    DB #02,#AA,#01,#F1,#68,#11,#01,#1F,#02,#AA,#01,#AF,#10,#11,#01,#EB
    DB #02,#AA,#01,#B1,#68,#11,#01,#1F,#02,#AA,#01,#AF,#01,#C1,#0F,#11
    DB #01,#AA,#01,#BA,#01,#AA,#01,#A1,#69,#11,#03,#AA,#01,#F1,#0E,#11
    DB #01,#EA,#03,#AA,#01,#A1,#69,#11,#03,#AA,#01,#BA,#0D,#11,#01,#1E
    DB #01,#BB,#01,#BA,#02,#AA,#6A,#11,#01,#1A,#02,#AA,#01,#BF,#0D,#11
    DB #01,#1F,#01,#AA,#01,#BB,#02,#AA,#6A,#11,#01,#1A,#02,#AA,#01,#BF
    DB #0D,#11,#01,#1F,#01,#AA,#01,#BA,#02,#AA,#6A,#11,#01,#1A,#02,#AA
    DB #01,#AB,#01,#BF,#0C,#11,#01,#1F,#02,#BB,#01,#BA,#01,#AA,#6A,#11
    DB #01,#1E,#03,#AA,#01,#BB,#01,#BE,#0B,#11,#01,#1F,#02,#BB,#01,#AA
    DB #01,#A1,#6A,#11,#01,#1E,#03,#AA,#01,#BB,#01,#AB,#01,#F1,#0A,#11
    DB #01,#FB,#02,#BB,#01,#A2,#6C,#11,#03,#AA,#01,#BB,#01,#AA,#01,#BF
    DB #0A,#11,#01,#FA,#02,#BA,#01,#A1,#6C,#11,#01,#2A,#01,#AA,#01,#AB
    DB #01,#BA,#02,#AA,#01,#E1,#09,#11,#01,#FA,#01,#BA,#01,#BB,#01,#A1
    DB #6D,#11,#01,#2A,#01,#AA,#01,#BA,#02,#AA,#01,#BC,#09,#11,#01,#FB
    DB #02,#BB,#01,#A1,#6D,#11,#01,#1C,#03,#AA,#01,#AB,#01,#BB,#01,#C1
    DB #08,#11,#01,#FB,#02,#BB,#01,#A1,#01,#CC,#01,#AA,#01,#C1,#6C,#11
    DB #01,#AA,#01,#AB,#01,#BB,#01,#BA,#01,#AE,#02,#11,#01,#CE,#01,#EE
    DB #01,#E2,#01,#2C,#02,#11,#01,#FF,#02,#BB,#03,#AA,#01,#A1,#6C,#11
    DB #01,#1A,#01,#AA,#03,#BB,#01,#2E,#01,#EE,#04,#FF,#01,#EE,#01,#EA
    DB #01,#1B,#01,#AA,#01,#AB,#01,#BA,#02,#AA,#6E,#11,#02,#AA,#02,#BB
    DB #01,#B1,#01,#AA,#01,#BF,#01,#FF,#01,#FB,#01,#AA,#01,#AB,#01,#BB
    DB #01,#BA,#01,#AA,#01,#BB,#01,#BA,#70,#11,#01,#1A,#02,#AA,#01,#BB
    DB #01,#BA,#01,#BB,#01,#BF,#01,#FF,#02,#FB,#01,#BB,#01,#BA,#01,#AA
    DB #01,#FB,#02,#AA,#70,#11,#01,#12,#02,#AA,#01,#BA,#01,#AA,#05,#BB
    DB #01,#BA,#01,#AA,#01,#AB,#02,#AA,#01,#AB,#65,#11,#01,#1A,#04,#FF
    DB #01,#C1,#05,#11,#01,#C1,#05,#AA,#01,#AB,#03,#AA,#01,#AB,#04,#AA
    DB #01,#BB,#01,#C1,#62,#11,#01,#1B,#01,#FF,#01,#AA,#01,#AF,#01,#FF
    DB #03,#AA,#01,#BF,#01,#C1,#02,#11,#01,#1F,#01,#22,#01,#2A,#0E,#AA
    DB #01,#A1,#61,#11,#01,#FF,#0A,#AA,#01,#AE,#01,#11,#01,#FA,#01,#2A
    DB #10,#AA,#5F,#11,#01,#CF,#01,#BA,#02,#AA,#01,#AC,#01,#CC,#01,#C2
    DB #01,#22,#01,#CC,#02,#22,#03,#AA,#01,#BF,#01,#12,#11,#AA,#01,#B1
    DB #5C,#11,#01,#1F,#01,#FB,#01,#AB,#02,#AA,#01,#C1,#07,#11,#01,#CC
    DB #01,#C2,#02,#AA,#01,#BA,#12,#AA,#01,#F1,#5B,#11,#01,#BA,#03,#AA
    DB #0C,#11,#14,#AA,#01,#AB,#5B,#11,#03,#AA,#01,#A1,#0B,#11,#01,#2C
    DB #01,#1C,#13,#AA,#01,#AB,#01,#C1,#5A,#11,#02,#AA,#01,#A1,#09,#11
    DB #01,#1A,#01,#AA,#01,#A1,#01,#AC,#01,#C1,#01,#CA,#13,#AA,#01,#B1
    DB #5A,#11,#01,#1A,#01,#A1,#08,#11,#01,#1E,#01,#2B,#03,#AA,#01,#2C
    DB #01,#C2,#14,#AA,#01,#BA,#63,#11,#01,#EE,#04,#AA,#01,#12,#01,#CC
    DB #15,#AA,#01,#BF,#62,#11,#01,#EA,#01,#BA,#02,#AA,#01,#CC,#01,#C1
    DB #01,#AC,#01,#C2,#04,#AA,#01,#A1,#01,#11,#0F,#AA,#01,#AF,#01,#A1
    DB #60,#11,#01,#CA,#01,#BA,#01,#AA,#01,#22,#03,#11,#01,#AC,#01,#C2
    DB #04,#AA,#01,#A1,#01,#11,#03,#AA,#02,#BA,#09,#AA,#01,#AB,#01,#BF
    DB #01,#B1,#5F,#11,#01,#1B,#01,#BA,#01,#AA,#01,#A1,#04,#11,#01,#AC
    DB #01,#CA,#04,#AA,#01,#A1,#01,#11,#02,#AA,#03,#BB,#01,#BA,#08,#AA
    DB #01,#AB,#01,#BB,#01,#FC,#5F,#11,#01,#BA,#01,#AA,#01,#A1,#05,#11
    DB #01,#F2,#05,#AA,#01,#A1,#01,#11,#01,#AA,#02,#AB,#05,#BB,#06,#AA
    DB #01,#AB,#01,#BB,#01,#FA,#5E,#11,#01,#1F,#02,#AA,#06,#11,#01,#FA
    DB #05,#AA,#01,#A1,#01,#11,#02,#AA,#01,#AB,#02,#BB,#01,#AA,#04,#BB
    DB #03,#AA,#01,#AB,#02,#BB,#01,#FA,#5E,#11,#01,#BA,#01,#AA,#01,#C1
    DB #06,#11,#01,#FB,#01,#FA,#04,#AA,#01,#A1,#01,#11,#02,#AA,#01,#AB
    DB #02,#BB,#01,#A1,#01,#CA,#01,#AC,#01,#1A,#01,#AB,#01,#BB,#03,#AA
    DB #01,#BB,#01,#BF,#01,#FA,#5D,#11,#01,#1F,#02,#AA,#07,#11,#01,#BF
    DB #01,#AA,#01,#A2,#03,#AA,#01,#A1,#01,#11,#02,#AA,#01,#BA,#01,#BB
    DB #01,#AA,#01,#BF,#03,#FF,#01,#EA,#01,#AB,#01,#AA,#02,#BB,#01,#FB
    DB #01,#FF,#01,#FA,#5C,#11,#01,#1C,#01,#BA,#01,#AA,#01,#A1,#07,#11
    DB #01,#1F,#01,#AA,#01,#22,#01,#11,#01,#1A,#05,#AA,#02,#AB,#01,#BE
    DB #05,#FF,#01,#F1,#01,#AA,#01,#BB,#01,#BA,#01,#AB,#01,#FB,#01,#FA
    DB #5C,#11,#01,#1B,#02,#AA,#08,#11,#01,#1F,#01,#AA,#01,#21,#02,#11
    DB #01,#CA,#04,#AA,#01,#BB,#01,#BA,#01,#CF,#06,#FF,#01,#E2,#01,#BB
    DB #02,#AA,#01,#FB,#01,#FA,#5C,#11,#01,#1A,#02,#AA,#08,#11,#02,#1A
    DB #08,#AA,#01,#AB,#01,#BA,#01,#AF,#07,#FF,#01,#CB,#01,#BB,#01,#BA
    DB #01,#AB,#01,#FC,#5C,#11,#01,#1A,#01,#AA,#01,#21,#08,#11,#01,#1B
    DB #09,#AA,#01,#BB,#01,#BA,#04,#FF,#01,#2B,#03,#FF,#01,#EC,#01,#AB
    DB #01,#BB,#01,#AA,#01,#F1,#5C,#11,#01,#12,#01,#AA,#08,#11,#01,#1F
    DB #01,#BA,#02,#AA,#01,#2A,#01,#2C,#01,#2A,#05,#AA,#01,#BA,#03,#FF
    DB #01,#F1,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#2A,#01,#BA,#01,#AA
    DB #01,#A1,#65,#11,#01,#1E,#01,#FA,#01,#AA,#01,#A2,#01,#11,#01,#1C
    DB #01,#11,#01,#CA,#04,#AA,#01,#AB,#01,#AA,#03,#FF,#01,#F1,#01,#11
    DB #01,#1C,#01,#EF,#01,#FF,#01,#FC,#01,#BB,#01,#AA,#01,#AB,#66,#11
    DB #01,#BA,#02,#AA,#01,#1C,#03,#CC,#07,#AA,#03,#FF,#01,#F1,#01,#11
    DB #01,#1F,#01,#CF,#01,#FF,#01,#F2,#03,#AA,#65,#11,#01,#1B,#01,#AA
    DB #01,#A2,#02,#11,#01,#CA,#01,#2C,#01,#CC,#06,#AA,#01,#BA,#01,#AF
    DB #02,#FF,#01,#F1,#01,#11,#01,#1E,#01,#1F,#01,#FF,#01,#FA,#02,#AA
    DB #01,#B2,#65,#11,#01,#BA,#01,#AA,#03,#11,#01,#1B,#01,#AA,#01,#2C
    DB #01,#2A,#05,#AA,#01,#BB,#01,#2F,#02,#FF,#01,#F1,#02,#11,#01,#1F
    DB #01,#FF,#01,#FA,#01,#AA,#01,#AB,#01,#B1,#64,#11,#01,#BB,#01,#AA
    DB #01,#A1,#03,#11,#01,#1C,#01,#FA,#01,#A2,#01,#CA,#06,#AA,#01,#AF
    DB #03,#FF,#01,#E1,#01,#11,#01,#1F,#01,#FF,#01,#F2,#01,#AA,#01,#AB
    DB #01,#A1,#64,#11,#01,#BA,#01,#AA,#01,#C1,#04,#11,#01,#CB,#01,#AA
    DB #01,#2C,#06,#AA,#01,#AB,#02,#FF,#01,#F1,#02,#11,#01,#1F,#01,#FF
    DB #01,#FA,#02,#AA,#01,#21,#63,#11,#01,#1F,#02,#AA,#06,#11,#01,#1A
    DB #01,#AC,#07,#AA,#01,#BF,#01,#FF,#01,#F1,#02,#11,#01,#1F,#01,#FF
    DB #01,#FB,#01,#AA,#01,#AB,#64,#11,#01,#1B,#01,#AA,#01,#A2,#07,#11
    DB #02,#2A,#05,#AA,#01,#AB,#01,#AF,#01,#FF,#01,#F1,#01,#1C,#01,#C1
    DB #01,#AF,#01,#FF,#01,#FA,#02,#AA,#64,#11,#01,#12,#01,#AA,#01,#A1
    DB #07,#11,#01,#1C,#01,#CA,#06,#AA,#01,#BC,#01,#BB,#01,#FC,#01,#CC
    DB #01,#C1,#01,#EF,#01,#FF,#03,#AA,#6F,#11,#01,#1A,#09,#AA,#01,#CC
    DB #01,#1C,#01,#FF,#01,#FB,#02,#AA,#01,#AE,#70,#11,#0B,#AA,#01,#BB
    DB #01,#BA,#02,#AA,#01,#BC,#70,#11,#01,#1A,#0B,#AA,#01,#AB,#01,#BA
    DB #01,#AA,#01,#F1,#71,#11,#07,#AA,#01,#11,#06,#AA,#01,#B1,#71,#11
    DB #01,#CA,#06,#AA,#01,#A1,#01,#EA,#05,#AA,#72,#11,#01,#1A,#06,#AA
    DB #01,#A1,#01,#6F,#01,#F1,#01,#AA,#01,#2A,#02,#AA,#73,#11,#01,#1A
    DB #05,#AA,#01,#AC,#01,#68,#01,#81,#01,#11,#02,#AA,#01,#A1,#73,#11
    DB #01,#A1,#01,#CA,#05,#AA,#01,#A1,#01,#11,#03,#AA,#74,#11,#01,#AC
    DB #01,#C1,#01,#12,#05,#AA,#01,#2A,#02,#AA,#75,#11,#01,#AA,#01,#C2
    DB #02,#11,#05,#AA,#01,#A2,#5C,#11,#01,#CA,#02,#AA,#01,#A1,#15,#11
    DB #01,#1A,#01,#AA,#01,#AC,#01,#C1,#02,#11,#01,#1C,#01,#22,#01,#AA
    DB #01,#A1,#5C,#11,#02,#AA,#01,#FF,#01,#FB,#01,#AA,#01,#21,#11,#11
    DB #02,#FF,#01,#FB,#02,#AA,#01,#A2,#01,#21,#3E,#11
bitmap_intro_scene0_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_12_USED_END:
    ds 1092, #FF
    org BITMAP_ROOM_DATA_BANK_12_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_13_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_13_ROM_START:
; GameFlow intro scene #0 SCREEN 5 bitmap, packed 4bpp RLE; VRAM #04000, raw 10752 bytes, RLE 2010 bytes
bitmap_intro_scene0_rle_chunk_1:
    DB #23,#11,#01,#1A,#01,#BF,#02,#AA,#01,#FF,#01,#BB,#01,#A2,#10,#11
    DB #01,#1F,#01,#FF,#01,#AA,#01,#BB,#01,#AA,#01,#B1,#01,#AA,#01,#A1
    DB #0A,#11,#01,#12,#01,#AB,#55,#11,#01,#AF,#01,#AA,#01,#BA,#02,#FF
    DB #01,#FB,#01,#AA,#01,#21,#0F,#11,#01,#BB,#06,#AA,#01,#2A,#01,#21
    DB #09,#11,#01,#BA,#01,#AB,#01,#BA,#54,#11,#01,#AA,#01,#BB,#01,#BF
    DB #03,#FF,#01,#BB,#01,#B1,#0E,#11,#01,#1B,#01,#BB,#07,#AA,#02,#2A
    DB #07,#11,#01,#1A,#01,#AA,#01,#2C,#01,#AA,#01,#21,#52,#11,#01,#1A
    DB #01,#AB,#01,#AA,#01,#BF,#03,#FF,#01,#AA,#01,#BA,#0C,#11,#01,#1C
    DB #01,#CB,#01,#BA,#09,#AA,#01,#A2,#01,#2C,#07,#11,#01,#A1,#01,#1B
    DB #01,#BB,#01,#AC,#52,#11,#01,#1A,#01,#AA,#01,#BA,#01,#AB,#01,#BF
    DB #01,#FF,#01,#FB,#01,#BA,#01,#AA,#0C,#11,#01,#EB,#01,#BB,#02,#AA
    DB #01,#A2,#08,#AA,#01,#22,#01,#C1,#04,#11,#01,#1A,#01,#AC,#01,#1C
    DB #01,#AA,#01,#BB,#01,#AB,#52,#11,#02,#AA,#02,#BA,#04,#BB,#01,#AA
    DB #0B,#11,#01,#EA,#01,#BA,#01,#BB,#01,#AA,#01,#A1,#01,#1C,#01,#2A
    DB #07,#AA,#01,#A1,#01,#C2,#04,#11,#01,#CA,#01,#AA,#01,#1A,#01,#AA
    DB #01,#1A,#01,#AB,#01,#C1,#51,#11,#02,#BA,#01,#AA,#01,#AB,#01,#BB
    DB #01,#AA,#01,#AB,#02,#AA,#0A,#11,#01,#FF,#01,#BA,#03,#AA,#02,#11
    DB #01,#2A,#08,#AA,#01,#12,#01,#A1,#03,#11,#01,#12,#01,#A1,#01,#1A
    DB #01,#21,#01,#AB,#01,#BB,#01,#A1,#51,#11,#01,#CA,#01,#BA,#02,#AA
    DB #01,#AB,#01,#AA,#01,#BB,#01,#AA,#01,#2A,#09,#11,#01,#FF,#01,#AB
    DB #01,#BB,#02,#AA,#03,#11,#09,#AA,#01,#A1,#01,#2A,#01,#A1,#02,#11
    DB #01,#1A,#01,#22,#01,#C1,#01,#1A,#02,#AA,#01,#A1,#51,#11,#01,#1A
    DB #02,#AA,#01,#BA,#03,#AA,#01,#A2,#01,#AA,#08,#11,#01,#1F,#01,#BA
    DB #01,#AB,#01,#BA,#01,#AA,#04,#11,#09,#AA,#01,#AC,#01,#22,#01,#AA
    DB #02,#11,#01,#1A,#01,#AA,#01,#A1,#01,#AA,#01,#A1,#01,#12,#01,#A1
    DB #51,#11,#01,#1A,#01,#BA,#01,#AB,#01,#BA,#01,#AB,#01,#AA,#01,#A2
    DB #01,#2A,#01,#A1,#07,#11,#01,#1F,#01,#AB,#01,#BA,#01,#BB,#01,#AA
    DB #01,#21,#04,#11,#01,#1A,#09,#AA,#01,#12,#02,#AA,#02,#11,#02,#AA
    DB #01,#1A,#01,#21,#01,#CA,#53,#11,#01,#AF,#04,#AA,#01,#22,#01,#A2
    DB #08,#11,#01,#FA,#03,#AA,#01,#A1,#05,#11,#01,#1A,#09,#AA,#01,#A1
    DB #02,#AA,#01,#A1,#01,#11,#01,#AC,#01,#AA,#01,#21,#01,#1C,#01,#CA
    DB #54,#11,#01,#22,#01,#AA,#01,#2C,#01,#22,#01,#AA,#08,#11,#01,#1F
    DB #02,#AA,#01,#A1,#01,#AC,#06,#11,#01,#1B,#0A,#AA,#01,#1A,#01,#AA
    DB #01,#A2,#01,#2A,#01,#A2,#01,#1A,#01,#AA,#01,#CA,#01,#A1,#55,#11
    DB #02,#CC,#0A,#11,#01,#1A,#03,#AA,#01,#A1,#06,#11,#01,#1A,#0A,#AA
    DB #01,#A1,#01,#2A,#01,#A2,#01,#2A,#01,#AA,#01,#22,#01,#AA,#01,#A1
    DB #56,#11,#01,#CC,#01,#C1,#0B,#11,#04,#AA,#06,#11,#01,#1A,#0B,#AA
    DB #01,#1A,#01,#A2,#01,#22,#02,#AA,#01,#2C,#57,#11,#01,#1C,#0C,#11
    DB #01,#1A,#03,#AA,#01,#A1,#05,#11,#01,#1A,#03,#AA,#01,#AB,#04,#AA
    DB #01,#2A,#02,#AA,#01,#11,#02,#22,#01,#2A,#01,#A2,#01,#C1,#57,#11
    DB #01,#1C,#0D,#11,#04,#AA,#05,#11,#02,#12,#01,#CA,#06,#AA,#01,#CA
    DB #02,#AA,#01,#A1,#01,#1C,#01,#C2,#01,#2A,#01,#21,#58,#11,#01,#CC
    DB #0D,#11,#01,#1C,#03,#AA,#01,#A1,#03,#11,#01,#1A,#01,#BB,#04,#AA
    DB #01,#BB,#06,#AA,#01,#AE,#5C,#11,#01,#CC,#0E,#11,#01,#1A,#03,#AA
    DB #01,#C1,#01,#11,#01,#2A,#01,#AA,#01,#A2,#04,#AA,#01,#AB,#06,#AA
    DB #01,#AB,#01,#E1,#5B,#11,#01,#CC,#0F,#11,#03,#AA,#01,#A2,#02,#AA
    DB #01,#A2,#02,#11,#01,#CC,#01,#2C,#01,#22,#01,#CC,#03,#11,#01,#C2
    DB #02,#22,#01,#AA,#01,#AE,#5B,#11,#01,#CA,#0F,#11,#01,#1A,#02,#AA
    DB #01,#CA,#05,#AA,#01,#1F,#02,#FF,#01,#F1,#02,#11,#01,#1C,#02,#FF
    DB #01,#FC,#01,#11,#01,#2F,#5B,#11,#01,#CA,#10,#11,#01,#2A,#07,#AA
    DB #01,#A1,#02,#FF,#01,#F1,#02,#11,#01,#1C,#02,#FF,#01,#FE,#02,#11
    DB #01,#AA,#5A,#11,#01,#C2,#01,#A1,#0F,#11,#01,#1A,#04,#AA,#01,#11
    DB #01,#1A,#02,#AA,#01,#1F,#01,#FF,#01,#F1,#02,#11,#01,#1C,#02,#FF
    DB #01,#FE,#02,#11,#01,#FF,#01,#F1,#59,#11,#01,#12,#01,#A1,#10,#11
    DB #04,#AA,#01,#A2,#01,#11,#01,#C2,#01,#AA,#01,#1F,#01,#FF,#01,#F1
    DB #02,#11,#01,#1C,#02,#FF,#01,#FE,#02,#11,#01,#CF,#01,#F1,#59,#11
    DB #01,#12,#01,#2A,#10,#11,#01,#1A,#04,#AA,#01,#AC,#02,#11,#01,#BF
    DB #01,#11,#01,#1F,#02,#FF,#01,#FE,#01,#11,#01,#1C,#01,#BE,#02,#11
    DB #01,#1F,#01,#FA,#5A,#11,#01,#AA,#11,#11,#02,#AA,#01,#2A,#02,#AA
    DB #01,#AC,#03,#11,#01,#1F,#02,#FF,#01,#FE,#03,#11,#01,#FF,#01,#7E
    DB #01,#E1,#01,#AA,#5A,#11,#01,#A2,#01,#A1,#13,#11,#01,#1A,#01,#AA
    DB #01,#A1,#03,#11,#01,#1F,#02,#FF,#01,#FE,#03,#11,#02,#FF,#01,#F1
    DB #01,#12,#5A,#11,#01,#12,#01,#2A,#11,#11,#01,#12,#01,#11,#02,#1A
    DB #01,#AC,#03,#11,#01,#1F,#02,#FF,#01,#FE,#03,#11,#02,#FF,#01,#E1
    DB #5C,#11,#01,#2A,#01,#C1,#10,#11,#01,#1A,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#03,#11,#03,#CC,#01,#C1,#03,#11,#02,#FF,#01,#E1,#5C,#11
    DB #01,#CA,#01,#A1,#10,#11,#01,#1A,#01,#11,#01,#1A,#01,#11,#01,#CC
    DB #01,#2A,#05,#AA,#05,#CC,#01,#11,#01,#E1,#5C,#11,#01,#12,#01,#AA
    DB #10,#11,#01,#B2,#01,#11,#01,#CC,#01,#22,#05,#AA,#01,#A2,#07,#CC
    DB #01,#C1,#5D,#11,#01,#2A,#01,#AA,#0E,#11,#01,#1A,#01,#C1,#01,#12
    DB #06,#AA,#01,#AC,#09,#CC,#01,#C1,#5C,#11,#01,#1A,#01,#AA,#01,#A1
    DB #0D,#11,#01,#22,#01,#C1,#01,#CA,#01,#AB,#01,#BA,#04,#AA,#08,#CC
    DB #01,#22,#01,#2A,#01,#21,#5D,#11,#02,#AA,#0C,#11,#02,#1C,#01,#C1
    DB #01,#AA,#01,#BB,#04,#AA,#01,#AC,#08,#CC,#01,#C2,#02,#AA,#5E,#11
    DB #01,#AA,#01,#AB,#0A,#11,#01,#12,#01,#2C,#01,#C1,#01,#1A,#01,#BB
    DB #01,#BA,#04,#AA,#01,#A1,#09,#CC,#02,#AA,#01,#C1,#5E,#11,#01,#2A
    DB #01,#AA,#01,#21,#01,#CC,#01,#C1,#04,#11,#01,#C1,#01,#1A,#02,#22
    DB #01,#CC,#01,#1B,#01,#FF,#01,#BA,#03,#AA,#01,#AC,#06,#11,#04,#CC
    DB #01,#CA,#01,#AA,#01,#A1,#5E,#11,#01,#1C,#01,#2A,#02,#AA,#01,#AC
    DB #02,#22,#02,#2A,#02,#AA,#01,#22,#01,#2C,#01,#C1,#01,#2F,#01,#FB
    DB #04,#AA,#07,#11,#01,#1C,#04,#CC,#01,#AA,#01,#AE,#60,#11,#01,#CA
    DB #08,#AA,#01,#21,#02,#11,#01,#FF,#01,#FA,#03,#AA,#01,#A1,#08,#11
    DB #04,#CC,#02,#AA,#01,#E1,#61,#11,#01,#CA,#04,#AA,#01,#A2,#01,#C1
    DB #02,#11,#01,#1A,#01,#FF,#01,#BA,#03,#AA,#0A,#11,#02,#CC,#01,#22
    DB #01,#CA,#01,#AA,#01,#B1,#6A,#11,#01,#1F,#01,#FF,#03,#AA,#01,#A2
    DB #0A,#11,#01,#12,#02,#CC,#01,#CA,#01,#AA,#01,#AB,#6A,#11,#01,#AF
    DB #01,#FF,#03,#AA,#01,#A1,#0B,#11,#01,#C2,#01,#2C,#01,#22,#02,#AA
    DB #01,#E1,#69,#11,#01,#FF,#01,#FB,#03,#AA,#0C,#11,#01,#12,#02,#22
    DB #01,#AA,#01,#AB,#01,#E1,#68,#11,#01,#1F,#01,#AA,#01,#BB,#02,#AA
    DB #01,#A1,#0D,#11,#01,#22,#01,#2A,#02,#AA,#01,#B1,#68,#11,#01,#1B
    DB #01,#CC,#03,#AA,#0E,#11,#01,#12,#01,#2A,#01,#AA,#02,#AB,#68,#11
    DB #01,#FA,#01,#CC,#01,#C2,#02,#AA,#0F,#11,#02,#AA,#01,#BA,#01,#22
    DB #67,#11,#01,#1F,#01,#AA,#02,#CC,#01,#CA,#01,#A1,#0F,#11,#01,#1A
    DB #01,#22,#01,#CC,#01,#C1,#67,#11,#01,#1A,#01,#AA,#02,#CC,#01,#C2
    DB #10,#11,#01,#AA,#01,#22,#01,#CC,#01,#C1,#67,#11,#02,#AA,#01,#2C
    DB #01,#CC,#01,#C1,#10,#11,#01,#A2,#02,#22,#01,#C1,#66,#11,#01,#1C
    DB #01,#AA,#01,#A2,#01,#2C,#01,#CC,#10,#11,#01,#1B,#02,#22,#01,#2A
    DB #67,#11,#01,#1B,#02,#AA,#01,#A2,#01,#21,#10,#11,#01,#12,#02,#22
    DB #01,#2A,#67,#11,#01,#1A,#03,#AA,#01,#A1,#10,#11,#01,#BA,#02,#22
    DB #01,#A1,#67,#11,#01,#FA,#03,#AA,#01,#A1,#10,#11,#01,#AA,#02,#22
    DB #01,#A1,#66,#11,#01,#1F,#04,#AA,#11,#11,#03,#22,#01,#C1,#66,#11
    DB #01,#FA,#03,#AA,#01,#A1,#10,#11,#01,#1B,#02,#22,#01,#2A,#67,#11
    DB #01,#BA,#03,#AA,#01,#A1,#10,#11,#01,#1A,#02,#22,#01,#AA,#66,#11
    DB #01,#1F,#04,#AA,#11,#11,#02,#AA,#01,#A2,#01,#21,#66,#11,#01,#FA
    DB #03,#AA,#01,#A1,#11,#11,#02,#AA,#01,#22,#01,#A1,#65,#11,#01,#1E
    DB #04,#AA,#01,#A1,#10,#11,#01,#1A,#01,#2A,#01,#A2,#01,#22,#66,#11
    DB #01,#1B,#04,#AA,#11,#11,#01,#1A,#01,#22,#02,#2A,#66,#11,#01,#EA
    DB #04,#AA,#11,#11,#01,#1A,#01,#22,#02,#AA,#66,#11,#01,#BB,#01,#BA
    DB #02,#AA,#01,#A1,#11,#11,#02,#AA,#01,#22,#01,#CA,#01,#A1,#03,#11
    DB #01,#AB,#01,#BF,#01,#FB,#5E,#11,#01,#BF,#01,#FA,#02,#AA,#01,#2A
    DB #01,#A1,#10,#11,#01,#1A,#04,#22,#01,#AA,#01,#BB,#02,#AA,#02,#AB
    DB #02,#BB,#5B,#11,#01,#1C,#02,#FF,#01,#BB,#01,#BA,#02,#AA,#01,#A1
    DB #10,#11,#01,#1A,#04,#22,#06,#AA,#01,#BB,#01,#AB,#01,#E1,#59,#11
    DB #01,#1E,#02,#FB,#03,#BB,#02,#AA,#01,#A1,#10,#11,#01,#A2,#09,#22
    DB #01,#2A,#01,#AA,#01,#BB,#01,#BC,#59,#11,#01,#BB,#01,#AB,#01,#BB
    DB #05,#AA,#01,#21,#10,#11,#01,#A2,#0A,#22,#01,#2A,#02,#BB,#58,#11
    DB #01,#1F,#01,#BA,#07,#AA,#01,#A1,#0F,#11,#01,#1A,#0C,#22,#02,#AA
    DB #58,#11,#01,#FB,#01,#BA,#07,#AA,#01,#A1,#0F,#11,#01,#1A,#0C,#22
    DB #02,#AA,#01,#A1,#57,#11,#09,#AA,#01,#A1,#0F,#11,#01,#12,#01,#2A
    DB #0B,#22,#01,#2A,#01,#AA,#01,#B1,#56,#11,#01,#1A,#01,#BA,#08,#AA
    DB #01,#A2,#11,#11,#01,#2A,#01,#22,#02,#AA,#01,#22,#01,#C2,#05,#22
    DB #01,#2A,#01,#AA,#01,#A1,#56,#11,#01,#1A,#09,#AA,#01,#2C,#15,#11
    DB #01,#1C,#01,#C2,#05,#22,#01,#2A,#01,#AC,#57,#11,#01,#12,#08,#AA
    DB #01,#22,#01,#CC,#75,#11,#01,#1C,#08,#AA,#01,#22,#01,#C1,#76,#11
    DB #07,#AA,#01,#A2,#01,#C1,#78,#11,#01,#1A,#05,#AA,#01,#C1,#FF,#11
    DB #FF,#11,#FF,#11,#FF,#11,#FF,#11,#D0,#11
bitmap_intro_scene0_rle_chunk_1_end:

; Sprite 0 pattern bank (16x16, mode 2 quadrants), banked: read only by init_hardware_sprite_tables and the SHOOT pattern loan
bitmap_room_sprite_patterns:
    DB #00,#00,#00,#00,#01,#01,#00,#00,#0F,#10,#23,#25,#29,#09,#0A,#0A
    DB #00,#00,#00,#00,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76
    DB #00,#40,#E0,#A0,#01,#02,#02,#06,#06,#1C,#0D,#00,#02,#04,#07,#07
    DB #10,#06,#CA,#44,#20,#40,#40,#20,#10,#18,#40,#C0,#00,#00,#00,#00
    DB #40,#E0,#40,#40,#40,#41,#41,#41,#21,#02,#01,#03,#04,#08,#08,#00
    DB #66,#78,#30,#98,#C0,#A0,#A0,#D0,#E0,#A0,#48,#18,#00,#00,#00,#00
    DB #00,#01,#01,#00,#00,#0F,#10,#23,#45,#89,#09,#12,#04,#20,#70,#20
    DB #00,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#20,#70
    DB #00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30
    DB #00,#01,#02,#02,#06,#06,#1C,#0D,#00,#00,#00,#01,#01,#01,#00,#01
    DB #44,#20,#40,#40,#20,#10,#18,#40,#80,#80,#80,#00,#00,#00,#40,#C0
    DB #20,#20,#21,#41,#41,#21,#02,#01,#03,#01,#01,#00,#00,#00,#01,#00
    DB #98,#C0,#A0,#A0,#D0,#E0,#A0,#48,#18,#00,#00,#00,#00,#00,#80,#00
    DB #00,#01,#01,#01,#00,#00,#1F,#20,#C3,#05,#09,#11,#12,#00,#00,#40
    DB #00,#01,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#E0
    DB #00,#00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78
    DB #E0,#A0,#01,#02,#02,#06,#06,#1C,#0C,#00,#06,#04,#04,#04,#07,#07
    DB #CA,#44,#20,#40,#46,#21,#19,#00,#00,#90,#10,#00,#20,#20,#38,#38
    DB #40,#40,#40,#41,#41,#41,#21,#02,#01,#03,#01,#03,#00,#00,#00,#00
    DB #30,#98,#C0,#A0,#A0,#D6,#E4,#A0,#40,#20,#A0,#20,#00,#00,#00,#00
    DB #01,#01,#01,#00,#00,#0F,#10,#23,#45,#49,#09,#0A,#08,#00,#40,#E0
    DB #01,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#E0,#40
    DB #00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30
    DB #A0,#01,#02,#02,#06,#06,#1C,#0C,#00,#00,#00,#01,#01,#01,#01,#01
    DB #44,#20,#40,#46,#21,#19,#00,#00,#80,#80,#80,#00,#00,#00,#C0,#C0
    DB #40,#40,#41,#41,#41,#21,#02,#01,#03,#01,#01,#00,#00,#00,#00,#00
    DB #98,#C0,#A0,#A0,#D6,#E4,#A0,#40,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29
    DB #00,#00,#00,#00,#80,#80,#00,#00,#F0,#08,#C4,#A4,#94,#90,#50,#50
    DB #00,#00,#00,#00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #08,#60,#53,#22,#04,#02,#02,#04,#08,#18,#02,#03,#00,#00,#00,#00
    DB #00,#02,#07,#05,#80,#40,#40,#60,#60,#38,#B0,#00,#40,#20,#E0,#E0
    DB #66,#1E,#0C,#19,#03,#05,#05,#0B,#07,#05,#12,#18,#00,#00,#00,#00
    DB #02,#07,#02,#02,#02,#82,#82,#82,#84,#40,#80,#C0,#20,#10,#10,#00
    DB #00,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53
    DB #00,#80,#80,#00,#00,#F0,#08,#C4,#A2,#91,#90,#48,#20,#04,#0E,#04
    DB #00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#0E
    DB #22,#04,#02,#02,#04,#08,#18,#02,#01,#01,#01,#00,#00,#00,#02,#03
    DB #00,#80,#40,#40,#60,#60,#38,#B0,#00,#00,#00,#80,#80,#80,#00,#80
    DB #19,#03,#05,#05,#0B,#07,#05,#12,#18,#00,#00,#00,#00,#00,#01,#00
    DB #04,#04,#84,#82,#82,#84,#40,#80,#C0,#80,#80,#00,#00,#00,#80,#00
    DB #00,#80,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60
    DB #00,#80,#80,#80,#00,#00,#F8,#04,#C3,#A0,#90,#88,#48,#00,#00,#02
    DB #00,#00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#07
    DB #53,#22,#04,#02,#62,#84,#98,#00,#00,#09,#08,#00,#04,#04,#1C,#1C
    DB #07,#05,#80,#40,#40,#60,#60,#38,#30,#00,#60,#20,#20,#20,#E0,#E0
    DB #0C,#19,#03,#05,#05,#6B,#27,#05,#02,#04,#05,#04,#00,#00,#00,#00
    DB #02,#02,#02,#82,#82,#82,#84,#40,#80,#C0,#80,#C0,#00,#00,#00,#00
    DB #80,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53
    DB #80,#80,#80,#00,#00,#F0,#08,#C4,#A2,#92,#90,#50,#10,#00,#02,#07
    DB #00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#07,#02
    DB #22,#04,#02,#62,#84,#98,#00,#00,#01,#01,#01,#00,#00,#00,#03,#03
    DB #05,#80,#40,#40,#60,#60,#38,#30,#00,#00,#00,#80,#80,#80,#80,#80
    DB #19,#03,#05,#05,#6B,#27,#05,#02,#00,#00,#00,#00,#00,#00,#00,#00
    DB #02,#02,#82,#82,#82,#84,#40,#80,#C0,#80,#80,#00,#00,#00,#00,#00
bitmap_room_sprite_patterns_end:

BITMAP_ROOM_DATA_BANK_13_USED_END:
    ds 5158, #FF
    org BITMAP_ROOM_DATA_BANK_13_PHYS_START + #2000
; ==================================================================
; MUSIC DATA BANK 14 (chunk 0: shared tables + serialized songs, 7827/8192 bytes).
; Mapped into the music runtime window only while music_play_track / music_update run;
; the wrappers restore resident P2=2 and P3=3 before returning. Source PT3
; uses consecutive chunks as #8000/#A000 halves; native SCC/PSG uses P3.
; SCC-window bank numbers are never allocated. The ds guard fails loudly
; if this chunk ever outgrows its 8KB bank.
; ==================================================================
BITMAP_MUSIC_DATA_BANK_0_PHYS_START:
    org #A000
; ---- music bank chunk 0: shared header (1124 bytes) + 1 track blob(s) ----
scc_note_period_table:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE3,#0EFE,#0E27,#0D5B,#0C9C,#0BE6,#0B3B
    DW #0A9A,#0A01,#0972,#08EA,#086A,#07F1,#077F,#0713
    DW #06AD,#064D,#05F3,#059D,#054C,#0500,#04B8,#0474
    DW #0434,#03F8,#03BF,#0389,#0356,#0326,#02F9,#02CE
    DW #02A6,#0280,#025C,#023A,#021A,#01FB,#01DF,#01C4
    DW #01AB,#0193,#017C,#0167,#0152,#013F,#012D,#011C
    DW #010C,#00FD,#00EF,#00E1,#00D5,#00C9,#00BD,#00B3
    DW #00A9,#009F,#0096,#008E,#0086,#007E,#0077,#0070
    DW #006A,#0064,#005E,#0059,#0054,#004F,#004B,#0046
    DW #0042,#003F,#003B,#0038,#0034,#0031,#002F,#002C
    DW #0029,#0027,#0025,#0023,#0021,#001F,#001D,#001B

scc_vib_table:
    DB #00,#03,#06,#09,#0C,#0F,#11,#14,#16,#18,#1A,#1B,#1D,#1E,#1E,#1F
    DB #1F,#1F,#1E,#1E,#1D,#1B,#1A,#18,#16,#14,#11,#0F,#0C,#09,#06,#03
    DB #00,#FD,#FA,#F7,#F4,#F1,#EF,#EC,#EA,#E8,#E6,#E5,#E3,#E2,#E2,#E1
    DB #E1,#E1,#E2,#E2,#E3,#E5,#E6,#E8,#EA,#EC,#EF,#F1,#F4,#F7,#FA,#FD

scc_noise_table:
    DB #2B,#D3,#12,#FA,#B3,#82,#EC,#BC,#96,#43,#E7,#DE,#D1,#60,#61,#8A
    DB #20,#E6,#74,#AD,#FE,#A1,#FD,#F3,#A8,#1D,#97,#C7,#1A,#A5,#A0,#56
    DB #10,#46,#32,#8C,#06,#CC,#2A,#15,#37,#C2,#23,#5C,#A0,#76,#7A,#8E
    DB #FD,#F2,#4C,#97,#C9,#02,#72,#23,#41,#34,#8B,#9D,#61,#D2,#F1,#32
    DB #E5,#E9,#C2,#CE,#49,#45,#D7,#1D,#C8,#72,#CF,#8B,#5F,#BB,#04,#43
    DB #C9,#2D,#93,#32,#84,#94,#58,#03,#CA,#7B,#EF,#24,#98,#30,#B3,#BF
    DB #AA,#BD,#C1,#C1,#7B,#EF,#F5,#D5,#49,#51,#EB,#69,#0E,#30,#FE,#A7
    DB #86,#98,#4B,#7C,#2F,#55,#AE,#94,#43,#F3,#C3,#5A,#BF,#BD,#E5,#FB
    DB #5F,#C0,#31,#63,#9E,#C8,#83,#3E,#B9,#60,#77,#F7,#AC,#D6,#68,#BB
    DB #33,#34,#73,#76,#CA,#47,#74,#D4,#AC,#9A,#07,#40,#D6,#7A,#87,#E8
    DB #04,#F3,#11,#B6,#B1,#D1,#81,#56,#1A,#A0,#73,#36,#3B,#AB,#42,#80
    DB #D0,#FF,#0B,#21,#55,#68,#AA,#C4,#05,#72,#BB,#D7,#DD,#68,#99,#84
    DB #99,#57,#61,#B8,#B4,#0B,#EF,#1F,#6B,#0F,#DF,#24,#BA,#B0,#8C,#F4
    DB #5D,#FB,#13,#7B,#CF,#B9,#50,#65,#4E,#79,#DE,#1D,#D4,#85,#1B,#D0
    DB #1D,#EA,#21,#6A,#A7,#74,#CD,#97,#AC,#AF,#BA,#C2,#29,#E6,#46,#19
    DB #DA,#26,#8B,#85,#3A,#3B,#66,#B5,#87,#B0,#72,#14,#BB,#D3,#0D,#CD
    DB #92,#AE,#51,#CD,#8A,#0D,#1B,#BF,#DD,#7E,#06,#11,#88,#4B,#70,#ED
    DB #47,#81,#73,#40,#95,#EC,#EC,#B6,#AF,#18,#76,#BA,#91,#50,#6F

; 0 unique waveform(s), 32 bytes each (signed two's complement)
scc_wave_table:
    DB #00

psg_note_period_table:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE4,#0EFF,#0E28,#0D5C,#0C9D,#0BE7,#0B3C
    DW #0A9B,#0A02,#0973,#08EB,#086B,#07F2,#0780,#0714
    DW #06AE,#064E,#05F4,#059E,#054D,#0501,#04B9,#0475
    DW #0435,#03F9,#03C0,#038A,#0357,#0327,#02FA,#02CF
    DW #02A7,#0281,#025D,#023B,#021B,#01FC,#01E0,#01C5
    DW #01AC,#0194,#017D,#0168,#0153,#0140,#012E,#011D
    DW #010D,#00FE,#00F0,#00E2,#00D6,#00CA,#00BE,#00B4
    DW #00AA,#00A0,#0097,#008F,#0087,#007F,#0078,#0071
    DW #006B,#0065,#005F,#005A,#0055,#0050,#004C,#0047
    DW #0043,#0040,#003C,#0039,#0035,#0032,#0030,#002D
    DW #002A,#0028,#0026,#0024,#0022,#0020,#001E,#001C

music_pt3_volume_table:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#01,#01,#01,#01,#01,#01
    DB #00,#00,#00,#00,#01,#01,#01,#01,#01,#01,#01,#01,#02,#02,#02,#02
    DB #00,#00,#00,#01,#01,#01,#01,#01,#02,#02,#02,#02,#02,#03,#03,#03
    DB #00,#00,#01,#01,#01,#01,#02,#02,#02,#02,#03,#03,#03,#03,#04,#04
    DB #00,#00,#01,#01,#01,#02,#02,#02,#03,#03,#03,#04,#04,#04,#05,#05
    DB #00,#00,#01,#01,#02,#02,#02,#03,#03,#04,#04,#04,#05,#05,#06,#06
    DB #00,#00,#01,#01,#02,#02,#03,#03,#04,#04,#05,#05,#06,#06,#07,#07
    DB #00,#01,#01,#02,#02,#03,#03,#04,#04,#05,#05,#06,#06,#07,#07,#08
    DB #00,#01,#01,#02,#02,#03,#04,#04,#05,#05,#06,#07,#07,#08,#08,#09
    DB #00,#01,#01,#02,#03,#03,#04,#05,#05,#06,#07,#07,#08,#09,#09,#0A
    DB #00,#01,#01,#02,#03,#04,#04,#05,#06,#07,#07,#08,#09,#0A,#0A,#0B
    DB #00,#01,#02,#02,#03,#04,#05,#06,#06,#07,#08,#09,#0A,#0A,#0B,#0C
    DB #00,#01,#02,#03,#03,#04,#05,#06,#07,#08,#09,#0A,#0A,#0B,#0C,#0D
    DB #00,#01,#02,#03,#04,#05,#06,#07,#07,#08,#09,#0A,#0B,#0C,#0D,#0E
    DB #00,#01,#02,#03,#04,#05,#06,#07,#08,#09,#0A,#0B,#0C,#0D,#0E,#0F

; ------------------------------------------------------------------
; SCC Song 0: scc_silent_stub
; ------------------------------------------------------------------
scc_track_0_scc_silent_stub_data:
    DB #06          ; +0 frames per row
    DB #01          ; +1 order length
    DB #00          ; +2 restart position
    DB #01          ; +3 pattern count
    DW scc_track_0_scc_silent_stub_order_table          ; +4
    DW scc_track_0_scc_silent_stub_pattern_table          ; +6
    DW scc_track_0_scc_silent_stub_instrument_ptr_table  ; +8
    DW scc_track_0_scc_silent_stub_ornament_ptr_table    ; +10

scc_track_0_scc_silent_stub_order_table:
    DB #00

scc_track_0_scc_silent_stub_pattern_table:
    DW scc_track_0_scc_silent_stub_pattern_0_rows
    DB #01

scc_track_0_scc_silent_stub_instrument_ptr_table:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_scc_silent_stub_ornament_ptr_table:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_scc_silent_stub_pattern_0_rows:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF


; ------------------------------------------------------------------
; PSG half of dual song 0: C Major Chiptune Loop
; ------------------------------------------------------------------
psg_track_0_c_major_chiptune_loop_data:
    DB #07          ; +0 frames per row
    DB #2A          ; +1 order length
    DB #00          ; +2 restart position
    DB #18          ; +3 pattern count
    DW psg_track_0_c_major_chiptune_loop_order_table          ; +4
    DW psg_track_0_c_major_chiptune_loop_pattern_table          ; +6
    DW psg_track_0_c_major_chiptune_loop_instrument_ptr_table  ; +8
    DB #01          ; +10 bit0: music drives PSG channel C
    DB 0          ; +11 reserved
    DW #0001          ; +12 PT3 envelope period base
    DB #0C          ; +14 PT3 noise base
    DW psg_track_0_c_major_chiptune_loop_pattern_bank_table          ; +15 pattern -> MegaROM bank
    DW psg_track_0_c_major_chiptune_loop_ornament_ptr_table          ; +17 ornament pointer table

psg_track_0_c_major_chiptune_loop_order_table:
    DB #10,#11,#10,#11,#08,#0E,#08,#0F,#03,#04,#03,#0D,#00,#01,#02,#0A
    DB #0B,#0C,#05,#06,#07,#09,#03,#04,#03,#0D,#00,#01,#02,#0A,#0B,#0C
    DB #05,#06,#07,#09,#12,#13,#14,#15,#16,#17

psg_track_0_c_major_chiptune_loop_pattern_table:
    DW psg_track_0_c_major_chiptune_loop_pattern_0_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_1_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_2_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_3_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_4_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_5_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_6_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_7_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_8_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_9_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_10_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_11_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_12_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_13_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_14_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_15_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_16_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_17_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_18_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_19_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_20_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_21_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_22_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_23_rows
    DB #40
psg_track_0_c_major_chiptune_loop_pattern_bank_table:
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 0
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 1
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 2
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 3
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 4
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 5
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 6
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 7
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 8
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 9
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 10
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 11
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 12
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 13
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 14
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 15
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 16
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 17
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 18
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 19
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 20
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 21
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 22
    DB BITMAP_MUSIC_DATA_BANK_2          ; @mideas:pattern-bank 23

psg_track_0_c_major_chiptune_loop_ornament_ptr_table:
    DW 0
    DW psg_track_0_c_major_chiptune_loop_orn_1
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

psg_track_0_c_major_chiptune_loop_orn_1:
    DB #20          ; length
    DB #18          ; loop index
psg_track_0_c_major_chiptune_loop_orn_1_data:
    DB #0C,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_instrument_ptr_table:
    DW 0
    DW psg_track_0_c_major_chiptune_loop_inst_1
    DW psg_track_0_c_major_chiptune_loop_inst_2
    DW psg_track_0_c_major_chiptune_loop_inst_3
    DW psg_track_0_c_major_chiptune_loop_inst_4
    DW psg_track_0_c_major_chiptune_loop_inst_5
    DW psg_track_0_c_major_chiptune_loop_inst_6
    DW psg_track_0_c_major_chiptune_loop_inst_7
    DW psg_track_0_c_major_chiptune_loop_inst_8
    DW psg_track_0_c_major_chiptune_loop_inst_9
    DW psg_track_0_c_major_chiptune_loop_inst_10
    DW psg_track_0_c_major_chiptune_loop_inst_11
    DW psg_track_0_c_major_chiptune_loop_inst_12
    DW psg_track_0_c_major_chiptune_loop_inst_13
    DW psg_track_0_c_major_chiptune_loop_inst_14
    DW psg_track_0_c_major_chiptune_loop_inst_15
    DW psg_track_0_c_major_chiptune_loop_inst_16
    DW psg_track_0_c_major_chiptune_loop_inst_17
    DW psg_track_0_c_major_chiptune_loop_inst_18
    DW psg_track_0_c_major_chiptune_loop_inst_19
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

psg_track_0_c_major_chiptune_loop_inst_1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #21          ; +16 PT3 sample length
    DB #20          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_1_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_1_pt3_steps:
    DB #0E,#02,#C8,#00,#06,#0E,#02,#90,#01,#00,#0D,#02,#58,#02,#00,#0C
    DB #02,#20,#03,#00,#0C,#02,#E8,#03,#00,#0B,#02,#B0,#04,#00,#0A,#02
    DB #78,#05,#00,#08,#02,#40,#06,#00,#06,#02,#08,#07,#00,#03,#02,#D0
    DB #07,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00
    DB #00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00
    DB #00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00
    DB #08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08
    DB #00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00
    DB #00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00
    DB #00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00
    DB #00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #02          ; +16 PT3 sample length
    DB #00          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_2_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_2_pt3_steps:
    DB #0C,#07,#A0,#00,#0A,#1C,#07,#A0,#00,#40

psg_track_0_c_major_chiptune_loop_inst_3:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #18          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_3_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_3_pt3_steps:
    DB #0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D
    DB #0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A
    DB #00,#00,#00,#0C,#0A,#00,#00,#00,#0C,#0A,#00,#00,#00,#0C,#0A,#00
    DB #00,#00,#0C,#0A,#00,#00,#00,#0B,#0A,#00,#00,#00,#0B,#0A,#00,#00
    DB #00,#0B,#0A,#00,#00,#00,#0B,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00
    DB #0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A
    DB #0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#09,#0A
    DB #00,#00,#00,#09,#0A,#00,#00,#00,#09,#0A,#FF,#FF,#00,#09,#0A,#FE
    DB #FF,#00,#09,#0A,#FF,#FF,#00,#09,#0A,#00,#00,#00,#09,#0A,#01,#00
    DB #00,#09,#0A,#02,#00,#00,#09,#0A,#01,#00,#00,#09,#0A,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_4:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #06          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_4_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_4_pt3_steps:
    DB #0C,#08,#00,#00,#00,#0C,#08,#00,#00,#00,#0B,#08,#00,#00,#00,#0B
    DB #08,#00,#00,#00,#0A,#08,#00,#00,#00,#0A,#08,#00,#00,#00,#09,#08
    DB #00,#00,#00,#09,#08,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_5:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #09          ; +16 PT3 sample length
    DB #08          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_5_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_5_pt3_steps:
    DB #0F,#06,#00,#00,#00,#0F,#06,#96,#00,#02,#0E,#06,#40,#01,#05,#0C
    DB #02,#E0,#01,#00,#0A,#02,#6C,#02,#00,#07,#02,#D0,#02,#00,#04,#02
    DB #0C,#03,#00,#02,#02,#34,#03,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_6:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #18          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_6_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_6_pt3_steps:
    DB #0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00
    DB #00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00
    DB #00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00
    DB #0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#FF,#FF,#00,#0B,#02,#FE
    DB #FF,#00,#0B,#02,#FF,#FF,#00,#0B,#02,#00,#00,#00,#0B,#02,#01,#00
    DB #00,#0B,#02,#02,#00,#00,#0B,#02,#01,#00,#00,#0B,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_7:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #07          ; +16 PT3 sample length
    DB #06          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_7_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_7_pt3_steps:
    DB #0F,#06,#00,#00,#01,#0F,#06,#DC,#00,#04,#0D,#02,#AE,#01,#00,#09
    DB #02,#58,#02,#00,#05,#02,#D0,#02,#00,#02,#02,#0C,#03,#00,#00,#00
    DB #00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_8:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #1F          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_8_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_8_pt3_steps:
    DB #0F,#02,#00,#00,#00,#0F,#02,#00,#00,#00,#0E,#02,#00,#00,#00,#0D
    DB #02,#00,#00,#00,#0C,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0A,#02
    DB #00,#00,#00,#0A,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00
    DB #00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00
    DB #09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09
    DB #02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02
    DB #00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00
    DB #00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_9:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #1C          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_9_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_9_pt3_steps:
    DB #0C,#06,#00,#00,#00,#0C,#02,#00,#00,#00,#0C,#02,#00,#00,#00,#0C
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00
    DB #00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00
    DB #09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#08,#02,#00,#00,#00,#08
    DB #02,#00,#00,#00,#08,#02,#00,#00,#00,#08,#02,#00,#00,#00,#08,#02
    DB #00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00
    DB #00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_10:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0A          ; +16 PT3 sample length
    DB #09          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_10_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_10_pt3_steps:
    DB #0F,#06,#4C,#FF,#01,#0E,#06,#9C,#FF,#03,#0D,#06,#D3,#FF,#06,#0B
    DB #06,#00,#00,#09,#09,#04,#00,#00,#0C,#07,#04,#00,#00,#0F,#05,#04
    DB #00,#00,#0C,#03,#04,#00,#00,#08,#01,#04,#00,#00,#04,#00,#00,#00
    DB #00,#00

psg_track_0_c_major_chiptune_loop_inst_11:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0D          ; +16 PT3 sample length
    DB #0C          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_11_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_11_pt3_steps:
    DB #0F,#06,#FC,#FE,#00,#0F,#06,#56,#FF,#02,#0E,#06,#A6,#FF,#04,#0D
    DB #06,#E2,#FF,#07,#0C,#04,#00,#00,#0A,#0A,#04,#00,#00,#0D,#08,#04
    DB #00,#00,#0F,#06,#04,#00,#00,#0D,#05,#04,#00,#00,#0A,#03,#04,#00
    DB #00,#07,#02,#04,#00,#00,#04,#01,#04,#00,#00,#02,#00,#00,#00,#00
    DB #00

psg_track_0_c_major_chiptune_loop_inst_12:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #05          ; +16 PT3 sample length
    DB #04          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_12_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_12_pt3_steps:
    DB #0C,#04,#00,#00,#00,#08,#04,#00,#00,#02,#04,#04,#00,#00,#05,#01
    DB #04,#00,#00,#09,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_13:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0C          ; +16 PT3 sample length
    DB #0B          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_13_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_13_pt3_steps:
    DB #0D,#04,#00,#00,#00,#0C,#04,#00,#00,#01,#0B,#04,#00,#00,#02,#0A
    DB #04,#00,#00,#03,#09,#04,#00,#00,#04,#08,#04,#00,#00,#06,#06,#04
    DB #00,#00,#08,#05,#04,#00,#00,#0A,#04,#04,#00,#00,#0C,#02,#04,#00
    DB #00,#0F,#01,#04,#00,#00,#0C,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_14:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #06          ; +16 PT3 sample length
    DB #05          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_14_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_14_pt3_steps:
    DB #0F,#06,#00,#00,#01,#0C,#06,#1C,#02,#04,#09,#06,#78,#00,#07,#05
    DB #06,#A4,#01,#03,#02,#02,#C8,#00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_15:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0A          ; +16 PT3 sample length
    DB #09          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_15_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_15_pt3_steps:
    DB #0F,#06,#00,#00,#02,#0F,#06,#64,#00,#05,#0E,#02,#C8,#00,#00,#0C
    DB #02,#22,#01,#00,#0A,#02,#72,#01,#00,#08,#02,#AE,#01,#00,#06,#02
    DB #D6,#01,#00,#04,#02,#F4,#01,#00,#02,#02,#08,#02,#00,#00,#00,#00
    DB #00,#00

psg_track_0_c_major_chiptune_loop_inst_16:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #07          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_16_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_16_pt3_steps:
    DB #0F,#06,#00,#00,#01,#0E,#06,#5A,#00,#04,#0C,#02,#AA,#00,#00,#0A
    DB #02,#F0,#00,#00,#07,#02,#2C,#01,#00,#04,#02,#54,#01,#00,#02,#02
    DB #68,#01,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_17:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #05          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_17_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_17_pt3_steps:
    DB #0F,#02,#A6,#FF,#00,#0F,#02,#CE,#FF,#00,#0E,#02,#E8,#FF,#00,#0D
    DB #02,#F6,#FF,#00,#0C,#02,#00,#00,#00,#0B,#02,#04,#00,#00,#0A,#02
    DB #00,#00,#00,#0B,#02,#FC,#FF,#00

psg_track_0_c_major_chiptune_loop_inst_18:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #00          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_18_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_18_pt3_steps:
    DB #0F,#02,#FB,#FF,#00,#0F,#02,#FD,#FF,#00,#0F,#02,#00,#00,#00,#0E
    DB #02,#03,#00,#00,#0F,#02,#05,#00,#00,#0F,#02,#03,#00,#00,#0F,#02
    DB #00,#00,#00,#0E,#02,#FD,#FF,#00

psg_track_0_c_major_chiptune_loop_inst_19:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0B          ; +16 PT3 sample length
    DB #0A          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_19_pt3_steps          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_19_pt3_steps:
    DB #0F,#06,#4C,#04,#00,#0F,#06,#84,#03,#01,#0E,#06,#D0,#02,#02,#0D
    DB #06,#26,#02,#04,#0C,#06,#86,#01,#07,#0A,#06,#04,#01,#0A,#08,#06
    DB #96,#00,#0D,#06,#02,#50,#00,#00,#04,#02,#1E,#00,#00,#02,#02,#00
    DB #00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_pattern_0_rows:
    DB #2C,#04,#00,#FF,#31,#03,#FF,#FF,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#35,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#36,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#31,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#31,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#2C,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#31,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_1_rows:
    DB #29,#04,#00,#FF,#2E,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#30,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#35,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#31,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#31,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#35,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#36,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#35,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#36,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#38,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_2_rows:
    DB #2C,#04,#00,#FF,#31,#03,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#31,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#31,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#2C,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#38,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_3_rows:
    DB #2C,#04,#00,#FF,#3D,#06,#FF,#0F,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#38,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#38,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#42,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#41,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_4_rows:
    DB #29,#04,#00,#FF,#3D,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#42,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#41,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#41,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_5_rows:
    DB #2E,#04,#00,#FF,#3A,#06,#FF,#0F,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#33,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2A,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#FF,#FF,#FF
    DB #2A,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#FF,#FF,#FF,#36,#FF,#FF,#FF,#2A,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#FF,#FF,#FF
    DB #2A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#FF,#FF,#FF
    DB #2A,#FF,#FF,#FF,#36,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2A,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_6_rows:
    DB #29,#04,#00,#FF,#36,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#35,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#38,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#25,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_7_rows:
    DB #2E,#04,#00,#FF,#42,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#42,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3A,#FF,#FF,#FF,#46,#FF,#FF,#FF,#2E,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#41,#FF,#FF,#FF,#29,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_8_rows:
    DB #38,#04,#00,#0F,#3D,#06,#FF,#0F,#30,#01,#FF,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#42,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#27,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_9_rows:
    DB #27,#04,#00,#FF,#3F,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_10_rows:
    DB #29,#04,#00,#FF,#2E,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#30,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#35,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_11_rows:
    DB #2C,#04,#00,#FF,#38,#FF,#FF,#FF,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#35,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#36,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#38,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#36,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#35,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#31,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#30,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF

BITMAP_MUSIC_DATA_BANK_0_USED_END:
    ds #C000 - $, #FF
    org BITMAP_MUSIC_DATA_BANK_0_PHYS_START + #2000

; ==================================================================
; MUSIC DATA BANK 15 (chunk 1: shared tables + serialized songs, 7443/8192 bytes).
; Mapped into the music runtime window only while music_play_track / music_update run;
; the wrappers restore resident P2=2 and P3=3 before returning. Source PT3
; uses consecutive chunks as #8000/#A000 halves; native SCC/PSG uses P3.
; SCC-window bank numbers are never allocated. The ds guard fails loudly
; if this chunk ever outgrows its 8KB bank.
; ==================================================================
BITMAP_MUSIC_DATA_BANK_1_PHYS_START:
    org #A000
; ---- music bank chunk 1: shared header (1124 bytes) + 1 track blob(s) ----
scc_note_period_table_mb1:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE3,#0EFE,#0E27,#0D5B,#0C9C,#0BE6,#0B3B
    DW #0A9A,#0A01,#0972,#08EA,#086A,#07F1,#077F,#0713
    DW #06AD,#064D,#05F3,#059D,#054C,#0500,#04B8,#0474
    DW #0434,#03F8,#03BF,#0389,#0356,#0326,#02F9,#02CE
    DW #02A6,#0280,#025C,#023A,#021A,#01FB,#01DF,#01C4
    DW #01AB,#0193,#017C,#0167,#0152,#013F,#012D,#011C
    DW #010C,#00FD,#00EF,#00E1,#00D5,#00C9,#00BD,#00B3
    DW #00A9,#009F,#0096,#008E,#0086,#007E,#0077,#0070
    DW #006A,#0064,#005E,#0059,#0054,#004F,#004B,#0046
    DW #0042,#003F,#003B,#0038,#0034,#0031,#002F,#002C
    DW #0029,#0027,#0025,#0023,#0021,#001F,#001D,#001B

scc_vib_table_mb1:
    DB #00,#03,#06,#09,#0C,#0F,#11,#14,#16,#18,#1A,#1B,#1D,#1E,#1E,#1F
    DB #1F,#1F,#1E,#1E,#1D,#1B,#1A,#18,#16,#14,#11,#0F,#0C,#09,#06,#03
    DB #00,#FD,#FA,#F7,#F4,#F1,#EF,#EC,#EA,#E8,#E6,#E5,#E3,#E2,#E2,#E1
    DB #E1,#E1,#E2,#E2,#E3,#E5,#E6,#E8,#EA,#EC,#EF,#F1,#F4,#F7,#FA,#FD

scc_noise_table_mb1:
    DB #2B,#D3,#12,#FA,#B3,#82,#EC,#BC,#96,#43,#E7,#DE,#D1,#60,#61,#8A
    DB #20,#E6,#74,#AD,#FE,#A1,#FD,#F3,#A8,#1D,#97,#C7,#1A,#A5,#A0,#56
    DB #10,#46,#32,#8C,#06,#CC,#2A,#15,#37,#C2,#23,#5C,#A0,#76,#7A,#8E
    DB #FD,#F2,#4C,#97,#C9,#02,#72,#23,#41,#34,#8B,#9D,#61,#D2,#F1,#32
    DB #E5,#E9,#C2,#CE,#49,#45,#D7,#1D,#C8,#72,#CF,#8B,#5F,#BB,#04,#43
    DB #C9,#2D,#93,#32,#84,#94,#58,#03,#CA,#7B,#EF,#24,#98,#30,#B3,#BF
    DB #AA,#BD,#C1,#C1,#7B,#EF,#F5,#D5,#49,#51,#EB,#69,#0E,#30,#FE,#A7
    DB #86,#98,#4B,#7C,#2F,#55,#AE,#94,#43,#F3,#C3,#5A,#BF,#BD,#E5,#FB
    DB #5F,#C0,#31,#63,#9E,#C8,#83,#3E,#B9,#60,#77,#F7,#AC,#D6,#68,#BB
    DB #33,#34,#73,#76,#CA,#47,#74,#D4,#AC,#9A,#07,#40,#D6,#7A,#87,#E8
    DB #04,#F3,#11,#B6,#B1,#D1,#81,#56,#1A,#A0,#73,#36,#3B,#AB,#42,#80
    DB #D0,#FF,#0B,#21,#55,#68,#AA,#C4,#05,#72,#BB,#D7,#DD,#68,#99,#84
    DB #99,#57,#61,#B8,#B4,#0B,#EF,#1F,#6B,#0F,#DF,#24,#BA,#B0,#8C,#F4
    DB #5D,#FB,#13,#7B,#CF,#B9,#50,#65,#4E,#79,#DE,#1D,#D4,#85,#1B,#D0
    DB #1D,#EA,#21,#6A,#A7,#74,#CD,#97,#AC,#AF,#BA,#C2,#29,#E6,#46,#19
    DB #DA,#26,#8B,#85,#3A,#3B,#66,#B5,#87,#B0,#72,#14,#BB,#D3,#0D,#CD
    DB #92,#AE,#51,#CD,#8A,#0D,#1B,#BF,#DD,#7E,#06,#11,#88,#4B,#70,#ED
    DB #47,#81,#73,#40,#95,#EC,#EC,#B6,#AF,#18,#76,#BA,#91,#50,#6F

; 0 unique waveform(s), 32 bytes each (signed two's complement)
scc_wave_table_mb1:
    DB #00

psg_note_period_table_mb1:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE4,#0EFF,#0E28,#0D5C,#0C9D,#0BE7,#0B3C
    DW #0A9B,#0A02,#0973,#08EB,#086B,#07F2,#0780,#0714
    DW #06AE,#064E,#05F4,#059E,#054D,#0501,#04B9,#0475
    DW #0435,#03F9,#03C0,#038A,#0357,#0327,#02FA,#02CF
    DW #02A7,#0281,#025D,#023B,#021B,#01FC,#01E0,#01C5
    DW #01AC,#0194,#017D,#0168,#0153,#0140,#012E,#011D
    DW #010D,#00FE,#00F0,#00E2,#00D6,#00CA,#00BE,#00B4
    DW #00AA,#00A0,#0097,#008F,#0087,#007F,#0078,#0071
    DW #006B,#0065,#005F,#005A,#0055,#0050,#004C,#0047
    DW #0043,#0040,#003C,#0039,#0035,#0032,#0030,#002D
    DW #002A,#0028,#0026,#0024,#0022,#0020,#001E,#001C

music_pt3_volume_table_mb1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#01,#01,#01,#01,#01,#01
    DB #00,#00,#00,#00,#01,#01,#01,#01,#01,#01,#01,#01,#02,#02,#02,#02
    DB #00,#00,#00,#01,#01,#01,#01,#01,#02,#02,#02,#02,#02,#03,#03,#03
    DB #00,#00,#01,#01,#01,#01,#02,#02,#02,#02,#03,#03,#03,#03,#04,#04
    DB #00,#00,#01,#01,#01,#02,#02,#02,#03,#03,#03,#04,#04,#04,#05,#05
    DB #00,#00,#01,#01,#02,#02,#02,#03,#03,#04,#04,#04,#05,#05,#06,#06
    DB #00,#00,#01,#01,#02,#02,#03,#03,#04,#04,#05,#05,#06,#06,#07,#07
    DB #00,#01,#01,#02,#02,#03,#03,#04,#04,#05,#05,#06,#06,#07,#07,#08
    DB #00,#01,#01,#02,#02,#03,#04,#04,#05,#05,#06,#07,#07,#08,#08,#09
    DB #00,#01,#01,#02,#03,#03,#04,#05,#05,#06,#07,#07,#08,#09,#09,#0A
    DB #00,#01,#01,#02,#03,#04,#04,#05,#06,#07,#07,#08,#09,#0A,#0A,#0B
    DB #00,#01,#02,#02,#03,#04,#05,#06,#06,#07,#08,#09,#0A,#0A,#0B,#0C
    DB #00,#01,#02,#03,#03,#04,#05,#06,#07,#08,#09,#0A,#0A,#0B,#0C,#0D
    DB #00,#01,#02,#03,#04,#05,#06,#07,#07,#08,#09,#0A,#0B,#0C,#0D,#0E
    DB #00,#01,#02,#03,#04,#05,#06,#07,#08,#09,#0A,#0B,#0C,#0D,#0E,#0F

; ------------------------------------------------------------------
; SCC Song 0: scc_silent_stub
; ------------------------------------------------------------------
scc_track_0_scc_silent_stub_data_mb1:
    DB #06          ; +0 frames per row
    DB #01          ; +1 order length
    DB #00          ; +2 restart position
    DB #01          ; +3 pattern count
    DW scc_track_0_scc_silent_stub_order_table_mb1          ; +4
    DW scc_track_0_scc_silent_stub_pattern_table_mb1          ; +6
    DW scc_track_0_scc_silent_stub_instrument_ptr_table_mb1  ; +8
    DW scc_track_0_scc_silent_stub_ornament_ptr_table_mb1    ; +10

scc_track_0_scc_silent_stub_order_table_mb1:
    DB #00

scc_track_0_scc_silent_stub_pattern_table_mb1:
    DW scc_track_0_scc_silent_stub_pattern_0_rows_mb1
    DB #01

scc_track_0_scc_silent_stub_instrument_ptr_table_mb1:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_scc_silent_stub_ornament_ptr_table_mb1:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_scc_silent_stub_pattern_0_rows_mb1:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF


; ------------------------------------------------------------------
; PSG half of dual song 0: C Major Chiptune Loop
; ------------------------------------------------------------------
psg_track_0_c_major_chiptune_loop_data_track0_mb1:
    DB #07          ; +0 frames per row
    DB #2A          ; +1 order length
    DB #00          ; +2 restart position
    DB #18          ; +3 pattern count
    DW psg_track_0_c_major_chiptune_loop_order_table_track0_mb1          ; +4
    DW psg_track_0_c_major_chiptune_loop_pattern_table_track0_mb1          ; +6
    DW psg_track_0_c_major_chiptune_loop_instrument_ptr_table_track0_mb1  ; +8
    DB #01          ; +10 bit0: music drives PSG channel C
    DB 0          ; +11 reserved
    DW #0001          ; +12 PT3 envelope period base
    DB #0C          ; +14 PT3 noise base
    DW psg_track_0_c_major_chiptune_loop_pattern_bank_table_track0_mb1          ; +15 pattern -> MegaROM bank
    DW psg_track_0_c_major_chiptune_loop_ornament_ptr_table_track0_mb1          ; +17 ornament pointer table

psg_track_0_c_major_chiptune_loop_order_table_track0_mb1:
    DB #10,#11,#10,#11,#08,#0E,#08,#0F,#03,#04,#03,#0D,#00,#01,#02,#0A
    DB #0B,#0C,#05,#06,#07,#09,#03,#04,#03,#0D,#00,#01,#02,#0A,#0B,#0C
    DB #05,#06,#07,#09,#12,#13,#14,#15,#16,#17

psg_track_0_c_major_chiptune_loop_pattern_table_track0_mb1:
    DW psg_track_0_c_major_chiptune_loop_pattern_0_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_1_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_2_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_3_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_4_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_5_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_6_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_7_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_8_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_9_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_10_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_11_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_12_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_13_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_14_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_15_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_16_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_17_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_18_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_19_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_20_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_21_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_22_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_23_rows
    DB #40
psg_track_0_c_major_chiptune_loop_pattern_bank_table_track0_mb1:
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 0
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 1
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 2
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 3
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 4
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 5
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 6
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 7
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 8
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 9
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 10
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 11
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 12
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 13
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 14
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 15
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 16
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 17
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 18
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 19
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 20
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 21
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 22
    DB BITMAP_MUSIC_DATA_BANK_2          ; @mideas:pattern-bank 23

psg_track_0_c_major_chiptune_loop_ornament_ptr_table_track0_mb1:
    DW 0
    DW psg_track_0_c_major_chiptune_loop_orn_1_track0_mb1
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

psg_track_0_c_major_chiptune_loop_orn_1_track0_mb1:
    DB #20          ; length
    DB #18          ; loop index
psg_track_0_c_major_chiptune_loop_orn_1_data_track0_mb1:
    DB #0C,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_instrument_ptr_table_track0_mb1:
    DW 0
    DW psg_track_0_c_major_chiptune_loop_inst_1_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_2_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_3_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_4_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_5_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_6_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_7_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_8_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_9_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_10_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_11_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_12_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_13_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_14_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_15_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_16_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_17_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_18_track0_mb1
    DW psg_track_0_c_major_chiptune_loop_inst_19_track0_mb1
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

psg_track_0_c_major_chiptune_loop_inst_1_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #21          ; +16 PT3 sample length
    DB #20          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_1_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_1_pt3_steps_track0_mb1:
    DB #0E,#02,#C8,#00,#06,#0E,#02,#90,#01,#00,#0D,#02,#58,#02,#00,#0C
    DB #02,#20,#03,#00,#0C,#02,#E8,#03,#00,#0B,#02,#B0,#04,#00,#0A,#02
    DB #78,#05,#00,#08,#02,#40,#06,#00,#06,#02,#08,#07,#00,#03,#02,#D0
    DB #07,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00
    DB #00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00
    DB #00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00
    DB #08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08
    DB #00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00
    DB #00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00
    DB #00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00
    DB #00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_2_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #02          ; +16 PT3 sample length
    DB #00          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_2_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_2_pt3_steps_track0_mb1:
    DB #0C,#07,#A0,#00,#0A,#1C,#07,#A0,#00,#40

psg_track_0_c_major_chiptune_loop_inst_3_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #18          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_3_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_3_pt3_steps_track0_mb1:
    DB #0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D
    DB #0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A
    DB #00,#00,#00,#0C,#0A,#00,#00,#00,#0C,#0A,#00,#00,#00,#0C,#0A,#00
    DB #00,#00,#0C,#0A,#00,#00,#00,#0B,#0A,#00,#00,#00,#0B,#0A,#00,#00
    DB #00,#0B,#0A,#00,#00,#00,#0B,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00
    DB #0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A
    DB #0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#09,#0A
    DB #00,#00,#00,#09,#0A,#00,#00,#00,#09,#0A,#FF,#FF,#00,#09,#0A,#FE
    DB #FF,#00,#09,#0A,#FF,#FF,#00,#09,#0A,#00,#00,#00,#09,#0A,#01,#00
    DB #00,#09,#0A,#02,#00,#00,#09,#0A,#01,#00,#00,#09,#0A,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_4_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #06          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_4_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_4_pt3_steps_track0_mb1:
    DB #0C,#08,#00,#00,#00,#0C,#08,#00,#00,#00,#0B,#08,#00,#00,#00,#0B
    DB #08,#00,#00,#00,#0A,#08,#00,#00,#00,#0A,#08,#00,#00,#00,#09,#08
    DB #00,#00,#00,#09,#08,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_5_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #09          ; +16 PT3 sample length
    DB #08          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_5_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_5_pt3_steps_track0_mb1:
    DB #0F,#06,#00,#00,#00,#0F,#06,#96,#00,#02,#0E,#06,#40,#01,#05,#0C
    DB #02,#E0,#01,#00,#0A,#02,#6C,#02,#00,#07,#02,#D0,#02,#00,#04,#02
    DB #0C,#03,#00,#02,#02,#34,#03,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_6_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #18          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_6_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_6_pt3_steps_track0_mb1:
    DB #0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00
    DB #00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00
    DB #00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00
    DB #0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#FF,#FF,#00,#0B,#02,#FE
    DB #FF,#00,#0B,#02,#FF,#FF,#00,#0B,#02,#00,#00,#00,#0B,#02,#01,#00
    DB #00,#0B,#02,#02,#00,#00,#0B,#02,#01,#00,#00,#0B,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_7_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #07          ; +16 PT3 sample length
    DB #06          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_7_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_7_pt3_steps_track0_mb1:
    DB #0F,#06,#00,#00,#01,#0F,#06,#DC,#00,#04,#0D,#02,#AE,#01,#00,#09
    DB #02,#58,#02,#00,#05,#02,#D0,#02,#00,#02,#02,#0C,#03,#00,#00,#00
    DB #00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_8_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #1F          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_8_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_8_pt3_steps_track0_mb1:
    DB #0F,#02,#00,#00,#00,#0F,#02,#00,#00,#00,#0E,#02,#00,#00,#00,#0D
    DB #02,#00,#00,#00,#0C,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0A,#02
    DB #00,#00,#00,#0A,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00
    DB #00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00
    DB #09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09
    DB #02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02
    DB #00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00
    DB #00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_9_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #1C          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_9_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_9_pt3_steps_track0_mb1:
    DB #0C,#06,#00,#00,#00,#0C,#02,#00,#00,#00,#0C,#02,#00,#00,#00,#0C
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00
    DB #00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00
    DB #09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#08,#02,#00,#00,#00,#08
    DB #02,#00,#00,#00,#08,#02,#00,#00,#00,#08,#02,#00,#00,#00,#08,#02
    DB #00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00
    DB #00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_10_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0A          ; +16 PT3 sample length
    DB #09          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_10_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_10_pt3_steps_track0_mb1:
    DB #0F,#06,#4C,#FF,#01,#0E,#06,#9C,#FF,#03,#0D,#06,#D3,#FF,#06,#0B
    DB #06,#00,#00,#09,#09,#04,#00,#00,#0C,#07,#04,#00,#00,#0F,#05,#04
    DB #00,#00,#0C,#03,#04,#00,#00,#08,#01,#04,#00,#00,#04,#00,#00,#00
    DB #00,#00

psg_track_0_c_major_chiptune_loop_inst_11_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0D          ; +16 PT3 sample length
    DB #0C          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_11_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_11_pt3_steps_track0_mb1:
    DB #0F,#06,#FC,#FE,#00,#0F,#06,#56,#FF,#02,#0E,#06,#A6,#FF,#04,#0D
    DB #06,#E2,#FF,#07,#0C,#04,#00,#00,#0A,#0A,#04,#00,#00,#0D,#08,#04
    DB #00,#00,#0F,#06,#04,#00,#00,#0D,#05,#04,#00,#00,#0A,#03,#04,#00
    DB #00,#07,#02,#04,#00,#00,#04,#01,#04,#00,#00,#02,#00,#00,#00,#00
    DB #00

psg_track_0_c_major_chiptune_loop_inst_12_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #05          ; +16 PT3 sample length
    DB #04          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_12_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_12_pt3_steps_track0_mb1:
    DB #0C,#04,#00,#00,#00,#08,#04,#00,#00,#02,#04,#04,#00,#00,#05,#01
    DB #04,#00,#00,#09,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_13_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0C          ; +16 PT3 sample length
    DB #0B          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_13_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_13_pt3_steps_track0_mb1:
    DB #0D,#04,#00,#00,#00,#0C,#04,#00,#00,#01,#0B,#04,#00,#00,#02,#0A
    DB #04,#00,#00,#03,#09,#04,#00,#00,#04,#08,#04,#00,#00,#06,#06,#04
    DB #00,#00,#08,#05,#04,#00,#00,#0A,#04,#04,#00,#00,#0C,#02,#04,#00
    DB #00,#0F,#01,#04,#00,#00,#0C,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_14_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #06          ; +16 PT3 sample length
    DB #05          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_14_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_14_pt3_steps_track0_mb1:
    DB #0F,#06,#00,#00,#01,#0C,#06,#1C,#02,#04,#09,#06,#78,#00,#07,#05
    DB #06,#A4,#01,#03,#02,#02,#C8,#00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_15_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0A          ; +16 PT3 sample length
    DB #09          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_15_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_15_pt3_steps_track0_mb1:
    DB #0F,#06,#00,#00,#02,#0F,#06,#64,#00,#05,#0E,#02,#C8,#00,#00,#0C
    DB #02,#22,#01,#00,#0A,#02,#72,#01,#00,#08,#02,#AE,#01,#00,#06,#02
    DB #D6,#01,#00,#04,#02,#F4,#01,#00,#02,#02,#08,#02,#00,#00,#00,#00
    DB #00,#00

psg_track_0_c_major_chiptune_loop_inst_16_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #07          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_16_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_16_pt3_steps_track0_mb1:
    DB #0F,#06,#00,#00,#01,#0E,#06,#5A,#00,#04,#0C,#02,#AA,#00,#00,#0A
    DB #02,#F0,#00,#00,#07,#02,#2C,#01,#00,#04,#02,#54,#01,#00,#02,#02
    DB #68,#01,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_17_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #05          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_17_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_17_pt3_steps_track0_mb1:
    DB #0F,#02,#A6,#FF,#00,#0F,#02,#CE,#FF,#00,#0E,#02,#E8,#FF,#00,#0D
    DB #02,#F6,#FF,#00,#0C,#02,#00,#00,#00,#0B,#02,#04,#00,#00,#0A,#02
    DB #00,#00,#00,#0B,#02,#FC,#FF,#00

psg_track_0_c_major_chiptune_loop_inst_18_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #00          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_18_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_18_pt3_steps_track0_mb1:
    DB #0F,#02,#FB,#FF,#00,#0F,#02,#FD,#FF,#00,#0F,#02,#00,#00,#00,#0E
    DB #02,#03,#00,#00,#0F,#02,#05,#00,#00,#0F,#02,#03,#00,#00,#0F,#02
    DB #00,#00,#00,#0E,#02,#FD,#FF,#00

psg_track_0_c_major_chiptune_loop_inst_19_track0_mb1:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0B          ; +16 PT3 sample length
    DB #0A          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_19_pt3_steps_track0_mb1          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_19_pt3_steps_track0_mb1:
    DB #0F,#06,#4C,#04,#00,#0F,#06,#84,#03,#01,#0E,#06,#D0,#02,#02,#0D
    DB #06,#26,#02,#04,#0C,#06,#86,#01,#07,#0A,#06,#04,#01,#0A,#08,#06
    DB #96,#00,#0D,#06,#02,#50,#00,#00,#04,#02,#1E,#00,#00,#02,#02,#00
    DB #00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_pattern_12_rows:
    DB #29,#04,#00,#FF,#2E,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#0D,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3A,#FF,#FF,#0B,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_13_rows:
    DB #29,#04,#00,#FF,#3A,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#41,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #29,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#29,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#36,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #25,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_14_rows:
    DB #35,#04,#00,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#25,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_15_rows:
    DB #35,#04,#00,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #2E,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_16_rows:
    DB #38,#04,#00,#FF,#31,#03,#FF,#0D,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#38,#FF,#FF,#FF,#2C,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#38,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#38,#FF,#FF,#FF,#2C,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#38,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#2C,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#27,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#41,#06,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #30,#05,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3F,#05,#FF,#FF,#33,#FF,#FF,#FF,#27,#08,#FF,#FF
    DB #40,#06,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #41,#07,#FF,#FF,#38,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #3D,#08,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #3C,#09,#FF,#FF,#33,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_17_rows:
    DB #35,#04,#00,#FF,#2E,#03,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#35,#FF,#FF,#FF,#29,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#35,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#2E,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#35,#FF,#FF,#FF,#29,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#29,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#35,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#FF,#FF,#2A,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#25,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#36,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#2A,#FF,#FF,#FF,#30,#01,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#25,#08,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#36,#FF,#FF,#FF,#30,#02,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_18_rows:
    DB #2C,#FF,#00,#FF,#31,#FF,#FF,#FF,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#33,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#35,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#38,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_19_rows:
    DB #25,#FF,#00,#FF,#3C,#FF,#FF,#FF,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3A,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3C,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#25,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_20_rows:
    DB #28,#FF,#00,#FF,#3D,#FF,#FF,#FF,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#39,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#28,#03,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_21_rows:
    DB #2C,#04,#00,#FF,#41,#FF,#FF,#FF,#30,#01,#00,#0F
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#38,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#41,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#35,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#3D,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#3F,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF
    DB #27,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#27,#FF,#FF,#FF

psg_track_0_c_major_chiptune_loop_pattern_22_rows:
    DB #2C,#04,#00,#FF,#3D,#FF,#FF,#FF,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#0E,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#0D,#30,#02,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #38,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#09,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#2C,#FF,#FF,#FF
    DB #2C,#FF,#FF,#FF,#FF,#FF,#FF,#0C,#30,#01,#00,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#0B,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#0A,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#09,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#FF,#FF

BITMAP_MUSIC_DATA_BANK_1_USED_END:
    ds #C000 - $, #FF
    org BITMAP_MUSIC_DATA_BANK_1_PHYS_START + #2000

; ==================================================================
; MUSIC DATA BANK 16 (chunk 2: shared tables + serialized songs, 3987/8192 bytes).
; Mapped into the music runtime window only while music_play_track / music_update run;
; the wrappers restore resident P2=2 and P3=3 before returning. Source PT3
; uses consecutive chunks as #8000/#A000 halves; native SCC/PSG uses P3.
; SCC-window bank numbers are never allocated. The ds guard fails loudly
; if this chunk ever outgrows its 8KB bank.
; ==================================================================
BITMAP_MUSIC_DATA_BANK_2_PHYS_START:
    org #A000
; ---- music bank chunk 2: shared header (1124 bytes) + 1 track blob(s) ----
scc_note_period_table_mb2:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE3,#0EFE,#0E27,#0D5B,#0C9C,#0BE6,#0B3B
    DW #0A9A,#0A01,#0972,#08EA,#086A,#07F1,#077F,#0713
    DW #06AD,#064D,#05F3,#059D,#054C,#0500,#04B8,#0474
    DW #0434,#03F8,#03BF,#0389,#0356,#0326,#02F9,#02CE
    DW #02A6,#0280,#025C,#023A,#021A,#01FB,#01DF,#01C4
    DW #01AB,#0193,#017C,#0167,#0152,#013F,#012D,#011C
    DW #010C,#00FD,#00EF,#00E1,#00D5,#00C9,#00BD,#00B3
    DW #00A9,#009F,#0096,#008E,#0086,#007E,#0077,#0070
    DW #006A,#0064,#005E,#0059,#0054,#004F,#004B,#0046
    DW #0042,#003F,#003B,#0038,#0034,#0031,#002F,#002C
    DW #0029,#0027,#0025,#0023,#0021,#001F,#001D,#001B

scc_vib_table_mb2:
    DB #00,#03,#06,#09,#0C,#0F,#11,#14,#16,#18,#1A,#1B,#1D,#1E,#1E,#1F
    DB #1F,#1F,#1E,#1E,#1D,#1B,#1A,#18,#16,#14,#11,#0F,#0C,#09,#06,#03
    DB #00,#FD,#FA,#F7,#F4,#F1,#EF,#EC,#EA,#E8,#E6,#E5,#E3,#E2,#E2,#E1
    DB #E1,#E1,#E2,#E2,#E3,#E5,#E6,#E8,#EA,#EC,#EF,#F1,#F4,#F7,#FA,#FD

scc_noise_table_mb2:
    DB #2B,#D3,#12,#FA,#B3,#82,#EC,#BC,#96,#43,#E7,#DE,#D1,#60,#61,#8A
    DB #20,#E6,#74,#AD,#FE,#A1,#FD,#F3,#A8,#1D,#97,#C7,#1A,#A5,#A0,#56
    DB #10,#46,#32,#8C,#06,#CC,#2A,#15,#37,#C2,#23,#5C,#A0,#76,#7A,#8E
    DB #FD,#F2,#4C,#97,#C9,#02,#72,#23,#41,#34,#8B,#9D,#61,#D2,#F1,#32
    DB #E5,#E9,#C2,#CE,#49,#45,#D7,#1D,#C8,#72,#CF,#8B,#5F,#BB,#04,#43
    DB #C9,#2D,#93,#32,#84,#94,#58,#03,#CA,#7B,#EF,#24,#98,#30,#B3,#BF
    DB #AA,#BD,#C1,#C1,#7B,#EF,#F5,#D5,#49,#51,#EB,#69,#0E,#30,#FE,#A7
    DB #86,#98,#4B,#7C,#2F,#55,#AE,#94,#43,#F3,#C3,#5A,#BF,#BD,#E5,#FB
    DB #5F,#C0,#31,#63,#9E,#C8,#83,#3E,#B9,#60,#77,#F7,#AC,#D6,#68,#BB
    DB #33,#34,#73,#76,#CA,#47,#74,#D4,#AC,#9A,#07,#40,#D6,#7A,#87,#E8
    DB #04,#F3,#11,#B6,#B1,#D1,#81,#56,#1A,#A0,#73,#36,#3B,#AB,#42,#80
    DB #D0,#FF,#0B,#21,#55,#68,#AA,#C4,#05,#72,#BB,#D7,#DD,#68,#99,#84
    DB #99,#57,#61,#B8,#B4,#0B,#EF,#1F,#6B,#0F,#DF,#24,#BA,#B0,#8C,#F4
    DB #5D,#FB,#13,#7B,#CF,#B9,#50,#65,#4E,#79,#DE,#1D,#D4,#85,#1B,#D0
    DB #1D,#EA,#21,#6A,#A7,#74,#CD,#97,#AC,#AF,#BA,#C2,#29,#E6,#46,#19
    DB #DA,#26,#8B,#85,#3A,#3B,#66,#B5,#87,#B0,#72,#14,#BB,#D3,#0D,#CD
    DB #92,#AE,#51,#CD,#8A,#0D,#1B,#BF,#DD,#7E,#06,#11,#88,#4B,#70,#ED
    DB #47,#81,#73,#40,#95,#EC,#EC,#B6,#AF,#18,#76,#BA,#91,#50,#6F

; 0 unique waveform(s), 32 bytes each (signed two's complement)
scc_wave_table_mb2:
    DB #00

psg_note_period_table_mb2:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE4,#0EFF,#0E28,#0D5C,#0C9D,#0BE7,#0B3C
    DW #0A9B,#0A02,#0973,#08EB,#086B,#07F2,#0780,#0714
    DW #06AE,#064E,#05F4,#059E,#054D,#0501,#04B9,#0475
    DW #0435,#03F9,#03C0,#038A,#0357,#0327,#02FA,#02CF
    DW #02A7,#0281,#025D,#023B,#021B,#01FC,#01E0,#01C5
    DW #01AC,#0194,#017D,#0168,#0153,#0140,#012E,#011D
    DW #010D,#00FE,#00F0,#00E2,#00D6,#00CA,#00BE,#00B4
    DW #00AA,#00A0,#0097,#008F,#0087,#007F,#0078,#0071
    DW #006B,#0065,#005F,#005A,#0055,#0050,#004C,#0047
    DW #0043,#0040,#003C,#0039,#0035,#0032,#0030,#002D
    DW #002A,#0028,#0026,#0024,#0022,#0020,#001E,#001C

music_pt3_volume_table_mb2:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#01,#01,#01,#01,#01,#01
    DB #00,#00,#00,#00,#01,#01,#01,#01,#01,#01,#01,#01,#02,#02,#02,#02
    DB #00,#00,#00,#01,#01,#01,#01,#01,#02,#02,#02,#02,#02,#03,#03,#03
    DB #00,#00,#01,#01,#01,#01,#02,#02,#02,#02,#03,#03,#03,#03,#04,#04
    DB #00,#00,#01,#01,#01,#02,#02,#02,#03,#03,#03,#04,#04,#04,#05,#05
    DB #00,#00,#01,#01,#02,#02,#02,#03,#03,#04,#04,#04,#05,#05,#06,#06
    DB #00,#00,#01,#01,#02,#02,#03,#03,#04,#04,#05,#05,#06,#06,#07,#07
    DB #00,#01,#01,#02,#02,#03,#03,#04,#04,#05,#05,#06,#06,#07,#07,#08
    DB #00,#01,#01,#02,#02,#03,#04,#04,#05,#05,#06,#07,#07,#08,#08,#09
    DB #00,#01,#01,#02,#03,#03,#04,#05,#05,#06,#07,#07,#08,#09,#09,#0A
    DB #00,#01,#01,#02,#03,#04,#04,#05,#06,#07,#07,#08,#09,#0A,#0A,#0B
    DB #00,#01,#02,#02,#03,#04,#05,#06,#06,#07,#08,#09,#0A,#0A,#0B,#0C
    DB #00,#01,#02,#03,#03,#04,#05,#06,#07,#08,#09,#0A,#0A,#0B,#0C,#0D
    DB #00,#01,#02,#03,#04,#05,#06,#07,#07,#08,#09,#0A,#0B,#0C,#0D,#0E
    DB #00,#01,#02,#03,#04,#05,#06,#07,#08,#09,#0A,#0B,#0C,#0D,#0E,#0F

; ------------------------------------------------------------------
; SCC Song 0: scc_silent_stub
; ------------------------------------------------------------------
scc_track_0_scc_silent_stub_data_mb2:
    DB #06          ; +0 frames per row
    DB #01          ; +1 order length
    DB #00          ; +2 restart position
    DB #01          ; +3 pattern count
    DW scc_track_0_scc_silent_stub_order_table_mb2          ; +4
    DW scc_track_0_scc_silent_stub_pattern_table_mb2          ; +6
    DW scc_track_0_scc_silent_stub_instrument_ptr_table_mb2  ; +8
    DW scc_track_0_scc_silent_stub_ornament_ptr_table_mb2    ; +10

scc_track_0_scc_silent_stub_order_table_mb2:
    DB #00

scc_track_0_scc_silent_stub_pattern_table_mb2:
    DW scc_track_0_scc_silent_stub_pattern_0_rows_mb2
    DB #01

scc_track_0_scc_silent_stub_instrument_ptr_table_mb2:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_scc_silent_stub_ornament_ptr_table_mb2:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_scc_silent_stub_pattern_0_rows_mb2:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF


; ------------------------------------------------------------------
; PSG half of dual song 0: C Major Chiptune Loop
; ------------------------------------------------------------------
psg_track_0_c_major_chiptune_loop_data_track0_mb2:
    DB #07          ; +0 frames per row
    DB #2A          ; +1 order length
    DB #00          ; +2 restart position
    DB #18          ; +3 pattern count
    DW psg_track_0_c_major_chiptune_loop_order_table_track0_mb2          ; +4
    DW psg_track_0_c_major_chiptune_loop_pattern_table_track0_mb2          ; +6
    DW psg_track_0_c_major_chiptune_loop_instrument_ptr_table_track0_mb2  ; +8
    DB #01          ; +10 bit0: music drives PSG channel C
    DB 0          ; +11 reserved
    DW #0001          ; +12 PT3 envelope period base
    DB #0C          ; +14 PT3 noise base
    DW psg_track_0_c_major_chiptune_loop_pattern_bank_table_track0_mb2          ; +15 pattern -> MegaROM bank
    DW psg_track_0_c_major_chiptune_loop_ornament_ptr_table_track0_mb2          ; +17 ornament pointer table

psg_track_0_c_major_chiptune_loop_order_table_track0_mb2:
    DB #10,#11,#10,#11,#08,#0E,#08,#0F,#03,#04,#03,#0D,#00,#01,#02,#0A
    DB #0B,#0C,#05,#06,#07,#09,#03,#04,#03,#0D,#00,#01,#02,#0A,#0B,#0C
    DB #05,#06,#07,#09,#12,#13,#14,#15,#16,#17

psg_track_0_c_major_chiptune_loop_pattern_table_track0_mb2:
    DW psg_track_0_c_major_chiptune_loop_pattern_0_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_1_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_2_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_3_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_4_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_5_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_6_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_7_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_8_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_9_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_10_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_11_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_12_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_13_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_14_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_15_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_16_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_17_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_18_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_19_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_20_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_21_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_22_rows
    DB #20
    DW psg_track_0_c_major_chiptune_loop_pattern_23_rows
    DB #40
psg_track_0_c_major_chiptune_loop_pattern_bank_table_track0_mb2:
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 0
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 1
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 2
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 3
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 4
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 5
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 6
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 7
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 8
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 9
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 10
    DB BITMAP_MUSIC_DATA_BANK_0          ; @mideas:pattern-bank 11
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 12
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 13
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 14
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 15
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 16
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 17
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 18
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 19
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 20
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 21
    DB BITMAP_MUSIC_DATA_BANK_1          ; @mideas:pattern-bank 22
    DB BITMAP_MUSIC_DATA_BANK_2          ; @mideas:pattern-bank 23

psg_track_0_c_major_chiptune_loop_ornament_ptr_table_track0_mb2:
    DW 0
    DW psg_track_0_c_major_chiptune_loop_orn_1_track0_mb2
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

psg_track_0_c_major_chiptune_loop_orn_1_track0_mb2:
    DB #20          ; length
    DB #18          ; loop index
psg_track_0_c_major_chiptune_loop_orn_1_data_track0_mb2:
    DB #0C,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_instrument_ptr_table_track0_mb2:
    DW 0
    DW psg_track_0_c_major_chiptune_loop_inst_1_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_2_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_3_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_4_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_5_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_6_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_7_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_8_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_9_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_10_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_11_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_12_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_13_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_14_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_15_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_16_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_17_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_18_track0_mb2
    DW psg_track_0_c_major_chiptune_loop_inst_19_track0_mb2
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

psg_track_0_c_major_chiptune_loop_inst_1_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #21          ; +16 PT3 sample length
    DB #20          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_1_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_1_pt3_steps_track0_mb2:
    DB #0E,#02,#C8,#00,#06,#0E,#02,#90,#01,#00,#0D,#02,#58,#02,#00,#0C
    DB #02,#20,#03,#00,#0C,#02,#E8,#03,#00,#0B,#02,#B0,#04,#00,#0A,#02
    DB #78,#05,#00,#08,#02,#40,#06,#00,#06,#02,#08,#07,#00,#03,#02,#D0
    DB #07,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00
    DB #00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00
    DB #00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00
    DB #08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08
    DB #00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00
    DB #00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00
    DB #00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00,#00,#08,#00,#00,#00
    DB #00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_2_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #02          ; +16 PT3 sample length
    DB #00          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_2_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_2_pt3_steps_track0_mb2:
    DB #0C,#07,#A0,#00,#0A,#1C,#07,#A0,#00,#40

psg_track_0_c_major_chiptune_loop_inst_3_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #18          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_3_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_3_pt3_steps_track0_mb2:
    DB #0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D
    DB #0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A,#00,#00,#00,#0D,#0A
    DB #00,#00,#00,#0C,#0A,#00,#00,#00,#0C,#0A,#00,#00,#00,#0C,#0A,#00
    DB #00,#00,#0C,#0A,#00,#00,#00,#0B,#0A,#00,#00,#00,#0B,#0A,#00,#00
    DB #00,#0B,#0A,#00,#00,#00,#0B,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00
    DB #0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A
    DB #0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#0A,#0A,#00,#00,#00,#09,#0A
    DB #00,#00,#00,#09,#0A,#00,#00,#00,#09,#0A,#FF,#FF,#00,#09,#0A,#FE
    DB #FF,#00,#09,#0A,#FF,#FF,#00,#09,#0A,#00,#00,#00,#09,#0A,#01,#00
    DB #00,#09,#0A,#02,#00,#00,#09,#0A,#01,#00,#00,#09,#0A,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_4_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #06          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_4_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_4_pt3_steps_track0_mb2:
    DB #0C,#08,#00,#00,#00,#0C,#08,#00,#00,#00,#0B,#08,#00,#00,#00,#0B
    DB #08,#00,#00,#00,#0A,#08,#00,#00,#00,#0A,#08,#00,#00,#00,#09,#08
    DB #00,#00,#00,#09,#08,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_5_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #09          ; +16 PT3 sample length
    DB #08          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_5_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_5_pt3_steps_track0_mb2:
    DB #0F,#06,#00,#00,#00,#0F,#06,#96,#00,#02,#0E,#06,#40,#01,#05,#0C
    DB #02,#E0,#01,#00,#0A,#02,#6C,#02,#00,#07,#02,#D0,#02,#00,#04,#02
    DB #0C,#03,#00,#02,#02,#34,#03,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_6_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #18          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_6_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_6_pt3_steps_track0_mb2:
    DB #0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00
    DB #00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00
    DB #00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00
    DB #0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#FF,#FF,#00,#0B,#02,#FE
    DB #FF,#00,#0B,#02,#FF,#FF,#00,#0B,#02,#00,#00,#00,#0B,#02,#01,#00
    DB #00,#0B,#02,#02,#00,#00,#0B,#02,#01,#00,#00,#0B,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_7_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #07          ; +16 PT3 sample length
    DB #06          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_7_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_7_pt3_steps_track0_mb2:
    DB #0F,#06,#00,#00,#01,#0F,#06,#DC,#00,#04,#0D,#02,#AE,#01,#00,#09
    DB #02,#58,#02,#00,#05,#02,#D0,#02,#00,#02,#02,#0C,#03,#00,#00,#00
    DB #00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_8_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #1F          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_8_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_8_pt3_steps_track0_mb2:
    DB #0F,#02,#00,#00,#00,#0F,#02,#00,#00,#00,#0E,#02,#00,#00,#00,#0D
    DB #02,#00,#00,#00,#0C,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0A,#02
    DB #00,#00,#00,#0A,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00
    DB #00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00
    DB #09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09
    DB #02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02
    DB #00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00
    DB #00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_9_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #20          ; +16 PT3 sample length
    DB #1C          ; +17 PT3 loop
    DB #00          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_9_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_9_pt3_steps_track0_mb2:
    DB #0C,#06,#00,#00,#00,#0C,#02,#00,#00,#00,#0C,#02,#00,#00,#00,#0C
    DB #02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02,#00,#00,#00,#0B,#02
    DB #00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00
    DB #00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00
    DB #09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#08,#02,#00,#00,#00,#08
    DB #02,#00,#00,#00,#08,#02,#00,#00,#00,#08,#02,#00,#00,#00,#08,#02
    DB #00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00,#00,#00,#09,#02,#00
    DB #00,#00,#09,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00
    DB #00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00,#0A,#02,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_10_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0A          ; +16 PT3 sample length
    DB #09          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_10_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_10_pt3_steps_track0_mb2:
    DB #0F,#06,#4C,#FF,#01,#0E,#06,#9C,#FF,#03,#0D,#06,#D3,#FF,#06,#0B
    DB #06,#00,#00,#09,#09,#04,#00,#00,#0C,#07,#04,#00,#00,#0F,#05,#04
    DB #00,#00,#0C,#03,#04,#00,#00,#08,#01,#04,#00,#00,#04,#00,#00,#00
    DB #00,#00

psg_track_0_c_major_chiptune_loop_inst_11_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0D          ; +16 PT3 sample length
    DB #0C          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_11_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_11_pt3_steps_track0_mb2:
    DB #0F,#06,#FC,#FE,#00,#0F,#06,#56,#FF,#02,#0E,#06,#A6,#FF,#04,#0D
    DB #06,#E2,#FF,#07,#0C,#04,#00,#00,#0A,#0A,#04,#00,#00,#0D,#08,#04
    DB #00,#00,#0F,#06,#04,#00,#00,#0D,#05,#04,#00,#00,#0A,#03,#04,#00
    DB #00,#07,#02,#04,#00,#00,#04,#01,#04,#00,#00,#02,#00,#00,#00,#00
    DB #00

psg_track_0_c_major_chiptune_loop_inst_12_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #05          ; +16 PT3 sample length
    DB #04          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_12_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_12_pt3_steps_track0_mb2:
    DB #0C,#04,#00,#00,#00,#08,#04,#00,#00,#02,#04,#04,#00,#00,#05,#01
    DB #04,#00,#00,#09,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_13_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0C          ; +16 PT3 sample length
    DB #0B          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_13_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_13_pt3_steps_track0_mb2:
    DB #0D,#04,#00,#00,#00,#0C,#04,#00,#00,#01,#0B,#04,#00,#00,#02,#0A
    DB #04,#00,#00,#03,#09,#04,#00,#00,#04,#08,#04,#00,#00,#06,#06,#04
    DB #00,#00,#08,#05,#04,#00,#00,#0A,#04,#04,#00,#00,#0C,#02,#04,#00
    DB #00,#0F,#01,#04,#00,#00,#0C,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_14_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #06          ; +16 PT3 sample length
    DB #05          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_14_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_14_pt3_steps_track0_mb2:
    DB #0F,#06,#00,#00,#01,#0C,#06,#1C,#02,#04,#09,#06,#78,#00,#07,#05
    DB #06,#A4,#01,#03,#02,#02,#C8,#00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_15_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0A          ; +16 PT3 sample length
    DB #09          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_15_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_15_pt3_steps_track0_mb2:
    DB #0F,#06,#00,#00,#02,#0F,#06,#64,#00,#05,#0E,#02,#C8,#00,#00,#0C
    DB #02,#22,#01,#00,#0A,#02,#72,#01,#00,#08,#02,#AE,#01,#00,#06,#02
    DB #D6,#01,#00,#04,#02,#F4,#01,#00,#02,#02,#08,#02,#00,#00,#00,#00
    DB #00,#00

psg_track_0_c_major_chiptune_loop_inst_16_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #07          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_16_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_16_pt3_steps_track0_mb2:
    DB #0F,#06,#00,#00,#01,#0E,#06,#5A,#00,#04,#0C,#02,#AA,#00,#00,#0A
    DB #02,#F0,#00,#00,#07,#02,#2C,#01,#00,#04,#02,#54,#01,#00,#02,#02
    DB #68,#01,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_inst_17_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #05          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_17_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_17_pt3_steps_track0_mb2:
    DB #0F,#02,#A6,#FF,#00,#0F,#02,#CE,#FF,#00,#0E,#02,#E8,#FF,#00,#0D
    DB #02,#F6,#FF,#00,#0C,#02,#00,#00,#00,#0B,#02,#04,#00,#00,#0A,#02
    DB #00,#00,#00,#0B,#02,#FC,#FF,#00

psg_track_0_c_major_chiptune_loop_inst_18_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #08          ; +16 PT3 sample length
    DB #00          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_18_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_18_pt3_steps_track0_mb2:
    DB #0F,#02,#FB,#FF,#00,#0F,#02,#FD,#FF,#00,#0F,#02,#00,#00,#00,#0E
    DB #02,#03,#00,#00,#0F,#02,#05,#00,#00,#0F,#02,#03,#00,#00,#0F,#02
    DB #00,#00,#00,#0E,#02,#FD,#FF,#00

psg_track_0_c_major_chiptune_loop_inst_19_track0_mb2:
    DB #01          ; +0 flags (bit0 tone, bit1 noise)
    DB #0F          ; +1 default volume
    DW 0          ; +2 volume envelope ptr
    DB #00          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #0C          ; +6 AY noise period (R6)
    DW 0          ; +7 tone envelope ptr (signed semitones)
    DB #00          ; +9 tone envelope length
    DB #FF          ; +10 tone envelope loop (#FF = hold last)
    DW 0          ; +11 noise envelope ptr (R6 periods 0-31)
    DB #00          ; +13 noise envelope length
    DB #FF          ; +14 noise envelope loop (#FF = hold last)
    DB #01          ; +15 PT3 mode
    DB #0B          ; +16 PT3 sample length
    DB #0A          ; +17 PT3 loop
    DB #01          ; +18 PT3 envelope slide mode
    DW psg_track_0_c_major_chiptune_loop_inst_19_pt3_steps_track0_mb2          ; +19 PT3 step pointer
    DB #00          ; +21 PT3 envelope shape
psg_track_0_c_major_chiptune_loop_inst_19_pt3_steps_track0_mb2:
    DB #0F,#06,#4C,#04,#00,#0F,#06,#84,#03,#01,#0E,#06,#D0,#02,#02,#0D
    DB #06,#26,#02,#04,#0C,#06,#86,#01,#07,#0A,#06,#04,#01,#0A,#08,#06
    DB #96,#00,#0D,#06,#02,#50,#00,#00,#04,#02,#1E,#00,#00,#02,#02,#00
    DB #00,#00,#00,#00,#00,#00,#00

psg_track_0_c_major_chiptune_loop_pattern_23_rows:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #35,#12,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#30,#13,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#30,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#30,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #31,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#11,#01,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#01,#FF
    DB #32,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#30,#FF,#01,#FF,#32,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#32,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#30,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #30,#12,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#32,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#01,#FF,#32,#FF,#01,#FF
    DB #31,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#30,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#30,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#01,#FF,#FF,#FF,#FF,#FF,#30,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#32,#FF,#01,#FF
    DB #FF,#FF,#FF,#FF,#31,#FF,#01,#FF,#FF,#FF,#FF,#FF
    DB #33,#FF,#01,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#32,#FF,#01,#FF
    DB #34,#FF,#01,#FF,#31,#FF,#01,#FF,#FF,#FF,#FF,#FF

BITMAP_MUSIC_DATA_BANK_2_USED_END:
    ds #C000 - $, #FF
    org BITMAP_MUSIC_DATA_BANK_2_PHYS_START + #2000
    end
