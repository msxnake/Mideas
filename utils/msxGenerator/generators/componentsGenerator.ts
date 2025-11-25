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
    jr z, sprite_next_entity   ; Skip if no sprite component

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
    ; Get entity position
    ld hl, entity_x_pos
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Show sprite (A=sprite#, B=X, C=Y, D=pattern, E=color)
    ld a, e                    ; Sprite number = entity index
    ld d, 0                    ; Pattern 0 (TODO: get from entity data)
    ld e, 15                   ; Color white (TODO: get from entity data)
    call show_sprite
    jr sprite_continue

sprite_hide:
    ; Entity is in different screen - hide sprite (Y = 208+)
    ld a, c                    ; Sprite number = entity index
    ld b, 0                    ; X = 0 (doesn't matter when hidden)
    ld c, 208                  ; Y = 208 (off-screen, hides sprite)
    ld d, 0                    ; Pattern 0
    ld e, 0                    ; Color 0
    call show_sprite

sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz sprite_update_loop

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret
`;
}

/**
 * Generate Movement Component System
 */
function generateMovementSystem(): string {
    return `
; ==================================================================
; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
; ==================================================================

init_movement_system:
    ; Initialize movement/physics system
    ; Clear velocities
    ld a, 0
    ld (entity_vel_x), a
    ld (entity_vel_y), a
    ret

update_movement_component:
    ; Update movement/physics for entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

movement_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_MOVEMENT     ; Check if has movement component
    jr z, movement_next_entity ; Skip if no movement component

    ; Apply physics/movement logic here
    push bc
    push hl

    ; 1. Apply Gravity (if applicable - TODO: check Gravity component)
    ; For now, just simple friction/damping if no input

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
    djnz movement_update_loop
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
        (_, i) => `    srl a                      ; A = X / ${Math.pow(2, i + 1)}`).join('\n');

    const yDivisionCode = Array.from({ length: yShiftAmount },
        (_, i) => `    srl a                      ; A = Y / ${Math.pow(2, i + 1)}`).join('\n');

    const tileInfo = analysis.tiles && analysis.tiles.length > 0
        ? `; Project tile analysis: ${analysis.tiles.map(t => `${t.width}x${t.height}`).join(', ')}
    ; Using first tile as reference: ${tileWidth}x${tileHeight}
    ; Convert X to tile column (divide by ${tileWidth})`
        : `; No tiles detected - using default 16x16
    ; Convert X to tile column (divide by 16)`;

    return `
; ==================================================================
; COLLISION COMPONENT SYSTEM (Based on ScreenEditor collision detection)
; ==================================================================

init_collision_system:
    ; Initialize collision detection system
    ret

update_collision_component:
    ; Check collisions between entities and environment
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

collision_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_COLLISION    ; Check if has collision component
    jr z, collision_next_entity ; Skip if no collision component

    ; Perform collision detection for this entity
    push bc
    push hl

    ; Get entity position
    ld hl, entity_x_pos
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity X
    ld a, (hl)                 ; A = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld b, (hl)                 ; B = Y position

    ; Check screen boundaries (256x192 with 16x16 sprites)
    ; Left boundary
    cp 0
    jr z, collision_boundary_hit

    ; Right boundary (256 - 16 = 240)
    cp 240
    jr nc, collision_boundary_hit

    ; Top boundary
    ld a, b
    cp 0
    jr z, collision_boundary_hit

    ; Bottom boundary (192 - 16 = 176)
    cp 176
    jr nc, collision_boundary_hit

    ; Check tile collision (if screen maps exist)
    call check_tile_collision

    ; Check entity-to-entity collision
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
    djnz collision_update_loop
    ret

; ==================================================================
; COLLISION HELPER FUNCTIONS (Critical for Gameplay Parity)
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
    ld c, a                    ; C = tile column

    ; Convert Y to tile row (divide by ${tileHeight})
    ld a, b
${yDivisionCode}
    ld b, a                    ; B = tile row

    ; Check if position is within valid tile map
    ld a, c
    cp ${tilesPerRow}                      ; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${tilesPerColumn}                      ; Screen height in tiles
    jr nc, no_tile_collision

    ; Get tile at position (simplified - would read from behavior map)
    ; For now, assume all non-zero tiles are solid
    ; This would read from the behavior map generated from screen data
    call get_behavior_tile     ; Returns A = behavior value
    or a
    jr z, no_tile_collision    ; 0 = passable

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
    ld e, 0                    ; Other entity index

entity_collision_loop:
    ld a, e
    cp c                       ; Skip self
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
    add hl, de                 ; HL points to other entity X
    ld d, (hl)                 ; D = other X

    ld hl, entity_y_pos
    add hl, de                 ; HL points to other entity Y
    ld e, (hl)                 ; E = other Y

    ; Check if entities overlap (16x16 sprites)
    ; Current entity: A = X, B = Y
    ; Other entity: D = X, E = Y

    ; X overlap check: |X1 - X2| < 16
    ld h, a                    ; H = current X
    ld a, d                    ; A = other X
    sub h                      ; A = other X - current X
    jr nc, x_diff_positive     ; Jump if positive
    neg                        ; Make positive
x_diff_positive:
    cp 16                      ; Check if < 16
    jr nc, no_entity_collision ; No X overlap

    ; Y overlap check: |Y1 - Y2| < 16
    ld a, e                    ; A = other Y
    sub b                      ; A = other Y - current Y
    jr nc, y_diff_positive     ; Jump if positive
    neg                        ; Make positive
y_diff_positive:
    cp 16                      ; Check if < 16
    jr nc, no_entity_collision ; No Y overlap

    ; Collision detected!
    call handle_entity_collision

no_entity_collision:
    pop de
    pop hl

next_entity_collision:
    inc hl                     ; Next entity mask
    inc e                      ; Next entity index
    ld a, e
    cp 32                      ; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; Stop movement in the collision direction
    ld a, 0
    ld (entity_vel_x), a       ; Stop X movement
    ld (entity_vel_y), a       ; Stop Y movement
    ret

handle_tile_collision:
    ; Handle collision with solid tiles
    ; Prevent movement into the tile
    ld a, 0
    ld (entity_vel_x), a       ; Stop X movement
    ld (entity_vel_y), a       ; Stop Y movement
    ret

handle_entity_collision:
    ; Handle collision between entities
    ; Implementation depends on game logic (damage, bouncing, etc.)
    ret

get_behavior_tile:
    ; Get behavior value for tile at (B, C)
    ; Returns A = behavior value (0=passable, 1=solid, etc.)
    ; This would read from the behavior map data
    ; For now, return 0 (all passable)
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
DIR_ALLOW_UP     EQU #01  ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02  ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04  ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08  ; Bit 3: Allow RIGHT movement

init_input_system:
    ; Initialize input handling system
    xor a
    ld (input_state), a
    ld (prev_input_state), a

    ; Initialize direction masks for all entities (default: all directions allowed)
    ld hl, entity_dir_mask
    ld de, entity_dir_mask+1
    ld bc, 31
    ld (hl), #0F               ; Default: 00001111 = all directions enabled
    ldir
    ret

update_input_component:
    ; Update input handling for player entities
    ; Store previous input state for edge detection
    ld a, (input_state)
    ld (prev_input_state), a

    ; Read current joystick state
    ld a, 0                    ; Joystick port 0
    call GTSTCK                ; Get joystick status (BIOS call)
    ld (input_state), a        ; Store current input state

    ; Process input for entities with input component
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

input_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_INPUT        ; Check if has input component
    jr z, input_next_entity    ; Skip if no input component

    ; Apply input to entity movement (real implementation)
    push bc
    push hl

    ; Get direction mask for this entity
    ld hl, entity_dir_mask
    ld e, c
    ld d, 0
    add hl, de
    ld d, (hl)                 ; D = direction mask (allowUp/Down/Left/Right)

    ; Convert joystick input to velocity
    ld a, (input_state)
    ld b, 0                    ; Default X velocity
    ld c, 0                    ; Default Y velocity

    ; Check directional input with direction restrictions
    cp STICK_UP
    jr z, input_move_up
    cp STICK_DOWN
    jr z, input_move_down
    cp STICK_LEFT
    jr z, input_move_left
    cp STICK_RIGHT
    jr z, input_move_right
    cp STICK_UPRIGHT
    jr z, input_move_upright
    cp STICK_UPLEFT
    jr z, input_move_upleft
    cp STICK_DOWNRIGHT
    jr z, input_move_downright
    cp STICK_DOWNLEFT
    jr z, input_move_downleft
    jr input_apply_velocity

input_move_up:
    ; Check if UP is allowed (bit 0)
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_apply_velocity ; Not allowed, skip
    ld c, -2                   ; Negative Y velocity (up)
    jr input_apply_velocity

input_move_down:
    ; Check if DOWN is allowed (bit 1)
    ld a, d
    and DIR_ALLOW_DOWN
    jr z, input_apply_velocity ; Not allowed, skip
    ld c, 2                    ; Positive Y velocity (down)
    jr input_apply_velocity

input_move_left:
    ; Check if LEFT is allowed (bit 2)
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_apply_velocity ; Not allowed, skip
    ld b, -2                   ; Negative X velocity (left)
    jr input_apply_velocity

input_move_right:
    ; Check if RIGHT is allowed (bit 3)
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity ; Not allowed, skip
    ld b, 2                    ; Positive X velocity (right)
    jr input_apply_velocity

input_move_upright:
    ; Check if both UP and RIGHT are allowed
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_check_right_only ; UP not allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_check_up_only  ; RIGHT not allowed
    ; Both allowed - diagonal
    ld b, 1                    ; Diagonal movement (slower)
    ld c, -1
    jr input_apply_velocity
input_check_right_only:
    ; Only RIGHT allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity
    ld b, 2
    jr input_apply_velocity
input_check_up_only:
    ; Only UP allowed
    ld c, -2
    jr input_apply_velocity

input_move_upleft:
    ; Check if both UP and LEFT are allowed
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_check_left_only1 ; UP not allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_check_up_only1 ; LEFT not allowed
    ; Both allowed - diagonal
    ld b, -1
    ld c, -1
    jr input_apply_velocity
input_check_left_only1:
    ; Only LEFT allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_apply_velocity
    ld b, -2
    jr input_apply_velocity
input_check_up_only1:
    ; Only UP allowed
    ld c, -2
    jr input_apply_velocity

input_move_downright:
    ; Check if both DOWN and RIGHT are allowed
    ld a, d
    and DIR_ALLOW_DOWN
    jr z, input_check_right_only2 ; DOWN not allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_check_down_only2 ; RIGHT not allowed
    ; Both allowed - diagonal
    ld b, 1
    ld c, 1
    jr input_apply_velocity
input_check_right_only2:
    ; Only RIGHT allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity
    ld b, 2
    jr input_apply_velocity
input_check_down_only2:
    ; Only DOWN allowed
    ld c, 2
    jr input_apply_velocity

input_move_downleft:
    ; Check if both DOWN and LEFT are allowed
    ld a, d
    and DIR_ALLOW_DOWN
    jr z, input_check_left_only3 ; DOWN not allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_check_down_only3 ; LEFT not allowed
    ; Both allowed - diagonal
    ld b, -1
    ld c, 1
    jr input_apply_velocity
input_check_left_only3:
    ; Only LEFT allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_apply_velocity
    ld b, -2
    jr input_apply_velocity
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
    djnz input_update_loop
    ret
`;
}

