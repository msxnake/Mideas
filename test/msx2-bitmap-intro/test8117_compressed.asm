; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: test8(1)17
; Room: pant2
; Screen mode: SCREEN 4 (Graphics II)
; Backend: msx2-screen4-bitmap-room
; ROM Mode: megarom
; Mapper Target: konami
; Auto MegaROM: No
; NOTE: Bitmap-room SCREEN 5 RLE sources are read through Konami P2/#8000 data banks.
; Visible page: VRAM #0000, 128 bytes/row, 212 lines
; Bitmap room HUD height: 20 px
; Bitmap room HUD widgets: 3
; Bitmap room game area: 256x192 at visual Y=20
; Bitmap room game band VRAM base: #0A00
; World rooms: 12; start room index: 1
; Shared tileset bytes: 65536 at VRAM #10000
; MSX2_GAMEFLOW_INTRO_SCENES: 1
; ==================================================================

CHGMOD  EQU #005F
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
bitmap_room_tileset_rle_chunk_1_DATA_BANK EQU 4
bitmap_room_tileset_rle_chunk_2_DATA_BANK EQU 4
bitmap_room_tileset_rle_chunk_3_DATA_BANK EQU 4
bitmap_room_hud_linked_0_rle_chunk_0_DATA_BANK EQU 4
bitmap_room_hud_linked_1_rle_chunk_0_DATA_BANK EQU 5
bitmap_room_hud_linked_2_rle_chunk_0_DATA_BANK EQU 5
bitmap_intro_scene0_rle_chunk_0_DATA_BANK EQU 6
bitmap_intro_scene0_rle_chunk_1_DATA_BANK EQU 7
bitmap_intro_scene0_rle_chunk_2_DATA_BANK EQU 8
bitmap_intro_scene0_rle_chunk_3_DATA_BANK EQU 8


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
; --- DOUBLE JUMP skill: jumps taken since leaving the ground ---
player_jumps_used EQU #C00D
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
; Sub-pixel gravity accumulator (low byte of the 8.8 gravityStrength from the Player
; Config). Added to player_vy_frac every frame; player_vy only rises by 1 when this
; carries, so the fall/jump arc accelerates gradually like SCREEN 4 (default 0.25
; px/frame^2) instead of the old fixed 1 px/frame^2 nudge.
player_vy_frac                    EQU #C0D9












; --- ICE SLIDE skill RAM (SCREEN 5 bitmap) ---
bitmap_ice_vx       EQU #C0DA
bitmap_ice_accel_t  EQU #C0DB
bitmap_ice_friction_t EQU #C0DC
bitmap_ice_input    EQU #C0DD


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
hud_dec3_buffer EQU #C0E5
hud_dec5_buffer EQU #C0E8
; Linked HUD icon row #0 (hud_el_1783004114045_6h49y), bound to "playerEnergy".
hud_linked_0_drawn EQU #C0DE
; Linked HUD counter #1 (hud_el_1783009772122_go9ku), bound to "collectibles" [8-bit, 2 digits].
hud_linked_1_drawn EQU #C0DF
hud_linked_1_value EQU #C0E0
; Linked HUD counter #2 (hud_el_1783010155284_39e4l), bound to "score" [16-bit, 4 digits].
hud_linked_2_drawn EQU #C0E1
hud_linked_2_value EQU #C0E3
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
    ; Render the start room from the shared tileset already in VRAM.
    ld a, 1
    call load_room
    ; Place the player at the room spawn point.
    ld a, 99
    ld (player_y), a
    ld a, 76
    ld (player_x), a
    xor a
    ld (player_pat), a
    ld (player_ec), a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    ld (player_vy), a
    ld (player_vy_frac), a
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
    ld hl, #FFFF
    ld (hud_linked_2_drawn), hl
    ld hl, #0000
    ld (hud_linked_2_value), hl
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so interrupts stay disabled and the BIOS cannot
    ; consume S#0 before the main loop sees it.
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (player_jumps_used), a
    xor a
    ld (bitmap_ice_vx), a
    ld (bitmap_ice_accel_t), a
    ld (bitmap_ice_friction_t), a
    ld (bitmap_ice_input), a
.main_loop:
    call bitmap_wait_vblank
    call step_room_composition
    jp c, .skip_player_movement
    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
.skip_player_movement:
    call bitmap_update_player_sprite_animation
    call bitmap_upload_player_frame_colors
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_linked_0    ; redraw linked HUD icon row #0 (hud_el_1783004114045_6h49y)
    call update_hud_linked_1    ; redraw linked HUD counter #1 (hud_el_1783009772122_go9ku)
    call update_hud_linked_2    ; redraw linked HUD counter #2 (hud_el_1783010155284_39e4l)
    call bitmap_update_sprite_sat
    jp .main_loop

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
    call bitmap_intro_fade_black
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

bitmap_intro_fade_black:
    ; Write all 16 palette entries black, then blank the bitmap too: the game
    ; boot uploads the atlas next (slow) and the old presentation must not
    ; reappear when the game palette loads. Clobbers AF, BC, DE, HL.
    ld hl, bitmap_intro_black_palette
    call bitmap_intro_load_palette
    jp bitmap_intro_cls

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


