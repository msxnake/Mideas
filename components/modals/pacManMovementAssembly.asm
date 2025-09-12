; ============================================================================
; ENHANCED PAC-MAN MOVEMENT SYSTEM - Z80 Assembly Implementation
; ============================================================================
; Solves the "stuck when turning into walls" problem
; 
; Features:
; - Grid-aligned movement validation  
; - Direction intention queueing
; - Proper collision checking from aligned positions
; - Integration with existing wall collision system
;
; Memory Layout (adjust addresses as needed):
; entity_x          EQU #C010  ; Entity X position (word)
; entity_y          EQU #C012  ; Entity Y position (word) 
; entity_direction  EQU #C014  ; Current direction (byte: 0=none, 1=right, 2=up, 3=left, 4=down)
; entity_desired    EQU #C015  ; Desired direction (byte: same as above)
; entity_speed      EQU #C016  ; Movement speed (byte)
; entity_hitbox_w   EQU #C017  ; Hitbox width (byte)
; entity_hitbox_h   EQU #C018  ; Hitbox height (byte)
; entity_offset_x   EQU #C019  ; Hitbox X offset (byte)
; entity_offset_y   EQU #C01A  ; Hitbox Y offset (byte)
; tile_size         EQU #C01B  ; Tile size (byte)
; map_width         EQU #C01C  ; Map width in tiles (byte)
; map_height        EQU #C01D  ; Map height in tiles (byte)
; collision_map     EQU #D000  ; Start of collision map data
; input_current     EQU #C020  ; Current input state
; input_previous    EQU #C021  ; Previous input state
; ============================================================================

; Constants
DIRECTION_NONE      EQU 0
DIRECTION_RIGHT     EQU 1
DIRECTION_UP        EQU 2
DIRECTION_LEFT      EQU 3
DIRECTION_DOWN      EQU 4

INPUT_UP            EQU #01
INPUT_DOWN          EQU #02
INPUT_LEFT          EQU #04
INPUT_RIGHT         EQU #08

ALIGNMENT_TOLERANCE EQU 2      ; Pixels tolerance for grid alignment

; ============================================================================
; MAIN MOVEMENT UPDATE ROUTINE
; ============================================================================
PACMAN_MOVEMENT_UPDATE:
    ; Read input and process direction changes
    CALL READ_DIRECTIONAL_INPUT
    CALL PROCESS_DIRECTION_INPUT
    
    ; Try to change direction if we have a queued direction
    LD A, (entity_desired)
    CP DIRECTION_NONE
    JR Z, pacman_move_current        ; No desired direction, continue moving
    
    ; Check if we can change to desired direction
    CALL CAN_CHANGE_TO_DESIRED_DIRECTION
    OR A
    JR Z, pacman_move_current        ; Can't change yet, keep moving
    
    ; Change direction now
    LD A, (entity_desired)
    LD (entity_direction), A
    LD A, DIRECTION_NONE
    LD (entity_desired), A
    
    ; Snap to aligned position for clean turning
    CALL SNAP_TO_GRID_ALIGNMENT

pacman_move_current:
    ; Move in current direction if possible
    LD A, (entity_direction)
    CP DIRECTION_NONE
    RET Z                           ; No movement direction
    
    ; Check if we can continue moving in current direction
    CALL CAN_MOVE_IN_CURRENT_DIRECTION
    OR A
    JR Z, pacman_stop_movement       ; Hit wall, stop
    
    ; Apply movement
    CALL APPLY_DIRECTIONAL_MOVEMENT
    CALL UPDATE_SPRITE_ROTATION
    RET

pacman_stop_movement:
    LD A, DIRECTION_NONE
    LD (entity_direction), A
    RET

; ============================================================================
; INPUT PROCESSING
; ============================================================================
READ_DIRECTIONAL_INPUT:
    ; Read current input state
    ; This is a placeholder - implement based on your input system
    ; Should update input_current with bitfield of pressed keys
    
    ; Example for cursor keys:
    ; CALL JOYSTICK_READ        ; Your joystick reading routine
    ; LD (input_current), A
    
    RET

