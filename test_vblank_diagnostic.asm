;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; V-BLANK INTERRUPT DIAGNOSTIC TEST
;; Tests multiple aspects of interrupt system
;; Expected behaviors based on results:
;; - Border RED: H_TIMI not writable (critical error)
;; - Border BLUE: VDP interrupts disabled (need to enable)
;; - Border flashing RED/GREEN: V-Blank working correctly
;; - Border stays BLACK: Interrupts completely broken
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F       ; Change screen mode
WRTVDP  EQU #0047       ; Write to VDP register
RDVRM   EQU #004A       ; Read from VRAM

; ==================================================================
; SYSTEM ADDRESSES
; ==================================================================
H_TIMI  EQU #FD9F       ; V-Blank interrupt hook address
BDRCLR  EQU #F3EB       ; Border color system variable
RG1SAV  EQU #F3E0       ; VDP register 1 save area

; ==================================================================
; VDP REGISTERS
; ==================================================================
VDP_REG1_IE  EQU #E0    ; VDP register 1 with interrupts enabled

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
; VARIABLES IN RAM
; ==================================================================
test_counter    EQU #C000       ; Counter for testing
original_h_timi EQU #C002       ; Original H_TIMI value (2 bytes)

; ==================================================================
; ROM INITIALIZATION
; ==================================================================
INIT_ROM:
    ; Disable interrupts during setup
    DI

    ; Initialize stack pointer to safe area
    LD SP, #F380

    ; Initialize variables
    XOR A
    LD (test_counter), A

    ; Set border color to black initially
    LD A, 1                     ; Black
    LD (BDRCLR), A

    ; Change to Screen 2 (graphics mode)
    LD A, 2
    CALL CHGMOD

    ; TEST 1: Verify H_TIMI address is writable
    CALL TEST_H_TIMI_WRITABLE
    OR A                        ; Check return value
    JR Z, h_timi_failed

    ; TEST 2: Enable VDP interrupts explicitly
    CALL ENABLE_VDP_INTERRUPTS

    ; TEST 3: Install our V-Blank handler
    CALL INSTALL_VBLANK_HANDLER

    ; Enable CPU interrupts
    EI

    ; Give a visual indication that setup completed
    LD A, 15                    ; White border briefly
    LD (BDRCLR), A

    ; Small delay to show white border
    LD B, 50
delay_loop:
    DJNZ delay_loop

    ; Back to black
    LD A, 1
    LD (BDRCLR), A

    ; Main loop - just wait for interrupts
main_loop:
    HALT                        ; Wait for interrupt
    JR main_loop

; ==================================================================
; TEST H_TIMI WRITABILITY
; ==================================================================
TEST_H_TIMI_WRITABLE:
    ; Save original H_TIMI value
    LD HL, (H_TIMI)
    LD (original_h_timi), HL

    ; Try to write test pattern
    LD HL, #5AA5                ; Test pattern
    LD (H_TIMI), HL

    ; Read back and verify
    LD DE, (H_TIMI)
    LD A, D
    CP #5A
    JR NZ, h_timi_not_writable
    LD A, E
    CP #A5
    JR NZ, h_timi_not_writable

    ; Restore original value
    LD HL, (original_h_timi)
    LD (H_TIMI), HL

    ; Return success (A = 1)
    LD A, 1
    RET

h_timi_not_writable:
    ; Restore what we can
    LD HL, (original_h_timi)
    LD (H_TIMI), HL

    ; Return failure (A = 0)
    XOR A
    RET

h_timi_failed:
    ; H_TIMI is not writable - set border to RED
    LD A, 6                     ; Red
    LD (BDRCLR), A
error_loop:
    JR error_loop

; ==================================================================
; ENABLE VDP INTERRUPTS
; ==================================================================
ENABLE_VDP_INTERRUPTS:
    ; Explicitly enable VDP interrupts
    ; VDP Register 1: IE bit (bit 5) must be set
    LD BC, #E001               ; VDP register 1 = #E0 (interrupts enabled)
    CALL WRTVDP

    ; Also make sure it's saved in system variable
    LD A, #E0
    LD (RG1SAV), A

    RET

; ==================================================================
; INSTALL V-BLANK HANDLER
; ==================================================================
INSTALL_VBLANK_HANDLER:
    ; Install our V-Blank handler
    LD HL, vblank_handler
    LD (H_TIMI), HL
    RET

; ==================================================================
; V-BLANK INTERRUPT HANDLER
; ==================================================================
vblank_handler:
    ; Save only essential registers
    PUSH AF
    PUSH BC

    ; Increment test counter
    LD A, (test_counter)
    INC A
    LD (test_counter), A

    ; Change border color based on counter
    ; Every 60 frames (1 second at 60Hz), toggle between red and green
    LD B, A
    AND #3F                     ; Mask to 0-63
    CP 32                       ; Half of 64
    JR C, set_red_border

    ; Set green border
    LD A, 3                     ; Green
    JR store_border

set_red_border:
    LD A, 6                     ; Red

store_border:
    LD (BDRCLR), A

    ; Restore registers
    POP BC
    POP AF

    ; Return from interrupt
    RETI

; ==================================================================
; PADDING TO ALIGN TO 8KB
; ==================================================================
    DS #6000 - $, #FF