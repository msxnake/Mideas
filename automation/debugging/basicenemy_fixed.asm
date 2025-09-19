; ==================================================================
; BASICENEMY - FIXED VERSION FOR DEBUGGING
; File: basicenemy_fixed.asm
; Description: Corrected version with proper graphics and sprites
; Purpose: Testing and debugging graphics functionality
; ==================================================================

    ORG #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    DB "AB"             ; MSX cartridge signature
    DW INIT_ROM         ; Initialization address
    DW 0                ; Statement handler (not used)
    DW 0                ; Device handler (not used)
    DW 0                ; Text handler (not used)
    DW 0                ; Reserved
    DW 0                ; Reserved
    DW 0                ; Reserved

; ==================================================================
; BIOS ADDRESSES
; ==================================================================
CHGMOD: EQU #005F      ; Change screen mode
CLS:    EQU #00C3      ; Clear screen
LDIRVM: EQU #005C      ; Block transfer to VRAM
WRTVRM: EQU #004D      ; Write to VRAM
SETGRP: EQU #007E      ; Set graphics mode

; ==================================================================
; VDP PORTS AND ADDRESSES
; ==================================================================
VDP_DATA:   EQU #98    ; VDP data port
VDP_REG:    EQU #99    ; VDP register port

; VRAM addresses for Screen 2
PATTERN_NAME_TABLE:     EQU #1800    ; Pattern name table
SPRITE_ATTR_TABLE:      EQU #1B00    ; Sprite attribute table
COLOR_TABLE:           EQU #2000    ; Color table
PATTERN_GEN_TABLE:     EQU #0000    ; Pattern generator table
SPRITE_PATTERN_TABLE:  EQU #3800    ; Sprite pattern table

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
INIT_ROM:
    ; Disable interrupts during initialization
    DI

    ; Initialize stack for cartridge
    LD SP, #F380

    ; Initialize Screen 2 mode properly
    CALL INIT_SCREEN2

    ; Load graphics data
    CALL LOAD_GRAPHICS

    ; Create test sprites
    CALL INIT_SPRITES

    ; Enable interrupts
    EI

    ; Jump to main program
    JP MAIN_PROGRAM

; ==================================================================
; SCREEN 2 INITIALIZATION
; ==================================================================
INIT_SCREEN2:
    ; Set Screen 2 mode using BIOS
    LD A, 2
    CALL CHGMOD

    ; Additional VDP setup for proper Screen 2
    ; Set VDP register 1 for 16x16 sprites and screen enable
    LD A, 1
    LD B, #E2           ; Screen on, M1=1, M2=1, 16x16 sprites
    CALL SET_VDP_REG

    ; Set sprite size to 16x16
    LD A, 1
    LD B, #E2
    CALL SET_VDP_REG

    RET

; ==================================================================
; VDP REGISTER SETTING ROUTINE
; ==================================================================
SET_VDP_REG:
    ; Set VDP register A to value B
    OUT (VDP_REG), A    ; First send register number
    LD A, B
    OR #80              ; Set bit 7 to indicate register write
    OUT (VDP_REG), A    ; Then send value with bit 7 set
    RET

; ==================================================================
; GRAPHICS DATA LOADING
; ==================================================================
LOAD_GRAPHICS:
    ; Load tile patterns
    CALL LOAD_TILE_PATTERNS

    ; Load tile colors
    CALL LOAD_TILE_COLORS

    ; Load sprite patterns
    CALL LOAD_SPRITE_PATTERNS

    ; Set up test background
    CALL SETUP_BACKGROUND

    RET

LOAD_TILE_PATTERNS:
    ; Load brick tile pattern
    LD HL, TILE_BRICK_DATA
    LD DE, PATTERN_GEN_TABLE
    LD BC, 8
    CALL LDIRVM_SAFE
    RET

LOAD_TILE_COLORS:
    ; Set colors for tile 0 (brick)
    LD HL, TILE_COLORS
    LD DE, COLOR_TABLE
    LD BC, 8
    CALL LDIRVM_SAFE
    RET

