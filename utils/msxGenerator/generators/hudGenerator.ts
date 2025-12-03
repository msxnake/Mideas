/**
 * @fileoverview HUD Generator - Generates Z80 assembly for HUD rendering in Screen 2
 * Handles text-based HUD elements (Score, Lives, etc.) using TileBank fonts
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { HUDElement, HUDElementType } from '../../../types';

/**
 * Generate HUD system ASM code
 */
export function generateHudFile(analysis: ProjectAnalysis): string {
    // Collect all HUD elements from all screens
    const allHudElements: HUDElement[] = [];
    const screenHudMap = new Map<string, HUDElement[]>();

    analysis.screenMaps?.forEach(screen => {
        const hudElements = screen.hudConfiguration?.elements || [];
        if (hudElements.length > 0) {
            allHudElements.push(...hudElements);
            screenHudMap.set(screen.id, hudElements);
        }
    });

    if (allHudElements.length === 0) {
        return `; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
`;
    }

    let asm = `; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${allHudElements.length}
; Screens with HUD: ${screenHudMap.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;

    // Generate HUD data structures
    asm += generateHudDataStructures(allHudElements);

    // Generate main render_hud function
    asm += generateRenderHudFunction(allHudElements);

    // Generate helper functions
    asm += generateHudHelperFunctions();

    return asm;
}

/**
 * Generate HUD data structures
 */
function generateHudDataStructures(hudElements: HUDElement[]): string {
    let asm = `; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;

    // Generate element count
    asm += `HUD_ELEMENT_COUNT   EQU ${hudElements.length}\n\n`;

    // Generate element data table
    asm += `; HUD Element Data Table\n`;
    asm += `; Format: [Type:1][X:1][Y:1][TextPtr:2][Visible:1]\n`;
    asm += `hud_element_data:\n`;

    hudElements.forEach((el, index) => {
        const typeId = getHudElementTypeId(el.type);
        const x = el.position.x;
        const y = el.position.y;
        const visible = el.visible ? 1 : 0;
        const textLabel = `hud_text_${index}`;

        asm += `    DB ${typeId}, ${x}, ${y}    ; Element ${index}: ${el.type} at (${x},${y})\n`;
        asm += `    DW ${textLabel}             ; Text pointer\n`;
        asm += `    DB ${visible}                ; Visible\n`;
    });

    asm += '\n';

    // Generate text strings
    asm += `; HUD Text Strings\n`;
    hudElements.forEach((el, index) => {
        const text = el.text || el.name || '';
        const textLabel = `hud_text_${index}`;
        asm += `${textLabel}:\n`;
        asm += `    DB "${text}", 0\n`;
    });

    asm += '\n';

    return asm;
}

/**
 * Generate main render_hud function
 */
function generateRenderHudFunction(hudElements: HUDElement[]): string {
    return `; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Called once per frame to update all HUD elements
; ------------------------------------------------------------------
render_hud:
    push af
    push bc
    push de
    push hl

    ld b, HUD_ELEMENT_COUNT
    ld hl, hud_element_data

.render_loop:
    push bc                     ; Save counter
    push hl                     ; Save data pointer

    ; Read element data
    ld a, (hl)                  ; A = Type
    inc hl
    ld d, (hl)                  ; D = X position
    inc hl
    ld e, (hl)                  ; E = Y position
    inc hl
    ld c, (hl)                  ; BC = Text pointer (low)
    inc hl
    ld b, (hl)
    inc hl
    ld a, (hl)                  ; A = Visible flag
    inc hl

    ; Check if visible
    or a
    jr z, .skip_element

    ; Calculate VRAM address from X,Y pixel coordinates
    ; Screen 2 Name Table = #1800 + (Y/8)*32 + (X/8)
    push bc                     ; Save text pointer

    ; Y/8 = row
    ld a, e                     ; A = Y
    srl a
    srl a
    srl a                       ; A = Y/8 (row)

    ; row * 32
    ld l, a
    ld h, 0
    add hl, hl                  ; * 2
    add hl, hl                  ; * 4
    add hl, hl                  ; * 8
    add hl, hl                  ; * 16
    add hl, hl                  ; * 32

    ; Add X/8
    ld a, d                     ; A = X
    srl a
    srl a
    srl a                       ; A = X/8 (column)
    ld e, a
    ld d, 0
    add hl, de

    ; Add Name Table base
    ld de, #1800
    add hl, de                  ; HL = VRAM address

    pop de                      ; DE = Text pointer

    ; Render text string at HL (VRAM) from DE (string)
    call hud_print_string

.skip_element:
    pop hl                      ; Restore data pointer
    ld de, 6                    ; Size of each element entry
    add hl, de                  ; Move to next element

    pop bc                      ; Restore counter
    djnz .render_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

`;
}

