# Bottlenecks Mem (ASM MSX)

Ultima actualizacion: 2026-03-05

## Nueva pasada 2026-03-08

Objetivo de esta pasada:

- rehacer la medicion con una ROM concreta y reproducible
- separar coste CPU, coste VRAM y coste de mapper
- revisar duplicidades entre `WallCollision`, `DeadlyTiles`, `TileInteraction` y `StateMachine`
- validar de nuevo las rutas activas tras los fixes recientes de deadly tiles

### Linea base propuesta

- Proyecto base: `patoantic165.json`
- ROM de profiling: generar una ROM dedicada desde el pipeline unificado
- Escena principal: `pan1`
- Casos de prueba:
  - heroe quieto
  - heroe corriendo
  - heroe sobre zona deadly
  - pantalla con enemigos activos
  - transicion de pantalla

### Hotspots a medir primero

- `execute_all_state_machines`
- `SM_Update`
- `SM_CheckTransitions`
- `update_collision_component`
- `update_wallcollision_component`
- `update_deadly_tiles_component`
- `check_tile_interaction`
- `update_animation_component`
- `update_sprite_component`
- `task_update_music` / `SM_UpdateSound`

### Sospechas actuales

- Hay posible trabajo redundante por frame entre:
  - `update_wallcollision_component`
  - `update_deadly_tiles_component`
  - `check_tile_interaction`

Las tres rutas consultan hitbox y behavior map en el mismo frame, y conviene medir si compensa fusionar parte del trabajo o al menos compartir caches.

- `execute_all_state_machines` sigue siendo candidato fuerte en escenas con muchas guards o transiciones `Any`.

- `update_animation_component` puede seguir teniendo coste alto por upload a VRAM, incluso aunque la logica de frame haya mejorado.

- `update_sprite_component` debe separarse en:
  - coste de preparar atributos en RAM
  - coste de escribir a VRAM

- Audio e ISR siguen pendientes de comparativa real contra carga del main loop.

### Orden de instrumentacion

1. Contador de entradas por sistema en `update_all_entities`
2. Marca de tiempo/coste acumulado por sistema caliente
3. Contadores de lecturas de behavior map
4. Contadores de escrituras VRAM por frame
5. Contadores de transiciones y condiciones evaluadas en state machine

### Criterio de esta pasada

- No optimizar nada antes de medir
- No mezclar fixes funcionales con profiling
- Cualquier microoptimizacion debe ir acompañada de metrica antes/despues

## Hecho

- `SM_Update` optimizado para eliminar acceso al stack con `IX` (`ld ix,0 / add ix,sp / ld a,(ix+9)`).
- El indice de entidad ahora se reutiliza desde `C` con `ld a,c`.
- Se eliminaron `push ix/pop ix` y un `push hl/pop hl` innecesario en esa ruta.
- `execute_all_state_machines` optimizado:
  - Se elimina `push bc/pop bc` por iteracion en la ruta sin `SM`.
  - Se usa `DE` para indexado de entidad y `push bc` solo antes de `call SM_Update`.
  - Se reemplaza `dec b + jp nz` por `djnz` en el bucle principal.
- `rebuild_used_entity_list` optimizado:
  - Se elimina `cp MAX_ENTITIES` por iteracion.
  - Se usa contador de slots en `B` + `djnz .rebuild_loop`.
  - Se mantiene `C` como indice de entidad para compatibilidad con `entity_job_should_run_c`.
- `SM_CheckTransitions` optimizado (camino condition=false):
  - `inc hl` x4 reemplazado por `ld de,4` + `add hl,de`.
  - Menor coste por transicion evaluada que no dispara.
- Polling VDP en `gameflow_world_game_loop` probado y descartado para esta build:
  - Se detecta lentitud alta en ejecución real con busy-wait.
  - Se revierte a `halt` como sincronía principal de frame.
