; ==================================================================
; WHITE SQUARE GAME - Complete MSX Assembly Game
; ==================================================================
; A simple game featuring a white 16x16 square sprite that can be
; moved around the screen using joystick input.
;
; Technical Features:
; - Screen 2 graphics mode with black background
; - 16x16 sprite system
; - Joystick input handling with boundary checking
; - V-Blank synchronized movement
; - Proper MSX ROM structure and timing
; ==================================================================

    ORG #4000           ; MSX cartridge start address

; ==================================================================
; BIOS FUNCTION ADDRESSES
; ==================================================================
WRTVDP: equ #0047
RDVRM:  equ #004a
WRTVRM: equ #004d
FILVRM: equ #0056
LDIRVM: equ #005c
CHGMOD: equ #005f
CHGCLR: equ #0062
CLRSPR: equ #0069
GTSTCK: equ #00d5
GTTRIG: equ #00d8

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
CLIKSW: equ #f3db       ; keyboard sound
BAKCLR: equ #f3ea       ; background color
BDRCLR: equ #f3eb       ; border color
TIMI:   equ #fd9f       ; timer interrupt hook
HKEY:   equ #fd9a       ; hkey interrupt hook

; ==================================================================
; VRAM ADDRESSES FOR SCREEN 2
; ==================================================================
CHRTBL2:  equ #0000     ; pattern table address
NAMTBL2:  equ #1800     ; name table address
CLRTBL2:  equ #2000     ; color table address
SPRTBL2:  equ #3800     ; sprite pattern address
SPRATR2:  equ #1b00     ; sprite attribute address

; ==================================================================
; INPUT CONSTANTS
; ==================================================================
STICK_UP    EQU 1
STICK_RIGHT EQU 3
STICK_DOWN  EQU 5
STICK_LEFT  EQU 7
STICK_CENTER EQU 0

; ==================================================================
; COLORS
; ==================================================================
COLOR_BLACK:    equ 1
COLOR_WHITE:    equ 15

; ==================================================================
; GAME VARIABLES IN RAM (C000h-F37Fh)
; ==================================================================
sprite_x        EQU #C000   ; Current sprite X position
sprite_y        EQU #C001   ; Current sprite Y position
old_vblank      EQU #C002   ; Original V-Blank handler (2 bytes)

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

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
INIT_ROM:
    ; Disable interrupts during initialization
    DI

    ; Initialize the stack
    LD SP, #F380

    ; Reset some interrupts to make sure it runs on MSX computers
    ; with disk controllers installed
    LD A, #C9           ; RET instruction
    LD (HKEY), A
    LD (TIMI), A

    ; Enable interrupts
    EI

    ; Silence keyboard click and set colors
    XOR A
    LD (CLIKSW), A      ; Disable keyboard sound
    LD (BAKCLR), A      ; Black background
    LD A, COLOR_BLACK
    LD (BDRCLR), A      ; Black border
    CALL CHGCLR         ; Apply color changes

    ; Change to Screen 2 mode
    LD A, 2
    CALL CHGMOD

    ; Configure 16x16 sprites
    ; Write #E2 to VDP register #01 (activate sprites, interrupts, 16x16 sprites)
    LD BC, #E201
    CALL WRTVDP

    ; Initialize game variables
    LD A, 128           ; Center X position (128)
    LD (sprite_x), A
    LD A, 96            ; Center Y position (96)
    LD (sprite_y), A

    ; Set up sprite pattern data
    CALL SETUP_SPRITE_PATTERNS

    ; Set up V-Blank interrupt hook
    CALL SETUP_VBLANK

    ; Jump to main program
    JP MAIN_PROGRAM

; ==================================================================
; SPRITE PATTERN SETUP
; ==================================================================
SETUP_SPRITE_PATTERNS:
    ; Clear all sprite patterns first
    LD HL, SPRTBL2      ; Sprite pattern table
    LD BC, #0800        ; 2KB for sprite patterns
    LD A, 0
    CALL FILVRM

    ; Load white square pattern (16x16 sprite uses 32 bytes: 4 patterns)
    LD HL, SPRTBL2      ; Start of sprite pattern table
    LD DE, WHITE_SQUARE_PATTERN
    LD BC, 32           ; 32 bytes for 16x16 sprite (4 8x8 patterns)
    CALL LDIRVM

    RET

; ==================================================================
; V-BLANK INTERRUPT SETUP
; ==================================================================
SETUP_VBLANK:
    ; Save original V-Blank handler
    LD HL, (TIMI)
    LD (old_vblank), HL

    ; Install our V-Blank handler
    LD HL, VBLANK_ISR
    LD (TIMI), HL

    RET

; ==================================================================
; V-BLANK INTERRUPT SERVICE ROUTINE
; ==================================================================
VBLANK_ISR:
    ; Save registers
    PUSH AF
    PUSH BC
    PUSH DE
    PUSH HL

    ; Update sprite position on screen
    CALL UPDATE_SPRITE_DISPLAY

    ; Restore registers
    POP HL
    POP DE
    POP BC
    POP AF

    ; Return from interrupt
    RET

; ==================================================================
; MAIN PROGRAM LOOP
; ==================================================================
MAIN_PROGRAM:
    ; Main game loop
