; ============================================================================
; Multi-Screen Patrol Behavior
; ============================================================================
; Allows entities to patrol across multiple screens using global coordinates
;
; Required Constants (set by generator):
;   ENTITY_GLOBAL_X_ADDR        - 16-bit global X coordinate (word)
;   ENTITY_GLOBAL_Y_ADDR        - 16-bit global Y coordinate (word)
;   ENTITY_LOCAL_X_ADDR         - 8-bit local X coordinate
;   ENTITY_LOCAL_Y_ADDR         - 8-bit local Y coordinate
;   ENTITY_VX_ADDR              - 8-bit velocity X (signed)
;   ENTITY_VY_ADDR              - 8-bit velocity Y (signed)
;   ENTITY_ORIGIN_SCREEN_OFFSET - Screen offset where entity was created (word)
;   GLOBAL_WAYPOINT1_X          - 16-bit global X of waypoint 1
;   GLOBAL_WAYPOINT1_Y          - 16-bit global Y of waypoint 1
;   GLOBAL_WAYPOINT2_X          - 16-bit global X of waypoint 2
;   GLOBAL_WAYPOINT2_Y          - 16-bit global Y of waypoint 2
;   CURRENT_SCREEN_OFFSET       - 16-bit offset of current visible screen (word)
;
; Screen dimensions
SCREEN_WIDTH_PX     equ 256
SCREEN_HEIGHT_PX    equ 192

; ============================================================================
; entity_multiscreen_init
; Initializes multi-screen patrol entity with global coordinates
; ============================================================================
entity_multiscreen_init:
    ; Initialize global X = origin_screen_offset_x + local_x
    ld hl, (ENTITY_ORIGIN_SCREEN_OFFSET)      ; Get origin screen offset X
    ld de, (ENTITY_LOCAL_X_ADDR)              ; Get initial local X (extend to 16-bit)
    ld d, 0                                    ; DE = local X (byte to word)
    add hl, de                                 ; HL = global X
    ld (ENTITY_GLOBAL_X_ADDR), hl              ; Store global X

    ; Initialize global Y = origin_screen_offset_y + local_y
    ld hl, (ENTITY_ORIGIN_SCREEN_OFFSET + 2)  ; Get origin screen offset Y
    ld de, (ENTITY_LOCAL_Y_ADDR)              ; Get initial local Y
    ld d, 0
    add hl, de
    ld (ENTITY_GLOBAL_Y_ADDR), hl              ; Store global Y

    ret

; ============================================================================
; entity_multiscreen_update
; Updates multi-screen patrol entity position
; ============================================================================
entity_multiscreen_update:
    ; --- 1. Update global position with velocity ---
    ; Global X += VX (signed)
    ld hl, (ENTITY_GLOBAL_X_ADDR)
    ld a, (ENTITY_VX_ADDR)                     ; Load VX (signed byte)
    ld e, a
    ld d, 0
    bit 7, a                                   ; Check if negative
    jr z, .vx_positive
    dec d                                      ; Sign extend: D = $FF
.vx_positive:
    add hl, de                                 ; HL = global_x + vx
    ld (ENTITY_GLOBAL_X_ADDR), hl

    ; Global Y += VY (signed)
    ld hl, (ENTITY_GLOBAL_Y_ADDR)
    ld a, (ENTITY_VY_ADDR)
    ld e, a
    ld d, 0
    bit 7, a
    jr z, .vy_positive
    dec d
.vy_positive:
    add hl, de
    ld (ENTITY_GLOBAL_Y_ADDR), hl

    ; --- 2. Check waypoint bounds and bounce ---
    call check_horizontal_bounds
    call check_vertical_bounds

    ; --- 3. Convert global to local coordinates ---
    call convert_global_to_local

    ret

; ============================================================================
; check_horizontal_bounds
; Checks if entity reached horizontal waypoint bounds and bounces
; Modifies: HL, DE, A, flags
; ============================================================================
check_horizontal_bounds:
    ld hl, (ENTITY_GLOBAL_X_ADDR)
    ld de, (GLOBAL_WAYPOINT1_X)
    ld a, (ENTITY_VX_ADDR)

    ; Check if moving right (VX > 0)
    bit 7, a
    jr nz, .moving_left

.moving_right:
    ; Compare global_x with max(waypoint1_x, waypoint2_x)
    ld de, (GLOBAL_WAYPOINT2_X)
    call compare_hl_de                         ; Returns carry if HL < DE
    jr c, .no_bounce_x                         ; If global_x < waypoint2_x, continue

    ; Reached right bound - reverse direction
    ld a, (ENTITY_VX_ADDR)
    neg                                        ; A = -VX
    ld (ENTITY_VX_ADDR), a
    ret

