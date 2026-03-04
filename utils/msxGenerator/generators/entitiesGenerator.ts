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
  const parseBool = (value: any, defaultValue: boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
      const asNum = parseInt(normalized, 10);
      if (!Number.isNaN(asNum)) return asNum !== 0;
    }
    return defaultValue;
  };

  const parseByte = (value: any, defaultValue: number): number => {
    const num = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
    if (Number.isNaN(num)) return defaultValue;
    return Math.max(0, Math.min(255, num | 0));
  };

  const parseOffsetByte = (value: any, defaultValue: number): number => {
    const num = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
    if (Number.isNaN(num)) return defaultValue & 0xFF;
    if (num < 0) {
      const signed = Math.max(-128, Math.min(-1, num | 0));
      return (256 + signed) & 0xFF;
    }
    return Math.max(0, Math.min(255, num | 0));
  };

  const parseJobPeriod = (value: any): number => {
    const num = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
    if (Number.isNaN(num)) return 1;
    if (num >= 1 && num <= 4) return num | 0; // legacy period format
    if (num === 100) return 1;
    if (num === 50) return 2;
    if (num === 33) return 3;
    if (num === 25) return 4;
    return 1;
  };

  const parseJobEntry = (value: any, period: number): number => {
    const safePeriod = Math.max(1, period | 0);
    const num = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
    const raw = Number.isNaN(num) ? 0 : (num | 0);
    return ((raw % safePeriod) + safePeriod) % safePeriod;
  };

  const toHexByte = (value: number): string =>
    (value & 0xFF).toString(16).toUpperCase().padStart(2, '0');

  const resolveEntityScreenId = (entity: any): number => {
    const directScreenAssetId = entity?.screenAssetId || entity?.screenId || entity?.screenMapId;
    if (directScreenAssetId) {
      const worldMaps = ((analysis as any).worldmaps || []) as any[];
      for (const world of worldMaps) {
        const nodes = world?.nodes || [];
        const nodeIndex = nodes.findIndex((n: any) => n?.screenAssetId === directScreenAssetId);
        if (nodeIndex >= 0) return nodeIndex;
      }
    }

    if (typeof entity?.screenIndex === 'number' && entity.screenIndex >= 0) {
      return entity.screenIndex;
    }

    let fallbackScreenIndex = 0;
    let entityScreenAssetId: string | null = null;

    if (analysis.screenMaps) {
      analysis.screenMaps.forEach((screen, sIndex) => {
        const screenEntities = screen?.layers?.entities || [];
        if (screenEntities.some((e: any) => e.id === entity.id)) {
          fallbackScreenIndex = sIndex;
          entityScreenAssetId = screen.id || null;
        }
      });
    }

    if (!entityScreenAssetId) {
      return fallbackScreenIndex;
    }

    const worldMaps = ((analysis as any).worldmaps || []) as any[];
    for (const world of worldMaps) {
      const nodes = world?.nodes || [];
      const nodeIndex = nodes.findIndex((n: any) => n?.screenAssetId === entityScreenAssetId);
      if (nodeIndex >= 0) {
        return nodeIndex;
      }
    }

    return fallbackScreenIndex;
  };

  const buildTemplateTokenMap = (templates?: any[]): Record<string, number> => {
    const map: Record<string, number> = {};
    if (!templates || templates.length === 0) return map;

    let token = 1;
    templates.forEach((tpl: any) => {
      if (!tpl || !tpl.id) return;
      if (map[tpl.id] !== undefined) return;
      map[tpl.id] = token;
      if (tpl.name) {
        map[String(tpl.name)] = token;
        map[String(tpl.name).toLowerCase()] = token;
      }
      if (token < 255) token += 1;
    });

    return map;
  };

  // INTELLIGENT FILTERING: Analyze which entities are actually used
  const componentUsage = analyzeComponentUsage(analysis);
  const activeEntities = componentUsage.activeEntities;
  const COMP_MASK_SPRITE = 0x02; // Bit used for sprite component
  const COMP_MASK_INPUT = 0x10; // Bit used for input component
  const templateTokenMap = buildTemplateTokenMap(analysis.templates as any[]);

  const sanitizeEntityName = (rawName: any): string => {
    const safe = String(rawName ?? 'entity')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/^_+|_+$/g, '');
    return safe || 'ENTITY';
  };

  // Build unique ASM-safe symbol names per entity instance.
  const entityNameCounts = new Map<string, number>();
  const entityLabelNames = activeEntities.map((entity: any, index: number) => {
    const base = sanitizeEntityName(entity?.name || `ENTITY_${index}`);
    const seen = (entityNameCounts.get(base) || 0) + 1;
    entityNameCounts.set(base, seen);
    return seen === 1 ? base : `${base}_${seen}`;
  });

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
      const entityName = entityLabelNames[index];

      // Get template for component mask calculation
      const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
      const componentMask = generateEntityComponentMask(entity, template, analysis);
      const hasSprite = (componentMask & COMP_MASK_SPRITE) !== 0;

      code += `; Entity: ${entity.name} (instance from template: ${entity.entityTemplateId})
ENTITY_${entityName}_ID EQU ${index}
ENTITY_${entityName}_COMP_MASK EQU #${componentMask.toString(16).toUpperCase().padStart(2, '0')}  ; Component mask: ${componentMask.toString(2).padStart(8, '0')}b
`;

      if (entity.entityTemplateId) {
        // Use a comment instead of EQU with string (invalid Z80 syntax)
        code += `; Template: ${entity.entityTemplateId}
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

    ; Ensure sprite system is reset whenever entities are initialized
    call init_sprites

    ; CRITICAL: Clear ALL entity component masks to prevent ghost entities
    ; RAM may contain random data - entities 0..N will be set by create_entity
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31                  ; Clear 32 bytes (32-1 for LDIR)
    ld (hl), 0
    ldir

    ld hl, entity_comp_masks_hi
    ld de, entity_comp_masks_hi+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity screen IDs to prevent ghost entities on restart
    ld hl, entity_screen_id
    ld de, entity_screen_id+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity template tokens
    ld hl, entity_template_token
    ld de, entity_template_token+1
    ld bc, 31
    ld (hl), 0
    ldir
    
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

    ld hl, entity_sm_wait_timer
    ld de, entity_sm_wait_timer+1
    ld bc, 31
    ld (hl), 0
    ldir
    
`;

    if (activeEntities.length > 0) {
      activeEntities.forEach((entity, index) => {
        const entityName = entityLabelNames[index];
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
      activeEntities.forEach((entity, index) => {
        const entityName = entityLabelNames[index];
        code += `    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + ${index}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_${index}
    ; Run per-entity update
    call update_${entityName.toLowerCase()}
.skip_update_${index}:
`;
      });
    } else {
      code += `    ; No entities to update
`;
    }

    code += `    ret

`;

    // Generate individual entity functions ONLY for active entities with REAL POSITIONS
    let needsPatrolFacingHelper = false;
    activeEntities.forEach((entity, index) => {
      const entityName = entityLabelNames[index];

      // Get template for component mask calculation
      const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
      const componentMask = generateEntityComponentMask(entity, template, analysis);
      const hasSprite = (componentMask & COMP_MASK_SPRITE) !== 0;
      const hasInput = (componentMask & COMP_MASK_INPUT) !== 0;
      const jobPeriod = parseJobPeriod((entity as any)?.jobRate ?? (entity as any)?.jobPeriod);
      const jobEntry = parseJobEntry((entity as any)?.jobEntry, jobPeriod);
      if (hasSprite && hasInput) {
        needsPatrolFacingHelper = true;
      }

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
      if (componentMask & 0x0100) usedComponentNames.push('Jump');
      if (componentMask & 0x0200) usedComponentNames.push('Gravity');

      // Check if entity has Input/Cursors component and extract direction restrictions
      let directionMask = 0x0F; // Default: all directions enabled (binary 00001111)
      let inputSpeed = 2; // Default cursor speed (px/frame)
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

          // Cursors speed comes from template/UI (default + per-entity override)
          inputSpeed = Math.max(1, parseByte(finalValues.speed ?? 2, 2));

          // Build direction mask based on allow* properties
          // Bit 0 = UP, Bit 1 = DOWN, Bit 2 = LEFT, Bit 3 = RIGHT
          directionMask = 0;
          if (finalValues.allowUp !== false) directionMask |= 0x01; // Bit 0
          if (finalValues.allowDown !== false) directionMask |= 0x02; // Bit 1
          if (finalValues.allowLeft !== false) directionMask |= 0x04; // Bit 2
          if (finalValues.allowRight !== false) directionMask |= 0x08; // Bit 3
        }
      }

      let jumpMax = 1;
      if (componentMask & 0x0100) {
        const jumpComp = template?.components?.find((c: any) =>
          c.definitionId === 'comp_jump'
        );

        if (jumpComp) {
          const jumpDefaults = jumpComp.defaultValues || {};
          const jumpOverrides = entity.componentOverrides?.['comp_jump'] || {};
          const jumpValues = { ...jumpDefaults, ...jumpOverrides };
          jumpMax = Math.max(1, parseByte(jumpValues.maxJumps ?? 1, 1));
        }
      }

      // Generate direction info for documentation
      const directionInfo = [];
      if (directionMask & 0x01) directionInfo.push('UP');
      if (directionMask & 0x02) directionInfo.push('DOWN');
      if (directionMask & 0x04) directionInfo.push('LEFT');
      if (directionMask & 0x08) directionInfo.push('RIGHT');
      const directionDesc = directionInfo.length === 4 ? 'All directions' : directionInfo.join('+');

      // Animation component initialization (if present)
      let animationInitAsm = '';
      if (componentMask & 0x80) {
        const animComp = template?.components?.find((c: any) =>
          c.definitionId === 'comp_animation' || c.definitionName === 'Animation'
        );

        const defaultValues = (animComp as any)?.defaultValues || (animComp as any)?.values || {};
        const overrides = entity.componentOverrides?.['comp_animation'] || {};
        const finalValues = { ...defaultValues, ...overrides };

        const frameIndex = parseByte(finalValues.currentFrameIndex ?? finalValues.currentFrame ?? 0, 0);
        const speed = Math.max(1, parseByte(finalValues.animationSpeed ?? 6, 6));
        const loops = parseBool(finalValues.loops, true);
        const playing = parseBool(finalValues.isPlaying, true);
        const onlyWhenMoving = parseBool(finalValues.animateOnlyWhenMoving, false);

        const flags = (playing ? 0x01 : 0x00) | (loops ? 0x02 : 0x00) | (onlyWhenMoving ? 0x04 : 0x00);

        animationInitAsm = `
    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #${frameIndex.toString(16).toUpperCase().padStart(2, '0')}           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #${speed.toString(16).toUpperCase().padStart(2, '0')}           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #${flags.toString(16).toUpperCase().padStart(2, '0')}           ; flags (playing/loop/onlyWhenMoving)
`;
      }

      // === Patrol component detection and initialization ===
      let patrolInitAsm = '';
      let hasPatrol = false;
      let patrolWp1x = 0, patrolWp1y = 0, patrolWp2x = 0, patrolWp2y = 0;
      let patrolVx = 0, patrolVy = 0;

      const patrolTemplateComp = template?.components?.find((c: any) =>
        c.definitionId === 'comp_patrol'
      );
      if (patrolTemplateComp) {
        hasPatrol = true;
        const patrolDefaults = patrolTemplateComp.defaultValues || {};
        const patrolOverrides = entity.componentOverrides?.['comp_patrol'] || {};
        const patrolValues = { ...patrolDefaults, ...patrolOverrides };

        patrolWp1x = Math.max(0, Math.min(255, Number(patrolValues.waypoint1_x) || 0));
        patrolWp1y = Math.max(0, Math.min(191, Number(patrolValues.waypoint1_y) || 0));
        patrolWp2x = Math.max(0, Math.min(255, Number(patrolValues.waypoint2_x ?? patrolWp1x)));
        patrolWp2y = Math.max(0, Math.min(191, Number(patrolValues.waypoint2_y ?? patrolWp1y)));

        // Calculate velocity direction (same as JS preview: normalize direction * speed)
        const dx = patrolWp2x - patrolWp1x;
        const dy = patrolWp2y - patrolWp1y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = Number(patrolValues.speed) || 1;

        if (dist > 0) {
          patrolVx = Math.round((dx / dist) * speed);
          patrolVy = Math.round((dy / dist) * speed);
          // Ensure at least ±1 for non-zero axes
          if (dx !== 0 && patrolVx === 0) patrolVx = dx > 0 ? 1 : -1;
          if (dy !== 0 && patrolVy === 0) patrolVy = dy > 0 ? 1 : -1;
        }

        const velXByte = patrolVx >= 0 ? patrolVx : (256 + patrolVx);
        const velYByte = patrolVy >= 0 ? patrolVy : (256 + patrolVy);

        patrolInitAsm = `
    ; === Patrol Component Init ===
    ; Waypoints: (${patrolWp1x}, ${patrolWp1y}) -> (${patrolWp2x}, ${patrolWp2y})
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${patrolWp1x}         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${patrolWp1y}         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), ${velXByte}           ; VelX = ${patrolVx >= 0 ? '+' : ''}${patrolVx}

    ld hl, entity_vel_y
    add hl, de
    ld (hl), ${velYByte}           ; VelY = ${patrolVy >= 0 ? '+' : ''}${patrolVy}
`;
      }

      // Collision component initialization (hitbox/layer/masks)
      let collisionInitAsm = '';
      if (componentMask & 0x08) { // COMP_MASK_COLLISION
        const collisionTemplateComp = template?.components?.find((c: any) =>
          c.definitionId === 'comp_collision' || c.definitionName === 'Collision'
        );
        const collisionDefaults = collisionTemplateComp?.defaultValues || {};
        const collisionOverrides = entity.componentOverrides?.['comp_collision'] || {};
        const collisionValues = { ...collisionDefaults, ...collisionOverrides };

        const hitboxWidth = parseByte(collisionValues.hitboxWidth, 16);
        const hitboxHeight = parseByte(collisionValues.hitboxHeight, 16);
        const offsetXByte = parseOffsetByte(collisionValues.offsetX, 0);
        const offsetYByte = parseOffsetByte(collisionValues.offsetY, 0);
        const offsetXSigned = offsetXByte >= 128 ? offsetXByte - 256 : offsetXByte;
        const offsetYSigned = offsetYByte >= 128 ? offsetYByte - 256 : offsetYByte;
        const collisionLayer = parseByte(collisionValues.collisionLayer, 1);
        const collidesWith = parseByte(collisionValues.collidesWith, 255);

        collisionInitAsm = `
    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #${toHexByte(hitboxWidth)}      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #${toHexByte(hitboxHeight)}      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #${toHexByte(offsetXByte)}      ; offsetX (${offsetXSigned})

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #${toHexByte(offsetYByte)}      ; offsetY (${offsetYSigned})

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #${toHexByte(collisionLayer)}      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #${toHexByte(collidesWith)}      ; collidesWith
`;
      }

      // === State Machine initialization (if entity has comp_statemachine) ===
      let smInitAsm = '';
      const smOverride = entity.componentOverrides?.['comp_statemachine'];
      const smTemplateComp = template?.components?.find((c: any) => c.definitionId === 'comp_statemachine');
      const smAssetId = smOverride?.stateMachineAssetId || smTemplateComp?.defaultValues?.stateMachineAssetId;

      if (smAssetId && analysis.stateMachines) {
        const sm = analysis.stateMachines.find((s: any) => s.id === smAssetId);
        if (sm && sm.states && sm.states.length > 0) {
          // Use initialStateId if available, otherwise fall back to first state
          let initialState = sm.states[0];
          if (sm.initialStateId) {
            const found = sm.states.find((s: any) => s.id === sm.initialStateId);
            if (found) initialState = found;
          }
          const safeName = sm.name.replace(/[^a-zA-Z0-9]/g, '_');
          const stateLabel = `SM_${safeName}_${initialState.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

          smInitAsm = `
    ; Initialize State Machine pointer to initial state (${sm.name})
    ld hl, ${stateLabel}          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + ${index}), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + ${index}), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, ${stateLabel} + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, ${index}                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0
`;
        }
      }

      // === Generate entity update function (patrol bounce or standard input check) ===
      let updateEntityAsm = '';
      if (hasPatrol) {
        if (hasSprite) {
          needsPatrolFacingHelper = true;
        }
        const minX = Math.min(patrolWp1x, patrolWp2x);
        const maxX = Math.max(patrolWp1x, patrolWp2x);
        const minY = Math.min(patrolWp1y, patrolWp2y);
        const maxY = Math.max(patrolWp1y, patrolWp2y);
        const hasXPatrol = patrolWp1x !== patrolWp2x;
        const hasYPatrol = patrolWp1y !== patrolWp2y;
        const xSkipLabel = hasYPatrol ? `.patrol_check_y_${index}` : `.patrol_end_${index}`;

        updateEntityAsm = `update_${entityName.toLowerCase()}:\n`;
        updateEntityAsm += `    ; Update ${entity.name} - Patrol bounce\n`;
        updateEntityAsm += `    ; Waypoints: (${patrolWp1x}, ${patrolWp1y}) -> (${patrolWp2x}, ${patrolWp2y})\n`;
        updateEntityAsm += `    ld e, ${index}             ; Entity index\n`;
        updateEntityAsm += `    ld d, 0\n`;

        if (hasXPatrol) {
          updateEntityAsm += `\n    ; --- X axis bounce ---\n`;
          updateEntityAsm += `    ld hl, entity_vel_x\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    or a\n`;
          updateEntityAsm += `    jp z, ${xSkipLabel}\n`;
          updateEntityAsm += `    bit 7, a\n`;
          updateEntityAsm += `    jp nz, .patrol_chk_min_x_${index}\n`;
          updateEntityAsm += `\n    ; Moving right: x >= ${maxX}?\n`;
          updateEntityAsm += `    ld hl, entity_x_pos\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    cp ${maxX}\n`;
          updateEntityAsm += `    jp c, ${xSkipLabel}\n`;
          updateEntityAsm += `    ; Bounce: negate vel_x\n`;
          updateEntityAsm += `    ld hl, entity_vel_x\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    neg\n`;
          updateEntityAsm += `    ld (hl), a\n`;
          updateEntityAsm += `    jp ${xSkipLabel}\n`;
          updateEntityAsm += `\n.patrol_chk_min_x_${index}:\n`;
          updateEntityAsm += `    ; Moving left: x <= ${minX}?\n`;
          updateEntityAsm += `    ld hl, entity_x_pos\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    cp ${minX + 1}\n`;
          updateEntityAsm += `    jp nc, ${xSkipLabel}\n`;
          updateEntityAsm += `    ; Bounce: negate vel_x\n`;
          updateEntityAsm += `    ld hl, entity_vel_x\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    neg\n`;
          updateEntityAsm += `    ld (hl), a\n`;
        }

        if (hasYPatrol) {
          if (hasXPatrol) {
            updateEntityAsm += `\n.patrol_check_y_${index}:\n`;
          }
          updateEntityAsm += `\n    ; --- Y axis bounce ---\n`;
          updateEntityAsm += `    ld hl, entity_vel_y\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    or a\n`;
          updateEntityAsm += `    jp z, .patrol_end_${index}\n`;
          updateEntityAsm += `    bit 7, a\n`;
          updateEntityAsm += `    jp nz, .patrol_chk_min_y_${index}\n`;
          updateEntityAsm += `\n    ; Moving down: y >= ${maxY}?\n`;
          updateEntityAsm += `    ld hl, entity_y_pos\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    cp ${maxY}\n`;
          updateEntityAsm += `    jp c, .patrol_end_${index}\n`;
          updateEntityAsm += `    ; Bounce: negate vel_y\n`;
          updateEntityAsm += `    ld hl, entity_vel_y\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    neg\n`;
          updateEntityAsm += `    ld (hl), a\n`;
          updateEntityAsm += `    jp .patrol_end_${index}\n`;
          updateEntityAsm += `\n.patrol_chk_min_y_${index}:\n`;
          updateEntityAsm += `    ; Moving up: y <= ${minY}?\n`;
          updateEntityAsm += `    ld hl, entity_y_pos\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    cp ${minY + 1}\n`;
          updateEntityAsm += `    jp nc, .patrol_end_${index}\n`;
          updateEntityAsm += `    ; Bounce: negate vel_y\n`;
          updateEntityAsm += `    ld hl, entity_vel_y\n`;
          updateEntityAsm += `    add hl, de\n`;
          updateEntityAsm += `    ld a, (hl)\n`;
          updateEntityAsm += `    neg\n`;
          updateEntityAsm += `    ld (hl), a\n`;
        }

        updateEntityAsm += `\n.patrol_end_${index}:\n`;
        if (hasSprite) {
          updateEntityAsm += `    ; Sync sprite facing with current patrol velocity\n`;
          updateEntityAsm += `    call update_entity_patrol_facing\n`;
        }
        updateEntityAsm += `    ret\n`;
      } else {
        updateEntityAsm = `update_${entityName.toLowerCase()}:\n`;
        updateEntityAsm += `    ; Update ${entity.name} logic with real behavior\n`;
        updateEntityAsm += `    ; Check if entity has input component (player entities)\n`;
        updateEntityAsm += `    ld a, ${index}\n`;
        updateEntityAsm += `    ld hl, entity_comp_masks\n`;
        updateEntityAsm += `    ld e, a\n`;
        updateEntityAsm += `    ld d, 0\n`;
        updateEntityAsm += `    add hl, de\n`;
        updateEntityAsm += `    ld a, (hl)\n`;
        updateEntityAsm += `    and COMP_MASK_INPUT\n`;
        updateEntityAsm += `    ret z                      ; Skip if no input component\n\n`;
        updateEntityAsm += `    ; This is a player entity - update based on input\n`;
        updateEntityAsm += `    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT\n`;
        updateEntityAsm += `    ; Position update happens in UPDATE_POSITION_COMPONENT\n`;
        updateEntityAsm += `    ret\n`;
      }

      const entityScreenId = resolveEntityScreenId(entity);
      const templateToken = templateTokenMap[entity.entityTemplateId] ?? 0;

      code += `init_${entityName.toLowerCase()}:
    ; Initialize ${entity.name} at real position from JSON
    ; JSON position: (${realX}, ${realY}) tiles = (${validX}, ${validY}) pixels
    ; Template: ${entity.entityTemplateId}
    ; Components: ${usedComponentNames.join(', ')}
    ; Direction mask: #${directionMask.toString(16).toUpperCase().padStart(2, '0')} (${directionMask.toString(2).padStart(4, '0')}b) = ${directionDesc}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, ${index}             ; Entity ID
    ld b, #${(componentMask & 0xFF).toString(16).toUpperCase().padStart(2, '0')}              ; Mask low byte
    ld c, #${((componentMask >> 8) & 0xFF).toString(16).toUpperCase().padStart(2, '0')}              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: ${jobPeriod} frame(s), entry: ${jobEntry}
    ld a, ${index}
    ld b, ${jobPeriod}
    ld c, ${jobEntry}
    call entity_job_set

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
    ld (hl), ${entityScreenId}                 ; Screen ID (world node index / fallback screen index)

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), ${templateToken}

${animationInitAsm}
${patrolInitAsm}
${collisionInitAsm}
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

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), ${inputSpeed}            ; Cursor speed (px/frame)

${componentMask & 0x0100 ? `    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), ${jumpMax}            ; Maximum jumps before touching ground

` : ''}
${hasSprite ? `    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + ${index}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_${index}

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${index}             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_${index}:

` : '    ; No sprite to show for this entity\n'}
${smInitAsm}
    ret

${updateEntityAsm}
`;
    });

    if (needsPatrolFacingHelper) {
      code += `
; ------------------------------------------------------------------
; update_entity_patrol_facing
; Input: DE = entity index
; Updates entity_sprite_asset_index using directional lookup tables.
; ------------------------------------------------------------------
update_entity_patrol_facing:
    push af
    push bc
    push hl

    ; Guard invalid DE index coming from callers.
    ld a, d
    or a
    jp nz, .patrol_facing_done
    ld a, e
    cp MAX_ENTITIES
    jp nc, .patrol_facing_done

    ; Read base sprite asset index from ROM init table.
    ; This keeps patrol facing within the entity's directional family
    ; and avoids getting stuck in an unrelated 1-layer sprite asset.
    ld hl, entity_sprite_asset_index_init
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .patrol_facing_done
    cp SPRITE_ASSET_COUNT
    jp nc, .patrol_facing_done
    ld c, a
    ld b, 0

    ; Prefer horizontal facing when vel_x != 0
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jr z, .check_vertical
    bit 7, a
    jr nz, .use_left
    ld hl, sprite_dir_right_table
    jr .apply_lookup

.use_left:
    ld hl, sprite_dir_left_table
    jr .apply_lookup

.check_vertical:
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, .patrol_facing_done
    bit 7, a
    jr nz, .use_up
    ld hl, sprite_dir_down_table
    jr .apply_lookup

.use_up:
    ld hl, sprite_dir_up_table

.apply_lookup:
    add hl, bc
    ld a, (hl)

    ld hl, entity_sprite_asset_index
    add hl, de
    ld (hl), a

.patrol_facing_done:
    pop hl
    pop bc
    pop af
    ret

`;
    }
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
