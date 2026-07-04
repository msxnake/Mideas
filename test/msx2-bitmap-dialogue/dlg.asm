; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: bitmap_dialogue_test
; Room: pant1
; Screen mode: SCREEN 4 (Graphics II)
; Backend: msx2-screen4-bitmap-room
; ROM Mode: simple32k
; Mapper Target: konami
; Auto MegaROM: No
; NOTE: Bitmap-room SCREEN 5 uses a linear simple32k ROM layout.
; Visible page: VRAM #0000, 128 bytes/row, 212 lines
; Bitmap room HUD height: 20 px
; Bitmap room HUD widgets: 0
; Bitmap room game area: 256x192 at visual Y=20
; Bitmap room game band VRAM base: #0A00
; World rooms: 3; start room index: 0
; Shared tileset bytes: 43008 at VRAM #10000
; MSX2_GAMEFLOW_INTRO_SCENES: 0
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
; Hearts HUD (SCREEN 5 bitmap). Dirty-flag + 15-byte V9938 command scratch.
hud_hearts_drawn EQU #C1FC
hud_cmd_block    EQU #C2C0
; SCREEN 5 bitmap NPC dialogue system. Config mirror (20B, LDIR'd on open) + state.
bitmap_dlg_cfg             EQU #C0DE
bitmap_dlg_cfg_box_x       EQU #C0DE
bitmap_dlg_cfg_box_y       EQU #C0DF
bitmap_dlg_cfg_box_w       EQU #C0E0
bitmap_dlg_cfg_box_h       EQU #C0E1
bitmap_dlg_cfg_border_clr  EQU #C0E2
bitmap_dlg_cfg_bg_clr      EQU #C0E3
bitmap_dlg_cfg_delay       EQU #C0E4
bitmap_dlg_cfg_mouth_int   EQU #C0E5
bitmap_dlg_cfg_text_x      EQU #C0E6
bitmap_dlg_cfg_text_y      EQU #C0E7
bitmap_dlg_cfg_text_w      EQU #C0E8
bitmap_dlg_cfg_text_h      EQU #C0E9
bitmap_dlg_cfg_strip_sy    EQU #C0EA
bitmap_dlg_cfg_por_x       EQU #C0EC
bitmap_dlg_cfg_por_y       EQU #C0ED
bitmap_dlg_cfg_por_max_w   EQU #C0EE
bitmap_dlg_cfg_por_max_h   EQU #C0EF
bitmap_dlg_cfg_line_base   EQU #C0F0
bitmap_dlg_cfg_line_count  EQU #C0F1
bitmap_dlg_state           EQU #C0F2
bitmap_dlg_lock            EQU #C0F3
bitmap_dlg_line            EQU #C0F4
bitmap_dlg_lines_left      EQU #C0F5
bitmap_dlg_text_ptr        EQU #C0F6
bitmap_dlg_delay           EQU #C0F8
bitmap_dlg_mouth_count     EQU #C0F9
bitmap_dlg_mouth_state     EQU #C0FA
bitmap_dlg_portrait        EQU #C0FB
bitmap_dlg_cursor_x        EQU #C0FC
bitmap_dlg_cursor_y        EQU #C0FD
bitmap_dlg_key_mask        EQU #C0FE
bitmap_dlg_wait_flags      EQU #C0FF
bitmap_dlg_scratch_idx     EQU #C100
bitmap_dlg_cmd_block       EQU #C2C0
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
    call upload_bitmap_dialogue_gfx
    ; Render the start room from the shared tileset already in VRAM.
    ld a, 0
    call load_room

    ; Place the player at the room spawn point.
    ld a, 99
    ld (player_y), a
    ld a, 36
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
    ld a, #03
    ld (player_lives), a
    xor a
    ld (player_invuln), a
    ld (blink_phase), a
    ld (blink_ended), a
    ld (blink_hide), a
    ; Upload heart tiles (full + empty) to the page-0 offscreen slot and force
    ; a redraw on frame 1 by seeding the dirty flag with an impossible value.
    call upload_hud_hearts
    ld a, #FF
    ld (hud_hearts_drawn), a
    ; NPC dialogue system: start idle with the talk key unlatched.
    xor a
    ld (bitmap_dlg_state), a
    ld (bitmap_dlg_lock), a
    ld (bitmap_dlg_mouth_state), a
    ld (bitmap_dlg_mouth_count), a
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so interrupts stay disabled and the BIOS cannot
    ; consume S#0 before the main loop sees it.
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (bitmap_ice_vx), a
    ld (bitmap_ice_accel_t), a
    ld (bitmap_ice_friction_t), a
    ld (bitmap_ice_input), a
.main_loop:
    call bitmap_wait_vblank
    call step_room_composition
    jp c, .skip_player_movement
    call bitmap_dialogue_frame      ; NPC talk: open/advance dialogue; carry = player paused
    jp c, .skip_player_movement
    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
.skip_player_movement:
    call bitmap_update_player_sprite_animation
    call bitmap_upload_player_frame_colors
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_hearts    ; redraw hearts HUD when player_health changes
    call bitmap_update_sprite_sat
    jp .main_loop


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
    ld hl, bitmap_room_tileset_rle_chunk_1
    ld a, 5
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_1_end - bitmap_room_tileset_rle_chunk_1
    call decompress_bitmap_rle_to_vram
    ld hl, bitmap_room_tileset_rle_chunk_2
    ld a, 6
    ld de, #0000
    ld bc, bitmap_room_tileset_rle_chunk_2_end - bitmap_room_tileset_rle_chunk_2
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
    ld a, 174
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
    ld bc, 32
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
    cp 2
    jp nc, .check_south_edge
    ld a, 2                 ; direction north
    call start_room_transition
    ret
.check_south_edge:
    ld a, (player_y)
    cp 175
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
;   SAT base pattern advances by frame * 8. Stack is
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
    cp 3
    jp c, .store_player_anim_frame
    xor a
.store_player_anim_frame:
    ld (player_anim_frame), a
.refresh_player_pattern:
    ld a, (player_anim_frame)
    add a, a
    add a, a
    add a, a

    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp nz, .store_player_pattern
    add a, 24
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
;   player_anim_frame    = current logical frame (0..2).
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
;   On a frame change: writes 32 bytes (2 layer(s) x 16 lines)
;   to VRAM #F400 and updates player_colors_loaded.
;
; NOTES:
;   Source = bitmap_room_sprite_colors + player_anim_frame * 32.
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
    ld de, 32
.add_frame_color_offset:
    add hl, de
    dec a
    jp nz, .add_frame_color_offset
.upload_frame_colors:
    ld de, #F400
    ld b, 32
    jp fast_copy_to_vram_ext

bitmap_try_move_x:
    ; A = signed dx. Commits player_x when the leading edge of the configured body
    ; collision box is not solid. Hitbox: x=3, y=4,
    ; w=10, h=12. Probes Y rows 4/15
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
    add a, 12
    jp .x_have_edge
.x_left_edge:
    add a, 3
.x_have_edge:
    ld b, a                 ; B = probe X (hitbox leading edge; preserved by probe_solid)
    ld a, (player_y)
    add a, 4
    ld c, a                 ; C = probe Y (+4)
    call bitmap_probe_solid
    jp nz, .x_blocked
    ld a, (player_y)
    add a, 15
    ld c, a                 ; C = probe Y (+15)
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
    ; blocked. Probes X cols 3/12. Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_y)
    add a, b                ; A = candidate Y (sprite top-left)
    push af
    bit 7, b
    jp nz, .y_up_edge
    add a, 15
    jp .y_have_edge
