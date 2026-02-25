# Session Context - 2026-02-24

## Objetivo
Mover rutinas críticas a VBlank para mejorar suavidad de sprites hardware y mantener input instantáneo.

## Estado validado
- `unitedCompressedFiles(9).asm` compilado correctamente.
- `unitedCompressedFiles(9).rom` generado y padded a múltiplo de 8KB.
- OpenMSX ejecutado con esa ROM.

## Cambios clave aplicados en generador
1. ISR: solo actualiza sprites (`task_update_sprites`) para estabilidad temporal.
2. Input: `task_update_input` vuelve al game loop principal para reacción rápida.
3. Doble ejecución de state machine corregida:
   - `update_all_entities` ya no llama `update_statemachine_component` cuando existe gameflow.
4. Lectura de input directa (sin BIOS) añadida:
   - `FAST_GTTRIG`
   - `FAST_SNSMAT`
   - `task_update_input` usa `FAST_GTSTCK/FAST_GTTRIG/FAST_SNSMAT`.

## Archivos del repo tocados
- `utils/msxGenerator/generators/headerGenerator.ts`
- `utils/msxGenerator/generators/gameFlowGenerator.ts`
- `utils/msxGenerator/generators/componentsGenerator.ts`
- `utils/msxGenerator/generators/directHardwareGenerator.ts`
- `utils/msxGenerator/generators/interruptGenerator.ts`
- `dist/assets/msx-utils-cyWldM_q.js` (bundle de UI parcheado para reflejar correcciones)

## Próximo paso sugerido al retomar
1. Regenerar ASM desde UI (Generate + Compress + Compile + Mapper).
2. Verificar que el ASM generado mantiene:
   - ISR solo sprites
   - input en game loop
   - no duplicado de state machine
3. Compilar + ejecutar en OpenMSX y comparar suavidad vs ROM referencia.