/**
 * Generate Behavior Component System
 */
function generateBehaviorSystem(): string {
    return `
; ==================================================================
; BEHAVIOR COMPONENT SYSTEM (Based on BehaviorEditor logic)
; ==================================================================

init_behavior_system:
    ; Initialize AI/behavior system
    ret

update_behavior_component:
    ; Update AI/behavior logic for entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

behavior_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_BEHAVIOR     ; Check if has behavior component
    jr z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior scripts/AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
    inc hl                     ; Next entity
    djnz behavior_update_loop
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
    ; Set default health values
    ld hl, entity_health
    ld de, entity_health+1
    ld bc, 31
    ld (hl), 100               ; Default health = 100
    ldir
    ret

update_health_component:
    ; Update health states (damage, healing, death)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld ix, entity_health       ; Health data

health_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_HEALTH       ; Check if has health component
    jr z, health_next_entity   ; Skip if no health component

    ; Check if entity is dead
    ld a, (ix+0)               ; Get health value
    or a                       ; Check if 0
    jr z, health_entity_dead   ; Handle death

    ; Entity is alive - continue
    jr health_next_entity

health_entity_dead:
    ; Handle entity death
    ; TODO: Trigger death animation, remove entity, etc.

health_next_entity:
    inc hl                     ; Next entity
    inc ix                     ; Next health value
    djnz health_update_loop
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
    ; Initialize animation system
    ; Clear animation frames
    ld hl, entity_anim_frame
    ld de, entity_anim_frame+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_animation_component:
    ; Update sprite animations
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld ix, entity_anim_frame   ; Animation frame data

anim_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_ANIMATION    ; Check if has animation component
    jr z, anim_next_entity     ; Skip if no animation component

    ; Advance animation frame
    ld a, (ix+0)               ; Get current frame
    inc a                      ; Next frame
    cp 4                       ; Check if >= max frames (TODO: make dynamic)
    jr c, anim_store_frame     ; If < max, store it
    xor a                      ; Reset to frame 0

anim_store_frame:
    ld (ix+0), a               ; Store new frame

anim_next_entity:
    inc hl                     ; Next entity
    inc ix                     ; Next animation data
    djnz anim_update_loop
    ret
`;
}

