;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; TEST WHITE SQUARE - SMOOTH MOVEMENT VERSION
;; Un cuadrado blanco en el centro que se mueve suavemente con los cursores
;; Versión con movimiento continuo y control de velocidad
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F       ; Change screen mode
WRTVDP  EQU #0047       ; Write to VDP register
SNSMAT  EQU #0141       ; Read keyboard matrix
FILVRM  EQU #0056       ; Fill VRAM with data
LDIRVM  EQU #005C       ; Copy data to VRAM
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
; Row 8 bits for cursor keys
CURSOR_UP_BIT       EQU 7
CURSOR_DOWN_BIT     EQU 6
CURSOR_LEFT_BIT     EQU 5
CURSOR_RIGHT_BIT    EQU 4

; ==================================================================
; MOVEMENT CONSTANTS
; ==================================================================
MOVEMENT_SPEED      EQU 2       ; Pixels per frame when key held
FRAME_SKIP          EQU 2       ; Only move every N frames for slower movement

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
frame_counter       EQU #C004   ; Frame counter for movement timing

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

    ; Enable 16x16 sprites
    LD BC, #E201                ; VDP register 1 = #E2
    CALL WRTVDP

    ; Initialize player position (center of screen)
    LD A, 128                   ; Center X (256/2)
    LD (player_x), A
    LD A, 96                    ; Center Y (192/2)
    LD (player_y), A

    ; Initialize frame counter
    XOR A
    LD (frame_counter), A

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

    ; Update frame counter
    LD A, (frame_counter)
    INC A
    LD (frame_counter), A

    ; Only process movement every FRAME_SKIP frames
    AND 1                       ; Modulo 2 (FRAME_SKIP)
    JR NZ, skip_movement

    ; Read keyboard input and move
    CALL READ_KEYBOARD_SMOOTH

    ; Update sprite position in VRAM
    CALL UPDATE_SPRITE_POSITION

skip_movement:
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
; READ KEYBOARD INPUT - SMOOTH CONTINUOUS MOVEMENT
; ==================================================================
READ_KEYBOARD_SMOOTH:
    ; Read keyboard row 8 (cursor keys)
    LD A, 8
    CALL SNSMAT                 ; Returns key state in A
    LD B, A                     ; Store key state

    ; Check UP cursor (bit 7)
    BIT CURSOR_UP_BIT, B
    JR NZ, check_down           ; Not pressed (bit = 1 means not pressed)

    ; UP is pressed - move up
    LD A, (player_y)
    CP MOVEMENT_SPEED           ; Check upper boundary
    JR C, check_down            ; Too close to top
    SUB MOVEMENT_SPEED          ; Move up
    LD (player_y), A

check_down:
    ; Check DOWN cursor (bit 6)
    BIT CURSOR_DOWN_BIT, B
    JR NZ, check_left

    ; DOWN is pressed - move down
    LD A, (player_y)
    CP 174                      ; Check lower boundary (192-16-2)
    JR NC, check_left           ; Too close to bottom
    ADD A, MOVEMENT_SPEED       ; Move down
    LD (player_y), A

check_left:
    ; Check LEFT cursor (bit 5)
    BIT CURSOR_LEFT_BIT, B
    JR NZ, check_right

    ; LEFT is pressed - move left
    LD A, (player_x)
    CP MOVEMENT_SPEED           ; Check left boundary
    JR C, check_right           ; Too close to left edge
    SUB MOVEMENT_SPEED          ; Move left
    LD (player_x), A

check_right:
    ; Check RIGHT cursor (bit 4)
    BIT CURSOR_RIGHT_BIT, B
    JR NZ, input_done

    ; RIGHT is pressed - move right
    LD A, (player_x)
    CP 238                      ; Check right boundary (256-16-2)
    JR NC, input_done           ; Too close to right edge
    ADD A, MOVEMENT_SPEED       ; Move right
    LD (player_x), A

input_done:
    RET

; ==================================================================
; UPDATE PLAYER POSITION (Currently same as input, but separated for clarity)
; ==================================================================
UPDATE_PLAYER_POSITION:
    ; This function could contain additional logic like:
    ; - Collision detection
    ; - Animation updates
    ; - Sound effects
    ; For now, position is updated directly in READ_KEYBOARD_SMOOTH
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
; WRITE TO VRAM HELPER (Missing BIOS function)
; ==================================================================
WRTVRM:
    ; HL = VRAM address, A = data byte
    PUSH BC
    PUSH DE
    LD C, A                     ; Save data
    CALL SETWRT                 ; Set write address
    LD A, C                     ; Restore data
    OUT (VDP_DW), A             ; Write data
    POP DE
    POP BC
    RET

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