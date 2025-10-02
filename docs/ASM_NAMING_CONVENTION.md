# ASM Naming Convention Guide

## Convención de Nombres en Código ASM

### Regla Principal

- **MAYÚSCULAS** → Constantes (valores EQU, IDs, configuraciones)
- **minúsculas** → Labels de rutinas, variables, saltos

### Ejemplos

#### ✅ Correcto

```asm
; Constantes en MAYÚSCULAS
CHGMOD    EQU #005F
SCREEN_ID EQU 0
SPRITE_ID_PLAYER EQU 1
TOTAL_SPRITES EQU 10

; Rutinas en minúsculas
init_rom:
    CALL init_screen
    CALL load_sprites
    RET

main_loop:
    CALL update_game
    CALL render_frame
    JP main_loop

; Variables en minúsculas
player_x:   DB 0
player_y:   DB 0
score:      DW 0
```

#### ❌ Incorrecto

```asm
; NO mezclar constantes y rutinas en MAYÚSCULAS
INIT_ROM:              ; ❌ Debería ser: init_rom:
    CALL INIT_SCREEN   ; ❌ Debería ser: init_screen
    RET

MAIN_LOOP:             ; ❌ Debería ser: main_loop:
    JP MAIN_LOOP       ; ❌ Debería ser: main_loop
```

## Archivos a Actualizar

Los siguientes archivos generan código ASM y deben seguir esta convención:

### 1. `utils/msxModularGenerator.ts` (Principal)

**Labels de rutinas a cambiar:**
- `INIT_ROM` → `init_rom`
- `MAIN_PROGRAM` → `main_program`
- `MAIN_LOOP` → `main_loop`
- `INIT_GAME_SYSTEMS` → `init_game_systems`
- `UPDATE_CURRENT_STATE` → `update_current_state`
- `RENDER_FRAME` → `render_frame`
- `LOAD_GAME_SCREEN` → `load_game_screen`
- `EXECUTE_GAMEFLOW_START` → `execute_gameflow_start`
- `EXECUTE_GAMEFLOW_NODE` → `execute_gameflow_node`
- `GAME_OVER` → `game_over`
- `PAUSE_GAME` → `pause_game`
- `CLEAR_ALL_SPRITES` → `clear_all_sprites`
- `FILLSCREEN` → `fillscreen`
- etc.

**Constantes que deben permanecer en MAYÚSCULAS:**
- `CHGMOD`, `CHGCLR`, `CLS`, `POSIT` (BIOS)
- `SCREEN0`, `SCREEN1`, `SCREEN2`
- `SPRITE_ID_XXX`, `SCREEN_ID_XXX`
- `TOTAL_SPRITES`, `TOTAL_SCREENS`
- `VDP_R0`, `VDP_R1`, etc.
- `FLOW_STATE_MAIN_MENU`, `FLOW_STATE_GAME`, etc.
- `TRANSPARENT`, `BLACK`, `WHITE`, etc. (colores)

### 2. `utils/z80CodeGenerator.ts`

Similar a msxModularGenerator.ts, actualizar labels de rutinas a minúsculas.

### 3. `utils/asmTemplateGenerator.ts`

Revisar templates y asegurar convención correcta.

### 4. `utils/stateMachineGenerator.ts`

Actualizar labels de estados y transiciones.

## Helper Functions Disponibles

```typescript
// Definidas en msxModularGenerator.ts (líneas 21-41)

toRoutineLabel(name)        // Convierte a minúsculas para rutinas
toConstantName(name)        // Mantiene MAYÚSCULAS para constantes
toAssetRoutineLabel(id, prefix)  // Asset ID → routine label
toAssetConstant(id, prefix)      // Asset ID → constant name
```

## Ejemplo de Uso en Generadores

```typescript
// Generar código con convención correcta
const asm = `
; === Constantes ===
${toConstantName('SCREEN_ID')}  EQU ${screenIndex}
${toConstantName('SPRITE_ID')}  EQU ${spriteIndex}

; === Rutinas ===
${toRoutineLabel('init_screen')}:
    LD A, ${toConstantName('SCREEN_ID')}
    CALL ${toRoutineLabel('load_screen')}
    RET

${toRoutineLabel('load_screen')}:
    ; Código de carga
    RET
`;
```

## Beneficios

1. **Claridad**: Fácil distinguir entre constantes y código ejecutable
2. **Convención estándar**: Sigue prácticas comunes en ASM Z80/MSX
3. **Debugging**: Más fácil identificar símbolos en debugger OpenMSX
4. **Mantenibilidad**: Código más legible y profesional

## Próximos Pasos

1. Actualizar `msxModularGenerator.ts` gradualmente
2. Aplicar cambios en exports ASM
3. Verificar compatibilidad con glass.jar
4. Actualizar tests si existen
5. Documentar en changelog

---

**Fecha de creación**: 2025-10-01
**Versión**: 1.0
**Estado**: Pendiente de implementación completa
