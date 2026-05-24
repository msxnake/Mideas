; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation backend
; Project: bionic_invaders_screen5_megarom
; Presentation: Bionic Invaders Title
; Screen mode: SCREEN 5 (Graphics III)
; Backend: msx2-screen5-presentation
; ROM mode requested: megarom
; ROM Mode: megarom
; Mapper Target: konami
; MSX2 SCREEN 5 MegaROM Path: Konami 8K fixed-bank0 compatibility
; SCREEN5_PRESENTATION_COMPRESSION: ZX0
; SCREEN5_PRESENTATION_CHUNK_LINES: 32
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
LDIRVM  EQU #005C
CHGET   EQU #009F
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
VDP_PALETTE_PORT EQU #9A
SCREEN5_PRESENTATION_ZX0_BUFFER EQU #D000

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
    call DISSCR
    ld a, 5
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    call load_screen5_palette
    call upload_screen5_presentation_bitmap
    call ENASCR
    ei
.main_loop:
    call CHGET
    jp .main_loop

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
    jr z, .slot_ready
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

init_konami8k_fixed_bank0_banks:
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ret

mapper_set_bank_p1:
    ld (#6000), a
    ret

mapper_set_bank_p2:
    ld (#8000), a
    ret

mapper_set_bank_p3:
    ld (#A000), a
    ret


load_screen5_palette:
    ; R#16 selects palette slot 0; then 32 bytes go to port #9A.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_presentation_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

upload_screen5_presentation_bitmap:
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_0
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_0
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #0000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_0_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_1
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_1
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #1000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_1_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_2
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_2
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #2000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_2_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_3
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_3
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #3000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_3_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_4
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_4
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #4000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_4_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_5
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_5
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #5000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_5_SIZE
    call LDIRVM
    ; @mideas:screen5-presentation-chunk SCREEN5_PRESENTATION_BITMAP_CHUNK_6
    ; Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer
    di
    ld hl, SCREEN5_PRESENTATION_BITMAP_CHUNK_6
    ld de, SCREEN5_PRESENTATION_ZX0_BUFFER
    call dzx0_standard
    ei
    ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER
    ld de, #6000
    ld bc, SCREEN5_PRESENTATION_BITMAP_CHUNK_6_SIZE
    call LDIRVM
    ret

SCREEN5_PRESENTATION_BITMAP_SIZE EQU 27136
SCREEN5_PRESENTATION_BITMAP_VRAM_BASE EQU #0000

; VDP palette bytes: byte1=(R<<4)|B, byte2=G
screen5_presentation_palette_data:
    DB #00,#00,#01,#00,#02,#00,#03,#00,#06,#01,#05,#02,#06,#02,#17,#03
    DB #26,#03,#26,#04,#47,#05,#66,#06,#77,#07,#64,#04,#46,#05,#52,#01

SCREEN5_PRESENTATION_BITMAP_CHUNK_0_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 0, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_0:
    ; ZX0 compressed tile_pattern (4096 -> 7 bytes)
    DB #95,#00,#55,#55,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_1_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 1, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_1:
    ; ZX0 compressed tile_pattern (4096 -> 7 bytes)
    DB #95,#00,#55,#55,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_2_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 2, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_2:
    ; ZX0 compressed tile_pattern (4096 -> 7 bytes)
    DB #95,#00,#55,#55,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_3_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 3, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_3:
    ; ZX0 compressed tile_pattern (4096 -> 489 bytes)
    DB #95,#00,#55,#A2,#66,#64,#67,#40,#00,#99,#04,#76,#66,#7F,#D6,#C4
    DB #00,#08,#96,#66,#70,#F7,#07,#06,#9F,#D6,#FE,#44,#08,#E2,#06,#44
    DB #D6,#25,#44,#60,#3D,#00,#55,#C7,#00,#41,#18,#28,#44,#44,#44,#30
    DB #A2,#64,#70,#07,#46,#9B,#03,#44,#46,#CE,#FA,#D7,#A3,#20,#06,#40
    DB #C1,#00,#4A,#40,#A6,#66,#AA,#66,#04,#84,#66,#A2,#30,#90,#70,#43
    DB #AF,#FE,#60,#2B,#9C,#FA,#25,#00,#FF,#DC,#00,#01,#61,#EE,#79,#99
    DB #98,#76,#43,#0A,#27,#4F,#34,#67,#89,#77,#67,#79,#FA,#F8,#D6,#7C
    DB #77,#44,#04,#A0,#74,#00,#01,#82,#67,#9A,#AA,#AA,#A1,#44,#82,#44
    DB #69,#AA,#A7,#E3,#FA,#99,#D6,#F0,#0F,#D0,#67,#00,#12,#08,#AC,#CC
    DB #CA,#96,#AA,#00,#00,#67,#BC,#B8,#68,#8E,#FA,#D6,#0F,#00,#04,#2B
    DB #CB,#4E,#24,#E0,#04,#F7,#E3,#6A,#CC,#C9,#69,#FA,#E3,#D6,#95,#53
    DB #A4,#01,#55,#14,#A2,#84,#82,#40,#90,#49,#88,#82,#22,#A4,#32,#11
    DB #8C,#CA,#86,#62,#24,#32,#66,#64,#01,#96,#A8,#AD,#EC,#CE,#5F,#01
    DB #FE,#04,#24,#B1,#55,#9A,#AA,#AE,#E9,#99,#BE,#25,#68,#F7,#EB,#7A
    DB #E5,#55,#EA,#FA,#E7,#E8,#D7,#AE,#EF,#10,#C1,#00,#18,#0A,#23,#89
    DB #88,#89,#EB,#BB,#BA,#96,#38,#69,#AB,#F5,#F9,#A9,#83,#E3,#FA,#8C
    DB #88,#21,#5C,#FC,#14,#8A,#01,#56,#C7,#68,#24,#FE,#01,#F4,#0E,#31
    DB #02,#56,#52,#FA,#A3,#01,#C1,#02,#4E,#FB,#01,#A9,#34,#44,#47,#AB
    DB #BB,#BE,#85,#54,#67,#AB,#BB,#B9,#53,#20,#01,#54,#31,#34,#BA,#42
    DB #01,#10,#44,#09,#28,#66,#78,#99,#85,#21,#25,#60,#78,#89,#85,#31
    DB #00,#28,#41,#AF,#11,#FE,#04,#75,#0E,#1A,#66,#63,#10,#13,#25,#65
    DB #20,#10,#87,#86,#67,#77,#77,#75,#6E,#01,#66,#F4,#8F,#31,#11,#00
    DB #44,#30,#AB,#11,#E9,#54,#A7,#F4,#A9,#85,#33,#D0,#00,#4C,#67,#0C
    DB #CE,#F4,#03,#91,#66,#52,#B1,#56,#2C,#12,#5B,#24,#8E,#F4,#01,#D5
    DB #56,#28,#07,#55,#63,#23,#10,#C1,#00,#18,#A9,#66,#64,#48,#88,#82
    DB #34,#2A,#76,#8A,#66,#66,#6A,#40,#24,#55,#50,#15,#82,#66,#64,#68
    DB #EC,#9B,#CD,#F0,#13,#13,#EE,#B5,#46,#1C,#06,#50,#D4,#7A,#00,#67
    DB #91,#9D,#88,#89,#AA,#EE,#EF,#00,#03,#69,#AA,#AA,#AE,#98,#86,#42
    DB #DC,#74,#0C,#00,#15,#C6,#12,#B5,#EA,#29,#02,#35,#00,#02,#67,#99
    DB #88,#8E,#19,#06,#3A,#01,#64,#41,#4C,#7D,#12,#57,#30,#8C,#07,#76
    DB #0C,#00,#B0,#67,#C5,#EE,#0D,#55,#56
SCREEN5_PRESENTATION_BITMAP_CHUNK_4_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 4, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_4:
    ; ZX0 compressed tile_pattern (4096 -> 552 bytes)
    DB #58,#68,#AC,#CC,#CB,#83,#31,#00,#93,#06,#64,#44,#69,#CC,#C9,#AE
    DB #FA,#67,#DC,#82,#96,#44,#44,#20,#23,#40,#00,#C0,#FE,#18,#E2,#48
    DB #BC,#01,#82,#10,#62,#00,#44,#A0,#6A,#68,#84,#A2,#30,#90,#70,#16
    DB #28,#68,#EC,#EA,#CE,#20,#E2,#25,#20,#BE,#44,#69,#BC,#B8,#FB,#00
    DB #86,#CA,#86,#66,#66,#60,#29,#60,#01,#61,#98,#89,#AA,#EE,#DF,#10
    DB #98,#04,#6F,#06,#AA,#E5,#55,#EA,#E8,#55,#9A,#AA,#AE,#E9,#99,#99
    DB #77,#44,#08,#A0,#74,#40,#48,#66,#AA,#99,#8F,#F1,#00,#89,#05,#5A
    DB #34,#67,#99,#83,#23,#89,#83,#23,#89,#88,#89,#EB,#BB,#BA,#96,#64
    DB #0F,#D0,#67,#04,#9E,#CA,#96,#32,#F0,#33,#24,#81,#C6,#07,#66,#51
    DB #02,#56,#52,#01,#56,#66,#D6,#E8,#D1,#44,#BC,#66,#00,#01,#83,#CB
    DB #74,#33,#11,#89,#07,#22,#10,#82,#00,#04,#44,#31,#8C,#54,#51,#97
    DB #F1,#44,#47,#AB,#BB,#BE,#85,#33,#A4,#01,#35,#05,#82,#84,#44,#33
    DB #10,#8A,#55,#30,#A8,#06,#70,#22,#34,#31,#64,#8A,#66,#78,#99,#85
    DB #31,#11,#22,#40,#4C,#75,#2A,#CF,#18,#E6,#DD,#FF,#65,#20,#00,#41
    DB #19,#30,#AE,#99,#89,#99,#97,#70,#88,#29,#46,#60,#48,#77,#86,#67
    DB #77,#77,#75,#00,#04,#38,#01,#2A,#89,#EA,#AA,#AA,#68,#29,#44,#18
    DB #62,#9A,#AA,#E9,#85,#53,#90,#55,#13,#1D,#2A,#7F,#EE,#53,#EF,#1C
    DB #00,#41,#D1,#D0,#1F,#A0,#25,#96,#D2,#07,#3A,#46,#66,#FB,#56,#0F
    DB #01,#AE,#D6,#95,#00,#A4,#56,#04,#A6,#69,#8A,#86,#40,#69,#66,#FC
    DB #FA,#1C,#EF,#48,#D6,#BA,#22,#01,#32,#40,#5C,#58,#24,#3F,#F7,#FE
    DB #6C,#64,#4D,#D6,#C5,#C0,#00,#4A,#67,#C5,#98,#25,#98,#88,#98,#87
    DB #68,#89,#77,#67,#79,#EA,#FA,#66,#C4,#88,#AB,#D6,#EF,#C1,#00,#4C
    DB #5C,#25,#3B,#FA,#76,#12,#06,#8E,#A7,#67,#FA,#71,#B5,#07,#EA,#2F
    DB #03,#21,#02,#04,#73,#12,#C2,#FA,#70,#2B,#07,#A8,#03,#00,#71,#3F
    DB #D6,#FE,#05,#2C,#04,#68,#25,#68,#75,#4F,#06,#54,#CD,#00,#43,#DC
    DB #E9,#01,#10,#04,#68,#03,#A6,#69,#24,#82,#34,#75,#0E,#DC,#BC,#11
    DB #FE,#11,#F2,#01,#01,#0A,#CD,#F0,#13,#6A,#97,#B8,#1C,#06,#40,#FA
    DB #00,#60,#34,#8C,#19,#AE,#EF,#D4,#F1,#63,#06,#51,#9E,#00,#E3,#F1
    DB #10,#00,#12,#A6,#34,#79,#88,#21,#AD,#02,#47,#06,#E7,#FA,#F0,#E3
    DB #06,#53,#51,#DB,#12,#52,#D4,#F1,#68,#07,#76,#3A,#FA,#8F,#01,#02
    DB #10,#75,#18,#12,#B8,#64,#00,#B5,#64,#4B,#06,#9B,#FA,#42,#A4,#01
    DB #10,#41,#B5,#46,#0F,#12,#5E,#EA,#23,#44,#30,#9B,#FA,#41,#1F,#06
    DB #D1,#FE,#03,#54,#F8,#0D,#00,#95,#04,#6D,#47,#0F,#EE,#D4,#FE,#57
    DB #0A,#01,#53,#6A,#09,#92,#52,#A9,#02,#53,#11,#7A,#0C,#8F,#04,#F4
    DB #E1,#00,#A4,#52,#45,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_5_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 5, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_5:
    ; ZX0 compressed tile_pattern (4096 -> 7 bytes)
    DB #95,#00,#55,#55,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_6_SIZE EQU 2560

; SCREEN 5 4bpp bitmap chunk 6, 2560 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_6:
    ; ZX0 compressed tile_pattern (2560 -> 7 bytes)
    DB #81,#00,#55,#55,#D5,#55,#60

; ==================================================================
; ZX0 DECOMPRESSOR (AUTO-INJECTED)
; ==================================================================
; -----------------------------------------------------------------------------
; ZX0 decoder by Einar Saukas & Urusergi
; "Standard" version (68 bytes only)
; -----------------------------------------------------------------------------
; Parameters:
;   HL: source address (compressed data)
;   DE: destination address (decompressing)
; -----------------------------------------------------------------------------

dzx0_standard:
        ld      bc, $ffff               ; preserve default offset 1
        push    bc
        inc     bc
        ld      a, $80
dzx0s_literals:
        call    dzx0s_elias             ; obtain length
        ldir                            ; copy literals
        add     a, a                    ; copy from last offset or new offset?
        jr      c, dzx0s_new_offset
        call    dzx0s_elias             ; obtain length
dzx0s_copy:
        ex      (sp), hl                ; preserve source, restore offset
        push    hl                      ; preserve offset
        add     hl, de                  ; calculate destination - offset
        ldir                            ; copy from offset
        pop     hl                      ; restore offset
        ex      (sp), hl                ; preserve offset, restore source
        add     a, a                    ; copy from literals or new offset?
        jr      nc, dzx0s_literals
dzx0s_new_offset:
        pop     bc                      ; discard last offset
        ld      c, $fe                  ; prepare negative offset
        call    dzx0s_elias_loop        ; obtain offset MSB
        inc     c
        ret     z                       ; check end marker
        ld      b, c
        ld      c, (hl)                 ; obtain offset LSB
        inc     hl
        rr      b                       ; last offset bit becomes first length bit
        rr      c
        push    bc                      ; preserve new offset
        ld      bc, 1                   ; obtain length
        call    nc, dzx0s_elias_backtrack
        inc     bc
        jr      dzx0s_copy
dzx0s_elias:
        inc     c                       ; interlaced Elias gamma coding
dzx0s_elias_loop:
        add     a, a
        jr      nz, dzx0s_elias_skip
        ld      a, (hl)                 ; load another group of 8 bits
        inc     hl
        rla
dzx0s_elias_skip:
        ret     c
dzx0s_elias_backtrack:
        add     a, a
        rl      c
        rl      b
        jr      dzx0s_elias_loop
; -----------------------------------------------------------------------------

    ds #C000 - $, #FF

; ==================================================================
; ZX0 TILE PATTERN BUFFER (AUTO-INJECTED)
; Shared scratch buffer for tile pattern data decompression (4096 bytes, scratch slot 4096 bytes)
; ==================================================================
ZX0_TILE_PATTERN_BUFFER EQU #C900

    end
