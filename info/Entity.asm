
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