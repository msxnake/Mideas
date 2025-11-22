/**
 * @fileoverview Entities Generator - Game entity definitions and initialization
 * Generates entities.asm with entity data and management functions
 * NOW WITH INTELLIGENT FILTERING - Only generates code for entities actually instantiated
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { analyzeComponentUsage, generateEntityComponentMask } from '../utils/componentAnalyzer';

/**
 * Generate game entities file (entities.asm)
 *
 * Creates entity definitions with real positions from JSON data, component masks,
 * and initialization/update functions for each entity in the project.
 * NOW WITH INTELLIGENT FILTERING - Only generates code for entities actually instantiated.
 *
 * @param analysis - Project analysis with entity instances
 * @returns ASM code string with entity definitions and functions
 */
export function generateEntitiesFile(analysis: ProjectAnalysis): string {
  // INTELLIGENT FILTERING: Analyze which entities are actually used
  const componentUsage = analyzeComponentUsage(analysis);
  const activeEntities = componentUsage.activeEntities;

  console.log('🎯 Generating optimized entities.asm...');
  console.log(`  - Total entity templates in JSON: ${analysis.templates?.length || 0}`);
  console.log(`  - Actually instantiated entities: ${activeEntities.length}`);
  console.log(`  - Filtered out: ${(analysis.templates?.length || 0) - activeEntities.length} unused templates`);

  let code = `; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${analysis.templates?.length || 0}
;   Actually instantiated: ${activeEntities.length}
;   Filtered out: ${(analysis.templates?.length || 0) - activeEntities.length} unused templates
;
; ==================================================================

`;

  if (activeEntities.length > 0) {
    code += `; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`;

    // Generate definitions ONLY for active entities (not all templates)
    activeEntities.forEach((entity, index) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

      // Get template for component mask calculation
      const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
      const componentMask = generateEntityComponentMask(entity, template, analysis);

      code += `; Entity: ${entity.name} (instance from template: ${entity.entityTemplateId})
ENTITY_${entityName}_ID EQU ${index}
ENTITY_${entityName}_COMP_MASK EQU #${componentMask.toString(16).toUpperCase().padStart(2, '0')}  ; Component mask: ${componentMask.toString(2).padStart(8, '0')}b
`;

      if (entity.entityTemplateId) {
        code += `ENTITY_${entityName}_TEMPLATE EQU "${entity.entityTemplateId}"
`;
      }

      if (entity.position) {
        code += `ENTITY_${entityName}_X EQU ${entity.position.x}
ENTITY_${entityName}_Y EQU ${entity.position.y}
`;
      }

      code += `
`;
    });

    code += `; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${activeEntities.length} entities)
    
    ; CRITICAL: Clear entity screen IDs to prevent ghost entities on restart
    ; This ensures all entities start with screen ID 0, even if they were
    ; moved to different screens in a previous game session
    ld hl, entity_screen_id
    ld de, entity_screen_id+1
    ld bc, 31                  ; Clear 32 entities (32-1 for LDIR)
    ld (hl), 0                 ; Set first byte to 0
    ldir                       ; Copy to rest of array
    
`;

    if (activeEntities.length > 0) {
      activeEntities.forEach((entity) => {
        const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `    call init_${entityName.toLowerCase()}
`;
      });
    } else {
      code += `    ; No entities to initialize
`;
    }

    code += `    ret

update_entities:
    ; Update all active entities (${activeEntities.length} entities)
`;

    if (activeEntities.length > 0) {
      activeEntities.forEach((entity) => {
        const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `    call update_${entityName.toLowerCase()}
`;
      });
    } else {
      code += `    ; No entities to update
`;
    }

    code += `    ret

`;

    // Generate individual entity functions ONLY for active entities with REAL POSITIONS
    activeEntities.forEach((entity, index) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

      // Get template for component mask calculation
      const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
      const componentMask = generateEntityComponentMask(entity, template, analysis);

      // Get real position from JSON entity data
      const realX = entity.position?.x || 100;
      const realY = entity.position?.y || 100;

      // Convert tile coordinates to pixel coordinates
      // NOTE: Mideas tiles can be any size multiple of 8 pixels
      // Need to determine the grid size from the actual screen layout
      // For now, assume standard 16x16 grid but this should be dynamic
      const tileGridSizeX = 16;  // Should be calculated from screen map
      const tileGridSizeY = 16;  // Should be calculated from screen map
      const pixelX = realX * tileGridSizeX;
      const pixelY = realY * tileGridSizeY;

      // Get component list for documentation
      const usedComponentNames: string[] = [];
      if (componentMask & 0x01) usedComponentNames.push('Position');
      if (componentMask & 0x02) usedComponentNames.push('Sprite');
      if (componentMask & 0x04) usedComponentNames.push('Movement');
      if (componentMask & 0x08) usedComponentNames.push('Collision');
      if (componentMask & 0x10) usedComponentNames.push('Input');
      if (componentMask & 0x20) usedComponentNames.push('Behavior');
      if (componentMask & 0x40) usedComponentNames.push('Health');
      if (componentMask & 0x80) usedComponentNames.push('Animation');

      // Check if entity has Input/Cursors component and extract direction restrictions
      let directionMask = 0x0F; // Default: all directions enabled (binary 00001111)
      if (componentMask & 0x10) { // Has Input component
        // Find Cursors component in template
        const cursorsComp = template?.components.find((c: any) =>
          c.definitionId === 'comp_cursors' || c.definitionId === 'comp_input' || c.definitionId === 'comp_player_input'
        );

        if (cursorsComp) {
          // Get default values from template
          const defaultValues = cursorsComp.defaultValues || {};

          // Merge with entity-specific overrides if they exist
          const overrides = entity.componentOverrides?.['comp_cursors'] || {};
          const finalValues = { ...defaultValues, ...overrides };

          // Build direction mask based on allow* properties
          // Bit 0 = UP, Bit 1 = DOWN, Bit 2 = LEFT, Bit 3 = RIGHT
          directionMask = 0;
          if (finalValues.allowUp !== false) directionMask |= 0x01; // Bit 0
          if (finalValues.allowDown !== false) directionMask |= 0x02; // Bit 1
          if (finalValues.allowLeft !== false) directionMask |= 0x04; // Bit 2
          if (finalValues.allowRight !== false) directionMask |= 0x08; // Bit 3
        }
      }

      // Generate direction info for documentation
      const directionInfo = [];
      if (directionMask & 0x01) directionInfo.push('UP');
      if (directionMask & 0x02) directionInfo.push('DOWN');
      if (directionMask & 0x04) directionInfo.push('LEFT');
      if (directionMask & 0x08) directionInfo.push('RIGHT');
      const directionDesc = directionInfo.length === 4 ? 'All directions' : directionInfo.join('+');

      code += `init_${entityName.toLowerCase()}:
    ; Initialize ${entity.name} at real position from JSON
    ; JSON position: (${realX}, ${realY}) tiles = (${pixelX}, ${pixelY}) pixels
    ; Template: ${entity.entityTemplateId}
    ; Components: ${usedComponentNames.join(', ')}
    ; Direction mask: #${directionMask.toString(16).toUpperCase().padStart(2, '0')} (${directionMask.toString(2).padStart(4, '0')}b) = ${directionDesc}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ld a, ${index}             ; Entity ID
    ld b, #${componentMask.toString(16).toUpperCase().padStart(2, '0')}              ; Component mask (${componentMask.toString(2).padStart(8, '0')}b)
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${index}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${pixelX}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${pixelY}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID 0 (default to first screen)

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${index}          ; Use entity index as sprite pattern

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${directionMask.toString(16).toUpperCase().padStart(2, '0')}            ; Direction restrictions: ${directionDesc}

    ; Make sprite visible immediately
    ld a, ${index}             ; Sprite number
    ld b, ${pixelX}            ; X position
    ld c, ${pixelY}            ; Y position
    ld d, ${index}             ; Pattern
    ld e, 15                   ; Color
    call show_sprite
    ret

update_${entityName.toLowerCase()}:
    ; Update ${entity.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${index}
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

`;
    });
  } else {
    code += `; ==================================================================
; DEFAULT ENTITY SYSTEM
; ==================================================================

; Basic entity structure
ENTITY_PLAYER_ID EQU 0
ENTITY_ENEMY_ID  EQU 1

init_entities:
    ; Initialize default entities
    call init_player
    ret

update_entities:
    ; Update all entities
    call update_player
    ret

init_player:
    ; Initialize player entity
${analysis.sprites && analysis.sprites.length > 0 ? `
    ; TEST: Show first sprite in center of screen
    ; Sprite 0, X=128, Y=96 (center), Pattern=0, Color=15 (white)
    ld a, 0           ; Sprite number 0
    ld b, 128         ; X position (center)
    ld c, 96          ; Y position (center)
    ld d, 0           ; Pattern 0 (first sprite)
    ld e, 15          ; Color 15 (white)
    call show_sprite
` : ''}
    ret

update_player:
    ; Update player logic
    ret

`;
  }

  code += `; ==================================================================
; END OF ENTITIES
; ==================================================================
`;

  return code;
}
