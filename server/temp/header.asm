; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization
; ==================================================================

    ORG #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    DB "AB"             ; MSX cartridge signature
    DW INIT_ROM         ; Initialization address
    DW 0                ; Statement handler (not used)
    DW 0                ; Device handler (not used)
    DW 0                ; Text handler (not used)
    DW 0                ; Reserved
    DW 0                ; Reserved
    DW 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
INIT_ROM:
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

    ; init fill screen
    call FILLSCREEN

     call CheckIf60Hz
    ld (isComputer50HzOr60Hz),a

    ;init random seed
    call randomSeedUpdate


    ; Jump to main program
    JP MAIN_PROGRAM

; ==================================================================
; END OF HEADER
; ==================================================================