.y_up_edge:
    add a, 4
.y_have_edge:
    ld c, a                 ; C = probe Y (hitbox leading edge; preserved by probe_solid)
    ld a, (player_x)
    add a, 3
    ld b, a                 ; B = probe X (+3)
    call bitmap_probe_solid
    jp nz, .y_blocked
    ld a, (player_x)
    add a, 12
    ld b, a                 ; B = probe X (+12)
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
;   Writes 2 player SAT entries plus a terminator to
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
;   left +3, right +12, y +16.
; ------------------------------------------------------------
bitmap_ice_player_on_surface:
    ld a, (player_x)
    add a, 3
    ld b, a
    ld a, (player_y)
    add a, 16
    ld c, a
    call bitmap_probe_behavior
    cp 3
    jp nz, .ice_not_on_surface
    ld a, (player_x)
    add a, 12
    ld b, a
    ld a, (player_y)
    add a, 16
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
    cp 2
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
    cp 2
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
    cp 8
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
    add a, 15
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
    add a, 12
    ld b, a
    call bitmap_probe_deadly
    jp z, .deadly_no_contact   ; no deadly contact in any sample -> exit
    ; Instant-respawn mode (health.deadlyInstantRespawn = true): each deadly
    ; touch costs 1 health + blink AND repositions the player to the spawn.
.deadly_take_damage:
    ld hl, player_health
    dec (hl)
    ld a, (hl)
    or a
    jr z, .deadly_dead
    ld a, #3C
    ld (player_invuln), a
    jp .deadly_reposition       ; reposition (blink armed), health NOT reset
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
; FUNCTION: upload_hud_hearts
; ------------------------------------------------------------
; PURPOSE:
;   Upload the baked heart tiles (16x16 full + 16x16 empty, side by side = a
;   32x16 4bpp blob) to the fixed page-0 offscreen slot at VRAM #7000 (Y=224).
;   Called once at boot. The tiles are the HMMM source for update_hud_hearts.
; ------------------------------------------------------------
upload_hud_hearts:
    ld hl, bitmap_room_hud_heart_rle_chunk_0
    ld a, 1
    ld de, #3000
    ld bc, bitmap_room_hud_heart_rle_chunk_0_end - bitmap_room_hud_heart_rle_chunk_0
    call decompress_bitmap_rle_to_vram
    ret
; ------------------------------------------------------------
; FUNCTION: update_hud_hearts
; ------------------------------------------------------------
; PURPOSE:
;   Redraw the hearts row in the HUD band when player_health changes (dirty-flag).
;   Draws 5 slot(s) at x=8.. +16, y=2: a full
;   heart (source sx=0) for each slot index < player_health, an empty outline
;   (source sx=16) for each lost one. Only the VISIBLE page is updated
;   (bitmap_displayed_page). Uses HMMM from the heart tile slot at Y=224.
;
; INPUT:
;   player_health, bitmap_displayed_page, hud_hearts_drawn (dirty flag).
;
; OUTPUT:
;   HUD band hearts refreshed on the visible page; hud_hearts_drawn latched.
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
;   V9938 command engine runs 5 HMMM block(s). R#15 is left at S#2 by
;   vdp_wait_cmd_ready, so R#15 is restored to S#0 before returning (else the
;   bitmap_wait_vblank poll would read the wrong status register).
; ------------------------------------------------------------
update_hud_hearts:
    ld a, (player_health)
    ld hl, hud_hearts_drawn
    cp (hl)
    ret z                       ; unchanged -> nothing to redraw
    ld (hl), a                  ; latch new health

    ; Copy the ROM command template into the 15-byte scratch, then patch the
    ; per-frame fields (DY from the visible page; SX/DX per slot in the loop).
    ld hl, hud_heart_cmd_template
    ld de, hud_cmd_block
    ld bc, 15
    ldir
    ld a, 2
    ld (hud_cmd_block + 6), a   ; DY lo (HUD band offset)
    xor a
    ld (hud_cmd_block + 7), a   ; page 0
    call .hud_draw_heart_page
    ld a, 1
    ld (hud_cmd_block + 7), a   ; page 1
    call .hud_draw_heart_page

    call bitmap_restore_hud_separator
    ret

.hud_draw_heart_page:
    ld b, 5          ; slot count (compile-time constant)
    ld c, 0                     ; C = current slot index
.hud_slot_loop:
    ; Source X (full vs empty): full (0) when slot < health, else empty (16).
    ld a, c
    push hl
    ld hl, player_health
    cp (hl)                     ; carry set when slot < health
    pop hl
    jr c, .hud_full_heart
    ld a, 16
    jr .hud_set_sx
.hud_full_heart:
    xor a
.hud_set_sx:
    ld (hud_cmd_block + 0), a   ; SX lo
    ; Destination X = 8 + slot * 16
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, 8
    ld (hud_cmd_block + 4), a   ; DX lo
    call hud_launch_heart_cmd
    inc c
    djnz .hud_slot_loop
    ret

