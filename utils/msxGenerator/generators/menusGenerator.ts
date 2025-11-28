/**
 * @fileoverview Menus Generator - Menu systems and user interface
 * Generates menus.asm with menu data and input handling
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Convert hex color to MSX color code (0-15)
 * MSX Color codes: 0=Transparent, 1=Black, 2=Green, 3=LightGreen, 4=Blue, 5=LightBlue,
 *                  6=DarkRed, 7=Cyan, 8=Red, 9=LightRed, 10=Yellow, 11=LightYellow,
 *                  12=DarkGreen, 13=Magenta, 14=Gray, 15=White
 */
function hexToMSXColor(hex: string): number {
  if (!hex) return 15; // Default white
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Check for common colors first
  if (r < 50 && g < 50 && b < 50) return 1;  // Black
  if (r > 200 && g > 200 && b > 200) return 15; // White
  if (r > 200 && g < 100 && b < 100) return 8;  // Red
  if (r < 100 && g > 200 && b < 100) return 3;  // Light Green
  if (r < 100 && g < 100 && b > 200) return 5;  // Light Blue
  if (r > 200 && g > 200 && b < 100) return 10; // Yellow
  if (r > 150 && g < 100 && b > 150) return 13; // Magenta
  if (r < 100 && g > 150 && b > 150) return 7;  // Cyan

  // Fallback to brightness-based selection
  const brightness = (r + g + b) / 3;
  if (brightness < 64) return 1;   // Black
  if (brightness < 128) return 14; // Gray
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

; Minimal stub functions for compatibility
init_menus:
    ret

show_main_menu:
    ret

update_menu_state:
    ret

; Generic wait function (used by other systems)
wait_for_fire:
    call GTTRIG
    or a
    jr nz, .wait_release
.wait_press:
    call GTTRIG
    or a
    jr z, .wait_press
.wait_release:
    call GTTRIG
    or a
    jr nz, .wait_release
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

update_menu_system:
    ; Update current active menu
    ld a, (current_menu_id)
`;

    // Dispatcher for update loop
    menuNodes.forEach((menu: any, index) => {
      const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const menuId = menu.id.replace(/[^a-zA-Z0-9]/g, '_');
      code += `    cp MENU_${menuName}_ID
    jp z, handle_menu_${menuId}
`;
    });
    code += `    ret

`;

    menuNodes.forEach((menu: any, index) => {
      const menuName = (menu.title || menu.id).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const menuId = menu.id.replace(/[^a-zA-Z0-9]/g, '_');

      // Get background and border colors (MSX Screen 2 compatible)
      const bgColor = menu.appearance?.colors?.background || '#000000';
      const borderColor = menu.appearance?.colors?.border || '#FFFFFF';
      const textColor = menu.appearance?.colors?.text || '#FFFFFF';
      const selectedColor = menu.appearance?.colors?.highlight || '#FFFF00';

      // Convert hex colors to MSX color codes (0-15)
      const bgColorMSX = hexToMSXColor(bgColor);
      const borderColorMSX = hexToMSXColor(borderColor);

      const options = menu.options || [];

      code += `show_menu_${menuId}:
    ; Display ${menu.title || menu.id} menu
    ; Set current menu ID
    ld a, MENU_${menuName}_ID
    ld (current_menu_id), a
    xor a
    ld (current_menu_item), a

    ; Set background color using VDP
    ld c, 7                     ; VDP Register 7 (Backdrop color in low nibble)
    ld b, ${bgColorMSX}         ; Background color (0-15)
    call WRTVDP

    ; Set border color system vars (for consistency)
    ld a, ${borderColorMSX}
    ld (FORCLR), a
    ld (BAKCLR), a
    ld (BDRCLR), a

    ; Clear screen with background color
    call cls

    ; Initialize Font
    call init_font_system

    ; Display menu title
    ld hl, menu_${menuId}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    call draw_menu_${menuId}_items

    ret

draw_menu_${menuId}_items:
    ; Draw all items for this menu
`;
    options.forEach((opt: any, optIndex: number) => {
        const yPos = 8 + (optIndex * 2); // Start at row 8, spacing 2
        code += `    ; Option ${optIndex}: ${opt.text || 'Option'}
    ld a, (current_menu_item)
    cp ${optIndex}
    jr z, .draw_sel_${optIndex}

    ; Draw normal
    ld hl, menu_${menuId}_opt_${optIndex}
    ld de, NAMETBL + (${yPos} * 32) + 10
    call print_string_screen2
    jr .next_${optIndex}

.draw_sel_${optIndex}:
    ; Draw selected (with cursor)
    ld hl, menu_cursor_str
    ld de, NAMETBL + (${yPos} * 32) + 8
    call print_string_screen2

    ld hl, menu_${menuId}_opt_${optIndex}
    ld de, NAMETBL + (${yPos} * 32) + 10
    call print_string_screen2

.next_${optIndex}:
`;
    });

    code += `    ret

menu_${menuId}_title:
    db "${(menu.title || 'Menu').replace(/"/g, '\\"')}", 0

menu_cursor_str:
    db ">", 0

