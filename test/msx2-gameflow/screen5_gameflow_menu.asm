; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 GameFlow backend (generic node walker)
; Project: screen5_gameflow_menu
; Screen mode: SCREEN 5 (Graphics III)
; Backend: msx2-screen5-gameflow
; MSX2_GAMEFLOW_PRESENT: yes
; MSX2_GAMEFLOW_ASSET: Main MSX2
; MSX2_GAMEFLOW_START_NODE: gf_start
; MSX2_GAMEFLOW_NODE_COUNT: 13
; MSX2_GAMEFLOW_NODE_TYPES: Start,Screen5Presentation,SubMenu,Transition,Text,TextScrollColor,TextScroll,End
; MSX2_GAMEFLOW_VRAM_PAGE: 0
; ROM mode requested: simple32k
; ROM Mode: simple32k
; Mapper Target: konami
; SCREEN5_PRESENTATION_COMPRESSION: ZX0
; SCREEN5_PRESENTATION_CHUNK_LINES: 32
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
LDIRVM  EQU #005C
FILVRM  EQU #0056
CHGET   EQU #009F
CHSNS   EQU #009C
KILBUF  EQU #0156
GTSTCK  EQU #00D5
GTTRIG  EQU #00D8
WRTPSG  EQU #0093
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
VDP_PALETTE_PORT EQU #9A
SCREEN5_PRESENTATION_ZX0_BUFFER EQU #D000
SCREEN5_PRESENTATION_BITMAP_SIZE EQU 27136
SCREEN5_PRESENTATION_VISIBLE_LINES EQU 212
SCREEN5_PRESENTATION_BYTES_PER_LINE EQU 128

; ---- SCREEN 5 GameFlow runtime constants ----
GF_VDP_CTRL_PORT EQU #99
GF_VDP_DATA_PORT EQU #9B
GF_VDP_PAL_PORT  EQU #9A
GF_LINE_BYTES    EQU 128
GF_CHAR_HEIGHT   EQU 8
GF_FONT_GLYPHS   EQU 59
GF_PAGE_Y        EQU 0
GF_VRAM_BASE     EQU #0000
GF_WIPE_LINES    EQU 212
GF_SCROLL_TOP    EQU 40
GF_SCROLL_HEIGHT EQU 144
GF_SCROLL_STEP   EQU 12

; ---- SCREEN 5 GameFlow runtime RAM ----
GF_FG_PIX        EQU #C800   ; foreground palette index used by gf_print
GF_BG_PIX        EQU #C801   ; background palette index used by gf_print
GF_PRINT_WIDTH   EQU #C802   ; span width in bytes of the string being drawn
GF_PRINT_ROWS    EQU #C803   ; blit row counter
GF_PRINT_DEST    EQU #C804   ; word: VRAM address of the string top-left byte
GF_MENU_INDEX    EQU #C806   ; highlighted SubMenu option
GF_MENU_PREV     EQU #C807   ; previous GTSTCK value (edge detection)
GF_SCROLL_BG     EQU #C808   ; palette index used to clear the scroll band
GF_MIRROR_X      EQU #C80A   ; word: mirror wipe cursor
GF_CMD_PARAMS    EQU #C810   ; 15 bytes mirroring VDP R#32..R#46
GF_CMD_SX        EQU GF_CMD_PARAMS + 0
GF_CMD_SY        EQU GF_CMD_PARAMS + 2
GF_CMD_DX        EQU GF_CMD_PARAMS + 4
GF_CMD_DY        EQU GF_CMD_PARAMS + 6
GF_CMD_NX        EQU GF_CMD_PARAMS + 8
GF_CMD_NY        EQU GF_CMD_PARAMS + 10
GF_CMD_CLR       EQU GF_CMD_PARAMS + 12
GF_CMD_ARG       EQU GF_CMD_PARAMS + 13
GF_CMD_CMD       EQU GF_CMD_PARAMS + 14
GF_PALETTE_RAM   EQU #C820   ; 32 bytes: live palette, faded in place
GF_TEXTBUF       EQU #CA00   ; 8 rows x 128 bytes staging buffer


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
    call DISSCR
    ld a, 5
    call CHGMOD
    ; CHGMOD resets R#2; re-select the SCREEN 5 display page used by the flow.
    ld bc, #1F02
    call WRTVDP
    ld bc, #0007
    call WRTVDP
    call gf_clear_page
    call ENASCR
    ei
    jp gf_node_gf_start

map_page2_to_cart_primary:
    ; Map #8000-#BFFF to the same primary/expanded slot as cart page #4000.
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jr z, gf_slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
gf_slot_ready:
    or c
    ret

gf_halt:
    halt
    jp gf_halt

; ==================================================================
; GameFlow node routines
; ==================================================================
gf_node_gf_start:
    ; MSX2_GAMEFLOW_NODE Start gf_start
    jp gf_node_gf_title

gf_node_gf_title:
    ; MSX2_GAMEFLOW_NODE Screen5Presentation gf_title
    call DISSCR
    call gf_load_palette_0
    call gf_upload_bitmap_0
    call ENASCR
    call gf_wait_key
    jp gf_node_gf_menu

gf_node_gf_menu:
    ; MSX2_GAMEFLOW_NODE SubMenu gf_menu
    xor a
    ld (GF_MENU_INDEX), a
    ld a, #08
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_4
    ld de, #1027
    ld b, 48
    call gf_print
    call gf_menu_wait_release
    call gf_menu_draw_gf_menu
gf_menu_loop_gf_menu:
    halt
    call gf_menu_read_stick
    ld c, a
    ld a, (GF_MENU_PREV)
    cp c
    jp z, gf_menu_trigger_gf_menu
    ld a, c
    ld (GF_MENU_PREV), a
    cp 1
    jp z, gf_menu_up_gf_menu
    cp 5
    jp z, gf_menu_down_gf_menu
    jp gf_menu_trigger_gf_menu
gf_menu_up_gf_menu:
    ld a, (GF_MENU_INDEX)
    or a
    jp z, gf_menu_wrap_gf_menu
    dec a
    jp gf_menu_apply_gf_menu
gf_menu_wrap_gf_menu:
    ld a, 3
    jp gf_menu_apply_gf_menu
gf_menu_down_gf_menu:
    ld a, (GF_MENU_INDEX)
    inc a
    cp 4
    jp c, gf_menu_apply_gf_menu
    xor a
gf_menu_apply_gf_menu:
    ld (GF_MENU_INDEX), a
    call gf_menu_draw_gf_menu
gf_menu_trigger_gf_menu:
    call gf_menu_read_trigger
    or a
    jp z, gf_menu_loop_gf_menu
    ld a, (GF_MENU_INDEX)
    cp 0
    jp z, gf_node_gf_wipe_start
    cp 1
    jp z, gf_node_gf_wipe_story
    cp 2
    jp z, gf_node_gf_wipe_credits
    cp 3
    jp z, gf_node_gf_wipe_exit
    jp gf_menu_loop_gf_menu

gf_menu_draw_gf_menu:
    ld a, (GF_MENU_INDEX)
    cp 0
    jp z, gf_menu_sel_gf_menu_0
    ld a, #08
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_0
    ld de, #242A
    ld b, 42
    call gf_print
    jp gf_menu_done_gf_menu_0
gf_menu_sel_gf_menu_0:
    ld a, #01
    ld (GF_FG_PIX), a
    ld a, #0F
    ld (GF_BG_PIX), a
    ld hl, gf_str_0
    ld de, #242A
    ld b, 42
    call gf_print
gf_menu_done_gf_menu_0:
    ld a, (GF_MENU_INDEX)
    cp 1
    jp z, gf_menu_sel_gf_menu_1
    ld a, #08
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_1
    ld de, #2D2A
    ld b, 42
    call gf_print
    jp gf_menu_done_gf_menu_1
