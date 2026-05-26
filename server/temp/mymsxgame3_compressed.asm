; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation backend
; Project: MyMSXGame3
; Presentation: New MSX2 SCREEN 5 Presentation
; Screen mode: SCREEN 5 (Graphics III)
; Backend: msx2-screen5-presentation
; MSX2_GAMEFLOW_PRESENT: no
; MSX2_GAMEFLOW_ASSET: none
; MSX2_GAMEFLOW_START_NODE: none
; MSX2_GAMEFLOW_SCREEN5_NODE: none
; MSX2_GAMEFLOW_PRESENTATION_ASSET_ID: auto-first
; MSX2_GAMEFLOW_INITIAL_GLOBALS: 0
; MSX2_GAMEFLOW_AFTER_PRESENTATION_GLOBALS: 0
; MSX2_GAMEFLOW_AFTER_PRE_TEXT_TRANSITION_GLOBALS: 0
; MSX2_GAMEFLOW_AFTER_TRANSITION_GLOBALS: 0
; MSX2_GAMEFLOW_TEXT: none
; MSX2_GAMEFLOW_IFTHENELSE: none
; MSX2_GAMEFLOW_PRE_TEXT_TRANSITION: none
; MSX2_GAMEFLOW_NEXT_TRANSITION: none
; MSX2_GAMEFLOW_TERMINAL_ACTION: loop
; MSX2_GAMEFLOW_TRANSITION_EFFECT: none
; MSX2_GAMEFLOW_TRANSITION_DURATION_FRAMES: 0
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
FILVRM  EQU #0056
CHGET   EQU #009F
POSIT   EQU #00C6
GRPPRT  EQU #0089
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
FORCLR  EQU #F3E8
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA
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
    call msx2_gameflow_apply_initial_globals
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











msx2_gameflow_apply_initial_globals:
    ret
msx2_gameflow_apply_after_presentation_globals:
    ret
msx2_gameflow_apply_after_pre_text_transition_globals:
    ret
msx2_gameflow_apply_after_transition_globals:
    ret
msx2_gameflow_apply_then_pre_text_globals:
    ret
msx2_gameflow_apply_then_pre_text_globals_after_transition:
    ret
msx2_gameflow_apply_then_globals:
    ret
msx2_gameflow_apply_else_pre_text_globals:
    ret
msx2_gameflow_apply_else_pre_text_globals_after_transition:
    ret
msx2_gameflow_apply_else_globals:
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
SCREEN5_PRESENTATION_VISIBLE_LINES EQU 212
SCREEN5_PRESENTATION_BYTES_PER_LINE EQU 128
SCREEN5_PRESENTATION_LAST_BYTE_COLUMN EQU 127
SCREEN5_PRESENTATION_HALF_BYTES_PER_LINE EQU 64
SCREEN5_PRESENTATION_BITMAP_VRAM_BASE EQU #0000

; VDP palette bytes: byte1=(R<<4)|B, byte2=G
screen5_presentation_palette_data:
    DB #00,#00,#00,#00,#22,#05,#33,#06,#15,#01,#27,#02,#51,#01,#36,#06
    DB #72,#02,#74,#04,#52,#05,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07


SCREEN5_PRESENTATION_BITMAP_CHUNK_0_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 0, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_0:
    ; ZX0 compressed tile_pattern (4096 -> 1292 bytes)
    DB #80,#11,#05,#08,#95,#16,#66,#59,#80,#68,#86,#66,#1B,#6E,#C1,#06
    DB #B7,#16,#A4,#A0,#16,#52,#8F,#61,#FB,#DF,#E8,#64,#68,#66,#4F,#6C
    DB #7F,#F7,#FB,#D2,#30,#E4,#61,#50,#29,#88,#89,#81,#16,#F7,#FD,#EF
    DB #FE,#FE,#AD,#FE,#AF,#18,#FB,#FF,#F5,#4C,#D7,#E8,#EA,#18,#A3,#16
    DB #F8,#B1,#ED,#A7,#BE,#81,#61,#C3,#DE,#FF,#9D,#9B,#E5,#BF,#D7,#91
    DB #EF,#A6,#F9,#EB,#82,#FF,#D5,#E3,#F5,#AF,#F0,#81,#D0,#F9,#FF,#DA
    DB #FA,#F9,#05,#18,#04,#EA,#7E,#18,#FF,#6A,#FC,#EF,#00,#9D,#BE,#B0
    DB #F3,#AA,#E7,#68,#9F,#64,#DE,#FD,#AA,#8F,#C6,#12,#DB,#FE,#FF,#C8
    DB #94,#B8,#34,#9A,#F2,#FA,#FA,#18,#E2,#86,#EB,#F3,#18,#6A,#DE,#86
    DB #7F,#EB,#70,#EF,#E3,#16,#AD,#90,#00,#DA,#67,#86,#3F,#8E,#8F,#5A
    DB #DF,#9F,#58,#FD,#FF,#F2,#D6,#F3,#EF,#D0,#BF,#40,#F7,#F0,#6F,#81
    DB #9A,#3F,#F5,#E0,#F3,#9A,#FD,#F5,#FD,#E2,#BF,#66,#CA,#9F,#8A,#EB
    DB #7B,#62,#66,#64,#FE,#7E,#D7,#C1,#79,#18,#88,#66,#FE,#55,#B7,#68
    DB #FB,#79,#ED,#00,#1B,#88,#BC,#FC,#FE,#00,#C8,#01,#E4,#88,#68,#00
    DB #77,#CD,#C0,#02,#1C,#7D,#30,#35,#E9,#91,#00,#C3,#D1,#53,#8A,#45
    DB #E4,#84,#1E,#02,#47,#4F,#8E,#E0,#B8,#99,#BF,#FB,#AB,#B8,#E7,#BF
    DB #BB,#B8,#F9,#FB,#BB,#A6,#88,#F7,#FA,#8A,#83,#BB,#BF,#F8,#18,#AA
    DB #E4,#A8,#72,#AA,#AA,#A6,#6D,#19,#16,#BB,#AB,#BA,#61,#AA,#88,#8A
    DB #BC,#81,#58,#BA,#A8,#E8,#A1,#11,#A6,#6B,#FF,#BB,#BB,#61,#AF,#FA
    DB #AB,#FB,#AF,#FF,#AB,#DA,#83,#1E,#8E,#68,#01,#06,#1A,#AA,#BA,#AA
    DB #8A,#AB,#FF,#BA,#A8,#55,#E3,#AF,#BA,#AB,#BB,#46,#49,#AA,#EF,#9F
    DB #EB,#AA,#7F,#FE,#8F,#73,#01,#ED,#3D,#A8,#18,#F9,#BA,#DA,#D2,#3F
    DB #A1,#11,#EB,#F3,#BF,#BB,#1B,#F5,#FF,#7F,#A8,#5A,#FA,#CB,#E8,#FB
    DB #B1,#01,#F7,#BA,#57,#71,#8F,#F9,#AB,#81,#9F,#7B,#FC,#B6,#FF,#CB
    DB #E7,#F3,#A5,#FB,#CF,#05,#81,#BB,#F1,#49,#00,#2B,#66,#EF,#C6,#6A
    DB #B3,#FB,#95,#FF,#F3,#A1,#DB,#F9,#EC,#FF,#81,#28,#F9,#5B,#97,#8A
    DB #EE,#CF,#EF,#88,#F7,#FA,#A1,#C6,#86,#DB,#EA,#A5,#01,#88,#B7,#1A
    DB #2B,#FF,#33,#1D,#D7,#0D,#AC,#86,#1B,#B7,#B6,#90,#EF,#D9,#BA,#CC
    DB #BF,#BB,#99,#01,#FA,#F7,#CB,#01,#AA,#18,#84,#16,#61,#6E,#18,#D2
    DB #7A,#3D,#B1,#FB,#78,#81,#FB,#F9,#09,#EE,#F8,#11,#9D,#EE,#8B,#BA
    DB #BB,#AA,#52,#BB,#EB,#A1,#D8,#81,#EE,#D0,#66,#A6,#E7,#00,#7F,#08
    DB #F7,#AA,#9A,#BB,#9C,#B1,#FE,#B9,#9B,#27,#C3,#DF,#6A,#E7,#F3,#DE
    DB #F9,#F9,#01,#DF,#B8,#64,#F1,#F9,#00,#69,#61,#3E,#9D,#30,#DF,#13
    DB #F7,#A9,#00,#A8,#A3,#AA,#2F,#FA,#54,#BE,#AB,#F6,#7A,#8A,#B8,#B1
    DB #01,#A8,#37,#21,#D2,#37,#F8,#DB,#2D,#14,#FB,#B8,#CA,#FA,#DC,#01
    DB #8A,#0A,#AA,#0F,#25,#A3,#65,#A6,#ED,#09,#66,#1E,#4B,#9F,#A8,#1A
    DB #88,#EF,#FA,#CB,#F1,#F7,#00,#68,#1B,#75,#FD,#5F,#EC,#FE,#12,#53
    DB #8D,#BA,#A8,#01,#1F,#4C,#BB,#52,#F4,#A7,#01,#AA,#DE,#FE,#01,#9A
    DB #A8,#6A,#62,#FA,#AA,#08,#93,#BA,#B1,#7F,#D6,#DE,#D6,#B8,#7C,#8D
    DB #60,#00,#5F,#FF,#A6,#01,#A1,#8A,#B1,#1F,#1A,#AA,#68,#11,#7F,#0F
    DB #F7,#5B,#72,#FC,#33,#00,#FD,#BE,#00,#A0,#AA,#D7,#A2,#E8,#01,#8B
    DB #29,#AA,#A6,#AB,#83,#B6,#E1,#A3,#00,#4A,#66,#5F,#3D,#AA,#01,#1B
    DB #A1,#69,#B8,#3F,#7A,#EF,#E4,#AB,#00,#A2,#AA,#68,#AB,#1A,#AA,#9C
    DB #1B,#B8,#AB,#E7,#A8,#81,#8A,#00,#A6,#0A,#A8,#CB,#22,#DB,#00,#A8
    DB #71,#BF,#CF,#C7,#D6,#D3,#A3,#E3,#86,#00,#9F,#14,#2B,#4C,#00,#5D
    DB #3D,#9A,#6A,#26,#11,#0F,#00,#FA,#73,#01,#AA,#0F,#5F,#EF,#DA,#B6
    DB #45,#3A,#4B,#00,#82,#AA,#23,#AB,#AB,#BB,#5C,#F5,#A8,#E2,#4F,#A2
    DB #34,#8B,#BB,#DC,#00,#3F,#DC,#01,#FC,#14,#ED,#7F,#01,#64,#78,#00
    DB #98,#14,#41,#91,#16,#81,#2C,#41,#A7,#13,#18,#53,#AE,#D5,#F0,#30
    DB #F3,#4A,#FE,#D4,#F1,#22,#DA,#E5,#2D,#18,#7F,#5F,#E1,#7E,#A7,#F9
    DB #A9,#3A,#66,#6A,#E2,#6D,#44,#44,#11,#7F,#CB,#E7,#AD,#AF,#DA,#8A
    DB #CD,#FB,#AC,#00,#5B,#D8,#4C,#D4,#F7,#A3,#EE,#FE,#D5,#E2,#F1,#14
    DB #FD,#C0,#00,#A3,#11,#FE,#6B,#AE,#9D,#A9,#66,#A6,#3F,#F6,#59,#FE
    DB #F7,#E4,#B5,#CF,#8A,#3E,#02,#40,#CF,#58,#FB,#CF,#99,#5D,#8B,#3D
    DB #E6,#BE,#F4,#BF,#01,#E7,#B1,#D4,#F1,#C0,#F5,#24,#8F,#FC,#A8,#3F
    DB #00,#D7,#A3,#00,#02,#AF,#61,#14,#C7,#EA,#FB,#9D,#AB,#60,#88,#8A
    DB #81,#D8,#00,#ED,#86,#1B,#68,#63,#EE,#E9,#4A,#A6,#D1,#8F,#DA,#2C
    DB #32,#5D,#3D,#44,#41,#3B,#22,#9B,#8A,#B1,#FA,#E7,#00,#8A,#A8,#6A
    DB #4D,#67,#66,#2B,#20,#68,#83,#00,#CB,#AB,#3C,#79,#01,#00,#1A,#18
    DB #6B,#14,#B7,#BA,#9E,#E2,#00,#97,#AA,#FD,#0A,#F6,#B6,#88,#5C,#3D
    DB #F6,#FB,#2D,#98,#BD,#00,#F1,#6F,#2E,#F7,#9F,#9A,#F9,#DA,#00,#6A
    DB #EF,#EA,#D7,#88,#01,#61,#44,#7E,#AB,#FA,#D1,#C4,#00,#F7,#C3,#65
    DB #EE,#A0,#88,#34,#D8,#1C,#29,#AA,#FE,#4A,#00,#0A,#16,#1A,#88,#EB
    DB #FF,#8A,#8D,#00,#B8,#12,#FE,#C4,#FB,#90,#EA,#A4,#B9,#61,#BC,#1A
    DB #DD,#5E,#13,#60,#AD,#8A,#CF,#00,#3E,#F4,#B9,#5D,#E5,#5C,#00,#4A
    DB #14,#E6,#BF,#A8,#A8,#66,#7C,#3B,#A7,#67,#B1,#6A,#52,#68,#AA,#AB
    DB #1A,#75,#73,#2C,#F2,#39,#73,#55,#F8,#B8,#53,#FF,#7B,#81,#15,#54
    DB #45,#44,#C0,#3A,#98,#A6,#7B,#D9,#A8,#4A,#F9,#88,#7F,#DE,#FE,#EB
    DB #01,#F2,#EF,#AA,#1E,#8B,#F6,#A1,#81,#52,#37,#C7,#95,#00,#DD,#6B
    DB #6F,#BE,#C3,#BE,#52,#F5,#67,#9F,#88,#F7,#69,#27,#86,#D2,#DF,#F0
    DB #68,#6B,#3F,#00,#CB,#7D,#BE,#2B,#72,#66,#A3,#04,#86,#68,#8F,#00
    DB #9C,#FE,#BD,#C1,#88,#72,#86,#3F,#8D,#F3,#3C,#72,#0F,#05,#FE,#C3
    DB #82,#FC,#03,#8B,#27,#40,#D5,#FB,#C4,#00,#FF,#BC,#7C,#FF,#78,#6A
    DB #FD,#34,#8F,#DC,#6C,#D5,#BF,#8D,#86,#EF,#BD,#F2,#D7,#01,#70,#EE
    DB #EA,#FF,#22,#15,#55,#FF,#44,#E9,#26,#39,#C1,#94,#F3,#88,#FD,#FE
    DB #CF,#CF,#E0,#EE,#FA,#00,#11,#68,#18,#52,#DC,#1E,#67,#F6,#04,#4A
    DB #E3,#F6,#95,#FE,#E8,#C1,#14,#28,#45,#6F,#C1,#00,#ED,#FF,#F1,#63
    DB #A2,#6D,#F8,#9C,#7A,#F4,#73,#9A,#FD,#DD,#F2,#DF,#EE,#09,#FE,#1B
    DB #88,#19,#FC,#F7,#45,#4B,#BE,#AE,#7B,#02,#57,#E3,#C1,#F6,#E8,#FF
    DB #BC,#79,#1F,#F7,#57,#77,#75,#03,#DC,#7F,#75,#54,#3C,#E7,#2E,#E5
    DB #CB,#88,#3E,#97,#02,#98,#11,#86,#66,#4D,#55,#56
