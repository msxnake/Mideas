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

INIT_SPRITES:
    ; Initialize sprite system
    CALL CLEAR_ALL_SPRITES

    ; Load sprite patterns to VRAM
    CALL LOAD_SPRITE_PATTERNS

    ; Initialize sprite positions (all invisible by default)
    XOR A
    LD (active_sprite_count), A

    RET

LOAD_SPRITE_PATTERNS:
    ; Load all sprite patterns to VRAM sprite pattern table

    ; Load sprite 0: bot1 (BIOS LDIRVM handles timing)
    LD HL, SPRITE_0_PATTERN
    LD DE, SPRPAT + (0 * 32) ; Each 16x16 sprite = 32 bytes (4 patterns)
    LD BC, 32                       ; 16x16 sprite size
    CALL LDIRVM                     ; BIOS handles safe VRAM access
    RET

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; Show sprite (A = sprite number, B = X, C = Y, D = pattern, E = color)
SHOW_SPRITE:
    PUSH BC                       ; Preserve parameters
    PUSH DE

    ; Calculate sprite offset (A = sprite number)
    LD L, A                       ; L = sprite number
    LD H, 0                       ; HL = sprite number

    ; Set X position
    PUSH HL
    LD DE, sprite_x_pos
    ADD HL, DE                    ; HL points to sprite X position
    LD (HL), B                    ; Set X position
    POP HL

    ; Set Y position
    PUSH HL
    LD DE, sprite_y_pos
    ADD HL, DE                    ; HL points to sprite Y position
    LD (HL), C                    ; Set Y position
    POP HL

    ; Set pattern
    PUSH HL
    LD DE, sprite_pattern
    ADD HL, DE                    ; HL points to sprite pattern
    POP DE                        ; Restore original HL to DE
    PUSH DE                       ; Save it again
    LD (HL), D                    ; Set pattern number
    POP HL

    ; Set color
    LD DE, sprite_color
    ADD HL, DE                    ; HL points to sprite color
    POP DE                        ; Get original DE back
    LD (HL), E                    ; Set color

    POP BC                        ; Restore original parameters
    RET

; Clear all sprites (make them invisible)
CLEAR_ALL_SPRITES:
    LD HL, sprite_y_pos
    LD DE, sprite_y_pos+1
    LD BC, 0                     ; 1 sprites - 1
    LD (HL), SPRITE_INVISIBLE     ; Y=209 (invisible)
    LDIR
    RET

; Hide specific sprite (A = sprite number)
HIDE_SPRITE:
    LD HL, sprite_y_pos
    LD E, A
    LD D, 0
    ADD HL, DE                    ; HL points to sprite Y position
    LD (HL), SPRITE_INVISIBLE     ; Make invisible
    RET

; Update sprite positions to VRAM
UPDATE_SPRITES_TO_VRAM:
    ; Copy sprite attributes from RAM to VRAM
    ; BIOS LDIRVM handles timing automatically
    LD HL, sprite_y_pos
    LD DE, SPRATR
    LD BC, 4                    ; 1 sprites * 4 bytes each
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_ID_BOT1    EQU 0      ; Sprite: bot1

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
