;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; COMPONENTES.ASM - Sistema ECS Completo para MSX
;; Motores de componentes, constantes y variables detalladas
;; Basado en sistema Mideas MSX Generator
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; CONSTANTES DE COMPONENTES
; ==================================================================

; Tipos de componentes (IDs)
COMP_POSITION   EQU 0    ; Componente de posición
COMP_SPRITE     EQU 1    ; Componente de sprite visual
COMP_MOVEMENT   EQU 2    ; Componente de movimiento/velocidad
COMP_COLLISION  EQU 3    ; Componente de colisión
COMP_INPUT      EQU 4    ; Componente de entrada/input
COMP_BEHAVIOR   EQU 5    ; Componente de comportamiento/IA
COMP_HEALTH     EQU 6    ; Componente de salud/vida
COMP_ANIMATION  EQU 7    ; Componente de animación

; Máscaras de bits para filtrado de entidades
COMP_MASK_POSITION   EQU #01  ; Binary: 00000001
COMP_MASK_SPRITE     EQU #02  ; Binary: 00000010
COMP_MASK_MOVEMENT   EQU #04  ; Binary: 00000100
COMP_MASK_COLLISION  EQU #08  ; Binary: 00001000
COMP_MASK_INPUT      EQU #10  ; Binary: 00010000
COMP_MASK_BEHAVIOR   EQU #20  ; Binary: 00100000
COMP_MASK_HEALTH     EQU #40  ; Binary: 01000000
COMP_MASK_ANIMATION  EQU #80  ; Binary: 10000000

; Límites del sistema
MAX_ENTITIES    EQU 32   ; Máximo 32 entidades simultáneas
MAX_COMPONENTS  EQU 8    ; 8 tipos diferentes de componentes

; ==================================================================
; VARIABLES DE ENTIDADES Y COMPONENTES
; ==================================================================

; Máscara de componentes por entidad (1 byte por entidad)
entity_comp_masks:   DS MAX_ENTITIES

; ==================================================================
; COMPONENTE POSITION - Datos de posición (2 bytes por entidad)
; Offset 0: X position (0-255, pantalla 256 pixels)
; Offset 1: Y position (0-191, pantalla 192 pixels)
; ==================================================================
entity_x_pos:        DS MAX_ENTITIES      ; Posición X (8-bit, 0-255)
entity_y_pos:        DS MAX_ENTITIES      ; Posición Y (8-bit, 0-191)

; ==================================================================
; COMPONENTE SPRITE - Datos de sprite (4 bytes por entidad)
; Offset 0: Pattern number (sprite pattern ID)
; Offset 1: Color (sprite color)
; Offset 2: Flags (flip, visible, etc.)
; Offset 3: Reserved
; ==================================================================
sprite_pattern:      DS MAX_ENTITIES      ; Patrón de sprite
sprite_color:        DS MAX_ENTITIES      ; Color del sprite
sprite_flags:        DS MAX_ENTITIES      ; Flags (visible, flip, etc.)
sprite_reserved:     DS MAX_ENTITIES      ; Reservado para expansión

; Flags del sprite
SPRITE_VISIBLE       EQU #01
SPRITE_FLIP_H        EQU #02
SPRITE_FLIP_V        EQU #04

; ==================================================================
; COMPONENTE MOVEMENT - Datos de movimiento (4 bytes por entidad)
; Offset 0: Velocity X (8-bit signed, -128 to +127 pixels/frame)
; Offset 1: Velocity Y (8-bit signed, -128 to +127 pixels/frame)
; Offset 2: Acceleration X (8-bit signed)
; Offset 3: Acceleration Y (8-bit signed)
; ==================================================================
entity_vel_x:        DS MAX_ENTITIES      ; Velocidad X (8-bit signed)
entity_vel_y:        DS MAX_ENTITIES      ; Velocidad Y (8-bit signed)
entity_accel_x:      DS MAX_ENTITIES      ; Aceleración X (8-bit signed)
entity_accel_y:      DS MAX_ENTITIES      ; Aceleración Y (8-bit signed)

