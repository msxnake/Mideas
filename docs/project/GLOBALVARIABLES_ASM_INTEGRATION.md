# GlobalVariables ASM Integration - Documentación Completa

## 📋 Resumen

El sistema de **GlobalVariables** está completamente integrado en Mideas MSX, permitiendo:
- ✅ Editor UI para crear/editar variables globales custom
- ✅ Merge automático de variables default + custom
- ✅ Uso en **StateMachine Actions** (SET_VARIABLE, INCREMENT_VARIABLE, DECREMENT_VARIABLE)
- ✅ Uso en **StateMachine Guards** (condiciones de transición)
- ✅ Uso en **GameFlow IfThenElse** nodes (condiciones de flujo)
- ✅ **Generación ASM automática** para ROM MSX

---

## 🎯 Estado de Implementación

### ✅ **Completado**

#### 1. **Editor UI** ([GlobalVariablesEditor.tsx](../../../components/editors/GlobalVariablesEditor.tsx))
- Panel de lista de variables (izquierda)
- Editor de propiedades (derecha)
- Auto-generación de `asmName` y `constantPrefix`
- Soporte para tipos 8-bit y 16-bit
- Categorías: objective, score, player, inventory, progress, time, difficulty, special
- Edición de valores posibles (labels + valores numéricos + constantes ASM)

#### 2. **Utilities** ([globalVariablesUtils.ts](../../../utils/globalVariablesUtils.ts))
- `getAllGlobalVariables(assets)`: Merge de defaults + custom
- `getGlobalVariableByName(assets, name)`: Búsqueda por nombre

