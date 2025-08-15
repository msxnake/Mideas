; Behavior: Basic Entity Movement
; This script expects ENTITY_X_ADDR and ENTITY_Y_ADDR to be defined elsewhere,
; pointing to the entity's X and Y coordinate memory locations.

MOVE_SPEED equ 1

entity_update:
    ; Example: Move right continuously
    ld hl, ENTITY_X_ADDR
    ld a, [hl]
    add a, MOVE_SPEED
    ld [hl], a
    ret

entity_on_collision:
    ; Example: Reverse direction on collision
    ; This is highly conceptual and depends on game's collision system.
    ; Assume collision sets a flag or calls this routine.
    ld hl, ENTITY_MOVE_DIRECTION_ADDR ; Assume a direction variable
    ld a, [hl]
    xor #FF ; Flip bits (e.g., if 0=right, FF=left)
    inc a   ; Ensure it's not 0 if it was FF
    ld [hl], a
    ret

; Define your entity-specific memory locations (example)
; ENTITY_X_ADDR: defw #C000 ; Example VRAM address for X pos
; ENTITY_Y_ADDR: defw #C001 ; Example VRAM address for Y pos
; ENTITY_MOVE_DIRECTION_ADDR: defw #C002 ; Example for direction
