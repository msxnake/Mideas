; Behavior: Simple Horizontal Patrol
; Needs ENTITY_X_ADDR, PATROL_MIN_X, PATROL_MAX_X, ENTITY_DIRECTION_ADDR

PATROL_SPEED equ 1

entity_init:
    ; Initialize direction (e.g., 0 for right, 1 for left)
    ld hl, ENTITY_DIRECTION_ADDR
    ld [hl], 0 ; Start by moving right
    ret

entity_update:
    ld hl, ENTITY_X_ADDR
    ld a, [hl]
    ld bc, ENTITY_DIRECTION_ADDR
    ld b, [bc] ; Load current direction into B

    cp PATROL_MAX_X
    jr nc, .go_left ; If X >= MAX_X, go left

    cp PATROL_MIN_X
    jr c, .go_right ; If X < MIN_X, go right

.check_direction:
    ld a, b ; Get direction from B
    or a    ; Check if zero (moving right)
    jr z, .move_right

.move_left:
    ld hl, ENTITY_X_ADDR
    ld a, [hl]
    sub PATROL_SPEED
    ld [hl], a
    ret

.move_right:
    ld hl, ENTITY_X_ADDR
    ld a, [hl]
    add a, PATROL_SPEED
    ld [hl], a
    ret

.go_left:
    ld bc, ENTITY_DIRECTION_ADDR
    ld [bc], 1 ; Set direction to left
    jr .move_left

.go_right:
    ld bc, ENTITY_DIRECTION_ADDR
    ld [bc], 0 ; Set direction to right
    jr .move_right