; --- V9938 bitmap SCREEN 4 runtime (Vampire Killer style) ---

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
;   Required before Konami mapper writes. Without this, ld (#8000),A writes RAM
;   instead of the cartridge mapper register on machines where page 2 still
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
;   Initialize a Konami 8KB MegaROM with bank 0 fixed at #4000 and the
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
;   Writes Konami mapper registers #6000, #8000 and #A000.
;
; NOTES:
;   Stack is not used here. Bank 0 remains fixed by the cartridge mapper.
; ------------------------------------------------------------
init_konami8k_fixed_bank0_banks:
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
;   Writes Konami mapper register #6000.
;
; NOTES:
;   No PUSH/POP. LD (nn),A does not modify flags.
; ------------------------------------------------------------
mapper_set_bank_p1:
    ld (#6000), a
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
;   Writes Konami mapper register #8000.
;
; NOTES:
;   P2 is the bitmap-room data read window for banked RLE sources.
; ------------------------------------------------------------
mapper_set_bank_p2:
    ld (#8000), a
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
;   Writes Konami mapper register #A000.
;
; NOTES:
;   Present for symmetry with the fixed-bank0 SCREEN 4 MegaROM runtime.
; ------------------------------------------------------------
mapper_set_bank_p3:
    ld (#A000), a
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
    ; 256px row), so the actual VDP mode must be SCREEN 5/Graphic 4. The editor
    ; route is still named SCREEN 4 bitmap-room while this branch is bifurcated.
    ld a, #05
    call CHGMOD
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
    ld a, 5
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_1_end - bitmap_room_tileset_rle_chunk_1
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_room_tileset_rle_chunk_2_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_tileset_rle_chunk_2
    ld a, 6
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_2_end - bitmap_room_tileset_rle_chunk_2
    call decompress_bitmap_rle_to_vram
    ld a, bitmap_room_tileset_rle_chunk_3_DATA_BANK
    call bitmap_room_select_data_bank_a
    ld hl, bitmap_room_tileset_rle_chunk_3
    ld a, 7
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_3_end - bitmap_room_tileset_rle_chunk_3
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
;   clears bitmap_composition_state, and resets vertical player velocity. HUD dirty
;   flags are NOT invalidated: dynamic HUD widgets are mirrored to both pages when
;   their values change, so transitions only rewrite the game band.
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
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
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
    ld a, 2
    ld (player_y), a
    jp .commit_flip_page
.commit_enter_bottom:
    ld a, 158
    ld (player_y), a
    jp .commit_flip_page
.commit_enter_right:
    ld a, 238
    ld (player_x), a
    jp .commit_flip_page
.commit_enter_left:
    ld a, 2
    ld (player_x), a
.commit_flip_page:
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

    push bc
    call bitmap_ice_slide_step
    pop bc
    jp nc, .ice_slide_hook_done
    ; ice_slide owned horizontal movement this frame. Cross a room edge ONLY
    ; when the player is actually sliding toward it (signed bitmap_ice_vx).
    ; commit_room_flip places the player at player_x = 2 (west entry) / 238
    ; (east entry); a purely positional edge check would fire on the first
    ; frame and bounce the player back into the previous room, causing an
    ; enter/exit oscillation when entering an ice room from a non-ice one.
    ld a, (bitmap_ice_vx)
    or a
    jp z, .check_jump              ; stationary on ice -> no edge transition
    bit 7, a
    jp nz, .ice_slide_edge_west    ; negative vx -> sliding west
    ; sliding east: transition only once the east edge is actually reached
    ld a, (player_x)
    cp 238
    jp c, .check_jump
    ld a, 1                        ; direction east
    push bc                        ; start_room_transition clobbers BC; C (keyboard row 8 mask) must survive for .check_jump
    call start_room_transition
    pop bc
    ret c                          ; transition queued -> done this frame
    jp .check_jump
.ice_slide_edge_west:
    ld a, (player_x)
    cp 3
    jp nc, .check_jump
    xor a                          ; direction west
    push bc
    call start_room_transition
    pop bc
    ret c
    jp .check_jump
.ice_slide_hook_done:

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
    ; DOUBLE JUMP: reset the jump counter whenever the player is grounded.
    ld a, (player_flags)
    and #01
    jp z, .cj_airborne
    xor a
    ld (player_jumps_used), a
.cj_airborne:
    bit 0, c     ; jump key SPC
    jp nz, .jump_pressed
    jp .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity        ; key held -> no repeat
    ld a, (player_flags)
    and #01
    jp nz, .jump_from_ground
    ; Airborne: coyote first (counts as jump #1), then air jumps, then buffer.
    ld a, (player_jumps_used)
    cp #02
    jp nc, .apply_gravity
    ld a, #FA              ; -6 px/frame mid-air jump velocity
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_jumps_used)
    inc a
    ld (player_jumps_used), a
    ld a, 1
    ld (player_jump_lock), a
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
    ld (player_jumps_used), a     ; ground jump counts as the first jump
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
    cp 2
    jp nc, .check_south_edge
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
    ld a, (player_moving)
    or a
    jp nz, .player_anim_active
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    jp .refresh_player_pattern
.player_anim_active:
    ld a, (player_anim_counter)
    inc a
    cp 8
    jp nc, .advance_player_anim_frame
    ld (player_anim_counter), a
    jp .refresh_player_pattern
.advance_player_anim_frame:
    xor a
    ld (player_anim_counter), a
    ld a, (player_anim_frame)
    inc a
    cp 2
    jp c, .store_player_anim_frame
    xor a
.store_player_anim_frame:
    ld (player_anim_frame), a
.refresh_player_pattern:
    ld a, (player_anim_frame)
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
    add a, 32
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
    ld a, (player_anim_frame)
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
    call bitmap_probe_solid
    jp nz, .x_blocked
    ld a, (player_y)
    add a, 19
    ld c, a                 ; C = probe Y (+19)
    call bitmap_probe_solid
    jp nz, .x_blocked
    ld a, (player_y)
    add a, 31
    ld c, a                 ; C = probe Y (+31)
    call bitmap_probe_solid
    jp nz, .x_blocked
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
    ld a, (player_x)
    add a, 3
    ld b, a                 ; B = probe X (+3)
    call bitmap_probe_solid
    jp nz, .y_blocked
    ld a, (player_x)
    add a, 11
    ld b, a                 ; B = probe X (+11)
    call bitmap_probe_solid
    jp nz, .y_blocked
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
    ld a, e                 ; restore A = original cell value
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
    ; when empty. Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
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
    jr nz, .slot_0_hide_y
    ld a, (player_y)
    add a, 20
    out (#98), a
    jr .slot_0_after_y
.slot_0_hide_y:
    ld a, #D8
    out (#98), a
.slot_0_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (blink_hide)
    or a
    jr nz, .slot_1_hide_y
    ld a, (player_y)
    add a, 20
    out (#98), a
    jr .slot_1_after_y
.slot_1_hide_y:
    ld a, #D8
    out (#98), a
.slot_1_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    add a, 4
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (blink_hide)
    or a
    jr nz, .slot_2_hide_y
    ld a, (player_y)
    add a, 20
    add a, 16                   ; cell row +16px
    out (#98), a
    jr .slot_2_after_y
.slot_2_hide_y:
    ld a, #D8
    out (#98), a
.slot_2_after_y:
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    add a, 8
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (blink_hide)
    or a
    jr nz, .slot_3_hide_y
    ld a, (player_y)
    add a, 20
    add a, 16                   ; cell row +16px
    out (#98), a
    jr .slot_3_after_y
.slot_3_hide_y:
    ld a, #D8
    out (#98), a
.slot_3_after_y:
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
; FUNCTION: bitmap_ice_player_on_surface
; ------------------------------------------------------------
; PURPOSE:
;   Check whether both player foot probes stand on a SCREEN 5 bitmap behavior
;   cell marked as ice.
;
; INPUT:
;   player_x/player_y = top-left player position. The probe checks the two
;   foot cells directly; it does not depend on player_flags because grounded
;   state is updated later in the same movement frame.
;
; OUTPUT:
;   Z set when the player is on ice; Z clear otherwise.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_probe_behavior.
;
; SIDE EFFECTS:
;   None.
;
; NOTES:
;   Ice is authored in the room behavior layer. Code 3 is treated
;   as slippery surface for this skill.
;   Foot probes use the resolved Player Config body hitbox offsets:
;   left +3, right +11, y +32.
; ------------------------------------------------------------
bitmap_ice_player_on_surface:
    ld a, (player_x)
    add a, 3
    ld b, a
    ld a, (player_y)
    add a, 32
    ld c, a
    call bitmap_probe_behavior
    cp 3
    jp nz, .ice_not_on_surface
    ld a, (player_x)
    add a, 11
    ld b, a
    ld a, (player_y)
    add a, 32
    ld c, a
    call bitmap_probe_behavior
    cp 3
    ret
.ice_not_on_surface:
    or 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_ice_slide_step
; ------------------------------------------------------------
; PURPOSE:
;   Consume horizontal movement while the player is grounded on an ice behavior
;   cell. Input accelerates signed inertia; releasing input applies slow
;   friction, so the player keeps sliding.
;
; INPUT:
;   C = row-8 keyboard pressed mask from update_player_movement
;       (bit7=right, bit4=left, pressed bit = 1).
;
; OUTPUT:
;   Carry set if ice_slide handled horizontal movement this frame.
;   Carry clear if normal horizontal movement should run.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_ice_player_on_surface, bitmap_try_move_x.
;
; SIDE EFFECTS:
;   Updates bitmap_ice_vx/timers, player_x, player_facing, player_moving.
;
; NOTES:
;   This routine intentionally runs before the normal 2px/frame movement block.
;   It accelerates only on behavior code 3. If the player leaves
;   ice with pending inertia, the routine keeps applying friction until the
;   signed velocity reaches zero instead of stopping abruptly.
;   The input mask is copied to bitmap_ice_input before probing because the
;   behavior probes destroy BC.
; ------------------------------------------------------------
bitmap_ice_slide_step:
    ld a, c
    ld (bitmap_ice_input), a
    call bitmap_ice_player_on_surface
    jp z, .ice_active
    ld a, (bitmap_ice_vx)
    or a
    jp nz, .ice_coast_off_surface
    xor a
    ld (bitmap_ice_accel_t), a
    ld (bitmap_ice_friction_t), a
    ld (bitmap_ice_input), a
    or a
    ret
.ice_coast_off_surface:
    xor a
    ld (bitmap_ice_accel_t), a
    inc a
    ld (player_moving), a
    jp .ice_no_input
.ice_active:
    ld a, (bitmap_ice_input)
    bit 7, a
    jp z, .ice_check_left
    ld a, 1
    ld (player_facing), a
    ld (player_moving), a
    call bitmap_ice_accel_right
    jp .ice_apply_vx
.ice_check_left:
    ld a, (bitmap_ice_input)
    bit 4, a
    jp z, .ice_no_input
    xor a
    ld (player_facing), a
    inc a
    ld (player_moving), a
    call bitmap_ice_accel_left
    jp .ice_apply_vx
.ice_no_input:
    call bitmap_ice_apply_friction
.ice_apply_vx:
    ld a, (bitmap_ice_vx)
    or a
    jp z, .ice_handled
    call bitmap_try_move_x
.ice_handled:
    scf
    ret

bitmap_ice_accel_right:
    ld a, (bitmap_ice_accel_t)
    inc a
    cp 4
    jp c, .ice_store_accel_t
    xor a
    ld (bitmap_ice_accel_t), a
    ld a, (bitmap_ice_vx)
    cp 4
    ret z
    inc a
    ld (bitmap_ice_vx), a
    ret
.ice_store_accel_t:
    ld (bitmap_ice_accel_t), a
    ret

bitmap_ice_accel_left:
    ld a, (bitmap_ice_accel_t)
    inc a
    cp 4
    jp c, .ice_store_accel_left_t
    xor a
    ld (bitmap_ice_accel_t), a
    ld a, (bitmap_ice_vx)
    cp #FC
    ret z
    dec a
    ld (bitmap_ice_vx), a
    ret
.ice_store_accel_left_t:
    ld (bitmap_ice_accel_t), a
    ret

bitmap_ice_apply_friction:
    ld a, (bitmap_ice_vx)
    or a
    ret z
    ld a, (bitmap_ice_friction_t)
    inc a
    cp 4
    jp c, .ice_store_friction_t
    xor a
    ld (bitmap_ice_friction_t), a
    ld a, (bitmap_ice_vx)
    bit 7, a
    jp nz, .ice_friction_negative
    dec a
    ld (bitmap_ice_vx), a
    ret
.ice_friction_negative:
    inc a
    ld (bitmap_ice_vx), a
    ret
.ice_store_friction_t:
    ld (bitmap_ice_friction_t), a
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
    jp .deadly_respawn          ; health 0 -> -1 life + full respawn
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
; FUNCTION: hud_word_to_dec5
; ------------------------------------------------------------
; PURPOSE:
;   Converts HL (0-65535) to 5 ASCII decimal digits in hud_dec5_buffer, shared by
;   every wide (16-bit) linked HUD counter widget. No division: repeated 16-bit
;   subtraction of 10000/1000/100/10 (max ~33 iterations total), remainder = units.
; INPUT:
;   HL = value (0-65535)
; OUTPUT:
;   hud_dec5_buffer[0..4] = '0'-'9' (ten-thousands .. units)
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
hud_word_to_dec5:
    ld de, hud_dec5_buffer
    ld bc, #2710          ; 10000
    call hud_dec5_digit
    ld bc, #03E8          ; 1000
    call hud_dec5_digit
    ld bc, #0064          ; 100
    call hud_dec5_digit
    ld bc, #000A          ; 10
    call hud_dec5_digit
    ld a, l               ; remainder = units
    add a, '0'
    ld (de), a
    ret
hud_dec5_digit:
    xor a                 ; digit count = 0
.hud_dec5_sub:
    or a                  ; clear carry for sbc (A = count, preserved)
    sbc hl, bc
    jr c, hud_dec5_done
    inc a
    jr .hud_dec5_sub
hud_dec5_done:
    add hl, bc            ; restore (over-subtracted by one)
    add a, '0'
    ld (de), a
    inc de
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
;   zero-padded decimal digit(s) at x=248, y=4, redrawn only when
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
    ld a, 4
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
    ld b, 1
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
    add a, 248
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
;   Numeric counter widget for linked HUD element "hud_el_1783010155284_39e4l": 4
;   zero-padded decimal digit(s) at x=140, y=2, redrawn only when
;   hud_linked_2_value changes (dirty-flag). 16-bit value via hud_word_to_dec5.
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_word_to_dec5, hud_linked_launch_cmd, vdp_write_register
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
    ld hl, (hud_linked_2_value)
    ld de, (hud_linked_2_drawn)
    or a
    sbc hl, de
    jr nz, .hud_linked_2_changed
    ret
.hud_linked_2_changed:
    ld hl, (hud_linked_2_value)
    ld (hud_linked_2_drawn), hl
    call hud_word_to_dec5

    ld hl, hud_linked_2_cmd_template
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
    ld b, 4
    ld c, 0
.hud_linked_2_digit_loop:
    push bc
    ld a, c
    ld e, a
    ld d, 0
    ld hl, hud_dec5_buffer + 1
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
    add a, 140
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz .hud_linked_2_digit_loop
    ret

hud_linked_2_cmd_template:
    ; SY is a full 10-bit word: glyph sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, #D4,#01, 0,0, 0,0, 8,0, 8,0, 0,0, #D0

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


; VDP palette bytes: byte1=(R<<4)|B, byte2=G
screen5_bitmap_palette_data:
    DB #00,#00,#00,#00,#40,#01,#16,#04,#21,#03,#03,#02,#32,#02,#11,#01
    DB #46,#05,#74,#04,#52,#05,#63,#06,#12,#04,#50,#06,#44,#04,#77,#07

; GameFlow intro scene 0 palette: byte1=(R<<4)|B, byte2=G
bitmap_intro_scene0_palette:
    DB #00,#00,#00,#00,#22,#05,#33,#06,#15,#01,#27,#02,#51,#01,#36,#06
    DB #72,#02,#74,#04,#52,#05,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07
; All-black palette for the fade_to_black intro transition
bitmap_intro_black_palette:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
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

bitmap_room_blockcount_table:
    DW 40
    DW 40
    DW 35
    DW 50
    DW 72
    DW 41
    DW 47
    DW 61
    DW 49
    DW 65
    DW 57
    DW 105

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

; Edge rails per room: west,east,north,south (#FF = none)
bitmap_room_transition_table:
    DB #FF,#01,#FF,#06,#00,#02,#FF,#FF,#01,#03,#FF,#FF,#02,#FF,#FF,#04
    DB #0B,#FF,#03,#05,#08,#FF,#04,#FF,#FF,#07,#00,#FF,#06,#0B,#FF,#FF
    DB #09,#05,#FF,#FF,#0A,#08,#FF,#FF,#FF,#09,#FF,#FF,#07,#04,#FF,#FF

bitmap_room_spawn_x_table:
    DB 32,76,0,0,0,0,0,0,0,0,0,0
bitmap_room_spawn_y_table:
    DB 128,99,216,216,216,216,216,216,216,216,216,216

; Per-room render programs, collision maps and behavior maps.
; Room 0 page 0 render program: 40 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#20,#02,#D0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#E0,#00,#20,#02,#E0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#E0,#00,#20,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#E0,#00,#20,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#10,#02,#50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #10,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#10,#02,#90
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0
; Room 0 page 1 render program: 40 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#E0,#00,#20,#02,#D0,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#E0,#00,#20,#02,#E0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#E0,#00,#20,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#E0,#00,#20,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#10,#02,#50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #10,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#10,#02,#90
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0
; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#10,#10,#40,#40,#10,#10,#40,#10,#00,#00,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#10
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Room 1 page 0 render program: 40 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #10,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10
    DB #02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#10,#02
    DB #80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#10,#02,#90
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#20,#02,#60,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#20,#02,#70,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#20,#02,#80,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#20,#02,#90,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#20,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #20,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#20
    DB #02,#80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#20,#02
    DB #90,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#10,#02,#D0
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#E0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#F0,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#F0,#00,#00,#02,#40,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#F0,#00,#00,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#F0,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#F0,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #F0,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0
    DB #00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00
    DB #00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00
    DB #02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02
    DB #C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#D0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#E0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#F0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0
; Room 1 page 1 render program: 40 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00
    DB #10,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10
    DB #02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#E0,#00,#10,#02
    DB #80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#10,#02,#90
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#20,#02,#60,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#20,#02,#70,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#20,#00,#20,#02,#80,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#30,#00,#20,#02,#90,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#20,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #20,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#20
    DB #02,#80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#20,#02
    DB #90,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#10,#02,#D0
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#E0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#F0,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#F0,#00,#00,#02,#40,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#F0,#00,#00,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#F0,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#F0,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #F0,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0
    DB #00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00
    DB #00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00
    DB #02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02
    DB #C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#D0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#E0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#F0,#00,#00,#02,#F0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0
; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10
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

; Room 2 page 0 render program: 35 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#80,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#80,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#80,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #80,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#74
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#94,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#B0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 2 page 1 render program: 35 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#80,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#80,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#80,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #80,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#74
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#94,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#B0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 2 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_2:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#10,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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

; Room 3 page 0 render program: 50 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#20,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#50,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#60,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#70,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#80,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#50,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#10,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#20,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#30,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#40,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#50,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#10,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#10,#02,#80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#10,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#30,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#50,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#70,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#10,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 3 page 1 render program: 50 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_3_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#20,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#50,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#60,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#70,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#80,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#50,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#10,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#20,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#30,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#40,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#50,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#10,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#10,#02,#80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#10,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#30,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#50,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#70,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#10,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 3 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#10,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#10,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10
; Room 3 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_3:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#00,#03,#03,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#03,#00,#00,#03,#03,#03,#03,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#03,#03,#03,#03,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#03,#03,#03,#03,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#03,#03,#03,#03,#00,#00,#00,#00,#00,#00,#00
    DB #00,#03,#03,#03,#03,#03,#03,#03,#03,#00,#00,#00,#03,#03,#03,#03
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#00,#00,#00,#03,#03,#03,#03

; Room 4 page 0 render program: 72 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#70,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#10,#02,#80,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#70,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#80,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #C0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0
    DB #00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#80,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#70,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#10,#02,#80,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #70,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#80
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#80,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#70,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#80,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #00,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#80
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0
; Room 4 page 1 render program: 72 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_4_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#70,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#10,#02,#80,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#70,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#80,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #C0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0
    DB #00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#80,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#70,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#10,#02,#80,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #70,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#80
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#00,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#80,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#70,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#80,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #00,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#80
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0
; Room 4 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_4:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#00,#00
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

; Room 5 page 0 render program: 41 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_5_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#10,#02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#10,#02,#40,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#50,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#60,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#70,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #80,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#34
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#34,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#10,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#20,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#30,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#10,#02,#40,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#50,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#60,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#70,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#80,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #90,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#B0,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0
; Room 5 page 1 render program: 41 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_5_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#50,#00,#10,#02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#10,#02,#40,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#50,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #10,#02,#60,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#70,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #80,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#34
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#34,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#50,#00,#10,#02,#10,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#50,#00,#10,#02,#20,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#30,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#50,#00,#10,#02,#40,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#50,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50
    DB #00,#10,#02,#60,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#70,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10
    DB #02,#80,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02
    DB #90,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#B0,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#10,#02,#D0,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0
; Room 5 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_5:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
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

; Room 6 page 0 render program: 47 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#10,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#20,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#E0,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#F0,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0
; Room 6 page 1 render program: 47 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_6_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#10,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#20,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#E0,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#F0,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0
; Room 6 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_6:
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
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03

; Room 7 page 0 render program: 61 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_7_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#00,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#E0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#00,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#20,#02
    DB #40,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#20,#02,#50
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#10,#02,#70,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#80,#00,#B4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#90,#00,#B4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#A0,#00,#B4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#B0,#00,#B4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#10,#02,#C0,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#F0,#00,#10,#02,#D0,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#10,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#10,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#10,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#10,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0
; Room 7 page 1 render program: 61 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_7_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#00,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#E0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#00,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#20,#02
    DB #40,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#20,#02,#50
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#C0,#00,#10,#02,#70,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#80,#00,#B4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#90,#00,#B4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#A0,#00,#B4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#D0,#00,#10,#02,#B0,#00,#B4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#E0,#00,#10,#02,#C0,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#F0,#00,#10,#02,#D0,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#10,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#10,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#10,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#10,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0
; Room 7 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_7:
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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

; Room 8 page 0 render program: 49 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_8_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 8 page 1 render program: 49 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_8_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 8 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_8:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Room 8 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_8:
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Room 9 page 0 render program: 65 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_9_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#24,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#24,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#24,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#24,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#A0,#00,#34,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#A0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#00,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #10,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#30,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#A0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#D0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#00,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #10,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#30,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#A0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#B0,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 9 page 1 render program: 65 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_9_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#24,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#24,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#24,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#24,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#A0,#00,#34,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#A0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#00,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #10,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#30,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#A0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#D0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#00,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #10,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#20
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#30,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#A0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#B0,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 9 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_9:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Room 9 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_9:
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#00,#00,#00,#00,#00
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00,#00,#03,#03,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#00,#00
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Room 10 page 0 render program: 57 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_10_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#70,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#80,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #90,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#24
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00,#24,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#E0,#00,#24,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#24,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#34,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#00,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#70,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#80,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#90,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#A0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#B0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#C0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #D0,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#E0
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#10,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#20,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#30,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#40,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#50,#00,#84,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#60,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#70,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#80,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#90,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#A0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #B0,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#E0,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0
; Room 10 page 1 render program: 57 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_10_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#40
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#70,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#80,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #90,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#A0
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#B0,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0,#00,#24
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00,#24,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#E0,#00,#24,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#24,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#34,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#00,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#70,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#80,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#90,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#A0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#B0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#C0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #D0,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#E0
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#00,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#10,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#40,#00,#10,#02,#20,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#10,#02,#30,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#40,#00,#10,#02,#40,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#40,#00,#10,#02,#50,#00,#84,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#40,#00,#10,#02,#60,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #40,#00,#10,#02,#70,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40
    DB #00,#10,#02,#80,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00
    DB #10,#02,#90,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10
    DB #02,#A0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02
    DB #B0,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#C0
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#D0,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#E0,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#10,#02,#F0,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0
; Room 10 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_10:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Room 10 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_10:
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #03,#00,#00,#00,#00,#00,#00,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #03,#00,#00,#00,#00,#00,#00,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Room 11 page 0 render program: 105 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_11_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#14,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#14,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#14,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#14,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#14,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#14,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#D0,#00,#14,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#E0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#F0,#00,#14,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#00,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #44,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#44
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#44,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#44,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#44,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#44,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#44,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#44,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#D0,#00,#44,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#F0,#00,#44,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#20,#02,#30,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#40,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00
    DB #10,#02,#50,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10
    DB #02,#60,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02
    DB #70,#00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#80
    DB #00,#54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#90,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#A0,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#B0,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#C0,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#20,#02,#30,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#40,#00,#64,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#60,#00,#10,#02,#50,#00,#64,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#60,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#70,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#80,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#90,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#A0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #B0,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#C0
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#74,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#50,#00,#74,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#90,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#A0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#B0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#10,#02,#C0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#40,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02
    DB #50,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#60
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#70,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#80,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#90,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#A0,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#B0,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#10,#02,#C0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#40,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#50,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#80,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#90,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #A0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0
    DB #00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#C0,#00
    DB #94,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#00,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#C0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0
; Room 11 page 1 render program: 105 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_11_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#B0
    DB #00,#10,#02,#00,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#14
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#14,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#14,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#14,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#14,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#14,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#14,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#D0,#00,#14,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#E0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#F0,#00,#14,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#00,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#10,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#20,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #30,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40
    DB #00,#44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#50,#00
    DB #44,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#44
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#44,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#44,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#90,#00,#44,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#A0,#00,#44,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#B0,#00,#44,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#C0,#00,#44,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#D0,#00,#44,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#F0,#00,#44,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #50,#00,#20,#02,#30,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#40,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00
    DB #10,#02,#50,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10
    DB #02,#60,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02
    DB #70,#00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#80
    DB #00,#54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#90,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#A0,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#B0,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#C0,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#80,#00,#20,#02,#30,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#40,#00,#64,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#60,#00,#10,#02,#50,#00,#64,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#60,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#70,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#80,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#90,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#A0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #B0,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#C0
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#40,#00,#74,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#50,#00,#74,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#60,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#70,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#80,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#90,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#A0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#B0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#10,#02,#C0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#40,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02
    DB #50,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#60
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#70,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#80,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#90,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#A0,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#B0,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#60,#00,#10,#02,#C0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#40,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#50,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#80,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#90,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #A0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#B0
    DB #00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#C0,#00
    DB #94,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#60,#00,#10,#02,#00,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#10,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#B0,#00,#10,#02,#20,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#B0,#00,#10,#02,#30,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#B0,#00,#10,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#B0,#00,#10,#02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#B0,#00,#10,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #B0,#00,#10,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#10,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00
    DB #10,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10
    DB #02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02
    DB #B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#C0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#D0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#E0,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#10,#02,#F0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0
; Room 11 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_11:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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


; Sprite 0 line color table (mode 2): configured player sprite "demon1 2"
bitmap_room_sprite_colors:
    DB #0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0B
    DB #4D,#0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#4D,#4D,#4D,#0D,#4D,#4D
    DB #0B,#0B,#0B,#0B,#0B,#0B,#0D,#0B,#0B,#0B,#0B,#0D,#0D,#0D,#0D,#0B
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0F

bitmap_room_sprite_colors_end:

; SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing
bitmap_room_sprite_attrs:
    DB #60,#80,#00,#00,#60,#80,#04,#00,#70,#80,#08,#00,#70,#80,#0C,#00
    DB #D8,#00,#00,#00

bitmap_room_sprite_attrs_end:

; Sprite 0 pattern (16x16, mode 2 quadrants): configured player sprite "demon1 2"
bitmap_room_sprite_patterns:
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


    ds #C000 - $, #FF
; --- SCREEN 5 bitmap-room Konami MegaROM data banks ---
BITMAP_ROOM_DATA_BANK_4_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_4_ROM_START:
; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE; VRAM #00000, raw 2560 bytes, RLE 66 bytes
bitmap_room_hud_seed_p0_rle_chunk_0:
    DB #FF,#11,#FF,#11,#77,#11,#01,#BB,#7E,#11,#01,#1B,#01,#BB,#01,#B1
    DB #7D,#11,#02,#BB,#01,#FB,#7D,#11,#01,#BB,#01,#BD,#01,#DF,#7D,#11
    DB #02,#BB,#01,#DD,#7D,#11,#03,#BB,#7D,#11,#03,#BB,#7D,#11,#01,#1B
    DB #01,#BB,#01,#B1,#7E,#11,#01,#BB,#FF,#11,#FF,#11,#FF,#11,#0D,#11
    DB #80,#FF
bitmap_room_hud_seed_p0_rle_chunk_0_end:

; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE; VRAM #08000, raw 2560 bytes, RLE 66 bytes
bitmap_room_hud_seed_p1_rle_chunk_0:
    DB #FF,#11,#FF,#11,#77,#11,#01,#BB,#7E,#11,#01,#1B,#01,#BB,#01,#B1
    DB #7D,#11,#02,#BB,#01,#FB,#7D,#11,#01,#BB,#01,#BD,#01,#DF,#7D,#11
    DB #02,#BB,#01,#DD,#7D,#11,#03,#BB,#7D,#11,#03,#BB,#7D,#11,#01,#1B
    DB #01,#BB,#01,#B1,#7E,#11,#01,#BB,#FF,#11,#FF,#11,#FF,#11,#0D,#11
    DB #80,#FF
bitmap_room_hud_seed_p1_rle_chunk_0_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #10000, raw 16384 bytes, RLE 7258 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #01,#00,#01,#24,#04,#44,#01,#42,#01,#50,#08,#00,#01,#55,#01,#EE
    DB #01,#55,#01,#EE,#01,#E1,#01,#F0,#04,#00,#01,#08,#02,#5E,#01,#5F
    DB #01,#EE,#01,#5F,#01,#55,#01,#58,#01,#55,#01,#88,#01,#86,#01,#F0
    DB #04,#00,#01,#0F,#02,#5E,#01,#E8,#01,#EE,#01,#58,#01,#55,#01,#5F
    DB #01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F,#01,#11,#01,#1E
    DB #01,#EF,#01,#EE,#01,#1F,#04,#11,#01,#F1,#02,#18,#01,#11,#01,#18
    DB #01,#81,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#02,#00
    DB #01,#0F,#01,#2F,#01,#06,#01,#2F,#09,#00,#01,#0F,#01,#F0,#07,#00
    DB #01,#06,#01,#22,#01,#55,#01,#54,#01,#05,#01,#55,#01,#04,#01,#34
    DB #01,#43,#02,#55,#01,#44,#01,#55,#01,#62,#01,#22,#01,#00,#03,#66
    DB #01,#76,#04,#66,#01,#02,#01,#24,#05,#44,#01,#25,#01,#02,#05,#22
    DB #01,#02,#01,#22,#01,#55,#01,#EE,#01,#55,#01,#EE,#01,#E1,#01,#F0
    DB #04,#00,#01,#08,#02,#5E,#01,#EF,#01,#EE,#01,#5F,#01,#55,#01,#58
    DB #01,#55,#01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F,#02,#5E,#01,#E8
    DB #01,#EE,#01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0
    DB #04,#00,#01,#0F,#02,#1E,#01,#EF,#01,#EE,#01,#1F,#06,#55,#01,#88
    DB #01,#8F,#01,#F5,#01,#5E,#02,#E5,#01,#EE,#03,#55,#02,#00,#01,#06
    DB #02,#66,#01,#60,#09,#00,#01,#06,#01,#26,#08,#00,#01,#66,#01,#54
    DB #01,#44,#01,#50,#01,#55,#01,#54,#01,#34,#01,#43,#01,#45,#01,#54
    DB #01,#64,#01,#45,#01,#52,#01,#60,#01,#00,#03,#66,#02,#77,#01,#76
    DB #02,#66,#01,#22,#06,#44,#06,#22,#02,#42,#01,#22,#01,#55,#01,#EE
    DB #01,#55,#01,#EE,#01,#E1,#01,#F0,#04,#00,#01,#08,#01,#55,#01,#5E
    DB #01,#EF,#01,#EE,#01,#5F,#01,#55,#01,#58,#01,#55,#01,#88,#01,#86
    DB #01,#F0,#04,#00,#01,#0F,#02,#5E,#01,#E8,#01,#EE,#01,#58,#01,#55
    DB #01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F,#02,#1E
    DB #01,#EF,#01,#E1,#01,#1F,#05,#55,#01,#58,#01,#88,#01,#8F,#01,#F5
    DB #02,#55,#01,#EE,#04,#55,#02,#00,#01,#06,#01,#67,#01,#77,#01,#60
    DB #05,#00,#01,#06,#01,#60,#01,#00,#01,#06,#01,#66,#01,#26,#08,#00
    DB #01,#06,#01,#54,#01,#44,#01,#45,#01,#55,#01,#54,#01,#34,#01,#44
    DB #01,#40,#01,#56,#01,#44,#01,#45,#01,#52,#01,#30,#01,#00,#03,#66
    DB #01,#6F,#04,#66,#01,#24,#06,#44,#02,#22,#01,#24,#02,#44,#01,#24
    DB #01,#44,#01,#22,#01,#44,#01,#55,#01,#EE,#01,#55,#01,#EE,#01,#E1
    DB #01,#F0,#04,#00,#01,#08,#01,#55,#01,#5E,#01,#EF,#01,#EE,#01,#5F
    DB #01,#55,#01,#58,#01,#55,#01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F
    DB #02,#5E,#01,#E8,#01,#E5,#01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF
    DB #01,#F1,#01,#F0,#04,#00,#01,#0F,#01,#11,#01,#1E,#01,#EF,#01,#EE
    DB #01,#1F,#05,#55,#01,#58,#01,#88,#01,#8F,#01,#F5,#01,#5E,#01,#EE
    DB #01,#E5,#04,#55,#01,#00,#01,#F0,#02,#66,#01,#67,#01,#77,#01,#20
    DB #03,#00,#01,#06,#01,#62,#01,#20,#01,#30,#01,#02,#02,#66,#01,#20
    DB #01,#00,#01,#03,#01,#60,#05,#00,#01,#45,#01,#44,#01,#45,#01,#55
    DB #01,#54,#01,#34,#01,#44,#01,#40,#01,#55,#01,#44,#01,#55,#01,#33
    DB #02,#00,#03,#66,#01,#FF,#04,#66,#01,#44,#01,#42,#04,#22,#01,#24
    DB #02,#22,#01,#42,#03,#44,#01,#42,#01,#24,#01,#44,#02,#55,#01,#5E
    DB #01,#EE,#01,#E1,#01,#F0,#04,#00,#01,#68,#01,#F5,#05,#55,#01,#58
    DB #01,#55,#01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F,#02,#5E,#01,#58
    DB #01,#EE,#01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0
    DB #04,#00,#01,#0F,#02,#1E,#01,#EF,#01,#EE,#01,#1F,#04,#88,#01,#81
    DB #02,#11,#01,#1F,#01,#11,#02,#88,#01,#81,#04,#88,#01,#00,#01,#02
    DB #01,#76,#02,#66,#01,#77,#01,#60,#03,#00,#01,#22,#01,#62,#01,#66
    DB #01,#20,#01,#02,#02,#22,#01,#20,#01,#00,#01,#06,#01,#20,#03,#00
    DB #01,#44,#01,#40,#01,#64,#01,#54,#01,#45,#01,#55,#01,#04,#01,#34
    DB #01,#44,#01,#40,#01,#54,#01,#45,#01,#54,#03,#00,#03,#66,#01,#F6
    DB #04,#66,#01,#22,#01,#25,#04,#55,#01,#22,#01,#55,#01,#22,#07,#44
    DB #05,#EE,#01,#E1,#04,#00,#01,#F5,#01,#5F,#04,#FF,#01,#55,#01,#58
    DB #01,#55,#01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E
    DB #01,#E8,#01,#EE,#01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1
    DB #01,#F0,#04,#00,#01,#0F,#02,#1E,#01,#EF,#01,#EE,#01,#1F,#03,#88
    DB #01,#81,#02,#11,#01,#1F,#01,#F0,#01,#0F,#01,#F1,#01,#11,#05,#88
    DB #01,#00,#01,#06,#03,#66,#01,#77,#01,#70,#03,#00,#01,#22,#01,#26
    DB #01,#22,#01,#20,#01,#04,#01,#25,#01,#02,#01,#50,#01,#00,#01,#66
    DB #01,#20,#03,#00,#01,#54,#01,#44,#04,#55,#01,#54,#01,#34,#01,#44
    DB #01,#45,#03,#55,#01,#43,#01,#44,#01,#30,#02,#66,#01,#FF,#05,#66
    DB #07,#55,#01,#53,#01,#22,#07,#44,#01,#55,#01,#5E,#02,#EE,#01,#11
    DB #01,#1F,#04,#00,#01,#6F,#01,#F5,#05,#55,#01,#58,#01,#55,#01,#88
    DB #01,#86,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E,#01,#E8,#01,#EE
    DB #01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00
    DB #01,#0F,#01,#11,#01,#1E,#01,#EF,#01,#EE,#01,#1F,#02,#55,#01,#58
    DB #03,#88,#01,#11,#02,#00,#01,#F1,#01,#88,#01,#55,#02,#EE,#01,#5E
    DB #01,#55,#01,#06,#04,#66,#01,#77,#01,#76,#03,#00,#02,#22,#01,#24
    DB #01,#60,#01,#00,#01,#54,#01,#56,#01,#00,#01,#66,#02,#62,#01,#60
    DB #02,#00,#01,#04,#01,#44,#01,#34,#01,#44,#01,#45,#01,#55,#01,#54
    DB #01,#34,#01,#44,#01,#40,#02,#55,#01,#54,#01,#44,#01,#45,#01,#56
    DB #02,#66,#01,#FF,#05,#66,#07,#55,#01,#53,#01,#22,#03,#44,#01,#64
    DB #03,#44,#03,#EE,#01,#E1,#01,#11,#01,#1F,#01,#10,#02,#00,#01,#06
    DB #01,#66,#05,#FF,#01,#55,#01,#58,#01,#55,#01,#88,#01,#86,#01,#F0
    DB #04,#00,#01,#0F,#02,#5E,#01,#58,#01,#EE,#01,#58,#01,#55,#01,#5F
    DB #01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F,#01,#11,#01,#1E
    DB #01,#1F,#01,#EE,#01,#1F,#01,#58,#03,#88,#02,#11,#01,#F0,#02,#00
    DB #01,#01,#01,#18,#01,#88,#04,#55,#01,#66,#01,#67,#01,#77,#01,#66
    DB #01,#76,#01,#77,#01,#70,#03,#00,#01,#66,#01,#25,#01,#54,#01,#00
    DB #01,#04,#01,#43,#01,#55,#01,#40,#01,#62,#01,#26,#01,#22,#01,#60
    DB #03,#00,#01,#04,#01,#55,#01,#43,#01,#34,#01,#50,#01,#04,#01,#44
    DB #01,#54,#01,#50,#01,#55,#01,#53,#01,#34,#01,#45,#01,#44,#01,#46
    DB #08,#66,#07,#55,#01,#53,#08,#44,#04,#55,#02,#EE,#01,#1F,#02,#00
    DB #01,#8F,#01,#EE,#01,#E0,#01,#EE,#01,#5E,#01,#EE,#01,#E5,#01,#55
    DB #01,#58,#01,#55,#01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F,#01,#55
    DB #01,#5E,#01,#58,#01,#EE,#01,#58,#01,#55,#01,#FF,#01,#55,#01,#FF
    DB #01,#F1,#01,#F0,#04,#00,#01,#0F,#01,#11,#01,#1E,#01,#EF,#01,#EE
    DB #01,#1F,#02,#88,#01,#81,#02,#11,#01,#F1,#04,#00,#01,#F1,#01,#88
    DB #01,#81,#02,#11,#01,#88,#01,#66,#01,#76,#01,#77,#01,#76,#02,#77
    DB #01,#76,#01,#F0,#03,#00,#01,#54,#01,#34,#01,#56,#01,#05,#01,#43
    DB #01,#55,#01,#40,#01,#66,#01,#55,#01,#25,#01,#60,#04,#00,#01,#45
    DB #01,#44,#01,#33,#01,#44,#01,#55,#01,#45,#01,#54,#01,#00,#01,#54
    DB #01,#34,#01,#45,#01,#54,#02,#00,#02,#66,#01,#06,#05,#66,#01,#55
    DB #01,#25,#04,#55,#01,#52,#01,#53,#01,#24,#07,#44,#01,#5E,#01,#55
    DB #01,#5E,#03,#EE,#01,#1F,#02,#00,#01,#8F,#07,#55,#01,#58,#01,#55
    DB #01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E,#01,#58
    DB #01,#EE,#01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0
    DB #04,#00,#01,#0F,#01,#11,#01,#1E,#01,#EF,#01,#EE,#01,#1F,#01,#88
    DB #01,#81,#02,#11,#01,#1F,#01,#F1,#04,#00,#01,#11,#01,#18,#01,#81
    DB #01,#11,#02,#88,#01,#07,#02,#66,#01,#67,#01,#77,#01,#66,#01,#77
    DB #01,#60,#03,#00,#01,#44,#01,#34,#01,#54,#01,#05,#01,#44,#01,#45
    DB #01,#40,#01,#44,#01,#45,#01,#36,#04,#00,#01,#46,#01,#34,#02,#55
    DB #01,#43,#02,#45,#01,#55,#01,#05,#01,#44,#01,#45,#01,#54,#03,#00
    DB #02,#66,#01,#77,#01,#76,#04,#66,#01,#52,#01,#22,#02,#55,#01,#52
    DB #02,#22,#01,#20,#01,#22,#01,#24,#06,#44,#07,#11,#01,#10,#01,#08
    DB #01,#88,#06,#66,#01,#55,#01,#58,#01,#55,#01,#88,#01,#86,#01,#F0
    DB #04,#00,#01,#0F,#02,#5E,#01,#58,#01,#E5,#01,#58,#01,#55,#01,#5F
    DB #01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F,#02,#1E,#01,#EF
    DB #01,#EE,#01,#1F,#01,#88,#01,#81,#01,#88,#02,#11,#01,#F0,#04,#00
    DB #01,#0F,#01,#85,#01,#88,#01,#58,#01,#85,#01,#88,#01,#77,#01,#66
    DB #02,#67,#01,#76,#01,#66,#01,#67,#01,#76,#02,#00,#01,#06,#01,#54
    DB #01,#34,#01,#55,#01,#45,#01,#44,#01,#35,#01,#44,#01,#53,#01,#45
    DB #01,#40,#03,#00,#01,#06,#01,#55,#01,#45,#02,#55,#02,#44,#02,#55
    DB #01,#53,#01,#45,#01,#50,#02,#45,#02,#00,#01,#66,#02,#77,#01,#76
    DB #01,#67,#03,#66,#07,#22,#01,#20,#01,#22,#07,#44,#06,#55,#01,#5E
    DB #01,#F0,#01,#8F,#06,#55,#01,#E5,#01,#55,#01,#58,#01,#55,#01,#88
    DB #01,#86,#01,#F0,#04,#00,#01,#0F,#02,#5E,#01,#58,#01,#EE,#01,#58
    DB #01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F
    DB #02,#1E,#01,#EF,#01,#EE,#01,#1F,#01,#85,#01,#88,#01,#85,#01,#88
    DB #01,#81,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#85,#01,#E8,#01,#55
    DB #01,#58,#01,#07,#01,#66,#01,#67,#01,#77,#01,#76,#01,#66,#01,#67
    DB #01,#77,#03,#00,#01,#65,#01,#34,#01,#45,#01,#44,#01,#64,#01,#35
    DB #01,#65,#01,#34,#01,#45,#01,#50,#03,#00,#01,#35,#03,#44,#01,#55
    DB #01,#54,#01,#44,#02,#55,#01,#45,#02,#55,#01,#44,#01,#45,#01,#43
    DB #01,#00,#02,#77,#01,#66,#01,#67,#01,#77,#01,#76,#02,#66,#01,#52
    DB #06,#22,#01,#20,#04,#44,#01,#46,#01,#44,#01,#46,#01,#44,#04,#55
    DB #01,#5E,#02,#EE,#01,#F0,#01,#8F,#08,#55,#01,#58,#01,#55,#01,#88
    DB #01,#86,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E,#01,#58,#01,#EE
    DB #01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00
    DB #01,#0F,#01,#11,#01,#1E,#01,#EF,#01,#EE,#01,#1F,#01,#55,#01,#58
    DB #01,#55,#01,#88,#01,#81,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E
    DB #01,#E8,#01,#EE,#01,#58,#03,#67,#01,#77,#01,#76,#01,#66,#01,#77
    DB #01,#72,#03,#00,#01,#45,#01,#44,#01,#45,#01,#55,#01,#34,#01,#35
    DB #01,#55,#01,#44,#01,#55,#01,#40,#03,#00,#01,#04,#01,#30,#04,#55
    DB #01,#54,#01,#55,#01,#54,#02,#55,#01,#54,#01,#55,#01,#44,#01,#53
    DB #01,#00,#02,#77,#02,#66,#01,#76,#01,#67,#02,#77,#01,#05,#01,#52
    DB #05,#22,#01,#50,#01,#44,#07,#66,#05,#55,#02,#EE,#01,#F0,#01,#8F
    DB #08,#55,#01,#88,#01,#55,#01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F
    DB #01,#55,#01,#5E,#01,#58,#01,#EE,#01,#58,#01,#55,#01,#5F,#01,#55
    DB #01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F,#01,#11,#01,#1E,#01,#EF
    DB #01,#EE,#01,#1F,#01,#55,#01,#58,#01,#55,#01,#88,#01,#81,#01,#F0
    DB #04,#00,#01,#0F,#01,#55,#01,#5E,#01,#E8,#01,#EE,#01,#58,#01,#06
    DB #03,#77,#01,#07,#02,#77,#01,#60,#01,#00,#01,#66,#01,#60,#01,#64
    DB #01,#54,#01,#44,#01,#54,#02,#34,#01,#05,#01,#45,#01,#55,#01,#00
    DB #01,#06,#05,#00,#01,#65,#04,#55,#01,#05,#01,#50,#02,#55,#01,#44
    DB #03,#00,#08,#77,#01,#00,#01,#05,#04,#22,#01,#25,#01,#00,#01,#06
    DB #07,#66,#01,#55,#01,#5E,#01,#E5,#01,#55,#01,#5E,#02,#EE,#01,#F0
    DB #01,#8F,#02,#55,#01,#F5,#05,#55,#01,#58,#01,#55,#01,#88,#01,#86
    DB #01,#F0,#04,#00,#01,#0F,#02,#5E,#01,#58,#01,#EE,#01,#58,#01,#55
    DB #01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00,#01,#0F,#01,#11
    DB #01,#1E,#01,#EF,#01,#EE,#01,#1F,#01,#55,#01,#58,#01,#55,#01,#88
    DB #01,#81,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E,#01,#E8,#01,#EE
    DB #01,#58,#01,#06,#06,#77,#01,#66,#01,#02,#01,#66,#01,#24,#01,#06
    DB #02,#44,#01,#54,#01,#34,#01,#43,#01,#05,#01,#45,#01,#54,#01,#32
    DB #01,#62,#01,#60,#03,#00,#01,#04,#01,#64,#01,#44,#01,#45,#01,#05
    DB #01,#50,#01,#05,#01,#00,#01,#55,#01,#44,#01,#66,#01,#30,#02,#00
    DB #01,#70,#03,#77,#01,#70,#03,#77,#02,#00,#01,#52,#03,#22,#01,#20
    DB #09,#00,#07,#11,#01,#F0,#01,#86,#07,#66,#01,#55,#01,#58,#01,#55
    DB #01,#88,#01,#86,#01,#F0,#04,#00,#01,#0F,#02,#5E,#01,#E8,#01,#EE
    DB #01,#58,#01,#55,#01,#5F,#01,#55,#01,#FF,#01,#F1,#01,#F0,#04,#00
    DB #01,#0F,#02,#1E,#01,#EF,#01,#EE,#01,#1F,#01,#55,#01,#58,#01,#55
    DB #01,#88,#01,#81,#01,#F0,#04,#00,#01,#0F,#01,#55,#01,#5E,#01,#E8
    DB #01,#EE,#01,#58,#01,#02,#01,#66,#01,#77,#02,#66,#01,#77,#01,#66
    DB #01,#60,#01,#02,#01,#26,#01,#24,#01,#00,#01,#34,#01,#45,#01,#04
    DB #01,#34,#01,#43,#02,#55,#01,#50,#01,#32,#02,#26,#03,#00,#01,#04
    DB #01,#46,#01,#66,#01,#34,#01,#50,#01,#05,#01,#55,#01,#46,#01,#44
    DB #01,#66,#01,#36,#0B,#00,#01,#68,#05,#88,#01,#68,#01,#88,#01,#01
    DB #07,#11,#03,#22,#01,#42,#03,#22,#01,#20,#01,#00,#07,#22,#01,#00
    DB #01,#05,#01,#33,#01,#35,#01,#88,#01,#35,#01,#55,#01,#53,#01,#35
    DB #01,#53,#01,#33,#01,#55,#01,#35,#01,#55,#01,#33,#0A,#00,#02,#33
    DB #02,#22,#01,#30,#01,#00,#01,#32,#02,#22,#01,#00,#01,#33,#01,#32
    DB #02,#22,#01,#00,#01,#42,#03,#22,#01,#44,#03,#22,#01,#24,#06,#22
    DB #01,#43,#01,#0F,#01,#FF,#01,#F0,#01,#0F,#01,#FF,#01,#F0,#01,#00
    DB #01,#0F,#20,#00,#01,#88,#07,#77,#02,#01,#01,#F0,#01,#01,#01,#10
    DB #01,#0F,#01,#11,#07,#00,#01,#04,#01,#22,#01,#02,#07,#00,#01,#08
    DB #01,#85,#02,#00,#01,#88,#01,#80,#01,#0F,#02,#00,#01,#08,#01,#80
    DB #03,#00,#01,#38,#01,#80,#01,#66,#05,#EE,#01,#E6,#01,#EE,#01,#02
    DB #01,#23,#01,#32,#02,#22,#01,#44,#04,#22,#01,#44,#01,#33,#01,#32
    DB #02,#22,#01,#20,#01,#42,#03,#22,#01,#44,#03,#22,#01,#44,#01,#42
    DB #02,#22,#01,#42,#02,#22,#01,#43,#01,#06,#05,#EE,#02,#66,#20,#00
    DB #01,#66,#01,#77,#02,#66,#01,#67,#01,#76,#02,#66,#01,#1F,#01,#11
    DB #01,#21,#02,#11,#01,#12,#01,#01,#01,#0F,#01,#00,#01,#04,#01,#00
    DB #01,#40,#02,#00,#01,#44,#01,#23,#01,#24,#01,#00,#01,#40,#02,#00
    DB #01,#04,#01,#00,#01,#04,#01,#53,#05,#00,#01,#0F,#04,#00,#01,#F0
    DB #02,#00,#01,#88,#01,#35,#01,#6E,#06,#66,#01,#E6,#01,#42,#04,#33
    DB #01,#42,#04,#33,#01,#42,#04,#33,#01,#23,#01,#44,#03,#22,#01,#44
    DB #02,#22,#01,#24,#01,#44,#01,#42,#02,#22,#01,#44,#01,#22,#01,#24
    DB #01,#43,#01,#06,#02,#EE,#01,#AE,#02,#EE,#01,#6E,#01,#E6,#20,#00
    DB #01,#86,#01,#66,#01,#86,#02,#66,#01,#68,#02,#66,#01,#12,#01,#11
    DB #01,#21,#01,#1F,#01,#11,#01,#12,#01,#61,#01,#12,#01,#44,#01,#42
    DB #03,#44,#01,#24,#01,#22,#01,#23,#01,#34,#01,#42,#01,#24,#02,#44
    DB #01,#42,#01,#44,#01,#42,#01,#53,#01,#8F,#03,#88,#01,#F0,#01,#F8
    DB #03,#88,#01,#0F,#02,#88,#01,#F8,#01,#88,#01,#55,#08,#66,#01,#42
    DB #01,#32,#04,#22,#01,#32,#08,#22,#01,#23,#01,#44,#01,#42,#01,#24
    DB #02,#44,#01,#42,#01,#22,#08,#44,#01,#43,#01,#06,#02,#66,#01,#6E
    DB #02,#E6,#01,#76,#01,#66,#20,#00,#01,#66,#01,#76,#06,#66,#01,#62
    DB #01,#11,#01,#21,#01,#12,#01,#11,#01,#12,#01,#61,#01,#12,#01,#24
    DB #01,#23,#03,#22,#01,#32,#02,#33,#01,#22,#01,#23,#01,#33,#01,#42
    DB #01,#34,#01,#23,#01,#32,#01,#33,#01,#53,#01,#88,#01,#33,#01,#88
    DB #01,#35,#01,#38,#01,#83,#01,#53,#01,#35,#01,#53,#01,#88,#01,#33
    DB #01,#83,#01,#88,#01,#35,#01,#53,#01,#76,#07,#66,#01,#42,#01,#32
    DB #08,#22,#01,#42,#04,#22,#01,#23,#0F,#44,#01,#43,#01,#F6,#02,#77
    DB #01,#66,#01,#67,#01,#66,#01,#77,#01,#66,#20,#00,#01,#67,#07,#66
    DB #01,#62,#01,#11,#01,#21,#01,#12,#01,#11,#01,#12,#01,#61,#01,#12
    DB #01,#22,#01,#32,#03,#22,#01,#32,#01,#23,#01,#33,#02,#23,#01,#22
    DB #01,#23,#01,#22,#01,#32,#01,#22,#01,#32,#01,#05,#01,#83,#01,#53
    DB #01,#33,#01,#53,#01,#33,#01,#85,#01,#33,#01,#53,#01,#33,#01,#88
    DB #01,#55,#01,#35,#01,#33,#01,#55,#01,#50,#01,#76,#07,#66,#01,#42
    DB #01,#32,#01,#33,#02,#22,#01,#42,#04,#22,#01,#42,#04,#22,#01,#23
    DB #05,#22,#01,#44,#04,#22,#01,#44,#04,#22,#01,#23,#01,#B6,#01,#77
    DB #01,#67,#01,#76,#03,#77,#01,#76,#0D,#00,#01,#0B,#02,#BB,#01,#B0
    DB #0F,#00,#01,#67,#01,#76,#06,#66,#01,#62,#01,#11,#01,#21,#01,#12
    DB #01,#11,#01,#12,#01,#61,#01,#12,#06,#22,#01,#23,#01,#32,#07,#22
    DB #01,#24,#01,#05,#01,#83,#07,#33,#01,#88,#03,#33,#01,#35,#01,#53
    DB #01,#50,#08,#66,#01,#42,#01,#32,#01,#33,#02,#22,#01,#42,#04,#22
    DB #01,#42,#04,#22,#01,#23,#01,#42,#04,#22,#01,#42,#04,#22,#01,#42
    DB #04,#22,#01,#23,#01,#F6,#01,#76,#01,#66,#01,#77,#02,#76,#01,#67
    DB #01,#76,#0C,#00,#01,#0A,#01,#AE,#04,#AA,#01,#A0,#0D,#00,#01,#66
    DB #01,#76,#06,#66,#01,#62,#01,#11,#01,#21,#01,#62,#01,#21,#01,#12
    DB #01,#61,#01,#12,#07,#22,#01,#32,#08,#22,#01,#05,#04,#33,#01,#38
    DB #02,#33,#01,#88,#01,#83,#02,#33,#01,#38,#01,#83,#01,#53,#01,#50
    DB #01,#76,#07,#66,#01,#42,#04,#22,#01,#42,#04,#22,#01,#42,#04,#22
    DB #01,#23,#01,#42,#04,#22,#01,#42,#04,#22,#01,#44,#04,#22,#01,#23
    DB #01,#F7,#01,#76,#01,#66,#01,#76,#01,#66,#01,#76,#01,#77,#01,#76
    DB #0C,#00,#06,#AA,#01,#AB,#01,#B0,#0C,#00,#01,#66,#01,#76,#06,#66
    DB #01,#22,#01,#11,#01,#21,#01,#62,#01,#21,#01,#12,#01,#21,#01,#12
    DB #07,#22,#01,#33,#01,#22,#01,#42,#06,#22,#01,#05,#06,#33,#02,#88
    DB #02,#33,#01,#38,#01,#33,#01,#38,#01,#55,#01,#50,#01,#76,#01,#77
    DB #01,#67,#01,#76,#04,#66,#01,#42,#04,#22,#01,#44,#04,#22,#01,#42
    DB #04,#22,#01,#23,#01,#42,#04,#22,#01,#42,#04,#22,#01,#44,#04,#22
    DB #01,#23,#01,#F6,#01,#77,#01,#67,#01,#76,#01,#66,#01,#76,#01,#77
    DB #01,#76,#08,#00,#01,#FA,#01,#EA,#01,#AE,#01,#A4,#01,#EA,#07,#AA
    DB #0C,#00,#01,#66,#01,#76,#05,#66,#01,#86,#01,#22,#01,#11,#01,#21
    DB #01,#62,#01,#21,#01,#22,#01,#21,#01,#12,#07,#22,#01,#33,#01,#22
    DB #01,#42,#03,#22,#01,#24,#01,#42,#01,#22,#01,#05,#01,#38,#01,#33
    DB #01,#38,#02,#33,#01,#58,#01,#83,#06,#33,#01,#55,#01,#30,#02,#66
    DB #01,#77,#01,#76,#02,#66,#01,#67,#01,#66,#01,#44,#04,#22,#01,#44
    DB #01,#22,#01,#42,#01,#22,#02,#44,#04,#22,#01,#23,#01,#44,#04,#22
    DB #01,#42,#02,#22,#01,#24,#01,#22,#01,#44,#04,#22,#01,#23,#01,#F7
    DB #01,#67,#01,#77,#03,#66,#01,#77,#01,#76,#07,#00,#01,#0B,#02,#EA
    DB #01,#AA,#01,#A4,#01,#44,#04,#AA,#01,#AE,#01,#AA,#01,#AE,#0C,#00
    DB #01,#66,#01,#76,#06,#66,#02,#22,#01,#21,#01,#62,#01,#21,#01,#22
    DB #01,#21,#01,#62,#06,#22,#01,#23,#01,#34,#08,#22,#01,#03,#01,#38
    DB #01,#33,#01,#88,#04,#33,#01,#38,#05,#33,#01,#55,#01,#30,#02,#76
    DB #01,#67,#01,#77,#01,#76,#01,#66,#01,#77,#01,#66,#01,#24,#01,#44
    DB #01,#22,#01,#24,#04,#44,#01,#24,#02,#44,#02,#42,#01,#24,#01,#44
    DB #01,#43,#01,#44,#04,#22,#01,#42,#01,#22,#02,#44,#01,#22,#01,#44
    DB #04,#22,#01,#23,#01,#F6,#01,#67,#01,#77,#01,#66,#01,#67,#02,#77
    DB #01,#66,#07,#00,#01,#BE,#04,#AA,#01,#AE,#01,#A4,#03,#EE,#01,#E4
    DB #01,#44,#01,#EB,#01,#00,#02,#AA,#01,#AE,#01,#B0,#07,#00,#01,#76
    DB #02,#77,#02,#66,#02,#77,#01,#67,#02,#22,#01,#21,#03,#22,#01,#21
    DB #01,#62,#01,#24,#05,#22,#01,#23,#01,#30,#01,#22,#01,#42,#06,#22
    DB #01,#05,#01,#88,#03,#33,#01,#38,#01,#33,#01,#35,#06,#33,#01,#53
    DB #01,#50,#01,#07,#07,#77,#01,#02,#01,#22,#01,#42,#02,#44,#01,#42
    DB #04,#44,#02,#22,#01,#44,#01,#22,#01,#24,#01,#20,#01,#44,#01,#24
    DB #03,#22,#01,#44,#01,#24,#02,#44,#01,#24,#03,#44,#02,#22,#01,#23
    DB #01,#F6,#01,#77,#01,#66,#01,#67,#01,#77,#01,#76,#01,#67,#01,#77
    DB #07,#00,#01,#E4,#01,#EE,#03,#AA,#02,#AE,#02,#EA,#01,#AA,#01,#44
    DB #01,#64,#01,#4E,#01,#BA,#04,#AA,#01,#A0,#06,#00,#08,#66,#07,#22
    DB #01,#62,#01,#24,#05,#22,#01,#23,#01,#30,#01,#22,#01,#42,#01,#22
    DB #01,#24,#04,#22,#01,#05,#01,#88,#01,#33,#01,#35,#01,#33,#01,#38
    DB #01,#83,#05,#33,#02,#38,#01,#53,#01,#50,#01,#00,#05,#66,#01,#60
    DB #01,#06,#01,#22,#02,#33,#01,#22,#01,#44,#01,#23,#01,#33,#01,#22
    DB #01,#24,#01,#43,#02,#33,#01,#32,#01,#33,#01,#32,#01,#23,#01,#44
    DB #01,#24,#02,#22,#08,#44,#01,#42,#01,#22,#01,#44,#01,#23,#01,#F7
    DB #01,#77,#01,#76,#01,#77,#01,#66,#02,#77,#01,#76,#05,#00,#01,#0B
    DB #01,#B0,#01,#EE,#02,#44,#01,#4E,#01,#EA,#01,#AA,#01,#EE,#01,#AA
    DB #01,#EA,#01,#AA,#03,#EE,#01,#A4,#05,#AA,#06,#00,#01,#66,#03,#88
    DB #01,#86,#02,#88,#01,#86,#0E,#22,#01,#23,#01,#30,#01,#22,#01,#42
    DB #01,#23,#05,#22,#01,#05,#01,#83,#01,#33,#01,#53,#01,#88,#01,#83
    DB #02,#33,#01,#35,#04,#33,#01,#38,#01,#33,#01,#50,#01,#0E,#03,#EE
    DB #02,#E6,#01,#EE,#01,#6E,#01,#42,#01,#32,#02,#22,#01,#24,#02,#22
    DB #01,#23,#01,#24,#01,#23,#01,#22,#01,#32,#03,#22,#01,#43,#0F,#44
    DB #01,#23,#01,#F6,#05,#77,#01,#67,#01,#66,#04,#00,#01,#0E,#01,#EB
    DB #01,#AE,#01,#AA,#01,#E4,#02,#44,#01,#4A,#01,#AA,#01,#E4,#02,#44
    DB #01,#E4,#01,#4A,#02,#AA,#01,#AE,#01,#44,#03,#AA,#01,#EA,#01,#B0
    DB #05,#00,#01,#66,#06,#77,#01,#78,#09,#22,#01,#23,#02,#22,#01,#32
    DB #01,#22,#01,#23,#01,#30,#02,#22,#01,#23,#05,#22,#01,#03,#02,#33
    DB #01,#53,#01,#33,#01,#35,#01,#53,#01,#55,#01,#35,#01,#53,#01,#33
    DB #01,#55,#02,#33,#01,#53,#01,#30,#01,#6E,#01,#E6,#02,#66,#01,#67
    DB #01,#66,#01,#77,#01,#66,#01,#42,#01,#32,#02,#22,#01,#24,#03,#22
    DB #01,#24,#06,#22,#01,#43,#01,#02,#05,#44,#01,#42,#01,#22,#01,#24
    DB #06,#44,#01,#20,#01,#F7,#01,#77,#01,#67,#01,#77,#01,#76,#02,#77
    DB #01,#76,#03,#00,#01,#BA,#02,#AA,#01,#EE,#01,#E4,#01,#EA,#01,#EE
    DB #02,#AA,#01,#A4,#01,#46,#02,#66,#01,#46,#01,#4E,#02,#EA,#01,#AA
    DB #01,#4E,#01,#4A,#01,#4E,#01,#4A,#01,#64,#01,#EB,#05,#00,#01,#66
    DB #01,#77,#02,#66,#01,#76,#01,#66,#01,#77,#01,#66,#08,#22,#02,#33
    DB #01,#32,#04,#33,#01,#20,#01,#02,#01,#33,#01,#34,#05,#33,#01,#00
    DB #01,#85,#01,#35,#01,#88,#01,#35,#01,#53,#01,#38,#03,#88,#01,#55
    DB #01,#58,#01,#85,#01,#55,#01,#58,#01,#00,#01,#6E,#05,#66,#01,#67
    DB #01,#66,#01,#42,#03,#22,#01,#24,#03,#22,#01,#24,#06,#22,#01,#43
    DB #06,#00,#01,#F3,#01,#33,#01,#3F,#07,#00,#01,#06,#01,#66,#01,#6E
    DB #01,#E6,#01,#66,#01,#EE,#02,#66,#03,#00,#01,#EA,#02,#AA,#01,#A4
    DB #01,#46,#01,#AA,#01,#EA,#01,#AA,#01,#4E,#01,#44,#01,#66,#01,#76
    DB #01,#A4,#01,#66,#01,#64,#02,#44,#01,#AA,#01,#E4,#01,#44,#01,#46
    DB #02,#66,#01,#E0,#07,#00,#02,#AE,#02,#AA,#01,#E4,#01,#4A,#01,#AA
    DB #01,#A4,#01,#44,#01,#66,#01,#46,#01,#44,#01,#EE,#01,#AA,#01,#A4
    DB #02,#66,#01,#EA,#02,#AA,#01,#E6,#02,#66,#01,#6E,#01,#80,#01,#AA
    DB #0D,#00,#01,#E6,#02,#66,#01,#0E,#01,#66,#01,#77,#01,#EE,#01,#67
    DB #01,#66,#01,#E0,#01,#00,#01,#66,#01,#EF,#0B,#00,#01,#04,#01,#44
    DB #01,#64,#04,#66,#01,#44,#01,#48,#01,#00,#01,#67,#01,#76,#02,#66
    DB #01,#0F,#01,#76,#01,#66,#01,#E0,#01,#06,#02,#66,#01,#67,#01,#77
    DB #01,#67,#01,#76,#01,#67,#01,#66,#01,#46,#01,#64,#01,#4E,#02,#00
    DB #0A,#33,#01,#83,#03,#33,#01,#30,#02,#00,#01,#0F,#01,#BF,#01,#0E
    DB #01,#BF,#0B,#00,#01,#0E,#01,#E4,#01,#44,#02,#EE,#01,#AA,#01,#A4
    DB #01,#44,#01,#46,#01,#44,#01,#66,#01,#64,#05,#AA,#01,#46,#01,#E4
    DB #01,#44,#01,#AA,#01,#AE,#01,#EA,#01,#E6,#01,#4E,#02,#EA,#01,#AB
    DB #0C,#00,#01,#0E,#01,#76,#01,#66,#01,#00,#01,#E7,#01,#66,#01,#00
    DB #01,#86,#01,#66,#01,#E0,#01,#0E,#01,#66,#01,#60,#0B,#00,#01,#0E
    DB #01,#44,#01,#66,#01,#77,#01,#E6,#01,#60,#01,#E6,#01,#46,#01,#EF
    DB #01,#0B,#01,#77,#01,#76,#02,#66,#01,#0F,#01,#76,#01,#66,#01,#6E
    DB #01,#00,#01,#04,#01,#66,#01,#77,#01,#66,#01,#E7,#01,#66,#02,#77
    DB #01,#67,#01,#77,#01,#4E,#01,#00,#01,#03,#0D,#00,#01,#08,#01,#33
    DB #02,#00,#01,#0E,#02,#EE,#01,#E0,#0B,#00,#01,#0B,#01,#E4,#01,#46
    DB #01,#64,#01,#EA,#01,#E4,#01,#4E,#02,#46,#01,#76,#01,#6E,#04,#AA
    DB #01,#EA,#01,#AA,#01,#AE,#01,#66,#01,#64,#02,#EE,#01,#AE,#01,#A4
    DB #01,#AA,#01,#A4,#01,#EA,#01,#AA,#01,#A0,#09,#00,#01,#06,#01,#6E
    DB #01,#06,#01,#66,#01,#60,#01,#00,#01,#B6,#01,#66,#01,#00,#01,#0E
    DB #01,#76,#01,#6E,#02,#66,#01,#60,#0C,#00,#01,#04,#02,#66,#01,#EE
    DB #02,#6E,#02,#00,#01,#08,#01,#77,#01,#76,#02,#66,#01,#EF,#01,#76
    DB #01,#66,#01,#68,#01,#00,#01,#0E,#01,#66,#01,#E7,#01,#68,#01,#76
    DB #02,#66,#01,#77,#01,#64,#01,#8E,#01,#E0,#01,#00,#01,#38,#01,#00
    DB #01,#80,#02,#00,#01,#08,#01,#00,#01,#08,#01,#00,#01,#08,#01,#00
    DB #01,#80,#02,#00,#01,#88,#01,#35,#02,#00,#01,#0E,#01,#E7,#01,#77
    DB #01,#E0,#0B,#00,#01,#FE,#01,#AE,#01,#44,#01,#4E,#02,#AA,#01,#44
    DB #01,#66,#01,#67,#01,#7E,#01,#AE,#01,#AA,#01,#EA,#01,#AA,#01,#EA
    DB #01,#AA,#01,#A4,#01,#6E,#01,#67,#01,#66,#01,#44,#01,#46,#01,#44
    DB #01,#66,#01,#EA,#01,#AA,#01,#AE,#01,#EE,#01,#EB,#09,#00,#01,#06
    DB #01,#7E,#01,#E6,#01,#66,#01,#E0,#01,#00,#01,#06,#01,#66,#01,#E0
    DB #01,#0E,#03,#66,#01,#7E,#0D,#00,#01,#06,#01,#66,#01,#A6,#01,#66
    DB #01,#76,#01,#60,#02,#00,#01,#06,#01,#67,#01,#76,#02,#66,#01,#E0
    DB #01,#67,#02,#66,#01,#00,#01,#0B,#01,#EE,#01,#06,#02,#76,#01,#6B
    DB #01,#E7,#01,#E6,#01,#66,#01,#E0,#02,#00,#01,#58,#01,#83,#01,#38
    DB #02,#88,#01,#83,#01,#88,#01,#83,#01,#88,#01,#83,#03,#88,#01,#38
    DB #01,#33,#01,#35,#01,#00,#01,#F0,#02,#EE,#01,#E7,#01,#77,#01,#B0
    DB #09,#00,#01,#0B,#01,#EE,#01,#EA,#01,#AA,#01,#AE,#01,#64,#01,#E4
    DB #01,#46,#01,#67,#01,#77,#01,#EE,#01,#AE,#02,#EE,#01,#AE,#01,#64
    DB #01,#AA,#01,#EE,#01,#E4,#01,#67,#01,#77,#03,#66,#01,#64,#01,#4E
    DB #01,#E4,#01,#EA,#01,#AE,#01,#EA,#0A,#00,#02,#66,#01,#6E,#01,#F0
    DB #01,#00,#01,#06,#01,#66,#01,#E0,#01,#0F,#01,#67,#02,#66,#01,#E0
    DB #0E,#00,#01,#0F,#01,#00,#01,#BE,#01,#66,#01,#6E,#01,#FB,#01,#0E
    DB #01,#66,#01,#67,#01,#76,#01,#67,#01,#66,#01,#6E,#01,#67,#02,#66
    DB #01,#80,#01,#00,#01,#F0,#01,#0E,#01,#66,#01,#67,#01,#E6,#01,#76
    DB #01,#0A,#01,#6E,#03,#00,#01,#33,#01,#35,#01,#55,#01,#83,#01,#58
    DB #01,#35,#01,#53,#01,#55,#01,#38,#01,#35,#03,#33,#01,#53,#02,#55
    DB #01,#00,#01,#0B,#01,#7E,#02,#EE,#01,#77,#01,#E0,#09,#00,#01,#BE
    DB #01,#EE,#01,#AA,#01,#A4,#01,#46,#02,#66,#01,#67,#01,#77,#01,#76
    DB #01,#E4,#01,#4E,#01,#64,#02,#46,#01,#66,#01,#64,#01,#4A,#01,#AE
    DB #01,#46,#04,#77,#01,#76,#01,#66,#01,#4E,#01,#6E,#01,#4A,#01,#AE
    DB #01,#B0,#09,#00,#01,#E6,#01,#76,#01,#68,#02,#00,#01,#E6,#01,#66
    DB #01,#E0,#01,#0F,#01,#E7,#01,#66,#01,#6E,#03,#00,#01,#A4,#01,#E0
    DB #01,#0A,#01,#EE,#0B,#00,#01,#67,#01,#6E,#01,#FB,#01,#06,#01,#76
    DB #01,#67,#01,#7E,#01,#67,#01,#66,#01,#7E,#01,#77,#02,#66,#01,#EF
    DB #01,#B0,#01,#0E,#01,#EE,#01,#66,#02,#67,#01,#68,#01,#00,#01,#E8
    DB #03,#00,#02,#35,#01,#33,#01,#35,#01,#33,#01,#53,#01,#33,#01,#53
    DB #01,#33,#01,#53,#03,#33,#01,#53,#01,#35,#01,#55,#01,#00,#01,#0E
    DB #03,#EE,#01,#77,#01,#70,#09,#00,#01,#EA,#01,#A4,#01,#E4,#01,#46
    DB #01,#67,#01,#66,#03,#77,#01,#76,#01,#64,#03,#66,#01,#76,#03,#66
    DB #01,#44,#01,#66,#05,#77,#01,#67,#01,#66,#01,#46,#01,#44,#02,#EA
    DB #09,#00,#01,#0E,#01,#76,#01,#66,#01,#B0,#01,#0E,#02,#66,#02,#00
    DB #01,#07,#01,#66,#01,#6B,#02,#00,#01,#0E,#02,#EE,#01,#EA,#01,#AA
    DB #01,#E0,#09,#00,#01,#0A,#01,#A6,#01,#76,#01,#AE,#01,#66,#01,#67
    DB #01,#77,#01,#6E,#01,#67,#01,#76,#01,#67,#01,#76,#01,#66,#01,#76
    DB #01,#6E,#01,#E0,#01,#BA,#01,#E6,#02,#76,#01,#BA,#01,#BE,#05,#00
    DB #07,#33,#01,#38,#06,#33,#01,#35,#01,#53,#01,#0E,#04,#EE,#01,#77
    DB #01,#7E,#09,#00,#01,#EE,#02,#46,#01,#66,#06,#77,#02,#76,#01,#67
    DB #04,#77,#02,#66,#01,#77,#01,#76,#01,#66,#01,#67,#03,#77,#01,#76
    DB #01,#67,#02,#64,#01,#4E,#06,#00,#01,#AA,#02,#00,#01,#0E,#01,#76
    DB #01,#66,#01,#EE,#01,#E6,#01,#66,#01,#6E,#02,#00,#01,#06,#01,#66
    DB #01,#6F,#02,#00,#03,#EE,#01,#EA,#01,#AA,#01,#EE,#01,#80,#08,#00
    DB #01,#BA,#01,#E6,#01,#76,#01,#6E,#01,#66,#01,#67,#01,#77,#01,#66
    DB #01,#67,#01,#77,#03,#66,#01,#76,#01,#66,#01,#6B,#01,#EE,#01,#A6
    DB #02,#76,#02,#AE,#05,#00,#0F,#33,#01,#53,#01,#EE,#01,#E7,#01,#77
    DB #01,#EE,#01,#7E,#01,#77,#01,#70,#09,#00,#01,#44,#02,#67,#02,#77
    DB #01,#70,#01,#77,#03,#66,#03,#77,#01,#76,#04,#77,#01,#66,#01,#76
    DB #01,#6E,#01,#EE,#03,#67,#01,#76,#01,#67,#01,#77,#01,#76,#01,#64
    DB #01,#EB,#04,#00,#01,#0B,#01,#BE,#01,#AE,#01,#BA,#01,#E8,#01,#00
    DB #05,#66,#01,#E0,#02,#00,#01,#B7,#01,#66,#01,#6B,#01,#00,#01,#0E
    DB #01,#64,#01,#4A,#01,#EA,#01,#AE,#02,#44,#01,#E0,#07,#00,#01,#BA
    DB #01,#AA,#02,#66,#01,#E6,#02,#67,#02,#66,#01,#67,#01,#76,#01,#77
    DB #01,#66,#02,#67,#02,#66,#01,#64,#03,#66,#01,#44,#01,#4A,#01,#AA
    DB #04,#00,#01,#33,#01,#83,#0D,#33,#01,#55,#01,#EE,#01,#7E,#01,#77
    DB #01,#7E,#02,#77,#01,#7E,#01,#F0,#08,#00,#02,#66,#03,#77,#01,#67
    DB #01,#66,#01,#6E,#01,#67,#01,#7E,#01,#67,#01,#77,#01,#66,#01,#76
    DB #01,#67,#01,#76,#01,#47,#01,#76,#02,#66,#01,#6E,#01,#B0,#01,#E7
    DB #01,#67,#01,#E7,#01,#77,#01,#67,#01,#66,#01,#6E,#01,#EE,#01,#E0
    DB #04,#00,#01,#0A,#01,#EA,#01,#AE,#01,#AA,#01,#EE,#01,#00,#01,#E6
    DB #02,#66,#01,#76,#01,#6E,#03,#00,#01,#E7,#01,#66,#01,#6B,#01,#00
    DB #01,#08,#01,#E6,#04,#44,#01,#4E,#07,#00,#01,#0B,#01,#AE,#01,#E4
    DB #03,#66,#01,#67,#01,#44,#01,#66,#01,#67,#01,#E7,#01,#7E,#01,#67
    DB #01,#66,#01,#76,#01,#A7,#05,#66,#01,#6E,#01,#64,#01,#6E,#01,#EA
    DB #01,#A0,#03,#00,#01,#33,#01,#83,#03,#33,#01,#38,#01,#83,#08,#33
    DB #01,#55,#01,#07,#02,#EE,#01,#E7,#01,#77,#01,#EE,#01,#77,#01,#E0
    DB #08,#00,#01,#88,#01,#BE,#01,#67,#01,#77,#01,#76,#01,#66,#01,#76
    DB #01,#80,#01,#88,#01,#67,#01,#B7,#01,#76,#01,#66,#01,#76,#01,#67
    DB #01,#6B,#01,#E6,#01,#76,#01,#E6,#01,#66,#01,#68,#01,#08,#01,#E7
    DB #01,#6E,#01,#BE,#01,#7E,#02,#66,#01,#80,#06,#00,#01,#EE,#01,#4A
    DB #01,#EA,#01,#AE,#01,#46,#01,#E0,#01,#0E,#01,#67,#02,#66,#01,#7B
    DB #02,#00,#01,#0E,#02,#66,#01,#E0,#01,#00,#01,#EE,#01,#A4,#01,#64
    DB #01,#E4,#01,#AE,#01,#66,#01,#4B,#01,#AE,#01,#A0,#05,#00,#01,#0A
    DB #01,#BE,#02,#EE,#01,#E6,#01,#66,#01,#EA,#01,#66,#02,#76,#02,#E6
    DB #01,#EE,#03,#66,#01,#E6,#01,#66,#01,#76,#01,#AE,#01,#EE,#01,#4E
    DB #02,#EE,#01,#AA,#01,#A0,#03,#00,#0E,#33,#01,#35,#01,#58,#01,#77
    DB #01,#EE,#02,#E7,#01,#7E,#01,#EE,#01,#E7,#01,#7E,#09,#00,#01,#0E
    DB #01,#66,#01,#77,#01,#66,#01,#EE,#01,#76,#01,#E0,#01,#00,#01,#E7
    DB #01,#67,#01,#6E,#01,#EE,#01,#67,#01,#76,#01,#E0,#01,#0E,#01,#66
    DB #01,#67,#01,#E6,#01,#6E,#01,#E6,#01,#76,#01,#E0,#01,#66,#01,#6E
    DB #01,#86,#01,#6E,#07,#00,#01,#AE,#02,#44,#01,#E4,#01,#44,#01,#B0
    DB #01,#00,#01,#E7,#01,#76,#01,#66,#01,#6B,#02,#00,#01,#0E,#01,#76
    DB #01,#66,#01,#B0,#01,#0E,#01,#EE,#01,#E4,#01,#4A,#02,#AA,#01,#E4
    DB #01,#EE,#01,#AE,#01,#E8,#06,#00,#01,#0B,#01,#BE,#01,#EE,#01,#E6
    DB #02,#EE,#01,#6E,#02,#66,#04,#EE,#01,#66,#01,#EE,#01,#EA,#01,#AE
    DB #02,#EE,#01,#AA,#01,#EA,#01,#AA,#01,#EA,#01,#B0,#04,#00,#01,#33
    DB #01,#83,#06,#33,#01,#38,#05,#33,#01,#35,#01,#50,#01,#07,#01,#EE
    DB #01,#E7,#01,#77,#01,#7E,#01,#EE,#01,#E7,#01,#77,#0A,#00,#01,#E6
    DB #01,#6E,#01,#F6,#01,#66,#01,#67,#01,#66,#01,#00,#01,#E7,#01,#76
    DB #01,#E0,#01,#00,#01,#E6,#01,#77,#01,#6E,#01,#0E,#01,#67,#01,#66
    DB #01,#B8,#01,#76,#04,#66,#01,#E0,#01,#0F,#01,#B0,#06,#00,#01,#0B
    DB #01,#AE,#01,#66,#01,#44,#01,#AA,#01,#44,#01,#AA,#01,#B0,#01,#08
    DB #01,#76,#02,#66,#02,#00,#01,#87,#01,#66,#01,#6E,#01,#00,#01,#A4
    DB #01,#4E,#02,#AA,#01,#44,#01,#4A,#01,#A4,#01,#EA,#01,#AE,#01,#4E
    DB #08,#00,#01,#0B,#03,#AA,#01,#BA,#01,#AA,#01,#AF,#01,#BA,#01,#EE
    DB #01,#00,#01,#0B,#01,#EA,#01,#AA,#01,#F0,#01,#AA,#01,#AE,#01,#BA
    DB #01,#AA,#01,#0A,#01,#A0,#06,#00,#01,#33,#01,#83,#01,#33,#01,#38
    DB #04,#33,#01,#38,#05,#33,#01,#35,#01,#50,#03,#E7,#01,#77,#01,#7E
    DB #01,#EE,#01,#77,#01,#7B,#0A,#00,#01,#0E,#01,#EE,#01,#06,#02,#67
    DB #01,#77,#03,#66,#02,#00,#01,#06,#03,#66,#01,#77,#01,#EF,#01,#F0
    DB #01,#67,#03,#66,#01,#6E,#01,#00,#01,#0F,#07,#00,#01,#0E,#01,#AA
    DB #01,#EA,#01,#A4,#01,#AA,#01,#EA,#01,#AA,#01,#E0,#01,#0B,#03,#66
    DB #01,#E0,#01,#00,#01,#87,#01,#66,#01,#7E,#01,#00,#01,#E4,#01,#44
    DB #01,#AE,#01,#4E,#01,#E6,#01,#4E,#01,#A4,#01,#EA,#01,#AA,#01,#EB
    DB #0D,#00,#01,#F0,#05,#00,#02,#BB,#0D,#00,#01,#33,#01,#83,#01,#35
    DB #0B,#33,#01,#35,#01,#50,#01,#0E,#03,#77,#01,#07,#02,#77,#01,#E0
    DB #0D,#00,#01,#E6,#01,#EE,#01,#E7,#01,#77,#01,#76,#01,#66,#01,#80
    DB #01,#00,#01,#E8,#01,#E7,#01,#76,#02,#66,#01,#EF,#01,#00,#01,#E7
    DB #01,#66,#01,#E0,#01,#E6,#01,#E0,#09,#00,#01,#AE,#01,#AA,#01,#AE
    DB #01,#46,#01,#4E,#01,#6A,#01,#AE,#01,#EE,#01,#00,#01,#67,#02,#66
    DB #01,#6B,#01,#00,#02,#66,#01,#60,#01,#0E,#04,#44,#01,#67,#01,#4E
    DB #01,#E6,#01,#EA,#01,#EE,#01,#AE,#01,#A0,#21,#00,#02,#33,#01,#35
    DB #06,#33,#01,#35,#02,#33,#01,#53,#01,#33,#01,#35,#01,#50,#01,#0E
    DB #06,#77,#01,#EE,#0F,#00,#01,#E6,#01,#76,#01,#77,#01,#66,#01,#EE
    DB #01,#0E,#01,#6E,#01,#67,#02,#66,#01,#6E,#02,#00,#01,#86,#01,#66
    DB #0B,#00,#01,#0E,#01,#EE,#02,#44,#01,#77,#01,#66,#01,#64,#01,#44
    DB #01,#6E,#01,#00,#01,#67,#01,#76,#01,#66,#01,#6E,#01,#0F,#01,#76
    DB #01,#66,#01,#E0,#01,#04,#01,#44,#01,#46,#01,#66,#01,#67,#01,#77
    DB #01,#64,#02,#66,#01,#46,#01,#4E,#01,#4B,#21,#00,#01,#03,#01,#55
    DB #01,#58,#07,#55,#01,#53,#04,#55,#01,#30,#01,#0B,#01,#EE,#01,#77
    DB #02,#EE,#01,#77,#01,#EE,#01,#E0,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#30,#00
bitmap_room_tileset_rle_chunk_0_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #14000, raw 16384 bytes, RLE 130 bytes
bitmap_room_tileset_rle_chunk_1:
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #40,#00
bitmap_room_tileset_rle_chunk_1_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #18000, raw 16384 bytes, RLE 130 bytes
bitmap_room_tileset_rle_chunk_2:
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #40,#00
bitmap_room_tileset_rle_chunk_2_end:

; Shared world tileset (atlas), packed 4bpp RLE; VRAM #1C000, raw 16384 bytes, RLE 130 bytes
bitmap_room_tileset_rle_chunk_3:
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #40,#00
bitmap_room_tileset_rle_chunk_3_end:

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

BITMAP_ROOM_DATA_BANK_4_USED_END:
    ds #A000 - $, #FF

BITMAP_ROOM_DATA_BANK_5_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_5_ROM_START:
; Linked HUD dynamic widget #1 (counter) tile/glyph data, packed 4bpp RLE; VRAM #07200, raw 1024 bytes, RLE 452 bytes
bitmap_room_hud_linked_1_rle_chunk_0:
    DB #01,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#02,#11,#02,#FF,#02,#11
    DB #02,#FF,#03,#11,#01,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#11
    DB #01,#1F,#01,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#11,#02,#FF
    DB #02,#11,#02,#FF,#01,#11,#58,#00,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#11,#01,#FF,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#FF,#01,#11
    DB #01,#1F,#01,#F1,#03,#11,#01,#FF,#04,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#58,#00
    DB #01,#1F,#01,#F1,#01,#FF,#01,#F1,#01,#11,#01,#1F,#01,#F1,#03,#11
    DB #01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#11,#02,#FF,#01,#11
    DB #01,#1F,#02,#FF,#01,#11,#01,#1F,#01,#F1,#04,#11,#01,#FF,#01,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #58,#00,#01,#1F,#01,#FF,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #02,#11,#01,#1F,#01,#FF,#02,#11,#01,#1F,#01,#FF,#01,#11,#01,#1F
    DB #01,#F1,#01,#FF,#03,#11,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#02,#11
    DB #01,#1F,#01,#F1,#02,#11,#02,#FF,#02,#11,#02,#FF,#01,#F1,#58,#00
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#02,#11
    DB #01,#FF,#04,#11,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#02,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#FF
    DB #02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #58,#00,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #02,#11,#01,#FF,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#FF,#02,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#02,#11,#01,#FF,#01,#11,#58,#00,#01,#11,#02,#FF
    DB #01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#01,#11
    DB #02,#FF,#03,#11,#01,#FF,#02,#11,#02,#FF,#02,#11,#02,#FF,#02,#11
    DB #01,#FF,#03,#11,#02,#FF,#02,#11,#01,#FF,#01,#F1,#01,#11,#58,#00
    DB #28,#11,#58,#00
bitmap_room_hud_linked_1_rle_chunk_0_end:

; Linked HUD dynamic widget #2 (counter) tile/glyph data, packed 4bpp RLE; VRAM #0EA00, raw 1024 bytes, RLE 452 bytes
bitmap_room_hud_linked_2_rle_chunk_0:
    DB #01,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#02,#11,#02,#FF,#02,#11
    DB #02,#FF,#03,#11,#01,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#11
    DB #01,#1F,#01,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#11,#02,#FF
    DB #02,#11,#02,#FF,#01,#11,#58,#00,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#11,#01,#FF,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#FF,#01,#11
    DB #01,#1F,#01,#F1,#03,#11,#01,#FF,#04,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#58,#00
    DB #01,#1F,#01,#F1,#01,#FF,#01,#F1,#01,#11,#01,#1F,#01,#F1,#03,#11
    DB #01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#11,#02,#FF,#01,#11
    DB #01,#1F,#02,#FF,#01,#11,#01,#1F,#01,#F1,#04,#11,#01,#FF,#01,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #58,#00,#01,#1F,#01,#FF,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #02,#11,#01,#1F,#01,#FF,#02,#11,#01,#1F,#01,#FF,#01,#11,#01,#1F
    DB #01,#F1,#01,#FF,#03,#11,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#02,#11
    DB #01,#1F,#01,#F1,#02,#11,#02,#FF,#02,#11,#02,#FF,#01,#F1,#58,#00
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#02,#11
    DB #01,#FF,#04,#11,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#02,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#FF
    DB #02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #58,#00,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #02,#11,#01,#FF,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#FF,#02,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#02,#11,#01,#FF,#01,#11,#58,#00,#01,#11,#02,#FF
    DB #01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#01,#11
    DB #02,#FF,#03,#11,#01,#FF,#02,#11,#02,#FF,#02,#11,#02,#FF,#02,#11
    DB #01,#FF,#03,#11,#02,#FF,#02,#11,#01,#FF,#01,#F1,#01,#11,#58,#00
    DB #28,#11,#58,#00
bitmap_room_hud_linked_2_rle_chunk_0_end:

BITMAP_ROOM_DATA_BANK_5_USED_END:
    ds #A000 - $, #FF

BITMAP_ROOM_DATA_BANK_6_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_6_ROM_START:
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

BITMAP_ROOM_DATA_BANK_6_USED_END:
    ds #A000 - $, #FF

BITMAP_ROOM_DATA_BANK_7_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_7_ROM_START:
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

BITMAP_ROOM_DATA_BANK_7_USED_END:
    ds #A000 - $, #FF

BITMAP_ROOM_DATA_BANK_8_PHYS_START:
    org #8000
BITMAP_ROOM_DATA_BANK_8_ROM_START:
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

BITMAP_ROOM_DATA_BANK_8_USED_END:
    ds #A000 - $, #FF

    end
