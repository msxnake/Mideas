;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; TEST SIMPLE V-BLANK - Diagnóstico mínimo
;; Solo cambia el color del borde para probar V-Blank
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; BIOS Functions
CHGMOD  EQU #005F       ; Change screen mode
WRTVDP  EQU #0047       ; Write to VDP register

; System Variables
H_TIMI  EQU #FD9F       ; V-Blank interrupt hook

; Colors
COLOR_BLACK EQU 1
COLOR_RED   EQU 6
COLOR_GREEN EQU 3

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    ORG #4000

; Cartridge signature
    DB "AB"
    DW INIT_ROM
    DW 0,0,0,0,0

; ==================================================================
; INITIALIZATION
; ==================================================================
INIT_ROM:
    ; Disable interrupts
    DI

    ; Set stack
    LD SP, #F380

    ; Set background and border to black
    LD A, COLOR_BLACK
    LD (#F3EA), A           ; Background
    LD (#F3EB), A           ; Border

    ; Change to Screen 2
    LD A, 2
    CALL CHGMOD

    ; CRITICAL: Enable V-Blank interrupts in VDP
    LD BC, #E001            ; Register 1 = #E0 (bit 5 = 1 for interrupts)
    CALL WRTVDP

    ; Install V-Blank hook
    LD HL, simple_vblank
    LD (H_TIMI), HL

    ; Enable interrupts
    EI

    ; Main loop - just wait
MAIN_LOOP:
    HALT
    JP MAIN_LOOP

; ==================================================================
; SIMPLE V-BLANK HANDLER - Just change border color
; ==================================================================
simple_vblank:
    PUSH AF

    ; Read current border color
    LD A, (#F3EB)
    CP COLOR_RED
    JR Z, set_green

    ; Set red
    LD A, COLOR_RED
    JR store_color

set_green:
    LD A, COLOR_GREEN

store_color:
    LD (#F3EB), A

    POP AF
    RETI

; ==================================================================
; PADDING TO 8KB
; ==================================================================
    DS #6000 - $, #FF