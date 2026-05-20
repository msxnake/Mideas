/**
 * @fileoverview Patterns Generator - Tile pattern data
 * Generates patterns.asm with tile pattern definitions for MSX Screen 2
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateTilePatternBytes } from '../../../components/utils/tileUtils';
import {
  buildReferencedScreen2TileBanks,
  getScreen2TileBankIdLabel,
  getScreen2TileBankPatternLoaderLabel,
} from '../utils/screen2TileBanks';
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

const BASE_SCREEN2_DYNAMIC_CHAR_CAPACITY = 126; // chars 128-253; chars 254/255 are reserved

function collectBasePatternEntries(analysis: ProjectAnalysis) {
  const entries: Array<{
    tile: any;
    index: number;
    charsWide: number;
    charsHigh: number;
    totalChars: number;
    patternBytes: Uint8Array | number[];
  }> = [];
  let usedChars = 0;

  (analysis.tiles || []).forEach((tile: any, index: number) => {
    const charsWide = Math.ceil(tile.width / 8);
    const charsHigh = Math.ceil(tile.height / 8);
    const totalChars = charsWide * charsHigh;

    if (usedChars + totalChars > BASE_SCREEN2_DYNAMIC_CHAR_CAPACITY) {
      console.warn(`Skipping base SCREEN 2 pattern load for ${tile.name || tile.id}: chars 254/255 are reserved`);
      return;
    }

    entries.push({
      tile,
      index,
      charsWide,
      charsHigh,
      totalChars,
      patternBytes: generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)'),
    });
    usedChars += totalChars;
  });

  return entries;
}

/**
 * Generate pattern data file (patterns.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @param romMode - ROM mode string
 * @param dataInBank4 - When true, data tables are emitted in bank4 section (org #C000+).
 *                      Load functions and EQU constants remain here.
 * @returns ASM code string with pattern data and loading functions
 */
export function generatePatternsFile(
  analysis: ProjectAnalysis,
  romMode: string = 'simple32k',
  dataInBank4: boolean = false,
  targetFormat: MapperTargetFormat = 'konami'
): string {
  if (!analysis.tiles || analysis.tiles.length === 0) {
    return `; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No SCREEN 2 tiles detected in project. Keep the public loader labels
; available because shared GameFlow/transition code can reference them in
; MSX2-only projects.
SCREEN2_TILEBANK_INVALID EQU #FF

load_pattern_bank0:
    ret

load_pattern_bank1:
    ret

load_pattern_bank2:
    ret

load_patterns_to_vram:
    ret
`;
  }

  const usesMapper = usesMapperBanking(romMode);
  const useResourceManager = romMode === 'megarom';
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const mapperPush = usesMapper ? buildMapperDataPushAsm('PATTERN_DATA_BANK', mapperWindow) : '';
  const mapperPop  = usesMapper ? buildMapperDataPopAsm(mapperWindow) : '';
  // Window-relative HL formula is mapper-specific (Konami: A000h/P3).
  // For overflow banks (#C000+) it maps labels to the configured data window.
  const dataHl = (label: string) => usesMapper ? buildMapperWindowedAddress(label, mapperWindow) : label;
  const referencedTileBanks = buildReferencedScreen2TileBanks(analysis);
  const bankBaseExpressions = ['CHRTBL2', 'CHRTBL2 + #800', 'CHRTBL2 + #1000'];
  const patternDataResourceId = buildResourceIdLabelFromAsmLabel('tile_pattern_bank0');
  const basePatternEntries = collectBasePatternEntries(analysis);
  const tileBankIdSection = referencedTileBanks.length > 0
    ? `SCREEN2_TILEBANK_INVALID EQU #FF\n${referencedTileBanks.map((runtime, index) => `${getScreen2TileBankIdLabel(runtime.tileBankId)} EQU ${index}`).join('\n')}\n\n`
    : `SCREEN2_TILEBANK_INVALID EQU #FF\n\n`;

  const formatBytes = (bytes: number[]): string => {
    if (bytes.length === 0) return '    db #00\n';
    let asm = '';
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16).map((b) => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
      asm += `    db ${chunk.join(', ')}\n`;
    }
    return asm;
  };

  const sharedPatternDataBySignature = new Map<string, string>();
  const sharedPatternDataBlocks: string[] = [];
  let nextSharedPatternDataIndex = 0;

  const buildTileBankPatternClearAsm = (bank: any, bankIndex: number): string => {
    if (!bank || bank.byteCount <= 0) return '';
    return `    ; Clear the full pattern bank first so reserved/stale chars
    ; from presentation/dialog tilebanks cannot leak through unused chars.
    xor a
    ld hl, ${bankBaseExpressions[bankIndex]}
    ld bc, 2048
    call FAST_FILLVRM
`;
  };

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
        sharedPatternDataBlocks.push(`${dataLabel}:\n${formatBytes(bank.patternBytes)}\n`);
      }

      if (bank.byteCount > 0) {
        const dataResourceId = buildResourceIdLabelFromAsmLabel(dataLabel);
        asm += `${runtime.labelBase}_load_pattern_bank${bankIndex}:\n`;
        asm += buildTileBankPatternClearAsm(bank, bankIndex);
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

    asm += `${getScreen2TileBankPatternLoaderLabel(runtime.tileBankId)}:\n`;
    runtime.banks.forEach((bank, bankIndex) => {
      if (bank.byteCount > 0) {
        asm += `    call ${runtime.labelBase}_load_pattern_bank${bankIndex}\n`;
      }
    });
    asm += `    ret\n\n`;

    return asm;
  }).join('');

  const totalPatternBytes = basePatternEntries.reduce((total, entry) => total + (entry.totalChars * 8), 0);

  // Build the data section (tile_pattern_bank0 + tilebank shared data)
  let dataSection = '';
  if (!dataInBank4) {
    dataSection += `; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:\n`;
    dataSection += basePatternEntries.map(({ tile, index, charsWide, charsHigh, totalChars, patternBytes }) => {
      if (tile.width % 8 !== 0 || tile.height % 8 !== 0) {
        console.warn(`Tile ${tile.name} size ${tile.width}x${tile.height} is not multiple of 8px - may cause visual artifacts`);
      }

      const bytesHex = Array.from(patternBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);

      let charBreakdown = '';
      if (totalChars > 1) {
        charBreakdown = `\n    ; Character layout: ${charsWide}x${charsHigh} grid`;
        for (let row = 0; row < charsHigh; row++) {
          charBreakdown += `\n    ; Row ${row}: `;
          for (let col = 0; col < charsWide; col++) {
            const charIndex = row * charsWide + col;
            charBreakdown += `Char${charIndex} `;
          }
        }
      }

      return `    ; Tile ${index}: ${tile.name} (${tile.width}x${tile.height}px = ${charsWide}x${charsHigh} chars = ${totalChars} MSX characters)${charBreakdown}\n    db ${bytesHex.join(', ')}\n`;
    }).join('');
  } else {
    dataSection = `; PATTERN_DATA_ROM_DATA_GROUP: bank4\n; (tile_pattern_bank0 and tilebank data are emitted in bank4 section, org #C000+)\n`;
  }

  // Tilebank shared data blocks - only inline if not bank4
  const tilebankDataSection = dataInBank4
    ? `; [tilebank_pattern_data_* emitted in bank4 section]\n`
    : sharedPatternDataBlocks.join('');

  return `; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${analysis.tiles?.length || 0} tiles detected
; ==================================================================

PATTERN_DATA_BANK EQU ${buildMapperBankEqu('tile_pattern_bank0', mapperWindow)}
${tileBankIdSection}

${dataSection}
; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
${useResourceManager ? `    ld a, ${patternDataResourceId}
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    call resource_load_to_vram_by_id
    ret` : `${mapperPush}    ld hl, ${dataHl('tile_pattern_bank0')}
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${totalPatternBytes}    ; Base tile bytes capped to chars 128-253
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret`}

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${useResourceManager ? `    ld a, ${patternDataResourceId}
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    call resource_load_to_vram_by_id
    ret` : `${mapperPush}    ld hl, ${dataHl('tile_pattern_bank0')}     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${totalPatternBytes}    ; Base tile bytes capped to chars 128-253
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret`}

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${useResourceManager ? `    ld a, ${patternDataResourceId}
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    call resource_load_to_vram_by_id
    ret` : `${mapperPush}    ld hl, ${dataHl('tile_pattern_bank0')}     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${totalPatternBytes}    ; Base tile bytes capped to chars 128-253
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${mapperPop}    ret`}

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    ld a, (vram_cache_tile_patterns_ready)
    or a
    ret nz
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ld a, 1
    ld (vram_cache_tile_patterns_ready), a
    ret

${tileBankRuntimeAsm}${tilebankDataSection}
; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`;
}