; ==================================================================
; COMPONENTE COLLISION - Datos de colisión (8 bytes por entidad)
; Offset 0: Bounding box left offset
; Offset 1: Bounding box top offset
; Offset 2: Bounding box width
; Offset 3: Bounding box height
; Offset 4: Collision layer (what layer this entity is on)
; Offset 5: Collision mask (what layers this entity collides with)
; Offset 6: Collision flags
; Offset 7: Reserved
; ==================================================================
collision_left:      DS MAX_ENTITIES      ; Offset izquierdo del bounding box
collision_top:       DS MAX_ENTITIES      ; Offset superior del bounding box
collision_width:     DS MAX_ENTITIES      ; Ancho del bounding box
collision_height:    DS MAX_ENTITIES      ; Alto del bounding box
collision_layer:     DS MAX_ENTITIES      ; Capa de colisión
collision_mask:      DS MAX_ENTITIES      ; Máscara de colisión
collision_flags:     DS MAX_ENTITIES      ; Flags de colisión
collision_reserved:  DS MAX_ENTITIES      ; Reservado

; Capas de colisión
COLLISION_LAYER_PLAYER    EQU #01
COLLISION_LAYER_ENEMY     EQU #02
COLLISION_LAYER_WALLS     EQU #04
COLLISION_LAYER_ITEMS     EQU #08
COLLISION_LAYER_PROJECTILE EQU #10

; ==================================================================
; COMPONENTE INPUT - Datos de entrada (4 bytes por entidad)
; Offset 0: Current input state
; Offset 1: Previous input state
; Offset 2: Input type (joystick, AI, etc.)
; Offset 3: Reserved
; ==================================================================
input_current:       DS MAX_ENTITIES      ; Estado actual del input
input_previous:      DS MAX_ENTITIES      ; Estado anterior del input
input_type:          DS MAX_ENTITIES      ; Tipo de input
input_reserved:      DS MAX_ENTITIES      ; Reservado

; Tipos de input
INPUT_TYPE_PLAYER1   EQU 0
INPUT_TYPE_PLAYER2   EQU 1
INPUT_TYPE_KEYBOARD  EQU 2  ; Control por cursores + espacio + control
INPUT_TYPE_AI        EQU 3
INPUT_TYPE_NONE      EQU 255

; Estados de input (bits)
INPUT_BIT_UP         EQU 0
INPUT_BIT_DOWN       EQU 1
INPUT_BIT_LEFT       EQU 2
INPUT_BIT_RIGHT      EQU 3
INPUT_BIT_FIRE1      EQU 4  ; Espacio o trigger A
INPUT_BIT_FIRE2      EQU 5  ; Control o trigger B
INPUT_BIT_PAUSE      EQU 6
INPUT_BIT_SELECT     EQU 7

; ==================================================================
; COMPONENTE BEHAVIOR - Datos de comportamiento/IA (8 bytes por entidad)
; Offset 0: Behavior type (patrol, follow, static, etc.)
; Offset 1: Behavior state (current state machine state)
; Offset 2: Behavior timer (8-bit countdown)
; Offset 4: Target entity ID (for following behaviors)
; Offset 5-7: Behavior data (custom parameters)
; ==================================================================
behavior_type:       DS MAX_ENTITIES      ; Tipo de comportamiento
behavior_state:      DS MAX_ENTITIES      ; Estado actual del comportamiento
behavior_timer:      DS MAX_ENTITIES      ; Timer de comportamiento (8-bit)
behavior_target:     DS MAX_ENTITIES      ; Entidad objetivo (8-bit)
behavior_data:       DS MAX_ENTITIES * 4  ; Datos personalizados (4 bytes)

; Tipos de comportamiento
BEHAVIOR_STATIC      EQU 0   ; No se mueve
BEHAVIOR_PATROL      EQU 1   ; Patrulla de un lado a otro
BEHAVIOR_FOLLOW      EQU 2   ; Sigue a otra entidad
BEHAVIOR_FLEE        EQU 3   ; Huye de otra entidad
BEHAVIOR_CIRCLE      EQU 4   ; Movimiento circular
BEHAVIOR_RANDOM      EQU 5   ; Movimiento aleatorio

