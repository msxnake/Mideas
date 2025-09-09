; =============================================================================
; FRAME TIMING SYSTEM FOR 60 FPS
; =============================================================================
; Sistema de timing preciso para mantener 60 FPS con control dinámico
; de entidades según el presupuesto de ciclos disponible por frame
; =============================================================================

; Constantes de timing
CYCLES_PER_FRAME    equ 59659      ; Ciclos disponibles por frame (~3.58MHz/60Hz)
SPRITE_UPDATE_COST  equ 150        ; Ciclos aproximados por sprite
ENTITY_UPDATE_COST  equ 200        ; Ciclos aproximados por entity
TARGET_FRAME_TIME   equ 59659      ; Tiempo objetivo por frame
MIN_ENTITIES        equ 5          ; Mínimo número de entidades
ABSOLUTE_MAX_ENTITIES equ 32       ; Máximo absoluto de entidades
ENTITY_SIZE         equ 16         ; Tamaño de cada estructura de entidad

; Variables de timing
cycle_count:        dw 0           ; Contador de ciclos actual
frame_time:         dw 0           ; Tiempo del frame anterior
active_entities:    db 20          ; Número actual de entidades activas
max_entities:       db 20          ; Máximo permitido dinámicamente

; =============================================================================
; MAIN FRAME LOOP
; =============================================================================
frame_start:
    ; Sincronizar con VSync
    call wait_vsync
    
    ; Resetear contador de ciclos
    ld hl, 0
    ld (cycle_count), hl
    
    ; Actualizar entidades con control de presupuesto
    call update_entities_with_budget
    
    ; Renderizar sprites
    call render_sprites
    
    ; Verificar si sobrepasamos el presupuesto
    ld hl, (cycle_count)
    ld de, CYCLES_PER_FRAME
    sbc hl, de
    jr c, frame_ok
    
    ; Reducir entidades si es necesario
    call reduce_entity_count
    
frame_ok:
    ; Ajustar número de entidades para próximo frame
    call adjust_entity_count
    jp frame_start

; =============================================================================
; UPDATE ENTITIES WITH BUDGET CONTROL
; =============================================================================
update_entities_with_budget:
    ld a, (active_entities)        ; Número actual de entidades
    ld b, a
    ld ix, entity_list
    
entity_loop:
    push bc
    
    ; Verificar presupuesto antes de procesar
    call check_cycle_budget
    jr nc, skip_entity             ; No hay presupuesto suficiente
    
    ; Procesar entidad
    call update_entity
    
    ; Sumar ciclos usados al contador
    ld hl, (cycle_count)
    ld de, ENTITY_UPDATE_COST
    add hl, de
    ld (cycle_count), hl
    
    ; Siguiente entidad
    ld de, ENTITY_SIZE
    add ix, de
    
skip_entity:
    pop bc
    djnz entity_loop
    ret

; =============================================================================
; CHECK CYCLE BUDGET
; =============================================================================
check_cycle_budget:
    ld hl, (cycle_count)
    ld de, ENTITY_UPDATE_COST
    add hl, de                     ; Ciclos si procesamos esta entidad
    
    ld de, CYCLES_PER_FRAME
    sbc hl, de                     ; Comparar con límite
    ret                            ; C flag = suficiente presupuesto

; =============================================================================
; ADJUST ENTITY COUNT DYNAMICALLY
; =============================================================================
adjust_entity_count:
    ld hl, (cycle_count)
    ld de, TARGET_FRAME_TIME
    sbc hl, de
    
    jr c, can_add_entities         ; Frame rápido, agregar más
    jr z, maintain_count           ; Frame perfecto
    
    ; Frame lento, reducir entidades
    ld a, (max_entities)
    dec a
    cp MIN_ENTITIES
    jr c, maintain_count
    ld (max_entities), a
    
    ; Ajustar también las entidades activas
    ld a, (active_entities)
    ld b, a
    ld a, (max_entities)
    cp b
    jr nc, maintain_count
    ld (active_entities), a
    ret
    
can_add_entities:
    ld a, (max_entities)
    inc a
    cp ABSOLUTE_MAX_ENTITIES
    jr nc, maintain_count
    ld (max_entities), a
    
    ; Intentar activar más entidades si hay disponibles
    ld a, (active_entities)
    ld b, a
    ld a, (max_entities)
    cp b
    jr c, maintain_count
    jr z, maintain_count
    
    ; Activar una entidad más si hay disponible en pool
    call try_activate_entity
    
maintain_count:
    ret

; =============================================================================
; REDUCE ENTITY COUNT (EMERGENCY)
; =============================================================================
reduce_entity_count:
    ld a, (active_entities)
    dec a
    cp MIN_ENTITIES
    ret c                          ; No reducir por debajo del mínimo
    
    ld (active_entities), a
    ld (max_entities), a
    ret

; =============================================================================
; HELPER FUNCTIONS (PLACEHOLDERS)
; =============================================================================

wait_vsync:
    ; Implementar sincronización con VSync
    ; Esperar hasta el inicio del frame
    ret

update_entity:
    ; Actualizar lógica de una entidad
    ; IX apunta a la estructura de la entidad
    ret

render_sprites:
    ; Renderizar todos los sprites activos
    ret

try_activate_entity:
    ; Intentar activar una entidad del pool
    ; Incrementar active_entities si es exitoso
    ret

; =============================================================================
; ENTITY STRUCTURE EXAMPLE
; =============================================================================
entity_list:
    ; Lista de entidades (ejemplo)
    ; Cada entidad: X(2), Y(2), VX(2), VY(2), Sprite(1), Flags(1), etc.
    defs ABSOLUTE_MAX_ENTITIES * ENTITY_SIZE

; =============================================================================
; PERFORMANCE MONITORING
; =============================================================================
get_frame_performance:
    ; Retorna el porcentaje de uso del frame
    ld hl, (cycle_count)
    ld de, CYCLES_PER_FRAME
    ; Calcular porcentaje (HL/DE * 100)
    ; Implementar división y multiplicación
    ret

; =============================================================================
; CONFIGURATION FUNCTIONS
; =============================================================================
set_target_entities:
    ; A = número objetivo de entidades
    cp MIN_ENTITIES
    ret c
    cp ABSOLUTE_MAX_ENTITIES
    ret nc
    ld (max_entities), a
    ret

get_performance_stats:
    ; Retorna estadísticas de rendimiento
    ld a, (active_entities)        ; A = entidades activas
    ld hl, (cycle_count)           ; HL = ciclos usados
    ret