# PATOANTIC134 - Hook/Job/Register Audit (2026-03-05)

Fuente auditada:
- `C:\Users\salam\Downloads\patoantic134.json`
- ASM extraido: `C:\Users\salam\Downloads\patoantic134_unitedCompressedFiles_extracted.asm`

## 1) Plan de depuracion propuesto

1. Validar ritmo real del hook H.TIMI:
   - Confirmar que `interrupt_counter` sube 1 por VBlank.
   - Confirmar que no hay doble update de sistemas criticos por frame.
2. Medir carga por frame en `pan3`:
   - Contar coste de `update_all_entities`, `update_wallcollision_component`, `render_hud`.
   - Verificar si hay transiciones de pantalla disparadas de forma repetitiva.
3. Auditar scheduler `job`:
   - Verificar si `jobRate/jobEntry` del JSON llegan a ASM.
   - Verificar si existe filtrado por `entity_job_should_run_c`.
4. Auditar paradas de Hero:
   - Revisar rutinas que ponen `entity_vel_x/y` a 0.
   - Correlacionar cada parada con colision, transicion o clamp.
5. Auditar contratos de registros:
   - Revisar preservacion en ISR + tareas del hook.
   - Revisar clobbers declarados vs clobbers reales en rutas criticas.

## 2) Resultado rapido (hallazgos clave)

1. Hook H.TIMI esta instalado en rango correcto.
   - Install: `ld (#FD9F), #C3` y `ld (#FDA0), interrupt_dispatcher`.
   - Backup hook original en RAM: `old_htimi_hook EQU #D0FF`.
   - Referencias: `...extracted.asm:1514-1524`, `...:1266-1279`.

2. Numero de llamadas del hook por tick:
   - `interrupt_dispatcher` se ejecuta 1 vez por VBlank.
   - Itera 8 slots de `task_table`.
   - En esta build solo se habilitan 2 tareas por defecto:
     - slot 1: `task_update_sprites`
     - slot 4: `task_update_music`
   - Referencias: `...:149-155`, `...:1638-1677`, `...:2133-2181`.

3. `jobRate/jobEntry` del JSON NO se aplican en este ASM exportado.
   - En JSON (`patoantic134.json`) existen:
     - `pan3 -> pato3: jobRate=50, jobEntry=0`
     - `pan3 -> bola2: jobRate=50, jobEntry=1`
   - En ASM extraido no existen simbolos/llamadas:
     - no `entity_job_set`
     - no `entity_job_should_run_c`
     - no `entity_job_period/entity_job_entry`
   - Por tanto, `job` no afecta a ningun componente en esta ROM concreta.

4. Sistemas que pueden parar a Hero (poner velocidad a 0):
   - `check_world_screen_transition` (al cambiar pantalla) resetea `vel_x` y `vel_y`.
     - Referencias: `...:20823-20829`, `...:20874-20880`, `...:20922-20928`, `...:20973-20979`, `...:21014-21020`, `...:21058-21064`.
   - `update_wallcollision_component` cancela velocidad por eje al bloquear contra tiles.
     - Referencias: `...:5196-5199`, `...:5272-5274`, `...:5351-5353`, `...:5405-5407`, `...:5427-5429`, `...:5517-5519`.
   - Handlers de colision legacy (boundary/tile) tambien tienen rutas de stop:
     - Referencias: `...:3520-3525`, `...:3538-3543`.

5. Riesgo de consistencia: mismatch JSON vs ASM
   - El JSON tiene 2 entidades en `pan3` con `jobRate`.
   - El ASM exportado no implementa scheduler `job`.
   - Esto sugiere pipeline de export usado no alineado con el generador moderno del repo.

## 3) Hook: rango y contrato de registros

`interrupt_dispatcher` declara:
- Clobber: `AF, BC, HL`
- Preserve: `DE, IX, IY`
- Referencia: `...:1591-1612`

Implementacion real:
- Push/pop solo de `AF, HL, BC` en dispatcher.
- `DE` se preserva solo si las tareas llamadas lo preservan.
- `task_update_sprites` y `task_update_music` hacen push/pop de `AF,BC,DE,HL`.
- Referencias: `...:1618-1688`, `...:2133-2146`, `...:2169-2181`.

Conclusiones de contrato:
- Para esta build concreta, con esas 2 tareas, `DE` queda preservado.
- `IX/IY` no se guardan en wrappers de tarea; hoy no parecen tocarse en estas dos tareas concretas.
- Si se anaden tareas futuras que usen `IX/IY` sin guardar/restaurar, el contrato del dispatcher se rompe.

## 4) Componentes afectados por `job`

Estado actual (esta ROM):
- Ninguno, porque `job` no esta cableado en el ASM exportado.

Estado esperado (si `job` estuviera activo):
- El filtrado deberia ocurrir en la construccion de `active_entity_list`.
- Impactaria a todos los sistemas que consumen esa lista:
  - `update_input_component`
  - `update_entities`
  - `update_jump_component`
  - `update_cursors_component`
  - `update_gravity_component`
  - `update_position_component`
  - `update_collision_component`
  - `update_platform_riding`
  - `update_wallcollision_component`
  - `check_tile_interaction`
  - `update_animation_component`
  - `update_sprite_component`
  - `execute_all_state_machines`

## 5) Recomendacion tecnica inmediata

1. Exportar/compilar `patoantic134.json` con pipeline moderno (`utils/msxGenerator`) para que `job` exista en ASM final.
2. Repetir prueba en `pan3` midiendo:
   - frames con `interrupt_counter`
   - tiempo de `update_all_entities`
   - frecuencia real de transiciones de pantalla
3. Endurecer contrato del hook:
   - Guardar/restaurar `IX/IY` en dispatcher o en todas las tareas registrables por hook.
