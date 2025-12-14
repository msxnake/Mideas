/**
 * @fileoverview Components Generator - ECS component systems
 * Generates components.asm with Position, Sprite, Movement, Collision, Input, and Behavior systems
 * NOW WITH INTELLIGENT FILTERING - Only generates code for components actually used
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { analyzeComponentUsage, ComponentUsageAnalysis } from '../utils/componentAnalyzer';

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
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, (hl)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

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
    
    ; Calculate Pattern: Pattern = HW Sprite Index (0-31)
    ld a, l
    ld d, a                    ; D = Pattern (direct index, not *4)
    
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
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld b, (hl)                 ; Layer Count
    ld a, b
    or a
    jr z, sprite_continue      ; Nothing to hide for anchor entities
    
sprite_hide_loop:
    push bc
    push af
    call hide_sprite           ; A = HW Sprite
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
    
    ; Calculate Pattern: Pattern = HW Sprite Index (0-31)
    ld a, l
    ld d, a                    ; D = Pattern (direct index, not *4)
    
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
            ; Clear velocities
            ld a, 0
            ld (entity_vel_x), a
            ld (entity_vel_y), a
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
    // Detect tile size from analysis
    const tileWidth = analysis.tiles && analysis.tiles.length > 0 ? analysis.tiles[0].width : 16;
    const tileHeight = analysis.tiles && analysis.tiles.length > 0 ? analysis.tiles[0].height : 16;
    const tilesPerRow = Math.floor(256 / tileWidth);
    const tilesPerColumn = Math.floor(192 / tileHeight);

    // Calculate shift amount for division (only if power of 2)
    const xShiftAmount = Number.isInteger(Math.log2(tileWidth)) ? Math.log2(tileWidth) : 4;
    const yShiftAmount = Number.isInteger(Math.log2(tileHeight)) ? Math.log2(tileHeight) : 4;

    const xDivisionCode = Array.from({ length: xShiftAmount },
        (_, i) => `    srl a; A = X / ${Math.pow(2, i + 1)} `).join('\n');

    const yDivisionCode = Array.from({ length: yShiftAmount },
        (_, i) => `    srl a; A = Y / ${Math.pow(2, i + 1)} `).join('\n');

    const tileInfo = analysis.tiles && analysis.tiles.length > 0
        ? `; Project tile analysis: ${analysis.tiles.map(t => `${t.width}x${t.height}`).join(', ')}
    ; Using first tile as reference: ${tileWidth}x${tileHeight}
    ; Convert X to tile column(divide by ${tileWidth})`
        : `; No tiles detected - using default 16x16
        ; Convert X to tile column(divide by 16)`;

    return `
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ret

    update_collision_component:
    ; Check collisions between entities and environment
    ld b, 32; Loop through all entities
    ld hl, entity_comp_masks; Check component masks
    ld c, 0; Entity index

    collision_update_loop:
    ld a, (hl); Get entity component mask
    and COMP_MASK_COLLISION; Check if has collision component
    jr z, collision_next_entity; Skip if no collision component

        ; Perform collision detection for this entity
    push bc
    push hl

        ; Get entity position
    ld hl, entity_x_pos
    ld e, c; Entity index
    ld d, 0
    add hl, de; HL points to entity X
    ld a, (hl); A = X position

    ld hl, entity_y_pos
    add hl, de; HL points to entity Y
    ld b, (hl); B = Y position

        ; Check screen boundaries(256x192 with 16x16 sprites)
    ; Left boundary
    cp 0
    jr z, collision_boundary_hit

        ; Right boundary(256 - 16 = 240)
    cp 240
    jr nc, collision_boundary_hit

        ; Top boundary
    ld a, b
    cp 0
    jr z, collision_boundary_hit

        ; Bottom boundary(192 - 16 = 176)
    cp 176
    jr nc, collision_boundary_hit

        ; Check tile collision(if screen maps exist)
    call check_tile_collision

        ; Check entity - to - entity collision
    call check_entity_collision

    jr collision_check_complete

    collision_boundary_hit:
    ; Handle boundary collision
    call handle_boundary_collision

    collision_check_complete:
    pop hl
    pop bc

    collision_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    dec b                      ; Decrement loop counter
    jp nz, collision_update_loop
    ret

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

        ; Convert Y to tile row(divide by ${tileHeight})
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

    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld e, (hl); E = other Y

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
        ; Stop movement in the collision direction
    ld a, 0
    ld (entity_vel_x), a; Stop X movement
    ld (entity_vel_y), a; Stop Y movement
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
        ; Prevent movement into the tile
    ld a, 0
    ld (entity_vel_x), a; Stop X movement
    ld (entity_vel_y), a; Stop Y movement
    ret

    handle_entity_collision:
    ; Handle collision between entities
        ; Implementation depends on game logic(damage, bouncing, etc.)
    ret

    get_behavior_tile:
    ; Get behavior value for tile at(B, C)
        ; Returns A = behavior value(0 = passable, 1 = solid, etc.)
        ; This would read from the behavior map data
        ; For now, return 0(all passable)
    ld a, 0
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
            ; Store X velocity (entity_vel_x is temp storage for now)
            ld a, b
            ld (entity_vel_x), a       ; Store calculated X velocity

            ; Store Y velocity
            ld a, c
            ld (entity_vel_y), a       ; Store calculated Y velocity

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
            ld a, d
            cp #04; Check if >= 1024
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

gravity_store_vel:
; Store updated gravity velocity
            dec hl
            ld (hl), e
            inc hl
            ld (hl), d

    ; Apply gravity velocity to Y position
            ld hl, entity_y_pos
            ld a, c
            ld l, a
            ld h, 0
            add hl, de
            ld a, (hl); Current Y
            add a, d; Add velocity high byte(integer part)
            ld (hl), a; Store new Y

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

        init_health_system:
            ; Initialize health system
            ret

        update_health_component:
            ; Update health for entities
            ; TODO: Implement health management
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
            ld (hl), (ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP)
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
            jr z, .next_entity

            ld a, (hl)
            and COMP_MASK_SPRITE
            jr z, .next_entity

            push bc
            push hl

            ; Check flags (playing?)
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            ld a, (hl)
            bit 0, a
            jr z, .done_entity

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
            jr z, .done_entity

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
            jr c, .done_entity

            ; tick = 0
            ld hl, entity_anim_tick
            add hl, de
            ld (hl), 0

            ; Sprite asset index for this entity (#FF = none)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jr z, .done_entity
            ld b, a                    ; B = sprite asset index

            ; frameCount = sprite_asset_frame_count[B]
            ld hl, sprite_asset_frame_count
            ld e, b
            ld d, 0
            add hl, de
            ld a, (hl)                 ; A = frameCount
            cp 2
            jr c, .done_entity         ; 0/1 frames -> no animation
            ld l, a                    ; L = frameCount

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)
            inc a
            cp l
            jr c, .store_frame

            ; Overflow: loop?
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            ld a, l
            dec a                      ; frame = frameCount-1

        .store_frame:
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
            jr z, .done_entity         ; no layers for this entity

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

            call LDIRVM                ; copy pattern data to VRAM

        .done_entity:
            pop hl
            pop bc

        .next_entity:
            inc hl
            inc c
            djnz .anim_loop
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
            ; Tracks per-entity fire edge in entity_on_ground bit 7 (latch)

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

            ; --- Simple grounded check against bottom boundary (Y >= 176) ---
            ld hl, entity_y_pos
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp 176
            jr c, .not_grounded

            ; Clamp to ground and mark grounded
            ld (hl), 176

            ld hl, entity_on_ground
            add hl, de
            set 0, (hl)

            ld hl, entity_jump_count
            add hl, de
            ld (hl), 0

            jr .ground_done

        .not_grounded:
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

        .ground_done:
            ; --- Jump trigger edge (fire pressed now, not pressed previous frame) ---
            ld a, (input_state)
            and #80
            jr z, .done_entity            ; not pressed
            ld a, (prev_input_state)
            and #80
            jr nz, .done_entity           ; already held last frame

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
            jr z, .done_entity

        .do_jump:
            ; jump_count++
            ld hl, entity_jump_count
            add hl, de
            inc (hl)

            ; clear grounded
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

            ; If entity has Gravity, set gravity velocity to negative jump impulse
            ; Jump impulse default: -300 (8.8 fixed) => #FED4
            pop hl                        ; restore hl pointer to high mask for this entity
            push hl
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jr z, .done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #D4                  ; low byte
            inc hl
            ld (hl), #FE                  ; high byte (negative)

        .done_entity:
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
 
    ; Initialize component data based on mask 
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position 
 
            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite 
 
    ; TODO: Initialize other components based on mask bits 
 
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
        code += `    ; Initialize damage system (stub)
    call init_damage_system
    `;
    }

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

    ; Minimal stub functions for compatibility
init_components:
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
        code += `
    ; Cursors system (stub - TODO: implement)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `;
    }

    // Generate StateMachine System stub (if used)
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
    ; StateMachine system (stub - TODO: implement)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
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
        code += `
    ; Carry system (stub - TODO: implement)
init_carry_system:
    ret

update_carry_component:
    ret
    `;
    }

    // Generate Damage System stub (if used)
    if (!usedComponents.has('Damage')) {
        code += `
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `;
    } else {
        code += `
    ; Damage system (stub - TODO: implement)
init_damage_system:
    ret

update_damage_component:
    ret
    `;
    }

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
        code += `
    ; WallCollision system (stub - TODO: implement)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `;
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
        code += `
    ; Collectible system (stub - TODO: implement)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `;
    }

    // Always include entity management helpers
    code += generateEntityManagement();

    // ==================================================================
    // GAMEFLOW INTEGRATION FUNCTIONS
    // ==================================================================

    // Generate update_all_entities function - called by GameFlow game loop
    code += `
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow
; ==================================================================
; This function updates all active entities by calling each
; component update system in the correct order
update_all_entities:
    ; Update all entity components in proper order
    call update_input_component        ; 1. Input (player control) - uses input_state from hook
    call update_behavior_component     ; 2. Behavior/AI
    ; Physics is executed by H.TIMI hook task_update_physics:
    ;   update_jump_component, update_movement_component, update_gravity_component, update_position_component
    call update_collision_component    ; 3. Collision detection
    call update_health_component       ; 4. Health/Death
    call update_animation_component    ; 5. Animation
    call update_sprite_component       ; 6. Sprite rendering
    ret

`;

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

    // End of file
    code += `
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `;

    return code;
}
