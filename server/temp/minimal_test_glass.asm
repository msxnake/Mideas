; ==================================================================
; MINIMAL MSX TEST - COMPATIBLE CON GLASS
; ==================================================================

; Glass syntax - sin ORG inicial
; Glass maneja automaticamente el cartridge header

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  equ 005Fh        ; Change screen mode
CLS     equ 00C3h        ; Clear screen
CHPUT   equ 00A2h        ; Character output
LDIRVM  equ 005Ch        ; Block transfer to VRAM
WRTVRM  equ 0047h        ; Write data to VRAM
ERAFNK  equ 00CCh        ; Erase function keys

; ==================================================================
; VRAM ADDRESSES
; ==================================================================
CHRTBL2 equ 0000h        ; Pattern table
CLRTBL2 equ 2000h        ; Color table
NAMETBL equ 1800h        ; Name table
SPRATR  equ 1B00h        ; Sprite attribute table
SPRPAT  equ 3800h        ; Sprite pattern table

; ==================================================================
; RAM VARIABLES
; ==================================================================
sprite_x_pos    equ 0C000h
sprite_y_pos    equ 0C020h
sprite_pattern  equ 0C040h
sprite_color    equ 0C060h

; ==================================================================
; MAIN PROGRAM
; ==================================================================
start:
    di                           ; Disable interrupts during init

    ; Initialize stack
    ld sp, 0F380h

    ; Clear variables
    ld hl, sprite_x_pos
    ld de, sprite_x_pos+1
    ld bc, 127                   ; Clear 128 bytes
    ld (hl), 0
    ldir

    ; Initialize Screen 2
    ld a, 2
    call CHGMOD                  ; BIOS handles everything
    call ERAFNK
    call CLS

    ; Load patterns
    call LOAD_PATTERNS

    ; Show test sprite
    ld a, 0                      ; Sprite 0
    ld b, 100                    ; X = 100
    ld c, 80                     ; Y = 80
    ld d, 0                      ; Pattern 0
    ld e, 15                     ; Color 15 (white)
    call SHOW_SPRITE

    ; Update sprites to VRAM
    call UPDATE_SPRITES_TO_VRAM

    ei                           ; Re-enable interrupts

    ; Display message
    ld h, 10
    ld l, 10
    call 00C6h                   ; POSIT
    ld a, 'O'
    call CHPUT
    ld a, 'K'
    call CHPUT

MAIN_LOOP:
    halt                         ; Wait for interrupt
    jp MAIN_LOOP

; ==================================================================
; LOAD PATTERNS
; ==================================================================
LOAD_PATTERNS:
    ; Load test pattern (8 bytes for simple 8x8 sprite)
    ld hl, TEST_SPRITE_PATTERN
    ld de, SPRPAT
    ld bc, 8                     ; Simple 8x8 sprite
    call LDIRVM
    ret

; ==================================================================
; SHOW SPRITE - SIMPLIFIED
; ==================================================================
SHOW_SPRITE:
    ; Input: A=sprite#, B=X, C=Y, D=pattern, E=color
    ; Simplified version - just show sprite 0
    ld hl, sprite_y_pos
    ld (hl), c                   ; Y position
    inc hl
    ld (hl), b                   ; X position
    inc hl
    ld (hl), d                   ; Pattern
    inc hl
    ld (hl), e                   ; Color
    ret

; ==================================================================
; UPDATE SPRITES TO VRAM
; ==================================================================
UPDATE_SPRITES_TO_VRAM:
    ; Copy sprite data to VRAM
    ld hl, sprite_y_pos
    ld de, SPRATR
    ld bc, 32                    ; First 8 sprites
    call LDIRVM
    ret

; ==================================================================
; TEST DATA
; ==================================================================
TEST_SPRITE_PATTERN:
    ; Simple 8x8 sprite pattern
    db 0FFh,81h,81h,81h,81h,81h,81h,0FFh