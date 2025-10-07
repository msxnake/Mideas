; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; 1 sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================

; Sprite 0: spr1
SPR1_F0_LAYER0:
    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00

; Unified pattern label for sprite 0
SPRITE_0_PATTERN EQU SPR1_F0_LAYER0

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
    ; Load sprite 0: spr1
    ld hl, SPRITE_0_PATTERN
    ld de, SPRPAT + (0 * 32)
    ld bc, 32
    call LDIRVM
    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:


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
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, 1
.clear_loop:
    ld (hl), SPRITE_INVISIBLE
    ld de, 4
    add hl, de
    djnz .clear_loop
    ret

; Hide specific sprite (A = sprite index)
hide_sprite:
    ; Calculate address: sprite_attributes + (index * 4)
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
    ld bc, 4  ; 4 bytes per sprite
    call LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU 209
SPRITE_ID_SPR1    EQU 0      ; spr1

; ==================================================================
; RAM REQUIREMENTS (define this in your main RAM section)
; ==================================================================
; sprite_attributes: ds 4  ; Interleaved buffer: Y, X, Pattern, Color
; active_sprite_count: db 0
;
; Total: 5 bytes of RAM

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
