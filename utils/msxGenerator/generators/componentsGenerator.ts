/**
 * @fileoverview Components Generator - ECS component systems
 * Generates components.asm with Position, Sprite, Movement, Collision, Input, and Behavior systems
 * NOW WITH INTELLIGENT FILTERING - Only generates code for components actually used
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { analyzeComponentUsage, ComponentUsageAnalysis } from '../utils/componentAnalyzer';

// ============================================================================
// OPTIMIZED UPDATE_ALL_ENTITIES GENERATOR
// ============================================================================
// Only generates CALLs for components that are actually used in the project
// This saves Z80 cycles by avoiding calls to empty stubs

/**
 * Generate optimized update_all_entities function
 * Only includes CALLs to systems that are actually used
 * @param usedComponents - Set of component names that are used in the project
 * @returns ASM code for update_all_entities
 */
function generateUpdateAllEntities(usedComponents: Set<string>): string {
    let code = `
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
update_all_entities:
`;

    // Define the component systems in execution order
    // Format: [componentName, functionCall, comment]
    const componentSystems: [string, string, string][] = [
        ['Input', 'update_input_component', '1. Input (player control)'],
        ['Shoot', 'update_shoot_component', '2. Shooting'],
        ['Behavior', 'update_behavior_component', '3. Behavior/AI'],
        ['Patrol', 'update_entities', '3b. Patrol/per-entity update'],
        ['Jump', 'update_jump_component', '4. Jump impulse'],
        ['Movement', 'update_movement_component', '5. Movement'],
        ['Cursors', 'update_cursors_component', '5b. Cursors movement'], // comp_cursors
        ['Gravity', 'update_gravity_component', '6. Gravity'],
        ['Position', 'update_position_component', '7. Apply velocity'], // Always needed
        ['Collision', 'prepare_platform_detection', '8a. Clear platform refs'],
        ['Collision', 'update_collision_component', '8b. Collision detection'],
        ['Collision', 'update_platform_riding', '8c. Platform riding'],
        ['WallCollision', 'update_wallcollision_component', '8d. Wall collision'],
        ['Health', 'update_health_component', '9. Health/Death'],
        ['Damage', 'update_damage_component', '10. Damage'],
        ['Animation', 'update_animation_component', '11. Animation'],
        ['AutoDestroy', 'update_auto_destroy_component', '12. Auto-destroy'],
        ['Sprite', 'update_sprite_component', '13. Sprite rendering'],
    ];

    let callCount = 0;
    const processedFunctions = new Set<string>(); // Avoid duplicate calls

    for (const [component, funcCall, comment] of componentSystems) {
        // Position is always needed (entities always have positions)
        const isRequired = component === 'Position' || component === 'Sprite';

        if (isRequired || usedComponents.has(component)) {
            // Avoid duplicate function calls (e.g., multiple Collision entries)
            if (!processedFunctions.has(funcCall)) {
                processedFunctions.add(funcCall);
                code += `    call ${funcCall.padEnd(30)} ; ${comment}\n`;
                callCount++;
            }
        }
    }

    code += `    ret\n`;
    code += `; Total systems called: ${callCount} (optimized from 15)\n\n`;

    return code;
}

// ============================================================================
// HELPER FUNCTIONS - INDIVIDUAL COMPONENT SYSTEMS
// ============================================================================

/**
 * Generate Position Component System
 */
function generatePositionSystem(): string {
    return `
; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

init_position_system:
    ; Initialize position component system
    ; Clear all entity positions
    ld hl, entity_x_pos
    ld de, entity_x_pos+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_y_pos
    ld de, entity_y_pos+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_position_component:
    ; Update positions based on velocities (Movement -> Position)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement OR input component)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jr z, position_next_entity ; Skip velocity if no movement/input source

    ; Skip entities that are not in the currently active screen
    ; Preserve HL because it is the entity_comp_masks loop pointer.
    push hl
    ld hl, entity_screen_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    pop hl
    jp nz, position_next_entity

    push bc
    push hl

    ; Update X Position
    ; X = X + VelX
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; A = VelX
    ld b, a                    ; B = VelX

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a                 ; Store new X

    ; Update Y Position
    ; Y = Y + VelY
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc

position_next_entity:
    inc hl                     ; Next entity mask
    inc c                      ; Next entity index
    djnz position_update_loop
    ret
`;
}

/**
 * Generate Sprite Component System
 */
function generateSpriteSystem(analysis: ProjectAnalysis): string {
    return `
; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call clear_all_sprites
    ; Copy entity_sprite_asset_index from ROM to RAM (so CHANGE_SPRITE can modify it)
    ld hl, entity_sprite_asset_index_init
    ld de, entity_sprite_asset_index
    ld bc, 32
    ldir
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index counter

sprite_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_SPRITE       ; Check if has sprite component
    jp z, sprite_next_entity   ; Skip if no sprite component (jp because distance > 127 bytes)

    ; Skip inactive entities (prevents ghost sprite rendering)
    push hl
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    pop hl
    or a
    jp z, sprite_next_entity

    ; Check if entity is in current screen (multi-screen support)
    push bc
    push hl

    ; Check entity screen ID
    ld hl, entity_screen_id
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity screen ID
    ld a, (hl)                 ; A = entity screen ID

    ; Compare with current screen ID
    ld hl, current_screen_id
    cp (hl)                    ; Compare entity screen with current screen
    jr nz, sprite_hide         ; If different screen, hide sprite

    ; Entity is in current screen - render normally
    ; E already contains entity index (from line 129)
    ; D = 0 (from line 130)
    
    ; Get entity position (X, Y)
    ld hl, entity_x_pos
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Get sprite configuration (Base HW Sprite + Layer Count)
    ; E still contains entity index, D = 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2 (2 bytes per entry)
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite (Current HW Sprite)
    ld a, h
    or a
    jp z, sprite_continue      ; No layers -> skip rendering
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position

    ; Calculate Pattern: Pattern = HW Sprite Index * 4 (for 16x16 sprites)
    ld a, l
    sla a                      ; * 2
    sla a                      ; * 4
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)

    ; Get Color from sprite_layer_colors table
    ; Table is indexed by HW Sprite Index (L)
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_colors[hwSprite]
    ld a, (de)                 ; A = Color
    pop de                     ; Restore D (Pattern)
    ld e, a                    ; E = Color
    
    ; Call show_sprite (A=HW Sprite, B=X, C=Y, D=Pattern, E=Color)
    ld a, l                    ; A = HW Sprite
    call show_sprite
    
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
    jr sprite_continue

sprite_hide:
    ; Entity is in different screen - hide sprite (Y = 208+)
    ; We must hide ALL layers for this entity
    ; E contains Entity Index (from line 129)
    ; D = 0 (from line 130)

    ld hl, entity_sprite_config
    add hl, de
    add hl, de

    inc hl                     ; Point to Layer Count first
    ld b, (hl)                 ; B = Layer Count
    dec hl                     ; Back to Base HW Sprite
    ld a, b
    or a
    jr z, sprite_continue      ; Nothing to hide for anchor entities
    ld a, (hl)                 ; A = Base HW Sprite (read AFTER zero check)

sprite_hide_loop:
    push bc
    push af
    call hide_sprite           ; A = HW Sprite (correct base index)
    pop af
    pop bc

    inc a                      ; Next HW Sprite
    djnz sprite_hide_loop

sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    dec b                      ; Decrement loop counter
    jp nz, sprite_update_loop  ; Jump if not zero (djnz replacement for long jumps)

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret

; ==================================================================
; HELPER: Force update a single entity's sprite (used by init_entities)
; Input: C = Entity Index
; ==================================================================
force_update_entity_sprite:
    push bc
    push de
    push hl
    
    ; Get X/Y from memory
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = X
    
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                 ; C = Y
    
    ; E still has Entity Index, D = 0
    ; B = X, C = Y
    
    ; Get Config
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite
    ld a, h
    or a
    jr z, force_sprite_done    ; Skip if no layers for this entity

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position

    ; Calculate Pattern: Pattern = HW Sprite Index * 4 (for 16x16 sprites)
    ld a, l
    sla a                      ; * 2
    sla a                      ; * 4
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)

    ; Get Color
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de                     ; Restore D
    ld e, a                    ; E = Color
    
    ; Call show_sprite
    ld a, l                    ; A = HW Sprite
    call show_sprite
    
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    dec h
    jr nz, force_sprite_layer_loop

force_sprite_done:
    pop hl
    pop de
    pop bc
    ret
`;
}
function generateMovementSystem(): string {
    return `
        ; ==================================================================
        ; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
        ; ==================================================================

        init_movement_system:
            ; Initialize movement / physics system
            ; Clear all entity velocities (32 entries each)
            ld hl, entity_vel_x
            ld de, entity_vel_x + 1
            ld bc, 31
            ld (hl), 0
            ldir

            ld hl, entity_vel_y
            ld de, entity_vel_y + 1
            ld bc, 31
            ld (hl), 0
            ldir
    ret

        update_movement_component:
            ; Update movement / physics for entities
            ld b, 32                   ; Loop through all entities
            ld hl, entity_comp_masks   ; Check component masks
            ld c, 0                    ; Entity index

        movement_update_loop:
            ld a, (hl)                 ; Get entity component mask
            and COMP_MASK_MOVEMENT     ; Check if has movement component
            jr z, movement_next_entity ; Skip if no movement component

            ; Apply physics / movement logic here
            push bc
            push hl

            ; 1. Apply Gravity (if applicable - TODO: check Gravity component)
            ; For now, just simple friction / damping if no input

            ; 2. Friction / Damping
            ; If velocity is non-zero, reduce it slightly (simple approach)
            ; This prevents infinite sliding

            ; X Velocity Damping
            ld hl, entity_vel_x
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            or a
            jr z, movement_check_y_vel

            ; If positive, dec; if negative, inc (move towards 0)
            bit 7, a                   ; Check sign
            jr nz, movement_vel_x_neg
            dec (hl)                   ; Positive -> decrease
            jr movement_check_y_vel
        movement_vel_x_neg:
            inc (hl)                   ; Negative -> increase

        movement_check_y_vel:
            ; Y Velocity Damping
            ld hl, entity_vel_y
            add hl, de
            ld a, (hl)
            or a
            jr z, movement_physics_done

            bit 7, a
            jr nz, movement_vel_y_neg
            dec (hl)
            jr movement_physics_done
        movement_vel_y_neg:
            inc (hl)

        movement_physics_done:
            pop hl
            pop bc

        movement_next_entity:
            inc hl                     ; Next entity mask
            inc c                      ; Next entity index
            dec b                      ; Decrement loop counter
            jp nz, movement_update_loop
    ret
    `;
}

/**
 * Generate Collision Component System
 */
