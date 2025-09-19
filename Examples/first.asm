; ==================================================================
; MINIMAL MSX TEST - FULLY CORRECTED VERSION
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
WRTVDP  EQU #0047        ; Write to VDP register
WRTVRM  EQU #004D        ; Write data to VRAM
CLS     EQU #00C3        ; Clear screen
CHPUT   EQU #00A2        ; Character output
LDIRVM  EQU #005C        ; Block transfer to VRAM
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
; RAM VARIABLES (interleaved for simplicity: 32 sprites * 4 bytes)
; ==================================================================
sprite_attr     EQU #C000   ; Format: Y, X, pattern, color per sprite

; ==================================================================
; INIT ROM
; ==================================================================
INIT_ROM:
    DI                           ; Disable interrupts during init

    ; Initialize stack
    LD SP, #F380

    ; Clear variables
    LD HL, sprite_attr
    LD DE, sprite_attr+1
    LD BC, 127                   ; Clear 128 bytes
    LD (HL), 0
    LDIR

    ; Initialize Screen 2
    LD A, 2
    CALL CHGMOD                  ; BIOS handles everything!

    ; Enable 16x16 magnified sprites (set size bit in VDP reg 1)
    LD BC, #01E2                 ; C=reg 1, B=0xE2 (standard 0xE0 | 0x02 for size=1)
    CALL WRTVDP

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
    HALT                         ; Wait for vsync interrupt
    JP MAIN_LOOP

; ==================================================================
; LOAD PATTERNS
; ==================================================================
LOAD_PATTERNS:
    ; Load test pattern (8 bytes for magnified 16x16 sprite)
    LD HL, TEST_SPRITE_PATTERN
    LD DE, SPRPAT + (0 * 8)      ; 8 bytes per pattern
    LD BC, 8
    CALL LDIRVM                  ; BIOS handles timing
    RET

; ==================================================================
; SHOW_SPRITE
; ==================================================================
SHOW_SPRITE:
    ; Input: A=sprite#, B=X, C=Y, D=pattern, E=color
    PUSH BC
    PUSH DE

    LD L, A                      ; L = sprite number
    LD H, 0                      ; HL = sprite number
    SLA L
    RL H                         ; *2
    SLA L
    RL H                         ; *4 (for interleaved offset)
    LD DE, sprite_attr
    ADD HL, DE                   ; HL = sprite_attr + (sprite# * 4)

    POP DE                       ; Restore DE (D=pattern, E=color)
    LD (HL), C                   ; Set Y
    INC HL
    LD (HL), B                   ; Set X
    INC HL
    LD (HL), D                   ; Set pattern
    INC HL
    LD (HL), E                   ; Set color

    POP BC
    RET

; ==================================================================
; UPDATE_SPRITES_TO_VRAM
; ==================================================================
UPDATE_SPRITES_TO_VRAM:
    ; Copy interleaved sprite data to VRAM
    LD HL, sprite_attr
    LD DE, SPRATR
    LD BC, 128                   ; 32 sprites * 4 bytes
    CALL LDIRVM                  ; BIOS handles timing
    RET

; ==================================================================
; TEST DATA
; ==================================================================
TEST_SPRITE_PATTERN:
    ; Simple 8x8 pattern (magnified to 16x16): solid square
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

; ==================================================================
; PADDING TO 8KB
; ==================================================================
PADDING_START:
    DS 8192 - (PADDING_START - #4000), #FF  ; Fill remaining bytes to 8KB

    END