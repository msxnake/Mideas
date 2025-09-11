;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Improved Pac-Man Movement Behavior
;; Implements proper Pac-Man movement mechanics with direction buffering
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; Movement speed
MOVE_SPEED equ 1

; Direction constants
DIRECTION_RIGHT equ 0
DIRECTION_UP equ 1
DIRECTION_LEFT equ 2
DIRECTION_DOWN equ 3
DIRECTION_NONE equ 255

; Memory locations (to be defined by game engine)
ENTITY_X_ADDR equ #C000          ; Entity's current X position
ENTITY_Y_ADDR equ #C001          ; Entity's current Y position
ENTITY_FACING_DIRECTION_ADDR equ #C002  ; Current movement direction
ENTITY_DESIRED_DIRECTION_ADDR equ #C003 ; Buffered input direction
KEYBOARD_STATE equ #C004         ; Current keyboard state

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Main Update Function - Called every frame
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
entity_update:
    ; Step 1: Read and buffer player input
    call READ_INPUT
    
    ; Step 2: Check if desired direction change is possible
    call CHECK_DIRECTION_CHANGE
    
    ; Step 3: Move in current direction (or stop if blocked)
    call EXECUTE_MOVEMENT
    
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Read player input and store desired direction
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
READ_INPUT:
    ld a, (KEYBOARD_STATE)
    
    ; Check UP key (highest priority - most recent input)
    bit 0, a
    jr nz, .input_up
    
    ; Check DOWN key
    bit 1, a
    jr nz, .input_down
    
    ; Check LEFT key
    bit 2, a
    jr nz, .input_left
    
    ; Check RIGHT key
    bit 3, a
    jr nz, .input_right
    
    ; No input - keep current desired direction
    ret

.input_up:
    ld hl, ENTITY_DESIRED_DIRECTION_ADDR
    ld (hl), DIRECTION_UP
    ret

.input_down:
    ld hl, ENTITY_DESIRED_DIRECTION_ADDR
    ld (hl), DIRECTION_DOWN
    ret

.input_left:
    ld hl, ENTITY_DESIRED_DIRECTION_ADDR
    ld (hl), DIRECTION_LEFT
    ret

.input_right:
    ld hl, ENTITY_DESIRED_DIRECTION_ADDR
    ld (hl), DIRECTION_RIGHT
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Check if we can change to the desired direction
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
CHECK_DIRECTION_CHANGE:
    ; Get current and desired directions
    ld a, (ENTITY_FACING_DIRECTION_ADDR)
    ld b, a                          ; B = current direction
    ld a, (ENTITY_DESIRED_DIRECTION_ADDR)
    ld c, a                          ; C = desired direction
    
    ; If desired == current, no change needed
    cp b
    ret z
    
    ; If no desired direction, keep current
    cp DIRECTION_NONE
    ret z
    
    ; Check if desired direction is clear
    call CHECK_DIRECTION_CLEAR
    ret nz                           ; If blocked, keep current direction
    
    ; Direction is clear - change to desired direction
    ld a, c
    ld (ENTITY_FACING_DIRECTION_ADDR), a
    
    ; Clear desired direction buffer
    ld a, DIRECTION_NONE
    ld (ENTITY_DESIRED_DIRECTION_ADDR), a
    
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Check if a direction is clear for movement
;; Input: C = direction to check
;; Output: Z flag set if clear, NZ if blocked
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
CHECK_DIRECTION_CLEAR:
    ; Get current position
    ld a, (ENTITY_X_ADDR)
    ld h, a                          ; H = current X
    ld a, (ENTITY_Y_ADDR)
    ld l, a                          ; L = current Y
    
    ; Calculate next position based on direction
    ld a, c                          ; A = direction to check
    cp DIRECTION_RIGHT
    jr z, .check_right
    cp DIRECTION_LEFT
    jr z, .check_left
    cp DIRECTION_UP
    jr z, .check_up
    cp DIRECTION_DOWN
    jr z, .check_down
    
    ; Invalid direction - consider blocked
    or 1                             ; Set NZ flag
    ret

.check_right:
    ld a, h
    add a, MOVE_SPEED
    ld h, a                          ; H = new X position
    jr .do_collision_check

.check_left:
    ld a, h
    sub MOVE_SPEED
    ld h, a                          ; H = new X position
    jr .do_collision_check

.check_up:
    ld a, l
    sub MOVE_SPEED
    ld l, a                          ; L = new Y position
    jr .do_collision_check