function generateCollisionSystem(analysis: ProjectAnalysis): string {
    // MSX Screen 2 ALWAYS uses 8x8 character cells for the Name Table (32x24 grid)
    // The behavior map maps 1:1 to the Name Table, so pixel-to-tile conversion
    // must ALWAYS divide by 8, regardless of the project's visual tile dimensions.
    const msxCharSize = 8;     // MSX character cell is always 8x8 pixels
    const tilesPerRow = 32;    // 256 / 8 = 32 columns
    const tilesPerColumn = 24; // 192 / 8 = 24 rows
    const shiftAmount = 3;     // 8 = 2^3, so 3 shifts to divide by 8

    const xDivisionCode = Array.from({ length: shiftAmount },
        (_, i) => `    srl a                      ; A = X / ${Math.pow(2, i + 1)}`).join('\n');

    const yDivisionCode = Array.from({ length: shiftAmount },
        (_, i) => `    srl a                      ; A = Y / ${Math.pow(2, i + 1)}`).join('\n');

    const tileInfo = `; MSX Screen 2: behavior map is 32x24 (one entry per 8x8 character cell)
    ; Always divide by 8 to convert pixels to character column/row
    ; Convert X to tile column (divide by 8)`;

    return `
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ; Clear deadly collision flags
    ld hl, entity_deadly_collision
    ld de, entity_deadly_collision + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Clear entity-entity collision flags
    ld hl, entity_entity_collision_flags
    ld de, entity_entity_collision_flags + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize last collided entity to "none"
    ld hl, entity_last_collision_entity
    ld de, entity_last_collision_entity + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Default collision hitboxes: 16x16 with no offset
    ld hl, entity_collision_hitbox_w
    ld de, entity_collision_hitbox_w + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_hitbox_h
    ld de, entity_collision_hitbox_h + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_offset_x
    ld de, entity_collision_offset_x + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_collision_offset_y
    ld de, entity_collision_offset_y + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

    update_collision_component:
    ; Ground detection for entities with Collision or Gravity components
    ; Sets entity_on_ground flag based on Y position
    ld b, 32                      ; Loop through all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Gravity component
    ld de, entity_comp_masks      ; Low byte for Collision component
    ld c, 0                       ; Entity index

    collision_update_loop:
    ; Check if entity has Collision OR Gravity component
    ld a, (de)                    ; Get low byte (Collision is bit 3)
    and COMP_MASK_COLLISION
    jr nz, .has_collision_comp    ; Has Collision component

    ld a, (hl)                    ; Get high byte (Gravity is bit 1)
    and #02                       ; COMP_MASK_GRAVITY high byte
    jp z, collision_next_entity   ; Skip if no collision or gravity (JP for long jump)

.has_collision_comp:
    ; Get entity Y position
    push bc
    push hl
    push de

    ld hl, entity_y_pos
    ld e, c                       ; Entity index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = Y position

    ; Ground detection: check if Y >= GROUND_LEVEL (176 for 16x16 sprites on 192px screen)
    ; GROUND_LEVEL = 192 - 16 = 176
    cp 176
    jr c, .not_on_ground          ; Y < 176, entity is in air

.on_ground:
    ; Clamp Y to ground level
    ld (hl), 176

    ; Set entity_on_ground flag (bit 0)
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as on ground
    jr .ground_check_done

.not_on_ground:
    ; Not on ground tiles, but check platform_id and grace frames
    ; Entity is grounded if: on tiles OR on platform OR has grace frames

    ; Check if entity has platform reference
    push hl
    ld hl, entity_platform_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = platform_id
    cp 255
    jr nz, .grounded_by_platform  ; Has platform, mark grounded

    ; No platform, check grace frames
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)                    ; A = grace frames
    or a
    jr nz, .grounded_by_platform  ; Has grace, mark grounded

    ; No tiles, no platform, no grace - entity is in air
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Mark as in air
    jr .ground_check_done

.grounded_by_platform:
    ; Entity is grounded by platform or grace frames
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as grounded

.ground_check_done:
    ; Check for deadly tile collision (lava, spikes, etc.)
    ; Get entity position (x, y)
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld d, (hl)                    ; D = X position

    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld e, (hl)                    ; E = Y position

    ; Get tile at entity's feet position (center-bottom)
    push bc
    push de
    ld a, d
    add a, 8                      ; Center X (assuming 16-pixel wide entity)
    ld d, a
    ld a, e
    add a, 15                     ; Bottom Y (assuming 16-pixel tall entity)
    ld e, a
    call get_tile_at_position     ; A = tile ID
    call get_tile_behavior        ; A = behavior flags
    pop de
    pop bc

    ; Check if tile is deadly (bit 3 = TILE_DEADLY)
    bit 3, a
    jr z, .no_deadly_tile         ; Not deadly, safe

    ; Entity is touching deadly area - set flag
    ld hl, entity_deadly_collision
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as touching deadly tile
    jr .deadly_check_done

.no_deadly_tile:
    ; Clear deadly tile flag
    ld hl, entity_deadly_collision
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Clear deadly flag

.deadly_check_done:
    pop de
    pop hl
    pop bc

    collision_next_entity:
    inc hl                        ; Next entity high mask
    inc de                        ; Next entity low mask
    inc c                         ; Next entity index
    dec b                         ; Decrement loop counter
    jp nz, collision_update_loop

    ; Run lightweight entity-entity collision pass (player sources only)
    call update_entity_collision_fast
    ret

update_entity_collision_fast:
    ; Update every 2 frames using interrupt counter bit0.
    ; Latching policy: skipped frame keeps previous collision result.
    ld hl, interrupt_counter
    ld a, (hl)
    and 1
    ret nz

    ld c, 0                       ; C = source entity index

uecf_source_loop:
    ld a, c
    cp 32
    ret z

    ; Source must be active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jp z, uecf_next_source

    ; Source must have Collision component
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jp z, uecf_next_source

    ; Source must be in current screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, uecf_next_source

    ; Source filter: only entities with collisionLayer bit0 set (player layer mask = 1)
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)
    and 1
    jp z, uecf_next_source

    ; Clear source collision latch before recomputing this frame
    ld hl, entity_entity_collision_flags
    add hl, de
    ld (hl), 0
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), 255

    ; Cache source AABB in scratch bytes
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    add a, (hl)
    ld (temp_byte_1), a           ; source left

    ld hl, entity_collision_hitbox_w
    add hl, de
    add a, (hl)
    ld (temp_byte_2), a           ; source right

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    add a, (hl)
    ld (wall_temp_x), a           ; source top

    ld hl, entity_collision_hitbox_h
    add hl, de
    add a, (hl)
    ld (wall_temp_y), a           ; source bottom

    ld b, 0                       ; B = target entity index

uecf_target_loop:
    ld a, b
    cp 32
    jp z, uecf_next_source

    ; Skip self
    ld a, b
    cp c
    jp z, uecf_next_target

    ; Target must be active
    ld hl, entity_active
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jp z, uecf_next_target

    ; Target must have Collision component
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jp z, uecf_next_target

    ; Target must be in current screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, uecf_next_target

    ; Mutual layer mask check:
    ; source.collidesWith includes target.layer
    ld hl, entity_collides_with
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_layer
    ld e, b
    ld d, 0
    add hl, de
    and (hl)
    jp z, uecf_next_target

    ; target.collidesWith includes source.layer
    ld hl, entity_collides_with
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_layer
    ld e, c
    ld d, 0
    add hl, de
    and (hl)
    jp z, uecf_next_target

    ; --- AABB overlap test with per-entity hitboxes ---
    ; target left
    ld hl, entity_x_pos
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    add a, (hl)
    ld (wall_entity_idx), a

    ; source.right <= target.left => no overlap
    ld a, (temp_byte_2)
    ld hl, wall_entity_idx
    cp (hl)
    jp c, uecf_next_target
    jp z, uecf_next_target

    ; target right
    ld a, (wall_entity_idx)
    ld hl, entity_collision_hitbox_w
    ld e, b
    ld d, 0
    add hl, de
    add a, (hl)
    ld (wall_entity_idx), a

    ; source.left >= target.right => no overlap
    ld a, (temp_byte_1)
    ld hl, wall_entity_idx
    cp (hl)
    jp nc, uecf_next_target

    ; target top
    ld hl, entity_y_pos
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    add a, (hl)
    ld (wall_entity_idx), a

    ; source.bottom <= target.top => no overlap
    ld a, (wall_temp_y)
    ld hl, wall_entity_idx
    cp (hl)
    jp c, uecf_next_target
    jp z, uecf_next_target

    ; target bottom
    ld a, (wall_entity_idx)
    ld hl, entity_collision_hitbox_h
    ld e, b
    ld d, 0
    add hl, de
    add a, (hl)
    ld (wall_entity_idx), a

    ; source.top >= target.bottom => no overlap
    ld a, (wall_temp_x)
    ld hl, wall_entity_idx
    cp (hl)
    jp nc, uecf_next_target

    ; First hit latch: store target and classify flags
    ld hl, entity_last_collision_entity
    ld e, c
    ld d, 0
    add hl, de
    ld a, b
    ld (hl), a

    ld hl, entity_collision_layer
    ld e, b
    ld d, 0
    add hl, de
    ld d, (hl)                    ; D = target layer bitmask

    ld a, 1                       ; bit0: any
    bit 1, d                      ; enemy layer mask = 2
    jr z, .uecf_no_enemy
    or 2                          ; bit1: enemy
.uecf_no_enemy:
    bit 4, d                      ; item layer mask = 16
    jr z, .uecf_no_item
    or 4                          ; bit2: item
.uecf_no_item:
    ld hl, entity_entity_collision_flags
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), a

    ; First hit only per source entity
    jp uecf_next_source

uecf_next_target:
    inc b
    jp uecf_target_loop

uecf_next_source:
    inc c
    jp uecf_source_loop

        ; ==================================================================
; COLLISION HELPER FUNCTIONS(Critical for Gameplay Parity)
        ; ==================================================================

            check_tile_collision:
    ; Check collision with background tiles
        ; A = X position, B = Y position
        ; Convert pixel position to tile coordinates
    push af
    push bc

        ; DYNAMIC TILE SIZE CONVERSION
        ; TODO: This should be calculated from actual screen map tile sizes
        ; For now, detect most common tile size in project
${tileInfo}

${xDivisionCode}
    ld c, a; C = tile column

        ; Convert Y to tile row (divide by ${msxCharSize})
    ld a, b
${yDivisionCode}
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp ${tilesPerRow}; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${tilesPerColumn}; Screen height in tiles
    jr nc, no_tile_collision

        ; Get tile at position(simplified - would read from behavior map)
        ; For now, assume all non - zero tiles are solid
        ; This would read from the behavior map generated from screen data
    call get_behavior_tile; Returns A = behavior value
    or a
    jr z, no_tile_collision; 0 = passable

        ; Collision detected - handle it
    call handle_tile_collision

    no_tile_collision:
    pop bc
    pop af
    ret

    check_entity_collision:
    ; Check collision with other entities
        ; A = current entity X, B = current entity Y, C = current entity index
    push bc
    push af

        ; Loop through all other entities
    ld hl, entity_comp_masks
    ld e, 0; Other entity index

    entity_collision_loop:
    ld a, e
    cp c; Skip self
    jr z, next_entity_collision

        ; Check if other entity has collision component
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, next_entity_collision

        ; Get other entity position
    push hl
    push de

    ld hl, entity_x_pos
    ld d, 0
    add hl, de; HL points to other entity X
    ld d, (hl); D = other X

    push de; Save D=otherX, E=otherIndex
    ld d, 0; Reset D for correct address calculation
    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld a, (hl); A = other Y
    pop de; Restore D=otherX, E=otherIndex
    ld e, a; E = other Y

        ; Check if entities overlap(16x16 sprites)
            ; Current entity: A = X, B = Y
                ; Other entity: D = X, E = Y

                    ; X overlap check: | X1 - X2 | <16
    ld h, a; H = current X
    ld a, d; A = other X
    sub h; A = other X - current X
    jr nc, x_diff_positive; Jump if positive
    neg; Make positive
    x_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No X overlap

        ; Y overlap check: | Y1 - Y2 | <16
    ld a, e; A = other Y
    sub b; A = other Y - current Y
    jr nc, y_diff_positive; Jump if positive
    neg; Make positive
    y_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No Y overlap

        ; Collision detected!
    call handle_entity_collision

    no_entity_collision:
    pop de
    pop hl

    next_entity_collision:
    inc hl; Next entity mask
    inc e; Next entity index
    ld a, e
    cp 32; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

    handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_entity_collision:
    ; Handle collision between entities
    ; At entry:
    ;   C = current entity index
    ;   Stack top: DE (E = other entity index), HL, AF, BC
    ; Check for platform riding: if current entity is above other entity and
    ; other entity is a platform (collision_layer & 8), set platform reference

    push bc
    push de
    push hl

    ; Get other entity index from stack (it's at SP+6)
    ld hl, 6
    add hl, sp
    ld a, (hl)              ; A = other entity index (E from pushed DE)
    ld e, a                 ; E = other entity index

    ; Get current entity Y position
    ld hl, entity_y_pos
    ld d, 0
    ld b, c                 ; B = current entity index
    add hl, bc              ; HL = &entity_y_pos[current]
    ld b, (hl)              ; B = current Y

    ; Get other entity Y position
    ld hl, entity_y_pos
    ld d, 0
    add hl, de              ; HL = &entity_y_pos[other]
    ld d, (hl)              ; D = other Y

    ; Check if current entity is above other entity
    ; Current is above if: current_Y + 16 is near other_Y (within 4 pixels)
    ld a, b                 ; A = current Y
    add a, 16               ; A = current Y + height
    sub d                   ; A = (current Y + 16) - other Y
    ; If result is 0-4, current is standing on other
    cp 5
    jr nc, .not_on_platform ; Not standing on platform

    ; Current entity is above other entity
    ; Check if other entity is a platform (collision_layer & 8)
    ld hl, entity_collision_layer
    ld d, 0
    add hl, de              ; HL = &entity_collision_layer[other]
    ld a, (hl)              ; A = other entity collision layer
    and 8                   ; Check bit 3 (platform layer)
    jr z, .not_on_platform  ; Not a platform

    ; Other entity IS a platform - set platform reference
    ld a, e                 ; A = other entity index
    ld hl, entity_platform_id
    ld d, 0
    ld e, c                 ; E = current entity index
    add hl, de              ; HL = &entity_platform_id[current]
    ld (hl), a              ; Set platform reference

    ; Reset grace frames to 0 (we're on a platform now)
    ld hl, entity_platform_grace
    ld e, c
    add hl, de
    ld (hl), 0

.not_on_platform:
    pop hl
    pop de
    pop bc
    ret

        `;
}