/**
 * Generate Jump Component System
 */
function generateJumpSystem(): string {
    return `
; ==================================================================
; JUMP COMPONENT SYSTEM (Platform physics with multi-jump support)
; ==================================================================

init_jump_system:
    ; Initialize jump system
    ; Clear jump velocities
    ld hl, entity_jump_vel_y
    ld de, entity_jump_vel_y+1
    ld bc, 63                  ; 64 bytes - 1 (32 words)
    ld (hl), 0
    ldir

    ; Clear jump counters
    ld hl, entity_jump_count
    ld de, entity_jump_count+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear ground flags
    ld hl, entity_on_ground
    ld de, entity_on_ground+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_jump_component:
    ; Update jump physics for entities
    ; Handles jump initiation, velocity application, and multi-jump logic
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

jump_update_loop:
    ld a, (hl)                 ; Get entity component mask (low byte)
    and #00                    ; Check low byte
    ld e, a                    ; Store low byte
    inc hl
    ld a, (hl)                 ; Get high byte
    and #01                    ; Check COMP_MASK_JUMP high byte (#0100)
    jr z, jump_next_entity     ; Skip if no jump component
    dec hl                     ; Restore HL

    ; Entity has jump component - check for jump input
    push bc
    push hl

    ; Check if fire button pressed (jump trigger)
    ld a, (input_state)
    bit 4, a                   ; Bit 4 = fire button
    jr z, jump_no_input        ; No jump input

    ; Jump button pressed - check if can jump
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; Get ground flag
    bit 0, a                   ; Check if on ground
    jr nz, jump_execute        ; Can jump if grounded

    ; Not grounded - check jump count for multi-jump
    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)                 ; Get current jump count
    cp 2                       ; Check if < maxJumps (TODO: make dynamic)
    jr nc, jump_no_input       ; Already used all jumps

jump_execute:
    ; Execute jump - apply jump power
    ld hl, entity_jump_vel_y
    ld e, c
    ld d, 0
    add hl, de
    add hl, de                 ; HL points to jump_vel_y (word)

    ; Set jump velocity (negative = upward)
    ; jumpPower from component defaults: 256-384 (word value)
    ld (hl), #00               ; Low byte = 0
    inc hl
    ld (hl), #FE               ; High byte = -2 (signed, ~512 in fixed-point)

    ; Increment jump counter
    ld hl, entity_jump_count
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    inc a
    ld (hl), a

    ; Clear ground flag
    ld hl, entity_on_ground
    add hl, de
    ld (hl), 0

jump_no_input:
    ; Apply jump velocity to entity Y position
    ld hl, entity_jump_vel_y
    ld e, c
    ld d, 0
    add hl, de
    add hl, de                 ; HL points to jump velocity (word)

    ld e, (hl)                 ; Load jump velocity low
    inc hl
    ld d, (hl)                 ; Load jump velocity high

    ; Add velocity to Y position
    ld hl, entity_y_pos
    ld a, c
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)                 ; Current Y
    add a, d                   ; Add velocity high byte (integer part)
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc

jump_next_entity:
    inc hl                     ; Next entity mask (skip 2 bytes for 16-bit)
    inc hl
    inc c                      ; Next entity index
    djnz jump_update_loop
    ret
`;
}