LOAD_SPRITE_PATTERNS:
    ; Load enemy sprite pattern
    LD HL, SPRITE_ENEMY_DATA
    LD DE, SPRITE_PATTERN_TABLE
    LD BC, 32           ; 16x16 sprite = 32 bytes
    CALL LDIRVM_SAFE
    RET

SETUP_BACKGROUND:
    ; Fill part of name table with tile 0 to show bricks
    LD HL, PATTERN_NAME_TABLE
    LD A, 0             ; Tile number 0 (brick)
    LD B, 32            ; Fill 32 positions
FILL_LOOP:
    CALL WRTVRM_SAFE
    INC HL
    DJNZ FILL_LOOP
    RET

; ==================================================================
; SPRITE INITIALIZATION
; ==================================================================
INIT_SPRITES:
    ; Initialize sprite 0 (enemy)
    LD HL, SPRITE_ATTR_TABLE

    ; Y position
    LD A, 100
    CALL WRTVRM_SAFE
    INC HL

    ; X position
    LD A, 120
    CALL WRTVRM_SAFE
    INC HL

    ; Pattern number
    LD A, 0
    CALL WRTVRM_SAFE
    INC HL

    ; Color (red)
    LD A, #06
    CALL WRTVRM_SAFE

    ; End sprite list with Y=208
    LD HL, SPRITE_ATTR_TABLE + 4
    LD A, 208
    CALL WRTVRM_SAFE

    RET

; ==================================================================
; SAFE VRAM WRITING ROUTINES
; ==================================================================
LDIRVM_SAFE:
    ; Safe block transfer to VRAM
    ; HL = source address, DE = VRAM destination, BC = length
    PUSH AF
    PUSH HL
    PUSH DE
    PUSH BC

    CALL LDIRVM

    POP BC
    POP DE
    POP HL
    POP AF
    RET

WRTVRM_SAFE:
    ; Safe single byte write to VRAM
    ; A = data, HL = VRAM address
    PUSH AF
    PUSH HL
    PUSH DE
    PUSH BC

    CALL WRTVRM

    POP BC
    POP DE
    POP HL
    POP AF
    RET

; ==================================================================
; MAIN PROGRAM
; ==================================================================
MAIN_PROGRAM:
    ; Simple animation loop
    LD B, 0             ; Animation counter

MAIN_LOOP:
    ; Wait for VBlank by reading VDP status
    CALL WAIT_VBLANK

    ; Simple sprite animation - move horizontally
    LD A, B
    AND #7F             ; Keep in range 0-127
    ADD A, 50           ; Offset

    ; Update sprite X position
    LD HL, SPRITE_ATTR_TABLE + 1  ; X position offset
    CALL WRTVRM_SAFE

    ; Increment animation counter
    INC B

    ; Continue main loop
    JP MAIN_LOOP

; ==================================================================
; UTILITY FUNCTIONS
; ==================================================================
WAIT_VBLANK:
    ; Wait for vertical blank
    IN A, (VDP_REG)
    AND #80
    JR Z, WAIT_VBLANK
    RET

; ==================================================================
; GRAPHICS DATA
; ==================================================================

; Brick tile pattern (8x8)
TILE_BRICK_DATA:
    DB #FF, #81, #81, #FF, #FF, #18, #18, #FF

; Tile colors
TILE_COLORS:
    DB #C1, #C1, #C1, #C1, #C1, #C1, #C1, #C1  ; Light red on black

; Enemy sprite pattern (16x16 = 32 bytes)
SPRITE_ENEMY_DATA:
    ; Top half of sprite
    DB #00, #3C, #7E, #FF, #FF, #FF, #7E, #3C
    DB #00, #00, #00, #18, #18, #00, #00, #00
    ; Bottom half of sprite
    DB #3C, #7E, #FF, #FF, #FF, #FF, #7E, #3C
    DB #00, #18, #3C, #7E, #7E, #3C, #18, #00

    END