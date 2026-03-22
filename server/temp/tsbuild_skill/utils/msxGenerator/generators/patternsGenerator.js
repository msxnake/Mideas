"use strict";
/**
 * @fileoverview Patterns Generator - Tile pattern data
 * Generates patterns.asm with tile pattern definitions for MSX Screen 2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePatternsFile = generatePatternsFile;
const tileUtils_1 = require("../../../components/utils/tileUtils");
const screen2TileBanks_1 = require("../utils/screen2TileBanks");
const romModeUtils_1 = require("./romModeUtils");
/**
 * Generate pattern data file (patterns.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @returns ASM code string with pattern data and loading functions
 */
function generatePatternsFile(analysis, romMode = 'simple32k') {
    if (!analysis.tiles || analysis.tiles.length === 0) {
        return `; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
    }
    const usesMapper = (0, romModeUtils_1.usesMapperBanking)(romMode);
    const mapperPush = usesMapper ? '    call mapper_push_p2\n    ld a, PATTERN_DATA_BANK\n    call mapper_set_bank_p2\n' : '';
    const mapperPop = usesMapper ? '    call mapper_pop_p2\n' : '';
    const referencedTileBanks = (0, screen2TileBanks_1.buildReferencedScreen2TileBanks)(analysis);
    const bankBaseExpressions = ['CHRTBL2', 'CHRTBL2 + #800', 'CHRTBL2 + #1000'];
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
    const sharedPatternDataBySignature = new Map();
    const sharedPatternDataBlocks = [];
    let nextSharedPatternDataIndex = 0;
    const tileBankRuntimeAsm = referencedTileBanks.map((runtime) => {
        let asm = `; ==================================================================
; SCREEN 2 TILEBANK PATTERN DATA (${runtime.tileBankId})
; ==================================================================

`;
        runtime.banks.forEach((bank, bankIndex) => {
            const dataSignature = `${bank.startChar}|${bank.byteCount}|${bank.patternBytes.join(',')}`;
            let dataLabel = sharedPatternDataBySignature.get(dataSignature);
            if (!dataLabel) {
                dataLabel = `tilebank_pattern_data_${nextSharedPatternDataIndex++}`;
                sharedPatternDataBySignature.set(dataSignature, dataLabel);
                sharedPatternDataBlocks.push(`${dataLabel}:
${formatBytes(bank.patternBytes)}
`);
            }
            if (bank.byteCount > 0) {
                asm += `${runtime.labelBase}_load_pattern_bank${bankIndex}:
${mapperPush}    ld hl, ${dataLabel}
    ld de, ${bankBaseExpressions[bankIndex]} + (${bank.startChar} * 8)
    ld bc, ${bank.byteCount}
    call FAST_LDIRVM
${mapperPop}    ret

`;
            }
        });
        asm += `${(0, screen2TileBanks_1.getScreen2TileBankPatternLoaderLabel)(runtime.tileBankId)}:
`;
        runtime.banks.forEach((bank, bankIndex) => {
            if (bank.byteCount > 0) {
                asm += `    call ${runtime.labelBase}_load_pattern_bank${bankIndex}
`;
            }
        });
        asm += `    ret

`;
        return asm;
    }).join('');
    return `; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${analysis.tiles?.length || 0} tiles detected
; ==================================================================

PATTERN_DATA_BANK EQU ((tile_pattern_bank0 - #4000) / #2000)

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${analysis.tiles.map((tile, index) => {
        // Generate actual pattern bytes using the same function as MSX Main Generator
        const patternBytes = (0, tileUtils_1.generateTilePatternBytes)(tile, 'SCREEN 2 (Graphics I)');
        // Calculate how many 8x8 MSX characters this tile needs (dynamic sizing)
        const charsWide = Math.ceil(tile.width / 8); // e.g., 24px = 3 chars wide
        const charsHigh = Math.ceil(tile.height / 8); // e.g., 16px = 2 chars high
        const totalChars = charsWide * charsHigh; // e.g., 3×2 = 6 MSX characters
        const totalBytes = totalChars * 8; // Each MSX char = 8 bytes
        // Validate that tile size is compatible with MSX characters
        if (tile.width % 8 !== 0 || tile.height % 8 !== 0) {
            console.warn(`⚠️  Tile ${tile.name} size ${tile.width}x${tile.height} is not multiple of 8px - may cause visual artifacts`);
        }
        const bytesHex = Array.from(patternBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
        // Generate character-by-character breakdown for complex tiles
        let charBreakdown = '';
        if (totalChars > 1) {
            charBreakdown = `\n    ; Character layout: ${charsWide}×${charsHigh} grid`;
            for (let row = 0; row < charsHigh; row++) {
                charBreakdown += `\n    ; Row ${row}: `;
                for (let col = 0; col < charsWide; col++) {
                    const charIndex = row * charsWide + col;
                    charBreakdown += `Char${charIndex} `;
                }
            }
        }
        return `    ; Tile ${index}: ${tile.name} (${tile.width}x${tile.height}px = ${charsWide}×${charsHigh} chars = ${totalChars} MSX characters)${charBreakdown}
    db ${bytesHex.join(', ')}
`;
    }).join('')}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
${mapperPush}    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${mapperPush}    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${mapperPush}    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ret

${tileBankRuntimeAsm}
${sharedPatternDataBlocks.join('')}

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`;
}
