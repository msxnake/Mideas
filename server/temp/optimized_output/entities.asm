; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: 10
;   Actually instantiated: 1
;   Filtered out: 9 unused templates
;
; ==================================================================

; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

; Entity: entity1 1 (instance from template: tpl_1759678281022_hvd7j)
ENTITY_ENTITY1_1_ID EQU 0
ENTITY_ENTITY1_1_COMP_MASK EQU #03  ; Component mask: 00000011b
ENTITY_ENTITY1_1_TEMPLATE EQU "tpl_1759678281022_hvd7j"
ENTITY_ENTITY1_1_X EQU 15
ENTITY_ENTITY1_1_Y EQU 11

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (1 entities)
    call init_entity1_1
    ret

update_entities:
    ; Update all active entities (1 entities)
    call update_entity1_1
    ret

init_entity1_1:
    ; Initialize entity1 1 at real position from JSON
    ; JSON position: (15, 11) tiles = (240, 176) pixels
    ; Template: tpl_1759678281022_hvd7j
    ; Components: Position, Sprite

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ld a, 0             ; Entity ID
    ld b, #03              ; Component mask (00000011b)
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 0             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 240         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 176         ; Set real Y position from JSON

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 0          ; Use entity index as sprite pattern

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ; Make sprite visible immediately
    ld a, 0             ; Sprite number
    ld b, 240            ; X position
    ld c, 176            ; Y position
    ld d, 0             ; Pattern
    ld e, 15                   ; Color
    call show_sprite
    ret

update_entity1_1:
    ; Update entity1 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 0
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

; ==================================================================
; END OF ENTITIES
; ==================================================================