gf_menu_sel_gf_menu_1:
    ld a, #01
    ld (GF_FG_PIX), a
    ld a, #0F
    ld (GF_BG_PIX), a
    ld hl, gf_str_1
    ld de, #2D2A
    ld b, 42
    call gf_print
gf_menu_done_gf_menu_1:
    ld a, (GF_MENU_INDEX)
    cp 2
    jp z, gf_menu_sel_gf_menu_2
    ld a, #08
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_2
    ld de, #362A
    ld b, 42
    call gf_print
    jp gf_menu_done_gf_menu_2
gf_menu_sel_gf_menu_2:
    ld a, #01
    ld (GF_FG_PIX), a
    ld a, #0F
    ld (GF_BG_PIX), a
    ld hl, gf_str_2
    ld de, #362A
    ld b, 42
    call gf_print
gf_menu_done_gf_menu_2:
    ld a, (GF_MENU_INDEX)
    cp 3
    jp z, gf_menu_sel_gf_menu_3
    ld a, #08
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_3
    ld de, #3F2A
    ld b, 42
    call gf_print
    jp gf_menu_done_gf_menu_3
gf_menu_sel_gf_menu_3:
    ld a, #01
    ld (GF_FG_PIX), a
    ld a, #0F
    ld (GF_BG_PIX), a
    ld hl, gf_str_3
    ld de, #3F2A
    ld b, 42
    call gf_print
gf_menu_done_gf_menu_3:
    ret

gf_node_gf_wipe_start:
    ; MSX2_GAMEFLOW_NODE Transition gf_wipe_start
    call gf_wipe_vertical
    ld b, #14
    call gf_wait_frames
    jp gf_node_gf_text_start

gf_node_gf_wipe_story:
    ; MSX2_GAMEFLOW_NODE Transition gf_wipe_story
    call gf_wipe_horizontal
    ld b, #0A
    call gf_wait_frames
    jp gf_node_gf_scroll_story

gf_node_gf_wipe_credits:
    ; MSX2_GAMEFLOW_NODE Transition gf_wipe_credits
    call gf_wipe_mirror
    ld b, #0A
    call gf_wait_frames
    jp gf_node_gf_scroll_credits

gf_node_gf_wipe_exit:
    ; MSX2_GAMEFLOW_NODE Transition gf_wipe_exit
    call gf_wipe_diagonal
    ld b, #0A
    call gf_wait_frames
    jp gf_node_gf_end

gf_node_gf_text_start:
    ; MSX2_GAMEFLOW_NODE Text gf_text_start
    ld a, #0F
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_10
    ld de, #0C27
    ld b, 48
    call gf_print
    ld a, #0F
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_5
    ld de, #1C12
    ld b, 90
    call gf_print
    ld a, #0F
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_6
    ld de, #2218
    ld b, 75
    call gf_print
    ld a, #0F
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_7
    ld de, #2824
    ld b, 51
    call gf_print
    ld a, #0F
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_8
    ld de, #2E27
    ld b, 48
    call gf_print
    ld a, #0F
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_9
    ld de, #582A
    ld b, 39
    call gf_print
    call gf_wait_key
    jp gf_node_gf_fade_start

gf_node_gf_scroll_story:
    ; MSX2_GAMEFLOW_NODE TextScrollColor gf_scroll_story
    ld a, #01
    ld (GF_SCROLL_BG), a
    call gf_scroll_clear_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_17
    ld de, #0A36
    ld b, 15
    call gf_print
    call gf_scroll_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_11
    ld de, #5712
    ld b, 87
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_12
    ld de, #571B
    ld b, 72
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_13
    ld de, #5715
    ld b, 84
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_14
    ld de, #5724
    ld b, 51
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_15
    ld de, #5721
    ld b, 57
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #0A
    ld (GF_FG_PIX), a
    ld a, #01
    ld (GF_BG_PIX), a
    ld hl, gf_str_16
    ld de, #5715
    ld b, 81
    call gf_print
    ld b, #10
    call gf_wait_frames
    ld b, 12
gf_scroll_tail_gf_scroll_story:
    push bc
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    pop bc
    djnz gf_scroll_tail_gf_scroll_story
    call gf_wait_key
    jp gf_node_gf_title_back

gf_node_gf_scroll_credits:
    ; MSX2_GAMEFLOW_NODE TextScroll gf_scroll_credits
    ld a, #02
    ld (GF_SCROLL_BG), a
    call gf_scroll_clear_window
    ld a, #07
    ld (GF_FG_PIX), a
    ld a, #02
    ld (GF_BG_PIX), a
    ld hl, gf_str_23
    ld de, #0A33
    ld b, 21
    call gf_print
    call gf_scroll_window
    ld a, #07
    ld (GF_FG_PIX), a
    ld a, #02
    ld (GF_BG_PIX), a
    ld hl, gf_str_18
    ld de, #571E
    ld b, 66
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #07
    ld (GF_FG_PIX), a
    ld a, #02
    ld (GF_BG_PIX), a
    ld hl, gf_str_19
    ld de, #5727
    ld b, 48
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #07
    ld (GF_FG_PIX), a
    ld a, #02
    ld (GF_BG_PIX), a
    ld hl, gf_str_20
    ld de, #571B
    ld b, 69
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #07
    ld (GF_FG_PIX), a
    ld a, #02
    ld (GF_BG_PIX), a
    ld hl, gf_str_21
    ld de, #571B
    ld b, 69
    call gf_print
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    call gf_scroll_window
    ld a, #07
    ld (GF_FG_PIX), a
    ld a, #02
    ld (GF_BG_PIX), a
    ld hl, gf_str_22
    ld de, #5724
    ld b, 54
    call gf_print
    ld b, #10
    call gf_wait_frames
    ld b, 12
gf_scroll_tail_gf_scroll_credits:
    push bc
    call gf_scroll_window
    ld b, #10
    call gf_wait_frames
    pop bc
    djnz gf_scroll_tail_gf_scroll_credits
    call gf_wait_key
    jp gf_node_gf_title_back

gf_node_gf_end:
    ; MSX2_GAMEFLOW_NODE End gf_end
    ld a, #08
    ld (GF_FG_PIX), a
    ld a, #00
    ld (GF_BG_PIX), a
    ld hl, gf_str_22
    ld de, #3024
    ld b, 54
    call gf_print
    jp gf_halt

gf_node_gf_fade_start:
    ; MSX2_GAMEFLOW_NODE Transition gf_fade_start
    call gf_fade_out
    ld b, #0A
    call gf_wait_frames
    jp gf_node_gf_title_back

gf_node_gf_title_back:
    ; MSX2_GAMEFLOW_NODE Screen5Presentation gf_title_back
    call DISSCR
    call gf_load_palette_0
    call gf_upload_bitmap_0
    call ENASCR
    jp gf_node_gf_menu

; ==================================================================
; SCREEN 5 presentation data routines
; ==================================================================
gf_load_palette_0:
    ld hl, gf_palette_0_data
    ld de, GF_PALETTE_RAM
    ld bc, 32
    ldir
    jp gf_upload_palette_ram

gf_upload_bitmap_0:
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_0
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_0
    ld de, #0000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_0_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_1
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_1
    ld de, #1000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_1_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_2
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_2
    ld de, #2000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_2_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_3
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_3
    ld de, #3000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_3_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_4
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_4
    ld de, #4000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_4_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_5
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_5
    ld de, #5000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_5_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_FLOW_0_BITMAP_CHUNK_6
    ld hl, SCREEN5_FLOW_0_BITMAP_CHUNK_6
    ld de, #6000
    ld bc, SCREEN5_FLOW_0_BITMAP_CHUNK_6_SIZE
    call LDIRVM
    ret

; ==================================================================
; Shared runtime
; ==================================================================

