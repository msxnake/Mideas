; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
; File: components.asm
; Description: Component systems based on Mideas React.js architecture
; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
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

; Component flags for entity filtering
COMP_MASK_POSITION   EQU #01  ; Binary: 00000001
COMP_MASK_SPRITE     EQU #02  ; Binary: 00000010
COMP_MASK_MOVEMENT   EQU #04  ; Binary: 00000100
COMP_MASK_COLLISION  EQU #08  ; Binary: 00001000
COMP_MASK_INPUT      EQU #10  ; Binary: 00010000
COMP_MASK_BEHAVIOR   EQU #20  ; Binary: 00100000
COMP_MASK_HEALTH     EQU #40  ; Binary: 01000000
COMP_MASK_ANIMATION  EQU #80  ; Binary: 10000000

; ==================================================================
; COMPONENT DATA STRUCTURES (Entity-Component arrays)
; ==================================================================

; Position Component Data (32 entities max)
entity_x_pos        EQU sprite_x_pos      ; Reuse sprite positions
entity_y_pos        EQU sprite_y_pos      ; (32 bytes each)

; Movement Component Data
entity_vel_x        EQU temp_word_1       ; X velocity storage (signed 8-bit)
entity_vel_y        EQU temp_word_2       ; Y velocity storage (signed 8-bit)

; Component masks for each entity (which components are active)
entity_comp_masks   EQU temp_byte_1       ; Component flags per entity (32 bytes)

; Animation Component Data
entity_anim_frame   EQU temp_byte_2       ; Current animation frame (32 bytes)

; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

INIT_COMPONENTS:
    ; Initialize all component systems (based on Mideas initialization)

    ; Clear all component masks
    LD HL, entity_comp_masks
    LD DE, entity_comp_masks+1
    LD BC, 31
    LD (HL), 0
    LDIR

    ; Initialize position system
    CALL INIT_POSITION_SYSTEM

    ; Initialize sprite system
    CALL INIT_SPRITE_SYSTEM

    ; Initialize movement system
    CALL INIT_MOVEMENT_SYSTEM

    ; Initialize collision system
    CALL INIT_COLLISION_SYSTEM

    ; Initialize input system
    CALL INIT_INPUT_SYSTEM

    ; Initialize behavior system
    CALL INIT_BEHAVIOR_SYSTEM

    RET

; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

INIT_POSITION_SYSTEM:
    ; Initialize position component system
    ; Clear all entity positions
    LD HL, entity_x_pos
    LD DE, entity_x_pos+1
    LD BC, 31
    LD (HL), 0
    LDIR

    LD HL, entity_y_pos
    LD DE, entity_y_pos+1
    LD BC, 31
    LD (HL), 0
    LDIR
    RET

UPDATE_POSITION_COMPONENT:
    ; Update positions based on velocities (Movement → Position)
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks

position_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_POSITION     ; Check if has position component
    JR Z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    LD A, (HL)
    AND COMP_MASK_MOVEMENT
    JR Z, position_next_entity ; Skip velocity if no movement

    ; TODO: Add velocity to position logic here
    ; entity_x_pos[entity] += entity_vel_x[entity]
    ; entity_y_pos[entity] += entity_vel_y[entity]

position_next_entity:
    INC HL                     ; Next entity
    DJNZ position_update_loop
    RET

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

INIT_SPRITE_SYSTEM:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    CALL CLEAR_ALL_SPRITES
    RET

UPDATE_SPRITE_COMPONENT:
    ; Update sprite rendering based on entity positions
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks
    LD C, 0                    ; Entity index counter

