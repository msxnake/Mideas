# Investigacion State Machine (MSX ASM)
Fecha: 2026-02-22

## Contexto
Analisis del generador ASM de State Machine en:
- `utils/msxGenerator/generators/stateMachineGenerator.ts`
- `utils/msxGenerator/generators/componentsGenerator.ts`
- `statemachine.types.ts`

## Resultado Fase 1 (auditoria de cobertura)
- Actions totales: 35
- Actions `OK`: 20
- Actions `runtime stub`: 9
- Actions `serializer mismatch`: 6
- Conditions totales: 15
- Conditions `OK`: 13
- Conditions `missing wiring`: 1 (`XOR`)
- Conditions `runtime stub`: 1 (`ANIMATION_COMPLETE`) antes de Fase 2

### Actions runtime stub detectadas
- `PLAY_SOUND`
- `PLAY_MUSIC`
- `MUTE_MUSIC`
- `STOP_MUSIC`
- `SPAWN_ENTITY` (parcial / TODO)
- `GET_RANDOM_ENTITY_POSITION`
- `DECREASE_LIVES`
- `INCREASE_LIVES`
- `RESPAWN_PLAYER`

### Actions con serializer mismatch detectadas
- `SET_COMPONENT_PROPERTY`
- `CHANGE_GAME_FLOW_NODE`
- `BREAK_TILE`
- `REPLACE_TILE`
- `RND`
- `POINT_AT`

### Condition missing wiring detectada
- `XOR` (existe en tipos, no en mapping/tabla runtime)

## Resultado Fase 2 (implementado hoy)
Se implemento `ANIMATION_COMPLETE` en ASM runtime.

### Cambios aplicados
1. `componentsGenerator`:
- Se agrega flag `ANIM_FLAG_COMPLETED = #08`.
- En overflow de animacion no-loop (`.clamp_last`):
  - set bit 3 (`ANIM_FLAG_COMPLETED`)
  - clear bit 0 (`ANIM_FLAG_PLAYING`)

2. `stateMachineGenerator`:
- `Condition_AnimComplete` implementada:
  - lee bit 3 en `entity_anim_flags`
  - devuelve true si activo
  - consume el evento (clear bit 3) para semantica one-shot
- Limpieza de `ANIM_FLAG_COMPLETED` cuando se reinicia animacion en:
  - `Action_ChangeSprite`
  - `Action_PlayAnimation`
  - `Action_ToggleAnim` (al pasar a play)
- Se agrega `case ConditionTypes.ANIMATION_COMPLETE` en `generateConditionBytes` (sin params).

### Verificacion
- `npm run build` OK.
- Re-auditoria: `ANIMATION_COMPLETE` deja de aparecer como runtime stub.

## Estado actual para retomar manana
Pendientes principales:
1. Implementar wiring de `XOR` en condiciones.
2. Resolver 6 `serializer mismatch` (riesgo de desalineacion HL).
3. Implementar/decidir stub actions restantes (audio, vidas, respawn, random pos, spawn completo).

## Siguiente fase recomendada (Fase 3)
1. `XOR`: mapping + tabla + handler runtime + serializer.
2. Corregir serializer/runtime de:
   - `SET_COMPONENT_PROPERTY`
   - `CHANGE_GAME_FLOW_NODE`
   - `BREAK_TILE`
   - `REPLACE_TILE`
   - `RND`
   - `POINT_AT`
3. Repetir auditoria y validar con proyecto real (`patoantic12_autosave(8).json`).

