
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
    ; Disable interrupts during initialization
    DI

    
    ; init the stack:
    ld sp,#F380
    ; reset some interrupts to make sure it runs in some MSX computers 
    ; with disk controllers installed in some interrupt handlers
    ld a,#C9
    ld (HKEY),a
    ld (TIMI),a

    EI
    

    ; call SETPAGES32K  ; commented out - function not defined

    ; Silence, init keyboard, and clear config:
    xor a
    ld (CLIKSW),a
    ld (deterministic),a
    ; Change background colors:
    ld (BAKCLR),a
    ld a,1
    ld (BDRCLR),a
    call CHGCLR


    
    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP


  

    ; Jump to main program
    JP MAIN_PROGRAM

; ==================================================================
; END OF HEADER
; ==================================================================