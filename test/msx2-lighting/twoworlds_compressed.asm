; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap room backend (V9938 Graphic 4 command engine)
; Project: mina_twoworlds
; Room: caverna_luz
; Screen mode: SCREEN 5 (VDP Graphic 4, CHGMOD 5)
; Backend: msx2-screen4-bitmap-room (legacy internal id)
; ROM Mode: simple32k
; Mapper Target: konami
; Auto MegaROM: No
; NOTE: Bitmap-room SCREEN 5 uses a linear simple32k ROM layout.
; Visible page: VRAM #0000, 128 bytes/row, 212 lines
; Bitmap room HUD height: 20 px
; Bitmap room HUD widgets: 4
; Bitmap room game area: 256x192 at visual Y=20
; Bitmap room game band VRAM base: #0A00
; World rooms: 2; start room index: 0
; Shared tileset bytes: 2048 at VRAM #10000
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
hud_dec3_buffer EQU #C0EE
; Linked HUD icon row #0 (hud_el_1783004114045_6h49y), bound to "playerEnergy".
hud_linked_0_drawn EQU #C0E9
; Linked HUD counter #1 (hud_el_1783009772122_go9ku), bound to "collectibles" [8-bit, 2 digits].
hud_linked_1_drawn EQU #C0EA
hud_linked_1_value EQU #C0EB
; Linked HUD icon toggle #2 (hud_el_1783454311897_7p2ha), bound to "keyItem".
hud_linked_2_drawn EQU #C0EC
; Linked HUD counter #3 (hud_el_1783527996153_k7cbd), bound to "keyItem" [8-bit, 2 digits].
hud_linked_3_drawn EQU #C0ED
bitmap_key_count EQU #C0F1
; Player-linked State Machine runtime (SCREEN 5 bitmap route).
bitmap_sm_state EQU #C0F2
bitmap_light_x                 EQU #C0F3
bitmap_light_y                 EQU #C0F4
bitmap_light_tx                EQU #C0F5
bitmap_light_ty                EQU #C0F6
bitmap_light_active            EQU #C0F7
bitmap_light_page              EQU #C0F8
bitmap_light_op_clr            EQU #C0F9
bitmap_light_op_cmd            EQU #C0FA
bitmap_light_d                 EQU #C0FB
bitmap_light_xsign             EQU #C0FC
bitmap_light_xadj              EQU #C0FD
bitmap_light_ybias             EQU #C0FE
bitmap_light_rx                EQU #C0FF
bitmap_light_ry                EQU #C100
bitmap_light_rw                EQU #C101
bitmap_light_rh                EQU #C103
bitmap_light_band_y            EQU #C104
bitmap_light_band_h            EQU #C105
bitmap_light_band_hw           EQU #C106

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
    call init_plain32k_page2_slot
    call init_screen5_bitmap_vdp
    call load_screen5_bitmap_palette
    call init_bitmap_hud_band
    call upload_tileset_atlas
    call init_hardware_sprite_tables
    ; Upload bullet sprite pattern (32 bytes) to VRAM #FE00
    ld hl, bitmap_bullet_pattern_data
    ld de, #FE00
    ld bc, bitmap_bullet_pattern_data_end - bitmap_bullet_pattern_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 4 (VRAM #F440)
    ld hl, bitmap_bullet_color_data
    ld de, #F440
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 5 (VRAM #F450)
    ld hl, bitmap_bullet_color_data
    ld de, #F450
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
    ; bullet colour -> sprite slot 6 (VRAM #F460)
    ld hl, bitmap_bullet_color_data
    ld de, #F460
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
    jp bitmap_gf_node_3
bitmap_gf_node_3:
    ; Music node skipped: no SCC tracks in this project (add a track asset with soundChip SCC).
    jp bitmap_gf_node_1
bitmap_gf_node_1:
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

    ; Place the player at the room spawn point.
    ld a, 128
    ld (player_y), a
    ld a, 32
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
    ld a, 0
    ld (player_anim_state), a
    xor a
    ld (bitmap_light_active), a       ; no halo painted yet
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
    ; Clear SHOOT pool (15 bytes at bitmap_bullet_pool)
    ld hl, bitmap_bullet_pool
    ld b, #0F
    xor a
.shoot_clear_loop:
    ld (hl), a
    inc hl
    djnz .shoot_clear_loop
    dec a
    ld (bitmap_bullet_borrow_group), a ; #FF = no borrowed player group yet

    call bitmap_enter_game_loop
    jp bitmap_gf_node_2
bitmap_gf_node_2:
    ld hl, bitmap_gf_node_2_DATA
    call draw_bitmap_end_screen
    call bitmap_end_wait_key
    ; End node terminates the flow.
    jp .bitmap_main_loop
bitmap_gf_node_2_DATA:
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
    call bitmap_update_bullet_sat
    ; ---- logic phase: safe during active display ----
    call step_room_composition
    jp c, .skip_player_movement
    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
    call bitmap_update_player_state_machine
    call bitmap_try_spawn_bullet
    call bitmap_step_bullets
.skip_player_movement:
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_linked_0    ; redraw linked HUD icon row #0 (hud_el_1783004114045_6h49y)
    call update_hud_linked_1    ; redraw linked HUD counter #1 (hud_el_1783009772122_go9ku)
    call update_hud_linked_2    ; redraw linked HUD icon #2 (hud_el_1783454311897_7p2ha)
    call update_hud_linked_3    ; redraw linked HUD counter #3 (hud_el_1783527996153_k7cbd)
    call bitmap_light_update    ; move the lamp halo (dark rooms only)
    jp .bitmap_main_loop

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
bitmap_room_render_ptr_table_p1:
    DW bitmap_room_render_0_p1
    DW bitmap_room_render_1_p1


bitmap_room_blockcount_table:
    DW 193
    DW 193

bitmap_room_collision_ptr_table:
    DW bitmap_room_collision_0
    DW bitmap_room_collision_1


bitmap_room_behavior_ptr_table:
    DW bitmap_room_behavior_0
    DW bitmap_room_behavior_1


; Edge rails per room: west,east,north,south (#FF = none)
bitmap_room_transition_table:
    DB #FF,#01,#FF,#FF,#00,#FF,#FF,#FF

bitmap_room_spawn_x_table:
    DB 32,32
bitmap_room_spawn_y_table:
    DB 128,128

; __MIDEAS_BITMAP_RESIDENT_DISPATCH_END__



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
    ld hl, bitmap_room_hud_seed_p0_rle_chunk_0
    ld a, 0
    ld de, #0000
    ld bc, bitmap_room_hud_seed_p0_rle_chunk_0_end - bitmap_room_hud_seed_p0_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    ld hl, bitmap_room_hud_seed_p1_rle_chunk_0
    ld a, 2
    ld de, #0000
    ld bc, bitmap_room_hud_seed_p1_rle_chunk_0_end - bitmap_room_hud_seed_p1_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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
    ld hl, bitmap_room_tileset_rle_chunk_0
    ld a, 4
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_0_end - bitmap_room_tileset_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room render blocks

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

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room collision source

    ld de, bitmap_room_collision_map
    ld bc, 192
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room behavior source

    ld de, bitmap_room_behavior_map
    ld bc, 192
    ldir
    ; The command-engine status polls above left R#15 pointing at S#2. Restore S#0
    ; selection so the main loop's bitmap_wait_vblank (which assumes R#15=0) syncs
    ; correctly; otherwise post-transition rooms run on the bounded-delay fallback
    ; every frame (severe lag).
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
    jp .select_render_program
.compose_page1:
    ld a, 1
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p1
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

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a

    ld de, bitmap_room_collision_map
    ld bc, 192
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table

    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a

    ld de, bitmap_room_behavior_map
    ld bc, 192
    ldir

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
    add a, 96
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
; PURPOSE: Reads the shoot key ('B', keyboard matrix row 2 mask #80) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 2 on PPI_C.
; ------------------------------------------------------------
bitmap_shoot_pressed:
    in a, (PPI_C)
    and #F0
    or 2
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #80
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
; INPUT: none. OUTPUT: SAT entries at VRAM #F610 onwards.
; DESTROYS: AF, DE, HL, IX. PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_update_bullet_sat:
    ld de, #F610
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
    ld a, #C0

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
    ld hl, bitmap_room_hud_linked_0_rle_chunk_0
    ld a, 1
    ld de, #2A00
    ld bc, bitmap_room_hud_linked_0_rle_chunk_0_end - bitmap_room_hud_linked_0_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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
    ld hl, bitmap_room_hud_linked_1_rle_chunk_0
    ld a, 1
    ld de, #3200
    ld bc, bitmap_room_hud_linked_1_rle_chunk_0_end - bitmap_room_hud_linked_1_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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
    ld hl, bitmap_room_hud_linked_2_rle_chunk_0
    ld a, 3
    ld de, #2A00
    ld bc, bitmap_room_hud_linked_2_rle_chunk_0_end - bitmap_room_hud_linked_2_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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
    ld hl, bitmap_room_hud_linked_3_rle_chunk_0
    ld a, 4
    ld de, #0800
    ld bc, bitmap_room_hud_linked_3_rle_chunk_0_end - bitmap_room_hud_linked_3_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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
    DB 0,0, #10,#02, 0,0, 0,0, 8,0, 8,0, 0,0, #D0

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
    ld a, 0
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_1:
    ld a, 1
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_2:
    ld a, 2
    jp .bitmap_sm_anim_store
.bitmap_sm_anim_3:
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
    ld a, 1
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
    ld a, 0
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
    ld a, 1
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
    ld a, 0
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
; FUNCTION: bitmap_light_room_is_dark
; ------------------------------------------------------------
; PURPOSE:
;   Test whether the current room is lit only by the player's lamp.
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
;   clipped here: the halo centre is clamped so every rectangle already lies
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
;   Used for the initial paint of a room, not for the per-frame delta.
;
; INPUT:
;   bitmap_light_x / _y = halo centre, fill already selected.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_draw_bands:
    ld hl, bitmap_light_bands
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
    call bitmap_light_rect
    pop hl
    pop bc
    djnz .band_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_target
; ------------------------------------------------------------
; PURPOSE:
;   Halo centre the lamp wants this frame: the player's centre, clamped so the
;   blob never crosses the edges of the game band. The clamp is what lets every
;   rectangle skip clipping.
;
; OUTPUT:
;   bitmap_light_tx / bitmap_light_ty.
;
; DESTROYS:
;   AF.
; ------------------------------------------------------------
bitmap_light_target:
    ld a, (player_x)
    add a, 7
    jr nc, .cx_no_wrap
    ld a, 255
.cx_no_wrap:
    cp 40
    jr nc, .cx_min_ok
    ld a, 40
.cx_min_ok:
    cp 217
    jr c, .cx_max_ok
    ld a, 216
.cx_max_ok:
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
;   Dim the whole game band and cut the halo out of it. Runs once per room, on
;   the hidden page before the flip (or on the visible page at boot), never in
;   the steady-state frame budget.
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
    call bitmap_light_rect
    call bitmap_light_target
    ld a, (bitmap_light_tx)
    ld (bitmap_light_x), a
    ld a, (bitmap_light_ty)
    ld (bitmap_light_y), a
    call bitmap_light_op_lit
    call bitmap_light_draw_bands
    ld a, 1
    ld (bitmap_light_active), a
    ret

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
    ld hl, bitmap_light_bands
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
    call bitmap_light_rect
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
    ld hl, bitmap_light_step_down
    ld b, 10
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
    ld hl, bitmap_light_step_up
    ld b, 10
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
    call bitmap_light_rect    ; preserves B and HL, so the loop needs no stack
    djnz .light_step_loop
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
    DB #00,#00,#00,#00,#33,#03,#55,#05,#53,#06,#50,#06,#63,#06,#77,#07
    DB #00,#00,#00,#00,#00,#00,#11,#01,#02,#03,#20,#03,#31,#03,#33,#03

bitmap_room_hud_seed_data:
; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE
; Raw bytes: 5120; encoded bytes: 132
; VRAM #00000, raw 2560 bytes, RLE 66 bytes
bitmap_room_hud_seed_p0_rle_chunk_0:
    DB #FF,#11,#4E,#11,#01,#BB,#7E,#11,#01,#1B,#01,#BB,#01,#B1,#7D,#11
    DB #02,#BB,#01,#FB,#7D,#11,#01,#BB,#01,#BD,#01,#DF,#7D,#11,#02,#BB
    DB #01,#DD,#7D,#11,#03,#BB,#7D,#11,#03,#BB,#7D,#11,#01,#1B,#01,#BB
    DB #01,#B1,#7E,#11,#01,#BB,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#36,#11
    DB #80,#FF
bitmap_room_hud_seed_p0_rle_chunk_0_end:
; VRAM #08000, raw 2560 bytes, RLE 66 bytes
bitmap_room_hud_seed_p1_rle_chunk_0:
    DB #FF,#11,#4E,#11,#01,#BB,#7E,#11,#01,#1B,#01,#BB,#01,#B1,#7D,#11
    DB #02,#BB,#01,#FB,#7D,#11,#01,#BB,#01,#BD,#01,#DF,#7D,#11,#02,#BB
    DB #01,#DD,#7D,#11,#03,#BB,#7D,#11,#03,#BB,#7D,#11,#01,#1B,#01,#BB
    DB #01,#B1,#7E,#11,#01,#BB,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#36,#11
    DB #80,#FF
bitmap_room_hud_seed_p1_rle_chunk_0_end:

bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
; Shared world tileset (atlas), packed 4bpp RLE, destination VRAM #10000
; Raw bytes: 2048; encoded bytes: 1148
; VRAM #10000, raw 2048 bytes, RLE 1148 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #08,#11,#08,#99,#08,#33,#08,#BB,#03,#33,#01,#31,#04,#33,#03,#BB
    DB #01,#B9,#04,#BB,#08,#33,#08,#BB,#08,#33,#08,#BB,#08,#33,#08,#BB
    DB #08,#11,#08,#99,#08,#33,#08,#BB,#08,#11,#08,#99,#08,#22,#08,#AA
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#02,#22,#01,#21
    DB #05,#22,#02,#AA,#01,#A9,#05,#AA,#08,#33,#08,#BB,#08,#22,#08,#AA
    DB #08,#11,#08,#99,#04,#22,#01,#42,#03,#22,#04,#AA,#01,#CA,#03,#AA
    DB #03,#11,#01,#12,#04,#11,#03,#99,#01,#9A,#04,#99,#08,#22,#08,#AA
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#02,#22,#01,#12
    DB #05,#22,#02,#AA,#01,#9A,#05,#AA,#08,#22,#08,#AA,#08,#22,#08,#AA
    DB #08,#11,#08,#99,#03,#22,#01,#24,#04,#22,#03,#AA,#01,#AC,#04,#AA
    DB #08,#11,#08,#99,#08,#22,#08,#AA,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#02,#22,#01,#21,#05,#22,#02,#AA,#01,#A9,#05,#AA
    DB #08,#22,#08,#AA,#08,#22,#08,#AA,#08,#11,#08,#99,#03,#22,#01,#44
    DB #04,#22,#03,#AA,#01,#CC,#04,#AA,#08,#11,#08,#99,#08,#22,#08,#AA
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#03,#22,#01,#12
    DB #04,#22,#03,#AA,#01,#9A,#04,#AA,#08,#22,#08,#AA,#08,#22,#08,#AA
    DB #08,#11,#08,#99,#03,#22,#01,#24,#04,#22,#03,#AA,#01,#AC,#04,#AA
    DB #08,#11,#08,#99,#08,#22,#08,#AA,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#02,#22,#01,#21,#05,#22,#02,#AA,#01,#A9,#05,#AA
    DB #08,#22,#08,#AA,#08,#22,#08,#AA,#08,#11,#08,#99,#04,#22,#01,#42
    DB #03,#22,#04,#AA,#01,#CA,#03,#AA,#01,#11,#01,#21,#06,#11,#01,#99
    DB #01,#A9,#06,#99,#08,#22,#08,#AA,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#03,#22,#01,#12,#04,#22,#03,#AA,#01,#9A,#04,#AA
    DB #08,#22,#08,#AA,#08,#22,#08,#AA,#08,#11,#08,#99,#04,#22,#01,#24
    DB #03,#22,#04,#AA,#01,#AC,#03,#AA,#08,#11,#08,#99,#08,#11,#08,#99
    DB #08,#11,#08,#99,#08,#11,#08,#99,#08,#11,#08,#99,#08,#11,#08,#99
    DB #08,#11,#08,#99,#08,#11,#08,#99,#08,#11,#08,#99,#03,#33,#01,#31
    DB #04,#33,#03,#BB,#01,#B9,#04,#BB,#08,#33,#08,#BB,#03,#33,#01,#31
    DB #04,#33,#03,#BB,#01,#B9,#04,#BB,#03,#33,#01,#31,#04,#33,#03,#BB
    DB #01,#B9,#04,#BB,#03,#33,#01,#31,#04,#33,#03,#BB,#01,#B9,#04,#BB
    DB #03,#11,#01,#14,#04,#11,#03,#99,#01,#9C,#04,#99,#03,#33,#01,#31
    DB #04,#33,#03,#BB,#01,#B9,#04,#BB,#06,#11,#01,#21,#01,#11,#06,#99
    DB #01,#A9,#01,#99,#03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA
    DB #08,#22,#08,#AA,#03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#03,#22,#01,#21
    DB #04,#22,#03,#AA,#01,#A9,#04,#AA,#03,#11,#01,#44,#01,#41,#03,#11
    DB #03,#99,#01,#CC,#01,#C9,#03,#99,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#08,#11,#08,#99,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#08,#22,#08,#AA,#03,#22,#01,#21,#02,#22,#01,#12
    DB #01,#22,#03,#AA,#01,#A9,#02,#AA,#01,#9A,#01,#AA,#03,#22,#01,#21
    DB #04,#22,#03,#AA,#01,#A9,#04,#AA,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#02,#11,#01,#14,#02,#44,#03,#11,#02,#99,#01,#9C
    DB #02,#CC,#03,#99,#03,#22,#01,#21,#01,#24,#03,#22,#03,#AA,#01,#A9
    DB #01,#AC,#03,#AA,#08,#11,#08,#99,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#08,#22,#08,#AA,#03,#22,#01,#21,#01,#22,#01,#21
    DB #02,#22,#03,#AA,#01,#A9,#01,#AA,#01,#A9,#02,#AA,#03,#22,#01,#21
    DB #04,#22,#03,#AA,#01,#A9,#04,#AA,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#03,#11,#02,#41,#03,#11,#03,#99,#02,#C9,#03,#99
    DB #03,#22,#01,#21,#01,#22,#01,#42,#02,#22,#03,#AA,#01,#A9,#01,#AA
    DB #01,#CA,#02,#AA,#08,#11,#08,#99,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#08,#22,#08,#AA,#03,#22,#01,#21,#02,#22,#01,#12
    DB #01,#22,#03,#AA,#01,#A9,#02,#AA,#01,#9A,#01,#AA,#03,#22,#01,#21
    DB #04,#22,#03,#AA,#01,#A9,#04,#AA,#08,#22,#08,#AA,#02,#11,#01,#41
    DB #01,#14,#01,#11,#01,#41,#02,#11,#02,#99,#01,#C9,#01,#9C,#01,#99
    DB #01,#C9,#02,#99,#03,#22,#01,#21,#01,#24,#03,#22,#03,#AA,#01,#A9
    DB #01,#AC,#03,#AA,#02,#11,#01,#21,#05,#11,#02,#99,#01,#A9,#05,#99
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#08,#22,#08,#AA
    DB #03,#22,#01,#21,#02,#22,#01,#21,#01,#22,#03,#AA,#01,#A9,#02,#AA
    DB #01,#A9,#01,#AA,#03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA
    DB #08,#22,#08,#AA,#01,#11,#01,#14,#01,#41,#01,#44,#01,#41,#01,#44
    DB #02,#11,#01,#99,#01,#9C,#01,#C9,#01,#CC,#01,#C9,#01,#CC,#02,#99
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#08,#11,#08,#99
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#08,#22,#08,#AA
    DB #03,#22,#01,#21,#04,#22,#03,#AA,#01,#A9,#04,#AA,#03,#22,#01,#21
    DB #04,#22,#03,#AA,#01,#A9,#04,#AA,#01,#12,#01,#21,#01,#11,#01,#21
    DB #01,#11,#01,#12,#01,#21,#01,#11,#01,#9A,#01,#A9,#01,#99,#01,#A9
    DB #01,#99,#01,#9A,#01,#A9,#01,#99,#01,#11,#05,#44,#01,#41,#01,#11
    DB #01,#99,#05,#CC,#01,#C9,#01,#99,#03,#22,#01,#21,#04,#22,#03,#AA
    DB #01,#A9,#04,#AA,#08,#11,#08,#99,#08,#11,#08,#99,#08,#11,#08,#99
    DB #08,#11,#08,#99,#08,#11,#08,#99,#01,#11,#01,#21,#03,#11,#01,#12
    DB #02,#11,#01,#99,#01,#A9,#03,#99,#01,#9A,#02,#99,#01,#14,#06,#44
    DB #01,#11,#01,#9C,#06,#CC,#01,#99,#08,#11,#08,#99
bitmap_room_tileset_rle_chunk_0_end:

bitmap_room_tileset_data_end:

bitmap_room_hud_heart_data:
; Classic hearts HUD disabled: linked MSX2 HUD asset owns the HUD band.

bitmap_room_hud_heart_data_end:

bitmap_room_hud_linked_data:
; Linked HUD dynamic widget #0 (iconRow) tile/glyph data, packed 4bpp RLE, destination VRAM #06A00
; Raw bytes: 2048; encoded bytes: 298
; VRAM #06A00, raw 2048 bytes, RLE 298 bytes
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
; Linked HUD dynamic widget #1 (counter) tile/glyph data, packed 4bpp RLE, destination VRAM #07200
; Raw bytes: 1024; encoded bytes: 452
; VRAM #07200, raw 1024 bytes, RLE 452 bytes
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
; Linked HUD dynamic widget #2 (iconRow) tile/glyph data, packed 4bpp RLE, destination VRAM #0EA00
; Raw bytes: 2048; encoded bytes: 360
; VRAM #0EA00, raw 2048 bytes, RLE 360 bytes
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
; Linked HUD dynamic widget #3 (counter) tile/glyph data, packed 4bpp RLE, destination VRAM #10800
; Raw bytes: 1024; encoded bytes: 452
; VRAM #10800, raw 1024 bytes, RLE 452 bytes
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

bitmap_room_hud_linked_data_end:

; Room dispatch tables are emitted in the resident window above.


bitmap_light_room_flags:
    DB 1,1    ; 1 = dark room (lamp is the only light source)

bitmap_light_bands:
    ; signed Y offset from the halo centre, height, half width
    DB #E0, 8, 20
    DB #E8, 8, 30
    DB #F0, 32, 40
    DB #10, 8, 30
    DB #18, 8, 20

bitmap_light_step_down:
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

bitmap_light_step_up:
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
; Room 0 page 0 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#A0
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#A0,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#A0,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#A0,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #00,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#00,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 0 page 1 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#A0
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#A0,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#A0,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#A0,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#20,#00,#00,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #00,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#00,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#00,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#10,#10,#10,#00,#00,#00,#00,#10,#10,#10,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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

; Room 1 page 0 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#A0
    DB #00,#00,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #00,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#00,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#A0,#00,#00,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#A0,#00,#00,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#00,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#A0,#00,#00,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#00,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #34,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#34,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#34,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#34,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#34,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#34,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #74,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#94,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#94,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#94,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #00,#02,#10,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#40
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#A4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#80,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#90,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#A0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#90,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 1 page 1 render program: 193 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#A0
    DB #00,#00,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00
    DB #00,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#A0,#00,#00,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#A0,#00,#00,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#A0,#00,#00,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#A0,#00,#00,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#A0,#00,#00,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #A0,#00,#00,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #34,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#34,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#34,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#34,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#34,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#34,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #74,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#94,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#94,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#B0,#00,#94,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #00,#02,#10,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#00,#02,#40
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#A0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#C0,#00,#00,#02,#B0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#C0,#00,#A4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#F0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#80
    DB #00,#00,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00
    DB #02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02
    DB #30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#40
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#50,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#60,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#80,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#90,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#A0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#00,#02,#B0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#80,#00,#00,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#80,#00,#00,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#80,#00,#00,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #80,#00,#00,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20
    DB #00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#50,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#60,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#80,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#90,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#20,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#20,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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






; Sprite 0 line color table (mode 2): configured player sprite "player_jump" + 3 state clip(s)
bitmap_room_sprite_colors:
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#46,#46,#46,#06,#46,#46,#06
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#06,#0F
    DB #06,#06,#06,#06,#06,#07,#46,#06,#06,#06,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0F,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #0F,#06,#06,#06,#06,#06,#06,#06,#06,#06,#46,#46,#46,#06,#46,#46
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#06
    DB #06,#06,#06,#06,#06,#06,#07,#46,#06,#06,#06,#0F,#0F,#0F,#06,#0F
    DB #0F,#06,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #0F,#0F,#06,#06,#06,#06,#06,#06,#06,#06,#06,#46,#46,#46,#06,#46
    DB #05,#05,#05,#05,#05,#05,#05,#05,#06,#05,#05,#05,#05,#05,#05,#06
    DB #46,#06,#06,#06,#06,#06,#06,#07,#07,#06,#06,#06,#0F,#0F,#0F,#0F
    DB #06,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #0F,#06,#06,#06,#06,#06,#06,#06,#06,#06,#46,#46,#46,#06,#46,#46
    DB #05,#05,#05,#05,#05,#05,#05,#06,#05,#05,#05,#05,#05,#05,#05,#06
    DB #06,#06,#06,#06,#06,#06,#07,#07,#06,#06,#06,#0F,#0F,#0F,#0F,#0F
    DB #0F,#06,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #0F,#0F,#06,#06,#06,#06,#06,#06,#06,#06,#06,#46,#46,#46,#46,#46
    DB #05,#05,#05,#05,#05,#05,#05,#05,#06,#05,#05,#05,#05,#05,#05,#06
    DB #46,#46,#46,#06,#06,#06,#06,#07,#07,#06,#06,#06,#0F,#0F,#0F,#0F
    DB #0F,#06,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
    DB #0F,#0F,#06,#06,#06,#06,#06,#06,#06,#46,#46,#46,#46,#46,#46,#46
    DB #05,#05,#05,#05,#05,#05,#05,#05,#06,#05,#05,#05,#05,#05,#05,#06
    DB #46,#06,#06,#06,#06,#06,#06,#07,#07,#06,#06,#06,#0F,#0F,#0F,#0F

bitmap_room_sprite_colors_end:

; SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing
bitmap_room_sprite_attrs:
    DB #60,#80,#00,#00,#60,#80,#04,#00,#70,#80,#08,#00,#70,#80,#0C,#00
    DB #D8,#00,#00,#00

bitmap_room_sprite_attrs_end:

; Sprite 0 pattern (16x16, mode 2 quadrants): configured player sprite "player_jump" + 3 state clip(s)
bitmap_room_sprite_patterns:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#E0,#40,#40
    DB #81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30,#98
    DB #01,#01,#00,#00,#0F,#10,#23,#25,#29,#09,#0A,#0A,#00,#40,#E0,#A0
    DB #02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA,#44
    DB #40,#41,#41,#41,#21,#1C,#01,#03,#01,#01,#01,#01,#01,#01,#00,#00
    DB #C0,#A0,#A0,#D0,#E0,#18,#48,#18,#00,#00,#00,#00,#00,#80,#C0,#00
    DB #01,#02,#02,#06,#06,#02,#0D,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #20,#40,#40,#20,#10,#A0,#40,#80,#80,#80,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#20,#70
    DB #00,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30
    DB #00,#01,#01,#00,#00,#0F,#10,#23,#45,#89,#09,#12,#04,#20,#70,#20
    DB #00,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA
    DB #20,#20,#21,#41,#41,#21,#1C,#01,#03,#01,#01,#01,#01,#01,#01,#01
    DB #98,#C0,#A0,#A0,#D0,#E0,#18,#48,#18,#00,#00,#00,#00,#00,#80,#C0
    DB #00,#01,#02,#02,#06,#06,#02,#0D,#00,#00,#00,#00,#00,#00,#00,#00
    DB #44,#20,#40,#40,#20,#10,#A0,#40,#80,#80,#80,#00,#00,#00,#40,#00
    DB #00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#E0
    DB #00,#01,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78
    DB #00,#00,#01,#01,#00,#00,#1F,#20,#C3,#05,#09,#11,#12,#00,#00,#40
    DB #00,#00,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06
    DB #40,#40,#40,#41,#41,#41,#21,#1C,#0C,#03,#01,#03,#04,#04,#07,#07
    DB #30,#98,#C0,#A0,#A0,#D6,#E4,#00,#00,#20,#A0,#20,#20,#20,#38,#38
    DB #E0,#A0,#01,#02,#02,#06,#06,#02,#01,#00,#06,#04,#00,#00,#00,#00
    DB #CA,#44,#20,#40,#46,#21,#19,#A0,#40,#90,#10,#00,#00,#00,#00,#00
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#E0,#40
    DB #01,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78,#30
    DB #00,#01,#01,#00,#00,#0F,#10,#23,#45,#49,#09,#0A,#08,#00,#40,#E0
    DB #00,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06,#CA
    DB #40,#40,#41,#41,#41,#21,#1C,#0C,#03,#01,#01,#01,#01,#01,#01,#01
    DB #98,#C0,#A0,#A0,#D6,#E4,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0
    DB #A0,#01,#02,#02,#06,#06,#02,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #44,#20,#40,#46,#21,#19,#A0,#40,#80,#80,#80,#00,#00,#00,#00,#00
    DB #00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#18,#3C,#7E,#7E
    DB #00,#01,#81,#81,#82,#58,#3C,#7E,#FE,#8E,#86,#68,#F4,#76,#66,#78
    DB #00,#00,#01,#01,#00,#00,#1F,#20,#C3,#05,#09,#01,#18,#3C,#7E,#66
    DB #00,#00,#02,#02,#40,#A7,#42,#80,#01,#31,#39,#1F,#17,#94,#10,#06
    DB #7E,#3C,#58,#41,#41,#41,#21,#1C,#0C,#03,#01,#03,#04,#04,#07,#07
    DB #30,#98,#C0,#A0,#A0,#D6,#E4,#00,#00,#20,#A0,#20,#20,#20,#38,#38
    DB #66,#1C,#19,#02,#02,#06,#06,#02,#01,#00,#06,#04,#00,#00,#00,#00
    DB #CA,#44,#20,#40,#46,#21,#19,#A0,#40,#90,#10,#00,#00,#00,#00,#00
    DB #00,#02,#01,#01,#01,#00,#00,#00,#01,#61,#61,#10,#31,#38,#5C,#EE
    DB #00,#02,#02,#02,#04,#B0,#78,#FC,#FC,#1C,#0C,#D0,#E8,#EC,#CC,#F0
    DB #00,#00,#02,#02,#00,#01,#3E,#41,#86,#6A,#62,#02,#00,#11,#08,#44
    DB #00,#00,#04,#04,#80,#4E,#84,#00,#02,#62,#72,#3E,#2E,#28,#20,#0C
    DB #67,#63,#43,#41,#41,#41,#21,#1C,#0C,#03,#01,#03,#04,#04,#07,#07
    DB #60,#F0,#C0,#A0,#A0,#C0,#E0,#10,#10,#20,#A0,#20,#20,#20,#38,#38
    DB #C2,#80,#00,#02,#02,#06,#06,#02,#01,#00,#06,#04,#00,#00,#00,#00
    DB #14,#08,#20,#40,#40,#20,#00,#A0,#40,#90,#10,#00,#00,#00,#00,#00
    DB #81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C,#19
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#07,#02,#02
    DB #40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53,#22
    DB #80,#80,#00,#00,#F0,#08,#C4,#A4,#94,#90,#50,#50,#00,#02,#07,#05
    DB #03,#05,#05,#0B,#07,#18,#12,#18,#00,#00,#00,#00,#00,#01,#03,#00
    DB #02,#82,#82,#82,#84,#38,#80,#C0,#80,#80,#80,#80,#80,#80,#00,#00
    DB #04,#02,#02,#04,#08,#05,#02,#01,#01,#01,#00,#00,#00,#00,#00,#00
    DB #80,#40,#40,#60,#60,#40,#B0,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#0E
    DB #00,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53
    DB #00,#80,#80,#00,#00,#F0,#08,#C4,#A2,#91,#90,#48,#20,#04,#0E,#04
    DB #19,#03,#05,#05,#0B,#07,#18,#12,#18,#00,#00,#00,#00,#00,#01,#03
    DB #04,#04,#84,#82,#82,#84,#38,#80,#C0,#80,#80,#80,#80,#80,#80,#80
    DB #22,#04,#02,#02,#04,#08,#05,#02,#01,#01,#01,#00,#00,#00,#02,#00
    DB #00,#80,#40,#40,#60,#60,#40,#B0,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#80,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E
    DB #00,#80,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#07
    DB #00,#00,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60
    DB #00,#00,#80,#80,#00,#00,#F8,#04,#C3,#A0,#90,#88,#48,#00,#00,#02
    DB #0C,#19,#03,#05,#05,#6B,#27,#00,#00,#04,#05,#04,#04,#04,#1C,#1C
    DB #02,#02,#02,#82,#82,#82,#84,#38,#30,#C0,#80,#C0,#20,#20,#E0,#E0
    DB #53,#22,#04,#02,#62,#84,#98,#05,#02,#09,#08,#00,#00,#00,#00,#00
    DB #07,#05,#80,#40,#40,#60,#60,#40,#80,#00,#60,#20,#00,#00,#00,#00
    DB #80,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E,#0C
    DB #80,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#07,#02
    DB #00,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60,#53
    DB #00,#80,#80,#00,#00,#F0,#08,#C4,#A2,#92,#90,#50,#10,#00,#02,#07
    DB #19,#03,#05,#05,#6B,#27,#00,#00,#00,#00,#00,#00,#00,#00,#03,#03
    DB #02,#02,#82,#82,#82,#84,#38,#30,#C0,#80,#80,#80,#80,#80,#80,#80
    DB #22,#04,#02,#62,#84,#98,#05,#02,#01,#01,#01,#00,#00,#00,#00,#00
    DB #05,#80,#40,#40,#60,#60,#40,#80,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#80,#81,#81,#41,#1A,#3C,#7E,#7F,#71,#61,#16,#2F,#6E,#66,#1E
    DB #00,#80,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#18,#3C,#7E,#7E
    DB #00,#00,#40,#40,#02,#E5,#42,#01,#80,#8C,#9C,#F8,#E8,#29,#08,#60
    DB #00,#00,#80,#80,#00,#00,#F8,#04,#C3,#A0,#90,#80,#18,#3C,#7E,#66
    DB #0C,#19,#03,#05,#05,#6B,#27,#00,#00,#04,#05,#04,#04,#04,#1C,#1C
    DB #7E,#3C,#1A,#82,#82,#82,#84,#38,#30,#C0,#80,#C0,#20,#20,#E0,#E0
    DB #53,#22,#04,#02,#62,#84,#98,#05,#02,#09,#08,#00,#00,#00,#00,#00
    DB #66,#38,#98,#40,#40,#60,#60,#40,#80,#00,#60,#20,#00,#00,#00,#00
    DB #00,#40,#40,#40,#20,#0D,#1E,#3F,#3F,#38,#30,#0B,#17,#37,#33,#0F
    DB #00,#40,#80,#80,#80,#00,#00,#00,#80,#86,#86,#08,#8C,#1C,#3A,#77
    DB #00,#00,#20,#20,#01,#72,#21,#00,#40,#46,#4E,#7C,#74,#14,#04,#30
    DB #00,#00,#40,#40,#00,#80,#7C,#82,#61,#56,#46,#40,#00,#88,#10,#22
    DB #06,#0F,#03,#05,#05,#03,#07,#08,#08,#04,#05,#04,#04,#04,#1C,#1C
    DB #E6,#C6,#C2,#82,#82,#82,#84,#38,#30,#C0,#80,#C0,#20,#20,#E0,#E0
    DB #28,#10,#04,#02,#02,#04,#00,#05,#02,#09,#08,#00,#00,#00,#00,#00
    DB #43,#01,#00,#40,#40,#60,#60,#40,#80,#00,#60,#20,#00,#00,#00,#00

bitmap_room_sprite_patterns_end:

; Player animation clip table: id 0 = base idle/walk, ids 1..3 = state
; clips. 3 bytes/entry: frameBase, frameCount, delayFrames. Indexed by player_anim_state.
; 1=WALK(base 2,2f), 2=perceiving(base 4,1f), 3=ATTACK(base 5,1f)
bitmap_player_anim_clip_table:
    DB #00,#02,#08,#02,#02,#08,#04,#01,#08,#05,#01,#08


; Shoot skill: 16x16 bullet sprite pattern (mode 2 quadrants)
bitmap_bullet_pattern_data:
    DB #00,#00,#00,#00,#01,#02,#05,#05,#02,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#80,#40,#A0,#A0,#40,#80,#00,#00,#00,#00,#00,#00
bitmap_bullet_pattern_data_end:
; Shoot skill: 16-byte line colour table for the bullet sprite
bitmap_bullet_color_data:
    DB #0F,#0F,#0F,#0F,#07,#07,#07,#07,#07,#07,#0F,#0F,#0F,#0F,#0F,#0F
bitmap_bullet_color_data_end:
    ds #C000 - $, #FF
    end