; ==================================================================
; COMPONENTE HEALTH - Datos de salud (4 bytes por entidad)
; Offset 0: Current health
; Offset 1: Maximum health
; Offset 2: Invincibility timer
; Offset 3: Health flags
; ==================================================================
entity_health:       DS MAX_ENTITIES      ; Salud actual
entity_max_health:   DS MAX_ENTITIES      ; Salud máxima
entity_invuln_timer: DS MAX_ENTITIES      ; Timer de invulnerabilidad
entity_health_flags: DS MAX_ENTITIES      ; Flags de salud

; Health flags
HEALTH_FLAG_INVULNERABLE EQU #01
HEALTH_FLAG_REGENERATE   EQU #02
HEALTH_FLAG_IMMORTAL     EQU #04

; ==================================================================
; COMPONENTE ANIMATION - Datos de animación (8 bytes por entidad)
; Offset 0: Animation sequence ID
; Offset 1: Current frame
; Offset 2: Frame timer
; Offset 3: Animation speed
; Offset 4: Animation flags
; Offset 5: Loop count
; Offset 6-7: Reserved
; ==================================================================
anim_sequence:       DS MAX_ENTITIES      ; Secuencia de animación
anim_frame:          DS MAX_ENTITIES      ; Frame actual
anim_timer:          DS MAX_ENTITIES      ; Timer de frame
anim_speed:          DS MAX_ENTITIES      ; Velocidad de animación
anim_flags:          DS MAX_ENTITIES      ; Flags de animación
anim_loop_count:     DS MAX_ENTITIES      ; Contador de loops
anim_reserved:       DS MAX_ENTITIES * 2  ; Reservado

; Animation flags
ANIM_FLAG_PLAYING    EQU #01
ANIM_FLAG_LOOP       EQU #02
ANIM_FLAG_REVERSE    EQU #04
ANIM_FLAG_PINGPONG   EQU #08

; ==================================================================
; SISTEMA DE ENTIDADES - Funciones de gestión
; ==================================================================

; Crear nueva entidad
; Input: B = component mask
; Output: A = entity ID (0 if failed)
create_entity:
    push hl
    push bc
    push de

    ; Buscar slot libre en entity_comp_masks
    ld hl, entity_comp_masks
    ld d, 0                    ; Entity ID counter

create_entity_loop:
    ld a, (hl)                 ; Get component mask
    or a                       ; Check if zero (free slot)
    jr z, create_entity_found  ; Found free slot

    inc hl                     ; Next entity
    inc d                      ; Increment ID
    ld a, d
    cp MAX_ENTITIES
    jr c, create_entity_loop   ; Continue if not at limit

    ; No free slots
    xor a                      ; Return 0 (failed)
    jr create_entity_exit

create_entity_found:
    ; Set component mask
    ld (hl), b                 ; Set component mask

    ; Initialize component data based on mask
    ld a, d                    ; Entity ID in A
    bit 0, b                   ; Check COMP_MASK_POSITION
    call nz, init_entity_position

    bit 1, b                   ; Check COMP_MASK_SPRITE
    call nz, init_entity_sprite

    bit 2, b                   ; Check COMP_MASK_MOVEMENT
    call nz, init_entity_movement

    bit 3, b                   ; Check COMP_MASK_COLLISION
    call nz, init_entity_collision

    bit 4, b                   ; Check COMP_MASK_INPUT
    call nz, init_entity_input

    bit 5, b                   ; Check COMP_MASK_BEHAVIOR
    call nz, init_entity_behavior

    bit 6, b                   ; Check COMP_MASK_HEALTH
    call nz, init_entity_health

    bit 7, b                   ; Check COMP_MASK_ANIMATION
    call nz, init_entity_animation

    ld a, d                    ; Return entity ID

create_entity_exit:
    pop de
    pop bc
    pop hl
    ret

; Destruir entidad
; Input: A = entity ID
destroy_entity:
    cp MAX_ENTITIES
    ret nc                     ; Invalid entity ID

    push hl
    push de

    ; Clear component mask
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Clear mask (mark as free)

    ; TODO: Clear component data if needed

    pop de
    pop hl
    ret

