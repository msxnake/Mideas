"use strict";
/**
 * @fileoverview Sprites Generator - Sprite pattern and animation data
 * Generates sprites.asm with sprite definitions and management functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpritesFile = generateSpritesFile;
const spriteUtils_1 = require("../../../components/utils/spriteUtils");
const componentAnalyzer_1 = require("../utils/componentAnalyzer");
const constants_1 = require("../../../constants");
// Constants
const SPRITE_INVISIBLE_VALUE = 224; // MSX: Y >= 209 hides sprite, but 224 is safer off-screen
const DEFAULT_DATA_FORMAT = 'hex';
/**
 * Analyze drawable palette layers for a sprite across ALL frames.
 * Returns palette layer indexes that are really used at least once.
 */
const analyzeDrawableLayerIndexes = (sprite) => {
    const palette = sprite?.spritePalette || [];
    const bg = sprite?.backgroundColor;
    const frames = sprite?.frames || [];
    if (!palette.length || !frames.length)
        return [];
    const used = [];
    for (let layerIdx = 0; layerIdx < palette.length; layerIdx++) {
        const layerColor = palette[layerIdx];
        if (!layerColor || layerColor === bg)
            continue;
        let hasPixels = false;
        for (const frame of frames) {
            if (!frame?.data)
                continue;
            for (let y = 0; y < (frame.data.length || 0) && !hasPixels; y++) {
                for (let x = 0; x < (frame.data[y]?.length || 0) && !hasPixels; x++) {
                    if (frame.data[y][x] === layerColor) {
                        hasPixels = true;
                    }
                }
            }
            if (hasPixels)
                break;
        }
        if (hasPixels) {
            used.push(layerIdx);
        }
    }
    return used;
};
const findFirstDrawableLayerIndex = (sprite) => {
    const usedLayers = analyzeDrawableLayerIndexes(sprite);
    return usedLayers.length > 0 ? usedLayers[0] : -1;
};
/**
 * Generate sprite data file (sprites.asm)
 *
 * @param analysis - Project analysis with sprite assets
 * @returns ASM code string with sprite data and functions
 */