sprite_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_SPRITE       ; Check if has sprite component
    JR Z, sprite_next_entity   ; Skip if no sprite component

    ; Render sprite at entity position
    PUSH BC
    PUSH HL

    ; Get entity position
    LD HL, entity_x_pos
    LD E, C                    ; Entity index
    LD D, 0
    ADD HL, DE                 ; HL points to entity X
    LD B, (HL)                 ; B = X position

    LD HL, entity_y_pos
    ADD HL, DE                 ; HL points to entity Y
    LD C, (HL)                 ; C = Y position

    ; Show sprite (A=sprite#, B=X, C=Y, D=pattern, E=color)
    LD A, E                    ; Sprite number = entity index
    LD D, 0                    ; Pattern 0 (TODO: get from entity data)
    LD E, 15                   ; Color white (TODO: get from entity data)
    CALL SHOW_SPRITE

    POP HL
    POP BC

sprite_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity index
    DJNZ sprite_update_loop

    ; Update all sprites to VRAM
    CALL UPDATE_SPRITES_TO_VRAM
    RET

; ==================================================================
; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
; ==================================================================

INIT_MOVEMENT_SYSTEM:
    ; Initialize movement/physics system
    ; Clear velocities
    LD A, 0
    LD (entity_vel_x), A
    LD (entity_vel_y), A
    RET

UPDATE_MOVEMENT_COMPONENT:
    ; Update movement/physics for entities
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks

movement_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_MOVEMENT     ; Check if has movement component
    JR Z, movement_next_entity ; Skip if no movement component

    ; Apply physics/movement logic here
    ; TODO: Apply gravity, friction, collision response, etc.

movement_next_entity:
    INC HL                     ; Next entity
    DJNZ movement_update_loop
    RET

; ==================================================================
; COLLISION COMPONENT SYSTEM (Based on ScreenEditor collision detection)
; ==================================================================

INIT_COLLISION_SYSTEM:
    ; Initialize collision detection system
    RET

UPDATE_COLLISION_COMPONENT:
    ; Check collisions between entities and environment
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks
    LD C, 0                    ; Entity index

collision_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_COLLISION    ; Check if has collision component
    JR Z, collision_next_entity ; Skip if no collision component

    ; Perform collision detection for this entity
    PUSH BC
    PUSH HL

    ; Get entity position
    LD HL, entity_x_pos
    LD E, C                    ; Entity index
    LD D, 0
    ADD HL, DE                 ; HL points to entity X
    LD A, (HL)                 ; A = X position

    LD HL, entity_y_pos
    ADD HL, DE                 ; HL points to entity Y
    LD B, (HL)                 ; B = Y position

    ; Check screen boundaries (256x192 with 16x16 sprites)
    ; Left boundary
    CP 0
    JR Z, collision_boundary_hit

    ; Right boundary (256 - 16 = 240)
    CP 240
    JR NC, collision_boundary_hit

    ; Top boundary
    LD A, B
    CP 0
    JR Z, collision_boundary_hit

    ; Bottom boundary (192 - 16 = 176)
    CP 176
    JR NC, collision_boundary_hit

    ; Check tile collision (if screen maps exist)
    CALL CHECK_TILE_COLLISION

    ; Check entity-to-entity collision
    CALL CHECK_ENTITY_COLLISION

    JR collision_check_complete

collision_boundary_hit:
    ; Handle boundary collision
    CALL HANDLE_BOUNDARY_COLLISION

collision_check_complete:
    POP HL
    POP BC

collision_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity index
    DJNZ collision_update_loop
    RET

; ==================================================================
; COLLISION HELPER FUNCTIONS (Critical for Gameplay Parity)
; ==================================================================

CHECK_TILE_COLLISION:
    ; Check collision with background tiles
    ; A = X position, B = Y position
    ; Convert pixel position to tile coordinates
    PUSH AF
    PUSH BC

    ; DYNAMIC TILE SIZE CONVERSION
    ; TODO: This should be calculated from actual screen map tile sizes
    ; For now, detect most common tile size in project

    ; Project tile analysis: 16x16
    ; Using first tile as reference: 16x16
    ; Convert X to tile column (divide by 16)


    ; Divide by 16 (4 shifts)
    SRL A                      ; A = X / 2
    SRL A                      ; A = X / 4
    SRL A                      ; A = X / 8
    SRL A                      ; A = X / 16
    LD C, A                    ; C = tile column


    ; Convert Y to tile row (divide by 16)
    LD A, B
    SRL A                      ; A = Y / 2
    SRL A                      ; A = Y / 4
    SRL A                      ; A = Y / 8
    SRL A                      ; A = Y / 16
    LD B, A                    ; B = tile row

    ; Check if position is within valid tile map
    LD A, C
    CP 16                      ; Screen width in tiles
    JR NC, no_tile_collision
    LD A, B
    CP 12                      ; Screen height in tiles
    JR NC, no_tile_collision

    ; Get tile at position (simplified - would read from behavior map)
    ; For now, assume all non-zero tiles are solid
    ; This would read from the behavior map generated from screen data
    CALL GET_BEHAVIOR_TILE     ; Returns A = behavior value
    OR A
    JR Z, no_tile_collision    ; 0 = passable

    ; Collision detected - handle it
    CALL HANDLE_TILE_COLLISION

no_tile_collision:
    POP BC
    POP AF
    RET

CHECK_ENTITY_COLLISION:
    ; Check collision with other entities
    ; A = current entity X, B = current entity Y, C = current entity index
    PUSH BC
    PUSH AF

    ; Loop through all other entities
    LD HL, entity_comp_masks
    LD E, 0                    ; Other entity index

entity_collision_loop:
    LD A, E
    CP C                       ; Skip self
    JR Z, next_entity_collision

    ; Check if other entity has collision component
    LD A, (HL)
    AND COMP_MASK_COLLISION
    JR Z, next_entity_collision

    ; Get other entity position
    PUSH HL
    PUSH DE

    LD HL, entity_x_pos
    LD D, 0
    ADD HL, DE                 ; HL points to other entity X
    LD D, (HL)                 ; D = other X

    LD HL, entity_y_pos
    ADD HL, DE                 ; HL points to other entity Y
    LD E, (HL)                 ; E = other Y

    ; Check if entities overlap (16x16 sprites)
    ; Current entity: A = X, B = Y
    ; Other entity: D = X, E = Y

    ; X overlap check: |X1 - X2| < 16
    LD H, A                    ; H = current X
    LD A, D                    ; A = other X
    SUB H                      ; A = other X - current X
    JR NC, x_diff_positive     ; Jump if positive
    NEG                        ; Make positive
x_diff_positive:
    CP 16                      ; Check if < 16
    JR NC, no_entity_collision ; No X overlap

    ; Y overlap check: |Y1 - Y2| < 16
    LD A, E                    ; A = other Y
    SUB B                      ; A = other Y - current Y
    JR NC, y_diff_positive     ; Jump if positive
    NEG                        ; Make positive
y_diff_positive:
    CP 16                      ; Check if < 16
    JR NC, no_entity_collision ; No Y overlap

    ; Collision detected!
    CALL HANDLE_ENTITY_COLLISION

no_entity_collision:
    POP DE
    POP HL

next_entity_collision:
    INC HL                     ; Next entity mask
    INC E                      ; Next entity index
    LD A, E
    CP 32                      ; Check all 32 entities
    JR NZ, entity_collision_loop

    POP AF
    POP BC
    RET

HANDLE_BOUNDARY_COLLISION:
    ; Handle collision with screen boundaries
    ; Stop movement in the collision direction
    LD A, 0
    LD (entity_vel_x), A       ; Stop X movement
    LD (entity_vel_y), A       ; Stop Y movement
    RET

HANDLE_TILE_COLLISION:
    ; Handle collision with solid tiles
    ; Prevent movement into the tile
    LD A, 0
    LD (entity_vel_x), A       ; Stop X movement
    LD (entity_vel_y), A       ; Stop Y movement
    RET

HANDLE_ENTITY_COLLISION:
    ; Handle collision between entities
    ; Implementation depends on game logic (damage, bouncing, etc.)
    RET

GET_BEHAVIOR_TILE:
    ; Get behavior value for tile at (B, C)
    ; Returns A = behavior value (0=passable, 1=solid, etc.)
    ; This would read from the behavior map data
    ; For now, return 0 (all passable)
    LD A, 0
    RET

; ==================================================================
; INPUT COMPONENT SYSTEM (Based on input handling)
; ==================================================================

INIT_INPUT_SYSTEM:
    ; Initialize input handling system
    XOR A
    LD (input_state), A
    LD (prev_input_state), A
    RET

UPDATE_INPUT_COMPONENT:
    ; Update input handling for player entities
    ; Store previous input state for edge detection
    LD A, (input_state)
    LD (prev_input_state), A

    ; Read current joystick state
    LD A, 0                    ; Joystick port 0
    CALL GTSTCK                ; Get joystick status (BIOS call)
    LD (input_state), A        ; Store current input state

    ; Process input for entities with input component
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks
    LD C, 0                    ; Entity index

input_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_INPUT        ; Check if has input component
    JR Z, input_next_entity    ; Skip if no input component

    ; Apply input to entity movement (real implementation)
    PUSH BC
    PUSH HL

    ; Convert joystick input to velocity
    LD A, (input_state)
    LD B, 0                    ; Default X velocity
    LD C, 0                    ; Default Y velocity

    ; Check directional input
    CP STICK_UP
    JR Z, input_move_up
    CP STICK_DOWN
    JR Z, input_move_down
    CP STICK_LEFT
    JR Z, input_move_left
    CP STICK_RIGHT
    JR Z, input_move_right
    CP STICK_UPRIGHT
    JR Z, input_move_upright
    CP STICK_UPLEFT
    JR Z, input_move_upleft
    CP STICK_DOWNRIGHT
    JR Z, input_move_downright
    CP STICK_DOWNLEFT
    JR Z, input_move_downleft
    JR input_apply_velocity

input_move_up:
    LD C, -2                   ; Negative Y velocity (up)
    JR input_apply_velocity

input_move_down:
    LD C, 2                    ; Positive Y velocity (down)
    JR input_apply_velocity

input_move_left:
    LD B, -2                   ; Negative X velocity (left)
    JR input_apply_velocity

input_move_right:
    LD B, 2                    ; Positive X velocity (right)
    JR input_apply_velocity

input_move_upright:
    LD B, 1                    ; Diagonal movement (slower)
    LD C, -1
    JR input_apply_velocity

input_move_upleft:
    LD B, -1
    LD C, -1
    JR input_apply_velocity

input_move_downright:
    LD B, 1
    LD C, 1
    JR input_apply_velocity

input_move_downleft:
    LD B, -1
    LD C, 1

input_apply_velocity:
    ; Apply calculated velocity to entity
    ; Store X velocity (entity_vel_x is temp storage for now)
    LD A, B
    LD (entity_vel_x), A       ; Store calculated X velocity

    ; Store Y velocity
    LD A, C
    LD (entity_vel_y), A       ; Store calculated Y velocity

    POP HL
    POP BC

input_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity index
    DJNZ input_update_loop
    RET

; ==================================================================
; BEHAVIOR COMPONENT SYSTEM (Based on BehaviorEditor logic)
; ==================================================================

INIT_BEHAVIOR_SYSTEM:
    ; Initialize AI/behavior system
    RET

UPDATE_BEHAVIOR_COMPONENT:
    ; Update AI/behavior logic for entities
    LD B, 32                   ; Loop through all entities
    LD HL, entity_comp_masks   ; Check component masks

behavior_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_BEHAVIOR     ; Check if has behavior component
    JR Z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior scripts/AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
    INC HL                     ; Next entity
    DJNZ behavior_update_loop
    RET

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS (Based on EntityTemplate system)
; ==================================================================

; Create entity with components (A = entity ID, B = component mask)
CREATE_ENTITY:
    ; Set component mask for entity
    LD HL, entity_comp_masks
    LD E, A                    ; Entity index
    LD D, 0
    ADD HL, DE                 ; HL points to entity mask
    LD (HL), B                 ; Set component mask

    ; Initialize component data based on mask
    BIT 0, B                   ; Check COMP_MASK_POSITION
    CALL NZ, INIT_ENTITY_POSITION

    BIT 1, B                   ; Check COMP_MASK_SPRITE
    CALL NZ, INIT_ENTITY_SPRITE

    ; TODO: Initialize other components based on mask bits

    RET

; Initialize position component for entity (A = entity ID)
INIT_ENTITY_POSITION:
    LD HL, entity_x_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 100               ; Default X position

    LD HL, entity_y_pos
    ADD HL, DE
    LD (HL), 100               ; Default Y position
    RET

; Initialize sprite component for entity (A = entity ID)
INIT_ENTITY_SPRITE:
    ; Set sprite as visible with default pattern
    LD HL, sprite_pattern
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Pattern 0

    LD HL, sprite_color
    ADD HL, DE
    LD (HL), 15                ; White color
    RET

; ==================================================================
; END OF COMPONENT SYSTEMS
; ==================================================================