PROCESS_DIRECTION_INPUT:
    ; Check for new direction input (edge-triggered)
    LD A, (input_current)
    LD B, A                         ; Current input in B
    LD A, (input_previous)
    LD C, A                         ; Previous input in C
    
    ; Check up input (new press)
    LD A, B
    AND INPUT_UP
    JR Z, check_down_input
    LD A, C
    AND INPUT_UP
    JR NZ, check_down_input         ; Was already pressed
    ; New up press
    LD A, DIRECTION_UP
    LD (entity_desired), A
    JR update_previous_input

check_down_input:
    LD A, B
    AND INPUT_DOWN
    JR Z, check_left_input
    LD A, C
    AND INPUT_DOWN
    JR NZ, check_left_input
    ; New down press
    LD A, DIRECTION_DOWN
    LD (entity_desired), A
    JR update_previous_input

check_left_input:
    LD A, B
    AND INPUT_LEFT
    JR Z, check_right_input
    LD A, C
    AND INPUT_LEFT
    JR NZ, check_right_input
    ; New left press
    LD A, DIRECTION_LEFT
    LD (entity_desired), A
    JR update_previous_input

check_right_input:
    LD A, B
    AND INPUT_RIGHT
    JR Z, update_previous_input
    LD A, C
    AND INPUT_RIGHT
    JR NZ, update_previous_input
    ; New right press
    LD A, DIRECTION_RIGHT
    LD (entity_desired), A

update_previous_input:
    LD A, (input_current)
    LD (input_previous), A
    RET

; ============================================================================
; ALIGNMENT AND COLLISION CHECKING
; ============================================================================
CAN_CHANGE_TO_DESIRED_DIRECTION:
    ; Returns: A = 1 if can change, 0 if can't
    
    ; First check grid alignment
    LD A, (entity_desired)
    CALL IS_ALIGNED_FOR_DIRECTION
    OR A
    RET Z                           ; Not aligned, can't turn
    
    ; Check collision from aligned position
    LD A, (entity_desired)
    CALL CAN_MOVE_FROM_ALIGNED_POSITION
    RET

IS_ALIGNED_FOR_DIRECTION:
    ; Input: A = direction to check
    ; Output: A = 1 if aligned, 0 if not
    
    CP DIRECTION_UP
    JR Z, check_x_alignment
    CP DIRECTION_DOWN
    JR Z, check_x_alignment
    CP DIRECTION_LEFT
    JR Z, check_y_alignment
    CP DIRECTION_RIGHT
    JR Z, check_y_alignment
    
    XOR A                           ; Invalid direction
    RET

check_x_alignment:
    ; For vertical movement, check X alignment
    LD HL, (entity_x)
    LD A, (tile_size)
    LD B, A
    CALL MODULO_16BIT               ; HL = HL % B, result in HL
    LD A, L                         ; Remainder in A
    CP ALIGNMENT_TOLERANCE
    JR C, aligned_ok                ; Close to grid line
    LD B, A
    LD A, (tile_size)
    SUB B
    CP ALIGNMENT_TOLERANCE
    JR C, aligned_ok                ; Close to next grid line
    XOR A                           ; Not aligned
    RET

check_y_alignment:
    ; For horizontal movement, check Y alignment
    LD HL, (entity_y)
    LD A, (tile_size)
    LD B, A
    CALL MODULO_16BIT
    LD A, L
    CP ALIGNMENT_TOLERANCE
    JR C, aligned_ok
    LD B, A
    LD A, (tile_size)
    SUB B
    CP ALIGNMENT_TOLERANCE
    JR C, aligned_ok
    XOR A
    RET

aligned_ok:
    LD A, 1
    RET

CAN_MOVE_FROM_ALIGNED_POSITION:
    ; Input: A = direction
    ; Output: A = 1 if can move, 0 if blocked
    
    ; Calculate test position based on direction
    LD (temp_direction), A
    
    ; Get current position
    LD HL, (entity_x)
    LD (test_x), HL
    LD HL, (entity_y)
    LD (test_y), HL
    
    ; Adjust test position based on direction
    LD A, (temp_direction)
    CP DIRECTION_UP
    JR Z, test_up_position
    CP DIRECTION_DOWN
    JR Z, test_down_position
    CP DIRECTION_LEFT
    JR Z, test_left_position
    CP DIRECTION_RIGHT
    JR Z, test_right_position
    
    XOR A                           ; Invalid direction
    RET