SCREEN5_PRESENTATION_BITMAP_CHUNK_1_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 1, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_1:
    ; ZX0 compressed tile_pattern (4096 -> 1708 bytes)
    DB #81,#11,#80,#A6,#86,#81,#18,#68,#88,#11,#14,#44,#14,#41,#11,#E7
    DB #F4,#90,#FC,#A8,#44,#28,#41,#41,#44,#14,#AA,#44,#45,#55,#2E,#77
    DB #F7,#FF,#A7,#55,#7F,#55,#54,#FF,#E1,#A1,#83,#C5,#A8,#88,#14,#A4
    DB #44,#0E,#CF,#6B,#18,#81,#16,#81,#85,#C6,#98,#81,#19,#61,#F8,#F3
    DB #FC,#06,#8A,#44,#44,#64,#AB,#45,#55,#55,#77,#7F,#FF,#F7,#68,#FB
    DB #F7,#83,#51,#57,#74,#11,#84,#FE,#79,#36,#4E,#01,#69,#66,#68,#88
    DB #FB,#88,#86,#66,#F3,#F7,#86,#EF,#F9,#FF,#68,#F3,#EF,#E7,#FA,#F6
    DB #F2,#EE,#F9,#88,#C6,#EB,#4D,#D6,#64,#01,#54,#FE,#05,#00,#FE,#FB
    DB #F5,#00,#7E,#E5,#D9,#79,#39,#16,#46,#B2,#BF,#68,#F9,#FB,#9F,#FE
    DB #6C,#AF,#81,#50,#FE,#FF,#ED,#F7,#8D,#81,#D9,#31,#00,#0A,#61,#CA
    DB #CD,#86,#B8,#66,#77,#0A,#66,#16,#61,#18,#86,#16,#66,#18,#AA,#16
    DB #11,#28,#18,#61,#B3,#61,#81,#9D,#FC,#95,#D5,#D9,#F2,#39,#D7,#03
    DB #5C,#11,#47,#45,#F5,#54,#45,#57,#A0,#08,#DB,#FC,#CF,#F1,#FF,#F7
    DB #75,#D6,#01,#FC,#67,#11,#D6,#D1,#BF,#B8,#82,#FA,#8F,#FD,#9D,#81
    DB #FB,#EF,#22,#FF,#FD,#E5,#DA,#FB,#7A,#67,#18,#3F,#FE,#A9,#35,#56
    DB #FE,#D1,#4B,#A1,#B8,#16,#1F,#FE,#61,#86,#BB,#EF,#7E,#DE,#DB,#FE
    DB #A0,#16,#FE,#11,#DD,#EC,#DE,#B6,#72,#66,#41,#14,#08,#8C,#5F,#F5
    DB #B6,#02,#09,#73,#E7,#74,#1F,#FC,#CB,#FB,#74,#5F,#DA,#6E,#FA,#7B
    DB #FE,#1E,#B8,#A0,#BE,#68,#7D,#5A,#FE,#59,#05,#54,#A3,#16,#DB,#F3
    DB #F0,#FD,#4B,#F1,#6D,#81,#00,#A2,#41,#27,#88,#66,#CF,#BF,#FE,#FB
    DB #F4,#F8,#FD,#B0,#8D,#FC,#98,#F3,#FC,#98,#7D,#BC,#FC,#07,#7B,#CD
    DB #2E,#7E,#04,#01,#66,#FE,#41,#17,#2B,#F7,#F7,#75,#6E,#00,#FA,#DB
    DB #CB,#E1,#A8,#9A,#11,#7F,#78,#FF,#1C,#E0,#A0,#F3,#86,#FB,#C8,#19
    DB #D7,#D3,#F1,#49,#CE,#4B,#88,#90,#FE,#D3,#E7,#C7,#E2,#4B,#C2,#E6
    DB #00,#74,#FF,#FF,#88,#EF,#11,#77,#03,#5A,#FC,#EE,#75,#D9,#58,#B4
    DB #68,#68,#3C,#A6,#FF,#29,#E8,#F8,#EE,#66,#39,#04,#0A,#14,#E1,#FE
    DB #5A,#14,#C6,#06,#36,#01,#E6,#4F,#01,#71,#14,#47,#8D,#FE,#EE,#FC
    DB #FC,#FF,#9E,#00,#9C,#17,#D4,#20,#30,#D6,#04,#80,#41,#C2,#15,#68
    DB #7F,#F1,#41,#A7,#E1,#71,#77,#1F,#F7,#6F,#FD,#55,#FE,#D4,#FE,#D0
    DB #4D,#72,#11,#F5,#E2,#D9,#00,#47,#C3,#01,#06,#8A,#F1,#17,#1D,#FA
    DB #14,#CE,#11,#F1,#F1,#00,#F4,#F7,#01,#FD,#FE,#CB,#C1,#54,#7E,#55
    DB #AE,#45,#FE,#02,#01,#A0,#55,#AB,#1F,#11,#1F,#FC,#47,#0E,#FA,#08
    DB #F7,#75,#44,#55,#DB,#C9,#41,#84,#7E,#76,#1E,#07,#72,#8B,#F4,#10
    DB #FF,#3F,#FD,#F7,#28,#01,#55,#20,#65,#F4,#44,#51,#71,#7F,#F7,#14
    DB #EF,#FF,#F6,#79,#06,#14,#F5,#B2,#E3,#58,#5D,#E0,#4F,#D2,#6F,#14
    DB #FD,#66,#00,#A3,#47,#E7,#EE,#0B,#23,#1E,#B5,#90,#AC,#EF,#CF,#4E
    DB #F0,#8F,#55,#BD,#B5,#6A,#D4,#10,#DE,#28,#91,#44,#D7,#5A,#DF,#86
    DB #7F,#F1,#D2,#3E,#EC,#F6,#36,#DE,#53,#68,#03,#75,#B4,#57,#2E,#08
    DB #0F,#D7,#FC,#07,#A8,#DD,#77,#D3,#1F,#CF,#FD,#7F,#00,#83,#CE,#BC
    DB #8C,#17,#FD,#EF,#CC,#23,#BA,#B3,#F6,#54,#5C,#1F,#5A,#FC,#BD,#F5
    DB #AE,#F8,#F7,#8A,#7C,#E2,#77,#08,#DB,#24,#F8,#05,#FE,#7B,#F1,#1F
    DB #51,#11,#15,#80,#4F,#FA,#4B,#02,#87,#A2,#CA,#12,#14,#0D,#23,#D6
    DB #DC,#F4,#19,#84,#F1,#D5,#D7,#56,#1F,#52,#7E,#F2,#CE,#1E,#64,#1F
    DB #7E,#A7,#44,#4D,#04,#FF,#2D,#25,#00,#2E,#F4,#D9,#AA,#57,#F7,#C7
    DB #CF,#FA,#C6,#FE,#F4,#88,#F3,#57,#E0,#1F,#D3,#CF,#41,#2E,#E0,#31
    DB #00,#3E,#D7,#00,#7F,#BB,#2E,#F7,#88,#DF,#00,#CF,#AD,#E0,#57,#7E
    DB #45,#74,#B3,#45,#0B,#2A,#FB,#57,#22,#54,#7F,#E0,#E1,#D1,#B6,#15
    DB #7E,#14,#F7,#E4,#7F,#DB,#4D,#20,#2E,#C8,#F2,#CD,#FC,#CD,#78,#D6
    DB #30,#32,#F8,#31,#81,#DA,#FF,#CA,#C0,#E7,#1C,#CC,#F3,#E8,#7B,#FB
    DB #47,#BE,#41,#74,#CA,#7D,#5F,#FF,#57,#31,#F8,#FE,#03,#A4,#FE,#61
    DB #AE,#EE,#E4,#1E,#EF,#E1,#1F,#F7,#DF,#32,#7F,#F5,#FE,#DD,#BB,#BE
    DB #A8,#91,#F6,#FD,#AA,#25,#34,#D8,#44,#F3,#38,#B1,#EE,#85,#D2,#F3
    DB #FE,#8C,#7E,#FE,#E4,#DD,#EE,#C7,#A0,#35,#DB,#13,#17,#5F,#F6,#35
    DB #F3,#15,#D4,#45,#CE,#00,#01,#06,#1B,#B1,#CF,#FF,#FC,#F7,#FF,#17
    DB #EF,#23,#75,#54,#F4,#BF,#D5,#27,#FA,#F1,#3C,#8E,#56,#72,#CB,#C1
    DB #75,#C9,#F5,#0E,#F8,#D0,#C5,#54,#14,#91,#B0,#EC,#18,#77,#C8,#77
    DB #B6,#D8,#FF,#C6,#7D,#75,#BF,#43,#75,#08,#6B,#07,#FF,#DA,#CF,#02
    DB #98,#55,#BB,#FC,#81,#F6,#5A,#05,#4C,#68,#77,#87,#5F,#F5,#45,#71
    DB #47,#9A,#7C,#45,#FA,#6E,#74,#63,#15,#F4,#FC,#83,#06,#9A,#06,#45
    DB #7F,#46,#D7,#02,#F8,#C8,#00,#EB,#C8,#54,#88,#B5,#54,#41,#70,#9E
    DB #60,#A6,#67,#17,#F7,#54,#BA,#12,#02,#9F,#55,#BF,#0B,#00,#70,#0B
    DB #2C,#65,#EF,#09,#F9,#9C,#F4,#71,#77,#EF,#07,#D4,#BB,#88,#92,#FA
    DB #47,#55,#04,#45,#A3,#17,#BA,#AF,#FF,#7A,#83,#14,#3E,#62,#06,#F1
    DB #EB,#64,#B8,#73,#98,#BF,#47,#82,#FF,#8F,#FD,#BD,#F0,#FD,#D9,#AE
    DB #D7,#14,#DB,#66,#0F,#08,#E3,#F3,#74,#87,#01,#FC,#BB,#C1,#11,#1C
    DB #60,#03,#83,#FE,#E7,#44,#1C,#78,#D1,#97,#8D,#FF,#F5,#73,#F1,#F1
    DB #57,#EA,#D6,#A6,#3A,#EA,#F7,#54,#40,#DD,#FE,#67,#D0,#16,#D2,#13
    DB #63,#50,#C8,#3F,#46,#CF,#38,#2F,#F6,#D0,#DF,#8E,#BD,#FB,#57,#6F
    DB #64,#CA,#CC,#07,#99,#05,#6B,#1B,#A1,#8A,#FF,#F1,#9D,#1E,#73,#03
    DB #E1,#BD,#8D,#4F,#F1,#7B,#BD,#AD,#FE,#E2,#15,#09,#57,#F5,#CB,#D4
    DB #18,#9F,#C6,#5F,#75,#12,#0D,#37,#44,#42,#C0,#47,#E3,#D1,#4C,#FA
    DB #4B,#02,#45,#F7,#22,#3F,#84,#05,#BF,#23,#F5,#EE,#A0,#7B,#5F,#D4
    DB #E0,#01,#F1,#C0,#1B,#6B,#B1,#18,#FE,#0E,#FC,#8B,#F7,#77,#DD,#9B
    DB #FF,#FC,#87,#03,#FD,#AF,#FD,#45,#A3,#3D,#FA,#B4,#D9,#75,#EC,#8F
    DB #E1,#51,#67,#DA,#49,#DA,#CD,#E1,#52,#B4,#53,#B8,#2C,#48,#FE,#FE
    DB #6C,#DA,#02,#F7,#45,#E7,#A2,#ED,#07,#75,#5F,#1E,#5B,#84,#F8,#80
    DB #02,#B4,#74,#87,#2F,#A8,#61,#F8,#1B,#1E,#F7,#0F,#FE,#2A,#12,#47
    DB #EC,#9B,#4F,#73,#FB,#88,#DB,#E9,#F4,#19,#F2,#B2,#77,#88,#D3,#BD
    DB #09,#0C,#DF,#82,#B5,#C6,#5C,#BC,#1D,#23,#C4,#6D,#08,#A8,#FA,#57
    DB #FD,#70,#FD,#83,#68,#4A,#4F,#FF,#1F,#3D,#1B,#36,#2B,#36,#77,#C9
    DB #79,#51,#AF,#16,#A6,#88,#B6,#CB,#02,#F4,#E8,#F6,#F1,#77,#5F,#95
    DB #EA,#16,#51,#C2,#71,#76,#70,#35,#D5,#F4,#AE,#F5,#9A,#A2,#00,#77
    DB #51,#CC,#06,#F5,#57,#F0,#02,#65,#BC,#3F,#3C,#D2,#C9,#F6,#6E,#15
    DB #AC,#DF,#FE,#AD,#FA,#57,#B0,#25,#47,#FB,#EE,#7B,#45,#3B,#35,#02
    DB #75,#C9,#7D,#79,#C7,#58,#0D,#EA,#88,#1A,#00,#F7,#AA,#77,#47,#2A
    DB #75,#C2,#74,#98,#32,#F6,#DF,#2E,#F3,#3B,#D9,#AE,#ED,#02,#FC,#28
    DB #8F,#FF,#00,#C4,#CB,#5B,#72,#6F,#FA,#00,#5C,#B4,#BE,#8E,#2A,#CC
    DB #D7,#C2,#3C,#67,#8D,#9C,#A3,#54,#5F,#F4,#57,#CE,#A7,#41,#70,#37
    DB #A8,#55,#47,#B9,#1F,#74,#03,#89,#44,#16,#6F,#A1,#68,#17,#7F,#B3
    DB #57,#75,#57,#15,#7F,#05,#7B,#D7,#A0,#EE,#04,#4F,#0F,#9D,#57,#BF
    DB #FF,#F7,#EF,#83,#9D,#74,#FC,#58,#FB,#F0,#5C,#73,#EC,#F4,#D9,#00
    DB #CA,#B7,#14,#75,#3F,#B0,#F5,#8D,#BE,#8F,#B2,#16,#D1,#FD,#55,#4C
    DB #E3,#FA,#15,#F5,#FC,#6E,#3F,#F1,#C3,#E9,#48,#73,#AD,#1A,#A6,#AA
    DB #43,#03,#EA,#00,#45,#0B,#F7,#45,#41,#47,#5F,#42,#EF,#BE,#F5,#97
    DB #46,#BC,#37,#FF,#52,#F6,#32,#10,#7D,#EF,#7D,#54,#F3,#4A,#04,#FD
    DB #FC,#74,#0C,#D2,#00,#30,#7E,#02,#2A,#E7,#FA,#C3,#E5,#AA,#D1,#BF
    DB #56,#F9,#EE,#EB,#01,#57,#EB,#40,#47,#EA,#65,#E1,#B8,#0F,#46,#A1
    DB #18,#A1,#39,#B2,#56,#58,#ED,#01,#54,#F7,#C6,#B8,#AD,#51,#7F,#EA
    DB #AE,#BF,#57,#01,#2B,#EF,#A3,#0A,#EB,#CE,#DF,#BD,#AE,#E7,#34,#23
    DB #44,#74,#00,#FF,#24,#F5,#F7,#16,#F4,#D0,#CC,#E4,#F1,#9C,#B1,#28
    DB #FF,#84,#DE,#7E,#ED,#3D,#4C,#F5,#F5,#A8,#7C,#81,#74,#FE,#CB,#BF
    DB #27,#B8,#EF,#D3,#15,#3F,#3B,#FD,#AC,#C4,#73,#27,#EA,#B0,#EA,#BA
    DB #E2,#8C,#E9,#51,#09,#45,#F7,#E9,#D4,#FB,#BB,#40,#7C,#4E,#80,#00
    DB #C5,#87,#1C,#B9,#88,#E8,#B1,#47,#BB,#4E,#FB,#F4,#F3,#A9,#CC,#78
    DB #4F,#EE,#C5,#78,#17,#83,#9D,#A8,#66,#4D,#01,#5D,#CD,#49,#AC,#FC
    DB #CC,#7D,#00,#B9,#98,#00,#DB,#66,#F3,#93,#EF,#60,#CC,#DB,#FA,#FD
    DB #FD,#01,#11,#FF,#0B,#74,#CF,#64,#FE,#75,#55,#58
