/**
 * @fileoverview Sprites Generator - Sprite pattern and animation data
 * Generates sprites.asm with sprite definitions and management functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateSpriteASMCode } from '../../../components/utils/spriteUtils';

// Constants
const SPRITE_INVISIBLE_VALUE = 209; // MSX: Y >= 209 hides sprite
const DEFAULT_DATA_FORMAT = 'hex';

/**
 * Generate sprite data file (sprites.asm)
 *
 * @param analysis - Project analysis with sprite assets
 * @returns ASM code string with sprite data and functions
 */
export function generateSpritesFile(analysis: ProjectAnalysis): string {
  const sprites = analysis.sprites || [];
  const spriteCount = sprites.length;

  if (spriteCount === 0) {
    return `; ==================================================================
; SPRITE DATA (EMPTY - NO SPRITES DETECTED)
; File: sprites.asm
; ==================================================================

; No sprites detected in project - placeholder file generated.

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${SPRITE_INVISIBLE_VALUE}

; ==================================================================
; SPRITE UTILITY FUNCTIONS
; ==================================================================

clear_all_sprites:
    ret     ; No sprites to clear

hide_sprite:
    ret     ; No sprites to hide

update_sprites_to_vram:
    ret     ; No sprite attributes to update

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`;
  }

  let code = `; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; ${spriteCount} sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;

  // Generate sprite patterns
  sprites.forEach((sprite, index) => {
    const safeSpriteName = sprite.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    const spriteASM = generateSpriteASMCode(sprite, DEFAULT_DATA_FORMAT);

    // Find first valid layer in the generated ASM to expose a unified label
    let firstLayerFound = -1;
    for (let layerIndex = 0; layerIndex < 4; layerIndex++) {
      if (spriteASM.includes(`${safeSpriteName}_F0_LAYER${layerIndex}:`)) {
        firstLayerFound = layerIndex;
        break;
      }
    }

    code += `\n; Sprite ${index}: ${sprite.name}\n${spriteASM}`;

    if (firstLayerFound >= 0) {
      code += `\n; Unified pattern label for sprite ${index}
SPRITE_${index}_PATTERN EQU ${safeSpriteName}_F0_LAYER${firstLayerFound}\n`;
    } else {
      code += `\n; WARNING: No valid pattern layers found for sprite ${index}: ${sprite.name}
SPRITE_${index}_PATTERN:
    db 0, 0, 0, 0, 0, 0, 0, 0  ; Placeholder pattern (8 bytes)
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0  ; Total 32 bytes for 16x16 sprite\n`;
    }
  });

  code += `
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    call clear_all_sprites
    call load_sprite_patterns
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
`;

  // Load each sprite pattern to VRAM
  for (let i = 0; i < spriteCount; i++) {
    const name = sprites[i].name;
    code += `    ; Load sprite ${i}: ${name}
    ld hl, SPRITE_${i}_PATTERN
    ld de, SPRPAT + (${i} * 32)
    ld bc, 32
    call LDIRVM
`;
  }

  code += `    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:


    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4

    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

 
    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, ${spriteCount}
.clear_loop:
    ld (hl), SPRITE_INVISIBLE
    ld de, 4
    add hl, de
    djnz .clear_loop
    ret

; Hide specific sprite (A = sprite index)
hide_sprite:
    ; Calculate address: sprite_attributes + (index * 4)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, ${spriteCount * 4}  ; 4 bytes per sprite
    call LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${SPRITE_INVISIBLE_VALUE}
`;

  // Sprite ID constants
  sprites.forEach((sprite, index) => {
    const idName = sprite.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    code += `SPRITE_ID_${idName}    EQU ${index}      ; ${sprite.name}\n`;
  });

  code += `
; ==================================================================
; RAM REQUIREMENTS (define this in your main RAM section)
; ==================================================================
; sprite_attributes: ds ${spriteCount * 4}  ; Interleaved buffer: Y, X, Pattern, Color
; active_sprite_count: db 0
;
; Total: ${spriteCount * 4 + 1} bytes of RAM

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`;

  return code;
}
