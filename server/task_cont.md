● Ahora déjame verificar que no haya problemas con los cambios realizados.
    
● msx-asm-optimizer(Verify ASM code correctness)
  ⎿  Done (5 tool uses · 29.0k tokens · 1m 12s)                                                                                                                                                                            
                                                                                                                                                                                                                           
● La verificación del agente MSX-ASM confirmó que el código Z80 es correcto: sin bugs de registros, stack balanceado, instrucciones válidas, y edge cases manejados.
                                                                                                                                                                                                                             Resumen de los 3 fixes aplicados:                                                                                                                                                                                                                                                                                                                                                                                                                   
  Fix #1 — Sin animación (Bug #1)                                                                                                                                                                                          
                                                                                                                                                                                                                             Archivo: unifiedGenerator.ts línea 303                                                                                                                                                                                     Causa: update_game_state llamaba update_all_entities pero NO execute_all_state_machines. Sin la máquina de estados, el sprite del jugador se queda en hero_idle (1 frame) y nunca cambia a hero_running (3 frames).        Fix: Añadido call execute_all_state_machines después de call update_all_entities.                                                                                                                                                                                                                                                                                                                                                                   
  Fix #2 — Traspasa tiles sólidos (Bug #2)

  Archivo: componentsGenerator.ts función generateWallCollisionSystem()
  Causa: La wall collision solo ponía velocidad a 0 pero NO movía la entidad fuera de la pared. Como update_position corre ANTES de wall collision, la entidad ya estaba dentro de la pared.
  Fix: Reescritura completa con:
  - Snap-back de posición: Cuando se detecta colisión, la entidad se reposiciona al borde del tile sólido
  - 2 puntos de verificación por dirección (más robusto que 1 punto central)
  - Filtro por component mask: Solo procesa entidades con COMP_MASK_INPUT | COMP_MASK_MOVEMENT (evita procesar entidades estáticas con basura en RAM)
  - Edge cases: X=0, Y=0, X+16 overflow, Y+16 overflow

  Fix #3 — Se cuelga (Bug #3)

  Archivo: componentsGenerator.ts función get_behavior_tile (ya aplicado antes)
  Causa: Sin bounds checking, coordenadas fuera de rango leían memoria basura más allá del behavior map de 768 bytes.
  Fix: Bounds check: row < 24, column < 32, retorna 0 (passable) si fuera de rango.

  Regenera la ROM para probar los 3 fixes.