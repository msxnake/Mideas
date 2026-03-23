/**
 * @fileoverview Font Generator - MSX font patterns for Screen 2 text rendering
 * Generates font.asm with character patterns and color attributes
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { usesMapperBanking } from './romModeUtils';

export interface FontRawData {
    patternBytes: number[];
    colorBytes: number[];
    sortedCodes: number[];
}

/**
 * Build raw font byte arrays from project analysis.
 * Used by both generateFontFile (inline) and page0Generator (page0 group).
 */
export function getFontRawData(analysis: ProjectAnalysis): FontRawData {
    const fontPatterns = new Map<number, number[]>();
    const fontColors = new Map<number, number[]>();

    const defaults = [
        { code: 32, pattern: [0, 0, 0, 0, 0, 0, 0, 0] },
        { code: 43, pattern: [0x00, 0x10, 0x10, 0x7C, 0x10, 0x10, 0x00, 0x00] },
        { code: 45, pattern: [0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00] },
        { code: 62, pattern: [0x00, 0x30, 0x18, 0x0C, 0x18, 0x30, 0x00, 0x00] },
        { code: 124, pattern: [0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18] }
    ];
    defaults.forEach(d => {
        fontPatterns.set(d.code, d.pattern);
        fontColors.set(d.code, [0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0]);
    });

    const hexToMSX1Index = (hexColor: string): number => {
        if (hexColor.startsWith('rgba(0,0,0,0)')) return 0;
        const normalized = hexColor.toUpperCase();
        const palette: Record<string, number> = {
            'RGBA(0,0,0,0)': 0, '#000000': 1, '#21C842': 2, '#5EDC78': 3,
            '#5455ED': 4, '#7D76FC': 5, '#D4524D': 6, '#42EBF5': 7,
            '#FC5554': 8, '#FF7978': 9, '#D4C154': 10, '#E6CE80': 11,
            '#21B03B': 12, '#C95BBA': 13, '#CCCCCC': 14, '#FFFFFF': 15
        };
        return palette[normalized] ?? 15;
    };

    if (analysis.fonts && analysis.fonts.length > 0) {
        const fontAsset = analysis.fonts[0];
        const fontData = (fontAsset.data as any).fontData || {};
        const colorData = (fontAsset.data as any).fontColorAttributes || {};
        Object.keys(fontData).forEach(key => {
            const charCode = parseInt(key, 10);
            const pattern = fontData[charCode];
            if (Array.isArray(pattern) && pattern.length === 8) {
                fontPatterns.set(charCode, pattern);
                if (colorData[charCode] && Array.isArray(colorData[charCode])) {
                    const rowColors = colorData[charCode];
                    const colorBytes: number[] = [];
                    for (let row = 0; row < 8; row++) {
                        if (rowColors[row] && typeof rowColors[row] === 'object') {
                            const fgIdx = hexToMSX1Index(rowColors[row].fg);
                            const bgIdx = hexToMSX1Index(rowColors[row].bg);
                            colorBytes.push((fgIdx << 4) | bgIdx);
                        } else {
                            colorBytes.push(0xF0);
                        }
                    }
                    fontColors.set(charCode, colorBytes);
                } else {
                    fontColors.set(charCode, [0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0]);
                }
            }
        });
    } else {
        for (let i = 48; i <= 57; i++) fontPatterns.set(i, [0x3E, 0x7F, 0x73, 0x73, 0x73, 0x7F, 0x3E, 0x00]);
        for (let i = 65; i <= 90; i++) fontPatterns.set(i, [0x3E, 0x7F, 0x63, 0x7F, 0x7F, 0x63, 0x63, 0x00]);
        defaults.forEach(d => fontPatterns.set(d.code, d.pattern));
    }

    const sortedCodes = Array.from(fontPatterns.keys()).filter(c => c < 128).sort((a, b) => a - b);
    const patternBytes = sortedCodes.flatMap(code => fontPatterns.get(code)!);
    const colorBytes = sortedCodes.flatMap(code => fontColors.get(code) || [0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0]);
    return { patternBytes, colorBytes, sortedCodes };
}

