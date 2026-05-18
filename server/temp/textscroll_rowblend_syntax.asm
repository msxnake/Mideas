CHRTBL2 EQU #0000
CLRTBL2 EQU #2000
NAMETBL EQU #1800
page0_transfer_buffer EQU #E700
gameflow_textscroll_line_table_ptr EQU #C100
gameflow_textscroll_line_ptr EQU #C102
gameflow_textscroll_line_count EQU #C104
gameflow_textscroll_speed EQU #C105
gameflow_textscroll_bg_color EQU #C106
gameflow_textscroll_stripe_color EQU #C107
gameflow_textscroll_step EQU #C108
gameflow_textscroll_fine EQU #C109
gameflow_textscroll_row EQU #C10A
gameflow_textscroll_line_col EQU #C10B
gameflow_textscroll_base_line EQU #C10C
gameflow_textscroll_col EQU #C10D
gameflow_textscroll_scan EQU #C10E
gameflow_textscroll_font_scan EQU #C10F
    org #8000
DISSCR: ret
ENASCR: ret
set_screen_colors: ret
init_char0_color: ret
reload_font_system: ret
FAST_RDVRM:
    xor a
    ret
FAST_FILLVRM: ret
FAST_WRTVRM: ret
FAST_LDIRVM: ret
TEXTSCROLL_FONT_FIRST EQU 32
TEXTSCROLL_FONT_COUNT EQU 64
TEXTSCROLL_FONT_BYTES EQU #0200
TEXTSCROLL_FONT_SRC EQU page0_transfer_buffer
TEXTSCROLL_ROW_BUF EQU page0_transfer_buffer + TEXTSCROLL_FONT_BYTES
TEXTSCROLL_ROW_BYTES EQU #0100

; ------------------------------------------------------------------
; show_textscroll_screen
; Data format:
;   db background_color
;   db stripe_color
;   db speed_frames_per_pixel
;   db line_count
;   repeated line_count times: db centered_col, dw string_ptr
; ------------------------------------------------------------------
show_textscroll_screen:
    ex de, hl
    ld a, (hl)
    ld (gameflow_textscroll_bg_color), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll_stripe_color), a
    inc hl
    ld a, (hl)
    or a
    jr nz, .ts2_speed_ok
    inc a
.ts2_speed_ok:
    ld (gameflow_textscroll_speed), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll_line_count), a
    inc hl
    ld (gameflow_textscroll_line_table_ptr), hl

    call DISSCR
    ld a, (gameflow_textscroll_bg_color)
    ld b, a
    call set_screen_colors
    ld a, (gameflow_textscroll_bg_color)
    call init_char0_color
    call reload_font_system
    call textscroll_capture_font_patterns
    call textscroll_prepare_pattern_masks
    call textscroll_clear_name_table_spaces
    call ENASCR

    xor a
    ld (gameflow_textscroll_step), a
.scroll_loop:
    ld a, (gameflow_textscroll_line_count)
    add a, 24
    ld b, a
    ld a, (gameflow_textscroll_step)
    cp b
    jr nc, .scroll_done

    call textscroll_render_name_frame
    xor a
    ld (gameflow_textscroll_fine), a
.fine_loop:
    call textscroll_render_name_frame
    call textscroll_wait_speed
    ld hl, gameflow_textscroll_fine
    inc (hl)
    ld a, (hl)
    cp 8
    jr c, .fine_loop

    ld hl, gameflow_textscroll_step
    inc (hl)
    jr .scroll_loop

.scroll_done:
    call reload_font_system
    ret

; ------------------------------------------------------------------
; Capture current font glyphs 32..95 from the first pattern bank.
; DI/EI protects the VDP address latch while the interrupt task manager is
; active, otherwise the mask may be built from corrupted scanlines.
; ------------------------------------------------------------------
textscroll_capture_font_patterns:
    di
    ; FAST_RDVRM returns the byte after the programmed address on this path,
    ; so start one byte earlier to capture exact glyph rows.
    ld hl, CHRTBL2 + (TEXTSCROLL_FONT_FIRST * 8) - 1
    ld de, TEXTSCROLL_FONT_SRC
    ld bc, TEXTSCROLL_FONT_BYTES
.capture_loop:
    call FAST_RDVRM
    ld (de), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jr nz, .capture_loop
    ei
    ret

textscroll_prepare_pattern_masks:
    ld a, (gameflow_textscroll_stripe_color)
    and #0F
    or #F0
    ld hl, CLRTBL2
    ld bc, #1800
    call FAST_FILLVRM
    xor a
    ld hl, CHRTBL2
    ld bc, #1800
    jp FAST_FILLVRM

textscroll_clear_name_table_spaces:
    ld hl, NAMETBL
    ld d, 3