/**
 * Generate get_behavior_tile function (shared by Collision and WallCollision systems)
 * Returns behavior value for a tile at (B=row, C=column) using current_behavior_map
 */
function generateGetBehaviorTile(): string {
    return `
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; Get behavior value for tile at (B=row, C=column)
    ; Returns A = behavior value (0 = passable, non-zero = solid)
    ; Uses current_behavior_map pointer set by load_screen
    ; ------------------------------------------------------------------
get_behavior_tile:
    ; Bounds check: row must be 0-23, column must be 0-31
    ld a, b
    cp 24
    jr nc, .bt_out_of_bounds      ; Row >= 24: treat as passable
    ld a, c
    cp 32
    jr nc, .bt_out_of_bounds      ; Column >= 32: treat as passable
    push hl
    push de
    ; Calculate index = row * 32 + column
    ld a, b
    ld l, a
    ld h, 0                       ; HL = row
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    ld e, c
    ld d, 0
    add hl, de                    ; HL = row * 32 + column
    ld de, (current_behavior_map) ; DE = pointer to behavior map
    add hl, de                    ; HL = address of behavior byte
    ld a, (hl)                    ; A = behavior value
    pop de
    pop hl
    ret
.bt_out_of_bounds:
    xor a                         ; A = 0 (passable)
    ret
    `;
}

/**
 * Generate Input Component System with direction restrictions (Cursors component)
 */
function generateInputSystem(): string {
    return `
        ; ==================================================================
        ; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
        ; ==================================================================

; Direction flags for Cursors component
DIR_ALLOW_UP     EQU #01 ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02 ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04 ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08 ; Bit 3: Allow RIGHT movement

        init_input_system:
            ; Initialize input handling system
            xor a
            ld (input_state), a
            ld (prev_input_state), a
            ld (input_btn_curr), a
            ld (input_btn_prev), a
            ld (input_fire), a

            ; Initialize direction masks for all entities (default: all directions allowed)
            ld hl, entity_dir_mask
            ld de, entity_dir_mask + 1
            ld bc, 31
            ld (hl), #0F               ; Default: 00001111 = all directions enabled
            ldir
            ret

        update_input_component:
            ; Update input handling for player entities
            ; NOTE: input_state/prev_input_state are polled by interrupt task_update_input

            ; Process input for entities with input component
            ld b, 32                   ; Loop through all entities
            ld hl, entity_comp_masks   ; Check component masks
            ld c, 0                    ; Entity index

        input_update_loop:
            ld a, (hl)                 ; Get entity component mask
            and COMP_MASK_INPUT        ; Check if has input component
            jp z, input_next_entity    ; Skip if no input component

            ; Skip entities that are not in the currently active screen
            ; Preserve HL because it is the entity_comp_masks loop pointer.
            push hl
            ld hl, entity_screen_id
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, current_screen_id
            cp (hl)
            pop hl
            jp nz, input_next_entity

            ; Apply input to entity movement (real implementation)
            push bc
            push hl

            ; Get direction mask for this entity
            ld hl, entity_dir_mask
            ld e, c
            ld d, 0
            add hl, de
            ld d, (hl)                 ; D = direction mask (allowUp / Down / Left / Right)

            ; Convert joystick input to velocity
            ld a, (input_state)
            ld b, 0                    ; Default X velocity
            ld c, 0                    ; Default Y velocity

            ; Check directional input with direction restrictions
            cp STICK_UP
            jp z, input_move_up
            cp STICK_DOWN
            jp z, input_move_down
            cp STICK_LEFT
            jp z, input_move_left
            cp STICK_RIGHT
            jp z, input_move_right
            cp STICK_UPRIGHT
            jp z, input_move_upright
            cp STICK_UPLEFT
            jp z, input_move_upleft
            cp STICK_DOWNRIGHT
            jp z, input_move_downright
            cp STICK_DOWNLEFT
            jp z, input_move_downleft
            jp input_apply_velocity

        input_move_up:
            ; Check if UP is allowed (bit 0)
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_apply_velocity ; Not allowed, skip
            ld c, -2                   ; Negative Y velocity (up)
            jp input_apply_velocity

        input_move_down:
            ; Check if DOWN is allowed (bit 1)
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_apply_velocity ; Not allowed, skip
            ld c, 2                    ; Positive Y velocity (down)
            jp input_apply_velocity

        input_move_left:
            ; Check if LEFT is allowed (bit 2)
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity ; Not allowed, skip
            ld b, -2                   ; Negative X velocity (left)
            jp input_apply_velocity

        input_move_right:
            ; Check if RIGHT is allowed (bit 3)
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity ; Not allowed, skip
            ld b, 2                    ; Positive X velocity (right)
            jp input_apply_velocity

        input_move_upright:
            ; Check if both UP and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_right_only ; UP not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_up_only  ; RIGHT not allowed
            ; Both allowed - diagonal
            ld b, 1                    ; Diagonal movement (slower)
            ld c, -1
            jp input_apply_velocity
        input_check_right_only:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld b, 2
            jp input_apply_velocity
        input_check_up_only:
            ; Only UP allowed
            ld c, -2
            jp input_apply_velocity

        input_move_upleft:
            ; Check if both UP and LEFT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_left_only1 ; UP not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_up_only1 ; LEFT not allowed
            ; Both allowed - diagonal
            ld b, -1
            ld c, -1
            jp input_apply_velocity
        input_check_left_only1:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld b, -2
            jp input_apply_velocity
        input_check_up_only1:
            ; Only UP allowed
            ld c, -2
            jp input_apply_velocity

        input_move_downright:
            ; Check if both DOWN and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_right_only2 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_down_only2 ; RIGHT not allowed
            ; Both allowed - diagonal
            ld b, 1
            ld c, 1
            jp input_apply_velocity
        input_check_right_only2:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld b, 2
            jp input_apply_velocity
        input_check_down_only2:
            ; Only DOWN allowed
            ld c, 2
            jp input_apply_velocity

        input_move_downleft:
            ; Check if both DOWN and LEFT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_left_only3 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_down_only3 ; LEFT not allowed
            ; Both allowed - diagonal
            ld b, -1
            ld c, 1
            jp input_apply_velocity
        input_check_left_only3:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld b, -2
            jp input_apply_velocity
        input_check_down_only3:
            ; Only DOWN allowed
            ld c, 2

        input_apply_velocity:
            ; Apply calculated velocity to entity
            ; B = X velocity, C = Y velocity, E = entity index (preserved from earlier)
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), b                 ; entity_vel_x[entity_index] = X velocity

            ld hl, entity_vel_y
            add hl, de
            ld (hl), c                 ; entity_vel_y[entity_index] = Y velocity

            pop hl
            pop bc

        input_next_entity:
            inc hl                     ; Next entity
            inc c                      ; Next entity index
            dec b                      ; Decrement loop counter
            jp nz, input_update_loop
            ret
    `;
}

/**
 * Generate Behavior Component System
 */
function generateBehaviorSystem(): string {
    return `
    ; ==================================================================
        ; BEHAVIOR COMPONENT SYSTEM(Based on BehaviorEditor logic)
    ; ==================================================================

        init_behavior_system:
; Initialize AI / behavior system
            ret

update_behavior_component:
; Update AI / behavior logic for entities
            ld b, 32                   ; Loop through all entities
            ld hl, entity_comp_masks; Check component masks

behavior_update_loop:
            ld a, (hl); Get entity component mask
            and COMP_MASK_BEHAVIOR; Check if has behavior component
            jr z, behavior_next_entity; Skip if no behavior component

    ; Execute behavior scripts / AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
            inc hl; Next entity
            dec b; Decrement loop counter
            jp nz, behavior_update_loop
            ret
    `;
}

/**
 * Generate Gravity Component System
 */
function generateGravitySystem(): string {
    return `
    ; ==================================================================
        ; GRAVITY COMPONENT SYSTEM(Constant downward acceleration)
    ; ==================================================================

        init_gravity_system:
; Initialize gravity system
    ; Clear gravity velocities
            ld hl, entity_gravity_vel
            ld de, entity_gravity_vel + 1
            ld bc, 63; 64 bytes - 1(32 words)
            ld (hl), 0
            ldir
            ret

update_gravity_component:
; Apply gravity acceleration to entities
            ld b, 32; Loop through all entities
            ld hl, entity_comp_masks_hi; Check component masks (high byte)
            ld c, 0; Entity index

gravity_update_loop:
            ld a, (hl); Get entity component mask high byte
            and #02; Check COMP_MASK_GRAVITY(#0200) => bit 1 in high byte
            jr z, gravity_next_entity; Skip if no gravity component

    ; Skip entities that are not in the currently active screen
    ; Preserve HL because it is the entity_comp_masks_hi loop pointer.
            push hl
            ld hl, entity_screen_id
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, current_screen_id
            cp (hl)
            pop hl
            jp nz, gravity_next_entity

    ; Entity has gravity - apply acceleration
            push bc
            push hl

    ; Check if entity is grounded
            ld hl, entity_on_ground
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            bit 0, a; Check ground flag
            jr nz, gravity_grounded; Skip gravity if on ground

    ; Apply gravity acceleration
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de; HL points to gravity velocity(word)

            ld e, (hl); Load current gravity velocity
            inc hl
            ld d, (hl)

    ; Add gravity strength(64 in fixed - point = ~0.25 pixels / frame acceleration)
            ld a, e
            add a, #40; Add 64 to low byte
            ld e, a
            ld a, d
            adc a, #00; Add carry to high byte
            ld d, a

    ; Check terminal velocity(1024 = max fall speed)
    ; Skip cap if velocity is negative (entity is moving UP / jumping)
            ld a, d
            bit 7, a; Check sign bit - negative means going up
            jr nz, gravity_store_vel; Skip cap for upward velocity
            cp #04; Check if >= 1024 (unsigned, only for positive/downward)
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

gravity_store_vel:
; Store updated gravity velocity
            dec hl
            ld (hl), e
            inc hl
            ld (hl), d

    ; Set entity_vel_y to gravity integer part
    ; Position component will apply vel_y to Y position
    ; Wall collision can then detect vertical movement and snap back
            push de                ; Save gravity velocity (D=integer part)
            ld hl, entity_vel_y
            ld e, c                ; E = entity index
            ld d, 0
            add hl, de             ; HL = &entity_vel_y[entity]
            pop de                 ; Restore gravity velocity
            ld (hl), d             ; vel_y = gravity velocity integer part

            jr gravity_done

gravity_grounded:
; Entity is grounded - reset gravity velocity
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de
            ld (hl), 0; Clear velocity low
            inc hl
            ld (hl), 0; Clear velocity high

gravity_done:
            pop hl
            pop bc

gravity_next_entity:
            inc hl; Next entity mask (high byte)
            inc c; Next entity index
            dec b; Decrement loop counter
            jp nz, gravity_update_loop
    ret
    `;
}