hud_launch_heart_cmd:
    ; Launch the 15-byte V9938 command currently in hud_cmd_block. Clobbers
    ; AF, HL; keeps BC (the slot index in C survives across the OUT loop).
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    push bc
    ld hl, hud_cmd_block
    ld b, 15
.hud_write_block:
    ld a, (hl)
    out (#9B), a
    inc hl
    djnz .hud_write_block
    pop bc
    ret

; HMMM command template: source = heart tile at Y=224, size
; 16x16. SX/DX/DY are patched at runtime.
hud_heart_cmd_template:
    DB 0,0, #E0,0, 0,0, 0,0, #10,0, #10,0, 0,0, #D0



; ------------------------------------------------------------
; FUNCTION: upload_bitmap_dialogue_gfx
; ------------------------------------------------------------
; PURPOSE:
;   Upload the dialogue glyph strips + portrait frame pairs (packed 4bpp RLE)
;   to offscreen VRAM rows 992..1023, once at boot after the atlas.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
upload_bitmap_dialogue_gfx:
    ld hl, bitmap_dlg_gfx_rle_chunk_0
    ld a, 7
    ld de, #3000
    ld bc, bitmap_dlg_gfx_rle_chunk_0_end - bitmap_dlg_gfx_rle_chunk_0
    call decompress_bitmap_rle_to_vram
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
    add a, 12
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
    add a, 15
    cp e
    jp c, .dlg_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
    add a, 4
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
;   under the box. The talk latch stays set so the
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
    jp .dlg_close_have_table
.dlg_close_p0:
    ld hl, bitmap_room_render_ptr_table_p0
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
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld c, (hl)
    inc hl
    ld b, (hl)
    pop hl
    call replay_room_commands
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


; VDP palette bytes: byte1=(R<<4)|B, byte2=G
screen5_bitmap_palette_data:
    DB #00,#00,#00,#00,#65,#06,#11,#01,#33,#03,#54,#05,#22,#02,#36,#06
    DB #72,#02,#74,#04,#52,#05,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07

bitmap_room_hud_seed_data:
; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE
; Raw bytes: 5120; encoded bytes: 44
; VRAM #00000, raw 2560 bytes, RLE 22 bytes
bitmap_room_hud_seed_p0_rle_chunk_0:
    DB #FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11
    DB #FF,#11,#89,#11,#80,#FF
bitmap_room_hud_seed_p0_rle_chunk_0_end:
; VRAM #08000, raw 2560 bytes, RLE 22 bytes
bitmap_room_hud_seed_p1_rle_chunk_0:
    DB #FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11,#FF,#11
    DB #FF,#11,#89,#11,#80,#FF
bitmap_room_hud_seed_p1_rle_chunk_0_end:

bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
; Shared world tileset (atlas), packed 4bpp RLE, destination VRAM #10000
; Raw bytes: 43008; encoded bytes: 2458
; VRAM #10000, raw 16384 bytes, RLE 2246 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #01,#00,#01,#24,#04,#44,#01,#42,#01,#50,#08,#00,#01,#55,#01,#44
    DB #01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52,#01,#54
    DB #01,#22,#01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30
    DB #04,#00,#01,#03,#02,#52,#01,#24,#01,#22,#01,#54,#01,#55,#01,#54
    DB #01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52
    DB #01,#24,#01,#22,#01,#54,#04,#66,#01,#36,#02,#64,#01,#66,#01,#64
    DB #01,#46,#01,#36,#01,#66,#01,#63,#01,#36,#01,#66,#01,#63,#02,#00
    DB #02,#55,#0E,#00,#01,#52,#01,#40,#01,#03,#01,#65,#01,#52,#03,#55
    DB #16,#00,#01,#02,#01,#24,#05,#44,#01,#25,#01,#03,#05,#33,#01,#03
    DB #01,#33,#01,#55,#01,#44,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00
    DB #01,#03,#02,#52,#01,#24,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52,#01,#24,#01,#22
    DB #01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00
    DB #01,#03,#02,#52,#01,#24,#01,#22,#01,#54,#06,#55,#01,#44,#01,#43
    DB #01,#35,#01,#52,#02,#25,#01,#22,#03,#55,#01,#00,#01,#02,#01,#22
    DB #01,#25,#01,#50,#0D,#00,#01,#04,#01,#33,#01,#00,#01,#04,#01,#65
    DB #03,#55,#01,#50,#15,#00,#01,#22,#06,#44,#01,#22,#05,#33,#02,#43
    DB #01,#33,#01,#55,#01,#44,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00
    DB #01,#03,#01,#55,#01,#52,#01,#24,#01,#22,#01,#54,#01,#55,#01,#54
    DB #01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52,#01,#24
    DB #01,#22,#01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30
    DB #04,#00,#01,#03,#02,#52,#01,#24,#01,#25,#01,#54,#05,#55,#01,#54
    DB #01,#44,#01,#43,#01,#35,#02,#55,#01,#22,#04,#55,#01,#00,#03,#55
    DB #01,#50,#0D,#00,#01,#06,#01,#43,#02,#00,#01,#33,#01,#65,#03,#55
    DB #01,#50,#14,#00,#01,#24,#06,#44,#01,#22,#01,#33,#01,#34,#02,#44
    DB #01,#34,#01,#44,#01,#33,#01,#44,#01,#55,#01,#44,#01,#55,#01,#44
    DB #01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24,#01,#22
    DB #01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00
    DB #01,#03,#02,#52,#01,#24,#01,#25,#01,#54,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24
    DB #01,#22,#01,#54,#05,#55,#01,#54,#01,#44,#01,#43,#01,#35,#01,#52
    DB #01,#22,#01,#25,#04,#55,#01,#26,#01,#25,#01,#05,#02,#55,#0E,#00
    DB #01,#64,#01,#33,#01,#00,#01,#03,#01,#65,#03,#55,#01,#52,#14,#00
    DB #01,#44,#01,#42,#04,#22,#01,#24,#01,#22,#01,#33,#01,#43,#03,#44
    DB #01,#43,#01,#34,#01,#44,#02,#55,#01,#54,#01,#44,#01,#46,#01,#30
    DB #04,#00,#01,#63,#01,#45,#05,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#02,#52,#01,#54,#01,#22,#01,#54,#01,#55
    DB #01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52
    DB #01,#24,#01,#22,#01,#54,#04,#44,#01,#46,#02,#66,#01,#63,#01,#66
    DB #02,#44,#01,#46,#04,#44,#01,#22,#01,#25,#03,#55,#0E,#00,#01,#06
    DB #01,#44,#02,#33,#01,#65,#02,#55,#01,#25,#01,#20,#14,#00,#01,#22
    DB #01,#25,#04,#55,#01,#22,#01,#55,#01,#33,#0C,#44,#01,#46,#04,#00
    DB #01,#45,#01,#54,#04,#44,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24,#01,#22,#01,#54
    DB #01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03
    DB #02,#52,#01,#24,#01,#22,#01,#54,#03,#44,#01,#46,#02,#66,#01,#63
    DB #01,#30,#01,#03,#01,#36,#01,#66,#05,#44,#01,#05,#01,#55,#01,#05
    DB #02,#55,#0F,#00,#01,#26,#01,#44,#01,#46,#03,#55,#01,#52,#01,#22
    DB #01,#20,#13,#00,#07,#55,#01,#53,#01,#33,#07,#44,#01,#55,#01,#54
    DB #02,#44,#01,#66,#01,#63,#04,#00,#01,#64,#01,#45,#05,#55,#01,#54
    DB #01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52
    DB #01,#24,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24,#01,#22,#01,#54
    DB #02,#55,#01,#54,#03,#44,#01,#66,#02,#00,#01,#36,#01,#44,#01,#55
    DB #02,#22,#01,#52,#01,#55,#01,#00,#01,#05,#03,#55,#01,#50,#0E,#00
    DB #01,#05,#01,#52,#01,#25,#01,#50,#02,#00,#01,#55,#01,#22,#01,#25
    DB #13,#00,#07,#55,#01,#53,#01,#33,#03,#44,#01,#24,#06,#44,#01,#46
    DB #01,#66,#01,#63,#01,#60,#02,#00,#01,#06,#01,#66,#05,#44,#01,#55
    DB #01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52
    DB #01,#54,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#54,#01,#22,#02,#54
    DB #03,#44,#02,#66,#01,#30,#02,#00,#01,#06,#01,#64,#01,#44,#04,#55
    DB #01,#00,#01,#05,#04,#55,#0E,#00,#01,#05,#02,#55,#01,#50,#02,#00
    DB #01,#05,#01,#55,#01,#22,#01,#20,#12,#00,#07,#55,#01,#53,#08,#44
    DB #04,#55,#02,#44,#01,#63,#02,#00,#01,#34,#01,#22,#01,#20,#01,#22
    DB #01,#52,#01,#22,#01,#25,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#54,#01,#22,#01,#54
    DB #01,#55,#01,#44,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03
    DB #01,#55,#01,#52,#01,#24,#01,#22,#01,#54,#02,#44,#01,#46,#02,#66
    DB #01,#36,#04,#00,#01,#36,#01,#44,#01,#46,#02,#66,#01,#44,#01,#00
    DB #01,#05,#02,#55,#01,#22,#01,#25,#01,#55,#0A,#00,#01,#03,#01,#40
    DB #01,#00,#01,#05,#01,#50,#01,#55,#04,#00,#01,#05,#01,#52,#01,#22
    DB #01,#50,#11,#00,#01,#55,#01,#25,#04,#55,#01,#52,#01,#53,#01,#34
    DB #07,#44,#01,#54,#01,#55,#01,#54,#03,#44,#01,#63,#02,#00,#01,#34
    DB #07,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03
    DB #01,#55,#01,#52,#01,#54,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24
    DB #01,#22,#01,#54,#01,#44,#01,#46,#02,#66,#01,#63,#01,#36,#04,#00
    DB #01,#66,#01,#64,#01,#46,#01,#66,#02,#44,#01,#00,#01,#05,#01,#55
    DB #01,#52,#01,#40,#01,#62,#01,#55,#0B,#00,#01,#60,#01,#00,#01,#02
    DB #01,#50,#01,#22,#05,#00,#01,#55,#01,#52,#01,#25,#11,#00,#01,#52
    DB #01,#22,#02,#55,#01,#52,#02,#22,#01,#20,#01,#33,#01,#34,#06,#44
    DB #07,#66,#01,#60,#01,#03,#01,#33,#06,#66,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52,#01,#54,#01,#25
    DB #01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00
    DB #01,#03,#02,#52,#01,#24,#01,#22,#01,#54,#01,#44,#01,#46,#01,#44
    DB #02,#66,#01,#30,#04,#00,#01,#03,#01,#45,#01,#44,#01,#54,#01,#45
    DB #01,#44,#01,#00,#01,#05,#01,#25,#01,#56,#01,#30,#01,#00,#01,#65
    DB #01,#50,#09,#00,#01,#06,#01,#66,#01,#00,#01,#02,#01,#00,#01,#25
    DB #01,#06,#01,#44,#01,#30,#02,#00,#01,#05,#01,#55,#01,#22,#01,#20
    DB #10,#00,#07,#22,#01,#20,#01,#33,#07,#44,#06,#55,#01,#54,#01,#30
    DB #01,#34,#06,#55,#01,#25,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#02,#52,#01,#54,#01,#22,#01,#54,#01,#55
    DB #01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52
    DB #01,#24,#01,#22,#01,#54,#01,#45,#01,#44,#01,#45,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#45,#01,#24,#01,#55,#01,#54
    DB #01,#00,#01,#05,#01,#25,#01,#55,#01,#26,#01,#33,#01,#34,#01,#55
    DB #09,#00,#01,#06,#01,#60,#01,#00,#01,#22,#01,#00,#01,#20,#01,#06
    DB #01,#66,#04,#00,#01,#05,#01,#55,#01,#25,#10,#00,#01,#52,#06,#22
    DB #01,#20,#04,#44,#01,#42,#01,#44,#01,#42,#01,#44,#04,#55,#01,#54
    DB #02,#44,#01,#30,#01,#34,#08,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#54,#01,#22,#01,#54
    DB #01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03
    DB #01,#55,#01,#52,#01,#24,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24
    DB #01,#22,#01,#54,#01,#00,#01,#05,#01,#55,#01,#56,#01,#55,#01,#56
    DB #01,#66,#01,#25,#01,#50,#08,#00,#01,#04,#01,#66,#01,#62,#01,#25
    DB #01,#22,#01,#20,#01,#06,#01,#66,#01,#60,#04,#00,#01,#05,#01,#52
    DB #10,#00,#01,#05,#01,#52,#05,#22,#01,#50,#01,#44,#07,#22,#05,#55
    DB #02,#44,#01,#30,#01,#34,#08,#55,#01,#44,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#54,#01,#22,#01,#54
    DB #01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03
    DB #01,#55,#01,#52,#01,#24,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24
    DB #01,#22,#01,#54,#01,#00,#01,#05,#01,#55,#01,#24,#03,#22,#01,#25
    DB #01,#52,#08,#00,#01,#46,#01,#65,#01,#22,#01,#55,#01,#52,#01,#55
    DB #01,#66,#01,#26,#01,#66,#17,#00,#01,#05,#04,#22,#01,#25,#01,#00
    DB #01,#02,#07,#22,#01,#55,#01,#54,#01,#45,#01,#55,#01,#54,#02,#44
    DB #01,#30,#01,#34,#02,#55,#01,#45,#05,#55,#01,#54,#01,#55,#01,#44
    DB #01,#46,#01,#30,#04,#00,#01,#03,#02,#52,#01,#54,#01,#22,#01,#54
    DB #01,#55,#01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03
    DB #01,#55,#01,#52,#01,#24,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55
    DB #01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55,#01,#52,#01,#24
    DB #01,#22,#01,#54,#01,#00,#01,#05,#01,#55,#01,#20,#01,#65,#01,#22
    DB #01,#55,#01,#52,#01,#25,#01,#20,#07,#00,#01,#64,#01,#66,#01,#26
    DB #01,#65,#01,#22,#01,#26,#01,#64,#01,#46,#01,#60,#18,#00,#01,#52
    DB #03,#22,#01,#20,#09,#00,#07,#66,#01,#30,#01,#36,#07,#66,#01,#55
    DB #01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#02,#52
    DB #01,#24,#01,#22,#01,#54,#01,#55,#01,#54,#01,#55,#01,#44,#01,#46
    DB #01,#30,#04,#00,#01,#03,#02,#52,#01,#24,#01,#22,#01,#54,#01,#55
    DB #01,#54,#01,#55,#01,#44,#01,#46,#01,#30,#04,#00,#01,#03,#01,#55
    DB #01,#52,#01,#24,#01,#22,#01,#54,#02,#00,#01,#55,#01,#20,#01,#36
    DB #02,#55,#01,#22,#01,#25,#01,#50,#09,#00,#01,#40,#01,#62,#01,#56
    DB #01,#00,#01,#60,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#50,#00
bitmap_room_tileset_rle_chunk_0_end:
; VRAM #14000, raw 16384 bytes, RLE 130 bytes
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
; VRAM #18000, raw 10240 bytes, RLE 82 bytes
bitmap_room_tileset_rle_chunk_2:
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #28,#00
bitmap_room_tileset_rle_chunk_2_end:

bitmap_room_tileset_data_end:

bitmap_room_hud_heart_data:
; Hearts HUD tiles (full + empty outline), packed 4bpp RLE, destination VRAM #07000
; Raw bytes: 2048; encoded bytes: 252
; VRAM #07000, raw 2048 bytes, RLE 252 bytes
bitmap_room_hud_heart_rle_chunk_0:
    DB #10,#11,#70,#00,#01,#11,#01,#19,#01,#91,#02,#11,#01,#99,#03,#11
    DB #01,#1E,#01,#E1,#02,#11,#01,#EE,#02,#11,#70,#00,#01,#11,#02,#99
    DB #01,#11,#01,#19,#01,#99,#01,#91,#02,#11,#01,#E1,#01,#1E,#01,#11
    DB #01,#1E,#01,#11,#01,#E1,#01,#11,#70,#00,#01,#19,#02,#99,#01,#91
    DB #03,#99,#01,#91,#01,#1E,#02,#11,#02,#E1,#01,#11,#01,#1E,#01,#E1
    DB #70,#00,#01,#19,#06,#99,#01,#91,#01,#1E,#02,#11,#01,#1E,#03,#11
    DB #01,#E1,#70,#00,#01,#19,#06,#99,#01,#91,#01,#1E,#06,#11,#01,#E1
    DB #70,#00,#01,#19,#06,#99,#01,#91,#01,#1E,#06,#11,#01,#E1,#70,#00
    DB #01,#19,#06,#99,#01,#91,#01,#1E,#06,#11,#01,#E1,#70,#00,#01,#11
    DB #06,#99,#02,#11,#01,#E1,#04,#11,#01,#1E,#01,#11,#70,#00,#01,#11
    DB #01,#19,#04,#99,#01,#91,#02,#11,#01,#1E,#04,#11,#01,#E1,#01,#11
    DB #70,#00,#02,#11,#04,#99,#04,#11,#01,#E1,#02,#11,#01,#1E,#02,#11
    DB #70,#00,#02,#11,#01,#19,#02,#99,#01,#91,#04,#11,#01,#1E,#02,#11
    DB #01,#E1,#02,#11,#70,#00,#03,#11,#02,#99,#06,#11,#01,#E1,#01,#1E
    DB #03,#11,#70,#00,#03,#11,#01,#19,#01,#91,#06,#11,#01,#1E,#01,#E1
    DB #03,#11,#70,#00,#10,#11,#70,#00,#10,#11,#70,#00
bitmap_room_hud_heart_rle_chunk_0_end:

bitmap_room_hud_heart_data_end:

bitmap_room_hud_linked_data:

bitmap_room_hud_linked_data_end:

; World engine dispatch tables (indexed by room/screen index).
bitmap_room_render_ptr_table_p0:
    DW bitmap_room_render_0_p0
    DW bitmap_room_render_1_p0
    DW bitmap_room_render_2_p0
bitmap_room_render_ptr_table_p1:
    DW bitmap_room_render_0_p1
    DW bitmap_room_render_1_p1
    DW bitmap_room_render_2_p1

bitmap_room_blockcount_table:
    DW 35
    DW 39
    DW 69

bitmap_room_collision_ptr_table:
    DW bitmap_room_collision_0
    DW bitmap_room_collision_1
    DW bitmap_room_collision_2

bitmap_room_behavior_ptr_table:
    DW bitmap_room_behavior_0
    DW bitmap_room_behavior_1
    DW bitmap_room_behavior_2

; Edge rails per room: west,east,north,south (#FF = none)
bitmap_room_transition_table:
    DB #FF,#01,#FF,#FF,#00,#02,#FF,#FF,#01,#FF,#FF,#FF

bitmap_room_spawn_x_table:
    DB 36,59,0
bitmap_room_spawn_y_table:
    DB 99,92,216


; Room 0 NPC records: x,y,dialogueIndex,talkKeyMask
bitmap_dlg_npcs_room_0:
    DB #30,#90,#00,#20
bitmap_dlg_npcs_room_1:
bitmap_dlg_npcs_room_2:
bitmap_dlg_npc_ptr_table:
    DW bitmap_dlg_npcs_room_0
    DW bitmap_dlg_npcs_room_1
    DW bitmap_dlg_npcs_room_2
bitmap_dlg_npc_count_table:
    DB 1,0,0
bitmap_dlg_cfg_ptr_table:
    DW bitmap_dlg_cfg_0
; Dialogue config: boxX,boxY,boxW,boxH,borderClr,bgClr,delay,mouthInt,textX,textY,textW,textH,stripSY(w),porX,porY,porMaxW,porMaxH,lineBase,lineCount
bitmap_dlg_cfg_0:
    DB #08,#1C,#F0,#38,#FF,#11,#03,#02,#2A,#22,#C8,#28,#E0,#03,#0E,#22
    DB #18,#18,#00,#02
; 4 bytes/line: text ptr (word), flags (bit0 = waitForInput), portrait index (#FF none)
bitmap_dlg_line_records:
    DW bitmap_dlg_text_0
    DB 1, #00
    DW bitmap_dlg_text_1
    DB 1, #00
; Dialogue line 0 glyph indices (#FE newline, #FF end)
bitmap_dlg_text_0:
    DB #01,#02,#03,#04,#05,#06,#03,#07,#00,#08,#09,#0A,#03,#00,#0B,#06
    DB #03,#0C,#0D,#04,#09,#FE,#0E,#06,#0D,#0F,#0B,#0D,#0F,#06,#05,#09
    DB #00,#03,#0A,#00,#10,#03,#11,#12,#06,#0A,#0A,#09,#00,#05,#0D,#FE
    DB #08,#06,#0D,#0A,#09,#FF
; Dialogue line 1 glyph indices (#FE newline, #FF end)
bitmap_dlg_text_1:
    DB #01,#02,#03,#04,#05,#06,#03,#07,#00,#10,#02,#06,#05,#03,#05,#09
    DB #00,#10,#09,#0F,#00,#0D,#0A,#FE,#11,#02,#0D,#0A,#09,#00,#04,#0D
    DB #11,#0E,#03,#0A,#03,#05,#06,#13,#09,#00,#05,#0D,#0A,#FE,#0D,#11
    DB #12,#0D,#FF
; Portrait records: frameSY(word), width, height (closed at SX=0, open at SX=width)
bitmap_dlg_portrait_records:
    DB #E8,#03,#18,#18
; NPC dialogue glyph strips + portrait frames, packed 4bpp RLE, destination VRAM #1F000
; Raw bytes: 4096; encoded bytes: 1412
; VRAM #1F000, raw 4096 bytes, RLE 1412 bytes
bitmap_dlg_gfx_rle_chunk_0:
    DB #05,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11
    DB #01,#1F,#01,#F1,#01,#11,#01,#1F,#02,#FF,#01,#11,#01,#1F,#01,#FF
    DB #01,#F1,#01,#11,#01,#1F,#02,#FF,#01,#F1,#04,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1,#02,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#FF,#01,#F1
    DB #01,#1F,#02,#FF,#01,#F1,#01,#1F,#02,#FF,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#11,#02,#FF,#02,#11,#02,#FF,#01,#11,#01,#1F
    DB #02,#FF,#01,#F1,#01,#1F,#02,#FF,#01,#F1,#30,#00,#04,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11
    DB #02,#FF,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#FF,#02,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11
    DB #01,#FF,#01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#FF,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #03,#11,#01,#1F,#01,#F1,#30,#00,#04,#11,#01,#1F,#01,#F1,#02,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#FF
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#02,#FF,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #03,#11,#01,#1F,#01,#F1,#03,#11,#01,#FF,#01,#11,#30,#00,#04,#11
    DB #01,#1F,#01,#F1,#01,#FF,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#02,#FF,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#05,#11,#01,#1F
    DB #02,#FF,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#FF,#01,#11
    DB #01,#1F,#02,#FF,#01,#11,#01,#1F,#02,#FF,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#01,#1F,#01,#F1,#03,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1
    DB #02,#11,#01,#1F,#01,#F1,#01,#11,#30,#00,#04,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#02,#FF
    DB #01,#F1,#01,#1F,#01,#FF,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#11,#01,#1F,#01,#F1,#05,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#FF,#01,#11,#01,#1F
    DB #01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#FF,#01,#F1,#01,#1F,#01,#F1,#04,#11,#01,#1F,#01,#F1,#01,#11
    DB #01,#1F,#01,#F1,#02,#11,#01,#FF,#02,#11,#30,#00,#04,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#FF,#01,#11,#01,#1F
    DB #01,#F1,#01,#FF,#02,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#03,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1
    DB #01,#FF,#01,#11,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#30,#00,#05,#11,#02,#FF,#02,#11
    DB #02,#FF,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#FF,#01,#F1,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#01,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1,#01,#11
    DB #01,#1F,#01,#F1,#02,#11,#01,#FF,#01,#F1,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#01,#1F,#02,#FF,#01,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#11,#02,#FF,#02,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#01,#11
    DB #01,#1F,#02,#FF,#01,#F1,#30,#00,#50,#11,#30,#00,#18,#11,#68,#00
    DB #18,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A
    DB #08,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1
    DB #02,#11,#01,#1A,#08,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A
    DB #08,#AA,#01,#A1,#02,#11,#01,#1A,#08,#AA,#01,#A1,#01,#11,#68,#00
    DB #01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A,#08,#AA,#01,#A1
    DB #01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A
    DB #08,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A,#01,#AA,#01,#AF
    DB #01,#FF,#02,#AA,#01,#FF,#01,#FA,#01,#AA,#01,#A1,#02,#11,#01,#1A
    DB #01,#AA,#01,#AF,#01,#FF,#02,#AA,#01,#FF,#01,#FA,#01,#AA,#01,#A1
    DB #01,#11,#68,#00,#01,#11,#01,#1A,#01,#AA,#01,#AF,#01,#FF,#02,#AA
    DB #01,#FF,#01,#FA,#01,#AA,#01,#A1,#02,#11,#01,#1A,#01,#AA,#01,#AF
    DB #01,#FF,#02,#AA,#01,#FF,#01,#FA,#01,#AA,#01,#A1,#01,#11,#68,#00
    DB #01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A,#08,#AA,#01,#A1
    DB #01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A
    DB #08,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1
    DB #02,#11,#01,#1A,#08,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A
    DB #08,#AA,#01,#A1,#02,#11,#01,#1A,#08,#AA,#01,#A1,#01,#11,#68,#00
    DB #01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A,#08,#AA,#01,#A1
    DB #01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A
    DB #02,#AA,#04,#66,#02,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A
    DB #08,#AA,#01,#A1,#02,#11,#01,#1A,#02,#AA,#04,#66,#02,#AA,#01,#A1
    DB #01,#11,#68,#00,#01,#11,#01,#1A,#02,#AA,#04,#66,#02,#AA,#01,#A1
    DB #02,#11,#01,#1A,#02,#AA,#04,#66,#02,#AA,#01,#A1,#01,#11,#68,#00
    DB #01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A,#02,#AA,#04,#66
    DB #02,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1
    DB #02,#11,#01,#1A,#02,#AA,#04,#66,#02,#AA,#01,#A1,#01,#11,#68,#00
    DB #01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A,#08,#AA,#01,#A1
    DB #01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1,#02,#11,#01,#1A
    DB #08,#AA,#01,#A1,#01,#11,#68,#00,#01,#11,#01,#1A,#08,#AA,#01,#A1
    DB #02,#11,#01,#1A,#08,#AA,#01,#A1,#01,#11,#68,#00,#18,#11,#68,#00
    DB #18,#11,#68,#00
bitmap_dlg_gfx_rle_chunk_0_end:

; Per-room render programs, collision maps and behavior maps.
; Room 0 page 0 render program: 35 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#90
    DB #00,#00,#02,#50,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#60,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00
    DB #02,#50,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02
    DB #60,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#50
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#60,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#50,#00,#94
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#60,#00,#94,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#50,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#60,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#10,#00,#B4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#10,#00,#00,#02,#20,#00,#B4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#10,#00,#00,#02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#10,#00,#00,#02,#50,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00
    DB #02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02
    DB #20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#30
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#40,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#50,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#60,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#70,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#80,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#10,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#10,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#10,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#30,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 0 page 1 render program: 35 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#90
    DB #00,#00,#02,#50,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00
    DB #00,#02,#60,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00
    DB #02,#50,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02
    DB #60,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00,#02,#50
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#60,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#50,#00,#94
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#60,#00,#94,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#50,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#60,#00,#00,#02,#60,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#10,#00,#B4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#10,#00,#00,#02,#20,#00,#B4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#10,#00,#00,#02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#10,#00,#00,#02,#50,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00
    DB #02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02
    DB #20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#30
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#40,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#50,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#60,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#70,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#80,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#10,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#10,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#10,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#30,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
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
    DB #00,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
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
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03

; Room 1 page 0 render program: 39 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#10
    DB #00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00
    DB #02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02
    DB #10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#20
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#30,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#40,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#50,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#60,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#00,#00,#74,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#10,#00,#74,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#10,#00,#00,#02,#20,#00,#74,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#30,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#10,#00,#00,#02,#40,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#10,#00,#00,#02,#50,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#60,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#E0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00
    DB #02,#E0,#00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02
    DB #C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#D0
    DB #00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#E0,#00
    DB #B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#10,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#40,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#E0
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#F0,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 1 page 1 render program: 39 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#10
    DB #00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00
    DB #02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02
    DB #10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#20
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#30,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#40,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#50,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#60,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#00,#00,#74,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#10,#00,#00,#02,#10,#00,#74,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#10,#00,#00,#02,#20,#00,#74,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#10,#00,#00,#02,#30,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#10,#00,#00,#02,#40,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#10,#00,#00,#02,#50,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #10,#00,#00,#02,#60,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#10
    DB #00,#00,#02,#E0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00
    DB #00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00
    DB #02,#E0,#00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02
    DB #C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#D0
    DB #00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#E0,#00
    DB #B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#10,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#40,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#E0
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#F0,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
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

; Room 2 page 0 render program: 69 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #24,#00,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#30,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#54,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#54,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#A0,#00,#54,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#B0,#00,#54,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#00,#02,#40,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#90,#00,#64,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #00,#02,#30,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#40,#00,#74,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#84,#00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#60,#00
    DB #84,#00,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#84
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#90,#00,#84,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#A0,#00,#84,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#C0,#00,#84,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#30,#00,#94,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#60,#00,#00,#02,#40,#00,#94,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#60,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#00,#02,#70,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#70
    DB #00,#00,#02,#90,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00
    DB #00,#02,#A0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#C0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02
    DB #D0,#00,#94,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#30
    DB #00,#A4,#00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40,#00
    DB #A4,#00,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#60,#00,#A4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#A4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#90,#00,#A4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#A4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#00,#02,#C0,#00,#A4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#A4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#30,#00,#B4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#40,#00,#B4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#90,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#A0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#C0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #D0,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#10,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 2 page 1 render program: 69 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#C0,#00
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00
    DB #24,#01,#10,#00,#10,#00,#00,#00,#D0,#A0,#00,#00,#02,#30,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#B0,#00,#00,#02,#40,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#80,#00,#54,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#90,#00,#54,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#A0,#00,#54,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#B0,#00,#54,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#C0,#00,#00,#02,#30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #D0,#00,#00,#02,#40,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#B0
    DB #00,#00,#02,#90,#00,#64,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00
    DB #00,#02,#30,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00
    DB #02,#40,#00,#74,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00,#02
    DB #30,#00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02,#40
    DB #00,#84,#01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#60,#00
    DB #84,#01,#10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#70,#00,#84
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#90,#00,#84,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#80,#00,#00,#02,#A0,#00,#84,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#90,#00,#00,#02,#C0,#00,#84,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#80,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#70,#00,#00,#02,#30,#00,#94,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#60,#00,#00,#02,#40,#00,#94,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#70,#00,#00,#02,#60,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #60,#00,#00,#02,#70,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#70
    DB #00,#00,#02,#90,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00
    DB #00,#02,#A0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#70,#00,#00
    DB #02,#C0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#60,#00,#00,#02
    DB #D0,#00,#94,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#30
    DB #00,#A4,#01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#40,#00
    DB #A4,#01,#10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#60,#00,#A4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#70,#00,#A4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#50,#00,#00,#02,#90,#00,#A4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#40,#00,#00,#02,#A0,#00,#A4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#50,#00,#00,#02,#C0,#00,#A4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#40,#00,#00,#02,#D0,#00,#A4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#30,#00,#00,#02,#30,#00,#B4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#20,#00,#00,#02,#40,#00,#B4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#30,#00,#00,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #20,#00,#00,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30
    DB #00,#00,#02,#90,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00
    DB #00,#02,#A0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#30,#00,#00
    DB #02,#C0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#20,#00,#00,#02
    DB #D0,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#00
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#10,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#20,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#30,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#40,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#D0,#00,#00,#00,#02,#50,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#D0,#00,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#D0,#00,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#D0,#00,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#D0,#00,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #D0,#00,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
    DB #00,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00
    DB #00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00
    DB #00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00
    DB #02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0,#00,#00,#00,#02
    DB #F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 2 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_2:
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


; Sprite 0 line color table (mode 2): configured player sprite "player1 2 2"
bitmap_room_sprite_colors:
    DB #0F,#0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0F
    DB #0F,#0F,#0F,#0F,#0D,#0D,#4D,#0D,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0F,#0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B
    DB #0F,#0F,#0F,#0F,#0D,#0D,#4D,#0D,#0D,#0F,#0F,#0F,#4D,#4D,#4D,#0F
    DB #0F,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0B,#0D,#0F
    DB #0F,#0F,#0F,#0D,#0D,#4D,#0D,#0D,#0F,#0F,#0F,#0F,#4D,#4D,#0F,#0F

bitmap_room_sprite_colors_end:

; SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing
bitmap_room_sprite_attrs:
    DB #60,#80,#00,#00,#60,#80,#04,#00,#D8,#00,#00,#00

bitmap_room_sprite_attrs_end:

; Sprite 0 pattern (16x16, mode 2 quadrants): configured player sprite "player1 2 2"
bitmap_room_sprite_patterns:
    DB #00,#00,#1F,#3F,#38,#77,#6E,#6E,#CF,#C7,#07,#03,#06,#07,#03,#07
    DB #00,#00,#80,#F0,#20,#C0,#C0,#40,#E0,#E0,#C0,#80,#00,#00,#C0,#C0
    DB #00,#00,#00,#00,#07,#08,#10,#10,#00,#00,#00,#00,#00,#00,#04,#00
    DB #00,#00,#00,#00,#C0,#00,#80,#80,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#1F,#3F,#30,#67,#4E,#4E,#CF,#87,#07,#23,#B2,#9C,#80,#00
    DB #00,#00,#80,#E0,#30,#C0,#C0,#40,#E0,#E0,#C0,#80,#02,#82,#E2,#20
    DB #00,#00,#00,#00,#0F,#10,#20,#20,#20,#00,#00,#C0,#C0,#C0,#C0,#00
    DB #00,#00,#00,#00,#C0,#00,#80,#80,#00,#00,#00,#00,#02,#0E,#1E,#1C
    DB #00,#1F,#3F,#38,#77,#6E,#CE,#CF,#87,#87,#03,#12,#5C,#40,#18,#18
    DB #00,#00,#E0,#30,#C0,#C0,#40,#E0,#E0,#C0,#80,#00,#80,#E0,#E0,#E0
    DB #00,#00,#00,#07,#08,#10,#30,#20,#00,#00,#00,#00,#60,#70,#20,#00
    DB #00,#00,#00,#C0,#00,#80,#80,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#01,#0F,#04,#03,#03,#02,#07,#07,#03,#01,#00,#00,#03,#03
    DB #00,#00,#F8,#FC,#1C,#EE,#76,#76,#F3,#E3,#E0,#C0,#60,#E0,#C0,#E0
    DB #00,#00,#00,#00,#03,#00,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#E0,#10,#08,#08,#00,#00,#00,#00,#00,#00,#20,#00
    DB #00,#00,#01,#07,#0C,#03,#03,#02,#07,#07,#03,#01,#40,#41,#47,#04
    DB #00,#00,#F8,#FC,#0C,#E6,#72,#72,#F3,#E1,#E0,#C4,#4D,#39,#01,#00
    DB #00,#00,#00,#00,#03,#00,#01,#01,#00,#00,#00,#00,#40,#70,#78,#38
    DB #00,#00,#00,#00,#F0,#08,#04,#04,#04,#00,#00,#03,#03,#03,#03,#00
    DB #00,#00,#07,#0C,#03,#03,#02,#07,#07,#03,#01,#00,#01,#07,#07,#07
    DB #00,#F8,#FC,#1C,#EE,#76,#73,#F3,#E1,#E1,#C0,#48,#3A,#02,#18,#18
    DB #00,#00,#00,#03,#00,#01,#01,#00,#00,#00,#00,#00,#00,#08,#08,#00
    DB #00,#00,#00,#E0,#10,#08,#0C,#04,#00,#00,#00,#00,#06,#0E,#04,#00

bitmap_room_sprite_patterns_end:


    ds #C000 - $, #FF

    end
