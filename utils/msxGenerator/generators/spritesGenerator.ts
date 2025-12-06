/**
 * @fileoverview Sprites Generator - Sprite pattern and animation data
 * Generates sprites.asm with sprite definitions and management functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateSpriteASMCode } from '../../../components/utils/spriteUtils';
import { analyzeComponentUsage } from '../utils/componentAnalyzer';
import { MSX1_PALETTE } from '../../../constants';

// Constants
const SPRITE_INVISIBLE_VALUE = 224; // MSX: Y >= 209 hides sprite, but 224 is safer off-screen
const DEFAULT_DATA_FORMAT = 'hex';

/**
 * Generate sprite data file (sprites.asm)
 *
 * @param analysis - Project analysis with sprite assets
 * @returns ASM code string with sprite data and functions
 */
export function generateSpritesFile(analysis: ProjectAnalysis): string {
  const sprites = analysis.sprites || [];

  console.log('🎨 generateSpritesFile() called:');
  console.log(`  - analysis.sprites.length: ${sprites.length}`);
  console.log(`  - analysis.entities.length: ${analysis.entities?.length || 0}`);
  console.log(`  - analysis.templates.length: ${analysis.templates?.length || 0}`);

  // INTELLIGENT SPRITE MAPPING & MULTI-LAYER SUPPORT
  const { activeEntities } = analyzeComponentUsage(analysis);

  console.log(`  - activeEntities.length: ${activeEntities.length}`);

  // Helper to get MSX1 color index from hex
  const hexToMSX1Index = (hex: string): number => {
    if (!hex) return 0;
    const color = MSX1_PALETTE.find(c => c.hex.toUpperCase() === hex.toUpperCase());
    return color ? color.index : 15; // Default to White
  };

  // Helper to analyze sprite layers/colors
  const getSpriteLayerColors = (sprite: any): number[] => {
    if (!sprite || !sprite.frames || sprite.frames.length === 0) return [15]; // Default white

    const uniqueColors = new Set<number>();
    const frameData = sprite.frames[0].data; // Use first frame for analysis

    if (frameData) {
      frameData.forEach((row: string[]) => {
        row.forEach((hex: string) => {
          const index = hexToMSX1Index(hex);
          // Ignore transparent (0) and assume background color is transparent for sprites
          if (index !== 0) {
            uniqueColors.add(index);
          }
        });
      });
    }

    // Sort colors to match likely layer order (usually palette order)
    // If no colors found (empty sprite), return at least one color (white)
    if (uniqueColors.size === 0) return [15];

    return Array.from(uniqueColors).sort((a, b) => a - b);
  };

  const resolveSpriteIdFromProps = (props: any): string | undefined => {
    return props?.spriteId || props?.spriteAssetId || props?.sprite || props?.spriteName;
  };

  const getEntitySpriteInfo = (entity: any): { spriteAssetIndex: number; spriteName: string; colors: number[] } | null => {
    const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
    if (!template) return null;

    const spriteComp = template.components?.find((c: any) =>
      c.definitionId === 'comp_sprite' || c.definitionId === 'comp_render'
    );

    // FALLBACK: If template lacks explicit sprite component, try matching sprite assets by name
    if (!spriteComp) {
      const entityName = (entity.name || '').toLowerCase();
      const templateName = (template.name || '').toLowerCase();
      const matchedIndexByName = sprites.findIndex(s => {
        const n = (s.name || '').toLowerCase();
        return n && (entityName.includes(n) || templateName.includes(n));
      });

      // Extra heuristics: common keywords
      const keywordMatch = (keyword: string) =>
        sprites.findIndex(s => (s.name || '').toLowerCase().includes(keyword));

      const matchedIndex =
        matchedIndexByName >= 0
          ? matchedIndexByName
          : entityName.includes('hero')
          ? keywordMatch('hero')
          : entityName.includes('player')
          ? keywordMatch('hero')
          : entityName.includes('coin')
          ? keywordMatch('coin')
          : templateName.includes('hero')
          ? keywordMatch('hero')
          : templateName.includes('player')
          ? keywordMatch('hero')
          : templateName.includes('coin')
          ? keywordMatch('coin')
          : -1;

      if (matchedIndex >= 0) {
        return {
          spriteAssetIndex: matchedIndex,
          spriteName: sprites[matchedIndex].name,
          colors: getSpriteLayerColors(sprites[matchedIndex])
        };
      }

      // Last resort: if we have sprites, assign the first one so entities are not placeholders
      if (sprites.length > 0) {
        return {
          spriteAssetIndex: 0,
          spriteName: sprites[0].name,
          colors: getSpriteLayerColors(sprites[0])
        };
      }

      return null;
    }

    const defaults = spriteComp.defaultValues || {};
    const overrides = entity.componentOverrides?.['comp_sprite'] || entity.componentOverrides?.['comp_render'] || {};
    const finalProps = { ...defaults, ...overrides };
    const spriteId = resolveSpriteIdFromProps(finalProps);

    if (!spriteId) {
      // No spriteId but has comp_render: force placeholder so it's treated as sprite
      return {
        spriteAssetIndex: -1,
        spriteName: `PLACEHOLDER_${entity.name}`,
        colors: [15]
      };
    }

    const foundIndex = sprites.findIndex(s => s.id === spriteId || s.name === spriteId);

    // IMPORTANT FIX: If sprite not found in assets but template has comp_render,
    // return placeholder info instead of null. This allows entities with placeholders
    // to be rendered with a default sprite (white square)
    if (foundIndex < 0) {
      // Return placeholder sprite info
      return {
        spriteAssetIndex: -1, // Special index for placeholder
        spriteName: `PLACEHOLDER_${entity.name}`,
        colors: [15] // White color for visibility
      };
    }

    return {
      spriteAssetIndex: foundIndex,
      spriteName: sprites[foundIndex].name,
      colors: getSpriteLayerColors(sprites[foundIndex])
    };
  };

  // Phase 1: Analyze allocation
  // Map each active entity to a set of hardware sprites (layers)
  interface EntitySpriteAllocation {
    entityIndex: number;
    spriteName: string;
    spriteAssetIndex: number;
    baseHwSpriteIndex: number;
    layerCount: number;
    colors: number[];
  }

  const entityAllocations: EntitySpriteAllocation[] = [];
  let currentHwSpriteIndex = 0;

  activeEntities.forEach((entity, entityIndex) => {
    const spriteInfo = getEntitySpriteInfo(entity);

    if (!spriteInfo) {
      // Fallback: ensure every active entity gets at least a placeholder sprite
      entityAllocations.push({
        entityIndex,
        spriteName: 'PLACEHOLDER',
        spriteAssetIndex: -1,
        baseHwSpriteIndex: currentHwSpriteIndex,
        layerCount: 1,
        colors: [15] // White placeholder
      });
      currentHwSpriteIndex += 1;
      return;
    }

    entityAllocations.push({
      entityIndex,
      spriteName: spriteInfo.spriteName,
      spriteAssetIndex: spriteInfo.spriteAssetIndex,
      baseHwSpriteIndex: currentHwSpriteIndex,
      layerCount: spriteInfo.colors.length,
      colors: spriteInfo.colors
    });

    currentHwSpriteIndex += spriteInfo.colors.length;
  });

  // Always reserve full hardware sprite table (32) to keep attributes/LDIRVM in sync
  const totalHardwareSprites = 32;

  // Phase 2: Generate Code
  let code = `; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${activeEntities.length}
; Total Hardware Sprites (Layers): ${totalHardwareSprites}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;

  // Generate sprite patterns (for all sprite assets)
  sprites.forEach((sprite, index) => {
    const suffix = `_${index}`;
    const uniqueName = sprite.name + suffix;
    const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    const spriteASM = generateSpriteASMCode(sprite, DEFAULT_DATA_FORMAT, index);

    // Find first valid layer label
    let firstLayerFound = -1;
    for (let layerIndex = 0; layerIndex < 4; layerIndex++) {
      if (spriteASM.includes(`${safeSpriteName}_F0_LAYER${layerIndex}:`)) {
        firstLayerFound = layerIndex;
        break;
      }
    }

    code += `\n; Sprite Asset ${index}: ${sprite.name}\n${spriteASM}`;

    if (firstLayerFound >= 0) {
      code += `\n; Unified pattern label for sprite ${index}
SPRITE_${index}_PATTERN EQU ${safeSpriteName}_F0_LAYER${firstLayerFound}\n`;
    } else {
      code += `\n; WARNING: No valid pattern layers found for sprite ${index}
SPRITE_${index}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0\n`;
    }
  });

  // Generate placeholder sprite pattern (white 16x16 square for missing sprites)
  code += `
; ==================================================================
; PLACEHOLDER SPRITE PATTERN (for entities with missing sprite assets)
; ==================================================================
; 16x16 white square sprite (solid fill)
SPRITE_PLACEHOLDER_PATTERN:
    ; Top half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Bottom half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half top (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half bottom (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF

`;

  if (sprites.length === 0) {
    code += `; No sprite assets found - using placeholder pattern only
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN\n`;
  }

  code += `
; ==================================================================
; SPRITE CONFIGURATION TABLES
; ==================================================================

; Table: Entity Sprite Configuration
; Format: db base_hw_sprite_index, layer_count
entity_sprite_config:
`;
  entityAllocations.forEach(alloc => {
    const baseIndex = alloc.baseHwSpriteIndex >= 0 ? alloc.baseHwSpriteIndex : 0;
    code += `    db ${baseIndex}, ${alloc.layerCount} ; Entity ${alloc.entityIndex} (${alloc.spriteName})\n`;
  });
  // Fill for remaining entities (if any mismatch)
  if (entityAllocations.length < 32) {
    code += `    ds ${(32 - entityAllocations.length) * 2}, 0 ; Padding\n`;
  }

  code += `
; Table: Hardware Sprite Layer Colors
; Format: db color_index
sprite_layer_colors:
`;
  let colorsWritten = 0;
  entityAllocations.forEach(alloc => {
    if (alloc.layerCount > 0) {
      code += `    ; Entity ${alloc.entityIndex} (${alloc.spriteName}) layers:\n`;
      alloc.colors.forEach((color, i) => {
        code += `    db ${color} ; Layer ${i}\n`;
        colorsWritten += 1;
      });
    }
  });
  // Padding
  const remainingColors = totalHardwareSprites - colorsWritten;
  if (remainingColors > 0) {
    code += `    ds ${remainingColors}, 0 ; Padding\n`;
  }

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
    ; Load patterns for all active entities
`;

  let patternsGenerated = false;
  entityAllocations.forEach(alloc => {
    if (alloc.layerCount === 0) {
      return; // Skip entities with no sprite layers
    }

    // Use placeholder pattern for entities with missing sprite assets
    const patternLabel = alloc.spriteAssetIndex < 0
      ? 'SPRITE_PLACEHOLDER_PATTERN'
      : `SPRITE_${alloc.spriteAssetIndex}_PATTERN`;

    code += `    ; Entity ${alloc.entityIndex}: ${alloc.spriteName} (${alloc.layerCount} layers)
    ; Base HW Sprite: ${alloc.baseHwSpriteIndex}
    ld hl, ${patternLabel}
    ld de, SPRPAT + (${alloc.baseHwSpriteIndex} * 32)
    ld bc, ${alloc.layerCount * 32} ; Load ${alloc.layerCount} layers (32 bytes each)
    call LDIRVM
`;

    patternsGenerated = true;
  });

  if (!patternsGenerated) {
    if (sprites.length === 0) {
      code += `    ; No sprites to load
`;
    } else {
      code += `    ; No active entities detected, load all sprite assets sequentially
`;
      let fallbackPatternIndex = 0;
      sprites.forEach((sprite, index) => {
        const layerCount = getSpriteLayerColors(sprite).length || 1;
        const frameCount = sprite.frames?.length || 1;
        const bytesToCopy = layerCount * frameCount * 32; // 32 bytes per 16x16 layer per frame

        code += `    ; Sprite Asset ${index}: ${sprite.name} (${frameCount} frames, ${layerCount} layers)
    ld hl, SPRITE_${index}_PATTERN
    ld de, SPRPAT + (${fallbackPatternIndex} * 32)
    ld bc, ${bytesToCopy}
    call LDIRVM
`;

        fallbackPatternIndex += layerCount * frameCount;
      });
    }
  }

  code += `    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: If Y=209 (invisible), force it to visible (e.g. 100)
    push af
    ld a, c
    cp 209
    jr nz, .y_ok
    ld c, 100       ; Force visible Y
.y_ok:
    pop af

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
    ld b, ${totalHardwareSprites + 4} ; Clear a bit more for safety
.clear_loop:
    ld (hl), SPRITE_INVISIBLE
    ld de, 4
    add hl, de
    djnz .clear_loop
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
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
    ld bc, ${totalHardwareSprites * 4}  ; 4 bytes per sprite
    call LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${SPRITE_INVISIBLE_VALUE}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${totalHardwareSprites * 4}
; active_sprite_count: db 0
`;

  return code;
}
