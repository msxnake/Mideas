; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; 1 tiles detected
; ==================================================================

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
TILE_COLOR_BANK0:
    ; Tile 0: brick1 colors (fg/bg pairs)
    DB #61, #61, #61, #61, #61, #61, #61, #91, #61, #B1, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #B1, #B1, #61, #61, #61, #61


; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
LOAD_COLOR_BANK0:
    ; Load color bank 0 to VRAM (base colors)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_COLOR_BANK0
    LD DE, CLRTBL2                ; VRAM color table bank 0
    LD BC, 32     ; Total color bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_COLOR_BANK1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0
    LD DE, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)
    LD BC, 32     ; Total color bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_COLOR_BANK2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_COLOR_BANK0       ; Same source as Bank 0
    LD DE, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)
    LD BC, 32     ; Total color bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

; ==================================================================
; END OF COLOR DATA
; ==================================================================