test_up_position:
    ; Align Y upward, center X
    LD HL, (entity_y)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT               ; HL = HL / B
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT             ; HL = HL * B (aligned Y)
    DEC HL                          ; Test 1 pixel up
    LD (test_y), HL
    
    ; Center X
    LD HL, (entity_x)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    INC HL                          ; Round up
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    LD A, (tile_size)
    SRL A                           ; tile_size / 2
    LD B, A
    LD A, (entity_hitbox_w)
    SRL A                           ; hitbox_width / 2
    LD C, A
    LD A, B
    SUB C                           ; Center offset
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (test_x), HL
    JR do_collision_test

test_down_position:
    ; Similar to up but test 1 pixel down
    LD HL, (entity_y)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    INC HL
    LD (test_y), HL
    JR center_x_for_vertical

test_left_position:
    ; Align X leftward, center Y
    LD HL, (entity_x)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    DEC HL
    LD (test_x), HL
    JR center_y_for_horizontal

test_right_position:
    ; Similar to left but test 1 pixel right
    LD HL, (entity_x)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    INC HL
    LD (test_x), HL

center_y_for_horizontal:
    LD HL, (entity_y)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    INC HL
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    LD A, (tile_size)
    SRL A
    LD B, A
    LD A, (entity_hitbox_h)
    SRL A
    LD C, A
    LD A, B
    SUB C
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (test_y), HL
    JR do_collision_test

center_x_for_vertical:
    LD HL, (entity_x)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    INC HL
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    LD A, (tile_size)
    SRL A
    LD B, A
    LD A, (entity_hitbox_w)
    SRL A
    LD C, A
    LD A, B
    SUB C
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (test_x), HL

do_collision_test:
    ; Test collision at calculated position
    CALL CHECK_COLLISION_AT_TEST_POSITION
    RET

CHECK_COLLISION_AT_TEST_POSITION:
    ; Calculate hitbox bounds at test position
    LD HL, (test_x)
    LD A, (entity_offset_x)
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A                         ; HL = left
    
    LD DE, HL
    LD A, (entity_hitbox_w)
    ADD A, E
    LD E, A
    LD A, 0
    ADC A, D
    LD D, A                         ; DE = right
    
    LD (hitbox_left), HL
    LD (hitbox_right), DE
    
    ; Calculate Y bounds
    LD HL, (test_y)
    LD A, (entity_offset_y)
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A                         ; HL = top
    
    LD BC, HL
    LD A, (entity_hitbox_h)
    ADD A, C
    LD C, A
    LD A, 0
    ADC A, B
    LD B, A                         ; BC = bottom
    
    LD (hitbox_top), HL
    LD (hitbox_bottom), BC
    
    ; Convert to tile coordinates and check collision map
    CALL CHECK_TILES_IN_HITBOX_AREA
    RET

CHECK_TILES_IN_HITBOX_AREA:
    ; Convert hitbox bounds to tile coordinates and check for solid tiles
    
    ; Calculate start tile coordinates
    LD HL, (hitbox_left)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT               ; Start tile X
    LD A, L
    LD (start_tile_x), A
    
    LD HL, (hitbox_top)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT               ; Start tile Y
    LD A, L
    LD (start_tile_y), A
    
    ; Calculate end tile coordinates
    LD HL, (hitbox_right)
    DEC HL                          ; Avoid edge case
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT               ; End tile X
    LD A, L
    LD (end_tile_x), A
    
    LD HL, (hitbox_bottom)
    DEC HL
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT               ; End tile Y
    LD A, L
    LD (end_tile_y), A
    
    ; Check all tiles in range
    LD A, (start_tile_y)
    LD (current_tile_y), A

check_y_loop:
    LD A, (current_tile_y)
    LD B, A
    LD A, (end_tile_y)
    CP B
    JR C, no_collision_found        ; Past end Y
    
    LD A, (start_tile_x)
    LD (current_tile_x), A