function generateSpritesFile(analysis) {
    const sourceSprites = analysis.sprites || [];
    const spriteCatalog = (0, spriteUtils_1.buildMSXDirectionalSpriteCatalog)(sourceSprites);
    const sprites = spriteCatalog.sprites;
    const spriteNameToIndex = spriteCatalog.nameToIndex;
    const directionalLookupTables = spriteCatalog.directionalLookupTables;
    spriteCatalog.warnings.forEach(warning => {
        console.warn(`[Sprites Generator] ${warning}`);
    });
    console.log('🎨 generateSpritesFile() called:');
    console.log(`  - analysis.sprites.length: ${sourceSprites.length}`);
    console.log(`  - expandedSprites.length: ${sprites.length}`);
    console.log(`  - analysis.entities.length: ${analysis.entities?.length || 0}`);
    console.log(`  - analysis.templates.length: ${analysis.templates?.length || 0}`);
    // INTELLIGENT SPRITE MAPPING & MULTI-LAYER SUPPORT
    const { activeEntities } = (0, componentAnalyzer_1.analyzeComponentUsage)(analysis);
    console.log(`  - activeEntities.length: ${activeEntities.length}`);
    // Helper to parse hex color to RGB
    const hexToRGB = (hex) => {
        if (!hex || hex.startsWith('rgba'))
            return null;
        const clean = hex.replace('#', '');
        if (clean.length !== 6)
            return null;
        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    };
    // Helper to get MSX1 color index from hex (nearest color match)
    const hexToMSX1Index = (hex) => {
        if (!hex)
            return 0;
        // Try exact match first
        const exact = constants_1.MSX1_PALETTE.find(c => c.hex.toUpperCase() === hex.toUpperCase());
        if (exact)
            return exact.index;
        // Nearest color match (Euclidean distance in RGB space)
        const rgb = hexToRGB(hex);
        if (!rgb)
            return 15;
        let bestIndex = 15;
        let bestDist = Infinity;
        for (const c of constants_1.MSX1_PALETTE) {
            if (c.index === 0)
                continue; // Skip transparent
            const cRGB = hexToRGB(c.hex);
            if (!cRGB)
                continue;
            const dist = (rgb.r - cRGB.r) ** 2 + (rgb.g - cRGB.g) ** 2 + (rgb.b - cRGB.b) ** 2;
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = c.index;
            }
        }
        return bestIndex;
    };
    // Helper to analyze sprite layers/colors.
    // Uses compact stable layer set (only globally used layers), matching
    // spriteUtils.generateSpriteASMCode() output layout.
    const getSpriteLayerColors = (sprite) => {
        if (!sprite)
            return [15]; // Default white
        const palette = sprite.spritePalette || [];
        const bg = sprite.backgroundColor;
        const usedLayerIndexes = analyzeDrawableLayerIndexes(sprite);
        if (usedLayerIndexes.length === 0)
            return [15];
        const colors = usedLayerIndexes.map((layerIdx) => {
            const hex = palette[layerIdx];
            if (!hex || (bg && hex === bg)) {
                return 0;
            }
            else {
                return hexToMSX1Index(hex);
            }
        });
        return colors.length > 0 ? colors : [15];
    };
    const emitDirectionTable = (label, values) => {
        let table = `${label}:\n`;
        if (values.length === 0) {
            table += `    db 0\n`;
            return table;
        }
        const bytesPerLine = 16;
        for (let i = 0; i < values.length; i += bytesPerLine) {
            const chunk = values.slice(i, i + bytesPerLine);
            table += `    db ${chunk.join(', ')}\n`;
        }
        return table;
    };
    const getEntitySpriteInfo = (entity) => {
        console.log(`\n🔍 getEntitySpriteInfo for entity: "${entity.name}" (template: ${entity.entityTemplateId})`);
        console.log(`   Available sprites: ${sprites.map(s => `"${s.name}" (${s.id})`).join(', ') || 'NONE'}`);
        const template = analysis.templates?.find((t) => t.id === entity.entityTemplateId);
        if (!template) {
            console.log(`   ❌ Template not found!`);
            return null;
        }
        console.log(`   Template found: "${template.name}"`);
        console.log(`   Template components: ${template.components?.map((c) => c.definitionId).join(', ') || 'NONE'}`);
        // Use the same logic as GameFlowPreviewModal.tsx:
        // 1. First check componentOverrides for sprite_ref properties
        // 2. Then check template.components defaultValues for sprite_ref properties
        const componentDefinitions = analysis.components || [];
        let spriteAssetId;
        // Step 1: Check entity instance overrides first
        if (entity.componentOverrides) {
            for (const compId in entity.componentOverrides) {
                const compDef = componentDefinitions.find((c) => c.id === compId);
                const spriteProp = compDef?.properties?.find((p) => p.type === 'sprite_ref');
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
                const compDef = componentDefinitions.find((c) => c.id === comp.definitionId);
                const spriteProp = compDef?.properties?.find((p) => p.type === 'sprite_ref');
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
        // Find sprite by ID/name alias map (includes auto-generated directional aliases)
        let foundIndex = spriteNameToIndex[spriteAssetId];
        if (foundIndex === undefined) {
            foundIndex = spriteNameToIndex[spriteAssetId.toLowerCase()];
        }
        // If still not found, try partial name match
        if (foundIndex === undefined) {
            const spriteIdLower = spriteAssetId.toLowerCase();
            foundIndex = sprites.findIndex(s => s.name?.toLowerCase().includes(spriteIdLower) ||
                spriteIdLower.includes(s.name?.toLowerCase() || ''));
        }
        if (foundIndex !== undefined && foundIndex >= 0) {
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
    const entityAllocations = [];
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
    // Always reserve full hardware sprite table (32) in RAM.
    // VRAM upload can be smaller: active range + one SAT end marker sprite.
    // However, if any SubMenu node uses a sprite cursor (slots 28-31),
    // we must upload the full SAT so those slots reach VRAM.
    const totalHardwareSprites = 32;
    const SUBMENU_CURSOR_BASE = 28;
    const SUBMENU_CURSOR_MAX = 4;
    const hasSubmenuCursorSprite = (analysis.gameFlow?.nodes || []).some((n) => n.type === 'SubMenu' && n.appearance?.cursorSpriteAssetId);
    const maxUsedSlot = hasSubmenuCursorSprite
        ? SUBMENU_CURSOR_BASE + SUBMENU_CURSOR_MAX
        : Math.max(1, Math.min(currentHwSpriteIndex, totalHardwareSprites));
    const uploadHardwareSprites = Math.min(maxUsedSlot < totalHardwareSprites ? maxUsedSlot + 1 : totalHardwareSprites, totalHardwareSprites);
    const uploadBytes = uploadHardwareSprites * 4;
    // Phase 2: Generate Code
    let code = `; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${activeEntities.length}
; Total Hardware Sprites (Layers): ${totalHardwareSprites}
; SAT Upload Sprites per frame: ${uploadHardwareSprites}
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
        const spriteASM = (0, spriteUtils_1.generateSpriteASMCode)(sprite, DEFAULT_DATA_FORMAT, index);
        // Find first layer that actually has pixel data
        const firstDrawableLayerIndex = findFirstDrawableLayerIndex(sprite);
        code += `\n; Sprite Asset ${index}: ${sprite.name}\n${spriteASM}`;
        if (firstDrawableLayerIndex >= 0) {
            code += `\n; Unified pattern label for sprite ${index}
SPRITE_${index}_PATTERN EQU ${safeSpriteName}_F0_LAYER${firstDrawableLayerIndex}
SPRITE_${index}_PATTERN_BANK EQU ((SPRITE_${index}_PATTERN - #4000) / #2000)\n`;
        }
        else {
            code += `\n; WARNING: No valid pattern layers found for sprite ${index}
SPRITE_${index}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
SPRITE_${index}_PATTERN_BANK EQU ((SPRITE_${index}_PATTERN - #4000) / #2000)\n`;
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
SPRITE_PLACEHOLDER_PATTERN_BANK EQU ((SPRITE_PLACEHOLDER_PATTERN - #4000) / #2000)

`;
    if (sprites.length === 0) {
        code += `; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)\n`;
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
    code += `SPRITE_ASSET_COUNT EQU ${Math.max(1, sprites.length)}\n`;
    code += `
; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags:
`;
    sprites.forEach((sprite, index) => {
        // Default to looping if loops property is undefined, as per Mideas defaults
        const loops = sprite.loops !== false;
        const loopVal = loops ? '2' : '0';
        code += `    db ${loopVal} ; Sprite ${index}: ${sprite.name}\n`;
    });
    if (sprites.length === 0) {
        code += `    db 2 ; Placeholder (loops by default)\n`;
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
            }
            else {
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
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
`;
    code += emitDirectionTable('sprite_dir_left_table', directionalLookupTables.left);
    code += '\n';
    code += emitDirectionTable('sprite_dir_right_table', directionalLookupTables.right);
    code += '\n';
    code += emitDirectionTable('sprite_dir_up_table', directionalLookupTables.up);
    code += '\n';
    code += emitDirectionTable('sprite_dir_down_table', directionalLookupTables.down);
    code += '\n';
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
; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
`;
    entityAllocations.forEach(alloc => {
        const idx = alloc.spriteAssetIndex >= 0 ? alloc.spriteAssetIndex : 0xFF;
        code += `    db #${idx.toString(16).toUpperCase().padStart(2, '0')} ; Entity ${alloc.entityIndex} (${alloc.spriteName})\n`;
    });
    if (entityAllocations.length < 32) {
        code += `    ds ${32 - entityAllocations.length}, #FF ; Padding\n`;
    }
    // Compute max layer count across all entity allocations (used by SM color update)
    const maxEntityLayers = Math.max(1, ...entityAllocations.map(a => a.layerCount));
    code += `SPRITE_MAX_ENTITY_LAYERS EQU ${maxEntityLayers}  ; Max HW sprite layers per entity\n`;
    code += `
; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
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
    // Padding to fill 32 slots total
    const remainingColors = totalHardwareSprites - colorsWritten;
    if (remainingColors > 0) {
        code += `    ds ${remainingColors}, 0 ; Padding\n`;
    }
    // SM_SpriteLayerColorTable: per-sprite color table for Action_ChangeSprite
    // Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite, in the same layer order
    // as the sprite pattern blob (usedLayerIndexes order, padded with 0 for empty slots)
    code += `
; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable:
`;
    sprites.forEach((sprite, index) => {
        const colors = getSpriteLayerColors(sprite);
        const paddedColors = [...colors];
        while (paddedColors.length < maxEntityLayers)
            paddedColors.push(0);
        code += `    db ${paddedColors.join(', ')} ; Sprite ${index}: ${sprite.name}\n`;
    });
    if (sprites.length === 0) {
        const zeros = Array(maxEntityLayers).fill(0);
        code += `    db ${zeros.join(', ')} ; Placeholder\n`;
    }
    code += `
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Copy sprite_layer_colors_init (ROM) -> sprite_layer_colors (RAM)
    ld hl, sprite_layer_colors_init
    ld de, sprite_layer_colors
    ld bc, 32
    ldir
    call clear_all_sprites
    call load_sprite_patterns
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
    ; Load patterns for all active entities
    call mapper_push_p2
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
    ld a, ${patternLabel}_BANK
    call mapper_set_bank_p2
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
        }
        else {
            code += `    ; No active entities detected, load all sprite assets sequentially
`;
            let fallbackPatternIndex = 0;
            sprites.forEach((sprite, index) => {
                const layerCount = getSpriteLayerColors(sprite).length || 1;
                const frameCount = sprite.frames?.length || 1;
                const bytesToCopy = layerCount * frameCount * 32; // 32 bytes per 16x16 layer per frame
                code += `    ; Sprite Asset ${index}: ${sprite.name} (${frameCount} frames, ${layerCount} layers)
    ld a, SPRITE_${index}_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, SPRITE_${index}_PATTERN
    ld de, SPRPAT + (${fallbackPatternIndex} * 32)
    ld bc, ${bytesToCopy}
    call FAST_LDIRVM
`;
                fallbackPatternIndex += layerCount * frameCount;
            });
        }
    }
    code += `    call mapper_pop_p2
    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: Never write Y >= 208 (208 is SAT end marker on MSX)
    push af
    ld a, c
    cp 208
    jr c, .y_ok
    ld c, SPRITE_INVISIBLE
.y_ok:
    pop af

    ; Save pattern (D) and color (E) before calculating address
    push de

    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4
    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Restore pattern and color
    pop de

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

    ld a, 1
    ld (sprites_dirty), a
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
    ld a, 1
    ld (sprites_dirty), a
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ld a, 1
    ld (sprites_dirty), a
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, ${uploadBytes}  ; Upload active sprite range + SAT end marker
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
; sprites_dirty: db 0
`;
    return code;
}
