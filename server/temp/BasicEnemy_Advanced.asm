; ==================================================================
; BASICENEMY - ADVANCED MSX ROM WITH REAL PIXEL DATA
; Generado por Mideas Advanced Generator
; ==================================================================

    ORG #4000

; ROM Header
    DB "AB"
    DW INIT_ROM
    DW 0, 0, 0, 0, 0, 0

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F        ; Change screen mode
CLS     EQU #00C3        ; Clear screen
LDIRVM  EQU #005C        ; Load data to VRAM
WRTVRM  EQU #004D        ; Write byte to VRAM
WRTVDP  EQU #0047        ; Write to VDP register

; VDP Ports
VDPDR   EQU #0098        ; VDP Data Register
VDPSR   EQU #0099        ; VDP Status Register

; ==================================================================
; VRAM LAYOUT CONSTANTS (SCREEN 2)
; ==================================================================
CHRTBL  EQU #0000        ; Pattern Generator Table
CLRTBL  EQU #2000        ; Color Table
NAMETBL EQU #1800        ; Name Table
SPRATR  EQU #1B00        ; Sprite Attribute Table
SPRPAT  EQU #3800        ; Sprite Pattern Table

; ==================================================================
; INITIALIZATION
; ==================================================================
INIT_ROM:
    DI
    LD SP, #F380

    ; Initialize Screen 2 mode
    LD A, 2
    CALL CHGMOD
    CALL CLS

    ; Load graphics data
    CALL LOAD_GRAPHICS_DATA

    ; Initialize game objects
    CALL INIT_GAME_OBJECTS

    ; Enable screen
    LD A, #C0                ; VDP R1: 16K, Enable Display, Enable Interrupt
    LD B, 1
    CALL WRTVDP

    EI

MAIN_LOOP:
    HALT                     ; Wait for VBlank
    CALL UPDATE_GAME
    JP MAIN_LOOP

; ==================================================================
; GRAPHICS DATA LOADING
; ==================================================================
LOAD_GRAPHICS_DATA:
    ; Load tile patterns
    CALL LOAD_TILE_PATTERNS

    ; Load tile colors
    CALL LOAD_TILE_COLORS

    ; Load sprite patterns
    CALL LOAD_SPRITE_PATTERNS

    ; Initialize name table
    CALL INIT_NAME_TABLE

    RET

LOAD_TILE_PATTERNS:
    ; Load brick1 pattern
    LD HL, BRICK1_PATTERN
    LD DE, CHRTBL + 8        ; Character 1 (skip character 0)
    LD BC, 32                ; 4 patterns × 8 bytes
    CALL LDIRVM
    RET

LOAD_TILE_COLORS:
    ; Load brick1 colors
    LD HL, BRICK1_COLORS
    LD DE, CLRTBL + 8        ; Color data for character 1
    LD BC, 32                ; 4 patterns × 8 bytes
    CALL LDIRVM
    RET

LOAD_SPRITE_PATTERNS:
    ; Load bot1 sprite pattern
    LD HL, BOT1_F0_L0
    LD DE, SPRPAT            ; Sprite pattern 0
    LD BC, 32                ; 16x16 sprite = 32 bytes
    CALL LDIRVM
    RET

INIT_NAME_TABLE:
    ; Fill name table with tile pattern
    LD HL, NAMETBL
    LD A, 1                  ; Character 1 (our tile)

init_name_loop:
    PUSH HL
    CALL WRTVRM              ; Write character to name table
    POP HL
    INC HL

    ; Check if we've filled the screen (768 bytes)
    LD BC, NAMETBL + 768
    OR A
    SBC HL, BC
    JR C, init_name_loop

    RET

; ==================================================================
; GAME OBJECT MANAGEMENT
; ==================================================================
INIT_GAME_OBJECTS:
    ; Show bot1 sprite
    LD A, 0                  ; Sprite number 0
    LD B, 100                ; X position
    LD C, 100                ; Y position
    LD D, 0                  ; Pattern 0
    LD E, 15                 ; Color white
    CALL SHOW_SPRITE
    RET

UPDATE_GAME:
    ; Simple animation - move sprite
    CALL ANIMATE_BOT
    RET

ANIMATE_BOT:
    ; Simple left-right movement
    LD A, (bot_x)
    LD B, A
    LD A, (bot_dir)
    OR A
    JR Z, move_right

move_left:
    DEC B
    LD A, B
    CP 50
    JR NZ, update_bot_pos
    ; Change direction
    XOR A
    LD (bot_dir), A
    JR update_bot_pos

move_right:
    INC B
    LD A, B
    CP 200
    JR NZ, update_bot_pos
    ; Change direction
    LD A, 1
    LD (bot_dir), A

update_bot_pos:
    LD A, B
    LD (bot_x), A

    ; Update sprite position
    LD A, 0                  ; Sprite 0
    LD C, 100                ; Y position (fixed)
    LD D, 0                  ; Pattern 0
    LD E, 15                 ; Color white
    CALL SHOW_SPRITE
    RET

; Bot variables
bot_x:      DB 100
bot_dir:    DB 0             ; 0=right, 1=left

SHOW_SPRITE:
    ; Show sprite: A=sprite#, B=X, C=Y, D=pattern, E=color
    PUSH AF
    PUSH BC
    PUSH DE

    ; Calculate sprite attribute address
    LD L, A
    LD H, 0
    ADD HL, HL
    ADD HL, HL               ; × 4 (4 bytes per sprite)
    LD DE, SPRATR
    ADD HL, DE               ; HL = sprite attribute address

    ; Write Y position
    LD A, C
    CALL WRTVRM
    INC HL

    ; Write X position
    LD A, B
    CALL WRTVRM
    INC HL

    ; Write pattern
    POP DE
    PUSH DE
    LD A, D
    CALL WRTVRM
    INC HL

    ; Write color
    LD A, E
    CALL WRTVRM

    POP DE
    POP BC
    POP AF
    RET

; ==================================================================
; GRAPHICS DATA
; ==================================================================

; ==================================================================
; TILE: brick1
; ==================================================================

BRICK1_PATTERN:
    DB #00, #7F, #7F, #7F, #00, #FB, #FB, #FB  ; Pattern 0
    DB #00, #BF, #BF, #BF, #00, #FD, #FD, #FD  ; Pattern 1
    DB #00, #7F, #7F, #7F, #00, #FB, #FB, #FB  ; Pattern 2
    DB #00, #BF, #BF, #BF, #00, #FD, #FD, #FD  ; Pattern 3

BRICK1_COLORS:
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1  ; Colors 0
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1  ; Colors 1
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1  ; Colors 2
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1  ; Colors 3



; ==================================================================
; SPRITE: bot1
; ==================================================================

BOT1_F0_L0:
    DB #1F, #7F, #CF, #8F, #07, #00, #2F, #6F  ; Pattern 0
    DB #E0, #B0, #B0, #F0, #E0, #00, #F0, #BD  ; Pattern 1
    DB #6F, #6F, #00, #0C, #FC, #FC, #C0, #C0  ; Pattern 2
    DB #BD, #F0, #00, #1C, #1C, #07, #07, #07  ; Pattern 3

BOT1_F1_L0:
    DB #1F, #FF, #CF, #0F, #07, #00, #2F, #6F  ; Pattern 0
    DB #E0, #B0, #B0, #F0, #E0, #00, #F0, #F0  ; Pattern 1
    DB #6F, #6E, #00, #01, #01, #01, #01, #01  ; Pattern 2
    DB #F0, #70, #00, #80, #80, #80, #E0, #E0  ; Pattern 3



    END