.moving_left:
    ; Compare global_x with min(waypoint1_x, waypoint2_x)
    ld de, (GLOBAL_WAYPOINT1_X)
    call compare_hl_de
    jr nc, .no_bounce_x                        ; If global_x >= waypoint1_x, continue

    ; Reached left bound - reverse direction
    ld a, (ENTITY_VX_ADDR)
    neg
    ld (ENTITY_VX_ADDR), a
    ret

.no_bounce_x:
    ret

; ============================================================================
; check_vertical_bounds
; Checks if entity reached vertical waypoint bounds and bounces
; ============================================================================
check_vertical_bounds:
    ld hl, (ENTITY_GLOBAL_Y_ADDR)
    ld de, (GLOBAL_WAYPOINT1_Y)
    ld a, (ENTITY_VY_ADDR)

    ; Check if moving down (VY > 0)
    bit 7, a
    jr nz, .moving_up

.moving_down:
    ld de, (GLOBAL_WAYPOINT2_Y)
    call compare_hl_de
    jr c, .no_bounce_y

    ld a, (ENTITY_VY_ADDR)
    neg
    ld (ENTITY_VY_ADDR), a
    ret

.moving_up:
    ld de, (GLOBAL_WAYPOINT1_Y)
    call compare_hl_de
    jr nc, .no_bounce_y

    ld a, (ENTITY_VY_ADDR)
    neg
    ld (ENTITY_VY_ADDR), a
    ret

.no_bounce_y:
    ret

; ============================================================================
; convert_global_to_local
; Converts global coordinates to local screen coordinates
; Input: (ENTITY_GLOBAL_X_ADDR), (ENTITY_GLOBAL_Y_ADDR)
; Output: (ENTITY_LOCAL_X_ADDR), (ENTITY_LOCAL_Y_ADDR)
; ============================================================================
convert_global_to_local:
    ; Local X = Global X - Current Screen Offset X
    ld hl, (ENTITY_GLOBAL_X_ADDR)
    ld de, (CURRENT_SCREEN_OFFSET)             ; Screen's global X offset
    or a                                       ; Clear carry
    sbc hl, de                                 ; HL = global_x - screen_offset_x

    ; Check if entity is within screen bounds (0-255)
    ld a, h                                    ; High byte
    or a
    jr nz, .out_of_bounds_x                    ; If high byte != 0, out of bounds

    ld a, l                                    ; Low byte = local X
    ld (ENTITY_LOCAL_X_ADDR), a
    jr .convert_y

.out_of_bounds_x:
    ; Entity is in another screen - hide it
    ld a, 255                                  ; Off-screen position
    ld (ENTITY_LOCAL_X_ADDR), a
    ld (ENTITY_LOCAL_Y_ADDR), a
    ret

.convert_y:
    ; Local Y = Global Y - Current Screen Offset Y
    ld hl, (ENTITY_GLOBAL_Y_ADDR)
    ld de, (CURRENT_SCREEN_OFFSET + 2)         ; Screen's global Y offset
    or a
    sbc hl, de

    ld a, h
    or a
    jr nz, .out_of_bounds_y

    ld a, l
    ld (ENTITY_LOCAL_Y_ADDR), a
    ret

.out_of_bounds_y:
    ld a, 255
    ld (ENTITY_LOCAL_Y_ADDR), a
    ret

; ============================================================================
; compare_hl_de
; Compares 16-bit values HL and DE
; Returns: Carry flag set if HL < DE, clear if HL >= DE
; Modifies: A, flags
; ============================================================================
compare_hl_de:
    ld a, h
    cp d
    ret nz                                     ; If high bytes differ, return
    ld a, l
    cp e                                       ; Compare low bytes
    ret

; ============================================================================
; Example Usage in Generated Code:
; ============================================================================
; ; Entity 0: Platform with multi-screen patrol
; ENTITY_0_GLOBAL_X_ADDR      equ #C100
; ENTITY_0_GLOBAL_Y_ADDR      equ #C102
; ENTITY_0_LOCAL_X_ADDR       equ #C104
; ENTITY_0_LOCAL_Y_ADDR       equ #C105
; ENTITY_0_VX_ADDR            equ #C106
; ENTITY_0_VY_ADDR            equ #C107
; ENTITY_0_ORIGIN_SCREEN_OFFSET equ #0000  ; Screen 1 at (0, 0)
; GLOBAL_WAYPOINT1_X          equ 50       ; Local waypoint in origin screen
; GLOBAL_WAYPOINT1_Y          equ 100
; GLOBAL_WAYPOINT2_X          equ 600      ; Crosses into screen 3 (256*2 + 88)
; GLOBAL_WAYPOINT2_Y          equ 100
;
; ; In game loop:
; call entity_multiscreen_update
; ============================================================================
