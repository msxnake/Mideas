/**
 * @fileoverview Menus Generator - Menu systems and user interface
 * Generates menus.asm with menu data and input handling
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Generate menus file with menu systems and user interface (menus.asm)
 *
 * Creates menu definitions from GameFlow SubMenu nodes with custom font support.
 * Includes menu display, navigation, and input handling functions.
 *
 * @param analysis - Project analysis with game flow data
 * @returns ASM code string with menu systems and UI
 */
export function generateMenusFile(analysis: ProjectAnalysis): string {
  // Check if there are specific menu definitions in the analysis
  const hasMenus = analysis.gameFlow && analysis.gameFlow.nodes &&
    analysis.gameFlow.nodes.some(node => node.type === 'SubMenu');

  // Skip menu system if no menus in project
  if (!hasMenus) {
    return `; ==================================================================
; GAME MENUS (SKIPPED - NO MENUS DETECTED)
; File: menus.asm
; ==================================================================

; No menus detected in project - menu system not needed
; This saves ~620 lines of unused menu management code

; Minimal stub functions for compatibility
init_menus:
    ret

show_main_menu:
    ret

update_menu_state:
    ret

; ==================================================================
; END OF MENUS (MINIMAL VERSION)
; ==================================================================
`;
  }

  let code = `; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

`;

  if (hasMenus) {
    code += `; ==================================================================
; MENU CONSTANTS
; ==================================================================

`;

    const menuNodes = analysis.gameFlow.nodes.filter(node => node.type === 'SubMenu');
    menuNodes.forEach((menu: any, index) => {
      const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `MENU_${menuName}_ID EQU ${index}
`;
    });

    code += `
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`;

    const menuNodes2 = analysis.gameFlow.nodes.filter(node => node.type === 'SubMenu');
    menuNodes2.forEach((menu: any) => {
      const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `show_menu_${menuName.toLowerCase()}:
    ; Display ${menu.title || menu.id} menu
    ; TODO: Implement menu display logic
    ret

handle_menu_${menuName.toLowerCase()}:
    ; Handle ${menu.title || menu.id} menu input
    ; TODO: Implement menu input handling
    ret

`;
    });
  } else {
    code += `; ==================================================================
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

init_menus:
    ; Initialize menu system
    ld a, MENU_MAIN_ID
    ld (current_menu), a
    xor a
    ld (current_item), a
    ret

show_main_menu:
    ; Display main menu with custom font
    call cls

    ; Make sure custom font is loaded
    call init_font_system

    ; Print title using custom font
    ld hl, txt_title
    ld de, NAMETBL + (5 * 32) + 10  ; Row 5, column 10
    call print_string_screen2        ; Use custom font print function

    ; Print menu options using custom font
    ld hl, txt_start
    ld de, NAMETBL + (10 * 32) + 12
    call print_string_screen2

    ld hl, txt_exit
    ld de, NAMETBL + (12 * 32) + 12
    call print_string_screen2

    ret

handle_main_menu:
    ; Handle main menu input
    call GTSTCK     ; Get joystick input

    ; Check for up/down movement
    cp 1            ; Up
    jp z, menu_up
    cp 5            ; Down
    jp z, menu_down

    ; Check for selection (space or fire button)
    call GTTRIG
    or a
    jp nz, menu_select

    ret

menu_up:
    ld a, (current_item)
    or a
    jp z, menu_up_end  ; Already at top
    dec a
    ld (current_item), a
menu_up_end:
    ret

menu_down:
    ld a, (current_item)
    cp MENU_ITEM_EXIT
    jp z, menu_down_end  ; Already at bottom
    inc a
    ld (current_item), a
menu_down_end:
    ret

menu_select:
    ld a, (current_item)
    cp MENU_ITEM_START
    jp z, start_game
    cp MENU_ITEM_EXIT
    jp z, exit_game
    ret

start_game:
    ; Start the game
    ld a, MENU_GAME_ID
    ld (current_menu), a
    ret

exit_game:
    ; Exit to BASIC
    rst #00

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

print_string:
    ; Print null-terminated string
    ; HL = source string, DE = VRAM destination
print_loop:
    ld a, (hl)
    or a
    ret z           ; End of string

    ; WRTVRM expects: A = data, HL = VRAM address
    push hl         ; Save string pointer
    push de         ; Save VRAM address
    pop hl          ; HL = VRAM address (for WRTVRM)
    call WRTVRM     ; Write character to VRAM
    pop hl          ; Restore string pointer

    inc hl          ; Next character in string
    inc de          ; Next VRAM position
    jp print_loop

`;
  }

  code += `; ==================================================================
; END OF MENUS
; ==================================================================
`;

  return code;
}
