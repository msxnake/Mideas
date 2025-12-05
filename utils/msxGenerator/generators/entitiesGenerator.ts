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
  const COMP_MASK_SPRITE = 0x02; // Bit used for sprite component

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
      const hasSprite = (componentMask & COMP_MASK_SPRITE) !== 0;

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
    
    ; Initialize State Machine variables (Clear to 0)
    ld hl, entity_sm_ptr_l
    ld de, entity_sm_ptr_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_ptr_h
    ld de, entity_sm_ptr_h+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_l
    ld de, entity_sm_timer_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_h
    ld de, entity_sm_timer_h+1
    ld bc, 31
    ld (hl), 0
    ldir
    
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
      const hasSprite = (componentMask & COMP_MASK_SPRITE) !== 0;

      // Get real position from JSON entity data
      const realX = entity.position?.x || 100;
      const realY = entity.position?.y || 100;

      // Convert tile coordinates to pixel coordinates
      // MSX Screen 2 uses 8x8 pixel tiles (32 columns × 24 rows)
      // Mideas entity positions are in tile coordinates, so multiply by 8
      const tileGridSizeX = 8;  // MSX standard 8x8 tiles
      const tileGridSizeY = 8;  // MSX standard 8x8 tiles
      const pixelX = realX * tileGridSizeX;
      const pixelY = realY * tileGridSizeY;

      // Validate coordinates are within MSX screen bounds
      // MSX Screen 2: 256x192 pixels (32x24 tiles)
      // Sprites can be positioned at X: 0-255, Y: 0-191
      const validX = Math.min(pixelX, 240);
      const validY = Math.min(pixelY, 191);

      // Warn if coordinates were clamped
      if (pixelX !== validX || pixelY !== validY) {
        console.warn(`Entity ${entity.name} position clamped: (${pixelX},${pixelY}) → (${validX},${validY})`);
      }

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
    ; JSON position: (${realX}, ${realY}) tiles = (${validX}, ${validY}) pixels
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
    ld (hl), ${validX}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${validY}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${(() => {
          // Find which screen this entity belongs to
          let screenIndex = 0;
          if (analysis.screenMaps) {
            analysis.screenMaps.forEach((screen, sIndex) => {
              if (screen.layers.entities.some(e => e.id === entity.id)) {
                screenIndex = sIndex;
              }
            });
          }
          return screenIndex;
        })()}                 ; Screen ID (calculated from project data)

${hasSprite ? `    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${index * 4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${(index % 14) + 2}                ; Distinct color for debugging
` : '    ; Anchor/reference entity - no sprite allocation needed\n'}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${directionMask.toString(16).toUpperCase().padStart(2, '0')}            ; Direction restrictions: ${directionDesc}

${hasSprite ? `    ; Make sprite visible immediately (only if on screen 0 or current screen)
    ; For safety, we'll let the update loop handle visibility based on screen ID
    ; but we can initialize it here if it's on screen 0
    ld a, ${(() => {
          let screenIndex = 0;
          if (analysis.screenMaps) {
            analysis.screenMaps.forEach((screen, sIndex) => {
              if (screen.layers.entities.some(e => e.id === entity.id)) {
                screenIndex = sIndex;
              }
            });
          }
          return screenIndex;
        })()}
    or a                       ; Check if screen 0
    jr nz, .skip_show_${index} ; Skip if not screen 0

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${index}             ; Entity Index
    call force_update_entity_sprite

.skip_show_${index}:
` : '    ; No sprite to show for this entity\n'}
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