GAME_LOOP:
    ; Wait for V-Blank
    HALT

    ; Read joystick input and update position
    CALL READ_INPUT

    ; Loop forever
    JP GAME_LOOP

; ==================================================================
; INPUT HANDLING
; ==================================================================
READ_INPUT:
    ; Read joystick port 1
    LD A, 1             ; Joystick port 1
    CALL GTSTCK

    ; Check direction and update position
    CP STICK_UP
    JR NZ, CHECK_DOWN
    ; Move up (decrease Y)
    LD A, (sprite_y)
    CP 0                ; Check upper boundary
    JR Z, INPUT_DONE    ; Don't move if at boundary
    DEC A
    LD (sprite_y), A
    JR INPUT_DONE

CHECK_DOWN:
    CP STICK_DOWN
    JR NZ, CHECK_LEFT
    ; Move down (increase Y)
    LD A, (sprite_y)
    CP 175              ; Check lower boundary (191-16)
    JR Z, INPUT_DONE    ; Don't move if at boundary
    INC A
    LD (sprite_y), A
    JR INPUT_DONE

CHECK_LEFT:
    CP STICK_LEFT
    JR NZ, CHECK_RIGHT
    ; Move left (decrease X)
    LD A, (sprite_x)
    CP 0                ; Check left boundary
    JR Z, INPUT_DONE    ; Don't move if at boundary
    DEC A
    LD (sprite_x), A
    JR INPUT_DONE

CHECK_RIGHT:
    CP STICK_RIGHT
    JR NZ, INPUT_DONE
    ; Move right (increase X)
    LD A, (sprite_x)
    CP 239              ; Check right boundary (255-16)
    JR Z, INPUT_DONE    ; Don't move if at boundary
    INC A
    LD (sprite_x), A

INPUT_DONE:
    RET

; ==================================================================
; SPRITE DISPLAY UPDATE
; ==================================================================
UPDATE_SPRITE_DISPLAY:
    ; Clear all sprites first
    LD HL, SPRATR2      ; Sprite attribute table
    LD BC, 128          ; 32 sprites * 4 bytes each
    LD A, 208           ; Y=208 (off screen)
    CALL FILVRM

    ; Set up sprite 0 (top-left part of 16x16 sprite)
    LD HL, SPRATR2      ; Sprite 0 attributes
    LD A, (sprite_y)    ; Y position
    CALL WRTVRM
    LD HL, SPRATR2 + 1
    LD A, (sprite_x)    ; X position
    CALL WRTVRM
    LD HL, SPRATR2 + 2
    LD A, 0             ; Pattern 0
    CALL WRTVRM
    LD HL, SPRATR2 + 3
    LD A, COLOR_WHITE   ; White color
    CALL WRTVRM

    ; Set up sprite 1 (top-right part)
    LD HL, SPRATR2 + 4  ; Sprite 1 attributes
    LD A, (sprite_y)    ; Y position
    CALL WRTVRM
    LD HL, SPRATR2 + 5
    LD A, (sprite_x)    ; X position + 8
    ADD A, 8
    CALL WRTVRM
    LD HL, SPRATR2 + 6
    LD A, 1             ; Pattern 1
    CALL WRTVRM
    LD HL, SPRATR2 + 7
    LD A, COLOR_WHITE   ; White color
    CALL WRTVRM

    ; Set up sprite 2 (bottom-left part)
    LD HL, SPRATR2 + 8  ; Sprite 2 attributes
    LD A, (sprite_y)    ; Y position + 8
    ADD A, 8
    CALL WRTVRM
    LD HL, SPRATR2 + 9
    LD A, (sprite_x)    ; X position
    CALL WRTVRM
    LD HL, SPRATR2 + 10
    LD A, 2             ; Pattern 2
    CALL WRTVRM
    LD HL, SPRATR2 + 11
    LD A, COLOR_WHITE   ; White color
    CALL WRTVRM

    ; Set up sprite 3 (bottom-right part)
    LD HL, SPRATR2 + 12 ; Sprite 3 attributes
    LD A, (sprite_y)    ; Y position + 8
    ADD A, 8
    CALL WRTVRM
    LD HL, SPRATR2 + 13
    LD A, (sprite_x)    ; X position + 8
    ADD A, 8
    CALL WRTVRM
    LD HL, SPRATR2 + 14
    LD A, 3             ; Pattern 3
    CALL WRTVRM
    LD HL, SPRATR2 + 15
    LD A, COLOR_WHITE   ; White color
    CALL WRTVRM

    RET

; ==================================================================
; SPRITE PATTERN DATA - White 16x16 Square
; ==================================================================
WHITE_SQUARE_PATTERN:
    ; Pattern 0 (top-left 8x8)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Pattern 1 (top-right 8x8)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Pattern 2 (bottom-left 8x8)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Pattern 3 (bottom-right 8x8)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF

; ==================================================================
; ROM SIZE ALIGNMENT - Ensure 8KB boundary
; ==================================================================

; Pad to 8KB (0x2000 bytes from 0x4000 to 0x6000)
    DS #6000 - $, #FF

; ==================================================================
; END OF ROM
; ==================================================================