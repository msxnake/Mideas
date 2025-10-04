; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; 1 sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================

; Sprite 0: bot1
;; Sprite: bot1
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#3EB847, C2=#FC584A, C3=#FFFFFF

SPRITE_BOT1_WIDTH     EQU 16
SPRITE_BOT1_HEIGHT    EQU 16
SPRITE_BOT1_FRAMES    EQU 2

;; ---- Sprite Frame: bot1_F0 ----
;; Size: 16x16
;; Layer 0 (Color: #000000) - SKIPPED (color not used or is background)
;; Layer 1 (Color: #3EB847) - SKIPPED (color not used or is background)
;; Layer 2 (Color: #FC584A) - SKIPPED (color not used or is background)
BOT1_F0_LAYER3: ; Brush Color Index 3 (Actual Color: #FFFFFF)
    DB #1F,#E0,#7F,#B0,#CF,#B0,#8F,#F0,#07,#E0,#00,#00,#2F,#F0,#6F,#BD
    DB #6F,#BD,#6F,#F0,#00,#00,#0C,#1C,#FC,#1C,#FC,#07,#C0,#07,#C0,#07

;; ---- End of Frame: bot1_F0 ----

;; ---- Sprite Frame: bot1_F1 ----
;; Size: 16x16
;; Layer 0 (Color: #000000) - SKIPPED (color not used or is background)
;; Layer 1 (Color: #3EB847) - SKIPPED (color not used or is background)
;; Layer 2 (Color: #FC584A) - SKIPPED (color not used or is background)
BOT1_F1_LAYER3: ; Brush Color Index 3 (Actual Color: #FFFFFF)
    DB #1F,#E0,#FF,#B0,#CF,#B0,#0F,#F0,#07,#E0,#00,#00,#2F,#F0,#6F,#F0
    DB #6F,#F0,#6E,#70,#00,#00,#01,#80,#01,#80,#01,#80,#01,#E0,#01,#E0

;; ---- End of Frame: bot1_F1 ----


; Unified pattern label for sprite 0 (for easy reference in loading code)
SPRITE_0_PATTERN EQU BOT1_F0_LAYER3

; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Initialize sprite system
    call clear_all_sprites

    ; Load sprite patterns to VRAM
    call load_sprite_patterns

    ; Initialize sprite positions (all invisible by default)
    xor a
    ld (active_sprite_count), a

    ret

load_sprite_patterns:
    ; Load all sprite patterns to VRAM sprite pattern table

    ; Load sprite 0: bot1 (BIOS LDIRVM handles timing)
    ld hl, SPRITE_0_PATTERN
    ld de, SPRPAT + (0 * 32) ; Each 16x16 sprite = 32 bytes (4 patterns)
    ld bc, 32                       ; 16x16 sprite size
    call LDIRVM                     ; BIOS handles safe VRAM access
    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; Show sprite (A = sprite number, B = X, C = Y, D = pattern, E = color)
show_sprite:
    push bc                       ; Preserve parameters
    push de

    ; Calculate sprite offset (A = sprite number)
    ld l, a                       ; L = sprite number
    ld h, 0                       ; HL = sprite number

    ; Set X position
    push hl
    ld de, sprite_x_pos
    add hl, de                    ; HL points to sprite X position
    ld (hl), b                    ; Set X position
    pop hl

    ; Set Y position
    push hl
    ld de, sprite_y_pos
    add hl, de                    ; HL points to sprite Y position
    ld (hl), c                    ; Set Y position
    pop hl

    ; Set pattern
    push hl
    ld de, sprite_pattern
    add hl, de                    ; HL points to sprite pattern
    pop de                        ; Restore original HL to DE
    push de                       ; Save it again
    ld (hl), d                    ; Set pattern number
    pop hl

    ; Set color
    ld de, sprite_color
    add hl, de                    ; HL points to sprite color
    pop de                        ; Get original DE back
    ld (hl), e                    ; Set color

    pop bc                        ; Restore original parameters
    ret

; Clear all sprites (make them invisible)
clear_all_sprites:
    ld hl, sprite_y_pos
    ld de, sprite_y_pos+1
    ld bc, 0                     ; 1 sprites - 1
    ld (hl), SPRITE_INVISIBLE     ; Y=209 (invisible)
    ldir
    ret

; Hide specific sprite (A = sprite number)
hide_sprite:
    ld hl, sprite_y_pos
    ld e, a
    ld d, 0
    add hl, de                    ; HL points to sprite Y position
    ld (hl), SPRITE_INVISIBLE     ; Make invisible
    ret

; Update sprite positions to VRAM
update_sprites_to_vram:
    ; Copy sprite attributes from RAM to VRAM
    ; BIOS LDIRVM handles timing automatically
    ld hl, sprite_y_pos
    ld de, SPRATR
    ld bc, 4                    ; 1 sprites * 4 bytes each
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_ID_BOT1    EQU 0      ; Sprite: bot1

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