/**
 * Generate Gravity Component System
 */
function generateGravitySystem(): string {
    return `
; ==================================================================
; GRAVITY COMPONENT SYSTEM (Constant downward acceleration)
; ==================================================================

init_gravity_system:
    ; Initialize gravity system
    ; Clear gravity velocities
    ld hl, entity_gravity_vel
    ld de, entity_gravity_vel+1
    ld bc, 63                  ; 64 bytes - 1 (32 words)
    ld (hl), 0
    ldir
    ret

update_gravity_component:
    ; Apply gravity acceleration to entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

gravity_update_loop:
    ld a, (hl)                 ; Get entity component mask (low byte)
    inc hl
    ld a, (hl)                 ; Get high byte
    and #02                    ; Check COMP_MASK_GRAVITY (#0200)
    jr z, gravity_next_entity  ; Skip if no gravity component
    dec hl                     ; Restore HL

    ; Entity has gravity - apply acceleration
    push bc
    push hl

    ; Check if entity is grounded
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    bit 0, a                   ; Check ground flag
    jr nz, gravity_grounded    ; Skip gravity if on ground

    ; Apply gravity acceleration
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de                 ; HL points to gravity velocity (word)

    ld e, (hl)                 ; Load current gravity velocity
    inc hl
    ld d, (hl)

    ; Add gravity strength (64 in fixed-point = ~0.25 pixels/frame acceleration)
    ld a, e
    add a, #40                 ; Add 64 to low byte
    ld e, a
    ld a, d
    adc a, #00                 ; Add carry to high byte
    ld d, a

    ; Check terminal velocity (1024 = max fall speed)
    ld a, d
    cp #04                     ; Check if >= 1024
    jr c, gravity_store_vel    ; If < 1024, continue
    ld de, #0400               ; Cap at terminal velocity

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
    ld a, (hl)                 ; Current Y
    add a, d                   ; Add velocity high byte (integer part)
    ld (hl), a                 ; Store new Y

    jr gravity_done

gravity_grounded:
    ; Entity is grounded - reset gravity velocity
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    ld (hl), 0                 ; Clear velocity low
    inc hl
    ld (hl), 0                 ; Clear velocity high

gravity_done:
    pop hl
    pop bc

gravity_next_entity:
    inc hl                     ; Next entity mask (2 bytes)
    inc hl
    inc c                      ; Next entity index
    djnz gravity_update_loop
    ret
`;
}

