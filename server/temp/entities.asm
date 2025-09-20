; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================

; ==================================================================
; DEFAULT ENTITY SYSTEM
; ==================================================================

; Basic entity structure
ENTITY_PLAYER_ID EQU 0
ENTITY_ENEMY_ID  EQU 1

INIT_ENTITIES:
    ; Initialize default entities
    CALL INIT_PLAYER
    RET

UPDATE_ENTITIES:
    ; Update all entities
    CALL UPDATE_PLAYER
    RET

INIT_PLAYER:
    ; Initialize player entity
    RET

UPDATE_PLAYER:
    ; Update player logic
    RET

; ==================================================================
; END OF ENTITIES
; ==================================================================
