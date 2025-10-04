/**
 * @fileoverview Entities Generator - Game entity definitions and initialization
 * Generates entities.asm with entity data and management functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Generate game entities file (entities.asm)
 *
 * Creates entity definitions with real positions from JSON data, component masks,
 * and initialization/update functions for each entity in the project.
 *
 * @param analysis - Project analysis with entity instances
 * @returns ASM code string with entity definitions and functions
 */
export function generateEntitiesFile(analysis: ProjectAnalysis): string {
  let code = `; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================

`;

  if (analysis.entities && analysis.entities.length > 0) {
    code += `; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`;

    analysis.entities.forEach((entity, index) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `; Entity: ${entity.name}
ENTITY_${entityName}_ID EQU ${index}
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
    ; Initialize all game entities
`;

    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach((entity) => {
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
    ; Update all entities
`;

    if (analysis.entities && analysis.entities.length > 0) {
      analysis.entities.forEach((entity) => {
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

    // Generate individual entity functions with REAL POSITIONS from JSON
    analysis.entities.forEach((entity, index) => {
      const entityName = entity.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

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

      code += `init_${entityName.toLowerCase()}:
    ; Initialize ${entity.name} at real position from JSON
    ; JSON position: (${realX}, ${realY}) tiles = (${pixelX}, ${pixelY}) pixels

    ; Set entity ID and component mask
    ld a, ${index}             ; Entity ID
    ld b, COMP_MASK_POSITION + COMP_MASK_SPRITE + COMP_MASK_MOVEMENT + COMP_MASK_COLLISION + COMP_MASK_INPUT
    call create_entity         ; Create with all components

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${index}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${pixelX}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${pixelY}         ; Set real Y position from JSON

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${index}          ; Use entity index as sprite pattern

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

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