SCREEN5_PRESENTATION_BITMAP_CHUNK_2_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 2, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_2:
    ; ZX0 compressed tile_pattern (4096 -> 1949 bytes)
    DB #92,#11,#A7,#44,#11,#14,#41,#AE,#F7,#44,#F8,#A6,#44,#29,#47,#74
    DB #AA,#4F,#F7,#E5,#47,#FE,#54,#E4,#CD,#A0,#14,#A9,#41,#45,#FF,#54
    DB #14,#BA,#75,#A8,#12,#86,#64,#11,#16,#61,#1B,#15,#57,#55,#45,#2E
    DB #51,#D5,#3F,#57,#77,#B2,#8E,#78,#FB,#38,#47,#F4,#EC,#A8,#11,#BF
    DB #47,#FF,#8A,#9F,#FE,#BE,#EE,#34,#64,#3F,#FC,#E5,#AF,#FE,#AF,#14
    DB #C7,#9D,#C4,#FA,#F8,#13,#7F,#87,#4F,#FF,#FF,#74,#14,#98,#8D,#41
    DB #14,#54,#2B,#55,#9E,#00,#8C,#E9,#02,#E9,#AA,#61,#11,#82,#FF,#61
    DB #AA,#15,#13,#01,#5A,#9B,#57,#57,#77,#FF,#B2,#9F,#6A,#BE,#5F,#F1
    DB #93,#FF,#11,#CD,#EF,#7B,#BF,#D8,#78,#8F,#52,#99,#63,#B8,#7E,#FC
    DB #F2,#F0,#FE,#8D,#15,#54,#F7,#E0,#AE,#62,#77,#74,#0B,#F7,#FF,#E6
    DB #85,#09,#FF,#DD,#69,#F9,#F7,#27,#E8,#8E,#F7,#41,#16,#0D,#E0,#1A
    DB #A5,#CD,#1B,#BA,#45,#75,#A4,#DA,#FC,#60,#51,#14,#45,#EB,#28,#4F
    DB #FF,#3C,#E4,#FE,#01,#9A,#4C,#ED,#F8,#FD,#CA,#F7,#F7,#90,#0B,#6D
    DB #C2,#C7,#FE,#9C,#C4,#DC,#06,#9A,#9C,#4F,#F2,#E4,#83,#45,#3B,#2F
    DB #65,#F4,#5F,#F0,#B9,#2B,#54,#91,#A2,#B6,#74,#1A,#61,#16,#8B,#77
    DB #75,#FB,#C5,#96,#47,#2B,#F1,#71,#6F,#B2,#BE,#EB,#9E,#F4,#CE,#F0
    DB #03,#3F,#7F,#F7,#B9,#4B,#B7,#1E,#10,#EE,#F2,#2A,#3F,#08,#F1,#C7
    DB #00,#E3,#F4,#58,#CC,#FC,#FB,#6D,#EE,#9C,#F5,#0C,#73,#D8,#78,#E7
    DB #82,#7F,#77,#BF,#74,#A8,#5E,#FB,#91,#0B,#1A,#B6,#57,#55,#72,#BA
    DB #A8,#54,#74,#DC,#8A,#AA,#14,#75,#C9,#12,#D2,#FF,#3C,#55,#FF,#FF
    DB #FB,#4A,#96,#FB,#06,#8A,#FF,#BC,#DE,#F0,#F7,#00,#E3,#E4,#72,#02
    DB #89,#55,#85,#F4,#4F,#FF,#A3,#14,#CD,#F3,#67,#EC,#F2,#57,#AA,#85
    DB #44,#66,#88,#77,#A1,#8D,#68,#66,#7A,#03,#B7,#41,#1E,#39,#35,#47
    DB #71,#CF,#34,#AB,#1B,#FC,#72,#EE,#4B,#7F,#51,#45,#55,#5F,#F5,#CD
    DB #0A,#A4,#03,#44,#EC,#F2,#D7,#00,#5F,#BC,#F5,#C8,#CB,#3C,#1E,#F3
    DB #7C,#5E,#BD,#74,#FB,#F6,#35,#FF,#6F,#B9,#7F,#56,#C2,#B6,#2C,#77
    DB #E7,#05,#99,#16,#81,#17,#DE,#C9,#C2,#3F,#1E,#B1,#B2,#1D,#A5,#9F
    DB #AA,#FB,#8D,#BB,#4F,#77,#3E,#7A,#F0,#CF,#76,#79,#6C,#CF,#55,#51
    DB #41,#00,#27,#A8,#FC,#08,#B7,#84,#00,#F3,#D9,#28,#3E,#27,#72,#DD
    DB #59,#F5,#69,#75,#F9,#4D,#7F,#FE,#FF,#00,#93,#9B,#7A,#1B,#E2,#92
    DB #1B,#15,#ED,#34,#A8,#8D,#1F,#93,#44,#74,#3D,#52,#B4,#84,#A7,#DB
    DB #F7,#28,#68,#9D,#5F,#FF,#62,#F5,#75,#57,#AD,#F5,#F4,#CA,#FF,#E9
    DB #F4,#1C,#3C,#FE,#37,#E2,#7F,#86,#73,#93,#69,#27,#0A,#5F,#40,#6E
    DB #00,#73,#EC,#7F,#7F,#5F,#DF,#28,#D3,#7A,#01,#00,#78,#16,#8A,#8B
    DB #B4,#DA,#37,#F1,#ED,#36,#3B,#1C,#54,#BE,#55,#15,#B7,#1A,#CF,#EC
    DB #5F,#7D,#EB,#AD,#F6,#51,#FF,#F4,#FF,#81,#0D,#C1,#F6,#53,#BD,#42
    DB #3D,#00,#7D,#E4,#D5,#CF,#BC,#70,#C2,#54,#31,#B1,#8A,#FF,#48,#7F
    DB #6B,#5B,#2B,#1F,#47,#EC,#32,#BA,#2D,#BB,#E2,#9F,#00,#AA,#45,#41
    DB #BC,#4B,#CE,#A8,#47,#FD,#1B,#64,#EA,#3D,#0C,#59,#FD,#27,#74,#15
    DB #74,#14,#41,#15,#53,#8F,#6E,#85,#77,#09,#67,#F5,#57,#F5,#CF,#FB
    DB #78,#F8,#1E,#FE,#5F,#10,#C2,#C0,#73,#6E,#B8,#55,#1C,#D7,#7C,#3C
    DB #7F,#E1,#39,#FE,#B6,#B1,#00,#AB,#8B,#A4,#5F,#1E,#B6,#01,#FB,#E7
    DB #3F,#EB,#B1,#D4,#8D,#00,#33,#74,#7D,#FB,#07,#2C,#58,#B8,#8E,#23
    DB #8E,#4F,#F4,#81,#93,#F4,#F2,#03,#FD,#2E,#36,#FC,#47,#CE,#81,#1F
    DB #90,#F3,#30,#73,#7B,#66,#AE,#F5,#F4,#A7,#5F,#CF,#8B,#34,#1B,#A6
    DB #88,#00,#9E,#6F,#F1,#13,#58,#48,#1B,#FF,#1B,#BA,#C1,#F1,#23,#1F
    DB #64,#DD,#90,#6B,#B6,#F1,#F3,#6D,#A5,#1B,#43,#F9,#2C,#CF,#F1,#7C
    DB #46,#DF,#77,#B1,#B6,#FC,#0E,#C1,#FE,#CF,#3E,#8F,#EC,#7D,#6F,#AE
    DB #68,#CB,#8A,#20,#F4,#C3,#50,#25,#E6,#51,#66,#16,#66,#66,#AA,#A1
    DB #E2,#0A,#46,#61,#61,#A1,#72,#6A,#BB,#EC,#80,#A3,#BA,#62,#9E,#8F
    DB #7E,#41,#53,#6A,#FD,#01,#97,#4B,#91,#FF,#16,#8C,#75,#67,#C0,#17
    DB #0A,#71,#C6,#00,#97,#14,#DF,#89,#B6,#5F,#EE,#F1,#84,#AA,#6A,#5F
    DB #EB,#77,#03,#45,#46,#02,#BF,#74,#F0,#FB,#44,#FC,#ED,#7A,#18,#69
    DB #11,#51,#C8,#DF,#67,#11,#1F,#46,#16,#A8,#B9,#33,#61,#00,#DF,#1D
    DB #84,#FC,#6E,#1B,#76,#AC,#97,#55,#7E,#01,#89,#FE,#0A,#11,#41,#EF
    DB #54,#3A,#C8,#C4,#DC,#6C,#D5,#D1,#71,#DF,#EC,#F3,#0D,#FD,#0D,#E2
    DB #CD,#CB,#5D,#01,#F5,#1B,#01,#98,#2A,#68,#4C,#1C,#E1,#BB,#FF,#71
    DB #1B,#A1,#68,#81,#1A,#9D,#90,#9D,#B0,#BF,#2E,#92,#32,#7A,#E7,#11
    DB #D8,#7C,#8C,#C4,#00,#F8,#FF,#BA,#38,#90,#86,#45,#15,#41,#1F,#75
    DB #4D,#3E,#71,#00,#A8,#74,#54,#8A,#44,#77,#2A,#81,#18,#AA,#C0,#D8
    DB #64,#EA,#FA,#1F,#85,#E1,#8A,#C1,#91,#71,#69,#8D,#F4,#DF,#CB,#C6
    DB #35,#7F,#F4,#E7,#4C,#07,#BB,#68,#C8,#FD,#D2,#00,#0E,#D1,#E7,#75
    DB #02,#5A,#A5,#4E,#0D,#0B,#0A,#74,#F9,#2C,#04,#DF,#77,#7D,#00,#DE
    DB #74,#AA,#54,#74,#35,#88,#88,#B3,#01,#AC,#5E,#2A,#1E,#A8,#B8,#EA
    DB #2D,#99,#A7,#03,#14,#46,#38,#7F,#EB,#F6,#FD,#00,#7F,#74,#F3,#DC
    DB #FE,#67,#0C,#E1,#B1,#08,#7F,#D0,#77,#BE,#FD,#B3,#29,#6B,#76,#8D
    DB #8D,#75,#51,#55,#75,#4A,#F1,#7F,#3E,#54,#D0,#55,#8B,#1C,#E5,#A7
    DB #00,#81,#66,#AE,#F2,#6A,#5C,#92,#18,#B6,#18,#88,#BB,#81,#DD,#F3
    DB #57,#B0,#D3,#BC,#7F,#D3,#97,#C2,#9F,#95,#87,#75,#42,#78,#3F,#C8
    DB #0B,#4A,#1C,#00,#5C,#9F,#92,#BC,#39,#8D,#BF,#54,#55,#FF,#01,#73
    DB #CE,#81,#07,#D0,#D2,#77,#A9,#55,#47,#E8,#E2,#1E,#B1,#68,#BF,#A8
    DB #BB,#BF,#14,#16,#B1,#89,#98,#1B,#63,#B8,#BA,#8A,#21,#1C,#C0,#AF
    DB #97,#96,#03,#DC,#A4,#FF,#F1,#EB,#6C,#82,#69,#F7,#55,#D3,#35,#34
    DB #00,#70,#B9,#14,#EC,#C4,#CB,#99,#15,#77,#A4,#63,#71,#CF,#06,#7D
    DB #40,#70,#EF,#89,#72,#29,#16,#68,#8A,#B8,#AA,#AB,#28,#BB,#FF,#BB
    DB #FB,#B8,#6B,#AD,#66,#A8,#1A,#5D,#E3,#52,#82,#4F,#AD,#09,#20,#DC
    DB #95,#FE,#BE,#1B,#D3,#25,#47,#F7,#EC,#4C,#30,#FA,#72,#01,#A9,#14
    DB #64,#78,#01,#27,#14,#5F,#F5,#14,#3F,#10,#EB,#75,#81,#8F,#FE,#E4
    DB #D1,#78,#F0,#2D,#A8,#8A,#B6,#6A,#81,#05,#E6,#AA,#FF,#BA,#16,#66
    DB #AA,#18,#1B,#61,#01,#B1,#61,#55,#72,#28,#E3,#9E,#4B,#98,#B7,#A8
    DB #1D,#6E,#9A,#04,#D0,#82,#80,#DE,#74,#43,#00,#7D,#FC,#5A,#66,#E2
    DB #AD,#5F,#55,#3F,#60,#E7,#7B,#89,#75,#4F,#55,#CF,#01,#58,#E2,#D9
    DB #00,#A3,#B8,#A8,#A8,#28,#FE,#18,#88,#B1,#1B,#B1,#6F,#BA,#8A,#86
    DB #86,#D7,#EE,#FF,#CF,#BE,#FC,#C1,#AE,#7F,#A4,#0A,#C5,#FF,#F1,#9A
    DB #E9,#42,#7F,#8F,#54,#5F,#85,#FE,#2D,#6B,#08,#FD,#93,#57,#F5,#E3
    DB #95,#69,#57,#F4,#06,#E4,#D6,#DC,#DB,#60,#E2,#00,#51,#51,#23,#A6
    DB #88,#D2,#FD,#83,#4A,#81,#A1,#B1,#BB,#8A,#88,#86,#A6,#83,#FF,#FF
    DB #BA,#F2,#7F,#F4,#00,#AC,#11,#4C,#6E,#D1,#8D,#F6,#03,#BC,#F8,#5F
    DB #00,#06,#A6,#16,#45,#E4,#44,#3A,#26,#2B,#45,#45,#74,#1A,#70,#7C
    DB #54,#75,#55,#FF,#C7,#4D,#3C,#67,#1A,#86,#8B,#1D,#15,#8C,#15,#AB
    DB #BB,#D3,#13,#E9,#53,#E5,#23,#01,#1A,#12,#40,#A3,#DB,#AB,#23,#02
    DB #08,#FE,#EB,#AD,#47,#B7,#80,#FB,#A8,#96,#11,#3B,#77,#77,#03,#73
    DB #8F,#08,#00,#06,#B0,#51,#B9,#5A,#E8,#A3,#15,#67,#72,#7B,#75,#8A
    DB #6C,#0D,#51,#B6,#4E,#FE,#C7,#46,#20,#E0,#1B,#88,#6B,#B6,#01,#B6
    DB #61,#11,#B8,#61,#A8,#C9,#53,#23,#A1,#BC,#BB,#1B,#B1,#18,#41,#F4
    DB #DC,#7A,#F6,#45,#1F,#EB,#15,#CC,#86,#8A,#FE,#45,#35,#B9,#02,#FE
    DB #07,#0F,#5E,#1F,#18,#6D,#F0,#A6,#03,#55,#F7,#51,#00,#9E,#F3,#41
    DB #B6,#A1,#23,#1E,#81,#61,#BB,#BF,#B1,#94,#61,#A2,#6A,#BA,#16,#A1
    DB #61,#EF,#FF,#3F,#04,#FF,#14,#10,#5F,#FA,#C4,#FB,#7D,#B1,#9F,#CE
    DB #FA,#04,#15,#A3,#41,#3B,#06,#86,#F3,#87,#75,#F1,#69,#73,#51,#C2
    DB #0A,#BF,#14,#FB,#F1,#52,#4E,#B2,#4A,#83,#68,#B6,#8B,#61,#62,#61
    DB #1F,#1F,#FF,#AA,#A8,#18,#68,#A2,#1A,#18,#1A,#BF,#FA,#1E,#FF,#D1
    DB #7C,#96,#9F,#FA,#91,#54,#82,#E0,#E7,#47,#00,#D6,#E7,#0C,#04,#DD
    DB #FA,#9C,#18,#14,#84,#1C,#E0,#C2,#93,#DE,#54,#EF,#FD,#D2,#14,#E6
    DB #FB,#4A,#71,#03,#2D,#12,#FF,#BA,#88,#92,#29,#FB,#B6,#A9,#1B,#FF
    DB #18,#81,#E4,#FD,#F1,#88,#FB,#FF,#FA,#AB,#FF,#A7,#49,#90,#36,#8E
    DB #FC,#71,#07,#7C,#76,#9C,#D0,#6C,#5A,#D1,#18,#D9,#EC,#73,#7A,#D3
    DB #05,#B1,#EC,#6F,#00,#03,#FE,#FA,#F1,#E1,#8D,#16,#39,#15,#C7,#0D
    DB #B8,#88,#8A,#11,#6B,#AB,#B8,#1B,#EB,#BB,#A1,#16,#EC,#98,#1C,#78
    DB #E9,#7B,#2E,#A1,#6A,#A1,#AA,#04,#1D,#70,#91,#F6,#00,#95,#CC,#74
    DB #F0,#DE,#EB,#3E,#C8,#FC,#06,#93,#61,#09,#8C,#BB,#55,#F0,#1B,#5A
    DB #C6,#05,#E8,#D3,#F8,#87,#46,#6B,#BA,#A6,#61,#3D,#24,#E3,#21,#23
    DB #6B,#18,#4D,#13,#64,#0D,#7C,#BA,#AB,#61,#81,#1B,#A8,#16,#BB,#EB
    DB #B8,#8B,#AA,#A6,#3D,#21,#00,#DA,#FD,#77,#DF,#87,#EE,#C3,#12,#D7
    DB #E0,#E0,#02,#4C,#DD,#11,#45,#8B,#B3,#81,#45,#BB,#15,#E6,#1C,#3F
    DB #D6,#09,#F6,#11,#5F,#06,#E8,#F0,#C2,#1F,#FB,#13,#E7,#CA,#B0,#66
    DB #A3,#61,#AB,#F1,#2C,#1B,#59,#EF,#B5,#F1,#AB,#B1,#3B,#F8,#12,#77
    DB #D3,#CB,#17,#1A,#30,#DF,#01,#F8,#F5,#87,#8D,#F2,#F7,#8B,#F2,#D2
    DB #00,#40,#B0,#81,#26,#E2,#A6,#46,#16,#D5,#55,#4C,#6A,#06,#54,#7A
    DB #F4,#73,#6B,#AA,#A8,#C3,#9C,#02,#F1,#14,#68,#F8,#1F,#A1,#E2,#1B
    DB #11,#FF,#BF,#B6,#1F,#BB,#F9,#EF,#E9,#05,#CA,#C3,#3D,#02,#63,#88
    DB #D7,#A1,#21,#BB,#8A,#0A,#0D,#62,#D7,#04,#5D,#55,#56
