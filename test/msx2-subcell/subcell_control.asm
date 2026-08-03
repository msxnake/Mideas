; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap room backend (V9938 Graphic 4 command engine)
; Project: msx2_subcell_shape_smoke
; Room: Bitmap Room Smoke
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

; --- AIR DASH skill runtime state (4 bytes) ---
bitmap_air_dash_timer     EQU #C0DA
bitmap_air_dash_cooldown  EQU #C0DB
bitmap_air_dash_lock      EQU #C0DC
bitmap_air_dash_direction EQU #C0DD

; --- GLIDE skill runtime state (2 bytes) ---
bitmap_glide_stamina EQU #C0DE
bitmap_glide_active  EQU #C0DF

; --- WALL JUMP skill runtime state (4 bytes) ---
bitmap_wall_slide_side       EQU #C0E0
bitmap_wall_jump_lock_timer  EQU #C0E1
bitmap_wall_jump_lock_vx     EQU #C0E2
bitmap_wall_jump_key_lock    EQU #C0E3

; --- POWER STOMP skill runtime state (2 bytes) ---
bitmap_stomp_active     EQU #C0E4
bitmap_stomp_cooldown   EQU #C0E5
bitmap_shake_timer       EQU #C0E6










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
    ld a, #24                 ; SFX channel-C mixer shadow: start muted
    ld (psg_sfx_r7_c_bits), a
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
    ld a, 96
    ld (player_y), a
    ld a, 48
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
    ld (bitmap_air_dash_timer), a
    ld (bitmap_air_dash_cooldown), a
    ld (bitmap_air_dash_lock), a
    ld (bitmap_air_dash_direction), a
    ld a, #64
    ld (bitmap_glide_stamina), a
    xor a
    ld (bitmap_glide_active), a
    ld a, #FF
    ld (bitmap_wall_slide_side), a
    xor a
    ld (bitmap_wall_jump_lock_timer), a
    ld (bitmap_wall_jump_lock_vx), a
    ld (bitmap_wall_jump_key_lock), a
    xor a
    ld (bitmap_stomp_active), a
    ld (bitmap_stomp_cooldown), a
    ld (bitmap_shake_timer), a
    ld a, #12
    ld e, #00
    call vdp_write_register
    xor a
bitmap_enter_game_loop:
    ; Game Flow exit gate: when the deadly/enemy damage system arms
    ; bitmap_game_over_flag (last life spent), leave the gameplay loop. With a
    ; Game Flow graph, ret returns to the dispatcher (which follows the WorldLink
    ; connection, e.g. to an End:GameOver node). Without a graph, soft-restart.
    ld a, (bitmap_game_over_flag)
    or a
    jp nz, init_rom    ; standalone: last life -> soft restart
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
    ; ---- logic phase: safe during active display ----
    call step_room_composition
    jp c, .skip_player_movement
    call bitmap_try_start_air_dash
    call bitmap_step_air_dash_movement
    jp c, .skip_player_movement
    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
.skip_player_movement:
    call bitmap_screen_shake_update
    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)
    call update_hud_hearts    ; redraw hearts HUD when player_health changes
    jp .bitmap_main_loop


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
    ld a, 174
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
    call bitmap_wall_jump_frame_gate
    pop bc
    jp c, .apply_gravity
    push bc
    call bitmap_power_stomp_frame_gate
    pop bc
    jp c, .apply_gravity


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
    ld a, #FA              ; -6 px/frame initial jump velocity (Player Config jumpPower)
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
    cp 1              ; terminal fall speed px/frame (Player Config maxFallSpeed)
    jp z, .after_gravity_tick                   ; already terminal: keep frac frozen
    ld a, (player_vy_frac)
    add a, 16              ; gravityStrength88 low byte (0.25 px/frame^2 default)
    ld (player_vy_frac), a
    jp nc, .after_gravity_tick                  ; fraction did not carry -> vy unchanged this frame
    ld a, (player_vy)                           ; carry: nudge vy 1 px towards terminal
    inc a
    ld (player_vy), a
.after_gravity_tick:
    call bitmap_apply_glide_clamp
    call bitmap_wall_jump_slide_clamp
    call bitmap_step_stomp_fall

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
    call bitmap_wall_jump_clear_lock
    call bitmap_stomp_on_land

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
    cp 7
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
    add a, a
    add a, a
    add a, a

    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp nz, .store_player_pattern
    add a, 16
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
    ; collision box is not solid. Hitbox: x=0, y=0,
    ; w=16, h=16. Probes Y rows 0/8/15
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
    add a, 15
    jp .x_have_edge
.x_left_edge:
.x_have_edge:
    ld b, a                 ; B = probe X (hitbox leading edge; preserved by probe_solid)
    ld a, (player_y)
    ld c, a                 ; C = probe Y (+0)
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
    add a, 8
    ld c, a                 ; C = probe Y (+8)
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
    add a, 15
    ld c, a                 ; C = probe Y (+15)
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
    ; blocked. Probes X cols 0/8/15. Clobbers AF/BC/DE/HL.
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
    add a, 15
    jp .y_have_edge
.y_up_edge:
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
    ld b, a                 ; B = probe X (+0)
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
    add a, 8
    ld b, a                 ; B = probe X (+8)
    call bitmap_probe_solid
    jp nz, .y_blocked
.y_probe_1_skip:
    ld a, c
    cp 192
    jp c, .y_probe_2_visible
    pop af
    push af
    cp 192
    jp nc, .y_probe_2_skip
.y_probe_2_visible:
    ld a, (player_x)
    add a, 15
    ld b, a                 ; B = probe X (+15)
    call bitmap_probe_solid
    jp nz, .y_blocked
