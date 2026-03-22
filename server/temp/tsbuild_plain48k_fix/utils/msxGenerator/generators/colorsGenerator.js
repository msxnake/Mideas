"use strict";
/**
 * @fileoverview Colors Generator - Tile color data
 * Generates colors.asm with tile color definitions for MSX Screen 2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateColorsFile = generateColorsFile;
const tileUtils_1 = require("../../../components/utils/tileUtils");
const screen2TileBanks_1 = require("../utils/screen2TileBanks");
/**
 * Generate color data file (colors.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @returns ASM code string with color data and loading functions
 */
function generateColorsFile(analysis, romMode = 'simple32k') {
    if (!analysis.tiles || analysis.tiles.length === 0) {
        return `; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
    }
    const mapperPush = romMode !== 'simple32k' ? '    call mapper_push_p2\n    ld a, COLOR_DATA_BANK\n    call mapper_set_bank_p2\n' : '';
    const mapperPop = romMode !== 'simple32k' ? '    call mapper_pop_p2\n' : '';
    const referencedTileBanks = (0, screen2TileBanks_1.buildReferencedScreen2TileBanks)(analysis);
    const bankBaseExpressions = ['CLRTBL2', 'CLRTBL2 + #800', 'CLRTBL2 + #1000'];
    const formatBytes = (bytes) => {
        if (bytes.length === 0)
            return '    db #00\n';
        let asm = '';
        for (let i = 0; i < bytes.length; i += 16) {
            const chunk = bytes.slice(i, i + 16).map((b) => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
            asm += `    db ${chunk.join(', ')}\n`;
        }
        return asm;
    };
    const sharedColorDataBySignature = new Map();
    const sharedColorDataBlocks = [];
    let nextSharedColorDataIndex = 0;
    const tileBankRuntimeAsm = referencedTileBanks.map((runtime) => {
        let asm = `; ==================================================================
; SCREEN 2 TILEBANK COLOR DATA (${runtime.tileBankId})
; ==================================================================

`;
        runtime.banks.forEach((bank, bankIndex) => {
            const dataSignature = `${bank.startChar}|${bank.byteCount}|${bank.colorBytes.join(',')}`;
            let dataLabel = sharedColorDataBySignature.get(dataSignature);
            if (!dataLabel) {
                dataLabel = `tilebank_color_data_${nextSharedColorDataIndex++}`;
                sharedColorDataBySignature.set(dataSignature, dataLabel);
                sharedColorDataBlocks.push(`${dataLabel}:
${formatBytes(bank.colorBytes)}
`);
            }
            if (bank.byteCount > 0) {
                asm += `${runtime.labelBase}_load_color_bank${bankIndex}:
${mapperPush}    ld hl, ${dataLabel}
    ld de, ${bankBaseExpressions[bankIndex]} + (${bank.startChar} * 8)
    ld bc, ${bank.byteCount}
    call FAST_LDIRVM
${mapperPop}    ret

`;
            }
        });
        asm += `${(0, screen2TileBanks_1.getScreen2TileBankColorLoaderLabel)(runtime.tileBankId)}:
`;
        runtime.banks.forEach((bank, bankIndex) => {
            if (bank.byteCount > 0) {
                asm += `    call ${runtime.labelBase}_load_color_bank${bankIndex}
`;
            }
        });
        asm += `    ret

`;
        return asm;
    }).join('');
    return `; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${analysis.tiles?.length || 0} tiles detected
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
${mapperPush}    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${mapperPush}    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${mapperPush}    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ret

${tileBankRuntimeAsm}
${sharedColorDataBlocks.join('')}

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`;
}