.bank_loop:
    xor a
    ld b, 0
.name_loop:
    call FAST_WRTVRM
    inc hl
    inc a
    djnz .name_loop
    dec d
    jr nz, .bank_loop
    ret

; ------------------------------------------------------------------
; Compose the full pattern table from text rows and the captured font.
; Each tile row blends the active text line with the next one when the
; fine offset crosses an 8-pixel boundary, so line changes do not blank.
; ------------------------------------------------------------------
textscroll_render_name_frame:
    xor a
    ld (gameflow_textscroll_row), a
.row_loop:
    ld a, (gameflow_textscroll_row)
    cp 24
    ret nc

    ld c, a
    ld a, (gameflow_textscroll_step)
    add a, c
    sub 23
    ld (gameflow_textscroll_base_line), a
    call textscroll_build_row_buffer
    call textscroll_upload_row_buffer

    ld hl, gameflow_textscroll_row
    inc (hl)
    jr .row_loop

; Input: A = line index
textscroll_load_line_entry:
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, de
    ld de, (gameflow_textscroll_line_table_ptr)
    add hl, de
    ld a, (hl)
    ld (gameflow_textscroll_line_col), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (gameflow_textscroll_line_ptr), de
    ret

textscroll_build_row_buffer:
    ld hl, TEXTSCROLL_ROW_BUF
    xor a
    ld (gameflow_textscroll_col), a
.col_loop:
    ld a, (gameflow_textscroll_col)
    cp 32
    ret nc
    xor a
    ld (gameflow_textscroll_scan), a
.scan_loop:
    ld a, (gameflow_textscroll_fine)
    ld b, a
    ld a, (gameflow_textscroll_scan)
    add a, b
    cp 8
    jr c, .same_line
    sub 8
    ld (gameflow_textscroll_font_scan), a
    ld a, (gameflow_textscroll_base_line)
    inc a
    jr .have_line
.same_line:
    ld (gameflow_textscroll_font_scan), a
    ld a, (gameflow_textscroll_base_line)
.have_line:
    ld c, a
    ld a, (gameflow_textscroll_col)
    ld b, a
    ld a, c
    push hl
    call textscroll_get_pattern_byte
    pop hl
    ld (hl), a
    inc hl
    ld a, (gameflow_textscroll_scan)
    inc a
    ld (gameflow_textscroll_scan), a
    cp 8
    jr c, .scan_loop
    ld hl, gameflow_textscroll_col
    inc (hl)
    jr .col_loop

; Input: A = signed line index, B = screen column.
; Output: A = pattern byte, or 0 when outside the text range.
textscroll_get_pattern_byte:
    bit 7, a
    jr nz, .blank
    ld e, a
    ld hl, gameflow_textscroll_line_count
    cp (hl)
    jr nc, .blank
    push bc
    push hl
    ld a, e
    call textscroll_load_line_entry
    pop hl
    pop bc
    ld a, b
    ld hl, gameflow_textscroll_line_col
    cp (hl)
    jr c, .blank
    sub (hl)
    ld e, a
    ld hl, (gameflow_textscroll_line_ptr)
.char_loop:
    ld a, (hl)
    or a
    jr z, .blank
    ld a, e
    or a
    jr z, .have_char
    inc hl
    dec e
    jr .char_loop
.have_char:
    ld a, (hl)
    cp TEXTSCROLL_FONT_FIRST
    jr c, .blank
    cp TEXTSCROLL_FONT_FIRST + TEXTSCROLL_FONT_COUNT
    jr nc, .blank
    sub TEXTSCROLL_FONT_FIRST
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (gameflow_textscroll_font_scan)
    ld e, a
    ld d, 0
    add hl, de
    ld de, TEXTSCROLL_FONT_SRC
    add hl, de
    ld a, (hl)
    ret
.blank:
    xor a
    ret

textscroll_upload_row_buffer:
    ld a, (gameflow_textscroll_row)
    cp 8
    jr c, .bank0
    cp 16
    jr c, .bank1
    sub 16
    ld h, a
    ld l, 0
    ld de, CHRTBL2 + #1000
    jr .have_bank
.bank1:
    sub 8
    ld h, a
    ld l, 0
    ld de, CHRTBL2 + #0800
    jr .have_bank
.bank0:
    ld h, a
    ld l, 0
    ld de, CHRTBL2
.have_bank:
    add hl, de
    push hl
    ld hl, TEXTSCROLL_ROW_BUF
    pop de
    ld bc, TEXTSCROLL_ROW_BYTES
    jp FAST_LDIRVM

textscroll_wait_speed:
    ld a, (gameflow_textscroll_speed)
    or a
    ret z
    ld b, a
.wait_loop:
    halt
    push bc
    pop bc
    djnz .wait_loop
    ret




