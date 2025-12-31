; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: 0
;   Actually instantiated: 1
;   Filtered out: -1 unused templates
;
; ==================================================================

; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

; Entity: BasicPatrol 1 (instance from template: tpl_1757846444390_6e3zn)
ENTITY_BASICPATROL_1_ID EQU 0
ENTITY_BASICPATROL_1_COMP_MASK EQU #03  ; Component mask: 00000011b
ENTITY_BASICPATROL_1_TEMPLATE EQU "tpl_1757846444390_6e3zn"
ENTITY_BASICPATROL_1_X EQU 14
ENTITY_BASICPATROL_1_Y EQU 13

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (1 entities)
    
    ; Ensure sprite system is reset whenever entities are initialized
    call init_sprites
    
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
    
    call init_basicpatrol_1
    ret

update_entities:
    ; Update all active entities (1 entities)
    call update_basicpatrol_1
    ret

init_basicpatrol_1:
    ; Initialize BasicPatrol 1 at real position from JSON
    ; JSON position: (14, 13) tiles = (112, 104) pixels
    ; Template: tpl_1757846444390_6e3zn
    ; Components: Position, Sprite
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 0             ; Entity ID
    ld b, #03              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 0             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 112         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 104         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (calculated from project data)


    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 0          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 2                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Force update sprite attributes immediately

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 0             ; Entity Index
    call force_update_entity_sprite



    ret

update_basicpatrol_1:
    ; Update BasicPatrol 1 logic with real behavior
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
