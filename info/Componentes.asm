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
CREATE_ENTITY:
    PUSH HL
    PUSH BC
    PUSH DE

    ; Buscar slot libre en entity_comp_masks
    LD HL, entity_comp_masks
    LD D, 0                    ; Entity ID counter

create_entity_loop:
    LD A, (HL)                 ; Get component mask
    OR A                       ; Check if zero (free slot)
    JR Z, create_entity_found  ; Found free slot

    INC HL                     ; Next entity
    INC D                      ; Increment ID
    LD A, D
    CP MAX_ENTITIES
    JR C, create_entity_loop   ; Continue if not at limit

    ; No free slots
    XOR A                      ; Return 0 (failed)
    JR create_entity_exit

create_entity_found:
    ; Set component mask
    LD (HL), B                 ; Set component mask

    ; Initialize component data based on mask
    LD A, D                    ; Entity ID in A
    BIT 0, B                   ; Check COMP_MASK_POSITION
    CALL NZ, INIT_ENTITY_POSITION

    BIT 1, B                   ; Check COMP_MASK_SPRITE
    CALL NZ, INIT_ENTITY_SPRITE

    BIT 2, B                   ; Check COMP_MASK_MOVEMENT
    CALL NZ, INIT_ENTITY_MOVEMENT

    BIT 3, B                   ; Check COMP_MASK_COLLISION
    CALL NZ, INIT_ENTITY_COLLISION

    BIT 4, B                   ; Check COMP_MASK_INPUT
    CALL NZ, INIT_ENTITY_INPUT

    BIT 5, B                   ; Check COMP_MASK_BEHAVIOR
    CALL NZ, INIT_ENTITY_BEHAVIOR

    BIT 6, B                   ; Check COMP_MASK_HEALTH
    CALL NZ, INIT_ENTITY_HEALTH

    BIT 7, B                   ; Check COMP_MASK_ANIMATION
    CALL NZ, INIT_ENTITY_ANIMATION

    LD A, D                    ; Return entity ID

create_entity_exit:
    POP DE
    POP BC
    POP HL
    RET

; Destruir entidad
; Input: A = entity ID
DESTROY_ENTITY:
    CP MAX_ENTITIES
    RET NC                     ; Invalid entity ID

    PUSH HL
    PUSH DE

    ; Clear component mask
    LD HL, entity_comp_masks
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Clear mask (mark as free)

    ; TODO: Clear component data if needed

    POP DE
    POP HL
    RET

; ==================================================================
; INICIALIZADORES DE COMPONENTES
; ==================================================================

; Inicializar componente POSITION para entidad A
INIT_ENTITY_POSITION:
    PUSH HL
    PUSH DE

    ; Initialize X position to 0
    LD HL, entity_x_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; X position (8-bit)

    ; Initialize Y position to 0
    LD HL, entity_y_pos
    ADD HL, DE
    LD (HL), 0                 ; Y position (8-bit)

    POP DE
    POP HL
    RET

; Inicializar componente SPRITE para entidad A
INIT_ENTITY_SPRITE:
    PUSH HL
    PUSH DE

    LD HL, sprite_pattern
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Pattern 0

    LD HL, sprite_color
    ADD HL, DE
    LD (HL), 15                ; White color

    LD HL, sprite_flags
    ADD HL, DE
    LD (HL), SPRITE_VISIBLE    ; Visible by default

    POP DE
    POP HL
    RET

; Inicializar componente MOVEMENT para entidad A
INIT_ENTITY_MOVEMENT:
    PUSH HL
    PUSH DE

    ; Clear velocity X
    LD HL, entity_vel_x
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Vel X (8-bit)

    ; Clear velocity Y
    LD HL, entity_vel_y
    ADD HL, DE
    LD (HL), 0                 ; Vel Y (8-bit)

    ; Clear acceleration X
    LD HL, entity_accel_x
    ADD HL, DE
    LD (HL), 0                 ; Accel X (8-bit)

    ; Clear acceleration Y
    LD HL, entity_accel_y
    ADD HL, DE
    LD (HL), 0                 ; Accel Y (8-bit)

    POP DE
    POP HL
    RET