/**
 * Generate HUD helper functions
 */
function generateHudHelperFunctions(): string {
    return `; ------------------------------------------------------------------
; hud_print_string
; Print a null-terminated string to Screen 2 Name Table
; Input: HL = VRAM address, DE = String pointer (RAM)
; ------------------------------------------------------------------
hud_print_string:
    push af
    push bc
    push de
    push hl

.print_loop:
    ld a, (de)                  ; Get character from string
    or a                        ; Check for null terminator
    jr z, .print_done

    ; Convert ASCII to tile index (A-Z, 0-9, space, punctuation)
    call hud_ascii_to_tile

    ; Write tile to VRAM Name Table
    push de
    push hl
    ex de, hl                   ; Swap: HL = VRAM address, DE = string ptr
    call WRTVRM                 ; Write A to VRAM at HL
    ex de, hl                   ; Swap back: HL = VRAM, DE = string ptr
    pop hl
    pop de

    ; Move to next character
    inc de                      ; Next char in string
    inc hl                      ; Next VRAM position

    jr .print_loop

.print_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; hud_ascii_to_tile
; Convert ASCII character to tile index for font rendering
; Input: A = ASCII character
; Output: A = Tile index
; ------------------------------------------------------------------
hud_ascii_to_tile:
    ; Space (32) -> tile 0
    cp 32
    jr nz, .not_space
    ld a, 0
    ret

.not_space:
    ; Numbers '0'-'9' (48-57) -> tiles 1-10
    cp '0'
    jr c, .not_number
    cp '9'+1
    jr nc, .not_number
    sub '0'
    inc a                       ; Offset by 1 (tile 0 = space)
    ret

.not_number:
    ; Letters 'A'-'Z' (65-90) -> tiles 11-36
    cp 'A'
    jr c, .not_upper
    cp 'Z'+1
    jr nc, .not_upper
    sub 'A'
    add a, 11                   ; Offset by 11 (0=space, 1-10=numbers)
    ret

.not_upper:
    ; Letters 'a'-'z' (97-122) -> tiles 11-36 (same as uppercase)
    cp 'a'
    jr c, .punctuation
    cp 'z'+1
    jr nc, .punctuation
    sub 'a'
    add a, 11
    ret

.punctuation:
    ; Punctuation: ':' -> tile 37, '-' -> tile 38, '.' -> tile 39
    cp ':'
    jr nz, .not_colon
    ld a, 37
    ret

.not_colon:
    cp '-'
    jr nz, .not_dash
    ld a, 38
    ret

.not_dash:
    cp '.'
    jr nz, .not_dot
    ld a, 39
    ret

.not_dot:
    ; Default: space
    ld a, 0
    ret

; ------------------------------------------------------------------
; update_hud_score
; Update score HUD element with current score value
; Input: HL = Score value (16-bit BCD)
; ------------------------------------------------------------------
update_hud_score:
    ; TODO: Implement score update
    ; Convert 16-bit BCD to ASCII digits and update text
    ret

; ------------------------------------------------------------------
; update_hud_lives
; Update lives HUD element
; Input: A = Number of lives
; ------------------------------------------------------------------
update_hud_lives:
    ; TODO: Implement lives counter update
    ret

`;
}

/**
 * Get HUD element type ID for ASM
 */
function getHudElementTypeId(type: string): number {
    const typeMap: Record<string, number> = {
        [HUDElementType.Score]: 1,
        [HUDElementType.HighScore]: 2,
        [HUDElementType.Lives]: 3,
        [HUDElementType.EnergyBar]: 4,
        [HUDElementType.ItemDisplay]: 5,
        [HUDElementType.SceneName]: 6,
        [HUDElementType.MiniMap]: 7,
        [HUDElementType.CoinCounter]: 8,
        [HUDElementType.BossEnergyBar]: 9,
        [HUDElementType.PhaseIndicator]: 10,
        [HUDElementType.AttackAlert]: 11,
        [HUDElementType.TextBox]: 12,
        [HUDElementType.NumericField]: 13,
        [HUDElementType.CustomCounter]: 14,
    };

    return typeMap[type] || 0;
}