/**
 * Generate Health Component System
 */
function generateHealthSystem(): string {
    return `
    ; ==================================================================
    ; HEALTH COMPONENT SYSTEM
    ; ==================================================================
    ; Manages entity health/lives (current, max)
    ; Detects death when current <= 0
    ; Provides DECREASE_LIVES and INCREASE_LIVES functionality
    ; ==================================================================

init_health_system:
    ; Initialize health for all entities with Health component
    ; Default: current = 3, max = 3 (configurable per entity)
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Health bit
    ld c, 0                       ; Entity index

.init_loop:
    ld a, (hl)
    and #04                       ; COMP_MASK_HEALTH (bit 2 in high byte = #0400)
    jr z, .init_next_entity       ; Skip if no health component

    ; Initialize current health (default: 3)
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 3                    ; Default current = 3

    ; Initialize max health (default: 3)
    ld hl, entity_health_max
    add hl, de
    ld (hl), 3                    ; Default max = 3
    pop hl
    pop bc

.init_next_entity:
    inc hl
    inc c
    djnz .init_loop
    ret

update_health_component:
    ; Check for death (current <= 0) and mark entities as dead
    ; Entity death is detected by state machine via HEALTH_LESS_THAN condition
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi   ; Check for Health component
    ld c, 0                       ; Entity index

.health_update_loop:
    ld a, (hl)
    and #04                       ; COMP_MASK_HEALTH
    jr z, .health_next_entity

    ; Check current health
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Check if dead (current <= 0)
    or a                          ; Set flags
    jr nz, .health_alive          ; If != 0, entity is alive

    ; Entity is dead (current = 0)
    ; Could trigger death state here, but state machine handles it
    ; via HEALTH_LESS_THAN or HEALTH_EQUALS conditions

.health_alive:
    pop hl
    pop bc

.health_next_entity:
    inc hl
    inc c
    djnz .health_update_loop
    ret

; ==================================================================
; HEALTH HELPER FUNCTIONS (called by State Machine actions)
; ==================================================================

decrease_entity_lives:
    ; Decrease lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to decrease
    ; Output: Updated entity_health_current
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health
    sub b                         ; Subtract amount
    jr nc, .store_health          ; If no carry (result >= 0), store
    xor a                         ; Clamp to 0 if negative
.store_health:
    ld (hl), a                    ; Store new health
    pop bc
    ret

increase_entity_lives:
    ; Increase lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to increase
    ; Output: Updated entity_health_current (clamped to max)
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B

    ; Get current health
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Add amount
    add a, b
    ld b, a                       ; Save result in B

    ; Get max health
    ld hl, entity_health_max
    add hl, de
    ld a, (hl)                    ; A = max health

    ; Clamp to max
    cp b                          ; Compare max with result
    jr nc, .store_result          ; If max >= result, use result
    ld b, a                       ; Otherwise clamp to max

.store_result:
    ld hl, entity_health_current
    add hl, de
    ld (hl), b                    ; Store clamped health
    pop bc
    ret
    `;
}

/**
 * Generate Damage Component System with Invincibility Frames
 */
function generateDamageSystem(): string {
    return `
    ; ==================================================================
    ; DAMAGE COMPONENT SYSTEM
    ; ==================================================================
    ; Manages damage dealing and invincibility frames
    ;
    ; Components:
    ; - entity_invincibility_frames: Countdown timer for invulnerability (32 bytes)
    ; - entity_damage_amount: How much damage this entity deals (32 bytes)
    ;
    ; Invincibility frames prevent damage for ~1 second after being hit

init_damage_system:
    ; Initialize invincibility frames to 0 for all entities
    ld hl, entity_invincibility_frames
    ld de, entity_invincibility_frames + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize damage amounts (default: 1 damage per entity)
    ld hl, entity_damage_amount
    ld de, entity_damage_amount + 1
    ld bc, 31
    ld (hl), 1
    ldir
    ret

update_damage_component:
    ; Update invincibility frames for all entities with Damage component
    ; Decrements invincibility_frames counter each frame
    ld b, 32                      ; Loop through all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Damage component
    ld c, 0                       ; Entity index

.damage_update_loop:
    ld a, (hl)
    and #08                       ; COMP_MASK_DAMAGE (bit 3 in high byte = #0800)
    jr z, .damage_next_entity     ; Skip if no damage component

    ; Decrement invincibility frames if > 0
    push bc
    push hl

    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current invincibility frames
    or a                          ; Check if 0
    jr z, .damage_frames_done     ; Already 0, skip

    dec a                         ; Decrement
    ld (hl), a                    ; Store back

.damage_frames_done:
    pop hl
    pop bc

.damage_next_entity:
    inc hl                        ; Next entity high mask
    inc c                         ; Next entity index
    djnz .damage_update_loop
    ret

; ==================================================================
; DAMAGE HELPER FUNCTIONS
; ==================================================================

apply_damage_to_entity:
    ; Apply damage to entity and set invincibility frames
    ; Input: C = entity index, A = damage amount
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; B = damage amount

    ; Check if entity has invincibility frames active
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr nz, .damage_blocked        ; Still invincible, block damage

    ; Apply damage using decrease_entity_lives
    ld a, b                       ; A = damage amount
    call decrease_entity_lives    ; C still holds entity index

    ; Set invincibility frames (60 frames = 1 second @ 60 FPS)
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 60                   ; 1 second of invincibility

.damage_blocked:
    pop bc
    ret

check_entity_invincible:
    ; Check if entity is currently invincible
    ; Input: C = entity index
    ; Output: A = 1 if invincible, 0 if vulnerable
    ; Destroys: DE, HL
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a                          ; Sets Z flag if 0
    ret z                         ; Return 0 if vulnerable

    ld a, 1                       ; Return 1 if invincible
    ret
    `;
}

/**
 * Generate Shoot Component System
 */
function generateShootSystem(): string {
    return `
    ; ==================================================================
    ; SHOOT COMPONENT SYSTEM
    ; ==================================================================
    ; Manages shooting/projectile spawning with cooldown
    ;
    ; Components:
    ; - entity_shoot_cooldown: Frames until can shoot again (32 bytes)
    ; - entity_shoot_sprite_id: Sprite ID for projectile (32 bytes)
    ; - entity_shoot_speed: Projectile velocity (32 bytes)
    ;
    ; Fire button detection integrated with input system

init_shoot_system:
    ; Initialize cooldowns to 0 (can shoot immediately)
    ld hl, entity_shoot_cooldown
    ld de, entity_shoot_cooldown + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize default projectile speed (3 pixels/frame)
    ld hl, entity_shoot_speed
    ld de, entity_shoot_speed + 1
    ld bc, 31
    ld (hl), 3
    ldir

    ; Initialize sprite IDs to 0 (will be set by template data)
    ld hl, entity_shoot_sprite_id
    ld de, entity_shoot_sprite_id + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_shoot_component:
    ; Update shooting for all entities with Shoot component
    ; Decrements cooldown and spawns projectile if fire pressed
    ld b, 32                      ; Loop through all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Shoot component
    ld c, 0                       ; Entity index

.shoot_update_loop:
    ld a, (hl)
    and #10                       ; COMP_MASK_SHOOT (bit 4 in high byte = #1000)
    jr z, .shoot_next_entity      ; Skip if no shoot component

    ; Decrement cooldown if > 0
    push bc
    push hl

    ld hl, entity_shoot_cooldown
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current cooldown
    or a                          ; Check if 0
    jr z, .usc_check_fire         ; Cooldown expired, check fire button

    ; Decrement cooldown
    dec a
    ld (hl), a
    jr .shoot_done                ; Still cooling down, skip

.usc_check_fire:
    ; Check if fire button is pressed
    ld a, (input_fire)
    or a
    jr z, .shoot_done             ; Fire not pressed, skip

    ; Fire button pressed - spawn projectile
    call .spawn_projectile
    jr .shoot_done

.spawn_projectile:
    ; Spawn projectile entity
    ; Input: C = shooter entity index
    ; Destroys: AF, DE, HL
    push bc
    push de

    ; Find free entity slot
    ld hl, entity_comp_masks
    ld b, 32                      ; Check up to 32 entities
    ld d, 0                       ; Free slot index

.find_free_slot:
    ld a, (hl)                    ; Check low byte of mask
    or a
    jr z, .check_high_byte        ; Low byte is 0, check high byte

.next_free_slot:
    inc hl                        ; Next entity
    inc d                         ; Increment slot index
    djnz .find_free_slot          ; Loop for all entities

    ; No free slot found - abort spawn
    pop de
    pop bc
    ret

.check_high_byte:
    push hl
    ld hl, entity_comp_masks_hi
    ld e, d
    add hl, de
    ld a, (hl)                    ; Check high byte
    pop hl
    or a
    jr nz, .next_free_slot        ; High byte not zero, keep searching

.found_free_slot:
    ; D = Free entity index for projectile
    ; C = Shooter entity index
    pop de                        ; Discard saved DE
    push bc                       ; Save shooter index
    push de                       ; Save for later

    ; Get shooter position
    ld hl, entity_x_pos
    ld e, c
    ld b, 0
    ld c, b
    add hl, bc
    ld a, (hl)                    ; A = shooter X
    add a, 8                      ; Offset to center (8 pixels)
    ld b, a                       ; B = projectile X

    ld hl, entity_y_pos
    add hl, bc
    ld a, (hl)                    ; A = shooter Y
    add a, 8                      ; Offset to center
    ld c, a                       ; C = projectile Y

    ; Set projectile position
    ld hl, entity_x_pos
    ld e, d
    push de
    ld d, 0
    add hl, de
    ld (hl), b                    ; Set projectile X

    ld hl, entity_y_pos
    add hl, de
    ld (hl), c                    ; Set projectile Y

    ; Activate projectile with Position + Sprite + Movement
    ld hl, entity_comp_masks
    add hl, de
    ld (hl), #07                  ; POSITION | SPRITE | MOVEMENT (low byte)

    ld hl, entity_comp_masks_hi
    add hl, de
    ld (hl), 0                    ; High byte = 0

    ; Set projectile velocity based on shooter's facing direction
    ; Determine direction from shooter's current velocity
    pop de                        ; DE = projectile index
    pop bc                        ; BC = shooter index
    push bc
    push de

    ; Get shooter's velocity X to determine facing direction
    ld hl, entity_vel_x
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shooter's vel_x

    ; Check if shooter is moving left (negative velocity)
    bit 7, a                      ; Check sign bit
    jr z, .shoot_facing_right     ; vel_x >= 0, facing right

.shoot_facing_left:
    ; Shooter facing left - projectile velocity should be negative
    ld hl, entity_shoot_speed
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shoot speed (positive)
    neg                           ; Negate to make it negative

    pop de                        ; DE = projectile index
    ld hl, entity_vel_x
    push de
    add hl, de
    ld (hl), a                    ; Set velocity X = -speed
    jr .shoot_vel_set

.shoot_facing_right:
    ; Shooter facing right - projectile velocity is positive
    ld hl, entity_shoot_speed
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shoot speed (positive)

    pop de                        ; DE = projectile index
    ld hl, entity_vel_x
    push de
    add hl, de
    ld (hl), a                    ; Set velocity X = speed

.shoot_vel_set:

    ld hl, entity_vel_y
    pop de
    add hl, de
    ld (hl), 0                    ; Set velocity Y = 0 (horizontal)

    ; Set collision layer for player bullet (layer 4)
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), 4                    ; Player bullet layer

    ; Set collides with mask (collides with enemies = layer 2)
    ld hl, entity_collides_with
    add hl, de
    ld (hl), 2                    ; Collides with enemies

    ; Set cooldown (15 frames @ 60fps ≈ 250ms)
    pop bc                        ; BC = shooter index
    ld hl, entity_shoot_cooldown
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 15

    pop de
    pop bc
    ret

.shoot_done:
    pop hl
    pop bc

.shoot_next_entity:
    inc hl                        ; Next entity high mask
    inc c                         ; Next entity index
    djnz .shoot_update_loop
    ret
    `;
}