/**
 * Returns only the data tables for bank4 placement (megarom mode).
 * Includes tile_pattern_bank0 bytes and tilebank_pattern_data_* bytes.
 * No load functions or EQU constants (those stay in the code section via generatePatternsFile).
 */
export function getPatternsBank4Data(analysis: ProjectAnalysis): string {
  if (!analysis.tiles || analysis.tiles.length === 0) {
    return '; [patterns bank4 data: no tiles]\n';
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
; TILE PATTERN BANK 0 (Base patterns) - bank4 data
; ==================================================================
tile_pattern_bank0:\n`;

  asm += collectBasePatternEntries(analysis).map(({ tile, index, totalChars, patternBytes }) => {
    const bytesHex = Array.from(patternBytes).map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`);
    return `    ; Tile ${index}: ${tile.name} (${tile.width}x${tile.height}px = ${totalChars} MSX characters)\n    db ${bytesHex.join(', ')}\n`;
  }).join('');

  // Build tilebank shared data blocks
  const referencedTileBanks = buildReferencedScreen2TileBanks(analysis);
  const sharedPatternDataBySignature = new Map<string, string>();
  let nextSharedPatternDataIndex = 0;
  const sharedBlocks: string[] = [];

  referencedTileBanks.forEach((runtime) => {
    runtime.banks.forEach((bank) => {
      const dataSignature = `${bank.startChar}|${bank.byteCount}|${bank.patternBytes.join(',')}`;
      if (!sharedPatternDataBySignature.has(dataSignature)) {
        const dataLabel = `tilebank_pattern_data_${nextSharedPatternDataIndex++}`;
        sharedPatternDataBySignature.set(dataSignature, dataLabel);
        sharedBlocks.push(`${dataLabel}:\n${formatBytes(bank.patternBytes)}\n`);
      }
    });
  });

  if (sharedBlocks.length > 0) {
    asm += `\n; Tilebank pattern data blocks\n`;
    asm += sharedBlocks.join('');
  }

  return asm;
}