SCREEN5_PRESENTATION_BITMAP_CHUNK_3_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 3, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_3:
    ; ZX0 compressed tile_pattern (4096 -> 1532 bytes)
    DB #81,#11,#2F,#61,#E4,#64,#86,#14,#65,#45,#55,#55,#51,#1A,#55,#E5
    DB #55,#55,#44,#A6,#51,#45,#41,#6A,#9E,#B8,#66,#16,#A6,#6A,#81,#AA
    DB #66,#1B,#A2,#1A,#1C,#1B,#81,#2A,#AB,#A1,#1A,#1B,#1A,#B1,#AB,#61
    DB #B6,#1B,#A1,#1C,#B1,#11,#44,#44,#44,#54,#54,#23,#45,#44,#BB,#96
    DB #8F,#54,#BE,#EA,#A5,#FF,#6A,#14,#47,#41,#11,#04,#63,#16,#81,#73
    DB #FC,#E3,#89,#9C,#BF,#F7,#85,#7B,#6D,#A1,#FE,#F2,#11,#1E,#BA,#86
    DB #61,#B2,#AE,#A6,#68,#04,#96,#16,#66,#66,#1B,#18,#1B,#61,#A9,#61
    DB #2A,#11,#16,#B1,#1B,#B1,#18,#A1,#3A,#FC,#B7,#74,#FD,#FF,#9D,#F1
    DB #96,#B8,#ED,#44,#64,#FB,#F4,#41,#84,#00,#2B,#A1,#BA,#4B,#86,#EC
    DB #AF,#54,#44,#9E,#BB,#71,#6D,#54,#A2,#68,#57,#75,#9E,#51,#AF,#66
    DB #B4,#0B,#B6,#DB,#0B,#EA,#7F,#F7,#F4,#BA,#F9,#B1,#9A,#DA,#C1,#06
    DB #6D,#11,#2A,#15,#FF,#FE,#A1,#11,#FB,#06,#9B,#15,#F8,#F4,#03,#87
    DB #15,#51,#90,#FE,#2D,#8A,#E2,#00,#71,#55,#7B,#88,#2D,#74,#E8,#83
    DB #72,#ED,#1F,#A8,#2D,#81,#E7,#29,#00,#EA,#15,#F1,#18,#67,#68,#88
    DB #66,#7D,#13,#90,#8F,#1B,#A4,#07,#E8,#0C,#57,#E8,#00,#9F,#54,#15
    DB #0D,#CB,#74,#14,#90,#04,#3E,#4C,#38,#44,#8E,#E6,#3C,#6F,#89,#68
    DB #23,#51,#AA,#1A,#A6,#66,#81,#CD,#00,#ED,#04,#81,#6A,#FE,#66,#D3
    DB #8C,#7E,#F8,#CC,#14,#21,#FE,#16,#FD,#F7,#98,#54,#AD,#41,#14,#57
    DB #61,#64,#E5,#FE,#0B,#61,#78,#19,#8E,#D8,#00,#CE,#58,#75,#C8,#14
    DB #AA,#DF,#02,#FF,#6C,#12,#D7,#E5,#B2,#8B,#61,#18,#E8,#DE,#16,#DA
    DB #FD,#16,#74,#B5,#10,#FE,#9E,#FD,#F0,#36,#86,#EE,#13,#54,#70,#79
    DB #00,#13,#E3,#5A,#44,#84,#FB,#F3,#90,#14,#EE,#02,#14,#00,#82,#11
    DB #51,#88,#16,#A5,#16,#9D,#18,#61,#AA,#B1,#E5,#18,#D9,#E1,#98,#29
    DB #66,#DF,#A6,#67,#0C,#9D,#FE,#A2,#10,#55,#75,#1C,#91,#02,#2F,#81
    DB #F2,#0F,#5A,#B7,#71,#E5,#B8,#5C,#1D,#CD,#A6,#61,#FE,#C2,#1B,#CA
    DB #AA,#0C,#D5,#8A,#CF,#E1,#18,#7D,#E0,#26,#ED,#81,#61,#41,#AF,#61
    DB #14,#E9,#03,#45,#74,#9F,#0C,#F2,#C9,#04,#52,#D6,#16,#EC,#4A,#45
    DB #75,#B5,#FE,#BF,#01,#A8,#04,#D9,#39,#FE,#BE,#86,#F4,#AF,#18,#66
    DB #E0,#2E,#88,#FF,#4C,#16,#64,#11,#6A,#C6,#64,#8A,#FE,#44,#28,#44
    DB #F8,#78,#87,#47,#54,#E1,#7B,#10,#1C,#FF,#51,#F6,#00,#F8,#FA,#F8
    DB #18,#81,#45,#86,#D7,#FE,#9B,#1B,#AA,#AA,#68,#CD,#88,#75,#AD,#2B
    DB #88,#22,#0D,#1A,#AA,#FD,#F7,#F1,#22,#0A,#E3,#68,#01,#86,#88,#6B
    DB #36,#A4,#9C,#00,#33,#02,#2F,#86,#FB,#9F,#4C,#00,#01,#98,#14,#41
    DB #16,#FF,#FD,#02,#F6,#4F,#F9,#2D,#A3,#A6,#68,#86,#5D,#D4,#F8,#B1
    DB #11,#D0,#16,#A8,#F3,#F2,#FE,#6B,#A8,#F5,#86,#BD,#FE,#19,#58,#F6
    DB #CF,#9F,#00,#98,#51,#54,#55,#50,#E7,#04,#9D,#5E,#0D,#EE,#DE,#00
    DB #A2,#44,#48,#41,#2C,#A8,#3D,#1D,#B2,#A1,#86,#8B,#16,#86,#4D,#DC
    DB #8A,#6A,#8A,#EA,#81,#E5,#1B,#C3,#45,#A2,#34,#E1,#F7,#0E,#B3,#41
    DB #FA,#00,#DF,#11,#00,#F7,#84,#7D,#FC,#7D,#1D,#03,#D7,#1B,#DC,#3A
    DB #0B,#86,#E0,#09,#CF,#1A,#A1,#61,#88,#F7,#00,#26,#1B,#88,#A8,#A9
    DB #66,#86,#16,#6A,#15,#9E,#45,#14,#23,#17,#51,#59,#02,#07,#E7,#17
    DB #F4,#EB,#5A,#1A,#D8,#4B,#80,#73,#FE,#B5,#88,#FA,#3B,#DA,#68,#4B
    DB #A8,#53,#05,#5A,#FA,#B3,#66,#02,#73,#E8,#B5,#81,#C5,#C3,#B1,#84
    DB #FD,#10,#A5,#1F,#F0,#25,#0C,#5F,#0D,#37,#FA,#8A,#00,#81,#0A,#14
    DB #1B,#14,#92,#F3,#46,#16,#A6,#A6,#86,#61,#FC,#37,#00,#F0,#07,#D7
    DB #AA,#6C,#ED,#6A,#7C,#FD,#91,#C7,#FF,#1B,#BD,#02,#99,#6F,#02,#FE
    DB #14,#C3,#53,#09,#5C,#DD,#4A,#CE,#7E,#58,#41,#A1,#16,#8A,#8B,#A8
    DB #86,#0C,#4F,#F0,#5E,#DD,#04,#69,#14,#C2,#A0,#75,#68,#BC,#ED,#A1
    DB #B1,#0A,#D2,#01,#0C,#F9,#F9,#FE,#56,#D3,#88,#7B,#9B,#F0,#66,#F3
    DB #6B,#FF,#1F,#FA,#65,#0A,#14,#D7,#00,#E7,#57,#6B,#81,#6A,#4F,#FF
    DB #FF,#36,#BA,#D5,#1B,#62,#1F,#AA,#1A,#BB,#16,#E0,#F6,#2E,#9E,#75
    DB #6B,#BC,#AA,#E3,#E3,#FE,#33,#04,#F6,#C8,#EE,#40,#FC,#7B,#00,#A2
    DB #86,#D7,#66,#67,#1F,#ED,#45,#77,#04,#75,#F7,#6C,#FF,#AA,#0B,#14
    DB #0D,#C4,#D3,#03,#4D,#1F,#53,#1F,#55,#B5,#06,#FC,#C2,#00,#A8,#B8
    DB #AA,#A6,#66,#1B,#8D,#21,#3C,#9E,#77,#88,#C9,#85,#FE,#13,#FC,#51
    DB #5E,#6B,#6A,#18,#4F,#67,#F9,#0C,#E8,#FE,#FF,#65,#58,#ED,#01,#A1
    DB #D4,#3D,#FE,#DC,#AC,#22,#BA,#1A,#28,#BB,#BA,#E1,#BB,#17,#00,#87
    DB #81,#AB,#68,#BB,#81,#9F,#13,#B1,#CA,#14,#A2,#DF,#F6,#CA,#00,#41
    DB #05,#37,#4A,#E6,#00,#AD,#68,#86,#BB,#EA,#00,#60,#78,#F9,#5B,#75
    DB #FD,#BA,#AA,#6A,#D1,#C9,#29,#25,#61,#A7,#B6,#55,#AB,#10,#8B,#51
    DB #F3,#13,#00,#AD,#89,#6A,#7A,#9D,#E7,#1B,#34,#3D,#A0,#F4,#F6,#C5
    DB #04,#3D,#FD,#6F,#FE,#FB,#7C,#2A,#73,#34,#3B,#7B,#61,#46,#47,#20
    DB #B3,#66,#FD,#BC,#DA,#35,#EC,#0B,#CA,#6B,#FB,#61,#28,#85,#AC,#08
    DB #92,#16,#6C,#32,#6B,#A1,#FE,#28,#41,#F0,#06,#4D,#0D,#1B,#D2,#3D
    DB #69,#9A,#18,#8A,#F5,#23,#77,#DA,#5E,#5E,#D8,#4A,#F7,#37,#AB,#86
    DB #BA,#88,#C2,#C4,#A8,#B9,#1A,#A2,#6A,#66,#1E,#F1,#39,#FD,#F2,#EB
    DB #A1,#48,#86,#B1,#14,#CF,#BB,#B3,#C9,#1C,#FA,#FC,#ED,#00,#16,#8C
    DB #A6,#DF,#0F,#2B,#01,#5C,#F7,#3E,#01,#EF,#02,#72,#5E,#63,#1A,#6B
    DB #D5,#DB,#27,#F8,#B2,#39,#81,#AF,#A2,#6A,#B6,#14,#D2,#00,#3D,#2C
    DB #B3,#66,#00,#EB,#79,#BA,#07,#9C,#C9,#04,#A4,#41,#02,#8F,#1A,#56
    DB #E2,#01,#A6,#B8,#6E,#81,#76,#72,#5E,#3D,#01,#34,#19,#D7,#01,#D1
    DB #57,#FA,#8D,#AA,#8A,#5E,#C8,#BE,#61,#FB,#FE,#D8,#86,#75,#F5,#D2
    DB #A9,#FC,#B1,#D0,#83,#8A,#25,#FE,#5F,#7B,#FD,#09,#F5,#F9,#AC,#02
    DB #68,#CD,#50,#D7,#3F,#62,#CA,#4A,#3D,#AB,#B8,#CF,#5B,#D2,#59,#00
    DB #FB,#B7,#45,#61,#7F,#F6,#C9,#CC,#B0,#CD,#DB,#D1,#8E,#78,#C2,#3D
    DB #C5,#31,#02,#0A,#81,#0A,#68,#EB,#FE,#18,#BC,#2A,#E5,#7A,#00,#14
    DB #DF,#6E,#BB,#FD,#A1,#4D,#88,#4D,#13,#62,#FA,#B7,#A6,#10,#FE,#EF
    DB #03,#2E,#5D,#53,#C4,#22,#A1,#68,#CB,#9A,#71,#FE,#4F,#5B,#E7,#05
    DB #FE,#51,#F3,#FE,#FA,#7A,#F8,#F5,#54,#4F,#EC,#FB,#D5,#66,#B7,#02
    DB #FC,#DE,#38,#E0,#86,#38,#28,#14,#38,#B3,#C3,#A8,#B1,#02,#15,#C5
    DB #EA,#6E,#8B,#ED,#8A,#FD,#BA,#72,#FF,#EC,#E1,#00,#D2,#FC,#F5,#CB
    DB #3C,#FD,#DD,#71,#3F,#1D,#03,#E2,#34,#8A,#A6,#F3,#20,#CF,#2A,#E9
    DB #F7,#DC,#FE,#82,#AB,#AA,#AB,#14,#17,#D0,#83,#85,#00,#7C,#55,#38
    DB #00,#BA,#8A,#AA,#01,#FB,#89,#81,#88,#7E,#3A,#FA,#14,#00,#66,#D5
    DB #69,#C4,#AD,#BA,#6B,#BB,#B1,#37,#12,#F8,#36,#2C,#23,#1B,#AB,#D8
    DB #C1,#FE,#8A,#A1,#6A,#BF,#B6,#13,#99,#9C,#BA,#85,#EA,#7D,#21,#8C
    DB #00,#3D,#09,#03,#69,#FD,#BB,#9B,#B8,#86,#18,#64,#FC,#B9,#41,#CF
    DB #7B,#8A,#18,#1B,#1B,#B6,#8B,#8B,#05,#66,#D0,#FD,#FE,#A2,#FD,#7C
    DB #49,#B9,#B8,#66,#AB,#E0,#DD,#83,#43,#A3,#C1,#A1,#A7,#8F,#41,#24
    DB #0C,#1D,#D2,#83,#7C,#34,#DB,#85,#02,#E8,#07,#01,#1A,#D6,#52,#0B
    DB #41,#B2,#FC,#FF,#30,#18,#1A,#29,#3C,#C5,#BB,#BB,#FF,#3D,#0A,#07
    DB #04,#FB,#F5,#92,#53,#FC,#71,#ED,#05,#D9,#8A,#33,#9A,#5C,#B1,#BF
    DB #EB,#14,#06,#90,#02,#30,#7A,#0E,#A8,#6D,#61,#0F,#F8,#0F,#00,#17
    DB #23,#F5,#F3,#31,#A5,#81,#84,#FD,#63,#01,#19,#02,#9E,#16,#F8,#FF
    DB #08,#F1,#A7,#F8,#A6,#BF,#93,#66,#64,#1F,#A2,#03,#BB,#27,#9E,#45
    DB #E3,#A2,#6A,#A1,#16,#F2,#1A,#41,#04,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_4_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 4, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_4:
    ; ZX0 compressed tile_pattern (4096 -> 1906 bytes)
    DB #94,#11,#BE,#18,#F8,#A2,#88,#16,#88,#91,#B9,#18,#81,#68,#68,#88
    DB #A6,#BA,#88,#8A,#88,#88,#66,#61,#B8,#6E,#44,#FD,#78,#41,#16,#61
    DB #9B,#4A,#BA,#BB,#BB,#F8,#81,#18,#B6,#1B,#BB,#B1,#2F,#66,#6A,#BC
    DB #A1,#14,#9B,#B6,#1A,#A6,#E6,#C3,#FE,#4B,#1B,#AA,#86,#6A,#64,#44
    DB #BF,#9B,#41,#C2,#F5,#F7,#FE,#7F,#01,#FE,#EE,#00,#FE,#60,#BA,#AB
    DB #BA,#8B,#A8,#06,#24,#88,#14,#E3,#7E,#A7,#62,#41,#BB,#86,#E7,#3C
    DB #BA,#B8,#B6,#8A,#F3,#BB,#1A,#E4,#61,#FF,#E2,#1A,#88,#6B,#A6,#AA
    DB #B1,#86,#6F,#68,#68,#81,#00,#64,#BF,#11,#1A,#8A,#66,#61,#14,#9A
    DB #F8,#86,#FC,#56,#BE,#16,#04,#76,#8A,#A8,#8A,#05,#F6,#B8,#F1,#37
    DB #FE,#86,#08,#D2,#EB,#76,#41,#E3,#64,#1B,#A8,#E0,#00,#F6,#1B,#B1
    DB #81,#9B,#C7,#28,#B8,#6B,#83,#28,#8A,#BB,#FB,#FB,#96,#AA,#A1,#E1
    DB #66,#6A,#8D,#86,#A6,#ED,#FF,#04,#E5,#7F,#FE,#4B,#88,#62,#11,#8B
    DB #FA,#E3,#53,#AA,#81,#BB,#00,#37,#46,#CA,#0B,#7B,#14,#7E,#FD,#67
    DB #3E,#1A,#B8,#D9,#38,#64,#D6,#6B,#6A,#AB,#A1,#1A,#61,#A1,#18,#BF
    DB #B8,#BB,#F1,#BB,#F3,#00,#67,#04,#76,#E8,#CD,#86,#E1,#E4,#99,#0A
    DB #5B,#18,#DA,#7F,#01,#16,#6D,#FF,#9D,#F9,#FF,#BA,#A8,#3E,#E8,#D9
    DB #DF,#44,#0C,#D8,#F1,#04,#8E,#BB,#A8,#02,#DE,#53,#3C,#86,#68,#6B
    DB #FF,#B8,#6F,#CA,#BB,#BB,#9A,#88,#6A,#1B,#FD,#6A,#95,#DB,#75,#2E
    DB #8F,#66,#AB,#C3,#2E,#FC,#00,#15,#A7,#88,#F8,#4D,#4F,#F5,#E6,#8A
    DB #AB,#01,#A8,#BF,#FA,#DB,#81,#6A,#1F,#E9,#5D,#2E,#78,#F6,#AF,#44
    DB #F1,#87,#03,#66,#68,#86,#86,#66,#E5,#3E,#A1,#61,#6B,#BA,#AF,#B9
    DB #F8,#FF,#88,#66,#16,#16,#81,#1A,#81,#61,#86,#63,#A1,#81,#C6,#C7
    DB #98,#EA,#00,#14,#A0,#41,#13,#DE,#F4,#01,#A7,#BF,#FB,#BB,#8F,#6B
    DB #00,#8A,#6B,#81,#84,#AB,#0D,#41,#88,#BD,#F6,#77,#2F,#21,#A6,#07
    DB #AF,#1D,#61,#00,#8A,#6A,#81,#78,#B8,#A1,#B8,#5A,#28,#81,#16,#AC
    DB #68,#16,#7F,#FB,#8C,#E0,#F7,#00,#4A,#6A,#19,#26,#68,#88,#18,#8B
    DB #88,#AF,#7D,#AB,#AA,#8A,#EF,#B6,#E4,#7D,#C7,#46,#0E,#CE,#48,#DB
    DB #1A,#03,#A8,#B5,#02,#9E,#34,#01,#49,#AB,#A6,#B1,#A6,#81,#A1,#69
    DB #14,#5C,#8D,#12,#CE,#83,#C3,#03,#B9,#44,#E4,#DD,#F8,#4A,#88,#6A
    DB #16,#7C,#18,#AB,#68,#15,#BB,#FF,#BA,#FA,#1A,#F3,#B8,#E0,#8B,#E7
    DB #66,#14,#46,#44,#00,#D4,#03,#BE,#DC,#FF,#B6,#FA,#00,#16,#82,#A6
    DB #61,#16,#61,#F7,#02,#80,#00,#FF,#26,#BF,#4C,#A5,#6C,#8E,#21,#F6
    DB #0F,#A7,#66,#F8,#32,#8B,#A6,#FB,#A2,#88,#B6,#BB,#27,#B8,#8B,#F8
    DB #63,#7F,#18,#84,#2B,#7C,#48,#56,#70,#2D,#1B,#5C,#31,#88,#FF,#18
    DB #16,#CC,#1C,#98,#1B,#81,#16,#4C,#76,#B7,#FE,#17,#6B,#B7,#81,#47
    DB #94,#DD,#08,#C7,#E6,#53,#1D,#69,#EF,#61,#04,#33,#52,#01,#34,#BB
    DB #BF,#AE,#FB,#8A,#E9,#FC,#68,#00,#A2,#7B,#54,#C7,#16,#09,#1D,#DD
    DB #F7,#05,#02,#68,#43,#1B,#C2,#32,#3A,#03,#61,#04,#FD,#16,#B3,#14
    DB #FF,#CF,#01,#01,#C6,#7F,#F1,#EB,#D1,#00,#A6,#86,#C2,#8B,#0B,#DD
    DB #BF,#03,#2F,#F8,#05,#2B,#1C,#64,#6A,#05,#14,#BD,#16,#FF,#B5,#22
    DB #2C,#08,#75,#30,#DB,#E1,#A6,#6F,#D8,#D6,#5C,#3B,#9E,#DD,#F8,#A7
    DB #00,#8C,#16,#14,#BD,#FA,#D0,#BC,#44,#04,#4E,#01,#AE,#8A,#18,#18
    DB #D6,#0B,#3E,#8F,#FF,#FF,#01,#48,#68,#81,#8A,#AA,#81,#14,#F4,#7F
    DB #EF,#F1,#00,#0B,#A5,#2D,#81,#7B,#3F,#6A,#73,#99,#F1,#4D,#02,#7D
    DB #A3,#73,#FE,#33,#CB,#FF,#E5,#EF,#12,#CD,#FE,#0D,#2D,#1D,#68,#1D
    DB #0F,#1A,#02,#F8,#6B,#00,#70,#F8,#8B,#86,#6B,#FA,#EC,#E3,#66,#2B
    DB #00,#84,#B7,#00,#5F,#D7,#74,#C8,#43,#03,#BE,#AA,#68,#F3,#00,#5F
    DB #C7,#F3,#9A,#2A,#30,#88,#FF,#61,#11,#7E,#E5,#D4,#E5,#06,#3C,#D3
    DB #DA,#FA,#86,#32,#12,#B1,#B8,#DE,#05,#00,#DB,#AA,#ED,#FB,#4B,#1D
    DB #81,#AE,#03,#64,#01,#9A,#14,#81,#05,#C4,#C5,#17,#B7,#30,#00,#1F
    DB #E6,#ED,#00,#8C,#FC,#7F,#A2,#13,#03,#F0,#30,#C1,#F0,#E7,#A8,#B3
    DB #A4,#1B,#B2,#12,#FB,#ED,#AB,#00,#1B,#FF,#6A,#42,#36,#DE,#E5,#06
    DB #CF,#5E,#7C,#6B,#25,#1C,#42,#C6,#DC,#F0,#AB,#E9,#3E,#11,#ED,#A3
    DB #86,#F3,#37,#4B,#FE,#4E,#B6,#E3,#96,#DF,#C1,#10,#7F,#0C,#3D,#21
    DB #FE,#33,#B4,#34,#AE,#A5,#46,#5A,#B0,#88,#BD,#9E,#07,#0B,#35,#BB
    DB #F8,#59,#00,#68,#BB,#BA,#68,#FB,#A8,#63,#AA,#86,#48,#46,#86,#C2
    DB #57,#22,#C8,#FE,#F8,#E9,#00,#CD,#FC,#B5,#8A,#3C,#D7,#00,#F9,#CD
    DB #F4,#30,#FE,#94,#EC,#F3,#81,#9E,#9C,#D2,#D7,#FE,#3F,#B6,#AB,#83
    DB #EC,#1B,#43,#1A,#22,#05,#BF,#FA,#2D,#B6,#79,#FE,#6A,#BB,#A6,#A8
    DB #AA,#88,#66,#8A,#16,#7D,#C5,#B3,#28,#FB,#EF,#B2,#44,#FE,#C7,#18
    DB #3A,#9D,#66,#AC,#6A,#B6,#CC,#0C,#0F,#17,#60,#FE,#C0,#FF,#04,#CC
    DB #F4,#9C,#95,#0E,#FC,#A9,#00,#FE,#C2,#01,#66,#AA,#18,#A8,#A8,#8B
    DB #FA,#29,#FF,#D5,#D3,#17,#43,#37,#D7,#80,#C1,#F3,#2D,#01,#1C,#CB
    DB #76,#F4,#60,#F8,#51,#FF,#E0,#EE,#99,#A6,#00,#0D,#93,#3C,#DC,#55
    DB #B0,#CF,#12,#7E,#D7,#F9,#02,#52,#8C,#14,#7C,#CA,#4A,#FE,#A6,#81
    DB #C8,#81,#66,#66,#AB,#B8,#6A,#38,#FE,#8D,#F6,#8A,#1D,#F1,#47,#F6
    DB #97,#64,#14,#64,#11,#1F,#BF,#B1,#60,#39,#83,#B8,#B1,#1B,#B1,#E7
    DB #9B,#13,#64,#41,#61,#55,#8A,#2E,#6A,#71,#D3,#FE,#67,#B0,#9F,#00
    DB #A3,#43,#FE,#D3,#FC,#D0,#84,#FE,#D3,#C8,#36,#08,#6D,#A1,#13,#FE
    DB #C7,#01,#9C,#19,#A8,#B8,#AB,#AE,#05,#FB,#F9,#BD,#FA,#F7,#30,#E5
    DB #EA,#47,#83,#A4,#C1,#1B,#B0,#DC,#83,#2B,#A1,#AA,#19,#81,#50,#CF
    DB #56,#1D,#CA,#00,#B8,#D4,#8E,#FE,#4C,#43,#FD,#20,#F9,#9E,#EC,#00
    DB #17,#7D,#B6,#E3,#62,#48,#81,#AA,#00,#41,#0A,#B8,#16,#88,#BA,#60
    DB #BB,#BA,#AA,#A2,#BA,#AC,#BA,#BF,#2C,#FE,#B8,#7B,#44,#01,#29,#41
    DB #AA,#B1,#6B,#AE,#BB,#18,#81,#A1,#4E,#36,#54,#BC,#16,#00,#A3,#16
    DB #F9,#FF,#F3,#00,#0D,#4F,#F2,#FD,#F4,#EB,#09,#0A,#1E,#C5,#BF,#45
    DB #BE,#B7,#67,#84,#CA,#DF,#01,#FD,#07,#07,#75,#1B,#7D,#02,#D0,#07
    DB #9C,#F6,#D0,#01,#F5,#F3,#27,#92,#B9,#B6,#AB,#B1,#AB,#16,#6B,#30
    DB #2F,#C1,#64,#5E,#F0,#DB,#71,#CD,#B4,#DE,#5E,#12,#91,#B6,#FF,#71
    DB #52,#FB,#F4,#14,#E3,#F1,#F2,#8B,#00,#15,#9F,#CC,#F7,#75,#00,#FC
    DB #64,#1F,#3A,#41,#8A,#7C,#8A,#D2,#01,#F7,#B6,#01,#0D,#DF,#0D,#F6
    DB #0D,#01,#AC,#DE,#84,#E5,#C5,#01,#A2,#6B,#1B,#61,#AA,#A6,#B8,#61
    DB #1B,#A1,#0C,#FD,#48,#00,#D4,#7D,#02,#37,#10,#17,#38,#77,#0E,#E3
    DB #4E,#DD,#3E,#A9,#FE,#41,#EC,#D2,#D2,#FC,#FC,#45,#04,#A2,#FF,#48
    DB #FB,#6A,#03,#06,#93,#1F,#8F,#B6,#BB,#AB,#FA,#68,#08,#FE,#88,#BF
    DB #FB,#E7,#D9,#84,#4B,#A4,#D1,#87,#6C,#34,#1A,#03,#B8,#C9,#FF,#AA
    DB #A1,#14,#75,#55,#3B,#45,#54,#5B,#4A,#4F,#11,#0A,#C3,#C3,#9C,#12
    DB #82,#FE,#DA,#47,#26,#E7,#41,#0C,#FF,#E7,#AD,#F4,#13,#D4,#7B,#26
    DB #1D,#00,#3A,#03,#75,#2B,#84,#F8,#4F,#05,#01,#6B,#AB,#BA,#AF,#B8
    DB #AA,#FA,#1D,#15,#75,#FB,#C6,#0B,#F8,#33,#ED,#9C,#01,#86,#4A,#84
    DB #A2,#6D,#18,#FF,#B1,#FD,#29,#23,#5F,#99,#9B,#EB,#39,#46,#4C,#A7
    DB #01,#16,#CC,#DD,#1C,#F6,#7F,#44,#3E,#C3,#09,#DB,#47,#C2,#B2,#B9
    DB #74,#AE,#38,#18,#A4,#44,#CF,#34,#75,#FE,#88,#75,#54,#D1,#AB,#3D
    DB #16,#86,#6B,#36,#BA,#7C,#FD,#0D,#B3,#0C,#01,#EA,#FD,#00,#6A,#2D
    DB #FA,#5A,#E0,#EF,#64,#91,#64,#77,#6D,#2C,#C8,#72,#72,#55,#54,#55
    DB #55,#45,#F6,#B5,#1B,#7F,#C9,#D8,#37,#02,#11,#98,#EF,#B5,#71,#71
    DB #FC,#63,#21,#82,#0B,#54,#45,#45,#54,#1F,#F1,#B2,#F6,#C0,#7F,#CF
    DB #F0,#F1,#02,#FB,#65,#B0,#7B,#FE,#41,#DB,#01,#7D,#8B,#DD,#07,#07
    DB #3B,#06,#AA,#58,#02,#B1,#AF,#A6,#FE,#8B,#BF,#B8,#A2,#64,#71,#77
    DB #71,#B6,#83,#98,#FA,#00,#3E,#7F,#15,#51,#BA,#23,#68,#A1,#B8,#86
    DB #BB,#B1,#6B,#11,#74,#BA,#1E,#01,#45,#DB,#C8,#E8,#B9,#FF,#44,#78
    DB #F2,#DF,#2E,#75,#41,#81,#00,#CF,#65,#C3,#B7,#DA,#F5,#35,#87,#2D
    DB #2C,#35,#29,#DF,#1D,#0D,#0C,#AE,#BA,#FE,#78,#01,#B4,#AF,#FF,#B5
    DB #FD,#A6,#A9,#8E,#B1,#2E,#51,#09,#38,#75,#57,#F9,#AA,#54,#75,#15
    DB #B0,#AA,#62,#5A,#20,#6A,#61,#CE,#8B,#79,#35,#14,#55,#A3,#0F,#55
    DB #78,#BC,#BB,#45,#75,#0C,#57,#04,#77,#0C,#C5,#8F,#36,#00,#4E,#DE
    DB #F5,#CB,#8E,#B6,#01,#A2,#88,#8A,#AA,#73,#FD,#F8,#10,#00,#29,#8B
    DB #82,#81,#B8,#84,#14,#03,#AB,#04,#77,#B5,#FB,#77,#F7,#3B,#37,#E9
    DB #9D,#33,#51,#45,#1B,#62,#CE,#A0,#BB,#8B,#AA,#B6,#81,#15,#51,#BE
    DB #12,#F5,#F1,#BF,#45,#EB,#40,#D3,#E2,#DF,#F2,#53,#FA,#C4,#81,#F0
    DB #DF,#D0,#AB,#F6,#16,#4C,#FF,#2B,#0A,#8B,#EA,#01,#04,#B8,#02,#C3
    DB #F9,#F6,#A8,#A8,#B3,#B8,#8A,#FD,#7F,#7C,#00,#8A,#1C,#57,#6F,#55
    DB #F5,#44,#03,#7E,#FD,#34,#E6,#54,#33,#5C,#BB,#6C,#C4,#2D,#D4,#19
    DB #C3,#CD,#16,#B1,#66,#DB,#E2,#0B,#D2,#1D,#54,#15,#45,#47,#75,#22
    DB #18,#8F,#15,#00,#A3,#41,#56,#DC,#77,#00,#5E,#B6,#2B,#18,#6B,#06
    DB #B8,#AC,#01,#BA,#FD,#0C,#00,#89,#6A,#A8,#A9,#B6,#B4,#BB,#8B,#F8
    DB #F5,#39,#B9,#58,#04,#82,#17,#74,#F7,#55,#24,#F6,#1F,#FF,#74,#57
    DB #F7,#75,#EF,#35,#8D,#55,#0B,#9E,#B2,#FE,#01,#C0,#61,#BA,#AD,#15
    DB #07,#E1,#F2,#FE,#37,#41,#51,#40,#34,#26,#3A,#E7,#44,#FE,#DD,#10
    DB #55,#56