; ==================================================================
; INICIALIZADORES DE COMPONENTES
; ==================================================================

; Inicializar componente POSITION para entidad A
init_entity_position:
    push hl
    push de

    ; Initialize X position to 0
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; X position (8-bit)

    ; Initialize Y position to 0
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 0                 ; Y position (8-bit)

    pop de
    pop hl
    ret

; Inicializar componente SPRITE para entidad A
init_entity_sprite:
    push hl
    push de

    ld hl, sprite_pattern
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Pattern 0

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ld hl, sprite_flags
    add hl, de
    ld (hl), SPRITE_VISIBLE    ; Visible by default

    pop de
    pop hl
    ret

; Inicializar componente MOVEMENT para entidad A
init_entity_movement:
    push hl
    push de

    ; Clear velocity X
    ld hl, entity_vel_x
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Vel X (8-bit)

    ; Clear velocity Y
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0                 ; Vel Y (8-bit)

    ; Clear acceleration X
    ld hl, entity_accel_x
    add hl, de
    ld (hl), 0                 ; Accel X (8-bit)

    ; Clear acceleration Y
    ld hl, entity_accel_y
    add hl, de
    ld (hl), 0                 ; Accel Y (8-bit)

    pop de
    pop hl
    ret

; Inicializar componente COLLISION para entidad A
init_entity_collision:
    push hl
    push de

    ld hl, collision_left
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Left offset

    ld hl, collision_top
    add hl, de
    ld (hl), 0                 ; Top offset

    ld hl, collision_width
    add hl, de
    ld (hl), 16                ; Default 16x16 bounding box

    ld hl, collision_height
    add hl, de
    ld (hl), 16

    ld hl, collision_layer
    add hl, de
    ld (hl), COLLISION_LAYER_ENEMY ; Default layer

    ld hl, collision_mask
    add hl, de
    ld (hl), COLLISION_LAYER_PLAYER ; Collides with player

    pop de
    pop hl
    ret

; Inicializar componente INPUT para entidad A
init_entity_input:
    push hl
    push de

    ld hl, input_current
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; No input

    ld hl, input_previous
    add hl, de
    ld (hl), 0                 ; No previous input

    ld hl, input_type
    add hl, de
    ld (hl), INPUT_TYPE_KEYBOARD ; Default to keyboard control

    pop de
    pop hl
    ret

; Inicializar componente BEHAVIOR para entidad A
init_entity_behavior:
    push hl
    push de

    ld hl, behavior_type
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), BEHAVIOR_STATIC   ; Default static behavior

    ld hl, behavior_state
    add hl, de
    ld (hl), 0                 ; State 0

    ; Clear timer
    ld hl, behavior_timer
    add hl, de
    ld (hl), 0                 ; Timer (8-bit)

    pop de
    pop hl
    ret

; Inicializar componente HEALTH para entidad A
init_entity_health:
    push hl
    push de

    ld hl, entity_health
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 3                 ; Default 3 health

    ld hl, entity_max_health
    add hl, de
    ld (hl), 3                 ; Max 3 health

    ld hl, entity_invuln_timer
    add hl, de
    ld (hl), 0                 ; No invulnerability

    ld hl, entity_health_flags
    add hl, de
    ld (hl), 0                 ; No special flags

    pop de
    pop hl
    ret

; Inicializar componente ANIMATION para entidad A
init_entity_animation:
    push hl
    push de

    ld hl, anim_sequence
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Sequence 0

    ld hl, anim_frame
    add hl, de
    ld (hl), 0                 ; Frame 0

    ld hl, anim_timer
    add hl, de
    ld (hl), 0                 ; Timer 0

    ld hl, anim_speed
    add hl, de
    ld (hl), 4                 ; 4 frames delay

    ld hl, anim_flags
    add hl, de
    ld (hl), ANIM_FLAG_PLAYING ; Playing by default

    pop de
    pop hl
    ret