/**
 * Generate font data file with MSX font patterns for Screen 2 text (font.asm)
 *
 * Based on Mideas Font Editor and DEFAULT_MSX_FONT patterns.
 * Includes font loading functions for all three Screen 2 pattern banks.
 *
 * @param analysis - Project analysis (checks for menus/text usage)
 * @param fontInPage0 - When true (plain48k), data blobs are emitted in page0.asm instead
 * @returns ASM code string with font patterns and loading functions
 */
export function generateFontFile(analysis: ProjectAnalysis, romMode: string = 'simple32k', fontInPage0: boolean = false): string {
    // Check if font is needed (menus, text, or HUD elements)
    const hasMenus = analysis.gameFlow?.nodes?.some(node => node.type === 'SubMenu');
    const hasText = analysis.screenMaps?.some(screen =>
        (screen.layers as any)?.text || (screen as any).textElements?.length > 0
    );

    // CRITICAL: Check for HUD elements (they need font for text rendering)
    const hasHUD = analysis.screenMaps?.some(screen =>
        screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
    );

    // Skip font system if no text/menus/HUD in project
    if (!hasMenus && !hasText && !hasHUD) {
        return `; ==================================================================
; MSX FONT DATA (SKIPPED - NO TEXT/MENUS/HUD DETECTED)
; File: font.asm
; ==================================================================

; No text, menus, or HUD detected in project - font system not needed
; This saves ~250 lines of unused font data

; Minimal stub functions for compatibility
init_font_system:
    ret

load_custom_font:
    ret

print_string_screen2:
    ret

; ==================================================================
; END OF FONT (MINIMAL VERSION)
; ==================================================================
`;
    }

    // ------------------------------------------------------------------
    // DYNAMIC FONT DATA GENERATION
    // ------------------------------------------------------------------
    const { patternBytes, colorBytes, sortedCodes } = getFontRawData(analysis);

    // Build FONT_CHAR_INDEX blob (always emitted in font.asm)
    let indexAsm = `FONT_CHAR_INDEX:\n    DB `;
    sortedCodes.forEach((code, i) => {
        indexAsm += `${code}${i < sortedCodes.length - 1 ? ', ' : ''}`;
    });
    indexAsm += `\nFONT_CHAR_COUNT EQU ${sortedCodes.length}\n`;

    // Build FONT_PATTERN_DATA and FONT_COLOR_DATA blobs only when NOT in page0 mode
    // (in page0 mode these labels/bytes are emitted by page0Generator.ts)
    let patternAsm = '';
    let colorAsm = '';
    if (!fontInPage0) {
        let patternAsmBlob = `FONT_PATTERN_DATA:\n`;
        let colorAsmBlob = `FONT_COLOR_DATA:\n`;
        sortedCodes.forEach((code, i) => {
            const pattern = patternBytes.slice(i * 8, i * 8 + 8);
            const color = colorBytes.slice(i * 8, i * 8 + 8);
            patternAsmBlob += `    ; Char ${code} ('${String.fromCharCode(code)}')\n`;
            patternAsmBlob += `    DB ${pattern.map(b => '#' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}\n`;
            colorAsmBlob += `    ; Char ${code}\n`;
            colorAsmBlob += `    DB ${color.map(b => '#' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}\n`;
        });
        patternAsm = patternAsmBlob;
        colorAsm = colorAsmBlob;
    }

    const usesMapper = usesMapperBanking(romMode);
    const mapperPushPat = usesMapper ? '    call mapper_push_p2\n    ld a, FONT_PATTERN_DATA_BANK\n    call mapper_set_bank_p2\n' : '';
    const mapperPushCol = usesMapper ? '    call mapper_push_p2\n    ld a, FONT_COLOR_DATA_BANK\n    call mapper_set_bank_p2\n' : '';
    const mapperPop    = usesMapper ? '    call mapper_pop_p2\n' : '';

    const bankEqUs = fontInPage0 ? `; FONT_DATA_ROM_DATA_GROUP: page0
; (FONT_PATTERN_DATA and FONT_COLOR_DATA are in page0.asm for plain48k ROMs)
` : `FONT_PATTERN_DATA_BANK EQU ((FONT_PATTERN_DATA - #4000) / #2000)
FONT_COLOR_DATA_BANK   EQU ((FONT_COLOR_DATA - #4000) / #2000)
`;

    const patternSection = fontInPage0 ? '; [FONT_PATTERN_DATA blob emitted in page0.asm]\n' : `; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${patternAsm}
`;

    const colorSection = fontInPage0 ? '; [FONT_COLOR_DATA blob emitted in page0.asm]\n' : `; ==================================================================
; FONT COLOR ATTRIBUTES
; ==================================================================

${colorAsm}
`;

    return `; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

${bankEqUs}
${patternSection}
; Character index table (for quick lookup)
${indexAsm}

; ==================================================================
; FONT LOADING FUNCTIONS
; ==================================================================

load_custom_font:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; Uses FONT_CHAR_INDEX to map specific characters to their correct VRAM addresses
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank0:
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank1:
    ld de, CHRTBL2 + #800         ; Bank 1 Base
    call load_font_patterns_to_bank
    ret

load_font_bank2:
    ld de, CHRTBL2 + #1000        ; Bank 2 Base
    call load_font_patterns_to_bank
    ret

load_all_font_banks:
    call load_font_bank0
    call load_font_bank1
    call load_font_bank2
    ret

; Helper: Load font patterns to a specific bank
; Input: DE = Bank Base Address
load_font_patterns_to_bank:
${mapperPushPat}    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, FONT_PATTERN_DATA      ; Pointer to pattern data
    ld b, FONT_CHAR_COUNT         ; Number of characters to load

.load_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer (IY is in RAM, so use HL)
    push iy
    pop hl                        ; HL = Source Pattern (IY)

    ; Copy 8 bytes
    ld bc, 8
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
${mapperPop}    ret

${colorSection}
load_font_colors:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank
    ret

load_font_colors_all_banks:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #800         ; Bank 1 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #1000        ; Bank 2 Base
    call load_font_colors_to_bank
    ret

; Helper: Load font colors to a specific bank
; Input: DE = Bank Base Address
load_font_colors_to_bank:
${mapperPushCol}    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, FONT_COLOR_DATA        ; Pointer to color data
    ld b, FONT_CHAR_COUNT         ; Number of characters to load

.load_colors_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer
    push iy
    pop hl                        ; HL = Source Color (IY)

    ; Copy 8 bytes
    ld bc, 8
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
${mapperPop}    ret

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
print_string_screen2:
    push bc
    ld b, 0                        ; Character counter

print_string_loop:
    ld a, (hl)                     ; Get character
    or a                           ; Check for null terminator
    jr z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    ; FAST_WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ex de, hl                      ; Swap: DE = string ptr, HL = VRAM address for FAST_WRTVRM
    call FAST_WRTVRM               ; Write character to VRAM (fast)
    pop de                         ; Restore VRAM position
    pop hl                         ; Restore string pointer

    ; Move to next character
    inc hl                         ; Next character in string
    inc de                         ; Next position in VRAM
    inc b                          ; Count characters
    ld a, b
    cp 32                          ; Limit to screen width
    jr nz, print_string_loop       ; Continue if not at edge

print_string_end:
    pop bc
    ret

; Initialize font system for Screen 2 text rendering
init_font_system:
    ; Load custom font patterns and colors
    call load_all_font_banks       ; Load patterns to all banks
    call load_font_colors_all_banks ; Load colors to all banks
    ret

; ==================================================================
; END OF FONT DATA
; ==================================================================
`;
}