/**
 * Generate entity management helper functions
 */
function generateEntityManagement(): string {
    return `
; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS (Based on EntityTemplate system)
; ==================================================================

; Create entity with components (A = entity ID, B = component mask)
create_entity:
    ; Set component mask for entity
    ld hl, entity_comp_masks
    ld e, a                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity mask
    ld (hl), b                 ; Set component mask

    ; Initialize component data based on mask
    bit 0, b                   ; Check COMP_MASK_POSITION
    call nz, init_entity_position

    bit 1, b                   ; Check COMP_MASK_SPRITE
    call nz, init_entity_sprite

    ; TODO: Initialize other components based on mask bits

    ret

; Initialize position component for entity (A = entity ID)
init_entity_position:
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 100               ; Default X position

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 100               ; Default Y position
    ret

; Initialize sprite component for entity (A = entity ID)
init_entity_sprite:
    ; Set sprite as visible with default pattern
    ld hl, sprite_pattern
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Pattern 0

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color
    ret
`;
}

/**
 * Generate init_components function with conditional initialization
 */
function generateInitComponents(usage: ComponentUsageAnalysis): string {
    const usedComponents = usage.usedComponents;

    let code = `init_components:
    ; Initialize component systems (OPTIMIZED - only used components)
    ; Used: ${Array.from(usedComponents).join(', ')}

    ; Initialize current screen ID (multi-screen support)
    ld a, 0                    ; Start at screen 0
    ld (current_screen_id), a

    ; Clear all component masks
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31
    ld (hl), 0
    ldir

`;

    if (usedComponents.has('Position')) {
        code += `    ; Initialize position system
    call init_position_system
`;
    }

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
; GAME COMPONENT SYSTEMS (SKIPPED - NO ENTITIES DETECTED)
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
; END OF COMPONENTS (MINIMAL VERSION)
; ==================================================================
`;
    }

    // INTELLIGENT FILTERING: Analyze which components are actually used
    const componentUsage: ComponentUsageAnalysis = analyzeComponentUsage(analysis);
    const usedComponents = componentUsage.usedComponents;

    console.log('🎯 Generating optimized components.asm...');
    console.log(`  - Active entities: ${componentUsage.activeEntities.length}`);
    console.log(`  - Used components: ${Array.from(usedComponents).join(', ')}`);
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
; COMPONENT TYPE CONSTANTS (Based on ComponentDefinition analysis)
; ==================================================================

; Core Components (always present)
COMP_POSITION   EQU 0    ; Position component (x, y coordinates)
COMP_SPRITE     EQU 1    ; Sprite rendering component
COMP_MOVEMENT   EQU 2    ; Movement/velocity component
COMP_COLLISION  EQU 3    ; Collision detection component
COMP_INPUT      EQU 4    ; Input handling component
COMP_BEHAVIOR   EQU 5    ; AI/Logic behavior component
COMP_HEALTH     EQU 6    ; Health/damage component
COMP_ANIMATION  EQU 7    ; Animation state component
COMP_JUMP       EQU 8    ; Jump behavior component (platformer physics)
COMP_GRAVITY    EQU 9    ; Gravity physics component

; Component flags for entity filtering (16-bit masks for 10+ components)
COMP_MASK_POSITION   EQU #0001  ; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002  ; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004  ; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008  ; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010  ; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020  ; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040  ; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080  ; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100  ; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200  ; Binary: 0000001000000000

; ==================================================================
; COMPONENT DATA STRUCTURES (Entity-Component arrays)
; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

; Jump Component Data (Fixed-Point 8.8 for smooth physics)
; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3       ; Y velocity for jumping (signed word, 32 words = 64 bytes)
entity_jump_count   EQU temp_byte_4       ; Current jump count (0=grounded, 1=first jump, etc.) (32 bytes)
entity_on_ground    EQU temp_byte_5       ; Ground contact flag (bit 0 = on ground) (32 bytes)

; Gravity Component Data
entity_gravity_vel  EQU temp_word_4       ; Accumulated gravity velocity (signed word, 64 bytes)


; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

${generateInitComponents(componentUsage)}
`;

    // Generate Position System (if used)
    if (usedComponents.has('Position')) {
        code += generatePositionSystem();
    } else {
        code += `
; Position system filtered out (not used)
init_position_system:
    ret

update_position_component:
    ret
`;
    }

    // Generate Sprite System (if used)
    if (usedComponents.has('Sprite')) {
        code += generateSpriteSystem(analysis);
    } else {
        code += `
; Sprite system filtered out (not used)
init_sprite_system:
    ret

update_sprite_component:
    ret
`;
    }

    // Generate Movement System (if used)
    if (usedComponents.has('Movement')) {
        code += generateMovementSystem();
    } else {
        code += `
; Movement system filtered out (not used)
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
; Collision system filtered out (not used)
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
; Input system filtered out (not used)
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
; Behavior system filtered out (not used)
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
; Health system filtered out (not used)
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
; Animation system filtered out (not used)
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
; Jump system filtered out (not used)
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
; Gravity system filtered out (not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
`;
    }

    // Always include entity management helpers
    code += generateEntityManagement();

    // End of file
    code += `
; ==================================================================
; END OF COMPONENT SYSTEMS
; ==================================================================
`;

    return code;
}
