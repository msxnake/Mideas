; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation backend
; Project: test8(1)17
; Presentation: New MSX2 SCREEN 5 Presentation
; Screen mode: SCREEN 5 (Graphics III)
; Backend: msx2-screen5-presentation
; MSX2_GAMEFLOW_PRESENT: yes
; MSX2_GAMEFLOW_ASSET: Main MSX2
; MSX2_GAMEFLOW_START_NODE: gf_start_bitmapPlatform_mymsxgame
; MSX2_GAMEFLOW_SCREEN5_NODE: msx2_gf_screen5_1783012160817
; MSX2_GAMEFLOW_PRESENTATION_ASSET_ID: msx2presentation_1783011916950
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
    ; ZX0 compressed tile_pattern (4096 -> 1150 bytes)
    DB #84,#11,#BC,#14,#F0,#3F,#F3,#FC,#3D,#FE,#57,#E6,#7B,#54,#92,#41
    DB #E4,#71,#CC,#9E,#55,#55,#41,#00,#07,#CB,#A4,#44,#EF,#CA,#41,#02
    DB #54,#A0,#E1,#62,#11,#44,#4A,#F7,#42,#90,#5D,#E5,#E8,#FF,#A5,#FF
    DB #F4,#8F,#14,#14,#F1,#B8,#FB,#1D,#B5,#81,#14,#E4,#6D,#1E,#90,#04
    DB #A5,#CC,#76,#3A,#69,#15,#2E,#FF,#80,#19,#97,#14,#45,#55,#70,#BE
    DB #DD,#11,#F6,#9A,#02,#FD,#F1,#E9,#9C,#F2,#D1,#F6,#3D,#86,#A4,#44
    DB #88,#4F,#51,#4F,#03,#24,#0E,#2D,#F4,#CF,#02,#07,#8B,#FE,#41,#58
    DB #06,#69,#44,#44,#A4,#11,#88,#1E,#41,#4A,#15,#CD,#B2,#33,#AE,#37
    DB #11,#AA,#02,#54,#9A,#41,#DF,#BF,#D4,#F1,#9A,#3C,#F2,#3E,#02,#94
    DB #C1,#68,#C1,#0A,#41,#28,#E1,#08,#85,#11,#71,#A5,#D5,#23,#47,#74
    DB #83,#E8,#77,#08,#39,#06,#95,#1D,#44,#44,#0F,#69,#35,#F6,#F7,#20
    DB #19,#0C,#2E,#1F,#AE,#3F,#E1,#AC,#7A,#03,#54,#0A,#4F,#FC,#D9,#E9
    DB #20,#FC,#17,#DE,#18,#02,#18,#84,#44,#FD,#D2,#12,#4D,#CD,#A0,#DF
    DB #04,#D9,#C3,#92,#65,#EC,#68,#1E,#00,#BD,#41,#02,#66,#45,#FF,#51
    DB #52,#2E,#44,#14,#28,#7C,#02,#32,#08,#7C,#02,#1F,#CE,#5A,#1C,#16
    DB #D5,#71,#80,#5A,#E5,#02,#A5,#F4,#3E,#AF,#00,#6E,#1D,#98,#34,#DC
    DB #15,#04,#EC,#D8,#D6,#04,#24,#CC,#CC,#49,#93,#FF,#BB,#1C,#D3,#0A
    DB #D7,#DE,#52,#F7,#C8,#F5,#04,#4D,#DA,#02,#14,#2D,#4D,#CA,#FE,#4D
    DB #CD,#3E,#F6,#84,#75,#C1,#CF,#FC,#95,#0A,#86,#1C,#1F,#FF,#BA,#AB
    DB #53,#D3,#34,#D8,#02,#BD,#4F,#F4,#DA,#78,#DE,#70,#CA,#11,#02,#95
    DB #D4,#DC,#D9,#7C,#DD,#38,#8D,#FF,#FC,#25,#40,#63,#BB,#AA,#B1,#FF
    DB #2C,#81,#DC,#22,#4F,#E4,#76,#FE,#42,#8F,#1D,#F1,#6A,#05,#4D,#D8
    DB #DD,#FC,#F8,#E9,#00,#22,#5F,#F7,#19,#24,#C1,#FA,#AA,#AA,#BF,#1C
    DB #69,#41,#1B,#FC,#56,#B2,#01,#89,#17,#71,#07,#FA,#62,#09,#DD,#ED
    DB #FD,#4D,#D6,#FD,#08,#B8,#14,#00,#58,#D3,#AB,#F1,#2C,#1E,#00,#1A
    DB #AB,#3C,#C9,#D8,#04,#81,#14,#EF,#69,#41,#E4,#02,#35,#3A,#B2,#D1
    DB #73,#2F,#F8,#01,#FD,#FE,#FF,#A9,#FD,#FB,#12,#10,#7B,#D5,#74,#CD
    DB #00,#E8,#38,#C1,#13,#A8,#C9,#1C,#8A,#BB,#BB,#B1,#03,#73,#86,#75
    DB #AC,#E9,#03,#E1,#4B,#47,#C3,#00,#33,#0D,#0F,#9C,#04,#8F,#FF,#D1
    DB #44,#7C,#36,#EE,#79,#E8,#F8,#00,#81,#FF,#1C,#66,#1C,#11,#BB,#5F
    DB #C4,#7C,#94,#CD,#FC,#7D,#02,#2F,#FF,#00,#38,#D0,#E8,#04,#93,#4D
    DB #44,#C5,#FB,#B1,#0A,#83,#10,#E8,#00,#14,#08,#81,#BF,#CC,#62,#1E
    DB #FB,#1A,#A1,#E7,#A6,#43,#6C,#7D,#02,#1C,#2B,#EB,#7F,#CB,#00,#D1
    DB #0C,#0C,#D9,#04,#E7,#F1,#D4,#D4,#D1,#FC,#7F,#D8,#FD,#6E,#F9,#C8
    DB #00,#99,#1C,#1B,#C2,#AF,#F1,#C1,#06,#13,#FA,#05,#00,#AC,#F7,#4C
    DB #62,#52,#B0,#F5,#D4,#EA,#F3,#C0,#C5,#21,#FF,#32,#04,#83,#00,#71
    DB #8B,#7E,#06,#32,#03,#E9,#00,#FC,#12,#93,#A2,#B7,#F5,#41,#62,#9E
    DB #EF,#FF,#E4,#7C,#48,#FB,#1E,#FF,#FE,#E1,#58,#06,#0D,#EB,#0C,#DF
    DB #5F,#A4,#3E,#F5,#06,#31,#DF,#9F,#FF,#00,#7E,#FF,#86,#F8,#87,#98
    DB #ED,#00,#AB,#39,#FF,#D8,#7D,#BF,#E9,#00,#1B,#28,#AE,#0A,#11,#1A
    DB #F4,#12,#6E,#1F,#FF,#EE,#C6,#23,#4F,#F1,#07,#10,#0C,#9A,#FE,#4D
    DB #2A,#1D,#62,#14,#4D,#D4,#08,#D9,#D9,#9D,#99,#F2,#ED,#DF,#36,#E1
    DB #15,#F8,#34,#31,#02,#B1,#BA,#FB,#FE,#70,#93,#30,#96,#00,#B5,#AB
    DB #94,#22,#8D,#EF,#EF,#AC,#0B,#EC,#19,#62,#A5,#7E,#7F,#32,#7D,#01
    DB #1D,#4B,#01,#DD,#A6,#FF,#99,#D2,#D9,#05,#BF,#54,#08,#51,#C3,#9E
    DB #56,#FE,#09,#8E,#BF,#FA,#1C,#00,#46,#C1,#AF,#94,#A0,#8F,#FF,#CE
    DB #03,#21,#D2,#BD,#7C,#C2,#77,#27,#52,#1E,#D2,#04,#7B,#B1,#F9,#74
    DB #F9,#6B,#05,#55,#B1,#B0,#77,#16,#D6,#00,#60,#FB,#F1,#C1,#0A,#CB
    DB #04,#E4,#02,#9B,#CF,#CC,#EE,#87,#9A,#4A,#51,#F1,#53,#5F,#0A,#AA
    DB #01,#4D,#9D,#88,#D9,#9F,#27,#9D,#44,#45,#8F,#08,#F9,#60,#30,#7A
    DB #00,#19,#AB,#BF,#FF,#B1,#C1,#5A,#EB,#68,#BA,#A1,#BF,#18,#8E,#1F
    DB #F4,#02,#A5,#1C,#99,#15,#14,#57,#5C,#DB,#E7,#0A,#0D,#1B,#7A,#15
    DB #01,#9F,#AC,#FD,#4A,#02,#2D,#45,#94,#70,#BE,#F9,#E7,#00,#A0,#1F
    DB #F1,#2B,#B8,#FB,#C1,#00,#4F,#CD,#3D,#A8,#60,#FA,#6A,#FE,#1A,#1C
    DB #EE,#EE,#1E,#EF,#93,#EE,#8F,#45,#55,#7C,#B6,#1F,#F9,#F2,#1B,#15
    DB #04,#CF,#FE,#D4,#F7,#29,#09,#11,#35,#21,#30,#31,#F9,#FE,#01,#94
    DB #BF,#FC,#CC,#A0,#BB,#FE,#F3,#03,#9A,#12,#FB,#FE,#07,#0D,#CC,#8D
    DB #FF,#C1,#CC,#36,#24,#32,#55,#57,#0A,#5D,#27,#FC,#F5,#04,#DA,#0D
    DB #02,#8C,#DF,#6C,#E0,#C3,#02,#4D,#FE,#38,#01,#95,#BB,#BF,#A6,#FB
    DB #D0,#B1,#85,#CE,#C6,#10,#83,#9E,#EE,#EC,#CE,#F0,#FB,#01,#92,#D2
    DB #30,#47,#F1,#D6,#B6,#D2,#4D,#06,#AD,#D9,#AA,#05,#9D,#D5,#C8,#DD
    DB #CF,#D4,#54,#B2,#81,#00,#A0,#41,#26,#BB,#BC,#CC,#04,#B8,#C1,#02
    DB #08,#9D,#1E,#E6,#A8,#05,#CC,#B8,#CE,#EC,#A6,#7A,#F9,#44,#D7,#B8
    DB #5F,#25,#AB,#00,#99,#4F,#F2,#C1,#01,#7C,#06,#F4,#CE,#80,#00,#99
    DB #14,#4C,#1B,#CE,#2D,#24,#D9,#60,#F2,#54,#F7,#CC,#00,#C6,#52,#C7
    DB #1F,#13,#6D,#01,#FE,#16,#82,#42,#81,#E1,#CE,#29,#22,#C7,#FF,#16
    DB #08,#A2,#D5,#8B,#55,#54,#5B,#04,#52,#0C,#78,#00,#49,#9C,#44,#C1
    DB #1B,#9F,#FE,#22,#7D,#00,#A3,#AC,#DD,#43,#4E,#F2,#02,#E4,#C1,#06
    DB #35,#EE,#20,#57,#00,#4D,#D5,#A7,#E4,#04,#F5,#D5,#5D,#9D,#54,#5D
    DB #D5,#E5,#BF,#C2,#00,#85,#02,#ED,#D0,#7F,#FD,#00,#A8,#22,#EC,#FF
    DB #25,#59,#FF,#4B,#12,#8B,#00,#BA,#9D,#ED,#2B,#AA,#F1,#25,#0E,#D3
    DB #8A,#1C,#6C,#FC,#CC,#00,#3B,#48,#15,#67,#FE,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_1_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 1, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_1:
    ; ZX0 compressed tile_pattern (4096 -> 1570 bytes)
    DB #88,#11,#88,#41,#44,#A2,#4D,#44,#DD,#55,#9F,#54,#45,#D4,#F1,#9F
    DB #DF,#44,#14,#41,#F7,#E1,#FB,#FE,#22,#44,#11,#A8,#1C,#86,#FB,#BB
    DB #22,#BE,#CC,#27,#C2,#22,#A7,#F2,#C1,#FB,#FF,#9E,#DF,#BA,#CB,#AA
    DB #FF,#F7,#B1,#AA,#A4,#8D,#F1,#2A,#CC,#3F,#22,#21,#AF,#EA,#3E,#FF
    DB #3C,#89,#55,#57,#FB,#EA,#44,#6A,#FE,#4D,#AA,#D4,#44,#AE,#44,#F7
    DB #EF,#41,#DF,#51,#04,#4F,#B2,#7C,#6C,#BA,#1F,#01,#AB,#6A,#BB,#E1
    DB #22,#4B,#AA,#EF,#FF,#FF,#FB,#C1,#C2,#FA,#FF,#00,#AA,#46,#F7,#1C
    DB #0C,#F8,#C1,#F4,#F9,#AB,#BF,#9F,#EA,#E3,#F6,#6A,#34,#51,#F3,#50
    DB #E4,#FB,#FE,#CF,#E2,#B8,#CE,#00,#18,#96,#5F,#44,#2A,#21,#EF,#BA
    DB #09,#F6,#BE,#1F,#FF,#FE,#3A,#11,#CF,#00,#21,#BB,#AB,#08,#22,#CA
    DB #BB,#FB,#AC,#A7,#1C,#22,#AA,#A2,#2A,#AB,#2C,#0F,#1A,#CB,#BB,#A1
    DB #4E,#26,#54,#14,#E1,#1B,#D4,#FF,#12,#16,#3F,#F5,#F0,#6F,#E4,#0E
    DB #1D,#CA,#00,#57,#5D,#6A,#FD,#21,#C8,#BA,#FE,#B6,#EE,#09,#DB,#BF
    DB #00,#A2,#EF,#BF,#EE,#1A,#E0,#03,#B8,#AB,#14,#B7,#E1,#F8,#4C,#DF
    DB #F2,#E1,#EF,#F5,#01,#B2,#42,#62,#45,#CE,#4E,#0C,#CE,#E0,#3A,#D5
    DB #54,#00,#F9,#41,#EB,#FE,#18,#B5,#44,#14,#87,#68,#6D,#2E,#27,#F6
    DB #9E,#00,#E8,#8B,#FF,#B1,#6D,#4E,#73,#3C,#98,#02,#97,#3C,#CC,#FA
    DB #F3,#96,#2A,#2F,#A2,#03,#B4,#E7,#C1,#C3,#62,#B4,#1F,#41,#9D,#E2
    DB #A9,#04,#D4,#F9,#E1,#02,#1A,#14,#75,#9E,#A0,#60,#F8,#35,#00,#DC
    DB #F8,#C7,#E0,#2F,#BA,#01,#E5,#43,#9A,#B6,#1B,#E5,#FD,#AA,#D9,#02
    DB #A8,#22,#D7,#AB,#BA,#FD,#DF,#BC,#F1,#8B,#04,#71,#BC,#F6,#1C,#EF
    DB #0D,#5F,#01,#7E,#E4,#00,#53,#A5,#AD,#41,#F7,#5F,#79,#88,#01,#AB
    DB #AB,#FD,#FB,#0A,#FB,#ED,#FA,#7E,#42,#FE,#58,#B7,#13,#22,#A6,#B8
    DB #BC,#F7,#CF,#A1,#CB,#AC,#8D,#FF,#AC,#2C,#66,#7C,#2F,#1B,#BF,#5D
    DB #7F,#26,#54,#A0,#44,#C6,#F8,#A7,#5D,#3B,#EE,#4E,#D7,#0C,#99,#FF
    DB #C4,#EC,#CC,#76,#86,#63,#12,#CA,#2B,#FE,#B2,#F2,#01,#17,#F1,#87
    DB #AA,#6D,#E0,#CD,#41,#48,#F6,#F4,#92,#1E,#7E,#1C,#CA,#1A,#03,#00
    DB #2C,#FB,#D7,#E1,#FC,#8F,#44,#4C,#71,#48,#18,#A3,#C1,#4C,#1A,#9C
    DB #45,#DF,#54,#2D,#06,#6E,#34,#03,#24,#FF,#F4,#37,#7C,#EC,#B3,#CE
    DB #62,#32,#3E,#FE,#21,#E9,#FF,#49,#11,#C2,#1F,#22,#1B,#AA,#71,#FE
    DB #18,#0D,#F1,#82,#BA,#CB,#A1,#2A,#71,#FA,#BE,#E1,#85,#FD,#74,#1E
    DB #CC,#2B,#9A,#AA,#FF,#63,#21,#2C,#4D,#D3,#8E,#0A,#02,#AE,#47,#01
    DB #9A,#14,#44,#6D,#5D,#F7,#06,#94,#75,#31,#8C,#C3,#47,#F7,#84,#89
    DB #EF,#76,#FB,#E1,#66,#03,#FF,#22,#22,#E4,#FE,#2F,#B1,#A7,#34,#FA
    DB #83,#12,#3C,#BB,#BC,#B4,#9F,#3B,#B9,#B4,#7C,#9F,#FB,#C2,#2C,#E3
    DB #25,#0F,#93,#4C,#2A,#1C,#E5,#55,#54,#E1,#8A,#FC,#4E,#C2,#24,#4C
    DB #25,#92,#BF,#1F,#93,#FE,#08,#39,#BF,#11,#1F,#F2,#02,#4C,#D7,#FD
    DB #FC,#5D,#EF,#62,#31,#77,#A5,#85,#3B,#9E,#B2,#2E,#EE,#14,#B6,#4C
    DB #77,#FF,#77,#FF,#A8,#CB,#04,#14,#7F,#06,#A6,#B7,#41,#F6,#0E,#BC
    DB #BC,#FB,#14,#D9,#F4,#23,#F1,#12,#94,#02,#D9,#FD,#97,#F1,#CE,#C1
    DB #18,#6C,#7A,#79,#EB,#89,#B3,#B3,#87,#B3,#A3,#3B,#33,#B1,#4C,#76
    DB #9E,#4C,#C1,#71,#CA,#33,#0A,#FA,#02,#44,#FD,#10,#73,#FC,#82,#02
    DB #35,#EF,#BA,#C7,#49,#40,#FF,#EB,#92,#22,#E9,#11,#2B,#4B,#1A,#91
    DB #00,#AB,#AB,#AF,#4E,#BF,#06,#33,#78,#19,#80,#C3,#33,#33,#B1,#B1
    DB #DD,#E7,#F1,#6E,#FE,#D2,#F6,#00,#F3,#54,#09,#12,#5C,#59,#2C,#A2
    DB #1C,#FE,#FA,#57,#05,#7F,#DC,#C4,#C2,#EB,#44,#CB,#46,#2E,#33,#FE
    DB #07,#FE,#00,#A8,#E4,#C1,#00,#BC,#33,#FE,#CE,#F7,#09,#35,#EE,#EC
    DB #C3,#BA,#D4,#07,#C1,#16,#BA,#C1,#04,#67,#AA,#AC,#21,#B0,#FE,#A1
    DB #E9,#44,#FC,#41,#04,#4D,#29,#FD,#BF,#5F,#98,#DA,#02,#DE,#22,#FA
    DB #22,#3B,#32,#D0,#3C,#D7,#52,#DA,#00,#71,#05,#C6,#5A,#3B,#61,#14
    DB #56,#CE,#7A,#6B,#41,#C7,#06,#8B,#21,#2A,#30,#FE,#68,#AF,#DD,#66
    DB #39,#99,#F2,#23,#22,#32,#00,#A8,#32,#CC,#43,#8E,#EC,#00,#47,#5C
    DB #5F,#F7,#10,#BC,#F1,#FD,#E0,#92,#AC,#C1,#1E,#FA,#21,#22,#C4,#FE
    DB #AF,#FF,#63,#D8,#A1,#FE,#29,#41,#A2,#33,#FC,#23,#00,#E9,#F5,#01
    DB #C1,#5B,#54,#C0,#04,#D5,#7E,#2C,#03,#23,#E1,#C1,#CA,#79,#01,#14
    DB #7B,#06,#58,#0B,#2F,#1F,#A2,#2C,#1C,#00,#17,#5D,#A3,#34,#00,#D4
    DB #79,#B7,#FE,#DB,#F9,#C2,#F1,#F9,#00,#D8,#4B,#9B,#75,#54,#1F,#30
    DB #FE,#A1,#1E,#36,#7F,#B0,#C4,#F5,#D6,#1F,#B8,#63,#07,#1E,#FB,#A0
    DB #40,#F1,#BA,#22,#2C,#2A,#00,#62,#BF,#F1,#36,#02,#0A,#14,#0D,#57
    DB #12,#BE,#32,#00,#80,#32,#78,#49,#C9,#FF,#75,#FE,#1F,#CB,#9F,#F6
    DB #C5,#BB,#08,#EE,#6A,#06,#FB,#EA,#36,#A1,#A7,#22,#4C,#FE,#5A,#FC
    DB #F1,#5C,#BD,#CC,#0D,#5C,#FF,#8B,#FE,#3C,#B9,#00,#54,#F7,#38,#98
    DB #41,#FF,#F7,#74,#E1,#02,#28,#41,#7F,#AA,#8A,#02,#14,#A7,#2B,#6A
    DB #02,#CA,#A5,#22,#0D,#29,#FF,#AB,#DC,#FE,#A0,#71,#CB,#93,#C2,#EE
    DB #FD,#FA,#00,#A7,#2C,#D6,#36,#74,#5F,#FF,#F5,#C1,#FC,#CB,#0E,#33
    DB #F0,#45,#ED,#16,#BA,#DA,#07,#67,#12,#DC,#00,#F5,#E9,#4A,#F7,#BA
    DB #FF,#FE,#04,#0B,#BB,#87,#00,#9C,#8A,#0A,#8F,#2C,#28,#3C,#E8,#F7
    DB #22,#37,#38,#59,#CF,#44,#57,#FF,#FE,#5F,#38,#58,#FE,#0C,#FD,#0C
    DB #02,#BB,#FB,#30,#43,#F6,#B9,#1B,#00,#7D,#25,#80,#FE,#E2,#B3,#FF
    DB #BC,#C9,#5C,#7E,#0C,#BE,#2C,#00,#95,#C3,#D8,#B6,#C0,#A2,#F6,#FF
    DB #54,#D6,#00,#17,#44,#CD,#D8,#16,#1C,#2B,#CB,#43,#8C,#9A,#C1,#C4
    DB #CC,#CE,#EB,#03,#00,#1A,#AA,#4C,#D9,#CD,#00,#3A,#01,#F1,#AC,#C4
    DB #87,#7E,#E8,#00,#CC,#69,#C2,#4F,#4D,#17,#00,#6B,#FF,#61,#FE,#32
    DB #77,#65,#ED,#DE,#44,#BF,#C1,#02,#12,#94,#A2,#14,#E5,#FF,#00,#F7
    DB #23,#FE,#4F,#E0,#C2,#FF,#C2,#2C,#96,#CA,#03,#14,#1A,#4C,#A1,#CC
    DB #F7,#FE,#75,#34,#CC,#0F,#AD,#FC,#77,#42,#10,#4B,#41,#5C,#CC,#9A
    DB #4E,#EE,#FF,#8D,#EE,#49,#F0,#FC,#02,#F6,#F0,#01,#64,#FF,#A2,#AA
    DB #A1,#AC,#DC,#FE,#7A,#01,#AA,#69,#FC,#FC,#57,#40,#CC,#0E,#D7,#F4
    DB #3C,#81,#80,#36,#CB,#BA,#6B,#FF,#74,#51,#CF,#A4,#F8,#F6,#C8,#39
    DB #E7,#E7,#D4,#8E,#1C,#CE,#40,#D3,#57,#62,#66,#0C,#21,#FF,#BF,#B2
    DB #9A,#00,#AA,#5D,#12,#FA,#1D,#A1,#01,#AB,#AF,#FE,#55,#76,#FE,#FA
    DB #44,#00,#CC,#12,#DC,#C4,#06,#7C,#B7,#DA,#05,#FF,#11,#2F,#F4,#F5
    DB #4D,#04,#6B,#E1,#C8,#78,#E2,#CC,#EB,#01,#12,#C4,#2A,#41,#99,#44
    DB #80,#FF,#FA,#BA,#2A,#1C,#38,#BE,#11,#EE,#FE,#E1,#00,#9D,#FB,#3F
    DB #88,#4E,#B9,#4C,#00,#28,#3C,#35,#19,#34,#7E,#03,#F8,#A7,#41,#6A
    DB #FE,#54,#43,#D6,#DF,#E4,#4D,#F0,#02,#75,#F7,#19,#B4,#CE,#81,#01
    DB #21,#FB,#AA,#3A,#1E,#AD,#BA,#CB,#16,#4C,#2F,#1B,#08,#D4,#26,#32
    DB #C4,#CC,#77,#74,#FA,#F9,#00,#C3,#5A,#CC,#1D,#06,#15,#27,#EE,#E4
    DB #CF,#02,#3E,#E2,#E8,#D4,#47,#95,#F6,#D6,#19,#F3,#FB,#3B,#05,#73
    DB #0B,#56,#EA,#01,#BF,#A9,#BB,#A2,#0D,#ED,#FF,#04,#AB,#FE,#FB,#9A
    DB #00,#FF,#4F,#02,#DB,#F8,#33,#10,#D8,#FE,#A2,#EF,#FF,#F7,#77,#8A
    DB #75,#55,#33,#7F,#E4,#44,#6D,#4D,#43,#AA,#3F,#E2,#65,#12,#CD,#EC
    DB #C6,#09,#2D,#FA,#AA,#AF,#92,#C4,#F9,#79,#62,#70,#1F,#FF,#AB,#A2
    DB #A2,#11,#1A,#93,#20,#DC,#DD,#FE,#3D,#EF,#7C,#00,#EB,#A2,#41,#30
    DB #02,#DE,#D5,#05,#E6,#7F,#0B,#54,#44,#D5,#78,#25,#87,#55,#F4,#BC
    DB #B9,#91,#16,#A0,#44,#70,#0C,#04,#2D,#CE,#6B,#22,#A1,#EF,#08,#CC
    DB #00,#7E,#E1,#D2,#F2,#00,#DF,#BA,#02,#76,#FE,#F1,#CB,#00,#FE,#A0
    DB #03,#25,#4C,#4C,#B6,#CE,#0B,#B1,#F7,#0F,#38,#DB,#FE,#45,#F5,#36
    DB #55,#58
