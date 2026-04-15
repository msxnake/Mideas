"use strict";
/**
 * @fileoverview Colors Generator - Tile color data
 * Generates colors.asm with tile color definitions for MSX Screen 2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateColorsFile = generateColorsFile;
exports.getColorsBank4Data = getColorsBank4Data;
const tileUtils_1 = require("../../../components/utils/tileUtils");
const screen2TileBanks_1 = require("../utils/screen2TileBanks");
const romModeUtils_1 = require("./romModeUtils");
const mapperWindowUtils_1 = require("./mapperWindowUtils");
const megaromResourceArtifacts_1 = require("../utils/megaromResourceArtifacts");
/**
 * Generate color data file (colors.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @param romMode - ROM mode string
 * @param dataInBank4 - When true, data tables are emitted in bank4 section (org #C000+).
 *                      Load functions and EQU constants remain here.
 * @returns ASM code string with color data and loading functions
 */
function generateColorsFile(analysis, romMode = 'simple32k', dataInBank4 = false, targetFormat = 'konami') {
    if (!analysis.tiles || analysis.tiles.length === 0) {
        return `; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
    }
    const usesMapper = (0, romModeUtils_1.usesMapperBanking)(romMode);
    const useResourceManager = romMode === 'megarom';
    const mapperWindow = (0, mapperWindowUtils_1.getMapperWindowConfig)(romMode, targetFormat);
    const mapperPush = usesMapper ? (0, mapperWindowUtils_1.buildMapperDataPushAsm)('COLOR_DATA_BANK', mapperWindow) : '';
    const mapperPop = usesMapper ? (0, mapperWindowUtils_1.buildMapperDataPopAsm)(mapperWindow) : '';
    // Window-relative HL formula: (label & #1FFF) | #8000 maps any bank to P2 window.
    const dataHl = (label) => usesMapper ? (0, mapperWindowUtils_1.buildMapperWindowedAddress)(label, mapperWindow) : label;
    const referencedTileBanks = (0, screen2TileBanks_1.buildReferencedScreen2TileBanks)(analysis);
    const bankBaseExpressions = ['CLRTBL2', 'CLRTBL2 + #800', 'CLRTBL2 + #1000'];
    const colorDataResourceId = (0, megaromResourceArtifacts_1.buildResourceIdLabelFromAsmLabel)('tile_color_bank0');
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
                sharedColorDataBlocks.push(`${dataLabel}:\n${formatBytes(bank.colorBytes)}\n`);
            }
            if (bank.byteCount > 0) {
                const dataResourceId = (0, megaromResourceArtifacts_1.buildResourceIdLabelFromAsmLabel)(dataLabel);
                asm += `${runtime.labelBase}_load_color_bank${bankIndex}:\n`;
                if (useResourceManager) {
                    asm += `    ld a, ${dataResourceId}\n`;
                    asm += `    ld de, ${bankBaseExpressions[bankIndex]} + (${bank.startChar} * 8)\n`;
                    asm += `    call resource_load_to_vram_by_id\n`;
                    asm += `    ret\n\n`;
                }
                else {
                    asm += `${mapperPush}    ld hl, ${dataHl(dataLabel)}\n`;
                    asm += `    ld de, ${bankBaseExpressions[bankIndex]} + (${bank.startChar} * 8)\n`;
                    asm += `    ld bc, ${bank.byteCount}\n`;
                    asm += `    call FAST_LDIRVM\n`;
                    asm += `${mapperPop}    ret\n\n`;
                }
            }
        });
        asm += `${(0, screen2TileBanks_1.getScreen2TileBankColorLoaderLabel)(runtime.tileBankId)}:\n`;
        runtime.banks.forEach((bank, bankIndex) => {
            if (bank.byteCount > 0) {
                asm += `    call ${runtime.labelBase}_load_color_bank${bankIndex}\n`;
            }
        });
        asm += `    ret\n\n`;
        return asm;
    }).join('');
    const totalColorBytes = analysis.tiles.reduce((total, tile) => {
        const charsWide = Math.ceil(tile.width / 8);
        const charsHigh = Math.ceil(tile.height / 8);
        return total + (charsWide * charsHigh * 8);
    }, 0);
    // Build the data section (tile_color_bank0 + tilebank shared data)
    let dataSection = '';
    if (!dataInBank4) {
        dataSection += `; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:\n`;
        dataSection += analysis.tiles.map((tile, index) => {
            const colorBytes = (0, tileUtils_1.generateTileColorBytes)(tile);
            const bytesHex = colorBytes ?
                Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
                ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0'];
            return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)\n    db ${bytesHex.join(', ')}\n`;
        }).join('');
    }
    else {
        dataSection = `; COLOR_DATA_ROM_DATA_GROUP: bank4\n; (tile_color_bank0 and tilebank data are emitted in bank4 section, org #C000+)\n`;
    }
    // Tilebank shared data blocks - only inline if not bank4
    const tilebankDataSection = dataInBank4
        ? `; [tilebank_color_data_* emitted in bank4 section]\n`
        : sharedColorDataBlocks.join('');
    return `; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${analysis.tiles?.length || 0} tiles detected
; ==================================================================

COLOR_DATA_BANK EQU ${(0, mapperWindowUtils_1.buildMapperBankEqu)('tile_color_bank0', mapperWindow)}

${dataSection}
; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
${useResourceManager ? `    ld a, ${colorDataResourceId}
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    call resource_load_to_vram_by_id
    ret` : `${mapperPush}    ld hl, ${dataHl('tile_color_bank0')}
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${totalColorBytes}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret`}

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${useResourceManager ? `    ld a, ${colorDataResourceId}
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    call resource_load_to_vram_by_id
    ret` : `${mapperPush}    ld hl, ${dataHl('tile_color_bank0')}       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${totalColorBytes}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret`}

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${useResourceManager ? `    ld a, ${colorDataResourceId}
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    call resource_load_to_vram_by_id
    ret` : `${mapperPush}    ld hl, ${dataHl('tile_color_bank0')}       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${totalColorBytes}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret`}

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ret

${tileBankRuntimeAsm}${tilebankDataSection}
; ==================================================================
; END OF COLOR DATA
; ==================================================================
`;
}
/**
 * Returns only the data tables for bank4 placement (megarom mode).
 * Includes tile_color_bank0 bytes and tilebank_color_data_* bytes.
 * No load functions or EQU constants (those stay in the code section via generateColorsFile).
 */