/**
 * Generate Platform Riding System
 */
function generatePlatformRidingSystem(): string {
    return `
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM
    ; ==================================================================
    ; Detects when entities are standing on platforms and transfers velocity
    ;
    ; Platform detection: Entity A is on platform B if:
    ; - A's bottom edge is at or near B's top edge
    ; - A has horizontal overlap with B
    ; - B has collision_layer bit 3 set (platform layer = 8)
    ;
    ; Grace frames: 6 frames tolerance when leaving platform

init_platform_riding_system:
    ; Initialize platform IDs to 255 (no platform)
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Initialize grace frames to 0
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

prepare_platform_detection:
    ; PHASE 1 - Called BEFORE collision detection
    ; Clear platform references from previous frame
    ; Entities that were on platforms get grace frames
    ; Collision detection will reset platform_id if still in contact

    ld b, 32
    ld hl, entity_platform_id
    ld de, entity_platform_grace
    ld c, 0

.platform_clear_loop:
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl
    ld a, 6
    ld (de), a              ; Set grace frames
    pop hl

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    inc hl                  ; Next platform_id
    inc de                  ; Next grace counter
    inc c
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld b, 32
    ld hl, entity_platform_grace
    ld de, entity_platform_id
    ld c, 0

.grace_loop:
    ; Check if entity has platform reference
    ld a, (de)              ; A = platform_id
    cp 255
    jr nz, .grace_next      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_next       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_next:
    inc hl                  ; Next grace counter
    inc de                  ; Next platform_id
    inc c
    djnz .grace_loop
    ret
    `;
}

/**
 * Generate Animation Component System
 */
function generateAnimationSystem(): string {
    return `
    ; ==================================================================
        ; ANIMATION COMPONENT SYSTEM
    ; ==================================================================

        init_animation_system:
            ; Initialize animation component data
            ; Clear frames
            ld hl, entity_anim_frame
            ld de, entity_anim_frame+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear ticks
            ld hl, entity_anim_tick
            ld de, entity_anim_tick+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Default speed = ANIM_DEFAULT_SPEED
            ld hl, entity_anim_speed
            ld de, entity_anim_speed+1
            ld bc, 31
            ld (hl), ANIM_DEFAULT_SPEED
            ldir

            ; Default flags = playing + loop
            ld hl, entity_anim_flags
            ld de, entity_anim_flags+1
            ld bc, 31
            ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP
            ldir
            ret

        update_animation_component:
            ; Update animations for entities
            ; - Advances entity_anim_frame using entity_anim_tick/entity_anim_speed
            ; - Copies the selected frame's patterns to VRAM for this entity
            ld b, 32
            ld c, 0
            ld hl, entity_comp_masks

        .anim_loop:
            ld a, (hl)
            and COMP_MASK_ANIMATION
            jp z, .anim_next_entity

            ld a, (hl)
            and COMP_MASK_SPRITE
            jp z, .anim_next_entity

            ; Skip inactive entities
            push hl
            ld hl, entity_active
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            pop hl
            or a
            jp z, .anim_next_entity

            ; Skip entities that are not in the currently active screen
            ; Preserve HL because it is the entity_comp_masks loop pointer.
            push hl
            ld hl, entity_screen_id
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, current_screen_id
            cp (hl)
            pop hl
            jp nz, .anim_next_entity

            push bc
            push hl

            ; Check flags (playing?)
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            ld a, (hl)
            bit 0, a
            jp z, anim_done_entity

            ; Only animate when moving?
            bit 2, a
            jr z, .tick

            ; vel_x != 0 || vel_y != 0
            ld hl, entity_vel_x
            add hl, de
            ld a, (hl)
            ld hl, entity_vel_y
            add hl, de
            or (hl)
            jp z, anim_done_entity

        .tick:
            ; tick++
            ld hl, entity_anim_tick
            add hl, de
            inc (hl)

            ; if tick < speed -> done
            ld a, (hl)
            ld hl, entity_anim_speed
            add hl, de
            cp (hl)
            jp c, anim_done_entity

            ; tick = 0
            ld hl, entity_anim_tick
            add hl, de
            ld (hl), 0

            ; Sprite asset index for this entity (#FF = none)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            ld b, a                    ; B = sprite asset index

            ; frameCount = sprite_asset_frame_count[B]
            ld hl, sprite_asset_frame_count
            ld e, b
            ld d, 0
            add hl, de
            ld a, (hl)                 ; A = frameCount
            cp 2
            jp c, anim_done_entity     ; 0/1 frames -> no animation
            push af                    ; Save frameCount on stack

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)                 ; A = current frame
            inc a                      ; A = next frame
            pop de                     ; D = frameCount (was pushed as A)
            push de                    ; Keep frameCount on stack for .clamp_last
            cp d                       ; Compare frame with frameCount
            jr c, .store_frame

            ; Overflow: loop?
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            pop de                     ; D = frameCount
            push de                    ; Keep balanced
            ld a, d
            dec a                      ; frame = frameCount-1

        .store_frame:
            pop de                     ; Clean stack (discard frameCount)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld (hl), a                 ; store new frame index

            ; Get pointer to this sprite asset's frame pointer list
            ld l, b
            ld h, 0
            add hl, hl                 ; index * 2
            ld de, sprite_asset_frame_ptr_table
            add hl, de
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = frame pointer list base

            ; HL = &frame_ptrs[frame]
            ld e, a
            ld d, 0
            add hl, de
            add hl, de                 ; + frame*2
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = source pattern data

            ; Get entity sprite config (base HW sprite + layer count)
            push hl                    ; save source
            ld e, c
            ld d, 0
            ld hl, entity_sprite_config
            add hl, de
            add hl, de                 ; entityIndex * 2
            ld a, (hl)                 ; base HW sprite
            inc hl
            ld c, (hl)                 ; layer count
            ld d, a                    ; D = base HW sprite (save)
            pop hl                     ; restore source

            ld a, c
            or a
            jp z, anim_done_entity     ; no layers for this entity

            ; BC = layerCount * 32
            ld a, c
            ld b, 0
            ld c, a
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b

            ; DE = SPRPAT + baseHwSprite*32
            push hl                    ; save source
            ld a, d
            ld l, a
            ld h, 0
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl                 ; HL = base * 32
            ld de, SPRPAT
            add hl, de
            ex de, hl                  ; DE = VRAM destination
            pop hl                     ; restore source

            call FAST_LDIRVM           ; copy pattern data to VRAM

anim_done_entity:
            pop hl
            pop bc

        .anim_next_entity:
            inc hl
            inc c
            dec b
            jp nz, .anim_loop
    ret
    `;
}

/**
 * Generate Jump Component System
 */
function generateJumpSystem(): string {
    return `
    ; ==================================================================
        ; JUMP COMPONENT SYSTEM
    ; ==================================================================

        init_jump_system:
            ; Initialize jump system
            ; Clear jump velocities (32 words = 64 bytes)
            ld hl, entity_jump_vel_y
            ld de, entity_jump_vel_y+1
            ld bc, 63
            ld (hl), 0
            ldir

            ; Clear jump counters
            ld hl, entity_jump_count
            ld de, entity_jump_count+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear on-ground flags
            ld hl, entity_on_ground
            ld de, entity_on_ground+1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_jump_component:
            ; Update jump logic for entities
            ; Fire button edge triggers jump for entities with Jump+Input
            ; Uses: entity_jump_count, entity_on_ground, entity_gravity_vel
            ; Uses global input_btn_curr/input_btn_prev edge detection

            ld b, 32                      ; Loop all entities
            ld hl, entity_comp_masks_hi    ; High byte masks (Jump/Gravity)
            ld c, 0                       ; Entity index

        jump_update_loop:
            ld a, (hl)
            and #01                       ; Jump bit (COMP_MASK_JUMP=#0100 -> high byte bit0)
            jr z, jump_next_entity

            ; Require Input component
            push hl
            ld hl, entity_comp_masks
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and COMP_MASK_INPUT
            pop hl
            jr z, jump_next_entity

            push bc
            push hl

            ; Ground detection is now handled by update_collision_component
            ; Just reset jump count if grounded
            ld e, c
            ld d, 0
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)                   ; Check if on ground
            jr z, .jump_check             ; Not grounded, skip reset

            ; Entity is grounded - reset jump count
            ld hl, entity_jump_count
            add hl, de
            ld (hl), 0

        .jump_check:
            ; --- Jump trigger edge (fire pressed now, not pressed previous frame) ---
            ld a, (input_btn_curr)
            and INPUT_BTN_FIRE
            jr z, jump_done_entity        ; not pressed
            ld a, (input_btn_prev)
            and INPUT_BTN_FIRE
            jr nz, jump_done_entity       ; already held last frame

            ; Check jump count < 2 OR grounded
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp 2
            jr c, .do_jump

            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jr z, jump_done_entity

        .do_jump:
            ; jump_count++
            ld hl, entity_jump_count
            add hl, de
            inc (hl)

            ; clear grounded
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

            ; clear platform reference (prevent infinite jumps)
            ld hl, entity_platform_id
            add hl, de
            ld (hl), 255

            ; If entity has Gravity, set gravity velocity to negative jump impulse
            ; Jump impulse: -1024 (8.8 fixed) => #FC00 (~4 tiles height with gravity #40)
            pop hl                        ; restore hl pointer to high mask for this entity
            push hl
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jr z, jump_done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #00                  ; low byte
            inc hl
            ld (hl), #FC                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc

        jump_next_entity:
            inc hl                        ; Next entity high mask
            inc c                         ; Next entity index
            dec b
            jp nz, jump_update_loop
    ret
    `;
}

/**
 * Generate Auto-Destroy Component System
 */
function generateAutoDestroySystem(): string {
    return `
    ; ==================================================================
    ; AUTO-DESTROY COMPONENT SYSTEM
    ; ==================================================================
    ; Entities with AUTO_DESTROY component have a lifetime counter
    ; When lifetime reaches 0, entity is automatically destroyed
    ; Useful for: projectiles, particles, temporary effects, etc.

init_auto_destroy_system:
    ; Initialize all lifetimes to 0 (infinite by default)
    ld hl, entity_lifetime
    ld de, entity_lifetime+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_auto_destroy_component:
    ; Update lifetime counters and destroy entities when expired
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi    ; High byte masks
        ld c, 0                       ; Entity index

    auto_destroy_loop:
        ld a, (hl)
        and #04                       ; AUTO_DESTROY bit (COMP_MASK_AUTO_DESTROY=#0400 -> high byte bit2)
        jr z, auto_destroy_next

        ; Entity has auto-destroy component
        push bc
        push hl

        ; Get lifetime for this entity
        ld e, c                       ; Entity index
        ld d, 0
        ld hl, entity_lifetime
        add hl, de
        ld a, (hl)                    ; A = lifetime

        ; Check if lifetime is 0 (infinite) or > 0
        or a
        jr z, auto_destroy_done       ; 0 = infinite lifetime, skip

        ; Decrement lifetime
        dec a
        ld (hl), a                    ; Store decremented value

        ; Check if lifetime reached 0
        or a
        jr nz, auto_destroy_done      ; Still alive

        ; Lifetime expired - destroy entity
        ; Clear component masks (deactivates entity)
        ld hl, entity_comp_masks
        ld e, c
        ld d, 0
        add hl, de
        ld (hl), 0                    ; Clear low byte

        ld hl, entity_comp_masks_hi
        add hl, de
        ld (hl), 0                    ; Clear high byte

        ; Move entity off-screen
        ld hl, entity_x_pos
        add hl, de
        ld (hl), 255                  ; X = off-screen

        ld hl, entity_y_pos
        add hl, de
        ld (hl), 212                  ; Y = below screen (192 + 20)

auto_destroy_done:
        pop hl
        pop bc

auto_destroy_next:
        inc hl                        ; Next entity high mask
        inc c                         ; Next entity index
        dec b
        jp nz, auto_destroy_loop
        ret
    `;
}