.check_down:
    ld a, l
    add a, MOVE_SPEED
    ld l, a                          ; L = new Y position
    jr .do_collision_check

.do_collision_check:
    ; Check collision at position (H, L)
    ; This should call your game's collision detection system
    ; For now, assume a simple implementation:
    call CHECK_COLLISION_AT_POSITION ; H=X, L=Y
    ; Returns Z if clear, NZ if blocked
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Execute movement in current direction
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
EXECUTE_MOVEMENT:
    ld a, (ENTITY_FACING_DIRECTION_ADDR)
    
    cp DIRECTION_RIGHT
    jr z, .move_right
    cp DIRECTION_LEFT
    jr z, .move_left
    cp DIRECTION_UP
    jr z, .move_up
    cp DIRECTION_DOWN
    jr z, .move_down
    
    ; No valid direction - don't move
    ret

.move_right:
    ; Check if right movement is clear
    ld c, DIRECTION_RIGHT
    call CHECK_DIRECTION_CLEAR
    ret nz                           ; Blocked - stop moving
    
    ; Move right
    ld hl, ENTITY_X_ADDR
    ld a, (hl)
    add a, MOVE_SPEED
    ld (hl), a
    ret

.move_left:
    ; Check if left movement is clear
    ld c, DIRECTION_LEFT
    call CHECK_DIRECTION_CLEAR
    ret nz                           ; Blocked - stop moving
    
    ; Move left
    ld hl, ENTITY_X_ADDR
    ld a, (hl)
    sub MOVE_SPEED
    ld (hl), a
    ret

.move_up:
    ; Check if up movement is clear
    ld c, DIRECTION_UP
    call CHECK_DIRECTION_CLEAR
    ret nz                           ; Blocked - stop moving
    
    ; Move up
    ld hl, ENTITY_Y_ADDR
    ld a, (hl)
    sub MOVE_SPEED
    ld (hl), a
    ret

.move_down:
    ; Check if down movement is clear
    ld c, DIRECTION_DOWN
    call CHECK_DIRECTION_CLEAR
    ret nz                           ; Blocked - stop moving
    
    ; Move down
    ld hl, ENTITY_Y_ADDR
    ld a, (hl)
    add a, MOVE_SPEED
    ld (hl), a
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Collision Detection Stub
;; Replace this with your actual collision system
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
CHECK_COLLISION_AT_POSITION:
    ; Input: H = X position, L = Y position
    ; Output: Z flag = clear, NZ flag = blocked
    ; 
    ; This is a placeholder - replace with your collision detection
    ; For example:
    ; - Check tilemap for solid tiles
    ; - Check screen boundaries
    ; - Check collision with other entities
    
    ; Example boundary check:
    ld a, h
    cp 0                             ; Left boundary
    ret z                            ; Z = blocked
    cp 248                           ; Right boundary (assuming 256-8)
    ret nc                           ; NZ = blocked
    
    ld a, l
    cp 0                             ; Top boundary
    ret z                            ; Z = blocked  
    cp 184                           ; Bottom boundary (assuming 192-8)
    ret nc                           ; NZ = blocked
    
    ; If we get here, position is clear
    xor a                            ; Set Z flag (clear)
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Initialization Function
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
entity_init:
    ; Initialize facing direction to right
    ld hl, ENTITY_FACING_DIRECTION_ADDR
    ld (hl), DIRECTION_RIGHT
    
    ; Clear desired direction buffer
    ld hl, ENTITY_DESIRED_DIRECTION_ADDR
    ld (hl), DIRECTION_NONE
    
    ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Usage Notes:
;;
;; This improved Pac-Man behavior implements:
;;
;; 1. DIRECTION BUFFERING: When player presses a direction key,
;;    the desired direction is stored but the character continues
;;    moving in the current direction until the new direction
;;    becomes available.
;;
;; 2. SMOOTH DIRECTION CHANGES: The character only changes
;;    direction when there's a clear path, preventing the
;;    "stop and start" behavior of the original implementation.
;;
;; 3. CONTINUOUS MOVEMENT: The character keeps moving in the
;;    current direction until blocked, rather than stopping
;;    when a new (blocked) direction is requested.
;;
;; To use this behavior:
;; 1. Define the memory addresses at the top of the file
;; 2. Implement CHECK_COLLISION_AT_POSITION for your collision system
;; 3. Set up keyboard input to update KEYBOARD_STATE
;; 4. Call entity_init once when spawning the entity
;; 5. Call entity_update every frame
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;