; ==================================================================
; MOTORES DE COMPONENTES - Sistemas de actualización
; ==================================================================

; Motor del componente POSITION - Aplica velocidad a posición
update_position_component:
    push hl
    push bc
    push de

    ld hl, entity_comp_masks
    ld b, MAX_ENTITIES
    ld c, 0                    ; Entity counter

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Check if also has movement component
    ld a, (hl)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

    ; Apply velocity to position
    ld a, c                    ; Entity ID
    call apply_velocity_to_position

position_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity ID
    djnz position_update_loop

    pop de
    pop bc
    pop hl
    ret

; Aplicar velocidad a posición de entidad A
apply_velocity_to_position:
    push hl
    push de
    push bc

    ; Get current position X
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = current X position

    ; Get velocity X
    ld hl, entity_vel_x
    add hl, de
    ld c, (hl)                 ; C = velocity X (signed)

    ; Add velocity to position: B = B + C (8-bit arithmetic)
    ld a, b
    add a, c                   ; A = new X position

    ; Check bounds (0-255 for X)
    cp 0
    jr nc, x_not_negative
    ld a, 0                    ; Clamp to 0
x_not_negative:
    ; X can go to 255, no upper bound check needed for MSX

    ; Store new position X
    push af                    ; Save new X position
    ld hl, entity_x_pos
    ld e, a                    ; Entity ID (original A)
    ld d, 0
    add hl, de
    pop af                     ; Restore new X position
    ld (hl), a                 ; Store new X position

    ; Get current position Y
    ld hl, entity_y_pos
    add hl, de
    ld b, (hl)                 ; B = current Y position

    ; Get velocity Y
    ld hl, entity_vel_y
    add hl, de
    ld c, (hl)                 ; C = velocity Y (signed)

    ; Add velocity to position: B = B + C (8-bit arithmetic)
    ld a, b
    add a, c                   ; A = new Y position

    ; Check bounds (0-191 for Y)
    cp 0
    jr nc, y_not_negative
    ld a, 0                    ; Clamp to 0
y_not_negative:
    cp 192
    jr c, y_in_bounds
    ld a, 191                  ; Clamp to 191 (screen height)
y_in_bounds:

    ; Store new position Y
    ld hl, entity_y_pos
    add hl, de
    ld (hl), a                 ; Store new Y position

    pop bc
    pop de
    pop hl
    ret

; Motor del componente SPRITE - Actualiza sprites en VRAM
update_sprite_component:
    push hl
    push bc
    push de

    ld hl, entity_comp_masks
    ld b, MAX_ENTITIES
    ld c, 0                    ; Entity counter

sprite_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_SPRITE       ; Check if has sprite component
    jr z, sprite_next_entity   ; Skip if no sprite component

    ; Check if also has position component
    ld a, (hl)
    and COMP_MASK_POSITION
    jr z, sprite_next_entity   ; Skip if no position

    ; Update sprite at position
    ld a, c                    ; Entity ID
    call update_entity_sprite_position

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity ID
    djnz sprite_update_loop

    pop de
    pop bc
    pop hl
    ret

; Actualizar posición del sprite de entidad A
update_entity_sprite_position:
    push hl
    push de
    push bc

    ; TODO: Get entity position and update sprite in VRAM
    ; This would involve writing to sprite attribute table

    pop bc
    pop de
    pop hl
    ret

; Motor del componente INPUT - Actualiza input de entidades
update_input_component:
    push hl
    push bc
    push de

    ; Read different input sources
    call read_joystick_state   ; Returns joystick state in A
    ld d, a                    ; Store joystick state
    call read_keyboard_state   ; Returns keyboard state in A
    ld e, a                    ; Store keyboard state

    ld hl, entity_comp_masks
    ld b, MAX_ENTITIES
    ld c, 0                    ; Entity counter