/**
 * Generate Cursors Component System
 * For menu navigation and cursor control
 */
function generateCursorsSystem(): string {
    return `
    ; ==================================================================
    ; CURSORS COMPONENT SYSTEM
    ; ==================================================================
    ; NOTE:
    ; This system is intentionally disabled in runtime gameplay.
    ; Directional movement is already handled by update_input_component.
    ; Keeping cursor movement here causes double movement/jitter.

init_cursors_system:
    ; No initialization needed
    ret

; ------------------------------------------------------------------
; update_cursors_component
; Disabled no-op (reserved for future menu-only cursor implementation)
; ------------------------------------------------------------------
update_cursors_component:
    ret
    `;
}

/**
 * Generate Carry Component System
 * For entities that carry other entities (like picking up items)
 */
function generateCarrySystem(): string {
    return `
    ; ==================================================================
    ; CARRY COMPONENT SYSTEM
    ; ==================================================================
    ; Allows entities to "carry" other entities
    ; Carried entities follow the carrier's position with offset
    ; Variables: entity_carried_by (ID of carrier, 255=none)

init_carry_system:
    ; Initialize all entities as not carried
    ld hl, entity_carried_by
    ld de, entity_carried_by+1
    ld bc, 31
    ld (hl), 255                  ; 255 = not carried
    ldir
    ret

; ------------------------------------------------------------------
; update_carry_component
; Update positions of carried entities to follow carrier
; ------------------------------------------------------------------
update_carry_component:
    ld c, 0                       ; Entity index

.carry_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if this entity is being carried
    ld hl, entity_carried_by
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = carrier ID
    cp 255
    jr z, .carry_next             ; Not being carried

    ; Entity is being carried - get carrier position
    ld b, a                       ; B = carrier ID
    push bc

    ; Get carrier X position
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                    ; A = carrier X

    ; Set carried entity X position (same as carrier)
    pop bc
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld (hl), a

    ; Get carrier Y position
    pop bc
    push bc
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                    ; A = carrier Y
    sub 16                        ; Offset: carried item above carrier

    ; Set carried entity Y position
    pop bc
    ld e, c
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld (hl), a

.carry_next:
    inc c
    jr .carry_loop
    `;
}

/**
 * Generate WallCollision Component System
 * For wall sliding and collision prevention
 * Uses 2-point checks per direction for robust collision
 * Snaps entity position to wall edge (not just zero velocity)
 */
function generateWallCollisionSystem(): string {
    return `
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Checks 2 points per direction for robust collision
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; Check wall collisions and prevent movement through solid tiles
; Uses behavior map (current_behavior_map) for collision detection
; Entity position is cached in wall_temp_x/y to avoid register issues
; ------------------------------------------------------------------
update_wallcollision_component:
    xor a
    ld (wall_entity_idx), a       ; Entity index = 0

.wall_loop:
    ld a, (wall_entity_idx)
    cp MAX_ENTITIES
    ret z

    ; Check if entity is active
    ld e, a
    ld d, 0
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .wall_next

    ; Only process entities with movement capability (Input or Movement)
    ; Static entities (Nucleo etc.) have no velocity sources - skip them
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .wall_next

    ; Skip entities that are not in the currently active screen
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .wall_next

    ; Cache entity position
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a          ; Cache X

    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a          ; Cache Y

    ; Clear on_ground flag - will be re-set by .wall_down_blocked if floor found
    ; This ensures entity correctly detects walking off platform edges
    ld hl, entity_wall_collision_flags
    add hl, de                        ; DE still = entity index from above
    ld (hl), 0                        ; Clear directional wall flags

    ld hl, entity_on_ground
    add hl, de                        ; DE still = entity index from above
    res 0, (hl)

    ; ---- CHECK HORIZONTAL VELOCITY ----
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y           ; No X velocity, check Y

    bit 7, a
    jp z, .wall_check_right

.wall_check_left:
    ; Moving left - check left edge at 2 Y points
    ld a, (wall_temp_x)
    or a
    jp z, .check_wall_y           ; X=0, already at left edge
    sub 1
    srl a
    srl a
    srl a                         ; Column = (X-1) / 8
    ld c, a

    ; Check point 1: upper portion (Y+2)
    ld a, (wall_temp_y)
    add a, 2
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_left_blocked

    ; Check point 2: lower portion (Y+13)
    ld a, (wall_temp_y)
    add a, 13
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+13) / 8
    call get_behavior_tile
    or a
    jp z, .check_wall_y           ; Both passable

.wall_left_blocked:
    ; Snap X to right edge of wall tile: X = (column+1) * 8
    ld a, c
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (column+1) * 8
    ld (wall_temp_x), a          ; Update cache
    push af
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity X position

    ; Zero X velocity
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)                       ; LEFT wall collision
    jp .check_wall_y

.wall_check_right:
    ; Moving right - check right edge at 2 Y points
    ld a, (wall_temp_x)
    add a, 16                     ; Right edge (16px wide sprite)
    jp c, .check_wall_y           ; Overflow (X+16 > 255), skip
    srl a
    srl a
    srl a                         ; Column = (X+16) / 8
    ld c, a

    ; Check point 1: upper portion (Y+2)
    ld a, (wall_temp_y)
    add a, 2
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_right_blocked

    ; Check point 2: lower portion (Y+13)
    ld a, (wall_temp_y)
    add a, 13
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+13) / 8
    call get_behavior_tile
    or a
    jp z, .check_wall_y           ; Both passable

.wall_right_blocked:
    ; Snap X so right edge touches left of wall: X = column*8 - 16
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = column * 8
    sub 16                        ; A = column*8 - 16
    ld (wall_temp_x), a          ; Update cache
    push af
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity X position

    ; Zero X velocity
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)                       ; RIGHT wall collision

.check_wall_y:
    ; ---- CHECK VERTICAL VELOCITY ----
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y_gravity   ; vel_y=0, but check floor for gravity entities

    bit 7, a
    jp z, .wall_check_down

.wall_check_up:
    ; Moving up - check top edge at 2 X points
    ld a, (wall_temp_y)
    or a
    jp z, .wall_next              ; Y=0, at top edge
    sub 1
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y-1) / 8

    ; Check point 1: left portion (X+2)
    ld a, (wall_temp_x)
    add a, 2
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_up_blocked

    ; Check point 2: right portion (X+13)
    ld a, (wall_temp_x)
    add a, 13
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+13) / 8
    call get_behavior_tile
    or a
    jp z, .wall_next              ; Both passable

.wall_up_blocked:
    ; Snap Y below ceiling: Y = (row+1) * 8
    ld a, b
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (row+1) * 8
    ld (wall_temp_y), a          ; Update cache
    push af
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity Y position

    ; Zero Y velocity
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; Also zero gravity_vel to stop upward momentum (ceiling bonk)
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_check_down:
    ; Moving down - check bottom edge at 2 X points
    ld a, (wall_temp_y)
    add a, 16                     ; Bottom of entity (16px tall)
    jp c, .wall_next              ; Overflow, skip
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+16) / 8

    ; Check point 1: left portion (X+2)
    ld a, (wall_temp_x)
    add a, 2
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_down_blocked

    ; Check point 2: right portion (X+13)
    ld a, (wall_temp_x)
    add a, 13
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+13) / 8
    call get_behavior_tile
    or a
    jp z, .wall_next              ; Both passable

.wall_down_blocked:
    ; Snap Y so bottom touches top of floor: Y = row*8 - 16
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = row * 8
    sub 16                        ; A = row*8 - 16
    ld (wall_temp_y), a          ; Update cache
    push af
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity Y position

    ; Zero Y velocity and gravity velocity (landing)
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0

    ; Set entity_on_ground flag (floor detected)
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_on_ground
    add hl, de
    set 0, (hl)
    ld hl, entity_wall_collision_flags
    add hl, de
    set 1, (hl)                       ; DOWN wall collision
    jp .wall_next                     ; Floor collision handled, move to next entity

.check_wall_y_gravity:
    ; vel_y is 0, but entity might have gravity component
    ; Check floor anyway to keep entity_on_ground flag correct (prevents jitter)
    ld a, (wall_entity_idx)
    ld e, a
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, .wall_check_down       ; Has gravity, check floor
    ; No gravity, skip vertical check
.wall_next:
    ld a, (wall_entity_idx)
    inc a
    ld (wall_entity_idx), a
    jp .wall_loop
    `;
}

/**
 * Generate Collectible Component System
 * For items that can be collected (coins, power-ups, etc.)
 */
function generateCollectibleSystem(): string {
    return `
    ; ==================================================================
    ; COLLECTIBLE COMPONENT SYSTEM
    ; ==================================================================
    ; Items that can be collected when player touches them
    ; Increments score/counters and deactivates item

init_collectible_system:
    ret

; ------------------------------------------------------------------
; update_collectible_component
; Check collisions between collectibles and player
; When collected: deactivate item, increment score
; ------------------------------------------------------------------
update_collectible_component:
    ld c, 0                       ; Entity index

.collect_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .collect_next

    ; TODO: Check if entity has COLLECTIBLE component mask

    ; Assume entity 0 is player - check collision with player
    ; Get collectible position
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible X

    ; Get player X position
    ld hl, entity_x_pos
    ld e, 0                       ; Entity 0 = player
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player X

    ; Check X distance
    sub b                         ; A = collectible_x - player_x
    ; Check if within range (-16 to +16)
    cp 240                        ; Negative check (< -16)
    jr c, .collect_next
    cp 16                         ; Positive check (> +16)
    jr nc, .collect_next

    ; X is close, check Y
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible Y

    ld hl, entity_y_pos
    ld e, 0
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player Y

    sub b                         ; A = collectible_y - player_y
    cp 240
    jr c, .collect_next
    cp 16
    jr nc, .collect_next

    ; Collision detected - collect item!
    push bc

    ; Deactivate collectible (set entity_active[c] = 0)
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 0                    ; Deactivate entity

    ; TODO: Increment score or item counter
    ; ld hl, player_score
    ; inc (hl)

    ; TODO: Play collection sound

    pop bc

.collect_next:
    inc c
    jr .collect_loop
    `;
}

/**
 * Generate entity management helper functions
 */
function generateEntityManagement(): string {
    return ` 
    ; ================================================================== 
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system) 
    ; ================================================================== 

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity:
; Set component mask for entity
            ld hl, entity_comp_masks
            ld e, a; Entity index
            ld d, 0
            add hl, de; HL points to entity mask
            ld (hl), b; Set component mask low byte

            ld hl, entity_comp_masks_hi
            add hl, de
            ld (hl), c; Set component mask high byte

    ; Mark entity as active
            ld hl, entity_active
            add hl, de
            ld (hl), 1                    ; entity_active[entity] = 1

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite

    ret 

    ; Initialize position component for entity(A = entity ID)
        init_entity_position:
            ld hl, entity_x_pos
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 100; Default X position

            ld hl, entity_y_pos
            add hl, de
            ld (hl), 100; Default Y position
    ret

    ; Initialize sprite component for entity(A = entity ID)
        init_entity_sprite:
    ; Set sprite as visible with default pattern
            ld hl, sprite_pattern
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 0; Pattern 0

            ld hl, sprite_color
            add hl, de
            ld (hl), 15; White color
    ret
    `;
}

