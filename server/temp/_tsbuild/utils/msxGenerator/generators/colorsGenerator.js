"use strict";
/**
 * @fileoverview Colors Generator - Tile color data
 * Generates colors.asm with tile color definitions for MSX Screen 2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateColorsFile = generateColorsFile;
const tileUtils_1 = require("../../../components/utils/tileUtils");
/**
 * Generate color data file (colors.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @returns ASM code string with color data and loading functions
 */
function generateColorsFile(analysis) {
    var _a;
    if (!analysis.tiles || analysis.tiles.length === 0) {
        return `; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
    }
    return `; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${((_a = analysis.tiles) === null || _a === void 0 ? void 0 : _a.length) || 0} tiles detected
; ==================================================================

COLOR_DATA_BANK EQU ((tile_color_bank0 - #4000) / #2000)

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${analysis.tiles.map((tile, index) => {
        // Generate actual color bytes using the same function as MSX Main Generator
        const colorBytes = (0, tileUtils_1.generateTileColorBytes)(tile);
        const bytesHex = colorBytes ?
            Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
            ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0']; // Default white/black if no color data
        return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)
    db ${bytesHex.join(', ')}
`;
    }).join('')}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ret

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`;
}