input_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_INPUT        ; Check if has input component
    jr z, input_next_entity    ; Skip if no input component

    ; Store current input as previous
    push hl
    ld hl, input_current
    ld a, c
    push de
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)                 ; Get current input

    ; Store as previous
    ld hl, input_previous
    add hl, de
    ld (hl), a                 ; Store as previous
    pop de
    pop hl

    ; Check input type for this entity
    push hl
    ld hl, input_type
    ld a, c
    push de
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)                 ; Get input type
    pop de
    pop hl

    cp INPUT_TYPE_PLAYER1
    jr z, input_apply_joystick
    cp INPUT_TYPE_PLAYER2
    jr z, input_apply_joystick
    cp INPUT_TYPE_KEYBOARD
    jr z, input_apply_keyboard

    ; For AI and other types, skip input update
    jr input_next_entity

input_apply_joystick:
    ; Apply joystick state to this entity
    push hl
    ld hl, input_current
    ld a, c
    push de
    ld e, a
    ld d, 0
    add hl, de
    pop de
    ld (hl), d                 ; Store joystick state
    pop hl
    jr input_next_entity

input_apply_keyboard:
    ; Apply keyboard state to this entity
    push hl
    ld hl, input_current
    ld a, c
    push de
    ld e, a
    ld d, 0
    add hl, de
    pop de
    ld (hl), e                 ; Store keyboard state
    pop hl

input_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity ID
    djnz input_update_loop

    pop de
    pop bc
    pop hl
    ret

; Leer estado del joystick
; Output: A = joystick state
read_joystick_state:
    push bc
    push de

    ; Read MSX joystick port 1
    ld a, 0                    ; Port 1
    call GTSTCK                ; BIOS call - returns direction in A
    ld b, a                    ; Store stick direction

    ; Convert GTSTCK directions to our bit format
    xor a                      ; Clear result
    ld c, a                    ; C will hold our input state

    ; Check directions (GTSTCK returns 1-8 for directions, 0 for center)
    ld a, b
    cp 1                       ; UP
    jr nz, check_upright
    ld a, c
    set INPUT_BIT_UP, a
    ld c, a
    jr read_triggers

check_upright:
    ld a, b
    cp 2                       ; UP-RIGHT
    jr nz, check_right
    ld a, c
    set INPUT_BIT_UP, a
    set INPUT_BIT_RIGHT, a
    ld c, a
    jr read_triggers

check_right:
    ld a, b
    cp 3                       ; RIGHT
    jr nz, check_downright
    ld a, c
    set INPUT_BIT_RIGHT, a
    ld c, a
    jr read_triggers

check_downright:
    ld a, b
    cp 4                       ; DOWN-RIGHT
    jr nz, check_down
    ld a, c
    set INPUT_BIT_DOWN, a
    set INPUT_BIT_RIGHT, a
    ld c, a
    jr read_triggers

check_down:
    ld a, b
    cp 5                       ; DOWN
    jr nz, check_downleft
    ld a, c
    set INPUT_BIT_DOWN, a
    ld c, a
    jr read_triggers

check_downleft:
    ld a, b
    cp 6                       ; DOWN-LEFT
    jr nz, check_left
    ld a, c
    set INPUT_BIT_DOWN, a
    set INPUT_BIT_LEFT, a
    ld c, a
    jr read_triggers

check_left:
    ld a, b
    cp 7                       ; LEFT
    jr nz, check_upleft
    ld a, c
    set INPUT_BIT_LEFT, a
    ld c, a
    jr read_triggers

check_upleft:
    ld a, b
    cp 8                       ; UP-LEFT
    jr nz, read_triggers
    ld a, c
    set INPUT_BIT_UP, a
    set INPUT_BIT_LEFT, a
    ld c, a