SCREEN5_PRESENTATION_BITMAP_CHUNK_2_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 2, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_2:
    ; ZX0 compressed tile_pattern (4096 -> 1612 bytes)
    DB #20,#41,#11,#6B,#44,#CA,#EA,#1E,#E1,#FE,#98,#1C,#1F,#AA,#82,#B1
    DB #C4,#41,#44,#9A,#CC,#C4,#44,#A1,#CC,#21,#CE,#FF,#AA,#B2,#11,#CB
    DB #BA,#A2,#1A,#AA,#A8,#BB,#81,#BC,#FF,#89,#B1,#BB,#A9,#FF,#86,#F1
    DB #2C,#44,#3B,#41,#14,#A0,#BF,#95,#4C,#F9,#F2,#B8,#4F,#CF,#2A,#75
    DB #77,#7E,#DD,#45,#BF,#54,#CD,#29,#88,#FE,#91,#51,#11,#9F,#CE,#EE
    DB #E1,#EA,#7F,#BD,#00,#69,#1B,#AB,#F1,#11,#BE,#69,#4C,#02,#4F,#C2
    DB #21,#F1,#CF,#BB,#BA,#0C,#E6,#00,#A8,#AB,#BF,#48,#9F,#FF,#CA,#DF
    DB #CF,#00,#FF,#FF,#9E,#95,#01,#FA,#F4,#02,#1D,#F7,#E7,#EE,#ED,#D4
    DB #B6,#38,#C8,#77,#FE,#AE,#45,#26,#6F,#41,#04,#A8,#CF,#8A,#FF,#EC
    DB #F1,#F4,#FE,#BA,#1F,#36,#FF,#1C,#96,#71,#E6,#00,#1B,#FB,#BB,#A1
    DB #AA,#29,#BB,#68,#CE,#62,#F1,#1B,#1A,#CC,#36,#FC,#1E,#8E,#AF,#C4
    DB #02,#8A,#77,#4E,#E3,#EE,#0A,#3B,#30,#14,#B7,#01,#54,#FE,#C8,#02
    DB #89,#14,#D1,#BA,#CC,#FA,#AB,#C1,#11,#20,#FA,#A4,#14,#9D,#C1,#FB
    DB #AF,#FF,#03,#F3,#6A,#A9,#02,#1F,#DA,#00,#64,#A2,#22,#CA,#3D,#0F
    DB #B3,#B0,#FE,#AB,#11,#BC,#A1,#01,#12,#3E,#09,#F2,#61,#AF,#4F,#F7
    DB #FF,#7F,#55,#DE,#00,#3E,#16,#32,#17,#E4,#FC,#2E,#55,#2C,#7A,#27
    DB #1F,#19,#2B,#1E,#EC,#CC,#CE,#EF,#FC,#EC,#49,#FE,#6F,#CC,#FD,#B9
    DB #C0,#00,#BE,#CF,#03,#05,#FB,#A1,#D9,#DF,#AA,#D6,#00,#26,#11,#1F
    DB #69,#1B,#AB,#BB,#80,#A1,#1C,#C4,#6A,#FF,#74,#77,#44,#4D,#CD,#D4
    DB #60,#48,#D6,#FC,#37,#28,#22,#41,#FF,#7A,#06,#34,#EE,#EC,#8D,#F8
    DB #F5,#E5,#FE,#FE,#68,#02,#67,#1E,#FC,#CC,#2D,#AF,#12,#77,#FE,#61
    DB #00,#A6,#EE,#CA,#CB,#C5,#CB,#B9,#CC,#00,#28,#C4,#62,#5F,#7F,#9E
    DB #F4,#DD,#D4,#04,#7F,#6D,#5C,#72,#FE,#35,#DB,#34,#54,#AF,#CC,#1C
    DB #01,#DB,#22,#C1,#C6,#00,#21,#14,#14,#E8,#02,#F8,#B1,#12,#00,#80
    DB #CC,#CA,#A0,#AB,#69,#F1,#27,#BB,#E1,#2C,#75,#02,#8A,#47,#F7,#39
    DB #7F,#DD,#00,#D8,#5E,#68,#41,#E4,#00,#99,#15,#41,#11,#CF,#2C,#FF
    DB #FF,#EE,#00,#1C,#CB,#00,#1F,#A8,#03,#BA,#28,#CC,#21,#B2,#BF,#E0
    DB #22,#22,#00,#A4,#BE,#28,#EB,#88,#FF,#2B,#5A,#C4,#18,#23,#7F,#F5
    DB #FF,#5D,#DF,#22,#5C,#76,#FA,#7C,#E4,#B8,#EC,#12,#CA,#4E,#D5,#1C
    DB #AF,#44,#A1,#EF,#21,#00,#39,#03,#B0,#FB,#AA,#BB,#E3,#FA,#FF,#AB
    DB #92,#00,#97,#BC,#F2,#FF,#00,#37,#C1,#CC,#02,#5E,#D1,#E9,#F5,#01
    DB #54,#0F,#07,#3A,#FC,#11,#76,#02,#68,#1E,#21,#99,#11,#C2,#FB,#2C
    DB #CC,#80,#C1,#1A,#CE,#79,#01,#8B,#4C,#C1,#FB,#A1,#E1,#03,#FF,#B1
    DB #21,#FF,#FB,#BA,#2A,#82,#FE,#97,#FF,#E9,#00,#CB,#AD,#12,#D6,#02
    DB #6F,#FF,#55,#44,#DA,#74,#D8,#2D,#FE,#7D,#E9,#36,#00,#FD,#F4,#F6
    DB #A3,#04,#22,#2C,#8C,#0D,#1E,#CC,#D7,#04,#F9,#AA,#01,#8A,#2E,#BA
    DB #AA,#2C,#64,#96,#C2,#1F,#FF,#BB,#BA,#CA,#A9,#AA,#CF,#07,#1D,#06
    DB #B5,#47,#7E,#29,#11,#06,#32,#FF,#84,#41,#A0,#14,#E2,#44,#B5,#CF
    DB #22,#FE,#72,#12,#2A,#BB,#81,#8D,#CC,#37,#F4,#59,#AA,#3B,#66,#47
    DB #EF,#9D,#00,#18,#F7,#8A,#31,#EF,#AC,#02,#32,#BA,#BF,#00,#4B,#AB
    DB #68,#01,#FE,#5E,#EE,#20,#87,#4F,#F5,#E4,#45,#18,#1E,#7D,#50,#E5
    DB #EE,#8A,#BB,#C1,#FE,#C2,#7F,#4F,#3C,#C3,#F6,#5F,#05,#D8,#00,#82
    DB #B1,#CC,#6B,#C3,#2C,#FF,#B2,#4C,#FE,#3E,#00,#9A,#1C,#BB,#26,#F1
    DB #2C,#C4,#52,#64,#FF,#14,#D4,#C6,#1A,#6F,#41,#0E,#7B,#DE,#13,#20
    DB #48,#E7,#BB,#FB,#7F,#3B,#3C,#21,#DD,#EF,#FE,#7E,#AB,#00,#A6,#CE
    DB #86,#12,#49,#CE,#3A,#12,#FF,#BA,#2A,#66,#AA,#BB,#EF,#4A,#1E,#5A
    DB #3C,#C9,#02,#3A,#1A,#0B,#F4,#FD,#5D,#D4,#BC,#EC,#15,#FD,#02,#F3
    DB #DD,#18,#8F,#E0,#E3,#99,#FE,#A2,#CB,#C1,#1C,#12,#BB,#6B,#33,#73
    DB #02,#F4,#5C,#CC,#EE,#F4,#8E,#AD,#00,#CF,#B8,#48,#00,#86,#CC,#E3
    DB #A1,#11,#EF,#06,#26,#AB,#AE,#D6,#1C,#93,#DA,#1F,#01,#FC,#0A,#CC
    DB #42,#AA,#41,#4F,#0F,#71,#1D,#54,#14,#2E,#CC,#06,#7A,#DF,#44,#17
    DB #B8,#2C,#7B,#E6,#B3,#33,#03,#32,#33,#3C,#1D,#30,#FA,#D6,#8E,#27
    DB #CC,#2C,#1C,#F2,#03,#00,#BE,#33,#FF,#00,#08,#A2,#AB,#1F,#FC,#CC
    DB #1A,#FB,#68,#E2,#1C,#09,#36,#ED,#AE,#27,#12,#5A,#04,#90,#11,#EA
    DB #04,#41,#59,#89,#4C,#E2,#31,#FA,#B2,#CC,#33,#FE,#22,#E6,#D8,#F3
    DB #CC,#F4,#DC,#A8,#1F,#70,#03,#71,#9A,#00,#C3,#A1,#31,#D5,#DA,#FA
    DB #AF,#DA,#00,#8A,#BF,#EB,#22,#BF,#13,#5F,#44,#F9,#F6,#F3,#AA,#1C
    DB #AA,#12,#D6,#F8,#87,#41,#92,#FE,#62,#C3,#32,#22,#75,#3C,#2C,#21
    DB #73,#E6,#4A,#FA,#93,#14,#56,#5E,#1E,#00,#6A,#CE,#8B,#32,#1A,#64
    DB #FE,#8D,#AA,#E1,#5C,#97,#7E,#02,#00,#AC,#1C,#87,#FE,#8A,#B9,#1F
    DB #F1,#B6,#C1,#A8,#0B,#A1,#92,#04,#8F,#12,#00,#58,#9C,#13,#22,#BF
    DB #38,#13,#FD,#67,#FE,#56,#B5,#8F,#1C,#E7,#86,#00,#86,#4C,#8A,#C2
    DB #2C,#7C,#FE,#2C,#BF,#F5,#02,#88,#01,#BE,#2C,#4E,#BC,#8B,#1F,#71
    DB #E0,#79,#00,#A5,#21,#E3,#88,#09,#F0,#E5,#00,#AF,#1C,#46,#F7,#0E
    DB #FD,#F0,#09,#CF,#F1,#70,#DA,#00,#4C,#29,#EC,#A8,#CC,#25,#33,#C2
    DB #2C,#CB,#37,#09,#C6,#FF,#02,#3E,#9F,#00,#4D,#29,#7C,#DD,#A1,#C7
    DB #41,#AA,#E7,#32,#1C,#8C,#C2,#FA,#77,#FE,#09,#86,#22,#CC,#2C,#97
    DB #11,#BC,#C4,#05,#65,#62,#D3,#FE,#A6,#EE,#A0,#E3,#BC,#CE,#2A,#EF
    DB #FA,#FE,#7A,#00,#21,#AA,#FF,#3B,#87,#1A,#26,#16,#80,#E1,#CD,#EC
    DB #F7,#00,#3F,#4C,#00,#0F,#4F,#33,#FE,#DD,#E4,#27,#12,#DA,#00,#E4
    DB #37,#FE,#A2,#EC,#36,#CE,#3E,#F5,#39,#31,#FF,#68,#35,#82,#F4,#DE
    DB #FC,#7D,#04,#A3,#14,#58,#16,#5E,#03,#80,#CA,#C3,#50,#39,#00,#0D
    DB #A0,#FF,#11,#69,#C4,#D8,#00,#7C,#E9,#76,#FE,#18,#3E,#EC,#E3,#1F
    DB #FA,#F6,#38,#F6,#FE,#00,#D6,#E3,#02,#77,#49,#C3,#04,#83,#E8,#62
    DB #DC,#80,#AC,#D1,#F3,#E4,#FE,#28,#E1,#29,#1C,#4F,#27,#DE,#67,#FE
    DB #96,#CC,#8F,#4E,#E3,#BA,#06,#01,#EE,#20,#84,#EE,#EE,#3A,#CF,#82
    DB #61,#9F,#FE,#CA,#08,#93,#AF,#12,#79,#FF,#04,#31,#DE,#AA,#EC,#E0
    DB #DA,#D3,#04,#37,#00,#1F,#00,#7D,#79,#06,#D0,#71,#5C,#8A,#D7,#FD
    DB #09,#FE,#3F,#D8,#88,#01,#B3,#33,#98,#33,#BC,#CB,#18,#66,#88,#86
    DB #61,#11,#12,#2A,#F1,#AC,#44,#6A,#14,#A2,#1C,#AB,#A1,#7F,#0B,#F9
    DB #49,#1C,#35,#75,#02,#EF,#B1,#14,#DC,#0E,#00,#0D,#73,#C2,#9D,#E4
    DB #24,#FA,#E9,#DC,#3E,#CE,#EC,#EC,#CE,#EE,#E3,#01,#F8,#8D,#A1,#A2
    DB #D9,#FE,#DE,#69,#99,#81,#1C,#D4,#B2,#83,#04,#25,#14,#F0,#FE,#3D
    DB #3F,#28,#FF,#14,#17,#1F,#86,#5F,#C4,#CF,#00,#5B,#C4,#DD,#DD,#5C
    DB #7F,#06,#03,#A6,#01,#3B,#34,#E3,#AA,#48,#F0,#63,#99,#91,#A8,#02
    DB #B1,#A2,#CC,#96,#E4,#F5,#1A,#00,#3C,#03,#19,#D4,#E4,#00,#A0,#4C
    DB #D8,#80,#3F,#01,#23,#DD,#FE,#87,#00,#A7,#FF,#EE,#53,#2F,#5A,#FE
    DB #CD,#1B,#25,#9F,#36,#2C,#2D,#A3,#F6,#A8,#86,#6F,#1C,#D6,#7A,#E8
    DB #84,#1A,#F5,#FE,#F6,#31,#FE,#4E,#EF,#FC,#1C,#81,#2C,#D6,#C4,#7C
    DB #23,#F3,#20,#F6,#2F,#4C,#00,#28,#EE,#70,#61,#A7,#9F,#33,#3B,#1B
    DB #AA,#2C,#04,#63,#AB,#33,#B3,#AC,#04,#71,#D7,#04,#35,#EC,#D6,#06
    DB #5B,#41,#87,#DA,#C1,#81,#C3,#84,#4E,#23,#01,#64,#2E,#EE,#EC,#E3
    DB #CA,#BE,#DE,#02,#70,#E3,#BA,#2A,#2B,#A4,#EA,#0B,#6B,#C1,#10,#F1
    DB #1A,#0D,#E3,#43,#8C,#D2,#DA,#FC,#C7,#8A,#B9,#12,#00,#28,#1C,#53
    DB #D2,#03,#0E,#1D,#8F,#24,#F7,#3C,#1C,#97,#2E,#BA,#62,#23,#CE,#DC
    DB #FE,#F6,#09,#E0,#F5,#FF,#3A,#06,#EE,#3E,#FF,#4D,#8B,#FA,#CC,#B3
    DB #00,#E8,#EB,#F4,#3E,#FD,#AE,#B7,#1E,#0A,#A3,#14,#AB,#21,#7B,#10
    DB #B1,#53,#0C,#98,#1A,#A2,#C1,#6F,#BB,#02,#1C,#CC,#00,#C7,#FA,#27
    DB #08,#62,#32,#36,#C2,#22,#FE,#1A,#CC,#4F,#D3,#FE,#FD,#E0,#23,#C4
    DB #BF,#E3,#26,#FA,#BA,#A0,#01,#2C,#A0,#BB,#88,#B3,#EE,#E8,#94,#B4
    DB #32,#32,#9E,#82,#00,#7D,#FE,#4B,#1E,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_3_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 3, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_3:
    ; ZX0 compressed tile_pattern (4096 -> 1726 bytes)
    DB #92,#11,#65,#14,#41,#11,#A6,#44,#12,#14,#4C,#CC,#22,#2A,#BF,#FF
    DB #BA,#A2,#CC,#1A,#EE,#98,#E3,#EC,#CC,#21,#AA,#C4,#4E,#44,#4C,#CC
    DB #EE,#6A,#33,#1F,#FB,#BB,#08,#A2,#A1,#AA,#1B,#BB,#58,#88,#BE,#EE
    DB #EE,#CC,#23,#E3,#BF,#BD,#EA,#44,#64,#44,#3B,#C7,#B1,#BC,#5E,#FA
    DB #58,#B7,#4F,#74,#FE,#0F,#F3,#FB,#8B,#03,#36,#EB,#05,#5C,#FF,#6F
    DB #FD,#2C,#19,#E7,#1C,#33,#3E,#E2,#AA,#00,#EC,#21,#44,#4E,#BE,#31
    DB #05,#FE,#39,#3F,#AE,#AC,#A2,#CA,#1C,#00,#49,#EF,#1B,#AA,#AB,#ED
    DB #12,#B1,#BE,#FF,#11,#D1,#01,#B9,#21,#FE,#02,#B7,#41,#02,#28,#41
    DB #9E,#CC,#C2,#FB,#72,#B8,#BF,#01,#62,#BF,#B3,#EE,#CC,#C4,#B6,#CE
    DB #FF,#8B,#EC,#C3,#33,#E2,#7E,#03,#02,#8F,#BA,#FE,#83,#AC,#C2,#22
    DB #FC,#8A,#00,#3E,#26,#EC,#C3,#CA,#0A,#B1,#3F,#79,#FB,#80,#3A,#8D
    DB #EF,#FF,#A4,#FD,#CF,#5C,#CD,#F0,#8D,#03,#C2,#CF,#FB,#04,#FF,#BB
    DB #28,#67,#3C,#E9,#0C,#F2,#E3,#33,#3B,#43,#FE,#F7,#02,#EF,#07,#0C
    DB #F9,#8B,#FE,#22,#2D,#B9,#BA,#CE,#00,#B3,#4F,#1A,#AA,#A1,#1A,#AB
    DB #B1,#99,#6E,#72,#02,#02,#1A,#1F,#C1,#1F,#1F,#E1,#84,#EE,#A1,#1A
    DB #7E,#A2,#87,#14,#78,#01,#39,#FD,#FA,#AB,#02,#EE,#FE,#F2,#68,#B2
    DB #4C,#FF,#DF,#EB,#40,#6E,#3E,#02,#A1,#E3,#E4,#FE,#EF,#01,#CF,#A3
    DB #B8,#C0,#05,#72,#2C,#BA,#2A,#A2,#11,#FE,#AF,#C2,#02,#0B,#C1,#E6
    DB #17,#0F,#CF,#FF,#1F,#FC,#FD,#FE,#2E,#1B,#1A,#E4,#B0,#DD,#FE,#E6
    DB #01,#2F,#AA,#BB,#4E,#2F,#74,#FA,#2C,#2C,#A3,#FD,#4C,#27,#3E,#DA
    DB #FF,#05,#CF,#4D,#E0,#2D,#FE,#B2,#2A,#FE,#B6,#BF,#01,#76,#3B,#33
    DB #EA,#05,#BA,#1C,#AC,#EF,#B1,#98,#4E,#64,#9E,#1E,#1C,#EF,#F1,#E1
    DB #FF,#05,#24,#FE,#E1,#AA,#1C,#1C,#7B,#A9,#CC,#A3,#1E,#47,#74,#70
    DB #FA,#FC,#E8,#8E,#03,#1A,#2A,#00,#0B,#AF,#5C,#FF,#B3,#FC,#FF,#7E
    DB #FE,#04,#B3,#E3,#06,#FA,#1D,#30,#C9,#CC,#FC,#66,#1B,#EF,#FF,#AB
    DB #BE,#E3,#7E,#D2,#00,#C6,#FD,#93,#3C,#FB,#1B,#FD,#0B,#1E,#62,#13
    DB #F1,#1E,#17,#8A,#87,#11,#2A,#3A,#C1,#A1,#E5,#A1,#08,#D3,#17,#F7
    DB #AC,#5E,#01,#AA,#F2,#AB,#97,#BF,#6F,#6A,#67,#2B,#FE,#EB,#28,#3B
    DB #B3,#8D,#3B,#CF,#B8,#06,#01,#A8,#A1,#BB,#CA,#5E,#6E,#E2,#01,#BB
    DB #BE,#A6,#1A,#8F,#AA,#89,#49,#FE,#E5,#03,#A9,#1F,#FC,#1C,#FF,#E1
    DB #FF,#1F,#FE,#6C,#1A,#3C,#D9,#15,#28,#D2,#97,#1A,#CC,#1E,#1C,#2C
    DB #FF,#F5,#C3,#FA,#AD,#00,#AB,#36,#00,#2E,#BA,#AB,#04,#B0,#E4,#EC
    DB #16,#3B,#7F,#18,#02,#70,#DE,#39,#7B,#FE,#4C,#B1,#5F,#BC,#E6,#FE
    DB #B2,#CA,#A1,#DC,#FD,#8A,#01,#BB,#12,#82,#4E,#0B,#1F,#EE,#CF,#EE
    DB #6F,#01,#C1,#06,#2B,#11,#FB,#F4,#FC,#F1,#FA,#CD,#26,#8A,#FF,#14
    DB #47,#97,#F7,#8C,#E2,#27,#8D,#C3,#F2,#BB,#23,#74,#ED,#1E,#2B,#D1
    DB #01,#8B,#DF,#CE,#E4,#6E,#FE,#DE,#AF,#2F,#00,#92,#C1,#33,#EE,#EB
    DB #BC,#AA,#42,#A2,#A1,#11,#CB,#64,#9A,#31,#A2,#CC,#C1,#AC,#AA,#E3
    DB #FC,#6A,#A0,#13,#F1,#37,#10,#EF,#15,#1A,#F9,#BF,#FA,#FD,#04,#3D
    DB #F0,#9F,#45,#7F,#F5,#A3,#86,#D6,#3C,#44,#C2,#06,#CA,#6C,#63,#A2
    DB #2F,#AC,#6B,#FF,#CC,#4A,#FC,#B5,#E3,#7E,#D2,#27,#C7,#1C,#EE,#BC
    DB #B1,#00,#36,#4E,#8C,#CA,#1B,#EB,#01,#D6,#AC,#58,#FE,#B7,#B2,#1B
    DB #93,#FE,#BD,#14,#C3,#5B,#CC,#69,#FD,#AA,#E0,#FE,#76,#1D,#3F,#45
    DB #F4,#F2,#18,#00,#2D,#CF,#82,#02,#7E,#22,#B2,#2C,#00,#62,#44,#CE
    DB #EC,#D4,#3A,#99,#12,#E6,#12,#BE,#EB,#01,#B3,#BC,#FA,#46,#D6,#B1
    DB #BD,#23,#CB,#13,#B8,#37,#A2,#E3,#AB,#A1,#2C,#C3,#3C,#95,#04,#AE
    DB #AC,#0F,#A6,#21,#AC,#C1,#1A,#57,#17,#12,#5E,#D8,#0E,#27,#7D,#4C
    DB #2E,#FB,#02,#99,#AA,#F3,#C4,#EE,#DA,#03,#AD,#3B,#AB,#0E,#30,#9D
    DB #2A,#7B,#E8,#EA,#C2,#00,#29,#AB,#1C,#B2,#CC,#C2,#2B,#FE,#E1,#23
    DB #E7,#21,#22,#AB,#32,#E4,#60,#6A,#1C,#A2,#C3,#63,#FD,#EE,#00,#3D
    DB #14,#77,#EB,#77,#DC,#35,#E5,#BB,#FF,#FF,#5C,#2D,#2C,#4D,#65,#1F
    DB #01,#04,#D7,#FC,#8F,#EB,#1F,#32,#D2,#CE,#6E,#BE,#F8,#AC,#1B,#D6
    DB #FE,#1B,#CC,#21,#AB,#1A,#C2,#C1,#1F,#8E,#8B,#2B,#EC,#4E,#2C,#1C
    DB #4A,#C1,#A1,#7D,#73,#CD,#D9,#1E,#78,#F4,#DD,#B7,#08,#00,#4F,#FF
    DB #6B,#24,#2A,#4D,#8F,#30,#6D,#A7,#64,#AF,#B3,#C4,#D8,#00,#9D,#B1
    DB #FA,#74,#83,#83,#CC,#5C,#E7,#D7,#FE,#BB,#FF,#AB,#BC,#78,#E8,#EF
    DB #BE,#EC,#82,#69,#4C,#26,#D6,#18,#43,#07,#2C,#F2,#DA,#81,#E4,#C8
    DB #DC,#C8,#22,#BF,#2C,#67,#7D,#62,#05,#B3,#CC,#F6,#00,#26,#31,#BA
    DB #20,#A1,#AB,#6B,#AF,#CD,#DF,#FE,#75,#6B,#D8,#2C,#8A,#03,#11,#B3
    DB #87,#1C,#FF,#07,#E9,#9B,#12,#5E,#02,#4F,#FE,#5E,#30,#EF,#CE,#FE
    DB #BA,#C2,#92,#77,#CA,#B2,#23,#04,#77,#DC,#E3,#34,#0E,#35,#FE,#1A
    DB #AA,#53,#2B,#FE,#22,#17,#E6,#B0,#13,#2B,#A8,#CE,#43,#2C,#F9,#09
    DB #3C,#1F,#F7,#FD,#F0,#02,#78,#0F,#B8,#D9,#9E,#22,#7B,#00,#9D,#04
    DB #D8,#FE,#86,#C3,#CA,#8A,#BB,#BF,#18,#95,#B1,#BA,#9D,#C1,#C2,#2C
    DB #72,#0D,#F0,#D4,#68,#A6,#C6,#EE,#E1,#26,#46,#77,#C1,#44,#14,#3C
    DB #35,#D9,#27,#2E,#B5,#57,#61,#14,#E6,#1F,#1D,#DD,#9F,#07,#99,#01
    DB #1B,#CC,#44,#09,#82,#4C,#E3,#CA,#89,#BC,#82,#FF,#FF,#FB,#20,#FA
    DB #BA,#A0,#BA,#66,#B1,#F1,#22,#A8,#22,#B0,#AB,#2E,#B8,#BF,#EC,#04
    DB #5F,#03,#9F,#6E,#F2,#FF,#06,#04,#8F,#77,#74,#C2,#7D,#D3,#62,#04
    DB #F6,#FE,#00,#AE,#21,#12,#04,#5C,#B5,#EA,#32,#1A,#D8,#1B,#FE,#C5
    DB #88,#F3,#1B,#FA,#E0,#00,#88,#AC,#BA,#98,#AB,#1F,#B1,#86,#2A,#1B
    DB #EE,#7B,#3E,#E2,#03,#CC,#C1,#02,#80,#1E,#F7,#6A,#D8,#EE,#23,#45
    DB #57,#FF,#F7,#0C,#DC,#67,#44,#DF,#F4,#CA,#00,#C1,#A5,#1C,#35,#4A
    DB #F8,#FA,#1A,#00,#AC,#72,#FD,#23,#F1,#1A,#A2,#0D,#A2,#BE,#FF,#00
    DB #26,#A1,#2A,#C0,#F1,#92,#11,#CA,#1C,#BE,#7B,#BE,#7E,#C9,#FF,#86
    DB #C1,#1C,#C1,#77,#1C,#EC,#CF,#06,#A7,#CC,#C7,#FE,#43,#19,#B4,#77
    DB #F4,#87,#F4,#CD,#EE,#B9,#FF,#FE,#00,#0C,#F4,#00,#5B,#12,#27,#30
    DB #DA,#0D,#01,#F1,#D9,#0C,#F4,#01,#9D,#F4,#ED,#00,#BF,#06,#EA,#63
    DB #EB,#CB,#51,#A3,#B1,#C1,#89,#02,#82,#CC,#EF,#BB,#20,#CE,#41,#08
    DB #8A,#77,#FF,#74,#E0,#00,#62,#4D,#9F,#02,#94,#1C,#B4,#4E,#7D,#14
    DB #3C,#FC,#0E,#06,#26,#F1,#FB,#8A,#A2,#A1,#71,#83,#F4,#B4,#0D,#BC
    DB #1D,#EE,#B4,#CE,#CB,#FC,#4C,#2D,#DD,#E1,#2A,#0E,#BC,#77,#06,#5E
    DB #FF,#D6,#75,#E6,#31,#70,#F0,#EB,#DE,#DD,#65,#00,#7F,#00,#59,#FC
    DB #9C,#AB,#C1,#EB,#22,#21,#AB,#A1,#6F,#CA,#00,#A0,#BA,#69,#FC,#AB
    DB #FF,#B7,#F2,#AC,#04,#E6,#7B,#4C,#BB,#BE,#EE,#48,#34,#F1,#02,#A6
    DB #55,#39,#F7,#55,#E8,#D1,#65,#0C,#C7,#CA,#B4,#49,#DA,#00,#1C,#E0
    DB #00,#71,#CC,#FA,#8B,#F2,#AC,#1E,#BF,#E6,#2C,#CC,#8E,#30,#00,#23
    DB #BF,#1F,#1E,#CC,#70,#EE,#E7,#77,#F9,#01,#14,#B0,#4E,#BB,#EC,#8D
    DB #32,#D2,#04,#EA,#57,#05,#77,#BD,#54,#00,#A1,#11,#28,#44,#A5,#4D
    DB #9A,#31,#CC,#C3,#94,#4E,#CD,#FE,#B5,#A2,#60,#1C,#B2,#CF,#72,#C6
    DB #38,#3A,#F0,#1E,#FE,#A1,#2B,#BF,#B1,#03,#0A,#B7,#77,#7B,#BB,#CD
    DB #EC,#89,#77,#FB,#CF,#F5,#42,#F3,#38,#08,#5B,#F5,#F9,#06,#00,#7D
    DB #06,#CA,#00,#80,#49,#88,#CC,#A2,#1A,#E4,#29,#E4,#DE,#FE,#83,#BB
    DB #9A,#00,#AB,#89,#A1,#FF,#C6,#30,#3F,#EE,#41,#ED,#60,#EB,#7A,#00
    DB #E7,#67,#EE,#4C,#71,#52,#32,#36,#78,#DD,#06,#73,#0C,#E0,#00,#3D
    DB #B4,#3E,#00,#37,#C1,#C4,#02,#69,#F4,#35,#EB,#FC,#E3,#16,#14,#5B
    DB #AC,#A8,#00,#E1,#1E,#F3,#2E,#AF,#E1,#03,#BE,#7E,#FE,#F8,#E1,#84
    DB #BA,#E1,#EE,#03,#14,#68,#4E,#4F,#04,#F5,#00,#68,#E4,#B4,#42,#B9
    DB #43,#24,#E2,#31,#FC,#02,#4B,#E9,#FE,#CA,#30,#29,#45,#2A,#F4,#00
    DB #9A,#CF,#FF,#CF,#ED,#77,#FE,#5A,#FF,#14,#C2,#9C,#71,#D7,#10,#1B
    DB #16,#84,#00,#C7,#C0,#35,#DF,#04,#8D,#AC,#01,#4C,#53,#77,#0D,#02
    DB #3C,#FF,#8B,#42,#1A,#66,#FE,#9B,#C1,#AE,#D2,#00,#A2,#1F,#1B,#B7
    DB #8C,#B7,#7E,#F8,#FC,#06,#1E,#E7,#21,#47,#F7,#74,#D3,#00,#80,#CE
    DB #B1,#21,#E5,#FF,#E2,#F3,#5A,#06,#12,#A5,#F1,#C1,#7F,#5E,#05,#E6
    DB #19,#08,#D3,#CE,#EF,#6A,#01,#1E,#83,#BE,#E9,#00,#77,#A5,#E4,#26
    DB #77,#54,#44,#15,#88,#41,#11,#16,#77,#1C,#21,#C4,#00,#4D,#42,#0E
    DB #68,#BC,#0C,#0A,#36,#BD,#16,#00,#FD,#EE,#C5,#FD,#FB,#D1,#C1,#01
    DB #E7,#0C,#FB,#F4,#F7,#02,#DA,#07,#74,#E1,#FE,#75,#55,#58