; ------------------------------------------------------------------
; gf_vdp_wait: block until the V9938 command engine reports idle (S#2 bit0).
; Clobbers AF. Leaves the status register selector back on S#0.
; ------------------------------------------------------------------
gf_vdp_wait:
    ld a, 2
    di
    out (GF_VDP_CTRL_PORT), a
    ld a, #8F
    out (GF_VDP_CTRL_PORT), a
    in a, (GF_VDP_CTRL_PORT)
    ex af, af'
    xor a
    out (GF_VDP_CTRL_PORT), a
    ld a, #8F
    out (GF_VDP_CTRL_PORT), a
    ei
    ex af, af'
    and #01
    jp nz, gf_vdp_wait
    ret

; ------------------------------------------------------------------
; gf_vdp_exec: push GF_CMD_PARAMS into R#32..R#46 through the indirect
; register port. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_vdp_exec:
    call gf_vdp_wait
    di
    ld a, 32
    out (GF_VDP_CTRL_PORT), a
    ld a, #91
    out (GF_VDP_CTRL_PORT), a
    ld hl, GF_CMD_PARAMS
    ld c, GF_VDP_DATA_PORT
    ld b, 15
    otir
    ei
    ret

; ------------------------------------------------------------------
; gf_set_fill_color: A = palette index -> GF_CMD_CLR = both nibbles.
; ------------------------------------------------------------------
gf_set_fill_color:
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (GF_CMD_CLR), a
    ret

; ------------------------------------------------------------------
; gf_fill_rect (HMMV) / gf_copy_rect (HMMM): callers fill the DX/DY/NX/NY
; (and SX/SY) words plus GF_CMD_CLR first. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_fill_rect:
    xor a
    ld (GF_CMD_ARG), a
    ld a, #C0
    ld (GF_CMD_CMD), a
    call gf_vdp_exec
    jp gf_vdp_wait

gf_copy_rect:
    xor a
    ld (GF_CMD_ARG), a
    ld a, #D0
    ld (GF_CMD_CMD), a
    call gf_vdp_exec
    jp gf_vdp_wait

; ------------------------------------------------------------------
; gf_clear_page: HMMV over the whole visible page with palette index 0.
; ------------------------------------------------------------------
gf_clear_page:
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_WIPE_LINES
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    jp gf_fill_rect

; ------------------------------------------------------------------
; gf_upload_palette_ram: R#16 = 0, then the 32 live palette bytes.
; Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_upload_palette_ram:
    ld bc, #0010
    call WRTVDP
    ld hl, GF_PALETTE_RAM
    ld b, 32
gf_upload_palette_loop:
    ld a, (hl)
    out (GF_VDP_PAL_PORT), a
    inc hl
    djnz gf_upload_palette_loop
    ret

; ------------------------------------------------------------------
; gf_fade_out: 8 steps, each one dims every R/G/B component by one level
; and re-uploads GF_PALETTE_RAM. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_fade_out:
    ld b, 8
gf_fade_out_step:
    push bc
    call gf_fade_one_level
    halt
    halt
    halt
    pop bc
    djnz gf_fade_out_step
    ret

gf_fade_one_level:
    ld hl, GF_PALETTE_RAM
    ld b, 16
gf_fade_slot_loop:
    ld a, (hl)
    and #F0
    jp z, gf_fade_red_done
    sub #10
gf_fade_red_done:
    ld c, a
    ld a, (hl)
    and #0F
    jp z, gf_fade_blue_done
    dec a
gf_fade_blue_done:
    or c
    ld (hl), a
    inc hl
    ld a, (hl)
    and #07
    jp z, gf_fade_green_done
    dec a
gf_fade_green_done:
    ld (hl), a
    inc hl
    djnz gf_fade_slot_loop
    jp gf_upload_palette_ram

; ------------------------------------------------------------------
; gf_print: draw a zero-terminated ASCII string (chars 32..90).
;   HL = string pointer
;   DE = VRAM address of the top-left byte of the text span
;   B  = span width in bytes (3 per character cell)
; Colours come from GF_FG_PIX / GF_BG_PIX. Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------------
gf_print:
    ld (GF_PRINT_DEST), de
    ld a, b
    ld (GF_PRINT_WIDTH), a
    push hl
    call gf_fill_textbuf
    pop hl
    ld c, 0
gf_print_char_loop:
    ld a, (hl)
    or a
    jp z, gf_print_blit
    inc hl
    ld e, a
    ld a, (GF_PRINT_WIDTH)
    sub c
    cp 3
    jp c, gf_print_blit
    ld a, e
    push hl
    call gf_draw_char
    pop hl
    ld a, c
    add a, 3
    ld c, a
    jp gf_print_char_loop

gf_print_blit:
    ld hl, GF_TEXTBUF
    ld de, (GF_PRINT_DEST)
    ld a, GF_CHAR_HEIGHT
    ld (GF_PRINT_ROWS), a
gf_print_blit_loop:
    push hl
    push de
    ld a, (GF_PRINT_WIDTH)
    ld c, a
    ld b, 0
    call LDIRVM
    pop de
    pop hl
    ld a, (GF_PRINT_WIDTH)
    ld c, a
    ld b, 0
    add hl, bc
    ex de, hl
    ld bc, GF_LINE_BYTES
    add hl, bc
    ex de, hl
    ld a, (GF_PRINT_ROWS)
    dec a
    ld (GF_PRINT_ROWS), a
    jp nz, gf_print_blit_loop
    ret

; Fill GF_TEXTBUF (8 rows x GF_PRINT_WIDTH bytes) with the background colour.
gf_fill_textbuf:
    ld a, (GF_BG_PIX)
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ld (GF_TEXTBUF), a
    ld a, (GF_PRINT_WIDTH)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    dec hl
    ld b, h
    ld c, l
    ld hl, GF_TEXTBUF
    ld de, GF_TEXTBUF + 1
    ldir
    ret

; A = character code, C = byte column inside the span.
gf_draw_char:
    push bc
    call gf_draw_char_inner
    pop bc
    ret

gf_draw_char_inner:
    sub 32
    ret c
    cp GF_FONT_GLYPHS
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, gf_font_data
    add hl, de
    ld e, c
    ld d, 0
    push hl
    ld hl, GF_TEXTBUF
    add hl, de
    ex de, hl
    pop hl
    ld b, GF_CHAR_HEIGHT
gf_draw_char_row:
    ld a, (hl)
    inc hl
    push hl
    push bc
    call gf_expand_row
    pop bc
    pop hl
    ld a, (GF_PRINT_WIDTH)
    sub 3
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    djnz gf_draw_char_row
    ret

; A = glyph row bits (bit7 leftmost). Writes 3 bytes / 6 pixels at (DE).
gf_expand_row:
    ld c, a
    ld b, 3
gf_expand_row_loop:
    ld a, c
    rlca
    ld c, a
    call gf_expand_pick
    rlca
    rlca
    rlca
    rlca
    ld l, a
    ld a, c
    rlca
    ld c, a
    call gf_expand_pick
    or l
    ld (de), a
    inc de
    djnz gf_expand_row_loop
    ret

gf_expand_pick:
    jp nc, gf_expand_pick_bg
    ld a, (GF_FG_PIX)
    ret
gf_expand_pick_bg:
    ld a, (GF_BG_PIX)
    ret

; ------------------------------------------------------------------
; gf_wait_key / gf_wait_frames
; ------------------------------------------------------------------
gf_wait_key:
    call KILBUF
gf_wait_key_loop:
    halt
    call CHSNS
    jp z, gf_wait_key_loop
    call CHGET
    ret

gf_wait_frames:
    ld a, b
    or a
    ret z
gf_wait_frames_loop:
    halt
    djnz gf_wait_frames_loop
    ret

; ------------------------------------------------------------------
; gf_menu_wait_release: swallow a trigger that is still held from the
; previous node so the menu does not self-select on entry.
; ------------------------------------------------------------------
gf_menu_wait_release:
    call KILBUF
gf_menu_wait_release_loop:
    halt
    xor a
    call GTTRIG
    or a
    jp nz, gf_menu_wait_release_loop
    xor a
    ld (GF_MENU_PREV), a
    ret

; ------------------------------------------------------------------
; gf_menu_read_stick: merge cursor keys (port 0) and joystick 1 so the
; menu answers to both. Returns A = 0 idle / 1 up / 5 down.
; ------------------------------------------------------------------
gf_menu_read_stick:
    xor a
    call GTSTCK
    or a
    ret nz
    ld a, 1
    jp GTSTCK

; ------------------------------------------------------------------
; gf_menu_read_trigger: space bar or joystick 1 fire. A = 0 when idle.
; ------------------------------------------------------------------
gf_menu_read_trigger:
    xor a
    call GTTRIG
    or a
    ret nz
    ld a, 1
    jp GTTRIG

; ------------------------------------------------------------------
; gf_scroll_window: HMMM the text window up by GF_SCROLL_STEP pixels and
; clear the freed band with GF_SCROLL_BG. Clobbers AF, BC, HL.
; ------------------------------------------------------------------
gf_scroll_window:
    ld hl, 0
    ld (GF_CMD_SX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP + GF_SCROLL_STEP
    ld (GF_CMD_SY), hl
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_SCROLL_HEIGHT - GF_SCROLL_STEP
    ld (GF_CMD_NY), hl
    call gf_copy_rect
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP + GF_SCROLL_HEIGHT - GF_SCROLL_STEP
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_SCROLL_STEP
    ld (GF_CMD_NY), hl
    ld a, (GF_SCROLL_BG)
    call gf_set_fill_color
    jp gf_fill_rect

; ------------------------------------------------------------------
; gf_scroll_clear_window: paint the whole window with GF_SCROLL_BG.
; ------------------------------------------------------------------
gf_scroll_clear_window:
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, GF_PAGE_Y + GF_SCROLL_TOP
    ld (GF_CMD_DY), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, GF_SCROLL_HEIGHT
    ld (GF_CMD_NY), hl
    ld a, (GF_SCROLL_BG)
    call gf_set_fill_color
    jp gf_fill_rect

; Vertical pixel wipe: 4-pixel columns, one HMMV column per frame.
gf_wipe_vertical:
    ld hl, 0
    ld (GF_CMD_DX), hl
gf_wipe_vertical_loop:
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
    ld hl, 4
    ld (GF_CMD_NX), hl
    ld hl, GF_WIPE_LINES
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    call gf_fill_rect
    halt
    ld hl, (GF_CMD_DX)
    ld de, 4
    add hl, de
    ld (GF_CMD_DX), hl
    ld de, 256
    or a
    sbc hl, de
    jp c, gf_wipe_vertical_loop
    ret

; Horizontal pixel wipe: 4-line bands, one HMMV band per frame.
gf_wipe_horizontal:
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
gf_wipe_horizontal_loop:
    ld hl, 0
    ld (GF_CMD_DX), hl
    ld hl, 256
    ld (GF_CMD_NX), hl
    ld hl, 4
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    call gf_fill_rect
    halt
    ld hl, (GF_CMD_DY)
    ld de, 4
    add hl, de
    ld (GF_CMD_DY), hl
    ld de, GF_PAGE_Y + GF_WIPE_LINES
    or a
    sbc hl, de
    jp c, gf_wipe_horizontal_loop
    ret

; Mirror wipe: both vertical edges close towards the centre.
gf_wipe_mirror:
    ld hl, 0
    ld (GF_MIRROR_X), hl
gf_wipe_mirror_loop:
    ld hl, (GF_MIRROR_X)
    ld (GF_CMD_DX), hl
    call gf_wipe_mirror_column
    ld hl, 252
    ld de, (GF_MIRROR_X)
    or a
    sbc hl, de
    ld (GF_CMD_DX), hl
    call gf_wipe_mirror_column
    halt
    ld hl, (GF_MIRROR_X)
    ld de, 4
    add hl, de
    ld (GF_MIRROR_X), hl
    ld de, 128
    or a
    sbc hl, de
    jp c, gf_wipe_mirror_loop
    ret

gf_wipe_mirror_column:
    ld hl, GF_PAGE_Y
    ld (GF_CMD_DY), hl
    ld hl, 4
    ld (GF_CMD_NX), hl
    ld hl, GF_WIPE_LINES
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    jp gf_fill_rect

; Diagonal wipe: 16x16 blocks along successive anti-diagonals, one
; anti-diagonal per frame. Table entries are DX,DY words; #FFFE = frame
; boundary, #FFFF = end of table.
gf_wipe_diagonal:
    ld hl, gf_diagonal_wipe_table
gf_wipe_diagonal_loop:
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, d
    cp #FF
    jp nz, gf_wipe_diagonal_block
    ld a, e
    cp #FE
    jp z, gf_wipe_diagonal_wait
    ret
gf_wipe_diagonal_wait:
    halt
    jp gf_wipe_diagonal_loop
gf_wipe_diagonal_block:
    ld (GF_CMD_DX), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (GF_CMD_DY), de
    push hl
    ld hl, 16
    ld (GF_CMD_NX), hl
    ld (GF_CMD_NY), hl
    xor a
    ld (GF_CMD_CLR), a
    call gf_fill_rect
    pop hl
    jp gf_wipe_diagonal_loop

gf_diagonal_wipe_table:
    DW 0, GF_PAGE_Y + 0
    DW #FFFE
    DW 16, GF_PAGE_Y + 0
    DW 0, GF_PAGE_Y + 16
    DW #FFFE
    DW 32, GF_PAGE_Y + 0
    DW 16, GF_PAGE_Y + 16
    DW 0, GF_PAGE_Y + 32
    DW #FFFE
    DW 48, GF_PAGE_Y + 0
    DW 32, GF_PAGE_Y + 16
    DW 16, GF_PAGE_Y + 32
    DW 0, GF_PAGE_Y + 48
    DW #FFFE
    DW 64, GF_PAGE_Y + 0
    DW 48, GF_PAGE_Y + 16
    DW 32, GF_PAGE_Y + 32
    DW 16, GF_PAGE_Y + 48
    DW 0, GF_PAGE_Y + 64
    DW #FFFE
    DW 80, GF_PAGE_Y + 0
    DW 64, GF_PAGE_Y + 16
    DW 48, GF_PAGE_Y + 32
    DW 32, GF_PAGE_Y + 48
    DW 16, GF_PAGE_Y + 64
    DW 0, GF_PAGE_Y + 80
    DW #FFFE
    DW 96, GF_PAGE_Y + 0
    DW 80, GF_PAGE_Y + 16
    DW 64, GF_PAGE_Y + 32
    DW 48, GF_PAGE_Y + 48
    DW 32, GF_PAGE_Y + 64
    DW 16, GF_PAGE_Y + 80
    DW 0, GF_PAGE_Y + 96
    DW #FFFE
    DW 112, GF_PAGE_Y + 0
    DW 96, GF_PAGE_Y + 16
    DW 80, GF_PAGE_Y + 32
    DW 64, GF_PAGE_Y + 48
    DW 48, GF_PAGE_Y + 64
    DW 32, GF_PAGE_Y + 80
    DW 16, GF_PAGE_Y + 96
    DW 0, GF_PAGE_Y + 112
    DW #FFFE
    DW 128, GF_PAGE_Y + 0
    DW 112, GF_PAGE_Y + 16
    DW 96, GF_PAGE_Y + 32
    DW 80, GF_PAGE_Y + 48
    DW 64, GF_PAGE_Y + 64
    DW 48, GF_PAGE_Y + 80
    DW 32, GF_PAGE_Y + 96
    DW 16, GF_PAGE_Y + 112
    DW 0, GF_PAGE_Y + 128
    DW #FFFE
    DW 144, GF_PAGE_Y + 0
    DW 128, GF_PAGE_Y + 16
    DW 112, GF_PAGE_Y + 32
    DW 96, GF_PAGE_Y + 48
    DW 80, GF_PAGE_Y + 64
    DW 64, GF_PAGE_Y + 80
    DW 48, GF_PAGE_Y + 96
    DW 32, GF_PAGE_Y + 112
    DW 16, GF_PAGE_Y + 128
    DW 0, GF_PAGE_Y + 144
    DW #FFFE
    DW 160, GF_PAGE_Y + 0
    DW 144, GF_PAGE_Y + 16
    DW 128, GF_PAGE_Y + 32
    DW 112, GF_PAGE_Y + 48
    DW 96, GF_PAGE_Y + 64
    DW 80, GF_PAGE_Y + 80
    DW 64, GF_PAGE_Y + 96
    DW 48, GF_PAGE_Y + 112
    DW 32, GF_PAGE_Y + 128
    DW 16, GF_PAGE_Y + 144
    DW 0, GF_PAGE_Y + 160
    DW #FFFE
    DW 176, GF_PAGE_Y + 0
    DW 160, GF_PAGE_Y + 16
    DW 144, GF_PAGE_Y + 32
    DW 128, GF_PAGE_Y + 48
    DW 112, GF_PAGE_Y + 64
    DW 96, GF_PAGE_Y + 80
    DW 80, GF_PAGE_Y + 96
    DW 64, GF_PAGE_Y + 112
    DW 48, GF_PAGE_Y + 128
    DW 32, GF_PAGE_Y + 144
    DW 16, GF_PAGE_Y + 160
    DW 0, GF_PAGE_Y + 176
    DW #FFFE
    DW 192, GF_PAGE_Y + 0
    DW 176, GF_PAGE_Y + 16
    DW 160, GF_PAGE_Y + 32
    DW 144, GF_PAGE_Y + 48
    DW 128, GF_PAGE_Y + 64
    DW 112, GF_PAGE_Y + 80
    DW 96, GF_PAGE_Y + 96
    DW 80, GF_PAGE_Y + 112
    DW 64, GF_PAGE_Y + 128
    DW 48, GF_PAGE_Y + 144
    DW 32, GF_PAGE_Y + 160
    DW 16, GF_PAGE_Y + 176
    DW 0, GF_PAGE_Y + 192
    DW #FFFE
    DW 208, GF_PAGE_Y + 0
    DW 192, GF_PAGE_Y + 16
    DW 176, GF_PAGE_Y + 32
    DW 160, GF_PAGE_Y + 48
    DW 144, GF_PAGE_Y + 64
    DW 128, GF_PAGE_Y + 80
    DW 112, GF_PAGE_Y + 96
    DW 96, GF_PAGE_Y + 112
    DW 80, GF_PAGE_Y + 128
    DW 64, GF_PAGE_Y + 144
    DW 48, GF_PAGE_Y + 160
    DW 32, GF_PAGE_Y + 176
    DW 16, GF_PAGE_Y + 192
    DW 0, GF_PAGE_Y + 208
    DW #FFFE
    DW 224, GF_PAGE_Y + 0
    DW 208, GF_PAGE_Y + 16
    DW 192, GF_PAGE_Y + 32
    DW 176, GF_PAGE_Y + 48
    DW 160, GF_PAGE_Y + 64
    DW 144, GF_PAGE_Y + 80
    DW 128, GF_PAGE_Y + 96
    DW 112, GF_PAGE_Y + 112
    DW 96, GF_PAGE_Y + 128
    DW 80, GF_PAGE_Y + 144
    DW 64, GF_PAGE_Y + 160
    DW 48, GF_PAGE_Y + 176
    DW 32, GF_PAGE_Y + 192
    DW 16, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 0
    DW 224, GF_PAGE_Y + 16
    DW 208, GF_PAGE_Y + 32
    DW 192, GF_PAGE_Y + 48
    DW 176, GF_PAGE_Y + 64
    DW 160, GF_PAGE_Y + 80
    DW 144, GF_PAGE_Y + 96
    DW 128, GF_PAGE_Y + 112
    DW 112, GF_PAGE_Y + 128
    DW 96, GF_PAGE_Y + 144
    DW 80, GF_PAGE_Y + 160
    DW 64, GF_PAGE_Y + 176
    DW 48, GF_PAGE_Y + 192
    DW 32, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 16
    DW 224, GF_PAGE_Y + 32
    DW 208, GF_PAGE_Y + 48
    DW 192, GF_PAGE_Y + 64
    DW 176, GF_PAGE_Y + 80
    DW 160, GF_PAGE_Y + 96
    DW 144, GF_PAGE_Y + 112
    DW 128, GF_PAGE_Y + 128
    DW 112, GF_PAGE_Y + 144
    DW 96, GF_PAGE_Y + 160
    DW 80, GF_PAGE_Y + 176
    DW 64, GF_PAGE_Y + 192
    DW 48, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 32
    DW 224, GF_PAGE_Y + 48
    DW 208, GF_PAGE_Y + 64
    DW 192, GF_PAGE_Y + 80
    DW 176, GF_PAGE_Y + 96
    DW 160, GF_PAGE_Y + 112
    DW 144, GF_PAGE_Y + 128
    DW 128, GF_PAGE_Y + 144
    DW 112, GF_PAGE_Y + 160
    DW 96, GF_PAGE_Y + 176
    DW 80, GF_PAGE_Y + 192
    DW 64, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 48
    DW 224, GF_PAGE_Y + 64
    DW 208, GF_PAGE_Y + 80
    DW 192, GF_PAGE_Y + 96
    DW 176, GF_PAGE_Y + 112
    DW 160, GF_PAGE_Y + 128
    DW 144, GF_PAGE_Y + 144
    DW 128, GF_PAGE_Y + 160
    DW 112, GF_PAGE_Y + 176
    DW 96, GF_PAGE_Y + 192
    DW 80, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 64
    DW 224, GF_PAGE_Y + 80
    DW 208, GF_PAGE_Y + 96
    DW 192, GF_PAGE_Y + 112
    DW 176, GF_PAGE_Y + 128
    DW 160, GF_PAGE_Y + 144
    DW 144, GF_PAGE_Y + 160
    DW 128, GF_PAGE_Y + 176
    DW 112, GF_PAGE_Y + 192
    DW 96, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 80
    DW 224, GF_PAGE_Y + 96
    DW 208, GF_PAGE_Y + 112
    DW 192, GF_PAGE_Y + 128
    DW 176, GF_PAGE_Y + 144
    DW 160, GF_PAGE_Y + 160
    DW 144, GF_PAGE_Y + 176
    DW 128, GF_PAGE_Y + 192
    DW 112, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 96
    DW 224, GF_PAGE_Y + 112
    DW 208, GF_PAGE_Y + 128
    DW 192, GF_PAGE_Y + 144
    DW 176, GF_PAGE_Y + 160
    DW 160, GF_PAGE_Y + 176
    DW 144, GF_PAGE_Y + 192
    DW 128, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 112
    DW 224, GF_PAGE_Y + 128
    DW 208, GF_PAGE_Y + 144
    DW 192, GF_PAGE_Y + 160
    DW 176, GF_PAGE_Y + 176
    DW 160, GF_PAGE_Y + 192
    DW 144, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 128
    DW 224, GF_PAGE_Y + 144
    DW 208, GF_PAGE_Y + 160
    DW 192, GF_PAGE_Y + 176
    DW 176, GF_PAGE_Y + 192
    DW 160, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 144
    DW 224, GF_PAGE_Y + 160
    DW 208, GF_PAGE_Y + 176
    DW 192, GF_PAGE_Y + 192
    DW 176, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 160
    DW 224, GF_PAGE_Y + 176
    DW 208, GF_PAGE_Y + 192
    DW 192, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 176
    DW 224, GF_PAGE_Y + 192
    DW 208, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 192
    DW 224, GF_PAGE_Y + 208
    DW #FFFE
    DW 240, GF_PAGE_Y + 208
    DW #FFFE
    DW #FFFF

; ------------------------------------------------------------------
; gf_font_data: 59 glyphs (ASCII 32..90), 8 rows each,
; 5 pixels left-aligned on bits 7..3 so bit 2 becomes the cell gap.
; ------------------------------------------------------------------
gf_font_data:
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


; ==================================================================
; Data
; ==================================================================
gf_str_0:   ; "  START GAME  "
    DB #20,#20,#53,#54,#41,#52,#54,#20,#47,#41,#4D,#45,#20,#20,#00
gf_str_1:   ; "    STORY     "
    DB #20,#20,#20,#20,#53,#54,#4F,#52,#59,#20,#20,#20,#20,#20,#00
gf_str_2:   ; "   CREDITS    "
    DB #20,#20,#20,#43,#52,#45,#44,#49,#54,#53,#20,#20,#20,#20,#00
gf_str_3:   ; "     EXIT     "
    DB #20,#20,#20,#20,#20,#45,#58,#49,#54,#20,#20,#20,#20,#20,#00
gf_str_4:   ; "MIDEAS GAME FLOW"
    DB #4D,#49,#44,#45,#41,#53,#20,#47,#41,#4D,#45,#20,#46,#4C,#4F,#57
    DB #00
gf_str_5:   ; "THE COLONY REACTOR IS OFFLINE."
    DB #54,#48,#45,#20,#43,#4F,#4C,#4F,#4E,#59,#20,#52,#45,#41,#43,#54
    DB #4F,#52,#20,#49,#53,#20,#4F,#46,#46,#4C,#49,#4E,#45,#2E,#00
gf_str_6:   ; "REACH THE CORE BEFORE THE"
    DB #52,#45,#41,#43,#48,#20,#54,#48,#45,#20,#43,#4F,#52,#45,#20,#42
    DB #45,#46,#4F,#52,#45,#20,#54,#48,#45,#00
gf_str_7:   ; "SHIELD COLLAPSES."
    DB #53,#48,#49,#45,#4C,#44,#20,#43,#4F,#4C,#4C,#41,#50,#53,#45,#53
    DB #2E,#00
gf_str_8:   ; "GOOD LUCK PILOT."
    DB #47,#4F,#4F,#44,#20,#4C,#55,#43,#4B,#20,#50,#49,#4C,#4F,#54,#2E
    DB #00
gf_str_9:   ; "PRESS ANY KEY"
    DB #50,#52,#45,#53,#53,#20,#41,#4E,#59,#20,#4B,#45,#59,#00
gf_str_10:   ; "LEVEL 1 BRIEFING"
    DB #4C,#45,#56,#45,#4C,#20,#31,#20,#42,#52,#49,#45,#46,#49,#4E,#47
    DB #00
gf_str_11:   ; "YEAR 2087. THE OUTER COLONIES"
    DB #59,#45,#41,#52,#20,#32,#30,#38,#37,#2E,#20,#54,#48,#45,#20,#4F
    DB #55,#54,#45,#52,#20,#43,#4F,#4C,#4F,#4E,#49,#45,#53,#00
gf_str_12:   ; "LOST CONTACT WITH EARTH."
    DB #4C,#4F,#53,#54,#20,#43,#4F,#4E,#54,#41,#43,#54,#20,#57,#49,#54
    DB #48,#20,#45,#41,#52,#54,#48,#2E,#00
gf_str_13:   ; "A SINGLE SCOUT SHIP WAS SENT"
    DB #41,#20,#53,#49,#4E,#47,#4C,#45,#20,#53,#43,#4F,#55,#54,#20,#53
    DB #48,#49,#50,#20,#57,#41,#53,#20,#53,#45,#4E,#54,#00
gf_str_14:   ; "THROUGH THE GATE."
    DB #54,#48,#52,#4F,#55,#47,#48,#20,#54,#48,#45,#20,#47,#41,#54,#45
    DB #2E,#00
gf_str_15:   ; "IT NEVER CAME BACK."
    DB #49,#54,#20,#4E,#45,#56,#45,#52,#20,#43,#41,#4D,#45,#20,#42,#41
    DB #43,#4B,#2E,#00
gf_str_16:   ; "YOU ARE THE SECOND ATTEMPT."
    DB #59,#4F,#55,#20,#41,#52,#45,#20,#54,#48,#45,#20,#53,#45,#43,#4F
    DB #4E,#44,#20,#41,#54,#54,#45,#4D,#50,#54,#2E,#00
gf_str_17:   ; "STORY"
    DB #53,#54,#4F,#52,#59,#00
gf_str_18:   ; "MIDEAS MSX GAME EDITOR"
    DB #4D,#49,#44,#45,#41,#53,#20,#4D,#53,#58,#20,#47,#41,#4D,#45,#20
    DB #45,#44,#49,#54,#4F,#52,#00
gf_str_19:   ; "GAME FLOW ENGINE"
    DB #47,#41,#4D,#45,#20,#46,#4C,#4F,#57,#20,#45,#4E,#47,#49,#4E,#45
    DB #00
gf_str_20:   ; "SCREEN 5 BITMAP BACKEND"
    DB #53,#43,#52,#45,#45,#4E,#20,#35,#20,#42,#49,#54,#4D,#41,#50,#20
    DB #42,#41,#43,#4B,#45,#4E,#44,#00
gf_str_21:   ; "VDP COMMAND ENGINE TEXT"
    DB #56,#44,#50,#20,#43,#4F,#4D,#4D,#41,#4E,#44,#20,#45,#4E,#47,#49
    DB #4E,#45,#20,#54,#45,#58,#54,#00
gf_str_22:   ; "THANKS FOR PLAYING"
    DB #54,#48,#41,#4E,#4B,#53,#20,#46,#4F,#52,#20,#50,#4C,#41,#59,#49
    DB #4E,#47,#00
gf_str_23:   ; "CREDITS"
    DB #43,#52,#45,#44,#49,#54,#53,#00

gf_palette_0_data:   ; (R<<4)|B, G
    DB #00,#00,#02,#00,#13,#00,#24,#00,#35,#01,#46,#02,#66,#03,#72,#05
    DB #77,#07,#57,#06,#27,#05,#05,#04,#03,#02,#71,#02,#34,#03,#52,#07

SCREEN5_FLOW_0_BITMAP_CHUNK_0_SIZE EQU 4096

SCREEN5_FLOW_0_BITMAP_CHUNK_0:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#81,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#81,#11,#11,#11,#91,#11
    DB #11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#81,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #81,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#81,#11,#11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#81,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #81,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11
    DB #81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#AA,#99
    DB #99,#99,#99,#99,#99,#99,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#1A,#AA,#AA,#A9
    DB #99,#99,#99,#99,#99,#99,#99,#99,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#1A,#AA,#AA,#AA,#AA
    DB #99,#99,#99,#99,#99,#99,#99,#99,#99,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#AA,#AA,#AA,#AA,#AA,#AA
    DB #A9,#99,#99,#99,#99,#99,#99,#99,#99,#99,#91,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#91
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#1A,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#11,#11,#11,#11,#81
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#1A,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#91,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#1A,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#1B,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#91,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11,#81,#11
    DB #11,#11,#81,#11,#11,#1B,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#1B,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#91
    DB #11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99,#91
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
SCREEN5_FLOW_0_BITMAP_CHUNK_1_SIZE EQU 4096

SCREEN5_FLOW_0_BITMAP_CHUNK_1:
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#1B,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #81,#11,#11,#11,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99,#99,#99
    DB #91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99,#99
    DB #91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11,#81,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#1B,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99,#99
    DB #99,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99,#99
    DB #99,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#91,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99,#99
    DB #99,#91,#81,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99,#99
    DB #99,#91,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#81
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #11,#11,#1B,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99,#99
    DB #99,#99,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11,#11
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#2B,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99,#99
    DB #99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#92,#22,#22,#22
    DB #22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99,#99
    DB #99,#99,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99,#99
    DB #99,#99,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#82,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99,#99
    DB #99,#99,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#92,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#92
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#9C,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#99
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#A9
    DB #99,#99,#99,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #99,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #A9,#99,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#99,#99,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#A9,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#92,#22,#22,#22
    DB #82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#99,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#A9,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#AA,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82
    DB #22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#A2,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82
SCREEN5_FLOW_0_BITMAP_CHUNK_2_SIZE EQU 4096

SCREEN5_FLOW_0_BITMAP_CHUNK_2:
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #82,#22,#22,#22,#92,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#92,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA,#AA
    DB #AA,#AA,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA,#AA
    DB #AA,#A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22
    DB #22,#22,#22,#22,#22,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#92,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA,#AA
    DB #AA,#A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA,#AA
    DB #AA,#A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#92,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#82,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#2C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA,#AA
    DB #AA,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA,#AA
    DB #A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#82,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #22,#22,#22,#22,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#AA,#AA
    DB #A2,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22,#22
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BA,#AA
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#A3
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#93,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#B3,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#33,#33
    DB #33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#BB,#BB,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#93,#33,#33,#33,#33,#33,#33,#33,#83
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#BB,#BB,#B3,#33,#33,#83
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#BB,#BB,#BB,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#BB,#BB,#BB,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#CC,#CC,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#CC,#CB,#BB,#BB,#B3,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#93,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33
    DB #33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#3C,#CC,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#BB,#83,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#93,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#3C,#CC,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#CC,#CC,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#CC,#CC
    DB #CC,#CC,#CC,#CC,#CC,#CC,#C3,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#C3,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#93,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#93,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#93,#33,#33
    DB #33,#83,#33,#33,#33,#33,#33,#33,#33,#93,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#93,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#83
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
SCREEN5_FLOW_0_BITMAP_CHUNK_3_SIZE EQU 4096

SCREEN5_FLOW_0_BITMAP_CHUNK_3:
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#83,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#94,#44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#94,#44,#44
    DB #44,#44,#44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44,#44
    DB #44,#44,#94,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#84,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#94,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#84,#44,#44,#44,#44,#44,#44,#44,#94,#44,#44,#44,#84,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#94,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#94,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84,#44
    DB #44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#84,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#84
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44,#44
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#66,#66,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#66,#66,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#56,#EE,#EE,#66,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#66,#EE,#EE,#65,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#6E,#EE,#EE,#EE,#65,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#56,#EE,#EE,#EE,#E6,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#56,#EE,#EE,#EE,#EE,#E6,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#6E,#EE,#EE,#EE,#EE,#65,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#6E,#EE,#EE,#EE,#EE,#EE,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#EE,#EE,#EE,#EE,#EE,#E6,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#66,#EE,#EE,#00,#00,#EE,#EE,#65,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#56,#EE,#EE,#00,#00,#EE,#EE,#66,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
SCREEN5_FLOW_0_BITMAP_CHUNK_4_SIZE EQU 4096

SCREEN5_FLOW_0_BITMAP_CHUNK_4:
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#56,#EE,#EE,#E0,#00,#00,#00,#EE,#E6,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#6E,#EE,#00,#00,#00,#0E,#EE,#EE,#65
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#56,#56,#55,#55
    DB #55,#55,#55,#55,#55,#55,#6E,#EE,#EE,#00,#00,#00,#00,#0E,#EE,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#EE,#E0,#00,#00,#00,#00,#EE,#EE,#E6
    DB #55,#55,#55,#55,#55,#55,#55,#55,#65,#65,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#6E,#6E,#66,#55
    DB #55,#55,#55,#55,#55,#56,#EE,#EE,#E0,#00,#00,#00,#00,#00,#EE,#66
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#66,#EE,#00,#00,#00,#00,#00,#0E,#EE,#EE
    DB #65,#55,#55,#55,#55,#55,#55,#66,#E6,#E6,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#56,#66,#EE,#EE,#EE,#56
    DB #55,#55,#55,#55,#55,#6E,#EE,#EE,#00,#00,#00,#00,#00,#00,#EE,#EE
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#EE,#EE,#00,#00,#00,#00,#00,#00,#EE,#EE
    DB #E6,#55,#55,#55,#55,#55,#65,#EE,#EE,#EE,#66,#65,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#6E,#EE,#EE,#EE,#EE,#6E
    DB #66,#55,#55,#55,#56,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#0E,#EE
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#EE
    DB #EE,#65,#55,#55,#55,#66,#E6,#EE,#EE,#EE,#EE,#E6,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#56,#EE,#EE,#EE,#EE,#EE,#EE
    DB #EE,#66,#55,#66,#6E,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#EE
    DB #65,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#56,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#0E
    DB #EE,#E6,#66,#55,#66,#EE,#EE,#EE,#EE,#EE,#EE,#EE,#65,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#6E,#EE,#EE,#E0,#E0,#EE,#EE
    DB #EE,#EE,#66,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE
    DB #E6,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#6E,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#EE,#EE,#66,#EE,#EE,#EE,#EE,#0E,#0E,#EE,#EE,#E6,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#EE,#EE,#EE,#00,#00,#00,#EE
    DB #EE,#EE,#EE,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#55,#55,#55,#55,#55,#55,#55,#55,#56,#55,#55,#55,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#65,#55,#55,#55
    DB #55,#55,#55,#55,#55,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #0E,#EE,#EE,#EE,#EE,#EE,#EE,#00,#00,#00,#EE,#EE,#EE,#55,#55,#55
    DB #55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55,#55
    DB #60,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#06,#EE,#E0,#00,#00,#00,#00,#E0
    DB #EE,#EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#66,#00,#00,#00,#00,#00,#00,#06,#6E,#66,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#66,#E6,#60,#00,#00
    DB #00,#00,#00,#00,#66,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#EE,#EE,#EE,#EE,#EE,#0E,#00,#00,#00,#00,#0E,#EE,#60,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #E6,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#0E,#EE,#00,#00,#00,#00,#00,#00
    DB #00,#EE,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#EE,#00,#00,#00,#00,#00,#66,#6E,#EE,#EE,#66,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#66,#EE,#EE,#E6,#66,#00
    DB #00,#00,#00,#00,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#0E,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#EE,#E0,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#6E,#E0,#00,#00,#00,#00,#00,#00
    DB #00,#00,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #0E,#EE,#66,#00,#00,#00,#66,#EE,#EE,#EE,#EE,#EE,#60,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#06,#EE,#EE,#EE,#EE,#EE,#66
    DB #00,#00,#00,#66,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#E6,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#60,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#06,#EE,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#EE,#EE,#66,#00,#06,#EE,#EE,#EE,#EE,#EE,#EE,#E6,#60,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#6E,#EE,#EE,#EE,#EE,#EE,#EE
    DB #60,#60,#66,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE,#60,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#E6,#00,#00,#00,#00,#00,#00,#00,#00,#06,#66,#66,#60,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#0E,#EE,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#EE,#EE,#EE,#66,#6E,#EE,#EE,#EE,#E0,#EE,#EE,#EE,#E0,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#06,#EE,#EE,#EE,#0E,#EE,#EE,#EE
    DB #E6,#E6,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE,#E0,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#06,#66,#66,#60,#00,#00,#00,#00
    DB #0E,#EE,#00,#00,#00,#00,#00,#00,#00,#06,#6E,#EE,#EE,#E6,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#6E,#E0,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#EE,#EE,#EE,#EE,#EE,#EE,#E0,#00,#00,#EE,#EE,#E6,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#6E,#EE,#EE,#00,#00,#0E,#EE,#EE
    DB #EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#E6,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#6E,#EE,#EE,#E6,#60,#00,#00,#00
    DB #00,#EE,#60,#00,#00,#00,#00,#00,#00,#6E,#EE,#EE,#EE,#EE,#60,#00
    DB #00,#00,#00,#00,#00,#00,#06,#EE,#E0,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#EE,#EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#EE,#EE,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#EE,#EE,#00,#00,#00,#00,#00,#EE
    DB #EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#EE,#60
    DB #00,#00,#00,#00,#00,#00,#00,#06,#EE,#EE,#EE,#EE,#E6,#00,#00,#00
    DB #00,#EE,#E6,#00,#00,#00,#00,#06,#06,#EE,#EE,#EE,#EE,#EE,#E6,#00
    DB #00,#00,#00,#00,#00,#00,#0E,#EE,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#0E,#EE,#60,#00
    DB #00,#00,#00,#00,#00,#00,#00,#06,#EE,#E0,#00,#00,#00,#00,#00,#00
    DB #EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE,#E0
    DB #00,#00,#00,#00,#00,#00,#00,#6E,#EE,#EE,#EE,#EE,#EE,#60,#60,#00
    DB #00,#0E,#EE,#60,#00,#00,#00,#0E,#6E,#EE,#EE,#EE,#EE,#EE,#EE,#60
    DB #00,#00,#00,#00,#00,#00,#6E,#E0,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#0E,#E6,#00
    DB #00,#00,#00,#00,#00,#00,#00,#6E,#EE,#00,#00,#00,#00,#00,#00,#00
    DB #0E,#0E,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#E6
    DB #00,#00,#00,#00,#00,#00,#06,#EE,#EE,#EE,#EE,#EE,#EE,#E6,#E6,#00
    DB #00,#00,#EE,#E6,#60,#00,#06,#6E,#EE,#EE,#E0,#00,#00,#0E,#EE,#E6
    DB #60,#00,#00,#00,#00,#06,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#EE,#60
    DB #00,#00,#00,#00,#00,#00,#06,#EE,#E0,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#EE
    DB #60,#00,#00,#00,#00,#06,#6E,#EE,#E0,#00,#00,#0E,#EE,#EE,#EE,#60
    DB #00,#00,#EE,#EE,#E6,#66,#6E,#EE,#EE,#E0,#00,#00,#00,#00,#EE,#EE
    DB #E6,#00,#00,#00,#00,#0E,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE,#E6
    DB #00,#00,#00,#00,#00,#00,#6E,#EE,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE
    DB #E0,#00,#00,#00,#00,#6E,#EE,#EE,#00,#00,#00,#00,#0E,#EE,#EE,#E6
    DB #00,#00,#0E,#EE,#EE,#EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#0E,#EE
    DB #EE,#66,#00,#00,#06,#6E,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE,#EE
    DB #60,#00,#00,#00,#00,#06,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E
    DB #E6,#60,#00,#00,#60,#EE,#EE,#E0,#00,#00,#00,#00,#00,#EE,#EE,#EE
    DB #00,#00,#00,#EE,#EE,#EE,#EE,#E0,#E0,#00,#00,#00,#00,#00,#00,#EE
    DB #EE,#EE,#60,#66,#6E,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#EE
    DB #E6,#00,#00,#00,#00,#6E,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E
    DB #EE,#E6,#66,#06,#E6,#EE,#EE,#00,#00,#00,#00,#00,#00,#0E,#0E,#EE
    DB #00,#00,#00,#0E,#EE,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#0E
    DB #EE,#EE,#E6,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#EE
    DB #EE,#60,#00,#00,#06,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#EE,#EE,#6E,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#EE
    DB #00,#00,#00,#00,#0E,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #0E,#EE,#EE,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E
    DB #EE,#E6,#66,#66,#6E,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #0E,#EE,#EE,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0E
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#EE,#EE,#EE,#EE,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #EE,#EE,#EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #0E,#EE,#EE,#EE,#EE,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#EE,#EE,#E0,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#88,#88
    DB #88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#EE,#E0,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#0E,#EE,#EE,#0E,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#0E,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#88,#88
    DB #88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#EE,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#E0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#88,#88
    DB #88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#E0,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#88,#88
    DB #88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#88,#88,#00,#00,#88,#88,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#88,#88,#00,#00,#88,#88,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#88,#88,#00,#00,#88,#88,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#88,#88,#00,#00,#88,#88,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
SCREEN5_FLOW_0_BITMAP_CHUNK_5_SIZE EQU 4096

SCREEN5_FLOW_0_BITMAP_CHUNK_5:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88
    DB #00,#00,#00,#00,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#88,#88
    DB #88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#88,#88
    DB #88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#88,#88,#88,#88,#88,#88
    DB #88,#88,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#A8,#00,#A0,#0A,#AA,#A0,#A0,#88,#A8
    DB #0A,#AA,#88,#88,#88,#88,#8A,#AA,#A8,#8A,#AA,#A8,#AA,#AA,#88,#AA
    DB #AA,#A8,#AA,#AA,#A8,#A8,#00,#A0,#00,#00,#88,#AA,#AA,#A8,#88,#88
    DB #88,#88,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#88,#AA,#0A,#A0,#A0,#00,#00,#A0,#88,#A8
    DB #A0,#00,#A8,#88,#88,#88,#A8,#88,#88,#A8,#88,#88,#A0,#00,#A8,#A8
    DB #88,#88,#A8,#88,#88,#AA,#00,#A0,#00,#00,#88,#A8,#88,#88,#88,#88
    DB #88,#88,#88,#88,#00,#00,#88,#88,#00,#00,#00,#00,#00,#00,#88,#88
    DB #00,#00,#88,#88,#88,#88,#88,#88,#88,#88,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#A0,#A0,#A0,#A0,#00,#00,#0A,#0A,#00
    DB #00,#00,#A0,#00,#00,#00,#A0,#00,#00,#A0,#00,#00,#A0,#00,#A0,#A0
    DB #00,#00,#A0,#00,#00,#A0,#A0,#A0,#00,#00,#00,#A0,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#A0,#A0,#A0,#0A,#AA,#00,#00,#A0,#00
    DB #00,#0A,#00,#00,#00,#00,#0A,#AA,#00,#A0,#00,#00,#AA,#AA,#00,#AA
    DB #AA,#00,#AA,#AA,#00,#A0,#0A,#A0,#00,#00,#00,#AA,#AA,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#A0,#00,#A0,#00,#00,#A0,#0A,#0A,#00
    DB #00,#A0,#00,#00,#00,#00,#00,#00,#A0,#A0,#00,#00,#A0,#A0,#00,#A0
    DB #00,#00,#A0,#00,#00,#A0,#00,#A0,#00,#00,#00,#00,#00,#A0,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#A0,#00,#A0,#00,#00,#A0,#A0,#00,#A0
    DB #0A,#00,#00,#00,#00,#00,#00,#00,#A0,#A0,#00,#00,#A0,#0A,#00,#A0
    DB #00,#00,#A0,#00,#00,#A0,#00,#A0,#00,#00,#00,#00,#00,#A0,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#A0,#00,#A0,#AA,#AA,#00,#A0,#00,#A0
    DB #AA,#AA,#A0,#00,#00,#00,#AA,#AA,#00,#0A,#AA,#A0,#A0,#00,#A0,#AA
    DB #AA,#A0,#AA,#AA,#A0,#A0,#00,#A0,#00,#00,#00,#AA,#AA,#00,#00,#00
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
SCREEN5_FLOW_0_BITMAP_CHUNK_6_SIZE EQU 2560

SCREEN5_FLOW_0_BITMAP_CHUNK_6:
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

    ds #C000 - $, #FF
    end