read_triggers:
    ; Read trigger buttons
    ld a, 0                    ; Port 1
    call GTTRIG                ; Get trigger state (returns #FF if pressed, 0 if not)
    or a
    jr z, no_trigger_a
    ld a, c
    set INPUT_BIT_FIRE1, a     ; Set FIRE1 for trigger A
    ld c, a

no_trigger_a:
    ; For MSX2+, there might be a second trigger
    ; For now, we'll skip FIRE2 from joystick

    ld a, c                    ; Return final input state
    pop de
    pop bc
    ret

; Leer estado del teclado (cursores + espacio + control)
; Output: A = keyboard state
read_keyboard_state:
    push bc
    push de
    push hl

    xor a                      ; Clear result
    ld c, a                    ; C will hold our input state

    ; Read cursor keys - Row 8 of keyboard matrix
    ld a, 8                    ; Keyboard row 8
    call SNSMAT                ; BIOS call to read keyboard matrix
    ld b, a                    ; Store row 8 state

    ; Check cursor keys (row 8)
    ; Bit 4 = RIGHT cursor
    bit 4, b
    jr nz, check_left_cursor
    ld a, c
    set INPUT_BIT_RIGHT, a
    ld c, a

check_left_cursor:
    ; Bit 5 = LEFT cursor
    bit 5, b
    jr nz, check_down_cursor
    ld a, c
    set INPUT_BIT_LEFT, a
    ld c, a

check_down_cursor:
    ; Bit 6 = DOWN cursor
    bit 6, b
    jr nz, check_up_cursor
    ld a, c
    set INPUT_BIT_DOWN, a
    ld c, a

check_up_cursor:
    ; Bit 7 = UP cursor
    bit 7, b
    jr nz, check_space
    ld a, c
    set INPUT_BIT_UP, a
    ld c, a

check_space:
    ; Read space key - Row 8, bit 0
    bit 0, b
    jr nz, check_control
    ld a, c
    set INPUT_BIT_FIRE1, a     ; Space = FIRE1
    ld c, a

check_control:
    ; Read CTRL key - Row 6, bit 2
    ld a, 6                    ; Keyboard row 6
    call SNSMAT                ; Read row 6
    bit 2, a                   ; CTRL key
    jr nz, keyboard_done
    ld a, c
    set INPUT_BIT_FIRE2, a     ; CTRL = FIRE2
    ld c, a

keyboard_done:
    ld a, c                    ; Return final input state
    pop hl
    pop de
    pop bc
    ret

; Motor del componente COLLISION - Detecta colisiones
update_collision_component:
    push hl
    push bc
    push de

    ld hl, entity_comp_masks
    ld b, MAX_ENTITIES
    ld c, 0                    ; Entity counter

collision_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_COLLISION    ; Check if has collision component
    jr z, collision_next_entity ; Skip if no collision component

    ; Check collision against all other entities
    ld a, c                    ; Entity ID
    call check_entity_collisions

collision_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity ID
    djnz collision_update_loop

    pop de
    pop bc
    pop hl
    ret

; Verificar colisiones de entidad A con todas las demás
check_entity_collisions:
    push hl
    push bc
    push de

    ; TODO: Implement collision detection between entities
    ; This would check bounding boxes and collision layers/masks

    pop de
    pop bc
    pop hl
    ret

; Motor del componente BEHAVIOR - Ejecuta IA de entidades
update_behavior_component:
    push hl
    push bc
    push de

    ld hl, entity_comp_masks
    ld b, MAX_ENTITIES
    ld c, 0                    ; Entity counter

behavior_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_BEHAVIOR     ; Check if has behavior component
    jr z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior for this entity
    ld a, c                    ; Entity ID
    call execute_entity_behavior

behavior_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity ID
    djnz behavior_update_loop

    pop de
    pop bc
    pop hl
    ret

; Ejecutar comportamiento de entidad A
execute_entity_behavior:
    push hl
    push de

    ; Get behavior type
    ld hl, behavior_type
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)                 ; E = behavior type

    ; Branch to appropriate behavior handler
    ld a, e
    cp BEHAVIOR_STATIC
    jr z, behavior_static
    cp BEHAVIOR_PATROL
    jr z, behavior_patrol
    ; TODO: Add other behavior types
    jr behavior_done

behavior_static:
    ; Do nothing - entity doesn't move
    jr behavior_done

behavior_patrol:
    ; TODO: Implement patrol behavior
    ; Move left and right, change direction at boundaries
    jr behavior_done

behavior_done:
    pop de
    pop hl
    ret

; ==================================================================
; UTILIDADES DE INPUT - Funciones auxiliares para manejo de input
; ==================================================================

