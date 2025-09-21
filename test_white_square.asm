;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; TEST WHITE SQUARE - Juego MSX simple
;; Un cuadrado blanco en el centro que se mueve con los cursores
;; Basado en la documentación de info/
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F       ; Change screen mode
WRTVDP  EQU #0047       ; Write to VDP register
SNSMAT  EQU #0141       ; Read keyboard matrix
FILVRM  EQU #0056       ; Fill VRAM with data
LDIRVM  EQU #005C       ; Copy data to VRAM
WRTVRM  EQU #004D       ; Write byte to VRAM (BIOS function)
SETWRT  EQU #0053       ; Set VRAM write address

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
H_TIMI  EQU #FD9F       ; V-Blank interrupt hook
VDP_DW  EQU #0007       ; VDP data write port

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
COLOR_TRANSPARENT   EQU 0

; ==================================================================
; KEYBOARD MATRIX CONSTANTS
; ==================================================================
; CORRECTED: MSX cursor keys are on ROW 7, not row 8!
; Row 7 bits for cursor keys
CURSOR_UP_BIT       EQU 5
CURSOR_DOWN_BIT     EQU 6
CURSOR_LEFT_BIT     EQU 4
CURSOR_RIGHT_BIT    EQU 7

; Alternative keys for testing (Row 6)
SPACE_BIT           EQU 0   ; Space bar on row 6
; Row 8 for other keys
ESC_BIT             EQU 2   ; ESC key on row 8
TAB_BIT             EQU 3   ; TAB key on row 8

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
input_delay_counter EQU #C004   ; Input delay counter for smoother movement
previous_keys       EQU #C005   ; Previous frame key state
debug_counter       EQU #C006   ; Debug counter for automatic movement
auto_move_enable    EQU #C007   ; Auto movement enable flag
current_keys        EQU #C008   ; Current frame key state
test_mode           EQU #C009   ; Test mode: 0=manual, 1=auto, 2=space_test
border_feedback     EQU #C00A   ; Border color feedback counter

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
    LD (#F3EB), A               ; BDRCLR

    ; Change to Screen 2 (graphics mode)
    LD A, 2
    CALL CHGMOD

    ; Enable 16x16 sprites AND V-Blank interrupts
    LD BC, #E001                ; VDP register 1 = #E0 (interrupts enabled)
    CALL WRTVDP

    ; Initialize player position (center of screen)
    LD A, 128                   ; Center X (256/2)
    LD (player_x), A
    LD A, 1                    ; Center Y (192/2)
    LD (player_y), A

    ; Initialize input variables
    XOR A
    LD (input_delay_counter), A
    LD (previous_keys), A
    LD (current_keys), A
    LD (debug_counter), A
    LD (border_feedback), A

    ; Set test mode (0=manual cursor, 1=auto move, 2=space test)
    LD A, 1                     ; FIXED: Set to 1 for auto movement test
    LD (test_mode), A
    LD (auto_move_enable), A

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

    ; Create white square pattern data in memory
    LD HL, white_square_pattern
    LD DE, SPRTBL2              ; Sprite pattern table
    LD BC, 32                   ; 32 bytes (16x16 sprite = 2 8x8 patterns)
    CALL LDIRVM

    ; Initialize sprite 0 attributes
    LD HL, sprite_attributes
    LD DE, SPRATR2
    LD BC, 4                    ; 4 bytes for one sprite
    CALL LDIRVM

    RET

; White square pattern data (16x16 = two 8x8 patterns)
white_square_pattern:
    ; First 8x8 pattern (top-left)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Second 8x8 pattern (top-right)
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    DB #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF

; Initial sprite attributes
sprite_attributes:
    DB 96                       ; Y position (center)
    DB 128                      ; X position (center)
    DB 0                        ; Pattern number 0
    DB COLOR_WHITE              ; Color (white)

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
; V-BLANK INTERRUPT HANDLER
; ==================================================================
vblank_handler:
    ; Save all registers
    PUSH AF
    PUSH BC
    PUSH DE
    PUSH HL
    PUSH IX
    PUSH IY

    ; VISUAL FEEDBACK: Change border color to prove V-Blank is working
    LD A, (border_feedback)
    INC A
    LD (border_feedback), A
    AND #1F                     ; Use lower 5 bits (0-31)
    JR NZ, skip_border_change

    ; Toggle border color every 32 frames
    LD A, (#F3EB)               ; Read current border color
    CP 6                        ; Red?
    JR Z, set_green_border
    LD A, 6                     ; Set red
    JR store_border_color
set_green_border:
    LD A, 3                     ; Set green
store_border_color:
    LD (#F3EB), A               ; Store new border color

skip_border_change:
    ; Read keyboard input
    CALL READ_KEYBOARD_INPUT

    ; Update player position based on input
    CALL UPDATE_PLAYER_POSITION

    ; Update sprite position in VRAM
    CALL UPDATE_SPRITE_POSITION

    ; Restore all registers
    POP IY
    POP IX
    POP HL
    POP DE
    POP BC
    POP AF

    ; Return from interrupt
    RETI

; ==================================================================
; READ KEYBOARD INPUT WITH MULTIPLE TEST METHODS
; ==================================================================
READ_KEYBOARD_INPUT:
    ; Check test mode
    LD A, (test_mode)
    CP 0
    JP Z, manual_input          ; Mode 0: Manual cursor keys (use JP for long jumps)
    CP 1
    JP Z, auto_movement         ; Mode 1: Automatic movement
    CP 2
    JP Z, space_test            ; Mode 2: Space bar test
    RET

; ===== AUTO MOVEMENT TEST =====
auto_movement:
    ; Increment debug counter for automatic movement
    LD A, (debug_counter)
    INC A
    LD (debug_counter), A

    ; Move sprite automatically in a pattern
    AND #3F                     ; Use lower 6 bits for direction
    CP 16
    JR C, auto_move_right
    CP 32
    JR C, auto_move_down
    CP 48
    JR C, auto_move_left
    ; Otherwise move up

auto_move_up:
    LD A, (player_y)
    CP 8
    JR C, auto_done
    SUB 2
    LD (player_y), A
    JR auto_done

auto_move_right:
    LD A, (player_x)
    CP 232
    JR NC, auto_done
    ADD A, 2
    LD (player_x), A
    JR auto_done

auto_move_down:
    LD A, (player_y)
    CP 168
    JR NC, auto_done
    ADD A, 2
    LD (player_y), A
    JR auto_done

auto_move_left:
    LD A, (player_x)
    CP 8
    JR C, auto_done
    SUB 2
    LD (player_x), A

auto_done:
    RET

; ===== SPACE BAR TEST =====
space_test:
    ; Test with space bar (easier to verify)
    LD A, 6                     ; Row 6 for space bar
    CALL SNSMAT
    LD B, A

    ; Check space bar (bit 0)
    BIT SPACE_BIT, B
    JR NZ, space_not_pressed    ; MSX: 1=not pressed, 0=pressed

    ; Space is pressed - move sprite randomly
    LD A, (debug_counter)
    INC A
    LD (debug_counter), A
    AND 3                       ; Use 2 bits for direction
    CP 0
    JR Z, space_move_up
    CP 1
    JR Z, space_move_right
    CP 2
    JR Z, space_move_down
    ; Otherwise move left

space_move_left:
    LD A, (player_x)
    CP 8
    JR C, space_done
    SUB 4
    LD (player_x), A
    JR space_done

space_move_up:
    LD A, (player_y)
    CP 8
    JR C, space_done
    SUB 4
    LD (player_y), A
    JR space_done

space_move_right:
    LD A, (player_x)
    CP 232
    JR NC, space_done
    ADD A, 4
    LD (player_x), A
    JR space_done

space_move_down:
    LD A, (player_y)
    CP 168
    JR NC, space_done
    ADD A, 4
    LD (player_y), A

space_done:
space_not_pressed:
    RET

; ===== MANUAL CURSOR INPUT =====
manual_input:
    ; Check input delay counter
    LD A, (input_delay_counter)
    OR A
    JR Z, read_cursor_keys      ; If counter is 0, read keys

    ; Decrement delay counter
    DEC A
    LD (input_delay_counter), A
    RET                         ; Skip input this frame

read_cursor_keys:
    ; CORRECTED: Read keyboard row 7 (cursor keys) - NOT row 8!
    LD A, 7
    CALL SNSMAT                 ; Returns key state in A
    LD (current_keys), A        ; Store current state
    LD B, A                     ; Keep in B for processing

    ; MSX keyboard matrix: 0=pressed, 1=not pressed
    ; We want to detect when keys are currently pressed

    ; Check UP cursor (bit 5) - CORRECTED bit number
    BIT CURSOR_UP_BIT, B
    JR NZ, check_cursor_down    ; Bit is 1 (not pressed)

    ; UP is pressed (bit is 0) - move up
    LD A, (player_y)
    CP 8                        ; Check upper boundary
    JR C, check_cursor_down     ; Already at top
    SUB 2                       ; Move up by 2 pixels
    LD (player_y), A
    LD A, 4                     ; Set shorter delay
    LD (input_delay_counter), A

check_cursor_down:
    ; Check DOWN cursor (bit 6)
    BIT CURSOR_DOWN_BIT, B
    JR NZ, check_cursor_left    ; Not pressed

    ; DOWN is pressed - move down
    LD A, (player_y)
    CP 168                      ; Check lower boundary
    JR NC, check_cursor_left    ; Already at bottom
    ADD A, 2                    ; Move down by 2 pixels
    LD (player_y), A
    LD A, 4                     ; Set delay
    LD (input_delay_counter), A

check_cursor_left:
    ; Check LEFT cursor (bit 4)
    BIT CURSOR_LEFT_BIT, B
    JR NZ, check_cursor_right   ; Not pressed

    ; LEFT is pressed - move left
    LD A, (player_x)
    CP 8                        ; Check left boundary
    JR C, check_cursor_right    ; Already at left edge
    SUB 2                       ; Move left by 2 pixels
    LD (player_x), A
    LD A, 4                     ; Set delay
    LD (input_delay_counter), A

check_cursor_right:
    ; Check RIGHT cursor (bit 7)
    BIT CURSOR_RIGHT_BIT, B
    JR NZ, cursor_input_done    ; Not pressed

    ; RIGHT is pressed - move right
    LD A, (player_x)
    CP 232                      ; Check right boundary
    JR NC, cursor_input_done    ; Already at right edge
    ADD A, 2                    ; Move right by 2 pixels
    LD (player_x), A
    LD A, 4                     ; Set delay
    LD (input_delay_counter), A

cursor_input_done:
    RET

; ==================================================================
; UPDATE PLAYER POSITION (Currently same as input, but separated for clarity)
; ==================================================================
UPDATE_PLAYER_POSITION:
    ; This function could contain additional logic like:
    ; - Collision detection
    ; - Animation updates
    ; - Sound effects
    ; For now, position is updated directly in READ_KEYBOARD_INPUT
    RET

; ==================================================================
; UPDATE SPRITE POSITION IN VRAM
; ==================================================================
UPDATE_SPRITE_POSITION:
    ; Only update Y and X position of sprite 0
    ; Y position (attribute 0)
    LD HL, SPRATR2
    LD A, (player_y)
    CALL WRTVRM

    ; X position (attribute 1)
    LD HL, SPRATR2 + 1
    LD A, (player_x)
    CALL WRTVRM

    RET

; ==================================================================
; WRITE TO VRAM HELPER (Use BIOS function instead)
; ==================================================================
; REMOVED: Custom WRTVRM - Use BIOS function #004D instead
; The BIOS WRTVRM function is more reliable than direct port access
; (WRTVRM is already defined in BIOS functions section above)

; ==================================================================
; PADDING TO 8KB BOUNDARY (Simplified for glass.jar compatibility)
; ==================================================================

; Fill to next 8KB boundary (8192 bytes = #2000)
; Current position from #4000, round up to next #2000 boundary
current_pos     EQU $
target_pos      EQU (#6000)     ; Next 8KB boundary after #4000
padding_size    EQU target_pos - current_pos

; Fill remaining space with #FF
    DS padding_size, #FF

; ==================================================================
; END OF ROM
; ==================================================================