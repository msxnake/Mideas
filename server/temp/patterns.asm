; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; 1 tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
    ; Tile 0: brick1 (16x16px = 2×2 chars = 4 MSX characters)
    ; Character layout: 2×2 grid
    ; Row 0: Char0 Char1 
    ; Row 1: Char2 Char3 
    db #00, #7F, #7F, #7F, #00, #FB, #FB, #FB, #00, #BF, #BF, #BF, #00, #FD, #FD, #FD, #00, #7F, #7F, #7F, #00, #FB, #FB, #FB, #00, #BF, #BF, #BF, #00, #FD, #FD, #FD


; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2                ; VRAM pattern table bank 0
    ld bc, 32    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)
    ld bc, 32    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)
    ld bc, 32    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