SCREEN5_PRESENTATION_BITMAP_CHUNK_5_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 5, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_5:
    ; ZX0 compressed tile_pattern (4096 -> 1817 bytes)
    DB #B9,#11,#FC,#6A,#41,#1A,#16,#81,#88,#AB,#A8,#2A,#FF,#8F,#FB,#9E
    DB #F9,#99,#BF,#F9,#29,#88,#89,#5E,#F6,#A6,#6A,#A8,#FF,#FB,#AB,#BF
    DB #FB,#8A,#A8,#81,#66,#11,#18,#A0,#62,#17,#C1,#98,#41,#14,#66,#93
    DB #EC,#77,#FF,#77,#57,#55,#81,#FD,#2A,#75,#44,#51,#BB,#AA,#AA,#B6
    DB #BB,#6A,#88,#11,#66,#14,#11,#15,#55,#55,#14,#54,#F9,#FE,#BF,#44
    DB #41,#11,#DF,#FE,#8B,#14,#44,#EF,#E7,#F4,#FE,#FF,#F5,#DC,#C2,#F8
    DB #9E,#16,#44,#83,#88,#88,#8A,#88,#D8,#11,#FD,#EA,#FF,#F8,#13,#AF
    DB #78,#88,#66,#A8,#01,#B7,#8A,#61,#F5,#8D,#D9,#FB,#6B,#BB,#CB,#81
    DB #BD,#61,#FA,#B4,#FF,#66,#E8,#6B,#86,#87,#47,#FF,#F7,#47,#77,#6E
    DB #FD,#74,#2F,#0F,#51,#A1,#BA,#AB,#FB,#F8,#CB,#C4,#FF,#54,#45,#0A
    DB #02,#89,#51,#45,#F7,#15,#FE,#7D,#13,#FF,#FB,#F3,#F0,#80,#FE,#F3
    DB #52,#87,#01,#BB,#B8,#AB,#FB,#8F,#69,#0C,#76,#68,#BA,#8F,#F9,#AA
    DB #61,#86,#EC,#9E,#86,#18,#1B,#DF,#02,#FF,#B8,#AF,#BB,#88,#61,#11
    DB #BB,#F3,#F9,#9C,#A9,#61,#AA,#E1,#14,#6D,#45,#7A,#1F,#F5,#77,#01
    DB #45,#83,#45,#75,#57,#81,#63,#9F,#61,#B8,#29,#C7,#81,#B8,#75,#00
    DB #FA,#52,#14,#6E,#D4,#A4,#C9,#FA,#EF,#02,#01,#3F,#F4,#FE,#02,#01
    DB #E9,#8A,#68,#B8,#8B,#F8,#8B,#FF,#BB,#FB,#86,#B1,#8A,#A8,#6F,#6A
    DB #68,#1B,#00,#22,#F9,#88,#81,#86,#A8,#8B,#2E,#BF,#BA,#6F,#AE,#B1
    DB #16,#52,#6F,#1E,#D5,#79,#5A,#DA,#1F,#F4,#17,#FE,#D7,#75,#FF,#8D
    DB #23,#A1,#68,#8E,#7A,#00,#CB,#E3,#57,#6D,#0A,#CB,#54,#E4,#2D,#16
    DB #73,#FA,#F3,#03,#9F,#E0,#72,#FC,#43,#DE,#47,#03,#FD,#5B,#AA,#BF
    DB #FA,#61,#81,#88,#A8,#60,#E9,#CA,#61,#68,#6F,#F8,#E9,#68,#82,#11
    DB #AB,#68,#8A,#87,#BB,#A8,#A8,#61,#1A,#3D,#02,#36,#9A,#83,#61,#6D
    DB #C1,#7F,#7A,#F9,#01,#44,#FB,#DE,#16,#9F,#CE,#E3,#6B,#D8,#F1,#A8
    DB #B6,#81,#74,#E0,#57,#3C,#CF,#00,#2F,#FC,#F3,#C6,#10,#3C,#86,#68
    DB #EE,#96,#6A,#BA,#6B,#F8,#8B,#BA,#66,#97,#AA,#18,#88,#88,#86,#AA
    DB #A6,#4B,#E0,#6C,#17,#F1,#D8,#ED,#1B,#62,#6A,#66,#8B,#A8,#68,#7E
    DB #68,#66,#18,#66,#83,#41,#32,#EC,#3D,#1F,#F1,#FB,#BE,#FC,#53,#28
    DB #E6,#02,#6A,#41,#74,#57,#7F,#E3,#CD,#16,#41,#FD,#4A,#36,#CD,#F8
    DB #DC,#FF,#80,#FC,#BA,#1E,#03,#86,#19,#CB,#18,#8B,#FB,#FE,#71,#23
    DB #83,#2F,#16,#8A,#A6,#16,#A5,#F0,#BD,#19,#61,#88,#6A,#88,#18,#AA
    DB #4D,#EA,#E9,#DD,#68,#EA,#A1,#78,#81,#79,#F2,#A6,#64,#82,#44,#DD
    DB #CF,#FF,#8F,#1F,#71,#71,#60,#67,#F5,#57,#F7,#AB,#03,#74,#91,#B3
    DB #CC,#1F,#7C,#9F,#00,#71,#A7,#F9,#14,#35,#0C,#A8,#81,#C7,#66,#61
    DB #46,#FE,#17,#15,#1D,#F3,#86,#F1,#29,#D9,#3D,#D7,#6E,#AF,#88,#A6
    DB #1A,#88,#81,#AA,#F9,#BC,#18,#B9,#35,#3D,#77,#AE,#7F,#2A,#52,#7A
    DB #FF,#41,#86,#CC,#14,#EF,#7F,#77,#BF,#E8,#9D,#DC,#CB,#E0,#4E,#D5
    DB #3D,#86,#64,#2F,#16,#E4,#FE,#5C,#61,#FE,#74,#B7,#64,#41,#09,#50
    DB #B5,#1A,#F2,#0D,#45,#27,#35,#1A,#BA,#EB,#88,#BB,#5B,#EE,#27,#2F
    DB #F6,#16,#16,#8A,#D9,#18,#88,#D7,#B1,#08,#0F,#60,#A7,#81,#E3,#29
    DB #EB,#47,#F4,#2F,#FB,#76,#D5,#FB,#83,#00,#F7,#1A,#36,#DE,#18,#35
    DB #BE,#CB,#76,#80,#FE,#72,#E2,#32,#FE,#EE,#FB,#66,#F3,#BF,#AA,#9B
    DB #92,#B2,#18,#DE,#EC,#62,#FB,#19,#FF,#D9,#9F,#7E,#CA,#FA,#8F,#68
    DB #81,#C3,#BF,#A0,#EF,#78,#28,#66,#4D,#35,#53,#36,#1B,#89,#E7,#86
    DB #60,#46,#6C,#FE,#B7,#C0,#25,#D1,#16,#FF,#DB,#BF,#00,#06,#71,#44
    DB #16,#86,#9D,#B0,#73,#2B,#ED,#7C,#42,#71,#2D,#FC,#30,#0F,#9D,#11
    DB #86,#1F,#86,#32,#D3,#CA,#CF,#FD,#F7,#C8,#D1,#F9,#F8,#BA,#A1,#A1
    DB #84,#29,#EE,#DF,#B0,#EE,#DA,#47,#75,#DB,#46,#86,#67,#60,#32,#16
    DB #84,#8E,#D0,#DD,#EC,#C0,#F6,#FB,#72,#88,#5F,#2B,#E8,#A2,#68,#DE
    DB #AA,#6C,#D6,#86,#07,#EB,#68,#E7,#F1,#47,#0C,#A8,#16,#E8,#86,#BB
    DB #BC,#A9,#18,#66,#A8,#8C,#1B,#BB,#3F,#B3,#E2,#18,#68,#FD,#4C,#08
    DB #52,#89,#41,#A1,#35,#3F,#01,#25,#4A,#A5,#D6,#EC,#FA,#7F,#12,#00
    DB #35,#25,#FA,#3E,#9B,#21,#BD,#16,#0D,#88,#03,#6A,#81,#B7,#8A,#EE
    DB #F5,#2D,#27,#FD,#A1,#16,#FE,#5B,#0C,#5F,#D8,#EE,#C7,#43,#66,#FD
    DB #CE,#6A,#BD,#03,#1D,#BA,#A8,#6A,#66,#B8,#8F,#FE,#00,#F2,#02,#3D
    DB #45,#44,#9D,#6D,#7A,#9F,#E4,#1F,#74,#1E,#3D,#06,#7F,#AB,#3C,#F4
    DB #F9,#9E,#EC,#0D,#B2,#86,#E5,#9E,#18,#E8,#8F,#8B,#B1,#01,#63,#D0
    DB #47,#F7,#79,#C4,#A4,#66,#86,#66,#AD,#AA,#8A,#AA,#BA,#81,#6E,#91
    DB #60,#72,#33,#FE,#EF,#6A,#05,#2D,#E6,#CD,#34,#85,#F4,#2D,#41,#37
    DB #62,#5E,#30,#CF,#B8,#04,#62,#F7,#B8,#81,#31,#F0,#E6,#7F,#D2,#EE
    DB #CD,#C1,#1B,#BD,#B8,#4A,#C4,#B6,#16,#31,#38,#AA,#8E,#B9,#EA,#E5
    DB #54,#56,#1C,#42,#64,#68,#66,#66,#38,#E5,#8D,#4D,#64,#30,#0E,#8B
    DB #12,#21,#D1,#FE,#C7,#FE,#D7,#15,#F7,#34,#03,#9F,#DC,#2F,#2A,#FE
    DB #B1,#FC,#D8,#BE,#C6,#F2,#78,#14,#D8,#8A,#09,#0B,#41,#45,#47,#75
    DB #71,#C1,#12,#22,#88,#FD,#1C,#C1,#93,#11,#C2,#22,#CC,#16,#AB,#42
    DB #D2,#75,#36,#DF,#0E,#6C,#D4,#C3,#F1,#CC,#C9,#EA,#88,#C2,#21,#82
    DB #1E,#AE,#31,#1C,#A5,#CC,#0D,#FB,#39,#37,#10,#1E,#28,#C7,#8A,#0D
    DB #CF,#D6,#D9,#B8,#D4,#E8,#31,#9D,#60,#AA,#62,#55,#BD,#71,#B1,#B9
    DB #35,#1C,#5C,#8C,#C2,#C1,#CC,#01,#24,#F7,#DF,#DF,#5C,#D6,#FF,#FA
    DB #FE,#A6,#66,#3F,#AA,#6C,#D4,#65,#FE,#21,#D8,#1E,#9B,#AA,#AB,#A1
    DB #20,#AB,#81,#81,#C8,#A3,#D5,#85,#88,#16,#CF,#D3,#73,#9B,#EF,#1A
    DB #BB,#B8,#0D,#F1,#3C,#0E,#1F,#02,#21,#1F,#9A,#41,#1C,#BC,#17,#54
    DB #15,#A4,#E1,#DD,#9B,#CB,#AE,#22,#23,#2F,#12,#2A,#1C,#0A,#C0,#FB
    DB #0E,#8B,#AA,#A2,#D3,#13,#3D,#AA,#A3,#03,#90,#FE,#97,#15,#55,#EA
    DB #A8,#68,#6A,#AA,#ED,#B5,#14,#2A,#22,#61,#3A,#03,#61,#03,#D5,#55
    DB #FE,#D9,#02,#C3,#F6,#A8,#01,#E9,#D2,#91,#A6,#7E,#42,#48,#8A,#66
    DB #6A,#E1,#1E,#EC,#C1,#F3,#52,#B5,#C7,#D5,#46,#08,#87,#CC,#C1,#0D
    DB #1C,#9D,#AA,#CC,#CC,#6D,#F6,#A0,#07,#C5,#59,#31,#EE,#51,#11,#6B
    DB #61,#AB,#B6,#51,#8B,#B2,#DE,#03,#1D,#2F,#16,#68,#F1,#F1,#0C,#FF
    DB #0A,#EC,#0E,#ED,#02,#E0,#01,#A3,#A1,#6A,#AA,#E8,#E1,#68,#18,#CC
    DB #AF,#61,#DA,#CE,#99,#FB,#35,#CC,#45,#91,#64,#D2,#C5,#35,#C5,#54
    DB #BD,#D3,#A2,#59,#6F,#E0,#AB,#0C,#E4,#8E,#A1,#1C,#04,#06,#31,#CE
    DB #EE,#22,#AF,#EB,#BA,#D3,#19,#F5,#43,#65,#63,#F6,#2D,#05,#16,#8D
    DB #3E,#1D,#FB,#63,#16,#66,#02,#E3,#81,#BF,#B6,#16,#A2,#00,#4E,#EE
    DB #35,#67,#E8,#5B,#50,#2A,#D8,#AA,#83,#81,#A1,#22,#C1,#20,#6A,#DB
    DB #20,#09,#06,#98,#C1,#1C,#2C,#F8,#D1,#1F,#9C,#C3,#21,#7F,#86,#72
    DB #F5,#FD,#4D,#02,#26,#71,#17,#45,#2A,#1E,#2A,#4E,#EA,#18,#EC,#37
    DB #BB,#63,#28,#06,#66,#3A,#75,#46,#D1,#67,#A2,#7E,#04,#35,#A7,#6A
    DB #68,#AB,#BE,#83,#AD,#E1,#15,#51,#17,#44,#DD,#90,#4B,#16,#23,#F8
    DB #A6,#FE,#A6,#61,#22,#D7,#15,#AB,#2C,#1A,#83,#E7,#A4,#44,#4C,#C2
    DB #16,#BC,#FA,#D7,#27,#AA,#B2,#1C,#EC,#D5,#E9,#46,#1A,#ED,#A7,#2A
    DB #4D,#FE,#68,#75,#AE,#77,#55,#5D,#11,#E4,#EA,#8E,#88,#B1,#8A,#38
    DB #37,#4C,#C9,#A4,#B5,#4E,#A5,#85,#41,#80,#A0,#A8,#A1,#A8,#8E,#4E
    DB #8A,#AE,#E4,#A8,#17,#7E,#E1,#E1,#51,#1D,#1D,#A7,#4B,#C3,#A8,#5A
    DB #8D,#1B,#FB,#F9,#FD,#A6,#5D,#BF,#3E,#39,#FF,#ED,#D2,#2A,#6A,#BE
    DB #A2,#0C,#D4,#C1,#85,#02,#77,#51,#B3,#FA,#6B,#F4,#F9,#75,#30,#C8
    DB #C8,#66,#D4,#A7,#E4,#AE,#6A,#94,#0A,#64,#AF,#54,#E7,#A4,#EC,#F9
    DB #1A,#23,#A4,#4E,#CE,#D5,#16,#7E,#C8,#18,#9D,#AC,#16,#6A,#3E,#C0
    DB #EC,#AD,#A1,#FA,#21,#D7,#F1,#44,#D0,#CE,#42,#FE,#05,#CA,#5A,#1A
    DB #75,#51,#EE,#8B,#AB,#DC,#89,#2B,#D6,#BC,#0A,#16,#AA,#98,#A8,#B5
    DB #E9,#08,#73,#97,#77,#71,#FD,#D8,#45,#72,#5B,#0C,#A3,#A8,#60,#F5
    DB #E8,#81,#6C,#CC,#CA,#EF,#AB,#9E,#A2,#A1,#CA,#CF,#B0,#A2,#B1,#CD
    DB #AC,#CE,#2F,#8A,#CA,#2C,#FE,#20,#41,#12,#03,#32,#61,#24,#37,#4A
    DB #86,#1E,#C1,#66,#6E,#EE,#7F,#46,#9C,#F2,#18,#DD,#D7,#88,#8E,#C3
    DB #1E,#B0,#FF,#1E,#08,#9C,#33,#19,#73,#3B,#0F,#6D,#26,#88,#1C,#CB
    DB #AC,#1A,#E2,#EE,#E8,#C1,#F0,#83,#1C,#1A,#A2,#C2,#4C,#EB,#1D,#2E
    DB #AD,#CC,#61,#F6,#1D,#68,#E1,#EC,#88,#19,#91,#A3,#69,#52,#36,#C5
    DB #D2,#35,#20,#C6,#4F,#49,#11,#8B,#B8,#BB,#18,#E1,#31,#E0,#AF,#AA
    DB #D5,#31,#EF,#8B,#D6,#BA,#6B,#F2,#1A,#46,#4A,#EF,#36,#FE,#2A,#1C
    DB #39,#CC,#1A,#22,#98,#15,#41,#41,#4A,#1E,#E5,#FE,#4C,#36,#FF,#63
    DB #70,#1A,#61,#86,#2D,#F4,#53,#F1,#32,#FF,#A7,#94,#EE,#FC,#04,#D1
    DB #11,#2B,#D4,#81,#56,#D2,#D4,#BD,#C0,#F5,#5D,#4F,#2F,#0D,#A2,#17
    DB #4E,#BD,#06,#A7,#C4,#AB,#F2,#43,#84,#FE,#5C,#E9,#63,#F1,#44,#39
    DB #FE,#46,#24,#1C,#11,#11,#4D,#55,#56
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
