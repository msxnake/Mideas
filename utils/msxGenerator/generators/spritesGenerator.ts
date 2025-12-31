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
 * Mirror pixel data horizontally (same logic as GameFlowPreviewModal)
 * @param pixelData - 2D array of pixel color hex values
 * @returns Horizontally mirrored pixel data
 */
const mirrorPixelDataHorizontally = (pixelData: string[][]): string[][] => {
  return pixelData.map(row => [...row].reverse());
};

/**
 * Find the first palette layer that has actual pixel data in a sprite frame.
 * This must match the logic in spriteUtils.ts which skips empty layers.
 * @param sprite - Sprite object with frames and palette
 * @returns Index of first layer with data, or -1 if none found
 */
const findFirstDrawableLayerIndex = (sprite: any): number => {
  const palette: string[] = sprite.spritePalette || [];
  const bg: string | undefined = sprite.backgroundColor;
  const frame0 = sprite.frames?.[0];

  if (!frame0?.data) return -1;

  for (let layerIdx = 0; layerIdx < palette.length; layerIdx++) {
    const layerColor = palette[layerIdx];
    // Skip background color
    if (layerColor === bg) continue;

    // Check if any pixel uses this color
    for (let y = 0; y < (frame0.data.length || 0); y++) {
      for (let x = 0; x < (frame0.data[y]?.length || 0); x++) {
        if (frame0.data[y][x] === layerColor) {
          return layerIdx; // Found a pixel with this color
        }
      }
    }
  }

  return -1; // No drawable layer found
};

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
    if (!sprite) return [15]; // Default white

    // IMPORTANT: Use the sprite palette, not per-frame pixel usage.
    // We need a stable layer layout across all frames so runtime animation can
    // copy complete frames reliably.
    const palette: string[] = sprite.spritePalette || [];
    const bg: string | undefined = sprite.backgroundColor;

    const colors: number[] = [];
    const seen = new Set<number>();

    for (const hex of palette) {
      if (!hex) continue;
      if (bg && hex === bg) continue;

      const msxIndex = hexToMSX1Index(hex);
      if (seen.has(msxIndex)) continue;
      seen.add(msxIndex);
      colors.push(msxIndex);
    }

    return colors.length > 0 ? colors : [15];
  };

  const resolveSpriteIdFromProps = (props: any): string | undefined => {
    return props?.spriteId || props?.spriteAssetId || props?.sprite || props?.spriteName;
  };

  const getEntitySpriteInfo = (entity: any): { spriteAssetIndex: number; spriteName: string; colors: number[] } | null => {
    console.log(`\n🔍 getEntitySpriteInfo for entity: "${entity.name}" (template: ${entity.entityTemplateId})`);
    console.log(`   Available sprites: ${sprites.map(s => `"${s.name}" (${s.id})`).join(', ') || 'NONE'}`);

    const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
    if (!template) {
      console.log(`   ❌ Template not found!`);
      return null;
    }
    console.log(`   Template found: "${template.name}"`);
    console.log(`   Template components: ${template.components?.map((c: any) => c.definitionId).join(', ') || 'NONE'}`);

    // Use the same logic as GameFlowPreviewModal.tsx:
    // 1. First check componentOverrides for sprite_ref properties
    // 2. Then check template.components defaultValues for sprite_ref properties

    const componentDefinitions = analysis.components || [];
    let spriteAssetId: string | undefined;

    // Step 1: Check entity instance overrides first
    if (entity.componentOverrides) {
      for (const compId in entity.componentOverrides) {
        const compDef = componentDefinitions.find((c: any) => c.id === compId);
        const spriteProp = compDef?.properties?.find((p: any) => p.type === 'sprite_ref');
        if (spriteProp && entity.componentOverrides[compId]?.[spriteProp.name]) {
          spriteAssetId = entity.componentOverrides[compId][spriteProp.name];
          console.log(`   ✅ Found spriteAssetId in overrides: "${spriteAssetId}"`);
          break;
        }
      }
    }

    // Step 2: If not found in overrides, check template component defaults
    if (!spriteAssetId) {
      for (const comp of template.components || []) {
        const compDef = componentDefinitions.find((c: any) => c.id === comp.definitionId);
        const spriteProp = compDef?.properties?.find((p: any) => p.type === 'sprite_ref');
        if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
          spriteAssetId = comp.defaultValues[spriteProp.name];
          console.log(`   ✅ Found spriteAssetId in template defaults: "${spriteAssetId}"`);
          break;
        }
      }
    }

    console.log(`   Resolved spriteAssetId: "${spriteAssetId || 'undefined'}"`);

    // If no spriteAssetId found, entity has no sprite configured
    if (!spriteAssetId) {
      console.log(`   ⚠️ No sprite_ref property found in any component`);
      // Fallback: use first available sprite if any exist
      if (sprites.length > 0) {
        console.log(`   ⚠️ Defaulting to first sprite "${sprites[0].name}"`);
        return {
          spriteAssetIndex: 0,
          spriteName: sprites[0].name,
          colors: getSpriteLayerColors(sprites[0])
        };
      }
      return null;
    }

    // Find sprite by ID
    let foundIndex = sprites.findIndex(s => s.id === spriteAssetId);

    // If not found by ID, try by name
    if (foundIndex < 0) {
      foundIndex = sprites.findIndex(s => s.name === spriteAssetId);
    }

    // If still not found, try partial name match
    if (foundIndex < 0) {
      const spriteIdLower = spriteAssetId.toLowerCase();
      foundIndex = sprites.findIndex(s =>
        s.name?.toLowerCase().includes(spriteIdLower) ||
        spriteIdLower.includes(s.name?.toLowerCase() || '')
      );
    }

    if (foundIndex >= 0) {
      console.log(`   ✅ Found sprite "${sprites[foundIndex].name}" at index ${foundIndex}`);
      return {
        spriteAssetIndex: foundIndex,
        spriteName: sprites[foundIndex].name,
        colors: getSpriteLayerColors(sprites[foundIndex])
      };
    }

    // Sprite ID specified but not found in assets
    console.log(`   ❌ Sprite "${spriteAssetId}" not found in project assets`);
    return {
      spriteAssetIndex: -1,
      spriteName: `MISSING_${spriteAssetId}`,
      colors: [15] // White placeholder
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

    // Find first layer that actually has pixel data
    const firstDrawableLayerIndex = findFirstDrawableLayerIndex(sprite);

    code += `\n; Sprite Asset ${index}: ${sprite.name}\n${spriteASM}`;

    if (firstDrawableLayerIndex >= 0) {
      code += `\n; Unified pattern label for sprite ${index}
SPRITE_${index}_PATTERN EQU ${safeSpriteName}_F0_LAYER${firstDrawableLayerIndex}\n`;
    } else {
      code += `\n; WARNING: No valid pattern layers found for sprite ${index}
SPRITE_${index}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0\n`;
    }

    // AUTO-GENERATE MIRRORED VERSION for sprites facing left/right
    // (Same behavior as GameFlowPreviewModal.tsx)
    const facingDirection = (sprite as any).facingDirection;
    if (facingDirection === 'left' || facingDirection === 'right') {
      code += `\n; Auto-generated mirrored version for ${sprite.name} (facing: ${facingDirection})\n`;

      // Create mirrored sprite by reversing pixel data horizontally in each frame
      const mirroredSprite = {
        ...sprite,
        name: `${sprite.name}_MIRRORED`,
        frames: sprite.frames.map((frame: any) => ({
          ...frame,
          data: mirrorPixelDataHorizontally(frame.data)
        }))
      };

      // Generate ASM for mirrored sprite (use same index to keep pattern names consistent)
      const mirroredASM = generateSpriteASMCode(mirroredSprite, DEFAULT_DATA_FORMAT, index);
      const mirroredSuffix = `_${index}`;
      const mirroredUniqueName = mirroredSprite.name + mirroredSuffix;
      const safeMirroredName = mirroredUniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

      code += mirroredASM;

      if (firstDrawableLayerIndex >= 0) {
        code += `\n; Unified pattern label for mirrored sprite ${index}
SPRITE_${index}_PATTERN_MIRRORED EQU ${safeMirroredName}_F0_LAYER${firstDrawableLayerIndex}\n`;
      }
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

  // Sprite animation metadata tables
  code += `
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`;
  sprites.forEach((sprite, index) => {
    const frames = sprite.frames?.length || 1;
    code += `    db ${frames} ; Sprite ${index}: ${sprite.name}\n`;
  });
  if (sprites.length === 0) {
    code += `    db 1 ; Placeholder\n`;
  }

  code += `
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`;
  sprites.forEach((_sprite, index) => {
    code += `    dw SPRITE_${index}_FRAME_PTRS\n`;
  });
  if (sprites.length === 0) {
    code += `    dw SPRITE_0_FRAME_PTRS\n`;
  }

  sprites.forEach((sprite, index) => {
    const suffix = `_${index}`;
    const uniqueName = sprite.name + suffix;
    const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    const firstDrawableLayerIndex = findFirstDrawableLayerIndex(sprite);
    const frames = sprite.frames?.length || 1;

    code += `
; Sprite ${index}: ${sprite.name} frame pointers
SPRITE_${index}_FRAME_PTRS:
`;
    for (let f = 0; f < frames; f++) {
      if (firstDrawableLayerIndex >= 0) {
        code += `    dw ${safeSpriteName}_F${f}_LAYER${firstDrawableLayerIndex}\n`;
      } else {
        code += `    dw SPRITE_PLACEHOLDER_PATTERN\n`;
      }
    }
  });
  if (sprites.length === 0) {
    code += `
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`;
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
; Table: Entity -> Sprite Asset Index
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index:
`;
  entityAllocations.forEach(alloc => {
    const idx = alloc.spriteAssetIndex >= 0 ? alloc.spriteAssetIndex : 0xFF;
    code += `    db #${idx.toString(16).toUpperCase().padStart(2, '0')} ; Entity ${alloc.entityIndex} (${alloc.spriteName})\n`;
  });
  if (entityAllocations.length < 32) {
    code += `    ds ${32 - entityAllocations.length}, #FF ; Padding\n`;
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
    call FAST_LDIRVM
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
    call FAST_LDIRVM
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
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, ${totalHardwareSprites}
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
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
    call FAST_LDIRVM
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