`;
    // Define option strings
    options.forEach((opt: any, optIndex: number) => {
        code += `menu_${menuId}_opt_${optIndex}:
    db "${(opt.text || 'Option').toUpperCase().replace(/"/g, '\\"')}", 0
`;
    });

    code += `
handle_menu_${menuId}:
    ; Handle ${menu.title || menu.id} menu input
    call GTSTCK
    ld b, a

    ; Check UP
    cp 1
    jr z, .menu_up

    ; Check DOWN
    cp 5
    jr z, .menu_down

    ; Check Fire/Space
    ld a, 0
    call GTTRIG
    or a
    jr nz, .menu_select

    ; Check Space key directly if GTTRIG fails (row 8 bit 0)
    in a, (#AA)
    and #F0
    or 8
    out (#AA), a
    in a, (#A9)
    bit 0, a
    jr z, .menu_select

    ret

.menu_up:
    ; Debounce check needed here normally, but for now simple
    ld a, (frame_counter)
    and 7
    ret nz

    ld a, (current_menu_item)
    or a
    ret z
    dec a
    ld (current_menu_item), a
    call draw_menu_${menuId}_items
    ret

.menu_down:
    ; Debounce
    ld a, (frame_counter)
    and 7
    ret nz

    ld a, (current_menu_item)
    cp ${options.length - 1}
    ret nc
    inc a
    ld (current_menu_item), a
    call draw_menu_${menuId}_items
    ret

.menu_select:
    ; Handle selection based on current_menu_item
    ld a, (current_menu_item)
`;
    options.forEach((opt: any, optIndex: number) => {
        // Find connection for this option
        // The GameFlow generator uses connection data to determine next node.
        // Here we need to map option index to target node.
        // We will assume that the gameFlow connections from this node with sourceId matching option index
        // (or order) are what we want.

        // Find connection from this node with sourceHandle/sourceId corresponding to this option
        // In Mideas GameFlow, SubMenu outputs are dynamic based on options.
        // Usually sourceHandle is 'option-0', 'option-1', etc.

        const connection = analysis.gameFlow.connections.find((c: any) =>
            (c.from === menu.id || c.from.nodeId === menu.id) &&
            (c.fromPort === `option-${optIndex}` || c.sourceHandle === `option-${optIndex}`)
        );

        if (connection) {
            const targetNodeId = connection.to.nodeId || connection.to;
            const targetLabel = `gameflow_node_${targetNodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;

            code += `    cp ${optIndex}
    jp z, .go_opt_${optIndex}
`;
        }
    });

    code += `    ret

`;

    // Generate jump targets
    options.forEach((opt: any, optIndex: number) => {
        const connection = analysis.gameFlow.connections.find((c: any) =>
            (c.from === menu.id || c.from.nodeId === menu.id) &&
            (c.fromPort === `option-${optIndex}` || c.sourceHandle === `option-${optIndex}`)
        );

        if (connection) {
            const targetNodeId = connection.to.nodeId || connection.to;
            const targetLabel = `gameflow_node_${targetNodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            code += `.go_opt_${optIndex}:
    ld hl, ${targetLabel}
    jp execute_gameflow_node
`;
        }
    });

    code += `
`;
    });

    // Generate Text node display functions
    const textNodes = analysis.gameFlow.nodes.filter(node => node.type === 'Text');
    textNodes.forEach((textNode: any) => {
      const textId = textNode.id.replace(/[^a-zA-Z0-9]/g, '_');

      // Get background and border colors (MSX Screen 2 compatible)
      const bgColor = textNode.appearance?.colors?.background || '#000000';
      const borderColor = textNode.appearance?.colors?.border || '#FFFFFF';

      // Convert hex colors to MSX color codes (0-15)
      const bgColorMSX = hexToMSXColor(bgColor);
      const borderColorMSX = hexToMSXColor(borderColor);

      code += `show_text_${textId}:
    ; Display ${textNode.title || textNode.id} text
    ; Set background color using VDP
    ld c, 7                     ; VDP Register 7
    ld b, ${bgColorMSX}         ; Background color (0-15)
    call WRTVDP

    ; Set border color
    ld a, ${borderColorMSX}
    ld (FORCLR), a
    ld (BAKCLR), a
    ld (BDRCLR), a

    ; Clear screen with background color
    call cls

    call init_font_system

    ; Display text title
    ld hl, text_${textId}_title
    ld de, NAMETBL + (3 * 32) + 10
    call print_string_screen2

    ; Display text message
    ld hl, text_${textId}_message
    ld de, NAMETBL + (6 * 32) + 5
    call print_string_screen2

    ; Wait for user input
    call wait_for_fire
    ret

text_${textId}_title:
    db "${(textNode.title || 'Text').replace(/"/g, '\\"')}", 0

text_${textId}_message:
    db "${(textNode.message || '').replace(/"/g, '\\"')}", 0

`;
    });

    // Add generic wait function (always included if hasMenus)
    code += `wait_for_fire:
    call GTTRIG
    or a
    jr nz, .wait_release
.wait_press:
    call GTTRIG
    or a
    jr z, .wait_press
.wait_release:
    call GTTRIG
    or a
    jr nz, .wait_release
    ret
`;

  }

  code += `; ==================================================================
; END OF MENUS
; ==================================================================
`;

  return code;
}