; Inicializar componente COLLISION para entidad A
INIT_ENTITY_COLLISION:
    PUSH HL
    PUSH DE

    LD HL, collision_left
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Left offset

    LD HL, collision_top
    ADD HL, DE
    LD (HL), 0                 ; Top offset

    LD HL, collision_width
    ADD HL, DE
    LD (HL), 16                ; Default 16x16 bounding box

    LD HL, collision_height
    ADD HL, DE
    LD (HL), 16

    LD HL, collision_layer
    ADD HL, DE
    LD (HL), COLLISION_LAYER_ENEMY ; Default layer

    LD HL, collision_mask
    ADD HL, DE
    LD (HL), COLLISION_LAYER_PLAYER ; Collides with player

    POP DE
    POP HL
    RET

; Inicializar componente INPUT para entidad A
INIT_ENTITY_INPUT:
    PUSH HL
    PUSH DE

    LD HL, input_current
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; No input

    LD HL, input_previous
    ADD HL, DE
    LD (HL), 0                 ; No previous input

    LD HL, input_type
    ADD HL, DE
    LD (HL), INPUT_TYPE_KEYBOARD ; Default to keyboard control

    POP DE
    POP HL
    RET

; Inicializar componente BEHAVIOR para entidad A
INIT_ENTITY_BEHAVIOR:
    PUSH HL
    PUSH DE

    LD HL, behavior_type
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), BEHAVIOR_STATIC   ; Default static behavior

    LD HL, behavior_state
    ADD HL, DE
    LD (HL), 0                 ; State 0

    ; Clear timer
    LD HL, behavior_timer
    ADD HL, DE
    LD (HL), 0                 ; Timer (8-bit)

    POP DE
    POP HL
    RET

; Inicializar componente HEALTH para entidad A
INIT_ENTITY_HEALTH:
    PUSH HL
    PUSH DE

    LD HL, entity_health
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 3                 ; Default 3 health

    LD HL, entity_max_health
    ADD HL, DE
    LD (HL), 3                 ; Max 3 health

    LD HL, entity_invuln_timer
    ADD HL, DE
    LD (HL), 0                 ; No invulnerability

    LD HL, entity_health_flags
    ADD HL, DE
    LD (HL), 0                 ; No special flags

    POP DE
    POP HL
    RET

; Inicializar componente ANIMATION para entidad A
INIT_ENTITY_ANIMATION:
    PUSH HL
    PUSH DE

    LD HL, anim_sequence
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), 0                 ; Sequence 0

    LD HL, anim_frame
    ADD HL, DE
    LD (HL), 0                 ; Frame 0

    LD HL, anim_timer
    ADD HL, DE
    LD (HL), 0                 ; Timer 0

    LD HL, anim_speed
    ADD HL, DE
    LD (HL), 4                 ; 4 frames delay

    LD HL, anim_flags
    ADD HL, DE
    LD (HL), ANIM_FLAG_PLAYING ; Playing by default

    POP DE
    POP HL
    RET

; ==================================================================
; MOTORES DE COMPONENTES - Sistemas de actualización
; ==================================================================

; Motor del componente POSITION - Aplica velocidad a posición
UPDATE_POSITION_COMPONENT:
    PUSH HL
    PUSH BC
    PUSH DE

    LD HL, entity_comp_masks
    LD B, MAX_ENTITIES
    LD C, 0                    ; Entity counter

position_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_POSITION     ; Check if has position component
    JR Z, position_next_entity ; Skip if no position component

    ; Check if also has movement component
    LD A, (HL)
    AND COMP_MASK_MOVEMENT
    JR Z, position_next_entity ; Skip velocity if no movement

    ; Apply velocity to position
    LD A, C                    ; Entity ID
    CALL APPLY_VELOCITY_TO_POSITION

position_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity ID
    DJNZ position_update_loop

    POP DE
    POP BC
    POP HL
    RET

; Aplicar velocidad a posición de entidad A
APPLY_VELOCITY_TO_POSITION:
    PUSH HL
    PUSH DE
    PUSH BC

    ; Get current position X
    LD HL, entity_x_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD B, (HL)                 ; B = current X position

    ; Get velocity X
    LD HL, entity_vel_x
    ADD HL, DE
    LD C, (HL)                 ; C = velocity X (signed)

    ; Add velocity to position: B = B + C (8-bit arithmetic)
    LD A, B
    ADD A, C                   ; A = new X position

    ; Check bounds (0-255 for X)
    CP 0
    JR NC, x_not_negative
    LD A, 0                    ; Clamp to 0
