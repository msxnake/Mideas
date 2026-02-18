# Memoria de sesión: Collision ASM liviano
Fecha: 2026-02-17

## Estado implementado
- Collision entidad-entidad ASM liviano agregado en generadores.
- Frecuencia: cada 2 frames (`interrupt_counter & 1`).
- Scope fuente: solo entidades con `collisionLayer & 1 != 0` (jugador).
- Clasificación fija:
  - `enemy` layer mask = `2`
  - `item` layer mask = `16`
- Latching: en frame skip conserva último resultado.
- Primer hit por fuente: guarda solo una entidad en `entity_last_collision_entity`.

## Cambios realizados
- `utils/msxGenerator/generators/variablesGenerator.ts`
  - Añadidos `temp_byte_19..temp_byte_24`.
- `utils/msxGenerator/generators/componentsGenerator.ts`
  - Nuevos arrays/equ:
    - `entity_collision_hitbox_w/h`
    - `entity_collision_offset_x/y`
    - `entity_entity_collision_flags`
    - `entity_last_collision_entity`
  - `init_collision_system` inicializa defaults y limpia flags.
  - Nueva rutina `update_entity_collision_fast`.
- `utils/msxGenerator/generators/entitiesGenerator.ts`
  - Carga `comp_collision` (defaults + overrides) en init de entidad.
- `utils/msxGenerator/generators/stateMachineGenerator.ts`
  - `HAS_COLLISION` real para `any/wall/enemy/item`.
  - `DESTROY_ENTITY target=other` implementado.
  - Eliminado fallback `enemy/item -> any`.
- `components/editors/statemachine/ConditionBuilder.tsx`
  - Rehabilitado selector `any/enemy/item/wall`.
  - Nota ROM vs Preview actualizada.

## Nota importante
- Preview (`GameFlowPreview`) se dejó sin cambios por decisión explícita.
- Puede haber diferencia Preview vs ROM para `enemy/item`.

## Cómo continuar mañana (pato26.json)
1. Configurar capas en entidades:
   - Player: `collisionLayer=1`, `collidesWith=18`
   - Enemy: `collisionLayer=2`, `collidesWith=1`
   - Item: `collisionLayer=16`, `collidesWith=1`
2. En la FSM del jugador:
   - transición `HAS_COLLISION enemy` (reacción daño)
   - transición `HAS_COLLISION item` + `DESTROY_ENTITY target=other`
3. Compilar ROM y validar en OpenMSX.

## Validación previa hecha
- Se generó y compiló ROM de prueba con collision activo (`game.json`) sin errores de Glass.
- Se verificó presencia de `update_entity_collision_fast` y símbolos nuevos en ASM unificado.
