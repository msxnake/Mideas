; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: newOne10_dash
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
; Shared tileset bytes: 8192 at VRAM #10000
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
; --- DASH skill runtime state (4 bytes) ---
bitmap_dash_timer     EQU #C0D9
bitmap_dash_cooldown  EQU #C0DA
bitmap_dash_lock      EQU #C0DB
bitmap_dash_direction EQU #C0DC

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
    ; Render the start room from the shared tileset already in VRAM.
    ld a, 0
    call load_room
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
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so interrupts stay disabled and the BIOS cannot
    ; consume S#0 before the main loop sees it.
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (bitmap_dash_timer), a
    ld (bitmap_dash_cooldown), a
    ld (bitmap_dash_lock), a
    ld (bitmap_dash_direction), a
.main_loop:
    call bitmap_wait_vblank
    call step_room_composition
    jp c, .skip_player_movement
    call update_player_movement
    call bitmap_try_start_dash
    call bitmap_step_dash_movement
.skip_player_movement:
    call bitmap_update_player_sprite_animation
    call bitmap_upload_player_frame_colors
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
;   current_screen_index updated; bitmap_room_collision_map (RAM) refreshed.
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
;   Repaints the game band via the VDP command engine; LDIR over collision RAM.
;
; NOTES:
;   Pointer tables are word-indexed (DW), the block-count table is byte-indexed.
;   replay_room_commands clobbers DE (vdp_reinit_cmd_pointer writes E), so the
;   collision lookup re-derives the index from current_screen_index in RAM.
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
;   Issues up to 8 V9938 command blocks per call. Each block waits for the
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
    ld a, 8
    ld c, a                 ; C = blocks to process this frame
    ld a, h
    or a
    jp nz, .budget_ready
    ld a, l
    cp 8
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
;   current_screen_index, bitmap_displayed_page and collision RAM updated.
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
;   Copies the target collision grid to RAM, flips VDP R#2, restores R#15=0,
;   clears bitmap_composition_state, and resets vertical player velocity.
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
    xor a
    ld (player_vy), a
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
.check_jump:
    bit 0, c
    jp nz, .jump_pressed
    bit 5, c
    jp z, .jump_released
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .apply_gravity
    ld a, #F8              ; -8 px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
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
    ld a, (player_vy)
    cp 6              ; terminal fall speed px/frame (Player Config maxFallSpeed)
    jp z, .apply_vertical_velocity
    inc a
    ld (player_vy), a
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
    ; A = signed dx. Commits player_x when the leading edge is not solid.
    ; Probes top and bottom of the 16x16 body. Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_x)
    bit 7, b
    jp z, .check_right_bounds
    cp 2
    ret c
    jp .x_bounds_ok
.check_right_bounds:
    cp 239
    ret nc
.x_bounds_ok:
    ld a, (player_x)
    add a, b                ; A = candidate X (top-left)
    push af                 ; save candidate across the probe
    bit 7, b
    jp nz, .left_edge
    add a, 15               ; moving right: probe the right edge
.left_edge:
    ld b, a                 ; B = probe X (left edge keeps the candidate X)
    ld a, (player_y)
    inc a
    ld c, a                 ; C = probe Y (top inset)
    call bitmap_probe_solid
    jp nz, .x_blocked
    ld a, (player_y)
    add a, 15
    ld c, a                 ; C = probe Y (bottom)
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
    ; leading edge is not solid. Carry set on blocked. Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_y)
    add a, b                ; A = candidate Y (top-left)
    push af
    bit 7, b
    jp nz, .up_edge
    add a, 15               ; moving down: probe the bottom edge