x_not_negative:
    ; X can go to 255, no upper bound check needed for MSX

    ; Store new position X
    PUSH AF                    ; Save new X position
    LD HL, entity_x_pos
    LD E, A                    ; Entity ID (original A)
    LD D, 0
    ADD HL, DE
    POP AF                     ; Restore new X position
    LD (HL), A                 ; Store new X position

    ; Get current position Y
    LD HL, entity_y_pos
    ADD HL, DE
    LD B, (HL)                 ; B = current Y position

    ; Get velocity Y
    LD HL, entity_vel_y
    ADD HL, DE
    LD C, (HL)                 ; C = velocity Y (signed)

    ; Add velocity to position: B = B + C (8-bit arithmetic)
    LD A, B
    ADD A, C                   ; A = new Y position

    ; Check bounds (0-191 for Y)
    CP 0
    JR NC, y_not_negative
    LD A, 0                    ; Clamp to 0
y_not_negative:
    CP 192
    JR C, y_in_bounds
    LD A, 191                  ; Clamp to 191 (screen height)
y_in_bounds:

    ; Store new position Y
    LD HL, entity_y_pos
    ADD HL, DE
    LD (HL), A                 ; Store new Y position

    POP BC
    POP DE
    POP HL
    RET

; Motor del componente SPRITE - Actualiza sprites en VRAM
UPDATE_SPRITE_COMPONENT:
    PUSH HL
    PUSH BC
    PUSH DE

    LD HL, entity_comp_masks
    LD B, MAX_ENTITIES
    LD C, 0                    ; Entity counter

sprite_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_SPRITE       ; Check if has sprite component
    JR Z, sprite_next_entity   ; Skip if no sprite component

    ; Check if also has position component
    LD A, (HL)
    AND COMP_MASK_POSITION
    JR Z, sprite_next_entity   ; Skip if no position

    ; Update sprite at position
    LD A, C                    ; Entity ID
    CALL UPDATE_ENTITY_SPRITE_POSITION

sprite_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity ID
    DJNZ sprite_update_loop

    POP DE
    POP BC
    POP HL
    RET

; Actualizar posición del sprite de entidad A
UPDATE_ENTITY_SPRITE_POSITION:
    PUSH HL
    PUSH DE
    PUSH BC

    ; TODO: Get entity position and update sprite in VRAM
    ; This would involve writing to sprite attribute table

    POP BC
    POP DE
    POP HL
    RET

; Motor del componente INPUT - Actualiza input de entidades
UPDATE_INPUT_COMPONENT:
    PUSH HL
    PUSH BC
    PUSH DE

    ; Read different input sources
    CALL READ_JOYSTICK_STATE   ; Returns joystick state in A
    LD D, A                    ; Store joystick state
    CALL READ_KEYBOARD_STATE   ; Returns keyboard state in A
    LD E, A                    ; Store keyboard state

    LD HL, entity_comp_masks
    LD B, MAX_ENTITIES
    LD C, 0                    ; Entity counter

input_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_INPUT        ; Check if has input component
    JR Z, input_next_entity    ; Skip if no input component

    ; Store current input as previous
    PUSH HL
    LD HL, input_current
    LD A, C
    PUSH DE
    LD E, A
    LD D, 0
    ADD HL, DE
    LD A, (HL)                 ; Get current input

    ; Store as previous
    LD HL, input_previous
    ADD HL, DE
    LD (HL), A                 ; Store as previous
    POP DE
    POP HL

    ; Check input type for this entity
    PUSH HL
    LD HL, input_type
    LD A, C
    PUSH DE
    LD E, A
    LD D, 0
    ADD HL, DE
    LD A, (HL)                 ; Get input type
    POP DE
    POP HL

    CP INPUT_TYPE_PLAYER1
    JR Z, input_apply_joystick
    CP INPUT_TYPE_PLAYER2
    JR Z, input_apply_joystick
    CP INPUT_TYPE_KEYBOARD
    JR Z, input_apply_keyboard

    ; For AI and other types, skip input update
    JR input_next_entity

input_apply_joystick:
    ; Apply joystick state to this entity
    PUSH HL
    LD HL, input_current
    LD A, C
    PUSH DE
    LD E, A
    LD D, 0
    ADD HL, DE
    POP DE
    LD (HL), D                 ; Store joystick state
    POP HL
    JR input_next_entity

