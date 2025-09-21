; ==================================================
; SIMPLE_SPRITE ROM - Generated from Summary System
; ==================================================
; Project: simple_sprite(2)
; Generated: 20/9/2025, 17:31:46
; Sprites: 1
; Entities: 1

        ORG     #4000           ; Konami ROM start

; Konami ROM Header
HEADER:
        DB      "AB"            ; Konami signature
        DW      INIT            ; Initialize routine
        DS      12,0             ; Reserved space

; Constants
SPRITE_COUNT    EQU 1
SCREEN_WIDTH    EQU 32
SCREEN_HEIGHT   EQU 24

; BIOS addresses
CHGMOD  EQU     #005F           ; Change screen mode
LDIRVM  EQU     #005C           ; Load data to VRAM
WRTVRM  EQU     #004D           ; Write to VRAM
PUTSPRITE EQU   #0151           ; Put sprite (if available)

WRTVDP  EQU     #0047           ; Write to VDP register
CLS     EQU     #00C3           ; Clear screen
CHGCLR  EQU     #00A5           ; Change colors
ERAFNK  EQU     #00CC           ; Erase function keys   
BAKCLR  EQU     #FC00           ; Background color
BDRCLR  EQU     #FC01           ; Border color
CLIKSW  EQU     #FC02           ; Click switch
HKEY    EQU     #FC03           ; Hold key              


  DB "AB"             ; MSX cartridge signature
    DW INIT       ; Initialization address
    DW 0                ; Statement handler (not used)
    DW 0                ; Device handler (not used)
    DW 0                ; Text handler (not used)
    DW 0                ; Reserved
    DW 0                ; Reserved
    DW 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
INIT:
    ; Initialize stack
    LD SP, #F380


    DI                           ; Disable interrupts during init
    ld a,#C9
    ld (HKEY),a
    EI

    ; Set up memory mapper (if any)
    ; This is a placeholder for future mapper initialization
    ; call setupROMRAMslots

    xor a       
    ld (CLIKSW),a ; Click switch off
    ; Change background colors:
    ld (BAKCLR),a 
    ld (BDRCLR),a
    call CHGCLR
   
    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

        ; Load sprite patterns to VRAM
        LD      HL,CARA1_PATTERN
        LD      DE,#3800        ; Sprite pattern table
        LD      BC,64           ; 64 bytes (16x16 sprite)
        CALL    LDIRVM

        ; Set sprite colors
        LD      HL,CARA1_COLOR
        LD      DE,#3C00        ; Sprite color table
        LD      BC,32           ; 32 bytes color data
        CALL    LDIRVM

        ; Initialize sprite position (center of screen)
        LD      A,128           ; X position (center)
        LD      (SPRITE_X),A
        LD      A,96            ; Y position (center)
        LD      (SPRITE_Y),A

        ; Set sprite attributes
        CALL    SET_SPRITE_0

        ; Clear name table (black screen)
        LD      HL,BLANK_SCREEN
        LD      DE,#1800        ; Name table
        LD      BC,768          ; 32x24 screen
        CALL    LDIRVM

        ; Enable interrupts
        EI

; Main loop
MAIN_LOOP:
        ; Wait for V-Blank
        HALT

        ; Update frame counter
        LD      HL,(FRAME_COUNT)
        INC     HL
        LD      (FRAME_COUNT),HL

        ; Keep sprite visible
        CALL    SET_SPRITE_0

        ; Continue loop
        JR      MAIN_LOOP

; Set sprite 0 position and pattern
SET_SPRITE_0:
        ; Write sprite 0 attributes to VRAM
        ; Sprite attribute table starts at #1B00

        ; Y position
        LD      A,(SPRITE_Y)
        LD      DE,#1B00        ; Sprite attribute table
        CALL    WRTVRM

        ; X position
        LD      A,(SPRITE_X)
        LD      DE,#1B01
        CALL    WRTVRM

        ; Pattern number (0)
        LD      A,0
        LD      DE,#1B02
        CALL    WRTVRM

        ; Color (white)
        LD      A,#F0           ; White
        LD      DE,#1B03
        CALL    WRTVRM

        RET

; Sprite pattern data for "cara1"
      
CARA1_PATTERN:
        ; 16x16 sprite pattern (cara1)
        ; Top half (8x16)
        DB      #00,#00,#3C,#7E,#FF,#E7,#C3,#81
        DB      #81,#C3,#E7,#FF,#7E,#3C,#00,#00
        DB      #00,#00,#3C,#7E,#FF,#E7,#C3,#81
        DB      #81,#C3,#E7,#FF,#7E,#3C,#00,#00
        ; Bottom half (8x16)
        DB      #00,#00,#3C,#7E,#FF,#E7,#C3,#81
        DB      #81,#C3,#E7,#FF,#7E,#3C,#00,#00
        DB      #00,#00,#3C,#7E,#FF,#E7,#C3,#81
        DB      #81,#C3,#E7,#FF,#7E,#3C,#00,#00

; Color data
CARA1_COLOR:
        DB      #F1,#F1,#F1,#F1,#F1,#F1,#F1,#F1  ; White on black
        DB      #F1,#F1,#F1,#F1,#F1,#F1,#F1,#F1
        DB      #F1,#F1,#F1,#F1,#F1,#F1,#F1,#F1
        DB      #F1,#F1,#F1,#F1,#F1,#F1,#F1,#F1


; Blank screen data
; RAM Variables
        ORG     #C000
SPRITE_X:       DS 1            ; Sprite X position
SPRITE_Y:       DS 1            ; Sprite Y position
FRAME_COUNT:    DS 2            ; Frame counter

BLANK_SCREEN:
        DS      768,0           ; 768 bytes of zeros

; Pad ROM to exactly 8K (8192 bytes)
PADDING_START:
        DS      7159,#00        ; Add padding to reach exactly 8K

; 8K boundary marker (exactly at byte 8192)
ROM_8K_END:
        ; ROM ends at exactly 8K

        END