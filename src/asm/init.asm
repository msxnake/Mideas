include "constants.asm"
 MAX_PTR: EQU #FFFF ; Placeholder, to be calculated

;-----------------------------------------------
; PAGE 2:

    org #4000   ; Start in the 2nd slot
 StartOfPage2:

;-----------------------------------------------
    db "AB"     ; ROM signature
    dw Execute  ; start address
BLANK_CHAR_PATTERN: ;aprovechamos valores 0
    db 0,0,0,0,0,0,0,0,0,0,0,0
;-----------------------------------------------

ALL_MAP_TILES_PTR:
 incbin "bin/AllPatterns.BIN"

ALL_MAP_TILES_COL:
 incbin "bin/AllColors.BIN"

PAN1_LAYOUT_DATA:
 incbin "bin/MapLayout.bin"




BLANK_CHAR_COLOR:
    DB #11,#11,#11,#11,#11,#11,#11,#11


;-------------------------------------------------------------------------------
; Set Video Mode
; Configures the VDP registers for Screen 2.
; Register 7 is explicitly set to 00h for a black background.
;-------------------------------------------------------------------------------
 Execute:
    di
    ; init the stack:
    ld sp,#F380
    ; reset some interrupts to make sure it runs in some MSX computers
    ; with disk controllers installed in some interrupt handlers
    ld a,#C9
    ld (HKEY),a
    ld (TIMI),a
    ei

    ;call SETPAGES32K

    ; Silence, init keyboard, and clear config:
    xor a
    ld (CLIKSW),a
    ld (deterministic),a


    ld a,1
    ld hl,$f3e9
    ld [hl],15
    inc hl
    ld [hl],1
    inc hl
    ld [hl],1

    ; Change background colors:
    ld (BAKCLR),a
    ld (BDRCLR),a
    call CHGCLR

    ld a,2      ; Change screen mode
    call CHGMOD


    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ;call CheckIf60Hz
    ld (isComputer50HzOr60Hz),a ; 0: 50Hz, 1: 60Hz

    call loadMyScreen
    call redef_spr

 bucle1:
  jp bucle1

redef_spr:
            ;es redefineixen tots els sprites
    ; define sprites
        ld      hl,spr_jack
        ld      de,SPRTBL
        ld      b,160
        call    DoCopy
    ; define sprite
        ld      hl,SPRATR
        ld      de,sprites
        ld      bc,32
        ldir
        ret


;-----------------------------------------------------------
;hl=origen
;de=destino
;b=blokes de 8 bytes

DoCopy:
 ld a,e
 di
 out ($99),a
 ld a,d
 or a,$40

 out ($99),a
 ei
 ld c,$98
 VdpReady:
  ld d,b
  outi
  outi
  outi
  outi
  outi
  outi
  outi
  ld b,d
  outi
  jp nz,VdpReady

  ret

;-------------------------------------------------------------------------------
; loadMyScreen (NEW ROUTINE)
; Loads custom tile patterns and colors into all three VRAM banks,
; and then draws the screen layout.
;-------------------------------------------------------------------------------
 loadMyScreen:


 loadPatternBanks:
        ; --- Load TILE1 Pattern Data into all three PGT banks ---
        LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2
        LD BC,MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the second PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #800 ; Destination VRAM address for PGT bank 1
        LD BC, MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the third PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #1000 ; Destination VRAM address for P
        LD BC, MAX_PTR        ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM




 loadColorBanks:
        ; --- Load TILE1 Color Data into all three CAT banks ---
        LD      HL,ALL_MAP_TILES_COL; Source RAM address for TILE1 colors
        LD      DE, CLRTBL2
        LD      BC, MAX_PTR      ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; Load TILE1 colors into the second CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #800 ; Destination VRAM address for CAT
        LD      BC,MAX_PTR    ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM
        ; Load TILE1 colors into the third CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #1000 ; Destination VRAM address for
        LD      BC,MAX_PTR     ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; --- Load Blank Character Pattern (character #255) into all three PGT banks ---

 loadBlankCharPatterns:
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD     DE, CHRTBL2 + #0000 + (255 * 8) ; Destination VRAM address for char #255 in PGT bank 0
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the second PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 1
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the third PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 2
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM




 loadBlankCharColors:
        ; --- Load Blank Character Color Data (character #255) into all three CAT banks ---
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #0000 + (255 * 8)
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the second CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 1
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the third CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 2
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM



        ; --- Draw the Screen Layout to the Name Table ---
        CALL    drawScreenLayout
        RET


;-------------------------------------------------------------------------------
; Draw Screen Layout
; Copies the PAN1_LAYOUT_DATA to the VRAM Name Table.
;-------------------------------------------------------------------------------
 drawScreenLayout:
        LD      HL, PAN1_LAYOUT_DATA  ; Source RAM address
        LD      DE, #1800             ; Destination VRAM address (Name Table base)
        LD      BC, 256 * 3               ; Size of the layout data (32 columns * 24 rows)
        CALL    LDIRVM           ; Copy data to VRAM


        RET
