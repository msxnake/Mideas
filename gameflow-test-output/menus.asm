; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

; ==================================================================
; DEFAULT MENU SYSTEM
; ==================================================================

; Menu constants
MENU_MAIN_ID     EQU 0
MENU_GAME_ID     EQU 1
MENU_PAUSE_ID    EQU 2

; Menu states
MENU_ITEM_START  EQU 0
MENU_ITEM_EXIT   EQU 1

; Current menu variables
current_menu     DS 1
current_item     DS 1

; ==================================================================
; MENU FUNCTIONS
; ==================================================================

INIT_MENUS:
    ; Initialize menu system
    LD A, MENU_MAIN_ID
    LD (current_menu), A
    XOR A
    LD (current_item), A
    RET

SHOW_MAIN_MENU:
    ; Display main menu with custom font
    CALL CLS

    ; Make sure custom font is loaded
    CALL INIT_FONT_SYSTEM

    ; Print title using custom font
    LD HL, txt_title
    LD DE, NAMETBL + (5 * 32) + 10  ; Row 5, column 10
    CALL PRINT_STRING_SCREEN2        ; Use custom font print function

    ; Print menu options using custom font
    LD HL, txt_start
    LD DE, NAMETBL + (10 * 32) + 12
    CALL PRINT_STRING_SCREEN2

    LD HL, txt_exit
    LD DE, NAMETBL + (12 * 32) + 12
    CALL PRINT_STRING_SCREEN2

    RET

HANDLE_MAIN_MENU:
    ; Handle main menu input
    CALL GTSTCK     ; Get joystick input

    ; Check for up/down movement
    CP 1            ; Up
    JP Z, menu_up
    CP 5            ; Down
    JP Z, menu_down

    ; Check for selection (space or fire button)
    CALL GTTRIG
    OR A
    JP NZ, menu_select

    RET

menu_up:
    LD A, (current_item)
    OR A
    JP Z, menu_up_end  ; Already at top
    DEC A
    LD (current_item), A
menu_up_end:
    RET

menu_down:
    LD A, (current_item)
    CP MENU_ITEM_EXIT
    JP Z, menu_down_end  ; Already at bottom
    INC A
    LD (current_item), A
menu_down_end:
    RET

menu_select:
    LD A, (current_item)
    CP MENU_ITEM_START
    JP Z, start_game
    CP MENU_ITEM_EXIT
    JP Z, exit_game
    RET

start_game:
    ; Start the game
    LD A, MENU_GAME_ID
    LD (current_menu), A
    RET

exit_game:
    ; Exit to BASIC
    RST #00

; ==================================================================
; MENU TEXT DATA
; ==================================================================

txt_title:
    DB "GAME TITLE", 0

txt_start:
    DB "START GAME", 0

txt_exit:
    DB "EXIT", 0

; ==================================================================
; TEXT PRINTING FUNCTION
; ==================================================================

PRINT_STRING:
    ; Print null-terminated string
    ; HL = source string, DE = VRAM destination
print_loop:
    LD A, (HL)
    OR A
    RET Z           ; End of string

    ; WRTVRM expects: A = data, HL = VRAM address
    PUSH HL         ; Save string pointer
    PUSH DE         ; Save VRAM address
    POP HL          ; HL = VRAM address (for WRTVRM)
    CALL WRTVRM     ; Write character to VRAM
    POP HL          ; Restore string pointer

    INC HL          ; Next character in string
    INC DE          ; Next VRAM position
    JP print_loop

; ==================================================================
; END OF MENUS
; ==================================================================