SCREEN5_PRESENTATION_BITMAP_CHUNK_4_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 4, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_4:
    ; ZX0 compressed tile_pattern (4096 -> 1744 bytes)
    DB #22,#D4,#11,#2A,#14,#11,#44,#01,#86,#42,#1C,#CA,#24,#44,#06,#96
    DB #EE,#98,#BB,#A6,#EA,#AA,#A1,#1A,#AA,#26,#A1,#B1,#11,#62,#1F,#FF
    DB #7D,#EE,#9E,#1B,#FC,#BB,#FE,#7A,#AA,#F0,#E4,#62,#BC,#77,#E4,#28
    DB #4E,#19,#36,#41,#14,#DD,#DD,#D1,#41,#F8,#F5,#00,#A8,#4C,#E4,#C2
    DB #C2,#02,#36,#FF,#08,#11,#A2,#11,#E1,#38,#00,#18,#26,#11,#BA,#1B
    DB #FF,#FE,#7E,#A8,#60,#58,#B9,#47,#54,#FE,#5D,#A9,#FD,#4D,#C8,#D4
    DB #44,#14,#FE,#19,#96,#21,#C2,#A1,#F6,#4E,#02,#E6,#EB,#00,#4A,#FF
    DB #CC,#EE,#11,#1C,#CA,#20,#A1,#F1,#48,#88,#AB,#EF,#FF,#77,#E7,#A8
    DB #14,#F6,#66,#BD,#75,#FE,#0D,#E1,#FF,#D4,#60,#9B,#43,#12,#AA,#13
    DB #45,#69,#03,#EE,#4E,#23,#2B,#1A,#AC,#1E,#B8,#E5,#EF,#00,#49,#A2
    DB #1B,#BB,#BB,#B7,#77,#1B,#E4,#DA,#04,#47,#05,#A0,#45,#33,#05,#8A
    DB #00,#41,#04,#87,#4C,#31,#2A,#A1,#34,#63,#04,#C2,#00,#29,#BF,#FF
    DB #9D,#FA,#FB,#B1,#F8,#2D,#F5,#FF,#9B,#1C,#CC,#C1,#86,#00,#82,#BA
    DB #D6,#77,#FE,#5C,#91,#0A,#F5,#53,#E6,#1B,#00,#9C,#9F,#A0,#FF,#D9
    DB #48,#8A,#C2,#1A,#5E,#32,#08,#5F,#04,#EA,#00,#FF,#6E,#C1,#0D,#3C
    DB #2A,#AA,#FE,#88,#2C,#CC,#61,#E8,#11,#EB,#11,#1A,#BF,#01,#77,#2B
    DB #E7,#D7,#04,#B1,#1D,#FE,#96,#DA,#C6,#91,#19,#87,#11,#6F,#FF,#F4
    DB #01,#4F,#F8,#3A,#FE,#41,#42,#2B,#E1,#AA,#BE,#CE,#95,#0C,#97,#7B
    DB #9D,#FE,#87,#2D,#A1,#1C,#22,#2A,#A2,#82,#02,#BD,#AC,#FE,#AF,#11
    DB #01,#22,#FE,#8B,#77,#E5,#74,#0E,#9D,#FE,#FE,#C1,#E0,#95,#E4,#9B
    DB #49,#D4,#41,#CB,#26,#4D,#8F,#5D,#FD,#DD,#00,#28,#11,#4D,#21,#09
    DB #A9,#43,#1A,#AA,#BC,#3E,#4E,#4E,#FE,#86,#EF,#BC,#11,#22,#AA,#12
    DB #85,#CC,#F3,#01,#FE,#FD,#00,#A8,#FE,#E5,#1D,#8B,#75,#FF,#9E,#5F
    DB #B4,#82,#44,#AF,#4D,#D1,#E5,#87,#C4,#F5,#01,#FF,#E9,#FC,#1E,#1B
    DB #E1,#BC,#47,#1B,#71,#75,#04,#88,#F1,#FA,#F7,#CF,#06,#1F,#00,#66
    DB #C1,#EB,#FF,#A6,#B7,#0A,#E7,#E7,#77,#7E,#61,#55,#45,#55,#AF,#45
    DB #09,#4A,#AF,#EE,#EB,#00,#57,#4D,#FE,#AA,#E4,#41,#4B,#D4,#8A,#E0
    DB #DF,#E9,#01,#41,#A4,#14,#62,#4E,#1A,#8F,#AB,#13,#02,#58,#62,#FE
    DB #1E,#22,#11,#1F,#95,#BB,#D2,#FF,#A4,#C1,#93,#C2,#2C,#C1,#EA,#FE
    DB #FB,#FD,#FF,#01,#FF,#69,#F9,#54,#BE,#4C,#29,#FE,#C6,#B2,#35,#21
    DB #10,#D4,#CA,#18,#41,#5C,#AE,#FE,#D4,#E7,#B7,#E4,#FE,#0A,#EB,#69
    DB #AB,#3E,#53,#00,#25,#A2,#BF,#FE,#1B,#21,#A2,#2C,#EB,#BF,#BA,#4D
    DB #C3,#04,#97,#E3,#AB,#1A,#A1,#FF,#FF,#B7,#F7,#38,#03,#00,#AA,#E5
    DB #55,#19,#98,#44,#E3,#A1,#9A,#2B,#2C,#14,#5C,#9A,#02,#47,#E0,#DC
    DB #C3,#F4,#C5,#E5,#E7,#00,#FD,#78,#5D,#F9,#A4,#FF,#C2,#E6,#02,#5A
    DB #F1,#1A,#22,#22,#1E,#21,#FB,#93,#FF,#1E,#EF,#07,#A8,#C2,#C2,#3A
    DB #EC,#0D,#2A,#AB,#BB,#F1,#48,#E0,#CD,#FF,#9B,#02,#45,#EE,#FD,#3B
    DB #54,#56,#97,#C1,#C1,#1C,#C2,#AB,#2C,#1C,#6B,#F2,#4E,#65,#3C,#AD
    DB #F4,#87,#DA,#42,#F9,#09,#4D,#D1,#14,#9E,#4D,#2E,#09,#B1,#36,#9F
    DB #F1,#AB,#BE,#02,#20,#AA,#BB,#A1,#FA,#A2,#22,#8A,#1F,#FB,#3E,#FC
    DB #6F,#1C,#22,#C2,#FE,#A1,#CC,#B5,#CA,#68,#BD,#BC,#7F,#C3,#00,#B0
    DB #5E,#E9,#FC,#75,#23,#42,#CC,#6D,#89,#FB,#6F,#FF,#CB,#FB,#5C,#3A
    DB #74,#A1,#DB,#11,#63,#14,#FD,#C3,#04,#68,#FF,#5E,#67,#AF,#FB,#AB
    DB #E3,#06,#B2,#1F,#FA,#15,#03,#01,#22,#68,#FA,#76,#60,#D5,#8B,#F4
    DB #21,#46,#F0,#7F,#39,#FF,#7A,#00,#B7,#22,#FF,#77,#0C,#25,#66,#87
    DB #3B,#BB,#3B,#CC,#C4,#E5,#BB,#3E,#F3,#21,#00,#F3,#E8,#71,#01,#74
    DB #55,#2A,#F2,#D4,#47,#CA,#01,#FD,#1A,#2B,#AA,#DA,#1D,#1B,#BA,#7F
    DB #00,#29,#03,#FF,#75,#76,#5F,#24,#7F,#02,#E8,#00,#2A,#A6,#FB,#8C
    DB #FB,#3D,#F8,#D4,#FD,#92,#04,#0A,#77,#33,#33,#33,#8F,#C4,#00,#4F
    DB #02,#71,#CB,#E2,#4E,#C7,#BE,#31,#7B,#EC,#0E,#11,#37,#28,#E8,#16
    DB #22,#BB,#E1,#3C,#67,#02,#7C,#D5,#FE,#8E,#F1,#12,#00,#28,#CB,#A0
    DB #BA,#A7,#B7,#02,#F7,#19,#77,#E5,#5E,#54,#74,#61,#90,#47,#7E,#77
    DB #7E,#34,#A5,#54,#30,#BE,#BC,#FB,#00,#02,#20,#45,#EE,#F7,#59,#FC
    DB #73,#1C,#EB,#19,#1F,#32,#02,#F6,#1B,#EF,#FE,#0A,#CC,#1A,#AB,#B7
    DB #BF,#F9,#FF,#BD,#05,#FE,#6D,#85,#75,#5B,#FC,#F2,#77,#FD,#6E,#23
    DB #E7,#E4,#82,#0A,#A8,#74,#4F,#D3,#F0,#19,#98,#BC,#A1,#BE,#F0,#DD
    DB #F4,#02,#F8,#83,#00,#B6,#BE,#FB,#BE,#AC,#FE,#C5,#12,#8A,#F6,#CF
    DB #37,#02,#6C,#BF,#82,#FC,#2B,#C1,#2C,#C2,#57,#01,#4F,#B0,#6D,#06
    DB #88,#FE,#A9,#75,#7E,#55,#F8,#FF,#6C,#D4,#65,#DC,#F5,#EF,#36,#2C
    DB #82,#41,#9C,#4D,#82,#01,#14,#12,#BE,#B4,#88,#49,#FE,#49,#E5,#19
    DB #E4,#EE,#FE,#A4,#BB,#DB,#2A,#36,#02,#FB,#1B,#F1,#00,#76,#FE,#22
    DB #12,#22,#69,#22,#2B,#BB,#9E,#B1,#F7,#77,#F6,#BD,#55,#FE,#BF,#54
    DB #00,#7E,#F0,#00,#1F,#0F,#09,#F2,#A1,#11,#7D,#FB,#AB,#E2,#DE,#76
    DB #FE,#09,#41,#11,#99,#9E,#68,#7E,#68,#BE,#3A,#20,#DA,#BC,#03,#FA
    DB #4F,#01,#6D,#E0,#DA,#FE,#FC,#28,#2C,#ED,#BC,#D6,#01,#04,#88,#7F
    DB #FE,#E1,#02,#AF,#44,#00,#6D,#45,#53,#0C,#0A,#9D,#5E,#08,#A3,#14
    DB #A3,#02,#4A,#C4,#DE,#04,#01,#6B,#1E,#E9,#91,#5E,#29,#FD,#5E,#0D
    DB #E8,#22,#1F,#B5,#BB,#CC,#04,#7F,#25,#DC,#5A,#F5,#FB,#77,#0F,#57
    DB #CA,#CA,#00,#8C,#AF,#67,#00,#61,#00,#89,#45,#55,#69,#45,#3C,#00
    DB #A1,#49,#A2,#F4,#9D,#41,#52,#D6,#28,#EF,#37,#EC,#DE,#DA,#0E,#D9
    DB #DE,#19,#F5,#92,#BC,#5E,#02,#A4,#E7,#8E,#FE,#EF,#25,#DE,#BA,#02
    DB #9F,#AF,#DD,#8D,#00,#7A,#FC,#BF,#76,#FF,#88,#AB,#96,#FC,#B7,#81
    DB #75,#E7,#F4,#21,#00,#B7,#45,#02,#20,#93,#99,#1D,#DD,#D4,#D6,#01
    DB #DE,#69,#F4,#77,#DA,#D8,#C3,#CF,#61,#99,#76,#CF,#00,#02,#ED,#1A
    DB #6B,#03,#AF,#7B,#00,#CE,#FF,#E6,#D8,#23,#F2,#BC,#E6,#F7,#5D,#C9
    DB #1D,#E5,#28,#FF,#BE,#DC,#FE,#A1,#7E,#CC,#F2,#A7,#45,#03,#50,#73
    DB #EC,#23,#D9,#96,#5F,#1A,#5A,#03,#14,#1C,#8B,#FE,#49,#77,#FE,#A7
    DB #DA,#1E,#DD,#D9,#4C,#FB,#A2,#FF,#E5,#8B,#7E,#EF,#FE,#F9,#02,#43
    DB #D3,#1B,#07,#7B,#02,#AC,#5F,#F2,#83,#00,#D8,#F9,#CA,#BE,#2A,#00
    DB #25,#BF,#1B,#B7,#75,#FE,#28,#5E,#75,#71,#1E,#DE,#E5,#13,#67,#4D
    DB #91,#D1,#5D,#C9,#5A,#05,#11,#63,#2B,#BA,#4F,#FA,#93,#00,#69,#FF
    DB #9D,#FC,#8A,#63,#FE,#CE,#02,#01,#DC,#B1,#35,#FB,#02,#E4,#D7,#00
    DB #3D,#FF,#D1,#5F,#FC,#CE,#00,#8E,#C3,#F6,#7A,#1A,#82,#55,#DE,#4E
    DB #02,#20,#4E,#D4,#F5,#11,#5F,#E0,#46,#06,#1F,#4C,#DB,#F5,#4D,#4F
    DB #C9,#B3,#FE,#02,#FE,#2B,#1D,#DD,#EC,#DB,#B3,#03,#5E,#33,#02,#E7
    DB #1E,#B1,#FA,#AC,#5B,#32,#40,#DF,#05,#02,#DF,#00,#03,#DF,#CB,#FC
    DB #31,#FF,#63,#BC,#77,#00,#F4,#06,#2C,#F8,#CC,#02,#CD,#FC,#6A,#F2
    DB #49,#7F,#E2,#FE,#3A,#02,#9D,#41,#96,#09,#1E,#BB,#AB,#BA,#B4,#4E
    DB #E1,#F7,#04,#3A,#FE,#6D,#2F,#F5,#07,#EA,#7B,#02,#BF,#4D,#CE,#B7
    DB #0D,#03,#DF,#2C,#02,#F5,#FF,#00,#8A,#FB,#B1,#09,#2A,#2C,#22,#2A
    DB #79,#10,#F1,#85,#83,#F6,#47,#56,#6D,#FD,#4C,#E0,#FD,#3C,#CB,#26
    DB #41,#E8,#F9,#CA,#27,#CB,#A4,#41,#19,#7F,#DC,#FE,#2A,#1E,#C6,#E4
    DB #00,#6F,#EB,#01,#AC,#02,#7B,#F0,#3A,#7D,#FA,#B7,#02,#00,#30,#9A
    DB #02,#BB,#3E,#DE,#F8,#BC,#C8,#E5,#C2,#F7,#00,#D2,#01,#81,#E5,#CF
    DB #2A,#AF,#0C,#4D,#00,#DD,#00,#A1,#41,#D7,#EE,#63,#4E,#1E,#23,#03
    DB #4E,#E5,#FD,#DA,#FE,#B7,#19,#7F,#F5,#00,#9E,#54,#4D,#38,#B1,#BA
    DB #00,#B4,#A1,#FB,#E6,#FA,#9E,#00,#0C,#FE,#F6,#FF,#26,#2A,#22,#C2
    DB #21,#02,#1A,#75,#A6,#5E,#80,#E5,#D1,#A0,#ED,#4E,#9F,#4B,#4B,#BE
    DB #00,#88,#5D,#D1,#76,#FD,#86,#14,#D2,#EB,#02,#2D,#14,#5A,#A6,#8E
    DB #E4,#01,#96,#14,#3E,#1E,#55,#02,#A9,#7B,#BE,#A8,#7E,#B8,#7B,#1F
    DB #00,#BB,#AE,#26,#0D,#0E,#F3,#EA,#3B,#00,#12,#E8,#00,#AB,#CC,#FE
    DB #76,#F6,#28,#5D,#6B,#F4,#F4,#0D,#41,#FB,#F4,#DC,#18,#12,#EA,#2C
    DB #41,#0D,#B2,#F6,#FE,#98,#DD,#95,#55,#ED,#BA,#21,#F6,#D7,#07,#06
    DB #FA,#6E,#EE,#01,#22,#F7,#E7,#8A,#EA,#22,#22,#2A,#1F,#4A,#FF,#A5
    DB #BF,#88,#BF,#FB,#28,#22,#2B,#17,#53,#00,#5D,#89,#EF,#EE,#ED,#31
    DB #63,#EA,#8F,#F6,#00,#CC,#34,#E3,#2C,#53,#02,#E3,#F7,#E9,#D5,#9C
    DB #A0,#AE,#D8,#14,#02,#69,#55,#FF,#11,#03,#F9,#F1,#FE,#9C,#3E,#E7
    DB #3B,#06,#F9,#19,#03,#FE,#6F,#F1,#00,#89,#2A,#E7,#5B,#5F,#C4,#13
    DB #D8,#EA,#87,#5E,#B4,#F6,#F7,#07,#37,#CF,#56,#49,#41,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_5_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 5, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_5:
    ; ZX0 compressed tile_pattern (4096 -> 1833 bytes)
    DB #99,#11,#FF,#14,#44,#41,#F6,#FE,#9A,#4D,#DF,#55,#22,#54,#55,#08
    DB #54,#41,#44,#11,#26,#1D,#E5,#EE,#65,#89,#77,#7E,#EE,#E7,#77,#7F
    DB #77,#86,#7B,#1B,#AA,#20,#1F,#FF,#08,#98,#F7,#FF,#99,#F2,#22,#96
    DB #21,#F7,#77,#80,#55,#6E,#54,#3D,#E8,#45,#EE,#62,#E4,#44,#55,#D4
    DB #14,#E5,#11,#FE,#BB,#44,#1D,#B4,#6B,#FF,#D4,#A1,#AD,#51,#8E,#11
    DB #41,#02,#89,#14,#14,#9B,#E4,#4F,#FE,#C8,#5C,#E2,#7C,#EA,#00,#20
    DB #AC,#BF,#1A,#77,#0A,#12,#0A,#AC,#37,#FE,#07,#9A,#00,#EE,#4A,#51
    DB #68,#14,#0E,#03,#8C,#4C,#A0,#EC,#FC,#94,#44,#4E,#F9,#AC,#9B,#D2
    DB #EE,#E6,#00,#44,#4E,#7E,#69,#F7,#89,#B1,#AA,#3D,#16,#A7,#7F,#DF
    DB #EA,#00,#62,#2F,#77,#06,#91,#75,#FE,#15,#00,#82,#44,#C9,#4E,#EE
    DB #E9,#03,#44,#73,#00,#2A,#4D,#FD,#F4,#F4,#E9,#FF,#C9,#51,#BC,#4E
    DB #AD,#FA,#0F,#00,#E7,#72,#02,#A4,#7F,#76,#DF,#B8,#7F,#00,#29,#F7
    DB #88,#F1,#A2,#28,#1F,#C9,#FE,#0B,#FD,#FE,#1A,#00,#CF,#54,#00,#E3
    DB #E6,#5B,#ED,#33,#43,#00,#A1,#14,#F6,#D7,#07,#BF,#41,#00,#B6,#21
    DB #F5,#96,#28,#5E,#38,#0B,#E3,#E7,#7E,#02,#DA,#23,#03,#FA,#1A,#A1
    DB #4C,#FD,#DE,#04,#E9,#01,#77,#FB,#02,#2B,#B6,#A6,#FC,#4A,#57,#02
    DB #FC,#5F,#4C,#F8,#13,#00,#A2,#54,#4C,#45,#54,#60,#9A,#5D,#D4,#4D
    DB #44,#14,#0E,#F9,#3C,#41,#14,#03,#E1,#F7,#E7,#F6,#4C,#EA,#C4,#44
    DB #EF,#94,#0D,#5E,#E5,#DE,#7E,#9F,#0A,#24,#B7,#CE,#02,#0F,#DD,#24
    DB #00,#F4,#E7,#A5,#03,#1B,#3E,#FC,#BB,#7F,#7B,#94,#88,#00,#9A,#7E
    DB #E4,#45,#09,#93,#5F,#D4,#44,#F2,#F1,#01,#02,#0D,#B2,#08,#FE,#E2
    DB #E7,#CB,#C1,#27,#C4,#EF,#E5,#68,#02,#23,#45,#DE,#EE,#45,#62,#62
    DB #DC,#7E,#F7,#61,#04,#89,#AB,#CF,#3E,#1D,#02,#D2,#FE,#5B,#1C,#E2
    DB #00,#B1,#FF,#17,#EF,#8A,#9D,#33,#FC,#00,#F5,#FE,#4E,#00,#FB,#94
    DB #2C,#5E,#9B,#E3,#5D,#DD,#44,#CA,#1F,#FE,#82,#41,#FD,#E4,#C0,#A2
    DB #E9,#E1,#88,#2A,#D3,#1D,#D5,#9C,#AF,#ED,#FF,#0D,#01,#F5,#FE,#F2
    DB #FC,#03,#92,#F1,#87,#B1,#F7,#07,#04,#4D,#FE,#B0,#FC,#8B,#02,#EF
    DB #F7,#ED,#0A,#E9,#BD,#00,#82,#E9,#99,#44,#F8,#5F,#02,#B6,#41,#47
    DB #F3,#AF,#5D,#EE,#ED,#8B,#E4,#91,#6F,#02,#FD,#FC,#03,#10,#FF,#0F
    DB #02,#EC,#E2,#EB,#9B,#1C,#B2,#45,#99,#6C,#54,#5E,#5E,#6A,#07,#55
    DB #AF,#DD,#F7,#49,#48,#04,#A4,#1F,#3D,#FE,#74,#CA,#02,#2B,#F7,#01
    DB #02,#0D,#E2,#37,#00,#AB,#54,#4B,#68,#3B,#45,#ED,#00,#D6,#FF,#FE
    DB #92,#4E,#99,#91,#11,#14,#D4,#A0,#E4,#FD,#00,#CF,#D8,#E4,#AF,#DF
    DB #03,#62,#05,#D4,#DE,#0C,#6B,#A8,#E7,#BE,#04,#00,#24,#F1,#BF,#A1
    DB #CF,#58,#9B,#1F,#C2,#2F,#BC,#C4,#00,#3A,#56,#E5,#47,#E7,#9B,#75
    DB #5E,#E4,#EB,#E4,#E4,#B4,#D4,#98,#F8,#3A,#41,#99,#9D,#DD,#15,#1D
    DB #2C,#D1,#3C,#0A,#E2,#1D,#00,#92,#E4,#33,#DE,#45,#04,#A6,#54,#FC
    DB #4E,#F8,#36,#06,#C9,#E1,#02,#AE,#F1,#00,#56,#9B,#22,#BE,#CC,#F1
    DB #FE,#7B,#52,#48,#F2,#AF,#E4,#45,#9D,#0A,#5E,#2C,#A7,#4F,#DD,#DD
    DB #D1,#FE,#28,#00,#2A,#41,#D1,#44,#1A,#44,#AA,#4F,#1B,#22,#4D,#4E
    DB #72,#AC,#9B,#DE,#EB,#9F,#D3,#07,#FE,#DF,#FA,#B3,#41,#BA,#02,#A4
    DB #AB,#8E,#99,#9F,#01,#24,#E6,#EF,#22,#FC,#FA,#0A,#F1,#77,#FC,#78
    DB #F4,#B7,#74,#81,#D7,#07,#F0,#39,#03,#86,#4D,#DD,#41,#BA,#9D,#01
    DB #1D,#75,#FB,#1C,#FD,#1D,#9C,#C6,#62,#FC,#E2,#1C,#E1,#D4,#DD,#88
    DB #EE,#74,#75,#E8,#B7,#07,#E4,#FB,#7E,#7F,#BD,#4D,#AA,#00,#9B,#E9
    DB #F9,#99,#9D,#FB,#F6,#66,#6E,#65,#02,#88,#BC,#F2,#32,#C4,#1D,#EB
    DB #14,#E9,#3A,#F0,#5E,#69,#D4,#CB,#36,#BE,#2F,#4C,#02,#AB,#F9,#14
    DB #D1,#FF,#CC,#12,#7A,#25,#E6,#FC,#D4,#BE,#7A,#EE,#BE,#E0,#01,#B9
    DB #D7,#77,#47,#E4,#FE,#B1,#E9,#CC,#08,#7C,#27,#11,#7A,#04,#A2,#71
    DB #3E,#E3,#03,#FF,#88,#66,#D6,#69,#EF,#02,#66,#EF,#FE,#EF,#59,#A7
    DB #1A,#BB,#C1,#FC,#11,#CF,#A2,#00,#BA,#2F,#62,#DE,#44,#2A,#75,#62
    DB #7E,#D4,#47,#26,#DD,#E4,#B3,#4D,#02,#9F,#E9,#9F,#D6,#31,#FF,#1B
    DB #F7,#FE,#5E,#1A,#E8,#D1,#01,#DD,#0A,#B1,#22,#44,#47,#2B,#74,#CC
    DB #FE,#9C,#04,#69,#44,#E3,#FB,#BB,#BB,#05,#CA,#AB,#AA,#00,#9E,#09
    DB #E6,#66,#6E,#96,#88,#6E,#EE,#2A,#F9,#48,#99,#EE,#EE,#BB,#F1,#F2
    DB #20,#FB,#2C,#CC,#BB,#CE,#AF,#FF,#BF,#62,#FF,#FA,#CF,#23,#E4,#47
    DB #7B,#8A,#FD,#5E,#10,#BB,#4E,#0A,#32,#56,#3D,#D9,#61,#03,#CF,#00
    DB #1A,#DA,#FF,#4D,#7C,#00,#A2,#41,#F7,#4D,#A5,#01,#FF,#AE,#99,#FB
    DB #D1,#07,#8B,#32,#B1,#62,#03,#FF,#BA,#6E,#2B,#01,#FE,#AE,#03,#0B
    DB #AF,#3A,#66,#61,#00,#ED,#E9,#02,#E0,#E3,#03,#9D,#EA,#AA,#1B,#B2
    DB #8B,#FF,#C2,#AB,#6E,#B0,#F7,#0D,#FF,#FB,#BF,#F1,#63,#00,#BE,#81
    DB #ED,#4A,#BE,#D4,#00,#FB,#4D,#F3,#4F,#4D,#5E,#07,#02,#A1,#D4,#A7
    DB #11,#EB,#FE,#1D,#3C,#FE,#98,#BD,#11,#4E,#A1,#36,#FA,#FF,#00,#A9
    DB #0A,#FF,#F7,#F6,#7D,#33,#B9,#E1,#03,#AC,#BB,#BA,#BB,#2A,#DA,#01
    DB #46,#78,#F9,#16,#16,#0F,#C7,#FE,#6E,#F9,#77,#0D,#00,#AE,#69,#F3
    DB #C7,#FB,#05,#8A,#00,#2A,#E7,#F0,#3B,#F8,#1F,#7E,#FE,#85,#D1,#99
    DB #F7,#71,#15,#FC,#2E,#EE,#EE,#F8,#03,#FE,#89,#D1,#11,#4B,#1D,#B4
    DB #BE,#2B,#ED,#4B,#F3,#00,#E4,#37,#C7,#FB,#4D,#FE,#BB,#2F,#16,#3D
    DB #D2,#01,#07,#1A,#A2,#22,#BC,#BB,#B9,#74,#9E,#9D,#D9,#EA,#01,#FC
    DB #99,#0A,#FE,#EA,#03,#9F,#2F,#F1,#F2,#FE,#0B,#2A,#5A,#F6,#B3,#F1
    DB #FE,#8F,#FE,#DE,#19,#3A,#06,#EE,#4D,#E4,#4B,#02,#32,#0F,#BE,#D1
    DB #1A,#BA,#1E,#FB,#E4,#AD,#4F,#18,#E4,#39,#05,#2E,#96,#9B,#BE,#1F
    DB #FB,#BF,#FF,#89,#BA,#FE,#AA,#22,#A1,#03,#14,#9B,#9F,#D9,#7F,#F5
    DB #FE,#E9,#00,#9F,#1D,#26,#F5,#2C,#22,#CB,#64,#FF,#1E,#EB,#61,#EE
    DB #47,#DD,#01,#02,#16,#00,#77,#F7,#DA,#00,#11,#00,#C6,#C8,#3D,#1D
    DB #6F,#F1,#41,#F3,#2F,#0A,#9E,#E2,#D0,#1D,#16,#E6,#E9,#CC,#FB,#6F
    DB #54,#09,#88,#FE,#C6,#21,#BB,#08,#AB,#6D,#DD,#CF,#08,#F8,#A6,#9D
    DB #D7,#1F,#03,#86,#FE,#83,#CC,#AD,#00,#1F,#7E,#C4,#1B,#CA,#EE,#01
    DB #4E,#A2,#54,#BF,#45,#FE,#66,#04,#95,#41,#AD,#11,#3E,#FC,#F0,#D4
    DB #A7,#BB,#44,#7B,#9C,#E4,#9A,#B8,#16,#8F,#AC,#CB,#09,#82,#FE,#7E
    DB #2C,#1B,#9E,#18,#68,#9E,#61,#E9,#E7,#91,#6D,#EB,#16,#61,#6D,#0D
    DB #6F,#B5,#E9,#9B,#F5,#03,#00,#B5,#2A,#B4,#A5,#AA,#9D,#AD,#9E,#E1
    DB #6E,#2B,#B5,#F9,#B6,#FE,#0A,#FA,#3F,#03,#4D,#1A,#1D,#F5,#00,#88
    DB #11,#D4,#74,#AC,#09,#55,#D2,#FF,#04,#7A,#04,#28,#1E,#96,#2E,#16
    DB #69,#E1,#BB,#FE,#48,#DC,#1B,#99,#0C,#33,#02,#86,#99,#D9,#9B,#1B
    DB #A2,#43,#E8,#00,#CA,#D3,#FF,#CD,#BD,#B0,#DE,#9D,#46,#CE,#58,#D7
    DB #1D,#08,#A7,#D1,#4D,#00,#6C,#D1,#EC,#0D,#02,#4C,#EE,#E1,#B1,#DE
    DB #6E,#9D,#9D,#EE,#F9,#A6,#79,#E9,#1B,#BA,#00,#29,#AB,#A4,#69,#F6
    DB #06,#5F,#D6,#69,#EE,#61,#11,#1C,#AA,#00,#4A,#CC,#2B,#B1,#8A,#B6
    DB #DD,#74,#74,#BF,#5C,#38,#D3,#33,#6F,#30,#29,#8A,#0C,#14,#4B,#1A
    DB #DB,#4A,#AA,#9B,#02,#5D,#63,#B6,#98,#FC,#A7,#D6,#6D,#D1,#EB,#AA
    DB #96,#00,#0F,#12,#BB,#66,#E9,#99,#7D,#52,#F2,#48,#69,#22,#DE,#61
    DB #DD,#6D,#60,#DC,#FC,#FA,#00,#C2,#7B,#B6,#38,#07,#07,#9E,#F6,#6D
    DB #00,#75,#35,#FD,#3A,#EC,#14,#D9,#04,#28,#1C,#37,#EC,#31,#9E,#12
    DB #0A,#77,#FC,#6D,#61,#E5,#03,#FE,#EE,#57,#ED,#CE,#7B,#04,#7D,#F6
    DB #3A,#60,#66,#E4,#62,#CD,#FC,#D0,#35,#B3,#D5,#83,#D3,#B7,#AA,#F6
    DB #CA,#FE,#41,#00,#3A,#39,#00,#69,#A1,#71,#7A,#E2,#C4,#7A,#FD,#4D
    DB #D0,#CE,#CA,#7F,#EF,#6D,#47,#6C,#00,#4B,#B9,#6D,#14,#CC,#FC,#DF
    DB #FD,#FE,#42,#E0,#B9,#11,#FE,#48,#92,#E9,#99,#F3,#D6,#E0,#35,#07
    DB #77,#4E,#D6,#00,#E9,#BB,#ED,#1B,#B6,#A1,#47,#AB,#DE,#D4,#62,#60
    DB #A3,#C1,#16,#ED,#51,#AE,#F6,#1F,#06,#4B,#A2,#2D,#56,#2E,#6F,#69
    DB #16,#DD,#F9,#E0,#53,#FE,#5C,#8F,#B8,#F8,#FC,#E6,#BE,#98,#85,#00
    DB #A0,#11,#68,#41,#0A,#BA,#4B,#1C,#D2,#7C,#2B,#C1,#CC,#12,#92,#00
    DB #23,#2A,#2A,#AB,#D0,#EE,#90,#FE,#75,#D8,#B8,#D6,#11,#D6,#AE,#96
    DB #41,#49,#94,#C6,#E9,#EE,#E1,#1D,#0A,#24,#8F,#41,#00,#3D,#07,#34
    DB #05,#39,#33,#7C,#1B,#1A,#C2,#00,#B9,#C1,#FE,#47,#43,#B4,#88,#96
    DB #EF,#D5,#B5,#E8,#2C,#3A,#1F,#2A,#6B,#DC,#61,#55,#8F,#0E,#07,#B8
    DB #F6,#00,#BC,#BB,#09,#5B,#44,#95,#7A,#C9,#FE,#79,#04,#53,#D5,#21
    DB #E2,#C1,#25,#EF,#9D,#B5,#4D,#8E,#04,#FE,#18,#97,#D1,#44,#AF,#00
    DB #CB,#FB,#56,#38,#36,#00,#35,#A9,#27,#1B,#62,#1A,#A1,#2B,#1A,#B1
    DB #CA,#1A,#E7,#2A,#D8,#5E,#D3,#04,#69,#A1,#00,#C6,#BC,#C5,#9E,#28
    DB #02,#BA,#41,#01,#4D,#48,#C1,#94,#D4,#60,#1C,#CB,#E0,#8D,#56,#DE
    DB #03,#FD,#28,#63,#A1,#1A,#A2,#FA,#AC,#AB,#8B,#A2,#AA,#5A,#E1,#2B
    DB #4A,#12,#F0,#FE,#1B,#66,#18,#B7,#8A,#D9,#D9,#61,#29,#61,#7A,#01
    DB #41,#76,#F4,#0D,#23,#D6,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_6_SIZE EQU 2560

