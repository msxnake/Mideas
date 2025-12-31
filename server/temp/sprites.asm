; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: 1
; Total Hardware Sprites (Layers): 32
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================

; Sprite Asset 0: bot1
;; Sprite: bot1
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#3EB847, C2=#FC584A, C3=#FFFFFF

SPRITE_BOT1_0_WIDTH     EQU 16
SPRITE_BOT1_0_HEIGHT    EQU 16
SPRITE_BOT1_0_FRAMES    EQU 2

;; ---- Sprite Frame: bot1_0_F0 ----
;; Size: 16x16
BOT1_0_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #000000)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_0_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #3EB847)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_0_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #FC584A)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_0_F0_LAYER3: ; Brush Color Index 3 (Actual Color: #FFFFFF)
    DB #1F,#7F,#CF,#8F,#07,#00,#2F,#6F,#6F,#6F,#00,#0C,#FC,#FC,#C0,#C0
    DB #E0,#B0,#B0,#F0,#E0,#00,#F0,#BD,#BD,#F0,#00,#1C,#1C,#07,#07,#07

;; ---- End of Frame: bot1_0_F0 ----

;; ---- Sprite Frame: bot1_0_F1 ----
;; Size: 16x16
BOT1_0_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #000000)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_0_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #3EB847)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_0_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #FC584A)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_0_F1_LAYER3: ; Brush Color Index 3 (Actual Color: #FFFFFF)
    DB #1F,#FF,#CF,#0F,#07,#00,#2F,#6F,#6F,#6E,#00,#01,#01,#01,#01,#01
    DB #E0,#B0,#B0,#F0,#E0,#00,#F0,#F0,#F0,#70,#00,#80,#80,#80,#E0,#E0

;; ---- End of Frame: bot1_0_F1 ----


; Unified pattern label for sprite 0
SPRITE_0_PATTERN EQU BOT1_0_F0_LAYER0

; Auto-generated mirrored version for bot1 (facing: right)
;; Sprite: bot1_MIRRORED
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#3EB847, C2=#FC584A, C3=#FFFFFF

SPRITE_BOT1_MIRRORED_0_WIDTH     EQU 16
SPRITE_BOT1_MIRRORED_0_HEIGHT    EQU 16
SPRITE_BOT1_MIRRORED_0_FRAMES    EQU 2

;; ---- Sprite Frame: bot1_MIRRORED_0_F0 ----
;; Size: 16x16
BOT1_MIRRORED_0_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #000000)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_MIRRORED_0_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #3EB847)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_MIRRORED_0_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #FC584A)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_MIRRORED_0_F0_LAYER3: ; Brush Color Index 3 (Actual Color: #FFFFFF)
    DB #07,#0D,#0D,#0F,#07,#00,#0F,#BD,#BD,#0F,#00,#38,#38,#E0,#E0,#E0
    DB #F8,#FE,#F3,#F1,#E0,#00,#F4,#F6,#F6,#F6,#00,#30,#3F,#3F,#03,#03

;; ---- End of Frame: bot1_MIRRORED_0_F0 ----

;; ---- Sprite Frame: bot1_MIRRORED_0_F1 ----
;; Size: 16x16
BOT1_MIRRORED_0_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #000000)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_MIRRORED_0_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #3EB847)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_MIRRORED_0_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #FC584A)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

BOT1_MIRRORED_0_F1_LAYER3: ; Brush Color Index 3 (Actual Color: #FFFFFF)
    DB #07,#0D,#0D,#0F,#07,#00,#0F,#0F,#0F,#0E,#00,#01,#01,#01,#07,#07
    DB #F8,#FF,#F3,#F0,#E0,#00,#F4,#F6,#F6,#76,#00,#80,#80,#80,#80,#80

;; ---- End of Frame: bot1_MIRRORED_0_F1 ----


; Unified pattern label for mirrored sprite 0
SPRITE_0_PATTERN_MIRRORED EQU BOT1_MIRRORED_0_F0_LAYER0

; ==================================================================
; PLACEHOLDER SPRITE PATTERN (for entities with missing sprite assets)
; ==================================================================
; 16x16 white square sprite (solid fill)
SPRITE_PLACEHOLDER_PATTERN:
    ; Top half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Bottom half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half top (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half bottom (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF


; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
    db 2 ; Sprite 0: bot1

; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
    dw SPRITE_0_FRAME_PTRS

; Sprite 0: bot1 frame pointers
SPRITE_0_FRAME_PTRS:
    dw BOT1_0_F0_LAYER0
    dw BOT1_0_F1_LAYER0
 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
    db 0, 1 ; Entity 0 (PLACEHOLDER)
    ds 62, 0 ; Padding

; Table: Entity -> Sprite Asset Index
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index:
    db #FF ; Entity 0 (PLACEHOLDER)
    ds 31, #FF ; Padding
 
; Table: Hardware Sprite Layer Colors 
; Format: db color_index 
sprite_layer_colors: 
    ; Entity 0 (PLACEHOLDER) layers:
    db 15 ; Layer 0
    ds 31, 0 ; Padding

; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    call clear_all_sprites
    call load_sprite_patterns
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
    ; Load patterns for all active entities
    ; Entity 0: PLACEHOLDER (1 layers)
    ; Base HW Sprite: 0
    ld hl, SPRITE_PLACEHOLDER_PATTERN
    ld de, SPRPAT + (0 * 32)
    ld bc, 32 ; Load 1 layers (32 bytes each)
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: If Y=209 (invisible), force it to visible (e.g. 100)
    push af
    ld a, c
    cp 209
    jr nz, .y_ok
    ld c, 100       ; Force visible Y
.y_ok:
    pop af

    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4
    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, 32
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, 128  ; 4 bytes per sprite
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU 224

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds 128
; active_sprite_count: db 0
