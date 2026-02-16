;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; MINIMAL V-BLANK INTERRUPT TEST
;; Purpose: Diagnose why V-Blank interrupts are not working
;; Expected: Border color should flash between red and green
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F       ; Change screen mode
WRTVDP  EQU #0047       ; Write to VDP register

; ==================================================================
; SYSTEM ADDRESSES
; ==================================================================
H_TIMI  EQU #FD9F       ; V-Blank interrupt hook address
BDRCLR  EQU #F3EB       ; Border color system variable

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    ORG #4000                   ; MSX cartridge start address

; Cartridge signature
    DB "AB"                     ; MSX cartridge signature
    DW INIT_ROM                 ; Initialization address
    DW 0                        ; Statement handler (not used)
    DW 0                        ; Device handler (not used)
    DW 0                        ; Text handler (not used)
    DW 0,0,0                    ; Reserved

; ==================================================================
; ROM INITIALIZATION
; ==================================================================
INIT_ROM:
    ; Disable interrupts during setup
    DI

    ; Initialize stack pointer to safe area
    LD SP, #F380

    ; Set border color to black initially
    LD A, 1                     ; Black
    LD (BDRCLR), A

    ; Change to Screen 2 (graphics mode)
    LD A, 2
    CALL CHGMOD

    ; TEST 1: Verify H_TIMI address is writable
    ; Save original value
    LD HL, (H_TIMI)
    PUSH HL                     ; Save on stack

    ; Try to write test value
    LD HL, #1234
    LD (H_TIMI), HL

    ; Read back to verify
    LD DE, (H_TIMI)
    LD A, D
    CP #12
    JR NZ, h_timi_error         ; If not equal, H_TIMI is not writable
    LD A, E
    CP #34
    JR NZ, h_timi_error

    ; H_TIMI is writable, restore original value
    POP HL
    LD (H_TIMI), HL

    ; Install our minimal V-Blank handler
    LD HL, minimal_vblank_handler
    LD (H_TIMI), HL

    ; Enable interrupts
    EI

    ; Main loop - just wait
main_loop:
    HALT                        ; Wait for interrupt
    JR main_loop

; ==================================================================
; ERROR HANDLER - H_TIMI NOT WRITABLE
; ==================================================================
h_timi_error:
    ; H_TIMI address is not writable!
    ; Set border to RED to indicate error
    POP HL                      ; Clean up stack
    LD A, 6                     ; Red color
    LD (BDRCLR), A

    ; Infinite loop - this indicates H_TIMI problem
error_loop:
    JR error_loop

; ==================================================================
; MINIMAL V-BLANK INTERRUPT HANDLER
; ==================================================================
minimal_vblank_handler:
    ; Save only what we need
    PUSH AF

    ; Toggle border color between red (6) and green (3)
    LD A, (BDRCLR)
    CP 6                        ; Is it red?
    JR Z, set_green

    ; Set to red
    LD A, 6
    JR store_color

set_green:
    ; Set to green
    LD A, 3

store_color:
    LD (BDRCLR), A

    ; Restore register and return
    POP AF
    RETI

; ==================================================================
; PADDING TO ALIGN TO 8KB
; ==================================================================
    DS #6000 - $, #FF