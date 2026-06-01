; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation backend
; Project: bionic2
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
    ; ZX0 compressed tile_pattern (4096 -> 89 bytes)
    DB #85,#00,#55,#55,#A1,#11,#14,#48,#84,#14,#11,#14,#6F,#16,#F2,#7E
    DB #EE,#EF,#A1,#FC,#F2,#6F,#61,#CA,#89,#16,#61,#FD,#DE,#7A,#7A,#A1
    DB #10,#5F,#33,#DB,#F0,#A1,#E8,#E6,#1A,#6D,#1B,#E8,#E8,#1A,#7E,#D4
    DB #87,#B1,#F9,#DC,#FE,#05,#88,#15,#55,#3A,#22,#63,#45,#55,#51,#E0
    DB #E4,#E8,#54,#11,#B6,#14,#DC,#89,#A1,#A1,#E3,#41,#A1,#55,#F9,#61
    DB #61,#FC,#D5,#D2,#91,#FE,#35,#55,#58
SCREEN5_PRESENTATION_BITMAP_CHUNK_1_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 1, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_1:
    ; ZX0 compressed tile_pattern (4096 -> 1542 bytes)
    DB #88,#11,#81,#14,#11,#09,#82,#1A,#11,#55,#7A,#54,#41,#16,#EE,#E9
    DB #41,#E5,#45,#E3,#F1,#1B,#14,#A6,#F6,#11,#A1,#45,#AE,#51,#F8,#FF
    DB #CB,#F7,#FE,#98,#11,#61,#11,#40,#63,#B1,#15,#99,#00,#9D,#44,#11
    DB #15,#F3,#97,#E6,#E8,#00,#1A,#09,#86,#11,#14,#44,#2A,#51,#1A,#66
    DB #E1,#FE,#56,#86,#CC,#1B,#C4,#44,#41,#1C,#CC,#BE,#E5,#44,#E6,#A9
    DB #C1,#11,#AB,#14,#A1,#AF,#DB,#C1,#D2,#A1,#44,#EE,#EE,#00,#11,#69
    DB #61,#A2,#81,#3E,#B6,#66,#FE,#E6,#8C,#01,#16,#66,#6A,#23,#41,#86
    DB #A2,#E6,#6A,#14,#BB,#1B,#F5,#B4,#96,#01,#E6,#88,#6E,#14,#C6,#66
    DB #6B,#3F,#E3,#FE,#FF,#EF,#97,#00,#16,#85,#E1,#08,#83,#16,#B1,#AE
    DB #39,#E8,#FE,#2C,#E4,#FB,#23,#F7,#DF,#18,#8A,#E6,#B1,#A2,#1B,#D7
    DB #6C,#E5,#9A,#C9,#61,#14,#C8,#2A,#8A,#14,#B8,#F8,#FE,#DF,#8E,#16
    DB #92,#D7,#B9,#00,#45,#A2,#1E,#92,#1C,#93,#81,#E2,#1D,#1A,#27,#8C
    DB #44,#3F,#1B,#2F,#00,#89,#8B,#11,#8A,#8B,#11,#9A,#F8,#A8,#AF,#8E
    DB #E5,#88,#00,#86,#81,#1A,#21,#1A,#61,#28,#1C,#4A,#41,#54,#F6,#A6
    DB #C8,#C1,#F8,#28,#18,#EE,#62,#13,#08,#8A,#AE,#EE,#A6,#FA,#37,#F8
    DB #89,#1E,#E8,#8E,#EE,#6A,#E7,#C1,#DA,#E5,#E4,#6D,#B1,#A9,#F8,#81
    DB #9E,#8B,#EE,#EE,#F7,#FA,#B1,#00,#68,#CF,#B3,#FE,#45,#B9,#A1,#0A
    DB #FD,#F6,#23,#64,#62,#12,#A7,#1A,#86,#14,#1A,#BE,#1C,#01,#1C,#8D
    DB #1C,#68,#FA,#13,#00,#B1,#1A,#B8,#7B,#F9,#61,#AE,#0D,#B6,#00,#D2
    DB #B7,#74,#88,#16,#81,#D7,#6E,#24,#FC,#1F,#20,#E1,#EA,#F8,#00,#89
    DB #6A,#1C,#60,#24,#44,#41,#68,#88,#C1,#12,#77,#00,#23,#8E,#41,#CE
    DB #00,#F8,#B3,#A1,#8E,#3B,#B1,#86,#4A,#FC,#90,#61,#88,#1D,#F6,#55
    DB #EE,#13,#16,#7E,#63,#16,#88,#AE,#FB,#6A,#1A,#F8,#00,#88,#E1,#11
    DB #9A,#B4,#11,#1B,#68,#21,#2F,#8B,#E4,#FF,#F8,#15,#BE,#D4,#76,#19
    DB #B1,#16,#8A,#A8,#61,#36,#00,#17,#E0,#D5,#00,#5E,#18,#B6,#66,#77
    DB #E8,#6C,#8A,#B8,#18,#BB,#11,#AF,#11,#A8,#BB,#FF,#BC,#27,#14,#24
    DB #FE,#39,#00,#9F,#1F,#EB,#68,#F9,#E1,#08,#E2,#61,#A1,#2C,#E7,#8B
    DB #F2,#D4,#FE,#26,#16,#BB,#BA,#B8,#81,#EE,#83,#8B,#B8,#8A,#B8,#1C
    DB #1A,#8D,#A1,#44,#D9,#EF,#2C,#AC,#16,#B8,#E6,#01,#A9,#86,#68,#81
    DB #CE,#CC,#07,#4C,#68,#86,#C1,#B1,#1A,#AA,#AB,#BA,#BF,#9C,#8E,#BD
    DB #F9,#16,#02,#16,#1A,#8A,#6B,#BB,#BB,#A6,#D7,#19,#64,#9B,#8B,#BF
    DB #FB,#ED,#13,#FE,#E9,#00,#B8,#72,#22,#AE,#C1,#DF,#FA,#E8,#FB,#00
    DB #E8,#4E,#F9,#C1,#CD,#A1,#8D,#99,#BB,#B1,#8D,#F3,#88,#BA,#ED,#08
    DB #86,#0D,#F2,#16,#72,#1E,#18,#AB,#20,#F4,#7B,#F8,#04,#2D,#FC,#BA
    DB #FA,#21,#31,#B4,#00,#A4,#2D,#41,#A3,#B1,#6D,#22,#B4,#01,#89,#EB
    DB #FA,#88,#F6,#09,#F9,#E6,#C1,#8D,#AA,#6B,#AC,#B8,#AE,#01,#EA,#DD
    DB #37,#81,#E1,#00,#44,#B6,#AB,#17,#FA,#BA,#09,#E9,#86,#63,#A8,#BB
    DB #53,#57,#F6,#44,#F7,#3F,#6E,#41,#43,#47,#A0,#01,#61,#29,#1C,#AA
    DB #86,#4B,#0F,#E7,#06,#DE,#BB,#54,#C6,#5F,#9F,#8F,#1E,#85,#B9,#DD
    DB #81,#2A,#A5,#C1,#1E,#D2,#46,#73,#68,#BF,#FF,#01,#62,#01,#18,#81
    DB #09,#8C,#BB,#A1,#1F,#1E,#41,#01,#A8,#8E,#E6,#A6,#41,#24,#44,#41
    DB #88,#11,#F8,#2F,#49,#EF,#E3,#AD,#BD,#15,#54,#07,#F9,#7B,#F1,#A5
    DB #BA,#EF,#C1,#97,#B8,#30,#48,#84,#14,#41,#79,#B4,#5D,#B3,#00,#71
    DB #AD,#08,#A6,#AB,#03,#6A,#8B,#0F,#4D,#35,#AA,#01,#18,#8B,#AA,#16
    DB #6C,#03,#0F,#01,#12,#EA,#01,#8A,#9A,#18,#C6,#92,#6E,#44,#44,#BB
    DB #BB,#B1,#8A,#BB,#BF,#A2,#86,#16,#8A,#A5,#86,#22,#47,#E1,#04,#7C
    DB #4F,#CB,#00,#FB,#BA,#69,#A8,#F0,#7C,#B6,#88,#68,#EB,#6E,#57,#1C
    DB #23,#7D,#6C,#CC,#66,#01,#6A,#F8,#8E,#67,#69,#CC,#CB,#6F,#DF,#E1
    DB #00,#8F,#1B,#68,#D6,#FE,#F9,#01,#D6,#A2,#CC,#3B,#A1,#6F,#8E,#9D
    DB #A7,#68,#AA,#86,#1B,#FC,#64,#00,#4B,#74,#E9,#00,#14,#A4,#11,#D2
    DB #23,#B7,#6B,#7C,#B2,#8B,#67,#0B,#BB,#FB,#BF,#FB,#26,#33,#66,#66
    DB #68,#48,#FD,#41,#C6,#CD,#E9,#73,#1A,#E3,#CF,#00,#BF,#2B,#E6,#D7
    DB #BC,#93,#11,#AF,#BB,#FF,#FB,#AA,#C7,#87,#F9,#30,#89,#24,#20,#1F
    DB #11,#9D,#00,#6F,#80,#00,#22,#88,#B8,#D3,#17,#5A,#08,#AD,#68,#AA
    DB #3C,#ED,#5D,#1C,#18,#AB,#6E,#19,#AE,#22,#1A,#06,#C0,#BA,#0A,#00
    DB #2A,#8B,#1A,#A6,#5F,#CF,#EB,#D6,#89,#F1,#A4,#9F,#8D,#AB,#B8,#68
    DB #89,#16,#1C,#44,#CD,#04,#DA,#FF,#1E,#4C,#A3,#7A,#61,#AF,#28,#F1
    DB #6A,#EE,#FF,#BF,#01,#92,#61,#DA,#B1,#19,#68,#6F,#B6,#E8,#AA,#A1
    DB #1F,#E2,#01,#A1,#1B,#6B,#A6,#1F,#B2,#E8,#00,#8B,#7A,#98,#D4,#BA
    DB #B2,#9C,#00,#A0,#14,#E4,#00,#1A,#47,#C0,#96,#EA,#24,#66,#B1,#84
    DB #E7,#16,#FF,#F6,#61,#CB,#EB,#EE,#EB,#BB,#BE,#EB,#1E,#AE,#EE,#0B
    DB #98,#03,#2F,#8F,#F2,#F6,#9A,#1C,#EE,#EC,#78,#CE,#EE,#E1,#E5,#BB
    DB #EB,#BE,#FB,#BC,#06,#16,#82,#6B,#FF,#FB,#A1,#5E,#00,#54,#D1,#6C
    DB #78,#09,#F4,#08,#F6,#6F,#A1,#76,#82,#AA,#92,#A1,#85,#A1,#76,#A3
    DB #F7,#FA,#EC,#AE,#5E,#41,#00,#50,#A4,#14,#2D,#B1,#02,#3E,#3B,#F8
    DB #9F,#70,#F9,#6F,#27,#6B,#F4,#FE,#D1,#E2,#C4,#1B,#EF,#E5,#FF,#45
    DB #C7,#FD,#92,#FF,#4E,#0D,#DA,#EC,#D0,#57,#FC,#9D,#AB,#A1,#14,#02
    DB #EA,#61,#90,#16,#61,#44,#54,#44,#1B,#E1,#60,#02,#F1,#45,#5D,#1B
    DB #02,#1C,#A0,#44,#F9,#EE,#EC,#41,#1A,#16,#F4,#57,#1A,#F1,#CF,#5A
    DB #D7,#A1,#1E,#D7,#E7,#CA,#24,#F1,#DB,#A1,#5D,#FC,#DC,#F3,#53,#E8
    DB #26,#45,#77,#44,#04,#A4,#EE,#A0,#16,#5A,#1C,#52,#D9,#41,#56,#DB
    DB #38,#AE,#EF,#14,#E3,#C2,#1A,#64,#29,#61,#DA,#01,#A1,#D4,#DD,#9E
    DB #5D,#4A,#F8,#D7,#F6,#F3,#9A,#EA,#C4,#1B,#E5,#74,#00,#B0,#C1,#E2
    DB #DE,#1E,#1E,#5A,#66,#44,#DE,#CB,#AC,#31,#8D,#73,#C4,#41,#1B,#5A
    DB #B0,#65,#1B,#6D,#E3,#14,#22,#03,#BA,#44,#C7,#23,#E8,#E1,#CF,#BB
    DB #AF,#BC,#01,#FB,#F5,#FF,#CE,#FF,#E0,#FE,#B9,#ED,#4B,#DC,#BB,#11
    DB #9E,#B4,#EE,#3D,#E6,#F7,#EE,#48,#5A,#EE,#F0,#00,#A4,#E1,#F1,#73
    DB #D7,#A8,#3C,#73,#6B,#1F,#1F,#50,#FA,#63,#46,#8E,#CA,#BD,#3E,#B1
    DB #2A,#00,#8A,#AB,#BB,#A3,#61,#9E,#36,#00,#1E,#14,#62,#BA,#B1,#FC
    DB #95,#00,#F7,#8B,#3C,#64,#AA,#C7,#9D,#99,#F9,#99,#D6,#14,#92,#CE
    DB #76,#66,#61,#61,#D8,#4A,#C1,#5E,#E2,#5A,#1B,#EA,#0B,#A1,#FB,#CA
    DB #60,#4A,#16,#FD,#FE,#C4,#47,#F9,#01,#A6,#BB,#AC,#1C,#1E,#08,#96
    DB #11,#1A,#84,#AB,#B9,#1A,#F0,#B3,#AE,#A0,#DF,#EE,#86,#54,#1E,#1C
    DB #33,#EF,#9D,#D6,#19,#37,#6D,#D1,#20,#7A,#01,#66,#D6,#00,#02,#25
    DB #6F,#7E,#F8,#C3,#C6,#BF,#CA,#47,#6B,#B5,#3C,#E3,#3F,#01,#A4,#1A
    DB #8D,#F9,#B4,#41,#FF,#DA,#0D,#4D,#BE,#E9,#C1,#00,#AA,#AB,#BA,#2A
    DB #BA,#E1,#AB,#5A,#AA,#EC,#EC,#A7,#97,#AC,#8D,#DA,#D7,#A3,#4A,#61
    DB #9A,#31,#E9,#D6,#DD,#D1,#66,#76,#00,#4C,#0D,#02,#61,#9F,#CC,#EE
    DB #C1,#1E,#EC,#AE,#C1,#CC,#79,#83,#9C,#58,#EF,#FF,#5E,#09,#5E,#E4
    DB #88,#11,#8F,#B1,#1E,#2F,#74,#E9,#CF,#E9,#08,#6D,#1A,#43,#0B,#6D
    DB #E5,#21,#63,#7A,#7D,#C6,#FF,#BC,#AB,#9B,#88,#12,#2D,#B7,#77,#3C
    DB #7F,#82,#23,#1C,#72,#7C,#DD,#5C,#E0,#FD,#00,#C5,#60,#10,#65,#87
    DB #61,#E1,#EE,#E1,#1C,#C1,#EF,#07,#27,#4B,#26,#2F,#12,#47,#3F,#FE
    DB #F7,#D9,#57,#45,#BF,#AC,#44,#11,#18,#FE,#E7,#F2,#00,#2F,#12,#ED
    DB #50,#EC,#0B,#B2,#3C,#1D,#99,#63,#A8,#7B,#B2,#4A,#C3,#F9,#D0,#E1
    DB #AF,#E0,#B2,#33,#CC,#1C,#DD,#23,#92,#F7,#23,#1D,#D6,#25,#16,#EC
    DB #CF,#03,#F9,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_2_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 2, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_2:
    ; ZX0 compressed tile_pattern (4096 -> 2544 bytes)
    DB #80,#11,#60,#26,#1C,#E1,#18,#6C,#33,#31,#C1,#11,#12,#88,#AA,#88
    DB #BA,#11,#AB,#BB,#B1,#41,#BB,#24,#E4,#BA,#B1,#1A,#BB,#A1,#41,#F9
    DB #AF,#BB,#14,#11,#AB,#BA,#E1,#CA,#E7,#A3,#FA,#11,#A1,#9E,#E1,#B1
    DB #C6,#12,#DF,#39,#C1,#4A,#F9,#EE,#14,#44,#44,#9B,#41,#A3,#78,#A4
    DB #44,#4C,#E7,#FE,#A4,#4B,#AC,#5B,#1A,#16,#A3,#C7,#C1,#44,#5E,#D1
    DB #1C,#33,#CC,#CD,#DD,#64,#41,#99,#14,#E6,#C6,#8B,#A6,#22,#27,#66
    DB #66,#D6,#00,#02,#61,#CE,#F7,#16,#81,#CC,#FF,#71,#08,#28,#8A,#AB
    DB #AA,#BB,#FE,#BA,#AA,#13,#F9,#FF,#6F,#AB,#1B,#AB,#01,#96,#F1,#14
    DB #1C,#AA,#A8,#C1,#11,#EA,#BB,#B1,#E9,#8E,#8A,#01,#AA,#AA,#BA,#AA
    DB #C7,#C1,#F8,#F9,#1F,#AE,#BB,#F1,#4C,#DF,#62,#AC,#CC,#CB,#21,#14
    DB #1A,#E1,#B7,#79,#C7,#CC,#71,#4C,#C4,#41,#DE,#C2,#C1,#6D,#46,#2E
    DB #82,#1F,#FF,#16,#88,#1E,#00,#A4,#61,#B7,#1C,#F0,#18,#AB,#C1,#E1
    DB #17,#7D,#88,#AA,#24,#FF,#EE,#18,#33,#44,#67,#DB,#A8,#FE,#D9,#FD
    DB #83,#2E,#BA,#A8,#B4,#4B,#8A,#A8,#F1,#88,#AA,#8F,#AA,#8B,#00,#AF
    DB #1E,#DF,#F6,#01,#FF,#E8,#88,#14,#4B,#BA,#8A,#FC,#DB,#A1,#BE,#E1
    DB #FE,#A6,#A1,#1A,#7C,#CC,#1C,#4D,#1D,#DD,#2F,#D4,#44,#36,#49,#1D
    DB #FE,#68,#61,#41,#66,#A6,#04,#66,#91,#61,#57,#62,#D0,#09,#EE,#C1
    DB #1E,#CE,#20,#7A,#1A,#BF,#FB,#FF,#A1,#1B,#88,#8B,#14,#F8,#1F,#B8
    DB #88,#A8,#88,#8A,#01,#8E,#F7,#B1,#4B,#F1,#AA,#11,#B8,#2E,#14,#4E
    DB #00,#A2,#A8,#AB,#AB,#8A,#BE,#AB,#88,#FF,#F3,#EF,#E1,#AC,#B1,#BF
    DB #FB,#AB,#CF,#EF,#E6,#FE,#8A,#1C,#CC,#B7,#13,#03,#86,#38,#4B,#14
    DB #1C,#C7,#1E,#7E,#16,#FE,#09,#FE,#02,#17,#DB,#08,#86,#A0,#00,#BE
    DB #68,#6B,#BB,#F1,#4D,#2B,#8F,#4A,#60,#8E,#86,#E4,#30,#8F,#8E,#1A
    DB #10,#FA,#37,#F9,#8A,#76,#18,#EE,#9B,#8A,#DF,#F2,#18,#D7,#22,#8F
    DB #C1,#14,#F1,#FF,#FE,#D9,#FF,#B8,#E2,#B7,#DB,#81,#1A,#03,#17,#67
    DB #95,#CC,#77,#3C,#36,#FB,#F8,#66,#EE,#EC,#77,#BC,#41,#00,#A1,#66
    DB #08,#9B,#EF,#E1,#41,#58,#C0,#D6,#7D,#7A,#FB,#E1,#1A,#2A,#68,#B4
    DB #41,#68,#FE,#C1,#B8,#53,#EF,#00,#A2,#8B,#AF,#86,#1C,#E9,#FE,#85
    DB #30,#D9,#27,#91,#44,#CF,#01,#D6,#9B,#91,#14,#C6,#88,#F1,#D8,#FE
    DB #E9,#E4,#9B,#53,#B1,#1B,#C4,#41,#31,#44,#14,#D1,#33,#2C,#CC,#4D
    DB #D1,#37,#7A,#FE,#EC,#D6,#DD,#D8,#74,#00,#3C,#FE,#5B,#16,#4D,#03
    DB #2B,#5C,#1B,#EE,#75,#63,#41,#6D,#B7,#B4,#50,#C8,#6D,#6B,#98,#88
    DB #E8,#88,#6C,#12,#7E,#34,#00,#6A,#94,#AA,#4B,#89,#A1,#C6,#AA,#6E
    DB #45,#55,#55,#41,#E8,#86,#91,#3E,#55,#44,#FF,#EF,#1E,#86,#E1,#16
    DB #17,#73,#0F,#1C,#14,#DF,#12,#BF,#22,#8B,#FF,#12,#3C,#9D,#E3,#E7
    DB #CE,#EE,#2D,#45,#16,#CA,#02,#41,#4C,#75,#F8,#E7,#D0,#65,#41,#EF
    DB #BB,#BF,#FF,#FF,#EB,#A1,#16,#21,#44,#53,#7C,#F8,#EB,#63,#01,#E6
    DB #A3,#F2,#1E,#1F,#ED,#4B,#83,#68,#9C,#28,#E3,#D9,#01,#14,#26,#E3
    DB #B7,#8E,#6B,#1A,#14,#8B,#AF,#61,#44,#3C,#6A,#8A,#EF,#11,#A1,#6B
    DB #4D,#D4,#D1,#4D,#2B,#FE,#14,#8A,#D9,#C2,#16,#72,#FE,#FE,#E7,#DD
    DB #CA,#C1,#02,#27,#86,#D8,#36,#A1,#00,#58,#94,#1E,#F1,#83,#86,#6B
    DB #FF,#1E,#73,#FF,#7B,#2B,#43,#14,#BF,#5A,#F1,#39,#A7,#01,#18,#BD
    DB #B1,#1F,#D9,#36,#4F,#18,#B3,#11,#F0,#AA,#86,#8F,#AD,#A6,#EB,#E5
    DB #C1,#AC,#6E,#1A,#00,#3F,#F9,#D0,#A8,#8B,#3A,#BC,#E4,#DD,#44,#34
    DB #8B,#DD,#41,#53,#C4,#83,#CF,#1F,#CE,#43,#5A,#03,#41,#62,#68,#99
    DB #EC,#D1,#14,#C2,#00,#24,#1C,#EF,#68,#66,#FA,#2F,#00,#F1,#1E,#4D
    DB #C6,#53,#19,#9B,#44,#6A,#A1,#01,#1E,#BD,#18,#1B,#BE,#BE,#41,#00
    DB #33,#F8,#BF,#98,#F2,#66,#11,#4C,#68,#86,#F6,#01,#B0,#E6,#E0,#C8
    DB #B1,#2B,#F0,#CC,#D4,#B1,#B0,#23,#45,#B1,#03,#41,#E5,#06,#88,#FF
    DB #EE,#41,#2C,#4E,#14,#16,#65,#68,#D9,#FF,#96,#6D,#64,#D7,#1C,#EC
    DB #E1,#C1,#CC,#F1,#E2,#72,#41,#A1,#AA,#B2,#A1,#AF,#FF,#F1,#1A,#29
    DB #2B,#E4,#12,#89,#6E,#A9,#19,#20,#EF,#E4,#E3,#DB,#B3,#0B,#8E,#AA
    DB #01,#1B,#8A,#48,#96,#89,#11,#2A,#A1,#1A,#8A,#89,#11,#E6,#E2,#02
    DB #AA,#8F,#1B,#5D,#71,#F1,#D1,#16,#96,#11,#1D,#B5,#06,#72,#EB,#93
    DB #28,#FC,#FE,#CA,#14,#E1,#03,#96,#A9,#88,#D2,#9F,#9D,#86,#00,#06
    DB #65,#1F,#96,#A1,#DB,#B8,#49,#FE,#E3,#1D,#E9,#99,#62,#D7,#B9,#9B
    DB #6E,#99,#F7,#E2,#1B,#ED,#99,#9B,#82,#A1,#CB,#99,#9C,#89,#B2,#1E
    DB #8E,#F9,#99,#FE,#DE,#03,#F0,#7B,#B1,#1F,#BF,#DA,#A1,#C7,#FE,#CB
    DB #FE,#69,#0A,#A3,#C1,#71,#1D,#0E,#D1,#19,#61,#14,#04,#B7,#C1,#01
    DB #27,#E3,#C4,#1C,#C4,#7D,#4A,#83,#01,#DD,#D6,#6D,#D6,#C9,#F3,#FC
    DB #66,#18,#AE,#1C,#BB,#CE,#19,#E1,#18,#FE,#A6,#66,#08,#68,#BB,#AB
    DB #FF,#B0,#FB,#DA,#B4,#1A,#1A,#A1,#0A,#B1,#62,#1B,#6A,#79,#CA,#3D
    DB #E8,#A4,#1B,#2A,#27,#DA,#1D,#03,#69,#D9,#2F,#AA,#CC,#2C,#C1,#41
    DB #28,#F9,#9C,#9E,#3C,#44,#01,#8A,#8D,#66,#A4,#86,#7E,#EC,#65,#C1
    DB #CE,#EE,#BA,#D1,#01,#6A,#9A,#BB,#FC,#CF,#25,#1A,#B1,#89,#16,#A1
    DB #A1,#AC,#A7,#61,#E1,#53,#92,#FF,#D6,#E6,#68,#1A,#58,#36,#BC,#C1
    DB #1D,#D4,#EF,#28,#16,#91,#98,#C3,#CC,#ED,#3C,#FE,#E9,#E1,#26,#18
    DB #75,#FE,#66,#DD,#20,#FE,#66,#1E,#EE,#E1,#88,#CC,#E1,#19,#A1,#66
    DB #6A,#AA,#E8,#E1,#1F,#FB,#B8,#AB,#AE,#03,#A6,#66,#6C,#C6,#A4,#CA
    DB #CC,#6C,#CA,#C4,#4B,#66,#CC,#CC,#CB,#4A,#A7,#DA,#B6,#D6,#B6,#A7
    DB #D1,#6A,#AC,#E0,#14,#4E,#19,#D5,#2B,#C6,#6C,#6B,#8E,#E3,#CC,#B9
    DB #E8,#BF,#CA,#D5,#B3,#C1,#FF,#D3,#31,#13,#DA,#05,#A2,#32,#1C,#3C
    DB #09,#A0,#D1,#C7,#36,#91,#13,#32,#E9,#E3,#00,#17,#7E,#B4,#C1,#46
    DB #60,#00,#6D,#C7,#4C,#FC,#35,#8B,#EB,#68,#AB,#38,#FB,#35,#C7,#AA
    DB #86,#C6,#9B,#CC,#44,#44,#E2,#F9,#F7,#4E,#C4,#6C,#CE,#4B,#61,#6D
    DB #7F,#7D,#FE,#17,#A1,#06,#B9,#72,#7E,#E1,#EC,#43,#D8,#1C,#74,#A2
    DB #1C,#2A,#3F,#71,#C1,#9D,#E6,#B8,#1D,#1F,#E7,#B7,#1D,#15,#2E,#71
    DB #99,#41,#29,#33,#C1,#28,#DD,#1E,#EE,#E9,#E1,#FC,#99,#31,#16,#B3
    DB #CF,#CC,#CE,#03,#D7,#00,#D8,#8D,#08,#76,#B6,#F1,#8F,#66,#57,#86
    DB #16,#AB,#8D,#86,#E6,#4B,#A6,#89,#13,#74,#44,#FF,#F2,#F8,#9F,#ED
    DB #DD,#99,#49,#27,#7C,#23,#99,#C7,#77,#9D,#F9,#43,#73,#CC,#FA,#BF
    DB #90,#41,#84,#F5,#DC,#3F,#13,#71,#1F,#FC,#D6,#61,#DD,#44,#05,#DA
    DB #29,#02,#2A,#69,#91,#7C,#A8,#1D,#C5,#7F,#F7,#82,#4D,#71,#FE,#1F
    DB #CD,#2B,#1E,#B8,#2F,#4E,#86,#FC,#C5,#24,#E1,#FE,#2D,#66,#E2,#FA
    DB #AA,#88,#BE,#86,#89,#01,#F2,#D4,#0A,#38,#47,#75,#01,#6A,#55,#55
    DB #5E,#DD,#D9,#9D,#A2,#4C,#06,#6D,#D6,#6E,#11,#E7,#71,#17,#74,#11
    DB #AD,#72,#EE,#FF,#6E,#1E,#96,#9C,#7C,#CF,#3C,#1F,#71,#D1,#83,#D4
    DB #1D,#7E,#41,#F0,#7A,#90,#E1,#9D,#66,#C7,#C1,#11,#4F,#13,#FF,#77
    DB #ED,#F1,#C3,#E1,#BA,#33,#33,#01,#71,#4A,#66,#6A,#1C,#81,#1F,#C6
    DB #06,#7F,#F8,#79,#CC,#C4,#14,#46,#6A,#EB,#07,#00,#D8,#E9,#2F,#03
    DB #44,#99,#44,#C7,#F7,#A3,#55,#EC,#00,#E4,#31,#7D,#87,#75,#C4,#C7
    DB #FF,#33,#31,#67,#15,#4C,#32,#3C,#0F,#40,#46,#37,#A2,#D1,#D2,#24
    DB #98,#31,#FD,#4E,#D7,#AF,#D9,#DF,#4D,#8A,#69,#FB,#91,#33,#2E,#DF
    DB #B1,#72,#FF,#FC,#8F,#03,#1A,#13,#C1,#D4,#E1,#41,#C4,#C4,#9E,#FC
    DB #9E,#D8,#00,#5F,#75,#CE,#D6,#21,#E2,#66,#03,#68,#D1,#D4,#D7,#6D
    DB #27,#88,#00,#A2,#45,#CF,#77,#75,#B5,#79,#6C,#4A,#95,#01,#BF,#DE
    DB #1D,#D9,#DD,#D8,#81,#E1,#37,#F3,#37,#2C,#14,#44,#1C,#32,#01,#21
    DB #12,#18,#B8,#F4,#01,#6B,#CC,#1F,#F4,#FF,#FE,#41,#47,#69,#4B,#FA
    DB #6A,#35,#89,#32,#12,#BC,#03,#2D,#DD,#EE,#93,#FF,#CD,#FE,#17,#E1
    DB #19,#DE,#F8,#45,#AF,#FE,#0F,#D8,#0F,#0B,#3F,#F0,#69,#D2,#51,#B4
    DB #9E,#DD,#8D,#88,#01,#96,#8D,#0B,#57,#75,#75,#77,#88,#02,#1A,#DD
    DB #47,#19,#99,#D9,#88,#DE,#EC,#33,#D3,#77,#09,#46,#59,#3D,#22,#22
    DB #F5,#22,#00,#4E,#E4,#DC,#21,#41,#FE,#1D,#C3,#1D,#D1,#43,#C1,#4C
    DB #1D,#79,#FE,#73,#68,#98,#17,#7C,#14,#15,#DE,#8D,#63,#FD,#7E,#69
    DB #9D,#03,#D6,#13,#1D,#5D,#FB,#93,#30,#1D,#FA,#88,#EE,#F1,#75,#89
    DB #EE,#87,#44,#EB,#A1,#5A,#18,#EC,#4D,#6D,#81,#4F,#4C,#2F,#25,#4F
    DB #00,#BE,#77,#FE,#E2,#9E,#00,#4A,#15,#4D,#FF,#99,#DD,#CE,#02,#32
    DB #23,#22,#23,#CC,#44,#EC,#C2,#33,#FF,#E4,#00,#23,#EF,#D1,#3C,#1F
    DB #EE,#FF,#FD,#FD,#41,#CC,#CF,#C4,#4E,#3A,#69,#66,#CF,#CC,#D9,#E4
    DB #DF,#C3,#AF,#70,#27,#37,#E6,#99,#D6,#1C,#71,#C4,#C7,#FB,#EA,#28
    DB #3D,#C5,#F5,#47,#10,#5F,#CC,#E3,#31,#CB,#BC,#1B,#6E,#EE,#C5,#1C
    DB #01,#86,#D8,#08,#8D,#DD,#ED,#D5,#88,#55,#57,#29,#E9,#A9,#9D,#0A
    DB #74,#4E,#FE,#CC,#E7,#EE,#E1,#23,#33,#33,#32,#CE,#27,#7E,#1C,#52
    DB #87,#A6,#CC,#4C,#EF,#DE,#94,#DC,#FE,#FF,#7D,#5E,#44,#14,#71,#47
    DB #47,#14,#16,#89,#99,#61,#35,#27,#05,#41,#D5,#D9,#6C,#5E,#B6,#AD
    DB #FE,#C1,#C2,#F7,#08,#D7,#18,#75,#D1,#B9,#21,#04,#99,#CE,#6E,#EE
    DB #32,#31,#BF,#41,#DB,#C3,#BE,#04,#EA,#C4,#DD,#F6,#45,#FD,#FF,#8D
    DB #98,#6F,#7B,#75,#03,#F5,#FE,#8B,#00,#D1,#95,#C9,#D6,#E7,#7E,#E1
    DB #EE,#EE,#1C,#33,#3C,#CC,#EE,#14,#CE,#E1,#22,#CC,#5E,#64,#82,#EF
    DB #ED,#1D,#4F,#F7,#41,#6D,#74,#4C,#44,#58,#04,#AC,#BC,#1B,#00,#16
    DB #6C,#96,#EE,#E7,#3F,#73,#37,#C7,#C3,#FC,#C4,#70,#1C,#F8,#00,#64
    DB #C1,#E6,#CE,#E6,#BB,#8F,#4C,#E1,#F9,#63,#06,#68,#01,#11,#FB,#09
    DB #24,#AC,#F7,#89,#74,#19,#E1,#07,#00,#82,#44,#EE,#77,#7E,#87,#41
    DB #C7,#47,#EE,#4C,#BA,#03,#E4,#FC,#EA,#C2,#01,#C1,#A6,#47,#E1,#1F
    DB #F4,#8C,#FF,#E1,#6B,#4C,#F1,#57,#E1,#54,#B2,#2E,#5B,#09,#68,#D6
    DB #12,#3C,#B1,#54,#B6,#FB,#47,#A5,#3C,#EC,#CF,#D9,#D6,#01,#02,#16
    DB #59,#1A,#E1,#CC,#1E,#CC,#66,#6E,#E3,#08,#3A,#CD,#00,#A0,#74,#96
    DB #45,#14,#4E,#98,#AA,#F9,#99,#9A,#9F,#F7,#3B,#EE,#3A,#0B,#EB,#C4
    DB #C9,#B9,#BA,#1E,#7E,#77,#06,#1E,#E1,#1E,#4E,#12,#C1,#01,#E6,#17
    DB #91,#11,#B1,#F4,#93,#FE,#1A,#B8,#1E,#14,#91,#12,#1D,#8B,#1D,#CC
    DB #56,#04,#AE,#1B,#00,#86,#1E,#FF,#F1,#D7,#FE,#A2,#EE,#65,#44,#EC
    DB #E1,#C4,#69,#0D,#51,#5D,#35,#7D,#9E,#12,#FE,#5B,#ED,#89,#00,#86
    DB #98,#99,#99,#DF,#7F,#F3,#0F,#9B,#03,#FF,#47,#47,#16,#EF,#6B,#E1
    DB #E7,#EC,#E7,#B0,#07,#41,#76,#99,#F1,#3A,#1E,#EC,#84,#CA,#1E,#9E
    DB #13,#F1,#F4,#1E,#FE,#6B,#6A,#1D,#E4,#F1,#C1,#4C,#05,#26,#4A,#9F
    DB #37,#B9,#5D,#CF,#02,#FC,#DE,#A9,#01,#D1,#17,#91,#22,#DF,#C9,#01
    DB #4B,#FC,#A5,#01,#1C,#28,#4D,#76,#FB,#21,#FF,#F9,#FD,#F4,#5A,#46
    DB #3B,#44,#E4,#69,#C4,#67,#47,#7E,#E4,#4E,#67,#FF,#4D,#EE,#D4,#19
    DB #F1,#D3,#44,#E1,#1C,#58,#D6,#1C,#D1,#97,#11,#D1,#68,#86,#D4,#F1
    DB #FD,#45,#D6,#E9,#F2,#CC,#D7,#4F,#08,#21,#31,#6E,#F1,#E1,#CE,#F1
    DB #D5,#CC,#CC,#EC,#C4,#94,#1B,#00,#1A,#14,#13,#4D,#7D,#77,#D6,#A1
    DB #03,#1E,#31,#18,#91,#98,#88,#81,#F3,#19,#9F,#00,#ED,#02,#FF,#6D
    DB #31,#7C,#8C,#01,#7C,#E7,#E9,#FB,#74,#59,#E7,#7F,#77,#7E,#44,#47
    DB #E7,#41,#E1,#C3,#41,#C1,#14,#4E,#EE,#31,#8D,#FB,#DE,#DD,#2A,#06
    DB #D6,#3B,#F5,#C7,#2C,#56,#8A,#F5,#EC,#1E,#2B,#E1,#54,#13,#59,#97
    DB #D8,#D4,#4E,#2C,#00,#1E,#DD,#20,#1C,#CE,#76,#03,#86,#4F,#89,#D9
    DB #8F,#66,#D4,#D8,#CB,#2D,#C9,#A7,#77,#81,#FE,#37,#02,#BE,#45,#CD
    DB #1B,#B3,#74,#8E,#74,#82,#01,#1E,#7E,#E1,#7C,#63,#41,#4E,#BB,#23
    DB #1E,#09,#D1,#6F,#77,#9E,#5D,#57,#36,#D4,#32,#2F,#03,#BC,#FC,#A7
    DB #A2,#C9,#E1,#78,#71,#45,#45,#33,#EB,#44,#D4,#EB,#4D,#C4,#FE,#F6
    DB #B1,#0A,#0B,#66,#46,#05,#9B,#69,#86,#58,#D1,#FC,#CC,#FE,#15,#FF
    DB #8D,#00,#DD,#F5,#EF,#3E,#B8,#AC,#F5,#AB,#29,#7D,#1D,#D7,#F9,#67
    DB #E5,#E1,#7E,#4E,#FA,#8F,#E3,#7A,#2D,#F1,#DF,#7C,#97,#CD,#9A,#48
    DB #69,#C3,#D1,#55,#EA,#0D,#A6,#71,#D4,#A3,#12,#4D,#9F,#FA,#ED,#FD
    DB #88,#C1,#D1,#67,#2C,#15,#91,#06,#F2,#02,#B1,#46,#2B,#BB,#6D,#0E
    DB #0E,#1E,#91,#E4,#7E,#EF,#FF,#FE,#5B,#FC,#8F,#B0,#25,#75,#57,#8A
    DB #A0,#41,#A8,#74,#C0,#E4,#C7,#FE,#08,#16,#76,#E1,#D4,#D4,#3E,#B3
    DB #13,#15,#AB,#41,#1D,#16,#0B,#07,#C1,#68,#23,#D4,#AC,#CE,#21,#DB
    DB #BF,#14,#55,#54,#45,#54,#4D,#05,#77,#4D,#26,#A7,#B6,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_3_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 3, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_3:
    ; ZX0 compressed tile_pattern (4096 -> 2624 bytes)
    DB #92,#11,#21,#E1,#11,#29,#44,#20,#89,#46,#66,#69,#66,#A1,#88,#8D
    DB #99,#9A,#9E,#1E,#47,#7C,#FF,#11,#98,#1E,#EF,#FF,#6F,#FE,#A0,#BA
    DB #14,#FC,#2E,#41,#14,#9B,#A2,#1D,#1E,#E4,#8B,#4C,#C4,#AA,#6A,#1D
    DB #02,#1C,#D1,#9F,#44,#4D,#FF,#D1,#22,#19,#0E,#16,#11,#22,#CC,#14
    DB #D4,#3E,#D4,#41,#C1,#1C,#71,#A5,#EF,#5E,#DC,#AF,#E8,#C5,#D0,#EA
    DB #D1,#D1,#7E,#61,#7A,#03,#1E,#68,#17,#0F,#65,#FA,#5F,#00,#74,#62
    DB #D6,#D6,#87,#68,#86,#DD,#D5,#57,#78,#C6,#E8,#4F,#1F,#00,#61,#1E
    DB #F7,#77,#7C,#CB,#BB,#9F,#F8,#BE,#86,#FA,#1D,#1C,#77,#CC,#41,#DD
    DB #FE,#F2,#FB,#82,#D8,#E5,#1A,#1F,#D1,#FF,#D1,#1D,#F1,#D1,#CD,#D4
    DB #99,#C1,#7E,#13,#3C,#11,#4D,#E2,#3D,#C1,#D1,#3F,#20,#45,#5E,#EE
    DB #D9,#DE,#F4,#28,#9D,#36,#06,#0D,#DA,#C7,#01,#71,#5A,#41,#5A,#4D
    DB #E4,#01,#3A,#6D,#D4,#57,#77,#FC,#EC,#EF,#7F,#FF,#14,#F1,#EF,#1D
    DB #FB,#B7,#EF,#FD,#6C,#EE,#FA,#DD,#00,#F1,#3C,#55,#82,#F1,#77,#C4
    DB #44,#44,#AF,#D1,#6C,#7A,#01,#DC,#9A,#D4,#14,#FD,#2B,#1F,#ED,#C2
    DB #A0,#DC,#2F,#3C,#C1,#4D,#DE,#37,#FC,#3C,#F4,#28,#A7,#1C,#CA,#F0
    DB #16,#BD,#61,#04,#FA,#CE,#1B,#0F,#00,#18,#B5,#DD,#66,#90,#FF,#9E
    DB #E7,#77,#7F,#FF,#FC,#E1,#C5,#45,#4E,#A1,#4E,#C1,#43,#6B,#1C,#77
    DB #FC,#F9,#8B,#02,#99,#69,#7D,#44,#8B,#E7,#C4,#A6,#FE,#1D,#D4,#EE
    DB #F2,#E5,#2B,#E2,#4E,#00,#AA,#D1,#EE,#1B,#1E,#3D,#D1,#1C,#C1,#97
    DB #FB,#14,#DD,#13,#3E,#E2,#2E,#D4,#FF,#55,#FC,#BD,#3A,#D7,#D4,#B8
    DB #7C,#1B,#85,#69,#91,#D6,#F9,#BA,#B1,#FE,#8E,#14,#B6,#D9,#04,#A2
    DB #D6,#36,#96,#66,#01,#8B,#D5,#7C,#38,#47,#E3,#FB,#11,#EC,#3F,#85
    DB #1E,#E1,#13,#5B,#2E,#BF,#FF,#B3,#9F,#9F,#99,#9F,#9D,#D9,#E4,#CF
    DB #32,#17,#74,#56,#6F,#17,#E7,#9E,#8B,#1C,#21,#13,#4D,#0A,#17,#DC
    DB #7F,#D1,#33,#EF,#ED,#AB,#EA,#F5,#2D,#13,#4B,#44,#C3,#32,#DE,#C3
    DB #CD,#EA,#79,#B1,#C1,#0A,#4C,#EE,#EC,#EC,#AB,#EC,#13,#A0,#01,#6D
    DB #A5,#1E,#EE,#6F,#CB,#F2,#7D,#2F,#74,#AD,#FA,#BA,#FF,#66,#18,#7A
    DB #86,#68,#DD,#54,#47,#B0,#03,#EE,#77,#74,#75,#18,#8A,#BF,#C1,#4F
    DB #02,#8D,#03,#2F,#3F,#BB,#05,#DD,#FF,#99,#62,#55,#1E,#7E,#36,#4E
    DB #2F,#7E,#3C,#E5,#4F,#A2,#C2,#26,#6C,#C3,#E1,#BB,#E4,#EB,#FD,#88
    DB #47,#7D,#65,#EE,#D1,#CC,#EF,#E2,#32,#F1,#31,#AB,#44,#73,#B8,#1C
    DB #FF,#F7,#17,#C1,#17,#B3,#4A,#FC,#24,#F6,#11,#36,#EB,#82,#C7,#FB
    DB #4D,#01,#98,#86,#00,#C7,#88,#03,#8F,#33,#99,#D1,#D6,#97,#54,#C6
    DB #68,#88,#AB,#81,#1C,#A6,#00,#33,#33,#B9,#AF,#9D,#FE,#9F,#D1,#77
    DB #44,#02,#C8,#F7,#D7,#41,#E1,#3E,#E5,#53,#A4,#32,#32,#6C,#7C,#71
    DB #33,#7D,#BD,#13,#FD,#41,#1C,#3D,#1E,#F1,#D2,#69,#EB,#31,#3F,#CF
    DB #FE,#F5,#50,#01,#1A,#4C,#FE,#1D,#E1,#71,#78,#C1,#C3,#C1,#03,#85
    DB #16,#FD,#A2,#61,#2A,#7C,#CC,#EC,#F2,#F3,#08,#39,#00,#71,#AC,#00
    DB #66,#38,#BE,#32,#FE,#15,#57,#C6,#DD,#12,#17,#FF,#E1,#BF,#F3,#FF
    DB #F3,#33,#33,#3E,#F8,#FE,#62,#2C,#3C,#CC,#2C,#CC,#64,#23,#32,#CC
    DB #B1,#22,#A8,#AF,#CC,#ED,#74,#13,#4B,#12,#6B,#F8,#3F,#09,#E5,#A1
    DB #21,#23,#C4,#B1,#CC,#37,#31,#D1,#3B,#DC,#BB,#FF,#89,#FF,#EE,#FF
    DB #8B,#11,#7C,#78,#FF,#01,#84,#66,#D1,#81,#F3,#B1,#E6,#8B,#EE,#18
    DB #89,#EE,#EB,#14,#08,#57,#04,#F8,#02,#AD,#68,#6D,#55,#6C,#01,#7C
    DB #6D,#00,#8A,#FF,#FC,#44,#5F,#55,#55,#5C,#77,#C7,#CF,#FF,#FE,#17
    DB #8A,#01,#3C,#CD,#BE,#BD,#07,#01,#4A,#C7,#41,#1D,#71,#13,#C1,#4A
    DB #33,#3C,#ED,#C3,#B2,#D4,#CE,#11,#FE,#2A,#CE,#7F,#19,#8A,#C1,#1F
    DB #22,#71,#E1,#24,#FD,#61,#FC,#CE,#6E,#50,#F4,#AD,#C1,#4C,#0E,#D3
    DB #09,#C8,#00,#C7,#6D,#45,#00,#80,#EB,#41,#EE,#47,#7F,#E8,#81,#47
    DB #F1,#CA,#77,#B6,#B5,#CF,#00,#BA,#22,#FF,#33,#E9,#F7,#23,#FE,#FB
    DB #F9,#EC,#7E,#FE,#02,#3F,#FF,#21,#77,#1D,#4C,#3E,#41,#F8,#01,#AF
    DB #4D,#4C,#31,#1C,#C2,#3C,#5D,#11,#DD,#4C,#37,#D7,#03,#E3,#74,#FD
    DB #78,#82,#ED,#F7,#E1,#FF,#1C,#7F,#A6,#01,#ED,#12,#1F,#72,#00,#8A
    DB #C1,#1E,#32,#0E,#4C,#3C,#04,#7B,#02,#55,#7B,#FF,#01,#14,#52,#8A
    DB #BE,#61,#80,#E4,#CC,#B1,#D3,#1F,#99,#9B,#33,#F3,#39,#D9,#4A,#FE
    DB #4A,#DE,#CC,#14,#14,#C1,#CE,#D2,#1D,#F5,#36,#C1,#CC,#7F,#9D,#C1
    DB #8D,#E5,#73,#66,#9F,#13,#D1,#BF,#D1,#00,#C2,#FB,#5C,#4D,#43,#1C
    DB #C3,#1D,#D4,#12,#DA,#FD,#02,#F5,#21,#19,#88,#FE,#E6,#7C,#CE,#13
    DB #7C,#44,#4C,#F5,#93,#30,#FE,#A3,#6A,#33,#08,#98,#00,#87,#68,#D6
    DB #D7,#37,#03,#47,#D0,#75,#8E,#7C,#0E,#B5,#99,#B1,#04,#EE,#03,#FE
    DB #55,#CA,#54,#8F,#44,#82,#DD,#D1,#55,#41,#3F,#C6,#43,#27,#63,#21
    DB #61,#13,#BB,#D9,#E7,#01,#3E,#84,#A7,#BA,#DD,#1C,#11,#57,#1C,#32
    DB #CD,#1C,#33,#CC,#C4,#2C,#C1,#44,#88,#FE,#C5,#EF,#7E,#A0,#25,#1F
    DB #A7,#DD,#DD,#4C,#22,#11,#A1,#11,#5A,#46,#59,#E0,#88,#86,#6F,#03
    DB #2C,#9D,#9D,#D9,#99,#DF,#FF,#99,#91,#AD,#FD,#57,#5A,#09,#F9,#8E
    DB #F9,#61,#87,#0C,#1D,#E2,#22,#EE,#79,#04,#8F,#14,#4C,#D1,#FB,#BF
    DB #01,#D4,#F9,#6C,#63,#2C,#31,#E8,#00,#1F,#B0,#FD,#A7,#0C,#12,#31
    DB #4C,#8F,#13,#31,#4E,#A7,#B3,#55,#13,#AB,#12,#3C,#33,#0B,#1B,#FD
    DB #1C,#2A,#25,#71,#74,#E4,#E1,#16,#64,#1C,#C3,#CF,#0B,#16,#65,#FE
    DB #AB,#8D,#68,#EF,#05,#FD,#99,#FE,#2E,#15,#03,#42,#F1,#17,#E9,#99
    DB #99,#DC,#1F,#F7,#F7,#7F,#ED,#9D,#F8,#00,#0A,#D1,#71,#4F,#DD,#41
    DB #16,#81,#E4,#2D,#98,#96,#DD,#FE,#AB,#35,#C1,#C3,#EA,#E9,#01,#1E
    DB #36,#14,#1D,#5C,#D6,#D7,#C7,#CC,#23,#B4,#C4,#9F,#F1,#C1,#4E,#1D
    DB #2E,#D6,#FF,#DA,#4E,#29,#13,#F5,#F3,#37,#0A,#06,#02,#4D,#5A,#0D
    DB #14,#AB,#46,#C4,#A6,#00,#68,#11,#16,#AA,#86,#68,#A5,#8D,#83,#9D
    DB #E7,#47,#77,#E8,#BB,#EE,#A3,#6E,#77,#75,#71,#A3,#08,#E4,#ED,#6A
    DB #01,#47,#D7,#4D,#A6,#E7,#99,#69,#99,#14,#B6,#FE,#62,#29,#13,#B6
    DB #3E,#41,#EB,#CF,#01,#D1,#7A,#E2,#3C,#B5,#1C,#77,#C7,#DB,#48,#F5
    DB #C3,#31,#4D,#EF,#AC,#CB,#14,#6C,#30,#CA,#FB,#FE,#FC,#FE,#25,#1B
    DB #61,#00,#DC,#E5,#1E,#68,#35,#1A,#A1,#7C,#D7,#01,#A6,#00,#88,#16
    DB #61,#2D,#D6,#A1,#01,#61,#EA,#21,#D1,#31,#77,#F1,#3A,#E9,#00,#1A
    DB #E5,#45,#55,#57,#1D,#CB,#9D,#1F,#4D,#2C,#02,#AE,#A9,#11,#00,#92
    DB #44,#19,#88,#64,#46,#1C,#4A,#C1,#2E,#C7,#42,#B4,#3E,#74,#71,#3A
    DB #77,#46,#27,#33,#24,#75,#09,#27,#C3,#C1,#1D,#DC,#BC,#DD,#CC,#3D
    DB #1D,#F4,#FE,#01,#F5,#02,#5E,#FB,#8A,#C4,#46,#DB,#FF,#66,#D3,#6B
    DB #06,#D8,#A9,#E2,#68,#D8,#01,#68,#89,#F1,#FD,#E0,#2E,#F9,#DC,#7C
    DB #7F,#1D,#F5,#01,#AD,#91,#44,#54,#C1,#23,#0E,#F1,#FE,#7F,#02,#A5
    DB #0C,#D1,#9F,#A9,#61,#41,#64,#6C,#63,#1B,#E1,#8C,#31,#1C,#FD,#33
    DB #DB,#A3,#7B,#22,#C4,#1F,#34,#13,#FD,#DB,#FB,#A5,#D1,#13,#C7,#03
    DB #A2,#B0,#41,#9B,#74,#7F,#03,#88,#C5,#D9,#55,#FA,#3B,#F9,#66,#2C
    DB #F7,#69,#F8,#FF,#FE,#EC,#18,#81,#01,#88,#9A,#49,#DD,#D8,#86,#F6
    DB #D9,#25,#27,#D7,#1E,#05,#71,#F5,#8D,#ED,#D9,#15,#6D,#6A,#3D,#0C
    DB #18,#B4,#89,#54,#41,#30,#BF,#D3,#66,#01,#FD,#FA,#7A,#6C,#89,#94
    DB #DD,#21,#17,#D1,#27,#2E,#3F,#1D,#2D,#18,#D4,#C1,#16,#6D,#D6,#BD
    DB #47,#0D,#D3,#83,#D1,#EB,#BE,#C1,#42,#6A,#D5,#D3,#5B,#01,#0C,#57
    DB #26,#F9,#CE,#F4,#11,#28,#61,#0E,#6B,#28,#6C,#E1,#C3,#17,#E1,#06
    DB #98,#16,#86,#11,#35,#4F,#04,#5F,#26,#FC,#C2,#6F,#98,#F3,#9D,#E1
    DB #14,#9D,#DE,#EE,#66,#9D,#02,#4E,#D5,#00,#A2,#1C,#85,#61,#DA,#61
    DB #D1,#AA,#13,#CF,#EF,#BD,#1E,#C1,#B2,#EB,#44,#11,#78,#16,#D1,#DD
    DB #15,#9B,#73,#11,#31,#C0,#3B,#F4,#3C,#9D,#DD,#C7,#7E,#FE,#C7,#0F
    DB #7B,#58,#F1,#B5,#EF,#41,#48,#DF,#9A,#66,#44,#1F,#69,#66,#B5,#E9
    DB #F5,#2F,#F1,#73,#FE,#1C,#FF,#6C,#FC,#AB,#28,#E4,#C5,#71,#B4,#2A
    DB #B1,#1C,#26,#18,#CE,#DF,#0F,#00,#30,#8D,#9E,#D7,#A3,#FE,#CE,#F9
    DB #00,#3A,#64,#62,#4D,#41,#1E,#AE,#7D,#D1,#C5,#FB,#EC,#DD,#1E,#4B
    DB #6F,#1F,#4D,#A5,#8C,#DB,#71,#12,#4D,#AD,#F4,#C8,#39,#D1,#DB,#35
    DB #EC,#CC,#EF,#EC,#EE,#E1,#ED,#1C,#F4,#0E,#16,#BF,#66,#8A,#E5,#00
    DB #86,#69,#EC,#C7,#F1,#16,#6F,#F1,#68,#68,#AA,#BB,#36,#68,#A8,#6A
    DB #6D,#2A,#73,#0B,#45,#E3,#EB,#08,#5D,#08,#E8,#03,#54,#7F,#92,#FD
    DB #07,#F9,#FB,#17,#EE,#D9,#00,#DA,#51,#F1,#DD,#17,#27,#42,#27,#E9
    DB #9D,#19,#99,#C8,#3D,#2D,#8E,#EC,#C4,#A4,#B9,#DE,#B9,#48,#1E,#1C
    DB #CE,#FE,#CE,#E1,#74,#77,#77,#E1,#17,#14,#C3,#41,#CF,#80,#6E,#0A
    DB #76,#ED,#B1,#C1,#3D,#C8,#F8,#06,#01,#A5,#8B,#B8,#8C,#BB,#BA,#86
    DB #64,#44,#46,#64,#7D,#24,#7C,#03,#00,#AE,#E4,#FE,#0F,#85,#8A,#00
    DB #64,#26,#1E,#11,#1C,#69,#11,#3F,#45,#F5,#1A,#01,#4E,#72,#4F,#19
    DB #31,#DF,#1D,#DD,#D1,#D4,#83,#BE,#54,#E5,#7C,#DA,#71,#45,#CC,#74
    DB #41,#1C,#E4,#0F,#C3,#72,#80,#EE,#1C,#C3,#E2,#16,#75,#1C,#77,#EE
    DB #78,#00,#92,#6A,#AA,#86,#8A,#AA,#AA,#2B,#B6,#41,#B7,#54,#26,#DE
    DB #FD,#03,#BE,#D6,#F5,#00,#A1,#64,#26,#11,#71,#1F,#77,#7E,#D7,#1B
    DB #DE,#19,#FA,#99,#14,#A3,#C7,#1E,#D1,#DD,#1D,#7C,#E6,#F1,#D8,#B4
    DB #01,#D6,#DF,#FB,#4E,#A0,#01,#64,#E1,#13,#EC,#EE,#7E,#E4,#EC,#23
    DB #03,#C1,#CF,#7F,#D9,#00,#D3,#2C,#CF,#FC,#8C,#FB,#C7,#71,#3C,#F4
    DB #A1,#A2,#E7,#68,#BB,#6A,#AB,#BB,#FF,#66,#1A,#66,#83,#28,#3F,#0C
    DB #F2,#F6,#DC,#BF,#4C,#42,#F4,#80,#E6,#04,#CF,#33,#E2,#DC,#1C,#D4
    DB #7A,#73,#00,#AA,#1D,#41,#83,#CC,#F5,#0C,#C5,#FF,#BC,#F4,#F9,#49
    DB #22,#A6,#1E,#38,#74,#43,#CD,#A3,#FF,#CE,#14,#C4,#F1,#C7,#FD,#B0
    DB #36,#73,#26,#F7,#BE,#63,#62,#EA,#13,#8B,#16,#BF,#FA,#BF,#F1,#61
    DB #1B,#86,#44,#86,#FE,#25,#4D,#44,#29,#11,#2B,#16,#86,#01,#CF,#BC
    DB #3D,#DE,#F1,#A0,#E4,#82,#23,#11,#13,#31,#AC,#CC,#4B,#06,#27,#1C
    DB #C7,#EF,#FF,#6E,#F4,#D9,#F2,#66,#A0,#36,#E3,#23,#CF,#A3,#4C,#CF
    DB #FC,#74,#7D,#63,#E4,#A9,#01,#8D,#9B,#D6,#D9,#86,#41,#68,#F6,#92
    DB #11,#68,#1E,#6B,#BB,#16,#FB,#FF,#EF,#B7,#AB,#79,#2A,#FC,#74,#4E
    DB #0E,#18,#C2,#44,#45,#04,#FC,#40,#F2,#18,#36,#86,#F9,#9D,#6D,#D1
    DB #E7,#31,#60,#0F,#26,#1E,#F7,#11,#13,#37,#C1,#DC,#32,#ED,#1C,#44
    DB #E1,#00,#A6,#DD,#19,#D6,#61,#61,#C1,#61,#D1,#A0,#D1,#93,#17,#FF
    DB #FC,#C3,#17,#E4,#22,#2F,#E4,#4C,#F3,#00,#03,#2D,#02,#26,#3F,#15
    DB #00,#A1,#16,#88,#6A,#88,#A2,#CF,#D6,#1B,#01,#77,#16,#6B,#14,#04
    DB #1A,#45,#23,#1A,#AE,#9C,#08,#6B,#2D,#41,#62,#FE,#5E,#CB,#96,#4D
    DB #D4,#16,#9E,#3C,#46,#B8,#32,#E1,#C3,#73,#C4,#37,#16,#29,#C1,#2C
    DB #8F,#EA,#FE,#A8,#1D,#C6,#D1,#6D,#F3,#FF,#CD,#05,#03,#00,#80,#AA
    DB #E7,#7F,#1E,#31,#EE,#CC,#1E,#EE,#16,#93,#C4,#27,#1C,#9E,#EE,#52
    DB #6D,#68,#6D,#07,#BF,#2B,#AF,#FF,#56,#FB,#D2,#14,#B1,#B2,#BB,#F8
    DB #3C,#3D,#64,#12,#C4,#CE,#8A,#80,#D8,#EC,#BE,#9D,#F5,#EF,#6C,#DD
    DB #E3,#71,#C7,#4D,#7B,#B6,#E9,#72,#0A,#3B,#04,#E8,#B4,#12,#B1,#19
    DB #08,#29,#9A,#13,#1D,#EE,#0D,#16,#B9,#6E,#7E,#C7,#C3,#D7,#EF,#1E
    DB #DE,#88,#D9,#12,#F0,#EE,#E2,#01,#8B,#B1,#8A,#FE,#1F,#A3,#FF,#B8
    DB #61,#38,#71,#AF,#FD,#BB,#B1,#14,#77,#F2,#30,#91,#4A,#A1,#CE,#A5
    DB #8E,#F8,#2C,#8A,#19,#F4,#44,#C3,#C9,#1C,#4F,#57,#57,#09,#79,#C2
    DB #F1,#E3,#CC,#25,#97,#14,#F7,#C4,#C3,#A2,#01,#CC,#FE,#12,#D3,#99
    DB #01,#29,#EE,#1E,#7B,#EC,#2C,#44,#17,#E1,#4E,#16,#88,#1D,#7E,#F3
    DB #AA,#DC,#F0,#9E,#01,#11,#BF,#FF,#FE,#B2,#BF,#FF,#59,#81,#6E,#EE
    DB #C1,#88,#88,#11,#DA,#05,#54,#49,#75,#6B,#86,#CC,#EE,#CA,#68,#AE
    DB #8E,#66,#90,#AA,#4C,#1F,#1D,#5A,#C6,#D9,#9E,#47,#AC,#99,#41,#EE
    DB #1C,#FD,#D6,#44,#83,#C1,#D9,#6E,#96,#6C,#D7,#3C,#6D,#D4,#6D,#A2
    DB #A8,#03,#7F,#B5,#FE,#1E,#BE,#BD,#7E,#93,#CD,#F7,#CC,#00,#CF,#0C
    DB #F7,#D9,#00,#89,#86,#1A,#AB,#AC,#1F,#F1,#BB,#8B,#68,#F6,#76,#EC
    DB #CE,#EE,#FE,#24,#00,#A0,#47,#92,#41,#CC,#8B,#BF,#FC,#CC,#9C,#FA
    DB #6B,#FB,#2A,#45,#51,#BE,#17,#90,#93,#ED,#47,#17,#46,#BA,#D5,#C5
    DB #29,#2F,#44,#31,#44,#F8,#E4,#00,#A2,#13,#D2,#69,#01,#E8,#13,#E1
    DB #3C,#6E,#E1,#EF,#49,#FF,#F1,#CC,#44,#17,#41,#E0,#24,#B4,#66,#CE
    DB #F0,#74,#7E,#EC,#C4,#AB,#6B,#2D,#FF,#B5,#AF,#AB,#20,#F3,#20,#BF
    DB #1E,#EE,#1C,#EC,#1E,#E1,#64,#34,#2F,#CB,#AB,#D1,#26,#0B,#CA,#6A
    DB #BA,#28,#54,#E7,#56,#EA,#F4,#CC,#B4,#16,#2A,#C0,#FF,#E9,#79,#C4
    DB #ED,#02,#0E,#6F,#C2,#A9,#B1,#AA,#6D,#6D,#D6,#31,#B5,#EB,#0B,#EA
    DB #4A,#C2,#02,#1C,#E1,#1E,#77,#13,#C1,#F4,#1A,#E0,#FE,#D5,#55,#60
