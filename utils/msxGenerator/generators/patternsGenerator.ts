/**
 * @fileoverview Patterns Generator - Tile pattern data
 * Generates patterns.asm with tile pattern definitions for MSX Screen 2
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateTilePatternBytes } from '../../../components/utils/tileUtils';

/**
 * Generate pattern data file (patterns.asm)
 *
 * @param analysis - Project analysis with tile assets
 * @returns ASM code string with pattern data and loading functions
 */
export function generatePatternsFile(analysis: ProjectAnalysis): string {
  if (!analysis.tiles || analysis.tiles.length === 0) {
    return `; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;
  }

  return `; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${analysis.tiles?.length || 0} tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${analysis.tiles.map((tile, index) => {
    // Generate actual pattern bytes using the same function as MSX Main Generator
    const patternBytes = generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)');

    // Calculate how many 8x8 MSX characters this tile needs (dynamic sizing)
    const charsWide = Math.ceil(tile.width / 8);   // e.g., 24px = 3 chars wide
    const charsHigh = Math.ceil(tile.height / 8);  // e.g., 16px = 2 chars high
    const totalChars = charsWide * charsHigh;      // e.g., 3×2 = 6 MSX characters
    const totalBytes = totalChars * 8;             // Each MSX char = 8 bytes

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
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
    const charsWide = Math.ceil(tile.width / 8);
    const charsHigh = Math.ceil(tile.height / 8);
    return total + (charsWide * charsHigh * 8);
  }, 0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
    const charsWide = Math.ceil(tile.width / 8);
    const charsHigh = Math.ceil(tile.height / 8);
    return total + (charsWide * charsHigh * 8);
  }, 0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${analysis.tiles.reduce((total, tile) => {
    const charsWide = Math.ceil(tile.width / 8);
    const charsHigh = Math.ceil(tile.height / 8);
    return total + (charsWide * charsHigh * 8);
  }, 0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ret

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`;
}
