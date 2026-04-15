"use strict";
/**
 * @fileoverview Font Generator - MSX font patterns for Screen 2 text rendering
 * Generates font.asm with character patterns and color attributes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFontRawData = getFontRawData;
exports.generateFontFile = generateFontFile;
exports.getFontBank4Data = getFontBank4Data;
const romModeUtils_1 = require("./romModeUtils");
const mapperWindowUtils_1 = require("./mapperWindowUtils");
const megaromResourceArtifacts_1 = require("../utils/megaromResourceArtifacts");
function formatAsmCharComment(code) {
    if (code >= 32 && code <= 126) {
        const char = String.fromCharCode(code)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
        return `'${char}'`;
    }
    return `0x${code.toString(16).toUpperCase().padStart(2, '0')}`;
}
/**
 * Build raw font byte arrays from project analysis.
 * Used by both generateFontFile (inline) and page0Generator (page0 group).
 */
function getFontRawData(analysis) {
    const fontPatterns = new Map();
    const fontColors = new Map();
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
    const hexToMSX1Index = (hexColor) => {
        if (hexColor.startsWith('rgba(0,0,0,0)'))
            return 0;
        const normalized = hexColor.toUpperCase();
        const palette = {
            'RGBA(0,0,0,0)': 0, '#000000': 1, '#21C842': 2, '#5EDC78': 3,
            '#5455ED': 4, '#7D76FC': 5, '#D4524D': 6, '#42EBF5': 7,
            '#FC5554': 8, '#FF7978': 9, '#D4C154': 10, '#E6CE80': 11,
            '#21B03B': 12, '#C95BBA': 13, '#CCCCCC': 14, '#FFFFFF': 15
        };
        return palette[normalized] ?? 15;
    };
    if (analysis.fonts && analysis.fonts.length > 0) {
        const fontAsset = analysis.fonts[0];
        const fontData = fontAsset.data.fontData || {};
        const colorData = fontAsset.data.fontColorAttributes || {};
        Object.keys(fontData).forEach(key => {
            const charCode = parseInt(key, 10);
            const pattern = fontData[charCode];
            if (Array.isArray(pattern) && pattern.length === 8) {
                fontPatterns.set(charCode, pattern);
                if (colorData[charCode] && Array.isArray(colorData[charCode])) {
                    const rowColors = colorData[charCode];
                    const colorBytes = [];
                    for (let row = 0; row < 8; row++) {
                        if (rowColors[row] && typeof rowColors[row] === 'object') {
                            const fgIdx = hexToMSX1Index(rowColors[row].fg);
                            const bgIdx = hexToMSX1Index(rowColors[row].bg);
                            colorBytes.push((fgIdx << 4) | bgIdx);
                        }
                        else {
                            colorBytes.push(0xF0);
                        }
                    }
                    fontColors.set(charCode, colorBytes);
                }
                else {
                    fontColors.set(charCode, [0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0]);
                }
            }
        });
    }
    else {
        for (let i = 48; i <= 57; i++)
            fontPatterns.set(i, [0x3E, 0x7F, 0x73, 0x73, 0x73, 0x7F, 0x3E, 0x00]);
        for (let i = 65; i <= 90; i++)
            fontPatterns.set(i, [0x3E, 0x7F, 0x63, 0x7F, 0x7F, 0x63, 0x63, 0x00]);
        defaults.forEach(d => fontPatterns.set(d.code, d.pattern));
    }
    const sortedCodes = Array.from(fontPatterns.keys()).filter(c => c < 128).sort((a, b) => a - b);
    const patternBytes = sortedCodes.flatMap(code => fontPatterns.get(code));
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
function generateFontFile(analysis, romMode = 'simple32k', fontInPage0 = false, fontInBank4 = false, targetFormat = 'konami') {
    // Check if font is needed (menus, text, or HUD elements)
    const hasMenus = analysis.gameFlow?.nodes?.some(node => node.type === 'SubMenu');
    const hasText = analysis.screenMaps?.some(screen => screen.layers?.text || screen.textElements?.length > 0);
    // CRITICAL: Check for HUD elements (they need font for text rendering)
    const hasHUD = analysis.screenMaps?.some(screen => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
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
    // Build FONT_PATTERN_DATA and FONT_COLOR_DATA blobs only when NOT in page0/bank4 mode
    // (in page0 mode these labels/bytes are emitted by page0Generator.ts)
    // (in bank4 mode these labels/bytes are emitted in the org #C000 bank4 section)
    let patternAsm = '';
    let colorAsm = '';
    if (!fontInPage0 && !fontInBank4) {
        let patternAsmBlob = `FONT_PATTERN_DATA:\n`;
        let colorAsmBlob = `FONT_COLOR_DATA:\n`;
        sortedCodes.forEach((code, i) => {
            const pattern = patternBytes.slice(i * 8, i * 8 + 8);
            const color = colorBytes.slice(i * 8, i * 8 + 8);
            patternAsmBlob += `    ; Char ${code} (${formatAsmCharComment(code)})\n`;
            patternAsmBlob += `    DB ${pattern.map(b => '#' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}\n`;
            colorAsmBlob += `    ; Char ${code}\n`;
            colorAsmBlob += `    DB ${color.map(b => '#' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}\n`;
        });
        patternAsm = patternAsmBlob;
        colorAsm = colorAsmBlob;
    }
    const usesMapper = (0, romModeUtils_1.usesMapperBanking)(romMode);
    const useResourceManager = romMode === 'megarom';
    const mapperWindow = (0, mapperWindowUtils_1.getMapperWindowConfig)(romMode, targetFormat);
    const mapperPushPat = usesMapper ? (0, mapperWindowUtils_1.buildMapperDataPushAsm)('FONT_PATTERN_DATA_BANK', mapperWindow) : '';
    const mapperPushCol = usesMapper ? (0, mapperWindowUtils_1.buildMapperDataPushAsm)('FONT_COLOR_DATA_BANK', mapperWindow) : '';
    const mapperPop = usesMapper ? (0, mapperWindowUtils_1.buildMapperDataPopAsm)(mapperWindow) : '';
    const bankedPatternAddress = (0, mapperWindowUtils_1.buildMapperWindowedAddress)('FONT_PATTERN_DATA', mapperWindow);
    const bankedColorAddress = (0, mapperWindowUtils_1.buildMapperWindowedAddress)('FONT_COLOR_DATA', mapperWindow);
    const fontPatternResourceId = (0, megaromResourceArtifacts_1.buildResourceIdLabelFromAsmLabel)('FONT_PATTERN_DATA');
    const fontColorResourceId = (0, megaromResourceArtifacts_1.buildResourceIdLabelFromAsmLabel)('FONT_COLOR_DATA');
    const bankEqUs = fontInPage0 ? `; FONT_DATA_ROM_DATA_GROUP: page0
; (FONT_PATTERN_DATA and FONT_COLOR_DATA are in page0.asm for plain48k ROMs)
` : fontInBank4 ? `; FONT_DATA_ROM_DATA_GROUP: bank4
; (FONT_PATTERN_DATA and FONT_COLOR_DATA are in bank4 section, org #C000, for megarom builds)
FONT_PATTERN_DATA_BANK EQU ${(0, mapperWindowUtils_1.buildMapperBankEqu)('FONT_PATTERN_DATA', mapperWindow)}
FONT_COLOR_DATA_BANK   EQU ${(0, mapperWindowUtils_1.buildMapperBankEqu)('FONT_COLOR_DATA', mapperWindow)}
` : `FONT_PATTERN_DATA_BANK EQU ${(0, mapperWindowUtils_1.buildMapperBankEqu)('FONT_PATTERN_DATA', mapperWindow)}
FONT_COLOR_DATA_BANK   EQU ${(0, mapperWindowUtils_1.buildMapperBankEqu)('FONT_COLOR_DATA', mapperWindow)}
`;
    const patternSection = fontInPage0 ? '; [FONT_PATTERN_DATA blob emitted in page0.asm]\n'
        : fontInBank4 ? '; [FONT_PATTERN_DATA blob emitted in bank4 section (org #C000)]\n'
            : `; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${patternAsm}
`;
    const colorSection = fontInPage0 ? '; [FONT_COLOR_DATA blob emitted in page0.asm]\n'
        : fontInBank4 ? '; [FONT_COLOR_DATA blob emitted in bank4 section (org #C000)]\n'
            : `; ==================================================================
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
${useResourceManager ? `    ld a, ${fontPatternResourceId}
    call resource_find_by_id
    ret c
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld hl, (resource_descriptor_addr)
    push hl
    pop iy
    ld b, FONT_CHAR_COUNT         ; Number of characters to load
` : `${mapperPushPat}    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, ${fontInBank4 ? bankedPatternAddress : 'FONT_PATTERN_DATA'}      ; Pointer to pattern data (window addr for bank4)
    ld b, FONT_CHAR_COUNT         ; Number of characters to load
`}

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
${useResourceManager ? `    ld a, (resource_descriptor_bank)
    call resource_copy_from_bank_to_vram` : `    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)`}

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
${useResourceManager ? `    ret` : `${mapperPop}    ret`}

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
${useResourceManager ? `    ld a, ${fontColorResourceId}
    call resource_find_by_id
    ret c
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld hl, (resource_descriptor_addr)
    push hl
    pop iy
    ld b, FONT_CHAR_COUNT         ; Number of characters to load
` : `${mapperPushCol}    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, ${fontInBank4 ? bankedColorAddress : 'FONT_COLOR_DATA'}        ; Pointer to color data (window addr for bank4)
    ld b, FONT_CHAR_COUNT         ; Number of characters to load
`}

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
${useResourceManager ? `    ld a, (resource_descriptor_bank)
    call resource_copy_from_bank_to_vram` : `    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)`}

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
${useResourceManager ? `    ret` : `${mapperPop}    ret`}

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
/**
 * Returns only the DB byte blocks for font data, for bank4 placement.
 * Used by unifiedGenerator when romMode === 'megarom' to emit data after org #C000.
 */
function getFontBank4Data(analysis) {
    const hasMenus = analysis.gameFlow?.nodes?.some(node => node.type === 'SubMenu');
    const hasText = analysis.screenMaps?.some(screen => screen.layers?.text || screen.textElements?.length > 0);
    const hasHUD = analysis.screenMaps?.some(screen => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
    if (!hasMenus && !hasText && !hasHUD)
        return '';
    const { patternBytes, colorBytes, sortedCodes } = getFontRawData(analysis);
    let patternAsmBlob = `FONT_PATTERN_DATA:\n`;
    let colorAsmBlob = `FONT_COLOR_DATA:\n`;
    sortedCodes.forEach((code, i) => {
        const pattern = patternBytes.slice(i * 8, i * 8 + 8);
        const color = colorBytes.slice(i * 8, i * 8 + 8);
        patternAsmBlob += `    ; Char ${code} (${formatAsmCharComment(code)})\n`;
        patternAsmBlob += `    DB ${pattern.map(b => '#' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}\n`;
        colorAsmBlob += `    ; Char ${code}\n`;
        colorAsmBlob += `    DB ${color.map(b => '#' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}\n`;
    });
    return patternAsmBlob + '\n' + colorAsmBlob;
}