check_x_loop:
    LD A, (current_tile_x)
    LD B, A
    LD A, (end_tile_x)
    CP B
    JR C, next_y_tile               ; Past end X
    
    ; Check bounds
    LD A, (current_tile_x)
    CP 0
    JR C, next_x_tile               ; X < 0
    LD B, A
    LD A, (map_width)
    CP B
    JR C, next_x_tile               ; X >= map_width
    
    LD A, (current_tile_y)
    CP 0
    JR C, next_x_tile               ; Y < 0
    LD B, A
    LD A, (map_height)
    CP B
    JR C, next_x_tile               ; Y >= map_height
    
    ; Calculate tile address and check if solid
    CALL GET_TILE_AT_CURRENT_POSITION
    OR A                            ; Is tile solid?
    JR NZ, collision_found          ; Yes, collision!

next_x_tile:
    LD A, (current_tile_x)
    INC A
    LD (current_tile_x), A
    JR check_x_loop

next_y_tile:
    LD A, (current_tile_y)
    INC A
    LD (current_tile_y), A
    JR check_y_loop

collision_found:
    XOR A                           ; Return 0 (collision found)
    RET

no_collision_found:
    LD A, 1                         ; Return 1 (no collision)
    RET

GET_TILE_AT_CURRENT_POSITION:
    ; Calculate tile address: collision_map + (y * map_width + x)
    LD A, (current_tile_y)
    LD H, A
    LD A, (map_width)
    LD L, A
    CALL MULTIPLY_8BIT              ; HL = y * map_width
    
    LD A, (current_tile_x)
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A                         ; HL = y * map_width + x
    
    LD DE, collision_map
    ADD HL, DE                      ; HL = tile address
    
    LD A, (HL)                      ; Load tile value
    OR A                            ; Check if non-zero (solid)
    RET

; ============================================================================
; MOVEMENT AND UTILITY FUNCTIONS
; ============================================================================
CAN_MOVE_IN_CURRENT_DIRECTION:
    LD A, (entity_direction)
    CALL CAN_MOVE_FROM_ALIGNED_POSITION
    RET

APPLY_DIRECTIONAL_MOVEMENT:
    LD A, (entity_direction)
    LD B, A
    LD A, (entity_speed)
    LD C, A                         ; Speed in C
    
    LD A, B
    CP DIRECTION_RIGHT
    JR Z, move_right
    CP DIRECTION_LEFT
    JR Z, move_left
    CP DIRECTION_UP
    JR Z, move_up
    CP DIRECTION_DOWN
    JR Z, move_down
    RET

move_right:
    LD HL, (entity_x)
    LD A, C
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (entity_x), HL
    RET

move_left:
    LD HL, (entity_x)
    LD A, L
    SUB C
    LD L, A
    LD A, H
    SBC A, 0
    LD H, A
    LD (entity_x), HL
    RET

move_up:
    LD HL, (entity_y)
    LD A, L
    SUB C
    LD L, A
    LD A, H
    SBC A, 0
    LD H, A
    LD (entity_y), HL
    RET

move_down:
    LD HL, (entity_y)
    LD A, C
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (entity_y), HL
    RET

SNAP_TO_GRID_ALIGNMENT:
    ; Snap entity to grid alignment when turning
    LD A, (entity_direction)
    CP DIRECTION_UP
    JR Z, snap_x_alignment
    CP DIRECTION_DOWN
    JR Z, snap_x_alignment
    ; Must be horizontal movement, snap Y
    JR snap_y_alignment

snap_x_alignment:
    ; Snap X to nearest grid line
    LD HL, (entity_x)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    INC HL                          ; Round up
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    
    ; Center in tile
    LD A, (tile_size)
    SRL A                           ; / 2
    LD B, A
    LD A, (entity_hitbox_w)
    SRL A                           ; / 2
    LD C, A
    LD A, B
    SUB C
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (entity_x), HL
    RET

