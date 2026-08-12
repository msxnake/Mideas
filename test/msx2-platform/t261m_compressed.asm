; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap room backend (V9938 Graphic 4 command engine)
; Project: t261m
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
; MSX2_GAMEFLOW_INTRO_SCENES: 0
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
bitmap_room_hud_linked_2_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_hud_linked_3_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_render_0_p0_DATA_BANK EQU 5
bitmap_room_render_0_p1_DATA_BANK EQU 5
bitmap_room_collision_0_DATA_BANK EQU 5
bitmap_room_behavior_0_DATA_BANK EQU 5
bitmap_room_render_1_p0_DATA_BANK EQU 5
bitmap_room_render_1_p1_DATA_BANK EQU 5
bitmap_room_collision_1_DATA_BANK EQU 5
bitmap_room_behavior_1_DATA_BANK EQU 5
bitmap_room_render_2_p0_DATA_BANK EQU 5
bitmap_room_render_2_p1_DATA_BANK EQU 5
bitmap_room_collision_2_DATA_BANK EQU 5
bitmap_room_behavior_2_DATA_BANK EQU 5
bitmap_room_render_3_p0_DATA_BANK EQU 6
bitmap_room_render_3_p1_DATA_BANK EQU 6
bitmap_room_collision_3_DATA_BANK EQU 6
bitmap_room_behavior_3_DATA_BANK EQU 6
bitmap_room_render_4_p0_DATA_BANK EQU 6
bitmap_room_render_4_p1_DATA_BANK EQU 6
bitmap_room_collision_4_DATA_BANK EQU 6
bitmap_room_behavior_4_DATA_BANK EQU 6
bitmap_room_render_5_p0_DATA_BANK EQU 6
bitmap_room_render_5_p1_DATA_BANK EQU 6
bitmap_room_collision_5_DATA_BANK EQU 6
bitmap_room_behavior_5_DATA_BANK EQU 6
bitmap_room_render_6_p0_DATA_BANK EQU 6
bitmap_room_render_6_p1_DATA_BANK EQU 6
bitmap_room_collision_6_DATA_BANK EQU 6
bitmap_room_behavior_6_DATA_BANK EQU 7
bitmap_room_sprite_patterns_DATA_BANK EQU 7


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





; --- SHOOT skill runtime state (15 bytes) ---
bitmap_bullet_pool     EQU #C0DA
bitmap_shoot_cooldown  EQU #C0E6
bitmap_shoot_lock      EQU #C0E7
bitmap_bullet_borrow_group EQU #C0E8









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
; Linked HUD icon row #0 (hud_el_1783004114045_6h49y), bound to "playerEnergy".
hud_linked_0_drawn EQU #D000
; Linked HUD counter #1 (hud_el_1783009772122_go9ku), bound to "collectibles" [8-bit, 2 digits].
hud_linked_1_drawn EQU #D001
hud_linked_1_value EQU #D002
; Linked HUD icon toggle #2 (hud_el_1783454311897_7p2ha), bound to "keyItem".
hud_linked_2_drawn EQU #D003
; Linked HUD counter #3 (hud_el_1783527996153_k7cbd), bound to "keyItem" [8-bit, 2 digits].
hud_linked_3_drawn EQU #D004
bitmap_key_count EQU #D008
; Health pickups (SCREEN 5 bitmap): 1 pickup(s). RAM follows the gem chain.
bitmap_heal_work_offset EQU #D009
bitmap_heal_target_page EQU #D00A
bitmap_heal_flags       EQU #D00B
bitmap_heal_cmd_block   EQU #C2C0
; Player-linked State Machine runtime (SCREEN 5 bitmap route).
bitmap_sm_state EQU #D040
bitmap_light_x                 EQU #D041
bitmap_light_y                 EQU #D042
bitmap_light_tx                EQU #D043
bitmap_light_ty                EQU #D044
bitmap_light_active            EQU #D045
bitmap_light_page              EQU #D046
bitmap_light_op_clr            EQU #D047
bitmap_light_op_cmd            EQU #D048
bitmap_light_d                 EQU #D049
bitmap_light_xsign             EQU #D04A
bitmap_light_xadj              EQU #D04B
bitmap_light_ybias             EQU #D04C
bitmap_light_rx                EQU #D04D
bitmap_light_ry                EQU #D04E
bitmap_light_rw                EQU #D04F
bitmap_light_rh                EQU #D051
bitmap_light_band_y            EQU #D052
bitmap_light_band_h            EQU #D053
bitmap_light_band_hw           EQU #D054
bitmap_light_on                EQU #D055
bitmap_light_stage             EQU #D056
bitmap_light_timer             EQU #D057
bitmap_light_bands_ptr         EQU #D059
bitmap_light_sdown_ptr         EQU #D05B
bitmap_light_sdown_n           EQU #D05D
bitmap_light_sup_ptr           EQU #D05E
bitmap_light_sup_n             EQU #D060
bitmap_light_cxmin             EQU #D061
bitmap_light_cxmax             EQU #D062
bitmap_mush_cx                 EQU #D063
bitmap_mush_cy                 EQU #D064
bitmap_light_srx               EQU #D065
bitmap_light_sry               EQU #D066
bitmap_light_srw               EQU #D067
bitmap_light_srh               EQU #D068
bitmap_light_tx0               EQU #D069
bitmap_light_ty0               EQU #D06A
bitmap_light_tw                EQU #D06B
bitmap_light_th                EQU #D06C
bitmap_mush_ex                 EQU #D06D
bitmap_mush_ey                 EQU #D06E
bitmap_mush_flag               EQU #D06F
bitmap_mush_sx                 EQU #D070
bitmap_mush_sy                 EQU #D071
bitmap_light_protect           EQU #D073
bitmap_mush_flags              EQU #D074
; --- ENEMY runtime state (26 bytes): count + 1 slot(s) x 23 + update lane
; (x,y,dx,dy,minX,maxX,minY,maxY,animTick,animFrame,frameCount,animDelay,colorOff,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane) ---
bitmap_enemy_count EQU #D00C
bitmap_enemy_pool  EQU #D00D
bitmap_enemy_update_lane EQU #D024
; --- MOVING PLATFORM runtime state (26 bytes): count + rider + 2 slot(s) x 11
; (x,y,dx,dy,minX,maxX,minY,maxY,widthCells,movedX,movedY) ---
bitmap_platform_count EQU #D026
bitmap_platform_rider EQU #D027
bitmap_platform_pool  EQU #D028
; Per-slot colour state: 0 = authored (normal room), 1 = dim, 2 = inside halo.
bitmap_platform_light_state EQU #D03E

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

; ---- Source-faithful PT3: public status, mapper banks and replayer RAM ----
mapper_bank_p2_current EQU #C3FF
music_active          EQU #C400
music_muted           EQU #C401
music_loop            EQU #C402
music_track_index     EQU #C403
music_pt3_data_bank_0 EQU #C404
music_pt3_data_bank_1 EQU #C405
BITMAP_MUSIC_DATA_BANK_0 EQU 8   ; PT3 half 0, mapped to P2/#8000
BITMAP_MUSIC_DATA_BANK_1 EQU 9   ; PT3 half 1, mapped to P3/#A000

; ==================================================================
; PT3 REPLAYER WORKSPACE (~448 bytes)
; Layout matches PT3-ROM-alltables-glass.asm expected labels
; ==================================================================
PT3_SETUP       EQU #C406   ; PT3 state flags (bit0=loop, bit7=song_ended)
PT3_MODADDR     EQU #C407   ; Module address pointer (2 bytes)
PT3_CrPsPtr     EQU #C409   ; Current position pointer
PT3_SAMPTRS     EQU #C40B   ; Sample pointers base
PT3_OrnPtrs     EQU #C40D   ; Ornament pointers base
PT3_PDSP        EQU #C40F   ; Pattern data start pointer
PT3_CSP         EQU #C411   ; Saved SP (CHREGS SP trick)
PT3_PSP         EQU #C413   ; PT3 stack pointer save
PT3_PrNote      EQU #C415   ; Previous note
PT3_PrSlide     EQU #C416   ; Previous slide (2 bytes)
PT3_AdInPtA     EQU #C418   ; Channel A inline pointer
PT3_AdInPtB     EQU #C41A   ; Channel B inline pointer
PT3_AdInPtC     EQU #C41C   ; Channel C inline pointer
PT3_LPosPtr     EQU #C41E   ; Loop position pointer
PT3_PatsPtr     EQU #C420   ; Patterns table pointer
PT3_Delay       EQU #C422   ; Song speed/delay
PT3_AddToEn     EQU #C423   ; Add to envelope
PT3_Env_Del     EQU #C424   ; Envelope delay
PT3_ESldAdd     EQU #C425   ; Envelope slide add (2 bytes)
PT3_NTL3        EQU #C427   ; Note table link 3
VARS            EQU #C429   ; Channel vars base
ChanA           EQU #C429   ; Channel A data (29 bytes)
ChanB           EQU #C446   ; Channel B data (29 bytes)
ChanC           EQU #C463   ; Channel C data (29 bytes)
DelyCnt         EQU #C480   ; Delay counter
CurESld         EQU #C481   ; Current envelope slide (2 bytes)
CurEDel         EQU #C483   ; Current envelope delay
Ns_Base_AddToNs EQU #C484   ; Noise base + add to noise (combined)
Ns_Base         EQU #C484   ; Noise base
AddToNs         EQU #C485   ; Add to noise
NT_             EQU #C486   ; Note table (192 bytes)
AYREGS          EQU #C546  ; AY registers mirror (14 bytes)
VT_             EQU #C546  ; Volume table base (alias for AYREGS)
EnvBase         EQU #C554  ; Envelope base
VAR0END         EQU #C556  ; End of fixed workspace
T1_             EQU #C556  ; Tone tables start (unpacked by PT3_INIT)
T_NEW_1         EQU #C556  ; Tone table new 1
T_OLD_1         EQU #C556  ; Tone table old 1
T_OLD_2         EQU #C56E  ; Tone table old 2
T_NEW_3         EQU #C586  ; Tone table new 3
T_OLD_3         EQU #C586  ; Tone table old 3
T_OLD_0         EQU #C588  ; Tone table old 0
T_NEW_0         EQU #C588  ; Tone table new 0
T_NEW_2         EQU #C5A0  ; Tone table new 2 (last, ends at +0x1B2)
    
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
    call load_screen5_bitmap_palette
    call init_bitmap_hud_band
    call upload_tileset_atlas
    call init_hardware_sprite_tables
    ; Upload bullet sprite pattern (32 bytes) to VRAM #FC40
    ld hl, bitmap_bullet_pattern_data
    ld de, #FC40
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
    call bitmap_apply_heals_visible    ; draw untaken health pickups on current page

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
    call upload_hud_linked_2
    ld a, #FF
    ld (hud_linked_2_drawn), a
    call upload_hud_linked_3
    ld a, #FF
    ld (hud_linked_3_drawn), a
    xor a
    ld (bitmap_key_count), a
    ld a, 0
    ld (bitmap_sm_state), a
    ld a, 1
    ld (player_anim_state), a
    xor a
    ld (bitmap_light_active), a       ; no halo painted yet
    ld (bitmap_light_protect), a
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
    ; Clear SHOOT pool (15 bytes at bitmap_bullet_pool)
    call bitmap_shoot_init_clear

    call bitmap_enter_game_loop
    jp bitmap_gf_node_3
bitmap_gf_node_3:
    ; Transition "screen5_vertical_pixel_wipe" skipped: intro helper routines not emitted in this build.
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
    call bitmap_apply_heals_visible    ; draw untaken health pickups on current page

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
    call upload_hud_linked_2
    ld a, #FF
    ld (hud_linked_2_drawn), a
    call upload_hud_linked_3
    ld a, #FF
    ld (hud_linked_3_drawn), a
    xor a
    ld (bitmap_key_count), a
    ld a, 0
    ld (bitmap_sm_state), a
    ld a, 1
    ld (player_anim_state), a
    xor a
    ld (bitmap_light_active), a       ; no halo painted yet
    ld (bitmap_light_protect), a
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
    ; Clear SHOOT pool (15 bytes at bitmap_bullet_pool)
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
    call bitmap_platform_ride_detect