input_apply_keyboard:
    ; Apply keyboard state to this entity
    PUSH HL
    LD HL, input_current
    LD A, C
    PUSH DE
    LD E, A
    LD D, 0
    ADD HL, DE
    POP DE
    LD (HL), E                 ; Store keyboard state
    POP HL

input_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity ID
    DJNZ input_update_loop

    POP DE
    POP BC
    POP HL
    RET

; Leer estado del joystick
; Output: A = joystick state
READ_JOYSTICK_STATE:
    PUSH BC
    PUSH DE

    ; Read MSX joystick port 1
    LD A, 0                    ; Port 1
    CALL GTSTCK                ; BIOS call - returns direction in A
    LD B, A                    ; Store stick direction

    ; Convert GTSTCK directions to our bit format
    XOR A                      ; Clear result
    LD C, A                    ; C will hold our input state

    ; Check directions (GTSTCK returns 1-8 for directions, 0 for center)
    LD A, B
    CP 1                       ; UP
    JR NZ, check_upright
    LD A, C
    SET INPUT_BIT_UP, A
    LD C, A
    JR read_triggers

check_upright:
    LD A, B
    CP 2                       ; UP-RIGHT
    JR NZ, check_right
    LD A, C
    SET INPUT_BIT_UP, A
    SET INPUT_BIT_RIGHT, A
    LD C, A
    JR read_triggers

check_right:
    LD A, B
    CP 3                       ; RIGHT
    JR NZ, check_downright
    LD A, C
    SET INPUT_BIT_RIGHT, A
    LD C, A
    JR read_triggers

check_downright:
    LD A, B
    CP 4                       ; DOWN-RIGHT
    JR NZ, check_down
    LD A, C
    SET INPUT_BIT_DOWN, A
    SET INPUT_BIT_RIGHT, A
    LD C, A
    JR read_triggers

check_down:
    LD A, B
    CP 5                       ; DOWN
    JR NZ, check_downleft
    LD A, C
    SET INPUT_BIT_DOWN, A
    LD C, A
    JR read_triggers

check_downleft:
    LD A, B
    CP 6                       ; DOWN-LEFT
    JR NZ, check_left
    LD A, C
    SET INPUT_BIT_DOWN, A
    SET INPUT_BIT_LEFT, A
    LD C, A
    JR read_triggers

check_left:
    LD A, B
    CP 7                       ; LEFT
    JR NZ, check_upleft
    LD A, C
    SET INPUT_BIT_LEFT, A
    LD C, A
    JR read_triggers

check_upleft:
    LD A, B
    CP 8                       ; UP-LEFT
    JR NZ, read_triggers
    LD A, C
    SET INPUT_BIT_UP, A
    SET INPUT_BIT_LEFT, A
    LD C, A