- Variante sin `HALT` aplicada para pruebas:
  - Nuevo `wait_next_frame_tick` basado en `vblank_flag` (actualizado en ISR).
  - El loop espera el siguiente tick de VBlank sin leer `#99` en bucle directo.
  - Mantiene el scheduler/sonido del hook, evitando el coste del polling VDP duro.
 - Fix `#1` aplicado: `task_update_music` vuelve a llamar `music_update` (ademas de `SM_UpdateSound`).
- Fix `#2` aplicado: `update_all_entities` deja de forzar `rebuild_used_entity_list` cada frame y usa `ensure_used_entity_list_current`.
 - Fix `#4` aplicado:
   - `update_animation_component` ya no re-verifica `entity_active` ni `entity_screen_id/current_screen_id` al iterar `active_entity_list`.
   - `execute_all_state_machines` ya no re-verifica `entity_active` al iterar `active_entity_list`.
- Cambio aplicado en:
  - `utils/msxGenerator/generators/stateMachineGenerator.ts`
  - `utils/msxGenerator/generators/componentsGenerator.ts`
  - `utils/msxGenerator/generators/gameFlowGenerator.ts`
  - `C:\Users\salam\Downloads\unitedCompressedFiles(82).asm`
- Validado con compilacion `glass.jar` sin errores.

## Pendientes (cuellos por revisar)

- `execute_all_state_machines`: medir coste por entidad activa tras la optimizacion nueva.
- `rebuild_used_entity_list`: medir coste en frames con muchas entidades tras optimizacion nueva.
- `SM_CheckTransitions`: medir coste real tras optimizacion nueva en escenas con muchas guards.
- `gameflow_world_game_loop`: volver a evaluar VDP polling solo como modo opcional (no default), con profiling en OpenMSX.
- `gameflow_world_game_loop`: comparar `HALT` vs `wait_next_frame_tick` en OpenMSX (fluidez + audio + input latency).
- Fix `#10` aplicado:
  - `update_collision_component` deja de recalcular deadly tiles.
  - La deteccion deadly queda centralizada en `update_deadly_tiles_component`.
  - Se evita una segunda pasada de behavior-map por entidad en el mismo frame.
- Fix `#11` aplicado:
  - `update_sprite_component` deja de re-verificar `entity_screen_id/current_screen_id` al iterar `active_entity_list`.
  - `update_slash_component` deja de re-verificar pantalla al iterar la misma lista compacta.
- `#3` Job scheduler: corregir modulo por sustraccion + truncado a byte bajo de `interrupt_counter`.
- `#3` Job scheduler (parcialmente resuelto):
  - Corregido truncado a 8-bit: fallback ahora usa modulo de `interrupt_counter` de 16 bits.
  - Implementado con algoritmo de 16 iteraciones fijas (shift/subtract), evitando drift cada 256 frames.
  - Se mantiene fast-path para periodos potencia de 2.
- `#6` Animated tiles (parcialmente resuelto, variante segura):
  - `frame % frame_count` ahora tiene fast-path para `frame_count` potencia de 2 (`and count-1`).
  - `frame * bytes_per_frame` elimina `push/pop af` por iteracion usando contador en `B`.
- `#5/#6` Animated tiles VRAM: reducir DI largo y reemplazar bucles byte-a-byte por copias por bloque.
- `#7` ISR IX/IY: evaluar retirada solo tras auditar tareas que pudieran depender de preservacion de IX/IY.
- `#8` SM en frames off de job scheduler: definir politica (siempre SM o SM parcial) sin romper gameplay.
- `#9` Race PSG (main loop vs ISR): serializar acceso PSG entre `sfx_update` y `SM_UpdateSound`.

## Incidencias detectadas tras optimizacion

- Regresion en pantalla con 2 enemigos: desaparicion alternante al entrar en pantalla.
- Causa: `active_entity_list` cacheado por dirty-flag no es compatible con el filtro por job scheduler (depende del frame).
- Fix aplicado: revertir `update_all_entities` a `call rebuild_used_entity_list` por frame.

## Criterio de avance

- No tocar contratos de registros sin documentar clobbers/preservados.
- Cualquier optimizacion nueva debe compilar en `glass.jar` y mantener comportamiento.