SCREEN5_PRESENTATION_BITMAP_CHUNK_4_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 4, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_4:
    ; ZX0 compressed tile_pattern (4096 -> 1753 bytes)
    DB #96,#11,#EA,#16,#F8,#41,#F2,#FE,#1A,#8A,#FF,#16,#1F,#FF,#42,#AB
    DB #B8,#66,#B1,#11,#1C,#11,#CE,#E1,#11,#14,#44,#02,#5A,#41,#16,#8B
    DB #B6,#66,#CE,#18,#E4,#86,#A4,#E0,#FD,#6E,#CC,#27,#31,#14,#11,#4D
    DB #DD,#DD,#99,#E3,#22,#1C,#C1,#E0,#C1,#F5,#A2,#CC,#16,#68,#66,#11
    DB #31,#82,#14,#14,#16,#D1,#9E,#12,#3C,#CE,#D5,#2E,#7F,#F7,#FD,#1A
    DB #1E,#C1,#EE,#E1,#CE,#FE,#1B,#5D,#57,#FE,#4B,#1F,#87,#EA,#E6,#D0
    DB #18,#AA,#61,#92,#EF,#B1,#BB,#B1,#86,#61,#89,#EE,#EE,#E2,#04,#83
    DB #47,#9E,#FB,#16,#8A,#61,#92,#88,#61,#91,#29,#14,#38,#57,#5A,#F7
    DB #CD,#9D,#9D,#44,#11,#4D,#D1,#D6,#6E,#74,#9E,#1C,#02,#8B,#11,#88
    DB #8A,#01,#1E,#3B,#57,#91,#16,#9D,#41,#C1,#FE,#1C,#21,#CF,#F1,#FE
    DB #11,#CF,#7C,#7F,#9A,#D1,#1E,#44,#C1,#E8,#B8,#01,#1C,#29,#1E,#DC
    DB #6E,#E5,#60,#B6,#68,#45,#12,#1C,#FB,#A8,#BB,#BB,#86,#16,#16,#BB
    DB #E1,#B6,#66,#04,#4B,#41,#B3,#92,#DE,#F1,#FE,#B7,#E9,#0B,#F9,#C9
    DB #87,#AF,#FA,#1D,#C7,#3D,#65,#06,#FE,#C2,#D9,#03,#00,#8A,#1F,#CF
    DB #17,#99,#D9,#DD,#61,#1F,#E1,#22,#1F,#7E,#C1,#44,#67,#B3,#7E,#F6
    DB #6E,#E3,#C5,#AD,#1A,#B1,#C6,#80,#F1,#16,#00,#92,#16,#66,#66,#61
    DB #1B,#BB,#8B,#8B,#B8,#AF,#CD,#61,#08,#78,#EF,#E9,#4C,#C1,#C1,#61
    DB #BD,#6E,#02,#26,#1E,#7D,#D1,#27,#61,#14,#41,#59,#E7,#9E,#DD,#C3
    DB #CD,#76,#99,#66,#88,#B8,#E1,#CD,#5A,#CF,#C1,#D6,#9D,#6D,#11,#FE
    DB #13,#31,#E1,#E4,#1E,#41,#7F,#7E,#7E,#C8,#B6,#E1,#C1,#E4,#14,#16
    DB #B8,#4E,#04,#69,#61,#6E,#F1,#DE,#19,#37,#16,#88,#BB,#BA,#88,#68
    DB #7B,#F6,#E4,#04,#A4,#41,#8D,#46,#61,#71,#B2,#F6,#7A,#20,#17,#ED
    DB #CE,#C4,#75,#DD,#E3,#C4,#D8,#03,#7C,#CE,#7B,#00,#E2,#D7,#7C,#B1
    DB #96,#D6,#D1,#1F,#21,#E3,#1E,#1C,#24,#8D,#1F,#EC,#C7,#E1,#EC,#8B
    DB #D3,#6D,#D7,#2A,#7C,#1E,#42,#CD,#1C,#DE,#20,#B4,#68,#AB,#AB,#A6
    DB #FF,#7E,#FE,#B6,#0A,#F2,#32,#AC,#4C,#E9,#A0,#E1,#7C,#6D,#DC,#3D
    DB #D2,#AA,#DD,#41,#4B,#66,#F8,#FE,#D9,#2D,#41,#F1,#F1,#16,#AD,#03
    DB #CC,#79,#FD,#95,#63,#C1,#E1,#17,#E7,#CC,#E8,#41,#AF,#93,#4E,#FE
    DB #5B,#2C,#B7,#72,#F4,#A4,#1C,#DB,#09,#8A,#D7,#83,#05,#21,#B8,#EA
    DB #93,#44,#D7,#41,#E2,#E1,#FE,#2F,#CF,#3B,#B7,#8E,#E4,#8B,#1D,#DE
    DB #58,#7A,#38,#81,#A2,#C7,#71,#1C,#E2,#26,#1B,#BC,#2C,#AE,#17,#01
    DB #69,#1F,#F1,#E1,#8B,#71,#E4,#4C,#1C,#CC,#6D,#70,#3E,#32,#3B,#C2
    DB #C1,#01,#FC,#A9,#22,#EE,#3B,#80,#4A,#C0,#24,#41,#61,#7A,#03,#88
    DB #10,#C7,#E1,#EF,#62,#C1,#F6,#9F,#1D,#D7,#E1,#AA,#76,#AB,#4D,#1C
    DB #17,#7E,#16,#12,#13,#9A,#81,#B3,#CC,#1C,#A6,#F7,#14,#1F,#7C,#C6
    DB #FF,#F6,#44,#A7,#B0,#D7,#B7,#80,#78,#C7,#50,#AE,#EE,#97,#DD,#CE
    DB #1E,#E8,#0F,#16,#4B,#86,#AD,#61,#88,#62,#5B,#68,#AA,#D9,#8E,#7D
    DB #F0,#89,#ED,#D1,#BE,#CD,#4B,#E3,#27,#14,#DE,#C9,#FC,#B8,#13,#77
    DB #C1,#F1,#2D,#1B,#B7,#33,#3C,#59,#09,#A0,#E4,#14,#D1,#AB,#E1,#1C
    DB #EE,#C4,#31,#8E,#2A,#00,#17,#98,#CF,#1E,#B8,#BB,#0C,#C7,#2E,#B8
    DB #06,#01,#8B,#8A,#A8,#81,#C2,#D0,#D3,#17,#28,#FD,#00,#3D,#F8,#8A
    DB #00,#77,#1F,#F6,#9E,#12,#7F,#27,#01,#E7,#41,#F3,#BF,#7F,#21,#3B
    DB #CA,#44,#D8,#BD,#9D,#2A,#17,#E1,#E1,#CC,#CC,#F4,#0A,#C8,#84,#E3
    DB #F8,#46,#51,#3C,#88,#6C,#CA,#75,#DA,#62,#86,#87,#AA,#A6,#AB,#BA
    DB #8A,#71,#F7,#8F,#DA,#F8,#4A,#ED,#62,#EC,#D4,#F8,#00,#F6,#EC,#4C
    DB #84,#6A,#3F,#7C,#47,#75,#EC,#01,#B1,#28,#DF,#CC,#B4,#15,#78,#70
    DB #36,#1C,#E7,#41,#E4,#04,#4B,#14,#92,#6E,#86,#71,#ED,#6C,#B5,#C7
    DB #F5,#F5,#FE,#8C,#68,#1E,#E7,#04,#61,#BA,#FF,#57,#D9,#46,#DF,#E1
    DB #81,#00,#2C,#19,#CC,#F8,#99,#59,#FF,#DE,#21,#64,#99,#C3,#F3,#C4
    DB #CC,#17,#74,#99,#33,#3E,#C2,#EB,#7E,#EF,#E1,#6F,#F7,#4A,#0F,#44
    DB #4D,#64,#FA,#63,#91,#E1,#1E,#C1,#D0,#06,#D4,#16,#F4,#E2,#61,#DD
    DB #BD,#EB,#BF,#BB,#BB,#A6,#E3,#81,#FA,#B7,#1F,#7E,#B7,#61,#02,#99
    DB #FD,#42,#C1,#2A,#1C,#1A,#3C,#4C,#21,#E7,#44,#19,#D1,#1C,#22,#22
    DB #1E,#93,#EC,#74,#41,#17,#1F,#7E,#7A,#1B,#03,#C1,#03,#CD,#ED,#EC
    DB #31,#AA,#3B,#1C,#1E,#A0,#E1,#5D,#28,#11,#B1,#8C,#FB,#BF,#BD,#FE
    DB #09,#5D,#FA,#7F,#92,#A3,#DA,#ED,#41,#69,#02,#81,#DF,#D4,#C1,#A8
    DB #3C,#D1,#11,#75,#C2,#E1,#4E,#BA,#22,#1C,#69,#C7,#17,#1C,#9B,#C1
    DB #C7,#E4,#CE,#19,#7E,#77,#FE,#49,#E8,#1E,#EE,#1E,#D7,#6E,#23,#EE
    DB #F1,#93,#B8,#8E,#4D,#8A,#BB,#E1,#5B,#FF,#FF,#F1,#1B,#FA,#BA,#61
    DB #13,#92,#A5,#41,#37,#35,#FA,#00,#03,#6D,#F6,#19,#02,#08,#A8,#3C
    DB #C1,#45,#EB,#56,#2C,#AD,#14,#77,#0B,#07,#C4,#68,#21,#4E,#8C,#47
    DB #C1,#C1,#04,#FA,#15,#C1,#F1,#4C,#3C,#AD,#CC,#20,#E9,#88,#BF,#FE
    DB #AB,#00,#E5,#1F,#B1,#66,#86,#39,#00,#BD,#EC,#03,#82,#02,#1E,#7C
    DB #71,#1C,#7C,#74,#84,#AD,#41,#34,#01,#68,#0B,#74,#C0,#CA,#F9,#2C
    DB #97,#71,#08,#FC,#1E,#B6,#AF,#1E,#F2,#FA,#E0,#1E,#73,#00,#0B,#BB
    DB #38,#0B,#01,#61,#FF,#FB,#BB,#61,#86,#4D,#37,#00,#61,#02,#B6,#C7
    DB #19,#3A,#17,#44,#3D,#EC,#49,#6B,#7F,#13,#2F,#1F,#44,#C1,#1C,#F4
    DB #07,#8C,#5C,#48,#0C,#2D,#CC,#70,#D2,#9C,#61,#7E,#E1,#75,#9F,#86
    DB #CE,#D6,#66,#FF,#3A,#BF,#1F,#01,#FF,#99,#AB,#A8,#61,#28,#1F,#02
    DB #84,#19,#DA,#03,#CB,#AA,#CC,#17,#D3,#27,#8B,#40,#41,#BB,#74,#01
    DB #3F,#16,#18,#8D,#13,#CF,#E7,#F9,#80,#C4,#D1,#C7,#00,#89,#0B,#BC
    DB #C1,#C1,#D9,#E2,#66,#16,#1F,#1E,#EF,#EC,#33,#21,#25,#FF,#41,#D3
    DB #07,#A8,#01,#FA,#96,#B8,#A6,#91,#11,#77,#02,#A2,#C2,#AE,#C1,#14
    DB #E4,#7E,#00,#3C,#17,#CF,#47,#8A,#01,#17,#4E,#85,#6D,#A5,#69,#D6
    DB #D6,#02,#3D,#AB,#F1,#95,#1B,#AD,#CA,#DE,#CA,#01,#A9,#6A,#FF,#8A
    DB #C1,#AB,#61,#86,#88,#81,#48,#84,#11,#D6,#8A,#C7,#F3,#C0,#71,#AF
    DB #0D,#44,#48,#34,#F5,#FD,#01,#27,#F3,#FC,#4C,#14,#03,#C6,#A7,#1D
    DB #DA,#7E,#D9,#47,#77,#E6,#38,#E2,#A2,#1F,#CE,#66,#EE,#07,#56,#01
    DB #A0,#AB,#8A,#FE,#CF,#FC,#FF,#88,#35,#32,#EF,#FE,#1A,#18,#43,#DD
    DB #D0,#A9,#8B,#CF,#CC,#CC,#41,#EF,#05,#FE,#0A,#FB,#60,#38,#00,#C2
    DB #43,#D4,#1C,#68,#13,#46,#13,#52,#DE,#13,#07,#89,#F8,#E8,#00,#6A
    DB #BB,#2A,#C1,#1F,#FB,#BB,#AA,#06,#4D,#77,#61,#B0,#B5,#9F,#97,#E4
    DB #86,#00,#4D,#21,#44,#3C,#14,#77,#44,#5D,#BC,#FA,#00,#E7,#8A,#7C
    DB #F2,#26,#F1,#31,#C6,#4D,#00,#53,#43,#16,#5A,#C1,#D8,#02,#64,#9B
    DB #6A,#16,#8B,#B1,#11,#6B,#11,#34,#06,#B0,#16,#64,#68,#26,#77,#31
    DB #17,#97,#47,#E4,#41,#1E,#4C,#C1,#14,#C9,#48,#71,#1C,#47,#E1,#3C
    DB #F7,#CC,#72,#CC,#D9,#00,#3D,#86,#FF,#B4,#6E,#48,#CC,#16,#2E,#B2
    DB #65,#C1,#68,#B1,#1A,#AB,#FB,#B6,#8A,#CC,#F9,#AC,#79,#F4,#19,#23
    DB #1C,#CC,#3C,#1E,#74,#44,#28,#05,#14,#BE,#44,#AC,#06,#14,#14,#71
    DB #C3,#7F,#CC,#33,#CC,#4C,#57,#49,#00,#5D,#1D,#00,#C8,#FC,#67,#B6
    DB #88,#AB,#2D,#04,#56,#F6,#CB,#34,#D0,#FC,#A8,#FF,#EB,#17,#71,#13
    DB #E7,#52,#11,#9E,#71,#F3,#FA,#41,#00,#1E,#6A,#3F,#7B,#CF,#C2,#41
    DB #DB,#14,#CF,#7E,#D4,#D7,#37,#5D,#F4,#5F,#D6,#FA,#FE,#88,#86,#66
    DB #8B,#BB,#A8,#66,#3D,#A8,#72,#03,#91,#E1,#88,#1F,#DF,#C3,#0D,#06
    DB #0F,#DE,#D1,#7B,#38,#79,#66,#96,#CE,#7C,#43,#CF,#3C,#CF,#C7,#F5
    DB #CB,#1E,#F1,#02,#0B,#1E,#71,#18,#A5,#1D,#CB,#92,#C5,#F9,#72,#DE
    DB #81,#71,#9B,#16,#88,#AB,#74,#08,#3D,#00,#E7,#87,#47,#7E,#D5,#6E
    DB #11,#91,#77,#8A,#CC,#44,#E6,#00,#6A,#E1,#77,#13,#7C,#BB,#22,#D9
    DB #21,#64,#A0,#C2,#3E,#E1,#FE,#4B,#61,#4F,#FA,#0F,#09,#F1,#07,#04
    DB #68,#14,#34,#19,#EA,#1C,#A3,#3A,#77,#54,#0A,#09,#96,#AA,#1C,#44
    DB #3D,#00,#96,#E7,#1C,#C3,#FC,#C2,#7C,#C1,#38,#8C,#75,#6D,#E3,#EE
    DB #21,#E2,#1F,#17,#41,#9E,#DC,#04,#DA,#AD,#86,#54,#87,#FD,#DD,#E1
    DB #C7,#C1,#04,#FA,#B4,#71,#C1,#D6,#06,#75,#79,#D2,#62,#EE,#47,#1C
    DB #2C,#F3,#CC,#BC,#AE,#12,#D1,#02,#1F,#FF,#59,#7C,#2D,#1C,#C4,#02
    DB #E2,#EC,#93,#66,#D5,#00,#B0,#D1,#1F,#A4,#0B,#32,#7B,#F5,#04,#DA
    DB #00,#1E,#88,#EC,#3C,#20,#DC,#34,#13,#41,#61,#00,#4E,#9C,#1C,#81
    DB #FA,#E1,#FE,#18,#7A,#7D,#D5,#DC,#1E,#C1,#66,#A9,#1D,#14,#0D,#23
    DB #29,#71,#2C,#57,#FE,#88,#71,#13,#D7,#00,#4E,#F8,#14,#66,#ED,#D5
    DB #4D,#CA,#FE,#DD,#C1,#A0,#F3,#3A,#56,#FF,#22,#F1,#C2,#0C,#37,#C4
    DB #7C,#13,#25,#00,#E3,#F4,#55,#55,#80