.up_edge:
    ld c, a                 ; C = probe Y (top edge keeps the candidate Y)
    ld a, (player_x)
    inc a
    ld b, a                 ; B = probe X (left inset)
    call bitmap_probe_solid
    jp nz, .y_blocked
    ld a, (player_x)
    add a, 14
    ld b, a                 ; B = probe X (right inset)
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
    ; when empty. Index = (Y & #F0) + (X >> 4) into the 16x12 grid. Because a
    ; cell is 16 px, (Y >> 4) * 16 == (Y & #F0). Clobbers AF/DE/HL; keeps BC.
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
    ld a, (player_y)
    add a, 20
    out (#98), a
    ld a, (player_x)
    out (#98), a
    ld a, (player_pat)
    out (#98), a
    ld a, (player_ec)
    out (#98), a
    ld a, (player_y)
    add a, 20
    out (#98), a
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
; FUNCTION: bitmap_dash_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the dash key ('M', keyboard matrix row 4 bit 2) via PPI.
; INPUT: none.
; OUTPUT: A = 1 when pressed, A = 0 otherwise (Z set when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row 4 on PPI_C. update_player_movement
;   re-selects row 8 next frame, so the transient selection is safe.
; ------------------------------------------------------------
bitmap_dash_pressed:
    in a, (PPI_C)
    and #F0
    or 4
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #04
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dash_grounded
; ------------------------------------------------------------
; PURPOSE: True when a solid 16x16 cell sits directly below the player feet.
; INPUT: player_x, player_y. OUTPUT: A = 1 grounded, A = 0 airborne (Z when airborne).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_dash_grounded:
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
; FUNCTION: bitmap_tick_dash_cooldown
; ------------------------------------------------------------
; PURPOSE: Decrements the dash cooldown when active.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_tick_dash_cooldown:
    ld a, (bitmap_dash_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_dash_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dash_release_lock
; ------------------------------------------------------------
; PURPOSE: Clears the requireKeyRelease lock once the dash key is released.
; INPUT: none. OUTPUT: none. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; CALLS: bitmap_dash_pressed.
; ------------------------------------------------------------
bitmap_dash_release_lock:
    call bitmap_dash_pressed
    or a
    ret nz
    xor a
    ld (bitmap_dash_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_start_dash
; ------------------------------------------------------------
; PURPOSE: Ticks the cooldown and, when key + grounded + cooldown + lock allow,
;   arms a ground dash: latches the direction from player_facing and sets the
;   dash timer/cooldown (and key lock when requireKeyRelease).
; INPUT: none. OUTPUT: bitmap_dash_timer > 0 when a dash started.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_tick_dash_cooldown, bitmap_dash_release_lock, bitmap_dash_pressed,
;   bitmap_dash_grounded.
; NOTES: Direction: player_facing 0=left, 1=right (set by update_player_movement).
; ------------------------------------------------------------
bitmap_try_start_dash:
    call bitmap_tick_dash_cooldown
    ld a, (bitmap_dash_timer)
    or a
    ret nz
    call bitmap_dash_release_lock
    call bitmap_dash_pressed
    or a
    ret z
    call bitmap_dash_grounded
    or a
    ret z
    ld a, (bitmap_dash_cooldown)
    or a
    ret nz
    ld a, (bitmap_dash_lock)
    or a
    ret nz
    ld a, (player_facing)
    ld (bitmap_dash_direction), a
    ld a, #0A
    ld (bitmap_dash_timer), a
    ld a, #14
    ld (bitmap_dash_cooldown), a
    ld a, 1
    ld (bitmap_dash_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_dash_movement
; ------------------------------------------------------------
; PURPOSE: While a dash is active, moves the player 8 px in the latched
;   direction this frame (1px probes via bitmap_try_move_x, so it stops at solids),
;   and decrements the dash timer.
; INPUT: none. OUTPUT: player_x updated; bitmap_dash_timer decremented.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY. CALLS: bitmap_try_move_x.
; NOTES: bitmap_try_move_x clobbers BC, so the djnz counter is kept across the
;   call with push/pop bc (register corruption is the first bug hypothesis).
; ------------------------------------------------------------
bitmap_step_dash_movement:
    ld a, (bitmap_dash_timer)
    or a
    ret z
    dec a
    ld (bitmap_dash_timer), a
    ld a, (bitmap_dash_direction)
    or a
    jp z, .dash_step_left
.dash_step_right:
    ld b, 8
.dash_right_loop:
    push bc
    ld a, #01
    call bitmap_try_move_x
    pop bc
    djnz .dash_right_loop
    ret
.dash_step_left:
    ld b, 8
.dash_left_loop:
    push bc
    ld a, #FF
    call bitmap_try_move_x
    pop bc
    djnz .dash_left_loop
    ret


; VDP palette bytes: byte1=(R<<4)|B, byte2=G
screen5_bitmap_palette_data:
    DB #00,#00,#00,#00,#22,#05,#33,#06,#15,#01,#27,#02,#51,#01,#22,#02
    DB #11,#01,#74,#04,#31,#03,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07

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
; Raw bytes: 8192; encoded bytes: 470
; VRAM #10000, raw 8192 bytes, RLE 470 bytes
bitmap_room_tileset_rle_chunk_0:
    DB #80,#00,#02,#EE,#02,#6E,#04,#EE,#78,#00,#02,#66,#01,#77,#05,#66
    DB #78,#00,#02,#66,#01,#77,#05,#66,#78,#00,#02,#66,#01,#67,#05,#66
    DB #78,#00,#02,#66,#01,#67,#05,#66,#78,#00,#02,#66,#01,#77,#05,#66
    DB #78,#00,#02,#66,#01,#77,#05,#66,#78,#00,#02,#66,#01,#77,#05,#66
    DB #78,#00,#02,#66,#01,#77,#05,#66,#78,#00,#01,#67,#01,#66,#01,#77
    DB #05,#66,#78,#00,#02,#77,#01,#70,#05,#77,#78,#00,#02,#77,#02,#66
    DB #01,#67,#01,#66,#02,#67,#78,#00,#01,#EE,#01,#77,#02,#EE,#01,#66
    DB #01,#EE,#01,#E6,#01,#EE,#78,#00,#07,#66,#01,#76,#78,#00,#06,#66
    DB #01,#67,#01,#76,#78,#00,#01,#6E,#01,#66,#01,#EE,#03,#66,#01,#EE
    DB #01,#66,#78,#00,#01,#E6,#06,#66,#01,#67,#78,#00,#01,#EE,#07,#66
    DB #78,#00,#01,#86,#05,#66,#01,#67,#01,#66,#78,#00,#01,#EE,#05,#66
    DB #01,#67,#01,#66,#78,#00,#01,#77,#05,#66,#01,#67,#01,#66,#78,#00
    DB #01,#6E,#05,#66,#01,#67,#01,#76,#78,#00,#01,#EE,#06,#66,#01,#77
    DB #78,#00,#01,#86,#06,#66,#01,#AA,#78,#00,#01,#86,#04,#66,#01,#67
    DB #02,#77,#78,#00,#01,#E6,#04,#66,#01,#6E,#01,#EE,#01,#66,#78,#00
    DB #02,#E6,#05,#66,#01,#6E,#78,#00,#01,#77,#01,#76,#02,#66,#01,#67
    DB #03,#66,#78,#00,#01,#66,#01,#77,#02,#66,#01,#77,#03,#66,#78,#00
    DB #01,#76,#03,#77,#01,#67,#01,#66,#01,#67,#01,#66,#78,#00,#03,#77
    DB #02,#97,#03,#77,#F8,#00,#06,#88,#01,#80,#01,#88,#78,#00,#02,#77
    DB #02,#76,#01,#67,#01,#76,#01,#66,#01,#67,#79,#00,#01,#77,#02,#00
    DB #01,#67,#01,#77,#01,#76,#01,#67,#78,#00,#01,#77,#01,#76,#01,#77
    DB #01,#66,#02,#EE,#01,#E6,#01,#66,#78,#00,#01,#77,#01,#7E,#01,#E7
    DB #01,#77,#02,#76,#01,#67,#01,#77,#78,#00,#01,#77,#01,#EE,#02,#77
    DB #01,#76,#01,#67,#02,#77,#78,#00,#02,#76,#02,#77,#01,#66,#03,#77
    DB #78,#00,#01,#77,#01,#67,#06,#77,#78,#00,#01,#77,#01,#66,#06,#77
    DB #78,#00,#01,#77,#01,#66,#06,#77,#78,#00,#01,#77,#01,#76,#06,#77
    DB #78,#00,#01,#87,#07,#77,#78,#00,#02,#77,#01,#67,#05,#77,#78,#00
    DB #01,#77,#01,#66,#01,#67,#02,#77,#01,#87,#02,#77,#78,#00,#01,#77
    DB #01,#66,#06,#77,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00,#FF,#00
    DB #FF,#00,#FF,#00,#80,#00
bitmap_room_tileset_rle_chunk_0_end:

bitmap_room_tileset_data_end:

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
    DW 36
    DW 21
    DW 30

bitmap_room_collision_ptr_table:
    DW bitmap_room_collision_0
    DW bitmap_room_collision_1
    DW bitmap_room_collision_2

; Edge rails per room: west,east,north,south (#FF = none)
bitmap_room_transition_table:
    DB #FF,#01,#FF,#FF,#00,#02,#FF,#FF,#01,#FF,#FF,#FF

; Per-room render programs and collision maps.
; Room 0 page 0 render program: 36 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#11,#00,#80,#00
    DB #00,#10,#02,#10,#00,#64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #10,#02,#20,#00,#64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10
    DB #02,#30,#00,#64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02
    DB #50,#00,#64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#60
    DB #00,#64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#70,#00
    DB #64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#90,#00,#64
    DB #00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#A0,#00,#64,#00
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#B0,#00,#64,#00,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#D0,#00,#64,#00,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#10,#02,#E0,#00,#64,#00,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#10,#02,#F0,#00,#64,#00,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#10,#02,#D0,#00,#74,#00,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#10,#02,#E0,#00,#74,#00,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#10,#02,#F0,#00,#74,#00,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#10,#02,#60,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#10,#02,#70,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #10,#02,#80,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10
    DB #02,#90,#00,#B4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #00,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#10
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#20,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#30,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#40,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#50,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#60,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90
; Room 0 page 1 render program: 36 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_0_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#11,#00,#80,#00
    DB #00,#10,#02,#10,#00,#64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #10,#02,#20,#00,#64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10
    DB #02,#30,#00,#64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02
    DB #50,#00,#64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#60
    DB #00,#64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#70,#00
    DB #64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#90,#00,#64
    DB #01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#A0,#00,#64,#01
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#B0,#00,#64,#01,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#10,#02,#D0,#00,#64,#01,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#10,#02,#E0,#00,#64,#01,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#10,#02,#F0,#00,#64,#01,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#10,#02,#D0,#00,#74,#01,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#10,#02,#E0,#00,#74,#01,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#10,#02,#F0,#00,#74,#01,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#10,#02,#60,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#10,#02,#70,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #10,#02,#80,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#10
    DB #02,#90,#00,#B4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #00,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#10
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#20,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#30,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#40,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#50,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#60,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90
; Room 0 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#00,#10,#10,#10,#00,#10,#10,#10,#00,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10

; Room 1 page 0 render program: 21 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#80,#00
    DB #00,#00,#02,#E0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#F0,#00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#00,#00,#64,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #00,#00,#74,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#00
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#10,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#20,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#30,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#40,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#50,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#60,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#70,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#80,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#00,#02,#90,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#00,#02,#A0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#00,#02,#B0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#00,#02,#C0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#D0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#E0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #F0,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90
; Room 1 page 1 render program: 21 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_1_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#80,#00
    DB #00,#00,#02,#E0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#F0,#00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#00,#00,#64,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #00,#00,#74,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#00
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#10,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#20,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#30,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#40,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#50,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#60,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#70,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#80,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#00,#02,#90,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#00,#02,#A0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#00,#02,#B0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#00,#02,#C0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#D0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#E0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #F0,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90
; Room 1 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_1:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10

; Room 2 page 0 render program: 30 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p0:
    DB #00,#00,#00,#00,#00,#00,#14,#00,#00,#01,#C0,#00,#00,#00,#80,#00
    DB #00,#00,#02,#00,#00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#10,#00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#20,#00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #30,#00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#40
    DB #00,#24,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#60,#00
    DB #54,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#70,#00,#54
    DB #00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#80,#00,#54,#00
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#90,#00,#54,#00,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#A0,#00,#54,#00,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#C0,#00,#84,#00,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#D0,#00,#84,#00,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#E0,#00,#84,#00,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#00,#02,#00,#00,#C4,#00,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#00,#02,#10,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#00,#02,#20,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#00,#02,#30,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#40,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#50,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #60,#00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#70
    DB #00,#C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#80,#00
    DB #C4,#00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#90,#00,#C4
    DB #00,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#A0,#00,#C4,#00
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#B0,#00,#C4,#00,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#C0,#00,#C4,#00,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#D0,#00,#C4,#00,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#E0,#00,#C4,#00,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#F0,#00,#C4,#00,#10,#00,#10,#00,#00
    DB #00,#90
; Room 2 page 1 render program: 30 V9938 command blocks (clear + 16x16 tile copies)
bitmap_room_render_2_p1:
    DB #00,#00,#00,#00,#00,#00,#14,#01,#00,#01,#C0,#00,#00,#00,#80,#00
    DB #00,#00,#02,#00,#00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#10,#00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#20,#00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #30,#00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#40
    DB #00,#24,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#60,#00
    DB #54,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#70,#00,#54
    DB #01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#80,#00,#54,#01
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#90,#00,#54,#01,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#A0,#00,#54,#01,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#C0,#00,#84,#01,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#D0,#00,#84,#01,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#E0,#00,#84,#01,#10,#00,#10,#00,#00
    DB #00,#90,#00,#00,#00,#02,#00,#00,#C4,#01,#10,#00,#10,#00,#00,#00
    DB #90,#00,#00,#00,#02,#10,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90
    DB #00,#00,#00,#02,#20,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00
    DB #00,#00,#02,#30,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00
    DB #00,#02,#40,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00
    DB #02,#50,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02
    DB #60,#00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#70
    DB #00,#C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#80,#00
    DB #C4,#01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#90,#00,#C4
    DB #01,#10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#A0,#00,#C4,#01
    DB #10,#00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#B0,#00,#C4,#01,#10
    DB #00,#10,#00,#00,#00,#90,#00,#00,#00,#02,#C0,#00,#C4,#01,#10,#00
    DB #10,#00,#00,#00,#90,#00,#00,#00,#02,#D0,#00,#C4,#01,#10,#00,#10
    DB #00,#00,#00,#90,#00,#00,#00,#02,#E0,#00,#C4,#01,#10,#00,#10,#00
    DB #00,#00,#90,#00,#00,#00,#02,#F0,#00,#C4,#01,#10,#00,#10,#00,#00
    DB #00,#90
; Room 2 16x12 collision grid (16x16 px cells), row-major, 0=empty
bitmap_room_collision_2:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10


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