.y_probe_2_skip:
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
; FUNCTION: bitmap_air_dash_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the configured air_dash input (N) via PPI.
; INPUT: none.
; OUTPUT: A = 1 when pressed, A = 0 otherwise (Z set when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 4 on PPI_C. update_player_movement
;   re-selects row 8 next frame, so the transient selection is safe.
; ------------------------------------------------------------
bitmap_air_dash_pressed:
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
; FUNCTION: bitmap_air_dash_release_lock
; ------------------------------------------------------------
; PURPOSE: Clears the requireKeyRelease lock once the air_dash key is released.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_air_dash_pressed.
; SIDE EFFECTS: Updates bitmap_air_dash_lock in RAM.
; ------------------------------------------------------------
bitmap_air_dash_release_lock:
    call bitmap_air_dash_pressed
    or a
    ret nz
    xor a
    ld (bitmap_air_dash_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_air_dash_cooldown
; ------------------------------------------------------------
; PURPOSE: Decrements the air_dash cooldown when active.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_air_dash_cooldown:
    ld a, (bitmap_air_dash_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_air_dash_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_air_dash_grounded
; ------------------------------------------------------------
; PURPOSE: True when a solid 16x16 cell sits directly below the player feet.
; INPUT: player_x, player_y. OUTPUT: A = 1 grounded, A = 0 airborne (Z when airborne).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_air_dash_grounded:
    ld a, (player_x)
    add a, 8
    ld b, a
    ld a, (player_y)
    add a, 16
    ld c, a
    call bitmap_probe_solid
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_air_dash_airborne
; ------------------------------------------------------------
; PURPOSE: Returns true when the player is not grounded.
; INPUT: player_flags plus player_x/player_y for the direct foot probe.
; OUTPUT: A=1 airborne, A=0 grounded (Z when grounded).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_air_dash_grounded.
; NOTES: The cached grounded flag wins when set; otherwise bitmap_air_dash_grounded
;   probes the current collision map under the player's feet.
; ------------------------------------------------------------
bitmap_air_dash_airborne:
    ld a, (player_flags)
    bit 0, a
    jp nz, .air_dash_grounded
    call bitmap_air_dash_grounded
    or a
    jp nz, .air_dash_grounded
    ld a, 1
    ret
.air_dash_grounded:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_air_dash
; ------------------------------------------------------------
; PURPOSE: Ticks cooldown/lock and arms an air dash when input, cooldown and
;   airborne state allow it. Direction is latched from player_facing.
; INPUT: none.
; OUTPUT: bitmap_air_dash_timer > 0 when started.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_tick_air_dash_cooldown, bitmap_air_dash_release_lock,
;   bitmap_air_dash_airborne, bitmap_air_dash_pressed.
; SIDE EFFECTS: Updates air_dash RAM and clears vertical velocity for the burst.
; ------------------------------------------------------------
bitmap_try_start_air_dash:
    call bitmap_tick_air_dash_cooldown
    ld a, (bitmap_air_dash_timer)
    or a
    ret nz
    call bitmap_air_dash_release_lock
    call bitmap_air_dash_airborne
    or a
    jp z, .air_dash_start_blocked
    call bitmap_air_dash_pressed
    or a
    jp z, .air_dash_start_blocked
    ld a, (bitmap_air_dash_lock)
    or a
    jp nz, .air_dash_start_blocked
    ld a, (bitmap_air_dash_cooldown)
    or a
    jp nz, .air_dash_start_blocked
    ld a, (player_facing)
    ld (bitmap_air_dash_direction), a
    ld a, #06
    ld (bitmap_air_dash_timer), a
    ld a, #14
    ld (bitmap_air_dash_cooldown), a
    ld a, 1
    ld (bitmap_air_dash_lock), a
    xor a
    ld (player_vy), a
    ret
.air_dash_start_blocked:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_air_dash_movement
; ------------------------------------------------------------
; PURPOSE: Advances an active air dash. Moves 6 px horizontally
;   via 1px bitmap_try_move_x steps and skips normal gravity this frame.
; INPUT: bitmap_air_dash_timer/direction.
; OUTPUT: Carry SET when air_dash consumed this frame; carry CLEAR when idle.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_try_move_x.
; SIDE EFFECTS: Updates player_x and decrements bitmap_air_dash_timer.
; NOTES: bitmap_try_move_x clobbers BC, so the loop counter is wrapped with
;   PUSH/POP BC on every pixel step.
; ------------------------------------------------------------
bitmap_step_air_dash_movement:
    ld a, (bitmap_air_dash_timer)
    or a
    jp z, .air_dash_idle
    dec a
    ld (bitmap_air_dash_timer), a
    xor a
    ld (player_vy), a
    ld a, (bitmap_air_dash_direction)
    or a
    jp z, .air_dash_step_left
.air_dash_step_right:
    ld b, 6
.air_dash_right_loop:
    push bc
    ld a, #01
    call bitmap_try_move_x
    pop bc
    djnz .air_dash_right_loop
    scf
    ret
.air_dash_step_left:
    ld b, 6
.air_dash_left_loop:
    push bc
    ld a, #FF
    call bitmap_try_move_x
    pop bc
    djnz .air_dash_left_loop
    scf
    ret
.air_dash_idle:
    or a
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_glide_jump_pressed
; ------------------------------------------------------------
; PURPOSE: Reads row 8 jump inputs (SPACE or UP) directly from the PPI.
; INPUT: none.
; OUTPUT: A = 1 when SPACE/UP is pressed, A = 0 otherwise (Z set when none).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 8 on PPI_C, matching update_player_movement.
; ------------------------------------------------------------
bitmap_glide_jump_pressed:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #21
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_glide_clamp
; ------------------------------------------------------------
; PURPOSE: While airborne and holding jump, caps downward player_vy at glideSpeed.
;   glideSpeed=0 creates a hover/floating fall cap.
; INPUT: player_flags bit 0 grounded flag, player_vy signed byte.
; OUTPUT: player_vy clamped when falling faster than glideSpeed;
;   bitmap_glide_active set to 1 only on frames where glide input is accepted.
; DESTROYS: AF, BC. PRESERVES: DE, HL, IX, IY.
; CALLS: bitmap_glide_jump_pressed.
; SIDE EFFECTS: Updates bitmap_glide_active and optionally bitmap_glide_stamina.
; NOTES: Only positive/downward velocity is capped. Negative upward velocity is
;   preserved so glide cannot cancel an active jump ascent. No PUSH/POP required:
;   BC is intentionally volatile and no caller-owned loop counter is live here.
; ------------------------------------------------------------
bitmap_apply_glide_clamp:
    ld a, (player_flags)
    bit 0, a
    jp nz, .glide_grounded
    call bitmap_glide_jump_pressed
    or a
    jp z, .glide_inactive
    ld a, (bitmap_glide_stamina)
    or a
    jp z, .glide_inactive
    dec a
    ld (bitmap_glide_stamina), a
    ld a, (player_vy)
    bit 7, a
    jp nz, .glide_set_active
    ld b, a
    ld a, #01
    or a
    jp z, .glide_float
    cp b
    jp c, .glide_cap_store
.glide_set_active:
    ld a, 1
    ld (bitmap_glide_active), a
    ret
.glide_cap_store:
    ld (player_vy), a
    ld a, 1
    ld (bitmap_glide_active), a
    ret
.glide_float:
    xor a
    ld (player_vy), a
    ld a, 1
    ld (bitmap_glide_active), a
    ret
.glide_grounded:
    ld a, #64
    ld (bitmap_glide_stamina), a
.glide_inactive:
    xor a
    ld (bitmap_glide_active), a
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_row8_pressed
; ------------------------------------------------------------
; PURPOSE: Reads row 8 movement/jump inputs directly from PPI.
; INPUT: none.
; OUTPUT: A = row 8 pressed mask after CPL (bit7 right, bit4 left, bit5 up, bit0 SPACE).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 8 on PPI_C.
; ------------------------------------------------------------
bitmap_wall_jump_row8_pressed:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_jump_pressed
; ------------------------------------------------------------
; PURPOSE: Returns true when SPACE or UP is pressed.
; INPUT: none.
; OUTPUT: A = 1 when pressed, A = 0 otherwise (Z set when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_wall_jump_row8_pressed.
; ------------------------------------------------------------
bitmap_wall_jump_jump_pressed:
    call bitmap_wall_jump_row8_pressed
    and #21
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_release_lock
; ------------------------------------------------------------
; PURPOSE: Clears the requireKeyRelease lock once the jump key is released.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_wall_jump_jump_pressed.
; SIDE EFFECTS: Updates bitmap_wall_jump_key_lock.
; ------------------------------------------------------------
bitmap_wall_jump_release_lock:
    call bitmap_wall_jump_jump_pressed
    or a
    ret nz
    xor a
    ld (bitmap_wall_jump_key_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_clear_lock
; ------------------------------------------------------------
; PURPOSE: Clears all wall_jump runtime state except the key release lock.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Updates wall_jump RAM.
; ------------------------------------------------------------
bitmap_wall_jump_clear_lock:
    ld a, #FF
    ld (bitmap_wall_slide_side), a
    xor a
    ld (bitmap_wall_jump_lock_timer), a
    ld (bitmap_wall_jump_lock_vx), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_detect_contact
; ------------------------------------------------------------
; PURPOSE: Detects initial wall contact only when the player is airborne and
;   holding the direction into that wall. Uses bitmap_probe_solid at mid-body.
; INPUT: player_x/player_y/player_flags plus row 8 keyboard state.
; OUTPUT: A = 0 left wall, A = 1 right wall, A = #FF none.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_wall_jump_row8_pressed, bitmap_probe_solid.
; NOTES: Left probe uses X-2 and right probe uses X+17, matching the 2px
;   horizontal platform step that stops short of solid tiles.
; ------------------------------------------------------------
bitmap_wall_jump_detect_contact:
    ld a, (player_flags)
    bit 0, a
    jp nz, .wall_detect_none
    call bitmap_wall_jump_row8_pressed
    ld d, a
    bit 4, d
    jp z, .wall_detect_right
    ld a, (player_x)
    cp 2
    jp c, .wall_detect_right
    sub 2
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_detect_right
    xor a
    ret
.wall_detect_right:
    bit 7, d
    jp z, .wall_detect_none
    ld a, (player_x)
    add a, 17
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_detect_none
    ld a, 1
    ret
.wall_detect_none:
    ld a, #FF
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_detect_any_contact
; ------------------------------------------------------------
; PURPOSE: Detects wall contact after the wall_jump chain has started, without
;   requiring the player to hold direction toward the wall. Probe order follows
;   the previous kick direction so narrow two-wall gaps prefer the wall just hit.
; INPUT: player_x/player_y/player_flags/bitmap_wall_jump_lock_vx.
; OUTPUT: A = 0 left wall, A = 1 right wall, A = #FF none.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; NOTES: Only valid while airborne; grounded state returns #FF.
; ------------------------------------------------------------
bitmap_wall_jump_detect_any_contact:
    ld a, (player_flags)
    bit 0, a
    jp nz, .wall_any_none
    ld a, (bitmap_wall_jump_lock_vx)
    bit 7, a
    jp nz, .wall_any_left_first
.wall_any_right_first:
    call bitmap_wall_jump_probe_right
    cp #FF
    ret nz
    call bitmap_wall_jump_probe_left
    ret
.wall_any_left_first:
    call bitmap_wall_jump_probe_left
    cp #FF
    ret nz
    call bitmap_wall_jump_probe_right
    ret
.wall_any_none:
    ld a, #FF
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_probe_left
; ------------------------------------------------------------
; PURPOSE: Tests the wall_jump left-side mid-body probe.
; INPUT: player_x/player_y.
; OUTPUT: A = 0 when the left wall is solid, A = #FF otherwise.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_wall_jump_probe_left:
    ld a, (player_x)
    cp 2
    jp c, .wall_probe_left_near
    sub 2
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_probe_left_near
    xor a
    ret
.wall_probe_left_near:
    ld a, (player_x)
    add a, 2
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_probe_left_none
    xor a
    ret
.wall_probe_left_none:
    ld a, #FF
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_probe_right
; ------------------------------------------------------------
; PURPOSE: Tests the wall_jump right-side mid-body probe.
; INPUT: player_x/player_y.
; OUTPUT: A = 1 when the right wall is solid, A = #FF otherwise.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_wall_jump_probe_right:
    ld a, (player_x)
    add a, 17
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_probe_right_near
    ld a, 1
    ret
.wall_probe_right_near:
    ld a, (player_x)
    add a, 13
    ld b, a
    ld a, (player_y)
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    jp z, .wall_probe_right_none
    ld a, 1
    ret
.wall_probe_right_none:
    ld a, #FF
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_slide_clamp
; ------------------------------------------------------------
; PURPOSE: Caps downward player_vy while wall_slide is active.
; INPUT: bitmap_wall_slide_side, player_flags, player_vy.
; OUTPUT: player_vy clamped to wallSlideSpeed when falling faster than the cap.
; DESTROYS: AF, B. PRESERVES: C, DE, HL, IX, IY.
; SIDE EFFECTS: Updates player_vy.
; NOTES: Only positive/downward velocity is capped; upward jump velocity is preserved.
; ------------------------------------------------------------
bitmap_wall_jump_slide_clamp:
    ld a, (bitmap_wall_slide_side)
    cp #FF
    ret z
    ld a, (player_flags)
    bit 0, a
    ret nz
    ld a, (player_vy)
    bit 7, a
    ret nz
    ld b, a
    ld a, #01
    cp b
    jp c, .wall_slide_cap_store
    ret
.wall_slide_cap_store:
    ld (player_vy), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_wall_jump_kick
; ------------------------------------------------------------
; PURPOSE: Starts a wall_jump kick when wall_slide is active and jump is pressed.
; INPUT: bitmap_wall_slide_side; player_vy.
; OUTPUT: player_vy receives upward impulse; lock_vx/timer armed.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_wall_jump_jump_pressed.
; SIDE EFFECTS: Updates wall_jump RAM and player_vy.
; ------------------------------------------------------------
bitmap_try_wall_jump_kick:
    ld a, (bitmap_wall_slide_side)
    cp #FF
    ret z
    ld a, (player_flags)
    bit 0, a
    ret nz
    call bitmap_wall_jump_jump_pressed
    or a
    jp z, .wall_kick_blocked
    ld a, (bitmap_wall_jump_key_lock)
    or a
    jp nz, .wall_kick_blocked
    ; Also honor the normal jump's requireKeyRelease lock. A ground (or air)
    ; jump arms player_jump_lock until the key is released. Without this check,
    ; jumping right next to a wall fires a wall_jump on the very next frame
    ; (the player was practically still on the ground) instead of waiting for a
    ; fresh press of the jump button.
    ld a, (player_jump_lock)
    or a
    jp nz, .wall_kick_blocked
    ld a, #FA
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the kick impulse is not clipped by a stale carry
    ld a, (bitmap_wall_slide_side)
    or a
    jp z, .wall_kick_push_right
    ld a, #04
    cpl
    inc a
    jp .wall_kick_store_vx
.wall_kick_push_right:
    ld a, #04
.wall_kick_store_vx:
    ld (bitmap_wall_jump_lock_vx), a
    ld a, #FF
    ld (bitmap_wall_jump_lock_timer), a
    ld a, 1
    ld (bitmap_wall_jump_key_lock), a
    ld a, #FF
    ld (bitmap_wall_slide_side), a
    ret
.wall_kick_blocked:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_wall_jump_lock
; ------------------------------------------------------------
; PURPOSE: While lock_timer is active, moves horizontally by |lock_vx| pixels
;   this frame using bitmap_try_move_x one pixel at a time.
; INPUT: bitmap_wall_jump_lock_timer (#FF = moving, 1 = chain armed, 0 = idle),
;   bitmap_wall_jump_lock_vx.
; OUTPUT: player_x advanced; carry is not used by caller.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_try_move_x.
; SIDE EFFECTS: Updates player_x and may set lock_timer=1 when blocked.
; NOTES: bitmap_try_move_x clobbers BC, so each pixel step wraps BC with PUSH/POP.
;   The compare against the previous X detects blocked movement because
;   bitmap_try_move_x does not return carry on X blockage.
; ------------------------------------------------------------
bitmap_step_wall_jump_lock:
    ld a, (bitmap_wall_jump_lock_timer)
    cp #FF
    ret nz
    ld a, (player_flags)
    bit 0, a
    jp nz, bitmap_wall_jump_clear_lock
    ld a, (bitmap_wall_jump_lock_vx)
    bit 7, a
    jp nz, .wall_lock_left_setup
.wall_lock_right_setup:
    ld a, 1
    ld (player_facing), a
    ld a, (bitmap_wall_jump_lock_vx)
    ld b, a
.wall_lock_right_loop:
    push bc
    ld a, (player_x)
    ld e, a
    ld a, #01
    call bitmap_try_move_x
    ld a, (player_x)
    cp e
    pop bc
    jp z, .wall_lock_stop
    djnz .wall_lock_right_loop
    ret
.wall_lock_left_setup:
    xor a
    ld (player_facing), a
    ld a, (bitmap_wall_jump_lock_vx)
    cpl
    inc a
    ld b, a
.wall_lock_left_loop:
    push bc
    ld a, (player_x)
    ld e, a
    ld a, #FF
    call bitmap_try_move_x
    ld a, (player_x)
    cp e
    pop bc
    jp z, .wall_lock_stop
    djnz .wall_lock_left_loop
    ret
.wall_lock_stop:
    ld a, 1
    ld (bitmap_wall_jump_lock_timer), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_wall_jump_frame_gate
; ------------------------------------------------------------
; PURPOSE: Per-frame wall_jump gate: release key lock, step active kick,
;   detect wall contact, then try a new kick. The first contact requires holding
;   direction into the wall; after one valid wall_jump, chained jumps only need
;   the jump button while airborne and touching a wall.
; INPUT: none.
; OUTPUT: Carry SET while the committed kick movement is active and normal
;   horizontal input must skip; carry CLEAR otherwise.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_wall_jump_release_lock, bitmap_step_wall_jump_lock,
;   bitmap_wall_jump_detect_contact, bitmap_wall_jump_detect_any_contact,
;   bitmap_try_wall_jump_kick, bitmap_wall_jump_clear_lock.
; SIDE EFFECTS: Updates wall_jump RAM and player position/velocity.
; ------------------------------------------------------------
bitmap_wall_jump_frame_gate:
    call bitmap_wall_jump_release_lock
    call bitmap_step_wall_jump_lock
    ld a, (player_flags)
    bit 0, a
    jp z, .wall_gate_airborne
    call bitmap_wall_jump_clear_lock
    jp .wall_gate_no_skip
.wall_gate_airborne:
    ld a, (bitmap_wall_jump_lock_timer)
    cp #FF
    jp z, .wall_gate_active_skip
    or a
    jp z, .wall_gate_initial_detect
    call bitmap_wall_jump_detect_any_contact
    jp .wall_gate_store_contact
.wall_gate_initial_detect:
    call bitmap_wall_jump_detect_contact
.wall_gate_store_contact:
    ld (bitmap_wall_slide_side), a
    call bitmap_try_wall_jump_kick
    ld a, (bitmap_wall_jump_lock_timer)
    cp #FF
    jp nz, .wall_gate_no_skip
.wall_gate_active_skip:
    ld a, (bitmap_wall_jump_lock_vx)
    or a
    jp z, .wall_gate_no_skip
    scf
    ret
.wall_gate_no_skip:
    or a
    ret


; ------------------------------------------------------------
; FUNCTION: bitmap_power_stomp_combo_pressed
; ------------------------------------------------------------
; PURPOSE: Reads DOWN+M directly from the keyboard matrix.
; INPUT: none.
; OUTPUT: A=1 when both DOWN and M are pressed; A=0 otherwise (Z when false).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 8, then row 2, on PPI_C.
; ------------------------------------------------------------
bitmap_power_stomp_combo_pressed:
    in a, (PPI_C)
    and #F0
    or #08
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #40
    ret z
    in a, (PPI_C)
    and #F0
    or #02
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_stomp_cooldown
; ------------------------------------------------------------
; PURPOSE: Decrements the power_stomp cooldown when non-zero.
; INPUT: bitmap_stomp_cooldown.
; OUTPUT: bitmap_stomp_cooldown decremented when active.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_stomp_cooldown:
    ld a, (bitmap_stomp_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_stomp_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_stomp
; ------------------------------------------------------------
; PURPOSE: Starts a power_stomp when airborne, off cooldown, and DOWN+M is held.
; INPUT: player_flags, bitmap_stomp_active/cooldown, keyboard matrix.
; OUTPUT: bitmap_stomp_active=1 and player_vy pinned to stompSpeed when started.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_tick_stomp_cooldown, bitmap_power_stomp_combo_pressed.
; ------------------------------------------------------------
bitmap_try_start_stomp:
    call bitmap_tick_stomp_cooldown
    ld a, (bitmap_stomp_active)
    or a
    ret nz
    ld a, (player_flags)
    bit 0, a
    ret nz
    ld a, (bitmap_stomp_cooldown)
    or a
    ret nz
    call bitmap_power_stomp_combo_pressed
    or a
    ret z
    ld a, 1
    ld (bitmap_stomp_active), a
    ld a, #14
    ld (bitmap_stomp_cooldown), a
    ld a, #0C
    ld (player_vy), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_stomp_fall
; ------------------------------------------------------------
; PURPOSE: While active, re-pins player_vy to stompSpeed after gravity.
; INPUT: bitmap_stomp_active.
; OUTPUT: player_vy = stompSpeed when stomping.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_step_stomp_fall:
    ld a, (bitmap_stomp_active)
    or a
    ret z
    ld a, #0C
    ld (player_vy), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_stomp_on_land
; ------------------------------------------------------------
; PURPOSE: Clears an active power_stomp on landing and optionally starts shake.
; INPUT: bitmap_stomp_active.
; OUTPUT: bitmap_stomp_active=0; bitmap_shake_timer armed when enabled.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_screen_shake_trigger when screenShake is enabled.
; ------------------------------------------------------------
bitmap_stomp_on_land:
    ld a, (bitmap_stomp_active)
    or a
    ret z
    xor a
    ld (bitmap_stomp_active), a
    call bitmap_screen_shake_trigger
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_power_stomp_frame_gate
; ------------------------------------------------------------
; PURPOSE: Ticks/starts power_stomp and reports whether normal horizontal input
;   should skip this frame.
; INPUT: none.
; OUTPUT: Carry SET when power_stomp is active; carry CLEAR otherwise.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_try_start_stomp.
; ------------------------------------------------------------
bitmap_power_stomp_frame_gate:
    call bitmap_try_start_stomp
    ld a, (bitmap_stomp_active)
    or a
    jp z, .power_stomp_idle
    scf
    ret
.power_stomp_idle:
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_screen_shake_trigger
; ------------------------------------------------------------
; PURPOSE: Arms the SCREEN 5 shake timer used by bitmap_screen_shake_update.
; INPUT: none.
; OUTPUT: bitmap_shake_timer = 5.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_screen_shake_trigger:
    ld a, #05
    ld (bitmap_shake_timer), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_screen_shake_update
; ------------------------------------------------------------
; PURPOSE: Writes one V9938 R#18 display-adjust step per frame and decrements
;   bitmap_shake_timer. The final table entry writes #00 so the display returns
;   to neutral.
; INPUT: bitmap_shake_timer.
; OUTPUT: V9938 R#18 updated; bitmap_shake_timer decremented.
; DESTROYS: AF, BC, E, HL. PRESERVES: D, IX, IY.
; CALLS: vdp_write_register.
; ------------------------------------------------------------
bitmap_screen_shake_update:
    ld a, (bitmap_shake_timer)
    or a
    ret z
    dec a
    ld (bitmap_shake_timer), a
    ld hl, bitmap_shake_decay_table
    ld c, a
    ld b, 0
    add hl, bc
    ld e, (hl)
    ld a, #12
    call vdp_write_register
    ret

bitmap_shake_decay_table:
    db #00, #F0, #10, #F0, #20













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
    ld b, a
    call bitmap_probe_deadly
    jp nz, .deadly_take_damage
    ld a, (player_x)
    add a, 7
    ld b, a
    call bitmap_probe_deadly
    jp nz, .deadly_take_damage
    ld a, (player_x)
    add a, 15
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
    DB #00,#00,#00,#00,#11,#06,#33,#07,#17,#01,#27,#03,#51,#01,#27,#06
    DB #71,#01,#73,#03,#61,#06,#64,#06,#11,#04,#65,#02,#55,#05,#77,#07

bitmap_room_hud_seed_data:
; Persistent 256x20 HUD seed mirrored on page 0/1, packed 4bpp RLE
; Raw bytes: 5120; encoded bytes: 1064
; VRAM #00000, raw 2560 bytes, RLE 532 bytes
bitmap_room_hud_seed_p0_rle_chunk_0:
    DB #FF,#11,#FF,#11,#07,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#05,#11,#01,#1F,#01,#F1,#4A,#11,#01,#1B,#01,#B1,#02,#11
    DB #02,#BB,#02,#11,#02,#BB,#11,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#07,#11,#01,#FF,#01,#F1,#05,#11
    DB #1C,#FF,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#BB,#01,#B1,#01,#11
    DB #01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1
    DB #10,#11,#01,#1F,#01,#F1,#03,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #07,#11,#01,#1F,#01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4,#06,#44
    DB #01,#4F,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1,#01,#11
    DB #01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#BB,#01,#B1
    DB #11,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#FF,#01,#F1,#01,#1F,#02,#FF
    DB #06,#11,#01,#1F,#01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4,#06,#44
    DB #01,#4F,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1,#02,#11
    DB #02,#BB,#01,#11,#01,#1B,#01,#BB,#01,#1B,#01,#B1,#12,#11,#01,#1F
    DB #01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#02,#FF,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#07,#11,#01,#1F
    DB #01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4,#06,#44,#01,#4F,#08,#11
    DB #01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1,#01,#11,#01,#1B,#01,#B1
    DB #01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#10,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#07,#11,#01,#1F,#01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4
    DB #06,#44,#01,#4F,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1
    DB #01,#11,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B
    DB #01,#B1,#11,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#04,#11,#01,#1F,#02,#FF,#01,#F1,#04,#11,#1C,#FF,#08,#11
    DB #01,#1F,#03,#FF,#1C,#11,#01,#1B,#02,#BB,#01,#B1,#01,#11,#02,#BB
    DB #02,#11,#02,#BB,#55,#11,#01,#1F,#03,#FF,#FF,#11,#FF,#11,#FF,#11
    DB #B7,#11,#80,#FF
bitmap_room_hud_seed_p0_rle_chunk_0_end:
; VRAM #08000, raw 2560 bytes, RLE 532 bytes
bitmap_room_hud_seed_p1_rle_chunk_0:
    DB #FF,#11,#FF,#11,#07,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#05,#11,#01,#1F,#01,#F1,#4A,#11,#01,#1B,#01,#B1,#02,#11
    DB #02,#BB,#02,#11,#02,#BB,#11,#11,#01,#1F,#01,#F1,#01,#1F,#01,#F1
    DB #01,#11,#01,#1F,#01,#F1,#02,#11,#02,#FF,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#07,#11,#01,#FF,#01,#F1,#05,#11
    DB #1C,#FF,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#BB,#01,#B1,#01,#11
    DB #01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1
    DB #10,#11,#01,#1F,#01,#F1,#03,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#02,#11,#01,#1F,#01,#F1
    DB #07,#11,#01,#1F,#01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4,#06,#44
    DB #01,#4F,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1,#01,#11
    DB #01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#BB,#01,#B1
    DB #11,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#FF,#01,#F1,#01,#1F,#02,#FF
    DB #06,#11,#01,#1F,#01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4,#06,#44
    DB #01,#4F,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1,#02,#11
    DB #02,#BB,#01,#11,#01,#1B,#01,#BB,#01,#1B,#01,#B1,#12,#11,#01,#1F
    DB #01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F,#02,#FF,#01,#F1
    DB #01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#07,#11,#01,#1F
    DB #01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4,#06,#44,#01,#4F,#08,#11
    DB #01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1,#01,#11,#01,#1B,#01,#B1
    DB #01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#10,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F,#01,#F1,#01,#1F
    DB #01,#F1,#07,#11,#01,#1F,#01,#F1,#05,#11,#01,#FA,#13,#AA,#01,#A4
    DB #06,#44,#01,#4F,#08,#11,#01,#1F,#03,#FF,#1D,#11,#01,#1B,#01,#B1
    DB #01,#11,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B,#01,#B1,#01,#1B
    DB #01,#B1,#11,#11,#02,#FF,#02,#11,#01,#1F,#01,#F1,#01,#11,#01,#1F
    DB #01,#F1,#01,#1F,#01,#F1,#01,#11,#02,#FF,#01,#11,#01,#1F,#02,#FF
    DB #01,#F1,#04,#11,#01,#1F,#02,#FF,#01,#F1,#04,#11,#1C,#FF,#08,#11
    DB #01,#1F,#03,#FF,#1C,#11,#01,#1B,#02,#BB,#01,#B1,#01,#11,#02,#BB
    DB #02,#11,#02,#BB,#55,#11,#01,#1F,#03,#FF,#FF,#11,#FF,#11,#FF,#11
    DB #B7,#11,#80,#FF
bitmap_room_hud_seed_p1_rle_chunk_0_end:

bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
; Shared world tileset (atlas), packed 4bpp RLE, destination VRAM #10000
; Raw bytes: 2048; encoded bytes: 1006
; VRAM #10000, raw 2048 bytes, RLE 1006 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #40,#11,#40,#00,#01,#18,#03,#88,#01,#18,#02,#88,#01,#81,#01,#19
    DB #03,#99,#01,#19,#02,#99,#01,#91,#01,#1A,#03,#AA,#01,#1A,#02,#AA
    DB #01,#A1,#01,#1C,#03,#CC,#01,#1C,#02,#CC,#01,#C1,#01,#17,#03,#77
    DB #01,#17,#02,#77,#01,#71,#01,#15,#03,#55,#01,#15,#02,#55,#01,#51
    DB #01,#1D,#03,#DD,#01,#1D,#02,#DD,#01,#D1,#01,#1F,#03,#FF,#01,#1F
    DB #02,#FF,#01,#F1,#01,#00,#06,#FF,#39,#00,#01,#18,#03,#88,#01,#18
    DB #02,#88,#01,#81,#01,#19,#03,#99,#01,#19,#02,#99,#01,#91,#01,#1A
    DB #03,#AA,#01,#1A,#02,#AA,#01,#A1,#01,#1C,#03,#CC,#01,#1C,#02,#CC
    DB #01,#C1,#01,#17,#03,#77,#01,#17,#02,#77,#01,#71,#01,#15,#03,#55
    DB #01,#15,#02,#55,#01,#51,#01,#1D,#03,#DD,#01,#1D,#02,#DD,#01,#D1
    DB #01,#1F,#03,#FF,#01,#1F,#02,#FF,#01,#F1,#01,#00,#06,#FF,#39,#00
    DB #01,#18,#03,#88,#01,#18,#02,#88,#01,#81,#01,#19,#03,#99,#01,#19
    DB #02,#99,#01,#91,#01,#1A,#03,#AA,#01,#1A,#02,#AA,#01,#A1,#01,#1C
    DB #03,#CC,#01,#1C,#02,#CC,#01,#C1,#01,#17,#03,#77,#01,#17,#02,#77
    DB #01,#71,#01,#15,#03,#55,#01,#15,#02,#55,#01,#51,#01,#1D,#03,#DD
    DB #01,#1D,#02,#DD,#01,#D1,#01,#1F,#03,#FF,#01,#1F,#02,#FF,#01,#F1
    DB #01,#00,#01,#FF,#04,#AA,#01,#FF,#39,#00,#01,#18,#03,#88,#01,#18
    DB #02,#88,#01,#81,#01,#19,#03,#99,#01,#19,#02,#99,#01,#91,#01,#1A
    DB #03,#AA,#01,#1A,#02,#AA,#01,#A1,#01,#1C,#03,#CC,#01,#1C,#02,#CC
    DB #01,#C1,#01,#17,#03,#77,#01,#17,#02,#77,#01,#71,#01,#15,#03,#55
    DB #01,#15,#02,#55,#01,#51,#01,#1D,#03,#DD,#01,#1D,#02,#DD,#01,#D1
    DB #01,#1F,#03,#FF,#01,#1F,#02,#FF,#01,#F1,#01,#00,#01,#FF,#04,#AA
    DB #01,#FF,#39,#00,#01,#18,#03,#88,#01,#18,#02,#88,#01,#81,#01,#19
    DB #03,#99,#01,#19,#02,#99,#01,#91,#01,#1A,#03,#AA,#01,#1A,#02,#AA
    DB #01,#A1,#01,#1C,#03,#CC,#01,#1C,#02,#CC,#01,#C1,#01,#17,#03,#77
    DB #01,#17,#02,#77,#01,#71,#01,#15,#03,#55,#01,#15,#02,#55,#01,#51
    DB #01,#1D,#03,#DD,#01,#1D,#02,#DD,#01,#D1,#01,#1F,#03,#FF,#01,#1F
    DB #02,#FF,#01,#F1,#01,#00,#01,#FF,#01,#AA,#02,#DD,#01,#AA,#01,#FF
    DB #39,#00,#01,#18,#03,#88,#01,#18,#02,#88,#01,#81,#01,#19,#03,#99
    DB #01,#19,#02,#99,#01,#91,#01,#1A,#03,#AA,#01,#1A,#02,#AA,#01,#A1
    DB #01,#1C,#03,#CC,#01,#1C,#02,#CC,#01,#C1,#01,#17,#03,#77,#01,#17
    DB #02,#77,#01,#71,#01,#15,#03,#55,#01,#15,#02,#55,#01,#51,#01,#1D
    DB #03,#DD,#01,#1D,#02,#DD,#01,#D1,#01,#1F,#03,#FF,#01,#1F,#02,#FF
    DB #01,#F1,#01,#00,#01,#FF,#01,#AA,#02,#DD,#01,#AA,#01,#FF,#39,#00
    DB #01,#18,#03,#88,#01,#18,#02,#88,#01,#81,#01,#19,#03,#99,#01,#19
    DB #02,#99,#01,#91,#01,#1A,#03,#AA,#01,#1A,#02,#AA,#01,#A1,#01,#1C
    DB #03,#CC,#01,#1C,#02,#CC,#01,#C1,#01,#17,#03,#77,#01,#17,#02,#77
    DB #01,#71,#01,#15,#03,#55,#01,#15,#02,#55,#01,#51,#01,#1D,#03,#DD
    DB #01,#1D,#02,#DD,#01,#D1,#01,#1F,#03,#FF,#01,#1F,#02,#FF,#01,#F1
    DB #01,#00,#01,#FF,#01,#AA,#02,#DD,#01,#AA,#01,#FF,#39,#00,#40,#11
    DB #01,#00,#01,#FF,#01,#AA,#02,#DD,#01,#AA,#01,#FF,#39,#00,#01,#18
    DB #06,#88,#01,#81,#01,#19,#06,#99,#01,#91,#01,#1A,#06,#AA,#01,#A1
    DB #01,#1C,#06,#CC,#01,#C1,#01,#17,#06,#77,#01,#71,#01,#15,#06,#55
    DB #01,#51,#01,#1D,#06,#DD,#01,#D1,#01,#1F,#06,#FF,#01,#F1,#01,#00
    DB #01,#FF,#01,#AA,#02,#DD,#01,#AA,#01,#FF,#39,#00,#01,#18,#06,#88
    DB #01,#81,#01,#19,#06,#99,#01,#91,#01,#1A,#06,#AA,#01,#A1,#01,#1C
    DB #06,#CC,#01,#C1,#01,#17,#06,#77,#01,#71,#01,#15,#06,#55,#01,#51
    DB #01,#1D,#06,#DD,#01,#D1,#01,#1F,#06,#FF,#01,#F1,#01,#00,#01,#FF
    DB #01,#AA,#02,#DD,#01,#AA,#01,#FF,#39,#00,#01,#18,#06,#88,#01,#81
    DB #01,#19,#06,#99,#01,#91,#01,#1A,#06,#AA,#01,#A1,#01,#1C,#06,#CC
    DB #01,#C1,#01,#17,#06,#77,#01,#71,#01,#15,#06,#55,#01,#51,#01,#1D
    DB #06,#DD,#01,#D1,#01,#1F,#06,#FF,#01,#F1,#01,#00,#01,#FF,#04,#AA
    DB #01,#FF,#39,#00,#01,#18,#06,#88,#01,#81,#01,#19,#06,#99,#01,#91
    DB #01,#1A,#06,#AA,#01,#A1,#01,#1C,#06,#CC,#01,#C1,#01,#17,#06,#77
    DB #01,#71,#01,#15,#06,#55,#01,#51,#01,#1D,#06,#DD,#01,#D1,#01,#1F
    DB #06,#FF,#01,#F1,#01,#00,#01,#FF,#04,#AA,#01,#FF,#39,#00,#01,#18
    DB #06,#88,#01,#81,#01,#19,#06,#99,#01,#91,#01,#1A,#06,#AA,#01,#A1
    DB #01,#1C,#06,#CC,#01,#C1,#01,#17,#06,#77,#01,#71,#01,#15,#06,#55
    DB #01,#51,#01,#1D,#06,#DD,#01,#D1,#01,#1F,#06,#FF,#01,#F1,#01,#00
    DB #06,#FF,#39,#00,#01,#18,#06,#88,#01,#81,#01,#19,#06,#99,#01,#91
    DB #01,#1A,#06,#AA,#01,#A1,#01,#1C,#06,#CC,#01,#C1,#01,#17,#06,#77
    DB #01,#71,#01,#15,#06,#55,#01,#51,#01,#1D,#06,#DD,#01,#D1,#01,#1F
    DB #06,#FF,#01,#F1,#01,#00,#06,#FF,#39,#00,#40,#11,#40,#00
bitmap_room_tileset_rle_chunk_0_end:

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
bitmap_room_render_ptr_table_p1:
    DW bitmap_room_render_0_p1
    DW bitmap_room_render_1_p1


bitmap_room_blockcount_table:
    DW 343
    DW 344

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
    DB 48,16
bitmap_room_spawn_y_table:
    DB 96,80








; Per-room render programs, collision maps and behavior maps.
; Room 0 page 0 render program: 343 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#14,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#1A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#14,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#1C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#22,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #1C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#24
    DB #00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#2A,#00
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#00,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#00,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#32,#00,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#00,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#34,#00,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#3A,#00,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#34,#00,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#3C,#00,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#42,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#3C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#44,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#4A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#44,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #4C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#52
    DB #00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#00
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#00,#00
    DB #01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#5A,#00,#00,#01
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#00,#00,#01,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#5C,#00,#00,#01,#02,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#00,#00,#62,#00,#00,#01,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#5C,#00,#00,#01,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#64,#00,#00,#01,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#6A,#00,#00,#01,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#64,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#6C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#72,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#6C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#74,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #7A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#74
    DB #00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#00
    DB #00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#82,#00,#00
    DB #01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#00,#00,#01
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#00,#00,#01,#02
    DB #00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#8A,#00,#00,#01,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#00,#00,#01,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#8C,#00,#00,#01,#02,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#92,#00,#00,#01,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#8C,#00,#00,#01,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#94,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#9A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#94,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#9C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#A2,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #9C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#A4
    DB #00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#AA,#00
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#A4,#00,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#00,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#B2,#00,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#00,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#00,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#BA,#00,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#B4,#00,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#BC,#00,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#C2,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#BC,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#C4,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#CA,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#C4,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #CC,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#D2
    DB #00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#CC,#00
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14,#00,#01
    DB #00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#20,#00,#14,#00,#01,#00
    DB #C0,#00,#11,#00,#C0,#00,#00,#00,#00,#30,#00,#14,#00,#01,#00,#C0
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#14,#00,#01,#00,#C0,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#50,#00,#14,#00,#01,#00,#C0,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#60,#00,#14,#00,#01,#00,#C0,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#70,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#80,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#A0,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #C0,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#D0
    DB #00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00
    DB #14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14
    DB #00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#00
    DB #40,#00,#70,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#00,#40
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#6A,#00,#40,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#00,#40,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#6C,#00,#40,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#72,#00,#40,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#6C,#00,#40,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#74,#00,#40,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#7A,#00,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#74,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#7C,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#82,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#7C,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#84,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #8A,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#84
    DB #00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#00
    DB #40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#92,#00,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#00,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#00,#40,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#9A,#00,#40,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#00,#40,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#9C,#00,#40,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#A2,#00,#40,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#9C,#00,#40,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#A4,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#AA,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#A4,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#AC,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#B2,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #AC,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4
    DB #00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#BA,#00
    DB #40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#00,#40
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#00,#40,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#C2,#00,#40,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#00,#40,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#C4,#00,#40,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#CA,#00,#40,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#C4,#00,#40,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#CC,#00,#40,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#D2,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#CC,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#10,#00,#64,#00,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #20,#00,#64,#00,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#30
    DB #00,#64,#00,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #14,#00,#11,#00,#52,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#14
    DB #00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#1A,#00
    DB #11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#14,#00,#11
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#00,#11,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#22,#00,#11,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#00,#11,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#00,#11,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#2A,#00,#11,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#24,#00,#11,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#2C,#00,#11,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#32,#00,#11,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#2C,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#34,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#3A,#00,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#34,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #3C,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#42
    DB #00,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#3C,#00
    DB #11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#00,#11
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#4A,#00,#11,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#00,#11,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#00,#11,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#52,#00,#11,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#4C,#00,#11,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#54,#00,#11,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#5A,#00,#11,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#54,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#5C,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#62,#00,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#5C,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#64,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #64,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14
    DB #00,#01,#00,#52,#00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#00
    DB #76,#00,#26,#00,#77,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#00,#76
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00,#B4,#00,#76,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#00,#76,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#B6,#00,#76,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#40,#00,#BC,#00,#76,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#40,#00,#B6,#00,#76,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#40,#00,#BE,#00,#76,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#40,#00,#C4,#00,#76,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#40,#00,#BE,#00,#76,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#40,#00,#C6,#00,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#40,#00,#CC,#00,#76,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #40,#00,#C6,#00,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#40
    DB #00,#CE,#00,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00
    DB #CE,#00,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#50,#00,#AE
    DB #00,#01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#60,#00,#AE,#00
    DB #01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#70,#00,#AE,#00,#01
    DB #00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#80,#00,#AE,#00,#01,#00
    DB #26,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#AE,#00,#01,#00,#26
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#A0,#00,#AE,#00,#01,#00,#26,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#B0,#00,#AE,#00,#01,#00,#26,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#B0,#00,#B4,#00,#40,#00,#20,#00,#44,#00
    DB #C0,#00,#00,#00,#00,#B0,#00,#B4,#00,#40,#00,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#B0,#00,#BA,#00,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#B4,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#BC,#00,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#C2,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#BC,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0
    DB #00,#C4,#00,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00
    DB #CA,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#C4
    DB #00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#00
    DB #40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00,#D2,#00,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#00,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#C0,#00,#B4,#00,#01,#00,#20
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00,#B4,#00,#01,#00,#20,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#E0,#00,#B4,#00,#01,#00,#20,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#62,#00,#24,#00,#52,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#62,#00,#24,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#68,#00,#24,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#62,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#6A,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#70,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#6A,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#72,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #78,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#72
    DB #00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#00
    DB #24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#80,#00,#24
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#00,#24,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#00,#24,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#88,#00,#24,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#00,#24,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#8A,#00,#24,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#90,#00,#24,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#8A,#00,#24,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#92,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#98,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#92,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#9A,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#A0,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #9A,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2
    DB #00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#A8,#00
    DB #24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2,#00,#24
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#00,#24,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#B0,#00,#24,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#00,#24,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#00,#24,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#00,#24,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#EC,#00,#62,#00,#01,#00,#52,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#FC,#00,#62,#00,#01,#00,#52,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#4E,#00,#20,#00,#20,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#4E,#00,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#90,#00,#54,#00,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #90,#00,#4E,#00,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90
    DB #00,#56,#00,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00
    DB #5C,#00,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#56
    DB #00,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#00
    DB #20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#64,#00,#20
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#00,#20,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#00,#20,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#6C,#00,#20,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#00,#20,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#A0,#00,#4E,#00,#01,#00,#20,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#14,#00,#70,#00,#08,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#14,#00,#70,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#1A,#00,#70,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#14,#00,#70,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#A0,#00,#14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#C0
    DB #00,#14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00
    DB #14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00,#14
    DB #00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14,#00
    DB #01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#66,#00,#40
    DB #00,#03,#00,#44,#00,#C0,#00,#00,#00,#00,#10,#00,#61,#00,#40,#00
    DB #03,#00,#FF,#00,#C0,#00,#00,#00,#00,#32,#00,#81,#00,#20,#00,#03
    DB #00,#44,#00,#C0,#00,#00,#00,#00,#32,#00,#7C,#00,#20,#00,#03,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#54,#00,#AB,#00,#60,#00,#03,#00,#44
    DB #00,#C0,#00,#00,#00,#00,#54,#00,#A6,#00,#60,#00,#03,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#4F,#00,#20,#00,#03,#00,#44,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#4A,#00,#20,#00,#03,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#49,#00,#50,#00,#03,#00,#44,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#44,#00,#50,#00,#03,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#11,#00,#14,#00,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00
    DB #19,#00,#14,#00,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00,#11
    DB #00,#18,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00
    DB #20,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#28
    DB #00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#30,#00
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#38,#00,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#40,#00,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#48,#00,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#50,#00,#0A,#00,#02,#00
    DB #AA,#00,#C0,#00,#00,#00,#00,#11,#00,#58,#00,#0A,#00,#02,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#11,#00,#60,#00,#0A,#00,#02,#00,#AA,#00
    DB #C0,#00,#00,#00,#00,#E8,#00,#5E,#00,#02,#00,#56,#00,#66,#00,#C0
    DB #00,#00,#00,#00,#F0,#00,#5E,#00,#02,#00,#56,#00,#66,#00,#C0,#00
    DB #00,#00,#00,#E8,#00,#62,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00
    DB #00,#00,#E8,#00,#6A,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00
    DB #00,#E8,#00,#72,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#7A,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8
    DB #00,#82,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00
    DB #8A,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#92
    DB #00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#9A,#00
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#A2,#00,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#AA,#00,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#B2,#00,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#42,#00,#30,#00,#0F,#00,#1C,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#44,#00,#32,#00,#0B,#00,#18,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#45,#00,#2D,#00,#09,#00,#04,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#47,#00,#2A,#00,#05,#00,#03,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#49,#00,#31,#00,#01,#00,#19,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#72,#00,#30,#00,#0F,#00,#1C,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#74,#00,#32,#00,#0B,#00,#18,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#75,#00,#2D,#00,#09,#00,#04,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #77,#00,#2A,#00,#05,#00,#03,#00,#77,#00,#C0,#00,#00,#00,#00,#79
    DB #00,#31,#00,#01,#00,#19,#00,#55,#00,#C0,#00,#00,#00,#00,#32,#00
    DB #70,#00,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00,#00,#34,#00,#72
    DB #00,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00,#36,#00,#72,#00
    DB #02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#3A,#00,#72,#00,#02
    DB #00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#33,#00,#75,#00,#0A,#00
    DB #01,#00,#FF,#00,#C0,#00,#00,#00,#00,#33,#00,#7B,#00,#0A,#00,#01
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#D2,#00,#47,#00,#0C,#00,#11,#00
    DB #66,#00,#C0,#00,#00,#00,#00,#D4,#00,#49,#00,#08,#00,#0D,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#D6,#00,#49,#00,#02,#00,#0D,#00,#99,#00
    DB #C0,#00,#00,#00,#00,#DA,#00,#49,#00,#02,#00,#0D,#00,#99,#00,#C0
    DB #00,#00,#00,#00,#D3,#00,#4C,#00,#0A,#00,#01,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#D3,#00,#52,#00,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#B2,#00,#B6,#00,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00
    DB #00,#B4,#00,#B8,#00,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B6,#00,#B8,#00,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#BA
    DB #00,#B8,#00,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#B3,#00
    DB #BB,#00,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#B3,#00,#C1
    DB #00,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#74,#00,#96,#00
    DB #02,#00,#19,#00,#AA,#00,#C0,#00,#00,#00,#00,#70,#00,#AD,#00,#0A
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#72,#00,#90,#00,#06,#00
    DB #06,#00,#AA,#00,#C0,#00,#00,#00,#00,#74,#00,#8E,#00,#03,#00,#0A
    DB #00,#88,#00,#C0,#00,#00,#00,#00,#74,#00,#94,#00,#02,#00,#05,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#B6,#00,#96,#00,#02,#00,#19,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#B2,#00,#AD,#00,#0A,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#B4,#00,#90,#00,#06,#00,#06,#00,#AA,#00,#C0
    DB #00,#00,#00,#00,#B6,#00,#8E,#00,#03,#00,#0A,#00,#88,#00,#C0,#00
    DB #00,#00,#00,#B6,#00,#94,#00,#02,#00,#05,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#2B,#00,#56,#00,#09,#00,#05,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#C7,#00,#6C,#00,#09,#00,#05,#00,#EE,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#BA,#00,#0C,#00,#18,#00,#55,#00,#C0,#00,#00,#00,#00,#F8
    DB #00,#BA,#00,#08,#00,#1A,#00,#88,#00,#C0,#30,#00,#00,#02,#00,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0
; Room 0 page 1 render program: 343 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#14,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#1A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#14,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#1C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#22,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #1C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#24
    DB #01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#2A,#01
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#01,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#01,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#32,#01,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#01,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#34,#01,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#3A,#01,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#34,#01,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#3C,#01,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#42,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#3C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#44,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#4A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#44,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #4C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#52
    DB #01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#01
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#01,#00
    DB #01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#5A,#01,#00,#01
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#01,#00,#01,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#5C,#01,#00,#01,#02,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#00,#00,#62,#01,#00,#01,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#5C,#01,#00,#01,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#64,#01,#00,#01,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#6A,#01,#00,#01,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#64,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#6C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#72,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#6C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#74,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #7A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#74
    DB #01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#01
    DB #00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#82,#01,#00
    DB #01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#01,#00,#01
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#01,#00,#01,#02
    DB #00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#8A,#01,#00,#01,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#01,#00,#01,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#8C,#01,#00,#01,#02,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#92,#01,#00,#01,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#8C,#01,#00,#01,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#94,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#9A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#94,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#9C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#A2,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #9C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#A4
    DB #01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#AA,#01
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#A4,#01,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#01,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#B2,#01,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#01,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#01,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#BA,#01,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#B4,#01,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#BC,#01,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#C2,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#BC,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#C4,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#CA,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#C4,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #CC,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#D2
    DB #01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#CC,#01
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14,#01,#01
    DB #00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#20,#00,#14,#01,#01,#00
    DB #C0,#00,#11,#00,#C0,#00,#00,#00,#00,#30,#00,#14,#01,#01,#00,#C0
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#14,#01,#01,#00,#C0,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#50,#00,#14,#01,#01,#00,#C0,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#60,#00,#14,#01,#01,#00,#C0,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#70,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#80,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#A0,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #C0,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#D0
    DB #00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00
    DB #14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14
    DB #01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#01
    DB #40,#00,#70,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#01,#40
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#6A,#01,#40,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#01,#40,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#6C,#01,#40,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#72,#01,#40,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#6C,#01,#40,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#74,#01,#40,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#7A,#01,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#74,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#7C,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#82,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#7C,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#84,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #8A,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#84
    DB #01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#01
    DB #40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#92,#01,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#01,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#01,#40,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#9A,#01,#40,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#01,#40,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#9C,#01,#40,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#A2,#01,#40,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#9C,#01,#40,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#A4,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#AA,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#A4,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#AC,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#B2,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #AC,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4
    DB #01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#BA,#01
    DB #40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#01,#40
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#01,#40,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#C2,#01,#40,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#01,#40,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#C4,#01,#40,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#CA,#01,#40,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#C4,#01,#40,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#CC,#01,#40,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#D2,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#CC,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#10,#00,#64,#01,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #20,#00,#64,#01,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#30
    DB #00,#64,#01,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #14,#01,#11,#00,#52,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#14
    DB #01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#1A,#01
    DB #11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#14,#01,#11
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#01,#11,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#22,#01,#11,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#01,#11,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#01,#11,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#2A,#01,#11,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#24,#01,#11,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#2C,#01,#11,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#32,#01,#11,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#2C,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#34,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#3A,#01,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#34,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #3C,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#42
    DB #01,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#3C,#01
    DB #11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#01,#11
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#4A,#01,#11,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#01,#11,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#01,#11,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#52,#01,#11,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#4C,#01,#11,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#54,#01,#11,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#5A,#01,#11,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#54,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#5C,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#62,#01,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#5C,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#64,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #64,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14
    DB #01,#01,#00,#52,#00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#01
    DB #76,#00,#26,#00,#77,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#01,#76
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00,#B4,#01,#76,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#01,#76,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#B6,#01,#76,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#40,#00,#BC,#01,#76,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#40,#00,#B6,#01,#76,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#40,#00,#BE,#01,#76,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#40,#00,#C4,#01,#76,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#40,#00,#BE,#01,#76,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#40,#00,#C6,#01,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#40,#00,#CC,#01,#76,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #40,#00,#C6,#01,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#40
    DB #00,#CE,#01,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00
    DB #CE,#01,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#50,#00,#AE
    DB #01,#01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#60,#00,#AE,#01
    DB #01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#70,#00,#AE,#01,#01
    DB #00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#80,#00,#AE,#01,#01,#00
    DB #26,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#AE,#01,#01,#00,#26
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#A0,#00,#AE,#01,#01,#00,#26,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#B0,#00,#AE,#01,#01,#00,#26,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#B0,#00,#B4,#01,#40,#00,#20,#00,#44,#00
    DB #C0,#00,#00,#00,#00,#B0,#00,#B4,#01,#40,#00,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#B0,#00,#BA,#01,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#B4,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#BC,#01,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#C2,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#BC,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0
    DB #00,#C4,#01,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00
    DB #CA,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#C4
    DB #01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#01
    DB #40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00,#D2,#01,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#01,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#C0,#00,#B4,#01,#01,#00,#20
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00,#B4,#01,#01,#00,#20,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#E0,#00,#B4,#01,#01,#00,#20,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#62,#01,#24,#00,#52,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#62,#01,#24,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#68,#01,#24,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#62,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#6A,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#70,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#6A,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#72,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #78,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#72
    DB #01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#01
    DB #24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#80,#01,#24
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#01,#24,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#01,#24,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#88,#01,#24,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#01,#24,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#8A,#01,#24,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#90,#01,#24,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#8A,#01,#24,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#92,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#98,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#92,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#9A,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#A0,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #9A,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2
    DB #01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#A8,#01
    DB #24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2,#01,#24
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#01,#24,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#B0,#01,#24,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#01,#24,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#01,#24,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#01,#24,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#EC,#00,#62,#01,#01,#00,#52,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#FC,#00,#62,#01,#01,#00,#52,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#4E,#01,#20,#00,#20,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#4E,#01,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#90,#00,#54,#01,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #90,#00,#4E,#01,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90
    DB #00,#56,#01,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00
    DB #5C,#01,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#56
    DB #01,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#01
    DB #20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#64,#01,#20
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#01,#20,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#01,#20,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#6C,#01,#20,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#01,#20,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#A0,#00,#4E,#01,#01,#00,#20,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#14,#01,#70,#00,#08,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#14,#01,#70,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#1A,#01,#70,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#14,#01,#70,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#A0,#00,#14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#C0
    DB #00,#14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00
    DB #14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00,#14
    DB #01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14,#01
    DB #01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#66,#01,#40
    DB #00,#03,#00,#44,#00,#C0,#00,#00,#00,#00,#10,#00,#61,#01,#40,#00
    DB #03,#00,#FF,#00,#C0,#00,#00,#00,#00,#32,#00,#81,#01,#20,#00,#03
    DB #00,#44,#00,#C0,#00,#00,#00,#00,#32,#00,#7C,#01,#20,#00,#03,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#54,#00,#AB,#01,#60,#00,#03,#00,#44
    DB #00,#C0,#00,#00,#00,#00,#54,#00,#A6,#01,#60,#00,#03,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#4F,#01,#20,#00,#03,#00,#44,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#4A,#01,#20,#00,#03,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#49,#01,#50,#00,#03,#00,#44,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#44,#01,#50,#00,#03,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#11,#00,#14,#01,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00
    DB #19,#00,#14,#01,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00,#11
    DB #00,#18,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00
    DB #20,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#28
    DB #01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#30,#01
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#38,#01,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#40,#01,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#48,#01,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#50,#01,#0A,#00,#02,#00
    DB #AA,#00,#C0,#00,#00,#00,#00,#11,#00,#58,#01,#0A,#00,#02,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#11,#00,#60,#01,#0A,#00,#02,#00,#AA,#00
    DB #C0,#00,#00,#00,#00,#E8,#00,#5E,#01,#02,#00,#56,#00,#66,#00,#C0
    DB #00,#00,#00,#00,#F0,#00,#5E,#01,#02,#00,#56,#00,#66,#00,#C0,#00
    DB #00,#00,#00,#E8,#00,#62,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00
    DB #00,#00,#E8,#00,#6A,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00
    DB #00,#E8,#00,#72,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#7A,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8
    DB #00,#82,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00
    DB #8A,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#92
    DB #01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#9A,#01
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#A2,#01,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#AA,#01,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#B2,#01,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#42,#00,#30,#01,#0F,#00,#1C,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#44,#00,#32,#01,#0B,#00,#18,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#45,#00,#2D,#01,#09,#00,#04,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#47,#00,#2A,#01,#05,#00,#03,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#49,#00,#31,#01,#01,#00,#19,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#72,#00,#30,#01,#0F,#00,#1C,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#74,#00,#32,#01,#0B,#00,#18,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#75,#00,#2D,#01,#09,#00,#04,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #77,#00,#2A,#01,#05,#00,#03,#00,#77,#00,#C0,#00,#00,#00,#00,#79
    DB #00,#31,#01,#01,#00,#19,#00,#55,#00,#C0,#00,#00,#00,#00,#32,#00
    DB #70,#01,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00,#00,#34,#00,#72
    DB #01,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00,#36,#00,#72,#01
    DB #02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#3A,#00,#72,#01,#02
    DB #00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#33,#00,#75,#01,#0A,#00
    DB #01,#00,#FF,#00,#C0,#00,#00,#00,#00,#33,#00,#7B,#01,#0A,#00,#01
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#D2,#00,#47,#01,#0C,#00,#11,#00
    DB #66,#00,#C0,#00,#00,#00,#00,#D4,#00,#49,#01,#08,#00,#0D,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#D6,#00,#49,#01,#02,#00,#0D,#00,#99,#00
    DB #C0,#00,#00,#00,#00,#DA,#00,#49,#01,#02,#00,#0D,#00,#99,#00,#C0
    DB #00,#00,#00,#00,#D3,#00,#4C,#01,#0A,#00,#01,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#D3,#00,#52,#01,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#B2,#00,#B6,#01,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00
    DB #00,#B4,#00,#B8,#01,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B6,#00,#B8,#01,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#BA
    DB #00,#B8,#01,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#B3,#00
    DB #BB,#01,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#B3,#00,#C1
    DB #01,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#74,#00,#96,#01
    DB #02,#00,#19,#00,#AA,#00,#C0,#00,#00,#00,#00,#70,#00,#AD,#01,#0A
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#72,#00,#90,#01,#06,#00
    DB #06,#00,#AA,#00,#C0,#00,#00,#00,#00,#74,#00,#8E,#01,#03,#00,#0A
    DB #00,#88,#00,#C0,#00,#00,#00,#00,#74,#00,#94,#01,#02,#00,#05,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#B6,#00,#96,#01,#02,#00,#19,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#B2,#00,#AD,#01,#0A,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#B4,#00,#90,#01,#06,#00,#06,#00,#AA,#00,#C0
    DB #00,#00,#00,#00,#B6,#00,#8E,#01,#03,#00,#0A,#00,#88,#00,#C0,#00
    DB #00,#00,#00,#B6,#00,#94,#01,#02,#00,#05,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#2B,#00,#56,#01,#09,#00,#05,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#C7,#00,#6C,#01,#09,#00,#05,#00,#EE,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#BA,#01,#0C,#00,#18,#00,#55,#00,#C0,#00,#00,#00,#00,#F8
    DB #00,#BA,#01,#08,#00,#1A,#00,#88,#00,#C0,#30,#00,#00,#02,#00,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0
; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#11,#11,#11,#11,#11,#11,#11,#11,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#11,#11,#11,#11,#11,#11,#11,#11,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#40,#40,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
; Room 0 16x12 behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default
bitmap_room_behavior_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#30,#30,#30,#30,#30,#30,#30,#30,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#C0,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Room 1 page 0 render program: 344 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#44,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#14,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#1A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#14,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#1C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#22,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #1C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#24
    DB #00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#2A,#00
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#00,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#00,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#32,#00,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#00,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#34,#00,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#3A,#00,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#34,#00,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#3C,#00,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#42,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#3C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#44,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#4A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#44,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #4C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#52
    DB #00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#00
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#00,#00
    DB #01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#5A,#00,#00,#01
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#00,#00,#01,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#5C,#00,#00,#01,#02,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#00,#00,#62,#00,#00,#01,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#5C,#00,#00,#01,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#64,#00,#00,#01,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#6A,#00,#00,#01,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#64,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#6C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#72,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#6C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#74,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #7A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#74
    DB #00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#00
    DB #00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#82,#00,#00
    DB #01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#00,#00,#01
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#00,#00,#01,#02
    DB #00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#8A,#00,#00,#01,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#00,#00,#01,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#8C,#00,#00,#01,#02,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#92,#00,#00,#01,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#8C,#00,#00,#01,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#94,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#9A,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#94,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#9C,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#A2,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #9C,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#A4
    DB #00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#AA,#00
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#A4,#00,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#00,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#B2,#00,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#00,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#00,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#BA,#00,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#B4,#00,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#BC,#00,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#C2,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#BC,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#C4,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#CA,#00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#C4,#00,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #CC,#00,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#D2
    DB #00,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#CC,#00
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14,#00,#01
    DB #00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#20,#00,#14,#00,#01,#00
    DB #C0,#00,#11,#00,#C0,#00,#00,#00,#00,#30,#00,#14,#00,#01,#00,#C0
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#14,#00,#01,#00,#C0,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#50,#00,#14,#00,#01,#00,#C0,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#60,#00,#14,#00,#01,#00,#C0,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#70,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#80,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#A0,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #C0,#00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#D0
    DB #00,#14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00
    DB #14,#00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14
    DB #00,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#00
    DB #40,#00,#70,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#00,#40
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#6A,#00,#40,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#00,#40,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#6C,#00,#40,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#72,#00,#40,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#6C,#00,#40,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#74,#00,#40,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#7A,#00,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#74,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#7C,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#82,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#7C,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#84,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #8A,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#84
    DB #00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#00
    DB #40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#92,#00,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#00,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#00,#40,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#9A,#00,#40,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#00,#40,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#9C,#00,#40,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#A2,#00,#40,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#9C,#00,#40,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#A4,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#AA,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#A4,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#AC,#00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#B2,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #AC,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4
    DB #00,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#BA,#00
    DB #40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#00,#40
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#00,#40,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#C2,#00,#40,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#00,#40,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#C4,#00,#40,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#CA,#00,#40,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#C4,#00,#40,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#CC,#00,#40,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#D2,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#CC,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#10,#00,#64,#00,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #20,#00,#64,#00,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#30
    DB #00,#64,#00,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #14,#00,#11,#00,#52,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#14
    DB #00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#1A,#00
    DB #11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#14,#00,#11
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#00,#11,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#22,#00,#11,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#00,#11,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#00,#11,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#2A,#00,#11,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#24,#00,#11,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#2C,#00,#11,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#32,#00,#11,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#2C,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#34,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#3A,#00,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#34,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #3C,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#42
    DB #00,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#3C,#00
    DB #11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#00,#11
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#4A,#00,#11,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#00,#11,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#00,#11,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#52,#00,#11,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#4C,#00,#11,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#54,#00,#11,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#5A,#00,#11,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#54,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#5C,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#62,#00,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#5C,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#64,#00,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #64,#00,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14
    DB #00,#01,#00,#52,#00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#00
    DB #76,#00,#26,#00,#77,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#00,#76
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00,#B4,#00,#76,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#00,#76,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#B6,#00,#76,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#40,#00,#BC,#00,#76,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#40,#00,#B6,#00,#76,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#40,#00,#BE,#00,#76,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#40,#00,#C4,#00,#76,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#40,#00,#BE,#00,#76,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#40,#00,#C6,#00,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#40,#00,#CC,#00,#76,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #40,#00,#C6,#00,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#40
    DB #00,#CE,#00,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00
    DB #CE,#00,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#50,#00,#AE
    DB #00,#01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#60,#00,#AE,#00
    DB #01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#70,#00,#AE,#00,#01
    DB #00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#80,#00,#AE,#00,#01,#00
    DB #26,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#AE,#00,#01,#00,#26
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#A0,#00,#AE,#00,#01,#00,#26,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#B0,#00,#AE,#00,#01,#00,#26,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#B0,#00,#B4,#00,#40,#00,#20,#00,#44,#00
    DB #C0,#00,#00,#00,#00,#B0,#00,#B4,#00,#40,#00,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#B0,#00,#BA,#00,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#B4,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#BC,#00,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#C2,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#BC,#00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0
    DB #00,#C4,#00,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00
    DB #CA,#00,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#C4
    DB #00,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#00
    DB #40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00,#D2,#00,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#00,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#C0,#00,#B4,#00,#01,#00,#20
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00,#B4,#00,#01,#00,#20,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#E0,#00,#B4,#00,#01,#00,#20,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#62,#00,#24,#00,#52,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#62,#00,#24,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#68,#00,#24,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#62,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#6A,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#70,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#6A,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#72,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #78,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#72
    DB #00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#00
    DB #24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#80,#00,#24
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#00,#24,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#00,#24,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#88,#00,#24,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#00,#24,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#8A,#00,#24,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#90,#00,#24,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#8A,#00,#24,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#92,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#98,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#92,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#9A,#00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#A0,#00,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #9A,#00,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2
    DB #00,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#A8,#00
    DB #24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2,#00,#24
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#00,#24,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#B0,#00,#24,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#00,#24,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#00,#24,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#00,#24,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#EC,#00,#62,#00,#01,#00,#52,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#FC,#00,#62,#00,#01,#00,#52,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#4E,#00,#20,#00,#20,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#4E,#00,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#90,#00,#54,#00,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #90,#00,#4E,#00,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90
    DB #00,#56,#00,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00
    DB #5C,#00,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#56
    DB #00,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#00
    DB #20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#64,#00,#20
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#00,#20,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#00,#20,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#6C,#00,#20,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#00,#20,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#A0,#00,#4E,#00,#01,#00,#20,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#14,#00,#70,#00,#08,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#14,#00,#70,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#1A,#00,#70,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#14,#00,#70,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#A0,#00,#14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#C0
    DB #00,#14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00
    DB #14,#00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00,#14
    DB #00,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14,#00
    DB #01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#66,#00,#40
    DB #00,#03,#00,#44,#00,#C0,#00,#00,#00,#00,#10,#00,#61,#00,#40,#00
    DB #03,#00,#FF,#00,#C0,#00,#00,#00,#00,#32,#00,#81,#00,#20,#00,#03
    DB #00,#44,#00,#C0,#00,#00,#00,#00,#32,#00,#7C,#00,#20,#00,#03,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#54,#00,#AB,#00,#60,#00,#03,#00,#44
    DB #00,#C0,#00,#00,#00,#00,#54,#00,#A6,#00,#60,#00,#03,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#4F,#00,#20,#00,#03,#00,#44,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#4A,#00,#20,#00,#03,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#49,#00,#50,#00,#03,#00,#44,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#44,#00,#50,#00,#03,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#11,#00,#14,#00,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00
    DB #19,#00,#14,#00,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00,#11
    DB #00,#18,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00
    DB #20,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#28
    DB #00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#30,#00
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#38,#00,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#40,#00,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#48,#00,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#50,#00,#0A,#00,#02,#00
    DB #AA,#00,#C0,#00,#00,#00,#00,#11,#00,#58,#00,#0A,#00,#02,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#11,#00,#60,#00,#0A,#00,#02,#00,#AA,#00
    DB #C0,#00,#00,#00,#00,#E8,#00,#5E,#00,#02,#00,#56,#00,#66,#00,#C0
    DB #00,#00,#00,#00,#F0,#00,#5E,#00,#02,#00,#56,#00,#66,#00,#C0,#00
    DB #00,#00,#00,#E8,#00,#62,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00
    DB #00,#00,#E8,#00,#6A,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00
    DB #00,#E8,#00,#72,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#7A,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8
    DB #00,#82,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00
    DB #8A,#00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#92
    DB #00,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#9A,#00
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#A2,#00,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#AA,#00,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#B2,#00,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#42,#00,#30,#00,#0F,#00,#1C,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#44,#00,#32,#00,#0B,#00,#18,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#45,#00,#2D,#00,#09,#00,#04,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#47,#00,#2A,#00,#05,#00,#03,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#49,#00,#31,#00,#01,#00,#19,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#72,#00,#30,#00,#0F,#00,#1C,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#74,#00,#32,#00,#0B,#00,#18,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#75,#00,#2D,#00,#09,#00,#04,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #77,#00,#2A,#00,#05,#00,#03,#00,#77,#00,#C0,#00,#00,#00,#00,#79
    DB #00,#31,#00,#01,#00,#19,#00,#55,#00,#C0,#00,#00,#00,#00,#32,#00
    DB #70,#00,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00,#00,#34,#00,#72
    DB #00,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00,#36,#00,#72,#00
    DB #02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#3A,#00,#72,#00,#02
    DB #00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#33,#00,#75,#00,#0A,#00
    DB #01,#00,#FF,#00,#C0,#00,#00,#00,#00,#33,#00,#7B,#00,#0A,#00,#01
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#D2,#00,#47,#00,#0C,#00,#11,#00
    DB #66,#00,#C0,#00,#00,#00,#00,#D4,#00,#49,#00,#08,#00,#0D,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#D6,#00,#49,#00,#02,#00,#0D,#00,#99,#00
    DB #C0,#00,#00,#00,#00,#DA,#00,#49,#00,#02,#00,#0D,#00,#99,#00,#C0
    DB #00,#00,#00,#00,#D3,#00,#4C,#00,#0A,#00,#01,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#D3,#00,#52,#00,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#B2,#00,#B6,#00,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00
    DB #00,#B4,#00,#B8,#00,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B6,#00,#B8,#00,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#BA
    DB #00,#B8,#00,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#B3,#00
    DB #BB,#00,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#B3,#00,#C1
    DB #00,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#74,#00,#96,#00
    DB #02,#00,#19,#00,#AA,#00,#C0,#00,#00,#00,#00,#70,#00,#AD,#00,#0A
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#72,#00,#90,#00,#06,#00
    DB #06,#00,#AA,#00,#C0,#00,#00,#00,#00,#74,#00,#8E,#00,#03,#00,#0A
    DB #00,#88,#00,#C0,#00,#00,#00,#00,#74,#00,#94,#00,#02,#00,#05,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#B6,#00,#96,#00,#02,#00,#19,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#B2,#00,#AD,#00,#0A,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#B4,#00,#90,#00,#06,#00,#06,#00,#AA,#00,#C0
    DB #00,#00,#00,#00,#B6,#00,#8E,#00,#03,#00,#0A,#00,#88,#00,#C0,#00
    DB #00,#00,#00,#B6,#00,#94,#00,#02,#00,#05,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#2B,#00,#56,#00,#09,#00,#05,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#C7,#00,#6C,#00,#09,#00,#05,#00,#EE,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#BA,#00,#0C,#00,#18,#00,#55,#00,#C0,#00,#00,#00,#00,#F8
    DB #00,#BA,#00,#08,#00,#1A,#00,#88,#00,#C0,#70,#00,#00,#02,#00,#00
    DB #14,#00,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#F0,#00,#14
    DB #00,#10,#00,#10,#00,#00,#00,#D0
; Room 1 page 1 render program: 344 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#44,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#14,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#1A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#14,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#1C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#22,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #1C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#24
    DB #01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#2A,#01
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#01,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#01,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#32,#01,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#2C,#01,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#34,#01,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#3A,#01,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#34,#01,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#3C,#01,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#42,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#3C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#44,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#4A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#44,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #4C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#52
    DB #01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#01
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#01,#00
    DB #01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#5A,#01,#00,#01
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#54,#01,#00,#01,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#5C,#01,#00,#01,#02,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#00,#00,#62,#01,#00,#01,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#5C,#01,#00,#01,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#64,#01,#00,#01,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#6A,#01,#00,#01,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#64,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#6C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#72,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#6C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#74,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #7A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#74
    DB #01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#01
    DB #00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#82,#01,#00
    DB #01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#7C,#01,#00,#01
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#01,#00,#01,#02
    DB #00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#8A,#01,#00,#01,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#84,#01,#00,#01,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#8C,#01,#00,#01,#02,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#92,#01,#00,#01,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#8C,#01,#00,#01,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#94,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#9A,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#94,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#9C,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#A2,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #9C,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#A4
    DB #01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#AA,#01
    DB #00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#A4,#01,#00
    DB #01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#01,#00,#01
    DB #02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#B2,#01,#00,#01,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#AC,#01,#00,#01,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#01,#00,#01,#02,#00,#77
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#BA,#01,#00,#01,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#B4,#01,#00,#01,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#BC,#01,#00,#01,#02,#00,#77,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#C2,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#BC,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#C4,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#CA,#01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#C4,#01,#00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #CC,#01,#00,#01,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#D2
    DB #01,#00,#01,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#CC,#01
    DB #00,#01,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14,#01,#01
    DB #00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#20,#00,#14,#01,#01,#00
    DB #C0,#00,#11,#00,#C0,#00,#00,#00,#00,#30,#00,#14,#01,#01,#00,#C0
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#14,#01,#01,#00,#C0,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#50,#00,#14,#01,#01,#00,#C0,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#60,#00,#14,#01,#01,#00,#C0,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#70,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#80,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#A0,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #C0,#00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#D0
    DB #00,#14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00
    DB #14,#01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14
    DB #01,#01,#00,#C0,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#01
    DB #40,#00,#70,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#01,#40
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#6A,#01,#40,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#64,#01,#40,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#6C,#01,#40,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#72,#01,#40,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#6C,#01,#40,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#74,#01,#40,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#7A,#01,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#74,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#7C,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#82,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#7C,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#84,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #8A,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#84
    DB #01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#01
    DB #40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#92,#01,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#8C,#01,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#01,#40,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#9A,#01,#40,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#00,#00,#94,#01,#40,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#9C,#01,#40,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#A2,#01,#40,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#9C,#01,#40,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#A4,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#AA,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#A4,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#AC,#01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#B2,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #AC,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#B4
    DB #01,#40,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#BA,#01
    DB #40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#B4,#01,#40
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#01,#40,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#C2,#01,#40,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#BC,#01,#40,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#C4,#01,#40,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#CA,#01,#40,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#C4,#01,#40,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#CC,#01,#40,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#D2,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#CC,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#10,#00,#64,#01,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #20,#00,#64,#01,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#30
    DB #00,#64,#01,#01,#00,#70,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #14,#01,#11,#00,#52,#00,#77,#00,#C0,#00,#00,#00,#00,#00,#00,#14
    DB #01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#1A,#01
    DB #11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#14,#01,#11
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#01,#11,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#22,#01,#11,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#1C,#01,#11,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#00,#00,#24,#01,#11,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#2A,#01,#11,#00,#02,#00,#55,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#24,#01,#11,#00,#01,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#2C,#01,#11,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#32,#01,#11,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#2C,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#34,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#3A,#01,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#34,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #3C,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#42
    DB #01,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#3C,#01
    DB #11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#01,#11
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00,#4A,#01,#11,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#00,#00,#44,#01,#11,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#00,#00,#4C,#01,#11,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#00,#00,#52,#01,#11,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#00,#00,#4C,#01,#11,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#00,#00,#54,#01,#11,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#00,#00,#5A,#01,#11,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#00,#00,#54,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#00,#00,#5C,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#00,#00,#62,#01,#11,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #00,#00,#5C,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#00
    DB #00,#64,#01,#11,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#00,#00
    DB #64,#01,#11,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#14
    DB #01,#01,#00,#52,#00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#01
    DB #76,#00,#26,#00,#77,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#01,#76
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00,#B4,#01,#76,#00
    DB #02,#00,#55,#00,#C0,#00,#00,#00,#00,#40,#00,#AE,#01,#76,#00,#01
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#40,#00,#B6,#01,#76,#00,#02,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#40,#00,#BC,#01,#76,#00,#02,#00,#55
    DB #00,#C0,#00,#00,#00,#00,#40,#00,#B6,#01,#76,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#40,#00,#BE,#01,#76,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#40,#00,#C4,#01,#76,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#40,#00,#BE,#01,#76,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#40,#00,#C6,#01,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#40,#00,#CC,#01,#76,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #40,#00,#C6,#01,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#40
    DB #00,#CE,#01,#76,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#40,#00
    DB #CE,#01,#76,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#50,#00,#AE
    DB #01,#01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#60,#00,#AE,#01
    DB #01,#00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#70,#00,#AE,#01,#01
    DB #00,#26,#00,#11,#00,#C0,#00,#00,#00,#00,#80,#00,#AE,#01,#01,#00
    DB #26,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#AE,#01,#01,#00,#26
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#A0,#00,#AE,#01,#01,#00,#26,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#B0,#00,#AE,#01,#01,#00,#26,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#B0,#00,#B4,#01,#40,#00,#20,#00,#44,#00
    DB #C0,#00,#00,#00,#00,#B0,#00,#B4,#01,#40,#00,#02,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#B0,#00,#BA,#01,#40,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#B4,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#BC,#01,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00
    DB #00,#B0,#00,#C2,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#BC,#01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0
    DB #00,#C4,#01,#40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00
    DB #CA,#01,#40,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#C4
    DB #01,#40,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#01
    DB #40,#00,#02,#00,#77,#00,#C0,#00,#00,#00,#00,#B0,#00,#D2,#01,#40
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#B0,#00,#CC,#01,#40,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#C0,#00,#B4,#01,#01,#00,#20
    DB #00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00,#B4,#01,#01,#00,#20,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#E0,#00,#B4,#01,#01,#00,#20,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#62,#01,#24,#00,#52,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#62,#01,#24,#00,#02,#00,#FF,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#68,#01,#24,#00,#02,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#62,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#6A,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#70,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#6A,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#72,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #78,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#72
    DB #01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#01
    DB #24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#80,#01,#24
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#7A,#01,#24,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#01,#24,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#88,#01,#24,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#DC,#00,#82,#01,#24,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#8A,#01,#24,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#DC,#00,#90,#01,#24,#00,#02,#00,#55,#00,#C0
    DB #00,#00,#00,#00,#DC,#00,#8A,#01,#24,#00,#01,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#DC,#00,#92,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#DC,#00,#98,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00
    DB #00,#DC,#00,#92,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #DC,#00,#9A,#01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC
    DB #00,#A0,#01,#24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00
    DB #9A,#01,#24,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2
    DB #01,#24,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#A8,#01
    DB #24,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#A2,#01,#24
    DB #00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#01,#24,#00
    DB #02,#00,#FF,#00,#C0,#00,#00,#00,#00,#DC,#00,#B0,#01,#24,#00,#02
    DB #00,#55,#00,#C0,#00,#00,#00,#00,#DC,#00,#AA,#01,#24,#00,#01,#00
    DB #11,#00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#01,#24,#00,#02,#00,#FF
    DB #00,#C0,#00,#00,#00,#00,#DC,#00,#B2,#01,#24,#00,#01,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#EC,#00,#62,#01,#01,#00,#52,#00,#11,#00,#C0
    DB #00,#00,#00,#00,#FC,#00,#62,#01,#01,#00,#52,#00,#11,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#4E,#01,#20,#00,#20,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#4E,#01,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#90,#00,#54,#01,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00
    DB #90,#00,#4E,#01,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90
    DB #00,#56,#01,#20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00
    DB #5C,#01,#20,#00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#56
    DB #01,#20,#00,#01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#01
    DB #20,#00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#64,#01,#20
    DB #00,#02,#00,#55,#00,#C0,#00,#00,#00,#00,#90,#00,#5E,#01,#20,#00
    DB #01,#00,#11,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#01,#20,#00,#02
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#90,#00,#6C,#01,#20,#00,#02,#00
    DB #55,#00,#C0,#00,#00,#00,#00,#90,#00,#66,#01,#20,#00,#01,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#A0,#00,#4E,#01,#01,#00,#20,#00,#11,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#14,#01,#70,#00,#08,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#14,#01,#70,#00,#02,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#90,#00,#1A,#01,#70,#00,#02,#00,#55,#00,#C0,#00,#00
    DB #00,#00,#90,#00,#14,#01,#70,#00,#01,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#A0,#00,#14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B0,#00,#14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#C0
    DB #00,#14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#D0,#00
    DB #14,#01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#E0,#00,#14
    DB #01,#01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#F0,#00,#14,#01
    DB #01,#00,#08,#00,#11,#00,#C0,#00,#00,#00,#00,#10,#00,#66,#01,#40
    DB #00,#03,#00,#44,#00,#C0,#00,#00,#00,#00,#10,#00,#61,#01,#40,#00
    DB #03,#00,#FF,#00,#C0,#00,#00,#00,#00,#32,#00,#81,#01,#20,#00,#03
    DB #00,#44,#00,#C0,#00,#00,#00,#00,#32,#00,#7C,#01,#20,#00,#03,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#54,#00,#AB,#01,#60,#00,#03,#00,#44
    DB #00,#C0,#00,#00,#00,#00,#54,#00,#A6,#01,#60,#00,#03,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#90,#00,#4F,#01,#20,#00,#03,#00,#44,#00,#C0
    DB #00,#00,#00,#00,#90,#00,#4A,#01,#20,#00,#03,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#B0,#00,#49,#01,#50,#00,#03,#00,#44,#00,#C0,#00,#00
    DB #00,#00,#B0,#00,#44,#01,#50,#00,#03,#00,#FF,#00,#C0,#00,#00,#00
    DB #00,#11,#00,#14,#01,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00
    DB #19,#00,#14,#01,#02,#00,#50,#00,#66,#00,#C0,#00,#00,#00,#00,#11
    DB #00,#18,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00
    DB #20,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#28
    DB #01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#30,#01
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#38,#01,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#40,#01,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#48,#01,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#11,#00,#50,#01,#0A,#00,#02,#00
    DB #AA,#00,#C0,#00,#00,#00,#00,#11,#00,#58,#01,#0A,#00,#02,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#11,#00,#60,#01,#0A,#00,#02,#00,#AA,#00
    DB #C0,#00,#00,#00,#00,#E8,#00,#5E,#01,#02,#00,#56,#00,#66,#00,#C0
    DB #00,#00,#00,#00,#F0,#00,#5E,#01,#02,#00,#56,#00,#66,#00,#C0,#00
    DB #00,#00,#00,#E8,#00,#62,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00
    DB #00,#00,#E8,#00,#6A,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00
    DB #00,#E8,#00,#72,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#7A,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8
    DB #00,#82,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00
    DB #8A,#01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#92
    DB #01,#0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#9A,#01
    DB #0A,#00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#A2,#01,#0A
    DB #00,#02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#AA,#01,#0A,#00
    DB #02,#00,#AA,#00,#C0,#00,#00,#00,#00,#E8,#00,#B2,#01,#0A,#00,#02
    DB #00,#AA,#00,#C0,#00,#00,#00,#00,#42,#00,#30,#01,#0F,#00,#1C,#00
    DB #77,#00,#C0,#00,#00,#00,#00,#44,#00,#32,#01,#0B,#00,#18,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#45,#00,#2D,#01,#09,#00,#04,#00,#77,#00
    DB #C0,#00,#00,#00,#00,#47,#00,#2A,#01,#05,#00,#03,#00,#77,#00,#C0
    DB #00,#00,#00,#00,#49,#00,#31,#01,#01,#00,#19,#00,#55,#00,#C0,#00
    DB #00,#00,#00,#72,#00,#30,#01,#0F,#00,#1C,#00,#77,#00,#C0,#00,#00
    DB #00,#00,#74,#00,#32,#01,#0B,#00,#18,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#75,#00,#2D,#01,#09,#00,#04,#00,#77,#00,#C0,#00,#00,#00,#00
    DB #77,#00,#2A,#01,#05,#00,#03,#00,#77,#00,#C0,#00,#00,#00,#00,#79
    DB #00,#31,#01,#01,#00,#19,#00,#55,#00,#C0,#00,#00,#00,#00,#32,#00
    DB #70,#01,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00,#00,#34,#00,#72
    DB #01,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00,#36,#00,#72,#01
    DB #02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#3A,#00,#72,#01,#02
    DB #00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#33,#00,#75,#01,#0A,#00
    DB #01,#00,#FF,#00,#C0,#00,#00,#00,#00,#33,#00,#7B,#01,#0A,#00,#01
    DB #00,#FF,#00,#C0,#00,#00,#00,#00,#D2,#00,#47,#01,#0C,#00,#11,#00
    DB #66,#00,#C0,#00,#00,#00,#00,#D4,#00,#49,#01,#08,#00,#0D,#00,#11
    DB #00,#C0,#00,#00,#00,#00,#D6,#00,#49,#01,#02,#00,#0D,#00,#99,#00
    DB #C0,#00,#00,#00,#00,#DA,#00,#49,#01,#02,#00,#0D,#00,#99,#00,#C0
    DB #00,#00,#00,#00,#D3,#00,#4C,#01,#0A,#00,#01,#00,#FF,#00,#C0,#00
    DB #00,#00,#00,#D3,#00,#52,#01,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#B2,#00,#B6,#01,#0C,#00,#11,#00,#66,#00,#C0,#00,#00,#00
    DB #00,#B4,#00,#B8,#01,#08,#00,#0D,#00,#11,#00,#C0,#00,#00,#00,#00
    DB #B6,#00,#B8,#01,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#BA
    DB #00,#B8,#01,#02,#00,#0D,#00,#99,#00,#C0,#00,#00,#00,#00,#B3,#00
    DB #BB,#01,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#B3,#00,#C1
    DB #01,#0A,#00,#01,#00,#FF,#00,#C0,#00,#00,#00,#00,#74,#00,#96,#01
    DB #02,#00,#19,#00,#AA,#00,#C0,#00,#00,#00,#00,#70,#00,#AD,#01,#0A
    DB #00,#02,#00,#FF,#00,#C0,#00,#00,#00,#00,#72,#00,#90,#01,#06,#00
    DB #06,#00,#AA,#00,#C0,#00,#00,#00,#00,#74,#00,#8E,#01,#03,#00,#0A
    DB #00,#88,#00,#C0,#00,#00,#00,#00,#74,#00,#94,#01,#02,#00,#05,#00
    DB #FF,#00,#C0,#00,#00,#00,#00,#B6,#00,#96,#01,#02,#00,#19,#00,#AA
    DB #00,#C0,#00,#00,#00,#00,#B2,#00,#AD,#01,#0A,#00,#02,#00,#FF,#00
    DB #C0,#00,#00,#00,#00,#B4,#00,#90,#01,#06,#00,#06,#00,#AA,#00,#C0
    DB #00,#00,#00,#00,#B6,#00,#8E,#01,#03,#00,#0A,#00,#88,#00,#C0,#00
    DB #00,#00,#00,#B6,#00,#94,#01,#02,#00,#05,#00,#FF,#00,#C0,#00,#00
    DB #00,#00,#2B,#00,#56,#01,#09,#00,#05,#00,#11,#00,#C0,#00,#00,#00
    DB #00,#C7,#00,#6C,#01,#09,#00,#05,#00,#EE,#00,#C0,#00,#00,#00,#00
    DB #E8,#00,#BA,#01,#0C,#00,#18,#00,#55,#00,#C0,#00,#00,#00,#00,#F8
    DB #00,#BA,#01,#08,#00,#1A,#00,#88,#00,#C0,#70,#00,#00,#02,#00,#00
    DB #14,#01,#10,#00,#10,#00,#00,#00,#D0,#10,#00,#00,#02,#F0,#00,#14
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
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






; Sprite 0 line color table (mode 2): configured player sprite "Smoke Player Sprite"
bitmap_room_sprite_colors:
    DB #0F,#0F,#0F,#0F,#0F,#08,#08,#08,#08,#0F,#0F,#0F,#08,#08,#08,#08
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0F,#0F,#0F,#0F,#0F,#02,#02,#02,#02,#0F,#0F,#0F,#02,#02,#02,#02
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F

bitmap_room_sprite_colors_end:

; SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing
bitmap_room_sprite_attrs:
    DB #60,#80,#00,#00,#60,#80,#04,#00,#D8,#00,#00,#00

bitmap_room_sprite_attrs_end:

; Sprite 0 pattern (16x16, mode 2 quadrants): configured player sprite "Smoke Player Sprite"
bitmap_room_sprite_patterns:
    DB #00,#00,#0F,#0F,#0F,#00,#00,#00,#00,#0F,#0F,#0F,#04,#04,#04,#04
    DB #00,#00,#E0,#E0,#E0,#3E,#3E,#3E,#3E,#E0,#E0,#E0,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#0F,#0F,#0F,#0F,#00,#00,#00,#0B,#0B,#0B,#00
    DB #00,#00,#00,#00,#00,#C0,#C0,#C0,#C0,#00,#00,#00,#E0,#E0,#E0,#00
    DB #00,#00,#0F,#0F,#0F,#00,#00,#00,#00,#0F,#0F,#0F,#00,#00,#00,#00
    DB #00,#00,#E0,#E0,#E0,#3E,#3E,#3E,#3E,#E0,#E0,#E0,#80,#80,#80,#80
    DB #00,#00,#00,#00,#00,#0F,#0F,#0F,#0F,#00,#00,#00,#0F,#0F,#0F,#00
    DB #00,#00,#00,#00,#00,#C0,#C0,#C0,#C0,#00,#00,#00,#60,#60,#60,#00
    DB #00,#00,#07,#07,#07,#7C,#7C,#7C,#7C,#07,#07,#07,#00,#00,#00,#00
    DB #00,#00,#F0,#F0,#F0,#00,#00,#00,#00,#F0,#F0,#F0,#20,#20,#20,#20
    DB #00,#00,#00,#00,#00,#03,#03,#03,#03,#00,#00,#00,#07,#07,#07,#00
    DB #00,#00,#00,#00,#00,#F0,#F0,#F0,#F0,#00,#00,#00,#D0,#D0,#D0,#00
    DB #00,#00,#07,#07,#07,#7C,#7C,#7C,#7C,#07,#07,#07,#01,#01,#01,#01
    DB #00,#00,#F0,#F0,#F0,#00,#00,#00,#00,#F0,#F0,#F0,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#03,#03,#03,#03,#00,#00,#00,#06,#06,#06,#00
    DB #00,#00,#00,#00,#00,#F0,#F0,#F0,#F0,#00,#00,#00,#F0,#F0,#F0,#00

bitmap_room_sprite_patterns_end:


    ds #C000 - $, #FF
    end