SCREEN5_PRESENTATION_BITMAP_CHUNK_5_SIZE EQU 4096

; SCREEN 5 4bpp bitmap chunk 5, 4096 bytes
SCREEN5_PRESENTATION_BITMAP_CHUNK_5:
    ; ZX0 compressed tile_pattern (4096 -> 194 bytes)
    DB #86,#11,#FE,#14,#F6,#EA,#4F,#F8,#15,#80,#BD,#DD,#D5,#4D,#41,#C1
    DB #1E,#FF,#EE,#74,#20,#22,#E4,#7C,#C3,#CF,#3C,#F3,#CC,#CC,#81,#61
    DB #A4,#1E,#1E,#01,#95,#1E,#69,#17,#06,#3A,#44,#D1,#C7,#F1,#A0,#41
    DB #BC,#E1,#F8,#F8,#F2,#38,#EE,#12,#C3,#F7,#03,#E5,#17,#4C,#5A,#5F
    DB #E2,#56,#94,#E1,#BC,#ED,#01,#9E,#FF,#14,#C1,#CC,#70,#68,#C1,#48
    DB #18,#4F,#1C,#CC,#7C,#CC,#C4,#47,#41,#C4,#56,#94,#41,#F1,#B4,#4E
    DB #01,#A2,#D4,#44,#DE,#D7,#FB,#20,#60,#20,#E7,#47,#EC,#3C,#CC,#FF
    DB #12,#C1,#31,#3E,#48,#FE,#50,#7B,#49,#44,#D8,#FF,#B2,#4E,#D3,#73
    DB #71,#C3,#3C,#FF,#63,#D1,#C1,#61,#75,#40,#AA,#1C,#14,#13,#C5,#00
    DB #68,#1C,#08,#9F,#C1,#14,#F9,#CC,#21,#FA,#65,#BB,#14,#14,#71,#14
    DB #CC,#C4,#11,#00,#D4,#3A,#7D,#FE,#5B,#EE,#BF,#09,#41,#20,#D3,#00
    DB #6E,#E1,#E7,#DF,#0B,#CE,#77,#7E,#7E,#D6,#FE,#90,#00,#15,#55,#D5
    DB #55,#60
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