read_triggers:
    ; Read trigger buttons
    LD A, 0                    ; Port 1
    CALL GTTRIG                ; Get trigger state (returns #FF if pressed, 0 if not)
    OR A
    JR Z, no_trigger_a
    LD A, C
    SET INPUT_BIT_FIRE1, A     ; Set FIRE1 for trigger A
    LD C, A

no_trigger_a:
    ; For MSX2+, there might be a second trigger
    ; For now, we'll skip FIRE2 from joystick

    LD A, C                    ; Return final input state
    POP DE
    POP BC
    RET

; Leer estado del teclado (cursores + espacio + control)
; Output: A = keyboard state
READ_KEYBOARD_STATE:
    PUSH BC
    PUSH DE
    PUSH HL

    XOR A                      ; Clear result
    LD C, A                    ; C will hold our input state

    ; Read cursor keys - Row 8 of keyboard matrix
    LD A, 8                    ; Keyboard row 8
    CALL SNSMAT                ; BIOS call to read keyboard matrix
    LD B, A                    ; Store row 8 state

    ; Check cursor keys (row 8)
    ; Bit 4 = RIGHT cursor
    BIT 4, B
    JR NZ, check_left_cursor
    LD A, C
    SET INPUT_BIT_RIGHT, A
    LD C, A

check_left_cursor:
    ; Bit 5 = LEFT cursor
    BIT 5, B
    JR NZ, check_down_cursor
    LD A, C
    SET INPUT_BIT_LEFT, A
    LD C, A

check_down_cursor:
    ; Bit 6 = DOWN cursor
    BIT 6, B
    JR NZ, check_up_cursor
    LD A, C
    SET INPUT_BIT_DOWN, A
    LD C, A

check_up_cursor:
    ; Bit 7 = UP cursor
    BIT 7, B
    JR NZ, check_space
    LD A, C
    SET INPUT_BIT_UP, A
    LD C, A

check_space:
    ; Read space key - Row 8, bit 0
    BIT 0, B
    JR NZ, check_control
    LD A, C
    SET INPUT_BIT_FIRE1, A     ; Space = FIRE1
    LD C, A

check_control:
    ; Read CTRL key - Row 6, bit 2
    LD A, 6                    ; Keyboard row 6
    CALL SNSMAT                ; Read row 6
    BIT 2, A                   ; CTRL key
    JR NZ, keyboard_done
    LD A, C
    SET INPUT_BIT_FIRE2, A     ; CTRL = FIRE2
    LD C, A

keyboard_done:
    LD A, C                    ; Return final input state
    POP HL
    POP DE
    POP BC
    RET

; Motor del componente COLLISION - Detecta colisiones
UPDATE_COLLISION_COMPONENT:
    PUSH HL
    PUSH BC
    PUSH DE

    LD HL, entity_comp_masks
    LD B, MAX_ENTITIES
    LD C, 0                    ; Entity counter

collision_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_COLLISION    ; Check if has collision component
    JR Z, collision_next_entity ; Skip if no collision component

    ; Check collision against all other entities
    LD A, C                    ; Entity ID
    CALL CHECK_ENTITY_COLLISIONS

collision_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity ID
    DJNZ collision_update_loop

    POP DE
    POP BC
    POP HL
    RET

; Verificar colisiones de entidad A con todas las demás
CHECK_ENTITY_COLLISIONS:
    PUSH HL
    PUSH BC
    PUSH DE

    ; TODO: Implement collision detection between entities
    ; This would check bounding boxes and collision layers/masks

    POP DE
    POP BC
    POP HL
    RET

; Motor del componente BEHAVIOR - Ejecuta IA de entidades
UPDATE_BEHAVIOR_COMPONENT:
    PUSH HL
    PUSH BC
    PUSH DE

    LD HL, entity_comp_masks
    LD B, MAX_ENTITIES
    LD C, 0                    ; Entity counter

behavior_update_loop:
    LD A, (HL)                 ; Get entity component mask
    AND COMP_MASK_BEHAVIOR     ; Check if has behavior component
    JR Z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior for this entity
    LD A, C                    ; Entity ID
    CALL EXECUTE_ENTITY_BEHAVIOR

behavior_next_entity:
    INC HL                     ; Next entity
    INC C                      ; Next entity ID
    DJNZ behavior_update_loop

    POP DE
    POP BC
    POP HL
    RET

; Ejecutar comportamiento de entidad A
EXECUTE_ENTITY_BEHAVIOR:
    PUSH HL
    PUSH DE

    ; Get behavior type
    LD HL, behavior_type
    LD E, A
    LD D, 0
    ADD HL, DE
    LD E, (HL)                 ; E = behavior type

    ; Branch to appropriate behavior handler
    LD A, E
    CP BEHAVIOR_STATIC
    JR Z, behavior_static
    CP BEHAVIOR_PATROL
    JR Z, behavior_patrol
    ; TODO: Add other behavior types
    JR behavior_done

behavior_static:
    ; Do nothing - entity doesn't move
    JR behavior_done

behavior_patrol:
    ; TODO: Implement patrol behavior
    ; Move left and right, change direction at boundaries
    JR behavior_done

behavior_done:
    POP DE
    POP HL
    RET

; ==================================================================
; UTILIDADES DE INPUT - Funciones auxiliares para manejo de input
; ==================================================================

; Verificar si input está recién presionado (edge detection)
; Input: A = entity ID, B = input bit
; Output: Zero flag set if button was just pressed this frame
INPUT_JUST_PRESSED:
    PUSH HL
    PUSH DE
    PUSH BC

    ; Get current input state
    LD HL, input_current
    LD E, A
    LD D, 0
    ADD HL, DE
    LD C, (HL)                 ; C = current state

    ; Get previous input state
    LD HL, input_previous
    ADD HL, DE
    LD E, (HL)                 ; E = previous state

    ; Check if bit is set in current but not in previous
    LD A, 1
    LD D, B                    ; Bit position
check_bit_position:
    LD A, D
    OR A
    JR Z, bit_ready
    SLA A                      ; Shift left
    DEC D
    JR check_bit_position

bit_ready:
    LD D, A                    ; D = bit mask

    ; Check current state
    LD A, C
    AND D                      ; A = current & mask
    JR Z, not_pressed_now      ; Not pressed now = not just pressed

    ; Check previous state
    LD A, E
    AND D                      ; A = previous & mask
    JR NZ, was_pressed_before  ; Was pressed before = not just pressed

    ; Button was just pressed
    XOR A                      ; Set zero flag
    JR input_just_pressed_exit

not_pressed_now:
was_pressed_before:
    ; Button was not just pressed
    OR 1                       ; Clear zero flag

input_just_pressed_exit:
    POP BC
    POP DE
    POP HL
    RET

; Verificar si input está siendo mantenido presionado
; Input: A = entity ID, B = input bit
; Output: Zero flag set if button is currently held
INPUT_IS_HELD:
    PUSH HL
    PUSH DE

    ; Get current input state
    LD HL, input_current
    LD E, A
    LD D, 0
    ADD HL, DE
    LD E, (HL)                 ; E = current state

    ; Create bit mask
    LD A, 1
    LD D, B                    ; Bit position
create_mask:
    LD A, D
    OR A
    JR Z, mask_ready
    SLA A                      ; Shift left
    DEC D
    JR create_mask

mask_ready:
    LD D, A                    ; D = bit mask

    ; Check if bit is set
    LD A, E
    AND D
    ; Zero flag will be clear if bit is set (held)

    POP DE
    POP HL
    RET

; Obtener estado completo de input de entidad
; Input: A = entity ID
; Output: B = current input, C = previous input
GET_ENTITY_INPUT:
    PUSH HL
    PUSH DE

    ; Get current input
    LD HL, input_current
    LD E, A
    LD D, 0
    ADD HL, DE
    LD B, (HL)                 ; B = current input

    ; Get previous input
    LD HL, input_previous
    ADD HL, DE
    LD C, (HL)                 ; C = previous input

    POP DE
    POP HL
    RET

; ==================================================================
; FUNCIONES DE UTILIDAD
; ==================================================================

; Verificar si entidad A tiene componente B
; Input: A = entity ID, B = component mask
; Output: Zero flag set if entity has component
ENTITY_HAS_COMPONENT:
    CP MAX_ENTITIES
    JR NC, entity_invalid      ; Invalid ID

    PUSH HL
    PUSH DE

    LD HL, entity_comp_masks
    LD E, A
    LD D, 0
    ADD HL, DE
    LD A, (HL)                 ; Get entity mask
    AND B                      ; Check if has component

    POP DE
    POP HL
    RET

entity_invalid:
    XOR A                      ; Clear zero flag
    OR 1
    RET

; Obtener posición de entidad A
; Input: A = entity ID
; Output: B = X position, C = Y position
GET_ENTITY_POSITION:
    PUSH HL
    PUSH DE

    ; Get X position
    LD HL, entity_x_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD B, (HL)                 ; B = X position (8-bit)

    ; Get Y position
    LD HL, entity_y_pos
    ADD HL, DE
    LD C, (HL)                 ; C = Y position (8-bit)

    POP DE
    POP HL
    RET

; Establecer posición de entidad A
; Input: A = entity ID, B = X position, C = Y position
SET_ENTITY_POSITION:
    PUSH HL
    PUSH DE

    ; Set X position
    LD HL, entity_x_pos
    LD E, A
    LD D, 0
    ADD HL, DE
    LD (HL), B                 ; Store X position (8-bit)

    ; Set Y position
    LD HL, entity_y_pos
    ADD HL, DE
    LD (HL), C                 ; Store Y position (8-bit)

    POP DE
    POP HL
    RET

; ==================================================================
; SISTEMA DE INICIALIZACIÓN COMPLETO
; ==================================================================

; Inicializar todo el sistema ECS
INIT_COMPONENTS:
    ; Clear all entity component masks
    LD HL, entity_comp_masks
    LD DE, entity_comp_masks + 1
    LD BC, MAX_ENTITIES - 1
    LD (HL), 0
    LDIR

    ; TODO: Initialize component pools if using pooled allocation

    RET

; ==================================================================
; END OF COMPONENTES.ASM
; ==================================================================