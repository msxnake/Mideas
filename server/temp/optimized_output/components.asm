; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
; File: components.asm
; Description: Component systems based on Mideas React.js architecture
; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: 1
;   Used components: Position, Sprite
;   Filtered out: 6 unused component systems
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

; Health Component Data
entity_health       EQU temp_byte_3       ; Health value per entity (32 bytes)

; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

init_components:
    ; Initialize component systems (OPTIMIZED - only used components)
    ; Used: Position, Sprite

    ; Clear all component masks
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize position system
    call init_position_system
    ; Initialize sprite system
    call init_sprite_system

    ret


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
    ; Update positions based on velocities (Movement → Position)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, (hl)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

    ; TODO: Add velocity to position logic here
    ; entity_x_pos[entity] += entity_vel_x[entity]
    ; entity_y_pos[entity] += entity_vel_y[entity]

position_next_entity:
    inc hl                     ; Next entity
    djnz position_update_loop
    ret

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

    ; Render sprite at entity position
    push bc
    push hl

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

    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz sprite_update_loop

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret

; Movement system filtered out (not used)
init_movement_system:
    ret

update_movement_component:
    ret

; Collision system filtered out (not used)
init_collision_system:
    ret

update_collision_component:
    ret

; Input system filtered out (not used)
init_input_system:
    ret

update_input_component:
    ret

; Behavior system filtered out (not used)
init_behavior_system:
    ret

update_behavior_component:
    ret

; Health system filtered out (not used)
init_health_system:
    ret

update_health_component:
    ret

; Animation system filtered out (not used)
init_animation_system:
    ret

update_animation_component:
    ret

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

; ==================================================================
; END OF COMPONENT SYSTEMS
; ==================================================================
