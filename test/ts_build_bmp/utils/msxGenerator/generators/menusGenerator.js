"use strict";
/**
 * @fileoverview Menus Generator - Menu systems and user interface
 * Generates menus.asm with menu data and input handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMenusFile = generateMenusFile;
/**
 * Convert hex color to MSX color code (0-15)
 * MSX Color codes: 0=Transparent, 1=Black, 2=Green, 3=LightGreen, 4=Blue, 5=LightBlue,
 *                  6=DarkRed, 7=Cyan, 8=Red, 9=LightRed, 10=Yellow, 11=LightYellow,
 *                  12=DarkGreen, 13=Magenta, 14=Gray, 15=White
 */
function hexToMSXColor(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Check for common colors first
    if (r < 50 && g < 50 && b < 50)
        return 1; // Black
    if (r > 200 && g > 200 && b > 200)
        return 15; // White
    if (r > 200 && g < 100 && b < 100)
        return 8; // Red
    if (r < 100 && g > 200 && b < 100)
        return 3; // Light Green
    if (r < 100 && g < 100 && b > 200)
        return 5; // Light Blue
    if (r > 200 && g > 200 && b < 100)
        return 10; // Yellow
    if (r > 150 && g < 100 && b > 150)
        return 13; // Magenta
    if (r < 100 && g > 150 && b > 150)
        return 7; // Cyan
    // Fallback to brightness-based selection
    const brightness = (r + g + b) / 3;
    if (brightness < 64)
        return 1; // Black
    if (brightness < 128)
        return 14; // Gray
    return 15; // White
}
/**
 * Generate menus file with menu systems and user interface (menus.asm)
 *
 * Creates menu definitions from GameFlow SubMenu nodes with custom font support.
 * Includes menu display, navigation, and input handling functions.
 *
 * @param analysis - Project analysis with game flow data
 * @returns ASM code string with menu systems and UI
 */
function generateMenusFile(analysis) {
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
; @mideas:block id=runtime.menus.compat_stubs kind=routine owner=menus preserve=true roots=init_menus,show_main_menu,update_menu_state
init_menus:
    ret

show_main_menu:
    ret

update_menu_state:
    ret
; @mideas:endblock id=runtime.menus.compat_stubs

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
        menuNodes.forEach((menu, index) => {
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
        menuNodes2.forEach((menu) => {
            const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const menuId = menu.id.replace(/[^a-zA-Z0-9]/g, '_');
            // Get background and border colors (MSX Screen 2 compatible)
            const bgColor = menu.appearance?.colors?.background || '#000000';
            const borderColor = menu.appearance?.colors?.border || '#FFFFFF';
            // Convert hex colors to MSX color codes (0-15)
            const bgColorMSX = hexToMSXColor(bgColor);
            const borderColorMSX = hexToMSXColor(borderColor);
            code += `; @mideas:block id=runtime.menus.${menuId} kind=routine owner=menus
show_menu_${menuId}:
    ; Display ${menu.title || menu.id} menu
    ; Set background color using VDP
    ld b, ${bgColorMSX * 16 + borderColorMSX} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${borderColorMSX}
    ld (BDRCLR), a

    ld a, ${bgColorMSX}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_${menuId}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${menuId}_title:
    db "${(menu.title || 'Menu').replace(/"/g, '\\"')}", 0

handle_menu_${menuId}:
    ; Handle ${menu.title || menu.id} menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret
; @mideas:endblock id=runtime.menus.${menuId}

`;
        });
        // Text node display is now handled by gameFlowGenerator (show_text_screen)
    }
    else {
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
    call CLS

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
    ld a, (input_fire)
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
    db "GAME TITLE", 0

txt_start:
    db "START GAME", 0

txt_exit:
    db "EXIT", 0

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

    ; FAST_WRTVRM expects: A = data, HL = VRAM address
    push hl         ; Save string pointer
    push de         ; Save VRAM address
    pop hl          ; HL = VRAM address (for FAST_WRTVRM)
    call FAST_WRTVRM ; Write character to VRAM (fast)
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
