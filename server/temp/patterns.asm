; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; 1 tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
TILE_PATTERN_BANK0:
    ; Tile 0: brick1 (16x16px = 2×2 chars = 4 MSX characters)
    ; Character layout: 2×2 grid
    ; Row 0: Char0 Char1 
    ; Row 1: Char2 Char3 
    DB #00, #7F, #7F, #7F, #00, #FB, #FB, #FB, #00, #BF, #BF, #BF, #00, #FD, #FD, #FD, #00, #7F, #7F, #7F, #00, #FB, #FB, #FB, #00, #BF, #BF, #BF, #00, #FD, #FD, #FD


; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
LOAD_PATTERN_BANK0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_PATTERN_BANK0
    LD DE, CHRTBL2                ; VRAM pattern table bank 0
    LD BC, 32    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_PATTERN_BANK1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0
    LD DE, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)
    LD BC, 32    ; Total bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_PATTERN_BANK2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    LD HL, TILE_PATTERN_BANK0     ; Same source as Bank 0
    LD DE, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)
    LD BC, 32    ; Total bytes for all tile characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