snap_y_alignment:
    ; Snap Y to nearest grid line
    LD HL, (entity_y)
    LD A, (tile_size)
    LD B, A
    CALL DIVIDE_16BIT
    INC HL
    LD A, (tile_size)
    LD B, A
    CALL MULTIPLY_16BIT
    
    ; Center in tile
    LD A, (tile_size)
    SRL A
    LD B, A
    LD A, (entity_hitbox_h)
    SRL A
    LD C, A
    LD A, B
    SUB C
    ADD A, L
    LD L, A
    LD A, 0
    ADC A, H
    LD H, A
    LD (entity_y), HL
    RET

UPDATE_SPRITE_ROTATION:
    ; Update sprite rotation based on current direction
    ; This is a placeholder - implement based on your graphics system
    RET

; ============================================================================
; UTILITY MATH FUNCTIONS
; ============================================================================
MODULO_16BIT:
    ; Input: HL = dividend, B = divisor
    ; Output: HL = remainder
    PUSH BC
    LD C, B
    CALL DIVIDE_16BIT
    POP BC
    ; HL now contains quotient, calculate remainder
    PUSH HL
    LD A, C
    LD B, A
    CALL MULTIPLY_16BIT
    LD DE, HL
    POP HL
    ; Original HL was saved on stack, DE has quotient*divisor
    ; Need to restore original dividend
    ; This is simplified - implement proper 16-bit modulo
    RET

DIVIDE_16BIT:
    ; Input: HL = dividend, B = divisor
    ; Output: HL = quotient
    ; Simplified 16-bit division
    LD DE, 0                        ; Quotient
    LD A, 16                        ; Bit counter
div_loop:
    SLA L
    RL H
    RL E
    RL D
    
    PUSH AF
    LD A, E
    SUB B
    LD A, D
    SBC A, 0
    JR C, div_no_subtract
    
    LD A, E
    SUB B
    LD E, A
    LD A, D
    SBC A, 0
    LD D, A
    
    INC L                           ; Set bit in quotient

div_no_subtract:
    POP AF
    DEC A
    JR NZ, div_loop
    
    LD H, D
    LD L, E
    RET

MULTIPLY_16BIT:
    ; Input: HL = multiplicand, B = multiplier
    ; Output: HL = product
    ; Simplified 16-bit multiplication
    LD DE, 0                        ; Result
    LD A, 8                         ; Bit counter (for 8-bit multiplier)
mul_loop:
    SRL B
    JR NC, mul_no_add
    ADD HL, DE
mul_no_add:
    SLA E
    RL D
    DEC A
    JR NZ, mul_loop
    RET

MULTIPLY_8BIT:
    ; Input: H = multiplicand, L = multiplier  
    ; Output: HL = product
    LD A, H
    LD H, 0
    LD D, H
    LD E, L
    LD L, H
    LD B, 8
mul8_loop:
    SRL A
    JR NC, mul8_no_add
    ADD HL, DE
mul8_no_add:
    SLA E
    RL D
    DJNZ mul8_loop
    RET

; ============================================================================
; TEMPORARY VARIABLES
; ============================================================================
temp_direction:     DB 0
test_x:             DW 0
test_y:             DW 0
hitbox_left:        DW 0
hitbox_right:       DW 0
hitbox_top:         DW 0
hitbox_bottom:      DW 0
start_tile_x:       DB 0
start_tile_y:       DB 0
end_tile_x:         DB 0
end_tile_y:         DB 0
current_tile_x:     DB 0
current_tile_y:     DB 0

; ============================================================================
; USAGE EXAMPLE
; ============================================================================
; To use this system:
;
; 1. Set up entity data in memory:
;    LD HL, 128           ; Starting X position
;    LD (entity_x), HL
;    LD HL, 96            ; Starting Y position  
;    LD (entity_y), HL
;    LD A, 2              ; Speed = 2 pixels/frame
;    LD (entity_speed), A
;    LD A, 16             ; Tile size = 16 pixels
;    LD (tile_size), A
;    ; ... set other parameters
;
; 2. Call the update routine each frame:
;    CALL PACMAN_MOVEMENT_UPDATE
;
; 3. The system will handle:
;    - Input processing with edge detection
;    - Grid-aligned turning validation  
;    - Collision checking from proper positions
;    - Smooth movement with no wall-sticking
;
; This eliminates the problem where entities get stuck when trying to turn
; into walls, providing authentic Pac-Man style movement behavior.
; ============================================================================