/**
 * Generate init_components function with conditional initialization
 */
function generateInitComponents(usage: ComponentUsageAnalysis): string {
    const usedComponents = usage.usedComponents;

    let code = `init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: ${Array.from(usedComponents).join(', ')} 
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
 
    ; Clear all component masks 
        ld hl, entity_comp_masks 
        ld de, entity_comp_masks + 1 
        ld bc, 31 
        ld (hl), 0 
        ldir 

    ; Clear all component masks (high byte)
        ld hl, entity_comp_masks_hi
        ld de, entity_comp_masks_hi + 1
        ld bc, 31
        ld (hl), 0
        ldir 
 
    `;

    code += `    ; Initialize position system (always)
    call init_position_system
    `;


    if (usedComponents.has('Sprite')) {
        code += `    ; Initialize sprite system
    call init_sprite_system
    `;
    }

    if (usedComponents.has('Movement')) {
        code += `    ; Initialize movement system
    call init_movement_system
    `;
    }

    if (usedComponents.has('Collision')) {
        code += `    ; Initialize collision system
    call init_collision_system
    `;
    }

    if (usedComponents.has('Input')) {
        code += `    ; Initialize input system
    call init_input_system
    `;
    }

    if (usedComponents.has('Behavior')) {
        code += `    ; Initialize behavior system
    call init_behavior_system
    `;
    }

    if (usedComponents.has('Health')) {
        code += `    ; Initialize health system
    call init_health_system
    `;
    }

    if (usedComponents.has('Animation')) {
        code += `    ; Initialize animation system
    call init_animation_system
    `;
    }

    if (usedComponents.has('Jump')) {
        code += `    ; Initialize jump system
    call init_jump_system
    `;
    }

    if (usedComponents.has('Gravity')) {
        code += `    ; Initialize gravity system
    call init_gravity_system
    `;
    }

    // Always initialize auto-destroy system (lightweight, always available)
    code += `    ; Initialize auto-destroy system
    call init_auto_destroy_system
    `;

    if (usedComponents.has('Cursors')) {
        code += `    ; Initialize cursors system (stub)
    call init_cursors_system
    `;
    }

    if (usedComponents.has('StateMachine')) {
        code += `    ; Initialize state machine system (stub)
    call init_statemachine_system
    `;
    }

    if (usedComponents.has('Carry')) {
        code += `    ; Initialize carry system (stub)
    call init_carry_system
    `;
    }

    if (usedComponents.has('Damage')) {
        code += `    ; Initialize damage system
    call init_damage_system
    `;
    }

    if (usedComponents.has('Shoot')) {
        code += `    ; Initialize shoot system
    call init_shoot_system
    `;
    }

    // Platform riding always initialized (physics feature)
    code += `    ; Initialize platform riding system
    call init_platform_riding_system
    `;

    if (usedComponents.has('WallCollision')) {
        code += `    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `;
    }

    if (usedComponents.has('Collectible')) {
        code += `    ; Initialize collectible system (stub)
    call init_collectible_system
    `;
    }

    code += `
    ret
    `;

    return code;
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

/**
 * Generate ECS component systems file (components.asm)
 *
 * Implements a complete Entity-Component-System architecture based on Mideas React.js patterns.
 * NOW WITH INTELLIGENT FILTERING - Only generates code for components actually used.
 *
 * @param analysis - Project analysis with entities and tiles
 * @returns ASM code string with ECS component systems
 */
export function generateComponentsFile(analysis: ProjectAnalysis): string {
    // Skip ECS system if no entities in project
    if (!analysis.entities || analysis.entities.length === 0) {
        return `; ==================================================================
; GAME COMPONENT SYSTEMS(SKIPPED - NO ENTITIES DETECTED)
    ; File: components.asm
        ; ==================================================================

; No entities detected in project - ECS system not needed
    ; This saves ~650 lines of unused component management code

; Constants required by state machine action handlers
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_DEFAULT_SPEED           EQU 8

COMP_POSITION   EQU 0
COMP_SPRITE     EQU 1
COMP_MOVEMENT   EQU 2
COMP_COLLISION  EQU 3
COMP_INPUT      EQU 4
COMP_BEHAVIOR   EQU 5
COMP_HEALTH     EQU 6
COMP_ANIMATION  EQU 7
COMP_JUMP       EQU 8
COMP_GRAVITY    EQU 9

COMP_MASK_POSITION   EQU #0001
COMP_MASK_SPRITE     EQU #0002
COMP_MASK_MOVEMENT   EQU #0004
COMP_MASK_COLLISION  EQU #0008
COMP_MASK_INPUT      EQU #0010
COMP_MASK_BEHAVIOR   EQU #0020
COMP_MASK_HEALTH     EQU #0040
COMP_MASK_ANIMATION  EQU #0080
COMP_MASK_JUMP       EQU #0100
COMP_MASK_GRAVITY    EQU #0200
COMP_MASK_AUTO_DESTROY EQU #0400

    ; Minimal stub functions for compatibility
init_components:
    ret
init_entities:
    ret
update_all_entities:
    ret
execute_all_state_machines:
    ret
create_entity:
    ret
force_update_entity_sprite:
    ret

update_input_component:
    ret
update_position_component:
    ret
update_movement_component:
    ret
update_collision_component:
    ret
update_sprite_component:
    ret
update_behavior_component:
    ret
update_health_component:
    ret
update_animation_component:
    ret
update_jump_component:
    ret
update_gravity_component:
    ret
update_auto_destroy_component:
    ret
update_cursors_component:
    ret
update_statemachine_component:
    ret
update_carry_component:
    ret
update_damage_component:
    ret
update_shoot_component:
    ret
update_wallcollision_component:
    ret
update_collectible_component:
    ret

init_position_system:
    ret
init_sprite_system:
    ret
init_movement_system:
    ret
init_collision_system:
    ret
init_input_system:
    ret
init_behavior_system:
    ret
init_health_system:
    ret
init_animation_system:
    ret
init_jump_system:
    ret
init_gravity_system:
    ret
init_auto_destroy_system:
    ret
init_cursors_system:
    ret
init_statemachine_system:
    ret
init_carry_system:
    ret
init_damage_system:
    ret
init_shoot_system:
    ret
init_platform_riding_system:
    ret
init_wallcollision_system:
    ret
init_collectible_system:
    ret
init_entity_position:
    ret
init_entity_sprite:
    ret

    ; Component Data Structure EQUs (referenced by state machine actions)
entity_jump_vel_y   EQU temp_word_3
entity_jump_count   EQU temp_byte_4
entity_on_ground    EQU temp_byte_5
entity_gravity_vel  EQU temp_word_4
entity_health_current EQU temp_byte_6
entity_health_max     EQU temp_byte_7
entity_deadly_collision EQU temp_byte_8
entity_invincibility_frames EQU temp_byte_9
entity_damage_amount        EQU temp_byte_10
entity_shoot_cooldown   EQU temp_byte_11
entity_shoot_sprite_id  EQU temp_byte_12
entity_shoot_speed      EQU temp_byte_13
entity_collision_layer  EQU temp_byte_14
entity_collides_with    EQU temp_byte_15
entity_platform_id      EQU temp_byte_16
entity_platform_grace   EQU temp_byte_17
entity_wall_collision_flags EQU temp_byte_18
entity_collision_hitbox_w EQU temp_byte_19
entity_collision_hitbox_h EQU temp_byte_20
entity_collision_offset_x EQU temp_byte_21
entity_collision_offset_y EQU temp_byte_22
entity_entity_collision_flags EQU temp_byte_23
entity_last_collision_entity EQU temp_byte_24

    ; ==================================================================
; END OF COMPONENTS(MINIMAL VERSION)
    ; ==================================================================
        `;
    }

    // INTELLIGENT FILTERING: Analyze which components are actually used
    const componentUsage: ComponentUsageAnalysis = analyzeComponentUsage(analysis);
    const usedComponents = componentUsage.usedComponents;

    console.log('🎯 Generating optimized components.asm...');
    console.log(`  - Active entities: ${componentUsage.activeEntities.length} `);
    console.log(`  - Used components: ${Array.from(usedComponents).join(', ')} `);
    console.log(`  - Filtered out: ${8 - usedComponents.size} unused components`);

    // Build the complete ASM file
    let code = `; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${componentUsage.activeEntities.length}
;   Used components: ${Array.from(usedComponents).join(', ')}
;   Filtered out: ${8 - usedComponents.size} unused component systems
    ;
; ==================================================================

; ==================================================================
; COMPONENT TYPE CONSTANTS(Based on ComponentDefinition analysis)
    ; ==================================================================

; Core Components(always present)
COMP_POSITION   EQU 0; Position component(x, y coordinates)
COMP_SPRITE     EQU 1; Sprite rendering component
COMP_MOVEMENT   EQU 2; Movement / velocity component
COMP_COLLISION  EQU 3; Collision detection component
COMP_INPUT      EQU 4; Input handling component
COMP_BEHAVIOR   EQU 5; AI / Logic behavior component
COMP_HEALTH     EQU 6; Health / damage component
COMP_ANIMATION  EQU 7; Animation state component
COMP_JUMP       EQU 8; Jump behavior component(platformer physics)
COMP_GRAVITY    EQU 9; Gravity physics component

    ; Component flags for entity filtering(16 - bit masks for 10 + components)
COMP_MASK_POSITION   EQU #0001; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200; Binary: 0000001000000000
COMP_MASK_AUTO_DESTROY EQU #0400; Binary: 0000010000000000

; ==================================================================
; ANIMATION FLAGS (entity_anim_flags)
; ==================================================================
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_DEFAULT_SPEED           EQU 8

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

    ; Deadly Tile Collision Data
entity_deadly_collision EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)

    ; Damage Component Data
entity_invincibility_frames EQU temp_byte_9  ; Countdown timer for invulnerability (32 bytes)
entity_damage_amount        EQU temp_byte_10 ; Damage dealt by this entity (32 bytes)

    ; Shoot Component Data
entity_shoot_cooldown   EQU temp_byte_11 ; Cooldown frames until can shoot (32 bytes)
entity_shoot_sprite_id  EQU temp_byte_12 ; Projectile sprite ID (32 bytes)
entity_shoot_speed      EQU temp_byte_13 ; Projectile velocity (32 bytes)

    ; Collision Layer Data (for projectile and advanced collision)
entity_collision_layer  EQU temp_byte_14 ; Which layer this entity is on (32 bytes)
entity_collides_with    EQU temp_byte_15 ; Bitmask of layers this entity collides with (32 bytes)

    ; Platform Riding Data
entity_platform_id      EQU temp_byte_16 ; ID of platform underneath (255 = none) (32 bytes)
entity_platform_grace   EQU temp_byte_17 ; Grace frames for platform (32 bytes)
entity_wall_collision_flags EQU temp_byte_18 ; Directional wall collision bits (32 bytes)
entity_collision_hitbox_w EQU temp_byte_19 ; Entity collision hitbox width (32 bytes)
entity_collision_hitbox_h EQU temp_byte_20 ; Entity collision hitbox height (32 bytes)
entity_collision_offset_x EQU temp_byte_21 ; Entity collision hitbox X offset (32 bytes)
entity_collision_offset_y EQU temp_byte_22 ; Entity collision hitbox Y offset (32 bytes)
entity_entity_collision_flags EQU temp_byte_23 ; bit0 any, bit1 enemy, bit2 item (32 bytes)
entity_last_collision_entity EQU temp_byte_24 ; Last collided entity index (255=none) (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        ${generateInitComponents(componentUsage)}
`;

    // Generate Position System (always needed for entity coords)
    code += generatePositionSystem();

    // Generate Sprite System (if used OR if project has sprites)
    // CRITICAL FIX: Always generate when sprites exist, even if component analysis fails
    const hasSprites = analysis.sprites && analysis.sprites.length > 0;
    if (usedComponents.has('Sprite') || hasSprites) {
        code += generateSpriteSystem(analysis);
    } else {
        code += `
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `;
    }

    // Generate Movement System (if used)
    if (usedComponents.has('Movement')) {
        code += generateMovementSystem();
    } else {
        code += `
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `;
    }

    // Generate Collision System (if used)
    if (usedComponents.has('Collision')) {
        code += generateCollisionSystem(analysis);
    } else {
        code += `
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `;
    }

    // Generate get_behavior_tile (shared utility for Collision and WallCollision)
    if (usedComponents.has('Collision') || usedComponents.has('WallCollision')) {
        code += generateGetBehaviorTile();
    }

    // Generate Input System (if used)
    if (usedComponents.has('Input')) {
        code += generateInputSystem();
    } else {
        code += `
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `;
    }

    // Generate Behavior System (if used)
    if (usedComponents.has('Behavior')) {
        code += generateBehaviorSystem();
    } else {
        code += `
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `;
    }

    // Generate Health System (if used)
    if (usedComponents.has('Health')) {
        code += generateHealthSystem();
    } else {
        code += `
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `;
    }

    // Generate Animation System (if used)
    if (usedComponents.has('Animation')) {
        code += generateAnimationSystem();
    } else {
        code += `
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `;
    }

    // Generate Jump System (if used)
    if (usedComponents.has('Jump')) {
        code += generateJumpSystem();
    } else {
        code += `
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `;
    }

    // Generate Gravity System (if used)
    if (usedComponents.has('Gravity')) {
        code += generateGravitySystem();
    } else {
        code += `
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `;
    }

    // Generate Auto-Destroy System (always available - lightweight feature)
    code += generateAutoDestroySystem();

    // Generate Cursors System stub (if used)
    if (!usedComponents.has('Cursors')) {
        code += `
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `;
    } else {
        code += generateCursorsSystem();
    }

    // Generate StateMachine System (if used)
    if (!usedComponents.has('StateMachine')) {
        code += `
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `;
    } else {
        code += `
    ; StateMachine system (integrates with stateMachineGenerator.ts)
    ; Note: The actual SM_Update runtime is in statemachine.asm
    ; This component iterates entities and calls SM_Update for each one

init_statemachine_system:
    ; No initialization needed - state machines are initialized
    ; when entity templates are loaded
    ret

; ------------------------------------------------------------------
; update_statemachine_component
; Update all entities with StateMachine component
; Calls SM_Update (from statemachine.asm) for each entity
; ------------------------------------------------------------------
update_statemachine_component:
    ld c, 0                       ; C = entity index

.sm_comp_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z                         ; Done with all entities

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .sm_comp_next           ; Entity not active, skip

    ; Check if entity has StateMachine component (bit in component mask)
    ; Note: StateMachine component mask bit should be defined in constants
    ; For now, we assume all active entities may have state machines
    ; In production, check entity_component_mask

    ; Get state machine pointer to verify it exists
    push bc
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = ptr_low

    ld hl, entity_sm_ptr_h
    ld b, 0                       ; BC = entity index again
    add hl, bc
    ld d, (hl)                    ; D = ptr_high

    ; Check if pointer is null (DE = 0)
    ld a, d
    or e
    pop bc
    jr z, .sm_comp_next           ; No state machine, skip

    ; Call SM_Update with entity index in A
    ld a, c
    call SM_Update

.sm_comp_next:
    inc c
    jr .sm_comp_loop
    `;
    }

    // Generate Carry System stub (if used)
    if (!usedComponents.has('Carry')) {
        code += `
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `;
    } else {
        code += generateCarrySystem();
    }

    // Generate Damage System (if used)
    if (!usedComponents.has('Damage')) {
        code += `
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `;
    } else {
        code += generateDamageSystem();
    }

    // Generate Shoot System (if used)
    if (!usedComponents.has('Shoot')) {
        code += `
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    `;
    } else {
        code += generateShootSystem();
    }

    // Generate Platform Riding System (always enabled for physics)
    code += generatePlatformRidingSystem();

    // Generate WallCollision System stub (if used)
    if (!usedComponents.has('WallCollision')) {
        code += `
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `;
    } else {
        code += generateWallCollisionSystem();
    }

    // Generate Collectible System stub (if used)
    if (!usedComponents.has('Collectible')) {
        code += `
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `;
    } else {
        code += generateCollectibleSystem();
    }

    // Always include entity management helpers
    code += generateEntityManagement();

    // ==================================================================
    // GAMEFLOW INTEGRATION FUNCTIONS
    // ==================================================================

    // Generate update_all_entities function - OPTIMIZED based on used components
    // Only generates CALLs to systems that are actually used
    code += generateUpdateAllEntities(usedComponents);

    // Generate execute_all_state_machines function - called by GameFlow game loop
    code += `
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld b, 32                      ; Loop through all 32 entities
    xor a                         ; A = 0 (entity index counter)
    
.sm_loop:
    push af                       ; Save entity index
    push bc                       ; Save loop counter
    
    ; Check if this entity has a state machine assigned
    ld c, a                       ; C = entity index
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)                    ; D = SM ptr high
    
    ; Check if SM pointer is non-zero
    ld a, d
    or e
    jr z, .skip_entity            ; No SM assigned, skip
    
    ; Entity has a state machine - execute it
    pop bc                        ; Restore loop counter
    pop af                        ; Restore entity index
    push af                       ; Save again for continuation
    push bc                       ; Save again for continuation
    
    call SM_Update                ; Execute state machine (A = entity index)
    
.skip_entity:
    pop bc                        ; Restore loop counter
    pop af                        ; Restore entity index
    
    inc a                         ; Next entity
    djnz .sm_loop                 ; Loop for all entities
    
    ret

`;

    // Tile Collision System
    code += `
; ==================================================================
; TILE COLLISION SYSTEM
; ==================================================================
; Provides functions for checking collision with background tiles
; Uses behavior maps generated from screen collision layers
; ==================================================================

; ------------------------------------------------------------------
; get_tile_at_position
; Convert pixel coordinates to tile coordinates and get tile ID
; Input:  D = X position (pixels), E = Y position (pixels)
; Output: A = Tile ID at that position, Z flag set if out of bounds
; Destroys: BC, HL
; ------------------------------------------------------------------
get_tile_at_position:
    ; Convert X pixel to tile column (divide by 8 - MSX Screen 2 character cell)
    ; Screen layout is ALWAYS 32x24 grid of 8x8 cells regardless of project tile size
    ld a, d
    srl a
    srl a
    srl a                         ; A = X / 8 = tile column
    ld b, a                       ; B = tile column

    ; Convert Y pixel to tile row (divide by 8 - MSX Screen 2 character cell)
    ld a, e
    srl a
    srl a
    srl a                         ; A = Y / 8 = tile row
    ld c, a                       ; C = tile row

    ; Check bounds (assume 32x24 tile screen for now)
    ld a, b
    cp 32
    jr nc, .out_of_bounds
    ld a, c
    cp 24
    jr nc, .out_of_bounds

    ; Calculate tile index: index = row * 32 + column (16-bit to avoid overflow)
    ld l, c
    ld h, 0                       ; HL = row (16-bit)
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    ld e, b
    ld d, 0
    add hl, de                    ; HL = row * 32 + column

    ; Read actual tile from current screen layout
    ld de, (current_screen_layout) ; DE = pointer to screen layout data
    add hl, de                    ; HL = pointer to tile at position
    ld a, (hl)                    ; A = tile ID from screen map

    or a                          ; Set flags based on tile ID
    ret                           ; Z flag set if tile == 0 (empty)

.out_of_bounds:
    xor a                         ; A = 0
    ret                           ; Z flag set (out of bounds)

; ------------------------------------------------------------------
; get_tile_behavior
; Get behavior/collision type of a tile
; Input:  A = Tile ID (character code from screen map)
; Output: A = Behavior flags (TILE_SOLID, TILE_PLATFORM, etc.)
; Destroys: HL
; ------------------------------------------------------------------
get_tile_behavior:
    ; Tile ID 0 is always passable (empty tile)
    or a
    jr z, .passable

    ; Look up tile behavior from tile_behavior_table
    ; The table is indexed by tile ID
    ld l, a
    ld h, 0
    ld de, tile_behavior_table
    add hl, de                    ; HL = &tile_behavior_table[tile_id]
    ld a, (hl)                    ; A = behavior flags
    ret

.passable:
    ld a, TILE_PASSABLE
    ret

; ------------------------------------------------------------------
; Tile Behavior Table
; Maps character IDs (0-255) to behavior flags
; NOTE: Wall collision uses behavior map directly (get_behavior_tile).
; This table is used by check_collision_at_point and deadly tile checks.
; Character 0 = empty (passable). Characters >= 128 = project tiles (solid).
; ------------------------------------------------------------------
tile_behavior_table:
    ; Index 0-127: Default passable (background, empty space)
    db TILE_PASSABLE              ; 0: Empty tile
    ${Array(127).fill(0).map((_, i) => `db TILE_PASSABLE              ; ${i + 1}: Passable`).join('\n    ')}

    ; Index 128-255: Project tile characters (solid by default)
    ; MSX Screen 2 assigns character IDs >= 128 to project tiles
    ${Array(128).fill(0).map((_, i) => `db TILE_SOLID                 ; ${128 + i}: Solid`).join('\n    ')}

; ------------------------------------------------------------------
; check_collision_at_point
; Check if there's a solid tile at given pixel coordinates
; Input:  D = X position, E = Y position
; Output: Z flag set if passable, cleared if solid
;         A = Behavior flags of tile at that position
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_at_point:
    call get_tile_at_position
    ret z                         ; Out of bounds = passable
    call get_tile_behavior
    and TILE_SOLID | TILE_PLATFORM
    ret                           ; Z if passable, NZ if solid

; ------------------------------------------------------------------
; check_collision_box
; Check collision for entity bounding box (16x16)
; Input:  D = X position (top-left), E = Y position (top-left)
; Output: Z flag set if no collision, cleared if collision detected
;         A = Behavior flags of colliding tile
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_box:
    ; Check 4 corners of 16x16 box:
    ; Top-left (X, Y)
    push de
    call check_collision_at_point
    jr nz, .collision_found

    ; Top-right (X+15, Y)
    pop de
    push de
    ld a, d
    add a, 15
    ld d, a
    call check_collision_at_point
    jr nz, .collision_found

    ; Bottom-left (X, Y+15)
    pop de
    push de
    ld a, e
    add a, 15
    ld e, a
    call check_collision_at_point
    jr nz, .collision_found

    ; Bottom-right (X+15, Y+15)
    pop de
    push de
    ld a, d
    add a, 15
    ld d, a
    ld a, e
    add a, 15
    ld e, a
    call check_collision_at_point
    jr nz, .collision_found

    ; No collision
    pop de
    xor a                         ; Z flag set
    ret

.collision_found:
    pop de
    or a                          ; Clear Z flag
    ret

; ------------------------------------------------------------------
; div_a_by_c
; Divide A by C (unsigned 8-bit division)
; Input:  A = dividend, C = divisor
; Output: A = quotient
; Destroys: B
; ------------------------------------------------------------------
div_a_by_c:
    ld b, 0                       ; B = quotient
.tile_div_loop:
    sub c
    jr c, .tile_div_done
    inc b
    jr .tile_div_loop
.tile_div_done:
    ld a, b
    ret

`;

    // End of file
    code += `
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `;

    return code;
}