; Verificar si input está recién presionado (edge detection)
; Input: A = entity ID, B = input bit
; Output: Zero flag set if button was just pressed this frame
input_just_pressed:
    push hl
    push de
    push bc

    ; Get current input state
    ld hl, input_current
    ld e, a
    ld d, 0
    add hl, de
    ld c, (hl)                 ; C = current state

    ; Get previous input state
    ld hl, input_previous
    add hl, de
    ld e, (hl)                 ; E = previous state

    ; Check if bit is set in current but not in previous
    ld a, 1
    ld d, b                    ; Bit position
check_bit_position:
    ld a, d
    or a
    jr z, bit_ready
    sla a                      ; Shift left
    dec d
    jr check_bit_position

bit_ready:
    ld d, a                    ; D = bit mask

    ; Check current state
    ld a, c
    and d                      ; A = current & mask
    jr z, not_pressed_now      ; Not pressed now = not just pressed

    ; Check previous state
    ld a, e
    and d                      ; A = previous & mask
    jr nz, was_pressed_before  ; Was pressed before = not just pressed

    ; Button was just pressed
    xor a                      ; Set zero flag
    jr input_just_pressed_exit

not_pressed_now:
was_pressed_before:
    ; Button was not just pressed
    or 1                       ; Clear zero flag

input_just_pressed_exit:
    pop bc
    pop de
    pop hl
    ret

; Verificar si input está siendo mantenido presionado
; Input: A = entity ID, B = input bit
; Output: Zero flag set if button is currently held
input_is_held:
    push hl
    push de

    ; Get current input state
    ld hl, input_current
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)                 ; E = current state

    ; Create bit mask
    ld a, 1
    ld d, b                    ; Bit position
create_mask:
    ld a, d
    or a
    jr z, mask_ready
    sla a                      ; Shift left
    dec d
    jr create_mask

mask_ready:
    ld d, a                    ; D = bit mask

    ; Check if bit is set
    ld a, e
    and d
    ; Zero flag will be clear if bit is set (held)

    pop de
    pop hl
    ret

; Obtener estado completo de input de entidad
; Input: A = entity ID
; Output: B = current input, C = previous input
get_entity_input:
    push hl
    push de

    ; Get current input
    ld hl, input_current
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = current input

    ; Get previous input
    ld hl, input_previous
    add hl, de
    ld c, (hl)                 ; C = previous input

    pop de
    pop hl
    ret

; ==================================================================
; FUNCIONES DE UTILIDAD
; ==================================================================

; Verificar si entidad A tiene componente B
; Input: A = entity ID, B = component mask
; Output: Zero flag set if entity has component
entity_has_component:
    cp MAX_ENTITIES
    jr nc, entity_invalid      ; Invalid ID

    push hl
    push de

    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)                 ; Get entity mask
    and b                      ; Check if has component

    pop de
    pop hl
    ret

entity_invalid:
    xor a                      ; Clear zero flag
    or 1
    ret

; Obtener posición de entidad A
; Input: A = entity ID
; Output: B = X position, C = Y position
get_entity_position:
    push hl
    push de

    ; Get X position
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = X position (8-bit)

    ; Get Y position
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                 ; C = Y position (8-bit)

    pop de
    pop hl
    ret

; Establecer posición de entidad A
; Input: A = entity ID, B = X position, C = Y position
set_entity_position:
    push hl
    push de

    ; Set X position
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), b                 ; Store X position (8-bit)

    ; Set Y position
    ld hl, entity_y_pos
    add hl, de
    ld (hl), c                 ; Store Y position (8-bit)

    pop de
    pop hl
    ret

; ==================================================================
; SISTEMA DE INICIALIZACIÓN COMPLETO
; ==================================================================

; Inicializar todo el sistema ECS
init_components:
    ; Clear all entity component masks
    ld hl, entity_comp_masks
    ld de, entity_comp_masks + 1
    ld bc, MAX_ENTITIES - 1
    ld (hl), 0
    ldir

    ; TODO: Initialize component pools if using pooled allocation

    ret

; ==================================================================
; END OF COMPONENTES.ASM
; ==================================================================