; SCREEN 5 4bpp bitmap chunk 6, 2560 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_6:
    ; ZX0 compressed tile_pattern (2560 -> 474 bytes)
    DB #28,#4D,#DD,#8B,#A1,#11,#B1,#9F,#FD,#AA,#BF,#BB,#F5,#A3,#FE,#A1
    DB #AA,#9A,#FB,#1A,#1A,#1B,#29,#CA,#1A,#A3,#AA,#A1,#2A,#C1,#11,#FF
    DB #FE,#F5,#FE,#01,#8E,#1D,#DD,#49,#AA,#61,#66,#E1,#D1,#D6,#A9,#14
    DB #FA,#DD,#D4,#44,#FE,#DD,#03,#8F,#DB,#4D,#B4,#00,#8A,#1B,#1A,#20
    DB #F1,#FB,#8A,#1C,#AA,#22,#12,#A2,#86,#1A,#8A,#AA,#A1,#D8,#FE,#12
    DB #E5,#64,#D0,#3C,#38,#F6,#FE,#ED,#41,#FC,#F3,#DF,#04,#D8,#C8,#E9
    DB #14,#B4,#3D,#21,#99,#AA,#B1,#AA,#16,#85,#1C,#7E,#83,#76,#9F,#D6
    DB #16,#61,#02,#12,#BC,#D4,#FD,#E9,#CE,#44,#0D,#DC,#F6,#E7,#1E,#11
    DB #CA,#FA,#E2,#00,#AA,#BB,#D9,#FE,#56,#7F,#16,#DE,#14,#71,#74,#DC
    DB #C4,#5F,#BE,#0D,#EC,#E5,#DA,#B7,#F5,#4D,#D0,#FE,#FD,#EF,#00,#68
    DB #AA,#8A,#1A,#B1,#94,#B1,#34,#DA,#FA,#41,#01,#3B,#3C,#59,#18,#2D
    DB #1D,#D2,#05,#FE,#48,#87,#44,#4D,#DE,#C0,#00,#63,#1C,#A1,#62,#31
    DB #BA,#AB,#58,#62,#FF,#1F,#E1,#E1,#FE,#5B,#1F,#FE,#CF,#EE,#FF,#EC
    DB #E1,#C4,#FE,#2D,#DD,#93,#FC,#88,#27,#14,#41,#6B,#D4,#8E,#F1,#44
    DB #D4,#02,#36,#FA,#3C,#00,#26,#1B,#AA,#BA,#A1,#AA,#A9,#FE,#98,#1F
    DB #C1,#EE,#2A,#EE,#F1,#FF,#FE,#F1,#05,#23,#16,#D4,#35,#FA,#EF,#2F
    DB #4D,#EA,#77,#F4,#3E,#FE,#21,#4D,#44,#63,#4D,#41,#DA,#00,#11,#2A
    DB #BB,#2A,#AB,#A1,#B1,#08,#2C,#11,#CF,#C1,#E1,#87,#F9,#1F,#F1,#1F
    DB #1E,#1E,#30,#ED,#85,#0E,#68,#14,#5E,#1E,#63,#41,#1D,#93,#E6,#94
    DB #FE,#F6,#00,#5E,#1C,#22,#AB,#CB,#CB,#CC,#C1,#26,#E1,#FC,#02,#2A
    DB #41,#14,#1D,#DD,#C6,#EF,#2C,#1A,#7E,#D1,#E9,#20,#14,#14,#DD,#94
    DB #A6,#A1,#72,#1B,#B1,#F1,#2A,#76,#EB,#04,#91,#1E,#1E,#CC,#EE,#CE
    DB #E1,#1C,#EF,#1F,#C1,#1F,#1F,#EC,#CE,#CF,#FC,#F1,#FC,#4F,#39,#C8
    DB #03,#FC,#4D,#F7,#D3,#E4,#8F,#B6,#00,#21,#92,#11,#2A,#AB,#1A,#B1
    DB #A6,#CE,#1C,#CF,#CC,#82,#1E,#FF,#1E,#11,#3B,#F2,#B9,#01,#F1,#1C
    DB #03,#D0,#C4,#DD,#FE,#F5,#9A,#FE,#00,#F5,#AB,#BA,#1A,#95,#FE,#5C
    DB #FD,#04,#D8,#7D,#00,#F9,#F7,#00,#11,#D6,#24,#F5,#FE,#6D,#B1,#E8
    DB #00,#AA,#AF,#AA,#FE,#41,#37,#00,#71,#8F,#07,#1C,#CC,#00,#45,#30
    DB #62,#33,#BB,#BA,#E0,#FE,#9E,#2A,#22,#2C,#F3,#6A,#AC,#CC,#22,#CA
    DB #F4,#FE,#88,#A1,#11,#11,#05,#D5,#55,#60

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