#### 3. **Types**
- `GlobalVariablesAsset` interface en [types.ts](../../../types.ts#L1095)
- `MideasGlobalVariable` interface en [constants.ts](../../../constants.ts#L610)
- `ProjectAnalysis.globalVariables` en [asmTypes.ts](../../../utils/msxGenerator/types/asmTypes.ts#L131)

#### 4. **StateMachine Actions UI** ([ActionParamsEditor.tsx](../../../components/editors/statemachine/ActionParamsEditor.tsx))
- **SET_VARIABLE**: Dropdown de variables + dropdown de valores
- **INCREMENT_VARIABLE**: Dropdown de variables + input de cantidad
- **DECREMENT_VARIABLE**: Dropdown de variables + input de cantidad

#### 5. **StateMachine Guards UI** ([TransitionGuardEditor.tsx](../../../components/editors/TransitionGuardEditor.tsx))
- Selección de GlobalVariables asset
- Dropdown de variables agrupadas por categoría
- Operadores: ==, !=, >, <, >=, <=
- Dropdown de valores predefinidos o input numérico
- Preview de condición: `IF variableName operator value`

#### 6. **ASM Generation**

##### **variables.asm** ([variablesGenerator.ts](../../../utils/msxGenerator/generators/variablesGenerator.ts#L42-L63))
```asm
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
global_var_goal      EQU #C004   ; Current objective status (8-bit)
global_var_lives     EQU #C00E   ; Remaining lives (0-255) (8-bit)
global_var_health    EQU #C00F   ; Current health (0-255) (8-bit)
global_var_score     EQU #C009   ; Current player score (0-65535) (16-bit)
```

**Características:**
- Asignación automática de direcciones de memoria (EQU)
- Soporte para 8-bit (1 byte) y 16-bit (2 bytes)
- Comentarios descriptivos
- Respeta orden: defaults primero, custom después

##### **constants.asm** ([constantsGenerator.ts](../../../utils/msxGenerator/generators/constantsGenerator.ts#L14-L49))
```asm
; ==================================================================
; MIDEAS GLOBAL VARIABLES - CONSTANTS FOR VALUES
; ==================================================================

; Goal - Current objective status
GOAL_FAILURE            EQU 0    ; Goal = "Failure"
GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
GOAL_PARTIAL            EQU 2    ; Goal = "Partial"

; Lives - Remaining lives
; (Sin constantes - valores numéricos libres 0-255)

; LevelCompleted - Level completion flag
BOOL_FALSE              EQU 0    ; LevelCompleted = "False"
BOOL_TRUE               EQU 1    ; LevelCompleted = "True"
```

**Características:**
- Genera constantes para cada valor predefinido
- Elimina duplicados automáticamente (e.g., `BOOL_FALSE`, `BOOL_TRUE`)
- Comentarios indican qué variable usa cada constante

##### **GameFlow IfThenElse Nodes** ([gameFlowGenerator.ts](../../../utils/msxGenerator/generators/gameFlowGenerator.ts#L156-L263))
```asm
gameflow_node_if_123:
    ; IfThenElse Node - Compare Goal == Completed
    ld a, (global_var_goal)     ; Load global variable Goal
    cp GOAL_COMPLETED            ; Compare with Completed
    jp z, gameflow_node_then_456 ; If equal, jump to THEN branch
    jp gameflow_node_else_789    ; Otherwise, jump to ELSE branch
```

**Soporta:**
- Operadores: ==, !=, >, <, >=, <=
- Constantes nombradas o valores numéricos
- Conversión automática de nombres a snake_case (`global_var_goal`)
- Generación de constantes automática (`GOAL_COMPLETED`)

---

### ⏳ **Pendiente de Implementación**

#### 1. **StateMachine Actions ASM Generation**
**Estado**: NO implementado aún

Las acciones SET_VARIABLE, INCREMENT_VARIABLE, DECREMENT_VARIABLE funcionan en el editor UI pero **no generan código ASM**.

**Archivo a modificar**: Probablemente necesitaríamos crear un generador de StateMachine transitions que procese las actions.

**Código esperado:**
```asm
; SET_VARIABLE: Goal = Completed
ld a, GOAL_COMPLETED
ld (global_var_goal), a

; INCREMENT_VARIABLE: Score += 100
ld hl, (global_var_score)  ; Load 16-bit variable
ld de, 100
add hl, de
ld (global_var_score), hl  ; Store back

; DECREMENT_VARIABLE: Lives -= 1
ld a, (global_var_lives)
dec a
ld (global_var_lives), a
```

#### 2. **StateMachine Guards ASM Generation**
**Estado**: NO implementado aún

Los guards funcionan en el editor UI pero **no generan código ASM** para las transitions.

**Código esperado:**
```asm
; Guard: IF Health > 0
transition_check_123:
    ld a, (global_var_health)
    cp 0
    jp z, transition_skip_123  ; Skip transition if health == 0
    ; Execute transition actions...
    jp transition_target_state
transition_skip_123:
    ret
```

#### 3. **HUD System Integration**
**Estado**: NO implementado

Aunque existe HUD Configuration Editor, no está integrado con GlobalVariables para mostrar valores en pantalla durante el juego.

**Funcionalidad esperada:**
- Seleccionar GlobalVariable en HUD element
- Renderizar valor actual en pantalla (HUD Display)
- Código ASM para actualizar HUD cuando variable cambia

---

## 📊 Ejemplo Completo: Proyecto con GlobalVariables

### **Proyecto: Platformer Game**

#### **Custom Variables:**
```json
{
  "name": "Lives",
  "asmName": "global_var_lives",
  "type": "8bit",
  "category": "player",
  "values": []  // Valores libres 0-255
}
```

#### **Generación ASM:**

**variables.asm:**
```asm
global_var_lives    EQU #C00E   ; Remaining lives (0-255) (8-bit)
```

**constants.asm:**
```asm
; (Sin constantes para Lives - valores numéricos libres)
```

#### **Uso en GameFlow:**
```asm
gameflow_node_check_lives:
    ; IfThenElse: Lives > 0
    ld a, (global_var_lives)
    cp 0
    jp z, gameflow_node_game_over  ; No lives left
    jp gameflow_node_continue      ; Still alive
```

---

## 🔧 Testing

### **Test Script** (ejecutado con proyecto `a1.json`)
```bash
npx tsx test_globalvars_asm.ts
```

### **Resultados:**
✅ **variables.asm**: Genera 18 variables globales (defaults de MIDEAS)
✅ **constants.asm**: Genera 14+ constantes sin duplicados
✅ **Sin errores** de compilación TypeScript
✅ **Análisis correcto**: `analysis.globalVariables` populated

---

## 📝 Archivos Modificados

### **Core Types:**
1. [asmTypes.ts](../../../utils/msxGenerator/types/asmTypes.ts) - Añadido `globalVariables: MideasGlobalVariable[]`
2. [asmTemplateGenerator.ts](../../../utils/asmTemplateGenerator.ts) - Añadido `globalVariables` a `ProjectAnalysis`

### **Generadores ASM:**
1. [variablesGenerator.ts](../../../utils/msxGenerator/generators/variablesGenerator.ts) - Genera EQU addresses
2. [constantsGenerator.ts](../../../utils/msxGenerator/generators/constantsGenerator.ts) - Genera constantes de valores
3. [gameFlowGenerator.ts](../../../utils/msxGenerator/generators/gameFlowGenerator.ts) - Usa variables en IfThenElse

### **Index & Analysis:**
1. [msxGenerator/index.ts](../../../utils/msxGenerator/index.ts) - Fallbacks con `globalVariables: []`

---

## 🚀 Próximos Pasos Recomendados

### **Alta Prioridad:**
1. ✅ **Implementar Actions ASM Generation** para StateMachine
   - Procesar `transition.actions[]` en generador
   - Generar SET_VARIABLE, INCREMENT_VARIABLE, DECREMENT_VARIABLE

2. **Implementar Guards ASM Generation** para StateMachine Transitions
   - Procesar `transition.guard` en generador
   - Generar comparaciones condicionales antes de transición

### **Media Prioridad:**
3. **HUD Integration**
   - Permitir seleccionar GlobalVariable en HUD elements
   - Generar código ASM para renderizar valores en HUD

4. **Documentación Usuario Final**
   - Tutorial de cómo crear GlobalVariables
   - Ejemplos de uso en StateMachine y GameFlow

### **Baja Prioridad:**
5. **Optimizaciones**
   - Detectar variables no usadas y excluir de generación ASM
   - Compactar direcciones de memoria (eliminar huecos)

---

## ✅ Conclusión

El sistema de **GlobalVariables** está **funcionalmente completo** para:
- Editor UI (crear, editar, borrar variables)
- Uso en UI (Actions, Guards, IfThenElse)
- **Generación ASM** (variables.asm + constants.asm)
- GameFlow IfThenElse ASM generation

**Falta implementar:**
- StateMachine Actions ASM generation
- StateMachine Guards ASM generation
- HUD system integration

**Paridad Play/ROM:**
- ✅ GameFlow IfThenElse: **Completa**
- ⏳ StateMachine Actions: **Pendiente**
- ⏳ StateMachine Guards: **Pendiente**
- ⏳ HUD Display: **Pendiente**
