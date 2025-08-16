;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;;      MAIN MENU LOGIC ROUTINE
;;
;; This is a self-contained routine to run the main menu.
;; It uses the data and labels defined above.
;;
;; To use:
;; 1. Ensure this code is included in your project.
;; 2. Ensure all asset pointers (MENU_BG_SCREEN_ASSET_PTR, etc.)
;;    are correctly pointing to loaded data in memory.
;; 3. Implement the game-specific routines called by the
;;    Menu_ExecuteAction jump table (e.g., Start_New_Game).
;; 4. Call 'Menu_Init' to start the menu. The routine will
;;    loop until an option is chosen, then it will jump
;;    to the corresponding game routine.
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; --- RAM Variables for Menu Logic ---
; These should be defined in a safe RAM area of your game.
MENU_RAM_BASE:      EQU #D000 ; Example base address for menu variables
SelectedOption:     DB 0      ; Index of the currently selected menu item (0-based)
PrevInputState:     DB 0      ; Stores last frame's joystick/keyboard state for debouncing
MenuRedrawFlag:     DB 0      ; 1 if the menu needs to be redrawn

; --- VDP Constants ---
VDP_CMD_REG:        EQU #99
VDP_DATA_REG:       EQU #98
SPRITE_ATTR_TABLE:  EQU #1B00 ; Default Screen 2 Sprite Attribute Table
NAME_TABLE:         EQU #1800 ; Default Screen 2 Name Table

; ==============================================================================
; MENU_INIT: Main entry point to start the menu system
; ==============================================================================
Menu_Init:
    LD A, (MENU_IS_ENABLED)
    OR A
    RET Z ; Return immediately if menu is disabled

    ; --- Initial Setup ---
    XOR A
    LD (SelectedOption), A
    LD (PrevInputState), A
    LD A, 1
    LD (MenuRedrawFlag), A ; Set redraw flag for the first frame

    ; TODO: Add any specific screen mode setup if needed (e.g., call CHGMOD)
    ; For now, it assumes the correct screen mode is already set.

    ; --- Load Cursor Sprite Pattern ---
    LD HL, (MENU_CURSOR_SPRITE_ASSET_PTR)
    LD A, H
    OR L
    CALL NZ, LoadMenuCursorSpritePattern

    ; --- Main Menu Loop ---
Menu_Loop:
    HALT                ; Wait for V-Blank interrupt
    CALL Menu_HandleInput

    LD A, (MenuRedrawFlag)
    OR A
    CALL NZ, Menu_Draw  ; If redraw flag is set, call draw routine

    JP Menu_Loop        ; Loop until an option is selected and executed

; ==============================================================================
; MENU_HANDLE_INPUT: Reads player input and updates menu state
; ==============================================================================
Menu_HandleInput:
    ; Read joystick 1 state
    LD A, 1
    CALL GTSTCK
    LD B, A             ; Store current input in B

    ; Debounce input
    LD A, (PrevInputState)
    XOR B
    AND B               ; A = bits that are newly pressed (were 0, now 1)
    LD C, A             ; C = newly pressed bits
    LD (PrevInputState), B ; Save current state for next frame

    ; --- Check for DOWN press ---
    LD A, C
    AND %00000100       ; Bit 2 = Down
    JP Z, .check_up     ; If not pressed, check Up

    ; Down was pressed: Increment selected option
    LD HL, SelectedOption
    INC (HL)
    LD A, (MENU_OPTIONS_COUNT)
    CP (HL)
    JR NZ, .input_changed ; If not equal, it's a valid new index

    ; If we went past the last option, wrap to 0
    XOR A
    LD (HL), A
    JR .input_changed

.check_up:
    ; --- Check for UP press ---
    LD A, C
    AND %00000001       ; Bit 0 = Up
    JP Z, .check_fire   ; If not pressed, check Fire

    ; Up was pressed: Decrement selected option
    LD HL, SelectedOption
    LD A, (HL)
    OR A
    JR Z, .wrap_to_last ; If current is 0, wrap to last option

    DEC (HL)            ; Decrement if not 0
    JR .input_changed

.wrap_to_last:
    LD A, (MENU_OPTIONS_COUNT)
    DEC A
    LD (HL), A

.input_changed:
    LD A, 1
    LD (MenuRedrawFlag), A ; Set redraw flag because selection changed
    JP .end_input

.check_fire:
    ; --- Check for FIRE press ---
    LD A, C
    AND %00010000       ; Bit 4 = Trigger 1
    RET Z               ; If not pressed, we are done with input handling

    ; Fire was pressed: Execute the action
    CALL Menu_ExecuteAction

.end_input:
    RET

; ==============================================================================
; MENU_DRAW: Renders the entire menu screen
; ==============================================================================
Menu_Draw:
    XOR A
    LD (MenuRedrawFlag), A ; Clear redraw flag

    ; --- Step 1: Draw Background ---
    LD HL, (MENU_BG_SCREEN_ASSET_PTR)
    LD A, H
    OR L
    CALL NZ, DrawMenuBackgroundScreen

    ; If no background screen, you might want to clear the screen area here
    ; (e.g., using a VDP fill command or a custom clear routine).
    ; For this example, we assume either a screen is drawn or the background
    ; is a solid color set by the game elsewhere.

    ; --- Step 2: Draw Menu Options ---
    LD IX, MENU_OPTIONS_TABLE
    LD B, (MENU_OPTIONS_COUNT) ; B = number of options to draw
    LD C, 0                 ; C = current option index counter
    LD E, 10                ; E = Start Y coordinate for text (example)
