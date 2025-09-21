;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; TEST WHITE SQUARE - FIXED VERSION
;; Minimal diagnostic version to fix sprite movement issues
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F       ; Change screen mode
WRTVDP  EQU #0047       ; Write to VDP register
SNSMAT  EQU #0141       ; Read keyboard matrix
FILVRM  EQU #0056       ; Fill VRAM with data
LDIRVM  EQU #005C       ; Copy data to VRAM
LDIRMV  EQU #0059       ; Copy data from VRAM
WRTVRM  EQU #004D       ; Write byte to VRAM (BIOS function)
RDVRM   EQU #004A       ; Read byte from VRAM

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
H_TIMI  EQU #FD9F       ; V-Blank interrupt hook
BDRCLR  EQU #F3EB       ; Border color (system variable)

; ==================================================================
; VRAM ADDRESSES (Screen 2)
; ==================================================================
CHRTBL2 EQU #0000       ; Character pattern table
NAMTBL2 EQU #1800       ; Name table
CLRTBL2 EQU #2000       ; Color table
SPRATR2 EQU #1B00       ; Sprite attribute table
SPRTBL2 EQU #3800       ; Sprite pattern table

; ==================================================================
; COLORS
; ==================================================================
COLOR_BLACK         EQU 1
COLOR_WHITE         EQU 15
COLOR_RED           EQU 6
COLOR_GREEN         EQU 3
COLOR_TRANSPARENT   EQU 0

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
; GAME VARIABLES (RAM AREA)
; ==================================================================
player_x            EQU #C000   ; Player X position (0-255)
player_y            EQU #C001   ; Player Y position (0-191)
old_vblank_routine  EQU #C002   ; Storage for original V-Blank routine (2 bytes)
frame_counter       EQU #C004   ; Frame counter for visual feedback
border_color        EQU #C005   ; Current border color
movement_counter    EQU #C006   ; Movement timing counter

; ==================================================================
; ROM INITIALIZATION
; ==================================================================
INIT_ROM:
    ; Disable interrupts during setup
    DI

    ; Initialize stack
    LD SP, #F380

    ; Clear keyboard click sound
    XOR A
    LD (#F3DB), A               ; CLIKSW = 0

    ; Set background color to black
    LD A, COLOR_BLACK
    LD (#F3EA), A               ; BAKCLR
    LD (BDRCLR), A             ; BDRCLR (border color)

    ; Change to Screen 2 (graphics mode)
    LD A, 2
    CALL CHGMOD

    ; Enable 16x16 sprites
    LD BC, #E201                ; VDP register 1 = #E2
    CALL WRTVDP

    ; Initialize player position (center of screen)
    LD A, 100                   ; Start X position
    LD (player_x), A
    LD A, 50                    ; Start Y position
    LD (player_y), A

    ; Initialize counters
    XOR A
    LD (frame_counter), A
    LD (movement_counter), A
    LD A, COLOR_BLACK
    LD (border_color), A

    ; Create white square sprite pattern
    CALL CREATE_WHITE_SQUARE

    ; Setup V-Blank interrupt hook
    CALL SETUP_VBLANK_HOOK

    ; Enable interrupts
    EI

    ; Main game loop
MAIN_LOOP:
    HALT                        ; Wait for V-Blank interrupt
    JP MAIN_LOOP

; ==================================================================
; CREATE WHITE SQUARE SPRITE PATTERN
; ==================================================================
CREATE_WHITE_SQUARE:
    ; Clear sprite attribute table first
    LD HL, SPRATR2
    LD BC, 128                  ; 32 sprites * 4 attributes = 128 bytes
    LD A, 208                   ; Y=208 makes sprites invisible
    CALL FILVRM

    ; Create white square pattern data in VRAM
    LD HL, white_square_pattern
    LD DE, SPRTBL2              ; Sprite pattern table
    LD BC, 32                   ; 32 bytes (16x16 sprite = 2 8x8 patterns)
    CALL LDIRVM

    ; Initialize sprite 0 attributes using BIOS WRTVRM
    LD HL, SPRATR2              ; Y position
    LD A, (player_y)
    CALL WRTVRM

    LD HL, SPRATR2 + 1          ; X position
    LD A, (player_x)
    CALL WRTVRM

    LD HL, SPRATR2 + 2          ; Pattern number
    LD A, 0
    CALL WRTVRM

    LD HL, SPRATR2 + 3          ; Color
    LD A, COLOR_WHITE
    CALL WRTVRM

    RET

; White square pattern data (16x16 = two 8x8 patterns)
white_square_pattern:
    ; First 8x8 pattern (top-left)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Second 8x8 pattern (top-right)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF

; ==================================================================
; SETUP V-BLANK INTERRUPT HOOK
; ==================================================================
SETUP_VBLANK_HOOK:
    ; Save original V-Blank routine
    LD HL, (H_TIMI)
    LD (old_vblank_routine), HL

    ; Install our V-Blank handler
    LD HL, vblank_handler
    LD (H_TIMI), HL

    RET

; ==================================================================
; V-BLANK INTERRUPT HANDLER WITH VISUAL FEEDBACK
; ==================================================================
vblank_handler:
    ; Save all registers
    PUSH AF
    PUSH BC
    PUSH DE
    PUSH HL

    ; VISUAL FEEDBACK: Change border color each frame to prove V-Blank works
    LD A, (frame_counter)
    INC A
    LD (frame_counter), A

    ; Change border color every 30 frames (red/green alternating)
    AND #1F                     ; Use lower 5 bits
    JR NZ, skip_border_change

    ; Toggle border color between red and green
    LD A, (border_color)
    CP COLOR_RED
    JR Z, set_green_border

set_red_border:
    LD A, COLOR_RED
    LD (border_color), A
    LD (BDRCLR), A
    JR skip_border_change

set_green_border:
    LD A, COLOR_GREEN
    LD (border_color), A
    LD (BDRCLR), A

skip_border_change:
    ; AUTOMATIC MOVEMENT: Simple increment X position every 10 frames
    LD A, (movement_counter)
    INC A
    LD (movement_counter), A
    CP 10                       ; Move every 10 frames (slower movement)
    JR C, skip_movement

    ; Reset movement counter
    XOR A
    LD (movement_counter), A

    ; Move sprite right, wrap around at edge
    LD A, (player_x)
    ADD A, 4                    ; Move 4 pixels right
    CP 240                      ; Check if near right edge
    JR C, update_x_position
    LD A, 16                    ; Wrap to left side

update_x_position:
    LD (player_x), A

    ; Update sprite X position in VRAM using BIOS function
    LD HL, SPRATR2 + 1          ; X position attribute
    CALL WRTVRM

skip_movement:
    ; Restore all registers
    POP HL
    POP DE
    POP BC
    POP AF

    ; Return from interrupt
    RETI

; ==================================================================
; PADDING TO 8KB BOUNDARY
; ==================================================================
current_pos     EQU $
target_pos      EQU (#6000)     ; Next 8KB boundary after #4000
padding_size    EQU target_pos - current_pos

; Fill remaining space with #FF
    DS padding_size, #FF

; ==================================================================
; END OF ROM
; ==================================================================