function getColorsBank4Data(analysis) {
    if (!analysis.tiles || analysis.tiles.length === 0) {
        return '; [colors bank4 data: no tiles]\n';
    }
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
    let asm = `; ==================================================================
; TILE COLOR BANK 0 (Base colors) - bank4 data
; ==================================================================
tile_color_bank0:\n`;
    asm += analysis.tiles.map((tile, index) => {
        const colorBytes = (0, tileUtils_1.generateTileColorBytes)(tile);
        const bytesHex = colorBytes ?
            Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
            ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0'];
        return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)\n    db ${bytesHex.join(', ')}\n`;
    }).join('');
    // Build tilebank shared color data blocks
    const referencedTileBanks = (0, screen2TileBanks_1.buildReferencedScreen2TileBanks)(analysis);
    const sharedColorDataBySignature = new Map();
    let nextSharedColorDataIndex = 0;
    const sharedBlocks = [];
    referencedTileBanks.forEach((runtime) => {
        runtime.banks.forEach((bank) => {
            const dataSignature = `${bank.startChar}|${bank.byteCount}|${bank.colorBytes.join(',')}`;
            if (!sharedColorDataBySignature.has(dataSignature)) {
                const dataLabel = `tilebank_color_data_${nextSharedColorDataIndex++}`;
                sharedColorDataBySignature.set(dataSignature, dataLabel);
                sharedBlocks.push(`${dataLabel}:\n${formatBytes(bank.colorBytes)}\n`);
            }
        });
    });
    if (sharedBlocks.length > 0) {
        asm += `\n; Tilebank color data blocks\n`;
        asm += sharedBlocks.join('');
    }
    return asm;
}