.draw_option_loop:
    PUSH BC
    PUSH IX

    ; Set text color based on whether this is the selected option
    LD A, (SelectedOption)
    CP C ; Compare current index with selected index
    JR Z, .set_highlight_color

.set_normal_color:
    LD A, (MENU_COLOR_TEXT)
    LD (FORCLR), A ; Set foreground color in BIOS variable
    LD A, (MENU_COLOR_BACKGROUND)
    LD (BAKCLR), A ; Set background color
    JR .color_set

.set_highlight_color:
    LD A, (MENU_COLOR_HIGHLIGHT_TEXT)
    LD (FORCLR), A
    LD A, (MENU_COLOR_HIGHLIGHT_BG)
    LD (BAKCLR), A

.color_set:
    CALL CHGCLR ; Apply colors

    ; Get pointer to option string
    LD L, (IX+0)
    LD H, (IX+1)

    ; Calculate text position (centered horizontally for this example)
    ; This is a simplified centering. A real implementation might calculate string length.
    LD D, 8         ; D = Start X coordinate (example)
    CALL PRNSTR     ; Print the string at (D, E)

    POP IX
    ADD IX, 2       ; Point to next entry in the table (2 bytes for DW)

    POP BC
    INC C           ; Increment option index counter
    LD A, 12
    ADD A, E        ; Move Y down for next option (example: 12 pixels)
    LD E, A

    DJNZ .draw_option_loop

    ; --- Step 3: Position Cursor ---
    CALL Menu_PositionCursor

    RET

; ==============================================================================
; MENU_POSITION_CURSOR: Updates the cursor sprite's Y position
; ==============================================================================
Menu_PositionCursor:
    LD HL, (MENU_CURSOR_SPRITE_ASSET_PTR)
    LD A, H
    OR L
    RET Z ; No cursor sprite defined, nothing to do.

    ; Calculate cursor Y position
    ; Formula: start_y + (selected_index * line_height) + vertical_offset
    LD A, (SelectedOption)
    LD B, 12        ; B = line height (same as in draw loop)
    MUL B           ; A = A * B (selected_index * line_height) -> Result in HL
    LD A, L
    ADD A, 10       ; Add start Y coordinate (10)
    LD E, A         ; E = final Y coordinate for sprite

    ; Update sprite attribute table
    LD HL, SPRITE_ATTR_TABLE
    LD (HL), E      ; Set Y coordinate for sprite 0

    ; Set X coordinate (example: 50 pixels)
    INC HL
    LD (HL), 50

    ; Set pattern index (assuming cursor is first pattern in its asset)
    INC HL
    LD (HL), 0

    ; Set color
    INC HL
    LD A, (MENU_COLOR_HIGHLIGHT_TEXT) ; Use highlight text color for cursor
    LD (HL), A

    RET

; ==============================================================================
; MENU_EXECUTE_ACTION: Jumps to game code based on selected option
; ==============================================================================
Menu_ExecuteAction:
    LD A, (SelectedOption)
    ADD A, A            ; Multiply by 2 for word-sized jump table entries
    LD L, A
    LD H, 0
    LD IX, Menu_ActionJumpTable
    ADD IX, HL          ; IX points to the correct entry in the jump table

    LD L, (IX+0)
    LD H, (IX+1)
    JP (HL)             ; Jump to the routine address

Menu_ActionJumpTable:
    DW Start_New_Game           ; Action for Option 0
    DW Show_Continue_Screen     ; Action for Option 1
    DW Show_Settings_Screen     ; Action for Option 2
    DW Show_Help_Screen         ; Action for Option 3
    ; ... Add more DW entries to match MENU_OPTIONS_COUNT ...

; ------------------------------------------------------------------------------
; --- Game-Specific Routines (STUBS - MUST BE IMPLEMENTED BY THE DEVELOPER) ---
; ------------------------------------------------------------------------------
Start_New_Game:
    ; Your code to start a new game goes here
    ; For example, load level 1, initialize player, etc.
    RET ; Or JP to game loop

Show_Continue_Screen:
    ; Your code to show the password/continue screen
    RET

Show_Settings_Screen:
    ; Your code for the settings/options screen
    RET

Show_Help_Screen:
    ; Your code for the help/instructions screen
    RET

; ------------------------------------------------------------------------------
; --- Helper Subroutines ---
; ------------------------------------------------------------------------------
LoadMenuCursorSpritePattern:
    ; HL = Pointer to sprite data in RAM
    ; This is a placeholder. You need a routine to load sprite
    ; pattern data from RAM (HL) to VRAM sprite pattern table.
    ; For sprite 0, this is typically VRAM address #3800.
    LD DE, #3800 ; Sprite Pattern Generator Table for sprite 0
    ; Assumes cursor is 16x16 = 32 bytes
    LD BC, 32
    CALL LDIRVM
    RET

DrawMenuBackgroundScreen:
    ; HL = Pointer to screen map layout data in RAM
    ; This is a placeholder. You need a routine to load a screen
    ; layout from RAM (HL) to the VRAM name table (#1800).
    LD DE, NAME_TABLE
    LD BC, 32*24 ; Assuming 32x24 screen
    CALL LDIRVM
    RET

; ------------------------------------------------------------------------------
; --- BIOS Calls (Assumed to be defined elsewhere in your project) ---
; ------------------------------------------------------------------------------
;GTSTCK: EQU #00D5
;PRNSTR: EQU #00A2
;CHGCLR: EQU #0062
;FORCLR: EQU #F3E9
;BAKCLR: EQU #F3EA
;LDIRVM: EQU #005C
; ... and others you might need ...