.skip_player_movement:
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_linked_0    ; redraw linked HUD icon row #0 (hud_el_1783004114045_6h49y)
    call update_hud_linked_1    ; redraw linked HUD counter #1 (hud_el_1783009772122_go9ku)
    call update_hud_linked_2    ; redraw linked HUD icon #2 (hud_el_1783454311897_7p2ha)
    call update_hud_linked_3    ; redraw linked HUD counter #3 (hud_el_1783527996153_k7cbd)
    call bitmap_update_heals    ; health pickups: refill 1 heart + cell erase
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
    DW 104
    DW 66
    DW 54
    DW 43
    DW 91
    DW 54
    DW 34

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
    DB 31,0,55,0,0,0,0
bitmap_room_spawn_y_table:
    DB 143,216,167,216,216,216,216

; __MIDEAS_BITMAP_RESIDENT_DISPATCH_END__


; ==================================================================
; SCC MUSIC (Fase 5): driver + row players + public music_* API
; (song DATA is emitted at #A000 near the end of the boot image: the
; resident #4000-#7FFF window must keep the room tables below #8000)
; ==================================================================
; ==================================================================
; PT3 MUSIC BACKEND
; Uses the PT3 replayer for AY-3-8910 music playback.
; PT3_SETUP, ChanA, AYREGS, etc. are defined in variables.asm.
; ==================================================================

; ------------------------------------------------------------------
; music_init_system
; Reset PT3 music state. Call once at startup.
; Destroys: AF
; ------------------------------------------------------------------
music_init_system:
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ld (music_track_index), a
    ld (PT3_SETUP), a
    ret

; ------------------------------------------------------------------
; music_silence_channels
; Silence all AY channels via direct PSG port writes.
; Destroys: AF, E
; ------------------------------------------------------------------
music_silence_channels:
    ld a, 8
    out (#A0), a
    xor a
    out (#A1), a            ; Channel A volume=0
    ld a, 9
    out (#A0), a
    xor a
    out (#A1), a            ; Channel B volume=0
    ld a, 10
    out (#A0), a
    xor a
    out (#A1), a            ; Channel C volume=0
    ld a, 7
    out (#A0), a
    ld a, #3F
    out (#A1), a            ; All tones+noise off
    ret

; ------------------------------------------------------------------
; music_stop
; Stop music and silence channels.
; Destroys: AF
; ------------------------------------------------------------------
music_stop:
    push af
    xor a
    ld (music_active), a
    ld (PT3_SETUP), a
    call music_silence_channels
    pop af
    ret

; ------------------------------------------------------------------
; music_mute
; Mute music (keep track position).
; Destroys: AF
; ------------------------------------------------------------------
music_mute:
    ld a, (music_active)
    or a
    ret z
    ld a, 1
    ld (music_muted), a
    call music_silence_channels
    ret

; ------------------------------------------------------------------
; music_resume
; Resume muted music.
; Destroys: AF
; ------------------------------------------------------------------
music_resume:
    ld a, (music_active)
    or a
    ret z
    xor a
    ld (music_muted), a
    ret

; ------------------------------------------------------------------
; music_execute_command
; Dispatch a music command from Game Flow nodes.
; Input:  DE -> [command, trackIndex, loopFlag]
;         0=stop, 1=play, 2=mute, 3=resume, #FF=no-op
; Destroys: AF, BC (play path), DE (play path), HL
; ------------------------------------------------------------------
music_execute_command:
    ld a, (de)
    cp #FF
    ret z
    or a
    jp z, music_stop
    cp 1
    jp z, .pt3_exec_play
    cp 2
    jp z, music_mute
    cp 3
    jp z, music_resume
    ret
.pt3_exec_play:
    inc de
    ld a, (de)
    ld c, a
    inc de
    ld a, (de)
    ld b, a
    ld a, c
    call music_play_track
    ret

; ------------------------------------------------------------------
; music_play_track
; Start playing a PT3 track.
; Input:  A = track index (0-based)
;         B = loop flag (0=no loop, 1=loop)
; Destroys: AF, BC, DE, HL, IX, IY
; ------------------------------------------------------------------
music_play_track:
    ld (music_track_index), a
    ld a, (music_track_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_pt3_track_bank_table
    add hl, de
    ld a, (hl)
    ld (music_pt3_data_bank_0), a
    inc hl
    ld a, (hl)
    ld (music_pt3_data_bank_1), a
    ld a, b
    and 1
    ld (music_loop), a
    ld a, (music_track_index)
    add a, a               ; *2 (DW entries)
    ld e, a
    ld d, 0
    ld hl, music_pt3_track_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e                ; HL = adjusted module address
    xor a
    ld (music_muted), a
    ld (PT3_SETUP), a      ; Clear end-of-song flag
    ld a, i                ; Preserve IFF2 across init (safe from ISR/mainline)
    push af
    di
    ld a, (music_pt3_data_bank_0)
    call mapper_set_bank_p2
    ld a, (music_pt3_data_bank_1)
    call mapper_set_bank_p3
    push ix
    push iy
    call PT3_INIT
    pop iy
    pop ix
    ld a, 3
    call mapper_set_bank_p3
    ld a, 2
    call mapper_set_bank_p2
    ld a, 1
    ld (music_active), a   ; Enable playback AFTER PT3 is fully initialised
    pop af
    jp po, .pt3_play_track_ret
    ei
.pt3_play_track_ret:
    ret

; ------------------------------------------------------------------
; music_update
; Update PT3 playback. Called every frame from the main loop or ISR.
; Checks end-of-song flag, handles loop/stop, runs PT3_PLAY+PT3_ROUT.
; Destroys: AF, HL, DE (saves/restores IX/IY around PT3 calls)
; ------------------------------------------------------------------
music_update:
    ld a, (music_active)
    or a
    ret z
    ld a, (music_muted)
    or a
    ret nz
    ; Check if song ended (CHECKLP sets bit7 of PT3_SETUP)
    ld a, (PT3_SETUP)
    bit 7, a
    jr z, .pt3_upd_play
    ; Song ended - loop or stop?
    ld a, (music_loop)
    or a
    jr z, .pt3_upd_stop
    ; Loop: reinitialise from same track
    ld a, (music_track_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_pt3_track_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ; PT3 uses SP as a temporary data pointer. Preserve IFF2 and keep
    ; interrupts disabled until the replayer has restored the CPU stack.
    ld a, i
    push af
    di
    ld a, (music_pt3_data_bank_0)
    call mapper_set_bank_p2
    ld a, (music_pt3_data_bank_1)
    call mapper_set_bank_p3
    push ix
    push iy
    call PT3_INIT
    pop iy
    pop ix
    ld a, 3
    call mapper_set_bank_p3
    ld a, 2
    call mapper_set_bank_p2
    pop af
    jp po, .pt3_upd_loop_ret
    ei
.pt3_upd_loop_ret:
    ret
.pt3_upd_stop:
    xor a
    ld (music_active), a
    ret
.pt3_upd_play:
    ; PT3_PLAY/CHREGS/PTDECOD temporarily repurpose SP. An interrupt in
    ; that window corrupts the return chain, so preserve IFF2 atomically.
    ld a, i
    push af
    di
    ld a, (music_pt3_data_bank_0)
    call mapper_set_bank_p2
    ld a, (music_pt3_data_bank_1)
    call mapper_set_bank_p3
    push ix
    push iy
    call PT3_PLAY
    call PT3_ROUT
    pop iy
    pop ix
    ld a, 3
    call mapper_set_bank_p3
    ld a, 2
    call mapper_set_bank_p2
    pop af
    jp po, .pt3_upd_play_ret
    ei
.pt3_upd_play_ret:
    ret

; ------------------------------------------------------------------
; PT3 REPLAYER
; Uses a unique wrapper include so stale server/temp copies of older
; replayers can never shadow the canonical source selected with -I server.
; ------------------------------------------------------------------
    include "mideas-pt3-replayer-glass.asm"

; ------------------------------------------------------------------
; PT3 TRACK TABLE
; ------------------------------------------------------------------
music_pt3_track_count:
    DB #01

music_pt3_track_table:
    DW (pt3_track_0_bank_0 & #1FFF) | #8000 ; C Major Chiptune Loop (banked source)

; Mapper banks selected while PT3_INIT/PT3_PLAY read module data.
music_pt3_track_bank_table:
    DB BITMAP_MUSIC_DATA_BANK_0
    DB BITMAP_MUSIC_DATA_BANK_1



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
    call bitmap_apply_heals_pending_page    ; draw untaken health pickups on hidden page before flip
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
    ld b, #0F
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
    ld a, #88

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
    ld a, 4
    ld de, #2000
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
    DB 0,0, #40,#02, 0,0, 0,0, 8,0, 8,0, 0,0, #D0

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
    cp 4
    jp z, .bitmap_sm_anim_4
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
.bitmap_sm_anim_4:
    ld a, 3
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
    call bitmap_sm_read_input_2
    or a
    jp z, .bitmap_sm_transition_5
    ld a, 4
    ld (bitmap_sm_state), a
    ld a, 3
    ld (player_anim_state), a
    ret
.bitmap_sm_transition_5:
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

bitmap_sm_read_input_2:
    ; jump SPC, matrix row 8, mask #01.
    ; Output A=1 active, A=0 inactive. Preserves BC/DE/HL.
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    and #01
    jr nz, .bitmap_sm_read_input_2_inactive
    ld a, 1
    ret
.bitmap_sm_read_input_2_inactive:
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

; Room 0 health pickup records: x,y,flagOffset,drawCmd(15),eraseCmd(15)
bitmap_heals_room_0:
    DB #A0,#60,#00,#D0,#00,#00,#02,#A0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#00,#A0,#00,#74,#00,#10,#00,#10,#00,#11,#00
    DB #C0
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
    DB #01,#40,#40,#00,#01,#40,#40,#30,#A0,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#00,#00
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
    DB #00,#02,#08,#00,#02,#08,#02,#02,#08,#00,#02,#08


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

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #10000, raw 8192 bytes, RLE 5180 bytes
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
    DB #04,#EE,#01,#30,#08,#11,#08,#00,#01,#32,#01,#20,#01,#02,#05,#22
    DB #01,#0C,#01,#CC,#01,#44,#01,#47,#01,#74,#01,#4C,#01,#CC,#01,#C0
    DB #05,#22,#01,#11,#01,#22,#01,#30,#05,#00,#01,#22,#01,#00,#01,#20
    DB #01,#32,#01,#23,#01,#02,#02,#22,#01,#23,#01,#02,#01,#23,#01,#02
    DB #01,#00,#01,#22,#03,#02,#02,#20,#07,#00,#02,#22,#0A,#00,#01,#02
    DB #01,#20,#0B,#00,#01,#02,#01,#00,#01,#22,#03,#02,#02,#20,#02,#02
    DB #01,#22,#01,#00,#02,#02,#01,#20,#01,#02,#01,#32,#01,#22,#01,#12
    DB #03,#22,#01,#12,#01,#22,#01,#0E,#01,#33,#05,#EE,#01,#30,#02,#11
    DB #01,#01,#03,#11,#01,#01,#01,#11,#08,#00,#01,#32,#01,#20,#01,#02
    DB #05,#22,#01,#CC,#01,#C4,#01,#44,#02,#77,#01,#44,#01,#CC,#01,#44
    DB #05,#22,#01,#11,#01,#22,#01,#30,#05,#00,#01,#11,#01,#00,#01,#20
    DB #01,#32,#01,#20,#01,#02,#02,#22,#01,#21,#01,#12,#01,#23,#01,#02
    DB #01,#00,#01,#20,#03,#02,#01,#00,#01,#20,#07,#00,#02,#22,#0A,#00
    DB #01,#02,#01,#20,#0B,#00,#01,#02,#01,#00,#01,#20,#03,#02,#01,#00
    DB #01,#20,#02,#02,#01,#22,#03,#02,#02,#20,#08,#11,#01,#0E,#01,#3E
    DB #01,#E0,#01,#EE,#01,#E0,#01,#0E,#01,#EE,#01,#30,#01,#11,#01,#10
    DB #01,#01,#05,#11,#08,#00,#01,#32,#07,#22,#01,#CC,#05,#44,#01,#CC
    DB #01,#C4,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32,#06,#22,#01,#23
    DB #01,#02,#01,#20,#01,#22,#01,#00,#01,#20,#01,#02,#01,#20,#01,#22
    DB #07,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0B,#00,#01,#02,#01,#20
    DB #01,#22,#01,#00,#01,#20,#01,#02,#01,#20,#01,#22,#01,#00,#02,#22
    DB #02,#02,#01,#22,#02,#20,#01,#30,#03,#22,#01,#02,#03,#22,#01,#0E
    DB #01,#EE,#01,#E0,#02,#EE,#01,#0E,#01,#EE,#01,#30,#08,#11,#08,#00
    DB #01,#32,#07,#22,#01,#4C,#01,#44,#05,#CC,#01,#C4,#07,#22,#01,#30
    DB #07,#00,#01,#20,#01,#32,#06,#22,#01,#23,#0F,#00,#02,#22,#0A,#00
    DB #01,#02,#01,#20,#14,#00,#01,#22,#03,#02,#03,#20,#01,#30,#03,#22
    DB #01,#02,#03,#22,#01,#0E,#01,#E0,#02,#00,#01,#EE,#01,#0E,#01,#EE
    DB #01,#30,#08,#11,#08,#00,#01,#32,#07,#22,#02,#CC,#02,#C0,#01,#CC
    DB #01,#0C,#01,#CC,#01,#44,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32
    DB #06,#22,#01,#23,#0F,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#14,#00
    DB #01,#20,#02,#22,#01,#00,#03,#20,#01,#30,#03,#22,#01,#02,#03,#22
    DB #01,#0E,#01,#EE,#01,#E0,#02,#EE,#01,#0E,#01,#EE,#01,#30,#08,#11
    DB #08,#00,#01,#32,#07,#22,#01,#0C,#01,#C0,#01,#00,#02,#CC,#01,#00
    DB #01,#CC,#01,#C0,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32,#06,#22
    DB #01,#23,#0F,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#14,#00,#01,#02
    DB #01,#20,#01,#22,#01,#00,#01,#22,#01,#02,#01,#20,#01,#30,#03,#33
    DB #01,#03,#03,#33,#01,#00,#01,#EE,#01,#E0,#02,#EE,#01,#0E,#01,#E3
    DB #01,#00,#01,#13,#06,#33,#01,#31,#08,#00,#01,#32,#07,#22,#01,#00
    DB #01,#C0,#01,#0C,#02,#CC,#01,#00,#01,#CC,#01,#00,#07,#22,#01,#30
    DB #07,#00,#01,#20,#01,#32,#06,#22,#01,#23,#02,#00,#01,#22,#01,#00
    DB #01,#02,#01,#22,#09,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#0D,#00
    DB #01,#22,#01,#00,#01,#02,#04,#00,#01,#02,#01,#20,#01,#22,#01,#00
    DB #01,#22,#01,#02,#01,#20,#09,#00,#01,#0E,#04,#EE,#01,#30,#01,#00
    DB #01,#32,#01,#24,#01,#42,#02,#22,#01,#24,#01,#42,#01,#23,#08,#00
    DB #01,#32,#07,#22,#02,#00,#01,#0C,#01,#C4,#01,#CC,#03,#00,#05,#22
    DB #01,#00,#01,#22,#01,#30,#05,#00,#01,#22,#01,#00,#01,#20,#01,#32
    DB #06,#22,#01,#23,#02,#00,#01,#02,#01,#00,#01,#02,#0A,#00,#02,#22
    DB #0A,#00,#01,#02,#01,#20,#0D,#00,#01,#02,#01,#00,#01,#02,#04,#00
    DB #01,#02,#02,#20,#01,#00,#02,#02,#01,#00,#01,#33,#01,#30,#04,#33
    DB #01,#03,#01,#33,#02,#00,#03,#EE,#01,#E3,#02,#00,#01,#32,#01,#20
    DB #01,#02,#02,#22,#01,#20,#01,#02,#01,#23,#08,#00,#01,#32,#01,#20
    DB #01,#02,#05,#22,#02,#00,#01,#0C,#01,#C4,#01,#4C,#03,#00,#05,#22
    DB #01,#00,#01,#22,#01,#30,#05,#00,#01,#22,#01,#00,#01,#20,#01,#32
    DB #01,#23,#01,#02,#02,#22,#01,#23,#01,#12,#01,#23,#02,#00,#01,#02
    DB #01,#00,#01,#02,#01,#20,#09,#00,#02,#22,#0A,#00,#01,#02,#01,#20
    DB #0D,#00,#01,#02,#01,#00,#02,#02,#04,#00,#01,#22,#01,#20,#01,#00
    DB #01,#02,#01,#22,#01,#00,#01,#22,#01,#20,#04,#22,#01,#02,#01,#23
    DB #02,#00,#03,#EE,#01,#E3,#02,#00,#01,#32,#01,#24,#01,#40,#01,#04
    DB #01,#40,#01,#04,#01,#42,#01,#23,#08,#00,#01,#32,#01,#20,#01,#02
    DB #05,#22,#02,#00,#01,#0C,#01,#44,#01,#4C,#03,#00,#07,#22,#01,#30
    DB #07,#00,#01,#20,#01,#32,#01,#20,#01,#02,#02,#22,#01,#21,#01,#02
    DB #01,#23,#02,#00,#01,#02,#02,#00,#01,#02,#09,#00,#02,#22,#0A,#00
    DB #01,#02,#01,#20,#0D,#00,#01,#02,#01,#00,#01,#02,#01,#22,#04,#00
    DB #01,#22,#01,#20,#01,#00,#01,#02,#01,#22,#01,#00,#01,#22,#01,#20
    DB #04,#22,#01,#02,#01,#23,#02,#00,#01,#0E,#02,#EE,#01,#30,#02,#00
    DB #01,#32,#06,#22,#01,#23,#08,#00,#01,#32,#07,#22,#02,#00,#01,#0C
    DB #01,#C4,#01,#CC,#03,#00,#07,#22,#01,#30,#07,#00,#01,#20,#01,#32
    DB #06,#22,#01,#23,#02,#00,#01,#02,#02,#00,#01,#02,#09,#00,#02,#22
    DB #0A,#00,#01,#02,#01,#20,#0D,#00,#01,#02,#02,#00,#01,#02,#04,#00
    DB #01,#22,#01,#20,#02,#00,#01,#20,#01,#00,#08,#11,#03,#00,#01,#EE
    DB #01,#E3,#03,#00,#01,#30,#06,#22,#01,#03,#08,#00,#01,#03,#07,#33
    DB #03,#00,#01,#CC,#01,#C0,#03,#00,#07,#33,#01,#00,#07,#22,#01,#00
    DB #01,#03,#06,#33,#01,#31,#02,#00,#01,#02,#01,#00,#01,#02,#01,#20
    DB #09,#00,#02,#22,#0A,#00,#01,#02,#01,#20,#03,#00,#08,#22,#02,#00
    DB #01,#02,#02,#00,#01,#02,#04,#00,#01,#02,#03,#00,#01,#20,#01,#00
    DB #01,#02,#03,#22,#01,#02,#02,#22,#01,#23,#03,#00,#01,#03,#01,#30
    DB #03,#00,#01,#33,#01,#03,#04,#33,#01,#30,#01,#33,#13,#00,#01,#CC
    DB #01,#C0,#2A,#00,#02,#22,#09,#00,#01,#02,#02,#22,#01,#20,#02,#00
    DB #08,#22,#0A,#00,#01,#02,#05,#00,#01,#03,#03,#33,#01,#03,#03,#33
    DB #08,#00,#01,#13,#06,#33,#01,#31,#09,#00,#01,#0F,#02,#FF,#01,#F8
    DB #01,#EE,#01,#E0,#01,#00,#01,#FF,#01,#E0,#01,#00,#01,#0F,#04,#FF
    DB #08,#00,#04,#FF,#01,#F0,#01,#00,#01,#0E,#01,#8E,#01,#00,#02,#EE
    DB #01,#E8,#02,#FF,#01,#F0,#1C,#00,#01,#07,#01,#AA,#3B,#00,#04,#FF
    DB #01,#F8,#02,#EE,#01,#E0,#01,#FF,#01,#E0,#01,#EE,#01,#EB,#03,#FF
    DB #01,#FB,#01,#BE,#05,#00,#01,#0E,#01,#EB,#01,#BF,#03,#FF,#01,#8E
    DB #01,#EE,#01,#0E,#01,#8E,#01,#0E,#02,#EE,#01,#E8,#04,#FF,#12,#00
    DB #01,#07,#01,#70,#02,#00,#01,#07,#02,#77,#02,#00,#01,#0A,#01,#AA
    DB #3B,#00,#01,#FF,#01,#F0,#04,#00,#01,#0E,#01,#E0,#01,#BB,#01,#E0
    DB #01,#EE,#01,#E0,#01,#0F,#01,#FF,#01,#00,#01,#0B,#01,#BE,#01,#E0
    DB #04,#00,#01,#0E,#01,#EB,#02,#00,#01,#FF,#01,#F0,#01,#8E,#01,#EE
    DB #01,#0E,#01,#8E,#01,#0E,#01,#E0,#04,#00,#01,#0F,#01,#FF,#03,#00
    DB #01,#26,#03,#00,#01,#07,#01,#77,#01,#70,#02,#00,#01,#22,#05,#00
    DB #01,#A2,#01,#70,#02,#00,#03,#77,#01,#70,#01,#07,#01,#7A,#01,#AA
    DB #3B,#00,#01,#FF,#01,#EE,#01,#E0,#03,#00,#01,#EE,#01,#E0,#01,#88
    DB #01,#E0,#05,#00,#01,#EE,#01,#8E,#05,#00,#01,#0E,#01,#8E,#01,#EE
    DB #05,#00,#01,#0E,#01,#EE,#01,#0E,#01,#EE,#03,#00,#01,#08,#01,#88
    DB #01,#FF,#03,#00,#01,#22,#01,#60,#02,#00,#01,#07,#01,#27,#01,#77
    DB #02,#00,#01,#22,#05,#00,#01,#A9,#01,#A0,#01,#70,#01,#07,#01,#77
    DB #01,#22,#01,#27,#01,#70,#01,#07,#01,#7A,#01,#77,#3C,#00,#02,#EE
    DB #01,#EB,#03,#EE,#01,#E0,#01,#EE,#01,#00,#01,#0E,#01,#EE,#01,#88
    DB #01,#8E,#02,#EE,#01,#E0,#06,#00,#01,#0E,#02,#EE,#01,#88,#01,#8E
    DB #01,#EE,#01,#E0,#01,#00,#01,#EE,#01,#0E,#02,#EE,#01,#E8,#01,#8E
    DB #01,#EE,#01,#88,#04,#00,#01,#22,#01,#60,#01,#00,#01,#07,#01,#72
    DB #01,#22,#01,#77,#01,#70,#01,#AA,#06,#00,#01,#0A,#01,#AA,#01,#77
    DB #01,#07,#01,#72,#02,#22,#01,#77,#01,#07,#01,#A7,#01,#77,#3D,#00
    DB #01,#EE,#01,#EB,#02,#EE,#01,#00,#01,#04,#01,#BB,#01,#44,#01,#0E
    DB #01,#EE,#02,#88,#01,#EE,#09,#00,#01,#0E,#01,#EE,#02,#88,#01,#EE
    DB #01,#E0,#01,#4E,#01,#BA,#01,#40,#01,#00,#01,#EE,#01,#E8,#01,#88
    DB #01,#EE,#03,#00,#01,#07,#01,#70,#01,#06,#01,#67,#01,#70,#01,#07
    DB #01,#29,#01,#99,#01,#27,#01,#70,#01,#AA,#06,#00,#01,#07,#01,#7A
    DB #02,#77,#01,#29,#01,#9B,#01,#92,#01,#27,#01,#02,#02,#77,#42,#00
    DB #01,#44,#01,#BF,#01,#E4,#01,#40,#06,#00,#01,#04,#01,#AF,#01,#FF
    DB #01,#BE,#01,#E4,#07,#00,#01,#04,#01,#4E,#01,#FB,#01,#44,#08,#00
    DB #01,#06,#01,#60,#01,#07,#02,#77,#01,#06,#01,#29,#01,#BA,#01,#22
    DB #01,#77,#01,#A7,#01,#70,#01,#77,#01,#70,#02,#00,#01,#77,#01,#00
    DB #01,#7A,#01,#27,#01,#77,#01,#29,#01,#BB,#01,#B9,#01,#27,#01,#22
    DB #01,#27,#01,#77,#01,#00,#01,#70,#43,#00,#01,#0E,#06,#00,#01,#04
    DB #01,#EB,#01,#BB,#01,#8E,#01,#E4,#01,#44,#05,#00,#01,#0E,#01,#E0
    DB #0B,#00,#01,#06,#01,#A6,#01,#77,#01,#72,#01,#77,#01,#72,#01,#29
    DB #01,#BA,#01,#27,#01,#77,#01,#67,#01,#70,#01,#77,#01,#70,#02,#00
    DB #03,#77,#02,#22,#02,#99,#01,#BB,#01,#97,#01,#22,#01,#27,#01,#77
    DB #01,#07,#01,#77,#3F,#00,#01,#04,#01,#44,#01,#BF,#01,#E4,#01,#40
    DB #05,#00,#01,#04,#06,#44,#01,#40,#05,#00,#01,#04,#01,#4A,#01,#FB
    DB #01,#E4,#01,#40,#08,#00,#01,#A6,#01,#77,#01,#72,#01,#22,#01,#77
    DB #01,#22,#01,#A2,#02,#77,#01,#27,#02,#77,#01,#70,#01,#00,#01,#07
    DB #01,#72,#02,#77,#02,#22,#01,#29,#01,#22,#01,#AB,#01,#22,#01,#29
    DB #01,#22,#01,#77,#01,#07,#01,#A7,#44,#00,#01,#44,#03,#00,#01,#0E
    DB #01,#EE,#06,#00,#01,#EE,#01,#E0,#03,#00,#01,#44,#0D,#00,#01,#AA
    DB #01,#67,#01,#22,#01,#99,#01,#22,#01,#72,#01,#92,#01,#66,#01,#72
    DB #01,#22,#02,#77,#02,#00,#01,#07,#01,#22,#01,#27,#01,#72,#01,#29
    DB #01,#A2,#01,#22,#01,#29,#01,#9A,#01,#22,#01,#AA,#01,#A2,#01,#27
    DB #01,#79,#01,#A7,#08,#00,#01,#07,#01,#77,#35,#00,#01,#4E,#01,#EE
    DB #01,#E0,#02,#00,#02,#44,#01,#E0,#01,#00,#01,#FE,#01,#EE,#01,#0E
    DB #01,#AB,#01,#EE,#01,#E4,#01,#44,#01,#40,#02,#EE,#01,#00,#03,#44
    DB #02,#00,#01,#0E,#01,#EE,#01,#E4,#08,#00,#01,#76,#01,#96,#01,#29
    DB #01,#BB,#01,#92,#01,#22,#02,#99,#02,#92,#01,#27,#01,#70,#02,#00
    DB #01,#07,#01,#72,#02,#22,#02,#BB,#01,#92,#01,#9B,#01,#B9,#01,#99
    DB #01,#BB,#01,#BA,#02,#22,#01,#70,#08,#00,#03,#77,#01,#70,#01,#22
    DB #31,#00,#01,#FF,#01,#BB,#01,#BE,#01,#E0,#02,#44,#01,#40,#01,#44
    DB #01,#EE,#01,#E0,#01,#FA,#01,#EE,#01,#44,#02,#EE,#03,#44,#01,#EA
    DB #01,#A4,#01,#04,#02,#44,#01,#04,#02,#44,#01,#0E,#01,#AB,#01,#BA
    DB #01,#E0,#07,#00,#01,#77,#01,#66,#01,#2A,#01,#BB,#01,#B9,#01,#A9
    DB #01,#BB,#01,#9A,#01,#99,#01,#22,#01,#27,#01,#70,#01,#06,#01,#60
    DB #01,#07,#01,#77,#01,#22,#01,#2A,#02,#BB,#01,#A9,#01,#BB,#01,#BA
    DB #01,#AB,#01,#BF,#01,#BB,#01,#99,#01,#27,#01,#70,#05,#00,#01,#22
    DB #01,#00,#01,#07,#01,#72,#01,#99,#01,#27,#01,#70,#01,#62,#31,#00
    DB #01,#AA,#01,#BF,#01,#FE,#01,#40,#01,#AA,#02,#44,#01,#40,#01,#4E
    DB #01,#E0,#01,#BA,#01,#EE,#05,#44,#01,#4E,#01,#EE,#01,#AE,#01,#04
    DB #04,#44,#01,#AA,#01,#0E,#01,#EF,#01,#FA,#01,#E0,#06,#00,#01,#07
    DB #01,#77,#01,#76,#01,#AB,#01,#B9,#01,#29,#01,#DF,#01,#FB,#01,#B9
    DB #01,#DD,#01,#D2,#01,#27,#01,#77,#01,#76,#01,#96,#01,#00,#01,#77
    DB #01,#72,#01,#2B,#01,#BF,#01,#FB,#01,#AA,#01,#BF,#01,#BB,#01,#AF
    DB #01,#FF,#01,#FB,#01,#A9,#02,#77,#05,#00,#01,#22,#02,#77,#01,#29
    DB #01,#BB,#01,#97,#01,#77,#01,#70,#31,#00,#01,#4E,#02,#04,#01,#40
    DB #01,#A8,#01,#AA,#01,#E4,#01,#40,#01,#44,#01,#EA,#01,#BE,#01,#EA
    DB #01,#AE,#01,#44,#01,#EE,#02,#44,#01,#AA,#01,#AE,#01,#EE,#03,#44
    DB #01,#4E,#02,#AA,#01,#04,#01,#40,#01,#44,#01,#40,#06,#00,#01,#07
    DB #01,#27,#01,#77,#01,#22,#01,#A2,#01,#99,#01,#BF,#01,#FF,#01,#B9
    DB #01,#AD,#01,#D9,#01,#27,#01,#72,#01,#A6,#01,#20,#02,#77,#01,#22
    DB #01,#29,#01,#FF,#01,#BA,#01,#BB,#01,#BF,#01,#FB,#01,#AF,#01,#FB
    DB #01,#BB,#01,#A2,#01,#72,#01,#77,#01,#70,#04,#00,#01,#B6,#01,#26
    DB #01,#77,#01,#29,#01,#99,#01,#27,#02,#77,#01,#00,#01,#70,#2F,#00
    DB #01,#44,#02,#04,#01,#00,#01,#44,#01,#88,#01,#E4,#01,#40,#01,#4E
    DB #01,#EE,#01,#AE,#01,#EA,#01,#AE,#01,#EA,#01,#AB,#01,#AA,#01,#E0
    DB #01,#AA,#01,#AE,#01,#EE,#02,#44,#01,#0E,#01,#48,#01,#8A,#01,#44
    DB #01,#04,#02,#44,#01,#40,#06,#00,#01,#72,#01,#22,#01,#67,#01,#22
    DB #01,#99,#01,#DD,#02,#FF,#01,#FB,#01,#99,#01,#D2,#01,#27,#01,#2A
    DB #01,#67,#01,#00,#01,#77,#01,#22,#01,#29,#01,#99,#01,#BB,#01,#9B
    DB #01,#BF,#01,#FF,#01,#FB,#01,#BB,#01,#B9,#01,#BB,#01,#92,#02,#22
    DB #01,#77,#02,#00,#01,#02,#01,#20,#01,#00,#01,#72,#01,#27,#01,#2B
    DB #01,#BB,#02,#22,#03,#77,#2F,#00,#01,#44,#01,#00,#01,#04,#01,#00
    DB #03,#44,#01,#40,#01,#0E,#01,#EE,#01,#4E,#01,#EE,#01,#AE,#01,#EA
    DB #02,#BB,#01,#E4,#01,#AA,#02,#EE,#02,#44,#01,#00,#03,#44,#01,#00
    DB #01,#40,#01,#04,#01,#40,#06,#00,#01,#77,#01,#2A,#01,#92,#01,#22
    DB #01,#9B,#01,#BB,#01,#BF,#01,#FF,#01,#B9,#02,#92,#01,#2A,#01,#AA
    DB #01,#70,#01,#00,#01,#77,#01,#22,#01,#9A,#01,#A9,#02,#9B,#02,#FF
    DB #02,#FB,#01,#AA,#01,#29,#01,#A9,#01,#92,#01,#22,#01,#77,#02,#00
    DB #01,#02,#01,#27,#01,#77,#01,#76,#01,#29,#01,#BB,#01,#FB,#01,#B9
    DB #01,#92,#02,#27,#01,#70,#2F,#00,#01,#44,#02,#04,#01,#40,#03,#44
    DB #01,#04,#02,#44,#01,#4E,#01,#EE,#01,#BA,#03,#EE,#01,#E4,#01,#8A
    DB #02,#EE,#01,#44,#01,#04,#01,#40,#03,#44,#01,#04,#01,#40,#01,#44
    DB #01,#40,#06,#00,#01,#77,#01,#6D,#01,#22,#01,#92,#01,#AB,#01,#FF
    DB #01,#BF,#01,#FB,#01,#BB,#01,#99,#01,#92,#01,#29,#01,#67,#02,#00
    DB #01,#77,#01,#22,#02,#9A,#01,#BF,#01,#AB,#04,#FF,#01,#BB,#01,#9A
    DB #01,#AB,#01,#BA,#01,#22,#01,#27,#03,#00,#01,#77,#01,#62,#01,#72
    DB #01,#9B,#01,#BF,#01,#FF,#01,#BB,#01,#B6,#02,#77,#30,#00,#03,#44
    DB #01,#40,#01,#04,#01,#40,#01,#44,#01,#04,#01,#44,#01,#40,#01,#0E
    DB #01,#EA,#01,#E4,#01,#00,#01,#02,#01,#20,#01,#00,#01,#4A,#01,#AE
    DB #01,#E0,#01,#04,#01,#44,#01,#40,#02,#04,#01,#00,#01,#04,#02,#44
    DB #01,#40,#06,#00,#01,#07,#01,#62,#01,#29,#01,#DA,#01,#DB,#04,#FF
    DB #01,#B9,#01,#99,#01,#22,#01,#77,#02,#00,#01,#07,#01,#29,#01,#92
    DB #01,#9B,#01,#FF,#01,#BB,#03,#FF,#01,#FB,#01,#FF,#01,#B9,#01,#BF
    DB #01,#BA,#01,#22,#01,#27,#03,#00,#01,#07,#01,#22,#01,#B2,#01,#BB
    DB #03,#FF,#01,#B6,#01,#70,#32,#00,#01,#44,#01,#40,#04,#00,#01,#04
    DB #02,#44,#01,#EE,#01,#BA,#01,#E0,#01,#00,#02,#22,#01,#00,#01,#04
    DB #01,#BA,#01,#E0,#02,#44,#01,#40,#04,#00,#02,#44,#08,#00,#01,#72
    DB #01,#2A,#02,#BB,#04,#FF,#01,#FB,#01,#AB,#01,#92,#01,#22,#01,#77
    DB #01,#00,#01,#07,#01,#72,#01,#22,#01,#AB,#07,#FF,#01,#B9,#01,#BF
    DB #01,#B9,#01,#22,#05,#00,#01,#72,#01,#99,#01,#9B,#01,#BF,#01,#FF
    DB #01,#BB,#01,#92,#01,#22,#01,#27,#01,#70,#33,#00,#03,#44,#01,#04
    DB #01,#44,#01,#4E,#01,#AB,#01,#EE,#01,#00,#04,#22,#01,#00,#01,#EE
    DB #01,#BE,#02,#44,#01,#40,#01,#04,#02,#44,#0B,#00,#01,#07,#01,#29
    DB #01,#BF,#01,#BB,#01,#BF,#03,#FF,#01,#FB,#01,#BB,#01,#D9,#01,#26
    DB #01,#72,#02,#00,#01,#77,#01,#72,#01,#2B,#07,#FF,#01,#B9,#01,#29
    DB #01,#92,#01,#22,#05,#00,#01,#07,#01,#62,#01,#22,#01,#BB,#01,#FB
    DB #01,#B9,#02,#22,#01,#27,#01,#70,#31,#00,#01,#0E,#01,#EE,#01,#8B
    DB #01,#BE,#01,#EE,#01,#E0,#01,#44,#01,#4E,#01,#EA,#01,#EE,#01,#E2
    DB #01,#22,#01,#2A,#02,#22,#01,#2E,#01,#EE,#01,#AE,#02,#44,#01,#0E
    DB #01,#EE,#01,#EB,#01,#B8,#01,#EE,#01,#E0,#07,#00,#01,#0A,#01,#66
    DB #01,#D6,#01,#29,#01,#AB,#01,#BB,#01,#BF,#03,#FF,#01,#FB,#01,#BB
    DB #01,#B2,#02,#77,#01,#00,#01,#7A,#01,#07,#01,#72,#01,#99,#01,#BB
    DB #01,#FF,#01,#BF,#02,#FF,#01,#FB,#01,#FF,#01,#B9,#01,#92,#01,#77
    DB #01,#20,#06,#00,#01,#76,#01,#27,#01,#99,#01,#BB,#01,#22,#01,#27
    DB #01,#72,#01,#77,#31,#00,#01,#0E,#02,#EE,#01,#BF,#01,#F8,#01,#EE
    DB #01,#E0,#02,#44,#01,#4E,#01,#0E,#01,#E2,#01,#22,#01,#AF,#02,#22
    DB #01,#2E,#01,#E0,#01,#E4,#02,#44,#01,#0E,#01,#EE,#01,#8F,#01,#F8
    DB #02,#EE,#01,#E0,#06,#00,#01,#0D,#01,#62,#01,#A9,#02,#99,#01,#BF
    DB #03,#FF,#01,#BF,#01,#BD,#01,#BB,#01,#92,#01,#22,#01,#70,#01,#00
    DB #02,#AA,#02,#22,#01,#AB,#02,#BF,#02,#FF,#01,#FB,#01,#BB,#01,#A9
    DB #01,#92,#01,#27,#01,#77,#08,#00,#02,#22,#01,#27,#34,#00,#01,#EE
    DB #01,#E8,#01,#80,#01,#00,#01,#B8,#01,#0E,#01,#E0,#01,#44,#01,#EE
    DB #01,#44,#01,#0E,#01,#E2,#01,#22,#01,#AA,#01,#20,#01,#02,#01,#2E
    DB #01,#E0,#01,#44,#01,#EE,#01,#44,#01,#0E,#01,#E0,#01,#88,#01,#00
    DB #01,#08,#01,#8E,#01,#EE,#07,#00,#01,#60,#01,#77,#01,#76,#01,#99
    DB #01,#BF,#03,#FF,#01,#BB,#01,#A9,#01,#D7,#01,#77,#01,#70,#01,#00
    DB #01,#06,#01,#AA,#01,#92,#01,#77,#01,#79,#01,#A9,#01,#9B,#01,#BF
    DB #02,#FF,#01,#FB,#01,#BA,#01,#A9,#01,#92,#02,#77,#01,#70,#07,#00
    DB #01,#07,#01,#77,#35,#00,#01,#E0,#01,#8B,#01,#BB,#01,#08,#01,#BB
    DB #01,#B0,#01,#EE,#01,#0E,#01,#EA,#01,#00,#01,#0B,#01,#B2,#01,#20
    DB #01,#22,#01,#00,#01,#02,#01,#2B,#01,#B0,#01,#E0,#01,#AE,#01,#40
    DB #01,#EE,#01,#0B,#01,#BB,#01,#B0,#01,#BB,#01,#B8,#01,#EE,#08,#00
    DB #01,#07,#01,#72,#01,#2B,#01,#9B,#01,#FF,#01,#BB,#01,#FF,#01,#BD
    DB #01,#99,#01,#A2,#01,#27,#03,#00,#01,#AA,#01,#72,#01,#07,#01,#7B
    DB #01,#AB,#01,#9B,#02,#FF,#01,#FB,#01,#BF,#01,#92,#01,#A9,#01,#27
    DB #01,#77,#01,#72,#01,#20,#3E,#00,#01,#EE,#01,#80,#02,#08,#01,#00
    DB #01,#88,#01,#EE,#02,#00,#01,#EE,#01,#0E,#01,#E2,#01,#22,#02,#00
    DB #01,#22,#01,#2E,#02,#E0,#02,#00,#01,#EE,#01,#BB,#01,#08,#01,#BB
    DB #01,#B0,#01,#08,#01,#EE,#07,#00,#01,#07,#02,#77,#01,#AA,#01,#99
    DB #01,#BB,#01,#9A,#01,#BB,#01,#A2,#03,#22,#01,#70,#02,#00,#02,#07
    DB #01,#72,#01,#9B,#01,#29,#01,#AB,#01,#FF,#01,#BF,#01,#FB,#01,#2F
    DB #01,#B2,#01,#92,#01,#27,#01,#70,#01,#07,#01,#20,#3E,#00,#01,#EE
    DB #01,#E0,#01,#08,#01,#0E,#01,#00,#02,#EE,#02,#00,#01,#EE,#01,#0E
    DB #01,#E0,#01,#22,#02,#00,#01,#22,#01,#0E,#02,#E0,#02,#00,#01,#EE
    DB #01,#88,#01,#08,#01,#88,#01,#80,#01,#0E,#01,#EE,#07,#00,#01,#06
    DB #01,#A6,#01,#77,#01,#69,#01,#92,#01,#A9,#01,#2A,#01,#BB,#01,#92
    DB #03,#22,#01,#67,#03,#00,#01,#77,#01,#72,#01,#AA,#01,#72,#01,#9B
    DB #01,#FB,#01,#BF,#01,#F9,#01,#99,#01,#B2,#01,#22,#01,#27,#01,#77
    DB #40,#00,#01,#E0,#02,#EE,#01,#0E,#01,#EE,#01,#E0,#02,#EE,#01,#44
    DB #01,#0E,#01,#40,#01,#EE,#01,#02,#02,#22,#01,#20,#01,#EE,#01,#0E
    DB #01,#E0,#01,#44,#02,#EE,#01,#0E,#01,#EE,#01,#80,#02,#EE,#01,#0E
    DB #07,#00,#01,#0A,#01,#A6,#01,#70,#01,#72,#02,#22,#01,#29,#01,#AA
    DB #01,#22,#01,#AA,#01,#27,#01,#76,#01,#26,#03,#00,#01,#77,#01,#72
    DB #01,#27,#01,#72,#01,#29,#01,#9A,#01,#AB,#01,#B9,#01,#99,#01,#92
    DB #01,#72,#01,#22,#01,#77,#40,#00,#01,#0E,#01,#EE,#01,#E0,#01,#00
    DB #01,#EE,#01,#0E,#01,#E0,#01,#EE,#02,#44,#02,#EE,#01,#E0,#02,#22
    DB #01,#0E,#01,#EE,#01,#A4,#01,#04,#01,#44,#01,#E4,#01,#0E,#02,#EE
    DB #01,#00,#01,#0E,#01,#EE,#08,#00,#01,#06,#01,#20,#01,#00,#01,#77
    DB #01,#07,#01,#22,#01,#72,#02,#22,#01,#6A,#01,#27,#01,#70,#01,#66
    DB #01,#70,#02,#00,#01,#72,#01,#27,#03,#77,#01,#29,#01,#9B,#01,#A2
    DB #01,#A9,#01,#22,#01,#77,#01,#22,#01,#77,#01,#70,#3F,#00,#01,#0E
    DB #05,#EE,#01,#EB,#01,#BE,#01,#E4,#01,#40,#01,#4E,#01,#AE,#01,#EA
    DB #02,#FF,#01,#AE,#01,#0E,#01,#E4,#01,#04,#01,#4E,#01,#8B,#01,#BE
    DB #05,#EE,#09,#00,#01,#70,#02,#00,#01,#02,#01,#27,#01,#77,#01,#22
    DB #01,#77,#01,#0A,#01,#60,#01,#00,#01,#07,#03,#00,#01,#02,#01,#27
    DB #02,#00,#01,#77,#01,#22,#01,#29,#03,#22,#01,#77,#01,#22,#01,#A9
    DB #01,#70,#40,#00,#01,#0E,#04,#EE,#01,#0B,#01,#BE,#01,#E0,#02,#44
    DB #01,#EE,#01,#EA,#02,#BB,#02,#EE,#02,#44,#01,#0E,#01,#8B,#01,#B0
    DB #04,#EE,#01,#E0,#0E,#00,#01,#07,#01,#77,#0C,#00,#01,#07,#01,#72
    DB #03,#22,#01,#77,#02,#00,#01,#7A,#01,#92,#42,#00,#01,#40,#01,#4E
    DB #01,#00,#01,#0E,#01,#88,#01,#40,#02,#44,#03,#EE,#01,#E4,#01,#44
    DB #01,#EE,#01,#44,#01,#40,#01,#04,#01,#88,#01,#E0,#01,#00,#01,#E4
    DB #01,#04,#01,#40,#10,#00,#01,#77,#0D,#00,#01,#07,#01,#72,#01,#20
    DB #04,#00,#01,#72,#01,#22,#41,#00,#01,#0E,#02,#EE,#01,#E0,#01,#EE
    DB #01,#88,#01,#EE,#01,#04,#08,#44,#01,#00,#01,#EE,#01,#88,#04,#EE
    DB #01,#E0,#1F,#00,#01,#77,#05,#00,#01,#02,#01,#20,#41,#00,#01,#0E
    DB #01,#EE,#01,#E0,#02,#EE,#01,#E0,#01,#EE,#01,#04,#08,#44,#01,#00
    DB #01,#EE,#01,#04,#02,#EE,#01,#0E,#01,#EE,#01,#80,#68,#00,#01,#E8
    DB #01,#EE,#01,#E0,#02,#EE,#01,#00,#01,#EE,#01,#04,#01,#44,#01,#40
    DB #03,#44,#01,#40,#01,#04,#01,#44,#01,#00,#01,#EE,#01,#00,#02,#EE
    DB #01,#0E,#01,#EE,#01,#8E,#67,#00,#01,#0E,#01,#E8,#01,#EE,#01,#E0
    DB #01,#EE,#01,#0E,#01,#E0,#01,#40,#01,#00,#01,#44,#01,#40,#03,#44
    DB #01,#40,#01,#04,#01,#44,#01,#00,#02,#0E,#01,#E0,#01,#EE,#01,#0E
    DB #01,#EE,#01,#8E,#01,#E0,#66,#00,#01,#0E,#01,#E0,#01,#EE,#01,#00
    DB #01,#EE,#01,#00,#01,#EE,#02,#00,#01,#04,#01,#40,#04,#00,#01,#04
    DB #01,#40,#02,#00,#01,#EE,#01,#00,#01,#EE,#01,#00,#01,#EE,#01,#0E
    DB #01,#E0,#67,#00,#01,#EE,#02,#0E,#01,#E0,#03,#00,#01,#E0,#01,#EE
    DB #01,#00,#01,#E0,#02,#00,#01,#EE,#01,#00,#01,#EE,#01,#0E,#03,#00
    DB #01,#0E,#02,#E0,#01,#EE,#68,#00,#01,#EE,#01,#E0,#01,#00,#01,#0E
    DB #01,#E4,#01,#40,#01,#44,#02,#E0,#01,#0E,#01,#EE,#02,#00,#01,#EE
    DB #01,#00,#02,#0E,#01,#40,#01,#04,#01,#4E,#01,#E0,#01,#00,#01,#EE
    DB #01,#E0,#6B,#00,#04,#44,#03,#00,#01,#0E,#02,#EE,#02,#00,#01,#0E
    DB #01,#40,#02,#44,#01,#4E,#01,#EE,#6E,#00,#01,#44,#01,#4E,#01,#EE
    DB #01,#44,#01,#0E,#01,#EE,#02,#E0,#02,#EE,#02,#0E,#01,#EE,#01,#E0
    DB #01,#4E,#01,#EE,#01,#E4,#01,#EE,#6E,#00,#01,#44,#01,#4E,#01,#A8
    DB #01,#40,#01,#0E,#02,#EE,#01,#E0,#01,#EF,#01,#BE,#01,#0E,#02,#EE
    DB #01,#E0,#01,#0E,#01,#BE,#01,#E4,#01,#44,#6E,#00,#01,#E0,#02,#44
    DB #01,#40,#01,#E0,#01,#00,#01,#EE,#01,#E0,#01,#EF,#01,#BE,#01,#0E
    DB #01,#EE,#01,#00,#01,#0E,#01,#04,#02,#44,#01,#0E,#6E,#00,#01,#EE
    DB #02,#44,#01,#00,#01,#EE,#01,#0E,#02,#E0,#02,#00,#02,#0E,#01,#E0
    DB #01,#EE,#01,#00,#02,#44,#01,#EE,#6E,#00,#01,#EE,#03,#00,#01,#E0
    DB #01,#0E,#01,#E0,#01,#00,#01,#4F,#01,#B4,#01,#00,#01,#0E,#01,#E0
    DB #01,#0E,#03,#00,#01,#EE,#6E,#00,#01,#44,#03,#EE,#04,#00,#01,#4B
    DB #01,#A4,#04,#00,#03,#EE,#01,#44,#6E,#00,#01,#4E,#03,#EE,#01,#E0
    DB #03,#00,#01,#40,#01,#04,#03,#00,#01,#0E,#03,#EE,#01,#40,#6E,#00
    DB #01,#0E,#03,#EE,#01,#E0,#08,#00,#01,#0E,#03,#EE,#01,#E0,#6F,#00
    DB #02,#EE,#01,#E0,#0A,#00,#01,#0E,#02,#EE,#64,#00
bitmap_room_tileset_rle_chunk_0_end:

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

; Linked HUD dynamic widget #3 (counter) tile/glyph data, packed 4bpp RLE; VRAM #12000, raw 1024 bytes, RLE 452 bytes
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

BITMAP_ROOM_DATA_BANK_4_USED_END:
    ds 1318, #FF
    org BITMAP_ROOM_DATA_BANK_4_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_5_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_5_ROM_START:
; Room 0 page 0 render program: 104 V9938 command blocks (clear + 16x16 tile copies)
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
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02
    DB #40,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#D0
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#E0,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#30,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#50,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#60,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#70,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#80,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #50,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#20,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#30,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#50,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#90,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#A0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#90,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#A0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#B0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#E0
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#F0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#30,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#40,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#50,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#E0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#F0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#D0,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_0_p0_end:

; Room 0 page 1 render program: 104 V9938 command blocks (clear + 16x16 tile copies)
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
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02
    DB #40,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#D0
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#E0,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#30,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#50,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#60,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#70,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#80,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #50,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#20,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#30,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#50,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#90,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#A0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#90,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#A0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#B0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#E0
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#F0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#30,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#40,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#50,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#E0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#F0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#D0,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0
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
    DB #10,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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

; Room 1 page 0 render program: 66 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#20,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#30,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#00,#02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#E0,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#00,#02,#60,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#70,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#D0
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#C0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#D0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#E0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#80,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#90,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_1_p0_end:

; Room 1 page 1 render program: 66 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#20,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#30,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#00,#02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#10
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#E0,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#10,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#00,#02,#60,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#00,#02,#70,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#D0
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#C0,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#D0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#70,#00,#00,#02,#E0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#80,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#90,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00
    DB #02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#80,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_1_p1_end:

; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#40,#40,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#10,#10,#10,#00,#00,#00,#00,#00,#40,#10
    DB #10,#10,#00,#00,#00,#00,#40,#40,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
bitmap_room_behavior_1_end:

; Room 2 page 0 render program: 54 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#B0
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#C0,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#00,#02,#B0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#00,#02,#C0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#70,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#00,#02,#80,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#10
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#20,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#30,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#20,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#30,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#40,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#50,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#30
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#20,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#30,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_2_p0_end:

; Room 2 page 1 render program: 54 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#B0
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#C0,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#70,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#80,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#00,#02,#B0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#00,#02,#C0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#70,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#00,#02,#80,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#10
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#20,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#30,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#20,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#30,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#40,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#50,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#30
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#20,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#30,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_2_p1_end:

; Room 2 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_2:
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#11,#11,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#11,#11,#00,#00,#40,#40,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#40,#40,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
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

BITMAP_ROOM_DATA_BANK_5_USED_END:
    ds 320, #FF
    org BITMAP_ROOM_DATA_BANK_5_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_6_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_6_ROM_START:
; Room 3 page 0 render program: 43 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#90,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#A0,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#E0,#00,#00,#02,#40,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#E0,#00,#00,#02,#50,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#40,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#50,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02
    DB #C0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#D0
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#E0,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#E0,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0
bitmap_room_render_3_p0_end:

; Room 3 page 1 render program: 43 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#90,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#A0,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#E0,#00,#00,#02,#40,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#E0,#00,#00,#02,#50,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#90,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #00,#02,#40,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00
    DB #02,#50,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02
    DB #C0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#D0
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#E0,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#10,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#E0,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0
bitmap_room_render_3_p1_end:

; Room 3 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_3:
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#11,#11,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#11,#11,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#00,#00,#00,#40,#40,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#00,#00,#10
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

; Room 4 page 0 render program: 91 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#90,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#A0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #B0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#60,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#70,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #80,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#60,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#00,#02,#70,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#80,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#90,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#A0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #B0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#10,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#C0,#00,#00,#02,#90,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#A0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #C0,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00
    DB #02,#90,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02
    DB #A0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#B0
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#C0,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#D0,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#E0,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#70,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#80,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#90,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#A0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#B0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0
bitmap_room_render_4_p0_end:

; Room 4 page 1 render program: 91 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#90,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#A0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #B0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#60,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#70,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #80,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#00,#02,#60,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#00,#02,#70,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#80,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#90,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#A0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #B0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#10,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#C0,#00,#00,#02,#90,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#A0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#C0,#00,#00,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #C0,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00
    DB #02,#90,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02
    DB #A0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#B0
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#C0,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#D0,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#E0,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#70,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#80,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#90,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#A0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#B0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#B0,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#C0,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#50,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#60,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0
bitmap_room_render_4_p1_end:

; Room 4 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_4:
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#40,#40,#40,#10,#10,#10,#10,#10,#10,#10
    DB #10,#40,#00,#00,#00,#00,#00,#00,#00,#90,#90,#90,#90,#90,#90,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#90,#90,#90,#90,#90,#90,#10
    DB #10,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#10
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

; Room 5 page 0 render program: 54 V9938 command blocks (clear + 16x16 tile copies)
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
    DB #D0,#40,#00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#A0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
bitmap_room_render_5_p0_end:

; Room 5 page 1 render program: 54 V9938 command blocks (clear + 16x16 tile copies)
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
    DB #D0,#40,#00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#00,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#90,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#A0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
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

; Room 6 page 0 render program: 34 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
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

; Room 6 page 1 render program: 34 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
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

BITMAP_ROOM_DATA_BANK_6_USED_END:
    ds 188, #FF
    org BITMAP_ROOM_DATA_BANK_6_PHYS_START + #2000

BITMAP_ROOM_DATA_BANK_7_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_7_ROM_START:
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

BITMAP_ROOM_DATA_BANK_7_USED_END:
    ds 6976, #FF
    org BITMAP_ROOM_DATA_BANK_7_PHYS_START + #2000
; ==================================================================
; MUSIC DATA BANK 8 (chunk 0: shared tables + serialized songs, 8192/8192 bytes).
; Mapped into the music runtime window only while music_play_track / music_update run;
; the wrappers restore resident P2=2 and P3=3 before returning. Source PT3
; uses consecutive chunks as #8000/#A000 halves; native SCC/PSG uses P3.
; SCC-window bank numbers are never allocated. The ds guard fails loudly
; if this chunk ever outgrows its 8KB bank.
; ==================================================================
BITMAP_MUSIC_DATA_BANK_0_PHYS_START:
    org #A000
pt3_track_0_bank_0:
    DB #56,#6F,#72,#74,#65,#78,#20,#54,#72,#61,#63,#6B,#65,#72,#20,#49
    DB #49,#20,#31,#2E,#30,#20,#6D,#6F,#64,#75,#6C,#65,#3A,#20,#55,#72
    DB #61,#6E,#6F,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20
    DB #20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#62
    DB #79,#20,#42,#65,#79,#6B,#65,#72,#20,#32,#30,#30,#39,#20,#20,#20
    DB #20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20
    DB #20,#20,#20,#01,#06,#29,#00,#F3,#00,#00,#00,#B3,#09,#39,#0A,#43
    DB #0A,#C5,#0A,#00,#00,#E7,#0A,#00,#00,#69,#0B,#EB,#0B,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#6D,#0C,#70,#0C,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#30,#33,#30,#33,#18,#2A,#18
    DB #2D,#09,#0C,#09,#27,#00,#03,#06,#1E,#21,#24,#0F,#12,#15,#1B,#09
    DB #0C,#09,#27,#00,#03,#06,#1E,#21,#24,#0F,#12,#15,#1B,#36,#39,#3C
    DB #3F,#42,#FF,#02,#03,#76,#04,#5B,#03,#B5,#03,#95,#04,#11,#04,#02
    DB #03,#BA,#04,#D2,#04,#02,#03,#47,#03,#5B,#03,#B5,#03,#FA,#03,#11
    DB #04,#03,#06,#48,#06,#65,#06,#B5,#03,#AE,#06,#B7,#06,#00,#07,#45
    DB #07,#5C,#07,#2B,#02,#39,#02,#50,#02,#A5,#07,#EA,#07,#FA,#07,#B5
    DB #03,#2B,#05,#11,#04,#02,#03,#4A,#05,#5B,#03,#5E,#05,#A3,#05,#B7
    DB #05,#B5,#03,#6A,#04,#11,#04,#D5,#01,#86,#02,#F6,#01,#9B,#02,#BA
    DB #02,#CC,#02,#7D,#01,#8A,#01,#9F,#01,#D5,#01,#E2,#01,#F6,#01,#43
    DB #08,#4B,#08,#63,#08,#97,#08,#9F,#08,#AA,#08,#DE,#08,#E6,#08,#F1
    DB #08,#02,#03,#25,#09,#5B,#03,#35,#09,#60,#09,#72,#09,#18,#00,#38
    DB #08,#40,#B1,#10,#7C,#B9,#00,#4B,#77,#00,#D3,#CD,#B1,#02,#75,#7C
    DB #81,#7C,#75,#7C,#81,#7C,#70,#77,#7C,#77,#70,#77,#7C,#77,#00,#F0
    DB #02,#B1,#02,#74,#D8,#B1,#01,#70,#70,#D2,#B1,#04,#74,#D1,#B1,#02
    DB #74,#D8,#B1,#01,#70,#70,#D2,#B1,#04,#74,#D1,#B1,#02,#74,#D8,#B1
    DB #01,#6B,#6B,#D2,#B1,#04,#74,#D1,#B1,#02,#74,#D8,#B1,#01,#6B,#6B
    DB #D2,#B1,#04,#74,#00,#18,#00,#43,#08,#40,#B1,#10,#79,#B9,#00,#54
    DB #75,#00,#D3,#B1,#02,#72,#79,#7E,#79,#72,#79,#7E,#79,#6E,#75,#7A
    DB #75,#6E,#75,#7A,#75,#00,#D1,#B1,#02,#74,#D8,#B1,#01,#6D,#6D,#D2
    DB #B1,#04,#74,#D1,#B1,#02,#74,#D8,#B1,#01,#6D,#6D,#D2,#B1,#04,#74
    DB #D1,#B1,#02,#74,#D8,#B1,#01,#69,#69,#D2,#B1,#04,#74,#D1,#B1,#02
    DB #74,#D8,#B1,#01,#69,#69,#D2,#B1,#04,#74,#00,#18,#00,#38,#08,#40
    DB #CF,#B1,#10,#7C,#B9,#00,#4B,#77,#00,#D6,#CF,#B1,#0C,#81,#B1,#02
    DB #85,#86,#B1,#04,#85,#83,#B1,#02,#81,#B1,#04,#83,#B1,#02,#7E,#00
    DB #D1,#CF,#B1,#02,#74,#D8,#B1,#01,#70,#70,#D2,#B1,#04,#74,#D1,#B1
    DB #02,#74,#D8,#B1,#01,#70,#70,#D2,#B1,#04,#74,#D1,#B1,#02,#74,#D8
    DB #B1,#01,#6B,#6B,#D2,#B1,#04,#74,#D1,#B1,#02,#74,#D8,#B1,#01,#6B
    DB #6B,#D2,#B1,#04,#74,#00,#B1,#0C,#D0,#B1,#02,#80,#81,#B1,#04,#85
    DB #83,#B1,#02,#81,#B1,#04,#83,#B1,#02,#81,#00,#18,#00,#43,#08,#40
    DB #B1,#10,#79,#B9,#00,#54,#B1,#04,#75,#B9,#00,#5A,#74,#B9,#00,#64
    DB #B1,#02,#72,#B9,#00,#5A,#B1,#06,#74,#00,#B1,#0C,#D0,#B1,#02,#80
    DB #81,#B1,#04,#85,#83,#B1,#02,#81,#B1,#06,#83,#00,#D1,#B1,#02,#74
    DB #D8,#B1,#01,#6D,#6D,#D2,#B1,#04,#74,#D1,#B1,#02,#74,#D8,#B1,#01
    DB #6D,#6D,#D2,#B1,#04,#74,#D1,#B1,#02,#74,#D2,#74,#B1,#03,#74,#B1
    DB #01,#74,#D1,#B1,#02,#74,#D2,#74,#B1,#01,#74,#B1,#02,#74,#B1,#01
    DB #74,#00,#18,#00,#70,#08,#40,#B1,#02,#70,#B9,#00,#38,#7C,#B9,#00
    DB #70,#70,#B9,#00,#38,#7C,#B9,#00,#70,#70,#B9,#00,#38,#7C,#B9,#00
    DB #70,#70,#B9,#00,#38,#7C,#B9,#00,#96,#6B,#B9,#00,#4B,#77,#B9,#00
    DB #96,#6B,#B9,#00,#4B,#77,#B9,#00,#96,#6B,#B9,#00,#4B,#77,#B9,#00
    DB #96,#6B,#B9,#00,#4B,#77,#00,#D6,#CF,#B1,#0A,#81,#B1,#02,#7C,#81
    DB #83,#B1,#04,#80,#7E,#7C,#B1,#02,#86,#85,#00,#F0,#02,#CF,#B1,#02
    DB #74,#D9,#41,#B1,#01,#70,#70,#D2,#40,#B1,#02,#74,#D9,#41,#B1,#01
    DB #70,#70,#D1,#40,#B1,#02,#74,#D9,#41,#B1,#01,#70,#70,#D2,#40,#B1
    DB #02,#74,#D9,#41,#B1,#01,#70,#70,#D1,#40,#B1,#02,#74,#D9,#41,#B1
    DB #01,#6B,#6B,#D2,#40,#B1,#02,#74,#D9,#41,#B1,#01,#6B,#6B,#D1,#40
    DB #B1,#02,#74,#D9,#41,#B1,#01,#6B,#6B,#D2,#40,#B1,#02,#74,#D9,#41
    DB #B1,#01,#6B,#6B,#00,#18,#00,#86,#08,#40,#B1,#02,#6D,#B9,#00,#43
    DB #79,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D,#B9,#00,#43
    DB #79,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#A9,#69,#B9,#00,#54
    DB #75,#B9,#00,#A9,#69,#B9,#00,#54,#75,#B9,#00,#A9,#69,#B9,#00,#54
    DB #75,#B9,#00,#A9,#69,#B9,#00,#54,#75,#00,#B1,#0A,#81,#B1,#02,#7E
    DB #80,#81,#85,#B1,#04,#86,#B1,#02,#85,#81,#B1,#04,#83,#B1,#02,#85
    DB #00,#F0,#02,#B1,#02,#74,#D9,#41,#B1,#01,#6D,#6D,#D2,#40,#B1,#02
    DB #74,#D9,#41,#B1,#01,#6D,#6D,#D1,#40,#B1,#02,#74,#D9,#41,#B1,#01
    DB #6D,#6D,#D2,#40,#B1,#02,#74,#D9,#41,#B1,#01,#6D,#6D,#D1,#40,#B1
    DB #02,#74,#D9,#41,#B1,#01,#69,#69,#D2,#40,#B1,#02,#74,#D9,#41,#B1
    DB #01,#69,#69,#D1,#40,#B1,#02,#74,#D9,#41,#B1,#01,#69,#69,#D2,#40
    DB #B1,#02,#74,#D9,#41,#B1,#01,#69,#69,#00,#B1,#0A,#7E,#B1,#02,#85
    DB #83,#81,#B1,#10,#7A,#00,#D3,#B1,#02,#75,#B1,#04,#79,#B1,#02,#7A
    DB #79,#B1,#01,#75,#B1,#03,#70,#B1,#02,#75,#B1,#06,#70,#B1,#02,#75
    DB #B1,#04,#79,#77,#00,#B1,#02,#72,#B1,#04,#72,#B1,#02,#72,#74,#B1
    DB #01,#72,#B1,#03,#75,#B1,#02,#79,#75,#B1,#04,#75,#B1,#02,#79,#7A
    DB #B1,#01,#79,#B1,#03,#7A,#B1,#02,#7C,#00,#D3,#B1,#0A,#75,#B1,#01
    DB #75,#77,#79,#77,#B1,#02,#75,#B1,#06,#70,#B1,#02,#7C,#B1,#04,#79
    DB #77,#00,#F0,#02,#B1,#02,#74,#D9,#41,#B1,#01,#70,#70,#D2,#40,#B1
    DB #02,#74,#D9,#41,#B1,#01,#70,#70,#D1,#40,#B1,#02,#74,#D9,#41,#B1
    DB #01,#70,#70,#D2,#40,#B1,#02,#74,#D9,#41,#B1,#01,#70,#70,#D1,#40
    DB #B1,#02,#74,#D9,#41,#B1,#01,#6B,#6B,#D2,#40,#B1,#02,#74,#D9,#41
    DB #B1,#01,#6B,#6B,#D1,#40,#B1,#02,#74,#D9,#41,#B1,#01,#6B,#6B,#D2
    DB #40,#B1,#02,#74,#D9,#41,#B1,#01,#6B,#6B,#00,#B1,#02,#72,#B1,#04
    DB #72,#B1,#02,#72,#74,#B1,#01,#72,#B1,#03,#75,#B1,#02,#79,#7E,#B1
    DB #04,#7E,#B1,#02,#81,#B1,#04,#80,#7E,#00,#B1,#0A,#7C,#B1,#01,#79
    DB #7A,#7C,#7A,#B1,#02,#79,#B1,#08,#77,#B1,#04,#75,#74,#00,#18,#00
    DB #86,#08,#40,#B1,#02,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D,#B9,#00
    DB #43,#79,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D,#B9,#00
    DB #43,#79,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D,#B9,#00
    DB #43,#79,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D,#B9,#00
    DB #43,#79,#00,#B1,#04,#72,#CD,#D0,#CB,#B1,#01,#7E,#72,#7E,#72,#7E
    DB #72,#7E,#72,#B1,#10,#7E,#00,#F0,#02,#B1,#02,#74,#D9,#41,#B1,#01
    DB #6D,#6D,#D2,#40,#B1,#02,#74,#D9,#41,#B1,#01,#6D,#6D,#D1,#40,#B1
    DB #02,#74,#D9,#41,#B1,#01,#6D,#6D,#D2,#40,#B1,#02,#74,#D9,#41,#B1
    DB #01,#6D,#6D,#D1,#40,#B1,#02,#74,#74,#D2,#B1,#01,#74,#D1,#B1,#02
    DB #74,#B1,#01,#74,#B1,#02,#74,#D2,#B1,#01,#74,#74,#D1,#B1,#02,#74
    DB #D2,#74,#00,#18,#00,#64,#08,#40,#B1,#02,#72,#B9,#00,#32,#7E,#B9
    DB #00,#64,#72,#B9,#00,#32,#7E,#B9,#00,#64,#72,#B9,#00,#32,#7E,#B9
    DB #00,#64,#72,#B9,#00,#32,#7E,#B9,#00,#7E,#6E,#B9,#00,#3F,#7A,#B9
    DB #00,#7E,#6E,#B9,#00,#3F,#7A,#B9,#00,#7E,#6E,#B9,#00,#3F,#7A,#B9
    DB #00,#7E,#6E,#B9,#00,#3F,#7A,#00,#D6,#CF,#B1,#04,#7E,#B1,#02,#77
    DB #B1,#04,#7E,#B1,#02,#77,#7E,#81,#B1,#04,#77,#B1,#02,#79,#B1,#06
    DB #7A,#B1,#04,#7A,#00,#D1,#B1,#02,#74,#D9,#B1,#01,#72,#72,#D2,#B1
    DB #02,#74,#D9,#B1,#01,#72,#72,#D1,#B1,#02,#74,#D9,#B1,#01,#72,#72
    DB #D2,#B1,#02,#74,#D9,#B1,#01,#72,#72,#D1,#B1,#02,#74,#D9,#B1,#01
    DB #6E,#6E,#D2,#B1,#02,#74,#D9,#B1,#01,#6E,#6E,#D1,#B1,#02,#74,#D9
    DB #B1,#01,#6E,#6E,#D2,#B1,#02,#74,#D9,#B1,#01,#6E,#6E,#00,#B1,#06
    DB #7A,#79,#B1,#0A,#7C,#7E,#00,#D1,#B1,#02,#74,#D9,#B1,#01,#6D,#6D
    DB #D2,#B1,#02,#74,#D9,#B1,#01,#6D,#6D,#D1,#B1,#02,#74,#D9,#B1,#01
    DB #6D,#6D,#D2,#B1,#02,#74,#D9,#B1,#01,#6D,#6D,#D1,#B1,#02,#74,#D9
    DB #B1,#01,#69,#69,#D2,#B1,#02,#74,#D9,#B1,#01,#69,#69,#D1,#B1,#02
    DB #74,#D9,#B1,#01,#69,#69,#D2,#B1,#02,#74,#D9,#B1,#01,#69,#69,#00
    DB #18,#00,#64,#08,#40,#B1,#02,#72,#B9,#00,#32,#7E,#B9,#00,#64,#72
    DB #B9,#00,#32,#7E,#B9,#00,#64,#72,#B9,#00,#32,#7E,#B9,#00,#64,#72
    DB #B9,#00,#32,#7E,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D
    DB #B9,#00,#43,#79,#B9,#00,#86,#6D,#B9,#00,#43,#79,#B9,#00,#86,#6D
    DB #B9,#00,#43,#79,#00,#B1,#0A,#86,#B1,#02,#83,#86,#8A,#B1,#04,#85
    DB #B1,#02,#83,#B1,#04,#81,#B1,#02,#7E,#81,#85,#00,#D1,#B1,#02,#74
    DB #D9,#B1,#01,#72,#72,#D2,#B1,#02,#74,#D9,#B1,#01,#72,#72,#D1,#B1
    DB #02,#74,#D9,#B1,#01,#72,#72,#D2,#B1,#02,#74,#D9,#B1,#01,#72,#72
    DB #D1,#B1,#02,#74,#D9,#B1,#01,#6D,#6D,#D2,#B1,#02,#74,#D9,#B1,#01
    DB #6D,#6D,#D1,#B1,#02,#74,#D9,#B1,#01,#6D,#6D,#D2,#B1,#02,#74,#D9
    DB #B1,#01,#6D,#6D,#00,#18,#00,#96,#08,#40,#B1,#02,#6B,#B9,#00,#4B
    DB #77,#B9,#00,#96,#6B,#B9,#00,#4B,#77,#B9,#00,#96,#6B,#B9,#00,#4B
    DB #77,#B9,#00,#96,#6B,#B9,#00,#4B,#77,#B9,#00,#96,#6B,#B9,#00,#4B
    DB #77,#B9,#00,#96,#6B,#B9,#00,#4B,#77,#B9,#00,#96,#6B,#B9,#00,#4B
    DB #77,#B9,#00,#96,#6B,#B9,#00,#4B,#77,#00,#B1,#04,#83,#B1,#02,#81
    DB #B1,#06,#80,#B1,#02,#7E,#B1,#12,#80,#00,#D1,#B1,#02,#74,#D9,#B1
    DB #01,#6B,#6B,#D2,#B1,#02,#74,#D9,#B1,#01,#6B,#6B,#D1,#B1,#02,#74
    DB #D9,#B1,#01,#6B,#6B,#D2,#B1,#02,#74,#D9,#B1,#01,#6B,#6B,#D1,#B1
    DB #02,#74,#D9,#B1,#01,#6B,#6B,#D2,#B1,#02,#74,#D9,#B1,#01,#6B,#6B
    DB #D1,#B1,#02,#74,#D9,#B1,#01,#6B,#6B,#D2,#B1,#02,#74,#D9,#B1,#01
    DB #6B,#6B,#00,#40,#B9,#00,#70,#B1,#20,#70,#00,#B1,#02,#75,#77,#B1
    DB #01,#79,#77,#B1,#02,#75,#B1,#06,#79,#B1,#02,#7C,#B1,#0C,#81,#B1
    DB #04,#81,#00,#F0,#02,#CF,#B1,#02,#74,#D3,#41,#70,#D2,#40,#74,#D3
    DB #41,#70,#D1,#40,#74,#D3,#41,#70,#D2,#40,#74,#D3,#41,#70,#D1,#40
    DB #74,#D3,#41,#70,#D2,#40,#74,#D3,#41,#70,#D1,#40,#74,#D3,#41,#70
    DB #D2,#40,#74,#D3,#41,#70,#00,#40,#B9,#00,#A9,#B1,#20,#69,#00,#B1
    DB #06,#80,#B1,#12,#7E,#B1,#04,#80,#81,#00,#F0,#02,#CF,#B1,#02,#74
    DB #D3,#41,#69,#D2,#40,#74,#D3,#41,#69,#D1,#40,#74,#D3,#41,#69,#D2
    DB #40,#74,#D3,#41,#69,#D1,#40,#74,#D3,#41,#69,#D2,#40,#74,#D3,#41
    DB #69,#D1,#40,#74,#D3,#41,#69,#D2,#40,#74,#D3,#41,#69,#00,#40,#B9
    DB #00,#8E,#B1,#20,#6C,#00,#B1,#06,#81,#B1,#12,#7D,#B1,#04,#83,#81
    DB #00,#F0,#02,#CF,#B1,#02,#74,#D3,#41,#6C,#D2,#40,#74,#D3,#41,#6C
    DB #D1,#40,#74,#D3,#41,#6C,#D2,#40,#74,#D3,#41,#6C,#D1,#40,#74,#D3
    DB #41,#6C,#D2,#40,#74,#D3,#41,#6C,#D1,#40,#74,#D3,#41,#6C,#D2,#40
    DB #74,#D3,#41,#6C,#00,#B1,#0A,#85,#B1,#02,#7C,#85,#79,#B1,#01,#83
    DB #81,#B1,#0E,#83,#00,#18,#00,#70,#08,#40,#B1,#02,#70,#B9,#00,#38
    DB #7C,#B9,#00,#70,#70,#B9,#00,#38,#7C,#B9,#00,#70,#70,#B9,#00,#38
    DB #7C,#B9,#00,#70,#70,#B9,#00,#38,#7C,#B9,#00,#70,#B1,#10,#70,#00
    DB #B1,#08,#81,#CE,#B1,#04,#D0,#CD,#D0,#CC,#D0,#CB,#D0,#CA,#D0,#C9
    DB #D0,#00,#F0,#02,#B1,#02,#74,#D9,#41,#B1,#01,#70,#70,#D2,#40,#B1
    DB #02,#74,#D9,#41,#B1,#01,#70,#70,#D1,#40,#B1,#02,#74,#D9,#41,#B1
    DB #01,#70,#70,#D2,#40,#B1,#02,#74,#D9,#41,#B1,#01,#70,#70,#D1,#40
    DB #B1,#04,#74,#B1,#03,#74,#B1,#01,#74,#B1,#02,#74,#74,#74,#B1,#01
    DB #74,#74,#00,#20,#21,#0D,#8E,#C8,#00,#01,#8E,#90,#01,#01,#8D,#58
    DB #02,#01,#8C,#20,#03,#01,#8C,#E8,#03,#01,#8B,#B0,#04,#01,#8A,#78
    DB #05,#01,#88,#40,#06,#01,#86,#08,#07,#01,#83,#D0,#07,#00,#90,#00
    DB #00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00
    DB #00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00
    DB #00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00
    DB #00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00
    DB #00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00,#00,#00,#90,#00
    DB #00,#00,#90,#00,#00,#01,#90,#00,#00,#00,#02,#15,#4C,#A0,#00,#81
    DB #4C,#A0,#00,#18,#20,#00,#8D,#00,#00,#00,#8D,#00,#00,#00,#8D,#00
    DB #00,#00,#8D,#00,#00,#00,#8D,#00,#00,#00,#8D,#00,#00,#00,#8D,#00
    DB #00,#00,#8C,#00,#00,#00,#8C,#00,#00,#00,#8C,#00,#00,#00,#8C,#00
    DB #00,#00,#8B,#00,#00,#00,#8B,#00,#00,#00,#8B,#00,#00,#00,#8B,#00
    DB #00,#00,#8A,#00,#00,#00,#8A,#00,#00,#00,#8A,#00,#00,#00,#8A,#00
    DB #00,#00,#8A,#00,#00,#00,#8A,#00,#00,#00,#8A,#00,#00,#00,#89,#00
    DB #00,#00,#89,#00,#00,#00,#89,#FF,#FF,#00,#89,#FE,#FF,#00,#89,#FF
    DB #FF,#00,#89,#00,#00,#00,#89,#01,#00,#00,#89,#02,#00,#00,#89,#01
    DB #00,#00,#89,#00,#00,#06,#08,#00,#9C,#00,#00,#00,#9C,#00,#00,#00
    DB #9B,#00,#00,#00,#9B,#00,#00,#00,#9A,#00,#00,#00,#9A,#00,#00,#00
    DB #99,#00,#00,#00,#99,#00,#00,#18,#20,#01,#8B,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8B,#FF,#FF,#01,#8B,#FE
    DB #FF,#01,#8B,#FF,#FF,#01,#8B,#00,#00,#01,#8B,#01,#00,#01,#8B,#02
    DB #00,#01,#8B,#01,#00,#01,#8B,#00,#00,#1F,#20,#01,#8F,#00,#00,#01
    DB #8F,#00,#00,#01,#8E,#00,#00,#01,#8D,#00,#00,#01,#8C,#00,#00,#01
    DB #8B,#00,#00,#01,#8A,#00,#00,#01,#8A,#00,#00,#01,#89,#00,#00,#01
    DB #89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01
    DB #89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01
    DB #89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01
    DB #89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01
    DB #89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#01
    DB #89,#00,#00,#01,#89,#00,#00,#01,#89,#00,#00,#1C,#20,#01,#0C,#00
    DB #00,#01,#8C,#00,#00,#01,#8C,#00,#00,#01,#8C,#00,#00,#01,#8B,#00
    DB #00,#01,#8B,#00,#00,#01,#8B,#00,#00,#01,#8A,#00,#00,#01,#8A,#00
    DB #00,#01,#8A,#00,#00,#01,#89,#00,#00,#01,#8A,#00,#00,#01,#8A,#00
    DB #00,#01,#8A,#00,#00,#01,#8A,#00,#00,#01,#8A,#00,#00,#01,#89,#00
    DB #00,#01,#89,#00,#00,#01,#88,#00,#00,#01,#88,#00,#00,#01,#88,#00
    DB #00,#01,#88,#00,#00,#01,#88,#00,#00,#01,#89,#00,#00,#01,#89,#00
    DB #00,#01,#89,#00,#00,#01,#89,#00,#00,#01,#8A,#00,#00,#01,#8A,#00
    DB #00,#01,#8A,#00,#00,#01,#8A,#00,#00,#01,#8A,#00,#00,#00,#01,#00
    DB #18,#20,#0C,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00
    DS #136E, #FF
BITMAP_MUSIC_DATA_BANK_0_USED_END:
    ds #C000 - $, #FF
    org BITMAP_MUSIC_DATA_BANK_0_PHYS_START + #2000

; ==================================================================
; MUSIC DATA BANK 9 (chunk 1: shared tables + serialized songs, 8192/8192 bytes).
; Mapped into the music runtime window only while music_play_track / music_update run;
; the wrappers restore resident P2=2 and P3=3 before returning. Source PT3
; uses consecutive chunks as #8000/#A000 halves; native SCC/PSG uses P3.
; SCC-window bank numbers are never allocated. The ds guard fails loudly
; if this chunk ever outgrows its 8KB bank.
; ==================================================================
BITMAP_MUSIC_DATA_BANK_1_PHYS_START:
    org #A000
pt3_track_0_bank_1:
    DS #2000, #FF
BITMAP_MUSIC_DATA_BANK_1_USED_END:
    ds #C000 - $, #FF
    org BITMAP_MUSIC_DATA_BANK_1_PHYS_START + #2000
    end
