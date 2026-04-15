/**
 * @fileoverview Colors Generator - Tile color data
 * Generates colors.asm with tile color definitions for MSX Screen 2
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateTileColorBytes } from '../../../components/utils/tileUtils';
import { buildReferencedScreen2TileBanks, getScreen2TileBankColorLoaderLabel } from '../utils/screen2TileBanks';
import { usesMapperBanking } from './romModeUtils';
import {
  buildMapperBankEqu,
  buildMapperDataPopAsm,
  buildMapperDataPushAsm,
  buildMapperWindowedAddress,
  getMapperWindowConfig,
  type MapperTargetFormat,
} from './mapperWindowUtils';
import { buildResourceIdLabelFromAsmLabel } from '../utils/megaromResourceArtifacts';

/**
 * Generate color data file (colors.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @param romMode - ROM mode string
 * @param dataInBank4 - When true, data tables are emitted in bank4 section (org #C000+).
 *                      Load functions and EQU constants remain here.
 * @returns ASM code string with color data and loading functions
 */
export function generateColorsFile(
  analysis: ProjectAnalysis,
  romMode: string = 'simple32k',
  dataInBank4: boolean = false,
  targetFormat: MapperTargetFormat = 'konami'
): string {
  if (!analysis.tiles || analysis.tiles.length === 0) {
    return `; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
  }

  const usesMapper = usesMapperBanking(romMode);
  const useResourceManager = romMode === 'megarom';
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const mapperPush = usesMapper ? buildMapperDataPushAsm('COLOR_DATA_BANK', mapperWindow) : '';
  const mapperPop  = usesMapper ? buildMapperDataPopAsm(mapperWindow) : '';
  // Window-relative HL formula: (label & #1FFF) | #8000 maps any bank to P2 window.
  const dataHl = (label: string) => usesMapper ? buildMapperWindowedAddress(label, mapperWindow) : label;
  const referencedTileBanks = buildReferencedScreen2TileBanks(analysis);
  const bankBaseExpressions = ['CLRTBL2', 'CLRTBL2 + #800', 'CLRTBL2 + #1000'];
  const colorDataResourceId = buildResourceIdLabelFromAsmLabel('tile_color_bank0');

  const formatBytes = (bytes: number[]): string => {
    if (bytes.length === 0) return '    db #00\n';
    let asm = '';
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16).map((b) => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
      asm += `    db ${chunk.join(', ')}\n`;
    }
    return asm;
  };

  const sharedColorDataBySignature = new Map<string, string>();
  const sharedColorDataBlocks: string[] = [];
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
        const dataResourceId = buildResourceIdLabelFromAsmLabel(dataLabel);
        asm += `${runtime.labelBase}_load_color_bank${bankIndex}:\n`;
        if (useResourceManager) {
          asm += `    ld a, ${dataResourceId}\n`;
          asm += `    ld de, ${bankBaseExpressions[bankIndex]} + (${bank.startChar} * 8)\n`;
          asm += `    call resource_load_to_vram_by_id\n`;
          asm += `    ret\n\n`;
        } else {
          asm += `${mapperPush}    ld hl, ${dataHl(dataLabel)}\n`;
          asm += `    ld de, ${bankBaseExpressions[bankIndex]} + (${bank.startChar} * 8)\n`;
          asm += `    ld bc, ${bank.byteCount}\n`;
          asm += `    call FAST_LDIRVM\n`;
          asm += `${mapperPop}    ret\n\n`;
        }
      }
    });

    asm += `${getScreen2TileBankColorLoaderLabel(runtime.tileBankId)}:\n`;
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
      const colorBytes = generateTileColorBytes(tile);
      const bytesHex = colorBytes ?
        Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
        ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0'];
      return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)\n    db ${bytesHex.join(', ')}\n`;
    }).join('');
  } else {
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

COLOR_DATA_BANK EQU ${buildMapperBankEqu('tile_color_bank0', mapperWindow)}

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
    ld a, (vram_cache_tile_colors_ready)
    or a
    ret nz
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ld a, 1
    ld (vram_cache_tile_colors_ready), a
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
export function getColorsBank4Data(analysis: ProjectAnalysis): string {
  if (!analysis.tiles || analysis.tiles.length === 0) {
    return '; [colors bank4 data: no tiles]\n';
  }

  const formatBytes = (bytes: number[]): string => {
    if (bytes.length === 0) return '    db #00\n';
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
    const colorBytes = generateTileColorBytes(tile);
    const bytesHex = colorBytes ?
      Array.from(colorBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`) :
      ['#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0', '#F0'];
    return `    ; Tile ${index}: ${tile.name} colors (fg/bg pairs)\n    db ${bytesHex.join(', ')}\n`;
  }).join('');

  // Build tilebank shared color data blocks
  const referencedTileBanks = buildReferencedScreen2TileBanks(analysis);
  const sharedColorDataBySignature = new Map<string, string>();
  let nextSharedColorDataIndex = 0;
  const sharedBlocks: string[] = [];

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
