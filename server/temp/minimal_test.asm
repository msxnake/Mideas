; ==================================================================
; MINIMAL MSX TEST - VERSION CORREGIDA
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
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F        ; Change screen mode
CLS     EQU #00C3        ; Clear screen
CHPUT   EQU #00A2        ; Character output
LDIRVM  EQU #005C        ; Block transfer to VRAM
WRTVRM  EQU #0047        ; Write data to VRAM
ERAFNK  EQU #00CC        ; Erase function keys

; ==================================================================
; VRAM ADDRESSES
; ==================================================================
CHRTBL2 EQU #0000        ; Pattern table
CLRTBL2 EQU #2000        ; Color table
NAMETBL EQU #1800        ; Name table
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table

; ==================================================================
; RAM VARIABLES
; ==================================================================
sprite_x_pos    EQU #C000
sprite_y_pos    EQU #C020
sprite_pattern  EQU #C040
sprite_color    EQU #C060

; ==================================================================
; INIT ROM - VERSION CORREGIDA
; ==================================================================
INIT_ROM:
    DI                           ; Disable interrupts during init

    ; Initialize stack
    LD SP, #F380

    ; Clear variables
    LD HL, sprite_x_pos
    LD DE, sprite_x_pos+1
    LD BC, 127                   ; Clear 128 bytes
    LD (HL), 0
    LDIR

    ; Initialize Screen 2 - SOLO CHGMOD (sin SAFE_SCREEN_INIT)
    LD A, 2
    CALL CHGMOD                  ; BIOS handles everything!
    CALL ERAFNK
    CALL CLS

    ; Load patterns
    CALL LOAD_PATTERNS

    ; Show test sprite
    LD A, 0                      ; Sprite 0
    LD B, 100                    ; X = 100
    LD C, 80                     ; Y = 80
    LD D, 0                      ; Pattern 0
    LD E, 15                     ; Color 15 (white)
    CALL SHOW_SPRITE

    ; Update sprites to VRAM
    CALL UPDATE_SPRITES_TO_VRAM

    EI                           ; Re-enable interrupts

    ; Main loop
MAIN_LOOP:
    HALT                         ; Wait for interrupt
    JP MAIN_LOOP

; ==================================================================
; LOAD PATTERNS - VERSION CORREGIDA
; ==================================================================
LOAD_PATTERNS:
    ; Load test pattern (32 bytes for 16x16 sprite)
    LD HL, TEST_SPRITE_PATTERN
    LD DE, SPRPAT + (0 * 32)    ; 32 bytes per 16x16 sprite!
    LD BC, 32                   ; CORRECTO: 32 bytes
    CALL LDIRVM                 ; BIOS handles timing
    RET

; ==================================================================
; SHOW SPRITE - VERSION CORREGIDA
; ==================================================================
SHOW_SPRITE:
    ; Input: A=sprite#, B=X, C=Y, D=pattern, E=color
    PUSH BC                     ; Preserve parameters
    PUSH DE

    ; Calculate sprite offset
    LD L, A                     ; L = sprite number
    LD H, 0                     ; HL = sprite number

    ; Set X position
    PUSH HL
    LD DE, sprite_x_pos
    ADD HL, DE
    LD (HL), B                  ; Set X
    POP HL

    ; Set Y position
    PUSH HL
    LD DE, sprite_y_pos
    ADD HL, DE
    LD (HL), C                  ; Set Y
    POP HL

    ; Set pattern
    PUSH HL
    LD DE, sprite_pattern
    ADD HL, DE
    POP DE
    PUSH DE
    LD (HL), D                  ; Set pattern
    POP HL

    ; Set color
    LD DE, sprite_color
    ADD HL, DE
    POP DE
    LD (HL), E                  ; Set color

    POP BC
    RET

; ==================================================================
; UPDATE SPRITES TO VRAM
; ==================================================================
UPDATE_SPRITES_TO_VRAM:
    ; Copy sprite data to VRAM
    LD HL, sprite_y_pos
    LD DE, SPRATR
    LD BC, 128                  ; 32 sprites * 4 bytes
    CALL LDIRVM                 ; BIOS handles timing
    RET

; ==================================================================
; TEST DATA
; ==================================================================
TEST_SPRITE_PATTERN:
    ; Simple 16x16 sprite pattern (32 bytes)
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF    ; Top-left 8x8
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF    ; Top-right 8x8
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF    ; Bottom-left 8x8
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF    ; Bottom-right 8x8

; ==================================================================
; PADDING TO 8KB
; ==================================================================
PADDING_START:
    DS 8192 - (PADDING_START - #4000), #FF  ; Fill remaining bytes to 8KB

    END