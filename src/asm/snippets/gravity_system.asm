
ifdef USE_GRAVITY_SYSTEM

; -----------------------------------------------------------------------------
; ApplyGravitySystem
; 
; Aplica una aceleración de gravedad a todas las entidades que poseen
; los componentes GRAVITY y VELOCITY.
;
; Supuestos:
; - Las máscaras de componentes están en EntityComponentMasks.
; - Los datos de las entidades (incluida la velocidad) están en EntityData.
; - La velocidad Y es el primer byte de los datos de una entidad.
; - Las constantes GRAVITY_COMPONENT_MASK, VELOCITY_COMPONENT_MASK, 
;   MAX_ENTITIES y SIZEOF_ENTITY_DATA están definidas en otro lugar.
; -----------------------------------------------------------------------------

ApplyGravitySystem:
    ld      hl, EntityComponentMasks ; Puntero a las máscaras de componentes
    ld      ix, EntityData           ; Puntero a los datos de las entidades
    ld      b, MAX_ENTITIES          ; Número de entidades a procesar

ApplyGravityLoop:
    push    bc
    push    hl

    ; Comprobar si la entidad actual tiene los componentes requeridos
    ld      a, (hl)
    and     GRAVITY_COMPONENT_MASK | VELOCITY_COMPONENT_MASK
    cp      GRAVITY_COMPONENT_MASK | VELOCITY_COMPONENT_MASK
    jr      nz, .no_gravity_on_entity

    ; Aplicar aceleración de gravedad a la velocidad Y
    ; Asumiendo que la velocidad Y (velocity.y) es el primer byte de datos de la entidad
    ld      c, (ix)     ; Cargar velocidad Y actual
    ld      a, c
    add     a, GRAVITY_ACCELERATION
    ld      (ix), a     ; Guardar nueva velocidad Y

.no_gravity_on_entity:
    inc     hl          ; Apuntar a la máscara de la siguiente entidad
    add     ix, SIZEOF_ENTITY_DATA ; Apuntar a los datos de la siguiente entidad
    
    pop     hl
    pop     bc
    djnz    ApplyGravityLoop

    ret

endif
