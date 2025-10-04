; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; 1 tiles detected
; ==================================================================

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
    ; Tile 0: brick1 colors (fg/bg pairs)
    db #61, #61, #61, #61, #61, #61, #61, #91, #61, #B1, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #61, #B1, #B1, #61, #61, #61, #61


; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0
    ld de, CLRTBL2                ; VRAM color table bank 0
    ld bc, 32     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)
    ld bc, 32     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)
    ld bc, 32     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; END OF COLOR DATA
; ==================================================================
